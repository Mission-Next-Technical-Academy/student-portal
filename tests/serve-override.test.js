// ISSUE-022: bin/serve.py --override swaps one file (the portal's
// supabase-config.js) while every other file is served live from the repo.
// Starts real serve.py processes on free local ports; no other network use.
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const PYTHON = process.env.PYTHON || 'python3';
const ROOT = path.join(__dirname, '..');
const SERVE = path.join(ROOT, 'bin', 'serve.py');
const PRODUCTION_REF = 'eokvngifirjgfozzbieu';

// serve.py run to completion: a refusal exits at once; a server that starts
// instead is killed by the timeout (status null).
function refuses(dir, extraArgs) {
  const res = spawnSync(PYTHON, [SERVE, '0', '--bind', '127.0.0.1', '--directory', dir, ...extraArgs],
    { encoding: 'utf8', timeout: 5000 });
  return { refused: res.status !== null && res.status !== 0, stderr: res.stderr };
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function get(port, urlPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function startServer(dir, extraArgs) {
  const port = await freePort();
  const child = spawn(PYTHON, [SERVE, String(port), '--bind', '127.0.0.1', '--directory', dir, ...extraArgs],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  for (let i = 0; i < 50; i += 1) {
    try {
      await get(port, '/');
      return { port, child };
    } catch {
      if (child.exitCode !== null) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  child.kill();
  throw new Error(`serve.py did not start: ${stderr}`);
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-override-test-'));
  const children = [];
  try {
    const site = path.join(tmp, 'site');
    fs.mkdirSync(site);
    fs.writeFileSync(path.join(site, 'supabase-config.js'), "const WHICH = 'repo';\n");
    fs.writeFileSync(path.join(site, 'other.js'), "const OTHER = 'live';\n");
    const swapped = path.join(tmp, 'generated-config.js');
    fs.writeFileSync(swapped, "const WHICH = 'swapped';\n");

    // 1. With --override: the swapped file, whatever the query string.
    const withOverride = await startServer(site, ['--override', `/supabase-config.js=${swapped}`]);
    children.push(withOverride.child);
    const p = withOverride.port;
    for (const url of ['/supabase-config.js', '/supabase-config.js?v=20260828', '/supabase-config.js?a=1&b=2#x',
      '/./supabase-config.js', '/%73upabase-config.js']) {
      const res = await get(p, url);
      assert.equal(res.status, 200, url);
      assert.equal(res.body, "const WHICH = 'swapped';\n", url);
      assert.match(res.headers['content-type'], /javascript/, url);
      assert.match(res.headers['cache-control'], /no-store/, url);
    }
    const head = await get(p, '/supabase-config.js', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(Number(head.headers['content-length']), Buffer.byteLength("const WHICH = 'swapped';\n"));

    // 2. Other paths are untouched and served live (an edit shows immediately).
    assert.equal((await get(p, '/other.js')).body, "const OTHER = 'live';\n");
    fs.writeFileSync(path.join(site, 'other.js'), "const OTHER = 'edited';\n");
    assert.equal((await get(p, '/other.js')).body, "const OTHER = 'edited';\n");
    assert.equal((await get(p, '/missing.js')).status, 404);

    // 3. Without --override: the repo file, exactly as before.
    const plain = await startServer(site, []);
    children.push(plain.child);
    const res = await get(plain.port, '/supabase-config.js?v=1');
    assert.equal(res.body, "const WHICH = 'repo';\n");
    assert.match(res.headers['cache-control'], /no-store/);

    // 4. A malformed --override is refused at startup.
    const bad = spawn(PYTHON, [SERVE, '0', '--directory', site, '--override', 'no-slash=x'], { stdio: 'ignore' });
    const code = await new Promise((resolve) => bad.on('exit', resolve));
    assert.notEqual(code, 0);

    // 5. Fail closed on production (Codex adversarial review, high): the
    //    repo's portal/ served directly, without the staging swap, refuses.
    const portalDir = path.join(ROOT, 'portal');
    assert.ok(fs.readFileSync(path.join(portalDir, 'supabase-config.js'), 'utf8').includes(PRODUCTION_REF));
    const direct = refuses(portalDir, []);
    assert.ok(direct.refused, 'serving portal/ without an override must refuse');
    assert.match(direct.stderr, /PRODUCTION/);
    assert.match(direct.stderr, /bin\/dev\.sh/);

    // ...unless production is explicitly allowed.
    const allowed = await startServer(portalDir, ['--allow-production']);
    children.push(allowed.child);
    assert.ok((await get(allowed.port, '/supabase-config.js')).body.includes(PRODUCTION_REF));

    // ui/ has no supabase-config.js and serves normally.
    const ui = await startServer(path.join(ROOT, 'ui'), []);
    children.push(ui.child);
    assert.equal((await get(ui.port, '/')).status, 200);

    // The check reads content, not names: an override whose content names
    // production refuses too, unless allowed; a non-production file with the
    // config's name is fine (section 3).
    const prodCopy = path.join(tmp, 'prod-copy.js');
    fs.writeFileSync(prodCopy, `const MNT_SUPABASE_URL = 'https://${PRODUCTION_REF}.supabase.co';\n`);
    assert.ok(refuses(site, ['--override', `/supabase-config.js=${prodCopy}`]).refused);
    const prodOverride = await startServer(site, ['--override', `/supabase-config.js=${prodCopy}`, '--allow-production']);
    children.push(prodOverride.child);
    assert.ok((await get(prodOverride.port, '/supabase-config.js')).body.includes(PRODUCTION_REF));

    // A production config in the directory refuses even when only some other
    // path is overridden.
    const prodSite = path.join(tmp, 'prod-site');
    fs.mkdirSync(prodSite);
    fs.copyFileSync(prodCopy, path.join(prodSite, 'supabase-config.js'));
    assert.ok(refuses(prodSite, ['--override', `/other.js=${swapped}`]).refused);

    console.log('serve-override: all checks passed');
  } finally {
    for (const child of children) child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

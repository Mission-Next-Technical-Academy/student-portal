// ISSUE-022: bin/serve.py --override swaps one file (the portal's
// supabase-config.js) while every other file is served live from the repo.
// Starts real serve.py processes on free local ports; no other network use.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const PYTHON = process.env.PYTHON || 'python3';
const SERVE = path.join(__dirname, '..', 'bin', 'serve.py');

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

    console.log('serve-override: all checks passed');
  } finally {
    for (const child of children) child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

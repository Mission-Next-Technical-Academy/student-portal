// ISSUE-022: bin/lib/local_config.py writes the supabase-config.js that
// bin/dev.sh serves locally. Runs the real script on the real repo config and
// on deliberately broken copies; no network.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PYTHON = process.env.PYTHON || 'python3';
const SCRIPT = path.join(ROOT, 'bin', 'lib', 'local_config.py');
const REPO_CONFIG = path.join(ROOT, 'portal', 'supabase-config.js');
const PRODUCTION_REF = 'eokvngifirjgfozzbieu';
const STAGING_REF = 'xbblgtrfwgeiyttdlbue';
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const STAGING_KEY = 'sb_publishable_agURZ60XyPuIHiH1bLaOBg_tGy76IaY';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'local-config-test-'));

function generate(target, source = REPO_CONFIG) {
  const out = path.join(tmp, `${target}-${Math.random().toString(36).slice(2)}.js`);
  const res = spawnSync(PYTHON, [SCRIPT, '--target', target, '--source', source, '--out', out,
    '--production-ref', PRODUCTION_REF, '--staging-url', STAGING_URL, '--staging-key', STAGING_KEY],
  { encoding: 'utf8' });
  return { status: res.status, stderr: res.stderr, text: fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null };
}

try {
  const repo = fs.readFileSync(REPO_CONFIG, 'utf8');
  assert.ok(repo.includes(PRODUCTION_REF), 'the repo config is expected to name production');

  // 1. Staging: URL and key swapped, production gone, orange badge, rest kept.
  const staging = generate('STAGING');
  assert.equal(staging.status, 0, staging.stderr);
  assert.ok(!staging.text.includes(PRODUCTION_REF));
  assert.ok(staging.text.includes(`const MNT_SUPABASE_URL = '${STAGING_URL}';`));
  assert.ok(staging.text.includes(`const MNT_SUPABASE_ANON_KEY = '${STAGING_KEY}';`));
  assert.ok(staging.text.includes("window.MNT_LOCAL_TARGET = 'STAGING';"));
  assert.ok(staging.text.includes('STAGING (LOCAL) \\u00b7 synthetic data only'));
  assert.ok(staging.text.includes('supabase.createClient(MNT_SUPABASE_URL, MNT_SUPABASE_ANON_KEY'));
  assert.ok(/^[\x00-\x7f]*$/.test(staging.text.slice(repo.length - 200)), 'badge script is ASCII');

  // 2. Production: repo values kept, red badge.
  const production = generate('PRODUCTION');
  assert.equal(production.status, 0, production.stderr);
  assert.ok(production.text.startsWith(repo.trimEnd()));
  assert.ok(production.text.includes("window.MNT_LOCAL_TARGET = 'PRODUCTION';"));
  assert.ok(production.text.includes('PRODUCTION (LOCAL) \\u00b7 real student data'));

  // 3. A changed config format stops instead of serving an unswapped file.
  const broken = [
    repo.replace(/const MNT_SUPABASE_URL = /, 'var MNT_SUPABASE_URL = '),
    repo.replace(/const MNT_SUPABASE_ANON_KEY = /, 'let MNT_SUPABASE_ANON_KEY = '),
    `${repo}\nconst MNT_SUPABASE_URL = 'https://${PRODUCTION_REF}.supabase.co';\n`,
    `${repo}\n// fallback: https://${PRODUCTION_REF}.supabase.co\n`,
  ];
  broken.forEach((text, i) => {
    const src = path.join(tmp, `broken-${i}.js`);
    fs.writeFileSync(src, text);
    const res = generate('STAGING', src);
    assert.notEqual(res.status, 0, `broken config ${i} must be refused`);
    assert.match(res.stderr, /STOPPED/);
    assert.equal(res.text, null, `broken config ${i} must not be written`);
  });

  // 4. --target PRODUCTION refuses a config that is not production.
  const notProd = path.join(tmp, 'not-prod.js');
  fs.writeFileSync(notProd, repo.replaceAll(PRODUCTION_REF, 'abcdefghijklmnopqrst'));
  assert.notEqual(generate('PRODUCTION', notProd).status, 0);

  console.log('local-config: all checks passed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

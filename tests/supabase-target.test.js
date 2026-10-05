// ISSUE-019: admin scripts must never default to production.
// Exercises bin/lib/supabase-target.js without touching the network.
const assert = require('node:assert/strict');
const {
  PRODUCTION_REF, STAGING_REF, TargetError,
  resolveSupabaseTarget, requireSupabaseTarget,
} = require('../bin/lib/supabase-target');

const prod = `https://${PRODUCTION_REF}.supabase.co`;
const staging = `https://${STAGING_REF}.supabase.co`;
const throwsTarget = (fn, pattern) => assert.throws(fn, (err) => err instanceof TargetError && pattern.test(err.message));

// 1. No SUPABASE_URL -> refuse, and the message shows the staging command.
throwsTarget(() => resolveSupabaseTarget({ env: {}, argv: [] }), /not set[\s\S]*xbblgtrfwgeiyttdlbue/);
throwsTarget(() => resolveSupabaseTarget({ env: { SUPABASE_URL: '   ' }, argv: [] }), /not set/);

// 2. Malformed URLs -> refuse.
for (const bad of ['http://xbblgtrfwgeiyttdlbue.supabase.co', 'https://example.com', 'xbblgtrfwgeiyttdlbue', `${staging}/rest/v1`]) {
  throwsTarget(() => resolveSupabaseTarget({ env: { SUPABASE_URL: bad }, argv: [] }), /not a Supabase project URL/);
}

// 3. Staging -> allowed; trailing slash trimmed; args untouched.
{
  const t = resolveSupabaseTarget({ env: { SUPABASE_URL: `${staging}/` }, argv: ['HDESK', '3'] });
  assert.equal(t.environment, 'STAGING');
  assert.equal(t.url, staging);
  assert.deepEqual(t.argv, ['HDESK', '3']);
}

// 4. Production without the flag -> refuse.
throwsTarget(() => resolveSupabaseTarget({ env: { SUPABASE_URL: prod }, argv: ['HDESK', '3'] }), /PRODUCTION[\s\S]*--production/);

// 5. Production with the flag -> allowed, and the flag is removed wherever it appears.
{
  const t = resolveSupabaseTarget({ env: { SUPABASE_URL: prod }, argv: ['--production', 'HDESK', '3'] });
  assert.equal(t.environment, 'PRODUCTION');
  assert.equal(t.productionAllowed, true);
  assert.deepEqual(t.argv, ['HDESK', '3']);
  const t2 = resolveSupabaseTarget({ env: { SUPABASE_URL: prod }, argv: ['--confirm', '--production', 'ID-1'] });
  assert.deepEqual(t2.argv, ['--confirm', 'ID-1']);
}

// 6. Unknown project -> allowed but labelled UNKNOWN; --production on staging is harmless and stripped.
{
  const t = resolveSupabaseTarget({ env: { SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co' }, argv: [] });
  assert.equal(t.environment, 'UNKNOWN');
  const t2 = resolveSupabaseTarget({ env: { SUPABASE_URL: staging }, argv: ['--production', 'X'] });
  assert.deepEqual(t2.argv, ['X']);
}

// 7. requireSupabaseTarget prints the target first, rewrites process.argv, and exits on refusal.
{
  const savedArgv = process.argv;
  try {
    const logs = [];
    process.argv = ['node', 'script.js', '--production', 'HDESK', '3'];
    const t = requireSupabaseTarget({ env: { SUPABASE_URL: prod }, log: (m) => logs.push(m), error: () => {}, exit: () => {} });
    assert.equal(t.environment, 'PRODUCTION');
    assert.deepEqual(process.argv.slice(2), ['HDESK', '3']);
    assert.match(logs[0], /^Target: PRODUCTION/);
    assert.match(logs[1], /WARNING/);

    const errors = [];
    let exitCode = null;
    process.argv = ['node', 'script.js', 'HDESK', '3'];
    const refused = requireSupabaseTarget({ env: {}, log: () => {}, error: (m) => errors.push(m), exit: (c) => { exitCode = c; } });
    assert.equal(refused, null);
    assert.equal(exitCode, 1);
    assert.match(errors[0], /SUPABASE_URL is not set/);
  } finally {
    process.argv = savedArgv;
  }
}

console.log('supabase-target: all checks passed');

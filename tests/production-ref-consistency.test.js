// The production project ref is written in three places that must agree:
// bin/serve.py (refuses to serve it without --allow-production),
// bin/lib/targets.sh (bin/dev.sh) and bin/lib/supabase-target.js (admin
// scripts). If one changes alone, a guard silently stops recognising
// production, so fail loudly instead.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  ['bin/serve.py', /^PRODUCTION_REF = '([^']*)'$/gm],
  ['bin/lib/targets.sh', /^PRODUCTION_REF='([^']*)'$/gm],
  ['bin/lib/supabase-target.js', /^const PRODUCTION_REF = '([^']*)';$/gm],
];

const refs = SOURCES.map(([file, pattern]) => {
  const matches = [...fs.readFileSync(path.join(ROOT, file), 'utf8').matchAll(pattern)];
  assert.equal(matches.length, 1, `${file}: expected exactly one PRODUCTION_REF definition, found ${matches.length}`);
  const ref = matches[0][1];
  assert.match(ref, /^[a-z0-9]{20}$/, `${file}: PRODUCTION_REF "${ref}" is not a Supabase project ref`);
  return [file, ref];
});

for (const [file, ref] of refs) {
  assert.equal(ref, refs[0][1], `PRODUCTION_REF differs: ${refs[0][0]} has ${refs[0][1]}, ${file} has ${ref}`);
}

// The repo's portal config is the production one; it must name the same ref.
const config = fs.readFileSync(path.join(ROOT, 'portal', 'supabase-config.js'), 'utf8');
assert.ok(config.includes(`https://${refs[0][1]}.supabase.co`),
  `portal/supabase-config.js does not name the production ref ${refs[0][1]}`);

console.log('production-ref-consistency: all checks passed');

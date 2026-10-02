#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');

const script = path.join(__dirname, '..', 'scripts', 'soc-telemetry-inventory.js');
const run = (...args) => execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const first = run('--json');
const second = run('--json');
assert.strictEqual(first, second, 'inventory JSON is deterministic across runs');
const inv = JSON.parse(first);

assert.strictEqual(inv.loadErrors.length, 0, 'portal scripts load without errors');
for (let module = 1; module <= 12; module += 1) {
  for (const kind of ['guided', 'assessment']) {
    const s = inv.scenarios.find((x) => x.module === module && x.scenario === kind);
    assert.ok(s, `module ${module} ${kind} scenario is represented`);
    assert.ok(s.method, `module ${module} ${kind} records its load method`);
  }
  assert.ok(inv.progression.rows.some((r) => r.module === module), `module ${module} appears in the progression table`);
}
assert.strictEqual(inv.scenarios.find((x) => x.module === 12 && x.scenario === 'guided').notApplicable, true, 'M12 has no guided scenario');

let populated = 0;
for (const s of inv.scenarios) {
  if (s.notApplicable || s.unavailable || !s.uniqueSourceEvents) continue;
  populated += 1;
  assert.ok(s.uniqueSourceEvents <= s.viewRows, `M${s.module} ${s.scenario}: unique events (${s.uniqueSourceEvents}) <= total view rows (${s.viewRows})`);
  assert.strictEqual(s.telemetryEvents + s.evidenceRecords, s.uniqueSourceEvents, `M${s.module} ${s.scenario}: telemetry + evidence rows equal the unique total`);
  assert.strictEqual(s.queryableEvents + s.displayOnlyEvents, s.uniqueSourceEvents, `M${s.module} ${s.scenario}: queryable + display-only equal the unique total`);
  assert.ok(s.unifiedCopiesMatchSource, `M${s.module} ${s.scenario}: UnifiedEvents copies map to source rows`);
  for (const f of Object.values(s.coverage)) assert.ok(f.pct >= 0 && f.pct <= 100);
}
assert.ok(populated >= 20, 'at least 20 scenarios carry event data');

const markdown = run();
assert.ok(markdown.startsWith('# SOC Telemetry Inventory'));
assert.ok(markdown.includes('## Counting rules') && markdown.includes('## Findings vs roadmap'));
assert.strictEqual(markdown, run(), 'markdown output is deterministic');
assert.ok(inv.roadmapClaims.length >= 8, 'roadmap claims are checked');

console.log('soc-telemetry-inventory.test.js passed');

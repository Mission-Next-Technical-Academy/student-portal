#!/usr/bin/env node
/* Sprint 7 density: M08 assessment 66 -> 86 unique events; answer key and alert results unchanged.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const PORTAL = path.join(__dirname, '..', 'portal');
function stub() {
  const noop = () => {};
  const handler = { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : (k === 'style' || k === 'dataset' || k === 'classList') ? new Proxy({}, { get: () => noop }) : stub()), apply: () => stub() };
  return new Proxy(function () {}, handler);
}
function loadPortal() {
  const html = fs.readFileSync(path.join(PORTAL, 'index.html'), 'utf8');
  const wanted = /^(data|lab-runtime|module-registry|case-record|console-guide|soc-|kql-engine|kql-editor|attack-catalog)/;
  const files = [];
  for (const m of html.matchAll(/<script src="([^"?]+)/g)) {
    const f = m[1];
    if (f.startsWith('vendor/') || !wanted.test(f) || files.includes(f) || !fs.existsSync(path.join(PORTAL, f))) continue;
    files.push(f);
  }
  const noop = () => {};
  const ctx = { console: { log: noop, warn: noop, error: noop, info: noop, debug: noop }, setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop, document: stub(), localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, navigator: {}, esc: (v) => String(v == null ? '' : v) };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext('Math.random = () => 0.5;', ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
const ctx = loadPortal();
const live = (expr) => vm.runInContext(expr, ctx);
const Schema = live('SocTelemetrySchema');
const Kql = live('MnKql');

const NON_EVENT = new Set(['UnifiedEvents', 'IdentityInfo', 'IpIntel']);
function sourceRows(dataset) {
  const rows = [];
  for (const [name, list] of Object.entries(dataset.tables)) {
    if (NON_EVENT.has(name) || !Array.isArray(list) || !list.some((r) => r && r.__rid)) continue;
    for (const r of list) rows.push(r);
  }
  return rows;
}
const unique = (rows) => [...new Map(rows.map((r) => [r.EventId, r])).values()];

const dataset = live('MODULE_EIGHT_CONSOLE_DATA');
const guided = live('MODULE_EIGHT_GUIDED_CONSOLE_DATA');
const scenario = JSON.parse(JSON.stringify(live('SocM08AssessmentData.scenario')));
const gscenario = JSON.parse(JSON.stringify(live('MODULE_EIGHT_GUIDED_FIXTURE.scenario')));

for (const [label, ds, min] of [['assessment', dataset, 86], ['guided', guided, 86]]) {
  const events = unique(sourceRows(ds));
  assert.ok(events.length >= min, `M08 ${label} unique events ${events.length} >= ${min}`);
  const tv = Schema.validateEvents(events.map((e) => ({ ...e })), { start: '2026-05-01T00:00:00Z', end: '2026-10-02T00:00:00Z', label: `M08 ${label}` });
  assert.deepStrictEqual(Array.from(tv.errors), [], `M08 ${label} schema errors`);
  events.forEach((e) => { if (e.Host) { assert.strictEqual(e.Host, e.Host.toLowerCase()); assert.strictEqual(e.Host, e.DeviceId); } });
}

// Every added row is purpose-tagged (instructor-side, not rendered) and references an inventory asset in the window.
const assets = new Set(scenario.assetInventory.map((a) => a.assetId));
for (const r of [...scenario.scanRuns, ...scenario.patchRecords]) {
  assert.ok(assets.has(r.assetId) && r.purpose && r.classification, `${r.id} has asset, purpose and classification`);
  assert.ok(Number(r.id.slice(-3)) < (r.id.includes("SCAN") ? 8 : 5) || r.observedAt >= scenario.start && r.observedAt <= scenario.end, `${r.id} is inside the scenario window`);
}
assert.ok(scenario.scanRuns.length >= 16 && scenario.patchRecords.length >= 15);
assert.ok(scenario.patchRecords.every((p) => !/^(applied|completed|closed)$/.test(p.status)), 'no patch record claims remediation is complete');
const rendered = [...scenario.scanRuns, ...scenario.patchRecords].map((r) => `${r.detail} ${r.outcome || r.status}`).join(' ');
assert.ok(!/\b(benign|decoy|distractor|red herring|noise|answer)\b/i.test(rendered), 'no student-visible purpose label');

// Answer key and alert results unchanged.
assert.strictEqual(scenario.findings.length, 8);
assert.deepStrictEqual({ a: scenario.expectedPriority.assetId, o: scenario.expectedPriority.ownerId, p: scenario.expectedPriority.priority }, { a: 'web-dmz-14', o: 'p.diallo', p: 'critical' });
assert.strictEqual(gscenario.expectedPriority.assetId, 'api-edge-31');
assert.strictEqual(scenario.alertCandidates.length, 5);
const rows = (q) => Array.from(Kql.evaluate(q, dataset.tables, { now: dataset.now }).rows).map((r) => r.EventId).sort();
assert.deepStrictEqual(rows(scenario.alertCandidates[0].query), ['M08-FINDING-005', 'M08-FINDING-007']);
assert.deepStrictEqual(rows(scenario.alertCandidates[1].query), ['M08-FINDING-001', 'M08-FINDING-003', 'M08-FINDING-007']);
assert.deepStrictEqual(rows(scenario.alertCandidates[2].query), ['M08-FINDING-002', 'M08-FINDING-008']);
assert.ok(scenario.scanRuns.some((r) => r.outcome === 'credential_failure'), 'credential failure still explains the stale finding');
console.log('Sprint 7 (M08) density tests passed.');

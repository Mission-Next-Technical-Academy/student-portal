#!/usr/bin/env node
/* Sprint 7 density: M06 assessment >= 62 unique events (guided scaled proportionally), answer keys unchanged. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
const local = (v) => JSON.parse(JSON.stringify(v));
const context = {};
vm.createContext(context);
vm.runInContext(portal('soc-telemetry-schema.js'), context);
vm.runInContext(portal('soc-m06-assessment-data.js'), context);
const Schema = vm.runInContext('SocTelemetrySchema', context);
const a = local(vm.runInContext('SocM06AssessmentData.scenario', context));
const src = portal('soc-analyst-module-06.js');
const x = src.indexOf('const MODULE_SIX_GUIDED_LAB_ID');
const y = src.indexOf('const MODULE_SIX_GUIDED_DEVICES');
const gctx = {}; vm.createContext(gctx);
vm.runInContext(`${src.slice(x, y)}\nglobalThis.G = MODULE_SIX_GUIDED_FIXTURE.scenario;`, gctx);
const g = local(gctx.G);

function check(label, s, devKey) {
  const ids = s.telemetry.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length, `${label} unique EventIds`);
  const r = Schema.validateScenario({
    events: s.telemetry, start: s.start, end: s.end, references: [],
    entities: { DeviceId: s.scope.devices, Account: [...new Set(s.telemetry.map((e) => e.account))] },
  }, { label });
  assert.deepStrictEqual(local(r.errors), [], `${label} schema errors:\n${r.errors.join('\n')}`);
  s.telemetry.forEach((e) => {
    assert.strictEqual(e.host, e.device, `${e.id} host equals device`);
    assert.strictEqual(e.host, e.host.toLowerCase(), `${e.id} host lower-case`);
    assert.ok(e.time >= s.start.replace(/Z$/, '') && e.time <= s.end, `${e.id} inside window`);
  });
  return ids;
}

const aIds = check('M06 assessment', a, 'device');
assert.ok(aIds.length >= 62, `M06 assessment unique events >= 62 (${aIds.length})`);
assert.ok(aIds.length > 52 && aIds.length < 75, 'between M05 (52) and M07 (75)');
const gIds = check('M06 guided', g, 'device');
assert.ok(gIds.length >= 60 && gIds.length <= aIds.length, `M06 guided scaled proportionally (${gIds.length})`);
assert.ok(!gIds.some((id) => aIds.includes(id)), 'guided and assessment ids independent');

// New rows are tagged with a purpose in non-rendered instructor structures.
assert.ok(/052\.\.063/.test(Object.keys(a.fixtureNotes.eventPurposes).join()), 'assessment new rows have a purpose tag');
assert.ok(/251\.\.261/.test(Object.keys(g.fixtureNotes.eventPurposes).join()), 'guided new rows have a purpose tag');

// Answer keys unchanged.
assert.deepStrictEqual(a.telemetry.filter((e) => e.taskName === 'UpdateHealth').map((e) => e.id), ['M06-EVT-001', 'M06-EVT-007']);
assert.deepStrictEqual(a.telemetry.filter((e) => e.processId === '3188').map((e) => e.id), ['M06-EVT-003', 'M06-EVT-004', 'M06-EVT-005', 'M06-EVT-006']);
assert.deepStrictEqual(a.expectedTruth.supportedTechniques.map((t) => t.id), ['T1053.005', 'T1059.001']);
assert.deepStrictEqual(a.expectedTruth.unsupportedTechniques.map((t) => t.id).slice(0, 2), ['T1105', 'T1071.001']);
assert.deepStrictEqual(a.expectedTruth.negativeEvidence.coverageEventIds, ['M06-EVT-032', 'M06-EVT-040', 'M06-EVT-041', 'M06-EVT-043']);
assert.strictEqual(a.seedLead.device, 'ws-318');
assert.deepStrictEqual(a.scope.devices, ['ws-318', 'ws-355', 'ws-402']);
assert.deepStrictEqual(g.expectedTruth.supportedTechniques.map((t) => t.id), ['T1059.001']);
assert.strictEqual(g.expectedTruth.negativeEvidence.device, 'ws-655');

// No-match claims remain true; new tasks give the empty result meaning and never touch the lead indicators.
const neg = a.expectedTruth.negativeEvidence;
assert.strictEqual(a.telemetry.filter((e) => e.device === neg.device && e.taskName === neg.taskName).length, 0);
assert.ok(a.telemetry.filter((e) => e.device === 'ws-402' && e.eventType === 'scheduled_task').length >= 2, 'ws-402 has several other tasks');
assert.ok(!a.telemetry.some((e) => e.id > 'M06-EVT-051' && (e.destination === '198.51.100.88' || /UpdateHealth/.test(`${e.taskName} ${e.commandLine} ${e.path}`))), 'new rows carry no lead indicators');
a.telemetry.filter((e) => e.device === 'ws-402' && e.eventType !== 'sensor_health').forEach((e) => assert.ok(e.time < '2026-09-27T09:21:00Z' || e.time > '2026-09-27T09:24:30Z', `${e.id} outside ws-402 gap`));
assert.strictEqual(g.telemetry.filter((e) => e.device === 'ws-655' && (/benefits_form/.test(`${e.commandLine} ${e.path}`) || e.destination === '192.0.2.145')).length, 0);
g.telemetry.filter((e) => e.device === 'ws-655' && e.eventType !== 'sensor_health').forEach((e) => assert.ok(e.time < '2026-09-27T10:20:00Z' || e.time > '2026-09-27T10:26:40Z', `${e.id} outside ws-655 gap`));

// No purpose labels visible to the learner.
const LABEL = /\b(benign|decoy|distractor|red herring|false positive|noise|answer)\b/i;
[...a.telemetry, ...g.telemetry].filter((e) => /^M06-(EVT-05[2-9]|EVT-06|GUIDE-25[1-9]|GUIDE-26)/.test(e.id))
  .forEach((e) => ['commandLine', 'path', 'destination', 'taskName', 'result'].forEach((f) => assert.ok(!LABEL.test(String(e[f] || '')), `${e.id}.${f} unlabeled`)));

console.log('soc-telemetry-sprint7-m06 tests passed');

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const records = new Map();
const calls = [];
const context = { LabRuntime: {
  loadCaseState(labId, moduleKey, user, defaults) {
    calls.push(['load', labId, moduleKey]);
    return records.get(`${labId}:${moduleKey}:${user.id}`) ?? JSON.parse(JSON.stringify(defaults));
  },
  saveCaseState(labId, moduleKey, user, state) {
    calls.push(['save', labId, moduleKey]);
    records.set(`${labId}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(state)));
    return state;
  },
  resetCaseState(labId, moduleKey, user, defaults) {
    calls.push(['reset', labId, moduleKey]);
    const state = JSON.parse(JSON.stringify(defaults));
    records.set(`${labId}:${moduleKey}:${user.id}`, state);
    return state;
  },
} };
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m06-assessment-data.js', 'soc-m06-assessment-state.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const api = vm.runInContext('SocM06AssessmentState', context);
const fixture = vm.runInContext('SocM06AssessmentData', context);
const user = { id: 'learner-1' };
const scenario = fixture.scenario;
const stateKey = scenario.stateKey; // gitleaks:allow
const guidedKey = `${scenario.legacyStateId}:soc-06:${user.id}`;
records.set(guidedKey, { bookmarks: ['guided-event'], guidedProgress: 7 });

assert.strictEqual(api.VERSION, 1);
assert.strictEqual(api.MODULE_KEY, 'soc-06');
assert.strictEqual(stateKey, 'm06-threat-hunt-assessment-v1'); // gitleaks:allow
const fresh = api.normalize({}, fixture);
for (const key of Object.keys(api.LIMITS)) assert.deepStrictEqual(JSON.parse(JSON.stringify(fresh[key])), []);
assert.strictEqual(fresh.schemaVersion, 1);
assert.strictEqual(fresh.scenarioId, scenario.id);

const oldVersion = {
  schemaVersion: 0, scenarioId: 'stale', hypotheses: [{ id: 'h1', text: 'Investigate task', eventIds: ['M06-EVT-001'] }],
  queryHistory: [{ query: 'eventType == process_start', eventIds: ['M06-EVT-003'] }],
  pivots: [{ deviceId: 'ws-318', eventId: 'M06-EVT-002' }], bookmarks: ['M06-EVT-004'],
  collections: [{ id: 'c1', eventIds: ['M06-EVT-003', 'M06-EVT-004'] }],
  mappings: [{ techniqueId: 'T1059.001', eventIds: ['M06-EVT-003'] }],
  handoffs: [{ id: 'handoff-1', deviceIds: ['ws-318'], eventIds: ['M06-EVT-001'] }],
  conclusions: [{ text: 'Suspicious execution, not proof of C2', eventIds: ['M06-EVT-003', 'M06-EVT-005'] }],
};
const migrated = api.normalize(oldVersion, fixture);
assert.strictEqual(migrated.scenarioId, scenario.id);
assert.strictEqual(migrated.schemaVersion, api.VERSION);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(migrated, fixture))), JSON.parse(JSON.stringify(migrated)), 'migration is idempotent');
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({
  bookmarks: ['M06-EVT-001', 'M06-EVT-999'], pivots: [{ deviceId: 'ws-outside', eventId: 'M06-EVT-001' }],
  mappings: [{ techniqueId: 'T9999', eventIds: ['M06-EVT-001'] }],
}, fixture).bookmarks)), ['M06-EVT-001']);
assert.strictEqual(api.normalize({ pivots: [{ deviceId: 'ws-outside', eventId: 'M06-EVT-001' }] }, fixture).pivots.length, 0);
assert.strictEqual(api.normalize({ mappings: [{ techniqueId: 'T9999', eventIds: ['M06-EVT-001'] }] }, fixture).mappings.length, 0);

const oversized = api.normalize(Object.fromEntries(Object.entries(api.LIMITS).map(([key, limit]) => [key,
  key === 'bookmarks' ? Array.from({ length: limit + 20 }, (_, i) => `M06-EVT-${String(i % 9 + 1).padStart(3, '0')}`)
    : Array.from({ length: limit + 20 }, (_, i) => ({ id: `item-${i}`, text: 'x'.repeat(3000), query: 'q'.repeat(5000) }))])), fixture);
for (const [key, limit] of Object.entries(api.LIMITS)) assert.ok(oversized[key].length <= limit, `${key} stays bounded`);
assert.ok(oversized.hypotheses.every((item) => item.text.length <= 2000 && item.query.length <= 4000));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({ hypotheses: [null, 'bad', []], queryHistory: 'bad', bookmarks: ['unknown'] }, fixture).hypotheses)), []);

const loaded = api.load(user, fixture);
assert.strictEqual(calls[0][1], stateKey); // gitleaks:allow
assert.strictEqual(calls[0][2], 'soc-06');
assert.strictEqual(loaded.scenarioId, scenario.id);
assert.deepStrictEqual(records.get(guidedKey), { bookmarks: ['guided-event'], guidedProgress: 7 }, 'guided state is not read or mutated');
const writes = calls.filter((call) => call[0] === 'save').length;
api.load(user, fixture);
assert.strictEqual(calls.filter((call) => call[0] === 'save').length, writes, 'stable load does not rewrite');

api.save(user, oldVersion, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture).bookmarks)), ['M06-EVT-004']);
const reset = api.reset(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset.bookmarks)), []);
assert.strictEqual(reset.scenarioId, scenario.id);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture))), JSON.parse(JSON.stringify(reset)), 'reset persists fresh state');
assert.deepStrictEqual(records.get(guidedKey), { bookmarks: ['guided-event'], guidedProgress: 7 }, 'reset leaves guided hunt state intact');
assert.deepStrictEqual(calls.slice(-3).map((call) => call[0]), ['reset', 'save', 'load']);
console.log('M06 assessment state contract: all checks passed');

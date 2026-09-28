#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m06-assessment-data.js', 'soc-m06-assessment-state.js', 'soc-m06-assessment-actions.js', 'attack-catalog.js', 'soc-m06-assessment-related-search.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const api = vm.runInContext('SocM06AssessmentActions', context);
const stateApi = vm.runInContext('SocM06AssessmentState', context);
const fixture = vm.runInContext('SocM06AssessmentData', context);
const timestamp = '2026-09-27T09:20:00Z';
const actions = [
  ['hypothesis_edit', { hypothesisId: 'H-1', text: 'Investigate task behavior', status: 'open', relatedEventIds: ['M06-EVT-001'], deviceIds: ['ws-318'] }],
  ['query_run', { query: 'eventType == process_start', resultEventIds: ['M06-EVT-003'], resultCount: 1 }],
  ['pivot', { fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-003', field: 'processId', value: '3188' }],
  ['bookmark', { eventId: 'M06-EVT-004', note: 'Unsigned script' }],
  ['collection', { collectionId: 'M06-COLLECTION-000001', name: 'Task evidence', eventIds: ['M06-EVT-001', 'M06-EVT-003'], operation: 'create' }],
  ['attack_mapping_change', { tacticId: 'TA0002', techniqueId: 'T1059.001', eventIds: ['M06-EVT-003'], confidence: 90, status: 'supported', rationale: 'PowerShell process observed' }],
  ['attack_mapping_remove', { tacticId: 'TA0011', techniqueId: 'T1105', reason: 'Insufficient evidence' }],
  ['handoff', { handoffId: 'HO-1', deviceIds: ['ws-318'], eventIds: ['M06-EVT-003'], recipient: 'EDR team', summary: 'Review script execution', status: 'submitted' }],
  ['handoff_proposal', { handoffId: 'M06-HANDOFF-000001', eventIds: ['M06-EVT-003'], destination: 'alert', rationale: 'Review the observed script.', recommendation: 'Create an alert for this behavior.' }],
  ['handoff_status', { handoffId: 'M06-HANDOFF-000001', eventIds: ['M06-EVT-003'], fromStatus: 'proposed', toStatus: 'in_review', note: 'Review evidence.' }],
  ['conclusion', { text: 'Suspicious execution; C2 is unproven', eventIds: ['M06-EVT-003', 'M06-EVT-005'], disposition: 'investigate' }],
];
let state = stateApi.normalize({}, fixture);
const originalDetails = JSON.parse(JSON.stringify(actions[0][1]));
for (const [type, details] of actions) state = api.append(state, type, timestamp, details, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.actionHistory.map((item) => item.type))), actions.map(([type]) => type));
assert.deepStrictEqual(actions[0][1], originalDetails, 'append does not mutate caller details');
assert.ok(Object.isFrozen(state.actionHistory[0]) && Object.isFrozen(state.actionHistory[0].details));
assert.strictEqual(state.nextActionSequence, actions.length + 1);

for (const [type, details] of actions) {
  assert.throws(() => api.append(state, type, '2026-02-30T09:20:00Z', details, fixture), /timestamp/);
  assert.throws(() => api.append(state, type, '2026-09-27T11:20:00+02:00', details, fixture), /timestamp/);
}
assert.throws(() => api.append(state, 'bookmark', timestamp, { eventId: 'M06-EVT-999' }, fixture), /Invalid details/);
assert.throws(() => api.append(state, 'hypothesis_edit', timestamp, { hypothesisId: 'H-2', text: 'x', deviceIds: ['ws-outside'] }, fixture), /Invalid details/);
assert.throws(() => api.append(state, 'attack_mapping_change', timestamp, { tacticId: 'TA0002', techniqueId: 'T9999', eventIds: ['M06-EVT-001'], confidence: 50, status: 'supported', rationale: 'unknown' }, fixture), /Invalid details/);
assert.throws(() => api.append(state, 'attack_mapping_change', timestamp, { tacticId: 'TA0002', techniqueId: 'T1059.001', eventIds: [], confidence: 50, status: 'supported', rationale: 'missing evidence' }, fixture), /Invalid details/);

const restored = stateApi.normalize(JSON.parse(JSON.stringify(state)), fixture);
assert.strictEqual(restored.nextActionSequence, state.nextActionSequence, 'restore preserves next ID');
state = api.append(restored, 'bookmark', timestamp, { eventId: 'M06-EVT-001', note: 'lead' }, fixture);
assert.strictEqual(state.actionHistory.at(-1).sequence, actions.length + 1, 'IDs continue after restore');
const damaged = JSON.parse(JSON.stringify(state));
damaged.actionHistory.push({ id: 'bad', sequence: 999, type: 'bookmark', timestamp: 'bad', details: { eventId: 'bad' } });
const cleaned = api.restoreHistory(damaged.actionHistory, damaged.nextActionSequence, fixture);
assert.strictEqual(cleaned.actionHistory.length, state.actionHistory.length, 'invalid restored records are rejected');
assert.strictEqual(cleaned.nextActionSequence, state.nextActionSequence);

let bounded = stateApi.normalize({}, fixture);
for (let i = 0; i < api.MAX_HISTORY + 7; i++) {
  bounded = api.append(bounded, 'bookmark', timestamp, { eventId: 'M06-EVT-001', note: `bookmark ${i}` }, fixture);
}
assert.strictEqual(bounded.actionHistory.length, api.MAX_HISTORY);
assert.strictEqual(bounded.actionHistory[0].sequence, 8, 'old records trim while sequence remains monotonic');
const boundedRestored = stateApi.normalize(JSON.parse(JSON.stringify(bounded)), fixture);
bounded = api.append(boundedRestored, 'bookmark', timestamp, { eventId: 'M06-EVT-001', note: 'after restore' }, fixture);
assert.strictEqual(bounded.actionHistory.at(-1).sequence, api.MAX_HISTORY + 8);

assert.throws(() => api.append(state, 'handoff_proposal', timestamp, { handoffId: 'M06-HANDOFF-000002', eventIds: ['M06-EVT-999'], destination: 'alert', rationale: 'Review evidence.', recommendation: 'Create alert.' }, fixture), /Invalid details/);
assert.strictEqual(api.TYPES.length, 15);
assert.strictEqual(api.validTimestamp(timestamp), true);
console.log('M06 assessment actions contract: all checks passed');

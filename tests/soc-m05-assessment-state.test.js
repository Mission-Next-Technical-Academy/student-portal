#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const records = new Map();
const calls = [];
const context = {
  LabRuntime: {
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
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m05-assessment-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m05-assessment-state.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m05-assessment-actions.js'), 'utf8'), context);
const api = vm.runInContext('SocM05AssessmentState', context);
const actions = vm.runInContext('SocM05AssessmentActions', context);
const fixture = vm.runInContext('SocM05AssessmentData', context);
const user = { id: 'learner-1' };
const stateKey = fixture.scenario.stateKey;
const legacyKey = 'm05-endpoint-chain-v1:soc-05:learner-1';
records.set(legacyKey, { lessonProgress: ['old-lesson'], notes: 'preserve me' });

assert.strictEqual(api.VERSION, 1);
assert.strictEqual(api.MODULE_KEY, 'soc-05');
const defaults = api.normalize({}, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.selectedDeviceIds)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.selectedEventIds)), []);
assert.strictEqual(defaults.evidencePackage, null);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.edrHandoffs)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.approvalRequests)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.reviewedRecords)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(defaults.actionHistory)), []);
assert.strictEqual(defaults.nextActionSequence, 1);
assert.strictEqual(defaults.schemaVersion, 1);
assert.strictEqual(defaults.scenarioId, fixture.scenario.id);

const oldShape = {
  selectedDeviceIds: ['M05-DEV-001', null, 'M05-DEV-002'],
  selectedEventIds: ['M05-EVT-001'],
  reviewedRecords: [{ id: 'review-1', status: 'reviewed' }, null, []],
  actionHistory: [{ id: `${fixture.scenario.id}:ACTION-000003`, sequence: 3, type: 'event_review', timestamp: '2026-09-27T09:15:00Z', details: { eventId: 'M05-EVT-001', status: 'reviewed' } }, false],
  nextActionSequence: 2,
  scenarioId: 'wrong-scenario',
};
const migrated = api.normalize(oldShape, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(migrated.selectedDeviceIds)), ['M05-DEV-001', 'M05-DEV-002']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(migrated.reviewedRecords)), [{ id: 'review-1', status: 'reviewed' }]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(migrated.actionHistory)), [oldShape.actionHistory[0]]);
assert.strictEqual(migrated.nextActionSequence, 4);
assert.strictEqual(migrated.scenarioId, fixture.scenario.id);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(migrated, fixture))), JSON.parse(JSON.stringify(migrated)), 'normalization is idempotent');

const oversized = api.normalize({
  selectedDeviceIds: Array.from({ length: 150 }, (_, i) => `device-${i}`),
  selectedEventIds: Array.from({ length: 600 }, (_, i) => `event-${i}`),
  reviewedRecords: Array.from({ length: 250 }, (_, i) => ({ id: i })),
  actionHistory: Array.from({ length: 250 }, (_, i) => ({ id: `${fixture.scenario.id}:ACTION-${String(i + 1).padStart(6, '0')}`, sequence: i + 1, type: 'event_review', timestamp: '2026-09-27T09:15:00Z', details: { eventId: 'M05-EVT-001', status: `review-${i + 1}` } })),
}, fixture);
assert.strictEqual(oversized.selectedDeviceIds.length, 100);
assert.strictEqual(oversized.selectedEventIds.length, 500);
assert.strictEqual(oversized.reviewedRecords.length, 200);
assert.strictEqual(oversized.actionHistory.length, 200);
assert.strictEqual(oversized.nextActionSequence, 251);

const loaded = api.load(user, fixture);
assert.strictEqual(calls[0][1], stateKey);
assert.strictEqual(calls[0][2], 'soc-05');
assert.strictEqual(loaded.scenarioId, fixture.scenario.id);
assert.deepStrictEqual(records.get(legacyKey), { lessonProgress: ['old-lesson'], notes: 'preserve me' }, 'legacy lesson state is untouched');
const writesBeforeStableLoad = calls.filter((call) => call[0] === 'save').length;
api.load(user, fixture);
assert.strictEqual(calls.filter((call) => call[0] === 'save').length, writesBeforeStableLoad, 'normalized load is idempotent and does not rewrite');

const saved = api.save(user, { selectedDeviceIds: ['M05-DEV-003'], reviewedRecords: [{ id: 'r2' }] }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(saved.selectedDeviceIds)), ['M05-DEV-003']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture).reviewedRecords)), [{ id: 'r2' }], 'save restores normalized state');
const packageState = api.save(user, { selectedDeviceIds: ['M05-DEV-001'], evidencePackage: { deviceId: 'M05-DEV-001', eventIds: ['M05-EVT-003'], hashes: ['a'.repeat(64)] } }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture).evidencePackage)), JSON.parse(JSON.stringify(packageState.evidencePackage)), 'preserved package restores');
assert.strictEqual(api.normalize({ evidencePackage: { deviceId: 'M05-DEV-001', eventIds: ['M05-EVT-010'], hashes: [] } }, fixture).evidencePackage, null, 'cross-device package is rejected during restore');
assert.strictEqual(api.normalize({ evidencePackage: { deviceId: 'M05-DEV-001', eventIds: ['M05-EVT-003'], hashes: ['malformed'] } }, fixture).evidencePackage, null, 'malformed package hash is rejected during restore');
const immutableHistory = api.normalize({ actionHistory: [{ id: `${fixture.scenario.id}:ACTION-000001`, sequence: 1, type: 'analysis_note', timestamp: '2026-09-27T09:15:00Z', details: { text: 'Reviewed', relatedEventIds: ['M05-EVT-003'] } }] }, fixture).actionHistory;
assert.ok(Object.isFrozen(immutableHistory[0]) && Object.isFrozen(immutableHistory[0].details.relatedEventIds), 'restored audit records and nested details are immutable');
assert.strictEqual(api.normalize({ actionHistory: [
  { ...immutableHistory[0], type: 'unknown_action' },
  { ...immutableHistory[0], timestamp: 'yesterday' },
  { ...immutableHistory[0], details: { text: 'bad reference', relatedEventIds: ['M05-EVT-999'] } },
  { ...immutableHistory[0], details: { text: 'unexpected', injected: 'field' } },
  { ...immutableHistory[0], id: 'foreign:ACTION-000001' },
] }, fixture).actionHistory.length, 0, 'restore rejects malformed, untyped, foreign, and out-of-scope audit records');
assert.strictEqual(api.normalize({ actionHistory: [{
  id: `${fixture.scenario.id}:ACTION-000002`, sequence: 2, type: 'edr_handoff_status', timestamp: '2026-09-27T09:15:00Z',
  details: { handoffId: `${fixture.scenario.id}:ACTION-000001`, status: 'executed', updatedBy: 'lead' },
}] }, fixture).actionHistory.length, 0, 'restore rejects unsupported or malformed handoff status updates');
const validRequests = [
  { id: `${fixture.scenario.id}:ACTION-000001`, sequence: 1, type: 'endpoint_isolation_request', status: 'pending_approval', deviceId: 'M05-DEV-001', reason: 'Containment review', requestedBy: 'analyst-1' },
  { id: `${fixture.scenario.id}:ACTION-000002`, sequence: 2, type: 'endpoint_quarantine_request', status: 'pending_approval', deviceId: 'M05-DEV-001', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), reason: 'Malicious file', requestedBy: 'analyst-1' },
];
const restoredRequests = api.normalize({ approvalRequests: [...validRequests,
  { ...validRequests[0], status: 'executed' },
  { ...validRequests[1], deviceId: 'M05-DEV-002' },
  { ...validRequests[1], filePath: 'C:\\unknown.exe' },
  { ...validRequests[0], reason: '' },
] }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredRequests.approvalRequests)), validRequests, 'restore retains only valid pending requests bound to known fixture evidence');
assert.ok(Object.isFrozen(restoredRequests.approvalRequests[0]), 'restored approval requests are immutable');
const validHandoff = {
  id: `${fixture.scenario.id}:ACTION-000003`, sequence: 3,
  deviceIds: ['M05-DEV-001'], eventIds: ['M05-EVT-007'], hashes: ['a'.repeat(64)],
  summary: 'Detection only; execution not prevented', owner: 'analyst-1', recipient: 'endpoint-team',
  recommendation: 'Isolate host and preserve evidence.', status: 'in_progress',
};
const handoffRestore = api.normalize({ edrHandoffs: [validHandoff, { ...validHandoff, eventIds: ['M05-EVT-010'] }] }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(handoffRestore.edrHandoffs)), [validHandoff]);
assert.ok(Object.isFrozen(handoffRestore.edrHandoffs[0]) && Object.isFrozen(handoffRestore.edrHandoffs[0].eventIds));
assert.strictEqual(api.normalize({ edrHandoffs: [{ ...validHandoff, status: 'executed' }, { ...validHandoff, hashes: ['malformed'] }] }, fixture).edrHandoffs.length, 0,
  'restore rejects malformed and unsupported handoff status');
const tooManyHandoffs = api.normalize({ edrHandoffs: Array.from({ length: 55 }, (_, index) => ({ ...validHandoff,
  id: `${fixture.scenario.id}:ACTION-${String(index + 1).padStart(6, '0')}`, sequence: index + 1,
})) }, fixture);
assert.strictEqual(tooManyHandoffs.edrHandoffs.length, 50);
assert.strictEqual(restoredRequests.nextActionSequence, 3, 'restored request sequence prevents action ID reuse');
let persisted = api.normalize({}, fixture);
const fixtureTelemetryBeforePersistedActions = JSON.stringify(fixture.scenario.telemetry);
persisted = actions.append(persisted, 'evidence_package_preserved', '2026-09-27T09:15:00Z', {
  deviceId: 'M05-DEV-001', eventIds: ['M05-EVT-003'], hashes: ['a'.repeat(64)],
}, fixture);
persisted = actions.append(persisted, 'endpoint_isolation_request', '2026-09-27T09:15:00Z', {
  deviceId: 'M05-DEV-001', reason: 'Containment review', requestedBy: 'analyst-1', status: 'pending_approval',
}, fixture);
persisted = actions.append(persisted, 'endpoint_quarantine_request', '2026-09-27T09:15:00Z', {
  deviceId: 'M05-DEV-001', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64),
  reason: 'Malicious file', requestedBy: 'analyst-1', status: 'pending_approval',
}, fixture);
persisted = actions.append(persisted, 'edr_handoff', '2026-09-27T09:15:00Z', {
  deviceIds: ['M05-DEV-001'], eventIds: ['M05-EVT-007'], hashes: ['a'.repeat(64)],
  summary: 'Detection only; execution not prevented', owner: 'analyst-1', recipient: 'endpoint-team',
  recommendation: 'Isolate host and preserve evidence.', status: 'submitted',
}, fixture);
const persistedHandoffId = persisted.edrHandoffs[0].id;
persisted = actions.append(persisted, 'edr_handoff_status', '2026-09-27T09:15:00Z', {
  handoffId: persistedHandoffId, status: 'in_progress', updatedBy: 'endpoint-lead',
}, fixture);
api.save(user, persisted, fixture);
const reloaded = api.load(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reloaded.evidencePackage)), JSON.parse(JSON.stringify(persisted.evidencePackage)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(reloaded.approvalRequests.map(({ status, type }) => ({ status, type })))), [
  { status: 'pending_approval', type: 'endpoint_isolation_request' },
  { status: 'pending_approval', type: 'endpoint_quarantine_request' },
]);
assert.strictEqual(reloaded.edrHandoffs[0].status, 'in_progress');
assert.strictEqual(reloaded.actionHistory.length, 5, 'all valid typed audit events survive save and reload');
assert.ok(Object.isFrozen(reloaded.actionHistory[0]) && Object.isFrozen(reloaded.approvalRequests[0])
  && Object.isFrozen(reloaded.edrHandoffs[0]), 'reloaded history and response records are immutable');
assert.strictEqual(JSON.stringify(fixture.scenario.telemetry), fixtureTelemetryBeforePersistedActions,
  'pending requests never execute or alter fixture telemetry');
assert.deepStrictEqual(records.get(legacyKey), { lessonProgress: ['old-lesson'], notes: 'preserve me' },
  'assessment state save/reload does not read or mutate the legacy lesson key');
const reset = api.reset(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset.selectedDeviceIds)), []);
assert.strictEqual(reset.scenarioId, fixture.scenario.id);
assert.strictEqual(calls.at(-2)[0], 'reset');
assert.strictEqual(calls.at(-1)[0], 'save');
assert.deepStrictEqual(records.get(legacyKey), { lessonProgress: ['old-lesson'], notes: 'preserve me' }, 'reset leaves legacy state intact');
console.log('M05 assessment state contract: all checks passed');

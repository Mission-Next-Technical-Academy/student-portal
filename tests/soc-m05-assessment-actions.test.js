#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM05AssessmentData', context);
const stateApi = vm.runInContext('SocM05AssessmentState', context);
const actions = vm.runInContext('SocM05AssessmentActions', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const timestamp = '2026-09-27T09:15:00Z';
const samples = {
  device_review: { deviceId: 'ws-assess-27', status: 'reviewed' },
  event_review: { eventId: 'M05-EVT-001', status: 'reviewed' },
  analysis_note: { text: 'Process chain reviewed', relatedEventIds: ['M05-EVT-001', 'M05-EVT-002'] },
  analysis_update: { field: 'severity', value: 'high', reason: 'Malicious execution evidence' },
  evidence_selection: { deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-003'] },
  evidence_package_preserved: { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-003'], hashes: ['a'.repeat(64)] },
  evidence_preservation_request: { deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-005'], requestedBy: 'analyst-1' },
  endpoint_isolation_request: { deviceId: 'ws-assess-27', reason: 'Containment review', requestedBy: 'analyst-1', status: 'pending_approval' },
  endpoint_quarantine_request: { deviceId: 'ws-assess-27', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), reason: 'Malicious file', requestedBy: 'analyst-1', status: 'pending_approval' },
  edr_handoff: { deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-007'], hashes: ['a'.repeat(64)], summary: 'Detection only; execution not prevented', owner: 'analyst-1', recipient: 'endpoint-team', recommendation: 'Isolate host and preserve evidence.', status: 'submitted' },
  edr_handoff_status: { handoffId: `${fixture.scenario.id}:ACTION-000010`, status: 'accepted', updatedBy: 'endpoint-lead' },
  case_update: { field: 'status', value: 'investigating', reason: 'Evidence review underway' },
};
assert.deepStrictEqual(local(actions.TYPES), Object.keys(samples));

let state = stateApi.normalize({}, fixture);
for (const [index, type] of actions.TYPES.entries()) {
  const details = samples[type];
  const before = local(state);
  const detailsBefore = local(details);
  state = actions.append(state, type, timestamp, details, fixture);
  assert.deepStrictEqual(local(state).actionHistory.at(-1), {
    id: `${fixture.scenario.id}:ACTION-${String(index + 1).padStart(6, '0')}`,
    sequence: index + 1,
    type,
    timestamp,
    details: detailsBefore,
  });
  assert.deepStrictEqual(local(before).actionHistory, local(stateApi.normalize(before, fixture).actionHistory), 'append leaves the prior state unchanged');
  assert.deepStrictEqual(details, detailsBefore, 'append leaves caller details unchanged');
  if (type === 'evidence_package_preserved') {
    const savedRecord = state.actionHistory.at(-1);
    assert.ok(Object.isFrozen(savedRecord) && Object.isFrozen(savedRecord.details.eventIds), 'preserved package audit record is immutable');
  }
}

for (const [type, details] of [
  ['endpoint_isolation_request', { deviceId: 'M05-DEV-999', reason: 'Containment', requestedBy: 'analyst-1', status: 'pending_approval' }],
  ['endpoint_isolation_request', { deviceId: 'ws-assess-27', reason: ' ', requestedBy: 'analyst-1', status: 'pending_approval' }],
  ['endpoint_isolation_request', { deviceId: 'ws-assess-27', reason: 'Containment', requestedBy: '', status: 'pending_approval' }],
  ['endpoint_isolation_request', { deviceId: 'ws-assess-27', reason: 'Containment', requestedBy: 'analyst-1', status: 'executed' }],
  ['endpoint_quarantine_request', { deviceId: 'ws-assess-14', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), reason: 'Malicious', requestedBy: 'analyst-1', status: 'pending_approval' }],
  ['endpoint_quarantine_request', { deviceId: 'ws-assess-27', filePath: 'C:\\unknown.exe', sha256: 'a'.repeat(64), reason: 'Malicious', requestedBy: 'analyst-1', status: 'pending_approval' }],
]) assert.throws(() => actions.append(state, type, timestamp, details, fixture));

let requestState = stateApi.normalize({}, fixture);
const telemetryBeforeRequests = JSON.stringify(fixture.scenario.telemetry);
requestState = actions.append(requestState, 'endpoint_isolation_request', timestamp, samples.endpoint_isolation_request, fixture);
requestState = actions.append(requestState, 'endpoint_quarantine_request', timestamp, samples.endpoint_quarantine_request, fixture);
assert.deepStrictEqual(local(requestState.approvalRequests).map((request) => request.status), ['pending_approval', 'pending_approval']);
assert.ok(Object.isFrozen(requestState.approvalRequests[0]), 'approval request records are immutable');
assert.strictEqual(JSON.stringify(fixture.scenario.telemetry), telemetryBeforeRequests, 'requests do not simulate endpoint isolation or quarantine');
assert.deepStrictEqual(local(stateApi.normalize(local(requestState), fixture).approvalRequests), local(requestState.approvalRequests), 'valid pending approval requests restore unchanged');

let handoffState = actions.append(stateApi.normalize({}, fixture), 'edr_handoff', timestamp, samples.edr_handoff, fixture);
const handoff = handoffState.edrHandoffs[0];
assert.strictEqual(handoff.status, 'submitted');
assert.ok(Object.isFrozen(handoff) && Object.isFrozen(handoff.eventIds), 'handoff is immutable');
handoffState = actions.append(handoffState, 'edr_handoff_status', timestamp, {
  handoffId: handoff.id, status: 'in_progress', updatedBy: 'endpoint-lead',
}, fixture);
assert.strictEqual(handoffState.edrHandoffs[0].status, 'in_progress', 'status change persists');
assert.strictEqual(handoffState.actionHistory.at(-1).type, 'edr_handoff_status');
assert.strictEqual(stateApi.normalize(local(handoffState), fixture).edrHandoffs[0].status, 'in_progress', 'status survives restore');
for (const badDetails of [
  { ...samples.edr_handoff, eventIds: ['M05-EVT-010'] },
  { ...samples.edr_handoff, hashes: ['b'.repeat(64)] },
  { ...samples.edr_handoff, deviceIds: ['M05-DEV-999'] },
  { ...samples.edr_handoff, recipient: ' ' },
  { ...samples.edr_handoff, recommendation: '' },
]) assert.throws(() => actions.append(stateApi.normalize({}, fixture), 'edr_handoff', timestamp, badDetails, fixture));
assert.throws(() => actions.append(handoffState, 'edr_handoff_status', timestamp, {
  handoffId: handoff.id, status: 'executed', updatedBy: 'lead',
}, fixture));
let boundedHandoffs = stateApi.normalize({}, fixture);
for (let index = 0; index < 55; index += 1) boundedHandoffs = actions.append(boundedHandoffs, 'edr_handoff', timestamp, samples.edr_handoff, fixture);
assert.strictEqual(boundedHandoffs.edrHandoffs.length, 50);
assert.strictEqual(stateApi.normalize(local(boundedHandoffs), fixture).edrHandoffs.length, 50);
const untrusted = local(handoffState);
untrusted.edrHandoffs.push({ ...handoff, eventIds: ['M05-EVT-010'] });
assert.strictEqual(stateApi.normalize(untrusted, fixture).edrHandoffs.length, 1, 'restore drops invalid fixture references');

for (const args of [
  [state, 'unknown_action', timestamp, { note: 'x' }, fixture],
  [state, 'device_review', '09/27/2026', { deviceId: 'ws-assess-27' }, fixture],
  [state, 'device_review', timestamp, {}, fixture],
  [state, 'device_review', timestamp, { deviceId: 'ws-assess-27', executableCommand: 'run' }, fixture],
  [state, 'device_review', timestamp, { deviceId: '' }, fixture],
  [state, 'analysis_note', timestamp, { text: 'x', relatedEventIds: [4] }, fixture],
  [state, 'evidence_package_preserved', timestamp, { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-010'], hashes: [] }, fixture],
  [state, 'evidence_package_preserved', timestamp, { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-003'], hashes: ['bad'] }, fixture],
  [state, 'device_review', timestamp, { deviceId: 'ws-assess-27' }, null],
]) assert.throws(() => actions.append(...args));
assert.strictEqual(actions.validTimestamp('2026-02-30T09:15:00Z'), false);

let truncated = stateApi.normalize({}, fixture);
for (let sequence = 1; sequence <= 205; sequence += 1) {
  truncated = actions.append(truncated, 'event_review', timestamp, { eventId: 'M05-EVT-001', status: `review-${sequence}` }, fixture);
}
assert.strictEqual(truncated.actionHistory.length, 200);
assert.strictEqual(truncated.actionHistory[0].sequence, 6);
assert.strictEqual(truncated.actionHistory.at(-1).sequence, 205);
assert.strictEqual(truncated.nextActionSequence, 206);
const afterTruncation = actions.append(truncated, 'event_review', timestamp, { eventId: 'M05-EVT-002', status: 'reviewed' }, fixture);
assert.strictEqual(afterTruncation.actionHistory.at(-1).id, `${fixture.scenario.id}:ACTION-000206`);
assert.strictEqual(afterTruncation.actionHistory.length, 200);

const restored = stateApi.normalize(local(afterTruncation), fixture);
assert.deepStrictEqual(local(restored), local(afterTruncation), 'typed history survives normalization and restore unchanged');
const appendedAfterRestore = actions.append(restored, 'case_update', timestamp, samples.case_update, fixture);
assert.strictEqual(appendedAfterRestore.actionHistory.at(-1).id, `${fixture.scenario.id}:ACTION-000207`);
// Entity identity migration: a legacy inventory id (or upper-case hostname) for a known device
// is recorded under the canonical lower-case hostname; unknown ids are still rejected.
for (const alias of ['M05-DEV-001', 'WS-ASSESS-27']) {
  const aliased = actions.append(stateApi.normalize({}, fixture), 'endpoint_isolation_request', timestamp,
    { deviceId: alias, reason: 'Containment review', requestedBy: 'analyst-1', status: 'pending_approval' }, fixture);
  assert.strictEqual(aliased.actionHistory.at(-1).details.deviceId, 'ws-assess-27');
  assert.strictEqual(aliased.approvalRequests.at(-1).deviceId, 'ws-assess-27');
}
console.log('M05 assessment action history: all checks passed');

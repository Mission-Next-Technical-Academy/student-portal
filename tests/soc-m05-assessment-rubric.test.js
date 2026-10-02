#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m05-assessment-data.js', 'soc-m05-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM05AssessmentData', context);
const rubric = vm.runInContext('SocM05AssessmentRubric', context);
const ids = (...values) => values;
const action = (type, details) => ({ type, details });
const outcomes = (state) => Object.fromEntries(rubric.extract(state, fixture).criteria.map((item) => [item.id, item.awarded]));
const complete = {
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [
    action('device_review', { deviceId: 'ws-assess-27', eventIds: ids('M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003') }),
    action('event_review', { eventId: 'M05-EVT-009' }),
    action('analysis_note', { text: 'Browser parent 4100 starts PowerShell 4172 which launches payload 4224. syncsvc.exe is malicious; AcmeUpdater is signed and benign.' }),
    action('analysis_note', { text: 'Run key persistence created under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SyncService. Detection only; execution was not prevented.' }),
    action('evidence_package_preserved', { deviceId: 'ws-assess-27', eventIds: ids('M05-EVT-003', 'M05-EVT-005', 'M05-EVT-006'), hashes: ['a'.repeat(64)] }),
  ],
  evidencePackage: { deviceId: 'ws-assess-27', eventIds: ids('M05-EVT-003', 'M05-EVT-005', 'M05-EVT-006'), hashes: ['a'.repeat(64)] },
  edrHandoffs: [{ id: 'handoff-1', deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-005', 'M05-EVT-007'], hashes: ['a'.repeat(64)], recommendation: 'Isolate the affected host and preserve evidence.' }],
  approvalRequests: [],
};
assert.deepStrictEqual(outcomes(complete), {
  'process-ancestry': true,
  'malicious-benign-interpretation': true,
  persistence: true,
  'prevention-detection': true,
  'affected-device-scope': true,
  'evidence-preservation': true,
  'response-handoff': true,
  'unsafe-action-boundary': true,
});

const partial = {
  actionHistory: [action('device_review', { deviceId: 'ws-assess-27', eventId: 'M05-EVT-001' })],
  edrHandoffs: [], approvalRequests: [],
};
const partialResult = rubric.extract(partial, fixture);
assert.strictEqual(partialResult.criteria.find((item) => item.id === 'process-ancestry').awarded, false);
assert.strictEqual(partialResult.criteria.find((item) => item.id === 'process-ancestry').misses.length, 1);
assert.strictEqual(partialResult.criteria.find((item) => item.id === 'affected-device-scope').awarded, true);
assert.strictEqual(partialResult.criteria.find((item) => item.id === 'persistence').awarded, false);
const ancestryOnly = {
  actionHistory: [action('analysis_note', { text: 'Browser 4100 parent to PowerShell 4172 then payload 4224 ancestry.' }),
    action('analysis_note', { text: 'AcmeUpdater is signed and benign.' })],
};
assert.strictEqual(outcomes(ancestryOnly)['malicious-benign-interpretation'], false, 'process ancestry alone does not prove file reputation');

const unsafe = {
  ...complete,
  approvalRequests: [{ type: 'endpoint_isolation_request', deviceId: 'ws-assess-14', status: 'approved', reason: 'Containment', requestedBy: 'analyst' }],
};
assert.strictEqual(outcomes(unsafe)['unsafe-action-boundary'], false, 'out-of-scope execution/approval is flagged');
assert.strictEqual(outcomes({ ...complete, edrHandoffs: [{ ...complete.edrHandoffs[0], deviceIds: ['ws-assess-27', 'ws-assess-14'] }] })['affected-device-scope'], false);

const alternate = {
  actionHistory: [action('analysis_note', { text: 'PID 4100 parent to PID 4172 child to PID 4224 ancestry; malicious payload; AcmeUpdater signed updater benign; HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SyncService registry persistence created; detected but not prevented.' })],
  selectedDeviceIds: ['ws-assess-27'], approvalRequests: [], edrHandoffs: [],
};
assert.deepStrictEqual(outcomes(alternate), {
  'process-ancestry': true,
  'malicious-benign-interpretation': true,
  persistence: true,
  'prevention-detection': true,
  'affected-device-scope': true,
  'evidence-preservation': false,
  'response-handoff': false,
  'unsafe-action-boundary': true,
});

const snapshot = JSON.stringify(complete);
rubric.extract(complete, fixture);
assert.strictEqual(JSON.stringify(complete), snapshot, 'extraction does not mutate supplied state');
assert.strictEqual(rubric.extract(null, fixture).criteria.length, rubric.RUBRIC.length);
assert.strictEqual(rubric.extract({}, null).criteria.every((item) => !item.awarded), true, 'missing fixture is handled as empty evidence');
const invalidState = rubric.extract({ actionHistory: 'invalid', selectedDeviceIds: 'invalid' }, fixture);
assert.strictEqual(invalidState.criteria.find((item) => item.id === 'process-ancestry').awarded, false);
assert.strictEqual(invalidState.criteria.find((item) => item.id === 'unsafe-action-boundary').awarded, true);
assert.strictEqual(rubric.RUBRIC.length, 8);
console.log('M05 assessment rubric extraction: all checks passed');

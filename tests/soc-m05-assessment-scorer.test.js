#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m05-assessment-data.js', 'soc-m05-assessment-rubric.js', 'soc-m05-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const scorer = vm.runInContext('SocM05AssessmentScorer', context);
const fixture = vm.runInContext('SocM05AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const action = (type, details) => ({ type, details });
const fullState = () => ({
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [
    action('device_review', { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003'] }),
    action('analysis_note', { text: 'Browser parent 4100 starts PowerShell 4172 which launches payload 4224. syncsvc.exe is malicious; AcmeUpdater is signed and benign.' }),
    action('analysis_note', { text: 'Run key persistence created under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SyncService. Detection only; execution was not prevented.' }),
    action('evidence_package_preserved', { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-003', 'M05-EVT-005', 'M05-EVT-006'], hashes: ['a'.repeat(64)] }),
  ],
  evidencePackage: { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-003', 'M05-EVT-005', 'M05-EVT-006'], hashes: ['a'.repeat(64)] },
  edrHandoffs: [{ id: 'handoff-1', deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-005', 'M05-EVT-007'], hashes: ['a'.repeat(64)], recommendation: 'Isolate the affected host and preserve evidence.' }],
  approvalRequests: [],
});

const full = fullState();
const snapshot = local(full);
const perfect = scorer.score(full, fixture);
assert.strictEqual(perfect.score, 100);
assert.strictEqual(perfect.rawScore, 100);
assert.strictEqual(perfect.maxScore, 100);
assert.strictEqual(perfect.passed, true);
assert.strictEqual(perfect.review.cap, null);
assert.strictEqual(perfect.assessmentId, fixture.scenario.id);
assert.deepStrictEqual(local(full), snapshot, 'scoring leaves supplied state unchanged');
assert(perfect.criteria.every((item) => item.supportingEvidence.length && item.feedback && item.awards.length), 'instructor payload explains every criterion');

const partialState = { actionHistory: [action('event_review', { eventId: 'M05-EVT-001' })], approvalRequests: [], edrHandoffs: [] };
const partial = scorer.score(partialState, fixture);
assert(partial.criteria.some((item) => item.points > 0 && item.points < item.max), 'relevant but incomplete evidence earns bounded partial credit');
assert(partial.review.misses.length > 0);
assert(partial.criteria.every((item) => item.misses.length || item.points === item.max), 'missed criteria remain explainable');

for (const id of ['persistence', 'prevention-detection', 'affected-device-scope']) {
  const missed = scorer.score({ actionHistory: [], selectedDeviceIds: [], approvalRequests: [], edrHandoffs: [] }, fixture);
  assert.strictEqual(missed.criteria.find((item) => item.id === id).points, 0, `${id} critical miss receives no points`);
}

const unsafe = fullState();
unsafe.approvalRequests = [{ type: 'endpoint_isolation_request', deviceId: 'ws-assess-14', status: 'approved', reason: 'Containment', requestedBy: 'analyst' }];
const capped = scorer.score(unsafe, fixture);
assert.strictEqual(capped.rawScore, 90);
assert.strictEqual(capped.score, scorer.SAFETY_CAP);
assert.strictEqual(capped.passed, false);
assert.strictEqual(capped.review.cap.applied, true);
assert(capped.criticalMisses.length === 1);
for (const status of ['approved', 'executed']) {
  const unsafeResponse = fullState();
  unsafeResponse.approvalRequests = [{ type: 'endpoint_isolation_request', deviceId: 'ws-assess-27', status, reason: 'Containment', requestedBy: 'analyst' }];
  const result = scorer.score(unsafeResponse, fixture);
  assert.strictEqual(result.score, scorer.SAFETY_CAP, `${status} response remains capped below passing`);
  assert.strictEqual(result.passed, false);
}
const pendingResponse = scorer.score(fullState(), fixture);
assert.strictEqual(pendingResponse.criteria.find((item) => item.id === 'unsafe-action-boundary').points, 10,
  'a supported pending approval request earns the safety-boundary criterion');

const alternatePath = {
  ...fullState(),
  evidencePackage: null,
  actionHistory: [...fullState().actionHistory.filter((item) => item.type !== 'evidence_package_preserved'),
    action('evidence_package_preserved', { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-005'], hashes: ['a'.repeat(64)] })],
};
assert.strictEqual(scorer.score(alternatePath, fixture).criteria.find((item) => item.id === 'evidence-preservation').points, 10,
  'typed preservation audit history is accepted as an alternate evidence path');
assert.deepStrictEqual(local(scorer.score(full, fixture)), local(perfect), 'scoring is deterministic');
const empty = scorer.score({}, fixture);
assert.strictEqual(empty.score, 10, 'absence of unsafe actions earns the safety-boundary points');
assert(empty.criteria.filter((item) => item.id !== 'unsafe-action-boundary').every((item) => item.points === 0));
assert.strictEqual(empty.passed, false);
assert.strictEqual(scorer.CRITERIA.reduce((sum, item) => sum + item.weight, 0), 100);

const criterion = (result, id) => result.criteria.find((item) => item.id === id);
const ancestryPivot = scorer.score({
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [
    action('event_review', { eventId: 'M05-EVT-001' }),
    action('event_review', { eventId: 'M05-EVT-002' }),
    action('event_review', { eventId: 'M05-EVT-003' }),
    action('event_review', { eventId: 'M05-EVT-004' }),
    action('event_review', { eventId: 'M05-EVT-005' }),
    action('event_review', { eventId: 'M05-EVT-008' }),
  ],
}, fixture);
assert.strictEqual(criterion(ancestryPivot, 'process-ancestry').points, 15,
  'the complete linked process-event pivot earns full ancestry credit without a prose note');
assert.deepStrictEqual(local(criterion(ancestryPivot, 'process-ancestry').supportingEvidence),
  ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003']);
assert.strictEqual(criterion(ancestryPivot, 'malicious-benign-interpretation').points, 15,
  'malicious and benign file event pivots independently support interpretation');
assert(criterion(ancestryPivot, 'malicious-benign-interpretation').feedback);

const correctedAnalysis = scorer.score({
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [
    action('analysis_note', { text: 'AcmeUpdater is malicious; quarantine AcmeUpdater.' }),
    action('event_review', { eventId: 'M05-EVT-003' }),
    action('event_review', { eventId: 'M05-EVT-004' }),
    action('event_review', { eventId: 'M05-EVT-005' }),
    action('event_review', { eventId: 'M05-EVT-008' }),
    action('event_review', { eventId: 'M05-EVT-009' }),
    action('analysis_note', { text: 'Correction: syncsvc.exe is malicious based on its hash and reputation; AcmeUpdater is signed and benign, and must not be quarantined.' }),
  ],
}, fixture);
assert.strictEqual(criterion(correctedAnalysis, 'malicious-benign-interpretation').points, 15,
  'an explicit later correction supersedes a stale mistaken interpretation');
assert.deepStrictEqual(local(criterion(correctedAnalysis, 'malicious-benign-interpretation').misses), []);
assert(criterion(correctedAnalysis, 'malicious-benign-interpretation').supportingEvidence.length);

const independentPartial = scorer.score({
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [action('event_review', { eventId: 'M05-EVT-001' })],
}, fixture);
assert.strictEqual(criterion(independentPartial, 'process-ancestry').points, 7,
  'one relevant ancestry event receives half of the 15-point criterion');
assert(criterion(independentPartial, 'process-ancestry').supportingEvidence.includes('M05-EVT-001'));
assert(criterion(independentPartial, 'process-ancestry').misses.length,
  'partial ancestry credit retains an actionable criterion-level miss');
assert(criterion(independentPartial, 'process-ancestry').feedback.includes('partial evidence'));

const missedOutcomes = scorer.score({
  selectedDeviceIds: ['ws-assess-27'],
  actionHistory: [action('event_review', { eventId: 'M05-EVT-001' })],
}, fixture);
for (const [id, feedbackText] of [
  ['persistence', 'Run-key persistence'],
  ['prevention-detection', 'detected execution but did not prevent'],
]) {
  const outcome = criterion(missedOutcomes, id);
  assert.strictEqual(outcome.points, 0, `${id} is not inferred when its outcome was missed`);
  assert(outcome.misses.some((miss) => miss.includes(feedbackText)), `${id} explains the missing outcome`);
  assert(outcome.feedback.includes('required evidence is missing'));
}
// Entity identity migration: the same learner picks recorded with the legacy inventory ids
// (M05-DEV-001 / M05-DEV-002) or upper-case hostnames score exactly the same as the canonical
// lower-case hostnames (ws-assess-27 / ws-assess-14).
const toLegacy = (state, map) => JSON.parse(Object.entries(map).reduce((text, [from, to]) => text.split(`"${from}"`).join(`"${to}"`), JSON.stringify(state)));
const outOfScope = { ...fullState(), approvalRequests: [{ type: 'endpoint_isolation_request', deviceId: 'ws-assess-14', status: 'pending_approval', reason: 'Containment', requestedBy: 'analyst' }] };
for (const state of [fullState(), partialState, outOfScope, { ...fullState(), edrHandoffs: [] }]) {
  const canonical = local(scorer.score(state, fixture));
  for (const map of [{ 'ws-assess-27': 'M05-DEV-001', 'ws-assess-14': 'M05-DEV-002' }, { 'ws-assess-27': 'WS-ASSESS-27', 'ws-assess-14': 'WS-ASSESS-14' }]) {
    assert.deepStrictEqual(local(scorer.score(toLegacy(state, map), fixture)), canonical, 'legacy device identifiers score identically');
  }
}
console.log('M05 assessment scorer tests passed.');

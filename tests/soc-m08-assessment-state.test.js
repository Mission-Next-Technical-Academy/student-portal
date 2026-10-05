#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const records = new Map();
const calls = [];
const context = { LabRuntime: {
  loadCaseState(stateKey, moduleKey, user, defaults) {
    calls.push(['load', stateKey, moduleKey]);
    return records.get(`${stateKey}:${moduleKey}:${user.id}`) ?? JSON.parse(JSON.stringify(defaults));
  },
  saveCaseState(stateKey, moduleKey, user, state) {
    calls.push(['save', stateKey, moduleKey]);
    records.set(`${stateKey}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(state)));
    return state;
  },
  resetCaseState(stateKey, moduleKey, user, defaults) {
    calls.push(['reset', stateKey, moduleKey]);
    records.set(`${stateKey}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(defaults)));
  },
} };
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m08-assessment-data.js', 'soc-m08-assessment-state.js', 'soc-m08-assessment-actions.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const api = vm.runInContext('SocM08AssessmentState', context);
const fixture = vm.runInContext('SocM08AssessmentData', context);
const actions = vm.runInContext('SocM08AssessmentActions', context);
const scenario = fixture.scenario;
const user = { id: 'learner-1' };

assert.strictEqual(api.VERSION, 1);
assert.strictEqual(api.MODULE_KEY, 'soc-08');
assert.ok(Object.isFrozen(api.EMPTY_DEFAULTS));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({}, fixture))), {
  findingReviews: [], remediationDecisions: [], remediationTransitions: [], incidentLinks: [], riskAcceptances: [], escalations: [], actionHistory: [], nextActionSequence: 1,
  schemaVersion: 1, scenarioId: scenario.id,
});
assert.throws(() => api.normalize({}, { scenario: { ...scenario, stateKey: '' } }), /stateKey/);
assert.throws(() => api.normalize({ scenarioId: 'foreign' }, fixture), /different scenario/);
assert.throws(() => api.normalize({ schemaVersion: 2 }, fixture), /newer/);

const review = { findingId: 'M08-FINDING-001', status: 'reviewed',
  evidenceIds: ['M08-EVID-001'], notes: 'Validated current finding.' };
const decision = { findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress',
  ownerId: 'p.diallo', dueDate: '2026-09-28', rationale: 'Confirmed exposure requires urgent remediation.',
  evidenceIds: ['M08-EVID-002'] };
const original = { findingReviews: [{ ...review, timestamp: '2026-09-27T10:50:00.000Z' }],
  remediationDecisions: [{ ...decision, timestamp: '2026-09-27T10:51:00.000Z' }] };
const normalized = api.normalize(original, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.findingReviews[0])), {
  ...review, actionId: `${scenario.id}:ACTION-000001`, timestamp: '2026-09-27T10:50:00.000Z',
});
assert.strictEqual(normalized.scenarioId, scenario.id);
assert.strictEqual(normalized.schemaVersion, api.VERSION);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(normalized, fixture))),
  JSON.parse(JSON.stringify(normalized)), 'legacy projection migration is idempotent');
const authoritative = api.normalize({ ...normalized,
  findingReviews: [{ ...review, status: 'not-applicable', evidenceIds: ['M08-EVID-008'] }] }, fixture);
assert.strictEqual(authoritative.findingReviews[0].status, 'reviewed', 'history is the projection source of truth');

const history = normalized.actionHistory;
for (const mutate of [
  (copy) => { copy.actionHistory[0].type = 'unknown'; },
  (copy) => { copy.actionHistory[0].timestamp = '2026-09-27T11:00:00.001Z'; },
  (copy) => { copy.actionHistory[0].sequence = 0; },
  (copy) => { copy.actionHistory[0].id = 'foreign:ACTION-000001'; },
  (copy) => { copy.actionHistory[0].details.evidenceIds = ['M07-EVID-001']; },
  (copy) => { copy.actionHistory[0].scenarioId = 'foreign'; },
]) {
  const copy = JSON.parse(JSON.stringify(normalized));
  mutate(copy);
  assert.throws(() => api.normalize(copy, fixture), /invalid or foreign action/);
}
assert.throws(() => api.normalize({ ...normalized, nextActionSequence: 2 }, fixture), /not monotonic/);
assert.throws(() => api.normalize({ ...normalized, schemaVersion: 2 }, fixture), /newer/);
assert.throws(() => api.normalize({ ...normalized, scenarioId: 'M07-OTHER' }, fixture), /different scenario/);

const transitioned = vm.runInContext(`(() => {
  let state = SocM08AssessmentActions.append(SocM08AssessmentState.normalize({}, SocM08AssessmentData),
    'remediation_decision', '2026-09-27T10:51:00.000Z', ${JSON.stringify(decision)}, SocM08AssessmentData);
  const current = state.remediationDecisions[0];
  state = SocM08AssessmentActions.append(state, 'remediation_transition', '2026-09-27T10:52:00.000Z', {
    findingId: current.findingId, priority: current.priority, fromStatus: current.status, toStatus: 'resolved',
    ownerId: current.ownerId, dueDate: current.dueDate, rationale: current.rationale,
    evidenceIds: current.evidenceIds, transitionRationale: 'Retest confirms the affected service is patched and no longer exposed.',
  }, SocM08AssessmentData);
  return SocM08AssessmentState.normalize(JSON.parse(JSON.stringify(state)), SocM08AssessmentData);
})()`, context);
assert.strictEqual(transitioned.remediationDecisions[0].status, 'resolved');
assert.strictEqual(transitioned.remediationTransitions[0].fromStatus, 'in-progress');
assert.strictEqual(transitioned.remediationDecisions[0].priority, decision.priority);
assert.strictEqual(transitioned.remediationDecisions[0].ownerId, decision.ownerId);
assert.deepStrictEqual(JSON.parse(JSON.stringify(transitioned.remediationDecisions[0].evidenceIds)), decision.evidenceIds);
assert.strictEqual(transitioned.actionHistory.length, 2);
assert.ok(Object.isFrozen(transitioned.actionHistory[1]));
assert.ok(Object.isFrozen(transitioned.actionHistory[1].details));
const forgedTransition = JSON.parse(JSON.stringify(transitioned));
forgedTransition.actionHistory[1].details.ownerId = 'owner-tampered';
assert.throws(() => api.normalize(forgedTransition, fixture), /invalid or foreign action/);
const wrongStatusChain = JSON.parse(JSON.stringify(transitioned));
wrongStatusChain.actionHistory[1].details.fromStatus = 'open';
assert.throws(() => api.normalize(wrongStatusChain, fixture), /invalid or foreign action/);
const forgedProjection = JSON.parse(JSON.stringify(transitioned));
forgedProjection.remediationDecisions[0].status = 'open';
assert.strictEqual(api.normalize(forgedProjection, fixture).remediationDecisions[0].status, 'resolved');

let corrected = actions.append(api.normalize({}, fixture), 'remediation_decision',
  '2026-09-27T10:51:00.000Z', decision, fixture);
corrected = actions.append(corrected, 'remediation_decision', '2026-09-27T10:52:00.000Z', {
  ...decision, priority: 'high', rationale: 'Corrected after confirming control evidence and residual public exposure.',
}, fixture);
const restoredCorrection = api.normalize(JSON.parse(JSON.stringify(corrected)), fixture);
assert.strictEqual(restoredCorrection.remediationDecisions.length, 2);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredCorrection.remediationDecisions)),
  JSON.parse(JSON.stringify(corrected.remediationDecisions)), 'corrected decision audit survives serialized restore');
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(restoredCorrection, fixture))),
  JSON.parse(JSON.stringify(restoredCorrection)), 'corrected decision restore is idempotent');
assert.deepStrictEqual(restoredCorrection.actionHistory.map((item) => item.sequence), [1, 2]);

const tooManyHistory = Array.from({ length: api.LIMITS.actionHistory + 5 }, (_, i) => ({
  id: `${scenario.id}:ACTION-${String(i + 1).padStart(6, '0')}`, sequence: i + 1,
  type: 'finding_review', timestamp: '2026-09-27T10:50:00.000Z', details: review,
}));
const bounded = api.normalize({ actionHistory: tooManyHistory, nextActionSequence: tooManyHistory.length + 1 }, fixture);
assert.strictEqual(bounded.actionHistory.length, api.LIMITS.actionHistory);
assert.strictEqual(bounded.actionHistory[0].sequence, 6);
assert.strictEqual(bounded.nextActionSequence, tooManyHistory.length + 1);

const otherStateKey = `${scenario.stateKey}:other`;
records.set(`${otherStateKey}:${api.MODULE_KEY}:${user.id}`, { marker: 'untouched' });
api.save(user, original, fixture);
const storageKey = `${scenario.stateKey}:${api.MODULE_KEY}:${user.id}`;
assert.ok(records.has(storageKey));
assert.deepStrictEqual(records.get(`${otherStateKey}:${api.MODULE_KEY}:${user.id}`), { marker: 'untouched' });
const loaded = api.load(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded.findingReviews)), JSON.parse(JSON.stringify(normalized.findingReviews)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded.remediationDecisions)), JSON.parse(JSON.stringify(normalized.remediationDecisions)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(transitioned, fixture).remediationTransitions)),
  JSON.parse(JSON.stringify(transitioned.remediationTransitions)));
const linkedAndAccepted = vm.runInContext(`(() => {
  const api = SocM08AssessmentActions;
  let state = SocM08AssessmentState.normalize({}, SocM08AssessmentData);
  state = api.append(state, 'incident_link', '2026-09-27T10:52:00.000Z', {
    findingId: 'M08-FINDING-001', incidentId: 'M08-INCIDENT-001', evidenceIds: ['M08-INC-EVID-001'],
    rationale: 'Incident evidence tracks review of this public service finding.',
  }, SocM08AssessmentData);
  state = api.append(state, 'risk_acceptance', '2026-09-27T10:53:00.000Z', {
    findingId: 'M08-FINDING-002', dispositionId: 'M08-RISK-DISP-001', evidenceIds: ['M08-RISK-EVID-001'],
    rationale: 'Temporary acceptance is explicitly approved during validation.',
  }, SocM08AssessmentData);
  state = api.append(state, 'escalation', '2026-09-27T10:54:00.000Z', {
    findingId: 'M08-FINDING-001', routeId: 'security-lead-review', ownerId: 'p.diallo', dueDate: '2026-09-28',
    evidenceIds: ['M08-EVID-003'], rationale: 'Public exposure merits a documented security lead review.',
  }, SocM08AssessmentData);
  return SocM08AssessmentState.normalize(JSON.parse(JSON.stringify(state)), SocM08AssessmentData);
})()`, context);
assert.strictEqual(linkedAndAccepted.incidentLinks[0].findingId, 'M08-FINDING-001');
assert.strictEqual(linkedAndAccepted.riskAcceptances[0].evidenceIds[0], 'M08-RISK-EVID-001');
assert.strictEqual(linkedAndAccepted.escalations[0].routeId, 'security-lead-review');
assert.strictEqual(linkedAndAccepted.actionHistory.length, 3);
assert.ok(calls.some(([kind, key, module]) => kind === 'load' && key === scenario.stateKey && module === api.MODULE_KEY));
const reset = api.reset(user, fixture);
assert.strictEqual(reset.scenarioId, scenario.id);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset.findingReviews)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture))), JSON.parse(JSON.stringify(reset)));
assert.deepStrictEqual(calls.slice(-3).map(([kind]) => kind), ['reset', 'save', 'load']);

console.log('M08 assessment state contract: all checks passed');

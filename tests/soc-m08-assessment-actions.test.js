#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m08-assessment-data.js', 'soc-m08-assessment-state.js', 'soc-m08-assessment-actions.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM08AssessmentData', context);
const stateApi = vm.runInContext('SocM08AssessmentState', context);
const actions = vm.runInContext('SocM08AssessmentActions', context);
const initial = stateApi.normalize({}, fixture);
const review = { findingId: 'M08-FINDING-001', status: 'reviewed',
  evidenceIds: ['M08-EVID-001', 'M08-EVID-002'], notes: 'Version and applicability verified.' };
const decision = { findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress',
  ownerId: 'p.diallo', dueDate: '2026-09-28', rationale: 'Internet exposure and confirmed applicability require urgent remediation.',
  evidenceIds: ['M08-EVID-002', 'M08-ASSET-EVID-002'] };

assert.deepStrictEqual(Array.from(actions.TYPES), ['finding_review', 'remediation_decision', 'remediation_transition', 'incident_link', 'risk_acceptance', 'escalation']);
assert.strictEqual(actions.canonicalTimestamp('2026-09-27T10:50:00.000Z', fixture.scenario), true);
assert.strictEqual(actions.canonicalTimestamp('2026-09-27T10:50:00Z', fixture.scenario), false);
assert.strictEqual(actions.canonicalTimestamp('2026-09-27T11:00:00.001Z', fixture.scenario), false);
assert.strictEqual(actions.validDetails('finding_review', review, fixture), true);
assert.strictEqual(actions.validDetails('remediation_decision', decision, fixture), true);
const incidentLink = { findingId: 'M08-FINDING-001', incidentId: 'M08-INCIDENT-001',
  evidenceIds: ['M08-INC-EVID-001'], rationale: 'Incident tracks review of this confirmed public service finding.' };
const riskAcceptance = { findingId: 'M08-FINDING-002', dispositionId: 'M08-RISK-DISP-001',
  evidenceIds: ['M08-RISK-EVID-001'], rationale: 'Temporary acceptance is explicitly approved during applicability validation.' };
const escalation = { findingId: 'M08-FINDING-001', routeId: 'security-lead-review', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'Public exposure and confirmed applicability need security lead review.',
  evidenceIds: ['M08-EVID-003', 'M08-ASSET-EVID-002'] };
assert.strictEqual(actions.validDetails('incident_link', incidentLink, fixture), true);
assert.strictEqual(actions.validDetails('risk_acceptance', riskAcceptance, fixture), true);
assert.strictEqual(actions.validDetails('escalation', escalation, fixture), true);
for (const bad of [
  { ...review, findingId: 'M07-FINDING-001' },
  { ...review, evidenceIds: ['M08-EVID-006'] },
  { ...review, evidenceIds: ['M08-EVID-001', 'M08-EVID-001'] },
  { ...review, status: 'confirmed-compromised' },
  { ...review, extra: true },
]) assert.strictEqual(actions.validDetails('finding_review', bad, fixture), false);
for (const bad of [
  { ...decision, findingId: 'foreign-finding' },
  { ...decision, priority: 'urgent' },
  { ...decision, ownerId: '' },
  { ...decision, dueDate: '2026-02-30' },
  { ...decision, evidenceIds: ['M08-ASSET-EVID-005'] },
  { ...decision, rationale: 'too short' },
]) assert.strictEqual(actions.validDetails('remediation_decision', bad, fixture), false);
for (const bad of [
  { ...decision, ownerId: 'unlisted.owner' },
  { ...decision, dueDate: '2026-09-26' },
  { ...decision, dueDate: '2026-02-30' },
  { ...escalation, ownerId: 'unlisted.owner' },
  { ...escalation, routeId: 'foreign-route' },
  { ...escalation, dueDate: '2026-02-30' },
  { ...escalation, dueDate: '2026-09-26' },
  { ...escalation, dueDate: '2026-09-28T00:00:00Z' },
  { ...escalation, evidenceIds: ['M08-EVID-002'] },
  { ...escalation, evidenceIds: ['M08-M07-EVID-001'] },
  { ...escalation, rationale: 'urgent' },
]) assert.strictEqual(actions.validDetails(bad.findingId === escalation.findingId && bad.routeId ? 'escalation' : 'remediation_decision', bad, fixture), false);
assert.strictEqual(actions.validDetails('incident_link', { ...incidentLink, incidentId: 'M07-INC-001' }, fixture), false);
assert.strictEqual(actions.validDetails('incident_link', { ...incidentLink, evidenceIds: ['M08-EVID-001'] }, fixture), false);
assert.strictEqual(actions.validDetails('risk_acceptance', { ...riskAcceptance, findingId: 'M08-FINDING-001' }, fixture), false,
  'a finding without explicit supported disposition cannot be accepted');
assert.strictEqual(actions.validDetails('risk_acceptance', { ...riskAcceptance, evidenceIds: ['M08-INC-EVID-001'] }, fixture), false);
assert.strictEqual(actions.validDetails('risk_acceptance', { ...riskAcceptance, rationale: 'short' }, fixture), false);
assert.throws(() => actions.append(initial, 'finding_review', '2026-09-27T10:50:00Z', review, fixture), /timestamp/);
assert.throws(() => actions.append(initial, 'finding_review', '2026-09-27T11:00:00.001Z', review, fixture), /timestamp/);

const afterReview = actions.append(initial, 'finding_review', '2026-09-27T10:50:00.000Z', review, fixture);
const afterDecision = actions.append(afterReview, 'remediation_decision', '2026-09-27T10:51:00.000Z', decision, fixture);
const transition = { findingId: decision.findingId, priority: decision.priority, fromStatus: 'in-progress',
  toStatus: 'resolved', ownerId: decision.ownerId, dueDate: decision.dueDate, rationale: decision.rationale,
  evidenceIds: decision.evidenceIds, transitionRationale: 'Retest confirms the affected service is patched and no longer exposed.' };
assert.strictEqual(actions.validDetails('remediation_transition', transition, fixture), true);
assert.strictEqual(actions.validDetails('remediation_transition', { ...transition, toStatus: 'accepted-risk' }, fixture), true,
  'in-progress to accepted-risk is allowed');
assert.strictEqual(actions.validDetails('remediation_transition', { ...transition, fromStatus: 'open', toStatus: 'resolved' }, fixture), false,
  'open cannot skip directly to resolved');
assert.throws(() => actions.append(afterDecision, 'remediation_transition', '2026-09-27T10:51:30.000Z',
  { ...transition, fromStatus: 'open', toStatus: 'in-progress' }, fixture), /current decision state/);
const afterTransition = actions.append(afterDecision, 'remediation_transition', '2026-09-27T10:51:30.000Z', transition, fixture);
const afterLink = actions.append(afterDecision, 'incident_link', '2026-09-27T10:52:00.000Z', incidentLink, fixture);
const afterAcceptance = actions.append(afterLink, 'risk_acceptance', '2026-09-27T10:53:00.000Z', riskAcceptance, fixture);
const afterEscalation = actions.append(afterAcceptance, 'escalation', '2026-09-27T10:54:00.000Z', escalation, fixture);
assert.deepStrictEqual(Array.from(afterDecision.actionHistory, (item) => item.id), [
  'M08-ASSESS-2026-09-27:ACTION-000001', 'M08-ASSESS-2026-09-27:ACTION-000002',
]);
assert.deepStrictEqual(Array.from(afterDecision.actionHistory, (item) => item.type), ['finding_review', 'remediation_decision']);
assert.strictEqual(afterDecision.findingReviews[0].status, 'reviewed');
assert.strictEqual(afterDecision.remediationDecisions[0].priority, 'critical');
assert.strictEqual(afterTransition.remediationDecisions[0].status, 'resolved');
assert.strictEqual(afterTransition.remediationDecisions[0].ownerId, decision.ownerId);
assert.deepStrictEqual(Array.from(afterTransition.remediationTransitions[0].evidenceIds), decision.evidenceIds);
assert.strictEqual(afterTransition.actionHistory[2].type, 'remediation_transition');
assert.ok(Object.isFrozen(afterTransition.actionHistory[2].details));
assert.strictEqual(afterDecision.nextActionSequence, 3);
assert.strictEqual(afterAcceptance.incidentLinks[0].incidentId, 'M08-INCIDENT-001');
assert.strictEqual(afterAcceptance.riskAcceptances[0].dispositionId, 'M08-RISK-DISP-001');
assert.strictEqual(afterAcceptance.nextActionSequence, 5);
assert.strictEqual(afterEscalation.escalations[0].ownerId, 'p.diallo');
assert.strictEqual(afterEscalation.escalations[0].dueDate, '2026-09-28');
assert.strictEqual(afterEscalation.nextActionSequence, 6);
assert.ok(Object.isFrozen(afterDecision.actionHistory[0]));
assert.ok(Object.isFrozen(afterDecision.actionHistory[0].details));
assert.notStrictEqual(afterDecision.actionHistory[0].details, review);
assert.strictEqual(initial.actionHistory.length, 0);
const revised = actions.append(afterDecision, 'finding_review', '2026-09-27T10:52:00.000Z',
  { ...review, status: 'needs-validation' }, fixture);
assert.strictEqual(revised.findingReviews.length, 1);
assert.strictEqual(revised.findingReviews[0].status, 'needs-validation');
assert.strictEqual(revised.actionHistory.length, 3);

const correctedDecision = actions.append(afterDecision, 'remediation_decision', '2026-09-27T10:52:00.000Z', {
  ...decision, priority: 'high', rationale: 'Revised after validating the mitigating control and residual exposure.',
}, fixture);
assert.strictEqual(correctedDecision.remediationDecisions.length, 2,
  'priority corrections append an audited decision rather than overwriting history');
assert.strictEqual(correctedDecision.remediationDecisions.at(-1).priority, 'high');
assert.strictEqual(correctedDecision.actionHistory.at(-1).details.priority, 'high');
assert.strictEqual(correctedDecision.nextActionSequence, 4);

console.log('M08 assessment typed actions: all checks passed');

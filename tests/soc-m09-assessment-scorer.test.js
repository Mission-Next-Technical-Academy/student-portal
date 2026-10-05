#!/usr/bin/env node
// Scores M09 states built only through the engine API the workspaces use.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const context = { console };
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m09-assessment-data.js', 'soc-m09-assessment-state.js', 'soc-m09-assessment-rubric.js', 'soc-m09-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const { api, fixture, scorer } = vm.runInContext('({ api: SocM09AssessmentState, fixture: SocM09AssessmentData, scorer: SocM09AssessmentScorer })', context);
const incident = 'INC-4937';
let clock = Date.parse('2026-09-27T10:03:00.000Z');
const at = () => { clock += 15000; return new Date(clock).toISOString(); };
const outcome = (type, entityId) => fixture.scenario.actionOutcomeExamples.find((item) => item.action === type && item.entityId === entityId)?.outcome || 'success';
const approveAndRun = (state, type, target, approvalType = type) => {
  let next = api.updateIncidentWorkflow(state, incident, { approvalStatus: 'pending', approvalReason: 'Scoped request.', approvalTargetId: target, approvalActionType: approvalType }, at(), fixture);
  next = api.updateIncidentWorkflow(next, incident, { approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Approved.' }, at(), fixture);
  return api.executeApprovedAction(next, incident, { type, outcome: outcome(type, target), details: { entityId: target, incidentId: incident } }, at(), fixture);
};

const empty = scorer.score(api.normalize({}, fixture), fixture);
assert.strictEqual(empty.score, 0, 'no response work earns no credit');

let state = api.normalize({}, fixture);
state = api.updateIncidentWorkflow(state, incident, { severity: 'critical', assigneeId: 'ir-lead-owners', status: 'investigating' }, at(), fixture);
state = api.transition(state, { reviewedEvidenceIds: ['M09-E01', 'M09-E06', 'M09-E09', 'M09-E10'] }, fixture);
state = api.completeIncidentTask(state, incident, 'M09-TASK-001', { note: 'Evidence preserved.', evidenceIds: ['M09-E01'] }, at(), fixture);
state = api.updateIncidentWorkflow(state, incident, { escalationStatus: 'escalated', escalationReason: 'Service and credential exposure remain unverified.' }, at(), fixture);
state = approveAndRun(state, 'isolate_endpoint', 'ws-173');
state = approveAndRun(state, 'revoke_session', 'session-173-REMOTE');
state = approveAndRun(state, 'disable_identity', 'acct-173');
assert.strictEqual(state.actionHistory.at(-1).outcome, 'failure', 'the case records the account disable as failed');
state = approveAndRun(state, 'remove_persistence', 'persist-runkey-173');
state = api.selectRecoveryPoint(state, incident, 'RP-WS-173-0918', at(), fixture);
let recovery = api.updateIncidentWorkflow(state, incident, { approvalStatus: 'pending', approvalReason: 'Restore.', approvalTargetId: 'DEV-173', approvalActionType: 'restore_backup' }, at(), fixture);
recovery = api.updateIncidentWorkflow(recovery, incident, { approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Approved restore.' }, at(), fixture);
for (const type of ['restore_backup', 'scan_recovery', 'validate_recovery']) {
  recovery = api.executeApprovedAction(recovery, incident, { type, outcome: 'success', details: { entityId: 'DEV-173', incidentId: incident } }, at(), fixture);
}
recovery = api.completeRecoveryMonitoring(recovery, incident, 'DEV-173', at(), [], fixture);
const full = scorer.score(recovery, fixture);
assert.strictEqual(full.score, 100, `a complete, ordered response earns full credit: ${JSON.stringify(full.criteria.map((c) => [c.id, c.points]))}`);
assert.strictEqual(full.passed, true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(scorer.score(recovery, fixture))), JSON.parse(JSON.stringify(full)), 'scoring is deterministic');

// Eradicating before preserving evidence loses that criterion.
clock = Date.parse('2026-09-27T10:03:00.000Z');
let rushed = api.normalize({}, fixture);
rushed = approveAndRun(rushed, 'remove_persistence', 'persist-runkey-173');
rushed = api.completeIncidentTask(rushed, incident, 'M09-TASK-001', { note: 'Preserved late.', evidenceIds: ['M09-E01'] }, at(), fixture);
const rushedScore = scorer.score(rushed, fixture);
assert.strictEqual(rushedScore.criteria.find((c) => c.id === 'evidence-before-eradication').points, 0, 'evidence preserved after eradication earns nothing');
assert.ok(rushedScore.criteria.find((c) => c.id === 'identity-and-persistence').points > 0, 'the persistence removal itself still counts');
console.log('M09 assessment scorer: all checks passed');

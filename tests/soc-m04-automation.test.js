#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const context = {};
vm.createContext(context);
for (const file of ['soc-m04-assessment-data.js', 'soc-m04-assessment-actions.js', 'soc-m04-automation.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-console.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const api = vm.runInContext('SocM04Automation', context);
const fixture = vm.runInContext('SocM04AssessmentData', context);
const timestamp = fixture.scenario.end;
const local = (value) => JSON.parse(JSON.stringify(value));
const telemetryBefore = local(fixture.scenario.telemetry);
const disruptiveState = { accounts: [{ id: 'alice', enabled: true }], sessions: [{ id: 's-1', active: true }], network: { blocked: [] } };
const assessment = {
  iocs: local(fixture.scenario.iocs), alerts: [{ id: 'M04-ALERT-0001', executionId: 'M04-EXEC-0001', eventIds: ['M04-A-001', 'M04-A-002', 'MISSING'] }],
  actionHistory: [], nextActionSequence: 1, automationActions: [], automationExecutions: [], automationResults: [],
  nextAutomationActionSequence: 1, nextAutomationExecutionSequence: 1,
  approvalRequests: [], nextApprovalRequestSequence: 1, simulatedDisruptiveState: local(disruptiveState),
};

const enriched = api.run(assessment, fixture, 'indicator_enrichment', 'M04-I-001', timestamp);
assert.strictEqual(enriched.execution.status, 'succeeded');
assert.strictEqual(enriched.execution.details.readOnly, true);
assert.deepStrictEqual(local(enriched.result.matchedEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-006']);
assert.strictEqual(assessment.automationResults[0].iocId, 'M04-I-001');
assert.strictEqual(assessment.actionHistory.at(-2).details.actionId, enriched.action.id);
assert.strictEqual(assessment.actionHistory.at(-1).details.executionId, enriched.execution.id);
const automationHtml = vm.runInContext('SocM04AssessmentConsole.renderAutomation', context)(assessment);
assert.match(automationHtml, /data-m04-enrich/);
assert.match(automationHtml, /data-m04-preserve/);
assert.match(automationHtml, /No telemetry, account, or network state is changed/);
assert.match(automationHtml, /M04-AUTO-EXEC-000001/);

const repeated = api.run(assessment, fixture, 'indicator_enrichment', 'M04-I-001', timestamp);
assert.strictEqual(repeated.duplicate, true);
assert.strictEqual(assessment.automationActions.length, 1, 'repeat does not duplicate action records');
assert.strictEqual(assessment.automationExecutions.length, 1, 'repeat does not duplicate executions');
assert.strictEqual(assessment.automationResults.length, 1, 'repeat does not duplicate simulated enrichment results');

const preserved = api.run(assessment, fixture, 'evidence_preservation', 'M04-ALERT-0001', timestamp, { iocId: 'M04-I-001' });
assert.strictEqual(preserved.execution.status, 'succeeded');
assert.strictEqual(preserved.result.alertId, 'M04-ALERT-0001');
assert.strictEqual(preserved.result.result.executionId, 'M04-EXEC-0001');
assert.strictEqual(preserved.result.iocId, 'M04-I-001');
assert.deepStrictEqual(local(preserved.result.matchedEventIds), ['M04-A-001', 'M04-A-002']);
assert.deepStrictEqual(local(preserved.execution.details.sideEffects), []);
assert.strictEqual(api.run(assessment, fixture, 'evidence_preservation', 'M04-ALERT-0001', timestamp, { iocId: 'M04-I-001' }).duplicate, true);
assert.strictEqual(assessment.automationResults.length, 2);

const beforeInvalid = local(assessment);
assert.throws(() => api.run(assessment, fixture, 'indicator_enrichment', 'missing-ioc', timestamp), /IOC target/);
assert.throws(() => api.run(assessment, fixture, 'evidence_preservation', 'missing-alert', timestamp), /Alert target/);
assert.throws(() => api.run(assessment, fixture, 'indicator_enrichment', 'M04-I-001', 'bad-time'), /timestamp/);
assert.throws(() => api.run(assessment, fixture, 'ticket', 'M04-I-001', timestamp), /valid alert and content/);
assert.deepStrictEqual(local(assessment), beforeInvalid, 'invalid targets and action types do not write records');

const noMatch = { alerts: [{ id: 'M04-ALERT-EMPTY', eventIds: [] }], actionHistory: [], nextActionSequence: 1 };
const failed = api.run(noMatch, fixture, 'evidence_preservation', 'M04-ALERT-EMPTY', timestamp);
assert.strictEqual(failed.execution.status, 'failed', 'no matching evidence cannot be reported as preserved');
assert.deepStrictEqual(local(failed.result.matchedEventIds), []);
const restored = vm.runInContext('SocM04AssessmentState.normalize', context)({ assessment }, fixture).assessment;
assert.deepStrictEqual(local(restored.automationResults), local(assessment.automationResults), 'automation outcomes survive state normalization');
const ticket1 = api.run(assessment, fixture, 'ticket', 'tier2-review', timestamp, { alertId: 'M04-ALERT-0001', content: 'Review matched sign-in evidence.' });
assert.strictEqual(ticket1.result.result.operation, 'created');
assert.strictEqual(assessment.automationTickets.length, 1);
assert.strictEqual(assessment.automationTickets[0].actionId, ticket1.action.id);
assert.strictEqual(assessment.automationTickets[0].executionId, ticket1.execution.id);
const ticket2 = api.run(assessment, fixture, 'ticket', 'tier2-review', timestamp, { alertId: 'M04-ALERT-0001', content: 'Add the new analyst context.' });
assert.strictEqual(ticket2.result.result.operation, 'updated');
assert.strictEqual(assessment.automationTickets.length, 1, 'ticket target update does not duplicate tickets');
assert.strictEqual(assessment.automationTickets[0].id, ticket1.result.result.ticketId);
assert.strictEqual(assessment.automationTickets[0].content, 'Add the new analyst context.');
assert.strictEqual(assessment.automationTickets[0].actionId, ticket2.action.id);
assert.strictEqual(assessment.automationTickets[0].executionId, ticket2.execution.id);
const notice1 = api.run(assessment, fixture, 'notification', 'soc-tier2', timestamp, { alertId: 'M04-ALERT-0001', content: 'Review alert M04-ALERT-0001.' });
const notice2 = api.run(assessment, fixture, 'notification', 'soc-tier2', timestamp, { alertId: 'M04-ALERT-0001', content: 'Reminder: review remains pending.' });
assert.strictEqual(notice1.result.result.repeatNumber, 1);
assert.strictEqual(notice2.result.result.repeatNumber, 2, 'notification repeats are explicit new simulated deliveries');
assert.notStrictEqual(notice1.execution.id, notice2.execution.id);
assert.strictEqual(notice2.result.actionId, notice2.action.id);
assert.strictEqual(notice2.result.executionId, notice2.execution.id);
const restoredTicketState = vm.runInContext('SocM04AssessmentState.normalize', context)({ assessment }, fixture).assessment;
assert.deepStrictEqual(local(restoredTicketState.automationTickets), local(assessment.automationTickets), 'tickets and audit links survive normalization');
assert.strictEqual(restoredTicketState.nextTicketSequence, assessment.nextTicketSequence, 'ticket sequence survives state normalization');
assert.deepStrictEqual(local(restoredTicketState.automationResults.slice(-4)), local(assessment.automationResults.slice(-4)), 'ticket and notification outcomes survive normalization');
const beforeInvalidTicket = local(assessment);
assert.throws(() => api.run(assessment, fixture, 'ticket', 'bad target!', timestamp, { alertId: 'M04-ALERT-0001', content: 'Valid content' }), /Ticket target/);
assert.throws(() => api.run(assessment, fixture, 'ticket', 'valid-target', timestamp, { alertId: 'missing-alert', content: 'Valid content' }), /valid alert/);
assert.throws(() => api.run(assessment, fixture, 'ticket', 'valid-target', timestamp, { alertId: 'M04-ALERT-0001', content: '  ' }), /content/);
assert.throws(() => api.run(assessment, fixture, 'notification', 'bad recipient!', timestamp, { alertId: 'M04-ALERT-0001', content: 'Valid content' }), /recipient/);
assert.throws(() => api.run(assessment, fixture, 'notification', 'soc-tier2', timestamp, { alertId: 'M04-ALERT-0001', content: 'x'.repeat(1001) }), /content/);
assert.deepStrictEqual(local(assessment), beforeInvalidTicket, 'invalid ticket and notification inputs do not write records');

const beforeApprovalState = local(assessment.simulatedDisruptiveState);
const approvalCases = [
  ['account_disable', 'alice', 'approved'],
  ['session_revoke', 'session:s-1', 'rejected'],
  ['network_block', '198.51.100.64', 'approved'],
];
const approvalRecords = [];
for (const [type, targetId, decision] of approvalCases) {
  const approval = api.requestApproval(assessment, fixture, { type, targetId, alertId: 'M04-ALERT-0001', actor: 'analyst-1', reason: `${type} requires review.` }, timestamp);
  assert.strictEqual(approval.status, 'pending');
  assert.strictEqual(approval.audit[0].actor, 'analyst-1');
  assert.strictEqual(approval.alertId, 'M04-ALERT-0001');
  approvalRecords.push(approval);
  assert.deepStrictEqual(local(assessment.simulatedDisruptiveState), beforeApprovalState, `${type} request does not mutate simulated state`);
  const reviewed = api.reviewApproval(assessment, approval.id, decision, 'reviewer-2', `${decision} for test coverage.`, timestamp);
  assert.strictEqual(reviewed.status, decision);
  assert.deepStrictEqual(local(assessment.simulatedDisruptiveState), beforeApprovalState, `${type} ${decision} decision does not mutate simulated state`);
}
const approval = approvalRecords[0];
const approvalHtml = vm.runInContext('SocM04AssessmentConsole.renderAutomation', context)(assessment);
assert.match(approvalHtml, /data-m04-approval-request-form/);
assert.match(approvalHtml, /data-m04-approval-decision="approved"/);
assert.match(approvalHtml, /never disables accounts, revokes sessions, or changes network state/);
const approved = assessment.approvalRequests.find((item) => item.id === approval.id);
assert.strictEqual(approved.status, 'approved');
assert.deepStrictEqual(local(approved.audit.map((entry) => entry.status)), ['pending', 'approved']);
assert.strictEqual(approved.audit[1].actor, 'reviewer-2');
assert.strictEqual(assessment.actionHistory.at(-1).details.execution, 'never');
assert.deepStrictEqual(local(assessment.simulatedDisruptiveState), beforeApprovalState, 'approval is a decision record and never executes the disruptive action');
assert.throws(() => api.reviewApproval(assessment, approval.id, 'rejected', 'reviewer-2', 'Changed mind.', timestamp), /Only pending/);
for (const invalid of [
  () => api.requestApproval(assessment, fixture, { type: 'account_disable', targetId: 'alice', alertId: 'missing', actor: 'analyst', reason: 'reason' }, timestamp),
  () => api.requestApproval(assessment, fixture, { type: 'wipe_host', targetId: 'host-1', alertId: 'M04-ALERT-0001', actor: 'analyst', reason: 'reason' }, timestamp),
  () => api.requestApproval(assessment, fixture, { type: 'network_block', targetId: '<bad>', alertId: 'M04-ALERT-0001', actor: 'analyst', reason: 'reason' }, timestamp),
  () => api.reviewApproval(assessment, 'missing-request', 'approved', 'reviewer', 'reason', timestamp),
  () => api.reviewApproval(assessment, approval.id, 'approved', '', 'reason', timestamp),
]) assert.throws(invalid);
const rejected = api.requestApproval(assessment, fixture, { type: 'session_revoke', targetId: 'session:s-1', alertId: 'M04-ALERT-0001', actor: 'analyst', reason: 'Session suspected.' }, timestamp);
assert.strictEqual(api.reviewApproval(assessment, rejected.id, 'rejected', 'reviewer-3', 'Insufficient evidence.', timestamp).status, 'rejected');
const restoredApprovals = vm.runInContext('SocM04AssessmentState.normalize', context)({ assessment }, fixture).assessment;
assert.deepStrictEqual(local(restoredApprovals.approvalRequests), local(assessment.approvalRequests), 'request states and audit entries survive versioned state restoration');
assert.strictEqual(restoredApprovals.nextApprovalRequestSequence, assessment.nextApprovalRequestSequence);
assert.deepStrictEqual(local(assessment.simulatedDisruptiveState), beforeApprovalState, 'request, approval, and rejection never mutate account/session/network state');
const invalidApprovalSnapshot = local(assessment);
assert.throws(() => api.requestApproval(assessment, fixture, { type: 'network_block', targetId: '198.51.100.1', alertId: 'M04-ALERT-0001', actor: 'analyst', reason: 'x'.repeat(501) }, timestamp), /Actor and reason/);
assert.deepStrictEqual(local(assessment), invalidApprovalSnapshot, 'invalid approval inputs do not mutate assessment');
const cappedApprovals = vm.runInContext('SocM04AssessmentState.normalize', context)({ assessment: { approvalRequests: Array.from({ length: 205 }, (_, index) => ({ id: `M04-APPROVAL-${String(index + 1).padStart(6, '0')}` })), nextApprovalRequestSequence: 206 } }, fixture).assessment;
assert.strictEqual(cappedApprovals.approvalRequests.length, 200, 'approval request records are bounded');
const cappedTickets = Array.from({ length: 200 }, (_, index) => ({ id: `M04-TICKET-${String(index + 1).padStart(6, '0')}`, targetId: `target-${index + 1}` }));
const afterTicketCap = {
  alerts: [{ id: 'M04-ALERT-0001' }], automationTickets: cappedTickets, nextTicketSequence: 201,
  automationActions: [], automationExecutions: [], automationResults: [], actionHistory: [],
  nextActionSequence: 1, nextAutomationActionSequence: 1, nextAutomationExecutionSequence: 1,
};
const cappedTicket = api.run(afterTicketCap, fixture, 'ticket', 'new-target', timestamp, { alertId: 'M04-ALERT-0001', content: 'Review evidence.' });
assert.strictEqual(cappedTicket.result.result.ticketId, 'M04-TICKET-000201', 'ticket IDs do not repeat after bounded ticket history rolls over');
assert.strictEqual(afterTicketCap.nextTicketSequence, 202);
assert.strictEqual(afterTicketCap.automationTickets[0].id, 'M04-TICKET-000002');
assert.strictEqual(afterTicketCap.automationTickets.at(-1).id, 'M04-TICKET-000201');
assert.deepStrictEqual(local(fixture.scenario.telemetry), telemetryBefore, 'simulation never mutates telemetry');
console.log('M04 low-risk automation simulation, evidence linkage, idempotency, and read-only boundary: all checks passed');

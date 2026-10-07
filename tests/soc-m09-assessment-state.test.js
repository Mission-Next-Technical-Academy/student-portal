#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
for (const file of ['soc-m09-assessment-data.js', 'soc-m09-assessment-state.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const api = vm.runInContext('SocM09AssessmentState', context);
const fixture = vm.runInContext('SocM09AssessmentData', context);
const scenario = fixture.scenario;
const user = { id: 'learner-1' };

assert.strictEqual(api.VERSION, 1);
assert.strictEqual(api.MODULE_KEY, 'soc-09');
assert.ok(Object.isFrozen(api.EMPTY_DEFAULTS));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({}, fixture))), {
  selectedIncidentId: null, incidentMemberships: ['ws-173', 'acct-173', 'fs-02'],
  incidentRelationships: JSON.parse(JSON.stringify(scenario.incidentGraph.edges)), selectedEntityId: null, reviewedEvidenceIds: [],
  entityStates: Object.fromEntries(scenario.entities.map((entity) => [entity.id, {}])),
  actionHistory: [], nextActionSequence: 1,
  incidentWorkflows: { 'INC-4937': { assigneeId: null, severity: 'high', status: 'open', tasks: [
    { id: 'M09-TASK-001', title: 'Preserve and review available evidence', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
    { id: 'M09-TASK-002', title: 'Validate containment outcome', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
    { id: 'M09-TASK-003', title: 'Document recovery readiness', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
  ], escalationStatus: 'none', escalationReason: '', approvalStatus: 'not_requested',
    approvalReason: '', approvalActorId: null, approvalTargetId: null, approvalActionType: null } }, workflowHistory: [], nextWorkflowSequence: 1, workflowDesigns: [], unsafeAttempts: [],
  schemaVersion: 1, scenarioId: scenario.id,
});
assert.throws(() => api.normalize({}, { scenario: { ...scenario, stateKey: '' } }), /stateKey/);
assert.throws(() => api.normalize({ scenarioId: 'foreign' }, fixture), /different scenario/);
assert.throws(() => api.normalize({ schemaVersion: 2 }, fixture), /newer/);

const legacy = { selectedIncidentId: 'INC-4937', selectedEntityId: 'DEV-173',
  reviewedEvidenceIds: ['M09-E01', 'M09-E11', 'M09-E11', 'M08-EVID-001'], oldField: 'ignored' };
const migrated = api.normalize(legacy, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(migrated)), {
  selectedIncidentId: 'INC-4937', incidentMemberships: ['ws-173', 'acct-173', 'fs-02'],
  incidentRelationships: JSON.parse(JSON.stringify(scenario.incidentGraph.edges)),
  selectedEntityId: 'DEV-173', reviewedEvidenceIds: ['M09-E01', 'M09-E11'],
  entityStates: Object.fromEntries(scenario.entities.map((entity) => [entity.id, {}])),
  actionHistory: [], nextActionSequence: 1,
  incidentWorkflows: { 'INC-4937': { assigneeId: null, severity: 'high', status: 'open', tasks: [
    { id: 'M09-TASK-001', title: 'Preserve and review available evidence', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
    { id: 'M09-TASK-002', title: 'Validate containment outcome', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
    { id: 'M09-TASK-003', title: 'Document recovery readiness', status: 'pending', description: '', authorId: 'system', completionEvidence: null },
  ], escalationStatus: 'none', escalationReason: '', approvalStatus: 'not_requested',
    approvalReason: '', approvalActorId: null, approvalTargetId: null, approvalActionType: null } }, workflowHistory: [], nextWorkflowSequence: 1, workflowDesigns: [], unsafeAttempts: [],
  schemaVersion: 1, scenarioId: scenario.id,
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(migrated, fixture))),
  JSON.parse(JSON.stringify(migrated)), 'migration is idempotent');
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({ selectedEntityId: 'foreign', reviewedEvidenceIds: ['M99'] }, fixture))),
  JSON.parse(JSON.stringify(api.normalize({}, fixture))), 'invalid legacy references normalize to defaults');

const otherKey = `${scenario.stateKey}:other`;
records.set(`${otherKey}:${api.MODULE_KEY}:${user.id}`, { marker: 'untouched' });
api.save(user, legacy, fixture);
const storageKey = `${scenario.stateKey}:${api.MODULE_KEY}:${user.id}`;
assert.deepStrictEqual(JSON.parse(JSON.stringify(records.get(storageKey))), JSON.parse(JSON.stringify(migrated)));
assert.deepStrictEqual(records.get(`${otherKey}:${api.MODULE_KEY}:${user.id}`), { marker: 'untouched' });
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture))), JSON.parse(JSON.stringify(migrated)));
const reset = api.reset(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset)), JSON.parse(JSON.stringify(api.normalize({}, fixture))));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture))), JSON.parse(JSON.stringify(reset)));
assert.deepStrictEqual(calls.slice(-3).map(([kind]) => kind), ['reset', 'save', 'load']);

const transitioned = api.transition(reset, {
  selectedIncidentId: scenario.incidentGraph.incidentId,
  selectedEntityId: 'DEV-173',
  reviewedEvidenceIds: ['M09-E01', 'M09-E11'],
}, fixture);
assert.strictEqual(transitioned.selectedIncidentId, scenario.incidentGraph.incidentId);
assert.strictEqual(transitioned.selectedEntityId, 'DEV-173');
assert.deepStrictEqual(JSON.parse(JSON.stringify(transitioned.reviewedEvidenceIds)), ['M09-E01', 'M09-E11']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(transitioned.actionHistory)), [], 'selection transitions do not add actions');
const recoveryInventory = api.recoveryInventory(transitioned, 'INC-4937', fixture);
assert.strictEqual(recoveryInventory.length, 3);
assert.deepStrictEqual(JSON.parse(JSON.stringify(recoveryInventory.filter((item) => item.selectable)
  .map((item) => item.recoveryPointId))),
  ['RP-WS-173-0918']);
const selectedRecovery = api.selectRecoveryPoint(transitioned, 'INC-4937', 'RP-WS-173-0918',
  '2026-09-27T10:18:00.000Z', fixture);
const recoveryAudit = selectedRecovery.actionHistory[0];
assert.strictEqual(recoveryAudit.type, 'select_recovery_point');
assert.strictEqual(recoveryAudit.details.backupId, 'backup-ws-173');
assert.strictEqual(recoveryAudit.details.evidenceId, 'M09-E15');
assert.deepStrictEqual(JSON.parse(JSON.stringify(selectedRecovery.entityStates)),
  JSON.parse(JSON.stringify(transitioned.entityStates)), 'backup selection does not apply restore effects');
assert.ok(Object.isFrozen(recoveryAudit) && Object.isFrozen(recoveryAudit.details));
assert.throws(() => api.selectRecoveryPoint(transitioned, 'INC-4937', 'RP-WS-173-0948',
  '2026-09-27T10:18:00.000Z', fixture), /not integrity-verified/);
assert.throws(() => api.selectRecoveryPoint(transitioned, 'INC-4937', 'RP-FS-02-0900',
  '2026-09-27T10:18:00.000Z', fixture), /not integrity-verified/);
assert.throws(() => api.recoveryInventory(transitioned, 'INC-OTHER', fixture), /incident is invalid/);
assert.throws(() => api.normalize({ ...selectedRecovery, actionHistory: [{ ...recoveryAudit,
  details: { ...recoveryAudit.details, integrity: 'unverified' } }] }, fixture), /recovery selection audit is invalid/);
assert.throws(() => api.executeApprovedAction(reset, 'INC-4937', {
  type: 'restore_backup', outcome: 'success', details: { entityId: 'DEV-173' },
}, '2026-09-27T10:18:00.000Z', fixture), /approved target and action/);
const recoveryApprovalRequested = api.updateIncidentWorkflow(selectedRecovery, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Restore only from the verified selected recovery point.',
  approvalTargetId: 'DEV-173', approvalActionType: 'restore_backup',
}, '2026-09-27T10:18:00.000Z', fixture);
const recoveryApproved = api.updateIncidentWorkflow(recoveryApprovalRequested, 'INC-4937', {
  approvalStatus: 'approved', approvalActorId: 'ir-lead-1',
  approvalReason: 'Approved the selected backup recovery sequence for DEV-173.',
}, '2026-09-27T10:18:00.000Z', fixture);
const recoveryAction = (state, type, outcome, time, details = { entityId: 'DEV-173' }) =>
  api.executeApprovedAction(state, 'INC-4937', { type, outcome, details }, time, fixture);
assert.throws(() => recoveryAction(recoveryApproved, 'restore_backup', 'done', '2026-09-27T10:18:00.000Z'),
  /invalid action/);
assert.throws(() => recoveryAction(recoveryApproved, 'scan_recovery', 'success', '2026-09-27T10:18:00.000Z'),
  /order or prerequisite/);
const partialRestore = recoveryAction(recoveryApproved, 'restore_backup', 'partial', '2026-09-27T10:18:00.000Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(partialRestore.entityStates['DEV-173'])), { restoreStatus: 'partial' });
assert.strictEqual(partialRestore.actionHistory[1].details.recoveryPointId, 'RP-WS-173-0918');
assert.strictEqual(partialRestore.actionHistory[1].details.approval.actionType, 'restore_backup');
assert.throws(() => recoveryAction(partialRestore, 'restore_backup', 'success', '2026-09-27T10:18:00.000Z'),
  /order or prerequisite/);
// Postgres jsonb stores keys in its own order; a reloaded session must still load.
const jsonbOrdered = JSON.parse(JSON.stringify(partialRestore));
jsonbOrdered.actionHistory[1].details.effects = jsonbOrdered.actionHistory[1].details.effects
  .map(({ entityId, field, value }) => ({ field, value, entityId }));
assert.doesNotThrow(() => api.normalize(jsonbOrdered, fixture));
const forgedEffect = JSON.parse(JSON.stringify(partialRestore));
forgedEffect.actionHistory[1].details.effects[0].value = true;
assert.throws(() => api.normalize(forgedEffect, fixture), /outcome or effect is invalid/);
const scannedRecovery = recoveryAction(partialRestore, 'scan_recovery', 'success', '2026-09-27T10:18:00.000Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(scannedRecovery.entityStates['DEV-173'])),
  { restoreStatus: 'partial', scanStatus: true });
const validatedRecovery = recoveryAction(scannedRecovery, 'validate_recovery', 'partial', '2026-09-27T10:18:00.000Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(validatedRecovery.entityStates['DEV-173'])),
  { restoreStatus: 'partial', scanStatus: true, validationStatus: 'partial' });
assert.ok(validatedRecovery.actionHistory.slice(1).every((entry) => Object.isFrozen(entry)
  && entry.details.effects.length <= 1 && entry.details.recoveryPointId === 'RP-WS-173-0918'));
assert.throws(() => recoveryAction(scannedRecovery, 'validate_recovery', 'success', '2026-09-27T10:18:00.000Z', {
  entityId: 'DEV-UNKNOWN-173', backupId: 'backup-ws-173', recoveryPointId: 'RP-WS-173-0918',
}), /outside incident scope/);
assert.throws(() => api.normalize({ ...validatedRecovery, actionHistory: validatedRecovery.actionHistory.map((entry, index) =>
  index === 1 ? { ...entry, outcome: 'failure' } : entry) }, fixture), /outcome or effect/);
const restoredRecoveryState = api.normalize(JSON.parse(JSON.stringify(validatedRecovery)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredRecoveryState.entityStates['DEV-173'])),
  JSON.parse(JSON.stringify(validatedRecovery.entityStates['DEV-173'])));
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredRecoveryState.actionHistory)),
  JSON.parse(JSON.stringify(validatedRecovery.actionHistory)));
const successfulValidation = recoveryAction(scannedRecovery, 'validate_recovery', 'success', '2026-09-27T10:00:00.000Z');
const monitoredPass = api.completeRecoveryMonitoring(successfulValidation, 'INC-4937', 'DEV-173',
  '2026-09-27T10:10:00.000Z', [], fixture);
const passReport = monitoredPass.actionHistory.at(-1);
assert.strictEqual(passReport.type, 'monitor_recovery');
assert.strictEqual(passReport.details.windowStart, '2026-09-27T10:00:00.000Z');
assert.strictEqual(passReport.details.windowEnd, '2026-09-27T10:20:00.000Z');
assert.strictEqual(passReport.details.execution.summary, 'monitoring_passed');
assert.strictEqual(monitoredPass.incidentWorkflows['INC-4937'].status, 'open', 'a clean monitor does not reopen');
const monitoredReopen = api.completeRecoveryMonitoring(successfulValidation, 'INC-4937', 'DEV-173',
  '2026-09-27T10:20:00.000Z', ['persistence_present'], fixture);
assert.strictEqual(monitoredReopen.actionHistory.at(-1).outcome, 'partial');
assert.strictEqual(monitoredReopen.actionHistory.at(-1).details.execution.summary, 'reopened');
assert.strictEqual(monitoredReopen.incidentWorkflows['INC-4937'].status, 'investigating');
assert.strictEqual(monitoredReopen.workflowHistory.at(-1).field, 'status');
assert.strictEqual(monitoredReopen.workflowHistory.at(-1).value, 'investigating');
assert.ok(Object.isFrozen(monitoredReopen.actionHistory.at(-1)));
assert.ok(Object.isFrozen(monitoredReopen.workflowHistory.at(-1)));
assert.throws(() => api.completeRecoveryMonitoring(successfulValidation, 'INC-4937', 'DEV-173',
  '2026-09-27T09:59:59.000Z', [], fixture), /bounded window is invalid/);
assert.throws(() => api.completeRecoveryMonitoring(successfulValidation, 'INC-4937', 'DEV-173',
  '2026-09-27T10:20:01.000Z', [], fixture), /invalid action/);
assert.throws(() => api.completeRecoveryMonitoring(successfulValidation, 'INC-4937', 'DEV-173',
  '2026-09-27T10:10:00.000Z', ['unknown_risk'], fixture), /residual-risk checks are invalid/);
const restoredMonitoring = api.normalize(JSON.parse(JSON.stringify(monitoredReopen)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredMonitoring.actionHistory)),
  JSON.parse(JSON.stringify(monitoredReopen.actionHistory)), 'monitor audit restores exactly');
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredMonitoring.workflowHistory)),
  JSON.parse(JSON.stringify(monitoredReopen.workflowHistory)), 'reopen audit restores exactly');
assert.throws(() => api.normalize({ ...monitoredPass, actionHistory: monitoredPass.actionHistory.map((entry, index) =>
  index === monitoredPass.actionHistory.length - 1
    ? { ...entry, details: { ...entry.details, windowEnd: '2026-09-27T10:19:00.000Z' } } : entry) }, fixture),
  /bounded window is invalid/);
const failedRestore = recoveryAction(recoveryApproved, 'restore_backup', 'failure', '2026-09-27T10:18:00.000Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(failedRestore.entityStates['DEV-173'])), {});
assert.throws(() => recoveryAction(failedRestore, 'scan_recovery', 'success', '2026-09-27T10:18:00.000Z'),
  /order or prerequisite/);
assert.throws(() => api.transition(transitioned, { selectedEntityId: 'foreign' }, fixture), /unknown entity/);
assert.throws(() => api.transition(transitioned, { reviewedEvidenceIds: ['foreign'] }, fixture), /unknown evidence/);
assert.throws(() => api.transition(transitioned, { actionHistory: [] }, fixture), /cannot modify action history/);
assert.deepStrictEqual(JSON.parse(JSON.stringify(transitioned.actionHistory)), [], 'rejected transitions leave state unchanged');

const queue = api.incidentQueue(fixture, reset);
assert.strictEqual(queue.length, 1);
assert.strictEqual(queue[0].id, 'INC-4937');
assert.strictEqual(queue[0].memberCount, 3);
assert.strictEqual(queue[0].status, 'open');
assert.strictEqual(queue[0].severity, 'high');
assert.strictEqual(queue[0].assigneeId, null);
assert.strictEqual(queue[0].tasks.length, 3);
const detail = api.incidentDetail('INC-4937', reset, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(detail.members.map((item) => item.id))), ['ws-173', 'acct-173', 'fs-02']);
assert.strictEqual(detail.relationships.length, 4);
assert.ok(detail.sourceEvidenceIds.includes('M09-E01'), 'detail exposes original source evidence references');
assert.strictEqual(detail.status, 'open');
assert.deepStrictEqual(JSON.parse(JSON.stringify(detail.workflowHistory)), []);
assert.throws(() => api.incidentDetail('INC-9999', reset, fixture), /no matching incident/);
const changedRelationships = scenario.incidentGraph.edges.filter((edge) => edge.id !== 'M09-LINK-003')
  .concat([{ id: 'M09-LINK-005', from: 'INC-4937', to: 'DEV-173', relation: 'inventory_confirmed_member', evidenceId: 'M09-E11' }]);
const changedIncident = api.transition(reset, {
  incidentMemberships: ['ws-173', 'acct-173', 'DEV-173'], incidentRelationships: changedRelationships,
}, fixture);
const changedDetail = api.incidentDetail('INC-4937', changedIncident, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(changedDetail.members.map((item) => item.id))), ['ws-173', 'acct-173', 'DEV-173']);
assert.ok(changedDetail.relationships.some((edge) => edge.id === 'M09-LINK-005'));
assert.ok(!changedDetail.relationships.some((edge) => edge.id === 'M09-LINK-003'));
assert.throws(() => api.transition(reset, { incidentMemberships: ['ghost'] }, fixture), /invalid entity/);
assert.throws(() => api.transition(reset, { incidentMemberships: ['ws-173', 'ws-173'] }, fixture), /invalid entity/);
assert.throws(() => api.transition(reset, { incidentRelationships: [{ id: 'M09-LINK-999',
  from: 'INC-4937', to: 'ghost', relation: 'unknown', evidenceId: 'M09-E11' }] }, fixture), /invalid link/);
assert.throws(() => api.transition(reset, { incidentRelationships: [{ id: 'M09-LINK-001',
  from: 'INC-4937', to: 'ws-173', relation: 'duplicate', evidenceId: 'M09-E01' },
  { id: 'M09-LINK-001', from: 'INC-4937', to: 'acct-173', relation: 'duplicate', evidenceId: 'M09-E06' }] }, fixture), /invalid link/);

const workflowState = api.updateIncidentWorkflow(reset, 'INC-4937', {
  assigneeId: 'ir-analyst-2', severity: 'critical', status: 'investigating',
}, '2026-09-27T10:10:00.000Z', fixture);
assert.strictEqual(workflowState.incidentWorkflows['INC-4937'].assigneeId, 'ir-analyst-2');
assert.strictEqual(api.incidentQueue(fixture, workflowState)[0].severity, 'critical');
assert.strictEqual(api.incidentDetail('INC-4937', workflowState, fixture).status, 'investigating');
assert.deepStrictEqual(JSON.parse(JSON.stringify(workflowState.workflowHistory.map((item) => item.field))), ['assigneeId', 'severity', 'status']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(workflowState.workflowHistory.map((item) => item.sequence))), [1, 2, 3]);
assert.ok(Object.isFrozen(workflowState.workflowHistory[0]));
const taskState = api.updateIncidentWorkflow(workflowState, 'INC-4937', {
  taskId: 'M09-TASK-001', taskStatus: 'in_progress',
}, '2026-09-27T10:11:00.000Z', fixture);
assert.strictEqual(taskState.incidentWorkflows['INC-4937'].tasks[0].status, 'in_progress');
assert.strictEqual(taskState.workflowHistory[3].field, 'taskStatus');
assert.strictEqual(workflowState.incidentWorkflows['INC-4937'].tasks[0].status, 'pending', 'prior workflow state is immutable');
assert.throws(() => api.updateIncidentWorkflow(taskState, 'INC-4937', {
  taskId: 'M09-TASK-001', taskStatus: 'completed',
}, '2026-09-27T10:12:00.000Z', fixture), /completion requires evidence/);
const completedTaskState = api.completeIncidentTask(taskState, 'INC-4937', 'M09-TASK-001', {
  note: 'Endpoint isolation is confirmed in the response log.', evidenceIds: ['M09-E01'],
}, '2026-09-27T10:12:00.000Z', fixture);
assert.strictEqual(completedTaskState.incidentWorkflows['INC-4937'].tasks[0].status, 'completed');
assert.deepStrictEqual(JSON.parse(JSON.stringify(completedTaskState.incidentWorkflows['INC-4937'].tasks[0].completionEvidence)), {
  note: 'Endpoint isolation is confirmed in the response log.', evidenceIds: ['M09-E01'],
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(completedTaskState.workflowHistory.slice(-2).map((event) => event.field))),
  ['taskCompletionEvidence', 'taskStatus']);
const authoredTaskState = api.authorIncidentTask(completedTaskState, 'INC-4937', {
  title: 'Confirm mailbox forwarding rule removal', description: 'Review the mailbox audit record.', authorId: 'ir-analyst-2',
}, '2026-09-27T10:12:30.000Z', fixture);
const authoredTask = authoredTaskState.incidentWorkflows['INC-4937'].tasks[3];
assert.strictEqual(authoredTask.id, 'M09-TASK-004');
assert.strictEqual(authoredTask.status, 'pending');
assert.strictEqual(authoredTaskState.workflowHistory.at(-1).field, 'taskCreated');
assert.ok(Object.isFrozen(authoredTaskState.workflowHistory.at(-1)));
assert.throws(() => api.authorIncidentTask(reset, 'INC-4937', { title: '  ', authorId: 'ir-analyst-2' },
  '2026-09-27T10:12:30.000Z', fixture), /authoring fields/);
assert.throws(() => api.completeIncidentTask(taskState, 'INC-4937', 'M09-TASK-001', {
  note: 'Evidence is invalid.', evidenceIds: ['M99-EVID-999'],
}, '2026-09-27T10:12:00.000Z', fixture), /completion evidence is invalid/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-9999', { status: 'open' }, '2026-09-27T10:10:00.000Z', fixture), /unknown incident/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { assigneeId: 'bad id' }, '2026-09-27T10:10:00.000Z', fixture), /assignee/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { severity: 'urgent' }, '2026-09-27T10:10:00.000Z', fixture), /severity/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { status: 'escalated' }, '2026-09-27T10:10:00.000Z', fixture), /status/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { status: 'closed' }, '2026-09-27T10:10:00.000Z', fixture), /transition is not allowed/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { taskId: 'M09-TASK-999', taskStatus: 'completed' }, '2026-09-27T10:10:00.000Z', fixture), /task/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { taskId: 'M09-TASK-001', taskStatus: 'completed' }, '2026-09-27T10:10:00.000Z', fixture), /task transition is not allowed/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { status: 'closed', approval: 'approved' }, '2026-09-27T10:10:00.000Z', fixture), /change is invalid/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { status: 'investigating' }, '2026-09-27T10:30:00.000Z', fixture), /timestamp/);
const escalationState = api.updateIncidentWorkflow(completedTaskState, 'INC-4937', {
  escalationStatus: 'escalated', escalationReason: 'Credential use spans multiple affected systems.',
}, '2026-09-27T10:13:00.000Z', fixture);
assert.strictEqual(escalationState.incidentWorkflows['INC-4937'].escalationStatus, 'escalated');
assert.strictEqual(escalationState.workflowHistory[6].field, 'escalationStatus');
assert.strictEqual(escalationState.workflowHistory[7].value,
  'Credential use spans multiple affected systems.');
const approvalRequested = api.updateIncidentWorkflow(escalationState, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Request approval for scoped session revocation.',
  approvalTargetId: 'session-173-REMOTE', approvalActionType: 'revoke_session',
}, '2026-09-27T10:14:00.000Z', fixture);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Approve an unmanaged device action.',
  approvalTargetId: 'DEV-UNKNOWN-173', approvalActionType: 'isolate_device',
}, '2026-09-27T10:14:00.000Z', fixture), /outside incident scope/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Approve a mismatched target.',
  approvalTargetId: 'acct-173', approvalActionType: 'isolate_device',
}, '2026-09-27T10:14:00.000Z', fixture), /wrong type/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', {
  approvalStatus: 'approved', approvalActorId: 'ir-analyst-2', approvalReason: 'Self-approved.',
}, '2026-09-27T10:15:00.000Z', fixture), /authorized approver/);
const approvalDecided = api.updateIncidentWorkflow(approvalRequested, 'INC-4937', {
  approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Approved for affected account only.',
}, '2026-09-27T10:15:00.000Z', fixture);
assert.strictEqual(approvalDecided.incidentWorkflows['INC-4937'].approvalStatus, 'approved');
assert.strictEqual(approvalDecided.incidentWorkflows['INC-4937'].approvalTargetId, 'session-173-REMOTE');
assert.strictEqual(approvalDecided.incidentWorkflows['INC-4937'].approvalActionType, 'revoke_session');
assert.deepStrictEqual(JSON.parse(JSON.stringify(approvalDecided.workflowHistory.slice(-5).map((event) => event.field))),
  ['approvalTargetId', 'approvalActionType', 'approvalStatus', 'approvalReason', 'approvalActorId']);
assert.ok(approvalDecided.workflowHistory.every(Object.isFrozen), 'all workflow events remain immutable');
assert.throws(() => api.executeApprovedAction(approvalRequested, 'INC-4937', {
  type: 'revoke_session', outcome: 'success', details: { entityId: 'session-173-REMOTE' },
}, '2026-09-27T10:15:00.000Z', fixture), /does not match an approved/);
assert.throws(() => api.executeApprovedAction(approvalDecided, 'INC-4937', {
  type: 'disable_identity', outcome: 'success', details: { entityId: 'acct-173' },
}, '2026-09-27T10:15:00.000Z', fixture), /does not match an approved/);
assert.throws(() => api.executeApprovedAction(approvalDecided, 'INC-4937', {
  type: 'revoke_session', outcome: 'success', details: { entityId: 'DEV-UNKNOWN-173' },
}, '2026-09-27T10:15:00.000Z', fixture), /outside incident scope or has the wrong type/);
assert.throws(() => api.executeApprovedAction(approvalDecided, 'INC-9999', {
  type: 'revoke_session', outcome: 'success', details: { entityId: 'session-173-REMOTE' },
}, '2026-09-27T10:15:00.000Z', fixture), /action or incident is invalid/);
assert.throws(() => api.appendAction(reset, {
  type: 'revoke_session', outcome: 'success', timestamp: '2026-09-27T10:15:00.000Z',
  details: { entityId: 'session-173-REMOTE' },
}, fixture), /require scoped approval/);
assert.throws(() => api.appendAction(reset, {
  type: 'isolate_endpoint', outcome: 'success', timestamp: '2026-09-27T10:15:00.000Z',
  details: { entityId: 'ws-173' },
}, fixture), /require scoped approval/);
assert.throws(() => api.appendAction(reset, {
  type: 'isolate_endpoint', outcome: 'success', timestamp: '2026-09-27T10:15:00.000Z',
  details: { entityId: 'ws-173' },
}, fixture, true), /require scoped approval/, 'callers cannot assert the trusted approval bypass');
assert.throws(() => api.updateIncidentWorkflow(approvalDecided, 'INC-4937', {
  approvalTargetId: 'acct-173', approvalActionType: 'disable_identity',
}, '2026-09-27T10:15:30.000Z', fixture), /require a new approval request/, 'an approved request cannot be retargeted');
const secondRequest = api.updateIncidentWorkflow(approvalDecided, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Separate approval for the affected account.',
  approvalTargetId: 'acct-173', approvalActionType: 'disable_identity',
}, '2026-09-27T10:15:30.000Z', fixture);
assert.strictEqual(secondRequest.incidentWorkflows['INC-4937'].approvalStatus, 'pending', 'a decided approval can be followed by a new request');
assert.strictEqual(secondRequest.incidentWorkflows['INC-4937'].approvalActorId, null, 'a new request clears the previous approver');
assert.throws(() => api.executeApprovedAction(secondRequest, 'INC-4937', {
  type: 'disable_identity', outcome: 'success', details: { entityId: 'acct-173' },
}, '2026-09-27T10:15:40.000Z', fixture), /does not match an approved/, 'a pending request cannot be executed');
const approvedActionState = api.executeApprovedAction(approvalDecided, 'INC-4937', {
  type: 'revoke_session', outcome: 'partial', details: { entityId: 'session-173-REMOTE', evidenceIds: ['M09-E06'] },
}, '2026-09-27T10:16:00.000Z', fixture);
assert.strictEqual(approvedActionState.actionHistory[0].outcome, 'partial');
assert.deepStrictEqual(JSON.parse(JSON.stringify(approvedActionState.actionHistory[0].details.approval)), {
  incidentId: 'INC-4937', actionType: 'revoke_session', targetId: 'session-173-REMOTE',
  approverId: 'ir-lead-1', reason: 'Approved for affected account only.',
});
assert.ok(Object.isFrozen(approvedActionState.actionHistory[0].details.approval));
const identityApproval = api.updateIncidentWorkflow(reset, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Disable the implicated account.',
  approvalTargetId: 'acct-173', approvalActionType: 'disable_identity',
}, '2026-09-27T10:14:00.000Z', fixture);
const identityApproved = api.updateIncidentWorkflow(identityApproval, 'INC-4937', {
  approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Account disable approved.',
}, '2026-09-27T10:15:00.000Z', fixture);
assert.strictEqual(api.executeApprovedAction(identityApproved, 'INC-4937', {
  type: 'disable_identity', outcome: 'failure', details: { entityId: 'acct-173' },
}, '2026-09-27T10:16:00.000Z', fixture).actionHistory[0].outcome, 'failure');
const deviceApproval = api.updateIncidentWorkflow(reset, 'INC-4937', {
  approvalStatus: 'pending', approvalReason: 'Isolate the confirmed affected device.',
  approvalTargetId: 'DEV-173', approvalActionType: 'isolate_device',
}, '2026-09-27T10:14:00.000Z', fixture);
const deviceApproved = api.updateIncidentWorkflow(deviceApproval, 'INC-4937', {
  approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Device isolation approved.',
}, '2026-09-27T10:15:00.000Z', fixture);
assert.strictEqual(api.executeApprovedAction(deviceApproved, 'INC-4937', {
  type: 'isolate_device', outcome: 'success', details: { entityId: 'DEV-173' },
}, '2026-09-27T10:16:00.000Z', fixture).actionHistory[0].type, 'isolate_device');
const protectedActionCases = [
  { type: 'block_ioc', target: 'ioc-worker-sha256', wrongTarget: 'file-worker-173' },
  { type: 'quarantine_file', target: 'file-worker-173', wrongTarget: 'ioc-worker-sha256' },
  { type: 'remove_inbox_rule', target: 'rule-forward-173', wrongTarget: 'persist-runkey-173' },
  { type: 'remove_persistence', target: 'persist-runkey-173', wrongTarget: 'rule-forward-173' },
];
const expectedEffectFields = {
  disable_identity: 'disabled', isolate_device: 'isolated', revoke_session: 'revoked',
  block_ioc: 'blocked', quarantine_file: 'quarantined', remove_inbox_rule: 'removed',
  remove_persistence: 'removed',
};
for (const [index, item] of protectedActionCases.entries()) {
  const requested = api.updateIncidentWorkflow(reset, 'INC-4937', {
    approvalStatus: 'pending', approvalReason: `Approve ${item.type} for the linked object.`,
    approvalTargetId: item.target, approvalActionType: item.type,
  }, '2026-09-27T10:14:00.000Z', fixture);
  const approved = api.updateIncidentWorkflow(requested, 'INC-4937', {
    approvalStatus: 'approved', approvalActorId: 'ir-lead-1',
    approvalReason: `Approved ${item.type} for the linked object only.`,
  }, '2026-09-27T10:15:00.000Z', fixture);
  assert.throws(() => api.executeApprovedAction(approved, 'INC-4937', {
    type: item.type, outcome: 'success', details: { entityId: item.wrongTarget },
  }, '2026-09-27T10:16:00.000Z', fixture), /does not match an approved|outside incident scope or has the wrong type/);
  assert.throws(() => api.appendAction(reset, {
    type: item.type, outcome: 'success', timestamp: '2026-09-27T10:16:00.000Z',
    details: { entityId: item.target },
  }, fixture), /require scoped approval/);
  const outcome = ['success', 'failure', 'partial'][index % 3];
  const executed = api.executeApprovedAction(approved, 'INC-4937', {
    type: item.type, outcome, details: { entityId: item.target, evidenceIds: ['M09-E12'] },
  }, '2026-09-27T10:16:00.000Z', fixture);
  const record = executed.actionHistory[0];
  assert.strictEqual(record.outcome, outcome);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(record.details.approval)), {
    incidentId: 'INC-4937', actionType: item.type, targetId: item.target,
    approverId: 'ir-lead-1', reason: `Approved ${item.type} for the linked object only.`,
  });
  assert.ok(Object.isFrozen(record) && Object.isFrozen(record.details.approval));
  const successful = api.executeApprovedAction(approved, 'INC-4937', {
    type: item.type, outcome: 'success', details: { entityId: item.target },
  }, '2026-09-27T10:16:00.000Z', fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(successful.entityStates[item.target])),
    { [expectedEffectFields[item.type]]: true },
    `${item.type} mutates only its target state`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(successful.actionHistory[0].details.effects)), [
    { entityId: item.target, field: expectedEffectFields[item.type], value: true },
  ], `${item.type} records its simulated effect`);
  assert.ok(Object.values(approved.entityStates).every((effects) => Object.keys(effects).length === 0),
    'execution leaves input state unchanged');
  const restoredEffect = api.normalize(JSON.parse(JSON.stringify(successful)), fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredEffect.entityStates[item.target])),
    { [expectedEffectFields[item.type]]: true }, `${item.type} effect restores`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredEffect.actionHistory[0])),
    JSON.parse(JSON.stringify(successful.actionHistory[0])), `${item.type} audit record restores unchanged`);
  assert.ok(Object.isFrozen(restoredEffect.actionHistory[0]));
  const repeated = api.executeApprovedAction(successful, 'INC-4937', {
    type: item.type, outcome: 'success', details: { entityId: item.target },
  }, '2026-09-27T10:16:00.000Z', fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(repeated.entityStates[item.target])),
    JSON.parse(JSON.stringify(successful.entityStates[item.target])),
    `${item.type} effect is idempotent`);
}
const unchangedOnFailure = api.executeApprovedAction(identityApproved, 'INC-4937', {
  type: 'disable_identity', outcome: 'failure', details: { entityId: 'acct-173' },
}, '2026-09-27T10:16:00.000Z', fixture);
assert.ok(Object.values(unchangedOnFailure.entityStates).every((effects) => Object.keys(effects).length === 0),
  'failed execution does not mutate entities');
assert.deepStrictEqual(JSON.parse(JSON.stringify(unchangedOnFailure.actionHistory[0].details.effects)), [],
  'failed execution logs no entity effects');
assert.deepStrictEqual(JSON.parse(JSON.stringify(unchangedOnFailure.actionHistory[0].details.execution)),
  { summary: 'no_change' }, 'failed execution has a deterministic result log');
for (const outcomeCase of [
  { outcome: 'success', effect: { disabled: true }, summary: 'completed' },
  { outcome: 'failure', effect: {}, summary: 'no_change' },
  { outcome: 'partial', effect: { disabled: 'partial' }, summary: 'partially_completed' },
]) {
  const run = (state, timestamp) => api.executeApprovedAction(state, 'INC-4937', {
    type: 'disable_identity', outcome: outcomeCase.outcome,
    details: { entityId: 'acct-173', evidenceIds: ['M09-E01'] },
  }, timestamp, fixture);
  const first = run(identityApproved, '2026-09-27T10:16:00.000Z');
  const retried = run(first, '2026-09-27T10:17:00.000Z');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(retried.entityStates['acct-173'])), outcomeCase.effect,
    `replaying ${outcomeCase.outcome} preserves its target state`);
  assert.strictEqual(retried.actionHistory.length, 2, `replaying ${outcomeCase.outcome} is audited`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(retried.actionHistory.map((entry) => entry.sequence))), [1, 2],
    `replaying ${outcomeCase.outcome} preserves execution order`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(retried.actionHistory.map((entry) => entry.outcome))),
    [outcomeCase.outcome, outcomeCase.outcome]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(retried.actionHistory.map((entry) => entry.details.execution.summary))),
    [outcomeCase.summary, outcomeCase.summary]);
  assert.ok(retried.actionHistory.every(Object.isFrozen),
    `replayed ${outcomeCase.outcome} audit records remain immutable`);
  const restoredRetry = api.normalize(JSON.parse(JSON.stringify(retried)), fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredRetry.entityStates)),
    JSON.parse(JSON.stringify(retried.entityStates)), `replayed ${outcomeCase.outcome} state restores`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredRetry.actionHistory)),
    JSON.parse(JSON.stringify(retried.actionHistory)), `replayed ${outcomeCase.outcome} audit restores in order`);
  assert.strictEqual(restoredRetry.nextActionSequence, 3,
    `restored ${outcomeCase.outcome} retry continues with the next sequence`);
  assert.ok(restoredRetry.actionHistory.every(Object.isFrozen),
    `restored ${outcomeCase.outcome} audit records are immutable`);
}
const deterministicOutcomeCases = [
  { type: 'disable_identity', target: 'acct-173' },
  { type: 'isolate_device', target: 'DEV-173' },
  { type: 'revoke_session', target: 'session-173-REMOTE' },
  ...protectedActionCases.map(({ type, target }) => ({ type, target })),
];
for (const item of deterministicOutcomeCases) {
  const requested = api.updateIncidentWorkflow(reset, 'INC-4937', {
    approvalStatus: 'pending', approvalReason: `Approve ${item.type}.`,
    approvalTargetId: item.target, approvalActionType: item.type,
  }, '2026-09-27T10:14:00.000Z', fixture);
  const approved = api.updateIncidentWorkflow(requested, 'INC-4937', {
    approvalStatus: 'approved', approvalActorId: 'ir-lead-1',
    approvalReason: `Approved ${item.type}.`,
  }, '2026-09-27T10:15:00.000Z', fixture);
  const execute = (state) => api.executeApprovedAction(state, 'INC-4937', {
    type: item.type, outcome: 'partial', details: { entityId: item.target },
  }, '2026-09-27T10:16:00.000Z', fixture);
  const partial = execute(approved);
  const effectField = expectedEffectFields[item.type];
  assert.deepStrictEqual(JSON.parse(JSON.stringify(partial.entityStates[item.target])),
    { [effectField]: 'partial' }, `${item.type} partial result changes only its target and effect`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(partial.actionHistory[0].details.effects)),
    [{ entityId: item.target, field: effectField, value: 'partial' }],
    `${item.type} partial result logs its bounded effect`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(partial.actionHistory[0].details.execution)),
    { summary: 'partially_completed' }, `${item.type} partial result log is deterministic`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(execute(approved))),
    JSON.parse(JSON.stringify(partial)), `${item.type} partial outcome is repeatable`);
  const restoredPartial = api.normalize(JSON.parse(JSON.stringify(partial)), fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredPartial.entityStates[item.target])),
    { [effectField]: 'partial' }, `${item.type} partial result survives restore`);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredPartial.actionHistory[0])),
    JSON.parse(JSON.stringify(partial.actionHistory[0])), `${item.type} partial log survives restore`);
}
assert.strictEqual(fixture.scenario.entities.find((entity) => entity.id === 'acct-173').status, 'active',
  'simulated effects never mutate fixture truth');
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { escalationStatus: 'resolved' },
  '2026-09-27T10:13:00.000Z', fixture), /escalation transition/);
assert.throws(() => api.updateIncidentWorkflow(escalationState, 'INC-4937', { escalationStatus: 'none' },
  '2026-09-27T10:14:00.000Z', fixture), /escalation transition/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { escalationStatus: 'escalated' },
  '2026-09-27T10:13:00.000Z', fixture), /escalation reason/);
assert.throws(() => api.updateIncidentWorkflow(reset, 'INC-4937', { approvalStatus: 'approved' },
  '2026-09-27T10:13:00.000Z', fixture), /approval transition/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', { approvalStatus: 'rejected' },
  '2026-09-27T10:15:00.000Z', fixture), /requires a reason and actor/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', {
  approvalStatus: 'approved', approvalReason: 'Approved.',
}, '2026-09-27T10:15:00.000Z', fixture), /requires a reason and actor/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', { approvalStatus: 'approved' },
  '2026-09-27T10:15:00.000Z', fixture), /requires a reason and actor/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', {
  approvalStatus: 'rejected', approvalReason: 'Denied.', approvalActorId: 'bad actor',
}, '2026-09-27T10:15:00.000Z', fixture), /approver as an incident-response ID/);
assert.throws(() => api.updateIncidentWorkflow(approvalRequested, 'INC-4937', {
  approvalStatus: 'rejected', approvalReason: 'Denied by responder.', approvalActorId: 'ir-analyst-2',
}, '2026-09-27T10:15:00.000Z', fixture), /authorized approver/);
api.save(user, approvalDecided, fixture);
const restoredApproval = api.load(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredApproval.workflowHistory)),
  JSON.parse(JSON.stringify(approvalDecided.workflowHistory)), 'escalation and approval history restores exactly');
assert.ok(restoredApproval.workflowHistory.every(Object.isFrozen), 'restored workflow audit events are frozen');
assert.strictEqual(restoredApproval.nextWorkflowSequence, approvalDecided.nextWorkflowSequence);
api.save(user, authoredTaskState, fixture);
const restoredWorkflow = api.load(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredWorkflow.workflowHistory)),
  JSON.parse(JSON.stringify(authoredTaskState.workflowHistory)), 'workflow audit history restores exactly');
assert.strictEqual(restoredWorkflow.nextWorkflowSequence, 8);
assert.strictEqual(restoredWorkflow.incidentWorkflows['INC-4937'].tasks[3].title, authoredTask.title);
assert.ok(Object.isFrozen(restoredWorkflow.workflowHistory[4]));
assert.throws(() => api.normalize({ ...authoredTaskState, workflowHistory: authoredTaskState.workflowHistory.slice(0, 1) }, fixture), /sequence/);

const execution = { type: 'review_session', outcome: 'success', timestamp: '2026-09-27T10:10:00.000Z',
  details: { entityId: 'session-173-REMOTE', evidenceIds: ['M09-E06'] } };
const firstExecutionState = api.appendAction(reset, execution, fixture);
assert.strictEqual(firstExecutionState.actionHistory.length, 1);
assert.strictEqual(firstExecutionState.actionHistory[0].id, `${scenario.id}:ACTION-000001`);
assert.strictEqual(firstExecutionState.actionHistory[0].sequence, 1);
assert.strictEqual(firstExecutionState.actionHistory[0].type, execution.type);
assert.strictEqual(firstExecutionState.actionHistory[0].outcome, execution.outcome);
assert.strictEqual(firstExecutionState.nextActionSequence, 2);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset.actionHistory)), [], 'append leaves prior state unchanged');
assert.ok(Object.isFrozen(firstExecutionState.actionHistory[0]));
assert.ok(Object.isFrozen(firstExecutionState.actionHistory[0].details));
firstExecutionState.actionHistory[0].details.entityId = 'tampered';
assert.strictEqual(firstExecutionState.actionHistory[0].details.entityId, 'session-173-REMOTE', 'frozen details reject mutation');
execution.details.entityId = 'caller-mutated';
assert.strictEqual(firstExecutionState.actionHistory[0].details.entityId, 'session-173-REMOTE', 'history is detached from caller input');
const secondExecutionState = api.appendAction(firstExecutionState, {
  type: 'isolate_service', outcome: 'failure', timestamp: '2026-09-27T10:11:00.000Z', details: { entityId: 'fs-02' },
}, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(secondExecutionState.actionHistory.map((item) => item.sequence))),
  [1, 2], 'append is append-only');

api.save(user, secondExecutionState, fixture);
const historyBeforeRestore = JSON.parse(JSON.stringify(secondExecutionState.actionHistory));
const saveCountBeforeRestore = calls.filter(([kind]) => kind === 'save').length;
const restoredExecutionState = api.load(user, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredExecutionState.actionHistory)), historyBeforeRestore,
  'restore preserves action records exactly');
assert.deepStrictEqual(restoredExecutionState.actionHistory.map((item) => item.sequence), [1, 2],
  'restore does not replay or rewrite action sequences');
assert.strictEqual(restoredExecutionState.nextActionSequence, 3);
assert.ok(Object.isFrozen(restoredExecutionState.actionHistory[0]));
assert.ok(Object.isFrozen(restoredExecutionState.actionHistory[0].details));
assert.strictEqual(calls.filter(([kind]) => kind === 'save').length, saveCountBeforeRestore,
  'canonical restore does not rewrite persisted history');
const restoredTransition = api.transition(restoredExecutionState, { selectedEntityId: 'DEV-173' }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredTransition.actionHistory)), historyBeforeRestore,
  'state transitions cannot rewrite restored action history');
assert.notStrictEqual(restoredTransition.actionHistory[0], restoredExecutionState.actionHistory[0],
  'transition normalization returns detached immutable records');
assert.ok(Object.isFrozen(restoredTransition.actionHistory[0]));
assert.throws(() => api.appendAction(secondExecutionState, {
  type: 'unknown_action', outcome: 'success', timestamp: '2026-09-27T10:11:00.000Z', details: {},
}, fixture), /invalid action/);
assert.throws(() => api.appendAction(secondExecutionState, {
  type: 'disable_identity', outcome: 'unknown', timestamp: '2026-09-27T10:11:00.000Z', details: {},
}, fixture), /require scoped approval/);
assert.throws(() => api.normalize({ actionHistory: [{ ...secondExecutionState.actionHistory[0],
  id: 'foreign:ACTION-000001' }] }, fixture), /invalid action/);

const expandedId = api.appendAction({ ...reset, nextActionSequence: 1000000 }, execution, fixture);
assert.strictEqual(expandedId.actionHistory[0].id, `${scenario.id}:ACTION-1000000`, 'sequence IDs expand without truncation');
assert.throws(() => api.appendAction({ ...reset, nextActionSequence: Number.MAX_SAFE_INTEGER }, execution, fixture), /limit reached/);
const fullHistory = Array.from({ length: api.MAX_ACTION_HISTORY }, (_, index) => ({
  id: `${scenario.id}:ACTION-${String(index + 1).padStart(6, '0')}`,
  sequence: index + 1, type: 'review_session', outcome: 'success',
  timestamp: '2026-09-27T10:10:00.000Z', details: { entityId: 'ws-173' },
}));
const fullState = api.normalize({ actionHistory: fullHistory, nextActionSequence: fullHistory.length + 1 }, fixture);
assert.strictEqual(fullState.actionHistory.length, api.MAX_ACTION_HISTORY);
assert.throws(() => api.appendAction(fullState, execution, fixture), /limit reached/);

console.log('M09 assessment state contract: all checks passed');

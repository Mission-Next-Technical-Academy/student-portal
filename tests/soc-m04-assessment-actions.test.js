#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m04-assessment-actions.js'), 'utf8'), context);
const api = vm.runInContext('SocM04AssessmentActions', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const types = ['ioc_edit', 'intel_verdict', 'query_test', 'rule_change', 'rule_execution', 'scheduling', 'alert_review', 'automation', 'case_update', 'automation_action_recorded', 'automation_execution_recorded'];
const original = { attempts: 2, caseRecord: { notes: 'retain' }, assessment: { selectedIocIds: ['M04-I-001'], alertIds: ['alert-1'], legacy: true } };

assert.strictEqual(api.MAX_HISTORY, 200);
assert.deepStrictEqual(local(api.TYPES), types);
let state = original;
types.forEach((type, index) => {
  state = api.record(state, type, `2026-09-24T09:${String(index).padStart(2, '0')}:00Z`, { actionIndex: index });
  const action = state.assessment.actionHistory[index];
  assert.strictEqual(action.id, `m04-action-${String(index + 1).padStart(6, '0')}`);
  assert.strictEqual(action.sequence, index + 1);
  assert.strictEqual(action.type, type);
  assert.strictEqual(action.details.actionIndex, index);
});
assert.deepStrictEqual(local(original.assessment), { selectedIocIds: ['M04-I-001'], alertIds: ['alert-1'], legacy: true }, 'recording must not mutate input state');
assert.strictEqual(state.attempts, 2);
assert.deepStrictEqual(local(state.caseRecord), { notes: 'retain' });
assert.deepStrictEqual(local(state.assessment.selectedIocIds), ['M04-I-001']);
assert.strictEqual(state.assessment.legacy, true);

const details = { nested: { changed: false } };
const appended = api.record({ assessment: { actionHistory: [], nextActionSequence: 1 } }, 'case_update', '2026-09-24T10:00:00Z', details);
details.nested.changed = true;
assert.strictEqual(appended.assessment.actionHistory[0].details.nested.changed, false, 'action details are copied');
assert.strictEqual(appended.assessment.actionHistory[0].timestamp, '2026-09-24T10:00:00Z');

let bounded = { assessment: { actionHistory: [], nextActionSequence: 1 } };
for (let index = 0; index < 5; index += 1) {
  bounded = api.record(bounded, 'query_test', `2026-09-24T11:0${index}:00Z`, { index }, 2);
}
assert.deepStrictEqual(local(bounded.assessment.actionHistory.map((action) => action.sequence)), [4, 5]);
assert.strictEqual(bounded.assessment.nextActionSequence, 6, 'truncation does not reuse IDs');
assert.strictEqual(bounded.assessment.actionHistory[0].id, 'm04-action-000004');
assert.strictEqual(bounded.assessment.actionHistory.length, 2);

assert.throws(() => api.record({}, 'unknown', '2026-09-24T09:00:00Z', {}), /Unsupported M04 action type/);
assert.throws(() => api.record({}, 'ioc_edit', undefined, {}), /explicit valid timestamp/);
assert.throws(() => api.record({}, 'ioc_edit', 'not-a-date', {}), /explicit valid timestamp/);
assert.throws(() => api.record({}, 'ioc_edit', '2026-09-24T09:00:00Z', []), /details must be an object/);
assert.throws(() => api.record({}, 'ioc_edit', '2026-09-24T09:00:00Z', {}, 0), /positive integer/);

assert.strictEqual(api.AUTOMATION_SCHEMA_VERSION, 1);
assert.strictEqual(api.MAX_AUTOMATION_HISTORY, 200);
assert.deepStrictEqual(local(api.AUTOMATION_ACTION_TYPES), ['indicator_enrichment', 'evidence_preservation', 'ticket', 'notification', 'disruptive_request']);
assert.deepStrictEqual(local(api.AUTOMATION_EXECUTION_STATUSES), ['queued', 'succeeded', 'failed', 'skipped']);
let automation = { assessment: { automationActions: [], automationExecutions: [], actionHistory: [], nextAutomationActionSequence: 1, nextAutomationExecutionSequence: 1, nextActionSequence: 1 } };
const actionResult = api.appendAutomationAction(automation, 'indicator_enrichment', '2026-09-24T12:00:00Z', { indicatorId: 'M04-I-001', reason: 'analyst requested' });
automation = actionResult.state;
assert.strictEqual(actionResult.action.id, 'M04-AUTO-000001');
assert.strictEqual(actionResult.action.schemaVersion, 1);
assert.strictEqual(actionResult.action.type, 'indicator_enrichment');
assert.deepStrictEqual(local(automation.assessment.actionHistory[0]), {
  id: 'm04-action-000001', sequence: 1, type: 'automation_action_recorded', timestamp: '2026-09-24T12:00:00Z',
  details: { actionId: 'M04-AUTO-000001', actionType: 'indicator_enrichment' },
});
const executionResult = api.appendAutomationExecution(automation, actionResult.action.id, 'queued', '2026-09-24T12:01:00Z', { requestId: 'request-1' });
automation = executionResult.state;
assert.strictEqual(executionResult.execution.id, 'M04-AUTO-EXEC-000001');
assert.strictEqual(executionResult.execution.schemaVersion, 1);
assert.strictEqual(executionResult.execution.actionId, actionResult.action.id);
assert.deepStrictEqual(local(automation.assessment.actionHistory[1].details), {
  actionId: actionResult.action.id, executionId: executionResult.execution.id, status: 'queued',
});
assert.deepStrictEqual(local(api.appendAutomationAction(automation, 'indicator_enrichment', '2026-09-24T12:02:00Z', {}).action), {
  id: 'M04-AUTO-000002', schemaVersion: 1, sequence: 2, type: 'indicator_enrichment',
  createdAt: '2026-09-24T12:02:00Z', details: {},
}, 'IDs are deterministic and sequences advance from persisted records');
assert.throws(() => api.appendAutomationAction(automation, 'unknown', '2026-09-24T12:00:00Z', {}), /Unsupported M04 automation action type/);
assert.throws(() => api.appendAutomationExecution(automation, 'missing', 'queued', '2026-09-24T12:00:00Z', {}), /persisted action/);
assert.throws(() => api.appendAutomationExecution(automation, actionResult.action.id, 'unknown', '2026-09-24T12:00:00Z', {}), /Unsupported M04 automation execution status/);

let boundedAutomation = { assessment: { automationActions: [], automationExecutions: [], actionHistory: [], nextAutomationActionSequence: 1, nextAutomationExecutionSequence: 1, nextActionSequence: 1 } };
for (let index = 0; index < 205; index += 1) {
  const created = api.appendAutomationAction(boundedAutomation, 'ticket', `2026-09-24T13:${String(index % 60).padStart(2, '0')}:00Z`, { index });
  const executed = api.appendAutomationExecution(created.state, created.action.id, 'queued', `2026-09-24T13:${String(index % 60).padStart(2, '0')}:30Z`, { index });
  boundedAutomation = executed.state;
}
assert.strictEqual(boundedAutomation.assessment.automationActions.length, 200);
assert.strictEqual(boundedAutomation.assessment.automationActions[0].sequence, 6);
assert.strictEqual(boundedAutomation.assessment.automationExecutions.length, 200);
assert.strictEqual(boundedAutomation.assessment.automationExecutions[0].sequence, 6);
assert.strictEqual(boundedAutomation.assessment.nextAutomationActionSequence, 206);
assert.strictEqual(boundedAutomation.assessment.nextAutomationExecutionSequence, 206);
assert.strictEqual(boundedAutomation.assessment.actionHistory.length, 200);
assert.strictEqual(boundedAutomation.assessment.actionHistory[0].type, 'automation_action_recorded');
assert.strictEqual(boundedAutomation.assessment.actionHistory[0].sequence, 211);

console.log('M04 assessment action history contract: all checks passed');

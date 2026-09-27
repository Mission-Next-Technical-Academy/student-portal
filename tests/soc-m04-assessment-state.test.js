#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const calls = [];
const stored = {
  attempts: 3,
  notes: 'legacy notes',
  completed: true,
  caseRecord: { submitted: true, notes: 'keep ticket' },
  independentLab: { answers: { q1: 'b' }, attempts: 2 },
  customLegacyField: { keep: 17 },
  assessment: { selectedIocIds: ['M04-I-001'], ruleDraft: { threshold: 5, enabled: true }, legacyAssessmentField: 'retain' },
};
const context = {
  LabRuntime: {
    loadCaseState: (...args) => { calls.push(['load', ...args]); return stored; },
    saveCaseState: (...args) => { calls.push(['save', ...args]); return args[3]; },
    resetCaseState: (...args) => { calls.push(['reset', ...args]); return { ...args[3] }; },
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m04-assessment-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m04-assessment-state.js'), 'utf8'), context);
const api = vm.runInContext('SocM04AssessmentState', context);
const fixture = vm.runInContext('SocM04AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));

assert.strictEqual(api.VERSION, 1);
const migrated = api.normalize(stored, fixture);
assert.strictEqual(migrated.attempts, 3);
assert.strictEqual(migrated.completed, true);
assert.deepStrictEqual(local(migrated.caseRecord), { submitted: true, notes: 'keep ticket' });
assert.deepStrictEqual(local(migrated.independentLab), { answers: { q1: 'b' }, attempts: 2 });
assert.deepStrictEqual(local(migrated.customLegacyField), { keep: 17 });
assert.deepStrictEqual(local(migrated.assessment.selectedIocIds), ['M04-I-001']);
assert.strictEqual(migrated.assessment.ruleDraft.threshold, 5);
assert.strictEqual(migrated.assessment.ruleDraft.enabled, true);
assert.strictEqual(migrated.assessment.legacyAssessmentField, 'retain');
assert.strictEqual(migrated.assessment.schemaVersion, 1);
assert.strictEqual(migrated.assessment.scenarioId, fixture.scenario.id);
assert.deepStrictEqual(local(migrated.assessment.iocStatusById), {});
assert.deepStrictEqual(local(migrated.assessment.alertIds), []);
assert.deepStrictEqual(local(migrated.assessment.actionHistory), []);
assert.strictEqual(migrated.assessment.nextActionSequence, 1);
assert.deepStrictEqual(local(migrated.assessment.automationActions), []);
assert.deepStrictEqual(local(migrated.assessment.automationExecutions), []);
assert.strictEqual(migrated.assessment.nextAutomationActionSequence, 1);
assert.strictEqual(migrated.assessment.nextAutomationExecutionSequence, 1);
assert.deepStrictEqual(local(migrated.assessment.executions), []);
assert.strictEqual(migrated.assessment.nextExecutionSequence, 1);
const learnerLifecycleState = api.normalize({ assessment: { reports: [{ id: 'R-local', sourceReliability: 'learner note' }], iocs: [{ id: 'I-local', status: 'expired' }] } }, fixture);
assert.deepStrictEqual(local(learnerLifecycleState.assessment.reports), [{ id: 'R-local', sourceReliability: 'learner note' }]);
assert.deepStrictEqual(local(learnerLifecycleState.assessment.iocs), [{ id: 'I-local', status: 'expired' }]);
assert.deepStrictEqual(local(api.normalize(migrated, fixture)), local(migrated), 'normalization should be deterministic and idempotent');

const automationState = api.normalize({ assessment: {
  automationActions: [{ id: 'M04-AUTO-000007', schemaVersion: 1, sequence: 7, type: 'ticket' }],
  automationExecutions: [{ id: 'M04-AUTO-EXEC-000009', schemaVersion: 1, sequence: 9, actionId: 'M04-AUTO-000007' }],
} }, fixture).assessment;
assert.strictEqual(automationState.nextAutomationActionSequence, 8);
assert.strictEqual(automationState.nextAutomationExecutionSequence, 10);
const legacyAutomation = api.normalize({ assessment: {
  automationActions: Array.from({ length: 205 }, (_, index) => ({ id: `M04-AUTO-${String(index + 1).padStart(6, '0')}`, sequence: index + 1 })),
  automationExecutions: Array.from({ length: 205 }, (_, index) => ({ id: `M04-AUTO-EXEC-${String(index + 1).padStart(6, '0')}`, sequence: index + 1 })),
} }, fixture).assessment;
assert.strictEqual(legacyAutomation.automationActions.length, 200);
assert.strictEqual(legacyAutomation.automationActions[0].sequence, 6);
assert.strictEqual(legacyAutomation.automationExecutions.length, 200);
assert.strictEqual(legacyAutomation.automationExecutions[0].sequence, 6);
assert.strictEqual(legacyAutomation.nextAutomationActionSequence, 206);
assert.strictEqual(legacyAutomation.nextAutomationExecutionSequence, 206);

const partial = api.normalize({ assessment: { schemaVersion: 0, ruleDraft: null } }, fixture);
assert.strictEqual(partial.assessment.schemaVersion, 1);
assert.deepStrictEqual(local(partial.assessment.ruleDraft), { id: '', queryId: '', name: '', description: '', severity: 'Medium', query: '', groupingField: '', threshold: 1, windowMinutes: 60, exclusion: { enabled: false, field: 'EventType', operator: '==', value: '', reason: '' }, suppression: { enabled: false, groupField: 'Account', windowMinutes: 10 }, enabled: false });
assert.deepStrictEqual(local(partial.assessment.selectedIocIds), []);
assert.deepStrictEqual(local(partial.assessment.actionHistory), []);

const legacyActions = Array.from({ length: 205 }, (_, index) => ({ sequence: index + 1, type: 'query_test', timestamp: '2026-09-24T09:00:00Z', details: {} }));
const migratedActions = api.normalize({ assessment: { actionHistory: legacyActions } }, fixture).assessment;
assert.strictEqual(migratedActions.actionHistory.length, 200, 'legacy history is bounded during migration');
assert.strictEqual(migratedActions.actionHistory[0].sequence, 6);
assert.strictEqual(migratedActions.nextActionSequence, 206, 'migration advances sequence beyond retained history');
const migratedExecutions = api.normalize({ assessment: { executions: [{ id: 'M04-EXEC-0007', mode: 'manual', status: 'pending' }] } }, fixture).assessment;
assert.strictEqual(migratedExecutions.nextExecutionSequence, 8, 'migration advances the execution sequence beyond stored history');

const user = { email: 'learner@example.test' };
const loaded = api.load(user, { notes: '' }, fixture);
assert.strictEqual(calls[0][0], 'load');
assert.strictEqual(calls[0][1], api.LAB_ID);
assert.strictEqual(calls[0][2], api.MODULE_KEY);
assert.strictEqual(loaded.assessment.scenarioId, fixture.scenario.id);
assert.strictEqual(calls[1][0], 'save', 'loading a legacy shape persists its migration');
assert.strictEqual(calls[1][4].assessment.schemaVersion, api.VERSION);
api.save(user, migrated, fixture);
assert.strictEqual(calls[2][0], 'save');
assert.strictEqual(calls[2][1], api.LAB_ID);
assert.strictEqual(calls[2][2], api.MODULE_KEY);
assert.strictEqual(calls[2][4].assessment.schemaVersion, 1);
api.reset(user, { notes: '' }, fixture);
assert.strictEqual(calls[3][0], 'reset');
assert.strictEqual(calls[3][1], api.LAB_ID);
assert.strictEqual(calls[4][0], 'save', 'reset persists the versioned default shape');
assert.strictEqual(calls[4][4].assessment.schemaVersion, api.VERSION);

console.log('M04 assessment state contract: all checks passed');

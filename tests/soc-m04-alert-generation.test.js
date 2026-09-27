#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const context = {};
vm.createContext(context);
for (const filename of [
  'soc-assessment-scorer.js', 'soc-assessment-evolution.js', 'soc-console-core.js',
  'soc-alert-queue-ui.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js',
  'soc-m04-assessment-actions.js', 'kql-engine.js', 'soc-m04-rule-evaluator.js',
  'soc-m04-rules-ui.js', 'soc-m04-assessment-console.js',
]) vm.runInContext(fs.readFileSync(path.join(portal, filename), 'utf8'), context, { filename });
const fixture = vm.runInContext('SocM04AssessmentData', context);
const clone = (value) => JSON.parse(JSON.stringify(value));
const run = (rule, id = 'M04-EXEC-0001') => {
  const assessment = { rules: [clone(rule)], executions: [{ id, ruleId: rule.id, status: 'pending', requestedAt: fixture.scenario.end }], nextAlertSequence: 1, alertIds: [], alerts: [], actionHistory: [], nextActionSequence: 1 };
  const completed = vm.runInContext('SocM04RulesUi.completePendingExecution', context)(assessment, id, fixture);
  return { assessment, completed };
};
const base = {
  id: 'M04-RULE-0001', queryId: 'M04-Q-0001', name: 'Password spray', severity: 'High', enabled: true,
  query: 'AuthLog | where EventType == "AuthFailure" | project EventId, SourceIp, Account',
  groupingField: 'SourceIp', threshold: 4, windowMinutes: 20,
};

const pendingAssessment = { rules: [clone(base)], executions: [], alerts: [], alertIds: [], nextExecutionSequence: 1, actionHistory: [], nextActionSequence: 1 };
const pending = vm.runInContext('SocM04RulesUi.recordExecution', context)(pendingAssessment, base.id, fixture.scenario.end, 'manual');
assert.strictEqual(pending.status, 'pending');
assert.deepStrictEqual(clone(pendingAssessment.alerts), [], 'requesting a pending execution does not create alerts');
const disabled = run({ ...base, enabled: false });
assert.strictEqual(disabled.completed.status, 'failed');
assert.deepStrictEqual(clone(disabled.assessment.alerts), []);
assert.strictEqual(disabled.completed.completedAt, fixture.scenario.end);

const correct = run(base);
assert.strictEqual(correct.completed.status, 'completed');
assert.strictEqual(correct.assessment.alerts.length, 1, 'only threshold-met retained group becomes an alert');
assert.deepStrictEqual(clone(correct.completed.alertIds), [correct.assessment.alerts[0].id]);
assert.strictEqual(correct.assessment.alerts[0].executionId, correct.completed.id);
assert.strictEqual(correct.assessment.alerts[0].sourceQuery, base.query);
assert.strictEqual(correct.assessment.alerts[0].sourceRule, base.name);
assert.strictEqual(correct.assessment.alerts[0].severity, 'High');
assert.deepStrictEqual(clone(correct.assessment.alerts[0].eventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']);
assert.strictEqual(correct.assessment.alerts[0].createdAt, fixture.scenario.end);

const broad = run({ ...base, id: 'M04-RULE-0002', threshold: 2 }, 'M04-EXEC-0002');
const api = vm.runInContext('SocM04RulesUi', context);
assert.strictEqual(broad.assessment.alerts.length, 2, 'broad rule alerts only its threshold-met groups');
assert.ok(broad.assessment.alerts.every((alert) => alert.executionId === broad.completed.id));
assert.deepStrictEqual(clone(broad.assessment.alerts.map((alert) => [alert.group, alert.matchCount])), [
  ['198.51.100.64', 5], ['203.0.113.77', 3],
], 'broad thresholds expose the lower-volume noisy group as well as the stronger signal');
const narrow = run({ ...base, id: 'M04-RULE-0005', threshold: 6 }, 'M04-EXEC-0005');
assert.strictEqual(narrow.completed.status, 'completed');
assert.deepStrictEqual(clone(narrow.assessment.alerts), [], 'a narrow threshold misses the scenario when no group reaches six matches');
const corrected = run({ ...base, id: 'M04-RULE-0006', threshold: 4 }, 'M04-EXEC-0006');
assert.deepStrictEqual(clone(corrected.assessment.alerts.map((alert) => [alert.group, alert.matchCount])), [
  ['198.51.100.64', 5],
], 'correcting the threshold detects only the intended high-volume group');

const lifecycle = { rules: [clone(base)], executions: [], nextExecutionSequence: 1, alerts: [], alertIds: [], nextAlertSequence: 1, actionHistory: [], nextActionSequence: 1 };
const firstRun = apiRun(lifecycle, base.id);
const firstAlertSnapshot = clone(lifecycle.alerts[0]);
const secondRun = apiRun(lifecycle, base.id);
assert.strictEqual(firstRun.status, 'completed');
assert.strictEqual(secondRun.status, 'completed');
assert.deepStrictEqual(clone(lifecycle.alerts.map((alert) => alert.executionId)), ['M04-EXEC-0001', 'M04-EXEC-0002'], 'repeated executions create distinct, linked alerts');
assert.deepStrictEqual(clone(lifecycle.alerts.map((alert) => alert.id)), ['M04-ALERT-0001', 'M04-ALERT-0002']);
assert.deepStrictEqual(clone(lifecycle.alerts[0]), firstAlertSnapshot, 'repeated executions do not rewrite earlier alerts');

const edited = lifecycle.rules[0];
edited.name = 'Corrected password spray';
edited.query = 'AuthLog | where EventType == "AuthFailure" and SourceIp == "203.0.113.77" | project EventId, SourceIp, Account';
edited.threshold = 3;
edited.severity = 'Critical';
const rerun = apiRun(lifecycle, edited.id);
assert.strictEqual(rerun.status, 'completed');
assert.deepStrictEqual(clone(lifecycle.alerts.map((alert) => [alert.id, alert.executionId, alert.group, alert.sourceRule, alert.severity])), [
  ['M04-ALERT-0001', 'M04-EXEC-0001', '198.51.100.64', 'Password spray', 'High'],
  ['M04-ALERT-0002', 'M04-EXEC-0002', '198.51.100.64', 'Password spray', 'High'],
  ['M04-ALERT-0003', 'M04-EXEC-0003', '203.0.113.77', 'Corrected password spray', 'Critical'],
], 'rerun after edits uses the new rule while preserving prior alert snapshots');
const excluded = run({ ...base, id: 'M04-RULE-0003', exclusion: { enabled: true, field: 'SourceIp', operator: '==', value: '198.51.100.64', reason: 'Expected testing' } }, 'M04-EXEC-0003');
assert.strictEqual(excluded.assessment.alerts.length, 0, 'fully excluded candidate is not alerted');
assert.strictEqual(excluded.completed.reviewEvidence.excluded.length, 1);
assert.ok(excluded.completed.reviewEvidence.excluded[0].exclusion.evidence.length > 0);
const suppressed = run({ ...base, id: 'M04-RULE-0004', threshold: 2, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 15 } }, 'M04-EXEC-0004');
assert.strictEqual(suppressed.assessment.alerts.length, 1, 'suppressed group is not alerted');
assert.strictEqual(suppressed.completed.reviewEvidence.suppressed.length, 1);

function apiRun(assessment, ruleId) {
  const execution = api.recordExecution(assessment, ruleId, fixture.scenario.end, 'manual');
  return api.completePendingExecution(assessment, execution.id, fixture);
}
api.selectAlert(correct.assessment, correct.assessment.alerts[0].id);
assert.strictEqual(correct.assessment.selectedAlertId, correct.assessment.alerts[0].id);
api.reviewAlert(correct.assessment, correct.assessment.selectedAlertId, 'Reviewed evidence', fixture.scenario.end);
assert.strictEqual(correct.assessment.alerts[0].reviewNote, 'Reviewed evidence');
assert.deepStrictEqual(clone(correct.assessment.actionHistory.at(-1)), {
  id: 'm04-action-000002', sequence: 2, type: 'alert_review', timestamp: fixture.scenario.end,
  details: { alertId: correct.assessment.alerts[0].id, executionId: correct.completed.id, status: 'In review', note: 'Reviewed evidence' },
});
const normalized = vm.runInContext('SocM04AssessmentState.normalize', context)(correct.assessment ? { assessment: correct.assessment } : {}, fixture);
assert.strictEqual(normalized.assessment.selectedAlertId, correct.assessment.alerts[0].id, 'selected alert survives state migration');
assert.strictEqual(normalized.assessment.alerts[0].executionId, correct.completed.id);

const unsafe = run({ ...base, name: '<img src=x onerror=alert(1)>' });
const html = vm.runInContext('SocM04AssessmentConsole.renderAlerts', context)(unsafe.assessment);
assert.doesNotMatch(html, /<img src=x/);
assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(html, /<script|onerror="/i);
console.log('M04 alert generation, execution linking, review persistence, and HTML safety: all checks passed');

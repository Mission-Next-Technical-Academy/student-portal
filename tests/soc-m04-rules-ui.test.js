#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['kql-engine.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-actions.js', 'soc-m04-assessment-state.js', 'soc-m04-rules-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM04AssessmentData', context);
const api = vm.runInContext('SocM04RulesUi', context);
const stateApi = vm.runInContext('SocM04AssessmentState', context);
const local = (value) => JSON.parse(JSON.stringify(value));
let state = stateApi.normalize({ assessment: {} }, fixture).assessment;
const bad = api.test(state, fixture, 'MissingTable | take 5', '2026-09-24T09:30:00Z');
assert.strictEqual(bad.succeeded, false);
assert.match(bad.error, /Unknown table/);
assert.strictEqual(state.actionHistory.at(-1).type, 'query_test');
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:30:00Z');
assert.throws(() => api.saveQuery(state, 'MissingTable | take 5', '2026-09-24T09:31:00Z'), /Test this exact query successfully/);

const query = 'AuthLog | where Result == "Success" and SourceIp == "198.51.100.64" | project EventId, Account, SourceIp';
const good = api.test(state, fixture, query, '2026-09-24T09:32:00Z');
assert.strictEqual(good.succeeded, true);
assert.strictEqual(good.rows.length, 1);
assert.strictEqual(good.rows[0].EventId, 'M04-A-006');
const saved = api.saveQuery(state, query, '2026-09-24T09:33:00Z', 'Successful sign-ins');
assert.strictEqual(saved.id, 'M04-Q-0001');
assert.strictEqual(state.actionHistory.at(-1).type, 'rule_change');
assert.strictEqual(state.actionHistory.at(-1).details.operation, 'query-save');
const draft = api.convertToDraft(state, saved.id, '2026-09-24T09:34:00Z');
assert.strictEqual(draft.id, 'M04-RULE-0001');
assert.strictEqual(draft.queryId, saved.id);
assert.strictEqual(draft.status, 'draft');
assert.strictEqual(state.actionHistory.at(-1).details.operation, 'query-to-rule-draft');
const ruleFields = { name: 'Success sign-in rule', description: 'Track successful authentication events.', severity: 'High', groupingField: 'Account', threshold: 2, windowMinutes: 30 };
const updatedRule = api.updateDraft(state, draft.id, ruleFields, '2026-09-24T09:34:30Z');
assert.deepStrictEqual(local({ name: updatedRule.name, description: updatedRule.description, severity: updatedRule.severity, groupingField: updatedRule.groupingField, threshold: updatedRule.threshold, windowMinutes: updatedRule.windowMinutes }), ruleFields);
assert.strictEqual(state.actionHistory.at(-1).type, 'rule_change');
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:34:30Z');
assert.strictEqual(state.actionHistory.at(-1).details.operation, 'rule-draft-edit');
const safeguardFields = {
  exclusion: { enabled: true, field: 'Device', operator: 'contains', value: '<managed & trusted>', reason: 'Approved device exception' },
  suppression: { enabled: true, groupField: 'SourceIp', windowMinutes: 15 },
};
const safeguardRule = api.updateSafeguards(state, draft.id, safeguardFields, '2026-09-24T09:34:40Z');
assert.deepStrictEqual(local({ exclusion: safeguardRule.exclusion, suppression: safeguardRule.suppression }), safeguardFields);
assert.deepStrictEqual(local(state.ruleDraft.exclusion), safeguardFields.exclusion);
assert.strictEqual(state.actionHistory.at(-1).type, 'rule_change');
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:34:40Z');
assert.strictEqual(state.actionHistory.at(-1).details.operation, 'rule-safeguards-edit');
const scheduleTime = '2026-09-24T10:00:00Z';
const scheduledRule = api.configureSchedule(state, draft.id, { enabled: true, frequencyMinutes: 5, scheduledAt: scheduleTime }, '2026-09-24T09:35:00Z');
assert.strictEqual(scheduledRule.enabled, true);
assert.deepStrictEqual(local(scheduledRule.schedule), { frequencyMinutes: 5, scheduledAt: '2026-09-24T10:00:00.000Z' });
assert.strictEqual(state.actionHistory.at(-1).type, 'scheduling');
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:35:00Z');
assert.strictEqual(state.actionHistory.at(-1).details.operation, 'schedule-configure');
const manualRun = api.recordExecution(state, draft.id, '2026-09-24T09:36:00Z');
assert.deepStrictEqual(local(manualRun), { id: 'M04-EXEC-0001', ruleId: draft.id, requestedAt: '2026-09-24T09:36:00.000Z', mode: 'manual', status: 'pending' });
assert.strictEqual(state.actionHistory.at(-1).type, 'rule_execution');
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:36:00Z');
const scheduledRun = api.recordExecution(state, draft.id, '2026-09-24T09:37:00Z', 'scheduled');
assert.strictEqual(scheduledRun.mode, 'scheduled');
assert.throws(() => api.recordExecution(state, draft.id, '2026-09-24T09:37:00Z', 'bogus'), /mode/);
const maxBoundary = api.configureSchedule(state, draft.id, { enabled: true, frequencyMinutes: 10080, scheduledAt: '2026-12-23T09:35:00Z' }, '2026-09-24T09:35:00Z');
assert.strictEqual(maxBoundary.schedule.frequencyMinutes, 10080, 'maximum cadence and 90-day schedule boundary are inclusive');
for (const invalid of [
  [{ enabled: true, frequencyMinutes: 4, scheduledAt: scheduleTime }, /Frequency/],
  [{ enabled: true, frequencyMinutes: 10081, scheduledAt: scheduleTime }, /Frequency/],
  [{ enabled: true, frequencyMinutes: 5.5, scheduledAt: scheduleTime }, /Frequency/],
  [{ enabled: true, frequencyMinutes: 5, scheduledAt: '2026-09-24T09:34:00Z' }, /from now/],
  [{ enabled: true, frequencyMinutes: 5, scheduledAt: '2026-12-24T09:35:00Z' }, /90 days/],
]) assert.throws(() => api.configureSchedule(state, draft.id, invalid[0], '2026-09-24T09:35:00Z'), invalid[1]);
api.configureSchedule(state, draft.id, { enabled: false, frequencyMinutes: 5, scheduledAt: scheduleTime }, '2026-09-24T09:38:00Z');
assert.strictEqual(state.rules[0].schedule.scheduledAt, null, 'disabled rule cannot retain a scheduled time');
assert.throws(() => api.recordExecution(state, draft.id, '2026-09-24T09:39:00Z', 'scheduled'), /Disabled rules/);
api.configureSchedule(state, draft.id, { enabled: true, frequencyMinutes: 5, scheduledAt: '' }, '2026-09-24T09:40:00Z');
assert.throws(() => api.recordExecution(state, draft.id, '2026-09-24T09:41:00Z', 'scheduled'), /configured schedule/);
for (const invalid of [
  [{ exclusion: { ...safeguardFields.exclusion, field: 'maliciousSourceIp' }, suppression: safeguardFields.suppression }, /real telemetry column/],
  [{ exclusion: { ...safeguardFields.exclusion, operator: 'matches-regex' }, suppression: safeguardFields.suppression }, /supported exclusion operator/],
  [{ exclusion: { ...safeguardFields.exclusion, value: '' }, suppression: safeguardFields.suppression }, /requires a value/],
  [{ exclusion: { ...safeguardFields.exclusion, reason: '' }, suppression: safeguardFields.suppression }, /requires a reason/],
  [{ exclusion: safeguardFields.exclusion, suppression: { ...safeguardFields.suppression, groupField: 'confirmedCompromisedAccounts' } }, /real telemetry column/],
  [{ exclusion: safeguardFields.exclusion, suppression: { ...safeguardFields.suppression, windowMinutes: 1441 } }, /Suppression window/],
  [{ exclusion: safeguardFields.exclusion, suppression: { ...safeguardFields.suppression, windowMinutes: 2.5 } }, /Suppression window/],
]) assert.throws(() => api.updateSafeguards(state, draft.id, invalid[0], '2026-09-24T09:34:41Z'), invalid[1]);
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:40:00Z', 'invalid safeguard configs do not record actions');
for (const invalid of [
  [{ ...ruleFields, name: ' ' }, /Rule name/],
  [{ ...ruleFields, severity: 'Urgent' }, /severity/],
  [{ ...ruleFields, groupingField: 'Account;drop' }, /Grouping field/],
  [{ ...ruleFields, threshold: 1.5 }, /Threshold/],
  [{ ...ruleFields, threshold: 10001 }, /Threshold/],
  [{ ...ruleFields, windowMinutes: 0 }, /Lookback/],
  [{ ...ruleFields, windowMinutes: 1441 }, /Lookback/],
  [{ ...ruleFields, description: 'x'.repeat(501) }, /Description/],
]) assert.throws(() => api.updateDraft(state, draft.id, invalid[0], '2026-09-24T09:34:31Z'), invalid[1]);
assert.strictEqual(state.actionHistory.at(-1).timestamp, '2026-09-24T09:40:00Z', 'invalid fields do not record actions');
assert.throws(() => api.convertToDraft(state, 'M04-Q-9999', '2026-09-24T09:35:00Z'), /Saved query not found/);
state.queryActionError = 'Test this exact query successfully before saving it.';
assert.match(api.render(state), /role="alert" data-m04-query-action-error>Test this exact query successfully before saving it\./);
state.queryActionError = '';

const second = api.saveQuery(state, query, '2026-09-24T09:36:00Z', 'Same query again');
assert.strictEqual(second.id, 'M04-Q-0002');
const persisted = stateApi.normalize(JSON.parse(JSON.stringify({ assessment: state })), fixture).assessment;
assert.deepStrictEqual(local(persisted.savedQueries), local(state.savedQueries));
assert.deepStrictEqual(local(persisted.rules), local(state.rules));
assert.deepStrictEqual(local(persisted.ruleDraft.exclusion), safeguardFields.exclusion);
assert.deepStrictEqual(local(persisted.ruleDraft.suppression), safeguardFields.suppression);
assert.deepStrictEqual(local({ name: persisted.ruleDraft.name, description: persisted.ruleDraft.description, severity: persisted.ruleDraft.severity, groupingField: persisted.ruleDraft.groupingField, threshold: persisted.ruleDraft.threshold, windowMinutes: persisted.ruleDraft.windowMinutes, query: persisted.ruleDraft.query }), local({ name: state.ruleDraft.name, description: state.ruleDraft.description, severity: state.ruleDraft.severity, groupingField: state.ruleDraft.groupingField, threshold: state.ruleDraft.threshold, windowMinutes: state.ruleDraft.windowMinutes, query: state.ruleDraft.query }));
assert.deepStrictEqual(local(persisted.actionHistory), local(state.actionHistory));
assert.deepStrictEqual(local(persisted.executions), local(state.executions));
assert.strictEqual(persisted.nextExecutionSequence, state.nextExecutionSequence);
assert.strictEqual(persisted.nextQuerySequence, 3);
assert.strictEqual(persisted.nextRuleSequence, 2);
const rendered = api.render(persisted);
assert.match(rendered, /Analytics|query/i);
assert.match(rendered, /M04-Q-0001/);
assert.match(rendered, /M04-RULE-0001/);
assert.match(rendered, /data-m04-rule-preview/);
assert.match(rendered, /Rule schedule/);
assert.match(rendered, /Execution history/);
assert.match(rendered, /Success sign-in rule/);
assert.match(rendered, /Group by Account; alert at 2 matches over 30 minutes/);
assert.match(rendered, /Exclude Device contains &lt;managed &amp; trusted&gt; \(Approved device exception\)/);
assert.match(rendered, /Suppression enabled by SourceIp for 15 minutes/);
assert.ok(!rendered.includes('<managed & trusted>'), 'preview escapes learner-authored config values');
assert.match(rendered, /AuthLog \| where Result == &quot;Success&quot; and SourceIp == &quot;198.51.100.64&quot; \| project EventId, Account, SourceIp/);
for (const forbidden of ['maliciousSourceIp', 'confirmedCompromisedAccounts', 'successfulAuthenticationEventIds']) {
  assert.ok(!rendered.includes(forbidden), `UI must not expose truth field ${forbidden}`);
  assert.ok(!JSON.stringify(persisted).includes(forbidden), `learner state must not persist truth field ${forbidden}`);
}
assert.ok(!Object.hasOwn(persisted, 'truth'));
console.log('M04 query authoring and rule-draft conversion: all checks passed');

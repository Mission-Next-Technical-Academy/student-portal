#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['kql-engine.js', 'soc-m04-assessment-data.js', 'soc-m04-rule-evaluator.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM04AssessmentData', context);
const api = vm.runInContext('SocM04RuleEvaluator', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const base = {
  enabled: true,
  query: 'AuthLog | where EventType == "AuthFailure" | project EventId, SourceIp, Account',
  groupingField: 'SourceIp', threshold: 4, windowMinutes: 20,
};

const beforeFixture = JSON.stringify(fixture);
const raw = api.evaluate(base, fixture);
assert.strictEqual(raw.succeeded, true);
assert.strictEqual(raw.evaluatedAt, fixture.scenario.end, 'evaluation clock is the immutable scenario end');
assert.deepStrictEqual(local(raw.candidates), [{
  group: '198.51.100.64', groupingField: 'SourceIp', matchCount: 5, rawRowCount: 5,
  metricColumn: null, threshold: 4, thresholdMet: true,
  supportingEventIds: ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005'], disposition: 'retained', exclusion: null, suppression: null,
}, { group: '203.0.113.77', groupingField: 'SourceIp', matchCount: 3, rawRowCount: 3,
  metricColumn: null, threshold: 4, thresholdMet: false,
  supportingEventIds: ['M04-A-007', 'M04-A-008', 'M04-A-009'], disposition: 'retained', exclusion: null, suppression: null,
}]);

const exclusionCases = [
  [{ field: 'SourceIp', operator: '==', value: '203.0.113.77' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
  [{ field: 'EventType', operator: '!=', value: 'AuthSuccess' }, ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-007', 'M04-A-008', 'M04-A-009']],
  [{ field: 'Device', operator: 'contains', value: 'MAIL CLIENT' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
  [{ field: 'Device', operator: 'startswith', value: 'managed' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
];
for (const [exclusion, expectedIds] of exclusionCases) {
  const result = api.evaluate({ ...base, exclusion: { ...exclusion, enabled: true, reason: 'test safeguard' } }, fixture);
  assert.deepStrictEqual(local(result.excludedCandidates.flatMap((candidate) => candidate.exclusion.evidence.map((item) => item.eventId)).sort()), expectedIds);
  assert.ok(result.excludedCandidates.every((candidate) => candidate.exclusion.reason === 'test safeguard'));
  assert.strictEqual(result.retainedCandidates.length + result.excludedCandidates.length + result.suppressedCandidates.length, result.candidates.length);
}
const mixedFixture = local(fixture);
mixedFixture.scenario.telemetry.push({ id: 'M04-A-010', time: '2026-09-24T09:04:30Z', type: 'AuthFailure', account: 'acct-99', sourceIp: '198.51.100.64', result: 'Failure', device: 'Managed client' });
const rowScopedExclusion = api.evaluate({ ...base, threshold: 5,
  exclusion: { enabled: true, field: 'Device', operator: 'contains', value: 'managed', reason: 'Known managed retry' },
}, mixedFixture);
assert.strictEqual(rowScopedExclusion.retainedCandidates.length, 1, 'excluding one event must not discard its whole grouped source');
assert.strictEqual(rowScopedExclusion.retainedCandidates[0].group, '198.51.100.64');
assert.strictEqual(rowScopedExclusion.retainedCandidates[0].matchCount, 5, 'threshold is recomputed after event-level exclusion');
assert.ok(!rowScopedExclusion.retainedCandidates[0].supportingEventIds.includes('M04-A-010'));
assert.deepStrictEqual(local(rowScopedExclusion.retainedCandidates[0].exclusion.evidence.map((item) => item.eventId)), ['M04-A-010']);
assert.strictEqual(rowScopedExclusion.excludedCandidates.length, 1, 'fully excluded groups remain inspectable for audit');
const disabledSafeguards = api.evaluate({ ...base,
  exclusion: { enabled: false, field: 'not-a-field', operator: 'bad', value: '', reason: '' },
  suppression: { enabled: false, groupField: 'bad', windowMinutes: -1 },
}, fixture);
assert.strictEqual(disabledSafeguards.excludedCandidates.length, 0, 'disabled exclusions have no effect');
assert.strictEqual(disabledSafeguards.suppressedCandidates.length, 0, 'disabled suppression has no effect');

const suppressed = api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 15 } }, fixture);
assert.deepStrictEqual(local(suppressed.suppressedCandidates.map((candidate) => candidate.group)), ['203.0.113.77']);
assert.strictEqual(suppressed.suppressedCandidates[0].suppression.suppressedByGroup, '198.51.100.64');
assert.deepStrictEqual(local(suppressed.suppressedCandidates[0].suppression.suppressedByEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']);
assert.deepStrictEqual(local(suppressed.suppressedCandidates[0].suppression.evidenceEventIds), ['M04-A-007', 'M04-A-008', 'M04-A-009']);
const outsideSuppressionWindow = api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 5 } }, fixture);
assert.strictEqual(outsideSuppressionWindow.suppressedCandidates.length, 0, 'candidates outside suppression window remain retained');

const aggregate = api.evaluate({ ...base,
  query: 'AuthLog | where EventType == "AuthFailure" | summarize Attempts=count() by SourceIp',
  threshold: 4,
}, fixture);
assert.strictEqual(aggregate.succeeded, true);
assert.strictEqual(aggregate.candidates[0].metricColumn, 'Attempts');
assert.strictEqual(aggregate.candidates[0].matchCount, 5, 'aggregate metric, not summarize output row count, drives threshold');
assert.strictEqual(aggregate.candidates[0].rawRowCount, 1);
assert.strictEqual(aggregate.candidates[0].thresholdMet, true);
assert.deepStrictEqual(local(aggregate.candidates[0].supportingEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']);

const narrowWindow = api.evaluate({ ...base, windowMinutes: 16, threshold: 2 }, fixture);
assert.deepStrictEqual(local(narrowWindow.candidates.map((candidate) => [candidate.group, candidate.matchCount])), [['198.51.100.64', 2], ['203.0.113.77', 3]]);
assert.strictEqual(narrowWindow.windowStart, '2026-09-24T09:04:00.000Z');
const accountGroups = api.evaluate({ ...base, groupingField: 'Account', threshold: 2 }, fixture);
assert.ok(accountGroups.candidates.some((candidate) => candidate.group === 'acct-17' && candidate.matchCount === 3));

for (const [rule, message] of [
  [{ ...base, enabled: false }, /disabled/],
  [{ ...base, query: 'AuthLog | unsupported x' }, /Unsupported operator/],
  [{ ...base, groupingField: 'MissingField' }, /do not include grouping field/],
  [{ ...base, threshold: 0 }, /threshold or lookback/],
  [{ ...base, windowMinutes: 1441 }, /threshold or lookback/],
]) {
  const result = api.evaluate(rule, fixture);
  assert.strictEqual(result.succeeded, false);
  assert.match(result.error, message);
  assert.deepStrictEqual(local(result.candidates), []);
}
assert.deepStrictEqual(local(api.evaluate(base, fixture)), local(api.evaluate(base, fixture)), 'evaluation is repeatable');
assert.deepStrictEqual(local(api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 15 } }, fixture)), local(api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 15 } }, fixture)), 'safeguard evaluation is reproducible');
assert.strictEqual(JSON.stringify(fixture), beforeFixture, 'evaluation does not mutate fixture truth or telemetry');
assert.deepStrictEqual(local(base), {
  enabled: true,
  query: 'AuthLog | where EventType == "AuthFailure" | project EventId, SourceIp, Account',
  groupingField: 'SourceIp', threshold: 4, windowMinutes: 20,
}, 'evaluation does not mutate the saved rule');

console.log('M04 deterministic rule candidate evaluator: all checks passed');

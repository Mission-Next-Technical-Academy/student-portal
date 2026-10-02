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
const cand = (group, ids) => ({ group, groupingField: 'SourceIp', matchCount: ids.length, rawRowCount: ids.length,
  metricColumn: null, threshold: 4, thresholdMet: ids.length >= 4, supportingEventIds: ids, disposition: 'retained', exclusion: null, suppression: null });
// Sprint 2: besides the spray (198.51.100.64) and the stale mail client (203.0.113.77), three low-volume
// background groups appear as below-threshold candidates (scheduled probe, backup retry, branch egress).
assert.deepStrictEqual(local(raw.candidates), [
  cand('10.44.0.9', ['M04-A-115', 'M04-A-116', 'M04-A-117']),
  cand('10.44.8.5', ['M04-A-118', 'M04-A-119']),
  cand('198.51.100.64', ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']),
  cand('203.0.113.140', ['M04-A-109', 'M04-A-111', 'M04-A-113']),
  cand('203.0.113.77', ['M04-A-007', 'M04-A-008', 'M04-A-009']),
]);
assert.deepStrictEqual(local(raw.candidates.filter((c) => c.thresholdMet).map((c) => c.group)), ['198.51.100.64'], 'only the spray meets the default threshold of 4');

const exclusionCases = [
  [{ field: 'SourceIp', operator: '==', value: '203.0.113.77' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
  [{ field: 'EventType', operator: '!=', value: 'AuthSuccess' }, ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-007', 'M04-A-008', 'M04-A-009', 'M04-A-109', 'M04-A-111', 'M04-A-113', 'M04-A-115', 'M04-A-116', 'M04-A-117', 'M04-A-118', 'M04-A-119']],
  [{ field: 'DeviceClass', operator: 'contains', value: 'MAIL CLIENT' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
  [{ field: 'DeviceClass', operator: 'startswith', value: 'managed' }, ['M04-A-007', 'M04-A-008', 'M04-A-009']],
];
for (const [exclusion, expectedIds] of exclusionCases) {
  const result = api.evaluate({ ...base, exclusion: { ...exclusion, enabled: true, reason: 'test safeguard' } }, fixture);
  assert.deepStrictEqual(local(result.excludedCandidates.flatMap((candidate) => candidate.exclusion.evidence.map((item) => item.eventId)).sort()), expectedIds);
  assert.ok(result.excludedCandidates.every((candidate) => candidate.exclusion.reason === 'test safeguard'));
  assert.strictEqual(result.retainedCandidates.length + result.excludedCandidates.length + result.suppressedCandidates.length, result.candidates.length);
}
// A rule saved before the entity-identity contract names the column "Device"; it must still evaluate as DeviceClass.
const legacyDeviceRule = api.evaluate({ ...base, exclusion: { enabled: true, field: 'Device', operator: 'startswith', value: 'managed', reason: 'legacy field name' } }, fixture);
assert.deepStrictEqual(local(legacyDeviceRule.excludedCandidates.flatMap((candidate) => candidate.exclusion.evidence.map((item) => item.eventId)).sort()), ['M04-A-007', 'M04-A-008', 'M04-A-009']);
const mixedFixture = local(fixture);
mixedFixture.scenario.telemetry.push({ id: 'M04-A-010', time: '2026-09-24T09:04:30Z', type: 'AuthFailure', account: 'acct-99', sourceIp: '198.51.100.64', result: 'Failure', deviceClass: 'Managed client' });
const rowScopedExclusion = api.evaluate({ ...base, threshold: 5,
  exclusion: { enabled: true, field: 'DeviceClass', operator: 'contains', value: 'managed', reason: 'Known managed retry' },
}, mixedFixture);
const metRetained = rowScopedExclusion.retainedCandidates.filter((candidate) => candidate.thresholdMet);
assert.strictEqual(metRetained.length, 1, 'excluding one event must not discard its whole grouped source');
assert.strictEqual(metRetained[0].group, '198.51.100.64');
assert.strictEqual(metRetained[0].matchCount, 5, 'threshold is recomputed after event-level exclusion');
assert.ok(!metRetained[0].supportingEventIds.includes('M04-A-010'));
assert.deepStrictEqual(local(metRetained[0].exclusion.evidence.map((item) => item.eventId)), ['M04-A-010']);
assert.strictEqual(rowScopedExclusion.excludedCandidates.length, 1, 'fully excluded groups remain inspectable for audit');
const disabledSafeguards = api.evaluate({ ...base,
  exclusion: { enabled: false, field: 'not-a-field', operator: 'bad', value: '', reason: '' },
  suppression: { enabled: false, groupField: 'bad', windowMinutes: -1 },
}, fixture);
assert.strictEqual(disabledSafeguards.excludedCandidates.length, 0, 'disabled exclusions have no effect');
assert.strictEqual(disabledSafeguards.suppressedCandidates.length, 0, 'disabled suppression has no effect');

const suppressed = api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 15 } }, fixture);
// Sprint 2: the three background groups also fall inside the 15-minute window of the earlier spray candidate.
assert.deepStrictEqual(local(suppressed.suppressedCandidates.map((candidate) => candidate.group)), ['10.44.0.9', '10.44.8.5', '203.0.113.140', '203.0.113.77']);
const suppressedMail = suppressed.suppressedCandidates.find((candidate) => candidate.group === '203.0.113.77');
assert.strictEqual(suppressedMail.suppression.suppressedByGroup, '198.51.100.64');
assert.deepStrictEqual(local(suppressedMail.suppression.suppressedByEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']);
assert.deepStrictEqual(local(suppressedMail.suppression.evidenceEventIds), ['M04-A-007', 'M04-A-008', 'M04-A-009']);
// A 1-minute window is shorter than the gap between every pair of candidate start times (>= 2 minutes).
const outsideSuppressionWindow = api.evaluate({ ...base, suppression: { enabled: true, groupField: 'EventType', windowMinutes: 1 } }, fixture);
assert.strictEqual(outsideSuppressionWindow.suppressedCandidates.length, 0, 'candidates outside suppression window remain retained');

const aggregate = api.evaluate({ ...base,
  query: 'AuthLog | where EventType == "AuthFailure" | summarize Attempts=count() by SourceIp',
  threshold: 4,
}, fixture);
assert.strictEqual(aggregate.succeeded, true);
const aggSpray = aggregate.candidates.find((candidate) => candidate.group === '198.51.100.64');
assert.strictEqual(aggSpray.metricColumn, 'Attempts');
assert.strictEqual(aggSpray.matchCount, 5, 'aggregate metric, not summarize output row count, drives threshold');
assert.strictEqual(aggSpray.rawRowCount, 1);
assert.strictEqual(aggSpray.thresholdMet, true);
assert.deepStrictEqual(local(aggSpray.supportingEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005']);

const narrowWindow = api.evaluate({ ...base, windowMinutes: 16, threshold: 2 }, fixture);
assert.deepStrictEqual(local(narrowWindow.candidates.map((candidate) => [candidate.group, candidate.matchCount])), [['10.44.0.9', 3], ['10.44.8.5', 2], ['198.51.100.64', 2], ['203.0.113.140', 3], ['203.0.113.77', 3]]);
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

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-actions.js', 'soc-m04-automation.js', 'soc-m04-assessment-rubric.js', 'soc-m04-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const api = vm.runInContext('SocM04AssessmentScorer', context);
const automation = vm.runInContext('SocM04Automation', context);
const rubric = vm.runInContext('SocM04AssessmentRubric', context);
const fixture = vm.runInContext('SocM04AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const timestamp = fixture.scenario.end;
const query = 'AuthLog | where EventType == "AuthFailure" | summarize count() by SourceIp';
const state = {
  assessment: {
    intelVerdicts: {
      'M04-I-001': { decision: 'malicious', rationale: 'Five accounts failed from this address in five minutes and acct-44 then signed in (M04-A-006).' },
      'M04-I-002': { decision: 'unknown', rationale: 'No sign-in or application record in this case mentions this address.' },
      'M04-I-003': { decision: 'unknown', rationale: 'Expired indicator and nothing in this case touches this domain.' },
      'M04-C-001': { decision: 'benign', rationale: 'acct-17 retries follow the CR-204 credential rotation and later succeeded (M04-A-121).' },
    },
    reports: local(fixture.scenario.reports), iocs: local(fixture.scenario.iocs),
    actionHistory: [
      { type: 'ioc_edit', details: { recordId: 'M04-I-001' } },
      { type: 'query_test', details: { succeeded: true, query } },
      { type: 'scheduling', details: { ruleId: 'rule-1', enabled: true, scheduledAt: timestamp } },
      { type: 'automation', details: { approvalRequestId: 'approval-1' } },
    ],
    automationActions: [{ id: 'auto-1' }],
    automationExecutions: [{ id: 'auto-exec-1', actionId: 'auto-1', details: { readOnly: true, sideEffects: [] } }],
    approvalRequests: [{ id: 'approval-1', status: 'approved', audit: [{ status: 'approved', execution: 'never' }] }],
    automationResults: [{ type: 'indicator_enrichment', status: 'succeeded', iocId: 'M04-I-001', executionId: 'auto-exec-1', matchedEventIds: ['M04-A-001'] }],
    savedQueries: [{ id: 'query-1', query }],
    rules: [{ id: 'rule-1', queryId: 'query-1', query, name: 'Spray', groupingField: 'sourceIp', threshold: 5, windowMinutes: fixture.scenario.truth.rule.windowMinutes, enabled: true, schedule: { scheduledAt: timestamp, frequencyMinutes: 30 }, exclusion: { enabled: true } }],
    executions: [{ id: 'execution-1', ruleId: 'rule-1', mode: 'scheduled', status: 'completed', alertIds: ['alert-1'], reviewEvidence: { excluded: [{ supportingEventIds: fixture.scenario.truth.rule.excludeEventIds }], suppressed: [] } }],
    alerts: [{ id: 'alert-1', ruleId: 'rule-1', sourceRule: 'Spray', groupingField: 'sourceIp', group: fixture.scenario.truth.maliciousSourceIp, eventIds: fixture.scenario.truth.rule.matchEventIds }],
  },
  caseRecord: { disposition: 'true-positive', escalation: 'Identity Response', notes: 'Credential spray from 198.51.100.64 followed by successful sign-in for acct-44; corroborated by IOC.' },
};

const before = local(state);
const full = api.score(state, fixture);
assert.strictEqual(full.score, 100);
assert.strictEqual(full.rawScore, 100);
assert.strictEqual(full.maxScore, 100);
assert.strictEqual(full.passed, true);
assert.strictEqual(full.review.cap, null);
assert.deepStrictEqual(local(state), before, 'scoring does not mutate learner state');
assert.deepStrictEqual(local(api.score(state, fixture)), local(full), 'same evidence produces deterministic output');
assert.strictEqual(full.review.awards.length, 16, 'one award per criterion, except indicator verdicts which itemise a verdict and a reasoning award per indicator');
assert.strictEqual(full.review.misses.length, 0);
assert(full.criteria.every((criterion) => criterion.points === criterion.max && criterion.feedback.includes('requirements evidenced.')),
  'correct outcome explains each fully awarded criterion');

const noisy = local(state);
noisy.assessment.rules[0].threshold = 2;
noisy.assessment.alerts.push({ id: 'alert-noisy', ruleId: 'rule-1', sourceRule: 'Spray', groupingField: 'sourceIp',
  group: '203.0.113.77', eventIds: ['M04-A-007', 'M04-A-008', 'M04-A-009', 'M04-A-010'] });
const broad = api.score(noisy, fixture);
assert(broad.criteria.find((criterion) => criterion.id === 'alert-coverage').points > 0,
  'broad rule retains partial credit for the expected malicious coverage');
assert.strictEqual(broad.criteria.find((criterion) => criterion.id === 'alert-tuning').points, 5,
  'alerting on the known benign retry earns only bounded partial tuning credit');
assert(broad.criteria.find((criterion) => criterion.id === 'alert-tuning').misses.some((miss) => miss.includes('benign retry')));
assert(broad.criteria.find((criterion) => criterion.id === 'alert-tuning').feedback.includes('partial evidence recorded, but requirements remain incomplete.'));

const narrow = local(state);
narrow.assessment.rules[0].threshold = 6;
narrow.assessment.alerts = [];
const missed = api.score(narrow, fixture);
assert.strictEqual(missed.criteria.find((criterion) => criterion.id === 'alert-coverage').points, 0,
  'a threshold above the scenario volume earns no alert-coverage credit');
assert(missed.criteria.find((criterion) => criterion.id === 'alert-coverage').misses.some((miss) => miss.includes('No generated alert')));
assert(missed.criteria.find((criterion) => criterion.id === 'alert-coverage').feedback.includes('required evidence is missing.'));

const correctedState = local(noisy);
correctedState.assessment.rules[0].threshold = 4;
correctedState.assessment.alerts = local(state.assessment.alerts);
const corrected = api.score(correctedState, fixture);
assert.strictEqual(corrected.criteria.find((criterion) => criterion.id === 'alert-coverage').points, 15);
assert.strictEqual(corrected.criteria.find((criterion) => criterion.id === 'alert-tuning').points, 10);
assert(corrected.criteria.find((criterion) => criterion.id === 'alert-tuning').feedback.includes('requirements evidenced.'));

const partialState = local(state);
partialState.assessment.automationResults = [];
partialState.assessment.alerts = [];
partialState.assessment.executions = [];
partialState.assessment.rules[0].enabled = false;
partialState.caseRecord = {};
const partial = api.score(partialState, fixture);
assert(partial.criteria.some((criterion) => criterion.points > 0 && criterion.points < criterion.max), 'evidenced but incomplete criteria receive bounded partial credit');
assert(partial.review.misses.length > 0);
assert(partial.review.feedback.some((line) => line.includes('partial evidence')));
const partialCriterion = partial.criteria.find((criterion) => criterion.points > 0 && criterion.points < criterion.max);
assert(partialCriterion,
  'partial evidence earns a bounded criterion-level award');
assert(partialCriterion.awards[0].reason.includes('Partial credit'));
assert(partialCriterion.misses.length > 0, 'partial award still explains what remains incomplete');
assert(partialCriterion.feedback.includes('partial evidence recorded, but requirements remain incomplete.'));

const empty = api.score({}, fixture);
assert.strictEqual(empty.score, 0);
assert.strictEqual(empty.passed, false);
assert(empty.criteria.every((criterion) => criterion.points === 0 && criterion.misses.length > 0));

const pendingRequest = local(state);
pendingRequest.assessment.actionHistory.push({ type: 'approval_review', details: { status: 'approved' } });
pendingRequest.assessment.approvalRequests[0].audit.push({ status: 'approved', execution: 'never' });
assert.strictEqual(api.hasExecutedDisruptiveChange(pendingRequest, fixture), false, 'approval alone is not unsafe execution');
assert.strictEqual(api.score(pendingRequest, fixture).score, 100, 'approval requests and decisions do not trigger the safety cap');

const approvalIntegration = local(state);
approvalIntegration.assessment.simulatedDisruptiveState = {
  accounts: [{ id: 'alice', enabled: true }],
  sessions: [{ id: 's-1', active: true }],
  network: { blocked: [] },
};
approvalIntegration.assessment.approvalRequests = [];
approvalIntegration.assessment.nextApprovalRequestSequence = 1;
const simulatedStateBeforeApprovals = local(approvalIntegration.assessment.simulatedDisruptiveState);
for (const [type, targetId, decision] of [
  ['account_disable', 'alice', 'approved'],
  ['session_revoke', 'session:s-1', 'rejected'],
  ['network_block', '198.51.100.64', 'approved'],
]) {
  const request = automation.requestApproval(approvalIntegration.assessment, fixture,
    { type, targetId, alertId: 'alert-1', actor: 'analyst', reason: `Review ${type}.` }, timestamp);
  assert.strictEqual(request.status, 'pending');
  const reviewed = automation.reviewApproval(approvalIntegration.assessment, request.id,
    decision, 'reviewer', `${decision} only.`, timestamp);
  assert.strictEqual(reviewed.status, decision);
  assert.deepStrictEqual(local(approvalIntegration.assessment.simulatedDisruptiveState), simulatedStateBeforeApprovals,
    `${type} request and ${decision} decision leave simulated account/session/network state unchanged`);
}
const approvalIntegrationScore = api.score(approvalIntegration, fixture);
assert.strictEqual(approvalIntegrationScore.score, 100, 'real approval request/decision audit records remain safe and do not trigger the critical cap');
assert.strictEqual(approvalIntegrationScore.review.cap, null);
assert.deepStrictEqual(local(approvalIntegrationScore.criticalMisses), []);

const executed = local(state);
executed.assessment.actionHistory.push({ type: 'disruptive_state_changed', details: { executed: true, before: { enabled: true }, after: { enabled: false } } });
const unsafe = api.score(executed, fixture);
assert.strictEqual(unsafe.rawScore, 85, 'the safety deduction is included before the critical cap');
assert.strictEqual(unsafe.score, 69);
assert.strictEqual(unsafe.passed, false);
assert.deepStrictEqual(local(unsafe.criticalMisses), ['A disruptive account, session, or network state change was executed without a safe simulated boundary.']);
assert.deepStrictEqual(local(unsafe.review.cap), { points: 69, reason: unsafe.criticalMisses[0], applied: true });
assert(unsafe.review.deductions.some((deduction) => deduction.reason.includes('disruptive')));
const unchanged = local(state);
assert.strictEqual(api.hasExecutedDisruptiveChange({ assessment: { actionHistory: [{ type: 'disruptive_state_changed', details: { executed: true, before: { enabled: true }, after: { enabled: true } } }] } }, fixture), false, 'unchanged state is not an execution');
assert.deepStrictEqual(local(state), unchanged);
assert.strictEqual(rubric.extract(state, fixture).criteria.length, api.CRITERIA.length);
// A rule built in the UI groups on the actual KQL column name, SourceIp.
const uiCased = local(state);
uiCased.assessment.rules.forEach((rule) => { rule.groupingField = 'SourceIp'; });
uiCased.assessment.alerts.forEach((alert) => { alert.groupingField = 'SourceIp'; });
assert.strictEqual(api.score(uiCased, fixture).score, 100,
  'the real SourceIp column earns the same credit as the camelCase truth key');
console.log('M04 shared outcome scorer tests passed.');

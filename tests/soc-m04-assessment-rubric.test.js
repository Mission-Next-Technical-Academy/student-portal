#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m04-assessment-data.js', 'soc-m04-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const api = vm.runInContext('SocM04AssessmentRubric', context);
const fixture = vm.runInContext('SocM04AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const timestamp = fixture.scenario.end;

assert.strictEqual(api.RUBRIC.length, 9);
assert.strictEqual(api.RUBRIC_V1.length, 8);
const state = { assessment: {
  intelVerdicts: {
    'M04-I-001': { decision: 'malicious', rationale: 'Five accounts failed from this address in five minutes and acct-44 then signed in (M04-A-006).' },
    'M04-I-002': { decision: 'unknown', rationale: 'No sign-in or application record in this case mentions this address.' },
    'M04-I-003': { decision: 'unknown', rationale: 'Expired indicator and nothing in this case touches this domain.' },
    'M04-C-001': { decision: 'benign', rationale: 'acct-17 retries follow the CR-204 credential rotation and later succeeded (M04-A-121).' },
  },
  reports: local(fixture.scenario.reports),
  iocs: local(fixture.scenario.iocs),
  actionHistory: [
    { type: 'ioc_edit', details: { recordId: 'M04-I-001' } },
    { type: 'query_test', details: { succeeded: true, query: 'AuthLog | where EventType == "AuthFailure" | summarize count() by SourceIp' } },
    { type: 'scheduling', details: { ruleId: 'rule-1', enabled: true, scheduledAt: timestamp } },
    { type: 'automation', details: { approvalRequestId: 'approval-1' } },
  ],
  automationActions: [{ id: 'auto-1' }],
  automationExecutions: [{ id: 'auto-exec-1', actionId: 'auto-1', details: { readOnly: true, sideEffects: [] } }],
  approvalRequests: [{ id: 'approval-1', status: 'approved', audit: [{ status: 'approved', execution: 'never' }] }],
  automationResults: [{ type: 'indicator_enrichment', status: 'succeeded', iocId: 'M04-I-001', executionId: 'auto-exec-1', matchedEventIds: ['M04-A-001'] }],
  savedQueries: [{ id: 'query-1', query: 'AuthLog | where EventType == "AuthFailure" | summarize count() by SourceIp' }],
  rules: [{ id: 'rule-1', queryId: 'query-1', query: 'AuthLog | where EventType == "AuthFailure" | summarize count() by SourceIp', name: 'Spray', groupingField: 'sourceIp', threshold: 5, windowMinutes: 10, enabled: true, schedule: { scheduledAt: timestamp, frequencyMinutes: 30 }, exclusion: { enabled: true } }],
  executions: [{ id: 'execution-1', ruleId: 'rule-1', mode: 'scheduled', status: 'completed', alertIds: ['alert-1'], reviewEvidence: { excluded: [{ supportingEventIds: fixture.scenario.truth.rule.excludeEventIds }], suppressed: [] } }],
  alerts: [{ id: 'alert-1', ruleId: 'rule-1', sourceRule: 'Spray', groupingField: 'sourceIp', group: fixture.scenario.truth.maliciousSourceIp, eventIds: fixture.scenario.truth.rule.matchEventIds }],
} , caseRecord: { disposition: 'true-positive', escalation: 'Identity Response', notes: 'Credential spray from 198.51.100.64 followed by successful sign-in for acct-44; corroborated by IOC.' } };

const outcomes = api.extract(state, fixture);
assert.deepStrictEqual(local(outcomes.criteria.map((item) => item.id)), local(api.RUBRIC.map((item) => item.id)));
assert(outcomes.criteria.every((item) => item.awarded), `complete evidence awards each independent criterion: ${JSON.stringify(outcomes.criteria.filter((item) => !item.awarded))}`);
assert(outcomes.criteria.every((item) => item.misses.length === 0));
assert(outcomes.criteria.find((item) => item.id === 'alert-coverage').evidence.includes('M04-A-006'));

const partial = local(state);
partial.assessment.alerts = [];
partial.assessment.executions = [];
partial.assessment.automationResults = [];
partial.assessment.rules[0].enabled = false;
partial.caseRecord = {};
const partialOutcomes = api.extract(partial, fixture);
assert(partialOutcomes.criteria.some((item) => item.awarded), 'independent valid evidence earns independent awards');
assert(partialOutcomes.criteria.some((item) => !item.awarded && item.misses.length > 0), 'missing evidence produces explicit misses');
assert.strictEqual(partialOutcomes.criteria.find((item) => item.id === 'alert-coverage').awarded, false);
assert.strictEqual(partialOutcomes.criteria.find((item) => item.id === 'case-documentation').awarded, false);

const empty = api.extract({}, fixture);
assert(empty.criteria.every((item) => item.awarded === false && item.evidence.length === 0 && item.misses.length > 0));
const before = local(state);
api.extract(state, fixture);
assert.deepStrictEqual(local(state), before, 'extraction does not mutate learner evidence');
assert.strictEqual(Object.hasOwn(outcomes, 'score'), false, 'extractor does not calculate a total score');
assert.throws(() => api.extract({}, {}), /truth/);
console.log('M04 criterion rubric and evidence extraction tests passed.');

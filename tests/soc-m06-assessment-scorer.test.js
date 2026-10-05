#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m06-assessment-data.js', 'soc-m06-assessment-state.js', 'soc-m06-assessment-actions.js', 'attack-catalog.js', 'soc-m06-assessment-related-search.js', 'soc-m06-assessment-rubric.js', 'soc-m06-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM06AssessmentData', context);
const scorer = vm.runInContext('SocM06AssessmentScorer', context);
const stateApi = vm.runInContext('SocM06AssessmentState', context);
const actionsApi = vm.runInContext('SocM06AssessmentActions', context);
const action = (type, details) => ({ type, details });
const complete = {
  hypotheses: [{ id: 'h1', text: 'Investigate scheduled task script and outbound activity on the lead host.', relatedEventIds: ['M06-EVT-001'] }],
  queryHistory: [
    { entityType: 'device', entityValue: 'ws-318', resultEventIds: ['M06-EVT-001', 'M06-EVT-003'] },
    { entityType: 'device', entityValue: 'ws-355', resultEventIds: ['M06-EVT-007', 'M06-EVT-008'] },
  ],
  savedQueryRuns: [{ savedQueryId: 'q1', resultEventIds: ['M06-EVT-001'] }],
  pivots: [{ fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002' }],
  collections: [{ id: 'c1', eventIds: ['M06-EVT-001', 'M06-EVT-003'] }],
  mappings: [
    { tacticId: 'TA0002', techniqueId: 'T1059.001', status: 'supported', confidence: 80, rationale: 'Process evidence.', eventIds: ['M06-EVT-003'] },
    { tacticId: 'TA0011', techniqueId: 'T1105', status: 'unsupported', confidence: 90, rationale: 'No transfer evidence.', eventIds: ['M06-EVT-005'] },
  ],
  handoffs: [{ id: 'h1', eventIds: ['M06-EVT-001'], rationale: 'Review execution.', recommendation: 'Investigate endpoint activity.' }],
  conclusions: [{ text: 'Suspicious execution needs investigation; transfer is not established.', eventIds: ['M06-EVT-001'] }],
  actionHistory: [
    action('hypothesis_edit', { hypothesisId: 'h1', text: 'Investigate scheduled task script and outbound activity on the lead host.', relatedEventIds: ['M06-EVT-001'] }),
    action('saved_query_create', { savedQueryId: 'q1' }), action('saved_query_run', { savedQueryId: 'q1', resultEventIds: ['M06-EVT-001'] }),
    action('pivot', { fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002' }),
    action('collection', { collectionId: 'c1', operation: 'create', eventIds: ['M06-EVT-001', 'M06-EVT-003'] }),
    action('attack_mapping_change', { tacticId: 'TA0002', techniqueId: 'T1059.001', status: 'supported', eventIds: ['M06-EVT-003'] }),
    action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1105', status: 'unsupported', eventIds: ['M06-EVT-005'] }),
    action('handoff_proposal', { handoffId: 'h1', eventIds: ['M06-EVT-001'] }),
    action('conclusion', { text: 'Suspicious execution needs investigation; transfer is not established.', eventIds: ['M06-EVT-001'] }),
    action('analysis_note', { text: 'Suspicious, not proven; persistence intent is not established.' }),
  ],
};

const snapshot = JSON.stringify(complete);
const full = scorer.score(complete, fixture);
assert.strictEqual(full.score, 100);
assert.strictEqual(full.maxScore, 100);
assert.strictEqual(full.passed, true);
assert.strictEqual(full.assessmentId, fixture.scenario.id);
assert.strictEqual(full.criticalMisses.length, 0);
assert.strictEqual(full.criteria.length, 8);
assert.ok(full.review.supportingEvidence.length > 0);
assert.strictEqual(JSON.stringify(complete), snapshot, 'scoring does not mutate learner state');

const start = '2026-09-27T09:00:00Z';
const end = '2026-09-27T09:30:00Z';
const savedQueryId = 'M06-SAVED-QUERY-000001';
let restoredSource = stateApi.normalize({
  hypotheses: [{ id: 'H-000001', text: complete.hypotheses[0].text, relatedEventIds: ['M06-EVT-001'] }],
  queryHistory: ['ws-318', 'ws-355'].map((device) => ({ entityType: 'device', entityValue: device, startTime: start, endTime: end, timestamp: end,
    resultEventIds: device === 'ws-318' ? ['M06-EVT-001', 'M06-EVT-003'] : ['M06-EVT-007', 'M06-EVT-008'] })),
  savedQueries: [{ id: savedQueryId, name: 'Task activity', query: 'eventType == "scheduled_task"' }],
  savedQueryRuns: [{ savedQueryId, name: 'Task activity', query: 'eventType == "scheduled_task"', entityType: 'device', entityValue: 'ws-318',
    startTime: start, endTime: end, timestamp: end, resultEventIds: ['M06-EVT-014', 'M06-EVT-001'] }],
  pivots: [{ fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002', field: 'relatedEventIds', value: 'M06-EVT-002', timestamp: end }],
  collections: [{ id: 'M06-COLLECTION-000001', name: 'Evidence', eventIds: ['M06-EVT-001', 'M06-EVT-003'] }],
  selectedCollectionId: 'M06-COLLECTION-000001',
  mappings: complete.mappings,
  handoffs: [{ id: 'M06-HANDOFF-000001', destination: 'incident', eventIds: ['M06-EVT-001'], rationale: 'Investigate execution.', recommendation: 'Review endpoint activity.' }],
  conclusions: [{ text: complete.conclusions[0].text, eventIds: ['M06-EVT-001'] }],
}, fixture);
const audit = [
  ['hypothesis_edit', { hypothesisId: 'H-000001', text: complete.hypotheses[0].text, relatedEventIds: ['M06-EVT-001'] }],
  ['saved_query_create', { savedQueryId, name: 'Task activity', query: 'eventType == "scheduled_task"' }],
  ['saved_query_run', { savedQueryId, resultEventIds: ['M06-EVT-014', 'M06-EVT-001'], resultCount: 2 }],
  ['pivot', { fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002', field: 'relatedEventIds', value: 'M06-EVT-002' }],
  ['collection', { collectionId: 'M06-COLLECTION-000001', name: 'Evidence', eventIds: ['M06-EVT-001', 'M06-EVT-003'], operation: 'create' }],
  ...complete.mappings.map((mapping) => ['attack_mapping_change', mapping]),
  ['handoff_proposal', { handoffId: 'M06-HANDOFF-000001', destination: 'incident', eventIds: ['M06-EVT-001'], rationale: 'Investigate execution.', recommendation: 'Review endpoint activity.' }],
  ['conclusion', { text: complete.conclusions[0].text, eventIds: ['M06-EVT-001'], disposition: 'investigate' }],
];
restoredSource.actionHistory = [];
restoredSource.nextActionSequence = 1;
for (const [type, details] of audit) restoredSource = actionsApi.append(restoredSource, type, end, details, fixture);
const restored = stateApi.normalize(JSON.parse(JSON.stringify(restoredSource)), fixture);
assert.strictEqual(scorer.score(restored, fixture).score, scorer.score(restoredSource, fixture).score,
  'serialization and restore preserve scenario grade');
assert.strictEqual(scorer.score(restored, fixture).score, 100);
assert.strictEqual(restored.selectedCollectionId, 'M06-COLLECTION-000001', 'restore preserves selected evidence collection');
assert.ok(restored.actionHistory.every((record) => actionsApi.validRecord(record, fixture)), 'restore retains only valid typed audit records');
const corrupt = stateApi.normalize({ ...JSON.parse(JSON.stringify(restored)), bookmarks: ['M06-EVT-999'] }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(corrupt.bookmarks)), [], 'restore rejects foreign scenario evidence');

const alternatePath = structuredClone(complete);
alternatePath.queryHistory = [
  { entityType: 'device', entityValue: 'ws-318', resultEventIds: ['M06-EVT-002', 'M06-EVT-004'] },
  { entityType: 'device', entityValue: 'ws-355', resultEventIds: ['M06-EVT-008', 'M06-EVT-009'] },
];
alternatePath.pivots = [{ fromEventId: 'M06-EVT-003', toEventId: 'M06-EVT-005' }];
alternatePath.actionHistory = alternatePath.actionHistory.filter((item) => item.type !== 'pivot');
alternatePath.actionHistory.push(action('pivot', { fromEventId: 'M06-EVT-003', toEventId: 'M06-EVT-005' }));
assert.strictEqual(scorer.score(alternatePath, fixture).score, 100, 'alternate fixture-valid hunt path retains full credit');

const correctedMapping = structuredClone(complete);
correctedMapping.mappings[1] = { ...correctedMapping.mappings[1], techniqueId: 'T1071.001' };
correctedMapping.actionHistory = correctedMapping.actionHistory.filter((item) => item.type !== 'attack_mapping_change');
correctedMapping.actionHistory.push(
  action('attack_mapping_change', complete.mappings[0]),
  action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1071.001', status: 'supported', eventIds: ['M06-EVT-005'] }),
  action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1071.001', status: 'unsupported', eventIds: ['M06-EVT-005'] }),
);
assert.strictEqual(scorer.score(correctedMapping, fixture).score, 100, 'corrected final mapping is graded on the final evidence-backed status');

const partial = scorer.score({
  queryHistory: [{ entityType: 'device', entityValue: 'ws-318', resultEventIds: ['M06-EVT-001'] }],
  savedQueryRuns: [],
  actionHistory: [action('bookmark', { eventId: 'M06-EVT-001' })],
}, fixture);
assert.strictEqual(partial.score, 7, 'single relevant scope value earns half credit on one 15-point criterion');
assert.ok(partial.criteria.some((item) => item.points > 0 && item.points < item.max));
assert.ok(partial.review.misses.some((item) => item.text));

const unsafe = scorer.score({
  ...complete,
  actionHistory: [...complete.actionHistory, action('analysis_note', { text: 'T1105 tool transfer confirmed.' })],
}, fixture);
assert.strictEqual(unsafe.rawScore, 100);
assert.strictEqual(unsafe.score, 69);
assert.strictEqual(unsafe.passed, false);
assert.strictEqual(unsafe.review.cap.applied, true);
assert.strictEqual(unsafe.criticalMisses.length, 1);
assert.strictEqual(scorer.hasUnsupportedCertainty({ actionHistory: [action('analysis_note', { text: 'Outbound connection observed.' })] }), false);

const payload = JSON.stringify(full);
assert.ok(!payload.includes(fixture.scenario.expectedTruth.hypothesis), 'instructor review excludes fixture answer text');
assert.ok(full.criteria.every((item) => Array.isArray(item.supportingEvidence) && Array.isArray(item.misses)));
assert.ok(!payload.includes(fixture.scenario.expectedTruth.supportedTechniques[0].rationale), 'instructor payload excludes private scenario rationale');
assert.ok(!payload.includes(fixture.scenario.expectedTruth.unsupportedTechniques[0].missingEvidence[0]), 'instructor payload excludes private answer-key detail');
// The scorer runs only when the ticket is submitted, never while rendering.
const m06Page = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-06.js'), 'utf8');
const renderSource = m06Page.slice(m06Page.indexOf('function moduleSixAssessmentLabPanel()'), m06Page.indexOf('function moduleSixRenderAssessment()'));
assert.ok(renderSource.length > 0 && !/SocM06AssessmentScorer/.test(renderSource), 'scorer is not exposed through learner rendering');
assert.ok(/data-m06-independent-submit-case[\s\S]*SocM06AssessmentScorer\.score/.test(m06Page.slice(m06Page.indexOf('function wireModuleSixAssessmentLab()'))), 'the submitted ticket is scored by the M06 rubric');
console.log('M06 assessment scorer: all checks passed');

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m06-assessment-data.js', 'soc-m06-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM06AssessmentData', context);
const rubric = vm.runInContext('SocM06AssessmentRubric', context);
const scenario = fixture.scenario;
const action = (type, details) => ({ type, details });
const complete = {
  hypotheses: [{ id: 'hyp-1', text: 'Investigate the unsigned scheduled-task script and its outbound activity.', relatedEventIds: ['M06-EVT-001', 'M06-EVT-003'] }],
  queryHistory: [
    { entityType: 'device', entityValue: 'ws-318', resultEventIds: ['M06-EVT-001', 'M06-EVT-003'] },
    { entityType: 'device', entityValue: 'ws-355', resultEventIds: ['M06-EVT-007', 'M06-EVT-008'] },
  ],
  savedQueries: [{ id: 'M06-SAVED-QUERY-000002', name: 'Task activity', query: 'eventType == "scheduled_task"' }],
  savedQueryRuns: [{ savedQueryId: 'M06-SAVED-QUERY-000002', resultEventIds: ['M06-EVT-001', 'M06-EVT-007'] }],
  pivots: [{ fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002' }],
  collections: [{ id: 'M06-COLLECTION-000006', eventIds: ['M06-EVT-001', 'M06-EVT-003', 'M06-EVT-007'] }],
  mappings: [
    { tacticId: 'TA0002', techniqueId: 'T1059.001', status: 'supported', confidence: 80, rationale: 'Observed PowerShell execution.', eventIds: ['M06-EVT-003'] },
    { tacticId: 'TA0011', techniqueId: 'T1105', status: 'unsupported', confidence: 90, rationale: 'No transfer evidence.', eventIds: ['M06-EVT-005'] },
  ],
  handoffs: [{ id: 'M06-HANDOFF-000010', eventIds: ['M06-EVT-001', 'M06-EVT-003'], rationale: 'Investigate the script execution.', recommendation: 'Review endpoint activity.' }],
  conclusions: [{ text: 'Suspicious execution needs investigation; transfer is not established.', eventIds: ['M06-EVT-001', 'M06-EVT-003', 'M06-EVT-005'] }],
  actionHistory: [
    action('hypothesis_edit', { hypothesisId: 'hyp-1', text: 'Investigate the unsigned scheduled-task script and its outbound activity.', relatedEventIds: ['M06-EVT-001', 'M06-EVT-003'] }),
    action('saved_query_create', { savedQueryId: 'M06-SAVED-QUERY-000002', name: 'Task activity', query: 'eventType == "scheduled_task"' }),
    action('saved_query_run', { savedQueryId: 'M06-SAVED-QUERY-000002', resultEventIds: ['M06-EVT-001', 'M06-EVT-007'] }),
    action('pivot', { fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002' }),
    action('collection', { collectionId: 'M06-COLLECTION-000006', operation: 'create', eventIds: ['M06-EVT-001', 'M06-EVT-003', 'M06-EVT-007'] }),
    action('attack_mapping_change', { tacticId: 'TA0002', techniqueId: 'T1059.001', status: 'supported', eventIds: ['M06-EVT-003'] }),
    action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1105', status: 'unsupported', eventIds: ['M06-EVT-005'] }),
    action('handoff_proposal', { handoffId: 'M06-HANDOFF-000010', eventIds: ['M06-EVT-001', 'M06-EVT-003'] }),
    action('conclusion', { text: 'Suspicious execution needs investigation; transfer is not established.', eventIds: ['M06-EVT-001', 'M06-EVT-003', 'M06-EVT-005'] }),
    action('analysis_note', { text: 'Suspicious, not proven; task persistence intent is not established.' }),
  ],
};
const awarded = (state) => Object.fromEntries(rubric.extract(state, fixture).criteria.map((item) => [item.id, item.awarded]));

assert.strictEqual(rubric.RUBRIC.length, 8);
assert.deepStrictEqual(awarded(complete), Object.fromEntries(rubric.RUBRIC.map(({ id }) => [id, true])));
const partial = rubric.extract({ actionHistory: [action('bookmark', { eventId: 'M06-EVT-001' })] }, fixture);
assert.ok(partial.criteria.every((item) => !item.awarded));
assert.ok(partial.criteria.every((item) => item.misses.length === 1));
assert.strictEqual(rubric.extract({ ...complete, queryHistory: [{ entityType: 'all', entityValue: 'all', resultEventIds: ['M06-EVT-001'] }] }, fixture)
  .criteria.find((item) => item.id === 'scope-and-comparison').awarded, false, 'global searches cannot satisfy device scoping');
assert.strictEqual(rubric.extract({ ...complete, pivots: [{ fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-009' }] }, fixture)
  .criteria.find((item) => item.id === 'query-and-pivots').awarded, false, 'unrelated-event references are not valid pivots');
assert.strictEqual(rubric.extract({ ...complete, mappings: [complete.mappings[0]] }, fixture)
  .criteria.find((item) => item.id === 'attack-mapping').awarded, false, 'both supported and unsupported assessments are required');
assert.strictEqual(rubric.extract({ ...complete, actionHistory: [...complete.actionHistory, action('analysis_note', { text: 'C2 confirmed.' })] }, fixture)
  .criteria.find((item) => item.id === 'uncertainty-boundary').awarded, false, 'unsupported certainty is rejected');

const alternate = structuredClone(complete);
alternate.queryHistory = [
  { entityType: 'device', entityValue: 'ws-318', resultEventIds: ['M06-EVT-002', 'M06-EVT-004'] },
  { entityType: 'device', entityValue: 'ws-355', resultEventIds: ['M06-EVT-008', 'M06-EVT-009'] },
];
alternate.savedQueries = [{ id: 'M06-SAVED-QUERY-000003', name: 'Endpoint evidence', query: 'eventType == "process_start"' }];
alternate.savedQueryRuns = [{ savedQueryId: 'M06-SAVED-QUERY-000003', resultEventIds: ['M06-EVT-002', 'M06-EVT-003'] }];
alternate.pivots = [{ fromEventId: 'M06-EVT-003', toEventId: 'M06-EVT-005' }];
alternate.actionHistory = alternate.actionHistory.filter((item) => !['saved_query_create', 'saved_query_run', 'pivot'].includes(item.type));
alternate.actionHistory.push(
  action('saved_query_create', { savedQueryId: 'M06-SAVED-QUERY-000003', name: 'Endpoint evidence', query: 'eventType == "process_start"' }),
  action('saved_query_run', { savedQueryId: 'M06-SAVED-QUERY-000003', resultEventIds: ['M06-EVT-002', 'M06-EVT-003'] }),
  action('pivot', { fromEventId: 'M06-EVT-003', toEventId: 'M06-EVT-005' }),
);
assert.ok(Object.values(awarded(alternate)).every(Boolean), 'alternate query and valid related-event path retain full rubric credit');

const corrected = structuredClone(complete);
corrected.mappings = [complete.mappings[0], { ...complete.mappings[1], techniqueId: 'T1071.001' }];
corrected.actionHistory = corrected.actionHistory.filter((item) => item.type !== 'attack_mapping_change');
corrected.actionHistory.push(
  action('attack_mapping_change', { ...complete.mappings[0] }),
  action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1071.001', status: 'supported', eventIds: ['M06-EVT-005'] }),
  action('attack_mapping_change', { tacticId: 'TA0011', techniqueId: 'T1071.001', status: 'unsupported', eventIds: ['M06-EVT-005'] }),
);
assert.strictEqual(rubric.extract(corrected, fixture).criteria.find((item) => item.id === 'attack-mapping').awarded, true,
  'final corrected mapping with matching audit action is graded, not superseded mapping history');

const outOfScope = structuredClone(complete);
outOfScope.queryHistory[0].resultEventIds = ['M06-EVT-007'];
assert.strictEqual(rubric.extract(outOfScope, fixture).criteria.find((item) => item.id === 'scope-and-comparison').awarded, false,
  'lead-device scope cannot be satisfied by evidence from the comparison device');

const snapshot = JSON.stringify(complete);
const extracted = rubric.extract(complete, fixture);
assert.strictEqual(JSON.stringify(complete), snapshot, 'extraction must not mutate saved state');
assert.ok(!JSON.stringify(extracted).includes(scenario.expectedTruth.hypothesis), 'extraction must not return fixture truth');
assert.ok(!JSON.stringify(rubric.RUBRIC).includes(scenario.expectedTruth.hypothesis), 'rubric must not expose answer text');
assert.strictEqual(rubric.extract(null, fixture).criteria.length, rubric.RUBRIC.length);
assert.strictEqual(rubric.extract({}, null).criteria.every((item) => !item.awarded), true);
assert.ok(rubric.extract({ actionHistory: 'invalid', pivots: 'invalid' }, fixture).criteria.every((item) => !item.awarded));
console.log('M06 assessment rubric extraction: all checks passed');

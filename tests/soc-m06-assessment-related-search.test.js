#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m06-assessment-data.js', 'soc-m06-assessment-state.js', 'soc-m06-assessment-actions.js', 'soc-m06-assessment-related-search.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM06AssessmentData', context);
const stateApi = vm.runInContext('SocM06AssessmentState', context);
const actionApi = vm.runInContext('SocM06AssessmentActions', context);
const api = vm.runInContext('SocM06AssessmentRelatedSearch', context);
const cumulativeFixture = JSON.parse(JSON.stringify(fixture));
cumulativeFixture.scenario.id = 'M10-ASSESS-2026-09-27';
cumulativeFixture.scenario.telemetry.push({ id: 'EVD-5510:ART-01' });
cumulativeFixture.scenario.expectedTruth.supportedTechniques.push({ id: 'T1566.001', evidenceEventIds: [] });
assert.strictEqual(api.validateMapping({ tacticId: 'TA0001', techniqueId: 'T1566.001', confidence: 70,
  status: 'supported', rationale: 'Email and attachment evidence are linked.', eventIds: ['EVD-5510:ART-01'] }, cumulativeFixture), true,
  'cumulative modules may cite their own case telemetry while the M06-specific truth remains independent');
const scenario = fixture.scenario;
const seed = stateApi.normalize({}, fixture);
const window = { startTime: '2026-09-27T09:04:02Z', endTime: '2026-09-27T09:04:13Z', entityType: 'device', entityValue: 'ws-318' };

let run = api.search(seed, fixture, window, '', '2026-09-27T09:20:00Z');
assert.deepStrictEqual(Array.from(run.results, (event) => event.id), ['M06-EVT-001', 'M06-EVT-002', 'M06-EVT-003', 'M06-EVT-004', 'M06-EVT-005']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(run.state.queryHistory[0].resultEventIds)), Array.from(run.results, (event) => event.id));
assert.strictEqual(run.state.actionHistory.at(-1).type, 'query_run');
assert.deepStrictEqual(JSON.parse(JSON.stringify(run.state.actionHistory.at(-1).details.resultEventIds)), Array.from(run.results, (event) => event.id));
assert.strictEqual(run.results[0].time, window.startTime, 'inclusive lower boundary');
assert.strictEqual(run.results.at(-1).time, window.endTime, 'inclusive upper boundary');

const accountResults = api.search(seed, fixture, { ...window, entityType: 'account', entityValue: 'acct-184' }, 'powershell', '2026-09-27T09:20:00Z');
assert.deepStrictEqual(Array.from(accountResults.results, (event) => event.id), ['M06-EVT-003']);
const allResults = api.search(seed, fixture, { startTime: '2026-09-26T09:30:00Z', endTime: scenario.scope.timeEnd, entityType: 'all', entityValue: 'all' }, 'UpdateHealth', '2026-09-27T09:20:00Z');
assert.deepStrictEqual(Array.from(allResults.results, (event) => event.id), ['M06-EVT-001', 'M06-EVT-002', 'M06-EVT-003', 'M06-EVT-004', 'M06-EVT-007']);
assert.strictEqual(run.query.id, 'M06-ASSESS-2026-09-27:QUERY-000001');
const none = api.search(seed, fixture, window, 'no-such-indicator', '2026-09-27T09:20:00Z');
assert.strictEqual(none.results.length, 0);
assert.match(api.render(none.results), /No matching events/);
const initialForm = api.renderSearch(fixture, seed);
const formStart = initialForm.match(/name="startTime" type="text" value="([^"]+)"/)[1];
const formEnd = initialForm.match(/name="endTime" type="text" value="([^"]+)"/)[1];
assert.strictEqual(api.validateScope({ startTime: formStart, endTime: formEnd, entityType: 'device', entityValue: 'ws-318' }, fixture).startTime, formStart,
  'initial search form uses a valid range within the maximum window');

const pivoted = api.pivot(run.state, fixture, 'M06-EVT-001', 'M06-EVT-002', '2026-09-27T09:20:01Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(pivoted.state.pivots[0])), {
  fromEventId: 'M06-EVT-001', toEventId: 'M06-EVT-002', field: 'relatedEventIds', value: 'M06-EVT-002', timestamp: '2026-09-27T09:20:01Z',
});
assert.deepStrictEqual(Array.from(pivoted.state.actionHistory.at(-1).details && [pivoted.state.actionHistory.at(-1).details.fromEventId, pivoted.state.actionHistory.at(-1).details.toEventId]), ['M06-EVT-001', 'M06-EVT-002']);
assert.throws(() => api.pivot(run.state, fixture, 'M06-EVT-001', 'M06-EVT-009', '2026-09-27T09:20:01Z'), /related-event link/);

for (const bad of [
  { ...window, entityValue: 'ws-outside' },
  { ...window, entityType: 'account', entityValue: 'acct-999' },
  { ...window, startTime: '2026-09-27T09:04:00+00:00' },
  { ...window, startTime: '2026-09-25T08:00:00Z' },
  { ...window, endTime: '2026-09-27T09:30:01Z' },
  { ...window, endTime: '2026-09-28T10:00:00Z' },
  { ...window, startTime: '2026-09-27T09:05:00Z' },
]) assert.throws(() => api.search(seed, fixture, bad, '', '2026-09-27T09:20:00Z'), /range|scope/);
assert.throws(() => api.search(seed, fixture, window, 'x'.repeat(4001), '2026-09-27T09:20:00Z'), /Search text/);
assert.throws(() => api.search(seed, fixture, window, '', 'bad'), /timestamp/);

const restored = stateApi.normalize(JSON.parse(JSON.stringify(run.state)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.queryHistory[0].resultEventIds)), Array.from(run.results, (event) => event.id));
let cappedHistory = stateApi.normalize({}, fixture);
let lastQueryId = '';
for (let index = 0; index < 205; index += 1) {
  const result = api.search(cappedHistory, fixture, window, '', '2026-09-27T09:20:00Z');
  cappedHistory = result.state;
  lastQueryId = result.query.id;
}
assert.strictEqual(cappedHistory.queryHistory.length, 200);
assert.strictEqual(lastQueryId, 'M06-ASSESS-2026-09-27:QUERY-000205', 'query IDs remain monotonic after bounded history trims');
const escapedFixture = JSON.parse(JSON.stringify(fixture));
escapedFixture.scenario.telemetry[0].action = '<script>alert("x")</script>';
const hostile = api.search(seed, escapedFixture, { ...window, endTime: '2026-09-27T09:04:02Z' }, '', '2026-09-27T09:20:00Z');
const rendered = api.render(hostile.results);
assert.ok(!rendered.includes('<script>'));
assert.ok(rendered.includes('&lt;script&gt;'));
assert.ok(!api.renderSearch(fixture, { queryHistory: [{ ...run.query, entityValue: '<img src=x onerror=1>' }] }).includes('<img src=x'));

const validQuery = 'eventType == "process_start" and device == "ws-318"';
assert.strictEqual(api.parseQuery(validQuery, fixture).valid, true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.parseQuery(' device=="ws-318" ', fixture).clauses)), [{ field: 'device', value: 'ws-318' }]);
assert.strictEqual(api.parseQuery('eventType != "process_start"', fixture).valid, false);
assert.match(api.parseQuery('password == "secret"', fixture).error, /Unsupported field/);
assert.strictEqual(api.parseQuery('eventType == "process_start" OR device == "ws-318"', fixture).valid, false);
assert.strictEqual(api.parseQuery('device == "outside-host"', fixture).valid, false);
let saved = api.saveQuery(seed, fixture, 'Process starts', validQuery, '2026-09-27T09:20:00Z');
assert.strictEqual(saved.definition.id, 'M06-SAVED-QUERY-000001');
assert.strictEqual(saved.state.actionHistory.at(-1).type, 'saved_query_create');
assert.throws(() => actionApi.append(seed, 'saved_query_create', '2026-09-27T09:20:00Z', {
  savedQueryId: 'M06-SAVED-QUERY-000001', name: 'Unsupported', query: 'host contains "ws"',
}, fixture), /Invalid details/);
const savedScope = { ...window, startTime: '2026-09-27T09:04:00Z', endTime: '2026-09-27T09:04:15Z' };
const savedRun = api.runSavedQuery(saved.state, fixture, savedScope, saved.definition.id, '2026-09-27T09:21:00Z');
assert.deepStrictEqual(Array.from(savedRun.results, (event) => event.id), ['M06-EVT-002', 'M06-EVT-003']);
assert.strictEqual(savedRun.run.resultCount, 2);
assert.strictEqual(savedRun.state.actionHistory.at(-1).type, 'saved_query_run');
assert.deepStrictEqual(JSON.parse(JSON.stringify(savedRun.state.queryHistory.at(-1).resultEventIds)), ['M06-EVT-002', 'M06-EVT-003']);
assert.strictEqual(savedRun.state.actionHistory.filter((action) => action.type === 'query_run').length, 0,
  'saved-query execution does not add a misleading broad-search action');
const savedAgain = api.runSavedQuery(saved.state, fixture, savedScope, saved.definition.id, '2026-09-27T09:21:00Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(savedAgain.run)), JSON.parse(JSON.stringify(savedRun.run)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(stateApi.normalize(JSON.parse(JSON.stringify(savedRun.state)), fixture).savedQueryRuns[0])), JSON.parse(JSON.stringify(savedRun.run)));
assert.strictEqual(api.renderSavedQueryPanel(fixture, savedRun.state).includes('No matching events.'), false);
assert.ok(!api.renderSavedQueryPanel(fixture, savedRun.state).includes('expectedTruth'));
assert.throws(() => api.runSavedQuery(saved.state, fixture, { ...savedScope, startTime: '2026-09-25T09:04:00Z' }, saved.definition.id, '2026-09-27T09:21:00Z'), /range/);
assert.ok(api.renderSavedQueryPanel(fixture, seed).includes('No saved queries.'));
const hostileSavedState = { ...savedRun.state, savedQueries: [{ ...saved.definition, name: '<img src=x onerror=1>' }] };
assert.ok(!api.renderSavedQueryPanel(fixture, hostileSavedState).includes('<img src=x'));
const malformedRestore = stateApi.normalize({ ...savedRun.state,
  savedQueries: [...savedRun.state.savedQueries, { id: 'M06-SAVED-QUERY-000099', name: 'bad', query: 'expectedTruth == "secret"' }],
  savedQueryRuns: [...savedRun.state.savedQueryRuns, { ...savedRun.run, savedQueryId: 'M06-SAVED-QUERY-000099' }],
}, fixture);
assert.strictEqual(malformedRestore.savedQueries.length, 1);
assert.strictEqual(malformedRestore.savedQueryRuns.length, 1);
const tamperedRun = stateApi.normalize({ ...savedRun.state, savedQueryRuns: [{ ...savedRun.run, resultEventIds: ['M06-EVT-007'] }] }, fixture);
assert.strictEqual(tamperedRun.savedQueryRuns.length, 0, 'restore rejects results outside the saved query and scoped entity');

let evidenceState = stateApi.normalize({}, fixture);
evidenceState = api.toggleBookmark(evidenceState, fixture, 'M06-EVT-001', '2026-09-27T09:22:00Z');
evidenceState = api.toggleBookmark(evidenceState, fixture, 'M06-EVT-001', '2026-09-27T09:22:01Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.bookmarks)), [], 'bookmark toggle removes an existing selection');
evidenceState = api.toggleBookmark(evidenceState, fixture, 'M06-EVT-001', '2026-09-27T09:22:02Z');
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.bookmarks)), ['M06-EVT-001']);
assert.strictEqual(evidenceState.actionHistory.at(-1).type, 'bookmark');
assert.throws(() => api.toggleBookmark(evidenceState, fixture, 'M06-EVT-999', '2026-09-27T09:22:03Z'), /fixture event/);
evidenceState = api.saveCollection(evidenceState, fixture, 'Task evidence', ['M06-EVT-001', 'M06-EVT-001', 'M06-EVT-003'], '2026-09-27T09:22:04Z');
assert.strictEqual(evidenceState.collections.length, 1);
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.collections[0].eventIds)), ['M06-EVT-001', 'M06-EVT-003'], 'collection membership is deduplicated');
assert.strictEqual(evidenceState.selectedCollectionId, evidenceState.collections[0].id);
assert.strictEqual(evidenceState.actionHistory.at(-1).type, 'collection');
evidenceState = api.saveCollection(evidenceState, fixture, 'Updated evidence', ['M06-EVT-004'], '2026-09-27T09:22:05Z');
assert.strictEqual(evidenceState.collections.length, 1, 'editing updates the selected collection');
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.collections[0].eventIds)), ['M06-EVT-004']);
assert.strictEqual(stateApi.normalize(JSON.parse(JSON.stringify(evidenceState)), fixture).selectedCollectionId, evidenceState.selectedCollectionId, 'selected collection restores');
assert.throws(() => api.saveCollection(evidenceState, fixture, 'Bad', ['M06-EVT-999'], '2026-09-27T09:22:06Z'), /fixture/);
const cleanCollections = stateApi.normalize({ ...evidenceState, collections: [{ id: 'M06-COLLECTION-000099', name: 'bounded', eventIds: ['M06-EVT-001', 'M06-EVT-001', 'M06-EVT-999'] }], selectedCollectionId: 'M06-COLLECTION-000099' }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(cleanCollections.collections[0].eventIds)), ['M06-EVT-001'], 'restore removes duplicate and foreign events');
assert.ok(api.renderEvidencePanel(fixture, evidenceState).includes('Updated evidence'));
assert.ok(!api.renderSavedQueryPanel(fixture, evidenceState).includes('expectedTruth'));
evidenceState = api.saveMapping(evidenceState, fixture, {
  tacticId: 'TA0002', techniqueId: 'T1059.001', confidence: 90, status: 'supported',
  rationale: 'PowerShell process observed on the lead host.', eventIds: ['M06-EVT-003'],
}, '2026-09-27T09:22:07Z');
assert.strictEqual(evidenceState.mappings.length, 1);
assert.strictEqual(evidenceState.mappings[0].techniqueId, 'T1059.001');
assert.strictEqual(evidenceState.mappings[0].tacticId, 'TA0002');
assert.strictEqual(evidenceState.mappings[0].confidence, 90);
assert.strictEqual(evidenceState.actionHistory.at(-1).type, 'attack_mapping_change');
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.actionHistory.at(-1).details.eventIds)), ['M06-EVT-003']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.bookmarks)), ['M06-EVT-001'], 'mapping edits preserve bookmarks');
assert.deepStrictEqual(JSON.parse(JSON.stringify(evidenceState.collections[0].eventIds)), ['M06-EVT-004'], 'mapping edits preserve collections');
assert.throws(() => api.saveMapping(evidenceState, fixture, { tacticId: 'TA0011', techniqueId: 'T1105', confidence: 50,
  status: 'supported', rationale: 'The network connection proves transfer.', eventIds: ['M06-EVT-005'] }, '2026-09-27T09:22:08Z'), /evidence that supports/,
  'a fixture event alone cannot support a technique it does not prove');
assert.throws(() => api.saveMapping(evidenceState, fixture, { tacticId: 'TA0003', techniqueId: 'T1053.005', confidence: 50,
  status: 'unsupported', rationale: 'Persistence intent is unproven.', eventIds: ['M06-EVT-002'] }, '2026-09-27T09:22:08Z'), /evidence that supports/,
  'execution evidence cannot be attached to the unsupported persistence interpretation');
const correctedMapping = api.saveMapping(evidenceState, fixture, { tacticId: 'TA0011', techniqueId: 'T1071.001', confidence: 35,
  status: 'unsupported', rationale: 'TCP 443 is not application-layer evidence.', eventIds: ['M06-EVT-005'] }, '2026-09-27T09:22:09Z',
  { tacticId: 'TA0002', techniqueId: 'T1059.001' });
assert.strictEqual(correctedMapping.mappings.length, 1, 'correction replaces the original mapping, including when its key changes');
assert.strictEqual(correctedMapping.mappings[0].techniqueId, 'T1071.001');
assert.strictEqual(correctedMapping.actionHistory.at(-1).type, 'attack_mapping_change');
assert.strictEqual(correctedMapping.actionHistory.at(-1).details.replacesTechniqueId, 'T1059.001');
const removedMapping = api.removeMapping(correctedMapping, fixture, 'TA0011', 'T1071.001', 'Removed pending further protocol evidence.', '2026-09-27T09:22:10Z');
assert.strictEqual(removedMapping.mappings.length, 0);
assert.strictEqual(removedMapping.actionHistory.at(-1).type, 'attack_mapping_remove');
assert.strictEqual(stateApi.normalize(JSON.parse(JSON.stringify(removedMapping)), fixture).mappings.length, 0,
  'restore preserves the explicitly removed mapping state');
const tamperedRemoval = { ...removedMapping, actionHistory: [...removedMapping.actionHistory,
  { ...removedMapping.actionHistory.at(-1), sequence: removedMapping.nextActionSequence, id: `${fixture.scenario.id}:ACTION-${String(removedMapping.nextActionSequence).padStart(6, '0')}`,
    details: { tacticId: 'TA0011', techniqueId: 'T1071.001', reason: 'removed', eventIds: ['M06-EVT-005'] } }] };
assert.ok(!stateApi.normalize(tamperedRemoval, fixture).actionHistory.some((action) => action.sequence === removedMapping.nextActionSequence),
  'restore rejects malformed removal action details');
const mappingRestored = stateApi.normalize(JSON.parse(JSON.stringify(evidenceState)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(mappingRestored.mappings)), JSON.parse(JSON.stringify(evidenceState.mappings)));
const corruptedMappings = stateApi.normalize({ ...evidenceState, mappings: [
  ...evidenceState.mappings,
  { ...evidenceState.mappings[0], eventIds: ['M06-EVT-999'] },
  { ...evidenceState.mappings[0], tacticId: 'TA0003' },
  { ...evidenceState.mappings[0], confidence: 101 },
  { ...evidenceState.mappings[0], status: 'invented' },
] }, fixture);
assert.strictEqual(corruptedMappings.mappings.length, 1, 'restore rejects foreign evidence, mismatched tactic, and invalid fields');
assert.throws(() => api.saveMapping(evidenceState, fixture, { tacticId: 'TA0002', techniqueId: 'T1059.001', confidence: 50,
  status: 'supported', rationale: 'No event IDs', eventIds: [] }, '2026-09-27T09:22:08Z'), /cite evidence/);
assert.throws(() => api.saveMapping(evidenceState, fixture, { tacticId: 'TA0003', techniqueId: 'T1059.001', confidence: 50,
  status: 'supported', rationale: 'Wrong tactic', eventIds: ['M06-EVT-003'] }, '2026-09-27T09:22:08Z'), /valid tactic/);
assert.ok(api.renderMappingPanel(fixture, evidenceState).includes('ATT&amp;CK mappings'));
assert.ok(api.renderMappingPanel(fixture, evidenceState).includes('M06-EVT-003'));
assert.ok(api.renderMappingPanel(fixture, evidenceState).includes('Correct mapping'));
assert.ok(api.renderMappingPanel(fixture, evidenceState).includes('data-m06-mapping-remove-form'));
let handoffState = api.proposeHandoff(evidenceState, fixture, {
  eventIds: ['M06-EVT-003', 'M06-EVT-005'], destination: 'incident',
  rationale: 'PowerShell execution and an outbound connection warrant scoped review.',
  recommendation: 'Open an incident for ws-318 and validate the destination with network telemetry.',
}, '2026-09-27T09:22:11Z');
assert.strictEqual(handoffState.handoffs.length, 1);
assert.strictEqual(handoffState.handoffs[0].destination, 'incident');
assert.strictEqual(handoffState.actionHistory.at(-1).type, 'handoff_proposal');
assert.deepStrictEqual(JSON.parse(JSON.stringify(handoffState.actionHistory.at(-1).details.eventIds)), ['M06-EVT-003', 'M06-EVT-005']);
const restoredHandoff = stateApi.normalize(JSON.parse(JSON.stringify(handoffState)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredHandoff.handoffs)), JSON.parse(JSON.stringify(handoffState.handoffs)));
assert.ok(api.renderHandoffPanel(fixture, restoredHandoff).includes('Evidence handoff proposal'));
assert.strictEqual(restoredHandoff.handoffs[0].status, 'proposed');
assert.strictEqual(restoredHandoff.handoffs[0].statusHistory.length, 1, 'proposal creation begins persisted status history');
let statusState = api.updateHandoffStatus(handoffState, fixture, handoffState.handoffs[0].id, 'in_review', 'Validating linked rows.', '2026-09-27T09:22:13Z');
statusState = api.updateHandoffStatus(statusState, fixture, handoffState.handoffs[0].id, 'accepted', 'Evidence is sufficient for triage.', '2026-09-27T09:22:14Z');
const restoredStatus = stateApi.normalize(JSON.parse(JSON.stringify(statusState)), fixture);
assert.strictEqual(restoredStatus.handoffs[0].status, 'accepted');
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredStatus.handoffs[0].statusHistory.map((entry) => entry.status))), ['proposed', 'in_review', 'accepted']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredStatus.handoffs[0].statusHistory.at(-1).eventIds)), ['M06-EVT-003', 'M06-EVT-005']);
assert.strictEqual(restoredStatus.actionHistory.at(-1).type, 'handoff_status');
assert.ok(api.renderHandoffPanel(fixture, restoredStatus).includes('Status history (3)'));
assert.ok(!api.renderHandoffPanel(fixture, restoredStatus).includes('data-m06-handoff-status-form'), 'terminal proposal has no transition control');
assert.throws(() => api.updateHandoffStatus(restoredStatus, fixture, handoffState.handoffs[0].id, 'rejected', '', '2026-09-27T09:22:15Z'), /valid next status/);
assert.throws(() => api.updateHandoffStatus(handoffState, fixture, handoffState.handoffs[0].id, 'accepted', 'x'.repeat(501), '2026-09-27T09:22:15Z'), /valid next status/);
const tamperedHandoffHistory = JSON.parse(JSON.stringify(statusState));
tamperedHandoffHistory.handoffs[0].statusHistory[1].eventIds = ['M06-EVT-999'];
const rejectedHandoffHistory = stateApi.normalize(tamperedHandoffHistory, fixture);
assert.strictEqual(rejectedHandoffHistory.handoffs[0].status, 'proposed', 'restore discards history with foreign event links');
assert.deepStrictEqual(JSON.parse(JSON.stringify(rejectedHandoffHistory.handoffs[0].statusHistory)), []);
const tamperedHandoffAction = JSON.parse(JSON.stringify(statusState));
const invalidActionSequence = tamperedHandoffAction.actionHistory.at(-1).sequence;
tamperedHandoffAction.actionHistory.at(-1).details.eventIds = ['M06-EVT-999'];
assert.ok(!stateApi.normalize(tamperedHandoffAction, fixture).actionHistory.some((action) => action.sequence === invalidActionSequence), 'restore rejects status actions with foreign evidence');
assert.ok(api.renderHandoffPanel(fixture, handoffState).includes('name="status"'));
for (const proposal of [
  { eventIds: [], destination: 'alert', rationale: 'x', recommendation: 'y' },
  { eventIds: ['M06-EVT-999'], destination: 'alert', rationale: 'x', recommendation: 'y' },
  { eventIds: ['M06-EVT-003'], destination: 'external', rationale: 'x', recommendation: 'y' },
  { eventIds: ['M06-EVT-003'], destination: 'rule', rationale: ' ', recommendation: 'y' },
  { eventIds: ['M06-EVT-003'], destination: 'rule', rationale: 'x', recommendation: 'y'.repeat(1001) },
]) assert.throws(() => api.proposeHandoff(evidenceState, fixture, proposal, '2026-09-27T09:22:12Z'), /Choose 1 to 20 fixture events/);
const badHandoffRestore = stateApi.normalize({ ...handoffState, handoffs: [...handoffState.handoffs,
  { ...handoffState.handoffs[0], id: 'M06-HANDOFF-999999', eventIds: ['M06-EVT-999'] }] }, fixture);
assert.strictEqual(badHandoffRestore.handoffs.length, 1, 'restore excludes proposals with foreign evidence');
console.log('M06 assessment related search: all checks passed');

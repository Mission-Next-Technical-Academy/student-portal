#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m07-assessment-data.js', 'soc-m07-assessment-state.js', 'soc-m07-assessment-actions.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const api = vm.runInContext('SocM07AssessmentActions', context);
const stateApi = vm.runInContext('SocM07AssessmentState', context);
const fixture = vm.runInContext('SocM07AssessmentData', context);
const s = fixture.scenario;
const at = '2026-09-27T10:15:00.000Z';
let state = stateApi.normalize({}, fixture);

state = api.append(state, 'message_review', at, { messageId: 'M07-MSG-001', reviewed: true, note: 'Headers inspected' }, fixture);
state = api.append(state, 'artifact_review', at, { artifactId: 'M07-ATTACH-001', reviewed: true }, fixture);
state = api.append(state, 'network_review', at, { eventId: 'M07-DNS-001', reviewed: true }, fixture);
state = api.append(state, 'pivot', at, { fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001' }, fixture);
state = api.append(state, 'scope_change', at, { recipientIds: ['acct-63'], deviceIds: ['ws-517'], reason: 'Delivered click scope' }, fixture);
const incident = { operation: 'create', incidentId: 'M07-INCIDENT-0001', title: 'QR invoice review',
  assessment: 'unknown', recipientIds: ['acct-63'], deviceIds: ['ws-517'],
  eventIds: ['M07-QR-014', 'M07-DNS-001'], summary: 'Click followed by DNS resolution' };
state = api.append(state, 'incident_link', at, incident, fixture);
assert.throws(() => api.append(state, 'incident_link', at, incident, fixture), /existing M07 incident/,
  'create cannot overwrite an existing incident');
const updatedIncident = { ...incident, operation: 'update', assessment: 'supported',
  summary: 'Updated after correlating the fixture DNS record' };
state = api.append(state, 'incident_link', at, updatedIncident, fixture);
state = api.append(state, 'evidence_change', at, { operation: 'add', eventId: 'M07-TLS-001', reason: 'Correlated destination and SNI' }, fixture);
for (const eventId of ['M07-MSG-001', 'M07-URL-001', 'M07-ATTACH-001', 'M07-DELIVERY-001', 'M07-QR-014', 'M07-PROC-001']) {
  assert.strictEqual(api.validDetails('evidence_change', { operation: 'add', eventId, reason: 'Fixture evidence selected' }, fixture), true,
    `${eventId} is a selectable fixture evidence record`);
}

assert.deepStrictEqual(JSON.parse(JSON.stringify(state.reviewedMessageIds)), ['M07-MSG-001']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.reviewedArtifactIds)), ['M07-ATTACH-001']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.reviewedNetworkEventIds)), ['M07-DNS-001']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.scope)), { recipientIds: ['acct-63'], deviceIds: ['ws-517'] });
assert.strictEqual(state.incidentLinks[0].incidentId, 'M07-INCIDENT-0001');
assert.strictEqual(state.incidentLinks[0].operation, 'update');
assert.strictEqual(state.incidentLinks[0].assessment, 'supported');
assert.strictEqual(state.evidenceChanges[0].eventId, 'M07-TLS-001');
assert.strictEqual(state.actionHistory.length, 8);
assert.deepStrictEqual(Array.from(state.actionHistory, (action) => action.sequence), [1, 2, 3, 4, 5, 6, 7, 8]);
assert.strictEqual(state.actionHistory[7].id, `${s.id}:ACTION-000008`);
assert.ok(Object.isFrozen(state.actionHistory[0]) && Object.isFrozen(state.actionHistory[0].details), 'audit records are immutable');
assert.strictEqual(Reflect.set(state.actionHistory[0].details, 'messageId', 'changed'), false);

const delivered = api.searchRecipients(fixture, { delivery: 'delivered', interaction: 'clicked', limit: 100 });
assert.deepStrictEqual(Array.from(delivered, (row) => [row.recipientId, row.deviceId, row.opened, row.clicked]),
  [['acct-63', 'ws-517', true, true]], 'delivered click scope follows fixture recipient telemetry');
const blocked = api.searchRecipients(fixture, { delivery: 'blocked_at_gateway', interaction: 'no_interaction' });
assert.deepStrictEqual(Array.from(blocked, (row) => [row.recipientId, row.delivery, row.opened, row.clicked]),
  [['acct-82', 'blocked_at_gateway', false, false]], 'gateway-blocked copy has no inferred interaction');
const capped = api.searchRecipients(fixture, { limit: 1000 });
assert.strictEqual(capped.length, 2, 'search results never exceed fixture recipients or hard cap');
const searchDetails = { query: 'acct-63', delivery: 'delivered', interaction: 'clicked', limit: 1,
  recipientIds: ['acct-63'], deviceIds: ['ws-517'] };
state = api.append(state, 'recipient_search', at, searchDetails, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.scope)), { recipientIds: ['acct-63'], deviceIds: ['ws-517'] });
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.recipientSearch)), {
  query: 'acct-63', delivery: 'delivered', interaction: 'clicked', limit: 1,
});
assert.strictEqual(state.actionHistory.at(-1).type, 'recipient_search');
assert.strictEqual(stateApi.normalize(JSON.parse(JSON.stringify(state)), fixture).actionHistory.at(-1).type,
  'recipient_search', 'bounded search and scope restore from validated audit action');

for (const [type, details] of [
  ['message_review', { messageId: 'foreign', reviewed: true }],
  ['artifact_review', { artifactId: 'foreign', reviewed: true }],
  ['network_review', { eventId: 'foreign', reviewed: true }],
  ['pivot', { fromEventId: 'M07-DNS-001', toEventId: 'foreign', field: 'relatedEvent', value: 'foreign' }],
  ['scope_change', { recipientIds: ['acct-outside'], deviceIds: [], reason: 'bad ref' }],
  ['recipient_search', { query: 'acct-63', delivery: 'all', interaction: 'all', limit: 100,
    recipientIds: ['acct-82'], deviceIds: [] }],
  ['incident_link', { ...incident, eventIds: ['foreign'] }],
  ['evidence_change', { operation: 'add', eventId: 'foreign', reason: 'bad ref' }],
]) assert.strictEqual(api.validDetails(type, details, fixture), false, `${type} rejects foreign fixture references`);
assert.strictEqual(api.validDetails('incident_link', { ...incident, deviceIds: ['ws-204'] }, fixture), false,
  'incident devices must belong to the selected recipient scope');
assert.strictEqual(api.validDetails('incident_link', { ...incident, recipientIds: ['acct-82'], deviceIds: [], eventIds: ['M07-DNS-001'] }, fixture), false,
  'linked network evidence must fit the selected entity scope');
assert.strictEqual(api.validDetails('incident_link', { ...incident, eventIds: ['M07-URL-001'] }, fixture), true,
  'fixture URL artifacts are valid linked records');
assert.throws(() => api.append(state, 'incident_link', at, { ...updatedIncident,
  incidentId: 'M07-INCIDENT-0099' }, fixture), /Cannot update/, 'update must target an existing incident');
assert.throws(() => api.append(state, 'message_review', '2026-09-27T10:15:00Z', { messageId: 'M07-MSG-001', reviewed: true }, fixture), /canonical UTC/);
assert.throws(() => api.append(state, 'message_review', '2026-09-27T10:21:00.000Z', { messageId: 'M07-MSG-001', reviewed: true }, fixture), /canonical UTC/);
assert.strictEqual(api.validDetails('recipient_search', { ...searchDetails, limit: 101 }, fixture), false,
  'search rejects result limits over 100');
assert.strictEqual(api.validDetails('recipient_search', { ...searchDetails, query: 'x'.repeat(101) }, fixture), false,
  'search rejects oversized terms');

for (let i = 0; i < api.MAX_HISTORY + 3; i++) {
  state = api.append(state, 'network_review', at, { eventId: 'M07-DNS-001', reviewed: i % 2 === 0 }, fixture);
}
assert.strictEqual(state.actionHistory.length, api.MAX_HISTORY, 'history is bounded');
assert.strictEqual(state.nextActionSequence, api.MAX_HISTORY + 13, 'IDs stay monotonic after truncation');
assert.strictEqual(state.actionHistory.at(-1).sequence, api.MAX_HISTORY + 12);
assert.ok(s.messages.some((message) => message.id === 'M07-MSG-001'));
// Entity identity: hosts are lower-case, but device ids picked or saved before the
// migration (upper-case `WS-517`) still validate and are stored in canonical form.
{
  let legacy = stateApi.normalize({}, fixture);
  legacy = api.append(legacy, 'scope_change', at, { recipientIds: ['acct-63'], deviceIds: ['WS-517'], reason: 'Legacy-case scope' }, fixture);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(legacy.scope)), { recipientIds: ['acct-63'], deviceIds: ['ws-517'] },
    'upper-case device pick is stored as the canonical lower-case host');
  assert.strictEqual(api.validDetails('incident_link', { ...incident, deviceIds: ['WS-517'] }, fixture), true,
    'device scope matching is case-insensitive');
  const saved = { actionHistory: [
    { id: `${s.id}:ACTION-000001`, sequence: 1, type: 'scope_change', timestamp: at, details: { recipientIds: ['acct-63'], deviceIds: ['WS-517'], reason: 'Saved before migration' } },
    { id: `${s.id}:ACTION-000002`, sequence: 2, type: 'incident_link', timestamp: at, details: { ...incident, deviceIds: ['WS-517'] } },
  ] };
  const restored = stateApi.normalize(saved, fixture);
  assert.strictEqual(restored.actionHistory.length, 2, 'pre-migration audit history is kept, not dropped');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.scope.deviceIds)), ['ws-517']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.incidentLinks[0].deviceIds)), ['ws-517']);
}
console.log('M07 assessment action contract: all checks passed');

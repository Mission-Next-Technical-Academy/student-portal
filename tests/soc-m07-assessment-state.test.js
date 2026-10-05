#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const records = new Map();
const calls = [];
const context = { LabRuntime: {
  loadCaseState(stateKey, moduleKey, user, defaults) {
    calls.push(['load', stateKey, moduleKey]);
    return records.get(`${stateKey}:${moduleKey}:${user.id}`) ?? JSON.parse(JSON.stringify(defaults));
  },
  saveCaseState(stateKey, moduleKey, user, state) {
    calls.push(['save', stateKey, moduleKey]);
    records.set(`${stateKey}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(state)));
    return state;
  },
  resetCaseState(stateKey, moduleKey, user, defaults) {
    calls.push(['reset', stateKey, moduleKey]);
    records.set(`${stateKey}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(defaults)));
  },
} };
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m07-assessment-data.js', 'soc-m04-assessment-data.js', 'soc-m05-assessment-data.js',
  'soc-m06-assessment-data.js', 'soc-m07-assessment-state.js', 'soc-m07-assessment-actions.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const api = vm.runInContext('SocM07AssessmentState', context);
const fixture = vm.runInContext('SocM07AssessmentData', context);
const user = { id: 'learner-1' };
const scenario = fixture.scenario;
const storageId = `${scenario.stateKey}:${api.MODULE_KEY}:${user.id}`;

assert.strictEqual(api.VERSION, 1);
assert.strictEqual(api.MODULE_KEY, 'soc-07');
assert.strictEqual(Object.isFrozen(api.EMPTY_DEFAULTS), true);
assert.strictEqual(Object.isFrozen(api.EMPTY_DEFAULTS.scope), true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize({}, fixture))), {
  reviewedMessageIds: [], reviewedArtifactIds: [], reviewedNetworkEventIds: [], pivots: [], scope: { recipientIds: [], deviceIds: [] },
  recipientSearch: { query: '', delivery: 'all', interaction: 'all', limit: 100 },
  incidentLinks: [], evidenceChanges: [], actionHistory: [], nextActionSequence: 1,
  schemaVersion: 1, scenarioId: scenario.id,
});
assert.throws(() => api.normalize({}, { scenario: { ...scenario, stateKey: '' } }), /stateKey/);

const input = { scope: { recipientIds: ['acct-63', 'outside'], deviceIds: ['ws-517', 'ws-999'] },
  reviewedMessageIds: ['M07-MSG-001', 'M07-MSG-001', 'missing'], reviewedNetworkEventIds: ['M07-DNS-001', 'missing'],
  pivots: [{ id: 'pivot-1' }], actionHistory: [{ sequence: 4, type: 'future' }], nextActionSequence: 3 };
const normalized = api.normalize(input, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.scope)), { recipientIds: [], deviceIds: [] }, 'unaudited scope is not trusted on restore');
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.reviewedMessageIds)), [], 'unaudited selections are not trusted on restore');
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.reviewedNetworkEventIds)), [], 'unaudited selections are not trusted on restore');
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.pivots)), [], 'untyped projection is not trusted');
assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized.actionHistory)), [], 'invalid actions are discarded');
assert.strictEqual(normalized.nextActionSequence, 3, 'valid sequence counter is retained when invalid history is removed');
normalized.scope.recipientIds.push('mutated');
assert.deepStrictEqual(input.scope.recipientIds, ['acct-63', 'outside'], 'normalization returns detached state');
assert.ok(Object.isFrozen(scenario) && Object.isFrozen(scenario.networkEvents), 'fixture stays immutable');

const actions = vm.runInContext('SocM07AssessmentActions', context);
const timestamp = '2026-09-27T10:15:00.000Z';
let audited = api.normalize({}, fixture);
audited = actions.append(audited, 'message_review', timestamp, { messageId: 'M07-MSG-001', reviewed: true }, fixture);
audited = actions.append(audited, 'network_review', timestamp, { eventId: 'M07-DNS-001', reviewed: true }, fixture);
audited = actions.append(audited, 'scope_change', timestamp, {
  recipientIds: ['acct-63'], deviceIds: ['ws-517'], reason: 'Investigate delivered recipient',
}, fixture);
audited = actions.append(audited, 'pivot', timestamp, {
  fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001',
}, fixture);
audited = actions.append(audited, 'incident_link', timestamp, {
  operation: 'create', incidentId: 'M07-INCIDENT-0001', title: 'Correlated activity', assessment: 'unknown',
  recipientIds: ['acct-63'], deviceIds: ['ws-517'], eventIds: ['M07-DNS-001'], summary: 'Correlated activity',
}, fixture);
audited = actions.append(audited, 'incident_link', timestamp, {
  operation: 'update', incidentId: 'M07-INCIDENT-0001', title: 'Correlated activity', assessment: 'supported',
  recipientIds: ['acct-63'], deviceIds: ['ws-517'], eventIds: ['M07-DNS-001'], summary: 'Confirmed correlation',
}, fixture);
audited = actions.append(audited, 'evidence_change', timestamp, {
  operation: 'add', eventId: 'M07-TLS-001', reason: 'TLS corroborates the DNS pivot',
}, fixture);
audited = actions.append(audited, 'evidence_change', timestamp, {
  operation: 'remove', eventId: 'M07-TLS-001', reason: 'Duplicate evidence entry',
}, fixture);
audited = actions.append(audited, 'evidence_change', timestamp, {
  operation: 'add', eventId: 'M07-QR-014', reason: 'Recipient click precedes network activity',
}, fixture);
const serialized = JSON.parse(JSON.stringify(audited));
const replayed = api.normalize(serialized, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(replayed, fixture))),
  JSON.parse(JSON.stringify(replayed)), 'version migration/normalization is idempotent');
const legacy = { ...serialized };
delete legacy.schemaVersion;
delete legacy.scenarioId;
const migrated = api.normalize(legacy, fixture);
assert.strictEqual(migrated.schemaVersion, api.VERSION);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(migrated, fixture))),
  JSON.parse(JSON.stringify(migrated)), 'legacy migration is idempotent');
assert.strictEqual(replayed.pivots.length, 1);
assert.strictEqual(replayed.incidentLinks.length, 1);
assert.strictEqual(replayed.incidentLinks[0].assessment, 'supported', 'latest validated incident action is projected');
assert.strictEqual(replayed.evidenceChanges.length, 1, 'evidence add/remove actions replay to the active set');
assert.strictEqual(replayed.evidenceChanges[0].eventId, 'M07-QR-014');
assert.ok(replayed.actionHistory.length <= actions.MAX_HISTORY);
assert.ok(replayed.incidentLinks.length <= 200 && replayed.evidenceChanges.length <= 200);
assert.deepStrictEqual(JSON.parse(JSON.stringify(replayed.reviewedMessageIds)), ['M07-MSG-001']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(replayed.reviewedNetworkEventIds)), ['M07-DNS-001']);

const tampered = JSON.parse(JSON.stringify(serialized));
tampered.actionHistory[0].details.messageId = 'M06-EVT-001';
tampered.actionHistory[1].details.eventId = 'foreign-event';
tampered.actionHistory[3].details.toEventId = 'M06-EVT-001';
tampered.actionHistory[4].details.eventIds = ['foreign-event'];
tampered.actionHistory.push({ id: 'wrong', sequence: 7, type: 'pivot', timestamp,
  details: { fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'x' } });
tampered.actionHistory[5].details.eventId = 'foreign-evidence';
tampered.actionHistory[6].details.reason = '';
tampered.actionHistory[7].details.eventId = 'M06-EVT-001';
tampered.actionHistory[8].details.eventId = 'foreign-evidence';
tampered.pivots = [{ fromEventId: 'M07-DNS-001', toEventId: 'M06-EVT-001' }];
tampered.incidentLinks = [{ incidentId: 'M07-INCIDENT-9999', eventIds: ['M06-EVT-001'] }];
tampered.evidenceChanges = [{ operation: 'add', eventId: 'foreign-evidence' }];
const restoredTamper = api.normalize(tampered, fixture);
assert.deepStrictEqual(Array.from(restoredTamper.actionHistory, (item) => item.type), ['scope_change'], 'foreign and malformed actions are rejected');
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredTamper.pivots)), [], 'projections cannot reintroduce tampered refs');
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredTamper.incidentLinks)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restoredTamper.evidenceChanges)), [], 'saved projections cannot restore evidence absent from valid audit history');
assert.throws(() => api.normalize({ schemaVersion: api.VERSION + 1 }, fixture), /newer/);
assert.throws(() => api.normalize({ schemaVersion: 1, scenarioId: 'M06-ASSESSMENT' }, fixture), /different scenario/);

const moduleScenarios = ['SocM04AssessmentData', 'SocM05AssessmentData', 'SocM06AssessmentData']
  .map((name) => vm.runInContext(`${name}.scenario`, context));
assert.ok(moduleScenarios.every((item) => item.id !== scenario.id && item.stateKey !== scenario.stateKey));
const priorStateKeys = moduleScenarios.map((item, index) => {
  const moduleKey = `soc-0${index + 4}`;
  const key = `${item.stateKey}:${moduleKey}:${user.id}`;
  records.set(key, { scenarioId: item.id, marker: `preserve-${moduleKey}` });
  return [key, JSON.stringify(records.get(key))];
});
api.save(user, audited, fixture);
assert.ok(records.has(`${scenario.stateKey}:soc-07:${user.id}`));
assert.ok(priorStateKeys.every(([key, value]) => JSON.stringify(records.get(key)) === value),
  'M07 saves leave M04-M06 namespaces and state untouched');

const loaded = api.load(user, fixture);
assert.ok(calls.some((call) => call[0] === 'load' && call[1] === scenario.stateKey && call[2] === api.MODULE_KEY));
assert.strictEqual(loaded.scenarioId, scenario.id);
assert.ok(records.has(storageId));
assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded.incidentLinks)), JSON.parse(JSON.stringify(replayed.incidentLinks)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(loaded.evidenceChanges)), JSON.parse(JSON.stringify(replayed.evidenceChanges)));
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.normalize(JSON.parse(JSON.stringify(loaded)), fixture))),
  JSON.parse(JSON.stringify(loaded)), 'serialized incident/evidence restore is idempotent');
let bounded = api.normalize({}, fixture);
for (let index = 0; index < actions.MAX_HISTORY + 5; index++) {
  bounded = actions.append(bounded, 'evidence_change', timestamp, {
    operation: 'add', eventId: 'M07-DNS-001', reason: `Evidence selection ${index}`,
  }, fixture);
}
const restoredBounded = api.normalize(JSON.parse(JSON.stringify(bounded)), fixture);
assert.strictEqual(restoredBounded.actionHistory.length, actions.MAX_HISTORY, 'restore bounds retained typed actions');
assert.ok(restoredBounded.evidenceChanges.length <= 200, 'restore bounds evidence projections');
assert.strictEqual(restoredBounded.evidenceChanges[0].eventId, 'M07-DNS-001');
const beforeStableLoad = calls.filter(([kind]) => kind === 'save').length;
api.load(user, fixture);
assert.strictEqual(calls.filter(([kind]) => kind === 'save').length, beforeStableLoad, 'stable load does not rewrite');

api.save(user, { reviewedMessageIds: ['M07-MSG-001'] }, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture).reviewedMessageIds)), [], 'restore derives reviewed state only from audit history');
const reset = api.reset(user, fixture);
assert.strictEqual(reset.scenarioId, scenario.id);
assert.deepStrictEqual(JSON.parse(JSON.stringify(reset.reviewedMessageIds)), []);
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.load(user, fixture))), JSON.parse(JSON.stringify(reset)));
assert.deepStrictEqual(calls.slice(-3).map(([kind]) => kind), ['reset', 'save', 'load']);
console.log('M07 assessment state contract: all checks passed');

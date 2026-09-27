#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m07-assessment-data.js', 'soc-m07-assessment-actions.js', 'soc-m07-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM07AssessmentData', context);
const rubric = vm.runInContext('SocM07AssessmentRubric', context);
const scenario = fixture.scenario;
const action = (type, details) => ({ type, details });
const chainIds = ['M07-QR-014', 'M07-DNS-001', 'M07-TLS-001'];
const additions = ['M07-DELIVERY-001', 'M07-DELIVERY-002', 'M07-QR-014'];
const incident = {
  operation: 'create', incidentId: 'M07-INCIDENT-0001', title: 'QR message network review',
  summary: 'Endpoint execution and credential compromise remain unknown; not established by current evidence.',
  assessment: 'unknown', recipientIds: ['acct-63'], deviceIds: ['WS-517'], eventIds: chainIds,
};
const complete = {
  evidenceChanges: additions.map((eventId) => ({ operation: 'add', eventId, reason: 'Preserve fixture evidence for incident review.' })),
  incidentLinks: [{ ...incident }],
  actionHistory: [
    ...additions.map((eventId) => action('evidence_change', { operation: 'add', eventId, reason: 'Preserve fixture evidence for incident review.' })),
    action('network_review', { eventId: 'M07-DNS-001', reviewed: true }),
    action('network_review', { eventId: 'M07-TLS-001', reviewed: true }),
    action('network_review', { eventId: 'M07-DNS-002', reviewed: true }),
    action('incident_link', incident),
  ],
};
const results = (state) => rubric.extract(state, fixture);
const awarded = (state) => Object.fromEntries(results(state).criteria.map((item) => [item.id, item.awarded]));

assert.strictEqual(rubric.RUBRIC.length, 5);
assert.ok(Object.values(awarded(complete)).every(Boolean), 'complete evidence/action history supports every criterion');
assert.deepStrictEqual(results(complete).criteria.map((item) => item.id), rubric.RUBRIC.map((item) => item.id));

const alternatePivot = structuredClone(complete);
alternatePivot.actionHistory = alternatePivot.actionHistory.filter((item) => item.details?.eventId !== 'M07-TLS-001');
alternatePivot.actionHistory.push(action('pivot', { fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001' }));
assert.strictEqual(awarded(alternatePivot)['confirmed-chain'], true, 'fixture-linked alternate pivot can establish a chain step');
alternatePivot.actionHistory[alternatePivot.actionHistory.length - 1].details.toEventId = 'M07-TLS-002';
assert.strictEqual(awarded(alternatePivot)['confirmed-chain'], false, 'unrelated lookalike pivot cannot establish the confirmed chain');
const alternateChainPath = structuredClone(complete);
alternateChainPath.actionHistory = alternateChainPath.actionHistory.filter((item) => item.type !== 'network_review'
  || !['M07-DNS-001', 'M07-TLS-001'].includes(item.details?.eventId));
alternateChainPath.actionHistory.push(
  action('pivot', { fromEventId: 'M07-QR-014', toEventId: 'M07-DNS-001', field: 'relatedEvent', value: 'M07-DNS-001' }),
  action('pivot', { fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001' }),
);
assert.strictEqual(awarded(alternateChainPath)['confirmed-chain'], true,
  'alternate fixture-linked click-to-DNS-to-TLS pivots establish the chain without direct review actions');

const missingBlocked = structuredClone(complete);
missingBlocked.actionHistory = missingBlocked.actionHistory.filter((item) => item.details?.eventId !== 'M07-DELIVERY-002');
assert.strictEqual(awarded(missingBlocked)['delivery-scope'], false, 'blocked recipient must be evidenced separately');

const incidentWithNoise = structuredClone(complete);
incidentWithNoise.incidentLinks[0].eventIds.push('M07-DNS-002');
incidentWithNoise.actionHistory.find((item) => item.type === 'incident_link').details.eventIds.push('M07-DNS-002');
assert.strictEqual(awarded(incidentWithNoise)['noise-rejection'], false, 'benign lookalike cannot be included as incident evidence');
const benignMailAndNetwork = structuredClone(complete);
benignMailAndNetwork.actionHistory.push(
  action('message_review', { messageId: 'M07-MSG-001', reviewed: true }),
  action('network_review', { eventId: 'M07-DNS-002', reviewed: true }),
  action('network_review', { eventId: 'M07-TLS-002', reviewed: true }),
  action('network_review', { eventId: 'M07-PROXY-002', reviewed: true }),
);
assert.strictEqual(awarded(benignMailAndNetwork)['noise-rejection'], true,
  'reviewed benign message/network lookalikes can remain excluded from the incident');

const unknownScope = structuredClone(complete);
unknownScope.incidentLinks[0].assessment = 'unknown';
unknownScope.incidentLinks[0].summary = 'Recipient scope beyond the delivered account remains unknown; execution and credentials are not established.';
unknownScope.actionHistory.find((item) => item.type === 'incident_link').details = { ...unknownScope.incidentLinks[0] };
assert.strictEqual(awarded(unknownScope)['unknown-boundaries'], true,
  'explicit unknown scope and impact do not erase supported delivery evidence');

const unsupportedClaim = structuredClone(complete);
unsupportedClaim.incidentLinks[0].summary = 'Credential compromise confirmed.';
unsupportedClaim.actionHistory.find((item) => item.type === 'incident_link').details.summary = 'Credential compromise confirmed.';
assert.strictEqual(awarded(unsupportedClaim)['unknown-boundaries'], false, 'unsupported credential certainty is rejected');

const missingAudit = structuredClone(complete);
missingAudit.actionHistory = missingAudit.actionHistory.filter((item) => item.type !== 'incident_link');
assert.strictEqual(awarded(missingAudit)['incident-evidence'], false, 'unaudited incident projection is not accepted');

const before = JSON.stringify(complete);
const extracted = results(complete);
assert.strictEqual(JSON.stringify(complete), before, 'extraction is pure');
assert.deepStrictEqual(Object.keys(extracted.criteria[0]).sort(), ['awarded', 'evidenceIds', 'finding', 'id']);
assert.ok(extracted.criteria.every((item) => item.evidenceIds.every((id) => /^M07-/.test(id))));
assert.ok(!JSON.stringify(extracted).includes(scenario.expectedTruth.unconfirmed[0]));
assert.ok(!JSON.stringify(rubric.RUBRIC).includes(scenario.expectedTruth.confirmed[0]));
assert.ok(results(null).criteria.every((item) => !item.awarded));
assert.ok(results({ actionHistory: 'invalid' }).criteria.every((item) => !item.awarded));
console.log('M07 assessment rubric extraction: all checks passed');

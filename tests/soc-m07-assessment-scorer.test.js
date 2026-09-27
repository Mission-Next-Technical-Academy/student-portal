#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m07-assessment-data.js', 'soc-m07-assessment-state.js', 'soc-m07-assessment-actions.js', 'soc-m07-assessment-rubric.js', 'soc-m07-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const fixture = vm.runInContext('SocM07AssessmentData', context);
const scorer = vm.runInContext('SocM07AssessmentScorer', context);
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
const criterion = (result, id) => result.criteria.find((item) => item.id === id);
const snapshot = JSON.stringify(complete);
const full = scorer.score(complete, fixture);
assert.strictEqual(scorer.CRITERIA.reduce((sum, item) => sum + item.weight, 0), 100);
assert.strictEqual(full.score, 100);
assert.strictEqual(full.rawScore, 100);
assert.strictEqual(full.passed, true);
assert.strictEqual(full.assessmentId, fixture.scenario.id);
assert.strictEqual(full.criteria.length, 5);
assert.ok(full.criteria.every((item) => item.points === item.max && item.supportingEvidence.length && item.feedback));
assert.strictEqual(JSON.stringify(complete), snapshot, 'scoring does not mutate learner state');

const actionApi = vm.runInContext('SocM07AssessmentActions', context);
const stateApi = vm.runInContext('SocM07AssessmentState', context);
const at = '2026-09-27T10:15:00.000Z';
const buildAuditedScenario = (useAlternatePivots = false) => {
  let state = stateApi.normalize({}, fixture);
  const append = (type, details) => { state = actionApi.append(state, type, at, details, fixture); };
  for (const eventId of additions) append('evidence_change', { operation: 'add', eventId, reason: 'Preserve evidence for incident review.' });
  append('message_review', { messageId: 'M07-MSG-001', reviewed: true, note: 'Reviewed sender and authentication details.' });
  if (useAlternatePivots) {
    append('pivot', { fromEventId: 'M07-QR-014', toEventId: 'M07-DNS-001', field: 'relatedEvent', value: 'M07-DNS-001' });
    append('pivot', { fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001' });
  } else {
    for (const eventId of ['M07-DNS-001', 'M07-TLS-001']) append('network_review', { eventId, reviewed: true });
  }
  append('network_review', { eventId: 'M07-DNS-002', reviewed: true });
  append('incident_link', { ...incident });
  return state;
};
const audited = buildAuditedScenario(true);
assert.strictEqual(criterion(scorer.score(audited, fixture), 'confirmed-chain').points, 30,
  'audited alternate click-to-DNS-to-TLS pivots earn full chain credit');
const serialized = JSON.parse(JSON.stringify(audited));
const restored = stateApi.normalize(serialized, fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored)), serialized, 'serialized action history restores idempotently');
assert.deepStrictEqual(scorer.score(restored, fixture), scorer.score(audited, fixture),
  'restored investigation receives identical instructor scoring');
assert.strictEqual(criterion(scorer.score(restored, fixture), 'delivery-scope').points, 15,
  'delivered and gateway-blocked delivery records remain independently evidenced after restore');
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.incidentLinks[0].recipientIds)), ['acct-63'],
  'the incident stays scoped to the delivered recipient rather than the blocked recipient');
const tamperedRestore = JSON.parse(JSON.stringify(serialized));
tamperedRestore.actionHistory.find((entry) => entry.type === 'pivot').details.toEventId = 'M06-EVT-001';
tamperedRestore.actionHistory.find((entry) => entry.type === 'incident_link').details.eventIds = ['M07-QR-014', 'M06-EVT-001'];
const afterTamper = stateApi.normalize(tamperedRestore, fixture);
assert.strictEqual(scorer.score(afterTamper, fixture).score < scorer.score(restored, fixture).score, true,
  'tampered cross-scenario pivot and incident evidence references are rejected before scoring');
assert.ok(afterTamper.actionHistory.every((entry) => entry.details.toEventId !== 'M06-EVT-001'
  && !entry.details.eventIds?.includes('M06-EVT-001')));

let noisyReviewed = buildAuditedScenario(false);
for (const eventId of ['M07-TLS-002', 'M07-PROXY-002']) {
  noisyReviewed = actionApi.append(noisyReviewed, 'network_review', at, { eventId, reviewed: true }, fixture);
}
assert.strictEqual(criterion(scorer.score(noisyReviewed, fixture), 'noise-rejection').points, 15,
  'reviewing unrelated benign network lookalikes does not pull them into incident scope');

const partial = scorer.score({
  evidenceChanges: [{ operation: 'add', eventId: 'M07-DELIVERY-001' }],
  actionHistory: [action('evidence_change', { operation: 'add', eventId: 'M07-DELIVERY-001' })],
}, fixture);
assert.strictEqual(criterion(partial, 'delivery-scope').points, 7, 'partial scope evidence receives half of its 15-point weight');
assert.ok(criterion(partial, 'delivery-scope').misses.length, 'partial points retain criterion-level misses');
assert.ok(criterion(partial, 'delivery-scope').feedback.includes('partial evidence'));
assert.strictEqual(criterion(partial, 'confirmed-chain').points, 0, 'missing chain actions receive zero');
assert.strictEqual(scorer.score({}, fixture).score, 0, 'empty work receives zero');

for (const claim of [
  'Payload execution confirmed; credentials remain unknown.',
  'Credential compromise confirmed; endpoint execution remains unknown.',
]) {
  const unsafe = structuredClone(complete);
  unsafe.incidentLinks[0].summary = claim;
  unsafe.actionHistory.push(action('incident_link', { ...incident, summary: claim }));
  const capped = scorer.score(unsafe, fixture);
  assert.ok(capped.rawScore < 100, 'unsupported certainty also fails its rubric criterion');
  assert.strictEqual(capped.score, 69);
  assert.strictEqual(capped.passed, false);
  assert.strictEqual(capped.review.cap.applied, true);
  assert.strictEqual(capped.criticalMisses.length, 1);
}
const browserAsExecution = structuredClone(complete);
browserAsExecution.actionHistory.push(action('evidence_change', { operation: 'add', eventId: 'M07-PROC-001' }));
assert.strictEqual(scorer.score(browserAsExecution, fixture).score, 100,
  'preserving linked browser telemetry is not itself an unsupported execution claim');
assert.strictEqual(criterion(scorer.score(browserAsExecution, fixture), 'unknown-boundaries').points, 25,
  'evidence preservation can coexist with an explicit unknown conclusion');
assert.strictEqual(scorer.hasUnsupportedCertainty({ actionHistory: [action('incident_link', { summary: 'Payload execution remains unknown; not established.' })] }), false);

const payload = JSON.stringify(full);
assert.ok(!payload.includes(fixture.scenario.expectedTruth.confirmed[0]), 'instructor result excludes answer-key prose');
assert.ok(!payload.includes(fixture.scenario.expectedTruth.unconfirmed[0]), 'instructor result excludes private truth detail');
assert.ok(fixture.scenario.expectedTruth.confirmed.every((value) => !payload.includes(value))
  && fixture.scenario.expectedTruth.unconfirmed.every((value) => !payload.includes(value)),
'instructor payload contains none of the fixture expected-truth statements');
assert.ok(full.criteria.every((item) => Array.isArray(item.supportingEvidence) && Array.isArray(item.misses)));
// The scorer runs only when the ticket is submitted, never while rendering.
const m07Page = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-07.js'), 'utf8');
const m07Render = m07Page.slice(m07Page.indexOf('function moduleSevenCaseTicket()'), m07Page.indexOf('function moduleSevenAdditionalLabs()'));
assert.ok(m07Render.length > 0 && !/SocM07AssessmentScorer/.test(m07Render), 'scorer is not exposed through learner rendering');
assert.ok(/function moduleSevenFinalizeProveIt\(\)[\s\S]*SocM07AssessmentScorer\.score/.test(m07Page), 'the submitted ticket is scored by the M07 rubric');
const html = fs.readFileSync(path.join(__dirname, '..', 'portal', 'index.html'), 'utf8');
assert.ok(html.indexOf('soc-m07-assessment-rubric.js') < html.indexOf('soc-m07-assessment-scorer.js'), 'scorer loads after rubric');
console.log('M07 assessment scorer: all checks passed');

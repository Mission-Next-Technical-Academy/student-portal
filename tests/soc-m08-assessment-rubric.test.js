#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m08-assessment-data.js', 'soc-m08-assessment-state.js',
  'soc-m08-assessment-actions.js', 'soc-m08-assessment-rubric.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const { fixture, api, actions, rubric } = vm.runInContext(`({ fixture: SocM08AssessmentData,
  api: SocM08AssessmentState, actions: SocM08AssessmentActions, rubric: SocM08AssessmentRubric })`, context);
const at = (n) => `2026-09-27T10:${String(50 + n).padStart(2, '0')}:00.000Z`;
const complete = () => {
  let state = api.normalize({}, fixture);
  const append = (type, details, minute) => { state = actions.append(state, type, at(minute), details, fixture); };
  append('finding_review', { findingId: 'M08-FINDING-001', status: 'reviewed',
    evidenceIds: ['M08-EVID-001', 'M08-EVID-002'], notes: 'Current version and applicability validated.' }, 0);
  append('finding_review', { findingId: 'M08-FINDING-002', status: 'needs-validation',
    evidenceIds: ['M08-EVID-004', 'M08-EVID-005'], notes: 'Old scan and current applicability still unknown.' }, 1);
  append('finding_review', { findingId: 'M08-FINDING-003', status: 'not-applicable',
    evidenceIds: ['M08-EVID-007', 'M08-EVID-008'], notes: 'Host inventory confirms the product is absent.' }, 2);
  append('incident_link', { findingId: 'M08-FINDING-001', incidentId: 'M08-INCIDENT-001',
    evidenceIds: ['M08-INC-EVID-001'], rationale: 'Track the validated public service finding.' }, 3);
  append('risk_acceptance', { findingId: 'M08-FINDING-002', dispositionId: 'M08-RISK-DISP-001',
    evidenceIds: ['M08-RISK-EVID-001'], rationale: 'Approved temporary exception while current applicability is checked.' }, 4);
  append('escalation', { findingId: 'M08-FINDING-001', routeId: 'security-lead-review', ownerId: 'p.diallo',
    dueDate: '2026-09-28', rationale: 'Public exposure warrants security lead review.',
    evidenceIds: ['M08-EVID-003', 'M08-ASSET-EVID-002'] }, 5);
  append('remediation_decision', { findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress', ownerId: 'p.diallo',
    dueDate: '2026-09-28', rationale: 'Confirmed applicability and public exposure require urgent remediation.',
    evidenceIds: ['M08-EVID-002', 'M08-ASSET-EVID-001', 'M08-ASSET-EVID-002', 'M08-ASSET-EVID-003', 'M08-ASSET-EVID-004'] }, 6);
  return api.normalize(JSON.parse(JSON.stringify(state)), fixture);
};
const state = complete();
const extract = (value) => rubric.extract(value, fixture);
const result = extract(state);
const byId = (value) => Object.fromEntries(extract(value).criteria.map((item) => [item.id, item]));

assert.strictEqual(rubric.RUBRIC.length, 8);
assert.deepStrictEqual(result.criteria.map((item) => item.id), rubric.RUBRIC.map((item) => item.id));
assert.strictEqual(byId(state)['audited-finding-review'].finding, 'supported');
assert.strictEqual(byId(state)['freshness-applicability'].finding, 'supported');
assert.strictEqual(byId(state)['asset-context-controls'].finding, 'supported');
assert.strictEqual(byId(state)['incident-link'].finding, 'supported');
assert.strictEqual(byId(state)['risk-acceptance'].finding, 'supported');
assert.strictEqual(byId(state)['escalation'].finding, 'supported');
assert.strictEqual(byId(state)['remediation-outcome'].finding, 'supported');
assert.strictEqual(byId(state)['uncertainty-boundary'].finding, 'supported');
const correctedDecision = actions.append(state, 'remediation_decision', at(7), {
  findingId: 'M08-FINDING-001', priority: 'high', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-29', rationale: 'Corrected after weighing verified controls and residual exposure.',
  evidenceIds: ['M08-EVID-002', 'M08-ASSET-EVID-001', 'M08-ASSET-EVID-002', 'M08-ASSET-EVID-003', 'M08-ASSET-EVID-004'],
}, fixture);
assert.strictEqual(byId(correctedDecision)['remediation-outcome'].finding, 'supported',
  'rubric extraction recognizes the latest auditable corrected remediation decision');

const noReview = api.normalize({}, fixture);
assert.strictEqual(byId(noReview)['freshness-applicability'].finding, 'unknown');
assert.strictEqual(byId(noReview)['uncertainty-boundary'].finding, 'unknown');
const staleOnly = { ...noReview, findingReviews: [state.findingReviews[1]], actionHistory: state.actionHistory.filter((a) => a.type === 'finding_review' && a.details.findingId === 'M08-FINDING-002') };
assert.strictEqual(byId(staleOnly)['freshness-applicability'].finding, 'partial');

const stalePromoted = actions.append(noReview, 'finding_review', at(3), {
  findingId: 'M08-FINDING-002', status: 'reviewed', evidenceIds: ['M08-EVID-004', 'M08-EVID-005', 'M08-EVID-006'],
  notes: 'Promoted based on the old scan and public exploit report despite unknown current applicability.',
}, fixture);
assert.notStrictEqual(byId(stalePromoted)['freshness-applicability'].finding, 'supported',
  'stale scan and unknown applicability cannot establish a confirmed finding');
assert.notStrictEqual(byId(stalePromoted)['uncertainty-boundary'].finding, 'supported',
  'the rubric must detect an unsupported confirmed status');

const irrelevantPromoted = actions.append(noReview, 'finding_review', at(4), {
  findingId: 'M08-FINDING-003', status: 'reviewed', evidenceIds: ['M08-EVID-007', 'M08-EVID-008', 'M08-EVID-009'],
  notes: 'Promoted from high CVSS and known exploit despite inventory proving the product is absent.',
}, fixture);
assert.notStrictEqual(byId(irrelevantPromoted)['freshness-applicability'].finding, 'supported',
  'known exploitability and higher CVSS cannot override evidence that the signature is irrelevant');
assert.notStrictEqual(byId(irrelevantPromoted)['uncertainty-boundary'].finding, 'supported');

const promotedBoth = actions.append(stalePromoted, 'finding_review', at(5), {
  findingId: 'M08-FINDING-003', status: 'reviewed', evidenceIds: ['M08-EVID-007', 'M08-EVID-008', 'M08-EVID-009'],
  notes: 'Promoted despite contradictory applicability evidence.',
}, fixture);
assert.notStrictEqual(byId(promotedBoth)['uncertainty-boundary'].finding, 'supported',
  'both false confirmations must fail the uncertainty-boundary criterion');

const contextEvidence = byId(state)['asset-context-controls'].evidenceIds;
assert.ok(contextEvidence.includes('M08-ASSET-EVID-002'), 'public reachability remains in risk context');
assert.ok(contextEvidence.includes('M08-ASSET-EVID-003'), 'public service exposure remains in risk context');
assert.ok(contextEvidence.includes('M08-ASSET-EVID-004'), 'the WAF is represented as a compensating control');
assert.strictEqual(new Set(contextEvidence.map((id) => fixture.scenario.assetEvidence.find((item) => item.id === id).kind)).size, 4,
  'compensating controls add context without erasing reachability or exposure');

const forged = structuredClone(state);
forged.incidentLinks = [];
assert.strictEqual(byId(forged)['incident-link'].finding, 'unknown', 'projection without matching audited action is ignored');
const before = JSON.stringify(state);
assert.deepStrictEqual(Object.keys(result.criteria[0]).sort(), ['evidenceIds', 'finding', 'id']);
assert.ok(result.criteria.every((item) => item.evidenceIds.every((id) => /^M08-/.test(id))));
assert.ok(!JSON.stringify(result).includes(fixture.scenario.expectedPriority.rationale));
assert.ok(!JSON.stringify(rubric.RUBRIC).includes('expectedPriority'));
assert.strictEqual(JSON.stringify(state), before, 'extraction is pure');
assert.ok(rubric.extract(null, null).criteria.every((item) => item.finding === 'unknown'));
assert.ok(extract({ actionHistory: 'invalid' }).criteria.filter((item) => item.id !== 'asset-context-controls')
  .every((item) => item.finding !== 'supported'));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.indexOf('soc-m08-assessment-actions.js') < html.indexOf('soc-m08-assessment-rubric.js'));
assert.ok(html.indexOf('soc-m08-assessment-rubric.js') < html.indexOf('soc-m08-assessment-ui.js'));
console.log('M08 assessment rubric extraction: all checks passed');

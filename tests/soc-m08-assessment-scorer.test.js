#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-assessment-scorer.js', 'soc-m08-assessment-data.js', 'soc-m08-assessment-state.js',
  'soc-m08-assessment-actions.js', 'soc-m08-assessment-rubric.js', 'soc-m08-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const { fixture, api, actions, scorer } = vm.runInContext(`({ fixture: SocM08AssessmentData,
  api: SocM08AssessmentState, actions: SocM08AssessmentActions, scorer: SocM08AssessmentScorer })`, context);
let state = api.normalize({}, fixture);
const at = (minute) => `2026-09-27T10:${String(minute).padStart(2, '0')}:00.000Z`;
const append = (type, details, minute) => { state = actions.append(state, type, at(minute), details, fixture); };
append('finding_review', { findingId: 'M08-FINDING-001', status: 'reviewed', evidenceIds: ['M08-EVID-001', 'M08-EVID-002'], notes: 'Validated.' }, 50);
append('finding_review', { findingId: 'M08-FINDING-002', status: 'needs-validation', evidenceIds: ['M08-EVID-004', 'M08-EVID-005'], notes: 'Unknown.' }, 51);
append('finding_review', { findingId: 'M08-FINDING-003', status: 'not-applicable', evidenceIds: ['M08-EVID-007', 'M08-EVID-008'], notes: 'Not present.' }, 52);
append('incident_link', { findingId: 'M08-FINDING-001', incidentId: 'M08-INCIDENT-001', evidenceIds: ['M08-INC-EVID-001'], rationale: 'Track incident review.' }, 53);
append('risk_acceptance', { findingId: 'M08-FINDING-002', dispositionId: 'M08-RISK-DISP-001', evidenceIds: ['M08-RISK-EVID-001'], rationale: 'Temporary approved exception.' }, 54);
append('escalation', { findingId: 'M08-FINDING-001', routeId: 'security-lead-review', ownerId: 'p.diallo', dueDate: '2026-09-28', rationale: 'Review exposure with security lead.', evidenceIds: ['M08-EVID-003', 'M08-ASSET-EVID-002'] }, 55);
const contextEvidence = ['M08-ASSET-EVID-001', 'M08-ASSET-EVID-002', 'M08-ASSET-EVID-003', 'M08-ASSET-EVID-004'];
append('remediation_decision', { findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'Prioritized using current validation and asset context.',
  evidenceIds: ['M08-EVID-002', ...contextEvidence] }, 56);
state = api.normalize(JSON.parse(JSON.stringify(state)), fixture);

const result = scorer.score(state, fixture);
assert.strictEqual(scorer.CRITERIA.reduce((sum, item) => sum + item.weight, 0), 100);
assert.strictEqual(result.score, 100);
assert.strictEqual(result.passed, true);
assert.ok(result.criteria.every((item) => item.level === 'full'));
assert.ok(result.criteria.every((item) => item.supportingEvidence.every((id) => /^M08-/.test(id))));
assert.ok(!JSON.stringify(result).includes(fixture.scenario.expectedPriority.rationale));

const wrongPriority = actions.append(api.normalize({}, fixture), 'remediation_decision', at(50), {
  findingId: 'M08-FINDING-001', priority: 'medium', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'Evidence-based alternative priority for partial-credit check.',
  evidenceIds: ['M08-EVID-002', ...contextEvidence],
}, fixture);
const partial = scorer.score(wrongPriority, fixture);
const remediation = partial.criteria.find((item) => item.id === 'remediation-outcome');
assert.strictEqual(remediation.level, 'partial');
assert.strictEqual(remediation.points, 7);
assert.ok(remediation.supportingEvidence.includes('M08-ASSET-EVID-001'));
assert.ok(remediation.misses.length);

const alternateHigh = actions.append(state, 'remediation_decision', at(57), {
  findingId: 'M08-FINDING-001', priority: 'high', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'High priority reflects the verified WAF mitigation while retaining public origin exposure and confirmed applicability.',
  evidenceIds: ['M08-EVID-002', ...contextEvidence],
}, fixture);
const alternateScore = scorer.score(alternateHigh, fixture);
const alternateOutcome = alternateScore.criteria.find((item) => item.id === 'remediation-outcome');
assert.strictEqual(alternateOutcome.level, 'partial', 'a reasoned alternate priority earns meaningful partial credit');
assert.strictEqual(alternateOutcome.points, 7);
assert.strictEqual(alternateScore.score, 92);
assert.ok(alternateOutcome.supportingEvidence.includes('M08-ASSET-EVID-004'), 'control evidence is retained');
assert.ok(alternateOutcome.supportingEvidence.includes('M08-ASSET-EVID-002'), 'control evidence does not erase public reachability');
assert.ok(alternateOutcome.supportingEvidence.includes('M08-ASSET-EVID-003'), 'control evidence does not erase public exposure');

const correctedState = actions.append(alternateHigh, 'remediation_decision', at(58), {
  findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'Corrected after confirming current applicability and the public attack path.',
  evidenceIds: ['M08-EVID-002', ...contextEvidence],
}, fixture);
const correctedRestore = api.normalize(JSON.parse(JSON.stringify(correctedState)), fixture);
assert.strictEqual(scorer.score(correctedRestore, fixture).criteria.find((item) => item.id === 'remediation-outcome').level, 'full',
  'a corrected priority receives full remediation credit after restore');
assert.strictEqual(scorer.instructorPayload(correctedRestore, fixture).instructorTruth.submittedPriority, 'critical');
assert.strictEqual(scorer.instructorPayload(correctedRestore, fixture).instructorTruth.priorityMatches, true);
assert.strictEqual(scorer.instructorPayload(alternateHigh, fixture).instructorTruth.submittedPriority, 'high');
assert.strictEqual(scorer.instructorPayload(alternateHigh, fixture).instructorTruth.priorityMatches, false);
assert.ok(!JSON.stringify(scorer.score(correctedRestore, fixture)).includes('expectedPriority'));
assert.ok(!JSON.stringify(scorer.score(correctedRestore, fixture)).includes(fixture.scenario.expectedPriority.rationale),
  'learner-facing scoring contains neither instructor truth nor its rationale');

let staleConfirmed = api.normalize({}, fixture);
staleConfirmed = actions.append(staleConfirmed, 'finding_review', at(50), {
  findingId: 'M08-FINDING-002', status: 'reviewed', evidenceIds: ['M08-EVID-004', 'M08-EVID-005', 'M08-EVID-006'],
  notes: 'Confirmed from stale scan and exploit report although current applicability is unknown.',
}, fixture);
const staleScore = scorer.score(staleConfirmed, fixture);
assert.notStrictEqual(staleScore.criteria.find((item) => item.id === 'freshness-applicability').level, 'full');
assert.notStrictEqual(staleScore.criteria.find((item) => item.id === 'uncertainty-boundary').level, 'full');

let irrelevantConfirmed = api.normalize({}, fixture);
irrelevantConfirmed = actions.append(irrelevantConfirmed, 'finding_review', at(50), {
  findingId: 'M08-FINDING-003', status: 'reviewed', evidenceIds: ['M08-EVID-007', 'M08-EVID-008', 'M08-EVID-009'],
  notes: 'Confirmed because the CVSS is higher and a public exploit exists, despite no affected product being installed.',
}, fixture);
const irrelevantScore = scorer.score(irrelevantConfirmed, fixture);
assert.notStrictEqual(irrelevantScore.criteria.find((item) => item.id === 'freshness-applicability').level, 'full');
assert.notStrictEqual(irrelevantScore.criteria.find((item) => item.id === 'uncertainty-boundary').level, 'full');

const empty = scorer.score(api.normalize({}, fixture), fixture);
assert.strictEqual(empty.score, 0);
assert.ok(empty.criteria.every((item) => item.level === 'zero'));
const instructor = scorer.instructorPayload(state, fixture);
assert.strictEqual(instructor.instructorTruth.priority, 'critical');
assert.strictEqual(instructor.instructorTruth.rationale, fixture.scenario.expectedPriority.rationale);
assert.strictEqual(instructor.instructorTruth.submittedPriority, 'critical');
assert.strictEqual(instructor.instructorTruth.priorityMatches, true);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.indexOf('soc-m08-assessment-rubric.js') < html.indexOf('soc-m08-assessment-scorer.js'));
assert.ok(html.indexOf('soc-m08-assessment-scorer.js') < html.indexOf('soc-m08-assessment-ui.js'));
const ui = fs.readFileSync(path.join(root, 'soc-m08-assessment-ui.js'), 'utf8');
assert.ok(!ui.includes('SocM08AssessmentScorer'));
assert.ok(!ui.includes('expectedPriority'));
console.log('M08 assessment weighted scorer: all checks passed');

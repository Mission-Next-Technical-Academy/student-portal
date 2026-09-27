#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m08-assessment-data.js', 'soc-m08-assessment-state.js',
  'soc-m08-assessment-actions.js', 'soc-m08-assessment-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM08AssessmentData', context);
const stateApi = vm.runInContext('SocM08AssessmentState', context);
const actions = vm.runInContext('SocM08AssessmentActions', context);
const ui = vm.runInContext('SocM08AssessmentUi', context);
const emptyState = stateApi.normalize({}, fixture);
let html = ui.render(fixture, emptyState);

for (const value of ['Findings queue', 'CVE-2021-41773', 'CVSS 3.1 base score', '7.5',
  'Freshness', 'current', 'Applicability', 'confirmed', 'M08-EVID-001', 'Save review',
  'Comparative asset context', 'WEB-DMZ-14', 'APP-DMZ-22', 'Business impact',
  'Reachability', 'Exposure', 'Compensating controls', 'CVSS describes vulnerability severity',
  'M08-ASSET-EVID-001', 'M08-ASSET-EVID-008']) {
  assert.ok(html.includes(value), `expected rendered findings view to include ${value}`);
}
assert.strictEqual((html.match(/class="m08-assessment-asset"/g) || []).length, fixture.scenario.assetInventory.length,
  'comparative context renders every fixture asset');
assert.ok(!html.includes('expectedPriority'));
assert.ok(!html.includes('urgent remediation routing'));
assert.ok(!html.includes('urgent remediation routing'));
assert.ok(html.includes('data-m08-assessment-select="M08-FINDING-002"'));
const selectedIds = (markup) => Array.from(markup.matchAll(/data-m08-assessment-select="([^"]+)"/g), (match) => match[1]);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { freshness: 'stale' })), ['M08-FINDING-002']);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { applicability: 'confirmed' })), ['M08-FINDING-001']);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { assetId: 'APP-DMZ-22' })), ['M08-FINDING-002']);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { priorityTier: 'critical' })), ['M08-FINDING-001', 'M08-FINDING-003']);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { controlStatus: 'verified' })), ['M08-FINDING-002']);
assert.deepStrictEqual(selectedIds(ui.render(fixture, emptyState, '', { search: 'managed-waf' })), ['M08-FINDING-001', 'M08-FINDING-003']);
const combined = ui.render(fixture, emptyState, '', { freshness: 'current', applicability: 'confirmed', priorityTier: 'critical', controlStatus: 'partial' });
assert.deepStrictEqual(selectedIds(combined), ['M08-FINDING-001']);
assert.ok(combined.includes('Asset criticality') && combined.includes('managed-waf · partial'));
assert.ok(combined.includes('CVSS severity is one input'));
const noMatches = ui.render(fixture, emptyState, '', { search: 'no-such-remediation-context' });
assert.deepStrictEqual(selectedIds(noMatches), []);
assert.ok(noMatches.includes('No findings match these filters.'));
const authorizedMarkup = ui.render(fixture, emptyState, 'M08-FINDING-002');
assert.ok(authorizedMarkup.includes('Record risk acceptance'));
assert.ok(authorizedMarkup.includes('M08-RISK-EVID-001'));
assert.ok(authorizedMarkup.includes('No fixture incident is linked to this finding.'));
assert.ok(!authorizedMarkup.includes('expectedPriority'));
const unauthorizedMarkup = ui.render(fixture, emptyState, 'M08-FINDING-001');
assert.ok(!unauthorizedMarkup.includes('Record risk acceptance'));
assert.ok(unauthorizedMarkup.includes('No explicit risk-acceptance disposition is supported'));
assert.ok(unauthorizedMarkup.includes('Link incident'));
assert.ok(unauthorizedMarkup.includes('Record escalation'));
assert.ok(unauthorizedMarkup.includes('name="ownerId"'));
assert.ok(unauthorizedMarkup.includes('name="dueDate"'));
assert.ok(unauthorizedMarkup.includes('security-lead-review'));
assert.ok(unauthorizedMarkup.includes('data-m08-assessment-remediation-decision="M08-FINDING-001"'));
assert.ok(unauthorizedMarkup.includes('Save remediation decision'));
const decided = actions.append(emptyState, 'remediation_decision', '2026-09-27T10:55:00.000Z', {
  findingId: 'M08-FINDING-001', priority: 'critical', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-28', rationale: 'Internet exposure and confirmed applicability require urgent remediation.',
  evidenceIds: ['M08-EVID-002'],
}, fixture);
const decisionMarkup = ui.render(fixture, stateApi.normalize(JSON.parse(JSON.stringify(decided)), fixture), 'M08-FINDING-001');
assert.ok(decisionMarkup.includes('data-m08-assessment-remediation-transition="M08-FINDING-001"'));
assert.ok(decisionMarkup.includes('Current status:'));
assert.ok(decisionMarkup.includes('name="toStatus"'));
const transitioned = actions.append(decided, 'remediation_transition', '2026-09-27T10:56:00.000Z', {
  findingId: 'M08-FINDING-001', priority: 'critical', fromStatus: 'in-progress', toStatus: 'resolved',
  ownerId: 'p.diallo', dueDate: '2026-09-28', rationale: 'Internet exposure and confirmed applicability require urgent remediation.',
  evidenceIds: ['M08-EVID-002'], transitionRationale: 'Retest confirms the affected service is patched and no longer exposed.',
}, fixture);
const transitionMarkup = ui.render(fixture, stateApi.normalize(JSON.parse(JSON.stringify(transitioned)), fixture), 'M08-FINDING-001');
assert.ok(transitionMarkup.includes('Transition in-progress'));
assert.ok(transitionMarkup.includes('Retest confirms the affected service'));
assert.ok(transitionMarkup.includes('Current status: <strong>resolved</strong>'));
const corrected = actions.append(decided, 'remediation_decision', '2026-09-27T10:56:30.000Z', {
  findingId: 'M08-FINDING-001', priority: 'high', status: 'in-progress', ownerId: 'p.diallo',
  dueDate: '2026-09-29', rationale: 'Corrected priority after weighing the verified WAF and remaining exposure.',
  evidenceIds: ['M08-EVID-002', 'M08-ASSET-EVID-004'],
}, fixture);
const correctedMarkup = ui.render(fixture, stateApi.normalize(JSON.parse(JSON.stringify(corrected)), fixture), 'M08-FINDING-001');
assert.ok(correctedMarkup.includes('Priority high · owner p.diallo · due 2026-09-29'),
  'the learner view shows the latest corrected decision and accountable owner/date');
assert.ok(correctedMarkup.includes('name="ownerId"'));
assert.ok(correctedMarkup.includes('name="dueDate"'));
assert.ok(!correctedMarkup.includes('expectedPriority'));
assert.ok(!correctedMarkup.includes('instructorTruth'));
const followupState = actions.append(emptyState, 'incident_link', '2026-09-27T10:55:00.000Z', {
  findingId: 'M08-FINDING-001', incidentId: 'M08-INCIDENT-001', evidenceIds: ['M08-INC-EVID-001'],
  rationale: 'Incident evidence tracks review of this public service finding.',
}, fixture);
const linkedMarkup = ui.render(fixture, stateApi.normalize(JSON.parse(JSON.stringify(followupState)), fixture), 'M08-FINDING-001');
assert.ok(linkedMarkup.includes('Already linked'));
assert.ok(linkedMarkup.includes('Incident evidence tracks review'));
html = ui.render(fixture, { findingReviews: [{ findingId: 'M08-FINDING-002', status: 'needs-validation',
  evidenceIds: ['M08-EVID-004'], notes: 'Check current package state.' }] }, 'M08-FINDING-002');
assert.ok(html.includes('aria-current="true"'));
assert.ok(html.includes('selected>Needs validation'));
assert.ok(html.includes('checked> scanner-observation'));
assert.ok(html.includes('Check current package state.'));
const persisted = actions.append(stateApi.normalize({}, fixture), 'finding_review',
  '2026-09-27T10:55:00.000Z', { findingId: 'M08-FINDING-002', status: 'needs-validation',
    evidenceIds: ['M08-EVID-004'], notes: 'Check current package state.' }, fixture);
assert.ok(ui.render(fixture, stateApi.normalize(JSON.parse(JSON.stringify(persisted)), fixture),
  'M08-FINDING-002').includes('Needs validation'));

const hostileFixture = JSON.parse(JSON.stringify(fixture));
hostileFixture.scenario.findings[0].product = '<img src=x onerror=alert(1)>';
hostileFixture.scenario.findingEvidence[0].detail = '<script>alert(1)</script>';
hostileFixture.scenario.assetInventory[0].criticality.rationale = '<svg onload=alert(1)>';
hostileFixture.scenario.assetInventory[0].compensatingControls[0].control = '<script>control</script>';
hostileFixture.scenario.assetEvidence[0].detail = '<iframe src=x></iframe>';
html = ui.render(hostileFixture, emptyState);
assert.ok(!html.includes('<img'));
assert.ok(!html.includes('<script>'));
assert.ok(!html.includes('<svg'));
assert.ok(!html.includes('<iframe'));
assert.ok(!html.includes('<script>control</script>'));
assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
assert.ok(html.includes('&lt;svg onload=alert(1)&gt;'));
assert.ok(html.includes('&lt;iframe src=x&gt;&lt;/iframe&gt;'));
assert.ok(html.includes('&lt;script&gt;control&lt;/script&gt;'));
html = ui.render(fixture, emptyState, '', { search: '<img src=x onerror=alert(1)>' });
assert.ok(!html.includes('<img src=x'));
assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));

console.log('M08 assessment findings UI: all checks passed');

#!/usr/bin/env node
// Scores M11 states built only through the state transitions the UI uses.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = { console };
vm.createContext(context);
for (const file of ['soc-assessment-scorer.js', 'soc-m11-assessment-data.js', 'soc-m11-assessment-state.js', 'soc-m11-assessment-rubric.js', 'soc-m11-assessment-scorer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const fixture = vm.runInContext('SocM11AssessmentData', context);
const api = vm.runInContext('SocM11AssessmentState', context);
const scorer = vm.runInContext('SocM11AssessmentScorer', context);
const points = (result) => Object.fromEntries(result.criteria.map((criterion) => [criterion.id, criterion.points]));

const empty = scorer.score(api.normalize({}, fixture), fixture);
assert.strictEqual(empty.score, 0, 'no shift work earns no credit');
assert.strictEqual(scorer.CRITERIA.reduce((sum, criterion) => sum + criterion.weight, 0), 100);
assert.strictEqual(scorer.CRITERIA_V1.reduce((sum, criterion) => sum + criterion.weight, 0), 100, 'the v1 rubric still totals 100');
assert.strictEqual(scorer.PASSING_SCORE, 70, 'the passing bar is unchanged');

function fullPath(overrides = {}) {
  let state = api.normalize({}, fixture);
  state = api.setPriority(state, fixture, ['Q-03', 'Q-02', 'Q-04', 'Q-09', 'Q-08']);
  // Rubric v2: a supported call, with reasoning, on every alert whose evidence decides it (Q-13 is still incomplete).
  state = api.recordDisposition(state, fixture, 'Q-02', 'true_positive', 'Password spray against the VPN gateway from the high-severity rule with no approved change.');
  state = api.recordDisposition(state, fixture, 'Q-03', 'true_positive', 'Office macro spawned PowerShell on ws-219 and the rule is not part of the noisy set.');
  state = api.recordDisposition(state, fixture, 'Q-04', 'benign_positive', 'Impossible travel on acct-311 fits the corporate travel VPN exit nodes added in CHG-2215.');
  state = api.recordDisposition(state, fixture, 'Q-08', 'false_positive', 'R-04 alert after the CHG-2212 threshold widening; earlier dispositions on this rule were all non-true-positive.');
  state = api.recordDisposition(state, fixture, 'Q-09', 'false_positive', 'Same R-04 pattern for ws-163, an old low-severity alert on a rule that is mostly noise.');
  state = api.recordDisposition(state, fixture, 'Q-13', 'needs_investigation', 'The endpoint sensor collector was lagging when this alert fired, so the command line and child-process records are missing; re-check once the backlog drains.');
  state = api.assign(state, fixture, 'Q-03', 'an-chen');
  state = api.assign(state, fixture, 'Q-02', 'an-patel');
  state = api.escalate(state, fixture, 'Q-03', 'ir-lead-owners', 'Critical macro execution on ws-219 needs incident lead review.');
  state = api.recordMetricInterpretation(state, fixture, overrides.interpretation || 'Backlog is 7 with two SLA breaches; MTTA is about 17 minutes. The DNS rule produced only non-true-positive dispositions this shift.');
  state = api.flagNoisyRule(state, fixture, 'R-04', 'All dispositioned alerts from this rule were false or benign positives.', 'Suppress domains older than 30 days and add an allowlist for CDN providers.');
  state = api.handoff(state, fixture, { summary: 'Evening lead: INC-4937 stays open in recovery; two at-risk alerts are assigned and two breached low alerts remain.', openItems: ['Q-01', 'Q-02', 'Q-03', 'Q-04', 'Q-09'], risks: ['fs-02 service validation pending', 'acct-173 credential reset unconfirmed'], nextActions: ['Chase fs-02 validation with the service owner'] });
  state = api.report(state, fixture, 'technical', { summary: 'INC-4937: ransomware executed on ws-173; a remote session for acct-173 overlapped. ws-173 was isolated, restored from a verified point and scanned clean.', confirmedScope: 'ws-173 and acct-173; fs-02 service disruption observed', unknowns: 'Exfiltration not established; fs-02 integrity not yet validated' });
  state = api.report(state, fixture, 'executive', { summary: 'One workstation was affected by ransomware and has been restored. A file-share service check and a password-reset confirmation are still outstanding, so the incident stays open.', businessImpact: 'Brief loss of one shared drive; no confirmed data loss.' });
  state = api.report(state, fixture, 'closure', { summary: overrides.closureSummary || 'Recovery review for INC-4937 before any closure decision.', containmentStatus: 'ws-173 isolated and restored; remote session revoked', recoveryStatus: 'ws-173 monitoring passed', residualRisk: overrides.residualRisk || 'fs-02 service validation pending; acct-173 credential reset not yet confirmed' });
  state = api.improvementAction(state, fixture, { title: 'Validate fs-02 file-share service', ownerId: 'fs02-service-owner', dueDate: '2026-09-28', kind: 'follow_up', evidenceId: 'M11-REC-04' });
  state = api.improvementAction(state, fixture, { title: 'Confirm acct-173 credential reset', ownerId: 'identity-owners', dueDate: '2026-09-28', kind: 'follow_up', evidenceId: 'M11-REC-05' });
  state = api.improvementAction(state, fixture, { title: 'Earlier approval path for isolation', ownerId: 'ir-lead-owners', dueDate: '2026-10-02', kind: 'lesson' });
  state = api.improvementAction(state, fixture, { title: 'Tune R-04 newly registered domain rule', ownerId: 'detection-engineering', dueDate: '2026-10-02', kind: 'detection' });
  state = api.closureDecision(state, fixture, { decision: overrides.decision || 'retain', rationale: 'Retain: fs-02 validation and the credential reset confirmation are still pending.', evidenceIds: ['M11-REC-04', 'M11-REC-05'] });
  return state;
}

const full = scorer.score(fullPath(), fixture);
assert.strictEqual(full.score, 100, `a complete, accurate shift earns full credit: ${JSON.stringify(points(full))}`);
assert.strictEqual(full.passed, true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(scorer.score(fullPath(), fixture))), JSON.parse(JSON.stringify(full)), 'deterministic re-score');
assert.ok(!JSON.stringify(full).includes('queuePriority') && !JSON.stringify(full).includes('acceptableAssignees'), 'review payload does not expose truth');

const causal = scorer.score(fullPath({ interpretation: 'Volume rose after 11:00 because of the new DNS rule, which caused the SLA breaches.' }), fixture);
assert.strictEqual(points(causal)['metrics-interpretation'], 0, 'a causal claim about the trend loses the metrics criterion');

const closed = scorer.score(fullPath({ decision: 'close' }), fixture);
assert.strictEqual(points(closed)['closure-decision'], 0);
assert.strictEqual(closed.score, 69, 'closing with open residual risk is capped');
assert.strictEqual(closed.passed, false);
assert.strictEqual(closed.criticalMisses.length, 1);

const overclaim = scorer.score(fullPath({ residualRisk: 'Fully recovered; no residual risk.' }), fixture);
assert.strictEqual(points(overclaim)['residual-risk'], 0, 'claiming full recovery loses residual-risk accuracy');

let partial = api.normalize({}, fixture);
partial = api.setPriority(partial, fixture, ['Q-03', 'Q-04']);
partial = api.assign(partial, fixture, 'Q-03', 'an-chen');
const partialScore = scorer.score(partial, fixture);
assert.strictEqual(points(partialScore)['queue-prioritization'], 4, 'correct top item only earns half');
assert.ok(partialScore.score > 0 && partialScore.score < 50);

let noisyFirst = api.setPriority(api.normalize({}, fixture), fixture, ['Q-09', 'Q-03']);
assert.strictEqual(points(scorer.score(noisyFirst, fixture))['queue-prioritization'], 0, 'putting a low-impact noise alert first earns nothing');
console.log('M11 assessment scorer: all checks passed');

#!/usr/bin/env node
// Module 11 Prove It: per-alert dispositions including needs_investigation (Sprint 3, gap D).
// Covers the lab/assessment standard's required scenarios for the new alert-disposition competency, the Q-13
// fixture item, backward compatibility (rubric v1 attempts, old saved state, jsonb key reorder) and the
// instructor review card.
//   node tests/soc-m11-alert-dispositions.test.js   (exit 0 = all pass)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const PORTAL = path.join(__dirname, '..', 'portal');
const read = (f) => fs.readFileSync(path.join(PORTAL, f), 'utf8');

const saved = []; let stored = null;
const context = { console, esc: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  LabRuntime: { loadCaseState: () => stored, saveCaseState: (key, mod, user, state) => { saved.push(state); return state; } } };
vm.createContext(context);
for (const f of ['soc-assessment-scorer.js', 'soc-m11-assessment-data.js', 'soc-m11-assessment-state.js', 'soc-m11-assessment-rubric.js', 'soc-m11-assessment-metrics.js', 'soc-m11-assessment-scorer.js']) {
  vm.runInContext(read(f), context, { filename: f });
}
const fixture = vm.runInContext('SocM11AssessmentData', context);
const api = vm.runInContext('SocM11AssessmentState', context);
const scorer = vm.runInContext('SocM11AssessmentScorer', context);
const rubric = vm.runInContext('SocM11AssessmentRubric', context);
const plain = (v) => JSON.parse(JSON.stringify(v));
const points = (result) => Object.fromEntries(result.criteria.map((c) => [c.id, c.points]));
const crit = (result, id) => result.criteria.find((c) => c.id === id);

let failures = 0;
const t = (name, fn) => { try { fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e.message}`); } };

const REASON = {
  Q02: 'Password spray against the VPN gateway, high severity, nothing approves it.',
  Q03: 'Office macro spawned PowerShell on ws-219; the rule is not part of the noisy set.',
  Q04: 'Impossible travel fits the travel VPN exit nodes added by CHG-2215.',
  Q08: 'R-04 alert after the CHG-2212 widening; every earlier R-04 call was non-true-positive.',
  Q09: 'Same R-04 pattern on ws-163, an old low-severity alert.',
  NI: 'The endpoint sensor collector was lagging when Q-13 fired, so the command line and child process records are missing; I will re-check after the backlog drains.',
};
const CORRECT = [['Q-02', 'true_positive', REASON.Q02], ['Q-03', 'true_positive', REASON.Q03], ['Q-04', 'benign_positive', REASON.Q04],
  ['Q-08', 'false_positive', REASON.Q08], ['Q-09', 'false_positive', REASON.Q09], ['Q-13', 'needs_investigation', REASON.NI]];
const withDispositions = (calls, base = api.normalize({}, fixture)) => calls.reduce((state, [id, d, reason]) => api.recordDisposition(state, fixture, id, d, reason), base);
const dispoPoints = (calls) => crit(scorer.score(withDispositions(calls), fixture), 'alert-disposition').points;

// A complete rest-of-shift (everything except dispositions) so the whole-score tests are meaningful.
function restOfShift(state = api.normalize({}, fixture)) {
  state = api.setPriority(state, fixture, ['Q-03', 'Q-02', 'Q-04', 'Q-09', 'Q-08']);
  state = api.assign(state, fixture, 'Q-03', 'an-chen');
  state = api.assign(state, fixture, 'Q-02', 'an-patel');
  state = api.escalate(state, fixture, 'Q-03', 'ir-lead-owners', 'Critical macro execution on ws-219 needs incident lead review.');
  state = api.recordMetricInterpretation(state, fixture, 'Backlog is 8 with two SLA breaches; MTTA is about 17 minutes. The DNS rule produced only non-true-positive dispositions this shift.');
  state = api.flagNoisyRule(state, fixture, 'R-04', 'All dispositioned alerts from this rule were false or benign positives.', 'Suppress domains older than 30 days and add an allowlist for CDN providers.');
  state = api.handoff(state, fixture, { summary: 'Evening lead: INC-4937 stays open in recovery; two at-risk alerts are assigned and two breached low alerts remain.', openItems: ['Q-01', 'Q-02', 'Q-03', 'Q-04', 'Q-09'], risks: ['fs-02 service validation pending'], nextActions: ['Confirm the credential reset'] });
  state = api.report(state, fixture, 'technical', { summary: 'INC-4937: ransomware executed on ws-173; a remote session for acct-173 overlapped. ws-173 was isolated, restored from a verified point and scanned clean.', confirmedScope: 'ws-173 and acct-173; fs-02 service is disrupted', unknowns: 'Whether any wider access occurred is not established.' });
  state = api.report(state, fixture, 'executive', { summary: 'One workstation was affected by ransomware and has been restored. A file-share service check and a password-reset confirmation are still outstanding, so the incident stays open.', businessImpact: 'Brief loss of one workstation and a file-share service.' });
  state = api.report(state, fixture, 'closure', { summary: 'Recovery review for INC-4937 before any closure decision.', containmentStatus: 'ws-173 isolated and restored; remote session revoked', recoveryStatus: 'ws-173 monitoring passed; fs-02 validation and the credential reset confirmation are pending', residualRisk: 'fs-02 service validation and the acct-173 credential reset are still pending.' });
  state = api.improvementAction(state, fixture, { title: 'Validate fs-02 file-share service', ownerId: 'fs02-service-owner', dueDate: '2026-09-28', kind: 'follow_up', evidenceId: 'M11-REC-04' });
  state = api.improvementAction(state, fixture, { title: 'Confirm acct-173 credential reset', ownerId: 'identity-owners', dueDate: '2026-09-28', kind: 'follow_up', evidenceId: 'M11-REC-05' });
  state = api.improvementAction(state, fixture, { title: 'Earlier approval path for isolation', ownerId: 'ir-lead-owners', dueDate: '2026-10-02', kind: 'lesson' });
  state = api.improvementAction(state, fixture, { title: 'Tune R-04 newly registered domain rule', ownerId: 'detection-engineering', dueDate: '2026-10-02', kind: 'detection' });
  return api.closureDecision(state, fixture, { decision: 'retain', rationale: 'Retain: fs-02 validation and the credential reset confirmation are still pending.', evidenceIds: ['M11-REC-04', 'M11-REC-05'] });
}

console.log('Fixture: Q-13');
t('Q-13 is a consistent queue item inside the endpoint collector lag window', () => {
  const q = fixture.scenario.queue.find((x) => x.id === 'Q-13');
  assert.ok(q && q.kind === 'alert' && q.host === 'ws-231' && q.ruleId === 'R-03' && q.slaMinutes === 30);
  assert.ok(fixture.scenario.rules.some((r) => r.id === q.ruleId));
  assert.ok(fixture.scenario.analysts.some((a) => a.id === q.assigneeId));
  assert.strictEqual(q.recordedDisposition, null, 'open items carry no recorded verdict');
  const lag = fixture.scenario.operations.collectors.find((c) => c.host === 'edr-collector-01' && c.status === 'Lagging');
  assert.strictEqual(lag.time, '2026-09-27T10:00:00Z');
  const recovering = fixture.scenario.operations.supplemental.heartbeats.find((c) => c.host === 'edr-collector-01' && c.status === 'Recovering');
  assert.ok(q.createdAt > lag.time && q.createdAt < recovering.time, 'created while the endpoint collector was lagging');
  assert.match(q.evidenceNote, /partial endpoint record/);
});
t('the answer key and SLA story are intact', () => {
  const truth = fixture.expectedTruth;
  assert.strictEqual(truth.dispositions['Q-13'], 'needs_investigation');
  assert.deepStrictEqual(plain(truth.slaBreaches), ['Q-04', 'Q-09']); assert.deepStrictEqual(plain(truth.slaAtRisk), ['Q-02', 'Q-03']);
  const metrics = plain(vm.runInContext('SocM11AssessmentMetrics', context).compute(fixture, {}));
  const sla = Object.fromEntries(metrics.sla.map((e) => [e.id, e.status]));
  assert.strictEqual(sla['Q-13'], 'met');
  assert.deepStrictEqual(metrics.distribution, { true_positive: 2, benign_positive: 1, false_positive: 2 });
});
t('credit units sum to the criterion weight', () => {
  const units = Object.keys(fixture.expectedTruth.dispositions).reduce((n, id) => n + (fixture.expectedTruth.dispositionCredit[id] || 1), 0);
  assert.strictEqual(units, scorer.CRITERIA.find((c) => c.id === 'alert-disposition').weight);
});
t('state rejects bad input but never reveals correctness', () => {
  const s0 = api.normalize({}, fixture);
  assert.throws(() => api.recordDisposition(s0, fixture, 'Q-05', 'true_positive', REASON.Q02), /unknown id/, 'closed items cannot be dispositioned');
  assert.throws(() => api.recordDisposition(s0, fixture, 'Q-13', 'maybe', REASON.NI), /disposition must be/);
  assert.throws(() => api.recordDisposition(s0, fixture, 'Q-13', 'needs_investigation', 'short'), /reasoning/);
  const wrong = api.recordDisposition(s0, fixture, 'Q-13', 'true_positive', REASON.Q03);
  assert.deepStrictEqual(plain(wrong.dispositions['Q-13']), { disposition: 'true_positive', reason: REASON.Q03 });
  assert.ok(!JSON.stringify(wrong).match(/correct|supported|expected/i), 'saved state carries no correctness signal');
});

console.log('Scoring scenarios (required by the standard)');
t('perfect: every supported call earns the full competency and the shift totals 100', () => {
  const result = scorer.score(withDispositions(CORRECT, restOfShift()), fixture);
  assert.strictEqual(crit(result, 'alert-disposition').points, 8);
  assert.strictEqual(result.score, 100, JSON.stringify(points(result)));
  assert.strictEqual(result.rubricVersion, 2); assert.ok(result.passed);
});
t('partial: the five decidable calls without Q-13 keep meaningful credit', () => {
  assert.strictEqual(dispoPoints(CORRECT.slice(0, 5)), 5);
  assert.strictEqual(dispoPoints([CORRECT[5]]), 3, 'Q-13 alone is worth three of eight');
  assert.strictEqual(dispoPoints(CORRECT.slice(0, 2)), 2);
});
t('different valid path: recording order, revisions and a corrected first attempt give equal credit', () => {
  const reversed = CORRECT.slice().reverse();
  assert.strictEqual(dispoPoints(reversed), dispoPoints(CORRECT));
  const revised = [['Q-13', 'true_positive', REASON.Q03], ...CORRECT]; // wrong first, corrected later: the final call counts
  assert.strictEqual(dispoPoints(revised), 8);
  const flipped = [...CORRECT, ['Q-13', 'false_positive', REASON.Q09]]; // correct first, then changed: the final call counts
  assert.ok(dispoPoints(flipped) < 8);
});
t('excessive exploration: extra dispositions on other items and deferrals on decidable items cost nothing', () => {
  const extra = [...CORRECT, ['Q-01', 'true_positive', 'Ransomware recovery incident is real.'], ['Q-12', 'needs_investigation', 'Inbox rule still under review pending the owner.']];
  assert.strictEqual(dispoPoints(extra), 8, 'dispositions on non-expected items are ignored');
  const base = dispoPoints(CORRECT.filter(([id]) => id !== 'Q-04'));
  const deferred = dispoPoints([...CORRECT.filter(([id]) => id !== 'Q-04'), ['Q-04', 'needs_investigation', 'Waiting on the travel desk to confirm the VPN exit nodes.']]);
  assert.strictEqual(deferred, base, 'needs-investigation on a decidable item earns nothing but is never penalised');
});
t('unsupported conclusion: an explicit wrong verdict costs credit, most on the incomplete item', () => {
  const noQ13 = dispoPoints(CORRECT.slice(0, 5));
  const deferredQ13 = dispoPoints([...CORRECT.slice(0, 5), ['Q-13', 'needs_investigation', 'Not sure yet.']]);
  const wrongQ13 = dispoPoints([...CORRECT.slice(0, 5), ['Q-13', 'true_positive', REASON.Q03]]);
  assert.ok(deferredQ13 >= noQ13, 'a vague deferral is not worse than silence');
  assert.ok(wrongQ13 < noQ13, 'asserting a verdict on an item whose evidence is incomplete costs credit');
  assert.strictEqual(wrongQ13, 3, '5 earned minus a 2-point deduction');
  const result = scorer.score(withDispositions([...CORRECT.slice(0, 5), ['Q-13', 'benign_positive', REASON.Q04]]), fixture);
  assert.ok(crit(result, 'alert-disposition').deductions.some((d) => /Q-13/.test(d.reason) && /incomplete/.test(d.reason)));
  const wrongOther = dispoPoints([...CORRECT.filter(([id]) => id !== 'Q-04'), ['Q-04', 'true_positive', REASON.Q02]]);
  assert.strictEqual(wrongOther, 7 - 1, 'a wrong verdict on a decidable item loses its credit and one more point');
  assert.strictEqual(dispoPoints([['Q-13', 'true_positive', REASON.Q03]]), 0, 'credit never goes below zero');
});
t('strong technical calls with thin documentation keep their technical credit', () => {
  const thin = CORRECT.map(([id, d]) => [id, d, 'Matches the pattern.' + ' '.repeat(0)]);
  assert.strictEqual(dispoPoints(thin.slice(0, 5)), 5, 'correct decidable calls are credited whatever the prose quality');
  assert.strictEqual(dispoPoints(thin), 6, 'a needs-investigation call that never names the missing evidence earns only partial credit (1 of 3)');
  const result = scorer.score(withDispositions(thin), fixture);
  assert.ok(crit(result, 'alert-disposition').misses.some((m) => /Q-13: state which evidence is missing/.test(m)));
});
t('weak analysis with polished writing earns communication credit only', () => {
  const polished = 'After careful review of all available telemetry, the pattern is clearly consistent with a fully established attacker campaign with high confidence.';
  const wrong = [['Q-02', 'false_positive', polished], ['Q-03', 'benign_positive', polished], ['Q-04', 'true_positive', polished], ['Q-08', 'true_positive', polished], ['Q-09', 'true_positive', polished], ['Q-13', 'true_positive', polished]];
  const result = scorer.score(withDispositions(wrong, restOfShift()), fixture);
  assert.strictEqual(crit(result, 'alert-disposition').points, 0);
  assert.ok(result.score >= 90 && result.score < 100, 'the rest of the shift keeps its credit');
});
t('a needs-investigation reason must name missing evidence by word, not by substring', () => {
  assert.strictEqual(dispoPoints([['Q-13', 'needs_investigation', 'I would flag this for the team to look at later.']]), 1, '"flag" is not "lag"');
  assert.strictEqual(dispoPoints([['Q-13', 'needs_investigation', 'The sensor feed is incomplete, so I will re-check it.']]), 3);
});
t('unrecorded dispositions score zero and report each miss; the criterion is unknown not wrong', () => {
  const result = scorer.score(restOfShift(), fixture);
  assert.strictEqual(crit(result, 'alert-disposition').points, 0);
  assert.strictEqual(crit(result, 'alert-disposition').misses.length, 6);
  assert.strictEqual(result.score, 92);
  assert.ok(result.passed, 'omitting the new competency still leaves a passing shift');
  assert.strictEqual(plain(rubric.extract(restOfShift(), fixture)).criteria.find((c) => c.id === 'alert-disposition').finding, 'unknown');
});

console.log('Backward compatibility');
t('rubric v1 still reproduces the original twelve criteria and a 100-point shift without dispositions', () => {
  const v1 = scorer.score(restOfShift(), fixture, { rubricVersion: 1 });
  assert.strictEqual(v1.rubricVersion, 1); assert.strictEqual(v1.score, 100);
  assert.ok(!v1.criteria.some((c) => c.id === 'alert-disposition'));
  assert.strictEqual(v1.criteria.length, 12);
});
t('an attempt submitted before this change keeps its stored score and shape (review reads the stored result)', () => {
  // The submit path stores { ...scored, action_history } in the attempt; nothing re-scores it afterwards.
  const src = read('soc-analyst-module-11.js');
  assert.ok(src.includes('result: { ...scored, action_history: moduleElevenOpsState.actionHistory }'));
  assert.strictEqual((src.match(/SocM11AssessmentScorer\.score\(/g) || []).length, 1, 'scoring happens only at submit');
});
t('old saved state (no dispositions key) loads cleanly and replays', () => {
  const old = plain(restOfShift()); delete old.dispositions;
  const n = plain(api.normalize(old, fixture));
  assert.deepStrictEqual(n.dispositions, {}); assert.strictEqual(n.actionHistory.length, old.actionHistory.length);
});
t('dispositions survive a Postgres-jsonb style key reorder through normalize() and score identically', () => {
  const state = plain(withDispositions(CORRECT, restOfShift()));
  const reorder = (v) => (Array.isArray(v) ? v.map(reorder) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort((a, b) => b.length - a.length || (a < b ? 1 : -1)).map((k) => [k, reorder(v[k])])) : v);
  const shuffled = reorder(state);
  assert.notStrictEqual(JSON.stringify(shuffled), JSON.stringify(state), 'the fixture really reorders keys');
  const n = plain(api.normalize(shuffled, fixture));
  assert.deepStrictEqual(n.dispositions, plain(state.dispositions));
  assert.strictEqual(scorer.score(api.normalize(shuffled, fixture), fixture).score, 100);
  assert.strictEqual(n.actionHistory.filter((a) => a.type === 'disposition').length, 6);
});
t('load() does not rewrite saved state that differs only by key order', () => {
  const state = plain(withDispositions(CORRECT));
  const reordered = Object.fromEntries(Object.entries(state).reverse());
  saved.length = 0; stored = reordered;
  api.load({ email: 'x@example.test' }, fixture);
  assert.strictEqual(saved.length, 0, 'structurally equal state is not re-saved');
  stored = { actionHistory: [] };
  api.load({ email: 'x@example.test' }, fixture);
  assert.strictEqual(saved.length, 1, 'genuinely different state is normalized and saved');
});

console.log('Prove It surface and instructor review');
const sliceFn = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to));
t('the Operations tab offers the four dispositions with learner labels and no answer cues', () => {
  const src = read('soc-analyst-module-11.js');
  vm.runInContext(sliceFn(src, 'function moduleElevenOpsHtml(', 'function moduleElevenReportingHtml('), context);
  context.fx = fixture; context.st = api.normalize({}, fixture);
  const html = vm.runInContext('moduleElevenOpsHtml(fx, st)', context);
  const form = html.slice(html.indexOf('data-m11-operation="disposition"'), html.indexOf('data-m11-operation="assign"'));
  ['True positive', 'Benign positive', 'False positive', 'Needs investigation'].forEach((label) => assert.ok(form.includes(label), label));
  ['true_positive', 'benign_positive', 'false_positive', 'needs_investigation'].forEach((v) => assert.ok(form.includes(`value="${v}"`), v));
  assert.ok(!/selected|hint|correct|supported|recommended|not yet arrived|has not arrived/i.test(form), 'no answer-revealing cue');
  assert.ok(form.includes('Q-13'), 'open items are listed');
  assert.ok(!form.includes('Q-05 ·'), 'closed items are not offered');
  const after = vm.runInContext('moduleElevenOpsHtml(fx, st2)', Object.assign(context, { st2: withDispositions([CORRECT[5]]) }));
  assert.ok(/Q-13<\/strong> · Needs investigation: The endpoint sensor collector/.test(after), 'the learner sees only their own entries');
});
t('the review card renders each disposition readably with the full reasoning, and old attempts still render', () => {
  const src = read('app.js');
  const from = src.indexOf('function adminAttemptReviewCard(');
  const card = src.slice(from, src.indexOf('\n}\n', from) + 3);
  const rctx = { esc: context.esc, adminAttemptLabel: () => 'Attempt 1', adminCaseTicketSubmissionPanel: () => '', adminCapstoneReviewPanel: () => '', adminModuleTwoAccessReviewPanel: () => '' };
  vm.createContext(rctx);
  vm.runInContext(card, rctx);
  const state = withDispositions(CORRECT, restOfShift());
  const scored = plain(scorer.score(state, fixture));
  const html = vm.runInContext(`adminAttemptReviewCard(${JSON.stringify({ lead: { id: 'a1', student_id: 's1', score: scored.score, result: { ...scored, action_history: plain(state.actionHistory) }, completed_at: '2026-09-27T12:00:00Z', attempt: 1 }, ids: ['a1'], name: 'Lab', labTitles: ['M11'] })}, false)`, rctx);
  assert.ok(html.includes('Alert disposition'), 'action row is titled');
  assert.ok(/Q-13: Needs investigation[\s\S]{0,40}The endpoint sensor collector was lagging when Q-13 fired/.test(html), 'label plus full reasoning');
  assert.ok(/Q-02: True positive/.test(html) && /Q-08: False positive/.test(html));
  assert.ok(html.includes('Alert dispositions') && /8 \/ 8/.test(html), 'rubric row shows earned/available');
  assert.ok(!html.includes('disposition: needs_investigation'), 'no key/value dump');
  // A pre-change attempt (v1 result, no disposition actions) renders without error.
  const v1 = plain(scorer.score(restOfShift(), fixture, { rubricVersion: 1 }));
  const old = vm.runInContext(`adminAttemptReviewCard(${JSON.stringify({ lead: { id: 'a0', student_id: 's1', score: 100, result: { ...v1, action_history: plain(restOfShift().actionHistory) }, completed_at: '2026-09-27T12:00:00Z', attempt: 1 }, ids: ['a0'], name: 'Lab', labTitles: ['M11'] })}, false)`, rctx);
  assert.ok(old.includes('System rubric') && !old.includes('Alert disposition'));
});
t('scorer output explains awards, deductions and misses without exposing the answer key', () => {
  const result = plain(scorer.score(withDispositions([...CORRECT.slice(0, 3), ['Q-13', 'true_positive', REASON.Q03]]), fixture));
  const c = crit(result, 'alert-disposition');
  assert.ok(c.awards.length === 3 && c.deductions.length === 1 && c.misses.length >= 2 && c.supportingEvidence.includes('Q-02'));
  assert.ok(!JSON.stringify(result).includes('missingDataTerms') && !JSON.stringify(result).includes('dispositionCredit'));
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);

/* Module 11 Prove It (lab-exec-report, OPS-5511) synthetic attempts for
 * tests/admin-submission-sheet.test.js. The action log is built with the
 * module's own SocM11AssessmentState transitions and scored with
 * SocM11AssessmentScorer, so the stored criteria are what the live submit
 * saves (result = scorer output + action_history). */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');

module.exports = ({ run, clone }) => {
  const load = (name, file) => { if (run(`typeof ${name}`) === 'undefined') run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); };
  load('SocAssessmentScorer', 'soc-assessment-scorer.js');
  load('SocM11AssessmentData', 'soc-m11-assessment-data.js');
  load('SocM11AssessmentState', 'soc-m11-assessment-state.js');
  load('SocM11AssessmentRubric', 'soc-m11-assessment-rubric.js');
  load('SocM11AssessmentScorer', 'soc-m11-assessment-scorer.js');

  const fx = run('SocM11AssessmentData');
  const S = run('SocM11AssessmentState');
  const Scorer = run('SocM11AssessmentScorer');
  const t = (hm) => `2026-09-27T${hm}:00Z`;

  function perfectState() {
    let s = S.normalize({}, fx);
    s = S.setPriority(s, fx, ['Q-03', 'Q-02', 'Q-04', 'Q-09', 'Q-13'], t('11:40'));
    s = S.recordDisposition(s, fx, 'Q-02', 'true_positive', 'Repeated failures then a success against the VPN gateway.', t('11:41'));
    s = S.recordDisposition(s, fx, 'Q-03', 'true_positive', 'An Office macro spawned PowerShell, which is malicious.', t('11:42'));
    s = S.recordDisposition(s, fx, 'Q-04', 'benign_positive', 'The travel matches an approved VPN session.', t('11:43'));
    s = S.recordDisposition(s, fx, 'Q-08', 'false_positive', 'A known updater domain, not an attack.', t('11:44'));
    s = S.recordDisposition(s, fx, 'Q-09', 'false_positive', 'Another updater lookup, same pattern as Q-08.', t('11:45'));
    s = S.recordDisposition(s, fx, 'Q-13', 'needs_investigation', 'The endpoint record is incomplete because of the collector lag; re-check once the command line arrives.', t('11:46'));
    s = S.assign(s, fx, 'Q-02', 'an-chen', t('11:47'));
    s = S.assign(s, fx, 'Q-03', 'an-patel', t('11:48'));
    s = S.escalate(s, fx, 'Q-03', 'ir-lead-owners', 'Critical macro execution needs the incident lead and endpoint owners.', t('11:49'));
    s = S.recordMetricInterpretation(s, fx, 'Alert volume and backlog are high with SLA attainment down; the repeated R-04 false positives add noise. Check staffing and the rule threshold next.', t('11:50'));
    s = S.flagNoisyRule(s, fx, 'R-04', 'Every recent R-04 alert was closed as false or benign positive.', 'Allow-list the known updater domains and raise the age threshold, then re-test.', t('11:51'));
    s = S.handoff(s, fx, { summary: 'Ransomware recovery on ws-173 continues; Q-02 and Q-03 are assigned and at risk of missing their deadlines.', openItems: ['Q-01', 'Q-02', 'Q-03', 'Q-04', 'Q-09'], risks: ['fs-02 not validated'], nextActions: ['Confirm the acct-173 credential reset'] }, t('11:52'));
    s = S.report(s, fx, 'technical', { summary: 'ws-173 was hit by ransomware with an overlapping remote session for acct-173. The host was isolated, the session revoked and the machine restored from a clean recovery point.', confirmedScope: 'ws-173 and acct-173 are confirmed; fs-02 is being validated.', unknowns: 'Whether fs-02 was touched is not yet confirmed.' }, t('11:53'));
    s = S.report(s, fx, 'executive', { summary: 'A ransomware incident on one workstation was contained and the machine restored. Two checks remain before we call it closed.', businessImpact: 'One user was without a workstation for part of the morning; no data loss is known.' }, t('11:54'));
    s = S.report(s, fx, 'escalation', { summary: 'Please review Q-03, a critical macro execution on ws-219.' }, t('11:55'));
    s = S.report(s, fx, 'closure', { summary: 'The ws-173 incident is contained and recovered, with two items still open.', containmentStatus: 'ws-173 isolated and the acct-173 session revoked.', recoveryStatus: 'ws-173 restored and scanned clean.', residualRisk: 'fs-02 file share validation and the acct-173 credential reset confirmation are still pending.' }, t('11:56'));
    s = S.improvementAction(s, fx, { kind: 'follow_up', title: 'Validate the fs-02 file share service', ownerId: 'fs02-service-owner', dueDate: '2026-10-03', evidenceId: 'M11-REC-04' }, t('11:57'));
    s = S.improvementAction(s, fx, { kind: 'follow_up', title: 'Confirm acct-173 credential reset', ownerId: 'identity-owners', dueDate: '2026-10-03', evidenceId: 'M11-REC-05' }, t('11:57'));
    s = S.improvementAction(s, fx, { kind: 'lesson', title: 'Lesson: R-04 noise hides real alerts', ownerId: 'detection-engineering', dueDate: '2026-10-02' }, t('11:58'));
    s = S.improvementAction(s, fx, { kind: 'detection', title: 'Tune R-04 with an allow-list', ownerId: 'detection-engineering', dueDate: '2026-10-02' }, t('11:58'));
    s = S.closureDecision(s, fx, { decision: 'retain', rationale: 'Keep it open until fs-02 validation and the credential reset are confirmed.', evidenceIds: ['M11-REC-04', 'M11-REC-05'] }, t('11:59'));
    return s;
  }
  const attempt = (id, state, options = {}) => {
    const scored = Scorer.score(state, fx, options);
    return {
      id, lab_key: 'lab-exec-report', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: scored.score, pass_threshold: 70,
      completed_at: '2026-10-17T12:00:00.000Z', attempt: { number: 1, of: 1 },
      result: { ...clone(scored), action_history: clone(state.actionHistory) },
    };
  };

  const perfect = attempt('m11-pass', perfectState());

  // Wrong: priority led by a noisy alert, wrong dispositions, closed the incident, over-claimed recovery.
  let wrong = S.normalize({}, fx);
  wrong = S.setPriority(wrong, fx, ['Q-09', 'Q-08'], t('11:40'));
  wrong = S.recordDisposition(wrong, fx, 'Q-02', 'false_positive', 'Looks like normal VPN sign-in noise.', t('11:41'));
  wrong = S.recordDisposition(wrong, fx, 'Q-13', 'true_positive', 'This is clearly malicious activity.', t('11:42'));
  wrong = S.recordMetricInterpretation(wrong, fx, 'Alert volume was high and the slow analysts caused the backlog.', t('11:43'));
  wrong = S.report(wrong, fx, 'closure', { summary: '<script>alert(1)</script> incident is fully recovered, no residual risk remains.', residualRisk: 'no residual risk' }, t('11:44'));
  wrong = S.closureDecision(wrong, fx, { decision: 'close', rationale: 'Everything is recovered so close it.', evidenceIds: [] }, t('11:45'));
  const wrongRow = attempt('m11-fail', wrong);

  // Partial: right priority first only, one disposition right, handoff but no reports.
  let partial = S.normalize({}, fx);
  partial = S.setPriority(partial, fx, ['Q-03', 'Q-04', 'Q-02'], t('11:40'));
  partial = S.recordDisposition(partial, fx, 'Q-02', 'true_positive', 'Repeated failures then a success.', t('11:41'));
  partial = S.recordDisposition(partial, fx, 'Q-13', 'needs_investigation', 'I cannot decide yet, so I will look again later.', t('11:42'));
  partial = S.assign(partial, fx, 'Q-02', 'an-chen', t('11:43'));
  const partialRow = attempt('m11-partial', partial);

  // Older v1 attempt: rubric version 1 has no per-alert dispositions.
  const olderRow = attempt('m11-older', perfectState(), { rubricVersion: 1 });

  const emptyRow = { id: 'm11-empty', lab_key: 'lab-exec-report', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T12:00:00.000Z', attempt: { number: 1, of: 1 }, result: {} };

  return [
    {
      name: 'M11 perfect shift recommends PASS with no prefilled notes',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: { priority: 'pass', dispositions: 'pass', 'assign-escalate': 'pass', metrics: 'pass', 'noisy-rule': 'pass', handoff: 'pass', 'technical-report': 'pass', 'executive-summary': 'pass', 'escalation-notice': 'judgment', 'closure-report': 'pass', 'follow-ups': 'pass', closure: 'pass', 'action-log': 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'OPS-5511 · INC-4937', 'Q-13 · Office macro spawned shell on ws-231', 'matches the supported call', 'True positive', 'Needs investigation', 'Analyst Chen', 'Incident lead + endpoint/identity owners', /data-sheet-narrative="technical-report:0"/, '2 of 2 found'],
        notHtml: ['true_positive', 'needs_investigation', 'ir-lead-owners', 'fs02-service-owner', 'priorityOrder'],
      },
    },
    {
      name: 'M11 wrong shift recommends RETURN with plain red-pen notes',
      row: wrongRow,
      expect: {
        verdict: 'return',
        sections: { priority: 'fail', dispositions: 'fail', 'assign-escalate': 'fail', metrics: 'fail', 'noisy-rule': 'fail', handoff: 'fail', 'technical-report': 'fail', 'executive-summary': 'fail', 'closure-report': 'fail', 'follow-ups': 'fail', closure: 'fail' },
        html: ['Recommend RETURN', 'Rank the queue by severity', 'supported call: True positive', 'Keep the incident open', 'Flag R-04', 'Avoid saying one thing', '&lt;script&gt;'],
        notHtml: ['<script>alert'],
      },
    },
    {
      name: 'M11 partial credit shows partly there and prefills "to strengthen" notes',
      row: partialRow,
      expect: {
        verdict: 'return',
        sections: { priority: 'partial', dispositions: 'partial' },
        html: ['Partly there', 'is correctly first, but the next items are out of order'],
      },
    },
    {
      name: 'M11 older rubric v1 attempt shows Not recorded for per-alert dispositions',
      row: olderRow,
      expect: {
        verdict: 'pass',
        sections: { dispositions: 'missing', priority: 'pass', closure: 'pass' },
        html: ['Not recorded in this attempt'],
      },
    },
    {
      name: 'M11 attempt with no action log does not crash',
      row: emptyRow,
      expect: {
        verdict: 'judgment',
        sections: { priority: 'missing', dispositions: 'missing', 'technical-report': 'missing', closure: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M11 read-only record shows the feedback that was sent',
      row: { ...wrongRow, reviewed_at: '2026-10-18T09:00:00.000Z' },
      readOnly: true,
      sentFeedback: [{ item_label: 'Queue priority', comment: 'Rank Q-03 first <b>now</b>.' }],
      expect: { verdict: 'return', html: ['Teacher notes sent to the student', 'Rank Q-03 first &lt;b&gt;now&lt;/b&gt;.'], notHtml: ['data-sheet-notes'] },
    },
  ];
};

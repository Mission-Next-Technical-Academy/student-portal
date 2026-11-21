/* Module 01 Prove It (lab-soc-escalation, CASE-012407) synthetic attempts
 * for tests/admin-submission-sheet.test.js. Scores follow
 * moduleOneProveItPerformance(): entity 0-20 (principal 10 / pivot 5 each),
 * severity 15, disposition 20, escalation 35 × department fit, notes 10. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const GOOD_NOTES = 'At 09:15 to 09:17 a.chen denied three MFA prompts from 198.51.100.24, then approved the fourth and signed in on LAP-442. '
  + 'At 09:24 LAP-442 ran mshta.exe from Downloads and PowerShell contacted the same address; at 09:27 the proxy shows a 34 MB upload to it. '
  + 'On the callback a.chen denied approving the prompts or running the file. This is an account takeover with endpoint execution. '
  + 'Escalated to Tier 2 SOC to revoke the sessions and isolate LAP-442.';

module.exports = ({ run, clone }) => {
  // Additive payload gap fixed in S1: the submit now saves case_display.
  const source = fs.readFileSync(path.join(__dirname, '..', '..', 'portal', 'soc-analyst-module-01.js'), 'utf8');
  assert.match(source, /case_record: moduleOneState\.lab2, case_display: caseDisplay/, 'M01 submit saves case_display');

  const lab2 = (overrides = {}) => ({
    completed: true, submitted: true, submittedAt: '2026-10-17T10:12:00.000Z',
    status: 'in-progress', priority: 'high', severity: 'high', verdict: 'true-positive', disposition: 'true-positive',
    affectedUser: 'a.chen', affectedDevice: 'LAP-442', escalation: 'required', escalateTo: 'tier2-soc',
    notes: GOOD_NOTES,
    reviewedEvidence: ['owner', 'identity', 'endpoint', 'proxy'],
    viewedLogIds: ['evt-mfa-deny-1', 'evt-mfa-approve', 'evt-login-success', 'evt-process', 'evt-network', 'evt-proxy'],
    actionHistory: [
      { action: 'Opened log record evt-login-success (Mon 09:18:03)', at: '2026-10-17T10:03:00.000Z' },
      { action: 'Updated severity', at: '2026-10-17T10:07:00.000Z' },
      { action: 'Submitted case for faculty review', at: '2026-10-17T10:12:00.000Z' },
    ],
    handoff: { observations: '', analysis: '', scope: '', nextAction: '' },
    ...overrides,
  });
  // case_display exactly as the submit builds it (caseRecordDisplay with the
  // Prove It option lists).
  const display = (state) => clone(run(`caseRecordDisplay(${JSON.stringify(state)}, { caseId: MODULE_ONE_ESCALATION_LAB.scenario.caseId, incidentIds: MODULE_ONE_ESCALATION_LAB.scenario.incidentId, dispositionOptions: MODULE_ONE_ESCALATION_LAB.verdictOptions, departmentOptions: MODULE_ONE_ESCALATION_LAB.departmentOptions })`));
  const row = (id, state, score, extra = {}) => ({
    id, lab_key: 'lab-soc-escalation', track_code: 'SOCAN', student_id: '9334491415-SOCAN',
    score, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 },
    result: state === undefined ? extra : { breakdown: {}, feedback: [], critical_errors: [], case_record: state, case_display: display(state), ...extra },
  });

  const failing = lab2({
    status: 'resolved', priority: 'medium', severity: 'medium', verdict: 'false-positive', disposition: 'false-positive',
    affectedUser: 'd.williams', affectedDevice: 'FS-02', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine, user still has laptop <script>alert(1)</script> closed it',
    reviewedEvidence: ['owner', 'identity'],
  });
  const partial = lab2({ affectedUser: 's.kim', escalateTo: 'iam-department' });
  const older = lab2();
  delete older.viewedLogIds;
  delete older.reviewedEvidence;
  delete older.actionHistory;

  return [
    {
      name: 'perfect investigation recommends PASS with no prefilled notes',
      row: { ...row('m01-pass', lab2(), 100), result: { ...row('m01-pass', lab2(), 100).result, breakdown: { affected_entity: 20, severity: 15, disposition: 20, escalation: 35, analyst_notes: 10 } } },
      expect: {
        verdict: 'pass',
        sections: { 'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', notes: 'pass', evidence: 'pass', timeline: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'Confirmed malicious activity', 'Tier 2 SOC — Incident Response', 'CASE-012407 · INC-012716', '9 of 9 found', 'Reads cleanly',
          'Affected user and device', '20 / 20', 'Attempt 1 of 1', /data-sheet-narrative="notes:0"/, /data-sheet-narrative-text>At 09:15/],
        notHtml: ['true-positive', 'tier2-soc', 'in-progress', 'affected_entity'],
      },
    },
    {
      name: 'wrong ticket recommends RETURN with one note per section',
      row: row('m01-fail', failing, 8, { breakdown: { affected_entity: 5, severity: 0, disposition: 0, escalation: 0, analyst_notes: 7 }, critical_errors: ['escalation-not-required'] }),
      expect: {
        verdict: 'return',
        sections: { 'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'partial', disposition: 'fail', escalation: 'fail', notes: 'fail', evidence: 'partial' },
        feedback: ['Case & status', 'Severity', 'Affected user', 'Affected device', 'Disposition', 'Escalation & route', 'Analyst work notes', 'Evidence reviewed'],
        html: ['Recommend RETURN — a critical safety issue was flagged', 'Set Severity to High', 'Put a.chen in Affected user', 'Set Escalation to Required', '&lt;script&gt;',
          'Proofread:', 'sentence starts lowercase', '0 of 9 found', 'Not opened: Endpoint process chain, Proxy telemetry', 'Escalation set to “Not required” on a confirmed takeover'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((item) => item.item_label === 'Affected device').comment, /^To strengthen next time: FS-02 briefly reached/);
        assert.match(suggested.find((item) => item.item_label === 'Analyst work notes').comment, /198\.51\.100\.24/);
      },
    },
    {
      name: 'partial credit paths still recommend PASS and prefill "to strengthen" notes',
      row: row('m01-partial', partial, 83),
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', escalation: 'partial', severity: 'pass', notes: 'pass' },
        feedback: ['Affected user', 'Escalation & route'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'IAM can revoke'],
      },
    },
    {
      name: 'older attempt without case_display, evidence or timeline shows Not recorded',
      row: (() => { const r = row('m01-older', older, 100); delete r.result.case_display; return r; })(),
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', evidence: 'missing', notes: 'pass' },
        html: ['Not recorded in this attempt', 'Confirmed malicious activity', 'Tier 2 SOC — Incident Response', 'In Progress'],
        notHtml: ['true-positive', 'tier2-soc'],
      },
    },
    {
      name: 'attempt with no case record at all does not crash',
      row: row('m01-empty', undefined, null, { breakdown: { affected_entity: 0 } }),
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'read-only record shows the feedback that was sent',
      row: { ...row('m01-graded', failing, 8), reviewed_at: '2026-10-18T09:00:00.000Z' },
      readOnly: true,
      sentFeedback: [{ item_label: 'Severity', comment: 'Set Severity to High <b>now</b>.' }],
      expect: {
        verdict: 'return',
        html: ['Teacher notes sent to the student', 'Set Severity to High &lt;b&gt;now&lt;/b&gt;.', 'Reviewed'],
        notHtml: ['data-sheet-notes'],
      },
    },
  ];
};

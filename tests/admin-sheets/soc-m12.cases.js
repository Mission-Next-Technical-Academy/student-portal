/* Module 12 capstone (lab-capstone, CASE-124821 with INC-4821/4822/4823, rubric
 * v3) synthetic attempts for tests/admin-submission-sheet.test.js. The state
 * is built with the module's own SocM12AssessmentState.record() and scored
 * with SocM12AssessmentScorer, and the row mirrors what moduleTwelveFinalize()
 * saves (case_record.assessmentState, case_display, reviewPayload, breakdown). */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');

module.exports = ({ run, clone }) => {
  const load = (name, file) => { if (run(`typeof ${name}`) === 'undefined') run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); };
  load('SocAssessmentScorer', 'soc-assessment-scorer.js');
  load('SocM12AssessmentData', 'soc-m12-assessment-data.js');
  load('SocM12AssessmentState', 'soc-m12-assessment-state.js');
  load('SocM12AssessmentRubric', 'soc-m12-assessment-rubric.js');
  load('SocM12AssessmentScorer', 'soc-m12-assessment-scorer.js');

  const fx = run('SocM12AssessmentData');
  const S = run('SocM12AssessmentState');
  const Scorer = run('SocM12AssessmentScorer');
  const rec = (state, type, details) => S.record(state, fx, type, details);
  const v3 = (state) => S.normalize({ ...clone(state), rubricVersion: 3 }, fx);

  const CORE = { status: 'in-progress', severity: 'high', affectedUser: 'acct-204', affectedDevice: 'ws-204', disposition: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc', priorityRationale: 'EP-301 and ID-402 show script execution on ws-204 and an unfamiliar session for acct-204, so this needs rapid response.' };
  const TECH = 'EM-212 shows the phishing link that acct-204 opened on ws-204. EP-301 then ran the script, EP-303 created the Run key persistence and NW-501 connected to 203.0.113.72. '
    + 'ws-118 only ran an approved inventory script, so it is excluded; the confirmed scope and timeline are ws-204 and acct-204.';

  function perfect() {
    let s = S.fresh(fx);
    const intel = [['TI-601', 'malicious', 'NW-501 shows ws-204 connecting to 203.0.113.72 after the ID-402 token refresh.'], ['TI-602', 'malicious', 'EP-301 is the unsigned script that ran on ws-204 after the lure.'],
      ['TI-603', 'benign', 'BEN-101 and NW-504 show the approved update service on ws-118 only.'], ['TI-604', 'unknown', 'update-check.example has no reputation; EM-212 is the only link to it.'], ['TI-605', 'benign', 'EP-311 and DN-002 show the approved vendor monitoring service.']];
    intel.forEach(([indicatorId, decision, rationale]) => { s = rec(s, 'intel-decision', { indicatorId, decision, rationale }); });
    s = rec(s, 'query-run', { query: 'DeviceProcessEvents | join NetworkSessionEvents | join EmailEvents by host', outcome: 'correlated', matchedEvidence: ['EM-212', 'EP-301', 'NW-501'] });
    s = rec(s, 'rule-save', { ruleId: 'RULE-03', query: 'DeviceProcessEvents | join NetworkSessionEvents on host', outcome: 'correlated' });
    s = rec(s, 'rule-schedule', { ruleId: 'RULE-03', frequency: 'hourly' });
    [['AL-1201', 'true-positive'], ['AL-1202', 'true-positive'], ['AL-1203', 'benign-positive'], ['AL-1205', 'benign-positive']].forEach(([alertId, disposition]) => { s = rec(s, 'review-alert', { alertId, disposition, reason: `Reviewed ${alertId} against the discriminating record.` }); });
    [['AL-1201', 'INC-4821'], ['AL-1202', 'INC-4822'], ['AL-1203', 'INC-4823'], ['AL-1205', 'INC-4823']].forEach(([alertId, incidentId]) => { s = rec(s, 'incident-link', { alertId, incidentId }); });
    s = rec(s, 'incident-update', { incidentId: 'INC-4821', status: 'resolved', disposition: 'true-positive', note: 'EP-301 and NW-501 confirm execution and the outbound connection on ws-204.' });
    s = rec(s, 'incident-update', { incidentId: 'INC-4822', status: 'resolved', disposition: 'true-positive', note: 'ID-402 shows the unfamiliar token refresh for acct-204 after the EM-212 click.' });
    s = rec(s, 'incident-update', { incidentId: 'INC-4823', status: 'resolved', disposition: 'benign-positive', note: 'BEN-101 shows the approved inventory script; NW-504 finds no matching destination.' });
    [['identity', 'ID-402', 'ID-402 shows an unfamiliar client refreshing the acct-204 session token.'], ['email', 'EM-212', 'EM-212 shows acct-204 opened the linked document on ws-204.'], ['endpoint', 'EP-301', 'EP-301 shows the unsigned script ran on ws-204 after the document opened.'],
      ['network', 'NW-501', 'NW-501 shows ws-204 sent data to 203.0.113.72 over port 443.'], ['exposure', 'VX-701', 'VX-701 shows the audit-only script control left ws-204 exposed.']].forEach(([domain, id, finding]) => { s = rec(s, 'investigation', { domain, finding, evidenceIds: [id] }); });
    s = rec(s, 'investigation', { domain: 'timeline', finding: 'EM-212 then EP-301 then NW-501 in time order on ws-204.', evidenceIds: ['EM-212', 'EP-301', 'NW-501'] });
    s = rec(s, 'investigation', { domain: 'scope', finding: 'EP-301 confirms ws-204 and ID-402 confirms acct-204. NW-504 found no second matching host within the available coverage; gaps remain unknown for ws-118.', evidenceIds: ['EP-301', 'ID-402', 'NW-504'], ticketCore: CORE });
    fx.expectedTruth.selectedEvidence.forEach((evidenceId) => { s = rec(s, 'evidence-select', { evidenceId, selected: true }); });
    fx.expectedTruth.demonstratedAttack.forEach((technique) => { s = rec(s, 'attack-map', { technique, evidenceIds: fx.expectedTruth.attackEvidence[technique] }); });
    s = rec(s, 'workflow-design', { name: 'Contain WS-204', nodes: ['preserve', 'approval', 'isolate'], edges: [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }] });
    ['isolate:ws-204', 'revoke-session:acct-204', 'restore:BK-204-0900'].forEach((key) => { const [action, target] = key.split(':'); s = rec(s, 'approval', { action, target, approved: true }); });
    ['preserve:ws-204', 'isolate:ws-204', 'revoke-session:acct-204', 'block-indicator:203.0.113.72'].forEach((key) => { const [action, target] = key.split(':'); s = rec(s, 'execute', { action, target }); });
    ['remove-persistence:ws-204', 'restore:BK-204-0900', 'scan:ws-204', 'monitor:ws-204'].forEach((key) => { const [action, target] = key.split(':'); s = rec(s, 'recovery', { action, target }); });
    s = rec(s, 'report', { kind: 'technical', text: TECH, evidenceIds: ['EM-212', 'EP-301', 'NW-501'], ticketCore: CORE });
    s = rec(s, 'report', { kind: 'executive', text: 'EM-212 and EP-301 connect the affected ws-204 workstation to the delivered document. The team preserved evidence and contained the device while recovery validation continues.', evidenceIds: ['EM-212', 'EP-301'], ticketCore: CORE });
    s = rec(s, 'report', { kind: 'lessons', text: 'VX-701 identifies the audit-only script policy on ws-204. The endpoint control owner will enforce the policy after validation.', evidenceIds: ['VX-701'] });
    s = rec(s, 'handoff', { text: 'ws-204 and acct-204 are contained; the evening shift keeps monitoring ws-204 and verifies policy enforcement.', openRisks: ['monitoring'] });
    s = rec(s, 'closure', { decision: 'retain', rationale: 'Keep CASE-124821 open for ws-204 while the policy owner validates enforcement and the evening shift monitors.', ticketCore: CORE });
    return v3(s);
  }

  const spec = () => ({ caseId: 'CASE-124821', incidentIds: ['INC-4821', 'INC-4822', 'INC-4823'], departmentOptions: [{ id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response' }, { id: 'help-desk', text: 'Help Desk' }], dispositionOptions: [{ id: 'true-positive', text: 'True-positive incident' }, { id: 'benign-close', text: 'Benign — close alert' }] });
  function row(id, state, ticket, { display = true, payload = true } = {}) {
    const scored = Scorer.score(state, fx, { rubricVersion: 3 });
    const record = { ...ticket, submitted: true, completed: true, notes: TECH, assessmentState: clone(state), actionHistory: [{ action: 'Updated incident ticket', at: '2026-10-17T15:00:00.000Z' }],
      findings: { priorityRationale: ticket.priorityRationale || '', scopeStatement: 'ws-204 and acct-204 are in scope; ws-118 is benign.', executiveSummary: 'A phishing document led to a contained intrusion on one workstation.', closureNote: 'Keep open until recovery is validated.' } };
    const result = {
      breakdown: scored.criteria.map((c) => ({ label: c.label, score: c.points, max: c.max, evidence: clone(c.supportingEvidence), misses: clone(c.misses) })),
      feedback: clone(scored.review.feedback), criticalErrors: scored.unsafeExecution ? ['An unsafe state-changing action executed outside approved scope.'] : [], critical_errors: scored.unsafeExecution ? ['An unsafe state-changing action executed outside approved scope.'] : [],
      case_record: record, reviewPayload: payload ? clone(scored) : undefined,
      shiftChecklist: {
        completed: [0, 2],
        items: [
          { label: 'Open your CASE', where: 'ITSM Ticket', detail: 'Read its incidents and open work.', modules: 'M01', checked: true },
          { label: 'Triage alerts', where: 'Alerts', detail: 'Disposition each; link it to its incident.', modules: 'M01 · M03', checked: false },
          { label: 'Judge indicators', where: 'Threat Intelligence', detail: 'Malicious, benign, or unknown, from case records.', modules: 'M04', checked: true },
        ],
      },
    };
    if (display) result.case_display = clone(run(`caseRecordDisplay(${JSON.stringify(record)}, ${JSON.stringify(spec())})`));
    return { id, lab_key: 'lab-capstone', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: scored.score, pass_threshold: 70, completed_at: '2026-10-17T16:00:00.000Z', attempt: { number: 1, of: 1 }, result };
  }
  const TICKET = { status: 'in-progress', severity: 'high', affectedUser: 'acct-204', affectedDevice: 'ws-204', disposition: 'true-positive', verdict: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc', priorityRationale: CORE.priorityRationale };

  const perfectState = perfect();
  const perfectRow = row('m12-pass', perfectState, TICKET);
  // Sanity: the synthetic perfect attempt really is a full-marks v3 attempt.
  assert.equal(perfectRow.score, 100, 'synthetic perfect capstone scores 100');

  // Wrong: wrong incident calls, benign host called malicious, unsafe isolate without approval, wrong ticket.
  let wrong = S.fresh(fx);
  wrong = rec(wrong, 'intel-decision', { indicatorId: 'TI-603', decision: 'malicious', rationale: 'NW-504 proves ws-118 has a malicious destination and must be contained.' });
  wrong = rec(wrong, 'review-alert', { alertId: 'AL-1203', disposition: 'true-positive', reason: 'The rare script host on ws-118 looks malicious.' });
  wrong = rec(wrong, 'incident-link', { alertId: 'AL-1203', incidentId: 'INC-4821' });
  wrong = rec(wrong, 'incident-update', { incidentId: 'INC-4823', status: 'resolved', disposition: 'true-positive', note: 'ws-118 ran a rare script host so it is compromised.' });
  wrong = rec(wrong, 'execute', { action: 'isolate', target: 'ws-118' });
  wrong = rec(wrong, 'closure', { decision: 'close', rationale: 'All good, closing the case now.' });
  wrong = v3(wrong);
  const wrongRow = row('m12-fail', wrong, { ...TICKET, severity: 'low', affectedUser: 'acct-091', affectedDevice: 'ws-118', disposition: 'benign-close', verdict: 'benign-close', escalation: 'not-required', escalateTo: '', priorityRationale: '<script>alert(1)</script> nothing to see' });

  // Partial: perfect except INC-4823 never resolved and no lessons report -> partial credit, still PASS on score.
  let partial = S.fresh(fx);
  perfectState.actionHistory.filter((a) => !(a.type === 'incident-update' && a.details.incidentId === 'INC-4823') && !(a.type === 'report' && a.details.kind === 'lessons')).forEach((a) => { partial = rec(partial, a.type, a.details); });
  partial = v3(partial);
  const partialRow = row('m12-partial', partial, TICKET);

  // Older attempt (rubric v1 single-incident ticket): no child incidents.
  let older = S.fresh(fx);
  perfectState.actionHistory.filter((a) => !['incident-update', 'incident-link'].includes(a.type)).forEach((a) => { older = rec(older, a.type, a.details); });
  const olderScored = Scorer.score(older, fx, { rubricVersion: 1 });
  const olderRow = row('m12-older', older, TICKET, { display: false });
  olderRow.result.reviewPayload = clone(olderScored);
  olderRow.score = olderScored.score;
  olderRow.completed_at = '2026-10-10T16:00:00.000Z';
  delete olderRow.result.case_record.assessmentState.incidents;

  const emptyRow = { id: 'm12-empty', lab_key: 'lab-capstone', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T16:00:00.000Z', attempt: { number: 1, of: 1 }, result: {} };
  // Only the review artifact survived (no assessment state in case_record).
  const artifactOnly = clone(perfectRow);
  artifactOnly.id = 'm12-artifact';
  delete artifactOnly.result.case_record.assessmentState;

  return [
    {
      name: 'M12 perfect capstone recommends PASS with no prefilled notes',
      row: perfectRow,
      expect: {
        verdict: 'pass',
        sections: { case: 'pass', 'case-routing': 'pass', 'shift-checklist': 'judgment', 'incident-inc-4821': 'pass', 'incident-inc-4822': 'pass', 'incident-inc-4823': 'pass', intel: 'pass', alerts: 'pass', queries: 'pass', investigation: 'pass', 'timeline-attack': 'pass', containment: 'pass', recovery: 'pass', reporting: 'pass', closure: 'pass', competencies: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-124821 · INC-4821 · INC-4822 · INC-4823', 'Operation Amber Finch', 'Open your CASE', 'Checked · ITSM Ticket', 'Triage alerts', 'Not checked · Alerts', 'INC-4823 · Rare script host on WS-118', 'Benign positive', 'AL-1205 · Approved inventory script used an encoded argument (ws-118)', 'EP-301 (the script that ran on WS-204)', '203.0.113.72', 'Malicious (matches the key)', /data-sheet-narrative="reporting:0"/, '7 of 7 found'],
        notHtml: ['true-positive', 'benign-positive', 'tier2-soc', 'incident-update', 'assessmentState'],
      },
    },
    {
      name: 'M12 wrong capstone recommends RETURN with red-pen notes per incident',
      row: wrongRow,
      expect: {
        verdict: 'return',
        sections: { case: 'fail', 'case-routing': 'fail', 'incident-inc-4821': 'fail', 'incident-inc-4822': 'fail', 'incident-inc-4823': 'fail', intel: 'fail', alerts: 'fail', containment: 'fail', reporting: 'fail', closure: 'fail' },
        custom: ({ suggested }) => {
          assert.ok(suggested.map((item) => item.item_label).includes('INC-4823 · Rare script host on WS-118'), 'one prefilled note per failed incident');
        },
        html: ['Recommend RETURN', 'Set Severity to High', 'Put acct-204 in Affected user', 'Set INC-4823 to Benign positive', 'Link the alert that belongs to INC-4821', 'Unlink alerts that belong elsewhere', 'Only act on the supported targets', '&lt;script&gt;'],
        notHtml: ['<script>alert'],
      },
    },
    {
      name: 'M12 partial credit (one incident unresolved, no lessons) passes with return notes for the failed incident',
      row: partialRow,
      expect: {
        verdict: 'pass',
        sections: { 'incident-inc-4821': 'pass', 'incident-inc-4823': 'fail', reporting: 'partial' },
        html: ['Partly there', 'Never updated'],
      },
    },
    {
      name: 'M12 older single-incident attempt shows the incident sections as Not recorded',
      row: olderRow,
      expect: {
        sections: { 'incident-inc-4821': 'missing', 'incident-inc-4822': 'missing', 'incident-inc-4823': 'missing', case: 'pass' },
        html: ['Not recorded in this attempt', 'Single-incident ticket (submitted under an older rubric)'],
      },
    },
    {
      name: 'M12 attempt with only the review artifact still shows incidents and responses',
      row: artifactOnly,
      expect: {
        verdict: 'pass',
        sections: { 'incident-inc-4821': 'pass', 'incident-inc-4823': 'pass', intel: 'pass', reporting: 'pass' },
        html: ['INC-4822 · Unfamiliar token refresh for acct-204'],
      },
    },
    {
      name: 'M12 attempt with no result does not crash',
      row: emptyRow,
      expect: {
        verdict: 'judgment',
        sections: { case: 'missing', intel: 'missing', reporting: 'missing', 'incident-inc-4821': 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M12 read-only record shows the feedback that was sent',
      row: { ...wrongRow, reviewed_at: '2026-10-18T09:00:00.000Z' },
      readOnly: true,
      sentFeedback: [{ item_label: 'Parent CASE and ticket', comment: 'Set Severity to High <b>now</b>.' }],
      expect: { verdict: 'return', html: ['Teacher notes sent to the student', 'Set Severity to High &lt;b&gt;now&lt;/b&gt;.'], notHtml: ['data-sheet-notes'] },
    },
  ];
};

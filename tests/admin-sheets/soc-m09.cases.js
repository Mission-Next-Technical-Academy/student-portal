/* Module 09 Prove It (lab-active-incident, INC-4937 Operation Cedar Lock)
 * synthetic attempts for tests/admin-submission-sheet.test.js. Scores come from
 * the real SocM09AssessmentScorer (rubric v3) run over a hand-built response
 * state; ticket display rows come from the module's own caseRecordDisplay + spec. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');

module.exports = ({ run, clone }) => {
  const defined = (name) => run(`typeof ${name} !== 'undefined'`);
  const loadScript = (file, marker) => { if (defined(marker)) return; try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; } };
  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-09.js'), 'utf8');
  const loadConst = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nconst ${name} = `);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-09.js`);
    const rest = source.slice(start + 1);
    const first = rest.split('\n')[0];
    if (/;\s*$/.test(first)) { run(first); return; }
    run(rest.slice(0, rest.search(/\n[\]}];\n/) + 3));
  };
  const loadFunction = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nfunction ${name}(`);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-09.js`);
    const rest = source.slice(start + 1);
    run(rest.slice(0, rest.indexOf('\n}\n') + 3));
  };
  loadScript('soc-assessment-scorer.js', 'SocAssessmentScorer');
  loadScript('soc-m09-assessment-data.js', 'SocM09AssessmentData');
  loadScript('soc-m09-assessment-rubric.js', 'SocM09AssessmentRubric');
  loadScript('soc-m09-assessment-scorer.js', 'SocM09AssessmentScorer');
  ['MODULE_NINE_ENTITY_ROSTER', 'MODULE_NINE_DEPARTMENT_OPTIONS', 'MODULE_NINE_CLASSIFICATION_OPTIONS', 'MODULE_NINE_SCOPE_OPTIONS', 'MODULE_NINE_ANSWER_KEY', 'MODULE_NINE_SOURCES'].forEach(loadConst);
  loadFunction('moduleNineProveItSpec');
  loadFunction('moduleNineAssessmentWork');

  // Additive payload gap fixed in S3: the submit now saves assessment_work.
  assert.match(source, /assessment_work: moduleNineAssessmentWork\(huntState\)/, 'M09 submit saves assessment_work');

  const SID = 'M09-ASSESS-2026-09-27';
  const INC = 'INC-4937';
  const pad = (n) => String(n).padStart(6, '0');
  const ts = (n) => `2026-09-27T10:${String(1 + n).padStart(2, '0')}:00.000Z`;
  const approval = (type, target) => ({ incidentId: INC, actionType: type, targetId: target, approverId: 'ir-lead-01', reason: 'Incident lead approved after reviewing the evidence.' });
  const act = (sequence, type, outcome, details) => ({ id: `${SID}:ACTION-${pad(sequence)}`, sequence, type, outcome, timestamp: ts(sequence), details: { incidentId: INC, ...details } });
  const effect = (entityId, field, value = true) => [{ entityId, field, value }];

  // A complete, correct response (what the console would have saved).
  const state = (mutate) => {
    const recovery = { backupId: 'backup-ws-173', recoveryPointId: 'RP-WS-173-0918', entityId: 'DEV-173', evidenceId: 'M09-E15' };
    const s = {
      reviewedEvidenceIds: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05', 'M09-E06', 'M09-E07', 'M09-E08', 'M09-E09', 'M09-E10'],
      entityStates: { 'ws-173': { isolated: true }, 'acct-173': { disabled: true }, 'DEV-173': { restoreStatus: true, scanStatus: true, validationStatus: true } },
      actionHistory: [
        act(1, 'isolate_endpoint', 'success', { entityId: 'ws-173', evidenceIds: ['M09-E01'], approval: approval('isolate_endpoint', 'ws-173'), effects: effect('ws-173', 'isolated'), execution: { summary: 'completed' } }),
        act(2, 'disable_identity', 'success', { entityId: 'acct-173', evidenceIds: ['M09-E06'], approval: approval('disable_identity', 'acct-173'), effects: effect('acct-173', 'disabled'), execution: { summary: 'completed' } }),
        act(3, 'select_recovery_point', 'success', { ...recovery, targetEntityId: 'DEV-173', integrity: 'verified', approval: approval('restore_backup', 'DEV-173') }),
        act(4, 'restore_backup', 'success', { ...recovery, approval: approval('restore_backup', 'DEV-173'), effects: effect('DEV-173', 'restoreStatus'), execution: { summary: 'completed' } }),
        act(5, 'scan_recovery', 'success', { ...recovery, approval: approval('restore_backup', 'DEV-173'), effects: effect('DEV-173', 'scanStatus'), execution: { summary: 'completed' } }),
        act(6, 'validate_recovery', 'success', { ...recovery, approval: approval('restore_backup', 'DEV-173'), effects: effect('DEV-173', 'validationStatus'), execution: { summary: 'completed' } }),
        act(7, 'monitor_recovery', 'partial', { ...recovery, residualRiskIds: ['persistence_present'], effects: [], execution: { summary: 'reopened' } }),
      ],
      incidentWorkflows: {
        [INC]: {
          severity: 'critical', assigneeId: 'ir-lead-owners', status: 'investigating', escalationStatus: 'escalated',
          escalationReason: 'A startup entry on ws-173 may persist; the incident lead should confirm it is removed.', approvalStatus: 'approved', approvalReason: 'Lead approved containment.',
          tasks: [
            { id: 'M09-TASK-001', title: 'Preserve and review available evidence', status: 'completed', authorId: 'system', completionEvidence: { note: 'Collected the endpoint and sign-in records before containment.', evidenceIds: ['M09-E01', 'M09-E06'] } },
            { id: 'M09-TASK-002', title: 'Validate containment outcome', status: 'pending' },
            { id: 'M09-TASK-004', title: 'Confirm backup validation with the service owner', status: 'pending', authorId: 'an-ruiz' },
          ],
        },
      },
      workflowHistory: [
        { id: `${SID}:WORKFLOW-000001`, sequence: 1, incidentId: INC, timestamp: '2026-09-27T09:58:00.000Z', field: 'severity', value: 'critical' },
        { id: `${SID}:WORKFLOW-000002`, sequence: 2, incidentId: INC, timestamp: '2026-09-27T09:58:30.000Z', field: 'assigneeId', value: 'ir-lead-owners' },
        { id: `${SID}:WORKFLOW-000003`, sequence: 3, incidentId: INC, timestamp: '2026-09-27T09:59:00.000Z', field: 'taskStatus', value: { taskId: 'M09-TASK-001', status: 'completed' } },
        { id: `${SID}:WORKFLOW-000004`, sequence: 4, incidentId: INC, timestamp: '2026-09-27T10:09:00.000Z', field: 'escalationStatus', value: 'escalated' },
      ],
      workflowDesigns: [{
        id: `${SID}:DESIGN-000001`, incidentId: INC, name: 'Evidence, approval, contain, check', timestamp: '2026-09-27T09:57:00.000Z',
        nodes: ['preserve', 'approval', 'isolate', 'revoke-session', 'scan', 'monitor'],
        edges: [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }, { from: 'approval', to: 'revoke-session' }, { from: 'isolate', to: 'scan' }, { from: 'scan', to: 'monitor' }],
      }],
      unsafeAttempts: [],
    };
    if (mutate) mutate(s);
    return s;
  };
  const score = (s) => clone(run(`SocM09AssessmentScorer.score(${JSON.stringify(s)}, SocM09AssessmentData)`));
  const workOf = (s) => clone(run(`(() => { const s = ${JSON.stringify(s)}; return moduleNineAssessmentWork(s); })()`));
  const display = (t) => clone(run(`caseRecordDisplay(${JSON.stringify(t)}, moduleNineProveItSpec())`));

  const GOOD_NOTES = 'Incident state: active ransomware encryption on ws-173 with an unfamiliar remote session on acct-173 that the owner denied; fs-02 is disrupted. Confirmed scope is ws-173 and acct-173; a second endpoint and exfiltration are not established. '
    + 'Evidence: M09-E01 file changes, M09-E06 remote session, M09-E07 callback. Requested response: isolate ws-173 and disable acct-173 under approval. Recovery condition: validate the known-good restore and monitor before reconnecting. Severity is Critical.';
  const ticket = (overrides = {}) => ({
    status: 'in-progress', severity: 'critical', affectedUser: 'acct-173', affectedDevice: 'ws-173', disposition: 'true-positive',
    escalation: 'required', escalateTo: 'ir-lead-owners', notes: GOOD_NOTES,
    findings: { classification: 'ransomware-impact', scope: 'bounded-three' },
    submitted: true, submittedAt: '2026-10-17T10:12:00.000Z', caseId: INC, actionHistory: [],
    ...overrides,
  });
  const row = (id, t, s, scoreOverride, extra = {}) => {
    const scored = score(s);
    return {
      id, lab_key: 'lab-active-incident', track_code: 'SOCAN', student_id: '9334491415-SOCAN',
      score: scoreOverride === undefined ? scored.score : scoreOverride, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 },
      result: {
        rubric_version: scored.rubricVersion, breakdown: scored.criteria, feedback: scored.review.feedback,
        review_payload: { ...scored, caseId: INC, scenarioId: SID }, critical_errors: scored.criticalMisses || [],
        case_record: t, case_display: display(t), case_summary: '', assessment_work: workOf(s), ...extra,
      },
    };
  };

  const perfect = row('m09-pass', ticket(), state());
  assert.equal(perfect.score, 100, 'the hand-built response earns full marks from the real scorer');

  // Wrong everything: bad ticket, backwards workflow design, blocked attempts, nothing run.
  const failingState = state((s) => {
    s.actionHistory = []; s.reviewedEvidenceIds = []; s.entityStates = {}; s.workflowHistory = [];
    s.incidentWorkflows[INC] = { severity: 'high', assigneeId: null, status: 'open', escalationStatus: 'none', escalationReason: '', approvalStatus: 'not_requested', approvalReason: '', tasks: [{ id: 'M09-TASK-001', title: 'Preserve and review available evidence', status: 'pending' }] };
    s.workflowDesigns = [{ id: `${SID}:DESIGN-000001`, incidentId: INC, name: 'Wipe first', timestamp: '2026-09-27T09:57:00.000Z', nodes: ['isolate', 'preserve'], edges: [{ from: 'isolate', to: 'preserve' }] }];
    s.unsafeAttempts = [
      { id: `${SID}:ATTEMPT-000001`, sequence: 1, incidentId: INC, timestamp: '2026-09-27T10:03:00.000Z', actionType: 'isolate_device', targetId: 'ws-173', outcome: 'blocked', reason: 'no_approval' },
      { id: `${SID}:ATTEMPT-000002`, sequence: 2, incidentId: INC, timestamp: '2026-09-27T10:04:00.000Z', actionType: 'disable_identity', targetId: 'acct-045', outcome: 'blocked', reason: 'out_of_scope' },
    ];
  });
  const failingTicket = ticket({
    status: 'resolved', severity: 'low', affectedUser: 'acct-045', affectedDevice: 'ws-054', disposition: 'false-positive', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine <script>alert(1)</script> closed it', findings: { classification: 'benign', scope: 'none' },
  });
  const failing = row('m09-fail', failingTicket, failingState, 6);

  // Partial credit: pivot user, acceptable route, design without a scan step, one blocked attempt.
  const partialState = state((s) => {
    s.workflowDesigns[0].nodes = ['preserve', 'approval', 'isolate', 'revoke-session'];
    s.workflowDesigns[0].edges = [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }, { from: 'approval', to: 'revoke-session' }];
    s.unsafeAttempts = [{ id: `${SID}:ATTEMPT-000001`, sequence: 1, incidentId: INC, timestamp: '2026-09-27T10:03:00.000Z', actionType: 'revoke_session', targetId: 'session-173-REMOTE', outcome: 'blocked', reason: 'no_approval' }];
  });
  const partial = row('m09-partial', ticket({ affectedUser: 'svc-backup' }), partialState);

  // Older attempt: scored before rubric v3 (no design/safe-conduct criteria, no responseReview), no assessment_work or case_display.
  const older = row('m09-older', ticket(), state());
  delete older.result.assessment_work;
  delete older.result.case_display;
  delete older.result.review_payload.responseReview;
  older.result.breakdown = older.result.breakdown.filter((c) => !['response-workflow-design', 'safe-response-conduct'].includes(c.id));

  return [
    {
      name: 'M09 correct response recommends PASS with the workflow design shown',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: {
          'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', 'ticket-findings': 'pass', notes: 'pass',
          triage: 'pass', 'evidence-scope': 'pass', 'workflow-design': 'pass', 'evidence-first': 'pass', containment: 'pass', 'safe-conduct': 'pass', recovery: 'pass', 'residual-escalation': 'pass',
        },
        feedback: [],
        html: ['Recommend PASS', 'INC-4937', 'Incident Lead + Endpoint/Identity Owners', 'Confirmed malicious activity', 'Active ransomware impact with identity overlap', '10 of 10 found', 'Completion note: Collected the endpoint and sign-in records before containment.', 'M09-E01 ·', 'Tasks added · Author', 'Confirm backup validation with the service owner · Author: an-ruiz',
          'Preserve evidence → Get approval', 'Evidence, approval, contain, check', 'Disable account → acct-173', 'Persistence still present', 'No blocked or unapproved response attempts',
          /data-sheet-narrative-text>Incident state: active ransomware/, /data-sheet-narrative="residual-escalation:0"/],
        notHtml: ['true-positive', 'ir-lead-owners', 'ransomware-impact', 'bounded-three', 'persistence_present', 'revoke-session', 'disable_identity'],
      },
    },
    {
      name: 'M09 wrong ticket, backwards design and blocked attempts recommends RETURN',
      row: failing,
      expect: {
        verdict: 'return',
        sections: {
          'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'fail', disposition: 'fail', escalation: 'fail', 'ticket-findings': 'fail', notes: 'fail',
          triage: 'fail', 'evidence-scope': 'fail', 'workflow-design': 'fail', 'safe-conduct': 'fail', containment: 'fail', recovery: 'fail', 'residual-escalation': 'fail',
        },
        html: ['Recommend RETURN', 'Set Severity to Critical', 'Put acct-173 in Affected user', 'Set Escalation to Required', '&lt;script&gt;', 'Proofread:',
          'Isolate endpoint → Preserve evidence', 'Isolate device → ws-173', 'Blocked: no matching approval was recorded', 'the target is outside the incident scope', 'Remove arrows that run from a disruptive step'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((entry) => entry.item_label === 'Affected device').comment, /Put ws-173 in Affected device/);
        assert.match(suggested.find((entry) => entry.item_label === 'Response workflow design').comment, /preserve evidence first/);
      },
    },
    {
      name: 'M09 partial-credit paths still recommend PASS and prefill "to strengthen" notes',
      row: partial,
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', 'workflow-design': 'partial', 'safe-conduct': 'partial', triage: 'pass', recovery: 'pass', notes: 'pass' },
        feedback: ['Affected user', 'Response workflow design', 'Safe response conduct (blocked attempts)'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Add a scan or monitor step after containment', 'Revoke session → session-173-REMOTE'],
      },
    },
    {
      name: 'M09 older attempt without assessment_work, case_display or rubric v3 shows Not recorded',
      row: older,
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', notes: 'pass', triage: 'pass', containment: 'pass', recovery: 'pass', 'workflow-design': 'missing', 'safe-conduct': 'missing' },
        html: ['Not recorded in this attempt', 'Credited by the scorer', 'Incident Lead + Endpoint/Identity Owners', 'Confirmed malicious activity'],
        notHtml: ['ir-lead-owners', 'true-positive'],
      },
    },
    {
      name: 'M09 attempt with no ticket or response record at all does not crash',
      row: { id: 'm09-empty', lab_key: 'lab-active-incident', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: {} },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing', triage: 'missing', 'workflow-design': 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M09 read-only record shows the feedback that was sent',
      row: { ...failing, reviewed_at: '2026-10-18T09:00:00.000Z' },
      readOnly: true,
      sentFeedback: [{ item_label: 'Severity', comment: 'Set Severity to Critical <b>now</b>.' }],
      expect: {
        verdict: 'return',
        html: ['Teacher notes sent to the student', 'Set Severity to Critical &lt;b&gt;now&lt;/b&gt;.', 'Reviewed'],
        notHtml: ['data-sheet-notes'],
      },
    },
  ];
};

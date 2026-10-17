/* Module 06 Prove It (lab-threat-hunt-independent, CASE-066318) synthetic
 * attempts for tests/admin-submission-sheet.test.js. Hunt scores come from the
 * real SocM06AssessmentScorer run over a hand-built hunt state; the ticket
 * display rows come from the module's own caseRecordDisplay + case spec. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');

module.exports = ({ run, clone }) => {
  // ---- load only what this module needs into the sheet test VM (once)
  const defined = (name) => run(`typeof ${name} !== 'undefined'`);
  const loadScript = (file, marker) => { if (defined(marker)) return; try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; } };
  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-06.js'), 'utf8');
  // Top-level `const NAME = …;` blocks and `function name(…) {…}` from the module
  // script (the script itself needs a browser, so only the pieces are run).
  const loadConst = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nconst ${name} = `);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-06.js`);
    const rest = source.slice(start + 1);
    const first = rest.split('\n')[0];
    if (/;\s*$/.test(first)) { run(first); return; }
    const end = rest.search(/\n[\]}];\n/);
    run(rest.slice(0, end + 3));
  };
  const loadFunction = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nfunction ${name}(`);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-06.js`);
    const rest = source.slice(start + 1);
    run(rest.slice(0, rest.indexOf('\n}\n') + 3));
  };
  loadScript('soc-assessment-scorer.js', 'SocAssessmentScorer');
  loadScript('soc-m06-assessment-data.js', 'SocM06AssessmentData');
  loadScript('soc-m06-assessment-rubric.js', 'SocM06AssessmentRubric');
  loadScript('soc-m06-assessment-scorer.js', 'SocM06AssessmentScorer');
  ['MODULE_SIX_BACKDOOR_CASE_ID', 'MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD', 'MODULE_SIX_BACKDOOR_ENTITY_ROSTER', 'MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS',
    'MODULE_SIX_EVIDENCE_PRIORITY_FINDING_OPTIONS', 'MODULE_SIX_SCOPE_ASSESSMENT_FINDING_OPTIONS', 'MODULE_SIX_RESPONSE_ACTION_FINDING_OPTIONS'].forEach(loadConst);
  loadFunction('moduleSixBackdoorCaseSpec');
  loadFunction('moduleSixAssessmentWork');

  // Additive payload gap fixed in S3: the submit now saves assessment_work.
  assert.match(source, /assessment_work: moduleSixAssessmentWork\(huntState\)/, 'M06 submit saves assessment_work');

  const T = (id, time, device, account, extra = {}) => ({ id, time, device, account, ...extra });
  void T;
  const E = (n) => `M06-EVT-${String(n).padStart(3, '0')}`;
  const stamp = (n) => `2026-09-27T09:${String(10 + n).padStart(2, '0')}:00Z`;

  // A complete, correct hunt state (what the console would have saved).
  const huntState = (overrides = {}) => {
    const hypothesisText = 'The UpdateHealth task on ws-318 runs an unsigned script from a user-writable folder and then calls out; the benign host ws-355 runs a signed binary.';
    const state = {
      hypotheses: [{ id: 'M06-ASSESS-2026-09-27:HYPOTHESIS-001', seedLeadId: 'M06-LEAD-001', text: hypothesisText, rationale: 'No alert fired, so compare the task with the signed maintenance copy.', confidence: 'medium', status: 'testing', relatedEventIds: [E(1), E(3)] }],
      queryHistory: [
        { entityType: 'device', entityValue: 'ws-318', startTime: '2026-09-27T09:00:00Z', endTime: '2026-09-27T09:30:00Z', timestamp: stamp(1), query: 'taskName = UpdateHealth', resultEventIds: [E(1), E(2), E(3)] },
        { entityType: 'device', entityValue: 'ws-355', startTime: '2026-09-27T09:00:00Z', endTime: '2026-09-27T09:30:00Z', timestamp: stamp(2), query: 'taskName = UpdateHealth', resultEventIds: [E(7), E(8)] },
      ],
      savedQueries: [{ id: 'M06-SAVED-QUERY-000001', name: 'UpdateHealth runs', query: 'taskName = UpdateHealth' }],
      savedQueryRuns: [{ savedQueryId: 'M06-SAVED-QUERY-000001', name: 'UpdateHealth runs', query: 'taskName = UpdateHealth', resultEventIds: [E(1), E(7)], timestamp: stamp(3) }],
      pivots: [{ fromEventId: E(1), toEventId: E(2), field: 'relatedEventIds', value: E(2), timestamp: stamp(4) }],
      bookmarks: [E(1), E(3)],
      collections: [{ id: 'M06-COLLECTION-000001', name: 'Suspicious chain', eventIds: [E(1), E(3), E(5)] }],
      mappings: [
        { tacticId: 'TA0002', techniqueId: 'T1053.005', status: 'supported', confidence: 70, eventIds: [E(1), E(2)], rationale: 'The task ran and started the script process.' },
        { tacticId: 'TA0002', techniqueId: 'T1059.001', status: 'supported', confidence: 80, eventIds: [E(3)], rationale: 'powershell.exe ran UpdateHealth.ps1.' },
        { tacticId: 'TA0011', techniqueId: 'T1071.001', status: 'unsupported', confidence: 20, eventIds: [E(5)], rationale: 'Only a TCP connection on 443 is recorded; no web request content.' },
        { tacticId: 'TA0011', techniqueId: 'T1105', status: 'unsupported', confidence: 15, eventIds: [E(3), E(5)], rationale: 'Nothing shows a file was downloaded.' },
      ],
      handoffs: [{ id: 'M06-HANDOFF-000001', destination: 'rule', eventIds: [E(1), E(3), E(5)], rationale: 'The task, script and connection form a pattern worth a detection.', recommendation: 'Add a detection for scheduled tasks that launch scripts from user-writable folders.', status: 'proposed', statusHistory: [] }],
      conclusions: [{ id: 'c1', text: 'Suspicious, not proven: the script ran from a task and connected out, but persistence intent and file transfer are not established.', eventIds: [E(1), E(3), E(5)], disposition: 'supported' }],
      actionHistory: [],
    };
    const add = (type, details) => state.actionHistory.push({ type, details });
    const h = state.hypotheses[0];
    add('hypothesis_edit', { hypothesisId: h.id, text: h.text, relatedEventIds: h.relatedEventIds });
    state.queryHistory.forEach((q) => add('query_run', { query: q.query, resultEventIds: q.resultEventIds }));
    add('saved_query_create', { savedQueryId: 'M06-SAVED-QUERY-000001' });
    add('saved_query_run', { savedQueryId: 'M06-SAVED-QUERY-000001', resultEventIds: [E(1), E(7)] });
    add('pivot', { fromEventId: E(1), toEventId: E(2) });
    add('collection', { operation: 'create', collectionId: 'M06-COLLECTION-000001', eventIds: state.collections[0].eventIds });
    state.mappings.forEach((m) => add('attack_mapping_change', { techniqueId: m.techniqueId, tacticId: m.tacticId, status: m.status, eventIds: m.eventIds }));
    add('handoff_proposal', { handoffId: 'M06-HANDOFF-000001', eventIds: state.handoffs[0].eventIds });
    add('conclusion', { text: state.conclusions[0].text, eventIds: state.conclusions[0].eventIds });
    return { ...state, ...overrides };
  };
  const score = (state) => clone(run(`SocM06AssessmentScorer.score(${JSON.stringify(state)}, SocM06AssessmentData)`));
  const workOf = (state) => clone(run(`moduleSixAssessmentWork(${JSON.stringify(state)})`));
  const display = (ticket) => clone(run(`caseRecordDisplay(${JSON.stringify(ticket)}, moduleSixBackdoorCaseSpec())`));

  const GOOD_NOTES = 'On ws-318 the UpdateHealth task ran as acct-184 and started UpdateHealth.ps1, an unsigned script in a user-writable folder, which then connected to 198.51.100.88. '
    + 'The comparison host ws-355 ran the same task name as signed, approved maintenance (CHG-2048). Persistence intent and file transfer are not established. '
    + 'Escalating ws-318 to Endpoint/EDR Response to contain it and preserve the task and script as evidence.';
  const ticket = (overrides = {}) => ({
    status: 'in-progress', severity: 'high', affectedUser: 'acct-184', affectedDevice: 'ws-318', disposition: 'true-positive',
    escalation: 'required', escalateTo: 'endpoint-response', notes: GOOD_NOTES,
    findings: { evidencePriority: 'task-metadata', scopeAssessment: 'ws318-only', responseAction: 'escalate' },
    submitted: true, submittedAt: '2026-10-17T10:12:00.000Z', caseId: 'CASE-066318', actionHistory: [],
    ...overrides,
  });
  const row = (id, t, state, scoreOverride, extra = {}) => {
    const scored = score(state);
    return {
      id, lab_key: 'lab-threat-hunt-independent', track_code: 'SOCAN', student_id: '9334491415-SOCAN',
      score: scoreOverride === undefined ? scored.score : scoreOverride, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 },
      result: {
        rubric_version: scored.rubricVersion, breakdown: scored.criteria, feedback: scored.review.feedback,
        review_payload: { ...scored, caseId: 'CASE-066318' }, critical_errors: scored.criticalMisses,
        case_record: t, case_display: display(t), case_summary: '', assessment_work: workOf(state), ...extra,
      },
    };
  };

  const perfect = row('m06-pass', ticket(), huntState());
  assert.equal(perfect.score, 100, 'the hand-built hunt earns full marks from the real scorer');

  // Wrong everything: bad ticket, empty hunt, and an unsupported certainty claim.
  const overclaim = huntState({ hypotheses: [], queryHistory: [], savedQueries: [], savedQueryRuns: [], pivots: [], collections: [], mappings: [], handoffs: [], conclusions: [{ id: 'c1', text: 'C2 confirmed on ws-318, everything is compromised.', eventIds: [E(5)], disposition: 'supported' }], actionHistory: [{ type: 'conclusion', details: { text: 'C2 confirmed on ws-318, everything is compromised.', eventIds: [E(5)] } }] });
  const failingTicket = ticket({
    status: 'resolved', severity: 'low', affectedUser: 'acct-27', affectedDevice: 'WS-214', disposition: 'false-positive', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine <script>alert(1)</script> closed it', findings: { evidencePriority: 'all-logs', scopeAssessment: 'fleet-wide', responseAction: 'wipe' },
  });
  const failing = row('m06-fail', failingTicket, overclaim);

  // Partial credit: only the lead host was searched (no comparison), user is the pivot account,
  // routed to Tier 2 (acceptable fit), no ATT&CK "unsupported" assessment.
  const partialState = huntState();
  partialState.queryHistory = [partialState.queryHistory[0]];
  partialState.actionHistory = partialState.actionHistory.filter((a) => !(a.type === 'query_run' && a.details.resultEventIds.includes(E(7))));
  const partial = row('m06-partial', ticket({ affectedUser: 'acct-271', escalateTo: 'tier2-soc' }), partialState);

  // Older attempt: submitted before assessment_work and case_display existed.
  const older = row('m06-older', ticket(), huntState());
  delete older.result.assessment_work;
  delete older.result.case_display;

  return [
    {
      name: 'M06 correct hunt and ticket recommends PASS with no prefilled notes',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: {
          'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', 'ticket-findings': 'pass',
          notes: 'pass', 'hunt-hypothesis': 'pass', 'hunt-scope': 'pass', 'hunt-pivots': 'pass', 'hunt-evidence': 'pass', 'hunt-attack': 'pass', 'hunt-handoff': 'pass', 'hunt-conclusion': 'pass',
        },
        feedback: [],
        html: ['Recommend PASS', 'CASE-066318', 'Endpoint/EDR Response', 'Confirmed malicious activity', 'T1053.005', 'T1105', 'Unsupported', '9 of 9 found',
          'Testable hypothesis', '15 of 15 points', /data-sheet-narrative-text>On ws-318 the UpdateHealth task/, /data-sheet-narrative="hunt-hypothesis:0"/, 'Suspicious chain', 'M06-EVT-003'],
        notHtml: ['true-positive', 'endpoint-response', 'ws318-only', 'task-metadata'],
      },
    },
    {
      name: 'M06 wrong ticket and empty hunt recommends RETURN with a note per section',
      row: failing,
      expect: {
        verdict: 'return',
        sections: {
          'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'fail', disposition: 'fail', escalation: 'fail', 'ticket-findings': 'fail', notes: 'fail',
          'hunt-hypothesis': 'fail', 'hunt-scope': 'fail', 'hunt-pivots': 'fail', 'hunt-evidence': 'fail', 'hunt-attack': 'fail', 'hunt-handoff': 'fail', 'hunt-conclusion': 'fail',
        },
        html: ['Recommend RETURN', 'Set Severity to High', 'Put acct-184 in Affected user', 'Set Escalation to Required', '&lt;script&gt;', 'Proofread:',
          'Keep the scope to ws-318', 'Wiping every host or closing it as benign is not supported', 'No searches saved', 'the scorer caps the score at 69'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((item) => item.item_label === 'Affected device').comment, /Put ws-318 in Affected device/);
        assert.match(suggested.find((item) => item.item_label === 'Conclusion & limits').comment, /command-and-control/);
      },
    },
    {
      name: 'M06 partial-credit paths still recommend PASS and prefill "to strengthen" notes',
      row: partial,
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', escalation: 'partial', 'hunt-scope': 'partial', severity: 'pass', notes: 'pass' },
        feedback: ['Affected user', 'Escalation & route', 'Hunt scope & benign comparison'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Searched a benign comparison host (ws-355)'],
      },
    },
    {
      name: 'M06 older attempt without assessment_work or case_display shows Not recorded',
      row: older,
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', notes: 'pass', 'hunt-hypothesis': 'pass', 'hunt-scope': 'pass', 'hunt-attack': 'pass' },
        html: ['Not recorded in this attempt', 'Events credited by the scorer', 'Confirmed malicious activity', 'Endpoint/EDR Response'],
        notHtml: ['true-positive', 'endpoint-response'],
      },
    },
    {
      name: 'M06 attempt with no ticket or hunt record at all does not crash',
      row: { id: 'm06-empty', lab_key: 'lab-threat-hunt-independent', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: {} },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing', 'hunt-hypothesis': 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M06 read-only record shows the feedback that was sent',
      row: { ...failing, reviewed_at: '2026-10-18T09:00:00.000Z' },
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

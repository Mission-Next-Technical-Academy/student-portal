/* Module 07 Prove It (lab-email-triage / lab-network-investigation /
 * lab-network-email-independent, CASE-070731) synthetic attempts for
 * tests/admin-submission-sheet.test.js. One submit writes the same result to all
 * three rows, so cases pass an item with sibling rows. Scores come from the real
 * SocM07AssessmentScorer run over a hand-built investigation state; ticket display
 * rows come from the module's own caseRecordDisplay + case spec. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');
const KEYS = ['lab-email-triage', 'lab-network-investigation', 'lab-network-email-independent'];

module.exports = ({ run, clone }) => {
  const defined = (name) => run(`typeof ${name} !== 'undefined'`);
  const loadScript = (file, marker) => { if (defined(marker)) return; try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; } };
  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-07.js'), 'utf8');
  const loadConst = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nconst ${name} = `);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-07.js`);
    const rest = source.slice(start + 1);
    const first = rest.split('\n')[0];
    if (/;\s*$/.test(first)) { run(first); return; }
    run(rest.slice(0, rest.search(/\n[\]}];\n/) + 3));
  };
  const loadFunction = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nfunction ${name}(`);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-07.js`);
    const rest = source.slice(start + 1);
    run(rest.slice(0, rest.indexOf('\n}\n') + 3));
  };
  loadScript('soc-assessment-scorer.js', 'SocAssessmentScorer');
  loadScript('soc-m07-assessment-data.js', 'SocM07AssessmentData');
  loadScript('soc-m07-assessment-actions.js', 'SocM07AssessmentActions');
  loadScript('soc-m07-assessment-rubric.js', 'SocM07AssessmentRubric');
  loadScript('soc-m07-assessment-scorer.js', 'SocM07AssessmentScorer');
  ['MODULE_SEVEN_CASE_ID', 'MODULE_SEVEN_INCIDENT_ID', 'MODULE_SEVEN_ENTITY_ROSTER', 'MODULE_SEVEN_DEPARTMENT_OPTIONS', 'MODULE_SEVEN_ANSWER_KEY'].forEach(loadConst);
  loadFunction('moduleSevenProveItSpec');
  loadFunction('moduleSevenAssessmentWork');

  // Additive payload gap fixed in S3: the submit now saves assessment_work.
  assert.match(source, /assessment_work: moduleSevenAssessmentWork\(huntState\)/, 'M07 submit saves assessment_work');

  const T = '2026-09-27T10:';
  const NOTE = 'Opened and checked.';
  // A complete, correct investigation (what the console would have saved).
  const huntState = (mutate) => {
    const history = [];
    const add = (type, details) => history.push({ type, details });
    add('message_review', { messageId: 'M07-MSG-001', reviewed: true, note: 'Sender domain does not match the brand and DMARC failed.' });
    add('artifact_review', { artifactId: 'M07-URL-001', reviewed: true, note: NOTE });
    ['M07-QR-014', 'M07-DNS-001', 'M07-TLS-001', 'M07-DNS-002'].forEach((eventId) => add('network_review', { eventId, reviewed: true, note: eventId === 'M07-DNS-002' ? 'Normal payroll lookup, unrelated.' : NOTE }));
    add('pivot', { fromEventId: 'M07-QR-014', toEventId: 'M07-DNS-001', field: 'relatedEvent', value: 'M07-QR-014' });
    ['M07-DELIVERY-001', 'M07-DELIVERY-002', 'M07-QR-014', 'M07-DNS-001', 'M07-TLS-001'].forEach((eventId) => add('evidence_change', { operation: 'add', eventId, reason: 'Part of the confirmed chain.' }));
    const incident = {
      operation: 'create', incidentId: 'M07-INCIDENT-0001', title: 'QR invoice phishing: acct-63',
      summary: 'acct-63 received the QR invoice, opened it and clicked; ws-517 then resolved invoice-qr.example to 203.0.113.88. Endpoint execution and credential compromise are not established.',
      assessment: 'unknown', recipientIds: ['acct-63'], deviceIds: ['ws-517'], eventIds: ['M07-QR-014', 'M07-DNS-001', 'M07-TLS-001', 'M07-DELIVERY-001'],
    };
    add('incident_link', incident);
    const state = { actionHistory: history, scope: { recipientIds: ['acct-63'], deviceIds: ['ws-517'] }, recipientSearch: { query: '', delivery: 'delivered', interaction: 'clicked', limit: 100 }, incidentLinks: [incident] };
    if (mutate) mutate(state, add);
    return state;
  };
  const score = (state) => clone(run(`SocM07AssessmentScorer.score(${JSON.stringify(state)}, SocM07AssessmentData)`));
  const workOf = (state) => clone(run(`moduleSevenAssessmentWork(${JSON.stringify(state)})`));
  const display = (ticket) => clone(run(`caseRecordDisplay(${JSON.stringify(ticket)}, moduleSevenProveItSpec())`));

  const GOOD_NOTES = 'billing@northwind-billing.example sent a QR invoice that failed DMARC. It was delivered to acct-63 and blocked for acct-82. acct-63 opened it and clicked; ws-517 then looked up invoice-qr.example (203.0.113.88) and opened a TLS session. '
    + 'The ws-204 payroll lookup is a benign lookalike and was ruled out. Endpoint execution and stolen credentials are not established. Escalating to Tier 2 SOC to investigate the endpoint and reset the account.';
  const ticket = (overrides = {}) => ({
    status: 'in-progress', severity: 'critical', affectedUser: 'acct-63', affectedDevice: 'ws-517', disposition: 'true-positive',
    escalation: 'required', escalateTo: 'tier2-soc-net', notes: GOOD_NOTES, findings: {},
    submitted: true, submittedAt: '2026-10-17T10:12:00.000Z', caseId: 'CASE-070731', actionHistory: [],
    ...overrides,
  });
  const result = (t, state, extra = {}) => {
    const scored = score(state);
    return {
      scored,
      payload: {
        rubric_version: scored.rubricVersion, breakdown: scored.criteria, feedback: scored.review.feedback,
        review_payload: { ...scored, caseId: 'CASE-070731' }, critical_errors: scored.criticalMisses,
        case_record: t, case_display: display(t), case_summary: '', assessment_work: workOf(state), ...extra,
      },
    };
  };
  // Three identical rows, one per lab key (what recordLabAttempt writes); the sheet renders the lead.
  const rows = (id, t, state, scoreOverride, extra) => {
    const { scored, payload } = result(t, state, extra);
    const make = (labKey) => ({
      id: `${id}-${labKey}`, lab_key: labKey, track_code: 'SOCAN', student_id: '9334491415-SOCAN',
      score: scoreOverride === undefined ? scored.score : scoreOverride, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 }, result: payload,
    });
    const all = KEYS.map(make);
    return { lead: all[2], all };
  };
  const item = ({ lead, all }) => ({ lead, rows: all, ids: all.map((r) => r.id) });

  const perfect = rows('m07-pass', ticket(), huntState());
  assert.equal(perfect.lead.score, 100, 'the hand-built investigation earns full marks from the real scorer');

  const failingState = huntState((state, add) => {
    state.actionHistory = state.actionHistory.filter((a) => a.type !== 'evidence_change' && a.type !== 'pivot' && a.type !== 'network_review');
    const bad = { operation: 'update', incidentId: 'M07-INCIDENT-0001', title: 'Everything', summary: 'Payload execution confirmed and credential compromise confirmed.', assessment: 'supported', recipientIds: ['acct-63', 'acct-17'], deviceIds: ['ws-517'], eventIds: ['M07-DNS-002', 'M07-TLS-002'] };
    state.actionHistory = state.actionHistory.filter((a) => a.type !== 'incident_link');
    state.actionHistory.push({ type: 'incident_link', details: { ...bad, operation: 'create' } });
    state.incidentLinks = [bad];
  });
  const failingTicket = ticket({
    status: 'resolved', severity: 'low', affectedUser: 'acct-17', affectedDevice: 'ws-204', disposition: 'false-positive', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine <script>alert(1)</script> closed it',
  });
  const failing = rows('m07-fail', failingTicket, failingState, 5);

  // Partial credit: pivot account, blocked-recipient record not preserved, Tier 2 / App Sec route (acceptable fit).
  const partialState = huntState();
  partialState.actionHistory = partialState.actionHistory.filter((a) => !(a.type === 'evidence_change' && a.details.eventId === 'M07-DELIVERY-002'));
  const partial = rows('m07-partial', ticket({ affectedUser: 'acct-82', escalateTo: 'app-sec' }), partialState);

  // Older attempt: no assessment_work, no case_display.
  const older = rows('m07-older', ticket(), huntState());
  delete older.lead.result.assessment_work;
  delete older.lead.result.case_display;

  return [
    {
      name: 'M07 correct investigation recommends PASS and notes the three sibling rows',
      row: perfect.lead,
      item: item(perfect),
      expect: {
        verdict: 'pass',
        sections: {
          'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', route: 'pass', notes: 'pass',
          'review-notes': 'judgment', 'delivery-scope': 'pass', chain: 'pass', noise: 'pass', incident: 'pass', unknowns: 'pass',
        },
        feedback: [],
        html: ['Recommend PASS', 'CASE-070731 · INC-071042', '3 lab records with identical answers', 'Tier 2 SOC — Network Intrusion', 'Confirmed malicious activity', '9 of 9 found',
          'Message-to-network chain', 'opened it and clicked the link', 'Unknown / not yet verified', 'QR invoice phishing: acct-63', /data-sheet-narrative-text>billing@northwind-billing/, /data-sheet-narrative="incident:0"/],
        notHtml: ['true-positive', 'tier2-soc-net', 'in-progress', 'blocked_at_gateway'],
      },
    },
    {
      name: 'M07 wrong ticket and overclaiming incident recommends RETURN with a note per section',
      row: failing.lead,
      item: item(failing),
      expect: {
        verdict: 'return',
        sections: {
          'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'fail', disposition: 'fail', escalation: 'fail', notes: 'fail',
          'delivery-scope': 'fail', chain: 'fail', noise: 'fail', incident: 'fail', unknowns: 'fail',
        },
        html: ['Recommend RETURN', 'Put acct-63 in Affected user', 'Set Escalation to Required', '&lt;script&gt;', 'Proofread:', 'Payload execution confirmed', 'the scorer caps the score at 69', 'Attach M07-QR-014'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((entry) => entry.item_label === 'Affected device').comment, /Put ws-517 in Affected device/);
        assert.match(suggested.find((entry) => entry.item_label === 'What is still unknown').comment, /payload executed/);
      },
    },
    {
      name: 'M07 partial-credit paths still recommend PASS and prefill "to strengthen" notes',
      row: partial.lead,
      item: item(partial),
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', route: 'partial', 'delivery-scope': 'partial', chain: 'pass', notes: 'pass' },
        feedback: ['Affected user', 'Route to department', 'Who received the message'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Add the gateway-block record for acct-82'],
      },
    },
    {
      name: 'M07 older attempt without assessment_work or case_display shows Not recorded',
      row: older.lead,
      item: item(older),
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', notes: 'pass', chain: 'pass', 'delivery-scope': 'pass', noise: 'pass', incident: 'pass', unknowns: 'pass' },
        html: ['Not recorded in this attempt', 'Events credited by the scorer', 'Tier 2 SOC — Network Intrusion'],
        notHtml: ['tier2-soc-net', 'true-positive'],
      },
    },
    {
      name: 'M07 attempt with no ticket or investigation record at all does not crash',
      row: { id: 'm07-empty', lab_key: 'lab-network-email-independent', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: {} },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing', chain: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M07 read-only record shows the feedback that was sent',
      row: { ...failing.lead, reviewed_at: '2026-10-18T09:00:00.000Z' },
      item: item(failing),
      readOnly: true,
      sentFeedback: [{ item_label: 'Escalation', comment: 'Set Escalation to Required <b>now</b>.' }],
      expect: {
        verdict: 'return',
        html: ['Teacher notes sent to the student', 'Set Escalation to Required &lt;b&gt;now&lt;/b&gt;.', 'Reviewed'],
        notHtml: ['data-sheet-notes'],
      },
    },
  ];
};

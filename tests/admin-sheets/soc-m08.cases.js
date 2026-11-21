/* Module 08 Prove It (lab-vuln-prioritization / lab-vuln-queue, CASE-080842)
 * synthetic attempts for tests/admin-submission-sheet.test.js. One submit writes
 * the same result to both rows, so cases pass an item with sibling rows. Scores
 * come from the real SocM08AssessmentScorer run over a hand-built state; ticket
 * display rows come from the module's own caseRecordDisplay + case spec. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');
const KEYS = ['lab-vuln-prioritization', 'lab-vuln-queue'];

module.exports = ({ run, clone }) => {
  const defined = (name) => run(`typeof ${name} !== 'undefined'`);
  const loadScript = (file, marker) => { if (defined(marker)) return; try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; } };
  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-08.js'), 'utf8');
  const loadConst = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nconst ${name} = `);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-08.js`);
    const rest = source.slice(start + 1);
    const first = rest.split('\n')[0];
    if (/;\s*$/.test(first)) { run(first); return; }
    run(rest.slice(0, rest.search(/\n[\]}];\n/) + 3));
  };
  const loadFunction = (name) => {
    if (defined(name)) return;
    const start = source.indexOf(`\nfunction ${name}(`);
    assert.ok(start >= 0, `${name} found in soc-analyst-module-08.js`);
    const rest = source.slice(start + 1);
    run(rest.slice(0, rest.indexOf('\n}\n') + 3));
  };
  loadScript('soc-assessment-scorer.js', 'SocAssessmentScorer');
  loadScript('soc-m08-assessment-data.js', 'SocM08AssessmentData');
  loadScript('soc-m08-assessment-rubric.js', 'SocM08AssessmentRubric');
  loadScript('soc-m08-assessment-scorer.js', 'SocM08AssessmentScorer');
  ['MODULE_EIGHT_CASE_ID', 'MODULE_EIGHT_ENTITY_ROSTER', 'MODULE_EIGHT_DISPOSITION_OPTIONS', 'MODULE_EIGHT_DEPARTMENT_OPTIONS', 'MODULE_EIGHT_ANSWER_KEY'].forEach(loadConst);
  loadFunction('moduleEightProveItSpec');
  loadFunction('moduleEightAssessmentWork');

  // Additive payload gap fixed in S3: the submit now saves assessment_work.
  assert.match(source, /assessment_work: moduleEightAssessmentWork\(huntState\)/, 'M08 submit saves assessment_work');

  const F1 = 'M08-FINDING-001';
  const F2 = 'M08-FINDING-002';
  const F3 = 'M08-FINDING-003';
  // A complete, correct state (what the console would have saved).
  const huntState = (mutate) => {
    const history = [];
    const state = { findingReviews: [], remediationDecisions: [], remediationTransitions: [], incidentLinks: [], riskAcceptances: [], escalations: [], actionHistory: history };
    const add = (type, details, list) => { history.push({ type, details }); if (list) state[list].push({ ...details, actionId: `a${history.length}`, timestamp: '2026-09-27T10:50:00.000Z' }); };
    add('finding_review', { findingId: F1, status: 'reviewed', evidenceIds: ['M08-EVID-002'], notes: 'The package inventory confirms Apache 2.4.49 on web-dmz-14.' }, 'findingReviews');
    add('finding_review', { findingId: F2, status: 'needs-validation', evidenceIds: ['M08-EVID-004', 'M08-EVID-005'], notes: 'The scan is from June and nobody has collected the current version.' }, 'findingReviews');
    add('finding_review', { findingId: F3, status: 'not-applicable', evidenceIds: ['M08-EVID-008'], notes: 'SMBv1 is not enabled on this host.' }, 'findingReviews');
    add('incident_link', { findingId: F1, incidentId: 'M08-INCIDENT-001', evidenceIds: ['M08-INC-EVID-001'], rationale: 'Incident triage is tracking this exposed web service.' }, 'incidentLinks');
    add('risk_acceptance', { findingId: F2, dispositionId: 'M08-RISK-DISP-001', rationale: 'A temporary exception is approved while applicability is validated.', evidenceIds: ['M08-RISK-EVID-001'] }, 'riskAcceptances');
    add('escalation', { findingId: F1, routeId: 'security-lead-review', ownerId: 'p.diallo', dueDate: '2026-09-29', rationale: 'Exploitable and reachable, needs the owner to patch.', evidenceIds: ['M08-EVID-003', 'M08-ASSET-EVID-002'] }, 'escalations');
    add('remediation_decision', {
      findingId: F1, priority: 'critical', status: 'in-progress', ownerId: 'p.diallo', dueDate: '2026-09-29',
      rationale: 'Internet-facing, business critical, public exploit; the patch is approved but not applied.',
      evidenceIds: ['M08-EVID-002', 'M08-EVID-003', 'M08-ASSET-EVID-001', 'M08-ASSET-EVID-002', 'M08-ASSET-EVID-003', 'M08-ASSET-EVID-004'],
    }, 'remediationDecisions');
    if (mutate) mutate(state);
    return state;
  };
  const score = (state) => clone(run(`SocM08AssessmentScorer.score(${JSON.stringify(state)}, SocM08AssessmentData)`));
  const workOf = (state) => clone(run(`moduleEightAssessmentWork(${JSON.stringify(state)})`));
  const display = (ticket) => clone(run(`caseRecordDisplay(${JSON.stringify(ticket)}, moduleEightProveItSpec())`));

  const GOOD_NOTES = 'web-dmz-14 (owner p.diallo) runs Apache 2.4.49 with CVE-2021-41773; it is internet-facing and business critical, so the priority is Critical, not CVSS alone. '
    + 'The OpenSSL finding on app-dmz-22 (CVE-2022-3786) is stale and unverified, and the SMBv1 finding (CVE-2017-0144) does not apply. '
    + 'Change CHG-5521 is approved but not applied yet. Escalated to Patch and Remediation Operations with p.diallo as owner, due 2026-09-29.';
  const ticket = (overrides = {}) => ({
    status: 'in-progress', severity: 'critical', affectedUser: 'p.diallo', affectedDevice: 'web-dmz-14', disposition: 'validated-exploitable',
    escalation: 'required', escalateTo: 'patch-ops', notes: GOOD_NOTES, findings: {},
    submitted: true, submittedAt: '2026-10-17T10:12:00.000Z', caseId: 'CASE-080842', actionHistory: [],
    ...overrides,
  });
  const rows = (id, t, state, scoreOverride, extra = {}) => {
    const scored = score(state);
    const payload = {
      rubric_version: scored.rubricVersion, breakdown: scored.criteria, feedback: scored.review.feedback,
      review_payload: { ...scored, caseId: 'CASE-080842' }, critical_errors: scored.criticalMisses || [],
      case_record: t, case_display: display(t), case_summary: '', assessment_work: workOf(state), ...extra,
    };
    const all = KEYS.map((labKey) => ({
      id: `${id}-${labKey}`, lab_key: labKey, track_code: 'SOCAN', student_id: '9334491415-SOCAN',
      score: scoreOverride === undefined ? scored.score : scoreOverride, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 }, result: payload,
    }));
    return { lead: all[1], all };
  };
  const item = ({ lead, all }) => ({ lead, rows: all, ids: all.map((r) => r.id) });

  const perfect = rows('m08-pass', ticket(), huntState());
  assert.equal(perfect.lead.score, 100, 'the hand-built state earns full marks from the real scorer');

  // Wrong everything: the stale and irrelevant findings confirmed, wrong priority, no links.
  const failingState = huntState((state) => {
    state.findingReviews = [
      { findingId: F1, status: 'not-applicable', evidenceIds: ['M08-EVID-002'], notes: 'ignore' },
      { findingId: F2, status: 'reviewed', evidenceIds: ['M08-EVID-004'], notes: 'looks bad' },
      { findingId: F3, status: 'reviewed', evidenceIds: ['M08-EVID-008'], notes: '' },
    ];
    state.incidentLinks = []; state.riskAcceptances = []; state.escalations = [];
    state.remediationDecisions = [{ findingId: F1, priority: 'low', status: 'open', ownerId: 'p.diallo', dueDate: '2026-09-29', rationale: 'low risk', evidenceIds: ['M08-EVID-001'] }];
    state.actionHistory = [];
  });
  const failingTicket = ticket({
    status: 'resolved', severity: 'low', affectedUser: 'ops-oncall', affectedDevice: 'wks-501', disposition: 'false-positive', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine <script>alert(1)</script> closed it',
  });
  const failing = rows('m08-fail', failingTicket, failingState, 10, { critical_errors: ['escalation-not-required'] });

  // Partial credit: only three of the four asset-context kinds cited, pivot user, acceptable route.
  const partialState = huntState((state) => {
    const decision = state.remediationDecisions[0];
    decision.evidenceIds = decision.evidenceIds.filter((id) => id !== 'M08-ASSET-EVID-004');
    state.actionHistory.find((a) => a.type === 'remediation_decision').details.evidenceIds = decision.evidenceIds;
  });
  const partial = rows('m08-partial', ticket({ affectedUser: 'j.moreau', escalateTo: 'appsec' }), partialState);

  // Older attempt: no assessment_work, no case_display.
  const older = rows('m08-older', ticket(), huntState());
  delete older.lead.result.assessment_work;
  delete older.lead.result.case_display;
  older.all.forEach((r) => { r.completed_at = '2026-10-01T10:12:00.000Z'; });

  return [
    {
      name: 'M08 correct prioritization recommends PASS and notes the sibling rows',
      row: perfect.lead,
      item: item(perfect),
      expect: {
        verdict: 'pass',
        sections: {
          'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', notes: 'pass',
          'finding-review': 'pass', 'asset-context': 'pass', 'incident-link': 'pass', 'risk-acceptance': 'pass', 'escalation-route': 'pass', remediation: 'pass',
        },
        feedback: [],
        html: ['Recommend PASS', 'CASE-080842', '2 lab records with identical answers', 'Patch &amp; Remediation Operations', 'Validated — exploitable, confirmed internet-reachable finding', '9 of 9 found',
          'CVE-2021-41773 Apache HTTP Server on web-dmz-14', 'Needs validation', 'Business importance', 'Security lead review', /data-sheet-narrative-text>web-dmz-14 \(owner p\.diallo\)/],
        notHtml: ['validated-exploitable', 'patch-ops', 'security-lead-review', 'needs-validation', 'in-progress'],
      },
    },
    {
      name: 'M08 wrong ticket and findings recommends RETURN with a note per section',
      row: failing.lead,
      item: item(failing),
      expect: {
        verdict: 'return',
        sections: {
          'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'fail', disposition: 'fail', escalation: 'fail', notes: 'fail',
          'finding-review': 'fail', 'asset-context': 'fail', 'incident-link': 'fail', 'risk-acceptance': 'fail', 'escalation-route': 'fail', remediation: 'fail',
        },
        html: ['Recommend RETURN', 'Set Severity to Critical', 'Put p.diallo in Affected user', 'Set Escalation to Required', '&lt;script&gt;', 'Proofread:',
          'Do not confirm a finding you could not validate', 'Set the priority to Critical', 'Critical errors flagged by the scorer'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((entry) => entry.item_label === 'Affected device').comment, /Put web-dmz-14 in Affected device/);
        assert.match(suggested.find((entry) => entry.item_label === 'Finding review: current, stale, not applicable').comment, /CVE-2022-3786 on app-dmz-22: You marked it “Reviewed”\. Mark it “Needs validation”: the scan is from before this review window/);
        assert.doesNotMatch(suggested.map((entry) => entry.comment).join(' '), /current and applicable|stale or unverified/, 'notes use the Status labels the student saw');
      },
    },
    {
      name: 'M08 partial-credit paths still recommend PASS and prefill "to strengthen" notes',
      row: partial.lead,
      item: item(partial),
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', escalation: 'partial', 'asset-context': 'partial', 'finding-review': 'pass', remediation: 'pass', notes: 'pass' },
        feedback: ['Affected user', 'Escalation & route', 'Asset context & controls'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Cite the compensating control record for web-dmz-14'],
      },
    },
    {
      name: 'M08 older attempt without assessment_work or case_display shows Not recorded',
      row: older.lead,
      item: item(older),
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', notes: 'pass', 'finding-review': 'pass', 'asset-context': 'pass', remediation: 'pass' },
        html: ['Not recorded in this attempt (submitted before 2026-10-17)', 'Events credited by the scorer', 'Patch &amp; Remediation Operations', 'Validated — exploitable, confirmed internet-reachable finding'],
        notHtml: ['patch-ops', 'validated-exploitable'],
      },
    },
    {
      name: 'M08 attempt with no ticket or work record at all does not crash',
      row: { id: 'm08-empty', lab_key: 'lab-vuln-queue', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: {} },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing', remediation: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M08 read-only record shows the feedback that was sent',
      row: { ...failing.lead, reviewed_at: '2026-10-18T09:00:00.000Z' },
      item: item(failing),
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

/* Module 03 Prove It (lab-siem-triage, CASE-MN-517 / INC-MN-517) synthetic
 * attempts. The module scorer (moduleThreeScoreAssessment, in
 * portal/soc-analyst-module-03-environment.js) is loaded into the test VM so
 * scores and breakdowns here are the scorer's own output, not hand-typed. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');
// The console files declare top-level consts; another module's cases file may
// have loaded the shared ones already, which only raises "already declared"
// (before anything executes), so that error is safe to ignore.
const FILES = ['kql-engine.js', 'soc-console-core.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-alert-queue-ui.js', 'soc-analyst-module-03-environment.js'];

module.exports = ({ run, clone }) => {
  run(`var moduleThreeState = { console: {} }, moduleThreeSave = () => {}, guidedLabDebrief = () => '', guidedLabGuide = () => '', MODULE_THREE_FLAG = 'F', MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage', moduleThreeUser = {}, recordLabAttempt = () => {};
    if (typeof document === 'undefined') { var document = { getElementById: () => ({ textContent: '' }), querySelector: () => null }; }`);
  for (const file of FILES) {
    try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; }
  }
  // In the browser the module files load before the sheet definitions; mirror that order here.
  run(fs.readFileSync(path.join(PORTAL, 'admin-sheets', 'soc-m03.js'), 'utf8'));
  assert.equal(run('typeof moduleThreeScoreAssessment'), 'function', 'M03 scorer loaded into the test VM');

  // The submit must keep saving the pieces the sheet reads (additive payload).
  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-03-environment.js'), 'utf8');
  assert.match(source, /query_summary: \{ total: st\.queryLog\.length, sources_queried:/, 'M03 submit saves query_summary');
  assert.match(source, /selected_evidence: evidence\.map\(\(r\) => r\.__rid\)/, 'M03 submit saves selected_evidence');

  const GOOD = {
    observations: 'At 02:03 to 02:10 the IP 203.0.113.77 failed sign-ins for six accounts, then at 02:12 m.ortiz signed in over legacy IMAP with no MFA (A-5012).',
    analysis: 'This is a password spray followed by a takeover: the same IP created an app password, then a forwarding rule to ext-archive@proton-box.example (P-7001) and downloaded Finance files.',
    scope: 'Confirmed: m.ortiz compromised, d.hale credential exposed after the MFA push was denied. The 02:20-02:36 collector gap leaves some activity unconfirmed.',
    nextAction: 'Identity Response should revoke m.ortiz sessions, remove the forwarding rule and app password, block the IP and reset d.hale.',
  };
  const accountStatus = { 'm.ortiz': 'compromised', 'd.hale': 'exposed', 'r.kaur': 'targeted', 'p.sato': 'targeted', 'l.brooks': 'targeted', 'a.morgan': 'targeted', 't.nguyen': 'not-affected' };
  const PINS = ['A-5001', 'A-5002', 'A-5012', 'P-7001', 'P-7002', 'A-5011', 'D-6001'];
  const detOf = (o = {}) => ({
    status: 'in-progress', affectedUser: 'm.ortiz', affectedDevice: 'mail-01', verdict: 'true-positive', disposition: 'true-positive', severity: 'high', priority: 'high',
    accountStatus, indicators: ['203.0.113.77', 'ext-archive@proton-box.example'],
    actions: ['revoke-ortiz', 'remove-rule', 'revoke-apppw', 'reset-hale', 'block-ip', 'legacy-auth', 'notify-owner'],
    escalation: 'required', escalateTo: 'identity-response', handoff: GOOD, notes: 'Escalated to Identity Response with the evidence pinned.', submitted: true,
    actionHistory: [{ action: 'Submitted case for faculty review', at: '2026-10-17T10:12:00.000Z' }],
    ...o,
  });
  const resolutions = (o = {}) => ({
    parentClosed: true,
    children: {
      'INC-MN-517': { disposition: 'true-positive', evidence: 'A-5012 P-7001', note: 'A-5012 is the attacker success and P-7001 the forwarding rule.', resolved: true },
      'INC-MN-518': { disposition: 'benign-positive', evidence: 'A-5018 A-5019', note: 'A-5018 typo then A-5019 success from the usual LAN IP.', resolved: true },
      ...o,
    },
  });
  const links = (ids = ['ALT-5170', 'ALT-5171']) => ids.map((alertId) => ({ alertId, incidentId: 'INC-MN-517', at: '2026-10-17T10:05:00.000Z' }));
  const queryLog = [
    { at: 'x', query: 'AuthLog | where Result == "Failure"', rows: 10, sources: ['AuthLog'], pivot: false },
    { at: 'x', query: 'AppAudit | where SourceIp == "203.0.113.77"', rows: 6, sources: ['AppAudit', 'AuthLog'], pivot: true },
  ];

  // Same shape the submit builds (m03eSubmitAssessment); the score and
  // breakdown come from the module's own scorer.
  function attempt(id, det, { pins = PINS, log = queryLog, link = links(), res = resolutions(), summary = true, display = true, assessment = true } = {}) {
    const caseRecord = { ...det, findings: Object.fromEntries(Object.entries(det.accountStatus).map(([a, v]) => [`account-${a}`, v])), alertIncidentLinks: link, incidentResolutions: res };
    const performance = clone(run(`moduleThreeScoreAssessment(${JSON.stringify({ determination: det, pins, queryLog: log, incidentLinks: link, incidentResolutions: res })})`));
    const statusText = { compromised: 'Compromised (attacker access)', exposed: 'Credential exposed (access blocked)', targeted: 'Targeted only (no valid credential)', 'not-affected': 'Not affected' };
    const label = (a) => clone(run(`M03E_IDENTITY_LABEL[${JSON.stringify(a)}]`));
    const disp = { 'true-positive': 'Confirmed malicious activity', 'benign-positive': 'Benign activity', 'false-positive': 'False positive' };
    const sev = { high: 'High', critical: 'Critical', medium: 'Medium', low: 'Low' };
    const dept = { 'identity-response': 'Identity Response', 'tier2-soc': 'Tier 2 SOC' };
    const result = {
      case_record: caseRecord,
      case_summary: 'summary',
      breakdown: Object.fromEntries([...performance.competencies.map((c) => [c.label, `${c.earned} / ${c.max}`]), ['Automated total', `${performance.total} / 100`], ['Recommended score', `${performance.score} / 100`]]),
      feedback: [], simulator_performance: { competencies: [] },
    };
    if (display) {
      result.case_display = [
        ['Case', 'CASE-MN-517'], ['Status', det.status === 'resolved' ? 'Resolved' : 'In Progress'], ['Severity', sev[det.severity] || 'Not provided'],
        ['Affected user', det.affectedUser || 'Not provided'], ['Affected device', det.affectedDevice || 'Not provided'],
        ['Disposition', disp[det.verdict] || 'Not provided'], ['Escalation required', det.escalation === 'required' ? 'Required' : det.escalation === 'not-required' ? 'Not required' : 'Not provided'],
        ['Route to department', det.escalation === 'required' ? dept[det.escalateTo] || 'Not provided' : 'Not applicable'],
        ...Object.keys(det.accountStatus).map((a) => [label(a), statusText[det.accountStatus[a]] || 'Not provided']),
        ['Alert-to-incident links', link.length ? link.map((l) => `${l.alertId} → ${l.incidentId}`).join('; ') : 'None recorded'],
      ];
    }
    if (assessment) {
      result.assessment = { selected_evidence: pins, pinned_evidence: pins.map((p) => `02:03 AuthLog SignIn x 203.0.113.77 S-1: record ${p}`), query_log: log };
      if (summary) result.assessment.query_summary = { total: log.length, sources_queried: [...new Set(log.flatMap((q) => q.sources))], cross_source_pivot: log.some((q) => q.pivot) };
    }
    return {
      id, lab_key: 'lab-siem-triage', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: performance.score, pass_threshold: 70,
      completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 }, result,
    };
  }

  const perfect = attempt('m03-pass', detOf());
  assert.ok(perfect.score >= 95, `scorer gives the perfect attempt ${perfect.score}`);

  const wrong = attempt('m03-fail', detOf({
    status: 'resolved', affectedUser: 't.nguyen', affectedDevice: 'idp-02', verdict: 'false-positive', disposition: 'false-positive', severity: 'low', priority: 'low',
    accountStatus: { 'm.ortiz': 'targeted', 'd.hale': 'not-affected', 't.nguyen': 'compromised', 'r.kaur': 'not-affected' },
    indicators: ['198.51.100.140', 'S-5601'], actions: ['disable-all', 'purge-logs', 'reset-nguyen'], escalation: 'not-required', escalateTo: '',
    handoff: { observations: 'looks ok', analysis: 'fine <script>alert(1)</script>', scope: 'none', nextAction: 'close' }, notes: '',
  }), { pins: [], log: [], link: links(['ALT-5174']), res: resolutions({ 'INC-MN-518': { disposition: 'true-positive', evidence: '', note: '', resolved: true } }) });

  const partial = attempt('m03-partial', detOf({
    severity: 'medium', priority: 'medium', affectedUser: 'd.hale', affectedDevice: 'docs-01', escalateTo: 'tier2-soc',
    accountStatus: { ...accountStatus, 'd.hale': 'compromised' },
    actions: ['revoke-ortiz', 'remove-rule', 'revoke-apppw', 'reset-hale', 'block-ip'],
  }), { pins: ['A-5001', 'A-5002', 'A-5012', 'P-7001', 'P-7002'], link: links(['ALT-5170']) });

  // F22: the parent correctly left open for Identity Response is not marked down.
  const openParent = attempt('m03-open-parent', detOf(), { res: { ...resolutions(), parentClosed: false } });

  // Older attempt: no assessment block, no case_display, no query_summary.
  const older = attempt('m03-older', detOf(), { display: false, assessment: false });

  // Newer attempt keeps the full query summary even when query_log was cut to 40.
  const trimmed = attempt('m03-trimmed', detOf(), { log: [], summary: false });
  trimmed.result.assessment.query_summary = { total: 55, sources_queried: ['AuthLog', 'AppAudit'], cross_source_pivot: true };
  trimmed.result.assessment.query_log = [];

  return [
    {
      name: 'M03 perfect attempt recommends PASS and every section agrees with the scorer',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: { 'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', route: 'pass', 'account-scope': 'pass', 'other-accounts': 'pass', indicators: 'pass', actions: 'pass', handoff: 'pass', 'alert-links': 'pass', 'child-incidents': 'pass', 'evidence-pinned': 'pass', investigation: 'pass', timeline: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-MN-517 · INC-MN-517', 'm.ortiz (Maria Ortiz, Finance)', 'Compromised (attacker access)', 'Confirmed malicious activity', 'Identity Response', 'ALT-5170', 'INC-MN-518', /data-sheet-narrative="handoff:0"/, 'Indicators the responders need', 'Pinned the forwarding inbox rule'],
        notHtml: ['true-positive', 'identity-response', 'accountStatus', 'revoke-ortiz'],
      },
    },
    {
      name: 'M03 wrong investigation recommends RETURN with a note per failed section',
      row: wrong,
      expect: {
        verdict: 'return',
        sections: { 'case-status': 'fail', severity: 'fail', disposition: 'fail', escalation: 'fail', 'account-scope': 'fail', indicators: 'fail', actions: 'fail', 'alert-links': 'fail', 'child-incidents': 'fail', 'evidence-pinned': 'fail', handoff: 'fail' },
        html: ['Recommend RETURN', 'Mark m.ortiz as Compromised', 'Set Escalation to Required', 'Remove action against t.nguyen', 'Avoided an unsafe step: deleting log evidence', 'Pin the spray failures from 203.0.113.77', '&lt;script&gt;'],
      },
      custom: ({ suggested }) => {
        assert.match(suggested.find((item) => item.item_label === 'Account scope').comment, /Mark m\.ortiz as Compromised/);
        assert.ok(suggested.some((item) => item.item_label === 'Child incident resolutions'));
        // Notes are plain instructions, not "Finish the child incidents: closing …" fragments.
        suggested.forEach((item) => assert.doesNotMatch(item.comment, /Finish the child incidents|Pin the records that prove|Run the searches that show|: (pinned|pivoted|closing|queried|linked) /i, item.item_label));
      },
    },
    {
      name: 'M03 over-stated d.hale, medium severity and a thinner response are partial credit and still PASS',
      row: partial,
      expect: {
        verdict: 'pass',
        sections: { severity: 'partial', 'other-accounts': 'partial', actions: 'partial', 'alert-links': 'partial', 'evidence-pinned': 'partial', 'account-scope': 'pass', disposition: 'pass' },
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Medium under-rates this', 'over-states'],
      },
    },
    {
      name: 'M03 parent left open after both children are resolved passes and prefills no child-incident note',
      row: openParent,
      expect: { verdict: 'pass', sections: { 'case-status': 'pass', 'child-incidents': 'pass' }, feedback: [] },
    },
    {
      name: 'M03 amber notes are short instructions that cite what the student actually did',
      row: partial,
      expect: { verdict: 'pass' },
      custom: ({ suggested }) => {
        const note = (label) => (suggested.find((item) => item.item_label === label) || {}).comment || '';
        assert.match(note('Evidence pinned'), /^To strengthen next time: pin .*\(you pinned A-5001, A-5002, A-5012, P-7001, P-7002\)\.$/);
        assert.match(note('Alert-to-incident links'), /^To strengthen next time: link .*\(you linked ALT-5170\)\.$/);
        suggested.forEach((item) => assert.doesNotMatch(item.comment, /: (pinned|pivoted|closing|queried|linked) /i, item.item_label));
      },
    },
    {
      name: 'M03 older attempt without assessment, display or query summary shows Not recorded',
      row: older,
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', disposition: 'pass', 'account-scope': 'pass', 'evidence-pinned': 'missing', investigation: 'missing' },
        html: ['Not recorded in this attempt', 'Confirmed malicious activity'],
        notHtml: ['true-positive'],
      },
    },
    {
      name: 'M03 technique score survives a query_log trimmed to the last 40',
      row: trimmed,
      expect: {
        verdict: 'pass',
        sections: { investigation: 'pass' },
        html: ['Searches run', '55'],
      },
    },
    {
      name: 'M03 attempt with no case record does not crash',
      row: { id: 'm03-empty', lab_key: 'lab-siem-triage', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: { breakdown: {} } },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', 'account-scope': 'missing', handoff: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
  ];
};

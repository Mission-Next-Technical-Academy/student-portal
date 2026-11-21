/* Module 02 Prove It (lab-identity-investigation, CASE-025502) synthetic
 * attempts. Scores follow caseScore() in portal/soc-analyst-module-02-environment.js:
 * entity 0-20, severity 10, disposition 20, escalation round(fit/100 x 30),
 * access finding 10, notes 10. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const GOOD_NOTES = 'At 08:17 John Smith (jsmith) on wkstn-23 was denied HR-FILE-01, then at 08:27 the same request was allowed under HR-Read. '
  + 'His only group is Operations-Read, so he is not a member of HR-Read and was authorized beyond his entitlements. '
  + 'This is an access-policy problem, not an attack. Escalated to Identity Response to correct the access policy and remove the extra permission.';

module.exports = ({ clone }) => {
  // The answer key lives inside the module IIFE, so the sheet copies it. Fail
  // loudly if the module's key changes without the sheet.
  const source = fs.readFileSync(path.join(__dirname, '..', '..', 'portal', 'soc-analyst-module-02-environment.js'), 'utf8');
  [
    "const CASE_CORRECT = { severity: 'high', disposition: 'policy-violation', escalateTo: 'identity-response', finding: 'excess-auth' };",
    "{ id: 'john', text: 'John Smith (jsmith) — Operations Coordinator', tier: 'principal' }",
    "{ id: 'cora', text: 'Cora Green (cgreen) — Finance Contractor', tier: 'pivot' }",
    "{ id: 'wk23', text: 'wkstn-23 (10.20.4.31) — managed, compliant', tier: 'principal' }",
    "{ id: 'wk09', text: 'wkstn-09 (10.20.4.09) — unmanaged, non-compliant', tier: 'pivot' }",
    "{ id: 'identity-response', text: 'Identity Response', fit: 100",
    "{ id: 'tier2-soc', text: 'Tier 2 SOC', fit: 55",
    "{ id: 'hr-privacy', text: 'HR / Data Privacy', fit: 35",
    "{ id: 'it-helpdesk', text: 'IT Helpdesk', fit: 15",
    'const bounced = escalationOk && department && department.fit < 40;',
    "case_display: caseRecordDisplay(cr, spec)",
  ].forEach((snippet) => assert.ok(source.includes(snippet), `M02 answer key drifted: ${snippet}`));

  const dispText = {
    'policy-violation': 'Confirmed — authorization granted beyond assigned entitlements',
    'expected-access': 'False positive — access matches assigned entitlements',
  };
  const dept = { 'identity-response': 'Identity Response', 'tier2-soc': 'Tier 2 SOC', 'hr-privacy': 'HR / Data Privacy', 'it-helpdesk': 'IT Helpdesk' };
  const findText = {
    'excess-auth': 'Excessive authorization — HR-Read granted without an HR-Read group membership',
    expected: 'Expected access — authorization matches assigned groups',
  };
  const sev = { high: 'High', medium: 'Medium' };
  const stat = { 'in-progress': 'In Progress', resolved: 'Resolved' };
  const cr = (o = {}) => ({
    status: 'in-progress', affectedUser: 'john', affectedDevice: 'wk23', severity: 'high', priority: 'high',
    disposition: 'policy-violation', verdict: 'policy-violation', escalation: 'required', escalateTo: 'identity-response',
    notes: GOOD_NOTES, findings: { 'access-finding': 'excess-auth' }, submitted: true,
    actionHistory: [{ action: 'Submitted case for faculty review', at: '2026-10-17T10:12:00.000Z' }],
    ...o,
  });
  // Same shape as caseRecordDisplay(state, caseSpec) in case-record.js.
  const display = (s) => [
    ['Case', 'CASE-025502'], ['Linked incidents', 'INC-025811'],
    ['Status', stat[s.status] || s.status || 'Not provided'], ['Severity', sev[s.severity] || s.severity || 'Not provided'],
    ['Affected user', s.affectedUser || 'Not provided'], ['Affected device', s.affectedDevice || 'Not provided'],
    ['Disposition', dispText[s.disposition] || s.disposition || 'Not provided'],
    ['Escalation required', s.escalation === 'required' ? 'Required' : s.escalation === 'not-required' ? 'Not required' : 'Not provided'],
    ['Route to department', s.escalation === 'required' ? dept[s.escalateTo] || 'Not provided' : 'Not applicable'],
    ['Access control finding', findText[(s.findings || {})['access-finding']] || 'Not provided'],
  ];
  const row = (id, state, score, extra = {}) => ({
    id, lab_key: 'lab-identity-investigation', track_code: 'SOCAN', student_id: '9334491415-SOCAN',
    score, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 },
    result: state === undefined ? extra : { breakdown: {}, feedback: [], critical_errors: [], case_record: state, case_display: display(state),
      access_review: { selectedEvent: 'CASE-025502 ITSM Incident Ticket', decision: 'Submitted for review', evidenceReferenced: [], analystNote: state.notes }, ...extra },
  });

  const failing = cr({
    status: 'resolved', affectedUser: 'alice', affectedDevice: 'wk17', severity: 'medium', priority: 'medium',
    disposition: 'expected-access', verdict: 'expected-access', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine <script>alert(1)</script> closed it', findings: { 'access-finding': 'expected' },
  });
  const partial = cr({ affectedUser: 'cora', affectedDevice: 'wk09', escalateTo: 'tier2-soc' });
  const older = cr();
  delete older.actionHistory;

  return [
    {
      name: 'M02 perfect investigation recommends PASS',
      row: row('m02-pass', cr(), 100, { breakdown: { affected_entity: 20, severity: 10, disposition: 20, escalation: 30, access_finding: 10, analyst_notes: 10 } }),
      expect: {
        verdict: 'pass',
        sections: { 'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', finding: 'pass', notes: 'pass', timeline: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-025502 · INC-025811', 'John Smith (jsmith) — Operations Coordinator', 'wkstn-23 (10.20.4.31)', 'Excessive authorization', 'Identity Response', '8 of 8 found', '20 / 20', /data-sheet-narrative-text>At 08:17/],
        notHtml: ['policy-violation', 'identity-response', 'excess-auth', 'access_finding', 'Submitted for review'],
      },
    },
    {
      name: 'M02 wrong ticket recommends RETURN with a note per section',
      row: row('m02-fail', failing, 5, { breakdown: { affected_entity: 0, severity: 0, disposition: 0, escalation: 0, access_finding: 0, analyst_notes: 2 }, critical_errors: ['escalation-not-required'] }),
      expect: {
        verdict: 'return',
        sections: { 'case-status': 'fail', severity: 'fail', 'affected-user': 'fail', 'affected-device': 'fail', disposition: 'fail', escalation: 'fail', finding: 'fail', notes: 'fail' },
        feedback: ['Case & status', 'Severity', 'Affected user', 'Affected device', 'Disposition', 'Escalation & route', 'Access control finding', 'Analyst work notes'],
        html: ['Recommend RETURN', 'Set Severity to High', 'Put John Smith in Affected user', 'Put wkstn-23 in Affected device', 'Set Escalation to Required', '&lt;script&gt;', '0 of 8 found', 'Escalation set to “Not required” on a confirmed access-control problem'],
      },
    },
    {
      name: 'M02 related entities and second-best route are partial credit and still PASS',
      row: row('m02-partial', partial, 77),
      expect: {
        verdict: 'pass',
        sections: { 'affected-user': 'partial', 'affected-device': 'partial', escalation: 'partial', severity: 'pass', finding: 'pass' },
        feedback: ['Affected user', 'Affected device', 'Escalation & route'],
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'belongs to Identity Response'],
      },
    },
    {
      name: 'M02 bounced route stays visible as a correction while a 70% score passes',
      row: row('m02-bounce', cr({ escalateTo: 'it-helpdesk' }), 70),
      expect: {
        verdict: 'pass',
        sections: { escalation: 'fail' },
        html: ['IT Helpdesk bounced this'],
      },
    },
    {
      name: 'M02 older attempt without display or timeline shows Not recorded',
      row: (() => { const r = row('m02-older', older, 100); delete r.result.case_display; delete r.result.access_review; return r; })(),
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', finding: 'pass', notes: 'pass' },
        html: ['Not recorded in this attempt', 'High', 'Identity Response', 'In Progress'],
        notHtml: ['policy-violation', 'identity-response'],
      },
    },
    {
      name: 'M02 attempt with no case record does not crash',
      row: row('m02-empty', undefined, null, { breakdown: { affected_entity: 0 } }),
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', 'affected-user': 'missing', finding: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
  ];
};

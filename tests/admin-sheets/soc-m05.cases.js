/* Module 05 Prove It (lab-endpoint-investigation, CASE-055127 / INC-055436)
 * synthetic attempts. The console work is built with the module's own
 * SocM05AssessmentActions.append() (which validates every record) and scored
 * by SocM05AssessmentScorer, so criteria and scores here are the scorer's
 * output, not typed-in numbers. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');
const FILES = ['kql-engine.js', 'soc-console-core.js', 'soc-console-tools.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-alert-queue-ui.js',
  'soc-analyst-module-03-environment.js', 'soc-assessment-scorer.js', 'soc-m05-assessment-data.js', 'soc-m05-assessment-rubric.js', 'soc-m05-assessment-scorer.js', 'soc-m05-assessment-state.js',
  'soc-m05-assessment-actions.js', 'soc-m05-assessment-device-ui.js', 'soc-m05-assessment-console.js', 'soc-analyst-module-05.js'];

module.exports = ({ run, clone }) => {
  run(`if (typeof moduleThreeState === 'undefined') { var moduleThreeState = { console: {} }, moduleThreeSave = () => {}, guidedLabDebrief = () => '', guidedLabGuide = () => '', MODULE_THREE_FLAG = 'F', MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage', moduleThreeUser = {}; }
    if (typeof recordLabAttempt === 'undefined') { var recordLabAttempt = () => {}; }
    if (typeof registerModuleLab === 'undefined') { var registerModuleLab = () => {}; }
    if (typeof document === 'undefined') { var document = { getElementById: () => ({ textContent: '' }), querySelector: () => null }; }`);
  for (const file of FILES) {
    try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; }
  }
  // In the browser the module files load before the sheet definitions; mirror that order.
  run(fs.readFileSync(path.join(PORTAL, 'admin-sheets', 'soc-m05.js'), 'utf8'));
  assert.equal(run('typeof SocM05AssessmentScorer'), 'object', 'M05 scorer loaded into the test VM');
  assert.equal(run('typeof moduleFiveWorkSummary'), 'function', 'M05 work summary loaded');

  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-05.js'), 'utf8');
  assert.match(source, /work_summary: moduleFiveWorkSummary\(assessmentState\)/, 'M05 submit saves work_summary (additive)');
  assert.match(source, /review_payload: reviewPayload/, 'M05 submit still saves review_payload');

  const T = (n) => `2026-10-17T10:${String(n).padStart(2, '0')}:00.000Z`;
  const SHA = 'a'.repeat(64);
  // Builds assessment state with the module's validating append(); each step is [type, details].
  function build(steps) {
    run('var __m05State = SocM05AssessmentState.normalize({}, SocM05AssessmentData);');
    steps.forEach(([type, details], index) => {
      run(`__m05State = SocM05AssessmentActions.append(__m05State, ${JSON.stringify(type)}, ${JSON.stringify(T(index + 1))}, ${JSON.stringify(details)}, SocM05AssessmentData);`);
    });
    return clone(run('__m05State'));
  }
  const goodSteps = [
    // Opening a workstation: the console writes these records itself (soc-console-tools.js PACKS.m05).
    ['device_review', { deviceId: 'ws-assess-27', status: 'selected_for_review', note: 'Pivoted from alert to device.' }],
    ['device_review', { deviceId: 'ws-assess-27', status: 'selected_for_review', note: 'Learner opened device profile and telemetry.' }],
    ['analysis_note', { text: 'Process 4100 (browser) started PowerShell 4172 which started syncsvc.exe 4224. The updater AcmeUpdater is signed and prevalent, so it is benign. The payload created the Run key persistence entry SyncService. The sensor detected the execution but it was not prevented.', relatedDeviceIds: ['ws-assess-27'], relatedEventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003', 'M05-EVT-006'] }],
    ['evidence_package_preserved', { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-001', 'M05-EVT-003', 'M05-EVT-005'], hashes: [SHA] }],
    ['edr_handoff', { deviceIds: ['ws-assess-27'], eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003', 'M05-EVT-006'], hashes: [SHA], summary: 'Unsigned syncsvc.exe ran from PowerShell on ws-assess-27 and created a Run key.', owner: 'SOC analyst', recipient: 'Endpoint/EDR Response', recommendation: 'Isolate ws-assess-27, preserve evidence and remove the persistence.', status: 'submitted' }],
    ['endpoint_isolation_request', { deviceId: 'ws-assess-27', reason: 'Confirmed malware with persistence on this workstation.', requestedBy: 'SOC analyst', status: 'pending_approval' }],
    ['endpoint_quarantine_request', { deviceId: 'ws-assess-27', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: SHA, reason: 'Unsigned payload that set a Run key.', requestedBy: 'SOC analyst', status: 'pending_approval' }],
  ];
  const goodState = build(goodSteps);
  // The "Update handoff" form (Status + Updated by) on the handoff just sent.
  const handoffId = goodState.edrHandoffs[0].id;
  const goodStateUpdated = clone(run(`SocM05AssessmentActions.append(${JSON.stringify(goodState)}, 'edr_handoff_status', '2026-10-17T10:09:00.000Z', ${JSON.stringify({ handoffId, status: 'accepted', updatedBy: 'endpoint-lead' })}, SocM05AssessmentData)`));
  goodState.selectedDeviceIds = ['ws-assess-27'];
  goodState.evidencePackage = { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-001', 'M05-EVT-003', 'M05-EVT-005'], hashes: [SHA] };

  const GOOD_NOTES = 'j.alvarez on ws-assess-27 opened a fake CAPTCHA page; the browser (4100) started PowerShell (4172) which started the unsigned syncsvc.exe (4224). It then created the Run key persistence entry. '
    + 'The sensor detected the execution but did not prevent it, and the signed AcmeUpdater activity is harmless. Recommend Endpoint/EDR Response isolate the workstation, preserve evidence and remove the persistence.';
  const caseRecord = (o = {}) => ({
    caseId: 'CASE-055127', status: 'in-progress', severity: 'high', priority: 'high', affectedUser: 'j.alvarez', affectedDevice: 'ws-assess-27',
    disposition: 'true-positive', verdict: 'true-positive', escalation: 'required', escalateTo: 'endpoint-response', notes: GOOD_NOTES, findings: {}, submitted: true,
    actionHistory: [{ action: 'Submitted case for faculty review', at: '2026-10-17T10:12:00.000Z' }], ...o,
  });

  function attempt(id, state, cr, { work = true, payload = true, display = true } = {}) {
    const scored = clone(run(`SocM05AssessmentScorer.score(${JSON.stringify(state)}, SocM05AssessmentData)`));
    const sev = { high: 'High', medium: 'Medium', low: 'Low', critical: 'Critical' };
    const dept = { 'endpoint-response': 'Endpoint/EDR Response', 'tier2-soc': 'Tier 2 SOC', 'identity-response': 'Identity Response', 'help-desk': 'IT Help Desk' };
    const result = { case_record: cr, case_summary: 'x', notes: cr.notes };
    if (payload) result.review_payload = { score: scored.score, rawScore: scored.rawScore, maxScore: scored.maxScore, passed: scored.passed, criticalMisses: scored.criticalMisses, criteria: scored.criteria, rubricVersion: scored.rubricVersion, caseId: 'CASE-055127', entityIdentity: { affectedUser: 'j.alvarez', affectedDevice: 'ws-assess-27' }, revision: 1, attemptNumber: 1 };
    if (work) result.work_summary = clone(run(`moduleFiveWorkSummary(${JSON.stringify(state)})`));
    if (display) {
      result.case_display = [
        ['Case', 'CASE-055127'], ['Linked incidents', 'INC-055436'], ['Status', cr.status === 'resolved' ? 'Resolved' : 'In Progress'], ['Severity', sev[cr.severity] || 'Not provided'],
        ['Affected user', cr.affectedUser || 'Not provided'], ['Affected device', cr.affectedDevice || 'Not provided'],
        ['Disposition', cr.disposition === 'true-positive' ? 'Confirmed malicious activity' : cr.disposition === 'false-positive' ? 'False positive' : 'Not provided'],
        ['Escalation required', cr.escalation === 'required' ? 'Required' : cr.escalation === 'not-required' ? 'Not required' : 'Not provided'],
        ['Route to department', cr.escalation === 'required' ? dept[cr.escalateTo] || 'Not provided' : 'Not applicable'],
      ];
    }
    return { id, lab_key: 'lab-endpoint-investigation', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: scored.score, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 }, result };
  }

  goodStateUpdated.selectedDeviceIds = ['ws-assess-27'];
  goodStateUpdated.evidencePackage = goodState.evidencePackage;
  const perfect = attempt('m05-pass', goodStateUpdated, caseRecord());
  assert.ok(perfect.score >= 90, `scorer gives the perfect attempt ${perfect.score}`);

  const wrongState = build([
    ['device_review', { deviceId: 'ws-assess-14', status: 'selected_for_review', note: 'Learner opened device profile and telemetry.' }],
    ['analysis_note', { text: 'looks like the updater is malicious so quarantine acmeupdater and execute isolation <script>alert(1)</script>', relatedDeviceIds: ['ws-assess-14'] }],
    ['endpoint_isolation_request', { deviceId: 'ws-assess-14', reason: 'updater looks bad', requestedBy: 'me', status: 'pending_approval' }],
  ]);
  wrongState.selectedDeviceIds = ['ws-assess-14'];
  const wrong = attempt('m05-fail', wrongState, caseRecord({
    status: 'resolved', severity: 'low', priority: 'low', affectedUser: 'p.chen', affectedDevice: 'srv-assess-02', disposition: 'false-positive', verdict: 'false-positive', escalation: 'not-required', escalateTo: '',
    notes: 'looks fine to me, closed it',
  }));

  // Partial: persistence missed, route to Tier 2, second-best user/device.
  const partialSteps = goodSteps.filter(([type]) => type !== 'evidence_package_preserved').map(([type, details]) => (type === 'analysis_note'
    ? [type, { ...details, text: 'Process 4100 (browser) started PowerShell 4172 which started syncsvc.exe 4224. The signed AcmeUpdater is benign. Detected but not prevented.', relatedEventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003'] }]
    : [type, details]));
  const partialState = build(partialSteps);
  partialState.selectedDeviceIds = ['ws-assess-27'];
  const partial = attempt('m05-partial', partialState, caseRecord({ affectedUser: 'm.reyes', affectedDevice: 'ws-assess-14', escalateTo: 'tier2-soc' }));

  const older = attempt('m05-older', goodState, caseRecord(), { work: false, display: false });
  older.completed_at = '2026-10-10T10:12:00.000Z';
  // Saved earlier on 2026-10-17: work_summary without the handoff status updates.
  const sameDay = attempt('m05-same-day', goodStateUpdated, caseRecord());
  delete sameDay.result.work_summary.handoffStatusUpdates;

  return [
    {
      name: 'M05 perfect attempt recommends PASS and every section agrees with the scorer',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: { 'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', notes: 'pass', ancestry: 'pass', interpretation: 'pass', persistence: 'pass', control: 'pass', scope: 'pass', 'evidence-preservation': 'pass', handoff: 'pass', 'safe-response': 'pass', timeline: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-055127 · INC-055436', 'j.alvarez', 'ws-assess-27', 'Endpoint/EDR Response', '8 of 8 found', 'Isolate ws-assess-27', /data-sheet-narrative="analysis:0"/, /data-sheet-narrative="handoff:1"/, /data-sheet-narrative-text>Process 4100/,
          'Analyst note 1', 'ws-assess-27 (from the alert and from the device inventory), 2 times',
          'Action: Request endpoint isolation', 'Action: Request file quarantine', 'Status: Pending approval', 'Requester: SOC analyst',
          'File on this device: C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe · ' + SHA,
          'Owner: SOC analyst', 'Recipient: Endpoint/EDR Response', 'Status: Accepted', 'Accepted · Updated by endpoint-lead', 'Handoff 1 · Recommendation', 'aaaaaaaaaaaa… (syncsvc.exe)'],
        notHtml: ['true-positive', 'endpoint-response', 'endpoint_isolation_request', 'pending_approval', 'selected_for_review', 'Pivoted from alert to device', 'Learner opened device profile', 'Note on workstation', 'Not recorded in this attempt'],
      },
    },
    {
      name: 'M05 wrong investigation recommends RETURN with a note per failed section',
      row: wrong,
      expect: {
        verdict: 'return',
        sections: { severity: 'fail', disposition: 'fail', escalation: 'fail', ancestry: 'fail', interpretation: 'partial', persistence: 'fail', handoff: 'fail', notes: 'fail', control: 'fail' },
        html: ['Recommend RETURN', 'Set Severity to High', 'Put j.alvarez in Affected user', 'Set Escalation to Required', '&lt;script&gt;', 'Record the process chain', 'Set Severity to High (you chose Low)'],
        notHtml: ['fixture', 'Learner opened device profile', 'Note on workstation', 'selected_for_review'],
      },
      custom: ({ suggested }) => {
        const note = (label) => (suggested.find((item) => item.item_label === label) || {}).comment || '';
        assert.match(note('Process chain'), /^Record the process chain in an analyst note: the browser \(process 4100\) started PowerShell \(4172\), which started syncsvc\.exe \(4224\).*\(your notes do not mention these processes\)\.$/);
        assert.match(note('Malicious payload vs harmless updater'), /you wrote “looks like the updater is malicious/);
        assert.match(note('Incident scope'), /^Open ws-assess-27 and name it in your response.*\(you opened only ws-assess-14\)\. Keep ws-assess-14 out of the response: only ws-assess-27 ran the payload \(you asked for isolation of ws-assess-14\)\.$/);
        assert.match(note('Safe response boundary'), /you asked for isolation of ws-assess-14, which is outside this incident; you wrote “…quarantine acmeupdater and execute isolation/);
        assert.match(note('EDR handoff'), /\(you sent no EDR handoff\)\.$/);
        assert.match(note('Evidence preserved'), /\(you preserved no evidence package\)\.$/);
        suggested.forEach((item) => assert.doesNotMatch(item.comment, /fixture|supported|criterion|scorer/i, `${item.item_label} note is plain English`));
      },
    },
    {
      name: 'M05 missing evidence package, Tier 2 route and related user are partial credit and stay explainable',
      row: partial,
      expect: {
        sections: { 'affected-user': 'partial', 'affected-device': 'partial', escalation: 'partial', ancestry: 'pass', persistence: 'pass', 'evidence-preservation': 'fail' },
        html: ['Partly there (does not block a pass', 'Preserve ws-assess-27’s malware events with the syncsvc.exe hash (aaaaaaaaaaaa…) in the evidence package (you preserved no evidence package).'],
        notHtml: ['fixture'],
      },
      // The scorer's own miss text stays in the instructor's rubric panel, never in a note to the student.
      custom: ({ suggested }) => suggested.forEach((item) => assert.doesNotMatch(item.comment, /Preserve relevant affected-device telemetry|fixture/)),
    },
    {
      name: 'M05 attempt saved before handoff status updates were recorded says so for that row only',
      row: sameDay,
      expect: {
        verdict: 'pass',
        sections: { handoff: 'pass', 'safe-response': 'pass' },
        html: ['Status: Accepted', /Handoff 1 · status updates<\/dt><dd><em class="ass-not-recorded">Not recorded in this attempt<\/em>/],
      },
    },
    {
      name: 'M05 older attempt without work summary or display shows Not recorded',
      row: older,
      expect: {
        verdict: 'pass',
        sections: { severity: 'pass', ancestry: 'pass', persistence: 'pass', analysis: 'judgment' },
        html: ['Not recorded in this attempt (submitted before 2026-10-17)', 'Confirmed malicious activity'],
        notHtml: ['true-positive'],
      },
    },
    {
      name: 'M05 attempt with no case record does not crash',
      row: { id: 'm05-empty', lab_key: 'lab-endpoint-investigation', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: {} },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', ancestry: 'missing', handoff: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
  ];
};

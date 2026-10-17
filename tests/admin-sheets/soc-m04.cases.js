/* Module 04 Prove It (lab-detection-rule, CASE-044424 / INC-044733) synthetic
 * attempts. The module's own scorer (SocM04AssessmentScorer) runs on
 * hand-built console state here, so breakdowns and scores are the scorer's
 * output, not typed-in numbers. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');
// Shared console files may already be loaded by another module's cases file;
// that only raises "already declared" before anything executes, so ignore it.
const FILES = ['kql-engine.js', 'soc-console-core.js', 'soc-console-tools.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-alert-queue-ui.js',
  'soc-analyst-module-03-environment.js', 'soc-assessment-scorer.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-rubric.js', 'soc-m04-assessment-scorer.js', 'soc-m04-assessment-state.js',
  'soc-m04-assessment-actions.js', 'soc-m04-rule-evaluator.js', 'soc-m04-automation.js', 'soc-m04-intelligence-ui.js', 'soc-m04-rules-ui.js', 'soc-m04-assessment-console.js', 'soc-analyst-module-04.js'];

module.exports = ({ run, clone }) => {
  run(`if (typeof moduleThreeState === 'undefined') { var moduleThreeState = { console: {} }, moduleThreeSave = () => {}, guidedLabDebrief = () => '', guidedLabGuide = () => '', MODULE_THREE_FLAG = 'F', MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage', moduleThreeUser = {}; }
    if (typeof recordLabAttempt === 'undefined') { var recordLabAttempt = () => {}; }
    if (typeof registerModuleLab === 'undefined') { var registerModuleLab = () => {}; }
    if (typeof document === 'undefined') { var document = { getElementById: () => ({ textContent: '' }), querySelector: () => null }; }`);
  for (const file of FILES) {
    try { run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); } catch (error) { if (!/already been declared/.test(error.message)) throw error; }
  }
  // In the browser the module files load before the sheet definitions; mirror that order.
  run(fs.readFileSync(path.join(PORTAL, 'admin-sheets', 'soc-m04.js'), 'utf8'));
  assert.equal(run('typeof SocM04AssessmentScorer'), 'object', 'M04 scorer loaded into the test VM');
  assert.equal(run('typeof moduleFourWorkSummary'), 'function', 'M04 work summary loaded');

  const source = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-04.js'), 'utf8');
  assert.match(source, /work_summary: moduleFourWorkSummary\(moduleFourState\.assessment\)/, 'M04 submit saves work_summary (additive)');
  assert.match(source, /review_payload: moduleFourState\.caseRecord\.reviewPayload/, 'M04 submit still saves review_payload');

  const T0 = '2026-09-24T09:30:00Z';
  const rationale = {
    'M04-I-001': 'Five accounts failed from 198.51.100.64 then M04-A-006 succeeded for acct-44; the Threat Desk report M04-R-002 matches.',
    'M04-I-002': 'No sign-in record in this case involves this address, so the case cannot say either way.',
    'M04-I-003': 'This domain is expired and appears in no record from this case, so it cannot be judged.',
    'M04-C-001': 'acct-17 retries from 203.0.113.77 followed the CR-204 rotation and M04-A-121 shows a normal sign-in afterwards.',
  };
  const goodAssessment = () => ({
    reports: [{ id: 'M04-R-002', confidence: 72, time: '2026-09-24T09:11:00Z', sourceReliability: 'B2' }],
    iocs: [{ id: 'M04-I-001', type: 'ip', value: '198.51.100.64', status: 'active', firstSeen: '2026-09-24T08:40:00Z', lastSeen: '2026-09-24T09:05:00Z', sourceReportId: 'M04-R-002' },
      { id: 'M04-I-003', type: 'domain', value: 'legacy-drop.example', status: 'expired', firstSeen: '2026-06-01T00:00:00Z', lastSeen: '2026-06-03T00:00:00Z', sourceReportId: 'M04-R-002' }],
    automationResults: [{ type: 'indicator_enrichment', status: 'succeeded', iocId: 'M04-I-001', matchedEventIds: ['M04-A-001', 'M04-A-002'] }],
    savedQueries: [{ id: 'Q1', query: 'AuthLog | where Result == "Failure"' }],
    rules: [{ id: 'R1', name: 'Distributed spray by source', queryId: 'Q1', query: 'AuthLog | where Result == "Failure"', groupingField: 'SourceIp', threshold: 5, windowMinutes: 20, enabled: true,
      schedule: { scheduledAt: T0, frequencyMinutes: 15 }, exclusion: { enabled: true, field: 'Account', operator: '==', value: 'acct-17' }, suppression: { enabled: false, groupField: 'Account', windowMinutes: 10 } }],
    executions: [{ id: 'E1', ruleId: 'R1', mode: 'manual', status: 'completed', completedAt: '2026-09-24T09:25:00Z' }, { id: 'E2', ruleId: 'R1', mode: 'scheduled', status: 'completed', completedAt: '2026-09-24T09:31:00Z' }],
    alerts: [{ id: 'AL1', ruleId: 'R1', groupingField: 'SourceIp', group: '198.51.100.64', executionId: 'E2', eventIds: ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-006'] }],
    automationActions: [{ id: 'M04-AUTO-000001', type: 'indicator_enrichment' }],
    automationExecutions: [{ id: 'M04-AUTO-EXEC-000001', actionId: 'M04-AUTO-000001', status: 'succeeded', details: { readOnly: true, sideEffects: [] } }],
    approvalRequests: [{ id: 'AP1', status: 'pending', audit: [] }],
    actionHistory: [
      { type: 'ioc_edit', details: { recordId: 'M04-I-001' } },
      { type: 'query_test', details: { succeeded: true, query: 'AuthLog | where Result == "Failure"' } },
      { type: 'scheduling', details: { ruleId: 'R1', enabled: true, scheduledAt: T0 } },
      { type: 'automation', details: {} },
    ],
    intelVerdicts: Object.fromEntries([['M04-I-001', 'malicious'], ['M04-I-002', 'unknown'], ['M04-I-003', 'unknown'], ['M04-C-001', 'benign']].map(([id, decision]) => [id, { decision, rationale: rationale[id], recordedAt: T0 }])),
  });
  const GOOD_NOTES = 'The original rule missed the spray because it counted failures per account. I tuned it to group by source address and count five distinct accounts within twenty minutes, excluding the acct-17 retries from 203.0.113.77 after the CR-204 rotation. '
    + 'Authentication shows 198.51.100.64 sprayed five accounts and then signed in as acct-44 (M04-A-006); the Threat Desk indicator corroborates it but is not proof. Recommend Identity Response reset acct-44 and publish the tuned rule with monitoring.';
  const caseRecord = (o = {}) => ({
    caseId: 'CASE-044424', status: 'in-progress', severity: 'high', priority: 'high', affectedUser: 'acct-44', affectedDevice: '198.51.100.64',
    disposition: 'true-positive', verdict: 'true-positive', escalation: 'required', escalateTo: 'identity-response',
    findings: { intelAssessment: 'corroborates', ruleDisposition: 'publish-monitored' }, notes: GOOD_NOTES, submitted: true,
    actionHistory: [{ action: 'Submitted case for faculty review', at: '2026-10-17T10:12:00.000Z' }], ...o,
  });

  const labelOf = { users: (id) => id, devices: (id) => clone(run(`(MODULE_FOUR_ENTITY_ROSTER.devices.find((d) => d.id === ${JSON.stringify(id)}) || {}).text || ${JSON.stringify(id)}`)) };
  function attempt(id, assessment, cr, { work = true, payload = true, display = true } = {}) {
    const result = clone(run(`SocM04AssessmentScorer.score(${JSON.stringify({ assessment, caseRecord: cr })}, SocM04AssessmentData)`));
    const sev = { high: 'High', medium: 'Medium', low: 'Low', critical: 'Critical' };
    const body = {
      rubric_version: result.rubricVersion, breakdown: result.criteria, feedback: result.review.feedback, critical_errors: result.criticalMisses,
      case_record: cr, case_summary: 'x', attempts: 1,
    };
    if (payload) body.review_payload = { ...result, caseId: 'CASE-044424', scenarioId: 'M04-ASSESS-2026-09-24' };
    if (work) body.work_summary = clone(run(`moduleFourWorkSummary(${JSON.stringify(assessment)})`));
    if (display) {
      body.case_display = [
        ['Case', 'CASE-044424'], ['Linked incidents', 'INC-044733'], ['Status', cr.status === 'resolved' ? 'Resolved' : 'In Progress'], ['Severity', sev[cr.severity] || 'Not provided'],
        ['Affected user', cr.affectedUser || 'Not provided'], ['Affected device', cr.affectedDevice || 'Not provided'],
        ['Disposition', cr.disposition === 'true-positive' ? 'Confirmed malicious activity' : cr.disposition === 'false-positive' ? 'False positive' : 'Not provided'],
        ['Escalation required', cr.escalation === 'required' ? 'Required' : cr.escalation === 'not-required' ? 'Not required' : 'Not provided'],
        ['Route to department', cr.escalation === 'required' ? ({ 'identity-response': 'Identity Response', 'tier2-soc': 'Tier 2 SOC', 'help-desk': 'IT Help Desk', 'network-security': 'Network Security' }[cr.escalateTo] || 'Not provided') : 'Not applicable'],
        ['Intelligence interpretation', { corroborates: 'Corroborates the alert but is not proof by itself', 'proves-attack': 'Proves every event in the window is malicious' }[cr.findings.intelAssessment] || 'Not provided'],
        ['Rule deployment decision', { 'publish-monitored': 'Publish the tuned rule with monitoring and a rollback note', 'keep-current': 'Keep the current account-based rule unchanged' }[cr.findings.ruleDisposition] || 'Not provided'],
      ];
    }
    return { id, lab_key: 'lab-detection-rule', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: result.score, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', attempt: { number: 1, of: 1 }, result: body };
  }
  void labelOf;

  const perfect = attempt('m04-pass', goodAssessment(), caseRecord());
  assert.ok(perfect.score >= 90, `scorer gives the perfect attempt ${perfect.score}`);

  const wrong = attempt('m04-fail', { iocs: [], reports: [], intelVerdicts: { 'M04-I-001': { decision: 'benign', rationale: 'looks fine to me', recordedAt: T0 }, 'M04-I-002': { decision: 'malicious', rationale: 'bad', recordedAt: T0 } } },
    caseRecord({ status: 'resolved', severity: 'low', priority: 'low', affectedUser: 'acct-46', affectedDevice: '10.44.3.18', disposition: 'false-positive', verdict: 'false-positive', escalation: 'not-required', escalateTo: '', findings: { intelAssessment: 'proves-attack', ruleDisposition: 'keep-current' }, notes: 'looks fine <script>alert(1)</script> closed it'.padEnd(110, ' x') }));

  const partialAssessment = goodAssessment();
  partialAssessment.rules[0].enabled = false;
  partialAssessment.rules[0].schedule = null;
  partialAssessment.executions = partialAssessment.executions.slice(0, 1);
  partialAssessment.actionHistory = partialAssessment.actionHistory.filter((entry) => entry.type !== 'scheduling');
  delete partialAssessment.intelVerdicts['M04-I-003'];
  const partial = attempt('m04-partial', partialAssessment, caseRecord({ affectedUser: 'acct-41', escalateTo: 'tier2-soc' }));

  const older = attempt('m04-older', goodAssessment(), caseRecord(), { work: false, display: false });
  delete older.result.review_payload;

  return [
    {
      name: 'M04 perfect attempt recommends PASS and every section agrees with the scorer',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: { 'case-status': 'pass', severity: 'pass', 'affected-user': 'pass', 'affected-device': 'pass', disposition: 'pass', escalation: 'pass', findings: 'pass', 'indicator-verdicts': 'pass', notes: 'pass', intelligence: 'pass', 'ioc-record': 'pass', rule: 'pass', schedule: 'pass', alerts: 'pass', automation: 'pass', timeline: 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-044424 · INC-044733', 'Confirmed malicious activity', 'acct-44', '198.51.100.64', 'Identity Response', '4 of 4 found', 'Distributed spray by source', 'AL1', 'Reads cleanly',
          /data-sheet-narrative="indicator-verdicts:0"/, /data-sheet-narrative-text>Five accounts failed/],
        notHtml: ['true-positive', 'identity-response', 'intelAssessment', 'publish-monitored'],
      },
    },
    {
      name: 'M04 wrong investigation recommends RETURN with a note per failed section',
      row: wrong,
      expect: {
        verdict: 'return',
        sections: { disposition: 'fail', 'indicator-verdicts': 'fail', notes: 'fail', intelligence: 'fail', rule: 'fail', alerts: 'fail', automation: 'fail', severity: 'fail', 'ioc-record': 'fail', schedule: 'fail' },
        html: ['Recommend RETURN', 'Record the disposition as confirmed malicious activity', 'your verdict contradicts them', '&lt;script&gt;', '0 of 4 found', 'Set Severity to High'],
      },
      custom: ({ suggested }) => {
        assert.ok(suggested.some((item) => item.item_label === 'Indicator verdicts' && /contradicts/.test(item.comment)));
        assert.ok(suggested.some((item) => item.item_label === 'Detection query and rule'));
      },
    },
    {
      name: 'M04 un-scheduled rule, missed verdict and second-best route are partial credit',
      row: partial,
      expect: {
        verdict: 'pass',
        sections: { schedule: 'partial', 'indicator-verdicts': 'partial', escalation: 'partial', 'affected-user': 'partial', rule: 'pass', alerts: 'pass' },
        html: ['Partly there (does not block a pass', 'Recommend PASS'],
      },
    },
    {
      name: 'M04 older attempt without work summary, review payload or display shows Not recorded',
      row: older,
      expect: {
        verdict: 'pass',
        sections: { disposition: 'pass', 'indicator-verdicts': 'missing', intelligence: 'pass', rule: 'pass' },
        html: ['Not recorded in this attempt', 'Confirmed malicious activity'],
        notHtml: ['true-positive'],
      },
    },
    {
      name: 'M04 attempt with no case record does not crash',
      row: { id: 'm04-empty', lab_key: 'lab-detection-rule', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T10:12:00.000Z', result: { breakdown: {} } },
      expect: {
        verdict: 'judgment',
        sections: { severity: 'missing', notes: 'missing', intelligence: 'missing', 'indicator-verdicts': 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
  ];
};

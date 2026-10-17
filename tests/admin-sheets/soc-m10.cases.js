/* Module 10 Prove It (lab-attack-mapping, CASE-105510) synthetic attempts for
 * tests/admin-submission-sheet.test.js. States are built with the module's own
 * SocM10AssessmentState transitions and scored with SocM10AssessmentScorer, so
 * the stored breakdown is exactly what the live submit saves. */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', '..', 'portal');

module.exports = ({ run, clone }) => {
  // The shared test context only loads data.js + case-record.js; load this
  // module's fixture/state/scorer once (guarded so parallel sprints that load
  // the same shared scorer do not redeclare it).
  const load = (name, file) => { if (run(`typeof ${name}`) === 'undefined') run(fs.readFileSync(path.join(PORTAL, file), 'utf8')); };
  load('SocAssessmentScorer', 'soc-assessment-scorer.js');
  load('SocM10AssessmentData', 'soc-m10-assessment-data.js');
  load('SocM10AssessmentState', 'soc-m10-assessment-state.js');
  load('SocM10AssessmentRubric', 'soc-m10-assessment-rubric.js');
  load('SocM10AssessmentScorer', 'soc-m10-assessment-scorer.js');

  const fx = run('SocM10AssessmentData');
  const S = run('SocM10AssessmentState');
  const truth = fx.expectedTruth;
  const art = (id) => fx.scenario.artifacts.find((item) => item.id === id);
  const at = (hm) => `2026-09-27T${hm}:00Z`;

  function lockerState({ skip = [], extraNoise = [], transfer = true, hold = true } = {}) {
    let state = S.normalize({}, fx);
    const ids = [...truth.requiredArtifactIds.filter((id) => !skip.includes(id)), truth.specialistArtifactId, ...extraNoise];
    ids.forEach((id, index) => {
      const a = art(id);
      state = S.intake(state, fx, { artifactId: id, source: a.source, method: a.methods[0], acquiredBy: 'soc-analyst' }, at(`10:${String(10 + index).padStart(2, '0')}`));
      state = S.verify(state, fx, id, at('10:40'));
      if (id === truth.mismatchArtifactId) {
        state = S.reacquire(state, fx, id, at('10:41'));
        state = S.verify(state, fx, id, at('10:42'));
      }
    });
    if (transfer) state = S.transfer(state, fx, { artifactId: truth.specialistArtifactId, to: truth.specialistCustodian, reason: 'Memory analysis needs the Digital Forensics team.' }, at('10:50'));
    if (hold) {
      state = S.hold(state, fx, { artifactIds: truth.originalsForHold.filter((id) => !skip.includes(id)), reason: 'Originals preserved for the legal case.' }, at('10:55'));
      state = S.exportPackage(state, fx, at('10:56'));
    }
    return state;
  }
  function reconstruct(state, { overclaim = false } = {}) {
    let next = S.setTimeline(state, fx, truth.chain.filter((id) => state.locker[id]), at('11:00'));
    ['ART-01', 'ART-02', 'ART-03'].forEach((id, index) => {
      next = S.statement(next, fx, { kind: 'fact', text: `${id} shows the record exactly as collected, with its hash verified.`, artifactIds: [id] }, at(`11:0${index + 1}`));
    });
    next = S.statement(next, fx, { kind: 'analysis', text: 'The sequence suggests the attachment led to PowerShell and a Run key.', artifactIds: ['ART-03'] }, at('11:05'));
    next = S.statement(next, fx, { kind: 'root_cause', text: 'The user opened the macro document attached to the remittance email.', artifactIds: ['ART-01', 'ART-02', 'ART-03'] }, at('11:06'));
    if (overclaim) next = S.statement(next, fx, { kind: 'fact', text: 'Data exfiltration was confirmed to an external server.', artifactIds: ['ART-07'] }, at('11:07'));
    next = S.unknown(next, fx, { topic: 'exfiltration', text: 'The proxy shows no upload, so whether data left the network is unknown.' }, at('11:08'));
    next = S.unknown(next, fx, { topic: 'memory', text: 'The memory image has not been analysed yet.' }, at('11:09'));
    next = S.escalate(next, fx, { route: truth.escalationRoute, reason: 'Memory image needs forensic analysis.', artifactIds: [truth.specialistArtifactId] }, at('11:10'));
    return next;
  }
  const mapping = (techniqueId, tacticId, eventIds) => ({ tacticId, techniqueId, confidence: 'high', status: 'supported', eventIds, rationale: `${techniqueId} is shown by ${eventIds.join(', ')}.` });
  const GOOD_MAPPINGS = [mapping('T1566.001', 'TA0001', ['ART-01', 'ART-02']), mapping('T1204.002', 'TA0002', ['ART-02', 'ART-03']), mapping('T1059.001', 'TA0002', ['ART-03'])];

  const GOOD_NOTES = 'j.sanders opened the macro document Q3_Remittance.docm on wkstn-19 and it ran an encoded PowerShell command, then created the svchelp.exe Run key persistence. '
    + 'ART-03 failed its first hash check because the export was truncated, so I collected it again. The originals are under legal hold. '
    + 'Whether data left the network is not established; the memory image goes to Digital Forensics.';
  const TICKET = { status: 'in-progress', severity: 'high', priority: 'high', affectedUser: 'j.sanders', affectedDevice: 'wkstn-19', disposition: 'true-positive', verdict: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc', findings: {} };

  const spec = () => ({ caseId: fx.scenario.caseId, departmentOptions: [{ id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response' }, { id: 'help-desk', text: 'Help Desk' }] });
  const row = (id, state, mappings, ticket, { notes = GOOD_NOTES, display = true, breakdown = true } = {}) => {
    // case_record is the ticket state (moduleTenAssessmentState); the locker lives in evidence_record.
    const caseRecord = { ...ticket, notes, submitted: true, completed: true, actionHistory: [{ action: 'Updated notes', at: '2026-10-17T11:20:00.000Z' }], tools: { m06: { mappings } } };
    const scored = run('SocM10AssessmentScorer').score(state, fx, { mappings });
    const result = {
      rubric_version: scored.rubricVersion,
      ...(breakdown ? { breakdown: clone(scored.criteria) } : {}),
      feedback: clone(scored.review.feedback), review_payload: clone(scored), critical_errors: clone(scored.criticalMisses),
      case_record: caseRecord, notes,
      evidence_record: clone(state), attack_mappings: clone(mappings),
    };
    if (display) result.case_display = clone(run(`caseRecordDisplay(${JSON.stringify(caseRecord)}, ${JSON.stringify(spec())})`));
    return { id, lab_key: 'lab-attack-mapping', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: scored.score, pass_threshold: 70, completed_at: '2026-10-17T11:30:00.000Z', attempt: { number: 1, of: 1 }, result };
  };

  const perfectState = reconstruct(lockerState());
  const perfect = row('m10-pass', perfectState, GOOD_MAPPINGS, TICKET);

  // Wrong attempt: noise collected, nothing verified/held, theft claimed, wrong ticket.
  let wrongState = S.normalize({}, fx);
  wrongState = S.intake(wrongState, fx, { artifactId: 'ART-10', source: art('ART-10').source, method: 'log_export', acquiredBy: 'soc-analyst' }, at('10:10'));
  wrongState = S.statement(wrongState, fx, { kind: 'fact', text: 'Data exfiltration was confirmed to an external server.', artifactIds: ['ART-10'] }, at('10:20'));
  const wrongRow = row('m10-fail', wrongState, [mapping('T1567', 'TA0010', ['ART-10'])],
    { ...TICKET, status: 'resolved', severity: 'low', priority: 'low', affectedUser: 'svc-backup', affectedDevice: 'srv-file-02', disposition: 'false-positive', verdict: 'false-positive', escalation: 'not-required', escalateTo: '' },
    { notes: 'looks fine <script>alert(1)</script> closed it' });

  // Partial: evidence missing ART-05 and ART-07 (4 of 6 needed) -> partial, rest done.
  const partialState = reconstruct(lockerState({ skip: ['ART-05', 'ART-07'] }));
  const partialRow = row('m10-partial', partialState, GOOD_MAPPINGS.slice(0, 1), TICKET);

  // Older attempt: no case_display, no stored breakdown, no tools.
  // (before 2026-10-17 the locker, statements, hold etc. and attack_mappings were not saved on the attempt)
  const olderRow = row('m10-older', perfectState, GOOD_MAPPINGS, TICKET, { display: false });
  olderRow.completed_at = '2026-10-10T09:00:00.000Z';
  delete olderRow.result.evidence_record;
  delete olderRow.result.attack_mappings;
  delete olderRow.result.case_record.tools;
  delete olderRow.result.case_record.actionHistory;

  // Before the breakdown was stored with criterion ids and with no evidence_record, the work sections have nothing to grade.
  const bareRow = row('m10-bare', perfectState, GOOD_MAPPINGS, TICKET, { display: false });
  bareRow.completed_at = '2026-10-10T09:00:00.000Z';
  delete bareRow.result.evidence_record;
  delete bareRow.result.attack_mappings;
  bareRow.result.breakdown = bareRow.result.breakdown.map(({ id, ...rest }) => rest);

  const emptyRow = { id: 'm10-empty', lab_key: 'lab-attack-mapping', track_code: 'SOCAN', student_id: '9334491415-SOCAN', score: null, pass_threshold: 70, completed_at: '2026-10-17T11:30:00.000Z', attempt: { number: 1, of: 1 }, result: {} };

  return [
    {
      name: 'M10 perfect evidence package recommends PASS with no prefilled notes',
      row: perfect,
      expect: {
        verdict: 'pass',
        sections: { ticket: 'pass', notes: 'pass', 'evidence-locker': 'pass', acquisition: 'pass', integrity: 'pass', custody: 'pass', preservation: 'pass', timeline: 'pass', statements: 'pass', 'root-cause': 'pass', attack: 'pass', unknowns: 'pass', 'timeline-actions': 'judgment' },
        feedback: [],
        html: ['Recommend PASS', 'CASE-105510 · INC-5510', 'ART-09 · Memory image of isolated wkstn-19', 'Digital Forensics evidence custodian', 'T1566.001', '10 of 10 points', /data-sheet-narrative="statements:0"/, /data-sheet-narrative="root-cause:0"/],
        notHtml: ['tier2-soc', 'in-progress', 'root_cause', 'digital-forensics'],
      },
    },
    {
      name: 'M10 wrong evidence package recommends RETURN with plain red-pen notes',
      row: wrongRow,
      expect: {
        verdict: 'return',
        sections: { ticket: 'fail', notes: 'partial', 'evidence-locker': 'fail', custody: 'fail', preservation: 'fail', timeline: 'fail', statements: 'fail', 'root-cause': 'fail', attack: 'fail', unknowns: 'fail' },
        html: ['Recommend RETURN', 'Collect the attachment email', 'Missing: ART-01', 'Routine items collected: ART-10', 'Do not map data theft', 'Do not say data was stolen', '&lt;script&gt;', 'A statement presents exfiltration'],
        notHtml: ['<script>alert'],
        custom: ({ suggested }) => {
          const labels = suggested.map((item) => item.item_label);
          assert.ok(labels.includes('Evidence collected') && labels.includes('ATT&CK mapping'), 'one prefilled note per failed section');
        },
      },
    },
    {
      name: 'M10 partial credit (4 of 6 needed items) is partly there and still PASS',
      row: partialRow,
      expect: {
        verdict: 'pass',
        sections: { 'evidence-locker': 'partial', attack: 'partial', timeline: 'partial', preservation: 'partial', 'root-cause': 'pass' },
        html: ['Recommend PASS', 'Partly there (does not block a pass', 'Missing: ART-05, ART-07'],
        custom: ({ suggested }) => {
          assert.match(suggested.find((item) => item.item_label === 'Evidence collected').comment, /^To strengthen next time: /);
        },
      },
    },
    {
      name: 'M10 older attempt without case_display, breakdown or tools still renders',
      row: olderRow,
      expect: {
        verdict: 'pass',
        sections: { 'evidence-locker': 'pass', preservation: 'pass', 'timeline-actions': 'judgment', ticket: 'pass' },
        html: ['Recommend PASS', 'Confirmed malicious activity', 'Not recorded in this attempt (submitted before 2026-10-17)'],
        notHtml: ['true-positive'],
      },
    },
    {
      name: 'M10 attempt with neither criterion ids nor an evidence record shows Not recorded for the work sections',
      row: bareRow,
      expect: {
        verdict: 'pass',
        sections: { ticket: 'pass', 'evidence-locker': 'missing', custody: 'missing', attack: 'missing', unknowns: 'missing' },
        html: ['Not recorded in this attempt (submitted before 2026-10-17)'],
      },
    },
    {
      name: 'M10 attempt with no case record does not crash',
      row: emptyRow,
      expect: {
        verdict: 'judgment',
        sections: { 'evidence-locker': 'missing', notes: 'missing', attack: 'missing' },
        feedback: [],
        html: ['Not recorded in this attempt', 'Instructor judgment needed'],
      },
    },
    {
      name: 'M10 read-only record shows the feedback that was sent',
      row: { ...wrongRow, reviewed_at: '2026-10-18T09:00:00.000Z' },
      readOnly: true,
      sentFeedback: [{ item_label: 'Evidence collected', comment: 'Collect ART-01 <b>first</b>.' }],
      expect: { verdict: 'return', html: ['Teacher notes sent to the student', 'Collect ART-01 &lt;b&gt;first&lt;/b&gt;.'], notHtml: ['data-sheet-notes'] },
    },
  ];
};

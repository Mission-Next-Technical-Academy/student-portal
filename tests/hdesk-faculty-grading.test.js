// The faculty grading sheet for Help Desk Module 1's Prove It, and what the
// student sees once it is decided. The database's own rules are tested in
// supabase/tests/hdesk_faculty_gate.sql; the sheet only says what is missing.
//
//   - The writing comes first, then choices and actions, then the rubric.
//   - The total adds up on its own, and a critical error caps it below the pass mark.
//   - Approve is unavailable below the pass mark or with a critical error.
//   - Partial credit needs a justification; a return needs only a note.
//   - A failed save keeps the work and says so.
//   - The student sees no score until a decision, and a return shows no pass/fail.
//   - Records report the official score, on this lab only.
//   - SOC cards and other Help Desk labs keep their existing review card.
//
// Neutral values only: nothing here says which answer earns credit.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const LAB = 'lab-its-01-prove-it';
const rubric = prun(`HDESK_PROVE_RUBRICS['${LAB}']`);
const state = prun('itsProveGradeState');
const full = { triage: '22', investigation: '11', diagnosis: '11', action: '28', documentation: '28' };
const why = { triage: 'x', investigation: 'x', diagnosis: 'x', action: 'x', documentation: 'x' };

const row = (extra = {}) => ({
  id: 'attempt-1', user_id: 'student-1', student_id: '9900000001-HDESK', track_code: 'HDESK', lab_key: LAB,
  score: null, pass_threshold: 70, completed_at: '2026-10-30T10:00:00Z',
  result: { kind: 'hdesk-prove', ticketId: 'TICKET', resolutionNote: 'Line one.\n\nLine two.', userReply: 'A reply.', fields: { category: 'A', type: 'B', priority: 'C' }, diagnosis: 'D', decision: 'E', stepTexts: ['A step.'], events: [], commands: [], workNotes: ['A note.'], machine: {} },
  ...extra,
});
const item = (lead) => ({ lead, ids: [lead.id], name: 'Module 1 · PROVE IT', labTitles: ['Prove It'] });

function testRubricIsTheApprovedOne() {
  assert.deepEqual(Array.from(rubric.competencies, (c) => [c.label, c.points]), [
    ['Triage', 22], ['Investigation', 11], ['Diagnosis', 11], ['Action and decision', 28], ['Documentation and communication', 28],
  ]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  assert.deepEqual(Array.from(rubric.formative, (f) => f.id), ['efficiency'], 'efficiency is feedback, with no points');
  assert.equal(rubric.formative[0].points, undefined);
}

function testTotalAndApproveRules() {
  let s = state(rubric, 70, { points: full, why });
  assert.equal(s.total, 100);
  assert.equal(s.canApprove, true);

  s = state(rubric, 70, { points: {}, why: {} });
  assert.equal(s.total, null, 'nothing entered, no total');
  assert.equal(s.entered, false);
  assert.equal(s.canApprove, false, 'an empty score can never be approved');

  s = state(rubric, 70, { points: { ...full, documentation: '26', action: '0' }, why });
  assert.equal(s.total, 70);
  assert.equal(s.canApprove, true, '70 passes');

  s = state(rubric, 70, { points: { ...full, documentation: '25', action: '0' }, why });
  assert.equal(s.total, 69);
  assert.equal(s.canApprove, false, '69 does not');
  assert.match(s.blocked, /Use Return|use Return/);

  s = state(rubric, 70, { points: full, why, critical: true, criticalReason: 'A reason.' });
  assert.equal(s.total, 100);
  assert.equal(s.score, 69, 'the critical error caps it one below the pass mark');
  assert.equal(s.canApprove, false);
  assert.match(s.blocked, /critical error/i);

  s = state(rubric, 80, { points: { ...full, documentation: '20' }, why, critical: true });
  assert.equal(s.score, 79, 'the cap follows the pass mark; it is not a copied number');

  s = state(rubric, 70, { points: { ...full, documentation: '20' }, why: { ...why, documentation: '  ' } });
  assert.deepEqual(Array.from(s.missingWhy), ['Documentation and communication'], 'partial credit needs a justification');
  assert.equal(s.canApprove, false);

  for (const bad of ['23', '-1', '1.5', 'abc']) {
    s = state(rubric, 70, { points: { ...full, triage: bad }, why });
    assert.equal(s.invalid, true, bad);
    assert.equal(s.canApprove, false, bad);
    assert.equal(s.total, null, bad);
  }
  s = state(rubric, 70, { points: { triage: '22' }, why });
  assert.equal(s.entered, true);
  assert.equal(s.allScored, false, 'a partly scored rubric has no total');
  assert.equal(s.total, null);

  s = state(rubric, undefined, { points: full, why });
  assert.equal(s.canApprove, false, 'no pass mark from the server, no Approve');
  assert.equal(state(rubric, '', { points: full, why }).canApprove, false, 'nor when it is blank');
}

function testCardOrderAndContent() {
  const html = prun('adminAttemptReviewCard')(item(row()), false);
  const at = (text) => { const i = html.indexOf(text); assert.ok(i >= 0, text); return i; };
  assert.ok(at("Student's written work") < at("Student's choices"), 'writing first');
  assert.ok(at("Student's choices") < at('What the student did in the simulator'), 'then choices and actions');
  assert.ok(at('What the student did in the simulator') < at('Rubric hdesk-its-01-prove-v1'), 'then the rubric');
  assert.ok(at('Rubric hdesk-its-01-prove-v1') < at('Efficiency feedback (earns no points)'));
  assert.ok(at('Efficiency feedback') < at('data-its-prove-critical'));
  assert.ok(at('data-its-prove-critical') < at('data-its-prove-total'));
  assert.ok(at('data-its-prove-total') < at('data-its-prove-decide="approved"'));
  assert.ok(at('data-its-prove-decide="approved"') < at('Full raw result'), 'raw data is last');
  for (const c of rubric.competencies) assert.match(html, new RegExp(`data-its-prove-points="${c.id}"[^>]*/> / ${c.points}<`));
  assert.ok(html.includes('Line one.\n\nLine two.'), 'writing is whole');
  assert.match(html, /data-its-prove-decide="approved" disabled/, 'Approve starts unavailable');
  assert.match(html, /data-pass-mark="70"/, 'the pass mark comes from the attempt');
  assert.doesNotMatch(html, /Approve counts as a pass/);
  assert.doesNotMatch(html, /admin-grading-approve|admin-grading-send-back|No score/);
  const hostile = prun('adminAttemptReviewCard')(item(row({ result: { ...row().result, userReply: '<img src=x onerror=1>' } })), false);
  assert.doesNotMatch(hostile.replace(/<pre[\s\S]*?<\/pre>/, ''), /<img/);
  assert.doesNotMatch(hostile, /<img/, 'not in the raw result either');
}

function testOtherLabsKeepTheirCard() {
  for (const lead of [
    row({ lab_key: 'lab-identity-investigation', track_code: 'SOCAN', result: {} }),
    row({ lab_key: 'lab-its-02-vm-build', result: {} }),
  ]) {
    assert.equal(prun('itsProveGradingCard')(item(lead), false), '');
    const html = prun('adminAttemptReviewCard')(item(lead), false);
    assert.match(html, /admin-grading-approve/);
    assert.match(html, /admin-grading-send-back/);
    assert.doesNotMatch(html, /data-its-prove/);
  }
  assert.equal(prun('labTakesOfficialGrade')('lab-identity-investigation'), false);
  assert.equal(prun('labTakesOfficialGrade')(LAB), true);
  const redo = (labKey) => prun('adminOpenRedoRequestsHtml')([{ id: 'x', student_id: 's', lab_key: labKey, track_code: 'HDESK', reviewed_at: '2026-10-30T10:00:00Z' }]);
  assert.match(redo('lab-its-02-vm-build'), /Approve without resubmission/);
  assert.doesNotMatch(redo(LAB), /Approve without resubmission/, 'this lab needs a grade, so a return cannot be approved away');
}

// A stand-in for one grading sheet's elements.
function sheetStub(values = {}) {
  const fields = { points: { ...values.points }, why: { ...values.why } };
  const single = {
    '[data-its-prove-critical]': { checked: values.critical === true },
    '[data-its-prove-critical-reason]': { value: values.criticalReason || '' },
    '[data-its-prove-critical-reason-row]': { hidden: true },
    '[data-its-prove-total]': { textContent: '' },
    '[data-its-prove-decide="approved"]': { disabled: true },
    '[data-its-prove-blocked]': { textContent: '' },
    '[data-grading-status]': { textContent: '' },
    '[data-its-prove-efficiency]': { value: values.efficiency || '' },
    '[data-its-prove-note]': { value: values.note || '' },
  };
  const decide = [{ disabled: false }, { disabled: false }];
  return {
    dataset: { itsProveGrade: 'attempt-1', labKey: LAB, passMark: '70' },
    single,
    decide,
    querySelector: (selector) => single[selector],
    querySelectorAll: (selector) => {
      if (selector === '[data-its-prove-decide]') return decide;
      const attr = selector.slice(1, -1);
      const group = attr === 'data-its-prove-points' ? fields.points : fields.why;
      return Object.entries(group).map(([key, value]) => ({ value, getAttribute: () => key }));
    },
  };
}

async function testSubmitSendsTheGradeOnce() {
  portal.supabaseCalls.length = 0;
  portal.supabaseRpcResponder = () => ({ data: { decision: 'approved' }, error: null });
  let saved = 0;
  const sheet = sheetStub({ points: { ...full, documentation: '20' }, why: { documentation: 'Reason.' }, efficiency: 'Quick.' });
  await prun('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'approved' } }, async () => { saved += 1; });
  const calls = portal.supabaseCalls.filter((call) => call.rpc === 'record_lab_grade');
  assert.equal(calls.length, 1);
  const args = calls[0].args;
  assert.equal(args.p_attempt_id, 'attempt-1');
  assert.equal(args.p_decision, 'approved');
  assert.equal(args.p_efficiency, 'Quick.');
  assert.equal(args.p_rubric_version, 'hdesk-its-01-prove-v1');
  assert.deepEqual(Array.from(args.p_competencies, (c) => [c.id, c.points, c.earned]), [['triage', 22, 22], ['investigation', 11, 11], ['diagnosis', 11, 11], ['action', 28, 28], ['documentation', 28, 20]]);
  assert.equal(Object.keys(args).includes('p_total'), false, 'the server adds up the total');
  assert.equal(saved, 1);
}

async function testReturnWithNoScoreSendsNone() {
  portal.supabaseCalls.length = 0;
  portal.supabaseRpcResponder = () => ({ data: {}, error: null });
  const sheet = sheetStub({ note: 'Please redo the reply.' });
  await prun('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'returned' } }, async () => {});
  const args = portal.supabaseCalls.find((call) => call.rpc === 'record_lab_grade').args;
  assert.equal(args.p_decision, 'returned');
  assert.equal(args.p_competencies.length, 0);
  assert.equal(args.p_note, 'Please redo the reply.');
}

async function testIncompleteScoresStayInTheBrowser() {
  portal.supabaseCalls.length = 0;
  const partial = sheetStub({ points: { triage: '22' }, note: 'A note.' });
  await prun('itsProveSubmitDecision')(partial, { dataset: { itsProveDecide: 'returned' } }, async () => { throw new Error('must not save'); });
  assert.match(partial.single['[data-grading-status]'].textContent, /Score every competency/);
  const noWhy = sheetStub({ points: { ...full, action: '1' } });
  await prun('itsProveSubmitDecision')(noWhy, { dataset: { itsProveDecide: 'returned' } }, async () => { throw new Error('must not save'); });
  assert.match(noWhy.single['[data-grading-status]'].textContent, /Justify/);
  assert.equal(portal.supabaseCalls.filter((call) => call.rpc).length, 0);
}

async function testFailedSaveKeepsTheWork() {
  portal.supabaseRpcResponder = () => ({ data: null, error: { message: 'A failing attempt is returned, never approved.' } });
  let saved = 0;
  const sheet = sheetStub({ points: full, why: {} });
  await prun('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'approved' } }, async () => { saved += 1; });
  assert.equal(saved, 0, 'no refresh, so nothing typed is lost');
  assert.match(sheet.single['[data-grading-status]'].textContent, /Not saved: A failing attempt/);
  assert.equal(sheet.decide[0].disabled, false, 'the instructor can try again');
  assert.equal(sheet.single['[data-its-prove-decide="approved"]'].disabled, false, 'Approve follows the sheet again');
}

function testDecidedRecordAndReturnButton() {
  const grade = { decision: 'approved', official_score: 82, competency_scores: [{ id: 'triage', label: 'Triage', points: 22, earned: 20, justification: 'Close.' }], critical_error: false };
  const panel = prun('itsProveReviewPanel')(row({ official_grade: grade }));
  assert.match(panel, /Official grade: 82%/);
  assert.match(panel, /Triage:<\/strong> 20 \/ 22/);
  assert.match(panel, /Close\./);
  const action = prun('itsProveReturnActionHtml');
  assert.match(action(row({ official_grade: grade }), true), /Return for another attempt/);
  assert.equal(action(row({ official_grade: grade }), false), '', 'only on the newest attempt');
  assert.equal(action(row({ official_grade: { ...grade, decision: 'returned' } }), true), '', 'a returned attempt is already open');
  assert.equal(action(row(), true), '', 'nothing to correct without a grade');
}

function testStudentResult() {
  const marked = prun('itsProveMarkedLabHtml');
  const notes = [{ item_label: 'Overall', comment: 'Good <work>.' }];
  const scores = [{ id: 'triage', label: 'Triage', points: 22, earned: 20 }];
  let html = marked(row({ redo_requested: false }), { decision: 'approved', official_score: 82, competency_scores: scores }, notes);
  assert.match(html, /Passed/);
  assert.match(html, /82%/);
  assert.match(html, /Triage: 20 \/ 22/);
  assert.ok(html.includes('Good &lt;work&gt;.'), 'notes are escaped');

  html = marked(row({ redo_requested: true }), { decision: 'returned', official_score: 60, competency_scores: scores }, notes);
  assert.match(html, /Returned for revision/);
  assert.match(html, /Your instructor's score: <strong>60%/, 'the instructor\'s score, when one was entered');
  assert.doesNotMatch(html, /Passed|Failed|Your score/, 'no pass/fail on a return');

  html = marked(row({ redo_requested: true }), { decision: 'returned', official_score: null, competency_scores: [] }, notes);
  assert.doesNotMatch(html, /score/i, 'no score entered, no score shown');
  assert.match(html, /Good/);

  assert.equal(marked(row(), null, notes), '', 'no grade, no graded view');

  const student = { userId: 's', trackCode: 'HDESK', latestLabAttemptByKey: { [LAB]: { completedAt: '2026-10-30T10:00:00Z', reviewedAt: '2026-10-30T11:00:00Z', redoRequested: false, officialScore: 82 } } };
  assert.match(prun('itsLabStatusHtml')(student, LAB, { label: 'Prove It', prefix: 'its01', pendingText: 'x' }), /Prove It passed · 82%/);
  student.latestLabAttemptByKey[LAB] = { completedAt: '2026-10-30T10:00:00Z', reviewedAt: null, redoRequested: false, supersededAt: null };
  const waiting = prun('itsLabStatusHtml')(student, LAB, { label: 'Prove It', prefix: 'its01', pendingText: 'x' });
  assert.match(waiting, /waiting for instructor review/);
  assert.doesNotMatch(waiting, /%/, 'nothing about a score while it waits');
}

async function testStudentReadsTheScoreFromTheServerAtSignIn() {
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => {
    if (call.table === 'lab_attempts') return { data: [
      { id: 'a1', lab_key: LAB, completed_at: '2026-10-30T10:00:00Z', reviewed_at: '2026-10-30T11:00:00Z', redo_requested: false, superseded_at: null },
      { id: 'a2', lab_key: 'lab-its-01-ticket-triage', completed_at: '2026-10-29T10:00:00Z', reviewed_at: '2026-10-29T11:00:00Z', redo_requested: false, superseded_at: null },
    ], error: null };
    if (call.table === 'lab_attempt_grades') return { data: [
      { lab_attempt_id: 'a1', decision: 'returned', official_score: 60, created_at: '1' },
      { lab_attempt_id: 'a1', decision: 'approved', official_score: 82, created_at: '2' },
    ], error: null };
    return { data: [], error: null };
  };
  const details = await prun('fetchUserDetails')('student-1', 'HDESK');
  assert.equal(details.latestLabAttemptByKey[LAB].officialScore, 82, 'the newest decision');
  assert.equal(details.latestLabAttemptByKey['lab-its-01-ticket-triage'].officialScore, undefined);
  const grades = portal.supabaseCalls.filter((call) => call.table === 'lab_attempt_grades');
  assert.equal(grades.length, 1);
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => (call.table === 'lab_attempts'
    ? { data: [{ id: 's1', lab_key: 'lab-identity-investigation', completed_at: '2026-10-29T10:00:00Z', reviewed_at: '2026-10-29T11:00:00Z', redo_requested: false, superseded_at: null }], error: null }
    : { data: [], error: null });
  await prun('fetchUserDetails')('soc-student', 'SOCAN');
  assert.equal(portal.supabaseCalls.filter((call) => call.table === 'lab_attempt_grades').length, 0, 'other labs make no extra read');
}

async function testRecordsReportTheOfficialScore() {
  portal.supabaseResponder = (call) => (call.table === 'lab_attempt_grades'
    ? { data: [{ lab_attempt_id: 'p', decision: 'approved', official_score: 82, created_by: 'staff-1', created_at: '2026-10-30T11:00:00Z' }], error: null }
    : { data: [], error: null });
  const rows = [
    { id: 'p', lab_key: LAB, score: null, state: 'complete' },
    { id: 'u', lab_key: 'lab-its-02-vm-build', score: 85, state: 'complete' },
    { id: 'w', lab_key: LAB, score: null, state: 'complete' },
  ];
  await prun('applyOfficialLabGrades')(rows);
  assert.equal(rows[0].score, 82);
  assert.equal(rows[0].official_grade.created_by, 'staff-1');
  assert.equal(rows[1].score, 85, 'other labs keep their score');
  assert.equal(rows[1].official_grade, undefined);
  assert.equal(rows[2].score, null, 'no grade, no score');
  const scores = prun('computeModuleScores')(prun(`PROGRAMS.find((p) => p.slug === 'it-support')`), [], rows);
  const moduleOne = scores.find((m) => m.moduleKey === 'its-01');
  assert.equal(moduleOne.bestLabScore, 82, 'Module 1\'s records show the official grade');
}

const tests = [
  testRubricIsTheApprovedOne, testTotalAndApproveRules, testCardOrderAndContent, testOtherLabsKeepTheirCard,
  testSubmitSendsTheGradeOnce, testReturnWithNoScoreSendsNone, testIncompleteScoresStayInTheBrowser, testFailedSaveKeepsTheWork,
  testDecidedRecordAndReturnButton, testStudentResult, testStudentReadsTheScoreFromTheServerAtSignIn, testRecordsReportTheOfficialScore,
];
(async () => {
  let failed = 0;
  for (const test of tests) {
    try { await test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
  }
  if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
  console.log(`all ${tests.length} passed`);
})();

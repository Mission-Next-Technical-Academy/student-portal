// The system's recommendation on the Help Desk Prove It grading card
// (portal/it-support-shared.js). The scoring itself runs in the database
// (supabase/tests/prove_it_auto_scoring.sql); this covers what the instructor
// sees and sends:
//
//   - the "System rubric" box: points, staff reasons, "Suggested: check this"
//     on the writing, the critical error, how and with which key it scored;
//   - pre-filled: the four automatic competencies (points and student lines)
//     and the critical error; the writing parts start empty with their
//     suggestion beside them, behind a required tick-box;
//   - Approve and Return wait for the writing and for a reason on every
//     changed pre-filled score; the totals line;
//   - what goes to record_lab_grade; the rescore button; the decision history;
//   - no recommendation: the card is as before and says why;
//   - a critical error: an automatic zero, with what the criteria found kept
//     for staff, and "Critical Error - Not Passed" for the student.
//
// The recommendation here is made up: no answer key is involved.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const portal = loadPortal();
const run = (code) => vm.runInContext(code, portal);
const LAB = 'lab-its-01-prove-it';
const RUBRIC = run(`HDESK_PROVE_RUBRICS['${LAB}']`);
const copy = (value) => JSON.parse(JSON.stringify(value));

const crit = (id, points, earned, met, reason) => ({ id, points, earned, met, reason, student_feedback: null });
const REC = {
  id: 'rec-1', lab_attempt_id: 'attempt-1', status: 'scored', rubric_version: RUBRIC.version,
  key_rubric_version: RUBRIC.version, key_revision: 2, scored_on: 'submit', rescored_at: null,
  automatic_points: 72, automatic_earned: 61, writing_points: 28, writing_suggested: 22,
  recommended_total: 83, recommended_score: 83, critical_error: false, critical_reasons: [],
  competencies: [
    { id: 'triage', label: 'Triage', points: 22, earned: 22, judgment: false, criteria: [crit('a', 22, 22, 'met', 'Staff reason A.')], parts: [], student_feedback: 'Strong triage.' },
    { id: 'investigation', label: 'Investigation', points: 11, earned: 6, judgment: false, criteria: [crit('b', 11, 6, 'partial', 'Staff reason B.')], parts: [], student_feedback: 'Coach line B.' },
    { id: 'diagnosis', label: 'Diagnosis', points: 11, earned: 11, judgment: false, criteria: [crit('c', 11, 11, 'met', 'Staff reason C.')], parts: [], student_feedback: null },
    { id: 'action', label: 'Action and decision', points: 28, earned: 22, judgment: false, criteria: [crit('d', 28, 22, 'partial', 'Staff reason D.')], parts: [], student_feedback: 'Coach line D.' },
    { id: 'documentation', label: 'Documentation and communication', points: 28, earned: null, suggested: 22, judgment: true, criteria: [],
      parts: [
        { id: 'note', label: 'Work note', points: 18, suggested: 14, criteria: [crit('e', 18, 14, 'partial', 'Staff reason E.')] },
        { id: 'reply', label: 'Reply to the user', points: 10, suggested: 8, criteria: [crit('f', 10, 8, 'partial', 'Staff reason F.')] },
      ], student_feedback: 'Coach line E.' },
  ],
};
const ROW = { id: 'attempt-1', lab_key: LAB, track_code: 'HDESK', pass_threshold: 70, student_id: '9900000099-HDESK', completed_at: '2026-11-10T15:00:00Z', result: { kind: 'hdesk-prove', ticketId: 'HD-2125' } };
const ITEM = { lead: ROW, name: 'Test Student', labTitles: ['Module 1 · Prove It'] };
// The same work with a critical rule fired: the engine zeroes every
// competency and part, keeping what its criteria found (…_before_critical).
const REC_CRITICAL = {
  ...REC, automatic_earned: 0, writing_suggested: 0, recommended_total: 0, recommended_score: 0, critical_error: true,
  critical_reasons: [{ id: 'x', reason: 'Staff-only critical reason.', feedback: 'A student-facing critical line.' }],
  competencies: REC.competencies.map((comp) => (comp.judgment
    ? { ...comp, suggested: 0, suggested_before_critical: comp.suggested, earned_before_critical: null, parts: comp.parts.map((part) => ({ ...part, suggested: 0, suggested_before_critical: part.suggested })) }
    : { ...comp, earned: 0, earned_before_critical: comp.earned, suggested_before_critical: null })),
};

function card(rec, row = ROW) {
  const cache = run('itsProveRecommendations');
  if (rec === undefined) cache.delete(row.id); else cache.set(row.id, rec);
  return run('itsProveGradingCard')({ ...ITEM, lead: row }, false);
}
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

function testSystemRubricBox() {
  const html = card(REC);
  const box = (/<section[^>]*data-its-prove-recommendation[\s\S]*?<\/section>/.exec(html) || [''])[0];
  assert.match(text(box), /System rubric \(recommendation, your review decides\)/);
  assert.match(text(box), /Scored by the system at submit · Key hdesk-its-01-prove-v2 · revision 2/);
  ['Staff reason A.', 'Staff reason B.', 'Staff reason D.'].forEach((reason) => assert.ok(box.includes(reason), reason));
  assert.match(text(box), /Work note: suggested 14 of 18 .*Suggested: check this\. ◐ Staff reason E\./);
  assert.match(text(box), /Reply to the user: suggested 8 of 10 .*Suggested: check this\. ◐ Staff reason F\./);
  assert.match(text(box), /Checked automatically: 61 of 72 · Writing: suggested 22 of 28/);
  assert.match(text(box), /Scored from the work and actions the student's browser recorded\. Check the evidence above before approving\./);
  assert.doesNotMatch(box, /Coach line|Strong triage/, 'student lines are pre-filled, not shown as the system\'s words');
  // Rescored: says so, with the date.
  const rescored = card({ ...REC, scored_on: 'rescore', rescored_at: '2026-11-11T09:00:00Z' });
  assert.match(text(rescored), /Scored by the system on rescore, Nov 11, 2026/);
}

function testPrefillAndWritingParts() {
  const html = card(REC);
  assert.match(html, /data-recommendation-id="rec-1"/);
  const pointsOf = (id) => (new RegExp(`data-its-prove-points="${id}"( value="(\\d+)")?`).exec(html) || [])[2];
  assert.deepEqual(['triage', 'investigation', 'diagnosis', 'action'].map(pointsOf), ['22', '6', '11', '22'], 'the automatic competencies are pre-filled');
  assert.doesNotMatch(html, /data-its-prove-points="documentation"/, 'the writing has no single box');
  assert.match(html, /data-its-prove-why="investigation"[^>]*>Coach line B\.<\/textarea>/, 'the student line is pre-filled, to edit');
  assert.match(html, /data-its-prove-why="triage"[^>]*>Strong triage\.<\/textarea>/, 'the optional positive line for full points');
  assert.match(html, /data-its-prove-why="diagnosis"[^>]*><\/textarea>/, 'no line, nothing pre-filled');
  // The writing parts: empty boxes, the suggestion beside each.
  assert.match(html, /data-its-prove-part="note"[^>]*class/);
  assert.doesNotMatch(html, /data-its-prove-part="(note|reply)" value=/);
  assert.match(text(html), /Work note \/ 18 Suggested 14 of 18/);
  assert.match(text(html), /Reply to the user \/ 10 Suggested 8 of 10/);
  assert.match(text(html), /I have read the student's work note and reply to the user\. Suggested scores: 14 and 8\./);
  assert.match(html, /data-its-prove-writing-ack/);
  assert.match(html, /data-its-prove-decide="returned" disabled/, 'Return waits too');
  // Critical: pre-ticked with the student line, never the staff reason.
  const critical = card(REC_CRITICAL);
  assert.match(critical, /data-its-prove-critical checked/);
  assert.match(critical, /data-its-prove-critical-reason[^>]*>A student-facing critical line\.<\/textarea>/);
  assert.match(text(critical), /Critical error: automatic zero\. Staff-only critical reason\. Every competency is recommended as 0\./);
}

function state(values) {
  return copy(run('itsProveGradeState')(RUBRIC, 70, values, REC));
}
const unchanged = { points: { triage: '22', investigation: '6', diagnosis: '11', action: '22' }, why: { investigation: 'Coach line B.', action: 'Coach line D.', documentation: 'Coach line E.' } };

function testDecisionGates() {
  let s = state({ ...unchanged, parts: {}, acknowledged: false });
  assert.equal(s.canApprove, false);
  assert.equal(s.canReturn, false);
  assert.equal(s.blocked, 'Enter the work note and reply to the user scores by hand.');
  assert.equal(s.totalLine, 'Checked automatically: 61 of 72 · Writing: suggested 22 of 28');
  s = state({ ...unchanged, parts: { note: '14', reply: '8' }, acknowledged: false });
  assert.equal(s.blocked, 'Tick that you have read the student\'s work note and reply to the user.');
  assert.equal(s.canReturn, false);
  s = state({ ...unchanged, parts: { note: '19', reply: '8' }, acknowledged: true });
  assert.equal(s.blocked, 'Each writing part takes whole points from 0 to its maximum.');
  // Approve unchanged, writing entered differently from the suggestion: no extra reason.
  s = state({ ...unchanged, parts: { note: '12', reply: '8' }, acknowledged: true });
  assert.equal(s.blocked, '');
  assert.equal(s.canApprove, true);
  assert.equal(s.canReturn, true);
  assert.equal(s.total, 81);
  assert.equal(s.totalLine, 'Checked automatically: 61 of 72 · Writing: suggested 22 of 28 · Final 81');
  assert.deepEqual(s.changed, []);
  // A changed pre-filled score needs a reason other than the pre-filled line.
  s = state({ ...unchanged, points: { ...unchanged.points, investigation: '4' }, parts: { note: '14', reply: '8' }, acknowledged: true });
  assert.equal(s.blocked, 'Say why you changed: Investigation.');
  assert.equal(s.canReturn, false);
  s = state({ ...unchanged, points: { ...unchanged.points, investigation: '4' }, why: { ...unchanged.why, investigation: 'Searched, but never opened the result.' }, parts: { note: '14', reply: '8' }, acknowledged: true });
  assert.equal(s.blocked, '');
  assert.deepEqual(s.changed.map((row) => [row.id, row.recommended, row.earned]), [['investigation', 6, 4]]);
  // Below full points still needs feedback (the existing rule).
  s = state({ ...unchanged, why: { ...unchanged.why, documentation: '' }, parts: { note: '14', reply: '8' }, acknowledged: true });
  assert.equal(s.blocked, 'Justify the points for: Documentation and communication.');
  // Critical ticked by the instructor: an automatic zero, Return only.
  s = copy(run('itsProveGradeState')(RUBRIC, 70, { ...unchanged, parts: { note: '18', reply: '10' }, acknowledged: true, critical: true, criticalReason: 'x' }, REC));
  assert.equal(s.totalLine, 'Checked automatically: 61 of 72 · Writing: suggested 22 of 28 · Critical error: automatic zero · Final 0');
  assert.equal(s.score, 0);
  assert.deepEqual(s.changed, [], 'nothing counts as changed under the zero');
  assert.equal(s.canApprove, false);
  assert.equal(s.canReturn, true);
  // Without a recommendation, exactly as before.
  const plain = copy(run('itsProveGradeState')(RUBRIC, 70, { points: {}, why: {} }));
  assert.equal(plain.canReturn, true);
  assert.equal(plain.totalLine, 'Total: not scored yet');
  assert.equal(plain.fromRecommendation, false);
}

function sheetStub(values) {
  const single = {
    '[data-its-prove-critical]': { checked: values.critical === true },
    '[data-its-prove-critical-reason]': { value: values.criticalReason || '' },
    '[data-its-prove-critical-reason-row]': { hidden: true },
    '[data-its-prove-total]': { textContent: '' },
    '[data-its-prove-decide="approved"]': { disabled: true },
    '[data-its-prove-decide="returned"]': { disabled: true },
    '[data-its-prove-blocked]': { textContent: '' },
    '[data-grading-status]': { textContent: '' },
    '[data-its-prove-efficiency]': { value: '' },
    '[data-its-prove-note]': { value: '' },
    '[data-its-prove-writing-ack]': { checked: values.acknowledged === true },
  };
  const groups = { 'data-its-prove-points': values.points, 'data-its-prove-why': values.why, 'data-its-prove-part': values.parts };
  return {
    dataset: { itsProveGrade: 'attempt-1', labKey: LAB, passMark: '70', recommendationId: 'rec-1' },
    single,
    querySelector: (selector) => single[selector],
    querySelectorAll: (selector) => {
      if (selector === '[data-its-prove-decide]') return [single['[data-its-prove-decide="approved"]'], single['[data-its-prove-decide="returned"]']];
      const group = groups[selector.slice(1, -1)];
      return group ? Object.entries(group).map(([key, value]) => ({ value, getAttribute: () => key })) : [];
    },
  };
}

async function testWhatIsSent() {
  run('itsProveRecommendations').set('attempt-1', REC);
  portal.supabaseCalls.length = 0;
  portal.supabaseRpcResponder = () => ({ data: { decision: 'approved' }, error: null });
  const sheet = sheetStub({ ...unchanged, parts: { note: '12', reply: '8' }, acknowledged: true });
  run('itsProveRefreshSheet')(sheet);
  assert.equal(sheet.single['[data-its-prove-total]'].textContent, 'Checked automatically: 61 of 72 · Writing: suggested 22 of 28 · Final 81');
  assert.equal(sheet.single['[data-its-prove-decide="approved"]'].disabled, false);
  let saved = 0;
  await run('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'approved' } }, async () => { saved += 1; });
  const call = portal.supabaseCalls.find((c) => c.rpc === 'record_lab_grade');
  assert.ok(call, 'record_lab_grade called');
  const args = copy(call.args);
  assert.equal(args.p_recommendation_id, 'rec-1');
  assert.equal(args.p_writing_acknowledged, true);
  assert.deepEqual(args.p_writing_parts, [{ competency: 'documentation', id: 'note', earned: 12 }, { competency: 'documentation', id: 'reply', earned: 8 }]);
  assert.deepEqual(args.p_competencies.map((c) => [c.id, c.earned]), [['triage', 22], ['investigation', 6], ['diagnosis', 11], ['action', 22], ['documentation', 20]]);
  assert.equal(args.p_competencies.find((c) => c.id === 'investigation').justification, 'Coach line B.');
  assert.equal(saved, 1);
  assert.equal(run('itsProveRecommendations').has('attempt-1'), false, 'reloaded after a decision');
  // Not acknowledged: nothing is sent.
  run('itsProveRecommendations').set('attempt-1', REC);
  portal.supabaseCalls.length = 0;
  const blocked = sheetStub({ ...unchanged, parts: { note: '12', reply: '8' }, acknowledged: false });
  await run('itsProveSubmitDecision')(blocked, { dataset: { itsProveDecide: 'returned' } }, async () => {});
  assert.equal(portal.supabaseCalls.filter((c) => c.rpc).length, 0);
  assert.equal(blocked.single['[data-grading-status]'].textContent, 'Tick that you have read the student\'s work note and reply to the user.');
}

function testNoRecommendation() {
  assert.match(text(card(undefined)), /Loading the system's recommendation…/);
  const none = card(null);
  assert.match(text(none), /No recommendation: no answer key is loaded for this lab\. Grade it by hand\./);
  assert.match(none, /data-its-prove-rescore="attempt-1"[^>]*>Score this attempt</);
  assert.match(none, /data-its-prove-points="documentation"/, 'one Documentation box, as before');
  assert.doesNotMatch(none, /data-its-prove-writing-ack|data-recommendation-id|data-its-prove-points="triage" value=/);
  assert.doesNotMatch(none, /data-its-prove-decide="returned" disabled/);
  const failed = card({ status: 'error', error: 'Unknown check type made_up' });
  assert.match(text(failed), /No recommendation: scoring failed\..*Scoring error: Unknown check type made_up/);
  assert.match(failed, /Score this attempt/);
  const mismatch = card({ status: 'version_mismatch', rubric_version: 'hdesk-its-01-prove-v1', key_rubric_version: 'hdesk-its-01-prove-v2' });
  assert.match(text(mismatch), /the attempt's rubric version \(hdesk-its-01-prove-v1\) doesn't match the key \(hdesk-its-01-prove-v2\)/);
  assert.doesNotMatch(mismatch, /Score this attempt/, 'a rescore can\'t override a version mismatch');
  const unavailable = card({ status: 'unavailable' });
  assert.match(text(unavailable), /The system's recommendation couldn't be loaded\. Reload this page before deciding\./);
  assert.doesNotMatch(unavailable, /Score this attempt|No recommendation: no answer key/);
  const decided = card(null, { ...ROW, reviewed_at: '2026-11-10T16:00:00Z' });
  assert.doesNotMatch(decided, /Score this attempt/, 'never once decided');
}

async function testRescoreAndLoading() {
  portal.supabaseCalls.length = 0;
  portal.supabaseRpcResponder = () => ({ data: { status: 'scored' }, error: null });
  run('itsProveRecommendations').set('attempt-2', null);
  const status = { textContent: '' };
  const button = { dataset: { itsProveRescore: 'attempt-2' }, disabled: false, parentElement: { querySelector: () => status } };
  let saved = 0;
  await run('itsProveRescore')(button, async () => { saved += 1; });
  assert.deepEqual(copy(portal.supabaseCalls.find((c) => c.rpc === 'rescore_lab_attempt').args), { p_attempt_id: 'attempt-2' });
  assert.equal(status.textContent, 'Scored. Refreshing…');
  assert.equal(saved, 1);
  assert.equal(run('itsProveRecommendations').has('attempt-2'), false);
  // Loading reads the staff tables for the cards that don't have one yet.
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => ({ data: call.table === 'lab_attempt_recommendations' ? [{ ...REC, lab_attempt_id: 'attempt-3' }] : [], error: null });
  const loaded = await run('itsProveLoadRecommendations')(['attempt-3', 'attempt-4']);
  assert.deepEqual([...loaded], ['attempt-3', 'attempt-4']);
  assert.deepEqual([...portal.supabaseCalls.map((c) => c.table)].sort(), ['lab_attempt_grade_reviews', 'lab_attempt_recommendations']);
  assert.equal(run('itsProveRecommendations').get('attempt-3').id, 'rec-1');
  assert.equal(run('itsProveRecommendations').get('attempt-4'), null);
  portal.supabaseCalls.length = 0;
  await run('itsProveLoadRecommendations')(['attempt-3']);
  assert.equal(portal.supabaseCalls.length, 0, 'loaded once');
  // A failed read is "unavailable", never "no key".
  portal.supabaseResponder = () => ({ data: null, error: { message: 'network' } });
  const logged = console.error; console.error = () => {};
  try { await run('itsProveLoadRecommendations')(['attempt-7']); } finally { console.error = logged; }
  assert.equal(run('itsProveRecommendations').get('attempt-7').status, 'unavailable');
  portal.supabaseResponder = () => ({ data: null, error: null });
}

// Deploy order: the portal reaches production before the migration. A missing
// table means "not set up yet": the card and the decision are exactly as before.
// Any other failure asks for a reload.
async function testTablesNotThereYet() {
  const logged = console.error; console.error = () => {};
  try {
    for (const [code, message] of [['PGRST205', "Could not find the table 'public.lab_attempt_recommendations' in the schema cache"], ['42P01', 'relation "public.lab_attempt_grade_reviews" does not exist']]) {
      const id = `attempt-missing-${code}`;
      portal.supabaseResponder = (call) => (call.table === (code === '42P01' ? 'lab_attempt_grade_reviews' : 'lab_attempt_recommendations') ? { data: null, error: { code, message } } : { data: [], error: null });
      await run('itsProveLoadRecommendations')([id]);
      assert.equal(run('itsProveRecommendations').get(id).status, 'not_enabled', code);
      const html = card(run('itsProveRecommendations').get(id), { ...ROW, id });
      assert.doesNotMatch(html, /System rubric|Score this attempt|couldn't be loaded|No recommendation|data-recommendation-id|data-its-prove-writing-ack/, `${code}: no box, no button`);
      assert.match(html, /data-its-prove-points="documentation"/, `${code}: one Documentation box, as today`);
      assert.doesNotMatch(html, /data-its-prove-decide="returned" disabled/, `${code}: Return as today`);
      // The decision goes out exactly as today: no new arguments.
      portal.supabaseCalls.length = 0;
      portal.supabaseRpcResponder = () => ({ data: { decision: 'approved' }, error: null });
      const sheet = sheetStub({ points: { triage: '22', investigation: '11', diagnosis: '11', action: '28', documentation: '28' }, why: {} });
      sheet.dataset = { itsProveGrade: id, labKey: LAB, passMark: '70' };
      run('itsProveRefreshSheet')(sheet);
      assert.equal(sheet.single['[data-its-prove-total]'].textContent, 'Total: 100 / 100');
      await run('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'approved' } }, async () => {});
      const args = copy(portal.supabaseCalls.find((c) => c.rpc === 'record_lab_grade').args);
      assert.deepEqual(Object.keys(args).sort(), ['p_attempt_id', 'p_competencies', 'p_critical_error', 'p_critical_reason', 'p_decision', 'p_efficiency', 'p_note', 'p_rubric_version'], `${code}: the old arguments only`);
    }
    // Any other failure: "couldn't be loaded, reload".
    portal.supabaseResponder = () => ({ data: null, error: { code: '08006', message: 'connection failure' } });
    await run('itsProveLoadRecommendations')(['attempt-other-error']);
    assert.equal(run('itsProveRecommendations').get('attempt-other-error').status, 'unavailable');
    assert.match(text(card({ status: 'unavailable' })), /couldn't be loaded\. Reload this page before deciding\./);
  } finally {
    console.error = logged;
    portal.supabaseResponder = () => ({ data: null, error: null });
  }
}

function testDecisionHistory() {
  const grade = { decision: 'returned', official_score: 64, created_at: '2026-11-10T16:00:00.123+00:00', competency_scores: [] };
  run('itsProveReviews').set('attempt-5', [{ lab_attempt_id: 'attempt-5', created_at: '2026-11-10T16:00:00.123+00:00', recommended_score: 66, recommended_critical: false, final_score: 64,
    changed: [{ id: 'investigation', label: 'Investigation', recommended: 6, final: 4 }, { id: 'critical', label: 'Critical error', recommended: true, final: true }].slice(0, 1),
    writing_parts: [{ label: 'Work note', entered: 12, suggested: 14, points: 18 }, { label: 'Reply to the user', entered: 8, suggested: 8, points: 10 }],
    writing_acknowledged_at: '2026-11-10T16:00:00Z' }]);
  const html = run('itsProveDecisionsHtml')({ id: 'attempt-5', official_grade: grade, official_grade_history: [{ ...grade, notes: [] }] });
  assert.match(text(html), /Recommended 66 · Final 64 · changed: Investigation \(6 → 4\) · writing entered by hand: Work note 12 \(suggested 14 of 18\), Reply to the user 8 \(suggested 8 of 10\) · writing read and acknowledged/);
  // A decision made by hand has no line.
  assert.doesNotMatch(run('itsProveDecisionsHtml')({ id: 'attempt-6', official_grade: grade, official_grade_history: [{ ...grade, notes: [] }] }), /data-its-prove-review-line/);
}

function testCriticalZeroOnTheCard() {
  const html = card(REC_CRITICAL);
  const box = (/<section[^>]*data-its-prove-recommendation[\s\S]*?<\/section>/.exec(html) || [''])[0];
  assert.match(text(box), /Triage 0 \/ 22 \(criteria found 22\)/, 'every competency 0, with what the criteria found');
  assert.match(text(box), /Work note: suggested 0 of 18 \(criteria found 14\)/);
  assert.ok(box.includes('Staff reason B.'), 'the staff reasons stay');
  assert.match(text(box), /Checked automatically: 0 of 72 · Writing: suggested 0 of 28/);
  assert.match(text(box), /Critical error: automatic zero\. Staff-only critical reason\./);
  assert.doesNotMatch(box, /A student-facing critical line/, 'the box shows the staff reason');
  // Pre-filled with what the criteria found, for an instructor who clears it.
  const pointsOf = (id) => (new RegExp(`data-its-prove-points="${id}"( value="(\\d+)")?`).exec(html) || [])[2];
  assert.deepEqual(['triage', 'investigation', 'diagnosis', 'action'].map(pointsOf), ['22', '6', '11', '22']);
  assert.match(text(html), /Suggested 0 of 18 while the critical error stands \(14 without it\)/);
  assert.match(text(html), /Suggested scores: 0 and 0 \(critical error: automatic zero\)\./);
  assert.match(html, /A critical error is an automatic zero/, 'the rule under the tick-box');

  const state = (values) => copy(run('itsProveGradeState')(RUBRIC, 70, values, REC_CRITICAL));
  // Kept: no writing parts needed, but the writing must still be acknowledged.
  let s = state({ ...unchanged, parts: {}, acknowledged: false, critical: true, criticalReason: 'A student-facing critical line.' });
  assert.equal(s.blocked, 'Tick that you have read the student\'s work note and reply to the user.');
  assert.equal(s.canReturn, false);
  s = state({ ...unchanged, parts: {}, acknowledged: true, critical: true, criticalReason: 'A student-facing critical line.' });
  assert.equal(s.totalLine, 'Checked automatically: 0 of 72 · Writing: suggested 0 of 28 · Critical error: automatic zero · Final 0');
  assert.equal(s.canReturn, true);
  assert.equal(s.canApprove, false);
  assert.deepEqual(s.changed, []);
  s = state({ ...unchanged, parts: {}, acknowledged: true, critical: true, criticalReason: '' });
  assert.equal(s.blocked, 'Give the reason for the critical error.');
  assert.equal(s.canReturn, false);
  // Cleared: starts from what the criteria found, so nothing is "changed".
  s = state({ ...unchanged, parts: { note: '14', reply: '8' }, acknowledged: true, critical: false });
  assert.deepEqual(s.changed, []);
  assert.equal(s.totalLine, 'Checked automatically: 61 of 72 · Writing: suggested 22 of 28 · Final 83');
  assert.equal(s.canApprove, true);
}

async function testCriticalZeroIsSent() {
  run('itsProveRecommendations').set('attempt-1', REC_CRITICAL);
  portal.supabaseCalls.length = 0;
  portal.supabaseRpcResponder = () => ({ data: { decision: 'returned' }, error: null });
  const sheet = sheetStub({ ...unchanged, parts: {}, acknowledged: true, critical: true, criticalReason: 'A student-facing critical line.' });
  run('itsProveRefreshSheet')(sheet);
  assert.equal(sheet.single['[data-its-prove-decide="approved"]'].disabled, true);
  assert.equal(sheet.single['[data-its-prove-decide="returned"]'].disabled, false);
  await run('itsProveSubmitDecision')(sheet, { dataset: { itsProveDecide: 'returned' } }, async () => {});
  const args = copy(portal.supabaseCalls.find((c) => c.rpc === 'record_lab_grade').args);
  assert.equal(args.p_critical_error, true);
  assert.deepEqual(args.p_competencies.map((c) => c.earned), [0, 0, 0, 0, 0], 'every competency goes as 0');
  assert.equal(args.p_competencies.find((c) => c.id === 'investigation').justification, 'Coach line B.', 'the notes still go');
  assert.deepEqual(args.p_writing_parts, [{ competency: 'documentation', id: 'note', earned: 0 }, { competency: 'documentation', id: 'reply', earned: 0 }]);
  assert.equal(args.p_recommendation_id, 'rec-1');
}

// The student's marked lab never shows the system's numbers or reasons.
function testStudentSeesNothingNew() {
  run('itsProveRecommendations').set('attempt-1', REC);
  const grade = { decision: 'returned', official_score: 64, created_at: '2026-11-10T16:00:00Z', competency_scores: [{ id: 'investigation', label: 'Investigation', points: 11, earned: 4, justification: 'Searched, but never opened the result.' }] };
  const html = run('itsProveMarkedLabHtml')({ ...ROW, redo_requested: true }, grade, []);
  assert.doesNotMatch(text(html), /Staff reason|Suggested|Checked automatically|Recommended|\b83\b|\b61\b|System rubric/);
  // A critical-error return: the label, the critical line and the notes; no 0% or points.
  const critical = { decision: 'returned', official_score: 0, critical_error: true, critical_error_reason: 'A student-facing critical line.', created_at: '2026-11-10T16:00:00Z',
    competency_scores: [{ id: 'investigation', label: 'Investigation', points: 11, earned: 0, justification: 'Coach line B.' }] };
  const notes = [{ item_label: 'Investigation', comment: 'Coach line B.', created_at: '2026-11-10T16:00:00Z' }, { item_label: 'Critical error', comment: 'A student-facing critical line.', created_at: '2026-11-10T16:00:00Z' }];
  const marked = text(run('itsProveMarkedLabHtml')({ ...ROW, redo_requested: true }, critical, notes));
  assert.match(marked, /Critical Error - Not Passed/);
  assert.match(marked, /Critical error: A student-facing critical line\./);
  assert.match(marked, /Investigation: Coach line B\./);
  assert.doesNotMatch(marked, /0%|0 \/ 11|Staff-only|Staff reason|automatic zero/);
}

(async () => {
  const tests = [testSystemRubricBox, testPrefillAndWritingParts, testDecisionGates, testWhatIsSent, testNoRecommendation, testRescoreAndLoading, testTablesNotThereYet, testDecisionHistory, testCriticalZeroOnTheCard, testCriticalZeroIsSent, testStudentSeesNothingNew];
  for (const test of tests) await test();
  console.log(`hdesk-prove-auto-score-sheet: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

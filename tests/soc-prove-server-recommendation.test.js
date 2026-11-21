// SOC Prove It scored by the database (migration
// 20261119204423_soc_prove_it_server_scoring.sql). The scoring itself is
// tested in supabase/tests/soc_prove_it_server_scoring.sql; this covers the
// portal's side:
//
//   - Modules 1-4's Prove Its send their work package marked kind
//     'soc-prove', with the raw ticket (case_record) and the rubric version
//     the key is loaded under; nothing the student sees changes (Module 3's
//     and Module 4's payloads are checked in m03-incident-resolutions.test.js
//     and soc-m04-assessment-submit.test.js, which drive those submits);
//   - the instructor's Submission Sheets for Modules 1-4 have a "Server
//     recommendation" box; other sheets and the student's marked lab don't;
//   - the box: competencies with their reasons, the recommended score, flag /
//     cap / zero rules, the not-scored states, and "Score this attempt"
//     (rescore_lab_attempt) only while undecided;
//   - loading: one query per page for the boxes' attempts, cached; a missing
//     table or an error never breaks the sheet.
//
// The recommendations here are made up: no answer key is involved.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const portal = loadPortal();
portal.requestAnimationFrame = () => 0;
const run = (code) => vm.runInContext(code, portal);
const copy = (value) => JSON.parse(JSON.stringify(value));
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const crit = (id, points, earned, met, reason) => ({ id, points, earned, met, reason, student_feedback: null });
const REC = {
  id: 'rec-1', lab_attempt_id: 'attempt-1', status: 'scored', track_code: 'SOCAN', rubric_version: 'soc-m01-prove-v1',
  key_rubric_version: 'soc-m01-prove-v1', key_revision: 3, scored_on: 'submit', rescored_at: null,
  automatic_points: 100, automatic_earned: 72, writing_points: 0, writing_suggested: 0,
  recommended_total: 72, recommended_score: 72, critical_error: false,
  critical_reasons: [{ id: 'flag-1', effect: 'flag', reason: 'Staff-only flag reason.', feedback: null }],
  competencies: [
    { id: 'scope', label: 'Scope', points: 40, earned: 25, judgment: false, criteria: [crit('a', 20, 20, 'met', 'Staff reason A.'), crit('b', 20, 10, 'partial', 'Staff reason B.'), crit('c', -5, -5, 'met', 'Deduction applied.'), crit('d', -3, 0, 'missing', 'Unused deduction.')], parts: [] },
    { id: 'notes', label: 'Notes', points: 60, earned: 47, judgment: false, criteria: [crit('e', 60, 47, 'partial', 'Staff reason E.')], parts: [] },
  ],
};
const ROW = { id: 'attempt-1', lab_key: 'lab-soc-escalation', track_code: 'SOCAN', pass_threshold: 70, score: 72, student_id: '9900000099-SOCAN',
  completed_at: '2026-11-19T15:00:00Z', result: { kind: 'soc-prove', breakdown: {}, feedback: [], critical_errors: [], case_record: { status: 'in-progress', notes: 'A note.' } } };

// A fake slot element, as the sheet draws it.
function slot(id, decided = false) {
  const buttons = [];
  const status = { textContent: '' };
  return {
    dataset: { sheetServerRec: id, sheetServerRecDecided: decided ? '1' : '0' },
    innerHTML: '',
    buttons,
    status,
    querySelectorAll(selector) {
      if (selector !== '[data-sheet-server-rescore]' || !this.innerHTML.includes('data-sheet-server-rescore=')) return [];
      const button = { dataset: { sheetServerRescore: id }, disabled: false, listeners: [], addEventListener(type, fn) { this.listeners.push(fn); } };
      buttons.push(button);
      return [button];
    },
    querySelector(selector) { return selector === '[data-sheet-server-rescore-status]' ? status : null; },
  };
}

test('Module 1 sends kind soc-prove, the raw ticket and the key\'s rubric version', async () => {
  const inserts = [];
  portal.supabaseResponder = (call) => {
    if (call.table === 'lab_attempts' && call.op === 'insert') inserts.push(copy(call.payload));
    return { data: [], error: null };
  };
  // Made-up ticket values: only the payload's shape is checked.
  run(`moduleOneUser = { userId: 'u-1', trackCode: 'SOCAN', email: 'x@test.local', latestLabAttemptByKey: {}, openLabRedosByModuleKey: {} };
    moduleOneState = JSON.parse(JSON.stringify(MODULE_ONE_DEFAULT_STATE));
    Object.assign(moduleOneState.lab2, { status: 'in-progress', affectedUser: 'u.test', affectedDevice: 'DEV-TEST', priority: 'p-test',
      verdict: 'v-test', escalation: 'e-test', escalateTo: '', notes: 'n'.repeat(90),
      reviewedEvidence: MODULE_ONE_ESCALATION_LAB.scenario.evidence.map((item) => item.id) });
    moduleOneFinalizeProveIt();`);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(inserts.length, 1, 'one attempt saved');
  const row = inserts[0];
  assert.equal(row.lab_key, 'lab-soc-escalation');
  assert.equal(row.result.kind, 'soc-prove');
  assert.equal(row.rubric_version, 'soc-m01-prove-v1');
  assert.equal(row.result.case_record.notes, 'n'.repeat(90), 'the raw ticket is saved');
  assert.equal(row.result.case_record.affectedUser, 'u.test');
  assert.ok(row.result.breakdown && Array.isArray(row.result.feedback), 'the browser\'s own breakdown is still saved (removed in a later sprint)');
});

test('Module 2 sends kind soc-prove, the raw ticket and the key\'s rubric version', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  // The Module 2 console is a closure; re-run it with a hook that exposes its submit.
  const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-02-environment.js'), 'utf8');
  const end = src.lastIndexOf('}());');
  assert.ok(end > 0, 'the Module 2 console closure ends where expected');
  vm.runInContext(`${src.slice(0, end)}globalThis.__m02Test = { load, submitProve, get state() { return state; }, findings: CASE_FINDINGS.map((f) => f.name) };\n${src.slice(end)}`, portal, { filename: 'm02-hooked.js' });
  const inserts = [];
  portal.supabaseResponder = (call) => {
    if (call.table === 'lab_attempts' && call.op === 'insert') inserts.push(copy(call.payload));
    return { data: [], error: null };
  };
  // Made-up ticket values: only the payload's shape is checked.
  run(`__m02Test.load({ userId: 'u-2', trackCode: 'SOCAN', email: 'y@test.local', latestLabAttemptByKey: {}, openLabRedosByModuleKey: {} });
    Object.assign(__m02Test.state.practice.caseRecord, { status: 'in-progress', affectedUser: 'u.test', affectedDevice: 'DEV-TEST', severity: 's-test',
      disposition: 'd-test', escalation: 'e-test', escalateTo: '', notes: 'n'.repeat(90),
      findings: Object.fromEntries(__m02Test.findings.map((name) => [name, 'f-test'])) });
    __m02Test.submitProve();`);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(inserts.length, 1, 'one attempt saved');
  const row = inserts[0];
  assert.equal(row.lab_key, 'lab-identity-investigation');
  assert.equal(row.result.kind, 'soc-prove');
  assert.equal(row.rubric_version, 'soc-m02-prove-v1');
  assert.equal(row.result.case_record.notes, 'n'.repeat(90), 'the raw ticket is saved');
  assert.equal(row.result.case_record.affectedUser, 'u.test');
  assert.equal(row.result.case_record.submitted, true);
  assert.ok(row.result.breakdown && Array.isArray(row.result.feedback) && row.result.access_review, 'the browser\'s own breakdown and review panel are still saved');
});

test('the Module 1-4 sheets have the box; other sheets and the student view do not', () => {
  const sheet = run('AdminSubmissionSheet');
  const html = sheet.render(ROW, { item: { lead: ROW, rows: [ROW], ids: [ROW.id] } });
  assert.match(html, /data-sheet-server-rec="attempt-1" data-sheet-server-rec-decided="0"/);
  assert.match(html, /Loading the server's recommendation/);
  const decided = sheet.render({ ...ROW, reviewed_at: '2026-11-20T10:00:00Z' }, { readOnly: true, sentFeedback: [] });
  assert.match(decided, /data-sheet-server-rec-decided="1"/);
  const student = sheet.renderStudent(ROW, { feedback: [] });
  assert.ok(student, 'the student view renders');
  assert.doesNotMatch(student, /data-sheet-server-rec|Server recommendation/);
  ['lab-identity-investigation', 'lab-siem-triage', 'lab-detection-rule'].forEach((labKey, i) => {
    const moved = { ...ROW, id: `attempt-m${i + 2}`, lab_key: labKey };
    assert.match(sheet.render(moved, {}), new RegExp(`data-sheet-server-rec="attempt-m${i + 2}"`), `${labKey} has the box`);
    assert.doesNotMatch(sheet.renderStudent(moved, { feedback: [] }) || '', /data-sheet-server-rec|Server recommendation/, `${labKey}: not in the student view`);
  });
  const other = { ...ROW, id: 'attempt-2', lab_key: 'lab-endpoint-investigation' };
  assert.doesNotMatch(sheet.render(other, {}), /data-sheet-server-rec/, 'a module not moved yet has no box');
});

test('a scored recommendation: competencies, reasons, total and flags', () => {
  const html = run('socProveRecommendationHtml')('attempt-1', REC);
  assert.match(html, /Scored at submit · key soc-m01-prove-v1 · revision 3/);
  assert.match(html, /data-sheet-server-rec-comp="scope"[\s\S]*25 \/ 40/);
  assert.match(html, /✓ Staff reason A\. <span class="text-gray-500">\(20 \/ 20\)/);
  assert.match(html, /◐ Staff reason B\./);
  assert.match(html, /Deduction applied\./, 'an applied deduction is listed');
  assert.doesNotMatch(html, /Unused deduction/, 'an unused deduction is not');
  assert.match(html, /Recommended score<\/span><span[^>]*>72 \/ 100<\/span>/);
  assert.match(html, /Flagged for your review:<\/strong> Staff-only flag reason\./);
  assert.doesNotMatch(html, /data-sheet-server-rescore=/, 'a scored attempt has no rescore button');
});

test('a cap and a zero read as such', () => {
  const capped = { ...REC, recommended_total: 88, recommended_score: 69, critical_reasons: [{ id: 'c', effect: 'cap', cap: 69, reason: 'Unsafe step.' }] };
  const html = run('socProveRecommendationHtml')('attempt-1', capped);
  assert.match(html, /69 \/ 100 <span class="font-normal text-gray-500">\(capped from 88\)/);
  assert.match(html, /Score capped at 69:<\/strong> Unsafe step\./);
  const zero = { ...REC, recommended_total: 0, recommended_score: 0, critical_error: true, critical_reasons: [{ id: 'z', reason: 'Zero rule.' }],
    competencies: REC.competencies.map((c) => ({ ...c, earned: 0, earned_before_critical: c.earned })) };
  const zeroHtml = run('socProveRecommendationHtml')('attempt-1', zero);
  assert.match(zeroHtml, /Critical error: automatic zero:<\/strong> Zero rule\./);
  assert.match(zeroHtml, /0 \/ 40 <span class="font-normal text-gray-500">\(criteria found 25\)/);
});

test('not scored: why, and Score this attempt only while undecided', () => {
  const html = run('socProveRecommendationHtml');
  assert.match(html('a', { ...REC, status: 'no_key' }), /no answer key is loaded for this lab[\s\S]*data-sheet-server-rescore="a"/);
  assert.doesNotMatch(html('a', { ...REC, status: 'no_key' }, { decided: true }), /data-sheet-server-rescore=/);
  assert.match(html('a', { ...REC, status: 'version_mismatch', rubric_version: 'v0', key_rubric_version: 'v1' }), /rubric version \(v0\) doesn&#39;t match the key \(v1\)/);
  assert.doesNotMatch(html('a', { ...REC, status: 'version_mismatch' }), /data-sheet-server-rescore=/);
  assert.match(html('a', { ...REC, status: 'error', error: 'boom <b>' }), /Scoring error: boom &lt;b&gt;[\s\S]*data-sheet-server-rescore=/);
  assert.match(html('a', null), /sent before server scoring/);
  assert.match(html('a', undefined), /Loading/);
  assert.match(html('a', { status: 'not_enabled' }), /isn&#39;t set up on this database yet/);
  assert.match(html('a', { status: 'unavailable' }), /couldn&#39;t be loaded/);
});

test('student text and staff text are escaped', () => {
  const rec = { ...REC, competencies: [{ ...REC.competencies[0], label: '<img src=x>', criteria: [crit('x', 10, 10, 'met', '<script>x</script>')] }] };
  const html = run('socProveRecommendationHtml')('a', rec);
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
});

test('loading: one query for the page, cached; missing table and errors are contained', async () => {
  run('socProveRecommendations.clear()');
  const calls = [];
  portal.supabaseResponder = (call) => { calls.push(call); return { data: [REC], error: null }; };
  const load = run('socProveLoadRecommendations');
  assert.deepEqual([...await load(['attempt-1', 'attempt-9', 'attempt-1'])], ['attempt-1', 'attempt-9']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].table, 'lab_attempt_recommendations');
  assert.equal(run("socProveRecommendations.get('attempt-1').id"), 'rec-1');
  assert.equal(run("socProveRecommendations.get('attempt-9')"), null, 'an attempt with no row reads as none');
  assert.deepEqual([...await load(['attempt-1'])], [], 'cached');
  assert.equal(calls.length, 1);

  run('socProveRecommendations.clear()');
  portal.supabaseResponder = () => ({ data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.lab_attempt_recommendations' in the schema cache" } });
  await load(['attempt-1']);
  assert.equal(run("socProveRecommendations.get('attempt-1').status"), 'not_enabled');
  run('socProveRecommendations.clear()');
  const errors = [];
  const saved = portal.console;
  portal.console = { ...saved, error: (...args) => errors.push(args) };
  portal.supabaseResponder = () => ({ data: null, error: { code: '500', message: 'down' } });
  await load(['attempt-1']);
  portal.console = saved;
  assert.equal(run("socProveRecommendations.get('attempt-1').status"), 'unavailable');
  assert.equal(errors.length, 1);
});

test('Score this attempt calls rescore_lab_attempt and redraws the box', async () => {
  run('socProveRecommendations.clear()');
  run("socProveRecommendations.set('attempt-1', { status: 'no_key' })");
  const box = slot('attempt-1');
  run('socProveFillSlot')(box);
  assert.match(box.innerHTML, /Server recommendation[\s\S]*no answer key/);
  assert.equal(box.buttons.length, 1);
  const rpcs = [];
  portal.supabaseRpcResponder = (name, args) => { rpcs.push({ name, args: copy(args) }); return { data: { status: 'scored' }, error: null }; };
  portal.supabaseResponder = () => ({ data: [REC], error: null });
  assert.equal(await run('socProveRescore')(box.buttons[0], box), true);
  assert.deepEqual(rpcs, [{ name: 'rescore_lab_attempt', args: { p_attempt_id: 'attempt-1' } }]);
  assert.match(box.innerHTML, /Recommended score/);

  run("socProveRecommendations.set('attempt-1', { status: 'error' })");
  const failing = slot('attempt-1');
  run('socProveFillSlot')(failing);
  portal.supabaseRpcResponder = () => ({ data: null, error: { message: 'You do not grade this course.' } });
  assert.equal(await run('socProveRescore')(failing.buttons[0], failing), false);
  assert.equal(failing.status.textContent, "Couldn't score it: You do not grade this course.");
  assert.equal(failing.buttons[0].disabled, false);

  const rejected = slot('attempt-1');
  run('socProveFillSlot')(rejected);
  portal.supabaseRpcResponder = () => { throw new Error('Network unavailable'); };
  assert.equal(await run('socProveRescore')(rejected.buttons[0], rejected), false);
  assert.equal(rejected.status.textContent, "Couldn't score it: Network unavailable");
  assert.equal(rejected.buttons[0].disabled, false, 'a rejected RPC can be retried');

  const decided = slot('attempt-1', true);
  run("socProveRecommendations.set('attempt-1', { status: 'no_key' })");
  run('socProveFillSlot')(decided);
  assert.equal(decided.buttons.length, 0, 'no button once decided');
});

(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
    } catch (error) {
      error.message = `${name}: ${error.message}`;
      throw error;
    }
  }
  console.log(`soc-prove-server-recommendation: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exitCode = 1; });

// Help Desk capstone (Module 12): every submitted attempt reaches the
// instructor, and the student sees no score or pass/fail until the instructor
// finalizes it (owner rule, 2026-10-20).
//
//   - A failed attempt (below 70) is saved as 'submitted', so it appears in
//     the grading queue instead of staying 'in_progress'.
//   - An attempt with a critical error but a score of 70 or more is saved
//     with critical_errors, so verified progress never counts it.
//   - A passing attempt is saved as 'complete' with the capstone's own rubric
//     version, as before.
//   - After Submit the page shows only "Submitted to your instructor for
//     review": no score, pass/fail heading, breakdown or explanations.
//   - While an attempt waits on the instructor, Submit and Reset are off and
//     a submit sends nothing (the database's one-pending rule).
//   - A returned attempt can be resubmitted once; a finalized one links to
//     the marked lab.
//   - A failed save keeps the answers and lets the student try again.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
ctx.render = () => {};
ctx.requestAnimationFrame = (fn) => fn();

const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const LAB = 'lab-its-12-capstone';
const STATE_ID = run('ITS12_LAB_ID');
const TICKETS = run('ITS12_TICKETS');

const SUBMITTED = '2026-10-01T10:00:00Z';
const REVIEWED = '2026-10-02T10:00:00Z';
const waiting = () => ({ completedAt: SUBMITTED, reviewedAt: null, redoRequested: false, supersededAt: null });
const approved = () => ({ ...waiting(), reviewedAt: REVIEWED });
const returned = () => ({ ...waiting(), reviewedAt: REVIEWED, redoRequested: true });

function hdUser(attempts = {}) {
  return {
    userId: 'user-hdesk', email: 'hdesk@test.invalid', trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}

// Every field the capstone requires, so validation passes; the score itself
// is stubbed per test.
const answered = () => ({
  ticketResponses: Object.fromEntries(TICKETS.map((t, i) => [t.id, {
    priority: String(i + 1), category: 'Identity', decision: 'escalate',
    firstStep: 'Confirm scope with the user', reasoning: 'Outside L1 authority, escalate per runbook',
  }])),
  kbArticle: 'Symptom, cause, fix, verification.', afterAction: 'Went well, do differently, learned.',
});

function open(user, { score = 80, criticalErrors = [] } = {}) {
  ctx.supabaseCalls.length = 0;
  ctx.localStorage.clear();
  ctx.supabaseResponder = () => ({ data: null, error: null });
  LabRuntime.save(STATE_ID, user, { ...LabRuntime.load(STATE_ID, user, {}), ...answered() });
  ctx.its12Score = () => ({
    score, criticalErrors, feedback: ['Ticket HD-2110: the correct call was escalate.'],
    breakdown: { triage: 9, technical: 9, communication: 9, escalation: 9, security: 9, kb: 9, afterAction: 9 },
  });
  run('its12Submitting = false');
  return run(`MODULE_LABS['it-support/12']`).view(user, HD);
}

const inserts = () => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && c.payload.lab_key === LAB);
const panel = () => run('its12ScorePanel()');
const buttons = () => run('its12ActionButtons()');
const submitButton = () => /<button[^>]*data-its12-submit[^>]*>/.exec(buttons())[0];
const noGrade = (page, label) => {
  // The hero states the published pass mark; anything else out of 100 is a score.
  const html = page.replace(/passing score \d+\/100/g, '');
  assert.doesNotMatch(html, /\d+\/100/, `${label}: no score shown`);
  assert.doesNotMatch(html, /Capstone passed|Review the feedback and retry|Provisional/, `${label}: no pass/fail shown`);
  assert.doesNotMatch(html, /Triage & prioritization|correct call was/, `${label}: no breakdown or explanations`);
};

async function testFailedAttemptReachesReview() {
  const user = hdUser();
  open(user, { score: 65 });
  await run('its12Submit()');
  const rows = inserts();
  assert.equal(rows.length, 1, 'one attempt saved');
  assert.equal(rows[0].payload.state, 'submitted', 'a 65 is saved for instructor review');
  assert.equal(rows[0].payload.rubric_version, 'it-support-capstone-v1', 'capstone rubric version kept');
  noGrade(panel(), 'after a failed submit');
  assert.match(panel(), /Submitted to your instructor for review/);
  assert.match(submitButton(), /disabled/, 'Submit is off while the attempt waits');
  assert.equal(run('its12StatusLabel()'), 'Submitted for review');
}

async function testCriticalErrorIsNeverVerified() {
  const user = hdUser();
  open(user, { score: 85, criticalErrors: ['Resolved a security incident instead of escalating'] });
  await run('its12Submit()');
  const row = inserts()[0];
  assert.deepEqual(row.payload.result.critical_errors, ['Resolved a security incident instead of escalating'],
    'critical_errors stored where the verified-progress view checks');
  assert.equal(row.payload.result.passedAutomatedGate, false);
  noGrade(panel(), 'after a critical-error submit');
}

async function testPassingAttemptUnchangedButHidden() {
  const user = hdUser();
  open(user, { score: 92 });
  await run('its12Submit()');
  const row = inserts()[0];
  assert.equal(row.payload.state, 'complete', 'a pass is saved as complete, as before');
  assert.equal(row.payload.score, 92, 'the score is saved for the instructor');
  assert.equal(row.payload.scoring_engine_version, 'it-support-capstone-scorer-v1');
  assert.ok(ctx.supabaseCalls.some((c) => c.table === 'portfolio_artifacts' && c.op === 'insert'), 'capstone report artifact saved');
  noGrade(panel(), 'after a passing submit');
  assert.match(panel(), /Submitted to your instructor for review/);
}

async function testWaitingAttemptBlocksResubmit() {
  const user = hdUser({ [LAB]: waiting() });
  const html = open(user, { score: 95 });
  noGrade(html, 'page with a waiting attempt');
  assert.match(submitButton(), /disabled/, 'Submit off on load when an attempt waits (server state)');
  await run('its12Submit()');
  assert.equal(inserts().length, 0, 'nothing is sent while an attempt waits');
}

async function testDoubleClickSendsOne() {
  const user = hdUser();
  open(user, { score: 50 });
  await Promise.all([run('its12Submit()'), run('its12Submit()')]);
  assert.equal(inserts().length, 1, 'a double click sends one attempt');
}

async function testReturnedAttemptResubmitsOnce() {
  const user = hdUser({ [LAB]: returned() });
  const html = open(user, { score: 74 });
  assert.match(html, /Returned for revision/, 'return notice shown');
  assert.doesNotMatch(submitButton(), /disabled/, 'Submit on after a return');
  await run('its12Submit()');
  await run('its12Submit()');
  assert.equal(inserts().length, 1, 'one resubmission');
  assert.match(panel(), /Submitted to your instructor for review/);
}

async function testFinalizedLinksToMarkedLab() {
  const user = hdUser({ [LAB]: approved() });
  const html = open(user);
  noGrade(html, 'finalized page');
  assert.match(panel(), /Your instructor has finalized your capstone/);
  assert.match(panel(), /data-action="open-marked-lab" data-lab-key="lab-its-12-capstone"/, 'links to the marked lab');
  assert.match(submitButton(), /disabled/, 'no new attempt after approval');
}

async function testFailedSaveKeepsAnswers() {
  const user = hdUser();
  open(user, { score: 80 });
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert'
    ? { data: null, error: { code: '42501', message: 'refused' } } : { data: null, error: null });
  await run('its12Submit()');
  assert.equal(run('its12State.attempts'), 0, 'no attempt counted');
  assert.ok(Object.keys(run('its12State.ticketResponses')).length === TICKETS.length, 'answers kept');
  assert.doesNotMatch(submitButton(), /disabled/, 'student can submit again');
  assert.ok(!ctx.supabaseCalls.some((c) => c.table === 'portfolio_artifacts'), 'no artifact without a saved attempt');
}

async function testPracticeLabsKeepHelpDeskVersion() {
  const user = hdUser();
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  await run('itsSubmitLabAttempt')(user, 'its-03', 'lab-its-03-coach', { state: 'complete', result: {} });
  const row = ctx.supabaseCalls.find((c) => c.table === 'lab_attempts' && c.op === 'insert');
  assert.equal(row.payload.rubric_version, 'it-support-practice-v1', 'callers without a version keep the Help Desk default');
}

(async () => {
  const tests = [
    testFailedAttemptReachesReview,
    testCriticalErrorIsNeverVerified,
    testPassingAttemptUnchangedButHidden,
    testWaitingAttemptBlocksResubmit,
    testDoubleClickSendsOne,
    testReturnedAttemptResubmitsOnce,
    testFinalizedLinksToMarkedLab,
    testFailedSaveKeepsAnswers,
    testPracticeLabsKeepHelpDeskVersion,
  ];
  let failed = 0;
  for (const test of tests) {
    try {
      await test();
      console.log(`ok   ${test.name}`);
    } catch (err) {
      failed += 1;
      console.log(`FAIL ${test.name}\n     ${String(err && err.message).split('\n')[0]}`);
    }
  }
  if (failed) { console.log(`${failed} of ${tests.length} failed`); process.exit(1); }
  console.log(`all ${tests.length} passed`);
})();

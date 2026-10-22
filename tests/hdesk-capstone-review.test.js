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
//
// Scoring and the instructor sheet:
//   - Ranking is scored by priority band: any order inside a band earns the
//     same triage credit; a rank outside the band loses it. Only the exact
//     SLA order inside a band of two or more shows "Exceeds" on the sheet.
//   - The saved feedback is domain scores only: no explanation or answer.
//   - A first step earns technical credit only as a real action of 15+
//     characters, never a bare decision such as "escalate" or "report it".
//   - Submit refuses two tickets with the same rank.
//   - No priority or category tag is shown on any capstone ticket.
//   - While an attempt waits, every answer field is locked; a return
//     unlocks them. The ticket widget is unchanged when not locked.
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
const realScore = run('its12Score');
const Sheet = run('AdminSubmissionSheet');
const ticket = (id) => TICKETS.find((t) => t.id === id);

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

// Answers that earn every domain, in the correct SLA order. Rank, category
// and decision come from the tickets; the text is just enough to match each
// ticket's patterns.
const STEP = {
  'SEC-2114': 'isolate the laptop', 'HD-2110': 'confirm the scope', 'HD-2104': 'run ipconfig first',
  'SR-2107': 'check the group list', 'HD-2109': 'check the user profile', 'HD-2106': 'restart the spooler',
};
const REASON = {
  'SEC-2114': 'possible phishing', 'HD-2110': 'outside L1 scope', 'HD-2104': 'looks like APIPA here',
  'SR-2107': 'missing group access', 'HD-2109': 'profile looks corrupt', 'HD-2106': 'print spooler fault',
};
const strong = () => Object.fromEntries(TICKETS.map((t) => [t.id, {
  priority: String(t.correctRank), category: t.category, decision: t.decision, firstStep: STEP[t.id], reasoning: REASON[t.id],
}]));
const KB = 'Symptom: connected to Wi-Fi but nothing loads. Cause: no DHCP lease (APIPA). Fix: renew the lease. Verification: internal site loads.';
const AFTER = 'Ranking went well; next time I would confirm scope sooner before writing notes.';
const withRanks = (ranks) => {
  const responses = strong();
  Object.entries(ranks).forEach(([id, rank]) => { responses[id].priority = String(rank); });
  return responses;
};
function scoreOf(ticketResponses) {
  ctx.__state = { ...run('ITS12_DEFAULT_STATE'), ticketResponses, kbArticle: KB, afterAction: AFTER };
  run('its12State = __state');
  return realScore();
}
const sheetFor = (ticketResponses) => Sheet.evaluate({
  lab_key: LAB, track_code: 'HDESK', score: 90, pass_threshold: 70, completed_at: '2026-10-21T10:00:00Z',
  result: { ticketResponses, kbArticle: KB, afterAction: AFTER },
});
const priorityCheck = (sheet, id) => sheet.sections.find((s) => s.id === `capstone-${id.toLowerCase()}`).checks[0];

function open(user, { score = 80, criticalErrors = [], real = false, responses = null } = {}) {
  ctx.supabaseCalls.length = 0;
  ctx.localStorage.clear();
  ctx.supabaseResponder = () => ({ data: null, error: null });
  const answers = answered();
  if (responses) answers.ticketResponses = responses;
  LabRuntime.save(STATE_ID, user, { ...LabRuntime.load(STATE_ID, user, {}), ...answers });
  ctx.its12Score = real ? realScore : () => ({
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

// Every other check reads the tickets, so they must not pass on empty data.
function testCapstoneHasSixTickets() {
  assert.equal(TICKETS.length, 6, 'the capstone has exactly six tickets');
  assert.deepEqual([...TICKETS].map((t) => t.id).sort(), Object.keys(STEP).sort(), 'every ticket has a test fixture');
}

function testWithinBandSwapScoresSame() {
  const correct = scoreOf(strong());
  const swapped = scoreOf(withRanks({ 'SR-2107': 5, 'HD-2109': 4 }));
  assert.equal(correct.breakdown.triage, 15, 'correct order: full triage credit');
  assert.equal(swapped.breakdown.triage, 15, 'swapping two P3 tickets keeps full triage credit');
  assert.equal(swapped.score, correct.score, 'same total score');
  const good = sheetFor(strong());
  const swap = sheetFor(withRanks({ 'SR-2107': 5, 'HD-2109': 4 }));
  ['SR-2107', 'HD-2109', 'HD-2110', 'HD-2104'].forEach((id) => {
    assert.equal(priorityCheck(good, id).outcome, 'pass');
    assert.match(priorityCheck(good, id).given, /Exceeds: SLA order inside the P[23] band/, `${id}: correct order exceeds`);
  });
  ['SR-2107', 'HD-2109'].forEach((id) => {
    assert.equal(priorityCheck(swap, id).outcome, 'pass', `${id}: band credit when swapped`);
    assert.doesNotMatch(priorityCheck(swap, id).given, /Exceeds/, `${id}: no exceeds when swapped`);
  });
  assert.equal(priorityCheck(good, 'SR-2107').expected, 'P3 band, rank 4–5');
  ['SEC-2114', 'HD-2106'].forEach((id) => {
    assert.match(priorityCheck(good, id).given, /Only ticket in the P[14] band/, `${id}: alone in its band`);
    assert.doesNotMatch(priorityCheck(good, id).given, /Exceeds/, `${id}: no exceeds when alone in a band`);
  });
  assert.equal(priorityCheck(good, 'SEC-2114').expected, 'P1 band, rank 1');
}

function testOutOfBandLosesCredit() {
  const result = scoreOf(withRanks({ 'SR-2107': 2, 'HD-2110': 4 }));
  assert.equal(result.breakdown.triage, 10, 'two tickets outside their band: 4 of 6 ranked in band');
  const sheet = sheetFor(withRanks({ 'SR-2107': 2, 'HD-2110': 4 }));
  assert.equal(priorityCheck(sheet, 'SR-2107').outcome, 'fail', 'a P3 ticket at rank 2 fails the priority check');
  assert.doesNotMatch(priorityCheck(sheet, 'SR-2107').fix, /rank \d/i, 'the red-pen note does not give the rank');
}

async function testFeedbackIsDomainOnly() {
  const weak = Object.fromEntries(TICKETS.map((t, i) => [t.id, {
    priority: String(6 - i), category: 'network', decision: 'resolve', firstStep: 'escalate', reasoning: 'no idea',
  }]));
  const result = scoreOf(weak);
  assert.deepEqual([...result.feedback].map((line) => line.replace(/\d+\/\d+$/, 'N')), [
    'Triage N', 'Technical accuracy N', 'Communication N', 'Escalation judgment N',
    'Security handling N', 'KB article N', 'After-action review N',
  ], 'one line per domain, nothing else');
  assert.equal(result.criticalErrors.length, 1, 'resolving the security ticket is a critical error');
  assert.match(result.criticalErrors[0], /^SEC-2114: critical error\./);
  assert.doesNotMatch(result.criticalErrors[0], /escalat|Security Incident|security/i, 'no right decision or category');
  // What is saved with the attempt (student-readable) carries none of it.
  open(hdUser(), { real: true, responses: weak });
  await run('its12Submit()');
  const saved = JSON.stringify([inserts()[0].payload.result.feedback, inserts()[0].payload.result.criticalErrors,
    ctx.supabaseCalls.find((c) => c.table === 'portfolio_artifacts').payload.content.feedback]);
  TICKETS.forEach((t) => assert.ok(!saved.includes(t.explain), `${t.id}: explain text not saved`));
  assert.doesNotMatch(saved, /always rank 1|correct call|should be|instead of|resolved|escalated/i, 'no answers or hints');
}

function testFirstStepNeedsRealAction() {
  const ok = run('its12FirstStepOk');
  assert.equal(ok(ticket('HD-2110'), 'escalate'), false, 'bare escalate');
  assert.equal(ok(ticket('HD-2110'), 'escalate to the server team'), false, 'decision only, even when long');
  assert.equal(ok(ticket('HD-2110'), 'escalate to tier 2 now'), false);
  assert.equal(ok(ticket('HD-2110'), 'rejoin the PC to the domain'), false, 'rejoin is the repair, not L1');
  assert.equal(ok(ticket('SEC-2114'), 'report it'), false, 'bare report');
  assert.equal(ok(ticket('SEC-2114'), 'report it to the security team'), false, 'decision only, even when long');
  assert.equal(ok(ticket('HD-2110'), 'nltest'), false, 'a real action under 15 characters');
  assert.equal(ok(ticket('HD-2110'), 'check the domain trust'), true);
  assert.equal(ok(ticket('HD-2110'), 'test the trust relationship'), true);
  assert.equal(ok(ticket('HD-2110'), 'Run Test-ComputerSecureChannel on the PC'), true);
  assert.equal(ok(ticket('HD-2110'), 'Confirm the scope with the user first'), true);
  assert.equal(ok(ticket('SEC-2114'), 'Isolate the laptop from the network'), true);
  assert.equal(ok(ticket('SEC-2114'), 'Tell the user not to reset or click anything'), true);
  assert.equal(ok(ticket('SEC-2114'), 'Disconnect the device from Wi-Fi'), true);
  assert.equal(ok(ticket('SEC-2114'), 'Ask whether the email contains a link'), false, '"contains" is not containment');
  assert.equal(ok(ticket('SEC-2114'), 'Start containment on the device'), true);
  assert.equal(ok(ticket('SEC-2114'), 'Do not isolate the laptop'), false, 'negated containment');
  assert.equal(ok(ticket('SEC-2114'), 'Never disconnect the device'), false, 'negated containment');
  assert.equal(ok(ticket('SEC-2114'), 'Isolate the laptop now'), true);
  assert.equal(ok(ticket('SEC-2114'), "Don't wait, isolate the laptop now"), true, 'a negation before another word is not rejected');
  assert.equal(ok(ticket('SEC-2114'), 'Tell the user: do not reset the password'), true, '"do not reset" stays a correct answer');
  assert.equal(ok(ticket('SEC-2114'), "Tell the user don't click anything"), true, '"don\'t click" stays a correct answer');
  const decisionOnly = withRanks({});
  decisionOnly['HD-2110'].firstStep = 'escalate';
  decisionOnly['SEC-2114'].firstStep = 'report it';
  assert.equal(scoreOf(decisionOnly).breakdown.technical, 13, 'two decision-only first steps lose technical credit');
  assert.equal(scoreOf(strong()).breakdown.technical, 20, 'real actions earn it');
}

async function testRepeatedRankBlocksSubmit() {
  open(hdUser(), { responses: withRanks({ 'HD-2104': 2 }) });
  await run('its12Submit()');
  assert.equal(inserts().length, 0, 'nothing is sent');
  assert.match(panel(), /Rank 2 is used twice\. Each ticket needs a different rank\./);
  assert.match(run('its12ExtrasAndActions()'), /data-its12-submit[\s\S]*Rank 2 is used twice/, 'message below the Submit button');
}

function testNoTagsShown() {
  open(hdUser());
  TICKETS.forEach((t) => {
    run(`its12State.activeTicket = ${JSON.stringify(t.id)}`);
    const queue = run('its12TicketQueue()');
    assert.match(queue, new RegExp(`<div class="itsw-ticket-meta"><span>${t.id}</span></div>`), `${t.id}: only the ID in the ticket header`);
    assert.doesNotMatch(queue, /\bP[1-4]\b/, `${t.id}: no priority shown`);
    assert.doesNotMatch(queue.replace(/<select name="category"[\s\S]*?<\/select>/, ''), /Security|Server|Network|Identity|Endpoint|Peripheral/,
      `${t.id}: no category shown outside the category choices`);
  });
}

const answerControls = (html) => [...html.matchAll(/<(select|textarea|input)\b[^>]*>/g)].map((m) => m[0])
  .filter((tag) => /data-itsw-field|data-its12-kb|data-its12-after-action/.test(tag));

function testLockedWhileWaiting() {
  const waitingHtml = open(hdUser({ [LAB]: waiting() }));
  const controls = answerControls(waitingHtml);
  assert.equal(controls.length, 8, 'rank, category, first step, two decision choices, reasoning, KB, after-action');
  controls.forEach((tag) => assert.match(tag, /\sdisabled\b/, `locked while waiting: ${tag.slice(0, 50)}`));
  assert.match(buttons(), /data-its12-reset[^>]*disabled/, 'Reset off while waiting');
  assert.doesNotMatch(waitingHtml, /data-itsw-ticket-select="[^"]*"[^>]*disabled/, 'tickets can still be opened');
  run('its12Submitting = true');
  answerControls(run('its12TicketQueue()') + run('its12ExtrasAndActions()')).forEach((tag) => assert.match(tag, /\sdisabled\b/, 'locked while submitting'));
  run('its12Submitting = false');
  answerControls(open(hdUser({ [LAB]: returned() }))).forEach((tag) => assert.doesNotMatch(tag, /\sdisabled\b/, 'unlocked after a return'));
  answerControls(open(hdUser())).forEach((tag) => assert.doesNotMatch(tag, /\sdisabled\b/, 'unlocked before a first submit'));
}

function testTicketWidgetUnchangedWhenNotLocked() {
  const config = { tickets: TICKETS, activeId: TICKETS[0].id, responses: {}, categoryOptions: run('ITS12_CATEGORY_OPTIONS'), showPriority: true, priorityCount: 6 };
  const queue = run('itswTicketQueue');
  const plain = queue(config);
  assert.equal(queue({ ...config, locked: false }), plain, 'locked: false renders the same as no setting');
  assert.doesNotMatch(plain, /disabled/, 'nothing disabled by default');
  // Only Module 12 uses the ticket widget; Modules 1 and 2 never render it.
  [1, 2].forEach((n) => {
    const html = run(`MODULE_LABS['it-support/${n}']`).view(hdUser(), HD);
    assert.doesNotMatch(html, /itsw-ticket-form/, `Module ${n} does not render the ticket widget`);
  });
}

(async () => {
  const tests = [
    testCapstoneHasSixTickets,
    testFailedAttemptReachesReview,
    testCriticalErrorIsNeverVerified,
    testPassingAttemptUnchangedButHidden,
    testWaitingAttemptBlocksResubmit,
    testDoubleClickSendsOne,
    testReturnedAttemptResubmitsOnce,
    testFinalizedLinksToMarkedLab,
    testFailedSaveKeepsAnswers,
    testPracticeLabsKeepHelpDeskVersion,
    testWithinBandSwapScoresSame,
    testOutOfBandLosesCredit,
    testFeedbackIsDomainOnly,
    testFirstStepNeedsRealAction,
    testRepeatedRankBlocksSubmit,
    testNoTagsShown,
    testLockedWhileWaiting,
    testTicketWidgetUnchangedWhenNotLocked,
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

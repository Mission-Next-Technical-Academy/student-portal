// Help Desk Module 1 page (portal/it-support-module-01.js): the three checks.
//
//   - A wrong pick shows that choice's "If wrong" line and never the right
//     answer (no marker, no "The answer is", no answer text in the feedback).
//     The student picks again. A right pick shows the Why.
//   - Only the first pick on each question counts. The Learn It check (8)
//     and the A+ check (4) are complete at 70% of first picks (6 of 8, 3 of 4);
//     below that the page says "Retake: you need 70%" and shows no score.
//   - Completion is saved to the case state as complete and its time only (no
//     answers, no score, no lab attempt); it ticks the rail and survives a
//     sign-in in another browser. A failed retake never unticks it.
//
// The portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
ctx.render = () => {};

const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const page = () => run("MODULE_LABS['it-support/1']");
const STATE_ID = 'its01-lms-validation-v1';
const plain = (value) => JSON.parse(JSON.stringify(value));
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '’').replace(/\s+/g, ' ');

function hdUser(extra = {}) {
  return {
    userId: '7d1e2f3a-1111-4222-8333-944455550001',
    email: 'hdesk-m01-checks@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    latestLabAttemptByKey: {},
    openLabRedoFeedbackByLabKey: {},
    openLabRedosByModuleKey: {},
    remoteCaseState: {},
    ...extra,
  };
}

function fresh() {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run("['orientation', 'learn', 'aplus'].forEach((k) => { its01CheckAnswers[k] = {}; its01CheckPicks[k] = {}; })");
}
const calls = (table) => ctx.supabaseCalls.filter((c) => c.table === table);
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 5; i += 1) await settle();
}
function savedState() {
  const writes = calls('module_progress').filter((c) => c.payload && c.payload.case_state);
  return writes.length ? plain(writes[writes.length - 1].payload.case_state[STATE_ID]) : null;
}
const checkHtml = (html, key) => {
  const start = html.indexOf(`data-its01-check="${key}"`);
  assert.ok(start >= 0, `check ${key}`);
  return html.slice(start, html.indexOf('its01-check-footer', start) + 400);
};
// A check's status line and buttons (the Learn It check's sit after Lesson 1.4).
const footerHtml = (html, key) => {
  const start = html.indexOf(`data-its01-check-footer="${key}"`);
  assert.ok(start >= 0, `footer ${key}`);
  return html.slice(start, html.indexOf('</div>', start));
};
const questionHtml = (html, key, index) => {
  const start = html.indexOf(`id="its01-${key}-q${index}"`);
  assert.ok(start >= 0, `question ${key} ${index}`);
  return html.slice(start, html.indexOf('</li>', start));
};
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { cls: match[1], html: match[2] };
}
const answer = (key, index, choice) => run('its01Answer')(key, index, choice);
const KEYS = ['orientation', 'learn', 'aplus'];
const questions = (key) => plain(run(`ITS01_CHECKS.${key}.questions`));
// A wrong choice for a question (the first one that isn't the answer).
const wrong = (q) => (q.answer === 0 ? 1 : 0);

/* ------------------------------------------------------------- data */

function testEveryChoiceHasItsReason() {
  for (const key of KEYS) {
    questions(key).forEach((q, i) => {
      assert.equal(q.ifWrong.length, q.choices.length, `${key} ${i}: one line per choice`);
      q.ifWrong.forEach((line, c) => {
        if (c === q.answer) assert.equal(line, null, `${key} ${i}: no "If wrong" line on the answer`);
        else assert.ok(typeof line === 'string' && line.length > 10, `${key} ${i}${'ABCD'[c]}: an "If wrong" line`);
      });
      if (key !== 'orientation') assert.ok(q.why, `${key} ${i}: a Why`);
    });
  }
  assert.equal(questions('learn')[2].q, 'A user reads you the error on their screen: 0x80070005. Which is the best KB search?');
  assert.doesNotMatch(run('ITS01_CHECKS.aplus.intro'), /CompTIA/);
}

/* ------------------------------------------------- wrong picks reveal nothing */

function testWrongPickNeverShowsTheAnswer() {
  for (const key of KEYS) {
    questions(key).forEach((q, i) => {
      q.choices.forEach((_, c) => {
        if (c === q.answer) return;
        fresh();
        const user = hdUser();
        page().view(user, HD);
        answer(key, i, c);
        const block = questionHtml(page().view(user, HD), key, i);
        const feedback = text(block.slice(block.indexOf('its01-check-feedback')));
        const label = `${key} ${i}${'ABCD'[c]}`;
        assert.ok(feedback.includes('Not quite.'), label);
        assert.ok(feedback.includes(q.ifWrong[c]), `${label}: its "If wrong" line`);
        assert.doesNotMatch(block, /is-answer|The answer is/, `${label}: no answer marker`);
        assert.ok(!feedback.includes(q.choices[q.answer]), `${label}: the right choice's text isn't in the feedback`);
        if (q.why) assert.ok(!feedback.includes(q.why), `${label}: no Why before a right pick`);
        // The wrong choice is locked; every other choice can still be picked.
        const buttons = block.match(/<button[^>]*data-choice="\d"[^>]*>/g);
        buttons.forEach((b, n) => assert.equal(/disabled/.test(b), n === c, `${label}: only the picked wrong choice is locked`));
      });
    });
  }
}

function testRightPickAfterAWrongOneShowsWhy() {
  fresh();
  const user = hdUser();
  page().view(user, HD);
  const q = questions('learn')[7];
  answer('learn', 7, 0);
  answer('learn', 7, q.answer);
  const block = questionHtml(page().view(user, HD), 'learn', 7);
  assert.match(text(block), /Correct\./);
  assert.ok(text(block).includes(q.why));
  assert.match(block, /is-answer/);
  assert.equal((block.match(/disabled/g) || []).length, 4, 'settled: every choice locked');
  assert.equal(run('its01CheckAnswers.learn[7]'), 0, 'the first pick still counts');
  answer('learn', 7, 2);
  assert.deepEqual(plain(run('its01CheckPicks.learn[7]')), [0, q.answer], 'no more picks once settled');
}

/* --------------------------------------------------------- 70% completion */

async function passWith(key, rightCount, user) {
  const qs = questions(key);
  qs.forEach((q, i) => {
    if (i < rightCount) answer(key, i, q.answer);
    else { answer(key, i, wrong(q)); answer(key, i, q.answer); }
  });
  await flush();
  return page().view(user, HD);
}

async function testBelowSeventyAsksForARetake() {
  for (const [key, below] of [['learn', 5], ['aplus', 2]]) {
    fresh();
    const user = hdUser();
    page().view(user, HD);
    const html = await passWith(key, below, user);
    const status = text(footerHtml(html, key));
    assert.match(status, /Retake: you need 70%\. Press Start again to retake the check\./, key);
    assert.doesNotMatch(status.replace('you need 70%', ''), /\d+ ?(of|\/) ?\d|score|%/i, `${key}: no score shown`);
    assert.notEqual(run(`its01State.${key}CheckCompleted`), true, `${key}: right after a wrong pick doesn't count`);
    assert.doesNotMatch(railRow(html, `its01-check-${key}`).cls, /mnav-chip-complete/);
    assert.equal(calls('lab_attempts').length, 0);
  }
}

async function testSeventyPercentCompletesAndIsSaved() {
  for (const [key, pass, title] of [['learn', 6, 'Learn It knowledge check'], ['aplus', 3, 'A+ check']]) {
    fresh();
    const user = hdUser();
    page().view(user, HD);
    const html = await passWith(key, pass, user);
    const saved = savedState();
    assert.equal(saved[`${key}CheckCompleted`], true, key);
    assert.ok(!Number.isNaN(Date.parse(saved[`${key}CheckCompletedAt`])), `${key}: with the time`);
    assert.equal(saved.score, 0, 'the runtime default; the page never sets a score');
    assert.ok(!JSON.stringify(saved).match(/its01CheckAnswers|picks|answers/i), 'no answers saved');
    assert.equal(calls('lab_attempts').length, 0, 'no lab attempt');
    assert.match(text(checkHtml(html, key)), new RegExp(`${title.replace('+', '\\+')} complete \\([A-Z][a-z]{2} \\d{1,2}, \\d{4}\\)\\. You can retake it any time\\.`));
    assert.match(railRow(html, `its01-check-${key}`).cls, /mnav-chip-complete/);
    assert.match(railRow(html, `its01-check-${key}`).html, /ri-check-fill/, 'the rail ticks');

    // Another browser after sign-in: still complete.
    fresh();
    const again = hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: saved } } });
    let back = page().view(again, HD);
    assert.match(railRow(back, `its01-check-${key}`).cls, /mnav-chip-complete/);
    assert.match(text(checkHtml(back, key)), /complete \(/);

    // A failed retake asks again but never unticks the saved completion.
    back = await passWith(key, 0, again);
    assert.match(text(checkHtml(back, key)), /Retake: you need 70%/);
    assert.equal(run(`its01State.${key}CheckCompleted`), true);
    assert.match(railRow(back, `its01-check-${key}`).cls, /mnav-chip-complete/);
  }
}

// Orientation still needs every first pick right.
async function testOrientationStillNeedsAllSix() {
  fresh();
  const user = hdUser();
  page().view(user, HD);
  const html = await passWith('orientation', 5, user);
  assert.match(text(checkHtml(html, 'orientation')), /Some answers weren’t right\. Press Start again to retake the check\./);
  assert.notEqual(run('its01State.orientationCheckCompleted'), true);
  run('its01ResetCheck')('orientation');
  await passWith('orientation', 6, user);
  assert.equal(run('its01State.orientationCheckCompleted'), true);
}

/* -------------------------------------------------------------- run */

(async () => {
  const tests = [
    testEveryChoiceHasItsReason,
    testWrongPickNeverShowsTheAnswer,
    testRightPickAfterAWrongOneShowsWhy,
    testBelowSeventyAsksForARetake,
    testSeventyPercentCompletesAndIsSaved,
    testOrientationStillNeedsAllSix,
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
  if (failed) {
    console.log(`${failed} of ${tests.length} failed`);
    process.exit(1);
  }
  console.log(`hdesk-m01-checks: all ${tests.length} passed`);
})();

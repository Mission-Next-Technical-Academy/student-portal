// The case-state save reports its result (portal/app.js persistModuleCaseState,
// portal/lab-runtime.js saveCaseState's optional onResult), and Help Desk
// Module 1's checks take their tick off when the account says the save failed.
//
//   - persistModuleCaseState resolves to true once the row holds the state,
//     and to false on bad arguments, a failed read, a failed write, a throw,
//     and on the duplicate-row retry (error 23505) when its second read or
//     its update fails. It never rejects.
//   - saveCaseState still returns the state, so callers that pass no
//     callback (SOC, Help Desk modules 2 and 10) behave as before. A newer
//     save that replaces a waiting one reports to the waiting one's callback.
//   - Module 1: a failed save unticks the check in the page, this browser's
//     copy and the session's copy of the row, saves the untick, and shows
//     "Your result didn't save. Try again." with a Try again button. An
//     unknown result (an old cached app.js) leaves the tick.
//   - The rail: Help Desk rows say "Complete" (Practice It, checks) or
//     "Passed" (a passed Prove It) next to the tick; SOC rows are unchanged.
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
const persist = run('persistModuleCaseState');
const page = () => run("MODULE_LABS['it-support/1']");
const STATE_ID = 'its01-lms-validation-v1';
const plain = (value) => JSON.parse(JSON.stringify(value));
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const quiet = async (fn) => {
  const original = ctx.console.error;
  ctx.console.error = () => {};
  try { return await fn(); } finally { ctx.console.error = original; }
};

function user(extra = {}) {
  return {
    userId: '7d1e2f3a-1111-4222-8333-944455550077',
    email: 'case-state-result@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
    remoteCaseState: {},
    ...extra,
  };
}
function fresh(responder = () => ({ data: null, error: null })) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = responder;
  ctx.localStorage.clear();
  run("['orientation', 'learn', 'aplus'].forEach((k) => { its01CheckAnswers[k] = {}; its01CheckPicks[k] = {}; its01CheckSaveFailed[k] = false; })");
}
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 8; i += 1) await settle();
}
// The row exists; an update returns the changed row (persistModuleCaseState
// asks for it with .select('module_key')).
const changedRow = { data: [{ module_key: 'its-01' }], error: null };
const existingRow = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : call.op === 'update' ? changedRow : { data: null, error: null });

/* ------------------------------------------------- persistModuleCaseState */

async function testPersistReportsItsResult() {
  const u = user();
  let selects = 0;
  fresh(existingRow);
  assert.equal(await persist(u, 'its-01', 'lab-a', { a: 1 }), true, 'update lands');
  await quiet(async () => {
    // An update that matched no row (the row went away after the read, or
    // the update was refused) saved nothing.
    fresh((call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [], error: null }));
    assert.equal(await persist(u, 'its-01', 'lab-a', { a: 1 }), false, 'zero-row update');
    fresh((call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: null }));
    assert.equal(await persist(u, 'its-01', 'lab-a', { a: 1 }), false, 'update with no row back');
  });
  fresh(() => ({ data: null, error: null }));
  assert.equal(await persist(u, 'its-01', 'lab-a', { a: 1 }), true, 'insert lands');

  assert.equal(await persist(null, 'its-01', 'lab-a', {}), false, 'no user');
  assert.equal(await persist(u, '', 'lab-a', {}), false, 'no module');

  await quiet(async () => {
    fresh((call) => (call.op === 'select' ? { data: null, error: { message: 'read failed' } } : { data: null, error: null }));
    assert.equal(await persist(u, 'its-01', 'lab-a', {}), false, 'read error');
    fresh((call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } }));
    assert.equal(await persist(u, 'its-01', 'lab-a', {}), false, 'write error');
    fresh(() => { throw new Error('network'); });
    assert.equal(await persist(u, 'its-01', 'lab-a', {}), false, 'a throw resolves false, never rejects');

    // Duplicate row (23505): another lab inserted the row after our read.
    let selects = 0;
    fresh((call) => {
      if (call.op === 'select') { selects += 1; return selects === 1 ? { data: null, error: null } : { data: null, error: { message: 'second read failed' } }; }
      if (call.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate' } };
      return { data: null, error: null };
    });
    assert.equal(await persist(u, 'its-01', 'lab-a', {}), false, '23505, then the second read fails');
    selects = 0;
    fresh((call) => {
      if (call.op === 'select') { selects += 1; return { data: selects === 1 ? null : { case_state: { other: 1 } }, error: null }; }
      if (call.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate' } };
      return { data: null, error: { message: 'update failed' } };
    });
    assert.equal(await persist(u, 'its-01', 'lab-a', {}), false, '23505, then the update fails');
  });
  selects = 0;
  fresh((call) => {
    if (call.op === 'select') { selects += 1; return { data: selects === 1 ? null : { case_state: { other: 1 } }, error: null }; }
    if (call.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate' } };
    return changedRow;
  });
  assert.equal(await persist(u, 'its-01', 'lab-a', { a: 2 }), true, '23505, then the merge lands');
  const merged = ctx.supabaseCalls.filter((c) => c.op === 'update').pop();
  assert.deepEqual(plain(merged.payload.case_state), { other: 1, 'lab-a': { a: 2 } });
}

/* ------------------------------------------------- saveCaseState onResult */

async function testSaveCaseStateResult() {
  const u = user();
  // No callback: returns the state and writes as before.
  fresh(existingRow);
  const state = { x: 1 };
  assert.equal(LabRuntime.saveCaseState('lab-b', 'soc-01', u, state), state);
  await flush();
  assert.equal(ctx.supabaseCalls.filter((c) => c.op === 'update').length, 1);

  // A callback hears true on success, false on failure.
  const heard = [];
  fresh(existingRow);
  LabRuntime.saveCaseState('lab-b', 'its-01', u, { x: 2 }, { onResult: (ok) => heard.push(ok) });
  await flush();
  assert.deepEqual(heard, [true]);
  await quiet(async () => {
    fresh((call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } }));
    LabRuntime.saveCaseState('lab-b', 'its-01', u, { x: 3 }, { onResult: (ok) => heard.push(ok) });
    await flush();
  });
  assert.deepEqual(heard, [true, false]);

  // A newer save replaces a waiting one and reports to both callbacks.
  const both = [];
  fresh(existingRow);
  LabRuntime.saveCaseState('lab-b', 'its-01', u, { x: 4 }, { onResult: (ok) => both.push(['first', ok]) });
  LabRuntime.saveCaseState('lab-b', 'its-01', u, { x: 5 });
  LabRuntime.saveCaseState('lab-b', 'its-01', u, { x: 6 }, { onResult: (ok) => both.push(['third', ok]) });
  await flush();
  assert.equal(ctx.supabaseCalls.filter((c) => c.op === 'update').length, 1, 'one write');
  assert.deepEqual(both, [['first', true], ['third', true]]);
}

/* ------------------------------------------------------- Module 1 checks */

const questions = (key) => plain(run(`ITS01_CHECKS.${key}.questions`));
async function passLearn(u) {
  questions('learn').forEach((question, i) => run('its01Answer')('learn', i, question.answer));
}
const footer = (html, key) => {
  const start = html.indexOf(`data-its01-check-footer="${key}"`);
  assert.ok(start >= 0, `footer ${key}`);
  return html.slice(start, html.indexOf('</span></div>', start));
};
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { cls: match[1], text: text(match[2]).trim() };
}

async function testFailedSaveUnticksTheCheck() {
  const u = user();
  const failing = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  fresh(failing);
  page().view(u, HD);
  await passLearn(u);
  assert.equal(run('its01State.learnCheckCompleted'), true, 'ticked at once');
  assert.match(railRow(page().view(u, HD), 'its01-check-learn').text, /Learn It knowledge check Complete/);
  await quiet(flush);
  assert.notEqual(run('its01State.learnCheckCompleted'), true, 'unticked after the failed save');
  assert.equal(run('its01CheckSaveFailed.learn'), true);
  assert.notEqual(plain(LabRuntime.load(STATE_ID, u, {})).learnCheckCompleted, true, 'this browser\'s copy is unticked');
  assert.notEqual(plain(u.remoteCaseState['its-01'][STATE_ID]).learnCheckCompleted, true, 'the session copy is unticked');
  let html = page().view(u, HD);
  assert.match(text(footer(html, 'learn')), /Your result didn’t save\. Try again\./);
  assert.match(footer(html, 'learn'), /data-its01-check-retry="learn"[^>]*>.*Try again/);
  assert.doesNotMatch(railRow(html, 'its01-check-learn').cls, /mnav-chip-complete/);
  assert.doesNotMatch(railRow(html, 'its01-check-learn').text, /Complete/);

  // Try again, and this time the save lands.
  ctx.supabaseResponder = existingRow;
  run('its01RetryCheckSave')('learn');
  assert.equal(run('its01State.learnCheckCompleted'), true);
  await flush();
  assert.equal(run('its01State.learnCheckCompleted'), true, 'still ticked');
  assert.equal(run('its01CheckSaveFailed.learn'), false);
  html = page().view(u, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(text(footer(html, 'learn')), /Learn It knowledge check complete \(/);
  const saved = ctx.supabaseCalls.filter((c) => c.op === 'update').pop();
  assert.equal(plain(saved.payload.case_state[STATE_ID]).learnCheckCompleted, true);
}

// Start again while the save is pending, then the save fails: the tick comes
// off, but there is no Try again (nothing to save); the normal status shows.
async function testStartAgainDuringAFailedSave() {
  const u = user();
  fresh((call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } }));
  page().view(u, HD);
  await passLearn(u);
  run('its01ResetCheck')('learn');
  await quiet(flush);
  assert.notEqual(run('its01State.learnCheckCompleted'), true, 'unticked');
  let html = page().view(u, HD);
  assert.doesNotMatch(footer(html, 'learn'), /didn’t save|data-its01-check-retry/);
  // A retake below 70% asks for a retake, not a save.
  const qs = questions('learn');
  qs.forEach((question, i) => run('its01Answer')('learn', i, i < 3 ? question.answer : (question.answer + 1) % question.choices.length));
  html = page().view(u, HD);
  assert.match(text(footer(html, 'learn')), /Retake: you need 70%/);
  assert.doesNotMatch(footer(html, 'learn'), /didn’t save/);
}

async function testUnknownResultKeepsTheTick() {
  const u = user();
  fresh(existingRow);
  page().view(u, HD);
  // An old cached app.js: the save resolves with no result.
  const original = ctx.persistModuleCaseState;
  ctx.persistModuleCaseState = async () => undefined;
  try {
    await passLearn(u);
    await flush();
  } finally {
    ctx.persistModuleCaseState = original;
  }
  assert.equal(run('persistModuleCaseState'), original, 'restored');
  assert.equal(run('its01State.learnCheckCompleted'), true);
  assert.equal(run('its01CheckSaveFailed.learn'), false);
}

/* ------------------------------------------------------------- The rail */

function testRailLabels() {
  const nav = run('moduleUnifiedNav');
  // Help Desk: rows that set doneLabel show it next to the tick.
  const hd = nav([
    { id: 'a', title: 'Lab 1.1 · Guided Lab', type: 'lab', phase: 'practice', isComplete: true, doneLabel: 'Complete', scrollId: 'row-a' },
    { id: 'b', title: 'Assessment Lab', navTitle: 'Prove It', type: 'review', isComplete: true, doneLabel: 'Passed', scrollId: 'row-b' },
    { id: 'c', title: 'Lab 1.2', type: 'lab', phase: 'practice', isComplete: false, doneLabel: 'Complete', reviewState: 'review', scrollId: 'row-c' },
  ], { moduleKey: 'its01' });
  assert.match(railRow(hd, 'row-a').text, /Complete$/);
  assert.match(railRow(hd, 'row-b').text, /Passed$/);
  assert.match(railRow(hd, 'row-c').text, /In review$/, 'not complete: no done label');
  assert.doesNotMatch(railRow(hd, 'row-c').text, /Complete/);

  // SOC rows set no doneLabel: complete rows show only the tick, as before.
  const socSections = [
    { id: 'lab', title: 'Lab 1.1 · Alert triage', type: 'lab', phase: 'practice', isComplete: true, scrollId: 'soc-lab' },
    { id: 'prove', title: 'Assessment Lab', type: 'review', isComplete: true, scrollId: 'soc-prove' },
  ];
  const soc = nav(socSections, { moduleKey: 'm01' });
  ['soc-lab', 'soc-prove'].forEach((id) => {
    const row = railRow(soc, id);
    assert.doesNotMatch(row.text, /Complete|Passed/, `${id}: no label`);
    assert.doesNotMatch(soc, /munified-row-sub">(Complete|Passed)</);
  });

  // itsLabRail sets the label from the lab's standing.
  const rail = run('itsLabRail');
  const practiceKey = 'lab-its-01-practice-tickets';
  const proveKey = 'lab-its-01-prove-it';
  const done = { completedAt: '2026-11-19T10:00:00Z', reviewedAt: '2026-11-19T11:00:00Z', redoRequested: false, score: 90, passThreshold: 70 };
  const withAttempt = (key, attempt) => user({ latestLabAttemptByKey: { [key]: attempt } });
  assert.equal(rail(withAttempt(practiceKey, { completedAt: '2026-11-19T10:00:00Z' }), [practiceKey]).doneLabel, 'Complete');
  assert.equal(rail(user(), [practiceKey]).doneLabel, undefined);
  assert.equal(rail(withAttempt(proveKey, { completedAt: '2026-11-19T10:00:00Z' }), [proveKey]).doneLabel, undefined, 'waiting: no label');
  const passed = rail(withAttempt(proveKey, done), [proveKey]);
  assert.deepEqual([passed.isComplete, passed.doneLabel], [true, 'Passed']);
  const returned = rail(withAttempt(proveKey, { ...done, redoRequested: true }), [proveKey]);
  assert.deepEqual([returned.isComplete, returned.doneLabel, returned.reviewState], [false, undefined, 'returned']);

  // Module 1: a passed check's rail row says Complete.
  fresh(existingRow);
  const u = user();
  page().view(u, HD);
  run("its01State.aplusCheckCompleted = true; its01Save()");
  assert.match(railRow(page().view(u, HD), 'its01-check-aplus').text, /A\+ check Complete$/);
}

(async () => {
  const tests = [testPersistReportsItsResult, testSaveCaseStateResult, testFailedSaveUnticksTheCheck, testStartAgainDuringAFailedSave, testUnknownResultKeepsTheTick, testRailLabels];
  let failed = 0;
  for (const test of tests) {
    try { await test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.log(`FAIL ${test.name}`); console.log(error); }
  }
  if (failed) { console.log(`${failed} of ${tests.length} failed`); process.exit(1); }
  console.log(`case-state-save-result: all ${tests.length} passed`);
})();

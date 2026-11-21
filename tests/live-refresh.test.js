// Live refresh (portal/live-refresh.js + its wiring in portal/app.js).
//
// Owner request, UAT 2026-10-17: an instructor's approval reached the
// database, but the learner's program page kept showing "Awaiting Approval"
// and the next module "Locked" until a manual reload. Contracts:
//   - the poll runs fast only while a submission awaits review, slow otherwise,
//     and not at all on a hidden tab or after stop()/sign-out;
//   - apply (a re-render) happens only when the probed data really changed;
//   - an unsaved draft (e.g. an instructor's note) is never replaced, and a
//     view that opts out of automatic apply is offered the update instead.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const LiveRefresh = require('../portal/live-refresh.js');
const { loadPortal } = require('./portal-vm');

/* ------------------------------------------------------------ fake env */

function fakeEnv() {
  let clock = 0;
  let nextId = 1;
  const timers = new Map();
  const listeners = {};
  const field = (value = '', defaultValue = '') => ({ tagName: 'TEXTAREA', value, defaultValue, closest: () => null });
  const doc = {
    visibilityState: 'visible',
    activeElement: null,
    fields: [],
    body: null,
    querySelector: () => null,
    querySelectorAll: (selector) => (selector === 'textarea, input' ? doc.fields : []),
    getElementById: () => null,
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
  };
  const win = { addEventListener: (type, fn) => { (listeners[`win:${type}`] = listeners[`win:${type}`] || []).push(fn); } };
  const env = {
    doc,
    win,
    now: () => clock,
    setTimer: (fn, ms) => { const id = nextId++; timers.set(id, { fn, at: clock + ms }); return id; },
    clearTimer: (id) => { timers.delete(id); },
  };
  return {
    env,
    doc,
    field,
    timers,
    nextDelay: () => {
      const due = [...timers.values()].map((t) => t.at - clock);
      return due.length ? Math.min(...due) : null;
    },
    async advance(ms) {
      clock += ms;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= clock) { timers.delete(id); timer.fn(); }
      }
      await flush();
    },
    async fire(type) {
      (listeners[type] || []).forEach((fn) => fn());
      await flush();
    },
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function scriptedProbe(snapshots) {
  const probe = async () => {
    probe.calls += 1;
    const next = snapshots.length > 1 ? snapshots.shift() : snapshots[0];
    return typeof next === 'function' ? next() : next;
  };
  probe.calls = 0;
  return probe;
}

const snap = (signature, pending = false) => ({ signature, pending });

/* ---------------------------------------------- 1. poll cadence and stop */

async function testCadenceFollowsPending() {
  const t = fakeEnv();
  const controller = LiveRefresh.create({ ...t.env, minGapMs: 5000 });
  const probe = scriptedProbe([snap('a', true), snap('a', false)]);
  const applied = [];
  controller.watch({
    key: 'learner:x',
    probe,
    apply: async (change) => { applied.push(change); },
    intervalMs: (s) => (s && s.pending ? 30000 : 120000),
  });
  await flush();
  assert.equal(probe.calls, 1, 'first probe records the baseline');
  assert.equal(t.nextDelay(), 30000, 'a pending submission polls every 30s');
  await t.advance(30000);
  assert.equal(probe.calls, 2);
  // Nothing pending any more: slow poll (messages / overrides only).
  // Signature unchanged, so pending still comes from the baseline.
  assert.equal(applied.length, 0, 'no apply without a real change');
  controller.stop();
  assert.equal(t.timers.size, 0, 'stop() leaves no timer behind');
  await t.advance(600000);
  assert.equal(probe.calls, 2, 'no probes after stop()');
  assert.equal(controller.active, false);
}

async function testIdleCadenceWithoutPending() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  controller.watch({ key: 'k', probe: scriptedProbe([snap('a', false)]), apply: async () => {}, intervalMs: (s) => (s && s.pending ? 30000 : 120000) });
  await flush();
  assert.equal(t.nextDelay(), 120000, 'nothing awaiting review: slow poll only');
}

async function testHiddenTabPausesAndFocusResumes() {
  const t = fakeEnv();
  const controller = LiveRefresh.create({ ...t.env, minGapMs: 5000 });
  const probe = scriptedProbe([snap('a')]);
  controller.watch({ key: 'k', probe, apply: async () => {}, intervalMs: 30000 });
  await flush();
  t.doc.visibilityState = 'hidden';
  await t.fire('visibilitychange');
  assert.equal(t.timers.size, 0, 'hidden tab: polling paused');
  await t.advance(300000);
  assert.equal(probe.calls, 1);
  t.doc.visibilityState = 'visible';
  await t.fire('visibilitychange');
  assert.equal(probe.calls, 2, 'returning to the tab probes at once');
  await t.fire('win:focus');
  assert.equal(probe.calls, 2, 'focus right after a probe is throttled');
  await t.advance(6000);
  await t.fire('win:focus');
  assert.equal(probe.calls, 3, 'window focus probes once the gap has passed');
}

/* ------------------------------------------- 2. apply only on real change */

async function testApplyOnlyOnChange() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  const probe = scriptedProbe([snap('a', true), snap('a', true), snap('b', false), snap('b', false)]);
  const applied = [];
  const spec = {
    key: 'learner:program',
    probe,
    intervalMs: 30000,
    apply: async (change) => {
      applied.push(change);
      controller.watch(spec); // what render() does: re-register the same route
    },
  };
  controller.watch(spec);
  await flush();
  await t.advance(30000);
  assert.equal(applied.length, 0, 'same signature: no re-render');
  await t.advance(30000);
  assert.equal(applied.length, 1, 'changed signature: one re-render');
  assert.equal(applied[0].previous.signature, 'a');
  assert.equal(applied[0].next.signature, 'b');
  assert.equal(probe.calls, 3, 'the re-render reuses the applied snapshot as its baseline (no extra probe)');
  await t.advance(30000);
  assert.equal(applied.length, 1, 'no repeat apply for the same data');
}

async function testFailedProbeIsIgnored() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  const applied = [];
  controller.watch({ key: 'k', probe: scriptedProbe([snap('a'), null, snap('a')]), apply: async (c) => applied.push(c), intervalMs: 30000 });
  await flush();
  await t.advance(30000);
  await t.advance(30000);
  assert.equal(applied.length, 0, 'a failed read is not a change');
  assert.equal(t.timers.size, 1, 'and polling continues');
}

/* --------------------------------------------- 3. never clobber a draft */

async function testDraftDefersApply() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  const note = t.field('Please cite the 4625 event', '');
  t.doc.fields = [note];
  const applied = [];
  const deferred = [];
  controller.watch({
    key: 'faculty:track',
    probe: scriptedProbe([snap('a'), snap('b')]),
    intervalMs: 60000,
    apply: async (c) => applied.push(c),
    onDeferred: (change, info) => deferred.push(info),
  });
  await flush();
  await t.advance(60000);
  assert.equal(applied.length, 0, 'unsent instructor note: no re-render');
  assert.equal(deferred.length, 1);
  assert.equal(deferred[0].busy, 'draft');
  await t.advance(60000);
  assert.equal(deferred.length, 1, 'the notice is raised once, not every tick');
  note.value = '';
  await t.fire('focusout');
  await t.advance(0);
  assert.equal(applied.length, 1, 'applies once the draft is gone');
}

async function testFocusedFieldIsTyping() {
  const t = fakeEnv();
  t.doc.activeElement = { tagName: 'INPUT', type: 'text' };
  assert.equal(LiveRefresh.busyState(t.doc), 'typing');
  t.doc.activeElement = { tagName: 'BUTTON' };
  assert.equal(LiveRefresh.busyState(t.doc), null);
  t.doc.fields = [{ tagName: 'INPUT', type: 'checkbox', checked: true, defaultChecked: false, closest: () => null }];
  assert.equal(LiveRefresh.busyState(t.doc), 'draft');
  t.doc.fields = [{ tagName: 'INPUT', type: 'search', value: 'x', defaultValue: '', closest: () => ({}) }];
  assert.equal(LiveRefresh.busyState(t.doc), null, 'data-live-refresh-ignore fields are not drafts');
}

async function testManualViewIsOffered() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  const applied = [];
  let offer = null;
  controller.watch({
    key: 'learner:module',
    probe: scriptedProbe([snap('a'), snap('b')]),
    intervalMs: 30000,
    autoApply: false,
    apply: async (c, opts) => applied.push(opts),
    onDeferred: (change, info) => { offer = info; },
  });
  await flush();
  await t.advance(30000);
  assert.equal(applied.length, 0, 'a module page never rebuilds on its own');
  assert.equal(offer.reason, 'manual');
  await offer.applyNow();
  assert.deepEqual(applied, [{ forced: true }], 'the learner applies it from the notice');
}

async function testIrrelevantChangeAdoptedQuietly() {
  const t = fakeEnv();
  const controller = LiveRefresh.create(t.env);
  const applied = [];
  const deferred = [];
  controller.watch({
    key: 'k',
    probe: scriptedProbe([snap('a'), snap('b')]),
    intervalMs: 30000,
    autoApply: false,
    isRelevant: () => false,
    apply: async (c) => applied.push(c),
    onDeferred: () => deferred.push(1),
  });
  await flush();
  await t.advance(30000);
  assert.equal(applied.length + deferred.length, 0);
  assert.equal(controller.baseline.signature, 'b');
}

/* ------------------------------------------------ 4. portal wiring (vm) */

async function testPortalWiring() {
  const ctx = loadPortal();
  ctx.requestAnimationFrame = (fn) => setTimeout(fn, 0); // signOut() ends in render()
  const run = (code) => vm.runInContext(code, ctx);
  assert.equal(typeof run('LiveRefresh.create'), 'function', 'index.html loads live-refresh.js before app.js');

  const snapshotOf = run('learnerLiveSnapshot');
  const before = snapshotOf(
    [{ id: 'a1', lab_key: 'lab-identity-investigation', reviewed_at: null, redo_requested: false, superseded_at: null }],
    [{ module_key: 'soc-01', complete: true }],
    [],
  );
  assert.equal(before.pending, true, 'an unreviewed submission is pending');
  const supersededOnly = snapshotOf([{ id: 'a0', lab_key: 'x', reviewed_at: null, superseded_at: '2026-10-17T10:00:00Z' }], [], []);
  assert.equal(supersededOnly.pending, false, 'a superseded attempt is not awaiting review');

  const after = snapshotOf(
    [{ id: 'a1', lab_key: 'lab-identity-investigation', reviewed_at: '2026-10-17T12:00:00Z', redo_requested: false, superseded_at: null }],
    [{ module_key: 'soc-01', complete: true }, { module_key: 'soc-02', complete: true }],
    [{ id: 'm1' }],
  );
  assert.equal(after.pending, false);
  assert.notEqual(after.signature, before.signature);
  assert.equal(snapshotOf([], [{ module_key: 'soc-02', complete: true }, { module_key: 'soc-01', complete: true }], []).signature,
    snapshotOf([], [{ module_key: 'soc-01', complete: true }, { module_key: 'soc-02', complete: true }], []).signature,
    'row order does not change the signature');

  const lines = run('describeLearnerLiveChange')(before, after);
  assert.ok(lines.some((l) => /approved Module 2/.test(l)), lines.join(' | '));
  assert.ok(lines.includes('Module 3 is now open.'), lines.join(' | '));
  assert.ok(lines.some((l) => /new message from your instructor/.test(l)));
  const returned = snapshotOf([{ id: 'a1', lab_key: 'lab-identity-investigation', reviewed_at: '2026-10-17T12:00:00Z', redo_requested: true }], [], []);
  assert.ok(run('describeLearnerLiveChange')(before, returned).some((l) => /returned Module 2/.test(l)));

  // The learner probe reads only this learner's rows.
  run('supabaseCalls.length = 0');
  const user = { userId: 'user-1', trackCode: 'SOCAN' };
  const probed = await run('probeLearnerLiveState')(user);
  assert.ok(probed && typeof probed.signature === 'string');
  const calls = run('supabaseCalls');
  const attempts = calls.find((c) => c.table === 'lab_attempts');
  assert.equal(attempts.filters.user_id, 'user-1');
  assert.equal(attempts.filters.track_code, 'SOCAN');
  const messages = calls.find((c) => c.table === 'student_messages');
  assert.equal(messages.filters.student_id, 'user-1');
  assert.equal(messages.filters.sender_role, 'faculty');
  assert.ok(calls.every((c) => c.op === 'select'), 'probes never write');

  // A failed read is "unknown", never a change.
  run(`supabaseResponder = (call) => call.table === 'lab_attempts' ? { data: null, error: { message: 'boom' } } : { data: [], error: null }`);
  const origError = console.error;
  console.error = () => {};
  assert.equal(await run('probeLearnerLiveState')(user), null);
  run('supabaseResponder = () => ({ data: null, error: null })');

  // Route registration and sign-out.
  const controller = run('portalLiveRefresh');
  assert.ok(controller, 'the portal creates one shared controller');
  run('startLiveRefreshForRoute')({ userId: 'user-1', trackCode: 'SOCAN' }, '#/program/soc-analyst');
  assert.equal(controller.active, true);
  assert.equal(controller.key, 'learner:user-1:#/program/soc-analyst');
  run('startLiveRefreshForRoute')({ userId: 'fac-1', isInstructor: true, instructorTrackCodes: ['SOCAN'] }, '#/admin/track/SOCAN', { adminTrackCode: 'SOCAN' });
  assert.equal(controller.key, 'faculty:fac-1:#/admin/track/SOCAN', 'faculty views use the same mechanism');
  await flush();
  const facultyCalls = run('supabaseCalls').filter((c) => c.table === 'faculty_grading_queue');
  assert.ok(facultyCalls.length && facultyCalls.every((c) => c.filters.track_code === 'SOCAN'), 'instructor probe is scoped to their course view');
  await run('signOut')();
  assert.equal(controller.active, false, 'sign-out stops live refresh');
  await new Promise((resolve) => setTimeout(resolve, 400)); // let its login render settle
  assert.equal(controller.active, false, 'the login screen does not restart it');
  console.error = origError;
}

(async () => {
  const tests = [
    testCadenceFollowsPending,
    testIdleCadenceWithoutPending,
    testHiddenTabPausesAndFocusResumes,
    testApplyOnlyOnChange,
    testFailedProbeIsIgnored,
    testDraftDefersApply,
    testFocusedFieldIsTyping,
    testManualViewIsOffered,
    testIrrelevantChangeAdoptedQuietly,
    testPortalWiring,
  ];
  for (const test of tests) {
    await test();
    console.log(`ok - ${test.name}`);
  }
  console.log('live-refresh: all tests passed');
})().catch((err) => {
  process.stderr.write(`${err && err.stack || err}\n`);
  process.exit(1);
});

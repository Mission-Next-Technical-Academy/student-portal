const assert = require('node:assert/strict');
const { loadPortal } = require('./portal-vm');

async function main() {
  const ctx = loadPortal();
  const user = { userId: 'student-1', trackCode: 'SOCAN', latestLabAttemptByKey: {} };
  const states = [];
  ctx.supabaseResponder = (call) => {
    if (call.table === 'lab_attempts' && call.op === 'insert') states.push(call.payload.state);
    return { data: [], error: null };
  };
  await ctx.recordLabAttempt(user, 'lab-soc-escalation', { state: 'complete', score: 69 });
  await ctx.recordLabAttempt(user, 'lab-soc-escalation', { state: 'complete', score: 70 });
  await ctx.recordLabAttempt(user, 'lab-soc-escalation', { state: 'complete', score: null });
  assert.deepEqual(states, ['submitted', 'complete', 'complete']);

  let event;
  ctx.CustomEvent = function (type, options) { this.type = type; this.detail = options.detail; };
  ctx.window.dispatchEvent = (value) => { event = value; };
  ctx.supabaseResponder = (call) => call.table === 'lab_attempts'
    ? { data: null, error: { code: '23514', message: 'rejected' } }
    : { data: [], error: null };
  assert.equal(await ctx.recordLabAttempt(user, 'lab-soc-escalation', { state: 'complete', score: 40 }), false);
  assert.equal(event.type, 'mnt:lab-attempt-save-failed');
  assert.deepEqual({ ...event.detail }, { labKey: 'lab-soc-escalation', code: '23514', message: 'rejected' });
  ctx.supabaseResponder = (call) => {
    if (call.table === 'lab_attempts') throw Object.assign(new Error('offline'), { code: 'NETWORK' });
    return { data: [], error: null };
  };
  assert.equal(await ctx.recordLabAttempt(user, 'lab-soc-escalation', { state: 'complete', score: 40 }), false);
  assert.deepEqual({ ...event.detail }, { labKey: 'lab-soc-escalation', code: 'NETWORK', message: 'offline' });

  // Load-time unstick: only when the sign-in read of lab_attempts succeeded.
  const loaded = (id, attempts = {}) => ({ userId: id, trackCode: 'SOCAN', labAttemptsLoaded: true, latestLabAttemptByKey: attempts });
  const state = { lab2: { submitted: true, completed: true, submittedAt: 'stale' } };
  assert.equal(ctx.moduleOneUnstickMissingAttempt(state, loaded('student-2')), true);
  assert.deepEqual({ ...state.lab2 }, { submitted: false, completed: false, submittedAt: '' });
  const saved = { lab2: { submitted: true, completed: true } };
  assert.equal(ctx.moduleOneUnstickMissingAttempt(saved, loaded('student-2', { 'lab-soc-escalation': { completedAt: 'now' } })), false);
  assert.equal(saved.lab2.submitted, true);
  const unread = { lab2: { submitted: true, completed: true } };
  assert.equal(ctx.moduleOneUnstickMissingAttempt(unread, { userId: 'student-2', latestLabAttemptByKey: {} }), false, 'a failed lab_attempts read never reopens a case');
  // An insert already made in this tab (here student-1's) is never "stale",
  // even if a route refresh reloaded the attempts before it landed.
  assert.equal(ctx.proveItLatchIsStale(loaded('student-1'), 'lab-soc-escalation'), false);
  assert.equal(ctx.proveItLatchIsStale(loaded('student-3'), ['lab-a', 'lab-b']), true);
  assert.equal(ctx.proveItLatchIsStale(loaded('student-3', { 'lab-a': {}, 'lab-b': {} }), ['lab-a', 'lab-b']), false);

  // recordProveItAttempt(): a failed save restores the previous review entry
  // and runs the module's rollback; a good save keeps the new entry.
  const returned = { completedAt: 'earlier', reviewedAt: 'r', redoRequested: true };
  const student = loaded('student-4', { 'lab-x': returned });
  let rolledBack = 0;
  ctx.supabaseResponder = (call) => call.table === 'lab_attempts' ? { data: null, error: { code: '500', message: 'down' } } : { data: [], error: null };
  const pending = ctx.recordProveItAttempt(student, 'lab-x', { state: 'complete', score: 50 }, () => { rolledBack += 1; });
  assert.equal(student.latestLabAttemptByKey['lab-x'].redoRequested, false, 'shows under review while saving');
  assert.equal(await pending, false);
  assert.equal(rolledBack, 1);
  assert.equal(student.latestLabAttemptByKey['lab-x'], returned);
  assert.equal(ctx.proveItLatchIsStale(loaded('student-4'), 'lab-x'), true, 'a failed insert does not count as saved');
  ctx.supabaseResponder = () => ({ data: [], error: null });
  assert.equal(await ctx.recordProveItAttempt(student, ['lab-x', 'lab-y'], { state: 'complete', score: 90 }, () => { rolledBack += 1; }), true);
  assert.equal(rolledBack, 1);
  assert.equal(student.latestLabAttemptByKey['lab-y'].reviewedAt, null);
  // Part-way failure of a multi-key submit: the resubmit sends only the key
  // that has no pending attempt (the server refuses a second pending one).
  const multi = loaded('student-5');
  let failKey = 'lab-n';
  const sent = [];
  ctx.supabaseResponder = (call) => {
    if (call.table !== 'lab_attempts') return { data: [], error: null };
    sent.push(call.payload.lab_key);
    return call.payload.lab_key === failKey ? { data: null, error: { code: '500', message: 'down' } } : { data: [], error: null };
  };
  assert.equal(await ctx.recordProveItAttempt(multi, ['lab-m', 'lab-n'], { state: 'complete', score: 90 }, () => {}), false);
  assert.equal(multi.latestLabAttemptByKey['lab-n'], undefined);
  failKey = null; sent.length = 0;
  assert.equal(await ctx.recordProveItAttempt(multi, ['lab-m', 'lab-n'], { state: 'complete', score: 90 }, () => {}), true);
  assert.deepEqual([...sent], ['lab-n']);
  ctx.supabaseResponder = () => ({ data: [], error: null });
  // No session: nothing was sent, so nothing is rolled back.
  assert.equal(await ctx.recordProveItAttempt({ latestLabAttemptByKey: {} }, 'lab-x', { state: 'complete', score: 90 }, () => { rolledBack += 1; }), false);
  assert.equal(rolledBack, 1);
  console.log('below-pass Prove It: 28 assertions passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

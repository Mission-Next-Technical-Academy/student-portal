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

  const state = { lab2: { submitted: true, completed: true, submittedAt: 'stale' } };
  assert.equal(ctx.moduleOneUnstickMissingAttempt(state, { latestLabAttemptByKey: {} }), true);
  assert.deepEqual({ ...state.lab2 }, { submitted: false, completed: false, submittedAt: '' });
  const saved = { lab2: { submitted: true, completed: true } };
  assert.equal(ctx.moduleOneUnstickMissingAttempt(saved, { latestLabAttemptByKey: { 'lab-soc-escalation': { completedAt: 'now' } } }), false);
  assert.equal(saved.lab2.submitted, true);
  console.log('below-pass Prove It: 9 assertions passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

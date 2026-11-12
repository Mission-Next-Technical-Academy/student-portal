// Test-account progress reset (portal/app.js): the admin RPC calls, the
// roster flag merge, and the student-side clearing of browser-held progress
// after an admin reset. SQL rules are covered by
// supabase/tests/test_account_progress_reset.sql.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

function freshStores(ctx) {
  // Browser-like Storage: stored keys are own enumerable properties, the
  // methods are not, so Object.keys(localStorage) lists keys as in Chrome.
  vm.runInContext(`(() => {
    const proto = {
      getItem(k) { return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null; },
      setItem(k, v) { this[k] = String(v); },
      removeItem(k) { delete this[k]; },
    };
    localStorage = Object.create(proto);
    sessionStorage = Object.create(proto);
  })()`, ctx);
  return { local: vm.runInContext('localStorage', ctx), session: vm.runInContext('sessionStorage', ctx) };
}

async function main() {
  const ctx = loadPortal();
  const slug = vm.runInContext('TRACK_CODE_TO_PROGRAM_SLUG', ctx).HDESK;
  assert.equal(slug, 'it-support');
  const user = { userId: 'u-test', trackCode: 'HDESK', username: '9900000022-HDESK', email: 'test@x.local' };
  const other = { userId: 'u-other', trackCode: 'HDESK', username: '9900000023-HDESK', email: 'other@x.local' };
  const anon = vm.runInContext('LabRuntime', ctx).anonymousStudentId(user);
  const otherAnon = vm.runInContext('LabRuntime', ctx).anonymousStudentId(other);

  function seed(local, session) {
    local[`mnt-portal.lab-state.v1.its01-ticket-v1.${anon}`] = '{}';
    local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${anon}`] = '{}';
    local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${otherAnon}`] = '{}';
    local['defender-lab.helpdesk.prove.v1.its-01.9900000022-HDESK'] = '{}';
    local['defender-lab.helpdesk.prove.v1.its-02.9900000022-HDESK'] = '{}';
    session['defender-lab.helpdesk.prove.v1.its-02.9900000022-HDESK'] = '{}';
    local['mission_next_progress_ext'] = JSON.stringify({ 'guest_learner_its-01': { a: 1 }, 'guest_learner_its-02': { b: 1 } });
    local['mnt.coach.resume'] = '{}';
    ctx.saveModuleEngagement(user, {
      openedModules: [`${slug}:its-01`, `${slug}:its-02`, `${slug}:its-12`],
      completedLabs: [`${slug}:its-01:lab-its-01-prove-it`, `${slug}:its-02:lab-its-02-vm-build`],
    });
  }

  // ------------------------------------------------ module reset (its-02)
  let { local, session } = freshStores(ctx);
  seed(local, session);
  ctx.clearLocalProgressForReset(user, ['its-02']);
  assert.ok(local[`mnt-portal.lab-state.v1.its01-ticket-v1.${anon}`], 'its-01 lab state kept');
  assert.equal(local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${anon}`], undefined, 'its-02 lab state cleared');
  assert.ok(local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${otherAnon}`], "another account's lab state on this browser is kept");
  assert.ok(local['defender-lab.helpdesk.prove.v1.its-01.9900000022-HDESK'], 'its-01 Prove It state kept');
  assert.equal(local['defender-lab.helpdesk.prove.v1.its-02.9900000022-HDESK'], undefined, 'its-02 Prove It state cleared');
  assert.equal(session['defender-lab.helpdesk.prove.v1.its-02.9900000022-HDESK'], undefined, 'its-02 session state cleared');
  assert.deepEqual(Object.keys(JSON.parse(local['mission_next_progress_ext'])), ['guest_learner_its-01'], 'only the its-02 imported-lab bucket cleared');
  const engagement = ctx.loadModuleEngagement(user);
  assert.deepEqual([...engagement.openedModules], [`${slug}:its-01`, `${slug}:its-12`]);
  assert.deepEqual([...engagement.completedLabs], [`${slug}:its-01:lab-its-01-prove-it`]);
  assert.ok(local['mnt.coach.resume'], 'module reset leaves the coach resume marker');

  // ------------------------------------------------ erase all
  ({ local, session } = freshStores(ctx));
  seed(local, session);
  ctx.clearLocalProgressForReset(user, null);
  assert.deepEqual(Object.keys(local).sort(), [`mnt-portal.lab-state.v1.its02-vm-build-v1.${otherAnon}`],
    "erase all clears this account's browser progress and keeps only the other account's");
  assert.deepEqual(Object.keys(session), []);

  // ------------------------------------------------ applied once per reset
  ({ local, session } = freshStores(ctx));
  seed(local, session);
  let resetRow = { progress_reset_at: '2026-11-10T12:00:00+00:00', progress_reset_modules: ['its-02'] };
  ctx.supabaseResponder = (call) => (call.table === 'students' ? { data: resetRow, error: null } : { data: [], error: null });
  await ctx.applyPendingProgressReset(user);
  assert.equal(local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${anon}`], undefined, 'pending reset applied');
  assert.equal(local['mnt-portal.progress-reset-seen.v1.u-test'], resetRow.progress_reset_at, 'marker stored');
  local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${anon}`] = '{"new":"work after the reset"}';
  await ctx.applyPendingProgressReset(user);
  assert.ok(local[`mnt-portal.lab-state.v1.its02-vm-build-v1.${anon}`], 'the same reset is not applied twice');

  // Admins/instructors are never reset; a missing-column DB is a quiet no-op.
  ctx.supabaseCalls.length = 0;
  await ctx.applyPendingProgressReset({ ...user, isAdmin: true });
  assert.equal(ctx.supabaseCalls.length, 0);
  ctx.supabaseResponder = () => ({ data: null, error: { code: '42703', message: 'column students.progress_reset_at does not exist' } });
  await ctx.applyPendingProgressReset({ ...user, userId: 'u-other' });
  assert.equal(local['mnt-portal.progress-reset-seen.v1.u-other'], undefined);

  // ------------------------------------------------ roster flag merge
  const rows = [{ student_id: '9900000022-HDESK' }, { student_id: '9900000023-HDESK' }];
  ctx.supabaseResponder = () => ({ data: [{ student_id: '9900000022-HDESK', is_test_account: true }, { student_id: '9900000023-HDESK', is_test_account: false }], error: null });
  await ctx.mergeTestAccountFlags(rows);
  assert.deepEqual(rows.map((r) => r.is_test_account), [true, false]);
  assert.equal(vm.runInContext('TEST_ACCOUNTS.available', ctx), true);

  // ------------------------------------------------ RPC arguments
  const rpcCalls = [];
  ctx.supabaseRpcResponder = (name, args) => { rpcCalls.push({ name, args }); return { data: { deleted: { module_progress: 2, lab_attempts: 3 } }, error: null }; };
  const row = { student_id: '9900000022-HDESK', user_id: 'u-test', track_code: 'HDESK', program_slug: slug };

  await ctx.resetTestProgressRemote(row, null);
  assert.equal(rpcCalls[0].name, 'admin_reset_test_progress');
  assert.equal(rpcCalls[0].args.p_module_keys, null, 'erase all sends no module list');
  assert.equal(rpcCalls[0].args.p_include_capstone, false);

  await ctx.resetTestProgressRemote(row, ['its-02']);
  assert.deepEqual([...rpcCalls[1].args.p_module_keys], ['its-02']);
  assert.equal(rpcCalls[1].args.p_include_capstone, false);
  const labs = vm.runInContext('LABS', ctx).filter((l) => l.module === 'its-02').map((l) => l.key);
  assert.ok(labs.length > 0 && labs.every((k) => rpcCalls[1].args.p_lab_keys.includes(k)), 'module lab keys from LABS are sent');

  await ctx.resetTestProgressRemote(row, ['its-11', 'its-12']);
  assert.equal(rpcCalls[2].args.p_include_capstone, true, 'selecting the capstone module includes capstone submissions');

  assert.equal(ctx.testResetSummaryText({ deleted: { module_progress: 2, lab_attempts: 3, sim_state: 0 } }), 'Erased 2 module records, 3 lab attempts.');
  assert.equal(ctx.testResetSummaryText({ deleted: {} }), 'There was no saved progress to erase.');

  // ------------------------------------------------ evidence files
  const paths = Array.from({ length: 150 }, (_, i) => `HDESK/u-test/its-02/lab-its-02-vm-build/a/${i}.png`);
  let evidenceArgs = null;
  ctx.supabaseRpcResponder = (name, args) => {
    if (name === 'admin_test_evidence_paths') { evidenceArgs = args; return { data: paths, error: null }; }
    return { data: null, error: null };
  };
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = (call) => (call.op === 'remove' ? { data: call.payload.map((name) => ({ name })), error: null } : { data: [], error: null });
  let evidence = await ctx.removeTestEvidenceFiles(row, ['its-02']);
  assert.deepEqual([...evidenceArgs.p_module_keys], ['its-02'], 'module mode lists only those modules');
  const removes = ctx.supabaseCalls.filter((c) => c.op === 'remove');
  assert.deepEqual([...removes].map((c) => c.table), ['storage:lab-evidence', 'storage:lab-evidence']);
  assert.deepEqual([...removes].map((c) => c.payload.length), [100, 50], 'removed in batches of 100');
  assert.deepEqual({ ...evidence }, { found: 150, removed: 150, error: null });

  await ctx.removeTestEvidenceFiles(row, null);
  assert.equal(evidenceArgs.p_module_keys, null, 'erase all lists every evidence file');

  // A Storage failure part-way is reported, not thrown.
  let batch = 0;
  ctx.supabaseResponder = (call) => (call.op === 'remove'
    ? (batch++ === 0 ? { data: call.payload.map((name) => ({ name })), error: null } : { data: null, error: { message: 'denied' } })
    : { data: [], error: null });
  evidence = await ctx.removeTestEvidenceFiles(row, ['its-02']);
  assert.equal(evidence.removed, 100);
  assert.equal(evidence.error.message, 'denied');
  assert.equal(
    ctx.testResetSummaryText({ deleted: { lab_attempts: 1 }, evidence }),
    'Erased 1 lab attempts, 100 evidence files. Could not delete 50 uploaded evidence files (denied); run Reset Progress again to retry.',
  );
  assert.equal(
    ctx.testResetSummaryText({ deleted: { lab_attempts: 2 }, evidence: { found: 1, removed: 1, error: null } }),
    'Erased 2 lab attempts, 1 evidence file.',
  );

  // ------------------------------------------------ confirm word
  assert.equal(ctx.testResetConfirmed('RESET'), true, 'RESET enables Erase progress');
  assert.equal(ctx.testResetConfirmed(' RESET '), true, 'surrounding spaces are ignored');
  ['reset', 'Reset', 'RESE', 'RESETX', 'RE SET', '', null, undefined, '9900000022-HDESK'].forEach((value) => {
    assert.equal(ctx.testResetConfirmed(value), false, `${JSON.stringify(value)} keeps Erase progress disabled`);
  });

  // ------------------------------------------------ no automatic progress file
  const modalSource = String(vm.runInContext('openTestResetModal', ctx));
  assert.doesNotMatch(modalSource, /downloadStudentSnapshot|buildStudentSnapshotRecord|downloadJsonFile/,
    'the reset no longer downloads a progress file');
  assert.match(modalSource, /TEST_RESET_WARNING/, 'the dialog shows the shared warning');
  assert.equal(vm.runInContext('TEST_RESET_WARNING', ctx),
    "This can't be undone. To keep a copy first, use Save Progress File on the roster. Uploaded evidence screenshots are deleted too. Progress saved in the student's own browser is cleared the next time they open the portal.");

  // ------------------------------------------------ roster controls
  const resetButton = (html) => (html.match(/<button[^>]*data-admin-reset-progress[^>]*>/) || [null])[0];
  vm.runInContext('TEST_ACCOUNTS.available = true', ctx);
  const testHtml = ctx.testAccountRosterControlsHtml({ student_id: '9900000022-HDESK', is_test_account: true }, false);
  const realHtml = ctx.testAccountRosterControlsHtml({ student_id: '9900000023-HDESK', is_test_account: false }, false);
  const testBtn = resetButton(testHtml);
  const realBtn = resetButton(realHtml);
  assert.ok(testBtn && realBtn, 'every admin roster row has the button, so the checkbox can show it at once');
  assert.ok(!/\shidden[\s>]/.test(testBtn), 'test account: Reset Progress is shown');
  assert.match(realBtn, /\shidden[\s>]/, 'real student: Reset Progress is hidden');
  assert.match(testBtn, /data-admin-reset-progress="9900000022-HDESK"/);
  assert.match(testBtn, /bg-\[#b91c1c\]/, 'solid red background');
  assert.match(testBtn, /text-white/);
  assert.match(testBtn, /hover:bg-\[#991b1b\]/, 'darker red on hover');
  assert.match(testBtn, /focus-visible:ring-2/, 'visible focus ring');
  assert.doesNotMatch(testBtn, /class="[^"]*(?:^|\s)(?:inline-flex|inline-block|flex|block|grid)(?:\s|")/,
    'no display class, which would override the hidden attribute');
  assert.match(testHtml, /data-admin-test-account="9900000022-HDESK" checked/);
  assert.doesNotMatch(realHtml, /data-admin-test-account="9900000023-HDESK" checked/);
  assert.equal(ctx.testAccountRosterControlsHtml({ student_id: '9900000022-HDESK', is_test_account: true }, true), '',
    'instructor dashboard: no test-account controls');
  vm.runInContext('TEST_ACCOUNTS.available = false', ctx);
  assert.equal(ctx.testAccountRosterControlsHtml({ student_id: '9900000022-HDESK', is_test_account: true }, false), '',
    'database without the migration: no test-account controls');

  console.log('test-account-reset: all checks passed');
}

main().catch((err) => { console.error(err); process.exit(1); });

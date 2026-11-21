// The platform's generic Assessment Lab box (portal/app.js,
// moduleAssessmentModule + submitModuleAssessment), used by every Help Desk,
// AI/ML and Electrical module (SOC modules author their own).
//
// Contracts:
//   - "Submitted" only when both the artifact and the lab attempt were stored;
//     either save failing (the helpers return null/false, never throw) leaves
//     the box open for a retry;
//   - a retry never creates a second waiting lab attempt or re-stores an
//     artifact that already landed;
//   - the attempt is saved as 'submitted' so it reaches the Lab Attempts queue;
//   - the lock comes from the server's newest attempt, not browser storage:
//     waiting or approved locks it, a returned attempt opens it once and shows
//     the instructor's note.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const RATIONALE = 'I checked the event log, confirmed the spooler crash time matched the ticket, restarted the service and verified a test page printed from the user workstation.';
const USER = { userId: 'u-1', trackCode: 'HDESK', email: 'student@example.test' };

// A tiny "database": lab_attempts rows and portfolio_artifacts rows, with
// switches to fail either insert.
function setup({ attempts = [], failArtifact = false, failAttempt = false, failCheck = false } = {}) {
  const ctx = loadPortal();
  const db = { attempts: [...attempts], artifacts: [], failArtifact, failAttempt, failCheck };
  ctx.supabaseResponder = (call) => {
    if (call.table === 'portfolio_artifacts' && call.op === 'insert') {
      if (db.failArtifact) return { data: null, error: { code: '23514', message: 'violates check constraint "portfolio_artifacts_kind_check"' } };
      db.artifacts.push(call.payload);
      return { data: { id: `a-${db.artifacts.length}` }, error: null };
    }
    if (call.table === 'lab_attempts' && call.op === 'insert') {
      if (db.failAttempt) return { data: null, error: { code: '08006', message: 'network' } };
      // The database's one-pending rule (guard_lab_attempt_single_pending).
      const prev = db.attempts.filter((row) => row.lab_key === call.payload.lab_key && row.user_id === call.payload.user_id && row.completed_at)
        .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)))[0];
      if (prev && (!prev.reviewed_at || !prev.redo_requested)) return { data: null, error: { code: 'P0001', message: 'This lab already has a submission awaiting instructor review.' } };
      db.attempts.push({ ...call.payload, completed_at: call.payload.completed_at, reviewed_at: null, redo_requested: false });
      return { data: null, error: null };
    }
    if (call.table === 'lab_attempts' && call.op === 'select' && call.filters.lab_key) {
      if (db.failCheck) return { data: null, error: { message: 'offline' } };
      const rows = db.attempts
        .filter((row) => row.lab_key === call.filters.lab_key && row.user_id === call.filters.user_id && row.completed_at)
        .sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at)));
      return { data: rows.slice(0, 1), error: null };
    }
    return { data: null, error: null };
  };
  ctx.testUser = { ...USER, latestLabAttemptByKey: {} };
  const submit = () => vm.runInContext(
    `submitModuleAssessment(testUser, { moduleKey: 'its-03', programSlug: 'it-support', rationale: ${JSON.stringify(RATIONALE)}, attempt: 1 })`, ctx);
  return { ctx, db, submit };
}

const waiting = (db) => db.attempts.filter((row) => row.lab_key === 'its-03-assessment-module' && !row.reviewed_at);

(async () => {
  // 1. Success: one artifact of the new kind, one 'submitted' attempt.
  {
    const { db, submit, ctx } = setup();
    const outcome = await submit();
    assert.equal(outcome.ok, true);
    assert.equal(outcome.status, 'pending');
    assert.equal(db.artifacts.length, 1);
    assert.equal(db.artifacts[0].kind, 'module_assessment');
    assert.equal(db.attempts.length, 1);
    assert.equal(db.attempts[0].state, 'submitted', 'the attempt must reach the Lab Attempts queue');
    assert.ok(db.attempts[0].completed_at, 'a waiting attempt has a completed_at');
    assert.equal(db.attempts[0].result.rationale, RATIONALE);
    assert.equal(vm.runInContext("moduleAssessmentReviewStatus(testUser.latestLabAttemptByKey['its-03-assessment-module'])", ctx), 'pending');
    // A second click (another tab) is refused by the server check.
    const again = await submit();
    assert.equal(again.ok, false);
    assert.equal(again.status, 'pending');
    assert.equal(db.attempts.length, 1);
    assert.equal(db.artifacts.length, 1);
  }

  // 2. Artifact refused (the old kind check): not submitted, no attempt queued; retry after the fix works once.
  {
    const { db, submit } = setup({ failArtifact: true });
    const outcome = await submit();
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 'open', 'a failed save leaves the box open');
    assert.equal(db.attempts.length, 0, 'no lab attempt without its stored work');
    db.failArtifact = false;
    const retry = await submit();
    assert.equal(retry.ok, true);
    assert.equal(db.artifacts.length, 1);
    assert.equal(waiting(db).length, 1);
  }

  // 3. Artifact stored, lab attempt failed: retry sends only the attempt.
  {
    const { db, submit } = setup({ failAttempt: true });
    const outcome = await submit();
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 'open');
    assert.equal(db.artifacts.length, 1);
    assert.equal(db.attempts.length, 0);
    db.failAttempt = false;
    const retry = await submit();
    assert.equal(retry.ok, true);
    assert.equal(db.artifacts.length, 1, 'the stored artifact is not saved twice');
    assert.equal(waiting(db).length, 1, 'exactly one waiting attempt after a retry');
  }

  // 4. Lost reply: the attempt landed but the browser saw a failure. The
  // retry's server check finds it waiting and stores nothing more.
  {
    const { db, submit } = setup();
    db.attempts.push({ user_id: 'u-1', lab_key: 'its-03-assessment-module', completed_at: '2026-10-29T10:00:00.000Z', reviewed_at: null, redo_requested: false });
    const retry = await submit();
    assert.equal(retry.ok, false);
    assert.equal(retry.status, 'pending');
    assert.equal(waiting(db).length, 1);
    assert.equal(db.artifacts.length, 0);
  }

  // 5. The server check itself fails: nothing is saved, the box stays open.
  {
    const { db, submit } = setup({ failCheck: true });
    const outcome = await submit();
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 'open');
    assert.equal(db.attempts.length + db.artifacts.length, 0);
  }

  // 6. Returned: one new submission allowed, then locked again. Approved: locked.
  {
    const { db, submit } = setup({ attempts: [{ user_id: 'u-1', lab_key: 'its-03-assessment-module', completed_at: '2026-10-28T10:00:00.000Z', reviewed_at: '2026-10-28T12:00:00.000Z', redo_requested: true }] });
    const outcome = await submit();
    assert.equal(outcome.ok, true);
    assert.equal(waiting(db).length, 1);
    const again = await submit();
    assert.equal(again.ok, false);
    assert.equal(again.status, 'pending');
  }
  {
    const { db, submit } = setup({ attempts: [{ user_id: 'u-1', lab_key: 'its-03-assessment-module', completed_at: '2026-10-28T10:00:00.000Z', reviewed_at: '2026-10-28T12:00:00.000Z', redo_requested: false }] });
    const outcome = await submit();
    assert.equal(outcome.ok, false);
    assert.equal(outcome.status, 'approved');
    assert.equal(db.attempts.length, 1);
  }

  // 7. Two tabs submit at once: both pass the browser check, the database
  // refuses the second attempt, and that tab reports it waiting, not an error.
  {
    const { db, submit } = setup();
    const [first, second] = await Promise.all([submit(), submit()]);
    assert.equal(waiting(db).length, 1, 'only one waiting attempt from two tabs');
    assert.deepEqual([first.ok, second.ok].sort(), [false, true]);
    assert.equal((first.ok ? second : first).status, 'pending');
  }

  // 8. Rendering follows the server copy, not browser storage.
  {
    const { ctx } = setup();
    const render = (attempt, feedback) => {
      ctx.renderUser = { ...USER, latestLabAttemptByKey: attempt ? { 'its-03-assessment-module': attempt } : {}, openLabRedoFeedbackByLabKey: feedback ? { 'its-03-assessment-module': feedback } : {} };
      return vm.runInContext("moduleAssessmentModule(renderUser, PROGRAMS.find((p) => p.slug === 'it-support'), 'its-03')", ctx);
    };
    // A browser that remembers a submit time, with nothing on the server, is still open.
    vm.runInContext(`LabRuntime.save('academy-assessment-its-03', { ...${JSON.stringify(USER)} }, { rationale: 'draft', submittedAt: '2026-10-01T00:00:00Z', attempts: 3 })`, ctx);
    const open = render(null);
    assert.match(open, /data-module-assessment-form/);
    assert.match(open, /Assessment required/);
    assert.doesNotMatch(open, /Instructor review is pending/);

    const pending = render({ completedAt: '2026-10-29T10:00:00Z', reviewedAt: null, redoRequested: false });
    assert.doesNotMatch(pending, /data-module-assessment-form/, 'a waiting submission has no form');
    assert.match(pending, /waiting for instructor review/);

    const approved = render({ completedAt: '2026-10-29T10:00:00Z', reviewedAt: '2026-10-29T12:00:00Z', redoRequested: false });
    assert.doesNotMatch(approved, /data-module-assessment-form/);
    assert.match(approved, /Approved by your instructor/);

    const returned = render({ completedAt: '2026-10-29T10:00:00Z', reviewedAt: '2026-10-29T12:00:00Z', redoRequested: true }, [{ item_label: 'Rationale', comment: 'Name the log you used <b>.' }]);
    assert.match(returned, /data-module-assessment-form/);
    assert.match(returned, /Resubmit assessment/);
    assert.match(returned, /Name the log you used &lt;b&gt;\./, 'the return note is shown, escaped');

    const returnedNoNote = render({ completedAt: '2026-10-29T10:00:00Z', reviewedAt: '2026-10-29T12:00:00Z', redoRequested: true });
    assert.match(returnedNoNote, /Your instructor returned this assessment/);
    assert.doesNotMatch(returnedNoNote, /<ul/);
  }

  console.log('module-assessment-submit: all checks passed');
})().catch((err) => { console.error(err); process.exit(1); });

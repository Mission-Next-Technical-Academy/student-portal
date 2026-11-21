// UAT 2026-10-21 Module 01 fixes: B13 (failed save), B4 (lesson evidence), B8 ("started"), B11/B12 (copy).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

async function main() {
  const ctx = loadPortal();
  const user = { email: 's@example.test', userId: 'student-m01', trackCode: 'SOCAN', labAttemptsLoaded: true, latestLabAttemptByKey: {} };
  ctx.requestAnimationFrame = (fn) => fn();
  const calls = () => ctx.supabaseCalls;
  ctx.supabaseResponder = () => ({ data: [], error: null });
  const moduleState = ctx.moduleOneLoad(user);
  const global = (name) => vm.runInContext(name, ctx);

  // B8: the auto-credited handed-over 'owner' evidence is not progress.
  assert.deepEqual([...moduleState.lab2.reviewedEvidence], ['owner']);
  assert.equal(ctx.moduleOneProgress().assessmentLabStarted, false);
  moduleState.lab2.reviewedEvidence.push('signin-1');
  assert.equal(ctx.moduleOneProgress().assessmentLabStarted, true);
  moduleState.lab2.reviewedEvidence.pop();

  // B4: completing lesson 1 writes lesson-1 evidence right away, once.
  const lesson = global('MODULE_ONE_ALERT_ORIENTATION').lessons[0];
  const answers = {};
  (lesson.knowledgeCheck?.questions || []).forEach((q) => { answers[q.id] = q.correctId; });
  moduleState.lessonWork['1'] = { checked: true, answers };
  const evidenceInserts = () => calls().filter((c) => c.table === 'module_completion_evidence' && c.op === 'insert').flatMap((c) => c.payload.map((row) => row.evidence_key));
  ctx.moduleOneSave(); await tick();
  assert.deepEqual([...evidenceInserts()], ['lesson-1']);
  ctx.moduleOneSave(); await tick();
  assert.deepEqual([...evidenceInserts()], ['lesson-1'], 'not re-sent');

  // B13: a failed lab_attempts save does not count the attempt or mark the lab complete.
  const lab = global('MODULE_ONE_ESCALATION_LAB');
  const state = moduleState.lab2;
  Object.assign(state, { reviewedEvidence: lab.scenario.evidence.map((e) => e.id), affectedUser: 'x', affectedDevice: 'y', intake: 'a', priority: lab.correctPriority, verdict: lab.correctVerdict, escalation: 'required', escalateTo: lab.departmentOptions[0].id, status: 'in-progress', notes: 'n'.repeat(120) });
  ctx.moduleOneProveItPerformance = () => ({ missing: [], score: 50, breakdown: {}, feedback: [], criticalErrors: [] });
  const completions = [];
  ctx.markModuleLabComplete = (...args) => completions.push(args);
  ctx.supabaseResponder = (call) => call.table === 'lab_attempts' ? { data: null, error: { code: '500', message: 'down' } } : { data: [], error: null };
  const before = state.attempts || 0;
  ctx.moduleOneFinalizeProveIt();
  await tick();
  assert.equal(state.submitted, false);
  assert.equal(state.attempts || 0, before, 'attempt not counted');
  assert.equal(completions.length, 0, 'lab not marked complete');
  assert.match(ctx.moduleOneProveItSubmissionPanel(), /did not reach your instructor/);
  assert.match(ctx.moduleOneProveItSubmissionPanel(), /role="alert"/);

  // Resubmit succeeds: counted once, marked complete, message gone.
  ctx.supabaseResponder = () => ({ data: [], error: null });
  ctx.moduleOneFinalizeProveIt();
  await tick();
  assert.equal(state.attempts, before + 1);
  assert.equal(completions.length, 1);
  assert.doesNotMatch(ctx.moduleOneProveItSubmissionPanel(), /did not reach your instructor/);

  // B11 / B12: stale copy removed.
  const caseRecord = fs.readFileSync(path.join(__dirname, '..', 'portal', 'case-record.js'), 'utf8');
  assert.doesNotMatch(caseRecord, /notes, and handoff are ready/);
  const m01 = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-01.js'), 'utf8');
  assert.doesNotMatch(m01, /kicks the ticket back to the\s*\/\/ student unsubmitted/);
  console.log('m01 UAT fixes: passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

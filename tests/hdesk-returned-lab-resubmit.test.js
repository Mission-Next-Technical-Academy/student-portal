// Help Desk: a lab faculty returned for revision can be resubmitted, and a
// resubmission sends exactly one new lab_attempts row.
//
//   - Evidence labs (Module 1 Lab 1.1, Module 2 Labs 2.1/2.2): an explicit
//     "Resubmit" button, disabled until the student has added or replaced at
//     least one evidence file since the lab was returned.
//   - Guided walkthrough labs (Module 1 Lab 1.2, Module 2 Labs 2.3/2.4,
//     Modules 3-11): finishing the walkthrough again resubmits only the
//     returned lab(s); waiting or approved labs send nothing.
//   - Every Help Desk module page shows the instructor's return notes,
//     including Module 12 (notice only).
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);

// The page re-render and the signed-in user are app.js concerns; stub both.
ctx.render = () => {};
let signedIn = null;
ctx.currentUser = async () => signedIn;

const SIM = new URL(run('SIM_ORIGIN')).origin;
const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const moduleLab = (n) => run(`MODULE_LABS['it-support/${n}']`);
// Saved lab state only loads back with LabRuntime's own labId/student stamp.
const seed = (labId, user, state) => LabRuntime.save(labId, user, { ...LabRuntime.load(labId, user, {}), ...state });
const coachDone = (id) => ({ data: { type: 'mnt-coach-complete', id }, origin: SIM });

const SUBMITTED = '2026-10-01T10:00:00Z';
const REVIEWED = '2026-10-02T10:00:00Z';
const waiting = () => ({ completedAt: SUBMITTED, reviewedAt: null, redoRequested: false, supersededAt: null });
const approved = () => ({ ...waiting(), reviewedAt: REVIEWED });
const returned = () => ({ ...waiting(), reviewedAt: REVIEWED, redoRequested: true });
const note = (comment) => [{ item_label: 'Evidence', comment }];
const file = (name, uploadedAt) => ({ name, sizeLabel: '1.0 KB', uploadedAt });

function hdUser({ attempts = {}, feedback = {} } = {}) {
  return {
    userId: 'user-hdesk',
    email: 'hdesk@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    latestLabAttemptByKey: attempts,
    openLabRedoFeedbackByLabKey: feedback,
    openLabRedosByModuleKey: {},
  };
}

function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.localStorage.clear();
  signedIn = user;
}

const inserts = (labKey) => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert'
  && (!labKey || c.payload.lab_key === labKey));
const resubmitButton = (html, labKey) => (new RegExp(`<button[^>]*data-its-resubmit="${labKey}"[^>]*>`).exec(html) || [null])[0];
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/* ------------------------------------------------ Module 2, Lab 2.1 (evidence) */

const LAB21 = 'lab-its-02-vm-build';
const LAB22 = 'lab-its-02-vm-snapshot-server';
const LAB23 = 'lab-its-02-device-manager';
const LAB24 = 'lab-its-02-print-spooler';
const ITS02_STATE_ID = 'its02-lab-state-v1';
const lab21Done = () => ({
  evDesktop: file('desktop.png', SUBMITTED), evVmSettings: file('settings.png', SUBMITTED), lab21Complete: true,
  evSnapshot: null, evPing1: null, evPing2: null, lab22Complete: false, consoleStarted: false, consoleCompleted: false,
});

async function testReturnedEvidenceLabResubmitsOnce() {
  const user = hdUser({ attempts: { [LAB21]: returned() }, feedback: { [LAB21]: note('Show the RAM setting in the screenshot.') } });
  fresh(user);
  seed(ITS02_STATE_ID, user, lab21Done());

  let html = moduleLab(2).view(user, HD);
  assert.match(html, /Show the RAM setting in the screenshot\./, 'the return note is on the Module 2 page');
  const before = resubmitButton(html, LAB21);
  assert.ok(before, 'a returned Lab 2.1 shows a Resubmit button');
  assert.match(before, /disabled/, 'Resubmit is disabled until a file is added or replaced');

  // No new file since the return: the button does nothing.
  await run('its02ResubmitLab')(LAB21);
  assert.equal(inserts().length, 0, 'no new file -> no save');

  // Replacing a file alone never resubmits.
  run('its02AddEvidence')('its02-ev-desktop', file('desktop-v2.png', '2026-10-03T09:00:00Z'));
  await settle();
  assert.equal(inserts().length, 0, 'uploading a file does not resubmit by itself');

  html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(resubmitButton(html, LAB21), /disabled/, 'Resubmit is enabled after a replaced file');

  // Two quick presses send one attempt.
  await Promise.all([run('its02ResubmitLab')(LAB21), run('its02ResubmitLab')(LAB21)]);
  assert.equal(inserts(LAB21).length, 1, 'exactly one new attempt for Lab 2.1');
  assert.equal(inserts().length, 1, 'no other lab is submitted');
  assert.equal(inserts(LAB21)[0].payload.state, 'complete');

  // Afterwards the lab is waiting on faculty: no notice, no button, no more saves.
  html = moduleLab(2).view(user, HD);
  assert.equal(resubmitButton(html, LAB21), null, 'no Resubmit button once resubmitted');
  assert.doesNotMatch(html, /Show the RAM setting in the screenshot\./, 'the return note clears after resubmitting');
  await run('its02ResubmitLab')(LAB21);
  assert.equal(inserts(LAB21).length, 1, 'still exactly one attempt');
}

async function testReturnedEvidenceLabWithNewFileAfterReturn() {
  // A file added (not replaced) after the return also enables Resubmit: the
  // student was missing the VM settings screenshot on this device.
  const user = hdUser({ attempts: { [LAB21]: returned() } });
  fresh(user);
  seed(ITS02_STATE_ID, user, { ...lab21Done(), evVmSettings: null, lab21Complete: false });
  let html = moduleLab(2).view(user, HD);
  assert.match(resubmitButton(html, LAB21), /disabled/, 'disabled while a required file is missing');
  run('its02AddEvidence')('its02-ev-vmsettings', file('settings-v2.png', '2026-10-03T09:00:00Z'));
  await settle();
  assert.equal(inserts().length, 0, 'completing the evidence set does not auto-submit a returned lab');
  html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(resubmitButton(html, LAB21), /disabled/);
  await run('its02ResubmitLab')(LAB21);
  assert.equal(inserts(LAB21).length, 1);
}

async function testWaitingOrApprovedEvidenceLabCannotResubmit() {
  for (const [name, attempt] of [['waiting', waiting()], ['approved', approved()]]) {
    const user = hdUser({ attempts: { [LAB21]: attempt } });
    fresh(user);
    seed(ITS02_STATE_ID, user, lab21Done());
    const html = moduleLab(2).view(user, HD);
    assert.equal(resubmitButton(html, LAB21), null, `${name}: no Resubmit button`);
    run('its02AddEvidence')('its02-ev-desktop', file('desktop-v2.png', '2026-10-03T09:00:00Z'));
    await run('its02ResubmitLab')(LAB21);
    assert.equal(inserts().length, 0, `${name}: no new attempt`);
  }
}

async function testFirstSubmissionUsesSubmitButton() {
  // Never submitted: adding both files sends nothing; Submit Lab 2.1 sends
  // one attempt, the same explicit pattern as Resubmit.
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);
  run('its02AddEvidence')('its02-ev-desktop', file('desktop.png', SUBMITTED));
  run('its02AddEvidence')('its02-ev-vmsettings', file('settings.png', SUBMITTED));
  await settle();
  assert.equal(inserts().length, 0, 'adding files never submits');
  await run('its02SubmitLab')(LAB21);
  assert.equal(inserts(LAB21).length, 1, 'Submit Lab 2.1 sends one attempt');
  assert.equal(resubmitButton(moduleLab(2).view(user, HD), LAB21), null, 'no Resubmit button for a first submission');
}

/* -------------------------------------- Module 2, Labs 2.3/2.4 (walkthrough) */

async function testWalkthroughResubmitsOnlyReturnedLab() {
  const user = hdUser({ attempts: { [LAB23]: returned(), [LAB24]: approved() }, feedback: { [LAB23]: note('Restart the spooler before clearing the queue.') } });
  fresh(user);
  seed(ITS02_STATE_ID, user, { ...lab21Done(), consoleStarted: true, consoleCompleted: true });
  const html = moduleLab(2).view(user, HD);
  assert.match(html, /Restart the spooler before clearing the queue\./, 'walkthrough return note shown');
  assert.match(html, /Redo the walkthrough/, 'launch button invites a redo');

  // The simulator can post its completion twice; still one attempt.
  await Promise.all([run('its02ReceiveCoachCompletion')(coachDone('hd-m02')), run('its02ReceiveCoachCompletion')(coachDone('hd-m02'))]);
  assert.equal(inserts(LAB23).length, 1, 'the returned lab is resubmitted once');
  assert.equal(inserts(LAB24).length, 0, 'the approved lab is not resubmitted');
}

/* ------------------------------------------ Modules 3-11 (shared walkthrough) */

async function testSharedWalkthroughModule() {
  const LAB = 'lab-its-03-blank-desktop';
  const user = hdUser({ attempts: { [LAB]: returned() }, feedback: { [LAB]: note('Check Event Viewer before rebuilding the profile.') } });
  fresh(user);
  seed('its-coach-its-03-v1', user, { consoleStarted: true, consoleCompleted: true });
  let html = moduleLab(3).view(user, HD);
  assert.match(html, /Check Event Viewer before rebuilding the profile\./, 'Module 3 shows the return note');
  assert.match(html, /Redo the walkthrough/);

  await moduleLab(3).onMessage(coachDone('hd-m03'));
  assert.equal(inserts(LAB).length, 1, 'finishing again resubmits once');
  await moduleLab(3).onMessage(coachDone('hd-m03'));
  assert.equal(inserts(LAB).length, 1, 'finishing while waiting on faculty sends nothing');

  html = moduleLab(3).view(user, HD);
  assert.doesNotMatch(html, /Check Event Viewer before rebuilding the profile\./, 'note clears after resubmitting');
  assert.doesNotMatch(html, /Redo the walkthrough/);

  // Every Modules 3-11 page gets the same handling from the shared factory.
  for (let n = 3; n <= 11; n += 1) {
    const key = `its-${String(n).padStart(2, '0')}`;
    const labKeys = run('LABS').filter((l) => l.module === key).map((l) => l.key);
    const u = hdUser({ attempts: Object.fromEntries(labKeys.map((k) => [k, returned()])), feedback: Object.fromEntries(labKeys.map((k) => [k, note(`Note for ${key}`)])) });
    fresh(u);
    assert.match(moduleLab(n).view(u, HD), new RegExp(`Note for ${key}`), `Module ${n} shows its return note`);
  }
}

async function testNoNoticeWhenNothingReturned() {
  for (const n of [1, 2, 3, 12]) {
    const user = hdUser();
    fresh(user);
    assert.doesNotMatch(moduleLab(n).view(user, HD), /Returned for revision/, `Module ${n}: no notice without a return`);
  }
}

/* ------------------------------------------------------------------ Module 1 */

async function testModuleOne() {
  const LAB1 = 'lab-its-01-lms-validation';
  const LAB2 = 'lab-its-01-ticket-triage';
  const user = hdUser({ attempts: { [LAB1]: returned(), [LAB2]: returned() }, feedback: { [LAB1]: note('Upload the sandbox screenshot, not the LMS one.'), [LAB2]: note('Unlock the account before resetting.') } });
  fresh(user);
  seed('its01-lms-validation-v1', user, {
    evidence1: file('lms.png', SUBMITTED), evidence2: file('tile.png', SUBMITTED), aupScrolled: true, aupAcknowledged: true, lab1Complete: true,
    consoleStarted: true, consoleCompleted: true,
  });
  let html = moduleLab(1).view(user, HD);
  assert.match(html, /Upload the sandbox screenshot, not the LMS one\./);
  assert.match(html, /Unlock the account before resetting\./);
  assert.match(resubmitButton(html, LAB1), /disabled/);

  await run('its01ResubmitLab')(LAB1);
  assert.equal(inserts().length, 0, 'Lab 1.1: no new file -> no save');
  run('its01AddEvidence')('its01-evidence-1', file('sandbox.png', '2026-10-03T09:00:00Z'));
  await settle();
  assert.equal(inserts().length, 0, 'Lab 1.1: upload alone does not resubmit');
  html = moduleLab(1).view(user, HD);
  assert.doesNotMatch(resubmitButton(html, LAB1), /disabled/);
  await Promise.all([run('its01ResubmitLab')(LAB1), run('its01ResubmitLab')(LAB1)]);
  assert.equal(inserts(LAB1).length, 1, 'Lab 1.1: exactly one new attempt');

  await moduleLab(1).onMessage(coachDone('hd-m01'));
  await moduleLab(1).onMessage(coachDone('hd-m01'));
  assert.equal(inserts(LAB2).length, 1, 'Lab 1.2: exactly one new attempt');
}

/* ------------------------------------------------------------------ Module 12 */

async function testModuleTwelveNotice() {
  const LAB = 'lab-its-12-capstone';
  const user = hdUser({ attempts: { [LAB]: returned() }, feedback: { [LAB]: note('Escalate the phishing ticket <first>.') } });
  fresh(user);
  const html = moduleLab(12).view(user, HD);
  assert.match(html, /Returned for revision/, 'Module 12 shows the return notice');
  assert.match(html, /Escalate the phishing ticket &lt;first&gt;\./, 'notes are HTML-escaped');
}

(async () => {
  const tests = [
    testReturnedEvidenceLabResubmitsOnce,
    testReturnedEvidenceLabWithNewFileAfterReturn,
    testWaitingOrApprovedEvidenceLabCannotResubmit,
    testFirstSubmissionUsesSubmitButton,
    testWalkthroughResubmitsOnlyReturnedLab,
    testSharedWalkthroughModule,
    testNoNoticeWhenNothingReturned,
    testModuleOne,
    testModuleTwelveNotice,
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
  console.log(`all ${tests.length} passed`);
})();

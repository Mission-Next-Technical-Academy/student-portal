// Help Desk module pages (Modules 1-11) show each lab's status from the
// database only: the newest lab attempt the portal loads at sign-in
// (user.latestLabAttemptByKey). Browser storage holds only work not yet
// sent, so clearing site data never changes a lab's status, counter or rail.
//
//   - Status lines: "Lab 2.1 submitted <day>, waiting for instructor review",
//     "Lab 2.1 passed", "Lab 2.1 returned for revision ...", else the prompt.
//   - Hero counter: "3 of 4 submitted · 1 passed" (+ "· N returned").
//   - Rail: ticked only when passed; "In review" / "Returned" otherwise.
//   - Evidence labs submit only with an explicit "Submit Lab X.Y" button once
//     every file is added; adding files never shows complete or passed.
//
// Module 12 (capstone) is not covered: faculty approval there is recorded in
// capstone_reviews, not lab_attempts.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);

ctx.render = () => {};
let signedIn = null;
ctx.currentUser = async () => signedIn;

const SIM = new URL(run('SIM_ORIGIN')).origin;
const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const moduleLab = (n) => run(`MODULE_LABS['it-support/${n}']`);
const seed = (labId, user, state) => LabRuntime.save(labId, user, { ...LabRuntime.load(labId, user, {}), ...state });

const SUBMITTED = '2026-10-01T15:00:00Z';
const REVIEWED = '2026-10-02T15:00:00Z';
const DAY = new Date(SUBMITTED).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const waiting = () => ({ completedAt: SUBMITTED, reviewedAt: null, redoRequested: false, supersededAt: null });
const approved = () => ({ ...waiting(), reviewedAt: REVIEWED });
const returned = () => ({ ...waiting(), reviewedAt: REVIEWED, redoRequested: true });
const file = (name, uploadedAt) => ({ name, sizeLabel: '1.0 KB', uploadedAt });

function hdUser(attempts = {}) {
  return {
    userId: 'user-hdesk',
    email: 'hdesk@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    latestLabAttemptByKey: attempts,
    openLabRedoFeedbackByLabKey: {},
    openLabRedosByModuleKey: {},
  };
}

// Every test starts from cleared site data, as on a new device.
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run('itsUnrecordedWalkthroughs.clear(); itsBlockedWalkthroughs.clear()');
  signedIn = user;
}

const inserts = (labKey) => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert'
  && (!labKey || c.payload.lab_key === labKey));
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// The text of one lab's status line.
function statusLine(html, labKey) {
  const match = new RegExp(`data-its-lab-status="${labKey}"[^>]*>[\\s\\S]*?<span>([\\s\\S]*?)</span>`).exec(html);
  assert.ok(match, `a status line for ${labKey}`);
  return match[1];
}

// One rail row: its status class and its visible text.
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { ticked: match[1].includes('mnav-chip-complete'), text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
}

const counter = (html, id) => (new RegExp(`id="${id}">([^<]*)<`).exec(html) || [null, null])[1];
const submitButton = (html, labKey) => (new RegExp(`<button[^>]*data-its-submit="${labKey}"[^>]*>[\\s\\S]*?</button>`).exec(html) || [null])[0];
const section = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `section ${id}`);
  const end = html.indexOf('</section>', start);
  return html.slice(start, end);
};

/* ------------------------------------------------------------------ Module 2 */

const LAB21 = 'lab-its-02-vm-build';
const LAB22 = 'lab-its-02-vm-snapshot-server';
const LAB23 = 'lab-its-02-device-manager';
const LAB24 = 'lab-its-02-print-spooler';

async function testModuleTwoClearedStorageShowsDatabaseStatus() {
  // ISSUE-028's staging account: 2.1, 2.3 and 2.4 waiting, 2.2 approved.
  const user = hdUser({ [LAB21]: waiting(), [LAB22]: approved(), [LAB23]: waiting(), [LAB24]: waiting() });
  fresh(user);
  const html = moduleLab(2).view(user, HD);

  assert.equal(statusLine(html, LAB21), `Lab 2.1 submitted ${DAY}, waiting for instructor review`);
  assert.equal(statusLine(html, LAB22), 'Lab 2.2 passed');
  assert.equal(statusLine(html, LAB23), `Lab 2.3 submitted ${DAY}, waiting for instructor review`);
  assert.equal(statusLine(html, LAB24), `Lab 2.4 submitted ${DAY}, waiting for instructor review`);
  assert.equal(counter(html, 'its02-status'), '4 of 4 submitted · 1 passed');
  assert.doesNotMatch(html, /Labs complete/, 'the counter never says complete');

  // A submitted evidence lab shows no empty upload boxes.
  for (const id of ['its02-lab-2-1', 'its02-lab-2-2']) {
    assert.doesNotMatch(section(html, id), /Not uploaded yet|Choose file|data-itsw-evidence-input/, `${id}: no upload boxes once submitted`);
  }
  assert.match(section(html, 'its02-lab-2-3'), /Review the walkthrough/);

  assert.deepEqual(railRow(html, 'its02-lab-2-1'), { ticked: false, text: 'Guided Lab In review' });
  assert.equal(railRow(html, 'its02-lab-2-2').ticked, true, 'the approved lab is ticked');
  assert.equal(railRow(html, 'its02-lab-2-3').ticked, false);
  assert.match(railRow(html, 'its02-lab-2-3').text, /In review/);
}

async function testModuleTwoLocalFlagsAloneAreNotSubmitted() {
  // Browser storage says everything is done; the database has nothing.
  const user = hdUser();
  fresh(user);
  seed('its02-lab-state-v1', user, {
    evDesktop: file('d.png', SUBMITTED), evVmSettings: file('s.png', SUBMITTED), lab21Complete: true,
    evSnapshot: file('a.png', SUBMITTED), evPing1: file('b.png', SUBMITTED), evPing2: file('c.png', SUBMITTED), lab22Complete: true,
    consoleStarted: true, consoleCompleted: true,
  });
  const html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(html, /Lab 2\.1 complete|Lab 2\.2 complete|Labs 2\.3 &(amp;)? 2\.4 complete/);
  assert.equal(statusLine(html, LAB21), 'Ready to submit Lab 2.1');
  assert.equal(counter(html, 'its02-status'), '0 of 4 submitted · 0 passed');
  assert.match(section(html, 'its02-lab-2-3'), /Start Labs 2\.3 &(amp;)? 2\.4 walkthrough/);
  for (const id of ['its02-lab-2-1', 'its02-lab-2-2', 'its02-lab-2-3']) assert.equal(railRow(html, id).ticked, false, `${id} not ticked`);
}

async function testModuleTwoReturnedLab() {
  const user = hdUser({ [LAB21]: returned(), [LAB22]: approved() });
  fresh(user);
  const html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Lab 2.1 returned for revision — see your instructor’s notes below.');
  assert.match(section(html, 'its02-lab-2-1'), /data-itsw-evidence-input/, 'a returned lab shows its upload boxes again');
  assert.match(section(html, 'its02-lab-2-1'), /data-its-resubmit/, 'PR #61 Resubmit button stays');
  assert.equal(counter(html, 'its02-status'), '1 of 4 submitted · 1 passed · 1 returned');
  assert.match(railRow(html, 'its02-lab-2-1').text, /Returned/);
}

async function testEvidenceUploadNeverCompletes() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);

  run('its02AddEvidence')('its02-ev-desktop', file('desktop.png', SUBMITTED));
  let html = moduleLab(2).view(user, HD);
  assert.equal(submitButton(html, LAB21), null, 'no Submit button until every file is added');
  assert.match(section(html, 'its02-lab-2-1'), /Added/, 'a picked file reads "Added"');
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /Uploaded/, 'never "Uploaded": the file stays on this device');

  run('its02AddEvidence')('its02-ev-vmsettings', file('settings.png', SUBMITTED));
  await settle();
  assert.equal(inserts().length, 0, 'adding every file does not submit by itself');
  html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Ready to submit Lab 2.1');
  assert.doesNotMatch(statusLine(html, LAB21), /complete|passed/i);
  assert.ok(submitButton(html, LAB21), 'Submit Lab 2.1 button once every file is added');
  assert.match(submitButton(html, LAB21), /Submit Lab 2\.1/);
  assert.equal(railRow(html, 'its02-lab-2-1').ticked, false);

  // Pressing Submit: "Submitting…" while the save is in flight, one row only.
  const first = run('its02SubmitLab')(LAB21);
  const second = run('its02SubmitLab')(LAB21);
  html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Submitting Lab 2.1…');
  await Promise.all([first, second]);
  assert.equal(inserts(LAB21).length, 1, 'exactly one attempt');
  assert.equal(inserts().length, 1, 'no other lab is submitted');

  html = moduleLab(2).view(user, HD);
  assert.match(statusLine(html, LAB21), /^Lab 2\.1 submitted .+, waiting for instructor review$/);
  assert.equal(counter(html, 'its02-status'), '1 of 4 submitted · 0 passed');
  assert.equal(submitButton(html, LAB21), null, 'no Submit button once submitted');
  assert.match(railRow(html, 'its02-lab-2-1').text, /In review/);
}

async function testEvidenceSubmitFailure() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert'
    ? { data: null, error: { message: 'network down' } } : { data: null, error: null });
  moduleLab(2).view(user, HD);
  run('its02AddEvidence')('its02-ev-desktop', file('desktop.png', SUBMITTED));
  run('its02AddEvidence')('its02-ev-vmsettings', file('settings.png', SUBMITTED));
  await run('its02SubmitLab')(LAB21);
  const html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Lab 2.1 wasn’t submitted. Check your connection, then press Submit Lab 2.1.');
  assert.ok(submitButton(html, LAB21), 'the Submit button stays so the student can retry');
  assert.equal(counter(html, 'its02-status'), '0 of 4 submitted · 0 passed');
}

/* ------------------------------------------------------------------ Module 1 */

const LAB11 = 'lab-its-01-lms-validation';
const LAB12 = 'lab-its-01-ticket-triage';

async function testModuleOneClearedStorage() {
  const user = hdUser({ [LAB11]: waiting(), [LAB12]: approved() });
  fresh(user);
  const html = moduleLab(1).view(user, HD);
  assert.equal(statusLine(html, LAB11), `Lab 1.1 submitted ${DAY}, waiting for instructor review`);
  assert.equal(statusLine(html, LAB12), 'Lab 1.2 passed');
  assert.equal(counter(html, 'its01-status'), '2 of 2 submitted · 1 passed');
  assert.doesNotMatch(section(html, 'its01-lab-1-1'), /Not uploaded yet|data-itsw-evidence-input|data-its01-aup-checkbox/);
  assert.match(section(html, 'its01-lab-1-1'), new RegExp(`Acknowledged with your Lab 1\\.1 submission on ${DAY}`));
  assert.match(section(html, 'its01-lab-1-2'), /Review the walkthrough/);
  assert.match(railRow(html, 'its01-lab-1-1').text, /In review/);
  assert.equal(railRow(html, 'its01-lab-1-2').ticked, true);
}

async function testModuleOneExplicitSubmit() {
  const user = hdUser();
  fresh(user);
  seed('its01-lms-validation-v1', user, { aupScrolled: true });
  moduleLab(1).view(user, HD);
  run('its01AddEvidence')('its01-evidence-1', file('sandbox.png', SUBMITTED));
  run('its01AddEvidence')('its01-evidence-2', file('tile.png', SUBMITTED));
  let html = moduleLab(1).view(user, HD);
  assert.equal(submitButton(html, LAB11), null, 'the policy must be acknowledged before Submit appears');

  const state = LabRuntime.load('its01-lms-validation-v1', user, {});
  LabRuntime.save('its01-lms-validation-v1', user, { ...state, aupAcknowledged: true });
  html = moduleLab(1).view(user, HD);
  await settle();
  assert.equal(inserts().length, 0, 'no auto-submit');
  assert.equal(statusLine(html, LAB11), 'Ready to submit Lab 1.1');
  assert.ok(submitButton(html, LAB11));
  assert.match(section(html, 'its01-lab-1-1'), /screenshot of this tile showing an “Added” status/, 'Lab 1.1 hint matches the tile');

  await run('its01SubmitLab')(LAB11);
  assert.equal(inserts(LAB11).length, 1);
  html = moduleLab(1).view(user, HD);
  assert.match(statusLine(html, LAB11), /^Lab 1\.1 submitted .+, waiting for instructor review$/);
  assert.equal(counter(html, 'its01-status'), '1 of 2 submitted · 0 passed');
}

/* --------------------------------------------------------------- Modules 3-11 */

async function testSharedWalkthroughModules() {
  for (let n = 3; n <= 11; n += 1) {
    const key = `its-${String(n).padStart(2, '0')}`;
    const rail = `itss-lab-${String(n).padStart(2, '0')}`;
    const [lab] = run('LABS').filter((l) => l.module === key).map((l) => l.key);

    let user = hdUser({ [lab]: waiting() });
    fresh(user);
    let html = moduleLab(n).view(user, HD);
    assert.equal(statusLine(html, lab), `Lab submitted ${DAY}, waiting for instructor review`, `Module ${n} waiting`);
    assert.match(html, /Review the walkthrough/, `Module ${n}: review button`);
    assert.match(railRow(html, rail).text, /In review/, `Module ${n}: rail in review`);

    user = hdUser({ [lab]: approved() });
    fresh(user);
    html = moduleLab(n).view(user, HD);
    assert.equal(statusLine(html, lab), 'Lab passed', `Module ${n} passed`);
    assert.equal(railRow(html, rail).ticked, true, `Module ${n}: rail ticked when passed`);

    // Local "walkthrough finished" flag with nothing in the database.
    user = hdUser();
    fresh(user);
    seed(`its-coach-${key}-v1`, user, { consoleStarted: true, consoleCompleted: true });
    html = moduleLab(n).view(user, HD);
    assert.doesNotMatch(html, /Lab complete/, `Module ${n}: a local flag is not complete`);
    assert.match(html, /Start guided walkthrough/, `Module ${n}: start button`);
    assert.equal(railRow(html, rail).ticked, false, `Module ${n}: not ticked`);
  }
}

async function testWalkthroughCompletionShowsWaiting() {
  const user = hdUser();
  fresh(user);
  moduleLab(3).view(user, HD);
  await moduleLab(3).onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m03' }, origin: SIM });
  const html = moduleLab(3).view(user, HD);
  assert.match(statusLine(html, 'lab-its-03-blank-desktop'), /^Lab submitted .+, waiting for instructor review$/);
  assert.doesNotMatch(html, /Lab complete/);
}

/* ---------------------------------------------- walkthrough not recorded */

// A walkthrough that comes back by link (?coachComplete=) instead of the
// popup message saves nothing: anyone could type that link. The page says so.
// Names the lab's own Start button, as rendered (so "&" appears as "&amp;").
const unrecorded = (start) => `Your walkthrough finished but wasn’t recorded. Allow pop-ups for this site, then press ${start} again from this page.`;
const BLOCKED = 'Your browser blocked the walkthrough window. Allow pop-ups for this site, then try again.';
const notice = (html, coachId) => {
  const match = new RegExp(`<div[^>]*data-its-walkthrough-notice="${coachId}"[^>]*>([\\s\\S]*?)</div>`).exec(html);
  assert.ok(match, `a walkthrough notice for ${coachId}`);
  return match[1].trim();
};
const returnLink = (coachId) => run(`location.search = ${JSON.stringify(coachId ? `?coachComplete=${coachId}` : '')}`);

async function testReturnLinkRecordsNothing() {
  const cases = [
    [1, 'hd-m01', 'its01-lab-1-2', 'lab-its-01-ticket-triage', 'its01-lab-1-2', 'Start Lab 1.2 walkthrough'],
    [2, 'hd-m02', 'its02-lab-2-3', LAB23, 'its02-lab-2-3', 'Start Labs 2.3 &amp; 2.4 walkthrough'],
    [3, 'hd-m03', null, 'lab-its-03-blank-desktop', 'itss-lab-03', 'Start guided walkthrough'],
    [7, 'hd-m07', null, run('LABS').find((l) => l.module === 'its-07').key, 'itss-lab-07', 'Start guided walkthrough'],
  ];
  for (const [n, coachId, sectionId, lab, railId, start] of cases) {
    const user = hdUser();
    fresh(user);
    returnLink(coachId);
    try {
      const html = moduleLab(n).view(user, HD);
      await settle();
      assert.equal(inserts().length, 0, `Module ${n}: the return link saves no attempt`);
      const part = sectionId ? section(html, sectionId) : html;
      assert.equal(notice(part, coachId), unrecorded(start), `Module ${n}: not-recorded message`);
      assert.match(part, new RegExp(`</i> ${start}\\s*</a>`), `Module ${n}: the message names the Start button's own text`);
      // Module 2 shows one combined prompt until either walkthrough lab is submitted.
      const status = html.includes(`data-its-lab-status="${lab}"`) ? statusLine(html, lab) : part;
      assert.doesNotMatch(status, /submitted [A-Z]|waiting for instructor review|passed/, `Module ${n}: never shows submitted`);
      assert.equal(railRow(html, railId).ticked, false, `Module ${n}: rail not ticked`);
    } finally {
      returnLink(null);
    }
  }

  // With the attempt already saved (the popup message got through), no message.
  const user = hdUser({ 'lab-its-03-blank-desktop': waiting() });
  fresh(user);
  returnLink('hd-m03');
  try {
    const html = moduleLab(3).view(user, HD);
    assert.equal(notice(html, 'hd-m03'), '');
    assert.match(statusLine(html, 'lab-its-03-blank-desktop'), /waiting for instructor review/);
  } finally {
    returnLink(null);
  }
}

async function testBlockedPopupShowsMessage() {
  const user = hdUser();
  fresh(user);
  let html = moduleLab(3).view(user, HD);
  assert.equal(notice(html, 'hd-m03'), '', 'no message before Start is pressed');

  let prevented = false;
  run('window.open = () => null');
  const opened = run('itsLaunchWalkthrough')({ preventDefault() { prevented = true; } }, { href: 'http://127.0.0.1:8767/?coach=hd-m03' }, user, 'hd-m03');
  assert.equal(opened, false);
  assert.equal(prevented, true, 'the link does not also navigate this tab');
  html = moduleLab(3).view(user, HD);
  assert.equal(notice(html, 'hd-m03'), BLOCKED);
  assert.equal(inserts().length, 0);

  // Allowed on the next try: the message goes away.
  const opens = [];
  ctx.__opens = opens;
  run('window.open = (...args) => { __opens.push(args); return {}; }');
  assert.equal(run('itsLaunchWalkthrough')({ preventDefault() {} }, { href: 'http://127.0.0.1:8767/?coach=hd-m03' }, user, 'hd-m03'), true);
  assert.equal(opens.length, 1);
  assert.equal(opens[0][0], 'http://127.0.0.1:8767/?coach=hd-m03');
  html = moduleLab(3).view(user, HD);
  assert.equal(notice(html, 'hd-m03'), '');
}

(async () => {
  const tests = [
    testModuleTwoClearedStorageShowsDatabaseStatus,
    testModuleTwoLocalFlagsAloneAreNotSubmitted,
    testModuleTwoReturnedLab,
    testEvidenceUploadNeverCompletes,
    testEvidenceSubmitFailure,
    testModuleOneClearedStorage,
    testModuleOneExplicitSubmit,
    testSharedWalkthroughModules,
    testWalkthroughCompletionShowsWaiting,
    testReturnLinkRecordsNothing,
    testBlockedPopupShowsMessage,
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

// Help Desk module pages (Modules 1-11) show each lab's status from the
// database only: the newest lab attempt the portal loads at sign-in
// (user.latestLabAttemptByKey). Browser storage holds only work not yet
// sent, so clearing site data never changes a lab's status, counter or rail.
//
//   - Status lines: "Lab 4.1 submitted <day>, waiting for instructor review",
//     "Lab 4.1 passed", "Lab 4.1 returned for revision ...", else the prompt.
//   - Hero counter: "5 labs · 3 waiting for review · 1 passed" (waiting and
//     returned parts only when non-zero).
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
// The anonymous id a walkthrough launch link carries (never the email).
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
// moduleLab(n) is the page for module key its-NN (Help Desk display numbers
// differ from key order: its-10 is Module 2), so look up the key's number.
const moduleLab = (n) => run(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-${String(n).padStart(2, '0')}'].number]`);
const seed = (labId, user, state) => LabRuntime.save(labId, user, { ...LabRuntime.load(labId, user, {}), ...state });

const SUBMITTED = '2026-10-01T15:00:00Z';
const REVIEWED = '2026-10-02T15:00:00Z';
const DAY = new Date(SUBMITTED).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const waiting = () => ({ completedAt: SUBMITTED, reviewedAt: null, redoRequested: false, supersededAt: null });
const approved = () => ({ ...waiting(), reviewedAt: REVIEWED });
const returned = () => ({ ...waiting(), reviewedAt: REVIEWED, redoRequested: true });
// A picked file as itswReadEvidenceFile returns it: tile metadata plus the File.
const file = (name, uploadedAt) => ({ name, sizeLabel: '1.0 KB', uploadedAt, file: { name, size: 1024, type: 'image/png' } });

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
  run('itsUnrecordedWalkthroughs.clear(); itsBlockedWalkthroughs.clear(); itsIncompleteWalkthroughs.clear()');
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
  // Since Module 4's Prove It moved the gate (2026-11-23), all four are
  // Practice It: waiting or approved, each reads "Complete", as Module 1's do.
  const user = hdUser({ [LAB21]: waiting(), [LAB22]: approved(), [LAB23]: waiting(), [LAB24]: waiting() });
  fresh(user);
  const html = moduleLab(2).view(user, HD);

  assert.equal(statusLine(html, LAB21), `Lab 4.1: Complete · ${DAY}`);
  assert.equal(statusLine(html, LAB22), `Lab 4.2: Complete · ${DAY}`);
  assert.equal(statusLine(html, LAB23), `Lab 4.3: Complete · ${DAY}`);
  assert.equal(statusLine(html, LAB24), `Lab 4.4: Complete · ${DAY}`);
  assert.equal(counter(html, 'its02-status'), '5 labs · 4 practice complete · 0 passed');
  assert.doesNotMatch(html, /waiting for instructor review/);
  assert.doesNotMatch(html, /Labs complete/, 'the counter never says complete');

  // A submitted evidence lab shows no empty upload boxes.
  for (const id of ['its02-lab-2-1', 'its02-lab-2-2']) {
    assert.doesNotMatch(section(html, id), /Not uploaded yet|Choose file|data-itsw-evidence-input/, `${id}: no upload boxes once submitted`);
  }
  assert.match(section(html, 'its02-lab-2-3'), /Review the walkthrough/);

  assert.deepEqual(railRow(html, 'its02-lab-2-1'), { ticked: true, text: 'Guided Lab Complete' });
  assert.equal(railRow(html, 'its02-lab-2-2').ticked, true, 'the approved lab is ticked');
  assert.equal(railRow(html, 'its02-lab-2-3').ticked, true);
  assert.match(railRow(html, 'its02-lab-2-3').text, /Complete/);
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
  assert.doesNotMatch(html, /Lab 4\.1 complete|Lab 4\.2 complete|Labs 4\.3 &(amp;)? 4\.4 complete/);
  // Picked files live only in the page that picked them: after a reload each
  // tile asks for its file again, and nothing is ready to submit.
  assert.equal(statusLine(html, LAB21), 'Finish Lab 4.1 in the simulator to complete this lab.');
  assert.equal(submitButton(html, LAB21), null, 'no Submit button until the files are chosen again');
  assert.match(section(html, 'its02-lab-2-1'), /Choose this file again — “d\.png”/);
  assert.equal(counter(html, 'its02-status'), '5 labs · 0 practice complete · 0 passed');
  assert.match(section(html, 'its02-lab-2-3'), /Start Lab 4\.3 walkthrough/);
  for (const id of ['its02-lab-2-1', 'its02-lab-2-2', 'its02-lab-2-3']) assert.equal(railRow(html, id).ticked, false, `${id} not ticked`);
}

async function testModuleTwoReturnedLab() {
  const user = hdUser({ [LAB21]: returned(), [LAB22]: approved() });
  fresh(user);
  const html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Lab 4.1 returned for revision — see your instructor’s notes below.');
  assert.match(section(html, 'its02-lab-2-1'), /data-itsw-evidence-input/, 'a returned lab shows its upload boxes again');
  assert.match(section(html, 'its02-lab-2-1'), /data-its-resubmit/, 'PR #61 Resubmit button stays');
  assert.equal(counter(html, 'its02-status'), '5 labs · 1 practice complete · 0 passed · 1 returned');
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
  assert.equal(statusLine(html, LAB21), 'Ready to submit Lab 4.1');
  assert.doesNotMatch(statusLine(html, LAB21), /complete|passed/i);
  assert.ok(submitButton(html, LAB21), 'Submit Lab 4.1 button once every file is added');
  assert.match(submitButton(html, LAB21), /Submit Lab 4\.1/);
  assert.equal(railRow(html, 'its02-lab-2-1').ticked, false);

  // Pressing Submit: "Submitting…" while the save is in flight, one row only.
  const first = run('its02SubmitLab')(LAB21);
  const second = run('its02SubmitLab')(LAB21);
  html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Submitting Lab 4.1…');
  await Promise.all([first, second]);
  assert.equal(inserts(LAB21).length, 1, 'exactly one attempt');
  assert.equal(inserts().length, 1, 'no other lab is submitted');

  html = moduleLab(2).view(user, HD);
  assert.match(statusLine(html, LAB21), /^Lab 4\.1: Complete · .+$/);
  assert.equal(counter(html, 'its02-status'), '5 labs · 1 practice complete · 0 passed');
  assert.equal(submitButton(html, LAB21), null, 'no Submit button once submitted');
  assert.match(railRow(html, 'its02-lab-2-1').text, /Complete/);
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
  assert.equal(statusLine(html, LAB21), 'Lab 4.1 wasn’t submitted. Check your connection, then press Submit Lab 4.1.');
  assert.ok(submitButton(html, LAB21), 'the Submit button stays so the student can retry');
  assert.equal(counter(html, 'its02-status'), '5 labs · 0 practice complete · 0 passed');
}

/* ------------------------------------------------------------------ Module 1 */

// The keys are older than the numbers students see: the old Lab 1.1 (LMS &
// Environment Validation) is retired, the guided lab now shows as Lab 1.1 and
// the practice tickets as Lab 1.2.
const LAB11 = 'lab-its-01-lms-validation';
const LAB12 = 'lab-its-01-ticket-triage';
const PRACTICE = 'lab-its-01-practice-tickets';

// The retired Lab 1.1 is off the page: its old attempts stay in the database
// but show nowhere on Module 1 (no section, no status line, no rail row, no
// counter). Practice It labs read "Complete", whether
// waiting or approved before Practice It stopped being reviewed.
async function testModuleOneClearedStorage() {
  const user = hdUser({ [LAB11]: waiting(), [LAB12]: approved() });
  fresh(user);
  const html = moduleLab(1).view(user, HD);
  assert.equal(statusLine(html, LAB12), `Lab 1.1: Complete · ${DAY}`);
  assert.equal(counter(html, 'its01-status'), '3 labs · 1 practice complete · 0 passed');
  assert.match(section(html, 'its01-lab-1-2'), /Review the walkthrough/);
  assert.equal(railRow(html, 'its01-lab-1-2').ticked, true);
  assert.doesNotMatch(html, /its01-lab-1-1|data-its-lab-status="lab-its-01-lms-validation"|LMS &amp; Environment Validation/);

  // A waiting guided lab and a saved practice-tickets record: both practice
  // complete, never "waiting for instructor review" or "In review".
  const both = hdUser({ [LAB12]: waiting(), [PRACTICE]: waiting() });
  fresh(both);
  const page = moduleLab(1).view(both, HD);
  assert.equal(statusLine(page, LAB12), `Lab 1.1: Complete · ${DAY}`);
  assert.equal(statusLine(page, PRACTICE), `Lab 1.2: Complete · ${DAY}`);
  assert.equal(counter(page, 'its01-status'), '3 labs · 2 practice complete · 0 passed');
  assert.equal(railRow(page, 'its01-practice-tickets').ticked, true);
  assert.doesNotMatch(page, /waiting for instructor review|In review/);

  // A Return from before Practice It stopped being reviewed still shows.
  const back = hdUser({ [LAB12]: returned() });
  fresh(back);
  assert.equal(statusLine(moduleLab(1).view(back, HD), LAB12), 'Lab 1.1 returned for revision — see your instructor’s notes below.');
}

async function testModuleOneHasNoEvidenceLab() {
  const returnedLab11 = hdUser({ [LAB11]: returned() });
  for (const user of [hdUser(), returnedLab11]) {
    fresh(user);
    const html = moduleLab(1).view(user, HD);
    assert.doesNotMatch(html, /data-itsw-evidence-input|data-its-submit=|data-its-resubmit=|Not uploaded yet/, 'no evidence upload, Submit or Resubmit');
    // The one allowed mention: technology setup says there is no virtual machine to build.
    const words = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace('Every lab runs in the browser-based IT Service Desk simulator. There is nothing to install and no virtual machine to build.', '');
    assert.doesNotMatch(words, /sandbox|virtual machine|\bVM\b|lab login|lab-environment login|two logins/i, 'no other sandbox, VM or second login');
    assert.equal(counter(html, 'its01-status'), '3 labs · 0 practice complete · 0 passed', 'the counter has the guided lab, the practice tickets and the Prove It');
  }
}

async function testSharedWalkthroughModules() {
  for (let n = 3; n <= 11; n += 1) {
    const key = `its-${String(n).padStart(2, '0')}`;
    // Modules 2 (its-10), 3 (its-11), 5 (its-03), 6 (its-07), 7 (its-05),
    // 8 (its-06), 9 (its-04) and 10 (its-08) have their own pages now:
    // tests/hdesk-m02-page.test.js, tests/hdesk-m03-page.test.js,
    // tests/hdesk-m05-page.test.js, tests/hdesk-m06-page.test.js,
    // tests/hdesk-m07-page.test.js, tests/hdesk-m08-page.test.js,
    // tests/hdesk-m09-page.test.js and tests/hdesk-m10-page.test.js.
    if (key === 'its-10' || key === 'its-11' || key === 'its-03' || key === 'its-07' || key === 'its-05' || key === 'its-06' || key === 'its-04' || key === 'its-08') continue;
    // The page anchor follows the module's display number, not its key.
    const rail = `itss-lab-${String(HD.modules[key].number).padStart(2, '0')}`;
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
  moduleLab(9).view(user, HD);
  const work = { version: 1, tickets: [{ id: 'HD-2110', diagnosis: 'Broken domain trust', checkedSteps: ['Check event logs'] }] };
  await moduleLab(9).onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m09', student: studentOf(user), work }, origin: SIM });
  await settle();
  const html = moduleLab(9).view(user, HD);
  assert.match(statusLine(html, 'lab-its-09-security-incidents'), /^Lab submitted .+, waiting for instructor review$/);
  assert.doesNotMatch(html, /Lab complete/);
  const attempt = inserts('lab-its-09-security-incidents')[0].payload;
  assert.equal(attempt.rubric_version, 'it-support-practice-v1');
  assert.equal(attempt.scoring_engine_version, 'it-support-practice-capture-v1');
  assert.equal(attempt.result.work.tickets[0].diagnosis, 'Broken domain trust');
}

async function testDuplicateCoachCompletionMessageCreatesOneAttempt() {
  const user = hdUser();
  fresh(user);
  moduleLab(9).view(user, HD);
  const message = { data: { type: 'mnt-coach-complete', id: 'hd-m09', student: studentOf(user), work: { version: 1, tickets: [{ id: 'HD-2110' }] } }, origin: SIM };
  await Promise.all([moduleLab(9).onMessage(message), moduleLab(9).onMessage(message)]);
  await settle();
  assert.equal(inserts('lab-its-09-security-incidents').length, 1, 'rapid duplicate completion messages are guarded');
}

/* ------------------------------------------- walkthrough receipt replies */

// The simulator keeps a finished walkthrough's work until this page answers
// its completion message, so every message gets a reply naming its nonce.
function replyCatcher() {
  const replies = [];
  return { replies, source: { postMessage: (data, origin) => replies.push({ data, origin }) } };
}
// `student` defaults to the signed-in student's launch id, as the simulator sends it.
// Module 1 saves only a finished HD-2150 (resolved, every outcome met;
// tests/hdesk-m01-guided-lab.test.js covers that rule).
const M01_FINISHED_WORK = { version: 1, tickets: [{ id: 'HD-2150', status: 'Resolved', console: {
  outcomes: { verified: true, unlocked: true, confirmed: true, comment: true, note: true, code: true } } }] };
// Module 4's Lab 4.3 counts only finished work: HD-2134 resolved.
const M02_FINISHED_WORK = { version: 1, tickets: [{ id: 'HD-2134', status: 'Resolved' }] };
const finishMessage = (id, source, student = signedIn ? studentOf(signedIn) : '') => ({ data: { type: 'mnt-coach-complete', id, nonce: 'n-1', student, work: id === 'hd-m01' ? M01_FINISHED_WORK : id === 'hd-m02' ? M02_FINISHED_WORK : { version: 1, tickets: [{ id: 'HD-2110' }] } }, origin: SIM, source });

// Module 4 (key its-02): each lab saves its own record, only for finished work.
async function testModuleFourLabRecords() {
  const user = hdUser();
  fresh(user);
  const before = ctx.supabaseCalls.length;
  const inserts = (labKey) => ctx.supabaseCalls.slice(before).filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && (!labKey || c.payload.lab_key === labKey));
  moduleLab(2).view(user, HD);
  let reply = replyCatcher();
  await moduleLab(2).onMessage(finishMessage('hd-m02', reply.source));
  await settle();
  assert.deepEqual([...inserts().map((c) => c.payload.lab_key)], [LAB23], 'Lab 4.3 only');
  assert.equal(reply.replies[0].data.saved, true);
  // Unfinished VM work: no record.
  reply = replyCatcher();
  await moduleLab(2).onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m02-vm', nonce: 'n-2', student: studentOf(user), work: { version: 1, tickets: [], vm: { version: 1, vms: [] } } }, origin: SIM, source: reply.source });
  await settle();
  assert.deepEqual([reply.replies[0].data.saved, reply.replies[0].data.reason], [false, 'incomplete']);
  assert.equal(inserts(LAB21).length, 0);
  // Lab 4.4: the four practice tickets, once.
  const practice = (tickets, nonce) => { const r = replyCatcher(); return moduleLab(2).onMessage({ data: { type: 'mnt-practice-complete', id: 'its-02', nonce, student: studentOf(user), tickets }, origin: SIM, source: r.source }).then(() => r); };
  reply = await practice(['HD-2169', 'HD-2170'], 'p-1');
  assert.deepEqual([reply.replies[0].data.saved, reply.replies[0].data.reason], [false, 'incomplete']);
  assert.equal(inserts(LAB24).length, 0);
  reply = await practice(['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'], 'p-2');
  await settle();
  assert.equal(reply.replies[0].data.saved, true);
  assert.equal(inserts(LAB24).length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(inserts(LAB24)[0].payload.result)), { source: 'mnt-practice-complete', practiceSet: 'its-02', tickets: ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'] }, 'no answers, no score');
  // A failed save: not saved, nothing marked.
  const other = hdUser();
  fresh(other);
  ctx.supabaseResponder = failInserts;
  moduleLab(2).view(other, HD);
  const failed = replyCatcher();
  await moduleLab(2).onMessage({ data: { type: 'mnt-practice-complete', id: 'its-02', nonce: 'p-3', student: studentOf(other), tickets: ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'] }, origin: SIM, source: failed.source });
  await settle();
  assert.deepEqual([failed.replies[0].data.saved, failed.replies[0].data.reason], [false, 'save-failed']);
  assert.equal(completion(other, 'its-02', LAB24, 'its02-lab-state-v1').labMarked, false);
}

async function testReceiptSavedAfterSubmit() {
  const user = hdUser();
  fresh(user);
  moduleLab(9).view(user, HD);
  const { replies, source } = replyCatcher();
  await moduleLab(9).onMessage(finishMessage('hd-m09', source));
  await settle();
  assert.equal(inserts('lab-its-09-security-incidents').length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(replies)), [{ data: { type: 'mnt-coach-received', id: 'hd-m09', nonce: 'n-1', saved: true }, origin: SIM }]);
}

async function testReceiptNotSavedWhenSignedOut() {
  fresh(null);
  const { replies, source } = replyCatcher();
  await moduleLab(9).onMessage(finishMessage('hd-m09', source));
  await moduleLab(1).onMessage(finishMessage('hd-m01', source));
  await settle();
  assert.equal(inserts().length, 0);
  assert.deepEqual(replies.map((r) => [r.data.id, r.data.saved]), [['hd-m09', false], ['hd-m01', false]]);
}

async function testReceiptNotSavedWhenSaveFails() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  moduleLab(2).view(user, HD);
  const { replies, source } = replyCatcher();
  await moduleLab(2).onMessage(finishMessage('hd-m02', source));
  await settle();
  assert.deepEqual(replies.map((r) => r.data.saved), [false]);
}

async function testReceiptSavedWhenLabAlreadyWaiting() {
  const user = hdUser({ 'lab-its-09-security-incidents': waiting() });
  fresh(user);
  moduleLab(9).view(user, HD);
  const { replies, source } = replyCatcher();
  await moduleLab(9).onMessage(finishMessage('hd-m09', source));
  await settle();
  assert.equal(inserts().length, 0, 'a waiting lab takes no new attempt');
  assert.deepEqual(replies.map((r) => r.data.saved), [true], 'nothing left to save counts as received');
}

// A walkthrough lab counts as complete (local engagement, the module's
// consoleCompleted flag, and the verified-progress refresh that
// markModuleLabComplete can trigger) only once the portal has its attempt.
// Module 11 (key its-09) is the example of the shared walkthrough page.
const LAB09 = 'lab-its-09-security-incidents';
function completion(user, moduleKey, labKey, stateId) {
  const completedLabs = run('loadModuleEngagement')(user).completedLabs;
  return {
    labMarked: completedLabs.includes(run('moduleLabEngagementId')('it-support', moduleKey, labKey)),
    consoleCompleted: LabRuntime.load(stateId, user, {}).consoleCompleted === true,
    progressRefreshed: ctx.supabaseCalls.some((c) => c.table === 'student_verified_module_progress'),
  };
}
const failInserts = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });

async function testFailedSaveMarksNothingComplete() {
  for (const [n, coach, moduleKey, labKey, stateId] of [
    [9, 'hd-m09', 'its-09', LAB09, 'its-coach-its-09-v1'],
    [1, 'hd-m01', 'its-01', LAB12, 'its01-lms-validation-v1'],
    [2, 'hd-m02', 'its-02', LAB23, 'its02-lab-state-v1'],
  ]) {
    const user = hdUser();
    fresh(user);
    ctx.supabaseResponder = failInserts;
    moduleLab(n).view(user, HD);
    await moduleLab(n).onMessage(finishMessage(coach, replyCatcher().source));
    await settle();
    assert.deepEqual({ ...completion(user, moduleKey, labKey, stateId) }, { labMarked: false, consoleCompleted: false, progressRefreshed: false }, `Module ${n}`);
  }
}

async function testSuccessfulSaveMarksLabComplete() {
  const user = hdUser();
  fresh(user);
  moduleLab(9).view(user, HD);
  await moduleLab(9).onMessage(finishMessage('hd-m09', replyCatcher().source));
  await settle();
  const state = completion(user, 'its-09', LAB09, 'its-coach-its-09-v1');
  assert.equal(state.labMarked, true);
  assert.equal(state.consoleCompleted, true);
}

async function testAlreadyWaitingLabStillCountsComplete() {
  const user = hdUser({ [LAB09]: waiting() });
  fresh(user);
  moduleLab(9).view(user, HD);
  await moduleLab(9).onMessage(finishMessage('hd-m09', replyCatcher().source));
  await settle();
  assert.equal(inserts().length, 0);
  const state = completion(user, 'its-09', LAB09, 'its-coach-its-09-v1');
  assert.equal(state.labMarked, true);
  assert.equal(state.consoleCompleted, true);
}

// Finished work is saved only for the student whose launch opened it: if
// student B signs in on the course page before A's simulator finishes, A's
// work must not become B's attempt.
async function testMismatchedStudentSavesNothing() {
  const studentA = hdUser();
  const studentB = { ...hdUser(), userId: 'user-hdesk-b', email: 'hdesk-b@test.invalid' };
  for (const [n, coach] of [[9, 'hd-m09'], [1, 'hd-m01'], [2, 'hd-m02']]) {
    fresh(studentB);
    moduleLab(n).view(studentB, HD);
    const { replies, source } = replyCatcher();
    await moduleLab(n).onMessage(finishMessage(coach, source, studentOf(studentA)));
    await settle();
    assert.equal(inserts().length, 0, `Module ${n}: nothing saved for B`);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'other-student']], `Module ${n}`);
    assert.equal(run('loadModuleEngagement')(studentB).completedLabs.length, 0, `Module ${n}: nothing marked complete for B`);
  }
}

async function testMissingStudentSavesNothing() {
  const user = hdUser();
  for (const student of ['', undefined]) {
    fresh(user);
    moduleLab(9).view(user, HD);
    const { replies, source } = replyCatcher();
    const message = finishMessage('hd-m09', source);
    if (student === undefined) delete message.data.student; else message.data.student = student;
    await moduleLab(9).onMessage(message);
    await settle();
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'no-student']]);
  }
}

async function testMatchingStudentSaves() {
  const user = hdUser();
  fresh(user);
  moduleLab(9).view(user, HD);
  const { replies, source } = replyCatcher();
  await moduleLab(9).onMessage(finishMessage('hd-m09', source, studentOf(user)));
  await settle();
  assert.equal(inserts('lab-its-09-security-incidents').length, 1);
  assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[true, undefined]]);
}

// The id is a hash of the sign-in, never the email or a piece of it.
function testStudentIdIsNeverTheEmail() {
  for (const email of ['hdesk@test.invalid', 'jane.doe@school.example']) {
    const id = studentOf({ email });
    assert.match(id, /^student-[0-9a-z]+$/, id);
    assert.ok(!id.includes(email) && !id.includes(email.split('@')[0]) && !id.includes('@'), id);
  }
  assert.notEqual(studentOf({ email: 'a@test.invalid' }), studentOf({ email: 'b@test.invalid' }), 'different students, different ids');
}

// Walkthrough links name the student by the anonymous hash, never the email.
function testLaunchLinksNameTheStudent() {
  const user = hdUser();
  fresh(user);
  const student = run('LabRuntime').anonymousStudentId(user);
  assert.match(student, /^student-/);
  for (const [n, coach] of [[1, 'hd-m01'], [2, 'hd-m02'], [3, 'hd-m03'], [9, 'hd-m09'], [11, 'hd-m11']]) {
    const html = moduleLab(n).view(user, HD);
    // coach=hd-m02& exactly: Module 4 also links hd-m02-vm and hd-m02-server.
    const href = (new RegExp(`href="([^"]*coach=${coach}&[^"]*)"`).exec(html) || [])[1];
    assert.ok(href, `Module ${n}: walkthrough link`);
    assert.ok(href.includes(`coach=${coach}&amp;restart=1&amp;student=${student}#/helpdesk/tickets`), `Module ${n}: ${href}`);
    assert.ok(!href.includes('hdesk%40') && !href.includes('hdesk@'), `Module ${n}: no email in the link`);
  }
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
    [1, 'hd-m01', 'its01-lab-1-2', 'lab-its-01-ticket-triage', 'its01-lab-1-2', 'Start Lab 1.1 walkthrough'],
    [2, 'hd-m02', 'its02-lab-2-3', LAB23, 'its02-lab-2-3', 'Start Lab 4.3 walkthrough'],
    // Modules 6 (its-07) and 10 (its-08) have their own pages now; Module 11
    // (key its-09) is the example of the shared walkthrough page.
    [9, 'hd-m09', null, run('LABS').find((l) => l.module === 'its-09').key, 'itss-lab-11', 'Start guided walkthrough'],
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
  const user = hdUser({ 'lab-its-09-security-incidents': waiting() });
  fresh(user);
  returnLink('hd-m09');
  try {
    const html = moduleLab(9).view(user, HD);
    assert.equal(notice(html, 'hd-m09'), '');
    assert.match(statusLine(html, 'lab-its-09-security-incidents'), /waiting for instructor review/);
  } finally {
    returnLink(null);
  }
}

async function testBlockedPopupShowsMessage() {
  const user = hdUser();
  fresh(user);
  let html = moduleLab(9).view(user, HD);
  assert.equal(notice(html, 'hd-m09'), '', 'no message before Start is pressed');

  let prevented = false;
  run('window.open = () => null');
  const opened = run('itsLaunchWalkthrough')({ preventDefault() { prevented = true; } }, { href: 'http://127.0.0.1:8767/?coach=hd-m03' }, user, 'hd-m09');
  assert.equal(opened, false);
  assert.equal(prevented, true, 'the link does not also navigate this tab');
  html = moduleLab(9).view(user, HD);
  assert.equal(notice(html, 'hd-m09'), BLOCKED);
  assert.equal(inserts().length, 0);

  // Allowed on the next try: the message goes away.
  const opens = [];
  ctx.__opens = opens;
  run('window.open = (...args) => { __opens.push(args); return {}; }');
  assert.equal(run('itsLaunchWalkthrough')({ preventDefault() {} }, { href: 'http://127.0.0.1:8767/?coach=hd-m03' }, user, 'hd-m09'), true);
  assert.equal(opens.length, 1);
  assert.equal(opens[0][0], 'http://127.0.0.1:8767/?coach=hd-m03');
  html = moduleLab(9).view(user, HD);
  assert.equal(notice(html, 'hd-m09'), '');
}

(async () => {
  const tests = [
    testModuleTwoClearedStorageShowsDatabaseStatus,
    testModuleTwoLocalFlagsAloneAreNotSubmitted,
    testModuleTwoReturnedLab,
    testEvidenceUploadNeverCompletes,
    testEvidenceSubmitFailure,
    testModuleOneClearedStorage,
    testModuleOneHasNoEvidenceLab,
    testSharedWalkthroughModules,
    testWalkthroughCompletionShowsWaiting,
    testDuplicateCoachCompletionMessageCreatesOneAttempt,
    testReceiptSavedAfterSubmit,
    testReceiptNotSavedWhenSignedOut,
    testReceiptNotSavedWhenSaveFails,
    testReceiptSavedWhenLabAlreadyWaiting,
    testFailedSaveMarksNothingComplete,
    testSuccessfulSaveMarksLabComplete,
    testAlreadyWaitingLabStillCountsComplete,
    testMismatchedStudentSavesNothing,
    testMissingStudentSavesNothing,
    testMatchingStudentSaves,
    testStudentIdIsNeverTheEmail,
    testLaunchLinksNameTheStudent,
    testReturnLinkRecordsNothing,
    testBlockedPopupShowsMessage,
    testModuleFourLabRecords,
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

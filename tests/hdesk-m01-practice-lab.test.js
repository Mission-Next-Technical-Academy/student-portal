// Help Desk Module 1, Lab 1.2: the practice tickets (HD-2151, HD-2152,
// SEC-2153) as a Practice It lab, key lab-its-01-practice-tickets. Not graded,
// no score. The simulator reports when all three are closed
// (tests/hdesk-m01-practice-tickets.test.js covers that side); the course page
// saves one completion record. The old Lab 1.1 (LMS & Environment
// Validation, lab-its-01-lms-validation) is retired: off the lab lists, its
// past attempts still readable. The guided lab now shows as Lab 1.1.
//
//   - The catalogue: the new lab (15 minutes, ITHD-101.1), the retired one
//     (no minutes, no allocation), the visible numbers.
//   - The Module 1 page: section, launch link, status line, rail, hero.
//   - The completion message: saved once, only for the right student, the
//     right origin and all three tickets; every message answered.
//   - The instructor sheets: the new completion sheet, the old evidence sheet.
//
// The portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
const moduleOne = () => run(`MODULE_LABS['it-support/1']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));

const PRACTICE = 'lab-its-01-practice-tickets';
const GUIDED = 'lab-its-01-ticket-triage';
const RETIRED = 'lab-its-01-lms-validation';
const PROVE = 'lab-its-01-prove-it';
const TICKETS = ['HD-2151', 'HD-2152', 'SEC-2153'];

function hdUser(attempts = {}) {
  return {
    userId: 'user-m01p', email: 'm01p@test.invalid', trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  signedIn = user;
}
const inserts = () => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert');
function replyCatcher() {
  const replies = [];
  return { replies, source: { postMessage: (data, origin) => replies.push(copy({ data, origin })) } };
}
const completion = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1' } = {}) => ({
  data: { type: 'mnt-practice-complete', id: 'its-01', nonce, student, tickets }, origin, source,
});
function statusLine(html, labKey) {
  const match = new RegExp(`data-its-lab-status="${labKey}"[^>]*>[\\s\\S]*?<span>([\\s\\S]*?)</span>`).exec(html);
  assert.ok(match, `a status line for ${labKey}`);
  return match[1];
}
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { ticked: match[1].includes('mnav-chip-complete'), locked: match[1].includes('mnav-chip-locked'), text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
}
const percent = (html) => Number((/class="munified-percent">(\d+)%/.exec(html) || [])[1]);
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const labs = copy(run('programLabs')(HD).filter((lab) => lab.module === 'its-01').map((lab) => [lab.key, lab.title, lab.instructionalMinutes, lab.phase || '', lab.parentAllocations]));
  assert.deepEqual(labs, [
    // In course order, so the program page lists Lab 1.1 before Lab 1.2.
    [GUIDED, 'Lab 1.1 · Guided Lab: A Day in the Life of an L1 Technician', 25, 'practice', [{ code: 'ITHD-101.1', minutes: 25 }]],
    [PRACTICE, 'Lab 1.2 · Practice tickets (not graded)', 15, 'practice', [{ code: 'ITHD-101.1', minutes: 15 }]],
    [PROVE, 'Prove It: Independent Ticket', 20, '', [{ code: 'ITHD-101.1', minutes: 20 }]],
  ]);
  // Module 1's 60 lab minutes under ITHD-101.1 are unchanged.
  assert.equal(labs.reduce((total, lab) => total + lab[2], 0), 60);
  const retired = copy(run('LABS').find((lab) => lab.key === RETIRED));
  assert.deepEqual([retired.title, retired.module, retired.retired, retired.instructionalMinutes, retired.parentAllocations], ['LMS & Environment Validation', 'its-01', true, 0, []]);
  // Lookups by key still work for past attempts.
  assert.equal(run('itsLabTitle')(RETIRED), 'LMS & Environment Validation');
  // The practice tickets have no course_module_labs row and gate nothing.
  const migrations = fs.readdirSync(path.join(__dirname, '..', 'supabase', 'migrations')).map((name) => fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', name), 'utf8')).join('\n');
  assert.ok(!migrations.includes(PRACTICE), 'no migration names the practice tickets');
  assert.deepEqual([...run('moduleRequiredLabKeys')(HD, 'its-01', { requiredLabsByModuleKey: null })], [PROVE]);
}

// The program page's Module 1 card describes the module as it is now: no lab
// environment, no five-step mindset. Lesson titles and minutes unchanged.
function testModuleOneCardText() {
  const module = HD.modules['its-01'];
  assert.match(module.summary, /^Start with orientation, then learn what a Tier 1 technician does, the CompTIA troubleshooting method, how to verify a caller with KB-0024, how to search the knowledge base and how to write Reported \/ Tried \/ Result notes\. Practice in Lab 1\.1 · Guided Lab and Lab 1\.2 · Practice tickets, then work a new ticket on your own in the Prove It\.$/);
  assert.deepEqual(copy(module.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes])), [
    ['its-01-lesson-01', 'Program Orientation, LMS Navigation & Professional Conduct', 60],
    ['its-01-lesson-02', 'The Help Desk Role: Workflow & the Troubleshooting Mindset', 60],
  ]);
  assert.deepEqual([module.durationMinutes, module.creditMinutes], [180, 180]);
  const user = hdUser();
  fresh(user);
  const card = run('moduleCard')(HD, 'its-01', user).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  assert.match(card, /Get oriented: how the program runs/);
  assert.match(card, /Three readings: what a Tier 1 technician does/);
  assert.doesNotMatch(card, /lab environment|five-step|lab-environment|evidence-upload|two-login/i, 'nothing on the card describes the old Module 1');
  // Nor anywhere else in Module 1's lesson records.
  module.curriculumItems.forEach((item) => ['objective', 'learn', 'practice', 'prove'].forEach((field) => assert.doesNotMatch(item[field], /lab environment|five-step|evidence|two-login|sandbox/i, `${item.key} ${field}`)));
}

// A returned old Lab 1.1 attempt opens no redo notice: there is nothing on the
// page to redo it with (fetchUserDetails skips retired labs).
function testRetiredLabOpensNoRedo() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'app.js'), 'utf8');
  assert.match(source, /if \(!lab \|\| lab\.retired === true\) return;\s*\n\s*openLabRedosByModuleKey\[lab\.module\] = \{/);
}

/* ----------------------------------------------------------- the page */

function testPageBeforeCompletion() {
  const user = hdUser();
  fresh(user);
  const html = moduleOne().view(user, HD);
  assert.match(html, /<h2 id="its01-practice-tickets-title">Lab 1\.2 · Practice tickets \(not graded\)<\/h2>/);
  assert.match(html, /<h2 id="its01-lab-1-2-title">Lab 1\.1 · Guided Lab: A Day in the Life of an L1 Technician<\/h2>/);
  assert.match(html, /data-its01-practice-launch[^>]*target="_blank" rel="opener"/, 'opened with an opener, so the simulator can report back');
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: resolve or escalate each one.');
  assert.match(html, /Finish all three tickets: resolve or escalate each one\. The simulator then tells this page/);
  assert.doesNotMatch(html.replace(/<[^>]+>/g, ' '), /closed all three|Close all three/i, 'ServiceNow\'s Closed state is taught in Module 2');
  assert.match(html, /Start Lab 1\.1 walkthrough/);
  assert.equal((/id="its01-status">([^<]*)</.exec(html) || [])[1], '3 labs · 0 practice complete · 0 passed');
  assert.equal(railRow(html, 'its01-lab-1-2').text, 'Lab 1.1 · Guided Lab');
  const row = railRow(html, 'its01-practice-tickets');
  assert.equal(row.text, 'Lab 1.2 · Practice tickets');
  assert.equal(row.locked, false, 'the practice tickets open at any time');
  // Guided lab before practice tickets, both before the Prove It.
  assert.ok(html.indexOf('id="its01-lab-1-2"') < html.indexOf('id="its01-practice-tickets"'));
  assert.ok(html.indexOf('id="its01-practice-tickets"') < html.indexOf('id="its01-prove-it"'));
  assert.doesNotMatch(html, /LMS &amp; Environment Validation|Guided Lab 1\b|Lab 1\.2 walkthrough/);
}

function testPageAfterCompletion() {
  const without = hdUser();
  fresh(without);
  const before = percent(moduleOne().view(without, HD));
  const user = hdUser({ [PRACTICE]: { completedAt: new Date().toISOString(), reviewedAt: null, redoRequested: false, supersededAt: null } });
  fresh(user);
  const html = moduleOne().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 1.2: Practice complete (not graded) · ${DAY}`);
  assert.equal(railRow(html, 'its01-practice-tickets').ticked, true);
  assert.ok(percent(html) > before, `the rail percent counts Lab 1.2 (${before}% → ${percent(html)}%)`);
  assert.equal((/id="its01-status">([^<]*)</.exec(html) || [])[1], '3 labs · 1 practice complete · 0 passed');
  assert.doesNotMatch(html, /waiting for instructor review|In review/);
}

/* -------------------------------------------------- the completion message */

async function testCompletionSavedOnce() {
  const user = hdUser();
  fresh(user);
  moduleOne().view(user, HD);
  const { replies, source } = replyCatcher();
  await moduleOne().onMessage(completion(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-01', tickets: TICKETS }, 'completion and ticket ids only: no answers');
  assert.ok(row.completed_at, 'the time is saved');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-01', nonce: 'p-1', saved: true }, origin: SIM }]);
  assert.equal(statusLine(moduleOne().view(user, HD), PRACTICE), `Lab 1.2: Practice complete (not graded) · ${DAY}`);
  // Again (a second tab, a retry): answered as saved, nothing inserted.
  await moduleOne().onMessage(completion(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1);
  assert.deepEqual(replies[1].data, { type: 'mnt-practice-received', id: 'its-01', nonce: 'p-2', saved: true });
}

async function testCompletionRefused() {
  const cases = [
    ['signed out', () => { signedIn = null; }, {}, 'signed-out'],
    ['another student', () => {}, { student: 'student-someoneelse' }, 'other-student'],
    ['no student', () => {}, { student: '' }, 'no-student'],
    ['two tickets', () => {}, { tickets: ['HD-2151', 'HD-2152'] }, 'incomplete'],
    ['a wrong ticket', () => {}, { tickets: ['HD-2151', 'HD-2152', 'HD-2150'] }, 'incomplete'],
    ['not a list', () => {}, { tickets: 'HD-2151,HD-2152,SEC-2153' }, 'incomplete'],
  ];
  for (const [name, setup, fields, reason] of cases) {
    const user = hdUser();
    fresh(user);
    const message = completion(replyCatcher().source, fields);
    const { replies, source } = replyCatcher();
    message.source = source;
    setup();
    await moduleOne().onMessage(message);
    assert.equal(inserts().length, 0, name);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, reason]], name);
  }
  // Another origin: ignored, no reply.
  const user = hdUser();
  fresh(user);
  const { replies, source } = replyCatcher();
  await moduleOne().onMessage(completion(source, { origin: 'https://elsewhere.test' }));
  assert.equal(inserts().length, 0);
  assert.equal(replies.length, 0);
  // Another practice set or message type: ignored.
  await moduleOne().onMessage({ ...completion(source), data: { ...completion(source).data, id: 'its-02' } });
  assert.equal(inserts().length, 0);
}

// Another course page tab may already have saved (the database has the row)
// or be saving now (the lock): either way, no second record.
async function testCompletionNeverSavedTwiceAcrossTabs() {
  const isRead = (call) => call.table === 'lab_attempts' && call.op === 'select' && call.filters.lab_key === PRACTICE;
  // Saved by another tab: answered as saved, the page shows it, no insert.
  let user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (isRead(call) ? { data: [{ completed_at: '2026-11-10T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  let catcher = replyCatcher();
  await moduleOne().onMessage(completion(catcher.source));
  assert.equal(inserts().length, 0);
  assert.equal(ctx.supabaseCalls.filter(isRead)[0].filters.user_id, 'user-m01p', 'reads only this student\'s rows');
  assert.deepEqual(catcher.replies.map((r) => [r.data.saved, r.data.reason]), [[true, undefined]]);
  assert.match(statusLine(moduleOne().view(user, HD), PRACTICE), /^Lab 1\.2: Practice complete \(not graded\)/);

  // Only a superseded (set aside, e.g. by a reset) or returned record: it
  // doesn't count, so the new work gets its own record.
  for (const old of [{ superseded_at: '2026-11-10T16:00:00Z' }, { redo_requested: true, reviewed_at: '2026-11-10T16:00:00Z' }]) {
    user = hdUser();
    fresh(user);
    ctx.supabaseResponder = (call) => (isRead(call) ? { data: [{ completed_at: '2026-11-10T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null, ...old }], error: null } : { data: null, error: null });
    catcher = replyCatcher();
    await moduleOne().onMessage(completion(catcher.source));
    assert.equal(inserts().length, 1, `a new record over ${JSON.stringify(old)}`);
    assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  }

  // Being saved by another tab right now: busy, no insert; the simulator
  // offers a retry. A lock older than 15 seconds no longer holds.
  const lock = `mnt.practice-save.user-m01p.${PRACTICE}`;
  user = hdUser();
  fresh(user);
  ctx.localStorage.setItem(lock, String(Date.now()));
  catcher = replyCatcher();
  await moduleOne().onMessage(completion(catcher.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'busy']]);
  ctx.localStorage.setItem(lock, String(Date.now() - 16000));
  catcher = replyCatcher();
  await moduleOne().onMessage(completion(catcher.source));
  assert.equal(inserts().length, 1);
  assert.equal(ctx.localStorage.getItem(lock), null, 'the lock is released');

  // The read failed: nothing inserted, not saved.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (isRead(call) ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  catcher = replyCatcher();
  const logged = console.error;
  console.error = () => {};
  try { await moduleOne().onMessage(completion(catcher.source)); } finally { console.error = logged; }
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  assert.equal(ctx.localStorage.getItem(lock), null, 'the lock is released after a failure');
}

async function testCompletionSaveFails() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  const { replies, source } = replyCatcher();
  const logged = console.error;
  console.error = () => {};
  try { await moduleOne().onMessage(completion(source)); } finally { console.error = logged; }
  assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  assert.equal(statusLine(moduleOne().view(user, HD), PRACTICE), 'Finish all three tickets: resolve or escalate each one.', 'nothing shows as complete');
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'the practice tickets have a sheet');
  const row = { id: 'm01p-1', lab_key: PRACTICE, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-10T15:00:00Z', result: { source: 'mnt-practice-complete', practiceSet: 'its-01', tickets: TICKETS } };
  const html = sheet.render(row);
  assert.match(html, /Lab 1\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /Practice completion/);
  assert.match(html, /HD-2151, HD-2152, SEC-2153/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.match(html, /Tickets finished/);
  assert.doesNotMatch(html, /Tickets closed|closed every/);
  // The old Lab 1.1 sheet is unchanged: title, evidence files, policy.
  assert.ok(sheet.has({ lab_key: RETIRED }));
  const old = sheet.render({ id: 'm01-old', lab_key: RETIRED, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-10-20T15:00:00Z',
    result: { aup: true, evidence_files: [{ field: 'evidence1', name: 'desk.png', size: 2048 }, { field: 'evidence2', name: 'lms.png', size: 2048 }] } });
  assert.match(old, /LMS &amp; Environment Validation|LMS & Environment Validation/);
  assert.match(old, /Sandbox desktop screenshot/);
  assert.match(old, /desk\.png/);
  assert.match(old, /Acceptable Use Policy/);
  // Lab Attempts files old attempts under Module 1, Practice It, as before.
  const meta = copy(run('adminGradingLabMeta')({ lab_key: RETIRED, track_code: 'HDESK' }));
  assert.deepEqual([meta.moduleKey, meta.kind], ['its-01', 'PRACTICE IT']);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'never in the review queue');
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testModuleOneCardText, testRetiredLabOpensNoRedo, testPageBeforeCompletion, testPageAfterCompletion, testCompletionSavedOnce, testCompletionRefused, testCompletionNeverSavedTwiceAcrossTabs, testCompletionSaveFails, testInstructorSheets];
  for (const test of tests) await test();
  console.log(`hdesk-m01-practice-lab: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

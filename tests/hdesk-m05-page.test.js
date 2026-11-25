// Help Desk Module 5 (key its-03) course page, portal/it-support-module-03.js,
// on the Module 1 and 3 page pattern:
//
//   - The catalogue: Lab 5.1 (25 min), Lab 5.2 (15 min, Practice It) and the
//     Prove It (20 min) from the old 60-minute lab; 180 minutes in all,
//     ITHD-101.4. Since the Prove It part (2026-11-24) the Prove It gates
//     Module 5, and Labs 5.1 and 5.2 are Practice It.
//   - The page: shown as Module 5 in week 3, two lessons (5.1 and 5.2) holding
//     three readings, the toolbox table, three diagrams and the added
//     sentences; no "lab VM", "Module 3", "The Blank Desktop" or HD-2109.
//   - The A+ check: choices in data order (the right answers at B, C, A, D);
//     a wrong pick shows only its If wrong line; 3 of 4 first picks right
//     saves "complete" to the case state; 2 of 4 doesn't; a failed save takes
//     the tick off again.
//   - Lab 5.1: the coach's Finish saves an attempt only when HD-2180 is
//     resolved.
//   - Lab 5.2: the practice set's message saves one completion record.
//   - The Prove It card opens the simulator shift (?prove=its-03).
//   - The instructor sheets: the new lab labels and the Lab 5.2 sheet.
//
// The portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
ctx.render = () => {};
let signedIn = null;
ctx.currentUser = async () => signedIn;

const SIM = new URL(run('SIM_ORIGIN')).origin;
const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const page = () => run(`MODULE_LABS['it-support/5']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its03-page-v1';
const GUIDED = 'lab-its-03-blank-desktop';
const PRACTICE = 'lab-its-03-practice-tickets';
const PROVE = 'lab-its-03-prove-it';
const TICKETS = ['HD-2181', 'HD-2182', 'HD-2183', 'HD-2186'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function hdUser(attempts = {}, name = 'm05page') {
  return {
    userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run('itsUnrecordedWalkthroughs.clear(); itsBlockedWalkthroughs.clear(); itsIncompleteWalkthroughs.clear()');
  run('its03CheckAnswers = {}; its03CheckPicks = {}; its03CheckSaveFailed = false');
  signedIn = user;
}
const inserts = (labKey) => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && (!labKey || c.payload.lab_key === labKey));
function replyCatcher() {
  const replies = [];
  return { replies, source: { postMessage: (data, origin) => replies.push(copy({ data, origin })) } };
}
async function quiet(fn) {
  const original = ctx.console.error;
  ctx.console.error = () => {};
  try { return await fn(); } finally { ctx.console.error = original; }
}
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 8; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}
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
const section = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `section ${id}`);
  return html.slice(start, html.indexOf('</section>', start));
};
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const submitted = (at = '2026-11-24T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-03'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [5, 3, 180, 2, 3]);
  assert.equal(m.title, 'Windows Operating System Support', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes])), [
    ['its-03-lesson-01', 'Navigation, User Profiles, Local Accounts & Support Utilities', 60],
    ['its-03-lesson-02', 'Boot & Performance Troubleshooting, Command-Line Tools & Cross-Platform Awareness', 60],
  ], 'the filed lesson keys, titles and minutes');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-03'));
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null]), [
    [GUIDED, 'Lab 5.1 · Guided Lab: the slow-computer sequence and system repair', 25, 'practice'],
    [PRACTICE, 'Lab 5.2 · Practice tickets (not graded)', 15, 'practice'],
    [PROVE, 'Prove It: Independent Ticket', 20, null],
  ]);
  labs.forEach((l) => assert.deepEqual(l.parentAllocations.map((a) => [a.code, a.minutes]), [['ITHD-101.4', l.instructionalMinutes]], `${l.key} allocates to ITHD-101.4`));
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 180, 'lessons and labs still total 180');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective) });
  assert.doesNotMatch(text, /HD-2109|Blank Desktop|lab VM|Module 0?3\b/i, 'no catalogue text names the old lab');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its03-shell"/);
  assert.match(html, /Module 05 · 3 Hours · Week 3/, 'the hero shows Module 05, 180 minutes, week 3');
  const shown = words(html);
  // No old number, old title, old ticket or lab VM in anything a student sees.
  assert.doesNotMatch(shown, /Module 0?3\b|lab VM|The Blank Desktop|HD-2109/i);
  // A+ objective numbers from the 220-1201 exam.
  assert.match(shown, /A\+ Core 1: 5\.1 Troubleshoot .* 5\.2 Drives/);
  assert.deepEqual([...html.matchAll(/<strong>Lesson (5\.\d) · /g)].map((m) => m[1]), ['5.1', '5.2'], 'two lessons, 5.1 and 5.2');
  [1, 2, 3].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.equal((html.match(/<figure /g) || []).length, 3, 'three diagrams');
  ['Account or profile? One is the sign-in, the other is your stuff', 'The repair ladder: start on the lowest rung', 'Releasing a BitLocker recovery key: four steps, every time'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${esc(title).replace(/[?+]/g, '\\$&')}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  assert.equal((html.match(/<table class="its10-table"/g) || []).length, 1, 'the toolbox table');
  // Spec section 8.5's added sentences, in the readings.
  [
    'To measure a slow start, read Event ID 100 in Event Viewer’s Diagnostics-Performance log: it records how long the last boot took.',
    'KB-0084 has the full checklist, including what to do with a startup app that isn’t approved.',
    'To find a stored key, open Active Directory › Computers, find the computer by its name and open its BitLocker Recovery tab. You’ll do this once in the lab before you need it on a ticket.',
    'Check every startup app against the Software Catalog, the list of apps the company has approved.',
    'Tier 1 never asks a user to open the case.',
    'Hardware and drivers (Module 4)',
  ].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // Commands render as code, not as backticks.
  assert.match(html, /<code class="its03-code">sfc \/scannow<\/code>/);
  assert.match(html, /<code class="its03-code">chkdsk C: \/scan<\/code>/);
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  // No practice recovery Key ID on the page. (The guard in
  // tests/hdesk-m05-guided-lab.test.js keeps the Prove It's names, hashed,
  // out of every committed file, this page included.)
  assert.doesNotMatch(html, /8D41B6E0|3A7F9C21/);
  // The file the curriculum check reads: two lessons with the filed titles.
  const source = fs.readFileSync(path.join(ROOT, 'portal/it-support-module-03.js'), 'utf8');
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [['Navigation, User Profiles, Local Accounts & Support Utilities', 90], ['Boot & Performance Troubleshooting, Command-Line Tools & Cross-Platform Awareness', 90]]);
}

// No diagram line is wider than the box it sits in (0.56 em a character, the
// estimate the drawing code wraps with), and the two coloured boxes are drawn.
function testDiagramsFit() {
  for (const key of ['profile', 'ladder', 'bitlocker']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS03_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
    }
  }
  ['wide', 'narrow'].forEach((layout) => {
    assert.match(run(`ITS03_DIAGRAM_DRAW.ladder('${layout}')`), /its03-dg-tier2[\s\S]*Tier 2 decides|Tier 2 decides[\s\S]*its03-dg-tier2/, `ladder ${layout}: the Tier 2 step`);
    assert.match(run(`ITS03_DIAGRAM_DRAW.bitlocker('${layout}')`), /class="its01-dg-box its03-dg-warn"/, `bitlocker ${layout}: the red strip`);
  });
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its03-lab-5-1');
  assert.match(guided, /\?coach=hd-m03&amp;restart=1&amp;student=/, 'Lab 5.1 launches the hd-m03 coach');
  assert.match(guided, /Start Lab 5\.1 walkthrough/);
  assert.match(guided, /Feedback only, no score/);
  assert.match(guided, /Practice: not graded/, 'Lab 5.1 is Practice It');
  assert.doesNotMatch(guided, /Your instructor reviews/);
  const practice = section(html, 'its03-practice-tickets');
  assert.match(practice, /\?practice=its-03&amp;student=/, 'Lab 5.2 opens practice set its-03');
  assert.match(practice, /Practice: not graded/);
  assert.equal(statusLine(html, PRACTICE), 'Finish all four tickets: resolve each one, or escalate it with a note.');
  // The Prove It opens the simulator shift in a new tab that can message back.
  const prove = section(html, 'its03-prove-it');
  assert.doesNotMatch(prove, /Opens soon/);
  assert.match(prove, /data-its03-prove-launch href="[^"]*\?prove=its-03&amp;student=/, 'the Prove It card opens the simulator shift');
  assert.match(prove, /rel="opener"/);
  assert.match(prove, /Start the Prove It/);
  assert.match(prove, /Work Lab 5\.1, the guided lab, first/, 'Practice It first is recommended');
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-03-assessment-module/);
  ['its03-prove-it', 'its03-check', 'its03-practice-tickets', 'its03-lab-5-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));

  // Lab 5.1 is Practice It: a saved attempt reads Complete at once, with no
  // instructor review, and a Lab 5.1 done tick removes the "work it first" line.
  const saved = hdUser({ [GUIDED]: submitted() });
  fresh(saved);
  const savedHtml = page().view(saved, HD);
  assert.match(statusLine(savedHtml, GUIDED), /^Lab 5\.1: Complete · .+$/);
  assert.equal(railRow(savedHtml, 'its03-lab-5-1').ticked, true);
  assert.doesNotMatch(savedHtml, /waiting for instructor review/);
  assert.doesNotMatch(section(savedHtml, 'its03-prove-it'), /Work Lab 5\.1, the guided lab, first/);

  // The Prove It: submitted shows waiting and no launch link; returned
  // reopens; Practice It labs never block it.
  const proveWaiting = hdUser({ [PROVE]: submitted() });
  fresh(proveWaiting);
  const waitingCard = section(page().view(proveWaiting, HD), 'its03-prove-it');
  assert.match(statusLine(page().view(proveWaiting, HD), PROVE), /waiting for instructor review/);
  assert.doesNotMatch(waitingCard, /data-its03-prove-launch/, 'a submitted attempt has nothing left to open');
  const proveReturned = hdUser({ [PROVE]: { ...submitted(), reviewedAt: '2026-11-24T16:00:00Z', redoRequested: true } });
  fresh(proveReturned);
  assert.match(section(page().view(proveReturned, HD), 'its03-prove-it'), /Reopen the Prove It/);
}

/* ------------------------------------------------------------ A+ check */

const shownOrder = (html, q) => [...html.matchAll(new RegExp(`data-its03-answer data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, q) => [...html.matchAll(new RegExp(`data-its03-answer data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

// Spec section 8.1's order, the same for every student: the right answers sit
// at B, C, A and D.
function testChoicesInDataOrder() {
  const check = copy(run('ITS03_CHECK'));
  assert.deepEqual(check.questions.map((q) => q.answer), [1, 2, 0, 3]);
  assert.deepEqual(check.questions.map((q) => q.choices[q.answer]), [
    'Roll back or update that device’s driver',
    'The drive’s cables and the BIOS/UEFI boot order',
    'Back up the data immediately',
    'Overheating from dust or failed cooling',
  ]);
  for (const name of ['m05order1', 'm05order2', 'm05order3']) {
    const user = hdUser({}, name);
    fresh(user);
    const html = page().view(user, HD);
    check.questions.forEach((_, q) => {
      assert.deepEqual(shownOrder(html, q), [0, 1, 2, 3], `${name} question ${q + 1}: data order`);
      assert.deepEqual(shownLetters(html, q), ['A', 'B', 'C', 'D']);
    });
  }
}

function testAplusCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS03_CHECK'));
  assert.equal(check.title, 'A+ check');
  assert.equal(check.questions.length, 4);
  check.questions.forEach((q, i) => {
    assert.equal(q.choices.length, 4, `question ${i + 1} has four choices`);
    assert.equal(q.ifWrong[q.answer], null, `question ${i + 1}: no If wrong line on the answer`);
    q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `question ${i + 1} choice ${c}: an If wrong line`); });
    assert.ok(q.why, `question ${i + 1}: a Why line`);
  });
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const answer = run('its03Answer');
  const view = () => page().view(user, HD);

  // A wrong first pick shows its If wrong line only, never the Why, and marks
  // nothing but the student's own pick.
  answer(0, wrong(check.questions[0]));
  let html = view();
  assert.ok(html.includes(esc(check.questions[0].ifWrong[wrong(check.questions[0])])));
  assert.equal(check.questions[0].ifWrong.filter((line) => line && html.includes(esc(line))).length, 1);
  assert.ok(!html.includes(esc(check.questions[0].why)));
  assert.match(html, /Not quite\./);
  assert.doesNotMatch(section(html, 'its03-checks'), /is-answer/);
  // Then the right pick shows the Why.
  answer(0, check.questions[0].answer);
  assert.ok(view().includes(esc(check.questions[0].why)));

  // 1 wrong first pick + 3 right = 3 of 4: complete, saved to the case state.
  check.questions.slice(1).forEach((q, i) => answer(i + 1, q.answer));
  let saved = LabRuntime.load(STATE_ID, user, {});
  assert.equal(saved.checkCompleted, true);
  assert.ok(saved.checkCompletedAt);
  assert.deepEqual(Object.keys(saved).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([saved.score, saved.bestScore], [0, 0], 'no score saved');
  html = view();
  assert.match(html, /A\+ check complete/);
  assert.equal(railRow(html, 'its03-check').ticked, true);
  assert.equal(inserts().length, 0, 'the check saves no attempt');

  // 2 wrong first picks = 2 of 4: a retake, nothing saved. Signing in as
  // another student starts the check fresh.
  const other = hdUser({}, 'm05page2');
  ctx.localStorage.clear();
  signedIn = other;
  html = page().view(other, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./);
  answer(0, wrong(check.questions[0]));
  answer(1, wrong(check.questions[1]));
  check.questions.forEach((q, i) => answer(i, q.answer));
  saved = LabRuntime.load(STATE_ID, other, {});
  assert.notEqual(saved.checkCompleted, true);
  assert.match(page().view(other, HD), /Retake: you need 3 of 4/);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm05save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  copy(run('ITS03_CHECK')).questions.forEach((q, i) => run('its03Answer')(i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its03-check').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(html, /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its03-check-retry/);
  assert.equal(railRow(html, 'its03-check').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).checkCompleted, true);
  // Try again, and this time the save lands.
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-03' }], error: null });
  run('its03RetryCheckSave')();
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(html, /A\+ check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).checkCompleted, true);
}

/* ---------------------------------------------------------- Lab 5.1 save */

const labWork = (status = 'Resolved', id = 'HD-2180') => ({ version: 1, tickets: [
  { id, number: 'INC0010480', status, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' } } },
] });
const coachMessage = (source, work, student = studentOf(signedIn)) => ({ data: { type: 'mnt-coach-complete', id: 'hd-m03', nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved, the simulator hears why, and the page
  // asks the student to finish and resolve the ticket.
  for (const work of [labWork('In Progress'), labWork('New'), labWork('Resolved', 'HD-2109'), { version: 1, tickets: [] }]) {
    const user = hdUser();
    fresh(user);
    page().view(user, HD);
    const { replies, source } = replyCatcher();
    await page().onMessage(coachMessage(source, work));
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'incomplete']]);
    assert.match(section(page().view(user, HD), 'its03-lab-5-1'), /Finish every part of the ticket there, resolve it, then press Finish again\./);
  }

  // Another student's work, or another origin: nothing saved.
  let user = hdUser();
  fresh(user);
  let catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, labWork()), origin: 'https://elsewhere.test' });
  assert.equal(inserts().length, 0);

  // HD-2180 resolved: one Lab 5.1 attempt with the work, then the page shows
  // it complete (Practice It: no instructor review).
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 5.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
  assert.equal(row.result.work.tickets[0].id, 'HD-2180');
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  assert.match(statusLine(page().view(user, HD), GUIDED), /^Lab 5\.1: Complete · /);
  // Finishing again once it is saved sends nothing new.
  await page().onMessage(coachMessage(replyCatcher().source, labWork()));
  assert.equal(inserts().length, 1);

  // The save fails: not received, nothing shows submitted.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  catcher = replyCatcher();
  await quiet(() => page().onMessage(coachMessage(catcher.source, labWork())));
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [false]);
  assert.doesNotMatch(statusLine(page().view(user, HD), GUIDED), /submitted/);
}

/* ---------------------------------------------------------- Lab 5.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-03' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves the same tickets the simulator's set needs done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-03': \{ title:'Module 5 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-03 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-03', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-03', nonce: 'p-1', saved: true }, origin: SIM }]);
  let html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 5.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its03-practice-tickets').ticked, true);
  // Again: answered as saved, nothing inserted.
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1);

  // Already in the database (another browser saved it): shown, not saved twice.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: [{ completed_at: '2026-11-24T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  const known = replyCatcher();
  await page().onMessage(practiceMessage(known.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(known.replies.map((r) => r.data.saved), [true]);

  // Refused: wrong tickets (the two related dock tickets don't count),
  // another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['three tickets', { tickets: TICKETS.slice(0, 3) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2187'] }, 'incomplete'],
    ['a related ticket instead', { tickets: ['HD-2181', 'HD-2182', 'HD-2183', 'HD-2188'] }, 'incomplete'],
    ['another student', { student: 'student-someoneelse' }, 'other-student'],
    ['signed out', {}, 'signed-out', () => { signedIn = null; }],
  ]) {
    user = hdUser();
    fresh(user);
    const catcher = replyCatcher();
    const message = practiceMessage(catcher.source, fields);
    if (setup) setup();
    await page().onMessage(message);
    assert.equal(inserts().length, 0, name);
    assert.deepEqual(catcher.replies.map((r) => [r.data.saved, r.data.reason]), [[false, reason]], name);
  }
  // Module 4's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-02', tickets: ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'] }));
  await page().onMessage(practiceMessage(other.source, { origin: 'https://elsewhere.test' }));
  assert.equal(inserts().length, 0);
  assert.equal(other.replies.length, 0, 'another set or origin gets no reply from this page');

  // The save fails: not saved, nothing shows complete.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  const failed = replyCatcher();
  await quiet(() => page().onMessage(practiceMessage(failed.source)));
  assert.deepEqual(failed.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  html = page().view(user, HD);
  assert.doesNotMatch(statusLine(html, PRACTICE), /Complete/);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 5.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-24T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm05p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-03', tickets: TICKETS } });
  assert.match(html, /Module 05 · Lab 5\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2181, HD-2182, HD-2183, HD-2186/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 5.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), false, 'nor is Lab 5.1, since the Prove It gates the module');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PROVE, track_code: 'HDESK' }), true, 'the Prove It is');
  const guided = sheet.render({ ...base, id: 'm05g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 05 · Lab 5\.1 · Guided Lab: the slow-computer sequence and system repair/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m05-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testChoicesInDataOrder, testAplusCheck, testCheckSaveThatFails, testGuidedLabSave, testPracticeSave, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m05-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

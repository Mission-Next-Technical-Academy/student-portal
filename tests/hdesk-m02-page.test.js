// Help Desk Module 2 (key its-10) course page, portal/it-support-module-10.js,
// on Module 1's pattern:
//
//   - The catalogue: Lab 2.1 (35 min), Lab 2.2 (20 min, Practice It) and the
//     Prove It (20 min) from the old 75-minute lab; 210 minutes in all,
//     ITHD-101.2. Lab 2.1 still gates Module 2, so it isn't Practice It yet.
//   - The page: shown as Module 2, two lessons (2.1 and 2.2) holding three
//     readings, four reference tables, three diagrams; no "Module 10".
//   - The knowledge check: a wrong pick shows only its If wrong line; 4 of 5
//     first picks right saves "complete" to the case state; 3 of 5 doesn't.
//   - Lab 2.1: the coach's Finish saves an attempt only for finished work.
//   - Lab 2.2: the practice set's message saves one completion record.
//   - The Prove It card opens nothing yet.
//   - The instructor sheets: the new lab labels and the Lab 2.2 sheet.
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
const page = () => run(`MODULE_LABS['it-support/2']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));

const GUIDED = 'lab-its-10-priority-queue';
const PRACTICE = 'lab-its-10-practice-tickets';
const PROVE = 'lab-its-10-prove-it';
const TICKETS = ['HD-2155', 'HD-2156', 'HD-2157'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function hdUser(attempts = {}) {
  return {
    userId: 'user-m02page', email: 'm02page@test.invalid', trackCode: 'HDESK',
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
  signedIn = user;
}
const inserts = (labKey) => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && (!labKey || c.payload.lab_key === labKey));
function replyCatcher() {
  const replies = [];
  return { replies, source: { postMessage: (data, origin) => replies.push(copy({ data, origin })) } };
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
const submitted = (at = '2026-11-19T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-10'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [2, 1, 210, 2, 3]);
  const labs = copy(run('LABS').filter((l) => l.module === 'its-10'));
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null]), [
    [GUIDED, 'Lab 2.1 · Guided Lab: queue shift', 35, 'practice'],
    [PRACTICE, 'Lab 2.2 · Practice tickets', 20, 'practice'],
    [PROVE, 'Prove It: queue shift', 20, null],
  ]);
  labs.forEach((l) => assert.deepEqual(l.parentAllocations.map((a) => [a.code, a.minutes]), [['ITHD-101.2', l.instructionalMinutes]], `${l.key} allocates to ITHD-101.2`));
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 210, 'lessons and labs still total 210');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its10-shell"/);
  assert.match(html, /Module 02 · /, 'the hero shows Module 02');
  assert.doesNotMatch(words(html), /Module 10|Module 0?10\b|shift pilot|Overview tab/i, 'no old number or plan label a student sees');
  assert.doesNotMatch(words(html), /payroll|flickering/i, 'Reading 2 uses its own examples');
  assert.deepEqual([...html.matchAll(/<strong>Lesson (2\.\d) · /g)].map((m) => m[1]), ['2.1', '2.2'], 'two lessons, 2.1 and 2.2');
  assert.equal((html.match(/<figure /g) || []).length, 3, 'three diagrams');
  assert.ok((html.match(/<table class="its10-table"/g) || []).length >= 4, 'the reference tables');
  ['Configuration item (CI)', 'P1 Critical', 'Respond within', 'Security Operations (SOC)', 'Awaiting Caller'].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows ${text}`));
  // Graded Prove It tickets never appear on the page.
  for (let n = 2137; n <= 2142; n += 1) assert.doesNotMatch(html, new RegExp(`(HD|SR|SEC)-${n}\\b`));
  // The file the curriculum check reads: two lessons with the filed titles.
  const source = fs.readFileSync(path.join(ROOT, 'portal/it-support-module-10.js'), 'utf8');
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [['Anatomy of a Ticket: Fields, Categories & Status', 90], ['Impact, Urgency, Priority & SLAs', 120]]);
}
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its10-lab-2-1');
  assert.match(guided, /\?coach=hd-m10&amp;restart=1&amp;student=/, 'Lab 2.1 launches the hd-m10 coach');
  assert.match(guided, /Start Lab 2\.1 walkthrough/);
  const practice = section(html, 'its10-practice-tickets');
  assert.match(practice, /\?practice=its-10&amp;student=/, 'Lab 2.2 opens practice set its-10');
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: resolve or escalate each one.');
  const prove = section(html, 'its10-prove-it');
  // Since 2026-11-20 the Prove It opens the queue shift.
  assert.match(prove, /\?prove=its-10&amp;student=/, 'the Prove It card opens the queue shift');
  assert.match(prove, /Start the Prove It/);
  assert.doesNotMatch(prove, /Opens soon/);
  assert.equal(railRow(html, 'its10-prove-it').locked, false);
  assert.match(guided, /Practice: not graded/, 'Lab 2.1 says it is not graded');
  assert.equal(railRow(html, 'its10-check').locked, false, 'the check is never locked');
  assert.equal(railRow(html, 'its10-practice-tickets').locked, false, 'the practice tickets are never locked');

  // Lab 2.1 is Practice It: a saved attempt is never "waiting for
  // instructor review".
  const waiting = hdUser({ [GUIDED]: submitted() });
  fresh(waiting);
  assert.doesNotMatch(statusLine(page().view(waiting, HD), GUIDED), /waiting for instructor review/);
  // A submitted Prove It has nothing left to open.
  const proved = hdUser({ [PROVE]: submitted() });
  fresh(proved);
  assert.doesNotMatch(section(page().view(proved, HD), 'its10-prove-it'), /\?prove=/, 'a submitted Prove It opens nothing');
}

/* -------------------------------------------------------- knowledge check */

function testKnowledgeCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS10_CHECK'));
  assert.equal(check.questions.length, 5);
  check.questions.forEach((q, i) => {
    assert.equal(q.choices.length, 4, `question ${i + 1} has four choices`);
    assert.equal(q.ifWrong[q.answer], null, `question ${i + 1}: no If wrong line on the answer`);
    q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `question ${i + 1} choice ${c}: an If wrong line`); });
    assert.ok(q.why, `question ${i + 1}: a Why line`);
  });
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const answer = run('its10Answer');
  const view = () => page().view(user, HD);

  // A wrong first pick shows its If wrong line, never the right answer's Why.
  answer(0, wrong(check.questions[0]));
  let html = view();
  assert.ok(html.includes(esc(check.questions[0].ifWrong[wrong(check.questions[0])])));
  assert.ok(!html.includes(esc(check.questions[0].why)));
  assert.match(html, /Not quite\./);
  // Then the right pick shows the Why.
  answer(0, check.questions[0].answer);
  assert.ok(view().includes(esc(check.questions[0].why)));

  // 1 wrong first pick + 4 right = 80%: complete, saved to the case state.
  check.questions.slice(1).forEach((q, i) => answer(i + 1, q.answer));
  let saved = LabRuntime.load('its10-page-v1', user, {});
  assert.equal(saved.checkCompleted, true);
  assert.ok(saved.checkCompletedAt);
  // The runtime's own defaults (score 0, bestScore 0) stay at zero: the page
  // adds only checkCompleted(At) and the walkthrough flags, never answers.
  assert.deepEqual(Object.keys(saved).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([saved.score, saved.bestScore], [0, 0], 'no score saved');
  html = view();
  assert.match(html, /Knowledge check complete/);
  assert.equal(railRow(html, 'its10-check').ticked, true);

  // 2 wrong first picks = 60%: a retake, nothing saved.
  const other = hdUser();
  other.userId = 'user-m02page-2';
  fresh(other);
  page().view(other, HD);
  answer(0, wrong(check.questions[0]));
  answer(1, wrong(check.questions[1]));
  check.questions.forEach((q, i) => answer(i, q.answer));
  saved = LabRuntime.load('its10-page-v1', other, {});
  assert.notEqual(saved.checkCompleted, true);
  assert.match(page().view(other, HD), /Retake: you need 70%/);
}

/* ---------------------------------------------------------- Lab 2.1 save */

const finishedWork = (status = 'Resolved', kbDraft = 'Review') => ({ version: 1, tickets: [
  { id: 'HD-2158', status: 'Escalated', console: { matrix: { impact: '1', urgency: '1', priority: 'P1' } } },
  { id: 'HD-2162', status, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' }, kbDraft } },
] });
const coachMessage = (source, work, student = studentOf(signedIn)) => ({ data: { type: 'mnt-coach-complete', id: 'hd-m10', nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved, the simulator hears why.
  for (const work of [finishedWork('On Hold'), finishedWork('Resolved', ''), { version: 1, tickets: [] }]) {
    const user = hdUser();
    fresh(user);
    page().view(user, HD);
    const { replies, source } = replyCatcher();
    await page().onMessage(coachMessage(source, work));
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'incomplete']]);
  }
  // Another student's work, or another origin: nothing saved.
  let user = hdUser();
  fresh(user);
  let catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, finishedWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, finishedWork()), origin: 'https://elsewhere.test' });
  assert.equal(inserts().length, 0);

  // Finished work: one Lab 2.1 attempt with the work, then the page shows it.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, finishedWork()));
  assert.equal(inserts(GUIDED).length, 1);
  assert.equal(inserts().length, 1, 'only Lab 2.1');
  assert.equal(copy(inserts(GUIDED)[0].payload).result.work.tickets.find((t) => t.id === 'HD-2162').console.kbDraft, 'Review');
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  // Practice It since 2026-11-20: complete once saved, no review wait.
  assert.match(statusLine(page().view(user, HD), GUIDED), /^Lab 2\.1: Complete/);
}

/* ---------------------------------------------------------- Lab 2.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-10' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-10', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-10', nonce: 'p-1', saved: true }, origin: SIM }]);
  let html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 2.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its10-practice-tickets').ticked, true);
  // Again: answered as saved, nothing inserted.
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1);

  // Refused: wrong tickets, another student, signed out. Module 1's set is
  // not this page's.
  for (const [name, fields, reason, setup] of [
    ['two tickets', { tickets: TICKETS.slice(0, 2) }, 'incomplete'],
    ['the related tickets too', { tickets: [...TICKETS, 'HD-2184'] }, 'incomplete'],
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
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-01', tickets: ['HD-2151', 'HD-2152', 'SEC-2153', 'HD-2154'] }));
  await page().onMessage(practiceMessage(other.source, { origin: 'https://elsewhere.test' }));
  assert.equal(inserts().length, 0);
  assert.equal(other.replies.length, 0, 'another set or origin gets no reply from this page');

  // The save fails: not saved, nothing shows complete.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  const failed = replyCatcher();
  const logged = console.error;
  console.error = () => {};
  try { await page().onMessage(practiceMessage(failed.source)); } finally { console.error = logged; }
  assert.deepEqual(failed.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: resolve or escalate each one.');
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 2.2 has a sheet');
  const html = sheet.render({ id: 'm02p-1', lab_key: PRACTICE, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-19T15:00:00Z', result: { source: 'mnt-practice-complete', practiceSet: 'its-10', tickets: TICKETS } });
  assert.match(html, /Module 02 · Lab 2\.2 · Practice tickets/);
  assert.match(html, /HD-2155, HD-2156, HD-2157/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.doesNotMatch(html, /Module 1 Prove It/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 2.2 is never in the review queue');
  const guided = sheet.render({ id: 'm02g-1', lab_key: GUIDED, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-19T15:00:00Z', result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 02 · Lab 2\.1 · Guided Lab: queue shift/);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testLabCardsAndRail, testKnowledgeCheck, testGuidedLabSave, testPracticeSave, testInstructorSheets];
  for (const test of tests) await test();
  console.log(`hdesk-m02-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

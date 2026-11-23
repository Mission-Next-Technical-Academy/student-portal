// Help Desk Module 3 (key its-11) course page, portal/it-support-module-11.js,
// on the Module 1 and 2 page pattern:
//
//   - The catalogue: Lab 3.1 (25 min), Lab 3.2 (20 min, Practice It) and the
//     Prove It (30 min) from the old 75-minute lab; 210 minutes in all,
//     ITHD-101.2. Lab 3.1 still gates Module 3, so it isn't Practice It yet.
//   - The page: shown as Module 3, two lessons (3.1 and 3.2) holding three
//     readings, three reference tables, three diagrams; no "Module 11".
//   - The knowledge check: choices shuffled per student; a wrong pick shows
//     only its If wrong line; 3 of 4 first picks right saves "complete" to the
//     case state; 2 of 4 doesn't; a failed save takes the tick off again.
//   - Lab 3.1: the coach's Finish saves an attempt only for finished work.
//   - Lab 3.2: the practice set's message saves one completion record.
//   - The Prove It card opens nothing yet.
//   - The instructor sheets: the new lab labels and the Lab 3.2 sheet.
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
const page = () => run(`MODULE_LABS['it-support/3']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its11-page-v1';
const GUIDED = 'lab-its-11-handoff-documentation';
const PRACTICE = 'lab-its-11-practice-tickets';
const PROVE = 'lab-its-11-prove-it';
const TICKETS = ['HD-2165', 'HD-2166', 'HD-2167'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function hdUser(attempts = {}, name = 'm03page') {
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
  run('its11CheckAnswers = {}; its11CheckPicks = {}; its11CheckSaveFailed = false');
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
const submitted = (at = '2026-11-22T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-11'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [3, 2, 210, 2, 3]);
  assert.equal(m.title, 'Customer Service, Documentation & Escalation', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes])), [
    ['its-11-lesson-01', 'Writing Notes the Next Technician Can Actually Use', 60],
    ['its-11-lesson-02', 'Escalation Triggers, User Updates & Expectation Setting', 75],
  ], 'the filed lesson keys, titles and minutes');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-11'));
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null]), [
    [GUIDED, 'Lab 3.1 · Guided Lab: a frustrated caller', 25, 'practice'],
    [PRACTICE, 'Lab 3.2 · Practice tickets', 20, 'practice'],
    [PROVE, 'Prove It: Independent Ticket', 30, null],
  ]);
  labs.forEach((l) => assert.deepEqual(l.parentAllocations.map((a) => [a.code, a.minutes]), [['ITHD-101.2', l.instructionalMinutes]], `${l.key} allocates to ITHD-101.2`));
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 210, 'lessons and labs still total 210');
  assert.doesNotMatch(JSON.stringify(labs), /HD-2113|HD-2124/, 'no lab text names the old tickets');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its11-shell"/);
  assert.match(html, /Module 03 · /, 'the hero shows Module 03');
  assert.match(html, /Week 2/);
  // No old number and no plan label in anything a student sees.
  assert.doesNotMatch(words(html), /Module 0?11\b|\b1-C\b|\b3-[ABC]\b|Overview tab/i);
  const labText = run('LABS').filter((l) => l.module === 'its-11').map((l) => `${l.title} ${l.objective} ${l.description}`).join(' ');
  assert.doesNotMatch(`${labText} ${HD.modules['its-11'].summary} ${HD.modules['its-11'].curriculumItems.map((i) => i.objective).join(' ')}`, /Module 0?11\b|\b1-C\b|\b3-[ABC]\b/);
  assert.deepEqual([...html.matchAll(/<strong>Lesson (3\.\d) · /g)].map((m) => m[1]), ['3.1', '3.2'], 'two lessons, 3.1 and 3.2');
  [1, 2, 3].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.equal((html.match(/<figure /g) || []).length, 3, 'three diagrams');
  ['CALM: four moves when a caller is stressed', 'Three ways users reach you, one standard', 'Escalating well: decide, hand off, tell the user'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${title}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  assert.equal((html.match(/<table class="its10-table"/g) || []).length, 3, 'the three reference tables');
  ['You don’t need to know what DHCP or a spooler is yet.', 'Security Operations (SOC)', 'The exact ask: which team, what you need them to do, and by when.',
    'Need the priority matrix or the SLA table? They’re in Module 2, Lesson 2.2.', 'as you practiced in Lab 1.2 with the caller from the CFO’s office'].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // No typed command is asked for anywhere in the module.
  assert.doesNotMatch(words(html), /Get-[A-Z]\w+|ipconfig|cmdkey/);
  // The file the curriculum check reads: two lessons with the filed titles.
  const source = fs.readFileSync(path.join(ROOT, 'portal/it-support-module-11.js'), 'utf8');
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [['Writing Notes the Next Technician Can Actually Use', 90], ['Escalation Triggers, User Updates & Expectation Setting', 120]]);
}

// No diagram line is wider than the box it sits in (0.56 em a character, the
// estimate the drawing code wraps with).
function testDiagramsFit() {
  for (const key of ['calm', 'channels', 'escalate']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS11_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 (\d+) ([\d.]+)"/.exec(svg);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
    }
  }
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its11-lab-3-1');
  assert.match(guided, /\?coach=hd-m11&amp;restart=1&amp;student=/, 'Lab 3.1 launches the hd-m11 coach');
  assert.match(guided, /Start Lab 3\.1 walkthrough/);
  assert.match(guided, /Feedback only, no score/);
  const practice = section(html, 'its11-practice-tickets');
  assert.match(practice, /\?practice=its-11&amp;student=/, 'Lab 3.2 opens practice set its-11');
  assert.match(practice, /Practice: not graded/);
  // Students first use this control in Lab 3.2: where it is, and when to use it.
  assert.match(words(practice), /a Message another team card, you’ll find it just above Work notes; use it when another team owns the next step and you need their answer or a time\./);
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: resolve each one, or hand it on and set a Follow-up.');
  // Since 2026-11-22 the Prove It opens Module 3's ticket.
  const prove = section(html, 'its11-prove-it');
  assert.match(prove, /\?prove=its-11&amp;student=/, 'the Prove It card opens the Module 3 ticket');
  assert.match(prove, /Start the Prove It/);
  assert.doesNotMatch(prove, /Opens soon/);
  assert.match(guided, /Practice: not graded/, 'Lab 3.1 says it is not graded');
  assert.doesNotMatch(guided, /instructor reviews/i);
  ['its11-prove-it', 'its11-check', 'its11-practice-tickets', 'its11-lab-3-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));

  // Lab 3.1 is Practice It: a saved attempt is never "waiting for
  // instructor review".
  const waiting = hdUser({ [GUIDED]: submitted() });
  fresh(waiting);
  assert.doesNotMatch(statusLine(page().view(waiting, HD), GUIDED), /waiting for instructor review/);
  // A submitted Prove It has nothing left to open, and waits for review.
  const proved = hdUser({ [PROVE]: submitted() });
  fresh(proved);
  const provedHtml = page().view(proved, HD);
  assert.doesNotMatch(section(provedHtml, 'its11-prove-it'), /\?prove=/, 'a submitted Prove It opens nothing');
  assert.match(statusLine(provedHtml, PROVE), /waiting for instructor review/);
}

/* -------------------------------------------------------- knowledge check */

const shownOrder = (html, q) => [...html.matchAll(new RegExp(`data-its11-answer data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, q) => [...html.matchAll(new RegExp(`data-its11-answer data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

function testChoicesAreShuffledPerStudent() {
  const answers = copy(run('ITS11_CHECK')).questions.map((q) => q.answer);
  const places = answers.map(() => new Set());
  const orders = new Set();
  for (let i = 0; i < 40; i += 1) {
    const user = hdUser({}, `m03shuffle${i}`);
    fresh(user);
    const html = page().view(user, HD);
    const seen = answers.map((_, q) => shownOrder(html, q));
    seen.forEach((order, q) => {
      assert.deepEqual([...order].sort(), [0, 1, 2, 3], `student ${i} question ${q + 1}: every choice once`);
      assert.deepEqual(shownLetters(html, q), ['A', 'B', 'C', 'D'], 'letters follow the place on screen');
      places[q].add(order.indexOf(answers[q]));
    });
    orders.add(JSON.stringify(seen));
    // The same student sees the same order again.
    assert.deepEqual(answers.map((_, q) => shownOrder(page().view(user, HD), q)), seen);
  }
  assert.ok(orders.size > 30, 'students see different orders');
  places.forEach((set, q) => assert.equal(set.size, 4, `question ${q + 1}: the right answer takes every position`));
}

function testKnowledgeCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS11_CHECK'));
  assert.equal(check.questions.length, 4);
  check.questions.forEach((q, i) => {
    assert.equal(q.choices.length, 4, `question ${i + 1} has four choices`);
    assert.equal(q.ifWrong[q.answer], null, `question ${i + 1}: no If wrong line on the answer`);
    q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `question ${i + 1} choice ${c}: an If wrong line`); });
    assert.ok(q.why, `question ${i + 1}: a Why line`);
  });
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const answer = run('its11Answer');
  const view = () => page().view(user, HD);

  // A wrong first pick shows its If wrong line only, never the Why, and marks
  // nothing but the student's own pick.
  answer(0, wrong(check.questions[0]));
  let html = view();
  assert.ok(html.includes(esc(check.questions[0].ifWrong[wrong(check.questions[0])])));
  assert.equal(check.questions[0].ifWrong.filter((line) => line && html.includes(esc(line))).length, 1);
  assert.ok(!html.includes(esc(check.questions[0].why)));
  assert.match(html, /Not quite\./);
  assert.doesNotMatch(section(html, 'its11-checks'), /is-answer/);
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
  assert.match(html, /Knowledge check complete/);
  assert.equal(railRow(html, 'its11-check').ticked, true);
  assert.equal(inserts().length, 0, 'the check saves no attempt');

  // 2 wrong first picks = 2 of 4: a retake, nothing saved. Signing in as
  // another student starts the check fresh.
  const other = hdUser({}, 'm03page2');
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
  const user = { ...hdUser({}, 'm03save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  copy(run('ITS11_CHECK')).questions.forEach((q, i) => run('its11Answer')(i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its11-check').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(html, /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its11-check-retry/);
  assert.equal(railRow(html, 'its11-check').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).checkCompleted, true);
  // Try again, and this time the save lands.
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-11' }], error: null });
  run('its11RetryCheckSave')();
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(html, /Knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).checkCompleted, true);
}

/* ---------------------------------------------------------- Lab 3.1 save */

const finishedWork = (followUp = { at: '2026-08-19T11:30:00.000Z', visited: true, updated: true, kept: true }, id = 'HD-2164') => ({ version: 1, tickets: [
  { id, number: 'INC0010440', status: 'Escalated', console: { matrix: { impact: '3', urgency: '1', priority: 'P3', assignmentGroup: 'Desktop Support (Tier 2)' }, followUp } },
] });
const coachMessage = (source, work, student = studentOf(signedIn)) => ({ data: { type: 'mnt-coach-complete', id: 'hd-m11', nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved, the simulator hears why, and the page's
  // message doesn't ask for a ticket that stays open to be resolved.
  const unfinished = [
    finishedWork({ at: '2026-08-19T11:30:00.000Z', visited: true, updated: false, kept: false }),
    finishedWork({ at: '', visited: false, updated: false }),
    finishedWork(undefined, 'HD-2113'),
    { version: 1, tickets: [] },
  ];
  for (const work of unfinished) {
    const user = hdUser();
    fresh(user);
    page().view(user, HD);
    const { replies, source } = replyCatcher();
    await page().onMessage(coachMessage(source, work));
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'incomplete']]);
    const guided = section(page().view(user, HD), 'its11-lab-3-1');
    assert.match(guided, /the call isn’t finished yet/);
    assert.doesNotMatch(guided, /resolve it/);
  }
  // Module 1's shared message keeps its own words.
  assert.match(run(`itsIncompleteWalkthroughs.add('u|hd-m01'); itsWalkthroughNoticeHtml({ userId: 'u' }, 'hd-m01', [], 'Start')`), /Finish every part of the ticket there, resolve it, then press Finish again\./);

  // Another student's work, or another origin: nothing saved.
  let user = hdUser();
  fresh(user);
  let catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, finishedWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, finishedWork()), origin: 'https://elsewhere.test' });
  assert.equal(inserts().length, 0);

  // Finished work (also with a second follow-up set after the update): one
  // Lab 3.1 attempt with the work, then the page shows it waiting.
  for (const work of [finishedWork(), finishedWork({ at: '2026-08-19T13:00:00.000Z', visited: true, updated: false, kept: true })]) {
    user = hdUser();
    fresh(user);
    page().view(user, HD);
    catcher = replyCatcher();
    await page().onMessage(coachMessage(catcher.source, work));
    assert.equal(inserts().length, 1, 'only Lab 3.1');
    const row = copy(inserts(GUIDED)[0].payload);
    assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
    assert.equal(row.result.work.tickets[0].console.followUp.kept, true);
    assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
    // Practice It since 2026-11-22: complete once saved, no instructor review.
    assert.match(statusLine(page().view(user, HD), GUIDED), /^Lab 3\.1: Complete/);
  }

  // The save fails: not received, nothing shows submitted.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  catcher = replyCatcher();
  await quiet(() => page().onMessage(coachMessage(catcher.source, finishedWork())));
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [false]);
  assert.doesNotMatch(statusLine(page().view(user, HD), GUIDED), /submitted/);
}

/* ---------------------------------------------------------- Lab 3.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-11' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves the same tickets the simulator's set needs done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-11': \{ title:'Module 3 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-11', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-11', nonce: 'p-1', saved: true }, origin: SIM }]);
  let html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 3.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its11-practice-tickets').ticked, true);
  // Again: answered as saved, nothing inserted.
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1);

  // Already in the database (another browser saved it): shown, not saved twice.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: [{ completed_at: '2026-11-22T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  const known = replyCatcher();
  await page().onMessage(practiceMessage(known.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(known.replies.map((r) => r.data.saved), [true]);

  // Refused: wrong tickets, another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['two tickets', { tickets: TICKETS.slice(0, 2) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2164'] }, 'incomplete'],
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
  // Module 2's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-10', tickets: ['HD-2155', 'HD-2156', 'HD-2157'] }));
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
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 3.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-22T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm03p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-11', tickets: TICKETS } });
  assert.match(html, /Module 03 · Lab 3\.2 · Practice tickets/);
  assert.match(html, /HD-2165, HD-2166, HD-2167/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 3.2 is never in the review queue');
  // Since 2026-11-22 the Prove It gates Module 3: Lab 3.1 is Practice It and
  // leaves the review queue; the Prove It is in it.
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), false, 'Lab 3.1 is no longer in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PROVE, track_code: 'HDESK' }), true, 'the Prove It is in the review queue');
  const guided = sheet.render({ ...base, id: 'm03g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 03 · Lab 3\.1 · Guided Lab: a frustrated caller/);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testChoicesAreShuffledPerStudent, testKnowledgeCheck, testCheckSaveThatFails, testGuidedLabSave, testPracticeSave, testInstructorSheets];
  for (const test of tests) await test();
  console.log(`hdesk-m03-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

// Help Desk Module 6 (key its-07) course page, portal/it-support-module-07.js,
// on the Module 1 and 5 page pattern:
//
//   - The catalogue: Lab 6.1 (12 min), Lab 6.2 (8 min, Practice It) and the
//     Prove It (10 min) from the old 30-minute lab; 120 minutes in all,
//     ITHD-101.4. Lab 6.1 still gates Module 6, so it isn't Practice It yet.
//   - The page: shown as Module 6 in week 3, three lessons (6.1 to 6.3) on the
//     two filed lesson keys, three readings, five tables, three diagrams and
//     the added sentences; no "lab VM", "Module 7", "CompTIA", the old lab's
//     title or HD-2119.
//   - The knowledge check: five questions, choices shuffled per student and
//     the same for one student on every redraw; a wrong pick shows only its If
//     wrong line; 4 of 5 first picks right saves "complete" to the case state;
//     3 of 5 doesn't; a failed save takes the tick off again.
//   - Lab 6.1: the coach's Finish saves an attempt only when HD-2176 is
//     resolved.
//   - Lab 6.2: the practice set's message saves one completion record.
//   - The Prove It card opens nothing yet.
//   - The instructor sheets: the new lab labels and the Lab 6.2 sheet.
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
const page = () => run(`MODULE_LABS['it-support/6']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its07-page-v1';
const GUIDED = 'lab-its-07-app-cert';
const PRACTICE = 'lab-its-07-practice-tickets';
const PROVE = 'lab-its-07-prove-it';
const TICKETS = ['HD-2177', 'HD-2178', 'HD-2179'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function hdUser(attempts = {}, name = 'm06page') {
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
  run('its07CheckAnswers = {}; its07CheckPicks = {}; its07CheckSaveFailed = false');
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
  const m = HD.modules['its-07'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [6, 3, 120, 2, 3]);
  assert.equal(m.title, 'Software, Applications & Endpoint Management', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes])), [
    ['its-07-lesson-01', 'Installing, Updating & Removing Software', 45],
    ['its-07-lesson-02', 'Diagnosing Application Problems & Endpoint Security Hygiene', 45],
  ], 'the filed lesson keys, titles and minutes');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-07'));
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null]), [
    [GUIDED, 'Lab 6.1 · Guided Lab: endpoint check', 12, null],
    [PRACTICE, 'Lab 6.2 · Practice tickets (not graded)', 8, 'practice'],
    [PROVE, 'Prove It: Independent Ticket', 10, null],
  ]);
  labs.forEach((l) => assert.deepEqual(l.parentAllocations.map((a) => [a.code, a.minutes]), [['ITHD-101.4', l.instructionalMinutes]], `${l.key} allocates to ITHD-101.4`));
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 120, 'lessons and labs still total 120');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective) });
  assert.doesNotMatch(text, /HD-2119|Purchasing App|certificate|lab VM|Module 0?7\b/i, 'no catalogue text names the old lab');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its07-shell"/);
  assert.match(html, /Module 06 · 2 Hours · Week 3/, 'the hero shows Module 06, 120 minutes, week 3');
  const shown = words(html);
  // No old number, old title, old ticket, lab VM or CompTIA in anything a student sees.
  assert.doesNotMatch(shown, /Module 0?7\b|lab VM|CompTIA|Purchasing App|HD-2119/i);
  assert.doesNotMatch(html, /comptia\.org/i);
  // Software means the Software Catalog, not "the approved list".
  assert.doesNotMatch(shown, /approved list/i);
  assert.match(shown, /The Software Catalog is the list of approved apps\. The Service Catalog in ServiceNow is something else/, 'the two catalogs are told apart once');
  // The objective: A+ Core 1 4.2 and competencies 3, 8 and 9.
  assert.match(shown, /A\+ Core 1: 4\.2 \(file synchronization\)/);
  assert.ok(html.includes(esc('Competencies: 3 Ticketing discipline · 8 Security hygiene & escalation · 9 Triage & escalation judgment.')));
  // Three lessons on two filed keys.
  assert.deepEqual([...html.matchAll(/<strong>Lesson (6\.\d) · /g)].map((m) => m[1]), ['6.1', '6.2', '6.3'], 'three lessons, 6.1 to 6.3');
  assert.deepEqual([...html.matchAll(/data-its07-lesson="([^"]+)"/g)].map((m) => m[1]), ['its-07-lesson-01', 'its-07-lesson-02', 'its-07-lesson-02'], 'Lessons 6.2 and 6.3 share the second filed lesson');
  assert.equal((html.match(/Lessons 6\.2 and 6\.3 together: 1 Hour/g) || []).length, 2, 'Lessons 6.2 and 6.3 say they share its minutes');
  assert.match(html, /<dt>Lessons<\/dt><dd>3<\/dd>/, 'the hero counts the three lessons the page shows');
  // What 6-A and 6-C need is taught: a path that is too long, and Default apps.
  assert.match(shown, /A path that is too long: shorten a folder name or move the file up a level\./);
  assert.match(shown, /Settings › Apps › Default apps/);
  [1, 2, 3].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.equal((html.match(/<figure /g) || []).length, 3, 'three diagrams');
  ['Three approved ways to get software, and one that is never used', 'A user asks you to type the admin password', 'Unwanted app or malware? Who handles it'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${esc(title).replace(/[?+]/g, '\\$&')}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  // Spec section 5's five tables.
  const captions = [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].map((m) => m[1]);
  assert.deepEqual(captions, ['How software gets onto a Northstar PC', 'winget quick reference', 'One app misbehaves: lightest fix first', 'Unwanted app or malware?', 'OneDrive status icons']);
  // Spec section 8.5's added sentences, and call 10's reworded sentence.
  [
    'Office apps have a safe mode of their own. If Outlook, Word or Excel crashes or freezes as it opens, start it in safe mode: hold Ctrl while you open it, or run',
    'Go to File › Options › Add-ins › COM Add-ins › Go, untick one add-in at a time, and restart the app after each.',
    'Defender labels toolbars, search add-ons and bundled “helper” apps as potentially unwanted apps (PUA).',
    'undo any “Allowed” choice in Windows Security so Defender removes the app, run a quick scan, and tell the user how it got there (KB-0080). If Defender names malware instead, stop and escalate.',
    'and why you never use an admin account to install something that isn’t approved “to be nice.”',
  ].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // Commands render as code, not as backticks; the OneDrive characters show
  // with one backslash.
  assert.match(html, /<code class="its07-code">winget install --id &lt;ID&gt; -e<\/code>/);
  assert.match(html, /<code class="its07-code">outlook\.exe \/safe<\/code>/);
  assert.ok(html.includes('<code class="its07-code">&quot; * : &lt; &gt; ? / \\ |</code>'), 'the OneDrive characters, one backslash');
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  // The file the curriculum check reads: two lessons with the filed titles,
  // each 45 filed minutes plus a 15-minute share of the lab.
  const source = fs.readFileSync(path.join(ROOT, 'portal/it-support-module-07.js'), 'utf8');
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [['Installing, Updating & Removing Software', 60], ['Diagnosing Application Problems & Endpoint Security Hygiene', 60]]);
}

// No diagram line is wider than the box it sits in (0.56 em a character, the
// estimate the drawing code wraps with), and the red strips are drawn.
function testDiagramsFit() {
  for (const key of ['routes', 'uac', 'pua']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS07_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
      // Every box fits inside the drawing.
      for (const m of svg.matchAll(/<rect class="[^"]*" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) + Number(m[3]) <= Number(w) + 1 && Number(m[2]) + Number(m[4]) <= Number(h) + 1, `${key} ${layout}: a box fits`);
      }
    }
  }
  ['wide', 'narrow'].forEach((layout) => {
    assert.match(run(`ITS07_DIAGRAM_DRAW.routes('${layout}')`), /class="its01-dg-box its07-dg-warn"/, `routes ${layout}: the red strip`);
    assert.match(run(`ITS07_DIAGRAM_DRAW.pua('${layout}')`), /class="its01-dg-box its07-dg-warn"/, `pua ${layout}: the red strip`);
    const uac = run(`ITS07_DIAGRAM_DRAW.uac('${layout}')`);
    assert.match(uac, />Yes</);
    assert.match(uac, />No</);
    assert.match(uac, /class="its01-dg-box its01-dg-hl"/, `uac ${layout}: the question is highlighted`);
  });
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its07-lab-6-1');
  assert.match(guided, /\?coach=hd-m07&amp;restart=1&amp;student=/, 'Lab 6.1 launches the hd-m07 coach');
  assert.match(guided, /Start Lab 6\.1 walkthrough/);
  assert.match(guided, /eleven steps/);
  assert.match(guided, /Feedback only, no score/);
  assert.match(guided, /Your instructor reviews your finished lab/, 'Lab 6.1 still gates Module 6');
  const practice = section(html, 'its07-practice-tickets');
  assert.match(practice, /\?practice=its-07&amp;student=/, 'Lab 6.2 opens practice set its-07');
  assert.match(practice, /Practice: not graded/);
  assert.match(practice, /\(6-A\)[\s\S]*\(6-B\)[\s\S]*\(6-C\)/);
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: resolve each one, or convert it to its request and finish that work.');
  // The Prove It opens nothing yet.
  const prove = section(html, 'its07-prove-it');
  assert.match(prove, /Opens soon/);
  assert.doesNotMatch(prove, /<a |<button|\?prove=/, 'the Prove It card opens nothing');
  assert.doesNotMatch(html, /\?prove=its-07/);
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-07-assessment-module/);
  ['its07-prove-it', 'its07-check', 'its07-practice-tickets', 'its07-lab-6-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));

  // Lab 6.1 still gates Module 6: a saved attempt waits for the instructor.
  const waiting = hdUser({ [GUIDED]: submitted() });
  fresh(waiting);
  assert.match(statusLine(page().view(waiting, HD), GUIDED), /^Lab 6\.1 submitted .+, waiting for instructor review$/);
  assert.equal(railRow(page().view(waiting, HD), 'its07-lab-6-1').ticked, false);
  const passed = hdUser({ [GUIDED]: { ...submitted(), reviewedAt: '2026-11-24T16:00:00Z' } });
  fresh(passed);
  assert.equal(statusLine(page().view(passed, HD), GUIDED), 'Lab 6.1 passed');
}

/* ------------------------------------------------------- knowledge check */

const shownOrder = (html, q) => [...html.matchAll(new RegExp(`data-its07-answer data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, q) => [...html.matchAll(new RegExp(`data-its07-answer data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

// Spec section 8.1: the right answer doesn't always sit in the same place.
// Each student gets their own order, the same on every redraw and reload.
function testChoicesShuffled() {
  const check = copy(run('ITS07_CHECK'));
  const orders = {};
  const names = ['m06order1', 'm06order2', 'm06order3', 'm06order4', 'm06order5'];
  for (const name of names) {
    const user = hdUser({}, name);
    fresh(user);
    const html = page().view(user, HD);
    orders[name] = check.questions.map((_, q) => shownOrder(html, q));
    check.questions.forEach((_, q) => {
      assert.deepEqual([...orders[name][q]].sort(), [0, 1, 2, 3], `${name} question ${q + 1}: every choice once`);
      assert.deepEqual(shownLetters(html, q), ['A', 'B', 'C', 'D'], 'letters follow the place shown');
    });
    // The same student, drawn again: the same order.
    const again = page().view(user, HD);
    check.questions.forEach((_, q) => assert.deepEqual(shownOrder(again, q), orders[name][q], `${name} question ${q + 1}: stable`));
  }
  // Two students see a different order on at least one question.
  assert.notDeepEqual(orders.m06order1, orders.m06order2);
  // Across students and questions the right answer lands in more than one place.
  const places = new Set();
  names.forEach((name) => check.questions.forEach((question, q) => places.add(orders[name][q].indexOf(question.answer))));
  assert.ok(places.size >= 3, 'the right answer moves around');
  // No If wrong line names a letter, since the letters move.
  check.questions.forEach((question) => question.ifWrong.forEach((line) => { if (line) assert.doesNotMatch(line, /^[A-D]\)/); }));
}

function testKnowledgeCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS07_CHECK'));
  assert.equal(check.title, 'Knowledge check');
  assert.equal(check.questions.length, 5);
  assert.match(check.questions[4].q, /escalate to the SOC/, 'spec section 8.1 adds a fifth question on the SOC');
  check.questions.forEach((q, i) => {
    assert.equal(q.choices.length, 4, `question ${i + 1} has four choices`);
    assert.equal(q.ifWrong[q.answer], null, `question ${i + 1}: no If wrong line on the answer`);
    q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `question ${i + 1} choice ${c}: an If wrong line`); });
    assert.ok(q.why, `question ${i + 1}: a Why line`);
  });
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const answer = run('its07Answer');
  const view = () => page().view(user, HD);

  // A wrong first pick shows its If wrong line only, never the Why, and marks
  // nothing but the student's own pick.
  answer(0, wrong(check.questions[0]));
  let html = view();
  assert.ok(html.includes(esc(check.questions[0].ifWrong[wrong(check.questions[0])])));
  assert.equal(check.questions[0].ifWrong.filter((line) => line && html.includes(esc(line))).length, 1);
  assert.ok(!html.includes(esc(check.questions[0].why)));
  assert.match(html, /Not quite\./);
  assert.doesNotMatch(section(html, 'its07-checks'), /is-answer/);
  // Then the right pick shows the Why.
  answer(0, check.questions[0].answer);
  assert.ok(view().includes(esc(check.questions[0].why)));

  // 1 wrong first pick + 4 right = 4 of 5: complete, saved to the case state.
  check.questions.slice(1).forEach((q, i) => answer(i + 1, q.answer));
  let saved = LabRuntime.load(STATE_ID, user, {});
  assert.equal(saved.checkCompleted, true);
  assert.ok(saved.checkCompletedAt);
  assert.deepEqual(Object.keys(saved).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([saved.score, saved.bestScore], [0, 0], 'no score saved');
  html = view();
  assert.match(html, /Knowledge check complete/);
  assert.equal(railRow(html, 'its07-check').ticked, true);
  assert.equal(inserts().length, 0, 'the check saves no attempt');

  // 2 wrong first picks = 3 of 5: a retake, nothing saved. Signing in as
  // another student starts the check fresh.
  const other = hdUser({}, 'm06page2');
  ctx.localStorage.clear();
  signedIn = other;
  html = page().view(other, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./);
  answer(0, wrong(check.questions[0]));
  answer(1, wrong(check.questions[1]));
  check.questions.forEach((q, i) => answer(i, q.answer));
  saved = LabRuntime.load(STATE_ID, other, {});
  assert.notEqual(saved.checkCompleted, true);
  assert.match(page().view(other, HD), /Retake: you need 4 of 5/);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm06save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  copy(run('ITS07_CHECK')).questions.forEach((q, i) => run('its07Answer')(i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its07-check').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(html, /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its07-check-retry/);
  assert.equal(railRow(html, 'its07-check').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).checkCompleted, true);
  // Try again, and this time the save lands.
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-07' }], error: null });
  run('its07RetryCheckSave')();
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(html, /Knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).checkCompleted, true);
}

/* ---------------------------------------------------------- Lab 6.1 save */

const labWork = (status = 'Resolved', id = 'HD-2176') => ({ version: 1, tickets: [
  { id, number: 'INC0010486', status, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' } } },
] });
const coachMessage = (source, work, student = studentOf(signedIn)) => ({ data: { type: 'mnt-coach-complete', id: 'hd-m07', nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved, the simulator hears why, and the page
  // asks the student to finish and resolve the ticket. The old lab's ticket
  // doesn't count.
  for (const work of [labWork('In Progress'), labWork('New'), labWork('Resolved', 'HD-2119'), { version: 1, tickets: [] }]) {
    const user = hdUser();
    fresh(user);
    page().view(user, HD);
    const { replies, source } = replyCatcher();
    await page().onMessage(coachMessage(source, work));
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'incomplete']]);
    assert.match(section(page().view(user, HD), 'its07-lab-6-1'), /Finish every part of the ticket there, resolve it, then press Finish again\./);
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

  // HD-2176 resolved: one Lab 6.1 attempt with the work, then the page shows
  // it waiting for the instructor.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 6.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
  assert.equal(row.result.work.tickets[0].id, 'HD-2176');
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  assert.match(statusLine(page().view(user, HD), GUIDED), /waiting for instructor review$/);
  // Finishing again while it waits sends nothing new.
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

/* ---------------------------------------------------------- Lab 6.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-07' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves the same tickets the simulator's set needs done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-07': \{ title:'Module 6 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-07 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-07', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-07', nonce: 'p-1', saved: true }, origin: SIM }]);
  let html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 6.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its07-practice-tickets').ticked, true);
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

  // Refused: wrong tickets, another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['two tickets', { tickets: TICKETS.slice(0, 2) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2176'] }, 'incomplete'],
    ['the lab ticket instead', { tickets: ['HD-2176', 'HD-2178', 'HD-2179'] }, 'incomplete'],
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
  // Module 5's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-03', tickets: ['HD-2181', 'HD-2182', 'HD-2183', 'HD-2186'] }));
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
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 6.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-24T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm06p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-07', tickets: TICKETS } });
  assert.match(html, /Module 06 · Lab 6\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2177, HD-2178, HD-2179/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 6.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), true, 'Lab 6.1 still is, until the Prove It gates the module');
  const guided = sheet.render({ ...base, id: 'm06g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 06 · Lab 6\.1 · Guided Lab: endpoint check/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m06-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testChoicesShuffled, testKnowledgeCheck, testCheckSaveThatFails, testGuidedLabSave, testPracticeSave, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m06-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

// Help Desk Module 7 (key its-05) course page, portal/it-support-module-05.js,
// on the Module 1 and 6 page pattern:
//
//   - The catalogue: Lab 7.1 (120 min), Lab 7.2 (90 min, Practice It) and the
//     Prove It (45 min) from the old 255-minute lab; 720 minutes in all, and
//     the parents keep ITHD-101.5 165 and ITHD-101.6 90 lab minutes. Lab 7.1
//     still gates Module 7, so it isn't Practice It yet.
//   - The page: shown as Module 7 in week 4, four filed lessons (7.1 to 7.4)
//     as five reading cards, six tables, five diagrams; no "Module 5", "server
//     VM", "build a domain", "CompTIA", the old lab's title, HD-2108 or HD-2117.
//   - The two checks: Learn It (6 questions) and A+ (8 questions), choices
//     shuffled per student and per attempt, stable on a redraw; a wrong pick
//     shows only its If wrong line; 5 of 6 and 6 of 8 first picks right save
//     "complete" to the case state, 4 of 6 and 5 of 8 don't; each check saves
//     its own flag; a failed save takes the tick off again.
//   - Lab 7.1: the coach's Finish saves an attempt only when HD-2189 is
//     resolved and HD-2190 was raised from it.
//   - Lab 7.2: the practice set's message saves one completion record.
//   - The Prove It card opens nothing yet.
//   - The instructor sheets: the new lab labels and the Lab 7.2 sheet.
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
const page = () => run(`MODULE_LABS['it-support/7']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its05-page-v1';
const GUIDED = 'lab-its-05-server-ad';
const PRACTICE = 'lab-its-05-practice-tickets';
const PROVE = 'lab-its-05-prove-it';
const TICKETS = ['HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const PAGE_FILE = path.join(ROOT, 'portal/it-support-module-05.js');

function hdUser(attempts = {}, name = 'm07page') {
  return {
    userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function resetChecks() {
  run(`['learn', 'aplus'].forEach((k) => { its05CheckAnswers[k] = {}; its05CheckPicks[k] = {}; its05CheckSaveFailed[k] = false; its05CheckAttempt[k] = 0; })`);
}
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run('itsUnrecordedWalkthroughs.clear(); itsBlockedWalkthroughs.clear(); itsIncompleteWalkthroughs.clear()');
  resetChecks();
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
// One check's block, from its opening tag to its footer.
const checkBlock = (html, checkId) => {
  const start = html.indexOf(`id="its05-check-${checkId}"`);
  assert.ok(start >= 0, `check ${checkId}`);
  const footer = html.indexOf(`data-its05-check-footer="${checkId}"`, start);
  return html.slice(start, html.indexOf('</div>', footer));
};
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const submitted = (at = '2026-11-25T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });
const checks = () => copy(run('ITS05_CHECKS'));

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-05'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [7, 4, 720, 4, 3]);
  assert.equal(m.title, 'Windows Server & Active Directory Administration', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes, item.parentAllocations.map((a) => [a.code, a.minutes])])), [
    ['its-05-lesson-01', 'Windows Server Roles & Server Manager', 120, [['ITHD-101.5', 120]]],
    ['its-05-lesson-02', 'File Sharing, Permissions & DNS/DHCP Role Awareness', 120, [['ITHD-101.5', 120]]],
    ['its-05-lesson-03', 'Logs, Services & Change Discipline', 75, [['ITHD-101.5', 75]]],
    ['its-05-lesson-04', 'Active Directory Structure: Domains, OUs, Users, Groups & Computer Objects', 150, [['ITHD-101.6', 150]]],
  ], 'the filed lesson keys, titles, minutes and parents');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-05'));
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null, l.parentAllocations.map((a) => [a.code, a.minutes])]), [
    [GUIDED, 'Lab 7.1 · Guided Lab: the morning server check', 120, null, [['ITHD-101.5', 90], ['ITHD-101.6', 30]]],
    [PRACTICE, 'Lab 7.2 · Practice tickets (not graded)', 90, 'practice', [['ITHD-101.5', 50], ['ITHD-101.6', 40]]],
    [PROVE, 'Prove It: Independent Ticket', 45, null, [['ITHD-101.5', 25], ['ITHD-101.6', 20]]],
  ]);
  // The parents keep the old lab's 165 and 90 minutes.
  const parent = (code) => labs.reduce((sum, l) => sum + l.parentAllocations.filter((a) => a.code === code).reduce((s, a) => s + a.minutes, 0), 0);
  assert.deepEqual([parent('ITHD-101.5'), parent('ITHD-101.6')], [165, 90]);
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 720, 'lessons and labs still total 720');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective) });
  assert.doesNotMatch(text, /HD-2108|HD-2117|Missing Drive|Vanishing|server VM|create a new OU|Module 0?5\b/i, 'no catalogue text names the old lab');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its05-shell"/);
  assert.match(html, /Module 07 · 12 Hours · Week 4/, 'the hero shows Module 07, 720 minutes, week 4');
  assert.match(html, /<dt>Lessons<\/dt><dd>4<\/dd>/, 'the hero counts the four filed lessons');
  const shown = words(html);
  // Nothing a student sees names the old number, a VM, building or CompTIA.
  const banned = /.{0,60}(Module 0?5\b|server VM|build a domain|CompTIA|220-1201|HD-2108|HD-2117).{0,60}/i.exec(shown);
  assert.equal(banned && banned[0], null, 'nothing a student sees names the old module, a VM, building a domain or CompTIA');
  assert.doesNotMatch(shown, /The Missing Drive|Vanishing Free Space/, 'nor the old lab title');
  assert.doesNotMatch(html, /comptia\.org/i);
  assert.match(shown, /A\+ check/, '"A+ check" stays');
  // The whole file, comments included.
  const source = fs.readFileSync(PAGE_FILE, 'utf8');
  assert.doesNotMatch(source, /Module 0?5\b|server VM|build a domain|CompTIA|220-1201|HD-2108|HD-2117|Windows Server 20\d\d/i);
  // The objective (spec 8.5): A+ Core 1 2.3 and 2.4, competencies 1, 3 and 9.
  assert.match(shown, /A\+ Core 1: 2\.3 services provided by networked hosts · 2\.4 common network configuration concepts \(DNS, DHCP, VLAN\)/);
  assert.match(shown, /Competencies: 1 AD basics · 3 Ticketing discipline · 9 Triage and escalation judgment\./);
  // Four filed lessons as five reading cards; Lesson 7.2 holds Readings 2 and 3.
  assert.deepEqual([...html.matchAll(/<strong>Lesson (7\.\d) · Reading (\d) · /g)].map((m) => `${m[1]}/${m[2]}`), ['7.1/1', '7.2/2', '7.2/3', '7.3/4', '7.4/5']);
  assert.deepEqual([...html.matchAll(/data-its05-lesson="([^"]+)"/g)].map((m) => m[1]), ['its-05-lesson-01', 'its-05-lesson-02', 'its-05-lesson-02', 'its-05-lesson-03', 'its-05-lesson-04']);
  assert.equal((html.match(/Readings 2 and 3 share Lesson 7\.2’s 3 Hours/g) || []).length, 2, 'Readings 2 and 3 say they share the lesson’s minutes');
  [1, 2, 3, 4, 5].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  // Spec section 6: five diagrams, each a wide and a narrow drawing.
  assert.equal((html.match(/<figure /g) || []).length, 5, 'five diagrams');
  ['One office, five servers, and what each one is responsible for', 'Two permission layers, and the one that wins', 'One person, or everyone?', 'Before you theorise, read what changed', 'How Active Directory is organised'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${esc(title).replace(/[?+]/g, '\\$&')}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  // Spec section 5's six tables, placed by reading.
  const captions = [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].map((m) => m[1]);
  assert.deepEqual(captions, [
    'Server roles at Northstar, and what each one does', 'Internet appliances and the odd ones out',
    'The two permission layers on a share',
    'DNS record types a Tier 1 technician meets', 'DHCP words, and what each one means on the screen',
    'What a Tier 1 technician may do on a server, and what to escalate',
  ].map(esc));
  // Spec section 8.5's key sentences, one from each reading.
  [
    'You report those; you don’t experiment on them.',
    'The user gets the more restrictive of the two.',
    'One scope serves one ',
    'is a symptom; “System 7034 at 08:12, first in 30 days” is evidence.',
    'Mixing those two up is the most common wrong diagnosis in this whole module.',
  ].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // Commands and UNC paths render as code with one backslash.
  assert.match(html, /<code class="its05-code">Test-NetConnection NS-FILE01 -Port 445<\/code>/);
  assert.match(html, /<code class="its05-code">gpresult \/r<\/code>/);
  assert.ok(html.includes('<code class="its05-code">\\\\SERVER\\Share</code>'), 'the UNC path, two leading backslashes');
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  // The file the curriculum check reads: four lessons with the filed titles,
  // each its filed minutes plus its share of the lab (60, 60, 45, 90).
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [
    ['Windows Server Roles & Server Manager', 180],
    ['File Sharing, Permissions & DNS/DHCP Role Awareness', 180],
    ['Logs, Services & Change Discipline', 120],
    ['Active Directory Structure: Domains, OUs, Users, Groups & Computer Objects', 240],
  ]);
}

// No diagram line is wider than the drawing (0.56 em a character, the
// estimate the drawing code wraps with), and the warning items are red.
function testDiagramsFit() {
  for (const key of ['servers', 'permissions', 'scope', 'timeline', 'tree']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS05_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
      for (const m of svg.matchAll(/<rect class="[^"]*" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) + Number(m[3]) <= Number(w) + 1 && Number(m[2]) + Number(m[4]) <= Number(h) + 1, `${key} ${layout}: a box fits`);
      }
    }
  }
  ['wide', 'narrow'].forEach((layout) => {
    ['servers', 'permissions', 'tree'].forEach((key) => {
      assert.match(run(`ITS05_DIAGRAM_DRAW.${key}('${layout}')`), /class="its01-dg-box its05-dg-warn"/, `${key} ${layout}: the warning item is red`);
    });
  });
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its05-lab-7-1');
  assert.match(guided, /Lab 7\.1 · Guided Lab: the morning server check/);
  assert.match(guided, /\?coach=hd-m05&amp;restart=1&amp;student=/, 'Lab 7.1 launches the hd-m05 coach');
  assert.match(guided, /Start Lab 7\.1 walkthrough/);
  assert.match(guided, /A coach guides you through each step\./, 'no step count');
  assert.match(guided, /Feedback only, no score/);
  assert.match(guided, /Your instructor reviews your finished lab/, 'Lab 7.1 still gates Module 7');
  const practice = section(html, 'its05-lab-7-2');
  assert.match(practice, /Lab 7\.2 · Practice tickets \(not graded\)/);
  assert.match(practice, /\?practice=its-05&amp;student=/, 'Lab 7.2 opens practice set its-05');
  assert.match(practice, /Practice: not graded/);
  assert.match(practice, /\(7-A\)[\s\S]*\(7-B\)[\s\S]*\(7-C\)[\s\S]*\(7-D\)[\s\S]*\(7-E\)/);
  assert.equal(statusLine(html, PRACTICE), 'Finish all five tickets: resolve each one, assign it to the team that owns it, or convert it to its request.');
  // The Prove It opens nothing yet.
  const prove = section(html, 'its05-prove-it');
  assert.match(prove, /Prove It: Independent Ticket/);
  assert.match(prove, /Opens soon/);
  assert.doesNotMatch(prove, /<a |<button|\?prove=/, 'the Prove It card opens nothing');
  assert.doesNotMatch(html, /\?prove=its-05/);
  // The lab cards show the split minutes.
  assert.deepEqual(['lab-its-05-server-ad', 'lab-its-05-practice-tickets', 'lab-its-05-prove-it'].map((k) => run(`LABS.find((l) => l.key === '${k}').instructionalMinutes`)), [120, 90, 45]);
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-05-assessment-module/);
  ['its05-prove-it', 'its05-check-learn', 'its05-check-aplus', 'its05-lab-7-2', 'its05-lab-7-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));

  // Lab 7.1 still gates Module 7: a saved attempt waits for the instructor.
  const waiting = hdUser({ [GUIDED]: submitted() });
  fresh(waiting);
  assert.match(statusLine(page().view(waiting, HD), GUIDED), /^Lab 7\.1 submitted .+, waiting for instructor review$/);
  assert.equal(railRow(page().view(waiting, HD), 'its05-lab-7-1').ticked, false);
  const passed = hdUser({ [GUIDED]: { ...submitted(), reviewedAt: '2026-11-25T16:00:00Z' } });
  fresh(passed);
  assert.equal(statusLine(page().view(passed, HD), GUIDED), 'Lab 7.1 passed');
}

/* --------------------------------------------------------------- checks */

const shownOrder = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its05-answer data-check="${checkId}" data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its05-answer data-check="${checkId}" data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

function testCheckContent() {
  const all = checks();
  assert.deepEqual(Object.keys(all), ['learn', 'aplus']);
  assert.equal(all.learn.questions.length, 6, 'Learn It: six questions');
  assert.equal(all.aplus.questions.length, 8, 'A+: eight questions');
  assert.equal(all.aplus.title, 'A+ check (Core 1: 2.3, 2.4)');
  // Spec 8.1's right answers, by the choice's text.
  assert.deepEqual(all.aplus.questions.map((q) => q.choices[q.answer]), ['DHCP', 'A', 'Syslog', 'A reservation', 'Proxy server', 'Database server', 'MX', 'An exclusion']);
  assert.deepEqual(all.learn.questions.map((q) => q.choices[q.answer]), ['The security group', 'Read', 'The company policies linked to that OU don’t apply to it', '“Can anyone else on your team open it?”', 'Escalate with both events and don’t start it again', 'One scope serves one VLAN']);
  for (const [id, check] of Object.entries(all)) {
    check.questions.forEach((q, i) => {
      assert.equal(q.choices.length, 4, `${id} ${i + 1}: four choices`);
      assert.equal(q.ifWrong[q.answer], null, `${id} ${i + 1}: no If wrong line on the answer`);
      q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `${id} ${i + 1} choice ${c}: an If wrong line`); });
      assert.ok(q.why, `${id} ${i + 1}: a Why line`);
      // The letters move with the shuffle, so no line names one.
      [q.why, ...q.ifWrong].forEach((line) => { if (line) assert.doesNotMatch(line, /\b[A-D]\)|\(\*?[A-D]\*?\)|\*[A-D]\*/, `${id} ${i + 1}: no letter in "${line}"`); });
    });
  }
  // Both checks sit after Reading 5 (the Learn It check asks about OUs and
  // computer objects, which Reading 5 teaches), then the labs.
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const at = (needle) => html.indexOf(needle);
  assert.ok(at('<h4>Reading 5 · ') < at('id="its05-check-learn"'), 'Learn It check after Reading 5');
  assert.ok(at('id="its05-check-learn"') < at('id="its05-check-aplus"') && at('id="its05-check-aplus"') < at('id="its05-lab-7-1"'), 'then the A+ check, then the labs');
  // The disk-space boundary that ticket 7-C needs is taught.
  assert.ok(html.includes(esc('Delete nothing and move nothing')), 'Reading 4 teaches the disk-space boundary');
}

// Spec 8.1: options are shuffled on each attempt. Each student gets their own
// order, the same on every redraw, and a new one after Start again.
function testChoicesShuffled() {
  const all = checks();
  const names = ['m07order1', 'm07order2', 'm07order3', 'm07order4', 'm07order5'];
  const orders = {};
  for (const name of names) {
    const user = hdUser({}, name);
    fresh(user);
    const html = page().view(user, HD);
    orders[name] = {};
    for (const [id, check] of Object.entries(all)) {
      orders[name][id] = check.questions.map((_, q) => shownOrder(html, id, q));
      check.questions.forEach((_, q) => {
        assert.deepEqual([...orders[name][id][q]].sort(), [0, 1, 2, 3], `${name} ${id} ${q + 1}: every choice once`);
        assert.deepEqual(shownLetters(html, id, q), ['A', 'B', 'C', 'D'], 'letters follow the place shown');
      });
    }
    const again = page().view(user, HD);
    for (const [id, check] of Object.entries(all)) check.questions.forEach((_, q) => assert.deepEqual(shownOrder(again, id, q), orders[name][id][q], `${name} ${id} ${q + 1}: stable`));
  }
  assert.notDeepEqual(orders.m07order1, orders.m07order2, 'two students see different orders');
  const places = new Set();
  names.forEach((name) => Object.entries(all).forEach(([id, check]) => check.questions.forEach((question, q) => places.add(orders[name][id][q].indexOf(question.answer)))));
  assert.equal(places.size, 4, 'the right answer lands in every place');
  // Start again shows a new order.
  const user = hdUser({}, 'm07order1');
  fresh(user);
  page().view(user, HD);
  run('its05Answer')('aplus', 0, all.aplus.questions[0].answer);
  run('its05ResetCheck')('aplus');
  const retake = page().view(user, HD);
  assert.notDeepEqual(all.aplus.questions.map((_, q) => shownOrder(retake, 'aplus', q)), orders.m07order1.aplus, 'a retake reshuffles');
  assert.deepEqual(all.learn.questions.map((_, q) => shownOrder(retake, 'learn', q)), orders.m07order1.learn, 'the other check keeps its order');
}

function testChecksCompleteAtSeventyPercent() {
  const all = checks();
  const answer = run('its05Answer');
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const saved = (user) => LabRuntime.load(STATE_ID, user, {});

  // A wrong first pick shows its If wrong line only, never the Why.
  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const q0 = all.aplus.questions[0];
  answer('aplus', 0, wrong(q0));
  let block = checkBlock(page().view(user, HD), 'aplus');
  assert.ok(block.includes(esc(q0.ifWrong[wrong(q0)])));
  assert.equal(q0.ifWrong.filter((line) => line && block.includes(esc(line))).length, 1);
  assert.ok(!block.includes(esc(q0.why)));
  assert.match(block, /Not quite\./);
  assert.doesNotMatch(block, /is-answer/, 'nothing marks the right answer');
  answer('aplus', 0, q0.answer);
  assert.ok(checkBlock(page().view(user, HD), 'aplus').includes(esc(q0.why)), 'the right pick shows the Why');

  // A+: 6 of 8 first picks right (questions 1 and 2 wrong first) completes it,
  // saves only its own flag and time, and ticks only its rail row.
  answer('aplus', 1, wrong(all.aplus.questions[1]));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  let state = saved(user);
  assert.equal(state.aplusCheckCompleted, true);
  assert.ok(state.aplusCheckCompletedAt);
  assert.notEqual(state.learnCheckCompleted, true, 'the Learn It check is still open');
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([state.score, state.bestScore], [0, 0], 'no score saved (the runtime’s own fields stay 0)');
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /A\+ check \(Core 1: 2\.3, 2\.4\) complete/);
  assert.equal(railRow(html, 'its05-check-aplus').ticked, true);
  assert.equal(railRow(html, 'its05-check-learn').ticked, false);

  // Learn It: 5 of 6 completes it.
  answer('learn', 0, wrong(all.learn.questions[0]));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.equal(state.learnCheckCompleted, true);
  assert.ok(state.learnCheckCompletedAt);
  html = page().view(user, HD);
  assert.equal(railRow(html, 'its05-check-learn').ticked, true);
  assert.equal(inserts().length, 0, 'the checks save no lab attempt');

  // Another student: 5 of 8 and 4 of 6 are retakes, nothing saved.
  user = hdUser({}, 'm07page2');
  fresh(user);
  html = page().view(user, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./, 'another student starts fresh');
  [0, 1, 2].forEach((i) => answer('aplus', i, wrong(all.aplus.questions[i])));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  [0, 1].forEach((i) => answer('learn', i, wrong(all.learn.questions[i])));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.notEqual(state.aplusCheckCompleted, true, '5 of 8 is not a pass');
  assert.notEqual(state.learnCheckCompleted, true, '4 of 6 is not a pass');
  html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /Retake: you need 6 of 8/);
  assert.match(checkBlock(html, 'learn'), /Retake: you need 5 of 6/);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm07save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  checks().learn.questions.forEach((q, i) => run('its05Answer')('learn', i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its05-check-learn').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'learn'), /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its05-check-retry="learn"/);
  assert.equal(railRow(html, 'its05-check-learn').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).learnCheckCompleted, true);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-05' }], error: null });
  run('its05RetryCheckSave')('learn');
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(checkBlock(html, 'learn'), /Learn It knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).learnCheckCompleted, true);
}

/* ---------------------------------------------------------- Lab 7.1 save */

const checkTicket = (status = 'Resolved', id = 'HD-2189') => ({ id, number: 'INC0010500', status, console: { matrix: { impact: '3', urgency: '3', priority: 'P5' } } });
const raisedTicket = (raisedFrom = 'HD-2189') => ({ id: 'HD-2190', number: 'INC0010501', status: 'Assigned', ...(raisedFrom ? { raisedFrom } : {}), console: { matrix: { impact: '2', urgency: '2', priority: 'P3' } } });
const labWork = (tickets = [checkTicket(), raisedTicket()]) => ({ version: 1, tickets });
const coachMessage = (source, work, student = studentOf(signedIn)) => ({ data: { type: 'mnt-coach-complete', id: 'hd-m05', nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved and the simulator hears why. The check
  // must be resolved, and HD-2190 must have been raised from it.
  for (const work of [
    labWork([checkTicket('In Progress'), raisedTicket()]),
    labWork([checkTicket()]),
    labWork([checkTicket(), raisedTicket(null)]),
    labWork([checkTicket(), raisedTicket('HD-2191')]),
    labWork([checkTicket('Resolved', 'HD-2108'), raisedTicket()]),
    labWork([]),
  ]) {
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
  await page().onMessage(coachMessage(catcher.source, labWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, labWork()), origin: 'https://elsewhere.test' });
  assert.equal(inserts().length, 0);

  // HD-2189 resolved and HD-2190 raised from it: one Lab 7.1 attempt, then the
  // page shows it waiting for the instructor (still the gating lab).
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 7.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
  assert.deepEqual(row.result.work.tickets.map((t) => [t.id, t.raisedFrom || null]), [['HD-2189', null], ['HD-2190', 'HD-2189']]);
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  assert.match(statusLine(page().view(user, HD), GUIDED), /waiting for instructor review$/);
  await page().onMessage(coachMessage(replyCatcher().source, labWork()));
  assert.equal(inserts().length, 1, 'finishing again sends nothing new');

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

/* ---------------------------------------------------------- Lab 7.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-05' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves the same tickets the simulator's set needs done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-05': \{ title:'Module 7 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-05 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-05', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-05', nonce: 'p-1', saved: true }, origin: SIM }]);
  const html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 7.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its05-lab-7-2').ticked, true);
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1, 'again: answered as saved, nothing inserted');

  // Already in the database (another browser saved it): not saved twice.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: [{ completed_at: '2026-11-25T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  const known = replyCatcher();
  await page().onMessage(practiceMessage(known.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(known.replies.map((r) => r.data.saved), [true]);

  // Refused: wrong tickets, another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['four tickets', { tickets: TICKETS.slice(0, 4) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2202'] }, 'incomplete'],
    ['a related record instead', { tickets: ['HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2202'] }, 'incomplete'],
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
  // Module 6's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-07', tickets: ['HD-2177', 'HD-2178', 'HD-2179'] }));
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
  assert.doesNotMatch(statusLine(page().view(user, HD), PRACTICE), /Complete/);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 7.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-25T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm07p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-05', tickets: TICKETS } });
  assert.match(html, /Module 07 · Lab 7\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2191, HD-2192, HD-2193, HD-2194, HD-2195/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 7.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), true, 'Lab 7.1 still is, until the Prove It gates the module');
  const guided = sheet.render({ ...base, id: 'm07g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 07 · Lab 7\.1 · Guided Lab: the morning server check/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m07-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testCheckContent, testChoicesShuffled, testChecksCompleteAtSeventyPercent, testCheckSaveThatFails, testGuidedLabSave, testPracticeSave, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m07-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

// Help Desk Module 4 (key its-02) course page, portal/it-support-module-02.js,
// on the Module 1 to 3 page pattern:
//
//   - The catalogue: the four filed lessons unchanged; Lab 4.3 25 min and
//     Lab 4.4 15 min (were 30 and 30) and a new 20-minute Prove It, all
//     ITHD-101.4; the two VM labs stay 90 + 90 under ITHD-101.3. 480 + 180 =
//     660 minutes in all. No lab text names HD-2106 or HD-2112.
//   - The page: shown as Module 4 in week 2, four lessons (4.1 to 4.4), three
//     readings, four diagrams, the commands table in Lesson 4.2, one plain
//     line that the VM is simulated, and no "Module 2", "VirtualBox install",
//     "D28" or "Oracle".
//   - The card sort: a wrong box shows only its If wrong line; every card in
//     its box saves "complete" to the case state, never a pick.
//   - The Lesson 4.2 check: complete once all four have a first answer.
//   - The A+ check: shuffled per student; 6 of 7 first answers right saves
//     "complete"; 4 of 7 doesn't; a failed save takes the tick off again.
//   - The lab cards: three coaches, the practice set, and a Prove It card
//     that opens nothing yet. The instructor sheets use the new labels.
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

const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const page = () => run(`MODULE_LABS['it-support/4']`);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its02-lab-state-v1';
const LAB41 = 'lab-its-02-vm-build';
const LAB42 = 'lab-its-02-vm-snapshot-server';
const LAB43 = 'lab-its-02-device-manager';
const LAB44 = 'lab-its-02-print-spooler';
const PROVE = 'lab-its-02-prove-it';

function hdUser(attempts = {}, name = 'm04page') {
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
  run('its02ResetPicks()');
  signedIn = user;
}
const inserts = () => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert');
async function quiet(fn) {
  const original = ctx.console.error;
  ctx.console.error = () => {};
  try { return await fn(); } finally { ctx.console.error = original; }
}
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 8; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
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

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-02'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.creditMinutes, m.lessons, m.labs], [4, 2, 660, 660, 4, 5]);
  assert.equal(m.title, 'Building Your Lab Environment & Supporting Hardware, Devices & Peripherals', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes, item.parentAllocations.map((a) => `${a.code}=${a.minutes}`).join()])), [
    ['its-02-lesson-01', 'Virtualization Fundamentals & Building Your First VM', 150, 'ITHD-101.3=150'],
    ['its-02-lesson-02', 'VM Snapshots, Recovery & Building a Server Environment', 150, 'ITHD-101.3=150'],
    ['its-02-lesson-03', 'Windows Device & Storage Management', 60, 'ITHD-101.4=60'],
    ['its-02-lesson-04', 'Printer & Peripheral Triage', 60, 'ITHD-101.4=60'],
  ], 'the filed lesson keys, titles, minutes and parent courses');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-02'));
  assert.deepEqual(labs.map((l) => [l.key, l.instructionalMinutes, l.parentAllocations.map((a) => `${a.code}=${a.minutes}`).join()]), [
    [LAB41, 90, 'ITHD-101.3=90'],
    [LAB42, 90, 'ITHD-101.3=90'],
    [LAB43, 25, 'ITHD-101.4=25'],
    [LAB44, 15, 'ITHD-101.4=15'],
    [PROVE, 20, 'ITHD-101.4=20'],
  ]);
  assert.deepEqual(labs.map((l) => l.title), [
    'Build Your Windows Client VM',
    'Snapshot, Recover & Connect Client to Server',
    'Lab 4.3 · Guided Lab: printers and peripherals',
    'Lab 4.4 · Practice tickets (not graded)',
    'Prove It: Independent Ticket',
  ], 'the two VM labs keep their filed titles');
  // The Prove It gates completion (the its02 Prove It migration); the four
  // older labs are Practice It.
  assert.deepEqual(labs.map((l) => l.phase || null), ['practice', 'practice', 'practice', 'practice', null]);
  const byParent = {};
  m.curriculumItems.concat(labs).forEach((item) => item.parentAllocations.forEach((a) => { byParent[a.code] = (byParent[a.code] || 0) + a.minutes; }));
  assert.deepEqual(byParent, { 'ITHD-101.3': 480, 'ITHD-101.4': 180 }, 'filed minutes per parent course unchanged');
  assert.doesNotMatch(JSON.stringify(labs), /HD-2106|HD-2112/, 'no lab text names the old tickets');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its02-shell"/);
  assert.match(html, /Module 04 · 11 Hours · Week 2/, 'the hero shows Module 04, 660 minutes and week 2');
  assert.ok(html.includes(esc(run('ITS02_OBJECTIVE'))), 'the hero shows the weekly objective');
  const text = words(html);
  // No old number, no plan label and nothing that sends a student to install
  // software on their own computer.
  assert.doesNotMatch(text, /Module 0?2\b|\bD28\b|Oracle|install VirtualBox|VirtualBox install|your computer’s memory/i);
  const m = HD.modules['its-02'];
  const catalogue = `${m.summary} ${m.skills.join(' ')} ${m.curriculumItems.map((i) => `${i.objective} ${i.learn} ${i.practice} ${i.prove}`).join(' ')} ${run('LABS').filter((l) => l.module === 'its-02').map((l) => `${l.title} ${l.objective} ${l.description}`).join(' ')}`;
  assert.doesNotMatch(catalogue, /Module 0?2\b|\bD28\b|Oracle|VirtualBox/);
  // Said once, in plain words: the VM is simulated, not real Windows.
  assert.equal((text.match(/isn’t a real Windows installation/g) || []).length, 1, 'one plain line that the VM is simulated');
  assert.deepEqual([...html.matchAll(/<strong>Lesson (4\.\d) · /g)].map((x) => x[1]), ['4.1', '4.2', '4.3', '4.4'], 'four lessons, 4.1 to 4.4');
  [1, 2, 3].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.equal((html.match(/<figure /g) || []).length, 4, 'four diagrams');
  ['One real computer, many virtual ones', 'Network modes: who can a VM talk to?', 'Everything on the dock is dead? Start where the power comes in', 'Where a print job travels, and the order to fix it'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${title.replace(/\?/g, '\\?')}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  // Lesson 4.2: "Your first commands", then the commands table, then the check.
  const lesson42 = html.slice(html.indexOf('data-its02-lesson="its-02-lesson-02"'), html.indexOf('data-its02-lesson="its-02-lesson-03"'));
  const order = ['<h4>Your first commands</h4>', '<caption>The commands Module 4 uses</caption>', 'data-its02-check="build"'].map((s) => lesson42.indexOf(s));
  assert.ok(order.every((i) => i > 0) && order[0] < order[1] && order[1] < order[2], 'Your first commands, the table and the check, in that order, in Lesson 4.2');
  ['ping 10.0.5.10', 'Get-Service Spooler', 'Get-PrintJob -PrinterName NS-HR-MFP01', 'Stop-Service Spooler', 'Start-Service Spooler', 'Get-Printer -Name NS-HR-LABEL01 | Format-List Name, PortName, DriverName', 'Test-NetConnection 10.20.70.20 -Port 9100']
    .forEach((cmd) => assert.ok(lesson42.includes(`<code class="its02-code">${esc(cmd)}</code>`), `the table shows ${cmd} as a command`));
  assert.ok(lesson42.includes(esc('Commands are a job skill, and a head start on A+ Core 2. Core 1 tests what they reveal (ports, drivers, connectivity), not the commands themselves.')));
  // The card sort sits in Lesson 4.1, the A+ check in its own section.
  const lesson41 = html.slice(html.indexOf('data-its02-lesson="its-02-lesson-01"'), html.indexOf('data-its02-lesson="its-02-lesson-02"'));
  assert.match(lesson41, /data-its02-cardsort/);
  assert.match(section(html, 'its02-checks'), /data-its02-check="aplus"/);
  // The file the curriculum check reads: four lessons with the filed titles
  // and page minutes (lesson plus lab).
  const source = fs.readFileSync(path.join(ROOT, 'portal/it-support-module-02.js'), 'utf8');
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((x) => [x[1].replace(/\\'/g, "'"), Number(x[2])]);
  assert.deepEqual(pairs, [
    ['Virtualization Fundamentals & Building Your First VM', 240], ['VM Snapshots, Recovery & Building a Server Environment', 240],
    ['Windows Device & Storage Management', 90], ['Printer & Peripheral Triage', 90],
  ]);
}

// No diagram line is wider than its drawing (0.56 em a character, the
// estimate the drawing code wraps with), and nothing falls below it.
function testDiagramsFit() {
  for (const key of ['cloud', 'modes', 'dock', 'print']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS02_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      assert.doesNotMatch(svg, /NaN|undefined/, `${key} ${layout}: every number is drawn`);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const width = m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        const left = m[4].includes('middle') ? Number(m[2]) - width / 2 : Number(m[2]);
        assert.ok(left >= -1 && left + width <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
      for (const m of svg.matchAll(/<rect class="[^"]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) + Number(m[3]) <= Number(w) + 1 && Number(m[2]) + Number(m[4]) <= Number(h) + 1, `${key} ${layout}: every box fits`);
      }
    }
  }
  // The words a screen reader hears include each panel's and step's words.
  const modes = run(`its02DiagramWords('modes')`);
  ['NAT: the VM reaches the internet through the host', 'Internal: VMs talk only to each other'].forEach((s) => assert.ok(modes.includes(s)));
  assert.ok(run(`its02DiagramWords('dock')`).includes('Never charge it or press on it.'));
  assert.ok(run(`its02DiagramWords('print')`).includes('step 3: Untick Use Printer Offline'));
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(section(html, 'its02-lab-2-1'), /\?coach=hd-m02-vm&amp;restart=1&amp;student=/, 'Lab 4.1 launches the hd-m02-vm coach');
  assert.match(section(html, 'its02-lab-2-1'), /Lab 4\.1 · Guided Lab: build a Windows client VM \(checked, not graded\)/);
  assert.match(section(html, 'its02-lab-2-2'), /\?coach=hd-m02-server&amp;restart=1&amp;student=/, 'Lab 4.2 launches the hd-m02-server coach');
  assert.match(section(html, 'its02-lab-2-2'), /Lab 4\.2 · Guided Lab: snapshot, server and a virtual desktop \(checked, not graded\)/);
  assert.match(section(html, 'its02-lab-2-3'), /\?coach=hd-m02&amp;restart=1&amp;student=/, 'Lab 4.3 launches the hd-m02 coach');
  assert.match(section(html, 'its02-lab-2-3'), /Lab 4\.3 · Guided Lab: printers and peripherals/);
  assert.match(section(html, 'its02-lab-2-3'), /Feedback only, no score/);
  const practice = section(html, 'its02-lab-2-4');
  assert.match(practice, /\?practice=its-02&amp;student=/, 'Lab 4.4 opens practice set its-02');
  assert.match(practice, /Lab 4\.4 · Practice tickets/);
  assert.match(practice, /Practice: not graded/);
  const prove = section(html, 'its02-prove-it');
  assert.match(prove, /Prove It: Independent Ticket/);
  assert.doesNotMatch(prove, /Opens soon/);
  assert.match(prove, /data-its02-prove-launch href="[^"]*\?prove=its-02&amp;student=/, 'the Prove It card opens the simulator shift');
  ['its02-prove-it', 'its02-checks'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));
  assert.equal(railRow(html, 'its02-prove-it').text, 'Assessment Lab');
  assert.doesNotMatch(html, /its-02-assessment-module/, 'no generic Assessment Lab box');
}

/* ------------------------------------------------------------ card sort */

function testCardSort() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const sort = copy(run('ITS02_CARD_SORT'));
  assert.deepEqual(sort.cards.map((c) => c.answer).sort(), ['IaaS', 'PaaS', 'SaaS']);
  const pick = run('its02Sort');
  const view = () => page().view(user, HD);
  const first = sort.cards[0];
  const wrongBox = sort.buckets.find((b) => b !== first.answer);
  pick(first.id, wrongBox);
  let html = view();
  assert.ok(html.includes(esc(first.ifWrong[wrongBox])), 'a wrong box shows its If wrong line');
  assert.ok(!html.includes(esc(first.why)), 'and not the Why');
  assert.doesNotMatch(html.slice(html.indexOf('data-its02-cardsort')), /its02-sort-box is-answer/, 'the right box is never marked for the student');
  pick(first.id, first.answer);
  assert.ok(view().includes(esc(first.why)), 'the right box shows the Why');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).cardSortCompleted, true, 'not complete with one card left');
  sort.cards.slice(1).forEach((c) => pick(c.id, c.answer));
  const saved = LabRuntime.load(STATE_ID, user, {});
  assert.equal(saved.cardSortCompleted, true);
  assert.ok(saved.cardSortCompletedAt);
  assert.deepEqual(Object.keys(saved).filter((k) => /pick|answer|sort(?!Completed)/i.test(k) && !/cardSortCompleted/.test(k)), [], 'no picks saved');
  assert.match(view(), /Cloud models card sort complete/);
  assert.equal(inserts().length, 0, 'the card sort saves no attempt');
}

/* ------------------------------------------------------------- checks */

const shownOrder = (html, key, q) => [...html.matchAll(new RegExp(`data-its02-answer="${key}" data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));

function testChecksAreWellFormed() {
  const checks = copy(run('ITS02_CHECKS'));
  assert.equal(checks.build.questions.length, 4);
  assert.equal(checks.aplus.questions.length, 7);
  ['build', 'aplus'].forEach((key) => checks[key].questions.forEach((q, i) => {
    assert.equal(q.choices.length, 4, `${key} ${i + 1}: four choices`);
    assert.equal(q.ifWrong[q.answer], null, `${key} ${i + 1}: no If wrong line on the answer`);
    q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `${key} ${i + 1} choice ${c}: an If wrong line`); });
    assert.ok(q.why, `${key} ${i + 1}: a Why line`);
  }));
}

function testChoicesAreShuffledPerStudent() {
  const answers = copy(run('ITS02_CHECKS')).aplus.questions.map((q) => q.answer);
  const places = answers.map(() => new Set());
  const orders = new Set();
  for (let i = 0; i < 40; i += 1) {
    const user = hdUser({}, `m04shuffle${i}`);
    fresh(user);
    const html = page().view(user, HD);
    const seen = answers.map((_, q) => shownOrder(html, 'aplus', q));
    seen.forEach((order, q) => {
      assert.deepEqual([...order].sort(), [0, 1, 2, 3], `student ${i} question ${q + 1}: every choice once`);
      places[q].add(order.indexOf(answers[q]));
    });
    orders.add(JSON.stringify(seen));
    assert.deepEqual(answers.map((_, q) => shownOrder(page().view(user, HD), 'aplus', q)), seen, 'the same student sees the same order again');
  }
  assert.ok(orders.size > 30, 'students see different orders');
  places.forEach((set, q) => assert.equal(set.size, 4, `question ${q + 1}: the right answer takes every position`));
}

function testBuildCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS02_CHECKS')).build;
  const answer = run('its02Answer');
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  // Every first answer wrong still completes this check: it isn't scored.
  check.questions.slice(0, 3).forEach((q, i) => answer('build', i, wrong(q)));
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).buildCheckCompleted, true, 'not complete with one question left');
  answer('build', 3, wrong(check.questions[3]));
  const saved = LabRuntime.load(STATE_ID, user, {});
  assert.equal(saved.buildCheckCompleted, true);
  assert.notEqual(saved.aplusCheckCompleted, true, 'the A+ check is separate');
  const html = page().view(user, HD);
  assert.match(html, /Lesson 4\.2 check complete/);
  assert.doesNotMatch(html, /Retake/);
  assert.equal(railRow(html, 'its02-checks').ticked, false, 'the rail tracks the A+ check only');
}

function testAplusCheck() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const check = copy(run('ITS02_CHECKS')).aplus;
  const answer = run('its02Answer');
  const view = () => page().view(user, HD);
  const wrong = (q) => (q.answer + 1) % q.choices.length;

  answer('aplus', 0, wrong(check.questions[0]));
  let html = view();
  assert.ok(html.includes(esc(check.questions[0].ifWrong[wrong(check.questions[0])])));
  assert.ok(!html.includes(esc(check.questions[0].why)));
  assert.doesNotMatch(section(html, 'its02-checks'), /is-answer/);
  answer('aplus', 0, check.questions[0].answer);
  assert.ok(view().includes(esc(check.questions[0].why)));

  // 1 wrong first answer + 6 right = 6 of 7: complete, saved.
  check.questions.slice(1).forEach((q, i) => answer('aplus', i + 1, q.answer));
  let saved = LabRuntime.load(STATE_ID, user, {});
  assert.equal(saved.aplusCheckCompleted, true);
  assert.ok(saved.aplusCheckCompletedAt);
  assert.deepEqual([saved.score, saved.bestScore], [0, 0], 'no score saved');
  html = view();
  assert.match(html, /A\+ check complete/);
  assert.equal(railRow(html, 'its02-checks').ticked, true);
  assert.equal(inserts().length, 0, 'the check saves no attempt');

  // 3 wrong first answers = 4 of 7: a retake, nothing saved. Another student
  // signing in starts fresh.
  const other = hdUser({}, 'm04page2');
  ctx.localStorage.clear();
  signedIn = other;
  html = page().view(other, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./);
  [0, 1, 2].forEach((i) => answer('aplus', i, wrong(check.questions[i])));
  check.questions.forEach((q, i) => answer('aplus', i, q.answer));
  saved = LabRuntime.load(STATE_ID, other, {});
  assert.notEqual(saved.aplusCheckCompleted, true);
  assert.match(page().view(other, HD), /Retake: you need 5 of 7/);
}

// Same browser, no sign-out: a second student sees none of the first
// student's card sort, Lesson 4.2 check or A+ check picks or completions.
function testSecondStudentStartsFresh() {
  const first = hdUser({}, 'm04first');
  fresh(first);
  page().view(first, HD);
  const sort = copy(run('ITS02_CARD_SORT'));
  const checks = copy(run('ITS02_CHECKS'));
  const wrongBox = sort.buckets.find((b) => b !== sort.cards[0].answer);
  run('its02Sort')(sort.cards[0].id, wrongBox);
  sort.cards.forEach((c) => run('its02Sort')(c.id, c.answer));
  checks.build.questions.forEach((q, i) => run('its02Answer')('build', i, q.answer));
  checks.aplus.questions.forEach((q, i) => run('its02Answer')('aplus', i, q.answer));
  assert.match(page().view(first, HD), /Cloud models card sort complete[\s\S]*Lesson 4\.2 check complete|Lesson 4\.2 check complete[\s\S]*Cloud models card sort complete/);

  const second = hdUser({}, 'm04second');
  signedIn = second;
  const html = page().view(second, HD);
  assert.doesNotMatch(html, /card sort complete|Lesson 4\.2 check complete|A\+ check complete/, 'no completion of the first student');
  assert.doesNotMatch(html, /its02-sort-box is-(wrong|answer)|Right box:|Not this box\./, 'no card sort picks');
  assert.doesNotMatch(html, /Not quite\.|Correct\./, 'no check answers');
  const saved = LabRuntime.load(STATE_ID, second, {});
  assert.notEqual(saved.cardSortCompleted, true);
  assert.notEqual(saved.buildCheckCompleted, true);
  assert.notEqual(saved.aplusCheckCompleted, true);
  assert.equal(railRow(html, 'its02-checks').ticked, false);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm04save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  copy(run('ITS02_CHECKS')).aplus.questions.forEach((q, i) => run('its02Answer')('aplus', i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its02-checks').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(html, /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its02-retry="aplus"/);
  assert.equal(railRow(html, 'its02-checks').ticked, false, 'the tick comes off');
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-02' }], error: null });
  run('its02RetrySave')('aplus');
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(html, /A\+ check complete \(/);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-23T15:00:00Z' };
  const practice = sheet.render({ ...base, id: 'm04p-1', lab_key: LAB44, result: { source: 'mnt-practice-complete', practiceSet: 'its-02', tickets: ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'] } });
  assert.match(practice, /Module 04 · Lab 4\.4 · Practice tickets/);
  const guided = sheet.render({ ...base, id: 'm04g-1', lab_key: LAB43, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 04 · Lab 4\.3 · Guided Lab: printers and peripherals/);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testCardSort, testChecksAreWellFormed, testChoicesAreShuffledPerStudent, testBuildCheck, testAplusCheck, testSecondStudentStartsFresh, testCheckSaveThatFails, testInstructorSheets];
  for (const test of tests) await test();
  console.log(`hdesk-m04-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

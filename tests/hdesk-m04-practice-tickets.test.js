'use strict';
// Help Desk Module 4 (key its-02) Practice It, Lab 4.4 · Practice tickets
// (not graded): the practice set 'its-02' (ui/helpdesk-data.js), opened with
// ?practice=its-02. Four tickets, each on its own clock (console.now):
//
//   - 4-A HD-2169 (INC0010472): a hot desk dock with no power. Resolved.
//   - 4-B HD-2170 (INC0010473): a swollen battery. Done when it is with
//     Desktop Support (Tier 2) with a complete note (the set's done rule).
//   - 4-C HD-2171 (INC0010475): a badge printer, six jobs and the offline flag.
//   - 4-D HD-2172 (INC0010476): a hung virtual desktop session.
//
// Each ticket is worked end to end with the spec's model notes and comments
// (spec 8.5 and section 7), and "Check my work" passes every area. Critical
// moves show as feedback. The set reports completion once, after all four,
// with the ticket ids only. Feedback only, never points.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const DESK2 = 'Desktop Support (Tier 2)';
const IDS = ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'];
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null } = {}) {
  const u = new URL('https://academy.test/sim/?practice=its-02&student=student-m04p0001#/helpdesk/tickets');
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: store(), sessionStorage: store(), opener,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  vm.runInContext('hdNowMs = () => 1000000;', ctx);
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  const tab = {
    ctx, toasts, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    search: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions`)),
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    checkWork: (id) => run(`hdConsoleCheckWork(${j(id)})`),
    closed: () => run('hdPracticeClosed()'),
  };
  return tab;
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
const shown = (html) => html.replace(/<[^>]*>/g, ' ');

// The spec's model notes (8.5) and customer texts (section 7; 4-C opens "Hi Ines").
const A_NOTE = 'Reported: hot desk 4F-12; both monitors and the desk keyboard dead on the dock; the laptop\'s screen is fine.\nTried: dock light was off and its power brick unplugged under the desk, reconnected it; set monitor 1\'s input to DisplayPort; Win + P › Extend; Display › Detect for monitor 2.\nResult: two monitors, the keyboard and the dock\'s Ethernet all working; Grace confirmed. Suggested to Facilities: label the dock power at the 4F hot desks.';
const A_COMMENT = 'Hi Grace, you\'re all set. The dock at that desk had come unplugged from power, which turns off everything attached to it. It\'s plugged back in, both monitors are working, and they\'re arranged like your old desk. If a hot desk acts up again, check for the small light on the dock first. – Riley';
const B_NOTE = 'Reported: raised trackpad that won\'t click properly, about an hour of battery, warm while charging.\nTried: the signs match a swollen battery (no physical test: it is a hazard); at 14:05 told Omar to save his work, unplug the charger, shut down and leave the laptop on a hard surface; requested loaner LT-LOAN-04.\nResult: laptop out of use; escalated to Desktop Support for the swap.\nNext action: Desktop Support collects NS-LT-0183 and confirms a pickup time with Omar within the hour.';
const B_COMMENT = 'Hi Omar, thanks for asking. It\'s not a setting. A raised trackpad usually means the battery inside is swelling, which can be a safety risk, so please keep the laptop off and unplugged. Our desktop team will swap it out, and we\'re setting you up with a loaner today with your OneDrive files on it. We\'ll confirm a pickup time within the hour. – Riley';
const C_NOTE = 'Reported: badge printer shows Offline with a visitor waiting; print clicked five or more times.\nTried: six jobs queued, the first in Error, removed all six; Use Printer Offline was ticked on NS-WS-0101, unticked it; the printer answers on port 9100; asked Ines to print once.\nResult: badge printed 09:07; Ines confirmed on the phone; connection to her PC closed.';
const C_COMMENT = 'Hi Ines, thanks for staying calm with a guest waiting! Your printer had been switched to "offline" on your computer, and the extra print jobs were stuck behind the first one. We cleared them and switched it back online, and your badge printed. Next time, print once and call us if nothing comes out. – Riley';
const D_NOTE = 'Reported: virtual desktop shows a black screen and a spinner; Ana restarted her laptop twice.\nTried: pool VDI-POOL-CLAIMS healthy (12 sessions Active); Ana\'s session Disconnected, hung 14 h; warned her that unsaved work in that session may be lost and she agreed at 13:40; logged the session off per KB-0072.\nResult: new session Active 13:42; desktop loaded; Ana confirmed her apps open.';
const D_COMMENT = 'Hi Ana, your work desktop was stuck in an old session on our server, so restarting your laptop couldn\'t reach it. We cleared that session and you\'re back in with a fresh one. Files you had already saved are safe; only unsaved changes in the stuck session may be lost. If the black screen comes back, message us and we can clear it in a minute. – Riley';

function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET.key'), 'its-02');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), IDS);
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2169'), '2026-08-19T09:30:00.000Z');
  assert.equal(now('HD-2170'), '2026-08-20T14:00:00.000Z');
  assert.equal(now('HD-2171'), '2026-08-21T09:02:00.000Z');
  assert.equal(now('HD-2172'), '2026-08-18T13:35:00.000Z');
  assert.equal(new Set(IDS.map(now)).size, 4, 'four different clocks');
  IDS.forEach((id) => assert.equal(tab.ticket(id).priority, '', `${id} opens with no priority`));
  assert.equal(tab.run('HD_VM'), null, 'no VM screen in the practice set');
  // Students see INC numbers only.
  const queue = shown(tab.view('helpdesk/tickets'));
  ['INC0010472', 'INC0010473', 'INC0010475', 'INC0010476'].forEach((number) => assert.match(queue, new RegExp(number)));
  IDS.forEach((id) => assert.doesNotMatch(shown(tab.open(id)), /\bHD-21\d\d\b/, `${id} shows its INC number only`));
}

/* ---------------------------------------------------------------- 4-A */

function work4A(tab) {
  const id = 'HD-2169'; const pc = 'NS-LT-0205';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Docking station', 'DOCK-4F-12', '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.ask(id, 'light');
  assert.match(tab.open(id), /No, no light at all\./);
  tab.ask(id, 'brick');
  let html = tab.screen(pc, 'dock');
  assert.match(html, /data-hd-dock="dark"/);
  assert.match(tab.screen(pc, 'settings-network'), /data-hd-ethernet="unplugged"/);
  tab.run(`hdDockDo('${pc}', 'power')`);
  tab.run(`hdDockDo('${pc}', 'input', 'desk-left', 'DisplayPort')`);
  tab.run(`hdDockDo('${pc}', 'project', 'Extend')`);
  tab.run(`hdDockDo('${pc}', 'detect')`);
  html = tab.screen(pc, 'dock');
  assert.match(html, /Dock light: on/);
  assert.match(html, /Keyboard: working/);
  assert.match(html, /data-hd-monitor="desk-left" data-hd-monitor-state="picture"/);
  assert.match(html, /data-hd-monitor="desk-right" data-hd-monitor-state="picture"/);
  assert.match(tab.screen(pc, 'settings-network'), /Ethernet \(Dock USB Ethernet\): Connected/);
  tab.ask(id, 'screens');
  assert.match(tab.open(id), /Yes, both of them/);
  tab.note(id, A_NOTE);
  tab.comment(id, A_COMMENT);
  tab.resolve(id, 'Reconnected the dock power, set the monitor input, Extend and Detect. Grace confirmed.');
  assert.equal(tab.ticket(id).status, 'Resolved');
}
function test4A() {
  const tab = sim(); const id = 'HD-2169';
  // Before the work: "Check my work" names what is missing.
  tab.open(id);
  tab.checkWork(id);
  assert.ok(tab.feedback(id).areas.some((area) => !area.ok));
  work4A(tab);
  tab.checkWork(id);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  // Ordering a replacement is the critical error, shown as feedback.
  const order = sim(); order.open(id); order.run(`hdConsoleAction('${id}', 'order-dock')`);
  assert.match(order.open(id), /Critical error\. Never order replacement hardware before you check the dock/);
  assert.equal(order.feedback(id).critical.length, 1);
}

/* ---------------------------------------------------------------- 4-B */

function work4B(tab) {
  const id = 'HD-2170';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Battery', 'NS-LT-0183', '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.ask(id, 'charging');
  // Safety first: the steps, then the check that the laptop is off.
  tab.run(`hdConsoleAction('${id}', 'safety')`);
  tab.ask(id, 'done', 'files');
  assert.match(tab.open(id), /Done\. It's off, unplugged and on the desk\./);
  tab.kb(id, 'damaged laptop', 'KB-0071');
  tab.run(`hdConsoleAction('${id}', 'loaner')`);
  tab.run(`hdMatrixAssignGroup('${id}', ${JSON.stringify(DESK2)})`);
  tab.note(id, B_NOTE);
  tab.comment(id, B_COMMENT);
}
function test4B() {
  const tab = sim(); const id = 'HD-2170';
  work4B(tab);
  assert.equal(tab.ticket(id).status, 'Escalated', 'with Desktop Support, not resolved');
  assert.equal(tab.ticket(id).assignmentGroup, DESK2);
  // The set's done rule: Desktop Support and a complete note.
  [{ group: DESK2 }, { note: true }].forEach((rule) => assert.equal(tab.run(`hdConsoleRule(hdTicketById('${id}'), ${JSON.stringify(rule)})`), true, JSON.stringify(rule)));
  tab.checkWork(id);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  // Safety came first: before the loaner and the escalation.
  const order = tab.actions(id).map((a) => a.id);
  assert.ok(order.indexOf('safety') >= 0 && order.indexOf('safety') < order.indexOf('loaner'));
  // Both critical moves show critical feedback.
  [['keep-using', /Critical error\. A swelling battery can overheat or catch fire/], ['press', /Critical error\. Pressing on a swollen battery or opening the case/]].forEach(([action, line]) => {
    const wrong = sim(); wrong.open(id); wrong.run(`hdConsoleAction('${id}', '${action}')`);
    assert.match(wrong.open(id), line, action);
    assert.equal(wrong.feedback(id).critical.length, 1, action);
  });
  // A comment with no time is told to give one.
  const notime = sim(); notime.open(id); notime.comment(id, 'Hi Omar, our desktop team will swap it. – Riley');
  assert.match(notime.lastToast(), /Tell Omar when he will hear about the pickup/);
}

/* ---------------------------------------------------------------- 4-C */

const DESK = 'NS-WS-0101';
const BADGE = 'RECEPTION-BADGE';
function work4C(tab) {
  const id = 'HD-2171';
  const html = tab.open(id);
  assert.match(html, /<strong>Phone call<\/strong>/);
  tab.triage(id, 'Hardware', 'Printer', BADGE, '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.ask(id, 'connect');
  tab.run(`hdSelectComputer('${DESK}')`);
  const jobs = tab.ps(`Get-PrintJob -PrinterName ${BADGE}`).split('\n');
  assert.equal(jobs.length, 8, 'a header, a rule and six jobs');
  assert.match(jobs[2], /^31 .*Visitor badge .*Error$/);
  // Cancel all six while the printer is still offline.
  tab.screen(DESK, 'print-queue', { printer: BADGE });
  ['31', '32', '33', '34', '35', '36'].forEach((job) => tab.run(`hdQueueCancel('${DESK}', '${BADGE}', '${job}')`));
  assert.equal(tab.machine(DESK).printQueues[BADGE].jobs.length, 0);
  tab.ask(id, 'paper');
  assert.match(tab.ps('Test-NetConnection 10.20.10.60 -Port 9100'), /TcpTestSucceeded : True$/);
  tab.run(`hdQueueToggle('${DESK}', '${BADGE}', 'offline')`);
  assert.match(tab.view('helpdesk/print-queue'), /Status: Ready/);
  tab.ask(id, 'print-once');
  assert.match(tab.open(id), /One badge came out\. The visitor has it\./);
  tab.note(id, C_NOTE);
  tab.comment(id, C_COMMENT);
  tab.resolve(id, 'Cleared six duplicate jobs, unticked Use Printer Offline; one badge printed.');
  assert.equal(tab.ticket(id).status, 'Resolved');
}
function test4C() {
  const tab = sim(); const id = 'HD-2171';
  work4C(tab);
  tab.checkWork(id);
  allOk(tab.feedback(id), id);
  assert.equal(tab.machine(DESK).printQueues[BADGE].printed.length, 0, 'the cleared duplicates never print');
  assert.ok(!(plain(tab.run(`hdConsoleState(hdTicketById('${id}')).arrived || []`)).some((a) => a.id === 'six-badges')));
  // Restarting the spooler with the six jobs queued sends all six again.
  const wrong = sim();
  wrong.open(id); wrong.run(`hdSelectComputer('${DESK}')`);
  wrong.ps('Stop-Service Spooler'); wrong.ps('Start-Service Spooler');
  const start = wrong.actions(id).find((a) => a.id === 'spooler-start');
  assert.ok(start, 'spooler-start recorded');
  assert.equal(start.queued, 6);
  wrong.screen(DESK, 'print-queue', { printer: BADGE });
  wrong.run(`hdQueueToggle('${DESK}', '${BADGE}', 'offline')`);
  const printed = wrong.machine(DESK).printQueues[BADGE].printed;
  assert.equal(printed.length, 6, 'six badges print');
  assert.ok(printed.every((job) => job.document === 'Visitor badge'));
  assert.ok(plain(wrong.run(`hdConsoleState(hdTicketById('${id}')).arrived || []`)).some((a) => a.id === 'six-badges'));
  assert.match(wrong.open(id), /Six badges just came out of the printer/);
  // Unticking the flag first, with the jobs still queued, prints nothing: the
  // first job is in Error.
  const early = sim();
  early.open(id); early.screen(DESK, 'print-queue', { printer: BADGE });
  early.run(`hdQueueToggle('${DESK}', '${BADGE}', 'offline')`);
  assert.equal(early.machine(DESK).printQueues[BADGE].printed.length, 0);
  // Before the flag is unticked, Ines says nothing printed.
  const before = sim();
  before.open(id); before.ask(id, 'print-once');
  assert.match(before.open(id), /Nothing is coming out\. It still says Offline\./, 'the reply waits for the flag');
  // Known limit: the reply waits for the flag only (one afterAction), so on
  // the early path Ines still says one badge came out. "Check my work" names
  // the jobs that were never cleared.
  early.ask(id, 'print-once');
  const action = early.feedback(id).areas.find((area) => area.area === 'Action');
  assert.equal(action.ok, false);
  assert.match(action.text, /Cancel all six badge jobs/);
}

/* ---------------------------------------------------------------- 4-D */

function work4D(tab) {
  const id = 'HD-2172';
  tab.open(id);
  tab.triage(id, 'Software', 'Virtual desktop (VDI)', 'VDI-POOL-CLAIMS', '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  // Scope: the pool first.
  const html = tab.view('helpdesk/virtual-desktops');
  assert.match(html, /data-hd-vdi="VDI-POOL-CLAIMS"/);
  assert.match(html, /12 of 13 sessions Active/);
  assert.match(html, /data-hd-session="claims-ana" data-hd-session-state="hung"><td>ana\.torres<\/td><td><span class="hd-badge bad">Disconnected – hung<\/span><\/td><td>14 h/);
  tab.ask(id, 'others');
  tab.kb(id, 'virtual desktop black screen', 'KB-0072');
  // Consent before the log-off.
  tab.ask(id, 'consent');
  tab.run("hdVdiLogOff('VDI-POOL-CLAIMS', 'claims-ana')");
  tab.ask(id, 'reconnect');
  assert.match(tab.open(id), /It's back! My desktop loaded/);
  tab.note(id, D_NOTE);
  tab.comment(id, D_COMMENT);
  tab.resolve(id, 'Logged off the hung session with Ana\'s OK; her desktop loads.');
  assert.equal(tab.ticket(id).status, 'Resolved');
}
function test4D() {
  const tab = sim(); const id = 'HD-2172';
  work4D(tab);
  tab.checkWork(id);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  const state = plain(tab.run(`hdConsoleState(hdTicketById('${id}'))`));
  const consent = state.chat.findIndex((entry) => entry.id === 'consent');
  assert.ok(consent >= 0);
  const logoffs = state.actions.filter((a) => a.id === 'vdi-logoff');
  assert.deepEqual(logoffs.map((a) => a.user), ['ana.torres'], 'only Ana\'s session');
  assert.equal(tab.run("hdState.vdi['VDI-POOL-CLAIMS'].sessions.filter((s) => s.state === 'Active').length"), 13);
  // KB-0072 is found by both searches.
  assert.equal(tab.search('virtual desktop black screen')[0], 'KB-0072');
  assert.equal(tab.search('VDI')[0], 'KB-0072');
  // Restart pool is refused (Tier 2).
  const pool = sim(); pool.open(id); pool.run("hdVdiRestartPool('VDI-POOL-CLAIMS')");
  assert.match(pool.view('helpdesk/virtual-desktops'), /Restart pool is a Tier 2 action/);
  assert.equal(pool.run("hdState.vdi['VDI-POOL-CLAIMS'].sessions.filter((s) => s.state === 'Active').length"), 12);
}

/* ---------------------------------------------------------- completion */

function testCompletionAfterAllFour() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  assert.equal(tab.closed(), false);
  work4A(tab);
  assert.equal(tab.closed(), false, 'three still open');
  work4B(tab);
  assert.equal(tab.closed(), false, 'two still open');
  work4C(tab);
  assert.equal(tab.closed(), false, '4-D is still open');
  tab.run('hdPracticeReport()');
  assert.equal(sent.filter((m) => m.type === 'mnt-practice-complete').length, 0, 'nothing is sent early');
  work4D(tab);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1);
  assert.equal(done[0].id, 'its-02');
  assert.equal(done[0].student, 'student-m04p0001');
  assert.deepEqual(done[0].tickets, IDS);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
  assert.doesNotMatch(JSON.stringify(done[0]), /score|points|expected|Reported:/i);
  return tab;
}

// No score or points anywhere the student reads in the practice set.
function testNoScoreInTheView() {
  const tab = sim();
  work4A(tab); work4B(tab); work4C(tab); work4D(tab);
  const pages = [tab.view('helpdesk/tickets'), tab.view('helpdesk/dashboard'), tab.view('helpdesk/virtual-desktops')];
  IDS.forEach((id) => { tab.checkWork(id); pages.push(tab.open(id)); });
  [['NS-LT-0205', 'dock'], ['NS-LT-0205', 'settings-network'], [DESK, 'print-queue']].forEach(([pc, screen]) => pages.push(tab.screen(pc, screen, screen === 'print-queue' ? { printer: BADGE } : {})));
  pages.forEach((html, i) => {
    const text = shown(html);
    assert.doesNotMatch(text, /\bscores?\b|\bpoints?\b|\d+\s*\/\s*100\b|\bpass(ed)? mark\b/i, `page ${i}: ${(text.match(/.{0,60}\b(scores?|points?)\b.{0,30}/i) || [''])[0]}`);
  });
  // "Check my work" is open on every ticket, and every area is met.
  IDS.forEach((id) => assert.match(tab.open(id), /Check my work|data-hd-feedback/i, `${id} shows its feedback`));
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m04-practice-tickets\.test\.js/);
}

const tests = [testSetOpensOnItsOwnClocks, test4A, test4B, test4C, test4D, testCompletionAfterAllFour, testNoScoreInTheView, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m04-practice-tickets: all ${tests.length} passed`);

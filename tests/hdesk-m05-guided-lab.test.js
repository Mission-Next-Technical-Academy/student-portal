'use strict';
// Help Desk Module 5 (key its-03) Practice It, Lab 5.1 (ui/helpdesk-coaches.js
// "hd-m03"): the slow-computer sequence and system repair on HD-2180
// (INC0010480), coached set its-03-guided, on NS-WS-0277.
//
//   - The coach walks all sixteen steps through ui/coach.js. Each step waits
//     for real console state: a screen opened, a typed command the console
//     accepted, a caller answer, a machine change. Never a tick box.
//   - The four typed commands (DISM, sfc, chkdsk, dir) pass in any letter
//     case; the optional PowerShell lines also pass their steps.
//   - Typed commands sit behind "Show me the command"; no temporary profile
//     appears anywhere in the lab (decision 13).
//   - Reading out the lab's recovery key is critical-error feedback.
//   - The finish message carries work the portal's itsCleanCoachWork keeps.
//   - HD-2109 is off the shared shift; a saved run of the old hd-m03 starts
//     fresh; the instructor sheet maps the lab to HD-2180.
//   - Nothing from the graded Prove It ticket is in a committed ui/, portal/
//     or tests/ file (kept here as short hashes only).
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m04-guided-labs.test.js does. Synthetic data only.
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
const STUDENT = 'student-m05g0001';
const launchUrl = (restart = true, student = STUDENT) => `${SIM_URL}?coach=hd-m03${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const NOAH = 'HD-2180';
const PC = 'NS-WS-0277';
const LAB_KEY = '402118-339207-551430-187726-604391-275548-119806-482233';

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', listeners,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; }, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
function fakeOpener() {
  const sent = [];
  return { sent, closed: false, focus() {}, postMessage: (data, origin) => sent.push({ data: JSON.parse(JSON.stringify(data)), origin }) };
}

function sim(url, { local = store(), session = store(), opener = null } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''),
    querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.pathname = n.pathname; location.search = n.search; location.hash = n.hash; } },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() { ctx.closed = true; }, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text),
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash; ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) {
    vm.runInContext(source, ctx, { filename: name });
    if (name === 'helpdesk.js') vm.runInContext('hdNowMs = () => 1000000;', ctx);
  }
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  const tab = {
    ctx, toasts, local, session, run, input, location,
    lastToast: () => toasts[toasts.length - 1] || '',
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
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
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions.map((a) => a.id)`)),
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    events: (patch) => { if (patch) run(`hdWinEventSet(${j(PC)}, ${j(patch)})`); return run("VIEWS['helpdesk/event-viewer']()"); },
    desktop: () => run("VIEWS['helpdesk/windows']()"),
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    coachState: () => JSON.parse(session.getItem('mnt.coach.state') || 'null') || {},
    coachStep: () => tab.coachState().step,
    coach: (id) => run(`MODULE_COACHES.find((c) => c.id === ${j(id)})`),
    advance: () => {
      const steps = tab.coach(tab.coachState().id).steps.length;
      for (;;) {
        const before = tab.coachStep();
        if (before === undefined || before >= steps - 1) return before;
        click('next');
        if (tab.coachStep() === before) return before;
      }
    },
    finish: () => click('finish'),
  };
  return tab;
}
// advance() stops at the first step whose action is not done yet.
const at = (tab, step, label) => { tab.advance(); assert.equal(tab.coachStep(), step, label); };

// The spec's model work note and comment (section 8.2).
const NOTE = 'Reported: desk PC slow since Monday; apps slow to open; froze twice today.\nTried: Task Manager showed Disk at 100% with CPU at 36% (top process Microsoft Teams, 14%). C: was 7% free (16.6 of 237 GB). An update had waited 23 days for a restart. System log Event ID 2013 (disk near capacity); boot took 94 s (Event ID 100). All four startup apps are in the Software Catalog; disabled LumenCam Companion at startup with Noah\'s OK. Removed 21.4 GB of temporary files, with his OK for the Recycle Bin; his Desktop files were all still listed afterwards. DISM and SFC found nothing to repair; chkdsk found no problems. Restarted to finish the update.\nResult: C: 16% free; no restart pending; boot 52 s; Noah confirms apps open normally.';
const COMMENT = 'Hi Noah, your PC should feel normal again. Its drive was almost full and it had been waiting more than three weeks to restart for an update. We cleared out temporary files, finished the update and checked Windows for damage: all clean. Your files are all where you left them. A restart once a week will keep it quick. – Riley, Northstar Service Desk';
const NO_PROFILE = /data-hd-profile|temporary profile|\b1511\b|\b1515\b/i;

function startLab(opener) {
  const tab = sim(launchUrl(), { opener });
  assert.equal(tab.run('hdState.ticketSet'), 'its-03-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [NOAH]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T10:30:00.000Z');
  return tab;
}
function triage(tab) {
  assert.match(tab.open(NOAH), /data-hd-machines/);
  tab.triage(NOAH, 'Software', 'Windows performance', PC, '3', '2');
  assert.equal(tab.ticket(NOAH).priority, 'P4');
  tab.run(`hdAssignTicket('${NOAH}')`);
  assert.equal(tab.ticket(NOAH).assignedTechnician, 'Riley Morgan');
  tab.run(`hdSelectComputer('${PC}')`);
}

/* ------------------------------------------------------------ the walk */

function testLab51() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  const coach = tab.coach('hd-m03');
  assert.equal(coach.steps.length, 17, 'sixteen steps, then Finish');
  assert.equal(coach.module, 5);
  // 1: triage, Task Manager › Processes by CPU, then by Disk.
  triage(tab);
  at(tab, 0, '1 waits for Task Manager');
  let html = tab.screen(PC, 'pc-task-manager');
  assert.match(html, /data-hd-sort="disk"[^>]*>Disk 100%/, 'Disk is at 100%');
  tab.run(`hdWinTaskSort('${PC}', 'cpu')`);
  assert.match(tab.view('helpdesk/pc-task-manager'), /<tbody><tr data-hd-process="Microsoft Teams">/, 'top process by CPU');
  at(tab, 0, '1 waits for the Disk sort');
  tab.run(`hdWinTaskSort('${PC}', 'disk')`);
  at(tab, 1, '1 done');
  // 2: Startup apps.
  tab.run(`hdWinTaskTab('${PC}', 'startup')`);
  assert.equal((tab.view('helpdesk/pc-task-manager').match(/data-hd-startup-app=/g) || []).length, 4, 'four startup apps');
  at(tab, 2, '2 done');
  // 3: the Software Catalog lists all four.
  html = tab.screen(PC, 'software-catalog');
  ['Microsoft Teams', 'Microsoft OneDrive', 'LumenCam Companion', 'Windows Security'].forEach((app) => assert.match(html, new RegExp(`data-hd-catalog-app="${app}"`), app));
  at(tab, 3, '3 done');
  // 4: ask Noah, then disable LumenCam Companion; it stays installed.
  tab.run(`hdWinStartupSet('${PC}', 'LumenCam Companion', 'Disabled')`);
  at(tab, 3, '4 waits for Noah\'s answer');
  tab.ask(NOAH, 'lumencam');
  assert.match(tab.open(NOAH), /I only use the webcam for calls/);
  assert.ok(tab.machine(PC).installedApps.some((app) => app.name === 'LumenCam Companion'), 'disabled, not uninstalled');
  at(tab, 4, '4 done');
  // 5: Storage, 7% free.
  assert.match(tab.screen(PC, 'settings-storage'), /16\.6 GB free of 237 GB/);
  at(tab, 5, '5 done');
  // 6: Windows Update, restart required, 23 days.
  html = tab.screen(PC, 'settings-update');
  assert.match(html, /Restart required/);
  assert.match(html, /data-hd-uptime>23 days/);
  at(tab, 6, '6 done');
  // 7: System log, Error, Event ID 2013.
  html = tab.events();
  assert.match(html, /data-hd-event-logs="system"/);
  tab.events({ level: 'Error' });
  const index = tab.run(`hdWinLogEvents(hdFeatureMachine('${PC}'), 'system').findIndex((e) => e.id === '2013')`);
  tab.run(`hdWinEventOpen('${PC}', ${index})`);
  assert.match(tab.events(), /data-hd-event-detail="2013"[\s\S]*source srv|data-hd-event-detail="2013"[\s\S]*srv/);
  at(tab, 7, '7 done');
  // 8: Diagnostics-Performance, Event ID 100 at 94 s, then KB-0084.
  assert.match(tab.events({ log: 'diagnostics-performance', level: '' }), /\(94 s\)/);
  at(tab, 7, '8 waits for KB-0084');
  assert.ok(tab.search('slow').includes('KB-0084'), '"slow" finds KB-0084');
  tab.kb(NOAH, 'slow', 'KB-0084');
  at(tab, 8, '8 done');
  // 9: Reliability Monitor, Monday.
  tab.screen(PC, 'reliability');
  tab.run(`hdWinReliabilityDay('${PC}', 'Monday')`);
  assert.match(tab.view('helpdesk/reliability'), /data-hd-rel-detail="Monday"[\s\S]*restart pending[\s\S]*/);
  at(tab, 9, '9 done');
  // 10: free space the safe way, ask first for the Recycle Bin, then dir.
  tab.screen(PC, 'settings-storage');
  tab.run(`hdWinTempTick('${PC}', 'wu-cleanup'); hdWinTempTick('${PC}', 'temp'); hdWinTempRemove('${PC}')`);
  assert.equal(tab.machine(PC).storage.freeGb, 34.7);
  at(tab, 9, '10 waits: 15% free is not enough yet');
  tab.ask(NOAH, 'recycle');
  tab.screen(PC, 'settings-storage');
  tab.run(`hdWinTempTick('${PC}', 'recycle'); hdWinTempRemove('${PC}')`);
  assert.match(tab.screen(PC, 'settings-storage'), /38 GB free of 237 GB/);
  tab.run(`hdWinTaskTab('${PC}', 'performance')`);
  assert.match(tab.view('helpdesk/pc-task-manager'), /data-hd-disk="12"/, 'Disk drops below 100%');
  at(tab, 9, '10 waits for dir');
  assert.match(tab.ps('dir C:\\Users\\nwilliams\\Desktop'), /Q3 pipeline\.xlsx/);
  at(tab, 10, '10 done');
  // 11: DISM, then sfc (any letter case).
  assert.match(tab.ps('dism /online /cleanup-image /restorehealth'), /The restore operation completed successfully\./);
  at(tab, 10, '11 waits for sfc');
  assert.match(tab.ps('SFC /SCANNOW'), /did not find any integrity violations/);
  at(tab, 11, '11 done');
  // 12: chkdsk.
  assert.match(tab.ps('Chkdsk C: /scan'), /found no problems/);
  at(tab, 12, '12 done');
  // 13: tell Noah, then Restart to finish the update.
  tab.run(`hdWinRestart('${PC}')`);
  at(tab, 12, '13 waits: Noah was not told');
  tab.ask(NOAH, 'restart');
  assert.equal(tab.machine(PC).updates.restartRequired, false);
  assert.doesNotMatch(tab.screen(PC, 'settings-update'), /Restart required/);
  at(tab, 13, '13 done (the restart already finished the update)');
  // 14: the Safe Mode route, then a normal restart.
  tab.screen(PC, 'settings-recovery');
  ['choose', 'troubleshoot', 'advanced', 'startup-settings', 'startup-menu'].forEach((to) => tab.run(`hdWinRecoveryGo('${PC}', '${to}')`));
  tab.run(`hdWinStartupOption('${PC}', 4)`);
  assert.match(tab.desktop(), /data-hd-safe-mode/);
  at(tab, 13, '14 waits for the normal restart');
  tab.run(`hdWinRestart('${PC}')`);
  assert.doesNotMatch(tab.desktop(), /data-hd-safe-mode/);
  at(tab, 14, '14 done');
  // 15: KB-0083, then Active Directory › Computers › NS-WS-0277 › BitLocker Recovery.
  assert.ok(tab.search('recovery key').includes('KB-0083'), '"recovery key" finds KB-0083');
  tab.kb(NOAH, 'recovery key', 'KB-0083');
  tab.run("hdSetAdTab('computers')");
  tab.input('hd-ad-computer-q', PC);
  tab.run('hdAdComputerFind({ preventDefault() {} })');
  tab.run(`hdAdOpenComputer('${PC}')`);
  tab.run(`hdAdComputerTab('${PC}', 'bitlocker')`);
  html = tab.view('helpdesk/active-directory');
  assert.match(html, /data-hd-bitlocker-key="8D41B6E0"/);
  assert.doesNotMatch(html, /data-hd-recovery-password/, 'nothing read out');
  assert.ok(!html.includes(LAB_KEY));
  at(tab, 15, '15 done');
  // 16: Event ID 100 again (52 s), Noah confirms, note, comment, resolve.
  assert.match(tab.events({ log: 'diagnostics-performance' }), /\(52 s\)/);
  tab.ask(NOAH, 'apps');
  assert.match(tab.open(NOAH), /Everything opens straight away now/);
  tab.note(NOAH, NOTE);
  tab.comment(NOAH, COMMENT);
  assert.doesNotMatch(tab.lastToast(), /won't know/, 'the model comment has no flagged term');
  at(tab, 15, '16 waits for Resolved');
  tab.resolve(NOAH, 'Freed space, finished the update, repairs clean; boot 52 s.');
  assert.equal(tab.ticket(NOAH).status, 'Resolved');
  at(tab, 16, 'at Finish');
  // Every "Check my work" area is met, with no critical error.
  const feedback = tab.feedback(NOAH);
  feedback.areas.forEach((area) => assert.ok(area.ok, `${NOAH} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, []);
  // No temporary profile anywhere in the lab.
  assert.doesNotMatch(tab.desktop(), NO_PROFILE);
  assert.doesNotMatch(tab.events({ log: 'application' }), NO_PROFILE);
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m03');
  assert.deepEqual(done.data.work.tickets.map((t) => t.id), [NOAH]);
  assert.ok(!JSON.stringify(done.data.work).includes(LAB_KEY), 'the recovery key never travels');
  return done.data.work;
}

// The optional PowerShell lines pass their steps in place of the screens.
function testOptionalLinesPassTheirSteps() {
  const tab = startLab();
  triage(tab);
  tab.ps('Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, WorkingSet');
  at(tab, 1, '1 by the optional line');
  assert.match(tab.ps('Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location'), /LumenCam Companion/);
  at(tab, 2, '2 by the optional line');
  tab.screen(PC, 'software-catalog');
  tab.ask(NOAH, 'lumencam');
  tab.run(`hdWinStartupSet('${PC}', 'LumenCam Companion', 'Disabled')`);
  at(tab, 4, '3 and 4 on their screens');
  tab.ps('Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size');
  at(tab, 5, '5 by the optional line');
  tab.ps('Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3');
  at(tab, 6, '6 by the optional line');
  assert.match(tab.ps('Get-WinEvent -LogName System -MaxEvents 20'), /2013/);
  at(tab, 7, '7 by the optional line');
}

// A command the console refuses doesn't pass; sfc before DISM doesn't either.
function testTypedStepsNeedTheRightCommandInOrder() {
  const tab = startLab();
  tab.run(`hdSelectComputer('${PC}')`);
  const step = tab.coach('hd-m03').steps[10];
  assert.match(tab.ps('dism /online /restorehealth'), /didn't run: an option is missing or misspelled\. Did you mean: DISM \/Online \/Cleanup-Image \/RestoreHealth/);
  assert.match(tab.ps('sfc /scanow'), /Did you mean: sfc \/scannow/);
  assert.match(tab.ps('dsim /online /cleanup-image /restorehealth'), /Did you mean: DISM/, 'a misspelled name gets the one-line hint');
  assert.equal(step.check(), false);
  tab.ps('sfc /scannow');
  tab.ps('DISM /Online /Cleanup-Image /RestoreHealth');
  assert.equal(step.check(), false, 'sfc first, then DISM: not in order');
  tab.ps('sfc /scannow');
  assert.equal(step.check(), true, 'DISM, then sfc');
  assert.equal(tab.coach('hd-m03').steps[11].check(), false);
  tab.ps('chkdsk C: /f');
  assert.equal(tab.coach('hd-m03').steps[11].check(), false, 'chkdsk /f is refused while Windows runs');
  tab.ps('chkdsk c: /scan /perf');
  assert.equal(tab.coach('hd-m03').steps[11].check(), true, 'extra valid options allowed');
}

// Step 10 never strands the lab: the Recycle Bin can be emptied only once and
// Noah asked only once, so emptying it before asking still lets the step pass
// once he is asked (the step text teaches the order). dir counts only after
// the cleanup.
function testStep10NeverStrandsTheLab() {
  const tab = startLab();
  triage(tab);
  const step = tab.coach('hd-m03').steps[9];
  tab.ps('dir C:\\Users\\nwilliams\\Desktop');
  tab.screen(PC, 'settings-storage');
  tab.run(`['wu-cleanup', 'temp', 'recycle'].forEach((id) => hdWinTempTick('${PC}', id)); hdWinTempRemove('${PC}')`);
  assert.equal(step.check(), false, 'not asked yet');
  tab.ask(NOAH, 'recycle');
  assert.equal(step.check(), false, 'dir before the cleanup does not count');
  tab.ps('dir C:\\Users\\nwilliams\\Desktop');
  assert.equal(step.check(), true, 'asked, emptied, and dir after the cleanup');
}

// Triage feedback reads Category and CI too, not only the priority.
function testTriageFeedbackReadsCategoryAndCi() {
  const tab = startLab();
  tab.open(NOAH);
  tab.triage(NOAH, 'Software', 'Windows performance', 'NS-LT-0291', '3', '2');
  const area = tab.feedback(NOAH).areas.find((a) => a.area === 'Triage');
  assert.equal(area.ok, false, 'the wrong CI is named');
  assert.match(area.text, /CI NS-WS-0277/);
  // The note needs an Event ID: "Disk at 100%" alone is not one.
  const needs = tab.run(`hdConsole(hdTicketById('${NOAH}')).notes.needs.find((n) => n.label === 'An Event ID').pattern`);
  assert.equal(new RegExp(needs, 'i').test('Disk at 100% and 7% free.'), false);
  assert.equal(new RegExp(needs, 'i').test('Boot took 94 s (Event ID 100).'), true);
  assert.equal(new RegExp(needs, 'i').test('System log 2013.'), true);
}

// Step 15 is a look-up only: Read key is critical-error feedback, and the
// ticket card never offers the key.
function testReadingTheLabKeyIsFeedback() {
  const tab = startLab();
  assert.doesNotMatch(tab.open(NOAH), /Read out the recovery key/, 'no key button on the ticket');
  tab.run("hdSetAdTab('computers')");
  tab.run(`hdAdOpenComputer('${PC}'); hdAdComputerTab('${PC}', 'bitlocker'); hdAdReadKey('${PC}', '8D41B6E0')`);
  const feedback = tab.feedback(NOAH);
  assert.equal(feedback.critical.length, 1);
  assert.match(tab.lastToast(), /Step 15 is a look-up only/);
}

// The typed commands sit behind "Show me the command", nowhere else.
function testShowMeTheCommand() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const steps = tab.coach('hd-m03').steps;
  const typed = [[9, ['dir C:\\Users\\nwilliams\\Desktop']], [10, ['DISM /Online /Cleanup-Image /RestoreHealth', 'sfc /scannow']], [11, ['chkdsk C: /scan']]];
  typed.forEach(([i, commands]) => {
    const step = steps[i];
    const hint = (step.instruction.match(/<details><summary>Show me the command<\/summary>([\s\S]*?)<\/details>/) || [])[1];
    assert.ok(hint, `step ${i + 1} has a Show me the command hint`);
    const outside = `${step.title} ${step.instruction.replace(/<details>[\s\S]*?<\/details>/, '')} ${step.body}`;
    commands.forEach((command) => {
      assert.ok(hint.includes(command), `step ${i + 1} hint shows ${command}`);
      assert.ok(!outside.toLowerCase().includes(command.toLowerCase()), `step ${i + 1} names ${command} only in the hint`);
    });
  });
  // The optional lines under steps 1, 2, 5, 6 and 7.
  [0, 1, 4, 5, 6].forEach((i) => assert.match(steps[i].instruction, /The same check in PowerShell \(optional\): <code>/, `step ${i + 1}`));
  assert.match(steps[6].instruction, /Get-WinEvent -LogName System -MaxEvents 20/);
}

// Every step route is allowed and has a view; every step says why and what
// success looks like; no step names a ticket id, points or a key.
function testEveryStepRouteAndText() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const coach = tab.coach('hd-m03');
  coach.steps.forEach((step, i) => {
    if (step.route) {
      assert.ok(coach.allow.includes(step.route), `step ${i + 1}: ${step.route} is in allow`);
      assert.ok(tab.run(`${JSON.stringify(step.route.replace(/^#\//, ''))} in VIEWS`), `step ${i + 1}: ${step.route} has a view`);
    }
    if (i === coach.steps.length - 1) {
      assert.equal(step.finish.label, 'Finish');
      assert.equal(step.finish.href, `${PORTAL}/?coachComplete=hd-m03#/program/it-support/module/5`);
    } else {
      assert.match(step.body, /Why:[\s\S]*Success looks like:/, `step ${i + 1} says why and what success looks like`);
      assert.equal(typeof step.check, 'function', `step ${i + 1} is gated on real state`);
    }
    assert.doesNotMatch(`${step.title} ${step.instruction} ${step.body}`, /\b(HD|SR|SEC)-21\d\d\b|\d+\s*points?\b|\bscore\b(?! *\.)|its-03|temporary profile/i, `step ${i + 1} text`);
  });
  coach.allow.forEach((route) => assert.ok(tab.run(`${JSON.stringify(route.replace(/^#\//, ''))} in VIEWS`), `allow ${route} has a view`));
}

/* ------------------------------------------------------------ HD-2109 */

function testOldHd2109RunIsForgotten() {
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('hdSave()');
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m03', step: 5, student: STUDENT }));
  const tab = sim(launchUrl(false), { local });
  assert.equal(tab.coachStep(), 0, 'starts at the first step');
  assert.equal(tab.run('hdState.ticketSet'), 'its-03-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [NOAH]);
}

function testHd2109LeavesTheQueue() {
  const shared = sim(`${SIM_URL}#/helpdesk/tickets`);
  const ids = plain(shared.run('hdState.tickets.map((t) => t.id)'));
  ['HD-2109', NOAH, 'HD-2181', 'HD-2182', 'HD-2183', 'HD-2186', 'HD-2187', 'HD-2188'].forEach((id) => assert.ok(!ids.includes(id), `${id} is not in the shared shift`));
  assert.ok(shared.run("HD_TICKET_TEMPLATES.some((t) => t.id === 'HD-2109' && t.ownSet === true)"), 'the template stays for Module 12 and older attempts');
  // The capstone keeps its own copy of HD-2109.
  assert.match(fs.readFileSync(path.join(ROOT, 'portal', 'it-support-module-12.js'), 'utf8'), /HD-2109/);
  // The shared shift still lists NS-LT-0081's events; Module 5's sets hide them.
  assert.ok(plain(shared.run("hdEvents().map((e) => e.computer)")).includes('NS-LT-0081'));
  const lab = startLab();
  assert.ok(!plain(lab.run("hdEvents().map((e) => e.computer)")).includes('NS-LT-0081'), 'the lab hides NS-LT-0081\'s shared events');
}

/* ------------------------------------------------------------ the portal */

function testPortalKeepsTheWork(work) {
  const portal = loadPortal();
  portal.render = () => {};
  const clean = plain(vm.runInContext('itsCleanCoachWork', portal)(work, 'hd-m03'));
  assert.ok(clean, 'the lab work is kept');
  assert.deepEqual(clean.tickets.map((t) => t.id), [NOAH]);
  assert.equal(clean.tickets[0].status, 'Resolved');
  assert.ok(clean.tickets[0].notes.some((n) => /Event ID 2013/.test(n.text)), 'the work note travels');
  // The instructor sheet: HD-2180 now, HD-2109 for attempts saved before.
  const sheet = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  assert.match(sheet, /'lab-its-03-blank-desktop': \['HD-2180'\]/);
  assert.match(sheet, /EARLIER_TICKETS_BY_LAB = \{[^}]*'lab-its-03-blank-desktop': \['HD-2109'\]/);
}

/* ------------------------------------------- nothing from the graded ticket */

// The Prove It ticket for this module is built only in the prove part. Its
// ticket id, laptop and product names are kept here only as short hashes, so
// this file names none of them.
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const GRADED = new Set(['afbe7cfa77a627d3', 'cfd801073ed9cee2', '98151577d82b0ca3', 'faf307c408a51434']);
function testNothingFromTheGradedTicket() {
  const files = childProcess.execFileSync('git', ['ls-files', 'ui', 'portal', 'tests'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.ok(files.length > 50, 'git ls-files lists the committed files');
  if (!files.includes('tests/hdesk-m05-guided-lab.test.js')) files.push('tests/hdesk-m05-guided-lab.test.js');
  const hits = [];
  for (const file of files) {
    let source;
    try { source = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { continue; }
    const words = new Set(source.split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
    GRADED.forEach((h) => { if (words.has(h)) hits.push(file); });
  }
  assert.deepEqual(hits, [], 'no committed file names the graded ticket');
  // The scan finds a word it is given: the lab's own ticket number.
  const words = new Set(fs.readFileSync(path.join(UI, 'helpdesk-data.js'), 'utf8').split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
  assert.ok(words.has(hash('inc0010480')));
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m05-guided-lab\.test\.js/);
}

let failed = 0;
const runTest = (name, fn) => {
  try { const value = fn(); console.log(`ok   ${name}`); return value; } catch (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); return null; }
};
const work = runTest('testLab51', testLab51);
if (work) runTest('testPortalKeepsTheWork', () => testPortalKeepsTheWork(work));
else { failed += 1; console.error('FAIL testPortalKeepsTheWork (the lab walk failed)'); }
const tests = [testOptionalLinesPassTheirSteps, testTypedStepsNeedTheRightCommandInOrder, testStep10NeverStrandsTheLab, testTriageFeedbackReadsCategoryAndCi, testReadingTheLabKeyIsFeedback, testShowMeTheCommand,
  testEveryStepRouteAndText, testOldHd2109RunIsForgotten, testHd2109LeavesTheQueue, testNothingFromTheGradedTicket, testCiRunsThisFile];
tests.forEach((test) => runTest(test.name, test));
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`hdesk-m05-guided-lab: all ${tests.length + 2} passed`);

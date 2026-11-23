'use strict';
// Help Desk Module 4 (key its-02) Practice It, the three coached labs
// (ui/helpdesk-coaches.js "Module 4 (key its-02). Three coached labs"):
//
//   - Lab 4.1 hd-m02-vm: build NS-TEST-W11 on the VM screen. Every step waits
//     for its real action; a wrong setting is named on the screen.
//   - Lab 4.2 hd-m02-server: from the VM Lab 4.1 built (same browser): a
//     snapshot, a server VM, Internal network and ping both ways, then the
//     virtual desktop ticket HD-2173 (coached set its-02-server).
//   - Lab 4.3 hd-m02: printers and peripherals on HD-2134 (coached set
//     its-02-guided), B1 to C4.
//   - The finish message carries work the portal's itsCleanCoachWork keeps.
//   - A saved run of the old two-ticket hd-m02 is forgotten on load.
//   - Every step route is allowed and has a view; every step but Finish says
//     why and what success looks like.
//   - Nothing from the graded Prove It ticket is in any committed ui/,
//     portal/ or tests/ file, and no Module 4 ticket reaches the shared shift.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded (as tests/hdesk-m03-guided-lab.test.js does). Synthetic data only.
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
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
const STUDENT = 'student-m04g0001';
const launchUrl = (coach, restart = true, student = STUDENT) => `${SIM_URL}?coach=${coach}${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const T0 = 7000000;
const W11 = 'NS-TEST-W11';
const SRV = 'NS-TEST-SRV';
const PRIYA = 'HD-2134';
const LEAH = 'HD-2173';

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

// One browser tab with ui/coach.js loaded and the clock under the test's
// control. Timers never run: the VM install is finished with hdVmFinishInstall.
function sim(url, { local = store(), session = store(), opener = null, now = T0 } = {}) {
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
    __now: now,
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash; ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) {
    vm.runInContext(source, ctx, { filename: name });
    if (name === 'helpdesk.js') vm.runInContext('hdNowMs = () => __now;', ctx);
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
    vm: (name) => plain(run(`hdVmByName(${j(name)})`)),
    vmState: () => plain(run('hdVmState()')),
    set: (field, value) => run(`hdVmFormSet(${j(field)}, ${j(value)})`),
    ping: (name, address) => run(`hdVmCommand(${j(name)}, ${j(`ping ${address}`)})`),
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    // Typed in the ticket's PowerShell: the output the student sees.
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions.map((a) => a.id)`)),
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
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

/* ------------------------------------------------------------ Lab 4.1 */

function walkLab41(tab) {
  assert.equal(tab.run('HD_VM.key'), 'its-02', 'the VM screen is on for this coach');
  assert.deepEqual(tab.vmState().vms, [], 'no VM is seeded');
  // Step 1: Task Manager › Performance › CPU. Performance alone is not enough.
  at(tab, 0, 'step 1 waits for the CPU tab');
  tab.run("hdVmTaskTab('performance')");
  at(tab, 0, 'Performance alone does not pass step 1');
  tab.run("hdVmTaskTab('cpu')");
  const cpu = tab.view('helpdesk/task-manager');
  assert.match(cpu, /data-hd-task-cpu/); assert.match(cpu, /<strong>Enabled<\/strong>/); assert.match(cpu, /16 GB installed/); assert.match(cpu, /<dd>8<\/dd>/);
  at(tab, 1, 'step 1 done');
  // Step 2: New.
  tab.run('hdVmNew()');
  at(tab, 2, 'step 2 done');
  // Step 3: the name alone is not enough; the image passes it.
  tab.set('name', W11);
  at(tab, 2, 'step 3 waits for the install image');
  tab.set('image', 'win11');
  at(tab, 3, 'step 3 done');
  // Step 4: 1 GB shows the warning; 4 GB and 2 cores leave 12 GB.
  tab.set('memoryGb', 1);
  let html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-warning="memory"/);
  assert.match(html, /needs at least 4 GB/);
  tab.set('memoryGb', 4); tab.set('cores', 3);
  at(tab, 3, 'a wrong core count keeps step 4');
  html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-hints="\d"/);
  assert.match(html, /CPU cores: 3; this lab asks for 2/, 'the screen names the setting that is off');
  tab.set('cores', 2);
  html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-ram="12"/, 'the host bar shows 12 GB left');
  assert.doesNotMatch(html, /CPU cores: \d+; this lab asks/, 'the cores hint is gone');
  at(tab, 4, 'step 4 done');
  // Step 5: 64 GB, dynamic.
  tab.set('diskGb', 64);
  at(tab, 4, 'step 5 waits for the disk type');
  tab.set('diskType', 'dynamic');
  at(tab, 5, 'step 5 done');
  // Step 6: all four diagrams, NAT, Create.
  ['NAT', 'Bridged', 'Internal', 'Host-only'].forEach((mode) => {
    tab.run(`hdVmViewMode('${mode}')`);
    assert.match(tab.view('helpdesk/vm-manager'), new RegExp(`data-hd-vm-diagram="${mode}"`));
  });
  tab.set('network', 'NAT');
  assert.doesNotMatch(tab.view('helpdesk/vm-manager'), /data-hd-vm-hints/, 'every setting matches');
  at(tab, 5, 'step 6 waits for Create');
  tab.run('hdVmCreate()');
  assert.equal(tab.vm(W11).network, 'NAT');
  at(tab, 6, 'step 6 done');
  // Step 7: Start; the install must finish.
  tab.run(`hdVmStart('${W11}')`);
  assert.equal(tab.vm(W11).state, 'Installing');
  at(tab, 6, 'step 7 waits for the install');
  tab.ctx.__now = T0 + 5000;
  tab.run(`hdVmFinishInstall('${W11}')`);
  const built = tab.vm(W11);
  assert.deepEqual([built.image, built.memoryGb, built.cores, built.diskGb, built.diskType, built.network, built.state, built.installed], ['win11', 4, 2, 64, 'dynamic', 'NAT', 'Running', true]);
  html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-screen="running"/);
  assert.match(html, /data-hd-vm-finish/);
  at(tab, 7, 'at Finish');
}

function testLab41() {
  const opener = fakeOpener();
  const local = store();
  const tab = sim(launchUrl('hd-m02-vm'), { local, opener });
  const coach = tab.coach('hd-m02-vm');
  assert.equal(coach.module, 4);
  assert.equal(coach.steps.length, 8, 'seven steps, then Finish');
  assert.equal(tab.coachStep(), 0);
  walkLab41(tab);
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m02-vm');
  assert.equal(done.data.student, STUDENT);
  return { work: done.data.work, local };
}

// A VM built with the wrong core count: steps 4 and 7 never pass, and the
// VM's own screen names the setting.
function testWrongSettingIsNamed() {
  const tab = sim(launchUrl('hd-m02-vm'));
  const coach = tab.coach('hd-m02-vm');
  tab.run("hdVmTaskTab('cpu')"); tab.run('hdVmNew()');
  tab.set('name', W11); tab.set('image', 'win11'); tab.set('memoryGb', 1); tab.set('memoryGb', 4); tab.set('cores', 4);
  tab.set('diskGb', 64); tab.set('diskType', 'dynamic');
  ['NAT', 'Bridged', 'Internal', 'Host-only'].forEach((mode) => tab.run(`hdVmViewMode('${mode}')`));
  tab.set('network', 'NAT'); tab.run('hdVmCreate()');
  tab.run(`hdVmStart('${W11}')`); tab.run(`hdVmFinishInstall('${W11}')`);
  assert.equal(coach.steps[3].check(), false, 'step 4 fails on 4 cores');
  assert.equal(coach.steps[6].check(), false, 'step 7 fails on 4 cores');
  tab.run(`hdVmSelect('${W11}')`);
  const html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-hints="1"/);
  assert.match(html, /CPU cores: 4; this lab asks for 2/);
  // Fixed: power off, 2 cores, start again.
  tab.run(`hdVmPowerOff('${W11}')`); tab.run(`hdVmSet('${W11}', 'cores', 2)`); tab.run(`hdVmStart('${W11}')`);
  assert.equal(coach.steps[3].check(), true);
  assert.equal(coach.steps[6].check(), true);
}

/* ------------------------------------------------------------ Lab 4.2 */

const LEAH_NOTE = 'Reported: virtual desktop stuck on a spinner; closing and reopening the window didn\'t help.\nTried: other VDI-POOL-MKTG sessions Active, so not a pool outage; Leah\'s session Disconnected, hung 9 h; told her unsaved work in it may be lost and she agreed at 10:32; logged that session off per KB-0072.\nResult: new session Active; Leah confirmed her desktop and apps load.';
const LEAH_COMMENT = 'Hi Leah, your desktop was stuck in an old session on our server, so closing the window couldn\'t reach it. With your OK we cleared it, and you\'re back in with a fresh one. If it happens again, message us. – Riley';

function testLab42(local) {
  const opener = fakeOpener();
  const tab = sim(launchUrl('hd-m02-server'), { local, opener });
  const coach = tab.coach('hd-m02-server');
  assert.equal(coach.steps.length, 13, 'twelve steps, then Finish');
  assert.equal(tab.run('HD_VM.key'), 'its-02');
  // The launch's reset swaps the tickets and keeps Lab 4.1's VM.
  assert.equal(tab.run('hdState.ticketSet'), 'its-02-server');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [LEAH]);
  assert.equal(tab.vm(W11).installed, true, 'Lab 4.1\'s VM survives the Lab 4.2 launch');
  assert.equal(tab.vm(W11).state, 'Running');
  assert.equal(tab.coachStep(), 0);
  // S1: snapshot.
  at(tab, 0, 'S1 waits for the snapshot');
  tab.run(`hdVmSnapshot('${W11}', 'Before-change')`);
  at(tab, 1, 'S1 done');
  // S2: delete the shortcut, then restore.
  tab.run(`hdVmDeleteShortcut('${W11}')`);
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-shortcut="gone"/);
  at(tab, 1, 'S2 waits for the restore');
  tab.run(`hdVmRestore('${W11}', 0)`);
  assert.equal(tab.vm(W11).shortcut, true);
  at(tab, 2, 'S2 done');
  // S3: the server VM.
  tab.run('hdVmNew()');
  tab.set('name', SRV); tab.set('image', 'winsrv'); tab.set('memoryGb', 4); tab.set('cores', 2); tab.set('diskGb', 64); tab.set('diskType', 'dynamic'); tab.set('network', 'NAT');
  tab.run('hdVmCreate()'); tab.run(`hdVmStart('${SRV}')`);
  at(tab, 2, 'S3 waits for the install');
  tab.run(`hdVmFinishInstall('${SRV}')`);
  tab.run(`hdVmSelect('${SRV}')`);
  let html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-server-manager/, 'Server Manager opens');
  assert.match(html, /data-hd-vm-ram="8"/, 'two 4 GB guests leave 8 GB');
  at(tab, 3, 'S3 done');
  // S4: both on Internal.
  tab.run(`hdVmSet('${W11}', 'network', 'Internal')`);
  at(tab, 3, 'S4 waits for both VMs');
  tab.run(`hdVmSet('${SRV}', 'network', 'Internal')`);
  at(tab, 4, 'S4 done');
  // S5: ping both ways, four replies each.
  const there = tab.ping(W11, '10.0.5.10');
  assert.equal((there.match(/Reply from 10\.0\.5\.10/g) || []).length, 4, 'four replies');
  at(tab, 4, 'S5 waits for the ping back');
  const back = tab.ping(SRV, '10.0.5.20');
  assert.equal((back.match(/Reply from 10\.0\.5\.20/g) || []).length, 4, 'four replies back');
  at(tab, 5, 'S5 done');
  // S6: NAT times out; Internal replies again.
  tab.run(`hdVmSet('${W11}', 'network', 'NAT')`);
  assert.match(tab.ping(W11, '10.0.5.10'), /Request timed out/);
  at(tab, 5, 'S6 waits for the switch back');
  tab.run(`hdVmSet('${W11}', 'network', 'Internal')`);
  assert.match(tab.ping(W11, '10.0.5.10'), /Reply from 10\.0\.5\.10/);
  at(tab, 6, 'S6 done');
  // V1: triage HD-2173 at P4.
  const ticketHtml = tab.open(LEAH);
  assert.match(ticketHtml, /INC0010471/);
  assert.match(ticketHtml, /Virtual Desktops<\/button>/);
  at(tab, 6, 'V1 waits for the triage');
  tab.triage(LEAH, 'Software', 'Virtual desktop (VDI)', 'VDI-POOL-MKTG', '3', '2');
  assert.equal(tab.ticket(LEAH).priority, 'P4');
  // V2: the pool, a "Got it" step.
  html = tab.view('helpdesk/virtual-desktops');
  assert.match(html, /data-hd-vdi="VDI-POOL-MKTG"/);
  assert.match(html, /4 of 5 sessions Active/);
  assert.match(html, /data-hd-session="mktg-leah" data-hd-session-state="hung"><td>leah\.brooks<\/td><td><span class="hd-badge bad">Disconnected – hung<\/span><\/td><td>9 h/);
  // V3: the KB.
  assert.equal(tab.run("hdKbSearchArticles('virtual desktop black screen', hdKbArticles()).map((a) => a.id)[0]"), 'KB-0072');
  tab.advance();
  assert.equal(tab.coachStep(), 8, 'V1 and V2 done; V3 waits for the KB');
  tab.kb(LEAH, 'virtual desktop black screen', 'KB-0072');
  at(tab, 9, 'V3 done');
  // V4: consent.
  tab.ask(LEAH, 'consent');
  assert.match(tab.open(LEAH), /Go ahead, I saved before lunch\./);
  at(tab, 10, 'V4 done');
  // V5: log off her session only, then reconnect.
  tab.run("hdVdiLogOff('VDI-POOL-MKTG', 'mktg-leah')");
  at(tab, 10, 'V5 waits for her to reconnect');
  tab.ask(LEAH, 'reconnect');
  assert.match(tab.open(LEAH), /Yes, it loaded!/);
  assert.equal(tab.run("hdState.vdi['VDI-POOL-MKTG'].sessions.filter((s) => s.state === 'Active').length"), 5);
  at(tab, 11, 'V5 done');
  // V6: note, comment, resolved.
  tab.note(LEAH, LEAH_NOTE);
  tab.comment(LEAH, LEAH_COMMENT);
  assert.doesNotMatch(tab.lastToast(), /won't know/, 'the comment has no flagged term');
  at(tab, 11, 'V6 waits for Resolved');
  tab.resolve(LEAH, 'Logged off the hung session; Leah confirmed her desktop loads.');
  assert.equal(tab.ticket(LEAH).status, 'Resolved');
  at(tab, 12, 'at Finish');
  const feedback = plain(tab.run(`hdConsoleFeedback(hdTicketById('${LEAH}'))`));
  feedback.areas.forEach((area) => assert.ok(area.ok, `${LEAH} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, []);
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m02-server');
  return done.data.work;
}

/* ------------------------------------------------------------ Lab 4.3 */

const PRIYA_NOTE = 'Reported: nothing prints from NS-LT-0094; print spooler error; tried three times.\nTried: other HR users print to NS-HR-MFP01, so only this PC; Get-PrintJob showed four jobs, the first (Benefits_Guide.pdf, 612 pages) in Error; with Priya\'s OK cancelled it, stopped the spooler, cleared the stuck job and started the spooler; unticked Use Printer Offline; the printer answered on port 9100.\nResult: test page printed; Priya confirmed her other three documents printed.';
const PRIYA_COMMENT = 'Hi Priya, you can print again. One very large file, the 612-page Benefits Guide, got stuck and blocked everything behind it. I cleared it with your OK, and your other three documents have printed. For the guide, try sending it a section at a time, and tell us if it sticks again. – Riley';
const LAPTOP = 'NS-LT-0094';
const MFP = 'NS-HR-MFP01';
const queue = (tab) => tab.machine(LAPTOP).printQueues[MFP];

function testLab43() {
  const opener = fakeOpener();
  const tab = sim(launchUrl('hd-m02'), { opener });
  const coach = tab.coach('hd-m02');
  assert.equal(coach.steps.length, 12, 'eleven steps, then Finish');
  assert.equal(tab.run('HD_VM'), null, 'no VM screen in Lab 4.3');
  assert.equal(tab.run('hdState.ticketSet'), 'its-02-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [PRIYA]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T09:15:00.000Z');
  // B1: triage, then the spooler and the queue from PowerShell on NS-LT-0094.
  assert.match(tab.open(PRIYA), /data-hd-machines/);
  tab.triage(PRIYA, 'Hardware', 'Printer', MFP, '3', '2');
  assert.equal(tab.ticket(PRIYA).priority, 'P4');
  at(tab, 0, 'B1 waits for the commands');
  tab.run(`hdSelectComputer('${LAPTOP}')`);
  assert.match(tab.ps('Get-Service Spooler'), /Running  Spooler            Print Spooler/);
  const jobs = tab.ps(`Get-PrintJob -PrinterName ${MFP}`).split('\n');
  assert.equal(jobs.length, 6, 'a header, a rule and four jobs');
  assert.match(jobs[2], /^18 .*Benefits_Guide\.pdf .*612 .*Error$/);
  at(tab, 1, 'B1 done');
  // B2: scope and consent.
  tab.ask(PRIYA, 'others');
  at(tab, 1, 'B2 waits for consent');
  tab.ask(PRIYA, 'cancel');
  at(tab, 1, 'B2 waits for the log card');
  tab.run(`hdEvidenceOpen('${PRIYA}', 'printservice')`);
  at(tab, 2, 'B2 done');
  // B3: cancel job 18 (it stays Deleting), Clear stuck job only while stopped.
  let html = tab.screen(LAPTOP, 'print-queue', { printer: MFP });
  assert.match(html, /data-hd-queue="NS-HR-MFP01"/);
  tab.run(`hdQueueCancel('${LAPTOP}', '${MFP}', '18')`);
  assert.equal(queue(tab).jobs[0].status, 'Deleting', 'job 18 stays Deleting');
  assert.equal(queue(tab).jobs.length, 4);
  tab.run(`hdQueueClearStuck('${LAPTOP}', '${MFP}')`);
  assert.match(tab.lastToast(), /only while the Print Spooler is stopped/);
  assert.equal(queue(tab).jobs.length, 4, 'refused while the spooler runs');
  at(tab, 2, 'B3 waits for the stuck job to clear');
  tab.ps('Stop-Service Spooler');
  assert.match(tab.ps('Get-Service Spooler'), /Stopped  Spooler/);
  tab.run(`hdQueueClearStuck('${LAPTOP}', '${MFP}')`);
  assert.deepEqual(queue(tab).jobs.map((job) => job.id), [19, 20, 21]);
  at(tab, 2, 'B3 waits for the spooler to start');
  tab.ps('Start-Service Spooler');
  assert.match(tab.ps('Get-Service Spooler'), /Running  Spooler/);
  assert.equal(queue(tab).printed.length, 0, 'still offline: nothing prints yet');
  at(tab, 3, 'B3 done');
  // B4: untick Use Printer Offline.
  tab.run(`hdQueueToggle('${LAPTOP}', '${MFP}', 'offline')`);
  assert.match(tab.view('helpdesk/print-queue'), /Status: Ready/);
  at(tab, 4, 'B4 done');
  // B5: the print port.
  assert.match(tab.ps('Test-NetConnection 10.20.70.20 -Port 9100'), /TcpTestSucceeded : True$/);
  at(tab, 5, 'B5 done');
  // B6: test page, then Priya confirms.
  tab.run(`hdQueueTestPage('${LAPTOP}', '${MFP}')`);
  assert.equal(queue(tab).printed.slice(-1)[0].document, 'Test Page');
  at(tab, 5, 'B6 waits for Priya');
  tab.ask(PRIYA, 'resend');
  assert.match(tab.open(PRIYA), /All three have come out of the printer/);
  at(tab, 6, 'B6 done');
  // B7: the label printer by its address, its Ports tab and Get-Printer.
  tab.screen(LAPTOP, 'settings-printers');
  tab.input('hd-add-ip', '10.20.70.51'); tab.input('hd-add-name', 'NS-HR-LABEL01'); tab.input('hd-add-driver', 'Generic Label Printer');
  tab.run(`hdSettingsAddByIp({ preventDefault() {} }, '${LAPTOP}')`);
  assert.ok(tab.machine(LAPTOP).printers.includes('NS-HR-LABEL01'));
  html = tab.screen(LAPTOP, 'printer-properties', { printer: 'NS-HR-LABEL01', tab: 'ports' });
  assert.match(html, /data-hd-port="IP_10\.20\.70\.51"><td>✓ IP_10\.20\.70\.51<\/td><td>Standard TCP\/IP Port<\/td><td>10\.20\.70\.51/);
  at(tab, 6, 'B7 waits for Get-Printer');
  assert.equal(tab.ps('Get-Printer -Name NS-HR-LABEL01 | Format-List Name, PortName, DriverName'), 'Name       : NS-HR-LABEL01\nPortName   : IP_10.20.70.51\nDriverName : Generic Label Printer');
  at(tab, 7, 'B7 done');
  // C1: the camera's Properties on NS-LT-0244.
  html = tab.screen('NS-LT-0244', 'device-manager');
  assert.match(html, /data-hd-device="camera" data-hd-device-status="problem"/);
  at(tab, 7, 'C1 waits for the camera\'s Properties');
  tab.run("hdDeviceOpen('NS-LT-0244', 'camera')");
  assert.match(tab.view('helpdesk/device-manager'), /data-hd-device-text>Windows has stopped this device because it has reported problems\. \(Code 43\)/);
  at(tab, 8, 'C1 done');
  // C2: driver date, Roll Back Driver, the Camera app.
  tab.run("hdDeviceOpen('NS-LT-0244', 'camera', 'driver')");
  assert.match(tab.view('helpdesk/device-manager'), /data-hd-driver-date>yesterday/);
  tab.run("hdDeviceDriver('NS-LT-0244', 'camera', 'rollback')");
  tab.run("hdDeviceOpen('NS-LT-0244', 'camera', 'general')");
  assert.match(tab.view('helpdesk/device-manager'), /This device is working properly\./);
  at(tab, 8, 'C2 waits for the Camera app');
  assert.match(tab.screen('NS-LT-0244', 'camera'), /data-hd-camera="video"/);
  at(tab, 9, 'C2 done');
  // C3: dock, Win + P › Extend, Detect.
  html = tab.screen('NS-LT-0244', 'dock');
  assert.match(html, /laptop not connected/);
  tab.run("hdDockDo('NS-LT-0244', 'dock')");
  tab.run("hdDockDo('NS-LT-0244', 'project', 'Extend')");
  at(tab, 9, 'C3 waits for Detect');
  tab.run("hdDockDo('NS-LT-0244', 'detect')");
  html = tab.view('helpdesk/dock');
  assert.match(html, /data-hd-monitor="left" data-hd-monitor-state="picture"/);
  assert.match(html, /data-hd-monitor="right" data-hd-monitor-state="picture"/);
  assert.match(html, /data-hd-display="left">2 · Monitor 1[\s\S]*data-hd-display="right">3 · Monitor 2/);
  at(tab, 10, 'C3 done');
  // C4: note, comment, Solution provided, Resolved.
  tab.open(PRIYA);
  tab.note(PRIYA, PRIYA_NOTE);
  tab.comment(PRIYA, PRIYA_COMMENT);
  assert.doesNotMatch(tab.lastToast(), /won't know/, 'the model comment has no flagged term');
  at(tab, 10, 'C4 waits for Resolved');
  tab.resolve(PRIYA, 'Cleared the stuck job, put the printer online, test page and three documents printed.');
  assert.equal(tab.ticket(PRIYA).status, 'Resolved');
  at(tab, 11, 'at Finish');
  // Every "Check my work" area is met.
  const feedback = plain(tab.run(`hdConsoleFeedback(hdTicketById('${PRIYA}'))`));
  tab.run(`hdEvidenceOpen('${PRIYA}', 'printservice')`);
  plain(tab.run(`hdConsoleFeedback(hdTicketById('${PRIYA}'))`)).areas.forEach((area) => assert.ok(area.ok, `${PRIYA} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, []);
  // The order of the printer work, as the ticket recorded it.
  const order = tab.actions(PRIYA).filter((id) => ['job-cancel', 'spooler-stop', 'job-clear-stuck', 'spooler-start', 'printer-offline-off', 'test-page'].includes(id));
  assert.deepEqual(order, ['job-cancel', 'spooler-stop', 'job-clear-stuck', 'spooler-start', 'printer-offline-off', 'test-page']);
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m02');
  return done.data.work;
}

// The restart of the print server's spooler is a critical error, as feedback.
function testLab43ServerSpoolerIsCritical() {
  const tab = sim(launchUrl('hd-m02'));
  tab.open(PRIYA);
  tab.run(`hdConsoleAction('${PRIYA}', 'server-spooler')`);
  assert.match(tab.open(PRIYA), /Critical error\. Only Priya is affected/);
}

/* ------------------------------------------------------------ the portal */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};

function testPortalKeepsTheWork(vmWork, serverWork, printerWork) {
  const clean = (work, id) => plain(prun('itsCleanCoachWork')(work, id));
  const a = clean(vmWork, 'hd-m02-vm');
  assert.ok(a, 'Lab 4.1 work is kept');
  assert.deepEqual(a.tickets, [], 'Lab 4.1 sends no ticket');
  assert.deepEqual(a.vm.vms.map((v) => [v.name, v.image, v.memoryGb, v.cores, v.diskGb, v.diskType, v.network, v.installed]), [[W11, 'win11', 4, 2, 64, 'dynamic', 'NAT', true]]);
  assert.equal(a.vm.cpuSeen, true);
  assert.deepEqual(a.vm.modesViewed, ['NAT', 'Bridged', 'Internal', 'Host-only']);
  const b = clean(serverWork, 'hd-m02-server');
  assert.deepEqual(b.tickets.map((t) => t.id), [LEAH]);
  assert.equal(b.tickets[0].status, 'Resolved');
  assert.deepEqual(b.vm.vms.map((v) => v.name), [W11, SRV]);
  assert.ok(b.vm.vms[0].snapshots.some((s) => s.name === 'Before-change'));
  assert.ok(b.vm.vms[1].pings.some((p) => p.ok && p.to === '10.0.5.20'));
  const c = clean(printerWork, 'hd-m02');
  assert.deepEqual(c.tickets.map((t) => t.id), [PRIYA]);
  assert.equal(c.tickets[0].status, 'Resolved');
  assert.equal(c.vm, undefined, 'Lab 4.3 keeps no VM');
  assert.equal(printerWork.vm, undefined, 'Lab 4.3 sends no VM');
}

/* ------------------------------------------------------------ resume */

function testOldTwoTicketRunIsForgotten() {
  // A browser halfway through the old two-ticket hd-m02: the shared shift and
  // a resume record at step 5.
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('hdSave()');
  assert.notEqual(old.run('hdState.ticketSet'), 'its-02-guided');
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m02', step: 5, student: STUDENT }));
  const tab = sim(launchUrl('hd-m02', false), { local });
  assert.equal(tab.coachStep(), 0, 'starts at the first step');
  assert.equal(tab.run('hdState.ticketSet'), 'its-02-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [PRIYA]);
  // A current run still resumes where it was.
  const current = sim(launchUrl('hd-m02'), { local: store() });
  current.open(PRIYA);
  current.triage(PRIYA, 'Hardware', 'Printer', MFP, '3', '2');
  current.run(`hdSelectComputer('${LAPTOP}')`);
  current.ps('Get-Service Spooler'); current.ps(`Get-PrintJob -PrinterName ${MFP}`);
  at(current, 1, 'B1 done');
  const resumed = sim(launchUrl('hd-m02', false), { local: current.local });
  assert.equal(resumed.coachStep(), 1, 'same step after a relaunch');
}

/* ------------------------------------------------------------ the coaches */

function testEveryStepRouteAndText() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  for (const id of ['hd-m02-vm', 'hd-m02-server', 'hd-m02']) {
    const coach = tab.coach(id);
    assert.ok(coach, id);
    assert.equal(coach.module, 4, `${id} is Module 4`);
    coach.steps.forEach((step, i) => {
      if (step.route) {
        assert.ok(coach.allow.includes(step.route), `${id} step ${i + 1}: ${step.route} is in allow`);
        assert.ok(tab.run(`${JSON.stringify(step.route.replace(/^#\//, ''))} in VIEWS`), `${id} step ${i + 1}: ${step.route} has a view`);
      }
      const last = i === coach.steps.length - 1;
      if (last) {
        assert.ok(step.finish && step.finish.label === 'Finish', `${id} ends with Finish`);
        assert.equal(step.finish.href, `${PORTAL}/?coachComplete=${id}#/program/it-support/module/4`);
      } else {
        assert.match(step.body, /Why:[\s\S]*Success looks like:/, `${id} step ${i + 1} says why and what success looks like`);
        assert.ok(typeof step.check === 'function' || step.continueLabel, `${id} step ${i + 1} is gated or a Got it step`);
      }
      assert.doesNotMatch(`${step.title} ${step.instruction} ${step.body}`, /\b(HD|SR|SEC)-21\d\d\b|\d+\s*points?\b|\bscore\b(?! *\.)|its-02/i, `${id} step ${i + 1} text names no ticket id, points or key`);
    });
    coach.allow.forEach((route) => assert.ok(tab.run(`${JSON.stringify(route.replace(/^#\//, ''))} in VIEWS`), `${id} allow ${route} has a view`));
  }
}

function testCoachedSetsStayOutOfTheSharedShift() {
  const shared = sim(`${SIM_URL}#/helpdesk/tickets`);
  const ids = plain(shared.run('hdState.tickets.map((t) => t.id)'));
  ['HD-2134', 'HD-2169', 'HD-2170', 'HD-2171', 'HD-2172', 'HD-2173'].forEach((id) => assert.ok(!ids.includes(id), `${id} is not in the shared shift`));
  assert.equal(shared.run('HD_VM'), null, 'no VM screen in a plain launch');
  // The old tickets stay in the data for Module 12 and older attempts.
  assert.ok(shared.run("HD_TICKET_TEMPLATES.some((t) => t.id === 'HD-2106') && HD_TICKET_TEMPLATES.some((t) => t.id === 'HD-2112')"));
}

/* ------------------------------------------- nothing from the graded ticket */

// The Prove It ticket, its printer and its dock are built only in the prove
// part. The patterns are built from pieces so this file never names them.
function testNothingFromTheGradedTicket() {
  const patterns = [
    new RegExp(`\\b${['HD', String(2134 + 2)].join('-')}\\b`, 'i'),
    new RegExp(`\\b${['NS', 'WH', 'LABEL0' + '2'].join('-')}\\b`, 'i'),
    new RegExp(`\\b${['NS', 'WH', 'PC0' + '7'].join('-')}\\b`, 'i'),
    new RegExp(`\\b${'dock ' + 'B'}\\b`, 'i'),
  ];
  // The scan finds what it is given.
  assert.ok(patterns[0].test(`ticket ${['HD', String(2136)].join('-')} here`));
  assert.ok(patterns[3].test(`the ${['Dock', 'b'].join(' ')}.`));
  assert.ok(!patterns[3].test('the dock bay'));
  const files = childProcess.execFileSync('git', ['ls-files', 'ui', 'portal', 'tests'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.ok(files.length > 50, 'git ls-files lists the committed files');
  const hits = [];
  for (const file of files) {
    let source;
    try { source = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { continue; }
    patterns.forEach((pattern) => { if (pattern.test(source)) hits.push(`${file} ${pattern}`); });
  }
  assert.deepEqual(hits, [], 'no committed file names the graded ticket, its printer or its dock');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m04-guided-labs\.test\.js/);
}

let failed = 0;
const runTest = (name, fn) => {
  try { const value = fn(); console.log(`ok   ${name}`); return value; } catch (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); return null; }
};
const lab41 = runTest('testLab41', testLab41);
const serverWork = lab41 ? runTest('testLab42', () => testLab42(lab41.local)) : null;
const printerWork = runTest('testLab43', testLab43);
if (lab41 && serverWork && printerWork) runTest('testPortalKeepsTheWork', () => testPortalKeepsTheWork(lab41.work, serverWork, printerWork));
else { failed += 1; console.error('FAIL testPortalKeepsTheWork (a lab walk failed)'); }
const tests = [testWrongSettingIsNamed, testLab43ServerSpoolerIsCritical, testOldTwoTicketRunIsForgotten, testEveryStepRouteAndText, testCoachedSetsStayOutOfTheSharedShift, testNothingFromTheGradedTicket, testCiRunsThisFile];
tests.forEach((test) => runTest(test.name, test));
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`hdesk-m04-guided-labs: all ${tests.length + 4} passed`);

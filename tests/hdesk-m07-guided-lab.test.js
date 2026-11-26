'use strict';
// Help Desk Module 7 (key its-05) Practice It, Lab 7.1 (ui/helpdesk-coaches.js
// "hd-m05"): the morning server check on HD-2189 (INC0010500), coached set
// its-05-guided, and the incident the student raises from it, HD-2190
// (INC0010501).
//
//   - The coach walks all eighteen steps of spec section 8.2 through
//     ui/coach.js. Each step waits for real state: a server or directory
//     screen read (hdState.serverSeen), a typed line the console ran, the
//     raised ticket's fields, a note. Never a tick box.
//   - The four typed lines (gpresult /r, gpupdate /force, Get-Service on
//     NS-PRINT01, Test-NetConnection NS-FILE01 -Port 445) pass from the
//     command history in any letter case. gpresult on another laptop doesn't.
//   - The optional lines pass their steps the way their screens do.
//   - Every server and directory screen is read-only, and the fixtures match
//     the spec: one warning tile, Priya Shah's effective access is Read,
//     GG-HR-Contributors has four members.
//   - HD-2190 saves with the attempt (its writing, Impact, Urgency, priority
//     and group), and the instructor sheet maps Lab 7.1 to HD-2189 and HD-2190.
//   - HD-2108 and HD-2117 are in no student queue; a saved run of the old
//     hd-m05 starts fresh.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m06-guided-lab.test.js does. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
const STUDENT = 'student-m07g0001';
const launchUrl = (restart = true, student = STUDENT) => `${SIM_URL}?coach=hd-m05${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const CHECK = 'HD-2189';
const RAISED = 'HD-2190';
const LAPTOP = 'NS-LT-0215';

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
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    server: (name, route) => { run(`hdServerOpen(${j(name)}${route ? `, ${j(route)}` : ''})`); return run(`VIEWS[${j((route || '#/helpdesk/server-manager').slice(2))}]()`); },
    ad: (adTab) => { run(`hdState.adTab = ${j(adTab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    seen: () => plain(run('hdState.serverSeen || []')),
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

// The spec's model notes (section 8.2), in shorter sentences.
const NOTE_2189 = 'Reported: Scheduled morning server check, Wednesday 08:00.\nTried: Server Manager on all five servers. NS-DC01: AD DS and DNS Running. NS-APP01: Purchasing Service Running as NORTHSTAR\\svc-purchasing. NS-FILE01 System log clear overnight. CHG-7801 completed with no related symptom. HR share and NTFS permissions read; effective access for P. Shah is Read, as designed. NS-LT-0215 in OU=Sales,OU=Workstations; all policies applied. DNS records read. Warehouse scope 78%; Guest Wi-Fi scope 95%. Spooler Running; NS-FILE01 answers on port 445.\nResult: All roles and services healthy. Nothing changed on any server. The Guest Wi-Fi scope is raised as HD-2190 for Server & Identity.\nNext action: none on this ticket. HD-2190 carries the scope.';
const NOTE_2190 = 'Reported: Found during the scheduled morning check: the Guest Wi-Fi DHCP scope is 95% used.\nTried: Read the scope on NS-DHCP01: 209 leased, 12 free of 221. No guest tickets about Wi-Fi so far today.\nResult: No change made. Scope sizing is Server & Identity\'s.\nNext action: Server & Identity to review the scope size or the lease time before the next visitor day.';

function startLab(opener, local) {
  const tab = sim(launchUrl(), { opener, local });
  assert.equal(tab.run('hdState.ticketSet'), 'its-05-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [CHECK], 'HD-2190 waits until it is raised');
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T08:00:00.000Z');
  return tab;
}
function triage(tab) {
  const html = tab.open(CHECK);
  assert.match(html, /data-hd-machines/);
  assert.match(html, /Open NS-LT-0215/);
  tab.triage(CHECK, 'Server', 'Scheduled check', 'NS-DC01', '3', '3');
  assert.equal(tab.ticket(CHECK).priority, 'P5');
  tab.run(`hdAssignTicket('${CHECK}')`);
  assert.equal(tab.ticket(CHECK).assignedTechnician, 'Riley Morgan');
}
// Steps 3 to 11 on the screens (step 2 is a read step).
function screenSteps(tab) {
  // Step 2 is a read step: Next moves past it (continueLabel).
  assert.ok(tab.coach('hd-m05').steps[1].continueLabel);
  // 2: Server Manager, five servers with state, one warning tile.
  const manager = tab.view('helpdesk/server-manager');
  assert.match(manager, /data-hd-server-warnings="1"/);
  for (const name of ['NS-DC01', 'NS-DHCP01', 'NS-FILE01', 'NS-PRINT01', 'NS-APP01']) assert.match(manager, new RegExp(`data-hd-server-row="${name}"[\\s\\S]*?hdServerOpen`), name);
  assert.doesNotMatch(manager, /Degraded<\/span>|Spooler stopped|TLS certificate expired|Finance ACL warning/, 'every server is healthy in the lab');
  // 3: NS-DC01 roles.
  at(tab, 2, '3 waits');
  assert.match(tab.server('NS-DC01'), /AD DS[\s\S]*DNS Server/);
  at(tab, 3, '3 done');
  // 4: Purchasing Service and its service account.
  assert.match(tab.server('NS-APP01', '#/helpdesk/server-services'), /Purchasing Service[\s\S]*NORTHSTAR\\svc-purchasing/);
  at(tab, 4, '4 done');
  // 5: the NS-FILE01 System log, Information events only.
  const log = tab.server('NS-FILE01', '#/helpdesk/server-events');
  assert.match(log, /data-hd-server-event="7036"/);
  assert.doesNotMatch(log, /data-hd-server-event="70(31|34|38)"/);
  at(tab, 5, '5 done');
  // 6: CHG-7801 in the change log.
  tab.run("hdChangeLogOpen('CHG-7801')");
  assert.match(tab.view('helpdesk/change-log'), /CHG-7801[\s\S]*Add DNS A record for timeclock-02[\s\S]*J\. Keller[\s\S]*Completed/);
  at(tab, 6, '6 done');
  // 7 and 8: the HR share's two layers, then Priya Shah's effective access.
  tab.server('NS-FILE01', '#/helpdesk/file-server');
  tab.run("hdFileSet({ share:'HR', tab:'share' })");
  assert.match(tab.view('helpdesk/file-server'), /GG-HR-Users[\s\S]*Change/);
  at(tab, 6, '7 waits for NTFS');
  tab.run("hdFileSet({ tab:'ntfs' })");
  assert.match(tab.view('helpdesk/file-server'), /GG-HR-Readers[\s\S]*Read[\s\S]*GG-HR-Contributors[\s\S]*Modify/);
  at(tab, 7, '7 done');
  tab.run("hdFileSet({ tab:'effective' }); hdFileSet({ user:'u-1004' })");
  assert.match(tab.view('helpdesk/file-server'), /data-hd-effective-access="Read"/);
  at(tab, 8, '8 done');
  // 9: GG-HR-Contributors has four members.
  tab.run("hdAdGroupOpen('GG-HR-Contributors')");
  const groups = tab.ad('groups');
  assert.equal((groups.match(/data-hd-group-member="/g) || []).length, 4, 'four members');
  at(tab, 9, '9 done');
  // 10: Jordan Bell, read-only.
  tab.run("hdOpenUser('u-1005')");
  const users = tab.ad('users');
  assert.match(users, /data-hd-ad-read-only/);
  assert.doesNotMatch(users, /hdAdAction|Reset password|Add approved group/);
  at(tab, 10, '10 done');
  // 11: NS-LT-0215 in OU=Sales,OU=Workstations.
  tab.run(`hdAdOpenComputer('${LAPTOP}')`);
  assert.match(tab.ad('computers'), /OU=Sales,OU=Workstations/);
  at(tab, 11, '11 done');
}
// Steps 12 to 16: the four typed lines, DNS and DHCP.
function typedSteps(tab, lines) {
  tab.run(`hdSelectComputer('${LAPTOP}')`);
  assert.match(tab.ps(lines.gpresult), /Default Domain Policy[\s\S]*Workstation Security Baseline/);
  at(tab, 12, '12 done');
  assert.match(tab.ps(lines.gpupdate), /Computer Policy update has completed successfully/);
  tab.run(`hdGpResultsOpen('${LAPTOP}')`);
  assert.match(tab.view('helpdesk/group-policy'), /data-hd-gp-last-applied>Wed 08:00</);
  at(tab, 13, '13 done');
  const dns = tab.view('helpdesk/dns');
  for (const record of ['files:A', 'purchasing:CNAME', '@:MX', '@:TXT', 'timeclock-02:A']) assert.match(dns, new RegExp(`data-hd-dns-record="${record}"`), record);
  at(tab, 14, '14 done');
  tab.run("hdDhcpOpen('Warehouse')");
  const warehouse = tab.view('helpdesk/dhcp');
  assert.match(warehouse, /VLAN 30 · 78% used/);
  assert.match(warehouse, /data-hd-dhcp-reservation="NS-WH-LABEL01"/);
  assert.match(warehouse, /data-hd-dhcp-exclusion="10\.20\.30\.50"/);
  assert.doesNotMatch(warehouse, /NS-WH-CLOCK02/, 'the 7-E clock is not in the lab');
  at(tab, 15, '15 done');
  tab.run("hdDhcpOpen('Guest Wi-Fi')");
  assert.match(tab.view('helpdesk/dhcp'), /VLAN 90 · 95% used · 12 free/);
  at(tab, 15, '16 waits for the two typed checks');
  assert.match(tab.ps(lines.spooler), /Running\s+Spooler/);
  at(tab, 15, '16 waits for the port check');
  assert.match(tab.ps(lines.port), /TcpTestSucceeded : True/);
  at(tab, 16, '16 done');
}
const LINES = { gpresult: 'gpresult /r', gpupdate: 'gpupdate /force', spooler: 'Get-Service -ComputerName NS-PRINT01 -Name Spooler', port: 'Test-NetConnection NS-FILE01 -Port 445' };
// Step 17: raise HD-2190, write it, triage it and hand it on.
function raiseStep(tab) {
  const html = tab.open(CHECK);
  assert.match(html, /data-hd-raise onclick="hdRaiseIncident\('HD-2189'\)"/);
  tab.run(`hdRaiseIncident('${CHECK}')`);
  assert.equal(tab.run('hdState.selectedTicketId'), RAISED);
  const raised = tab.ticket(RAISED);
  assert.equal(raised.raisedFrom, CHECK);
  assert.equal(raised.status, 'New');
  assert.equal(raised.priority, '');
  assert.equal(tab.run(`hdShortDescription(hdTicketById('${RAISED}'))`), '', 'the raised record has no short description until the student writes one');
  at(tab, 16, '17 waits for the writing');
  tab.input('hd-rewrite-short', 'Guest Wi-Fi DHCP scope at 95%');
  tab.input('hd-rewrite-desc', 'Found in the morning check. Only 12 addresses are free, so guests may soon get no address and no internet.');
  tab.run(`hdRewriteSave('${RAISED}')`);
  tab.run(`hdSetImpact('${RAISED}', 'impact', '2'); hdSetImpact('${RAISED}', 'urgency', '2')`);
  assert.equal(tab.ticket(RAISED).priority, 'P3');
  tab.run(`hdMatrixAssignGroup('${RAISED}', 'Server & Identity')`);
  at(tab, 16, '17 waits for the note');
  tab.note(RAISED, NOTE_2190);
  at(tab, 17, '17 done');
}

/* ------------------------------------------------------------ the walk */

function testLab71() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  const coach = tab.coach('hd-m05');
  assert.equal(coach.steps.length, 19, 'eighteen steps, then Finish');
  assert.equal(coach.module, 7);
  at(tab, 0, 'triage waits');
  triage(tab);
  screenSteps(tab);
  typedSteps(tab, LINES);
  raiseStep(tab);
  // 18: HD-2189's own note, then Resolved.
  tab.open(CHECK);
  tab.note(CHECK, NOTE_2189);
  at(tab, 17, '18 waits for Resolved');
  tab.resolve(CHECK, 'Morning check done; Guest Wi-Fi scope raised as HD-2190.');
  assert.equal(tab.ticket(CHECK).status, 'Resolved');
  at(tab, 18, 'at Finish');
  // Every "Check my work" area is met on both tickets, with no critical entry.
  for (const id of [CHECK, RAISED]) {
    const feedback = tab.feedback(id);
    feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
    assert.deepEqual(feedback.critical, [], `${id} no critical entry`);
  }
  // Nothing on any server or account changed.
  const fresh = startLab();
  assert.deepEqual(plain(tab.run('hdState.userOverrides')), plain(fresh.run('hdState.userOverrides')), 'no account changed');
  assert.deepEqual(plain(tab.run('hdState.computerOverrides || {}')), plain(fresh.run('hdState.computerOverrides || {}')), 'no computer moved');
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m05');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id).sort(), [CHECK, RAISED]);
  const saved = work.tickets.find((t) => t.id === RAISED);
  assert.equal(saved.raisedFrom, CHECK);
  assert.equal(saved.writing.shortDescription, 'Guest Wi-Fi DHCP scope at 95%');
  assert.deepEqual([saved.console.matrix.impact, saved.console.matrix.urgency, saved.console.matrix.priority, saved.console.matrix.assignmentGroup], ['2', '2', 'P3', 'Server & Identity']);
  assert.match(saved.notes.slice(-1)[0].text, /No change made/);
  return work;
}

// Any letter case and extra spaces pass the typed steps.
function testTypedStepsAnyCase() {
  const tab = startLab();
  triage(tab);
  screenSteps(tab);
  typedSteps(tab, { gpresult: 'GPRESULT /R', gpupdate: 'GPUpdate /Force', spooler: 'get-service -computername ns-print01 -name spooler', port: 'test-netconnection ns-file01 -port 445' });
}

// gpresult on another laptop, or aimed at another one, never passes step 12;
// a screen alone never passes a typed step.
function testTypedStepsNeedTheLine() {
  const tab = startLab();
  triage(tab);
  screenSteps(tab);
  const steps = tab.coach('hd-m05').steps;
  tab.run(`hdGpResultsOpen('${LAPTOP}')`); tab.view('helpdesk/group-policy');
  assert.ok(tab.seen().includes('gp-results:NS-LT-0215'), 'the screen records the result');
  assert.equal(steps[11].check(), false, 'the screen alone does not pass the typed step');
  tab.run("hdSelectComputer('NS-LT-0145')");
  tab.ps('gpresult /r');
  assert.equal(steps[11].check(), false, 'gpresult on NS-LT-0145 does not count');
  tab.run(`hdSelectComputer('${LAPTOP}')`);
  tab.ps('gpresult /s NS-LT-0145 /r');
  assert.equal(steps[11].check(), false, 'aimed at another laptop with /s');
  tab.ps('gpresult /s NS-LT-0215 /r');
  assert.equal(steps[11].check(), true, 'aimed at NS-LT-0215 with /s');
  // gpupdate on another laptop doesn't pass step 13.
  tab.run("hdSelectComputer('NS-LT-0145')");
  tab.ps('gpupdate /force');
  assert.equal(steps[12].check(), false);
  // The Services screen alone does not pass step 16's typed check.
  tab.run("hdDhcpOpen('Guest Wi-Fi')"); tab.view('helpdesk/dhcp');
  tab.server('NS-PRINT01', '#/helpdesk/server-services');
  tab.ps('Test-NetConnection NS-FILE01 -Port 445');
  assert.ok(tab.seen().includes('service:NS-PRINT01:Spooler'));
  assert.equal(steps[15].check(), false, 'Get-Service must be typed');
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler'), /Running/);
  assert.equal(steps[15].check(), true);
}

// The optional lines pass their steps the way their screens do.
function testOptionalLinesPassTheirSteps() {
  const tab = startLab();
  triage(tab);
  const steps = tab.coach('hd-m05').steps;
  const pass = (index, command, pattern) => { assert.equal(steps[index].check(), false, `step ${index + 1} waits`); assert.match(tab.ps(command), pattern, command); assert.equal(steps[index].check(), true, `step ${index + 1}: ${command}`); };
  pass(2, 'Get-Service -ComputerName NS-DC01', /NTDS[\s\S]*DNS/);
  pass(4, 'Get-WinEvent -ComputerName NS-FILE01 -LogName System -MaxEvents 20', /7036/);
  pass(8, 'Get-ADGroupMember GG-HR-Contributors', /Grace Kim/);
  pass(9, 'Get-ADUser jbell -Properties MemberOf, LockedOut', /MemberOf\s+: \{.*GG-Finance-Users/);
  pass(10, 'Get-ADComputer NS-LT-0215', /CN=NS-LT-0215,OU=Sales,OU=Workstations/);
  assert.match(tab.ps('Resolve-DnsName files'), /10\.20\.0\.30/);
  assert.equal(steps[13].check(), false, 'one record is not four');
  tab.ps('Resolve-DnsName purchasing'); tab.ps('Resolve-DnsName northstar.example -Type MX'); tab.ps('Resolve-DnsName northstar.example -Type TXT');
  assert.equal(steps[13].check(), true, 'the four records by command');
}

// A step done early passes when it comes up; the coach never strands the lab.
function testStepDoneEarlyPasses() {
  const tab = startLab();
  triage(tab);
  tab.run("hdChangeLogOpen('CHG-7801')"); tab.view('helpdesk/change-log');
  tab.run("hdDhcpOpen('Warehouse')"); tab.view('helpdesk/dhcp');
  at(tab, 2, 'step 3 waits for NS-DC01');
  const steps = tab.coach('hd-m05').steps;
  assert.equal(steps[5].check(), true, 'CHG-7801 read early');
  assert.equal(steps[14].check(), true, 'Warehouse read early');
}

// Every step: a route the coach allows, a "Why" and a "Success looks like".
function testEveryStepRouteAndText() {
  const tab = startLab();
  const coach = tab.coach('hd-m05');
  const allow = plain(coach.allow);
  for (const route of ['#/helpdesk/server-manager', '#/helpdesk/server-services', '#/helpdesk/server-events', '#/helpdesk/file-server', '#/helpdesk/change-log', '#/helpdesk/active-directory', '#/helpdesk/group-policy', '#/helpdesk/dns', '#/helpdesk/dhcp', '#/helpdesk/powershell']) assert.ok(allow.includes(route), route);
  coach.steps.slice(0, 18).forEach((step, index) => {
    if (step.route) assert.ok(allow.includes(step.route), `step ${index + 1} route ${step.route}`);
    assert.match(step.body, /Why: /, `step ${index + 1} why`);
    assert.match(step.body, /Success looks like/, `step ${index + 1} success`);
    assert.doesNotMatch(`${step.instruction} ${step.body}`, /CompTIA|Module 5|server VM|build a domain/, `step ${index + 1} wording`);
  });
  // The four typed lines sit behind Show me the command.
  const shown = coach.steps.map((step) => step.instruction).join('\n');
  for (const line of ['gpresult /r', 'gpupdate /force', 'Get-Service -ComputerName NS-PRINT01 -Name Spooler', 'Test-NetConnection NS-FILE01 -Port 445']) {
    assert.match(shown, new RegExp(`<details><summary>Show me the command</summary>[^]*?${line.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`), line);
  }
  assert.ok(coach.steps[18].finish, 'the last step is Finish');
  assert.match(coach.steps[18].finish.href, /module\/7/);
}

// The coach opens each step's own route when the step starts. Drawing that
// screen must never pass the step by itself (a screen records what it shows).
function testOpeningAStepsScreenDoesNotPassIt() {
  const steps = startLab().coach('hd-m05').steps;
  steps.slice(0, 18).forEach((step, index) => {
    if (!step.route || typeof step.check !== 'function') return;
    const tab = startLab();
    tab.open(CHECK);
    tab.view(step.route.slice(2));
    assert.equal(tab.coach('hd-m05').steps[index].check(), false, `step ${index + 1} passes when the coach opens ${step.route}`);
  });
}

// The lab's tickets never decide a practice set, and the old tickets are gone
// from every student queue; their templates stay for older attempts.
function testOldTicketsLeaveTheQueue() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  for (const id of ['HD-2108', 'HD-2117']) {
    assert.equal(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === '${id}').ownSet`), true, `${id} is ownSet`);
    assert.equal(tab.run(`hdState.tickets.some((t) => t.id === '${id}')`), false, `${id} not in the shared shift`);
    assert.equal(tab.run(`[...Object.values(HD_PRACTICE_SETS), ...Object.values(HD_COACHED_SETS)].some((s) => s.tickets.includes('${id}'))`), false, `${id} in no set`);
  }
  assert.deepEqual(plain(tab.run("HD_COACHED_SETS['its-05-guided'].tickets")), [CHECK, RAISED]);
  assert.deepEqual(plain(tab.run("MODULE_COACHES.filter((c) => c.id === 'hd-m05').length")), 1, 'one hd-m05 coach');
}

// A saved run of the old hd-m05 (HD-2108 and HD-2117) starts fresh.
function testOldCoachRunIsForgotten() {
  const local = store([['mnt.coach.resume', JSON.stringify({ id: 'hd-m05', step: 6, student: STUDENT })]]);
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m05', step: 6 })]]);
  sim(`${SIM_URL}#/helpdesk/tickets`, { local, session });
  assert.equal(local.getItem('mnt.coach.resume'), null, 'old resume dropped');
  assert.equal(session.getItem('mnt.coach.state'), null, 'old step dropped');
  // A run on the new set is kept.
  const kept = store();
  const lab = startLab(null, kept);
  triage(lab);
  at(lab, 2, 'on step 3');
  const again = sim(launchUrl(false), { local: kept, session: lab.session });
  assert.equal(again.run('hdState.ticketSet'), 'its-05-guided');
  assert.equal(again.coachStep(), 2, 'the new run resumes');
}

// The instructor sheet maps Lab 7.1 to HD-2189 and HD-2190; an older attempt
// keeps HD-2108 and HD-2117 (tests/admin-sheets/hdesk.cases.js has the cases).
function testSheetMapping() {
  const source = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  assert.match(source, /'lab-its-05-server-ad': \['HD-2189', 'HD-2190'\]/);
  assert.match(source, /EARLIER_TICKETS_BY_LAB = \{[^}]*'lab-its-05-server-ad': \['HD-2108', 'HD-2117'\]/);
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m05': \['HD-2189', 'HD-2190'\]/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m07-guided-lab\.test\.js/);
}

const tests = [testLab71, testTypedStepsAnyCase, testTypedStepsNeedTheLine, testOptionalLinesPassTheirSteps, testStepDoneEarlyPasses,
  testEveryStepRouteAndText, testOpeningAStepsScreenDoesNotPassIt, testOldTicketsLeaveTheQueue, testOldCoachRunIsForgotten, testSheetMapping, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m07-guided-lab: all ${tests.length} passed`);

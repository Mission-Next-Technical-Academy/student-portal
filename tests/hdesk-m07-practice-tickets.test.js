'use strict';
// Help Desk Module 7 (key its-05) Practice It, Lab 7.2 · Practice tickets
// (not graded): the practice set 'its-05' (ui/helpdesk-data.js), opened with
// ?practice=its-05. Five tickets, each a different issue, each on its own
// clock (console.now), with five related records the student links:
//
//   - 7-A HD-2191 (INC0010502): Amir's O: drive. His groups are fine; the
//     rebuilt laptop is in CN=Computers. Workaround, then Server & Identity.
//   - 7-B HD-2192 (INC0010503): the Print Spooler stopped on NS-PRINT01. Link
//     the three callers (HD-2202 to HD-2204), read 7034, start it once, a
//     caller prints.
//   - 7-C HD-2193 (INC0010504): NS-FILE01 D: 96% full. Numbers, rate and the
//     largest folder, delete nothing, Server & Identity and the lead.
//   - 7-D HD-2194 (INC0010505): NS-FILE01 Offline for Accounts Payable. Link
//     the two Finance tickets (HD-2205, HD-2206), port 445 fails, P1, the lead,
//     an update with a time.
//   - 7-E HD-2195 (INC0010506): the time clock has no DHCP reservation. Read
//     the lease, give payroll the address, convert to Network device
//     reservation.
//
// Each ticket is worked end to end with the spec's model notes (section 8.4)
// and "Check my work" passes every area. Every "common miss" is a wrong option
// on the ticket's choice card, shown as feedback (the critical ones listed as
// critical errors). The set reports completion once, after all five, with the
// ticket ids only. Feedback only, never points.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const IDS = ['HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195'];
const RELATED = ['HD-2202', 'HD-2203', 'HD-2204', 'HD-2205', 'HD-2206'];
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null } = {}) {
  const u = new URL('https://academy.test/sim/?practice=its-05&student=student-m07p0001#/helpdesk/tickets');
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
    choose: (id, option) => run(`hdChoose(${j(id)}, ${j(option)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    attach: (id, article) => run(`hdKbAttach(${j(id)}, ${j(article)})`),
    search: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    group: (id, group) => run(`hdMatrixAssignGroup(${j(id)}, ${j(group)})`),
    link: (child, parent) => run(`hdLinkParent(${j(child)}, ${j(parent)})`),
    team: (id, message) => run(`hdTeamMessage(${j(id)}, ${j(message)})`),
    select: (name) => run(`hdSelectComputer(${j(name)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    server: (name, route) => { run(`hdServerOpen(${j(name)}${route ? `, ${j(route)}` : ''})`); return run(`VIEWS[${j((route || '#/helpdesk/server-manager').slice(2))}]()`); },
    event: (index) => { run(`hdServerLogOpen(${index})`); return run("VIEWS['helpdesk/server-events']()"); },
    ad: (adTab) => { run(`hdState.adTab = ${j(adTab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    rule: (id, rule) => run(`hdConsoleRule(hdTicketById(${j(id)}), ${j(rule)})`),
    checkWork: (id) => run(`hdConsoleCheckWork(${j(id)})`),
    closed: () => run('hdPracticeClosed()'),
  };
  return tab;
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
const shown = (html) => html.replace(/<[^>]*>/g, ' ');

// The spec's model notes (8.4) and customer texts.
const A_NOTE = 'Reported: O: (Operations) missing since the laptop rebuild, NS-LT-0145. Shift schedules needed for tomorrow\'s rota.\nTried: Amir is in GG-Operations-Drive, so access is fine. gpresult /r on NS-LT-0145: Operations Drive Mapping not applied. Active Directory › Computers shows the object in CN=Computers, not OU=Operations,OU=Workstations.\nResult: No change made on the server. Amir can reach the files now through \\\\NS-FILE01\\Operations and has the schedules.\nNext action: Server & Identity to move the computer object to OU=Operations,OU=Workstations per KB-0031, then gpupdate /force and confirm O: returns at his next sign-in.';
const A_COMMENT = 'Hi Amir, you can get to the schedules right now by opening the Operations folder from the link I sent. I\'ve checked and your access is exactly as it should be. The drive letter is missing because your rebuilt laptop was registered in the wrong place in our directory. Our server team is moving it, and O: will be back by itself when you next sign in. I\'ll let you know when that\'s done. – Riley';
const B_NOTE = 'Reported: Monitoring — Print Spooler on NS-PRINT01 Stopped at 08:12. Three related 2nd-floor tickets linked.\nTried: Get-Service confirmed Stopped. System log 7034 at 08:12, first in 30 days. No change in the change log in the last 24 hours.\nResult: Started the Print Spooler once at 08:21 under KB-0100; service Running. A 2nd-floor caller confirmed a test page printed.\nNext action: none while it stays up. If 7031 or 7034 recurs on this service within 24 hours, do not start it again: escalate to Server & Identity with both events.';
const B_COMMENT = 'Hi, printing on the 2nd floor is working again. The service that sends jobs to the printers had stopped on our print server, and we\'ve started it back up. Please send anything that didn\'t print earlier. Sorry for the interruption. If anything still won\'t print, reply here and it comes straight back to me. – Riley';
const C_NOTE = 'Reported: Monitoring — NS-FILE01 D: 96% used, 19 GB free of 500 GB, +40 GB in 6 hours.\nTried: Confirmed 19.1 GB free on the volume list. Largest recent growth is Marketing\\Video-Exports, 38 GB, created today. No change-log entry for this server today.\nResult: Nothing deleted or moved. Escalated P2 to Server & Identity at 10:04 with the numbers and the folder. Service Desk lead told at 10:06.\nNext action: Server & Identity to decide on more space or a cleanup with the data\'s owner. At the current rate the volume fills in about 3 hours; re-check and chase at 11:30 if there is no response.';
const D_NOTE = 'Reported: Finance share unavailable for the Accounts Payable team, 6+ users, during month-end close. Reported by C. Rivas 09:38.\nTried: Two further Finance tickets linked (3 total). Server Manager shows NS-FILE01 Offline. Test-NetConnection NS-FILE01 -Port 445 from the Service Desk workstation returns False. Nothing changed on the server or on any laptop.\nResult: Server-side outage, not a user or device problem. Service Desk lead told 09:42. Escalated P1 to Server & Identity 09:44 with the above.\nNext action: Server & Identity own the restore. Next update to Carla and the linked callers by 10:15, and every 30 minutes after that until it is back.';
const D_COMMENT = 'Hi Carla, thank you for flagging this so quickly. I\'ve confirmed it isn\'t just you: the server that holds the Finance drive is down, and our server team is on it as a top priority. There\'s nothing you or the team need to do, and nothing needs restarting at your end. Please save anything you\'re working on locally for now. I\'ll come back to you by 10:15 with an update, even if there\'s nothing new to report. – Riley';
const E_NOTE = 'Reported: Dock A time clock NS-WH-CLOCK02 not reaching the payroll system since this morning; night shift could not clock out.\nTried: One device only; other warehouse devices unaffected. DHCP Warehouse scope (VLAN 30) shows NS-WH-CLOCK02 leased 10.20.30.142 at 06:40. The payroll system is configured for 10.20.30.61. The scope has one reservation (NS-WH-LABEL01) and an exclusion range; nothing is reserved for this clock.\nResult: Gave payroll the current address, 10.20.30.142, so badges are recorded today. Nothing changed on the DHCP server. Request raised for a reservation on 10.20.30.61 and linked here.\nNext action: Server & Identity to add the reservation per KB-0102.';
const E_COMMENT = 'Hi Monica, badges are being recorded again. Payroll has the clock\'s current address, so nothing is lost from this morning, including the night shift\'s clock-outs. The clock is picking up a new address each time it restarts, instead of keeping one of its own. I\'ve put in a request for our server team to keep its proper address for it, and once that\'s in place it\'ll stay put. I\'ll confirm when it\'s done. – Riley';

// Every wrong option on a ticket's choice card is shown as feedback and the
// step stays open; a critical one is listed as a critical error.
function assertMisses(id, wrong, critical) {
  const tab = sim();
  tab.open(id);
  for (const option of wrong) {
    tab.choose(id, option);
    assert.match(tab.open(id), new RegExp(`data-hd-choice-feedback="${option}">[^<]*(Critical error|Not this)`), `${id} ${option} feedback`);
  }
  assert.equal(tab.feedback(id).critical.length, critical.length, `${id} critical misses`);
  assert.equal(tab.rule(id, { action: 'workaround-and-handoff-chosen' }) || tab.rule(id, { action: 'runbook-start-chosen' }), false);
}

function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET.key'), 'its-05');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [...IDS, ...RELATED].sort());
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2191'), '2026-08-19T14:20:00.000Z');
  assert.equal(now('HD-2192'), '2026-08-20T08:19:00.000Z');
  assert.equal(now('HD-2193'), '2026-08-20T09:45:00.000Z');
  assert.equal(now('HD-2194'), '2026-08-20T09:42:00.000Z');
  assert.equal(now('HD-2195'), '2026-08-21T07:25:00.000Z');
  IDS.forEach((id) => assert.equal(tab.ticket(id).priority, '', `${id} opens with no priority`));
  // Before a ticket is opened, every server is healthy.
  const manager = tab.view('helpdesk/server-manager');
  assert.match(manager, /data-hd-server-warnings="0"/);
  assert.doesNotMatch(manager, /Degraded<\/span>|Offline<\/span>/);
  // The directory is read-only for every ticket: no account change is reachable.
  for (const id of IDS) { tab.open(id); assert.doesNotMatch(tab.ad('users'), /hdAdAction|Reset password|Add approved group/, id); }
}

// KB-0100 to KB-0102 and KB-0031 are found by their keywords and attach.
function testKnowledgeArticles() {
  const tab = sim();
  const finds = { 'KB-0100': ['spooler stopped', 'restart service', '7034', 'monitoring alert'], 'KB-0101': ['disk full', 'server disk', 'free space', 'running out of space'],
    'KB-0102': ['reservation', 'time clock', 'device changed IP', 'fixed address'], 'KB-0031': ['mapped drive', 'drive missing', 'gpresult'] };
  for (const [article, queries] of Object.entries(finds)) for (const query of queries) assert.ok(tab.search(query).includes(article), `"${query}" finds ${article}`);
  tab.open('HD-2192'); tab.kb('HD-2192', 'spooler stopped', 'KB-0100'); tab.attach('HD-2192', 'KB-0100');
  assert.equal(tab.rule('HD-2192', { attached: 'KB-0100' }), true);
  // The new articles are practice-only and never in the shared list or a Prove shift.
  assert.equal(tab.run("HD_KB_ARTICLES.some((a) => ['KB-0100', 'KB-0101', 'KB-0102'].includes(a.id))"), false);
  assert.equal(tab.run('HD_ITS05_KB_ARTICLES.every((a) => a.practiceOnly === true)'), true);
  assert.equal(tab.run("HD_KB_ARTICLES.filter((a) => a.id === 'KB-0031').length"), 1, 'KB-0031 is not repeated');
}

/* ------------------------------------------------------------ 7-A */
function work7A(tab) {
  const id = 'HD-2191'; const pc = 'NS-LT-0145';
  tab.open(id);
  tab.triage(id, 'Software', 'Group Policy / drive mapping', pc, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.ask(id, 'team');
  tab.run("hdOpenUser('u-1009')");
  assert.match(tab.ad('users'), /data-hd-member-of>[\s\S]*GG-Operations-Drive/);
  tab.select(pc);
  const out = tab.ps('gpresult /r');
  assert.match(out, /CN=NS-LT-0145,CN=Computers/);
  assert.doesNotMatch(out, /Operations Drive Mapping/, 'the drive mapping is not applied');
  tab.run(`hdAdOpenComputer('${pc}')`);
  assert.match(tab.ad('computers'), /CN=Computers/);
  tab.kb(id, 'mapped drive', 'KB-0031'); tab.attach(id, 'KB-0031');
  tab.choose(id, 'workaround-and-handoff');
  tab.ask(id, 'schedules');
  assert.match(tab.open(id), /I can see the schedules/);
  tab.note(id, A_NOTE);
  tab.comment(id, A_COMMENT);
  tab.group(id, 'Server & Identity');
  assert.equal(tab.ticket(id).status, 'Escalated');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test7A() {
  work7A(sim());
  assertMisses('HD-2191', ['add-group', 'move-object'], ['add-group', 'move-object']);
  // Closing after the workaround leaves "Check my work" naming the hand-off.
  const tab = sim();
  tab.open('HD-2191'); tab.choose('HD-2191', 'workaround-and-handoff'); tab.note('HD-2191', A_NOTE);
  tab.resolve('HD-2191', 'Workaround given.');
  const action = tab.feedback('HD-2191').areas.find((a) => a.area === 'Action');
  assert.equal(action.ok, false);
  assert.match(action.text, /Do not close it after the workaround/);
  assert.equal(tab.closed(), false, 'a closed 7-A without the hand-off is not done');
}

/* ------------------------------------------------------------ 7-B */
function work7B(tab) {
  const id = 'HD-2192';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Print server', 'NS-PRINT01', '2', '2');
  assert.equal(tab.ticket(id).priority, 'P3');
  ['HD-2202', 'HD-2203', 'HD-2204'].forEach((child) => tab.link(child, id));
  tab.open(id);
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler'), /Stopped\s+Spooler/);
  tab.server('NS-PRINT01', '#/helpdesk/server-events');
  assert.match(tab.event(0), /data-hd-server-event-detail="7034"/);
  tab.view('helpdesk/change-log');
  tab.kb(id, 'spooler stopped', 'KB-0100'); tab.attach(id, 'KB-0100');
  tab.ask(id, 'print');
  assert.match(tab.open(id), /The job still sits in the queue/);
  tab.choose(id, 'start-once');
  assert.match(tab.server('NS-PRINT01', '#/helpdesk/server-services'), /hdServerStart/);
  tab.run("hdServerStart('NS-PRINT01', 'Spooler')");
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler'), /Running\s+Spooler/);
  assert.doesNotMatch(tab.server('NS-PRINT01', '#/helpdesk/server-services'), /hdServerStart\(/, 'one start only');
  tab.ask(id, 'print');
  assert.match(tab.open(id), /it printed/);
  tab.note(id, B_NOTE);
  tab.comment(id, B_COMMENT);
  tab.resolve(id, 'Print Spooler started once; a caller printed.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test7B() {
  work7B(sim());
  assertMisses('HD-2192', ['restart-server', 'start-again', 'resolve-on-screen'], ['restart-server', 'start-again']);
  // The Services screen has no Stop or Restart, ever.
  const tab = sim(); tab.open('HD-2192');
  assert.doesNotMatch(tab.server('NS-PRINT01', '#/helpdesk/server-services'), />Stop<|>Restart<|hdServerStop|hdServerRestart/);
  // Another ticket's runbook never starts the Spooler.
  tab.open('HD-2193');
  assert.doesNotMatch(tab.server('NS-PRINT01', '#/helpdesk/server-services'), /hdServerStart\(/);
}

/* ------------------------------------------------------------ 7-C */
function work7C(tab) {
  const id = 'HD-2193';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Server storage', 'NS-FILE01', '1', '2');
  assert.equal(tab.ticket(id).priority, 'P2');
  assert.match(tab.server('NS-FILE01'), /19\.1/);
  tab.server('NS-FILE01', '#/helpdesk/server-events');
  assert.match(tab.event(0), /data-hd-server-event-detail="2013"/);
  tab.server('NS-FILE01', '#/helpdesk/file-server');
  tab.run("hdFileSet({ tab:'sizes' })");
  const sizes = tab.view('helpdesk/file-server');
  assert.match(sizes, /data-hd-folder-sizes="NS-FILE01"[\s\S]*Video-Exports/);
  assert.doesNotMatch(sizes, /hdFileDelete|>Delete<|>Move</, 'read-only');
  tab.view('helpdesk/change-log');
  tab.kb(id, 'disk full', 'KB-0101'); tab.attach(id, 'KB-0101');
  tab.choose(id, 'leave-and-escalate');
  tab.team(id, 'lead');
  tab.note(id, C_NOTE);
  tab.group(id, 'Server & Identity');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test7C() {
  work7C(sim());
  assertMisses('HD-2193', ['delete-temp', 'empty-bin', 'message-marketing'], ['delete-temp', 'empty-bin']);
  // P3 because nobody has complained is a miss "Check my work" names.
  const tab = sim(); tab.open('HD-2193');
  tab.triage('HD-2193', 'Hardware', 'Server storage', 'NS-FILE01', '2', '2');
  assert.match(tab.feedback('HD-2193').areas.find((a) => a.area === 'Triage').text, /P3 is too low/);
}

/* ------------------------------------------------------------ 7-D */
function work7D(tab) {
  const id = 'HD-2194';
  tab.open(id);
  tab.triage(id, 'Network', 'File share access', 'NS-FILE01', '1', '1');
  assert.equal(tab.ticket(id).priority, 'P1');
  ['HD-2205', 'HD-2206'].forEach((child) => tab.link(child, id));
  tab.open(id);
  assert.match(tab.server('NS-FILE01'), /Offline/);
  const out = tab.ps('Test-NetConnection NS-FILE01 -Port 445');
  assert.match(out, /TcpTestSucceeded : False/);
  tab.choose(id, 'escalate-and-update');
  tab.team(id, 'lead');
  tab.group(id, 'Server & Identity');
  tab.note(id, D_NOTE);
  tab.comment(id, D_COMMENT);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test7D() {
  work7D(sim());
  assertMisses('HD-2194', ['restart-server', 'restart-laptops', 'promise-time'], ['restart-server']);
  // A one-person P4 is a miss "Check my work" names.
  const tab = sim(); tab.open('HD-2194');
  tab.triage('HD-2194', 'Network', 'File share access', 'NS-FILE01', '3', '2');
  assert.match(tab.feedback('HD-2194').areas.find((a) => a.area === 'Triage').text, /one person's P4/);
  // Another ticket's state: NS-FILE01 answers on 445 again.
  tab.open('HD-2193');
  assert.match(tab.ps('Test-NetConnection NS-FILE01 -Port 445'), /TcpTestSucceeded : True/);
}

/* ------------------------------------------------------------ 7-E */
function work7E(tab) {
  const id = 'HD-2195';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Network device', 'NS-WH-CLOCK02', '2', '2');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.run("hdDhcpOpen('Warehouse')");
  const scope = tab.view('helpdesk/dhcp');
  assert.match(scope, /data-hd-dhcp-lease="NS-WH-CLOCK02"[\s\S]*10\.20\.30\.142[\s\S]*Today 06:40/);
  assert.doesNotMatch(scope, /data-hd-dhcp-reservation="NS-WH-CLOCK02"/, 'nothing reserved for the clock');
  assert.match(tab.view('helpdesk/dns'), /data-hd-dns-record="timeclock-02:A"[\s\S]*10\.20\.30\.61/);
  tab.kb(id, 'reservation', 'KB-0102'); tab.attach(id, 'KB-0102');
  tab.choose(id, 'give-payroll-address');
  tab.note(id, E_NOTE);
  tab.comment(id, E_COMMENT);
  tab.run(`hdConvertSet('${id}','item','Network device reservation'); hdConvertSet('${id}','requestedFor','Monica Hall');
    hdConvertSet('${id}','device','NS-WH-CLOCK02'); hdConvertSet('${id}','mac','00:1B:44:5E:9A:42'); hdConvertSet('${id}','address','10.20.30.61'); hdConvertSet('${id}','scope','Warehouse');
    hdConvertToRequest('${id}')`);
  const request = plain(tab.ticket(id).request);
  assert.equal(request.number, 'RITM0010163');
  assert.equal(request.item, 'Network device reservation');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test7E() {
  work7E(sim());
  assertMisses('HD-2195', ['call-outage', 'restart-clock', 'set-by-hand'], []);
  // DHCP itself is never changed from a Practice ticket.
  const tab = sim(); tab.open('HD-2195');
  tab.run("hdDhcpOpen('Warehouse')");
  assert.doesNotMatch(tab.view('helpdesk/dhcp'), /Add reservation|hdDhcpReserve|>Delete</);
}

/* ------------------------------------------------------------ the set */
function testCompletionAfterAllFive() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  work7A(tab); work7B(tab); work7C(tab); work7D(tab);
  assert.equal(tab.closed(), false, '7-E is still open');
  tab.run('hdPracticeReport()');
  assert.equal(sent.filter((m) => m.type === 'mnt-practice-complete').length, 0, 'nothing is sent early');
  work7E(tab);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1, 'one completion message');
  assert.equal(done[0].id, 'its-05');
  assert.deepEqual(done[0].tickets, IDS);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
  assert.doesNotMatch(JSON.stringify(done[0]), /score|points|expected|Reported:/i);
}

// No score or points anywhere the student reads in the practice set.
function testNoScoreInTheView() {
  const tab = sim();
  work7A(tab); work7B(tab); work7C(tab); work7D(tab); work7E(tab);
  const pages = [tab.view('helpdesk/tickets'), tab.view('helpdesk/dashboard')];
  IDS.forEach((id) => { tab.checkWork(id); pages.push(tab.open(id)); });
  pages.forEach((html, i) => {
    const text = shown(html);
    assert.doesNotMatch(text, /\bscores?\b|\bpoints?\b|\d+\s*\/\s*100\b|\bpass(ed)? mark\b/i, `page ${i}: ${(text.match(/.{0,60}\b(scores?|points?)\b.{0,30}/i) || [''])[0]}`);
  });
}

// Nothing from the Prove It ticket is in the practice set.
function testNothingFromTheProveTicket() {
  const tab = sim();
  const text = JSON.stringify(plain(tab.run("HD_TICKET_TEMPLATES.filter((t) => /^HD-2(189|19[0-5]|20[2-6])$/.test(t.id))")));
  assert.doesNotMatch(text, /HD-2128|CHG-4519|GG-Sales-Managers|Tara Singh/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m07-practice-tickets\.test\.js/);
}

const tests = [testSetOpensOnItsOwnClocks, testKnowledgeArticles, test7A, test7B, test7C, test7D, test7E, testCompletionAfterAllFive, testNoScoreInTheView, testNothingFromTheProveTicket, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m07-practice-tickets: all ${tests.length} passed`);

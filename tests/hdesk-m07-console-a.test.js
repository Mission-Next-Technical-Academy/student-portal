'use strict';
/* Help Desk simulator: the server state and screens added for Module 7 (key
 * its-05), console A (ui/helpdesk.js "Server state and screens"): server state
 * per set and per ticket, Server Manager per server with its warning tile,
 * the Services screen with its single runbook Start, server event logs,
 * the file server's Share, NTFS and Effective access panes with the
 * read-only folder-size view, and the change log.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-97xx,
 * TEST text, TEST- groups), never in ui/helpdesk-data.js. No Module 7
 * content: all text below is a made-up test fixture. Every older ticket, set
 * and Prove shift must look and behave as before. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
// Set-level state: every server healthy, as a morning check would see it.
const SET_SERVERS = {
  'NS-DC01': {
    status: 'Online', service: 'TEST directory healthy',
    roles: [{ name: 'TEST Directory role', services: ['TESTDS'] }, { name: 'TEST Name role', services: ['TESTDNS'] }],
    services: [
      { name: 'TESTDS', displayName: 'TEST Directory Service', status: 'Running', startup: 'Automatic', logOnAs: 'Local System' },
      { name: 'TESTDNS', displayName: 'TEST Name Service', status: 'Running', startup: 'Automatic', logOnAs: 'Local System' },
    ],
    events: {
      system: [{ level: 'Information', time: 'Today 06:00', source: 'TEST', id: '7036', message: 'TEST service entered the running state.' }],
      'directory-service': [{ level: 'Information', time: 'Today 06:01', source: 'TEST', id: '1000', message: 'TEST directory started.' }],
    },
  },
  'NS-FILE01': {
    status: 'Online', service: 'TEST file service healthy',
    volumes: [{ drive: 'D:', label: 'TEST data', sizeGb: 500, freeGb: 250 }],
    events: { system: [
      { level: 'Warning', time: 'Today 05:00', source: 'srv', id: '2013', message: 'TEST disk is at or near capacity.' },
      { level: 'Error', time: 'Today 04:00', source: 'Service Control Manager', id: '7031', message: 'TEST service terminated unexpectedly; restart action taken.' },
    ] },
    shares: [{ name: 'TESTShare', path: '\\\\NS-FILE01\\TESTShare', status: 'Healthy',
      share: [{ who: 'GG-HR-Users', access: 'Change' }, { who: 'Everyone', access: 'Read' }],
      ntfs: [{ who: 'GG-HR-Readers', access: 'Read' }, { who: 'NORTHSTAR\\mchen', access: 'Full Control' }, { who: 'TEST-Contributors', access: 'Modify' }] },
    { name: 'TESTLocked', path: '\\\\NS-FILE01\\TESTLocked', share: [{ who: 'TEST-Managers', access: 'Change' }], ntfs: [{ who: 'GG-HR-Users', access: 'Modify' }] }],
    folderSizes: [{ path: 'TEST\\Small', gb: 2, created: 'Last year' }, { path: 'TEST\\Large', gb: 38, created: 'Today' }],
  },
  'NS-PRINT01': {
    status: 'Online', service: 'TEST print healthy',
    services: [{ name: 'TESTSpool', displayName: 'TEST Spooler', status: 'Running', startup: 'Automatic', logOnAs: 'Local System' }],
  },
};
const SET_CHANGES = [{ number: 'CHG-9701', when: 'TEST last night', what: 'TEST record added', who: 'TEST Owner', state: 'Completed', ci: 'NS-DC01', details: 'TEST nothing broke.' }];
// Ticket A: the spooler stopped; its runbook allows one start.
const STOPPED = base({ id: 'HD-9701', number: 'INC0019701', requester: 'Maya Chen', createdAt: at(WED, '08:10'), description: 'TEST service stopped',
  console: { matrix: {},
    servers: { 'NS-PRINT01': { status: 'Degraded', service: 'TEST spooler stopped',
      services: [{ name: 'TESTSpool', displayName: 'TEST Spooler', status: 'Stopped', startup: 'Automatic', logOnAs: 'Local System' },
        { name: 'TESTOther', displayName: 'TEST Other', status: 'Stopped', startup: 'Manual', logOnAs: 'NORTHSTAR\\svc-test' }],
      events: { system: [
        { level: 'Error', time: 'Today 08:12', source: 'Service Control Manager', id: '7034', message: 'TEST service terminated unexpectedly.' },
        { level: 'Error', time: 'Today 07:00', source: 'Service Control Manager', id: '7038', message: 'TEST account could not log on.' },
        { level: 'Information', time: 'Today 06:00', source: 'TEST', id: '7036', message: 'TEST running.' },
      ] } } },
    serviceStart: [{ server: 'NS-PRINT01', service: 'TESTSpool', after: { status: 'Online', service: 'TEST spooler running' } }],
    changes: [{ number: 'CHG-9702', when: 'TEST yesterday', what: 'TEST ticket change', who: 'TEST Owner', state: 'Completed' }] } });
// Ticket B: the same set, the file server offline and a volume nearly full.
const OFFLINE = base({ id: 'HD-9702', number: 'INC0019702', requester: 'Maya Chen', createdAt: at(WED, '08:20'), description: 'TEST server offline',
  console: { matrix: {}, servers: { 'NS-FILE01': { status: 'Offline', service: 'TEST not responding', volumes: [{ drive: 'D:', sizeGb: 500, freeGb: 19, growth: '+40 GB in 6 hours' }], warnings: ['TEST own warning'] } } } });
// Ticket C: no new keys at all.
const PLAINT = base({ id: 'HD-9703', number: 'INC0019703', requester: 'Maya Chen', createdAt: at(WED, '08:30'), description: 'TEST plain', console: { matrix: {} } });
const TICKETS = [STOPPED, OFFLINE, PLAINT];
const SETS = {
  practice: { 'test-servers': { title: 'Test servers', tickets: ['HD-9701', 'HD-9702', 'HD-9703'], now: at(WED, '08:40'), servers: SET_SERVERS, changes: SET_CHANGES },
    'test-ticket-only': { title: 'Test ticket only', tickets: ['HD-9701', 'HD-9703'], now: at(WED, '08:40') } },
};

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store(), before = '' } = {}) {
  const u = new URL(url);
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: () => null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: local, sessionStorage: store(),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('helpdesk-data.js'), ctx, { filename: 'helpdesk-data.js' });
  if (withTest) {
    ctx.__test = { tickets: TICKETS, sets: SETS };
    vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
      Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets.practice)));`, ctx);
  }
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, run,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    server: (name, route) => { run(`hdServerOpen(${j(name)}${route ? `, ${j(route)}` : ''})`); return run(`VIEWS[${j((route || '#/helpdesk/server-manager').slice(2))}]()`); },
    seen: () => [...(run('hdState.serverSeen') || [])],
  };
}
// A practice set opens with its first ticket selected but not opened, so only
// the set's own state shows until the student opens a ticket.
const servers = (local) => sim({ url: 'https://academy.test/sim/?practice=test-servers&student=stu-1#/helpdesk/tickets', local });
const NEW_MARKERS = /data-hd-(server-state|server-detail|server-warnings|server-tool|services=|service-start|server-logs|server-log-picker|server-event|shares=|share-detail|effective-access|folder-sizes|change-log|change-detail|servers-card)/;
const NOT_THERE = { 'helpdesk/server-services': /Not available on this server in this shift/, 'helpdesk/server-events': /Not available on this server in this shift/, 'helpdesk/change-log': /Change log<\/h1><div class="page-subtitle">Not available in this shift/ };
// master's output before this change, on the shared shift and Module 1's
// Prove shift (its serverOverrides has only status and service).
const PINNED = {
  shared: { 'server-manager': 'c7ed277d80c8e851deb4971e2c81cb70146a6201798290747f59b139ff33e450', 'file-server': '03c0b3eff8d87ca535f711f92a636d505497a0d047435b23d1d560163ca14aef', environment: '54bb5277bc285ce18e5425ac82d1a8518f54402f4d7f26678cd68a2544bf64c8' },
  prove: { 'server-manager': 'cce2ab52ad7dd1e02220b858ffc184b1d02617050e1c4cfd99477eca3f66908e', 'file-server': '03c0b3eff8d87ca535f711f92a636d505497a0d047435b23d1d560163ca14aef', environment: '653cf3d33c4217f6fadb603b2034497fd28e8c6c7bd7468480dfc088e1e25914' },
};
function assertFixed(tab, label) {
  assert.equal(tab.view('helpdesk/server-manager'), tab.run('hdServerManagerFixed()'), `${label} server-manager`);
  assert.equal(tab.view('helpdesk/file-server'), tab.run('hdFileServerFixed()'), `${label} file-server`);
  assert.doesNotMatch(tab.view('helpdesk/event-viewer'), NEW_MARKERS, `${label} event-viewer`);
  for (const [route, text] of Object.entries(NOT_THERE)) assert.match(tab.view(route), text, `${label} ${route}`);
  assert.equal(tab.run('hdServerNames().length'), 0, `${label} no server state`);
  assert.equal(tab.run('hdServerChanges().length'), 0, `${label} no change log`);
}

// Every older ticket, set and Prove shift sees today's screens, with every
// new key absent: pinned against master's output, and identical to the fixed
// screens in every set and shift.
function testOldTicketsTurnNothingOn() {
  const plain = sim({ withTest: false }); const tab = sim();
  for (const [route, hash] of Object.entries(PINNED.shared)) {
    assert.equal(sha(plain.view(`helpdesk/${route}`)), hash, `shared ${route} as on master`);
    assert.equal(sha(tab.view(`helpdesk/${route}`)), hash, `shared ${route} with the test tickets loaded`);
  }
  const prove01 = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m07#/helpdesk/tickets' });
  for (const [route, hash] of Object.entries(PINNED.prove)) assert.equal(sha(prove01.view(`helpdesk/${route}`)), hash, `prove its-01 ${route} as on master`);
  assert.match(prove01.view('helpdesk/server-manager'), /Print Spooler running · queues published/);
  assertFixed(tab, 'shared');
  for (const id of tab.run('hdState.tickets.map((t) => t.id)')) {
    const page = tab.open(id);
    assert.doesNotMatch(page, NEW_MARKERS, `${id} shows no new feature`);
    assertFixed(tab, `shared ${id}`);
  }
  // Module 7's own sets (its-05, its-05-guided) turn these screens on: tests/hdesk-m07-guided-lab.test.js
  // and tests/hdesk-m07-practice-tickets.test.js cover them. Module 8's sets
  // (its-06, its-06-guided, its-06-extension) reuse them: tests/hdesk-m08-guided-lab.test.js
  // and tests/hdesk-m08-practice-tickets.test.js. Module 9's sets (its-04,
  // its-04-guided) reuse the servers and change log: tests/hdesk-m09-guided-lab.test.js
  // and tests/hdesk-m09-practice-tickets.test.js.
  const MODULE_7_SETS = ['its-05', 'its-05-guided', 'its-06', 'its-06-guided', 'its-06-extension', 'its-04', 'its-04-guided'];
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-') && !MODULE_7_SETS.includes(k))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    assertFixed(set, key);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) { assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`); assertFixed(set, `${key} ${id}`); }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS')).filter((k) => !MODULE_7_SETS.includes(k))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    assertFixed(set, key);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) { assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`); assertFixed(set, `${key} ${id}`); }
  }
  // Every older Prove shift. Module 7's own Prove shift turns these screens on
  // (tests/hdesk-m07-prove.test.js), and so does Module 9's, whose server
  // state holds the file share and names its laptop reaches
  // (tests/hdesk-m09-prove.test.js).
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !['its-05', 'its-04'].includes(k))) {
    const prove = sim({ url: `https://academy.test/sim/?prove=${key}&student=student-m07#/helpdesk/tickets` });
    assertFixed(prove, `prove ${key}`);
    // A screen that shows nothing is never recorded as evidence.
    const opened = [...prove.run('hdState.prove.opened')];
    for (const route of Object.keys(NOT_THERE)) assert.equal(opened.includes(`screen:${route}`), false, `prove ${key} ${route}`);
  }
  // A Service Start control never exists, and no Stop or Restart anywhere.
  assert.doesNotMatch(read('helpdesk.js'), /data-hd-service-(stop|restart)|hdServer(Stop|Restart)\b/);
}

// Server state per set and per ticket: the selected ticket decides.
function testServerStatePerTicket() {
  const tab = servers();
  const row = (page, name) => (page.match(new RegExp(`<tr data-hd-server-row="${name}"[\\s\\S]*?</tr>`)) || [''])[0];
  let page = tab.view('helpdesk/server-manager');
  assert.match(page, /data-hd-server-state/);
  assert.match(row(page, 'NS-FILE01'), /TEST file service healthy/);
  assert.match(row(page, 'NS-PRINT01'), /TEST print healthy/);
  assert.match(row(page, 'NS-APP01'), /TLS certificate expired/, 'a server with no state keeps its fixture row');
  assert.doesNotMatch(row(page, 'NS-APP01'), /hdServerOpen/);
  assert.match(page, /data-hd-change-log-open/);
  tab.open('HD-9702');
  page = tab.view('helpdesk/server-manager');
  assert.match(row(page, 'NS-FILE01'), /Offline[\s\S]*TEST not responding/);
  tab.open('HD-9701');
  page = tab.view('helpdesk/server-manager');
  assert.match(row(page, 'NS-FILE01'), /TEST file service healthy/, 'the other ticket\'s state is gone');
  assert.match(row(page, 'NS-PRINT01'), /Degraded[\s\S]*TEST spooler stopped/);
  // A ticket with no new keys shows the set's state.
  tab.open('HD-9703');
  assert.match(row(tab.view('helpdesk/server-manager'), 'NS-PRINT01'), /TEST print healthy/);
  // A set with no servers: only the ticket that names one turns it on.
  const only = sim({ url: 'https://academy.test/sim/?practice=test-ticket-only&student=stu-1#/helpdesk/tickets' });
  assert.equal(only.view('helpdesk/server-manager'), only.run('hdServerManagerFixed()'));
  only.open('HD-9703');
  assert.equal(only.view('helpdesk/server-manager'), only.run('hdServerManagerFixed()'));
  assert.doesNotMatch(only.open('HD-9703'), /data-hd-servers-card/);
  assert.match(only.open('HD-9701'), /data-hd-servers-card[\s\S]*Open NS-PRINT01[\s\S]*Change log/);
  assert.match(only.view('helpdesk/server-manager'), /data-hd-server-row="NS-PRINT01"/);
}

// A fresh set, whichever ticket it selects first: until the student opens a
// ticket, only the set's state shows, no Start is offered and no ticket
// records anything. A coach that clears the selection clears it again.
function testUnopenedTicketDecidesNothing() {
  for (let round = 0; round < 6; round += 1) {
    const tab = servers();
    assert.ok(tab.run('hdState.selectedTicketId'), 'the set selects a ticket');
    assert.match(tab.view('helpdesk/server-manager'), /data-hd-server-row="NS-PRINT01"[\s\S]*?TEST print healthy/);
    assert.match(tab.view('helpdesk/server-manager'), /data-hd-server-warnings="0"/);
    const services = tab.server('NS-PRINT01', '#/helpdesk/server-services');
    assert.doesNotMatch(services, /data-hd-service-start/);
    tab.run("hdServerStart('NS-PRINT01','TESTSpool')");
    tab.view('helpdesk/change-log'); tab.server('NS-FILE01', '#/helpdesk/file-server');
    assert.deepEqual(JSON.parse(tab.run("JSON.stringify(hdState.tickets.filter((t) => t.consoleState && ((t.consoleState.serverSeen || []).length || (t.consoleState.serverStarts || []).length)).map((t) => t.id))")), []);
    assert.deepEqual(JSON.parse(tab.run('JSON.stringify(hdServerChanges().map((c) => c.number))')), ['CHG-9701'], 'only the set\'s changes');
  }
  const tab = servers();
  tab.open('HD-9701');
  assert.match(tab.view('helpdesk/server-manager'), /data-hd-server-row="NS-PRINT01"[\s\S]*?TEST spooler stopped/);
  tab.run('hdState.selectedTicketId = null');
  assert.match(tab.view('helpdesk/server-manager'), /data-hd-server-row="NS-PRINT01"[\s\S]*?TEST print healthy/);
}

// Server Manager's detail and warning tile.
function testServerManagerDetailAndWarnings() {
  const tab = servers();
  let page = tab.view('helpdesk/server-manager');
  assert.match(page, /data-hd-server-warnings="0"/, 'a healthy set shows no warning');
  page = tab.server('NS-DC01');
  assert.match(page, /data-hd-server-detail="NS-DC01"/);
  assert.match(page, /data-hd-role="TEST Directory role"[\s\S]*TEST Directory Service[\s\S]*Running/);
  assert.match(page, /data-hd-server-tool="services"[\s\S]*data-hd-server-tool="logs"/);
  assert.doesNotMatch(page, /data-hd-server-tool="files"/);
  assert.deepEqual(tab.seen(), ['server:NS-DC01']);
  page = tab.server('NS-FILE01');
  assert.match(page, /data-hd-volume="D:"[\s\S]*50% used/);
  assert.match(page, /data-hd-server-tool="files"/);
  tab.open('HD-9702');
  page = tab.view('helpdesk/server-manager');
  const tile = page.match(/data-hd-server-warnings="(\d+)"[\s\S]*?<\/small>/);
  assert.equal(tile[1], '3');
  assert.match(tile[0], /NS-FILE01: TEST own warning/);
  assert.match(tile[0], /NS-FILE01: Server Offline/);
  assert.match(tile[0], /NS-FILE01: Volume D: 96% used \(19 GB free of 500 GB\)/);
  tab.open('HD-9701');
  const tile2 = tab.view('helpdesk/server-manager').match(/data-hd-server-warnings="(\d+)"[\s\S]*?<\/small>/);
  assert.equal(tile2[1], '2', 'Degraded, and the stopped Automatic service; a stopped Manual one is not a warning');
  assert.match(tile2[0], /TEST Spooler is Stopped \(startup Automatic\)/);
  assert.doesNotMatch(tile2[0], /TEST Other/);
  // Opening the server is recorded on the ticket that was open.
  assert.equal(tab.run("(hdTicketById('HD-9701').consoleState.serverSeen || []).includes('server:NS-PRINT01')"), false);
  tab.server('NS-PRINT01');
  assert.ok(tab.run("hdTicketById('HD-9701').consoleState.serverSeen").includes('server:NS-PRINT01'));
}

// Services: Log On As, and one Start only where the open ticket allows it.
function testServicesStartOnlyByRunbook() {
  const tab = servers();
  // No ticket open: the set's healthy spooler, no Start.
  let page = tab.server('NS-PRINT01', '#/helpdesk/server-services');
  assert.match(page, /data-hd-services="NS-PRINT01"/);
  assert.match(page, /data-hd-service="TESTSpool" data-hd-service-status="Running"[\s\S]*Automatic[\s\S]*Local System/);
  assert.doesNotMatch(page, /data-hd-service-start/);
  // A ticket with no runbook: no Start even on the stopped service.
  tab.open('HD-9702');
  assert.doesNotMatch(tab.server('NS-PRINT01', '#/helpdesk/server-services'), /data-hd-service-start/);
  tab.open('HD-9701');
  page = tab.server('NS-PRINT01', '#/helpdesk/server-services');
  assert.match(page, /data-hd-service="TESTOther" data-hd-service-status="Stopped"[\s\S]*NORTHSTAR\\svc-test/);
  const starts = [...page.matchAll(/data-hd-service-start="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(starts, ['TESTSpool'], 'one Start, on the runbook service only');
  assert.doesNotMatch(page, />(Stop|Restart)</);
  // Starting a service the runbook doesn't name does nothing.
  tab.run("hdServerStart('NS-PRINT01','TESTOther')");
  assert.equal(tab.run("(hdTicketById('HD-9701').consoleState.serverStarts || []).length"), 0);
  tab.run("hdServerStart('NS-PRINT01','TESTSpool')");
  page = tab.view('helpdesk/server-services');
  assert.match(page, /data-hd-service="TESTSpool" data-hd-service-status="Running"/);
  assert.doesNotMatch(page, /data-hd-service-start/, 'started once, the Start is gone');
  assert.deepEqual([...tab.run("hdTicketById('HD-9701').consoleState.actions.map((a) => a.id)")], ['service-started']);
  assert.match(tab.run("hdTicketById('HD-9701').troubleshootingHistory.slice(-1)[0].action"), /On NS-PRINT01: started TEST Spooler\./);
  assert.ok(tab.run("hdState.practiceLog.some((e) => e.action === 'service-started' && e.server === 'NS-PRINT01')"));
  assert.match(tab.view('helpdesk/server-manager'), /data-hd-server-row="NS-PRINT01"[\s\S]*?Online[\s\S]*?TEST spooler running/);
  // A second call does nothing.
  tab.run("hdServerStart('NS-PRINT01','TESTSpool')");
  assert.equal(tab.run("hdTicketById('HD-9701').consoleState.serverStarts.length"), 1);
  // The start belongs to that ticket: the other ticket sees the set's state.
  tab.open('HD-9702');
  assert.match(tab.view('helpdesk/server-services'), /data-hd-service="TESTSpool" data-hd-service-status="Running"/);
  // A resolved ticket's runbook no longer offers Start.
  const fresh = servers();
  fresh.open('HD-9701'); fresh.run("hdTicketById('HD-9701').status = 'Resolved'");
  assert.doesNotMatch(fresh.server('NS-PRINT01', '#/helpdesk/server-services'), /data-hd-service-start/);
  // Opened on a server without services: not available.
  assert.match(fresh.server('NS-FILE01', '#/helpdesk/server-services'), /Not available on this server/);
}

// Server event logs: System and Directory Service, filter, open an event.
function testServerEventLogs() {
  const tab = servers();
  let page = tab.server('NS-DC01', '#/helpdesk/server-events');
  assert.match(page, /data-hd-server-logs="NS-DC01"/);
  assert.match(page, /data-hd-server-log="system"[\s\S]*data-hd-server-log="directory-service"/);
  tab.run("hdServerLogSet({ log:'directory-service' })");
  assert.match(tab.view('helpdesk/server-events'), /data-hd-server-event="1000"/);
  tab.open('HD-9701');
  page = tab.server('NS-PRINT01', '#/helpdesk/server-events');
  assert.doesNotMatch(page, /data-hd-server-log="directory-service"/, 'only the logs the state has');
  assert.deepEqual([...page.matchAll(/data-hd-server-event="(\d+)"/g)].map((m) => m[1]), ['7034', '7038', '7036']);
  tab.run("hdServerLogSet({ level:'Error' })");
  assert.match(tab.view('helpdesk/server-events'), /2 of 3 shown/);
  tab.run('hdServerLogOpen(1)');
  assert.match(tab.view('helpdesk/server-events'), /data-hd-server-event-detail="7038"[\s\S]*TEST account could not log on/);
  assert.ok(tab.seen().includes('server-log:NS-PRINT01:system'));
  assert.ok(tab.seen().includes('server-event:NS-PRINT01:system:7038'));
  assert.ok(tab.seen().includes('server-log:NS-DC01:directory-service'));
  assert.ok(tab.run("hdTicketById('HD-9701').consoleState.serverSeen").includes('server-event:NS-PRINT01:system:7038'));
  // Another ticket gives NS-PRINT01 no logs: the open event does not carry over.
  tab.open('HD-9702');
  assert.match(tab.view('helpdesk/server-events'), /Not available on this server/);
  assert.equal(tab.run("(hdTicketById('HD-9702').consoleState.serverSeen || []).some((k) => k.startsWith('server-event:'))"), false);
  // The shared Event Viewer lists the servers with logs; a PC's logs keep
  // their three tabs (no Directory Service).
  assert.match(tab.view('helpdesk/event-viewer'), /data-hd-server-log-picker[\s\S]*NS-DC01[\s\S]*NS-PRINT01/);
  assert.equal(tab.run("HD_WIN_LOGS.map(([id]) => id).join(',')"), 'system,application,diagnostics-performance');
  // 7031 and 2013 are plain fixtures too, and each opens.
  tab.open('HD-9703');
  const file = tab.server('NS-FILE01', '#/helpdesk/server-events');
  assert.deepEqual([...file.matchAll(/data-hd-server-event="(\d+)"/g)].map((m) => m[1]), ['2013', '7031']);
  tab.run('hdServerLogOpen(0)');
  assert.match(tab.view('helpdesk/server-events'), /data-hd-server-event-detail="2013"[\s\S]*TEST disk is at or near capacity/);
  tab.run('hdServerLogOpen(1)');
  assert.match(tab.view('helpdesk/server-events'), /data-hd-server-event-detail="7031"[\s\S]*restart action taken/);
  assert.ok(tab.run("hdTicketById('HD-9703').consoleState.serverSeen").includes('server-event:NS-FILE01:system:2013'));
}

// File server: two layers, effective access worked out from groups, sizes.
function testFileServer() {
  const tab = servers();
  let page = tab.server('NS-FILE01', '#/helpdesk/file-server');
  assert.match(page, /data-hd-shares="NS-FILE01"[\s\S]*data-hd-share="TESTShare"[\s\S]*data-hd-share="TESTLocked"/);
  assert.doesNotMatch(page, /Evan Parker/, 'not the fixed card');
  tab.run("hdFileSet({ share:'TESTShare' })");
  page = tab.view('helpdesk/file-server');
  assert.match(page, /data-hd-share-tab="share"[\s\S]*GG-HR-Users<\/td><td>Change/);
  tab.run("hdFileSet({ tab:'ntfs' })");
  assert.match(tab.view('helpdesk/file-server'), /data-hd-share-tab="ntfs"[\s\S]*GG-HR-Readers<\/td><td>Read/);
  tab.run("hdFileSet({ tab:'effective' })");
  assert.doesNotMatch(tab.view('helpdesk/file-server'), /data-hd-effective-access=/, 'no user chosen yet');
  const access = (userId, share) => {
    if (share) tab.run(`hdFileSet({ share:${JSON.stringify(share)} }); hdFileSet({ tab:'effective' })`);
    tab.run(`hdFileSet({ user:${JSON.stringify(userId)} })`);
    return tab.view('helpdesk/file-server').match(/data-hd-effective-access="([^"]+)"/)[1];
  };
  assert.equal(access('u-1004'), 'Read', 'share Change, NTFS Read: the more restrictive');
  // Each layer keeps its own words: Change on the share, Read on NTFS.
  assert.match(tab.view('helpdesk/file-server'), /Share permissions<\/dt><dd>Change<small>GG-HR-Users · Change<br>Everyone · Read<\/small>[\s\S]*NTFS permissions<\/dt><dd>Read<small>GG-HR-Readers · Read/);
  assert.match(tab.view('helpdesk/file-server'), /more restrictive of the two layers/, 'Practice teaches the rule');
  assert.match(tab.view('helpdesk/file-server'), /data-hd-share="TESTShare"[\s\S]*?hd-badge ok">Healthy</, 'a share shows its own status');
  assert.equal(access('u-1001'), 'Read', 'Everyone Read on the share, Full Control by username on NTFS');
  assert.equal(access('u-1011'), 'No access', 'Everyone Read on the share, nothing on NTFS');
  assert.equal(access('u-1004', 'TESTLocked'), 'No access', 'NTFS Modify, no share entry');
  assert.match(tab.view('helpdesk/file-server'), /Share permissions<\/dt><dd>No access<small>No entry covers this user/);
  // Read & Execute keeps its own name when it is the more restrictive layer.
  tab.run("HD_PRACTICE_SETS['test-servers'].servers['NS-FILE01'].shares.push({ name:'TESTExec', path:'\\\\\\\\NS-FILE01\\\\TESTExec', share:[{ who:'Everyone', access:'Full Control' }], ntfs:[{ who:'GG-HR-Readers', access:'Read & Execute' }] })");
  assert.equal(access('u-1004', 'TESTExec'), 'Read &amp; Execute');
  assert.match(tab.view('helpdesk/file-server'), /Share permissions<\/dt><dd>Full Control<small>[\s\S]*NTFS permissions<\/dt><dd>Read &amp; Execute<small>/);
  // A group change on the account is read live (userOverrides).
  tab.run("hdState.userOverrides['u-1004'] = { groups:['GG-HR-Users','TEST-Managers'] }");
  assert.equal(access('u-1004', 'TESTLocked'), 'Modify');
  for (const key of ['file-share:NS-FILE01:TESTShare:share', 'file-share:NS-FILE01:TESTShare:ntfs', 'effective-access:NS-FILE01:TESTShare:u-1004', 'effective-access:NS-FILE01:TESTLocked:u-1004']) assert.ok(tab.seen().includes(key), key);
  // Folder sizes, largest first, read-only.
  tab.run("hdFileSet({ tab:'sizes' })");
  page = tab.view('helpdesk/file-server');
  assert.deepEqual([...page.matchAll(/data-hd-folder="([^"]+)"/g)].map((m) => m[1]), ['TEST\\Large', 'TEST\\Small']);
  assert.doesNotMatch(page, /onclick="[^"]*(Delete|Remove|Move)/);
  assert.ok(tab.seen().includes('folder-sizes:NS-FILE01'));
  // No edit control for a permission anywhere on the screen.
  assert.doesNotMatch(read('helpdesk.js').match(/function hdFileServerView[\s\S]*?\n}/)[0], /Grant|Revoke|Add permission|Remove permission/);
}

// The change log: the set's and the open ticket's changes; one opens.
function testChangeLog() {
  const tab = servers();
  let page = tab.view('helpdesk/change-log');
  assert.deepEqual([...page.matchAll(/data-hd-change="([^"]+)"/g)].map((m) => m[1]), ['CHG-9701']);
  tab.open('HD-9701');
  page = tab.view('helpdesk/change-log');
  assert.deepEqual([...page.matchAll(/data-hd-change="([^"]+)"/g)].map((m) => m[1]), ['CHG-9701', 'CHG-9702']);
  tab.run("hdChangeLogOpen('CHG-9701')");
  page = tab.view('helpdesk/change-log');
  assert.match(page, /data-hd-change-detail="CHG-9701"[\s\S]*TEST last night[\s\S]*TEST Owner[\s\S]*Completed[\s\S]*NS-DC01[\s\S]*TEST nothing broke/);
  tab.run("hdChangeLogOpen('CHG-0000')");
  assert.equal(tab.run('hdState.changeLogOpen'), 'CHG-9701', 'an unknown number opens nothing');
  assert.ok(tab.seen().includes('change-log'));
  assert.ok(tab.seen().includes('change:CHG-9701'));
  assert.ok(tab.run("hdTicketById('HD-9701').consoleState.serverSeen").includes('change:CHG-9701'));
}

// A Prove shift may give servers, shares and changes: each screen records its
// source once; no Start control; Practice records nothing.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; shift.servers = ${JSON.stringify({ 'NS-FILE01': SET_SERVERS['NS-FILE01'], 'NS-PRINT01': STOPPED.console.servers['NS-PRINT01'] })}; shift.changes = ${JSON.stringify(SET_CHANGES)}; }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m07b#/helpdesk/tickets', before: inject, withTest: false });
  const page = prove.view('helpdesk/server-manager');
  assert.match(page, /data-hd-server-state/);
  assert.match(page, /data-hd-server-row="NS-PRINT01"[\s\S]*?Degraded/, 'the shift\'s servers win over its serverOverrides');
  prove.server('NS-PRINT01', '#/helpdesk/server-services');
  assert.doesNotMatch(prove.view('helpdesk/server-services'), /data-hd-service-start/);
  prove.run("hdServerStart('NS-PRINT01','TESTSpool')");
  prove.server('NS-PRINT01', '#/helpdesk/server-events');
  prove.server('NS-FILE01', '#/helpdesk/file-server');
  prove.run("hdFileSet({ share:'TESTShare' })"); prove.view('helpdesk/file-server');
  prove.run("hdFileSet({ tab:'effective' }); hdFileSet({ user:'u-1004' })");
  prove.view('helpdesk/file-server'); prove.view('helpdesk/file-server');
  prove.view('helpdesk/change-log'); prove.run("hdChangeLogOpen('CHG-9701')");
  // Neutral wording in a Prove It: no teaching line points at a cause.
  const proveFile = prove.view('helpdesk/file-server');
  assert.doesNotMatch(proveFile, /more restrictive|actually do/);
  assert.match(proveFile, /Shares, permissions and folder sizes\./);
  assert.doesNotMatch(prove.view('helpdesk/change-log'), /lines up with a symptom/);
  assert.doesNotMatch(prove.view('helpdesk/server-services'), /change log before you act/);
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => !s.startsWith('screen:'));
  // No server: source from the first Server Manager visit: a fresh shift's
  // default server is not shown as opened.
  // service:<server>:<name>: one per listed service, the same keys as
  // Get-Service -ComputerName (console B), so screen and command earn the same.
  assert.deepEqual(opened, ['services:NS-PRINT01', 'service:NS-PRINT01:TESTSpool', 'service:NS-PRINT01:TESTOther', 'server-log:NS-PRINT01:system', 'file-share:NS-FILE01:TESTShare:share', 'effective-access:NS-FILE01:TESTShare:u-1004', 'change-log', 'change:CHG-9701']);
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.equal(prove.run('hdState.serverSeen'), undefined);
  assert.deepEqual([...prove.toasts], []);
}

// Saved work survives a reload; a save from before this change loads.
function testReloadKeepsState() {
  const local = store();
  const tab = servers(local);
  tab.open('HD-9701');
  tab.run("hdServerStart('NS-PRINT01','TESTSpool'); hdChangeLogOpen('CHG-9702')");
  tab.view('helpdesk/change-log');
  const again = servers(local);
  again.open('HD-9701');
  assert.match(again.server('NS-PRINT01', '#/helpdesk/server-services'), /data-hd-service="TESTSpool" data-hd-service-status="Running"/);
  assert.ok(again.seen().includes('change:CHG-9702'));
  // An older save with none of the new keys.
  const old = store();
  const first = servers(old);
  old.map.forEach((value, key) => { const saved = JSON.parse(value); if (saved && saved.version === 1) { delete saved.serverSeen; delete saved.fileView; delete saved.serverLog; delete saved.changeLogOpen; old.map.set(key, JSON.stringify(saved)); } });
  assert.ok(first);
  const reloaded = servers(old);
  assert.match(reloaded.view('helpdesk/server-manager'), /data-hd-server-state/);
  assert.match(reloaded.view('helpdesk/file-server'), /data-hd-shares="NS-FILE01"/);
}

const tests = [testOldTicketsTurnNothingOn, testServerStatePerTicket, testUnopenedTicketDecidesNothing, testServerManagerDetailAndWarnings, testServicesStartOnlyByRunbook,
  testServerEventLogs, testFileServer, testChangeLog, testProveShift, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m07-console-a: ${tests.length} passed`);

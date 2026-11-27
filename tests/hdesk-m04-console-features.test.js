'use strict';
/* Help Desk simulator: the machine-state console features added for
 * Module 4 (key its-02), each switched on by a computer's machine state
 * (ui/helpdesk.js "Machine-state console features"): a ticket's own machine
 * state (console.machines), the six commands (Get-Service, Stop-Service and
 * Start-Service Spooler, Get-PrintJob, Get-Printer | Format-List,
 * Test-NetConnection, ping), the print queue window, Add a printer by IP and
 * Printer properties, Device Manager and the Camera app, the dock and
 * displays, Settings › Network & internet, the Virtual Desktops screen and a
 * late message that waits for a machine value.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-94xx,
 * TEST- computers, 192.0.2.x documentation addresses), never in
 * ui/helpdesk-data.js, and every older ticket must look and behave as before.
 * No Module 4 content: all text below is a made-up test fixture. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const COMPUTERS = [
  { name: 'TEST-PC-01', user: 'Amir Patel', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.11', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
  { name: 'TEST-PC-02', user: 'Maya Chen', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.12', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
  { name: 'TEST-LT-03', user: 'Jordan Bell', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.13', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
];
const job = (id, document, status, extra) => ({ id, document, pages: 2, owner: 'Amir Patel', status, ...(extra || {}) });
// One printer with a stuck job, the offline flag and three jobs behind it.
const PRINT = base({ id: 'HD-9401', number: 'INC0019401', requester: 'Amir Patel', createdAt: at(WED, '09:00'), description: 'TEST nothing prints',
  console: {
    matrix: {},
    machines: {
      'TEST-PC-01': {
        spooler: 'Running',
        ports: [{ name: 'IP_192.0.2.20', type: 'Standard TCP/IP', address: '192.0.2.20' }, { name: 'WSD-test', type: 'WSD', works: false }],
        driverCatalog: ['Test Driver A', 'Test Driver B'],
        reachable: { '192.0.2.20': [9100], '192.0.2.30': [] },
        printQueues: {
          'TEST-MFP': { port: 'IP_192.0.2.20', driver: 'Test Driver A', media: 'Letter', mediaSizes: ['Letter', 'A4'], offline: true, paused: false, outsideDriver: 'Test Vendor Driver 9',
            jobs: [job(7, 'Big_File.pdf', 'Error', { pages: 400, stuck: true }), job(8, 'One.docx', 'Spooling'), job(9, 'Two.docx', 'Spooling'), job(10, 'Three.docx', 'Spooling')] },
        },
      },
    },
    arrivals: [{ id: 'after-online', from: 'Amir Patel', text: 'TEST it printed', when: { machine: { computer: 'TEST-PC-01', path: ['printQueues', 'TEST-MFP', 'offline'], value: false } } },
      { id: 'after-stop', from: 'Amir Patel', text: 'TEST spooler stopped', when: { machine: { computer: 'TEST-PC-01', path: ['spooler'], value: 'Stopped' } } }],
  } });
// Duplicate jobs that a spooler restart sends again.
const DUPES = base({ id: 'HD-9402', number: 'INC0019402', requester: 'Maya Chen', createdAt: at(WED, '09:05'), description: 'TEST badge printer',
  console: { matrix: {}, machines: { 'TEST-PC-02': {
    spooler: 'Running', reachable: { '192.0.2.40': [9100] }, ports: [{ name: 'IP_192.0.2.40', type: 'Standard TCP/IP', address: '192.0.2.40' }],
    printQueues: { 'TEST-BADGE': { port: 'IP_192.0.2.40', driver: 'Test Driver A', media: 'Letter', mediaSizes: ['Letter'], offline: false, paused: false,
      jobs: [job(1, 'Badge', 'Error'), job(2, 'Badge', 'Spooling'), job(3, 'Badge', 'Spooling')] } },
  } } } });
// A laptop on a dock, two devices that aren't cameras, and a camera.
const LAPTOP = base({ id: 'HD-9403', number: 'INC0019403', requester: 'Jordan Bell', createdAt: at(WED, '09:10'), description: 'TEST desk and devices',
  console: { matrix: {}, machines: { 'TEST-LT-03': {
    devices: [
      { id: 'bt', category: 'Bluetooth', name: 'Test Bluetooth Adapter', status: '10', problem: 'This device cannot start. (Code 10)', driver: { provider: 'Test Corp', date: 'yesterday', version: '2.0' }, previous: { provider: 'Test Corp', date: 'last year', version: '1.9' } },
      { id: 'audio', category: 'Sound', name: 'Test Audio', status: 'OK', driver: { provider: 'Test Audio Inc', date: 'last month', version: '5.1' } },
      { id: 'cam', category: 'Cameras', name: 'Test Camera', camera: true, status: '43', problem: 'Windows has stopped this device because it has reported problems. (Code 43)', driver: { provider: 'Test Cam', date: 'yesterday', version: '3.0' }, previous: { provider: 'Test Cam', date: 'last year', version: '2.8' } },
    ],
    dock: { name: 'TEST-DOCK', power: false, docked: true, ethernet: 'Test USB Ethernet', peripherals: ['Keyboard'],
      monitors: [{ id: 'm1', name: 'Monitor 1', cable: 'DisplayPort', input: 'HDMI', inputs: ['HDMI', 'DisplayPort'] }, { id: 'm2', name: 'Monitor 2', cable: 'DisplayPort', input: 'DisplayPort', inputs: ['HDMI', 'DisplayPort'], needsDetect: true }] },
    projection: 'Extend',
  } } } });
// Virtual desktops, and an older computer named by a test ticket.
const VDI = base({ id: 'HD-9404', number: 'INC0019404', requester: 'Amir Patel', createdAt: at(WED, '09:15'), description: 'TEST black desktop',
  console: { matrix: {}, vdi: { pools: [{ name: 'TEST-POOL', sessions: [{ id: 's1', user: 'amir.patel', state: 'Disconnected – hung', hours: 6 }, { id: 's2', user: 'maya.chen', state: 'Active', hours: 2 }] }] },
    machines: { 'NS-LT-0094': { computer: { ip: '192.0.2.94', health: 'Healthy' } } } } });
// A second ticket naming TEST-PC-02 (only in the test-shared set).
const SHARED = base({ id: 'HD-9405', number: 'INC0019405', requester: 'Maya Chen', createdAt: at(WED, '09:25'), description: 'TEST same computer',
  console: { matrix: {}, machines: { 'TEST-PC-02': { spooler: 'Running', printQueues: { 'TEST-OTHER': { port: 'LPT1:', driver: 'Test Driver A', media: 'Letter', mediaSizes: ['Letter'], offline: true, paused: false, jobs: [] } } } } } });
const TICKETS = [PRINT, DUPES, LAPTOP, VDI, SHARED];
const SETS = { practice: {
  'test-machines': { title: 'Test machines', tickets: [PRINT, DUPES, LAPTOP, VDI].map((t) => t.id), now: at(WED, '09:20') },
  'test-shared': { title: 'Test shared computer', tickets: ['HD-9402', 'HD-9405'], now: at(WED, '09:30') },
} };

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store(), before = '' } = {}) {
  const u = new URL(url);
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
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
    ctx.__test = { tickets: TICKETS, sets: SETS, computers: COMPUTERS };
    vm.runInContext(`__test.computers.forEach((c) => HD_COMPUTERS.push(JSON.parse(JSON.stringify(c))));
      __test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
      Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets.practice)));`, ctx);
  }
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  return {
    ctx, toasts, local, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    select: (name) => run(`hdSelectComputer(${j(name)})`),
    // Typed in the ticket's PowerShell: the output the student sees.
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    out: (command) => run(`hdPowerShellOutput(${j(command)})`),
    machine: (name) => JSON.parse(JSON.stringify(run(`hdState.machines[${j(name)}]`))),
    actions: (id) => [...run(`(hdTicketById(${j(id)}).consoleState || { actions: [] }).actions.map((a) => a.id)`)],
    // The selected computer's screen (the endpoint list also lists the test computers).
    desktop: () => run("VIEWS['helpdesk/windows']()").split('<div class="hd-windows-screen">')[1],
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
  };
}
const machines = (local) => sim({ url: 'https://academy.test/sim/?practice=test-machines&student=stu-1#/helpdesk/tickets', local });
const NEW_MARKERS = /data-hd-(machines|tools|queue|props|addip|devmgr|device|camera|dock|monitor|netset|vdi|session|settings-queue)|Virtual Desktops<\/button>|Dock &amp; displays|Device Manager/;
const OLD_COMMANDS = ['Get-Help', 'Get-Service', 'Get-Service Spooler', 'Stop-Service Spooler', 'Get-Printer', 'Get-Printer -Name X | Format-List Name, PortName, DriverName', 'Get-PrintJob -PrinterName X', 'Test-NetConnection 10.20.70.20 -Port 9100', 'ping 10.0.5.10'];

// Every older ticket, set and Prove shift looks and answers exactly as before.
function testOldTicketsTurnNothingOn() {
  const tab = sim(); const plain = sim({ withTest: false });
  const ids = tab.run('hdState.tickets.map((t) => t.id)');
  assert.ok(ids.includes('HD-2150') && !ids.some((id) => id.startsWith('HD-94')));
  for (const id of ids) assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id} shows no new feature`);
  assert.doesNotMatch(tab.view('helpdesk/tickets'), NEW_MARKERS);
  // Every endpoint's Windows Desktop and the old commands, against a copy of
  // the simulator with no test data at all.
  for (const computer of plain.run('HD_COMPUTERS.map((c) => c.name)')) {
    tab.select(computer); plain.select(computer);
    assert.equal(tab.desktop(), plain.desktop(), `${computer} desktop unchanged`);
    for (const command of OLD_COMMANDS) assert.equal(tab.out(command), plain.out(command), `${computer}: ${command}`);
  }
  // Pinned: the old answers, so a later change can't move both copies at once.
  assert.match(plain.out('Get-Service'), /Spooler       Print Spooler/);
  assert.equal(plain.out('Test-NetConnection 10.20.70.20 -Port 9100'), 'ComputerName: purchasing.northstar.example\nRemotePort: 443\nInterfaceAlias: Wi-Fi\nTcpTestSucceeded: True');
  assert.match(plain.out('ping 10.0.5.10'), /outside this training shell/);
  assert.match(plain.out('Get-PrintJob -PrinterName X'), /outside this training shell/);
  assert.doesNotMatch(plain.out('Get-Help'), /Printing:|Network:/);
  // Each new screen opened directly on an old computer says it isn't there.
  tab.select('NS-LT-0131');
  for (const route of ['print-queue', 'printer-properties', 'device-manager', 'camera', 'dock', 'settings-network']) {
    assert.match(tab.view(`helpdesk/${route}`), /Not available on this computer/, route);
  }
  assert.match(tab.view('helpdesk/virtual-desktops'), /No virtual desktop pools/);
  // Older modules' sets: every ticket as before. Module 4's own sets
  // (its-02, its-02-guided, its-02-server) turn these features on by design
  // (tests/hdesk-m04-guided-labs.test.js, tests/hdesk-m04-practice-tickets.test.js).
  // Module 5's sets (its-03, its-03-guided) reuse the dock and Device Manager
  // (tests/hdesk-m05-guided-lab.test.js, tests/hdesk-m05-practice-tickets.test.js).
  const module4 = (k) => /^its-02(-|$)/.test(k);
  const module5 = (k) => /^its-03(-|$)/.test(k);
  // Module 6's sets (its-07, its-07-guided) reuse the Windows client tools
  // (tests/hdesk-m06-guided-lab.test.js, tests/hdesk-m06-practice-tickets.test.js).
  // Module 7's sets (its-05, its-05-guided) reuse the ticket's laptop and the
  // print tools (tests/hdesk-m07-guided-lab.test.js, tests/hdesk-m07-practice-tickets.test.js).
  // Module 8's sets (its-06, its-06-guided, its-06-extension) reuse Noah's PC
  // and the laptops (tests/hdesk-m08-guided-lab.test.js, tests/hdesk-m08-practice-tickets.test.js).
  // Module 9's sets (its-04, its-04-guided) reuse the desktop and Device Manager
  // (tests/hdesk-m09-guided-lab.test.js, tests/hdesk-m09-practice-tickets.test.js).
  // Module 10's sets (its-08, its-08-guided) reuse Dock and displays
  // (tests/hdesk-m10-guided-lab.test.js, tests/hdesk-m10-practice-tickets.test.js).
  const module6 = (k) => /^its-0[45678](-|$)/.test(k);
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-') && !module4(k) && !module5(k) && !module6(k))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    assert.deepEqual(set.run('Object.keys(hdState.machines).sort()'), set.run('Object.keys(HD_PRACTICE_MACHINES).sort()'), `${key} machines are the fixtures`);
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS')).filter((k) => !module4(k) && !module5(k) && !module6(k))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
  }
  // Each older Prove shift: the same answers and screens as with no test data.
  // Module 4's own Prove shift turns the features on (tests/hdesk-m04-prove.test.js),
  // and so do Module 5's and Module 6's machineTools shifts
  // (tests/hdesk-m05-prove.test.js, tests/hdesk-m06-prove.test.js).
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !module4(k) && !module5(k) && !module6(k))) {
    const url = `https://academy.test/sim/?prove=${key}&student=student-m04#/helpdesk/tickets`;
    const prove = sim({ url }); const before = sim({ url, withTest: false });
    for (const command of OLD_COMMANDS) assert.equal(prove.out(command), before.out(command), `prove ${key}: ${command}`);
    assert.equal(prove.desktop(), before.desktop(), `prove ${key} desktop`);
    assert.doesNotMatch(prove.view('helpdesk/windows'), NEW_MARKERS);
  }
}

// The six commands read and change only the machine they run on.
function testCommands() {
  const tab = machines();
  tab.open('HD-9401');
  assert.match(tab.open('HD-9401'), /data-hd-machines/);
  tab.select('TEST-PC-01');
  assert.match(tab.ps('Get-Help'), /Printing: Get-Service Spooler.*\nNetwork: ping <address>/);
  assert.match(tab.ps('Get-Service Spooler'), /Running  Spooler            Print Spooler/);
  const jobs = tab.ps('Get-PrintJob -PrinterName TEST-MFP').split('\n');
  assert.equal(jobs.length, 6);
  assert.match(jobs[2], /^7 .*Big_File\.pdf .*400 .*Error$/);
  assert.match(jobs[3], /One\.docx .*Spooling$/);
  assert.equal(tab.ps('Get-PrintJob -PrinterName NOPE'), 'Get-PrintJob : The specified printer was not found.');
  assert.equal(tab.ps('Get-Printer -Name TEST-MFP | Format-List Name, PortName, DriverName'), 'Name       : TEST-MFP\nPortName   : IP_192.0.2.20\nDriverName : Test Driver A');
  assert.match(tab.ps('get-printer test-mfp | fl'), /PrinterStatus : Offline/);
  assert.match(tab.ps('Get-Printer'), /TEST-MFP\s+Local\s+Test Driver A/);
  assert.match(tab.ps('Test-NetConnection 192.0.2.20 -Port 9100'), /RemotePort       : 9100\nInterfaceAlias   : Ethernet\nSourceAddress    : 192\.0\.2\.11\nTcpTestSucceeded : True$/);
  assert.match(tab.ps('Test-NetConnection 192.0.2.30 -Port 9100'), /^WARNING: TCP connect to \(192\.0\.2\.30 : 9100\) failed\n[\s\S]*TcpTestSucceeded : False$/);
  assert.match(tab.ps('Test-NetConnection 192.0.2.99 -Port 9100'), /^WARNING: TCP connect[^\n]*\nWARNING: Ping to 192\.0\.2\.99 failed[\s\S]*TcpTestSucceeded : False$/);
  assert.match(tab.ps('Test-NetConnection 192.0.2.20'), /PingSucceeded\s+: True\nPingReplyDetails \(RTT\) : 0 ms$/);
  assert.match(tab.ps('ping 192.0.2.20'), /Reply from 192\.0\.2\.20: bytes=32 time<1ms[\s\S]*Received = 4, Lost = 0 \(0% loss\),\nApproximate round trip times/);
  assert.match(tab.ps('Get-Printer -Name TEST-MFP | Format-List PrinterStatus'), /^PrinterStatus : Offline$/);
  assert.match(tab.ps('ping 192.0.2.99'), /Request timed out\.[\s\S]*Received = 0, Lost = 4 \(100% loss\)/);
  // Commands not in the set stay unsupported.
  for (const command of ['Remove-PrintJob -PrinterName TEST-MFP -ID 7', 'Get-PnpDevice', 'Remove-Item C:\\spool\\x -Force', 'Restart-Service Spooler']) {
    assert.match(tab.ps(command), /outside this training shell/, command);
  }
  // Reading changed nothing.
  assert.equal(tab.machine('TEST-PC-01').spooler, 'Running');
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.length, 4);
  // Stopping: Get-PrintJob can't reach the spooler; the other computer is untouched.
  assert.equal(tab.ps('Stop-Service Spooler'), '');
  assert.match(tab.ps('Get-Service Spooler'), /Stopped  Spooler/);
  assert.match(tab.ps('Get-PrintJob -PrinterName TEST-MFP'), /spooler service is not reachable/);
  assert.match(tab.ps('Get-Printer -Name TEST-MFP | Format-List'), /^Get-Printer : The spooler service is not reachable/);
  assert.equal(tab.machine('TEST-PC-02').spooler, 'Running');
  tab.ps('Start-Service Spooler');
  assert.equal(tab.machine('TEST-PC-01').spooler, 'Running');
  assert.deepEqual(tab.actions('HD-9401'), ['spooler-stop', 'spooler-start']);
  assert.deepEqual(tab.actions('HD-9402'), []);
  // An older computer in the same shift keeps today's answers.
  tab.select('NS-LT-0131');
  assert.match(tab.ps('Get-Service Spooler'), /outside this training shell/);
  assert.doesNotMatch(tab.ps('Get-Help'), /Printing:/);
}

// The queue window: a stuck job stays Deleting, is cleared only with the
// spooler stopped, and the jobs behind it print once the queue is online.
function testPrintQueueWindow() {
  const tab = machines();
  tab.open('HD-9401');
  let html = tab.screen('TEST-PC-01', 'print-queue', { printer: 'TEST-MFP' });
  assert.match(html, /data-hd-queue="TEST-MFP"/);
  assert.match(html, /aria-checked="true"[^>]*>☑ Use Printer Offline/);
  assert.match(html, /Status: Offline/);
  tab.run("hdQueueCancel('TEST-PC-01','TEST-MFP','7')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs[0].status, 'Deleting');
  html = tab.view('helpdesk/print-queue');
  assert.match(html, /data-hd-clear-stuck="on"/);
  // Refused while the spooler runs.
  tab.run("hdQueueClearStuck('TEST-PC-01','TEST-MFP')");
  assert.match(tab.lastToast(), /only while the Print Spooler is stopped/);
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.length, 4);
  tab.select('TEST-PC-01');
  tab.ps('Stop-Service Spooler');
  // With the spooler stopped the queue can't be changed, except Clear stuck job.
  assert.match(tab.view('helpdesk/print-queue'), /disabled onclick="hdQueueCancel/);
  tab.run("hdQueueCancel('TEST-PC-01','TEST-MFP','8')");
  tab.run("hdQueueTestPage('TEST-PC-01','TEST-MFP')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.length, 4);
  tab.run("hdQueueClearStuck('TEST-PC-01','TEST-MFP')");
  assert.deepEqual(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.map((j) => j.id), [8, 9, 10]);
  tab.ps('Start-Service Spooler');
  // Still offline: nothing prints yet.
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].printed.length, 0);
  tab.run("hdQueueToggle('TEST-PC-01','TEST-MFP','offline')");
  const queue = tab.machine('TEST-PC-01').printQueues['TEST-MFP'];
  assert.deepEqual(queue.printed.map((j) => j.document), ['One.docx', 'Two.docx', 'Three.docx']);
  assert.ok(tab.toasts.includes('3 jobs printed.'), tab.toasts.join(' | '));
  assert.match(tab.view('helpdesk/print-queue'), /Status: Ready/);
  // Pause holds jobs; a test page prints when resumed.
  tab.run("hdQueueToggle('TEST-PC-01','TEST-MFP','paused')");
  tab.run("hdQueueTestPage('TEST-PC-01','TEST-MFP')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.length, 1);
  assert.match(tab.view('helpdesk/print-queue'), /Status: Paused/);
  tab.run("hdQueueToggle('TEST-PC-01','TEST-MFP','paused')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].printed.slice(-1)[0].document, 'Test Page');
  assert.deepEqual(tab.actions('HD-9401'), ['job-cancel', 'spooler-stop', 'job-clear-stuck', 'spooler-start', 'printer-offline-off', 'printer-pause', 'test-page', 'printer-resume']);
  // Each change is in the ticket's history and the practice log.
  assert.match(tab.run("hdTicketById('HD-9401').troubleshootingHistory.slice(-1)[0].action"), /On TEST-PC-01: unticked Pause Printing on TEST-MFP/);
  assert.ok(tab.run("hdState.practiceLog.filter((e) => e.type === 'action_taken' && e.ticket === 'HD-9401').length") >= 8);
}

// Start-Service sends every queued job again: three duplicates print three times.
function testRestartResendsDuplicates() {
  const tab = machines();
  tab.open('HD-9402'); tab.select('TEST-PC-02');
  tab.ps('Stop-Service Spooler'); tab.ps('Start-Service Spooler');
  const queue = tab.machine('TEST-PC-02').printQueues['TEST-BADGE'];
  assert.deepEqual(queue.printed.map((j) => j.document), ['Badge', 'Badge', 'Badge']);
  assert.equal(queue.jobs.length, 0);
  const start = tab.run("hdTicketById('HD-9402').consoleState.actions.find((a) => a.id === 'spooler-start')");
  assert.equal(start.queued, 3); assert.equal(start.printed, 3);
  // The same queue cleared first, last job first: nothing prints. (Cancelling
  // the job in Error first lets the two behind it print, as Windows does.)
  const other = machines();
  other.open('HD-9402');
  ['3', '2', '1'].forEach((id) => other.run(`hdQueueCancel('TEST-PC-02','TEST-BADGE','${id}')`));
  assert.equal(other.machine('TEST-PC-02').printQueues['TEST-BADGE'].printed.length, 0);
  other.run("hdQueueTestPage('TEST-PC-02','TEST-BADGE')");
  assert.deepEqual(other.machine('TEST-PC-02').printQueues['TEST-BADGE'].printed.map((j) => j.document), ['Test Page']);
}

// Add a printer by IP, then its Ports, Advanced and Printing preferences.
function testAddByIpAndProperties() {
  const tab = machines();
  tab.open('HD-9401'); tab.select('TEST-PC-01');
  assert.match(tab.view('helpdesk/windows'), /Settings › Printers &amp; scanners/);
  assert.match(tab.view('helpdesk/settings-printers'), /data-hd-addip/);
  tab.input('hd-add-ip', '192.0.2.300'); tab.input('hd-add-name', 'TEST-LABEL'); tab.input('hd-add-driver', 'Test Driver B');
  tab.run("hdSettingsAddByIp({ preventDefault() {} }, 'TEST-PC-01')");
  assert.match(tab.lastToast(), /IPv4 address/);
  tab.input('hd-add-ip', '192.0.2.51');
  tab.run("hdSettingsAddByIp({ preventDefault() {} }, 'TEST-PC-01')");
  const machine = tab.machine('TEST-PC-01');
  assert.deepEqual(machine.printQueues['TEST-LABEL'].port, 'IP_192.0.2.51');
  assert.equal(machine.printQueues['TEST-LABEL'].driver, 'Test Driver B');
  assert.ok(machine.ports.some((p) => p.name === 'IP_192.0.2.51' && p.type === 'Standard TCP/IP'));
  assert.ok(machine.printers.includes('TEST-LABEL'));
  assert.equal(tab.ps('Get-Printer -Name TEST-LABEL | Format-List Name, PortName, DriverName'), 'Name       : TEST-LABEL\nPortName   : IP_192.0.2.51\nDriverName : Test Driver B');
  // Added again: refused.
  tab.run("hdSettingsAddByIp({ preventDefault() {} }, 'TEST-PC-01')");
  assert.match(tab.lastToast(), /already installed/);
  // Ports tab: the new Standard TCP/IP port is in use.
  let html = tab.screen('TEST-PC-01', 'printer-properties', { printer: 'TEST-LABEL', tab: 'ports' });
  assert.match(html, /data-hd-port="IP_192.0.2.51"><td>✓ IP_192\.0\.2\.51<\/td><td>Standard TCP\/IP Port<\/td><td>192\.0\.2\.51/);
  // A port that doesn't work takes the printer offline; switching back restores it.
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','port','WSD-test')");
  assert.match(tab.ps('Get-Printer -Name TEST-MFP | Format-List PortName, PrinterStatus'), /PortName      : WSD-test\nPrinterStatus : Offline/);
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','port','NOT-A-PORT')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].port, 'WSD-test');
  // Advanced: catalog drivers, and the website driver only where data offers it.
  html = tab.screen('TEST-PC-01', 'printer-properties', { printer: 'TEST-MFP', tab: 'advanced' });
  assert.match(html, /Test Driver B/); assert.match(html, /data-hd-outside-driver/);
  assert.doesNotMatch(tab.screen('TEST-PC-01', 'printer-properties', { printer: 'TEST-LABEL', tab: 'advanced' }), /data-hd-outside-driver/);
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','driver','Test Driver B')");
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','driver','Unknown Driver')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].driver, 'Test Driver B');
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','outside','')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].driver, 'Test Vendor Driver 9');
  // Printing preferences.
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','media','A4')");
  tab.run("hdPrinterSet('TEST-PC-01','TEST-MFP','media','Huge')");
  assert.equal(tab.machine('TEST-PC-01').printQueues['TEST-MFP'].media, 'A4');
  assert.match(tab.screen('TEST-PC-01', 'printer-properties', { printer: 'TEST-MFP', tab: 'preferences' }), /data-hd-media>A4</);
  assert.deepEqual(tab.actions('HD-9401'), ['printer-added-ip', 'printer-port', 'printer-driver', 'printer-driver-outside', 'printer-media']);
}

// Device Manager renders any device list; Roll Back Driver fixes a device.
function testDeviceManagerAndCamera() {
  const tab = machines();
  tab.open('HD-9403'); tab.select('TEST-LT-03');
  const desktop = tab.view('helpdesk/windows');
  assert.match(desktop, /data-hd-tools="device-manager"/); assert.match(desktop, /data-hd-tools="camera"/); assert.match(desktop, /data-hd-tools="dock"/);
  let html = tab.screen('TEST-LT-03', 'device-manager');
  assert.match(html, /<strong>Bluetooth<\/strong>[\s\S]*data-hd-device="bt" data-hd-device-status="problem"[\s\S]*⚠ Test Bluetooth Adapter/);
  assert.match(html, /data-hd-device="audio" data-hd-device-status="ok"/);
  html = tab.screen('TEST-LT-03', 'device-manager', { device: 'bt', tab: 'general' });
  assert.match(html, /data-hd-device-text>This device cannot start\. \(Code 10\)/);
  html = tab.screen('TEST-LT-03', 'device-manager', { device: 'audio', tab: 'driver' });
  assert.match(html, /disabled onclick="hdDeviceDriver\('TEST-LT-03','audio','rollback'\)"/, 'no previous driver: Roll Back is off');
  // Update Driver is always on; with nothing newer it says so, as Windows does.
  assert.match(html, / onclick="hdDeviceDriver\('TEST-LT-03','audio','update'\)"/);
  tab.run("hdDeviceDriver('TEST-LT-03','audio','update')");
  assert.match(tab.view('helpdesk/device-manager'), /data-hd-driver-best>The best drivers for your device are already installed/);
  assert.equal(tab.machine('TEST-LT-03').devices.find((d) => d.id === 'audio').driver.version, '5.1');
  html = tab.screen('TEST-LT-03', 'device-manager', { device: 'bt', tab: 'driver' });
  assert.match(html, /data-hd-driver-date>yesterday/);
  tab.run("hdDeviceDriver('TEST-LT-03','bt','rollback')");
  const bt = tab.machine('TEST-LT-03').devices.find((d) => d.id === 'bt');
  assert.equal(bt.status, 'OK'); assert.equal(bt.driver.version, '1.9'); assert.equal(bt.previous, null);
  assert.match(tab.screen('TEST-LT-03', 'device-manager', { device: 'bt', tab: 'general' }), /This device is working properly\./);
  // A second rollback does nothing.
  tab.run("hdDeviceDriver('TEST-LT-03','bt','rollback')");
  // The Camera app shows video only once the camera works.
  assert.match(tab.screen('TEST-LT-03', 'camera'), /data-hd-camera="none"/);
  tab.run("hdDeviceDriver('TEST-LT-03','cam','rollback')");
  assert.match(tab.screen('TEST-LT-03', 'camera'), /data-hd-camera="video"/);
  assert.deepEqual(tab.actions('HD-9403'), ['driver-update-none', 'driver-rollback', 'camera-checked', 'driver-rollback', 'camera-checked']);
  const checks = tab.run("hdTicketById('HD-9403').consoleState.actions.filter((a) => a.id === 'camera-checked').map((a) => a.working)");
  assert.deepEqual([...checks], [false, true]);
}

// Dock power, monitor input, Win + P, Detect and arranging.
function testDockAndDisplays() {
  const tab = machines();
  tab.open('HD-9403');
  let html = tab.screen('TEST-LT-03', 'dock');
  assert.match(html, /data-hd-dock="dark"/);
  assert.match(html, /Dock light: off/);
  assert.match(html, /Keyboard: not responding/);
  assert.match(tab.screen('TEST-LT-03', 'settings-network'), /data-hd-ethernet="unplugged"/);
  tab.run("hdDockDo('TEST-LT-03','power')");
  html = tab.view('helpdesk/dock');
  assert.match(html, /Dock light: on/); assert.match(html, /Keyboard: working/);
  assert.match(html, /data-hd-monitor="m1" data-hd-monitor-state="no-signal"/);
  assert.match(html, /data-hd-monitor="m2" data-hd-monitor-state="no-signal"/);
  assert.match(tab.screen('TEST-LT-03', 'settings-network'), /Ethernet \(Test USB Ethernet\): Connected/);
  tab.run("hdDockDo('TEST-LT-03','input','m1','DisplayPort')");
  html = tab.screen('TEST-LT-03', 'dock');
  assert.match(html, /data-hd-monitor="m1" data-hd-monitor-state="picture"/);
  assert.match(html, /data-hd-monitor="m2" data-hd-monitor-state="no-signal"/);
  tab.run("hdDockDo('TEST-LT-03','detect')");
  html = tab.view('helpdesk/dock');
  assert.match(html, /data-hd-monitor="m2" data-hd-monitor-state="picture"/);
  assert.match(html, /data-hd-display="m1">2 · Monitor 1[\s\S]*data-hd-display="m2">3 · Monitor 2/);
  tab.run("hdDockDo('TEST-LT-03','left','m2')");
  assert.match(tab.view('helpdesk/dock'), /data-hd-display="m2">2 · Monitor 2[\s\S]*data-hd-display="m1">3 · Monitor 1/);
  tab.run("hdDockDo('TEST-LT-03','project','PC screen only')");
  assert.doesNotMatch(tab.view('helpdesk/dock'), /data-hd-monitor-state="picture"/);
  tab.run("hdDockDo('TEST-LT-03','project','Extend')");
  tab.run("hdDockDo('TEST-LT-03','project','Sideways')");
  assert.equal(tab.machine('TEST-LT-03').projection, 'Extend');
  assert.deepEqual(tab.actions('HD-9403'), ['dock-power', 'monitor-input', 'display-detect', 'display-arrange', 'projection', 'projection']);
}

// Virtual Desktops: log off one session; Restart pool is refused.
function testVirtualDesktops() {
  const tab = machines();
  assert.match(tab.open('HD-9404'), /Virtual Desktops<\/button>/);
  let html = tab.view('helpdesk/virtual-desktops');
  assert.match(html, /data-hd-vdi="TEST-POOL"/);
  assert.match(html, /1 of 2 sessions Active/);
  assert.match(html, /data-hd-session="s1" data-hd-session-state="hung"><td>amir\.patel<\/td><td><span class="hd-badge bad">Disconnected – hung<\/span><\/td><td>6 h/);
  tab.run("hdVdiRestartPool('TEST-POOL')");
  html = tab.view('helpdesk/virtual-desktops');
  assert.match(html, /role="alert">Restart pool is a Tier 2 action/);
  assert.equal(tab.run("hdState.vdi['TEST-POOL'].sessions.filter((s) => s.state === 'Active').length"), 1, 'nothing restarted');
  tab.run("hdVdiLogOff('TEST-POOL','s1')");
  html = tab.view('helpdesk/virtual-desktops');
  assert.match(html, /data-hd-session="s1" data-hd-session-state="active"><td>amir\.patel<\/td><td><span class="hd-badge ok">Active · new session/);
  assert.match(html, /2 of 2 sessions Active/);
  const actions = tab.run("hdTicketById('HD-9404').consoleState.actions.map((a) => `${a.id}:${a.user || a.pool}`)");
  assert.deepEqual([...actions], ['vdi-restart-refused:TEST-POOL', 'vdi-logoff:amir.patel']);
}

// A late message waits for a machine value, from a screen or a command, and
// survives a reload.
function testMachineArrivals() {
  const local = store();
  const tab = machines(local);
  tab.open('HD-9401');
  const arrived = (t) => [...t.run("(hdTicketById('HD-9401').consoleState.arrived || []).map((a) => a.id)")];
  assert.deepEqual(arrived(tab), []);
  tab.select('TEST-PC-01');
  tab.ps('Stop-Service Spooler');
  assert.deepEqual(arrived(tab), ['after-stop'], 'a command can meet it');
  assert.match(tab.lastToast(), /New reply from Amir Patel/);
  tab.ps('Start-Service Spooler');
  tab.run("hdQueueToggle('TEST-PC-01','TEST-MFP','offline')");
  assert.deepEqual(arrived(tab), ['after-stop', 'after-online']);
  assert.match(tab.open('HD-9401'), /data-hd-arrival="after-online"[\s\S]*TEST it printed/);
  // Reload: the machine state and the replies are kept, and none comes twice.
  const again = machines(local);
  assert.equal(again.machine('TEST-PC-01').printQueues['TEST-MFP'].offline, false);
  again.run("hdQueueToggle('TEST-PC-01','TEST-MFP','offline')");
  again.run("hdQueueToggle('TEST-PC-01','TEST-MFP','offline')");
  assert.deepEqual(arrived(again), ['after-stop', 'after-online']);
  // A rule that names a missing path never fires.
  assert.equal(again.run("hdMachineValueIs({ computer:'TEST-PC-01', path:['printQueues','NOPE','offline'], value:false })"), false);
  assert.equal(again.run("hdMachineValueIs({ computer:'NOPE', path:['spooler'], value:'Running' })"), false);
}

// A ticket's computer state belongs to that ticket's shift: swapped for
// other tickets (as a coach's scope reset does), the older computer is as before.
function testLeftoverStateIsIgnored() {
  const tab = machines();
  assert.equal(tab.run("hdComputerByName('NS-LT-0094').ip"), '192.0.2.94');
  tab.run("hdState.tickets = hdFreshState().tickets");
  assert.equal(tab.run("hdComputerByName('NS-LT-0094').ip"), '169.254.44.19');
  tab.select('TEST-PC-01');
  assert.match(tab.ps('Get-PrintJob -PrinterName TEST-MFP'), /outside this training shell/);
  assert.equal(tab.run("hdVdiPools().length"), 0);
  assert.doesNotMatch(tab.view('helpdesk/windows'), NEW_MARKERS);
  assert.match(tab.view('helpdesk/print-queue'), /Not available on this computer/);
  // A set built again seeds the machine afresh.
  const fresh = machines();
  assert.equal(fresh.machine('TEST-PC-01').printQueues['TEST-MFP'].jobs.length, 4);
  assert.equal(fresh.machine('TEST-PC-01').seededBy, 'HD-9401');
  assert.deepEqual(fresh.machine('TEST-PC-01').localAdministrators, []);
}

// A Prove shift turns the features on from its own machine state: the
// student's changes are Prove events with no ticket history or feedback.
function testProveShiftMachine() {
  const shiftMachine = `{ const name = HD_PROVE_SHIFTS['its-01'].selectedComputer; Object.assign(HD_PROVE_SHIFTS['its-01'].machines[name], ${JSON.stringify({
    spooler: 'Running', reachable: { '192.0.2.60': [9100] }, ports: [{ name: 'IP_192.0.2.60', type: 'Standard TCP/IP', address: '192.0.2.60' }],
    printQueues: { 'TEST-PROVE': { port: 'IP_192.0.2.60', driver: 'Test Driver A', media: 'Letter', mediaSizes: ['Letter'], offline: true, paused: false, jobs: [], printed: [] } } })}); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m04#/helpdesk/tickets', before: shiftMachine });
  const name = prove.run('HD_PROVE.shift.selectedComputer');
  prove.select(name);
  assert.match(prove.ps('Get-Printer -Name TEST-PROVE | Format-List Name, PortName'), /PortName : IP_192\.0\.2\.60/);
  assert.match(prove.ps('Test-NetConnection 192.0.2.60 -Port 9100'), /TcpTestSucceeded : True/);
  prove.screen(name, 'print-queue', { printer: 'TEST-PROVE' });
  prove.run(`hdQueueToggle(${JSON.stringify(name)},'TEST-PROVE','offline')`);
  const events = [...prove.run("hdState.prove.events.map((e) => `${e.type}:${e.value || e.source || e.command || ''}`)")];
  assert.ok(events.includes(`evidence_opened:print-queue:${name}:TEST-PROVE`), events.join(' | '));
  assert.ok(events.includes('action_taken:printer-offline-off'));
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.doesNotMatch(prove.run("hdState.tickets[0].troubleshootingHistory.map((h) => h.action).join(' ')"), /TEST-PROVE/);
  // No hints in a Prove It: Get-Help lists no case commands, and no toast says what printed.
  assert.doesNotMatch(prove.ps('Get-Help'), /Printing:|Network:/);
  prove.run(`hdQueueTestPage(${JSON.stringify(name)},'TEST-PROVE')`);
  assert.equal(prove.run(`hdState.machines[${JSON.stringify(name)}].printQueues['TEST-PROVE'].printed.length`), 1);
  assert.ok(!prove.toasts.some((t) => /printed/.test(t)), prove.toasts.join(' | '));
  // Without machineTools the tool grid shows only what the machine has; with
  // it, every tool on every computer of the shift, each opening neutrally.
  assert.doesNotMatch(prove.view('helpdesk/windows'), /data-hd-tools="camera"/);
  const all = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m04b#/helpdesk/tickets', before: `${shiftMachine} HD_PROVE_SHIFTS['its-01'].machineTools = true;` });
  all.select(name);
  const desktop = all.view('helpdesk/windows');
  ['device-manager', 'camera', 'dock', 'settings-network'].forEach((tool) => assert.match(desktop, new RegExp(`data-hd-tools="${tool}"`)));
  assert.match(all.screen(name, 'camera'), /Nothing to show on this computer/);
  assert.doesNotMatch(all.screen(name, 'dock'), /Not available/);
}

// Two tickets naming one computer: the ticket whose state was seeded (the
// later one in the shift) gets the actions and the history.
function testSharedComputerOwner() {
  const tab = sim({ url: 'https://academy.test/sim/?practice=test-shared&student=stu-1#/helpdesk/tickets' });
  const owner = tab.machine('TEST-PC-02').seededBy;
  const order = [...tab.run("hdState.tickets.map((t) => t.id)")];
  assert.equal(owner, order[order.length - 1]);
  const queue = owner === 'HD-9405' ? 'TEST-OTHER' : 'TEST-BADGE';
  tab.run(`hdQueueToggle('TEST-PC-02','${queue}','offline')`);
  assert.equal(tab.run(`hdMachineTicket('TEST-PC-02').id`), owner);
  assert.deepEqual(tab.actions(owner).slice(-1), [tab.machine('TEST-PC-02').printQueues[queue].offline ? 'printer-offline-on' : 'printer-offline-off']);
  assert.deepEqual(tab.actions(owner === 'HD-9405' ? 'HD-9402' : 'HD-9405'), []);
}

// A ticket that joins a saved practice set gets its own machine state; a
// computer another saved ticket seeded keeps the student's work.
function testUpgradeSeedsANewTicket() {
  const local = store();
  const before = machines(local);
  before.open('HD-9401');
  before.run("hdQueueToggle('TEST-PC-01','TEST-MFP','offline')");
  // The saved set as it was before HD-9403 joined: drop it and its computer.
  before.run("hdState.tickets = hdState.tickets.filter((t) => t.id !== 'HD-9403'); delete hdState.machines['TEST-LT-03']; hdSave();");
  const after = machines(local);
  assert.ok(after.run("hdState.tickets.some((t) => t.id === 'HD-9403')"));
  assert.equal(after.machine('TEST-LT-03').seededBy, 'HD-9403');
  assert.equal(after.machine('TEST-PC-01').printQueues['TEST-MFP'].offline, false, 'earlier work kept');
  after.select('TEST-LT-03');
  assert.match(after.view('helpdesk/windows'), /data-hd-tools="device-manager"/);
}

const tests = [testOldTicketsTurnNothingOn, testCommands, testPrintQueueWindow, testRestartResendsDuplicates, testAddByIpAndProperties,
  testDeviceManagerAndCamera, testDockAndDisplays, testVirtualDesktops, testMachineArrivals, testLeftoverStateIsIgnored, testProveShiftMachine, testSharedComputerOwner, testUpgradeSeedsANewTicket];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m04-console-features: ${tests.length} passed`);

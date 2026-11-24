'use strict';
/* Help Desk simulator: the Windows client tools added for Module 5 (key
 * its-03), console A (ui/helpdesk.js "Windows client tools"): Task Manager
 * on a computer (Processes, Performance, Startup apps with Enable / Disable),
 * Settings › System › Storage with Temporary files and the drive health
 * line, Settings › Windows Update with Restart (also on the Windows
 * Desktop), Settings › Apps › Installed apps with Uninstall, the read-only
 * Software Catalog, and the optional PowerShell lines that read the same
 * machine state.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-95xx,
 * TEST- computers, 192.0.2.x documentation addresses), never in
 * ui/helpdesk-data.js. No Module 5 content: all text below is a made-up test
 * fixture. Every older ticket, set and Prove shift must look and answer as
 * before. */
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
  { name: 'TEST-WS-01', user: 'Amir Patel', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.21', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now', uptimeDays: 40 },
  { name: 'TEST-LT-02', user: 'Maya Chen', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.22', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
];
// A slow desk PC with every console A key.
const WINDOWS = {
  processes: [
    { name: 'Test Chat', cpu: 9, memory: 800, disk: 1 },
    { name: 'Test Browser', cpu: 14, memory: 1200, disk: 0.5 },
    { name: 'Test Indexer', cpu: 2, memory: 90, disk: 40 },
  ],
  performance: { cpu: 30, memory: 65, disk: 100, diskRecovered: { freePercent: 16, disk: 9 } },
  startupApps: [
    { name: 'Test Chat', publisher: 'Test Corp', verified: true, status: 'Enabled', impact: 'High' },
    { name: 'Test Camera Helper', publisher: 'Test Devices Ltd.', verified: true, status: 'Enabled', impact: 'Medium' },
  ],
  storage: {
    drive: 'C:', sizeGb: 200, freeGb: 10.4,
    categories: [{ name: 'Apps & features', gb: 60 }, { name: 'Documents', gb: 30 }],
    temporaryFiles: [{ id: 'wu', name: 'Test Update Cleanup', gb: 12.1 }, { id: 'tmp', name: 'Temporary files', gb: 7.5 }, { id: 'bin', name: 'Recycle Bin', gb: 2.3, recycleBin: true }],
    driveHealth: { status: 'Good', note: 'TEST estimated life 90%' },
  },
  updates: {
    lastInstalledDaysAgo: 40, restartRequired: true,
    pending: { kb: 'KB0009501', name: 'TEST cumulative update', downloaded: 'Monday' },
    history: [{ kb: 'KB0009500', name: 'TEST older update', date: '7/1/2026', status: 'Successfully installed', description: 'Security Update' }],
  },
  uptimeDays: 40, bootSeconds: 80, bootSecondsAfterFix: 45,
  installedApps: [
    { name: 'Test Chat', publisher: 'Test Corp', version: '1.0', installed: '1/2/2026' },
    { name: 'Test Camera Suite', publisher: 'Test Devices Ltd.', version: '3.2', installed: '2/3/2026', startup: 'Test Camera Helper' },
  ],
  catalog: [{ name: 'Test Chat', publisher: 'Test Corp' }, { name: 'Test Camera Suite', publisher: 'Test Devices Ltd.', note: 'TEST note' }],
};
const SLOW = base({ id: 'HD-9501', number: 'INC0019501', requester: 'Amir Patel', createdAt: at(WED, '09:00'), description: 'TEST slow PC',
  console: { matrix: {}, machines: { 'TEST-WS-01': WINDOWS } } });
// A Module 4-style machine: devices only, no Windows client keys.
const DEVICES = base({ id: 'HD-9502', number: 'INC0019502', requester: 'Maya Chen', createdAt: at(WED, '09:05'), description: 'TEST device only',
  console: { matrix: {}, machines: { 'TEST-LT-02': { devices: [{ id: 'audio', category: 'Sound', name: 'Test Audio', status: 'OK', driver: { provider: 'Test', date: 'x', version: '1' } }] } } } });
const TICKETS = [SLOW, DEVICES];
const SETS = { practice: { 'test-windows': { title: 'Test Windows', tickets: ['HD-9501', 'HD-9502'], now: at(WED, '09:20') } } };

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
    ctx, toasts, run, input,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    select: (name) => run(`hdSelectComputer(${j(name)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    out: (command) => run(`hdPowerShellOutput(${j(command)})`),
    machine: (name) => JSON.parse(JSON.stringify(run(`hdState.machines[${j(name)}]`))),
    actions: (id) => [...run(`(hdTicketById(${j(id)}).consoleState || { actions: [] }).actions.map((a) => a.id)`)],
    log: () => JSON.parse(JSON.stringify(run('hdState.practiceLog || []'))),
    desktop: () => run("VIEWS['helpdesk/windows']()").split('<div class="hd-windows-screen">')[1],
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
  };
}
const windows = (local) => sim({ url: 'https://academy.test/sim/?practice=test-windows&student=stu-1#/helpdesk/tickets', local });
const SCREENS = ['pc-task-manager', 'settings-storage', 'settings-update', 'settings-apps', 'software-catalog'];
const NEW_MARKERS = /data-hd-(restart-bar|pc-task-manager|storage|windows-update|installed-apps|catalog)|data-hd-tools="(pc-task-manager|settings-storage|settings-update|settings-apps|software-catalog)"/;
const OLD_COMMANDS = ['Get-Help', 'Get-Process', 'Get-Volume', 'Get-Disk', 'Get-ComputerInfo', 'Get-WinEvent -LogName Application -MaxEvents 20',
  'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU, WorkingSet', 'Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location',
  'Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size', 'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3'];

// Every older ticket, set and Prove shift looks and answers exactly as before.
function testOldTicketsTurnNothingOn() {
  const tab = sim(); const plain = sim({ withTest: false });
  const ids = tab.run('hdState.tickets.map((t) => t.id)');
  for (const id of ids) assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id} shows no new feature`);
  for (const computer of plain.run('HD_COMPUTERS.map((c) => c.name)')) {
    tab.select(computer); plain.select(computer);
    assert.equal(tab.desktop(), plain.desktop(), `${computer} desktop unchanged`);
    assert.doesNotMatch(tab.desktop(), NEW_MARKERS);
    for (const command of OLD_COMMANDS) assert.equal(tab.out(command), plain.out(command), `${computer}: ${command}`);
  }
  // Pinned: today's static answers, so a later change can't move both copies at once.
  assert.equal(plain.out('Get-Process'), 'Handles  CPU(s)  Id    ProcessName\n412      8.4     1148  explorer\n690      11.1    2480  browser\n221      2.7     3312  vpnclient');
  assert.equal(plain.out('Get-Volume'), 'DriveLetter FileSystemLabel HealthStatus SizeRemaining\nC           Windows         Healthy      118 GB\nD           Data            Warning      81 GB');
  assert.match(plain.out('Get-HotFix'), /outside this training shell/);
  assert.match(plain.out('Get-CimInstance Win32_StartupCommand'), /outside this training shell/);
  assert.doesNotMatch(plain.out('Get-Help'), /Windows: /);
  // Each new screen opened directly on an old computer says it isn't there.
  tab.select('NS-LT-0131');
  for (const route of SCREENS) assert.match(tab.view(`helpdesk/${route}`), /Not available on this computer/, route);
  // The VM host's Task Manager is a separate screen and is unchanged here
  // (tests/hdesk-m04-vm-screen.test.js runs it in the VM lab).
  assert.equal(tab.view('helpdesk/task-manager'), plain.view('helpdesk/task-manager'));
  // Every older practice and coached set. Module 5's own sets (its-03,
  // its-03-guided) turn these features on by design
  // (tests/hdesk-m05-guided-lab.test.js, tests/hdesk-m05-practice-tickets.test.js).
  const module5 = (k) => /^its-03(-|$)/.test(k);
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-') && !module5(k))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    for (const name of set.run('Object.keys(hdState.machines)')) { set.select(name); assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`); }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS')).filter((k) => !module5(k))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    for (const name of set.run('Object.keys(hdState.machines || {})')) { set.select(name); assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`); }
  }
  // Every Prove shift, including Module 4's machineTools shift.
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS'))) {
    const url = `https://academy.test/sim/?prove=${key}&student=student-m05#/helpdesk/tickets`;
    const prove = sim({ url }); const before = sim({ url, withTest: false });
    for (const name of before.run('hdComputers().map((c) => c.name)')) {
      prove.select(name); before.select(name);
      assert.equal(prove.desktop(), before.desktop(), `prove ${key} ${name} desktop`);
      assert.doesNotMatch(prove.desktop(), NEW_MARKERS, `prove ${key} ${name}`);
      for (const command of OLD_COMMANDS) assert.equal(prove.out(command), before.out(command), `prove ${key} ${name}: ${command}`);
    }
  }
}

// A machine with only Module 4 keys shows none of the Windows tools.
function testOtherFeatureMachineShowsNoWindowsTools() {
  const tab = windows();
  tab.open('HD-9502'); tab.select('TEST-LT-02');
  const desktop = tab.desktop();
  assert.match(desktop, /data-hd-tools="device-manager"/);
  assert.doesNotMatch(desktop, NEW_MARKERS);
  for (const route of SCREENS) assert.match(tab.screen('TEST-LT-02', route), /Not available on this computer/, route);
  assert.equal(tab.out('Get-Process'), sim({ withTest: false }).out('Get-Process'));
}

function testTaskManager() {
  const tab = windows();
  tab.open('HD-9501'); tab.select('TEST-WS-01');
  const desktop = tab.desktop();
  for (const screen of SCREENS) assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen);
  let html = tab.screen('TEST-WS-01', 'pc-task-manager');
  assert.match(html, /data-hd-pc-task-manager="processes"/);
  // Listed order until a column is sorted; CPU then Disk, highest first.
  const order = (h) => [...h.matchAll(/data-hd-process="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order(html), ['Test Chat', 'Test Browser', 'Test Indexer']);
  assert.match(html, /Disk 100%/);
  tab.run("hdWinTaskSort('TEST-WS-01','cpu')");
  assert.deepEqual(order(tab.view('helpdesk/pc-task-manager')), ['Test Browser', 'Test Chat', 'Test Indexer']);
  tab.run("hdWinTaskSort('TEST-WS-01','disk')");
  html = tab.view('helpdesk/pc-task-manager');
  assert.deepEqual(order(html), ['Test Indexer', 'Test Chat', 'Test Browser']);
  assert.match(html, /data-hd-sort="disk" aria-sort="descending"/);
  tab.run("hdWinTaskTab('TEST-WS-01','performance')");
  assert.match(tab.view('helpdesk/pc-task-manager'), /<dt>CPU<\/dt><dd>30%<\/dd><dt>Memory<\/dt><dd>65%<\/dd><dt>Disk 0 \(C:\)<\/dt><dd data-hd-disk="100">/);
  tab.run("hdWinTaskTab('TEST-WS-01','startup')");
  html = tab.view('helpdesk/pc-task-manager');
  assert.match(html, /data-hd-startup-app="Test Camera Helper" data-hd-startup-status="enabled"><td>Test Camera Helper<\/td><td>Test Devices Ltd\.<\/td><td>Enabled<\/td><td>Medium<\/td>/);
  assert.doesNotMatch(html, /verified/i, 'no verified label: Windows leaves an unsigned publisher blank');
  // Seen keys for a coach: each tab and each sort.
  assert.deepEqual(tab.machine('TEST-WS-01').seen, ['task-manager:processes', 'task-manager:sort:cpu', 'task-manager:sort:disk', 'task-manager:performance', 'task-manager:startup']);
  // Disable: status changes, the app stays installed, an action with the computer.
  tab.run("hdWinStartupSet('TEST-WS-01','Test Camera Helper','Disabled')");
  const machine = tab.machine('TEST-WS-01');
  assert.equal(machine.startupApps.find((a) => a.name === 'Test Camera Helper').status, 'Disabled');
  assert.equal(machine.installedApps.length, 2);
  assert.match(tab.view('helpdesk/pc-task-manager'), /data-hd-startup-app="Test Camera Helper" data-hd-startup-status="disabled">[\s\S]*?<td>Disabled<\/td><td>None<\/td>[\s\S]*?>Enable<\/button>/);
  assert.deepEqual(tab.actions('HD-9501'), ['startup-disabled']);
  const event = tab.log().filter((e) => e.type === 'action_taken').pop();
  assert.equal(event.computer, 'TEST-WS-01'); assert.equal(event.ticket, 'HD-9501'); assert.equal(event.app, 'Test Camera Helper');
  // Setting the same status again records nothing.
  tab.run("hdWinStartupSet('TEST-WS-01','Test Camera Helper','Disabled')");
  assert.deepEqual(tab.actions('HD-9501'), ['startup-disabled']);
  tab.run("hdWinStartupSet('TEST-WS-01','Test Camera Helper','Enabled')");
  assert.deepEqual(tab.actions('HD-9501'), ['startup-disabled', 'startup-enabled']);
}

function testStorage() {
  const tab = windows();
  tab.open('HD-9501');
  let html = tab.screen('TEST-WS-01', 'settings-storage');
  assert.match(html, /10\.4 GB free of 200 GB/);
  assert.match(html, /Drive health: <strong>Good<\/strong> <span class="muted">TEST estimated life 90%<\/span>/);
  assert.match(html, /Temporary files <span class="muted">21\.9 GB<\/span>/);
  assert.match(html, /data-hd-temp="bin">[\s\S]*?Files the user deleted/);
  // Nothing ticked: nothing removed.
  tab.run("hdWinTempRemove('TEST-WS-01')");
  assert.equal(tab.machine('TEST-WS-01').storage.freeGb, 10.4);
  assert.deepEqual(tab.actions('HD-9501'), []);
  // Tick, untick, tick: two items, exactly their sizes.
  tab.run("hdWinTempTick('TEST-WS-01','wu'); hdWinTempTick('TEST-WS-01','tmp'); hdWinTempTick('TEST-WS-01','bin'); hdWinTempTick('TEST-WS-01','bin')");
  assert.match(tab.view('helpdesk/settings-storage'), /aria-checked="true"[^>]*>☑ Test Update Cleanup/);
  tab.run("hdWinTempRemove('TEST-WS-01')");
  let machine = tab.machine('TEST-WS-01');
  assert.equal(machine.storage.freeGb, 30); // 10.4 + 12.1 + 7.5
  assert.deepEqual(tab.actions('HD-9501'), ['temp-files-removed']);
  // 30 of 200 is 15%, under the 16% threshold: Disk is still 100%.
  assert.equal(tab.run("hdWinDiskPercent(hdState.machines['TEST-WS-01'])"), 100);
  tab.run("hdWinTempTick('TEST-WS-01','bin'); hdWinTempRemove('TEST-WS-01')");
  machine = tab.machine('TEST-WS-01');
  assert.equal(machine.storage.freeGb, 32.3);
  assert.deepEqual(tab.actions('HD-9501'), ['temp-files-removed', 'temp-files-removed', 'recycle-bin-emptied']);
  // A removed item is 0 GB and can't be removed twice.
  tab.run("hdWinTempTick('TEST-WS-01','wu'); hdWinTempRemove('TEST-WS-01')");
  assert.equal(tab.machine('TEST-WS-01').storage.freeGb, 32.3);
}

function testStorageThreshold() {
  // 32.3 of 200 is 16%: the threshold is reached, so Disk shows the recovered value.
  const tab = windows();
  tab.open('HD-9501');
  tab.screen('TEST-WS-01', 'settings-storage');
  tab.run("['wu','tmp','bin'].forEach((id) => hdWinTempTick('TEST-WS-01', id)); hdWinTempRemove('TEST-WS-01')");
  assert.equal(tab.machine('TEST-WS-01').storage.freeGb, 32.3);
  assert.equal(tab.run("hdWinDiskPercent(hdState.machines['TEST-WS-01'])"), 9);
  tab.run("hdWinTaskTab('TEST-WS-01','performance')");
  assert.match(tab.screen('TEST-WS-01', 'pc-task-manager', { tab: 'performance' }), /data-hd-disk="9"/);
  assert.match(tab.view('helpdesk/settings-storage'), /32\.3 GB free of 200 GB[\s\S]*Temporary files <span class="muted">0 GB<\/span>/);
  const removed = tab.log().filter((e) => e.action === 'temp-files-removed').pop();
  assert.deepEqual(removed.items, ['wu', 'tmp', 'bin']); assert.equal(removed.gb, 21.9); assert.equal(removed.computer, 'TEST-WS-01');
}

function testWindowsUpdateAndRestart() {
  const tab = windows();
  tab.open('HD-9501'); tab.select('TEST-WS-01');
  let desktop = tab.desktop();
  assert.match(desktop, /<span>Uptime<\/span><strong>40 days<\/strong>/);
  assert.match(desktop, /data-hd-restart-bar>/);
  // No hint about the pending update on the desktop; Windows Update shows it.
  assert.doesNotMatch(desktop.split('data-hd-restart-bar')[1], /update|waiting|data-hd-restarted/i);
  let html = tab.screen('TEST-WS-01', 'settings-update');
  assert.match(html, /data-hd-update-status="restart"><strong>Restart required<\/strong><p>TEST cumulative update \(KB0009501\) · downloaded Monday/);
  assert.match(html, /data-hd-last-installed>40 days ago</);
  assert.match(html, /data-hd-uptime>40 days</);
  assert.match(tab.out('Get-ComputerInfo'), /OsUptime: 40 days/);
  tab.run("hdWinRestart('TEST-WS-01')");
  const machine = tab.machine('TEST-WS-01');
  assert.equal(machine.updates.restartRequired, false);
  assert.equal(machine.uptimeDays, 0);
  assert.equal(machine.bootSeconds, 45); assert.equal(machine.lastBootSeconds, 80);
  assert.equal(machine.restarts, 1);
  assert.equal(machine.updates.history[0].kb, 'KB0009501');
  html = tab.view('helpdesk/settings-update');
  assert.match(html, /data-hd-update-status="current"/);
  assert.doesNotMatch(html, /Restart required/);
  assert.match(html, /data-hd-last-installed>Today</);
  desktop = tab.desktop();
  assert.match(desktop, /<span>Uptime<\/span><strong>Less than a day<\/strong>/);
  assert.match(desktop, /data-hd-restarted>Restarted\. Signed in again\./);
  assert.match(tab.out('Get-ComputerInfo'), /OsUptime: 0 days/);
  assert.match(tab.screen('TEST-WS-01', 'pc-task-manager', { tab: 'performance' }), /<dt>Up time<\/dt><dd>Less than a day<\/dd>/);
  assert.deepEqual(tab.actions('HD-9501'), ['restart']);
  assert.equal(tab.log().filter((e) => e.action === 'restart').pop().finishedUpdate, true);
  // A second restart: a plain restart, the boot time stays the after-fix one.
  tab.run("hdWinRestart('TEST-WS-01')");
  assert.equal(tab.machine('TEST-WS-01').bootSeconds, 45);
  assert.equal(tab.log().filter((e) => e.action === 'restart').pop().finishedUpdate, false);
  assert.match(tab.run("hdTicketById('HD-9501').troubleshootingHistory.map((h) => h.action).join(' | ')"), /On TEST-WS-01: restarted the computer to finish the update\./);
}

function testInstalledAppsAndCatalog() {
  const tab = windows();
  tab.open('HD-9501');
  let html = tab.screen('TEST-WS-01', 'settings-apps');
  assert.match(html, /2 apps found/);
  assert.match(html, /data-hd-app="Test Camera Suite"><td>Test Camera Suite<\/td><td>Test Devices Ltd\.<\/td><td>3\.2<\/td>/);
  // A refused confirm uninstalls nothing.
  tab.run('confirm = () => false');
  tab.run("hdWinUninstall('TEST-WS-01','Test Camera Suite')");
  assert.equal(tab.machine('TEST-WS-01').installedApps.length, 2);
  tab.run('confirm = () => true');
  tab.run("hdWinUninstall('TEST-WS-01','Test Camera Suite')");
  const machine = tab.machine('TEST-WS-01');
  assert.deepEqual(machine.installedApps.map((a) => a.name), ['Test Chat']);
  assert.deepEqual(machine.startupApps.map((a) => a.name), ['Test Chat'], 'its startup entry (named by startup) goes too');
  assert.deepEqual(tab.actions('HD-9501'), ['app-uninstalled']);
  assert.equal(tab.log().filter((e) => e.action === 'app-uninstalled').pop().computer, 'TEST-WS-01');
  html = tab.view('helpdesk/settings-apps');
  assert.match(html, /1 app found/);
  // The catalog: read-only, searchable, no change controls.
  html = tab.screen('TEST-WS-01', 'software-catalog');
  assert.match(html, /data-hd-catalog-app="Test Camera Suite"><td>Test Camera Suite<\/td><td>Test Devices Ltd\.<\/td><td>Any supported<\/td><td>TEST note<\/td>/);
  assert.doesNotMatch(html.split('data-hd-catalog>')[1], /<button/);
  tab.input('hd-catalog-q', 'chat');
  tab.run("hdWinCatalogFilter({ preventDefault() {} }, 'TEST-WS-01')");
  html = tab.view('helpdesk/software-catalog');
  assert.match(html, /1 of 2 shown/);
  assert.doesNotMatch(html, /data-hd-catalog-app="Test Camera Suite"/);
  // catalog: true uses the shared list (HD_SOFTWARE_CATALOG when the data has one).
  const shared = sim({ url: 'https://academy.test/sim/?practice=test-windows&student=stu-2#/helpdesk/tickets',
    before: "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9501').console.machines['TEST-WS-01'].catalog = true; var HD_SOFTWARE_CATALOG = [{ name: 'TEST Shared App', publisher: 'Test' }];" });
  shared.open('HD-9501');
  assert.match(shared.screen('TEST-WS-01', 'software-catalog'), /data-hd-catalog-app="TEST Shared App"/);
}

function testOptionalCommands() {
  const tab = windows();
  tab.open('HD-9501'); tab.select('TEST-WS-01');
  assert.match(tab.ps('Get-Help'), /\nWindows: Get-Process \| Sort-Object CPU -Descending \| Select-Object -First 5 Name, CPU, WorkingSet, Get-CimInstance Win32_StartupCommand \| Select-Object Name, Command, Location, Get-Volume -DriveLetter C \| Select-Object SizeRemaining, Size, Get-HotFix \| Sort-Object InstalledOn -Descending \| Select-Object -First 3$/);
  const top = tab.ps('get-process | sort-object cpu -descending | select-object -first 2 name, cpu, workingset').split('\n');
  assert.equal(top.length, 4);
  assert.match(top[2], /^Test Browser\s+14\s+1258291200$/);
  assert.match(top[3], /^Test Chat\s+9\s+838860800$/);
  const startup = tab.ps('Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location');
  assert.match(startup, /Test Chat\s+"C:\\Program Files\\Test Chat\\TestChat\.exe"/);
  assert.match(startup, /Test Camera Helper/);
  assert.equal(tab.ps('Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size'), `SizeRemaining         Size\n-------------         ----\n${String(Math.round(10.4 * 1073741824)).padEnd(21)} ${200 * 1073741824}`);
  assert.match(tab.ps('Get-Volume -DriveLetter C'), /C\s+Windows\s+Healthy\s+10\.4 GB\s+200 GB/);
  const hotfix = tab.ps('Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3');
  assert.match(hotfix, /TEST-WS-01\s+Security Update\s+KB0009500/);
  assert.doesNotMatch(hotfix, /KB0009501/, 'the pending update is not installed yet');
  tab.run("hdWinRestart('TEST-WS-01')");
  assert.match(tab.ps('Get-HotFix'), /KB0009501[\s\S]*KB0009500/);
  // Each command is a command_run event with the computer.
  const runs = tab.log().filter((e) => e.type === 'command_run');
  assert.ok(runs.length >= 6 && runs.every((e) => e.computer === 'TEST-WS-01'));
  // Get-Disk and unknown commands keep today's answers.
  assert.equal(tab.out('Get-Disk'), sim({ withTest: false }).out('Get-Disk'));
  assert.match(tab.ps('Get-StartApps'), /outside this training shell/);
}

// A Prove shift: each screen records its source once, with the computer;
// changes are Prove events; no hints in Get-Help.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(WINDOWS)}); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m05a#/helpdesk/tickets', before: inject });
  const name = prove.run('HD_PROVE.shift.selectedComputer');
  prove.select(name);
  assert.match(prove.view('helpdesk/windows'), /data-hd-tools="pc-task-manager"/);
  prove.screen(name, 'pc-task-manager');
  prove.screen(name, 'pc-task-manager');
  prove.run(`hdWinTaskTab(${JSON.stringify(name)},'startup')`);
  prove.screen(name, 'settings-storage'); prove.screen(name, 'settings-update'); prove.screen(name, 'settings-apps'); prove.screen(name, 'software-catalog');
  prove.run(`hdWinStartupSet(${JSON.stringify(name)},'Test Camera Helper','Disabled'); hdWinUninstall(${JSON.stringify(name)},'Test Camera Suite'); hdWinRestart(${JSON.stringify(name)})`);
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => !s.startsWith('computer:') && !s.startsWith('screen:'));
  assert.deepEqual(opened, [`task-manager:${name}:processes`, `task-manager:${name}:startup`, `storage:${name}`, `windows-update:${name}`, `installed-apps:${name}`, `software-catalog:${name}`]);
  const actions = [...prove.run("hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => `${e.value}@${e.computer}`)")];
  assert.deepEqual(actions, [`startup-disabled@${name}`, `app-uninstalled@${name}`, `restart@${name}`]);
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.doesNotMatch(prove.ps('Get-Help'), /Windows: /);
  assert.ok(!prove.toasts.some((t) => /restarted/.test(t)), 'no toast in a Prove It');
  // machineTools: every computer of the shift shows the Windows tools, each opening neutrally.
  // Module 4's shift has two computers and machineTools: give the first the
  // keys. Its names are read from the data (Module 4's guard test keeps them
  // out of every other file).
  const all = sim({ url: 'https://academy.test/sim/?prove=its-02&student=student-m05b#/helpdesk/tickets',
    before: `{ const m = HD_PROVE_SHIFTS['its-02'].machines; Object.assign(m[Object.keys(m)[0]], ${JSON.stringify(WINDOWS)}); }` });
  assert.equal(all.run('HD_PROVE.shift.machineTools'), true);
  const [first, second] = [...all.run('Object.keys(HD_PROVE.shift.machines)')];
  const j = JSON.stringify;
  all.select(second);
  const desktop = all.view('helpdesk/windows');
  SCREENS.forEach((screen) => assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen));
  assert.match(desktop, /data-hd-restart-bar/);
  for (const screen of ['settings-storage', 'pc-task-manager', 'settings-apps']) assert.match(all.screen(second, screen), /Nothing to show on this computer/, screen);
  assert.ok(all.run('hdState.prove.opened').includes(`storage:${second}`));
  // Restart works on every computer it shows on, and is recorded.
  all.run(`hdWinRestart(${j(second)})`);
  assert.ok(all.run(`hdState.prove.events.some((e) => e.type === 'action_taken' && e.value === 'restart' && e.computer === ${j(second)})`));
  // An empty Remove files click shows no toast in a Prove It.
  all.run(`hdWinTempRemove(${j(first)})`);
  assert.deepEqual([...all.toasts], []);
}

// A pending update that needs no restart yet shows as Pending install.
function testPendingWithoutRestart() {
  const tab = sim({ url: 'https://academy.test/sim/?practice=test-windows&student=stu-3#/helpdesk/tickets',
    before: "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9501').console.machines['TEST-WS-01'].updates.restartRequired = false;" });
  tab.open('HD-9501');
  assert.match(tab.screen('TEST-WS-01', 'settings-update'), /data-hd-update-status="pending"><strong>Updates available<\/strong><p>TEST cumulative update \(KB0009501\) · Pending install/);
}

// The machine state survives a reload with the student's changes.
function testReloadKeepsState() {
  const local = store();
  const tab = windows(local);
  tab.open('HD-9501');
  tab.run("hdWinStartupSet('TEST-WS-01','Test Chat','Disabled'); hdWinRestart('TEST-WS-01')");
  const again = windows(local);
  const machine = again.machine('TEST-WS-01');
  assert.equal(machine.startupApps[0].status, 'Disabled');
  assert.equal(machine.uptimeDays, 0);
  assert.equal(machine.updates.restartRequired, false);
}

const tests = [testOldTicketsTurnNothingOn, testOtherFeatureMachineShowsNoWindowsTools, testTaskManager, testStorage, testStorageThreshold,
  testWindowsUpdateAndRestart, testPendingWithoutRestart, testInstalledAppsAndCatalog, testOptionalCommands, testProveShift, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m05-console-a: ${tests.length} passed`);

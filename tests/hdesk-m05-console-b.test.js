'use strict';
/* Help Desk simulator: the Windows client tools added for Module 5 (key
 * its-03), console B (ui/helpdesk.js "Windows client tools, console B"):
 * Event Viewer's logs on a computer with a level filter, Reliability Monitor
 * and the dock-cycle crash, the Safe Mode route, the signed-in profile line,
 * Active Directory › Computers › a computer with its BitLocker Recovery tab,
 * the typed commands (DISM, sfc, chkdsk, dir / Get-ChildItem), a set's
 * hideEventsFrom and an action that waits for an earlier one (needsAction).
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-95xx,
 * TEST- computers, 192.0.2.x documentation addresses, made-up keys), never in
 * ui/helpdesk-data.js. No Module 5 content. Every older ticket, set and Prove
 * shift must look and answer as before. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;
const FAKE_KEY_A = '111111-222222-333333-444444-555555-666666-777777-888888';
const FAKE_KEY_B = '999999-888888-777777-666666-555555-444444-333333-222222';
const FAKE_KEY_C = '123123-123123-123123-123123-123123-123123-123123-123123';

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const pc = (name, user) => ({ name, user, os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.31', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' });
const COMPUTERS = [pc('TEST-WS-11', 'Amir Patel'), pc('TEST-LT-12', 'Maya Chen'), pc('TEST-LT-13', 'Dina Foster'), pc('TEST-WS-14', 'Noah Williams')];

const DESK = {
  events: {
    system: [
      { level: 'Error', time: 'Mon 09:10', source: 'TestDisk', id: '9001', message: 'TEST disk nearly full.', details: 'TEST details line.' },
      { level: 'Warning', time: 'Mon 09:00', source: 'TestTime', id: '9002', message: 'TEST clock drift.' },
    ],
    application: [{ level: 'Information', time: 'Mon 08:00', source: 'TestApp', id: '9100', message: 'TEST app started.' }],
    'diagnostics-performance': [],
  },
  updates: { lastInstalledDaysAgo: 20, restartRequired: true, pending: { kb: 'KB0009511', name: 'TEST update' }, history: [] },
  uptimeDays: 20, bootSeconds: 90, bootSecondsAfterFix: 50, bootTime: 'Mon 08:01',
  reliability: [
    { day: 'Sun', critical: [], warnings: [], installs: [] },
    { day: 'Mon', critical: ['TEST app stopped responding', 'TEST app stopped responding'], warnings: [], installs: ['TEST update: restart pending'] },
  ],
  safeMode: false,
  profile: { temporary: false, restartClears: false, path: 'C:\\Users\\apatel' },
  bitlockerKeys: [{ keyId: 'C0FFEE01', date: '1/5/2026', key: FAKE_KEY_A }],
  files: { 'C:\\Users\\apatel\\Desktop': ['TEST plan.docx', { name: 'TEST sheet.xlsx', length: 1200, modified: '8/18/2026 9:00 AM' }] },
  repairs: {},
};
const DESK_TICKET = base({ id: 'HD-9511', number: 'INC0019511', requester: 'Amir Patel', createdAt: at(WED, '09:00'), description: 'TEST desk PC',
  console: { matrix: {}, machines: { 'TEST-WS-11': DESK } } });

const DOCK_DRIVER_BAD = { provider: 'Test Devices', date: '8/18/2026', version: '9.9.1' };
const DOCK_DRIVER_GOOD = { provider: 'Test Devices', date: '3/2/2026', version: '9.8.0' };
const DOCKED = {
  dock: { name: 'TEST Dock', power: true, docked: false, monitors: [] },
  devices: [{ id: 'usbnet', category: 'Network adapters', name: 'TEST Dock USB Ethernet', status: 'OK', driver: DOCK_DRIVER_BAD, previous: DOCK_DRIVER_GOOD,
    crashOnDock: { version: '9.9.1', stopCode: 'TEST_STOP_CODE', file: 'testnet.sys' } }],
  reliability: [{ day: 'Yesterday', critical: [], warnings: [], installs: ['TEST Dock USB Ethernet driver updated'] }, { day: 'Today', today: true, critical: [], warnings: [], installs: [] }],
};
const DOCK_TICKET = base({ id: 'HD-9512', number: 'INC0019512', requester: 'Maya Chen', createdAt: at(WED, '09:05'), description: 'TEST dock crash',
  console: { matrix: {}, machines: { 'TEST-LT-12': DOCKED } } });

const KEY_TICKET = base({ id: 'HD-9513', number: 'INC0019513', requester: 'Dina Foster', createdAt: at(WED, '09:10'), description: 'TEST recovery key',
  console: {
    matrix: {},
    verification: { prompt: 'TEST verify', options: [
      { id: 'name', text: 'TEST name only', feedback: 'TEST not verified.' },
      { id: 'callback', text: 'TEST call back', pass: true, feedback: 'TEST verified.' },
    ] },
    actions: [
      { id: 'read-match', text: 'TEST read the matching key', bitlockerKey: 'AAAA1111', needsVerification: true, earlyCritical: 'TEST released before verifying', feedback: 'TEST read out.' },
      { id: 'read-other', text: 'TEST read the other key', bitlockerKey: 'BBBB2222', critical: true, needsVerification: true, feedback: 'TEST wrong key.' },
      { id: 'cool', text: 'TEST move it to a hard surface', feedback: 'TEST moved.' },
      { id: 'retry', text: 'TEST run the export again', needsAction: 'cool', beforeText: 'TEST it shut off again.', feedback: 'TEST it finished.' },
    ],
    machines: { 'TEST-LT-13': { bitlockerKeys: [{ keyId: 'AAAA1111', date: 'Today', key: FAKE_KEY_A }, { keyId: 'BBBB2222', date: '1/1/2025', key: FAKE_KEY_B }, { keyId: 'CCCC3333', date: '1/1/2024', key: FAKE_KEY_C }] } },
  } });

const PROFILE_TICKET = base({ id: 'HD-9514', number: 'INC0019514', requester: 'Noah Williams', createdAt: at(WED, '09:15'), description: 'TEST temporary profile',
  console: { matrix: {}, machines: { 'TEST-WS-14': { uptimeDays: 1, profile: { temporary: true, restartClears: false, path: 'C:\\Users\\TEMP' },
    events: { system: [], application: [{ level: 'Warning', time: '08:30', source: 'User Profile Service', id: '1511', message: 'TEST temporary profile.' }], 'diagnostics-performance': [] } } } } });

const TICKETS = [DESK_TICKET, DOCK_TICKET, KEY_TICKET, PROFILE_TICKET];
const SETS = { practice: {
  'test-win-b': { title: 'Test Windows B', tickets: ['HD-9511', 'HD-9512', 'HD-9513', 'HD-9514'], now: at(WED, '09:20') },
  'test-hide': { title: 'Test hide', tickets: ['HD-9511'], now: at(WED, '09:20'), hideEventsFrom: ['NS-LT-0131'] },
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
    ad: () => { run("hdSetAdTab('computers')"); return run("VIEWS['helpdesk/active-directory']()"); },
  };
}
const practice = (key = 'test-win-b', local, before = '') => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local, before });
const NEW_MARKERS = /data-hd-(event-picker|event-logs|reliability|recovery|safe-mode|profile|blue-screen|ad-computer|bitlocker)|data-hd-tools="(reliability|settings-recovery)"/;
const OLD_COMMANDS = ['Get-Help', 'Get-WinEvent', 'Get-WinEvent -LogName Application -MaxEvents 20', 'DISM /Online /Cleanup-Image /RestoreHealth', 'sfc /scannow', 'chkdsk C: /scan',
  'dir C:\\Users', 'Get-ChildItem C:\\Users', 'dsim /online', 'sfc /scanow', 'Get-Process', 'Get-Volume'];

// Every older ticket, set and Prove shift looks and answers exactly as before.
function testOldTicketsTurnNothingOn() {
  const tab = sim(); const plain = sim({ withTest: false });
  const evPlain = plain.view('helpdesk/event-viewer');
  assert.equal(tab.view('helpdesk/event-viewer'), evPlain, 'shared Event Viewer unchanged');
  for (const id of ['3210', '1511', '4740']) assert.match(evPlain, new RegExp(`<td>${id}</td>`), `shared event ${id} still listed`);
  assert.doesNotMatch(evPlain, NEW_MARKERS);
  // The test computers are extra rows in the list; everything else is the same.
  const noTestRows = (html) => html.replace(/<tr><td><strong>TEST-[\s\S]*?<\/tr>/g, '');
  assert.equal(noTestRows(tab.ad()), plain.ad(), 'Active Directory › Computers unchanged');
  assert.doesNotMatch(plain.ad(), /data-hd-ad-computer|Find a computer/);
  for (const id of tab.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id}`);
  for (const computer of plain.run('HD_COMPUTERS.map((c) => c.name)')) {
    tab.select(computer); plain.select(computer);
    assert.equal(tab.desktop(), plain.desktop(), `${computer} desktop unchanged`);
    assert.doesNotMatch(tab.desktop(), NEW_MARKERS);
    assert.equal(tab.view('helpdesk/event-viewer'), plain.view('helpdesk/event-viewer'), `${computer} Event Viewer`);
    for (const command of OLD_COMMANDS) assert.equal(tab.out(command), plain.out(command), `${computer}: ${command}`);
  }
  // Pinned: today's answers for the four commands on an old computer.
  for (const command of ['DISM /Online /Cleanup-Image /RestoreHealth', 'sfc /scannow', 'chkdsk C: /scan', 'dir C:\\Users', 'dsim']) assert.match(plain.out(command), /outside this training shell/, command);
  tab.select('NS-LT-0131');
  for (const route of ['reliability', 'settings-recovery']) assert.match(tab.view(`helpdesk/${route}`), /Not available on this computer/, route);
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-'))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    assert.doesNotMatch(set.view('helpdesk/event-viewer'), NEW_MARKERS, `${key} event viewer`);
    assert.doesNotMatch(set.ad(), NEW_MARKERS, `${key} AD`);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    for (const name of set.run('Object.keys(hdState.machines)')) { set.select(name); assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`); }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS'))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    assert.doesNotMatch(set.view('helpdesk/event-viewer'), NEW_MARKERS, `${key} event viewer`);
    for (const name of set.run('Object.keys(hdState.machines || {})')) { set.select(name); assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`); }
  }
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS'))) {
    const url = `https://academy.test/sim/?prove=${key}&student=student-m05#/helpdesk/tickets`;
    const prove = sim({ url }); const before = sim({ url, withTest: false });
    assert.equal(prove.view('helpdesk/event-viewer'), before.view('helpdesk/event-viewer'), `prove ${key} Event Viewer`);
    assert.equal(noTestRows(prove.ad()), before.ad(), `prove ${key} AD`);
    for (const name of before.run('hdComputers().map((c) => c.name)')) {
      prove.select(name); before.select(name);
      assert.equal(prove.desktop(), before.desktop(), `prove ${key} ${name} desktop`);
      assert.doesNotMatch(prove.desktop(), NEW_MARKERS, `prove ${key} ${name}`);
      for (const command of OLD_COMMANDS) assert.equal(prove.out(command), before.out(command), `prove ${key} ${name}: ${command}`);
    }
  }
}

// Module 4's dock tickets never crash, however often the dock is cycled.
function testNoDataUsesCrashOnDock() {
  const set = sim({ url: 'https://academy.test/sim/?practice=its-02&student=stu-9#/helpdesk/tickets' });
  const docks = set.run("Object.keys(hdState.machines).filter((n) => hdState.machines[n].dock)");
  assert.ok(docks.length > 0, 'Module 4 has a dock ticket');
  for (const name of docks) {
    set.run(`hdState.machines[${JSON.stringify(name)}].dock.power = true`);
    for (let i = 0; i < 6; i += 1) set.run(`hdDockDo(${JSON.stringify(name)}, 'dock')`);
    assert.doesNotMatch(set.screen(name, 'dock'), /data-hd-blue-screen/);
    assert.ok(!set.log().some((e) => e.action === 'blue-screen'));
  }
}

function testHideEventsFromOnASet() {
  const plain = sim({ url: 'https://academy.test/sim/?practice=test-win-b&student=stu-2#/helpdesk/tickets' });
  plain.select('NS-LT-0131');
  assert.match(plain.view('helpdesk/event-viewer'), /<td>3210<\/td>/);
  const hide = practice('test-hide');
  hide.select('NS-LT-0131');
  const html = hide.view('helpdesk/event-viewer');
  assert.doesNotMatch(html, /<td>3210<\/td>/, 'the named computer\'s shared events are hidden');
  assert.match(html, /<td>4740<\/td>/, 'other shared events stay');
  assert.doesNotMatch(hide.out('Get-WinEvent'), /NETLOGON/);
}

function testEventLogs() {
  const tab = practice();
  tab.open('HD-9511'); tab.select('TEST-WS-11');
  let html = tab.view('helpdesk/event-viewer');
  assert.match(html, /data-hd-event-logs="system"/);
  assert.match(html, /data-hd-event-picker/);
  const ids = (h) => [...h.matchAll(/data-hd-event-row="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids(html), ['9001', '9002'], 'only this computer\'s System log');
  assert.doesNotMatch(html, /NETLOGON|<td>4740<\/td>/, 'no shared events');
  tab.run("hdWinEventSet('TEST-WS-11', { level: 'Error' })");
  html = tab.view('helpdesk/event-viewer');
  assert.deepEqual(ids(html), ['9001']);
  assert.match(html, /1 of 2 shown/);
  tab.run("hdWinEventOpen('TEST-WS-11', 0)");
  html = tab.view('helpdesk/event-viewer');
  assert.match(html, /data-hd-event-detail="9001"[\s\S]*TEST details line\./);
  tab.run("hdWinEventSet('TEST-WS-11', { log: 'application', level: '' })");
  assert.deepEqual(ids(tab.view('helpdesk/event-viewer')), ['9100']);
  // Diagnostics-Performance: Event ID 100 from the boot time.
  tab.run("hdWinEventSet('TEST-WS-11', { log: 'diagnostics-performance' })");
  html = tab.view('helpdesk/event-viewer');
  assert.deepEqual(ids(html), ['100']);
  assert.match(html, /Boot Duration: 90000 ms \(90 s\)/);
  let seen = tab.machine('TEST-WS-11').seen;
  assert.deepEqual(seen.filter((k) => k.startsWith('event')), ['event-log:system', 'event-open:system:9001', 'event-log:application', 'event-log:diagnostics-performance']);
  // Restart, then read it again: a second key, and the boot time changes.
  tab.run("hdWinRestart('TEST-WS-11')");
  html = tab.view('helpdesk/event-viewer');
  assert.deepEqual(ids(html), ['100', '100']);
  assert.match(html, /Today, after the restart<\/td><td>Diagnostics-Performance<\/td><td>100<\/td><td>Windows has started up: Boot Duration: 50000 ms \(50 s\)/);
  assert.match(html, /Mon 08:01<\/td>[\s\S]*?90000 ms/);
  seen = tab.machine('TEST-WS-11').seen;
  assert.ok(seen.includes('event-log:diagnostics-performance:after-restart'));
  // A second restart (the lab restarts twice): the first, slow boot stays listed.
  tab.run("hdWinRestart('TEST-WS-11')");
  html = tab.view('helpdesk/event-viewer');
  assert.deepEqual(ids(html), ['100', '100', '100']);
  const boots = [...html.matchAll(/<td>([^<]*)<\/td><td>Diagnostics-Performance<\/td><td>100<\/td><td>Windows has started up: Boot Duration: (\d+) ms/g)].map((m) => `${m[1]}=${m[2]}`);
  assert.deepEqual(boots, ['Today, after the restart=50000', 'Today, after an earlier restart=50000', 'Mon 08:01=90000']);
  // The shared list stays one click away; the old filter bar is there.
  tab.run("hdWinEventPick('')");
  html = tab.view('helpdesk/event-viewer');
  assert.match(html, /hd-event-filter/);
  assert.match(html, /<td>3210<\/td>/);
  tab.run("hdWinEventPick('TEST-WS-11')");
  assert.match(tab.view('helpdesk/event-viewer'), /data-hd-event-logs=/);
  // Another computer without logs: the shared list.
  tab.select('NS-LT-0131');
  assert.match(tab.view('helpdesk/event-viewer'), /hd-event-filter/);
}

function testGetWinEventReadsTheLog() {
  const tab = practice();
  tab.open('HD-9511'); tab.select('TEST-WS-11');
  const app = tab.ps('Get-WinEvent -LogName Application -MaxEvents 20');
  assert.match(app, /^TimeCreated/);
  assert.match(app, /9100 Information\s+TEST app started\./);
  assert.doesNotMatch(app, /NETLOGON/);
  assert.equal(tab.ps('get-winevent -logname system -maxevents 1').split('\n').length, 3);
  assert.match(tab.ps("Get-WinEvent -LogName 'Microsoft-Windows-Diagnostics-Performance/Operational'"), /Boot Duration: 90000 ms/);
  assert.match(tab.ps('Get-WinEvent -LogName Hardware'), /There is not an event log on the localhost computer that matches "hardware"/);
  assert.match(tab.ps('Get-Help'), /Events: Get-WinEvent -LogName/);
}

function testReliabilityAndDockCrash() {
  const tab = practice();
  tab.open('HD-9512');
  let html = tab.screen('TEST-LT-12', 'reliability');
  assert.match(html, /data-hd-rel-day="Yesterday"[\s\S]*data-hd-rel-day="Today"/);
  tab.run("hdWinReliabilityDay('TEST-LT-12', 'Yesterday')");
  assert.match(tab.view('helpdesk/reliability'), /data-hd-rel-detail="Yesterday"[\s\S]*TEST Dock USB Ethernet driver updated/);
  const todayCritical = () => tab.machine('TEST-LT-12').reliability.find((d) => d.today).critical.length;
  // Three dock cycles with the crashing driver: three crashes.
  for (let i = 0; i < 3; i += 1) {
    tab.run("hdDockDo('TEST-LT-12', 'dock')");
    assert.match(tab.screen('TEST-LT-12', 'dock'), /data-hd-blue-screen>[\s\S]*Stop code: TEST_STOP_CODE · What failed: testnet\.sys/);
    tab.run("hdDockDo('TEST-LT-12', 'dock')");
    assert.doesNotMatch(tab.screen('TEST-LT-12', 'dock'), /data-hd-blue-screen/, 'undocked: no crash line');
  }
  assert.equal(todayCritical(), 3);
  assert.equal(tab.machine('TEST-LT-12').blueScreens, 3);
  assert.equal(tab.actions('HD-9512').filter((a) => a === 'blue-screen').length, 3);
  html = tab.screen('TEST-LT-12', 'reliability');
  assert.match(html, /data-hd-rel-row="critical">[\s\S]*?<td data-hd-rel-count="critical"><\/td><td data-hd-rel-count="critical">✖ 3<\/td>/);
  // Roll back the driver (Module 4's Device Manager), then three clean cycles.
  tab.run("hdDeviceDriver('TEST-LT-12', 'usbnet', 'rollback')");
  assert.equal(tab.machine('TEST-LT-12').devices[0].driver.version, '9.8.0');
  for (let i = 0; i < 3; i += 1) {
    tab.run("hdDockDo('TEST-LT-12', 'dock')");
    assert.doesNotMatch(tab.screen('TEST-LT-12', 'dock'), /data-hd-blue-screen/);
    tab.run("hdDockDo('TEST-LT-12', 'dock')");
  }
  assert.equal(todayCritical(), 3, 'no new critical event after the rollback');
  assert.equal(tab.actions('HD-9512').filter((a) => a === 'dock-connect').length, 6);
  assert.equal(tab.log().filter((e) => e.action === 'blue-screen').every((e) => e.computer === 'TEST-LT-12'), true);
}

function testSafeModeRoute() {
  const tab = practice();
  tab.open('HD-9511'); tab.select('TEST-WS-11');
  assert.match(tab.desktop(), /data-hd-tools="settings-recovery"/);
  assert.doesNotMatch(tab.desktop(), /data-hd-safe-mode/);
  let html = tab.screen('TEST-WS-11', 'settings-recovery');
  assert.match(html, /data-hd-recovery="recovery"/);
  // Out of order: nothing happens.
  tab.run("hdWinRecoveryGo('TEST-WS-11', 'advanced')");
  assert.match(tab.view('helpdesk/settings-recovery'), /data-hd-recovery="recovery"/);
  for (const step of ['choose', 'troubleshoot', 'advanced', 'startup-settings', 'startup-menu']) {
    tab.run(`hdWinRecoveryGo('TEST-WS-11', '${step}')`);
    assert.match(tab.view('helpdesk/settings-recovery'), new RegExp(`data-hd-recovery="${step}"`), step);
  }
  assert.match(tab.view('helpdesk/settings-recovery'), /data-hd-startup-option="4"[^>]*>4\) Enable Safe Mode</);
  tab.run("hdWinStartupOption('TEST-WS-11', 4)");
  assert.equal(tab.ctx.location.hash, '#/helpdesk/windows');
  assert.equal(tab.machine('TEST-WS-11').safeMode, true);
  assert.match(tab.desktop(), /data-hd-safe-mode[^>]*><strong>Safe Mode<\/strong><span>Safe Mode: minimal drivers/);
  assert.deepEqual(tab.actions('HD-9511'), ['recovery-advanced-startup', 'recovery-troubleshoot', 'recovery-advanced-options', 'recovery-startup-settings', 'recovery-startup-restart', 'safe-mode-started']);
  tab.run("hdWinRestart('TEST-WS-11')");
  assert.equal(tab.machine('TEST-WS-11').safeMode, false);
  assert.doesNotMatch(tab.desktop(), /data-hd-safe-mode/);
  assert.equal(tab.log().filter((e) => e.action === 'restart').pop().fromSafeMode, true);
  // Continue from the options screen starts normally.
  tab.run("hdWinRecoveryGo('TEST-WS-11', 'choose'); hdWinRecoveryGo('TEST-WS-11', 'continue')");
  assert.match(tab.view('helpdesk/settings-recovery'), /data-hd-recovery="recovery"/);
  assert.equal(tab.machine('TEST-WS-11').safeMode, false);
  // Back steps back.
  tab.run("hdWinRecoveryGo('TEST-WS-11', 'choose'); hdWinRecoveryGo('TEST-WS-11', 'troubleshoot'); hdWinRecoveryGo('TEST-WS-11', 'back')");
  assert.match(tab.view('helpdesk/settings-recovery'), /data-hd-recovery="choose"/);
}

function testProfileNotice() {
  const tab = practice();
  tab.open('HD-9511'); tab.select('TEST-WS-11');
  // A normal profile shows nothing, as in Windows.
  assert.doesNotMatch(tab.desktop(), /data-hd-profile|temporary profile/);
  tab.open('HD-9514'); tab.select('TEST-WS-14');
  assert.match(tab.desktop(), /data-hd-profile="temporary"[\s\S]*You've been signed in with a temporary profile/);
  assert.match(tab.desktop(), /data-hd-restart-bar/);
  tab.run("hdWinRestart('TEST-WS-14')");
  assert.match(tab.desktop(), /data-hd-profile="temporary"/, 'restart does not clear it (restartClears false)');
  const clears = practice('test-win-b', undefined, "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9514').console.machines['TEST-WS-14'].profile.restartClears = true;");
  clears.open('HD-9514'); clears.select('TEST-WS-14');
  clears.run("hdWinRestart('TEST-WS-14')");
  assert.doesNotMatch(clears.desktop(), /data-hd-profile/);
}

function testActiveDirectoryComputer() {
  const tab = practice();
  tab.open('HD-9511');
  let html = tab.ad();
  assert.match(html, /Find a computer by name/);
  assert.match(html, /data-hd-ad-computer="TEST-WS-11">[\s\S]*?hdAdOpenComputer\('TEST-WS-11'\)/);
  // Every row opens, so the Open button never points at one computer.
  assert.match(html.split('data-hd-ad-computer="NS-LT-0131"')[1].split('</tr>')[0], /hdAdOpenComputer\('NS-LT-0131'\)/);
  tab.input('hd-ad-computer-q', 'test-ws-11');
  tab.run('hdAdComputerFind({ preventDefault() {} })');
  html = tab.ad();
  assert.deepEqual([...html.matchAll(/data-hd-ad-computer="([^"]+)"/g)].map((m) => m[1]), ['TEST-WS-11']);
  tab.run("hdAdOpenComputer('NS-LT-0131'); hdAdComputerTab('NS-LT-0131', 'bitlocker')");
  assert.match(tab.ad(), /data-hd-ad-computer-pane="NS-LT-0131"[\s\S]*No BitLocker recovery passwords are stored/);
  assert.ok(!tab.machine('TEST-WS-11').seen || !tab.machine('TEST-WS-11').seen.includes('ad-bitlocker'), 'another computer\'s tab is not this one\'s');
  tab.run("hdAdOpenComputer('TEST-WS-11')");
  html = tab.ad();
  assert.match(html, /data-hd-ad-computer-pane="TEST-WS-11"[\s\S]*data-hd-ad-tab="bitlocker"/);
  assert.match(html, /data-hd-ad-general/);
  tab.run("hdAdComputerTab('TEST-WS-11', 'bitlocker')");
  html = tab.ad();
  assert.match(html, /data-hd-bitlocker-key="C0FFEE01"><td><code>C0FFEE01<\/code><\/td><td>1\/5\/2026<\/td><td><button[^>]*>Read key</);
  assert.ok(!html.includes(FAKE_KEY_A), 'the key is not shown until it is read');
  assert.deepEqual(tab.machine('TEST-WS-11').seen.filter((k) => k.startsWith('ad-')), ['ad-computer', 'ad-bitlocker']);
  assert.deepEqual(tab.actions('HD-9511'), [], 'looking only: nothing read out');
  // Read key on a ticket without a key action: a machine action, Key ID only.
  tab.run("hdAdReadKey('TEST-WS-11', 'C0FFEE01')");
  assert.ok(tab.ad().includes(FAKE_KEY_A));
  assert.deepEqual(tab.actions('HD-9511'), ['bitlocker-key-read']);
  const everything = JSON.stringify(tab.log()) + tab.run("JSON.stringify(hdTicketById('HD-9511').troubleshootingHistory)");
  assert.ok(!everything.includes(FAKE_KEY_A), 'the key never reaches the log or the history');
  assert.match(everything, /C0FFEE01/);
}

function testBitlockerKeyNeedsVerification() {
  const tab = practice();
  let html = tab.open('HD-9513');
  assert.doesNotMatch(html, /TEST read the matching key|TEST read the other key/, 'key actions are not on the actions card');
  assert.match(html, /TEST move it to a hard surface/);
  tab.ad(); tab.run("hdAdOpenComputer('TEST-LT-13'); hdAdComputerTab('TEST-LT-13', 'bitlocker')");
  assert.match(tab.ad(), /data-hd-bitlocker-key="AAAA1111"[\s\S]*data-hd-bitlocker-key="BBBB2222"/);
  // Before verification: refused, nothing shown, recorded as its earlyCritical.
  tab.run("hdAdReadKey('TEST-LT-13', 'AAAA1111')");
  assert.ok(!tab.ad().includes(FAKE_KEY_A));
  assert.deepEqual(tab.actions('HD-9513'), []);
  const critical = () => [...tab.run("hdTicketById('HD-9513').consoleState.critical.map((c) => c.id)")];
  assert.deepEqual(critical(), ['early:read-match']);
  // A key with no action of its own is refused too, and is a critical error.
  tab.run("hdAdReadKey('TEST-LT-13', 'CCCC3333')");
  assert.ok(!tab.ad().includes(FAKE_KEY_C));
  assert.deepEqual(critical(), ['early:read-match', 'early:bitlocker:CCCC3333']);
  assert.deepEqual(tab.actions('HD-9513'), []);
  // Verified: the matching key reads out and is its ticket action.
  tab.run("hdVerify('HD-9513', 'callback')");
  tab.run("hdAdReadKey('TEST-LT-13', 'AAAA1111')");
  assert.ok(tab.ad().includes(FAKE_KEY_A));
  assert.deepEqual(tab.actions('HD-9513'), ['read-match']);
  // The other key is a critical error.
  tab.run("hdAdReadKey('TEST-LT-13', 'BBBB2222')");
  assert.deepEqual(tab.actions('HD-9513'), ['read-match', 'read-other']);
  assert.deepEqual(critical(), ['early:read-match', 'early:bitlocker:CCCC3333', 'read-other']);
  // After verification, a key the ticket has no action for is still a critical error.
  tab.run("hdAdReadKey('TEST-LT-13', 'CCCC3333')");
  assert.deepEqual(critical(), ['early:read-match', 'early:bitlocker:CCCC3333', 'read-other', 'bitlocker:CCCC3333']);
  // The ticket copies its template's console block (the fixture, with the
  // keys); everything else in it is the student's work.
  const everything = JSON.stringify(tab.log()) + tab.run("JSON.stringify({ ...hdTicketById('HD-9513'), console: undefined })");
  assert.ok(![FAKE_KEY_A, FAKE_KEY_B, FAKE_KEY_C].some((key) => everything.includes(key)), 'no key in the ticket or the log');
}

function testNeedsAction() {
  const tab = practice();
  tab.open('HD-9513');
  tab.run("hdConsoleAction('HD-9513', 'retry')");
  assert.deepEqual(tab.actions('HD-9513'), [], 'not done before the earlier action');
  let html = tab.open('HD-9513');
  assert.match(html, /<div class="callout warn" role="status">TEST it shut off again\.<\/div>/);
  assert.doesNotMatch(html, /Verify the caller first/);
  assert.equal(tab.run("hdTicketById('HD-9513').consoleState.critical.length"), 0, 'not a critical error');
  assert.match(tab.run("hdTicketById('HD-9513').troubleshootingHistory.map((h) => h.action).join(' | ')"), /Action: TEST run the export again\. Result: TEST it shut off again\./);
  tab.run("hdConsoleAction('HD-9513', 'cool'); hdConsoleAction('HD-9513', 'retry')");
  assert.deepEqual(tab.actions('HD-9513'), ['cool', 'retry']);
  html = tab.open('HD-9513');
  assert.match(html, /callout success[^>]*>TEST it finished\./);
}

function testTypedCommands() {
  const tab = practice();
  tab.open('HD-9511'); tab.select('TEST-WS-11');
  const dism = tab.ps('dism /online /cleanup-image /restorehealth');
  assert.match(dism, /The restore operation completed successfully\.\nThe operation completed successfully\.$/);
  assert.match(tab.ps('DISM.exe /Online /Cleanup-Image /RestoreHealth /LimitAccess'), /The restore operation completed successfully/);
  assert.match(tab.ps('Dism /Online /Cleanup-Image /ScanHealth'), /No component store corruption detected/);
  assert.match(tab.ps('SFC /SCANNOW'), /Windows Resource Protection did not find any integrity violations\.$/);
  assert.match(tab.ps('sfc/scannow'), /did not find any integrity violations/);
  assert.match(tab.ps('CHKDSK c: /SCAN'), /Windows has scanned the file system and found no problems\./);
  assert.match(tab.ps('chkdsk C: /scan /perf'), /found no problems/);
  assert.match(tab.ps('chkdsk C: /f'), /cannot run because the volume is in use[\s\S]*type: chkdsk C: \/scan/);
  const dir = tab.ps('dir C:\\Users\\apatel\\Desktop');
  assert.match(dir, /Directory: C:\\Users\\apatel\\Desktop/);
  assert.match(dir, /TEST plan\.docx/);
  assert.match(dir, /8\/18\/2026 9:00 AM\s+1200 TEST sheet\.xlsx/);
  assert.match(tab.ps('Get-ChildItem -Path "c:/users/apatel/desktop/"'), /TEST sheet\.xlsx/);
  assert.match(tab.ps('gci C:\\Users\\apatel\\Desktop'), /TEST plan\.docx/);
  assert.match(tab.ps('dir C:\\Users\\nobody'), /Cannot find path 'C:\\Users\\nobody' because it does not exist/);
  // Wrong options and misspellings: one line with the right command.
  assert.equal(tab.ps('dism /online /cleanup-image /restore-health'), "dism didn't run: an option is missing or misspelled. Did you mean: DISM /Online /Cleanup-Image /RestoreHealth");
  assert.equal(tab.ps('sfc /scanow'), "sfc didn't run: an option is missing or misspelled. Did you mean: sfc /scannow");
  assert.equal(tab.ps('chkdsk /scan'), "chkdsk didn't run: an option is missing or misspelled. Did you mean: chkdsk C: /scan");
  assert.equal(tab.ps('dsim /online /cleanup-image /restorehealth'), "The term 'dsim' is not recognized. Did you mean: DISM /Online /Cleanup-Image /RestoreHealth");
  assert.equal(tab.ps('chkdks C: /scan'), "The term 'chkdks' is not recognized. Did you mean: chkdsk C: /scan");
  assert.equal(tab.ps('scf /scannow'), "The term 'scf' is not recognized. Did you mean: sfc /scannow");
  assert.equal(tab.ps('get-childitme C:\\Users'), "The term 'get-childitme' is not recognized. Did you mean: Get-ChildItem <folder>");
  // Short or unrelated commands are not near misses.
  assert.match(tab.ps('sc query spooler'), /outside this training shell/);
  assert.match(tab.ps('Get-NetAdapter'), /outside this training shell/);
  // Each is a command_run event with the computer, with the result line.
  const runs = tab.log().filter((e) => e.type === 'command_run');
  assert.ok(runs.every((e) => e.computer === 'TEST-WS-11'));
  assert.equal(runs.find((e) => /^sfc \/scannow$/i.test(e.command)).result, 'Windows Resource Protection did not find any integrity violations.');
  assert.match(tab.ps('Get-Help'), /Repair: DISM \/Online \/Cleanup-Image \/RestoreHealth, sfc \/scannow, chkdsk C: \/scan\nFiles: dir <folder>, Get-ChildItem <folder>/);
  // A machine's own repair result line.
  const broken = practice('test-win-b', undefined, "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9511').console.machines['TEST-WS-11'].repairs = { sfc: 'TEST found and repaired files.' };");
  broken.open('HD-9511'); broken.select('TEST-WS-11');
  assert.match(broken.ps('sfc /scannow'), /TEST found and repaired files\.$/);
}

// A Prove shift: sources once, with the computer; no hints; no toasts.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(DESK)}); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m05c#/helpdesk/tickets', before: inject });
  const name = prove.run('HD_PROVE.shift.selectedComputer'); const j = JSON.stringify;
  prove.select(name);
  prove.view('helpdesk/event-viewer'); prove.view('helpdesk/event-viewer');
  prove.run(`hdWinEventSet(${j(name)}, { log: 'diagnostics-performance' })`);
  prove.view('helpdesk/event-viewer');
  prove.run(`hdWinRestart(${j(name)})`);
  prove.view('helpdesk/event-viewer');
  prove.screen(name, 'reliability');
  prove.screen(name, 'settings-recovery');
  prove.ad(); prove.run(`hdAdOpenComputer(${j(name)}); hdAdComputerTab(${j(name)}, 'bitlocker'); hdAdComputerTab(${j(name)}, 'bitlocker')`);
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => /^(event-log|reliability|recovery|ad-)/.test(s));
  assert.deepEqual(opened, [`event-log:${name}:system`, `event-log:${name}:diagnostics-performance`, `event-log:${name}:diagnostics-performance:after-restart`, `reliability:${name}`, `recovery:${name}`, `ad-computer:${name}`, `ad-bitlocker:${name}`]);
  // No Practice hints in a Prove It.
  assert.equal(prove.ps('sfc /scanow'), 'Error: 87\n\nThe parameter is incorrect.');
  assert.match(prove.ps('dsim'), /outside this training shell/);
  assert.doesNotMatch(prove.ps('Get-Help'), /Repair:|Files:|Events: Get-WinEvent -LogName/);
  assert.match(prove.ps('DISM /Online /Cleanup-Image /RestoreHealth'), /restore operation completed successfully/);
  prove.run(`hdAdReadKey(${j(name)}, 'C0FFEE01')`);
  const events = JSON.stringify(prove.run('hdState.prove.events'));
  assert.ok(!events.includes(FAKE_KEY_A), 'no key in the Prove record');
  assert.ok(prove.run(`hdState.prove.events.some((e) => e.type === 'action_taken' && e.value === 'bitlocker-key-read' && e.computer === ${j(name)})`));
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.deepEqual([...prove.toasts], []);
  // machineTools: every computer of the shift shows the new screens, neutrally.
  const all = sim({ url: 'https://academy.test/sim/?prove=its-02&student=student-m05d#/helpdesk/tickets',
    before: `{ const m = HD_PROVE_SHIFTS['its-02'].machines; Object.assign(m[Object.keys(m)[0]], ${JSON.stringify(DESK)}); }` });
  const [, second] = [...all.run('Object.keys(HD_PROVE.shift.machines)')];
  all.select(second);
  const desktop = all.view('helpdesk/windows');
  assert.match(desktop, /data-hd-tools="reliability"/);
  assert.match(desktop, /data-hd-tools="settings-recovery"/);
  assert.match(all.screen(second, 'reliability'), /Nothing to show on this computer/);
  assert.match(all.view('helpdesk/event-viewer'), /data-hd-event-logs="system"[\s\S]*No events match this filter/);
  assert.match(all.ad(), new RegExp(`hdAdOpenComputer\\('${second}'\\)`));
  all.run(`hdAdOpenComputer(${j(second)}); hdAdComputerTab(${j(second)}, 'bitlocker')`);
  assert.match(all.ad(), /No BitLocker recovery passwords are stored/);
}

// Review fixes: each rule that keeps a screen honest.
function testReviewFixes() {
  // A restart alone isn't the fix when the boot time waits for free space.
  const needs = "{ const m = HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9511').console.machines['TEST-WS-11']; m.bootSecondsAfterFixNeeds = { freePercent: 16 }; m.storage = { drive: 'C:', sizeGb: 100, freeGb: 7, temporaryFiles: [{ id: 'tmp', name: 'Temporary files', gb: 10 }] }; }";
  const slow = practice('test-win-b', undefined, needs);
  slow.open('HD-9511'); slow.select('TEST-WS-11');
  slow.run("hdWinRestart('TEST-WS-11')");
  assert.equal(slow.machine('TEST-WS-11').bootSeconds, 90, 'still slow: C: is 7% free');
  slow.run("hdWinTempTick('TEST-WS-11','tmp'); hdWinTempRemove('TEST-WS-11'); hdWinRestart('TEST-WS-11')");
  assert.equal(slow.machine('TEST-WS-11').bootSeconds, 50, '17% free: the faster boot');
  // An open event is closed by a restart (its row number moves).
  slow.run("hdWinEventSet('TEST-WS-11', { log: 'diagnostics-performance' }); hdWinEventOpen('TEST-WS-11', 0); hdWinRestart('TEST-WS-11')");
  assert.doesNotMatch(slow.view('helpdesk/event-viewer'), /data-hd-event-detail/);
  // Get-WinEvent reads this computer's log in any order; never the shared list.
  assert.match(slow.ps('Get-WinEvent -MaxEvents 5 -LogName System'), /9001 Error/);
  assert.match(slow.ps("Get-WinEvent -FilterHashtable @{LogName='System'; Id=9002}"), /9002 Warning\s+TEST clock drift/);
  assert.doesNotMatch(slow.ps("Get-WinEvent -FilterHashtable @{LogName='System'; Id=9002}"), /9001/);
  assert.match(slow.ps('Get-WinEvent -LogName Application | Format-List'), /9100/);
  assert.equal(slow.ps('Get-WinEvent -LogName Security'), 'Get-WinEvent : No events were found that match the specified selection criteria.');
  assert.doesNotMatch(slow.ps('Get-WinEvent'), /NETLOGON/);
  // A folder the data doesn't list, inside a listed profile: empty, not missing.
  assert.equal(slow.ps('dir C:\\Users\\apatel\\Documents'), '\n    Directory: C:\\Users\\apatel\\Documents\n');
  // The dock crashes only with power; the crash line goes with the rollback.
  const dock = practice('test-win-b', undefined, "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9512').console.machines['TEST-LT-12'].dock.power = false;");
  dock.open('HD-9512');
  dock.run("hdDockDo('TEST-LT-12', 'dock')");
  assert.equal(dock.machine('TEST-LT-12').blueScreens, undefined, 'no power: no crash');
  dock.run("hdDockDo('TEST-LT-12', 'dock'); hdDockDo('TEST-LT-12', 'power'); hdDockDo('TEST-LT-12', 'dock')");
  assert.equal(dock.machine('TEST-LT-12').blueScreens, 1);
  dock.run("hdDeviceDriver('TEST-LT-12', 'usbnet', 'rollback')");
  assert.doesNotMatch(dock.screen('TEST-LT-12', 'dock'), /data-hd-blue-screen/);
  // Prove It: no Key ID hint, no Safe Mode hint, no computer list in Event Viewer.
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(DESK)}, { safeMode: true }); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m05e#/helpdesk/tickets', before: inject });
  const name = prove.run('HD_PROVE.shift.selectedComputer'); const j = JSON.stringify;
  prove.select(name);
  assert.doesNotMatch(prove.view('helpdesk/event-viewer'), /data-hd-event-picker/);
  assert.match(prove.view('helpdesk/event-viewer'), /data-hd-event-logs="system"/);
  prove.ad(); prove.run(`hdAdOpenComputer(${j(name)}); hdAdComputerTab(${j(name)}, 'bitlocker')`);
  assert.doesNotMatch(prove.ad(), /first 8 characters/);
  assert.doesNotMatch(prove.screen(name, 'settings-recovery'), /Restart it to start Windows normally/);
}

// The machine state survives a reload with the student's changes.
function testReloadKeepsState() {
  const local = store();
  const tab = practice('test-win-b', local);
  tab.open('HD-9511');
  tab.run("hdWinRecoveryGo('TEST-WS-11','choose'); hdWinRecoveryGo('TEST-WS-11','troubleshoot'); hdWinRecoveryGo('TEST-WS-11','advanced'); hdWinRecoveryGo('TEST-WS-11','startup-settings'); hdWinRecoveryGo('TEST-WS-11','startup-menu'); hdWinStartupOption('TEST-WS-11', 5)");
  tab.open('HD-9512'); tab.run("hdDockDo('TEST-LT-12','dock')");
  const again = practice('test-win-b', local);
  assert.equal(again.machine('TEST-WS-11').safeMode, true);
  assert.equal(again.machine('TEST-WS-11').safeModeOption, 'Safe Mode with Networking');
  assert.equal(again.machine('TEST-LT-12').blueScreens, 1);
}

const tests = [testOldTicketsTurnNothingOn, testNoDataUsesCrashOnDock, testHideEventsFromOnASet, testEventLogs, testGetWinEventReadsTheLog, testReliabilityAndDockCrash,
  testSafeModeRoute, testProfileNotice, testActiveDirectoryComputer, testBitlockerKeyNeedsVerification, testNeedsAction, testTypedCommands, testProveShift, testReviewFixes, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m05-console-b: ${tests.length} passed`);

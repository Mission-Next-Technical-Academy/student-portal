'use strict';
/* Help Desk simulator: the security, browser and OneDrive tools added for
 * Module 6 (key its-07), console B (ui/helpdesk.js "Security, browser and
 * OneDrive tools"): Windows Security for one device, the Defender PowerShell
 * lines, Browser › Extensions, a process a removal makes leave, OneDrive,
 * a ticket's criticalActions and undoUnsafe, and the choice card.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-97xx,
 * TEST- computers, 192.0.2.x documentation addresses), never in
 * ui/helpdesk-data.js. No Module 6 content: all names below are neutral test
 * fixtures. Every older ticket, set and Prove shift must look and answer as
 * before, and console A's tools keep working. */
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
  { name: 'TEST-WS-71', user: 'Test User One', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.71', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
  { name: 'TEST-LT-72', user: 'Test User Two', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.72', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
];

// OneDrive paths built to exact lengths. ROOT is 33 characters.
const ROOT = 'C:\\Users\\tuser\\OneDrive - Test Org';
const LONG = 'A long folder name kept for the console test only';
const fullPath = (folder, name) => `${ROOT}\\${folder}\\${name}`;
// The folder list that makes fullPath(folder, name) exactly `length` long.
function folderFor(length, name) {
  const fixed = ['Level one', 'Level two', 'Level three', 'Level four', LONG];
  const used = fullPath(`${fixed.join('\\')}\\`, name).length; // the pad folder adds its own length
  return [...fixed, 'p'.repeat(length - used)].join('\\');
}
const LONG_FILE = 'Test report.xlsx';
const LONG_FOLDER = folderFor(412, LONG_FILE);

// A desk PC with every console B key (and resetPc, from console A).
const FULL = {
  processes: [
    { name: 'testhelper-ext', cpu: 30, memory: 200, disk: 0, goneWhen: { extensionRemoved: 'Sample Tab Extension' } },
    { name: 'testhelper-item', cpu: 20, memory: 150, disk: 0, goneWhen: { threatRemoved: 'T-100' } },
    { name: 'testhelper-both', cpu: 25, memory: 180, disk: 0, goneWhen: { extensionRemoved: 'Sample Tab Extension', threatRemoved: 'T-100' } },
    { name: 'explorer', cpu: 1, memory: 90, disk: 0 },
  ],
  performance: { cpu: 80, memory: 70, disk: 5 },
  protection: {
    realtime: true, definitions: 'Today, 8:00 AM', lastScan: '9 days ago',
    history: [{ id: 'T-100', name: 'Test:Item/Sample.A', date: '8/12/2026 10:15 AM', severity: 'Low', status: 'Allowed' }],
    allowed: [{ id: 'T-100', name: 'Test:Item/Sample.A', severity: 'Low' }],
    exclusions: [],
  },
  extensions: [
    { name: 'Sample Sign In', publisher: 'Test Corp', added: '1/5/2026' },
    { name: 'Sample Tab Extension', publisher: 'Test Ext Co', added: '6 days ago' },
  ],
  browser: { name: 'Test Browser', homePage: 'https://intranet.test/' },
  oneDrive: {
    root: ROOT, storageUsed: 37,
    files: [
      { name: 'Test: plan?.xlsx', folder: 'Plans' },
      { name: LONG_FILE, folder: LONG_FOLDER },
      { name: 'Fine.docx', folder: 'Plans' },
    ],
  },
  resetPc: true,
};
// A clean PC: protection on, nothing in history or allowed; OneDrive at the
// 400 limit exactly (syncs) and at 401 (doesn't).
const CLEAN = {
  protection: { realtime: true, definitions: 'Today, 7:30 AM', lastScan: '2 days ago', history: [], allowed: [], exclusions: [] },
  extensions: [],
  oneDrive: { root: ROOT, storageUsed: 12, files: [
    { name: 'At limit.txt', folder: folderFor(400, 'At limit.txt') },
    { name: 'Over limit.txt', folder: folderFor(401, 'Over limit.txt') },
  ] },
};
const CHOICE = {
  heading: 'Choose your response', prompt: 'The user asks for something. TEST prompt.', after: 'quick-scan',
  options: [
    { id: 'wrong', text: 'Test wrong option', feedback: 'TEST: not this one.' },
    { id: 'bad', text: 'Test critical option', critical: true, feedback: 'TEST: critical.' },
    { id: 'right', text: 'Test right option', right: true, feedback: 'TEST: right.', action: { id: 'test-request-opened', label: 'Opened a test request' } },
  ],
};
const CRITICAL = ['realtime-protection-off', 'exclusion-added', 'onedrive-file-deleted', 'onedrive-unlinked', 'onedrive-reset', 'pc-reset-chosen'].map((action) => ({ action, text: `TEST critical: ${action}` }));
const SECURE = base({ id: 'HD-9701', number: 'INC0019701', requester: 'Maya Chen', createdAt: at(WED, '09:00'), description: 'TEST security ticket',
  console: { matrix: {}, machines: { 'TEST-WS-71': FULL }, criticalActions: CRITICAL } });
const SAFE = base({ id: 'HD-9702', number: 'INC0019702', requester: 'Maya Chen', createdAt: at(WED, '09:05'), description: 'TEST clean machine',
  console: { matrix: {}, machines: { 'TEST-LT-72': CLEAN }, undoUnsafe: true, choice: CHOICE } });
const TICKETS = [SECURE, SAFE];
const SETS = { practice: { 'test-security': { title: 'Test security', tickets: ['HD-9701', 'HD-9702'], now: at(WED, '09:20') } } };

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
    critical: (id) => [...run(`(hdTicketById(${j(id)}).consoleState || { critical: [] }).critical.map((c) => c.id)`)],
    desktop: () => run("VIEWS['helpdesk/windows']()").split('<div class="hd-windows-screen">')[1],
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    tab: (computer, screen, tab) => { run(`hdWinScreenTab(${j(computer)}, ${j(screen)}, ${j(tab)})`); return run(`VIEWS['helpdesk/${screen}']()`); },
  };
}
const security = (local) => sim({ url: 'https://academy.test/sim/?practice=test-security&student=stu-1#/helpdesk/tickets', local });
const NEW_SCREENS = ['windows-security', 'browser-extensions', 'onedrive'];
const NEW_MARKERS = /data-hd-(windows-security|browser-extensions|onedrive|choice-card|choice=)|data-hd-tools="(windows-security|browser-extensions|onedrive)"/;
const OUTSIDE = /^The term '(get|start|set|add)-mp[^']*' is outside this training shell\. Type Get-Help for supported commands\.$/i;
const DEFENDER = ['Get-MpComputerStatus', 'Start-MpScan -ScanType QuickScan', 'Get-MpThreatDetection', 'Set-MpPreference -DisableRealtimeMonitoring $true', 'Add-MpPreference -ExclusionPath C:\\Test'];
// The action ids the Prove It key matches (action_taken value). Pinned.
const PINNED = ['realtime-protection-off', 'exclusion-added', 'quick-scan', 'quick-scan-after-removal', 'threat-unallowed', 'threat-removed', 'extension-removed', 'onedrive-renamed', 'onedrive-file-deleted', 'onedrive-unlinked', 'onedrive-reset'];

// Every older ticket, set and Prove shift shows none of the new controls and
// answers the Defender lines as before ("outside this training shell").
function testOldTicketsTurnNothingOn() {
  const tab = sim(); const plain = sim({ withTest: false });
  for (const id of tab.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id} shows no new feature`);
  for (const computer of plain.run('HD_COMPUTERS.map((c) => c.name)')) {
    tab.select(computer); plain.select(computer);
    assert.equal(tab.desktop(), plain.desktop(), `${computer} desktop unchanged`);
    assert.doesNotMatch(tab.desktop(), NEW_MARKERS);
    for (const command of DEFENDER) assert.match(plain.out(command), OUTSIDE, `${computer}: ${command}`);
    assert.doesNotMatch(plain.out('Get-Help'), /Defender: |MpComputerStatus/);
  }
  tab.select('NS-LT-0131');
  for (const route of NEW_SCREENS) assert.match(tab.view(`helpdesk/${route}`), /Not available on this computer/, route);
  // Module 6's own sets (its-07, its-07-guided) turn these on by design
  // (tests/hdesk-m06-guided-lab.test.js, tests/hdesk-m06-practice-tickets.test.js).
  const module6 = (k) => /^its-07(-|$)/.test(k);
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-') && !module6(k))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    for (const name of set.run('Object.keys(hdState.machines)')) {
      set.select(name);
      assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`);
      assert.match(set.out('Get-MpComputerStatus'), OUTSIDE, `${key} ${name}`);
    }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS')).filter((k) => !module6(k))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    for (const name of set.run('Object.keys(hdState.machines || {})')) {
      set.select(name);
      assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`);
      assert.match(set.out('Set-MpPreference -DisableRealtimeMonitoring $true'), OUTSIDE, `${key} ${name}`);
    }
  }
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS'))) {
    const url = `https://academy.test/sim/?prove=${key}&student=student-m06#/helpdesk/tickets`;
    const prove = sim({ url }); const before = sim({ url, withTest: false });
    for (const name of before.run('hdComputers().map((c) => c.name)')) {
      prove.select(name); before.select(name);
      assert.equal(prove.desktop(), before.desktop(), `prove ${key} ${name} desktop`);
      assert.doesNotMatch(prove.desktop(), NEW_MARKERS, `prove ${key} ${name}`);
      assert.match(prove.out('Get-MpThreatDetection'), OUTSIDE, `prove ${key} ${name}`);
    }
  }
}

// Endpoint Security (the SOC alert list) is a different screen and stays as
// it was; Module 1's verification card on HD-2151 works as before.
function testEndpointSecurityAndVerificationUnchanged() {
  const tab = sim(); const plain = sim({ withTest: false });
  const endpoint = tab.view('helpdesk/endpoint-security');
  assert.equal(endpoint, plain.view('helpdesk/endpoint-security'));
  assert.match(endpoint, /<h1>Endpoint Security<\/h1>/);
  assert.doesNotMatch(endpoint, /Windows Security|data-hd-windows-security|Quick scan/);
  const m1 = sim({ url: 'https://academy.test/sim/?practice=its-01&student=stu-1#/helpdesk/tickets' });
  const html = m1.open('HD-2151');
  assert.match(html, /<div class="card hd-verify">/);
  assert.doesNotMatch(html, /data-hd-choice/);
  const option = m1.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2151').console.verification.options.find((o) => o.pass).id");
  m1.run(`hdVerify('HD-2151', ${JSON.stringify(option)})`);
  const state = m1.run("JSON.parse(JSON.stringify(hdTicketById('HD-2151').consoleState))");
  assert.equal(state.verification.passed, true);
  assert.equal(state.choice, undefined, 'the choice state is never created for a verification ticket');
  assert.ok(m1.run('hdState.practiceLog').some((e) => e.type === 'identity_checked'));
}

function testWindowsSecurity() {
  const tab = security();
  tab.open('HD-9701'); tab.select('TEST-WS-71');
  assert.match(tab.desktop(), /data-hd-tools="windows-security"/);
  const home = tab.screen('TEST-WS-71', 'windows-security');
  assert.match(home, /data-hd-windows-security="home"/);
  assert.match(home, /Security intelligence last updated: Today, 8:00 AM/);
  let html = tab.tab('TEST-WS-71', 'windows-security', 'virus-threat');
  assert.match(html, /data-hd-realtime="on">On</);
  assert.match(html, /data-hd-last-scan>9 days ago</);
  assert.match(html, /data-hd-definitions>Last updated: Today, 8:00 AM</);
  html = tab.tab('TEST-WS-71', 'windows-security', 'protection-history');
  assert.match(html, /<tr data-hd-history-item="T-100"><td>8\/12\/2026 10:15 AM<\/td><td>Test:Item\/Sample\.A<\/td><td>Low<\/td><td>Allowed<\/td><\/tr>/);
  // Quick scan before any removal: quick-scan only; an allowed item isn't found.
  tab.run("hdWinScanNow('TEST-WS-71')");
  assert.deepEqual(tab.actions('HD-9701'), ['quick-scan']);
  assert.match(tab.tab('TEST-WS-71', 'windows-security', 'virus-threat'), /data-hd-last-scan>Just now · No current threats\.</);
  // Don't allow, then Remove; the list empties and history reads Removed.
  html = tab.tab('TEST-WS-71', 'windows-security', 'allowed-threats');
  assert.match(html, /data-hd-threat-unallow onclick="hdWinThreatSet\('TEST-WS-71','T-100','unallow'\)">Don't allow</);
  tab.run("hdWinThreatSet('TEST-WS-71','T-100','remove')");
  assert.deepEqual(tab.actions('HD-9701'), ['quick-scan'], 'Remove waits for Don\'t allow');
  tab.run("hdWinThreatSet('TEST-WS-71','T-100','unallow')");
  // As on Windows: it leaves Allowed threats and shows under Current threats.
  assert.match(tab.view('helpdesk/windows-security'), /data-hd-allowed-empty>There are no allowed threats\./);
  html = tab.tab('TEST-WS-71', 'windows-security', 'virus-threat');
  assert.match(html, /<p data-hd-current-threats>Threats found\.<\/p><ul class="hd-list"><li data-hd-current-threat="T-100">Test:Item\/Sample\.A <span class="muted">Low<\/span> <button[^>]*data-hd-threat-remove onclick="hdWinThreatSet\('TEST-WS-71','T-100','remove'\)">Remove<\/button>/);
  assert.doesNotMatch(html, /on Allowed threats/, 'no pointer to the next step');
  assert.match(tab.tab('TEST-WS-71', 'windows-security', 'home'), /1 threat found/);
  tab.run("hdWinThreatSet('TEST-WS-71','T-100','remove')");
  assert.match(tab.tab('TEST-WS-71', 'windows-security', 'virus-threat'), /<p data-hd-current-threats>No current threats\.<\/p>/);
  assert.match(tab.tab('TEST-WS-71', 'windows-security', 'allowed-threats'), /data-hd-allowed-empty>There are no allowed threats\./);
  assert.equal(tab.machine('TEST-WS-71').protection.history[0].status, 'Removed');
  // After the removal: quick-scan and quick-scan-after-removal; Start-MpScan the same.
  tab.run("hdWinScanNow('TEST-WS-71')");
  assert.equal(tab.ps('start-mpscan -scantype quickscan'), '');
  assert.deepEqual(tab.actions('HD-9701'), ['quick-scan', 'threat-unallowed', 'threat-removed', 'quick-scan', 'quick-scan-after-removal', 'quick-scan', 'quick-scan-after-removal']);
  // Screen sources: home bare, every other page by name; each once.
  const seen = tab.machine('TEST-WS-71').seen;
  for (const key of ['windows-security', 'windows-security:virus-threat', 'windows-security:protection-history', 'windows-security:allowed-threats']) assert.ok(seen.includes(key), key);
  // A clean PC: empty history and no allowed threats.
  tab.open('HD-9702');
  assert.match(tab.tab('TEST-LT-72', 'windows-security', 'protection-history'), /data-hd-history-empty>No recent items/);
  assert.match(tab.tab('TEST-LT-72', 'windows-security', 'allowed-threats'), /data-hd-allowed-empty/);
  tab.select('TEST-LT-72');
  assert.equal(tab.ps('Get-MpThreatDetection'), '');
}

// A process with goneWhen leaves Task Manager and Get-Process only when
// every named removal was made.
function testGoneWhen() {
  const names = (tab) => tab.machine('TEST-WS-71').processes.map((p) => p.name);
  const ext = security(); ext.open('HD-9701'); ext.select('TEST-WS-71');
  ext.run("hdWinRemoveExtension('TEST-WS-71','Sample Tab Extension')");
  assert.deepEqual(names(ext), ['testhelper-item', 'testhelper-both', 'explorer'], 'extension only');
  assert.doesNotMatch(ext.screen('TEST-WS-71', 'pc-task-manager'), /testhelper-ext/);
  assert.doesNotMatch(ext.out('Get-Process | Sort-Object CPU -Descending'), /testhelper-ext/);
  const threat = security(); threat.open('HD-9701');
  threat.run("hdWinThreatSet('TEST-WS-71','T-100','unallow'); hdWinThreatSet('TEST-WS-71','T-100','remove')");
  assert.deepEqual(names(threat), ['testhelper-ext', 'testhelper-both', 'explorer'], 'threat only');
  threat.run("hdWinRemoveExtension('TEST-WS-71','Sample Tab Extension')");
  assert.deepEqual(names(threat), ['explorer'], 'both');
}

// The unsafe controls: each route works, records the same action, and the
// ticket's criticalActions marks it.
function testUnsafeRoutes() {
  const sw = security(); sw.open('HD-9701');
  sw.run("hdWinRealtimeSet('TEST-WS-71', false)");
  assert.equal(sw.machine('TEST-WS-71').protection.realtime, false);
  assert.deepEqual(sw.actions('HD-9701'), ['realtime-protection-off']);
  assert.deepEqual(sw.critical('HD-9701'), ['machine:realtime-protection-off']);
  assert.match(sw.tab('TEST-WS-71', 'windows-security', 'home'), /Real-time protection is off/);
  const unsafe = sw.run("hdState.practiceLog.filter((e) => e.type === 'action_taken').map((e) => e.unsafe)");
  assert.deepEqual([...unsafe], [true]);
  sw.run("hdWinRealtimeSet('TEST-WS-71', true)");
  assert.equal(sw.machine('TEST-WS-71').protection.realtime, true);

  const typed = security(); typed.open('HD-9701'); typed.select('TEST-WS-71');
  assert.equal(typed.ps('Set-MpPreference -DisableRealtimeMonitoring $true'), '');
  assert.equal(typed.machine('TEST-WS-71').protection.realtime, false);
  assert.deepEqual(typed.actions('HD-9701'), ['realtime-protection-off']);
  assert.deepEqual(typed.critical('HD-9701'), ['machine:realtime-protection-off']);
  assert.match(typed.ps('Get-MpComputerStatus'), /RealTimeProtectionEnabled\s+: False/);
  const commands = typed.run("hdState.practiceLog.filter((e) => e.type === 'command_run').map((e) => e.command)");
  assert.match(commands[0], /set-mppreference\s+-disablerealtimemonitoring\s+\$?true/i);

  const screen = security(); screen.open('HD-9701');
  screen.input('hd-exclusion-path', 'C:\\Test\\Folder');
  screen.run("hdWinExclusionFrom('TEST-WS-71')");
  assert.deepEqual(screen.machine('TEST-WS-71').protection.exclusions, ['C:\\Test\\Folder']);
  assert.deepEqual(screen.actions('HD-9701'), ['exclusion-added']);
  assert.deepEqual(screen.critical('HD-9701'), ['machine:exclusion-added']);
  screen.input('hd-exclusion-path', '  ');
  screen.run("hdWinExclusionFrom('TEST-WS-71')");
  assert.deepEqual(screen.actions('HD-9701'), ['exclusion-added'], 'an empty path adds nothing');

  const add = security(); add.open('HD-9701'); add.select('TEST-WS-71');
  assert.equal(add.ps('Add-MpPreference -ExclusionPath C:\\Test'), '');
  assert.deepEqual(add.machine('TEST-WS-71').protection.exclusions, ['C:\\Test'], 'the path keeps its letter case');
  assert.deepEqual(add.actions('HD-9701'), ['exclusion-added']);
  assert.deepEqual(add.critical('HD-9701'), ['machine:exclusion-added']);
  assert.match(add.run("hdState.practiceLog.filter((e) => e.type === 'command_run')[0].command"), /add-mppreference\s+-exclusionpath/i);
  assert.match(add.ps('ADD-MPPREFERENCE -EXCLUSIONPATH "D:\\Other"'), /^$/);
  assert.deepEqual(add.machine('TEST-WS-71').protection.exclusions, ['C:\\Test', 'D:\\Other']);
}

// undoUnsafe (Practice): the change is recorded, undone at once, and the
// line shows. The Prove It test checks that nothing undoes there.
function testUndoUnsafe() {
  const tab = security(); tab.open('HD-9702'); tab.select('TEST-LT-72');
  tab.run("hdWinRealtimeSet('TEST-LT-72', false)");
  assert.equal(tab.machine('TEST-LT-72').protection.realtime, true, 'undone');
  assert.deepEqual(tab.actions('HD-9702'), ['realtime-protection-off']);
  const line = 'Never turn off protection or add an exclusion to make a problem go away. In a graded ticket this is a critical error.';
  assert.ok(tab.toasts.includes(line));
  assert.match(tab.tab('TEST-LT-72', 'windows-security', 'virus-threat'), /data-hd-unsafe-undone>Never turn off protection/);
  tab.ps('Add-MpPreference -ExclusionPath C:\\Temp');
  assert.deepEqual(tab.machine('TEST-LT-72').protection.exclusions, []);
  assert.deepEqual(tab.actions('HD-9702'), ['realtime-protection-off', 'exclusion-added']);
  tab.ps('Set-MpPreference -DisableRealtimeMonitoring 1');
  assert.equal(tab.machine('TEST-LT-72').protection.realtime, true);
  assert.deepEqual(tab.critical('HD-9702'), [], 'no criticalActions on this ticket');
}

// The optional lines print what the screen shows.
function testDefenderLinesMatchScreen() {
  const tab = security(); tab.open('HD-9701'); tab.select('TEST-WS-71');
  const status = tab.ps('Get-MpComputerStatus');
  const html = tab.tab('TEST-WS-71', 'windows-security', 'virus-threat');
  const definitions = /data-hd-definitions>Last updated: ([^<]+)</.exec(html)[1];
  const lastScan = /data-hd-last-scan>([^<]+)</.exec(html)[1];
  assert.match(status, new RegExp(`AntivirusSignatureLastUpdated\\s+: ${definitions}`));
  assert.match(status, new RegExp(`QuickScanEndTime\\s+: ${lastScan}`));
  assert.match(status, /AMServiceEnabled\s+: True/);
  assert.match(status, /RealTimeProtectionEnabled\s+: True/);
  assert.equal(tab.ps('get-mpcomputerstatus | select-object RealTimeProtectionEnabled, AntivirusSignatureLastUpdated'), 'AntivirusSignatureLastUpdated : Today, 8:00 AM\nRealTimeProtectionEnabled     : True');
  const detections = tab.ps('Get-MpThreatDetection');
  assert.match(detections, /ThreatID\s+: T-100/);
  assert.match(detections, /ThreatName\s+: Test:Item\/Sample\.A/);
  assert.match(detections, /ThreatStatus\s+: Allowed/);
  assert.match(tab.ps('Start-MpScan -ScanType FullScan'), /quick scan only/);
  assert.match(tab.ps('Set-MpPreference -PUAProtection Enabled'), /isn't part of this training shell/);
  // Get-Help lists the three optional lines only; a misspelling gets the hint.
  const help = tab.ps('Get-Help');
  assert.match(help, /Defender: Get-MpComputerStatus, Start-MpScan -ScanType QuickScan, Get-MpThreatDetection/);
  assert.doesNotMatch(help, /Set-MpPreference|Add-MpPreference/);
  assert.match(tab.ps('Get-MpComputerStatu'), /Did you mean: Get-MpComputerStatus/);
}

function testExtensions() {
  const tab = security(); tab.open('HD-9701'); tab.select('TEST-WS-71');
  let html = tab.screen('TEST-WS-71', 'browser-extensions');
  assert.match(html, /Test Browser › Extensions · TEST-WS-71/);
  assert.match(html, /data-hd-home-page>Home page: <code>https:\/\/intranet\.test\/<\/code>/);
  assert.match(html, /<tr data-hd-extension="Sample Tab Extension"><td>Sample Tab Extension<\/td><td>Test Ext Co<\/td><td>6 days ago<\/td>/);
  tab.run('confirm = () => false'); tab.run("hdWinRemoveExtension('TEST-WS-71','Sample Tab Extension')"); tab.run('confirm = () => true');
  assert.deepEqual(tab.actions('HD-9701'), []);
  tab.run("hdWinRemoveExtension('TEST-WS-71','Sample Tab Extension')");
  html = tab.view('helpdesk/browser-extensions');
  assert.doesNotMatch(html, /data-hd-extension="Sample Tab Extension"/);
  assert.match(html, /data-hd-extension="Sample Sign In"/);
  assert.deepEqual(tab.actions('HD-9701'), ['extension-removed']);
  assert.equal(tab.machine('TEST-WS-71').browser.homePage, 'https://intranet.test/', 'home page unchanged');
  assert.ok(tab.machine('TEST-WS-71').seen.includes('browser-extensions'));
}

function testOneDrive() {
  assert.equal(fullPath(LONG_FOLDER, LONG_FILE).length, 412);
  const tab = security(); tab.open('HD-9701'); tab.select('TEST-WS-71');
  let html = tab.screen('TEST-WS-71', 'onedrive');
  assert.match(html, /data-hd-onedrive-status="error"/);
  assert.match(html, /data-hd-onedrive-storage>37%</);
  html = tab.tab('TEST-WS-71', 'onedrive', 'sync-problems');
  assert.match(html, /<div data-hd-sync-problem="0"><strong>Test: plan\?\.xlsx<\/strong>/);
  assert.match(html, /<li data-hd-sync-cause>The name contains characters that aren&#39;t allowed<\/li>|<li data-hd-sync-cause>The name contains characters that aren't allowed<\/li>/);
  assert.match(html, /<li data-hd-sync-cause>The path is too long: 412 characters \(the limit is 400\)<\/li>/);
  assert.doesNotMatch(html, /Fine\.docx/);
  // A new name with an invalid character is refused, as Windows does.
  tab.run("hdWinOneDriveRename('TEST-WS-71', 0, 'file', 'Still: bad')");
  assert.match(tab.view('helpdesk/onedrive'), /data-hd-od-error>A file name can/);
  assert.deepEqual(tab.actions('HD-9701'), []);
  tab.run("hdWinOneDriveRename('TEST-WS-71', 0, 'file', 'Test - plan.xlsx')");
  assert.deepEqual(tab.actions('HD-9701'), ['onedrive-renamed']);
  // The path cause: renaming the file leaves it (folders alone are over 400).
  tab.run("hdWinOneDriveRename('TEST-WS-71', 1, 'file', 'R.xlsx')");
  html = tab.view('helpdesk/onedrive');
  assert.match(html, /The path is too long: 402 characters \(the limit is 400\)/);
  assert.match(tab.tab('TEST-WS-71', 'onedrive', 'status'), /data-hd-onedrive-status="error"/);
  // Renaming the long folder brings it under 400: green tick, on the web.
  tab.input('hd-od-target-1', 'folder:4'); tab.input('hd-od-name-1', 'Short');
  tab.tab('TEST-WS-71', 'onedrive', 'sync-problems');
  tab.run("hdWinOneDriveRenameFrom('TEST-WS-71', 1)");
  assert.equal(fullPath(tab.machine('TEST-WS-71').oneDrive.files[1].folder, 'R.xlsx').length, 402 - LONG.length + 5);
  assert.match(tab.view('helpdesk/onedrive'), /data-hd-sync-none>No sync problems/);
  assert.match(tab.tab('TEST-WS-71', 'onedrive', 'status'), /data-hd-onedrive-status="synced"/);
  html = tab.tab('TEST-WS-71', 'onedrive', 'web');
  for (const name of ['Test - plan.xlsx', 'R.xlsx', 'Fine.docx']) assert.match(html, new RegExp(`data-hd-web-file="${name.replace(/\./g, '\\.')}"`), name);
  assert.deepEqual(tab.actions('HD-9701'), ['onedrive-renamed', 'onedrive-renamed', 'onedrive-renamed']);
  const detail = tab.run("hdState.practiceLog.filter((e) => e.action === 'onedrive-renamed').map((e) => `${e.kind}:${e.from}>${e.to}`)");
  assert.deepEqual([...detail], ['file:Test: plan?.xlsx>Test - plan.xlsx', `file:${LONG_FILE}>R.xlsx`, `folder:${LONG}>Short`]);
  const seen = tab.machine('TEST-WS-71').seen;
  for (const key of ['onedrive', 'onedrive:sync-problems', 'onedrive:web']) assert.ok(seen.includes(key), key);
  // Delete, Unlink and Reset each record their action, and the ticket's
  // criticalActions marks them.
  const other = security(); other.open('HD-9701');
  other.run("hdWinOneDriveDelete('TEST-WS-71', 0); hdWinOneDriveControl('TEST-WS-71','unlink'); hdWinOneDriveControl('TEST-WS-71','reset')");
  assert.deepEqual(other.actions('HD-9701'), ['onedrive-file-deleted', 'onedrive-unlinked', 'onedrive-reset']);
  assert.deepEqual(other.critical('HD-9701'), ['machine:onedrive-file-deleted', 'machine:onedrive-unlinked', 'machine:onedrive-reset']);
  assert.equal(other.machine('TEST-WS-71').oneDrive.files.length, 2);
  assert.match(other.screen('TEST-WS-71', 'onedrive'), /data-hd-onedrive-status="signed-out"/);
  // 400 characters syncs; 401 doesn't.
  const edge = security(); edge.open('HD-9702');
  html = edge.screen('TEST-LT-72', 'onedrive', { tab: 'sync-problems' });
  assert.match(html, /Over limit\.txt[\s\S]*The path is too long: 401 characters/);
  assert.doesNotMatch(html, /At limit\.txt/);
}

// criticalActions also marks console A's Reset this PC.
function testCriticalMarksResetPc() {
  const tab = security(); tab.open('HD-9701');
  tab.run("hdWinResetPc('TEST-WS-71')");
  assert.deepEqual(tab.critical('HD-9701'), ['machine:pc-reset-chosen']);
  tab.run("hdWinScanNow('TEST-WS-71')");
  assert.deepEqual(tab.critical('HD-9701'), ['machine:pc-reset-chosen'], 'a safe action is never marked');
}

function testChoiceCard() {
  const tab = security();
  let html = tab.open('HD-9702');
  assert.doesNotMatch(html, /data-hd-choice-card/, 'after: hidden until the named action');
  tab.run("hdChoose('HD-9702','right')");
  assert.deepEqual(tab.actions('HD-9702'), [], 'a hidden card takes no choice');
  tab.run("hdWinScanNow('TEST-LT-72')");
  html = tab.open('HD-9702');
  assert.match(html, /<strong>Choose your response<\/strong>/);
  assert.match(html, /data-hd-choice="wrong"[\s\S]*data-hd-choice="bad"[\s\S]*data-hd-choice="right"/);
  tab.run("hdChoose('HD-9702','wrong')");
  html = tab.open('HD-9702');
  assert.match(html, /data-hd-choice-feedback="wrong">TEST: not this one\./);
  assert.match(html, /data-hd-choice="right"/, 'a wrong pick keeps the card open');
  tab.run("hdChoose('HD-9702','bad')");
  assert.deepEqual(tab.critical('HD-9702'), ['choice:bad']);
  assert.match(tab.open('HD-9702'), /<div class="callout bad" role="alert" data-hd-choice-feedback="bad">/);
  tab.run("hdChoose('HD-9702','right')");
  html = tab.open('HD-9702');
  assert.doesNotMatch(html, /data-hd-choice="/, 'the right pick closes the card');
  assert.match(html, /data-hd-choice-feedback="right">TEST: right\./);
  assert.deepEqual(tab.actions('HD-9702'), ['quick-scan', 'test-request-opened']);
  const progress = tab.run("JSON.parse(JSON.stringify(hdConsoleProgress('HD-9702')))");
  assert.deepEqual(progress.choiceTries, ['wrong', 'bad', 'right']);
  assert.equal(progress.choiceDone, true);
  assert.equal(progress.verification.passed, false, 'no caller verification');
  tab.run("hdChoose('HD-9702','wrong')");
  assert.deepEqual(progress.choiceTries.length, 3);
  assert.equal(tab.run("hdChoiceState(hdTicketById('HD-9702')).tries.length"), 3, 'a closed card takes no more tries');
  const log = tab.run("hdState.practiceLog.filter((e) => e.type === 'choice_made').map((e) => e.choice)");
  assert.deepEqual([...log], ['wrong', 'bad', 'right']);
  assert.ok(!tab.run('hdState.practiceLog').some((e) => e.type === 'identity_checked'));
}

// A Prove shift: each screen records its source once, with the computer; the
// pinned action ids are the Prove event's value; nothing warns or undoes;
// a Prove ticket ignores the choice key.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(FULL)});
    shift.tickets.forEach((t) => { t.console = { ...(t.console || {}), choice: ${JSON.stringify({ ...CHOICE, after: undefined })}, undoUnsafe: true, criticalActions: ${JSON.stringify(CRITICAL)} }; }); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m06e#/helpdesk/tickets', before: inject });
  const name = prove.run('HD_PROVE.shift.selectedComputer');
  const j = JSON.stringify;
  prove.select(name);
  const desktop = prove.view('helpdesk/windows');
  for (const screen of NEW_SCREENS) assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen);
  for (const id of prove.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(prove.open(id), /data-hd-choice/, `${id} ignores choice`);
  prove.screen(name, 'windows-security'); prove.screen(name, 'windows-security');
  for (const tab of ['virus-threat', 'protection-history', 'allowed-threats', 'virus-threat']) prove.tab(name, 'windows-security', tab);
  prove.screen(name, 'browser-extensions');
  prove.screen(name, 'onedrive');
  prove.tab(name, 'onedrive', 'sync-problems'); prove.tab(name, 'onedrive', 'web');
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => !s.startsWith('computer:') && !s.startsWith('screen:'));
  assert.deepEqual(opened, ['windows-security', 'windows-security:virus-threat', 'windows-security:protection-history', 'windows-security:allowed-threats', 'browser-extensions', 'onedrive', 'onedrive:sync-problems', 'onedrive:web'].map((s) => s.replace(/^([a-z-]+)/, `$1:${name}`)));
  // Every pinned action, through the screens and the typed lines. A Prove It
  // asks nothing before turning protection off, and asks plainly elsewhere.
  prove.run('globalThis.asked = []; confirm = (text) => { asked.push(text); return true; }');
  prove.run(`hdWinRealtimeSet(${j(name)}, false)`);
  assert.equal(prove.machine(name).protection.realtime, false, 'a Prove It never undoes');
  prove.ps('Add-MpPreference -ExclusionPath C:\\Test');
  assert.deepEqual(prove.machine(name).protection.exclusions, ['C:\\Test']);
  prove.run(`hdWinScanNow(${j(name)}); hdWinThreatSet(${j(name)},'T-100','unallow'); hdWinThreatSet(${j(name)},'T-100','remove'); hdWinRemoveExtension(${j(name)},'Sample Tab Extension')`);
  assert.equal(prove.ps('Start-MpScan -ScanType QuickScan'), '');
  prove.run(`hdWinOneDriveRename(${j(name)}, 0, 'file', 'Test - plan.xlsx'); hdWinOneDriveDelete(${j(name)}, 2); hdWinOneDriveControl(${j(name)},'unlink'); hdWinOneDriveControl(${j(name)},'reset')`);
  const values = [...prove.run("hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => `${e.value}@${e.computer}`)")];
  assert.deepEqual(values, ['realtime-protection-off', 'exclusion-added', 'quick-scan', 'threat-unallowed', 'threat-removed', 'extension-removed', 'quick-scan', 'quick-scan-after-removal', 'onedrive-renamed', 'onedrive-file-deleted', 'onedrive-unlinked', 'onedrive-reset'].map((id) => `${id}@${name}`));
  for (const id of PINNED) assert.ok(values.includes(`${id}@${name}`), `pinned ${id}`);
  assert.deepEqual([...prove.run('asked')], ['Remove "Sample Tab Extension"?', 'Delete Fine.docx?', 'Unlink this PC?', 'Reset OneDrive?']);
  assert.deepEqual(prove.machine(name).processes.map((p) => p.name), ['explorer']);
  const commands = [...prove.run("hdState.prove.events.filter((e) => e.type === 'command_run').map((e) => e.command)")];
  assert.deepEqual(commands, ['Add-MpPreference -ExclusionPath C:\\Test', 'Start-MpScan -ScanType QuickScan']);
  // The typed unsafe line records the same action as the switch.
  prove.run(`hdWinRealtimeSet(${j(name)}, true)`);
  prove.ps('Set-MpPreference -DisableRealtimeMonitoring $true');
  assert.equal([...prove.run("hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => e.value)")].pop(), 'realtime-protection-off');
  // Nothing warns: no undo line, no toast, no Practice log, no Get-Help hint.
  assert.doesNotMatch(prove.tab(name, 'windows-security', 'virus-threat'), /data-hd-unsafe-undone|Never turn off protection/);
  assert.deepEqual([...prove.toasts], []);
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.doesNotMatch(prove.ps('Get-Help'), /Defender: /);
  assert.match(prove.ps('Get-MpComputerStatu'), /outside this training shell/);
}

// A machineTools Prove shift: when one computer has the tools, every
// computer shows them and answers neutrally.
function testProveAllTools() {
  const all = sim({ url: 'https://academy.test/sim/?prove=its-02&student=student-m06f#/helpdesk/tickets',
    before: `{ const m = HD_PROVE_SHIFTS['its-02'].machines; Object.assign(m[Object.keys(m)[0]], ${JSON.stringify(FULL)}); }` });
  assert.equal(all.run('HD_PROVE.shift.machineTools'), true);
  const second = all.run('Object.keys(HD_PROVE.shift.machines)')[1];
  all.select(second);
  const desktop = all.view('helpdesk/windows');
  for (const screen of NEW_SCREENS) assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen);
  for (const screen of NEW_SCREENS) assert.match(all.screen(second, screen), /Nothing to show on this computer/, screen);
  assert.ok(all.run('hdState.prove.opened').includes(`windows-security:${second}`));
  for (const command of DEFENDER) assert.equal(all.ps(command), 'Nothing to show on this computer.', command);
  assert.equal(all.run("hdState.prove.events.filter((e) => e.type === 'action_taken').length"), 0);
}

// The machine state survives a reload with the student's changes.
function testReloadKeepsState() {
  const local = store();
  const tab = security(local);
  tab.open('HD-9701'); tab.select('TEST-WS-71');
  tab.run("hdWinRemoveExtension('TEST-WS-71','Sample Tab Extension'); hdWinOneDriveRename('TEST-WS-71', 0, 'file', 'Test - plan.xlsx')");
  tab.ps('Add-MpPreference -ExclusionPath C:\\Test');
  tab.open('HD-9702'); tab.run("hdWinScanNow('TEST-LT-72'); hdChoose('HD-9702','right')");
  const again = security(local);
  const machine = again.machine('TEST-WS-71');
  assert.deepEqual(machine.extensions.map((e) => e.name), ['Sample Sign In']);
  assert.equal(machine.oneDrive.files[0].name, 'Test - plan.xlsx');
  assert.deepEqual(machine.protection.exclusions, ['C:\\Test']);
  assert.deepEqual(machine.processes.map((p) => p.name), ['testhelper-item', 'testhelper-both', 'explorer']);
  assert.deepEqual(again.actions('HD-9701'), ['extension-removed', 'onedrive-renamed', 'exclusion-added']);
  assert.deepEqual(again.critical('HD-9701'), ['machine:exclusion-added']);
  assert.equal(again.run("hdChoiceState(hdTicketById('HD-9702')).done"), true);
}

const tests = [testOldTicketsTurnNothingOn, testEndpointSecurityAndVerificationUnchanged, testWindowsSecurity, testGoneWhen, testUnsafeRoutes, testUndoUnsafe,
  testDefenderLinesMatchScreen, testExtensions, testOneDrive, testCriticalMarksResetPc, testChoiceCard, testProveShift, testProveAllTools, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m06-console-b: ${tests.length} passed`);

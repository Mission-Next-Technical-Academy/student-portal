'use strict';
/* Help Desk simulator: the software install tools added for Module 6 (key
 * its-07), console A (ui/helpdesk.js "Software install tools"): Installed
 * apps' Repair, Modify and Reset; Settings › Apps › Default apps; Company
 * Portal; the five winget lines; Reset this PC as a recorded choice; and a
 * Convert to Request item whose approval is "Not required".
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-96xx,
 * TEST- computers, 192.0.2.x documentation addresses), never in
 * ui/helpdesk-data.js. No Module 6 content: all text below is a made-up test
 * fixture. Module 5's machines and every older ticket, set and Prove shift
 * must look and answer as before. */
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
  { name: 'TEST-WS-61', user: 'Test User One', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.61', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
  { name: 'TEST-LT-62', user: 'Test User Two', os: 'Windows 11 Enterprise 24H2', ip: '192.0.2.62', trust: 'Healthy', bitlocker: 'Protected', ou: 'OU=Test', health: 'Healthy', lastSeen: 'Now' },
];
// A desk PC with every console A key. "Test Editor++" has "++" in its name
// and Id, so a pattern built from either would fail.
const FULL = {
  installedApps: [
    { name: 'Test Chat', publisher: 'Test Corp', version: '2.0', installed: '1/2/2026', repair: { broken: 'freezes', fixedText: 'Test Chat opens.' }, reset: {} },
    { name: 'Test Zip', publisher: 'Test Zip Project', version: '1.0', installed: '1/3/2026', wingetId: 'TestCo.Zip', upgrade: { version: '1.5' } },
    { name: 'Test Reader', publisher: 'Test Docs Inc.', version: '3.0', installed: '1/4/2026', repair: { via: 'modify', broken: 'crashes on launch' }, upgrade: { version: '3.1', afterRepair: true }, opens: ['.pdf'] },
    { name: 'Test Browser', publisher: 'Test Web', version: '9.0', installed: '1/5/2026', opens: ['.pdf', '.htm'] },
  ],
  catalog: [
    { name: 'Test Editor++', publisher: 'Test Org', wingetId: 'TestOrg.Editor++', version: '8.1' },
    { name: 'Test Zip', publisher: 'Test Zip Project', wingetId: 'TestCo.Zip', version: '1.5' },
    { name: 'Test Reader', publisher: 'Test Docs Inc.', wingetId: 'TestCo.Reader', version: '3.1' },
    { name: 'Test Meeting', publisher: 'Test Meet Inc.', wingetId: 'TestMeet.Meeting', version: '6.0' },
    { name: 'Test Notes', publisher: 'Test Corp' },
  ],
  defaultApps: { '.pdf': 'Test Browser', '.htm': 'Test Browser' },
  companyPortal: true, winget: true, resetPc: true,
};
// A Module 5-style machine: Installed apps, the catalog and Recovery, none of
// the Module 6 keys.
const PLAIN = {
  installedApps: [{ name: 'Test Plain', publisher: 'Test Corp', version: '1.0', installed: '1/2/2026' }],
  catalog: [{ name: 'Test Plain', publisher: 'Test Corp', wingetId: 'TestCo.Plain' }],
  safeMode: false,
};
const SOFTWARE = base({ id: 'HD-9601', number: 'INC0019601', requester: 'Maya Chen', createdAt: at(WED, '09:00'), description: 'TEST software ticket',
  console: { matrix: {}, machines: { 'TEST-WS-61': FULL } } });
const OLDER = base({ id: 'HD-9602', number: 'INC0019602', requester: 'Maya Chen', createdAt: at(WED, '09:05'), description: 'TEST Module 5-style machine',
  console: { matrix: {}, machines: { 'TEST-LT-62': PLAIN } } });
const CONVERT = base({ id: 'HD-9603', number: 'INC0019603', requester: 'Maya Chen', createdAt: at(WED, '09:10'), description: 'TEST install request',
  console: { matrix: {}, convert: { number: 'RITM0019603', items: [
    { name: 'Test item A (catalog app install)', approval: 'Not required (Software Catalog app)' },
    { name: 'Test item B (not in the catalog)', approver: 'A manager' },
  ] } } });
const TICKETS = [SOFTWARE, OLDER, CONVERT];
const SETS = { practice: { 'test-software': { title: 'Test software', tickets: ['HD-9601', 'HD-9602', 'HD-9603'], now: at(WED, '09:20') } } };

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
const software = (local) => sim({ url: 'https://academy.test/sim/?practice=test-software&student=stu-1#/helpdesk/tickets', local });
const apps = (tab) => tab.machine('TEST-WS-61').installedApps;
const app = (tab, name) => apps(tab).find((a) => a.name === name);
const NEW_SCREENS = ['default-apps', 'company-portal'];
const NEW_MARKERS = /data-hd-(app-options|app-advanced|app-modify|default-apps|company-portal|reset-pc)|data-hd-tools="(default-apps|company-portal)"/;
const OUTSIDE = /^The term 'winget[^']*' is outside this training shell\. Type Get-Help for supported commands\.$/;
const WINGET = ['winget search test', 'winget install --id TestCo.Plain -e', 'winget upgrade', 'winget upgrade --id TestCo.Zip -e', 'winget uninstall --id TestCo.Plain -e'];

// Every older ticket, set and Prove shift shows none of the new controls and
// answers winget as before ("outside this training shell").
function testOldTicketsTurnNothingOn() {
  const tab = sim(); const plain = sim({ withTest: false });
  for (const id of tab.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id} shows no new feature`);
  for (const computer of plain.run('HD_COMPUTERS.map((c) => c.name)')) {
    tab.select(computer); plain.select(computer);
    assert.equal(tab.desktop(), plain.desktop(), `${computer} desktop unchanged`);
    assert.doesNotMatch(tab.desktop(), NEW_MARKERS);
    for (const command of WINGET) assert.match(plain.out(command), OUTSIDE, `${computer}: ${command}`);
    assert.doesNotMatch(plain.out('Get-Help'), /winget|Apps: /);
  }
  tab.select('NS-LT-0131');
  for (const route of NEW_SCREENS) assert.match(tab.view(`helpdesk/${route}`), /Not available on this computer/, route);
  // Every older practice and coached set, Module 5's included: no new control
  // on any of its computers, and winget is outside the shell everywhere.
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter((k) => !k.startsWith('test-'))) {
    const set = sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
    for (const name of set.run('Object.keys(hdState.machines)')) {
      set.select(name);
      assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`);
      assert.match(set.out('winget upgrade'), OUTSIDE, `${key} ${name}`);
    }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS'))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    for (const name of set.run('Object.keys(hdState.machines || {})')) {
      set.select(name);
      assert.doesNotMatch(set.view('helpdesk/windows'), NEW_MARKERS, `${key} ${name}`);
      assert.match(set.out('winget install --id TestCo.Plain -e'), OUTSIDE, `${key} ${name}`);
    }
  }
  // Every older Prove shift, Module 5's machineTools shift included.
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS'))) {
    const url = `https://academy.test/sim/?prove=${key}&student=student-m06#/helpdesk/tickets`;
    const prove = sim({ url }); const before = sim({ url, withTest: false });
    for (const name of before.run('hdComputers().map((c) => c.name)')) {
      prove.select(name); before.select(name);
      assert.equal(prove.desktop(), before.desktop(), `prove ${key} ${name} desktop`);
      assert.doesNotMatch(prove.desktop(), NEW_MARKERS, `prove ${key} ${name}`);
      assert.match(prove.out('winget upgrade'), OUTSIDE, `prove ${key} ${name}`);
    }
  }
}

// Module 5's machines, pinned with literals: Installed apps with Uninstall
// only, Reset this PC disabled, no Company Portal, winget outside the shell.
function testModule5MachinesUnchanged() {
  const lab = sim();
  assert.equal(lab.run("hdUseTicketSet('its-03-guided')"), true);
  lab.open('HD-2180'); lab.select('NS-WS-0277');
  const desktop = lab.desktop();
  assert.match(desktop, /data-hd-tools="settings-apps"/);
  assert.doesNotMatch(desktop, NEW_MARKERS);
  const installed = lab.screen('NS-WS-0277', 'settings-apps');
  assert.doesNotMatch(installed, /data-hd-app-options|Advanced options|Modify|>Repair</);
  const rows = [...installed.matchAll(/<tr data-hd-app="[^"]+">[\s\S]*?<\/tr>/g)].map((m) => m[0]);
  assert.ok(rows.length > 0);
  for (const row of rows) assert.match(row, /<td><button type="button" class="btn btn-secondary btn-sm"  onclick="hdWinUninstall\('NS-WS-0277','[^']+'\)">Uninstall<\/button><\/td><\/tr>$/);
  assert.match(lab.out('winget upgrade'), OUTSIDE);
  assert.doesNotMatch(lab.out('Get-Help'), /winget|Apps: /);
  // Module 5's Prove machine (read from the data, not named here).
  const shift = sim({ withTest: false }).run("Object.keys(HD_PROVE_SHIFTS['its-03'].machines)");
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-03&student=student-m06b#/helpdesk/tickets' });
  for (const name of shift) {
    prove.select(name);
    assert.doesNotMatch(prove.desktop(), /data-hd-tools="(company-portal|default-apps)"/, name);
    assert.match(prove.out('winget install --id TestCo.Plain -e'), OUTSIDE, name);
    assert.match(prove.screen(name, 'company-portal'), /Nothing to show on this computer|Not available on this computer/);
  }
  // A Module 5-style test machine: the row is exactly Module 5's, and Reset
  // this PC is disabled.
  const tab = software();
  tab.open('HD-9602');
  assert.match(tab.screen('TEST-LT-62', 'settings-apps'), /<tr data-hd-app="Test Plain"><td>Test Plain<\/td><td>Test Corp<\/td><td>1\.0<\/td><td>1\/2\/2026<\/td><td><button type="button" class="btn btn-secondary btn-sm"  onclick="hdWinUninstall\('TEST-LT-62','Test Plain'\)">Uninstall<\/button><\/td><\/tr>/);
  const recovery = tab.screen('TEST-LT-62', 'settings-recovery');
  assert.match(recovery, /<button type="button" class="btn btn-secondary btn-sm" disabled>Reset PC<\/button> <span class="muted">Reset this PC: choose to keep or remove your personal files, then reinstall Windows · Not available in this training shell\.<\/span>/);
  assert.doesNotMatch(recovery, /data-hd-reset-pc/);
  tab.run("hdWinResetPc('TEST-LT-62')");
  assert.deepEqual(tab.actions('HD-9602'), []);
  tab.select('TEST-LT-62');
  assert.doesNotMatch(tab.desktop(), NEW_MARKERS);
  for (const route of NEW_SCREENS) assert.match(tab.screen('TEST-LT-62', route), /Not available on this computer/, route);
  for (const command of WINGET) assert.match(tab.out(command), OUTSIDE, command);
  assert.doesNotMatch(tab.ps('Get-Help'), /winget|Apps: /);
}

function testRepairModifyReset() {
  const tab = software();
  tab.open('HD-9601');
  let html = tab.screen('TEST-WS-61', 'settings-apps');
  assert.match(html, /data-hd-app="Test Chat">[\s\S]*?data-hd-app-options="Test Chat"[^>]*>Advanced options<\/button> <button[^>]*>Uninstall/);
  assert.match(html, /data-hd-app="Test Reader">[\s\S]*?data-hd-app-options="Test Reader"[^>]*>Modify<\/button>/);
  assert.doesNotMatch(html.split('data-hd-app="Test Zip"')[1].split('</tr>')[0], /data-hd-app-options/, 'no repair or reset: Uninstall only');
  // Advanced options: Repair clears broken, records app-repaired; Reset records app-reset.
  tab.run("hdWinAppOptions('TEST-WS-61','Test Chat')");
  html = tab.view('helpdesk/settings-apps');
  assert.match(html, /data-hd-app-advanced="Test Chat"/);
  assert.match(html, /data-hd-reset-app/);
  assert.doesNotMatch(html, /data-hd-repaired/);
  tab.run("hdWinRepairApp('TEST-WS-61','Test Chat','online')");
  assert.deepEqual(tab.actions('HD-9601'), [], 'Online repair is only on a Modify app');
  tab.run("hdWinRepairApp('TEST-WS-61','Test Chat','repair')");
  assert.equal(app(tab, 'Test Chat').repair.broken, '');
  assert.equal(app(tab, 'Test Chat').repair.repaired, true);
  assert.match(tab.view('helpdesk/settings-apps'), /data-hd-repaired>✓ Test Chat opens\./);
  tab.run('confirm = () => false');
  tab.run("hdWinResetApp('TEST-WS-61','Test Chat')");
  tab.run('confirm = () => true');
  assert.deepEqual(tab.actions('HD-9601'), ['app-repaired'], 'a refused confirm resets nothing');
  tab.run("hdWinResetApp('TEST-WS-61','Test Chat')");
  assert.deepEqual(tab.actions('HD-9601'), ['app-repaired', 'app-reset']);
  const repaired = tab.log().find((e) => e.action === 'app-repaired');
  assert.equal(repaired.app, 'Test Chat'); assert.equal(repaired.mode, 'repair'); assert.equal(repaired.wasBroken, true); assert.equal(repaired.computer, 'TEST-WS-61');
  // Modify: Repair or Online repair, the same action; it reveals an afterRepair upgrade.
  assert.doesNotMatch(tab.ps('winget upgrade'), /TestCo\.Reader/, 'the afterRepair upgrade waits for the repair');
  assert.match(tab.ps('winget upgrade --id TestCo.Reader -e'), /^No available upgrade found\./);
  tab.run("hdWinAppOptions('TEST-WS-61','Test Reader')");
  html = tab.view('helpdesk/settings-apps');
  assert.match(html, /data-hd-app-modify="Test Reader"[\s\S]*data-hd-repair="repair"[\s\S]*data-hd-repair="online"/);
  tab.run("hdWinRepairApp('TEST-WS-61','Test Reader','online')");
  assert.equal(app(tab, 'Test Reader').repair.broken, '');
  assert.equal(tab.log().filter((e) => e.action === 'app-repaired').pop().mode, 'online');
  assert.match(tab.ps('winget upgrade'), /Test Reader\s+TestCo\.Reader\s+3\.0\s+3\.1\s+winget/);
  // Reset is not offered on an app without reset.
  tab.run("hdWinResetApp('TEST-WS-61','Test Reader')");
  assert.equal(tab.actions('HD-9601').filter((id) => id === 'app-reset').length, 1);
  // The panel toggles closed.
  tab.run("hdWinAppOptions('TEST-WS-61','Test Reader')");
  assert.doesNotMatch(tab.view('helpdesk/settings-apps'), /data-hd-app-modify/);
}

function testDefaultApps() {
  const tab = software();
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  assert.match(tab.desktop(), /data-hd-tools="default-apps"/);
  let html = tab.screen('TEST-WS-61', 'default-apps');
  assert.match(html, /data-hd-default="\.htm">[\s\S]*?data-hd-default="\.pdf">/, 'sorted by type');
  const pdf = html.split('data-hd-default=".pdf"')[1].split('</tr>')[0];
  assert.match(pdf, /data-hd-default-app>Test Browser</);
  assert.deepEqual([...pdf.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map((m) => m[1]), ['Test Browser', 'Test Reader']);
  // An app that can't open the type, and the same app again, change nothing.
  tab.run("hdWinSetDefault('TEST-WS-61','.pdf','Test Zip'); hdWinSetDefault('TEST-WS-61','.pdf','Test Browser'); hdWinSetDefault('TEST-WS-61','.doc','Test Reader')");
  assert.deepEqual(tab.actions('HD-9601'), []);
  // The list only records on Set default (no onchange), from the row's select.
  assert.doesNotMatch(pdf, /onchange/);
  const selectId = /<select id="([^"]+)"/.exec(pdf)[1];
  assert.match(pdf, new RegExp(`data-hd-default-set="\\.pdf" onclick="hdWinSetDefaultFrom\\('TEST-WS-61','\\.pdf','${selectId}'\\)">Set default`));
  tab.input(selectId, 'Test Reader');
  tab.run(`hdWinSetDefaultFrom('TEST-WS-61','.pdf','${selectId}')`);
  assert.equal(tab.machine('TEST-WS-61').defaultApps['.pdf'], 'Test Reader');
  assert.deepEqual(tab.actions('HD-9601'), ['default-app-set']);
  const event = tab.log().find((e) => e.action === 'default-app-set');
  // fileType, not type: the Practice log event keeps its own type.
  assert.equal(event.type, 'action_taken'); assert.equal(event.fileType, '.pdf'); assert.equal(event.app, 'Test Reader');
  assert.equal(tab.run("hdTicketById('HD-9601').consoleState.actions[0].fileType"), '.pdf');
  html = tab.view('helpdesk/default-apps');
  assert.match(html.split('data-hd-default=".pdf"')[1], /data-hd-default-app>Test Reader</);
  assert.equal(tab.machine('TEST-WS-61').seen.includes('default-apps'), true);
  // A type with no default: a disabled "Choose…" first, so the first app can be set.
  const empty = sim({ url: 'https://academy.test/sim/?practice=test-software&student=stu-4#/helpdesk/tickets',
    before: "HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9601').console.machines['TEST-WS-61'].defaultApps['.pdf'] = '';" });
  empty.open('HD-9601');
  const row = empty.screen('TEST-WS-61', 'default-apps').split('data-hd-default=".pdf"')[1].split('</tr>')[0];
  assert.match(row, /data-hd-default-app>Choose a default</);
  assert.match(row, /<option value="" selected disabled>Choose…<\/option><option >Test Browser<\/option><option >Test Reader<\/option>/);
  empty.run("hdWinSetDefault('TEST-WS-61','.pdf','Test Browser')");
  assert.deepEqual(empty.actions('HD-9601'), ['default-app-set']);
}

function testCompanyPortal() {
  const tab = software();
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  assert.match(tab.desktop(), /data-hd-tools="company-portal"/);
  let html = tab.screen('TEST-WS-61', 'company-portal');
  assert.match(html, /no admin password/);
  assert.match(html, /data-hd-portal-app="Test Zip">[\s\S]*?data-hd-portal-installed>Installed</);
  assert.match(html, /data-hd-portal-app="Test Notes"><td>Test Notes<\/td><td>Test Corp<\/td><td>Latest<\/td><td><button[^>]*data-hd-portal-install/);
  tab.run("hdWinPortalInstall('TEST-WS-61','Test Meeting')");
  const added = app(tab, 'Test Meeting');
  assert.deepEqual(added, { name: 'Test Meeting', publisher: 'Test Meet Inc.', version: '6.0', installed: 'Today', wingetId: 'TestMeet.Meeting' });
  assert.deepEqual(tab.actions('HD-9601'), ['app-installed']);
  assert.equal(tab.log().find((e) => e.action === 'app-installed').app, 'Test Meeting');
  // Installed shows; a second install or an app not in the catalog does nothing.
  tab.run("hdWinPortalInstall('TEST-WS-61','Test Meeting'); hdWinPortalInstall('TEST-WS-61','Not Listed')");
  assert.deepEqual(tab.actions('HD-9601'), ['app-installed']);
  html = tab.view('helpdesk/company-portal');
  assert.match(html, /data-hd-portal-app="Test Meeting">[\s\S]*?data-hd-portal-installed>Installed</);
  assert.match(tab.view('helpdesk/settings-apps'), /data-hd-app="Test Meeting">/);
  // Search filters the list.
  tab.input('hd-portal-q', 'meet');
  tab.run("hdWinCatalogFilter({ preventDefault() {} }, 'TEST-WS-61', 'hd-portal-q')");
  assert.match(tab.view('helpdesk/company-portal'), /1 of 5 shown/);
  // The Software Catalog screen still reads the same list, read-only.
  const catalog = tab.screen('TEST-WS-61', 'software-catalog');
  assert.match(catalog, /data-hd-catalog-app="Test Editor\+\+"><td>Test Editor\+\+<\/td><td>Test Org<\/td><td>8\.1<\/td><td><\/td><\/tr>/);
  assert.doesNotMatch(catalog.split('data-hd-catalog>')[1], /<button/);
}

function testWingetLines() {
  const tab = software();
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  assert.match(tab.ps('Get-Help'), /\nApps: winget search <name>, winget install --id <ID> -e, winget upgrade, winget upgrade --id <ID> -e, winget uninstall --id <ID> -e/);
  // Search: any case; a name with "++"; only catalog entries with an Id.
  const found = tab.ps('WINGET SEARCH editor++').split('\n');
  assert.match(found[0], /^Name\s+Id\s+Version\s+Source$/);
  assert.match(found[2], /^Test Editor\+\+\s+TestOrg\.Editor\+\+\s+8\.1\s+winget$/);
  assert.equal(found.length, 3);
  assert.match(tab.ps('winget search notes'), /^No package found matching input criteria\.\nApps outside the Software Catalog need a software request\.$/);
  // Install: the exact Id, extra valid options, any case; same action as Company Portal.
  assert.match(tab.ps('winget install --id testorg.editor++ -e --accept-package-agreements --accept-source-agreements'), /^Found Test Editor\+\+ \[TestOrg\.Editor\+\+\] Version 8\.1[\s\S]*Successfully installed$/);
  assert.deepEqual(app(tab, 'Test Editor++'), { name: 'Test Editor++', publisher: 'Test Org', version: '8.1', installed: 'Today', wingetId: 'TestOrg.Editor++' });
  assert.deepEqual(tab.actions('HD-9601'), ['app-installed']);
  assert.deepEqual(Object.keys(tab.log().find((e) => e.action === 'app-installed')).filter((k) => !['at', 'time', 'type', 'label', 'student', 'mode'].includes(k)).sort(), ['action', 'app', 'computer', 'ticket']);
  assert.match(tab.ps('winget install --id TestOrg.Editor++ -e'), /^Found an existing package already installed/);
  assert.deepEqual(tab.actions('HD-9601'), ['app-installed']);
  // Outside the catalog: winget's line, and in Practice the software-request line.
  assert.equal(tab.ps('winget install --id Other.FreeTool -e'), 'No package found matching input criteria.\nApps outside the Software Catalog need a software request.');
  assert.equal(tab.ps('winget install "Free Tool"'), 'No package found matching input criteria.\nApps outside the Software Catalog need a software request.');
  // Upgrade lists the waiting upgrade (not the afterRepair one); upgrade --id clears it.
  const list = tab.ps('winget upgrade');
  assert.match(list, /Test Zip\s+TestCo\.Zip\s+1\.0\s+1\.5\s+winget/);
  assert.doesNotMatch(list, /TestCo\.Reader/);
  assert.match(list, /\n1 upgrade available\.$/);
  assert.match(tab.ps('Winget Upgrade --ID TestCo.Zip --exact'), /^Found Test Zip \[TestCo\.Zip\] Version 1\.5[\s\S]*Successfully installed$/);
  assert.equal(app(tab, 'Test Zip').version, '1.5');
  assert.equal(tab.ps('winget upgrade'), 'No installed package found matching input criteria.');
  const upgraded = tab.log().find((e) => e.action === 'app-upgraded');
  assert.equal(upgraded.app, 'Test Zip'); assert.equal(upgraded.from, '1.0'); assert.equal(upgraded.to, '1.5');
  assert.match(tab.ps('winget upgrade --id TestCo.Zip -e'), /^No available upgrade found\./);
  // Uninstall: by Id, and by name for an app with no Id; same action as the screen.
  assert.match(tab.ps('winget uninstall --id TestOrg.Editor++ -e'), /^Found Test Editor\+\+ \[TestOrg\.Editor\+\+\]\nStarting package uninstall\.\.\.\nSuccessfully uninstalled$/);
  assert.equal(app(tab, 'Test Editor++'), undefined);
  assert.match(tab.view('helpdesk/settings-apps'), /4 apps found/);
  assert.match(tab.ps('winget uninstall --name "Test Browser" -e'), /Successfully uninstalled$/);
  assert.equal(tab.ps('winget uninstall --id TestOrg.Editor++ -e'), 'No installed package found matching input criteria.');
  assert.deepEqual(tab.actions('HD-9601'), ['app-installed', 'app-upgraded', 'app-uninstalled', 'app-uninstalled']);
  assert.deepEqual(tab.log().filter((e) => e.action === 'app-uninstalled').map((e) => e.app), ['Test Editor++', 'Test Browser']);
  // A partial query that matches more than one package asks to refine.
  assert.match(tab.ps('winget install test'), /^Multiple packages found matching input criteria\./);
  // Each line is a command_run event with the computer and a result.
  const runs = tab.log().filter((e) => e.type === 'command_run' && /^winget/i.test(e.command));
  assert.ok(runs.length >= 12 && runs.every((e) => e.computer === 'TEST-WS-61'));
  assert.ok(runs.some((e) => /no package found/.test(e.result)) && runs.some((e) => /installed Test Editor\+\+/.test(e.result)));
}

// Misspellings: a Practice hint that shows the right line; Prove's plain error.
function testWingetMistakes() {
  const tab = software();
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  assert.equal(tab.ps('wingt upgrade'), "The term 'wingt' is not recognized. Did you mean: winget search <name>, winget install --id <ID> -e, winget upgrade, winget upgrade --id <ID> -e, winget uninstall --id <ID> -e");
  assert.match(tab.ps('winget instal --id TestCo.Zip -e'), /^Unrecognized command: 'instal'\nDid you mean: winget search <name>/);
  assert.match(tab.ps('winget install --idd TestCo.Zip -e'), /^Argument name was not recognized for the current command: '--idd'\nDid you mean:/);
  assert.match(tab.ps('winget install --id'), /^Argument value missing: '--id'\nDid you mean: winget install --id <ID> -e$/);
  assert.match(tab.ps('winget list'), /^winget list isn't part of this training shell\.\nSupported here: winget search <name>/);
  assert.equal(tab.ps('winget'), 'Windows Package Manager\nUsage: winget <command> [<options>]\nSupported here: winget search <name>, winget install --id <ID> -e, winget upgrade, winget upgrade --id <ID> -e, winget uninstall --id <ID> -e');
  assert.deepEqual(tab.actions('HD-9601'), []);
}

function testResetThisPc() {
  const tab = software();
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  assert.match(tab.desktop(), /data-hd-tools="settings-recovery"/, 'resetPc turns Recovery on without safeMode');
  const before = tab.machine('TEST-WS-61');
  const html = tab.screen('TEST-WS-61', 'settings-recovery');
  assert.match(html, /data-hd-reset-pc onclick="hdWinResetPc\('TEST-WS-61'\)">Reset PC<\/button>/);
  tab.run('confirm = () => false'); tab.run("hdWinResetPc('TEST-WS-61')"); tab.run('confirm = () => true');
  assert.deepEqual(tab.actions('HD-9601'), []);
  tab.run("hdWinResetPc('TEST-WS-61')");
  assert.deepEqual(tab.actions('HD-9601'), ['pc-reset-chosen']);
  assert.ok(tab.toasts.some((t) => /^Reset this PC recorded as your choice\./.test(t)), 'Practice says the choice was recorded');
  const after = tab.machine('TEST-WS-61');
  const strip = (m) => { const { seen, seenAt, ...rest } = m; return rest; };
  assert.deepEqual(strip(after), strip(before), 'nothing else changes');
  // Troubleshoot › Reset this PC is the same recorded choice.
  tab.run("hdWinRecoveryGo('TEST-WS-61','choose'); hdWinRecoveryGo('TEST-WS-61','troubleshoot')");
  assert.match(tab.view('helpdesk/settings-recovery'), /data-hd-reset-pc onclick="hdWinResetPc\('TEST-WS-61'\)">Reset this PC<\/button>/);
}

// Convert to Request: an item whose approval is "Not required" saves with
// that text and can be closed; a plain item still waits for approval.
function testConvertCatalogItems() {
  const tab = software();
  let html = tab.open('HD-9603');
  assert.match(html, /<option >Test item A \(catalog app install\)<\/option><option >Test item B \(not in the catalog\)<\/option>/);
  tab.run("hdConvertSet('HD-9603','item','Test item A (catalog app install)'); hdConvertToRequest('HD-9603')");
  let ticket = tab.run("JSON.parse(JSON.stringify(hdTicketById('HD-9603')))");
  assert.equal(ticket.request.number, 'RITM0019603');
  assert.equal(ticket.request.approval, 'Not required (Software Catalog app)');
  assert.equal(ticket.request.requestedFor, 'Maya Chen');
  assert.equal(ticket.closureCode, 'Canceled – Converted');
  html = tab.open('HD-9603');
  assert.match(html, /Approval: Not required \(Software Catalog app\)/);
  assert.doesNotMatch(html.split('Requested item RITM0019603')[1].split('</div></div>')[0], /disabled style/);
  tab.run("hdRequestClose('HD-9603')");
  assert.equal(tab.run("hdTicketById('HD-9603').request.state"), 'Closed Complete');
  assert.equal(tab.run("hdRequestApproved(hdTicketById('HD-9603'))"), true);
  // hdRequestApprove leaves the "Not required" text as it is.
  tab.run("hdRequestApprove(hdTicketById('HD-9603'))");
  assert.equal(tab.run("hdTicketById('HD-9603').request.approval"), 'Not required (Software Catalog app)');
  // The other item: Requested until approved, as Module 2's items are.
  const other = software();
  other.open('HD-9603');
  other.run("hdConvertSet('HD-9603','item','Test item B (not in the catalog)'); hdConvertToRequest('HD-9603')");
  ticket = other.run("JSON.parse(JSON.stringify(hdTicketById('HD-9603')))");
  assert.equal(ticket.request.approval, 'Requested'); assert.equal(ticket.request.approver, 'A manager');
  other.run("hdRequestClose('HD-9603')");
  assert.equal(other.run("hdTicketById('HD-9603').request.state"), 'Open');
  assert.ok(other.toasts.some((t) => /can't be closed before it is approved/.test(t)));
  other.run("hdRequestApprove(hdTicketById('HD-9603'))");
  assert.equal(other.run("hdTicketById('HD-9603').request.approval"), 'Approved');
}

// A Prove shift: each new screen records its source once, with the computer;
// changes are Prove events; no Practice-only lines.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(FULL)}); }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m06c#/helpdesk/tickets', before: inject });
  const name = prove.run('HD_PROVE.shift.selectedComputer');
  const j = JSON.stringify;
  prove.select(name);
  const desktop = prove.view('helpdesk/windows');
  for (const screen of NEW_SCREENS) assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen);
  prove.screen(name, 'default-apps'); prove.screen(name, 'default-apps');
  prove.screen(name, 'company-portal'); prove.screen(name, 'company-portal');
  prove.screen(name, 'settings-apps');
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => !s.startsWith('computer:') && !s.startsWith('screen:'));
  assert.deepEqual(opened, [`default-apps:${name}`, `company-portal:${name}`, `installed-apps:${name}`]);
  prove.run(`hdWinPortalInstall(${j(name)},'Test Meeting'); hdWinRepairApp(${j(name)},'Test Chat','repair'); hdWinSetDefault(${j(name)},'.pdf','Test Reader'); hdWinResetPc(${j(name)})`);
  assert.equal(prove.ps('winget install --id TestOrg.Editor++ -e').split('\n').pop(), 'Successfully installed');
  prove.ps('winget upgrade --id TestCo.Zip -e');
  prove.ps('winget uninstall --id TestOrg.Editor++ -e');
  const actions = [...prove.run("hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => `${e.value}@${e.computer}`)")];
  assert.deepEqual(actions, ['app-installed', 'app-repaired', 'default-app-set', 'pc-reset-chosen', 'app-installed', 'app-upgraded', 'app-uninstalled'].map((id) => `${id}@${name}`));
  const commands = [...prove.run("hdState.prove.events.filter((e) => e.type === 'command_run').map((e) => e.command)")];
  assert.deepEqual(commands, ['winget install --id TestOrg.Editor++ -e', 'winget upgrade --id TestCo.Zip -e', 'winget uninstall --id TestOrg.Editor++ -e']);
  // No Practice-only lines in a Prove It.
  assert.equal(prove.ps('winget install --id Other.FreeTool -e'), 'No package found matching input criteria.');
  assert.equal(prove.ps('winget instal --id TestCo.Zip -e'), "Unrecognized command: 'instal'");
  assert.match(prove.ps('wingt upgrade'), /outside this training shell/);
  // The supported lines and the admin-password line are Practice help only.
  assert.equal(prove.ps('winget'), 'Windows Package Manager\nUsage: winget <command> [<options>]');
  assert.equal(prove.ps('winget list'), "winget list isn't part of this training shell.");
  const portal = prove.screen(name, 'company-portal');
  assert.match(portal, /Apps from the Software Catalog\./);
  assert.doesNotMatch(portal, /admin password/);
  assert.doesNotMatch(prove.ps('Get-Help'), /winget|Apps: /);
  assert.equal(prove.run('hdState.practiceLog'), undefined);
  assert.deepEqual([...prove.toasts], []);
}

// A machineTools Prove shift: when one computer has winget or Company
// Portal, every computer shows and answers them, neutrally.
function testProveAllTools() {
  const all = sim({ url: 'https://academy.test/sim/?prove=its-02&student=student-m06d#/helpdesk/tickets',
    before: `{ const m = HD_PROVE_SHIFTS['its-02'].machines; Object.assign(m[Object.keys(m)[0]], ${JSON.stringify(FULL)}); }` });
  assert.equal(all.run('HD_PROVE.shift.machineTools'), true);
  const second = all.run('Object.keys(HD_PROVE.shift.machines)')[1];
  all.select(second);
  const desktop = all.view('helpdesk/windows');
  for (const screen of NEW_SCREENS) assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen);
  for (const screen of NEW_SCREENS) assert.match(all.screen(second, screen), /Nothing to show on this computer/, screen);
  assert.ok(all.run('hdState.prove.opened').includes(`company-portal:${second}`));
  assert.equal(all.ps('winget upgrade'), 'No installed package found matching input criteria.');
}

// The machine state survives a reload with the student's changes.
function testReloadKeepsState() {
  const local = store();
  const tab = software(local);
  tab.open('HD-9601'); tab.select('TEST-WS-61');
  tab.ps('winget install --id TestMeet.Meeting -e');
  tab.run("hdWinRepairApp('TEST-WS-61','Test Chat','repair'); hdWinSetDefault('TEST-WS-61','.pdf','Test Reader')");
  const again = software(local);
  const machine = again.machine('TEST-WS-61');
  assert.ok(machine.installedApps.some((a) => a.name === 'Test Meeting'));
  assert.equal(machine.installedApps.find((a) => a.name === 'Test Chat').repair.repaired, true);
  assert.equal(machine.defaultApps['.pdf'], 'Test Reader');
  assert.deepEqual(again.actions('HD-9601'), ['app-installed', 'app-repaired', 'default-app-set']);
}

const tests = [testOldTicketsTurnNothingOn, testModule5MachinesUnchanged, testRepairModifyReset, testDefaultApps, testCompanyPortal,
  testWingetLines, testWingetMistakes, testResetThisPc, testConvertCatalogItems, testProveShift, testProveAllTools, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m06-console-a: ${tests.length} passed`);

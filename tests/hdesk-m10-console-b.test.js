'use strict';
/* Help Desk simulator: Module 10 (key its-08), console B (ui/helpdesk.js
 * "Module 10 (console B)"): Settings › System › Sound, a display's
 * resolution and a room projector on Dock and displays, Services on a
 * workstation (with Get-Service and Start-Service), Windows Search's indexer
 * in Outlook › Search Tools › Indexing Status and Settings › Privacy &
 * security › Searching Windows, and Outlook on the web.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-99xx,
 * TEST- names), never in ui/helpdesk-data.js. No Module 10 content. Every
 * older shift must look and answer as before: the Windows Desktop, Dock and
 * displays, the Remote Support screen and the typed service lines are pinned
 * against the branch this part starts from. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
// --print-pins=<git ref> computes the pins on another commit's helpdesk.js.
const pinArg = process.argv.find((arg) => arg.startsWith('--print-pins'));
const baseRef = pinArg && pinArg.includes('=') ? pinArg.split('=')[1] : '';
const helpdeskSource = baseRef ? require('node:child_process').execFileSync('git', ['show', `${baseRef}:ui/helpdesk.js`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) : read('helpdesk.js');
const sha = (text) => crypto.createHash('sha256').update(String(text)).digest('hex');
const FIXED = Date.parse('2026-08-20T08:40:00Z');
class FixedDate extends Date {
  constructor(...args) { if (args.length) super(...args); else super(FIXED); }
  static now() { return FIXED; }
  toLocaleString() { return this.toISOString(); }
  toLocaleDateString() { return this.toISOString().slice(0, 10); }
  toLocaleTimeString() { return this.toISOString().slice(11, 16); }
}
function seededMath() {
  let seed = 11;
  const math = Object.create(Math);
  math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return math;
}
const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true } = {}) {
  const u = new URL(url);
  const toasts = [];
  const fields = {};
  const ctx = {
    console, URL, URLSearchParams, JSON, Math: seededMath(), Date: FixedDate,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => (Object.prototype.hasOwnProperty.call(fields, id) ? { value: fields[id] } : null), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: store(), sessionStorage: store(),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('helpdesk-data.js'), ctx, { filename: 'helpdesk-data.js' });
  if (withTest) addTestData(ctx);
  vm.runInContext(helpdeskSource, ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const type = (id, value, code) => { fields[id] = value; try { return run(code); } finally { delete fields[id]; } };
  return {
    ctx, toasts, run, type,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    shell: (command) => type('hd-ps-input', command, 'hdRunPowerShell({ preventDefault() {} })'),
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}; hdState.machineView = { computer:${j(computer)} }`),
    screen: (computer, screen) => run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)})`),
  };
}
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m10b#/helpdesk/tickets`;

/* ---------- The starting branch's output, pinned ----------
 * Every older shift (the shared queue, each practice set, each coached set
 * and each Prove shift): on the shift's own computer and every computer with
 * machine state, the Windows Desktop, Dock and displays, Settings › Network
 * and the Remote Support screen, and every typed line below in order with
 * the machine state after each. Computed on hdesk/m10-remote-sessions at
 * 7fd0a99 with
 * `node tests/hdesk-m10-console-b.test.js --print-pins=origin/hdesk/m10-remote-sessions`. */
const PIN_COMMANDS = [
  'Get-Service', 'Get-Service WSearch', 'Get-Service -Name WSearch', 'Start-Service WSearch', 'Start-Service -Name WSearch',
  'Get-Service Spooler', 'Stop-Service Spooler', 'Start-Service Spooler', 'Get-Service -ComputerName NS-PRINT01 -Name Spooler', 'Get-Help',
];
const PIN_ROUTES = ['helpdesk/windows', 'helpdesk/dock', 'helpdesk/settings-network', 'helpdesk/remote-support'];
// The machine screens on the starting branch (HD_MACHINE_SCREENS there).
const PIN_SCREENS = ['print-queue', 'printer-properties', 'device-manager', 'camera', 'dock', 'settings-network', 'pc-task-manager', 'settings-storage', 'settings-update',
  'settings-apps', 'software-catalog', 'reliability', 'settings-recovery', 'default-apps', 'company-portal', 'windows-security', 'browser-extensions', 'onedrive',
  'credential-manager', 'settings-about', 'vpn-client'];
// Module 10's own sets and shift, added by later parts, turn these on.
const MODULE_10_SETS = ['its-08', 'its-08-guided'];
function shiftsOf(plain) {
  const shifts = [{ name: 'shared', make: () => sim({ withTest: false }) }];
  Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_10_SETS.includes(k)).forEach((key) => shifts.push({ name: `practice:${key}`, make: () => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, withTest: false }) }));
  Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_10_SETS.includes(k)).forEach((key) => shifts.push({ name: `coached:${key}`, make: () => { const tab = sim({ withTest: false }); assert.equal(tab.run(`hdUseTicketSet(${JSON.stringify(key)})`), true); return tab; } }));
  Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !MODULE_10_SETS.includes(k)).forEach((key) => shifts.push({ name: `prove:${key}`, make: () => sim({ url: proveUrl(key), withTest: false }) }));
  return shifts;
}
function pinsOf(make) {
  const first = make();
  const home = first.run('hdState.selectedComputer');
  const computers = [...new Set([home, ...first.run('Object.keys(hdState.machines || {})')])];
  const state = (tab) => tab.run('JSON.stringify([hdState.machines || {}, hdState.tickets.map((t) => [t.troubleshootingHistory, t.consoleState || null]), hdState.prove || null, hdState.practiceLog || []])');
  const screens = [];
  const commands = [];
  for (const computer of computers) {
    const tab = make();
    tab.on(computer);
    for (const route of PIN_ROUTES) screens.push(sha(tab.view(route)));
    // Opening each older machine screen records the same Prove source and seen key.
    for (const screen of PIN_SCREENS) { tab.screen(computer, screen); screens.push(sha(tab.ctx.location.hash)); commands.push(sha(state(tab))); }
    for (const command of PIN_COMMANDS) { commands.push(sha(tab.ps(command))); commands.push(sha(state(tab))); }
    tab.shell('Get-Service WSearch');
    screens.push(sha(tab.view('helpdesk/powershell')));
    commands.push(sha(state(tab)));
  }
  return { screens: sha(screens.join(',')), commands: sha(commands.join(',')) };
}
if (pinArg) {
  const plain = sim({ withTest: false });
  const pins = {};
  for (const shift of shiftsOf(plain)) pins[shift.name] = pinsOf(shift.make);
  console.log(JSON.stringify(pins, null, 1));
  process.exit(0);
}
const PINNED = {
  // shared.commands re-pinned 2026-11-27 by Module 10's sim part: HD-2110 and
  // HD-2111 left the shared shift (ownSet), so the saved ticket list after each
  // line is two shorter. Every screen hash and every other shift is unchanged.
  shared: { screens: '94b30075b2817eab88d56c87cb37f2e9dc2523289c03934f5b1cf5f4527981b0', commands: '13406254b48e3e8325a59d0bb191d1994525cbb18888e93cbba85e29b105a6ea' },
  'practice:its-01': { screens: '94b30075b2817eab88d56c87cb37f2e9dc2523289c03934f5b1cf5f4527981b0', commands: '7a3be893e76706c3fe53a9639fc66e8cb33b011197a522dbf198864784c98484' },
  'practice:its-10': { screens: '36951b6bb17aa2bd222ed356490be9fb3c85ded96623fed49ca41276ce6d3150', commands: '98a971e8848558784333866a2d9cf63bdb2d60351b64f33e73e0d3c82c5218b7' },
  'practice:its-11': { screens: '36951b6bb17aa2bd222ed356490be9fb3c85ded96623fed49ca41276ce6d3150', commands: '73851ed936caad37f11c303811fc2b02ceacd0f6204b3f2a998c9dea65e6e7c0' },
  'practice:its-02': { screens: '54de99ebf48fbab34f019b97c9ac9a779d963d1460fb9442a25ba45ef40e76db', commands: 'cc09b67918587afdf9a65fe909b384ed5ed526752f8b2bce3e3760d22989c2a9' },
  'practice:its-03': { screens: '053b0f8d8df0f78096a9bcc9d563b0fda87401f12f643c7da76152f5faac732d', commands: 'f245e6eab26670d645e21bf1a4015742aa98a71e32d2486599565af3c9286410' },
  'practice:its-07': { screens: 'e6acf26705813b3e8ee5afe38c4e6732b068ba3ee005b8e990db271703e0638e', commands: '99272e55ee5754aed1350e0bab52f8370cbb3d7b09393d60c70a191f3936d62b' },
  'practice:its-05': { screens: '66c9f15a4e0b7efbe62116054d8c951c0be21541bf46c0704fbc6eca256223f9', commands: '83bdac02e3a64e9baca01beaacc70cff1e7f159e72816e5d7bb7a6ee4e579811' },
  'practice:its-06': { screens: 'fa65dd2ea46ee3ea599baccf0c76c79af41c6b15e4202ebf85c4d75624ebbe5a', commands: '9e7bc3336b65e87afd42322e6532209aa897715d2e0a5efd663f1fa6a4832861' },
  'practice:its-04': { screens: '784dc783809ef59778cb12a18005f59b986ff23bf779cdfc3ebd0276c8c98936', commands: '04110951b6f84424f360f00a8da46156f1ca528f9aaf75c5ee9cc78cf5e15b76' },
  'coached:its-10-guided': { screens: '36951b6bb17aa2bd222ed356490be9fb3c85ded96623fed49ca41276ce6d3150', commands: '9622c57340dc8a04c5ed3297cc885857c2ed27922d34fd061a261adcfa84d6b3' },
  'coached:its-11-guided': { screens: '36951b6bb17aa2bd222ed356490be9fb3c85ded96623fed49ca41276ce6d3150', commands: '00bad60f112a36d8fdeb0e003ec4871d67239f2645f6b50092fa459563874559' },
  'coached:its-02-guided': { screens: 'f9deff901a693b9bca61061d48254f0d957837ef14e72493dfe6693120fe3da1', commands: '08306f00d9f0cdd844322d27455e6a8a34b9f19effcc6a38475f0a3795ea8de5' },
  'coached:its-02-server': { screens: '36951b6bb17aa2bd222ed356490be9fb3c85ded96623fed49ca41276ce6d3150', commands: '00bad60f112a36d8fdeb0e003ec4871d67239f2645f6b50092fa459563874559' },
  'coached:its-03-guided': { screens: '9e1ee8d6818cdd86f34bc325fffffe08e4ae03418bd83506cbfb08b53e36b547', commands: '3ac4033bf98a47250b59a790cdc02e4ce2e570b46227fec70effcf0055f7378c' },
  'coached:its-07-guided': { screens: '9212849820cf597710796e8f4356ef4d846ba2c9733b5f39d3e95bbdab8d7f04', commands: 'ef923f6afb9aa01cb65b10ffa77e76b6bdc27ffa687a9a8ad518a85f3b39074f' },
  'coached:its-05-guided': { screens: 'dc9a5a0368013d57452930b7a5649e84bd10a3b230617b11a36694e1c1d9a2c1', commands: '6d07ce82f4e49efbfeb6b9e8dc2cef43b55de33fcdb1561edb7dc22ce3ce3381' },
  'coached:its-06-guided': { screens: 'c2a739d4104234125395cb6a55fb70fb29fb579e4bcbbefdfe180584c81ed733', commands: 'b770a0fe02a62ccf3d7157f0c44024b0e864b3d622c31a52db17d0d635eb9ec8' },
  'coached:its-06-extension': { screens: '783092b9fcda0af7069fdaa66db710c6be9ce821eb748eb37c28a982fe333c80', commands: '2e22a7a9580102848411fe46969a4289bd8860f083bb0c2d3f345494cb00734e' },
  'coached:its-04-guided': { screens: '7132dc5d62e0b7ac74704cacf2a71aed288a2bb8a110668a5f79822eb4487ee7', commands: 'daf9d63962e4b3f3c9da814bb8c0e18e891474b684b357a83c56fbe44bc9ac86' },
  'prove:its-01': { screens: '33311c3bedf75ce9ac44b2f45f21f76651e1f8fa1904c00a28d0859d7b8719c5', commands: 'f512e41c0cf02f5439afb5b5fcf0efc764f5f8355a4fc9d20f888a1231394b41' },
  'prove:its-10': { screens: '9e4c27dfb09745f3d14104ef2223bda15c6c2ab3a09acfcbe9c286bb00934eaa', commands: '3514ddd201bb30a5566e71915cae7969c561145813cfc13f1fd7207e8d3f4af2' },
  'prove:its-11': { screens: '9a612e02669ef3607592182ffb78f4f084e2835b4b1e684748b8c5e9126d39b4', commands: '050ab7d7b43d513e46f72a5d69eddaac107e3a08aaabadf1435a2098f1fe15b0' },
  'prove:its-02': { screens: 'f82aba44237e9a175b1fc047aa144b0df2e20b391e552b3b9e7de18b39a8643d', commands: '0499a47c1e7815a13fb6c7fb8d27d955ed90eeae7b93fab0d62e3a2341e4382b' },
  'prove:its-03': { screens: '07e8b22b420291d24457cc086dc4165ddd4dcadadb3e60068dc20895186da32d', commands: '18cae90fc5995f5228f6378c779d1f04cf264d938103dacd614b8ea08279694d' },
  'prove:its-07': { screens: '000a5240f7019c3cd176d72510c42a4ebf08034ece9a972f1785d57585233125', commands: '583f24c0955e61bec394869171b74fa29ffc1857134f89437cd58f16db769fa9' },
  'prove:its-05': { screens: '91ab4a31b83e3f32d33328190428478e5927c71e2306c2cc410ea77b2c71b097', commands: '2951067c5d62c7a870f9aaf44bbd803f89261d87d5280ba1ab905c09bebef13a' },
  'prove:its-06': { screens: '37b06aa1078e873b39378c6cad745bba5d9f7df9619d8290291c1985fad6dfbe', commands: '8c57662e32f842a687b7147a4e75baf22c38303ddc711aa8a1b4bbfbe7f74841' },
  'prove:its-04': { screens: '8e45667a13a3eba35a7e66c145d0b492ae8a7ec0dd29f24b8014f02441976a5a', commands: '42fa3f619839c83c5bb4719363ce015ddbbe270207f4be32a7ea3891da13c186' },
};
function testOldShiftsUnchanged() {
  const plain = sim({ withTest: false });
  const shifts = shiftsOf(plain);
  assert.equal(shifts.length, Object.keys(PINNED).length, 'every pinned shift still exists');
  for (const shift of shifts) {
    assert.ok(PINNED[shift.name], `${shift.name} has pins`);
    assert.deepEqual(pinsOf(shift.make), PINNED[shift.name], `${shift.name} unchanged`);
  }
}

/* ---------- Test-only tickets, sets and a Prove shift ---------- */
const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const PC = (name, user) => ({ name, user, os: 'Windows 11 Enterprise 24H2', ip: '10.20.10.160', ou: 'OU=Operations,OU=Workstations', trust: 'Healthy', bitlocker: 'Protected', lastSeen: '1 minute ago', health: 'Healthy' });
const MACHINES = {
  // Sound: the output moved to a device the user can't hear.
  'TEST-LT-61': { sound: { outputs: [{ id: 'monitor', name: 'TEST Monitor speakers' }, { id: 'headset', name: 'TEST Headset' }], output: 'monitor',
    inputs: [{ id: 'mic', name: 'TEST Headset mic' }, { id: 'array', name: 'TEST Microphone array' }], input: 'mic', hears: ['headset'], heard: 'TEST: I hear it.' } },
  // A room projector on a cable, at the wrong resolution, and a monitor.
  'TEST-LT-62': { projection: 'Duplicate', dock: { name: 'TEST table HDMI', cable: true, docked: true, power: true, monitors: [
    { id: 'proj', name: 'TEST Projector', input: 'HDMI 1', cable: 'HDMI 1', inputs: ['HDMI 1', 'HDMI 2'],
      resolution: { native: '1920 × 1080', current: '2560 × 1600', choices: ['2560 × 1600', '1920 × 1200', '1920 × 1080', '1280 × 720'] }, projector: { lampHours: 1840, filter: 'Clean' } },
    { id: 'mon', name: 'TEST Monitor', input: 'DisplayPort', cable: 'DisplayPort', inputs: ['DisplayPort'], resolution: { native: '2560 × 1440', choices: ['2560 × 1440', '1920 × 1080'] } }] } },
  // Services, the indexer and Outlook on the web.
  'TEST-LT-63': {
    services: [{ name: 'WSearch', displayName: 'Windows Search', status: 'Stopped', startup: 'Automatic (Delayed Start)' },
      { name: 'Spooler', displayName: 'Print Spooler', status: 'Running', startup: 'Automatic' },
      { name: 'TESTOff', displayName: 'TEST Disabled service', status: 'Stopped', startup: 'Disabled' }],
    search: { remaining: 34112, step: 1200 },
    outlookWeb: { messages: [{ from: 'TEST Auditor', subject: 'TEST findings for July', received: '2026-07-14', keywords: ['auditor', 'audit'] },
      { from: 'TEST Auditor', subject: 'TEST sample list', received: '2026-07-16', keywords: ['auditor'] }, { from: 'TEST Colleague', subject: 'TEST lunch', received: '2026-08-19' }] } },
  // An indexer with no services list: search.running decides.
  'TEST-LT-64': { search: { running: true, remaining: 100, step: 60 } },
  // Module 4's dock and monitors, with no new key.
  'TEST-LT-65': { projection: 'Extend', dock: { name: 'TEST Dock', docked: true, power: true, monitors: [{ id: 'm1', name: 'TEST Left', input: 'DisplayPort', cable: 'DisplayPort', inputs: ['DisplayPort', 'HDMI'] }] } },
};
const ticketFor = (id, computer) => base({ id, number: `INC00${id.slice(3)}`, requester: 'Maya Chen', createdAt: '2026-08-20T08:55:00Z', description: `TEST ${computer}`, console: { machines: { [computer]: MACHINES[computer] } } });
const TICKETS = [ticketFor('HD-9961', 'TEST-LT-61'), ticketFor('HD-9962', 'TEST-LT-62'), ticketFor('HD-9963', 'TEST-LT-63'), ticketFor('HD-9964', 'TEST-LT-64'), ticketFor('HD-9965', 'TEST-LT-65')];
// A remote session on the sound machine (console A's remote key).
TICKETS.push(base({ id: 'HD-9966', number: 'INC009966', requester: 'Maya Chen', createdAt: '2026-08-20T08:55:00Z', description: 'TEST remote', console: { machines: { 'TEST-LT-66': { remote: { agent: 'Online' }, sound: MACHINES['TEST-LT-61'].sound } } } }));
const COMPUTERS = [...Object.keys(MACHINES), 'TEST-LT-66'].map((name) => PC(name, 'Maya Chen'));
const SETS = {
  'test-m10b': { title: 'Test console B', tickets: TICKETS.map((t) => t.id), now: '2026-08-20T09:00:00Z', computers: COMPUTERS },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS, machine: MACHINES['TEST-LT-63'], pc: PC('TEST-LT-63', 'Maya Chen') };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));
    HD_PROVE_SHIFTS['test-m10b'] = { ...JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-04'])), labKey:'lab-test-m10b-prove', selectedComputer:'TEST-LT-63',
      computers:[JSON.parse(JSON.stringify(__test.pc))], machines:{ 'TEST-LT-63':JSON.parse(JSON.stringify(__test.machine)) } };`, ctx);
}
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const actions = (tab, id) => json(tab, `(hdTicketById(${JSON.stringify(id)}).consoleState || { actions:[] }).actions`);
const history = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).troubleshootingHistory`).map((h) => h.action);
const seen = (tab, name) => json(tab, `(hdMachine(${JSON.stringify(name)}).seen || [])`);
const onTicket = (id) => { const tab = sim({ url: 'https://academy.test/sim/?practice=test-m10b&student=stu-1#/helpdesk/tickets' }); tab.open(id); return tab; };

// Settings › System › Sound: outputs and inputs, a change, the test tone.
function testSound() {
  const tab = onTicket('HD-9961');
  tab.on('TEST-LT-61');
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="settings-sound"[^>]*>🔊 Settings › System › Sound</);
  tab.screen('TEST-LT-61', 'settings-sound');
  assert.equal(tab.ctx.location.hash, '#/helpdesk/settings-sound');
  let screen = tab.view('helpdesk/settings-sound');
  assert.match(screen, /Choose where to play sound · TEST Monitor speakers/);
  assert.match(screen, /data-hd-sound-output="monitor"/);
  assert.match(screen, /data-hd-sound-output="headset"/);
  assert.match(screen, /Choose a device for speaking or recording · TEST Headset mic/);
  assert.ok(seen(tab, 'TEST-LT-61').includes('sound'));
  // The tone on the wrong output: she doesn't hear it.
  tab.run("hdSoundTest('TEST-LT-61')");
  assert.match(tab.view('helpdesk/settings-sound'), /data-hd-sound-heard="false"><strong>Maya:<\/strong> “I can't hear anything\.”/);
  tab.run("hdSoundSet('TEST-LT-61', 'output', 'headset')");
  tab.run("hdSoundSet('TEST-LT-61', 'output', 'headset')");
  tab.run("hdSoundSet('TEST-LT-61', 'output', 'no-such-device')");
  screen = tab.view('helpdesk/settings-sound');
  assert.match(screen, /Choose where to play sound · TEST Headset/);
  assert.doesNotMatch(screen, /data-hd-sound-heard/, 'a new output clears the last test');
  tab.run("hdSoundTest('TEST-LT-61')");
  assert.match(tab.view('helpdesk/settings-sound'), /data-hd-sound-heard="true"><strong>Maya:<\/strong> “TEST: I hear it\.”/);
  tab.run("hdSoundSet('TEST-LT-61', 'input', 'array')");
  const list = actions(tab, 'HD-9961');
  assert.deepEqual(list.map((a) => a.id), ['sound-test', 'sound-output', 'sound-test', 'sound-input']);
  assert.deepEqual([list[1].from, list[1].to], ['TEST Monitor speakers', 'TEST Headset']);
  assert.deepEqual([list[0].heard, list[2].heard], [false, true]);
  assert.ok(history(tab, 'HD-9961').includes('On TEST-LT-61: changed the sound output from TEST Monitor speakers to TEST Headset.'));
  assert.ok(json(tab, 'hdState.practiceLog').some((e) => e.type === 'action_taken' && e.action === 'sound-output' && e.to === 'TEST Headset'));
}

// Dock and displays: resolution choices, Keep changes, a room projector.
function testDisplaysAndProjector() {
  const tab = onTicket('HD-9962');
  tab.on('TEST-LT-62');
  tab.screen('TEST-LT-62', 'dock');
  let screen = tab.view('helpdesk/dock');
  assert.match(screen, /data-hd-dock-cable><div class="card-header"[^>]*><strong>TEST table HDMI<\/strong><span class="muted">Cable connected/);
  assert.doesNotMatch(screen, /Plug in the dock|Disconnect the laptop/, 'a cable has no dock buttons');
  assert.match(screen, /<strong>TEST Projector<\/strong><span class="muted">Fuzzy and cut off<\/span>/);
  assert.match(screen, /data-hd-projector="proj"><dt>Native resolution<\/dt><dd>1920 × 1080<\/dd><dt>Input<\/dt><dd>HDMI 1<\/dd><dt>Lamp hours<\/dt><dd>1840<\/dd><dt>Filter<\/dt><dd>Clean<\/dd><dt>Picture<\/dt><dd data-hd-picture>Fuzzy and cut off<\/dd>/);
  assert.match(screen, /<option value="2560 × 1600" selected>2560 × 1600<\/option>/);
  assert.match(screen, /<option value="1920 × 1080" >1920 × 1080 \(Recommended\)<\/option>/);
  assert.match(screen, /<option value="2560 × 1440" selected>2560 × 1440 \(Recommended\)<\/option>/, 'no current: the native one');
  // A pick shows at once and waits; Revert puts it back with nothing logged.
  tab.run("hdDisplayResolution('TEST-LT-62', 'proj', '1920 × 1080')");
  screen = tab.view('helpdesk/dock');
  assert.match(screen, /data-hd-resolution-keep><p><strong>Keep these display settings\?<\/strong>/);
  assert.match(screen, /<strong>TEST Projector<\/strong><span class="muted">Sharp<\/span>/);
  tab.run("hdDisplayResolution('TEST-LT-62', 'proj', '1280 × 720')");
  assert.equal(json(tab, 'hdMachine("TEST-LT-62").dock.monitors[0].resolution').current, '1920 × 1080', 'one change at a time');
  tab.run("hdDisplayKeep('TEST-LT-62', 'proj', false)");
  assert.match(tab.view('helpdesk/dock'), /<strong>TEST Projector<\/strong><span class="muted">Fuzzy and cut off<\/span>/);
  assert.equal(actions(tab, 'HD-9962').length, 0);
  tab.run("hdDisplayResolution('TEST-LT-62', 'proj', 'not a choice')");
  assert.doesNotMatch(tab.view('helpdesk/dock'), /data-hd-resolution-keep/);
  // Keep changes: logged with the old and new value; the picture is Sharp.
  tab.run("hdDisplayResolution('TEST-LT-62', 'proj', '1920 × 1080')");
  tab.run("hdDisplayKeep('TEST-LT-62', 'proj', true)");
  screen = tab.view('helpdesk/dock');
  assert.doesNotMatch(screen, /data-hd-resolution-keep/);
  assert.match(screen, /<dd data-hd-picture>Sharp<\/dd>/);
  const [change] = actions(tab, 'HD-9962');
  assert.deepEqual([change.id, change.monitor, change.from, change.to, change.picture], ['display-resolution', 'proj', '2560 × 1600', '1920 × 1080', 'Sharp']);
  assert.ok(history(tab, 'HD-9962').includes("On TEST-LT-62: changed TEST Projector's resolution from 2560 × 1600 to 1920 × 1080."));
  // The wrong input: No signal, whatever the resolution.
  tab.run("hdDockDo('TEST-LT-62', 'input', 'proj', 'HDMI 2')");
  assert.match(tab.view('helpdesk/dock'), /<strong>TEST Projector<\/strong><span class="muted">No signal<\/span>/);
}

// Module 4's dock and monitors with no new key: exactly as before.
function testOldDockUnchanged() {
  const tab = onTicket('HD-9965');
  tab.on('TEST-LT-65');
  const screen = tab.view('helpdesk/dock');
  assert.doesNotMatch(screen, /data-hd-resolution|Recommended|data-hd-projector|data-hd-dock-cable|data-hd-picture/);
  assert.match(screen, /<strong>TEST Left<\/strong><span class="muted">Showing the desktop<\/span>/);
  assert.match(screen, /Plug in the dock|Dock power connected/);
  // No new screen on a machine without its key.
  for (const [route, title] of [['settings-sound', 'Settings › System › Sound'], ['pc-services', 'Services'], ['outlook-search', 'Outlook › Search › Search Tools › Indexing Status'], ['settings-search', 'Settings › Privacy &amp; security › Searching Windows'], ['outlook-web', 'Outlook on the web']]) {
    assert.equal(tab.view(`helpdesk/${route}`), tab.run(`hdMachineMissing(${JSON.stringify(title.replace('&amp;', '&'))})`), route);
  }
  assert.doesNotMatch(tab.view('helpdesk/windows'), /data-hd-tools="(settings-sound|pc-services|outlook-search|settings-search|outlook-web)"/);
  assert.equal(tab.ps('Start-Service WSearch'), "The term 'Start-Service WSearch' is outside this training shell. Type Get-Help for supported commands.");
  assert.doesNotMatch(tab.ps('Get-Help'), /Start-Service -Name/);
}

// Services on a workstation: the screen and the typed lines earn the same.
function testServices() {
  const viaScreen = onTicket('HD-9963');
  viaScreen.on('TEST-LT-63');
  viaScreen.screen('TEST-LT-63', 'pc-services');
  const screen = viaScreen.view('helpdesk/pc-services');
  assert.match(screen, /data-hd-pc-service="WSearch" data-hd-service-status="Stopped"><td><strong>Windows Search<\/strong><small>WSearch<\/small><\/td><td>[^]*?<\/td><td>Automatic \(Delayed Start\)<\/td><td><button[^>]*data-hd-pc-service-start="WSearch"/);
  assert.doesNotMatch(screen, /data-hd-pc-service-start="TESTOff"/, 'a Disabled service has no Start');
  assert.doesNotMatch(screen, /data-hd-pc-service-start="Spooler"/, 'a running service has no Start');
  viaScreen.run("hdPcServiceStart('TEST-LT-63', 'WSearch')");
  viaScreen.run("hdPcServiceStart('TEST-LT-63', 'WSearch')");
  assert.match(viaScreen.view('helpdesk/pc-services'), /data-hd-pc-service="WSearch" data-hd-service-status="Running"/);

  const viaShell = onTicket('HD-9963');
  viaShell.on('TEST-LT-63');
  assert.match(viaShell.ps('Get-Help'), /Services: Get-Service \[-Name <name>\], Start-Service -Name <name>/);
  assert.equal(viaShell.ps('Get-Service'), ['Status   Name               DisplayName', '------   ----               -----------', 'Stopped  WSearch            Windows Search', 'Running  Spooler            Print Spooler', 'Stopped  TESTOff            TEST Disabled service'].join('\n'));
  assert.equal(viaShell.ps('get-service -name "windows search"'), ['Status   Name               DisplayName', '------   ----               -----------', 'Stopped  WSearch            Windows Search'].join('\n'));
  assert.equal(viaShell.ps('Start-Service TESTOff'), "Start-Service : Service 'TEST Disabled service (TESTOff)' cannot be started due to the following error: Cannot start service TESTOff on computer '.'.");
  viaShell.shell('Start-Service -Name WSearch');
  assert.match(viaShell.ps('Get-Service WSearch'), /Running  WSearch/);
  assert.equal(viaShell.ps('Start-Service WSearch'), '', 'already running: nothing printed, nothing logged');
  // Not in the list: the older answer (no service invented).
  assert.equal(viaShell.ps('Get-Service NoSuch'), "The term 'Get-Service NoSuch' is outside this training shell. Type Get-Help for supported commands.");

  const started = (tab) => actions(tab, 'HD-9963').filter((a) => a.id === 'service-start');
  assert.deepEqual(started(viaScreen).map((a) => [a.service, a.via]), [['WSearch', 'services']]);
  assert.deepEqual(started(viaShell).map((a) => [a.service, a.via]), [['WSearch', 'powershell']]);
  for (const key of ['pc-services', 'service:WSearch', 'service:Spooler', 'service:TESTOff']) {
    assert.ok(seen(viaScreen, 'TEST-LT-63').includes(key), `screen: ${key}`);
    assert.ok(seen(viaShell, 'TEST-LT-63').includes(key), `typed: ${key}`);
  }
  assert.ok(history(viaShell, 'HD-9963').includes('On TEST-LT-63: started Windows Search (WSearch) from PowerShell.'));
}

// The indexer: Outlook's Indexing Status and Searching Windows; the count
// stays while the service is stopped and moves once Windows Search runs.
function testIndexer() {
  const tab = onTicket('HD-9963');
  tab.on('TEST-LT-63');
  tab.screen('TEST-LT-63', 'outlook-search');
  assert.match(tab.view('helpdesk/outlook-search'), /data-hd-indexing-status>Outlook is currently indexing your items\. 34,112 items remaining</);
  tab.run("hdSearchRefresh('TEST-LT-63', 'outlook-search')");
  assert.match(tab.view('helpdesk/outlook-search'), /34,112 items remaining/, 'the same a minute later');
  tab.screen('TEST-LT-63', 'settings-search');
  assert.match(tab.view('helpdesk/settings-search'), /data-hd-indexer="stopped"><strong>Indexer status:<\/strong> The search service is not running</);
  for (const key of ['outlook-indexing', 'searching-windows']) assert.ok(seen(tab, 'TEST-LT-63').includes(key), key);
  tab.ps('Start-Service WSearch');
  assert.match(tab.view('helpdesk/settings-search'), /data-hd-indexer="running"><strong>Indexer status:<\/strong> Indexing in progress\. Search results might not be complete during this time\.<\/p><p class="muted">Indexed: 0 items · Pending: 34,112/);
  tab.run("hdSearchRefresh('TEST-LT-63', 'settings-search')");
  assert.match(tab.view('helpdesk/settings-search'), /Indexed: 1,200 items · Pending: 32,912/);
  tab.screen('TEST-LT-63', 'outlook-search');
  assert.match(tab.view('helpdesk/outlook-search'), /31,712 items remaining/);
  // The seen stamp moves too, so a coach can ask for a look after the fix.
  const at = json(tab, 'hdMachine("TEST-LT-63").seenAt');
  const start = actions(tab, 'HD-9963').findIndex((a) => a.id === 'service-start');
  assert.ok(at['outlook-indexing'] > start, 'Indexing Status read again after the start');
  // No services list: search.running decides, and the count ends at 0.
  const other = onTicket('HD-9964');
  other.on('TEST-LT-64');
  other.run("hdSearchRefresh('TEST-LT-64', 'outlook-search')");
  other.run("hdSearchRefresh('TEST-LT-64', 'outlook-search')");
  assert.match(other.view('helpdesk/outlook-search'), /Outlook has finished indexing all of your items\. 0 items remaining/);
  assert.match(other.view('helpdesk/settings-search'), /Indexing complete\.<\/p><p class="muted">Indexed: 100 items · Pending: 0/);
}

// Outlook on the web: the signed-in user's mailbox; headers only.
function testOutlookWeb() {
  const tab = onTicket('HD-9963');
  tab.on('TEST-LT-63');
  tab.screen('TEST-LT-63', 'outlook-web');
  assert.match(tab.view('helpdesk/outlook-web'), /Signed in as Maya Chen/);
  assert.doesNotMatch(tab.view('helpdesk/outlook-web'), /data-hd-owa-result/);
  tab.type('hd-owa-search', 'Auditor', "hdOwaSearch({ preventDefault() {} }, 'TEST-LT-63')");
  let screen = tab.view('helpdesk/outlook-web');
  assert.match(screen, /data-hd-owa-count>2 results for "Auditor"/);
  assert.equal((screen.match(/data-hd-owa-result/g) || []).length, 2);
  assert.match(screen, /<td>TEST Auditor<\/td><td>TEST findings for July<\/td><td>2026-07-14<\/td>/);
  tab.type('hd-owa-search', 'zzz', "hdOwaSearch({ preventDefault() {} }, 'TEST-LT-63')");
  screen = tab.view('helpdesk/outlook-web');
  assert.match(screen, /data-hd-owa-none>We didn't find anything/);
  const searches = actions(tab, 'HD-9963').filter((a) => a.id === 'owa-search');
  assert.deepEqual(searches.map((a) => [a.query, a.found]), [['Auditor', 2], ['zzz', 0]]);
  for (const key of ['outlook-web', 'owa-search']) assert.ok(seen(tab, 'TEST-LT-63').includes(key), key);
  // A password is never searched for or saved.
  tab.type('hd-owa-search', 'password: Winter2026!', "hdOwaSearch({ preventDefault() {} }, 'TEST-LT-63')");
  assert.equal(tab.run('JSON.stringify(hdState)').includes('Winter2026'), false);
}

// Inside a remote session the PC's own screens open from its desktop.
function testRemoteDesktopTools() {
  const tab = onTicket('HD-9966');
  tab.run("hdRemoteSetTool('remote-support')");
  tab.run("hdRemoteRequest('TEST-LT-66', false)");
  const screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-remote-pc-tools><button data-hd-tools="settings-sound" onclick="hdOpenMachineScreen\('TEST-LT-66','settings-sound'\)">/);
  // View only: the desktop, but none of its settings.
  const view = onTicket('HD-9966');
  view.run('hdRemoteQuickAssist()');
  const code = json(view, 'hdRemoteState(hdTicketById("HD-9966")).pending').code;
  view.type('hd-remote-say', `Your code is ${code}.`, 'hdRemoteSay({ preventDefault() {} })');
  view.run("hdRemoteAskControl('view')");
  const viewed = view.view('helpdesk/remote-support');
  assert.match(viewed, /Connected \(view only\)/);
  assert.doesNotMatch(viewed, /data-hd-remote-pc-tools/);
  // Opened another way, the PC still can't be changed while it is view only.
  view.run("hdSoundSet('TEST-LT-66', 'output', 'headset')");
  assert.equal(json(view, 'hdMachine("TEST-LT-66").sound').output, 'monitor');
  assert.match(view.toasts[view.toasts.length - 1], /^View only: ask for full control to change TEST-LT-66\.$/);
  assert.equal(actions(view, 'HD-9966').some((a) => a.id === 'sound-output'), false);
  view.run('hdRemoteEnd()');
  view.run("hdSoundSet('TEST-LT-66', 'output', 'headset')");
  assert.equal(json(view, 'hdMachine("TEST-LT-66").sound').output, 'headset', 'after the session, as before');
  // Console A's machines with no console B key show no tool grid.
  const other = onTicket('HD-9965');
  assert.equal(other.run("hdRemoteToolsHtml('TEST-LT-65')").includes('settings-sound'), false);
}

// A Prove shift: screens and typed lines recorded with the computer; no tips.
function testProveShift() {
  const tab = sim({ url: proveUrl('test-m10b') });
  tab.on('TEST-LT-63');
  tab.shell('Get-Help');
  assert.doesNotMatch(tab.view('helpdesk/powershell'), /Services: Get-Service/, 'Get-Help names no scenario line');
  tab.screen('TEST-LT-63', 'outlook-search');
  tab.screen('TEST-LT-63', 'settings-search');
  tab.screen('TEST-LT-63', 'pc-services');
  assert.doesNotMatch(tab.view('helpdesk/pc-services'), /callout|status and startup/, 'no tip in a Prove It');
  tab.screen('TEST-LT-63', 'outlook-web');
  assert.doesNotMatch(tab.view('helpdesk/outlook-web'), /on the server/, 'no tip in a Prove It');
  tab.shell('Start-Service WSearch');
  tab.screen('TEST-LT-63', 'outlook-search');
  assert.match(tab.view('helpdesk/outlook-search'), /32,912 items remaining/);
  tab.screen('TEST-LT-63', 'outlook-web');
  tab.type('hd-owa-search', 'auditor', "hdOwaSearch({ preventDefault() {} }, 'TEST-LT-63')");
  tab.type('hd-owa-search', 'password: Winter2026!', "hdOwaSearch({ preventDefault() {} }, 'TEST-LT-63')");
  assert.equal(tab.run('JSON.stringify(hdState)').includes('Winter2026'), false, 'never saved in a Prove It');
  assert.equal(tab.run('hdState.prove.passwordWritten'), true);
  const opened = json(tab, 'hdState.prove.opened');
  for (const source of ['outlook-indexing:TEST-LT-63', 'searching-windows:TEST-LT-63', 'pc-services:TEST-LT-63', 'service:WSearch:TEST-LT-63', 'outlook-web:TEST-LT-63', 'owa-search:TEST-LT-63']) assert.ok(opened.includes(source), source);
  const events = json(tab, 'hdState.prove.events');
  assert.deepEqual(events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.computer]), [['service-start', 'TEST-LT-63'], ['owa-search', 'TEST-LT-63']]);
  assert.deepEqual(events.filter((e) => e.type === 'command_run').map((e) => e.command), ['Get-Help', 'Start-Service WSearch']);
}

if (require.main !== module) module.exports = { sim };
else {
  testOldShiftsUnchanged();
  testSound();
  testDisplaysAndProjector();
  testOldDockUnchanged();
  testServices();
  testIndexer();
  testOutlookWeb();
  testRemoteDesktopTools();
  testProveShift();
  console.log('hdesk-m10-console-b: ok');
}

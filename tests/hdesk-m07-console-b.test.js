'use strict';
/* Help Desk simulator: the directory, Group Policy, DNS and DHCP screens added
 * for Module 7 (key its-05), console B (ui/helpdesk.js "Directory, Group
 * Policy, DNS and DHCP"): Active Directory read-only, group member lists, a
 * computer's OU, Group Policy Results per computer, DNS with five record
 * types, DHCP leases, reservations, exclusions and VLANs, the typed server and
 * directory lines with the same credit as their screens, "Raise a related
 * incident" and the "Network device reservation" catalog item.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST text, TEST- groups), never in ui/helpdesk-data.js. No Module 7
 * content. Every older ticket, set and Prove shift must look and behave as
 * before: the screens and command answers are pinned against master. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;
const sha = (text) => crypto.createHash('sha256').update(String(text)).digest('hex');

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const SERVERS = {
  'NS-PRINT01': { status: 'Online', service: 'TEST print healthy',
    services: [{ name: 'Spooler', displayName: 'Print Spooler', status: 'Running', startup: 'Automatic', logOnAs: 'Local System' }] },
  'NS-FILE01': { status: 'Online', service: 'TEST file healthy',
    volumes: [{ drive: 'C:', label: 'System', sizeGb: 120, freeGb: 60 }, { drive: 'D:', label: 'TEST data', sizeGb: 500, freeGb: 250 }],
    events: { system: [{ level: 'Information', time: 'Today 06:00', source: 'TEST', id: '7036', message: 'TEST running.' }] },
    shares: [{ name: 'TESTShare', path: '\\\\NS-FILE01\\TESTShare', share: [{ who: 'TEST-Share-Users', access: 'Change' }], ntfs: [{ who: 'TEST-Share-Users', access: 'Modify' }] }] },
};
const DIRECTORY = {
  groups: { 'GG-HR-Contributors': { members: ['u-1006', 'TEST Contractor'] }, 'TEST-Share-Users': { members: ['pshah'], resource: 'TEST share' } },
  dns: [{ name: 'files', type: 'AAAA', value: 'fd00::30' }, { name: '@', type: 'MX', value: '[10] mail.northstar.example' }, { name: '@', type: 'TXT', value: 'v=spf1 TEST -all' }],
  dhcp: { Warehouse: { leases: [{ name: 'TEST-CLOCK', ip: '10.20.30.142', mac: '00-11-22-33-44-55', leased: 'Today 06:40' }], reservations: [{ name: 'NS-WH-LABEL01', ip: '10.20.30.60', mac: '00-11-22-33-44-66' }], exclusions: [{ start: '10.20.30.50', end: '10.20.30.59' }] } },
};
// HD-9801 raises HD-9802. HD-9803 is plain. HD-9804 has a ticket-level
// directory and a stopped spooler.
const SOURCE = base({ id: 'HD-9801', number: 'INC0019801', requester: 'Maya Chen', createdAt: at(WED, '08:00'), description: 'TEST scheduled check', console: { matrix: {}, raise: { ticket: 'HD-9802' } } });
const RAISED = base({ id: 'HD-9802', number: 'INC0019802', requester: 'Riley Morgan', createdAt: at(WED, '08:00'), description: '', status: 'New', console: { matrix: {}, rewrite: { checks: [] } } });
const PLAIN = base({ id: 'HD-9803', number: 'INC0019803', requester: 'Maya Chen', createdAt: at(WED, '08:05'), description: 'TEST plain', console: { matrix: {} } });
const OWN = base({ id: 'HD-9804', number: 'INC0019804', requester: 'Maya Chen', createdAt: at(WED, '08:06'), description: 'TEST own directory', console: { matrix: {},
  directory: { groups: { 'TEST-Ticket-Group': { members: ['mchen'] } } },
  servers: { 'NS-PRINT01': { status: 'Degraded', services: [{ name: 'Spooler', displayName: 'Print Spooler', status: 'Stopped', startup: 'Automatic', logOnAs: 'Local System' }] }, 'NS-FILE01': { status: 'Offline' } } } });
const CONVERT = base({ id: 'HD-9805', number: 'INC0019805', requester: 'Monica Hall', createdAt: at(WED, '08:07'), description: 'TEST reservation', console: { matrix: {}, convert: { number: 'RITM0019805', items: [] } } });
// HD-9806: a locked account card, and a laptop whose own state says the file
// server's port 445 is closed from it.
const ACCOUNT = base({ id: 'HD-9806', number: 'INC0019806', requester: 'Sam Rivera', createdAt: at(WED, '08:08'), description: 'TEST account and laptop', console: { matrix: {},
  account: { userId: 'u-1013', locked: true },
  machines: { 'NS-LT-0244': { computer: { ip: '10.20.10.244', health: 'Healthy' }, reachable: { 'NS-FILE01': [] } } } } });
const TICKETS = [SOURCE, RAISED, PLAIN, OWN, CONVERT, ACCOUNT];
const SETS = {
  'test-directory': { title: 'Test directory', tickets: ['HD-9801', 'HD-9802', 'HD-9803', 'HD-9804', 'HD-9806'], now: at(WED, '08:40'), servers: SERVERS, directory: DIRECTORY },
  'test-writable': { title: 'Test writable', tickets: ['HD-9803'], now: at(WED, '08:40'), directory: { readOnly: false } },
  'test-ticket-dir': { title: 'Test ticket directory', tickets: ['HD-9803', 'HD-9804'], now: at(WED, '08:40') },
  'test-convert': { title: 'Test convert', tickets: ['HD-9805'], now: at(WED, '08:40') },
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
      Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));
      HD_COACHED_SETS['test-coached-raise'] = { title: 'Test coached raise', tickets: ['HD-9801', 'HD-9802'], now: '2026-08-19T08:00:00Z', directory: {} };
      HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9805').console.convert.items.push(hdReservationItem({ devices: ['TEST-CLOCK'], macs: ['00-11-22-33-44-55'], addresses: ['10.20.30.61'] }));`, ctx);
  }
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, run,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ad: (tab) => { run(`hdState.adTab = ${j(tab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    seen: () => [...(run('hdState.serverSeen') || [])],
    clearSeen: () => run('hdState.serverSeen = []; hdState.tickets.forEach((t) => { if (t.consoleState) t.consoleState.serverSeen = []; })'),
  };
}
const setSim = (key, local) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local });
const directory = (local) => setSim('test-directory', local);

// master's output before this change (computed on master at 7422519).
const COMMANDS = ['gpresult /r', 'gpupdate /force', 'Get-Service', 'Get-Service -ComputerName NS-PRINT01 -Name Spooler', 'Test-NetConnection NS-FILE01 -Port 445', 'Get-ADUser apatel', 'Get-ADGroup', 'Get-ADComputer NS-LT-0145', 'Get-ADGroupMember GG-HR-Readers', 'Get-ADPrincipalGroupMembership apatel', 'Resolve-DnsName files', 'Get-SmbShareAccess -Name HR', 'Get-CimInstance Win32_LogicalDisk', 'Get-WinEvent -LogName System -ComputerName NS-FILE01'];
const PINNED = {
  shared: {
    views: { 'ad-users': 'f659311986528dbc1bae5ce926fae1e32dd38c9de0582735c641d80e812dcbae', 'ad-groups': 'f0b96b66e03f0e7eca8a34d514070d680c10bd466e048579f5d6df0ec73e9aec', 'ad-computers': '88b6c35d84ae1bc3edea35ffb6937e6daaa5951e99e0501ff76b0943d62f6d9b', dns: 'ec8cc2cb154e4a1c86c39a62a4d44f9a7daa1cf7949da59faba185b58ec45a5c', dhcp: '035f41dee02049a7c8fcffa378300c84c9fffc77357f102069fea75933641248', 'group-policy': 'f2d07cf3efc5341ad3861a558ce5ce3bcf86daf85ecad27c4f96013fc21de87a' },
    commands: ['b4a1a992e8d039dccaab6f8671f3ef61252d3adc1822253bd2ccba93e973865a', '00a4a15c0f84b903cdb109469462278bd6a006fa90fdd81ab17ee7453f1d1958', '71bd8c9247b3a8c00d75b1b18774670cebfa286a6f839d6244049000230888ad', '5d8afa92b8e12595af98c6a5e069d624e10e9b26ae76b6eaef80232cd3db238b', 'e0bd8109cdd4eeabff18a8f248b5327e0fcf22706640b7527bf80fdb6f3a95a3', '961e44229f290d8a9cc12e5e686190d9da9567503f8e01ac3985a3df9c0698a2', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '4ff158d98d58d4f82b0bd3065874eb8db11024739453a21b08c47453d05e342d', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '5692b8e2679e8d2c7e4fbaa9ae8d4c9fcf225af308e36cb7c41b3f376ef0e9f5', 'c54d5f1013cb1cae5f5bf891fab046a9b512c0f40d632a00e32ffb3922eae75b', '822f101519f299d12e476f86d9de9ca59219d374598e81a03247a27410921b31', '0846b9c34b6f557e55124822d5e6171ea2f6b8eef835de76cdb052b40e4039d1', 'b5b0a0922530609d485220098833432e2f2b7c7acd3c063e1dbc60ae4eb71c1f'],
  },
  'its-01': {
    views: { 'ad-users': '7fbaa165e63b1fae87dee2260ed6c54efd79a5338184f47022b8951cb02c0e8c', 'ad-groups': 'f0b96b66e03f0e7eca8a34d514070d680c10bd466e048579f5d6df0ec73e9aec', 'ad-computers': 'e292bd673ac4b06603731a7a7e38737639751faa0f2515047cbc133b209e5c73', dns: 'ec8cc2cb154e4a1c86c39a62a4d44f9a7daa1cf7949da59faba185b58ec45a5c', dhcp: '035f41dee02049a7c8fcffa378300c84c9fffc77357f102069fea75933641248', 'group-policy': 'f2d07cf3efc5341ad3861a558ce5ce3bcf86daf85ecad27c4f96013fc21de87a' },
    commands: ['90f10fcf756f42714243379dd1eea491723c98f3f19bbd5c9428ba61230d65a2', '00a4a15c0f84b903cdb109469462278bd6a006fa90fdd81ab17ee7453f1d1958', '6f7751159be5fff3d71ae2146d7de0cf6e51ec1e11ff325d271afcf1ef99c116', '5d8afa92b8e12595af98c6a5e069d624e10e9b26ae76b6eaef80232cd3db238b', 'e0bd8109cdd4eeabff18a8f248b5327e0fcf22706640b7527bf80fdb6f3a95a3', '961e44229f290d8a9cc12e5e686190d9da9567503f8e01ac3985a3df9c0698a2', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '233c41f17cb739d36d48db8b799cdd60b0258ea73fbb065967da669a89388c82', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '5692b8e2679e8d2c7e4fbaa9ae8d4c9fcf225af308e36cb7c41b3f376ef0e9f5', 'c54d5f1013cb1cae5f5bf891fab046a9b512c0f40d632a00e32ffb3922eae75b', '822f101519f299d12e476f86d9de9ca59219d374598e81a03247a27410921b31', '0846b9c34b6f557e55124822d5e6171ea2f6b8eef835de76cdb052b40e4039d1', 'bb74089469a3748442e8b8efcc68940df59d6f97490470b9d60f5fbf3b5311ee'],
  },
  'its-03': {
    views: { 'ad-users': 'ffdd3e86497105901c4a446c2f4aa6de023a4d3d2bcd2dffe88827a96dc3e0b7', 'ad-groups': 'f0b96b66e03f0e7eca8a34d514070d680c10bd466e048579f5d6df0ec73e9aec', 'ad-computers': 'c34a24af8d5748c5f6a2bc0efbf69ba936f38763faebf71eb24c2b8b4ffcd1d8', dns: 'ec8cc2cb154e4a1c86c39a62a4d44f9a7daa1cf7949da59faba185b58ec45a5c', dhcp: '035f41dee02049a7c8fcffa378300c84c9fffc77357f102069fea75933641248', 'group-policy': 'f2d07cf3efc5341ad3861a558ce5ce3bcf86daf85ecad27c4f96013fc21de87a' },
    commands: ['da0be4c1a41b01a77f61cee792a1f0597bdd74a1f3e19325e14548ec1c6a1a83', '00a4a15c0f84b903cdb109469462278bd6a006fa90fdd81ab17ee7453f1d1958', '71bd8c9247b3a8c00d75b1b18774670cebfa286a6f839d6244049000230888ad', '5d8afa92b8e12595af98c6a5e069d624e10e9b26ae76b6eaef80232cd3db238b', 'e0bd8109cdd4eeabff18a8f248b5327e0fcf22706640b7527bf80fdb6f3a95a3', '961e44229f290d8a9cc12e5e686190d9da9567503f8e01ac3985a3df9c0698a2', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '6db0a73bcebdb70bf3d6b7829c7bce18579d2ddb771c8a16cb04e9829d53939f', 'a848596a004dfc8ae5a8e00e62b12933170a88b754b910149d4d6ebf85946ed0', '5692b8e2679e8d2c7e4fbaa9ae8d4c9fcf225af308e36cb7c41b3f376ef0e9f5', 'c54d5f1013cb1cae5f5bf891fab046a9b512c0f40d632a00e32ffb3922eae75b', '822f101519f299d12e476f86d9de9ca59219d374598e81a03247a27410921b31', '0846b9c34b6f557e55124822d5e6171ea2f6b8eef835de76cdb052b40e4039d1', 'de8eada0601aea1d5cfa480657b3fc9a558b5e0cedabe9c14f5b04e4a60c23c1'],
  },
};
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m07b#/helpdesk/tickets`;
function assertPinned(make, pins, label) {
  for (const tab of ['users', 'groups', 'computers']) assert.equal(sha(make().ad(tab)), pins.views[`ad-${tab}`], `${label} ad ${tab}`);
  for (const route of ['dns', 'dhcp', 'group-policy']) assert.equal(sha(make().view(`helpdesk/${route}`)), pins.views[route], `${label} ${route}`);
  COMMANDS.forEach((command, index) => assert.equal(sha(make().ps(command)), pins.commands[index], `${label} ${command}`));
}
const NEW_MARKERS = /data-hd-(ad-read-only|ad-user=|ad-groups|group-members|member-of|gp-results|gp-computer|dns-zone|dns-record|dns-type|dhcp-scope|dhcp-detail|dhcp-lease|raise|raised)/;
// An older shift: every new screen is the fixed one and no new line answers.
function assertOff(tab, label) {
  assert.equal(tab.run('hdDirectory()'), null, `${label} no directory`);
  assert.equal(tab.view('helpdesk/dns'), tab.run('hdDnsFixed()'), `${label} dns`);
  assert.equal(tab.view('helpdesk/dhcp'), tab.run('hdDhcpFixed()'), `${label} dhcp`);
  assert.equal(tab.view('helpdesk/group-policy'), tab.run('hdGroupPolicyFixed()'), `${label} group-policy`);
  for (const adTab of ['users', 'groups', 'computers']) assert.doesNotMatch(tab.ad(adTab), NEW_MARKERS, `${label} ad ${adTab}`);
  const computer = tab.run('hdComputerByName(hdState.selectedComputer) || hdComputers()[0]');
  for (const command of COMMANDS) {
    const normalized = command.toLowerCase();
    assert.equal(tab.run(`hdDirectoryCommand(${JSON.stringify(command)}, ${JSON.stringify(normalized)}, hdComputerByName(${JSON.stringify(computer.name)}))`), null, `${label} ${command}`);
    assert.equal(tab.run(`hdServerCommand(${JSON.stringify(command)}, ${JSON.stringify(normalized)}, hdComputerByName(${JSON.stringify(computer.name)}))`), null, `${label} server ${command}`);
  }
}

function testOldTicketsTurnNothingOn() {
  assertPinned(() => sim({ withTest: false }), PINNED.shared, 'shared (plain)');
  assertPinned(() => sim(), PINNED.shared, 'shared (test tickets loaded)');
  for (const key of ['its-01', 'its-03']) assertPinned(() => sim({ url: proveUrl(key), withTest: false }), PINNED[key], `prove ${key}`);
  const plain = sim({ withTest: false });
  assertOff(sim(), 'shared');
  // Module 7's own sets and tickets turn these on: tests/hdesk-m07-guided-lab.test.js
  // and tests/hdesk-m07-practice-tickets.test.js cover them. Module 8's sets
  // (its-06, its-06-guided, its-06-extension) reuse the directory screens:
  // tests/hdesk-m08-guided-lab.test.js and tests/hdesk-m08-practice-tickets.test.js.
  // Module 9's sets (its-04, its-04-guided) reuse the DNS, change log and
  // Active Directory screens: tests/hdesk-m09-guided-lab.test.js and
  // tests/hdesk-m09-practice-tickets.test.js. Module 10's sets (its-08,
  // its-08-guided) reuse the directory and Active Directory screens:
  // tests/hdesk-m10-guided-lab.test.js and tests/hdesk-m10-practice-tickets.test.js.
  const MODULE_7_SETS = ['its-05', 'its-05-guided', 'its-06', 'its-06-guided', 'its-06-extension', 'its-04', 'its-04-guided', 'its-08', 'its-08-guided'];
  const MODULE_7 = ['HD-2189', 'HD-2190', 'HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195', 'HD-2202', 'HD-2203', 'HD-2204', 'HD-2205', 'HD-2206'];
  for (const key of Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_7_SETS.includes(k))) {
    const set = setSim(key); assertOff(set, key);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) { assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`); assertOff(set, `${key} ${id}`); }
  }
  for (const key of Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_7_SETS.includes(k))) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    assertOff(set, key);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) { assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`); assertOff(set, `${key} ${id}`); }
  }
  // Every older Prove shift. Module 7's own Prove shift turns these screens on
  // (tests/hdesk-m07-prove.test.js), and so does Module 8's, with its account
  // controls (tests/hdesk-m08-prove.test.js), and so does Module 9's, whose
  // directory holds the names its laptop looks up (tests/hdesk-m09-prove.test.js),
  // and so does Module 10's, whose directory holds the one account its PC's
  // user is looked up by (tests/hdesk-m10-prove.test.js).
  for (const key of Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !['its-05', 'its-06', 'its-04', 'its-08'].includes(k))) {
    const prove = sim({ url: proveUrl(key) });
    assertOff(prove, `prove ${key}`);
    for (const id of prove.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(prove.open(id), NEW_MARKERS, `prove ${key} ${id}`);
  }
  // No older template raises a ticket, lists a directory or the new catalog item.
  const older = `HD_TICKET_TEMPLATES.filter((t) => !${JSON.stringify(MODULE_7)}.includes(t.id))`;
  assert.deepEqual(JSON.parse(plain.run(`JSON.stringify(${older}.filter((t) => t.console && (t.console.raise || t.console.directory)).map((t) => t.id))`)), []);
  assert.deepEqual(JSON.parse(plain.run(`JSON.stringify(${older}.filter((t) => t.console && t.console.convert && (t.console.convert.items || []).some((i) => i.name === 'Network device reservation')).map((t) => t.id))`)), []);
  // Older Active Directory actions still change an account.
  plain.run("hdState.selectedUserId = 'u-1006'; hdAdAction('disable')");
  assert.equal(plain.run("hdUserById('u-1006').enabled"), false);
}

// Read-only: no account button anywhere, and every action refused.
function testReadOnlyDirectory() {
  const tab = directory();
  assert.equal(tab.run('hdDirectoryReadOnly()'), true, 'read-only before any ticket is opened');
  const page = tab.ad('users');
  assert.match(page, /data-hd-ad-read-only/);
  assert.doesNotMatch(page, /hdAdAction|>Unlock<|Reset password|>Disable<|>Enable<|Add approved group/);
  const before = tab.run("JSON.stringify(hdState.userOverrides)");
  for (const action of ['unlock', 'reset', 'disable', 'enable', 'add-hr']) {
    for (const id of ['u-1005', 'u-1004']) tab.run(`hdState.selectedUserId = ${JSON.stringify(id)}; hdAdAction(${JSON.stringify(action)})`);
  }
  assert.equal(tab.run("JSON.stringify(hdState.userOverrides)"), before, 'no account changed');
  assert.match(tab.toasts.join('|'), /Read-only/);
  for (const id of ['HD-9801', 'HD-9803', 'HD-9804']) { tab.open(id); assert.doesNotMatch(tab.ad('users'), /hdAdAction/, `${id} read-only`); }
  // Typed account changes do nothing either, and Get-Help offers none.
  assert.match(tab.ps('Unlock-ADAccount -Identity jbell'), /outside this training shell/);
  assert.equal(tab.run("JSON.stringify(hdState.userOverrides)"), before);
  assert.doesNotMatch(tab.ps('Get-Help'), /Unlock-ADAccount/);
  assert.match(sim().ps('Get-Help'), /Unlock-ADAccount/, 'the shared shift still lists it');
  // A ticket's Account card cannot unlock in a read-only shift.
  tab.open('HD-9806');
  assert.equal(tab.run("hdUserById('u-1013').locked"), true);
  tab.run("hdConsoleUnlock('HD-9806')");
  assert.equal(tab.run("hdUserById('u-1013').locked"), true, 'still locked');
  // A directory block that says readOnly:false keeps the buttons.
  const writable = setSim('test-writable');
  assert.match(writable.ad('users'), /hdAdAction\('unlock'\)[\s\S]*Reset password[\s\S]*Add approved group/);
  writable.run("hdState.selectedUserId = 'u-1006'; hdAdAction('disable')");
  assert.equal(writable.run("hdFileUser('u-1006').enabled"), false);
  // A ticket's own directory turns it on only while that ticket is open.
  const own = setSim('test-ticket-dir');
  assert.equal(own.run('hdDirectory()'), null);
  own.open('HD-9804'); assert.match(own.ad('users'), /data-hd-ad-read-only/);
  own.open('HD-9803'); assert.equal(own.run('hdDirectory()'), null);
  // Opening a user records it; the default pane records nothing.
  const fresh = directory();
  fresh.ad('users');
  assert.deepEqual(fresh.seen(), []);
  fresh.run("hdOpenUser('u-1004')"); fresh.ad('users');
  assert.deepEqual(fresh.seen(), ['ad-user:u-1004', 'ad-user-groups:u-1004']);
}

// Group members from users' groups plus the listed extras; Member Of and
// Effective access agree.
function testGroupMembers() {
  const tab = directory();
  let page = tab.ad('groups');
  assert.match(page, /data-hd-ad-group="TEST-Share-Users"/, 'a group HD_GROUPS lacks is added');
  assert.match(page, /data-hd-ad-group="GG-HR-Readers"[\s\S]*?<td>1<\/td>/, 'GG-HR-Readers has one listed user');
  tab.run("hdAdGroupOpen('GG-HR-Contributors')");
  page = tab.ad('groups');
  assert.match(page, /data-hd-group-members="GG-HR-Contributors"/);
  assert.match(page, /data-hd-group-member="Grace Kim"/);
  assert.match(page, /data-hd-group-member="TEST Contractor"/);
  const screen = tab.seen();
  assert.deepEqual(screen, ['ad-group:GG-HR-Contributors']);
  const cmd = directory();
  const out = cmd.ps('Get-ADGroupMember GG-HR-Contributors');
  assert.match(out, /Grace Kim\s+gkim\s+user/);
  assert.match(out, /TEST Contractor/);
  assert.deepEqual(cmd.seen(), screen, 'the command earns the same key');
  tab.run("hdOpenUser('u-1004')");
  assert.match(tab.ad('users'), /data-hd-member-of>[\s\S]*GG-HR-Readers[\s\S]*TEST-Share-Users/);
  assert.match(cmd.ps('Get-ADPrincipalGroupMembership pshah'), /TEST-Share-Users/);
  assert.deepEqual(cmd.seen(), ['ad-group:GG-HR-Contributors', 'ad-user-groups:u-1004']);
  assert.match(cmd.ps('Get-ADUser pshah -Properties MemberOf'), /MemberOf\s+: \{.*CN=TEST-Share-Users/);
  assert.ok(cmd.seen().includes('ad-user:u-1004'));
  // A spaced property list, as most guides write it.
  const spaced = directory();
  const listed = spaced.ps('Get-ADUser gkim -Properties LockedOut, Enabled, MemberOf');
  assert.match(listed, /LockedOut\s+: False[\s\S]*MemberOf\s+: \{.*CN=GG-HR-Contributors/);
  assert.deepEqual(spaced.seen(), ['ad-user:u-1006', 'ad-user-groups:u-1006']);
  // Console A's effective access reads the same groups.
  tab.run("hdServerOpen('NS-FILE01', '#/helpdesk/file-server'); hdFileSet({ share:'TESTShare' }); hdFileSet({ tab:'effective' }); hdFileSet({ user:'u-1004' })");
  assert.match(tab.view('helpdesk/file-server'), /data-hd-effective-access="Modify"/);
  assert.match(cmd.ps('Get-ADUser nobody'), /Cannot find an object/);
  assert.match(cmd.ps('Get-ADGroupMember TEST-None'), /Cannot find an object/);
}

// A computer's OU on the Computers pane, and Get-ADComputer.
function testComputerOu() {
  const tab = directory();
  let page = tab.ad('computers');
  assert.match(page, /data-hd-ad-computers/);
  assert.match(page, /data-hd-ad-computer="NS-LT-0215"[\s\S]*?hdAdOpenComputer/);
  tab.run("hdAdOpenComputer('NS-LT-0215')");
  page = tab.ad('computers');
  assert.match(page, /data-hd-ad-computer-pane="NS-LT-0215"[\s\S]*OU<\/dt><dd><code>OU=Sales,OU=Workstations<\/code>/);
  assert.deepEqual(tab.seen(), ['ad-computer:NS-LT-0215']);
  const cmd = directory();
  assert.match(cmd.ps('Get-ADComputer NS-LT-0215'), /DistinguishedName : CN=NS-LT-0215,OU=Sales,OU=Workstations/);
  assert.deepEqual(cmd.seen(), tab.seen());
  assert.match(cmd.ps('Get-ADComputer NS-LT-0145'), /CN=NS-LT-0145,CN=Computers/);
}

// Group Policy Results per computer, the same as gpresult /r.
function testGroupPolicyResults() {
  const tab = directory();
  const side = (s) => ({ applied: s.applied.map((g) => g.name), notApplied: s.notApplied.map((i) => [i.gpo.name, i.reason]) });
  const result = (name) => { const r = JSON.parse(tab.run(`JSON.stringify(hdGpResult(${JSON.stringify(name)}))`)); return { computer: side(r.computerSide), user: side(r.userSide) }; };
  // Computer settings: GPOs with a computer part; user settings: a user part.
  assert.deepEqual(result('NS-LT-0215'), { computer: { applied: ['Default Domain Policy', 'Workstation Security Baseline'], notApplied: [] }, user: { applied: ['Default Domain Policy'], notApplied: [] } });
  // A computer in CN=Computers gets only the domain policy; an unlinked GPO
  // is not listed (real gpresult), so the student works out why.
  assert.deepEqual(result('NS-LT-0145'), { computer: { applied: ['Default Domain Policy'], notApplied: [] }, user: { applied: ['Default Domain Policy'], notApplied: [] } });
  // In OU=Operations: Amir would get the drive mapping; Maya is filtered out.
  assert.deepEqual(result('NS-LT-0042').user, { applied: ['Default Domain Policy'], notApplied: [['Operations Drive Mapping', 'Denied (Security)']] }, 'Maya Chen is not in GG-Operations-Drive');
  assert.deepEqual(result('NS-LT-0042').computer.applied, ['Default Domain Policy', 'Workstation Security Baseline']);
  tab.run("hdState.computerOverrides['NS-LT-0145'] = { ou:'OU=Operations,OU=Workstations' }");
  assert.deepEqual(result('NS-LT-0145').user.applied, ['Default Domain Policy', 'Operations Drive Mapping'], 'back in its OU, the mapping reaches Amir');
  tab.run("delete hdState.computerOverrides['NS-LT-0145']");
  assert.deepEqual(result('NS-LT-0117').user.applied, ['Default Domain Policy', 'Finance Printer Deployment'], 'a user policy is under User Settings');
  assert.deepEqual(result('NS-LT-0117').computer.applied, ['Default Domain Policy', 'Workstation Security Baseline']);
  let page = tab.view('helpdesk/group-policy');
  assert.match(page, /data-hd-gp-results-card/);
  assert.doesNotMatch(page, /data-hd-gp-results=/);
  assert.deepEqual(tab.seen(), [], 'nothing recorded until a computer is chosen');
  tab.run("hdGpResultsOpen('NS-LT-0215')");
  page = tab.view('helpdesk/group-policy');
  assert.match(page, /data-hd-gp-results="NS-LT-0215"[\s\S]*data-hd-gp-last-applied>At sign-in today[\s\S]*data-hd-gp-applied="computer">Default Domain Policy<br>Workstation Security Baseline<[\s\S]*data-hd-gp-denied="computer">None[\s\S]*data-hd-gp-applied="user">Default Domain Policy</);
  assert.deepEqual(tab.seen(), ['gp-results:NS-LT-0215']);
  const cmd = directory();
  let out = cmd.ps('gpresult /s NS-LT-0215 /r');
  assert.match(out, /RSOP data for NORTHSTAR\\rshah on NS-LT-0215/);
  assert.match(out, /COMPUTER SETTINGS[\s\S]*Applied Group Policy Objects\n\s+-+\n\s+Default Domain Policy\n\s+Workstation Security Baseline\n/);
  assert.match(out, /filtered out\n\s+-+\n\s+N\/A/);
  assert.match(out, /USER SETTINGS\n-+\n\s+CN=Ravi Shah,OU=Sales,OU=Users,DC=northstar,DC=example[\s\S]*Applied Group Policy Objects\n\s+-+\n\s+Default Domain Policy\n\n/);
  assert.deepEqual(cmd.seen(), tab.seen(), 'the command earns the same key');
  cmd.run("hdState.selectedComputer = 'NS-LT-0145'");
  out = cmd.ps('gpresult /r');
  assert.match(out, /CN=NS-LT-0145,CN=Computers[\s\S]*Applied Group Policy Objects\n\s+-+\n\s+Default Domain Policy\n\n[\s\S]*USER SETTINGS[\s\S]*Applied Group Policy Objects\n\s+-+\n\s+Default Domain Policy\n\n/);
  assert.doesNotMatch(out, /Operations Drive Mapping|link out of scope/);
  cmd.run("hdState.selectedComputer = 'NS-LT-0042'");
  assert.match(cmd.ps('gpresult /r'), /Operations Drive Mapping\n\s+Filtering:  Denied \(Security\)/);
  assert.match(cmd.ps('gpresult'), /Invalid Syntax\. Type "gpresult \/r"/);
  // Only the two forms the shell answers move Last applied.
  assert.match(cmd.ps('gpupdate /target:computer'), /outside this training shell/);
  assert.equal(cmd.seen().includes('gpupdate:NS-LT-0042'), false);
  assert.match(cmd.ps('gpresult /s NS-NOPE /r'), /RPC server is unavailable/);
  // gpupdate /force: today's answer, and the computer's Last applied moves.
  cmd.run("hdState.selectedComputer = 'NS-LT-0215'");
  assert.equal(cmd.ps('gpupdate /force'), 'Updating policy...\n\nComputer Policy update has completed successfully.\nUser Policy update has completed successfully.');
  assert.ok(cmd.seen().includes('gpupdate:NS-LT-0215'));
  cmd.run("hdGpResultsOpen('NS-LT-0215')");
  assert.match(cmd.view('helpdesk/group-policy'), /data-hd-gp-last-applied>Wed 08:40</);
  assert.match(cmd.ps('gpresult /r'), /Last time Group Policy was applied: Wed 08:40/);
}

// DNS: five record types, a filter, and Resolve-DnsName.
function testDns() {
  const tab = directory();
  const page = tab.view('helpdesk/dns');
  for (const [name, type] of [['files', 'A'], ['files', 'AAAA'], ['purchasing', 'CNAME'], ['@', 'MX'], ['@', 'TXT']]) assert.match(page, new RegExp(`data-hd-dns-record="${name}:${type}"`), `${name} ${type}`);
  assert.match(page, /v=spf1 TEST -all/);
  assert.match(page, /SPF, DKIM and DMARC/);
  assert.ok(tab.seen().includes('dns-zone'));
  assert.ok(tab.seen().includes('dns-record:@:mx'.replace('mx', 'MX')));
  tab.run("hdDnsSetType('MX')");
  const mx = tab.view('helpdesk/dns');
  assert.match(mx, /data-hd-dns-record="@:MX"/);
  assert.doesNotMatch(mx, /data-hd-dns-record="files:A"/);
  const cmd = directory();
  assert.match(cmd.ps('Resolve-DnsName purchasing.northstar.example'), /purchasing\.northstar\.example\s+CNAME[\s\S]*ns-app01\.northstar\.example/);
  assert.deepEqual(cmd.seen(), ['dns-record:purchasing:CNAME']);
  assert.match(cmd.ps('Resolve-DnsName northstar.example -Type TXT'), /TXT\s+3600\s+Answer\s+v=spf1 TEST -all/);
  assert.match(cmd.ps('Resolve-DnsName files -Type AAAA'), /fd00::30/);
  assert.ok(tab.seen().includes('dns-record:files:AAAA') && cmd.seen().includes('dns-record:files:AAAA'), 'screen and command record the same record key');
  assert.match(cmd.ps('Resolve-DnsName nothing'), /DNS name does not exist/);
  assert.doesNotMatch(sim({ url: proveUrl('its-01'), withTest: false }).view('helpdesk/dns'), /SPF/);
}

// DHCP: leases, a reservation, an exclusion range and the VLAN per scope.
function testDhcp() {
  const tab = directory();
  let page = tab.view('helpdesk/dhcp');
  for (const name of ['Corporate Clients', 'Finance', 'Warehouse', 'Guest Wi-Fi']) assert.match(page, new RegExp(`data-hd-dhcp-scope="${name}"[\\s\\S]*?hdDhcpOpen`));
  assert.doesNotMatch(page, /APIPA investigation/);
  assert.deepEqual(tab.seen(), []);
  tab.run("hdDhcpOpen('Warehouse')");
  page = tab.view('helpdesk/dhcp');
  assert.match(page, /data-hd-dhcp-detail="Warehouse"[\s\S]*NS-DHCP01[\s\S]*VLAN 30 · 78% used/);
  assert.match(page, /data-hd-dhcp-lease="TEST-CLOCK"[\s\S]*10\.20\.30\.142[\s\S]*00-11-22-33-44-55[\s\S]*Today 06:40/);
  assert.match(page, /data-hd-dhcp-reservation="NS-WH-LABEL01"[\s\S]*10\.20\.30\.60/);
  assert.match(page, /data-hd-dhcp-exclusion="10\.20\.30\.50"[\s\S]*10\.20\.30\.59/);
  assert.deepEqual(tab.seen(), ['dhcp-scope:Warehouse']);
  tab.run("hdDhcpOpen('Guest Wi-Fi')");
  page = tab.view('helpdesk/dhcp');
  assert.match(page, /data-hd-dhcp-detail="Guest Wi-Fi"[\s\S]*VLAN 90 · 95% used · 12 free[\s\S]*Lease list not shown for this scope \(209 in use\)[\s\S]*No reservations[\s\S]*No exclusions/);
  assert.match(page, /<th>Lease obtained<\/th>/);
  tab.run("hdDhcpOpen('No such scope')");
  assert.equal(tab.run('hdState.dhcpScope'), 'Guest Wi-Fi');
}

// The four typed lines and the optional server lines, with the same keys
// as their screens.
function testServerLines() {
  const tab = directory();
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler'), /Running\s+Spooler\s+Print Spooler/);
  assert.deepEqual(tab.seen(), ['services:NS-PRINT01', 'service:NS-PRINT01:Spooler']);
  const screen = directory();
  screen.run("hdServerOpen('NS-PRINT01', '#/helpdesk/server-services')"); screen.view('helpdesk/server-services');
  assert.deepEqual(screen.seen(), tab.seen(), 'Services screen and Get-Service earn the same keys');
  assert.match(tab.ps('Get-Service -ComputerName ns-print01.northstar.example -Name spooler'), /Running/);
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Nope'), /Cannot find any service with service name 'Nope'/);
  let out = tab.ps('Test-NetConnection NS-FILE01 -Port 445');
  assert.match(out, /ComputerName\s+: NS-FILE01\nRemoteAddress\s+: 10\.20\.0\.30\nRemotePort\s+: 445/);
  assert.match(out, /TcpTestSucceeded : True/);
  assert.ok(tab.seen().includes('port:NS-FILE01:445'));
  assert.match(tab.ps('Test-NetConnection NS-FILE01 -Port 80'), /TcpTestSucceeded : False/);
  // The open ticket's state decides: spooler Stopped, file server Offline.
  tab.open('HD-9804');
  assert.match(tab.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler'), /Stopped\s+Spooler/);
  out = tab.ps('Test-NetConnection NS-FILE01 -Port 445');
  assert.match(out, /WARNING: TCP connect to \(NS-FILE01 : 445\) failed/);
  assert.match(out, /TcpTestSucceeded : False/);
  // A server with no state: today's answers.
  assert.match(tab.ps('Test-NetConnection NS-APP01 -Port 443'), /purchasing\.northstar\.example/);
  // The student's own laptop decides first when its state lists the target.
  const laptop = directory();
  laptop.open('HD-9806');
  laptop.run("hdState.selectedComputer = 'NS-LT-0244'");
  const fromLaptop = laptop.ps('Test-NetConnection NS-FILE01 -Port 445');
  assert.match(fromLaptop, /RemoteAddress\s+: NS-FILE01[\s\S]*TcpTestSucceeded : False/, 'answered from the laptop (Module 4 behaviour)');
  assert.equal(laptop.seen().includes('port:NS-FILE01:445'), false);
  // Optional lines: shares, volumes, events.
  const cmd = directory();
  assert.match(cmd.ps('Get-SmbShareAccess -Name TESTShare -CimSession NS-FILE01'), /TESTShare\s+\*\s+NORTHSTAR\\TEST-Share-Users\s+Allow\s+Change/);
  assert.match(cmd.ps('Get-CimInstance Win32_LogicalDisk -ComputerName NS-FILE01 -Filter "DeviceID=\'D:\'"'), /^D:\s+3\s+TEST data\s+536870912000\s+268435456000$/m);
  assert.doesNotMatch(cmd.ps('Get-CimInstance Win32_LogicalDisk -ComputerName NS-FILE01 -Filter "DeviceID=\'D:\'"'), /^C:/m);
  assert.match(cmd.ps('Get-WinEvent -ComputerName NS-FILE01 -LogName System -MaxEvents 5'), /Today 06:00\s+7036\s+Information\s+TEST running\./);
  assert.match(cmd.ps('Get-WinEvent -ComputerName NS-FILE01 -LogName "Directory Service"'), /There is not an event log on the NS-FILE01 computer/);
  assert.match(cmd.ps('Get-SmbShareAccess -Name Missing'), /No MSFT_SmbShare objects found/);
  assert.deepEqual(cmd.seen(), ['file-share:NS-FILE01:TESTShare:share', 'volumes:NS-FILE01', 'server-log:NS-FILE01:system', 'server-event:NS-FILE01:system:7036']);
  const screens = directory();
  screens.run("hdServerOpen('NS-FILE01', '#/helpdesk/file-server'); hdFileSet({ share:'TESTShare', tab:'share' })"); screens.view('helpdesk/file-server');
  screens.run("hdServerOpen('NS-FILE01')"); screens.view('helpdesk/server-manager');
  screens.run("hdServerOpen('NS-FILE01', '#/helpdesk/server-events'); hdServerLogOpen(0)"); screens.view('helpdesk/server-events');
  for (const key of cmd.seen()) assert.ok(screens.seen().includes(key), `screen earns ${key}`);
  // Get-Help lists the lines only where they answer, and never in a Prove It.
  assert.match(cmd.ps('Get-Help'), /Servers: Get-Service -ComputerName[\s\S]*Directory \(read-only\): Get-ADUser/);
  assert.doesNotMatch(sim().ps('Get-Help'), /Directory \(read-only\)|Servers: Get-Service -ComputerName/);
}

// A ticket raised from another stays out of the shift until it is raised.
function testRaiseRelatedIncident() {
  for (let round = 0; round < 8; round += 1) {
    const tab = directory();
    const ids = tab.run('hdState.tickets.map((t) => t.id)');
    assert.equal(ids.includes('HD-9802'), false, 'held until raised');
    assert.notEqual(tab.run('hdState.selectedTicketId'), 'HD-9802');
    assert.ok(tab.run('hdActiveSet()'), 'the set stays active');
  }
  const local = store();
  const tab = directory(local);
  // A reload before raising keeps it held, and the button still shows.
  const reloaded = directory(local);
  assert.equal(reloaded.run("hdState.tickets.some((t) => t.id === 'HD-9802')"), false, 'still held after a reload');
  assert.match(reloaded.open('HD-9801'), /data-hd-raise onclick/);
  assert.doesNotMatch(tab.open('HD-9803'), /data-hd-raise/);
  let page = tab.open('HD-9801');
  assert.match(page, /data-hd-raise-card[\s\S]*data-hd-raise onclick="hdRaiseIncident\('HD-9801'\)"[^>]*>Raise a related incident/);
  tab.run("hdRaiseIncident('HD-9801')");
  assert.equal(tab.run('hdState.selectedTicketId'), 'HD-9802');
  assert.equal(tab.ctx.location.hash, '#/helpdesk/ticket');
  const raised = JSON.parse(tab.run("JSON.stringify(hdTicketById('HD-9802'))"));
  assert.equal(raised.parentId, 'HD-9801');
  assert.equal(raised.raisedFrom, 'HD-9801');
  assert.equal(raised.createdTimestamp, '2026-08-19T08:40:00.000Z', 'created at the shift clock');
  assert.equal(raised.status, 'New');
  assert.equal(raised.priority, '', 'no priority until the student sets Impact and Urgency');
  assert.ok(tab.run('hdActiveSet()'), 'still the set');
  page = tab.view('helpdesk/ticket');
  assert.match(page, /data-hd-raised-from="HD-9801"/);
  assert.match(page, /hd-rewrite/, 'the record opens for the student to write');
  assert.match(tab.open('HD-9801'), /data-hd-raised="HD-9802"/);
  assert.doesNotMatch(tab.view('helpdesk/ticket'), /data-hd-raise onclick/);
  assert.deepEqual(JSON.parse(tab.run("JSON.stringify(hdTicketById('HD-9801').consoleState.actions.map((a) => a.id))")), ['incident-raised']);
  assert.match(tab.run("hdTicketById('HD-9801').troubleshootingHistory.map((h) => h.action).join('|')"), /Raised INC0019802 as a related incident|Raised HD-9802 as a related incident/);
  // Raising again opens the same record; nothing is added.
  tab.run("hdRaiseIncident('HD-9801')");
  assert.equal(tab.run("hdState.tickets.filter((t) => t.id === 'HD-9802').length"), 1);
  // The student's triage and writing save, and survive a reload.
  tab.run("const t = hdTicketById('HD-9802'); t.impact = '2'; t.urgency = '2'; t.priority = hdMatrixPriority('2', '2'); t.assignmentGroup = 'Server & Identity'; hdConsoleState(t).rewrite = { short:'TEST scope at 95%', description:'TEST', missing:[] }; hdSave()");
  const again = directory(local);
  const kept = JSON.parse(again.run("JSON.stringify(hdTicketById('HD-9802'))"));
  assert.equal(kept.raisedFrom, 'HD-9801');
  assert.equal(kept.priority, 'P3');
  assert.equal(kept.consoleState.rewrite.short, 'TEST scope at 95%');
  // What the coach saves with the attempt (hdCoachConsoleWork reads this).
  const progress = JSON.parse(again.run("JSON.stringify(hdConsoleProgress('HD-9802'))"));
  assert.deepEqual([progress.matrix.impact, progress.matrix.urgency, progress.matrix.priority, progress.matrix.assignmentGroup], ['2', '2', 'P3', 'Server & Identity']);
  assert.equal(again.run("hdState.tickets.filter((t) => t.id === 'HD-9802').length"), 1, 'a reload adds no second copy');
  // A coached set (hdUseTicketSet, saved under the shared key): the same.
  const coachedLocal = store();
  const coached = sim({ local: coachedLocal });
  assert.equal(coached.run("hdUseTicketSet('test-coached-raise')"), true);
  assert.deepEqual(JSON.parse(coached.run('JSON.stringify(hdState.tickets.map((t) => t.id))')), ['HD-9801']);
  assert.equal(coached.run('hdState.selectedTicketId'), null);
  assert.equal(sim({ local: coachedLocal }).run("hdState.tickets.some((t) => t.id === 'HD-9802')"), false, 'held after a reload');
  coached.open('HD-9801'); coached.run("hdRaiseIncident('HD-9801')");
  assert.equal(coached.run("hdTicketById('HD-9802').createdTimestamp"), '2026-08-19T08:00:00.000Z');
  assert.ok(coached.run('hdActiveSet()'), 'the coached set stays active');
  const coachedAgain = sim({ local: coachedLocal });
  assert.deepEqual(JSON.parse(coachedAgain.run('JSON.stringify(hdState.tickets.map((t) => t.id))')), ['HD-9801', 'HD-9802']);
  assert.ok(coachedAgain.run('hdActiveSet()'), 'still the coached set after a reload');
  // A resolved source offers no raise.
  const closed = directory();
  closed.run("hdTicketById('HD-9801').status = 'Resolved'");
  assert.doesNotMatch(closed.open('HD-9801'), /data-hd-raise onclick/);
  closed.run("hdRaiseIncident('HD-9801')");
  assert.equal(closed.run("hdState.tickets.some((t) => t.id === 'HD-9802')"), false);
  // Never in a Prove It.
  const prove = sim({ url: proveUrl('its-01') });
  assert.equal(prove.run("hdRaiseConfig({ id:'HD-9801' })"), null);
}

// The catalog item: off unless a ticket lists it.
function testReservationCatalogItem() {
  const plain = sim({ withTest: false });
  const item = JSON.parse(plain.run("JSON.stringify(hdReservationItem({ devices:['TEST-A'], macs:['00-00'], addresses:['10.0.0.1'] }))"));
  assert.equal(item.name, 'Network device reservation');
  assert.match(item.approval, /^Not required/);
  assert.deepEqual(item.fields.map((f) => f.id), ['device', 'mac', 'address', 'scope']);
  assert.deepEqual(item.fields[3].options, ['Corporate Clients', 'Finance', 'Warehouse', 'Guest Wi-Fi']);
  const tab = setSim('test-convert');
  const page = tab.open('HD-9805');
  assert.match(page, /Convert to Request[\s\S]*<option >Network device reservation<\/option>|Convert to Request[\s\S]*<option>Network device reservation<\/option>/);
}

// A Prove shift with a directory block: neutral wording, one source per screen.
function testProveShift() {
  const inject = `{ const shift = HD_PROVE_SHIFTS['its-01']; shift.directory = ${JSON.stringify(DIRECTORY)}; shift.servers = ${JSON.stringify(SERVERS)}; }`;
  const prove = sim({ url: proveUrl('its-01'), before: inject, withTest: false });
  assert.doesNotMatch(prove.ad('users'), /hdAdAction/, 'read-only in a Prove shift too');
  prove.run("hdOpenUser('u-1004')"); prove.ad('users');
  prove.run("hdAdGroupOpen('GG-HR-Contributors')"); assert.doesNotMatch(prove.ad('groups'), /who can do this/);
  prove.run("hdAdOpenComputer('NS-LT-0215')");
  prove.run("hdGpResultsOpen('NS-LT-0215')"); assert.doesNotMatch(prove.view('helpdesk/group-policy'), /callout info/);
  assert.doesNotMatch(prove.view('helpdesk/dns'), /SPF, DKIM/);
  prove.run("hdDhcpOpen('Warehouse')"); assert.doesNotMatch(prove.view('helpdesk/dhcp'), /One scope serves one VLAN/);
  prove.ps('Get-Service -ComputerName NS-PRINT01 -Name Spooler');
  assert.doesNotMatch(prove.ps('Get-CimInstance Win32_LogicalDisk -ComputerName NS-FILE01'), /1 GB is/);
  assert.doesNotMatch(prove.ps('Get-Help'), /Directory \(read-only\)/);
  const opened = [...prove.run('hdState.prove.opened')].filter((s) => !s.startsWith('screen:'));
  // The same keys as Practice, so a screen and its command earn the same.
  const records = ['dc01:A', 'dc02:A', 'files:A', 'print:A', 'purchasing:CNAME', 'vpn:A', 'legacy-erp:A', 'files:AAAA', '@:MX', '@:TXT'].map((r) => `dns-record:${r}`);
  assert.deepEqual(opened, ['ad-user:u-1004', 'ad-user-groups:u-1004', 'ad-group:GG-HR-Contributors', 'ad-computer:NS-LT-0215', 'gp-results:NS-LT-0215', 'dns-zone', ...records, 'dhcp-scope:Warehouse', 'services:NS-PRINT01', 'service:NS-PRINT01:Spooler', 'volumes:NS-FILE01']);
  assert.equal(prove.run('hdState.serverSeen'), undefined);
  // Each evidence row in the Prove log names its own evidence.
  const labels = JSON.parse(prove.run("JSON.stringify((hdState.prove.events || []).filter((e) => e.type === 'evidence_opened' && !String(e.source).startsWith('screen:')).map((e) => e.label))"));
  assert.equal(labels.length, opened.length);
  assert.equal(new Set(labels).size, labels.length, `distinct labels: ${labels.join(' | ')}`);
  // No teaching hint in a Prove It's error lines.
  for (const command of ['Get-SmbShareAccess', 'Get-WinEvent -ComputerName NS-FILE01', 'gpresult', 'Resolve-DnsName']) assert.doesNotMatch(prove.ps(command), /for example|Type "gpresult/, command);
}

// An older save with none of the new keys loads, and new state reloads.
function testReloadKeepsState() {
  const local = store();
  const tab = directory(local);
  tab.run("hdDhcpOpen('Warehouse'); hdGpResultsOpen('NS-LT-0215'); hdDnsSetType('TXT'); hdAdGroupOpen('GG-HR-Readers')");
  const again = directory(local);
  assert.match(again.view('helpdesk/dhcp'), /data-hd-dhcp-detail="Warehouse"/);
  assert.match(again.view('helpdesk/group-policy'), /data-hd-gp-results="NS-LT-0215"/);
  assert.match(again.view('helpdesk/dns'), /aria-pressed="true" data-hd-dns-type="TXT"/);
  assert.match(again.ad('groups'), /data-hd-group-members="GG-HR-Readers"/);
  // Opening another ticket starts it with nothing open, so nothing read on
  // one ticket is recorded on the next.
  const move = directory();
  move.open('HD-9803');
  move.run("hdOpenUser('u-1004'); hdAdGroupOpen('GG-HR-Readers'); hdGpResultsOpen('NS-LT-0215'); hdDhcpOpen('Warehouse')");
  move.ad('users'); move.ad('groups'); move.view('helpdesk/group-policy'); move.view('helpdesk/dhcp');
  move.open('HD-9801');
  move.ad('users'); move.ad('groups'); move.view('helpdesk/group-policy'); move.view('helpdesk/dhcp');
  assert.deepEqual(move.run("hdTicketById('HD-9801').consoleState.serverSeen || []").length, 0);
  assert.equal(move.run("hdTicketById('HD-9803').consoleState.serverSeen.length"), 5);
  const old = store();
  directory(old);
  old.map.forEach((value, key) => { const saved = JSON.parse(value); if (saved && saved.version === 1) { ['dhcpScope', 'gpResultsFor', 'gpRefresh', 'dnsType', 'adGroup', 'adUserOpened'].forEach((k) => delete saved[k]); old.map.set(key, JSON.stringify(saved)); } });
  const reloaded = directory(old);
  assert.match(reloaded.view('helpdesk/dhcp'), /data-hd-dhcp-scopes/);
  assert.match(reloaded.view('helpdesk/group-policy'), /data-hd-gp-results-card/);
}

const tests = [testOldTicketsTurnNothingOn, testReadOnlyDirectory, testGroupMembers, testComputerOu, testGroupPolicyResults, testDns, testDhcp,
  testServerLines, testRaiseRelatedIncident, testReservationCatalogItem, testProveShift, testReloadKeepsState];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m07-console-b: ${tests.length} passed`);

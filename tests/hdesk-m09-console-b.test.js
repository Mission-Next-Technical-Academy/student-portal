'use strict';
/* Help Desk simulator: Module 09 (key its-04), console B (ui/helpdesk.js
 * "Network closet, VPN client and domain join"): the network closet screen
 * (console.closet), the two Network Operations evidence card kinds
 * (console.evidence kind 'cable-test' and 'circuit'), a caller question or
 * ticket action that moves a cable (link), the Northstar VPN Client
 * (machine.vpnClient), the domain join dialog on Settings › System › About
 * (machine.domain) with Add-Computer, and the phone's Wi-Fi list
 * (phone.wifiNetworks).
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST- names), never in ui/helpdesk-data.js. No Module 09 content. Every
 * older ticket, set and Prove shift must look and behave as before: the
 * screens this part touches that console A's pins don't cover (Active
 * Directory › Computers, each phone's Wi-Fi app, Get-ADComputer and
 * Add-Computer) are pinned against master. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
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
  let seed = 9;
  const math = Object.create(Math);
  math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return math;
}
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store(), before = '' } = {}) {
  const u = new URL(url);
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math: seededMath(), Date: FixedDate,
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
  if (withTest) addTestData(ctx);
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, run,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    // Through the PowerShell screen, as a student types it (the password guard runs).
    shell: (command) => { const real = ctx.document.getElementById; ctx.document.getElementById = (id) => (id === 'hd-ps-input' ? { value: command } : null); try { run('hdRunPowerShell({ preventDefault() {} })'); } finally { ctx.document.getElementById = real; } return run("VIEWS['helpdesk/powershell']()"); },
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}; hdState.machineView = { computer:${j(computer)} }`),
    // A form's fields, by id, for one call.
    withFields: (fields, code) => { const real = ctx.document.getElementById; ctx.document.getElementById = (id) => (id in fields ? { value: fields[id] } : null); try { return run(code); } finally { ctx.document.getElementById = real; } },
  };
}
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m09b#/helpdesk/tickets`;

/* ---------- Master's output, pinned ----------
 * Every older shift: for each ticket opened in turn, Active Directory ›
 * Computers and each phone's Wi-Fi app; on the shift's own computer and
 * every computer with machine state, Get-ADComputer and Add-Computer, with
 * the machine state after each. Computed on master at a159e72 with
 * `node tests/hdesk-m09-console-b.test.js --print-pins`. */
const PIN_COMMANDS = ['Get-ADComputer', 'Get-ADComputer -Filter *', 'Add-Computer -DomainName northstar.example', 'Add-Computer -DomainName northstar.example -OUPath "OU=Sales,OU=Workstations"'];
const MODULE_9_SETS = ['its-04', 'its-04-guided'];
function shiftsOf(plain) {
  const shifts = [{ name: 'shared', make: () => sim({ withTest: false }) }];
  Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `practice:${key}`, make: () => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, withTest: false }) }));
  Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `coached:${key}`, make: () => { const tab = sim({ withTest: false }); assert.equal(tab.run(`hdUseTicketSet(${JSON.stringify(key)})`), true); return tab; } }));
  Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `prove:${key}`, make: () => sim({ url: proveUrl(key), withTest: false }) }));
  return shifts;
}
function pinsOf(make) {
  const tab = make();
  const tickets = tab.run('hdState.tickets.map((t) => t.id)');
  const screens = [];
  for (const id of tickets) {
    tab.open(id);
    tab.run("hdState.adTab = 'computers'");
    screens.push(sha(tab.view('helpdesk/active-directory')));
    const phones = tab.run('(hdCloud() ? Object.keys(hdCloud().phones) : [])');
    for (const phone of phones) {
      tab.run(`hdState.cloudView = { phone:${JSON.stringify(phone)}, phoneApp:'wifi' }`);
      screens.push(sha(tab.view('helpdesk/phone')));
    }
  }
  const first = make();
  const home = first.run('hdState.selectedComputer');
  const computers = [...new Set([home, ...first.run('Object.keys(hdState.machines || {})')])];
  const commands = [];
  for (const computer of computers) {
    const each = make();
    each.on(computer);
    for (const command of PIN_COMMANDS) {
      commands.push(sha(each.ps(command)));
      commands.push(sha(each.run('JSON.stringify([hdState.machines || {}, hdState.computerOverrides || {}])')));
    }
  }
  return { screens: sha(screens.join(',')), commands: sha(commands.join(',')) };
}
function allPins() {
  const plain = sim({ withTest: false });
  const pins = {};
  for (const shift of shiftsOf(plain)) pins[shift.name] = pinsOf(shift.make);
  return pins;
}
if (process.argv.includes('--print-pins')) {
  console.log(JSON.stringify(allPins(), null, 1));
  process.exit(0);
}
const PINNED = {
  shared: { screens: '4931eb4c009be7bde58dbb72fb1f3b03267a75d98a24dd171b6a7ab7de3c83b7', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'practice:its-01': { screens: 'a2d800d0b2559ec5b9543efe1be0a4578416665de24b0249f0911b79509c2a1d', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'practice:its-10': { screens: 'f7ae1f63dc2ad72bf738fd73ef41de402410f0b706bf587fcaa8b2b27eb6ac6e', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'practice:its-11': { screens: '3a84886e39275dd03729d64eca04f6b10919db55878d34f9ca6e8b17ef44a240', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'practice:its-02': { screens: 'a2d800d0b2559ec5b9543efe1be0a4578416665de24b0249f0911b79509c2a1d', commands: '49eb0f5ff60ac54338aa50d92487bfc397f9cacb1b09c40ee5c989bf5f2a7f3d' },
  'practice:its-03': { screens: '78ef03d77373b69e7952e7c57423bcdf2259e017316b72c180747f385ea45a78', commands: 'ceda0e15c80e1e8e6bb69fef4ad283f2f5164395577e8624d4848fd784f3b1a8' },
  'practice:its-07': { screens: '3a84886e39275dd03729d64eca04f6b10919db55878d34f9ca6e8b17ef44a240', commands: 'a9278e5a32ca47ce596eed9916292dccfb514412df447516b81d7b8fee06c69d' },
  'practice:its-05': { screens: 'efb42682c5180e5384ffc52364a478f64a798fe0bb0baf4207df53f2f6008239', commands: 'c683e439b135aecb2436b3b4b60d31afb8cf232d6e9731a1b4d1c4ed939dbcd8' },
  'practice:its-06': { screens: '83fca3ffa2dd04459caeabfb4d62ebdd0feab85bf5c86a0a01c9be7a04177892', commands: '478f3a894aed682f0f335205c54b0ed02505ef80b63e4fda2edcb9424eb0762e' },
  'coached:its-10-guided': { screens: 'f979da86b0a9d4e9ee97d450c18ef7c09efb175da28ae55c1696e429afc2fa03', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'coached:its-11-guided': { screens: '10a1bedb3d5d73a9c2be0ea0f4707ee0e0e51c25a91e4851151916be113246a9', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'coached:its-02-guided': { screens: '238e4b68a2b76ad93f5ecd1fdc835d0373afcf9f3e5758f456feacd3ff38af4d', commands: '7aa3fdcfdc70af7d8eae42f11e47d67ffdba9c6eb818fb26a02f8087814e8b8b' },
  'coached:its-02-server': { screens: '10a1bedb3d5d73a9c2be0ea0f4707ee0e0e51c25a91e4851151916be113246a9', commands: '72f5acf046d994a346a9e280448cad1ee2a14c51440d536ae97bd0601bc6b3a9' },
  'coached:its-03-guided': { screens: '3ac9e85476a372154a6ef494fc5d9b072bdf12aeaf2d23cf6260bce2a90ecd0f', commands: '3d7de878129c7ae369f1159fb7536c1ab32278b57e29e39bc32112e4f311960a' },
  'coached:its-07-guided': { screens: '10a1bedb3d5d73a9c2be0ea0f4707ee0e0e51c25a91e4851151916be113246a9', commands: '3b8dfc4bb0f34bceed673474ec9bd8be2e87c70bf9f2eb85b800054fbaaa7dab' },
  'coached:its-05-guided': { screens: '11b47c6fbfedd0d8f6cabce878c8db6b6fe8d47f238afa90d80fe051ecf332bc', commands: '081186d923070a5e9393cf641ca056f50eb73931ad23c1a902b3b96aaf44914f' },
  'coached:its-06-guided': { screens: '74101fc0017a6e010f12b83785a714cecba9f95bdcae8764c9677f4127b542b9', commands: 'd667cc78dc2fe3cd6e108d319d93bb4103375fd0c65b6b079f4cb3984913eac8' },
  'coached:its-06-extension': { screens: '11b47c6fbfedd0d8f6cabce878c8db6b6fe8d47f238afa90d80fe051ecf332bc', commands: '62374d44c806191c88b1ee9451db306736295a18b7b6bba29c429d0ea2e56901' },
  'prove:its-01': { screens: '838baab520559cdcd3876e15b60bd326d39e98db1fbf486fc8a37b316ac29b71', commands: '821e2f93e59c160ef29a62576c950c23cb90c6aef60b8da967d27935579ab719' },
  'prove:its-10': { screens: '68d0ae74a409b8ffaeca65675667138b8c25f07ac588955d93dadad071dd11b6', commands: '7547fadb891464b8f4b14682791a47bfa2e733fccf294e12aef14edf901cf312' },
  'prove:its-11': { screens: 'deae72fb615706f299220b78314daee042b72cefeb3abbf42c564972e846c12c', commands: 'f8ff5da18d7befbe0b1eea6e83d2f8dba25688e3c06fb59f2fcde39b2151c66d' },
  'prove:its-02': { screens: '90113273076fe1b9c5dafd70df5f64b956ebfa275fac9ee78b23e137d1ed5072', commands: '478c8b183e6c7c454779304acdefa089f440ec68ac315e898fa33732a96c322f' },
  'prove:its-03': { screens: 'f7d3bd96ce564bfb0b5682be9005e8e7b22e3a2c579f7056ee05be84860a1b51', commands: 'd78b8aae4fb5acd6cc2cbe88b3958e0bc019978a0127bbc48eec31f7803a33a7' },
  'prove:its-07': { screens: '8244617407dd642f11506357eed946ca2ebb0006c41f9cb1cb9797486b5071cd', commands: '66d8d95684beb7aa77934c0f270953c8842996a06eb75d63155d6eefb581362d' },
  'prove:its-05': { screens: 'a3cf584f1dff8289e453dda26d4f4ed5aee5b60c8d1297747a327c6164a2445c', commands: '6e5e9768636bd55501e7026a6c142c9ac02524dcc5c7560f3ef5b1f948056464' },
  'prove:its-06': { screens: '167534d7fab9fbe318a5cc8597d37df13288a738195e051b561d6e9ce4486c01', commands: '6e5e9768636bd55501e7026a6c142c9ac02524dcc5c7560f3ef5b1f948056464' },
};

function testOldShiftsUnchanged() {
  const plain = sim({ withTest: false });
  for (const shift of shiftsOf(plain)) {
    const pins = PINNED[shift.name];
    assert.ok(pins, `${shift.name} has pins`);
    assert.deepEqual(pinsOf(shift.make), pins, `${shift.name} unchanged`);
  }
}

/* ---------- Test-only tickets and sets ---------- */
const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const CORP_LEASE = (address) => ({ address, mask: '255.255.255.0', gateway: '10.20.10.1', dnsServers: ['10.20.0.10', '10.20.0.11'], dhcpServer: '10.20.0.20', leaseDays: 8 });
const CORP_IP = (address) => ({ dhcp: true, ...CORP_LEASE(address), obtained: '2026-08-20T07:00:00Z', expires: '2026-08-28T07:00:00Z' });
const ROUTES = { corp: [{ name: 'TEST-fw', address: '10.20.255.1' }, { address: '203.0.113.1', ms: 9 }] };
const PUBLIC = { 'www.example.com': '93.184.215.14' };
const ETH = (mac, extra) => ({ name: 'Ethernet', kind: 'Ethernet', description: 'TEST Ethernet Controller', speed: '1 Gbps', mac, ...extra });
// TEST-WS-11: a desk PC on a dead jack: no link, an APIPA address kept.
const DEAD_JACK = { network: { adapters: [ETH('3C-52-82-00-00-11', { media: 'Disconnected', ip: { dhcp: true, address: '169.254.33.10', mask: '255.255.0.0', gateway: '', dnsServers: [] }, lease: CORP_LEASE('10.20.10.141') })], routes: ROUTES, publicDns: PUBLIC } };
// TEST-LT-12: outside the office, VPN adapter present but down.
const HOME_WIFI = (mac) => ({ name: 'Wi-Fi', kind: 'Wi-Fi', description: 'TEST Wi-Fi 6 Adapter', media: 'Connected', mac, ip: { dhcp: true, address: '192.168.0.34', mask: '255.255.255.0', gateway: '192.168.0.1', dnsServers: ['192.168.0.1'], dhcpServer: '192.168.0.1' },
  wifi: { ssid: 'TEST-Home', protocol: 'Wi-Fi 5 (802.11ac)', security: 'WPA2-Personal', band: '5 GHz', channel: 40, signal: 75, linkRate: 433, known: [{ ssid: 'TEST-Home', security: 'WPA2-Personal' }] } });
const AT_HOME = { network: { adapters: [HOME_WIFI('3C-52-82-00-00-12'), { name: 'TEST VPN', kind: 'VPN', description: 'TEST VPN Adapter', media: 'Disconnected', mac: '00-FF-00-00-00-12', ip: { dhcp: true, address: '', dnsServers: [] } }], routes: { outside: [{ address: '100.64.0.1', ms: 8 }] }, publicDns: PUBLIC },
  vpnClient: { gateway: 'vpn.northstar.example', adapter: 'TEST VPN', address: '10.20.250.37', lastConnected: 'Never' } };
// TEST-LT-13: at home with no VPN adapter yet, no approval step.
const AT_HOME_BARE = { network: { adapters: [HOME_WIFI('3C-52-82-00-00-13')], routes: { outside: [{ address: '100.64.0.1', ms: 8 }] }, publicDns: PUBLIC }, vpnClient: { address: '10.20.250.38', approval: false } };
// TEST-LT-14: a new laptop on the bench, wired, company DNS, not joined yet.
const BENCH = { network: { adapters: [ETH('3C-52-82-00-00-14', { media: 'Connected', ip: CORP_IP('10.20.10.203'), lease: CORP_LEASE('10.20.10.203') })], routes: ROUTES, publicDns: PUBLIC },
  domain: { joined: false, workgroup: 'WORKGROUP' }, computer: { ou: '', trust: 'Not joined' } };
// TEST-LT-15: a new laptop on a guest Wi-Fi, its cable not plugged in yet.
const ON_GUEST = { network: { adapters: [
  ETH('3C-52-82-00-00-15', { media: 'Disconnected', ip: { dhcp: true, address: '', dnsServers: [] }, lease: CORP_LEASE('10.20.10.209') }),
  { name: 'Wi-Fi', kind: 'Wi-Fi', description: 'TEST Wi-Fi 6 Adapter', media: 'Connected', mac: '3C-52-82-00-01-15', ip: { dhcp: true, address: '10.20.90.61', mask: '255.255.255.0', gateway: '10.20.90.1', dnsServers: ['10.20.90.1'], dhcpServer: '10.20.90.1' },
    wifi: { ssid: 'TEST-Guest', protocol: 'Wi-Fi 5 (802.11ac)', security: 'WPA2-Personal', band: '5 GHz', channel: 36, signal: 80, linkRate: 400, known: [{ ssid: 'TEST-Guest', security: 'WPA2-Personal' }] } }],
  routes: { guest: [{ address: '198.51.100.1', ms: 6 }], corp: ROUTES.corp }, publicDns: PUBLIC },
  domain: { joined: false }, computer: { ou: '', trust: 'Not joined' } };
// TEST-LT-16: a domain block and no network state (dcReachable decides).
const NO_NET_JOIN = { domain: { joined: false, ous: ['OU=Sales,OU=Workstations', 'CN=Computers'] }, computer: { ou: '', trust: 'Not joined' } };
// TEST-LT-17: network state and none of console B's keys.
const PLAIN_NET = { network: { adapters: [ETH('3C-52-82-00-00-17', { media: 'Connected', ip: CORP_IP('10.20.10.217'), lease: CORP_LEASE('10.20.10.217') })], routes: ROUTES, publicDns: PUBLIC } };
const CLOSET = { id: 'TEST-floor-2', floor: 'Floor 2', room: 'TEST closet', jacks: [
  { jack: 'TEST-14', location: 'TEST desk A', panelPort: '2-14', switch: 'TEST-SW', switchPort: null, link: 'green', vlan: 10 },
  { jack: 'TEST-15', location: 'TEST desk B', panelPort: '2-15', switch: 'TEST-SW', switchPort: 'Gi1/0/15', link: 'green', vlan: 10 },
  { jack: 'TEST-16', panelPort: '2-16', switch: 'TEST-SW', switchPort: 'Gi1/0/16', link: 'amber', vlan: 30 }] };
const EVIDENCE = [
  { id: 'jack', kind: 'cable-test', jack: 'TEST-14', panelPort: '2-14', tester: 'Pass, wires 1–8', switch: 'TEST-SW' },
  { id: 'jack-ok', kind: 'cable-test', jack: 'TEST-15', panelPort: '2-15', tester: 'Pass, wires 1–8', switch: 'TEST-SW', switchPort: 'Gi1/0/15' },
  { id: 'circuit', kind: 'circuit', primary: { name: 'Primary fiber circuit (TEST-ISP)', status: 'Down', since: '09:12' }, backup: { name: 'Cellular backup (5G)', status: 'Active', speed: 'about 40 Mbps', dataUsedPercent: 62 }, provider: 'Open' },
  { id: 'plain', title: 'TEST plain card', rows: [{ label: 'TEST label', value: 'TEST value' }] },
];
const PC = (name, user) => ({ name, user, os: 'Windows 11 Enterprise 24H2', ip: '10.20.10.99', ou: 'OU=Operations,OU=Workstations', trust: 'Healthy', bitlocker: 'Protected', lastSeen: '1 minute ago', health: 'Healthy' });
const at = (time) => `2026-08-20T${time}:00Z`;
const TICKETS = [
  base({ id: 'HD-9911', number: 'INC0019911', requester: 'Maya Chen', createdAt: at('08:35'), description: 'TEST dead jack', console: {
    closet: CLOSET, evidence: EVIDENCE, machines: { 'TEST-WS-11': DEAD_JACK },
    caller: { name: 'Maya Chen', questions: [{ id: 'move', text: 'TEST move the cable to TEST-15', reply: 'TEST done, the light is on.', link: { computer: 'TEST-WS-11', adapter: 'Ethernet', jack: 'TEST-15' } }] } } }),
  base({ id: 'HD-9912', number: 'INC0019912', requester: 'Maya Chen', createdAt: at('08:36'), description: 'TEST at home', console: { machines: { 'TEST-LT-12': AT_HOME, 'TEST-LT-13': AT_HOME_BARE } } }),
  base({ id: 'HD-9914', number: 'INC0019914', requester: 'Maya Chen', createdAt: at('08:37'), description: 'TEST join', console: { machines: { 'TEST-LT-14': BENCH, 'TEST-LT-16': NO_NET_JOIN } } }),
  base({ id: 'HD-9915', number: 'INC0019915', requester: 'Maya Chen', createdAt: at('08:38'), description: 'TEST join on guest', console: { machines: { 'TEST-LT-15': ON_GUEST },
    actions: [{ id: 'bench-cable', text: 'TEST plug into the bench port', feedback: 'TEST plugged in.', link: { computer: 'TEST-LT-15', adapter: 'Ethernet', renew: true } }] } }),
  // None of console B's keys: an older ticket's shape.
  base({ id: 'HD-9917', number: 'INC0019917', requester: 'Maya Chen', createdAt: at('08:39'), description: 'TEST no new keys', console: { machines: { 'TEST-LT-17': PLAIN_NET },
    evidence: [{ id: 'plain', title: 'TEST plain card', rows: [{ label: 'TEST label', value: 'TEST value' }] }],
    caller: { name: 'Maya Chen', questions: [{ id: 'q', text: 'TEST question', reply: 'TEST reply' }] } } }),
];
const PHONES = { phones: {
  'TEST-PH-P': { label: 'TEST personal phone', user: 'u-1003', company: false, os: '17.6', status: { wifi: true, cellular: '5G', network: 'TEST-Home' },
    wifiNetworks: [{ ssid: 'TEST-Corp', security: 'WPA3-Enterprise' }, { ssid: 'TEST-Guest', security: 'WPA2-Personal' }, { ssid: 'TEST-Open', security: 'Open' }, { ssid: 'TEST-Home', security: 'WPA2-Personal' }] },
  'TEST-PH-C': { label: 'TEST company phone', user: 'u-1003', company: true, os: '17.6', pin: true, encrypted: true, status: { wifi: true, cellular: '5G', network: 'TEST-Guest' },
    wifiNetworks: [{ ssid: 'TEST-Corp', security: 'WPA3-Enterprise' }, { ssid: 'TEST-Guest', security: 'WPA2-Personal' }] },
  'TEST-PH-OLD': { label: 'TEST older phone', user: 'u-1003', company: false, os: '17.6', status: { wifi: true, cellular: '5G' } },
} };
const SETS = {
  'test-net-b': {
    title: 'Test console B', tickets: ['HD-9911', 'HD-9912', 'HD-9914', 'HD-9915', 'HD-9917'], now: '2026-08-20T08:40:00Z', cloud: PHONES,
    computers: ['TEST-WS-11', 'TEST-LT-12', 'TEST-LT-13', 'TEST-LT-14', 'TEST-LT-15', 'TEST-LT-16', 'TEST-LT-17'].map((name) => PC(name, 'Maya Chen')),
    directory: { readOnly: true },
  },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));`, ctx);
}
const net = (local) => sim({ url: 'https://academy.test/sim/?practice=test-net-b&student=stu-1#/helpdesk/tickets', local });
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const actions = (tab, id) => json(tab, `((hdTicketById(${JSON.stringify(id)}).consoleState || {}).actions || [])`);
const ids = (tab, id) => actions(tab, id).map((a) => a.id);
const seen = (tab, name) => json(tab, `(hdMachine(${JSON.stringify(name)}).seen || [])`);
const onPc = (id, name) => { const tab = net(); tab.open(id); tab.on(name); return tab; };
const adRows = (tab) => { tab.run("hdState.adTab = 'computers'"); return [...tab.view('helpdesk/active-directory').matchAll(/<tr data-hd-ad-computer="([^"]+)"><td><strong>[^<]*<\/strong><small>[^<]*<\/small><\/td><td>[^<]*<\/td><td><code>([^<]*)<\/code>/g)].map((m) => [m[1], m[2]]); };

// The closet: jacks, panel ports, switch ports, link lights and VLANs, read-only.
function testCloset() {
  const tab = net();
  const ticket = tab.open('HD-9911');
  assert.match(ticket, /data-hd-closet-card="TEST-floor-2"[\s\S]*?Network closet · Floor 2[\s\S]*?Network Operations · Read-only/);
  assert.doesNotMatch(ticket, /data-hd-closet-card[^>]*>[\s\S]*?· Opened/);
  tab.run("hdClosetOpen('HD-9911')");
  assert.equal(tab.ctx.location.hash, '#/helpdesk/network-closet');
  const view = tab.view('helpdesk/network-closet');
  assert.match(view, /<tr data-hd-jack="TEST-14" data-hd-link="off"><td><strong>TEST-14<\/strong><small>TEST desk A<\/small><\/td><td>2-14<\/td><td data-hd-switch-port><strong>Not patched<\/strong><\/td><td>[^]*?Off: no link[^]*?<\/td><td>—<\/td><\/tr>/, 'an unpatched jack: no light, no VLAN, whatever the fixture says');
  assert.match(view, /<tr data-hd-jack="TEST-15" data-hd-link="green">[\s\S]*?<td data-hd-switch-port>TEST-SW Gi1\/0\/15<\/td><td>[\s\S]*?Green: link[\s\S]*?<\/td><td>VLAN 10<\/td><\/tr>/);
  assert.match(view, /<tr data-hd-jack="TEST-16" data-hd-link="amber">[\s\S]*?Amber: link with errors[\s\S]*?VLAN 30/);
  assert.match(view, /Floor 2 · TEST closet · read-only/);
  assert.doesNotMatch(view, /<button[^>]*onclick="hd(?!SelectTicket)/, 'nothing on the closet changes anything');
  assert.match(view, /Network Operations' room/);
  const state = json(tab, "hdTicketById('HD-9911').consoleState.serverSeen");
  assert.deepEqual(state, ['closet:TEST-floor-2']);
  assert.equal(tab.run("hdConsoleRule(hdTicketById('HD-9911'), { serverSeen:'closet:TEST-floor-2' })"), true, 'the serverSeen rule reads it');
  assert.match(tab.open('HD-9911'), /· Opened/);
  // A ticket without the key: no card, and the screen says to open it from a ticket.
  const other = net(); assert.doesNotMatch(other.open('HD-9917'), /data-hd-closet/);
  other.run("hdState.closetTicket = 'HD-9917'");
  assert.match(other.view('helpdesk/network-closet'), /Open the network closet from a ticket that provides it/);
}

// The two Network Operations card kinds; a plain card is as before.
function testEvidenceKinds() {
  const tab = net(); tab.open('HD-9911');
  const closed = tab.open('HD-9911');
  assert.match(closed, /data-hd-evidence="jack"><div class="card-header"[^>]*><strong>Network Operations · Jack TEST-14 test<\/strong><span class="muted">From Network Operations · Read-only<\/span>/);
  assert.match(closed, /<strong>Network Operations · Internet circuit status<\/strong><span class="muted">From Network Operations · Read-only/);
  assert.match(closed, /data-hd-evidence="plain"><div class="card-header"[^>]*><strong>TEST plain card<\/strong><span class="muted">Read-only<\/span>/);
  tab.run("hdEvidenceOpen('HD-9911','jack')");
  assert.match(tab.open('HD-9911'), /<dt>Wall jack<\/dt><dd>TEST-14<\/dd><dt>Toner probe<\/dt><dd>TEST-14 is patch-panel port 2-14<\/dd><dt>Cable tester<\/dt><dd>Pass, wires 1–8<\/dd><dt>Switch<\/dt><dd>Not patched to the switch<\/dd>/);
  tab.run("hdEvidenceOpen('HD-9911','jack-ok')");
  assert.match(tab.open('HD-9911'), /<dt>Switch<\/dt><dd>Patched to TEST-SW Gi1\/0\/15<\/dd>/);
  tab.run("hdEvidenceOpen('HD-9911','circuit')");
  assert.match(tab.open('HD-9911'), /<dt>Primary fiber circuit \(TEST-ISP\)<\/dt><dd>Down since 09:12<\/dd><dt>Cellular backup \(5G\)<\/dt><dd>Active, about 40 Mbps<\/dd><dt>Backup data used<\/dt><dd>62% of the monthly data cap<\/dd><dt>Provider ticket<\/dt><dd>Open<\/dd>/);
  assert.equal(tab.run("hdCommsRule(hdTicketById('HD-9911'), { evidence:'circuit' })"), true);
  // An older ticket's card renders exactly as on master.
  const old = net(); const plain = old.open('HD-9917');
  assert.match(plain, /<div class="card hd-evidence-card" data-hd-evidence="plain"><div class="card-header" [^>]*><strong>TEST plain card<\/strong><span class="muted">Read-only<\/span><button type="button" class="btn btn-ghost btn-sm" aria-expanded="false" onclick="hdEvidenceOpen\('HD-9917','plain'\)">Open<\/button><\/div><\/div>/);
}

// The user moves the cable: a link, APIPA kept until /renew. A bench cable with renew takes the lease.
function testCableMove() {
  const tab = onPc('HD-9911', 'TEST-WS-11');
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Network cable unplugged"/);
  tab.run("hdChatAsk('HD-9911','move')");
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Connected" data-hd-net-internet="none"/);
  assert.match(tab.ps('ipconfig'), /Autoconfiguration IPv4 Address\. \. : 169\.254\.33\.10/);
  const moved = actions(tab, 'HD-9911').find((a) => a.id === 'cable-connected');
  assert.deepEqual([moved.adapter, moved.jack, moved.computer], ['Ethernet', 'TEST-15', 'TEST-WS-11']);
  assert.equal(moved.address, undefined);
  tab.run("hdChatAsk('HD-9911','move')");
  assert.equal(ids(tab, 'HD-9911').filter((id) => id === 'cable-connected').length, 1, 'asking again changes nothing');
  assert.match(tab.ps('ipconfig /renew'), /IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.141/);
  // A ticket action with renew: the address arrives with the link.
  const bench = onPc('HD-9915', 'TEST-LT-15');
  bench.run("hdConsoleAction('HD-9915','bench-cable')");
  const plugged = actions(bench, 'HD-9915').find((a) => a.id === 'cable-connected');
  assert.equal(plugged.address, '10.20.10.209');
  assert.match(bench.ps('ipconfig /all'), /Ethernet adapter Ethernet:[\s\S]*IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.209\(Preferred\)[\s\S]*DNS Servers \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.10/);
  // A question with no link changes nothing on the machine.
  const plain = onPc('HD-9917', 'TEST-LT-17');
  const before = plain.run("JSON.stringify(hdMachine('TEST-LT-17'))");
  plain.run("hdChatAsk('HD-9917','q')");
  assert.equal(plain.run("JSON.stringify(hdMachine('TEST-LT-17'))"), before);
}

// The VPN client: Disconnected → Connecting → Connected brings the adapter up; Disconnect takes it down.
function testVpnClient() {
  const tab = onPc('HD-9912', 'TEST-LT-12');
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="vpn-client"/);
  tab.run("hdOpenMachineScreen('TEST-LT-12','vpn-client')");
  let view = tab.view('helpdesk/vpn-client');
  assert.match(view, /data-hd-vpn="Disconnected"/);
  assert.match(view, /data-hd-vpn-prop="Gateway">vpn\.northstar\.example</);
  assert.match(view, /data-hd-vpn-prop="Last connected">Never</);
  assert.ok(seen(tab, 'TEST-LT-12').includes('vpn-client'));
  assert.equal(tab.ps('nslookup intranet.northstar.example'), "Server:  UnKnown\nAddress:  192.168.0.1\n\n*** UnKnown can't find intranet.northstar.example: Non-existent domain");
  tab.run("hdVpnConnect('TEST-LT-12')");
  view = tab.view('helpdesk/vpn-client');
  assert.match(view, /data-hd-vpn="Connecting"/);
  assert.match(view, /data-hd-vpn-approve[^>]*>Maya Chen approved the sign-in on their phone</);
  assert.match(tab.ps('ipconfig /all'), /Unknown adapter TEST VPN:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/, 'not up until the sign-in is approved');
  assert.deepEqual(ids(tab, 'HD-9912'), []);
  tab.run("hdVpnApprove('TEST-LT-12')");
  view = tab.view('helpdesk/vpn-client');
  assert.match(view, /data-hd-vpn="Connected"/);
  assert.match(view, /data-hd-vpn-prop="Connected since">Thu 08:40</);
  assert.match(view, /data-hd-vpn-prop="VPN address">10\.20\.250\.37</);
  assert.match(tab.ps('ipconfig /all'), /Unknown adapter TEST VPN:[\s\S]*?IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.250\.37\(Preferred\)[\s\S]*?DNS Servers \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.10\n {39}10\.20\.0\.11/);
  assert.equal(tab.ps('nslookup intranet.northstar.example').split('\n')[0], 'Server:  dc01.northstar.example');
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /InterfaceAlias\s+: TEST VPN[\s\S]*TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection www.example.com -Port 443'), /InterfaceAlias\s+: Wi-Fi/, 'split tunnel');
  const connect = actions(tab, 'HD-9912').find((a) => a.id === 'vpn-connect');
  assert.deepEqual([connect.gateway, connect.address], ['vpn.northstar.example', '10.20.250.37']);
  tab.run("hdVpnDisconnect('TEST-LT-12')");
  assert.match(tab.view('helpdesk/vpn-client'), /data-hd-vpn="Disconnected"[\s\S]*Last connected">Today</);
  assert.match(tab.ps('ipconfig /all'), /Unknown adapter TEST VPN:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/);
  assert.match(tab.ps('nslookup intranet.northstar.example'), /Non-existent domain/);
  assert.deepEqual(ids(tab, 'HD-9912'), ['vpn-connect', 'vpn-disconnect']);
  // Cancel while connecting: nothing comes up, nothing recorded as connected.
  const cancel = onPc('HD-9912', 'TEST-LT-12');
  cancel.run("hdVpnConnect('TEST-LT-12')"); cancel.run("hdVpnDisconnect('TEST-LT-12')");
  assert.deepEqual(ids(cancel, 'HD-9912'), []);
  assert.match(cancel.view('helpdesk/vpn-client'), /data-hd-vpn="Disconnected"/);
  // No adapter yet and no approval step: Connect adds the adapter.
  const bare = onPc('HD-9912', 'TEST-LT-13');
  assert.doesNotMatch(bare.ps('ipconfig /all'), /Northstar VPN/);
  bare.run("hdVpnConnect('TEST-LT-13')");
  assert.match(bare.ps('ipconfig /all'), /Unknown adapter Northstar VPN:[\s\S]*?10\.20\.250\.38\(Preferred\)/);
  bare.run("hdVpnDisconnect('TEST-LT-13')");
  assert.match(bare.ps('ipconfig /all'), /Unknown adapter Northstar VPN:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/, 'the adapter stays, down');
  // No internet: Connect fails, plainly.
  const offline = onPc('HD-9912', 'TEST-LT-12');
  offline.run("hdNetForget('TEST-LT-12','Wi-Fi','TEST-Home')");
  offline.run("hdVpnConnect('TEST-LT-12')");
  assert.match(offline.view('helpdesk/vpn-client'), /data-hd-vpn="Disconnected"[\s\S]*data-hd-vpn-error>Can't reach vpn\.northstar\.example\. Check the internet connection, then try again\./);
  assert.ok(ids(offline, 'HD-9912').includes('vpn-connect-failed'));
}

// The join dialog: provisioning account only, an OU, a restart, and the object in Active Directory.
function testDomainJoin() {
  const tab = onPc('HD-9914', 'TEST-LT-14');
  assert.ok(!adRows(tab).some(([name]) => name === 'TEST-LT-14'), 'no computer object before the join');
  assert.doesNotMatch(tab.ps('Get-ADComputer'), /TEST-LT-14/);
  assert.match(tab.ps('Get-ADComputer TEST-LT-14'), /Cannot find an object with identity: 'TEST-LT-14'/);
  assert.ok(adRows(tab).some(([name]) => name === 'TEST-LT-17'), 'other computers are listed');
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="settings-about"/);
  tab.run("hdOpenMachineScreen('TEST-LT-14','settings-about')");
  let view = tab.view('helpdesk/settings-about');
  assert.match(view, /data-hd-joined="no"/);
  assert.match(view, /data-hd-about-prop="Workgroup">WORKGROUP</);
  assert.ok(seen(tab, 'TEST-LT-14').includes('settings-about'));
  tab.run("hdJoinStart('TEST-LT-14')");
  view = tab.view('helpdesk/settings-about');
  assert.match(view, /data-hd-join="change"[\s\S]*id="hd-join-domain"/);
  assert.doesNotMatch(view, /type="password"|password field|Password:/i, 'no password field');
  tab.withFields({ 'hd-join-domain': 'northstar.example' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-14')");
  view = tab.view('helpdesk/settings-about');
  assert.match(view, /data-hd-join="account"[\s\S]*data-hd-join-provisioning[^>]*>Use the provisioning account \(KB-0097\)<\/button>/);
  assert.doesNotMatch(view, /<input/i, 'the account step has no field at all');
  const dialog = /data-hd-join="account"[\s\S]*?<\/div><\/div>/.exec(view)[0];
  assert.deepEqual([...dialog.matchAll(/<button[^>]*>([^<]*)</g)].map((m) => m[1]), ['Use the provisioning account (KB-0097)', 'Cancel'], 'the vault or Cancel, nothing else');
  tab.run("hdJoinAccount('TEST-LT-14')");
  view = tab.view('helpdesk/settings-about');
  const ous = [...view.matchAll(/<option value="([^"]+)">/g)].map((m) => m[1]);
  assert.ok(ous.includes('OU=Logistics,OU=Workstations') && ous.includes('OU=Marketing,OU=Workstations') && ous.includes('OU=Operations,OU=Workstations'));
  assert.equal(ous[ous.length - 1], 'CN=Computers');
  assert.ok(ous.every((ou) => /^OU=[^,]+,OU=Workstations$|^CN=Computers$/.test(ou)));
  // An OU that isn't offered changes nothing.
  tab.withFields({ 'hd-join-ou': 'OU=Nope,OU=Workstations' }, "hdJoinOu({ preventDefault() {} }, 'TEST-LT-14')");
  assert.deepEqual(ids(tab, 'HD-9914'), []);
  tab.withFields({ 'hd-join-ou': 'OU=Logistics,OU=Workstations' }, "hdJoinOu({ preventDefault() {} }, 'TEST-LT-14')");
  view = tab.view('helpdesk/settings-about');
  assert.match(view, /data-hd-join-welcome>Welcome to the northstar\.example domain\.</);
  assert.match(view, /data-hd-join-restart><p>You must restart your computer to apply these changes\.<\/p>/);
  const join = actions(tab, 'HD-9914').find((a) => a.id === 'domain-join');
  assert.deepEqual([join.domain, join.ou, join.account, join.via, join.computer], ['northstar.example', 'OU=Logistics,OU=Workstations', 'NORTHSTAR\\svc-provision', 'settings', 'TEST-LT-14']);
  assert.ok(!ids(tab, 'HD-9914').includes('domain-join-default-container'));
  assert.deepEqual(adRows(tab).find(([name]) => name === 'TEST-LT-14'), ['TEST-LT-14', 'OU=Logistics,OU=Workstations'], 'the object is in the chosen OU');
  assert.match(tab.ps('Get-ADComputer TEST-LT-14'), /DistinguishedName : CN=TEST-LT-14,OU=Logistics,OU=Workstations/);
  tab.run("hdJoinRestart('TEST-LT-14')");
  view = tab.view('helpdesk/settings-about');
  assert.doesNotMatch(view, /data-hd-join-restart|data-hd-join-change/);
  assert.match(view, /data-hd-joined="yes"[\s\S]*data-hd-about-prop="Full device name">TEST-LT-14\.northstar\.example<[\s\S]*data-hd-about-prop="Domain">northstar\.example</);
  const restart = actions(tab, 'HD-9914').find((a) => a.id === 'restart');
  assert.equal(restart.afterJoin, true);
  assert.match(tab.ps('gpupdate /force'), /Computer Policy update has completed successfully\./);
  assert.match(tab.ps('Add-Computer -DomainName northstar.example'), /already in that domain/);
  // A blank domain stays on the form; the default container is recorded on its own.
  const blank = onPc('HD-9914', 'TEST-LT-14'); blank.run("hdJoinStart('TEST-LT-14')");
  blank.withFields({ 'hd-join-domain': '' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-14')");
  assert.match(blank.view('helpdesk/settings-about'), /data-hd-join="change"[\s\S]*Type the domain name\./);
  blank.withFields({ 'hd-join-domain': 'NorthStar.Example' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-14')");
  blank.run("hdJoinAccount('TEST-LT-14')");
  blank.withFields({ 'hd-join-ou': 'CN=Computers' }, "hdJoinOu({ preventDefault() {} }, 'TEST-LT-14')");
  assert.deepEqual(ids(blank, 'HD-9914'), ['domain-join', 'domain-join-default-container']);
  assert.deepEqual(adRows(blank).find(([name]) => name === 'TEST-LT-14'), ['TEST-LT-14', 'CN=Computers']);
}

// No domain controller: Windows' exact message; then on the corporate network the join works.
function testJoinFailsWithoutDc() {
  const tab = onPc('HD-9915', 'TEST-LT-15');
  tab.run("hdOpenMachineScreen('TEST-LT-15','settings-about')");
  tab.run("hdJoinStart('TEST-LT-15')");
  tab.withFields({ 'hd-join-domain': 'northstar.example' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-15')");
  const view = tab.view('helpdesk/settings-about');
  assert.match(view, /data-hd-join-error><p>An Active Directory Domain Controller \(AD DC\) for the domain &quot;northstar\.example&quot; could not be contacted\.<\/p><p>Ensure that the domain name is typed correctly\.<\/p>/);
  assert.equal(tab.run("hdJoinNoDc('northstar.example')"), 'An Active Directory Domain Controller (AD DC) for the domain "northstar.example" could not be contacted.');
  const failed = actions(tab, 'HD-9915').find((a) => a.id === 'domain-join-failed');
  assert.deepEqual([failed.domain, failed.reason, failed.via], ['northstar.example', 'no-dc', 'settings']);
  assert.ok(!adRows(tab).some(([name]) => name === 'TEST-LT-15'));
  // A misspelt domain fails the same way, with the name typed.
  tab.run("hdJoinStart('TEST-LT-15')");
  tab.withFields({ 'hd-join-domain': 'northstar.local' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-15')");
  assert.match(tab.view('helpdesk/settings-about'), /for the domain &quot;northstar\.local&quot; could not be contacted/);
  // Typed, on the guest network: Windows' Add-Computer failure.
  assert.match(tab.ps('Add-Computer -DomainName northstar.example -OUPath "OU=Marketing,OU=Workstations"'), /^Add-Computer : Computer 'TEST-LT-15' failed to join domain 'northstar\.example' from its current workgroup 'WORKGROUP' with following error message: The specified domain either does not exist or could not be contacted\.$/);
  // Forget the guest network, plug in at the bench: company DNS, then the join works.
  tab.run("hdNetForget('TEST-LT-15','Wi-Fi','TEST-Guest')");
  tab.run("hdConsoleAction('HD-9915','bench-cable')");
  assert.match(tab.ps('nslookup northstar.example'), /Addresses:  10\.20\.0\.10/);
  assert.equal(tab.ps('Add-Computer -DomainName northstar.example -OUPath "OU=Marketing,OU=Workstations"'), "WARNING: The changes will take effect after you restart the computer TEST-LT-15.");
  const join = actions(tab, 'HD-9915').find((a) => a.id === 'domain-join');
  assert.deepEqual([join.ou, join.via, join.account], ['OU=Marketing,OU=Workstations', 'add-computer', 'NORTHSTAR\\svc-provision']);
  assert.deepEqual(adRows(tab).find(([name]) => name === 'TEST-LT-15'), ['TEST-LT-15', 'OU=Marketing,OU=Workstations']);
  tab.run("hdOpenMachineScreen('TEST-LT-15','settings-about')");
  assert.match(tab.view('helpdesk/settings-about'), /data-hd-join-restart/);
}

// Add-Computer: the vault account only, -Restart, CN=Computers without -OUPath, a bad OU, no password ever.
function testAddComputer() {
  const tab = onPc('HD-9914', 'TEST-LT-16');
  assert.match(tab.ps('Get-Help'), /Domain: Add-Computer -DomainName northstar\.example -OUPath "<OU>" \[-Restart\]/);
  assert.match(tab.ps('Add-Computer'), /missing mandatory parameters: DomainName/);
  const refused = tab.shell('Add-Computer -DomainName northstar.example -Credential NORTHSTAR\\rmorgan');
  assert.match(refused, /Add-Computer didn&#39;t run|Add-Computer didn't run/);
  assert.match(refused, /never asks for a password/);
  assert.match(tab.ps('Add-Computer -DomainName northstar.example -Credential (Get-Credential)'), /never asks for a password/);
  // A typed password is never run, shown or recorded (the console's rule, unchanged).
  const secret = tab.shell('Add-Computer -DomainName northstar.example -Password Hunter2!');
  assert.doesNotMatch(secret, /Hunter2/);
  assert.doesNotMatch(JSON.stringify(json(tab, 'hdState.practiceLog')), /Hunter2/);
  assert.deepEqual(ids(tab, 'HD-9914'), [], 'nothing joined so far');
  assert.match(tab.ps('Add-Computer -DomainName northstar.example -OUPath "OU=Nope,OU=Workstations"'), /There is no such object on the server\./);
  // The vault account named, -Restart: joined and restarted, no output.
  assert.equal(tab.ps("Add-Computer -DomainName northstar.example -OUPath 'ou=sales,ou=workstations' -Credential NORTHSTAR\\svc-provision -Restart"), '');
  assert.deepEqual(ids(tab, 'HD-9914'), ['domain-join', 'restart']);
  assert.equal(actions(tab, 'HD-9914')[0].ou, 'OU=Sales,OU=Workstations');
  tab.run("hdOpenMachineScreen('TEST-LT-16','settings-about')");
  assert.doesNotMatch(tab.view('helpdesk/settings-about'), /data-hd-join-restart/);
  // No -OUPath: the default Computers container, as Windows does.
  const bare = onPc('HD-9914', 'TEST-LT-16');
  bare.shell('add-computer -domainname northstar.example');
  assert.deepEqual(ids(bare, 'HD-9914'), ['domain-join', 'domain-join-default-container']);
  assert.ok(bare.run("hdState.practiceLog.some((e) => e.type === 'command_run' && e.result === 'joined northstar.example in CN=Computers')"));
  // No network state and dcReachable:false: the join fails.
  const cut = sim({ url: 'https://academy.test/sim/?practice=test-net-b&student=stu-1#/helpdesk/tickets', before: "/* no-op */" });
  cut.run("hdSelectTicket('HD-9914')"); cut.on('TEST-LT-16');
  cut.run("hdMachine('TEST-LT-16').domain.dcReachable = false");
  assert.match(cut.ps('Add-Computer -DomainName northstar.example'), /could not be contacted/);
  // A computer without a domain block: Add-Computer answers as before.
  const plain = onPc('HD-9917', 'TEST-LT-17');
  assert.match(plain.ps('Add-Computer -DomainName northstar.example'), /outside this training shell/);
}

// The phone's Wi-Fi list: Enterprise asks a personal phone for username, password and certificate; Guest for the passphrase.
function testPhoneWifi() {
  const tab = net(); tab.open('HD-9911');
  tab.run("hdPhoneOpen('TEST-PH-P','wifi')");
  let view = tab.view('helpdesk/phone');
  assert.match(view, /data-hd-phone-networks>[\s\S]*data-hd-phone-network="TEST-Corp"><strong>TEST-Corp<\/strong> <span class="muted">WPA3-Enterprise<\/span>/);
  assert.match(view, /data-hd-phone-network="TEST-Guest"><strong>TEST-Guest<\/strong> <span class="muted">WPA2-Personal<\/span>/);
  assert.match(view, /data-hd-phone-network="TEST-Home">[\s\S]*?Connected/);
  tab.run("hdPhoneWifiJoin('TEST-PH-P','TEST-Corp')");
  view = tab.view('helpdesk/phone');
  const prompt = /data-hd-phone-prompt="enterprise"[\s\S]*?<\/div><\/div><\/div>/.exec(view)[0];
  assert.match(prompt, /Enter the password for "TEST-Corp"/);
  assert.match(prompt, /<label>Username <input class="ipt" disabled/);
  assert.match(prompt, /<label>Password <input class="ipt" type="password" disabled/);
  assert.match(prompt, /<label>Certificate <select class="ipt" disabled data-hd-phone-cert><option>Select<\/option><option>No certificate installed<\/option><\/select>/);
  assert.equal((prompt.match(/<input(?![^>]*disabled)/g) || []).length, 0, 'nothing on the prompt can be typed into');
  assert.match(prompt, /<button type="button" class="btn btn-primary btn-sm" disabled>Join<\/button>/);
  const asked = json(tab, "hdTicketById('HD-9911').consoleState.actions").find((a) => a.id === 'phone-wifi-prompt');
  assert.deepEqual([asked.ssid, asked.kind], ['TEST-Corp', 'enterprise']);
  assert.equal(json(tab, "hdPhone('TEST-PH-P', hdCloud()).status").network, 'TEST-Home', 'a personal phone never joins the Enterprise network');
  // The guest network: the user types the day's passphrase (never taken by the simulator).
  tab.run('hdPhoneWifiCancel()');
  assert.doesNotMatch(tab.view('helpdesk/phone'), /data-hd-phone-prompt/);
  tab.run("hdPhoneWifiPassphrase('TEST-PH-P','TEST-Guest')");
  assert.equal(json(tab, "hdPhone('TEST-PH-P', hdCloud()).status").network, 'TEST-Home', 'not before the prompt');
  tab.run("hdPhoneWifiJoin('TEST-PH-P','TEST-Guest')");
  view = tab.view('helpdesk/phone');
  assert.match(view, /data-hd-phone-prompt="passphrase"[\s\S]*data-hd-phone-passphrase[^>]*>The user types today&#39;s passphrase from the reception screen|data-hd-phone-prompt="passphrase"[\s\S]*data-hd-phone-passphrase[^>]*>The user types today's passphrase from the reception screen/);
  assert.doesNotMatch(/data-hd-phone-prompt="passphrase"[\s\S]*?<\/div><\/div>/.exec(view)[0], /<input/);
  tab.run("hdPhoneWifiPassphrase('TEST-PH-P','TEST-Guest')");
  view = tab.view('helpdesk/phone');
  assert.match(view, /Connected: TEST-Guest/);
  assert.match(view, /data-hd-phone-network="TEST-Guest">[\s\S]*?Connected/);
  assert.doesNotMatch(view, /data-hd-phone-prompt/);
  assert.ok(json(tab, "hdTicketById('HD-9911').consoleState.actions").some((a) => a.id === 'phone-wifi-join' && a.ssid === 'TEST-Guest'));
  // Open joins at once; a company phone joins the Enterprise network with its certificate.
  tab.run("hdPhoneWifiJoin('TEST-PH-P','TEST-Open')");
  assert.match(tab.view('helpdesk/phone'), /Connected: TEST-Open/);
  tab.run("hdPhoneOpen('TEST-PH-C','wifi')");
  tab.run("hdPhoneWifiJoin('TEST-PH-C','TEST-Corp')");
  assert.match(tab.view('helpdesk/phone'), /Connected: TEST-Corp/);
  // Wi-Fi off: no list. A phone without the list: the Wi-Fi app as on master.
  tab.run("hdPhoneWifi('TEST-PH-C')");
  assert.doesNotMatch(tab.view('helpdesk/phone'), /data-hd-phone-networks/);
  tab.run("hdPhoneOpen('TEST-PH-OLD','wifi')");
  assert.match(tab.view('helpdesk/phone'), /<div data-hd-phone-app="wifi"><p>Wi-Fi <button type="button" class="btn btn-sm btn-primary" role="switch" aria-checked="true"  data-hd-phone-wifi onclick="hdPhoneWifi\('TEST-PH-OLD'\)">On<\/button><\/p><p class="muted">Connected: Northstar-Corp<\/p><\/div>/);
}

// An older ticket's shape with network state and none of console B's keys.
function testNoKeysAsBefore() {
  const tab = onPc('HD-9917', 'TEST-LT-17');
  const desk = tab.view('helpdesk/windows');
  assert.doesNotMatch(desk, /data-hd-tools="(settings-about|vpn-client)"/);
  assert.match(tab.view('helpdesk/settings-about'), /Not available on this computer in this shift/);
  assert.match(tab.view('helpdesk/vpn-client'), /Not available on this computer in this shift/);
  tab.run("hdOpenMachineScreen('TEST-LT-17','settings-about')");
  assert.doesNotMatch(json(tab, "(hdMachine('TEST-LT-17').seen || [])").join(), /settings-about|vpn-client/);
  assert.doesNotMatch(tab.ps('Get-Help'), /Add-Computer/);
  assert.ok(adRows(tab).some(([name]) => name === 'TEST-LT-17'));
  tab.run("hdJoinStart('TEST-LT-17')"); tab.run("hdVpnConnect('TEST-LT-17')");
  assert.deepEqual(ids(tab, 'HD-9917'), []);
}

// A Prove shift whose machine has the keys: the screens work, nothing changes once locked.
function testProveShift() {
  const before = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify({ ...BENCH, vpnClient: { address: '10.20.250.40', approval: false } })}); }`;
  const tab = sim({ url: proveUrl('its-01'), withTest: false, before });
  const name = tab.run('hdState.selectedComputer');
  tab.run(`hdState.machineView = { computer:hdState.selectedComputer }`);
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="settings-about"[\s\S]*data-hd-tools="vpn-client"/);
  tab.run(`hdOpenMachineScreen(${JSON.stringify(name)},'settings-about')`);
  assert.ok(json(tab, 'hdState.prove.opened').includes(`settings-about:${name}`));
  assert.doesNotMatch(tab.ps('Get-Help'), /Add-Computer/, 'no help lines in a Prove It');
  tab.shell('Add-Computer -DomainName northstar.example -OUPath "OU=Sales,OU=Workstations"');
  const events = json(tab, "hdState.prove.events.filter((e) => e.type === 'command_run' || e.type === 'action_taken').map((e) => [e.type, e.command || e.value])");
  assert.deepEqual(events, [['command_run', 'Add-Computer -DomainName northstar.example -OUPath "OU=Sales,OU=Workstations"'], ['action_taken', 'domain-join']]);
  // A Prove It refuses another account without naming the one that works,
  // and the dialog has no help sentence.
  const other = sim({ url: proveUrl('its-01'), withTest: false, before });
  assert.equal(other.ps('Add-Computer -DomainName northstar.example -Credential NORTHSTAR\\rmorgan'), "Add-Computer didn't run: this console never asks for a password.");
  other.run(`hdState.machineView = { computer:hdState.selectedComputer }`);
  other.run(`hdJoinStart(${JSON.stringify(name)})`);
  other.withFields({ 'hd-join-domain': 'northstar.example' }, `hdJoinDomain({ preventDefault() {} }, ${JSON.stringify(name)})`);
  const account = other.view('helpdesk/settings-about');
  assert.match(account, /Use the provisioning account \(KB-0097\)/);
  assert.doesNotMatch(account, /vault|never type/i);
  tab.run("hdProveServer.status = 'waiting'");
  tab.run(`hdVpnConnect(${JSON.stringify(name)})`);
  assert.equal(json(tab, `hdMachine(${JSON.stringify(name)}).vpnClient`).status, undefined, 'nothing changes once locked');
  assert.equal(tab.ps('Add-Computer -DomainName northstar.example'), '');
  // machineTools: every computer shows the button once one machine has the key.
  // The machine names are read from the shift, never written here (Module 4's
  // guard keeps its graded computers out of every other committed file).
  const tools = `{ const shift = HD_PROVE_SHIFTS['its-02']; Object.assign(shift.machines[Object.keys(shift.machines)[0]], { domain: { joined: true }, vpnClient: {} }); }`;
  const all = sim({ url: proveUrl('its-02'), withTest: false, before: tools });
  const second = all.run("Object.keys(HD_PROVE_SHIFTS['its-02'].machines)[1]");
  assert.ok(second, 'the shift has a second computer');
  all.run(`hdState.selectedComputer = ${JSON.stringify(second)}`);
  assert.match(all.view('helpdesk/windows'), /data-hd-tools="settings-about"[\s\S]*data-hd-tools="vpn-client"/);
  all.on(second);
  assert.match(all.view('helpdesk/settings-about'), /Nothing to show on this computer/);
  assert.match(all.view('helpdesk/vpn-client'), /Nothing to show on this computer/);
}

// Review fixes: an OU must be chosen, -Cred is a -Credential, the VPN needs
// a working link under it, and the Windows Restart finishes a join.
function testJoinAndVpnEdges() {
  const tab = onPc('HD-9914', 'TEST-LT-14');
  tab.run("hdJoinStart('TEST-LT-14')");
  tab.withFields({ 'hd-join-domain': 'northstar.example' }, "hdJoinDomain({ preventDefault() {} }, 'TEST-LT-14')");
  tab.run("hdJoinAccount('TEST-LT-14')");
  assert.match(tab.view('helpdesk/settings-about'), /<select id="hd-join-ou" class="ipt"><option value="" selected disabled>Choose an OU<\/option>/);
  tab.withFields({ 'hd-join-ou': '' }, "hdJoinOu({ preventDefault() {} }, 'TEST-LT-14')");
  assert.match(tab.view('helpdesk/settings-about'), /data-hd-join="ou"[\s\S]*role="alert">Choose an OU\./);
  assert.deepEqual(ids(tab, 'HD-9914'), []);
  const short = onPc('HD-9914', 'TEST-LT-16');
  for (const line of ['Add-Computer -DomainName northstar.example -Cred NORTHSTAR\\rmorgan', 'Add-Computer -DomainName northstar.example -cre:NORTHSTAR\\rmorgan', 'Add-Computer -DomainName northstar.example -Credential']) assert.match(short.ps(line), /never asks for a password/, line);
  assert.deepEqual(ids(short, 'HD-9914'), []);
  // The tunnel goes when the home Wi-Fi goes.
  const vpn = onPc('HD-9912', 'TEST-LT-12');
  vpn.run("hdVpnConnect('TEST-LT-12')"); vpn.run("hdVpnApprove('TEST-LT-12')");
  assert.match(vpn.ps('Test-NetConnection files.northstar.example -Port 445'), /TcpTestSucceeded : True/);
  vpn.run("hdNetForget('TEST-LT-12','Wi-Fi','TEST-Home')");
  assert.doesNotMatch(vpn.ps('Test-NetConnection files.northstar.example -Port 445'), /TcpTestSucceeded : True/);
  // A VPN client on a machine with no network state never connects.
  const bare = onPc('HD-9914', 'TEST-LT-16');
  bare.run("hdMachine('TEST-LT-16').vpnClient = { approval: false }");
  bare.run("hdVpnConnect('TEST-LT-16')");
  bare.run("hdOpenMachineScreen('TEST-LT-16','vpn-client')");
  assert.match(bare.view('helpdesk/vpn-client'), /data-hd-vpn="Disconnected"[\s\S]*data-hd-vpn-error/);
  assert.ok(!ids(bare, 'HD-9914').includes('vpn-connect'));
  // The ordinary Restart (a machine with the restart feature) finishes a join.
  const restart = onPc('HD-9914', 'TEST-LT-14');
  restart.run("hdMachine('TEST-LT-14').uptimeDays = 3");
  restart.ps('Add-Computer -DomainName northstar.example -OUPath "OU=Sales,OU=Workstations"');
  restart.run("hdOpenMachineScreen('TEST-LT-14','settings-about')");
  assert.match(restart.view('helpdesk/settings-about'), /data-hd-join-restart/);
  restart.run("hdWinRestart('TEST-LT-14')");
  assert.doesNotMatch(restart.view('helpdesk/settings-about'), /data-hd-join-restart/);
}

const TESTS = [testOldShiftsUnchanged, testCloset, testEvidenceKinds, testCableMove, testVpnClient, testDomainJoin, testJoinFailsWithoutDc, testAddComputer, testPhoneWifi, testNoKeysAsBefore, testProveShift, testJoinAndVpnEdges];
let passed = 0;
// `node tests/hdesk-m09-console-b.test.js testCloset` runs one test (CI runs all).
const only = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
for (const test of TESTS.filter((item) => !only.length || only.includes(item.name))) {
  test();
  passed += 1;
  console.log(`ok - ${test.name}`);
}
console.log(`hdesk-m09-console-b: ${passed} passed`);

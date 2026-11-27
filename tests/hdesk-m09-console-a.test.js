'use strict';
/* Help Desk simulator: Module 09 (key its-04), console A (ui/helpdesk.js
 * "Client network state"): a PC's adapters, IP settings, DNS client cache,
 * Wi-Fi and routes on its machine fixture (machine.network); the eight typed
 * commands (ipconfig, ipconfig /all, /release, /renew, /flushdns, ping,
 * tracert, nslookup) answering from that state in Windows' wording;
 * Test-NetConnection for the host and port typed; gpupdate /force and
 * nltest on a client; the optional PowerShell lines with the same credit as
 * their screens; Settings › Network & internet (status, Hardware properties,
 * Edit IP settings, Wi-Fi Properties, Manage known networks › Forget); and
 * Device Manager's Advanced tab (Preferred band).
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST- names), never in ui/helpdesk-data.js. No Module 09 content. Every
 * older ticket, set and Prove shift must look and behave as before: the
 * screens and command answers are pinned against master. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const sha = (text) => crypto.createHash('sha256').update(String(text)).digest('hex');
const FIXED = Date.parse('2026-08-20T08:40:00Z');
// Local-time text is printed in UTC, so the pins match on any computer's
// time zone and locale (a ticket screen shows toLocaleString()).
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
    // Through the PowerShell screen, as a student types it (saved transcript).
    shell: (command) => { const real = ctx.document.getElementById; ctx.document.getElementById = (id) => (id === 'hd-ps-input' ? { value: command } : null); try { run('hdRunPowerShell({ preventDefault() {} })'); } finally { ctx.document.getElementById = real; } return run("VIEWS['helpdesk/powershell']()"); },
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}; hdState.machineView = { computer:${j(computer)} }`),
  };
}
const setSim = (key, local) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local });
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m09a#/helpdesk/tickets`;

/* ---------- Master's output, pinned ----------
 * Every older shift (the shared queue, each practice set, each coached set
 * and each Prove shift): each ticket's screen, and on the shift's own
 * computer, every computer with machine state and NS-WS-0277 and
 * NS-LT-0117: Settings › Network & internet, Device Manager, the Windows
 * Desktop and every command this part adds or changes, typed in order with
 * the machine state after each. Computed on master at 37f671e with
 * `node tests/hdesk-m09-console-a.test.js --print-pins`. Re-pinned on
 * 2026-11-26 by Module 09's sim part for the shared shift (HD-2104, HD-2105
 * and HD-2113 left it, ownSet), Module 1's practice set and Module 08's
 * extension set (eleven new templates move the seeded created times by a
 * minute or two); every other pin is unchanged. */
const PIN_COMMANDS = [
  'ipconfig', 'ipconfig /all', 'ipconfig /displaydns', 'ping 10.20.10.1', 'ping -n 20 10.20.10.1', 'ping files.northstar.example',
  'ping www.example.com', 'tracert www.example.com', 'tracert 10.20.0.30', 'nslookup files.northstar.example', 'nslookup northstar.example',
  'Test-NetConnection files.northstar.example -Port 445', 'Test-NetConnection NS-FILE01 -Port 445', 'Test-NetConnection dc01.northstar.example -Port 53',
  'Test-NetConnection 10.20.70.20 -Port 9100', 'Test-NetConnection purchasing.northstar.example -Port 443',
  'Get-NetAdapter', 'Get-NetIPConfiguration', 'Get-DnsClientServerAddress', 'Get-DnsClientCache', 'netsh wlan show interfaces',
  'Resolve-DnsName files.northstar.example', 'nltest /dsgetdc:northstar.example', 'gpupdate /force',
  'ipconfig /flushdns', 'Clear-DnsClientCache', 'Set-NetIPInterface -InterfaceAlias Ethernet -Dhcp Enabled',
  'ipconfig /release', 'ipconfig /renew', 'Get-Help',
];
const PIN_EXTRA = ['NS-WS-0277', 'NS-LT-0117'];
// Module 09's own sets and shift, added by later parts, turn these on.
const MODULE_9_SETS = ['its-04', 'its-04-guided'];
function shiftsOf(plain) {
  const shifts = [{ name: 'shared', make: () => sim({ withTest: false }) }];
  Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `practice:${key}`, make: () => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, withTest: false }) }));
  Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `coached:${key}`, make: () => { const tab = sim({ withTest: false }); assert.equal(tab.run(`hdUseTicketSet(${JSON.stringify(key)})`), true); return tab; } }));
  Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !MODULE_9_SETS.includes(k)).forEach((key) => shifts.push({ name: `prove:${key}`, make: () => sim({ url: proveUrl(key), withTest: false }) }));
  return shifts;
}
function pinsOf(make) {
  const out = {};
  const first = make();
  const home = first.run('hdState.selectedComputer');
  const tickets = first.run('hdState.tickets.map((t) => t.id)');
  const computers = [...new Set([home, ...first.run('Object.keys(hdState.machines || {})'), ...PIN_EXTRA])];
  out.tickets = sha(tickets.map((id) => sha(first.open(id))).join(','));
  const screens = [];
  const commands = [];
  for (const computer of computers) {
    const tab = make();
    tab.on(computer);
    for (const route of ['helpdesk/settings-network', 'helpdesk/device-manager', 'helpdesk/windows']) screens.push(sha(tab.view(route)));
    for (const command of PIN_COMMANDS) {
      commands.push(sha(tab.ps(command)));
      commands.push(sha(tab.run('JSON.stringify([hdState.machines || {}, hdState.computerOverrides || {}])')));
    }
  }
  out.screens = sha(screens.join(','));
  out.commands = sha(commands.join(','));
  return out;
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
  shared: { tickets: '28eca56e7c6ab65d221b05a8557a70a3657b0852c368d7df7c6ea3970213f51f', screens: 'db0589042c823cfaa177c4f0f7b166bac15218c5b6b1cb5e087a0235149204c3', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'practice:its-01': { tickets: 'aaff637984c4cfab2070026a01cc0117f6bb55cfffb3a72ec5c451365ffff015', screens: 'db0589042c823cfaa177c4f0f7b166bac15218c5b6b1cb5e087a0235149204c3', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'practice:its-10': { tickets: '7178b6d765756fa666e041bd909834f478902a84792706af0fe1987b478a2aeb', screens: '8debbbdc099f10d0593d507186f6c9b0b749c42847699471a51e949e4b3d1b05', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'practice:its-11': { tickets: '300e2afc6cc2f22db756f8bee61feb51a29e111adc439d2e96404800d1ee0a04', screens: '8debbbdc099f10d0593d507186f6c9b0b749c42847699471a51e949e4b3d1b05', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'practice:its-02': { tickets: '52a0ddd18c70923b5f3265fa23c3d93a104c95d4e65fc412bafd684d2f130fac', screens: '119644067e939c8719109cb81dbabd863253ff97978a48bdca56446ef280e475', commands: '61fa527e27e79571da3909aaebbd57fbad5a273980c44ee59537cb28b561b7b9' },
  'practice:its-03': { tickets: '7352ad2392787eff41313e9a11963ecfc649a26c2ed78d959031386b43829ea3', screens: 'd63e9a56a5257786ef805467b25db678bee4dec5069854f840507fd32d859902', commands: '0e6ffefca9dcc72ba6173bf9a2927a53bf097e53328ce04feb9363bb37ae5559' },
  'practice:its-07': { tickets: 'c26b9cc3fa72ac7e90278de9bbb26a6e44afa6d536818f40d35b907fc57d9b1b', screens: '3af569afa88adb8502faca248c6e7ec0c92a28a5a7b23405fd26203fb5514fc3', commands: '77fc117d2d5c9d83cc92b6f178401a0deb6b3d175d4803d5195f452e8bdffdb6' },
  'practice:its-05': { tickets: '0c54d5a36524862937d58b86f1b1602b661ba3b4c8c0e4280ff9c69cd0eccc2d', screens: 'eaec05d120a30ec58e6351b4b8b3cb5266d5e43039fc0ec09c7480ba94723027', commands: '44875d9795491cd52b6de7d00767f49053363065385bdf5131d5d5f975c5156a' },
  'practice:its-06': { tickets: '12e6d2059c47d770cac87102c8ba23e4f06d4f7d9f6a2f1506d9268e75b9d9c0', screens: 'bb3f0fdf9d635ce1b4c35b73eb96262aa08478baed5da8a74f770d9251286b8e', commands: '20844e603e99176ea2aa2eced7a070a028b934c92dec8c904424bb5c259fe0cd' },
  'coached:its-10-guided': { tickets: '791e792d7e3c90c8ae149a31e91d6807e4d89ef7effc3b5a1f344053cad2d2b0', screens: '8debbbdc099f10d0593d507186f6c9b0b749c42847699471a51e949e4b3d1b05', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'coached:its-11-guided': { tickets: 'a6008aab94d14aeaaa55658ff6218d351168faa9978ce3cc98ee57a5a20a89ba', screens: '8debbbdc099f10d0593d507186f6c9b0b749c42847699471a51e949e4b3d1b05', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'coached:its-02-guided': { tickets: '2a18cfe379cc4886762a92e2f819abd5ed3d6026f613e9e569e64bbbc5511c79', screens: '69bbbbd59996d9d934267fbce1ddf82d55c431221475c24c4674b4c0a5c88972', commands: '0556983a81ed20d0516241d1274ec5c85e4d3c9b1b0d94ea8dbaec0af59f2e44' },
  'coached:its-02-server': { tickets: '2775b594b1babef07b133d5c96abf725931fa9430bd9d485bfee0bc1e1b6afc5', screens: '8debbbdc099f10d0593d507186f6c9b0b749c42847699471a51e949e4b3d1b05', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'coached:its-03-guided': { tickets: '34b9d92eb99056692824a05a83b267b67143b1fef06bdab6f70441f16921d471', screens: '76131a1c3624cc2f62322a5049ddcd8f575148bf9693e2f3e624f68836615271', commands: '3831cb0884fe12c9aa73627a65296eaf1591413cde1b2b1e937e6ae6173c3c67' },
  'coached:its-07-guided': { tickets: '5ac8e1ae952ddf61a7dc76f532d2da9f5b5caf830d04740bbe43a4e810219833', screens: 'c4ec034c14be79b35a8a784e004fc8ad0777f00934d82c2d3592b9bcde6b8c3c', commands: '2202072ce19387203999a8618457b4794cea31c115b3d04ce513196b4ce3698f' },
  'coached:its-05-guided': { tickets: '13eb2965c8e669a0ab73fd51a9eedd5a4d3b6e8ec3de97ad9a77ad40587d8c08', screens: 'ac42afadee96e32c186562a0c87d03ca1134f169213244909f0cda6a4290a799', commands: '576490ecd826088f284d8a0d974501513608720f5417f5bb4e7e397f4e22a458' },
  'coached:its-06-guided': { tickets: '039eb60f1ee5f8d72a7721ae79a56477f56cd1986137a7b82d0baf37a120ebc0', screens: '16a51ed14041a5a8a1980bcdbd2b3013b4d3dbea0bcdb2932ca66a4c99f9cb38', commands: 'b441a933f9d9b897c2c09aae42ecfa41f8ade4b6300e3d0996c347398be38070' },
  'coached:its-06-extension': { tickets: 'bc3ca005d81a671ff29cc64f617def614c36d2e346b87b6f6c88c8f674028cb3', screens: '142d7dc46603c8471edeae22f1fd67805d8e2404d11720164080781e40ac1fcb', commands: '090acf667af0215fd37ec76f1d2226321730ddff98380c3cc9a8948f6b48b1ae' },
  'prove:its-01': { tickets: '4a945206750e062262de2a7c8391df418d18691ab5cf4594f8de109f3d5593f5', screens: '8172b9a1925d6e59cafc3a10f7b86ab46cd4bb174aa52c4d95c6b10ef410abf0', commands: 'fc6226fbbb1a5bcf8b9400475b80a8f33099511902da85cd63ba24980125bb75' },
  'prove:its-10': { tickets: '1477780e26acf888c3b82e7a27fa843b395b0d665d2c43695164410a60c0af57', screens: '8999e9155bc261ac42e1dabd4d01dc1c267495e0945a1f93198134e202316c32', commands: '364cb867b052af29f050f2d8d582401fa33578e88b733010e025a00fd79d2657' },
  'prove:its-11': { tickets: 'edbb61c499c8d3dcf3866d13430bdad4c6997b132afd38370941173d7e8431d2', screens: '5ea757a11a421d4d35a4d1032ae534212652c5bfbd07fe08f9725ab77c0207f5', commands: 'dcf49cd5094920cddd398db32302856865f897d2a2fcfbe0baeb0ba9223d60af' },
  'prove:its-02': { tickets: 'ed4dc188cec3ba2e18830bb144975bc43921a3e5d102670e98d4e925c512cef5', screens: 'e7da476c4992aa52d9ce0b08b8a7216bb1f58cfb03b611f4539d195ef0d7cc8e', commands: '450282b9d6a370e56ec71d168a964a55a3e7595e219b7994fab3eaeb34df76a1' },
  'prove:its-03': { tickets: '1783c201a81af2d0d86b1df49a6207e36b1cc406301c4cbb0949f3f1d81d2172', screens: '576e0b2c2d225e4720c9db384733b819ee19d62d29825e17a140016aedae2061', commands: 'a48db74eb88210bb768e1762955ec5f4212db26f95506f3354d73b522fa87d2e' },
  'prove:its-07': { tickets: '26c5da3d838784607610f9b15971ab94a280a43aeb779bacc691c5c057888442', screens: '4e7de16eb8b1f52b9247d72b04df917d6b1c6ca46bdd9cf3de11c203619868be', commands: 'c4f6e41043ce66276ebf0fd40bdd221a25aba71b859dd1936a4cf7529909adc1' },
  'prove:its-05': { tickets: 'f9bc7883e23b59e536cda653f869a74b9054b8d869a0f65a5d9e6f93e72d85d8', screens: '02442a37b7b31ced12324b12195c40a9ed31b61f5b6a0557c15646237c25723a', commands: '1d02f85300908e7fb40f9eeeb5b7f4a1dc968f7520fe2a9a56d1d05ea678c5dc' },
  'prove:its-06': { tickets: '82802765acd7cc5a5f5de48d0c02c3862a959d44858db3a1395ed712031c2612', screens: '85a964af3d446784e3812de0e6fb09854f8dfb832f2af28c8223affec892637f', commands: 'b86f39f019d25aa7847f47bde5c55ca50db94b06c522859b71335f419da12509' },
};

// Every older shift looks and answers exactly as on master, with no new key.
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
const ROUTES = { corp: [{ name: 'TEST-fw', address: '10.20.255.1' }, { name: 'TEST-rtr', address: '10.20.255.2' }, { address: '203.0.113.1', ms: 9 }] };
const PUBLIC = { 'www.example.com': '93.184.215.14' };
// TEST-WS-01: a desk PC whose cable has no link; it kept an APIPA address.
const NO_LINK = { network: {
  adapters: [{ name: 'Ethernet', kind: 'Ethernet', description: 'TEST Ethernet Controller', media: 'Disconnected', speed: '1 Gbps', mac: '3C-52-82-4A-19-07',
    ip: { dhcp: true, address: '169.254.33.10', mask: '255.255.0.0', gateway: '', dnsServers: [] }, lease: CORP_LEASE('10.20.10.141') }],
  routes: ROUTES, publicDns: PUBLIC } };
// TEST-LT-02: docked, two healthy adapters, a stale cache entry, Wi-Fi on
// 2.4 GHz with an adapter told to prefer it.
const WIFI_BANDS = { '2.4 GHz': { channel: 6, signal: 70, linkRate: 86, ms: [2, 180], lost: 2 }, '5 GHz': { channel: 44, signal: 88, linkRate: 573, ms: [2, 4] } };
const DOCKED = { network: {
  adapters: [
    { name: 'Ethernet 2', kind: 'Dock USB Ethernet', description: 'TEST USB GbE', media: 'Connected', speed: '1 Gbps', mac: '00-1B-2C-3D-4E-02', ip: CORP_IP('10.20.10.177'), lease: CORP_LEASE('10.20.10.177') },
    { name: 'Wi-Fi', kind: 'Wi-Fi', description: 'TEST Wi-Fi 6 Adapter', media: 'Connected', mac: '3C-52-82-00-00-02', ip: CORP_IP('10.20.10.178'), lease: CORP_LEASE('10.20.10.178'),
      wifi: { ssid: 'TEST-Corp', protocol: 'Wi-Fi 6 (802.11ax)', security: 'WPA3-Enterprise', band: '2.4 GHz', channel: 6, signal: 70, linkRate: 86, bands: WIFI_BANDS, known: [{ ssid: 'TEST-Corp', security: 'WPA3-Enterprise' }, { ssid: 'TEST-Cafe', security: 'WPA2-Personal' }] } },
  ],
  dnsCache: [{ name: 'intranet.northstar.example', address: '10.20.0.45', ttl: 2950 }], routes: ROUTES, publicDns: PUBLIC },
  devices: [
    { id: 'wifi', category: 'Network adapters', name: 'TEST Wi-Fi 6 Adapter', status: 'OK', driver: { provider: 'TEST', date: '1/1/2026', version: '1.0' }, adapter: 'Wi-Fi', advanced: { preferredBand: 'Prefer 2.4GHz band' } },
    { id: 'eth', category: 'Network adapters', name: 'TEST USB GbE', status: 'OK', driver: { provider: 'TEST', date: '1/1/2026', version: '1.0' } },
  ] };
// TEST-LT-03: on a guest Wi-Fi only.
const GUEST = { network: {
  adapters: [{ name: 'Wi-Fi', kind: 'Wi-Fi', description: 'TEST Wi-Fi 6 Adapter', media: 'Connected', mac: '3C-52-82-00-00-03', ip: { dhcp: true, address: '10.20.90.61', mask: '255.255.255.0', gateway: '10.20.90.1', dnsServers: ['10.20.90.1'], dhcpServer: '10.20.90.1' },
    wifi: { ssid: 'TEST-Guest', protocol: 'Wi-Fi 5 (802.11ac)', security: 'WPA2-Personal', band: '5 GHz', channel: 36, signal: 80, linkRate: 400, known: [{ ssid: 'TEST-Guest', security: 'WPA2-Personal' }] } }],
  routes: { guest: [{ address: '198.51.100.1', ms: 6 }] }, publicDns: PUBLIC } };
// TEST-LT-04: a working wired adapter with a manual address, for the Edit IP
// settings mechanics.
const MANUAL = { network: {
  adapters: [{ name: 'Ethernet', kind: 'Ethernet', description: 'TEST Ethernet Controller', media: 'Connected', speed: '1 Gbps', mac: '3C-52-82-00-00-04',
    ip: { dhcp: false, address: '10.20.10.150', mask: '255.255.255.0', gateway: '10.20.10.1', dnsServers: ['10.20.0.10', '10.20.0.11'] }, lease: CORP_LEASE('10.20.10.151') }],
  routes: ROUTES, publicDns: PUBLIC } };
// TEST-LT-06: outside the office on a home router, with a VPN adapter not yet up.
const HOME = { network: {
  adapters: [
    { name: 'Wi-Fi', kind: 'Wi-Fi', description: 'TEST Wi-Fi 6 Adapter', media: 'Connected', mac: '3C-52-82-00-00-06', ip: { dhcp: true, address: '192.168.0.34', mask: '255.255.255.0', gateway: '192.168.0.1', dnsServers: ['192.168.0.1'], dhcpServer: '192.168.0.1' },
      wifi: { ssid: 'TEST-Home', protocol: 'Wi-Fi 5 (802.11ac)', security: 'WPA2-Personal', band: '5 GHz', channel: 40, signal: 75, linkRate: 433, known: [{ ssid: 'TEST-Home', security: 'WPA2-Personal' }] } },
    { name: 'TEST VPN', kind: 'VPN', description: 'TEST VPN Adapter', media: 'Disconnected', mac: '00-FF-00-00-00-06', ip: { dhcp: true, address: '', dnsServers: [] } },
  ],
  routes: { outside: [{ address: '100.64.0.1', ms: 8 }] }, publicDns: PUBLIC } };
const PC = (name, user) => ({ name, user, os: 'Windows 11 Enterprise 24H2', ip: '10.20.10.99', ou: 'OU=Operations,OU=Workstations', trust: 'Healthy', bitlocker: 'Protected', lastSeen: '1 minute ago', health: 'Healthy' });
const at = (time) => `2026-08-20T${time}:00Z`;
const TICKETS = [
  base({ id: 'HD-9901', number: 'INC0019901', requester: 'Maya Chen', createdAt: at('08:35'), description: 'TEST no link', console: { machines: { 'TEST-WS-01': NO_LINK } } }),
  base({ id: 'HD-9902', number: 'INC0019902', requester: 'Maya Chen', createdAt: at('08:36'), description: 'TEST stale name', console: { machines: { 'TEST-LT-02': DOCKED } } }),
  base({ id: 'HD-9903', number: 'INC0019903', requester: 'Maya Chen', createdAt: at('08:37'), description: 'TEST guest', console: { machines: { 'TEST-LT-03': GUEST } } }),
  base({ id: 'HD-9904', number: 'INC0019904', requester: 'Maya Chen', createdAt: at('08:38'), description: 'TEST manual', console: { machines: { 'TEST-LT-04': MANUAL } } }),
  // No network keys: a dock and a plain device list.
  base({ id: 'HD-9905', number: 'INC0019905', requester: 'Maya Chen', createdAt: at('08:39'), description: 'TEST no network keys', console: { machines: { 'TEST-LT-05': {
    dock: { name: 'TEST Dock', power: true, docked: true, ethernet: 'TEST Dock Ethernet', peripherals: [], monitors: [] },
    devices: [{ id: 'wifi', category: 'Network adapters', name: 'TEST Wi-Fi 6 Adapter', status: 'OK', driver: { provider: 'TEST', date: '1/1/2026', version: '1.0' } }] } } } }),
  base({ id: 'HD-9906', number: 'INC0019906', requester: 'Maya Chen', createdAt: at('08:39'), description: 'TEST outside', console: { machines: { 'TEST-LT-06': HOME } } }),
];
const SETS = {
  'test-net': {
    title: 'Test network state', tickets: ['HD-9901', 'HD-9902', 'HD-9903', 'HD-9904', 'HD-9905', 'HD-9906'], now: '2026-08-20T08:40:00Z',
    computers: [PC('TEST-WS-01', 'Maya Chen'), PC('TEST-LT-02', 'Maya Chen'), PC('TEST-LT-03', 'Maya Chen'), PC('TEST-LT-04', 'Maya Chen'), PC('TEST-LT-05', 'Maya Chen'), PC('TEST-LT-06', 'Maya Chen')],
    directory: { readOnly: true, dns: [{ name: 'intranet', type: 'A', value: '10.20.0.50', ttl: '3600' }] },
  },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));`, ctx);
}
const net = (local) => setSim('test-net', local);
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const actions = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).consoleState.actions`);
const seen = (tab, name) => json(tab, `(hdMachine(${JSON.stringify(name)}).seen || [])`);
const onPc = (id, name) => { const tab = net(); tab.open(id); tab.on(name); return tab; };

// Part A's shape: no link, APIPA kept, /renew fails, then a live jack and /renew works.
function testNoLinkAndRenew() {
  const tab = onPc('HD-9901', 'TEST-WS-01');
  const brief = tab.ps('ipconfig');
  assert.match(brief, /^Windows IP Configuration\n\n\nEthernet adapter Ethernet:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected\n   Connection-specific DNS Suffix  \. : $/);
  const all = tab.ps('ipconfig /all');
  assert.match(all, /Host Name \. \. \. \. \. \. \. \. \. \. \. \. : TEST-WS-01/);
  assert.match(all, /Physical Address\. \. \. \. \. \. \. \. \. : 3C-52-82-4A-19-07/);
  assert.match(all, /DHCP Enabled\. \. \. \. \. \. \. \. \. \. \. : Yes/);
  assert.match(tab.ps('ping 10.20.10.1'), /PING: transmit failed\. General failure\./);
  assert.match(tab.ps('ping files.northstar.example'), /^Ping request could not find host files\.northstar\.example\./);
  assert.equal(tab.ps('tracert 10.20.0.30'), 'Unable to contact IP driver. General failure.');
  assert.match(tab.ps('nslookup files.northstar.example'), /^\*\*\* Default servers are not available/);
  const renew = tab.ps('ipconfig /renew');
  assert.match(renew, /^An error occurred while renewing interface Ethernet : unable to contact your DHCP server\. Request has timed out\./);
  assert.deepEqual(actions(tab, 'HD-9901').map((a) => a.id), ['ip-renew-failed']);
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Network cable unplugged"/);
  assert.match(tab.ps('gpupdate /force'), /lack of network connectivity to a domain controller/);
  assert.match(tab.ps('nltest /dsgetdc:northstar.example'), /ERROR_NO_SUCH_DOMAIN/);
  // The cable goes into a live jack: a link, but still APIPA until renew.
  tab.run("hdMachine('TEST-WS-01').network.adapters[0].media = 'Connected'");
  assert.match(tab.ps('ipconfig'), /Autoconfiguration IPv4 Address\. \. : 169\.254\.33\.10\n   Subnet Mask \. \. \. \. \. \. \. \. \. \. \. : 255\.255\.0\.0\n   Default Gateway \. \. \. \. \. \. \. \. \. : $/m);
  const linked = tab.view('helpdesk/settings-network');
  assert.match(linked, /data-hd-net-status="Connected" data-hd-net-internet="none">[\s\S]*?>Connected, 1\.0 Gbps<\/span>[\s\S]*?>No internet<\/span>/, 'a link at 1.0 Gbps, no internet yet');
  assert.match(tab.ps('ping 10.20.10.1'), /General failure/, 'APIPA has no route');
  assert.match(tab.ps('ipconfig /release'), /Ethernet adapter Ethernet:/);
  const renewed = tab.ps('ipconfig /renew');
  assert.doesNotMatch(renewed, /error/i);
  assert.match(renewed, /IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.141\n   Subnet Mask \. \. \. \. \. \. \. \. \. \. \. : 255\.255\.255\.0\n   Default Gateway \. \. \. \. \. \. \. \. \. : 10\.20\.10\.1/);
  const after = tab.ps('ipconfig /all');
  assert.match(after, /Lease Obtained\. \. \. \. \. \. \. \. \. \. : Thursday, August 20, 2026 8:40:00 AM/, 'lease from the shift clock');
  assert.match(after, /Lease Expires \. \. \. \. \. \. \. \. \. \. : Friday, August 28, 2026 8:40:00 AM/);
  assert.match(after, /DHCP Server \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.20\n   DNS Servers \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.10\n {39}10\.20\.0\.11/);
  assert.deepEqual(actions(tab, 'HD-9901').map((a) => a.id), ['ip-renew-failed', 'ip-release', 'ip-renew']);
  assert.equal(tab.run("hdComputerByName('TEST-WS-01').ip"), '10.20.10.141', 'the computer card shows the new address');
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Connected" data-hd-net-internet="ok">/);
  // Gateway, a company server, the way out, and the services.
  assert.match(tab.ps('ping 10.20.10.1'), /Reply from 10\.20\.10\.1: bytes=32 time=1ms TTL=255[\s\S]*Received = 4, Lost = 0/);
  assert.match(tab.ps('ping files.northstar.example'), /^Pinging files\.northstar\.example \[10\.20\.0\.30\] with 32 bytes of data:\nReply from 10\.20\.0\.30/);
  const route = tab.ps('tracert www.example.com');
  assert.match(route, /^Tracing route to www\.example\.com \[93\.184\.215\.14\]\nover a maximum of 30 hops:\n\n {2}1 .* 10\.20\.10\.1\n {2}2 .* TEST-fw \[10\.20\.255\.1\]\n {2}3 .* TEST-rtr \[10\.20\.255\.2\]\n {2}4 .* 203\.0\.113\.1\n {2}5 .* www\.example\.com \[93\.184\.215\.14\]\n\nTrace complete\.$/);
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /RemoteAddress\s+: 10\.20\.0\.30[\s\S]*RemotePort\s+: 445[\s\S]*InterfaceAlias\s+: Ethernet[\s\S]*SourceAddress\s+: 10\.20\.10\.141[\s\S]*TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection dc01.northstar.example -Port 53'), /TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 3389'), /TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection www.example.com -Port 3389'), /WARNING: TCP connect to \(www\.example\.com : 3389\) failed[\s\S]*TcpTestSucceeded : False/, '3389 on servers only');
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 53'), /TcpTestSucceeded : False/, 'the file server has no DNS');
  assert.match(tab.ps('gpupdate /force'), /Computer Policy update has completed successfully\./);
  assert.match(tab.ps('nltest /dsgetdc:northstar.example'), /DC: \\\\NS-DC01\.northstar\.example[\s\S]*The command completed successfully/);
  const keys = seen(tab, 'TEST-WS-01');
  for (const key of ['ipconfig', 'ipconfig-all', 'net-adapter:Ethernet', 'ping:10.20.10.1', 'ping:files.northstar.example', 'tracert:www.example.com', 'port:files.northstar.example:445', 'port:dc01.northstar.example:53', 'gpupdate', 'dc-locate', 'settings-network']) assert.ok(keys.includes(key), key);
}

// Part B's shape: ping reads the stale cache, nslookup asks the server.
function testStaleCacheAndFlush() {
  const tab = onPc('HD-9902', 'TEST-LT-02');
  const all = tab.ps('ipconfig /all');
  assert.match(all, /Ethernet adapter Ethernet 2:[\s\S]*IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.177\(Preferred\)/);
  assert.match(all, /Wireless LAN adapter Wi-Fi:[\s\S]*IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.178\(Preferred\)/);
  const ping = tab.ps('ping intranet.northstar.example');
  assert.match(ping, /^Pinging intranet\.northstar\.example \[10\.20\.0\.45\] with 32 bytes of data:\nRequest timed out\.\nRequest timed out\.\nRequest timed out\.\nRequest timed out\./);
  assert.match(tab.ps('ipconfig /displaydns'), /A \(Host\) Record \. \. \. : 10\.20\.0\.45/);
  const look = tab.ps('nslookup intranet.northstar.example');
  assert.equal(look, 'Server:  dc01.northstar.example\nAddress:  10.20.0.10\n\nName:    intranet.northstar.example\nAddress:  10.20.0.50');
  assert.match(tab.ps('ping intranet'), /\[10\.20\.0\.45\]/, 'a short name gets the suffix and still hits the cache');
  assert.match(tab.ps('Test-NetConnection intranet.northstar.example -Port 443'), /RemoteAddress\s+: 10\.20\.0\.45[\s\S]*TcpTestSucceeded : False/);
  assert.equal(tab.ps('ipconfig /flushdns'), 'Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.');
  assert.match(tab.ps('ping intranet.northstar.example'), /\[10\.20\.0\.50\][\s\S]*Reply from 10\.20\.0\.50: bytes=32 time=1ms TTL=127/);
  assert.match(tab.ps('Test-NetConnection intranet.northstar.example -Port 443'), /RemoteAddress\s+: 10\.20\.0\.50[\s\S]*InterfaceAlias\s+: Ethernet 2[\s\S]*TcpTestSucceeded : True/, 'wired before Wi-Fi');
  assert.deepEqual(actions(tab, 'HD-9902').map((a) => a.id), ['dns-flush']);
  // The domain apex returns the domain controllers.
  assert.match(tab.ps('nslookup northstar.example'), /Name:    northstar\.example\nAddresses:  10\.20\.0\.10\n {10}10\.20\.0\.11/);
  assert.match(tab.ps('nslookup nothing-here.northstar.example'), /\*\*\* dc01\.northstar\.example can't find nothing-here\.northstar\.example: Non-existent domain/);
  assert.match(tab.ps('nslookup www.example.com'), /Non-authoritative answer:\nName:    www\.example\.com\nAddress:  93\.184\.215\.14/);
  // Clear-DnsClientCache is the same action as /flushdns.
  const other = onPc('HD-9902', 'TEST-LT-02');
  assert.equal(other.ps('Clear-DnsClientCache'), '');
  assert.deepEqual(actions(other, 'HD-9902').map((a) => a.id), ['dns-flush']);
  assert.match(other.ps('ping intranet.northstar.example'), /\[10\.20\.0\.50\]/);
}

// Guest Wi-Fi: company addresses refused by its gateway, company names unknown.
function testGuestNetwork() {
  const tab = onPc('HD-9903', 'TEST-LT-03');
  assert.match(tab.ps('ping 10.20.0.30'), /Reply from 10\.20\.90\.1: Destination host unreachable\./);
  assert.equal(tab.ps('nslookup files.northstar.example'), "Server:  UnKnown\nAddress:  10.20.90.1\n\n*** UnKnown can't find files.northstar.example: Non-existent domain");
  assert.match(tab.ps('ping files.northstar.example'), /could not find host/);
  assert.match(tab.ps('tracert www.example.com'), / {2}1 .* 10\.20\.90\.1\n {2}2 .* 198\.51\.100\.1\n {2}3 .* www\.example\.com/);
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /^WARNING: Name resolution of files\.northstar\.example failed/);
  assert.match(tab.ps('Resolve-DnsName files.northstar.example'), /DNS name does not exist/);
  assert.match(tab.ps('nltest /dsgetdc:northstar.example'), /ERROR_NO_SUCH_DOMAIN/);
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Connected, secured"/);
  // Manage known networks › Forget disconnects the network it is on.
  tab.run("hdNetPanel('TEST-LT-03','known','Wi-Fi')");
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-known="TEST-Guest"/);
  tab.run("hdNetForget('TEST-LT-03','Wi-Fi','TEST-Guest')");
  const after = tab.view('helpdesk/settings-network');
  assert.doesNotMatch(after, /data-hd-known="TEST-Guest"/);
  assert.match(after, /data-hd-net-status="Not connected"/);
  const forget = actions(tab, 'HD-9903').find((a) => a.id === 'wifi-forget');
  assert.equal(forget.ssid, 'TEST-Guest');
  assert.equal(forget.connected, true);
  assert.match(tab.ps('ipconfig'), /Wireless LAN adapter Wi-Fi:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/);
  assert.match(tab.ps('netsh wlan show interfaces'), /State +: disconnected/);
  assert.ok(seen(tab, 'TEST-LT-03').includes('known-networks'));
}

// Settings › Network & internet: Hardware properties, Wi-Fi Properties and
// netsh / Get-Net* earning the same keys.
function testSettingsScreens() {
  const tab = onPc('HD-9902', 'TEST-LT-02');
  const list = tab.view('helpdesk/settings-network');
  assert.match(list, /data-hd-net-adapter="Ethernet 2" data-hd-net-status="Connected"/);
  assert.match(list, /data-hd-net-adapter="Wi-Fi" data-hd-net-status="Connected, secured"/);
  assert.ok(seen(tab, 'TEST-LT-02').includes('settings-network'));
  tab.run("hdNetPanel('TEST-LT-02','hardware','Ethernet 2')");
  const hw = tab.view('helpdesk/settings-network');
  assert.match(hw, /data-hd-net-prop="IP assignment">Automatic \(DHCP\)</);
  assert.match(hw, /data-hd-net-prop="DNS server assignment">Automatic \(DHCP\)</);
  assert.match(hw, /data-hd-net-prop="IPv4 address">10\.20\.10\.177</);
  assert.match(hw, /data-hd-net-prop="IPv4 DNS servers">10\.20\.0\.10, 10\.20\.0\.11</);
  assert.match(hw, /data-hd-net-prop="Physical address \(MAC\)">00-1B-2C-3D-4E-02</);
  assert.match(hw, /data-hd-net-prop="Link speed \(Receive\/Transmit\)">1000\/1000 \(Mbps\)</);
  tab.run("hdNetPanel('TEST-LT-02','wifi','Wi-Fi')");
  const wifi = tab.view('helpdesk/settings-network');
  assert.match(wifi, /data-hd-net-prop="SSID">TEST-Corp</);
  assert.match(wifi, /data-hd-net-prop="Protocol">Wi-Fi 6 \(802\.11ax\)</);
  assert.match(wifi, /data-hd-net-prop="Security type">WPA3-Enterprise</);
  assert.match(wifi, /data-hd-net-prop="Network band">2\.4 GHz</);
  assert.match(wifi, /data-hd-net-prop="Network channel">6</);
  assert.match(wifi, /data-hd-net-prop="Link speed \(Receive\/Transmit\)">86\/86 \(Mbps\)</);
  const screenKeys = seen(tab, 'TEST-LT-02');
  // The typed lines record the same keys on a fresh shift.
  const typed = onPc('HD-9902', 'TEST-LT-02');
  assert.match(typed.ps('Get-NetAdapter'), /Ethernet 2 +TEST USB GbE +\d+ +Up +00-1B-2C-3D-4E-02 1 Gbps/);
  assert.match(typed.ps('Get-NetIPConfiguration -InterfaceAlias "Ethernet 2"'), /InterfaceAlias       : Ethernet 2[\s\S]*IPv4Address          : 10\.20\.10\.177[\s\S]*DNSServer            : 10\.20\.0\.10\n {23}10\.20\.0\.11/);
  assert.match(typed.ps('netsh wlan show interfaces'), /SSID +: TEST-Corp[\s\S]*Authentication +: WPA3-Enterprise[\s\S]*Band +: 2\.4 GHz[\s\S]*Channel +: 6/);
  assert.match(typed.ps('Get-DnsClientServerAddress -InterfaceAlias Wi-Fi'), /Wi-Fi +\d+ +IPv4 +\{10\.20\.0\.10, 10\.20\.0\.11\}/);
  const typedKeys = seen(typed, 'TEST-LT-02');
  for (const key of ['settings-network', 'net-adapter:Ethernet 2', 'wifi-properties']) {
    assert.ok(screenKeys.includes(key), `screen ${key}`);
    assert.ok(typedKeys.includes(key), `typed ${key}`);
  }
  assert.ok(typedKeys.includes('net-adapter:Wi-Fi'));
  // nslookup and Resolve-DnsName earn the same key.
  const a = onPc('HD-9902', 'TEST-LT-02'); a.ps('nslookup intranet.northstar.example');
  const b = onPc('HD-9902', 'TEST-LT-02'); assert.match(b.ps('Resolve-DnsName intranet.northstar.example'), /intranet\.northstar\.example +A +3600 +Answer +10\.20\.0\.50/);
  assert.ok(seen(a, 'TEST-LT-02').includes('nslookup:intranet.northstar.example'));
  assert.ok(seen(b, 'TEST-LT-02').includes('nslookup:intranet.northstar.example'));
  // The tool grid offers the screen.
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="settings-network"/);
}

// Edit IP settings and Set-NetIPInterface: Manual to Automatic, old and new logged.
function testEditIpSettings() {
  const tab = onPc('HD-9904', 'TEST-LT-04');
  assert.match(tab.ps('ipconfig /all'), /DHCP Enabled\. \. \. \. \. \. \. \. \. \. \. : No[\s\S]*IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.150\(Preferred\)/);
  assert.doesNotMatch(tab.ps('ipconfig /all'), /DHCP Server|Lease Obtained/);
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Connected"/);
  assert.equal(tab.ps('ipconfig /renew').includes('error'), false, '/renew leaves a manual adapter alone');
  tab.run("hdNetPanel('TEST-LT-04','hardware','Ethernet')");
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-prop="IP assignment">Manual</);
  tab.run("hdNetPanel('TEST-LT-04','edit','Ethernet')");
  const edit = tab.view('helpdesk/settings-network');
  assert.match(edit, /<option value="manual" selected>Manual<\/option>/);
  assert.match(edit, /id="hd-net-ip"[^>]*value="10\.20\.10\.150"/);
  // A bad address is refused with a plain line, the typed values stay, nothing changes.
  const values = { 'hd-net-mode': 'manual', 'hd-net-ip': '10.20.10.300', 'hd-net-mask': '255.255.255.0' };
  tab.ctx.document.getElementById = (id) => (id in values ? { value: values[id] } : null);
  tab.run("hdNetSaveIp({ preventDefault() {} }, 'TEST-LT-04', 'Ethernet')");
  const refused = tab.view('helpdesk/settings-network');
  assert.match(refused, /four numbers from 0 to 255/);
  assert.match(refused, /id="hd-net-ip"[^>]*value="10\.20\.10\.300"/);
  assert.equal(actions(tab, 'HD-9904').length, 0);
  // Saving the same manual values changes nothing and records nothing.
  Object.assign(values, { 'hd-net-ip': '10.20.10.150', 'hd-net-gw': '10.20.10.1', 'hd-net-dns1': '10.20.0.10', 'hd-net-dns2': '10.20.0.11' });
  tab.run("hdNetSaveIp({ preventDefault() {} }, 'TEST-LT-04', 'Ethernet')");
  assert.equal(actions(tab, 'HD-9904').length, 0);
  values['hd-net-mode'] = 'dhcp';
  tab.run("hdNetSaveIp({ preventDefault() {} }, 'TEST-LT-04', 'Ethernet')");
  tab.ctx.document.getElementById = () => null;
  const change = actions(tab, 'HD-9904').find((a) => a.id === 'ip-settings');
  assert.equal(change.from, 'Manual (10.20.10.150)');
  assert.equal(change.to, 'Automatic (DHCP)');
  assert.equal(change.before.gateway, '10.20.10.1');
  assert.equal(change.after.address, '10.20.10.151');
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-prop="IP assignment">Automatic \(DHCP\)</);
  assert.match(tab.ps('ipconfig'), /10\.20\.10\.151/);
  // Automatic to Manual is logged with old and new values too.
  const back = onPc('HD-9904', 'TEST-LT-04');
  back.run("hdMachine('TEST-LT-04').network.adapters[0].ip = { dhcp:true, address:'10.20.10.151', mask:'255.255.255.0', gateway:'10.20.10.1', dnsServers:['10.20.0.10'], dhcpServer:'10.20.0.20' }");
  const manual = { 'hd-net-mode': 'manual', 'hd-net-ip': '10.20.10.152', 'hd-net-mask': '255.255.255.0', 'hd-net-gw': '10.20.10.1', 'hd-net-dns1': '10.20.0.10' };
  back.ctx.document.getElementById = (id) => (id in manual ? { value: manual[id] } : null);
  back.run("hdNetSaveIp({ preventDefault() {} }, 'TEST-LT-04', 'Ethernet')");
  back.ctx.document.getElementById = () => null;
  const set = actions(back, 'HD-9904').find((a) => a.id === 'ip-settings');
  assert.deepEqual([set.from, set.to, set.before.address, set.after.address], ['Automatic (DHCP)', 'Manual (10.20.10.152)', '10.20.10.151', '10.20.10.152']);
  // The same change to Automatic, typed.
  const typed = onPc('HD-9904', 'TEST-LT-04');
  assert.match(typed.ps('Set-NetIPInterface -InterfaceAlias Ethernet -Dhcp Disabled'), /only turns DHCP on/);
  assert.equal(typed.ps('Set-NetIPInterface -InterfaceAlias Ethernet -Dhcp Enabled'), '');
  const same = actions(typed, 'HD-9904').find((a) => a.id === 'ip-settings');
  assert.equal(same.from, 'Manual (10.20.10.150)');
  assert.equal(same.to, 'Automatic (DHCP)');
  assert.match(typed.ps('ipconfig'), /10\.20\.10\.151/);
  assert.match(typed.ps('Set-NetIPInterface -InterfaceAlias Nope -Dhcp Enabled'), /No MSFT_NetIPInterface objects found/);
}

// A DHCP address kept from another VLAN carries nothing until /renew; a DNS
// server that doesn't answer times out, and the resolver tries the next one.
function testLinkAndDnsServers() {
  const moved = onPc('HD-9904', 'TEST-LT-04');
  moved.run("hdMachine('TEST-LT-04').network.adapters[0].ip = { dhcp:true, address:'10.20.30.77', mask:'255.255.255.0', gateway:'10.20.30.1', dnsServers:['10.20.0.10'], dhcpServer:'10.20.0.20' }");
  assert.match(moved.view('helpdesk/settings-network'), /data-hd-net-status="Connected" data-hd-net-internet="none"/);
  assert.match(moved.ps('ping 10.20.30.1'), /General failure/);
  assert.match(moved.ps('ipconfig /renew'), /10\.20\.10\.151/);
  assert.match(moved.view('helpdesk/settings-network'), /data-hd-net-status="Connected" data-hd-net-internet="ok"/);
  const wrong = onPc('HD-9904', 'TEST-LT-04');
  wrong.run("hdMachine('TEST-LT-04').network.adapters[0].ip.dnsServers = ['10.20.0.99']");
  assert.match(wrong.ps('nslookup files.northstar.example'), /^DNS request timed out\.[\s\S]*Address:  10\.20\.0\.99[\s\S]*Request to UnKnown timed-out/);
  assert.match(wrong.ps('nslookup www.example.com'), /timed out/);
  assert.match(wrong.ps('ping files.northstar.example'), /could not find host/);
  const second = onPc('HD-9904', 'TEST-LT-04');
  second.run("hdMachine('TEST-LT-04').network.adapters[0].ip.dnsServers = ['10.20.0.99', '10.20.0.11']");
  assert.match(second.ps('nslookup files.northstar.example'), /timed out/, 'nslookup asks only the first server');
  assert.match(second.ps('ping files.northstar.example'), /\[10\.20\.0\.30\][\s\S]*Reply from 10\.20\.0\.30/);
  // A laptop with its dock cable out and Wi-Fi up: /renew skips the cable.
  const dock = onPc('HD-9902', 'TEST-LT-02');
  dock.run("hdMachine('TEST-LT-02').network.adapters[0].media = 'Disconnected'");
  const renew = dock.ps('ipconfig /renew');
  assert.match(renew, /No operation can be performed on Ethernet 2 while it has its media disconnected\./);
  assert.doesNotMatch(renew, /unable to contact/);
  assert.deepEqual(actions(dock, 'HD-9902').map((a) => a.id), ['ip-renew']);
  // Forgetting the network takes the Wi-Fi off: no traffic even with an address.
  const off = onPc('HD-9902', 'TEST-LT-02');
  off.run("hdMachine('TEST-LT-02').network.adapters[0].media = 'Disconnected'");
  off.run("hdNetForget('TEST-LT-02','Wi-Fi','TEST-Corp')");
  off.run("hdMachine('TEST-LT-02').network.adapters[1].ip = { dhcp:true, address:'10.20.10.178', mask:'255.255.255.0', gateway:'10.20.10.1', dnsServers:['10.20.0.10'] }");
  assert.match(off.ps('ping 10.20.10.1'), /General failure/);
  assert.equal(off.ps('ipconfig /renew').includes('10.20.10.178'), false);
}

// Outside the office: the home router knows no company names; with the VPN
// adapter up, company traffic and names go through it and the rest doesn't.
function testOutsideAndVpn() {
  const tab = onPc('HD-9906', 'TEST-LT-06');
  assert.match(tab.ps('ipconfig /all'), /Unknown adapter TEST VPN:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/);
  assert.equal(tab.ps('nslookup intranet.northstar.example'), "Server:  UnKnown\nAddress:  192.168.0.1\n\n*** UnKnown can't find intranet.northstar.example: Non-existent domain");
  assert.match(tab.ps('ping 10.20.0.30'), /Request timed out\.[\s\S]*Lost = 4/);
  assert.match(tab.ps('ping www.example.com'), /Reply from 93\.184\.215\.14/);
  assert.match(tab.ps('tracert www.example.com'), / {2}1 .* 192\.168\.0\.1\n {2}2 .* 100\.64\.0\.1\n {2}3 .* www\.example\.com/);
  tab.run("Object.assign(hdMachine('TEST-LT-06').network.adapters[1], { media:'Connected', ip:{ dhcp:true, address:'10.20.250.37', mask:'255.255.255.0', gateway:'', dnsServers:['10.20.0.10', '10.20.0.11'], dhcpServer:'10.20.250.1' } })");
  assert.equal(tab.ps('nslookup intranet.northstar.example'), 'Server:  dc01.northstar.example\nAddress:  10.20.0.10\n\nName:    intranet.northstar.example\nAddress:  10.20.0.50');
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /InterfaceAlias\s+: TEST VPN[\s\S]*SourceAddress\s+: 10\.20\.250\.37[\s\S]*TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection www.example.com -Port 443'), /InterfaceAlias\s+: Wi-Fi[\s\S]*TcpTestSucceeded : True/, 'split tunnel: the rest stays on Wi-Fi');
  assert.match(tab.ps('nslookup www.example.com'), /Address:  192\.168\.0\.1[\s\S]*93\.184\.215\.14/);
  assert.match(tab.ps('nltest /dsgetdc:northstar.example'), /The command completed successfully/);
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-adapter="TEST VPN" data-hd-net-status="Connected" data-hd-net-internet="ok"/);
}

// Device Manager › Advanced › Preferred band: old and new logged, Wi-Fi reconnects.
function testPreferredBand() {
  const tab = onPc('HD-9902', 'TEST-LT-02');
  assert.match(tab.ps('ping -n 20 10.20.10.1'), /Wi-Fi|Reply/, 'runs');
  // Ethernet 2 carries the traffic; take the dock away so the Wi-Fi does.
  tab.run("hdMachine('TEST-LT-02').network.adapters[0].media = 'Disconnected'");
  const before = tab.ps('ping 10.20.10.1 -n 20');
  assert.match(before, /Sent = 20, Received = 18, Lost = 2 \(10% loss\)[\s\S]*Minimum = 2ms, Maximum = 180ms/);
  tab.run("hdDeviceOpen('TEST-LT-02','wifi','advanced')");
  const view = tab.view('helpdesk/device-manager');
  assert.match(view, /role="tab" aria-selected="true" onclick="[^"]*'advanced'\)">Advanced</);
  assert.match(view, /<option selected>Prefer 2\.4GHz band<\/option>/);
  tab.ctx.document.getElementById = (id) => (id === 'hd-dev-band' ? { value: 'Prefer 5GHz band' } : null);
  tab.run("hdDeviceAdvancedSet('TEST-LT-02','wifi')");
  tab.ctx.document.getElementById = () => null;
  const change = actions(tab, 'HD-9902').find((a) => a.id === 'adapter-property');
  assert.deepEqual([change.property, change.from, change.to], ['Preferred band', 'Prefer 2.4GHz band', 'Prefer 5GHz band']);
  assert.match(tab.ps('netsh wlan show interfaces'), /Band +: 5 GHz\n +Channel +: 44\n +Receive rate \(Mbps\) +: 573/);
  const after = tab.ps('ping 10.20.10.1 -n 20');
  assert.match(after, /Received = 20, Lost = 0[\s\S]*Minimum = 2ms, Maximum = 4ms/);
  // No Advanced tab for a device without the key.
  tab.run("hdDeviceOpen('TEST-LT-02','eth','advanced')");
  const eth = tab.view('helpdesk/device-manager');
  assert.doesNotMatch(eth, />Advanced</);
  assert.match(eth, /aria-selected="true"[^>]*>General</);
}

// A test ticket with no network keys: Settings shows the old dock view, the
// commands give the old answers, Device Manager has no Advanced tab.
function testNoKeysAsBefore() {
  const tab = onPc('HD-9905', 'TEST-LT-05');
  const settings = tab.view('helpdesk/settings-network');
  assert.match(settings, /<li data-hd-ethernet="connected">Ethernet \(TEST Dock Ethernet\): Connected<\/li><li>Wi-Fi: Connected<\/li>/);
  assert.doesNotMatch(settings, /data-hd-netstate/);
  assert.match(tab.ps('ipconfig'), /outside this training shell/);
  assert.equal(tab.ps('Test-NetConnection 10.20.70.20 -Port 9100'), 'ComputerName: purchasing.northstar.example\nRemotePort: 443\nInterfaceAlias: Wi-Fi\nTcpTestSucceeded: True');
  assert.match(tab.ps('Get-NetIPConfiguration'), /^InterfaceAlias: Wi-Fi\nIPv4Address: 10\.20\.10\.99/);
  tab.run("hdDeviceOpen('TEST-LT-05','wifi','advanced')");
  assert.doesNotMatch(tab.view('helpdesk/device-manager'), />Advanced</);
  assert.doesNotMatch(tab.ps('Get-Help'), /ipconfig/);
  // With network state, Get-Help lists the lines; a typo gets a hint.
  const on = onPc('HD-9902', 'TEST-LT-02');
  assert.match(on.ps('Get-Help'), /Network: ipconfig \[\/all/);
  assert.match(on.ps('ipconfg /all'), /Did you mean: ipconfig/);
}

// Typed through the PowerShell screen: the history keeps each line, and a
// Practice feedback rule can read it.
function testTypedHistory() {
  const tab = onPc('HD-9901', 'TEST-WS-01');
  tab.shell('ipconfig /all');
  tab.shell('ping 10.20.10.1');
  const log = json(tab, "hdState.practiceLog.filter((e) => e.type === 'command_run').map((e) => [e.command, e.computer, e.result])");
  assert.deepEqual(log.map((row) => row.slice(0, 2)), [['ipconfig /all', 'TEST-WS-01'], ['ping 10.20.10.1', 'TEST-WS-01']]);
  assert.match(log[1][2], /general failure/);
}

// A Prove shift whose machine has network state: the same answers, no help
// lines, commands in the record, nothing changes once it is locked.
function testProveShift() {
  const before = `{ const shift = HD_PROVE_SHIFTS['its-01']; const name = shift.selectedComputer; Object.assign(shift.machines[name], ${JSON.stringify(DOCKED)}); }`;
  const tab = sim({ url: proveUrl('its-01'), withTest: false, before });
  const name = tab.run('hdState.selectedComputer');
  assert.match(tab.ps('ping intranet.northstar.example'), /\[10\.20\.0\.45\]/);
  assert.doesNotMatch(tab.ps('Get-Help'), /Network: ipconfig/);
  assert.doesNotMatch(tab.ps('ipconfig /bogus'), /Try:/);
  tab.shell('ipconfig /flushdns');
  const events = json(tab, "hdState.prove.events.filter((e) => e.type === 'command_run' || e.type === 'action_taken').map((e) => [e.type, e.command || e.value, e.computer])");
  assert.deepEqual(events, [['command_run', 'ipconfig /flushdns', name], ['action_taken', 'dns-flush', name]]);
  tab.run("hdState.machineView = { computer:hdState.selectedComputer }");
  tab.run("hdNetPanel(hdState.selectedComputer,'hardware','Wi-Fi')");
  tab.run("hdNetPanel(hdState.selectedComputer,'wifi','Wi-Fi')");
  tab.run("hdNetPanel(hdState.selectedComputer,'known','Wi-Fi')");
  tab.run("hdOpenMachineScreen(hdState.selectedComputer,'settings-network')");
  const screens = json(tab, 'hdState.prove.opened').filter((source) => source.endsWith(name) || source.includes(`:${name}:`));
  // The typed lines leave the same Prove sources on a fresh shift.
  const typed = sim({ url: proveUrl('its-01'), withTest: false, before });
  typed.ps('Get-NetAdapter'); typed.ps('Get-NetIPConfiguration -InterfaceAlias Wi-Fi'); typed.ps('netsh wlan show interfaces'); typed.ps('netsh wlan show profiles');
  const lines = json(typed, 'hdState.prove.opened');
  for (const source of [`net-adapter:${name}:Wi-Fi`, `wifi-properties:${name}`, `known-networks:${name}`, `settings-network:${name}`]) {
    assert.ok(screens.includes(source), `screen ${source}`);
    assert.ok(lines.includes(source), `typed ${source}`);
  }
  tab.run("hdProveServer.status = 'waiting'");
  assert.equal(tab.ps('ipconfig /release'), '');
  assert.match(tab.ps('ipconfig'), /10\.20\.10\.177/, 'nothing released once locked');
}

const TESTS = [testOldShiftsUnchanged, testNoLinkAndRenew, testStaleCacheAndFlush, testGuestNetwork, testSettingsScreens, testEditIpSettings, testLinkAndDnsServers, testOutsideAndVpn, testPreferredBand, testNoKeysAsBefore, testTypedHistory, testProveShift];
let passed = 0;
for (const test of TESTS) {
  test();
  passed += 1;
  console.log(`ok - ${test.name}`);
}
console.log(`hdesk-m09-console-a: ${passed} passed`);

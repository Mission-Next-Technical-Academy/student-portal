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
class FixedDate extends Date {
  constructor(...args) { if (args.length) super(...args); else super(FIXED); }
  static now() { return FIXED; }
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
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store() } = {}) {
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
 * `node tests/hdesk-m09-console-a.test.js --print-pins`. */
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
  shared: { tickets: '74b5f418f55e63f842783a72c0634377218100f07e4555ad4ec061efee81bf6f', screens: 'db0589042c823cfaa177c4f0f7b166bac15218c5b6b1cb5e087a0235149204c3', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
  'practice:its-01': { tickets: '3f7bbb2cc0b79a842cd3e35798485547a334daf16e70e5b15ee13e0864581bea', screens: 'db0589042c823cfaa177c4f0f7b166bac15218c5b6b1cb5e087a0235149204c3', commands: 'a1ea0dd2c104343bce4d5ecbe019f697a705f88a8828e9ac472cdc7ba2aba8cd' },
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
  'coached:its-06-extension': { tickets: 'e564ddc81c5fd516ca85c3fbdd43e865fb493f0a3bb3cd27511a6c4c421b4dd5', screens: '142d7dc46603c8471edeae22f1fd67805d8e2404d11720164080781e40ac1fcb', commands: '090acf667af0215fd37ec76f1d2226321730ddff98380c3cc9a8948f6b48b1ae' },
  'prove:its-01': { tickets: '8388f60cfaeec622be3e70f1bde5295d5e3501e293b430bef74bf12d2287b368', screens: '8172b9a1925d6e59cafc3a10f7b86ab46cd4bb174aa52c4d95c6b10ef410abf0', commands: 'fc6226fbbb1a5bcf8b9400475b80a8f33099511902da85cd63ba24980125bb75' },
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
function addTestData(ctx) {
  ctx.__test = { tickets: [], sets: {} };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));`, ctx);
}

const TESTS = [testOldShiftsUnchanged];
let passed = 0;
for (const test of TESTS) {
  test();
  passed += 1;
  console.log(`ok - ${test.name}`);
}
console.log(`hdesk-m09-console-a: ${passed} passed`);

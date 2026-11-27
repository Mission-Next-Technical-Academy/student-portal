'use strict';
/* Help Desk simulator: Module 10 (key its-08), console A (ui/helpdesk.js
 * "Remote sessions"): the Remote Support screen with Quick Assist and
 * Northstar's Remote Support tool, the session states, the session panel
 * (timer, remote screen, Say to the user, Ask the user, System info, Event
 * log, the command console, End session), the session log line on the
 * ticket's activity, a PC's clock, time source, secure channel and sign-in
 * message on its machine fixture, and the typed lines w32tm /query /status,
 * w32tm /resync, Test-ComputerSecureChannel, Get-Date, Get-WinEvent -LogName
 * System and the refused domain-membership commands.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST- names), never in ui/helpdesk-data.js. No Module 10 content. Every
 * older ticket, set and Prove shift must look and behave as before: the
 * Remote Support screen, the Windows Desktop and the command answers are
 * pinned against master. */
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
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store() } = {}) {
  const u = new URL(url);
  const toasts = [];
  const fields = {};
  const ctx = {
    console, URL, URLSearchParams, JSON, Math: seededMath(), Date: FixedDate,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => (Object.prototype.hasOwnProperty.call(fields, id) ? { value: fields[id] } : null), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
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
  const type = (id, value, code) => { fields[id] = value; try { return run(code); } finally { delete fields[id]; } };
  return {
    ctx, toasts, run, type,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    shell: (command) => type('hd-ps-input', command, 'hdRunPowerShell({ preventDefault() {} })'),
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}; hdState.machineView = { computer:${j(computer)} }`),
  };
}
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m10a#/helpdesk/tickets`;

/* ---------- Master's output, pinned ----------
 * Every older shift (the shared queue, each practice set, each coached set
 * and each Prove shift): the Remote Support screen, and on the shift's own
 * computer and every computer with machine state, the Windows Desktop and
 * every command this part adds, typed in order with the machine state after
 * each. Computed on master at f733f36 with
 * `node tests/hdesk-m10-console-a.test.js --print-pins`. */
const PIN_COMMANDS = [
  'w32tm /query /status', 'w32tm /resync', 'Test-ComputerSecureChannel', 'Test-ComputerSecureChannel -Repair',
  'Reset-ComputerMachinePassword', 'Remove-Computer', 'Add-Computer -DomainName northstar.example', 'Get-Date',
  'Get-WinEvent -LogName System -MaxEvents 20', 'Test-NetConnection NS-DC01 -Port 3389', 'Test-NetConnection NS-DC01 -Port 22', 'Get-Help',
];
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
  const out = {};
  const first = make();
  const home = first.run('hdState.selectedComputer');
  const tickets = first.run('hdState.tickets.map((t) => t.id)');
  const computers = [...new Set([home, ...first.run('Object.keys(hdState.machines || {})')])];
  const remote = [first.view('helpdesk/remote-support')];
  const ticketScreens = [];
  for (const id of tickets) { ticketScreens.push(first.open(id)); remote.push(first.view('helpdesk/remote-support')); }
  out.remote = sha(remote.map(sha).join(','));
  out.tickets = sha(ticketScreens.map(sha).join(','));
  const state = (tab) => tab.run('JSON.stringify([hdState.machines || {}, hdState.computerOverrides || {}, hdState.tickets.map((t) => [t.troubleshootingHistory, t.consoleState || null]), hdState.prove || null, hdState.practiceLog || [], hdState.powershell || []])');
  const screens = [];
  const commands = [];
  for (const computer of computers) {
    const tab = make();
    tab.on(computer);
    for (const route of ['helpdesk/windows', 'helpdesk/event-viewer', 'helpdesk/virtual-desktops']) screens.push(sha(tab.view(route)));
    for (const command of PIN_COMMANDS) {
      commands.push(sha(tab.ps(command)));
      commands.push(sha(state(tab)));
    }
    // Through the PowerShell screen, as a student types it.
    for (const command of ['w32tm /query /status', 'Test-ComputerSecureChannel']) { commands.push(sha(tab.shell(command))); commands.push(sha(state(tab))); }
    screens.push(sha(tab.view('helpdesk/powershell')));
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
  shared: { remote: '85e7d7e2e4ea1c47883e3c9ed71eb4786d3367b18e03f061e30dd232ea28f1de', tickets: '28eca56e7c6ab65d221b05a8557a70a3657b0852c368d7df7c6ea3970213f51f', screens: '943579a7c85b8905a918b7ad8e805c6259c035ba0fd383d3f50e626fb7125e45', commands: '06351dffe97e5a28b99af059d0c9a0104703b36438719f4bd3095e08b89263d9' },
  'practice:its-01': { remote: '0e4a550dea88712bc238ee24b13c2162d9ac99f1198ce43779f3d1bcba9dcbde', tickets: 'aaff637984c4cfab2070026a01cc0117f6bb55cfffb3a72ec5c451365ffff015', screens: 'ec7b90603b66b60b9537697be45a93ae8605e1ad102e38136b4a6abe790ddcde', commands: '19eefce6a9e5683e2ca242185ff6d7f26e12587782bdca9b8d15a02eb05e3c9f' },
  'practice:its-10': { remote: '1050368a4496fe1b318a59aa3510f14ba442e48bcbf7368c1688b6dafd590a4f', tickets: '7178b6d765756fa666e041bd909834f478902a84792706af0fe1987b478a2aeb', screens: '7748dc0c7a73d24df12376ce3bb51d0a673cdd9f8779271eb6f9e3e09ba47cc2', commands: 'a1fef66135b92e1246f17f2d8b9dc77e793b7db9e4d38a9e9607bc2a4071a286' },
  'practice:its-11': { remote: '56974b4559bc53b70ad0bb50376de62f8c8ab276be8170a2ffa2cce179a1ad97', tickets: '300e2afc6cc2f22db756f8bee61feb51a29e111adc439d2e96404800d1ee0a04', screens: '7748dc0c7a73d24df12376ce3bb51d0a673cdd9f8779271eb6f9e3e09ba47cc2', commands: 'e1a6a7b46bbe684a558d7e93654a05f626546c89baf86aba729327d3ce699f5c' },
  'practice:its-02': { remote: '0e4a550dea88712bc238ee24b13c2162d9ac99f1198ce43779f3d1bcba9dcbde', tickets: '52a0ddd18c70923b5f3265fa23c3d93a104c95d4e65fc412bafd684d2f130fac', screens: '36c37e1a0bb131f850990bdeea248702b449321e9406e5d2c6c0f053713f5dba', commands: '5bce44d96746108fdcbf8a69f45fe981fc8f6ad1123d2091ee1544c3cf4d319e' },
  'practice:its-03': { remote: 'c4776c5e55f4b8d10cd23a2277461bc9a790ff0f458ae1ac9828c733206866bd', tickets: '7352ad2392787eff41313e9a11963ecfc649a26c2ed78d959031386b43829ea3', screens: 'e5ffedde9f632b9bc6f0530071a8456cc9c18d587e998aa0004b8b292d6b2cf2', commands: '663beee7fffdb4ac684c8f98bd20a5558ea526f9b2f83cff61ecb9d141cf324a' },
  'practice:its-07': { remote: '56974b4559bc53b70ad0bb50376de62f8c8ab276be8170a2ffa2cce179a1ad97', tickets: 'c26b9cc3fa72ac7e90278de9bbb26a6e44afa6d536818f40d35b907fc57d9b1b', screens: 'ec2cce163ac5b13df54fd69f886a8681e6f3b52cb286383a8c4d32c7fbd77685', commands: '3407889dc9dfa49f02c7741a09054fe80460baf5247fbe4a6aea4573fc94b101' },
  'practice:its-05': { remote: '1519179a9f87b4ad64fa216b44dc5c2b270b01396e22f7c586f852f0ab25ce9a', tickets: '0c54d5a36524862937d58b86f1b1602b661ba3b4c8c0e4280ff9c69cd0eccc2d', screens: '7cacfee1aa0314c7caab4737efad94738d69471518c0e51d0bc0644156dc8a6c', commands: 'ab0f7569529e64dfa4811bd5c33fb7a03b27ae7597e5e3459fdd805578bfd6ae' },
  'practice:its-06': { remote: '96476f08772a03ea6338fe6afd4acaa6c1f45e0abcf036545bd5ba6666249972', tickets: '12e6d2059c47d770cac87102c8ba23e4f06d4f7d9f6a2f1506d9268e75b9d9c0', screens: '768726107c36901fa228bb82ae55708756e23134f2f652c4a150bbccabde92c8', commands: '3ac7e278faacef9ad60f4e9c46e3fece38178deb99f8882c5c10a4f96b8663ad' },
  'practice:its-04': { remote: 'ad470670be6efee6e1895483191307871e68b3684fa3c5d2dd5ce6470b6342bd', tickets: 'c90ceae9fb0cd40720aed452e5a1ba167016688ab2937ed4e091b0ff0034dfb8', screens: '874fa66a650857c29666d827140c3c3d6fa6575863e64b171dd9ca1f0a1ec6f8', commands: 'fe4a7f850b6d2bdd920151c9665e53bde15928a3de86c3921865f6956043f1b0' },
  'coached:its-10-guided': { remote: 'c4776c5e55f4b8d10cd23a2277461bc9a790ff0f458ae1ac9828c733206866bd', tickets: '791e792d7e3c90c8ae149a31e91d6807e4d89ef7effc3b5a1f344053cad2d2b0', screens: '7748dc0c7a73d24df12376ce3bb51d0a673cdd9f8779271eb6f9e3e09ba47cc2', commands: '3ad810df4fb51f9ba4c739db6c8fa40fbe33d334d6f038f8385bb2a428e68b48' },
  'coached:its-11-guided': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: 'a6008aab94d14aeaaa55658ff6218d351168faa9978ce3cc98ee57a5a20a89ba', screens: '7748dc0c7a73d24df12376ce3bb51d0a673cdd9f8779271eb6f9e3e09ba47cc2', commands: 'd8c4421ebb52c7e9c68b794788e8b85bc99cb77ba2579421159f3e9e3cbcb67e' },
  'coached:its-02-guided': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: '2a18cfe379cc4886762a92e2f819abd5ed3d6026f613e9e569e64bbbc5511c79', screens: 'ef3b26b238f0d553a6578e6401ce34aa40f80434150b09dd95b03b75e2e4231a', commands: '5f85c5d9096b28ccc2574746294b57b55cd9ee593bd0cfb3f1f5d9fdfa371d30' },
  'coached:its-02-server': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: '2775b594b1babef07b133d5c96abf725931fa9430bd9d485bfee0bc1e1b6afc5', screens: 'b3ae2613b583e88e64db4693adaa3062969be9df4ff64ee0ddabc396a146edea', commands: 'd8c4421ebb52c7e9c68b794788e8b85bc99cb77ba2579421159f3e9e3cbcb67e' },
  'coached:its-03-guided': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: '34b9d92eb99056692824a05a83b267b67143b1fef06bdab6f70441f16921d471', screens: 'aaa09fc4396f1d3bff3e558789f5a50ad465cdb0fd03664ef47756dace64cdcf', commands: '44bd638d0e379602904fc850deddcac18f7281a8c6e3ddd0b0c67ccd85167317' },
  'coached:its-07-guided': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: '5ac8e1ae952ddf61a7dc76f532d2da9f5b5caf830d04740bbe43a4e810219833', screens: '16279c35d876701d862b47311fdd64f7d208759d2b87d741a3cc5d02ce9bab3b', commands: 'abedfd1783cb317864a4181c3953ee5b057762cf7c16df217c8b8557299d22bb' },
  'coached:its-05-guided': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: '13eb2965c8e669a0ab73fd51a9eedd5a4d3b6e8ec3de97ad9a77ad40587d8c08', screens: '42a279597ee4201faf5a3ad5aa83877a9753472ba76646071fcb4f292ae21566', commands: '9468732cbf419c354c9b41d5ecc3f08bc4a2aaf30def771c1a6cb04437233faa' },
  'coached:its-06-guided': { remote: '95a6c0c98791d06f9435b5adb591fab9e8dcf1f6f5abec0407f8f4bd2ebfd945', tickets: '039eb60f1ee5f8d72a7721ae79a56477f56cd1986137a7b82d0baf37a120ebc0', screens: '742eae3605a0c7f5595c9eacdc6b4a19a4c08812fe7d3207fb199c460da2b752', commands: 'c07d038197a861e802247b492637428a7115a42471233b3035ac029e633b4bdd' },
  'coached:its-06-extension': { remote: '52fe37b6950d50a0125837f77d1fb252b4a0499ebd6c89fa69f13562cfb1a47b', tickets: 'bc3ca005d81a671ff29cc64f617def614c36d2e346b87b6f6c88c8f674028cb3', screens: '14499507dab7e0c3ff32e6da0d034753fdd0aca5470b3cacd487ecdf9704d1e5', commands: '925219a51feda1c33bfad8006663916c579ceb1bb3312e2fec18d43dc4187a79' },
  'coached:its-04-guided': { remote: '6289269e49ae5fd96c25503e8fa044c124bdf97a6ec6cc2b89ee6f98833ef133', tickets: 'ecf5c54738297cf494f5b4483cab33e55c71d3b8813752fec3b8db64dfd8f813', screens: '7d7a9428b758c2d404c0e0be44dff216088da42ba07c2784ad2806922c9bb544', commands: 'abb52c5fe948a9dee37a3c9ad331da42fef467224a164ef98b9988fa7e8aaff6' },
  'prove:its-01': { remote: '78acb0593b4e3d1f06988fbac0050e3b9ab9528cb5eab288e759a8eda7208175', tickets: '4a945206750e062262de2a7c8391df418d18691ab5cf4594f8de109f3d5593f5', screens: '9914148802106d6b921e3cae2843daf774c28cb258f93535e5f5f3bb1ce8539f', commands: 'e086f3258532b7b168aa403ac22202176e342403c32d9066bb582e976ae6f603' },
  'prove:its-10': { remote: '1050368a4496fe1b318a59aa3510f14ba442e48bcbf7368c1688b6dafd590a4f', tickets: '1477780e26acf888c3b82e7a27fa843b395b0d665d2c43695164410a60c0af57', screens: 'db9ebff2fde96dbb035982ba9be9fc98e55286492fe441810bb35a3c82de9413', commands: '0d71ef0f8b553579fc730d975b8399c04949522168c19f0c70ebff32aac2616e' },
  'prove:its-11': { remote: 'fa85e7b38db213ab6913650260d4be9292390371893fe6162166f4da65c668f2', tickets: 'edbb61c499c8d3dcf3866d13430bdad4c6997b132afd38370941173d7e8431d2', screens: '1ff7a8b95e849e10b8a9e7c30dadd5acf7f437bb665b1004ae18900c8f3042ed', commands: '1a3a890ade316d39654ba388ff1b27e530b9f7cdadd354ed5819c87fc01ba157' },
  'prove:its-02': { remote: '1d2aa04c6f968229b83c1a6db071e96b32907e5b210227f29717dbc90ad8fd3f', tickets: 'ed4dc188cec3ba2e18830bb144975bc43921a3e5d102670e98d4e925c512cef5', screens: 'd234ec3f644078e015d42b468d494290cd1e1142c40a05a18feb099789c85e49', commands: 'acd5b5fb4db0e3d72c9b8206154f843e4716a21ea0d1312c70dde04d11c367f8' },
  'prove:its-03': { remote: 'f684687f657b8b326cc6c3ebd06374c26ba5d30f5a4db307cee2f3a5c8d0bd3b', tickets: '1783c201a81af2d0d86b1df49a6207e36b1cc406301c4cbb0949f3f1d81d2172', screens: '38574c38360490dc1b091beb75f4b5442e8daaba1bafd1e9a7503ed6031c19fc', commands: '16d0597631d275499363ef43c817ba1dd2118f1f14afd0a0736cebc9516540d8' },
  'prove:its-07': { remote: '40605de9a5e183da9e4743c64b9ffcb14a5ac5f9b119d06699fa451d8a2f1c90', tickets: '26c5da3d838784607610f9b15971ab94a280a43aeb779bacc691c5c057888442', screens: '7cd43167aad68c0c21e5afd46d9536646cc3120d685d1e2bf6b5291ec58f2ba2', commands: '6cb05b6bd4183a151eb2fe67090e86095197f120dd3fdc828f60e4213c3ff80c' },
  'prove:its-05': { remote: '4fe4060ead1ac77322d635729e7e8a43b74974403c698580ae377a9e2ee6e41f', tickets: 'f9bc7883e23b59e536cda653f869a74b9054b8d869a0f65a5d9e6f93e72d85d8', screens: '29c5ee9619de88f54a10b5a9b32dfce4be9200b1f3850e7e1fea066aa3d8c0d7', commands: '9a01a325873bfd1f29f29915ba61c0a4f871e31e77b3a258d35b08199dbed5b4' },
  'prove:its-06': { remote: '0fad42054028689f52ce057465a2300cd8cfce071c9a063f93107d1826b30036', tickets: '82802765acd7cc5a5f5de48d0c02c3862a959d44858db3a1395ed712031c2612', screens: 'f77368c74084ed7081c53bca9810c2d0e3027597b586912879a2d83c531aa9af', commands: '75d38da5b2999a8b7c0c11a4c73bcc5ed151ad48c82cdbf9ba283406676ca83f' },
  'prove:its-04': { remote: '7d6209d060f7df30ad131e555db0673bab8ac54194201c55cd750126f26c6668', tickets: '3c435db9d4c490a393029ce876b9c64846db852745a5f20e9f2a0d9cc397361a', screens: 'c99d80f3c974b88fecc72bc8890e7369657eaa61078347b0f4369cc108a6a6fb', commands: '6882abdaa3a2210172e5a517a3c2c04e6c4d7a20b7352d6160838a307268828a' },
};
// Every older shift looks and answers exactly as on master, with no new key.
function testOldShiftsUnchanged() {
  const plain = sim({ withTest: false });
  const shifts = shiftsOf(plain);
  assert.equal(shifts.length, Object.keys(PINNED).length, 'every pinned shift still exists');
  for (const shift of shifts) {
    const pins = PINNED[shift.name];
    assert.ok(pins, `${shift.name} has pins`);
    assert.deepEqual(pinsOf(shift.make), pins, `${shift.name} unchanged`);
  }
}
/* ---------- Test-only tickets, sets and a Prove shift ---------- */
const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const PC = (name, user) => ({ name, user, os: 'Windows 11 Enterprise 24H2', ip: '10.20.10.150', ou: 'OU=Operations,OU=Workstations', trust: 'Healthy', bitlocker: 'Protected', lastSeen: '1 minute ago', health: 'Healthy' });
// Module 09's corporate network fixture (its test's TEST-LT-04), for ping,
// nslookup and Test-NetConnection inside the command console.
const CORP_NET = { adapters: [{ name: 'Ethernet', kind: 'Ethernet', description: 'TEST Ethernet Controller', media: 'Connected', speed: '1 Gbps', mac: '3C-52-82-00-00-52',
  ip: { dhcp: true, address: '10.20.10.150', mask: '255.255.255.0', gateway: '10.20.10.1', dnsServers: ['10.20.0.10', '10.20.0.11'], dhcpServer: '10.20.0.20' } }],
  routes: { corp: [{ address: '10.20.255.1' }] }, publicDns: {} };
const TRUST_ERROR = 'The trust relationship between this workstation and the primary domain failed.';
const MACHINES = {
  // Signed in, docked: Quick Assist.
  'TEST-LT-51': { remote: { agent: 'Online', desktop: 'Teams, Excel and a personal email tab are open', asks: [
    { id: 'close-personal', label: 'Please close anything personal', answer: 'Done. Just Teams and Excel open now.', desktop: 'Teams and Excel are open' },
    { id: 'test-call', label: 'Please make a Teams test call', answer: 'I can hear myself back.' }] } },
  // At the sign-in screen with a broken trust; clock healthy.
  'TEST-LT-52': { remote: { agent: 'Online', signedIn: false, lastStart: 'Today 08:41', asks: [{ id: 'what-changed', label: 'What changed?', answer: 'Desktop Support restored it yesterday.' }] },
    signInMessage: TRUST_ERROR, secureChannel: false, clock: { source: 'NS-DC01.northstar.example', lastSyncMinutesAgo: 2 }, network: CORP_NET,
    events: { system: [{ level: 'Error', time: 'Today 08:42', source: 'NETLOGON', id: '3210', message: 'Failed to authenticate with domain controller NS-DC01.' }] } },
  // A test PC whose clock is far off, at the sign-in screen; the trust is fine.
  'TEST-WS-53': { remote: { agent: 'Online', signedIn: false, asks: [{ id: 'try', label: 'TEST: try again', answer: 'Same message.', ifClockCorrect: { answer: 'TEST: signed in.', signIn: true } }] },
    signInMessage: 'TEST sign-in refused.', secureChannel: true, clock: { shown: '2024-03-05T07:30:00Z', source: 'Local CMOS Clock', synced: false } },
  'TEST-WS-54': { remote: { agent: 'Offline', offlineSince: 'Yesterday 17:42' } },
  'TEST-LT-55': { remote: { agent: 'Online', allow: false } },
  // Module 5's machine model only: no new key.
  'TEST-LT-56': { events: { system: [{ level: 'Warning', time: 'Today 08:30', source: 'TEST', id: '9', message: 'TEST event.' }] } },
};
const at = (time) => `2026-08-20T${time}:00Z`;
const ticketFor = (id, computer, extra) => base({ id, number: `INC00${id.slice(3)}`, requester: 'Maya Chen', createdAt: at('08:55'), description: `TEST ${computer}`, console: { machines: { [computer]: MACHINES[computer] }, ...(extra || {}) } });
const TICKETS = [
  ticketFor('HD-9951', 'TEST-LT-51'), ticketFor('HD-9952', 'TEST-LT-52'), ticketFor('HD-9953', 'TEST-WS-53'),
  ticketFor('HD-9954', 'TEST-WS-54'), ticketFor('HD-9955', 'TEST-LT-55'), ticketFor('HD-9956', 'TEST-LT-56'),
  ticketFor('HD-9957', 'TEST-LT-52', { criticalActions: [{ action: 'remote-unattended', text: 'TEST: never connect without asking on a person\'s PC.' }] }),
];
const COMPUTERS = Object.keys(MACHINES).map((name) => PC(name, 'Maya Chen'));
const SETS = {
  // A fixed shift clock that is not the test's own clock.
  'test-remote': { title: 'Test remote sessions', tickets: ['HD-9951', 'HD-9952', 'HD-9953', 'HD-9954', 'HD-9955', 'HD-9956'], now: '2026-08-20T09:00:00Z', computers: COMPUTERS },
  'test-unattended': { title: 'Test unattended', tickets: ['HD-9957'], now: '2026-08-20T09:00:00Z', computers: COMPUTERS },
  'test-old': { title: 'Test older ticket', tickets: ['HD-9956'], now: '2026-08-20T09:00:00Z', computers: COMPUTERS },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS, machine: MACHINES['TEST-WS-53'], pc: PC('TEST-WS-53', 'Maya Chen') };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));
    // A test Prove shift: Module 09's, with one PC carrying remote state.
    HD_PROVE_SHIFTS['test-m10'] = { ...JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-04'])), labKey:'lab-test-m10-prove', selectedComputer:'TEST-WS-53',
      computers:[JSON.parse(JSON.stringify(__test.pc))], machines:{ 'TEST-WS-53':JSON.parse(JSON.stringify(__test.machine)) } };`, ctx);
}
const setSim = (key) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets` });
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const remote = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).consoleState.remote`);
const actions = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).consoleState.actions`).map((a) => a.id);
const history = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).troubleshootingHistory`).map((h) => h.action);
const seen = (tab, name) => json(tab, `(hdMachine(${JSON.stringify(name)}).seen || [])`);
const say = (tab, text) => tab.type('hd-remote-say', text, 'hdRemoteSay({ preventDefault() {} })');
const cmd = (tab, text) => { tab.type('hd-remote-cmd', text, 'hdRemoteRun({ preventDefault() {} })'); const rows = json(tab, 'hdRemoteActive(hdRemoteState(hdRemoteWorkTicket())).commands'); return rows[rows.length - 1].output; };
const find = (tab, name) => tab.type('hd-remote-find', name, 'hdRemoteFind({ preventDefault() {} })');
const onTicket = (id, key = 'test-remote') => { const tab = setSim(key); tab.open(id); return tab; };

// The placeholder stays exactly as master's when no PC turns sessions on,
// and a Module 5 machine with no new key answers every new line as before.
function testOlderTicketUnchanged() {
  const tab = onTicket('HD-9956', 'test-old');
  assert.equal(tab.run('hdRemoteOn()'), false);
  const screen = tab.view('helpdesk/remote-support');
  assert.equal(screen, tab.run('hdRemotePlaceholder()'));
  assert.match(screen, /Request session consent/);
  assert.match(screen, /Remote-support checklist/);
  tab.on('TEST-LT-56');
  const before = tab.run('JSON.stringify(hdState.machines)');
  for (const line of ['w32tm /query /status', 'w32tm /resync', 'Test-ComputerSecureChannel', 'Reset-ComputerMachinePassword', 'Remove-Computer']) {
    assert.equal(tab.ps(line), `The term '${line}' is outside this training shell. Type Get-Help for supported commands.`, line);
  }
  assert.match(tab.ps('Get-WinEvent -LogName System -MaxEvents 20'), /TEST event\./);
  assert.equal(tab.run('JSON.stringify(hdState.machines)'), before, 'no seen key or action added');
  assert.doesNotMatch(tab.ps('Get-Help'), /w32tm/);
  assert.equal(json(tab, '(hdTicketById("HD-9956").consoleState || { actions:[] }).actions').length, 0);
}

// Quick Assist: Code sent → Waiting for permission → Connected (full control).
function testQuickAssist() {
  const tab = onTicket('HD-9951');
  assert.equal(tab.run('hdRemoteOn()'), true);
  let screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-remote-tool="quick-assist"/);
  assert.match(screen, /data-hd-remote-tool="remote-support"/);
  assert.match(screen, /data-hd-qa-start/);
  assert.doesNotMatch(screen, /Request session consent/);
  // The opening script, before connecting; the checker names what's missing.
  say(tab, "Thanks for confirming your employee ID, you're verified.");
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-opening="verify"[^>]*>Opening script: ✓ verify · ✗ consent · ✗ privacy · ✗ narration\. Missing: consent, privacy, narration\./);
  say(tab, "May I connect to your computer? Please close anything personal first, and I'll tell you what I'm doing as I go.");
  assert.deepEqual(tab.run('JSON.stringify(hdRemoteOpening(hdTicketById("HD-9951")))'), JSON.stringify({ found: ['verify', 'consent', 'privacy', 'narration'], missing: [], said: true }));
  tab.run('hdRemoteQuickAssist()');
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-qa-status="code-sent"><strong>Code sent<\/strong>/);
  const code = remote(tab, 'HD-9951').pending.code;
  assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.match(screen, /expires at 09:13/, 'ten minutes after the code (09:03)');
  say(tab, 'One moment please.');
  assert.equal(remote(tab, 'HD-9951').pending.status, 'code-sent', 'only the code itself lets her in');
  say(tab, `Your code is ${code.slice(0, 3)} ${code.slice(3)}.`);
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-qa-status="waiting"><strong>Waiting for permission<\/strong>/);
  tab.run("hdRemoteAskControl('full')");
  const state = remote(tab, 'HD-9951');
  assert.equal(state.active, 0);
  assert.deepEqual({ ...state.sessions[0], commands: undefined }, { tool: 'quick-assist', computer: 'TEST-LT-51', mode: 'attended', control: 'full', start: '09:07', startMinutes: 7, allowedBy: 'Maya Chen', allowedAt: '09:07', screen: 'desktop', commands: undefined, end: '' });
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /Connected \(full control\)/);
  assert.match(screen, /data-hd-remote-screen="desktop"/);
  assert.match(screen, /Teams, Excel and a personal email tab are open/);
  assert.match(screen, /data-hd-remote-timer>Session time 00:00/);
  assert.doesNotMatch(screen, /data-hd-remote-tab="console"/, 'Quick Assist has no command console');
  tab.run("hdRemoteTab('console')");
  assert.equal(remote(tab, 'HD-9951').tab, 'screen');
  // Ask the user, answered from the ticket.
  tab.run("hdRemoteAsk('close-personal')");
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /You asked:<\/strong> Please close anything personal <strong>Maya:<\/strong> “Done\. Just Teams and Excel open now\.”/);
  assert.match(screen, /Teams and Excel are open/);
  assert.match(screen, /Session time 00:01/);
  tab.run("hdRemoteTab('sysinfo')");
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-remote-clock>Thursday, August 20, 2026 9:08:00 AM</, 'a correct clock: the session clock');
  assert.match(screen, /<dt>Signed-in user<\/dt><dd>Maya Chen<\/dd>/);
  for (const key of ['remote-sysinfo', 'clock', 'ask:close-personal']) assert.ok(seen(tab, 'TEST-LT-51').includes(key), key);
  tab.run('hdRemoteEnd()');
  const log = history(tab, 'HD-9951');
  assert.ok(log.includes('Remote session · TEST-LT-51 · Quick Assist · 09:07–09:09 · allowed by Maya Chen 09:07'), log.join('\n'));
  assert.deepEqual(actions(tab, 'HD-9951'), ['remote-code', 'remote-code-entered', 'remote-request', 'remote-connected', 'remote-end']);
  assert.equal(remote(tab, 'HD-9951').active, null);
  assert.deepEqual(remote(tab, 'HD-9951').say.map((line) => line.time), ['09:01', '09:02', '09:04', '09:05']);
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-qa-start/, 'back to the tools');
}

// A Quick Assist code lasts 10 minutes on the session clock.
function testQuickAssistCodeExpires() {
  const tab = onTicket('HD-9951');
  tab.run('hdRemoteQuickAssist()');
  const code = remote(tab, 'HD-9951').pending.code;
  for (let i = 0; i < 10; i += 1) say(tab, 'Still with you.');
  say(tab, `Your code is ${code}.`);
  assert.equal(remote(tab, 'HD-9951').pending.status, 'expired');
  assert.match(tab.view('helpdesk/remote-support'), new RegExp(`data-hd-qa-status="expired">The code ${code} expired at 09:11\\. Make a new code\\.`));
  tab.run('hdRemoteQuickAssist()');
  const fresh = remote(tab, 'HD-9951').pending.code;
  say(tab, `Your new code is ${fresh}.`);
  assert.equal(remote(tab, 'HD-9951').pending.status, 'waiting');
}

// Quick Assist can't reach a PC at the sign-in screen.
function testQuickAssistNeedsSignedInUser() {
  const tab = onTicket('HD-9952');
  tab.run('hdRemoteQuickAssist()');
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-qa-status="refused">Nobody is signed in to TEST-LT-52: Quick Assist needs the user's desktop\./);
  assert.deepEqual(actions(tab, 'HD-9952'), ['quick-assist-refused']);
  assert.equal(remote(tab, 'HD-9952').sessions.length, 0);
}

// Remote Support, attended, at the sign-in screen; the command console.
function testRemoteSupportAttended() {
  const tab = onTicket('HD-9952');
  tab.run("hdRemoteSetTool('remote-support')");
  find(tab, 'NS-LT-0042');
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-found="other">NS-LT-0042 has no session in this ticket/);
  find(tab, 'NO-SUCH-PC');
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-found="none">No company PC is named NO-SUCH-PC\./);
  find(tab, 'test-lt-52');
  let screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-remote-found="TEST-LT-52"><div class="card-header"><strong>TEST-LT-52<\/strong><span class="hd-badge ok">Online<\/span>/);
  assert.match(screen, /Sign-in screen \(nobody signed in\)/);
  assert.match(screen, /Connect without asking<\/button><span class="muted">Connect without asking: servers, kiosks and room PCs only\.<\/span>/);
  say(tab, "You'll see a request on your screen from Riley Morgan, Service Desk. Please choose Allow.");
  tab.run("hdRemoteRequest('TEST-LT-52', false)");
  const session = remote(tab, 'HD-9952').sessions[0];
  assert.equal(session.mode, 'attended');
  assert.equal(session.screen, 'sign-in');
  assert.equal(session.allowedBy, 'Maya Chen');
  assert.equal(tab.run('hdState.selectedComputer'), 'TEST-LT-52');
  screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-remote-screen="sign-in"/);
  assert.match(screen, /data-hd-sign-in-message>The trust relationship between this workstation and the primary domain failed\.</);
  assert.match(screen, /at the sign-in screen/);
  tab.run("hdRemoteTab('console')");
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-console/);
  // Module 09's network lines, on the remote PC.
  assert.match(cmd(tab, 'ping NS-DC01'), /Reply from 10\.20\.0\.10/);
  assert.match(cmd(tab, 'nslookup northstar.example'), /Address(es)?:\s+10\.20\.0\.10/);
  // The clock is fine, and the PC reaches its time source.
  const status = cmd(tab, 'w32tm /query /status');
  assert.match(status, /^Leap Indicator: 0\(no warning\)\nStratum: 3 \(secondary reference - syncd by \(S\)NTP\)/);
  assert.match(status, /ReferenceId: 0x0A14000A \(source IP: {2}10\.20\.0\.10\)/);
  assert.match(status, /Last Successful Sync Time: 8\/20\/2026 8:58:00 AM\nSource: NS-DC01\.northstar\.example\nPoll Interval: 10 \(1024s\)$/);
  assert.equal(cmd(tab, 'W32TM /RESYNC'), 'Sending resync command to local computer...\nThe command completed successfully.');
  assert.equal(cmd(tab, 'Test-ComputerSecureChannel'), 'False');
  assert.equal(cmd(tab, 'test-computersecurechannel -Server NS-DC01'), 'False', 'extra valid parameters are fine');
  assert.match(cmd(tab, 'Get-WinEvent -LogName System -MaxEvents 20'), /3210 Error\s+Failed to authenticate with domain controller NS-DC01\./);
  assert.match(cmd(tab, 'Test-NetConnection NS-DC01 -Port 3389'), /TcpTestSucceeded\s*: True/);
  assert.match(cmd(tab, 'Test-NetConnection NS-DC01 -Port 22'), /TcpTestSucceeded\s*: False/);
  // Tier 1 never repairs a trust or rejoins a domain.
  for (const line of ['Test-ComputerSecureChannel -Repair', 'Reset-ComputerMachinePassword', 'Remove-Computer', 'Add-Computer -DomainName northstar.example']) {
    assert.equal(cmd(tab, line), "Access is denied. Joining or repairing a computer's domain membership needs a Desktop Support account.", line);
  }
  // A password typed by mistake never runs, shows or is saved.
  const refused = cmd(tab, 'Test-ComputerSecureChannel -Repair -Password Winter2026!');
  assert.match(refused, /^Stopped: never type a user's password/);
  const saved = JSON.stringify(remote(tab, 'HD-9952'));
  assert.doesNotMatch(saved, /Winter2026/);
  assert.doesNotMatch(JSON.stringify(history(tab, 'HD-9952')), /Winter2026/);
  const rows = remote(tab, 'HD-9952').sessions[0].commands;
  assert.ok(rows.every((row) => row.computer === 'TEST-LT-52'));
  assert.equal(rows[0].command, 'ping NS-DC01');
  assert.ok(history(tab, 'HD-9952').includes('Remote Support command console on TEST-LT-52: Test-ComputerSecureChannel'));
  assert.deepEqual(json(tab, 'hdState.practiceLog.filter((e) => e.via === "remote-console").map((e) => e.computer)').length, rows.length);
  for (const key of ['w32tm-status', 'w32tm-resync', 'secure-channel', 'event-log:system']) assert.ok(seen(tab, 'TEST-LT-52').includes(key), key);
  const ids = actions(tab, 'HD-9952');
  assert.deepEqual(ids.slice(0, 3), ['remote-request', 'remote-connected', 'clock-resync']);
  assert.equal(ids.filter((id) => id === 'domain-membership-refused').length, 4);
  assert.equal(json(tab, 'hdTicketById("HD-9952").consoleState.actions.find((a) => a.id === "clock-resync")').result, 'success');
  // The Event log tab opens Module 5's Event Viewer on the remote PC.
  tab.run('hdRemoteEventLog()');
  assert.equal(tab.ctx.location.hash, '#/helpdesk/event-viewer');
  assert.match(tab.view('helpdesk/event-viewer'), /TEST-LT-52 · Windows Logs › System[\s\S]*data-hd-event-row="3210"/);
  tab.ctx.location.hash = '#/helpdesk/remote-support';
  tab.run('hdRemoteEnd()');
  assert.ok(history(tab, 'HD-9952').some((line) => /^Remote session · TEST-LT-52 · Remote Support \(attended\) · 09:02–09:\d\d · allowed by Maya Chen 09:02$/.test(line)), history(tab, 'HD-9952').join('\n'));
}

// Connect without asking: recorded as unattended (a critical line in practice).
function testUnattended() {
  const tab = onTicket('HD-9957', 'test-unattended');
  tab.run("hdRemoteSetTool('remote-support')");
  find(tab, 'TEST-LT-52');
  tab.run("hdRemoteRequest('TEST-LT-52', true)");
  const session = remote(tab, 'HD-9957').sessions[0];
  assert.equal(session.mode, 'unattended');
  assert.equal(session.allowedBy, '');
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-mode="unattended"[\s\S]*hd-badge warn">Connected \(unattended\)/);
  assert.deepEqual(actions(tab, 'HD-9957'), ['remote-unattended']);
  assert.ok(json(tab, 'hdTicketById("HD-9957").consoleState.critical').length > 0, 'the ticket\'s critical rule fires');
  tab.run('hdRemoteEnd()');
  assert.ok(history(tab, 'HD-9957').some((line) => / · Remote Support \(unattended\) · .* · unattended: nobody was asked$/.test(line)));
}

function testOfflineAndDeny() {
  const off = onTicket('HD-9954');
  off.run("hdRemoteSetTool('remote-support')");
  find(off, 'TEST-WS-54');
  const screen = off.view('helpdesk/remote-support');
  assert.match(screen, /hd-badge bad">Offline since Yesterday 17:42</);
  assert.match(screen, /data-hd-remote-request onclick="[^"]*" disabled>/);
  off.run("hdRemoteRequest('TEST-WS-54', false)");
  off.run("hdRemoteRequest('TEST-WS-54', true)");
  assert.equal(remote(off, 'HD-9954').sessions.length, 0);
  const deny = onTicket('HD-9955');
  deny.run("hdRemoteSetTool('remote-support')");
  find(deny, 'TEST-LT-55');
  deny.run("hdRemoteRequest('TEST-LT-55', false)");
  assert.match(deny.view('helpdesk/remote-support'), /Maya Chen chose Deny at 09:01\./);
  assert.equal(remote(deny, 'HD-9955').sessions.length, 0);
  deny.run("hdRemoteSetTool('quick-assist')");
  deny.run('hdRemoteQuickAssist()');
  say(deny, `Code ${remote(deny, 'HD-9955').pending.code}`);
  deny.run("hdRemoteAskControl('view')");
  assert.equal(remote(deny, 'HD-9955').pending.status, 'denied');
  assert.equal(remote(deny, 'HD-9955').sessions.length, 0);
  assert.deepEqual(json(deny, 'hdTicketById("HD-9955").consoleState.actions.filter((a) => a.id === "remote-request").map((a) => a.result)'), ['denied', 'denied']);
}

// A wrong clock: w32tm shows no sync; resync sets the shift clock; the user
// can sign in only once the clock is right. Through the PowerShell screen.
function testWrongClockAndResync() {
  const tab = onTicket('HD-9953');
  tab.on('TEST-WS-53');
  assert.equal(tab.ps('w32tm /query /status'), ['Leap Indicator: 3(not synchronized)', 'Stratum: 0 (unspecified)', 'Precision: -23 (119.209ns per tick)', 'Root Delay: 0.0000000s', 'Root Dispersion: 0.0000000s', 'ReferenceId: 0x00000000 (unspecified)', 'Last Successful Sync Time: unspecified', 'Source: Local CMOS Clock', 'Poll Interval: 10 (1024s)'].join('\n'));
  assert.equal(tab.ps('Get-Date'), '\nTuesday, March 5, 2024 7:30:00 AM\n');
  assert.equal(tab.ps('Test-ComputerSecureChannel'), 'True', 'this test PC\'s secureChannel');
  assert.equal(tab.run('hdRemoteClockCorrect("TEST-WS-53", hdMachine("TEST-WS-53"))'), false);
  tab.run("hdRemoteAsk('try')");
  assert.equal(remote(tab, 'HD-9953').asks[0].answer, 'Same message.');
  // No time source: the resync fails and the clock stays.
  tab.run('hdMachine("TEST-WS-53").clock.reachable = false');
  assert.equal(tab.ps('w32tm /resync'), 'Sending resync command to local computer...\nThe computer did not resync because no time data was available.');
  assert.match(tab.ps('Get-Date'), /March 5, 2024/);
  tab.run('delete hdMachine("TEST-WS-53").clock.reachable');
  tab.shell('w32tm /resync');
  assert.match(tab.view('helpdesk/powershell'), /The command completed successfully\./);
  assert.equal(tab.ps('Get-Date'), '\nThursday, August 20, 2026 9:01:00 AM\n', 'the shift clock');
  assert.match(tab.ps('w32tm /query /status'), /Leap Indicator: 0\(no warning\)[\s\S]*Last Successful Sync Time: 8\/20\/2026 9:01:00 AM\nSource: NS-DC01\.northstar\.example/);
  assert.equal(tab.run('hdRemoteClockCorrect("TEST-WS-53", hdMachine("TEST-WS-53"))'), true);
  assert.deepEqual(json(tab, 'hdTicketById("HD-9953").consoleState.actions.filter((a) => a.id === "clock-resync").map((a) => a.result)'), ['failed', 'success']);
  tab.run("hdRemoteAsk('try')");
  assert.equal(remote(tab, 'HD-9953').asks[1].answer, 'TEST: signed in.');
  assert.equal(tab.run('hdMachine("TEST-WS-53").remote.signedIn'), true);
  for (const key of ['w32tm-status', 'w32tm-resync', 'secure-channel', 'clock', 'remote-sysinfo', 'ask:try']) assert.ok(seen(tab, 'TEST-WS-53').includes(key), key);
  assert.match(tab.ps('Get-Help'), /Time and trust: w32tm \/query \/status, w32tm \/resync, Test-ComputerSecureChannel, Get-Date/);
  assert.match(tab.ps('w32tm /stripchart'), /Did you mean: w32tm \/query \/status or w32tm \/resync/);
  // No network block: a server's ports, not master's fixed answer.
  assert.match(tab.ps('Test-NetConnection NS-DC01 -Port 3389'), /RemoteAddress\s+: 10\.20\.0\.10[\s\S]*TcpTestSucceeded : True/);
  assert.match(tab.ps('Test-NetConnection NS-DC01 -Port 22'), /^WARNING: TCP connect to \(NS-DC01 : 22\) failed[\s\S]*TcpTestSucceeded : False/);
}

// Nobody types a password in a session: a Say line with one is not saved.
function testSayRefusesPassword() {
  const tab = onTicket('HD-9951');
  say(tab, 'Your new password: Winter2026!');
  assert.equal(tab.run('JSON.stringify(hdState)').includes('Winter2026'), false, 'not saved anywhere');
  assert.equal(tab.run('hdRemoteState(hdTicketById("HD-9951")).say.length'), 0);
  assert.match(tab.toasts[tab.toasts.length - 1], /Stopped: never type a user's password/);
  assert.equal(tab.run('hdTicketById("HD-9951").passwordWritten'), true);
  // The Find box too.
  tab.run("hdRemoteSetTool('remote-support')");
  find(tab, 'password: Winter2026!');
  assert.equal(tab.run('hdRemoteState(hdTicketById("HD-9951")).find'), '');
  assert.equal(tab.run('JSON.stringify(hdState)').includes('Winter2026'), false, 'the search is not saved');
}

// An older ticket in the same shift as a remote one keeps the placeholder.
function testPlaceholderPerTicket() {
  const tab = onTicket('HD-9956');
  assert.equal(tab.run('hdRemoteOn()'), false);
  assert.equal(tab.view('helpdesk/remote-support'), tab.run('hdRemotePlaceholder()'));
  tab.open('HD-9951');
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-tools/);
}

// The command console runs on the remote PC: no directory tools, no
// sessions to other computers, and nothing secret saved.
function testConsoleLimitsAndSecrets() {
  const tab = onTicket('HD-9952');
  tab.run("hdRemoteSetTool('remote-support')");
  tab.run("hdRemoteRequest('TEST-LT-52', false)");
  assert.match(cmd(tab, 'Get-Help'), /^Command console on TEST-LT-52 \(PowerShell on the remote PC\)\.[\s\S]*Time and trust: w32tm/);
  assert.doesNotMatch(cmd(tab, 'Get-Help'), /Get-ADUser|Enter-PSSession/);
  for (const line of ['Get-ADUser mchen -Properties LockedOut', 'Unlock-ADAccount -Identity mchen', 'Enter-PSSession -ComputerName NS-FILE01']) {
    const word = line.split(' ')[0];
    assert.equal(cmd(tab, line), `${word} : The term '${word}' is not recognized as the name of a cmdlet, function, script file, or operable program.\nThe command console runs on TEST-LT-52. Directory lookups and sessions to other computers are in the Service Desk PowerShell.`, line);
  }
  assert.equal(tab.run('hdState.selectedComputer'), 'TEST-LT-52');
  // A password given as plain text is masked before the activity line.
  cmd(tab, "Set-ADAccountPassword mchen -Reset -NewPassword 'Winter2026!'");
  assert.doesNotMatch(JSON.stringify(history(tab, 'HD-9952')), /Winter2026/);
  assert.doesNotMatch(JSON.stringify(remote(tab, 'HD-9952')), /Winter2026/);
  // A one-time password in an answer is never saved (Module 8's rule).
  tab.run("hdAcctOtp = { value:'10.20.0.10', shown:false, state:hdState }");
  cmd(tab, 'ping NS-DC01');
  const last = remote(tab, 'HD-9952').sessions[0].commands.slice(-1)[0].output;
  assert.doesNotMatch(last, /10\.20\.0\.10/);
  assert.ok(last.includes(tab.run('HD_OTP_HIDDEN')));
  tab.run('hdAcctOtp = null');
}

// A Prove shift: the same flow recorded as Prove events, no opening ticks.
function testProveShift() {
  const tab = sim({ url: proveUrl('test-m10') });
  assert.equal(tab.run('hdRemoteOn()'), true);
  const id = tab.run('hdCurrentTicket().id');
  tab.run("hdRemoteSetTool('remote-support')");
  find(tab, 'TEST-WS-53');
  say(tab, "I'm going to connect. Please choose Allow.");
  assert.doesNotMatch(tab.view('helpdesk/remote-support'), /Opening script/, 'no feedback in a Prove It');
  tab.run("hdRemoteRequest('TEST-WS-53', false)");
  tab.run("hdRemoteTab('sysinfo')");
  tab.run("hdRemoteTab('console')");
  assert.match(cmd(tab, 'w32tm /query /status'), /Local CMOS Clock/);
  assert.match(cmd(tab, 'w32tm /resync'), /completed successfully/);
  assert.equal(cmd(tab, 'Test-ComputerSecureChannel'), 'True');
  assert.equal(cmd(tab, 'Remove-Computer'), 'Access is denied.', 'a Prove It answers as Windows does');
  assert.match(tab.view('helpdesk/remote-support'), /hd-badge ok">Connected \(full control\)/);
  tab.run("hdRemoteAsk('try')");
  tab.run('hdRemoteEnd()');
  const events = json(tab, 'hdState.prove.events');
  const types = events.map((e) => e.type);
  for (const type of ['remote_say', 'remote_session', 'remote_ask', 'remote_session_end', 'command_run', 'action_taken', 'evidence_opened']) assert.ok(types.includes(type), type);
  assert.deepEqual(events.filter((e) => e.type === 'command_run').map((e) => [e.command, e.computer, e.via]), [
    ['w32tm /query /status', 'TEST-WS-53', 'remote-console'], ['w32tm /resync', 'TEST-WS-53', 'remote-console'], ['Test-ComputerSecureChannel', 'TEST-WS-53', 'remote-console'], ['Remove-Computer', 'TEST-WS-53', 'remote-console']]);
  assert.deepEqual(events.filter((e) => e.type === 'action_taken').map((e) => e.value), ['remote-request', 'remote-connected', 'clock-resync', 'domain-membership-refused', 'remote-end']);
  const opened = json(tab, 'hdState.prove.opened');
  for (const source of ['clock:TEST-WS-53', 'w32tm-status:TEST-WS-53', 'w32tm-resync:TEST-WS-53', 'secure-channel:TEST-WS-53']) assert.ok(opened.includes(source), source);
  assert.equal(events.find((e) => e.type === 'remote_ask').answer, 'TEST: signed in.');
  assert.match(events.find((e) => e.type === 'remote_session_end').log, /^Remote session · TEST-WS-53 · Remote Support \(attended\) · /);
  assert.ok(json(tab, `hdTicketById(${JSON.stringify(id)}).troubleshootingHistory`).some((h) => /^Remote session · TEST-WS-53/.test(h.action)), 'the log line on the Prove ticket');
  // A Prove It answers a wrong w32tm option as Windows does, with no hint.
  assert.equal(tab.ps('w32tm /stripchart'), 'The following error occurred: The parameter is incorrect. (0x80070057)');
}

if (require.main !== module) module.exports = { sim };
else {
  testOldShiftsUnchanged();
  testOlderTicketUnchanged();
  testQuickAssist();
  testQuickAssistCodeExpires();
  testQuickAssistNeedsSignedInUser();
  testRemoteSupportAttended();
  testUnattended();
  testOfflineAndDeny();
  testWrongClockAndResync();
  testSayRefusesPassword();
  testPlaceholderPerTicket();
  testConsoleLimitsAndSecrets();
  testProveShift();
  console.log('hdesk-m10-console-a: ok');
}

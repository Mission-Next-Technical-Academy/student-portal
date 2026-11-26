'use strict';
/* Help Desk simulator: Module 08 (key its-06), console A (ui/helpdesk.js
 * "Account actions and saved credentials"): the Active Directory user pane's
 * account status fields, Lockout details for any account a ticket provides
 * with its Tier 2 (event 4740) view, Unlock / Enable / Reset password / Add
 * and Remove group behind the ticket's verification or approval, the account
 * expiry control, Credential Manager and cmdkey on a PC, whoami /groups as of
 * the last sign-in, the optional PowerShell lines with the same credit as
 * their screens, "Wait 2 minutes" and HD-2101's Tier 2-only flag.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST text, TEST- groups), never in ui/helpdesk-data.js. No Module 08
 * content. Every older ticket, set and Prove shift must look and behave as
 * before: the screens and command answers are pinned against master. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const sha = (text) => crypto.createHash('sha256').update(String(text)).digest('hex');
const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;
// A fixed computer clock, so HD-2101's simulated clock prints the same text.
const FIXED = Date.parse('2026-08-19T13:05:00Z');
class FixedDate extends Date {
  constructor(...args) { if (args.length) super(...args); else super(FIXED); }
  static now() { return FIXED; }
}

// The same "random" numbers every run, so pinned output can't drift.
function seededMath() {
  let seed = 8;
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
  if (withTest && typeof addTestData === 'function') addTestData(ctx);
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, run,
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ad: (tab) => { run(`hdState.adTab = ${j(tab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    // The Users tab's user pane only, so a failure prints what matters.
    pane: () => { run("hdState.adTab = 'users'"); const html = run("VIEWS['helpdesk/active-directory']()"); const at = html.indexOf('<aside class="card hd-object-pane"'); return at < 0 ? html.slice(-3000) : html.slice(at); },
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    // Through the PowerShell screen, as a student types it (saved transcript).
    shell: (command) => { const real = ctx.document.getElementById; ctx.document.getElementById = (id) => (id === 'hd-ps-input' ? { value: command } : null); try { run('hdRunPowerShell({ preventDefault() {} })'); } finally { ctx.document.getElementById = real; } return run("VIEWS['helpdesk/powershell']()"); },
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}`),
    seen: () => [...(run('hdState.serverSeen') || [])],
  };
}
const setSim = (key, local) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local });
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m08a#/helpdesk/tickets`;

/* ---------- Master's output, pinned ----------
 * Every older shift (the shared queue, each practice set, each coached set
 * and each Prove shift): the Active Directory tabs with each of its tickets
 * open, and every command this part adds or changes, typed on the shift's
 * own computer and on NS-WS-0277 and NS-LT-0117. Computed on master at
 * 9c6d7e4 with `node tests/hdesk-m08-console-a.test.js --print-pins`. */
const PIN_COMMANDS = [
  'Get-ADUser nwilliams -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet',
  'Get-ADUser jbell -Properties LockedOut',
  'Get-ADUser npatel -Properties *',
  'Get-ADPrincipalGroupMembership npatel',
  'whoami /groups',
  'cmdkey /list',
  'cmdkey /delete:NS-FILE01',
  'Search-ADAccount -LockedOut',
  'Search-ADAccount -AccountExpired',
  'Unlock-ADAccount nwilliams',
  'Unlock-ADAccount -Identity jbell',
  'Enable-ADAccount nwilliams',
  'Set-ADAccountPassword nwilliams -Reset',
  'Set-ADUser nwilliams -ChangePasswordAtLogon $true',
  'Add-ADGroupMember GG-Finance-Users -Members nwilliams',
  'Remove-ADGroupMember GG-Sales-Users -Members nwilliams',
  'Set-ADAccountExpiration nwilliams -DateTime 2027-01-01',
  'Get-Help',
];
const PIN_COMPUTERS = ['', 'NS-WS-0277', 'NS-LT-0117'];
// Module 08's own sets and shift, added by later parts, turn these on.
const MODULE_8_SETS = ['its-06', 'its-06-guided'];
function shiftsOf(plain) {
  const shifts = [{ name: 'shared', make: () => sim({ withTest: false }) }];
  Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `practice:${key}`, make: () => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, withTest: false }) }));
  Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `coached:${key}`, make: () => { const tab = sim({ withTest: false }); assert.equal(tab.run(`hdUseTicketSet(${JSON.stringify(key)})`), true); return tab; } }));
  Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `prove:${key}`, make: () => sim({ url: proveUrl(key), withTest: false }) }));
  return shifts;
}
function pinsOf(make) {
  const out = {};
  const first = make();
  const home = first.run('hdState.selectedComputer');
  const tickets = first.run('hdState.tickets.map((t) => t.id)');
  const views = [];
  for (const id of ['', ...tickets]) {
    const tab = make();
    if (id) tab.run(`hdSelectTicket(${JSON.stringify(id)})`);
    views.push(sha(['users', 'groups', 'computers'].map((t) => tab.ad(t)).join('\n')));
    // The user pane for each account this part reads.
    for (const user of ['u-1003', 'u-1005']) { tab.run(`hdOpenUser(${JSON.stringify(user)})`); views.push(sha(tab.ad('users'))); }
  }
  out.views = sha(views.join(','));
  const commands = [];
  for (const computer of PIN_COMPUTERS) {
    for (const command of PIN_COMMANDS) {
      const tab = make();
      if (computer) tab.on(computer); else tab.on(home);
      commands.push(sha(tab.ps(command)));
      commands.push(sha(tab.run('JSON.stringify([hdState.userOverrides, hdState.machines || {}])')));
    }
  }
  out.commands = sha(commands.join(','));
  // The Windows Desktop on each computer.
  out.windows = sha(PIN_COMPUTERS.map((computer) => { const tab = make(); tab.on(computer || home); return tab.view('helpdesk/windows'); }).join('\n'));
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
  shared: { views: 'dfa0b1363e754fc8dbff7940cdf4abd84f42b7cd68447dd0eea81c20e0c74b17', commands: '3d4576fc8b243b3e8deaf1c897c74a0df28f148a9416b1cb7cde2b06d0438f58', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-01': { views: '0dbc9c2256774087c447d81ee69477dad4d201131aa6401b3221e7ff2b93f62d', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-10': { views: '0ff82e9cef9938a01ce9bb33ec02a979037ed0e3c11d2efcf10c39a6392db322', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-11': { views: '7117f29833168d233cbd5ad4aa1252568e3208f3c78bcd741317cd058fcb8235', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-02': { views: '0dbc9c2256774087c447d81ee69477dad4d201131aa6401b3221e7ff2b93f62d', commands: '5d255c58a5042e3eb533137346f218e651d7aea659ec3ef5c5af96b478f42424', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-03': { views: 'f83825bbbc1384298478e5f64674565e7ffcd72af5e2076538dc4e1c6e04e048', commands: 'e9155f915ca5aa293a04be73e1062fb4991d9c50f762c5f86154ceaaaf909400', windows: 'c1c6e14169f9e14419179e15640710944ac7474b006c00c7814ae9f4833fced9' },
  'practice:its-07': { views: '7117f29833168d233cbd5ad4aa1252568e3208f3c78bcd741317cd058fcb8235', commands: '3d1974026e9cc025b7f917daa17de0c7158b71443b18aaec4585a8d24620d469', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'practice:its-05': { views: '03a9ea78f53b4a95a058ac21306c6f0803a08f85b79e7c7e550b627c408830c8', commands: '5327b9a38f27e5067077d1a80bf20d5d9e3bab8ea25fdefa619a93dc8e7cf633', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'coached:its-10-guided': { views: '2a61a919f23ae7d677b0d998ee5a17c53e64a30d61e22a83417e019dffaa246c', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'coached:its-11-guided': { views: 'e55c30eeeb9bce2adcd64449cf6702dc2b6e819495d3fffb805fd36c2858bc61', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'coached:its-02-guided': { views: '7937f561f52b33664ff21e773282be90bd123476931c25b79a46a81789624810', commands: 'bd9c3f39ddb24bc7cf870de5528ba9749cf14adf64fbab0e104e02ceb2c94fbc', windows: 'f35d68ce3cc99a772cdc4d9539658c7a12e5fa00d9691fe5bf5f674fe634f0ff' },
  'coached:its-02-server': { views: 'e55c30eeeb9bce2adcd64449cf6702dc2b6e819495d3fffb805fd36c2858bc61', commands: 'a91326a1340ca7389360d56062d784b39f4df8e4ebbcf1928b100292e5c0f636', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'coached:its-03-guided': { views: '952cbd49c653bc6d403cad5483183a0a59194d528eebae8577b8ba865de6b6e8', commands: '1631ec8fe8c964db6ae9c8b6c0c8e3d40e68c8fe515837810c2a43ea390d9a4e', windows: 'c9fbd0d9933aebb945a71c78240e73439a2485fc57e2bb3caa02c797e63bda86' },
  'coached:its-07-guided': { views: 'e55c30eeeb9bce2adcd64449cf6702dc2b6e819495d3fffb805fd36c2858bc61', commands: '14c7ec5e533a922867c88050f106502f965b9d077f47a6733fae5dae1c5a96f5', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'coached:its-05-guided': { views: '34da19f685dbcdab2172be8693d0900f6eee35f9a2cc0fb4cdc0fa4e0eaab4ac', commands: '130b8da2bcee16119c5cc51de40248e941961dfe8793ed6dbb0444013305a47c', windows: '25eccfc7e4e9ff475759285d5668375961ccb556b1c18a56e6477625f1aedc61' },
  'prove:its-01': { views: '6fecc897392db03ad135e2ba13d6fbcc196ef4e6b31113123498b10eadd6b870', commands: 'd24267c508f57f2622b03df42f24706a062df30ee2be35bc45914b68bbd58d5d', windows: 'a14c5ed0689aef3a871181f4e94032c75af563ca95c710b46bcada00bc89ebbd' },
  'prove:its-10': { views: '9d48973272315b3a26c006e528fc806b96d772e3a74e3b7e37579da27155dd32', commands: '85087cf54e5818c1ec7a75206112ac3dfd4a576661441050629e333f95cacab6', windows: '306262b0bb921d2d8523739e032545b38b28eb67c56ac629d509ee6ba1b97128' },
  'prove:its-11': { views: '110fa2f53b6d82a16fc27508a845855d07a76c82290ecb9354063bfbfbfb854f', commands: '054f952071c8e0adea25e88844dbe6e759425784dfb76b7ce11e2c52d782bb20', windows: '4140790c6c9cf2fd90a7bddb27be651655db88de667eef0b08e70d5f0f288340' },
  'prove:its-02': { views: '1f4393d81844ed359824bd9caf1c35e6d479991813721f39e2d2ce72dd6974b8', commands: '5026e28c50050689618956c8d2aeb6ebb3894cf8ddec1350c6ecb46d861ca4cd', windows: '4ea252949b0cd850caeee4c36a88a58a639c61f82d3b241479e34701e3f8c826' },
  'prove:its-03': { views: '22ea248046734bfd416785e4bf02b9988576323d822544843e9b1c9c5f940faf', commands: '037fe9994af7773445643343fbe93ce255ca418130bfc61c991ea6972023be61', windows: '2ed7f53ba08c5941384a99b03d0f325abeb4f6ebbd44135b808c7626df8d6cf1' },
  'prove:its-07': { views: '4cb44e850856db55e777eb32953a63ec4c83da27a68d2dfea84e2e5f6fcb17d4', commands: 'a18270804c6a361b05e1222959eccdc7bc5841eaaca15802e666addcbe3d334b', windows: '53686760957859373f5a5b77cce82b458f972b9a1514a757234aa5df7b722d7f' },
  'prove:its-05': { views: 'f0da5f9894aa40fb5435e217f442861042f779f32a951893da42f77dcc5efabe', commands: '613b61ae9747563a833acdaf8913f4c1b4b1d63fd5388915e09c4bd0f558f7a0', windows: 'fad80fce54bc4aca8f6a4b7c40adc28e3d0794b2d8e611b2424659d596dfa31b' },
};

// Every older shift looks and answers exactly as on master, with no new key.
function testOldShiftsUnchanged() {
  const plain = sim({ withTest: false });
  for (const shift of shiftsOf(plain)) {
    const pins = PINNED[shift.name];
    if (!pins) continue; // a shift added after this part: covered by its own module's tests
    assert.deepEqual(pinsOf(shift.make), pins, `${shift.name} unchanged`);
  }
}

/* ---------- Test-only tickets and sets ---------- */
const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const VERIFY = { options: [{ id: 'name', text: 'TEST name only', feedback: 'TEST not enough' }, { id: 'callback', text: 'TEST callback', pass: true, feedback: 'TEST ok' }, { id: 'badge', text: 'TEST photo badge matches', pass: true, feedback: 'TEST ok' }] };
const NOAH_PC = { savedCredentials: [{ target: 'NS-FILE01', type: 'Domain Password', user: 'NORTHSTAR\\nwilliams', stale: true }], signedInGroups: ['GG-Sales-Users', 'GG-CRM-Users'] };
// HD-9851: Noah's repeat lockout. HD-9852: Priya's disabled account and
// expired password. HD-9853: Grace's group change. HD-9854: no account keys.
const LOCKOUT = base({ id: 'HD-9851', number: 'INC0019851', requester: 'Noah Williams', createdAt: at(WED, '13:00'), description: 'TEST locked again', console: {
  verification: VERIFY, wait: { minutes: 2 }, machines: { 'NS-WS-0277': NOAH_PC },
  accountActions: { 'u-1003': { unlock: true, reset: true, groups: { record: 'HR-9851', add: ['TEST-Finance-Users'], remove: ['GG-Sales-Users'] } } },
  criticalActions: [{ action: 'ad-password-reset', text: 'TEST reset not needed' }] } });
const DISABLED = base({ id: 'HD-9852', number: 'INC0019852', requester: 'Priya Shah', createdAt: at(WED, '13:01'), description: 'TEST disabled', console: {
  verification: VERIFY, accountActions: { 'u-1004': { enable: { record: 'HR-9852', after: 'test-hr-record', afterText: 'TEST open HR-9852 first' }, reset: true } } } });
const GROUPS = base({ id: 'HD-9853', number: 'INC0019853', requester: 'Grace Kim', createdAt: at(WED, '13:02'), description: 'TEST mover', console: {
  accountActions: { 'u-1006': { groups: { record: 'HR-9853', add: ['TEST-Finance-Users'], remove: ['TEST-Listed', 'GG-HR-Users'] } } } } });
const PLAIN = base({ id: 'HD-9854', number: 'INC0019854', requester: 'Maya Chen', createdAt: at(WED, '13:03'), description: 'TEST plain', console: { matrix: {} } });
const ACCOUNTS = {
  'u-1003': { accountExpires: 'Never', passwordExpired: false, passwordLastSet: 'Yesterday 16:10', lastBadPassword: 'Today 13:02', locked: true, sspr: 'Registered',
    lockout: { badPasswordCount: 5, lockoutsToday: 3, lastLockout: 'Today 13:02', source: 'NS-WS-0277', dc: 'NS-DC01', credentialTarget: 'NS-FILE01', events: [{ time: 'Today 11:58', caller: 'NS-WS-0277' }, { time: 'Today 12:31', caller: 'NS-WS-0277' }, { time: 'Today 13:02', caller: 'NS-WS-0277' }] } },
  'u-1004': { accountExpires: 'Never', passwordExpired: true, passwordLastSet: '92 days ago', lastBadPassword: 'None', enabled: false, sspr: 'Not registered', history: 'TEST Disabled — leave of absence (HR-9852)' },
  'u-1009': { accountExpires: 'In 9 days', passwordExpired: false, passwordLastSet: '20 days ago', lastBadPassword: 'None', sponsor: 'Leah Brooks', sspr: 'Registered' },
  'u-1020': { accountExpires: 'Yesterday', expired: true, passwordExpired: false, passwordLastSet: '40 days ago', lastBadPassword: 'Today 09:10', sponsor: 'Monica Hall' },
};
const DIRECTORY = { readOnly: false, accounts: ACCOUNTS, groups: { 'TEST-Finance-Users': { resource: 'TEST Finance' }, 'TEST-Listed': { members: ['gkim'] } } };
const TICKETS = [LOCKOUT, DISABLED, GROUPS, PLAIN];
const SETS = {
  'test-acct': { title: 'Test accounts', tickets: ['HD-9851', 'HD-9852', 'HD-9853', 'HD-9854'], now: at(WED, '13:05'), directory: DIRECTORY },
  // Read-only: the status rows show, no control does.
  'test-acct-ro': { title: 'Test accounts read-only', tickets: ['HD-9851', 'HD-9854'], now: at(WED, '13:05'), directory: { accounts: ACCOUNTS } },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));
    HD_COACHED_SETS['test-2101'] = { title: 'Test HD-2101 Tier 2', tickets: ['HD-2101', 'HD-9851'], now: '2026-08-19T13:05:00Z', hd2101Tier2: true, directory: JSON.parse(JSON.stringify(__test.sets['test-acct'].directory)) };
    HD_COACHED_SETS['test-2101-off'] = { title: 'Test HD-2101 as before', tickets: ['HD-2101', 'HD-9851'], now: '2026-08-19T13:05:00Z', directory: JSON.parse(JSON.stringify(__test.sets['test-acct'].directory)) };`, ctx);
}
const acct = (local) => setSim('test-acct', local);
// Values copied out of the sandbox, so deepEqual compares plain host arrays.
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const actions = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).consoleState.actions.map((a) => a.id)`);
const machineSeen = (tab, name) => json(tab, `(hdMachine(${JSON.stringify(name)}).seen || [])`);

// The pane's status fields, from the fixture, and Get-ADUser on the same record.
function testStatusFields() {
  const tab = acct();
  tab.open('HD-9851');
  tab.run("hdOpenUser('u-1003')");
  const pane = tab.pane();
  assert.match(pane, /data-hd-account-expires>Never</);
  assert.match(pane, /data-hd-password-expired>No</);
  assert.match(pane, /data-hd-password-last-set>Yesterday 16:10</);
  assert.match(pane, /data-hd-last-bad-password>Today 13:02</);
  assert.doesNotMatch(pane, /data-hd-sponsor/, 'no sponsor row for an employee');
  const screen = tab.seen();
  const cmd = acct(); cmd.open('HD-9851');
  const out = cmd.ps('Get-ADUser nwilliams -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet');
  assert.match(out, /AccountExpirationDate\s+: \(not set: never expires\)/);
  assert.match(out, /Enabled\s+: True/);
  assert.match(out, /LockedOut\s+: True/);
  assert.match(out, /PasswordExpired\s+: False/);
  assert.match(out, /PasswordLastSet\s+: Yesterday 16:10/);
  assert.ok(cmd.seen().includes('ad-user:u-1003'), 'the command earns the pane key');
  assert.ok(screen.includes('ad-user:u-1003'));
  // A contractor shows the sponsor and end date; a disabled account its history.
  tab.run("hdOpenUser('u-1009')");
  assert.match(tab.pane(), /data-hd-sponsor>Leah Brooks</);
  assert.match(tab.pane(), /data-hd-account-expires>In 9 days</);
  tab.run("hdOpenUser('u-1004')");
  const priya = tab.pane();
  assert.match(priya, /data-hd-account-history>History: TEST Disabled — leave of absence \(HR-9852\)/);
  assert.match(priya, /<dt>Account<\/dt><dd>Disabled<\/dd>/);
  assert.match(cmd.ps('Get-ADUser pshah -Properties *'), /Enabled\s+: False[\s\S]*PasswordExpired\s+: True[\s\S]*PasswordLastSet\s+: 92 days ago/);
  // A user without an account fixture keeps Module 07's answer.
  assert.doesNotMatch(cmd.ps('Get-ADUser mchen -Properties LockedOut'), /PasswordExpired|AccountExpirationDate/);
  // Read-only: the same fields, and no account control.
  const ro = setSim('test-acct-ro'); ro.open('HD-9851'); ro.run("hdOpenUser('u-1003')");
  const roPane = ro.pane();
  assert.match(roPane, /data-hd-password-last-set>Yesterday 16:10</);
  assert.match(roPane, /data-hd-ad-read-only/);
  assert.doesNotMatch(roPane, /data-hd-acct|hdAdAction/);
}

// Lockout details and the Tier 2 (event 4740) view, screen and command alike.
function testLockoutDetails() {
  const tab = acct();
  tab.open('HD-9851'); tab.run("hdOpenUser('u-1003')");
  assert.match(tab.pane(), /data-hd-lockout="u-1003"/);
  tab.run("hdAcctLockoutOpen('u-1003')");
  let pane = tab.pane();
  assert.match(pane, /Lockouts today<\/dt><dd>3</);
  assert.match(pane, /data-hd-lockout-source>NS-WS-0277</);
  assert.match(pane, /Bad password count<\/dt><dd>5 of 5/);
  assert.doesNotMatch(pane, /data-hd-4740-card/);
  tab.run("hdAcctTier2('u-1003')");
  pane = tab.pane();
  assert.match(pane, /data-hd-4740-card="u-1003"[\s\S]*NS-DC01[\s\S]*Event ID 4740/);
  assert.equal((pane.match(/data-hd-4740>/g) || []).length, 3);
  assert.match(pane, /<td>nwilliams<\/td><td>NS-WS-0277<\/td>/);
  assert.ok(tab.seen().includes('ad-lockout:u-1003'));
  assert.ok(tab.seen().includes('lockout-4740:u-1003'));
  // Another ticket opens with both closed.
  tab.open('HD-9854'); tab.run("hdOpenUser('u-1003')");
  assert.doesNotMatch(tab.pane(), /data-hd-lockout-details|data-hd-4740-card/);
}

// Unlock waits for verification; the typed line earns the same action.
function testUnlockAfterVerification() {
  const tab = acct();
  tab.open('HD-9851'); tab.run("hdOpenUser('u-1003')");
  assert.match(tab.pane(), /data-hd-acct="unlock"/);
  tab.run("hdAcctDo('unlock', 'u-1003')");
  assert.equal(tab.run("hdFileUser('u-1003').locked"), true, 'still locked before verification');
  assert.match(tab.toasts.join('|'), /Verify the caller on HD-9851 first/);
  assert.ok(tab.run("hdState.practiceLog.some((e) => e.type === 'action_refused' && e.action === 'ad-unlock')"));
  tab.run("hdVerify('HD-9851', 'name')");
  tab.run("hdAcctDo('unlock', 'u-1003')");
  assert.equal(tab.run("hdFileUser('u-1003').locked"), true, 'a failing choice is not enough');
  tab.run("hdVerify('HD-9851', 'callback')");
  tab.run("hdAcctDo('unlock', 'u-1003')");
  assert.equal(tab.run("hdFileUser('u-1003').locked"), false);
  assert.deepEqual(actions(tab, 'HD-9851'), ['ad-unlocked']);
  const typed = acct(); typed.open('HD-9851');
  assert.match(typed.ps('Unlock-ADAccount nwilliams'), /Verify the caller/);
  typed.run("hdVerify('HD-9851', 'callback')");
  assert.equal(typed.ps('Unlock-ADAccount -Identity nwilliams'), '');
  assert.equal(typed.run("hdFileUser('u-1003').locked"), false);
  assert.deepEqual(actions(typed, 'HD-9851'), ['ad-unlocked'], 'the same action as the screen');
  // A ticket with no account keys turns no control on, even in this set.
  typed.open('HD-9854'); typed.run("hdOpenUser('u-1003')");
  const plain = typed.pane();
  assert.match(plain, /data-hd-acct-none/);
  assert.doesNotMatch(plain, /data-hd-acct=|hdAdAction/);
  assert.match(typed.ps('Unlock-ADAccount nwilliams'), /doesn't allow/);
}

// Wait 2 minutes: a stale saved credential locks it again; removed, it doesn't.
function testWaitAndCredentialManager() {
  const tab = acct();
  tab.open('HD-9851');
  assert.match(tab.open('HD-9851'), /data-hd-wait-card[\s\S]*Wait 2 minutes/);
  assert.doesNotMatch(tab.open('HD-9854'), /data-hd-wait/);
  tab.open('HD-9851');
  tab.run("hdVerify('HD-9851', 'callback'); hdAcctUnlock('u-1003')");
  assert.equal(tab.run('hdShiftTimeText(hdShiftNow())'), 'Wed 13:05');
  tab.run("hdAcctWait('HD-9851')");
  assert.equal(tab.run('hdShiftTimeText(hdShiftNow())'), 'Wed 13:07', 'the set clock moved 2 minutes');
  assert.equal(tab.run("hdFileUser('u-1003').locked"), true, 'locked again: the old password is still saved');
  tab.run("hdOpenUser('u-1003'); hdAcctLockoutOpen('u-1003'); hdAcctTier2('u-1003')");
  let pane = tab.pane();
  assert.match(pane, /Lockouts today<\/dt><dd>4</);
  assert.equal((pane.match(/data-hd-4740>/g) || []).length, 4);
  assert.match(pane, /<td>Wed 13:07<\/td><td>4740<\/td>/);
  // Credential Manager lists it; Remove asks first.
  tab.on('NS-WS-0277');
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="credential-manager"/);
  tab.run("hdOpenMachineScreen('NS-WS-0277', 'credential-manager')");
  let screen = tab.view('helpdesk/credential-manager');
  assert.match(screen, /data-hd-cred="NS-FILE01"[\s\S]*NORTHSTAR\\nwilliams/);
  assert.doesNotMatch(screen, /stale|password:/i);
  assert.deepEqual(machineSeen(tab, 'NS-WS-0277'), ['credential-manager']);
  tab.run("hdCredAsk('NS-WS-0277', 'NS-FILE01')");
  assert.match(tab.view('helpdesk/credential-manager'), /data-hd-cred-confirm/);
  tab.run("hdCredRemove('NS-WS-0277', 'NS-FILE01')");
  screen = tab.view('helpdesk/credential-manager');
  assert.match(screen, /No Windows credentials are saved/);
  tab.run("hdAcctUnlock('u-1003'); hdAcctWait('HD-9851')");
  assert.equal(tab.run("hdFileUser('u-1003').locked"), false, 'stays unlocked once the saved password is gone');
  tab.run("hdAcctLockoutOpen('u-1003')");
  assert.match(tab.pane(), /Bad password count<\/dt><dd>0 of 5/);
  assert.deepEqual(actions(tab, 'HD-9851'), ['ad-unlocked', 'waited', 'credential-removed', 'ad-unlocked', 'waited']);
  // cmdkey reads and writes the same list, with the same key and action.
  const cmd = acct(); cmd.open('HD-9851'); cmd.on('NS-WS-0277');
  const list = cmd.ps('cmdkey /list');
  assert.match(list, /Target: Domain:target=NS-FILE01\n\s+Type: Domain Password\n\s+User: NORTHSTAR\\nwilliams/);
  assert.deepEqual(machineSeen(cmd, 'NS-WS-0277'), ['credential-manager'], 'the same key as the screen');
  assert.equal(cmd.ps('cmdkey /delete:Domain:target=NS-NOPE'), 'CMDKEY: Element not found.');
  assert.equal(cmd.ps('cmdkey /delete:NS-FILE01'), 'CMDKEY: Credential deleted successfully.');
  assert.match(cmd.ps('cmdkey /list'), /\* NONE \*/);
  assert.deepEqual(actions(cmd, 'HD-9851'), ['credential-removed'], 'the same action as the screen');
  assert.match(cmd.ps('Get-Help'), /cmdkey \/list/);
  // Another PC in this shift has no Credential Manager and no cmdkey.
  cmd.on('NS-LT-0131');
  assert.doesNotMatch(cmd.view('helpdesk/windows'), /credential-manager/);
  assert.doesNotMatch(cmd.ps('cmdkey /list'), /Currently stored/);
}

// Enable needs the record; Reset needs KB-0104's condition; the password shows once.
function testEnableAndReset() {
  const tab = acct();
  tab.open('HD-9852'); tab.run("hdOpenUser('u-1004')");
  assert.match(tab.pane(), /data-hd-acct="enable"[\s\S]*data-hd-acct="reset"/);
  assert.doesNotMatch(tab.pane(), /data-hd-acct="unlock"/, 'only the controls the ticket turns on');
  tab.run("hdAcctOpenDialog('u-1004', 'enable')");
  assert.match(tab.toasts.pop(), /Verify the caller/);
  // A pass choice other than the callback (a photo badge) verifies too.
  tab.run("hdVerify('HD-9852', 'badge')");
  tab.run("hdAcctOpenDialog('u-1004', 'enable')");
  assert.equal(tab.toasts.pop(), 'TEST open HR-9852 first');
  tab.run("hdServerSeen('test-hr-record', 'TEST HR record')");
  tab.run("hdAcctOpenDialog('u-1004', 'enable')");
  assert.match(tab.pane(), /data-hd-acct-dialog="enable"[\s\S]*Approval: HR-9852/);
  // A disabled account is enabled first.
  assert.equal(tab.run("hdAcctReset('u-1004', true).ok"), false);
  assert.match(tab.toasts.pop(), /disabled\. Enable it first/);
  tab.run("hdAcctDo('enable', 'u-1004')");
  assert.equal(tab.run("hdFileUser('u-1004').enabled"), true);
  // Reset: the dialog ticks must-change by default.
  tab.run("hdAcctOpenDialog('u-1004', 'reset')");
  assert.match(tab.pane(), /data-hd-acct-dialog="reset"[\s\S]*id="hd-reset-must-change" checked/);
  tab.run("hdAcctResetConfirm('u-1004')");
  const otp = tab.run('hdAcctOtp.value');
  assert.match(otp, /^[A-Za-z]{2}\d-[A-Za-z]{3}\d-\d{2}[A-Za-z]$/);
  let pane = tab.pane();
  assert.ok(pane.includes(otp), 'shown');
  assert.match(pane, /Read this to the user; never type it into the ticket/);
  assert.ok(tab.pane().includes(otp), 'a redraw before it is read keeps it on screen');
  tab.run('hdAcctOtpDone()');
  pane = tab.pane();
  assert.ok(!pane.includes(otp), 'and never again once read');
  assert.match(pane, /data-hd-otp-hidden/);
  assert.match(pane, /data-hd-password-expired>No</);
  assert.match(pane, /Must change password<\/dt><dd>At next logon/);
  assert.deepEqual(actions(tab, 'HD-9852'), ['ad-enabled', 'ad-password-reset', 'ad-must-change']);
  // Never saved, logged or written.
  const saved = [...tab.ctx.localStorage.map.values()].join('');
  assert.ok(!saved.includes(otp), 'not in saved state');
  assert.ok(!JSON.stringify(tab.run('hdState')).includes(otp), 'not in the shift');
  assert.equal(tab.run(`hdPasswordInText(${JSON.stringify(`Reset done, temp is ${otp}`)})`), true, 'a note holding it is refused');
  // Typed: the same reset, then must-change.
  const cmd = acct(); cmd.open('HD-9852'); cmd.run("hdVerify('HD-9852', 'callback')");
  assert.match(cmd.ps('Set-ADAccountPassword pshah -Reset -NewPassword (ConvertTo-SecureString "Spring2026!" -AsPlainText -Force)'), /Stopped/);
  assert.match(cmd.ps('Set-ADUser pshah -ChangePasswordAtLogon $true'), /Reset the password first/);
  const local = store();
  const typedTab = acct(local); typedTab.open('HD-9852'); typedTab.run("hdVerify('HD-9852', 'callback'); hdServerSeen('test-hr-record', 'TEST'); hdAcctEnable('u-1004')");
  const screen = typedTab.shell('Set-ADAccountPassword pshah -Reset');
  const shellOtp = typedTab.run('hdAcctOtp.value');
  assert.ok(screen.includes(shellOtp), 'the shell shows it');
  assert.match(screen, /never type it into the ticket/);
  assert.ok(![...local.map.values()].join('').includes(shellOtp), 'the saved transcript never holds it');
  assert.ok(!JSON.stringify(typedTab.run('hdState')).includes(shellOtp));
  typedTab.run('hdAcctOtpDone()');
  assert.ok(!typedTab.view('helpdesk/powershell').includes(shellOtp), 'hidden once read');
  assert.ok(!acct(local).view('helpdesk/powershell').includes(shellOtp), 'and after a reload');
  assert.match(acct(local).view('helpdesk/powershell'), /one-time password: shown once, not saved/);
  const out = cmd.ps('Set-ADAccountPassword pshah -Reset');
  assert.match(out, /disabled\. Enable it first/, 'this shift has not enabled her yet');
  cmd.run("hdServerSeen('test-hr-record', 'TEST'); hdAcctEnable('u-1004')");
  const typedOut = cmd.ps('Set-ADAccountPassword pshah -Reset');
  const typedOtp = cmd.run('hdAcctOtp.value');
  assert.ok(typedOut.includes(typedOtp) && /never type it into the ticket/.test(typedOut));
  cmd.run("hdOpenUser('u-1004')");
  assert.equal(cmd.run("hdFileUser('u-1004').mustChange"), false);
  assert.equal(cmd.ps('Set-ADUser pshah -ChangePasswordAtLogon $true'), '');
  assert.equal(cmd.run("hdFileUser('u-1004').mustChange"), true);
  assert.deepEqual(actions(cmd, 'HD-9852'), ['ad-enabled', 'ad-password-reset', 'ad-must-change'], 'the same actions as the screen');
  // KB-0104: no reset for a user who can use self-service.
  const noah = acct(); noah.open('HD-9851'); noah.run("hdVerify('HD-9851', 'callback')");
  assert.equal(noah.run("hdAcctReset('u-1003', true).ok"), false);
  assert.match(noah.toasts.pop(), /KB-0104: Noah Williams can use self-service password reset/);
  assert.equal(noah.run('hdAcctOtp'), null);
  assert.deepEqual(actions(noah, 'HD-9851'), []);
  // Enable on an enabled account, and an account this ticket doesn't name.
  assert.match(noah.ps('Enable-ADAccount pshah'), /doesn't allow/);
}

// Add and Remove take only the approval's groups; every view agrees after.
function testGroupChanges() {
  const tab = acct();
  tab.open('HD-9853'); tab.run("hdOpenUser('u-1006')");
  assert.match(tab.pane(), /data-hd-acct-groups[\s\S]*Group changes follow HR-9853/);
  assert.doesNotMatch(tab.pane(), /Add approved group/, 'the old hard-coded button is gone here');
  tab.run("hdAcctGroup('u-1006', 'add', 'GG-Finance-Readers')");
  assert.match(tab.toasts.pop(), /isn't on HR-9853/);
  tab.run("hdAcctGroup('u-1006', 'add', 'TEST-Finance-Users')");
  tab.run("hdAcctGroup('u-1006', 'remove', 'TEST-Listed')");
  tab.run("hdAcctGroup('u-1006', 'remove', 'GG-HR-Users')");
  const groups = json(tab, "hdFileUser('u-1006').groups");
  assert.ok(groups.includes('TEST-Finance-Users'));
  assert.ok(!groups.includes('TEST-Listed'), 'a group that lists her is removed too');
  assert.ok(!groups.includes('GG-HR-Users'), 'and her own group');
  const memberOf = /data-hd-member-of>([\s\S]*?)<\/dd>/.exec(tab.pane())[1];
  assert.match(memberOf, /TEST-Finance-Users/);
  assert.doesNotMatch(memberOf, /TEST-Listed|GG-HR-Users/);
  assert.doesNotMatch(tab.ps('Get-ADGroupMember TEST-Listed'), /gkim/);
  assert.match(tab.ps('Get-ADGroupMember TEST-Finance-Users'), /gkim/);
  assert.doesNotMatch(tab.ps('Get-ADPrincipalGroupMembership gkim'), /GG-HR-Users|TEST-Listed/);
  tab.run("hdAdGroupOpen('GG-HR-Users')");
  assert.doesNotMatch(tab.ad('groups'), /data-hd-group-member="Grace Kim"/);
  assert.deepEqual(actions(tab, 'HD-9853'), ['ad-group-added', 'ad-group-removed', 'ad-group-removed']);
  // Typed, with the same actions.
  const cmd = acct(); cmd.open('HD-9853');
  assert.match(cmd.ps('Add-ADGroupMember GG-HR-Readers -Members gkim'), /isn't on HR-9853/);
  assert.equal(cmd.ps('Add-ADGroupMember -Identity TEST-Finance-Users -Members gkim'), '');
  assert.equal(cmd.ps('Remove-ADGroupMember TEST-Listed gkim -Confirm:$false'), '');
  assert.deepEqual(actions(cmd, 'HD-9853'), ['ad-group-added', 'ad-group-removed']);
  assert.match(cmd.ps('Add-ADGroupMember TEST-Nope -Members gkim'), /Cannot find an object/);
}

// whoami /groups: the groups at the last sign-in, until sign out and back in.
function testWhoamiAfterSignIn() {
  const tab = acct(); tab.open('HD-9851'); tab.run("hdVerify('HD-9851', 'callback')");
  tab.on('NS-WS-0277');
  assert.match(tab.ps('whoami /groups'), /NORTHSTAR\\GG-Sales-Users/);
  tab.run("hdAcctGroup('u-1003', 'remove', 'GG-Sales-Users'); hdAcctGroup('u-1003', 'add', 'TEST-Finance-Users')");
  let out = tab.ps('whoami /groups');
  assert.match(out, /GG-Sales-Users/, 'still the old groups before signing in again');
  assert.doesNotMatch(out, /TEST-Finance-Users/);
  assert.match(tab.view('helpdesk/windows'), /data-hd-tools="sign-in-again"/);
  tab.run("hdWinSignInAgain('NS-WS-0277')");
  out = tab.ps('whoami /groups');
  assert.match(out, /NORTHSTAR\\TEST-Finance-Users/);
  assert.doesNotMatch(out, /GG-Sales-Users/);
  assert.ok(machineSeen(tab, 'NS-WS-0277').includes('whoami-groups'));
  assert.ok(actions(tab, 'HD-9851').includes('signed-out-in'));
}

// Search-ADAccount and Get-Help, only where account work is on.
function testSearchAndHelp() {
  const tab = acct(); tab.open('HD-9854');
  assert.match(tab.ps('Search-ADAccount -LockedOut'), /Noah Williams\s+nwilliams\s+True/);
  assert.match(tab.ps('Search-ADAccount -AccountExpired'), /Marcus Lee\s+mlee\s+Yesterday/);
  assert.ok(tab.seen().includes('ad-user:u-1003') && tab.seen().includes('ad-user:u-1020'));
  assert.match(tab.ps('Get-Help'), /Account status: Get-ADUser/);
  assert.doesNotMatch(tab.ps('Get-Help'), /Account changes/, 'no changes on a ticket without them');
  tab.open('HD-9851');
  assert.match(tab.ps('Get-Help'), /Account changes/);
  // A Module 07 set: neither line.
  const m07 = setSim('its-05');
  assert.doesNotMatch(m07.ps('Get-Help'), /Account status|Account changes|cmdkey/);
}

// HD-2101 in a set with hd2101Tier2: shown, never fixed, by Tier 1.
function testHd2101Tier2() {
  const tab = sim(); assert.equal(tab.run("hdUseTicketSet('test-2101')"), true);
  tab.open('HD-2101');
  assert.equal(tab.run('hdM01Tier2()'), true);
  tab.run("hdM01Identity('callback')");
  tab.on('NS-LT-0117');
  const set = tab.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell');
  assert.match(set, /Tier 2 work \(KB-0103\)/);
  assert.doesNotMatch(set, /Secure credential prompt/);
  assert.match(tab.ps('schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell'), /Tier 2 work/);
  assert.equal(tab.run('hdM01Fix("test").ok'), false);
  assert.equal(tab.run('hdM01Task().credentialCurrent'), false, 'the task keeps its old password');
  const help = tab.ps('Get-Help');
  assert.doesNotMatch(help, /Set-ScheduledTask|schtasks \/Change/);
  assert.match(help, /Get-ScheduledTask/);
  assert.doesNotMatch(tab.open('HD-2101'), /Your investigation/, "Module 1's outcome list is off");
  tab.run("hdResolveTicket('HD-2101')");
  assert.match(tab.toasts.pop(), /Tier 2 work \(KB-0103\): escalate to Desktop Support/);
  assert.notEqual(tab.run("hdTicketById('HD-2101').status"), 'Resolved');
  // Lockout details for jbell, with the Tier 2 view from the scenario's events.
  tab.run("hdOpenUser('u-1005'); hdAcctLockoutOpen('u-1005'); hdAcctTier2('u-1005')");
  const pane = tab.pane();
  assert.match(pane, /data-hd-lockout-source>NS-LT-0117</);
  assert.match(pane, /data-hd-4740-card="u-1005"[\s\S]*<td>jbell<\/td><td>NS-LT-0117<\/td>/);
  assert.ok(tab.run("hdState.scenarios['HD-2101'].sourceFoundVia.length") > 0, 'the scenario still records the source');
  // Another account's typed unlock goes past the scenario's handler.
  tab.open('HD-9851'); tab.run("hdVerify('HD-9851', 'callback')");
  assert.equal(tab.ps('Unlock-ADAccount nwilliams'), '');
  assert.equal(tab.run("hdFileUser('u-1003').locked"), false);
  assert.match(tab.ps('Search-ADAccount -LockedOut'), /jbell/);
  // Without the flag, the same set keeps Module 1's fix path.
  const off = sim(); assert.equal(off.run("hdUseTicketSet('test-2101-off')"), true);
  off.open('HD-2101'); off.run("hdM01Identity('callback')"); off.on('NS-LT-0117');
  assert.equal(off.run('hdM01Tier2()'), false);
  assert.match(off.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell'), /Secure credential prompt/);
  assert.match(off.open('HD-2101'), /Your investigation/);
  assert.equal(sim().run('hdM01Tier2()'), false, 'the shared shift is unchanged');
}

// A Prove shift with account actions: no verification step, events recorded,
// no teaching text, and the one-time password never in the record.
function testProveShift() {
  const before = `(() => { const shift = HD_PROVE_SHIFTS['its-05'];
    shift.directory = Object.assign({}, shift.directory, { readOnly: false, accounts: { 'u-1020': { accountExpires: 'Yesterday', expired: true, passwordExpired: false, passwordLastSet: '40 days ago', lastBadPassword: 'Today 09:10', sponsor: 'Monica Hall', sspr: 'Not registered',
      lockout: { badPasswordCount: 2, lockoutsToday: 0, lastLockout: '', source: 'NS-WH-01', events: [] } } } });
    shift.accountActions = { 'u-1020': { reset: true, expiry: true } }; })();`;
  const tab = sim({ url: proveUrl('its-05'), withTest: false, before });
  tab.run("hdOpenUser('u-1020')");
  const pane = tab.pane();
  assert.match(pane, /data-hd-acct="reset"[\s\S]*data-hd-acct-expiry/);
  assert.doesNotMatch(pane, /callout info|Each change waits/, 'no teaching text in a Prove It');
  assert.match(pane, /data-hd-sponsor>Monica Hall</);
  const result = tab.run("hdAcctReset('u-1020', true)");
  assert.equal(result.ok, true);
  tab.run("hdAcctExpiry('u-1020', 30)");
  assert.equal(tab.run("hdFileUser('u-1020').accountExpires"), 'In 30 days (changed)');
  const events = json(tab, "hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => e.value)");
  assert.deepEqual(events, ['ad-password-reset', 'ad-must-change', 'ad-expiry-changed']);
  assert.ok(!JSON.stringify(tab.run('hdState.prove')).includes(result.value), 'the password is not in the record');
  tab.run("hdAcctLockoutOpen('u-1020'); hdAcctTier2('u-1020')");
  assert.doesNotMatch(tab.pane(), /Tier 2\\'s view, shown as evidence/);
  assert.ok(tab.run("hdState.prove.opened.includes('lockout-4740:u-1020')"));
  // A change this shift doesn't turn on is refused and recorded, without the reason.
  tab.run("hdAcctUnlock('u-1020')");
  assert.equal(tab.toasts.pop(), 'Insufficient access rights to perform the operation.');
  assert.ok(tab.run("hdState.prove.events.some((e) => e.value === 'ad-unlock-refused' && e.source === 'mlee')"));
  assert.equal(tab.ps('Set-ADAccountExpiration mlee -DateTime 2027-01-01'), '');
  // Typed refusals say no more than the screen.
  assert.equal(tab.ps('Unlock-ADAccount mlee'), 'Insufficient access rights to perform the operation.');
  assert.equal(tab.ps('Set-ADAccountPassword mchen -Reset'), 'Insufficient access rights to perform the operation.');
  assert.equal(tab.ps('Set-ADUser mchen -ChangePasswordAtLogon $true'), 'Insufficient access rights to perform the operation.');
  // The typed reset prints the password and nothing that says what to do next.
  const typed = tab.ps('Set-ADAccountPassword mlee -Reset');
  assert.doesNotMatch(typed, /Next:|Read it to the user|never type/);
  // Every account offers the same controls, so none points at the case.
  tab.run("hdOpenUser('u-1001')");
  const other = tab.pane();
  assert.match(other, /data-hd-acct="reset"[\s\S]*data-hd-acct-expiry/);
  assert.doesNotMatch(other, /data-hd-acct-none/);
  tab.run("hdAcctReset('u-1001', true)");
  assert.equal(tab.toasts.pop(), 'Insufficient access rights to perform the operation.');
  // The one-time password callout has no teaching line in a Prove It.
  tab.run("hdOpenUser('u-1020')");
  assert.doesNotMatch(tab.pane(), /never type it into the ticket/);
}

// A reload keeps what was done and never shows the password again.
function testReload() {
  const local = store();
  const tab = acct(local);
  tab.open('HD-9852'); tab.run("hdVerify('HD-9852', 'callback'); hdServerSeen('test-hr-record', 'TEST'); hdAcctEnable('u-1004'); hdAcctReset('u-1004', true)");
  const otp = tab.run('hdAcctOtp.value');
  tab.open('HD-9851'); tab.run("hdVerify('HD-9851', 'callback'); hdAcctUnlock('u-1003'); hdAcctWait('HD-9851'); hdCredRemove('NS-WS-0277', 'NS-FILE01'); hdAcctLockoutOpen('u-1003')");
  const again = acct(local);
  assert.equal(again.run("hdFileUser('u-1004').enabled"), true);
  assert.equal(again.run("hdFileUser('u-1004').mustChange"), true);
  assert.equal(again.run("hdFileUser('u-1003').locked"), true);
  assert.equal(again.run("hdState.lockouts['u-1003'].lockoutsToday"), 4);
  assert.deepEqual(json(again, "hdMachine('NS-WS-0277').savedCredentials"), []);
  again.run("hdOpenUser('u-1004')");
  assert.ok(!again.pane().includes(otp));
  assert.equal(again.run('hdAcctOtp'), null);
}

const tests = [testOldShiftsUnchanged, testStatusFields, testLockoutDetails, testUnlockAfterVerification, testWaitAndCredentialManager,
  testEnableAndReset, testGroupChanges, testWhoamiAfterSignIn, testSearchAndHelp, testHd2101Tier2, testProveShift, testReload];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m08-console-a: ${tests.length} passed`);

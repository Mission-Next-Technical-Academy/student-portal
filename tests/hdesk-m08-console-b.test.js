'use strict';
/* Help Desk simulator: Module 08 (key its-06), console B (ui/helpdesk.js
 * "Microsoft 365, Entra, Intune and a phone"): the Microsoft 365 admin center
 * (Licenses and apps, Shared mailboxes, Distribution lists, Service health),
 * the Entra admin center (Authentication methods with Require re-register
 * MFA, SSPR status, Sign-in logs, Audit logs), the Intune device view and a
 * phone screen (status bar, Bluetooth, Notifications, Software update,
 * Company Portal, Outlook, OneDrive, Authenticator).
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-98xx,
 * TEST text, NS-PH-98xx), never in ui/helpdesk-data.js. No Module 08
 * content. Every older ticket, set and Prove shift must look and behave as
 * before: their screens are pinned against the tree before this part. */
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
const FIXED = Date.parse('2026-08-19T13:05:00Z');
// Locale-free times, so the pins are the same on every computer and time zone.
class FixedDate extends Date {
  constructor(...args) { if (args.length) super(...args); else super(FIXED); }
  static now() { return FIXED; }
  toLocaleString() { return this.toISOString(); }
  toLocaleTimeString() { return this.toISOString().slice(11, 16); }
  toLocaleDateString() { return this.toISOString().slice(0, 10); }
}
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
    view: (route) => run(`VIEWS[${j(route)}] ? VIEWS[${j(route)}]() : ''`),
    ps: (command) => run(`hdPowerShellOutput(${j(command)})`),
    on: (computer) => run(`hdState.selectedComputer = ${j(computer)}`),
    seen: () => [...(run('hdState.serverSeen') || [])],
  };
}
const proveUrl = (key) => `https://academy.test/sim/?prove=${key}&student=student-m08b#/helpdesk/tickets`;

/* ---------- The tree before this part, pinned ----------
 * Every older shift: each of its tickets' views, the Windows Desktop and
 * Company Portal on its computer, and Get-Help. Computed on the tree at
 * cc8b7eb (console A) with `node tests/hdesk-m08-console-b.test.js --print-pins`. */
const MODULE_8_SETS = ['its-06', 'its-06-guided'];
function shiftsOf(plain) {
  const shifts = [{ name: 'shared', make: () => sim({ withTest: false }) }];
  Object.keys(plain.run('HD_PRACTICE_SETS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `practice:${key}`, make: () => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, withTest: false }) }));
  Object.keys(plain.run('HD_COACHED_SETS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `coached:${key}`, make: () => { const tab = sim({ withTest: false }); assert.equal(tab.run(`hdUseTicketSet(${JSON.stringify(key)})`), true); return tab; } }));
  Object.keys(plain.run('HD_PROVE_SHIFTS')).filter((k) => !MODULE_8_SETS.includes(k)).forEach((key) => shifts.push({ name: `prove:${key}`, make: () => sim({ url: proveUrl(key), withTest: false }) }));
  return shifts;
}
function pinsOf(make) {
  const tab = make();
  const tickets = tab.run('hdState.tickets.map((t) => t.id)');
  const views = tickets.map((id) => sha(tab.open(id)));
  const home = tab.run('hdState.selectedComputer');
  tab.on(home);
  const screens = [tab.view('helpdesk/windows'), tab.view('helpdesk/company-portal'), tab.view('helpdesk/onedrive'), tab.ps('Get-Help')];
  return { tickets: sha(views.join(',')), screens: sha(screens.join('\n')) };
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
  shared: { tickets: '19a5893d98ae8afa324d79c0284c9486b884164ae361be38871414f63f165de4', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-01': { tickets: 'b60b2bc81202fc2843b6d934e1be1e26fbe73ed32ea57676d1781c9381942f33', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-10': { tickets: '97b12acdee3b22d0eb9a3d3360d1aae99262db8b742ece73cb6ffec26747fd87', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-11': { tickets: '300e2afc6cc2f22db756f8bee61feb51a29e111adc439d2e96404800d1ee0a04', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-02': { tickets: '89d579a03def3993a9b27a800510b93840950beb70ef43f76b36097f49e27652', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-03': { tickets: '56cd291c5be636f826334d71a211bfba96cadfcf360a072d8beb9802afe464b8', screens: 'a9cfa9b0d75b8faa61b1575394299e35f5b4155080721bdf7d31d360dce9d11e' },
  'practice:its-07': { tickets: '3387daf641d156dc4a682f6bdd5f3ab5a41e2a64e0777309165902bd721bfb0f', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'practice:its-05': { tickets: '4a4cabd4ef58ca1c04067614091a06f7cd9a61eef56217fdb551aa52937d0999', screens: '9415d5099de1f429786a6cc4fa67e22a2a3e7c5b59a8bd477b0e1dab9a8e3307' },
  'coached:its-10-guided': { tickets: 'ec2201fb0a37552bc1ca28126ab3c6b9d04b7d4dafd16d9743c9f1692e6cd839', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'coached:its-11-guided': { tickets: '69bb75db2d2d6494a110458125fcf11e22d37a8f737d0bb9d6971806cbd71862', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'coached:its-02-guided': { tickets: '2a18cfe379cc4886762a92e2f819abd5ed3d6026f613e9e569e64bbbc5511c79', screens: '9736fbf67d7cd07909861c11b5b28b5e4b92377d78f9c13fef5806a3a6b27446' },
  'coached:its-02-server': { tickets: '2775b594b1babef07b133d5c96abf725931fa9430bd9d485bfee0bc1e1b6afc5', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'coached:its-03-guided': { tickets: '34b9d92eb99056692824a05a83b267b67143b1fef06bdab6f70441f16921d471', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'coached:its-07-guided': { tickets: '5ac8e1ae952ddf61a7dc76f532d2da9f5b5caf830d04740bbe43a4e810219833', screens: '3bb7b71cc09a1a568ee28f52076c66f2d188cd9a228b59d81cb625a3840707c0' },
  'coached:its-05-guided': { tickets: '13eb2965c8e669a0ab73fd51a9eedd5a4d3b6e8ec3de97ad9a77ad40587d8c08', screens: '9415d5099de1f429786a6cc4fa67e22a2a3e7c5b59a8bd477b0e1dab9a8e3307' },
  'prove:its-01': { tickets: '04772342502114dc0ad13acddf0cbc00330158d4063f3f9d2faf9a877cb14091', screens: '278c2d22b0ce58ac8ce43db106bcf90cbbf17f34a90046e700ed14c498747daf' },
  'prove:its-10': { tickets: '1477780e26acf888c3b82e7a27fa843b395b0d665d2c43695164410a60c0af57', screens: '086ecc58da451f54a8631e546826bdfa3046d942a2fb8ead7532361d6dcbe0eb' },
  'prove:its-11': { tickets: '4fb273b799bac6e15f70549e25ecfb8021bc7a5fcc28e5ec29190c542b3c3a4c', screens: 'fe0b2020cd9d124dde0948aadc7b628c9ab1f128f5a61b8cc6733c56d7dc65f4' },
  'prove:its-02': { tickets: '91828edbb893b150da9c684cc2164328f657c61834a8119ea6d25fac0d5f3d88', screens: '8c508b7da651c9e5c0cda08017f3cb269d1ffeccd8023a1246f4e3b14dc281b8' },
  'prove:its-03': { tickets: '4a19f9a81752f4e5c63a226c0d153c41b77da2f29b0eb3eeca07c8d1be96df4f', screens: '7ed5c0ab668efbfa8ce0bd463b2b67fda7a109b76139496d747df34d609e9746' },
  'prove:its-07': { tickets: 'e1d0c09ce8997778ef2f2b9904bbfe5ea0a7751b696cc878d5d24e791de7e683', screens: '665463bc401b0e4dcf5dfb919bf81a846e3a6ef402a3373b18de3a47690f4ecc' },
  'prove:its-05': { tickets: 'f054ea9755c77fbf3c022fd69a11421be41d46891a31d2d5a4e934058fee2aa6', screens: 'e405fd4464db6c46681d1581d0081182e8af0a53a82d9dbadf327bd6c7da3cf0' },
};
const NEW_ROUTES = ['helpdesk/m365-admin', 'helpdesk/entra-admin', 'helpdesk/intune', 'helpdesk/phone'];

// Every older shift looks exactly as before; the new screens say they're off.
function testOldShiftsUnchanged() {
  const plain = sim({ withTest: false });
  const shifts = shiftsOf(plain);
  assert.equal(shifts.filter((shift) => PINNED[shift.name]).length, Object.keys(PINNED).length, 'every pinned shift still exists');
  for (const shift of shifts) {
    const pins = PINNED[shift.name];
    if (!pins) continue;
    assert.deepEqual(pinsOf(shift.make), pins, `${shift.name} unchanged`);
    const tab = shift.make();
    for (const id of tab.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(tab.open(id), /data-hd-cloud-card/, `${shift.name} ${id}: no new card`);
    for (const route of NEW_ROUTES) assert.match(tab.view(route), /data-hd-cloud-missing/, `${shift.name}: ${route} is off`);
    assert.equal(tab.run('hdCloud()'), null);
  }
}

/* ---------- Test-only tickets and sets ---------- */
const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P4', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const VERIFY = { options: [{ id: 'name', text: 'TEST name only', feedback: 'TEST not enough' }, { id: 'badge', text: 'TEST photo badge matches', pass: true, feedback: 'TEST ok' }] };
// The set's tenant: licences, mailboxes, lists, health, Entra and Intune.
const TENANT = {
  m365: {
    users: ['u-1013', 'u-1006', 'u-1003'],
    licenseGroups: { 'TEST-E3-License': { sku: 'TEST Microsoft 365 E3', apps: ['Exchange Online', 'Teams'], formerMembers: ['u-1006'] } },
    sharedMailboxes: { 'test-support': { address: 'test-support@northstar.example', owner: 'TEST Owner', fullAccess: ['u-1013'], sendAs: [] } },
    distributionLists: { 'TEST-DL-Finance': { address: 'test-dl-finance@northstar.example', owner: 'TEST Owner' }, 'TEST-DL-Static': { address: 'static@northstar.example', members: ['TEST Person'] } },
    serviceHealth: [{ id: 'TEST-ADV1', service: 'Microsoft Teams', status: 'Service degradation', title: 'TEST recordings delayed', description: 'TEST one line', updated: 'Wed 12:00' }],
  },
  entra: {
    users: {
      'u-1013': { methods: [{ method: 'Microsoft Authenticator', device: 'NS-PH-9802', registered: 'Last year' }], signIns: [{ time: 'Wed 09:00', app: 'Microsoft Teams', device: 'Laptop', location: 'Office', status: 'Interrupted', failure: 'MFA required — not completed' }] },
      'u-1003': { methods: [{ method: 'Microsoft Authenticator', device: 'TEST personal phone', registered: 'Eight months ago' }], sspr: 'Registered', signIns: [] },
      'u-1006': { methods: [], signIns: [] },
    },
    audit: [{ time: 'Tue 16:00', actor: 'TEST admin', activity: 'TEST earlier entry', target: 'TEST' }],
  },
  intune: { minOs: '17.5', devices: { 'NS-PH-9802': { user: 'u-1013', ownership: 'Corporate', os: '16.1', retired: true }, 'NS-PH-9803': { user: 'u-1003', ownership: 'Corporate', os: '17.4', compliance: 'Not compliant', failingRule: 'OS version below minimum', graceEnded: 'Yesterday', lastCheckIn: 'Wed 08:00' } } },
  phones: {
    'NS-PH-9801': { label: 'TEST new phone', user: 'u-1013', company: true, os: '17.6', pin: true, encrypted: true, status: { wifi: true, cellular: '5G', dataUsedGb: 3.6, capGb: 5 }, bluetooth: { on: false, nearby: [{ name: 'TEST-Headset', pin: '0000' }] } },
    'NS-PH-9803': { label: 'TEST field phone', user: 'u-1003', company: true, os: '17.4', update: { version: '17.6' }, pin: true, encrypted: true, status: { wifi: true, cellular: '5G' }, companyPortal: { enrolled: true }, outlook: { account: true } },
    'TEST-personal': { label: 'TEST personal phone', user: 'u-1003', company: false, os: '17.6', status: { wifi: false, cellular: '4G' }, notifications: { authenticator: false }, authenticator: { work: true } },
  },
};
const SWAP = base({ id: 'HD-9861', number: 'INC0019861', requester: 'Sam Rivera', createdAt: at(WED, '13:00'), description: 'TEST new phone', console: {
  verification: VERIFY, criticalActions: [{ action: 'm365-license-direct', text: 'TEST direct licence' }],
  cloud: { allow: { reregister: { 'u-1013': { after: 'entra-methods:u-1013', afterText: 'TEST read the methods first' } }, mailbox: [{ mailbox: 'test-support', user: 'u-1013', permission: 'sendAs', ticket: 'HD-9861' }, { mailbox: 'test-support', user: 'u-1006', permission: 'fullAccess', ticket: 'HD-9865' }] } } } });
// A linked request that starts approved (a RITM fixture).
const REQUEST = base({ id: 'HD-9865', number: 'RITM0019865', requester: 'Grace Kim', createdAt: at(WED, '12:00'), description: 'TEST approved request', request: { number: 'RITM0019865', item: 'TEST Shared mailbox access', approval: 'Approved', approver: 'TEST Owner', state: 'Open', fields: [] }, console: { matrix: {} } });
const NOVERIFY = base({ id: 'HD-9862', number: 'INC0019862', requester: 'Sam Rivera', createdAt: at(WED, '13:01'), description: 'TEST no verification', console: { cloud: { allow: { reregister: { 'u-1013': true } } } } });
const MOVER = base({ id: 'HD-9863', number: 'INC0019863', requester: 'Grace Kim', createdAt: at(WED, '13:02'), description: 'TEST licence group', console: {
  accountActions: { 'u-1006': { groups: { record: 'HR-9863', add: ['TEST-E3-License', 'TEST-DL-Finance'], remove: [] } } },
  cloud: { allow: { sspr: { 'u-1006': true } } } } });
const PLAIN = base({ id: 'HD-9864', number: 'INC0019864', requester: 'Maya Chen', createdAt: at(WED, '13:03'), description: 'TEST plain', console: { matrix: {} } });
const DIRECTORY = { readOnly: false, accounts: { 'u-1006': { accountExpires: 'Never', passwordExpired: false, passwordLastSet: '3 days ago', lastBadPassword: 'None', sspr: 'Not registered' } }, groups: { 'TEST-E3-License': { resource: 'TEST licence' }, 'TEST-DL-Finance': { members: ['nwilliams'] } } };
const TICKETS = [SWAP, NOVERIFY, MOVER, PLAIN, REQUEST];
const SETS = {
  'test-cloud': { title: 'Test cloud', tickets: ['HD-9861', 'HD-9862', 'HD-9863', 'HD-9864', 'HD-9865'], now: at(WED, '13:05'), directory: DIRECTORY, cloud: TENANT },
  // The same tickets without a cloud block: nothing new shows.
  'test-nocloud': { title: 'Test no cloud', tickets: ['HD-9864'], now: at(WED, '13:05') },
};
function addTestData(ctx) {
  ctx.__test = { tickets: TICKETS, sets: SETS };
  vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
    Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets)));`, ctx);
}
const setSim = (key, local) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local });
const cloud = (local) => setSim('test-cloud', local);
const json = (tab, code) => JSON.parse(tab.run(`JSON.stringify(${code})`));
const actions = (tab, id) => json(tab, `hdTicketById(${JSON.stringify(id)}).consoleState.actions.map((a) => a.id)`);
const approve = (tab, id) => tab.run(`hdTicketById(${JSON.stringify(id)}).request = { item: 'TEST Shared mailbox access', approval: 'Approved', state: 'Open', fields: [] }`);

// The card shows only with a cloud block; an old ticket with no new key is as before.
function testCardOnlyWithBlock() {
  const tab = cloud();
  const card = /data-hd-cloud-card[\s\S]*?<\/div><\/div><\/div>/.exec(tab.open('HD-9864'))[0];
  for (const open of ['m365', 'entra', 'intune', 'phone:NS-PH-9801', 'phone:TEST-personal']) assert.match(card, new RegExp(`data-hd-cloud-open="${open}"`));
  const off = setSim('test-nocloud');
  assert.doesNotMatch(off.open('HD-9864'), /data-hd-cloud-card/);
  for (const route of NEW_ROUTES) assert.match(off.view(route), /data-hd-cloud-missing/);
}

// Microsoft 365: licences read from groups (with console A's changes), no direct E3.
function testLicensesViaGroup() {
  const tab = cloud(); tab.open('HD-9863');
  tab.run("hdM365OpenUser('u-1006')");
  let screen = tab.view('helpdesk/m365-admin');
  assert.match(screen, /data-hd-no-license/);
  assert.match(screen, /Was assigned via group: TEST-E3-License/);
  assert.ok(tab.seen().includes('m365-user:u-1006'));
  // Console A's Add group puts it back: the admin center reads the same groups.
  tab.run("hdAcctGroup('u-1006', 'add', 'TEST-E3-License')");
  screen = tab.view('helpdesk/m365-admin');
  assert.doesNotMatch(screen, /data-hd-no-license/);
  assert.match(screen, /data-hd-license="TEST Microsoft 365 E3"[\s\S]*Active[\s\S]*Assigned via group: TEST-E3-License/);
  assert.match(screen, /data-hd-license-read-only/);
  // A direct assignment is always refused and recorded (critical where a ticket says so).
  const swap = cloud(); swap.open('HD-9861');
  swap.run("hdM365AssignDirect('u-1013')");
  assert.match(swap.toasts.pop(), /through groups[\s\S]*KB-0106/);
  assert.ok(swap.run("hdState.practiceLog.some((e) => e.type === 'action_refused' && e.action === 'm365-license-direct')"));
  assert.equal(swap.run("hdTicketById('HD-9861').consoleState.critical.length"), 1);
}

// Shared mailboxes: Full Access and Send as lists; Add waits for the approved request.
function testSharedMailbox() {
  const tab = cloud(); tab.open('HD-9861');
  tab.run("hdM365OpenMailbox('test-support')");
  let pane = tab.view('helpdesk/m365-admin');
  assert.match(pane, /data-hd-full-access><li>Sam Rivera<\/li>/);
  assert.match(pane, /data-hd-send-as><li class="muted">Nobody/);
  assert.ok(tab.seen().includes('m365-mailbox:test-support'));
  tab.run("hdM365MailboxAdd('test-support', 'u-1013', 'sendAs')");
  assert.match(tab.toasts.pop(), /Wait for the request to be approved/);
  approve(tab, 'HD-9861');
  tab.run("hdM365MailboxAdd('test-support', 'u-1003', 'sendAs')");
  assert.match(tab.toasts.pop(), /No approved request on this ticket gives Noah Williams/);
  tab.run("hdM365MailboxAdd('test-support', 'u-1013', 'fullAccess')");
  assert.match(tab.toasts.pop(), /No approved request/);
  tab.run("hdM365MailboxAdd('test-support', 'u-1013', 'sendAs')");
  assert.match(tab.toasts.pop(), /up to an hour/);
  pane = tab.view('helpdesk/m365-admin');
  assert.match(pane, /data-hd-send-as><li>Sam Rivera<\/li>/);
  assert.deepEqual(actions(tab, 'HD-9861'), ['m365-sendas-added']);
  // A rule may name the linked request's ticket; a fixture request starts approved.
  tab.run("hdM365MailboxAdd('test-support', 'u-1006', 'fullAccess')");
  assert.match(tab.toasts.pop(), /up to an hour/);
  assert.match(tab.view('helpdesk/m365-admin'), /data-hd-full-access><li>Sam Rivera<\/li><li>Grace Kim<\/li>/);
  // A ticket with no mailbox rule refuses it.
  const other = cloud(); other.open('HD-9864');
  other.run("hdM365MailboxAdd('test-support', 'u-1013', 'sendAs')");
  assert.match(other.toasts.pop(), /No approved request/);
}

// Distribution lists from the directory group (console A changes count); Service health.
function testListsAndHealth() {
  const tab = cloud(); tab.open('HD-9863');
  tab.run("hdM365OpenList('TEST-DL-Finance')");
  let pane = tab.view('helpdesk/m365-admin');
  assert.match(pane, /data-hd-dl-members><li>Noah Williams<\/li><\/ul>/);
  tab.run("hdAcctGroup('u-1006', 'add', 'TEST-DL-Finance')");
  pane = tab.view('helpdesk/m365-admin');
  assert.match(pane, /data-hd-dl-members>[\s\S]*Grace Kim[\s\S]*Noah Williams|data-hd-dl-members>[\s\S]*Noah Williams[\s\S]*Grace Kim/);
  tab.run("hdM365OpenList('TEST-DL-Static')");
  assert.match(tab.view('helpdesk/m365-admin'), /data-hd-dl-members><li>TEST Person<\/li>/);
  tab.run("hdM365Tab('health')");
  const health = tab.view('helpdesk/m365-admin');
  assert.match(health, /data-hd-advisory="TEST-ADV1"[\s\S]*Microsoft Teams[\s\S]*TEST recordings delayed/);
  assert.ok(tab.seen().includes('m365-health'));
}

// Entra: methods, SSPR from the directory account, re-register only after verification.
function testEntraReregister() {
  const tab = cloud(); tab.open('HD-9861');
  tab.run("hdEntraOpenUser('u-1013')");
  let screen = tab.view('helpdesk/entra-admin');
  assert.match(screen, /data-hd-method-device>NS-PH-9802</);
  assert.ok(tab.seen().includes('entra-methods:u-1013'));
  tab.run("hdEntraReregister('u-1013')");
  assert.match(tab.toasts.pop(), /Verify Sam Rivera with KB-0065 first/);
  tab.run("hdVerify('HD-9861', 'name')");
  tab.run("hdEntraReregister('u-1013')");
  assert.match(tab.toasts.pop(), /KB-0065/, 'a failing choice is not enough');
  tab.run("hdVerify('HD-9861', 'badge')");
  tab.run("hdEntraReregister('u-1013')");
  assert.match(tab.toasts.pop(), /sets up a method again/);
  screen = tab.view('helpdesk/entra-admin');
  assert.match(screen, /No methods registered/);
  assert.match(screen, /data-hd-reregister-pending/);
  tab.run("hdEntraTab('audit')");
  assert.match(tab.view('helpdesk/entra-admin'), /TEST earlier entry[\s\S]*rmorgan<\/td><td>Admin required re-registration of multifactor authentication<\/td><td>Sam Rivera/);
  assert.deepEqual(actions(tab, 'HD-9861'), ['entra-mfa-reregister']);
  // After: a rule that waits for the methods screen.
  const early = cloud(); early.open('HD-9861'); early.run("hdVerify('HD-9861', 'badge'); hdEntraReregister('u-1013')");
  assert.equal(early.toasts.pop(), 'TEST read the methods first');
  // Fails closed: a ticket with no verification refuses it.
  const none = cloud(); none.open('HD-9862');
  none.run("hdEntraReregister('u-1013')");
  assert.match(none.toasts.pop(), /KB-0065/);
  assert.ok(none.run("hdState.practiceLog.some((e) => e.type === 'action_refused' && e.action === 'entra-mfa-reregister')"));
  // A ticket that doesn't allow it.
  const plain = cloud(); plain.open('HD-9864'); plain.run("hdEntraReregister('u-1003')");
  assert.match(plain.toasts.pop(), /doesn't allow an MFA change/);
  // SSPR: the directory account's value, and registering changes console A's check too.
  const mover = cloud(); mover.open('HD-9863'); mover.run("hdEntraOpenUser('u-1006')");
  assert.match(mover.view('helpdesk/entra-admin'), /data-hd-sspr>Not registered</);
  mover.run("hdEntraSsprRegister('u-1006')");
  assert.match(mover.view('helpdesk/entra-admin'), /data-hd-sspr>Registered</);
  assert.equal(mover.run("hdFileUser('u-1006').sspr"), 'Registered');
  assert.deepEqual(actions(mover, 'HD-9863'), ['entra-sspr-registered']);
}

// The phone writes Entra and Intune: Authenticator, enrolment, sign-in log.
function testPhoneSwapLoop() {
  const tab = cloud(); tab.open('HD-9861');
  tab.run("hdPhoneOpen('NS-PH-9801', 'authenticator')");
  assert.ok(tab.seen().includes('phone-app:NS-PH-9801:authenticator'));
  tab.run("hdPhoneAuthAdd('NS-PH-9801')");
  assert.match(tab.toasts.pop(), /already has a sign-in method/, 'not before re-registration');
  tab.run("hdVerify('HD-9861', 'badge'); hdEntraOpenUser('u-1013')");
  tab.view('helpdesk/entra-admin');
  tab.run("hdEntraReregister('u-1013'); hdPhoneAuthAdd('NS-PH-9801')");
  tab.run("hdEntraOpenUser('u-1013')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-method-device>NS-PH-9801</);
  tab.run("hdPhoneAuthTest('NS-PH-9801')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-auth-prompt/);
  tab.run("hdPhoneAuthApprove('NS-PH-9801'); hdEntraTab('signins')");
  const log = tab.view('helpdesk/entra-admin');
  assert.match(log, /data-status="Success"[\s\S]*Microsoft Authenticator[\s\S]*MFA required — not completed/, 'newest first: Success above the earlier failure');
  // Intune: the retired phone; the new one appears when Company Portal enrols it.
  let intune = tab.view('helpdesk/intune');
  assert.match(intune, /data-hd-intune-row="NS-PH-9802"[\s\S]*Retired/);
  assert.doesNotMatch(intune, /NS-PH-9801/);
  assert.doesNotMatch(intune, /TEST-personal/, 'a personal phone is never in Intune');
  // Outlook before enrolment is blocked by Conditional Access, and the log says so.
  tab.run("hdPhoneOpen('NS-PH-9801', 'outlook'); hdPhoneOutlookAdd('NS-PH-9801')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-outlook-blocked/);
  assert.match(tab.view('helpdesk/entra-admin'), /Conditional Access: device not compliant/);
  tab.run("hdPhoneEnrol('NS-PH-9801'); hdIntuneOpen('NS-PH-9801')");
  intune = tab.view('helpdesk/intune');
  assert.match(intune, /data-hd-intune-device="NS-PH-9801"[\s\S]*data-hd-ownership>Corporate[\s\S]*data-hd-os>17.6[\s\S]*data-hd-compliance>Compliant/);
  assert.ok(tab.seen().includes('intune-device:NS-PH-9801'));
  tab.run("hdPhoneOpen('NS-PH-9801', 'outlook')");
  let outlook = tab.view('helpdesk/phone');
  assert.match(outlook, /data-hd-outlook-inbox>Inbox up to date/);
  assert.match(outlook, /data-hd-phone-sync-calendar[^>]*>Off/);
  tab.run("hdPhoneOutlookSync('NS-PH-9801', 'calendar'); hdPhoneOutlookSync('NS-PH-9801', 'contacts')");
  outlook = tab.view('helpdesk/phone');
  assert.match(outlook, /data-hd-phone-sync-calendar[^>]*>On[\s\S]*data-hd-synced="calendar"[\s\S]*data-hd-phone-sync-contacts[^>]*>On[\s\S]*data-hd-synced="contacts"/);
  assert.deepEqual(actions(tab, 'HD-9861'), ['phone-auth-add-blocked', 'entra-mfa-reregister', 'phone-auth-added', 'phone-auth-test-sent', 'phone-auth-approved', 'phone-outlook-added', 'phone-cp-enrolled', 'phone-outlook-sync-calendar-on', 'phone-outlook-sync-contacts-on']);
}

// Bluetooth (on, find, PIN, test), OneDrive Wi-Fi only and the status bar.
function testBluetoothOneDriveStatus() {
  const tab = cloud(); tab.open('HD-9861');
  tab.run("hdPhoneOpen('NS-PH-9801', 'bluetooth')");
  let screen = tab.view('helpdesk/phone');
  assert.match(screen, /data-hd-data-used>3.6 GB of 5 GB used/);
  assert.doesNotMatch(screen, /data-hd-bt-scan/, 'no search with Bluetooth off');
  tab.run("hdPhoneBtToggle('NS-PH-9801'); hdPhoneBtScan('NS-PH-9801')");
  assert.match(tab.view('helpdesk/phone'), /No devices found/, 'not found until it is in pairing mode');
  assert.equal(tab.run("hdPhoneBtPair('NS-PH-9801', 'TEST-Headset', '0000')"), false);
  tab.run("hdPhoneBtPairingMode('NS-PH-9801', 'TEST-Headset'); hdPhoneBtAsk('NS-PH-9801', 'TEST-Headset')");
  screen = tab.view('helpdesk/phone');
  assert.match(screen, /data-hd-bt-device="TEST-Headset"[\s\S]*data-hd-bt-pin/);
  assert.equal(tab.run("hdPhoneBtPair('NS-PH-9801', 'TEST-Headset', '1234')"), false);
  assert.match(tab.toasts.pop(), /Check the PIN/);
  assert.equal(tab.run("hdPhoneBtPair('NS-PH-9801', 'TEST-Headset', '0000')"), true);
  tab.run("hdPhoneBtTest('NS-PH-9801')");
  screen = tab.view('helpdesk/phone');
  assert.match(screen, /TEST-Headset[\s\S]*Connected/);
  assert.match(screen, /data-hd-bt-tested>Test call: audio through TEST-Headset/);
  tab.run("hdPhoneOpen('NS-PH-9801', 'onedrive'); hdPhoneOneDrive('NS-PH-9801')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-wifi-only[^>]*>On/);
  assert.deepEqual(actions(tab, 'HD-9861'), ['phone-bt-on', 'phone-bt-scan', 'phone-bt-pairing-mode', 'phone-bt-pin-wrong', 'phone-bt-paired', 'phone-bt-tested', 'phone-onedrive-wifi-only-on']);
}

// Non-compliant phone: Check status alone keeps it blocked; the update then Check status fixes it.
function testComplianceAndUpdate() {
  const tab = cloud(); tab.open('HD-9864');
  tab.run("hdIntuneOpen('NS-PH-9803')");
  let device = tab.view('helpdesk/intune');
  assert.match(device, /data-hd-compliance>Not compliant[\s\S]*data-hd-failing>OS version below minimum[\s\S]*data-hd-grace>Yesterday[\s\S]*data-hd-enrolled>Yes/);
  assert.match(device, /data-hd-check="Minimum OS version \(17.5\)">[^<]*<span class="hd-badge bad">Fail[\s\S]*data-hd-check="Device PIN">[^<]*<span class="hd-badge ok">Pass/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'company-portal'); hdPhoneCheckStatus('NS-PH-9803')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-cp-status>Can't access company resources: OS version below minimum/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'outlook')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-outlook-blocked/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'teams')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-teams-blocked/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'update')");
  assert.match(tab.view('helpdesk/phone'), /Update 17.6 is available[\s\S]*data-hd-phone-install/);
  tab.run("hdPhoneUpdate('NS-PH-9803')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-current/);
  device = tab.view('helpdesk/intune');
  assert.match(device, /data-hd-compliance>Not compliant/, 'Intune changes only at the next check');
  tab.run("hdPhoneCheckStatus('NS-PH-9803')");
  device = tab.view('helpdesk/intune');
  assert.match(device, /data-hd-os>17.6[\s\S]*data-hd-compliance>Compliant/);
  assert.doesNotMatch(device, /data-hd-failing|data-hd-grace/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'outlook')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-outlook-inbox/);
  tab.run("hdPhoneOpen('NS-PH-9803', 'teams')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-teams-ok/);
}

// An enrolled device with no fixture state is the phone as the shift began:
// a later change on the phone counts only at the next Company Portal check.
function testComplianceIsASnapshot() {
  const tab = cloud(); tab.open('HD-9864');
  // NS-PH-9801 is not enrolled: nothing in Intune; enrolled, it is evaluated.
  tab.run("hdPhonePatch('NS-PH-9801', { pin: false })");
  assert.doesNotMatch(tab.view('helpdesk/intune'), /NS-PH-9801/);
  tab.run("hdPhoneEnrol('NS-PH-9801'); hdIntuneOpen('NS-PH-9801')");
  assert.match(tab.view('helpdesk/intune'), /data-hd-compliance>Not compliant[\s\S]*data-hd-failing>No device PIN/);
  tab.run("hdPhonePatch('NS-PH-9801', { pin: true })");
  assert.match(tab.view('helpdesk/intune'), /data-hd-compliance>Not compliant/, 'not until Check status');
  tab.run("hdPhoneCheckStatus('NS-PH-9801')");
  assert.match(tab.view('helpdesk/intune'), /data-hd-compliance>Compliant/);
}

// A personal phone: notifications off, so prompts are missed; turned on, approved.
function testPersonalPhoneNotifications() {
  const tab = cloud(); tab.open('HD-9864');
  tab.run("hdPhoneOpen('TEST-personal', 'company-portal')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-personal/);
  tab.run("hdPhoneOpen('TEST-personal', 'authenticator'); hdPhoneAuthTest('TEST-personal')");
  assert.match(tab.toasts.pop(), /No sign-in prompt/);
  tab.run("hdEntraOpenUser('u-1003'); hdEntraTab('signins')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-signin-reason>MFA: user did not respond to mobile app notification/);
  assert.ok(tab.seen().includes('entra-signins:u-1003'));
  tab.run("hdPhoneNotify('TEST-personal'); hdPhoneAuthTest('TEST-personal'); hdPhoneAuthApprove('TEST-personal')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-status="Success"/);
  assert.deepEqual(actions(tab, 'HD-9864'), ['phone-auth-test-missed', 'phone-notify-authenticator-on', 'phone-auth-test-sent', 'phone-auth-approved']);
  // Without Wi-Fi a phone doesn't download an update.
  const update = cloud(); update.open('HD-9864');
  update.run("hdCloudState().phones['NS-PH-9803'] = { status: { wifi: false } }; hdPhoneUpdate('NS-PH-9803')");
  assert.match(update.toasts.pop(), /Connect to Wi-Fi/);
  update.run("hdPhoneOpen('NS-PH-9803', 'wifi')");
  assert.match(update.view('helpdesk/phone'), /data-hd-phone-wifi[^>]*>Off/);
  update.run("hdPhoneWifi('NS-PH-9803'); hdPhoneUpdate('NS-PH-9803')");
  assert.deepEqual(actions(update, 'HD-9864'), ['phone-os-update-no-wifi', 'phone-wifi-on', 'phone-os-updated']);
}

// A reload keeps every change; another ticket opens with no sub-pane open.
function testReload() {
  const local = store();
  const tab = cloud(local); tab.open('HD-9861');
  approve(tab, 'HD-9861');
  tab.run("hdVerify('HD-9861', 'badge'); hdEntraOpenUser('u-1013')"); tab.view('helpdesk/entra-admin');
  tab.run("hdEntraReregister('u-1013'); hdPhoneAuthAdd('NS-PH-9801'); hdPhoneEnrol('NS-PH-9801'); hdPhoneOneDrive('NS-PH-9801'); hdM365MailboxAdd('test-support', 'u-1013', 'sendAs')");
  const again = cloud(local); again.open('HD-9861');
  again.run("hdEntraOpenUser('u-1013')");
  assert.match(again.view('helpdesk/entra-admin'), /data-hd-method-device>NS-PH-9801</);
  again.run("hdIntuneOpen('NS-PH-9801')");
  assert.match(again.view('helpdesk/intune'), /data-hd-compliance>Compliant/);
  again.run("hdPhoneOpen('NS-PH-9801', 'onedrive')");
  assert.match(again.view('helpdesk/phone'), /data-hd-phone-wifi-only[^>]*>On/);
  again.run("hdM365OpenMailbox('test-support')");
  assert.match(again.view('helpdesk/m365-admin'), /data-hd-send-as><li>Sam Rivera/);
  again.open('HD-9864');
  assert.equal(again.run('hdState.cloudView'), undefined, 'another ticket starts with nothing open');
}

// A Prove shift with a cloud block: the card in the Prove view, events recorded,
// neutral refusals and no teaching text.
function testProveShift() {
  const before = `(() => { const shift = HD_PROVE_SHIFTS['its-05'];
    shift.cloud = { entra: { users: { 'u-1020': { methods: [{ method: 'Microsoft Authenticator', device: 'TEST', registered: 'Last year' }], signIns: [] }, 'u-1001': { methods: [], signIns: [] } } },
      m365: { users: ['u-1020'], licenseGroups: { 'GG-TEST-Lic': { sku: 'TEST E3', formerMembers: ['u-1020'] } }, sharedMailboxes: { 'test-box': { address: 'b@northstar.example', fullAccess: [], sendAs: [] } } },
      phones: { 'test-own': { label: 'TEST own phone', user: 'u-1020', company: false, os: '17.6', status: { wifi: true } } },
      allow: { reregister: { 'u-1020': true } } }; })();`;
  const tab = sim({ url: proveUrl('its-05'), withTest: false, before });
  const id = tab.run('hdState.tickets[0].id');
  assert.match(tab.open(id), /data-hd-cloud-card[\s\S]*data-hd-cloud-open="m365"[\s\S]*data-hd-cloud-open="entra"/);
  tab.run("hdEntraOpenUser('u-1020')");
  const screen = tab.view('helpdesk/entra-admin');
  assert.doesNotMatch(screen, /KB-0065/, 'no teaching text in a Prove It');
  assert.ok(tab.run("hdState.prove.opened.includes('entra-methods:u-1020')"));
  tab.run("hdEntraReregister('u-1020')");
  assert.equal(tab.toasts.pop(), 'Done.');
  tab.run("hdEntraReregister('u-1001')");
  assert.equal(tab.toasts.pop(), "You don't have permission to make this change.");
  tab.run("hdM365MailboxAdd('test-box', 'u-1001', 'sendAs')");
  assert.equal(tab.toasts.pop(), "You don't have permission to make this change.");
  const events = json(tab, "hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => e.value)");
  assert.deepEqual(events, ['entra-mfa-reregister', 'entra-mfa-reregister-refused', 'm365-mailbox-add-refused']);
  tab.run("hdM365OpenMailbox('test-box')");
  assert.doesNotMatch(tab.view('helpdesk/m365-admin'), /owner's approval|up to an hour/);
  // No teaching text on the licence pane or a personal phone, and no direct-assign trap.
  tab.run("hdM365OpenUser('u-1020')");
  const licence = tab.view('helpdesk/m365-admin');
  assert.match(licence, /Assigned via group \(read-only\)/);
  assert.doesNotMatch(licence, /change the group's membership|data-hd-license-assign/);
  tab.run("hdPhoneOpen('test-own', 'company-portal')");
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-personal>Not enrolled\.</);
  assert.ok(tab.run("hdState.prove.opened.includes('phone-app:test-own:company-portal')"));
  // After submission nothing changes and nothing is recorded.
  const count = tab.run('hdState.prove.events.length');
  tab.run("hdProveServer.status = 'waiting'; hdEntraReregister('u-1020'); hdPhoneOpen('test-own', 'notifications'); hdPhoneNotify('test-own'); hdM365MailboxAdd('test-box', 'u-1020', 'sendAs')");
  assert.equal(tab.run('hdState.prove.events.length'), count);
  assert.equal(tab.run("JSON.stringify(hdCloudState().phones['test-own'] || null)"), 'null');
}

const tests = [testOldShiftsUnchanged, testCardOnlyWithBlock, testLicensesViaGroup, testSharedMailbox, testListsAndHealth, testEntraReregister,
  testPhoneSwapLoop, testBluetoothOneDriveStatus, testComplianceAndUpdate, testComplianceIsASnapshot, testPersonalPhoneNotifications, testReload, testProveShift];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok - ${test.name}`); } catch (error) { failed += 1; console.error(`not ok - ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m08-console-b: ${tests.length} passed`);

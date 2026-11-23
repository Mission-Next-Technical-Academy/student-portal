'use strict';
/* Help Desk simulator: the VM screen added for Module 4 (key its-02), console
 * part B (ui/helpdesk.js "VM screen"): the VM Manager on a simulated host,
 * Task Manager › Performance › CPU, the VM console's ping, snapshots, the
 * save of the student's VMs to the course page (mnt-vm-save / mnt-vm-state),
 * the portal's side of that save (portal/it-support-shared.js
 * itsCleanVmState, itsVmReceiveMessage, itsCleanCoachWork with a VM coach)
 * and the coach hookup for the two VM lab coaches (ui/helpdesk-coaches.js).
 *
 * The lab here is a test fixture ('test-vm', its own coach id, made-up host
 * and images), added to HD_VM_LABS in the test only. Synthetic data only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const PORTAL = 'https://academy.test';
const STUDENT = 'student-vmtest01';
const plain = (value) => JSON.parse(JSON.stringify(value));
const T0 = 9000000;

const LAB = {
  coaches: ['test-vm-coach'],
  host: { name: 'TEST-HOST', ramGb: 16, cores: 8, cpu: 'Test CPU 8-core', virtualization: 'Enabled' },
  images: [
    { id: 'client', label: 'Test Client OS (ISO)', kind: 'client', minRamGb: 4, os: 'Test Client OS' },
    { id: 'server', label: 'Test Server OS (ISO)', kind: 'server', minRamGb: 2, os: 'Test Server OS' },
  ],
  addresses: { internal: { 'TEST-SRV': '10.99.5.10', 'TEST-CLI': '10.99.5.20' }, nat: '10.0.2.15' },
  modes: { NAT: 'TEST nat line', Bridged: 'TEST bridged line', Internal: 'TEST internal line', 'Host-only': 'TEST host-only line' },
  targets: { 'TEST-CLI': { image: 'client', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic' } },
  shortcut: 'TEST notes',
  finishCards: [{ title: 'TEST card', text: 'TEST card text' }],
};

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function fakeOpener() {
  const sent = [];
  return { sent, closed: false, postMessage: (data, origin) => sent.push({ data: plain(data), origin }) };
}

// One simulator tab. Timers queue until the test runs them; messages reach
// the tab's listeners only when the test delivers them.
function sim({ coach = 'test-vm-coach', student = STUDENT, local = store(), session = store(), opener = null, extra = '', hash = '#/helpdesk/dashboard' } = {}) {
  const query = [coach ? `coach=${coach}` : '', student ? `student=${student}` : '', extra].filter(Boolean).join('&');
  const u = new URL(`${PORTAL}/sim/${query ? `?${query}` : ''}${hash}`);
  const byId = new Map();
  const toasts = [];
  const timers = [];
  const listeners = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: local, sessionStorage: session, opener,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout(id) { if (timers[id - 1]) timers[id - 1].fn = null; },
    setInterval: () => 0, clearInterval() {},
    addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); },
    removeEventListener: (type, fn) => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); },
    confirm: () => true, toast: (text) => toasts.push(text), render: () => {}, navigate: (h) => { ctx.location.hash = h; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
    __now: T0, __lab: LAB,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('helpdesk-data.js'), ctx, { filename: 'helpdesk-data.js' });
  vm.runInContext("HD_VM_LABS['test-vm'] = JSON.parse(JSON.stringify(__lab));", ctx);
  // hdNowMs is read through the global, so the test controls the clock.
  vm.runInContext(read('helpdesk.js').replace('function hdNowMs() { return Date.now(); }', 'function hdNowMs() { return __now; }'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  const tab = {
    ctx, toasts, local, session, run, input, timers,
    lastToast: () => toasts[toasts.length - 1] || '',
    state: () => plain(run('hdVmState()')),
    vm: (name) => plain(run(`hdVmByName(${j(name)})`)),
    view: (route) => run(`VIEWS[${j(route)}]()`),
    set: (field, value) => run(`hdVmFormSet(${j(field)}, ${j(value)})`),
    // Runs every queued timer (installs and the save delay).
    // Only timers up to maxMs (the reply timeout is longer than the rest).
    flush: (maxMs = Infinity) => { const due = (t) => t.fn && t.ms <= maxMs; while (timers.some(due)) timers.filter(due).forEach((t) => { const fn = t.fn; t.fn = null; if (fn) fn(); }); },
    advance: (ms) => { ctx.__now += ms; },
    deliver: (data) => listeners.slice().forEach((fn) => fn({ source: opener, origin: PORTAL, data })),
    console: (name, command) => { input('hd-vm-console-input', command); run(`hdVmRunConsole({ preventDefault() {} }, ${j(name)})`); return run(`hdVmConsoleLines[${j(name)}].slice(-1)[0].text`); },
  };
  return tab;
}

// Builds one VM through the form, the way the student does.
function build(tab, { name, image, memoryGb = 4, cores = 2, diskGb = 64, diskType = 'dynamic', network = 'NAT' }) {
  tab.run('hdVmNew()');
  tab.set('name', name); tab.set('image', image); tab.set('memoryGb', memoryGb); tab.set('cores', cores);
  tab.set('diskGb', diskGb); tab.set('diskType', diskType); tab.set('network', network);
  tab.run('hdVmCreate()');
  tab.run(`hdVmStart(${JSON.stringify(name)})`);
  tab.advance(5000);
  tab.flush();
}

/* ------------------------------------------------------------ off by default */

function testOffUnlessTheLabsCoachRuns() {
  for (const tab of [sim({ coach: '' }), sim({ coach: 'hd-m01' }), sim({ extra: 'practice=its-01' })]) {
    assert.equal(tab.run('HD_VM'), null);
    assert.match(tab.view('helpdesk/vm-manager'), /Not available in this shift/);
    assert.match(tab.view('helpdesk/task-manager'), /Not available in this shift/);
    assert.doesNotMatch(tab.view('helpdesk/dashboard'), /data-hd-vm/);
    assert.equal(tab.run('hdVmSummary()'), null);
    assert.ok(![...tab.local.map.keys()].some((k) => k.includes('.vm.')), 'nothing saved');
  }
  // An older module's ticket screens are untouched.
  const old = sim({ coach: '' });
  old.run("hdSelectTicket(hdState.tickets[0].id)");
  assert.doesNotMatch(old.view('helpdesk/ticket'), /data-hd-vm|VM Manager|Task Manager/);
  const on = sim();
  assert.equal(on.run('HD_VM.key'), 'test-vm');
  assert.match(on.view('helpdesk/dashboard'), /data-hd-vm-card/);
  // The lab's coach on a reload, from the saved coach state.
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'test-vm-coach', step: 2 })]]);
  const reload = sim({ coach: '', student: '', session: store([...session.map, ['defender-lab.helpdesk.vm.student', STUDENT]]) });
  assert.equal(reload.run('HD_VM.key'), 'test-vm');
  assert.equal(reload.run('HD_VM.student'), STUDENT, 'the student id survives the address clean-up');
}

/* ------------------------------------------------------------ the client VM */

function testBuildTheClientVm() {
  const tab = sim();
  assert.deepEqual(tab.state().vms, [], 'VMs are the student\'s own, never seeded');
  // Task Manager › Performance › CPU on the host.
  assert.doesNotMatch(tab.view('helpdesk/task-manager'), /Virtualization/);
  tab.run("hdVmTaskTab('performance')");
  assert.equal(tab.state().cpuSeen, false);
  tab.run("hdVmTaskTab('cpu')");
  assert.equal(tab.state().cpuSeen, true);
  const cpu = tab.view('helpdesk/task-manager');
  assert.match(cpu, /data-hd-task-cpu/); assert.match(cpu, /<dd>8<\/dd>/); assert.match(cpu, /<strong>Enabled<\/strong>/); assert.match(cpu, /16 GB installed/);

  tab.run('hdVmNew()');
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-form/);
  tab.set('name', 'TEST-CLI'); tab.set('image', 'client');
  tab.set('memoryGb', 1);
  let html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-warning="memory"/);
  assert.match(html, /needs at least 4 GB/);
  assert.equal(tab.state().form.lowRamSeen, true);
  // A setting that is off is named (the lab's targets).
  assert.match(html, /data-hd-vm-hints="3"/);
  assert.match(html, /Memory is 1 GB: this lab asks for 4 GB/);
  assert.match(html, /CPU cores: 1; this lab asks for 2/);
  assert.match(html, /Disk size is 32 GB: this lab asks for 64 GB/);
  tab.set('memoryGb', 4); tab.set('cores', 2);
  html = tab.view('helpdesk/vm-manager');
  assert.doesNotMatch(html, /data-hd-vm-warning/);
  assert.match(html, /data-hd-vm-ram="12"/, 'the host bar shows 12 GB left');
  assert.equal(tab.state().form.lowRamSeen, true, 'the warning stays seen');
  tab.set('memoryGb', 99);
  assert.equal(tab.state().form.memoryGb, 4, 'more than the host has is refused');
  tab.set('diskGb', 64); tab.set('diskType', 'dynamic');
  // Each mode's diagram, without choosing it.
  ['NAT', 'Bridged', 'Internal', 'Host-only'].forEach((mode) => {
    tab.run(`hdVmViewMode('${mode}')`);
    assert.match(tab.view('helpdesk/vm-manager'), new RegExp(`data-hd-vm-diagram="${mode}"`));
  });
  assert.deepEqual(tab.state().modesViewed, ['NAT', 'Bridged', 'Internal', 'Host-only']);
  assert.equal(tab.state().form.network, '', 'looking is not choosing');
  assert.doesNotMatch(tab.view('helpdesk/vm-manager'), /data-hd-vm-hints/, 'every setting matches');
  tab.run('hdVmCreate()');
  assert.match(tab.lastToast(), /network mode/);
  tab.set('network', 'NAT');
  tab.run('hdVmCreate()');
  const created = tab.vm('TEST-CLI');
  assert.equal(tab.state().form, null);
  assert.deepEqual([created.image, created.memoryGb, created.cores, created.diskGb, created.diskType, created.network, created.state, created.installed], ['client', 4, 2, 64, 'dynamic', 'NAT', 'Off', false]);
  // A second VM with the same name is refused.
  tab.run('hdVmNew()'); tab.set('name', 'test-cli'); tab.set('image', 'client'); tab.set('diskType', 'fixed'); tab.set('network', 'NAT');
  tab.run('hdVmCreate()');
  assert.match(tab.lastToast(), /already exists/);
  tab.run('hdVmCancelNew()');

  tab.run("hdVmStart('TEST-CLI')");
  assert.equal(tab.vm('TEST-CLI').state, 'Installing');
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-screen="installing"/);
  tab.advance(5000); tab.flush();
  assert.equal(tab.vm('TEST-CLI').state, 'Running');
  assert.equal(tab.vm('TEST-CLI').installed, true);
  html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-screen="running"/);
  assert.match(html, /data-hd-vm-shortcut="present"/);
  assert.match(html, /data-hd-vm-finish/); assert.match(html, /TEST card text/);
  // An install whose time ran out while the tab was closed is done on load.
  const local = store();
  const first = sim({ local });
  first.run('hdVmNew()'); first.set('name', 'TEST-CLI'); first.set('image', 'client'); first.set('memoryGb', 4); first.set('diskType', 'dynamic'); first.set('network', 'NAT');
  first.run('hdVmCreate()'); first.run("hdVmStart('TEST-CLI')");
  const later = sim({ local });
  later.ctx.__now = T0 + 60000;
  assert.equal(later.vm('TEST-CLI').installed, true);
  // Off: memory changes; running: it doesn't.
  tab.run("hdVmSet('TEST-CLI', 'memoryGb', 6)");
  assert.equal(tab.vm('TEST-CLI').memoryGb, 4); assert.match(tab.lastToast(), /Power off/);
  tab.run("hdVmPowerOff('TEST-CLI')"); tab.run("hdVmSet('TEST-CLI', 'memoryGb', 6)");
  assert.equal(tab.vm('TEST-CLI').memoryGb, 6);
  tab.run("hdVmStart('TEST-CLI')");
  assert.equal(tab.vm('TEST-CLI').state, 'Running', 'an installed VM starts at once');
}

/* ------------------------------------------- snapshot, the server and ping */

function testSnapshotServerAndPing() {
  const tab = sim();
  build(tab, { name: 'TEST-CLI', image: 'client' });
  tab.run("hdVmSnapshot('TEST-CLI', 'Before-change')");
  assert.deepEqual(tab.vm('TEST-CLI').snapshots.map((s) => [s.name, s.shortcut]), [['Before-change', true]]);
  tab.run("hdVmDeleteShortcut('TEST-CLI')");
  assert.equal(tab.vm('TEST-CLI').shortcut, false);
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-shortcut="gone"/);
  tab.run("hdVmRestore('TEST-CLI', 0)");
  assert.equal(tab.vm('TEST-CLI').shortcut, true);
  assert.equal(tab.vm('TEST-CLI').restored, 1);
  assert.equal(tab.vm('TEST-CLI').shortcutDeleted, true);

  build(tab, { name: 'TEST-SRV', image: 'server' });
  tab.run("hdVmSelect('TEST-SRV')");
  const html = tab.view('helpdesk/vm-manager');
  assert.match(html, /data-hd-vm-server-manager/, 'Server Manager opens on the server');
  assert.match(html, /data-hd-vm-ram="8"/, 'two 4 GB guests leave 8 GB');

  // NAT: guests never reach each other.
  assert.match(tab.console('TEST-CLI', 'ping 10.99.5.10'), /Request timed out[\s\S]*Lost = 4/);
  tab.run("hdVmSet('TEST-CLI', 'network', 'Internal')");
  assert.match(tab.console('TEST-CLI', 'ping 10.99.5.10'), /Request timed out/, 'one on Internal, one on NAT');
  tab.run("hdVmSet('TEST-SRV', 'network', 'Internal')");
  const there = tab.console('TEST-CLI', 'ping 10.99.5.10');
  assert.equal((there.match(/Reply from 10\.99\.5\.10/g) || []).length, 4, 'four replies');
  const back = tab.console('TEST-SRV', 'ping 10.99.5.20');
  assert.equal((back.match(/Reply from 10\.99\.5\.20/g) || []).length, 4, 'four replies back');
  assert.match(tab.console('TEST-CLI', 'ipconfig'), /10\.99\.5\.20/);
  tab.run("hdVmSet('TEST-CLI', 'network', 'NAT')");
  assert.match(tab.console('TEST-CLI', 'ping 10.99.5.10'), /Request timed out/);
  assert.match(tab.console('TEST-CLI', 'ipconfig'), /10\.0\.2\.15/);
  tab.run("hdVmSet('TEST-CLI', 'network', 'Internal')");
  assert.match(tab.console('TEST-CLI', 'ping 10.99.5.10'), /Reply from/);
  // A powered-off server answers nothing.
  tab.run("hdVmPowerOff('TEST-SRV')");
  assert.match(tab.console('TEST-CLI', 'ping 10.99.5.10'), /Request timed out/);
  assert.match(tab.console('TEST-SRV', 'ping 10.99.5.20'), /isn’t running/);
  assert.match(tab.console('TEST-CLI', 'Remove-Item C:\\x'), /isn’t supported in this training console/);
  const pings = tab.vm('TEST-CLI').pings.map((p) => [p.to, p.ok, p.mode]);
  assert.deepEqual(pings, [['10.99.5.10', false, 'NAT'], ['10.99.5.10', false, 'Internal'], ['10.99.5.10', true, 'Internal'], ['10.99.5.10', false, 'NAT'], ['10.99.5.10', true, 'Internal'], ['10.99.5.10', false, 'Internal']]);
  assert.deepEqual(tab.vm('TEST-SRV').pings.map((p) => p.ok), [true]);
  // Delete and the host gets its memory back.
  tab.run("hdVmDelete('TEST-SRV')");
  assert.equal(tab.vm('TEST-SRV'), null);
  assert.equal(tab.run('hdVmRamLeft()'), 12);
}

/* ------------------------------------------------------------ the save */

function testSaveWaitsForTheFirstAnswerAndSendsTheSummaryOnly() {
  const opener = fakeOpener();
  const tab = sim({ opener });
  assert.equal(opener.sent.length, 1);
  const ask = opener.sent[0];
  assert.equal(ask.data.type, 'mnt-vm-state'); assert.equal(ask.data.id, 'test-vm'); assert.equal(ask.data.student, STUDENT); assert.equal(ask.origin, PORTAL);
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-save="asking"/);
  // A change before the answer is saved here, but not sent.
  tab.run('hdVmNew()');
  tab.flush(1000);
  assert.equal(opener.sent.length, 1, 'nothing is sent before the first answer');
  // The server has the VMs from another sign-in: they win.
  const server = { version: 1, lab: 'test-vm', vms: [{ name: 'TEST-CLI', image: 'client', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic', network: 'NAT', state: 'Running', installed: true, shortcut: true, snapshots: [{ name: 'Before-change', shortcut: true, at: '' }], pings: [] }], form: null, selected: 'TEST-CLI', modesViewed: ['NAT'], cpuSeen: true, savedAt: '2026-08-19T09:00:00.000Z' };
  tab.deliver({ type: 'mnt-vm-state-reply', id: 'test-vm', nonce: 'wrong', saved: true, state: { version: 1, vms: [] } });
  assert.equal(tab.state().form !== null, true, 'a reply to another request is ignored');
  tab.deliver({ type: 'mnt-vm-state-reply', id: 'test-vm', nonce: ask.data.nonce, saved: true, state: server });
  assert.deepEqual(tab.state().vms.map((v) => v.name), ['TEST-CLI']);
  assert.equal(tab.state().form, null);
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-save="saved"/);
  assert.equal(JSON.parse(tab.local.getItem(`defender-lab.helpdesk.vm.v1.test-vm.${STUDENT}`)).vms[0].name, 'TEST-CLI');

  // The next change is sent after the pause, as the VM summary only.
  tab.run("hdVmSnapshot('TEST-CLI', 'Second')");
  assert.equal(opener.sent.length, 1);
  tab.flush(1000);
  assert.equal(opener.sent.length, 2);
  const save = opener.sent[1].data;
  assert.equal(save.type, 'mnt-vm-save'); assert.equal(save.student, STUDENT);
  assert.deepEqual(Object.keys(save).sort(), ['id', 'nonce', 'state', 'student', 'type']);
  assert.deepEqual(Object.keys(save.state).sort(), ['cpuSeen', 'form', 'lab', 'modesViewed', 'savedAt', 'selected', 'version', 'viewMode', 'vms']);
  assert.ok(!JSON.stringify(save).includes('tickets'), 'no ticket data');
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-save="saving"/);
  tab.deliver({ type: 'mnt-vm-received', id: 'test-vm', nonce: save.nonce, saved: true });
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-save="saved"/);
  assert.equal(tab.local.getItem(`defender-lab.helpdesk.vm.v1.test-vm.${STUDENT}.unsynced`), null);
  // A refused save keeps the VMs here and says why.
  tab.run("hdVmSnapshot('TEST-CLI', 'Third')"); tab.flush(1000);
  const third = opener.sent[2].data;
  tab.deliver({ type: 'mnt-vm-received', id: 'test-vm', nonce: third.nonce, saved: false, reason: 'signed-out' });
  assert.match(tab.view('helpdesk/vm-manager'), /data-hd-vm-save="signed-out"/);
  assert.ok(tab.local.getItem(`defender-lab.helpdesk.vm.v1.test-vm.${STUDENT}.unsynced`));
}

function testANewerUnconfirmedSaveInThisBrowserBeatsTheServer() {
  const local = store();
  const first = sim({ local });
  build(first, { name: 'TEST-CLI', image: 'client' });
  first.run("hdVmSnapshot('TEST-CLI', 'Mine')");
  assert.ok(local.getItem(`defender-lab.helpdesk.vm.v1.test-vm.${STUDENT}.unsynced`), 'never confirmed');
  const opener = fakeOpener();
  const tab = sim({ local, opener });
  tab.deliver({ type: 'mnt-vm-state-reply', id: 'test-vm', nonce: opener.sent[0].data.nonce, saved: true, state: { version: 1, lab: 'test-vm', vms: [], savedAt: '2020-01-01T00:00:00.000Z' } });
  assert.deepEqual(tab.state().vms.map((v) => v.name), ['TEST-CLI'], 'kept');
  tab.flush(1000);
  assert.equal(opener.sent[1].data.type, 'mnt-vm-save', 'and sent again');
  assert.equal(opener.sent[1].data.state.vms[0].snapshots[0].name, 'Mine');
}

function testANewSignInGetsTheServerCopy() {
  // Sign-out deleted this browser's copy: the tab starts empty and the server's VMs come back.
  const opener = fakeOpener();
  const tab = sim({ opener });
  const server = { version: 1, lab: 'test-vm', vms: [{ name: 'TEST-CLI', image: 'client', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic', network: 'NAT', state: 'Running', installed: true }], savedAt: '2026-08-19T09:00:00.000Z' };
  tab.deliver({ type: 'mnt-vm-state-reply', id: 'test-vm', nonce: opener.sent[0].data.nonce, saved: true, state: server });
  assert.equal(tab.vm('TEST-CLI').installed, true);
  // No server copy and no work: nothing to send.
  const empty = fakeOpener();
  const fresh = sim({ opener: empty });
  fresh.deliver({ type: 'mnt-vm-state-reply', id: 'test-vm', nonce: empty.sent[0].data.nonce, saved: true, state: null });
  fresh.flush();
  assert.equal(empty.sent.length, 1);
  // No course page: one line, and the VMs still work in this browser.
  const alone = sim();
  assert.match(alone.view('helpdesk/vm-manager'), /Open this lab from the course page to save your VMs/);
  build(alone, { name: 'TEST-CLI', image: 'client' });
  assert.equal(alone.vm('TEST-CLI').installed, true);
  // The course page never answers: the tab stops waiting.
  const silent = fakeOpener();
  const waiting = sim({ opener: silent });
  waiting.flush();
  assert.match(waiting.view('helpdesk/vm-manager'), /didn’t confirm/);
  // A malformed saved copy in this browser is dropped, not trusted.
  const bad = store([[`defender-lab.helpdesk.vm.v1.test-vm.${STUDENT}`, JSON.stringify({ version: 1, lab: 'test-vm', vms: [{ name: '<script>' }, { name: 'OK-1', memoryGb: 999, network: 'Wormhole' }] })]]);
  const cleaned = sim({ local: bad });
  assert.deepEqual(cleaned.state().vms.map((v) => [v.name, v.memoryGb, v.network]), [['OK-1', 1, 'NAT']]);
}

/* ------------------------------------------------------------ the portal */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const USER = { userId: 'u-vm-1', trackCode: 'HDESK', email: 'vm.student@example.test' };
const SIM = prun('new URL(SIM_ORIGIN).origin');

function testPortalCleanerRefusesBadState() {
  const clean = prun('itsCleanVmState');
  const good = { version: 1, lab: 'its-02', vms: [{ name: 'TEST-CLI', image: 'client', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic', network: 'Internal', state: 'Running', installed: true, shortcut: true, snapshots: [{ name: 'Before-change', shortcut: true, at: 'x' }], pings: [{ to: '10.99.5.10', ok: true, mode: 'Internal' }], extra: 'dropped' }], form: null, selected: 'TEST-CLI', modesViewed: ['NAT', 'Nope'], cpuSeen: true, savedAt: 's', tickets: [{ id: 'HD-0001' }] };
  const kept = plain(clean(good));
  assert.equal(kept.vms[0].network, 'Internal');
  assert.equal(kept.vms[0].extra, undefined);
  assert.equal(kept.tickets, undefined, 'only VM fields');
  assert.deepEqual(kept.modesViewed, ['NAT']);
  assert.equal(clean(null), null);
  assert.equal(clean({ version: 2, vms: [] }), null);
  assert.equal(clean({ version: 1, vms: 'x' }), null);
  assert.equal(clean({ version: 1, vms: [{ name: 'bad name!' }] }), null);
  assert.equal(clean({ version: 1, vms: [{ name: 'A' }, { name: 'a' }] }), null, 'duplicate names');
  assert.equal(clean({ version: 1, vms: [1, 2, 3, 4, 5].map((n) => ({ name: `VM-${n}` })) }), null, 'more than four VMs');
  assert.equal(clean({ ...good, padding: 'x'.repeat(9000) }), null, 'oversized');
  // The coach work: a VM coach keeps the summary with no tickets.
  const work = { version: 1, tickets: [], vm: good };
  assert.equal(prun('itsCleanCoachWork')(work), null, 'no coach id: unchanged');
  assert.equal(prun('itsCleanCoachWork')(work, 'hd-m10'), null, 'another coach: unchanged');
  const vmWork = plain(prun('itsCleanCoachWork')(work, 'hd-m02-vm'));
  assert.deepEqual(vmWork.tickets, []); assert.equal(vmWork.vm.vms[0].name, 'TEST-CLI');
  const withTicket = plain(prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-9901', status: 'Resolved' }], vm: good }, 'hd-m02-server'));
  assert.equal(withTicket.tickets[0].id, 'HD-9901'); assert.equal(withTicket.vm.vms.length, 1);
  assert.equal(plain(prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-9901' }], vm: good })).vm, undefined, 'other callers never keep a VM');
  assert.equal(plain(prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-9901' }], vm: { bad: true } }, 'hd-m02-server')).vm, undefined);
}

async function testPortalSavesAndHandsBack() {
  const writes = [];
  let ok = true;
  portal.__user = USER;
  prun('currentUser = async () => __user');
  portal.__persist = async (user, moduleKey, labId, state) => { writes.push(plain({ moduleKey, labId, state })); return ok; };
  prun('persistModuleCaseState = (...args) => __persist(...args)');
  const student = prun('LabRuntime.anonymousStudentId(__user)');
  const replies = [];
  const source = { postMessage: (data, origin) => replies.push({ data: plain(data), origin }) };
  const send = (data, origin = SIM) => prun('itsVmReceiveMessage')({ data, origin, source }, { moduleKey: 'its-02', stateId: 'its02-vm-state-v1' });
  const state = { version: 1, lab: 'its-02', vms: [{ name: 'TEST-CLI', image: 'client', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic', network: 'NAT', state: 'Running', installed: true }], savedAt: 'a' };

  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n1', student, state });
  assert.deepEqual(replies.pop(), { data: { type: 'mnt-vm-received', id: 'its-02', nonce: 'n1', saved: true }, origin: SIM });
  assert.equal(writes.length, 1);
  assert.deepEqual([writes[0].moduleKey, writes[0].labId, writes[0].state.vm.vms[0].name], ['its-02', 'its02-vm-state-v1', 'TEST-CLI']);
  // Handed back at launch, from the account's copy.
  USER.remoteCaseState = { 'its-02': { 'its02-vm-state-v1': writes[0].state, 'its02-lab-state-v1': { consoleStarted: true } } };
  await send({ type: 'mnt-vm-state', id: 'its-02', nonce: 'n2', student });
  const back = replies.pop().data;
  assert.equal(back.type, 'mnt-vm-state-reply'); assert.equal(back.nonce, 'n2'); assert.equal(back.state.vms[0].name, 'TEST-CLI');
  assert.equal(USER.remoteCaseState['its-02']['its02-lab-state-v1'].consoleStarted, true, 'the page\'s own state is untouched');
  // Refused: malformed, oversized, another student, signed out, a failed write, the wrong origin or module.
  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n3', student, state: { version: 1, vms: 'x' } });
  assert.deepEqual([replies[replies.length - 1].data.saved, replies.pop().data.reason], [false, 'invalid']);
  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n4', student, state: { ...state, pad: 'x'.repeat(9000) } });
  assert.equal(replies.pop().data.reason, 'invalid');
  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n5', student: 'student-other', state });
  assert.equal(replies.pop().data.reason, 'other-student');
  ok = false;
  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n6', student, state });
  assert.deepEqual(replies.pop().data, { type: 'mnt-vm-received', id: 'its-02', nonce: 'n6', saved: false, reason: 'unconfirmed' });
  portal.__user = null;
  await send({ type: 'mnt-vm-state', id: 'its-02', nonce: 'n7', student });
  assert.equal(replies.pop().data.reason, 'signed-out');
  const count = replies.length;
  await send({ type: 'mnt-vm-save', id: 'its-02', nonce: 'n8', student, state }, 'https://evil.test');
  await send({ type: 'mnt-vm-save', id: 'its-11', nonce: 'n9', student, state });
  assert.equal(replies.length, count, 'ignored');
}

/* ------------------------------------------------------------ the coaches */

function testTheCoachHookupCoversTheVmCoaches() {
  const tab = sim({ coach: 'hd-m02-vm' });
  vm.runInContext(read('coach-data.js'), tab.ctx, { filename: 'coach-data.js' });
  // The two VM coaches, as stubs when their content isn't built yet.
  tab.run("['hd-m02-vm', 'hd-m02-server'].forEach((id) => { if (!MODULE_COACHES.some((c) => c.id === id)) MODULE_COACHES.push({ id, steps: [] }); });");
  vm.runInContext(read('helpdesk-coaches.js'), tab.ctx, { filename: 'helpdesk-coaches.js' });
  const ids = ['hd-m01', 'hd-m02', 'hd-m03', 'hd-m04', 'hd-m05', 'hd-m06', 'hd-m07', 'hd-m08', 'hd-m09', 'hd-m10', 'hd-m11', 'hd-m02-vm', 'hd-m02-server'];
  ids.forEach((id) => {
    const coach = tab.run(`MODULE_COACHES.find((c) => c.id === ${JSON.stringify(id)})`);
    assert.ok(coach, id);
    assert.equal(typeof coach.collectWork, 'function', `${id} collects work`);
    assert.equal(coach.resumeAcrossLaunches, true, `${id} resumes`);
  });
  // Lab 4.1's coach: no tickets, and the VM summary when its lab runs.
  const work = plain(tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m02-vm').collectWork()"));
  assert.deepEqual(work.tickets, []);
  if (tab.run('HD_VM') && tab.run('HD_VM.lab.coaches.includes("hd-m02-vm")')) assert.ok(work.vm && Array.isArray(work.vm.vms));
  // An older coach sends no VM.
  assert.equal(plain(tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m01').collectWork()")).vm, undefined);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /tests\/hdesk-m04-vm-screen\.test\.js/);
}

(async () => {
  testOffUnlessTheLabsCoachRuns();
  testBuildTheClientVm();
  testSnapshotServerAndPing();
  testSaveWaitsForTheFirstAnswerAndSendsTheSummaryOnly();
  testANewerUnconfirmedSaveInThisBrowserBeatsTheServer();
  testANewSignInGetsTheServerCopy();
  testPortalCleanerRefusesBadState();
  await testPortalSavesAndHandsBack();
  testTheCoachHookupCoversTheVmCoaches();
  testCiRunsThisFile();
  console.log('hdesk-m04-vm-screen tests passed');
})().catch((error) => { console.error(error); process.exit(1); });

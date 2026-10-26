// Coach labs in the simulator (ui/coach.js) survive a reload, and Help Desk
// coach labs also survive a relaunch from the portal:
//
//   - The portal launches with ?coach=<id>&restart=1 (Help Desk adds
//     &student=<anonymous id>). Both launch parameters leave the address bar
//     on the first load, so a reload resumes instead of starting over.
//   - Help Desk coaches keep one in-progress record in localStorage. A
//     relaunch by the same student resumes it; a different student, a
//     different coach, a finished lab or "Reset shift" starts fresh.
//   - A Help Desk Finish ends the lab only when the portal confirms it saved
//     the work; otherwise the work and the last step stay.
//   - SOC Module 1's m01 coach: a reload keeps its filter and step, a portal
//     launch still starts fresh, and its Finish message is unchanged.
//
// Loads the simulator scripts in ui/index.html's order into a Node vm, with
// a small fake DOM. Each sim() call is one browser tab; tabs share
// localStorage (same browser) and get their own sessionStorage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;

const store = (initial) => {
  const map = new Map(initial || []);
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

function element(id) {
  const classes = new Set();
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {},
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c),
      toggle: (c, on) => { if (on === undefined ? !classes.has(c) : on) classes.add(c); else classes.delete(c); },
    },
    listeners,
    addEventListener: (type, fn) => { listeners[type] = fn; },
    querySelector: () => element(''),
    querySelectorAll: () => [],
    setAttribute() {},
    focus() {},
  };
}

// One browser tab. `local` is the browser's localStorage, shared by tabs.
function sim(url, { local, session, opener = null, pathChecked = false } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const messageListeners = new Set();
  const timers = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null,
    createElement: () => element(''),
    querySelector: () => null,
    querySelectorAll: (sel) => (pathChecked && sel === '.hd-path input:checked' ? [{}] : []),
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location, document,
    history: { state: null, replaceState: (s, t, next) => {
      const n = new URL(next, u.origin);
      location.pathname = n.pathname; location.search = n.search; location.hash = n.hash;
    } },
    localStorage: local, sessionStorage: session || store(),
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: (id) => { timers[id - 1] = null; },
    setInterval: () => 0, clearInterval: () => {},
    opener,
    closed: false,
    close() { ctx.closed = true; },
    focus() {},
    confirm: () => true,
    addEventListener: (type, fn) => { if (type === 'message') messageListeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') messageListeners.delete(fn); },
    toast: (text) => toasts.push(text),
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s),
    // Every route has a view (coach.js stops on a missing one).
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    // app.js registries helpdesk.js adds itself to.
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash;
    ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  loaded.forEach((fn) => fn());

  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  return {
    ctx, location, toasts,
    run: (code) => vm.runInContext(code, ctx),
    hd: () => vm.runInContext('hdState', ctx),
    coachState: () => JSON.parse(ctx.sessionStorage.getItem('mnt.coach.state') || 'null'),
    resume: () => JSON.parse(local.getItem('mnt.coach.resume') || 'null'),
    panelHtml: () => panel().innerHTML,
    next: () => click('next'),
    finish: () => click('finish'),
    runTimers: () => { while (timers.some(Boolean)) { const i = timers.findIndex(Boolean); const fn = timers[i]; timers[i] = null; fn(); } },
    reply: (data, origin = PORTAL, source = opener) => [...messageListeners].forEach((fn) => fn({ data, origin, source })),
    reload: (opts = {}) => sim(location.origin + location.pathname + location.search + location.hash, { local, session: ctx.sessionStorage, opener, ...opts }),
  };
}

const STUDENT_A = 'student-aaaa1111';
const STUDENT_B = 'student-bbbb2222';
const launchUrl = (coach, student = STUDENT_A) => `${SIM_URL}?coach=${coach}&restart=1&student=${student}#/helpdesk/tickets`;
const ticket = (tab, id) => tab.hd().tickets.find((t) => t.id === id);
// Copied out of the vm, so deepEqual compares values, not array prototypes.
const ticketIds = (tab) => Array.from(tab.hd().tickets, (t) => t.id);
function fakeOpener() {
  const sent = [];
  return { sent, closed: false, focus() {}, postMessage: (data, origin) => sent.push({ data: JSON.parse(JSON.stringify(data)), origin }) };
}

// hd-m03 (one ticket, HD-2109): open the ticket and read the evidence — the
// student is then on step 3, working the troubleshooting path.
function workHdM03ToPath(tab) {
  tab.run(`hdState.selectedTicketId = 'HD-2109'`);
  tab.next();                                   // opened the ticket
  tab.next();                                   // read the evidence
  return tab;
}

/* ------------------------------------------------------------ Help Desk */

function testFirstLaunchStartsFreshAndCleansAddress() {
  const local = store();
  // A previous coach's leftover tickets and a note in the shared save.
  const before = sim(launchUrl('hd-m01'), { local });
  before.run(`hdState.tickets[0].notes.push({ author: 'x', time: 't', text: 'old note' }); hdSave();`);

  const tab = sim(launchUrl('hd-m03'), { local });
  assert.deepEqual(ticketIds(tab), ['HD-2109'], 'reset to this coach\'s tickets');
  assert.equal(tab.coachState().step, 0);
  assert.equal(tab.location.search, '?coach=hd-m03', 'restart and student leave the address bar');
  assert.equal(tab.location.hash, '#/helpdesk/tickets');
  assert.deepEqual(tab.resume(), { id: 'hd-m03', step: 0, student: STUDENT_A });
}

function testReloadKeepsWork() {
  const local = store();
  const tab = workHdM03ToPath(sim(launchUrl('hd-m03'), { local }));
  tab.run(`hdState.tickets[0].notes.push({ author: 'me', time: 'now', text: 'Temp profile loaded' }); hdSave();`);
  assert.equal(tab.coachState().step, 2);

  const reloaded = tab.reload();
  assert.equal(reloaded.coachState().step, 2, 'same step after reload');
  assert.equal(ticket(reloaded, 'HD-2109').notes.at(-1).text, 'Temp profile loaded', 'work note kept');
  assert.equal(reloaded.hd().selectedTicketId, 'HD-2109');
}

function testRelaunchSameStudentResumes() {
  const local = store();
  const tab = workHdM03ToPath(sim(launchUrl('hd-m03'), { local }));
  tab.run(`hdState.tickets[0].notes.push({ author: 'me', time: 'now', text: 'kept across launches' }); hdSave();`);
  tab.location.hash = '#/helpdesk/ticket';

  // The portal opens a new tab: empty sessionStorage, the launch link again.
  const relaunched = sim(launchUrl('hd-m03'), { local });
  assert.equal(relaunched.coachState().step, 2, 'resumes at the saved step');
  assert.equal(relaunched.location.hash, '#/helpdesk/ticket', 'on the page that step lives on');
  assert.equal(ticket(relaunched, 'HD-2109').notes.at(-1).text, 'kept across launches');
  assert.equal(relaunched.location.search, '?coach=hd-m03');
}

function testRelaunchDifferentStudentStartsFresh() {
  const local = store();
  const tab = workHdM03ToPath(sim(launchUrl('hd-m03'), { local }));
  tab.run(`hdState.tickets[0].notes.push({ author: 'A', time: 'now', text: 'student A note' }); hdSave();`);

  const other = sim(launchUrl('hd-m03', STUDENT_B), { local });
  assert.equal(other.coachState().step, 0, 'another student starts at step 1');
  assert.equal(ticket(other, 'HD-2109').notes.length, 0, 'student A\'s note is gone');
  assert.equal(other.resume().student, STUDENT_B);

  const noStudent = sim(`${SIM_URL}?coach=hd-m03&restart=1#/helpdesk/tickets`, { local });
  assert.equal(noStudent.coachState().step, 0, 'a launch without a student never resumes');
}

function testOtherCoachInBetweenStartsFresh() {
  const local = store();
  workHdM03ToPath(sim(launchUrl('hd-m03'), { local }));
  sim(launchUrl('hd-m04'), { local });
  const back = sim(launchUrl('hd-m03'), { local });
  assert.equal(back.coachState().step, 0);
  assert.deepEqual(ticketIds(back), ['HD-2109']);
}

function testResetShiftForgetsProgress() {
  const local = store();
  const tab = workHdM03ToPath(sim(launchUrl('hd-m03'), { local }));
  tab.run('hdResetShift()');
  assert.equal(tab.resume(), null, 'in-progress record cleared');
  assert.equal(tab.coachState(), null, 'running coach stopped');

  const relaunched = sim(launchUrl('hd-m03'), { local });
  assert.equal(relaunched.coachState().step, 0, 'relaunch starts fresh');
  assert.deepEqual(ticketIds(relaunched), ['HD-2109']);
}

// Gets hd-m03 to its last step by restoring that step from the record.
function hdM03AtFinish(local, opener) {
  sim(launchUrl('hd-m03'), { local });
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m03', step: 5, student: STUDENT_A }));
  const tab = sim(launchUrl('hd-m03'), { local, opener });
  tab.run(`hdState.tickets[0].notes.push({ author: 'me', time: 'now', text: 'final note' }); hdSave();`);
  assert.equal(tab.coachState().step, 5);
  return tab;
}

function testFinishConfirmedEndsLab() {
  const local = store();
  const opener = fakeOpener();
  const tab = hdM03AtFinish(local, opener);
  tab.finish();
  assert.equal(opener.sent.length, 1);
  const { data, origin } = opener.sent[0];
  assert.equal(origin, PORTAL);
  assert.equal(data.type, 'mnt-coach-complete');
  assert.equal(data.id, 'hd-m03');
  assert.equal(data.work.tickets[0].notes.at(-1).text, 'final note', 'the work travels with Finish');
  assert.equal(data.student, STUDENT_A, 'Finish names the launching student (the hash, not an email)');
  assert.match(tab.panelHtml(), /Saving…/);
  assert.ok(tab.resume(), 'kept while waiting for the portal');

  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: 'wrong', saved: true });
  assert.ok(tab.resume(), 'a reply for another Finish is ignored');
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: data.nonce, saved: true }, 'https://evil.test');
  assert.ok(tab.resume(), 'a reply from another origin is ignored');

  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: data.nonce, saved: true });
  assert.equal(tab.resume(), null, 'confirmed: record cleared');
  assert.equal(tab.coachState(), null, 'coach ended');
  assert.equal(tab.ctx.closed, true, 'tab closes back to the portal');

  const relaunched = sim(launchUrl('hd-m03'), { local });
  assert.equal(relaunched.coachState().step, 0, 'a finished lab starts fresh');
  assert.equal(ticket(relaunched, 'HD-2109').notes.length, 0);
}

const NOT_CONFIRMED = 'Your course page didn’t confirm it saved this lab. Your work is still here. Make sure you’re signed in on your course page, then press Finish again.';

function testFinishNotSavedKeepsWork() {
  const local = store();
  const opener = fakeOpener();
  const tab = hdM03AtFinish(local, opener);
  tab.finish();
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: opener.sent[0].data.nonce, saved: false });
  assert.ok(tab.panelHtml().includes(NOT_CONFIRMED));
  assert.equal(tab.coachState().step, 5, 'still on the last step');
  assert.ok(tab.resume(), 'record kept');
  assert.equal(tab.ctx.closed, false, 'tab stays open');

  // Pressing Finish again after signing in works.
  tab.finish();
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: opener.sent[1].data.nonce, saved: true });
  assert.equal(tab.resume(), null);
  assert.equal(opener.sent.length, 2, 'one message per Finish press');
}

function testFinishTimeoutKeepsWork() {
  const local = store();
  const opener = fakeOpener();
  const tab = hdM03AtFinish(local, opener);
  tab.finish();
  tab.finish();
  assert.equal(opener.sent.length, 1, 'a second press while saving sends nothing');
  tab.runTimers();
  assert.ok(tab.panelHtml().includes(NOT_CONFIRMED));
  assert.ok(tab.resume());
  assert.equal(ticket(tab, 'HD-2109').notes.at(-1).text, 'final note');
}

const PORTAL_CLOSED = 'Your course page is closed, so this lab couldn’t be saved. Your work is still here. Open your course page and click the walkthrough button for this lab to continue, then press Finish.';

function testFinishWithPortalClosedResumesInNewTab() {
  const local = store();
  const tab = hdM03AtFinish(local, null);
  tab.finish();
  assert.ok(tab.panelHtml().includes(PORTAL_CLOSED));
  assert.equal(tab.coachState().step, 5);
  assert.equal(tab.ctx.closed, false);

  const relaunched = sim(launchUrl('hd-m03'), { local, opener: fakeOpener() });
  assert.equal(relaunched.coachState().step, 5, 'new tab resumes at Finish');
  assert.equal(ticket(relaunched, 'HD-2109').notes.at(-1).text, 'final note', 'work kept');

  const closedOpener = { ...fakeOpener(), closed: true };
  const closedTab = hdM03AtFinish(store(), closedOpener);
  closedTab.finish();
  assert.match(closedTab.panelHtml(), /Your course page is closed/, 'a closed opener counts as no portal tab');
}

const OTHER_STUDENT = 'Your course page is signed in as a different student, so this lab wasn’t saved. Your work is still here. Sign in as yourself on your course page, then press Finish again.';
const OLDER_PAGE = 'This lab was opened from an older copy of your course page, so it can’t be saved from here. Your work is still here. Reload your course page, click the walkthrough button for this lab, then press Finish.';

// Student B signed in on the course page before A's Finish: the portal
// refuses, and A's work waits for A to sign back in.
function testFinishOtherStudentKeepsWork() {
  const local = store();
  const opener = fakeOpener();
  const tab = hdM03AtFinish(local, opener);
  tab.finish();
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: opener.sent[0].data.nonce, saved: false, reason: 'other-student' });
  assert.ok(tab.panelHtml().includes(OTHER_STUDENT));
  assert.equal(tab.coachState().step, 5);
  assert.ok(tab.resume());
  assert.equal(tab.ctx.closed, false);

  // A signs back in and presses Finish again.
  tab.finish();
  assert.equal(opener.sent[1].data.student, STUDENT_A);
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m03', nonce: opener.sent[1].data.nonce, saved: true });
  assert.equal(tab.resume(), null);
  assert.equal(tab.ctx.closed, true);
}

// A tab opened from an older course page has no student id: Finish sends
// nothing, and a relaunch from the reloaded course page resumes that work.
function testOlderCoursePageResumesAfterReload() {
  const local = store();
  const opener = fakeOpener();
  const old = sim(`${SIM_URL}?coach=hd-m03&restart=1#/helpdesk/tickets`, { local, opener });
  workHdM03ToPath(old);
  old.run(`hdState.tickets[0].notes.push({ author: 'me', time: 'now', text: 'from the old page' }); hdSave();`);
  assert.equal(old.resume().student, '');
  old.ctx.sessionStorage.setItem('mnt.coach.state', JSON.stringify({ id: 'hd-m03', step: 5 }));
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m03', step: 5, student: '' }));
  const atFinish = old.reload();
  atFinish.finish();
  assert.ok(atFinish.panelHtml().includes(OLDER_PAGE));
  assert.equal(opener.sent.length, 0, 'nothing sent without a student id');

  const relaunched = sim(launchUrl('hd-m03'), { local, opener: fakeOpener() });
  assert.equal(relaunched.coachState().step, 5, 'resumes at Finish, not step 1');
  assert.equal(ticket(relaunched, 'HD-2109').notes.at(-1).text, 'from the old page', 'work kept');
  assert.equal(relaunched.resume().student, STUDENT_A, 'the record now names the student');
}

// The message names no button: a returned lab's button says "Redo".
function testPortalClosedMessageFitsEveryModule() {
  const local = store();
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: 6, student: STUDENT_A }));
  const tab = sim(launchUrl('hd-m01'), { local });
  tab.finish();
  assert.ok(tab.panelHtml().includes(PORTAL_CLOSED));
}

/* -------------------------------------------------------- SOC Module 1 */

const M01_LAUNCH = `${SIM_URL}?coach=m01&restart=1#/entra/sign-in-logs`;
const M01_FILTER = 'defender-lab.signin.user';

function testSocM01LaunchStillStartsFresh() {
  const local = store();
  // sessionStorage copied from the portal tab can carry an old filter and step.
  const session = store([[M01_FILTER, 'j.santos@missionnextlabs.example'], ['mnt.coach.state', JSON.stringify({ id: 'm01', step: 3 })]]);
  const tab = sim(M01_LAUNCH, { local, session });
  assert.equal(tab.coachState().step, 0, 'a portal launch starts at step 1, as before');
  assert.equal(session.getItem(M01_FILTER), null, 'resetState still clears the filter');
  assert.equal(tab.location.search, '?coach=m01', 'restart=1 leaves the address bar');
  assert.equal(tab.resume(), null, 'SOC never writes the Help Desk in-progress record');
}

function testSocM01ReloadKeepsFilterAndStep() {
  const local = store();
  const tab = sim(M01_LAUNCH, { local });
  // The student filters the log and reaches step 4.
  tab.ctx.sessionStorage.setItem(M01_FILTER, 'j.santos@missionnextlabs.example');
  tab.ctx.sessionStorage.setItem('mnt.coach.state', JSON.stringify({ id: 'm01', step: 3 }));

  const reloaded = tab.reload();
  assert.equal(reloaded.coachState().step, 3, 'same step after reload');
  assert.equal(reloaded.ctx.sessionStorage.getItem(M01_FILTER), 'j.santos@missionnextlabs.example', 'filter kept');
  assert.equal(reloaded.resume(), null);
}

function testSocM01FinishUnchanged() {
  const local = store();
  const opener = fakeOpener();
  const last = vm.runInNewContext(`${SOURCES[0][1]}; MODULE_COACHES.find((c) => c.id === 'm01').steps.length - 1`);
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'm01', step: last })]]);
  const tab = sim(`${SIM_URL}?coach=m01#/defender/alerts`, { local, session, opener });
  opener.sent.length = 0;
  tab.finish();
  assert.deepEqual(opener.sent.map((m) => m.data), [{ type: 'mnt-coach-complete', id: 'm01' }], 'same message, no work, no nonce');
  assert.equal(tab.coachState(), null, 'ends at once, no wait for the portal');
  assert.equal(tab.ctx.closed, true);
}

const tests = [
  testFirstLaunchStartsFreshAndCleansAddress,
  testReloadKeepsWork,
  testRelaunchSameStudentResumes,
  testRelaunchDifferentStudentStartsFresh,
  testOtherCoachInBetweenStartsFresh,
  testResetShiftForgetsProgress,
  testFinishConfirmedEndsLab,
  testFinishNotSavedKeepsWork,
  testFinishTimeoutKeepsWork,
  testFinishWithPortalClosedResumesInNewTab,
  testPortalClosedMessageFitsEveryModule,
  testFinishOtherStudentKeepsWork,
  testOlderCoursePageResumesAfterReload,
  testSocM01LaunchStillStartsFresh,
  testSocM01ReloadKeepsFilterAndStep,
  testSocM01FinishUnchanged,
];
let failed = 0;
for (const test of tests) {
  try {
    test();
    console.log(`ok   ${test.name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${test.name}\n     ${String(err && err.message).split('\n')[0]}`);
  }
}
if (failed) {
  console.log(`${failed} of ${tests.length} failed`);
  process.exit(1);
}

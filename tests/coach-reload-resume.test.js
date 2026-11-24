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
  const screen = { tickets: [] };
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
    // Records the tickets the drawn page shows, then lets the coach react.
    render: () => {
      screen.tickets = vm.runInContext("typeof hdState === 'undefined' ? [] : hdState.tickets.map((t) => t.id)", ctx);
      if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender();
    },
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
  // ui/app.js draws the page on DOMContentLoaded before coach.js boots.
  ctx.render();
  loaded.forEach((fn) => fn());

  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  return {
    ctx, location, toasts,
    screenTickets: () => Array.from(screen.tickets),
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

// hd-m08 (Module 10's generic coach, two tickets: HD-2110 then HD-2111, last
// step 11): open HD-2110 and read the evidence — the student is then on step
// 3, working the troubleshooting path. Until 2026-11-24 these tests used
// hd-m03 on HD-2109; Module 5's lab replaced that coach.
function workHdM08ToPath(tab) {
  tab.run(`hdState.selectedTicketId = 'HD-2110'`);
  tab.next();                                   // opened the ticket
  tab.next();                                   // read the evidence
  return tab;
}

/* ------------------------------------------------------------ Help Desk */

function testFirstLaunchStartsFreshAndCleansAddress() {
  const local = store();
  // A previous coach's leftover tickets and a note in the shared save.
  const before = sim(launchUrl('hd-m01'), { local });
  assert.equal(before.screenTickets().length, 4, 'Module 1 page shows its four tickets');
  assert.deepEqual(sim(launchUrl('hd-m02'), { local: store() }).screenTickets().sort(), ['HD-2134'], 'Module 4 Lab 4.3 shows its one ticket');
  before.run(`hdState.tickets[0].notes.push({ author: 'x', time: 't', text: 'old note' }); hdSave();`);

  const tab = sim(launchUrl('hd-m08'), { local });
  assert.deepEqual(ticketIds(tab).sort(), ['HD-2110', 'HD-2111'], 'reset to this coach\'s tickets');
  assert.deepEqual(tab.screenTickets().sort(), ['HD-2110', 'HD-2111'], 'the page is redrawn after the reset, not left showing the old queue');
  assert.equal(tab.coachState().step, 0);
  assert.equal(tab.location.search, '?coach=hd-m08', 'restart and student leave the address bar');
  assert.equal(tab.location.hash, '#/helpdesk/tickets');
  assert.deepEqual(tab.resume(), { id: 'hd-m08', step: 0, student: STUDENT_A });
}

function testReloadKeepsWork() {
  const local = store();
  const tab = workHdM08ToPath(sim(launchUrl('hd-m08'), { local }));
  tab.run(`hdTicketById('HD-2110').notes.push({ author: 'me', time: 'now', text: 'Temp profile loaded' }); hdSave();`);
  assert.equal(tab.coachState().step, 2);

  const reloaded = tab.reload();
  assert.equal(reloaded.coachState().step, 2, 'same step after reload');
  assert.equal(ticket(reloaded, 'HD-2110').notes.at(-1).text, 'Temp profile loaded', 'work note kept');
  assert.equal(reloaded.hd().selectedTicketId, 'HD-2110');
}

function testRelaunchSameStudentResumes() {
  const local = store();
  const tab = workHdM08ToPath(sim(launchUrl('hd-m08'), { local }));
  tab.run(`hdTicketById('HD-2110').notes.push({ author: 'me', time: 'now', text: 'kept across launches' }); hdSave();`);
  tab.location.hash = '#/helpdesk/ticket';

  // The portal opens a new tab: empty sessionStorage, the launch link again.
  const relaunched = sim(launchUrl('hd-m08'), { local });
  assert.equal(relaunched.coachState().step, 2, 'resumes at the saved step');
  assert.equal(relaunched.location.hash, '#/helpdesk/ticket', 'on the page that step lives on');
  assert.equal(ticket(relaunched, 'HD-2110').notes.at(-1).text, 'kept across launches');
  assert.equal(relaunched.location.search, '?coach=hd-m08');
}

// hd-m01's steps were reordered on 2026-11-15 (Verify caller moved from step
// 4 to step 2). A run saved under the old order at step 3 or 4 hasn't
// verified yet and resumes at step 2; every other step is unchanged. The
// remap runs once per shift, so a run in the new order is never moved back.
function testHdM01OldStepOrderResumesOnAValidStep() {
  const expected = { 0: 0, 1: 1, 2: 2, 3: 2, 4: 2, 5: 5, 6: 6, 7: 7, 8: 8 };
  for (const [old, want] of Object.entries(expected)) {
    const local = store();
    const first = sim(launchUrl('hd-m01'), { local });
    assert.equal(first.hd().coachOrder, 2, 'a fresh lab runs the new order');
    // A shift saved before the reorder, with the coach part way through.
    first.run('delete hdState.coachOrder; hdSave()');
    local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: Number(old), student: STUDENT_A }));
    const relaunched = sim(launchUrl('hd-m01'), { local });
    assert.equal(relaunched.coachState().step, want, `old step ${old} resumes at ${want}`);
    assert.equal(relaunched.hd().coachOrder, 2, 'the shift is marked, so the remap runs once');
  }
  // The new order, saved at step 4 (the KB): never moved back.
  const local = store();
  sim(launchUrl('hd-m01'), { local });
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: 4, student: STUDENT_A }));
  assert.equal(sim(launchUrl('hd-m01'), { local }).coachState().step, 4);
  // A reload (sessionStorage) is remapped the same way.
  const tabLocal = store();
  const tab = sim(launchUrl('hd-m01'), { local: tabLocal });
  tab.run('delete hdState.coachOrder; hdSave()');
  tab.run(`sessionStorage.setItem('mnt.coach.state', ${JSON.stringify(JSON.stringify({ id: 'hd-m01', step: 3, student: STUDENT_A }))})`);
  tabLocal.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: 3, student: STUDENT_A }));
  assert.equal(tab.reload().coachState().step, 2);
}

function testRelaunchDifferentStudentStartsFresh() {
  const local = store();
  const tab = workHdM08ToPath(sim(launchUrl('hd-m08'), { local }));
  tab.run(`hdTicketById('HD-2110').notes.push({ author: 'A', time: 'now', text: 'student A note' }); hdSave();`);

  const other = sim(launchUrl('hd-m08', STUDENT_B), { local });
  assert.equal(other.coachState().step, 0, 'another student starts at step 1');
  assert.equal(ticket(other, 'HD-2110').notes.length, 0, 'student A\'s note is gone');
  assert.equal(other.resume().student, STUDENT_B);

  const noStudent = sim(`${SIM_URL}?coach=hd-m08&restart=1#/helpdesk/tickets`, { local });
  assert.equal(noStudent.coachState().step, 0, 'a launch without a student never resumes');
}

function testOtherCoachInBetweenStartsFresh() {
  const local = store();
  workHdM08ToPath(sim(launchUrl('hd-m08'), { local }));
  sim(launchUrl('hd-m04'), { local });
  const back = sim(launchUrl('hd-m08'), { local });
  assert.equal(back.coachState().step, 0);
  assert.deepEqual(ticketIds(back).sort(), ['HD-2110', 'HD-2111']);
}

function testResetShiftForgetsProgress() {
  const local = store();
  const tab = workHdM08ToPath(sim(launchUrl('hd-m08'), { local }));
  tab.run('hdResetShift()');
  assert.equal(tab.resume(), null, 'in-progress record cleared');
  assert.equal(tab.coachState(), null, 'running coach stopped');

  const relaunched = sim(launchUrl('hd-m08'), { local });
  assert.equal(relaunched.coachState().step, 0, 'relaunch starts fresh');
  assert.deepEqual(ticketIds(relaunched).sort(), ['HD-2110', 'HD-2111']);
}

// Gets hd-m08 to its last step by restoring that step from the record.
function hdM03AtFinish(local, opener) {
  sim(launchUrl('hd-m08'), { local });
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m08', step: 11, student: STUDENT_A }));
  const tab = sim(launchUrl('hd-m08'), { local, opener });
  tab.run(`hdTicketById('HD-2110').notes.push({ author: 'me', time: 'now', text: 'final note' }); hdSave();`);
  assert.equal(tab.coachState().step, 11);
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
  assert.equal(data.id, 'hd-m08');
  assert.equal(data.work.tickets.find((t) => t.id === 'HD-2110').notes.at(-1).text, 'final note', 'the work travels with Finish');
  assert.equal(data.student, STUDENT_A, 'Finish names the launching student (the hash, not an email)');
  assert.match(tab.panelHtml(), /Saving…/);
  assert.ok(tab.resume(), 'kept while waiting for the portal');

  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: 'wrong', saved: true });
  assert.ok(tab.resume(), 'a reply for another Finish is ignored');
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: data.nonce, saved: true }, 'https://evil.test');
  assert.ok(tab.resume(), 'a reply from another origin is ignored');

  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: data.nonce, saved: true });
  assert.equal(tab.resume(), null, 'confirmed: record cleared');
  assert.equal(tab.coachState(), null, 'coach ended');
  assert.equal(tab.ctx.closed, true, 'tab closes back to the portal');

  const relaunched = sim(launchUrl('hd-m08'), { local });
  assert.equal(relaunched.coachState().step, 0, 'a finished lab starts fresh');
  assert.equal(ticket(relaunched, 'HD-2110').notes.length, 0);
}

const NOT_CONFIRMED = 'Your course page didn’t confirm it saved this lab. Your work is still here. Make sure you’re signed in on your course page, then press Finish again.';

function testFinishNotSavedKeepsWork() {
  const local = store();
  const opener = fakeOpener();
  const tab = hdM03AtFinish(local, opener);
  tab.finish();
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: opener.sent[0].data.nonce, saved: false });
  assert.ok(tab.panelHtml().includes(NOT_CONFIRMED));
  assert.equal(tab.coachState().step, 11, 'still on the last step');
  assert.ok(tab.resume(), 'record kept');
  assert.equal(tab.ctx.closed, false, 'tab stays open');

  // Pressing Finish again after signing in works.
  tab.finish();
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: opener.sent[1].data.nonce, saved: true });
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
  assert.equal(ticket(tab, 'HD-2110').notes.at(-1).text, 'final note');
}

const PORTAL_CLOSED = 'Your course page is closed, so this lab couldn’t be saved. Your work is still here. Open your course page and click the walkthrough button for this lab to continue, then press Finish.';

function testFinishWithPortalClosedResumesInNewTab() {
  const local = store();
  const tab = hdM03AtFinish(local, null);
  tab.finish();
  assert.ok(tab.panelHtml().includes(PORTAL_CLOSED));
  assert.equal(tab.coachState().step, 11);
  assert.equal(tab.ctx.closed, false);

  const relaunched = sim(launchUrl('hd-m08'), { local, opener: fakeOpener() });
  assert.equal(relaunched.coachState().step, 11, 'new tab resumes at Finish');
  assert.equal(ticket(relaunched, 'HD-2110').notes.at(-1).text, 'final note', 'work kept');

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
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: opener.sent[0].data.nonce, saved: false, reason: 'other-student' });
  assert.ok(tab.panelHtml().includes(OTHER_STUDENT));
  assert.equal(tab.coachState().step, 11);
  assert.ok(tab.resume());
  assert.equal(tab.ctx.closed, false);

  // A signs back in and presses Finish again.
  tab.finish();
  assert.equal(opener.sent[1].data.student, STUDENT_A);
  tab.reply({ type: 'mnt-coach-received', id: 'hd-m08', nonce: opener.sent[1].data.nonce, saved: true });
  assert.equal(tab.resume(), null);
  assert.equal(tab.ctx.closed, true);
}

// A tab opened from an older course page has no student id: Finish sends
// nothing, and a relaunch from the reloaded course page resumes that work.
function testOlderCoursePageResumesAfterReload() {
  const local = store();
  const opener = fakeOpener();
  const old = sim(`${SIM_URL}?coach=hd-m08&restart=1#/helpdesk/tickets`, { local, opener });
  workHdM08ToPath(old);
  old.run(`hdTicketById('HD-2110').notes.push({ author: 'me', time: 'now', text: 'from the old page' }); hdSave();`);
  assert.equal(old.resume().student, '');
  old.ctx.sessionStorage.setItem('mnt.coach.state', JSON.stringify({ id: 'hd-m08', step: 11 }));
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m08', step: 11, student: '' }));
  const atFinish = old.reload();
  atFinish.finish();
  assert.ok(atFinish.panelHtml().includes(OLDER_PAGE));
  assert.equal(opener.sent.length, 0, 'nothing sent without a student id');

  const relaunched = sim(launchUrl('hd-m08'), { local, opener: fakeOpener() });
  assert.equal(relaunched.coachState().step, 11, 'resumes at Finish, not step 1');
  assert.equal(ticket(relaunched, 'HD-2110').notes.at(-1).text, 'from the old page', 'work kept');
  assert.equal(relaunched.resume().student, STUDENT_A, 'the record now names the student');
}

// The message names no button: a returned lab's button says "Redo".
function testPortalClosedMessageFitsEveryModule() {
  const local = store();
  // hd-m01's last step (index 9) is its Finish step.
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: 9, student: STUDENT_A }));
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

/* ----------------------------------- a launch that didn't ask for a coach */

// Staging, Nov 16: Lab 1.1's Finish couldn't reach the course page, so the
// hd-m01 coach stayed on its last step in that tab's sessionStorage.
// "Coursework" then turned the tab into the course page, and Lab 1.2 opened
// from it in a new tab, which starts with a copy of the tab's sessionStorage.
// The practice set showed the Lab 1.1 coach panel, also after a reload.
const PRACTICE_URL = `${SIM_URL}?practice=its-01&student=${STUDENT_A}#/helpdesk/tickets`;
const panelOpen = (tab) => Boolean(tab.ctx.document.getElementById('coach-panel')) && !tab.ctx.document.getElementById('coach-panel').hidden;

function hdM01LeftOnFinish(local) {
  const lab11 = sim(launchUrl('hd-m01'), { local });
  const last = lab11.run("MODULE_COACHES.find((c) => c.id === 'hd-m01').steps.length - 1");
  const saved = JSON.stringify({ id: 'hd-m01', step: last, student: STUDENT_A });
  lab11.ctx.sessionStorage.setItem('mnt.coach.state', saved);
  local.setItem('mnt.coach.resume', saved);
  return { last, session: store(lab11.ctx.sessionStorage.map) };
}

function testPracticeLaunchShowsNoCoach() {
  const local = store();
  const { last, session } = hdM01LeftOnFinish(local);
  const practice = sim(PRACTICE_URL, { local, session, opener: fakeOpener() });
  assert.equal(practice.coachState(), null, 'the practice set runs with no coach');
  assert.equal(panelOpen(practice), false, 'no coach panel over the practice tickets');
  assert.equal(practice.location.search, '?practice=its-01', 'student leaves the address bar, as before');
  // Lab 1.1's module number came along too; left there, the corner dock
  // offered SOC Module 1's "Take the tour", which opens another coach panel.
  assert.equal(practice.ctx.sessionStorage.getItem('mnt.coach.lastModule'), null, 'no module number left for the tour button');

  const reloaded = practice.reload();
  assert.equal(reloaded.coachState(), null, 'still no coach after a reload');
  assert.equal(panelOpen(reloaded), false);

  // Lab 1.1 wasn't saved, so reopening it still resumes on its Finish step.
  assert.deepEqual(practice.resume(), { id: 'hd-m01', step: last, student: STUDENT_A }, 'the in-progress record is kept');
  const lab11 = sim(launchUrl('hd-m01'), { local, opener: fakeOpener() });
  assert.equal(lab11.coachState().step, last, 'Lab 1.1 resumes where it stopped');
  assert.equal(panelOpen(lab11), true);
}

// A Help Desk coach always runs with ?coach=<id> in the address, and a reload
// keeps it, so a load without it never brings one back.
function testHelpDeskCoachNeedsItsLaunch() {
  const local = store();
  const { session } = hdM01LeftOnFinish(local);
  const plain = sim(`${SIM_URL}#/helpdesk/tickets`, { local, session });
  assert.equal(plain.coachState(), null, 'a plain simulator load shows no Help Desk coach');
  assert.equal(panelOpen(plain), false);
  assert.equal(plain.reload().coachState(), null);
}

// SOC's orientation tour starts inside the simulator with no ?coach, so a
// reload brings it back from sessionStorage, as before.
function testSocTourReloadKeepsStep() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'm01-orientation', step: 2 })]]);
  const tab = sim(`${SIM_URL}#/defender/alerts`, { local: store(), session });
  assert.equal(tab.coachState().step, 2, 'the tour resumes on its step');
  assert.equal(panelOpen(tab), true);
}

const tests = [
  testPracticeLaunchShowsNoCoach,
  testHelpDeskCoachNeedsItsLaunch,
  testSocTourReloadKeepsStep,
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
  testHdM01OldStepOrderResumesOnAValidStep,
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

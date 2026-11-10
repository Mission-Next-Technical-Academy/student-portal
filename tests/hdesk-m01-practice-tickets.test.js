// Help Desk Module 1 Practice It, unguided tickets 1-A to 1-C (not graded):
// HD-2151 (Leah Brooks, forgotten password), HD-2152 (Ravi Shah, cracked
// screen, KB-0071) and SEC-2153 (an unverified caller wants an executive's
// password). Opened from the Module 1 page as a practice set (?practice=its-01,
// ui/helpdesk.js), worked with the console features, with "Check my work"
// feedback by the spec's rubric areas: never points, and category and
// priority (pre-set in Module 1) never judged.
//
//   - The practice set: only its three tickets, its own saved shift, no coach;
//     the coached lab's shift and walkthrough progress stay untouched.
//   - Each ticket worked correctly: every area met, no critical error.
//   - Each ticket's critical errors: recorded, shown at once and listed first.
//   - Right owner: Tier 1, Desktop Support per KB-0071, or the SOC route
//     (Category Security › Suspicious request, Caller Unverified).
//   - Nothing is sent to the portal; the Module 1 page links the set.
//
// The simulator runs in a Node vm with a small fake DOM; the portal runs in
// tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
const STUDENT = 'student-m01t0001';
const launchUrl = (restart = true) => `${SIM_URL}?coach=hd-m01${restart ? '&restart=1' : ''}&student=${STUDENT}#/helpdesk/tickets`;
const MINUTE = 60000;

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', listeners,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; }, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
function fakeOpener() {
  const sent = [];
  return { sent, closed: false, focus() {}, postMessage: (data, origin) => sent.push({ data: JSON.parse(JSON.stringify(data)), origin }) };
}

// One browser tab. `clock.now` is the time Date.now() returns inside it.
function sim(url, { local = store(), session = store(), clock = { now: Date.UTC(2026, 10, 3, 14) }, opener = null } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const messageListeners = new Set();
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''),
    querySelector: () => null, querySelectorAll: () => [],
  };
  class ClockDate extends Date { static now() { return clock.now; } }
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date: ClockDate, location, document,
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.pathname = n.pathname; location.search = n.search; location.hash = n.hash; } },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() { ctx.closed = true; }, focus() {}, confirm: () => true,
    addEventListener: (type, fn) => { if (type === 'message') messageListeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') messageListeners.delete(fn); },
    toast: (text) => toasts.push(text),
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash; ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  const tab = {
    ctx, location, toasts, local, session, clock, run, input,
    hd: () => run('hdState'),
    ticket: (id) => run(`hdTicketById(${JSON.stringify(id)})`),
    progress: (id) => JSON.parse(JSON.stringify(run(`hdConsoleProgress(${JSON.stringify(id)})`))),
    feedback: (id) => { run(`hdConsoleCheckWork(${JSON.stringify(id)})`); return JSON.parse(JSON.stringify(run(`hdConsoleFeedback(hdTicketById(${JSON.stringify(id)}))`))); },
    open: (id) => { run(`hdState.selectedTicketId = ${JSON.stringify(id)}`); return tab.view('helpdesk/ticket'); },
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    ps: (command) => {
      input('hd-ps-input', command);
      run('hdRunPowerShell({ preventDefault() {} })');
      const rows = run('hdState.powershell');
      return rows[rows.length - 1].text;
    },
    filterEvents: (id, text = '') => { input('hd-ev-id', id); input('hd-ev-text', text); run('hdSetEventFilter({ preventDefault() {} })'); return tab.view('helpdesk/event-viewer'); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${JSON.stringify(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${JSON.stringify(id)})`); },
    ask: (id, q) => run(`hdChatAsk(${JSON.stringify(id)}, ${JSON.stringify(q)})`),
    verify: (id, o) => run(`hdVerify(${JSON.stringify(id)}, ${JSON.stringify(o)})`),
    act: (id, a) => run(`hdConsoleAction(${JSON.stringify(id)}, ${JSON.stringify(a)})`),
    own: (id, o) => run(`hdConsoleOwner(${JSON.stringify(id)}, ${JSON.stringify(o)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${JSON.stringify(id)})`); if (article) run(`hdKbOpen(${JSON.stringify(id)}, ${JSON.stringify(article)})`); },
    diagnose: (id, value) => { input('hd-diagnosis', value); run(`hdSubmitDiagnosis(${JSON.stringify(id)})`); },
    coachStep: () => (JSON.parse(session.getItem('mnt.coach.state') || 'null') || {}).step,
    stepCount: () => run("MODULE_COACHES.find((c) => c.id === 'hd-m01').steps.length"),
    panelHtml: () => panel().innerHTML,
    // The coach's own poll (setInterval) is off in the vm: press Next while
    // the current step is done, as the poll would. Never past the last step.
    advance: () => {
      for (;;) {
        const before = tab.coachStep();
        if (before === undefined || before >= tab.stepCount() - 1) return before;
        click('next');
        if (tab.coachStep() === before) return before;
      }
    },
    finish: () => click('finish'),
    reply: (data, origin = PORTAL) => [...messageListeners].forEach((fn) => fn({ data, origin, source: opener })),
    reload: () => sim(location.origin + location.pathname + location.search + location.hash, { local, session, clock, opener }),
  };
  return tab;
}



const practiceUrl = (student = STUDENT) => `${SIM_URL}?practice=its-01&student=${student}#/helpdesk/tickets`;
const SET = ['HD-2151', 'HD-2152', 'SEC-2153'];
const ok = (fb) => Object.fromEntries(fb.areas.map((row) => [row.area, row.ok]));

const LEAH_NOTE = 'Reported: user returning from 2 weeks\' leave, forgot password; asked us to tell her or set an easy one.\nTried: identity verified per KB-0024 (callback + employee ID match); explained we can\'t view or set passwords; guided user through the self-service reset page per KB-0024.\nResult: user set a new password and signed in on the call.';
const LEAH_COMMENT = 'Hi Leah, welcome back! You\'re signed in with your new password. For your security, IT can never see or choose your password, so the self-service page is the fastest way if you forget it again. It\'s linked on the sign-in screen. – Riley';
const RAVI_NOTE = 'Reported: laptop NS-LT-0215 dropped today; screen cracked in one corner, still usable; no loose glass; client demo Thursday.\nTried: device starts; user\'s files are in OneDrive per user; per KB-0071, offered loaner (user collecting 14:00); escalated to Desktop Support for screen repair or replacement.\nResult: pending Tier 2; user informed of next steps.\nNext action: Desktop Support repairs or replaces the screen and contacts Ravi.';
const RAVI_COMMENT = 'Hi Ravi, sorry about the laptop! Please bring it to the Service Desk today and we\'ll give you a loaner so you\'re ready for Thursday\'s demo. Our desktop team will repair or replace the screen and let you know when it\'s ready. If any glass comes loose, stop using it. – Riley';
const KAREN_NOTE = 'Reported: caller "Karen, CFO office" requested reset of ralvarez with the new one texted to 407-555-0199 (not in directory). Exact words: "reset his password and text the new one to his personal cell. Please hurry, he\'s furious." Time 11:02.\nTried: caller not verifiable; offered a callback to Mr. Alvarez\'s directory mobile, declined by caller; declined per KB-0024; no account changes; suspected social engineering.\nResult: routed to Security Operations 11:05.\nNext action: the Service Desk calls Mr. Alvarez back on his directory number.';
const ALVAREZ_COMMENT = 'Mr. Alvarez, we received a call asking us to reset your password and send it to a personal number. We didn\'t make any changes to your account. If you didn\'t ask for this, no action is needed; our security team is reviewing it. – Northstar Service Desk';

function workLeah(tab) {
  const id = 'HD-2151';
  tab.ask(id, 'what'); tab.ask(id, 'changed');
  tab.kb(id, 'forgot password', 'KB-0024');
  tab.diagnose(id, 'Forgotten password: nothing is broken');
  tab.verify(id, 'callback');
  tab.act(id, 'reset-page');
  tab.ask(id, 'signin');
  assert.equal(tab.note(id, LEAH_NOTE), true);
  assert.equal(tab.comment(id, LEAH_COMMENT), true);
  tab.own(id, 'servicedesk');
}
function workRavi(tab) {
  const id = 'HD-2152';
  ['when', 'starts', 'glass', 'files'].forEach((q) => tab.ask(id, q));
  tab.kb(id, 'damaged laptop', 'KB-0071');
  tab.diagnose(id, 'Physical damage: a Tier 2 repair');
  tab.act(id, 'loaner');
  assert.equal(tab.note(id, RAVI_NOTE), true);
  assert.equal(tab.comment(id, RAVI_COMMENT), true);
  tab.own(id, 'desktop');
}
function workKaren(tab) {
  const id = 'SEC-2153';
  tab.ask(id, 'who'); tab.ask(id, 'number');
  tab.kb(id, 'caller reset password', 'KB-0024');
  tab.diagnose(id, 'Social engineering: someone is trying to talk you into handing over an account');
  tab.verify(id, 'callback');
  tab.act(id, 'decline');
  assert.equal(tab.note(id, KAREN_NOTE), true);
  assert.equal(tab.comment(id, ALVAREZ_COMMENT), true);
  tab.own(id, 'soc');
}

/* ------------------------------------------------------ the practice set */

function testPracticeSetShift() {
  const tab = sim(practiceUrl());
  assert.deepEqual(Array.from(tab.hd().tickets, (t) => t.id).sort(), [...SET].sort(), 'only the three practice tickets');
  assert.equal(tab.coachStep(), undefined, 'no coach');
  assert.ok(tab.local.getItem(`defender-lab.helpdesk.practice.v1.its-01.${STUDENT}`), 'its own saved shift');
  assert.equal(tab.local.getItem('defender-lab.helpdesk.state.v1'), null, 'the coached lab\'s shift is not touched');
  for (const id of SET) {
    const html = tab.open(id);
    ['hd-chat', 'hd-kb-search', 'hd-actions', 'hd-owner', 'hd-comments', 'hd-practice-feedback', 'hd-priority-preset'].forEach((cls) => assert.match(html, new RegExp(`class="card ${cls}"|class="${cls}"`), `${id}: ${cls}`));
    assert.doesNotMatch(html, /hdSetTicketPriority|hdResolveTicket/, `${id}: priority read-only, no Resolve button (the owner choice closes it)`);
    assert.doesNotMatch(html, /<option>Resolved<\/option>|<option>Escalated<\/option>/, `${id}: the state list can't close it`);
    assert.match(html, /<span>Contact type<\/span>/);
  }
  assert.match(tab.open('HD-2151'), /Pre-set: P4: one person, no deadline today\./);
  assert.match(tab.open('HD-2152'), /Pre-set: P3: one person, with a deadline this week\./);
  assert.match(tab.open('HD-2152'), /<span>Configuration item<\/span><strong>NS-LT-0215<\/strong>/);
  assert.match(tab.open('SEC-2153'), /Pre-set: P2: an executive account at risk, and the caller is pushing for speed\./);
  // The state list refuses to close a ticket with an owner choice, too.
  tab.run("hdState.tickets.find((t) => t.id === 'HD-2151').status = 'In Progress'; hdTransitionTicket('HD-2151', 'Resolved')");
  assert.match(tab.toasts.at(-1), /Choose who owns this ticket/);
  assert.equal(tab.ticket('HD-2151').status, 'In Progress');

  // KB: symptom words find the right article first; KB-0071 as written.
  const first = (q) => tab.run(`hdKbSearchArticles(${JSON.stringify(q)}, hdKbArticles())[0].id`);
  assert.equal(first('forgot password'), 'KB-0024');
  assert.equal(first('damaged laptop'), 'KB-0071');
  assert.equal(first('cracked screen laptop'), 'KB-0071');
  const kb71 = tab.run("HD_KB_ARTICLES.find((a) => a.id === 'KB-0071').summary");
  ['Tier 1 does not repair hardware', 'asset tag and what happened', 'glass is loose', 'stop using the laptop', 'Offer a loaner', 'Escalate to Desktop Support'].forEach((text) => assert.ok(kb71.includes(text), text));
  // The people and the laptop.
  const dir = tab.view('helpdesk/directory');
  assert.match(dir, /Leah Brooks[\s\S]*Marketing/);
  assert.match(dir, /Ravi Shah[\s\S]*Sales/);
  assert.match(dir, /Martin Alvarez[\s\S]*Executive Office[\s\S]*mobile 407-555-0142/);
  assert.ok(tab.run('HD_ORG.departments').includes('Marketing'));
  assert.equal(tab.run("hdUserById('u-1016').username"), 'ralvarez');
  assert.equal(tab.run("hdUserById('u-1016').title"), 'Chief Financial Officer');
  assert.ok(tab.run("HD_COMPUTERS.some((c) => c.name === 'NS-LT-0215' && c.user === 'Ravi Shah')"));
  // A reload keeps the practice work, though the page removed student= from
  // the address on load; a new shift is the practice set again.
  tab.ask('HD-2151', 'what');
  assert.doesNotMatch(tab.location.search, /student=/, 'the address no longer names the student');
  assert.deepEqual(tab.reload().progress('HD-2151').chatAsked, ['what']);
  tab.run('hdResetShift()');
  assert.deepEqual(Array.from(tab.hd().tickets, (t) => t.id).sort(), [...SET].sort());
}

// Opening the practice tickets never touches the coached lab: its shift, its
// walkthrough record, or a Reset in the practice tab.
function testGuidedLabProgressUntouched() {
  const local = store();
  const lab = sim(launchUrl(), { local });
  lab.run("hdSelectTicket('HD-2150'); hdAssignTicket('HD-2150'); hdTransitionTicket('HD-2150', 'In Progress')"); lab.advance();
  const shift = local.getItem('defender-lab.helpdesk.state.v1');
  const resume = local.getItem('mnt.coach.resume');
  assert.ok(shift && resume);
  const practice = sim(practiceUrl(), { local });
  practice.ask('HD-2151', 'what');
  practice.run('hdResetShift()');
  assert.equal(local.getItem('defender-lab.helpdesk.state.v1'), shift, 'the coached lab\'s shift is unchanged');
  assert.equal(local.getItem('mnt.coach.resume'), resume, 'the walkthrough record is unchanged');
  const back = sim(launchUrl(false), { local });
  assert.equal(back.coachStep(), lab.coachStep(), 'the walkthrough resumes where it was');
}

/* ---------------------------------------------------- 1-A, Leah Brooks */

function testLeahCorrect() {
  const tab = sim(practiceUrl());
  workLeah(tab);
  const fb = tab.feedback('HD-2151');
  assert.deepEqual(fb.critical, []);
  assert.deepEqual(ok(fb), { 'Right owner': true, Investigation: true, Diagnosis: true, Action: true, Documentation: true });
  assert.equal(fb.areas[0].text, 'A known fix the Service Desk keeps.');
  const ticket = tab.ticket('HD-2151');
  assert.equal(ticket.status, 'Resolved');
  assert.equal(ticket.closureCode, 'Solution provided');
  assert.equal(ticket.resolution, LEAH_NOTE, 'the student\'s note is the resolution');
  const html = tab.open('HD-2151');
  assert.match(html, /Practice: not graded/);
  assert.match(html, /<strong>No critical errors\.<\/strong>/);
  assert.doesNotMatch(html, /\bpoints?\b|\bscore\b|\/ ?100|\b\d+ ?%/i, 'never points or a score');
  // The chat waited for the reset before Leah could sign in.
  const before = sim(practiceUrl('student-m01t0002'));
  before.ask('HD-2151', 'signin');
  assert.match(before.open('HD-2151'), /I haven&#39;t set a new one yet\.|I haven't set a new one yet\./);
}

function testLeahCriticalErrors() {
  const tab = sim(practiceUrl());
  const id = 'HD-2151';
  // Helping before verifying: refused and recorded.
  tab.act(id, 'reset-page');
  assert.match(tab.toasts.at(-1), /^Critical error\. Verify Leah before you help/);
  assert.deepEqual(tab.progress(id).actions, [], 'the reset wasn\'t done');
  tab.act(id, 'tell');
  assert.match(tab.toasts.at(-1), /^Critical error\. IT can never see a user's password/);
  tab.act(id, 'set-easy');
  assert.match(tab.open(id), /class="callout bad" role="alert">Critical error\. The help desk never sets a password/);
  tab.verify(id, 'name');
  assert.match(tab.open(id), /Not verification\. Anyone can learn a name and a department/);
  tab.verify(id, 'password');
  const fb = tab.feedback(id);
  assert.deepEqual(fb.critical, ['Chose: Ask Leah for her old password so you can check it', 'Helped before verifying the caller', 'Tell Leah what her password is', 'Set an easy password for Leah and read it to her']);
  assert.equal(ok(fb).Action, false);
  assert.match(tab.open(id), /<strong>Critical errors<\/strong>/);
  // A wrong owner: the feedback says who should own it.
  tab.own(id, 'desktop');
  assert.match(tab.open(id), /Not the right owner: a forgotten password is a known fix the Service Desk keeps/);
  assert.equal(ok(tab.feedback(id))['Right owner'], false);
}

/* ------------------------------------------------------ 1-B, Ravi Shah */

function testRaviCorrect() {
  const tab = sim(practiceUrl());
  workRavi(tab);
  const fb = tab.feedback('HD-2152');
  assert.deepEqual(fb.critical, []);
  assert.deepEqual(ok(fb), { 'Right owner': true, Investigation: true, Diagnosis: true, Action: true, Documentation: true });
  const ticket = tab.ticket('HD-2152');
  assert.equal(ticket.status, 'Escalated');
  assert.equal(ticket.assignedTechnician, 'Desktop Support');
  // A handoff note needs a Next action once the ticket leaves Tier 1: the
  // escalation waits for it (Codex, round 1).
  const short = sim(practiceUrl('student-m01t0003'));
  short.kb('HD-2152', 'damaged laptop', 'KB-0071');
  short.act('HD-2152', 'loaner');
  short.note('HD-2152', RAVI_NOTE.replace(/\nNext action:.*$/, ''));
  short.comment('HD-2152', RAVI_COMMENT);
  short.own('HD-2152', 'desktop');
  assert.match(short.toasts.at(-1), /^Not closed yet\. Write the handoff note \(Reported \/ Tried \/ Result \/ Next action\)/);
  assert.notEqual(short.ticket('HD-2152').status, 'Escalated');
  assert.match(short.open('HD-2152'), /Right owner: physical damage goes to Desktop Support[\s\S]*Not closed yet\./, 'the owner feedback still shows');
  short.note('HD-2152', RAVI_NOTE);
  short.own('HD-2152', 'desktop');
  assert.equal(short.ticket('HD-2152').status, 'Escalated');
}

// The owner choice never closes a ticket before its work is done, and a
// changed choice never leaves another route's fields behind (Codex, round 1).
function testOwnerChoiceWaitsAndRestoresFields() {
  const tab = sim(practiceUrl());
  const id = 'HD-2151';
  tab.own(id, 'servicedesk');
  assert.match(tab.toasts.at(-1), /^Not closed yet\. Verify Leah first/);
  const before = tab.ticket(id);
  assert.equal(before.status, 'New', 'not resolved from the first screen');
  assert.equal(before.resolution, '');
  assert.equal(tab.progress(id).owner, 'servicedesk', 'the choice is recorded');
  workLeah(tab);
  assert.equal(tab.ticket(id).status, 'Resolved', 'closed once the work is done');
  // Re-routing Leah to the SOC would escalate her ticket, and her note has no
  // Next action, so it waits: the ticket opens again, with its own fields and
  // no closure from the earlier choice (Codex, round 2).
  tab.own(id, 'soc');
  const reopened = tab.ticket(id);
  assert.equal(reopened.status, 'In Progress', 'no longer shown as resolved');
  assert.equal(reopened.assignedTechnician, 'Riley Morgan');
  assert.equal(reopened.closureCode, '');
  assert.equal(reopened.resolution, '');
  assert.equal(reopened.category, 'Access');
  assert.equal(reopened.callerStatus, undefined);
  assert.match(tab.open(id), /Not closed yet\. Write a Reported \/ Tried \/ Result note/);
  tab.own(id, 'servicedesk');
  assert.equal(tab.ticket(id).status, 'Resolved', 'the right choice closes it again');
  // SEC-2153 routed to the SOC, then to the Service Desk: the SOC route's
  // fields go, and the ticket's own category comes back.
  workKaren(tab);
  let ticket = tab.ticket('SEC-2153');
  assert.equal(ticket.category, 'Security');
  assert.equal(ticket.callerStatus, 'Unverified');
  tab.own('SEC-2153', 'servicedesk');
  ticket = tab.ticket('SEC-2153');
  assert.equal(ticket.status, 'Resolved');
  assert.equal(ticket.category, 'Access', 'back to the ticket\'s own category');
  assert.equal(ticket.subcategory, 'Password reset request');
  assert.equal(ticket.callerStatus, undefined, 'no caller status left behind');
  assert.equal(ticket.assignedTechnician, 'Riley Morgan');
  assert.equal(ok(tab.feedback('SEC-2153'))['Right owner'], false);
}

function testRaviCriticalErrors() {
  const tab = sim(practiceUrl());
  const id = 'HD-2152';
  tab.act(id, 'diy');
  assert.match(tab.toasts.at(-1), /^Critical error\. Tier 1 doesn't repair hardware/);
  tab.act(id, 'promise');
  assert.match(tab.toasts.at(-1), /^Critical error\. Never promise a repair date/);
  tab.ask(id, 'when'); tab.ask(id, 'starts'); tab.ask(id, 'files');
  tab.own(id, 'servicedesk');
  const fb = tab.feedback(id);
  assert.deepEqual(fb.critical, ['Tell Ravi how to take the screen off and replace it himself', 'Promise Ravi the screen will be fixed by Wednesday']);
  assert.equal(ok(fb).Investigation, false, 'the safety question was skipped');
  assert.match(fb.areas.find((row) => row.area === 'Investigation').text, /whether any glass is loose \(the safety question\)/);
  assert.equal(ok(fb)['Right owner'], false);
  assert.match(tab.open(id), /Not the right owner: Tier 1 doesn't repair hardware/);
}

/* ------------------------------------------- 1-C, the unverified caller */

function testKarenCorrect() {
  const tab = sim(practiceUrl());
  workKaren(tab);
  const id = 'SEC-2153';
  const fb = tab.feedback(id);
  assert.deepEqual(fb.critical, []);
  assert.deepEqual(ok(fb), { 'Right owner': true, Investigation: true, Diagnosis: true, Action: true, Documentation: true });
  const ticket = tab.ticket(id);
  assert.equal(ticket.status, 'Escalated');
  assert.equal(ticket.assignedTechnician, 'Security Operations (SOC)');
  assert.equal(ticket.category, 'Security');
  assert.equal(ticket.subcategory, 'Suspicious request');
  assert.equal(ticket.callerStatus, 'Unverified');
  assert.equal(ticket.closureCode, 'Routed to Security Operations');
  const html = tab.open(id);
  assert.match(html, /hd-badge bad">Caller unverified/);
  assert.match(html, /<span>Caller<\/span><strong>Unverified<\/strong>/);
  assert.match(html, /She declines the callback, so the caller can't be verified|She declines the callback, so the caller can&#39;t be verified/);
  assert.equal(tab.run("hdUserById('u-1016').locked"), false, 'no change to the account');
  // The note must say the Service Desk calls Mr. Alvarez back on his
  // directory number; offering a callback isn't the same.
  const missing = sim(practiceUrl('student-m01t0004'));
  workKaren.call(null, { ...missing, note: (i, text) => missing.note(i, text.replace(/\nNext action:.*$/, '\nNext action: wait for the SOC.')) });
  assert.equal(ok(missing.feedback(id)).Documentation, false);
  // Social engineering, never "vishing" (Module 11).
  const words = JSON.stringify(tab.run("HD_TICKET_TEMPLATES.filter((t) => ['HD-2151', 'HD-2152', 'SEC-2153'].includes(t.id))"));
  assert.doesNotMatch(words, /vishing/i);
  assert.match(fb.areas.find((row) => row.area === 'Diagnosis').text, /Social engineering/);
}

function testKarenCriticalErrors() {
  const tab = sim(practiceUrl());
  const id = 'SEC-2153';
  tab.verify(id, 'given');
  assert.match(tab.open(id), /Not verification\. KB-0024 never uses a number the caller gives you/);
  tab.verify(id, 'accept');
  assert.equal(tab.progress(id).verification.criticalErrors.length, 0, 'wrong, but not a critical error');
  tab.act(id, 'reset-text');
  assert.match(tab.toasts.at(-1), /^Critical error\. Never reset an account for a caller you can't verify/);
  tab.act(id, 'reset-karen');
  tab.own(id, 'servicedesk');
  const fb = tab.feedback(id);
  assert.deepEqual(fb.critical, ['Reset Mr. Alvarez\'s password and text the new one to 407-555-0199', 'Reset the password and give it to Karen to pass on']);
  assert.equal(ok(fb).Action, false);
  assert.equal(ok(fb)['Right owner'], false);
  assert.match(fb.areas[0].text, /route the ticket to Security Operations \(KB-0024\)/);
}

// Closing a ticket opens "Check my work" by itself, so missing Investigation
// or Diagnosis shows at once; it never blocks the close (by design, reviewed
// after Codex on 0115826) and never scores.
function testClosingOpensTheFeedback() {
  const tab = sim(practiceUrl());
  const id = 'SEC-2153';
  // The record work only: callback offered, declined, note and comment. No
  // identify questions, no KB search, no diagnosis.
  tab.verify(id, 'callback');
  tab.act(id, 'decline');
  tab.note(id, KAREN_NOTE);
  tab.comment(id, ALVAREZ_COMMENT);
  const shown = () => tab.run("hdConsoleState(hdTicketById('SEC-2153')).feedbackShown");
  assert.equal(shown(), false, 'not open before closing');
  assert.doesNotMatch(tab.open(id), /data-area="Investigation"/);
  tab.own(id, 'soc');
  assert.equal(tab.ticket(id).status, 'Escalated', 'closing is never blocked by Investigation or Diagnosis');
  assert.equal(shown(), true, 'closing opened it');
  const html = tab.open(id);
  assert.match(html, /<li data-area="Investigation" data-ok="no">○ <strong>Investigation:<\/strong> Ask whose account it is/);
  assert.match(html, /<li data-area="Diagnosis" data-ok="no">○ <strong>Diagnosis:<\/strong>/);
  assert.match(html, /<li data-area="Action" data-ok="yes">/);
  const card = html.match(/<div class="card hd-practice-feedback">[\s\S]*?Check again<\/button>/)[0];
  assert.match(card, /Practice: not graded/);
  assert.doesNotMatch(card, /\bpoints?\b|\bscore\b|\/ ?100/i);
  // A blocked choice doesn't open it.
  const other = sim(practiceUrl('student-m01t0005'));
  other.own('HD-2151', 'servicedesk');
  assert.doesNotMatch(other.open('HD-2151'), /data-area="Investigation"/, 'not closed, so not opened');
}

/* -------------------------------- feedback never judges category or priority */

function testFeedbackNeverScoresCategoryOrPriority() {
  const tab = sim(practiceUrl());
  for (const id of SET) {
    const fb = tab.feedback(id);
    assert.deepEqual(fb.areas.map((row) => row.area), ['Right owner', 'Investigation', 'Diagnosis', 'Action', 'Documentation']);
    const html = tab.open(id);
    const card = html.match(/<div class="card hd-practice-feedback">[\s\S]*?Check again<\/button>/)[0];
    assert.match(card, /Practice: not graded/);
    assert.match(card, /Category and priority are pre-set in Module 1\./);
    assert.doesNotMatch(card, /\bpoints?\b|\bscore\b|\/ ?100/i);
    fb.areas.forEach((row) => assert.doesNotMatch(row.text, /\bpriority\b|\bP[1-4]\b/i, `${id} ${row.area}`));
    // Each line's label is printed once (staging, 2026-11-10).
    fb.areas.forEach((row) => assert.ok(!row.text.startsWith(`${row.area}:`), `${id}: "${row.area}:" not repeated`));
  }
  const done = sim(practiceUrl('student-m01t0006'));
  workLeah(done); workRavi(done); workKaren(done);
  for (const id of SET) {
    assert.ok(done.feedback(id).areas.every((row) => row.ok && !row.text.startsWith(`${row.area}:`)), id);
    assert.doesNotMatch(done.open(id), /<strong>Right owner:<\/strong> Right owner:/, id);
  }
  // A password anywhere is refused here too.
  assert.equal(tab.note('HD-2151', 'Reported: x. Tried: pw: Test2026z. Result: y.'), false);
  assert.match(JSON.stringify(tab.feedback('HD-2151').flags), /Wrote a password in a ticket field/);
}

/* -------------------------------------------- nothing reaches the portal */

function testNothingSentToThePortal() {
  const opener = fakeOpener();
  const tab = sim(practiceUrl(), { opener });
  workLeah(tab); workRavi(tab); workKaren(tab);
  assert.deepEqual(opener.sent, [], 'no message to the course page');
}

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
function testModuleOnePageLinksTheSet() {
  const user = { userId: 'user-m01t', email: 'm01t@test.invalid', trackCode: 'HDESK', enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {}, latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {} };
  const html = prun("MODULE_LABS['it-support/1']").view(user, HD);
  const student = prun('LabRuntime').anonymousStudentId(user);
  assert.match(html, /<h2 id="its01-practice-tickets-title">Unguided tickets \(not graded\)<\/h2>/);
  assert.ok(html.includes(`?practice=its-01&amp;student=${student}#/helpdesk/tickets`) || html.includes(`?practice=its-01&student=${student}#/helpdesk/tickets`));
  assert.match(html, /data-its01-practice-launch[^>]*rel="noopener"/);
  assert.match(html, /Nothing is graded or sent to your instructor\./);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [
    testPracticeSetShift, testGuidedLabProgressUntouched,
    testLeahCorrect, testLeahCriticalErrors, testRaviCorrect, testRaviCriticalErrors, testOwnerChoiceWaitsAndRestoresFields, testClosingOpensTheFeedback,
    testKarenCorrect, testKarenCriticalErrors, testFeedbackNeverScoresCategoryOrPriority,
    testNothingSentToThePortal, testModuleOnePageLinksTheSet,
  ];
  for (const test of tests) await test();
  console.log(`hdesk-m01-practice-tickets: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

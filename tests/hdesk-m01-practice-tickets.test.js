// Help Desk Module 1 Practice It, unguided tickets 1-A to 1-D (not graded):
// HD-2151 (Leah Brooks, forgotten password), HD-2152 (Ravi Shah, cracked
// screen, KB-0071), SEC-2153 (an unverified caller wants an executive's
// password) and HD-2154 (Hana Okafor's team printer, KB-0059; its own file,
// tests/hdesk-m01-ticket-1d.test.js, covers the laptop step). Opened from the Module 1 page as a practice set (?practice=its-01,
// ui/helpdesk.js), worked with the console features, with "Check my work"
// feedback by the spec's rubric areas: never points, and category and
// priority (pre-set in Module 1) never judged.
//
//   - The practice set: only its four tickets, its own saved shift, no coach;
//     the coached lab's shift and walkthrough progress stay untouched.
//   - Each ticket worked correctly: every area met, no critical error.
//   - Each ticket's critical errors: recorded, shown at once and listed first.
//   - Right owner: Tier 1, Desktop Support per KB-0071, or the SOC route
//     (Category Security › Suspicious request, Caller Unverified).
//   - Lab 1.2's completion: once all four are closed, one message to the
//     course page (ticket ids only, no answers, no score), answered and then
//     never sent again; a retry when it wasn't saved. The Module 1 page links
//     the set (tests/hdesk-m01-practice-lab.test.js covers the page's save).
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
const SET = ['HD-2151', 'HD-2152', 'SEC-2153', 'HD-2154'];
const ok = (fb) => Object.fromEntries(fb.areas.map((row) => [row.area, row.ok]));

const LEAH_NOTE = 'Reported: user returning from 2 weeks\' leave, forgot password; asked us to tell her or set an easy one.\nTried: identity verified per KB-0024 (callback + employee ID match); explained we can\'t view or set passwords; guided user through the self-service reset page per KB-0024.\nResult: user set a new password and signed in on the call.';
const LEAH_COMMENT = 'Hi Leah, welcome back! You\'re signed in with your new password. For your security, IT can never see or choose your password, so the self-service page is the fastest way if you forget it again. It\'s linked on the sign-in screen. – Riley';
const RAVI_NOTE = 'Reported: laptop NS-LT-0215 dropped today; screen cracked in one corner, still usable; no loose glass; client demo Thursday.\nTried: verified identity per KB-0024 (callback + employee ID); device starts; user\'s files are in OneDrive per user; per KB-0071, offered loaner (user collecting 14:00); escalated to Desktop Support for screen repair or replacement.\nResult: pending Tier 2; user informed of next steps.\nNext action: Desktop Support repairs or replaces the screen and contacts Ravi.';
const RAVI_COMMENT = 'Hi Ravi, sorry about the laptop! Please bring it to the Service Desk today and we\'ll give you a loaner so you\'re ready for Thursday\'s demo. Our desktop team will repair or replace the screen and let you know when it\'s ready. If any glass comes loose, stop using it. – Riley';
const KAREN_NOTE = 'Reported: caller "Karen, CFO office" requested reset of ralvarez with the new one texted to 407-555-0199 (not in directory). Exact words: "reset his password and text the new one to his personal cell. Please hurry, he\'s furious." Time 11:02.\nTried: caller not verifiable; offered a callback to Mr. Alvarez\'s directory mobile, declined by caller; declined per KB-0024; no account changes; suspected social engineering.\nResult: routed to Security Operations 11:05.\nNext action: Security Operations reviews and contacts the account owner.';
const KAREN_COMMENT = 'Hi Karen, I understand this is urgent. For security, we can only reset a password after we verify the account owner with a callback to the number in our directory, so I can\'t make this change or send a password to another number. I\'ve passed your request to our security team, who will contact Mr. Alvarez directly. – Riley, Northstar Service Desk';
const HANA_NOTE = 'Reported: user moved desks; team printer missing from her printer list; needs to print a refund form this morning.\nTried: per KB-0059, on NS-LT-0188 added NS-CS-PRN02 from Settings › Printers & scanners › Add device.\nResult: user printed a test page and confirmed.';
const HANA_COMMENT = 'Hi Hana, the Customer Service printer is now on your laptop, and your test page printed. If it ever disappears from your list, reply here and we\'ll add it again. – Riley';

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
  tab.verify(id, 'callback');
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
  assert.equal(tab.comment(id, KAREN_COMMENT), true);
  tab.own(id, 'soc');
}
function workHana(tab) {
  const id = 'HD-2154';
  tab.ask(id, 'which'); tab.ask(id, 'see');
  tab.kb(id, 'add printer', 'KB-0059');
  tab.diagnose(id, 'The printer is missing from her laptop: nothing is broken');
  tab.run("hdSelectComputer('NS-LT-0188'); hdSettingsScan(); hdSettingsAddPrinter('NS-LT-0188', '\\\\\\\\NS-PRINT01\\\\NS-CS-PRN02')");
  tab.ask(id, 'test');
  assert.equal(tab.note(id, HANA_NOTE), true);
  assert.equal(tab.comment(id, HANA_COMMENT), true);
  tab.own(id, 'servicedesk');
}

/* ------------------------------------------------------ the practice set */

function testPracticeSetShift() {
  const tab = sim(practiceUrl());
  assert.deepEqual(Array.from(tab.hd().tickets, (t) => t.id).sort(), [...SET].sort(), 'only the four practice tickets');
  assert.equal(tab.coachStep(), undefined, 'no coach');
  assert.ok(tab.local.getItem(`defender-lab.helpdesk.practice.v1.its-01.${STUDENT}`), 'its own saved shift');
  assert.equal(tab.local.getItem('defender-lab.helpdesk.state.v1'), null, 'the coached lab\'s shift is not touched');
  for (const id of SET) {
    const html = tab.open(id);
    ['hd-chat', 'hd-kb-search', 'hd-actions', 'hd-owner', 'hd-comments', 'hd-practice-feedback', 'hd-priority-preset'].forEach((cls) => assert.match(html, new RegExp(`class="card ${cls}"|class="${cls}"`), `${id}: ${cls}`));
    assert.doesNotMatch(html, /hdSetTicketPriority|hdResolveTicket/, `${id}: priority read-only, no Resolve button (the owner choice closes it)`);
    assert.doesNotMatch(html, /<option>Resolved<\/option>|<option>Escalated<\/option>/, `${id}: the state list can't close it`);
    assert.doesNotMatch(html, /<label>Next state/, `${id}: no Next state list (one close control)`);
    assert.doesNotMatch(html, /Gather the evidence yourself with the tools|Available logs and evidence/, `${id}: no Event Viewer, Active Directory or PowerShell evidence card`);
    assert.match(html, /<span>Contact type<\/span>/);
  }
  assert.match(tab.open('HD-2151'), /Pre-set: P4: one person, no deadline today\./);
  assert.match(tab.open('HD-2152'), /Pre-set: P3: one person, with a deadline this week\./);
  assert.match(tab.open('HD-2152'), /<span>Configuration item<\/span><strong>NS-LT-0215<\/strong>/);
  assert.match(tab.open('SEC-2153'), /Pre-set: P2: an executive account at risk, and the caller is pushing for speed\./);
  // The state list refuses to close a ticket with an owner choice, too.
  tab.run("hdState.tickets.find((t) => t.id === 'HD-2151').status = 'In Progress'; hdTransitionTicket('HD-2151', 'Resolved')");
  assert.match(tab.toasts.at(-1), /closes through its own control/);
  assert.equal(tab.ticket('HD-2151').status, 'In Progress');

  // KB: symptom words find the right article first; KB-0071 as written.
  const first = (q) => tab.run(`hdKbSearchArticles(${JSON.stringify(q)}, hdKbArticles())[0].id`);
  assert.equal(first('forgot password'), 'KB-0024');
  assert.equal(first('damaged laptop'), 'KB-0071');
  assert.equal(first('cracked screen laptop'), 'KB-0071');
  assert.equal(first('add printer'), 'KB-0059');
  assert.equal(first('printer missing'), 'KB-0059', 'found by its keywords');
  assert.equal(first('team printer'), 'KB-0059');
  assert.equal(first('add device'), 'KB-0059');
  assert.equal(first('department printer'), 'KB-0059');
  // KB-0059 is found by its ID, title and keywords only: its rule "Never ask
  // for the user's password" doesn't list it for a password search.
  const all = (q) => [...tab.run(`hdKbSearchArticles(${JSON.stringify(q)}, hdKbArticles()).map((a) => a.id)`)];
  for (const q of ['forgot password', 'password', 'password reset']) assert.ok(!all(q).includes('KB-0059'), `"${q}": ${all(q)}`);
  assert.equal(all('KB-0059')[0], 'KB-0059', 'still found first by its ID');
  const kb71 = tab.run("HD_KB_ARTICLES.find((a) => a.id === 'KB-0071').summary");
  ['Tier 1 does not repair hardware', 'asset tag and what happened', 'glass is loose', 'stop using the laptop', 'Verify the user before handing over a loaner (KB-0024)', 'Offer a loaner', 'Escalate to Desktop Support'].forEach((text) => assert.ok(kb71.includes(text), text));
  // The people and the laptop.
  const dir = tab.view('helpdesk/directory');
  assert.match(dir, /Leah Brooks[\s\S]*Marketing/);
  assert.match(dir, /Ravi Shah[\s\S]*Sales/);
  assert.match(dir, /Martin Alvarez[\s\S]*Executive Office[\s\S]*mobile 407-555-0142/);
  assert.match(dir, /Hana Okafor[\s\S]*E-46415[\s\S]*Customer Service[\s\S]*ext\. 4687/);
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

// A practice set saved when it had three tickets gets HD-2154, fresh; the
// other three keep their work, and a saved completion stays saved.
function testThreeTicketSetGetsHd2154() {
  const local = store();
  const old = sim(practiceUrl('student-m01t0010'), { local });
  old.ask('HD-2151', 'what');
  old.note('HD-2152', 'Reported: cracked screen this morning on the laptop.');
  old.run("hdState.tickets = hdState.tickets.filter((t) => t.id !== 'HD-2154'); delete hdState.machines['NS-LT-0188']; hdSave()");
  assert.deepEqual(Array.from(old.hd().tickets, (t) => t.id).sort(), ['HD-2151', 'HD-2152', 'SEC-2153']);
  const reopened = sim(practiceUrl('student-m01t0010'), { local });
  assert.deepEqual(Array.from(reopened.hd().tickets, (t) => t.id).sort(), [...SET].sort(), 'HD-2154 joins the set');
  assert.deepEqual(reopened.progress('HD-2151').chatAsked, ['what'], 'the other tickets keep their work');
  assert.equal(reopened.ticket('HD-2152').notes.at(-1).text, 'Reported: cracked screen this morning on the laptop.');
  assert.equal(reopened.ticket('HD-2154').status, 'New', 'the new ticket starts fresh');
  assert.deepEqual([...reopened.hd().machines['NS-LT-0188'].printers], ['Microsoft Print to PDF'], 'with its laptop');
  // Saved, it stays four on the next load.
  assert.equal(sim(practiceUrl('student-m01t0010'), { local }).hd().tickets.length, 4);
  // A completion saved under three tickets stays saved.
  const done = store();
  const finished = sim(practiceUrl('student-m01t0011'), { local: done });
  finished.run("hdState.tickets = hdState.tickets.filter((t) => t.id !== 'HD-2154'); hdState.practiceSaved = true; hdSave()");
  const later = sim(practiceUrl('student-m01t0011'), { local: done });
  assert.equal(later.hd().practiceSaved, true);
  assert.equal(notice(later)[0], 'saved');
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
  // The loaner waits for the caller check (KB-0071, KB-0024): refused, and
  // not a critical error.
  short.act('HD-2152', 'loaner');
  assert.match(short.toasts.at(-1), /^Not yet\. KB-0071 says to verify the user before handing over a loaner/);
  assert.deepEqual(short.progress('HD-2152').actions, [], 'no loaner before verifying');
  assert.deepEqual(short.progress('HD-2152').critical, [], 'not a critical error');
  assert.match(short.open('HD-2152'), /class="callout warn" role="status">Not yet\. KB-0071/);
  assert.ok(short.open('HD-2152').indexOf('hd-verify') < short.open('HD-2152').indexOf('hd-chat'), 'Verify caller sits under the requester statement');
  short.verify('HD-2152', 'name');
  assert.equal(short.progress('HD-2152').verification.passed, false, 'a name and department are not verification');
  short.verify('HD-2152', 'callback');
  assert.match(short.open('HD-2152'), /You called Ravi back on ext\. 4315 from the User Directory, and Ravi confirmed employee ID E-44027\./);
  short.act('HD-2152', 'loaner');
  assert.deepEqual(short.progress('HD-2152').actions, ['loaner']);
  short.note('HD-2152', RAVI_NOTE.replace(/\nNext action:.*$/, ''));
  short.comment('HD-2152', RAVI_COMMENT);
  short.own('HD-2152', 'desktop');
  assert.match(short.toasts.at(-1), /^Not closed yet\. Write the handoff note \(Reported \/ Tried \/ Result \/ Next action\)/);
  assert.notEqual(short.ticket('HD-2152').status, 'Escalated');
  // The owner card keeps showing what is missing, not only the toast; once
  // the work is done it says so, before the choice is made again.
  assert.match(short.open('HD-2152'), /Right owner: physical damage goes to Desktop Support[\s\S]*data-hd-owner-blocked>Not closed yet\. Write the handoff note/, 'the owner feedback and what is missing still show');
  short.ask('HD-2152', 'when');
  assert.match(short.open('HD-2152'), /data-hd-owner-blocked>Not closed yet\. Write the handoff note/, 'still there after another redraw');
  short.note('HD-2152', RAVI_NOTE);
  assert.match(short.open('HD-2152'), /data-hd-owner-blocked>Ready to close\./, 'updated once the gap is fixed');
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

// The owner card's "Not closed yet" names only HD-2152's Action steps still
// missing, not the whole Action hint again.
function testOwnerCardNamesOnlyWhatIsMissing() {
  const tab = sim(practiceUrl('student-m01t0007'));
  const id = 'HD-2152';
  tab.own(id, 'desktop');
  const blocked = () => (/data-hd-owner-blocked>([^<]*)</.exec(tab.open(id)) || [null, ''])[1].replace(/&quot;/g, '"');
  assert.equal(blocked(), 'Not closed yet. Search the KB (for example "damaged laptop") and open KB-0071. Verify Ravi with a callback on his directory number and his employee ID (KB-0024). Offer Ravi a loaner.');
  tab.kb(id, 'damaged laptop', 'KB-0071');
  tab.verify(id, 'callback');
  assert.equal(blocked(), 'Not closed yet. Offer Ravi a loaner.', 'only the step still missing');
  tab.own(id, 'desktop');
  assert.equal(tab.toasts.at(-1), 'Not closed yet. Offer Ravi a loaner.');
  tab.act(id, 'loaner');
  // Action done: Documentation's hint has no per-check lines, so it shows whole.
  assert.match(blocked(), /^Not closed yet\. Write the handoff note \(Reported \/ Tried \/ Result \/ Next action\)/);
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
  // Documentation needs the caller's exact words (in quotes), the number,
  // the time, and a Next action for Security Operations; the comment is a
  // polite decline to Karen. The old "call Mr. Alvarez back" checks are gone.
  const docs = (note, comment = KAREN_COMMENT, student = 'student-m01t0004') => {
    const other = sim(practiceUrl(student));
    workKaren.call(null, { ...other, note: (i) => other.note(i, note), comment: (i) => other.comment(i, comment) });
    return ok(other.feedback(id)).Documentation;
  };
  assert.equal(docs(KAREN_NOTE), true, 'the model note and the reply to Karen pass');
  assert.equal(docs(KAREN_NOTE.replace(/\b\d{2}:\d{2}\b/g, 'this morning')), false, 'no time');
  assert.equal(docs(KAREN_NOTE.replace(/"/g, '')), false, 'no exact words in quotes');
  assert.equal(docs(KAREN_NOTE.replace(/\nNext action:.*$/, '\nNext action: none needed.')), false, 'a Next action that names nobody');
  assert.equal(docs(KAREN_NOTE.replace(/11:0([25])/g, '11.0$1')), true, 'a time written 11.05 counts');
  assert.equal(docs(KAREN_NOTE.replace(/"/g, '\u201c').replace(/\u201c([^\u201c]*)\u201c/g, '\u201c$1\u201d')), true, 'curly quotes count');
  assert.equal(docs(KAREN_NOTE, 'Hi, for security we can only reset a password after a callback to the number in our directory. – Riley'), true, 'a polite decline without her name: plain words are what is checked');
  assert.equal(docs(KAREN_NOTE, 'Per KB-0024 the SOC has it.'), false, 'internal words in the comment');
  assert.doesNotMatch(JSON.stringify(tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'SEC-2153')")), /Service Desk (then )?calls Mr\. Alvarez back|Service Desk will call Mr\. Alvarez back|addressed to Mr\. Alvarez/, 'no Service Desk callback after routing (offering the callback while verifying stays)');
  // "Your note needs" lists the ticket's own items, and ticks them live.
  const needs = (text) => JSON.parse(JSON.stringify(tab.run(`hdNoteNeeds(hdTicketById('SEC-2153'), ${JSON.stringify(text)})`)));
  assert.deepEqual(needs('').map((row) => row.label), ['Reported', 'Tried', 'Result', 'Next action', 'The caller\'s exact words, in quotes', 'The number: 407-555-0199', 'The time (for example 11:05)'], 'escalated: Next action is required');
  assert.deepEqual(needs('Reported - caller "Karen" asked at 11:02 for 407-555-0199.').map((row) => row.ok), [true, false, false, false, true, true, true], 'a dash label at the start counts');
  assert.ok(needs(KAREN_NOTE).every((row) => row.ok), 'the model note ticks every item');
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
  tab.comment(id, KAREN_COMMENT);
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
    assert.equal((card.match(/Practice: not graded/g) || []).length, 1, `${id}: "Practice: not graded" once`);
    assert.match(card, /Category and priority are pre-set in Module 1\./);
    assert.doesNotMatch(card, /\bpoints?\b|\bscore\b|\/ ?100/i);
    fb.areas.forEach((row) => assert.doesNotMatch(row.text, /\bpriority\b|\bP[1-4]\b/i, `${id} ${row.area}`));
    // Each line's label is printed once (staging, 2026-11-10).
    fb.areas.forEach((row) => assert.ok(!row.text.startsWith(`${row.area}:`), `${id}: "${row.area}:" not repeated`));
  }
  const done = sim(practiceUrl('student-m01t0006'));
  workLeah(done); workRavi(done); workKaren(done); workHana(done);
  for (const id of SET) {
    assert.ok(done.feedback(id).areas.every((row) => row.ok && !row.text.startsWith(`${row.area}:`)), id);
    assert.doesNotMatch(done.open(id), /<strong>Right owner:<\/strong> Right owner:/, id);
  }
  // A password anywhere is refused here too.
  assert.equal(tab.note('HD-2151', 'Reported: x. Tried: pw: Test2026z. Result: y.'), false);
  assert.match(JSON.stringify(tab.feedback('HD-2151').flags), /Wrote a password in a ticket field/);
}

/* ------------------------------- Lab 1.2's completion reaches the portal */

const notice = (tab) => (/data-hd-practice-notice="([a-z]+)"[^>]*>([\s\S]*?)<\/div>/.exec(tab.view('helpdesk/tickets')) || [null, '', '']).slice(1);

// Nothing until every ticket is closed; then one message with the ticket ids
// only. Once the course page confirms, nothing is ever sent again.
function testCompletionSentOnceAllClosed() {
  const opener = fakeOpener();
  const tab = sim(practiceUrl(), { opener });
  workLeah(tab); workRavi(tab); workKaren(tab);
  assert.deepEqual(opener.sent, [], 'three of four closed: nothing sent');
  assert.equal(notice(tab)[0], '', 'no notice yet');
  workHana(tab);
  assert.equal(opener.sent.length, 1, 'all four closed: one message');
  const [{ data, origin }] = opener.sent;
  assert.equal(origin, PORTAL);
  assert.deepEqual(Object.keys(data).sort(), ['id', 'nonce', 'student', 'tickets', 'type']);
  assert.deepEqual([data.type, data.id, data.student, data.tickets], ['mnt-practice-complete', 'its-01', STUDENT, SET]);
  assert.equal(notice(tab)[0], 'sending');
  assert.match(notice(tab)[1], /You’ve finished every ticket\. Saving your completion/);
  // A reply for another nonce, or from another origin, changes nothing.
  tab.reply({ type: 'mnt-practice-received', id: 'its-01', nonce: 'other', saved: true });
  tab.reply({ type: 'mnt-practice-received', id: 'its-01', nonce: data.nonce, saved: true }, 'https://elsewhere.test');
  assert.equal(notice(tab)[0], 'sending');
  tab.reply({ type: 'mnt-practice-received', id: 'its-01', nonce: data.nonce, saved: true });
  assert.equal(tab.hd().practiceSaved, true);
  const [kind, text] = notice(tab);
  assert.equal(kind, 'saved');
  assert.match(text, /Practice complete \(not graded\)\./);
  assert.match(text, /saved that you finished every ticket in this set/);
  assert.match(text, /No score and no answers were sent\./);
  assert.doesNotMatch(text, /points?|\d+ ?%/i);
  // More work and a reload send nothing.
  tab.feedback('HD-2151');
  tab.run('hdRerender()');
  const again = tab.reload();
  again.run('hdRerender()');
  assert.equal(opener.sent.length, 1, 'never sent again once saved');
  assert.equal(notice(again)[0], 'saved');
}

// Not saved (no course page, signed out there, the save failed, no answer):
// the notice says why and offers a retry; the retry sends again.
function testCompletionRetry() {
  const alone = sim(practiceUrl('student-m01t0007'));
  workLeah(alone); workRavi(alone); workKaren(alone); workHana(alone);
  assert.deepEqual(notice(alone).slice(0, 1), ['unsaved']);
  assert.match(notice(alone)[1], /You’ve finished every ticket, but your completion isn’t saved yet\./);
  assert.doesNotMatch(notice(alone)[1], /closed/i);
  assert.match(notice(alone)[1], /Your course page isn.t open/);
  assert.match(notice(alone)[1], /Save my completion/);

  const opener = fakeOpener();
  const tab = sim(practiceUrl('student-m01t0008'), { opener });
  workLeah(tab); workRavi(tab); workKaren(tab); workHana(tab);
  tab.reply({ type: 'mnt-practice-received', id: 'its-01', nonce: opener.sent[0].data.nonce, saved: false, reason: 'signed-out' });
  assert.equal(notice(tab)[0], 'unsaved');
  assert.match(notice(tab)[1], /signed out on your course page/);
  tab.run('hdPracticeReport()');
  assert.equal(opener.sent.length, 2, 'the retry sends again');
  tab.reply({ type: 'mnt-practice-received', id: 'its-01', nonce: opener.sent[1].data.nonce, saved: true });
  assert.equal(notice(tab)[0], 'saved');

  // Reset shift starts the tickets again; the saved completion stays on the
  // account, so closing them again only asks once more (the page answers
  // "saved" without a second record).
  tab.run('hdResetShift()');
  assert.equal(tab.hd().practiceSaved, undefined);
  assert.equal(opener.sent.length, 2, 'reset sends nothing');
}

// A coached-lab shift or a Prove shift never sends a practice message.
function testOnlyThePracticeSetReports() {
  const opener = fakeOpener();
  const tab = sim(launchUrl(), { opener });
  tab.run('hdRerender()');
  assert.ok(!opener.sent.some((entry) => entry.data.type === 'mnt-practice-complete'));
  assert.equal(tab.run('hdPracticeNotice()'), '');
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
  assert.match(html, /<h2 id="its01-practice-tickets-title">Lab 1\.2 · Practice tickets \(not graded\)<\/h2>/);
  assert.ok(html.includes(`?practice=its-01&amp;student=${student}#/helpdesk/tickets`) || html.includes(`?practice=its-01&student=${student}#/helpdesk/tickets`));
  assert.match(html, /data-its01-practice-launch[^>]*rel="opener"/);
  assert.match(html, /Practice: not graded\. Your answers aren’t sent\./);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testThreeTicketSetGetsHd2154,
    testPracticeSetShift, testGuidedLabProgressUntouched,
    testLeahCorrect, testLeahCriticalErrors, testRaviCorrect, testRaviCriticalErrors, testOwnerCardNamesOnlyWhatIsMissing, testOwnerChoiceWaitsAndRestoresFields, testClosingOpensTheFeedback,
    testKarenCorrect, testKarenCriticalErrors, testFeedbackNeverScoresCategoryOrPriority,
    testCompletionSentOnceAllClosed, testCompletionRetry, testOnlyThePracticeSetReports, testModuleOnePageLinksTheSet,
  ];
  for (const test of tests) await test();
  console.log(`hdesk-m01-practice-tickets: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

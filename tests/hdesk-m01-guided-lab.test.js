// Help Desk Module 1 Practice It, Guided Lab 1: INC0010150 (HD-2150), Sam
// Rivera's lockout, worked with the console features (ui/helpdesk.js), the
// hd-m01 coach (ui/helpdesk-coaches.js), the Lab 1.2 save
// (portal/it-support-module-01.js) and its instructor sheet
// (portal/admin-sheets/hdesk.js).
//
//   - The lab shift: HD-2150 (shown as INC0010150) and the three service
//     requests; HD-2101 is gone from Module 1. No commands, no diagnosis.
//   - KB-0024 as rewritten on 2026-11-09, found by "locked out".
//   - The whole walkthrough, step by step, to Finish and the package.
//   - Unlock stays disabled until a passing verification choice; both
//     critical errors are recorded and unlock nothing.
//   - A password is refused in the chat, the customer comment and the note.
//   - Resolve (and Next state = Resolved) needs every outcome.
//   - The portal saves only a finished HD-2150; a critical error never blocks it.
//   - The instructor sheet: the verification, the comment and the note in full.
//   - A walkthrough saved before the change starts fresh.
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
const STUDENT = 'student-m01g0001';
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
    ticket: () => run("hdTicketById('HD-2150')"),
    progress: () => JSON.parse(JSON.stringify(run("hdConsoleProgress('HD-2150')"))),
    outcomes: () => ({ ...run("hdConsoleOutcomes(hdTicketById('HD-2150'))") }),
    open: () => { run("hdState.selectedTicketId = 'HD-2150'"); return tab.view('helpdesk/ticket'); },
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    ps: (command) => {
      input('hd-ps-input', command);
      run('hdRunPowerShell({ preventDefault() {} })');
      const rows = run('hdState.powershell');
      return rows[rows.length - 1].text;
    },
    filterEvents: (id, text = '') => { input('hd-ev-id', id); input('hd-ev-text', text); run('hdSetEventFilter({ preventDefault() {} })'); return tab.view('helpdesk/event-viewer'); },
    note: (text) => { input('hd-note-input', text); return run("hdAddNote('HD-2150')"); },
    comment: (text) => { input('hd-comment-input', text); return run("hdAddComment('HD-2150')"); },
    ask: (id) => run(`hdChatAsk('HD-2150', ${JSON.stringify(id)})`),
    verify: (id) => run(`hdVerify('HD-2150', ${JSON.stringify(id)})`),
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


const MODEL_NOTE = 'Reported: user locked out after several wrong password attempts this morning; on phones at 09:00.\nTried: identity verified per KB-0024 (callback to directory number + employee ID); account showed Locked; unlocked the account per KB-0024.\nResult: user signed in successfully on the call; told to contact us if it locks again (Tier 2 lockout-source check per KB-0024).';
const MODEL_COMMENT = 'Hi Sam, your account was locked after a few wrong password tries, and it\'s unlocked now. You\'re all set for the phones at 9. If it locks again today, reply to this email and we\'ll have our next-level team find out why. – Riley, Northstar Service Desk';
const step = (tab) => tab.coachStep();

// The walkthrough, done the way the spec's nine steps describe.
function walk(tab) {
  tab.advance();
  tab.run("hdSelectTicket('HD-2150'); hdAssignTicket('HD-2150'); hdTransitionTicket('HD-2150', 'In Progress')"); tab.advance();
  tab.ask('when'); tab.ask('changed'); tab.advance();
  tab.input('hd-kb-input', 'locked out'); tab.run("hdKbSearch({ preventDefault() {} }, 'HD-2150')");
  tab.run("hdKbOpen('HD-2150', 'KB-0024')"); tab.advance();
  tab.verify('callback'); tab.advance();
  tab.run("hdConsoleUnlock('HD-2150')"); tab.advance();
  tab.ask('signin'); tab.advance();
  tab.comment(MODEL_COMMENT); tab.advance();
  tab.note(MODEL_NOTE);
  tab.run("hdSetResolutionCode('HD-2150', 'Solution provided'); hdResolveTicket('HD-2150')"); tab.advance();
}
function finishedWork() {
  const opener = fakeOpener();
  const tab = sim(launchUrl(), { opener });
  walk(tab);
  tab.finish();
  return opener.sent.find((m) => m.data.type === 'mnt-coach-complete').data.work;
}

/* ------------------------------------------------------- the lab's shift */

function testShiftTicketAndKb() {
  const tab = sim(launchUrl());
  const ids = Array.from(tab.hd().tickets, (t) => t.id).sort();
  assert.deepEqual(ids, ['HD-2150', 'SR-2102', 'SR-2103', 'SR-2116'], 'HD-2101 is no longer in Module 1');
  assert.equal(tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m01').steps.length"), 10, 'nine steps, then Finish');
  assert.equal(tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m01').completionToken"), 'hd-m01');
  // Every step says why it matters.
  tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m01').steps.slice(0, 9)").forEach((s, i) => assert.match(s.body, /^Why: /, `step ${i + 1} says why`));
  const queue = tab.view('helpdesk/tickets');
  assert.match(queue, /<strong>INC0010150<\/strong>/, 'shown as INC0010150');
  assert.match(queue, /hdSelectTicket\('HD-2150'\)/);
  assert.equal(tab.run("hdUserById('u-1013').locked"), true, 'Sam starts locked');

  const html = tab.open();
  assert.match(html, /<h1>INC0010150<\/h1>/);
  assert.doesNotMatch(html, /Check diagnosis|hd-diagnosis-row|class="hd-path"|Available logs and evidence/, 'no diagnosis, checklist or "find the evidence with the tools" card');
  ['hd-chat', 'hd-kb-search', 'hd-verify', 'hd-account', 'hd-comments', 'hd-console-outcomes', 'hd-priority-preset'].forEach((cls) => assert.match(html, new RegExp(`class="(card )?${cls}"`), cls));
  assert.match(html, /Pre-set: P3: one person is affected/);
  assert.doesNotMatch(html, /hdSetTicketPriority/, 'priority is read-only');
  assert.match(html, /Resolution code \(required to resolve\)/);
  assert.match(html, /What password did you type\?/, 'the tempting wrong question is offered');

  // KB-0024, as rewritten: found first by "locked out".
  assert.equal(tab.run("hdKbSearchArticles('locked out', hdKbArticles())[0].id"), 'KB-0024');
  const kb = tab.run("hdKbArticles().find((a) => a.id === 'KB-0024').summary");
  assert.match(kb, /call them back on the phone number in the User Directory, never a number the caller gives you, and confirm their employee ID/);
  assert.doesNotMatch(kb, /manager/, 'no "confirm their manager"');
  assert.match(kb, /Never ask for, type or write down a user's password/);
  assert.match(kb, /self-service password reset page/);
  assert.match(kb, /unlock the account once/);
  assert.match(kb, /comes back within a day, escalate to Tier 2/);
  assert.match(kb, /Tier 2 only: find the lockout source\. Event 4740/);
  assert.match(kb, /Category Security › Suspicious request, set Caller to Unverified, and assign it to Security Operations \(SOC\) with the caller's exact words, number and time/);
  // Shown as a numbered list, escaped, on the ticket and on the KB page;
  // an article without numbered steps stays one paragraph (staging, 2026-11-09).
  tab.input('hd-kb-input', 'locked out'); tab.run("hdKbSearch({ preventDefault() {} }, 'HD-2150')"); tab.run("hdKbOpen('HD-2150', 'KB-0024')");
  const opened = tab.open();
  assert.equal((opened.match(/<ol class="hd-kb-steps"[\s\S]*?<\/ol>/)[0].match(/<li>/g) || []).length, 7, 'seven steps');
  assert.match(opened, /<li>Never ask for, type or write down a user&#39;s password|<li>Never ask for, type or write down a user's password/);
  const page = tab.view('helpdesk/knowledge-base');
  assert.match(page, /-TaskName &lt;task&gt; -User &lt;DOMAIN\\user&gt;/, 'placeholders are shown, not swallowed as tags');
  assert.equal((page.match(/<ol class="hd-kb-steps"/g) || []).length, 1, 'only KB-0024 has numbered steps');
  assert.match(page, /<p>Validate link state, DHCP reachability/, 'other articles stay one paragraph');
  const body = (text) => tab.run(`hdKbBody(${JSON.stringify(text)})`);
  assert.equal(body('Restart it. Open port 3389. Done.'), '<p>Restart it. Open port 3389. Done.</p>', 'a lone number is not a list');
  assert.match(body('Before you start: 1. Check A. 2. Check B.'), /^<p>Before you start:<\/p><ol[^>]*><li>Check A\.<\/li><li>Check B\.<\/li><\/ol>$/);
  assert.equal(body('2. Out of order. 3. Still.'), '<p>2. Out of order. 3. Still.</p>', 'steps must start at 1');
  // Sam is in the directory, with the details the callback uses.
  const dir = tab.view('helpdesk/directory');
  assert.match(dir, /Sam Rivera[\s\S]*E-42856[\s\S]*Customer Service[\s\S]*ext\. 4391/);
  assert.ok(tab.run('HD_ORG.departments').includes('Customer Service'));
}

/* ------------------------------------------------- the whole walkthrough */

function testWalkthroughEndToEnd() {
  const opener = fakeOpener();
  const tab = sim(launchUrl(), { opener });
  assert.equal(step(tab), 0);
  tab.advance();
  assert.equal(step(tab), 0, 'waits for the ticket to be taken');
  tab.run("hdSelectTicket('HD-2150'); hdAssignTicket('HD-2150')"); tab.advance();
  assert.equal(step(tab), 0, 'assigned is not In Progress yet');
  tab.run("hdTransitionTicket('HD-2150', 'In Progress')"); tab.advance();
  assert.equal(step(tab), 2, 'step 2 (read the ticket) continues; step 3 waits for the chat');
  tab.ask('when'); tab.advance();
  assert.equal(step(tab), 2, 'both identify questions');
  tab.ask('changed'); tab.advance();
  assert.equal(step(tab), 3);
  assert.match(tab.progress().chatAsked.join(), /when,changed/);
  tab.input('hd-kb-input', 'locked out'); tab.run("hdKbSearch({ preventDefault() {} }, 'HD-2150')"); tab.advance();
  assert.equal(step(tab), 3, 'a search alone is not reading the article');
  tab.run("hdKbOpen('HD-2150', 'KB-0024')"); tab.advance();
  assert.equal(step(tab), 4);
  tab.verify('callback'); tab.advance();
  assert.equal(step(tab), 5);
  assert.match(tab.open(), /hd-badge ok">Verified/, 'the verification badge turns green');
  tab.run("hdConsoleUnlock('HD-2150')"); tab.advance();
  assert.equal(step(tab), 6);
  assert.equal(tab.run("hdUserById('u-1013').locked"), false);
  tab.ask('signin'); tab.advance();
  assert.equal(step(tab), 7);
  assert.match(tab.open(), /I&#39;m in, thank you!|I'm in, thank you!/);
  tab.comment('Hi Sam, you are unlocked now.');
  assert.match(tab.toasts.at(-1), /It doesn't say what to do if it happens again yet\./);
  tab.advance();
  assert.equal(step(tab), 7, 'a comment without the repeat line waits');
  tab.comment(MODEL_COMMENT);
  assert.equal(tab.toasts.at(-1), 'Customer comment added.');
  tab.advance();
  assert.equal(step(tab), 8);
  tab.note(MODEL_NOTE);
  assert.match(tab.toasts.at(-1), /Note added: Reported, Tried and Result are all there\./);
  tab.run("hdSetResolutionCode('HD-2150', 'Solution provided'); hdResolveTicket('HD-2150')"); tab.advance();
  assert.equal(step(tab), 9, 'Finish');
  assert.match(tab.panelHtml(), /data-coach="finish"/);
  const ticket = tab.ticket();
  assert.equal(ticket.status, 'Resolved');
  assert.equal(ticket.resolution, MODEL_NOTE, 'the student\'s note is the resolution');
  assert.equal(ticket.closureCode, 'Solution provided');

  tab.finish();
  const work = opener.sent.find((m) => m.data.type === 'mnt-coach-complete').data.work;
  assert.deepEqual(work.tickets.map((t) => t.id), ['HD-2150'], 'only the lab ticket is sent');
  const sent = work.tickets[0];
  assert.ok(Object.values(sent.console.outcomes).every(Boolean), JSON.stringify(sent.console.outcomes));
  assert.deepEqual(sent.console.verification, { choice: 'callback', tries: ['callback'], passed: true, criticalErrors: [] });
  assert.equal(sent.customerComments.at(-1).text, MODEL_COMMENT, 'the comment, word for word');
  assert.equal(sent.notes.at(-1).text, MODEL_NOTE);
  assert.equal(work.investigation, undefined, 'no HD-2101 investigation');
}

/* ------------------------------------------ verification gates the unlock */

function testUnlockDisabledUntilAPassingChoice() {
  const tab = sim(launchUrl());
  tab.run("hdSelectTicket('HD-2150')");
  const disabled = /<button type="button" class="btn btn-secondary" disabled aria-describedby="hd-unlock-why" style="opacity:\.55;cursor:not-allowed">Unlock account<\/button><p id="hd-unlock-why" class="muted">Verify the caller first \(KB-0024\)\.<\/p>/;
  assert.match(tab.open(), disabled, 'disabled before any choice');
  // Even called directly, or from Active Directory, the unlock is refused.
  tab.run("hdConsoleUnlock('HD-2150')");
  assert.match(tab.toasts.at(-1), /Verify the caller on HD-2150 before you unlock this account\./);
  tab.run("hdState.selectedUserId = 'u-1013'; hdAdAction('unlock')");
  assert.equal(tab.run("hdUserById('u-1013').locked"), true);

  // Critical error 1: a name and department.
  tab.verify('name');
  let html = tab.open();
  assert.match(html, /Critical error\. Anyone can learn a name and a department/);
  assert.match(html, disabled, 'still disabled');
  // Critical error 2: asking for the password.
  tab.verify('password');
  html = tab.open();
  assert.match(html, /Critical error\. The help desk never asks for a password/);
  assert.match(html, disabled, 'still disabled');
  assert.equal(tab.run("hdUserById('u-1013').locked"), true);
  let progress = tab.progress();
  assert.deepEqual(progress.verification.criticalErrors, ['name', 'password'], 'both recorded');
  assert.equal(progress.verification.passed, false);
  assert.equal(progress.outcomes.verified, false);

  // The passing choice: enabled, and the unlock works.
  tab.verify('callback');
  html = tab.open();
  assert.doesNotMatch(html, /hd-unlock-why/);
  assert.match(html, /onclick="hdConsoleUnlock\('HD-2150'\)">Unlock account/);
  tab.run("hdConsoleUnlock('HD-2150')");
  assert.equal(tab.run("hdUserById('u-1013').locked"), false);
  progress = tab.progress();
  assert.deepEqual(progress.verification.tries, ['name', 'password', 'callback'], 'every try is kept for the instructor');
  assert.deepEqual(progress.verification.criticalErrors, ['name', 'password'], 'a later pass doesn\'t erase them');
  assert.equal(progress.outcomes.unlocked, true);
  // The sign-in question answers "still locked" until the unlock.
  const early = sim(launchUrl());
  early.ask('signin');
  assert.equal(early.progress().outcomes.confirmed, false);
  assert.match(early.open(), /It still says my account is locked\./);
}

/* ----------------------------------------- passwords in every text field */

function testPasswordRefusedInChatCommentAndNote() {
  const tab = sim(launchUrl());
  tab.run("hdSelectTicket('HD-2150')");
  tab.ask('password');
  assert.match(tab.toasts.at(-1), /^Stopped: never type a user's password[\s\S]*The help desk never asks for a password, for any reason \(KB-0024\)\./);
  assert.equal(tab.ticket().passwordAsked, true);
  assert.match(tab.open(), /You \(not asked\)[\s\S]*The help desk never asks for a password\./);
  assert.doesNotMatch(tab.open(), /onclick="hdChatAsk\('HD-2150','password'\)"/, 'asked once, gone');

  assert.equal(tab.comment('Hi Sam, your new password: Test2026x'), false);
  assert.match(tab.toasts.at(-1), /Remove it from the customer comment/);
  assert.equal(tab.note('Reported: locked out. Tried: pw: Test2026y. Result: unlocked.'), false);
  assert.match(tab.toasts.at(-1), /Remove it from the work note/);
  assert.equal(tab.run('hdComments(hdTicketById(\'HD-2150\')).length'), 0);
  assert.equal(tab.ticket().notes.length, 0);
  assert.equal(tab.ticket().passwordWritten, true);
  assert.ok(!/Test2026[xy]/.test(tab.local.getItem('defender-lab.helpdesk.state.v1') || ''), 'never saved');
  // Words about passwords are fine.
  assert.equal(tab.comment('Hi Sam, IT can never see or set your password. If it locks again, reply here.'), true);
  const progress = tab.progress();
  assert.equal(progress.passwordAsked, true);
  assert.equal(progress.passwordWritten, true);
}

/* ------------------------------------------------ resolve needs it all */

function testResolveNeedsEveryOutcome() {
  const tab = sim(launchUrl());
  tab.run("hdSelectTicket('HD-2150'); hdAssignTicket('HD-2150'); hdTransitionTicket('HD-2150', 'In Progress')");
  tab.run("hdResolveTicket('HD-2150')");
  assert.equal(tab.toasts.at(-1), 'Before you resolve this ticket, verify the caller the way KB-0024 says.');
  tab.run("hdTransitionTicket('HD-2150', 'Resolved')");
  assert.equal(tab.toasts.at(-1), 'Before you resolve this ticket, verify the caller the way KB-0024 says.', 'Next state can\'t skip it');
  assert.equal(tab.ticket().status, 'In Progress');
  tab.verify('callback');
  tab.run("hdResolveTicket('HD-2150')");
  assert.match(tab.toasts.at(-1), /unlock the account on the account card/);
  tab.run("hdConsoleUnlock('HD-2150')"); tab.ask('signin');
  tab.run("hdResolveTicket('HD-2150')");
  assert.match(tab.toasts.at(-1), /what to do if it happens again/);
  // Jargon in a comment: feedback, and it doesn't count until the repeat line is there.
  tab.comment('Unlocked in Active Directory; badPwdCount reset.');
  assert.match(tab.toasts.at(-1), /The customer won't know these words: badPwdCount, Active Directory\.[\s\S]*It doesn't say what to do if it happens again yet\./);
  // The line needs an action for Sam, in the same sentence (Codex, round 1).
  const repeat = (text) => tab.run(`hdCommentHasRepeatLine(hdTicketById('HD-2150'), ${JSON.stringify(text)})`);
  assert.equal(repeat('If it happens again, I\'ll look into it.'), false, 'no action for the user');
  assert.equal(repeat('It may lock again. Reply to this email.'), false, 'condition and action in different sentences');
  assert.equal(repeat('Let us know if it happens again.'), true);
  assert.equal(repeat('If it locks again today, reply to this email and our next-level team will find out why.'), true);
  assert.equal(repeat('Should it come back, please call the Service Desk.'), true);
  assert.equal(repeat('If it comes back, please call the Service Desk.'), true);
  tab.comment('If it happens again, I\'ll look into it.');
  assert.match(tab.toasts.at(-1), /It doesn't say what to do if it happens again yet\./);
  assert.equal(tab.outcomes().comment, false);
  tab.comment(MODEL_COMMENT);
  assert.equal(tab.outcomes().comment, true);
  tab.note('Unlocked it.');
  assert.match(tab.toasts.at(-1), /Still missing: Reported, Tried, Result/);
  tab.run("hdResolveTicket('HD-2150')");
  assert.match(tab.toasts.at(-1), /add a work note with every part/);
  tab.note(MODEL_NOTE);
  tab.run("hdResolveTicket('HD-2150')");
  assert.match(tab.toasts.at(-1), /choose a resolution code/);
  tab.run("hdSetResolutionCode('HD-2150', 'Solution provided')");
  // Next state = Resolved resolves the same way: the note is the resolution.
  tab.run("hdTransitionTicket('HD-2150', 'Resolved')");
  assert.equal(tab.ticket().status, 'Resolved');
  assert.equal(tab.ticket().resolution, MODEL_NOTE);
  assert.match(tab.open(), /data-outcome="code" data-done="yes"/);
}

/* --------------------------------------------------- the portal's save */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const LAB12 = 'lab-its-01-ticket-triage';
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const hdUser = () => ({
  userId: 'user-m01g', email: 'm01g@test.invalid', trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const inserts = () => portal.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && c.payload.lab_key === LAB12);

async function testPortalSavesOnlyAFinishedHd2150() {
  const user = hdUser();
  signedIn = user;
  portal.localStorage.clear();
  portal.supabaseCalls.length = 0;
  const student = prun('LabRuntime').anonymousStudentId(user);
  const lab = prun("MODULE_LABS['it-support/1']");
  const page = lab.view(user, HD);
  assert.match(page, /INC0010150, Sam Rivera’s account lockout/);
  assert.doesNotMatch(page, /HD-2101|Jordan Bell|PowerShell|Event Viewer/, 'HD-2101 no longer appears in Module 1');
  assert.doesNotMatch(prun("LABS.find((l) => l.key === 'lab-its-01-ticket-triage').description"), /HD-2101|PowerShell|Event Viewer/);
  const send = async (work) => {
    const replies = [];
    await lab.onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m01', nonce: 'n-1', student, work }, origin: SIM, source: { postMessage: (data) => replies.push(JSON.parse(JSON.stringify(data))) } });
    await settle();
    return replies;
  };
  const work = finishedWork();
  // Not resolved, or an outcome missing: refused, kept in the simulator.
  const open = JSON.parse(JSON.stringify(work));
  open.tickets[0].status = 'In Progress';
  assert.deepEqual(await send(open), [{ type: 'mnt-coach-received', id: 'hd-m01', nonce: 'n-1', saved: false, reason: 'incomplete' }]);
  for (const key of ['verified', 'unlocked', 'confirmed', 'comment', 'note', 'code']) {
    const missing = JSON.parse(JSON.stringify(work));
    missing.tickets[0].console.outcomes[key] = false;
    assert.equal((await send(missing))[0].saved, false, key);
  }
  assert.equal((await send({ version: 1, tickets: [{ id: 'HD-2150', status: 'Resolved' }] }))[0].saved, false, 'no console work');
  assert.equal(inserts().length, 0);
  assert.match(lab.view(user, HD), /Your walkthrough wasn’t saved: its ticket isn’t finished yet\./);

  // A critical error on the way never blocks the save (Practice It).
  const rough = JSON.parse(JSON.stringify(work));
  rough.tickets[0].console.verification = { choice: 'callback', tries: ['name', 'callback'], passed: true, criticalErrors: ['name'] };
  const replies = await send(rough);
  assert.equal(replies[0].saved, true);
  assert.equal(inserts().length, 1);
  const saved = JSON.parse(JSON.stringify(inserts()[0].payload.result.work.tickets[0]));
  assert.deepEqual(saved.console.verification.criticalErrors, ['name']);
  assert.equal(saved.customerComments.at(-1).text, MODEL_COMMENT);
  assert.doesNotMatch(lab.view(user, HD), /its ticket isn’t finished yet/, 'the notice clears');
}

function testPortalKeepsOnlyKnownConsoleFields() {
  const work = finishedWork();
  const ticket = work.tickets[0];
  ticket.console.secret = 'x';
  ticket.console.verification.answerKey = 'callback';
  ticket.console.kbSearches = Array.from({ length: 40 }, (_, i) => `q${i}${'y'.repeat(200)}`);
  ticket.console.outcomes.verified = 'yes';
  ticket.customerComments.push({ author: 'Riley Morgan', time: '1', text: 'z'.repeat(5000), extra: 'drop me' });
  const clean = JSON.parse(JSON.stringify(prun('itsCleanCoachWork')(work).tickets[0]));
  assert.equal(clean.console.secret, undefined);
  assert.equal(clean.console.verification.answerKey, undefined);
  assert.equal(clean.console.kbSearches.length, 10);
  assert.ok(clean.console.kbSearches.every((q) => q.length <= 80));
  assert.equal(clean.console.outcomes.verified, false, 'only true counts');
  assert.equal(clean.customerComments.at(-1).text.length, 2000);
  assert.equal(clean.customerComments.at(-1).extra, undefined);
  // A ticket without console work gets none.
  const plain = prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'SR-2102', status: 'New' }] }).tickets[0];
  assert.equal(plain.console, undefined);
  assert.equal(plain.customerComments, undefined);
}

/* ---------------------------------------------------- the instructor sheet */

function testInstructorSheet() {
  const work = prun('itsCleanCoachWork')(finishedWork());
  const sheet = prun('AdminSubmissionSheet');
  const row = { id: 'm01g-1', lab_key: LAB12, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-09T15:00:00Z', result: { source: 'mnt-coach-complete', work } };
  const built = sheet.evaluate(row);
  const ids = built.sections.map((section) => section.id);
  assert.ok(ids.includes('verification-hd-2150') && ids.includes('customer-comment-hd-2150') && ids.includes('work-notes-hd-2150'));
  assert.ok(!ids.some((id) => /hd-2101|troubleshooting-hd-2150|diagnosis-hd-2150/.test(id)), 'no HD-2101, checklist or diagnosis sections');
  ['verification-hd-2150', 'customer-comment-hd-2150', 'work-notes-hd-2150'].forEach((id) => assert.equal(built.sections.find((s) => s.id === id).status, 'pass', id));
  const html = sheet.render(row);
  assert.match(html, /Callback on the directory number \+ employee ID/);
  assert.ok(html.includes('If it locks again today, reply to this email'), 'the comment in full');
  assert.match(html, /Reported: user locked out after several wrong password attempts/);
  assert.match(html, /Asked for a password in the chat[\s\S]{0,200}Did not/);

  // A critical error on the way: a red row, the section needs judgment.
  const rough = JSON.parse(JSON.stringify(work));
  rough.tickets[0].console.verification = { choice: 'callback', tries: ['password', 'name', 'callback'], passed: true, criticalErrors: ['password', 'name'] };
  rough.tickets[0].console.passwordAsked = true;
  const roughRow = { ...row, id: 'm01g-2', result: { ...row.result, work: rough } };
  const section = sheet.evaluate(roughRow).sections.find((s) => s.id === 'verification-hd-2150');
  assert.notEqual(section.status, 'pass', 'a critical error is flagged');
  const roughHtml = sheet.render(roughRow);
  assert.match(roughHtml, /Critical error: accepted a name and department as verification/);
  assert.match(roughHtml, /Critical error: asked the caller for their password/);
  assert.match(roughHtml, /Asked for the password → Accepted the name and department → Callback on the directory number/);
  assert.match(roughHtml, /Yes \(refused, never sent to the caller\)/);
  // No repeat line: the comment section says so.
  const flat = JSON.parse(JSON.stringify(work));
  flat.tickets[0].console.commentRepeatLine = false;
  assert.notEqual(sheet.evaluate({ ...row, id: 'm01g-3', result: { ...row.result, work: flat } }).sections.find((s) => s.id === 'customer-comment-hd-2150').status, 'pass');
}

/* --------------------------------- a walkthrough saved before the change */

function testOldWalkthroughStartsFresh() {
  // A browser that was halfway through the HD-2101 walkthrough: its shift
  // has HD-2101 and no HD-2150, and its resume record points at step 6.
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run("hdState.tickets = hdState.tickets.filter((t) => t.id !== 'HD-2150'); hdSave()");
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m01', step: 6, student: STUDENT }));
  const tab = sim(launchUrl(false), { local });
  assert.equal(step(tab), 0, 'starts at the first step');
  assert.ok(tab.hd().tickets.some((t) => t.id === 'HD-2150'), 'with the new ticket');
  assert.ok(!tab.hd().tickets.some((t) => t.id === 'HD-2101'));
  // A current walkthrough still resumes where it was.
  const current = sim(launchUrl(), { local: store() });
  current.run("hdSelectTicket('HD-2150'); hdAssignTicket('HD-2150'); hdTransitionTicket('HD-2150', 'In Progress')"); current.advance();
  current.ask('when'); current.ask('changed'); current.advance();
  const at = step(current);
  assert.equal(at, 3);
  const resumed = sim(launchUrl(false), { local: current.local });
  assert.equal(step(resumed), at, 'same step after a relaunch');
  assert.deepEqual(resumed.progress().chatAsked, ['when', 'changed'], 'same work');
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [
    testShiftTicketAndKb, testWalkthroughEndToEnd, testUnlockDisabledUntilAPassingChoice,
    testPasswordRefusedInChatCommentAndNote, testResolveNeedsEveryOutcome,
    testPortalSavesOnlyAFinishedHd2150, testPortalKeepsOnlyKnownConsoleFields, testInstructorSheet,
    testOldWalkthroughStartsFresh,
  ];
  for (const test of tests) await test();
  console.log(`hdesk-m01-guided-lab: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

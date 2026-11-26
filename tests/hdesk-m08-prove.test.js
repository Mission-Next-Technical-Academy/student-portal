// Module 8 (key its-06) Prove It: one ticket on Module 3's one-ticket form
// with a key-finding note and a one-question call, worked on the User
// Directory, Active Directory with Module 8's account controls, the Entra
// admin center, the knowledge base and two evidence cards, with a request
// opened from the ticket and messages to other teams (ui/helpdesk.js,
// HD_PROVE_SHIFTS['its-06']), and the course page's side of it
// (portal/it-support-shared.js: the cleaner and the review panel;
// portal/it-support-module-06.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, no practice wording on any screen.
//   - The call: one question only, recorded once.
//   - The shift's own people are in the User Directory with their titles, and
//     a screen and its typed line record the same source.
//   - The same account controls on every account; each change, and each
//     refused try, is an action_taken event naming the account.
//   - A request opened from the ticket and a message to another team are
//     action_taken events (value: the approver or the team); a submitted
//     attempt opens nothing more; a returned attempt earns them again.
//   - Older Prove shifts draw no request or team card, and their directory is
//     unchanged.
//   - The course page keeps the work; the instructor reads the writing in
//     full and every action; the page submits through recordLabAttempt and a
//     failed write saves nothing.
//
// Structure only: nothing here says which choice, screen or step is right.
// Names are read from the shift data; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-06-prove-it';
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const j = (value) => JSON.stringify(value);

/* --------------------------------------------------------------- simulator */
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', textContent: '', disabled: false,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
function sim(moduleKey, student, local = store(), session = store()) {
  const u = new URL(`https://academy.test/sim/?prove=${moduleKey}&student=${student}#/helpdesk/tickets`);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''), querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState() {} },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener: null, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text), render() {},
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => { location.hash = hash; };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  return {
    ctx, run, local, byId, toasts,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    prove: () => plain(run('hdState.prove')),
    submitState: () => plain(run('hdProveSubmitState()')),
    coachPanel: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
    actions: () => plain(run("hdState.prove.events.filter((e) => e.type === 'action_taken').map((e) => ({ value: e.value, source: e.source, label: e.label }))")),
    ps: (command) => {
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
  };
}
const SHIFT = sim('its-06', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-06']))");
const SPEC = SHIFT.tickets[0];
const TID = SPEC.id;
const QUESTIONS = SPEC.console.caller.questions;
const PEOPLE = SHIFT.users;
const ITEMS = SPEC.console.convert.items;
const MESSAGES = SPEC.console.teamMessages;
const CLASSES = sim('its-06', 'probe2').run('HD_PROVE_CLASSES.slice()');
const TEAMS = sim('its-06', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const WRITING = { keyFinding: 'Synthetic finding K: two made-up facts linked.', resolutionNote: 'Synthetic note A: Reported / Tried / Result / Next action, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const sources = (tab) => tab.prove().opened.filter((s) => !s.startsWith('screen:') && !s.startsWith('computer:'));
const ask = (tab, id) => tab.run(`hdChatAsk(hdState.tickets[0].id, ${j(id)})`);
// An item with a field naming its approver, and one with a fixed approver.
const FIELD_ITEM = ITEMS.find((item) => item.approverField);
const FIXED_ITEM = ITEMS.find((item) => !item.approverField);
function openRequest(tab, item, forName, approver) {
  tab.run(`hdConvertSet(${j(TID)}, 'item', ${j(item.name)})`);
  tab.run(`hdConvertSet(${j(TID)}, 'requestedFor', ${j(forName)})`);
  (item.fields || []).forEach((field) => tab.run(`hdConvertSet(${j(TID)}, ${j(field.id)}, ${j(field.id === item.approverField ? approver : field.options[0])})`));
  tab.run(`hdConvertToRequest(${j(TID)})`);
}
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[0]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '2');
  tab.ctx.hdProveSetField('urgency', '2');
  tab.ctx.hdProveSetField('group', TEAMS[0]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Resolve');
  [SPEC.pathPool[0].id, SPEC.pathPool[2].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  Object.entries(WRITING).forEach(([field, text]) => tab.ctx.hdProveText(field, text));
  tab.run('hdProveSetCode(hdState.tickets[0].id, HD_PROVE_RESOLUTION_CODES[0]); hdProveClose(hdState.tickets[0].id)');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m06', step: 2 })]]);
  const tab = sim('its-06', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-06-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 30, 'the coaching time box (decision 1)');
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(TID), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command', 'KB-0065 first', 'Each change waits'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.match(html, /data-hd-prove-writing="keyFinding"/, 'the key-finding box');
  assert.match(html, /data-hd-keep-incident/, 'the request card');
  assert.match(html, /hd-team-messages/, 'the team messages card');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, SPEC.pathPool.length, 'step ids are unique');
  assert.ok(SPEC.pathPool.length >= 10, 'a long mixed list of steps');
  assert.ok(SPEC.pathPool.every((step) => !/\b[A-Z]{2,}\b|\d/.test(step.text.replace(/\bMFA\b/g, ''))), 'no step names a team code, a record or a number');
  assert.ok(ITEMS.length >= 3 && MESSAGES.length >= 3, 'several catalog items and teams, so none stands out by being alone');
  assert.ok(!tab.run('hdKbArticles().some((a) => a.practiceOnly)'), 'no practice-only article in a Prove It');
  assert.ok(tab.run("hdKbArticles().some((a) => a.id === 'KB-0024')"), 'KB-0024 is in the knowledge base');
  assert.ok(SHIFT.kbArticles.length >= 3, 'several Module 8 articles, copied in as plain articles');
  SHIFT.kbArticles.forEach((article) => assert.ok(tab.run(`hdKbArticles().some((a) => a.id === ${j(article.id)})`), `${article.id} is in the knowledge base`));
  // The Entra screen has no teaching line.
  tab.run(`hdEntraOpenUser(${j(PEOPLE[0].id)})`);
  assert.doesNotMatch(tab.view('helpdesk/entra-admin'), /strongest check|KB-0065/);
  assert.deepEqual([...tab.toasts], [], 'no toast');
}

function testOneQuestion() {
  const tab = sim('its-06', 'stu-call');
  assert.equal(SPEC.console.caller.limit, 1);
  assert.ok(QUESTIONS.length >= 3 && QUESTIONS.every((q) => /^q\d+$/.test(q.id)), 'several questions with neutral ids');
  let html = ticketView(tab);
  QUESTIONS.forEach((q) => assert.ok(html.includes(`hdChatAsk('${TID}','${q.id}')`), `question ${q.id} offered`));
  ask(tab, QUESTIONS[2].id);
  ask(tab, QUESTIONS[0].id);
  const asked = tab.prove().events.filter((e) => e.type === 'caller_question');
  same(asked.map((e) => [e.value, e.label]), [[QUESTIONS[2].id, QUESTIONS[2].text]], 'one question, by id and text');
  html = ticketView(tab);
  assert.ok(html.includes(tab.run('hdEsc')(QUESTIONS[2].reply)), 'the reply shows');
  assert.ok(!html.includes('hdChatAsk('), 'nothing is offered after the one question');
}

function testDirectoryAndSources() {
  const tab = sim('its-06', 'stu-dir');
  const directory = tab.view('helpdesk/directory');
  PEOPLE.forEach((user) => {
    assert.ok(directory.includes(tab.run('hdEsc')(user.name)), `${user.name} is in the User Directory`);
    assert.ok(directory.includes(`<small data-hd-user-title>${tab.run('hdEsc')(user.title)}</small>`), `with the title ${user.title}`);
  });
  assert.equal(new Set(plain(tab.run('hdFileUsers().map((u) => u.id)'))).size, plain(tab.run('hdFileUsers().length')), 'each user once');
  PEOPLE.forEach((user) => {
    tab.run(`hdOpenUser(${j(user.id)})`);
    const pane = tab.view('helpdesk/active-directory');
    assert.match(pane, new RegExp(`data-hd-user-title>${tab.run('hdEsc')(user.title).replace(/[()]/g, '\\$&')}<`), `${user.name}'s pane shows the title`);
  });
  SPEC.evidence.forEach((card) => tab.run(`hdProveOpenCard('card', ${j(card.id)})`));
  PEOPLE.forEach((user) => { tab.run(`hdEntraOpenUser(${j(user.id)}); hdEntraTab('signins')`); tab.view('helpdesk/entra-admin'); });
  const opened = sources(tab);
  [...PEOPLE.flatMap((user) => [`ad-user:${user.id}`, `entra-signins:${user.id}`]), ...SPEC.evidence.map((card) => `card:${card.id}`)]
    .forEach((source) => assert.ok(opened.includes(source), source));
  assert.equal(opened.length, new Set(opened).size, 'each source once');
  // The same evidence typed: each line records the source its screen records.
  const typed = sim('its-06', 'stu-typed');
  const [first, second] = PEOPLE;
  const status = typed.ps(`Get-ADUser ${first.username} -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet`);
  assert.match(status, new RegExp(`AccountExpirationDate\\s+: ${SHIFT.directory.accounts[first.id].accountExpires}`), 'Get-ADUser prints what the pane shows');
  const titled = typed.ps(`Get-ADUser ${second.username} -Properties Title, OfficePhone, Manager`);
  assert.match(titled, new RegExp(`Title\\s+: ${second.title}`));
  assert.match(titled, /OfficePhone\s+: /);
  const expired = typed.ps('Search-ADAccount -AccountExpired');
  assert.ok(expired.includes(first.username), 'Search-ADAccount reads the same accounts');
  const fromTyping = sources(typed);
  [`ad-user:${first.id}`, `ad-user:${second.id}`].forEach((source) => assert.ok(fromTyping.includes(source), `typed: ${source}`));
  assert.equal(typed.prove().events.filter((e) => e.type === 'command_run').length, 3, 'each command is recorded');
}

function testSameControlsOnEveryAccount() {
  const tab = sim('its-06', 'stu-controls');
  const ids = [...PEOPLE.map((user) => user.id), ...Object.keys(SHIFT.directory.accounts).filter((id) => !PEOPLE.some((user) => user.id === id) && tab.run(`!!hdFileUser(${j(id)})`))];
  assert.ok(ids.length >= 4, 'several accounts');
  ids.forEach((id) => {
    tab.run(`hdOpenUser(${j(id)})`);
    const pane = tab.view('helpdesk/active-directory');
    assert.match(pane, /data-hd-acct="unlock"[\s\S]*data-hd-acct="reset"[\s\S]*data-hd-acct-expiry/, `${id}: the same controls`);
    assert.doesNotMatch(pane, /callout info|Never place passwords/, `${id}: no teaching text`);
  });
  // Every change and every refused try names the account it was aimed at.
  ids.forEach((id) => { tab.run(`hdAcctExpiry(${j(id)}, 30)`); tab.run(`hdAcctReset(${j(id)}, true)`); });
  const actions = tab.actions();
  ids.forEach((id) => {
    const username = tab.run(`hdFileUser(${j(id)}).username`);
    assert.ok(actions.some((a) => a.source === username && /^ad-(expiry|reset|password|must)/.test(a.value)), `${id}: recorded with the account`);
  });
  assert.ok(tab.toasts.every((text) => ['Done.', 'Insufficient access rights to perform the operation.'].includes(text)), 'neutral toasts only');
  // MFA re-registration is a screen action, recorded with the account.
  const mfa = sim('its-06', 'stu-mfa');
  mfa.run(`hdEntraReregister(${j(PEOPLE[0].id)})`);
  assert.ok(mfa.actions().some((a) => a.value === 'entra-mfa-reregister' && a.source === PEOPLE[0].username));
  assert.deepEqual([...mfa.toasts], ['Done.']);
}

function testRequestAndTeamMessages() {
  const tab = sim('its-06', 'stu-request');
  let html = ticketView(tab);
  ITEMS.forEach((item) => assert.ok(html.includes(`>${tab.run('hdEsc')(item.name)}</option>`), `item ${item.name} offered`));
  PEOPLE.forEach((user) => assert.ok(html.includes(`>${tab.run('hdEsc')(user.name)}</option>`), `${user.name} can be chosen as Requested for`));
  const approver = FIELD_ITEM.fields.find((field) => field.id === FIELD_ITEM.approverField).options[1];
  openRequest(tab, FIELD_ITEM, PEOPLE[0].name, approver);
  same(tab.actions().map((a) => [a.value, a.source]), [[`request-opened:${approver}`, FIELD_ITEM.name]], 'one request, by approver and item');
  assert.ok(tab.actions()[0].label.includes(PEOPLE[0].name), 'the label names who it is for');
  html = ticketView(tab);
  assert.match(html, /Approval: Requested/);
  assert.ok(html.includes(`<dt>Approver</dt><dd>${tab.run('hdEsc')(approver)}</dd>`), 'the chosen approver shows');
  assert.doesNotMatch(html, /Close the request/, 'nothing closes the request in a Prove It');
  // One request per ticket.
  openRequest(tab, FIXED_ITEM, PEOPLE[1].name, '');
  assert.equal(tab.actions().length, 1);
  // A fixed approver comes from the item.
  const fixed = sim('its-06', 'stu-request-fixed');
  openRequest(fixed, FIXED_ITEM, PEOPLE[0].name, '');
  same(fixed.actions().map((a) => [a.value, a.source]), [[`request-opened:${FIXED_ITEM.approver}`, FIXED_ITEM.name]]);
  // Team messages: each one once, by team.
  MESSAGES.forEach((message) => tab.run(`hdTeamMessage(${j(TID)}, ${j(message.id)})`));
  tab.run(`hdTeamMessage(${j(TID)}, ${j(MESSAGES[0].id)})`);
  same(tab.actions().slice(1).map((a) => [a.value, a.source]), MESSAGES.map((m) => [`team-message:${m.to}`, m.id]), 'each message once');
  html = ticketView(tab);
  MESSAGES.forEach((message) => assert.ok(html.includes(`data-hd-team="${message.id}"`), `${message.id} logged on the ticket`));
  assert.ok(!html.includes('hdTeamMessage('), 'nothing left to send');
  // Submitted: nothing more is offered or recorded.
  const locked = sim('its-06', 'stu-request-locked');
  locked.run("hdProveServer.status = 'waiting'");
  openRequest(locked, FIELD_ITEM, PEOPLE[0].name, approver);
  locked.run(`hdTeamMessage(${j(TID)}, ${j(MESSAGES[1].id)})`);
  same(locked.actions(), [], 'nothing recorded after submit');
  const lockedHtml = ticketView(locked);
  assert.doesNotMatch(lockedHtml, /data-hd-keep-incident|hdTeamMessage\(/, 'no request form and no message button after submit');
}

function testReturnedAttemptEarnsThemAgain() {
  const tab = sim('its-06', 'stu-return');
  openRequest(tab, FIELD_ITEM, PEOPLE[0].name, FIELD_ITEM.fields[0].options[0]);
  tab.run(`hdTeamMessage(${j(TID)}, ${j(MESSAGES[0].id)})`);
  assert.equal(tab.actions().length, 2);
  tab.run(`hdProveFreshLog(${j(new Date().toISOString())})`);
  same(tab.actions(), [], 'the log is empty');
  const html = ticketView(tab);
  assert.match(html, /data-hd-keep-incident/, 'the request can be opened again');
  assert.ok(html.includes(`hdTeamMessage('${TID}','${MESSAGES[0].id}')`), 'and the message sent again');
  openRequest(tab, FIELD_ITEM, PEOPLE[0].name, FIELD_ITEM.fields[0].options[0]);
  assert.equal(tab.actions().length, 1, 'earned again in this attempt');
  // Account and Entra changes are actions too: the accounts start as the shift began.
  const acct = sim('its-06', 'stu-return-acct');
  const id = PEOPLE[0].id;
  const before = acct.run(`hdFileUser(${j(id)}).accountExpires`);
  const methods = j(plain(acct.run(`hdEntraUser(${j(id)}, hdCloud()).methods`)));
  acct.run(`hdAcctExpiry(${j(id)}, 30); hdEntraReregister(${j(id)}); hdAcctReset(${j(id)}, true)`);
  assert.notEqual(acct.run(`hdFileUser(${j(id)}).accountExpires`), before);
  acct.run(`hdProveFreshLog(${j(new Date().toISOString())})`);
  assert.equal(acct.run(`hdFileUser(${j(id)}).accountExpires`), before, 'the expiry is as the shift began');
  assert.equal(j(plain(acct.run(`hdEntraUser(${j(id)}, hdCloud()).methods`))), methods, 'the sign-in methods are as the shift began');
  assert.equal(acct.run(`!!hdFileUser(${j(id)}).mustChange`), false, 'no reset carried over');
  assert.equal(acct.run('hdAcctOtp'), null);
  // A reload keeps the cleared state and this attempt's new work.
  acct.run(`hdAcctExpiry(${j(id)}, 7); hdSave()`);
  const reload = sim('its-06', 'stu-return-acct', acct.local);
  assert.equal(reload.run(`hdFileUser(${j(id)}).accountExpires`), 'In 7 days (changed)');
  // Older shifts keep their account overrides on a return (Module 1's unlock).
  const m1 = sim('its-01', 'stu-return-m1');
  m1.run("hdState.userOverrides = { 'u-9999': { locked:false } }; hdProveFreshLog('2026-11-26T10:00:00Z')");
  assert.equal(m1.run("JSON.stringify(hdState.userOverrides)"), j({ 'u-9999': { locked: false } }));
}

function testOlderShiftsUnchanged() {
  ['its-01', 'its-11', 'its-02', 'its-03', 'its-07', 'its-05'].forEach((moduleKey) => {
    const tab = sim(moduleKey, `stu-old-${moduleKey}`);
    const html = ticketView(tab);
    assert.doesNotMatch(html, /hd-convert|hd-team-messages|data-hd-request=/, `${moduleKey}: no request or team card`);
    assert.equal(tab.run('hdShiftUsers() === HD_USERS'), true, `${moduleKey}: the directory is HD_USERS`);
    assert.doesNotMatch(tab.view('helpdesk/directory'), /data-hd-user-title/, `${moduleKey}: no titles in the User Directory`);
  });
  // Module 7's Prove user stays out of the User Directory, as before.
  const m7 = sim('its-05', 'stu-old-m7');
  const tara = m7.run("HD_PROVE_SHIFTS['its-05'].users[0].name");
  assert.ok(!m7.view('helpdesk/directory').includes(tara));
  assert.equal(m7.run(`hdFileUsers().filter((u) => u.name === ${j(tara)}).length`), 1);
}

function testPackage() {
  const tab = sim('its-06', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const missing = sim('its-06', 'stu-package-missing');
  fill(missing);
  missing.ctx.hdProveText('keyFinding', '');
  assert.ok(missing.run('hdProveMissing()').includes('key finding'), 'Submit asks for the key finding');
  const work = plain(tab.run('hdProvePackage()'));
  assert.equal(work.keyFinding, WRITING.keyFinding);
  assert.equal(work.labKey, LAB);
  assert.equal(work.moduleKey, 'its-06');
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function sampleWork() {
  const tab = sim('its-06', 'stu-sample');
  fill(tab);
  ask(tab, QUESTIONS[1].id);
  tab.view('helpdesk/directory');
  tab.run(`hdOpenUser(${j(PEOPLE[0].id)})`); tab.view('helpdesk/active-directory');
  tab.run(`hdProveOpenCard('card', ${j(SPEC.evidence[0].id)})`);
  openRequest(tab, FIELD_ITEM, PEOPLE[0].name, FIELD_ITEM.fields[0].options[2]);
  tab.run(`hdTeamMessage(${j(TID)}, ${j(MESSAGES[1].id)})`);
  tab.ps(`Get-ADUser ${PEOPLE[1].username} -Properties Title`);
  return plain(tab.run('hdProvePackage()'));
}

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-06', LAB);
  assert.equal(reason, undefined);
  assert.equal(saved.fields.priority, prun('ITS_PROVE_MATRIX')['2']['2'], 'Priority is the course page\'s own, from Impact and Urgency');
  assert.equal(saved.keyFinding, WRITING.keyFinding);
  same(saved.events.filter((e) => e.type === 'caller_question').map((e) => e.value), [QUESTIONS[1].id], 'the question is kept');
  same(saved.events.filter((e) => e.type === 'evidence_opened').map((e) => e.source), work.events.filter((e) => e.type === 'evidence_opened').map((e) => e.source), 'the sources are kept');
  same(saved.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.source]), work.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.source]), 'the request and the message are kept, by value and source');
  assert.equal(clean({ ...work, keyFinding: '' }, 'its-06', LAB).reason, 'invalid', 'the key finding is required');
  assert.equal(clean({ ...work, labKey: 'lab-its-05-prove-it', rubricVersion: 'hdesk-its-05-prove-v1' }, 'its-06', LAB).reason, 'invalid', 'refused under another lab key');
  return saved;
}

const LONG = {
  keyFinding: 'Synthetic finding F: <b>made up</b> & linked.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m08-1', lab_key: LAB, student_id: '9900000008-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>') && !html.includes('<b>made up</b>'), 'never raw');
  ['Key finding', 'Work note', 'Reply', 'Questions asked in the chat', 'Commands run'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['Print queues at submit', 'The laptop at submit'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  saved.events.filter((e) => e.type === 'action_taken').forEach((e) => assert.ok(html.includes(pesc(e.label)), `action: ${e.label}`));
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-06-prove-v1');
  assert.equal(rubric.moduleKey, 'its-06');
  same(rubric.competencies.map((c) => c.points), [22, 17, 17, 33, 11]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  same(rubric.writing, { keyFinding: 600 });
  assert.equal(rubric.matrixFields, true);
  assert.equal(rubric.machineSummary, false);
}

/* ------------------------------------------------------------ Module 8 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-06'].number]`);
const studentOf = (user) => prun('LabRuntime').anonymousStudentId(user);
const hdUser = (name) => ({
  userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
});
let db;
function freshDb() {
  db = { attempts: [], failInsert: null };
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => {
    if (call.table !== 'lab_attempts') return { data: [], error: null };
    if (call.op === 'select') return { data: db.attempts.filter((r) => r.lab_key === call.filters.lab_key).slice().reverse().slice(0, 1), error: null };
    if (db.failInsert) return { data: null, error: { message: db.failInsert } };
    const latest = db.attempts.filter((r) => r.lab_key === call.payload.lab_key).pop();
    if (latest && (!latest.reviewed_at || !latest.redo_requested)) return { data: null, error: { code: 'P0001', message: 'refused' } };
    db.attempts.push({ id: `row-${db.attempts.length + 1}`, reviewed_at: null, redo_requested: false, superseded_at: null, ...call.payload });
    return { data: null, error: null };
  };
}
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setTimeout(resolve, 0)); };
async function quiet(fn) {
  const original = portal.console.error;
  portal.console.error = () => {};
  try { return await fn(); } finally { portal.console.error = original; }
}
async function send(data) {
  const replies = [];
  page().onMessage({ data: plain(data), origin: SIM, source: { postMessage: (reply, origin) => replies.push({ ...plain(reply), origin }) } });
  await flush();
  return replies;
}

async function testModuleEightPageSubmit(work) {
  freshDb();
  const user = hdUser('m08prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its06-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  assert.doesNotMatch(card, /Opens soon/);
  assert.match(card, /You don’t need to type any command/);
  assert.match(card, /30 minutes/);
  const link = /data-its06-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-06&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  // Lab 8.1 is Practice It now.
  const lab1 = html.slice(html.indexOf('id="its06-lab-8-1"'), html.indexOf('</section>', html.indexOf('id="its06-lab-8-1"')));
  assert.match(lab1, /Practice It · coached/);
  assert.match(lab1, /Practice: not graded/);
  assert.doesNotMatch(lab1, /instructor reviews/i);
  assert.equal(prun("LABS.find((l) => l.key === 'lab-its-06-identity-access').phase"), 'practice');
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-06', nonce: 'm08prove-1234', student: studentOf(user), work };
  db.failInsert = 'network';
  const failed = await quiet(() => send(message));
  assert.equal(failed.length, 1);
  assert.equal(failed[0].saved, false);
  assert.equal(failed[0].reason, 'save-failed');
  assert.equal(db.attempts.length, 0, 'nothing saved');
  assert.notEqual(prun('itsLabStatus')(user, LAB), 'waiting', 'not shown as submitted');
  db.failInsert = null;
  const replies = await send(message);
  assert.equal(replies.length, 1);
  assert.equal(replies[0].saved, true);
  assert.equal(replies[0].status, 'waiting');
  const rows = db.attempts.filter((r) => r.lab_key === LAB);
  assert.equal(rows.length, 1, 'one lab_attempts row');
  assert.equal(rows[0].state, 'complete');
  assert.equal(rows[0].score, null, 'no score from the browser');
  const { source, ...stored } = plain(rows[0].result);
  assert.equal(source, 'mnt-prove-submit');
  same(stored, clean(work, 'its-06', LAB).work, 'the cleaned work');
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its06-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its06-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m08-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testOneQuestion, testDirectoryAndSources, testSameControlsOnEveryAccount, testRequestAndTeamMessages,
    testReturnedAttemptEarnsThemAgain, testOlderShiftsUnchanged, testPackage, testCiRunsThisFile]) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let work = null;
  try { work = sampleWork(); report('sampleWork'); } catch (error) { report('sampleWork', error); }
  let saved = null;
  if (work) {
    try { saved = testPortalKeepsTheWork(work); report('testPortalKeepsTheWork'); } catch (error) { report('testPortalKeepsTheWork', error); }
  }
  if (saved) {
    try { testReviewPanel(saved); report('testReviewPanel'); } catch (error) { report('testReviewPanel', error); }
  }
  if (work) {
    try { await testModuleEightPageSubmit(work); report('testModuleEightPageSubmit'); } catch (error) { report('testModuleEightPageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m08-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m08-prove: all ${passed} passed`);
})();

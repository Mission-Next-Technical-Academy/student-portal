'use strict';
// Help Desk Module 3 (key its-11) Practice It, Lab 3.2 · Practice tickets
// (not graded): the practice set 'its-11' (ui/helpdesk-data.js), opened with
// ?practice=its-11. Three tickets, each on its own clock (console.now):
//
//   - 3-A HD-2165 (INC0010447): Outlook in Work Offline. Done when Resolved.
//   - 3-B HD-2166 (INC0010455 + RITM0010101): the CFO's broken laptop. Done
//     when the incident is with Desktop Support with a four-label note, the
//     request is open, a comment with a time is posted and a follow-up is set.
//   - 3-C HD-2167 (INC0010388): the stalled ticket. Done when the lead was
//     messaged, a comment with a time is posted and a follow-up is set.
//
// Each ticket is worked end to end with the spec's model notes and comments
// (spec 8.4), and "Check my work" passes every area. Wrong moves show as
// feedback. No ticket opens At risk or Breached. The set reports completion
// once, after all three, with the ticket ids only. Feedback only, never points.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const DESK2 = 'Desktop Support (Tier 2)';
const MC = 'Messaging & Collaboration';
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null } = {}) {
  const u = new URL('https://academy.test/sim/?practice=its-11&student=student-m03p0001#/helpdesk/tickets');
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: store(), sessionStorage: store(), opener,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  vm.runInContext('hdNowMs = () => 1000000;', ctx);
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  return {
    ctx, toasts, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    followUp: (id, value) => { input('hd-follow-up-input', value); run(`hdFollowUpSet(${j(id)})`); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    closed: () => run('hdPracticeClosed()'),
    sla: (id) => run(`hdSlaState(hdTicketById(${j(id)})).label`),
  };
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));

// The spec's model texts (8.4, and the tab's customer texts for 3-A and 3-C).
const A_NOTE = 'Reported: Outlook isn\'t sending; a client proposal is due at 14:00; the user is frustrated.\nTried: called Priya; the status bar said "Working Offline" and 4 emails were in the Outbox; per KB-0064, had her click Send/Receive › Work Offline to turn it off, then Send/Receive All Folders.\nResult: the Outbox emptied, her test email arrived, and Priya confirmed the proposal went at 13:12. Showed her where the button is.\nNext action: none; resolved.';
const A_COMMENT = 'Hi Priya, your email is sending again, and your proposal went out at 1:12. Outlook had been switched into "Work Offline" mode, which holds messages in the Outbox. The button is on the Send/Receive tab; if it\'s ever highlighted, click it once to go back online. Good luck with the client! – Riley';
const B_NOTE = 'Reported: CFO Martin Alvarez dropped his laptop this morning and it isn\'t usable. His assistant, Karen Holt, asks for a new 16-inch model (non-standard), set up by 08:00 tomorrow.\nTried: verified Karen per KB-0024 (callback on her directory number and employee ID); per KB-0071 confirmed the laptop turns on with a black screen, no loose glass, and his files are in OneDrive; Hardware stock shows the standard executive model in stock and the 16-inch not stocked (KB-0066: about 5 business days, needs the IT manager\'s approval); opened INC0010455 (damage, VIP) and RITM0010101 (replacement); Desktop Support confirmed a standard model will be ready by 07:30.\nResult: Desktop Support is setting up a standard model tonight; the approval request for the 16-inch is with the IT manager.\nNext action: Desktop Support hands over the standard laptop by 08:00; Service Desk confirms to Karen tonight when it\'s ready.';
const B_COMMENT = 'Hi Karen, thank you for the quick heads-up. Our desktop team has confirmed a fully set-up replacement laptop will be ready for Mr. Alvarez by 8:00 tomorrow: our standard executive model, with his files, email and apps. The 16-inch model isn\'t in stock and needs a manager\'s approval; once approved, it takes about a week to arrive, and we\'ll swap it then. His files are safe in OneDrive. I\'ll confirm tonight when the laptop is ready. – Riley';
const C_NOTE = 'Reported: Sofia Martin is chasing INC0010388 (shared calendar): no contact for two days since it went to Messaging & Collaboration.\nTried: found the ticket: assigned to the group with no person, and no work notes since the day it was escalated; added Sofia\'s chat to the ticket; messaged the group lead (T. Vance) at 10:20.\nResult: assigned to J. Ortiz, who has committed to call Sofia by 15:00; Sofia updated.\nNext action: J. Ortiz calls Sofia by 15:00; Service Desk checks at 15:15 that the call happened.';
const C_COMMENT = 'Hi Sofia, I\'m sorry nobody got back to you. That shouldn\'t have happened. Your ticket is now with Jamie Ortiz on our collaboration team, who will call you by 3:00 today. I\'ll check at 3:15 to make sure you\'ve heard from them. – Riley';

function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), ['HD-2165', 'HD-2166', 'HD-2167']);
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2165'), '2026-08-20T13:12:00.000Z');
  assert.equal(now('HD-2166'), '2026-08-20T11:05:00.000Z');
  assert.equal(now('HD-2167'), '2026-08-20T10:20:00.000Z');
  assert.equal(tab.ticket('HD-2167').priority, 'P4', '3-C is the existing P4');
  assert.equal(tab.ticket('HD-2167').assignmentGroup, MC);
  assert.match(tab.open('HD-2166'), /data-hd-vip/);
  assert.doesNotMatch(tab.open('HD-2165'), /data-hd-vip/);
  assert.doesNotMatch(tab.open('HD-2167'), /data-hd-mood/, 'no mood meter in practice');
  // No ticket opens At risk or Breached, on the expected or a likely wrong priority.
  const ok = (id) => assert.doesNotMatch(tab.sla(id), /risk|breach|overdue/i, `${id}: ${tab.sla(id)}`);
  tab.run("hdSetImpact('HD-2165', 'impact', '1'); hdSetImpact('HD-2165', 'urgency', '1')"); ok('HD-2165');
  tab.run("hdSetImpact('HD-2166', 'impact', '2'); hdSetImpact('HD-2166', 'urgency', '1')"); ok('HD-2166');
  ok('HD-2167');
  // Students see INC numbers only.
  assert.doesNotMatch(tab.open('HD-2167').replace(/<[^>]*>/g, ' '), /\bHD-216\d\b/);
}

function test3A() {
  const tab = sim(); const id = 'HD-2165';
  tab.open(id);
  // Angry email, P1 by mistake: the Triage feedback says so.
  tab.triage(id, 'Software', 'Email (Outlook)', 'NS-LT-0291', '1', '1');
  tab.run(`hdConsoleCheckWork('${id}')`);
  assert.equal(tab.feedback(id).areas.find((a) => a.area === 'Triage').ok, false);
  tab.triage(id, 'Software', 'Email (Outlook)', 'NS-LT-0291', '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.kb(id, 'outlook not sending', 'KB-0064');
  tab.ask(id, 'outbox', 'status', 'receive');
  tab.run(`hdConsoleCheckWork('${id}')`);
  assert.equal(tab.feedback(id).areas.find((a) => a.area === 'Documentation').ok, false, 'CALM on the call is part of the feedback');
  tab.run(`hdConsoleAction('${id}', 'acknowledge')`);
  tab.run(`hdConsoleAction('${id}', 'work-offline')`); tab.run(`hdConsoleAction('${id}', 'test-email')`);
  tab.note(id, A_NOTE); tab.comment(id, A_COMMENT);
  tab.run(`hdTransitionTicket('${id}', 'In Progress')`);
  tab.run(`hdSetResolutionCode('${id}', 'Solution provided')`);
  tab.input('hd-resolution-notes', 'Turned off Work Offline; the Outbox sent and a test email arrived.');
  tab.run(`hdTransitionTicket('${id}', 'Resolved')`);
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  // Blaming the user is a critical error, shown as feedback.
  const blame = sim(); blame.open(id); blame.run(`hdConsoleAction('${id}', 'blame')`);
  assert.match(blame.open(id), /Critical error\. Never tell a caller the problem is their fault/);
}

function work3B(tab) {
  const id = 'HD-2166';
  tab.open(id);
  tab.run(`hdVerify('${id}', 'callback')`);
  tab.ask(id, 'on', 'glass', 'files');
  tab.triage(id, 'Hardware', 'Laptop – damage', 'Executive laptop (Martin Alvarez)', '2', '2');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.run(`hdEvidenceOpen('${id}', 'stock')`);
  tab.kb(id, 'replacement laptop', 'KB-0066');
  tab.run(`hdConvertSet('${id}', 'item', 'Executive laptop replacement'); hdConvertSet('${id}', 'requestedFor', 'Martin Alvarez'); hdConvertSet('${id}', 'model', '16-inch model'); hdConvertSet('${id}', 'approval', 'Requested')`);
  tab.run(`hdConvertToRequest('${id}')`);
  assert.equal(tab.ticket(id).request.number, 'RITM0010101');
  tab.run(`hdTeamMessage('${id}', 'desk')`);
  tab.run(`hdMatrixAssignGroup('${id}', ${JSON.stringify(DESK2)})`);
  tab.note(id, B_NOTE); tab.comment(id, B_COMMENT);
  tab.followUp(id, '2026-08-20T19:00');
}
function test3B() {
  const tab = sim(); const id = 'HD-2166';
  work3B(tab);
  assert.equal(tab.ticket(id).status, 'Escalated', 'the incident stays open');
  assert.equal(tab.ticket(id).request.state, 'Open', 'the request stays open');
  ['group', 'requestOpen', 'handoffNote', 'commentTime', 'followUp'].forEach((key) => assert.equal(tab.run(`hdConsoleRule(hdTicketById('${id}'), { ${key}: ${key === 'group' ? JSON.stringify(DESK2) : 'true'} })`), true, key));
  allOk(tab.feedback(id), id);
  // Ordering the 16-inch model without approval is a critical error.
  const wrong = sim(); wrong.open(id); wrong.run(`hdConsoleAction('${id}', 'order-16')`);
  assert.match(wrong.open(id), /Critical error\. A non-standard model needs the IT manager/);
  // A comment with no time is told to give one.
  const notime = sim(); notime.open(id); notime.comment(id, 'Hi Karen, we are on it. – Riley');
  assert.match(notime.lastToast(), /Tell Karen when she will hear from you next/);
}

function work3C(tab) {
  const id = 'HD-2167';
  tab.open(id);
  tab.run(`hdCallChoose('${id}', 'quick')`); tab.run(`hdCallChoose('${id}', 'sorry')`);
  tab.run(`hdTeamMessage('${id}', 'lead')`);
  tab.note(id, C_NOTE); tab.comment(id, C_COMMENT);
  tab.followUp(id, '2026-08-20T15:15');
}
function test3C() {
  const tab = sim(); const id = 'HD-2167';
  // Blaming the other team shows its line; the chat waits for a good reply.
  tab.open(id); tab.run(`hdCallChoose('${id}', 'quick')`); tab.run(`hdCallChoose('${id}', 'slow')`);
  assert.match(tab.open(id), /Never blame colleagues/);
  work3C(tab);
  assert.equal(tab.ticket(id).assignedTechnician, 'Jamie Ortiz');
  assert.equal(tab.ticket(id).assignmentGroup, MC, 'it stays with Messaging & Collaboration');
  allOk(tab.feedback(id), id);
  // Create new incident is the duplicate-ticket error, shown as feedback.
  tab.run(`hdDuplicateMove('${id}')`);
  assert.match(tab.open(id), /data-hd-duplicate="tried"[\s\S]*Critical error in a real shift/);
  assert.ok(tab.feedback(id).critical.length > 0);
  // A fix-time promise gets the hint.
  const promise = sim(); promise.open(id); promise.comment(id, 'Hi Sofia, it will be fixed by 3:00. – Riley');
  assert.match(promise.lastToast(), /A fix time is not yours to promise/);
}

function testCompletionAfterAllThree() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  work3B(tab); work3C(tab);
  assert.equal(tab.closed(), false, '3-A is still open');
  const id = 'HD-2165';
  tab.run(`hdTransitionTicket('${id}', 'In Progress')`);
  tab.run(`hdSetResolutionCode('${id}', 'Solution provided')`);
  tab.input('hd-resolution-notes', 'Turned off Work Offline.');
  tab.run(`hdTransitionTicket('${id}', 'Resolved')`);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1);
  assert.equal(done[0].id, 'its-11');
  assert.deepEqual(done[0].tickets, ['HD-2165', 'HD-2166', 'HD-2167']);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
}

// The comment time check accepts the ways people name a time, and the fix
// promise is caught however the time is written.
function testTimeWords() {
  const tab = sim();
  const time = new RegExp(tab.run('HD_M03_TIME'), 'i');
  const promise = new RegExp(tab.run('HD_M03_PROMISE'), 'i');
  ['by 11:30', 'at 3 p.m.', 'by 3pm', 'at 8 AM tomorrow', 'in 30 minutes', 'within an hour', 'within 2 hours'].forEach((t) => assert.ok(time.test(t), `a time: ${t}`));
  ['soon', 'as soon as we can', 'later today', 'in a bit', 'Model 16'].forEach((t) => assert.ok(!time.test(t), `not a time: ${t}`));
  ['fixed by 2:00', 'working by 3', 'ready by 11:30'].forEach((t) => assert.ok(promise.test(t), `a promise: ${t}`));
  assert.ok(!promise.test('I will update you by 11:30'));
}

const tests = [testSetOpensOnItsOwnClocks, test3A, test3B, test3C, testCompletionAfterAllThree, testTimeWords];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m03-practice-tickets: all ${tests.length} passed`);

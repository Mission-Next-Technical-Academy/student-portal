'use strict';
// Help Desk Module 2 (key its-10) Practice It, Lab 2.2 · Practice tickets
// (not graded): practice set 'its-10' (ui/helpdesk-data.js), opened with
// ?practice=its-10. Wednesday 13:00 on the set's own clock.
//
//   - 2-A INC0010155 (HD-2155): a request, not an incident; the grant waits
//     for Omar's approval (an early grant is a critical error, as feedback).
//   - 2-B INC0010412 (HD-2156): Ines's reply reopens it; the two related
//     tickets INC0010431 and INC0010433 are in the queue; the feedback names
//     each missed link; "Next day" never points at them (answer 13).
//   - 2-C INC0010377 (HD-2157): three contact attempts across "Next day",
//     then No response from caller.
//   - Lab 2.2 is done once 2-A, 2-B and 2-C are closed, whatever happens to
//     the two related tickets. Feedback only, never points.
// Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/?practice=its-10&student=stu-m02p#/helpdesk/tickets', local = store() } = {}) {
  const u = new URL(url);
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
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
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  return {
    run, input, local, toasts,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    sla: (id) => run(`hdSlaState(hdTicketById(${j(id)})).label`),
    impact: (id, i, u) => run(`hdSetImpact(${j(id)}, 'impact', '${i}'); hdSetImpact(${j(id)}, 'urgency', '${u}')`),
    state: (id, status, extra = {}) => { Object.entries(extra).forEach(([k, v]) => input(k, v)); run(`hdTransitionTicket(${j(id)}, ${j(status)})`); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    ask: (id, q) => run(`hdChatAsk(${j(id)}, ${j(q)})`),
    attempt: (id, method) => { input('hd-contact-method', method); run(`hdLogContactAttempt(${j(id)})`); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    area: (id, name) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)).areas.find((a) => a.area === name),
  };
}
const SET = ['HD-2155', 'HD-2156', 'HD-2184', 'HD-2185', 'HD-2157'];

function testTheSetOpensOnWednesday() {
  const tab = sim();
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), SET.slice().sort());
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T13:00:00.000Z');
  // The build plan's ages: nothing opens At risk or Breached.
  assert.equal(tab.ticket('HD-2156').status, 'In Progress', 'Ines\'s reply reopened 2-B');
  assert.deepEqual([tab.sla('HD-2155'), tab.sla('HD-2156'), tab.sla('HD-2184'), tab.sla('HD-2185'), tab.sla('HD-2157')], ['Not set', '15h 20m left', '3h 15m left', '3h 35m left', 'Paused']);
  // The queue opens on All open, so 2-B and 2-C (already Riley's) show.
  const queue = tab.view('helpdesk/tickets');
  assert.match(queue, /<option value="mine" selected>Assigned to my group › All open<\/option>/);
  ['INC0010155', 'INC0010412', 'INC0010431', 'INC0010433', 'INC0010377'].forEach((n) => assert.match(queue, new RegExp(n)));
  assert.doesNotMatch(queue.replace(/<[^>]*>/g, ' '), /\b(HD|SR|SEC)-21\d\d\b/, 'INC numbers only');
  // Yesterday's note is in the history, and it isn't the student's note.
  const html = tab.open('HD-2156');
  assert.match(html, /Riley Morgan \(Tue\)[\s\S]*cleared stuck jobs, unticked Use Printer Offline/);
  assert.match(html, /data-hd-arrival="ines-reopen"[\s\S]*Wed 12:50[\s\S]*It is NOT resolved/);
  assert.equal(tab.area('HD-2156', 'Documentation').ok, false, 'the seeded note counts for nothing');
  // "Check my work" no longer says Module 1 pre-sets the priority.
  tab.run("hdConsoleCheckWork('HD-2156')");
  assert.doesNotMatch(tab.open('HD-2156'), /pre-set in Module 1/);
}

function testTicket2ARequestAndApproval() {
  const tab = sim();
  // Granting before the owner approves: refused, and recorded as feedback.
  tab.run("hdConsoleAction('HD-2155', 'grant')");
  assert.match(tab.lastToast(), /approve/i);
  assert.ok(tab.feedback('HD-2155').critical.some((text) => /before the mailbox owner approved/.test(text)));
  assert.equal(tab.area('HD-2155', 'Triage').text, 'Convert the incident to a request. Nina never had access, so nothing is broken. Set Requested for to Nina Patel, the person who needs the access.');
  // The right path.
  tab.ask('HD-2155', 'access'); tab.ask('HD-2155', 'invites');
  tab.input('hd-kb-input', 'calendar delegate'); tab.run("hdKbSearch({ preventDefault() {} }, 'HD-2155'); hdKbOpen('HD-2155', 'KB-0062')");
  tab.run("hdConvertSet('HD-2155', 'item', 'Calendar delegate access'); hdConvertSet('HD-2155', 'requestedFor', 'Nina Patel'); hdConvertSet('HD-2155', 'mailbox', 'Omar Haddad'); hdConvertSet('HD-2155', 'permission', 'Editor (delegate)'); hdConvertToRequest('HD-2155')");
  const t = tab.ticket('HD-2155');
  assert.deepEqual([t.status, t.cancelReason, t.request.number, t.request.approval], ['Canceled', 'Converted', 'RITM0010088', 'Approved']);
  assert.match(tab.open('HD-2155'), /data-hd-arrival="omar-approves"/);
  tab.run("hdConsoleAction('HD-2155', 'grant')");
  tab.note('HD-2155', 'Reported: new assistant cannot see or book the manager\'s calendar.\nTried: confirmed no existing delegate; converted to RITM0010088 (Calendar delegate access); owner O. Haddad approved in the portal; granted N. Patel Editor delegate, invitations copied per owner.\nResult: Nina confirmed she can view and book.\nNext action: none; close the request.');
  tab.comment('HD-2155', 'Hi Omar, Nina now has delegate access to your calendar, so she can see your schedule and book meetings for you. As you asked, she\'ll also receive copies of your meeting invitations. If you ever want to change what she can do, just reply here. – Riley');
  const fb = tab.feedback('HD-2155');
  fb.areas.forEach((a) => assert.equal(a.ok, true, `${a.area}: ${a.text}`));
  assert.equal(fb.critical.length, 1, 'the early grant stays on the record');
  // Owner (full control) is never right.
  const other = sim();
  other.run("hdConvertSet('HD-2155', 'item', 'Calendar delegate access'); hdConvertSet('HD-2155', 'requestedFor', 'Nina Patel'); hdConvertSet('HD-2155', 'mailbox', 'Omar Haddad'); hdConvertSet('HD-2155', 'permission', 'Owner (full control)'); hdConvertToRequest('HD-2155')");
  assert.equal(other.area('HD-2155', 'Action').ok, false);
  assert.match(other.area('HD-2155', 'Action').text, /Editor \(delegate\)/);
}

function testTicket2BLinksAndNextDay() {
  const tab = sim();
  // Escalate without linking either related ticket: the feedback names both.
  tab.run("hdMatrixAssignGroup('HD-2156', 'Desktop Support (Tier 2)')");
  assert.equal(tab.ticket('HD-2156').status, 'Escalated');
  let action = tab.area('HD-2156', 'Action');
  assert.equal(action.ok, false);
  assert.match(action.text, /INC0010431/); assert.match(action.text, /INC0010433/);
  // Link one: only the other is named.
  tab.run("hdLinkParent('HD-2184', 'HD-2156')");
  action = tab.area('HD-2156', 'Action');
  assert.doesNotMatch(action.text, /INC0010431/); assert.match(action.text, /INC0010433/);
  // "Next day" lists 2-A and 2-C, never the two related tickets.
  const locked = tab.view('helpdesk/dashboard');
  assert.match(locked, /data-hd-next-day="locked"/);
  assert.match(locked, /Still needs work today: INC0010155 and INC0010377/);
  assert.doesNotMatch(locked.match(/Still needs work today:[^<]*/)[0], /INC0010431|INC0010433/);
  tab.run("hdConvertSet('HD-2155', 'item', 'Calendar delegate access'); hdConvertSet('HD-2155', 'requestedFor', 'Nina Patel'); hdConvertSet('HD-2155', 'mailbox', 'Omar Haddad'); hdConvertSet('HD-2155', 'permission', 'Editor (delegate)'); hdConvertToRequest('HD-2155')");
  tab.attempt('HD-2157', 'Phone – voicemail left');
  assert.match(tab.view('helpdesk/dashboard'), /data-hd-next-day="open"/);
  tab.run('hdNextDay()');
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-20T13:00:00.000Z');
  // Thursday 13:00: the linked one is fine, the unlinked one stays Breached.
  assert.equal(tab.sla('HD-2185'), 'Breached');
  assert.notEqual(tab.sla('HD-2184'), 'Breached');
  assert.notEqual(tab.sla('HD-2156'), 'Breached');
  assert.equal(tab.sla('HD-2157'), 'Paused');
  // The right path: both linked, "(reopened)", the note and the comment.
  const good = sim();
  good.run("hdLinkParent('HD-2184', 'HD-2156'); hdLinkParent('HD-2185', 'HD-2156')");
  good.input('hd-rewrite-short', 'Reception badge printer will not print (reopened)'); good.input('hd-rewrite-desc', 'Reopened by Ines Calder.');
  good.run("hdRewriteSave('HD-2156')");
  good.run("hdMatrixAssignGroup('HD-2156', 'Desktop Support (Tier 2)')");
  good.note('HD-2156', 'Reported: reopened, badge printer failing again after yesterday\'s fix.\nTried: read prior work (queue cleared, offline flag unset), which held for 1 badge; linked INC0010431 and INC0010433 from other reception PCs as related, so likely the printer or print server side, not the PC; reopened INC0010412.\nResult: escalated to Desktop Support with history.\nNext action: Desktop Support investigates the printer side; update to the user by 14:00.');
  good.comment('HD-2156', 'Hi Ines, I\'m sorry it came back, and thank you for telling us. I\'ve reopened your ticket rather than starting a new one, so nothing gets lost. Other reception computers are seeing it too, which tells us the problem is with the printer itself, not your PC. Our desktop team is taking it now. I\'ll update you by 2:00. – Riley');
  good.feedback('HD-2156').areas.forEach((a) => assert.equal(a.ok, true, `${a.area}: ${a.text}`));
}

function testTicket2CThreeAttemptsThenResolve() {
  const tab = sim();
  assert.match(tab.open('HD-2157'), /data-hd-attempts="1"/);
  assert.ok(tab.run("hdResolutionCodes(hdTicketById('HD-2157'))").includes('No response from caller'));
  assert.equal(tab.area('HD-2157', 'Documentation').ok, false, 'Monday\'s seeded comment counts for nothing');
  // Closing after two attempts: the feedback says three.
  const early = sim();
  early.attempt('HD-2157', 'Phone – voicemail left');
  early.run("hdSetResolutionCode('HD-2157', 'No response from caller')");
  early.state('HD-2157', 'Resolved', { 'hd-resolution-notes': 'No response from the caller after two attempts.' });
  assert.equal(early.area('HD-2157', 'Action').ok, false);
  assert.match(early.area('HD-2157', 'Action').text, /three contact attempts/);
  // The right path: attempt 2 today, Next day, attempt 3, then resolve.
  tab.attempt('HD-2157', 'Phone – voicemail left');
  tab.note('HD-2157', 'Attempt 2: phoned Marcus, no answer, voicemail left. No response yet.');
  tab.run("hdConvertSet('HD-2155', 'item', 'Calendar delegate access'); hdConvertSet('HD-2155', 'requestedFor', 'Nina Patel'); hdConvertSet('HD-2155', 'mailbox', 'Omar Haddad'); hdConvertSet('HD-2155', 'permission', 'Editor (delegate)'); hdConvertToRequest('HD-2155')");
  tab.run("hdMatrixAssignGroup('HD-2156', 'Desktop Support (Tier 2)')");
  tab.run('hdNextDay()');
  tab.attempt('HD-2157', 'Customer comment (Additional comments)');
  tab.comment('HD-2157', 'Hi Marcus, we haven\'t been able to reach you about Outlook asking for your password, so we\'ve resolved this ticket for now. If it\'s still happening, just reply to this email within 3 business days and the ticket will reopen, or call us anytime. – Riley');
  tab.note('HD-2157', 'Reported: Outlook keeps asking for the user\'s password; screenshot requested Monday.\nTried: 3 contact attempts – Monday comment, Wednesday phone (voicemail left), Thursday comment; no response.\nResult: resolved per Northstar no-response policy; caller may reopen within 3 business days by replying.');
  tab.run("hdSetResolutionCode('HD-2157', 'No response from caller')");
  tab.state('HD-2157', 'Resolved', { 'hd-resolution-notes': 'No response from the caller after three contact attempts.' });
  assert.match(tab.open('HD-2157'), /Mon 09:40[\s\S]*Wed 13:00 · Phone – voicemail left[\s\S]*Thu 13:00 · Customer comment/);
  tab.feedback('HD-2157').areas.forEach((a) => assert.equal(a.ok, true, `${a.area}: ${a.text}`));
  // Lab 2.2 is done with the two related tickets still open.
  assert.equal(tab.ticket('HD-2184').status, 'New');
  assert.equal(tab.run('hdPracticeClosed()'), true, '2-A converted, 2-B escalated, 2-C resolved');
}

function testCompletionNeedsAllThree() {
  const tab = sim();
  assert.deepEqual(plain(tab.run('HD_PRACTICE_SET.set.complete')), ['HD-2155', 'HD-2156', 'HD-2157']);
  tab.run("hdMatrixAssignGroup('HD-2156', 'Desktop Support (Tier 2)')");
  tab.run("hdConvertSet('HD-2155', 'item', 'Calendar delegate access'); hdConvertSet('HD-2155', 'requestedFor', 'Nina Patel'); hdConvertSet('HD-2155', 'mailbox', 'Omar Haddad'); hdConvertSet('HD-2155', 'permission', 'Editor (delegate)'); hdConvertToRequest('HD-2155')");
  assert.equal(tab.run('hdPracticeClosed()'), false, '2-C still on hold');
  // Module 1's practice set has no complete list: every ticket, as before.
  const m01 = sim({ url: 'https://academy.test/sim/?practice=its-01&student=stu-m02p#/helpdesk/tickets' });
  assert.equal(m01.run('HD_PRACTICE_SET.set.complete'), undefined);
  m01.run("hdState.tickets.slice(1).forEach((t) => { t.status = 'Resolved'; })");
  assert.equal(m01.run('hdPracticeClosed()'), false);
  m01.run("hdState.tickets.forEach((t) => { t.status = 'Resolved'; })");
  assert.equal(m01.run('hdPracticeClosed()'), true);
  // Module 1's own queue opens on its old list view.
  assert.doesNotMatch(m01.view('helpdesk/tickets'), /Incidents ›/);
}

const tests = [testTheSetOpensOnWednesday, testTicket2ARequestAndApproval, testTicket2BLinksAndNextDay, testTicket2CThreeAttemptsThenResolve, testCompletionNeedsAllThree];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m02-practice-tickets: all ${tests.length} passed`);

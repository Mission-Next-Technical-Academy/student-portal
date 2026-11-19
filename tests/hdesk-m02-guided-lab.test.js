'use strict';
// Help Desk Module 2 (key its-10) Practice It, Lab 2.1 · Guided Lab: queue
// shift. The six practice-queue tickets (HD-2158 to SEC-2163, shown as
// INC0010158 to INC0010163) in the coached set 'its-10-guided'
// (ui/helpdesk-data.js), the hd-m10 coach (ui/helpdesk-coaches.js), the
// portal's cleaner (portal/it-support-shared.js) and the Lab 2.1 instructor
// sheet (portal/admin-sheets/hdesk.js).
//
//   - The lab opens on the set: six tickets, Tuesday 08:35, no priority set,
//     and the arrival times put the work order in the wrong order.
//   - The coach walks all ten steps to Finish; each says why and what
//     success looks like. Feedback only, never points.
//   - Each ticket's priority note says whether the student's rating matches.
//   - Steps still pass when the student works out of order (Priya's reply
//     can arrive before step 7 is reached).
//   - The portal keeps the queue work, the rewrite and the knowledge draft;
//     the sheet shows them in full. An older P1-note attempt keeps its sheet.
//   - A run saved under the old four-step coach starts fresh.
//   - No graded Prove It ticket, requester or story is in any Module 2 file.
//
// The simulator runs in a Node vm with a small fake DOM; the portal runs in
// tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
const STUDENT = 'student-m02g0001';
const launchUrl = (restart = true) => `${SIM_URL}?coach=hd-m10${restart ? '&restart=1' : ''}&student=${STUDENT}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const QUEUE = ['HD-2158', 'HD-2159', 'HD-2160', 'SR-2161', 'HD-2162', 'SEC-2163'];

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

// One browser tab, as tests/hdesk-m01-guided-lab.test.js builds it.
function sim(url, { local = store(), session = store(), opener = null } = {}) {
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
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
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
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  const tab = {
    ctx, toasts, local, session, run, input,
    hd: () => run('hdState'),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdState.selectedTicketId = ${j(id)}`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    impact: (id, impact, urgency) => run(`hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    state: (id, status, extra = {}) => { Object.entries(extra).forEach(([k, v]) => input(k, v)); run(`hdTransitionTicket(${j(id)}, ${j(status)})`); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    coachStep: () => (JSON.parse(session.getItem('mnt.coach.state') || 'null') || {}).step,
    stepCount: () => run("MODULE_COACHES.find((c) => c.id === 'hd-m10').steps.length"),
    advance: () => {
      for (;;) {
        const before = tab.coachStep();
        if (before === undefined || before >= tab.stepCount() - 1) return before;
        click('next');
        if (tab.coachStep() === before) return before;
      }
    },
    finish: () => click('finish'),
  };
  return tab;
}

const P1_NOTE = 'Reported: Customer Service can\'t take calls; the phone app shows "Not connected" for the whole team since 08:30; customers are reaching voicemail.\nTried: confirmed with Sam that every agent is affected; set Impact 1 and Urgency 1 (P1); told the Service Desk lead at 08:37.\nResult: assigned to Messaging & Collaboration.\nNext action: Messaging & Collaboration investigates; Service Desk updates Sam by 08:50.';
const P1_COMMENT = 'Hi Sam, thank you for telling us. With the whole team unable to take calls, this is now our top priority. Our collaboration team is working on it, and I\'ll update you by 8:50, or sooner if it\'s fixed. – Riley, Northstar Service Desk';
const REWRITE_SHORT = 'Wi-Fi no internet – Luis Ortega – Sales floor 3';
const REWRITE_DESC = 'Luis Ortega, Sales, floor 3. Laptop Wi-Fi shows "No internet" since about 08:15. All of Sales on floor 3 is affected (parent INC0010159); desks with a network cable work. Client calls start at 10:00. Tried: Wi-Fi off and on, same result.';
const SEC_NOTE = 'Reported: Maya opened Invoice_8841 from accounts@brightfield-supply.example and clicked Enable content at about 08:20 on NS-LT-0042.\nTried: collected the indicators; asked Maya not to open anything else.\nResult: assigned to Security Operations (SOC).\nNext action: SOC investigates the laptop and the email.';

// Steps 1 to 6, the way the spec's table describes them.
function firstSix(tab) {
  ['priority', 'sla', 'category', 'caller', 'created'].forEach((key) => tab.run(`hdQueueColumn('${key}', true)`));
  tab.advance();
  tab.triage('HD-2158', 'Software', 'Phone app', 'Customer Service phone app', '1', '1');
  tab.triage('HD-2159', 'Network', 'Wi-Fi', 'Floor 3 Wi-Fi', '1', '2');
  tab.triage('HD-2160', 'Network', 'Wi-Fi', 'NS-LT-0154', '3', '3'); // rated alone
  tab.triage('SR-2161', 'Request', 'Hardware', 'NS-LT-0145', '3', '3');
  tab.triage('HD-2162', 'Hardware', 'Mouse', 'NS-LT-0094', '3', '2');
  tab.triage('SEC-2163', 'Security', 'Suspicious email', 'NS-LT-0042', '2', '1');
  tab.advance();
  tab.run("hdConvertSet('SR-2161', 'item', 'Wireless headset'); hdConvertToRequest('SR-2161')");
  tab.advance();
  tab.run("hdLinkParent('HD-2160', 'HD-2159')");
  tab.input('hd-rewrite-short', REWRITE_SHORT); tab.input('hd-rewrite-desc', REWRITE_DESC);
  tab.run("hdRewriteSave('HD-2160')");
  tab.impact('HD-2160', '1', '2');
  tab.advance();
  tab.run("hdState.workOrder = ['HD-2158', 'SEC-2163', 'HD-2159', 'HD-2160', 'HD-2162', 'SR-2161']; hdWorkOrderSubmit()");
  tab.advance();
  tab.run("hdMatrixAssignGroup('SEC-2163', 'Security Operations (SOC)')");
  tab.note('SEC-2163', SEC_NOTE);
  tab.advance();
}
function stepsSevenToTen(tab) {
  tab.comment('HD-2162', 'Hi Priya, is it a wireless mouse, and when were its batteries last changed? – Riley');
  tab.state('HD-2162', 'In Progress');
  tab.state('HD-2162', 'On Hold', { 'hd-hold-reason': 'Awaiting Caller' });
  tab.advance();
  tab.input('hd-kb-input', 'wifi no internet');
  tab.run("hdKbSearch({ preventDefault() {} }, 'HD-2159'); hdKbOpen('HD-2159', 'KB-0063'); hdKbAttach('HD-2159', 'KB-0063')");
  tab.advance();
  tab.note('HD-2158', P1_NOTE);
  tab.comment('HD-2158', P1_COMMENT);
  tab.run("hdMatrixAssignGroup('HD-2158', 'Messaging & Collaboration')");
  tab.advance();
  tab.run("hdSetResolutionCode('HD-2162', 'Solution provided')");
  tab.state('HD-2162', 'Resolved', { 'hd-resolution-notes': 'Priya put new batteries in the wireless mouse; the pointer no longer freezes.' });
  tab.input('hd-kb-draft-title', 'Wireless mouse pointer freezes: replace the batteries first');
  tab.input('hd-kb-draft-text', '1. Ask if the mouse is wireless. 2. Replace the batteries. 3. Confirm the pointer no longer freezes.');
  tab.run("hdKbCreateDraft('HD-2162')");
  tab.advance();
}

/* ------------------------------------------------------------ the shift */

function testTheLabOpensOnItsOwnSet() {
  const tab = sim(launchUrl());
  assert.equal(tab.run('hdState.ticketSet'), 'its-10-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), QUEUE.slice().sort());
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-18T08:35:00.000Z');
  for (const id of QUEUE) {
    assert.equal(tab.ticket(id).priority, '', `${id} starts with no priority`);
    assert.equal(tab.run(`hdSlaState(hdTicketById('${id}')).label`), 'Not set');
  }
  // Rows show INC numbers only (call 14); the template's category never shows.
  ['priority', 'sla', 'category', 'caller', 'created'].forEach((key) => tab.run(`hdQueueColumn('${key}', true)`));
  const queue = tab.view('helpdesk/tickets');
  const text = queue.replace(/<[^>]*>/g, ' ');
  assert.doesNotMatch(text, /\b(HD|SR|SEC)-21\d\d\b/);
  QUEUE.forEach((id) => assert.match(text, new RegExp(tab.ticket(id).number)));
  // Sorting by Created gives the wrong work order (spec 8.2): oldest first.
  const rows = [...queue.matchAll(/data-hd-row="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(rows, ['SR-2161', 'HD-2162', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2158']);
  // Once rated, no ticket opens At risk or Breached (build plan section 4).
  const ratings = { 'HD-2158': ['1', '1'], 'HD-2159': ['1', '2'], 'HD-2160': ['1', '2'], 'SR-2161': ['3', '3'], 'HD-2162': ['3', '2'], 'SEC-2163': ['2', '1'] };
  Object.entries(ratings).forEach(([id, [i, u]]) => tab.impact(id, i, u));
  const labels = Object.fromEntries(QUEUE.map((id) => [id, tab.run(`hdSlaState(hdTicketById('${id}')).label`)]));
  assert.deepEqual(labels, { 'HD-2158': '11m left', 'HD-2159': '10m left', 'HD-2160': '17m left', 'SR-2161': '14h 25m left', 'HD-2162': '7h 35m left', 'SEC-2163': '19m left' });
  // The shared Practice shift never gets them, nor any other Module 2 ticket.
  const shared = sim(`${SIM_URL}#/helpdesk/tickets`);
  const ids = shared.run('hdState.tickets.map((t) => t.id)');
  assert.ok(!ids.some((id) => QUEUE.includes(id) || ['HD-2155', 'HD-2156', 'HD-2157', 'HD-2169', 'HD-2170'].includes(id)));
  assert.equal(shared.run('hdActiveSet()'), null);
  // Module 1's coach still narrows the shift to its own tickets.
  const m01 = sim(`${SIM_URL}?coach=hd-m01&restart=1&student=${STUDENT}#/helpdesk/tickets`);
  assert.deepEqual(plain(m01.run('hdState.tickets.map((t) => t.id)')).sort(), ['HD-2150', 'SR-2102', 'SR-2103', 'SR-2116']);
}

function testKnowledgeArticlesAreFound() {
  const tab = sim(launchUrl());
  const search = (query) => tab.run(`hdKbSearchArticles(${JSON.stringify(query)}, hdKbArticles()).map((a) => a.id)`);
  assert.equal(search('wifi no internet')[0], 'KB-0063');
  assert.equal(search('calendar delegate')[0], 'KB-0062');
  const kb62 = tab.run("HD_KB_ARTICLES.find((a) => a.id === 'KB-0062').summary");
  assert.match(kb62, /portal while signed in/i, 'call 12: a portal approval needs no callback');
  assert.match(kb62, /KB-0024/);
  assert.match(tab.run("HD_KB_ARTICLES.find((a) => a.id === 'KB-0063').summary"), /Never restart network equipment yourself/);
}

function testPriorityNoteOnEachTicket() {
  const tab = sim(launchUrl());
  assert.doesNotMatch(tab.open('HD-2158'), /hd-priority-coach/, 'nothing before the priority calculates');
  tab.impact('HD-2158', '2', '2');
  assert.match(tab.open('HD-2158'), /data-hd-priority-coach="differs"[\s\S]*Look again:[\s\S]*= P1\. You set P3\.[\s\S]*No rush/);
  tab.impact('HD-2158', '1', '1');
  assert.match(tab.open('HD-2158'), /data-hd-priority-coach="match"[\s\S]*Matches the facts:/);
  // Rated alone, the weak Wi-Fi ticket's note points at the link.
  tab.impact('HD-2160', '3', '3');
  assert.match(tab.open('HD-2160'), /data-hd-priority-coach="differs"[\s\S]*INC0010159/);
  // The sheet's expected priorities are the tickets' own.
  const coach = Object.fromEntries(QUEUE.map((id) => {
    const c = tab.run(`hdTicketById('${id}').console.priorityCoach`);
    return [id, tab.run(`hdMatrixPriority('${c.impact}', '${c.urgency}')`)];
  }));
  assert.deepEqual(coach, { 'HD-2158': 'P1', 'HD-2159': 'P2', 'HD-2160': 'P2', 'SR-2161': 'P5', 'HD-2162': 'P4', 'SEC-2163': 'P2' });
  const sheetSource = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  Object.entries(coach).forEach(([id, p]) => assert.match(sheetSource, new RegExp(`id: '${id}', priority: '${p}'`), `sheet agrees on ${id}`));
}

/* -------------------------------------------------------- the walkthrough */

function testWalkthroughEndToEnd() {
  const opener = fakeOpener();
  const tab = sim(launchUrl(), { opener });
  const coach = tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m10')");
  assert.equal(coach.steps.length, 11, 'ten steps, then Finish');
  coach.steps.slice(0, 10).forEach((s, i) => {
    assert.match(s.body, /^Why: [\s\S]*Success looks like:/, `step ${i + 1} says why and what success looks like`);
    assert.doesNotMatch(`${s.instruction} ${s.body}`, /\b(HD|SR|SEC)-21\d\d\b|Module 10|shift pilot|\d+\s*points?\b/i, `step ${i + 1} text`);
  });
  assert.equal(tab.coachStep(), 0);
  // Step 1 waits for all five columns.
  tab.run("hdQueueColumn('priority', true)"); tab.advance();
  assert.equal(tab.coachStep(), 0);
  ['sla', 'category', 'caller', 'created'].forEach((key) => tab.run(`hdQueueColumn('${key}', true)`));
  tab.advance();
  assert.equal(tab.coachStep(), 1);
  // Step 2 waits for every ticket; HD-2160 may be rated alone.
  tab.triage('HD-2158', 'Software', 'Phone app', 'Customer Service phone app', '1', '1');
  tab.advance();
  assert.equal(tab.coachStep(), 1);
  const fresh = sim(launchUrl(), { opener });
  firstSix(fresh);
  assert.equal(fresh.coachStep(), 6, 'steps 1 to 6 done');
  // Check order named the first ticket out of place on a wrong order.
  const wrong = sim(launchUrl());
  wrong.run('hdWorkOrderSubmit()');
  assert.match(wrong.run('hdState.workOrderResult'), /^INC00101\d\d is out of place/);
  stepsSevenToTen(fresh);
  assert.equal(fresh.coachStep(), 10, 'at Finish');
  // Priya's reply came after step 9 and took the ticket off hold.
  assert.match(fresh.open('HD-2162'), /data-hd-arrival="priya-reply"/);
  assert.equal(fresh.ticket('HD-2162').status, 'Resolved');
  assert.equal(fresh.run("hdConsoleState(hdTicketById('HD-2162')).kbDraft.state"), 'Review');
  fresh.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id).sort(), QUEUE.slice().sort());
  assert.deepEqual(work.workOrder, ['HD-2158', 'SEC-2163', 'HD-2159', 'HD-2160', 'HD-2162', 'SR-2161']);
  assert.equal(work.workOrderResult, 'ok');
  const luis = work.tickets.find((t) => t.id === 'HD-2160');
  assert.equal(luis.writing.description, REWRITE_DESC);
  assert.equal(work.tickets.find((t) => t.id === 'HD-2162').writing.kbDraftTitle, 'Wireless mouse pointer freezes: replace the batteries first');
  return work;
}

function testStepsPassOutOfOrder() {
  // The P1 ticket's note and comment first: Priya's reply arrives the moment
  // the mouse ticket goes on hold, before step 7 is reached.
  const tab = sim(launchUrl());
  tab.note('HD-2158', P1_NOTE); tab.comment('HD-2158', P1_COMMENT);
  tab.run("hdMatrixAssignGroup('HD-2158', 'Messaging & Collaboration')");
  tab.comment('HD-2162', 'Hi Priya, is it a wireless mouse? – Riley');
  tab.state('HD-2162', 'In Progress');
  tab.state('HD-2162', 'On Hold', { 'hd-hold-reason': 'Awaiting Caller' });
  assert.equal(tab.ticket('HD-2162').status, 'In Progress', 'the reply resumed it at once');
  firstSix(tab);
  tab.advance();
  assert.ok(tab.coachStep() >= 7, 'step 7 passes once the reply has arrived');
  // Converting the request before step 2 still lets step 2 pass.
  const early = sim(launchUrl());
  early.run("hdConvertSet('SR-2161', 'item', 'Wireless headset'); hdConvertToRequest('SR-2161')");
  ['priority', 'sla', 'category', 'caller', 'created'].forEach((key) => early.run(`hdQueueColumn('${key}', true)`));
  early.advance();
  early.triage('HD-2158', 'Software', 'Phone app', 'Customer Service phone app', '1', '1');
  early.triage('HD-2159', 'Network', 'Wi-Fi', 'Floor 3 Wi-Fi', '1', '2');
  early.triage('HD-2160', 'Network', 'Wi-Fi', 'NS-LT-0154', '1', '2');
  early.triage('HD-2162', 'Hardware', 'Mouse', 'NS-LT-0094', '3', '2');
  early.triage('SEC-2163', 'Security', 'Suspicious email', 'NS-LT-0042', '2', '1');
  early.advance();
  assert.ok(early.coachStep() >= 3, 'steps 2 and 3 pass with the request converted first');
}

function testOldWalkthroughStartsFresh() {
  // A browser halfway through the old four-step coach: the shared shift, and
  // a resume record at step 3.
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('hdSave()');
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m10', step: 3, student: STUDENT }));
  const tab = sim(launchUrl(false), { local });
  assert.equal(tab.coachStep(), 0, 'starts at the first step');
  assert.equal(tab.run('hdState.ticketSet'), 'its-10-guided');
  // A current run still resumes where it was.
  const current = sim(launchUrl(), { local: store() });
  ['priority', 'sla', 'category', 'caller', 'created'].forEach((key) => current.run(`hdQueueColumn('${key}', true)`));
  current.advance();
  assert.equal(current.coachStep(), 1);
  const resumed = sim(launchUrl(false), { local: current.local });
  assert.equal(resumed.coachStep(), 1, 'same step after a relaunch');
  assert.deepEqual(plain(resumed.run('hdState.queueView.columns')), ['priority', 'sla', 'category', 'caller', 'created']);
}

/* ------------------------------------------------- the portal and the sheet */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const LAB21 = 'lab-its-10-priority-queue';

function testPortalAndSheet(work) {
  const clean = prun('itsCleanCoachWork')(work);
  assert.ok(clean, 'the work is kept');
  assert.equal(clean.tickets.length, 6);
  assert.deepEqual(clean.workOrder, work.workOrder);
  const luis = clean.tickets.find((t) => t.id === 'HD-2160');
  assert.deepEqual([luis.number, luis.console.parent, luis.console.matrix.priority], ['INC0010160', 'HD-2159', 'P2']);
  assert.equal(luis.writing.description, REWRITE_DESC);
  assert.deepEqual(luis.console.rewriteMissing, []);
  assert.equal(clean.tickets.find((t) => t.id === 'SR-2161').console.request.approval, 'Approved');
  assert.deepEqual(clean.tickets.find((t) => t.id === 'HD-2159').console.kbAttached, ['KB-0063']);
  // Unknown keys are dropped; a Module 1 snapshot gains no new keys.
  const extra = JSON.parse(JSON.stringify(work));
  extra.tickets[0].console.matrix.secret = 'x'; extra.tickets[0].answer = 'x';
  const kept = prun('itsCleanCoachWork')(extra).tickets[0];
  assert.equal(kept.answer, undefined); assert.equal(kept.console.matrix.secret, undefined);
  const m01 = prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-2150', status: 'Resolved', console: { kbSearches: [] } }] }).tickets[0];
  assert.ok(!['matrix', 'request', 'parent', 'kbAttached'].some((key) => key in m01.console), 'no Module 2 keys on Module 1 work');
  assert.ok(!('writing' in m01) && !('number' in m01));

  const sheet = prun('AdminSubmissionSheet');
  const row = { id: 'm02g-1', lab_key: LAB21, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-19T15:00:00Z', result: { source: 'mnt-coach-complete', work: clean } };
  const built = sheet.evaluate(row);
  const ids = plain(built.sections.map((s) => s.id));
  assert.deepEqual(ids, ['queue-work-order', ...['HD-2158', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2162', 'SR-2161'].map((id) => `queue-${id.toLowerCase()}`)]);
  built.sections.forEach((s) => assert.equal(s.status, 'pass', s.id));
  const html = sheet.render(row);
  [REWRITE_DESC, 'Wireless mouse pointer freezes: replace the batteries first', 'told the Service Desk lead at 08:37', 'Our collaboration team is working on it'].forEach((text) => assert.ok(html.includes(text.replace(/"/g, '&quot;')) || html.includes(text), `the sheet shows: ${text}`));
  assert.match(html, /1\. INC0010158/);
  assert.doesNotMatch(html, /Priority decision|Priority justification/);
  // A rough run: wrong priority, no link, order not checked.
  const rough = JSON.parse(JSON.stringify(clean));
  const sam = rough.tickets.find((t) => t.id === 'HD-2158');
  sam.console.matrix = { ...sam.console.matrix, impact: '2', urgency: '2', priority: 'P3' };
  rough.tickets.find((t) => t.id === 'HD-2160').console.parent = '';
  rough.workOrderResult = 'INC0010162 is out of place. Move it up, above INC0010161.';
  const roughSheet = sheet.evaluate({ ...row, id: 'm02g-2', result: { ...row.result, work: rough } });
  ['queue-work-order', 'queue-hd-2158', 'queue-hd-2160'].forEach((id) => assert.notEqual(roughSheet.sections.find((s) => s.id === id).status, 'pass', id));
  // The resolution notes the student wrote show in full.
  assert.ok(html.includes('Priya put new batteries in the wireless mouse; the pointer no longer freezes.'), 'resolution notes shown');
  // The request converted before triage: the two triage checks are the
  // instructor's judgment, not a failure, and what was set still shows.
  const early = JSON.parse(JSON.stringify(clean));
  const amir = early.tickets.find((t) => t.id === 'SR-2161');
  amir.console.matrix = { ...amir.console.matrix, impact: '', urgency: '', priority: '' };
  amir.console.classification = { category: '', subcategory: '', ci: '', contactType: '' };
  const earlySection = sheet.evaluate({ ...row, id: 'm02g-4', result: { ...row.result, work: early } }).sections.find((s) => s.id === 'queue-sr-2161');
  assert.notEqual(earlySection.status, 'fail', 'converted first is never a failure');
  const unconverted = JSON.parse(JSON.stringify(early));
  unconverted.tickets.find((t) => t.id === 'SR-2161').console.request = null;
  assert.equal(sheet.evaluate({ ...row, id: 'm02g-5', result: { ...row.result, work: unconverted } }).sections.find((s) => s.id === 'queue-sr-2161').status, 'fail', 'not triaged and not converted still fails');
  // An attempt saved under the old coach keeps the P1 sheet.
  const oldRow = { ...row, id: 'm02g-3', result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [{ id: 'SEC-2114', priority: 'P1', notes: [{ author: 'Riley Morgan', time: '10:00', text: 'P1: possible compromise.' }] }] } } };
  assert.ok(sheet.evaluate(oldRow).sections.some((s) => s.id === 'priority-sec-2114'));
}

/* ------------------------------------------- nothing from the graded queue */

// The graded Prove It queue is built later, from its own spec section. Its
// ticket numbers are a range; its requesters and story words are kept here
// only as short hashes, so this file names none of them.
const GRADED_NUMBERS = [];
for (let n = 2137; n <= 2142; n += 1) ['HD', 'SR', 'SEC'].forEach((p) => GRADED_NUMBERS.push(`${p}-${n}`, `INC00${10000 + n}`));
const GRADED_WORDS = new Set(['60f91a742458ae60', 'db729480ba4a55cb', 'f9bfd1cc6928630f', '3e04da76d7473719', 'ae1fd358c7612a02', '6105d8625ada3c9b', '438287bf455f1f46', 'ed07e8161bc6033f']);
const GRADED_NAMES = new Set(['3d66495ece1b67f5', '7c07936279e0eebd', 'e9c41562630501f6', 'ef5a7f81895e893f', 'a27be2f427605a22', '21ce0b884ab19281']);
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);

function testNothingFromTheGradedQueue() {
  // Every file this part writes, and every committed Help Desk file.
  const files = ['ui/helpdesk-data.js', 'ui/helpdesk-coaches.js', 'ui/helpdesk.js', 'portal/admin-sheets/hdesk.js', 'portal/it-support-shared.js', 'portal/it-support-module-10.js',
    'tests/hdesk-m02-guided-lab.test.js', 'tests/hdesk-m02-practice-tickets.test.js', 'tests/hdesk-m02-console-features.test.js'];
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    GRADED_NUMBERS.forEach((id) => assert.ok(!new RegExp(`\\b${id}\\b`).test(source), `${file} has no graded ticket number`));
  }
  // Module 2's own content: its tickets, KB articles and coach text.
  const tab = sim(launchUrl());
  const content = tab.run(`JSON.stringify({
    tickets: HD_TICKET_TEMPLATES.filter((t) => t.ownSet),
    kb: HD_KB_ARTICLES.filter((a) => ['KB-0062', 'KB-0063'].includes(a.id)),
    coach: MODULE_COACHES.find((c) => c.id === 'hd-m10').steps.map((s) => [s.title, s.instruction, s.body]),
  })`).toLowerCase();
  const words = content.split(/[^a-z0-9-]+/).filter(Boolean);
  words.forEach((word) => assert.ok(!GRADED_WORDS.has(hash(word)), 'no graded story word in Module 2 content'));
  for (let i = 0; i + 1 < words.length; i += 1) assert.ok(!GRADED_NAMES.has(hash(`${words[i]} ${words[i + 1]}`)), 'no graded requester in Module 2 content');
}

const tests = [
  testTheLabOpensOnItsOwnSet, testKnowledgeArticlesAreFound, testPriorityNoteOnEachTicket,
  testStepsPassOutOfOrder, testOldWalkthroughStartsFresh, testNothingFromTheGradedQueue,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
try { const work = testWalkthroughEndToEnd(); console.log('ok   testWalkthroughEndToEnd'); testPortalAndSheet(work); console.log('ok   testPortalAndSheet'); } catch (error) { failed += 1; console.error(`FAIL walkthrough or sheet\n${error.stack}`); }
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`hdesk-m02-guided-lab: all ${tests.length + 2} passed`);

// Module 2 (key its-10) Prove It: the queue shift (ui/helpdesk.js queue Prove
// mode, HD_PROVE_SHIFTS['its-10']) and the course page's side of it
// (portal/it-support-shared.js itsCleanProveQueueWork, the prefill, the review
// panel and the grading card).
//
//   - The shift opens with every ticket but the one that arrives later, on
//     the fixed shift clock, with every field and SLA bar "Not set", INC
//     numbers only and no coach, hint, Check order or feedback.
//   - The late ticket arrives after the third triaged ticket, or after its
//     minutes; a reload keeps the fields, order, writing and arrival.
//   - Submit waits for every field, the reasons and the rewrite; the package
//     has a position per ticket that matches the order.
//   - The course page accepts a full package at the limits, refuses writing
//     that doesn't fit, works out Priority and position itself, and keeps
//     every reason. Module 1's packages are refused under Module 2's rubric.
//   - The instructor panel shows every ticket, the order and all the writing.
//
// Structure only: every value here is arbitrary, and nothing says which
// choice is right. Ticket ids are read from the shift, never named here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const UI = path.join(__dirname, '..', 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-10-prove-it';
// Values from a vm context have that context's prototypes: compare copies.
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);

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
function sim(student, local = store()) {
  const u = new URL(`https://academy.test/sim/?prove=its-10&student=${student}#/helpdesk/tickets`);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const toasts = [];
  const body = element('body');
  body.appendChild = () => {};
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener() {}, getElementById: () => null, createElement: () => element(''), querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState() {} },
    localStorage: local, sessionStorage: store(),
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
  const run = (code) => vm.runInContext(code, ctx);
  return { ctx, run, local, toasts, view: (route) => run(`VIEWS['${route}']()`) };
}
const shift = sim('probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-10']))");
const IDS = shift.tickets.map((t) => t.id);
const LATE = shift.tickets.find((t) => t.arrives);
const NUMBER = Object.fromEntries(shift.tickets.map((t) => [t.id, t.number]));

// Arbitrary values, the same each run: they are not an answer.
const ARBITRARY = [['2', '3', 'Incident'], ['3', '1', 'Service request'], ['1', '3', 'Security incident'], ['3', '3', 'Incident'], ['2', '2', 'Service request'], ['3', '2', 'Incident']];
function triage(tab, id, index) {
  const [impact, urgency, cls] = ARBITRARY[index % ARBITRARY.length];
  tab.ctx.hdProveQueueSet(NUMBER[id], 'impact', impact);
  tab.ctx.hdProveQueueSet(NUMBER[id], 'urgency', urgency);
  tab.ctx.hdProveQueueSet(NUMBER[id], 'ticketClass', cls);
}
function fillEverything(tab) {
  tab.run('hdState.tickets.map((t) => t.id)').forEach((id, i) => triage(tab, id, i));
  IDS.forEach((id) => { if (!tab.run(`!!hdTicketById('${id}')`)) return; tab.ctx.hdProveQueueText(NUMBER[id], 'reason', `Arbitrary reason for ${NUMBER[id]}.`); });
  const rewrite = shift.tickets.find((t) => t.rewrite);
  tab.ctx.hdProveQueueText(rewrite.number, 'shortDescription', 'Arbitrary short description');
  tab.ctx.hdProveQueueText(rewrite.number, 'description', 'Arbitrary description of the problem.');
}

function testShiftData() {
  assert.equal(shift.labKey, LAB);
  assert.equal(shift.rubricVersion, 'hdesk-its-10-prove-v1');
  assert.equal(shift.queue, true);
  assert.equal(IDS.length, 6);
  assert.equal(new Set(shift.tickets.map((t) => t.number)).size, 6, 'six different INC numbers');
  shift.tickets.forEach((t) => {
    assert.match(t.number, /^INC00104(6[0-5])$/, 'INC numbers from the reserved range');
    ['priority', 'impact', 'urgency', 'ticketClass', 'category', 'expected', 'answer', 'position'].forEach((key) => assert.ok(!(key in t), `no ${key} on ${t.number}`));
  });
  assert.equal(shift.tickets.filter((t) => t.arrives).length, 1, 'one ticket arrives later');
  assert.equal(shift.tickets.filter((t) => t.rewrite).length, 1, 'one ticket to rewrite');
  // The INC number order is not the created order: it gives nothing away.
  const byCreated = shift.tickets.filter((t) => t.createdAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((t) => t.number);
  assert.notDeepEqual(byCreated, byCreated.slice().sort());
}

function testOpensWithoutTheLateTicket() {
  const tab = sim('stu-open');
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 5);
  assert.equal(tab.run(`!!hdTicketById('${LATE.id}')`), false);
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(shift.now).toISOString(), 'the fixed shift clock');
  const html = tab.view('helpdesk/tickets');
  IDS.forEach((id) => assert.ok(!html.includes(id), 'the queue shows no internal id'));
  shift.tickets.filter((t) => !t.arrives).forEach((t) => assert.ok(html.includes(t.number), 'the queue shows each INC number'));
  assert.ok(!html.includes(LATE.number), 'the late ticket is not listed yet');
  assert.match(html, /Not set/);
  assert.doesNotMatch(html, /At risk|Breached/, 'no bar is set before Impact and Urgency');
  ['Check order', 'Check my work', 'Your note needs', 'Start from the list', 'Hint', 'hd-coach'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.match(html, /Time used: \d+ min/);
  const first = tab.run('hdState.tickets[0].id');
  tab.run(`hdState.selectedTicketId = '${first}'`);
  const ticket = tab.view('helpdesk/ticket');
  IDS.forEach((id) => assert.ok(!ticket.includes(id), 'the ticket shows no internal id'));
  ['Check my work', 'Your note needs', 'Check order'].forEach((text) => assert.ok(!ticket.includes(text), `no ${text} on the ticket`));
  // The dashboard is the queue: the shared dashboard lists internal ids.
  assert.equal(tab.view('helpdesk/dashboard'), tab.view('helpdesk/tickets'));
  // The starting order is the created order, with nothing set.
  const created = tab.run('hdState.tickets.slice().sort(hdProveQueueByCreated).map((t) => t.id)');
  same(tab.run('hdState.prove.order.slice()'), created);
}

function testArrivalAfterThirdTriage() {
  const tab = sim('stu-triage');
  const ids = tab.run('hdState.tickets.map((t) => t.id)');
  triage(tab, ids[0], 0);
  triage(tab, ids[1], 1);
  // Two fields of a third ticket are not a triage.
  tab.ctx.hdProveQueueSet(NUMBER[ids[2]], 'impact', '1');
  tab.ctx.hdProveQueueSet(NUMBER[ids[2]], 'urgency', '2');
  assert.equal(tab.run('hdState.tickets.length'), 5);
  tab.ctx.hdProveQueueSet(NUMBER[ids[2]], 'ticketClass', 'Incident');
  assert.equal(tab.run('hdState.tickets.length'), 6, 'the third triage brings the late ticket');
  assert.equal(tab.run('hdState.prove.arrivals[0].reason'), 'triaged');
  assert.equal(tab.run('hdState.prove.order[hdState.prove.order.length - 1]'), LATE.id, 'it joins at the bottom');
  assert.equal(tab.run(`hdTicketById('${LATE.id}').createdTimestamp`), new Date(shift.now).toISOString(), 'created at the shift clock');
  assert.equal(tab.toasts.length, 1);
  // A reload keeps it, and it never arrives twice.
  const again = sim('stu-triage', tab.local);
  assert.equal(again.run('hdState.tickets.length'), 6);
  assert.equal(again.run('hdProveQueueArrive()'), false);
  assert.equal(again.run('hdState.prove.order.length'), 6);
}

function testArrivalAfterMinutes() {
  const tab = sim('stu-minutes');
  assert.equal(tab.run('hdProveQueueArrive()'), false);
  tab.run(`hdState.prove.startedAt = new Date(Date.now() - ${(LATE.arrives.afterMinutes * 60 + 5) * 1000}).toISOString()`);
  assert.equal(tab.run('hdProveQueueArrive()'), true);
  assert.equal(tab.run('hdState.prove.arrivals[0].reason'), 'minutes');
  assert.equal(tab.run('hdState.tickets.length'), 6);
}

function testReloadKeepsTheWork() {
  const tab = sim('stu-reload');
  fillEverything(tab);
  const last = tab.run('hdState.prove.order[5]');
  tab.ctx.hdProveQueueMove(NUMBER[last], -1);
  const parent = tab.run('hdState.tickets[0]');
  const child = tab.run('hdState.tickets[1]');
  tab.ctx.hdProveQueueSet(child.number, 'parent', parent.number);
  const before = tab.run('JSON.stringify({ tickets: hdState.tickets, prove: hdState.prove })');
  const again = sim('stu-reload', tab.local);
  assert.equal(again.run('JSON.stringify({ tickets: hdState.tickets, prove: hdState.prove })'), before, 'a reload keeps every field, the order, the writing and the arrival');
  assert.equal(again.run(`hdTicketById('${child.id}').parentId`), parent.id);
  // Another student on the same browser has their own attempt.
  assert.equal(sim('stu-other', tab.local).run('hdState.tickets.length'), 5);
}

function testSubmitWaitsAndPackage() {
  const tab = sim('stu-submit');
  assert.ok(tab.run('hdProveMissing().length') > 0);
  assert.match(tab.run('hdProveMissing().join(" | ")'), /still coming in/);
  fillEverything(tab);
  fillEverything(tab); // the late ticket's fields, once it is there
  same(tab.run('hdProveMissing()').slice(), []);
  // A reason box emptied on a top-two ticket holds Submit back again.
  const top = tab.run('hdTicketById(hdState.prove.order[0]).number');
  tab.ctx.hdProveQueueText(top, 'reason', '  ');
  assert.match(tab.run('hdProveMissing().join(" | ")'), new RegExp(`a reason on ${top}`));
  tab.ctx.hdProveQueueText(top, 'reason', 'Arbitrary reason again.');
  // A password in a reason is refused and holds Submit back.
  tab.ctx.hdProveQueueText(top, 'reason', 'password: Hunter22');
  assert.equal(tab.run('hdState.prove.passwordWritten'), true);
  assert.equal(tab.run('hdProveSubmitState().enabled'), false);
  assert.equal(tab.run(`hdProveQueueByNumber('${top}').reason`), 'Arbitrary reason again.', 'the refused text is not saved');
  tab.ctx.hdProveQueueText(top, 'reason', 'Arbitrary reason again.');
  const work = tab.run('JSON.parse(JSON.stringify(hdProvePackage()))');
  assert.equal(work.kind, 'hdesk-prove');
  assert.equal(work.shape, 'queue');
  assert.equal(work.labKey, LAB);
  assert.equal(work.rubricVersion, 'hdesk-its-10-prove-v1');
  same(Object.keys(work.tickets).sort(), IDS.slice().sort());
  work.order.forEach((id, i) => assert.equal(work.tickets[id].position, i + 1, 'position matches the order'));
  Object.values(work.tickets).forEach((t) => {
    assert.equal(typeof t.impact, 'string');
    assert.equal(typeof t.position, 'number');
    assert.equal(t.priority, { 1: { 1: 'P1', 2: 'P2', 3: 'P3' }, 2: { 1: 'P2', 2: 'P3', 3: 'P4' }, 3: { 1: 'P3', 2: 'P4', 3: 'P5' } }[t.impact][t.urgency]);
  });
  assert.equal(work.interrupt.ticketId, LATE.id);
  assert.equal(typeof work.elapsedSeconds, 'number');
  assert.ok(work.events.some((e) => e.type === 'field_set') && work.events.some((e) => e.type === 'ticket_arrived'));
  return work;
}

function testMovesAndLinks() {
  const tab = sim('stu-move');
  const order = tab.run('hdState.prove.order.slice()');
  tab.ctx.hdProveQueueMove(NUMBER[order[0]], -1); // already first: nothing
  same(tab.run('hdState.prove.order.slice()'), order);
  tab.ctx.hdProveQueueMove(NUMBER[order[0]], 1);
  same(tab.run('hdState.prove.order.slice(0, 2)'), [order[1], order[0]]);
  // A ticket can't be its own parent, nor its child's.
  tab.ctx.hdProveQueueSet(NUMBER[order[0]], 'parent', NUMBER[order[0]]);
  assert.equal(tab.run(`hdTicketById('${order[0]}').parentId`), '');
  tab.ctx.hdProveQueueSet(NUMBER[order[1]], 'parent', NUMBER[order[0]]);
  tab.ctx.hdProveQueueSet(NUMBER[order[0]], 'parent', NUMBER[order[1]]);
  assert.equal(tab.run(`hdTicketById('${order[0]}').parentId`), '');
  // Unknown values are not kept.
  tab.ctx.hdProveQueueSet(NUMBER[order[2]], 'impact', '4');
  tab.ctx.hdProveQueueSet(NUMBER[order[2]], 'ticketClass', 'Problem');
  assert.equal(tab.run(`hdTicketById('${order[2]}').impact + hdTicketById('${order[2]}').ticketClass`), '');
}

function testModuleOneIsUnchanged() {
  const u = new URL('https://academy.test/sim/?prove=its-01&student=stu-m1#/helpdesk/tickets');
  const tab = sim('x');
  // Module 1's shift opens its one ticket with its step pool, as before.
  const m1 = vm.createContext({ ...tab.ctx, location: { ...tab.ctx.location, search: u.search }, localStorage: store() });
  m1.window = m1;
  for (const [name, source] of SOURCES) vm.runInContext(source, m1, { filename: name });
  assert.equal(vm.runInContext('hdProveQueue()', m1), false);
  assert.equal(vm.runInContext('hdState.tickets.length', m1), 1);
  assert.ok(vm.runInContext('Array.isArray(hdState.tickets[0].pathPool)', m1));
  assert.ok(vm.runInContext("hdProveMissing().includes('diagnosis')", m1));
  assert.equal(vm.runInContext('hdProvePackage().shape', m1), undefined);
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};

function testPortalCleaner(work) {
  const clean = prun('itsCleanProveWork');
  const { work: saved, reason } = clean(work, 'its-10', LAB);
  assert.equal(reason, undefined);
  assert.equal(saved.shape, 'queue');
  // Priority and position are the course page's own.
  const forged = JSON.parse(JSON.stringify(work));
  Object.values(forged.tickets).forEach((t) => { t.priority = 'P1'; t.position = 99; });
  const recomputed = clean(forged, 'its-10', LAB).work;
  Object.entries(recomputed.tickets).forEach(([id, t]) => {
    assert.equal(t.priority, saved.tickets[id].priority);
    assert.equal(t.position, work.order.indexOf(id) + 1);
  });
  // Every reason is kept, also off the top two.
  Object.entries(work.tickets).forEach(([id, t]) => assert.equal(saved.tickets[id].reason, t.reason));
  // At the limits it fits; one character more is refused, never cut.
  const full = JSON.parse(JSON.stringify(work));
  Object.values(full.tickets).forEach((t) => { t.reason = 'r'.repeat(1000); });
  full.rewrite.shortDescription = 's'.repeat(160);
  full.rewrite.description = 'd'.repeat(4000);
  full.events = Array.from({ length: 400 }, (_, i) => ({ type: 'field_set', at: new Date(0).toISOString(), source: 'INC0010460', label: 'impact', value: String(i) }));
  const fits = clean(full, 'its-10', LAB);
  assert.ok(fits.work, 'a full package at the limits is accepted');
  assert.ok(JSON.stringify(fits.work).length <= 96 * 1024);
  const over = JSON.parse(JSON.stringify(full));
  over.rewrite.description += 'd';
  assert.equal(clean(over, 'its-10', LAB).reason, 'too-large');
  const overReason = JSON.parse(JSON.stringify(work));
  overReason.tickets[work.order[3]].reason = 'r'.repeat(1001);
  assert.equal(clean(overReason, 'its-10', LAB).reason, 'too-large');
  // Refused: a missing top-two reason, a wrong count, a bad order, a bad value,
  // a self link, a missing rewrite, a Module 1 package, another module.
  const broken = [
    (w) => { w.tickets[w.order[0]].reason = ' '; },
    (w) => { delete w.tickets[w.order[5]]; w.order.pop(); },
    (w) => { w.order[1] = w.order[0]; },
    (w) => { w.tickets[w.order[2]].urgency = 2; },
    (w) => { w.tickets[w.order[2]].ticketClass = 'Problem'; },
    (w) => { w.tickets[w.order[2]].parentId = w.order[2]; },
    (w) => { w.tickets[w.order[2]].parentId = w.order[3]; w.tickets[w.order[3]].parentId = w.order[2]; },
    (w) => { w.rewrite.description = ''; },
    (w) => { delete w.shape; },
  ];
  broken.forEach((change, i) => { const w = JSON.parse(JSON.stringify(work)); change(w); assert.equal(clean(w, 'its-10', LAB).reason, 'invalid', `broken package ${i} is refused`); });
  assert.equal(clean({ ...work, moduleKey: 'its-01' }, 'its-10', LAB).reason, 'invalid');
  assert.equal(clean(work, 'its-01', 'lab-its-01-prove-it').reason, 'invalid', 'a queue package is refused on Module 1');
  return saved;
}

function testPrefillRoundTrip(saved) {
  const row = { completed_at: new Date(Date.now() + 60000).toISOString(), result: { source: 'mnt-prove-submit', ...saved } };
  const lastWork = JSON.parse(JSON.stringify(prun('itsProvePrefillWork')(row)));
  assert.equal(lastWork.shape, 'queue');
  const tab = sim('stu-prefill');
  assert.equal(tab.run('hdProvePrefill')(lastWork), true);
  assert.equal(tab.run('hdState.tickets.length'), 6, 'every ticket, the late one too');
  same(tab.run('hdState.prove.order.slice()'), saved.order);
  IDS.forEach((id) => {
    assert.equal(tab.run(`hdTicketById('${id}').reason`), saved.tickets[id].reason);
    assert.equal(tab.run(`hdTicketById('${id}').priority`), saved.tickets[id].priority);
  });
  assert.equal(tab.run('hdState.prove.rewrite.description'), saved.rewrite.description);
  assert.equal(tab.run('hdProveQueueArrive()'), false, 'nothing arrives again');
  same(tab.run('hdProveMissing()').slice(), []);
  // A draft edited after the attempt keeps the draft.
  const newer = sim('stu-prefill-2');
  newer.ctx.hdProveQueueSet(NUMBER[newer.run('hdState.tickets[0].id')], 'impact', '2');
  assert.equal(newer.run('hdProvePrefill')({ ...lastWork, completedAt: new Date(Date.now() - 60000).toISOString() }), false);
}

function testReviewPanelAndGradingCard(saved) {
  const row = { id: 'att-m02-1', lab_key: LAB, student_id: '9900000001-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: saved };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="queue"/);
  IDS.forEach((id) => { assert.ok(html.includes(id)); assert.ok(html.includes(saved.tickets[id].number)); });
  Object.values(saved.tickets).filter((t) => t.reason).forEach((t) => assert.ok(html.includes(t.reason), 'every reason in full'));
  assert.ok(html.includes(saved.rewrite.shortDescription) && html.includes(saved.rewrite.description), 'the rewrite in full');
  assert.match(html, /in their work order/);
  assert.doesNotMatch(html, /data-its-prove-order-mismatch/, 'a saved attempt has matching positions');
  const forged = plain(saved);
  forged.tickets[forged.order[0]].position = 4;
  assert.match(prun('itsProveReviewPanel')({ ...row, result: forged }), /data-its-prove-order-mismatch/, 'positions that disagree with the order are flagged');
  // The grading card: two competencies, the writing parts and the rubric's
  // own acknowledgement line.
  prun(`itsProveRecommendations.set('att-m02-1', ${JSON.stringify({
    id: 'rec-1', status: 'scored', critical_error: false,
    competencies: [
      { id: 'triage', label: 'Triage', points: 61, judgment: false, earned: 44, student_feedback: 'Arbitrary.' },
      { id: 'documentation', label: 'Documentation and communication', points: 39, judgment: true, suggested: 17,
        parts: [{ id: 'p1', label: 'Part one', points: 21, suggested: 9 }, { id: 'p2', label: 'Part two', points: 18, suggested: 8 }] },
    ],
  })})`);
  const card = prun('itsProveGradingCard')({ lead: row, name: 'Synthetic Student', labTitles: ['Prove It: queue shift'] }, false);
  assert.match(card, /data-its-prove-points="triage"[^>]*value="44"/);
  assert.match(card, /data-its-prove-writing="documentation"/);
  assert.match(card, /data-its-prove-part="p1"/);
  assert.match(card, /every reason they wrote/);
  assert.doesNotMatch(card, /work note and reply to the user/);
  const rubric = prun("HDESK_PROVE_RUBRICS['lab-its-10-prove-it']");
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
}

const tests = [testShiftData, testOpensWithoutTheLateTicket, testArrivalAfterThirdTriage, testArrivalAfterMinutes, testReloadKeepsTheWork, testMovesAndLinks, testModuleOneIsUnchanged];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
try {
  const work = testSubmitWaitsAndPackage(); console.log('ok   testSubmitWaitsAndPackage');
  const saved = testPortalCleaner(work); console.log('ok   testPortalCleaner');
  testPrefillRoundTrip(saved); console.log('ok   testPrefillRoundTrip');
  testReviewPanelAndGradingCard(saved); console.log('ok   testReviewPanelAndGradingCard');
} catch (error) { failed += 1; console.error(`FAIL submit, portal or sheet\n${error.stack}`); }
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`hdesk-m02-prove: all ${tests.length + 4} passed`);

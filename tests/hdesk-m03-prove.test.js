// Module 3 (key its-11) Prove It: the one-ticket shift on Module 1's Prove
// form with Module 3's parts (ui/helpdesk.js, HD_PROVE_SHIFTS['its-11']) and
// the course page's side of it (portal/it-support-shared.js: the cleaner, the
// prefill, the review panel and the grading card; portal/it-support-module-11.js:
// the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no SLA badge and no coach.
//   - Priority is Impact x Urgency (P1 to P5); values the ticket doesn't offer
//     are not kept.
//   - Evidence cards and earlier calls open once each and are recorded once.
//   - Warm handoff: only with a group, logged once per group.
//   - Class, Category, group and decision are shuffled per attempt; a
//     reload keeps the order and the choice. Module 1 keeps its order.
//   - Submit waits for every part, whatever is chosen; a password is refused.
//   - The course page accepts the package, works out Priority itself, refuses
//     writing that doesn't fit and keeps Module 1's packages as they were.
//   - The instructor reads every word, the opened list, the warm handoff and
//     the time used; the grading card shows the five competencies.
//
// Structure only: every value here is arbitrary, and nothing says which
// choice is right. Writing is made up ("Synthetic note A ...").
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const UI = path.join(__dirname, '..', 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-11-prove-it';
const M1_LAB = 'lab-its-01-prove-it';
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);
const MATRIX = { 1: { 1: 'P1', 2: 'P2', 3: 'P3' }, 2: { 1: 'P2', 2: 'P3', 3: 'P4' }, 3: { 1: 'P3', 2: 'P4', 3: 'P5' } };
// Visible text only: tags (and the ids inside their attributes) removed.
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

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
    toast() {}, render() {},
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
    ctx, run, local, byId,
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    ticket: () => run('hdState.tickets[0]'),
    prove: () => plain(run('hdState.prove')),
    submitState: () => plain(run('hdProveSubmitState()')),
    coachPanel: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
  };
}
const SHIFT = sim('its-11', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-11']))");
const SPEC = SHIFT.tickets[0];
const NUMBER = SPEC.number;
const ID = SPEC.id;
const CLASSES = sim('its-11', 'probe2').run('HD_PROVE_CLASSES.slice()');
const GROUPS = sim('its-11', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run(`hdState.selectedTicketId = hdState.tickets[0].id`); return tab.view('helpdesk/ticket'); };

// Two arbitrary ways to fill the form, picked by position in the data. They
// differ in every choice; neither is an answer.
const CHOICES = {
  a: { ticketClass: CLASSES[2], category: SPEC.categoryOptions[4], impact: '3', urgency: '1', group: GROUPS[6], diagnosis: SPEC.diagnosisOptions[3], decision: 'Escalate', steps: ['q2', 'q7'] },
  b: { ticketClass: CLASSES[1], category: SPEC.categoryOptions[2], impact: '2', urgency: '3', group: GROUPS[4], diagnosis: SPEC.diagnosisOptions[0], decision: 'Resolve', steps: ['q6'] },
};
const WRITING = {
  keyFinding: 'Synthetic note A: a made-up finding for this test.',
  resolutionNote: 'Synthetic note B: Reported / Tried / Result / Next action, all made up.',
  userReply: 'Synthetic note C: a made-up update for the caller.',
  kbDraft: 'Synthetic note D: symptom, cause, workaround, owner (all made up).',
};
const PARTS = {
  assign: (tab) => tab.run(`hdProveAssign(hdState.tickets[0].id)`),
  ticketClass: (tab, c) => tab.ctx.hdProveSetField('ticketClass', c.ticketClass),
  category: (tab, c) => tab.ctx.hdProveSetField('category', c.category),
  impact: (tab, c) => tab.ctx.hdProveSetField('impact', c.impact),
  urgency: (tab, c) => tab.ctx.hdProveSetField('urgency', c.urgency),
  group: (tab, c) => tab.ctx.hdProveSetField('group', c.group),
  diagnosis: (tab, c) => tab.ctx.hdProveChoose('diagnosis', c.diagnosis),
  decision: (tab, c) => tab.ctx.hdProveChoose('decision', c.decision),
  steps: (tab, c) => c.steps.forEach((id) => tab.ctx.hdProveToggleStep(id, true)),
  keyFinding: (tab) => tab.ctx.hdProveText('keyFinding', WRITING.keyFinding),
  resolutionNote: (tab) => tab.ctx.hdProveText('resolutionNote', WRITING.resolutionNote),
  userReply: (tab) => tab.ctx.hdProveText('userReply', WRITING.userReply),
  kbDraft: (tab) => tab.ctx.hdProveText('kbDraft', WRITING.kbDraft),
  close: (tab) => {
    if (tab.run('hdState.prove.decision') === 'Resolve') tab.run('hdProveSetCode(hdState.tickets[0].id, HD_PROVE_RESOLUTION_CODES[0])');
    tab.run('hdProveClose(hdState.tickets[0].id)');
  },
};
function fill(tab, choice = CHOICES.a, skip = []) {
  Object.keys(PARTS).filter((name) => !skip.includes(name)).forEach((name) => PARTS[name](tab, choice));
}
// The missing-part name each fill part clears.
const MISSING_NAME = {
  assign: 'Assign to me', ticketClass: 'class', category: 'category', impact: 'impact', urgency: 'urgency', group: 'assignment group',
  diagnosis: 'diagnosis', decision: 'decision', keyFinding: 'key finding', resolutionNote: 'handoff note', userReply: 'customer update',
  kbDraft: 'KB draft', close: 'close the ticket',
};

/* ------------------------------------------------------------------- tests */

function testFreshShiftShowsOneEmptyTicket() {
  // A coach saved earlier in this tab must not come back in a Prove It.
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m01', step: 2 })]]);
  const tab = sim('its-11', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-11-prove-v1');
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  // The queue: the INC number, never the internal id as text, and no SLA badge.
  const queue = tab.view('helpdesk/tickets');
  assert.ok(queue.includes(NUMBER), 'the queue shows the INC number');
  assert.ok(!words(queue).includes(ID), 'the queue never shows the internal id');
  const rows = queue.match(/<tr class="hd-ticket-row"[\s\S]*?<\/tr>/g) || [];
  assert.equal(rows.length, 1);
  assert.doesNotMatch(rows[0], /At risk|Breached|On track|Within SLA|Paused|hd-sla/i, 'no SLA badge in the row');
  assert.match(rows[0], /Not set/, 'priority not set');
  // The dashboard is the queue.
  assert.equal(tab.view('helpdesk/dashboard'), queue);
  // The ticket: the header shows the INC number only.
  const html = ticketView(tab);
  assert.match(html, new RegExp(NUMBER));
  assert.ok(!words(html).includes(ID), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  // The option lists are the attempt's own shuffle of the data's.
  const order = tab.prove().order;
  same(order.diagnosis.slice().sort(), SPEC.diagnosisOptions.slice().sort());
  same(order.path.slice().sort(), SPEC.pathPool.map((step) => step.id).sort());
}

function testPriorityFollowsTheMatrix() {
  const tab = sim('its-11', 'stu-matrix');
  ['1', '2', '3'].forEach((impact) => ['1', '2', '3'].forEach((urgency) => {
    tab.ctx.hdProveSetField('impact', impact);
    tab.ctx.hdProveSetField('urgency', urgency);
    assert.equal(tab.prove().fields.priority, MATRIX[impact][urgency], `${impact} x ${urgency}`);
  }));
  assert.equal(tab.prove().fields.priority, 'P5', '3 x 3 is P5');
  // Values the ticket doesn't offer are stored as ''.
  tab.ctx.hdProveSetField('impact', '4');
  assert.equal(tab.prove().fields.impact, '');
  assert.equal(tab.prove().fields.priority, '', 'no priority without both');
  tab.ctx.hdProveSetField('ticketClass', 'Problem');
  tab.ctx.hdProveSetField('category', 'Made-up category');
  tab.ctx.hdProveSetField('group', 'Made-up team');
  const fields = tab.prove().fields;
  assert.equal(fields.ticketClass + fields.category + fields.group, '');
  // Priority itself can't be set directly.
  tab.ctx.hdProveSetField('priority', 'P1');
  assert.equal(tab.prove().fields.priority, '');
}

function testOpeningCardsIsRecordedOnce() {
  const tab = sim('its-11', 'stu-cards');
  const card = SPEC.evidence[0];
  const call = SPEC.history[1];
  const esc = tab.run('hdEsc');
  let html = ticketView(tab);
  assert.ok(!html.includes(esc(card.lines[0])), 'the card text is hidden before it is opened');
  assert.ok(!html.includes(esc(call.text)), 'the earlier call is hidden before it is opened');
  assert.ok(html.includes(`data-hd-prove-open="card:${card.id}"`) && html.includes(`data-hd-prove-open="history:${call.id}"`));
  tab.ctx.hdProveOpenCard('card', card.id);
  tab.ctx.hdProveOpenCard('card', card.id);
  tab.ctx.hdProveOpenCard('history', call.id);
  tab.ctx.hdProveOpenCard('history', call.id);
  tab.ctx.hdProveOpenCard('card', 'made-up-card');
  const opened = tab.prove().events.filter((e) => e.type === 'evidence_opened');
  same(opened.map((e) => e.source), [`card:${card.id}`, `history:${call.id}`], 'each opened once, nothing for an unknown card');
  html = ticketView(tab);
  assert.ok(html.includes(esc(card.lines[0])), 'the card text shows once opened');
  assert.ok(html.includes(esc(call.text)), 'the earlier call shows once opened');
  // The other entries stay closed.
  assert.ok(!html.includes(esc(SPEC.history[0].text)));
}

function testWarmHandoff() {
  const tab = sim('its-11', 'stu-warm');
  let html = ticketView(tab);
  assert.match(html, /id="hd-prove-warm"[^>]* disabled/, 'no group: the button is off');
  tab.ctx.hdProveWarmHandoff();
  assert.equal(tab.prove().events.filter((e) => e.type === 'warm_handoff').length, 0, 'no group: nothing logged');
  const group = GROUPS[2];
  tab.ctx.hdProveSetField('group', group);
  html = ticketView(tab);
  assert.doesNotMatch(html, /id="hd-prove-warm"[^>]* disabled/, 'with a group the button is on');
  const before = tab.ticket().troubleshootingHistory.length;
  tab.ctx.hdProveWarmHandoff();
  const label = `Called ${group} at ${tab.run('hdShiftTimeText(hdShiftNow())')}`;
  const calls = tab.prove().events.filter((e) => e.type === 'warm_handoff');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].value, group);
  assert.equal(calls[0].label, label);
  const history = plain(tab.ticket().troubleshootingHistory);
  assert.equal(history.length, before + 1);
  assert.equal(history[history.length - 1].action, `${label}.`, 'a ticket history line');
  tab.ctx.hdProveWarmHandoff();
  assert.equal(tab.prove().events.filter((e) => e.type === 'warm_handoff').length, 1, 'the same group again: nothing new');
  assert.equal(tab.ticket().troubleshootingHistory.length, before + 1);
  assert.ok(ticketView(tab).includes(tab.run('hdEsc')(label)), 'the call shows on the card');
}

function testMissingListsEveryEmptyPart() {
  const tab = sim('its-11', 'stu-missing');
  same(tab.run('hdProveMissing()').slice().sort(), Object.values(MISSING_NAME).slice().sort(), 'every part is listed on a fresh shift');
  // Each part left out is the one named, whatever else is chosen.
  Object.keys(MISSING_NAME).forEach((part, i) => {
    const one = sim('its-11', `stu-missing-${i}`);
    fill(one, i % 2 ? CHOICES.b : CHOICES.a, part === 'assign' ? ['assign', 'close'] : [part]);
    const missing = one.run('hdProveMissing()').slice();
    assert.ok(missing.includes(MISSING_NAME[part]), `${part} left out is listed`);
    if (part !== 'assign' && part !== 'decision') same(missing, [MISSING_NAME[part]], `only ${part} is listed`);
  });
  // Two fills with different choices both leave nothing missing.
  ['a', 'b'].forEach((name) => {
    const full = sim('its-11', `stu-full-${name}`);
    fill(full, CHOICES[name]);
    same(full.run('hdProveMissing()').slice(), [], `fill ${name}: nothing missing`);
    assert.equal(full.submitState().enabled, true, `fill ${name}: Submit is on`);
  });
}

function filledPackage(student = 'stu-package', choice = CHOICES.a) {
  const tab = sim('its-11', student);
  fill(tab, choice);
  tab.ctx.hdProveOpenCard('card', SPEC.evidence[1].id);
  tab.ctx.hdProveOpenCard('history', SPEC.history[0].id);
  tab.ctx.hdProveWarmHandoff();
  return { tab, work: plain(tab.run('hdProvePackage()')) };
}

function testPackageShape() {
  const { work } = filledPackage();
  assert.equal(work.kind, 'hdesk-prove');
  assert.equal(work.moduleKey, 'its-11');
  assert.equal(work.labKey, LAB);
  assert.equal(work.rubricVersion, 'hdesk-its-11-prove-v1');
  assert.equal(work.ticketId, ID);
  same(Object.keys(work.fields).sort(), ['category', 'group', 'impact', 'priority', 'ticketClass', 'urgency']);
  assert.equal(work.fields.ticketClass, CHOICES.a.ticketClass);
  assert.equal(work.fields.priority, MATRIX[CHOICES.a.impact][CHOICES.a.urgency]);
  assert.equal(work.keyFinding, WRITING.keyFinding);
  assert.equal(work.kbDraft, WRITING.kbDraft);
  assert.equal(work.resolutionNote, WRITING.resolutionNote);
  assert.equal(work.userReply, WRITING.userReply);
  assert.equal(typeof work.elapsedSeconds, 'number');
  assert.ok(work.elapsedSeconds >= 0);
  assert.ok(Array.isArray(work.events));
  assert.ok(work.events.some((e) => e.type === 'evidence_opened' && e.source === `card:${SPEC.evidence[1].id}`));
  assert.ok(work.events.some((e) => e.type === 'warm_handoff'));
  same(work.steps.slice().sort(), CHOICES.a.steps.slice().sort());
  assert.equal(work.shape, undefined, 'not a queue package');
}

function testPasswordIsRefused() {
  ['keyFinding', 'kbDraft'].forEach((field) => {
    const tab = sim('its-11', `stu-password-${field}`);
    fill(tab);
    assert.equal(tab.submitState().enabled, true, 'Submit is on before');
    tab.ctx.hdProveText(field, 'Synthetic note E. password: Hunter22');
    assert.equal(tab.prove()[field], WRITING[field], 'the refused text is not saved');
    assert.equal(tab.prove().passwordWritten, true);
    const state = tab.submitState();
    assert.equal(state.enabled, false, 'Submit waits');
    assert.match(state.note, /includes a password, so it was not saved/);
    assert.ok(!tab.local.getItem(`defender-lab.helpdesk.prove.v1.its-11.stu-password-${field}`).includes('Hunter22'), 'never stored');
    tab.ctx.hdProveText(field, 'Synthetic note F, no secret here.');
    assert.equal(tab.submitState().enabled, true, 'removed: Submit is on again');
  });
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

// Module 1's package, filled with arbitrary values (its fields are pre-set).
function moduleOnePackage() {
  const tab = sim('its-01', 'stu-m1');
  const ticket = tab.ticket();
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveChoose('diagnosis', ticket.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Escalate');
  tab.ctx.hdProveText('resolutionNote', 'Synthetic note G.');
  tab.ctx.hdProveText('userReply', 'Synthetic note H.');
  tab.run('hdProveClose(hdState.tickets[0].id)');
  same(tab.run('hdProveMissing()').slice(), [], 'Module 1 fill is complete');
  return plain(tab.run('hdProvePackage()'));
}
const M1_KEYS = ['version', 'kind', 'moduleKey', 'labKey', 'rubricVersion', 'ticketId', 'startedAt', 'fields', 'diagnosis', 'steps', 'stepTexts', 'decision',
  'resolutionNote', 'userReply', 'workNotes', 'noteIsResolution', 'assignedTo', 'ticketState', 'resolutionCode', 'commands', 'events', 'machine', 'logTrimmed',
  'passwordTyped', 'passwordWritten'];

function testPortalCleaner() {
  const { work } = filledPackage('stu-clean');
  const { work: saved, reason } = clean(work, 'its-11', LAB);
  assert.equal(reason, undefined);
  assert.equal(saved.fields.priority, MATRIX[work.fields.impact][work.fields.urgency]);
  assert.equal(saved.keyFinding, work.keyFinding);
  assert.equal(saved.kbDraft, work.kbDraft);
  assert.equal(typeof saved.elapsedSeconds, 'number');
  assert.ok(saved.events.some((e) => e.type === 'warm_handoff' && e.value === work.fields.group && e.label), 'the warm handoff is kept');
  assert.ok(saved.events.some((e) => e.type === 'evidence_opened'));
  // Priority is the course page's own.
  const forged = plain(work);
  forged.fields.priority = forged.fields.priority === 'P1' ? 'P4' : 'P1';
  assert.equal(clean(forged, 'its-11', LAB).work.fields.priority, MATRIX[work.fields.impact][work.fields.urgency], 'a claimed priority is replaced');
  const low = plain(work);
  Object.assign(low.fields, { impact: '3', urgency: '3', priority: '' });
  assert.equal(clean(low, 'its-11', LAB).work.fields.priority, 'P5', 'P5 is accepted');
  // A negative or odd elapsed time is never kept as it came.
  assert.equal(clean({ ...work, elapsedSeconds: -5 }, 'its-11', LAB).work.elapsedSeconds, 0);
  // Refused as invalid.
  const broken = {
    'missing keyFinding': (w) => { delete w.keyFinding; },
    'empty keyFinding': (w) => { w.keyFinding = '   '; },
    'missing kbDraft': (w) => { delete w.kbDraft; },
    'unknown group': (w) => { w.fields.group = 'Made-up team'; },
    'impact 4': (w) => { w.fields.impact = '4'; },
    'impact 0': (w) => { w.fields.impact = '0'; },
    'impact as a number': (w) => { w.fields.impact = 1; },
    'unknown class': (w) => { w.fields.ticketClass = 'Problem'; },
    'empty category': (w) => { w.fields.category = ''; },
    'empty diagnosis': (w) => { w.diagnosis = ''; },
    'a queue shape': (w) => { w.shape = 'queue'; },
  };
  Object.entries(broken).forEach(([label, change]) => {
    const w = plain(work); change(w);
    assert.equal(clean(w, 'its-11', LAB).reason, 'invalid', `${label} is refused`);
  });
  // At the limits it fits; one character more is refused, never cut.
  const full = clean({ ...work, keyFinding: 'k'.repeat(600), kbDraft: 'd'.repeat(4000) }, 'its-11', LAB);
  assert.ok(full.work, 'writing at its limits is accepted');
  assert.equal(full.work.keyFinding.length, 600);
  assert.equal(full.work.kbDraft.length, 4000);
  assert.equal(clean({ ...work, keyFinding: 'k'.repeat(601) }, 'its-11', LAB).reason, 'too-large');
  assert.equal(clean({ ...work, kbDraft: 'd'.repeat(4001) }, 'its-11', LAB).reason, 'too-large');
  // Module 1 cleans as before, and its package never fits Module 3.
  const m1 = moduleOnePackage();
  const m1Saved = clean(m1, 'its-01', M1_LAB);
  assert.equal(m1Saved.reason, undefined);
  same(Object.keys(m1Saved.work).sort(), M1_KEYS.slice().sort(), 'Module 1 keeps its keys, nothing added');
  same(Object.keys(m1Saved.work.fields).sort(), ['category', 'priority', 'type']);
  assert.equal(clean(m1, 'its-11', LAB).reason, 'invalid', 'a Module 1 package is refused on Module 3');
  assert.equal(clean({ ...m1, moduleKey: 'its-11', labKey: LAB, rubricVersion: 'hdesk-its-11-prove-v1' }, 'its-11', LAB).reason, 'invalid',
    'a Module 1 package relabelled for Module 3 is refused on its fields');
  assert.equal(clean(work, 'its-01', M1_LAB).reason, 'invalid', 'a Module 3 package is refused on Module 1');
  return saved;
}

function testPrefillRoundTrip(saved) {
  const row = { completed_at: new Date(Date.now() + 60000).toISOString(), result: { source: 'mnt-prove-submit', ...saved } };
  const lastWork = plain(prun('itsProvePrefillWork')(row));
  const tab = sim('its-11', 'stu-prefill');
  assert.equal(tab.run('hdProvePrefill')(lastWork), true);
  const prove = tab.prove();
  same(prove.fields, saved.fields, 'every field');
  ['keyFinding', 'resolutionNote', 'userReply', 'kbDraft'].forEach((field) => assert.equal(prove[field], saved[field], `${field} restored`));
  assert.equal(prove.diagnosis, saved.diagnosis);
  assert.equal(prove.decision, saved.decision);
  same(prove.opened.slice().sort(), saved.events.filter((e) => e.type === 'evidence_opened').map((e) => e.source).sort(), 'the opened cards');
  const warm = saved.events.find((e) => e.type === 'warm_handoff');
  assert.ok(tab.ticket().troubleshootingHistory.some((entry) => entry.action === `${warm.label}.`), 'the warm handoff stays in the history');
  // Values no longer offered stay ''.
  const stale = sim('its-11', 'stu-prefill-stale');
  const old = plain(lastWork);
  old.fields.group = 'Retired team';
  old.fields.category = 'Retired category';
  old.fields.ticketClass = 'Problem';
  old.diagnosis = 'Retired diagnosis';
  assert.equal(stale.run('hdProvePrefill')(old), true);
  const fields = stale.prove().fields;
  assert.equal(fields.group + fields.category + fields.ticketClass + stale.prove().diagnosis, '');
  assert.equal(fields.impact, saved.fields.impact, 'what is still offered stays');
  assert.ok(stale.run('hdProveMissing()').includes('assignment group'));
}

const LONG = {
  keyFinding: 'Synthetic note A1 <first line> & "quoted".\nSynthetic note A2, second line.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note B${i}: made-up handoff line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note C${i}, a made-up customer line.`).join('\n\n'),
  kbDraft: Array.from({ length: 60 }, (_, i) => `Synthetic note D${i}: made-up KB text with <tags> & "quotes".`).join('\n'),
};

function testReviewPanel(saved) {
  const result = { ...saved, ...LONG, elapsedSeconds: 754 };
  const row = { id: 'att-m03-1', lab_key: LAB, student_id: '9900000003-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  assert.match(html, /Student Analyst Response/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<first line>') && !html.includes('<tags>'), 'never raw');
  ['Key finding', 'Handoff note', 'Customer update', 'KB draft'].forEach((heading) => assert.ok(html.includes(heading), heading));
  const LEVELS = { 1: '1 – High', 2: '2 – Medium', 3: '3 – Low' };
  [['Class', saved.fields.ticketClass], ['Category', saved.fields.category], ['Impact', LEVELS[saved.fields.impact]], ['Urgency', LEVELS[saved.fields.urgency]],
    ['Priority', saved.fields.priority], ['Assignment group', saved.fields.group], ['Diagnosis', saved.diagnosis], ['Decision', saved.decision]]
    .forEach(([label, value]) => assert.ok(html.includes(`>${label}</dt><dd class="text-sm text-gray-900">${pesc(value)}</dd>`), `shows ${label}: ${value}`));
  saved.events.filter((e) => e.type === 'evidence_opened').forEach((e) => assert.ok(html.includes(pesc(e.label || e.source)), 'the opened list'));
  const warm = saved.events.find((e) => e.type === 'warm_handoff');
  assert.ok(html.includes(`Exceeds: ${pesc(warm.label)}. No score change.`), 'the warm handoff as Exceeds');
  assert.match(html, /13 min/, 'the time used');
  const none = prun('itsProveReviewPanel')({ ...row, result: { ...result, events: result.events.filter((e) => e.type !== 'warm_handoff') } });
  assert.match(none, /No warm handoff logged\. No score change\./);
  // Module 1's panel keeps its shape.
  const m1 = clean(moduleOnePackage(), 'its-01', M1_LAB).work;
  const m1Html = prun('itsProveReviewPanel')({ id: 'att-m01-1', lab_key: M1_LAB, student_id: '9900000001-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: m1 });
  assert.match(m1Html, /Reply to the user/);
  assert.match(m1Html, /Student's written work/);
  assert.doesNotMatch(m1Html, /Student Analyst Response|data-its-prove-shape|Warm handoff/);
}

function testGradingCard(saved) {
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  same(rubric.competencies.map((c) => c.points), [11, 11, 11, 17, 50]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  const row = { id: 'att-m03-2', lab_key: LAB, student_id: '9900000003-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: saved };
  const parts = [{ id: 'kf', label: 'Part one', points: 12, suggested: 9 }, { id: 'hn', label: 'Part two', points: 13, suggested: 10 },
    { id: 'cu', label: 'Part three', points: 12, suggested: 8 }, { id: 'kb', label: 'Part four', points: 13, suggested: 10 }];
  const rec = {
    id: 'rec-m03-1', status: 'scored', critical_error: false,
    competencies: [
      { id: 'triage', label: 'Triage', points: 11, judgment: false, earned: 8, student_feedback: 'Arbitrary.' },
      { id: 'investigation', label: 'Investigation', points: 11, judgment: false, earned: 6 },
      { id: 'diagnosis', label: 'Diagnosis', points: 11, judgment: false, earned: 0 },
      { id: 'action', label: 'Action and decision', points: 17, judgment: false, earned: 9 },
      { id: 'documentation', label: 'Documentation and communication', points: 50, judgment: true, suggested: 37, parts },
    ],
  };
  prun(`itsProveRecommendations.set('att-m03-2', ${JSON.stringify(rec)})`);
  const card = prun('itsProveGradingCard')({ lead: row, name: 'Synthetic Student', labTitles: ['Prove It: Independent Ticket'] }, false);
  rubric.competencies.filter((c) => c.id !== 'documentation').forEach((c) => {
    assert.match(card, new RegExp(`max="${c.points}" step="1" data-its-prove-points="${c.id}"`), `${c.id} out of ${c.points}`);
  });
  [['triage', 8], ['investigation', 6], ['diagnosis', 0], ['action', 9]].forEach(([id, value]) => assert.match(card, new RegExp(`data-its-prove-points="${id}"[^>]*value="${value}"`)));
  assert.match(card, /data-its-prove-writing="documentation"/);
  assert.match(card, /\/ 50, entered by hand/);
  parts.forEach((part) => assert.match(card, new RegExp(`data-its-prove-part="${part.id}"`)));
  assert.ok(card.includes(pesc(rubric.writingAck)), "the rubric's own acknowledgement line");
  assert.match(card, /Suggested scores: 9 and 10 and 8 and 10\./);
  assert.doesNotMatch(card, /work note and reply to the user/);
  assert.match(card, /Student Analyst Response/, 'the review panel is on the card');
  // A critical error: everything shows 0, with what was found kept for staff.
  const zeroed = {
    ...rec, id: 'rec-m03-2', critical_error: true, critical_reasons: [{ id: 'made-up', feedback: 'Synthetic critical note.' }],
    competencies: rec.competencies.map((c) => (c.judgment
      ? { ...c, suggested: 0, suggested_before_critical: c.suggested, parts: c.parts.map((p) => ({ ...p, suggested: 0, suggested_before_critical: p.suggested })) }
      : { ...c, earned: 0, earned_before_critical: c.earned })),
  };
  prun(`itsProveRecommendations.set('att-m03-3', ${JSON.stringify(zeroed)})`);
  const critical = prun('itsProveGradingCard')({ lead: { ...row, id: 'att-m03-3' }, name: 'Synthetic Student', labTitles: ['Prove It: Independent Ticket'] }, false);
  assert.match(critical, /data-its-prove-critical checked/);
  assert.match(critical, /\(critical error: automatic zero\)/);
  assert.match(critical, /data-its-prove-points="triage"[^>]*value="8"/, 'what was found, for an instructor who clears it');
  assert.match(critical, /Suggested 0 of 12 while the critical error stands \(9 without it\)/);
  assert.match(critical, /Synthetic critical note\./);
}

/* ------------------------------------------------------------ Module 3 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-11'].number]`);
const studentOf = (user) => prun('LabRuntime').anonymousStudentId(user);
const hdUser = (name) => ({
  userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
});
// The stand-in database (tests/hdesk-prove-submit.test.js): lab_attempts with
// the one-waiting rule; failInsert scripts a failed write.
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

async function testModuleThreePageSubmit() {
  freshDb();
  const user = hdUser('m03prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its11-prove-it"');
  assert.ok(start >= 0, 'the Prove It card');
  const card = html.slice(start, html.indexOf('</section>', start));
  const link = /data-its11-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-11&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);

  const { work } = filledPackage('stu-page');
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-11', nonce: 'm03prove-1234', student: studentOf(user), work };
  // A failed write: saved false, no row, nothing shown as submitted.
  db.failInsert = 'network';
  const failed = await quiet(() => send(message));
  assert.equal(failed.length, 1);
  assert.equal(failed[0].saved, false);
  assert.equal(failed[0].reason, 'save-failed');
  assert.equal(failed[0].nonce, message.nonce);
  assert.equal(db.attempts.length, 0, 'nothing saved');
  assert.notEqual(prun('itsLabStatus')(user, LAB), 'waiting', 'not shown as submitted');
  // The write works: one complete row with no score and the cleaned work.
  db.failInsert = null;
  const replies = await send(message);
  assert.equal(replies.length, 1);
  assert.equal(replies[0].saved, true);
  assert.equal(replies[0].status, 'waiting');
  assert.equal(replies[0].origin, SIM);
  const rows = db.attempts.filter((r) => r.lab_key === LAB);
  assert.equal(rows.length, 1, 'one lab_attempts row');
  assert.equal(rows[0].state, 'complete');
  assert.equal(rows[0].score, null, 'no score from the browser');
  const expected = clean(work, 'its-11', LAB).work;
  const { source, ...stored } = plain(rows[0].result);
  assert.equal(source, 'mnt-prove-submit');
  same(stored, expected, 'the cleaned work');
}

// Class, Category, group and decision: the same options on every attempt,
// in an order set by the attempt's seed, so no choice has a fixed place. A
// reload keeps the order and the choice (kept by value). Module 1 keeps its
// fixed decision order.
function testListsAreShuffledPerAttempt() {
  const lists = (html) => {
    const field = (f) => [...((html.match(new RegExp(`data-hd-field="${f}"[^>]*>([\\s\\S]*?)</select>`)) || [, ''])[1].matchAll(/<option value="([^"]+)"/g))]
      .map((m) => m[1].replace(/&amp;/g, '&'));
    return { ticketClass: field('ticketClass'), category: field('category'), group: field('group'),
      decision: [...html.matchAll(/hdProveChoose\('decision','(\w+)'\)/g)].map((m) => m[1]) };
  };
  const seen = new Set();
  for (const seed of [11, 222, 3333, 44444, 555555, 6666666]) {
    const tab = sim('its-11', `shuffle-${seed}`);
    tab.run(`hdState.seed = ${seed}`);
    const got = lists(ticketView(tab));
    same([...got.ticketClass].sort(), [...CLASSES].sort(), 'every class, once');
    same([...got.category].sort(), [...SPEC.categoryOptions].sort(), 'every category, once');
    same([...got.group].sort(), [...GROUPS].sort(), 'every group, once');
    same([...got.decision].sort(), ['Escalate', 'Resolve'], 'both decisions, once');
    seen.add(JSON.stringify(got));
  }
  assert.ok(seen.size > 1, 'the order changes with the attempt');
  const local = store();
  const session = store();
  const first = sim('its-11', 'shuffle-reload', local, session);
  first.ctx.hdProveSetField('group', GROUPS[3]);
  const before = lists(ticketView(first));
  const second = sim('its-11', 'shuffle-reload', local, session);
  same(lists(ticketView(second)), before, 'a reload keeps the order');
  assert.equal(second.prove().fields.group, GROUPS[3], 'a reload keeps the choice');
  for (const student of ['m1-a', 'm1-b', 'm1-c']) {
    const m1 = sim('its-01', student);
    same(lists(ticketView(m1)).decision, ['Resolve', 'Escalate'], 'Module 1: the fixed decision order');
  }
}

const syncTests = [testFreshShiftShowsOneEmptyTicket, testPriorityFollowsTheMatrix, testOpeningCardsIsRecordedOnce, testWarmHandoff,
  testMissingListsEveryEmptyPart, testPackageShape, testPasswordIsRefused, testListsAreShuffledPerAttempt];
(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of syncTests) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let saved = null;
  try { saved = testPortalCleaner(); report('testPortalCleaner'); } catch (error) { report('testPortalCleaner', error); }
  if (!saved) saved = clean(filledPackage('stu-fallback').work, 'its-11', LAB).work;
  for (const test of [testPrefillRoundTrip, testReviewPanel, testGradingCard]) {
    try { test(saved); report(test.name); } catch (error) { report(test.name, error); }
  }
  try { await testModuleThreePageSubmit(); report('testModuleThreePageSubmit'); } catch (error) { report('testModuleThreePageSubmit', error); }
  if (failed) { console.error(`hdesk-m03-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m03-prove: all ${passed} passed`);
})();

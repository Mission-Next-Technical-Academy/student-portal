'use strict';
/* Help Desk simulator: the queue and matrix console features added for
 * Module 2 (key its-10), each switched on per ticket or per ticket set
 * (ui/helpdesk.js "Queue and matrix features"): Impact × Urgency priority,
 * the Northstar SLA (respond, then resolve; business hours; Paused; time in
 * Resolved not counted), a set's own clock and "Next day", classification,
 * the ServiceNow-style queue and work order, ServiceNow states, Convert to
 * Request, linking, caller replies that arrive later, Attach knowledge and
 * knowledge drafts, contact attempts, internal names in customer comments,
 * INC numbers and the short description rewrite.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-92xx,
 * never in ui/helpdesk-data.js), and every older ticket must look and behave
 * as before. No Module 2 content: the guided queue, tickets 2-A to 2-C and
 * their key arrive in later parts. The work order groups below are a test
 * fixture, not a key. Synthetic data only. The SLA figures are the build
 * plan's ticket-age tables (section 4). Mon = 2026-08-17. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const MON = '2026-08-17'; const TUE = '2026-08-18'; const WED = '2026-08-19';
const at = (day, time) => `${day}T${time}:00Z`;

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P3', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const CLASSIFY = { categories: { Network: ['Wi-Fi', 'VPN'], Hardware: ['Mouse', 'Monitor'], Request: ['Hardware'] }, cis: ['Floor 9 Wi-Fi', 'NS-LT-0081'] };
// The coached test set: Tuesday 08:35, like the guided queue.
const GUIDED = [
  base({ id: 'HD-9201', number: 'INC0019201', requester: 'Amir Patel', category: 'Service Request', createdAt: at(MON, '14:00'), description: 'Can I get a new keyboard?',
    console: { matrix: {}, classify: CLASSIFY, convert: { number: 'RITM0019201', items: [{ name: 'Test keyboard', approval: 'Approved', approver: 'A manager' }] } } }),
  base({ id: 'HD-9202', number: 'INC0019202', requester: 'Noah Williams', department: 'Sales', createdAt: at(TUE, '08:15'), description: 'Wi-Fi on floor 9 is down for the team.',
    console: { matrix: {}, classify: CLASSIFY, kb: { attach: true } } }),
  base({ id: 'HD-9203', number: 'INC0019203', requester: 'Luis Ortega', department: 'Sales', createdAt: at(TUE, '08:22'), description: 'internet not working',
    console: { matrix: {}, link: true, rewrite: { checks: [
      { part: 'who', pattern: 'Luis|Ortega' }, { part: 'where', pattern: 'floor\\s*9' }, { part: 'when', pattern: '\\d{1,2}:\\d{2}' },
      { part: 'impact', pattern: 'all of|whole|team' }, { part: '"(reopened)"', pattern: '\\(reopened\\)', field: 'short' },
    ] } } }),
  base({ id: 'HD-9204', number: 'INC0019204', requester: 'Priya Shah', department: 'Human Resources', createdAt: at(MON, '16:10'), description: 'Mouse keeps freezing!!!',
    console: { matrix: {}, comments: true, kb: { draft: true }, resolutionCode: { required: true },
      arrivals: [{ id: 'priya-reply', from: 'Priya Shah', text: 'New batteries fixed it.', resume: true,
        when: { all: [{ ticket: 'HD-9205', notes: 1, comments: 1 }, { status: 'On Hold – Awaiting Caller' }] } }] } }),
  base({ id: 'HD-9205', number: 'INC0019205', requester: 'Sam Rivera', department: 'Customer Service', createdAt: at(TUE, '08:31'), description: 'Phones down for the whole team.',
    console: { matrix: {}, notes: {}, comments: { internalNames: ['NS-PBX09', 'Messaging & Collaboration'] } } }),
  base({ id: 'HD-9206', number: 'INC0019206', requester: 'Maya Chen', createdAt: at(TUE, '08:14'), description: 'A P2 one minute older.',
    console: { matrix: { impact: 1, urgency: 2 } } }),
];
// The practice test set: Wednesday 13:00, like tickets 2-A to 2-C.
const PRACTICE = [
  base({ id: 'HD-9211', number: 'INC0019211', requester: 'Maya Chen', createdAt: at(WED, '12:50'), description: 'Give my assistant access.',
    console: { matrix: {}, convert: { number: 'RITM0019211', items: [{ name: 'Test delegate access', approver: 'Maya Chen', fields: [{ id: 'level', label: 'Permission', options: ['Reviewer', 'Editor'] }] }] },
      arrivals: [{ id: 'approved', from: 'Maya Chen', text: 'Approved in the portal.', approve: true, when: { converted: true } }],
      actions: [{ id: 'grant', text: 'Grant the access', needsApproval: true, earlyCritical: 'Granted before the owner approved', earlyFeedback: 'Wait for the approval.', feedback: 'Granted.' }] } }),
  base({ id: 'HD-9212', number: 'INC0019212', requester: 'Elena Ruiz', createdAt: at(TUE, '09:00'), status: 'Resolved', assignedTechnician: 'Riley Morgan', description: 'Badge printer jams.',
    console: { matrix: { impact: 2, urgency: 2, respondedAt: at(TUE, '09:20'), stops: [{ from: at(TUE, '11:30'), kind: 'resolved' }] }, link: true,
      arrivals: [{ id: 'reopen', from: 'Elena Ruiz', text: 'It is NOT resolved.', reopen: true, at: at(WED, '12:50') }] } }),
  base({ id: 'HD-9213', number: 'INC0019213', requester: 'Noah Williams', createdAt: at(WED, '12:15'), description: 'Badge printer jams here too.',
    console: { matrix: { impact: 2, urgency: 2 }, link: true } }),
  base({ id: 'HD-9214', number: 'INC0019214', requester: 'Luis Ortega', createdAt: at(WED, '12:35'), description: 'Badge printer jams on this PC.',
    console: { matrix: { impact: 2, urgency: 2 }, link: true } }),
  base({ id: 'HD-9215', number: 'INC0019215', requester: 'Priya Shah', createdAt: at(MON, '09:00'), status: 'On Hold', holdReason: 'Awaiting Caller', assignedTechnician: 'Riley Morgan', description: 'Outlook asks for my password.',
    console: { matrix: { impact: 3, urgency: 2, respondedAt: at(MON, '09:40'), stops: [{ from: at(MON, '09:40'), kind: 'paused' }] }, resolutionCode: { required: true },
      contactAttempts: { seed: [{ at: at(MON, '09:40'), method: 'Additional comment' }] } } }),
];
const SETS = {
  coached: { 'test-guided': { title: 'Test guided queue', tickets: GUIDED.map((t) => t.id), now: at(TUE, '08:35'), queue: true,
    workOrder: { tickets: ['HD-9201', 'HD-9202', 'HD-9203', 'HD-9204', 'HD-9205'], groups: [['HD-9205'], ['HD-9202', 'HD-9203'], ['HD-9204'], ['HD-9201']] } } },
  practice: { 'test-practice': { title: 'Test practice tickets', tickets: PRACTICE.map((t) => t.id), now: at(WED, '13:00'), queue: true,
    nextDay: { unlock: [{ ticket: 'HD-9211', done: ['converted', 'resolved', 'escalated'] }, { ticket: 'HD-9212', done: ['resolved', 'escalated'] }, { ticket: 'HD-9215', attempts: 2 }] } } },
};

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store(), before = '' } = {}) {
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
  if (withTest) {
    ctx.__test = { tickets: [...GUIDED, ...PRACTICE], sets: SETS };
    vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
      Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets.practice)));
      Object.assign(HD_COACHED_SETS, JSON.parse(JSON.stringify(__test.sets.coached)));`, ctx);
  }
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => byId.set(id, { id, value });
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, local, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    sla: (id) => JSON.parse(JSON.stringify(run(`hdSlaState(hdTicketById(${j(id)}))`))),
    impact: (id, i, u) => { run(`hdSetImpact(${j(id)}, 'impact', ${j(String(i))})`); run(`hdSetImpact(${j(id)}, 'urgency', ${j(String(u))})`); },
    state: (id, status, extra = {}) => { Object.entries(extra).forEach(([k, v]) => input(k, v)); run(`hdTransitionTicket(${j(id)}, ${j(status)})`); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
  };
}
const guided = (local) => { const tab = sim({ local }); assert.equal(tab.run("hdUseTicketSet('test-guided')"), true); return tab; };
const practice = (local) => sim({ url: 'https://academy.test/sim/?practice=test-practice&student=stu-1#/helpdesk/tickets', local });
// Visible text: tags and attributes (onclick ids) removed.
const plain = (value) => JSON.parse(JSON.stringify(value));
const visible = (html) => html.replace(/<[^>]*>/g, ' ');
const NEW_MARKERS = /data-hd-field|hd-convert|hd-request-item|hd-link|hd-rewrite|hd-contact-attempts|hd-arrivals|hd-related-knowledge|hd-work-order|data-hd-next-day|Attach knowledge|On Hold|Impact|Urgency/;

function testOldTicketsKeepTheOldClockAndStates() {
  const tab = sim();
  // The old SLA clock, value for value, including the fallback.
  const minutes = (priority) => tab.run(`hdSlaMinutes({ priority:${JSON.stringify(priority)} })`);
  assert.deepEqual(['P1', 'P2', 'P3', 'P4', '', 'P5'].map(minutes), [15, 120, 480, 1440, 480, 480]);
  // The shared shift keeps HD_SHIFT_NOW and never gets a set's own tickets.
  assert.equal(tab.run('hdShiftNow() === HD_SHIFT_NOW'), true);
  const ids = tab.run('hdState.tickets.map((t) => t.id)');
  assert.ok(ids.includes('HD-2150') && ids.includes('HD-2101'));
  assert.ok(!ids.some((id) => id.startsWith('HD-92')), 'ownSet tickets stay out of the shared shift');
  // Older tickets: no new card, control or state, and the old lists.
  for (const id of ids) {
    const html = tab.open(id);
    assert.doesNotMatch(html, NEW_MARKERS, `${id} shows no new feature`);
    assert.equal(tab.run(`hdIsMatrix(hdTicketById(${JSON.stringify(id)}))`), false);
  }
  const queue = tab.view('helpdesk/tickets');
  assert.match(queue, /<option >New<\/option><option >Assigned<\/option><option >In Progress<\/option><option >Pending User<\/option><option >Pending Vendor<\/option><option >Escalated<\/option><option >Resolved<\/option><option >Closed<\/option><\/select>/);
  assert.doesNotMatch(queue, /P5|On Hold|Canceled|Columns|Sort by/);
  assert.doesNotMatch(tab.view('helpdesk/dashboard'), /data-hd-next-day/);
  // Module 1's work snapshot gets no new keys.
  assert.deepEqual(Object.keys(tab.run("hdConsoleProgress('HD-2150')")).sort(), ['accountUnlocked', 'actions', 'chatAsked', 'commentRepeatLine', 'comments', 'critical', 'kbOpened', 'kbSearches', 'lastCommentJargon', 'noteMissing', 'outcomes', 'owner', 'ownerTries', 'passwordAsked', 'passwordWritten', 'resolutionCode', 'unlocks', 'unverified', 'verification']);
  // A state the old list doesn't know never throws.
  tab.run("hdTicketById('HD-2104').status = 'On Hold'; hdTransitionTicket('HD-2104', 'Resolved')");
  assert.match(tab.lastToast(), /not valid/);
  // Old badges: an old P2 ticket still uses 120 minutes.
  tab.run("Object.assign(hdTicketById('HD-2104'), { status:'New', priority:'P2', createdTimestamp:new Date(HD_SHIFT_NOW - 60 * 60000).toISOString() })");
  assert.equal(tab.sla('HD-2104').label, '60m left');
  // The Enterprise Map shows the Module 2 table (P1 to P5).
  const map = tab.view('helpdesk/environment');
  assert.match(map, /<th>Respond within<\/th><th>Resolve within<\/th><th>Who must be told<\/th>/);
  assert.match(map, /p2">P2<\/span><\/td><td>30 minutes<\/td><td>8 hours<\/td>/);
  assert.match(map, /p5">P5<\/span><\/td><td>2 business days<\/td><td>By agreement<\/td>/);
  // Without the test fixtures: every real matrix ticket (Module 2 on) is a
  // set's own ticket, listed in a coached or practice set, and none of them
  // is on the shared shift, which runs no set.
  const plain = sim({ withTest: false });
  const realSets = plain.run("[...Object.values(HD_COACHED_SETS), ...Object.values(HD_PRACTICE_SETS)].flatMap((set) => set.tickets)");
  const matrixTickets = JSON.parse(JSON.stringify(plain.run("HD_TICKET_TEMPLATES.filter((t) => (t.console && t.console.matrix) || t.ownSet).map((t) => ({ id:t.id, ownSet:t.ownSet === true }))")));
  // HD-2109 is the one hidden template (ownSet, no set, no console): Module 5
  // retired it from the queue on 2026-11-24, and the capstone and older
  // instructor sheets still read it. Module 7 (key its-05) retired HD-2108 and
  // HD-2117 the same way on 2026-11-25.
  const HIDDEN = ['HD-2109', 'HD-2108', 'HD-2117'];
  for (const t of matrixTickets.filter((item) => !HIDDEN.includes(item.id))) {
    assert.equal(t.ownSet, true, `${t.id} needs ownSet: true`);
    assert.ok(realSets.includes(t.id), `${t.id} belongs to no set`);
  }
  for (const id of HIDDEN) assert.equal(plain.run(`HD_TICKET_TEMPLATES.find((t) => t.id === '${id}').console`), undefined);
  assert.ok(!plain.run('hdState.tickets.map((t) => t.id)').some((id) => matrixTickets.some((t) => t.id === id)), 'no matrix ticket on the shared shift');
  assert.equal(plain.run('hdActiveSet()'), null);
}

function testImpactAndUrgencyCalculatePriority() {
  const tab = guided();
  const html = tab.open('HD-9202');
  assert.match(html, /data-hd-priority=""/);
  assert.match(html, /Priority not set/);
  assert.equal(tab.sla('HD-9202').label, 'Not set');
  const expected = { '1,1': 'P1', '1,2': 'P2', '1,3': 'P3', '2,1': 'P2', '2,2': 'P3', '2,3': 'P4', '3,1': 'P3', '3,2': 'P4', '3,3': 'P5' };
  for (const [pair, priority] of Object.entries(expected)) {
    const [i, u] = pair.split(',');
    tab.impact('HD-9202', i, u);
    assert.equal(tab.ticket('HD-9202').priority, priority, `Impact ${i} × Urgency ${u}`);
  }
  // Only one of the two set: not set again.
  tab.run("hdSetImpact('HD-9202', 'urgency', '')");
  assert.equal(tab.ticket('HD-9202').priority, '');
  // It can't be typed.
  tab.run("hdSetTicketPriority('HD-9202', 'P1')");
  assert.equal(tab.ticket('HD-9202').priority, '');
  assert.match(tab.lastToast(), /calculated from Impact and Urgency/);
  tab.impact('HD-9202', 1, 2);
  assert.match(tab.open('HD-9202'), /data-hd-priority="P2"[\s\S]*High/);
}

function testSlaRespondThenResolveOnTheSetClock() {
  const tab = guided();
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-18T08:35:00.000Z');
  // SR-style P5 from Monday 14:00: 3 h 35 min business used of 2 business days.
  tab.impact('HD-9201', 3, 3);
  assert.deepEqual([tab.sla('HD-9201').phase, tab.sla('HD-9201').used, tab.sla('HD-9201').label], ['Respond', 215, '14h 25m left']);
  // P4 from Monday 16:10: 1 h 25 min of 1 business day.
  tab.impact('HD-9204', 3, 2);
  assert.deepEqual([tab.sla('HD-9204').used, tab.sla('HD-9204').label], [85, '7h 35m left']);
  // P2 at 08:15: 20 of 30 clock minutes (67%), just under At risk ...
  tab.impact('HD-9202', 1, 2);
  assert.equal(tab.sla('HD-9202').label, '10m left');
  // ... and one minute older is At risk (70%).
  assert.equal(tab.sla('HD-9206').label, 'At risk');
  // P1 at 08:31: 4 of 15.
  tab.impact('HD-9205', 1, 1);
  assert.equal(tab.sla('HD-9205').label, '11m left');
  // Assign to me meets the respond target: the bar measures resolve, from Created.
  tab.run("hdAssignTicket('HD-9202')");
  const sla = tab.sla('HD-9202');
  assert.deepEqual([tab.ticket('HD-9202').status, sla.phase, sla.label], ['In Progress', 'Resolve', '7h 40m left']);
  assert.equal(tab.ticket('HD-9202').slaClock.respondedAt, '2026-08-18T08:35:00.000Z');
  // The ticket page shows the targets and shift times in UTC.
  const html = tab.open('HD-9202');
  assert.match(html, /Respond 30 minutes · resolve 8 hours/);
  assert.match(html, /<span>Created<\/span><strong>Tue 08:15<\/strong>/);
  // Business hours skip the weekend.
  assert.equal(tab.run("hdBusinessMinutes(Date.parse('2026-08-21T16:00:00Z'), Date.parse('2026-08-24T09:00:00Z'))"), 120);
  assert.equal(tab.run("new Date(hdAddSlaUnits(Date.parse('2026-08-21T16:30:00Z'), 60, true)).toISOString()"), '2026-08-24T08:30:00.000Z');
  assert.equal(tab.run("new Date(hdNextWorkingDay(Date.parse('2026-08-21T13:00:00Z'))).toISOString()"), '2026-08-24T13:00:00.000Z');
}

function testPausedResolvedTimeAndNextDay() {
  const tab = practice();
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T13:00:00.000Z');
  // On Hold – Awaiting Caller since Monday 09:40: 40 minutes used, Paused.
  assert.deepEqual([tab.sla('HD-9215').label, tab.sla('HD-9215').used, tab.sla('HD-9215').phase], ['Paused', 40, 'Resolve']);
  assert.match(tab.open('HD-9215'), /data-sla="paused"/);
  // The reply waiting at open reopened the resolved ticket at 12:50: the
  // Resolved time doesn't count, so 2 h 40 min used of 2 business days.
  const reopened = tab.ticket('HD-9212');
  assert.equal(reopened.status, 'In Progress');
  assert.deepEqual([tab.sla('HD-9212').phase, tab.sla('HD-9212').used, tab.sla('HD-9212').label], ['Resolve', 160, '15h 20m left']);
  assert.match(tab.open('HD-9212'), /data-hd-arrival="reopen"[\s\S]*Wed 12:50[\s\S]*It is NOT resolved/);
  // Next day is locked and names what still needs work today.
  const dash = tab.view('helpdesk/dashboard');
  assert.match(dash, /data-hd-next-day="locked"/);
  assert.match(dash, /Still needs work today: INC0019211, INC0019212 and INC0019215/);
  tab.run('hdNextDay()');
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T13:00:00.000Z');
  // Do the work: convert the first, escalate the second, log attempt 2.
  tab.run("hdConvertSet('HD-9211', 'item', 'Test delegate access'); hdConvertSet('HD-9211', 'level', 'Editor'); hdConvertToRequest('HD-9211')");
  tab.run("hdMatrixAssignGroup('HD-9212', 'Desktop Support (Tier 2)')");
  assert.equal(tab.ticket('HD-9212').status, 'Escalated');
  tab.input('hd-contact-method', 'Phone – voicemail left');
  tab.run("hdLogContactAttempt('HD-9215')");
  // Link one of the two related tickets and leave the other.
  tab.run("hdLinkParent('HD-9214', 'HD-9212')");
  assert.match(tab.view('helpdesk/dashboard'), /data-hd-next-day="open"/);
  tab.run('hdNextDay()');
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-20T13:00:00.000Z');
  assert.match(tab.lastToast(), /Thu 13:00/);
  // Thursday 13:00, as the plan's table has it.
  assert.deepEqual([tab.sla('HD-9212').used, tab.sla('HD-9212').label], [700, '6h 20m left']);
  assert.deepEqual([tab.sla('HD-9214').phase, tab.sla('HD-9214').used, tab.sla('HD-9214').label], ['Resolve', 565, '8h 35m left']);
  assert.deepEqual([tab.sla('HD-9213').phase, tab.sla('HD-9213').label], ['Respond', 'Breached']);
  assert.equal(tab.sla('HD-9215').label, 'Paused');
  // Only once (max 1).
  tab.run('hdNextDay()');
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-20T13:00:00.000Z');
  assert.match(tab.view('helpdesk/dashboard'), /data-hd-next-day="used"/);
  // Attempt 3 is logged on Thursday's clock.
  tab.input('hd-contact-method', 'Customer comment (Additional comments)');
  tab.run("hdLogContactAttempt('HD-9215')");
  assert.match(tab.open('HD-9215'), /Mon 09:40 · Additional comment<\/li><li>Wed 13:00 · Phone – voicemail left<\/li><li>Thu 13:00 · Customer comment \(Additional comments\)/);
  // The clock survives a reload.
  const again = practice(tab.local);
  assert.equal(again.run('hdShiftNow().toISOString()'), '2026-08-20T13:00:00.000Z');
  assert.equal(again.sla('HD-9212').used, 700);
}

function testServiceNowStates() {
  const tab = guided();
  tab.impact('HD-9204', 3, 2);
  // The New ticket's State list; taking it sets In Progress.
  assert.match(tab.open('HD-9204'), /data-hd-field="state"[^>]*><option value="">New<\/option><option>In Progress<\/option><option>Canceled<\/option>/);
  tab.state('HD-9204', 'In Progress');
  assert.deepEqual([tab.ticket('HD-9204').status, tab.ticket('HD-9204').assignedTechnician], ['In Progress', 'Riley Morgan']);
  // On Hold needs a reason.
  tab.state('HD-9204', 'On Hold', { 'hd-hold-reason': '' });
  assert.equal(tab.ticket('HD-9204').status, 'In Progress');
  assert.match(tab.lastToast(), /On Hold reason/);
  // Awaiting Vendor keeps the clock running; only Awaiting Caller pauses it.
  tab.state('HD-9204', 'On Hold', { 'hd-hold-reason': 'Awaiting Vendor' });
  assert.equal(tab.run("hdStatusText(hdTicketById('HD-9204'))"), 'On Hold – Awaiting Vendor');
  assert.notEqual(tab.sla('HD-9204').label, 'Paused');
  tab.state('HD-9204', 'In Progress');
  tab.state('HD-9204', 'On Hold', { 'hd-hold-reason': 'Awaiting Caller' });
  assert.equal(tab.sla('HD-9204').label, 'Paused');
  assert.match(tab.open('HD-9204'), /On Hold – Awaiting Caller/);
  // Resolved needs a resolution code and resolution notes.
  tab.state('HD-9204', 'Resolved', { 'hd-resolution-notes': 'Replaced the mouse batteries; pointer works.' });
  assert.equal(tab.ticket('HD-9204').status, 'On Hold');
  assert.match(tab.lastToast(), /resolution code/);
  tab.run("hdSetResolutionCode('HD-9204', 'Solution provided')");
  tab.state('HD-9204', 'Resolved', { 'hd-resolution-notes': 'short' });
  assert.match(tab.lastToast(), /resolution notes/);
  tab.state('HD-9204', 'Resolved', { 'hd-resolution-notes': 'password: Hunter22' });
  assert.equal(tab.ticket('HD-9204').status, 'On Hold');
  tab.state('HD-9204', 'Resolved', { 'hd-resolution-notes': 'Replaced the mouse batteries; pointer works.' });
  assert.deepEqual([tab.ticket('HD-9204').status, tab.ticket('HD-9204').closureCode, tab.sla('HD-9204').label], ['Resolved', 'Solution provided', 'Met / stopped']);
  // The resolve button path goes the same way.
  assert.equal(tab.run("hdTicketStaysOpen({ status:'On Hold', escalationCriteria:[] })"), true);
  // Another group: Escalated, the respond target met, and it leaves my group's list.
  tab.impact('HD-9205', 1, 1);
  tab.run("hdMatrixAssignGroup('HD-9205', 'Messaging & Collaboration')");
  const t = tab.ticket('HD-9205');
  assert.deepEqual([t.status, t.assignmentGroup, t.assignedTechnician, tab.sla('HD-9205').phase], ['Escalated', 'Messaging & Collaboration', 'Messaging & Collaboration', 'Resolve']);
  assert.ok(!tab.run("hdQueueListTickets('mine')").some((x) => x.id === 'HD-9205'));
  // A matrix ticket with no resolutionCode setting still gets the code.
  tab.run("hdSetResolutionCode('HD-9205', 'Escalated')");
  assert.equal(tab.ticket('HD-9205').consoleState.resolutionCode, 'Escalated');
  assert.match(tab.open('HD-9205'), /Resolution code \(required to resolve\)/);
  // The State and Assignment group lists change nothing until Apply.
  assert.match(tab.open('HD-9201'), /id="hd-next-state"[^>]*data-hd-field="state">(?![\s\S]*onchange="if\(this.value\)hdTransitionTicket)/);
  tab.input('hd-next-state', '');
  tab.run("hdApplyState('HD-9201')");
  assert.match(tab.lastToast(), /Choose the next state/);
  tab.input('hd-next-state', 'In Progress');
  tab.run("hdApplyState('HD-9201')");
  assert.equal(tab.ticket('HD-9201').status, 'In Progress');
  tab.input('hd-assignment-group', 'Facilities');
  tab.run("hdApplyGroup('HD-9201')");
  assert.equal(tab.ticket('HD-9201').status, 'Escalated');
  // A resolved matrix ticket's resolution code is locked.
  tab.run("hdSetResolutionCode('HD-9204', 'Duplicate')");
  assert.equal(tab.ticket('HD-9204').consoleState.resolutionCode, 'Solution provided');
  assert.match(tab.open('HD-9204'), /id="hd-resolution-code" class="select" disabled/);
  // A closed ticket's fields are locked.
  tab.run("hdMatrixAssignGroup('HD-9204', 'Facilities')");
  assert.equal(tab.ticket('HD-9204').assignmentGroup, 'Service Desk (Tier 1)');
}

function testQueueViewColumnsAndSort() {
  const tab = guided();
  let html = tab.view('helpdesk/tickets');
  assert.match(html, /Incidents › <select[^>]*><option value="unassigned" selected>Assigned to my group › Unassigned<\/option>/);
  assert.doesNotMatch(html, /<th>Priority<\/th>|<th>SLA due<\/th>/, 'the student adds the columns');
  ['priority', 'sla', 'category', 'caller', 'created'].forEach((key) => tab.run(`hdQueueColumn('${key}', true)`));
  html = tab.view('helpdesk/tickets');
  assert.match(html, /<th>Number<\/th><th>Short description<\/th><th>Priority<\/th><th>SLA due<\/th><th>Category<\/th><th>Caller<\/th><th>Created<\/th><th>State<\/th><th>Assigned to<\/th>/);
  // INC numbers only; the internal ids never show.
  assert.doesNotMatch(visible(html), /HD-92\d\d/);
  assert.match(visible(html), /INC0019205/);
  // Category shows the student's classification, never the template's.
  assert.doesNotMatch(visible(html), /Service Request/);
  assert.match(html, /data-hd-cell="category">Not classified/);
  tab.run("hdSetClassification('HD-9202', 'category', 'Network'); hdSetClassification('HD-9202', 'subcategory', 'Wi-Fi')");
  assert.match(tab.view('helpdesk/tickets'), /data-hd-cell="category">Network › Wi-Fi/);
  // Sorted by Created (default): oldest first.
  const order = () => [...tab.view('helpdesk/tickets').matchAll(/data-hd-row="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order(), ['HD-9201', 'HD-9204', 'HD-9206', 'HD-9202', 'HD-9203', 'HD-9205']);
  // Priority then SLA due: unset priorities last.
  tab.impact('HD-9201', 3, 3); tab.impact('HD-9202', 1, 2); tab.impact('HD-9203', 1, 2); tab.impact('HD-9204', 3, 2); tab.impact('HD-9205', 1, 1);
  tab.run("hdQueueSort(0, 'priority'); hdQueueSort(1, 'sla')");
  assert.deepEqual(order(), ['HD-9205', 'HD-9206', 'HD-9202', 'HD-9203', 'HD-9204', 'HD-9201']);
  // Assigned tickets leave Unassigned; the other lists keep them.
  tab.run("hdAssignTicket('HD-9205')");
  assert.ok(!order().includes('HD-9205'));
  tab.run("hdQueueSetList('mine')");
  assert.ok(order().includes('HD-9205'));
  // Due time in shift time.
  assert.match(tab.view('helpdesk/tickets'), /data-hd-cell="sla">[\s\S]*?<small>Tue 08:45<\/small>/);
}

function testWorkOrder() {
  const tab = guided();
  tab.impact('HD-9201', 3, 3); tab.impact('HD-9202', 1, 2); tab.impact('HD-9203', 1, 2); tab.impact('HD-9204', 3, 2); tab.impact('HD-9205', 1, 1);
  const order = () => plain(tab.run('hdWorkOrder()'));
  // Starts from the list's sort (Created): only the set's work-order tickets.
  assert.deepEqual(order(), ['HD-9201', 'HD-9204', 'HD-9202', 'HD-9203', 'HD-9205']);
  assert.match(tab.view('helpdesk/tickets'), /Your work order[\s\S]*Move up[\s\S]*Check order/);
  tab.run('hdWorkOrderSubmit()');
  assert.equal(tab.run('hdState.workOrderResult'), 'INC0019205 is out of place. Move it up, above INC0019201.');
  // Drag the P1 to the top.
  tab.run("hdWorkDrag({ dataTransfer:{ setData(){}, getData:() => 'HD-9205' } }, 'HD-9205'); hdWorkDrop({ preventDefault(){}, dataTransfer:{ getData:() => 'HD-9205' } }, 'HD-9201')");
  assert.deepEqual(order(), ['HD-9205', 'HD-9201', 'HD-9204', 'HD-9202', 'HD-9203']);
  tab.run('hdWorkOrderSubmit()');
  assert.equal(tab.run('hdState.workOrderResult'), 'INC0019202 is out of place. Move it up, above INC0019201.');
  // Dragging down one place, and to the last place.
  tab.run("hdWorkDrop({ preventDefault(){}, dataTransfer:{ getData:() => 'HD-9201' } }, 'HD-9204')");
  assert.deepEqual(order(), ['HD-9205', 'HD-9204', 'HD-9201', 'HD-9202', 'HD-9203']);
  tab.run("hdWorkDrop({ preventDefault(){}, dataTransfer:{ getData:() => 'HD-9201' } }, 'HD-9203')");
  assert.deepEqual(order(), ['HD-9205', 'HD-9204', 'HD-9202', 'HD-9203', 'HD-9201']);
  tab.run("hdWorkOrderMove('HD-9201', -1); hdWorkOrderMove('HD-9201', -1); hdWorkOrderMove('HD-9201', -1); hdWorkOrderMove('HD-9204', 1); hdWorkOrderMove('HD-9204', 1)");
  assert.deepEqual(order(), ['HD-9205', 'HD-9201', 'HD-9202', 'HD-9203', 'HD-9204']);
  tab.run("hdWorkOrderMove('HD-9204', -1); hdWorkOrderMove('HD-9204', -1)");
  assert.deepEqual(order(), ['HD-9205', 'HD-9201', 'HD-9204', 'HD-9202', 'HD-9203']);
  // Move buttons (the keyboard path).
  tab.run("hdWorkOrderMove('HD-9201', 1); hdWorkOrderMove('HD-9201', 1); hdWorkOrderMove('HD-9201', 1)");
  tab.run("hdWorkOrderMove('HD-9204', 1); hdWorkOrderMove('HD-9204', 1)");
  assert.deepEqual(order(), ['HD-9205', 'HD-9202', 'HD-9203', 'HD-9204', 'HD-9201']);
  // Any order inside a group is accepted.
  tab.run('hdWorkOrderSubmit()');
  assert.equal(tab.run('hdState.workOrderResult'), 'ok');
  assert.match(tab.view('helpdesk/tickets'), /data-hd-order="ok"/);
  tab.run("hdWorkOrderMove('HD-9205', -1)");
  assert.equal(tab.run('hdWorkOrder()')[0], 'HD-9205', 'the top row can\'t move up');
  // The check itself, without a set.
  assert.deepEqual(JSON.parse(JSON.stringify(tab.run("hdWorkOrderCheck(['b','a','c'], [['a'],['b','c']])"))), { ok: false, move: 'a', before: 'b' });
  assert.deepEqual(JSON.parse(JSON.stringify(tab.run("hdWorkOrderCheck(['a','c','b'], [['a'],['b','c']])"))), { ok: true });
  // A reload keeps the order.
  assert.deepEqual(plain(guidedReload(tab).run('hdWorkOrder()')), ['HD-9205', 'HD-9202', 'HD-9203', 'HD-9204', 'HD-9201']);
}
const guidedReload = (tab) => sim({ local: tab.local });

function testConvertToRequest() {
  // Approved at once (the manager already approved).
  const tab = guided();
  tab.impact('HD-9201', 3, 3);
  assert.match(tab.open('HD-9201'), /Convert to Request/);
  tab.run("hdConvertToRequest('HD-9201')");
  assert.match(tab.lastToast(), /catalog item/);
  tab.run("hdConvertSet('HD-9201', 'item', 'Test keyboard'); hdConvertToRequest('HD-9201')");
  const t = tab.ticket('HD-9201');
  assert.deepEqual([t.status, t.cancelReason, t.request.number, t.request.approval, t.request.requestedFor], ['Canceled', 'Converted', 'RITM0019201', 'Approved', 'Amir Patel']);
  assert.equal(tab.run("hdStatusText(hdTicketById('HD-9201'))"), 'Canceled – Converted');
  assert.equal(tab.sla('HD-9201').label, 'Converted');
  const html = tab.open('HD-9201');
  assert.match(html, /data-hd-request="RITM0019201"[\s\S]*Approval: Approved[\s\S]*None: requests have no SLA bar here/);
  assert.equal(t.slaClock.respondedAt, '2026-08-18T08:35:00.000Z', 'converting meets the respond target');
  // Waiting for approval: the grant is refused and recorded until the
  // approval arrives.
  const p = practice();
  p.run("hdConsoleAction('HD-9211', 'grant')");
  assert.ok(p.run("hdConsoleState(hdTicketById('HD-9211')).critical.some((c) => c.id === 'early:grant')"));
  assert.match(p.lastToast(), /Wait for the approval/);
  p.run("hdConvertSet('HD-9211', 'item', 'Test delegate access'); hdConvertToRequest('HD-9211')");
  assert.match(p.lastToast(), /Permission/);
  p.run("hdConvertSet('HD-9211', 'level', 'Editor'); hdConvertToRequest('HD-9211')");
  assert.equal(p.ticket('HD-9211').request.approval, 'Approved', 'the approval message arrived after the conversion');
  assert.match(p.open('HD-9211'), /data-hd-arrival="approved"/);
  p.run("hdConsoleAction('HD-9211', 'grant')");
  assert.ok(p.run("hdConsoleState(hdTicketById('HD-9211')).actions.some((a) => a.id === 'grant')"));
  p.run("hdRequestClose('HD-9211')");
  assert.equal(p.ticket('HD-9211').request.state, 'Closed Complete');
  // A converted incident counts as closed for the practice set's report.
  assert.equal(p.run("hdTicketById('HD-9211').status === 'Canceled'"), true);
  p.run("hdState.tickets.filter((x) => x.id !== 'HD-9211').forEach((x) => { x.status = 'Resolved'; })");
  assert.equal(p.run('hdPracticeClosed()'), true);
  p.run("hdTicketById('HD-9213').status = 'Canceled'; hdTicketById('HD-9213').cancelReason = 'Canceled'");
  assert.equal(p.run('hdPracticeClosed()'), false, 'only a converted cancel counts');
}

function testLinkingAndRewrite() {
  const tab = guided();
  tab.impact('HD-9203', 3, 3);
  assert.equal(tab.sla('HD-9203').phase, 'Respond');
  tab.run("hdLinkParent('HD-9203', 'HD-9203')");
  assert.equal(tab.ticket('HD-9203').parentId, undefined);
  tab.run("hdLinkParent('HD-9203', 'HD-9202')");
  assert.equal(tab.ticket('HD-9203').parentId, 'HD-9202');
  assert.equal(tab.sla('HD-9203').phase, 'Resolve', 'linking meets the respond target');
  assert.equal(tab.sla('HD-9202').label, 'Not set', 'the parent keeps its own clock');
  assert.match(tab.open('HD-9203'), /data-hd-parent="HD-9202"[\s\S]*Child of <strong>INC0019202/);
  assert.match(tab.view('helpdesk/tickets'), /Child of INC0019202/);
  // The rewrite check names what is missing.
  tab.input('hd-rewrite-short', 'Internet not working');
  tab.input('hd-rewrite-desc', 'Laptop has no internet.');
  tab.run("hdRewriteSave('HD-9203')");
  assert.deepEqual(plain(tab.ticket('HD-9203').consoleState.rewrite.missing), ['who', 'where', 'when', 'impact', '"(reopened)"']);
  assert.match(tab.lastToast(), /Check that it says who, where, when, impact and "\(reopened\)"\./);
  assert.match(tab.open('HD-9203'), /stranger can follow it: who, where, when, impact and &quot;\(reopened\)&quot;/);
  tab.input('hd-rewrite-short', 'Wi-Fi no internet – Luis Ortega – floor 9 (reopened)');
  tab.input('hd-rewrite-desc', 'Since 08:15. All of Sales on floor 9 is affected.');
  tab.run("hdRewriteSave('HD-9203')");
  assert.deepEqual(plain(tab.ticket('HD-9203').consoleState.rewrite.missing), []);
  assert.match(tab.open('HD-9203'), /data-hd-rewrite="ok"/);
  assert.match(tab.view('helpdesk/tickets'), /Wi-Fi no internet – Luis Ortega – floor 9 \(reopened\)/);
  // "(reopened)" counts only in the short description.
  assert.deepEqual(plain(tab.run("hdRewriteMissing([{ part:'r', pattern:'\\\\(reopened\\\\)', field:'short' }], 'x', '(reopened)')")), ['r']);
  // Never a password.
  tab.input('hd-rewrite-short', 'pw: Spring2026');
  tab.run("hdRewriteSave('HD-9203')");
  assert.match(tab.lastToast(), /password/i);
  assert.equal(tab.ticket('HD-9203').shortDescription, 'Wi-Fi no internet – Luis Ortega – floor 9 (reopened)');
  tab.run("hdUnlinkParent('HD-9203')");
  assert.equal(tab.ticket('HD-9203').parentId, '');
}

function testArrivalsCommentsAndKnowledge() {
  const tab = guided();
  // when.resolved waits for Resolved or Closed.
  assert.equal(tab.run("hdArrivalMet(hdTicketById('HD-9204'), { resolved:true })"), false);
  tab.impact('HD-9204', 3, 2);
  tab.state('HD-9204', 'In Progress');
  tab.state('HD-9204', 'On Hold', { 'hd-hold-reason': 'Awaiting Caller' });
  // Priya's reply waits for a note and a comment on another ticket.
  assert.equal(tab.ticket('HD-9204').status, 'On Hold');
  assert.doesNotMatch(tab.open('HD-9204'), /hd-arrivals/);
  // The comment check names internal names as well as jargon.
  tab.comment('HD-9205', 'Hi Sam, NS-PBX09 is down and Messaging & Collaboration has it.');
  assert.match(tab.lastToast(), /Internal names stay in the work notes: NS-PBX09, Messaging & Collaboration\./);
  assert.deepEqual(plain(tab.run("hdConsoleProgress('HD-9205').lastCommentInternal")), ['NS-PBX09', 'Messaging & Collaboration']);
  assert.equal(tab.ticket('HD-9204').status, 'On Hold', 'a note is still missing');
  tab.note('HD-9205', 'Reported: phones down. Tried: checked with Sam. Result: assigned onward.');
  assert.equal(tab.ticket('HD-9204').status, 'In Progress', 'the reply resumed the ticket');
  assert.match(tab.lastToast(), /New reply from Priya Shah on INC0019204/);
  assert.match(tab.open('HD-9204'), /data-hd-arrival="priya-reply"[\s\S]*Tue 08:35/);
  // Knowledge draft: only once resolved, never with a password, then Review.
  assert.match(tab.open('HD-9204'), /available once the ticket is resolved/);
  tab.run("hdSetResolutionCode('HD-9204', 'Solution provided')");
  tab.state('HD-9204', 'Resolved', { 'hd-resolution-notes': 'New batteries in the wireless mouse fixed the freezing.' });
  assert.equal(tab.run("hdArrivalMet(hdTicketById('HD-9204'), { resolved:true })"), true);
  assert.match(tab.open('HD-9204'), /id="hd-kb-draft-text"[^>]*>New batteries in the wireless mouse fixed the freezing\./);
  tab.input('hd-kb-draft-title', 'Wireless mouse pointer freezes: replace the batteries first');
  tab.input('hd-kb-draft-text', 'passcode = 1234');
  tab.run("hdKbCreateDraft('HD-9204')");
  assert.equal(tab.ticket('HD-9204').consoleState.kbDraft, undefined);
  tab.input('hd-kb-draft-text', '1. Ask if it is wireless. 2. Replace the batteries.');
  tab.run("hdKbCreateDraft('HD-9204')");
  assert.equal(tab.ticket('HD-9204').consoleState.kbDraft.state, 'Review');
  assert.match(tab.open('HD-9204'), /data-hd-kb-draft="review"/);
  assert.match(tab.view('helpdesk/knowledge-base'), /Drafts in review[\s\S]*Wireless mouse pointer freezes/);
  // Attach knowledge: from an opened article, listed under Related › Knowledge.
  tab.input('hd-kb-input', 'password');
  tab.run("hdKbSearch(null, 'HD-9202')");
  const article = tab.run("hdConsoleState(hdTicketById('HD-9202')).kbSearches[0].results[0]");
  assert.ok(article);
  tab.run(`hdKbOpen('HD-9202', '${article}')`);
  assert.match(tab.open('HD-9202'), /Attach knowledge<\/button>/);
  tab.run(`hdKbAttach('HD-9202', '${article}')`);
  const html = tab.open('HD-9202');
  assert.match(html, /Related › Knowledge[\s\S]*data-hd-attached="1"/);
  assert.match(html, /✓ Attached to this ticket/);
  assert.deepEqual(plain(tab.run("hdConsoleProgress('HD-9202').kbAttached")), [article]);
  // A ticket with kb: true only (old style) gets no Attach button.
  assert.equal(tab.run("hdKbConfig({ id:'HD-2150' }).attach"), undefined);
}

function testContactAttemptsAndCoachedSetGuard() {
  const tab = practice();
  assert.ok(tab.run("hdResolutionCodes(hdTicketById('HD-9215'))").includes('No response from caller'));
  assert.ok(!tab.run("hdResolutionCodes(hdTicketById('HD-9212'))").includes('No response from caller'));
  assert.match(tab.open('HD-9215'), /data-hd-attempts="1"/);
  tab.input('hd-contact-method', '');
  tab.run("hdLogContactAttempt('HD-9215')");
  assert.match(tab.lastToast(), /how you tried/);
  // A coached set loses its clock and tools once another coach swaps the tickets.
  const g = guided();
  assert.equal(g.run('hdActiveSet() && hdActiveSet().title'), 'Test guided queue');
  assert.match(g.view('helpdesk/tickets'), /Incidents ›/);
  g.run("const fresh = hdFreshState(); hdState.tickets = fresh.tickets.filter((t) => ['HD-2150', 'SR-2102'].includes(t.id))");
  assert.equal(g.run('hdActiveSet()'), null);
  assert.equal(g.run('hdShiftNow() === HD_SHIFT_NOW'), true);
  assert.doesNotMatch(g.view('helpdesk/tickets'), /Incidents ›/);
  // The next save drops the set's leftover fields with it.
  g.run("hdState.workOrder = ['HD-9201']; hdState.queueView = { columns:[] }; hdSave()");
  const saved = JSON.parse(g.local.getItem(g.run('hdStateKey()')));
  for (const key of ['ticketSet', 'clockNow', 'daysMoved', 'workOrder', 'queueView']) assert.equal(saved[key], undefined, `${key} left in the save`);
  // While the set's own tickets are on the shift, a save keeps the set.
  const g3 = guided();
  g3.run('hdSave()');
  assert.equal(JSON.parse(g3.local.getItem(g3.run('hdStateKey()'))).ticketSet, 'test-guided');
  // Reset shift on a coached set starts the set again; a practice set can't
  // switch to a coached set.
  const g2 = guided();
  g2.impact('HD-9205', 1, 1);
  g2.run('hdResetShift()');
  assert.equal(g2.run("hdState.ticketSet"), 'test-guided');
  assert.equal(g2.ticket('HD-9205').priority, '');
  assert.equal(tab.run("hdUseTicketSet('test-guided')"), false);
  assert.equal(g2.run("hdUseTicketSet('no-such-set')"), false);
  // The practice set's own tickets come in, its saved shift is separate.
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), PRACTICE.map((t) => t.id).sort());
  assert.ok(tab.local.getItem('defender-lab.helpdesk.practice.v1.test-practice.stu-1'));
}


// A Prove shift gets none of the new features, even if its ticket asks for
// them: no matrix, set clock, queue tools, work order or Next day.
// A coached set's tickets must be kept out of the shared shift (ownSet).
// Then no other coach's reset can leave only some of them on the shift, and
// the set guard (hdActiveSet) can't keep a set for tickets that aren't its own.
function testCoachedSetTicketsAreOwnSet() {
  const tab = sim({ withTest: false });
  const sets = tab.run("typeof HD_COACHED_SETS === 'undefined' ? {} : HD_COACHED_SETS");
  for (const [key, set] of Object.entries(plain(sets))) {
    for (const id of set.tickets) {
      const template = plain(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === ${JSON.stringify(id)}) || null`));
      assert.ok(template, `coached set ${key}: ticket ${id} has no template`);
      assert.equal(template.ownSet, true, `coached set ${key}: ticket ${id} needs ownSet: true`);
    }
  }
}

function testProveGetsNoneOfTheNewFeatures() {
  const every = "{ kb:true, matrix:{}, classify:{ categories:{ A:['b'] } }, convert:{ number:'RITM1', items:[{ name:'x' }] }, link:true, rewrite:{ checks:[] }, contactAttempts:true, arrivals:[{ id:'m', text:'hi', reopen:true }] }";
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m02-prove#/helpdesk/tickets', before: `HD_PROVE_SHIFTS['its-01'].tickets[0].console = ${every};` });
  const id = prove.run('hdState.tickets[0].id');
  assert.deepEqual(plain(prove.run('hdConsole(hdState.tickets[0])')), { kb: true });
  assert.equal(prove.run('hdIsMatrix(hdState.tickets[0])'), false);
  assert.equal(prove.run('hdActiveSet()'), null);
  assert.equal(prove.run('hdShiftNow() === HD_SHIFT_NOW'), true);
  assert.equal(prove.run('hdHasArrivals()'), false);
  for (const html of [prove.open(id), prove.view('helpdesk/tickets'), prove.view('helpdesk/dashboard')]) {
    assert.doesNotMatch(html, NEW_MARKERS);
    assert.doesNotMatch(html, /Columns|Sort by|Your work order|Check order|Next day/);
  }
  assert.equal(prove.run('hdState.practiceLog'), undefined, 'no practice log in a Prove shift');
  assert.equal(prove.run('hdState.tickets[0].slaClock'), undefined, 'no matrix fields in the Prove state');
}

// On a set's own clock, notes, customer updates, comments and history show
// the shift's time; the shared shift, Module 1 and Prove It keep the
// computer's time.
const DAY_STAMP = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d{2}:\d{2}$/;
const lastNote = (tab, id) => tab.run(`hdTicketById(${JSON.stringify(id)}).notes.slice(-1)[0]`);
const lastHistory = (tab, id) => tab.run(`hdTicketById(${JSON.stringify(id)}).troubleshootingHistory.slice(-1)[0].time`);
function testNotesUseTheShiftClock() {
  const tab = guided();
  assert.equal(tab.note('HD-9202', 'Reported: floor 9 Wi-Fi down. Tried: checked the AP. Result: still down.'), true);
  assert.equal(lastNote(tab, 'HD-9202').time, 'Tue 08:35');
  assert.equal(lastHistory(tab, 'HD-9202'), 'Tue 08:35');
  tab.run("hdContactRequester('HD-9202')");
  assert.deepEqual([lastNote(tab, 'HD-9202').author, lastNote(tab, 'HD-9202').time], ['Customer update', 'Tue 08:35']);
  assert.equal(tab.run('hdConsoleTime()'), 'Tue 08:35');
  assert.match(tab.open('HD-9202'), /Customer update · Tue 08:35/);
  // A practice set's clock (Wednesday 13:00); a moved clock (what "Next day"
  // saves) moves the next note.
  const later = practice();
  assert.equal(later.note('HD-9213', 'Reported: a. Tried: b. Result: c.'), true);
  assert.equal(lastNote(later, 'HD-9213').time, 'Wed 13:00');
  later.run("hdState.clockNow = '2026-08-20T08:00:00.000Z'");
  later.note('HD-9213', 'Reported: a. Tried: b. Result: d.');
  assert.equal(lastNote(later, 'HD-9213').time, 'Thu 08:00');
  // The shared shift and a Module 1 ticket: the computer's time, as before.
  const shared = sim();
  for (const id of ['HD-2150', 'HD-2101']) {
    shared.note(id, 'Reported: a. Tried: b. Result: c.');
    assert.doesNotMatch(lastNote(shared, id).time, DAY_STAMP);
    assert.match(lastNote(shared, id).time, /\d{1,2}:\d{2}/);
  }
  shared.run("hdContactRequester('HD-2150')");
  assert.doesNotMatch(lastNote(shared, 'HD-2150').time, DAY_STAMP);
  assert.doesNotMatch(shared.run('hdConsoleTime()'), DAY_STAMP);
  // Prove It: no set clock.
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m02-clock#/helpdesk/tickets' });
  assert.doesNotMatch(prove.run('hdConsoleTime()'), DAY_STAMP);
}

// On a Module 2 ticket, the State chosen but not applied survives a redraw
// (a resolution code, Impact): it is kept in memory only, never saved.
const chosenState = (html) => (html.match(/<select id="hd-next-state"[\s\S]*?<\/select>/) || [''])[0].match(/<option selected>([^<]*)<\/option>/);
function testResolutionCodeKeepsTheChosenState() {
  const tab = guided();
  tab.state('HD-9201', 'In Progress');
  assert.equal(tab.ticket('HD-9201').status, 'In Progress');
  let html = tab.open('HD-9201');
  assert.match(html, /id="hd-next-state" class="select" onchange="hdKeepPendingState\('HD-9201','state',this.value\)" data-hd-field="state">/);
  assert.equal(chosenState(html), null, 'nothing chosen yet');
  tab.run("hdKeepPendingState('HD-9201', 'state', 'Resolved')");
  tab.run("hdSetResolutionCode('HD-9201', 'Solution provided')");
  html = tab.run("VIEWS['helpdesk/ticket']()");
  assert.equal(chosenState(html)[1], 'Resolved', 'the resolution code keeps the chosen State');
  assert.equal(tab.ticket('HD-9201').status, 'In Progress', 'nothing changes until Apply');
  tab.impact('HD-9201', 3, 3);
  assert.equal(chosenState(tab.run("VIEWS['helpdesk/ticket']()"))[1], 'Resolved');
  // Never saved: not in the ticket, not in storage.
  assert.doesNotMatch(JSON.stringify(tab.run('hdState')), /hdKeepPendingState|pendingState/);
  assert.equal(tab.ticket('HD-9201').drafts && tab.ticket('HD-9201').drafts.state, undefined);
  // Apply resolves it, and the choice is cleared.
  tab.input('hd-next-state', 'Resolved');
  tab.input('hd-resolution-notes', 'Sent the keyboard request to approval; caller confirmed.');
  tab.run("hdApplyState('HD-9201')");
  assert.deepEqual([tab.ticket('HD-9201').status, tab.ticket('HD-9201').closureCode], ['Resolved', 'Solution provided']);
  assert.equal(tab.run("hdPendingState['HD-9201']"), undefined);
  // Choosing the blank option drops it; opening a ticket again drops it too.
  tab.run("hdKeepPendingState('HD-9202', 'state', 'Canceled')");
  tab.run("hdKeepPendingState('HD-9202', 'state', '')");
  assert.equal(tab.run("hdPendingState['HD-9202']"), undefined);
  tab.run("hdKeepPendingState('HD-9202', 'state', 'Canceled')");
  assert.equal(chosenState(tab.open('HD-9202')), null);
  // The On Hold reason is kept with it, so Apply still works after a redraw.
  tab.state('HD-9203', 'In Progress');
  tab.run("hdSelectTicket('HD-9203')");
  tab.run("hdKeepPendingState('HD-9203', 'state', 'On Hold'); hdKeepPendingState('HD-9203', 'hold', 'Awaiting Caller')");
  tab.run("hdSetResolutionCode('HD-9203', 'Duplicate')");
  html = tab.run("VIEWS['helpdesk/ticket']()");
  assert.equal(chosenState(html)[1], 'On Hold');
  assert.match(html, /id="hd-hold-reason"[\s\S]*?<option selected>Awaiting Caller<\/option>/);
  tab.input('hd-next-state', 'On Hold'); tab.input('hd-hold-reason', 'Awaiting Caller');
  tab.run("hdApplyState('HD-9203')");
  assert.deepEqual([tab.ticket('HD-9203').status, tab.ticket('HD-9203').holdReason], ['On Hold', 'Awaiting Caller']);
  assert.equal(tab.run("hdPendingState['HD-9203']"), undefined);
  // An unknown field is ignored; a reset drops every pending choice.
  tab.run("hdKeepPendingState('HD-9202', 'priority', 'P1')");
  assert.equal(tab.run("hdPendingState['HD-9202']"), undefined);
  tab.run("hdKeepPendingState('HD-9202', 'state', 'Canceled'); hdResetShift()");
  assert.equal(tab.run('Object.keys(hdPendingState).length'), 0);
  // Older tickets keep the list that applies on change, with no pending State.
  const shared = sim();
  for (const id of ['HD-2150', 'HD-2101']) assert.doesNotMatch(shared.open(id), /hdKeepPendingState/);
}

const tests = [
  testProveGetsNoneOfTheNewFeatures, testOldTicketsKeepTheOldClockAndStates, testImpactAndUrgencyCalculatePriority, testSlaRespondThenResolveOnTheSetClock,
  testPausedResolvedTimeAndNextDay, testServiceNowStates, testQueueViewColumnsAndSort, testWorkOrder, testConvertToRequest,
  testLinkingAndRewrite, testArrivalsCommentsAndKnowledge, testContactAttemptsAndCoachedSetGuard, testCoachedSetTicketsAreOwnSet,
  testNotesUseTheShiftClock, testResolutionCodeKeepsTheChosenState,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m02-console-features: all ${tests.length} passed`);

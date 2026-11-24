// Module 4 (key its-02) Prove It: one ticket on Module 3's one-ticket form,
// worked on two computers with Module 4's typed commands and printer screens
// (ui/helpdesk.js, HD_PROVE_SHIFTS['its-02']), and the course page's side of
// it (portal/it-support-shared.js: the cleaner, the prefill, the review panel;
// portal/it-support-module-02.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, and every tool on both computers.
//   - The commands and screens read and change only the computer they run on.
//   - The user's late reply arrives only after a job prints from the queue,
//     shows under Ticket replies and survives a reload.
//   - The package carries a small print-queue summary, not the whole machine,
//     and stays inside the course page's machine limit at its fullest. Module 1
//     and Module 3 packages are unchanged.
//   - The course page keeps the summary, the commands and the outside-driver
//     event; a returned attempt puts the queue settings back.
//   - The instructor reads the work note and the reply in full, every command,
//     the actions and the queues at submit; Module 3's panel is unchanged.
//   - The page submits through recordLabAttempt; a failed write saves nothing.
//
// Structure only: nothing here says which choice or setting is right. Values
// are read from the shift data or picked by position; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const UI = path.join(__dirname, '..', 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-02-prove-it';
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);
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
  const j = (value) => JSON.stringify(value);
  return {
    ctx, run, local, byId, toasts,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: () => run('hdState.tickets[0]'),
    prove: () => plain(run('hdState.prove')),
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    submitState: () => plain(run('hdProveSubmitState()')),
    coachPanel: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
    // Typed in PowerShell on the selected computer: the output the student sees.
    ps: (computer, command) => {
      run(`hdSelectComputer(${j(computer)})`);
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
  };
}
const SHIFT = sim('its-02', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-02']))");
const SPEC = SHIFT.tickets[0];
const MAIN = SHIFT.selectedComputer;
const OTHER = SHIFT.computers.map((c) => c.name).find((name) => name !== MAIN);
const PRINTER = Object.keys(SHIFT.machines[MAIN].printQueues)[0];
const QUEUE = SHIFT.machines[MAIN].printQueues[PRINTER];
// The computer's other port, picked from the data: not a statement of the fix.
const OTHER_PORT = SHIFT.machines[MAIN].ports.map((p) => p.name).find((name) => name !== QUEUE.port);
const ADDRESS = Object.keys(SHIFT.machines[MAIN].reachable)[0];
const CLASSES = sim('its-02', 'probe2').run('HD_PROVE_CLASSES.slice()');
const GROUPS = sim('its-02', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const WRITING = { resolutionNote: 'Synthetic note A: Reported / Tried / Result, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[1]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '3');
  tab.ctx.hdProveSetField('urgency', '2');
  tab.ctx.hdProveSetField('group', GROUPS[2]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[1]);
  tab.ctx.hdProveChoose('decision', 'Escalate');
  [SPEC.pathPool[1].id, SPEC.pathPool[9].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  tab.ctx.hdProveText('resolutionNote', WRITING.resolutionNote);
  tab.ctx.hdProveText('userReply', WRITING.userReply);
  tab.run('hdProveClose(hdState.tickets[0].id)');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m02', step: 2 })]]);
  const tab = sim('its-02', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-02-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 20);
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(SPEC.id), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.doesNotMatch(html, /data-hd-prove-replies/, 'no replies yet');
  // Every card opens on its own and is recorded once.
  SPEC.evidence.forEach((card) => tab.ctx.hdProveOpenCard('card', card.id));
  tab.ctx.hdProveOpenCard('card', SPEC.evidence[0].id);
  same(tab.prove().opened, SPEC.evidence.map((card) => `card:${card.id}`));
  // Both computers show the same tools, so the buttons never point at the case.
  const tools = (name) => [...tab.run(`hdFeatureToolButtons(${JSON.stringify(name)})`).matchAll(/data-hd-tools="([^"]+)"/g)].map((m) => m[1]);
  same(tools(MAIN), tools(OTHER), 'the same tools on both computers');
  assert.ok(tools(MAIN).length >= 4);
  // Get-Help never lists the case's commands.
  assert.doesNotMatch(tab.ps(MAIN, 'Get-Help'), /Printing:|Network:/);
  // Every queue on both computers offers the manufacturer's driver.
  [MAIN, OTHER].forEach((name) => Object.values(SHIFT.machines[name].printQueues).forEach((queue) => assert.ok(queue.outsideDriver, `${name} offers it`)));
}

function testCommandsReadOnlyTheirComputer() {
  const tab = sim('its-02', 'stu-commands');
  const other = SHIFT.machines[OTHER].printQueues[PRINTER];
  assert.match(tab.ps(MAIN, `Get-Printer -Name ${PRINTER} | Format-List Name, PortName, DriverName`), new RegExp(`PortName\\s+: ${QUEUE.port}`));
  assert.match(tab.ps(OTHER, `Get-Printer -Name ${PRINTER} | Format-List Name, PortName, DriverName`), new RegExp(`PortName\\s+: ${other.port}`));
  assert.match(tab.ps(MAIN, `ping ${ADDRESS}`), /Received = 4/);
  assert.match(tab.ps(MAIN, 'ping 192.0.2.250'), /Request timed out/);
  assert.match(tab.ps(MAIN, `Test-NetConnection ${ADDRESS} -Port 9100`), /TcpTestSucceeded : True/);
  assert.match(tab.ps(MAIN, `Get-PrintJob -PrinterName ${PRINTER}`), new RegExp(QUEUE.jobs[0].document));
  const commands = tab.prove().events.filter((e) => e.type === 'command_run');
  assert.ok(commands.length >= 6 && commands.every((e) => e.computer), 'each command is recorded with its computer');
  // A change on one computer leaves the other alone.
  tab.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'media', ${JSON.stringify(QUEUE.mediaSizes.find((s) => s !== QUEUE.media))})`);
  assert.equal(tab.machine(OTHER).printQueues[PRINTER].media, other.media);
}

function testReplyArrivesAfterAPrint() {
  const local = store();
  const session = store();
  const tab = sim('its-02', 'stu-arrival', local, session);
  // Changes that print nothing bring no reply.
  tab.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'driver', ${JSON.stringify(SHIFT.machines[MAIN].driverCatalog[1])})`);
  tab.run(`hdQueueTestPage(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)})`);
  assert.doesNotMatch(ticketView(tab), /data-hd-prove-replies/, 'nothing printed: no reply');
  assert.equal(tab.machine(MAIN).printQueues[PRINTER].printed.length, 0);
  // A job prints from the queue: the reply arrives once, under Ticket replies.
  tab.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'port', ${JSON.stringify(OTHER_PORT)})`);
  assert.ok(tab.machine(MAIN).printQueues[PRINTER].printed.length > 0, 'the queue printed');
  const html = ticketView(tab);
  const arrival = SPEC.console.arrivals[0];
  assert.match(html, /data-hd-prove-replies/);
  assert.ok(html.includes(tab.run('hdEsc')(arrival.text)), 'the reply text');
  tab.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'port', ${JSON.stringify(QUEUE.port)})`);
  assert.equal(tab.ticket().consoleState.arrived.length, 1, 'once');
  // A reload keeps it.
  const again = sim('its-02', 'stu-arrival', local, session);
  assert.ok(ticketView(again).includes(again.run('hdEsc')(arrival.text)), 'the reply survives a reload');
  // Paper size changed before anything printed: the reply never claims a fault that is gone.
  const first = sim('its-02', 'stu-arrival-media');
  first.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'media', ${JSON.stringify(QUEUE.mediaSizes.find((s) => s !== QUEUE.media))})`);
  first.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, 'port', ${JSON.stringify(OTHER_PORT)})`);
  assert.ok(first.machine(MAIN).printQueues[PRINTER].printed.length > 0);
  assert.doesNotMatch(ticketView(first), /data-hd-prove-replies/, 'no reply once the paper size changed');
  // Other Prove shifts have no arrivals.
  assert.equal(sim('its-01', 'stu-m1-arr').run('hdHasArrivals()'), false);
  assert.equal(sim('its-11', 'stu-m3-arr').run('hdHasArrivals()'), false);
}

function testPackageCarriesASmallSummary() {
  const tab = sim('its-02', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  // The fullest state: the queue printed, every setting changed, the outside
  // driver installed, test pages, and the other computer used too.
  const set = (field, value) => tab.run(`hdPrinterSet(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)}, ${JSON.stringify(field)}, ${JSON.stringify(value)})`);
  set('port', OTHER_PORT);
  set('outside', '');
  set('media', QUEUE.mediaSizes[QUEUE.mediaSizes.length - 1]);
  for (let i = 0; i < 20; i += 1) tab.run(`hdQueueTestPage(${JSON.stringify(MAIN)}, ${JSON.stringify(PRINTER)})`);
  tab.ps(OTHER, `Get-PrintJob -PrinterName ${PRINTER}`);
  const work = plain(tab.run('hdProvePackage()'));
  same(Object.keys(work.machine), ['printQueues'], 'only the queue summary');
  same(Object.keys(work.machine.printQueues), Object.keys(SHIFT.machines[MAIN].printQueues));
  const summary = work.machine.printQueues[PRINTER];
  same(Object.keys(summary).sort(), ['driver', 'media', 'port', 'printed', 'queued', 'testPages']);
  assert.equal(summary.port, OTHER_PORT);
  assert.equal(summary.driver, QUEUE.outsideDriver);
  assert.equal(summary.queued, 0);
  assert.equal(summary.testPages, 20);
  assert.ok(JSON.stringify(work.machine).length < 1024, 'far inside the 4 KB machine limit');
  assert.ok(work.events.some((e) => e.type === 'action_taken' && e.value === 'printer-driver-outside' && e.computer === MAIN));
  return work;
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-02', LAB);
  assert.equal(reason, undefined);
  same(saved.machine, work.machine, 'the summary is kept as it came');
  assert.equal(saved.fields.priority, 'P4', 'Priority is the course page\'s own (3 x 2)');
  assert.ok(saved.commands.length >= 1 && saved.commands.every((c) => c.command && c.computer));
  assert.ok(saved.events.some((e) => e.type === 'action_taken' && e.value === 'printer-driver-outside'), 'the outside-driver event is kept');
  assert.equal(saved.keyFinding, undefined, 'no Module 3 writing');
  assert.equal(clean({ ...work, moduleKey: 'its-11', labKey: 'lab-its-11-prove-it', rubricVersion: 'hdesk-its-11-prove-v1' }, 'its-11', 'lab-its-11-prove-it').reason, 'invalid',
    'refused on Module 3 (no key finding or KB draft)');
  // Module 1 still sends the whole machine.
  const m1 = sim('its-01', 'stu-m1');
  const m1Machine = plain(m1.run('hdProvePackage()')).machine;
  same(Object.keys(m1Machine).sort(), Object.keys(plain(m1.run(`HD_PROVE_SHIFTS['its-01'].machines[HD_PROVE_SHIFTS['its-01'].selectedComputer]`))).sort(), 'Module 1: the whole machine');
  return saved;
}

function testPrefillPutsTheQueueBack(saved) {
  const row = { completed_at: new Date(Date.now() + 60000).toISOString(), result: { source: 'mnt-prove-submit', ...saved } };
  const lastWork = plain(prun('itsProvePrefillWork')(row));
  const tab = sim('its-02', 'stu-prefill');
  assert.equal(tab.run('hdProvePrefill')(lastWork), true);
  const queue = tab.machine(MAIN).printQueues[PRINTER];
  assert.equal(queue.port, saved.machine.printQueues[PRINTER].port);
  assert.equal(queue.driver, saved.machine.printQueues[PRINTER].driver);
  assert.equal(queue.media, saved.machine.printQueues[PRINTER].media);
  assert.equal(queue.jobs.length, 0, 'what the attempt printed stays printed');
  same(plain(tab.run('hdProvePackage()')).machine, saved.machine, 'a resubmission sends the same queue summary');
  // A test page printed and the rest cancelled: nothing is invented as printed.
  const cancelled = plain(lastWork);
  cancelled.machine.printQueues[PRINTER] = { ...saved.machine.printQueues[PRINTER], queued: 0, printed: 1, testPages: 1 };
  const third = sim('its-02', 'stu-prefill-cancelled');
  assert.equal(third.run('hdProvePrefill')(cancelled), true);
  same(plain(third.run('hdProvePackage()')).machine.printQueues[PRINTER], cancelled.machine.printQueues[PRINTER], 'only what was printed');
  same(tab.prove().fields, saved.fields, 'every field');
  // Values the computer no longer offers are not taken.
  const stale = plain(lastWork);
  stale.machine.printQueues[PRINTER] = { port: 'RETIRED-PORT', driver: 'Retired driver', media: 'Retired size' };
  const other = sim('its-02', 'stu-prefill-stale');
  assert.equal(other.run('hdProvePrefill')(stale), true);
  const kept = other.machine(MAIN).printQueues[PRINTER];
  same([kept.port, kept.driver, kept.media], [QUEUE.port, QUEUE.driver, QUEUE.media]);
}

const LONG = {
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m04-1', lab_key: LAB, student_id: '9900000004-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  assert.match(html, /data-its-prove-simulator/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>'), 'never raw');
  ['Work note', 'Reply to the user', 'Commands run', 'Actions in the simulator', 'Print queues at submit'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['Key finding', 'KB draft', 'Warm handoff', 'Nothing written'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  saved.commands.forEach((c) => assert.ok(html.includes(pesc(`${c.command} (on ${c.computer})`)), 'every command in full'));
  const q = saved.machine.printQueues[PRINTER];
  assert.ok(html.includes(pesc(`${PRINTER}: port ${q.port}, driver ${q.driver}, paper ${q.media}`)), 'the queue at submit');
  // Module 3's panel is unchanged.
  const m3 = { id: 'att-m03-9', lab_key: 'lab-its-11-prove-it', student_id: '9900000003-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70,
    result: { ...saved, labKey: 'lab-its-11-prove-it', keyFinding: 'Synthetic E.', kbDraft: 'Synthetic F.' } };
  const m3Html = prun('itsProveReviewPanel')(m3);
  ['Key finding', 'Handoff note', 'Customer update', 'KB draft', 'Warm handoff'].forEach((heading) => assert.ok(m3Html.includes(heading), `Module 3: ${heading}`));
  assert.doesNotMatch(m3Html, /data-its-prove-simulator|Commands run/);
  // The rubric: five competencies, 100 points.
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  same(rubric.competencies.map((c) => c.points), [11, 23, 22, 22, 22]);
}

/* ------------------------------------------------------------ Module 4 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-02'].number]`);
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

async function testModuleFourPageSubmit(work) {
  freshDb();
  const user = hdUser('m04prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its02-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  const link = /data-its02-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-02&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-02', nonce: 'm04prove-1234', student: studentOf(user), work };
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
  same(stored, clean(work, 'its-02', LAB).work, 'the cleaned work');
  // Submitted: the card opens nothing more.
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its02-prove-it"'));
  assert.doesNotMatch(done.slice(0, done.indexOf('</section>')), /data-its02-prove-launch/);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testCommandsReadOnlyTheirComputer, testReplyArrivesAfterAPrint]) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let work = null;
  try { work = testPackageCarriesASmallSummary(); report('testPackageCarriesASmallSummary'); } catch (error) { report('testPackageCarriesASmallSummary', error); }
  let saved = null;
  if (work) {
    try { saved = testPortalKeepsTheWork(work); report('testPortalKeepsTheWork'); } catch (error) { report('testPortalKeepsTheWork', error); }
  }
  if (saved) {
    for (const test of [testPrefillPutsTheQueueBack, testReviewPanel]) {
      try { test(saved); report(test.name); } catch (error) { report(test.name, error); }
    }
  }
  if (work) {
    try { await testModuleFourPageSubmit(work); report('testModuleFourPageSubmit'); } catch (error) { report('testModuleFourPageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m04-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m04-prove: all ${passed} passed`);
})();

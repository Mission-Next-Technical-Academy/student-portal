// Module 7 (key its-05) Prove It: one ticket on Module 3's one-ticket form
// with a key-finding note and a one-question call with the user, worked on the
// read-only server screens of Module 7's console parts (ui/helpdesk.js,
// HD_PROVE_SHIFTS['its-05']), and the course page's side of it
// (portal/it-support-shared.js: the cleaner and the review panel;
// portal/it-support-module-05.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, no practice wording on the server screens.
//   - The call: one question only; it gets its reply and is recorded once as
//     caller_question; nothing is offered after it or after submit; Module 6's
//     chat still offers every question.
//   - Each server screen and its typed line record the same source, so a
//     screen and a command earn alike; every share, group, user and change
//     records its own source.
//   - Nothing on a server can change: no permission control on any screen, and
//     a typed permission line is recorded as typed and changes nothing.
//   - The package carries no computer summary; the course page keeps the work;
//     the instructor reads the writing in full, the question asked, the screens
//     opened and every command, with no computer-at-submit section.
//   - The page submits through recordLabAttempt; a failed write saves nothing.
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
const LAB = 'lab-its-05-prove-it';
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
    ps: (command) => {
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
  };
}
const SHIFT = sim('its-05', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-05']))");
const SPEC = SHIFT.tickets[0];
const QUESTIONS = SPEC.console.caller.questions;
const FILE_SERVER = Object.keys(SHIFT.servers).find((name) => (SHIFT.servers[name].shares || []).length);
const SHARES = SHIFT.servers[FILE_SERVER].shares.map((share) => share.name);
const REQUESTER = sim('its-05', 'probe2').run(`HD_USERS.find((u) => u.name === ${j(SPEC.requester)}).id`);
const USERS = [REQUESTER, ...SHIFT.users.map((user) => user.id)];
const GROUPS = Object.keys(SHIFT.directory.groups);
const CHANGES = SHIFT.changes.map((change) => change.number);
const CLASSES = sim('its-05', 'probe3').run('HD_PROVE_CLASSES.slice()');
const TEAMS = sim('its-05', 'probe4').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const WRITING = { keyFinding: 'Synthetic finding E: three made-up facts linked.', resolutionNote: 'Synthetic note A: Reported / Tried / Result / Next action, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const sources = (tab) => tab.prove().opened.filter((s) => !s.startsWith('screen:') && !s.startsWith('computer:'));
const ask = (tab, id) => tab.run(`hdChatAsk(hdState.tickets[0].id, ${j(id)})`);
const openShare = (tab, share, tabName) => { tab.run(`hdServerOpen(${j(FILE_SERVER)}, '#/helpdesk/file-server'); hdFileSet({ share:${j(share)}, tab:${j(tabName)} })`); return tab.view('helpdesk/file-server'); };
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[1]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '2');
  tab.ctx.hdProveSetField('urgency', '3');
  tab.ctx.hdProveSetField('group', TEAMS[1]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Resolve');
  [SPEC.pathPool[0].id, SPEC.pathPool[5].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  Object.entries(WRITING).forEach(([field, text]) => tab.ctx.hdProveText(field, text));
  tab.run('hdProveSetCode(hdState.tickets[0].id, HD_PROVE_RESOLUTION_CODES[0]); hdProveClose(hdState.tickets[0].id)');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m05', step: 2 })]]);
  const tab = sim('its-05', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-05-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 45, 'the coaching time box (decision 1)');
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.prove().keyFinding, '', 'the key-finding box starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(SPEC.id), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command', 'data-hd-servers-card'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.match(html, /data-hd-prove-writing="keyFinding"/, 'the key-finding box');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, SPEC.pathPool.length, 'step ids are unique');
  assert.ok(SPEC.pathPool.length >= 12, 'wrong-direction steps beside the checks');
  assert.ok(SPEC.pathPool.every((step) => !/CHG-|GG-|NS-/.test(step.text)), 'no step names a change, a group or a server');
  assert.ok(SHIFT.changes.length >= 3 && GROUPS.length >= 4 && SHARES.length >= 4, 'several changes, groups and shares, so none stands out by being alone');
  // Every Active Directory screen is read-only here.
  tab.run(`hdOpenUser(${j(REQUESTER)})`);
  assert.doesNotMatch(tab.view('helpdesk/active-directory'), /hdAdAction|Reset password|Add approved group/);
  // No Practice wording on the server screens.
  tab.run(`hdServerOpen(${j(FILE_SERVER)})`);
  assert.doesNotMatch(tab.view('helpdesk/server-manager'), /callout info|runbook/);
  assert.doesNotMatch(openShare(tab, SHARES[0], 'effective'), /more restrictive|actually do/);
  assert.doesNotMatch(tab.view('helpdesk/change-log'), /lines up with a symptom/);
  assert.ok(!tab.run('hdKbArticles().some((a) => a.practiceOnly)'), 'no practice-only article in a Prove It');
  assert.deepEqual([...tab.toasts], [], 'no toast');
}

function testOneQuestion() {
  const tab = sim('its-05', 'stu-call');
  assert.equal(SPEC.console.caller.limit, 1);
  assert.ok(QUESTIONS.length >= 4 && QUESTIONS.every((q) => /^q\d+$/.test(q.id)), 'several questions with neutral ids');
  let html = ticketView(tab);
  QUESTIONS.forEach((q) => assert.ok(html.includes(`hdChatAsk('${SPEC.id}','${q.id}')`), `question ${q.id} offered`));
  assert.match(html, /data-hd-chat-limit/, 'the card says one question');
  ask(tab, QUESTIONS[3].id);
  ask(tab, QUESTIONS[0].id);
  const asked = tab.prove().events.filter((e) => e.type === 'caller_question');
  same(asked.map((e) => [e.value, e.label]), [[QUESTIONS[3].id, QUESTIONS[3].text]], 'one question, by id and text');
  html = ticketView(tab);
  assert.ok(html.includes(tab.run('hdEsc')(QUESTIONS[3].reply)), 'the reply shows');
  assert.ok(!html.includes('hdChatAsk('), 'nothing is offered after the one question');
  assert.doesNotMatch(html, /data-hd-chat-limit/);
  // Submitted: nothing is offered or recorded.
  const locked = sim('its-05', 'stu-call-locked');
  locked.run("hdProveServer.status = 'waiting'");
  ask(locked, QUESTIONS[1].id);
  assert.equal(locked.prove().events.filter((e) => e.type === 'caller_question').length, 0);
  // Module 6's chat has no limit: every other question stays offered.
  const m6 = sim('its-07', 'stu-m6-chat');
  const m6Questions = plain(m6.run('hdConsole(hdState.tickets[0]).caller.questions'));
  assert.equal(plain(m6.run('hdConsole(hdState.tickets[0]).caller')).limit, undefined);
  ask(m6, m6Questions[0].id);
  const m6Html = ticketView(m6);
  m6Questions.slice(1).forEach((q) => assert.ok(m6Html.includes(`hdChatAsk('`) && m6Html.includes(`','${q.id}')`), `Module 6 still offers ${q.id}`));
  assert.doesNotMatch(m6Html, /data-hd-chat-limit/);
}

function testScreensAndCommandsRecordTheSameSource() {
  const screen = sim('its-05', 'stu-screens');
  screen.run(`hdServerOpen(${j(FILE_SERVER)})`); screen.view('helpdesk/server-manager');
  screen.run(`hdServerOpen(${j(FILE_SERVER)}, '#/helpdesk/server-services')`); screen.view('helpdesk/server-services');
  SHARES.forEach((share) => { openShare(screen, share, 'share'); openShare(screen, share, 'ntfs'); });
  USERS.forEach((user) => { screen.run(`hdFileSet({ share:${j(SHARES[SHARES.length - 1])}, tab:'effective' }); hdFileSet({ user:${j(user)} })`); assert.match(screen.view('helpdesk/file-server'), /data-hd-effective-access=/, `effective access for ${user}`); });
  screen.view('helpdesk/change-log');
  CHANGES.forEach((number) => { screen.run(`hdChangeLogOpen(${j(number)})`); assert.match(screen.view('helpdesk/change-log'), new RegExp(`data-hd-change-detail="${number}"`)); });
  USERS.forEach((user) => { screen.run(`hdOpenUser(${j(user)})`); screen.view('helpdesk/active-directory'); });
  GROUPS.forEach((group) => { screen.run(`hdSetAdTab('groups'); hdAdGroupOpen(${j(group)})`); assert.match(screen.view('helpdesk/active-directory'), new RegExp(`data-hd-group-members="${group}"`)); });
  const opened = sources(screen);
  [`server:${FILE_SERVER}`, `services:${FILE_SERVER}`, 'change-log',
    ...SHARES.flatMap((share) => [`file-share:${FILE_SERVER}:${share}:share`, `file-share:${FILE_SERVER}:${share}:ntfs`]),
    ...USERS.flatMap((user) => [`effective-access:${FILE_SERVER}:${SHARES[SHARES.length - 1]}:${user}`, `ad-user:${user}`, `ad-user-groups:${user}`]),
    ...CHANGES.map((number) => `change:${number}`), ...GROUPS.map((group) => `ad-group:${group}`)]
    .forEach((source) => assert.ok(opened.includes(source), source));
  assert.equal(opened.length, new Set(opened).size, 'each source once');
  // The same evidence typed: each line records the source its screen records.
  const typed = sim('its-05', 'stu-typed');
  const requester = SHIFT.users.length ? sim('its-05', 'probe5').run(`HD_USERS.find((u) => u.id === ${j(REQUESTER)}).username`) : '';
  typed.ps(`Test-NetConnection ${FILE_SERVER} -Port 445`);
  typed.ps(`Get-Service -ComputerName ${FILE_SERVER}`);
  SHARES.forEach((share) => typed.ps(`Get-SmbShareAccess -Name ${share} -CimSession ${FILE_SERVER}`));
  GROUPS.forEach((group) => typed.ps(`Get-ADGroupMember ${group}`));
  typed.ps(`Get-ADUser ${requester} -Properties LockedOut, MemberOf`);
  const fromTyping = sources(typed);
  [`port:${FILE_SERVER}:445`, `services:${FILE_SERVER}`, ...SHARES.map((share) => `file-share:${FILE_SERVER}:${share}:share`),
    ...GROUPS.map((group) => `ad-group:${group}`), `ad-user:${REQUESTER}`, `ad-user-groups:${REQUESTER}`]
    .forEach((source) => assert.ok(fromTyping.includes(source), `typed: ${source}`));
  const commands = typed.prove().events.filter((e) => e.type === 'command_run');
  assert.equal(commands.length, 3 + SHARES.length + GROUPS.length, 'each command is recorded');
  // A line aimed at something that isn't there records nothing.
  const wrong = sim('its-05', 'stu-wrong');
  wrong.ps(`Get-SmbShareAccess -Name Made-up-share -CimSession ${FILE_SERVER}`);
  wrong.ps('Get-ADGroupMember GG-Made-Up');
  same(sources(wrong), [], 'no source for a share or group that does not exist');
}

function testNothingOnAServerChanges() {
  const tab = sim('its-05', 'stu-readonly');
  const pages = [];
  tab.run(`hdServerOpen(${j(FILE_SERVER)})`); pages.push(tab.view('helpdesk/server-manager'));
  tab.run(`hdServerOpen(${j(FILE_SERVER)}, '#/helpdesk/server-services')`); pages.push(tab.view('helpdesk/server-services'));
  SHARES.forEach((share) => ['share', 'ntfs', 'effective'].forEach((name) => pages.push(openShare(tab, share, name))));
  pages.forEach((html, i) => assert.doesNotMatch(html, /data-hd-service-start|<button[^>]*>\s*((Grant|Revoke|Add|Edit|Remove|Apply|Save)\b|Change(?! log))/, `page ${i}: no control changes anything`));
  const before = j(plain(tab.run(`hdServerState(${j(FILE_SERVER)}).shares`)));
  [`Grant-SmbShareAccess -Name ${SHARES[0]} -AccountName Made-Up-Group -AccessRight Full -Force`, `icacls D:\\Shares\\${SHARES[0]} /grant Made-Up-Group:M`].forEach((line) => {
    tab.ps(line);
    assert.ok(tab.prove().events.some((e) => e.type === 'command_run' && e.command === line), `${line}: recorded as typed`);
  });
  assert.equal(j(plain(tab.run(`hdServerState(${j(FILE_SERVER)}).shares`))), before, 'no permission changed');
  assert.deepEqual([...tab.toasts], [], 'no warning or toast');
}

function testPackage() {
  const tab = sim('its-05', 'stu-package');
  fill(tab);
  assert.ok(tab.run('hdProveMissing()').includes('key finding') === false, 'the key finding is filled');
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const missing = sim('its-05', 'stu-package-missing');
  fill(missing);
  missing.ctx.hdProveText('keyFinding', '');
  assert.ok(missing.run('hdProveMissing()').includes('key finding'), 'Submit asks for the key finding');
  const work = plain(tab.run('hdProvePackage()'));
  same(work.machine, {}, 'no computer summary: nothing on a computer changes');
  assert.equal(work.keyFinding, WRITING.keyFinding);
  assert.equal(work.labKey, LAB);
  assert.equal(work.moduleKey, 'its-05');
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function sampleWork() {
  const tab = sim('its-05', 'stu-sample');
  fill(tab);
  ask(tab, QUESTIONS[1].id);
  tab.run(`hdServerOpen(${j(FILE_SERVER)})`); tab.view('helpdesk/server-manager');
  tab.view('helpdesk/change-log');
  CHANGES.forEach((number) => { tab.run(`hdChangeLogOpen(${j(number)})`); tab.view('helpdesk/change-log'); });
  SHARES.forEach((share) => openShare(tab, share, 'share'));
  tab.ps(`Test-NetConnection ${FILE_SERVER} -Port 445`);
  return plain(tab.run('hdProvePackage()'));
}

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-05', LAB);
  assert.equal(reason, undefined);
  same(saved.machine, {}, 'no computer summary');
  assert.equal(saved.fields.priority, prun('ITS_PROVE_MATRIX')['2']['3'], 'Priority is the course page\'s own, from Impact and Urgency');
  assert.equal(saved.keyFinding, WRITING.keyFinding);
  same(saved.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.label]), [[QUESTIONS[1].id, QUESTIONS[1].text]], 'the question is kept');
  // Every recorded source survives the cleaner unchanged.
  same(saved.events.filter((e) => e.type === 'evidence_opened').map((e) => e.source), work.events.filter((e) => e.type === 'evidence_opened').map((e) => e.source), 'the sources are kept');
  assert.ok(saved.commands.some((c) => /^Test-NetConnection/.test(c.command)), 'the command is kept');
  assert.equal(clean({ ...work, keyFinding: '' }, 'its-05', LAB).reason, 'invalid', 'the key finding is required');
  assert.equal(clean({ ...work, keyFinding: 'x'.repeat(601) }, 'its-05', LAB).reason, 'too-large', 'and refused above 600, never cut');
  assert.equal(clean({ ...work, labKey: 'lab-its-07-prove-it', rubricVersion: 'hdesk-its-07-prove-v1' }, 'its-05', LAB).reason, 'invalid', 'refused under another lab key');
  return saved;
}

const LONG = {
  keyFinding: 'Synthetic finding F: <b>made up</b> & linked.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m07-1', lab_key: LAB, student_id: '9900000007-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  assert.match(html, /data-its-prove-simulator/);
  assert.match(html, /data-its-prove-questions/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>') && !html.includes('<b>made up</b>'), 'never raw');
  ['Key finding', 'Work note', 'Reply to the user', 'Questions asked in the chat', 'Commands run', 'Earlier calls and evidence cards opened'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['KB draft', 'Warm handoff', 'Print queues at submit', 'The laptop at submit', 'Handoff note'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  assert.ok(html.includes(pesc(QUESTIONS[1].text)), 'the question asked');
  assert.ok(html.includes(pesc(`Test-NetConnection ${FILE_SERVER} -Port 445`)), 'the command in full');
  saved.events.filter((e) => e.type === 'evidence_opened' && e.label).forEach((e) => assert.ok(html.includes(pesc(e.label)), `opened: ${e.label}`));
  // Module 4's panel still shows its print queues.
  const m4 = { id: 'att-m04-9', lab_key: 'lab-its-02-prove-it', student_id: '9900000004-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70,
    result: { ...saved, labKey: 'lab-its-02-prove-it', machine: { printQueues: { 'Made-up printer': { port: 'P1', driver: 'D1', media: 'Letter', queued: 0, printed: 1, testPages: 1 } } } } };
  assert.match(prun('itsProveReviewPanel')(m4), /Print queues at submit/);
  // The rubric: five competencies, 100 points, the key finding required.
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-05-prove-v1');
  assert.equal(rubric.moduleKey, 'its-05');
  same(rubric.competencies.map((c) => c.points), [17, 28, 16, 28, 11]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  same(rubric.writing, { keyFinding: 600 });
  assert.equal(rubric.matrixFields, true);
  assert.equal(rubric.simulatorWork, true);
  assert.equal(rubric.machineSummary, false);
}

/* ------------------------------------------------------------ Module 7 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-05'].number]`);
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

async function testModuleSevenPageSubmit(work) {
  freshDb();
  const user = hdUser('m07prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its05-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  assert.doesNotMatch(card, /Opens soon/);
  assert.match(card, /You don’t need to type any command/);
  assert.match(card, /45 minutes/);
  const link = /data-its05-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-05&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  // Lab 7.1 is Practice It now.
  const lab1 = html.slice(html.indexOf('id="its05-lab-7-1"'), html.indexOf('</section>', html.indexOf('id="its05-lab-7-1"')));
  assert.match(lab1, /Practice It · coached/);
  assert.match(lab1, /Practice: not graded/);
  assert.doesNotMatch(lab1, /instructor reviews/i);
  assert.equal(prun("LABS.find((l) => l.key === 'lab-its-05-server-ad').phase"), 'practice');
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-05', nonce: 'm07prove-1234', student: studentOf(user), work };
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
  same(stored, clean(work, 'its-05', LAB).work, 'the cleaned work');
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its05-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its05-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m07-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testOneQuestion, testScreensAndCommandsRecordTheSameSource, testNothingOnAServerChanges, testPackage, testCiRunsThisFile]) {
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
    try { await testModuleSevenPageSubmit(work); report('testModuleSevenPageSubmit'); } catch (error) { report('testModuleSevenPageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m07-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m07-prove: all ${passed} passed`);
})();

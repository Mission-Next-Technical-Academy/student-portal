// Help Desk Module 1's Prove It Submit: the real simulator code and the real
// portal code joined by a stand-in for the browser's messages, over a stand-in
// database that keeps the one-waiting-attempt rule. The database's own rules
// are tested in supabase/tests/hdesk_prove_submit.sql.
//
//   - Submit turns on from completeness alone and never says what is right.
//   - saved: true comes only after the server confirms the row; no score.
//   - On reload the lock comes from the server's attempt, never the browser.
//   - Every failure keeps the work, leaves Submit available and shows no success.
//   - A returned attempt reopens for one resubmission; earlier work and notes stay.
//   - Instructors read the writing and choices as plain text under PROVE IT.
//   - Module 1's page has the launch card, no generic box and no lock.
//
// Structure only: every choice here is arbitrary, and nothing says which is right.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const LAB = 'lab-its-01-prove-it';
const SIM_ORIGIN = 'http://127.0.0.1:8767';
const PORTAL_ORIGIN = 'http://127.0.0.1:8768';
const UI = path.join(__dirname, '..', 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
let signedIn = null;
portal.currentUser = async () => signedIn;
const studentOf = (user) => prun('LabRuntime').anonymousStudentId(user);
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const moduleLab = (n) => prun(`MODULE_LABS['it-support/${n}']`);

const hdUser = (extra = {}) => ({
  userId: 'user-hdesk', email: 'hdesk@test.invalid', trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {}, ...extra,
});

// The stand-in database: lab_attempts newest first by insertion, with the
// one-waiting rule. `failInsert` / `holdInsert` / `failRead` script a failure.
let db;
function freshDb() {
  db = { attempts: [], feedback: [], failInsert: null, failRead: false, holdInsert: null, landThenFail: false };
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => {
    if (call.table === 'lab_attempt_feedback') return { data: db.feedback.filter((row) => row.lab_attempt_id === call.filters.lab_attempt_id), error: null };
    if (call.table !== 'lab_attempts') return { data: [], error: null };
    if (call.op === 'select') {
      if (db.failRead) return { data: null, error: { message: 'network' } };
      return { data: db.attempts.filter((row) => row.lab_key === call.filters.lab_key).slice().reverse().slice(0, 1), error: null };
    }
    const insert = () => {
      if (db.failInsert) return { data: null, error: { message: db.failInsert } };
      const latest = db.attempts.filter((row) => row.lab_key === call.payload.lab_key).pop();
      if (latest && (!latest.reviewed_at || !latest.redo_requested)) return { data: null, error: { code: 'P0001', message: 'refused' } };
      db.attempts.push({ id: `row-${db.attempts.length + 1}`, reviewed_at: null, redo_requested: false, superseded_at: null, ...call.payload });
      return { data: null, error: db.landThenFail ? { message: 'reply lost' } : null };
    };
    return db.holdInsert ? db.holdInsert.then(insert) : insert();
  };
}
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setTimeout(resolve, 0)); };

/* --------------------------------------------------------------- simulator */
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  return { id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {} };
}

// A tab that the portal opened: its opener delivers messages to the Module 1
// handler, and replies come back from that opener and the portal's origin.
function bridge() {
  const link = { closed: false, tab: null, sent: [], focus() {},
    postMessage(data, origin) {
      link.sent.push({ data: JSON.parse(JSON.stringify(data)), origin });
      const source = { postMessage: (reply, target) => { assert.equal(target, SIM_ORIGIN); link.tab.deliver({ data: JSON.parse(JSON.stringify(reply)), source: link, origin: PORTAL_ORIGIN }); } };
      moduleLab(1).onMessage({ data: JSON.parse(JSON.stringify(data)), origin: SIM_ORIGIN, source });
    } };
  return link;
}

function sim({ student, opener = null, local = store() }) {
  const u = new URL(`${SIM_ORIGIN}/?prove=its-01&student=${student}#/helpdesk/ticket`);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const listeners = new Set();
  const timers = new Map();
  let nextTimer = 1;
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location,
    document: { readyState: 'loading', body, addEventListener() {}, getElementById: (id) => byId.get(id) || null, createElement: () => element(''), querySelector: () => null, querySelectorAll: () => [] },
    history: { state: null, replaceState() {} },
    localStorage: local, sessionStorage: store(),
    setTimeout: (fn) => { timers.set(nextTimer, fn); nextTimer += 1; return nextTimer - 1; }, clearTimeout: (id) => timers.delete(id),
    setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener: (type, fn) => { if (type === 'message') listeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') listeners.delete(fn); },
    toast() {}, render: () => {},
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = () => {};
  const tab = {
    ctx, local, opener, byId, timers,
    run: (code) => vm.runInContext(code, ctx),
    deliver: (event) => [...listeners].forEach((fn) => fn(event)),
    view: () => tab.run("VIEWS['helpdesk/ticket']()"),
    submitState: () => JSON.parse(JSON.stringify(tab.run('hdProveSubmitState()'))),
    status: () => tab.run('hdProveServer.status'),
    fireTimers: () => { [...timers.values()].forEach((fn) => fn()); timers.clear(); },
  };
  if (opener) opener.tab = tab;
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  return tab;
}

const hasKey = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// Fills every required part with arbitrary values.
function fill(tab, skip = []) {
  const ticket = tab.run('hdState.tickets[0]');
  const parts = {
    category: () => tab.run(`hdProveSetField('category', ${JSON.stringify(ticket.categoryOptions[0])})`),
    type: () => tab.run(`hdProveSetField('type', ${JSON.stringify(ticket.typeOptions[0])})`),
    priority: () => tab.run("hdProveSetField('priority', 'P4')"),
    diagnosis: () => tab.run(`hdProveChoose('diagnosis', ${JSON.stringify(ticket.diagnosisOptions[0])})`),
    decision: () => tab.run("hdProveChoose('decision', 'Escalate')"),
    resolutionNote: () => tab.run("hdProveText('resolutionNote', 'Line one.\\n\\nLine <two>.')"),
    userReply: () => tab.run("hdProveText('userReply', 'Hello Evan.')"),
  };
  Object.keys(parts).filter((name) => !skip.includes(name)).forEach((name) => parts[name]());
  return parts;
}
const FEEDBACK_WORDS = /\b(correct|incorrect|right|wrong|expected|score|points?|pass(ed)?|fail(ed)?|answer)\b|[✓✗⚠✔✘]/i;

async function openTab(student = null, opts = {}) {
  const opener = opts.noOpener ? null : bridge();
  const tab = sim({ student: student || studentOf(signedIn), opener, local: opts.local || store() });
  await flush();
  return tab;
}
function resetWorld(user = hdUser()) { freshDb(); signedIn = user; return user; }
function assertWorkKept(tab) {
  assert.equal(tab.run('hdState.prove.userReply'), 'Hello Evan.');
  assert.ok(tab.local.getItem(`defender-lab.helpdesk.prove.v1.its-01.${tab.run('HD_PROVE.student')}`).includes('Hello Evan.'), 'still saved in this browser');
}
function assertHonestFailure(tab, notice) {
  assert.equal(tab.run('hdProveLocked()'), false, 'not locked');
  const state = tab.submitState();
  assert.equal(state.enabled, true, 'Submit stays available');
  assert.match(state.note, notice);
  assert.doesNotMatch(tab.view(), /Submitted for faculty review<\/strong>/, 'no fake success');
  assertWorkKept(tab);
}

/* ------------------------------------------------------------------- tests */

async function testSubmitTurnsOnFromCompletenessOnly() {
  resetWorld();
  const tab = await openTab();
  assert.equal(tab.status(), 'not_submitted');
  let state = tab.submitState();
  assert.equal(state.enabled, false);
  assert.equal(state.note, 'Still needed: category, type, priority, diagnosis, decision, resolution note, reply to the user.');
  fill(tab);
  state = tab.submitState();
  assert.equal(state.enabled, true, 'steps are not required');
  assert.equal(state.note, '');
  // Clearing any one part turns it off and names only that part.
  tab.run("hdProveText('userReply', '   ')");
  assert.equal(tab.submitState().enabled, false);
  assert.equal(tab.submitState().note, 'Still needed: reply to the user.');
  assert.doesNotMatch(tab.submitState().note, FEEDBACK_WORDS);
  // Any other value of every field gives exactly the same answer.
  const ticket = tab.run('hdState.tickets[0]');
  tab.run("hdProveText('userReply', 'x')");
  ticket.diagnosisOptions.forEach((option) => {
    tab.run(`hdProveChoose('diagnosis', ${JSON.stringify(option)})`);
    ['Resolve', 'Escalate'].forEach((decision) => {
      tab.run(`hdProveChoose('decision', '${decision}')`);
      assert.deepEqual(tab.submitState(), { enabled: true, label: 'Submit for faculty review', note: '' });
    });
  });
  // The button in the page follows as the student types (no re-render).
  const button = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const note = {};
  tab.byId.set('hd-prove-submit', button);
  tab.byId.set('hd-prove-submit-note', note);
  tab.run("hdProveText('userReply', '')");
  assert.equal(button.disabled, true);
  assert.match(button.attrs.style, /cursor:not-allowed/);
  assert.equal(note.textContent, 'Still needed: reply to the user.');
  tab.run("hdProveText('userReply', 'Back again')");
  assert.equal(button.disabled, false);
  assert.equal(button.attrs.style, '');
  // Pressing it with a part missing sends nothing.
  tab.run("hdProveText('userReply', ''); hdProveSubmit()");
  assert.ok(!tab.opener.sent.some((m) => m.data.type === 'mnt-prove-submit'));
}

async function testConfirmedSaveOnlyAfterTheServerHasTheRow() {
  const user = resetWorld();
  const tab = await openTab();
  fill(tab);
  let release;
  db.holdInsert = new Promise((resolve) => { release = resolve; });
  tab.run('hdProveSubmit()');
  await flush();
  assert.equal(tab.run('hdProveLocked()'), false, 'nothing locks while the insert is unanswered');
  assert.equal(tab.submitState().enabled, false, 'no second press while sending');
  assert.equal(tab.submitState().note, 'Sending your work…');
  assert.equal(db.attempts.length, 0);
  release();
  await flush();

  assert.equal(db.attempts.length, 1);
  const row = db.attempts[0];
  assert.equal(row.lab_key, LAB);
  assert.equal(row.user_id, user.userId);
  assert.equal(row.state, 'complete', 'the completion view counts only complete');
  assert.equal(row.score, null, 'no automated score');
  assert.equal(row.rubric_version, 'hdesk-its-01-prove-v1');
  assert.equal(row.scoring_engine_version, 'instructor-review-v1');
  assert.equal(row.result.kind, 'hdesk-prove');
  assert.equal(row.result.userReply, 'Hello Evan.');
  assert.equal(row.result.resolutionNote, 'Line one.\n\nLine <two>.', 'writing is stored exactly');
  ['score', 'critical_errors', 'breakdown', 'feedback'].forEach((key) => assert.ok(!hasKey(row.result, key), `no ${key} in the result`));

  assert.equal(tab.run('hdProveLocked()'), true);
  const html = tab.view();
  assert.match(html, /Submitted for faculty review/);
  assert.doesNotMatch(html, /id="hd-prove-submit"/);
  assert.doesNotMatch(html, /\b(score|correct|incorrect|expected)\b|[✓✗⚠✔✘]/i);
  // The portal's copy shows it waiting; nothing counts it as complete.
  assert.equal(prun('itsLabStatus')(user, LAB), 'waiting');
  assert.notEqual(user.remoteVerifiedModuleProgress['its-01'], true);
  assert.ok(!prun('loadModuleEngagement')(user).completedLabs.some((id) => id.includes(LAB)), 'not marked complete in the browser');
  assert.equal(prun('moduleCardState')(HD, 'its-01', user, true).state, 'awaiting_approval');
}

async function testUnsentWorkNoteTravelsWithTheSubmit() {
  resetWorld();
  const tab = await openTab();
  fill(tab);
  const note = { value: 'Typed but never added.' };
  tab.byId.set('hd-note-input', note);
  tab.run('hdProveSubmit()');
  await flush();
  assert.deepEqual([...db.attempts[0].result.workNotes], ['Typed but never added.']);
}

async function testReloadTakesTheLockFromTheServer() {
  const user = resetWorld();
  const local = store();
  const tab = await openTab(null, { local });
  fill(tab);
  // A browser copy alone never locks: this attempt isn't on the server.
  const unsent = await openTab(null, { local });
  assert.equal(unsent.status(), 'not_submitted');
  assert.equal(unsent.run('hdProveLocked()'), false);
  // Even a leftover browser flag can't lock it.
  unsent.run("hdState.prove.submittedAt = '2026-10-30T12:00:00Z'");
  assert.equal(unsent.run('hdProveLocked()'), false);

  tab.run('hdProveSubmit()');
  await flush();
  // Reload in this browser, then in a browser with no saved work.
  for (const storage of [local, store()]) {
    const reloaded = await openTab(null, { local: storage });
    assert.equal(reloaded.status(), 'waiting');
    assert.equal(reloaded.run('hdProveLocked()'), true);
    assert.match(reloaded.view(), /Submitted for faculty review/);
  }
  // Until the answer arrives, Submit waits.
  const opener = bridge();
  opener.postMessage = () => {};
  const asking = sim({ student: studentOf(user), opener });
  assert.equal(asking.status(), 'checking');
  assert.equal(asking.submitState().enabled, false);
  assert.equal(asking.submitState().note, 'Checking your attempt…');
  asking.fireTimers();
  assert.equal(asking.status(), 'unknown');
  assert.equal(asking.run('hdProveLocked()'), false);
}

async function testFailuresKeepWorkAndShowNoSuccess() {
  // The portal tab was closed.
  let user = resetWorld();
  let tab = await openTab(null, { noOpener: true });
  fill(tab);
  assert.match(tab.submitState().note, /Your course page is closed.*Reopen the Prove It from your course page/);
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /Your course page is closed.*Reopen the Prove It from your course page/);
  assert.equal(db.attempts.length, 0);

  // Closed after opening.
  resetWorld();
  tab = await openTab();
  fill(tab);
  tab.opener.closed = true;
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /Your course page is closed/);

  // Signed out.
  resetWorld();
  tab = await openTab();
  fill(tab);
  signedIn = null;
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /signed out on your course page/);
  assert.equal(db.attempts.length, 0);

  // Another student signed in on the shared browser.
  user = resetWorld();
  tab = await openTab();
  fill(tab);
  signedIn = hdUser({ userId: 'user-other', email: 'other@test.invalid' });
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /signed in as a different student/);
  assert.equal(db.attempts.length, 0, 'nothing is saved for the other student');
  signedIn = user;

  // The save failed.
  resetWorld();
  tab = await openTab();
  fill(tab);
  db.failInsert = 'network';
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /wasn.t saved.*Check your connection/);
  assert.equal(db.attempts.length, 0);
  // Fixed: pressing Submit again works.
  db.failInsert = null;
  tab.run('hdProveSubmit()');
  await flush();
  assert.equal(db.attempts.length, 1);
  assert.equal(tab.run('hdProveLocked()'), true);

  // The server can't be read.
  resetWorld();
  tab = await openTab();
  fill(tab);
  db.failRead = true;
  tab.run('hdProveSubmit()');
  await flush();
  assertHonestFailure(tab, /couldn.t reach the server/);

  // No reply at all.
  resetWorld();
  tab = await openTab();
  fill(tab);
  tab.opener.postMessage = () => {};
  tab.run('hdProveSubmit()');
  tab.fireTimers();
  assertHonestFailure(tab, /didn.t confirm/);
}

async function testSimulatorOnlyAcceptsItsOwnReply() {
  resetWorld();
  const opener = bridge();
  const sent = [];
  opener.postMessage = (data) => sent.push(JSON.parse(JSON.stringify(data)));
  const tab = sim({ student: studentOf(signedIn), opener });
  const { nonce, id } = sent[0];
  const good = { type: 'mnt-prove-received', id, nonce, saved: true, status: 'waiting' };
  const cases = [
    { data: { ...good, nonce: 'someone-else' }, source: opener, origin: PORTAL_ORIGIN },
    { data: good, source: opener, origin: 'https://evil.test' },
    { data: good, source: {}, origin: PORTAL_ORIGIN },
    { data: { ...good, type: 'mnt-coach-received' }, source: opener, origin: PORTAL_ORIGIN },
    { data: { ...good, id: 'its-02' }, source: opener, origin: PORTAL_ORIGIN },
  ];
  cases.forEach((event) => { tab.deliver(event); assert.equal(tab.status(), 'checking', 'ignored'); });
  tab.deliver({ data: good, source: opener, origin: PORTAL_ORIGIN });
  assert.equal(tab.status(), 'waiting');
}

// Directly at the portal: what it refuses, and what it never stores.
async function testPortalRefusals() {
  const user = resetWorld();
  const tab = await openTab();
  fill(tab);
  const work = JSON.parse(JSON.stringify(tab.run('hdProvePackage()')));
  const send = async ({ data, origin = SIM_ORIGIN }) => {
    const replies = [];
    await moduleLab(1).onMessage({ data, origin, source: { postMessage: (reply) => replies.push(JSON.parse(JSON.stringify(reply))) } });
    await flush();
    return replies;
  };
  const submit = (overrides = {}, workOverrides = {}) => ({ type: 'mnt-prove-submit', id: 'its-01', nonce: 'abcd1234-efgh', student: studentOf(user), work: { ...work, ...workOverrides }, ...overrides });

  assert.deepEqual(await send({ data: submit(), origin: 'https://evil.test' }), [], 'another origin is ignored');
  for (const nonce of [undefined, '', 'short', 'not a nonce!!', 7]) assert.deepEqual(await send({ data: submit({ nonce }) }), [], 'a bad nonce is ignored');
  assert.deepEqual(await send({ data: submit({ id: 'its-02' }) }), [], "another module's id is ignored");

  const refused = async (message, reason, label) => {
    const replies = await send({ data: message });
    assert.equal(replies.length, 1, label);
    assert.equal(replies[0].saved, false, label);
    assert.equal(replies[0].reason, reason, label);
    assert.equal(replies[0].nonce, message.nonce, label);
    assert.equal(db.attempts.length, 0, `${label}: nothing saved`);
  };
  await refused(submit({ student: 'student-someone' }), 'other-student', 'another student id');
  await refused(submit({ student: undefined }), 'other-student', 'no student id');
  await refused(submit({}, { rubricVersion: 'hdesk-its-01-prove-v0' }), 'invalid', 'unknown rubric version');
  await refused(submit({}, { kind: 'other' }), 'invalid', 'wrong kind');
  await refused(submit({}, { version: 2 }), 'invalid', 'wrong version');
  await refused(submit({}, { labKey: 'lab-its-01-ticket-triage' }), 'invalid', 'another lab');
  await refused(submit({ work: null }), 'invalid', 'no work');
  await refused(submit({}, { fields: 'x' }), 'invalid', 'fields not an object');
  await refused(submit({}, { fields: { ...work.fields, priority: 'P9' } }), 'invalid', 'unknown priority');
  await refused(submit({}, { decision: 'Maybe' }), 'invalid', 'unknown decision');
  await refused(submit({}, { userReply: '   ' }), 'invalid', 'empty reply');
  await refused(submit({}, { diagnosis: 7 }), 'invalid', 'diagnosis not text');
  await refused(submit({}, { steps: ['p1'], stepTexts: [] }), 'invalid', 'steps without text');
  await refused(submit({}, { userReply: 'x'.repeat(4001) }), 'too-large', 'over-long writing is refused, not cut');
  await refused(submit({}, { workNotes: Array(31).fill('note') }), 'too-large', 'too many notes');
  await refused(submit({}, { workNotes: ['x'.repeat(2001)] }), 'too-large', 'an over-long note');

  // Another track never saves, even with its own matching id.
  signedIn = hdUser({ trackCode: 'SOCAN' });
  await refused(submit(), 'other-student', 'not a Help Desk student');
  signedIn = user;

  // Extra fields never reach the row, and logs trim before writing.
  const events = Array.from({ length: 400 }, () => ({ type: 'command_run', at: 'x', command: 'y'.repeat(200), computer: 'z' }));
  const big = await send({ data: submit({}, {
    score: 100, critical_errors: [], reviewed_at: 'now', answerKey: {}, events: [...events, { type: 'made_up', at: 'x' }],
    commands: events.map((e) => ({ command: e.command, computer: e.computer, at: e.at })),
    workNotes: Array(30).fill('n'.repeat(2000)),
  }) });
  assert.equal(big[0].saved, true);
  const { result, score } = db.attempts[0];
  assert.equal(score, null);
  ['score', 'critical_errors', 'reviewed_at', 'answerKey'].forEach((key) => assert.ok(!hasKey(result, key), `${key} is dropped`));
  assert.ok(!result.events.some((e) => e.type === 'made_up'), 'unknown events are dropped');
  assert.equal(result.logTrimmed, true);
  assert.equal(result.workNotes.length, 30, 'the writing stays whole');
  assert.equal(result.workNotes[29].length, 2000);
  assert.ok(JSON.stringify({ ...result, source: undefined }).length <= 96 * 1024);
}

async function testOneWaitingAttempt() {
  // Two tabs: the second is refused, and it locks from the server's answer.
  resetWorld();
  const first = await openTab();
  fill(first);
  const second = await openTab();
  fill(second);
  first.run('hdProveSubmit()');
  await flush();
  second.run('hdProveSubmit()');
  await flush();
  assert.equal(db.attempts.length, 1);
  assert.equal(second.status(), 'waiting');
  assert.equal(second.opener.sent.filter((m) => m.data.type === 'mnt-prove-submit').length, 1);

  // A reply lost after the row landed: not called saved, but the re-read locks it.
  resetWorld();
  const lost = await openTab();
  fill(lost);
  db.landThenFail = true;
  lost.run('hdProveSubmit()');
  await flush();
  assert.equal(db.attempts.length, 1);
  assert.equal(lost.status(), 'waiting');
  assert.equal(lost.run('hdProveLocked()'), true);

  // Approved: nothing more can go in.
  const user = resetWorld();
  db.attempts.push({ id: 'row-1', lab_key: LAB, completed_at: '2026-10-30T10:00:00Z', reviewed_at: '2026-10-30T11:00:00Z', redo_requested: false });
  const done = await openTab();
  assert.equal(done.status(), 'passed');
  assert.match(done.view(), /Reviewed by your instructor/);
  assert.doesNotMatch(done.view(), /Submitted for faculty review|score/i);
  assert.equal(prun('itsLabStatus')(user, LAB), 'passed');
}

async function testReturnedReopensForOneResubmission() {
  const user = resetWorld();
  const local = store();
  const tab = await openTab(null, { local });
  fill(tab);
  tab.run('hdProveSubmit()');
  await flush();
  // The instructor returns it while the course page stays open.
  Object.assign(db.attempts[0], { reviewed_at: '2026-10-30T12:00:00Z', redo_requested: true });
  db.feedback.push({ lab_attempt_id: 'row-1', item_label: 'Overall', comment: 'Say what the check proved.' }, { lab_attempt_id: 'row-1', item_label: 'Empty', comment: '  ' });

  const reopened = await openTab(null, { local });
  assert.equal(reopened.status(), 'returned');
  assert.equal(reopened.run('hdProveLocked()'), false);
  assert.equal(reopened.run('hdState.prove.userReply'), 'Hello Evan.', 'the earlier work is there to change');
  const state = reopened.submitState();
  assert.equal(state.label, 'Resubmit for faculty review');
  assert.match(state.note, /returned this Prove It.*notes are on your course page/);
  assert.doesNotMatch(state.note, FEEDBACK_WORDS);
  // The course page has the notes from the same read, with no sign-in.
  assert.deepEqual(JSON.parse(JSON.stringify(user.openLabRedoFeedbackByLabKey[LAB])), [{ lab_attempt_id: 'row-1', item_label: 'Overall', comment: 'Say what the check proved.' }]);
  assert.equal(user.openLabRedosByModuleKey['its-01'].labKey, LAB);

  reopened.run("hdProveText('userReply', 'Second try.'); hdProveSubmit()");
  await flush();
  assert.equal(db.attempts.length, 2, 'a new row');
  assert.equal(db.attempts[0].redo_requested, true, 'the earlier attempt is kept as it was');
  assert.equal(db.attempts[0].result.userReply, 'Hello Evan.');
  assert.equal(db.feedback.length, 2, "the instructor's notes are kept");
  assert.equal(db.attempts[1].result.userReply, 'Second try.');
  assert.equal(reopened.status(), 'waiting');
  assert.ok(!hasKey(user.openLabRedoFeedbackByLabKey, LAB), 'no stale return notice on the course page');

  // Only one reopens: a third from another tab is refused.
  const again = await openTab(null, { local });
  assert.equal(again.status(), 'waiting');
  again.run("hdProveServer.status = 'returned'; hdProveSubmit()");
  await flush();
  assert.equal(db.attempts.length, 2);
  assert.equal(again.status(), 'waiting');
}

function savedRow(result = {}) {
  return { id: 'row-1', user_id: 'user-hdesk', student_id: '9900000012-HDESK', track_code: 'HDESK', lab_key: LAB, score: null, pass_threshold: 70, completed_at: '2026-10-30T10:00:00Z', result };
}

async function testInstructorReadsPlainText() {
  resetWorld();
  const tab = await openTab();
  fill(tab);
  const ticket = tab.run('hdState.tickets[0]');
  tab.run(`hdProveToggleStep('${ticket.pathPool[0].id}', true)`);
  tab.run("VIEWS['helpdesk/knowledge-base']()");
  tab.byId.set('hd-note-input', { value: 'A work note.' });
  tab.run('hdProveSubmit()');
  await flush();
  const row = { ...savedRow(db.attempts[0].result) };

  const meta = prun('adminGradingLabMeta')(row);
  assert.equal(meta.kind, 'PROVE IT');
  assert.equal(meta.itemName, 'Module 1 · PROVE IT');
  assert.equal(meta.moduleKey, 'its-01');
  assert.equal(prun('adminNeedsInstructorReview')(row), true);
  assert.equal(prun('adminHasSubmissionSheet')(row), false, 'the full sheet is separate work');

  const panel = prun('itsProveReviewPanel')(row);
  assert.match(panel, /Student's written work/);
  assert.match(panel, /whitespace-pre-wrap/, 'paragraphs are kept');
  assert.ok(panel.includes('Line one.\n\nLine &lt;two&gt;.'), 'writing is whole and escaped');
  assert.ok(panel.includes('Hello Evan.'));
  assert.ok(panel.includes('A work note.'));
  assert.ok(panel.includes(tab.run('hdEsc')(ticket.categoryOptions[0])));
  assert.ok(panel.includes('P4'));
  assert.ok(panel.includes('Escalate'));
  assert.ok(panel.includes(tab.run('hdEsc')(ticket.pathPool[0].text)), 'steps as text, not ids');
  assert.ok(panel.includes('Knowledge Base'), 'evidence opened');
  assert.ok(panel.includes('hdesk-its-01-prove-v1'));
  assert.match(panel, /Approve counts as a pass/, 'until the faculty-gate work, instructors are told');
  assert.doesNotMatch(panel, /<script|<two>/);
  // A student's markup never runs.
  const hostile = prun('itsProveReviewPanel')(savedRow({ ...row.result, userReply: '<img src=x onerror=1>', diagnosis: '<b>x</b>', commands: [{ command: '<i>', computer: '<u>' }] }));
  assert.doesNotMatch(hostile, /<img|<b>x|<i>|<u>/);

  // Waiting and graded cards both show it, ahead of the raw debugging result.
  const card = prun('adminAttemptReviewCard')({ lead: row, ids: [row.id], name: meta.itemName, labTitles: [meta.labTitle] }, false);
  assert.ok(card.indexOf('data-its-prove-panel') >= 0);
  assert.ok(card.indexOf('data-its-prove-panel') < card.indexOf('Full raw result'), 'plain text first');
  assert.match(card, /No score/);
  assert.match(card, /admin-grading-approve/);
  assert.match(card, /admin-grading-send-back/);

  // A row that didn't come through Submit is flagged, however it looks.
  assert.match(prun('itsProveReviewPanel')(savedRow({ score: 100 })), /No readable Prove It package/);
  assert.equal(prun('itsProveReviewPanel')({ ...savedRow({ kind: 'hdesk-prove' }), lab_key: 'lab-its-02-vm-build' }), '', 'other labs are untouched');
}

function moduleOneHtml(user) {
  return moduleLab(1).view(user, HD);
}
const proveSection = (html) => { const start = html.indexOf('id="its01-prove-it"'); assert.ok(start >= 0); return html.slice(start, html.indexOf('</section>', start)); };
const railRow = (html) => {
  const match = /<a href="#its01-prove-it" class="munified-row ([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(html);
  assert.ok(match, 'a rail row');
  return { cls: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), locked: /mnav-lock-icon|mnav-chip-locked/.test(match[0]) };
};
const WAITING = { completedAt: '2026-10-01T15:00:00Z', reviewedAt: null, redoRequested: false, supersededAt: null };

async function testModuleOnePage() {
  let user = resetWorld();
  let html = moduleOneHtml(user);
  const card = proveSection(html);
  assert.match(card, /Prove It · Assessment Lab/);
  assert.match(card, /Complete Practice It \(Labs 1\.1 and 1\.2\) first: it prepares you for this\./);
  const link = /data-its01-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link with no Practice It submitted: no lock');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-01&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  assert.doesNotMatch(card, /\b(lock|disabled)\b/i);

  // The generic box is gone, rail entry included; exactly one Assessment Lab.
  assert.doesNotMatch(html, /standard-its-01-assessment-module/);
  assert.doesNotMatch(html, /data-standard-assessment="true"/);
  assert.doesNotMatch(html, /data-module-assessment-form|Assessment Lab submission/i);
  assert.equal((html.match(/<span class="munified-row-label">Assessment Lab<\/span>/g) || []).length, 1);
  assert.equal(railRow(html).locked, false, 'not locked behind Practice It');
  assert.match(html, /id="its01-status">3 labs · 0 passed</);
  // The rail doesn't call the module done with only Practice It passed.
  user = resetWorld(hdUser({ latestLabAttemptByKey: { 'lab-its-01-lms-validation': { ...WAITING, reviewedAt: 'x' }, 'lab-its-01-ticket-triage': { ...WAITING, reviewedAt: 'x' } } }));
  assert.doesNotMatch(moduleOneHtml(user), /100%/);

  // Another Help Desk module keeps its generic box until its own Prove It.
  const three = moduleLab(3).view(hdUser(), HD);
  assert.match(three, /standard-its-03-assessment-module/);

  // Waiting: nothing to open, and the status is the server's.
  user = resetWorld(hdUser({ latestLabAttemptByKey: { [LAB]: WAITING } }));
  html = moduleOneHtml(user);
  assert.doesNotMatch(proveSection(html), /data-its01-prove-launch/);
  assert.match(proveSection(html), /Prove It submitted .*waiting for instructor review/);
  assert.match(railRow(html).text, /In review/);

  // Passed.
  user = resetWorld(hdUser({ latestLabAttemptByKey: { [LAB]: { ...WAITING, reviewedAt: '2026-10-02T15:00:00Z' } } }));
  html = moduleOneHtml(user);
  assert.match(proveSection(html), /Prove It passed/);
  assert.match(railRow(html).cls, /mnav-chip-complete/);

  // Returned: reopen, the notes, and the marked-lab link only with notes.
  const returned = { ...WAITING, reviewedAt: '2026-10-02T15:00:00Z', redoRequested: true };
  user = resetWorld(hdUser({ latestLabAttemptByKey: { [LAB]: returned }, openLabRedoFeedbackByLabKey: { [LAB]: [{ item_label: 'Overall', comment: 'Say what the check proved.' }] } }));
  html = proveSection(moduleOneHtml(user));
  assert.match(html, /Reopen the Prove It/);
  assert.match(html, /Say what the check proved\./);
  assert.match(html, /data-action="open-marked-lab"/);
  user = resetWorld(hdUser({ latestLabAttemptByKey: { [LAB]: returned } }));
  html = proveSection(moduleOneHtml(user));
  assert.match(html, /without written notes/);
  assert.doesNotMatch(html, /open-marked-lab/, 'no link with nothing behind it');
}

const tests = [
  testSubmitTurnsOnFromCompletenessOnly, testConfirmedSaveOnlyAfterTheServerHasTheRow, testUnsentWorkNoteTravelsWithTheSubmit,
  testReloadTakesTheLockFromTheServer, testFailuresKeepWorkAndShowNoSuccess, testSimulatorOnlyAcceptsItsOwnReply, testPortalRefusals,
  testOneWaitingAttempt, testReturnedReopensForOneResubmission, testInstructorReadsPlainText, testModuleOnePage,
];
(async () => {
  let failed = 0;
  for (const test of tests) {
    try { await test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
  }
  if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
  console.log(`all ${tests.length} passed`);
})();

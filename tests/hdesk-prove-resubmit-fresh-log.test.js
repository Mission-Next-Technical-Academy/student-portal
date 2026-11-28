// Help Desk Prove It: a returned attempt starts with an empty action log
// (Megan, 2026-11-25, PR #155's review). The real simulator code and the real
// course-page code, joined by a stand-in for the browser's messages, over a
// stand-in lab_attempts table, for every Help Desk Prove It that reopens a
// returned attempt (Modules 1 to 9: its-01, its-10, its-11, its-02, its-03,
// its-07, its-05, its-06, its-04).
//
//   - Same browser: the returned attempt's actions, screens opened, password
//     flags, chat and knowledge base lists are cleared once, by the course
//     page's answer; the laptop stays as the student left it; work done after
//     the return survives a reload; a third attempt starts empty again.
//   - Another browser: the form comes back, the action log doesn't.
//   - A draft that never heard of the return can't resend the earlier actions:
//     the course page refuses it and the simulator clears its log.
//   - Every earlier lab_attempts row stays exactly as saved, and nothing
//     updates or deletes one.
//   - Module 6 end to end: a critical action on attempt 1; after the return,
//     attempt 2 earns the question, the article and the fix again, and sends
//     none of attempt 1's actions. The instructor sheet still shows attempt
//     1's critical action and its critical recommendation.
//   - SOC: the Help Desk Prove handler still answers a SOC student with
//     'other-student' and reads nothing; SOC's own return flag reads as before.
//
// Scoring is the server's (supabase/tests/hdesk_prove_resubmit_fresh_log.sql
// scores attempt 1 as critical, 0, and attempt 2 at 85). Structure only:
// nothing here says which choice is right; names come from the shift data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const SIM_ORIGIN = 'http://127.0.0.1:8767';
const PORTAL_ORIGIN = 'http://127.0.0.1:8768';
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(ROOT, 'ui', name), 'utf8')]);
const MODULES = ['its-01', 'its-10', 'its-11', 'its-02', 'its-03', 'its-07', 'its-05', 'its-06', 'its-04', 'its-08'];
const plain = (value) => JSON.parse(JSON.stringify(value));
const j = (value) => JSON.stringify(value);

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
let signedIn = null;
portal.currentUser = async () => signedIn;
const studentOf = (user) => prun('LabRuntime').anonymousStudentId(user);
const page = (moduleKey) => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules[${j(moduleKey)}].number]`);
const hdUser = (extra = {}) => ({
  userId: 'user-fresh-log', email: 'fresh-log@test.invalid', trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {}, ...extra,
});

// The stand-in lab_attempts: newest last, one waiting attempt at a time.
let db;
function freshDb() {
  db = { attempts: [] };
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => {
    if (call.table !== 'lab_attempts') return { data: [], error: null };
    if (call.op === 'select') return { data: db.attempts.filter((row) => row.lab_key === call.filters.lab_key).slice().reverse().slice(0, 1), error: null };
    if (call.op !== 'insert') return { data: null, error: { message: `unexpected ${call.op}` } };
    const latest = db.attempts.filter((row) => row.lab_key === call.payload.lab_key).pop();
    if (latest && (!latest.reviewed_at || !latest.redo_requested)) return { data: null, error: { code: 'P0001', message: 'refused' } };
    db.attempts.push({ id: `row-${db.attempts.length + 1}`, reviewed_at: null, redo_requested: false, superseded_at: null, ...call.payload });
    return { data: null, error: null };
  };
}
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setTimeout(resolve, 0)); };
function resetWorld(user = hdUser()) { freshDb(); signedIn = user; return user; }
// The instructor returns the newest attempt.
function returnNewest(at) {
  const row = db.attempts[db.attempts.length - 1];
  Object.assign(row, { completed_at: at || row.completed_at, reviewed_at: new Date().toISOString(), redo_requested: true });
  return row;
}
// Nothing ever changes or removes a saved attempt.
function assertNoAttemptWrites() {
  const writes = portal.supabaseCalls.filter((call) => call.table === 'lab_attempts' && call.op !== 'select' && call.op !== 'insert');
  assert.deepEqual(plain(writes.map((call) => call.op)), [], 'no update, upsert or delete on lab_attempts');
}

/* --------------------------------------------------------------- simulator */
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  return { id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', textContent: '', disabled: false,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {} };
}
// A tab the course page opened: its opener delivers messages to the module
// page's handler, and replies come back from that opener and the portal origin.
function bridge(moduleKey) {
  const link = { closed: false, tab: null, focus() {},
    postMessage(data) {
      const source = { postMessage: (reply) => { link.tab.deliver({ data: plain(reply), source: link, origin: PORTAL_ORIGIN }); } };
      page(moduleKey).onMessage({ data: plain(data), origin: SIM_ORIGIN, source });
    } };
  return link;
}
function sim(moduleKey, { student, opener = null, local = store() }) {
  const u = new URL(`${SIM_ORIGIN}/?prove=${moduleKey}&student=${student}#/helpdesk/tickets`);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const listeners = new Set();
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location,
    document: { readyState: 'loading', body, addEventListener() {}, getElementById: (id) => byId.get(id) || null, createElement: () => element(''), querySelector: () => null, querySelectorAll: () => [] },
    history: { state: null, replaceState() {} },
    localStorage: local, sessionStorage: store(),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener: (type, fn) => { if (type === 'message') listeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') listeners.delete(fn); },
    toast() {}, render: () => {},
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = () => {};
  const tab = {
    ctx, local, byId,
    run: (code) => vm.runInContext(code, ctx),
    deliver: (event) => [...listeners].forEach((fn) => fn(event)),
    prove: () => plain(tab.run('hdState.prove')),
    status: () => tab.run('hdProveServer.status'),
    pkg: () => plain(tab.run('hdProvePackage()')),
  };
  if (opener) opener.tab = tab;
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  return tab;
}
async function openTab(moduleKey, local = store()) {
  const tab = sim(moduleKey, { student: studentOf(signedIn), opener: bridge(moduleKey), local });
  await flush();
  return tab;
}
const labKeyOf = (tab) => tab.run('HD_PROVE.shift.labKey');
// The console lists that stop a question or an article being recorded twice.
const consoleLists = (tab) => plain(tab.run('hdState.tickets.map((t) => t.consoleState ? [t.consoleState.chat || [], t.consoleState.kbOpened || [], t.consoleState.kbSearches || []] : [[], [], []])'));
// Attempt 1's recorded work, made up and the same on every shift: a critical
// action, a screen, a search, a password flag, a chat question and an article.
function recordAttemptOne(tab) {
  tab.run(`hdProveEvent('action_taken', { label:'made-up critical action', computer:'XW-01', value:'made-up-critical' });
    hdProveOpened('made-up-screen:XW-01', 'Made-up screen');
    hdProveEvent('kb_search', { value:'made-up search' });
    hdState.prove.passwordTyped = true; hdState.prove.passwordWritten = true;
    hdState.tickets.forEach((t) => { const s = hdConsoleState(t); s.chat.push({ id:'z1', question:'Made-up question', reply:'Made-up reply', time:'10:00' }); s.kbOpened.push('KB-9001'); s.kbSearches.push({ query:'made-up search', results:[] }); });
    hdSave()`);
}
// A saved row as the course page saves it: the package under 'mnt-prove-submit'.
function saveRow(tab, completedAt) {
  db.attempts.push({ id: `row-${db.attempts.length + 1}`, lab_key: labKeyOf(tab), track_code: 'HDESK', completed_at: completedAt,
    reviewed_at: null, redo_requested: false, superseded_at: null, result: { source: 'mnt-prove-submit', ...tab.pkg() } });
  return db.attempts[db.attempts.length - 1];
}
function assertEmptyLog(tab, label) {
  const prove = tab.prove();
  assert.deepEqual(prove.events, [], `${label}: no recorded actions`);
  assert.deepEqual(prove.opened, [], `${label}: no screens opened`);
  assert.equal(prove.passwordTyped, false, `${label}: no typed-password flag`);
  assert.equal(prove.passwordWritten, false, `${label}: no written-password flag`);
  consoleLists(tab).forEach(([chat, kb, searches]) => {
    assert.deepEqual([chat, kb, searches], [[], [], []], `${label}: the chat and the knowledge base lists are empty`);
  });
}

/* ------------------------------------------------------------------- tests */

// Every shift that reopens a returned attempt, through the course page's own
// status answer (never a direct prefill call).
async function testEveryShiftStartsAReturnedAttemptEmpty() {
  for (const moduleKey of MODULES) {
    resetWorld();
    const local = store();
    const first = await openTab(moduleKey, local);
    assert.equal(first.status(), 'not_submitted', `${moduleKey}: a first attempt`);
    recordAttemptOne(first);
    const laptop = plain(first.run('hdState.machines'));
    const t1 = new Date(Date.now() - 120000).toISOString();
    const row1 = saveRow(first, t1);
    returnNewest();
    const row1Saved = plain(row1);
    assert.ok(row1.result.events.some((e) => e.value === 'made-up-critical'), `${moduleKey}: attempt 1's row holds its critical action`);

    // Same browser: cleared once, by the course page's answer.
    const second = await openTab(moduleKey, local);
    assert.equal(second.status(), 'returned', moduleKey);
    assertEmptyLog(second, `${moduleKey} same browser`);
    assert.equal(second.prove().freshFor, t1, `${moduleKey}: the log is cleared for attempt 1`);
    assert.deepEqual(plain(second.run('hdState.machines')), laptop, `${moduleKey}: the laptop stays as the student left it`);
    assert.equal(second.pkg().freshFor, t1, `${moduleKey}: the package says which return it was cleared for`);
    // Work after the return survives a reload: no second clear.
    second.run("hdProveEvent('kb_search', { value:'search after the return' }); hdSave()");
    const reload = await openTab(moduleKey, local);
    assert.deepEqual(reload.prove().events.map((e) => e.value), ['search after the return'], `${moduleKey}: a reload keeps this attempt's work`);

    // Another browser: the form comes back, the log doesn't.
    const other = await openTab(moduleKey, store());
    assert.equal(other.status(), 'returned');
    assertEmptyLog(other, `${moduleKey} another browser`);
    assert.equal(other.prove().freshFor, t1);

    // Attempt 2 is saved and returned: attempt 3 starts empty again.
    const t2 = new Date(Date.now() - 60000).toISOString();
    const row2 = saveRow(reload, t2);
    assert.ok(!row2.result.events.some((e) => e.value === 'made-up-critical'), `${moduleKey}: attempt 2 sends none of attempt 1's actions`);
    assert.equal(row2.result.passwordTyped, false, `${moduleKey}: nor its password flag`);
    returnNewest();
    const third = await openTab(moduleKey, local);
    assert.equal(third.status(), 'returned');
    assertEmptyLog(third, `${moduleKey} attempt 3`);
    assert.equal(third.prove().freshFor, t2, `${moduleKey}: cleared for attempt 2`);

    assert.deepEqual(plain(db.attempts[0]), row1Saved, `${moduleKey}: attempt 1's row is exactly as saved`);
    assertNoAttemptWrites();
  }
}

// A draft that never heard the attempt was returned (the course page didn't
// answer when the tab opened) can't resend the earlier actions.
async function testAStaleDraftIsRefusedAndCleared() {
  for (const moduleKey of MODULES) {
    resetWorld();
    const local = store();
    const first = await openTab(moduleKey, local);
    recordAttemptOne(first);
    const t1 = new Date(Date.now() - 120000).toISOString();
    saveRow(first, t1);
    returnNewest();
    // This tab still holds attempt 1's actions and doesn't know of the return.
    first.run("hdProveServer.status = 'unknown'");
    const replies = [];
    page(moduleKey).onMessage({ data: plain({ type: prun('ITS_PROVE_SUBMIT'), id: moduleKey, nonce: `stale-${moduleKey}-1234`, student: studentOf(signedIn), work: first.pkg() }), origin: SIM_ORIGIN,
      source: { postMessage: (reply) => replies.push(plain(reply)) } });
    await flush();
    assert.equal(replies.length, 1);
    assert.equal(replies[0].reason, 'stale-draft', `${moduleKey}: refused`);
    assert.equal(replies[0].saved, false);
    assert.equal(replies[0].status, 'returned');
    assert.equal(replies[0].returnedAt, t1);
    assert.equal(db.attempts.length, 1, `${moduleKey}: nothing saved`);
    first.run(`hdProveApply(${j(replies[0])})`);
    assertEmptyLog(first, `${moduleKey} after the refusal`);
    assert.match(first.run('hdProveSubmitState()').note, /earlier actions were cleared/);
    assertNoAttemptWrites();
  }
}

/* Module 6 end to end: real screens, real Submit. */
const M6 = 'its-07';
async function testModuleSixCriticalThenPass() {
  resetWorld();
  const local = store();
  const tab = await openTab(M6, local);
  const shift = plain(tab.run(`HD_PROVE_SHIFTS[${j(M6)}]`));
  const spec = shift.tickets[0];
  const main = shift.selectedComputer;
  const fixture = shift.machines[main];
  const cause = fixture.processes.find((p) => p.goneWhen);
  const item = fixture.protection.allowed.find((a) => a.id === cause.goneWhen.threatRemoved);
  const question = spec.console.caller.questions[0];
  const classes = tab.run('HD_PROVE_CLASSES.slice()');
  const groups = tab.run('HD_ASSIGNMENT_GROUPS.slice()');
  const fill = (t) => {
    t.run('hdProveAssign(hdState.tickets[0].id)');
    t.ctx.hdProveSetField('ticketClass', classes[1]);
    t.ctx.hdProveSetField('category', spec.categoryOptions[1]);
    t.ctx.hdProveSetField('impact', '2');
    t.ctx.hdProveSetField('urgency', '1');
    t.ctx.hdProveSetField('group', groups[2]);
    t.ctx.hdProveChoose('diagnosis', spec.diagnosisOptions[0]);
    t.ctx.hdProveChoose('decision', 'Escalate');
    t.ctx.hdProveText('keyFinding', 'Synthetic finding: made up.');
    t.ctx.hdProveText('resolutionNote', 'Synthetic note: Reported / Tried / Result, all made up.');
    t.ctx.hdProveText('userReply', 'Synthetic reply: made up.');
    t.run('hdProveClose(hdState.tickets[0].id)');
  };
  const ask = (t) => t.run(`hdChatAsk(hdState.tickets[0].id, ${j(question.id)})`);
  const openKb = (t) => t.run("hdState.selectedTicketId = hdState.tickets[0].id; hdKbOpen(hdState.tickets[0].id, 'KB-0080')");
  const actions = (events) => events.filter((e) => e.type === 'action_taken').map((e) => e.value);

  // Attempt 1: a question, the article, protection turned off (critical).
  ask(tab);
  openKb(tab);
  tab.run(`hdOpenMachineScreen(${j(main)}, 'windows-security'); hdWinScreenTab(${j(main)}, 'windows-security', 'virus-threat'); hdWinRealtimeSet(${j(main)}, false)`);
  fill(tab);
  tab.run('hdProveSubmit()');
  await flush();
  assert.equal(db.attempts.length, 1, 'attempt 1 is saved');
  const row1 = db.attempts[0];
  assert.ok(actions(row1.result.events).includes('realtime-protection-off'), 'attempt 1 holds the critical action');
  assert.equal(row1.result.freshFor, undefined, 'the marker is never saved');
  returnNewest(new Date(Date.now() - 60000).toISOString());
  const row1Saved = plain(row1);

  // Attempt 2, same browser: an empty log; the laptop as it was left.
  const again = await openTab(M6, local);
  assert.equal(again.status(), 'returned');
  assert.deepEqual(again.prove().events, []);
  assert.equal(plain(again.run(`hdState.machines[${j(main)}]`)).protection.realtime, false,
    'the laptop is kept: protection is still off until the student turns it back on');
  // Each piece is earned again: the question, the article, the fix.
  ask(again);
  openKb(again);
  again.run(`hdWinRealtimeSet(${j(main)}, true)`);
  again.run(`hdOpenMachineScreen(${j(main)}, 'browser-extensions'); hdWinRemoveExtension(${j(main)}, ${j(cause.goneWhen.extensionRemoved)})`);
  again.run(`hdWinThreatSet(${j(main)}, ${j(item.id)}, 'unallow'); hdWinThreatSet(${j(main)}, ${j(item.id)}, 'remove'); hdWinScanNow(${j(main)})`);
  fill(again);
  assert.equal(again.run('hdProveSubmitState()').enabled, true);
  again.run('hdProveSubmit()');
  await flush();
  assert.equal(db.attempts.length, 2, 'attempt 2 is a new row');
  const row2 = db.attempts[1];
  const sent = row2.result.events;
  assert.ok(!actions(sent).includes('realtime-protection-off'), 'attempt 2 sends none of attempt 1\'s critical action');
  assert.equal(sent.filter((e) => e.type === 'caller_question' && e.value === question.id).length, 1, 'the question is earned again, once');
  assert.ok(sent.some((e) => e.type === 'evidence_opened' && e.source === 'kb:KB-0080'), 'the article is earned again');
  ['extension-removed', 'threat-removed', 'quick-scan-after-removal'].forEach((id) => assert.ok(actions(sent).includes(id), id));
  assert.equal(row2.result.machine.defender.realtime, true, 'protection is back on at submit');
  assert.equal(row2.result.freshFor, undefined, 'the marker is never saved');

  // Attempt 1 is untouched, and its instructor sheet still shows the critical error.
  assert.deepEqual(plain(db.attempts[0]), row1Saved, 'attempt 1\'s row is exactly as it was returned');
  assertNoAttemptWrites();
  const sheetRow = { ...row1, student_id: '9900000071-HDESK', pass_threshold: 70 };
  const panel = prun('itsProveReviewPanel')(sheetRow);
  const offLabel = row1.result.events.find((e) => e.value === 'realtime-protection-off').label;
  assert.ok(panel.includes(prun('esc')(offLabel)), 'attempt 1\'s panel still lists turning off real-time protection');
  assert.ok(panel.includes('Real-time protection: off'), 'and the laptop at its submit');
  const rec = { status: 'scored', automatic_points: 80, automatic_earned: 0, writing_points: 20, writing_suggested: 0, recommended_score: 0, critical_error: true,
    critical_reasons: [{ id: 'made-up', reason: 'Made-up critical reason.' }], competencies: [] };
  assert.match(prun('itsProveRecommendationHtml')(sheetRow, rec), /data-its-prove-rec-critical[\s\S]*Critical error: automatic zero/, 'attempt 1\'s recommendation still shows the critical error');
  assert.ok(!prun('itsProveReviewPanel')({ ...row2, student_id: '9900000071-HDESK', pass_threshold: 70 }).includes(prun('esc')(offLabel)), 'attempt 2\'s panel doesn\'t');
}

// The trade-off of keeping the laptop (Megan's choice, 2026-11-25): a fix
// made in attempt 1 stays on the laptop, but it can't be made again, so
// attempt 2's log doesn't hold it. Attempt 1's row still does, for the
// instructor. Pinned here so a change to either side is deliberate.
async function testAFixFromAttemptOneStaysOnTheLaptopOnly() {
  resetWorld();
  const local = store();
  const tab = await openTab(M6, local);
  const shift = plain(tab.run(`HD_PROVE_SHIFTS[${j(M6)}]`));
  const main = shift.selectedComputer;
  const extension = shift.machines[main].processes.find((p) => p.goneWhen).goneWhen.extensionRemoved;
  tab.run(`hdOpenMachineScreen(${j(main)}, 'browser-extensions'); hdWinRemoveExtension(${j(main)}, ${j(extension)})`);
  saveRow(tab, new Date(Date.now() - 60000).toISOString());
  returnNewest();
  assert.ok(db.attempts[0].result.events.some((e) => e.value === 'extension-removed'), 'attempt 1\'s row holds the fix');
  const again = await openTab(M6, local);
  assert.ok(!plain(again.run(`hdState.machines[${j(main)}]`)).extensions.some((e) => e.name === extension), 'the extension is still gone on the laptop');
  again.run(`hdWinRemoveExtension(${j(main)}, ${j(extension)})`);
  assert.ok(!again.prove().events.some((e) => e.value === 'extension-removed'), 'it can\'t be removed again, so attempt 2\'s log has no removal');
  assert.ok(!again.pkg().machine.browserExtensions.includes(extension), 'attempt 2\'s laptop summary still shows it removed');
}

/* SOC: unchanged. */
async function testSocIsUnchanged() {
  // The Help Desk handler answers a SOC student as before and reads nothing.
  const soc = { userId: 'user-soc', email: 'soc@test.invalid', trackCode: 'SOCAN', enrollments: [], latestLabAttemptByKey: {}, openLabRedosByModuleKey: { 'soc-04': { labKey: 'x' } } };
  resetWorld(soc);
  for (const type of [prun('ITS_PROVE_STATUS'), prun('ITS_PROVE_SUBMIT')]) {
    const replies = [];
    page(M6).onMessage({ data: { type, id: M6, nonce: 'soc-check-1234', student: 'x', work: {} }, origin: SIM_ORIGIN, source: { postMessage: (reply) => replies.push(plain(reply)) } });
    await flush();
    assert.deepEqual(replies.map((r) => [r.reason, r.saved, 'returnedAt' in r, 'lastWork' in r]), [['other-student', false, false, false]], `${type}: refused as before`);
  }
  assert.deepEqual(plain(portal.supabaseCalls.filter((call) => call.table === 'lab_attempts')), [], 'no SOC attempt is read or written');
  // SOC's own return flag reads the same object, unchanged.
  const flag = (user) => vm.runInContext(`moduleFourUser = ${j(user)}; moduleFourProveItRedoRequested()`, portal);
  const labKey = prun('MODULE_FOUR_CATALOG_LAB_KEY');
  assert.equal(flag({ openLabRedosByModuleKey: { 'soc-04': { labKey } } }), true, 'a returned SOC Module 4 still reopens');
  assert.equal(flag({ openLabRedosByModuleKey: {} }), false);
  // No SOC file is touched by this change (the behaviour is pinned above;
  // tests/soc-m04-assessment-submit.test.js covers SOC's own redo save).
  const socFiles = fs.readdirSync(path.join(ROOT, 'portal')).filter((name) => /^soc-/.test(name));
  assert.ok(socFiles.length > 10);
  socFiles.forEach((name) => assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'portal', name), 'utf8'), /hdProveFreshLog|freshFor|stale-draft/, name));
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-prove-resubmit-fresh-log\.test\.js$/m);
}

(async () => {
  let failed = 0;
  const tests = [testEveryShiftStartsAReturnedAttemptEmpty, testAStaleDraftIsRefusedAndCleared, testModuleSixCriticalThenPass, testAFixFromAttemptOneStaysOnTheLaptopOnly, testSocIsUnchanged, testCiRunsThisFile];
  for (const test of tests) {
    try { await test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
  }
  if (failed) { console.error(`hdesk-prove-resubmit-fresh-log: ${failed} of ${tests.length} failed`); process.exit(1); }
  console.log(`hdesk-prove-resubmit-fresh-log: all ${tests.length} passed`);
})();

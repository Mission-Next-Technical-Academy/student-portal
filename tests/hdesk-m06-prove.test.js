// Module 6 (key its-07) Prove It: one ticket on Module 3's one-ticket form
// with a key-finding note and a chat with the user, worked on one laptop with
// the Module 5 and Module 6 tool screens (ui/helpdesk.js,
// HD_PROVE_SHIFTS['its-07']), and the course page's side of it
// (portal/it-support-shared.js: the cleaner, the prefill, the review panel;
// portal/it-support-module-07.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, the tool screens on the laptop, the chat.
//   - The chat: each question gets its plain reply and is recorded once as
//     caller_question (its neutral id and its text); nothing is offered after
//     submit; older Prove shifts still have no chat.
//   - Each screen records its source once with the computer; the optional
//     PowerShell lines read the same state and are recorded with the computer.
//   - The managed fix: the process the data names leaves Task Manager only
//     once both removals it waits for are made, its CPU leaves the total, and
//     a quick scan after a removal records its own action. Each action is
//     labelled with the item it acted on.
//   - The unsafe routes (the switch, the exclusion, each typed form) work and
//     are recorded with the same action id, with no warning and no undo.
//   - The package carries a small summary inside the course page's machine
//     limit; the course page keeps it and the chat questions; a returned
//     attempt puts the laptop and the chat back.
//   - The instructor reads the key finding, the work note and the reply in
//     full, the questions asked and the laptop at submit.
//   - The page submits through recordLabAttempt; a failed write saves nothing.
//
// Structure only: nothing here says which choice or setting is right. Names
// are read from the shift data; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-07-prove-it';
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
  const confirms = [];
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
    opener: null, closed: false, close() {}, focus() {}, confirm: (text) => { confirms.push(text); return true; },
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
    ctx, run, local, byId, toasts, confirms,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: () => run('hdState.tickets[0]'),
    prove: () => plain(run('hdState.prove')),
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    submitState: () => plain(run('hdProveSubmitState()')),
    coachPanel: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
    ps: (computer, command) => {
      run(`hdSelectComputer(${j(computer)})`);
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    tab: (computer, screen, tab) => { run(`hdWinScreenTab(${j(computer)}, ${j(screen)}, ${j(tab)})`); return run(`VIEWS['helpdesk/${screen}']()`); },
  };
}
const SHIFT = sim('its-07', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-07']))");
const SPEC = SHIFT.tickets[0];
const MAIN = SHIFT.selectedComputer;
const FIXTURE = SHIFT.machines[MAIN];
// The process a fix removes, and the two removals it waits for, read from the
// data's own rule. Another extension, for the wrong-item case.
const CAUSE = FIXTURE.processes.find((p) => p.goneWhen);
const EXTENSION = CAUSE.goneWhen.extensionRemoved;
const ITEM = FIXTURE.protection.allowed.find((item) => item.id === CAUSE.goneWhen.threatRemoved);
const OTHER_EXTENSION = FIXTURE.extensions.find((item) => item.name !== EXTENSION).name;
const QUESTIONS = SPEC.console.caller.questions;
const CLASSES = sim('its-07', 'probe2').run('HD_PROVE_CLASSES.slice()');
const GROUPS = sim('its-07', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const WRITING = { keyFinding: 'Synthetic finding E: three made-up facts linked.', resolutionNote: 'Synthetic note A: Reported / Tried / Result, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const sources = (tab) => tab.prove().opened.filter((s) => !s.startsWith('computer:') && !s.startsWith('screen:'));
const actions = (tab) => tab.prove().events.filter((e) => e.type === 'action_taken');
const ask = (tab, id) => tab.run(`hdChatAsk(hdState.tickets[0].id, ${j(id)})`);
// The managed fix on the screens: the extension, then Don't allow and Remove.
function managedFix(tab) {
  tab.screen(MAIN, 'browser-extensions');
  tab.run(`hdWinRemoveExtension(${j(MAIN)}, ${j(EXTENSION)})`);
  tab.run(`hdWinThreatSet(${j(MAIN)}, ${j(ITEM.id)}, 'unallow'); hdWinThreatSet(${j(MAIN)}, ${j(ITEM.id)}, 'remove')`);
}
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[1]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[1]);
  tab.ctx.hdProveSetField('impact', '2');
  tab.ctx.hdProveSetField('urgency', '1');
  tab.ctx.hdProveSetField('group', GROUPS[2]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Escalate');
  [SPEC.pathPool[0].id, SPEC.pathPool[7].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  Object.entries(WRITING).forEach(([field, text]) => tab.ctx.hdProveText(field, text));
  tab.run('hdProveClose(hdState.tickets[0].id)');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m07', step: 2 })]]);
  const tab = sim('its-07', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-07-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 20, 'the coaching time box (the filed minutes are 10)');
  assert.equal(SHIFT.machineTools, true);
  assert.equal(SHIFT.windowsSummary, true);
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.prove().keyFinding, '', 'the key-finding box starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(SPEC.id), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.match(html, /data-hd-prove-writing="keyFinding"/, 'the key-finding box');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, SPEC.pathPool.length, 'step ids are unique');
  assert.ok(SPEC.pathPool.length >= 12, 'wrong-direction steps beside the checks');
  // The chat: every question offered, none asked yet.
  assert.match(html, /class="card hd-chat"/);
  QUESTIONS.forEach((q) => assert.ok(html.includes(`hdChatAsk('${SPEC.id}','${q.id}')`), `question ${q.id} offered`));
  assert.ok(QUESTIONS.length >= 4, 'several questions, so the list does not point at one');
  assert.ok(QUESTIONS.every((q) => /^q\d+$/.test(q.id)), 'neutral question ids');
  // The laptop shows the Module 5 and Module 6 tool screens.
  tab.run(`hdSelectComputer(${j(MAIN)})`);
  const desktop = tab.view('helpdesk/windows');
  ['pc-task-manager', 'settings-storage', 'settings-update', 'settings-apps', 'software-catalog', 'windows-security', 'browser-extensions', 'onedrive', 'default-apps', 'company-portal']
    .forEach((screen) => assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen));
  // Knowledge base: the shift's own copies of the two articles.
  same(tab.run('hdKbArticles().filter((a) => ["KB-0080", "KB-0058"].includes(a.id)).map((a) => a.id).sort()'), ['KB-0058', 'KB-0080']);
  assert.ok(!tab.run('hdKbArticles().some((a) => a.practiceOnly)'), 'no practice-only article in a Prove It');
}

function testChat() {
  const tab = sim('its-07', 'stu-chat');
  ask(tab, QUESTIONS[2].id);
  ask(tab, QUESTIONS[0].id);
  ask(tab, QUESTIONS[0].id);
  const asked = tab.prove().events.filter((e) => e.type === 'caller_question');
  same(asked.map((e) => [e.value, e.label]), [[QUESTIONS[2].id, QUESTIONS[2].text], [QUESTIONS[0].id, QUESTIONS[0].text]], 'each question once, by id and text');
  const html = ticketView(tab);
  assert.ok(html.includes(tab.run('hdEsc')(QUESTIONS[0].reply)), 'the reply shows in the chat');
  assert.ok(!html.includes(`hdChatAsk('${SPEC.id}','${QUESTIONS[0].id}')`), 'an asked question is not offered again');
  assert.deepEqual([...tab.toasts], [], 'no toast');
  // The chat shows the shift's clock, never this browser's.
  same(plain(tab.ticket().consoleState.chat).map((entry) => entry.time), [0, 1].map(() => tab.run('hdShiftTimeText(hdShiftNow())')), 'the shift clock');
  // The questions show in a per-attempt order, the same on every redraw.
  const firstShown = (student) => {
    const t = sim('its-07', student);
    const view = ticketView(t);
    assert.equal(ticketView(t), view, 'the same order on a redraw');
    return /hdChatAsk\('[^']+','([^']+)'\)/.exec(view)[1];
  };
  assert.ok(new Set(['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8'].map((s) => firstShown(`stu-order-${s}`))).size > 1, 'no question always comes first');
  // A question that asks for a password, or with a waiting reply, never
  // reaches a Prove ticket's chat.
  const probe = sim('its-07', 'stu-chat-shape');
  probe.run(`HD_PROVE.shift.tickets[0].console.caller.questions.push({ id:'qx', text:'Made-up password question', reply:'x', asksPassword:true }, { id:'qy', text:'Made-up question', reply:'y', afterAction:'made-up' })`);
  const config = plain(probe.run('hdConsole(hdState.tickets[0])'));
  assert.ok(!config.caller.questions.some((q) => q.id === 'qx'), 'no password question');
  same(config.caller.questions.find((q) => q.id === 'qy'), { id: 'qy', text: 'Made-up question', reply: 'y' }, 'text and reply only');
  same(Object.keys(config).sort(), ['caller', 'kb'], 'only the knowledge base and the chat');
  // Submitted: the chat offers nothing and records nothing.
  const locked = sim('its-07', 'stu-chat-locked');
  locked.run("hdProveServer.status = 'waiting'");
  ask(locked, QUESTIONS[1].id);
  assert.equal(locked.prove().events.filter((e) => e.type === 'caller_question').length, 0);
  assert.ok(!ticketView(locked).includes('hdChatAsk('), 'no question buttons after submit');
  // An older Prove It still has no chat.
  const m5 = sim('its-03', 'stu-m5-chat');
  assert.doesNotMatch(ticketView(m5), /class="card hd-chat"/, 'Module 5\'s Prove It: no chat');
  assert.equal(plain(m5.run('hdConsole(hdState.tickets[0])')).caller, undefined);
}

function testScreensAndCommandsRecordTheirComputer() {
  const tab = sim('its-07', 'stu-sources');
  tab.screen(MAIN, 'pc-task-manager');
  tab.run(`hdWinTaskTab(${j(MAIN)}, 'performance')`);
  tab.screen(MAIN, 'browser-extensions');
  tab.screen(MAIN, 'windows-security');
  ['virus-threat', 'protection-history', 'allowed-threats'].forEach((page) => tab.tab(MAIN, 'windows-security', page));
  tab.tab(MAIN, 'windows-security', 'protection-history');
  ['settings-storage', 'settings-update', 'settings-apps'].forEach((screen) => tab.screen(MAIN, screen));
  const opened = sources(tab);
  [`task-manager:${MAIN}:processes`, `task-manager:${MAIN}:performance`, `browser-extensions:${MAIN}`, `windows-security:${MAIN}`,
    `windows-security:${MAIN}:virus-threat`, `windows-security:${MAIN}:protection-history`, `windows-security:${MAIN}:allowed-threats`,
    `storage:${MAIN}`, `windows-update:${MAIN}`, `installed-apps:${MAIN}`]
    .forEach((source) => assert.ok(opened.includes(source), source));
  assert.equal(opened.length, new Set(opened).size, 'each source once');
  // The screens show the laptop's state as the data gives it.
  const history = tab.tab(MAIN, 'windows-security', 'protection-history');
  assert.ok(history.includes(tab.run('hdEsc')(FIXTURE.protection.history[0].status)), 'the history row and its status');
  assert.ok(tab.screen(MAIN, 'browser-extensions').includes(tab.run('hdEsc')(EXTENSION)), 'every extension listed');
  // The article opened is recorded as its own source.
  tab.run(`hdState.selectedTicketId = hdState.tickets[0].id; hdKbOpen(hdState.tickets[0].id, 'KB-0080')`);
  assert.ok(sources(tab).includes('kb:KB-0080'));
  // The optional lines: the laptop's own answers, recorded with the computer.
  const top = tab.ps(MAIN, 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 5');
  assert.ok(top.indexOf(CAUSE.name.split(' ')[0]) >= 0, 'the process list sorted by CPU');
  assert.match(tab.ps(MAIN, 'Get-MpThreatDetection'), new RegExp(ITEM.id), 'the history, as the screen shows it');
  assert.match(tab.ps(MAIN, 'Get-MpComputerStatus | Select-Object AMServiceEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated'), /RealTimeProtectionEnabled\s*:\s*True/);
  const commands = tab.prove().events.filter((e) => e.type === 'command_run');
  assert.ok(commands.length >= 3 && commands.every((e) => e.computer === MAIN), 'each command is recorded with its computer');
}

function testManagedFixRemovesTheProcess() {
  const running = (tab) => tab.machine(MAIN).processes.map((p) => p.name);
  // The extension alone: the process stays.
  const extOnly = sim('its-07', 'stu-fix-1');
  extOnly.run(`hdWinRemoveExtension(${j(MAIN)}, ${j(EXTENSION)})`);
  assert.ok(running(extOnly).includes(CAUSE.name), 'the extension alone: still running');
  // Don't allow alone isn't removal: still running.
  extOnly.run(`hdWinThreatSet(${j(MAIN)}, ${j(ITEM.id)}, 'unallow')`);
  assert.ok(running(extOnly).includes(CAUSE.name), 'Don\'t allow alone: still running');
  // The item removed alone: still running.
  const itemOnly = sim('its-07', 'stu-fix-2');
  itemOnly.run(`hdWinThreatSet(${j(MAIN)}, ${j(ITEM.id)}, 'unallow'); hdWinThreatSet(${j(MAIN)}, ${j(ITEM.id)}, 'remove')`);
  assert.ok(running(itemOnly).includes(CAUSE.name), 'the item alone: still running');
  // Both: gone, and its CPU leaves the total.
  const both = sim('its-07', 'stu-fix-3');
  both.ctx.hdWinScanNow(MAIN);
  assert.ok(!actions(both).some((e) => e.value === 'quick-scan-after-removal'), 'a scan before any removal is just a scan');
  managedFix(both);
  assert.ok(!running(both).includes(CAUSE.name), 'both removals: the process is gone');
  assert.equal(both.machine(MAIN).performance.cpu, FIXTURE.performance.cpu - CAUSE.cpu, 'its CPU leaves the total');
  assert.ok(!both.ps(MAIN, 'Get-Process').includes(CAUSE.name.split(' ')[1] || CAUSE.name), 'and Get-Process no longer lists it');
  both.ctx.hdWinScanNow(MAIN);
  both.ps(MAIN, 'Start-MpScan -ScanType QuickScan');
  const done = actions(both);
  ['extension-removed', 'threat-unallowed', 'threat-removed', 'quick-scan', 'quick-scan-after-removal'].forEach((id) => assert.ok(done.some((e) => e.value === id && e.computer === MAIN), id));
  assert.equal(done.filter((e) => e.value === 'quick-scan-after-removal').length, 2, 'the screen and the typed scan record the same');
  // Each action names the item it acted on, so a key can tell which one.
  assert.ok(done.find((e) => e.value === 'extension-removed').label.includes(EXTENSION));
  assert.ok(done.find((e) => e.value === 'threat-removed').label.includes(ITEM.name));
  const wrong = sim('its-07', 'stu-fix-4');
  wrong.run(`hdWinRemoveExtension(${j(MAIN)}, ${j(OTHER_EXTENSION)})`);
  const label = actions(wrong).find((e) => e.value === 'extension-removed').label;
  assert.ok(label.includes(OTHER_EXTENSION) && !label.includes(EXTENSION), 'another extension is labelled as itself');
  assert.ok(running(wrong).includes(CAUSE.name));
  assert.deepEqual([...both.toasts], [], 'no toast in a Prove It');
}

function testUnsafeRoutesAreRecordedAndNeverUndone() {
  const realtime = (tab) => tab.machine(MAIN).protection.realtime;
  const screen = sim('its-07', 'stu-unsafe-1');
  screen.tab(MAIN, 'windows-security', 'virus-threat');
  screen.run(`hdWinRealtimeSet(${j(MAIN)}, false)`);
  assert.equal(realtime(screen), false, 'the switch works');
  assert.ok(actions(screen).some((e) => e.value === 'realtime-protection-off' && e.computer === MAIN));
  assert.deepEqual([...screen.confirms], [], 'a Prove It asks nothing');
  assert.deepEqual([...screen.toasts], [], 'no warning');
  assert.doesNotMatch(screen.tab(MAIN, 'windows-security', 'virus-threat'), /data-hd-unsafe-undone/, 'nothing undoes it');
  ['Set-MpPreference -DisableRealtimeMonitoring $true', 'set-mppreference -disablerealtimemonitoring:$true', 'Set-MpPreference -DisableRealtimeMonitoring 1'].forEach((line, i) => {
    const typed = sim('its-07', `stu-unsafe-typed-${i}`);
    typed.ps(MAIN, line);
    assert.equal(realtime(typed), false, line);
    assert.ok(actions(typed).some((e) => e.value === 'realtime-protection-off' && e.computer === MAIN), `${line}: the same action id`);
    assert.ok(typed.prove().events.some((e) => e.type === 'command_run' && e.computer === MAIN), `${line}: recorded as typed`);
  });
  const exclusion = sim('its-07', 'stu-unsafe-2');
  exclusion.tab(MAIN, 'windows-security', 'virus-threat');
  exclusion.byId.set('hd-exclusion-path', { id: 'hd-exclusion-path', value: 'C:\\Made\\Up' });
  exclusion.run(`hdWinExclusionFrom(${j(MAIN)})`);
  exclusion.ps(MAIN, 'Add-MpPreference -ExclusionPath "C:\\Made\\Up Two"');
  same(exclusion.machine(MAIN).protection.exclusions, ['C:\\Made\\Up', 'C:\\Made\\Up Two'], 'both stay: no undo');
  assert.equal(actions(exclusion).filter((e) => e.value === 'exclusion-added').length, 2, 'the screen and the typed line record the same');
}

function testPackageCarriesASmallSummary() {
  const tab = sim('its-07', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const missing = sim('its-07', 'stu-package-missing');
  fill(missing);
  missing.ctx.hdProveText('keyFinding', '');
  assert.ok(missing.run('hdProveMissing()').includes('key finding'), 'Submit asks for the key finding');
  const first = plain(tab.run('hdProvePackage()'));
  same(Object.keys(first.machine).sort(), ['bootSeconds', 'browserExtensions', 'defender', 'installed', 'removedExtensions', 'restarts', 'running', 'startup', 'uptimeDays'], 'only the summary');
  same(first.machine.browserExtensions, FIXTURE.extensions.map((e) => e.name));
  same(first.machine.defender.threats, { [ITEM.name]: 'Allowed' });
  assert.equal(first.machine.defender.realtime, true);
  same(first.machine.running, FIXTURE.processes.map((p) => p.name));
  assert.equal(first.keyFinding, WRITING.keyFinding);
  // Changed: the managed fix, a scan, two questions, and the fullest unsafe
  // state the screens allow (ten long exclusions, protection off).
  ask(tab, QUESTIONS[0].id); ask(tab, QUESTIONS[3].id);
  managedFix(tab);
  tab.ctx.hdWinScanNow(MAIN);
  for (let i = 0; i < 12; i += 1) tab.ps(MAIN, `Add-MpPreference -ExclusionPath C:\\${'Made-up-folder-'.repeat(12)}${i}`);
  tab.run(`hdWinRealtimeSet(${j(MAIN)}, false)`);
  const work = plain(tab.run('hdProvePackage()'));
  assert.ok(!work.machine.browserExtensions.includes(EXTENSION));
  same(work.machine.removedExtensions, [EXTENSION]);
  same(work.machine.defender.threats, { [ITEM.name]: 'Removed' });
  assert.equal(work.machine.defender.lastScan, 'Just now');
  assert.equal(work.machine.defender.realtime, false);
  assert.equal(work.machine.defender.exclusions.length, 10, 'at most ten exclusions');
  assert.ok(!work.machine.running.includes(CAUSE.name));
  assert.ok(JSON.stringify(work.machine).length < 4096, 'the fullest summary is inside the 4 KB machine limit');
  same(work.events.filter((e) => e.type === 'caller_question').map((e) => e.value), [QUESTIONS[0].id, QUESTIONS[3].id]);
  // Module 5's package is unchanged: its summary only.
  same(Object.keys(plain(sim('its-03', 'stu-m5').run('hdProvePackage()')).machine).sort(), ['bootSeconds', 'installed', 'restarts', 'startup', 'uptimeDays'], 'Module 5: the same summary as before');
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function safeWork() {
  const tab = sim('its-07', 'stu-safe');
  fill(tab);
  ask(tab, QUESTIONS[0].id);
  ask(tab, QUESTIONS[4].id);
  managedFix(tab);
  tab.ctx.hdWinScanNow(MAIN);
  return plain(tab.run('hdProvePackage()'));
}

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-07', LAB);
  assert.equal(reason, undefined);
  same(saved.machine, work.machine, 'the summary is kept as it came');
  assert.equal(saved.fields.priority, prun('ITS_PROVE_MATRIX')['2']['1'], 'Priority is the course page\'s own, from Impact and Urgency');
  assert.equal(saved.keyFinding, WRITING.keyFinding, 'the key finding is kept');
  same(saved.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.label]), [[QUESTIONS[0].id, QUESTIONS[0].text], [QUESTIONS[4].id, QUESTIONS[4].text]], 'the questions are kept');
  assert.ok(saved.events.some((e) => e.type === 'action_taken' && e.value === 'threat-removed'), 'the actions are kept');
  assert.equal(clean({ ...work, keyFinding: '' }, 'its-07', LAB).reason, 'invalid', 'the key finding is required');
  assert.equal(clean({ ...work, keyFinding: 'x'.repeat(601) }, 'its-07', LAB).reason, 'too-large', 'and refused above 600, never cut');
  assert.equal(clean({ ...work, labKey: 'lab-its-03-prove-it', rubricVersion: 'hdesk-its-03-prove-v1' }, 'its-07', LAB).reason, 'invalid', 'refused under another lab key');
  return saved;
}

function testPrefillPutsTheLaptopBack(saved) {
  const row = { completed_at: new Date(Date.now() + 60000).toISOString(), result: { source: 'mnt-prove-submit', ...saved } };
  const lastWork = plain(prun('itsProvePrefillWork')(row));
  const tab = sim('its-07', 'stu-prefill');
  assert.equal(tab.run('hdProvePrefill')(lastWork), true);
  const machine = tab.machine(MAIN);
  same(machine.extensions.map((e) => e.name), saved.machine.browserExtensions, 'the removed extension stays removed');
  assert.ok(!machine.processes.some((p) => p.name === CAUSE.name), 'the process stays gone');
  assert.equal(machine.performance.cpu, FIXTURE.performance.cpu - CAUSE.cpu);
  const item = machine.protection.allowed.find((a) => a.id === ITEM.id);
  assert.ok(item.unallowed && item.removed, 'the item stays removed');
  assert.equal(machine.protection.history.find((h) => h.id === ITEM.id).status, 'Removed');
  same(plain(tab.run('hdProvePackage()')).machine, saved.machine, 'a resubmission sends the same summary');
  assert.equal(tab.prove().keyFinding, saved.keyFinding, 'the key finding is back');
  // The action log starts empty (2026-11-25): the chat is empty and every
  // question is offered again, so a question is earned in this attempt.
  same(tab.prove().events, [], 'no earlier actions');
  const html = ticketView(tab);
  assert.ok(!html.includes(tab.run('hdEsc')(QUESTIONS[0].reply)), 'the earlier reply is not shown');
  assert.ok(html.includes(`hdChatAsk('${SPEC.id}','${QUESTIONS[0].id}')`), 'the earlier question is offered again');
  // A scan after the prefill still knows the removals were made (the laptop
  // is kept), and only this attempt's scan is recorded.
  tab.ctx.hdWinScanNow(MAIN);
  assert.equal(actions(tab).filter((e) => e.value === 'quick-scan-after-removal').length, 1, 'this attempt\'s scan only');
  // Names the laptop doesn't have are ignored; nothing is invented.
  const stale = plain(lastWork);
  stale.machine = { ...stale.machine, browserExtensions: [...FIXTURE.extensions.map((e) => e.name), 'Retired extension'], defender: { realtime: true, exclusions: [], threats: { 'Retired item': 'Removed' } } };
  const other = sim('its-07', 'stu-prefill-stale');
  assert.equal(other.run('hdProvePrefill')(stale), true);
  same(other.machine(MAIN).extensions.map((e) => e.name), FIXTURE.extensions.map((e) => e.name));
  assert.ok(other.machine(MAIN).processes.some((p) => p.name === CAUSE.name), 'the process still runs');
  assert.ok(!other.machine(MAIN).protection.allowed.find((a) => a.id === ITEM.id).removed);
  // An unsafe state comes back as it was sent (the record), and nothing else.
  const unsafe = plain(lastWork);
  unsafe.machine = { ...unsafe.machine, defender: { ...unsafe.machine.defender, realtime: false, exclusions: ['C:\\Made\\Up', 7] } };
  const third = sim('its-07', 'stu-prefill-unsafe');
  assert.equal(third.run('hdProvePrefill')(unsafe), true);
  assert.equal(third.machine(MAIN).protection.realtime, false);
  same(third.machine(MAIN).protection.exclusions, ['C:\\Made\\Up'], 'strings only');
}

const LONG = {
  keyFinding: 'Synthetic finding F: <b>made up</b> & linked.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m06-1', lab_key: LAB, student_id: '9900000006-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  assert.match(html, /data-its-prove-simulator/);
  assert.match(html, /data-its-prove-windows/);
  assert.match(html, /data-its-prove-questions/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>') && !html.includes('<b>made up</b>'), 'never raw');
  ['Key finding', 'Work note', 'Reply to the user', 'Questions asked in the chat', 'Commands run', 'Actions in the simulator', 'The laptop at submit'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['KB draft', 'Warm handoff', 'Print queues at submit', 'Handoff note'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  [QUESTIONS[0].text, QUESTIONS[4].text].forEach((text) => assert.ok(html.includes(pesc(text)), 'each question asked'));
  assert.ok(html.includes(pesc(`Browser extensions: ${saved.machine.browserExtensions.join(', ')}`)), 'the extensions at submit');
  assert.ok(html.includes(pesc(`Extensions removed: ${saved.machine.removedExtensions.join(', ')}`)), 'what was removed');
  assert.ok(html.includes('Real-time protection: on'));
  assert.ok(html.includes('Defender exclusions: (none)'));
  assert.ok(html.includes(pesc(`Allowed threats: ${ITEM.name} (Removed)`)), 'each allowed item\'s state');
  assert.ok(html.includes(pesc(`Running processes: ${saved.machine.running.join(', ')}`)));
  assert.ok(html.includes('Last quick scan: Just now'));
  // Module 5's panel is unchanged: no chat section, no protection lines.
  const m5 = { id: 'att-m05-9', lab_key: 'lab-its-03-prove-it', student_id: '9900000005-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70,
    result: { ...saved, labKey: 'lab-its-03-prove-it', events: saved.events.filter((e) => e.type !== 'caller_question'), machine: { startup: { 'App A': 'Enabled' }, installed: ['App A'], restarts: 0 } } };
  const m5Html = prun('itsProveReviewPanel')(m5);
  assert.match(m5Html, /The laptop at submit/);
  assert.doesNotMatch(m5Html, /data-its-prove-questions|Real-time protection|Browser extensions|Key finding/);
  // The rubric: five competencies, 100 points, the key finding required.
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-07-prove-v1');
  assert.equal(rubric.moduleKey, 'its-07');
  same(rubric.competencies.map((c) => c.points), [11, 28, 17, 28, 16]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  same(rubric.writing, { keyFinding: 600 });
  assert.equal(rubric.matrixFields, true);
  assert.equal(rubric.simulatorWork, true);
  assert.ok(prun('ITS_PROVE_EVENT_TYPES').includes('caller_question'));
}

/* ------------------------------------------------------------ Module 6 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-07'].number]`);
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

async function testModuleSixPageSubmit(work) {
  freshDb();
  const user = hdUser('m06prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its07-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  const link = /data-its07-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-07&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-07', nonce: 'm06prove-1234', student: studentOf(user), work };
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
  same(stored, clean(work, 'its-07', LAB).work, 'the cleaned work');
  // Submitted: the card opens nothing more and shows no score.
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its07-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its07-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m06-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testChat, testScreensAndCommandsRecordTheirComputer, testManagedFixRemovesTheProcess, testUnsafeRoutesAreRecordedAndNeverUndone, testPackageCarriesASmallSummary, testCiRunsThisFile]) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let work = null;
  try { work = safeWork(); report('safeWork'); } catch (error) { report('safeWork', error); }
  let saved = null;
  if (work) {
    try { saved = testPortalKeepsTheWork(work); report('testPortalKeepsTheWork'); } catch (error) { report('testPortalKeepsTheWork', error); }
  }
  if (saved) {
    for (const test of [testPrefillPutsTheLaptopBack, testReviewPanel]) {
      try { test(saved); report(test.name); } catch (error) { report(test.name, error); }
    }
  }
  if (work) {
    try { await testModuleSixPageSubmit(work); report('testModuleSixPageSubmit'); } catch (error) { report('testModuleSixPageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m06-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m06-prove: all ${passed} passed`);
})();

// Module 5 (key its-03) Prove It: one ticket on Module 3's one-ticket form,
// worked on one laptop with Module 5's Windows tool screens (ui/helpdesk.js,
// HD_PROVE_SHIFTS['its-03']), and the course page's side of it
// (portal/it-support-shared.js: the cleaner, the prefill, the review panel;
// portal/it-support-module-03.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, the Windows tools on the laptop.
//   - Each screen records its source once with the computer, and the same
//     check typed in PowerShell is recorded as a command with the computer.
//   - After a Restart, Event ID 100 shows the fast boot only once the startup
//     app the data names is off (disabled or uninstalled), and reading the log
//     again records its own source.
//   - The package carries a small Windows summary, not the whole machine, far
//     inside the course page's machine limit. Module 4's package is unchanged.
//   - The course page keeps the summary; a returned attempt puts the laptop
//     back (statuses, removed apps, restarts, boot time).
//   - The instructor reads the work note and the reply in full, every command,
//     the actions and the laptop at submit; Module 4's panel is unchanged.
//   - The page submits through recordLabAttempt; a failed write saves nothing.
//
// Structure only: nothing here says which choice or setting is right. Values
// are read from the shift data or picked by position; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-03-prove-it';
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
    log: (computer, log) => { run(`hdSelectComputer(${j(computer)})`); run(`hdWinEventSet(${j(computer)}, { log: ${j(log)}, level: '' })`); return run("VIEWS['helpdesk/event-viewer']()"); },
  };
}
const SHIFT = sim('its-03', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-03']))");
const SPEC = SHIFT.tickets[0];
const MAIN = SHIFT.selectedComputer;
const FIXTURE = SHIFT.machines[MAIN];
// The startup app the boot-time rule waits for, read from the data's rule,
// and the installed app whose startup entry it is.
const WAITS_FOR = FIXTURE.bootSecondsAfterFixNeeds.startupOff[0];
const ITS_APP = FIXTURE.installedApps.find((app) => app.startup === WAITS_FOR).name;
const CLASSES = sim('its-03', 'probe2').run('HD_PROVE_CLASSES.slice()');
const GROUPS = sim('its-03', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const WRITING = { resolutionNote: 'Synthetic note A: Reported / Tried / Result, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const sources = (tab) => tab.prove().opened.filter((s) => !s.startsWith('computer:') && !s.startsWith('screen:'));
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[1]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '3');
  tab.ctx.hdProveSetField('urgency', '2');
  tab.ctx.hdProveSetField('group', GROUPS[2]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Escalate');
  [SPEC.pathPool[0].id, SPEC.pathPool[7].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  tab.ctx.hdProveText('resolutionNote', WRITING.resolutionNote);
  tab.ctx.hdProveText('userReply', WRITING.userReply);
  tab.run('hdProveClose(hdState.tickets[0].id)');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m03', step: 2 })]]);
  const tab = sim('its-03', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-03-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 20);
  assert.equal(SHIFT.machineTools, true);
  assert.equal(SHIFT.windowsSummary, true);
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(SPEC.id), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(SPEC.pathPool.length, 13);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, 13, 'step ids are unique');
  assert.match(tab.run('hdProveLabels().resolutionHint'), /Next action$/, 'the note hint names all four parts');
  // Every card opens on its own and is recorded once.
  SPEC.evidence.forEach((card) => tab.ctx.hdProveOpenCard('card', card.id));
  tab.ctx.hdProveOpenCard('card', SPEC.evidence[0].id);
  same(sources(tab), SPEC.evidence.map((card) => `card:${card.id}`));
  // The laptop shows Module 5's tool screens and Restart; Get-Help lists no case commands.
  tab.run(`hdSelectComputer(${j(MAIN)})`);
  const desktop = tab.view('helpdesk/windows');
  ['pc-task-manager', 'settings-storage', 'settings-update', 'settings-apps', 'software-catalog', 'settings-recovery']
    .forEach((screen) => assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), screen));
  assert.match(desktop, /data-hd-restart-bar/);
  assert.doesNotMatch(tab.ps(MAIN, 'Get-Help'), /Windows: |Repair: /);
  // The Software Catalog is the shift's own list.
  same(tab.run(`hdSoftwareCatalog(hdState.machines[${j(MAIN)}])`), SHIFT.catalog);
}

function testScreensAndCommandsRecordTheirComputer() {
  const tab = sim('its-03', 'stu-sources');
  tab.screen(MAIN, 'pc-task-manager');
  tab.run(`hdWinTaskTab(${j(MAIN)}, 'startup')`);
  tab.run(`hdWinTaskTab(${j(MAIN)}, 'startup')`);
  tab.log(MAIN, 'application');
  tab.log(MAIN, 'diagnostics-performance');
  ['settings-apps', 'software-catalog', 'settings-storage', 'settings-update'].forEach((screen) => tab.screen(MAIN, screen));
  const opened = sources(tab);
  [`task-manager:${MAIN}:processes`, `task-manager:${MAIN}:startup`, `event-log:${MAIN}:application`, `event-log:${MAIN}:diagnostics-performance`,
    `installed-apps:${MAIN}`, `software-catalog:${MAIN}`, `storage:${MAIN}`, `windows-update:${MAIN}`]
    .forEach((source) => assert.ok(opened.includes(source), source));
  assert.equal(opened.length, new Set(opened).size, 'each source once');
  assert.ok(!opened.some((s) => s.endsWith(':after-restart')), 'no read-again source before a restart');
  // The same checks typed: the laptop's own answers, recorded with the computer.
  assert.match(tab.ps(MAIN, 'Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location'), new RegExp(FIXTURE.startupApps[0].name));
  assert.match(tab.ps(MAIN, 'Get-WinEvent -LogName Application -MaxEvents 20'), new RegExp(FIXTURE.events.application[0].id));
  assert.match(tab.ps(MAIN, 'Get-Volume -DriveLetter C | Select-Object SizeRemaining, Size'), /SizeRemaining/);
  const commands = tab.prove().events.filter((e) => e.type === 'command_run');
  assert.ok(commands.length >= 3 && commands.every((e) => e.computer === MAIN), 'each command is recorded with its computer');
}

function testBootTimeWaitsForTheStartupApp() {
  const bootSeconds = (tab) => tab.machine(MAIN).bootSeconds;
  // A restart with nothing changed keeps the slow boot, and reading the log
  // again after it is its own source.
  const plainRestart = sim('its-03', 'stu-boot-1');
  plainRestart.log(MAIN, 'diagnostics-performance');
  plainRestart.run(`hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(plainRestart), FIXTURE.bootSeconds, 'still the slow boot');
  plainRestart.log(MAIN, 'diagnostics-performance');
  assert.ok(sources(plainRestart).includes(`event-log:${MAIN}:diagnostics-performance:after-restart`), 'read again after the restart');
  assert.ok(plainRestart.prove().events.some((e) => e.type === 'action_taken' && e.value === 'restart' && e.computer === MAIN));
  assert.deepEqual([...plainRestart.toasts], [], 'no toast in a Prove It');
  // Another startup app off: still slow.
  const other = FIXTURE.startupApps.find((app) => app.name !== WAITS_FOR).name;
  plainRestart.run(`hdWinStartupSet(${j(MAIN)}, ${j(other)}, 'Disabled'); hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(plainRestart), FIXTURE.bootSeconds, 'another app off: still slow');
  // The named app disabled, then a restart: the fast boot, and the log lists
  // the latest boot and the first one.
  const disabled = sim('its-03', 'stu-boot-2');
  disabled.run(`hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Disabled')`);
  assert.equal(bootSeconds(disabled), FIXTURE.bootSeconds, 'no change until a restart');
  disabled.run(`hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(disabled), FIXTURE.bootSecondsAfterFix);
  const log = disabled.log(MAIN, 'diagnostics-performance');
  assert.ok(log.includes(`(${FIXTURE.bootSecondsAfterFix} s)`) && log.includes(`(${FIXTURE.bootSeconds} s)`), 'both boots listed');
  // Uninstalled instead (the app and its startup entry go): the same.
  const uninstalled = sim('its-03', 'stu-boot-3');
  uninstalled.run(`hdWinUninstall(${j(MAIN)}, ${j(ITS_APP)}); hdWinRestart(${j(MAIN)})`);
  assert.ok(!uninstalled.machine(MAIN).startupApps.some((app) => app.name === WAITS_FOR), 'the startup entry went with the app');
  assert.equal(bootSeconds(uninstalled), FIXTURE.bootSecondsAfterFix);
  // Turned back on before the restart: slow again.
  const reenabled = sim('its-03', 'stu-boot-4');
  reenabled.run(`hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Disabled'); hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Enabled'); hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(reenabled), FIXTURE.bootSeconds);
  // Fixed, restarted, then turned back on and restarted again: slow again.
  disabled.run(`hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Enabled'); hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(disabled), FIXTURE.bootSeconds, 'the cause back on: the slow boot is back');
  disabled.run(`hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Disabled'); hdWinRestart(${j(MAIN)})`);
  assert.equal(bootSeconds(disabled), FIXTURE.bootSecondsAfterFix, 'and off again: fast');
}

function testPackageCarriesASmallSummary() {
  const tab = sim('its-03', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const first = plain(tab.run('hdProvePackage()'));
  same(Object.keys(first.machine).sort(), ['bootSeconds', 'installed', 'restarts', 'startup', 'uptimeDays'], 'only the Windows summary');
  same(first.machine.installed, FIXTURE.installedApps.map((app) => app.name), 'every installed app by name');
  same(first.machine.startup, Object.fromEntries(FIXTURE.startupApps.map((app) => [app.name, app.status])));
  assert.equal(first.machine.restarts, 0);
  assert.ok(JSON.stringify(first.machine).length < 1024, 'far inside the 4 KB machine limit');
  // Changed: every startup app off, one app uninstalled, two restarts.
  FIXTURE.startupApps.forEach((app) => tab.run(`hdWinStartupSet(${j(MAIN)}, ${j(app.name)}, 'Disabled')`));
  tab.run(`hdWinUninstall(${j(MAIN)}, ${j(FIXTURE.installedApps[0].name)}); hdWinRestart(${j(MAIN)}); hdWinRestart(${j(MAIN)})`);
  const work = plain(tab.run('hdProvePackage()'));
  assert.ok(!work.machine.installed.includes(FIXTURE.installedApps[0].name), 'the uninstalled app is gone');
  assert.ok(Object.values(work.machine.startup).every((status) => status === 'Disabled'));
  assert.equal(work.machine.restarts, 2);
  assert.equal(work.machine.uptimeDays, 0);
  assert.equal(work.machine.bootSeconds, FIXTURE.bootSecondsAfterFix);
  assert.ok(work.events.some((e) => e.type === 'action_taken' && e.value === 'app-uninstalled' && e.computer === MAIN));
  assert.ok(work.events.some((e) => e.type === 'action_taken' && e.value === 'startup-disabled' && e.computer === MAIN));
  // Module 4's package is unchanged: the print-queue summary.
  same(Object.keys(plain(sim('its-02', 'stu-m4').run('hdProvePackage()')).machine), ['printQueues'], 'Module 4: the queue summary');
  return work;
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-03', LAB);
  assert.equal(reason, undefined);
  same(saved.machine, work.machine, 'the summary is kept as it came');
  assert.equal(saved.fields.priority, 'P4', 'Priority is the course page\'s own (3 x 2)');
  assert.ok(saved.events.some((e) => e.type === 'action_taken' && e.value === 'app-uninstalled'), 'the uninstall event is kept');
  assert.equal(saved.keyFinding, undefined, 'no Module 3 writing');
  assert.equal(clean({ ...work, labKey: 'lab-its-02-prove-it', rubricVersion: 'hdesk-its-02-prove-v1' }, 'its-03', LAB).reason, 'invalid', 'refused under another lab key');
  return saved;
}

function testPrefillPutsTheLaptopBack(saved) {
  const row = { completed_at: new Date(Date.now() + 60000).toISOString(), result: { source: 'mnt-prove-submit', ...saved } };
  const lastWork = plain(prun('itsProvePrefillWork')(row));
  const tab = sim('its-03', 'stu-prefill');
  assert.equal(tab.run('hdProvePrefill')(lastWork), true);
  const machine = tab.machine(MAIN);
  same(machine.installedApps.map((app) => app.name), saved.machine.installed, 'the uninstalled app stays uninstalled');
  same(Object.fromEntries(machine.startupApps.map((app) => [app.name, app.status])), saved.machine.startup, 'each startup app as it was');
  assert.equal(machine.restarts, saved.machine.restarts);
  assert.equal(machine.bootSeconds, saved.machine.bootSeconds);
  assert.match(tab.log(MAIN, 'diagnostics-performance'), new RegExp(`\\(${FIXTURE.bootSeconds} s\\)`), 'Event ID 100 still lists the first boot');
  same(plain(tab.run('hdProvePackage()')).machine, saved.machine, 'a resubmission sends the same summary');
  same(tab.prove().fields, saved.fields, 'every field');
  // Names the laptop doesn't have are ignored; nothing is invented.
  const stale = plain(lastWork);
  stale.machine = { startup: { 'Retired app': 'Disabled' }, installed: [...FIXTURE.installedApps.map((app) => app.name), 'Retired app'], restarts: 0 };
  const other = sim('its-03', 'stu-prefill-stale');
  assert.equal(other.run('hdProvePrefill')(stale), true);
  same(other.machine(MAIN).installedApps.map((app) => app.name), FIXTURE.installedApps.map((app) => app.name));
  same(other.machine(MAIN).startupApps.map((app) => app.status), FIXTURE.startupApps.map((app) => app.status));
  assert.equal(other.machine(MAIN).bootSeconds, FIXTURE.bootSeconds);
  // A boot time the laptop never shows isn't taken, restarted or not.
  [0, 2].forEach((restarts) => {
    const forged = plain(lastWork);
    forged.machine = { ...saved.machine, restarts, bootSeconds: 7 };
    const tab3 = sim('its-03', `stu-prefill-forged-${restarts}`);
    assert.equal(tab3.run('hdProvePrefill')(forged), true);
    assert.equal(tab3.machine(MAIN).bootSeconds, FIXTURE.bootSeconds, `forged boot time ignored (${restarts} restarts)`);
  });
  // A restored fast boot still goes back to slow if the cause is turned back on.
  const back = sim('its-03', 'stu-prefill-back');
  const fixed = plain(lastWork);
  fixed.machine = { ...saved.machine, startup: { ...saved.machine.startup, [WAITS_FOR]: 'Disabled' }, installed: FIXTURE.installedApps.map((app) => app.name), restarts: 1, bootSeconds: FIXTURE.bootSecondsAfterFix };
  assert.equal(back.run('hdProvePrefill')(fixed), true);
  assert.equal(back.machine(MAIN).bootSeconds, FIXTURE.bootSecondsAfterFix);
  back.run(`hdWinStartupSet(${j(MAIN)}, ${j(WAITS_FOR)}, 'Enabled'); hdWinRestart(${j(MAIN)})`);
  assert.equal(back.machine(MAIN).bootSeconds, FIXTURE.bootSeconds);
}

const LONG = {
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m05-1', lab_key: LAB, student_id: '9900000005-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  assert.match(html, /data-its-prove-simulator/);
  assert.match(html, /data-its-prove-windows/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>'), 'never raw');
  ['Work note', 'Reply to the user', 'Commands run', 'Actions in the simulator', 'The laptop at submit'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['Key finding', 'KB draft', 'Warm handoff', 'Print queues at submit'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  assert.ok(html.includes(pesc(`Installed apps: ${saved.machine.installed.join(', ')}`)), 'the installed apps at submit');
  assert.ok(html.includes(pesc(`Restarted: yes (${saved.machine.restarts} times)`)));
  assert.ok(html.includes(pesc(`Last boot time (Event ID 100): ${saved.machine.bootSeconds} s`)));
  Object.entries(saved.machine.startup).forEach(([name, status]) => assert.ok(html.includes(pesc(`${name} (${status})`)), name));
  // Module 4's panel is unchanged: its queues, no laptop section.
  const m4 = { id: 'att-m04-9', lab_key: 'lab-its-02-prove-it', student_id: '9900000004-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70,
    result: { ...saved, labKey: 'lab-its-02-prove-it', machine: { printQueues: { 'XP-01': { port: 'PORT-A', driver: 'Driver one', media: 'Size two', queued: 0, printed: 1, testPages: 1 } } } } };
  const m4Html = prun('itsProveReviewPanel')(m4);
  assert.match(m4Html, /Print queues at submit/);
  assert.ok(m4Html.includes(pesc('XP-01: port PORT-A, driver Driver one, paper Size two')));
  assert.doesNotMatch(m4Html, /data-its-prove-windows|The laptop at submit/);
  // The rubric: five competencies, 100 points.
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-03-prove-v1');
  same(rubric.competencies.map((c) => c.points), [11, 28, 28, 22, 11]);
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
}

/* ------------------------------------------------------------ Module 5 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-03'].number]`);
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

async function testModuleFivePageSubmit(work) {
  freshDb();
  const user = hdUser('m05prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its03-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  const link = /data-its03-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-03&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-03', nonce: 'm05prove-1234', student: studentOf(user), work };
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
  same(stored, clean(work, 'its-03', LAB).work, 'the cleaned work');
  // Submitted: the card opens nothing more and shows no score.
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its03-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its03-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m05-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testScreensAndCommandsRecordTheirComputer, testBootTimeWaitsForTheStartupApp, testCiRunsThisFile]) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let work = null;
  try { work = testPackageCarriesASmallSummary(); report('testPackageCarriesASmallSummary'); } catch (error) { report('testPackageCarriesASmallSummary', error); }
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
    try { await testModuleFivePageSubmit(work); report('testModuleFivePageSubmit'); } catch (error) { report('testModuleFivePageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m05-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m05-prove: all ${passed} passed`);
})();

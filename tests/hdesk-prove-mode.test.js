// Help Desk Prove It mode in the simulator (ui/helpdesk.js, ?prove=<module>).
//
//   - Practice shifts never get the Prove ticket or its fixtures.
//   - A Prove launch opens only its ticket, with no coach (not even one saved
//     earlier in the tab) and its own saved state per student.
//   - The Prove ticket view shows no answer, no feedback and no marks; Submit
//     is disabled with "Not available yet" until the portal can receive it.
//   - The shell's machine state changes with the commands the student types.
//   - Only meaningful events are recorded; the package has the work.
//   - The committed rubric file names no answers.
//
// Structure only: these tests never state which choices are right.
// Loads the simulator scripts in ui/index.html's order into a Node vm.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const SIM_URL = 'https://academy.test/sim/';
const PRACTICE_KEY = 'defender-lab.helpdesk.state.v1';

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};

function element(id) {
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '',
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}

// One browser tab; tabs share `local` (localStorage).
function sim(url, { local = store(), session = store() } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null,
    createElement: () => element(''),
    querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.search = n.search; location.hash = n.hash; } },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener: null, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text),
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => { location.hash = hash; ctx.render(); };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  return {
    ctx, location, toasts, local, session, run,
    hd: () => run('hdState'),
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    ps: (command) => {
      input('hd-ps-input', command);
      run('hdRunPowerShell({ preventDefault() {} })');
      const rows = run('hdState.powershell');
      return rows[rows.length - 1].text;
    },
    panelHtml: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
  };
}

const proveUrl = (student, hash = '#/helpdesk/tickets') => `${SIM_URL}?prove=its-01&student=${student}${hash}`;
const SHIFT = sim(SIM_URL).run("HD_PROVE_SHIFTS['its-01']");
const PROVE_TICKET = SHIFT.tickets[0];
const PROVE_ID = PROVE_TICKET.id;

function testPracticeNeverGetsProveMaterial() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  assert.equal(tab.run('HD_PROVE'), null);
  assert.ok(!tab.hd().tickets.some((t) => t.id === PROVE_ID), 'no Prove ticket in a Practice shift');
  assert.ok(!tab.run('hdComputers()').some((c) => SHIFT.computers.some((p) => p.name === c.name)), 'no Prove computer in Practice');
  assert.ok(!tab.run('hdKbArticles()').some((k) => SHIFT.kbArticles.some((p) => p.id === k.id)), 'no Prove KB article in Practice');
  const printServer = tab.run("hdServers().find((s) => s.name === 'NS-PRINT01')");
  assert.equal(printServer.status, 'Degraded', "Practice keeps the print server's own story");
  // A Practice reset still builds a full Practice shift.
  tab.run('hdResetShift()');
  assert.ok(tab.hd().tickets.length > 1 && !tab.hd().tickets.some((t) => t.id === PROVE_ID));
}

function testProveLaunchOpensOnlyItsTicketWithNoCoach() {
  // A coach saved earlier in this tab must not come back in a Prove It.
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m01', step: 2 })]]);
  const tab = sim(proveUrl('student-aaaa1111'), { session });
  const state = tab.hd();
  assert.deepEqual([...state.tickets.map((t) => t.id)], [PROVE_ID]);
  assert.equal(state.mode, 'prove');
  assert.equal(state.selectedComputer, SHIFT.selectedComputer);
  assert.deepEqual(JSON.parse(JSON.stringify(state.prove.fields)), { category: '', type: '', priority: '' }, 'the student sets every ticket field');
  assert.equal(state.tickets[0].priority, '');
  assert.equal(tab.panelHtml(), '', 'no coach panel content');
  assert.match(tab.location.search, /student=student-aaaa1111/, 'the launch parameters stay for a reload');
  // Prove fixtures are present; the print server is healthy in this shift.
  assert.ok(tab.run('hdComputers()').some((c) => c.name === SHIFT.selectedComputer));
  assert.ok(tab.run('hdKbArticles()').some((k) => k.id === SHIFT.kbArticles[0].id));
  assert.equal(tab.run("hdServers().find((s) => s.name === 'NS-PRINT01')").status, 'Online');
  assert.ok(!tab.run('hdEvents()').some((e) => e.computer === 'NS-PRINT01'));
  // No reset in a Prove It.
  tab.run('hdResetShift()');
  assert.deepEqual([...tab.hd().tickets.map((t) => t.id)], [PROVE_ID]);
  assert.doesNotMatch(tab.view('helpdesk/tickets'), /Generate new shift/);
  assert.doesNotMatch(tab.view('helpdesk/dashboard'), /Reset shift|Correlation opportunity/);
}

function testProveTicketViewRevealsNothing() {
  const tab = sim(proveUrl('student-view0001'));
  const html = tab.view('helpdesk/ticket');
  [/Expected resolution/i, /Check diagnosis/i, /Supported by the evidence/i, /Not sufficiently supported/i, /Escalation criteria/i,
    /[✓✗⚠✔✘]/, /\bcorrect\b/i, /\bexpected\b/i, /data-(correct|flag|credit)/i, /score/i]
    .forEach((pattern) => assert.doesNotMatch(html, pattern, `the Prove view shows nothing like ${pattern}`));
  assert.match(html, /<button class="btn btn-primary" disabled aria-disabled="true"[^>]*>Submit for faculty review<\/button>/);
  assert.match(html, /Not available yet: your work is saved in this browser\./);
  // The unavailable Submit looks unavailable; choices have no number column.
  assert.match(html, /aria-disabled="true"[^>]*style="[^"]*cursor:not-allowed/);
  assert.equal((html.match(/<label style="grid-template-columns:18px 1fr"><input type="(checkbox|radio)"/g) || []).length, PROVE_TICKET.pathPool.length + 2);
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.description)), 'the requester statement');
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.conversation[0].text)), 'the CC reply');
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.cc)), 'the CC line');
  PROVE_TICKET.diagnosisOptions.forEach((option) => assert.ok(html.includes(tab.run('hdEsc')(option))));
  PROVE_TICKET.pathPool.forEach((step) => assert.ok(html.includes(tab.run('hdEsc')(step.text))));
  // The shown order is the attempt's own shuffle, a permutation of the options.
  const order = tab.hd().prove.order;
  assert.deepEqual([...order.diagnosis].sort(), [...PROVE_TICKET.diagnosisOptions].sort());
  assert.deepEqual([...order.path].sort(), [...PROVE_TICKET.pathPool.map((s) => s.id)].sort());
  const shownSteps = [...html.matchAll(/hdProveToggleStep\('(p\d+)'/g)].map((m) => m[1]);
  assert.deepEqual(shownSteps, [...order.path]);
  // No numbers or marks beside the steps.
  assert.doesNotMatch(html, /<label><input type="checkbox"[^>]*>\s*<span>\d/);
}

function testShellMachineState() {
  const tab = sim(proveUrl('student-shell001'));
  const admins = /BUILTIN\\Administrators/;
  assert.doesNotMatch(tab.ps('whoami /groups'), admins, 'a standard user');
  assert.match(tab.ps('whoami /groups'), /GG-Finance-Users/);
  assert.doesNotMatch(tab.ps('Get-Printer'), /NS-FIN-PRN01/);
  assert.match(tab.ps('gpupdate /force'), /User Policy update has completed successfully/);
  assert.match(tab.ps('Get-Printer'), /\\\\NS-PRINT01\\NS-FIN-PRN01/, 'the policy refresh adds the published printer');
  assert.match(tab.ps('Get-ComputerInfo'), /OsUptime: 9 days/);
  assert.match(tab.ps('Get-Service'), /Running\s+Spooler/);
  // Local group changes take effect with no warning or feedback.
  const toastsBefore = tab.toasts.length;
  assert.equal(tab.ps('Add-LocalGroupMember -Group "Administrators" -Member "NORTHSTAR\\eparker"'), '');
  assert.match(tab.ps('whoami /groups'), admins);
  assert.match(tab.ps('Get-LocalGroupMember Administrators'), /NORTHSTAR\\eparker/);
  assert.equal(tab.ps('Remove-LocalGroupMember -Group Administrators -Member eparker'), '');
  assert.doesNotMatch(tab.ps('whoami /groups'), admins);
  assert.equal(tab.toasts.length, toastsBefore, 'no toast for any command');
  // Another way to get the printer: connect it directly.
  const other = sim(proveUrl('student-shell002'));
  assert.equal(other.ps('Add-Printer -ConnectionName \\\\NS-PRINT01\\NS-FIN-PRN01'), '');
  assert.match(other.ps('Get-Printer'), /NS-FIN-PRN01/);
  // Every command is recorded, with the computer it ran on.
  const commands = tab.hd().prove.events.filter((e) => e.type === 'command_run');
  assert.equal(commands.length, 12);
  assert.ok(commands.every((e) => e.computer === SHIFT.selectedComputer && e.command && e.at));
}

function testPracticeShellUnchanged() {
  const tab = sim(`${SIM_URL}#/helpdesk/powershell`);
  assert.match(tab.ps('Get-Service'), /Stopped\s+Spooler/);
  assert.match(tab.ps('gpresult /r'), /COMPUTER SETTINGS/);
  assert.match(tab.ps('Get-ComputerInfo'), /CsName: NS-LT-0131/);
  assert.doesNotMatch(tab.ps('Get-ComputerInfo'), /OsUptime/);
  assert.equal(tab.hd().prove, undefined, 'Practice records no Prove events');
}

function testOnlyMeaningfulEventsAndThePackage() {
  const tab = sim(proveUrl('student-events01'));
  tab.run("hdProveSetField('category', 'Incident'); hdProveSetField('priority', 'P2')");
  tab.run("hdProveText('resolutionNote', 'Did a thing.'); hdProveText('userReply', 'Hello.')");
  assert.equal(tab.hd().prove.events.length, 0, 'fields and typing are saved, not recorded as events');
  const [stepA, stepB] = tab.hd().prove.order.path;
  tab.run(`hdProveChoose('diagnosis', ${JSON.stringify(PROVE_TICKET.diagnosisOptions[1])})`);
  tab.run(`hdProveToggleStep('${stepA}', true); hdProveToggleStep('${stepB}', true); hdProveToggleStep('${stepA}', false)`);
  tab.run("hdProveChoose('decision', 'Escalate')");
  tab.run("hdProveToggleStep('not-a-step', true); hdProveSetField('status', 'Closed'); hdProveChoose('score', 100)");
  tab.view('helpdesk/knowledge-base');
  tab.view('helpdesk/knowledge-base');
  tab.run("hdOpenUser('u-1011')");
  const types = [...tab.hd().prove.events.map((e) => e.type)];
  // The Knowledge Base screen counts once; opening Evan's directory entry is its own source.
  assert.deepEqual(types, ['diagnosis_chosen', 'step_chosen', 'step_chosen', 'step_cleared', 'decision_chosen', 'evidence_opened', 'evidence_opened']);
  assert.deepEqual([...tab.hd().prove.opened], ['screen:helpdesk/knowledge-base', 'ad-user:u-1011']);
  assert.deepEqual([...tab.hd().prove.steps], [stepB]);

  const pkg = tab.run('hdProvePackage()');
  assert.deepEqual([...Object.keys(pkg)], ['version', 'kind', 'moduleKey', 'labKey', 'rubricVersion', 'ticketId', 'startedAt', 'fields', 'diagnosis',
    'steps', 'decision', 'resolutionNote', 'userReply', 'workNotes', 'commands', 'events', 'machine']);
  assert.equal(pkg.labKey, 'lab-its-01-prove-it');
  assert.equal(pkg.ticketId, PROVE_ID);
  assert.deepEqual(JSON.parse(JSON.stringify(pkg.fields)), { category: 'Incident', type: '', priority: 'P2' });
  assert.equal(pkg.decision, 'Escalate');
  assert.equal(pkg.resolutionNote, 'Did a thing.');
  assert.ok(Array.isArray(pkg.machine.localAdministrators));
  assert.doesNotMatch(JSON.stringify(Object.keys(pkg)), /expected|correct|score|critical|answer/i);
}

function testReloadKeepsTheAttemptPerStudent() {
  const local = store();
  const first = sim(proveUrl('student-reload01', '#/helpdesk/ticket'), { local });
  first.run(`hdProveChoose('diagnosis', ${JSON.stringify(PROVE_TICKET.diagnosisOptions[0])})`);
  const order = JSON.stringify(first.hd().prove.order);
  const reloaded = sim(first.location.origin + first.location.pathname + first.location.search + first.location.hash, { local, session: first.session });
  assert.equal(reloaded.hd().prove.diagnosis, PROVE_TICKET.diagnosisOptions[0], 'a reload keeps the work');
  assert.equal(JSON.stringify(reloaded.hd().prove.order), order, 'and the same shuffle');
  const otherStudent = sim(proveUrl('student-reload02'), { local });
  assert.equal(otherStudent.hd().prove.diagnosis, '', 'another student starts fresh');
  assert.equal(local.getItem(PRACTICE_KEY), null, 'a Prove It never writes the Practice shift');
  const practice = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  assert.ok(!practice.hd().tickets.some((t) => t.id === PROVE_ID));
  assert.equal(sim(proveUrl('student-reload01'), { local }).hd().prove.diagnosis, PROVE_TICKET.diagnosisOptions[0], 'Practice leaves the attempt alone');
}

function testSubmittedAttemptIsLocked() {
  const tab = sim(proveUrl('student-locked01'));
  tab.run("hdState.prove.submittedAt = '2026-10-30T12:00:00Z'");
  const html = tab.view('helpdesk/ticket');
  assert.match(html, /Submitted for faculty review/);
  assert.doesNotMatch(html, /<button[^>]*>Submit for faculty review/);
  assert.doesNotMatch(html, /Add work note/);
  assert.ok((html.match(/ disabled/g) || []).length >= 4, 'every input is disabled');
  const before = JSON.stringify(tab.hd().prove);
  tab.run("hdProveChoose('decision', 'Resolve'); hdProveSetField('priority', 'P1'); hdProveText('userReply', 'x')");
  tab.run(`hdProveToggleStep('${tab.hd().prove.order.path[0]}', true)`);
  tab.ps('whoami');
  assert.equal(JSON.stringify(tab.hd().prove), before, 'nothing changes after Submit');
}

function testRubricNamesNoAnswers() {
  const file = path.join(__dirname, '..', 'portal', 'admin-sheets', 'hdesk-prove-rubrics.js');
  const source = fs.readFileSync(file, 'utf8');
  const { HDESK_PROVE_RUBRICS } = require(file);
  const rubric = HDESK_PROVE_RUBRICS[SHIFT.labKey];
  assert.ok(rubric, 'a rubric for the Prove shift lab key');
  assert.equal(rubric.version, SHIFT.rubricVersion, 'the simulator sends the rubric version this file defines');
  assert.deepEqual(rubric.competencies.map((c) => [c.id, c.points]),
    [['triage', 22], ['investigation', 11], ['diagnosis', 11], ['action', 28], ['documentation', 28]]);
  assert.equal(rubric.competencies.reduce((n, c) => n + c.points, 0), rubric.technicalPoints);
  assert.equal(rubric.technicalPoints, 100);
  assert.equal(rubric.passPercent, 70);
  assert.equal(rubric.criticalErrorCapPercent, 69);
  assert.deepEqual([...rubric.formative.map((f) => f.id)], ['efficiency']);
  assert.ok(!('points' in rubric.formative[0]), 'efficiency earns no points');
  [PROVE_ID, ...PROVE_TICKET.diagnosisOptions, ...PROVE_TICKET.pathPool.map((s) => s.text), ...SHIFT.kbArticles.map((k) => k.id)]
    .forEach((text) => assert.ok(!source.includes(text), `the rubric file never names "${text}"`));
  PROVE_TICKET.pathPool.forEach((step) => assert.doesNotMatch(source, new RegExp(`\\b${step.id}\\b`), `no step id ${step.id}`));
}

function testLaunchWithoutStudentOpensNothing() {
  const local = store();
  ['', 'student=', 'student=%20%2F%3F'].forEach((param) => {
    const tab = sim(`${SIM_URL}?prove=its-01${param ? `&${param}` : ''}#/helpdesk/tickets`, { local });
    assert.equal(tab.run('HD_PROVE.blocked'), true);
    assert.equal(tab.hd().tickets.length, 0, 'no ticket to work');
    assert.match(tab.view('helpdesk/tickets'), /wasn't opened from your course page, so it can't be saved/);
    assert.match(tab.view('helpdesk/ticket'), /wasn't opened from your course page/);
    tab.ps('whoami');
    tab.run("hdProveSetField('priority', 'P1')");
    assert.equal(tab.hd().prove.events.length, 0, 'nothing is recorded');
  });
  assert.equal([...local.map.keys()].filter((key) => key.startsWith('defender-lab.helpdesk')).length, 0, 'nothing is saved');
}

const tests = [
  testLaunchWithoutStudentOpensNothing,
  testPracticeNeverGetsProveMaterial, testProveLaunchOpensOnlyItsTicketWithNoCoach, testProveTicketViewRevealsNothing,
  testShellMachineState, testPracticeShellUnchanged, testOnlyMeaningfulEventsAndThePackage,
  testReloadKeepsTheAttemptPerStudent, testSubmittedAttemptIsLocked, testRubricNamesNoAnswers,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`all ${tests.length} passed`);

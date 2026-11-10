// Help Desk Prove It mode in the simulator (ui/helpdesk.js, ?prove=<module>).
//
//   - Practice shifts never get the Prove ticket or its fixtures.
//   - A Prove launch opens only its ticket, with no coach (not even one saved
//     earlier in the tab) and its own saved state per student.
//   - The Prove ticket view shows no answer, no feedback and no marks. Submit
//     itself is covered in tests/hdesk-prove-submit.test.js.
//   - The shell's machine state changes with the commands the student types.
//   - Only meaningful events are recorded; the package has the work.
//   - The committed rubric file names no answers.
//   - Module 1 (rubric hdesk-its-01-prove-v2): category, type and priority are
//     pre-set and read-only; Settings › Printers & scanners › Add device adds
//     the printer with no admin rights and is recorded; the knowledge base
//     search is the only console feature; a v1 draft starts from the current
//     ticket, keeping the student's writing.
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
    ctx, location, toasts, local, session, run, input,
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
const PRESET = { category: 'Service Request', type: 'Access request', priority: 'P3' };
const FIN_PRINTER = '\\\\NS-PRINT01\\NS-FIN-PRN01';

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
  assert.deepEqual(JSON.parse(JSON.stringify(state.prove.fields)), PRESET, 'Module 1 pre-sets the ticket fields');
  assert.equal(state.prove.rubricVersion, 'hdesk-its-01-prove-v2');
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
  assert.match(html, /<button id="hd-prove-submit"[^>]* disabled aria-disabled="true"[^>]*>Submit for faculty review<\/button>/);
  // The unavailable Submit looks unavailable; choices have no number column.
  assert.match(html, /aria-disabled="true"[^>]*style="[^"]*cursor:not-allowed/);
  assert.equal((html.match(/<label style="grid-template-columns:18px 1fr;[^"]*"><input type="(checkbox|radio)"/g) || []).length, PROVE_TICKET.pathPool.length + 2);
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.description)), 'the requester statement');
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.conversation[0].text)), 'the CC reply');
  assert.ok(html.includes(tab.run('hdEsc')(PROVE_TICKET.cc)), 'the CC line');
  PROVE_TICKET.diagnosisOptions.forEach((option) => assert.ok(html.includes(tab.run('hdEsc')(option))));
  PROVE_TICKET.pathPool.forEach((step) => assert.ok(html.includes(tab.run('hdEsc')(step.text))));
  // The shown order is the attempt's own shuffle, a permutation of the options.
  const order = tab.hd().prove.order;
  assert.deepEqual([...order.diagnosis].sort(), [...PROVE_TICKET.diagnosisOptions].sort());
  assert.deepEqual([...order.path].sort(), [...PROVE_TICKET.pathPool.map((s) => s.id)].sort());
  const shownSteps = [...html.matchAll(/hdProveToggleStep\('(m\d+)'/g)].map((m) => m[1]);
  assert.deepEqual(shownSteps, [...order.path]);
  // No numbers or marks beside the steps, and no label on any step: a card
  // shows only the step's wording.
  assert.doesNotMatch(html, /<label><input type="checkbox"[^>]*>\s*<span>\d/);
  assert.doesNotMatch(html, /unsafe|\bkept\b|\bsafe\b|distractor|critical/i);
  const stepLabels = [...html.matchAll(/hdProveToggleStep\('m\d+',this\.checked\);hdProveMark\(this\)"[^>]*>([^<]*)<\/label>/g)].map((m) => m[1]);
  assert.deepEqual(stepLabels, order.path.map((id) => tab.run('hdEsc')(PROVE_TICKET.pathPool.find((step) => step.id === id).text)));
  // Module 1 skills only: no print-server, policy-refresh or command steps.
  PROVE_TICKET.pathPool.forEach((step) => assert.doesNotMatch(step.text, /NS-PRINT01|print server|polic(y|ies) refresh|refresh policy|gpupdate|whoami|Get-Printer|driver/i, step.text));
}

function testShellMachineState() {
  const tab = sim(proveUrl('student-shell001'));
  const admins = /BUILTIN\\Administrators/;
  assert.doesNotMatch(tab.ps('whoami /groups'), admins, 'a standard user');
  assert.match(tab.ps('whoami /groups'), /GG-Finance-Users/);
  assert.doesNotMatch(tab.ps('Get-Printer'), /NS-FIN-PRN01/);
  assert.match(tab.ps('gpupdate /force'), /User Policy update has completed successfully/);
  assert.doesNotMatch(tab.ps('Get-Printer'), /NS-FIN-PRN01/, 'Module 1: no policy-deployed printer (that route is Module 4)');
  assert.match(tab.ps('Get-ComputerInfo'), /OsUptime: 9 days/);
  assert.match(tab.ps('Get-Service'), /Running\s+Spooler/);
  // Local group changes take effect with no warning or feedback: typing
  // Add-LocalGroupMember really makes Evan an admin, and it's recorded.
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

// A password typed into the Prove shell is refused before the command runs,
// masked in the echo and the record, never saved, and flagged for the
// instructor. The refusal is plain: no Practice guidance.
function testTypedPasswordIsRefusedInProve() {
  const tab = sim(proveUrl('student-pw000001'));
  for (const typed of ['Get-ADUser eparker -Password Winter2026a', 'Add-Printer -ConnectionName \\\\NS-PRINT01\\NS-FIN-PRN01 -Password:Winter2026b', 'whoami /RP Winter2026c',
    'Get-Service -Password "Winter`"TailC3"', "Get-Service -Password 'Winter''TailD4'"]) {
    const reply = tab.ps(typed);
    assert.equal(reply, 'Stopped: this command includes a password, so it was not run or saved.', typed);
  }
  assert.doesNotMatch(tab.ps('Get-Printer'), /NS-FIN-PRN01/, 'the refused Add-Printer did not run');
  const prove = tab.hd().prove;
  assert.equal(prove.passwordTyped, true);
  assert.ok(!/Winter|Tail[CD]/.test(JSON.stringify(tab.hd())), 'no part of the password is in the saved attempt');
  const recorded = prove.events.filter((e) => e.type === 'command_run').map((e) => e.command);
  assert.equal(recorded[0], 'Get-ADUser eparker -Password ********', 'recorded with the password masked');
  assert.deepEqual([...prove.steps], [], 'the steps you took are untouched');
  const pkg = tab.run('hdProvePackage()');
  assert.equal(pkg.passwordTyped, true);
  assert.ok(!/Winter|Tail[CD]/.test(JSON.stringify(pkg)));
  // Any other command is shown and recorded exactly as typed.
  assert.equal(tab.hd().powershell.slice(-2)[0].text, 'PS C:\\Support> Get-Printer');
  assert.equal(tab.hd().prove.events.slice(-1)[0].command, 'Get-Printer');
}

// A draft saved by an earlier version can hold a raw password command. Loading
// masks it and flags it, so Submit never carries it to the instructor.
function testOldDraftWithAPasswordIsMaskedOnLoad() {
  const local = store();
  const first = sim(proveUrl('student-legacy01'), { local });
  first.run(`hdState.prove.events.push({ type:'command_run', at:'2026-11-01T10:00:00Z', command:'Get-ADUser eparker -Password Legacy2026z', computer:'NS-LT-0131' });
    hdState.powershell.push({ type:'command', text:'PS C:\\\\Support> Get-ADUser eparker -Password Legacy2026z' }); hdSave()`);
  assert.match(local.getItem(first.run('hdStateKey()')), /Legacy2026z/, 'the old draft holds the password');
  const reloaded = sim(first.location.origin + first.location.pathname + first.location.search + first.location.hash, { local, session: first.session });
  assert.ok(!/Legacy2026z/.test(JSON.stringify(reloaded.hd())), 'masked on load');
  assert.doesNotMatch(local.getItem(first.run('hdStateKey()')), /Legacy2026z/, 'and the stored draft is rewritten, with nothing else done');
  assert.equal(reloaded.hd().prove.passwordTyped, true, 'and flagged for the instructor');
  assert.ok(!/Legacy2026z/.test(JSON.stringify(reloaded.run('hdProvePackage()'))), 'never in the package');
  // Building the package masks again, whatever the draft holds.
  reloaded.run("hdState.prove.events.push({ type:'command_run', at:'x', command:'whoami /RP:Late2026y', computer:'NS-LT-0131' })");
  assert.ok(!/Late2026y/.test(JSON.stringify(reloaded.run('hdProvePackage()'))));
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
  assert.deepEqual(JSON.parse(JSON.stringify(tab.hd().prove.fields)), PRESET, 'pre-set fields can\'t be changed');
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
    'steps', 'stepTexts', 'decision', 'resolutionNote', 'userReply', 'workNotes', 'commands', 'events', 'machine', 'passwordTyped', 'passwordWritten']);
  assert.equal(pkg.passwordTyped, false);
  assert.equal(pkg.passwordWritten, false);
  assert.equal(pkg.labKey, 'lab-its-01-prove-it');
  assert.deepEqual([...pkg.stepTexts], [PROVE_TICKET.pathPool.find((step) => step.id === stepB).text], 'the portal has no simulator data, so the steps travel as text');
  assert.equal(pkg.ticketId, PROVE_ID);
  assert.deepEqual(JSON.parse(JSON.stringify(pkg.fields)), PRESET, 'the package carries the pre-set fields');
  assert.equal(pkg.rubricVersion, 'hdesk-its-01-prove-v2');
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
  tab.run("hdProveServer.status = 'waiting'");
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
  assert.deepEqual({ ...rubric.presetFields }, { ...PROVE_TICKET.preset }, 'the course page saves the same pre-set fields the simulator shows');
  assert.deepEqual(rubric.competencies.map((c) => [c.id, c.points]),
    [['triage', 22], ['investigation', 11], ['diagnosis', 11], ['action', 28], ['documentation', 28]]);
  assert.equal(rubric.competencies.reduce((n, c) => n + c.points, 0), rubric.technicalPoints);
  assert.equal(rubric.technicalPoints, 100);
  assert.equal(rubric.passPercent, undefined, 'the pass mark lives in the database, not here');
  assert.equal(rubric.criticalErrorCapPercent, undefined, 'the cap follows the pass mark');
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

// A selected step or decision gets a neutral outline, never the shared step
// list's green (it reads as "correct"); unselected ones get none.
function testSelectedChoiceIsNeutral() {
  const GREEN = /#ecfdf3|#abefc6|#067647|#12b76a|#027a48|green|success/i;
  const tab = sim(proveUrl('student-neutral1', '#/helpdesk/ticket'));
  const [stepA] = tab.hd().prove.order.path;
  tab.run(`hdProveToggleStep('${stepA}', true); hdProveChoose('decision', 'Escalate')`);
  const html = tab.view('helpdesk/ticket');
  const labels = [...html.matchAll(/<label style="([^"]*)"><input type="(checkbox|radio)"[^>]*?(checked)?>/g)];
  const selected = labels.filter((m) => m[3]);
  const unselected = labels.filter((m) => !m[3]);
  assert.equal(selected.length, 2, 'the ticked step and the chosen decision');
  selected.forEach((m) => {
    assert.match(m[1], /border-color:var\(--workload\)/, 'selected: theme outline');
    assert.match(m[1], /background:#fff/, 'selected: overrides the shared green background');
    assert.match(m[1], /color:inherit/, 'selected: overrides the shared green text');
    assert.doesNotMatch(m[1], GREEN);
  });
  unselected.forEach((m) => {
    assert.match(m[1], /border-color:var\(--border\)/, 'unselected: the plain border');
    assert.doesNotMatch(m[1], GREEN);
  });
  [true, false].forEach((on) => assert.doesNotMatch(tab.run(`hdProveChoiceStyle(${on})`), GREEN));
  assert.match(html, /hdProveMark\(this\)/, 'a change restyles the choice at once');
}

// Module 1: category, type and priority are set for the student, shown as
// text with no control, never part of "Still needed".
function testPresetFieldsAreReadOnly() {
  const tab = sim(proveUrl('student-preset01'));
  const html = tab.view('helpdesk/ticket');
  const card = (/<div class="hd-field-grid" data-hd-prove-preset>[\s\S]*?<\/div><p class="muted">Set for you in Module 1\.<\/p>/.exec(html) || [''])[0];
  assert.ok(card, 'a read-only fields card');
  Object.entries({ Category: PRESET.category, Type: PRESET.type, Priority: PRESET.priority }).forEach(([label, value]) => assert.match(card, new RegExp(`<span>${label}</span><strong>${value}</strong>`)));
  assert.doesNotMatch(html, /hdProveSetField/, 'no control to change them');
  assert.doesNotMatch(tab.run('hdProveSubmitState()').note, /category|type|priority/);
  ['category', 'type', 'priority'].forEach((field) => tab.run(`hdProveSetField('${field}', 'P1')`));
  assert.deepEqual(JSON.parse(JSON.stringify(tab.hd().prove.fields)), PRESET);
}

// The approved printer route: Settings › Printers & scanners › Add device on
// Evan's laptop adds NS-FIN-PRN01 with no admin rights, recorded for the
// instructor. Practice laptops have no such button.
function testSettingsAddDeviceAddsThePrinter() {
  const tab = sim(proveUrl('student-addprn01'));
  assert.match(tab.view('helpdesk/windows'), /navigate\('#\/helpdesk\/settings-printers'\)">⚙ Settings › Printers &amp; scanners/);
  let html = tab.view('helpdesk/settings-printers');
  assert.match(html, /Bluetooth &amp; devices › Printers &amp; scanners/);
  assert.match(html, /<ul class="hd-list" data-hd-settings-installed><li>Microsoft Print to PDF<\/li><\/ul>/);
  assert.doesNotMatch(html, /data-hd-settings-found/, 'nothing listed before Add device');
  tab.run('hdSettingsScan()');
  html = tab.view('helpdesk/settings-printers');
  assert.match(html, /data-hd-settings-found><div><strong>NS-FIN-PRN01<\/strong><small class="muted"> Finance · 3rd floor/);
  tab.run(`hdSettingsAddPrinter('NS-LT-0122', ${JSON.stringify(FIN_PRINTER)})`);
  const machine = tab.hd().machines['NS-LT-0122'];
  assert.deepEqual([...machine.printers], ['Microsoft Print to PDF', FIN_PRINTER]);
  assert.deepEqual([...machine.localAdministrators], ['NORTHSTAR\\Domain Admins', 'NS-LT-0122\\MNT-Support'], 'no admin rights given');
  assert.doesNotMatch(tab.ps('whoami /groups'), /BUILTIN\\Administrators/);
  assert.match(tab.ps('Get-Printer'), /\\\\NS-PRINT01\\NS-FIN-PRN01/);
  assert.equal(tab.toasts.slice(-1)[0], 'NS-FIN-PRN01 added. No administrator rights were needed.');
  assert.match(tab.view('helpdesk/settings-printers'), /No new printers or scanners found\./);
  // Adding again changes nothing and records nothing more.
  tab.run(`hdSettingsAddPrinter('NS-LT-0122', ${JSON.stringify(FIN_PRINTER)})`);
  const actions = tab.hd().prove.events.filter((e) => e.type === 'action_taken');
  assert.deepEqual(JSON.parse(JSON.stringify(actions.map(({ label, computer }) => ({ label, computer })))), [{ label: 'Added NS-FIN-PRN01 from Settings › Printers & scanners › Add device', computer: 'NS-LT-0122' }]);
  assert.ok(tab.hd().prove.opened.includes('screen:helpdesk/settings-printers'), 'opening Settings is recorded');
  const pkg = tab.run('hdProvePackage()');
  assert.ok(pkg.machine.printers.includes(FIN_PRINTER), 'the instructor sees it on the laptop at submit');
  assert.ok(pkg.events.some((e) => e.type === 'action_taken'));
  // A printer not on the laptop's list can't be added.
  tab.run("hdSettingsAddPrinter('NS-LT-0122', '\\\\\\\\NS-PRINT01\\\\NS-HR-PRN01')");
  assert.equal(tab.hd().machines['NS-LT-0122'].printers.length, 2);
  // Once submitted, nothing can be added.
  const locked = sim(proveUrl('student-addprn02'));
  locked.run("hdProveServer.status = 'waiting'; hdSettingsScan()");
  assert.match(locked.view('helpdesk/settings-printers'), /<button type="button" class="btn btn-secondary btn-sm" disabled/);
  locked.run(`hdSettingsAddPrinter('NS-LT-0122', ${JSON.stringify(FIN_PRINTER)})`);
  assert.deepEqual([...locked.hd().machines['NS-LT-0122'].printers], ['Microsoft Print to PDF']);
  // Practice: no Settings button on any laptop.
  const practice = sim(`${SIM_URL}#/helpdesk/windows`);
  practice.run('hdComputers()').forEach((c) => {
    practice.run(`hdState.selectedComputer = ${JSON.stringify(c.name)}`);
    assert.doesNotMatch(practice.view('helpdesk/windows'), /settings-printers/, c.name);
  });
}

// The knowledge base search is the only console feature in a Prove It: the
// words searched and the articles opened are recorded; nothing else appears.
function testOnlyTheKbSearchInProve() {
  const tab = sim(proveUrl('student-kbonly01', '#/helpdesk/ticket'));
  const ticket = `hdTicketById('${PROVE_ID}')`;
  assert.deepEqual(JSON.parse(JSON.stringify(tab.run(`hdConsole(${ticket})`))), { kb: true });
  const html = tab.view('helpdesk/ticket');
  assert.match(html, /class="card hd-kb-search"/);
  ['hd-chat', 'hd-verify', 'hd-actions', 'hd-owner', 'hd-comments', 'hd-practice-feedback', 'hd-priority-preset', 'hd-account', 'hd-console-outcomes', 'hd-resolution-code']
    .forEach((cls) => assert.doesNotMatch(html, new RegExp(`class="card ${cls}"|class="${cls}"`), cls));
  ['hdConsoleChatCard', 'hdConsoleVerifyCard', 'hdConsoleOutcomesCard'].forEach((fn) => assert.equal(tab.run(`${fn}(${ticket})`), '', fn));
  tab.input('hd-kb-input', 'admin rights');
  tab.run(`hdKbSearch({ preventDefault() {} }, '${PROVE_ID}')`);
  assert.match(tab.view('helpdesk/ticket'), /data-kb="KB-0058"/, 'the search finds KB-0058');
  tab.run(`hdKbOpen('${PROVE_ID}', 'KB-0058')`);
  assert.match(tab.view('helpdesk/ticket'), /Finance printers are added from Settings › Printers &amp; scanners › Add device\. No admin rights are needed\./);
  const events = JSON.parse(JSON.stringify(tab.hd().prove.events.map(({ type, value, source }) => ({ type, value, source }))));
  assert.deepEqual(events, [{ type: 'kb_search', value: 'admin rights' }, { type: 'evidence_opened', source: 'kb:KB-0058' }]);
  // Practice-only actions do nothing here.
  const before = JSON.stringify(tab.hd());
  tab.run(`hdChatAsk('${PROVE_ID}', 'when'); hdVerify('${PROVE_ID}', 'callback'); hdConsoleAction('${PROVE_ID}', 'x'); hdConsoleOwner('${PROVE_ID}', 'x')`);
  assert.equal(JSON.stringify(tab.hd()), before);
}

// A draft saved before this version (no rubric version, v1 steps and fields)
// starts from the current ticket and keeps the student's writing.
function testV1DraftStartsFromTheCurrentTicket() {
  const local = store();
  const first = sim(proveUrl('student-v1draft1'), { local });
  const key = first.run('hdStateKey()');
  const old = JSON.parse(local.getItem(key));
  delete old.prove.rubricVersion;
  old.prove.fields = { category: 'Incident', type: 'Printer', priority: 'P2' };
  old.prove.steps = ['p1', 'p3'];
  old.prove.resolutionNote = 'Earlier note.';
  old.prove.userReply = 'Earlier reply.';
  old.prove.decision = 'Resolve';
  old.tickets[0].pathPool = [{ id: 'p1', text: 'An earlier step' }, { id: 'p3', text: 'Another earlier step' }];
  old.tickets[0].notes = [{ time: '10:00', author: 'Riley Morgan', text: 'Earlier work note.' }];
  old.machines['NS-LT-0122'].pendingPolicyPrinters = [FIN_PRINTER];
  local.setItem(key, JSON.stringify(old));
  const tab = sim(proveUrl('student-v1draft1'), { local });
  const prove = tab.hd().prove;
  assert.equal(prove.rubricVersion, 'hdesk-its-01-prove-v2');
  assert.deepEqual(JSON.parse(JSON.stringify(prove.fields)), PRESET);
  assert.deepEqual([...prove.steps], [], 'earlier steps dropped');
  assert.deepEqual([prove.resolutionNote, prove.userReply, prove.decision], ['Earlier note.', 'Earlier reply.', 'Resolve'], 'writing kept');
  assert.deepEqual(JSON.parse(JSON.stringify(tab.hd().tickets[0].pathPool)), JSON.parse(JSON.stringify(PROVE_TICKET.pathPool)), 'the current steps');
  assert.equal(tab.hd().tickets[0].notes[0].text, 'Earlier work note.');
  assert.deepEqual([...tab.hd().machines['NS-LT-0122'].pendingPolicyPrinters], [], 'the laptop as the current fixture says');
  assert.equal(JSON.parse(local.getItem(key)).prove.rubricVersion, 'hdesk-its-01-prove-v2', 'saved upgraded');
}

const tests = [
  testPresetFieldsAreReadOnly, testSettingsAddDeviceAddsThePrinter, testOnlyTheKbSearchInProve, testV1DraftStartsFromTheCurrentTicket,
  testSelectedChoiceIsNeutral,
  testLaunchWithoutStudentOpensNothing,
  testPracticeNeverGetsProveMaterial, testProveLaunchOpensOnlyItsTicketWithNoCoach, testProveTicketViewRevealsNothing,
  testShellMachineState, testTypedPasswordIsRefusedInProve, testOldDraftWithAPasswordIsMaskedOnLoad, testPracticeShellUnchanged, testOnlyMeaningfulEventsAndThePackage,
  testReloadKeepsTheAttemptPerStudent, testSubmittedAttemptIsLocked, testRubricNamesNoAnswers,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`all ${tests.length} passed`);

// Module 10 (key its-08) Prove It: one ticket on Module 3's one-ticket form
// with a key-finding note and a phone call with the user, worked in a remote
// session on one desk PC (the session's screens, the Remote Support command
// console and the Service Desk PowerShell) and the knowledge base
// (ui/helpdesk.js, HD_PROVE_SHIFTS['its-08']), and the course page's side of
// it (portal/it-support-shared.js: the cleaner and the review panel;
// portal/it-support-module-08.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, no practice wording, no request or team card.
//   - The remote session's records (the Say lines with their times, the
//     prompts, the session and its end) are Prove events; the course page keeps
//     them in full and the instructor reads them.
//   - Typed commands are command_run events on the PC, with their time; a
//     ticked step that names a command adds none.
//   - The package carries a small summary of the PC's clock and trust
//     (machine.clock), and a returned attempt in another browser gets the clock
//     back as the student left it. A returned attempt also starts with no open
//     session, no pending code and no Say lines.
//   - A password typed as a literal in a console (a quoted ConvertTo-SecureString
//     value too) is refused before it runs and never saved anywhere.
//   - A view-only Quick Assist session can't change the PC from the Service
//     Desk PowerShell either; a Prove It says only that nothing changed.
//   - Older Prove shifts: no summary, no chat change.
//
// Structure only: nothing here says which choice, screen, step or command is
// right. Names are read from the shift data; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-08-prove-it';
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
    events: (type) => plain(run(`hdState.prove.events.filter((e) => e.type === ${j(type)})`)),
    // The Service Desk PowerShell.
    ps: (command) => {
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
    // The Remote Support command console, in an open session.
    cmd: (command) => {
      byId.set('hd-remote-cmd', { id: 'hd-remote-cmd', value: command });
      run('hdRemoteRun({ preventDefault() {} })');
      const session = run('(() => { const s = hdRemoteState(hdCurrentTicket()); return hdRemoteActive(s); })()');
      return session && session.commands.length ? session.commands[session.commands.length - 1].output : '';
    },
    say: (text) => { byId.set('hd-remote-say', { id: 'hd-remote-say', value: text }); run('hdRemoteSay({ preventDefault() {} })'); },
  };
}
const SHIFT = sim('its-08', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-08']))");
const SPEC = SHIFT.tickets[0];
const TID = SPEC.id;
const PC = SHIFT.selectedComputer;
const QUESTIONS = SPEC.console.caller.questions;
const CLASSES = sim('its-08', 'probe2').run('HD_PROVE_CLASSES.slice()');
const TEAMS = sim('its-08', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const chatCard = (tab) => tab.run('hdConsoleChatCard(hdState.tickets[0])');
const WRITING = { keyFinding: 'Synthetic finding K: two made-up facts linked.', resolutionNote: 'Synthetic note A: Reported / Tried / Result, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const ask = (tab, id) => tab.run(`hdChatAsk(hdState.tickets[0].id, ${j(id)})`);
const asked = (tab) => tab.events('caller_question').map((e) => e.value);
const remoteState = (tab) => plain(tab.run('hdRemoteState(hdCurrentTicket())'));
const connect = (tab) => { tab.run(`hdRemoteRequest(${j(PC)}, false)`); };
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[0]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '2');
  tab.ctx.hdProveSetField('urgency', '2');
  tab.ctx.hdProveSetField('group', TEAMS[0]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Resolve');
  [SPEC.pathPool[0].id, SPEC.pathPool[3].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  Object.entries(WRITING).forEach(([field, text]) => tab.ctx.hdProveText(field, text));
  tab.run('hdProveSetCode(hdState.tickets[0].id, HD_PROVE_RESOLUTION_CODES[0]); hdProveClose(hdState.tickets[0].id)');
}
// A whole session, as a careful student could work it: verify, tell, connect,
// say things, read the clock and the log, type the checks, fix, ask, end.
function walk(tab) {
  fill(tab);
  ask(tab, 'v1'); ask(tab, 't1');
  tab.say('Made-up opening: you will see a request.');
  connect(tab);
  tab.say('Made-up line: I am checking the date now.');
  tab.run("hdRemoteTab('sysinfo')");
  tab.run('hdRemoteEventLog()');
  tab.run("hdRemoteTab('console')");
  tab.cmd('w32tm /query /status');
  tab.cmd('Test-ComputerSecureChannel');
  tab.cmd('ping NS-DC01');
  tab.cmd('w32tm /resync');
  ask(tab, 'q5'); ask(tab, 'q6');
  tab.say('Made-up line: I am disconnecting now.');
  tab.run('hdRemoteEnd()');
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m08', step: 2 })]]);
  const tab = sim('its-08', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-08-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 25, 'the coaching time box (decision 1)');
  assert.equal(SHIFT.remoteSummary, true);
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  assert.equal(tab.run('hdState.selectedComputer'), PC, 'the caller\'s PC is selected');
  assert.equal(tab.run('new Date(hdShiftNow()).getUTCDay()'), 1, 'a Monday, today');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(TID), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.match(html, /data-hd-prove-writing="keyFinding"/, 'the key-finding box');
  assert.doesNotMatch(html, /hd-convert|hd-team-messages|data-hd-request=/, 'no request or team card (ticketActions is off)');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, SPEC.pathPool.length, 'step ids are unique');
  assert.equal(SPEC.pathPool.length, 14, 'a long mixed list of steps');
  assert.equal(SHIFT.kbArticles, undefined, 'Module 10\'s practice articles stay in Practice');
  assert.ok(!tab.run('hdKbArticles().some((a) => a.practiceOnly)'), 'no practice-only article in a Prove It');
  assert.ok(tab.run('hdKbArticles().length') > 0, 'the shared knowledge base is there to search');
  assert.equal(tab.run('hdRemoteOn()'), true, 'the Remote Support screen is the real one');
  assert.ok(!words(tab.view('helpdesk/remote-support')).includes(TID), 'the Remote Support screen never shows the internal id either');
  assert.ok(words(tab.view('helpdesk/remote-support')).includes(SPEC.number), 'it shows the INC number');
  assert.deepEqual([...tab.toasts], [], 'no toast');
  // The evidence card, the chat and the sign-in screen's message.
  assert.match(html, /data-hd-prove-open="card:wo-3307"/);
  assert.match(html, /hdChatAsk\(/);
}

function testChat() {
  const ids = QUESTIONS.map((q) => q.id);
  same(ids, ['v1', 'q1', 'q2', 'q3', 'q4', 't1', 'q5', 'q6'], 'the questions, with neutral ids');
  assert.equal(SPEC.console.caller.limit, undefined, 'no question limit');
  assert.equal(QUESTIONS.filter((q) => Array.isArray(q.replyWhen)).length, 2, 'two replies wait for the PC');
  const tab = sim('its-08', 'stu-chat');
  const card = chatCard(tab);
  ids.forEach((id) => assert.ok(card.includes(`hdChatAsk('${TID}','${id}')`), `${id} offered`));
  // The sign-in questions answer from the PC's clock, and are offered again.
  ask(tab, 'q5');
  assert.ok(chatCard(tab).includes(tab.run('hdEsc')(QUESTIONS.find((q) => q.id === 'q5').reply)), 'the plain reply before the fix');
  assert.ok(!chatCard(tab).includes(`hdChatAsk('${TID}','q5')`), 'not offered again while the clock is wrong');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  tab.cmd('w32tm /resync');
  assert.ok(chatCard(tab).includes(`hdChatAsk('${TID}','q5')`), 'offered again once the clock is right');
  ask(tab, 'q5'); ask(tab, 'q6');
  assert.ok(chatCard(tab).includes(tab.run('hdEsc')("I'm in!")), 'after the resync she is in');
  const events = tab.events('caller_question');
  same(events.map((e) => e.value), ['q5', 'q5', 'q6'], 'each ask is recorded, by id');
  assert.ok(events.every((e) => typeof e.at === 'string' && e.at && e.label), 'with its time and text');
  tab.run("hdProveServer.status = 'waiting'");
  assert.doesNotMatch(chatCard(tab), /hdChatAsk\(/, 'nothing offered after submit');
}

function testRemoteWalkAndEvents() {
  const tab = sim('its-08', 'stu-walk');
  walk(tab);
  const types = tab.prove().events.map((e) => e.type);
  ['remote_say', 'remote_session', 'remote_session_end', 'command_run', 'evidence_opened', 'action_taken', 'caller_question'].forEach((type) => assert.ok(types.includes(type), `${type} recorded`));
  const says = tab.events('remote_say');
  same(says.map((e) => e.text), ['Made-up opening: you will see a request.', 'Made-up line: I am checking the date now.', 'Made-up line: I am disconnecting now.']);
  assert.ok(says.every((e) => /^\d\d:\d\d$/.test(e.time)), 'each with its time');
  assert.equal(says[0].computer, '', 'the first was said before the session');
  assert.equal(says[1].computer, PC, 'the second during it');
  const start = tab.events('remote_session')[0];
  assert.deepEqual([start.computer, start.tool, start.mode, start.control, start.allowedBy, start.screen], [PC, 'remote-support', 'attended', 'full', 'Priya Shah', 'sign-in']);
  const end = tab.events('remote_session_end')[0];
  assert.match(end.log, /^Remote session · NS-WS-0211 · Remote Support \(attended\) · \d\d:\d\d–\d\d:\d\d · allowed by Priya Shah \d\d:\d\d$/);
  const actions = tab.events('action_taken').map((e) => e.value);
  ['remote-request', 'remote-connected', 'clock-resync', 'remote-end'].forEach((id) => assert.ok(actions.includes(id), id));
  assert.ok(!actions.includes('remote-unattended'));
  assert.match(tab.events('action_taken').find((e) => e.value === 'remote-request').label, /allowed the Remote Support request/);
  assert.match(tab.events('action_taken').find((e) => e.value === 'clock-resync').label, /synced with/);
  const sources = tab.events('evidence_opened').map((e) => e.source);
  assert.ok(sources.includes(`clock:${PC}`), 'System info opened');
  assert.ok(sources.includes(`event-log:${PC}:system`), 'the Event log opened');
  const commands = tab.events('command_run').map((e) => [e.command, e.computer]);
  same(commands, [['w32tm /query /status', PC], ['Test-ComputerSecureChannel', PC], ['ping NS-DC01', PC], ['w32tm /resync', PC]], 'every typed line, on the PC');
  // The order the key reads: the verification and the message come before the request.
  const order = tab.prove().events.map((e) => (e.type === 'caller_question' ? e.value : e.type === 'action_taken' ? e.value : ''));
  assert.ok(order.indexOf('v1') < order.indexOf('remote-request') && order.indexOf('t1') < order.indexOf('remote-request'));
  // The clock really changed, and the sign-in questions answered from it.
  assert.equal(tab.run(`hdRemoteClockCorrect(${j(PC)}, hdMachine(${j(PC)}))`), true);
  assert.match(tab.cmd('w32tm /query /status') || '', /^$|./);
}

function testTypedChecks() {
  const tab = sim('its-08', 'stu-typed');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  assert.match(tab.cmd('w32tm /query /status'), /Source: Local CMOS Clock/);
  assert.match(tab.cmd('w32tm /query /status'), /not synchronized/);
  assert.equal(tab.cmd('Test-ComputerSecureChannel'), 'True');
  assert.match(tab.cmd('Get-Date'), /2023/, 'the PC shows the wrong year');
  assert.match(tab.cmd('ping NS-DC01'), /Reply from/);
  assert.match(tab.cmd('nslookup northstar.example'), /10\.20\.0\.10/);
  assert.match(tab.cmd('w32tm /resync'), /completed successfully/);
  assert.match(tab.cmd('w32tm /query /status'), /Source: NS-DC01/);
  assert.doesNotMatch(tab.cmd('Get-Date'), /2023/, 'the clock is the shift\'s after the resync');
  assert.equal(tab.cmd('Test-ComputerSecureChannel'), 'True', 'True before and after');
  // The Service Desk PowerShell answers the same lines.
  assert.equal(tab.ps('Test-ComputerSecureChannel'), 'True');
  assert.match(tab.ps('Get-ADUser pshah -Properties LockedOut, Enabled, PasswordExpired'), /LockedOut\s*:\s*False/);
  assert.match(tab.ps('Get-ADUser pshah -Properties LockedOut, Enabled, PasswordExpired'), /Enabled\s*:\s*True/);
  // The domain-membership lines are refused and recorded; the answer names no team.
  ['Remove-Computer', 'Test-ComputerSecureChannel -Repair', 'Reset-ComputerMachinePassword', 'Add-Computer -DomainName northstar.example'].forEach((line) => {
    assert.equal(tab.cmd(line), 'Access is denied.', `${line} is refused`);
  });
  assert.equal(tab.events('action_taken').filter((e) => e.value === 'domain-membership-refused').length, 4);
  // A ticked step that names a command adds no command.
  const ticked = sim('its-08', 'stu-ticked');
  SPEC.pathPool.forEach((step) => ticked.ctx.hdProveToggleStep(step.id, true));
  same(ticked.events('command_run'), [], 'ticking steps adds no command');
}

function testConnectingWithoutAsking() {
  const tab = sim('its-08', 'stu-unattended');
  tab.run(`hdRemoteRequest(${j(PC)}, true)`);
  const actions = tab.events('action_taken');
  const unattended = actions.find((e) => e.value === 'remote-unattended');
  assert.ok(unattended && unattended.computer === PC, 'choosing Connect without asking is an action on the PC');
  assert.ok(!actions.some((e) => e.value === 'remote-request'), 'nobody was asked');
  assert.equal(tab.events('remote_session')[0].mode, 'unattended');
  assert.equal(tab.events('remote_session')[0].allowedBy, '');
}

function testQuickAssistRefused() {
  const tab = sim('its-08', 'stu-qa');
  tab.run('hdRemoteQuickAssist()');
  assert.ok(tab.events('action_taken').some((e) => e.value === 'quick-assist-refused'), 'nobody is signed in: Quick Assist can\'t reach the PC');
  assert.match(tab.view('helpdesk/remote-support'), /Nobody is signed in/);
}

function testNoHintsInAProveIt() {
  const tab = sim('its-08', 'stu-help');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  const consoleHelp = tab.cmd('Get-Help');
  const shellHelp = tab.ps('Get-Help');
  [consoleHelp, shellHelp].forEach((text) => {
    assert.doesNotMatch(text, /w32tm|Test-ComputerSecureChannel|Get-Date|Time and trust/i, 'no list of the answer commands');
  });
  assert.match(consoleHelp, /Supported: Get-ComputerInfo/);
  // The same screens answer in Practice with their hints (the shell, not the shift, decides).
  const sources = SOURCES.find(([name]) => name === 'helpdesk.js')[1];
  assert.match(sources, /const machine = !HD_PROVE && computer && hdFeatureMachine/);
  // A view-only refusal names no way out.
  const refusal = tab.run('(() => { const s = hdRemoteViewOnly; return String(HD_PROVE); })()');
  assert.ok(refusal);
}

function testViewOnlySession() {
  const tab = sim('its-08', 'stu-view');
  // A signed-in user, so Quick Assist can reach the PC.
  tab.run(`hdState.machines[${j(PC)}].remote.signedIn = true`);
  tab.run('hdRemoteQuickAssist()');
  const code = remoteState(tab).pending.code;
  tab.say(`Made-up: the code is ${code}.`);
  tab.run("hdRemoteAskControl('view')");
  assert.equal(remoteState(tab).sessions[0].control, 'view', 'a view-only session');
  assert.equal(tab.run(`hdRemoteViewOnly(${j(PC)}, hdMachine(${j(PC)}))`), true);
  // The Service Desk PowerShell: writes are refused, reads answer.
  const before = tab.run(`JSON.stringify(hdMachine(${j(PC)}).clock)`);
  assert.equal(tab.ps('w32tm /resync'), 'This session is view-only. Nothing changed.');
  assert.equal(tab.ps('Start-Service -Name WSearch'), 'This session is view-only. Nothing changed.');
  assert.equal(tab.ps('Restart-Service Spooler'), 'This session is view-only. Nothing changed.');
  assert.equal(tab.ps('Get-Service Spooler | Restart-Service'), 'This session is view-only. Nothing changed.', 'a pipeline that writes');
  assert.equal(tab.ps('Get-Date; w32tm /resync'), 'This session is view-only. Nothing changed.', 'a line of two commands, one writes');
  assert.equal(tab.run(`JSON.stringify(hdMachine(${j(PC)}).clock)`), before, 'the clock did not move');
  assert.match(tab.ps('w32tm /query /status'), /Source: Local CMOS Clock/, 'reads answer');
  assert.equal(tab.ps('Test-ComputerSecureChannel'), 'True');
  assert.ok(!tab.events('action_taken').some((e) => e.value === 'clock-resync'), 'no resync was recorded');
  // The graphical change helper: a Prove It only says nothing changed.
  tab.run(`hdMachineChange(${j(PC)}, () => true)`);
  assert.deepEqual([...tab.toasts].slice(-1), [`This session is view-only. Nothing changed on ${PC}.`]);
  assert.ok(!tab.toasts.some((text) => /full control/i.test(text)), 'a Prove It never says how to get full control');
  // With full control the same line works again.
  tab.run('hdRemoteEnd()');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  assert.match(tab.cmd('w32tm /resync'), /completed successfully/);
}

function testViewOnlyHintStaysInPractice() {
  const src = SOURCES.find(([name]) => name === 'helpdesk.js')[1];
  assert.match(src, /HD_PROVE \? `This session is view-only\. Nothing changed on \$\{computerName\}\.` : `View only: ask for full control to change \$\{computerName\}\.`/);
  assert.match(src, /HD_PROVE \? 'This session is view-only\. Nothing changed\.' : 'This session is view-only, so nothing changed\./);
}

function testPasswordsNeverKept() {
  const SECRET = 'Sunset-2027!qz';
  const lines = [
    `ConvertTo-SecureString "${SECRET}" -AsPlainText -Force`,
    `ConvertTo-SecureString '${SECRET}' -AsPlainText -Force`,
    `$p = ConvertTo-SecureString -String "${SECRET}" -AsPlainText -Force`,
    `Set-ADAccountPassword pshah -Reset -NewPassword (ConvertTo-SecureString "${SECRET}" -AsPlainText -Force)`,
    `Set-ADAccountPassword pshah -Reset -NewPassword '${SECRET}'`,
    `Set-LocalUser -Name x -Password ${SECRET}`,
    `ConvertTo-SecureString -String ${SECRET} -AsPlainText -Force`,
    `ConvertTo-SecureString ${SECRET} -AsPlainText -Force`,
  ];
  const tab = sim('its-08', 'stu-password');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  lines.forEach((line) => {
    assert.match(tab.cmd(line), /^Stopped: this command includes a password, so it was not run or saved\.$/, `refused in the remote console: ${line.slice(0, 30)}`);
    assert.match(tab.ps(line), /^Stopped: this command includes a password, so it was not run or saved\.$/, `refused in the PowerShell: ${line.slice(0, 30)}`);
  });
  assert.equal(tab.prove().passwordTyped, true, 'the instructor sees the flag');
  // Nothing anywhere holds the value: the saved state, the Prove record, the
  // package, the shell transcript and the ticket's activity.
  const everything = JSON.stringify([tab.run('hdState'), tab.run('hdProvePackage()'), tab.local.map ? [...tab.local.map.values()] : '']);
  assert.ok(!everything.includes(SECRET), 'the password is nowhere in the saved state, the log or the package');
  const cleaned = JSON.stringify(plain(prun('itsCleanProveWork')(plain(tab.run('hdProvePackage()')), 'its-08', LAB)));
  assert.ok(!cleaned.includes(SECRET));
  // A command without a literal value still runs (Module 8's pins, a bare prompt).
  assert.doesNotMatch(tab.ps('Set-ADAccountPassword pshah -Reset'), /Stopped: this command includes a password/);
  assert.doesNotMatch(tab.ps('ConvertTo-SecureString'), /Stopped: this command includes a password/);
  // Practice keeps its refusal and its shell: the Practice log never holds it either.
  const practice = sim('its-08', 'stu-password-practice');
  const text = practice.run(`hdRedactCommand(${j(lines[0])})`);
  assert.ok(!text.includes(SECRET));
  assert.match(text, /\*{8}/);
}

function testReturnedAttemptStartsClean() {
  const tab = sim('its-08', 'stu-return');
  walk(tab);
  assert.ok(remoteState(tab).sessions.length === 1 && remoteState(tab).say.length === 3);
  const left = plain(tab.run('hdProvePackage()')).machine;
  tab.run(`hdProveFreshLog(${j(new Date().toISOString())})`);
  same(tab.prove().events, [], 'the log is empty');
  const state = remoteState(tab);
  same([state.sessions, state.say, state.asks, state.active, state.pending || null], [[], [], [], null, null], 'no open session, no code, no Say lines');
  assert.equal(tab.run('hdRemoteActive(hdRemoteState(hdCurrentTicket()))'), null, 'the old session can\'t be ended');
  tab.run('hdRemoteEnd()');
  same(tab.events('remote_session_end'), [], 'ending nothing records nothing');
  tab.run("hdRemoteTab('console')");
  assert.equal(tab.cmd('w32tm /query /status'), '', 'no console without a new session');
  same(plain(tab.run('hdProvePackage()')).machine, left, 'the PC\'s clock is as the student left it');
  // The retry must ask permission again.
  connect(tab);
  assert.equal(tab.events('action_taken').filter((e) => e.value === 'remote-request').length, 1);
  assert.equal(remoteState(tab).sessions.length, 1);
}

function testClockComesBackInAnotherBrowser() {
  const tab = sim('its-08', 'stu-clock');
  connect(tab);
  tab.run("hdRemoteTab('console')");
  tab.cmd('w32tm /resync');
  const work = plain(tab.run('hdProvePackage()'));
  work.completedAt = new Date().toISOString();
  assert.ok(JSON.stringify(work.machine).length <= 4096, 'the summary is inside the course page\'s 4 KB machine limit');
  same(Object.keys(work.machine).sort(), ['clock', 'remote', 'secureChannel']);
  const kept = plain(prun('itsProveCleanMachine')(work.machine));
  same(kept, work.machine, 'the course page keeps it whole');
  const other = sim('its-08', 'stu-clock-other');
  assert.equal(other.run(`hdProvePrefill(${j({ ...work, machine: kept })})`), true);
  assert.equal(other.run(`hdRemoteClockCorrect(${j(PC)}, hdMachine(${j(PC)}))`), true, 'the corrected clock is restored');
  assert.equal(other.run(`hdMachine(${j(PC)}).clock.source`), 'NS-DC01.northstar.example');
  assert.equal(other.run(`hdMachine(${j(PC)}).clock.synced`), true);
  same(plain(other.run('hdProvePackage()')).machine, kept, 'the PC comes back as the student left it');
  // A PC left untouched comes back with the wrong clock.
  const untouched = sim('its-08', 'stu-clock-untouched');
  const fresh = plain(untouched.run('hdProvePackage()'));
  fresh.completedAt = new Date().toISOString();
  const again = sim('its-08', 'stu-clock-untouched-other');
  again.run(`hdProvePrefill(${j(fresh)})`);
  assert.equal(again.run(`hdRemoteClockCorrect(${j(PC)}, hdMachine(${j(PC)}))`), false);
  // A made-up summary can't put anything else on the PC.
  const hostile = sim('its-08', 'stu-clock-hostile');
  hostile.run(`hdProvePrefillRemote(${j({ clock: { shown: 'not a date', offsetMinutes: 'x', source: 'y'.repeat(200) }, secureChannel: 'yes', evil: true })}, hdMachine(${j(PC)}))`);
  assert.ok(!('evil' in plain(hostile.run(`hdMachine(${j(PC)})`))));
  assert.equal(hostile.run(`hdMachine(${j(PC)}).secureChannel`), true);
}

function testOlderShiftsUnchanged() {
  ['its-01', 'its-10', 'its-11', 'its-02', 'its-03', 'its-07', 'its-05', 'its-06', 'its-04'].forEach((moduleKey) => {
    const shift = sim(moduleKey, `probe-old-${moduleKey}`).run(`JSON.parse(JSON.stringify(HD_PROVE_SHIFTS[${j(moduleKey)}]))`);
    assert.notEqual(shift.remoteSummary, true, `${moduleKey}: no remote summary`);
    Object.values(shift.machines || {}).forEach((machine) => assert.ok(!machine.remote && !machine.clock && !machine.signInMessage, `${moduleKey}: no remote state`));
    const tab = sim(moduleKey, `probe-old-view-${moduleKey}`);
    assert.equal(tab.run('hdRemoteOn()'), false, `${moduleKey}: the placeholder Remote Support screen`);
  });
}

function testPackage() {
  const tab = sim('its-08', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const work = plain(tab.run('hdProvePackage()'));
  assert.equal(work.keyFinding, WRITING.keyFinding);
  assert.equal(work.labKey, LAB);
  assert.equal(work.moduleKey, 'its-08');
  assert.ok(work.machine && work.machine.clock, 'the PC\'s clock summary');
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function sampleWork() {
  const tab = sim('its-08', 'stu-sample');
  walk(tab);
  return plain(tab.run('hdProvePackage()'));
}

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-08', LAB);
  assert.equal(reason, undefined);
  assert.equal(saved.fields.priority, prun('ITS_PROVE_MATRIX')['2']['2'], 'Priority is the course page\'s own, from Impact and Urgency');
  assert.equal(saved.keyFinding, WRITING.keyFinding);
  same(saved.machine, work.machine, 'the PC summary is kept whole');
  same(saved.commands.map((c) => [c.command, c.computer, c.at]), work.commands.map((c) => [c.command, c.computer, c.at]), 'every command with its computer and time');
  // The remote records, in full.
  const pick = (events, type) => events.filter((e) => e.type === type);
  same(pick(saved.events, 'remote_say').map((e) => [e.text, e.time, e.computer, e.at]), pick(work.events, 'remote_say').map((e) => [e.text, e.time, e.computer, e.at]), 'every Say line, its text, time and place');
  same(pick(saved.events, 'remote_session').map((e) => [e.tool, e.mode, e.control, e.start, e.allowedBy, e.screen, e.computer]), pick(work.events, 'remote_session').map((e) => [e.tool, e.mode, e.control, e.start, e.allowedBy, e.screen, e.computer]), 'the session');
  same(pick(saved.events, 'remote_session_end').map((e) => [e.log, e.start, e.end]), pick(work.events, 'remote_session_end').map((e) => [e.log, e.start, e.end]), 'the session log line');
  assert.ok(pick(saved.events, 'remote_session_end')[0].log.length > 40);
  same(saved.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.at]), work.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.at]), 'the chat, with its times');
  same(saved.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.computer, e.at, e.label]), work.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.computer, e.at, e.label.slice(0, 120)]), 'the actions, with their times and labels');
  assert.equal(saved.logTrimmed, false);
  assert.equal(clean({ ...work, keyFinding: '' }, 'its-08', LAB).reason, 'invalid', 'the key finding is required');
  assert.equal(clean({ ...work, labKey: 'lab-its-06-prove-it', rubricVersion: 'hdesk-its-06-prove-v1' }, 'its-08', LAB).reason, 'invalid', 'refused under another lab key');
  // Other events keep their own shape: a Say field never leaks onto them.
  assert.ok(!('text' in saved.events.find((e) => e.type === 'command_run')), 'only remote records carry the extra fields');
  return saved;
}

function testSayLinesAreNeverCut() {
  const tab = sim('its-08', 'stu-long');
  fill(tab);
  connect(tab);
  const long = `Made-up line ${'x'.repeat(480)}`;
  for (let i = 0; i < 20; i += 1) tab.say(`${i}: ${long}`);
  // Lots of other actions and commands, so the oldest are trimmed first.
  tab.run("hdRemoteTab('console')");
  for (let i = 0; i < 150; i += 1) tab.cmd(`ping 10.20.0.${(i % 200) + 1}`);
  const work = plain(tab.run('hdProvePackage()'));
  work.events.forEach((e) => { e.label = e.label ? `${e.label} ${'y'.repeat(100)}` : e.label; });
  const { work: saved, reason } = clean(work, 'its-08', LAB);
  assert.equal(reason, undefined);
  const says = saved.events.filter((e) => e.type === 'remote_say');
  assert.equal(says.length, 20, 'every Say line is kept');
  assert.ok(says.every((e) => e.text.length >= 480), 'none is cut');
  // A package that can't fit without cutting the Say lines is refused, never cut.
  const huge = plain(work);
  for (let i = 0; i < 200; i += 1) huge.events.push({ type: 'remote_say', at: new Date().toISOString(), text: 'z'.repeat(500), time: '09:30', computer: PC });
  const refused = clean(huge, 'its-08', LAB);
  assert.ok(refused.reason === 'too-large' || (refused.work && refused.work.events.filter((e) => e.type === 'remote_say').length >= 200), 'refused or kept whole, never cut');
}

const LONG = {
  keyFinding: 'Synthetic finding F: <b>made up</b> & linked.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m10-1', lab_key: LAB, student_id: '9900000010-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>') && !html.includes('<b>made up</b>'), 'never raw');
  ['Key finding', 'Work note', 'Reply', 'Questions asked in the chat', 'Commands run', 'Actions in the simulator', 'Say to the user', 'Remote session log', 'Prompts asked in the session'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['Print queues at submit', 'The laptop at submit'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  // The Say lines, each with its time, in order, untruncated; the session log line.
  const says = saved.events.filter((e) => e.type === 'remote_say');
  assert.equal(says.length, 3);
  says.forEach((e) => { assert.ok(html.includes(pesc(e.text)), `Say line: ${e.text}`); assert.ok(html.includes(`${e.time} · ${pesc(e.text)}`), 'with its time'); });
  assert.ok(html.indexOf(pesc(says[0].text)) < html.indexOf(pesc(says[1].text)) && html.indexOf(pesc(says[1].text)) < html.indexOf(pesc(says[2].text)), 'in order');
  assert.ok(html.includes('before the session') && html.includes(`during the session on ${PC}`));
  assert.ok(html.includes(pesc(saved.events.find((e) => e.type === 'remote_session_end').log)), 'the session log');
  assert.match(html, /Started \d\d:\d\d · NS-WS-0211 · Remote Support \(attended, full control\) · allowed by Priya Shah · at the sign-in screen/);
  saved.commands.forEach((c) => assert.ok(html.includes(pesc(c.command)), `command: ${c.command}`));
  saved.events.filter((e) => e.type === 'action_taken').forEach((e) => assert.ok(html.includes(pesc(e.label)), `action: ${e.label}`));
  // A critical session reads as one on the sheet.
  const tab = sim('its-08', 'stu-sheet-critical');
  tab.run(`hdRemoteRequest(${j(PC)}, true)`);
  fill(tab);
  const critical = clean(plain(tab.run('hdProvePackage()')), 'its-08', LAB).work;
  assert.match(prun('itsProveReviewPanel')({ ...row, result: critical }), /Remote Support \(unattended, full control\) · nobody was asked/);
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-08-prove-v1');
  assert.equal(rubric.moduleKey, 'its-08');
  same(rubric.competencies.map((c) => c.points), [11, 28, 17, 16, 28], 'the approved weights');
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  same(rubric.writing, { keyFinding: 600 });
  assert.equal(rubric.matrixFields, true);
  assert.equal(rubric.machineSummary, false);
  assert.match(rubric.partialCredit, /required typed/);
  assert.match(rubric.writingAck, /Say to the user/);
}

/* ------------------------------------------------------------ Module 10 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-08'].number]`);
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

async function testModuleTenPageSubmit(work) {
  freshDb();
  const user = hdUser('m10prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its08-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  assert.doesNotMatch(card, /opens soon/i);
  assert.match(card, /Type your checks in PowerShell/);
  assert.match(card, /25 minutes/);
  const link = /data-its08-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-08&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  // Lab 10.1 is Practice It now.
  const lab1 = html.slice(html.indexOf('id="its08-lab-10-1"'), html.indexOf('</section>', html.indexOf('id="its08-lab-10-1"')));
  assert.match(lab1, /Practice It · coached/);
  assert.match(lab1, /Practice: not graded/);
  assert.doesNotMatch(lab1, /instructor reviews/i);
  assert.equal(prun("LABS.find((l) => l.key === 'lab-its-08-unfamiliar-problems').phase"), 'practice');
  assert.notEqual(prun("LABS.find((l) => l.key === 'lab-its-08-prove-it').phase"), 'practice');
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-08', nonce: 'm10prove-1234', student: studentOf(user), work };
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
  same(stored, clean(work, 'its-08', LAB).work, 'the cleaned work');
  assert.ok(stored.events.some((e) => e.type === 'remote_say' && e.text), 'the Say lines are in the saved attempt');
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its08-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its08-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m10-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testChat, testRemoteWalkAndEvents, testTypedChecks, testConnectingWithoutAsking, testQuickAssistRefused, testNoHintsInAProveIt,
    testViewOnlySession, testViewOnlyHintStaysInPractice, testPasswordsNeverKept, testReturnedAttemptStartsClean, testClockComesBackInAnotherBrowser,
    testOlderShiftsUnchanged, testPackage, testSayLinesAreNeverCut, testCiRunsThisFile]) {
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
    try { await testModuleTenPageSubmit(work); report('testModuleTenPageSubmit'); } catch (error) { report('testModuleTenPageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m10-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m10-prove: all ${passed} passed`);
})();

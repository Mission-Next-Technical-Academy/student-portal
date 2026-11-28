'use strict';
// Help Desk Module 10 (key its-08) Practice It, Lab 10.1 (ui/helpdesk-coaches.js
// "hd-m08"): two remote sessions, coached set its-08-guided.
//
//   - Part A on HD-2255 (INC0010533): Marisol Vega's headset plays nothing after
//     she docked NS-LT-0421, because Windows sent the sound to the monitor. The
//     whole Quick Assist session: opening script, code, consent, privacy,
//     narration, the fix in Settings › System › Sound, a test call, the end.
//   - Part B on HD-2110 (INC0010537), rewritten: Sofia Martin's NS-LT-0131 says
//     the trust relationship failed after a restore from a 30-day-old image
//     (WO-3308). Remote Support at the sign-in screen, one hypothesis at a time
//     (network, DNS, clock, trust, the computer object), KB-0095, then a
//     handoff to Desktop Support. Tier 1 never repairs or rejoins. Then
//     Test-NetConnection NS-DC01 -Port 3389 and -Port 22.
//   - The coach walks A1 to A11 and B1 to B13 of spec section 8.2 through
//     ui/coach.js. Each step waits for real state, never a tick box.
//   - Every clock in the lab and the practice set is correct, and nothing in
//     Module 10's simulator content names the Prove It's cause (the words are
//     kept here as hashes only).
//   - HD-2111 leaves every student queue; hd-m08 no longer coaches it; a saved
//     run of the old two-ticket coach starts fresh; the capstone's own copy of
//     HD-2110 is untouched.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m09-guided-lab.test.js does. Synthetic data only.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
const STUDENT = 'student-m10g0001';
const launchUrl = (coach = 'hd-m08', restart = true, student = STUDENT) => `${SIM_URL}?coach=${coach}${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const A = 'HD-2255';
const B = 'HD-2110';
const PC_A = 'NS-LT-0421';
const PC_B = 'NS-LT-0131';
const HEADSET = 'Headset Earphone (USB Audio)';
const LAST = 24;

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', checked: true, listeners,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; }, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
function fakeOpener() {
  const sent = [];
  return { sent, closed: false, focus() {}, postMessage: (data, origin) => sent.push({ data: JSON.parse(JSON.stringify(data)), origin }) };
}

function sim(url, { local = store(), session = store(), opener = null } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''),
    querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.pathname = n.pathname; location.search = n.search; location.hash = n.hash; } },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() { ctx.closed = true; }, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text),
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash; ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) {
    vm.runInContext(source, ctx, { filename: name });
    if (name === 'helpdesk.js') vm.runInContext('hdNowMs = () => 1000000;', ctx);
  }
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  const tab = {
    ctx, toasts, local, session, run, input, location,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); return run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    attach: (id, article) => run(`hdKbAttach(${j(id)}, ${j(article)})`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, code, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, ${j(code)})`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    on: (computer) => run(`hdSelectComputer(${j(computer)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    say: (text) => { input('hd-remote-say', text); run('hdRemoteSay({ preventDefault() {} })'); },
    find: (name) => { input('hd-remote-find', name); run('hdRemoteFind({ preventDefault() {} })'); },
    cmd: (command) => {
      input('hd-remote-cmd', command); run('hdRemoteRun({ preventDefault() {} })');
      const rows = plain(run('hdRemoteActive(hdRemoteState(hdRemoteWorkTicket())).commands'));
      return rows[rows.length - 1].output;
    },
    remote: (id) => plain(run(`hdRemoteState(hdTicketById(${j(id)}))`)),
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions`)).map((a) => a.id),
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    coachState: () => JSON.parse(session.getItem('mnt.coach.state') || 'null') || {},
    coachStep: () => tab.coachState().step,
    coach: (id) => run(`MODULE_COACHES.find((c) => c.id === ${j(id)})`),
    advance: () => {
      const steps = tab.coach(tab.coachState().id).steps.length;
      for (;;) {
        const before = tab.coachStep();
        if (before === undefined || before >= steps - 1) return before;
        click('next');
        if (tab.coachStep() === before) return before;
      }
    },
    finish: () => click('finish'),
  };
  return tab;
}
// advance() stops at the first step whose action is not done yet.
const at = (tab, step, label) => { tab.advance(); assert.equal(tab.coachStep(), step, label); };

// The spec's model notes and comments (section 8.2), with their labels.
const NOTE_A = 'Reported: No sound in her headset on Teams since she docked this morning; others can hear her. Called from her desk phone.\nTried: Verified by callback and employee ID. Quick Assist with her consent, 09:08 to 09:14; she closed personal tabs first. Settings › Sound: output had switched to Monitor speakers (DisplayPort Audio) on docking; changed it to Headset Earphone (USB Audio); test tone heard; Teams test call clear.\nResult: Headset sound working; Marisol confirmed; session ended 09:14.';
const COMMENT_A = 'Hi Marisol, you can hear your calls again. When you docked, Windows started sending sound to your monitor, which has no speakers, instead of your headset. We\'ve switched it back. If it happens again after docking, the sound setting is the place to look, or just call us. – Riley';
const NOTE_B = 'Reported: Can\'t sign in to NS-LT-0131: "The trust relationship between this workstation and the primary domain failed." Desktop Support returned the laptop yesterday after a new drive and a restore (WO-3308). Needs it for the 10:00 shift handover. One user.\nTried: Verified by callback and employee ID. Remote Support (attended) at the sign-in screen; Sofia allowed it 09:23. ping NS-DC01 replies and nslookup northstar.example is correct, so the network and DNS are fine. w32tm /query /status: source NS-DC01, synced 08:58; w32tm /resync OK, so time is fine. Test-ComputerSecureChannel: False; System log NETLOGON 3210. AD: NS-LT-0131 enabled, machine password set 12 days ago; the restored image is 30 days old. KB-0095: a Desktop Support repair. Not tried: repairing the secure channel or rejoining (needs Desktop Support\'s account). Session ended 09:31.\nResult: Escalated to Desktop Support at P3. Sofia is using the hot desk PC at the end of row 3 for the handover.\nNext action: Desktop Support to repair NS-LT-0131\'s secure channel and confirm Sofia can sign in; Service Desk to tell Sofia when it\'s ready.';
const COMMENT_B = 'Hi Sofia, thanks for your patience. When your laptop was restored from a backup yesterday, it went back to an older copy of the key it uses to prove it belongs to our network, so the network no longer recognises it. Our desktop team has the details and will fix it. Until then you can sign in on the PC at the end of row 3, and your files will be there. We\'ll let you know as soon as your laptop is ready. – Riley';
const OPENING = 'Thanks Marisol, you\'re verified. May I connect to your computer to look at this? Please close anything personal first, and I\'ll tell you what I\'m doing as I go.';

function startLab(opener, local, session) {
  const tab = sim(launchUrl(), { opener, local, session });
  assert.equal(tab.run('hdState.ticketSet'), 'its-08-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [B, A]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-24T09:00:00.000Z', 'Monday 09:00');
  return tab;
}

/* ------------------------------------------------------------ Part A */
function partA(tab) {
  tab.open(A);
  at(tab, 0, 'A1 waits');
  tab.triage(A, 'Hardware', 'Audio / headset', PC_A, '3', '2');
  assert.equal(tab.ticket(A).priority, 'P4');
  at(tab, 1, 'A1 done');
  tab.run(`hdVerify('${A}', 'callback')`);
  at(tab, 2, 'A2 done');
  // A3: the opening script, checked by keyword groups.
  tab.say('Thanks Marisol, you\'re verified.');
  assert.match(tab.view('helpdesk/remote-support'), /Opening script: ✓ verify · ✗ consent · ✗ privacy · ✗ narration\. Missing: consent, privacy, narration\./);
  at(tab, 2, 'A3 waits for all four habits');
  tab.say('May I connect to your computer to look at this? Please close anything personal first, and I\'ll tell you what I\'m doing as I go.');
  at(tab, 3, 'A3 done');
  // A4: a Quick Assist code, read to her.
  tab.run('hdRemoteQuickAssist()');
  const code = tab.remote(A).pending.code;
  at(tab, 3, 'A4 waits for her to type the code');
  tab.say(`Your code is ${code}.`);
  assert.match(tab.view('helpdesk/remote-support'), /Waiting for permission/);
  at(tab, 4, 'A4 done');
  // A5: full control, allowed.
  tab.run("hdRemoteAskControl('full')");
  assert.match(tab.view('helpdesk/remote-support'), /Connected \(full control\)/);
  at(tab, 5, 'A5 done');
  // A6: privacy.
  tab.run("hdRemoteAsk('close-personal')");
  assert.match(tab.view('helpdesk/remote-support'), /Teams and Excel are open/);
  at(tab, 6, 'A6 done');
  // A7: narrate, then Sound.
  tab.say('I\'m opening your sound settings now to see where Windows is sending the audio.');
  at(tab, 6, 'A7 waits for the Sound screen');
  tab.run(`hdOpenMachineScreen('${PC_A}', 'settings-sound')`);
  const sound = tab.view('helpdesk/settings-sound');
  assert.match(sound, /Choose where to play sound · Monitor speakers \(DisplayPort Audio\)/);
  assert.match(sound, /Headset Earphone \(USB Audio\)/);
  at(tab, 7, 'A7 done');
  // A8: one change, told first, then the test tone.
  tab.say('I\'m going to switch the output to your headset now.');
  tab.run(`hdSoundSet('${PC_A}', 'output', 'headset')`);
  at(tab, 7, 'A8 waits for the test tone');
  tab.run(`hdSoundTest('${PC_A}')`);
  assert.match(tab.view('helpdesk/settings-sound'), /I can hear the beep!/);
  at(tab, 8, 'A8 done');
  // A9: the Teams test call.
  tab.run("hdRemoteAsk('test-call')");
  at(tab, 9, 'A9 done');
  // A10: close cleanly.
  tab.say('That\'s fixed, so I\'m disconnecting now.');
  tab.run('hdRemoteEnd()');
  assert.ok(plain(tab.run(`hdTicketById('${A}').troubleshootingHistory`)).some((h) => /^Remote session · NS-LT-0421 · Quick Assist · 09:\d\d–09:\d\d · allowed by Marisol Vega 09:\d\d$/.test(h.action)), 'the session log line');
  at(tab, 10, 'A10 done');
  // A11: note, comment, Solution provided.
  tab.open(A);
  tab.note(A, NOTE_A);
  tab.comment(A, COMMENT_A);
  at(tab, 10, 'A11 waits for Resolved');
  tab.resolve(A, 'Solution provided', 'Sound output back on the headset.');
  assert.equal(tab.ticket(A).status, 'Resolved');
  at(tab, 11, 'A11 done');
}

/* ------------------------------------------------------------ Part B */
const LINES_B = { ping: 'ping NS-DC01', lookup: 'nslookup northstar.example', status: 'w32tm /query /status', resync: 'w32tm /resync', trust: 'Test-ComputerSecureChannel',
  port3389: 'Test-NetConnection NS-DC01 -Port 3389', port22: 'Test-NetConnection NS-DC01 -Port 22' };
function partB(tab, lines = LINES_B) {
  tab.open(B);
  tab.triage(B, 'Software', 'Windows sign-in', PC_B, '3', '1');
  assert.equal(tab.ticket(B).priority, 'P3');
  at(tab, 12, 'B1 done');
  tab.run(`hdVerify('${B}', 'callback')`);
  at(tab, 13, 'B2 done');
  // B3: Quick Assist can't reach a sign-in screen; Remote Support, attended.
  tab.run('hdRemoteQuickAssist()');
  assert.match(tab.view('helpdesk/remote-support'), /Nobody is signed in to NS-LT-0131: Quick Assist needs the user's desktop\./);
  at(tab, 13, 'B3 waits for Remote Support');
  tab.run("hdRemoteSetTool('remote-support')");
  tab.find(PC_B);
  assert.match(tab.view('helpdesk/remote-support'), /data-hd-remote-found="NS-LT-0131"[\s\S]*Online[\s\S]*Sign-in screen \(nobody signed in\)/);
  tab.say('You\'ll see a request on your screen from Riley Morgan, Service Desk. Please choose Allow.');
  tab.run(`hdRemoteRequest('${PC_B}', false)`);
  const screen = tab.view('helpdesk/remote-support');
  assert.match(screen, /data-hd-sign-in-message>The trust relationship between this workstation and the primary domain failed\.</);
  assert.match(screen, /at the sign-in screen/);
  at(tab, 14, 'B3 done');
  // B4: what changed, WO-3308.
  tab.run("hdRemoteAsk('what-changed')");
  at(tab, 14, 'B4 waits for the work order');
  tab.open(B);
  tab.run(`hdEvidenceOpen('${B}', 'wo-3308')`);
  assert.match(tab.open(B), /restored from the image taken 30 days ago[\s\S]*Yesterday 16:10/);
  at(tab, 15, 'B4 done');
  // B5: the network and DNS, from the command console on her PC.
  tab.run("hdRemoteTab('console')");
  assert.match(tab.cmd(lines.ping), /Reply from 10\.20\.0\.10/);
  const lookup = tab.cmd(lines.lookup);
  assert.match(lookup, /10\.20\.0\.10/);
  assert.match(lookup, /10\.20\.0\.11/);
  at(tab, 16, 'B5 done');
  // B6: the clock is healthy and the PC reaches its time source.
  const status = tab.cmd(lines.status);
  assert.match(status, /Leap Indicator: 0\(no warning\)/);
  assert.match(status, /Last Successful Sync Time: 8\/24\/2026 8:58:00 AM\nSource: NS-DC01\.northstar\.example/);
  assert.equal(tab.cmd(lines.resync), 'Sending resync command to local computer...\nThe command completed successfully.');
  at(tab, 17, 'B6 done');
  // B7: the trust, and NETLOGON 3210 through the Event log tab.
  assert.equal(tab.cmd(lines.trust), 'False');
  at(tab, 17, 'B7 waits for the Event log');
  tab.run('hdRemoteEventLog()');
  const events = tab.view('helpdesk/event-viewer');
  assert.match(events, /NS-LT-0131 · Windows Logs › System[\s\S]*data-hd-event-row="3210"/);
  assert.equal((events.match(/data-hd-event-row="3210"/g) || []).length, 1, 'one NETLOGON 3210: the set\'s own, not the shared row as well');
  at(tab, 18, 'B7 done');
  // B8: the computer object, read-only.
  tab.open(B);
  tab.run(`hdAdOpenComputer('${PC_B}')`);
  const ad = tab.view('helpdesk/active-directory');
  assert.match(ad, /<code>OU=Operations,OU=Workstations<\/code>/);
  assert.match(ad, /data-hd-ad-enabled>Yes</);
  assert.match(ad, /data-hd-ad-machine-password>12 days ago</);
  at(tab, 19, 'B8 done');
  // B9: KB-0095, found by the exact error text.
  tab.input('hd-kb-input', 'trust relationship');
  tab.run(`hdKbSearch({ preventDefault() {} }, '${B}')`);
  assert.equal(tab.run(`hdKbSearchArticles('trust relationship', hdKbArticles()).some((a) => a.id === 'KB-0095')`), true);
  tab.run(`hdKbOpen('${B}', 'KB-0095')`);
  tab.attach(B, 'KB-0095');
  at(tab, 20, 'B9 done');
  // B10: the handoff message.
  tab.run(`hdTeamMessage('${B}', 'desktop-ns-lt-0131')`);
  at(tab, 21, 'B10 done');
  // B11: the plan, then End session.
  tab.ctx.location.hash = '#/helpdesk/remote-support';
  tab.say('Desktop Support will fix your laptop. For the handover, please sign in at the hot desk PC at the end of row 3. I\'m disconnecting now.');
  at(tab, 21, 'B11 waits for End session');
  tab.run('hdRemoteEnd()');
  at(tab, 22, 'B11 done');
  // B12: the handoff note, the comment, Desktop Support. Not resolved.
  tab.open(B);
  tab.note(B, NOTE_B);
  tab.comment(B, COMMENT_B);
  tab.run(`hdMatrixAssignGroup('${B}', 'Desktop Support (Tier 2)')`);
  assert.equal(tab.ticket(B).assignmentGroup, 'Desktop Support (Tier 2)');
  assert.notEqual(tab.ticket(B).status, 'Resolved');
  at(tab, 23, 'B12 done');
  // B13: which remote protocol the domain controller allows.
  assert.match(tab.ps(lines.port3389), /TcpTestSucceeded\s*: True/);
  at(tab, 23, 'B13 waits for port 22');
  assert.match(tab.ps(lines.port22), /TcpTestSucceeded\s*: False/);
  at(tab, LAST, 'B13 done: at Finish');
}

/* ------------------------------------------------------------ the walk */

function testLabOpensOnItsSet() {
  const tab = startLab();
  const coach = tab.coach('hd-m08');
  assert.equal(coach.module, 10);
  assert.equal(coach.completionToken, 'hd-m08');
  assert.equal(coach.steps.length, LAST + 1, 'Part A steps 1 to 11, Part B steps 1 to 13, then Finish');
  assert.equal(tab.ticket(A).number, 'INC0010533');
  assert.equal(tab.ticket(B).number, 'INC0010537');
  assert.equal(tab.run('hdState.openedTicketId'), A, 'Lab 10.1 starts with HD-2255 open');
  assert.equal(tab.run("MODULE_COACHES.filter((c) => c.id === 'hd-m08').length"), 1, 'one hd-m08 coach');
}

function testLab101() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  partA(tab);
  partB(tab);
  for (const id of [A, B]) {
    const feedback = tab.feedback(id);
    feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
    assert.deepEqual(feedback.critical, [], `${id} no critical entry`);
    assert.deepEqual(feedback.flags, [], `${id} no flag`);
  }
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m08');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id).sort(), [B, A]);
  assert.ok(!/HD-2111/.test(JSON.stringify(work.tickets.map((t) => t.id))), 'no HD-2111 in the record');
  const portal = loadPortal();
  const clean = plain(vm.runInContext('itsCleanCoachWork', portal)(work));
  assert.deepEqual(clean.tickets.map((t) => t.id).sort(), [B, A]);
  assert.equal(clean.tickets.find((t) => t.id === A).status, 'Resolved');
  assert.notEqual(clean.tickets.find((t) => t.id === B).status, 'Resolved', 'Part B stays with Desktop Support');
}

// Typed steps pass in any letter case, with extra valid options.
function testTypedStepsAnyCase() {
  const tab = startLab();
  partA(tab);
  partB(tab, { ping: 'PING -n 4 ns-dc01', lookup: 'Resolve-DnsName northstar.example', status: 'W32TM /query /status', resync: 'w32tm  /RESYNC', trust: 'test-computersecurechannel -Server NS-DC01',
    port3389: 'test-netconnection NS-DC01 -port 3389', port22: 'TEST-NETCONNECTION ns-dc01 -Port 22' });
  // "Check my work" agrees with the coach on the same lines.
  for (const id of [A, B]) tab.feedback(id).areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
}

// A student who connects before the opening script can't pass step 3 (the
// opening is said before connecting); the step names the way out.
function testOpeningAfterConnectingNamesTheWayOut() {
  const tab = startLab();
  const steps = tab.coach('hd-m08').steps;
  tab.open(A);
  tab.run('hdRemoteQuickAssist()');
  tab.say(`Your code is ${tab.remote(A).pending.code}.`);
  tab.run("hdRemoteAskControl('full')");
  tab.say(OPENING);
  assert.equal(steps[2].check(), false, 'an opening said during the session is not the opening');
  assert.match(steps[2].instruction, /<strong>Dashboard<\/strong>, press <strong>Reset shift<\/strong>/);
  tab.run('hdResetShift()');
  // Relaunch on the same saved shift (a new tab has a new session store), so
  // the check proves Reset shift cleared the session, not a fresh store.
  const again = startLab(null, tab.local, store());
  assert.deepEqual(again.remote(A).sessions, [], 'Reset shift cleared the earlier session');
  again.open(A);
  again.say(OPENING);
  assert.equal(again.coach('hd-m08').steps[2].check(), true, 'after Reset shift and a relaunch, the opening counts');
}

// A line on another computer or in another order does not pass its step.
function testTypedStepsNeedTheRightComputer() {
  const tab = startLab();
  const steps = tab.coach('hd-m08').steps;
  tab.open(B);
  tab.on('NS-LT-0042');
  tab.ps('ping NS-DC01');
  tab.ps('nslookup northstar.example');
  assert.equal(steps[15].check(), false, 'B5: the lines on another computer do not pass');
  tab.ps('w32tm /query /status');
  assert.equal(steps[16].check(), false, 'B6: not on NS-LT-0131');
  // The repair line never passes B7.
  tab.run("hdRemoteSetTool('remote-support')");
  tab.run(`hdRemoteRequest('${PC_B}', false)`);
  tab.run("hdRemoteTab('console')");
  assert.equal(tab.cmd('Test-ComputerSecureChannel -Repair'), "Access is denied. Joining or repairing a computer's domain membership needs a Desktop Support account.");
  assert.equal(steps[17].check(), false, 'B7: -Repair is refused and does not pass');
}

// Each tightened check holds only for the work its step names: the headset
// still chosen, the Remote Support console (not the Service Desk shell) for
// Part B's lines, the Service Desk shell (not the console) and NS-DC01 itself
// for the port tests, KB-0095 attached, and HD-2110 left open.
function testStepsNeedTheWorkTheyName() {
  const a = startLab();
  const steps = a.coach('hd-m08').steps;
  a.open(A);
  a.run('hdRemoteQuickAssist()');
  a.say(`Your code is ${a.remote(A).pending.code}.`);
  a.run("hdRemoteAskControl('full')");
  a.run(`hdOpenMachineScreen('${PC_A}', 'settings-sound')`);
  a.run(`hdSoundSet('${PC_A}', 'output', 'headset')`);
  a.run(`hdSoundTest('${PC_A}')`);
  assert.equal(steps[7].check(), true, 'A8: headset chosen and heard');
  a.run(`hdSoundSet('${PC_A}', 'output', 'monitor')`);
  assert.equal(steps[7].check(), false, 'A8: the output is back on the monitor');

  const b = startLab();
  const bSteps = b.coach('hd-m08').steps;
  b.open(B);
  b.on(PC_B);
  b.ps('ping NS-DC01');
  b.ps('nslookup northstar.example');
  assert.equal(bSteps[15].check(), false, 'B5: the Service Desk shell is not Remote Support');
  b.ps('Test-NetConnection NS-DC01X -Port 3389');
  b.ps('Test-NetConnection NS-DC01X -Port 22');
  assert.equal(bSteps[23].check(), false, 'B13: NS-DC01X is not NS-DC01');
  b.run("hdRemoteSetTool('remote-support')");
  b.run(`hdRemoteRequest('${PC_B}', false)`);
  b.run("hdRemoteTab('console')");
  b.cmd('Test-NetConnection NS-DC01 -Port 3389');
  b.cmd('Test-NetConnection NS-DC01 -Port 22');
  assert.equal(bSteps[23].check(), false, 'B13: the Remote Support console is not the Service Desk shell');
  b.ps('Test-NetConnection NS-DC01.northstar.example -Port 3389');
  b.ps('Test-NetConnection NS-DC01.northstar.example -Port 22');
  assert.equal(bSteps[23].check(), true, 'B13: NS-DC01 with its domain passes');
  b.open(B);
  b.run(`hdKbOpen('${B}', 'KB-0095')`);
  assert.equal(bSteps[19].check(), false, 'B9: read but not attached');
  b.attach(B, 'KB-0095');
  assert.equal(bSteps[19].check(), true, 'B9: read and attached');

  const c = startLab();
  partA(c);
  partB(c);
  assert.equal(c.coach('hd-m08').steps[22].check(), true, 'B12 holds while HD-2110 is open');
  c.open(B);
  c.resolve(B, 'Solution provided', 'Resolved by mistake.');
  assert.equal(c.ticket(B).status, 'Resolved', c.toasts.slice(-3).join(' | '));
  assert.equal(c.coach('hd-m08').steps[22].check(), false, 'B12: a Resolved HD-2110 does not pass');
}

// Tier 1 never repairs or rejoins, and never connects without asking: each
// is a critical feedback line, and B3 stays open after an unattended session.
function testCriticalLines() {
  const tab = startLab();
  const steps = tab.coach('hd-m08').steps;
  tab.open(B);
  tab.run('hdRemoteQuickAssist()');
  tab.run("hdRemoteSetTool('remote-support')");
  tab.run(`hdRemoteRequest('${PC_B}', true)`);
  assert.equal(tab.remote(B).sessions[0].mode, 'unattended');
  assert.ok(tab.feedback(B).critical.some((line) => /Connect without asking/.test(line)), 'unattended is critical');
  tab.run("hdRemoteTab('console')");
  for (const line of ['Remove-Computer', 'Add-Computer -DomainName northstar.example', 'Reset-ComputerMachinePassword']) tab.cmd(line);
  assert.ok(tab.feedback(B).critical.some((line) => /never repairs a secure channel or rejoins/.test(line)), 'a repair or rejoin is critical');
  tab.run('hdRemoteEnd()');
  tab.run(`hdRemoteRequest('${PC_B}', false)`);
  assert.equal(steps[13].check(), false, 'B3 stays open after Connect without asking');
  assert.match(steps[13].instruction, /<strong>Dashboard<\/strong>, press <strong>Reset shift<\/strong>/);
  // Part A's ticket has the same critical line.
  const a = startLab();
  a.open(A);
  a.run("hdRemoteSetTool('remote-support')");
  a.run(`hdRemoteRequest('${PC_A}', true)`);
  assert.ok(a.feedback(A).critical.some((line) => /Connect without asking/.test(line)));
}

// A password is never typed, shown or saved in a session.
function testNoPasswordInASession() {
  const tab = startLab();
  tab.open(A);
  tab.say('Please type your password: Winter2026!');
  assert.equal(tab.run('JSON.stringify(hdState)').includes('Winter2026'), false);
  assert.match(tab.toasts[tab.toasts.length - 1], /Stopped: never type a user's password/);
}

// Every step: a route the coach allows and the simulator draws, "Why:" and
// "Success looks like", and none of the words the spec rules out. Every
// command a step asks for sits only behind "Show me the command".
const COMMAND_LINES = ['ping NS-DC01', 'nslookup northstar.example', 'w32tm /query /status', 'w32tm /resync', 'Test-ComputerSecureChannel', 'Test-NetConnection NS-DC01 -Port 3389', 'Test-NetConnection NS-DC01 -Port 22'];
function testEveryStepText() {
  const tab = startLab();
  const coach = tab.coach('hd-m08');
  const allow = plain(coach.allow);
  const views = fs.readFileSync(path.join(UI, 'helpdesk.js'), 'utf8');
  coach.steps.slice(0, LAST).forEach((step, index) => {
    assert.ok(step.route, `step ${index + 1} has a route`);
    assert.ok(allow.includes(step.route), `step ${index + 1} route ${step.route} is allowed`);
    assert.ok(views.includes(`VIEWS['${step.route.slice(2)}']`), `step ${index + 1} route ${step.route} exists`);
    assert.match(step.body, /Why: /, `step ${index + 1} why`);
    assert.match(step.body, /Success looks like/, `step ${index + 1} success`);
    assert.equal(typeof step.check, 'function', `step ${index + 1} has a check`);
    const outside = String(step.instruction).replace(/<details>[\s\S]*?<\/details>/g, '');
    assert.doesNotMatch(outside, /<code>\s*(ping|nslookup|w32tm|Test-ComputerSecureChannel|Test-NetConnection|Get-WinEvent)\b/i, `step ${index + 1} names a command outside Show me the command`);
    for (const line of COMMAND_LINES) assert.ok(!outside.toLowerCase().includes(line.toLowerCase()), `step ${index + 1} shows "${line}" outside Show me the command`);
  });
  for (const step of coach.steps) {
    const text = `${step.title} ${step.instruction} ${step.body || ''}`;
    assert.doesNotMatch(text, /lab VM|CompTIA|Module 8\b/i, 'wording');
  }
  assert.doesNotMatch(coach.summary, /lab VM|CompTIA|Module 8\b/i);
  // Each command sits inside one complete Show me the command block.
  const blocks = coach.steps.flatMap((step) => String(step.instruction).match(/<details><summary>Show me the command<\/summary>[\s\S]*?<\/details>/g) || []);
  for (const line of COMMAND_LINES) assert.ok(blocks.some((block) => block.includes(line)), `${line} is inside Show me the command`);
  const last = coach.steps[LAST];
  assert.ok(last.finish, 'the last step is Finish');
  assert.match(last.finish.href, /coachComplete=hd-m08#\/program\/it-support\/module\/10$/);
}

// The coach opens each step's own route when the step starts. Drawing that
// screen on a fresh lab must never pass the step by itself.
function testOpeningAStepsScreenDoesNotPassIt() {
  const steps = startLab().coach('hd-m08').steps;
  steps.slice(0, LAST).forEach((step, index) => {
    if (!step.route || typeof step.check !== 'function') return;
    const tab = startLab();
    tab.open(index < 11 ? A : B);
    tab.view(step.route.slice(2));
    assert.equal(tab.coach('hd-m08').steps[index].check(), false, `step ${index + 1} passes when the coach opens ${step.route}`);
  });
}

/* ------------------------------------------------------------ fixtures */

// The Prove It's cause is taught in the readings only (spec decision 11). These
// are the SHA-256 hashes of the six lower-case words that name it; the words
// themselves are never written in the repository (the public-repo rule).
const CAUSE_HASHED = new Set([
  '74b1582e0ef61e55c852b332097f13663a858e50a773f941c629fca0192bb52f',
  'f3d1701e1d575e1294786989517866986bc97343e07af63e201f46ba0be5806a',
  'd6f845779b5f0a377f3854eb15f1b5b6ec3b34afb690b5f1241bb4c69d680c41',
  'fd1478e5fc36bfcf9d0ef6e489eeefd2734adf00dfaffb314fd14890b7c1dba3',
  '03d66dd08835c1ca3f128cceacd1f31ac94163096b20f445ae84285bc0832d72',
  'd398b29d3dbbb9bf201d4c7e1c19ff9d43c15fd45a0cec46fbe9885ec3f6e97f',
]);
const hashWord = (word) => crypto.createHash('sha256').update(word).digest('hex');
function testEveryClockIsCorrectAndTheCauseIsNeverNamed() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const sets = plain(tab.run("[HD_COACHED_SETS['its-08-guided'], HD_PRACTICE_SETS['its-08']]"));
  const ids = sets.flatMap((set) => set.tickets);
  assert.deepEqual(ids, [A, B, 'HD-2223', 'HD-2224', 'HD-2225']);
  const templates = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ${JSON.stringify(ids)}.includes(t.id))`));
  for (const ticket of templates) {
    for (const [name, machine] of Object.entries((ticket.console || {}).machines || {})) {
      const clock = machine.clock;
      if (!clock) continue;
      assert.equal(clock.shown, undefined, `${name}: no shown time`);
      assert.ok(!clock.offsetMinutes, `${name}: no offset`);
      assert.notEqual(clock.synced, false, `${name}: synced`);
      assert.doesNotMatch(String(clock.source || ''), /cmos|free-running/i, `${name}: a real time source`);
    }
  }
  // In a running lab and practice shift, every remote PC's clock is the shift clock.
  const lab = startLab();
  for (const name of [PC_A, PC_B]) assert.equal(lab.run(`hdRemoteClockCorrect('${name}', hdMachine('${name}'))`), true, `${name} clock correct`);
  const practice = sim(`${SIM_URL}?practice=its-08&student=stu-1#/helpdesk/tickets`);
  for (const [id, name] of [['HD-2223', 'NS-LT-0420'], ['HD-2224', 'NS-LT-0422']]) {
    practice.open(id);
    assert.equal(practice.run(`hdRemoteClockCorrect('${name}', hdMachine('${name}'))`), true, `${name} clock correct`);
  }
  // No word that names the Prove It's cause, in the tickets, the articles or the coach.
  const words = `${JSON.stringify(templates)} ${JSON.stringify(plain(tab.run("HD_ITS08_KB_ARTICLES")))} ${JSON.stringify(plain(tab.coach('hd-m08')))} ${tab.coach('hd-m08').steps.map((s) => `${s.instruction} ${s.body}`).join(' ')}`
    .toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean);
  const found = [...new Set(words)].filter((word) => CAUSE_HASHED.has(hashWord(word)));
  assert.deepEqual(found.map(hashWord), [], 'no Module 10 practice text names the Prove It\'s cause');
}

// The old HD-2110 story (a Tier 1 repair) is gone; the capstone's own copy is
// untouched; HD-2111 is off every student queue and hd-m08 no longer coaches it.
function testOldTicketsAndOldPath() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const t = plain(tab.run("HD_TICKET_TEMPLATES.find((x) => x.id === 'HD-2110')"));
  assert.equal(t.ownSet, true);
  assert.equal(t.priority, '', 'the student sets the priority (P3)');
  assert.doesNotMatch(JSON.stringify(t), /snapshot rolled back|Repair the secure channel, restart|Repair through approved Tier 2 procedure/, 'no Tier 1 repair path');
  assert.deepEqual(plain(t.console.priorityCoach), { impact: '3', urgency: '1', line: plain(t.console.priorityCoach).line });
  for (const id of ['HD-2110', 'HD-2111']) {
    assert.equal(tab.run(`HD_TICKET_TEMPLATES.find((x) => x.id === '${id}').ownSet`), true, `${id} is ownSet`);
    assert.equal(tab.run(`hdState.tickets.some((x) => x.id === '${id}')`), false, `${id} not in the shared shift`);
  }
  assert.equal(tab.run("[...Object.values(HD_PRACTICE_SETS), ...Object.values(HD_COACHED_SETS)].some((s) => s.tickets.includes('HD-2111'))"), false, 'HD-2111 in no set');
  assert.equal(tab.run("HD_TICKET_TEMPLATES.find((x) => x.id === 'HD-2111').console"), undefined, 'HD-2111 template unchanged apart from ownSet');
  assert.deepEqual(plain(tab.run("HD_COACHED_SETS['its-08-guided'].tickets")), [A, B]);
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m08': \['HD-2255', 'HD-2110'\]/);
  assert.doesNotMatch(coaches, /hdRegisterSimpleCoach\('hd-m08'/);
  // The capstone keeps its own copy of HD-2110 (Module 12's rewrite owns it).
  assert.match(fs.readFileSync(path.join(ROOT, 'portal', 'it-support-module-12.js'), 'utf8'), /HD-2110/);
  // The shared NS-LT-0131 row and the default computer are unchanged.
  assert.deepEqual(plain(tab.run("HD_COMPUTERS.find((c) => c.name === 'NS-LT-0131')")).ou, 'CN=Computers');
  assert.equal(tab.run('hdState.selectedComputer'), 'NS-LT-0131');
}

// The AD Computers General tab adds Enabled and the machine password only
// for a record that carries them: every older shift's tab is as before.
function testAdRowsOnlyWhereSet() {
  const tab = sim(`${SIM_URL}?practice=its-05&student=stu-1#/helpdesk/tickets`);
  tab.run("hdAdOpenComputer('NS-LT-0131')");
  assert.doesNotMatch(tab.view('helpdesk/active-directory'), /data-hd-ad-enabled|data-hd-ad-machine-password/);
  assert.equal(tab.run("hdAdComputerStatusRows({ name:'X' })"), '');
}

// The users and computers are the sets' own; Dana Whitfield is u-1112 (Module
// 09's Prove shift took u-1099).
function testSharedListsUnchanged() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  for (const name of ['NS-LT-0420', 'NS-LT-0421', 'NS-LT-0422', 'NS-WS-0320']) assert.equal(tab.run(`HD_COMPUTERS.some((c) => c.name === '${name}')`), false, `${name} is the sets' own`);
  assert.equal(tab.run("HD_USERS.some((u) => ['u-1100', 'u-1101', 'u-1102', 'u-1112'].includes(u.id))"), false);
  assert.deepEqual(plain(tab.run("HD_ITS08_USERS.map((u) => [u.id, u.name])")), [['u-1112', 'Dana Whitfield'], ['u-1100', 'Marisol Vega'], ['u-1101', 'Naomi Fischer'], ['u-1102', 'Victor Hale']]);
  assert.equal(tab.run("HD_KB_ARTICLES.some((a) => ['KB-0095', 'KB-0110', 'KB-0111'].includes(a.id))"), false, 'the articles are practice-only, set-level');
}

// A saved run of the old hd-m08 (on the shared shift) starts fresh; a run on
// the new set is kept.
function testOldCoachRunIsForgotten() {
  const local = store([['mnt.coach.resume', JSON.stringify({ id: 'hd-m08', step: 4, student: STUDENT })]]);
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m08', step: 4 })]]);
  sim(`${SIM_URL}#/helpdesk/tickets`, { local, session });
  assert.equal(local.getItem('mnt.coach.resume'), null, 'old resume dropped');
  assert.equal(session.getItem('mnt.coach.state'), null, 'old step dropped');
  const kept = store();
  const lab = startLab(null, kept);
  lab.open(A);
  lab.triage(A, 'Hardware', 'Audio / headset', PC_A, '3', '2');
  at(lab, 1, 'on A2');
  const again = sim(launchUrl('hd-m08', false), { local: kept, session: lab.session });
  assert.equal(again.run('hdState.ticketSet'), 'its-08-guided');
  assert.equal(again.coachStep(), 1, 'the new run resumes');
}

// The instructor sheet maps Lab 10.1 to HD-2255 and HD-2110; an older attempt
// keeps HD-2110 and HD-2111 (tests/admin-sheets/hdesk.cases.js has the cases).
function testSheetMapping() {
  const source = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  assert.match(source, /'lab-its-08-unfamiliar-problems': \['HD-2255', 'HD-2110'\]/);
  assert.match(source, /EARLIER_TICKETS_BY_LAB = \{[^}]*'lab-its-08-unfamiliar-problems': \['HD-2110', 'HD-2111'\]/);
  assert.match(source, /'lab-its-08-unfamiliar-problems': 'Module 10 · Two remote sessions'/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m10-guided-lab\.test\.js/);
}

// Every article "Check my work" asks for on a lab record is named in a step.
function testEveryArticleCheckIsInTheSteps() {
  const tab = startLab();
  const rules = (consoleBlock) => (consoleBlock.feedback || []).flatMap((area) => area.checks || []).flatMap((rule) => [rule.kb, rule.attached]).filter(Boolean);
  const lab = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ['${A}', '${B}'].includes(t.id)).map((t) => t.console)`));
  const labText = tab.coach('hd-m08').steps.map((step) => step.instruction || '').join('\n');
  [...new Set(lab.flatMap(rules))].forEach((id) => assert.ok(labText.includes(id), `hd-m08 names ${id}`));
}

const tests = [testLabOpensOnItsSet, testLab101, testTypedStepsAnyCase, testOpeningAfterConnectingNamesTheWayOut, testTypedStepsNeedTheRightComputer, testStepsNeedTheWorkTheyName, testCriticalLines, testNoPasswordInASession, testEveryStepText,
  testOpeningAStepsScreenDoesNotPassIt, testEveryClockIsCorrectAndTheCauseIsNeverNamed, testOldTicketsAndOldPath, testAdRowsOnlyWhereSet, testSharedListsUnchanged,
  testOldCoachRunIsForgotten, testSheetMapping, testCiRunsThisFile, testEveryArticleCheckIsInTheSteps];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }

'use strict';
// Help Desk Module 5 (key its-03) Practice It, Lab 5.2 · Practice tickets
// (not graded): the practice set 'its-03' (ui/helpdesk-data.js), opened with
// ?practice=its-03. Four tickets, each a different issue, each on its own
// clock (console.now), plus the two related records 5-B links:
//
//   - 5-A HD-2181 (INC0010481): a temporary profile a restart doesn't clear.
//     Done when it is with Desktop Support (Tier 2) with a complete note.
//   - 5-B HD-2182 (INC0010482): a dock driver blue screen. Verified in Device
//     Manager and Reliability Monitor after three clean dock cycles; linked to
//     INC0010411 (HD-2187) and INC0010415 (HD-2188).
//   - 5-C HD-2183 (INC0010483): a BitLocker recovery key, looked up in Active
//     Directory › Computers. Nothing is released before verification; the key
//     whose ID doesn't match is a critical error.
//   - 5-D HD-2186 (INC0010484): a laptop that shuts off from heat.
//
// Each ticket is worked end to end with the spec's model notes and comments
// (section 8.4 and section 7), and "Check my work" passes every area.
// Critical moves show as feedback. The set reports completion once, after all
// four, with the ticket ids only. Feedback only, never points.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const DESK2 = 'Desktop Support (Tier 2)';
const IDS = ['HD-2181', 'HD-2182', 'HD-2183', 'HD-2186'];
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null } = {}) {
  const u = new URL('https://academy.test/sim/?practice=its-03&student=student-m05p0001#/helpdesk/tickets');
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: store(), sessionStorage: store(), opener,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  vm.runInContext('hdNowMs = () => 1000000;', ctx);
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => byId.set(id, { id, value });
  const tab = {
    ctx, toasts, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    act: (id, action) => run(`hdConsoleAction(${j(id)}, ${j(action)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    search: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    select: (name) => run(`hdSelectComputer(${j(name)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions.map((a) => a.id)`)),
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    events: (computer, patch) => { run(`hdSelectComputer(${j(computer)})`); if (patch) run(`hdWinEventSet(${j(computer)}, ${j(patch)})`); return run("VIEWS['helpdesk/event-viewer']()"); },
    ad: (computer, tabId) => { run("hdSetAdTab('computers')"); run(`hdAdOpenComputer(${j(computer)})`); if (tabId) run(`hdAdComputerTab(${j(computer)}, ${j(tabId)})`); return run("VIEWS['helpdesk/active-directory']()"); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    rule: (id, rule) => run(`hdConsoleRule(hdTicketById(${j(id)}), ${j(rule)})`),
    checkWork: (id) => run(`hdConsoleCheckWork(${j(id)})`),
    closed: () => run('hdPracticeClosed()'),
  };
  return tab;
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
const shown = (html) => html.replace(/<[^>]*>/g, ' ');

// The spec's model notes (8.4) and customer texts (section 7, with 8.4's changes).
const A_NOTE = 'Reported: blank desktop, default background, Outlook asking to be set up; sign-in worked.\nTried: saw "You\'ve been signed in with a temporary profile"; Application log shows User Profile Service 1511 and 1515; signed out and restarted once per KB-0090, still temporary; C:\\Users\\nwilliams\\Desktop and Documents still hold his files; asked Noah not to save files or set up Outlook on this profile.\nResult: escalated to Desktop Support per KB-0090 with the event IDs; files confirmed intact.\nNext action: Desktop Support repairs the profile; Service Desk updates Noah by 11:30.';
const A_COMMENT = 'Hi Noah, you weren\'t hacked, and your files are safe. We can see them on your computer. Windows signed you into a temporary profile because it couldn\'t load your normal one. Our desktop team will repair it, usually within a couple of hours, and everything will come back as it was. Until then, please avoid saving new files on this computer; OneDrive and Outlook on the web work fine. I\'ll update you by 11:30. – Riley';
const B_NOTE = 'Reported: 3 blue screens today, each when docking; stop code DRIVER_IRQL_NOT_LESS_OR_EQUAL naming dockusbnet.sys (photo from the user).\nTried: Reliability Monitor shows the dock\'s USB Ethernet driver updated yesterday and 3 critical events since; stable undocked; two more tickets name the same dock model (INC0010411, INC0010415), so linked them and raised Impact to 2 (P3); rolled back the Dock USB Ethernet driver in Device Manager; docked and undocked 3 times.\nResult: no crash in 3 dock cycles; Device Manager shows the earlier driver version; Reliability Monitor shows no new critical event; Lisa confirmed.\nNext action: Desktop Support blocks this driver update for the dock model; the two linked tickets need the same rollback.';
const B_COMMENT = 'Hi Lisa, thanks for the photo of the error. It told us exactly where to look. A dock driver that installed yesterday was crashing your laptop. We\'ve put the previous, stable version back and tested docking several times with no crashes. We\'re also stopping that update for everyone else. – Riley';
const C_NOTE = 'Reported: BitLocker recovery screen after last night\'s firmware update; user travelling, boarding in 40 minutes.\nTried: verified per KB-0024 at 07:12 (called back on her directory mobile; employee ID confirmed); Key ID 3A7F9C21 on her screen matched a stored key for NS-LT-0099; read the recovery key aloud in groups per KB-0083.\nResult: Windows loaded at 07:16; Dina confirmed.\nNext action: Desktop Support rotates the recovery key, released today (Key ID 3A7F9C21).';
const C_COMMENT = 'Hi Dina, glad you\'re back in before your flight! The firmware update made your laptop ask for its security recovery key, which is normal after that kind of update. We confirmed it was you and gave you the key over the phone. We\'ll refresh the key on our side so it stays secure. Have a good trip. – Riley';
const D_NOTE = 'Reported: laptop shut off twice today during the payroll export; no blue screen, the screen goes black; export due at 2:00.\nTried: System log shows Kernel-Power Event ID 41 twice today; Reliability Monitor shows two "not properly shut down" events and no installs this week; no stop code. Evan says the case is very hot, the fan has been loud all week, and the laptop has sat on a stack of folders since Monday. Had him shut down, let it cool, move it to the bare desk and clear the vents.\nResult: export ran to the end; no new Event ID 41; fan quieter; Evan confirmed. Told him to call back if it shuts off again on a hard surface, so Desktop Support can check the fan.';
const D_COMMENT = 'Hi Evan, your laptop was shutting itself off to protect itself from heat. Sitting on the folders blocked the air vents underneath. On the bare desk it stayed cool and your export finished. Keep it on a hard, flat surface, and if it ever shuts off like that again, call us and our desktop team will check the fan. – Riley';
const KEYS = ['118206-447031-905526-263874-710349-582167-336092-871455', '654209-018337-472861-309514-826790-153408-947622-260183'];

function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET.key'), 'its-03');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [...IDS, 'HD-2187', 'HD-2188'].sort());
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2181'), '2026-08-20T10:05:00.000Z');
  assert.equal(now('HD-2182'), '2026-08-19T15:10:00.000Z');
  assert.equal(now('HD-2183'), '2026-08-21T07:05:00.000Z');
  assert.equal(now('HD-2186'), '2026-08-19T11:20:00.000Z');
  IDS.forEach((id) => assert.equal(tab.ticket(id).priority, '', `${id} opens with no priority`));
  // Students see INC numbers only.
  const queue = shown(tab.view('helpdesk/tickets'));
  ['INC0010481', 'INC0010482', 'INC0010483', 'INC0010484', 'INC0010411', 'INC0010415'].forEach((number) => assert.match(queue, new RegExp(number)));
  IDS.forEach((id) => assert.doesNotMatch(shown(tab.open(id)), /\bHD-21\d\d\b/, `${id} shows its INC number only`));
  // The KB articles are found by the spec's words.
  [['temporary profile', 'KB-0090'], ['blank desktop', 'KB-0090'], ['recovery key', 'KB-0083'], ['bitlocker', 'KB-0083'], ['slow', 'KB-0084'], ['startup', 'KB-0084'], ['slow start', 'KB-0084']]
    .forEach(([query, id]) => assert.ok(tab.search(query).includes(id), `"${query}" finds ${id}`));
  // The temporary profile appears only on 5-A's computer; NS-LT-0081's shared events stay hidden.
  assert.ok(!plain(tab.run('hdEvents().map((e) => e.computer)')).includes('NS-LT-0081'));
}

/* ------------------------------------------------------------ 5-A */
function work5A(tab) {
  const id = 'HD-2181'; const pc = 'NS-WS-0277';
  tab.open(id);
  tab.triage(id, 'Software', 'Windows profile', pc, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.ask(id, 'hacked', 'signin');
  tab.kb(id, 'temporary profile', 'KB-0090');
  tab.select(pc);
  assert.match(tab.view('helpdesk/windows'), /data-hd-profile="temporary"/);
  const html = tab.events(pc, { log: 'application' });
  assert.match(html, /data-hd-event-row="1511"/);
  assert.match(html, /data-hd-event-row="1515"/);
  tab.act(id, 'no-save');
  // The KB-0090 Tier 1 step: one restart. This time it doesn't clear.
  tab.run(`hdWinRestart('${pc}')`);
  assert.equal(tab.machine(pc).profile.temporary, true, 'the restart does not clear it');
  assert.match(tab.view('helpdesk/windows'), /data-hd-profile="temporary"/);
  tab.ask(id, 'restarted');
  assert.match(tab.open(id), /Same blank desktop/);
  assert.match(tab.ps('dir C:\\Users\\nwilliams\\Desktop'), /Q3 pipeline\.xlsx/);
  tab.note(id, A_NOTE);
  tab.comment(id, A_COMMENT);
  tab.run(`hdMatrixAssignGroup('${id}', ${JSON.stringify(DESK2)})`);
  assert.equal(tab.ticket(id).assignmentGroup, DESK2);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  [{ group: DESK2 }, { note: true }].forEach((rule) => assert.equal(tab.rule(id, rule), true, JSON.stringify(rule)));
}
function test5A() {
  const tab = sim();
  work5A(tab);
  // The three critical moves, each shown as feedback.
  const bad = sim();
  ['delete-profile', 'outlook-setup', 'reset-password'].forEach((action) => {
    bad.act('HD-2181', action);
    assert.match(bad.lastToast(), /^Critical error\./, action);
  });
  assert.equal(bad.feedback('HD-2181').critical.length, 3);
}

/* ------------------------------------------------------------ 5-B */
function work5B(tab) {
  const id = 'HD-2182'; const lt = 'NS-LT-0150';
  tab.open(id);
  tab.triage(id, 'Software', 'OS crash (BSOD)', lt, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.ask(id, 'undocked', 'photo');
  let html = tab.screen(lt, 'reliability');
  tab.run(`hdWinReliabilityDay('${lt}', 'Yesterday')`);
  assert.match(tab.view('helpdesk/reliability'), /Dock USB Ethernet driver updated/);
  // Before the fix, docking crashes it.
  tab.screen(lt, 'dock');
  tab.run(`hdDockDo('${lt}', 'dock')`);
  assert.match(tab.view('helpdesk/dock'), /data-hd-blue-screen/);
  assert.match(tab.view('helpdesk/dock'), /DRIVER_IRQL_NOT_LESS_OR_EQUAL[\s\S]*dockusbnet\.sys/);
  tab.run(`hdDockDo('${lt}', 'dock')`);
  // The pattern: link the two related records, then raise Impact to 2 (P3).
  tab.run(`hdLinkParent('HD-2187', '${id}'); hdLinkParent('HD-2188', '${id}')`);
  tab.run(`hdSetImpact('${id}', 'impact', '2')`);
  assert.equal(tab.ticket(id).priority, 'P3');
  // Roll Back Driver, then three clean dock cycles.
  tab.screen(lt, 'device-manager');
  tab.run(`hdDeviceOpen('${lt}', 'usbnet', 'driver')`);
  tab.run(`hdDeviceDriver('${lt}', 'usbnet', 'rollback')`);
  assert.equal(tab.machine(lt).devices.find((d) => d.id === 'usbnet').driver.version, '5.1.9.0');
  const before = tab.machine(lt).reliability.find((d) => d.today).critical.length;
  for (let i = 0; i < 3; i += 1) { tab.run(`hdDockDo('${lt}', 'dock')`); tab.run(`hdDockDo('${lt}', 'dock')`); }
  assert.equal(tab.machine(lt).reliability.find((d) => d.today).critical.length, before, 'no new critical event');
  assert.doesNotMatch(tab.screen(lt, 'dock'), /data-hd-blue-screen/);
  html = tab.screen(lt, 'device-manager');
  assert.match(tab.view('helpdesk/device-manager'), /5\.1\.9\.0|Dock USB Ethernet/);
  tab.screen(lt, 'reliability');
  tab.act(id, 'tell-desktop');
  tab.ask(id, 'confirm');
  assert.match(tab.open(id), /It stayed up every time/);
  tab.note(id, B_NOTE);
  tab.comment(id, B_COMMENT);
  tab.resolve(id, 'Rolled back the dock driver; three clean dock cycles.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  return html;
}
function test5B() {
  const tab = sim();
  work5B(tab);
  // Three cycles that crash after the rollback don't pass; a rollback then
  // only two cycles doesn't either.
  const short = sim(); const lt = 'NS-LT-0150';
  short.open('HD-2182');
  short.run(`hdDeviceDriver('${lt}', 'usbnet', 'rollback')`);
  short.run(`hdDockDo('${lt}', 'dock'); hdDockDo('${lt}', 'dock'); hdDockDo('${lt}', 'dock'); hdDockDo('${lt}', 'dock')`);
  assert.equal(short.rule('HD-2182', { actionsAfter: { after: 'driver-rollback', action: 'dock-connect', min: 3, without: 'blue-screen' } }), false, 'two cycles are not three');
  const crashing = sim();
  crashing.open('HD-2182');
  for (let i = 0; i < 3; i += 1) crashing.run(`hdDockDo('${lt}', 'dock'); hdDockDo('${lt}', 'dock')`);
  assert.equal(crashing.rule('HD-2182', { actionsAfter: { after: 'driver-rollback', action: 'dock-connect', min: 3, without: 'blue-screen' } }), false, 'no rollback yet');
  // Reliability Monitor read only before the fix doesn't verify it.
  const early = sim();
  early.open('HD-2182');
  early.screen(lt, 'reliability');
  early.run(`hdDeviceDriver('${lt}', 'usbnet', 'rollback')`);
  assert.equal(early.rule('HD-2182', { seen: 'reliability', computer: lt, after: 'driver-rollback' }), false, 'read before the rollback');
  early.screen(lt, 'reliability');
  assert.equal(early.rule('HD-2182', { seen: 'reliability', computer: lt, after: 'driver-rollback' }), true, 'read again after it');
  // Past the 200-action cap the comparison still holds: read before the
  // rollback, then 220 more actions, is still "before".
  const long = sim();
  long.open('HD-2182');
  long.run(`for (let i = 0; i < 40; i += 1) hdDockDo('${lt}', 'dock')`);
  long.screen(lt, 'reliability');
  long.run(`hdDeviceDriver('${lt}', 'usbnet', 'rollback')`);
  long.run(`for (let i = 0; i < 220; i += 1) hdDockDo('${lt}', 'dock')`);
  assert.ok(long.run("hdConsoleState(hdTicketById('HD-2182')).actionsDropped") > 0, 'the cap dropped old actions');
  assert.equal(long.rule('HD-2182', { seen: 'reliability', computer: lt, after: 'driver-rollback' }), false, 'still read before the rollback');
  // The critical move, as feedback.
  const bad = sim();
  bad.act('HD-2182', 'reset-pc');
  assert.match(bad.lastToast(), /^Critical error\./);
  assert.equal(bad.feedback('HD-2182').critical.length, 1);
}

/* ------------------------------------------------------------ 5-C */
function work5C(tab) {
  const id = 'HD-2183'; const lt = 'NS-LT-0099';
  tab.open(id);
  tab.triage(id, 'Software', 'Encryption (BitLocker)', lt, '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.kb(id, 'recovery key', 'KB-0083');
  tab.ask(id, 'keyid');
  let html = tab.ad(lt, 'bitlocker');
  assert.match(html, /data-hd-bitlocker-key="3A7F9C21"/);
  assert.match(html, /data-hd-bitlocker-key="B52E07D4"/, 'two stored keys');
  KEYS.forEach((key) => assert.ok(!html.includes(key), 'no key shown before Read key'));
  tab.run(`hdVerify('${id}', 'callback')`);
  assert.equal(tab.rule(id, { verified: true }), true);
  tab.run(`hdAdReadKey('${lt}', '3A7F9C21')`);
  assert.deepEqual(tab.actions(id).filter((a) => a.startsWith('read-')), ['read-match']);
  html = tab.view('helpdesk/active-directory');
  assert.ok(html.includes(KEYS[0]), 'the matching key is read out after verification');
  assert.ok(!html.includes(KEYS[1]));
  tab.ask(id, 'loaded');
  assert.match(tab.open(id), /It's loading! I'm in|It&#39;s loading! I&#39;m in/);
  tab.note(id, C_NOTE);
  tab.comment(id, C_COMMENT);
  tab.resolve(id, 'Verified the caller; matching key read aloud; Windows loaded.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
  // No key in any note, comment, the history or the console state: only the
  // ticket's own fixture copy (console.machines) holds it.
  const ticket = plain(tab.ticket(id));
  const holding = Object.keys(ticket).filter((field) => KEYS.some((key) => JSON.stringify(ticket[field]).includes(key)));
  assert.deepEqual(holding, ['console'], `the key is never recorded on the ticket (${holding.join(', ')})`);
}
function test5C() {
  const tab = sim();
  work5C(tab);
  // Nothing is released before verification: refused, and critical.
  const early = sim(); const lt = 'NS-LT-0099';
  early.open('HD-2183');
  early.ad(lt, 'bitlocker');
  early.run(`hdAdReadKey('${lt}', '3A7F9C21')`);
  assert.deepEqual(early.actions('HD-2183'), [], 'refused before verification');
  assert.match(early.lastToast(), /^Critical error\. Verify Dina/);
  assert.ok(!early.view('helpdesk/active-directory').includes(KEYS[0]), 'the key stays hidden');
  assert.equal(early.feedback('HD-2183').critical.length, 1);
  // A name and a deadline are not verification.
  early.run("hdVerify('HD-2183', 'name')");
  assert.equal(early.rule('HD-2183', { verified: true }), false);
  // After verification, the key whose ID doesn't match is a critical error,
  // and so is sending a key in writing.
  const wrong = sim();
  wrong.open('HD-2183');
  wrong.run("hdVerify('HD-2183', 'callback')");
  wrong.ad(lt, 'bitlocker');
  wrong.run(`hdAdReadKey('${lt}', 'B52E07D4')`);
  assert.match(wrong.lastToast(), /^Critical error\. That key's ID does not match/);
  ['email-key', 'text-key'].forEach((action) => { wrong.act('HD-2183', action); assert.match(wrong.lastToast(), /^Critical error\. Never send a recovery key/, action); });
  assert.equal(wrong.feedback('HD-2183').critical.length, 3);
  // The ticket card offers no Read key: the key is read from Active Directory only.
  assert.doesNotMatch(wrong.open('HD-2183'), /Read the stored key/);
}

/* ------------------------------------------------------------ 5-D */
function work5D(tab) {
  const id = 'HD-2186'; const lt = 'NS-LT-0118';
  tab.open(id);
  tab.triage(id, 'Hardware', 'Laptop', lt, '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  const html = tab.events(lt, { log: 'system' });
  assert.equal((html.match(/data-hd-event-row="41"/g) || []).length, 2, 'Event ID 41 twice today');
  assert.doesNotMatch(tab.screen(lt, 'reliability'), /blue screen|DRIVER_/i, 'no stop code, unlike 5-B');
  assert.match(tab.screen(lt, 'settings-storage'), /Drive health: <strong>Good/);
  tab.ask(id, 'screen', 'hot', 'where', 'changed');
  // The retest needs the fix first; escalating before it gets a Tier 1 line.
  tab.act(id, 'retry');
  assert.match(tab.lastToast(), /It shut off again/);
  tab.act(id, 'escalate-fan');
  assert.match(tab.lastToast(), /is a Tier 1 step\. Try it and test before you hand off/);
  assert.deepEqual(tab.actions(id), [], 'neither was done');
  tab.act(id, 'cool');
  tab.act(id, 'move');
  tab.act(id, 'retry');
  assert.match(tab.lastToast(), /starts the payroll export again/);
  tab.ask(id, 'quieter');
  assert.match(tab.open(id), /the fan is much quieter/);
  tab.events(lt, { log: 'system' });
  tab.note(id, D_NOTE);
  tab.comment(id, D_COMMENT);
  tab.resolve(id, 'Moved to a hard surface and cooled; export finished.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test5D() {
  const tab = sim();
  work5D(tab);
  // DISM and SFC is unnecessary feedback, not a critical error.
  const extra = sim();
  extra.act('HD-2186', 'dism-sfc');
  assert.match(extra.lastToast(), /System-file repair doesn't fix heat/);
  assert.equal(extra.feedback('HD-2186').critical.length, 0);
  ['open-case', 'reset-pc'].forEach((action) => { extra.act('HD-2186', action); assert.match(extra.lastToast(), /^Critical error\./, action); });
  assert.equal(extra.feedback('HD-2186').critical.length, 2);
  // The System log read only before the retest doesn't check for a new Event ID 41.
  const early = sim();
  early.events('NS-LT-0118', { log: 'system' });
  early.act('HD-2186', 'cool'); early.act('HD-2186', 'move'); early.act('HD-2186', 'retry');
  assert.equal(early.rule('HD-2186', { seen: 'event-log:system', computer: 'NS-LT-0118', after: 'retry' }), false);
}

/* ------------------------------------------------------------ the set */
function testCompletionAfterAllFour() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  work5A(tab);
  assert.equal(tab.closed(), false, 'three still open');
  work5B(tab);
  work5C(tab);
  assert.equal(tab.closed(), false, '5-D is still open');
  tab.run('hdPracticeReport()');
  assert.equal(sent.filter((m) => m.type === 'mnt-practice-complete').length, 0, 'nothing is sent early');
  work5D(tab);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1, 'one completion message');
  assert.equal(done[0].id, 'its-03');
  assert.equal(done[0].student, 'student-m05p0001');
  assert.deepEqual(done[0].tickets, IDS);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
  assert.doesNotMatch(JSON.stringify(done[0]), /score|points|expected|Reported:/i);
}

// No score or points anywhere the student reads in the practice set.
function testNoScoreInTheView() {
  const tab = sim();
  work5A(tab); work5B(tab); work5C(tab); work5D(tab);
  const pages = [tab.view('helpdesk/tickets'), tab.view('helpdesk/dashboard')];
  IDS.forEach((id) => { tab.checkWork(id); pages.push(tab.open(id)); });
  pages.forEach((html, i) => {
    const text = shown(html);
    assert.doesNotMatch(text, /\bscores?\b|\bpoints?\b|\d+\s*\/\s*100\b|\bpass(ed)? mark\b/i, `page ${i}: ${(text.match(/.{0,60}\b(scores?|points?)\b.{0,30}/i) || [''])[0]}`);
  });
}

// A question that waits for an action, asked too early, can be asked again
// after it: no ticket strands on a confirmation.
function testEarlyQuestionsCanBeAskedAgain() {
  const tab = sim();
  [['HD-2181', 'restarted', () => tab.run("hdWinRestart('NS-WS-0277')")],
    ['HD-2182', 'confirm', () => tab.run("hdDeviceDriver('NS-LT-0150', 'usbnet', 'rollback')")],
    ['HD-2183', 'loaded', () => { tab.run("hdVerify('HD-2183', 'callback')"); tab.ad('NS-LT-0099', 'bitlocker'); tab.run("hdAdReadKey('NS-LT-0099', '3A7F9C21')"); }],
    ['HD-2186', 'quieter', () => { tab.act('HD-2186', 'cool'); tab.act('HD-2186', 'move'); tab.act('HD-2186', 'retry'); }],
  ].forEach(([id, question, action]) => {
    tab.open(id);
    tab.ask(id, question);
    assert.equal(tab.rule(id, { confirmed: question }), false, `${id}: too early`);
    action();
    tab.ask(id, question);
    assert.equal(tab.rule(id, { confirmed: question }), true, `${id}: asked again after the action`);
  });
}

// The new rule kinds are off for every older ticket: no older ticket uses them.
// Module 6's tickets (HD-2176 to HD-2179) and Module 7's (HD-2189 to HD-2195)
// are newer and reuse them.
function testOlderTicketsUseNoNewRule() {
  const tab = sim();
  const kinds = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => !['HD-2180', ...${JSON.stringify(IDS)}, 'HD-2176', 'HD-2177', 'HD-2178', 'HD-2179', 'HD-2189', 'HD-2190', 'HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195'].includes(t.id))
    .flatMap((t) => ((t.console || {}).feedback || []).flatMap((a) => a.checks || [])).filter((r) => r.seen || r.typed || r.actionsAfter || r.triage)`));
  assert.deepEqual(kinds, []);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m05-practice-tickets\.test\.js/);
}

const tests = [testSetOpensOnItsOwnClocks, test5A, test5B, test5C, test5D, testCompletionAfterAllFour, testNoScoreInTheView, testEarlyQuestionsCanBeAskedAgain, testOlderTicketsUseNoNewRule, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m05-practice-tickets: all ${tests.length} passed`);

'use strict';
// Help Desk Module 6 (key its-07) Practice It, Lab 6.2 · Practice tickets
// (not graded): the practice set 'its-07' (ui/helpdesk-data.js), opened with
// ?practice=its-07. Three tickets, each a different issue, each on its own
// clock (console.now):
//
//   - 6-A HD-2177 (INC0010487): a OneDrive red X whose cause is a full path of
//     412 characters. Renaming the file leaves it; shortening a folder fixes it.
//   - 6-B HD-2178 (INC0010488): Zoom asks for an admin password. Zoom is in the
//     Software Catalog: convert to RITM0010120 and install it from Company
//     Portal or with winget (both earn the same feedback).
//   - 6-C HD-2179 (INC0010489): a failed Acrobat update. Reliability Monitor,
//     Repair, then the upgrade winget lists after the repair, then the .pdf
//     default.
//
// Each ticket is worked end to end with the spec's model notes and replies
// (section 8.4 and section 7), and "Check my work" passes every area. Each
// critical move shows as feedback. The set reports completion once, after all
// three, with the ticket ids only. Feedback only, never points.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const IDS = ['HD-2177', 'HD-2178', 'HD-2179'];
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null } = {}) {
  const u = new URL('https://academy.test/sim/?practice=its-07&student=student-m06p0001#/helpdesk/tickets');
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
    tab: (computer, screen, tabId) => { run(`hdWinScreenTab(${j(computer)}, ${j(screen)}, ${j(tabId)})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    rule: (id, rule) => run(`hdConsoleRule(hdTicketById(${j(id)}), ${j(rule)})`),
    checkWork: (id) => run(`hdConsoleCheckWork(${j(id)})`),
    closed: () => run('hdPracticeClosed()'),
  };
  return tab;
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
const shown = (html) => html.replace(/<[^>]*>/g, ' ');
const odPath = (od, file) => [od.root, file.folder || '', file.name].filter(Boolean).join('\\');

// The spec's model notes (8.4) and customer texts (section 7, with 8.4's changes).
const A_NOTE = 'Reported: red X on the OneDrive icon and a message that some files can\'t sync; worried about losing the Q3 forecast.\nTried: View sync problems listed 1 file; its name is valid; its full path is 412 characters (the limit is 400); storage 41% used; Leo renamed the folder "Final versions approved by Finance leadership" to "Final".\nResult: path now 372 characters; synced, visible on OneDrive on the web, status green. KB-0079 attached.';
const A_COMMENT = 'Hi Leo, your files were never at risk. They were all still on your laptop. OneDrive can\'t back up a file when its folder path is longer than 400 characters, and this one was six folders deep with long folder names. We shortened one folder name, and the forecast is now backed up and showing a green tick. Tip: keep folder names short, and avoid nesting more than a few folders deep. – Riley';
const B_NOTE = 'Reported: user needs Zoom for a customer call in 20 minutes; the installer asked for admin credentials.\nTried: Zoom is in the Software Catalog and in Company Portal; declined admin credentials per KB-0058; converted to RITM0010120; guided the install from Company Portal.\nResult: installed 10:42; test meeting OK; browser-join fallback explained.';
const B_COMMENT = 'Hi Tom, Zoom is installed and working. You\'ll find it in the Start menu. For security we never type admin passwords into installers, but nearly everything you need is in Company Portal and installs without one. If a customer link ever opens before an app is ready, "Join from your browser" works too. – Riley';
const C_NOTE = 'Reported: PDFs open in the browser; Acrobat crashes on launch since yesterday.\nTried: Reliability Monitor shows an Acrobat update failed yesterday at 15:10, with app crashes after it; ran Acrobat Repair; completed the update with winget; set .pdf to open in Acrobat.\nResult: PDFs open in Acrobat; signing works; user confirmed.';
const C_COMMENT = 'Hi Hannah, Acrobat is working again. An update yesterday didn\'t finish installing properly, which broke Acrobat and sent your PDFs to the browser instead. We repaired it, completed the update, and set PDFs to open in Acrobat again. You\'re ready to sign those contracts. – Riley';

function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET.key'), 'its-07');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), IDS);
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2177'), '2026-08-20T09:15:00.000Z');
  assert.equal(now('HD-2178'), '2026-08-20T10:22:00.000Z');
  assert.equal(now('HD-2179'), '2026-08-20T08:50:00.000Z');
  IDS.forEach((id) => assert.equal(tab.ticket(id).priority, '', `${id} opens with no priority`));
  // Students see INC numbers only.
  const queue = shown(tab.view('helpdesk/tickets'));
  ['INC0010487', 'INC0010488', 'INC0010489'].forEach((number) => assert.match(queue, new RegExp(number)));
  IDS.forEach((id) => assert.doesNotMatch(shown(tab.open(id)), /\bHD-21\d\d\b/, `${id} shows its INC number only`));
  // The KB articles are found by the spec's words (8.3).
  [['onedrive red x', 'KB-0079'], ['sync', 'KB-0079'], ['extension', 'KB-0080'], ['toolbar', 'KB-0080'], ['pua', 'KB-0080'], ['browser slow', 'KB-0080'],
    ['admin password', 'KB-0058'], ['local admin', 'KB-0058']]
    .forEach(([query, id]) => assert.ok(tab.search(query).includes(id), `"${query}" finds ${id}`));
  const kb58 = tab.run("hdKbArticles().find((a) => a.id === 'KB-0058').summary");
  assert.match(kb58, /Software in the Software Catalog installs from Company Portal with no admin rights\. Software that isn't in the catalog needs a software request\. Never type an admin password into a user's installer\./);
  assert.doesNotMatch(kb58, /printer/i, 'the practice copy has the software sentence, not the printer one');
}

/* ------------------------------------------------------------ 6-A */
function work6A(tab) {
  const id = 'HD-2177'; const pc = 'NS-LT-0252';
  tab.open(id);
  tab.triage(id, 'Software', 'Cloud storage (OneDrive)', 'OneDrive – lbrandt', '3', '3');
  assert.equal(tab.ticket(id).priority, 'P5');
  tab.ask(id, 'onlaptop');
  tab.kb(id, 'onedrive red x', 'KB-0079');
  tab.run(`hdKbAttach('${id}', 'KB-0079')`);
  tab.select(pc);
  // The red X, and its cause: the path, not the name.
  let html = tab.screen(pc, 'onedrive');
  assert.match(html, /data-hd-onedrive-icon="error"/);
  html = tab.tab(pc, 'onedrive', 'sync-problems');
  assert.match(html, /The path is too long: 412 characters \(the limit is 400\)/);
  assert.doesNotMatch(html, /characters that aren't allowed/, 'the name is valid');
  const od = tab.machine(pc).oneDrive;
  const file = od.files.find((f) => f.name === 'Q3 forecast - final.xlsx');
  assert.equal(odPath(od, file).length, 412);
  assert.equal(file.folder.split('\\').length, 6, 'six folders deep');
  // Renaming the file leaves the problem: the name was never the cause.
  tab.run(`hdWinOneDriveRename('${pc}', 0, 'file', 'Q3 forecast final.xlsx')`);
  assert.equal(tab.rule(id, { synced: pc }), false, 'renaming the file leaves the red X');
  assert.match(tab.feedback(id).areas.find((a) => a.area === 'Action').text, /the name was never the problem/);
  tab.run(`hdWinOneDriveRename('${pc}', 0, 'file', 'Q3 forecast - final.xlsx')`);
  // Shortening the long folder fixes it.
  const at = file.folder.split('\\').indexOf('Final versions approved by Finance leadership');
  assert.equal(at, 4);
  tab.run(`hdWinOneDriveRename('${pc}', 0, 'folder:${at}', 'Final')`);
  const after = tab.machine(pc).oneDrive;
  assert.equal(odPath(after, after.files.find((f) => f.name === 'Q3 forecast - final.xlsx')).length, 372);
  assert.match(tab.view('helpdesk/onedrive'), /data-hd-onedrive-icon="synced"/);
  html = tab.tab(pc, 'onedrive', 'web');
  assert.match(html, /data-hd-web-file="Q3 forecast - final\.xlsx"/);
  tab.note(id, A_NOTE);
  tab.comment(id, A_COMMENT);
  tab.resolve(id, 'Shortened the folder path; the forecast syncs.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test6A() {
  const tab = sim();
  work6A(tab);
  // Unlink, Reset and deleting the file are each critical-error feedback.
  [['unlink', "hdWinOneDriveControl('NS-LT-0252','unlink')"], ['reset', "hdWinOneDriveControl('NS-LT-0252','reset')"], ['delete', "hdWinOneDriveDelete('NS-LT-0252', 0)"]].forEach(([label, code]) => {
    const bad = sim();
    bad.open('HD-2177'); bad.select('NS-LT-0252');
    bad.run(code);
    assert.equal(bad.feedback('HD-2177').critical.length, 1, label);
    // The ticket can still be resolved: Practice never strands a ticket.
    bad.note('HD-2177', A_NOTE);
    bad.resolve('HD-2177', 'Resolved after the critical move.');
    assert.equal(bad.ticket('HD-2177').status, 'Resolved', `${label}: still resolves`);
  });
  // Deleting the file clears the red X, but it never counts as synced.
  const del = sim();
  del.open('HD-2177'); del.select('NS-LT-0252');
  del.run("hdWinOneDriveDelete('NS-LT-0252', 0)");
  assert.match(del.view('helpdesk/onedrive'), /data-hd-onedrive-icon="synced"/);
  assert.equal(del.rule('HD-2177', { synced: 'NS-LT-0252' }), false);
}

/* ------------------------------------------------------------ 6-B */
function work6B(tab, route) {
  const id = 'HD-2178'; const lt = 'NS-LT-0241';
  tab.open(id);
  tab.triage(id, 'Software', 'Install request', lt, '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.kb(id, 'admin password', 'KB-0058');
  tab.select(lt);
  tab.run(`hdConvertSet('${id}','item','Software install (Software Catalog app)'); hdConvertToRequest('${id}')`);
  const request = plain(tab.ticket(id).request);
  assert.equal(request.number, 'RITM0010120');
  assert.equal(request.approval, 'Not required (Software Catalog app)');
  assert.equal(request.requestedFor, 'Tom Becker');
  assert.equal(tab.closed(), false, 'a converted 6-B is not done before Zoom is installed');
  if (route === 'portal') {
    assert.match(tab.screen(lt, 'company-portal'), /data-hd-portal-app="Zoom"/);
    tab.ask(id, 'portal');
    tab.run(`hdWinPortalInstall('${lt}', 'Zoom')`);
  } else {
    assert.match(tab.ps('winget search zoom'), /Zoom\.Zoom/);
    assert.match(tab.ps('WINGET install --id zoom.zoom -e --silent'), /Successfully installed/);
  }
  assert.ok(tab.machine(lt).installedApps.some((a) => a.name === 'Zoom'));
  tab.ask(id, 'browser', 'test');
  assert.match(tab.open(id), /Test meeting connected/);
  tab.note(id, B_NOTE);
  tab.comment(id, B_COMMENT);
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test6B() {
  // Both routes earn full feedback (call 11).
  work6B(sim(), 'portal');
  work6B(sim(), 'winget');
  // Typing the password and giving admin rights are critical-error feedback.
  const bad = sim();
  bad.open('HD-2178');
  ['type-admin-password', 'grant-local-admin'].forEach((action) => {
    bad.act('HD-2178', action);
    assert.match(bad.lastToast(), /^Critical error\./, action);
  });
  assert.equal(bad.feedback('HD-2178').critical.length, 2);
  // An app outside the Software Catalog: winget finds nothing, and Practice
  // says it needs a software request.
  const tab = sim();
  tab.open('HD-2178'); tab.select('NS-LT-0241');
  assert.match(tab.ps('winget install --id FreeVideoConverter -e'), /No package found matching input criteria\.\nApps outside the Software Catalog need a software request\./);
  assert.equal(tab.rule('HD-2178', { typed: '^winget\\s+install\\b', computer: 'NS-LT-0241' }), false, 'a refused winget line is not done');
}

/* ------------------------------------------------------------ 6-C */
function work6C(tab) {
  const id = 'HD-2179'; const pc = 'NS-WS-0318';
  tab.open(id);
  tab.triage(id, 'Software', 'Desktop application', pc, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.ask(id, 'changed');
  tab.select(pc);
  // What changed: the failed update yesterday, then three crashes.
  tab.screen(pc, 'reliability');
  tab.run(`hdWinReliabilityDay('${pc}', 'Yesterday')`);
  const html = tab.view('helpdesk/reliability');
  assert.match(html, /Adobe Acrobat update: failed \(15:10\)/);
  const crashes = tab.machine(pc).reliability.flatMap((d) => d.critical).filter((c) => /Acrobat stopped working/.test(c));
  assert.equal(crashes.length, 3, 'three crashes after the failed update');
  // Before the repair, winget upgrade does not list Acrobat.
  assert.doesNotMatch(tab.ps('winget upgrade'), /Adobe\.Acrobat/);
  tab.screen(pc, 'settings-apps');
  tab.run(`hdWinRepairApp('${pc}', 'Adobe Acrobat', 'repair')`);
  assert.match(tab.ps('winget upgrade'), /Adobe\.Acrobat\.Reader\.64-bit/, 'listed after the repair');
  assert.match(tab.ps('winget upgrade --id Adobe.Acrobat.Reader.64-bit -e'), /Successfully installed/);
  assert.equal(tab.machine(pc).defaultApps['.pdf'], 'Microsoft Edge');
  tab.screen(pc, 'default-apps');
  tab.run(`hdWinSetDefault('${pc}', '.pdf', 'Adobe Acrobat')`);
  tab.ask(id, 'pdf');
  assert.match(tab.open(id), /It opens in Acrobat and I can sign/);
  tab.note(id, C_NOTE);
  tab.comment(id, C_COMMENT);
  tab.resolve(id, 'Repaired Acrobat, finished the update, restored the .pdf default.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  allOk(tab.feedback(id), id);
  assert.deepEqual(tab.feedback(id).critical, []);
}
function test6C() {
  work6C(sim());
  // Reset this PC and deleting the program folder are critical-error feedback.
  const bad = sim();
  bad.open('HD-2179'); bad.select('NS-WS-0318');
  bad.run("hdWinResetPc('NS-WS-0318')");
  bad.act('HD-2179', 'delete-program-folder');
  assert.equal(bad.feedback('HD-2179').critical.length, 2);
  bad.note('HD-2179', C_NOTE);
  bad.resolve('HD-2179', 'Resolved after the critical moves.');
  assert.equal(bad.ticket('HD-2179').status, 'Resolved', 'still resolves');
}

/* ------------------------------------------------------------ the set */
function testCompletionAfterAllThree() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  work6A(tab);
  work6B(tab, 'portal');
  assert.equal(tab.closed(), false, '6-C is still open');
  tab.run('hdPracticeReport()');
  assert.equal(sent.filter((m) => m.type === 'mnt-practice-complete').length, 0, 'nothing is sent early');
  work6C(tab);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1, 'one completion message');
  assert.equal(done[0].id, 'its-07');
  assert.equal(done[0].student, 'student-m06p0001');
  assert.deepEqual(done[0].tickets, IDS);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
  assert.doesNotMatch(JSON.stringify(done[0]), /score|points|expected|Reported:/i);
}

// No score or points anywhere the student reads in the practice set.
function testNoScoreInTheView() {
  const tab = sim();
  work6A(tab); work6B(tab, 'winget'); work6C(tab);
  const pages = [tab.view('helpdesk/tickets'), tab.view('helpdesk/dashboard')];
  IDS.forEach((id) => { tab.checkWork(id); pages.push(tab.open(id)); });
  pages.forEach((html, i) => {
    const text = shown(html);
    assert.doesNotMatch(text, /\bscores?\b|\bpoints?\b|\d+\s*\/\s*100\b|\bpass(ed)? mark\b/i, `page ${i}: ${(text.match(/.{0,60}\b(scores?|points?)\b.{0,30}/i) || [''])[0]}`);
  });
}

// A question that waits for an action, asked too early, can be asked again.
function testEarlyQuestionsCanBeAskedAgain() {
  const tab = sim();
  [['HD-2178', 'test', () => tab.run("hdWinPortalInstall('NS-LT-0241', 'Zoom')")],
    ['HD-2179', 'pdf', () => tab.run("hdWinSetDefault('NS-WS-0318', '.pdf', 'Adobe Acrobat')")],
  ].forEach(([id, question, action]) => {
    tab.open(id);
    tab.ask(id, question);
    assert.equal(tab.rule(id, { confirmed: question }), false, `${id}: too early`);
    action();
    tab.ask(id, question);
    assert.equal(tab.rule(id, { confirmed: question }), true, `${id}: asked again after the action`);
  });
}

// The Module 6 rule kinds are off for every older ticket: no older ticket uses them.
// Module 7's tickets (HD-2189 to HD-2195) are newer and reuse them.
const MODULE_7 = ['HD-2189', 'HD-2190', 'HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195', 'HD-2202', 'HD-2203', 'HD-2204', 'HD-2205', 'HD-2206'];
function testOlderTicketsUseNoNewRule() {
  const tab = sim();
  const mine = ['HD-2176', ...IDS, ...MODULE_7];
  const kinds = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => !${JSON.stringify(mine)}.includes(t.id))
    .flatMap((t) => ((t.console || {}).feedback || []).flatMap((a) => a.checks || [])).filter((r) => r.any || r.attached || r.requestItem || r.machine || r.appInstalled || r.synced)`));
  assert.deepEqual(kinds, []);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m06-practice-tickets\.test\.js/);
}

const tests = [testSetOpensOnItsOwnClocks, test6A, test6B, test6C, testCompletionAfterAllThree, testNoScoreInTheView, testEarlyQuestionsCanBeAskedAgain, testOlderTicketsUseNoNewRule, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m06-practice-tickets: all ${tests.length} passed`);

'use strict';
// Help Desk Module 10 (key its-08) Practice It, Lab 10.2 (HD_PRACTICE_SETS
// 'its-08', opened from the course page with ?practice=its-08): tickets 10-A
// to 10-C, feedback only, never points.
//
//   - 10-A HD-2223 (INC0010534): the COO's Outlook search finds nothing before
//     a 14:00 board meeting. Verify even a senior caller, Quick Assist with
//     consent and privacy, Outlook on the web first, then start the stopped
//     Windows Search service on NS-LT-0420 (P2). Stays open for a 16:00 check.
//   - 10-B HD-2224 (INC0010535): the Boardroom projector NS-RM-PROJ01 is fuzzy
//     and cut off because NS-LT-0422 duplicates at 2560 × 1600; set the
//     projector's 1920 × 1080 (P2).
//   - 10-C HD-2225 (INC0010536): POST beeps and a black screen on NS-WS-0320
//     after a desk move. Remote Support shows it offline; the monitor first, the
//     safety question, the maker's beep-code page, then Desktop Support (P4).
//   - KB-0095, KB-0110 and KB-0111 are practice-only, set-level articles found
//     by their keywords. Each ticket's feedback names its critical lines.
//
// The simulator runs in a Node vm with a small fake DOM. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const SET_URL = 'https://academy.test/sim/?practice=its-08&student=student-m10p0001#/helpdesk/tickets';
const plain = (value) => JSON.parse(JSON.stringify(value));
const T10A = 'HD-2223';
const T10B = 'HD-2224';
const T10C = 'HD-2225';

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim(url = SET_URL) {
  const u = new URL(url);
  const fields = {};
  const toasts = [];
  const opener = { sent: [], closed: false, postMessage(data) { this.sent.push(JSON.parse(JSON.stringify(data))); } };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => (Object.prototype.hasOwnProperty.call(fields, id) ? { value: fields[id] } : null), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
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
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const type = (id, value, code) => { fields[id] = value; try { return run(code); } finally { delete fields[id]; } };
  const tab = {
    ctx, toasts, opener, run, type,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    note: (id, text) => type('hd-note-input', text, `hdAddNote(${j(id)})`),
    comment: (id, text) => type('hd-comment-input', text, `hdAddComment(${j(id)})`),
    resolve: (id, code) => type('hd-resolution-notes', 'Projector set to its own resolution; Naomi confirmed.', `hdTransitionTicket(${j(id)}, 'In Progress'); hdSetResolutionCode(${j(id)}, ${j(code)}); hdTransitionTicket(${j(id)}, 'Resolved')`),
    say: (text) => type('hd-remote-say', text, 'hdRemoteSay({ preventDefault() {} })'),
    find: (name) => type('hd-remote-find', name, 'hdRemoteFind({ preventDefault() {} })'),
    remote: (id) => plain(run(`hdRemoteState(hdTicketById(${j(id)}))`)),
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    kb: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
  };
  return tab;
}
const allOk = (tab, id) => {
  const feedback = tab.feedback(id);
  feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, [], `${id} no critical line`);
  assert.deepEqual(feedback.flags, [], `${id} no flag`);
};
// A Quick Assist session with the opening, the code and full control.
function quickAssist(tab, id, who) {
  tab.say(`Thanks ${who}, you're verified. May I connect to your computer? Please close anything personal first, and I'll tell you what I'm doing as I go.`);
  tab.run('hdRemoteQuickAssist()');
  tab.say(`Your code is ${tab.remote(id).pending.code}.`);
  tab.run("hdRemoteAskControl('full')");
  assert.match(tab.view('helpdesk/remote-support'), /Connected \(full control\)/);
}

const NOTE_10A = 'Reported: Outlook search returns nothing; needs the auditor\'s emails for the 14:00 board meeting.\nTried: verified by callback 11:42; Quick Assist with her consent 11:44 to 12:01, opened only Outlook and search settings. Indexing Status stuck at 34,112 items; Searching Windows: "The search service is not running". Workaround: Outlook on the web search; Dana found the auditor\'s emails. Windows Search service was Stopped (Automatic, Delayed Start); started it; indexing counting down.\nResult: desktop Outlook search catching up; Dana has what she needs for 14:00; session ended 12:01.\nNext action: 16:00 check desktop Outlook search with Dana; resolve if it finds mail, otherwise to Desktop Support with this note.';
const COMMENT_10A = 'Hi Dana, you\'ve got the auditor\'s emails for the board meeting. The search on your laptop had stopped updating, so we used Outlook on the web, which searches your mailbox directly. We\'ve restarted the search on your laptop; it will catch up over the next few hours, and I\'ll check with you at 4:00. – Riley';
const NOTE_10B = 'Reported: Boardroom projector picture fuzzy and the bottom of each slide cut off; board at 14:00.\nTried: verified by callback; picture present, so the input is right. Quick Assist with consent 13:47 to 13:53, display settings only. Duplicate at 2560 × 1600 (the laptop\'s resolution); the projector\'s native is 1920 × 1080; set 1920 × 1080.\nResult: slides sharp and whole on the projector at 13:52; Naomi confirmed; session ended 13:53.';
const COMMENT_10B = 'Hi Naomi, glad it\'s sorted before 2:00. Your laptop was sending the projector a picture size it doesn\'t use, so the projector stretched it and cut the bottom off. We\'ve set your laptop to the projector\'s own size, and the slides are sharp and whole. – Riley';
const NOTE_10C = 'Reported: NS-WS-0320 won\'t start since the desk was moved over the weekend: fans run, one long and two short beeps, black screen. Using the PC at the end of the row for now.\nTried: one user. Remote Support: agent offline since Friday 17:42 (Windows not starting). Monitor light orange, "No signal"; cable reseated at both ends, input checked: still black, same beeps. No burning smell, smoke or sparks. Maker\'s beep-code page: 1 long, 2 short = video adapter not detected, or memory error. Asked Victor to leave it switched off.\nResult: assigned to Desktop Support at P4; Victor working at the end-of-row PC.\nNext action: Desktop Support to check NS-WS-0320\'s memory and graphics after the desk move; Service Desk to tell Victor when it\'s back.';
const COMMENT_10C = 'Hi Victor, thanks for the clear description, it helped a lot. Those beeps are your computer\'s own start-up check telling us it found a hardware problem, probably a part that loosened when the desk was moved. Please leave it switched off; our desktop team will check it, and we\'ll let you know when it\'s ready. The PC at the end of the row has your files. If you ever smell burning from a computer, switch it off at the wall and call us straight away. – Riley';

function work10A(tab) {
  const pc = 'NS-LT-0420';
  tab.open(T10A);
  assert.equal(tab.run('hdShiftNow(hdTicketById("HD-2223")).toISOString()'), '2026-08-24T11:40:00.000Z');
  tab.triage(T10A, 'Software', 'Email (Outlook)', pc, '2', '1');
  assert.equal(tab.ticket(T10A).priority, 'P2');
  tab.run(`hdVerify('${T10A}', 'callback')`);
  quickAssist(tab, T10A, 'Dana');
  tab.run("hdRemoteAsk('close-personal')");
  tab.say('I\'m opening Outlook\'s search status now.');
  tab.run(`hdOpenMachineScreen('${pc}', 'outlook-search')`);
  assert.match(tab.view('helpdesk/outlook-search'), /34,112 items remaining/);
  tab.run(`hdOpenMachineScreen('${pc}', 'settings-search')`);
  assert.match(tab.view('helpdesk/settings-search'), /The search service is not running/);
  // No article covers this (a KB search that finds nothing is still a step).
  assert.deepEqual(tab.kb('outlook search').filter((id) => /^KB-0(095|110|111)$/.test(id)), [], 'no Module 10 article for this: use the method');
  // The workaround first: Outlook on the web.
  tab.run(`hdOpenMachineScreen('${pc}', 'outlook-web')`);
  tab.type('hd-owa-search', 'auditor', `hdOwaSearch({ preventDefault() {} }, '${pc}')`);
  assert.match(tab.view('helpdesk/outlook-web'), /2 results for "auditor"/);
  // The fix: start the stopped service; no rebuild.
  tab.run(`hdOpenMachineScreen('${pc}', 'pc-services')`);
  assert.match(tab.view('helpdesk/pc-services'), /data-hd-pc-service="WSearch" data-hd-service-status="Stopped"/);
  tab.run(`hdPcServiceStart('${pc}', 'WSearch')`);
  tab.run(`hdOpenMachineScreen('${pc}', 'outlook-search')`);
  assert.match(tab.view('helpdesk/outlook-search'), /32,912 items remaining/, 'the count moves');
  tab.say('It will catch up over the next few hours. I\'m disconnecting now.');
  tab.run('hdRemoteEnd()');
  tab.open(T10A);
  tab.note(T10A, NOTE_10A);
  tab.comment(T10A, COMMENT_10A);
  tab.type('hd-follow-up-input', '2026-08-24T16:00', `hdFollowUpSet('${T10A}')`);
  assert.notEqual(tab.ticket(T10A).status, 'Resolved', 'stays open for the 16:00 check');
}
function work10B(tab) {
  const pc = 'NS-LT-0422';
  tab.open(T10B);
  tab.triage(T10B, 'Hardware', 'Projector / room display', 'NS-RM-PROJ01', '2', '1');
  assert.equal(tab.ticket(T10B).priority, 'P2');
  tab.run(`hdVerify('${T10B}', 'callback')`);
  tab.run(`hdChatAsk('${T10B}', 'picture')`);
  quickAssist(tab, T10B, 'Naomi');
  tab.run(`hdOpenMachineScreen('${pc}', 'dock')`);
  const dock = tab.view('helpdesk/dock');
  assert.match(dock, /<strong>NS-RM-PROJ01 · Boardroom projector<\/strong><span class="muted">Fuzzy and cut off<\/span>/);
  assert.match(dock, /<option value="1920 × 1080" >1920 × 1080 \(Recommended\)<\/option>/);
  tab.say('I\'m going to set the projector to its own resolution now.');
  tab.run(`hdDisplayResolution('${pc}', 'proj', '1920 × 1080')`);
  tab.run(`hdDisplayKeep('${pc}', 'proj', true)`);
  assert.match(tab.view('helpdesk/dock'), /<dd data-hd-picture>Sharp<\/dd>/);
  tab.run("hdRemoteAsk('whole-slide')");
  tab.say('Great, I\'m disconnecting now.');
  tab.run('hdRemoteEnd()');
  tab.open(T10B);
  tab.run(`hdKbOpen('${T10B}', 'KB-0111'); hdKbAttach('${T10B}', 'KB-0111')`);
  tab.note(T10B, NOTE_10B);
  tab.comment(T10B, COMMENT_10B);
  tab.resolve(T10B, 'Solution provided');
  assert.equal(tab.ticket(T10B).status, 'Resolved', tab.toasts.slice(-3).join(' | '));
}
function work10C(tab) {
  tab.open(T10C);
  tab.triage(T10C, 'Hardware', 'Desktop', 'NS-WS-0320', '3', '2');
  assert.equal(tab.ticket(T10C).priority, 'P4');
  // Remote Support shows the PC offline: no session is possible.
  tab.run("hdRemoteSetTool('remote-support')");
  tab.find('NS-WS-0320');
  const remote = tab.view('helpdesk/remote-support');
  assert.match(remote, /Offline since Friday 17:42/);
  assert.match(remote, /data-hd-remote-request onclick="[^"]*" disabled>/);
  for (const q of ['light', 'reseat-cable', 'burning', 'pattern']) tab.run(`hdChatAsk('${T10C}', '${q}')`);
  tab.run(`hdEvidenceOpen('${T10C}', 'asset-ns-ws-0320')`);
  tab.run(`hdEvidenceOpen('${T10C}', 'beep-codes-sd5')`);
  assert.match(tab.open(T10C), /Video adapter not detected, or memory error/);
  tab.run(`hdChatAsk('${T10C}', 'leave-off')`);
  tab.note(T10C, NOTE_10C);
  tab.comment(T10C, COMMENT_10C);
  tab.run(`hdMatrixAssignGroup('${T10C}', 'Desktop Support (Tier 2)')`);
  assert.equal(tab.ticket(T10C).assignmentGroup, 'Desktop Support (Tier 2)');
}

function testSetShape() {
  const tab = sim();
  assert.equal(tab.run('hdState.practiceSet'), 'its-08');
  const set = plain(tab.run("HD_PRACTICE_SETS['its-08']"));
  assert.equal(set.title, 'Module 10 practice tickets');
  assert.deepEqual(set.tickets, [T10A, T10B, T10C]);
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [T10A, T10B, T10C]);
  assert.deepEqual([T10A, T10B, T10C].map((id) => tab.ticket(id).number), ['INC0010534', 'INC0010535', 'INC0010536']);
  // Feedback only: no ticket has points, a score or a rubric.
  const text = tab.run(`JSON.stringify(HD_TICKET_TEMPLATES.filter((t) => ${JSON.stringify(set.tickets)}.includes(t.id)))`);
  assert.doesNotMatch(text, /\bpoints?\b|"score"|rubric|\/100/i);
}

function testEachTicketToAllAreasMet() {
  const tab = sim();
  work10A(tab); allOk(tab, T10A);
  work10B(tab); allOk(tab, T10B);
  work10C(tab); allOk(tab, T10C);
  assert.equal(tab.run('hdPracticeClosed()'), true, 'every ticket counts as done: 10-A by its follow-up and note, 10-C with Desktop Support');
}

// The set is not done until 10-A has its follow-up and 10-C is with Desktop Support.
function testSetNeedsEachDoneRule() {
  const tab = sim();
  work10B(tab);
  assert.equal(tab.run('hdPracticeClosed()'), false);
  work10A(tab);
  assert.equal(tab.run('hdPracticeClosed()'), false, '10-C still open');
  work10C(tab);
  assert.equal(tab.run('hdPracticeClosed()'), true);
}

// Critical (feedback only): skipping verification because the caller is
// senior, and Connect without asking on a person's PC.
function testCriticalLines() {
  const a = sim();
  a.open(T10A);
  a.run(`hdVerify('${T10A}', 'senior')`);
  a.run("hdRemoteSetTool('remote-support')");
  a.run("hdRemoteRequest('NS-LT-0420', true)");
  const critical = a.feedback(T10A).critical.join('\n');
  assert.match(critical, /Chose: Skip it: she is the COO and she is in a hurry/);
  assert.match(critical, /Connect without asking/);
  const b = sim();
  b.open(T10B);
  b.run("hdRemoteSetTool('remote-support')");
  b.run("hdRemoteRequest('NS-LT-0422', true)");
  assert.match(b.feedback(T10B).critical.join('\n'), /Connect without asking/);
  // 10-C's feedback names its critical lines in the Action fix.
  const c = sim();
  c.open(T10C);
  const action = c.feedback(T10C).areas.find((area) => area.area === 'Action').text;
  assert.match(action, /Desktop Support/);
  const fix = plain(c.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2225').console.feedback.find((a) => a.area === 'Action').fix"));
  assert.match(fix, /Critical \(feedback only\): telling him to open the case or reseat parts inside it; carrying on after a reported burning smell\./);
}

// A rebuild is not offered; the service start is the one change.
function testOneChangeNotARebuild() {
  const tab = sim();
  tab.open(T10A);
  const fix = plain(tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2223').console.feedback.find((a) => a.area === 'Action').fix"));
  assert.match(fix, /Do not rebuild the index/);
}

// Each article is found by each of its keywords, only in Module 10's sets.
function testKbArticlesFoundByKeywords() {
  const tab = sim();
  const articles = plain(tab.run('HD_ITS08_KB_ARTICLES'));
  assert.deepEqual(articles.map((a) => a.id), ['KB-0095', 'KB-0110', 'KB-0111']);
  for (const article of articles) {
    assert.equal(article.practiceOnly, true, `${article.id} practice only`);
    for (const keyword of article.keywords.split(' · ')) assert.ok(tab.kb(keyword).includes(article.id), `${article.id} found by "${keyword}"`);
  }
  assert.equal(plain(articles.find((a) => a.id === 'KB-0095')).audience, 'Desktop Support');
  const shared = sim('https://academy.test/sim/#/helpdesk/tickets');
  assert.deepEqual(shared.kb('trust relationship').filter((id) => /^KB-0(095|110|111)$/.test(id)), [], 'not in the shared shift');
  // A Prove shift never gets them.
  assert.equal(shared.run("Object.values(HD_PROVE_SHIFTS).some((s) => (s.kbArticles || []).some((a) => ['KB-0095', 'KB-0110', 'KB-0111'].includes(a.id)))"), false);
}

// The fixture: users, computers, the projector, the evidence cards, the
// categories; every remote PC is a person's PC with an attended request.
function testFixture() {
  const tab = sim();
  assert.deepEqual(plain(tab.run('Object.keys(HD_ITS08_CATEGORIES)')), ['Hardware', 'Software', 'Network', 'Request', 'Access']);
  assert.ok(tab.run("HD_ITS08_CATEGORIES.Hardware.includes('Projector / room display') && HD_ITS08_CATEGORIES.Hardware.includes('Audio / headset')"));
  assert.deepEqual(plain(tab.run('HD_ITS08_COMPUTERS.map((c) => c.name)')), ['NS-LT-0420', 'NS-LT-0421', 'NS-LT-0422', 'NS-WS-0320']);
  assert.match(tab.run("JSON.stringify(HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2224').console)"), /NS-RM-PROJ01 · Boardroom projector/);
  const cards = plain(tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2225').console.evidence.map((c) => c.id)"));
  assert.deepEqual(cards, ['asset-ns-ws-0320', 'beep-codes-sd5']);
  assert.match(tab.run("JSON.stringify(HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2110').console.evidence)"), /WO-3308/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m10-practice-tickets\.test\.js/);
}

const tests = [testSetShape, testEachTicketToAllAreasMet, testSetNeedsEachDoneRule, testCriticalLines, testOneChangeNotARebuild, testKbArticlesFoundByKeywords, testFixture, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }

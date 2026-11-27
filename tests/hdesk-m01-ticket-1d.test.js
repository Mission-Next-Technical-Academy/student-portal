'use strict';
// Help Desk Module 1 fixes from the 2026-11-11 walkthrough, simulator side
// (ui/helpdesk.js, ui/helpdesk-data.js):
//
//   - Ticket 1-D, HD-2154 (Hana Okafor's team printer, KB-0059): the laptop
//     step on Settings › Printers & scanners › Add device in Practice, a chat
//     reply that waits for it, feedback that reads the laptop, the right and
//     wrong owners and the critical errors. No caller check.
//   - The work note rule: a label counts after a colon anywhere, or after a
//     dash, a full stop or a line break at the start of the note, of a line,
//     or after . ; , — so ordinary prose doesn't tick a part.
//   - A typed note or comment survives every redraw; never kept with a
//     password; cleared once added.
//   - "Your note needs" ticks live.
//   - The Module 1 practice set's dashboard has no correlation card.
//
// The simulator runs in a Node vm with a small fake DOM. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const SIM_URL = 'https://academy.test/sim/';
const practiceUrl = (student = 'student-m01d0001') => `${SIM_URL}?practice=its-01&student=${student}#/helpdesk/tickets`;
const ID = 'HD-2154';
const PRINTER = '\\\\NS-PRINT01\\NS-CS-PRN02';

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', listeners: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}

function sim(url, { local = store(), session = store() } = {}) {
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
    opener: null, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text),
    render: () => {},
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => { location.hash = hash; };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const q = JSON.stringify;
  const tab = {
    run, input, toasts, local, byId,
    hd: () => run('hdState'),
    ticket: (id = ID) => run(`hdTicketById(${q(id)})`),
    progress: (id = ID) => JSON.parse(JSON.stringify(run(`hdConsoleProgress(${q(id)})`))),
    feedback: (id = ID) => { run(`hdConsoleCheckWork(${q(id)})`); return JSON.parse(JSON.stringify(run(`hdConsoleFeedback(hdTicketById(${q(id)}))`))); },
    open: (id = ID) => { run(`hdState.selectedTicketId = ${q(id)}`); return tab.view('helpdesk/ticket'); },
    view: (route) => run(`VIEWS[${q(route)}]()`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${q(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${q(id)})`); },
    draft: (id, kind, text) => run(`hdKeepDraft(${q(id)}, ${q(kind)}, ${q(text)})`),
    ask: (id, question) => run(`hdChatAsk(${q(id)}, ${q(question)})`),
    verify: (id, option) => run(`hdVerify(${q(id)}, ${q(option)})`),
    act: (id, action) => run(`hdConsoleAction(${q(id)}, ${q(action)})`),
    own: (id, option) => run(`hdConsoleOwner(${q(id)}, ${q(option)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${q(id)})`); if (article) run(`hdKbOpen(${q(id)}, ${q(article)})`); },
    diagnose: (id, value) => { input('hd-diagnosis', value); run(`hdSubmitDiagnosis(${q(id)})`); },
    addPrinter: () => run(`hdSelectComputer('NS-LT-0188'); hdSettingsScan(); hdSettingsAddPrinter('NS-LT-0188', ${q(PRINTER)})`),
  };
  return tab;
}
const ok = (fb) => Object.fromEntries(fb.areas.map((row) => [row.area, row.ok]));
const HANA_NOTE = 'Reported: user moved desks; team printer missing from her printer list; needs to print a refund form this morning.\nTried: per KB-0059, on NS-LT-0188 added NS-CS-PRN02 from Settings › Printers & scanners › Add device.\nResult: user printed a test page and confirmed.';
const HANA_COMMENT = 'Hi Hana, the Customer Service printer is now on your laptop, and your test page printed. If it ever disappears from your list, reply here and we\'ll add it again. – Riley';

/* --------------------------------------------------------------- fixtures */

function testFixtures() {
  const tab = sim(practiceUrl());
  const ticket = tab.ticket();
  assert.equal(ticket.number, undefined, 'no incident number: shown as HD-2154, like HD-2151 to SEC-2153');
  assert.match(tab.view('helpdesk/tickets'), /<strong>HD-2154<\/strong>/);
  assert.deepEqual([ticket.requester, ticket.department, ticket.category, ticket.subcategory, ticket.priority, ticket.contactType, ticket.ci], ['Hana Okafor', 'Customer Service', 'Hardware', 'Printer', 'P4', 'Chat', 'NS-LT-0188']);
  const hana = tab.run("hdUserById('u-1017')");
  assert.deepEqual([hana.name, hana.employeeId, hana.phone, hana.department], ['Hana Okafor', 'E-46415', 'ext. 4687', 'Customer Service']);
  assert.ok(hana.groups.includes('GG-CustomerService-Users'));
  assert.ok(tab.run("HD_COMPUTERS.some((c) => c.name === 'NS-LT-0188' && c.user === 'Hana Okafor')"));
  assert.ok(tab.run("HD_PRINTERS.some((p) => p.name === 'NS-CS-PRN02' && p.server === 'NS-PRINT01' && p.group === 'GG-CustomerService-Users')"));
  const kb = tab.run("HD_KB_ARTICLES.find((a) => a.id === 'KB-0059')");
  assert.equal(kb.title, 'Add a department printer to a user\'s laptop');
  assert.equal(kb.audience, 'Service Desk');
  ['No admin rights are needed', 'Settings › Printers & scanners and select Add device', 'NS-CS-PRN02', 'print a test page', 'escalate to Desktop Support (Tier 2)', 'Never ask for the user\'s password or sign in as the user'].forEach((text) => assert.ok(kb.summary.includes(text), text));
  // Nothing from the Prove It: not its printer, its user, its team or admin rights.
  const words = JSON.stringify([tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === '${ID}')`), kb]);
  assert.doesNotMatch(words, /NS-FIN-PRN01|Evan Parker|Finance|admin(istrator)? rights? (for|to) |make (him|her) (a )?local admin/i);
  // No account action and no device handover: no caller check.
  const html = tab.open();
  assert.doesNotMatch(html, /class="card hd-verify"/, 'no Verify caller card');
  assert.match(html, /Pre-set: P4: one person, and she can print from a colleague&#39;s PC in the meantime\.|Pre-set: P4: one person, and she can print from a colleague's PC in the meantime\./);
  assert.match(html, /class="card hd-computer"[\s\S]*Open NS-LT-0188/, 'a button opens her laptop');
}

/* ------------------------------------------------------- the laptop step */

function testWorkedCorrectly() {
  const tab = sim(practiceUrl());
  tab.run(`hdAssignTicket('${ID}')`);
  assert.equal(tab.ticket().status, 'In Progress', 'Assign to me sets In Progress');
  tab.ask(ID, 'which'); tab.ask(ID, 'see'); tab.ask(ID, 'elsewhere');
  assert.match(tab.open(), /Our Customer Service printer\.[\s\S]*It just isn(&#39;|')t in my list\.[\s\S]*Tomás(&#39;|')s PC next to me/);
  // The test page waits for the printer.
  tab.ask(ID, 'test');
  assert.equal(tab.ticket().consoleState.chat.at(-1).whileLocked, true, 'answered before the printer: it waits');
  assert.match(tab.open(), /I can(&#39;|')t yet\. The printer still isn(&#39;|')t in my list\./);
  tab.kb(ID, 'add printer', 'KB-0059');
  tab.diagnose(ID, 'The printer is missing from her laptop: nothing is broken');
  // Windows Desktop shows Settings on her laptop; Add device lists the printer.
  tab.run("hdSelectComputer('NS-LT-0188')");
  assert.match(tab.view('helpdesk/windows'), /navigate\('#\/helpdesk\/settings-printers'\)/);
  tab.run('hdSettingsScan()');
  const settings = tab.view('helpdesk/settings-printers');
  assert.match(settings, /data-hd-settings-found><div><strong>NS-CS-PRN02<\/strong><small class="muted"> Customer Service · 1st floor · \\\\NS-PRINT01\\NS-CS-PRN02<\/small> <div style="margin-top:8px"><button[^>]*>Add device<\/button><\/div>/, 'a gap above Add device');
  assert.match(settings, /onclick="hdSelectTicket\('HD-2154'\)">← HD-2154<\/button>/, 'back to the ticket');
  tab.run(`hdSettingsAddPrinter('NS-LT-0188', ${JSON.stringify(PRINTER)})`);
  assert.deepEqual([...tab.hd().machines['NS-LT-0188'].printers], ['Microsoft Print to PDF', PRINTER]);
  assert.deepEqual([...tab.hd().machines['NS-LT-0188'].localAdministrators], ['NORTHSTAR\\Domain Admins', 'NS-LT-0188\\MNT-Support'], 'no admin rights given');
  assert.deepEqual(tab.progress().actions, ['printer-added'], 'the named action is recorded');
  assert.equal(tab.hd().prove, undefined, 'never a Prove event');
  assert.match(tab.ticket().troubleshootingHistory.at(-1).action, /On NS-LT-0188: added NS-CS-PRN02 from Settings › Printers & scanners › Add device\./);
  // Now the test page prints.
  tab.ask(ID, 'test');
  assert.match(tab.open(), /It printed, thanks!/);
  assert.equal(tab.note(ID, HANA_NOTE), true);
  assert.match(tab.toasts.at(-1), /Note added: Reported, Tried and Result are all there\./);
  assert.equal(tab.comment(ID, HANA_COMMENT), true);
  assert.equal(tab.toasts.at(-1), 'Customer comment added.', 'plain words: no jargon flagged');
  tab.own(ID, 'servicedesk');
  const ticket = tab.ticket();
  assert.deepEqual([ticket.status, ticket.assignedTechnician, ticket.closureCode, ticket.resolution], ['Resolved', 'Riley Morgan', 'Solution provided', HANA_NOTE]);
  const fb = tab.feedback();
  assert.deepEqual(fb.critical, []);
  assert.deepEqual(ok(fb), { 'Right owner': true, Investigation: true, Diagnosis: true, Action: true, Documentation: true });
}

function testFeedbackReadsTheLaptop() {
  const tab = sim(practiceUrl('student-m01d0002'));
  tab.kb(ID, 'add printer', 'KB-0059');
  let fb = tab.feedback();
  assert.equal(ok(fb).Action, false, 'not added yet');
  assert.match(fb.areas.find((row) => row.area === 'Action').text, /open Settings › Printers & scanners, select Add device and add NS-CS-PRN02/);
  // The action alone isn't the printer: the rule reads the laptop.
  tab.run("hdConsoleState(hdTicketById('HD-2154')).actions.push({ id:'printer-added', time:'now' })");
  tab.ask(ID, 'test');
  assert.equal(ok(tab.feedback()).Action, false, 'the printer still isn\'t on NS-LT-0188');
  tab.run("hdState.machines['NS-LT-0188'].printers.push('\\\\\\\\NS-PRINT01\\\\NS-CS-PRN02')");
  assert.equal(ok(tab.feedback()).Action, true);
  // The jargon list catches internal names in the reply.
  tab.comment(ID, 'Hi Hana, I added NS-CS-PRN02 to NS-LT-0188 with Add device per KB-0059.');
  assert.match(tab.toasts.at(-1), /The customer won't know these words: KB-0059, NS-CS-PRN02, NS-LT-0188, Add device/);
}

function testOwnersAndCriticalErrors() {
  const tab = sim(practiceUrl('student-m01d0003'));
  tab.own(ID, 'desktop');
  assert.match(tab.open(), /Not the right owner: KB-0059 gives Tier 1 the fix\. Escalate to Desktop Support only if the printer isn(&#39;|')t in the Add device list\./);
  tab.own(ID, 'soc');
  assert.match(tab.open(), /Not the right owner: nothing here is suspicious\./);
  tab.act(ID, 'sign-in-as');
  assert.match(tab.toasts.at(-1), /^Critical error\. Never sign in as a user\./);
  tab.act(ID, 'ask-password');
  tab.ask(ID, 'password');
  assert.match(tab.toasts.at(-1), /never asks for a password/);
  const fb = tab.feedback();
  assert.deepEqual(fb.critical, ['Sign in to NS-LT-0188 as Hana to add the printer', 'Ask Hana for her password so you can add the printer for her']);
  assert.match(JSON.stringify(fb.flags), /Asked for a password in the chat/);
  assert.equal(ok(fb)['Right owner'], false);
}

/* -------------------------------------------------------- the note rule */

function testNoteRule() {
  const tab = sim(practiceUrl('student-m01d0004'));
  const missing = (text, parts) => [...tab.run(`hdNoteMissingParts(${JSON.stringify(text)}${parts ? `, ${JSON.stringify(parts)}` : ''})`)];
  // Each separator, at the start of a line.
  assert.deepEqual(missing('Reported: locked out after typing it wrong.\nTried: unlocked it per the article.\nResult: signed in on the call.'), [], 'colon');
  assert.deepEqual(missing('Reported - locked out after typing it wrong.\nTried - unlocked it per the article.\nResult - signed in on the call.'), [], 'dash');
  assert.deepEqual(missing('Reported. locked out after typing it wrong.\nTried. unlocked it per the article.\nResult. signed in on the call.'), [], 'full stop');
  assert.deepEqual(missing('Reported\nlocked out after typing it wrong.\nTried\nunlocked it per the article.\nResult\nsigned in on the call.'), [], 'line break');
  assert.deepEqual(missing('Reported – locked out after typing it wrong.\nTried — unlocked it per the article.\nResult - signed in on the call.'), [], 'en and em dashes');
  // Any case.
  assert.deepEqual(missing('REPORTED - locked out after typing it wrong.\ntried: unlocked it per the article.\nresult. signed in on the call.'), [], 'any case');
  // One line: after . ; , a dash label counts (spec staging item 3).
  assert.deepEqual(missing('Reported - locked out this morning. Tried - unlocked it per the article; Result - signed in on the call.'), [], 'one line');
  assert.deepEqual(missing('Reported - locked out this morning, Tried - unlocked it per the article, Result - signed in fine.'), [], 'after commas');
  // A colon still counts anywhere, as before.
  assert.deepEqual(missing('Call notes Reported: locked out this morning and Tried: unlocked it per KB and Result: signed in fine.'), []);
  // Ordinary prose never ticks a part.
  assert.deepEqual(missing('Reported: Sam says the user tried. She restarted the laptop twice.'), ['Tried', 'Result'], '"the user tried. She restarted" is not a Tried part');
  assert.deepEqual(missing('Reported: the screen shows a result - nothing happens when she clicks it.'), ['Tried', 'Result'], 'a dash after a word mid-sentence');
  // At least 8 characters after a label.
  assert.deepEqual(missing('Reported - locked out this morning.\nTried - x.\nResult - signed in on the call.'), ['Tried']);
  // Next action, with the dash.
  assert.deepEqual(missing('Reported - laptop dropped today.\nTried - offered a loaner per the article.\nResult - escalated to the desktop team.\nNext action - Desktop Support repairs it.', ['reported', 'tried', 'result', 'next']), []);
  // A label inside another part still splits only where the rule allows.
  assert.deepEqual(missing('Reported: locked out again. Tried: x. Done: unlocked it', ['reported', 'tried', 'result']), ['Result']);
}

/* ---------------------------------------- drafts and "Your note needs" */

function testDraftsSurviveEveryRedraw() {
  const tab = sim(practiceUrl('student-m01d0005'));
  const textarea = (html, id) => (new RegExp(`<textarea id="${id}"[^>]*>([^<]*)</textarea>`).exec(html) || [])[1];
  // Both boxes keep a draft as the student types.
  const first = tab.open('HD-2151');
  assert.match(first, /<textarea id="hd-note-input"[^>]*oninput="hdKeepDraft\('HD-2151','note',this\.value\)"/);
  assert.match(first, /<textarea id="hd-comment-input"[^>]*oninput="hdKeepDraft\('HD-2151','comment',this\.value\)"/);
  assert.equal(typeof tab.run('window.hdKeepDraft'), 'function', 'reachable from the inline handler');
  const redraws = [
    ['a chat question', () => tab.ask('HD-2151', 'what')],
    ['a KB search', () => tab.kb('HD-2151', 'forgot password')],
    ['Verify caller', () => tab.verify('HD-2151', 'callback')],
    ['Check diagnosis', () => tab.diagnose('HD-2151', 'Forgotten password: nothing is broken')],
    ['an owner choice', () => tab.own('HD-2151', 'desktop')],
    ['Check my work', () => tab.run("hdConsoleCheckWork('HD-2151')")],
  ];
  for (const [name, redraw] of redraws) {
    tab.draft('HD-2151', 'note', `Reported - draft before ${name}`);
    tab.draft('HD-2151', 'comment', `Hi Leah, draft before ${name}`);
    redraw();
    const html = tab.open('HD-2151');
    assert.equal(textarea(html, 'hd-note-input'), `Reported - draft before ${name}`, `note kept after ${name}`);
    assert.equal(textarea(html, 'hd-comment-input'), `Hi Leah, draft before ${name}`, `comment kept after ${name}`);
  }
  // The resolution code redraw, on HD-2150 (the guided lab ticket).
  const lab = sim(`${SIM_URL}#/helpdesk/tickets`);
  lab.draft('HD-2150', 'note', 'Reported: Sam locked out this morning.');
  lab.run("hdSetResolutionCode('HD-2150', 'Solution provided')");
  assert.equal(textarea(lab.open('HD-2150'), 'hd-note-input'), 'Reported: Sam locked out this morning.', 'kept after a resolution code');
  // Kept per ticket, and across a reload of the shift.
  assert.equal(textarea(tab.open('HD-2152'), 'hd-note-input'), '', 'another ticket\'s box is its own');
  const reloaded = sim(practiceUrl('student-m01d0005'), { local: tab.local });
  assert.match(textarea(reloaded.open('HD-2151'), 'hd-note-input'), /^Reported - draft before/);
  // Never kept with a password in it.
  tab.draft('HD-2151', 'note', 'Reported - user said her password is Winter2026x');
  assert.equal(textarea(tab.open('HD-2151'), 'hd-note-input'), '', 'dropped, not kept');
  assert.ok(!/Winter2026x/.test(tab.local.getItem('defender-lab.helpdesk.practice.v1.its-01.student-m01d0005')), 'never saved');
  tab.draft('HD-2151', 'comment', 'Hi Leah, your new password is Spring2026y');
  assert.ok(!/Spring2026y/.test(JSON.stringify(tab.hd())));
  // Cleared once added.
  tab.draft('HD-2151', 'note', 'Reported - forgot her password after leave.');
  assert.equal(tab.note('HD-2151', 'Reported - forgot her password after leave.'), true);
  assert.equal(textarea(tab.open('HD-2151'), 'hd-note-input'), '');
  tab.draft('HD-2151', 'comment', 'Hi Leah, welcome back!');
  assert.equal(tab.comment('HD-2151', 'Hi Leah, welcome back!'), true);
  assert.equal(textarea(tab.open('HD-2151'), 'hd-comment-input'), '');
  assert.equal(tab.ticket('HD-2151').drafts, undefined);
}

function testNoteNeedsTicksLive() {
  const tab = sim(practiceUrl('student-m01d0006'));
  let html = tab.open('HD-2152');
  assert.match(html, /<strong style="font-size:12px">Your note needs<\/strong><ul class="hd-list hd-outcomes" id="hd-note-needs" aria-live="polite"><li data-done="no">○ Reported<\/li><li data-done="no">○ Tried<\/li><li data-done="no">○ Result<\/li><li data-done="no">○ Next action \(when it goes to another team\)<\/li><\/ul>/);
  // Typing updates the list in place, without a redraw.
  tab.input('hd-note-needs', '');
  tab.draft('HD-2152', 'note', 'Reported - laptop dropped this morning.\nTried - asked the four questions');
  const live = tab.byId.get('hd-note-needs').innerHTML;
  assert.equal(live, '<li data-done="yes">✓ Reported</li><li data-done="yes">✓ Tried</li><li data-done="no">○ Result</li><li data-done="no">○ Next action (when it goes to another team)</li>');
  // Next action becomes required once the ticket goes to another team.
  tab.run("hdTicketById('HD-2152').status = 'Escalated'");
  html = tab.open('HD-2152');
  assert.match(html, /○ Next action<\/li>/);
  // No list on a ticket that doesn't check its notes. (HD-2106 stands in for
  // HD-2104, which left the shared queue with Module 9: ownSet.)
  const plainTicket = sim(`${SIM_URL}#/helpdesk/tickets`).open('HD-2106');
  assert.match(plainTicket, /HD-2106/, 'the older ticket is on the shared queue');
  assert.doesNotMatch(plainTicket, /Your note needs/);
  // The Work notes subtitle on a Module 1 ticket.
  assert.match(tab.open('HD-2151'), /<strong>Work notes<\/strong><span class="muted">Reported \/ Tried \/ Result \(\+ Next action if it stays open or goes to another team\)<\/span>/);
}

/* -------------------------------------------------------------- dashboard */

function testDashboardWithoutCorrelatedTickets() {
  const set = sim(practiceUrl('student-m01d0007')).view('helpdesk/dashboard');
  assert.doesNotMatch(set, /Correlation opportunity|Correlated reports|Purchasing sign-in failures/, 'the Module 1 set has no correlated tickets');
  assert.match(set, /Open tickets[\s\S]*Priority 1[\s\S]*SLA risk/);
  const shift = sim(`${SIM_URL}#/helpdesk/dashboard`).view('helpdesk/dashboard');
  assert.match(shift, /Correlated reports/, 'a shift with correlated tickets is unchanged');
  assert.match(shift, /Correlation opportunity[\s\S]*Purchasing sign-in failures/);
}

const tests = [testFixtures, testWorkedCorrectly, testFeedbackReadsTheLaptop, testOwnersAndCriticalErrors, testNoteRule, testDraftsSurviveEveryRedraw, testNoteNeedsTicksLive, testDashboardWithoutCorrelatedTickets];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m01-ticket-1d: all ${tests.length} passed`);

'use strict';
// Help Desk Module 8 (key its-06) Practice It, Lab 8.2 · Practice tickets
// (not graded): the practice set 'its-06' (ui/helpdesk-data.js), opened with
// ?practice=its-06. Four tickets, each on its own clock (console.now):
//
//   - 8-A HD-2198 (INC0010509): Alana Kealoha, back from leave. Disabled for
//     the leave (HR-8894) and an expired password, not registered for SSPR.
//   - 8-B HD-2199 (INC0010510): "Reset my MFA" from a personal address. Her
//     phone's update turned Authenticator notifications off; no reset.
//   - 8-C HD-2200 (INC0010511): Nina Patel moved from Sales to Finance
//     (HR-8893), and her licence group went with the Sales clean-up.
//   - 8-D HD-2201 (INC0010512): Omar Haddad's company phone is not compliant
//     (OS below minimum), so Conditional Access blocks work mail.
//
// Each ticket is worked end to end with the spec's model notes and comments
// (section 8.4), and "Check my work" passes every area with no critical
// entry. Every "Critical (feedback only)" line shows when the student does it.
// The set reports completion once, after all four, with the ticket ids only.
// Feedback only, never points.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['helpdesk-data.js', 'helpdesk.js'].map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const IDS = ['HD-2198', 'HD-2199', 'HD-2200', 'HD-2201'];
const M8_TICKETS = ['HD-2196', 'HD-2197', 'SR-2207', ...IDS];
const M8_PEOPLE = ['u-1035', 'u-1036', 'u-1037', 'u-1038', 'u-1039'];
const M8_LAPTOPS = ['NS-LT-0413', 'NS-LT-0414'];
const plain = (value) => JSON.parse(JSON.stringify(value));

const store = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ opener = null, url = 'https://academy.test/sim/?practice=its-06&student=student-m08p0001#/helpdesk/tickets' } = {}) {
  const u = new URL(url);
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
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}] ? VIEWS[${j(route)}]() : ''`),
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    choose: (id, option) => run(`hdChoose(${j(id)}, ${j(option)})`),
    verify: (id, option) => run(`hdVerify(${j(id)}, ${j(option)})`),
    evidence: (id, card) => run(`hdEvidenceOpen(${j(id)}, ${j(card)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    attach: (id, article) => run(`hdKbAttach(${j(id)}, ${j(article)})`),
    search: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, notes, code = 'Solution provided') => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, ${j(code)})`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    select: (name) => run(`hdSelectComputer(${j(name)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    ad: (adTab) => { run(`hdState.adTab = ${j(adTab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    pane: () => { const html = tab.ad('users'); const at = html.indexOf('<aside class="card hd-object-pane"'); return at < 0 ? html.slice(-3000) : html.slice(at); },
    effective: (share, user) => { run(`hdServerOpen('NS-FILE01', '#/helpdesk/file-server'); hdFileSet({ share:${j(share)}, tab:'effective' }); hdFileSet({ user:${j(user)} })`); return run("VIEWS['helpdesk/file-server']()"); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
    area: (id, name) => tab.feedback(id).areas.find((a) => a.area === name),
    checkWork: (id) => run(`hdConsoleCheckWork(${j(id)})`),
    closed: () => run('hdPracticeClosed()'),
  };
  return tab;
}
const allOk = (feedback, id) => feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
const clean = (tab, id) => { const f = tab.feedback(id); allOk(f, id); assert.deepEqual(f.critical, [], `${id} no critical entry`); assert.deepEqual(f.flags, [], `${id} no flag`); };
const shown = (html) => html.replace(/<[^>]*>/g, ' ');
const getAdUser = (user) => `Get-ADUser ${user} -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet`;

// The spec's model notes and customer texts (8.4), with their labels.
const A_NOTE = 'Reported: "account has been disabled" on first day back from six weeks\' leave; HR said she\'s cleared to return.\nTried: verified per KB-0024 (directory callback + employee ID); account disabled, not locked, never expires, password expired (set 92 days ago); history and HR-8894 show leave of absence with return to work today approved by HR; enabled the account; old password unknown and not registered for SSPR, so reset per KB-0104 with must-change ticked, one-time password given verbally on the verified call.\nResult: Alana signed in on NS-LT-0414, set her own password and registered for SSPR.';
const A_COMMENT = 'Hi Alana, welcome back! Your account was paused while you were on leave, and HR\'s return-to-work record let us turn it back on. You\'ve set a new password, and you\'re now set up to reset it yourself next time from the link on the sign-in screen. – Riley';
const B_NOTE = 'Reported: MFA reset requested by email from a personal address (pnair.home@mail.example); approvals stopped arriving since yesterday.\nTried: did not act on the email; verified per KB-0065 (directory mobile callback, employee ID, manager confirmation in Teams); sign-in log shows prompts sent and not answered, usual location only; Authenticator registered on her same phone; a phone update yesterday had turned off Authenticator notifications; guided her to turn them back on.\nResult: test sign-in approved; no MFA reset needed; replied to work address only.';
const B_COMMENT = 'Hi Priya, you\'re all set: your phone\'s update had turned off notifications for the Authenticator app, so the approvals were arriving but you never saw them. They\'re back on and your test sign-in worked, so nothing needed resetting. For your security, please send account requests from the portal or your work email, not a personal address. – Riley';
const C_NOTE = 'Reported: moved Sales → Finance Monday; can\'t open Finance folder; Teams says no licence; still has Sales folder.\nTried: groups showed GG-Sales-Users and DL-Sales-Team; no GG-Finance-Users, DL-Finance-Team or GG-M365-E3-License; history shows the licence group removed yesterday with GG-CRM-Users (group-based licensing removed her E3); per HR-8893 and KB-0106 added GG-Finance-Users and DL-Finance-Team, re-added GG-M365-E3-License, removed GG-Sales-Users and DL-Sales-Team.\nResult: after sign-out/in, whoami /groups shows the Finance groups; Finance share opens, Sales denied; Teams licensed and working. Note for the team: GG-M365-E3-License is the licence, not a department group.';
const C_COMMENT = 'Hi Nina, welcome to Finance! You can open the Finance folder now and Teams is working again. When your old Sales access was being removed, your Microsoft licence was removed by mistake as well; sorry about that. As part of your move we\'ve also removed your Sales folder and the Sales email list. If anything else for your new role is missing, just reply here. – Riley';
const D_NOTE = 'Reported: work mail and Teams stopped on company phone this morning; laptop fine.\nTried: verified per KB-0024; Service health clear; Intune shows NS-PH-0003 not compliant (OS below minimum; grace period ended yesterday); sign-in log shows phone sign-ins blocked by Conditional Access as non-compliant; guided Omar to install the update and Check status in Company Portal per KB-0105.\nResult: NS-PH-0003 Compliant; mail and Teams working on the phone.';
const D_COMMENT = 'Hi Omar, your phone is getting work email again. It had fallen behind on a required update, so it was blocked from company mail until the update was in. Now that it\'s updated, everything\'s back. Updates like this keep company data safe on your phone, so it\'s worth installing them when they pop up. – Riley';

/* ------------------------------------------------------------ the set */
function testSetOpensOnItsOwnClocks() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET.key'), 'its-06');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), IDS);
  const now = (id) => tab.run(`hdShiftNow(hdTicketById('${id}')).toISOString()`);
  assert.equal(now('HD-2198'), '2026-08-19T13:10:00.000Z');
  assert.equal(now('HD-2199'), '2026-08-19T09:30:00.000Z');
  assert.equal(now('HD-2200'), '2026-08-19T10:15:00.000Z');
  assert.equal(now('HD-2201'), '2026-08-19T09:05:00.000Z');
  const numbers = { 'HD-2198': 'INC0010509', 'HD-2199': 'INC0010510', 'HD-2200': 'INC0010511', 'HD-2201': 'INC0010512' };
  IDS.forEach((id) => { assert.equal(tab.ticket(id).priority, '', `${id} opens with no priority`); assert.equal(tab.ticket(id).number, numbers[id]); });
  // Module 8's people and laptops are in this set.
  M8_PEOPLE.forEach((id) => assert.ok(tab.run(`hdFileUser('${id}')`), `${id} in the set`));
  const computers = plain(tab.run('hdComputers().map((c) => c.name)'));
  M8_LAPTOPS.forEach((name) => assert.ok(computers.includes(name), `${name} in the set`));
  tab.open('HD-2198');
  assert.match(tab.view('helpdesk/directory'), /Alana Kealoha/);
}

// Module 8's people and laptops are in no older shift.
function testPeopleOnlyInThisSet() {
  assert.equal(sim().run(`HD_USERS.some((u) => ${JSON.stringify(M8_PEOPLE)}.includes(u.id))`), false, 'not in HD_USERS');
  assert.equal(sim().run(`HD_COMPUTERS.some((c) => ${JSON.stringify(M8_LAPTOPS)}.includes(c.name))`), false, 'not in HD_COMPUTERS');
  const shifts = [
    ['shared', () => sim({ url: 'https://academy.test/sim/#/helpdesk/tickets' })],
    ['practice its-05', () => sim({ url: 'https://academy.test/sim/?practice=its-05&student=stu-1#/helpdesk/tickets' })],
    ['coached its-05-guided', () => { const t = sim({ url: 'https://academy.test/sim/#/helpdesk/tickets' }); assert.equal(t.run("hdUseTicketSet('its-05-guided')"), true); return t; }],
    ['prove its-05', () => sim({ url: 'https://academy.test/sim/?prove=its-05&student=stu-1#/helpdesk/tickets' })],
  ];
  for (const [name, make] of shifts) {
    const tab = make();
    M8_PEOPLE.forEach((id) => {
      assert.ok(!tab.run(`hdUserById('${id}')`), `${name}: ${id} absent`);
      assert.ok(!tab.run(`hdFileUser('${id}')`), `${name}: ${id} absent from the directory`);
    });
    const computers = plain(tab.run('hdComputers().map((c) => c.name)'));
    M8_LAPTOPS.forEach((laptop) => assert.ok(!computers.includes(laptop), `${name}: ${laptop} absent`));
    assert.doesNotMatch(tab.view('helpdesk/directory'), /Alana Kealoha|Celia Morales|Kofi Mensah/, `${name}: directory`);
  }
}

// The Sales share is in this set only; Module 07's sets and Prove shift have none.
function testSalesShareOnlyHere() {
  const tab = sim();
  const shares = (servers) => Object.values(servers || {}).flatMap((s) => (s.shares || []).map((share) => share.name));
  assert.ok(shares(plain(tab.run("HD_PRACTICE_SETS['its-06'].servers"))).includes('Sales'));
  assert.ok(shares(plain(tab.run("HD_COACHED_SETS['its-06-guided'].servers"))).includes('Sales'));
  for (const code of ["HD_PRACTICE_SETS['its-05'].servers", "HD_COACHED_SETS['its-05-guided'].servers"]) {
    assert.ok(!shares(plain(tab.run(code))).includes('Sales'), `${code}: no Sales share`);
  }
  // Module 7's Prove shift has its own Sales share (its Prove It case, on
  // master before Module 8): GG-Sales-Managers on the share, and none of
  // Module 8's changes (no GG-Finance-Users Modify on Finance).
  const prove = plain(tab.run("HD_PROVE_SHIFTS['its-05'].servers['NS-FILE01'].shares"));
  assert.deepEqual(prove.find((s) => s.name === 'Sales').share.map((e) => e.who), ['GG-Sales-Managers', 'Administrators'], 'the Prove shift keeps its own Sales share');
  assert.ok(!prove.find((s) => s.name === 'Finance').ntfs.some((e) => e.who === 'GG-Finance-Users' && e.access === 'Modify'), 'no Module 8 Finance entry in the Prove shift');
  const m8 = plain(tab.run("HD_PRACTICE_SETS['its-06'].servers['NS-FILE01'].shares"));
  assert.deepEqual(m8.find((s) => s.name === 'Sales'), { name: 'Sales', path: '\\\\NS-FILE01\\Sales', status: 'Healthy', share: [{ who: 'GG-Sales-Users', access: 'Change' }], ntfs: [{ who: 'GG-Sales-Users', access: 'Modify' }] });
  for (const code of ["HD_PRACTICE_SETS['its-05']", "HD_COACHED_SETS['its-05-guided']", "HD_PROVE_SHIFTS['its-05']"]) {
    const text = JSON.stringify(plain(tab.run(code)));
    M8_PEOPLE.forEach((id) => assert.ok(!text.includes(id), `${code}: no ${id}`));
    assert.doesNotMatch(text, /NS-LT-041[34]|Alana Kealoha|Celia Morales|HR-889[34]/, `${code}: no Module 8 laptop, person or record`);
  }
  // Nina's effective access: Finance denied and Sales allowed before her move.
  tab.open('HD-2200');
  assert.doesNotMatch(tab.effective('Finance', 'u-1019'), /data-hd-effective-access="(Modify|Read|Change|Full Control)"/);
  assert.match(tab.effective('Sales', 'u-1019'), /data-hd-effective-access="(Modify|Change)"/);
}

/* ------------------------------------------------------------ KB articles */
function testKnowledgeArticles() {
  const tab = sim();
  const finds = {
    'KB-0065': ['mfa', 'authenticator', 'new phone', 'reset mfa', 'approve sign-in'],
    'KB-0103': ['locked again', 'keeps locking', 'lockout', 'lockout source', '4740'],
    'KB-0104': ['password reset', 'forgot password', 'password expired', 'sspr', 'must change'],
    'KB-0105': ['phone mail', 'email on phone', 'not compliant', 'intune', 'company portal', 'mobile'],
    'KB-0106': ['moved', 'transfer', 'new department', 'no license', 'license', 'group'],
    'KB-0107': ['shared mailbox', 'support@', 'send as', 'full access', 'distribution list', 'dl'],
  };
  const ticketFor = { 'KB-0065': 'HD-2199', 'KB-0103': 'HD-2198', 'KB-0104': 'HD-2198', 'KB-0105': 'HD-2201', 'KB-0106': 'HD-2200', 'KB-0107': 'HD-2200' };
  for (const [article, queries] of Object.entries(finds)) {
    for (const query of queries) assert.ok(tab.search(query).includes(article), `"${query}" finds ${article}`);
    const id = ticketFor[article];
    tab.open(id); tab.kb(id, queries[0], article); tab.attach(id, article);
    assert.equal(tab.run(`hdConsoleRule(hdTicketById('${id}'), { attached:'${article}' })`), true, `${article} attaches on ${id}`);
  }
  // Practice-only, never in the shared list.
  assert.equal(tab.run("HD_KB_ARTICLES.some((a) => /^KB-0(065|10[3-7])$/.test(a.id))"), false);
  assert.equal(tab.run('HD_ITS06_KB_ARTICLES.every((a) => a.practiceOnly === true && a.audience === \'Service Desk\')'), true);
  assert.equal(tab.run("HD_KB_ARTICLES.filter((a) => a.id === 'KB-0024').length"), 1, 'KB-0024 is not repeated');
  assert.ok(tab.search('verify identity').includes('KB-0024') || tab.search('locked out').includes('KB-0024'), 'KB-0024 is found in the set');
}

// KB-0024 is byte-for-byte what it was on the branch this part started from.
// KB-0024 pinned as master had it at 9c6d7e4 (2026-11-26): its source line
// and its object, by sha256. A pin, not a git lookup, so the test needs no
// other branch (CI checkouts and a merged, deleted branch have none).
const KB0024_LINE = '1abbc94dffc971ad96041f009c88ffcc239b8573baef96ff1231a1b35e3d06a7';
const KB0024_OBJECT = 'be5d53182fa3466e1494ff80208eb5d2e4dfc273a45326162f32fbd669313753';
function testKb0024Unchanged() {
  const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
  const now = SOURCES[0][1];
  const found = now.split('\n').filter((l) => l.includes("id:'KB-0024'"));
  assert.equal(found.length, 1, 'one KB-0024 line');
  assert.equal(sha(found[0]), KB0024_LINE, 'the source line is the same');
  const ctx = { console }; vm.createContext(ctx);
  vm.runInContext(`${now}\n;this.__kb = JSON.stringify(HD_KB_ARTICLES.find((a) => a.id === 'KB-0024'));`, ctx);
  assert.equal(sha(ctx.__kb), KB0024_OBJECT, 'the object is the same');
}

/* ------------------------------------------------------------ 8-A */
function work8A(tab) {
  const id = 'HD-2198';
  tab.open(id);
  tab.triage(id, 'Access', 'Account – disabled', 'akealoha', '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.choose(id, 'verify-then-record');
  tab.verify(id, 'callback');
  const out = tab.ps(getAdUser('akealoha'));
  assert.match(out, /Enabled\s+: False/);
  assert.match(out, /LockedOut\s+: False/);
  assert.match(out, /AccountExpirationDate\s+: \(not set: never expires\)/);
  assert.match(out, /PasswordExpired\s+: True/);
  assert.match(out, /PasswordLastSet\s+: 92 days ago/);
  tab.run("hdOpenUser('u-1038')");
  assert.match(tab.pane(), /data-hd-account-history>History: Disabled — leave of absence \(HR-8894\)/);
  tab.evidence(id, 'HR-8894');
  assert.match(tab.open(id), /Return to work[\s\S]*Today/);
  tab.run("hdAcctEnable('u-1038')");
  assert.equal(tab.run("hdFileUser('u-1038').enabled"), true);
  tab.ask(id, 'try');
  assert.match(tab.open(id), /password has expired and must be changed/);
  tab.run("hdEntraOpenUser('u-1038')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-sspr>Not registered</);
  tab.kb(id, 'password reset', 'KB-0104'); tab.attach(id, 'KB-0104');
  const reset = plain(tab.run("hdAcctReset('u-1038', true)"));
  assert.equal(reset.ok, true);
  tab.ask(id, 'onetime');
  tab.run('hdAcctOtpDone()');
  tab.run("hdEntraSsprRegister('u-1038')");
  tab.ask(id, 'sspr');
  tab.note(id, A_NOTE);
  tab.comment(id, A_COMMENT);
  tab.resolve(id, 'Enabled per HR-8894; reset per KB-0104; she set her own password and registered for SSPR.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  clean(tab, id);
  return reset.value;
}
function test8A() {
  const tab = sim();
  const otp = work8A(tab);
  assert.ok(!tab.ticket('HD-2198').notes.some((n) => n.text.includes(otp)), 'the password is in no note');
  // Enabling before HR-8894 is critical.
  const early = sim(); early.open('HD-2198'); early.verify('HD-2198', 'callback');
  early.run("hdAcctEnable('u-1038')");
  assert.equal(early.run("hdFileUser('u-1038').enabled"), false);
  assert.ok(early.feedback('HD-2198').critical.some((t) => /before you opened HR-8894/.test(t)), 'enable without the HR record');
  // Resetting before verifying is critical.
  const unverified = sim(); unverified.open('HD-2198');
  unverified.run("hdAcctReset('u-1038', true)");
  assert.ok(unverified.feedback('HD-2198').critical.some((t) => /before you verified her/.test(t)), 'reset before verifying');
  // Verified, HR-8894 open, but Reset pressed before Enable: refused (the
  // account is disabled), and never called "before verifying".
  const order = sim(); order.open('HD-2198'); order.verify('HD-2198', 'callback'); order.evidence('HD-2198', 'HR-8894');
  order.run("hdAcctReset('u-1038', true)");
  order.run("hdAcctOpenDialog('u-1038', 'reset')");
  assert.deepEqual(order.feedback('HD-2198').critical, [], 'a verified reset refused for being disabled is not critical');
  // Enable before verifying is refused, and is not called "before HR-8894".
  const noVerify = sim(); noVerify.open('HD-2198'); noVerify.evidence('HD-2198', 'HR-8894');
  noVerify.run("hdAcctEnable('u-1038')");
  assert.ok(!noVerify.feedback('HD-2198').critical.some((t) => /before you opened HR-8894/.test(t)));
  // A note holding the one-time password is refused and flagged.
  const leak = sim(); leak.open('HD-2198'); leak.verify('HD-2198', 'callback'); leak.evidence('HD-2198', 'HR-8894');
  leak.run("hdAcctEnable('u-1038')");
  const value = leak.run("hdAcctReset('u-1038', true).value");
  assert.equal(leak.note('HD-2198', `Reported: back from leave.\nTried: reset; temp ${value}.\nResult: signed in.`), false, 'the note is refused');
  assert.ok(!leak.ticket('HD-2198').notes.some((n) => n.text.includes(value)));
  assert.ok(leak.feedback('HD-2198').flags.some((t) => /Wrote a password/.test(t)), 'flagged');
  // Each critical choice option is a critical line.
  const choices = sim(); choices.open('HD-2198');
  ['enable-on-word', 'reset-first'].forEach((option) => choices.choose('HD-2198', option));
  assert.equal(choices.feedback('HD-2198').critical.length, 2);
}

/* ------------------------------------------------------------ 8-B */
function work8B(tab) {
  const id = 'HD-2199';
  tab.open(id);
  assert.match(tab.open(id), /pnair\.home@mail\.example/);
  assert.equal(tab.ticket(id).requester, 'Priya Nair', 'opened under her real account');
  tab.triage(id, 'Access', 'MFA', 'pnair', '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.choose(id, 'verify-first');
  tab.verify(id, 'callback-id-manager');
  tab.run("hdEntraOpenUser('u-1024'); hdEntraTab('signins')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-signin-reason>MFA: user did not respond to mobile app notification/);
  tab.run("hdEntraTab('methods')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-method-device>Priya&#39;s own phone<|data-hd-method-device>Priya's own phone<|data-hd-method-device>Priya&#039;s own phone</);
  tab.ask(id, 'changed');
  tab.run("hdPhoneOpen('pnair-phone', 'notifications')");
  tab.view('helpdesk/phone');
  tab.run("hdPhoneNotify('pnair-phone'); hdPhoneOpen('pnair-phone', 'authenticator'); hdPhoneAuthTest('pnair-phone'); hdPhoneAuthApprove('pnair-phone')");
  tab.ask(id, 'approve');
  assert.match(tab.open(id), /The prompt came up and I approved it/);
  tab.kb(id, 'reset mfa', 'KB-0065'); tab.attach(id, 'KB-0065');
  tab.note(id, B_NOTE);
  tab.comment(id, B_COMMENT);
  tab.resolve(id, 'Notifications turned back on; test sign-in approved; no reset.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  clean(tab, id);
}
function test8B() {
  work8B(sim());
  // A reset on the email alone is refused and critical.
  const early = sim(); early.open('HD-2199');
  early.run("hdEntraOpenUser('u-1024')"); early.view('helpdesk/entra-admin');
  early.run("hdEntraReregister('u-1024')");
  assert.ok(early.feedback('HD-2199').critical.some((t) => /before she was verified strongly/.test(t)), 'reset on the email alone');
  // A reset after strong verification is not critical: "unnecessary change".
  const after = sim(); after.open('HD-2199'); after.verify('HD-2199', 'callback-id-manager');
  after.run("hdEntraOpenUser('u-1024')"); after.view('helpdesk/entra-admin');
  after.run("hdEntraReregister('u-1024')");
  assert.ok(after.run("hdConsoleRule(hdTicketById('HD-2199'), { action:'entra-mfa-reregister' })"), 'the reset was done');
  assert.deepEqual(after.feedback('HD-2199').critical, [], 'not critical');
  const action = after.area('HD-2199', 'Action');
  assert.equal(action.ok, false);
  assert.match(action.text, /Unnecessary change/);
  // Replying to the personal address is critical (the choice and the verification option).
  const reply = sim(); reply.open('HD-2199');
  reply.choose('HD-2199', 'reply-personal');
  assert.ok(reply.feedback('HD-2199').critical.some((t) => /Reply to pnair\.home@mail\.example/.test(t)), 'reply to the personal address');
  const replyVerify = sim(); replyVerify.open('HD-2199');
  replyVerify.verify('HD-2199', 'reply-email');
  assert.equal(replyVerify.feedback('HD-2199').critical.length, 1);
  const resetChoice = sim(); resetChoice.open('HD-2199');
  resetChoice.choose('HD-2199', 'reset-now');
  assert.equal(resetChoice.feedback('HD-2199').critical.length, 1);
}

/* ------------------------------------------------------------ 8-C */
function work8C(tab) {
  const id = 'HD-2200'; const pc = 'NS-LT-0413';
  tab.open(id);
  tab.triage(id, 'Access', 'Group membership / licence', 'npatel', '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.choose(id, 'work-from-hr');
  tab.evidence(id, 'HR-8893');
  assert.match(tab.ps('Get-ADUser npatel -Properties MemberOf, LockedOut'), /GG-Sales-Users/);
  tab.run("hdOpenUser('u-1019')");
  const pane = tab.pane();
  const memberOf = /data-hd-member-of>([\s\S]*?)<\/dd>/.exec(pane)[1];
  assert.match(memberOf, /GG-Sales-Users[\s\S]*DL-Sales-Team|DL-Sales-Team[\s\S]*GG-Sales-Users/);
  assert.doesNotMatch(memberOf, /GG-Finance-Users|DL-Finance-Team|GG-M365-E3-License/);
  assert.match(pane, /removed from GG-CRM-Users and GG-M365-E3-License by jkeller/);
  tab.run("hdM365OpenUser('u-1019')");
  assert.match(tab.view('helpdesk/m365-admin'), /data-hd-no-license[\s\S]*Was assigned via group: GG-M365-E3-License/);
  tab.kb(id, 'moved', 'KB-0106'); tab.attach(id, 'KB-0106');
  tab.effective('Finance', 'u-1019');
  tab.select(pc);
  assert.match(tab.ps('whoami /groups'), /GG-Sales-Users/);
  ['GG-Finance-Users', 'DL-Finance-Team', 'GG-M365-E3-License'].forEach((group) => tab.run(`hdAcctGroup('u-1019', 'add', '${group}')`));
  ['GG-Sales-Users', 'DL-Sales-Team'].forEach((group) => tab.run(`hdAcctGroup('u-1019', 'remove', '${group}')`));
  assert.match(tab.ps('whoami /groups'), /GG-Sales-Users/, 'the old groups until she signs in again');
  tab.run(`hdWinSignInAgain('${pc}')`);
  const after = tab.ps('whoami /groups');
  assert.match(after, /GG-Finance-Users/);
  assert.doesNotMatch(after, /GG-Sales-Users/);
  tab.open(id);
  assert.match(tab.effective('Finance', 'u-1019'), /data-hd-effective-access="Modify"/);
  assert.doesNotMatch(tab.effective('Sales', 'u-1019'), /data-hd-effective-access="(Modify|Read|Change|Full Control)"/);
  tab.run("hdM365OpenUser('u-1019')");
  assert.doesNotMatch(tab.view('helpdesk/m365-admin'), /data-hd-no-license/, 'the licence is back');
  tab.ask(id, 'finance');
  assert.match(tab.open(id), /The Finance folder opens now/);
  tab.note(id, C_NOTE);
  tab.comment(id, C_COMMENT);
  tab.resolve(id, 'Groups changed per HR-8893; licence group re-added; both directions checked.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  clean(tab, id);
}
function test8C() {
  work8C(sim());
  // A group not on HR-8893 is refused and critical.
  const extra = sim(); extra.open('HD-2200'); extra.evidence('HD-2200', 'HR-8893');
  extra.run("hdAcctGroup('u-1019', 'add', 'GG-CRM-Users')");
  assert.ok(!extra.run("hdFileUser('u-1019').groups").includes('GG-CRM-Users'));
  assert.ok(extra.feedback('HD-2200').critical.some((t) => /not on HR-8893/.test(t)), 'a group not on HR-8893');
  // An approved group added before HR-8893 is opened is refused, not critical.
  const early = sim(); early.open('HD-2200');
  early.run("hdAcctGroup('u-1019', 'add', 'GG-Finance-Users')");
  assert.ok(!early.run("hdFileUser('u-1019').groups").includes('GG-Finance-Users'), 'waits for HR-8893');
  assert.deepEqual(early.feedback('HD-2200').critical, [], 'not the "not on HR-8893" line');
  // A direct licence is refused and critical.
  const direct = sim(); direct.open('HD-2200');
  direct.run("hdM365AssignDirect('u-1019')");
  assert.ok(direct.feedback('HD-2200').critical.some((t) => /instead of assigning E3 directly/.test(t)), 'a direct licence');
  // Leaving the Sales access in place: the Action area names it.
  const leave = sim(); leave.open('HD-2200'); leave.choose('HD-2200', 'work-from-hr'); leave.evidence('HD-2200', 'HR-8893');
  ['GG-Finance-Users', 'DL-Finance-Team', 'GG-M365-E3-License'].forEach((group) => leave.run(`hdAcctGroup('u-1019', 'add', '${group}')`));
  const action = leave.area('HD-2200', 'Action');
  assert.equal(action.ok, false);
  assert.match(action.text, /Critical \(feedback only\): remove Nina from GG-Sales-Users and DL-Sales-Team/);
  // whoami /groups is required typed: the sign-in alone doesn't pass it.
  const untyped = sim(); untyped.open('HD-2200');
  untyped.run("hdWinSignInAgain('NS-LT-0413')");
  assert.equal(untyped.run("hdConsoleRule(hdTicketById('HD-2200'), { typed:'^\\\\s*whoami\\\\s+/groups', computer:'NS-LT-0413' })"), false);
  // Each critical choice option is a critical line.
  const choices = sim(); choices.open('HD-2200');
  ['keep-sales', 'assign-license', 'add-extra'].forEach((option) => choices.choose('HD-2200', option));
  assert.equal(choices.feedback('HD-2200').critical.length, 3);
}

/* ------------------------------------------------------------ 8-D */
function work8D(tab) {
  const id = 'HD-2201'; const phone = 'NS-PH-0003';
  tab.open(id);
  tab.triage(id, 'Mobile device', 'Email sync', phone, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.verify(id, 'callback');
  tab.choose(id, 'update-and-check');
  tab.run("hdM365Tab('health')");
  assert.match(tab.view('helpdesk/m365-admin'), /No active advisories/);
  tab.run(`hdIntuneOpen('${phone}')`);
  assert.match(tab.view('helpdesk/intune'), /data-hd-compliance>Not compliant[\s\S]*data-hd-failing>OS version below minimum[\s\S]*data-hd-grace>Yesterday/);
  tab.run("hdEntraOpenUser('u-1018'); hdEntraTab('signins')");
  assert.match(tab.view('helpdesk/entra-admin'), /Conditional Access: device not compliant/);
  tab.kb(id, 'phone mail', 'KB-0105'); tab.attach(id, 'KB-0105');
  tab.run(`hdPhoneOpen('${phone}', 'update'); hdPhoneUpdate('${phone}'); hdPhoneOpen('${phone}', 'company-portal'); hdPhoneCheckStatus('${phone}')`);
  assert.match(tab.view('helpdesk/intune'), /data-hd-os>17.6[\s\S]*data-hd-compliance>Compliant/);
  tab.run(`hdPhoneOpen('${phone}', 'outlook')`);
  assert.match(tab.view('helpdesk/phone'), /data-hd-outlook-inbox/);
  tab.ask(id, 'mail');
  tab.note(id, D_NOTE);
  tab.comment(id, D_COMMENT);
  tab.resolve(id, 'Phone updated; Company Portal shows Compliant; mail and Teams back.');
  assert.equal(tab.ticket(id).status, 'Resolved');
  clean(tab, id);
}
function test8D() {
  work8D(sim());
  for (const option of ['remove-policy', 'delete-device', 'personal-app']) {
    const tab = sim(); tab.open('HD-2201');
    tab.choose('HD-2201', option);
    const critical = tab.feedback('HD-2201').critical;
    assert.equal(critical.length, 1, `${option} is critical`);
    assert.match(critical[0], /^Chose: /);
  }
}

/* ------------------------------------------------------------ wording */
// Module 8's Practice text holds nothing from the graded ticket, and no Module
// 8 ticket turns on the account expiry control. The refused words are kept as
// hashes (as tests/hdesk-m02-guided-lab.test.js keeps its graded words), so
// this public file doesn't print them.
const REFUSED_WORDS = new Set(['4f7ad241ce34a901']);
const REFUSED_PAIRS = new Set(['2e145908d618fac9', '5b113a72ff6d00dd']);
const hash16 = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
function assertNothingRefused(text, label) {
  const words = String(text).toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean);
  words.forEach((word) => assert.ok(!REFUSED_WORDS.has(hash16(word)), `${label}: a refused word`));
  words.slice(1).forEach((word, i) => assert.ok(!REFUSED_PAIRS.has(hash16(`${words[i]} ${word}`)), `${label}: a refused phrase`));
}
function testNothingFromTheGradedTicket() {
  const tab = sim();
  const tickets = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ${JSON.stringify(M8_TICKETS)}.includes(t.id))`));
  assert.equal(tickets.length, M8_TICKETS.length);
  tickets.forEach((t) => {
    assertNothingRefused(JSON.stringify(t), t.id);
    const actions = (t.console && t.console.accountActions) || {};
    Object.entries(actions).forEach(([user, rule]) => assert.ok(!rule || !rule.expiry, `${t.id} ${user}: no expiry`));
  });
  assertNothingRefused(JSON.stringify(plain(tab.run('HD_ITS06_KB_ARTICLES'))), 'KB articles');
  for (const code of ["HD_PRACTICE_SETS['its-06']", "HD_COACHED_SETS['its-06-guided']", "HD_COACHED_SETS['its-06-extension']"]) {
    const set = plain(tab.run(code));
    assertNothingRefused(JSON.stringify(set), code);
    Object.values(set.ticketOverrides || {}).forEach((o) => Object.values((o.console || {}).accountActions || {}).forEach((rule) => assert.ok(!rule || !rule.expiry)));
  }
  // The coaches' text, read from the source block of hd-m06 and hd-m06-ext.
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  const start = coaches.indexOf('/* ---------------------------------------------------------- hd-m06 ---- */');
  const end = coaches.indexOf('/* ------------------------------------------------------ hd-m04..hd-m11');
  assert.ok(start > 0 && end > start, 'the hd-m06 block');
  assertNothingRefused(coaches.slice(start, end), 'coach text');
  // The guard finds a refused phrase (so a hash typo can't make it pass).
  assert.throws(() => assertNothingRefused(['expired', 'account'].reverse().join(' '), 'self-test'));
}

/* ------------------------------------------------------------ completion */
function testCompletionAfterAllFour() {
  const sent = [];
  const opener = { closed: false, postMessage: (data) => sent.push(plain(data)) };
  const tab = sim({ opener });
  work8A(tab); work8B(tab); work8C(tab);
  assert.equal(tab.closed(), false, '8-D is still open');
  tab.run('hdPracticeReport()');
  assert.equal(sent.filter((m) => m.type === 'mnt-practice-complete').length, 0, 'nothing is sent early');
  work8D(tab);
  assert.equal(tab.closed(), true);
  tab.run('hdPracticeReport()');
  tab.run('hdPracticeReport()');
  const done = sent.filter((m) => m.type === 'mnt-practice-complete');
  assert.equal(done.length, 1, 'one completion message');
  assert.equal(done[0].id, 'its-06');
  assert.deepEqual(done[0].tickets, IDS);
  assert.deepEqual(Object.keys(done[0]).sort(), ['id', 'nonce', 'student', 'tickets', 'type'], 'ticket ids only: no score, no answers');
  assert.doesNotMatch(JSON.stringify(done[0]), /score|points|expected|Reported:/i);
}

// No score, points or percentage anywhere the student reads.
function testNoScoreInTheView() {
  const tab = sim();
  work8A(tab); work8B(tab); work8C(tab); work8D(tab);
  const pages = [tab.view('helpdesk/tickets'), tab.view('helpdesk/dashboard')];
  IDS.forEach((id) => { tab.checkWork(id); pages.push(tab.open(id)); });
  pages.forEach((html, i) => {
    const text = shown(html);
    assert.doesNotMatch(text, /\bscores?\b|\bpoints?\b|\d+\s*\/\s*100\b|\d+\s*%|\bpass(ed)? mark\b/i, `page ${i}: ${(text.match(/.{0,60}(\bscores?\b|\bpoints?\b|\d+\s*%).{0,30}/i) || [''])[0]}`);
  });
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m08-practice-tickets\.test\.js/);
}

const tests = [testSetOpensOnItsOwnClocks, testPeopleOnlyInThisSet, testSalesShareOnlyHere, testKnowledgeArticles, testKb0024Unchanged, test8A, test8B, test8C, test8D,
  testNothingFromTheGradedTicket, testCompletionAfterAllFour, testNoScoreInTheView, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m08-practice-tickets: all ${tests.length} passed`);

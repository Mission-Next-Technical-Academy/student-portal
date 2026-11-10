'use strict';
/* Help Desk simulator console features, each switched on per ticket
 * (ui/helpdesk.js "Console features"): KB search, caller chat, verification
 * and the account card, customer comments, resolution code, read-only
 * priority, note checking and the password refusals in every free-text
 * field. Every existing ticket turns none of them on, so it must look and
 * behave as before; this file adds a test-only ticket (HD-9150, never in
 * ui/helpdesk-data.js) that turns them all on. HD-2101's coached walkthrough
 * is covered end to end by tests/hdesk-m01-practice.test.js. Synthetic data
 * only. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');

// Test-only: a ticket with every console feature on. Maya Chen (u-1001) is
// not used by any other ticket's account.
const TEST_TICKET = {
  id: 'HD-9150', requester: 'Maya Chen', department: 'Operations', category: 'Incident', subcategory: 'Account lockout',
  priority: 'P3', businessImpact: 'One user', sla: '2 business days', createdMinutesAgo: 20,
  description: 'Locked out after typing my password wrong this morning.',
  plausibleCauses: ['Account disabled', 'Too many wrong passwords'], correctPath: ['Verify the caller', 'Unlock'],
  hiddenRootCause: 'Wrong password typed too many times.', expectedResolution: 'Verify, unlock, confirm sign-in.',
  escalationCriteria: ['Lockout returns within a day'],
  console: {
    kb: true,
    caller: { name: 'Maya Chen', questions: [
      { id: 'when', text: 'When did it start?', reply: 'This morning, after the long weekend.' },
      { id: 'signin', text: 'Please sign in slowly with Caps Lock off.', reply: 'I\'m in, thank you!', replyLocked: 'It still says my account is locked.' },
      { id: 'pw', text: 'What password did you type?', asksPassword: true },
    ] },
    account: { userId: 'u-1001', locked: true },
    verification: { prompt: 'How do you verify Maya?', options: [
      { id: 'name', text: 'Accept her name and department', critical: true, feedback: 'A name and department are not verification.' },
      { id: 'number', text: 'Call back on the number she gives you', feedback: 'Not enough: use the directory number.' },
      { id: 'callback', text: 'Call back on the directory number and confirm the employee ID', pass: true, feedback: 'Verified.', history: 'Verified per KB-0024.' },
    ] },
    comments: true,
    resolutionCode: { options: ['Solution provided', 'Escalated'], required: true },
    priorityReason: 'One person, no deadline today.',
    notes: { parts: ['reported', 'checked', 'done', 'result'], nextAction: true, jargon: ['badPwdCount', 'NS-DC01', 'KB step 3'] },
  },
};
// Test-only KB article with an error code, for the exact-match rule.
const TEST_KB = { id: 'KB-0905', title: 'Access denied when saving to a share', category: 'Files', updated: '2026-11-01', audience: 'Service Desk', summary: 'Error 0x80070005 means the user lacks write access. Check group membership.' };

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};

// One simulator tab. `withTest` adds the test-only ticket and article to the
// fixtures before the simulator loads.
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store() } = {}) {
  const u = new URL(url);
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] },
    localStorage: local, sessionStorage: store(),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('helpdesk-data.js'), ctx, { filename: 'helpdesk-data.js' });
  if (withTest) {
    ctx.__test = { ticket: TEST_TICKET, kb: TEST_KB };
    vm.runInContext('HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(__test.ticket)))); HD_KB_ARTICLES.push(__test.kb);', ctx);
  }
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => byId.set(id, { id, value });
  const tab = {
    ctx, toasts, local, run, input,
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id = 'HD-9150') => run(`hdTicketById(${JSON.stringify(id)})`),
    open: (id = 'HD-9150') => { run(`hdState.selectedTicketId = ${JSON.stringify(id)}`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    user: (id) => run(`hdUserById(${JSON.stringify(id)})`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${JSON.stringify(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${JSON.stringify(id)})`); },
    saved: () => local.getItem('defender-lab.helpdesk.state.v1') || '',
  };
  return tab;
}

const NEW_MARKERS = /hd-chat|hd-kb-search|hd-verify|hd-account|hd-comments|hd-resolution-code|hd-priority-preset|Caller chat|Additional comments|Resolution code/;

function testExistingTicketsTurnNothingOn() {
  const tab = sim({ withTest: false });
  const ids = tab.run('HD_TICKET_TEMPLATES.map((t) => t.id)');
  assert.ok(ids.includes('HD-2101') && ids.length >= 20);
  for (const id of ids) {
    assert.equal(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === ${JSON.stringify(id)}).console`), undefined, `${id} has no console settings`);
    const html = tab.open(id);
    assert.doesNotMatch(html, NEW_MARKERS, `${id} shows no new feature`);
    assert.match(html, /<label>Priority<select class="select" onchange="hdSetTicketPriority/, `${id} keeps its priority dropdown`);
    assert.equal(tab.run(`hdConsoleProgress(${JSON.stringify(id)})`), null);
    assert.equal(tab.ticket(id).consoleState, undefined, 'no console state is added to an existing ticket');
    assert.equal(tab.ticket(id).customerComments, undefined);
  }
  // Behaviour too: a priority change and a resolve work as before.
  tab.run("hdSetTicketPriority('HD-2105', 'P1')");
  assert.equal(tab.ticket('HD-2105').priority, 'P1');
  tab.run("hdSetTicketPriority('HD-2105', 'P2')");
  tab.run("hdState.selectedTicketId = 'SR-2116'; hdResolveTicket('SR-2116')");
  assert.equal(tab.ticket('SR-2116').status, 'Resolved');
  assert.equal(tab.ticket('SR-2116').closureCode, 'Request fulfilled', 'the automatic closure code, as before');
  // AD unlock of a user no console ticket owns works as before.
  tab.run("hdState.userOverrides['u-1003'] = { locked:true }; hdState.selectedUserId = 'u-1003'; hdAdAction('unlock')");
  assert.equal(tab.user('u-1003').locked, false);
  // The HD-2101 note check is the same Reported / Tried / Result check.
  assert.deepEqual([...tab.run("hdNoteMissingParts('Reported: locked out again. Tried: unlocked it twice. Result: still locking.')")], []);
  assert.deepEqual([...tab.run("hdNoteMissingParts('Reported: locked out again. Tried: x. Done: unlocked it')")], ['Result'], '"Done:" isn\'t a part here, so it is Tried text, as before');
  assert.deepEqual([...tab.run("hdNoteMissingParts('Reported: locked out again. Tried: checked: event 4740 found. Result: fixed and verified.')")], [], '"checked:" inside Tried is still Tried text');
  assert.deepEqual([...tab.run("hdNoteMissingParts('')")], ['Reported', 'Tried', 'Result']);
}

function testKnowledgeBaseSearch() {
  const tab = sim();
  const ids = (query) => [...tab.run(`hdKbSearchArticles(${JSON.stringify(query)}, hdKbArticles()).map((a) => a.id)`)];
  assert.equal(ids('locked out')[0], 'KB-0024', '"locked" finds "lockout"');
  assert.equal(ids('locked out repeated')[0], 'KB-0024');
  assert.deepEqual(ids('0x80070005'), ['KB-0905'], 'an error code matches exactly');
  assert.deepEqual(ids('0x8007'), [], 'part of an error code is not a match');
  assert.equal(ids('KB-0044')[0], 'KB-0044', 'an article ID');
  assert.equal(ids('APIPA')[0], 'KB-0012', 'the title');
  assert.deepEqual(ids('the my is'), [], 'filler words only: nothing');
  assert.deepEqual(ids(''), []);
  // On the ticket: search, open, close; each recorded.
  let html = tab.open();
  assert.match(html, /hd-kb-search/);
  tab.input('hd-kb-input', 'locked out');
  tab.run("hdKbSearch({ preventDefault() {} }, 'HD-9150')");
  html = tab.open();
  assert.match(html, /data-kb="KB-0024"/);
  assert.doesNotMatch(html, /1\. Verify identity before any account action/, 'closed until opened');
  tab.run("hdKbOpen('HD-9150', 'KB-0024')");
  assert.match(tab.open(), /1\. Verify identity before any account action/);
  tab.run("hdKbOpen('HD-9150', 'KB-0024')");
  assert.doesNotMatch(tab.open(), /1\. Verify identity before any account action/);
  const progress = tab.run("hdConsoleProgress('HD-9150')");
  assert.deepEqual([...progress.kbSearches], ['locked out']);
  assert.deepEqual([...progress.kbOpened], ['KB-0024'], 'opened once, recorded once');
  const log = tab.run('hdState.practiceLog').map((e) => e.type);
  assert.ok(log.includes('kb_search') && log.includes('evidence_opened'));
  tab.input('hd-kb-input', 'zzz nothing');
  tab.run("hdKbSearch({ preventDefault() {} }, 'HD-9150')");
  assert.match(tab.open(), /No articles match “zzz nothing”/);
}

function testVerificationGatesUnlock() {
  const tab = sim();
  assert.equal(tab.user('u-1001').locked, true, 'the ticket\'s account starts locked');
  let html = tab.open();
  assert.match(html, /Verify caller/);
  assert.match(html, /Not verified/);
  assert.match(html, /Account · Maya Chen/);
  assert.match(html, /E-30418/, 'the account card shows the employee ID');
  // Unlock before verifying: refused, on the card and in Active Directory.
  tab.run("hdConsoleUnlock('HD-9150')");
  assert.match(tab.lastToast(), /Verify the caller on HD-9150 before you unlock this account\./);
  assert.equal(tab.user('u-1001').locked, true);
  tab.run("hdState.selectedUserId = 'u-1001'; hdAdAction('unlock')");
  assert.equal(tab.user('u-1001').locked, true, 'Active Directory waits too');
  // Resolving the ticket first doesn't skip the check, on either control.
  tab.run("hdSetResolutionCode('HD-9150', 'Solution provided'); hdTransitionTicket('HD-9150', 'Assigned'); hdTransitionTicket('HD-9150', 'In Progress'); hdTransitionTicket('HD-9150', 'Resolved')");
  assert.equal(tab.ticket().status, 'Resolved');
  tab.run("hdState.selectedUserId = 'u-1001'; hdAdAction('unlock')");
  assert.equal(tab.user('u-1001').locked, true, 'Active Directory still waits for a passing check');
  tab.run("hdConsoleUnlock('HD-9150')");
  assert.equal(tab.user('u-1001').locked, true, 'so does the account card');
  tab.run("hdTransitionTicket('HD-9150', 'In Progress')");
  // A critical choice: recorded and flagged.
  tab.run("hdVerify('HD-9150', 'name')");
  html = tab.open();
  assert.match(html, /callout bad" role="alert">A name and department are not verification\./);
  tab.run("hdVerify('HD-9150', 'number')");
  assert.match(tab.open(), /callout warn" role="status">Not enough/);
  tab.run("hdConsoleUnlock('HD-9150')");
  assert.equal(tab.user('u-1001').locked, true, 'a failing choice never unlocks');
  // The passing choice: verified, choices gone, unlock works.
  tab.run("hdVerify('HD-9150', 'callback')");
  html = tab.open();
  assert.match(html, /hd-badge ok">Verified/);
  assert.doesNotMatch(html, /hdVerify\(/, 'the choices are gone once verified');
  tab.run("hdVerify('HD-9150', 'name')");
  const progress = tab.run("hdConsoleProgress('HD-9150')");
  assert.deepEqual([...progress.verification.tries], ['name', 'number', 'callback'], 'every try is kept; nothing after the pass');
  assert.deepEqual([...progress.verification.criticalErrors], ['name']);
  assert.equal(progress.verification.passed, true);
  tab.run("hdConsoleUnlock('HD-9150')");
  assert.equal(tab.user('u-1001').locked, false);
  assert.match(tab.open(), /hd-badge ok">Unlocked/);
  assert.ok(tab.ticket().troubleshootingHistory.some((row) => row.action === 'Verified per KB-0024.'));
  assert.ok(tab.ticket().troubleshootingHistory.some((row) => /Account mchen unlocked \(Account card\)/.test(row.action)));
  // Active Directory unlock after a pass is recorded on the ticket.
  tab.run("hdState.userOverrides['u-1001'].locked = true; hdState.selectedUserId = 'u-1001'; hdAdAction('unlock')");
  assert.equal(tab.user('u-1001').locked, false);
  assert.equal(tab.run("hdConsoleProgress('HD-9150').unlocks"), 2);
}

function testCallerChat() {
  const tab = sim();
  let html = tab.open();
  assert.match(html, /Caller chat/);
  assert.match(html, /No questions asked yet\./);
  tab.run("hdChatAsk('HD-9150', 'when')");
  html = tab.open();
  assert.match(html, /This morning, after the long weekend\./);
  assert.doesNotMatch(html, /hdChatAsk\('HD-9150','when'\)/, 'an answered question is gone');
  // Still locked: the locked reply; the question comes back once the account is unlocked.
  tab.run("hdChatAsk('HD-9150', 'signin')");
  assert.match(tab.open(), /It still says my account is locked\./);
  assert.doesNotMatch(tab.open(), /hdChatAsk\('HD-9150','signin'\)/);
  tab.run("hdVerify('HD-9150', 'callback'); hdConsoleUnlock('HD-9150')");
  assert.match(tab.open(), /hdChatAsk\('HD-9150','signin'\)/);
  tab.run("hdChatAsk('HD-9150', 'signin')");
  html = tab.open();
  assert.match(html, /I&#39;m in, thank you!|I'm in, thank you!/);
  assert.doesNotMatch(html, /hdChatAsk\('HD-9150','signin'\)/);
  // Asking for a password is refused, as the shell refuses one.
  tab.run("hdChatAsk('HD-9150', 'pw')");
  assert.match(tab.lastToast(), /^Stopped: never type a user's password, not in the shell and not anywhere else\. The help desk never asks for a password/);
  assert.equal(tab.ticket().passwordAsked, true);
  assert.match(tab.open(), /You \(not asked\)/);
  assert.doesNotMatch(tab.open(), /hdChatAsk\('HD-9150','pw'\)/);
  assert.ok(tab.run('hdState.practiceLog').some((e) => e.type === 'password_refused' && e.field === 'chat'));
  assert.deepEqual([...tab.run("hdConsoleProgress('HD-9150').chatAsked")], ['when', 'signin', 'signin']);
  tab.run("hdChatAsk('HD-9150', 'nope')");
  assert.equal(tab.ticket().consoleState.chat.length, 4, 'an unknown question does nothing');
}

function testCustomerCommentsStaySeparate() {
  const tab = sim();
  assert.match(tab.open(), /Additional comments \(customer-visible\)/);
  assert.equal(tab.comment('HD-9150', 'Hi Maya, your account was locked after a few wrong tries. It\'s unlocked now.'), true);
  assert.equal(tab.lastToast(), 'Customer comment added.');
  assert.equal(tab.ticket().customerComments.length, 1);
  assert.equal(tab.ticket().notes.length, 0, 'a comment is not a work note');
  tab.note('HD-9150', 'Reported: locked out. Checked: verified by callback. Done: unlocked account. Result: signed in fine.');
  assert.equal(tab.ticket().notes.length, 1);
  assert.equal(tab.ticket().customerComments.length, 1, 'a work note is not a comment');
  // Jargon: the ticket's own list, whole words, any case.
  tab.comment('HD-9150', 'Your BADPWDCOUNT hit the limit on ns-dc01, see KB step 3.');
  assert.equal(tab.lastToast(), 'Comment added. The customer won\'t know these words: badPwdCount, NS-DC01, KB step 3. Say it in plain words.');
  assert.deepEqual([...tab.run("hdJargonFound('A badPwdCounter and NS-DC012', ['badPwdCount', 'NS-DC01'])")], [], 'whole words only');
  assert.deepEqual([...tab.run("hdConsoleProgress('HD-9150').lastCommentJargon")], ['badPwdCount', 'NS-DC01', 'KB step 3']);
  assert.equal(tab.comment('HD-9150', '   '), false);
  const html = tab.open();
  assert.match(html, /hd-comment-input/);
  assert.match(html, /Hi Maya, your account was locked/);
}

function testResolutionCodeAndReadOnlyPriority() {
  const tab = sim();
  let html = tab.open();
  assert.match(html, /hd-priority-preset/);
  assert.match(html, /Pre-set: One person, no deadline today\./);
  assert.doesNotMatch(html, /hdSetTicketPriority\('HD-9150'/, 'no dropdown');
  tab.run("hdSetTicketPriority('HD-9150', 'P1')");
  assert.equal(tab.ticket().priority, 'P3', 'a pre-set priority can\'t be changed');
  assert.match(html, /Resolution code \(required to resolve\)/);
  tab.input('hd-diagnosis', 'Too many wrong passwords');
  tab.run("hdSubmitDiagnosis('HD-9150')");
  assert.equal(tab.ticket().diagnosisCorrect, true);
  tab.run("hdResolveTicket('HD-9150')");
  assert.equal(tab.lastToast(), 'Choose a resolution code before you resolve this ticket.');
  assert.notEqual(tab.ticket().status, 'Resolved');
  // Nor through the state list.
  tab.run("hdTransitionTicket('HD-9150', 'Assigned'); hdTransitionTicket('HD-9150', 'In Progress'); hdTransitionTicket('HD-9150', 'Resolved')");
  assert.equal(tab.ticket().status, 'In Progress', 'Next state can\'t skip a required code');
  assert.equal(tab.lastToast(), 'Choose a resolution code before you resolve this ticket.');
  tab.run("hdSetResolutionCode('HD-9150', 'Not a code')");
  assert.equal(tab.ticket().consoleState.resolutionCode, '', 'only an offered code');
  tab.run("hdSetResolutionCode('HD-9150', 'Solution provided'); hdResolveTicket('HD-9150')");
  assert.equal(tab.ticket().status, 'Resolved');
  assert.equal(tab.ticket().closureCode, 'Solution provided', 'the student\'s code is the closure code');
  html = tab.open();
  assert.match(html, /<option selected>Solution provided<\/option>/);
}

function testNoteChecking() {
  const tab = sim();
  const missing = (text, parts) => [...tab.run(`hdNoteMissingParts(${JSON.stringify(text)}, ${JSON.stringify(parts)})`)];
  const FOUR = ['reported', 'checked', 'done', 'result'];
  assert.deepEqual(missing('Reported: locked out at 08:00. Checked: verified by callback. Done: unlocked account. Result: signed in fine.', FOUR), []);
  assert.deepEqual(missing('Reported: locked out at 08:00. Done: unlocked account.', FOUR), ['Checked', 'Result']);
  assert.deepEqual(missing('Reported: x. Checked: ok. Done: ok. Result: fine.', FOUR), ['Reported', 'Checked', 'Done', 'Result'], 'each part needs some substance');
  assert.deepEqual(missing('Reported: locked out at 08:00. Next action: SOC reviews it today.', ['reported', 'next']), []);
  assert.deepEqual(missing('Reported: locked out at 08:00. Next   action: SOC reviews it today.', ['reported', 'next']), [], 'any spacing in "Next action"');
  assert.deepEqual([...tab.run('Object.keys(HD_NOTE_PARTS)')], ['reported', 'tried', 'checked', 'done', 'result', 'next'], 'the part labels live in one place');
  // On the ticket: its four parts while it can be resolved, plus Next action once it stays open.
  const note = 'Reported: locked out at 08:00. Checked: verified by callback. Done: unlocked account. Result: signed in fine.';
  assert.match(tab.open(), /placeholder="Reported: …&#10;Checked: …&#10;Done: …&#10;Result: …"/);
  tab.note('HD-9150', note);
  assert.equal(tab.lastToast(), 'Note added: Reported, Checked, Done and Result are all there.');
  tab.run("hdTicketById('HD-9150').status = 'Escalated'");
  assert.match(tab.open(), /Result: …&#10;Next action: …"/);
  tab.note('HD-9150', note);
  assert.equal(tab.lastToast(), 'Note added. A complete note for this ticket has 5 parts: Reported, Checked, Done, Result and Next action. Still missing: Next action.');
  assert.deepEqual([...tab.run("hdConsoleProgress('HD-9150').noteMissing")], ['Next action']);
}

function testPasswordRefusalsInEveryTextField() {
  const tab = sim();
  const has = (text) => tab.run(`hdPasswordInText(${JSON.stringify(text)})`);
  // A password value: a label, then ":", "=" or "is", then a value.
  for (const text of ['New password: Summer2026!', 'password=Hunter22', 'PW: letmein', 'pwd = Tr0ub4dor', 'the passcode is 4471', 'Temp password is "Winter#5"',
    'Her password is Autumn2026', 'Reported: x\nTried: reset it, password: Spring2026a', 'Password: "Spring 2026!"', 'pw: \u201cBlue Sky 7\u201d', 'Password was: Spring2026!', 'password is: Hunter22', 'Password \u2014 Spring2026!', 'new pw \u2013 Tr0ub4dor', 'password - Summer2026!', 'pw- Hunter22', 'Ran Set-ScheduledTask -User NORTHSTAR\\jbell -Password Summer2026!']) {
    assert.equal(has(text), true, text);
  }
  // The words alone, or a state word after the label, are not a password.
  for (const text of ['Explained we can\'t view or set passwords.', 'Guided the user through the self-service password reset.', 'User forgot her password after two weeks off.',
    'Password: reset by the user at the self-service page.', 'The password is expired.', 'password is not something IT can see', 'Password: ********', 'Password:\nResult: signed in.',
    'Caller wanted the password texted to 407-555-0199.', 'Get-ChildItem -Path C:\\Temp', 'Password: it\'s never shared.', 'password: ""', 'The password was causing the lockouts.', 'Password \u2014 reset by the user.', 'password-protected file', 'password - reset by the user.']) {
    assert.equal(has(text), false, text);
  }
  // Practice: a work note on any ticket, HD-2101 included, is refused with the shell's coaching.
  assert.equal(tab.note('HD-2101', 'Reported: locked out. Tried: set password: Summer2026x. Result: ok'), false);
  assert.match(tab.lastToast(), /^Stopped: never type a user's password, not in the shell and not anywhere else\. Remove it from the work note, then add it again\./);
  assert.equal(tab.ticket('HD-2101').notes.length, 0);
  assert.equal(tab.ticket('HD-2101').passwordWritten, true);
  assert.equal(tab.run('hdM01Investigation().passwordWritten'), true, 'the Practice package carries the flag');
  assert.equal(tab.run('hdM01Investigation().passwordTyped'), false, 'the shell flag is separate');
  // A comment, and a note on the console ticket.
  assert.equal(tab.comment('HD-9150', 'Hi Maya, your new password is Welcome2026.'), false);
  assert.match(tab.lastToast(), /Remove it from the customer comment/);
  assert.equal(tab.note('HD-9150', 'Reported: locked out. Done: pw = Autumn99'), false);
  assert.equal(tab.ticket().notes.length, 0);
  assert.equal(tab.ticket().customerComments, undefined);
  // The words alone save.
  assert.equal(tab.note('HD-2101', 'Reported: user forgot it. Tried: explained we can\'t view or set passwords; guided the self-service password reset. Result: signed in.'), true);
  const state = JSON.stringify(tab.run('hdState')) + tab.saved();
  assert.ok(!/Summer2026x|Welcome2026|Autumn99/.test(state), 'no refused password anywhere in the state or the save');
  assert.equal(tab.run("hdConsoleProgress('HD-9150').passwordWritten"), true);
}

function testOldDraftsAreMaskedOnLoad() {
  // A save from before this change: no console fields, and a note with a password.
  const first = sim();
  const saved = JSON.parse(first.saved());
  const ticket = saved.tickets.find((t) => t.id === 'HD-2101');
  ticket.notes.push({ time: '08:00', author: 'Riley Morgan', text: 'Reported: x. Tried: password: OldSecret9 then unlocked. Result: ok.' });
  ticket.notes.push({ time: '08:05', author: 'Riley Morgan', text: 'Temp password is "Spring 2026!" for now; pw: \u2018Blue Sky 7\u2019.' });
  saved.tickets.forEach((t) => { delete t.consoleState; delete t.customerComments; });
  const local = store([['defender-lab.helpdesk.state.v1', JSON.stringify(saved)]]);
  const tab = sim({ local });
  assert.ok(!/OldSecret9|Spring|2026!|Blue Sky/.test(tab.saved()), 'the raw copy is gone from storage, all of a quoted value too');
  const notes = tab.ticket('HD-2101').notes;
  assert.match(notes.at(-2).text, /password: \*\*\*\*\*\*\*\* then unlocked/);
  assert.equal(notes.at(-1).text, 'Temp password is "********" for now; pw: \u2018********\u2019.');
  notes.forEach((note) => assert.equal(tab.run(`hdPasswordInText(${JSON.stringify(note.text)})`), false, 'nothing left to find after masking'));
  assert.equal(tab.ticket('HD-2101').passwordWritten, true);
  // The console ticket still renders from an old save with no console state.
  assert.match(tab.open(), /Verify caller/);
  assert.equal(tab.run("hdConsoleProgress('HD-9150').verification.passed"), false);
}

function testEmployeeIdsInTheDirectory() {
  const tab = sim({ withTest: false });
  const users = tab.run('HD_USERS');
  const ids = users.map((u) => u.employeeId);
  assert.ok(ids.every((id) => /^E-\d{5}$/.test(id)), 'every user has one');
  assert.equal(new Set(ids).size, ids.length, 'all different');
  for (const route of ['helpdesk/directory', 'helpdesk/active-directory']) {
    const html = tab.view(route);
    assert.match(html, /<th>User<\/th><th>Employee ID<\/th><th>Department<\/th><th>Phone<\/th>/, route);
    users.forEach((u) => assert.ok(html.includes(`<td>${u.employeeId}</td>`), `${route}: ${u.name}`));
  }
  // Prove It shows both columns too, and turns no console feature on.
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-prove001#/helpdesk/tickets' });
  const html = prove.view('helpdesk/directory');
  assert.match(html, /<th>Employee ID<\/th><th>Department<\/th><th>Phone<\/th>/);
  assert.ok(html.includes('<td>E-40519</td>') && html.includes('<td>ext. 4174</td>'), 'Evan Parker\'s ID and phone');
  assert.deepEqual(JSON.parse(JSON.stringify(prove.run("hdConsole(hdTicketById('HD-9150') || { id:'HD-9150' })"))), {}, 'no console feature in Prove');
  assert.doesNotMatch(prove.open('HD-2125'), NEW_MARKERS);
}

const tests = [
  testExistingTicketsTurnNothingOn, testKnowledgeBaseSearch, testVerificationGatesUnlock, testCallerChat,
  testCustomerCommentsStaySeparate, testResolutionCodeAndReadOnlyPriority, testNoteChecking,
  testPasswordRefusalsInEveryTextField, testOldDraftsAreMaskedOnLoad, testEmployeeIdsInTheDirectory,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-console-features: all ${tests.length} passed`);

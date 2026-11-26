'use strict';
// Help Desk Module 8 (key its-06) Practice It, Lab 8.1 (ui/helpdesk-coaches.js
// "hd-m06"): an identity morning, coached set its-06-guided.
//
//   - Part A on HD-2196 (INC0010507): Noah Williams's lockout that comes back.
//     The source is a saved password on his old desk PC, NS-WS-0277.
//   - Part B on HD-2197 (INC0010508) and its request SR-2207 (RITM0010162):
//     Sam Rivera's new work phone and Send as on support@.
//   - The coach walks Part A steps 1 to 10 and Part B steps 1 to 12 of spec section 8.2 through
//     ui/coach.js. Each step waits for real state, never a tick box.
//   - The typed lines (Get-ADUser on nwilliams, cmdkey /list on NS-WS-0277)
//     pass from the command history in any letter case. The optional lines
//     (Unlock-ADAccount, cmdkey /delete) pass their steps as the screens do.
//   - Finish sends HD-2196, HD-2197 and SR-2207 (never HD-2101), and the
//     portal's cleaner keeps all three.
//   - The optional extension (hd-m06-ext, set its-06-extension) works HD-2101
//     as Tier 2 work and sends nothing.
//   - SR-2107 and HD-2118 are in no student queue; a saved run of the old
//     hd-m06 starts fresh.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m07-guided-lab.test.js does. Synthetic data only.
const assert = require('node:assert/strict');
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
const STUDENT = 'student-m08g0001';
const launchUrl = (coach = 'hd-m06', restart = true, student = STUDENT) => `${SIM_URL}?coach=${coach}${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const A = 'HD-2196';
const B = 'HD-2197';
const R = 'SR-2207';
const PC = 'NS-WS-0277';
const PHONE = 'NS-PH-0001';

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
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    attach: (id, article) => run(`hdKbAttach(${j(id)}, ${j(article)})`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, code, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, ${j(code)})`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    ad: (adTab) => { run(`hdState.adTab = ${j(adTab)}`); return run("VIEWS['helpdesk/active-directory']()"); },
    pane: () => { const html = tab.ad('users'); const at = html.indexOf('<aside class="card hd-object-pane"'); return at < 0 ? html.slice(-3000) : html.slice(at); },
    seen: () => plain(run('hdState.serverSeen || []')),
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
const NOTE_A = 'Reported: locked out 3 times since lunch; unlocked at 12:20 and relocked; password changed yesterday.\nTried: verified per KB-0024 (directory callback + employee ID); account locked, enabled, never expires, password set yesterday 16:10; Lockout details: 3 lockouts today, source NS-WS-0277 (his old desk PC); cmdkey /list showed a saved credential for NS-FILE01 with the old password; with Noah\'s OK removed it in Credential Manager (KB-0103); unlocked once.\nResult: no new bad attempts after 2 minutes; Noah signed in and reconnected the Sales drive with his new password.';
const COMMENT_A = 'Hi Noah, you\'re unlocked and it should stay that way now. Your old desk PC still had your previous password saved for the Sales drive, and it kept trying it, which locked you out. We\'ve removed that saved password. If your desk PC asks for your password for the drive, type your new one. – Riley';
const NOTE_B = 'Reported: new company phone yesterday; Authenticator was on the old phone, can\'t approve sign-ins; Teams prompting on laptop.\nTried: verified in person per KB-0065 (badge matches directory photo, employee ID); hardware request shows NS-PH-0002 returned and wiped, NS-PH-0001 issued; Service health: no sign-in or Exchange advisory; required MFA re-registration; guided Authenticator setup on NS-PH-0001; enrolled in Company Portal; set OneDrive to Wi-Fi only (5 GB plan); paired HS-200 headset.\nResult: test sign-in approved; sign-in log Success with MFA; NS-PH-0001 Compliant; Outlook mail, calendar and contacts syncing; headset test call OK.';
const COMMENT_B = 'Hi Sam, your new phone is all set: sign-in approvals come to it now, your work mail, calendar and contacts are on it, and your headset is paired. OneDrive will only upload over Wi-Fi so you don\'t use up your data plan. – Riley';
const NOTE_R = 'Reported: approved request for Send as on support@ for Sam Rivera.\nTried: read the mailbox permissions; Full Access was already in place.\nResult: Send as on support@ added for Sam Rivera per owner approval (C. Morales); may take up to an hour to apply.';

function startLab(opener, local, session) {
  const tab = sim(launchUrl(), { opener, local, session });
  assert.equal(tab.run('hdState.ticketSet'), 'its-06-guided');
  // The queue order is shuffled per shift; the set is exactly these three.
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [A, B, R]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T13:05:00.000Z');
  return tab;
}

/* ------------------------------------------------------------ Part A */
const LINES = {
  getAdUser: 'Get-ADUser nwilliams -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet',
  cmdkey: 'cmdkey /list',
};
// Part A step 1 to Part A step 6: triage, verification, the account's fields, Lockout details,
// the question about NS-WS-0277 and the typed cmdkey /list.
function partAToA6(tab, lines = LINES) {
  tab.open(A);
  at(tab, 0, 'Part A step 1 waits');
  tab.triage(A, 'Access', 'Account lockout', 'nwilliams', '3', '1');
  assert.equal(tab.ticket(A).priority, 'P3');
  at(tab, 1, 'Part A step 1 done, Part A step 2 waits');
  tab.run(`hdKbOpen('${A}', 'KB-0024')`);
  tab.run(`hdVerify('${A}', 'callback')`);
  at(tab, 2, 'Part A step 2 done');
  // Part A step 3: the typed line (the pane would pass it too, see testA3FromThePane).
  const out = tab.ps(lines.getAdUser);
  assert.match(out, /LockedOut\s+: True/);
  at(tab, 3, 'Part A step 3 done');
  // Part A step 4: Lockout details and the Tier 2 view.
  tab.run("hdOpenUser('u-1003'); hdAcctLockoutOpen('u-1003')");
  let pane = tab.pane();
  assert.match(pane, /Lockouts today<\/dt><dd>3</);
  assert.match(pane, /data-hd-lockout-source>NS-WS-0277</);
  tab.run("hdAcctTier2('u-1003')");
  pane = tab.pane();
  assert.match(pane, /data-hd-4740-card="u-1003"[\s\S]*<td>nwilliams<\/td><td>NS-WS-0277<\/td>/);
  at(tab, 4, 'Part A step 4 done');
  // Part A step 5: ask Noah about NS-WS-0277.
  tab.run(`hdChatAsk('${A}', 'device')`);
  assert.match(tab.open(A), /my old desk PC/);
  at(tab, 5, 'Part A step 5 done');
  // Part A step 6: cmdkey /list typed on NS-WS-0277.
  const html = tab.open(A);
  assert.match(html, /data-hd-machines/);
  assert.match(html, /Open NS-WS-0277/);
  tab.run(`hdSelectComputer('${PC}')`);
  assert.match(tab.ps(lines.cmdkey), /Target: Domain:target=NS-FILE01\n\s+Type: Domain Password\n\s+User: NORTHSTAR\\nwilliams/);
  at(tab, 6, 'Part A step 6 done');
}
// Part A step 7 to Part A step 10: remove the saved password, unlock once, wait, note and resolve.
function partAFromA7(tab, { typed = false } = {}) {
  tab.open(A);
  tab.run(`hdChatAsk('${A}', 'consent')`);
  if (typed) {
    tab.run(`hdSelectComputer('${PC}')`);
    assert.equal(tab.ps('cmdkey /delete:NS-FILE01'), 'CMDKEY: Credential deleted successfully.');
  } else {
    tab.run(`hdOpenMachineScreen('${PC}', 'credential-manager')`);
    assert.match(tab.view('helpdesk/credential-manager'), /data-hd-cred="NS-FILE01"/);
    tab.run(`hdCredAsk('${PC}', 'NS-FILE01'); hdCredRemove('${PC}', 'NS-FILE01')`);
    assert.match(tab.view('helpdesk/credential-manager'), /No Windows credentials are saved/);
  }
  at(tab, 7, 'Part A step 7 done');
  // Part A step 8 asks for KB-0103 first, then the unlock.
  tab.kb(A, 'keeps locking', 'KB-0103');
  if (typed) assert.equal(tab.ps('Unlock-ADAccount nwilliams'), '');
  else { tab.run("hdOpenUser('u-1003')"); tab.pane(); tab.run("hdAcctUnlock('u-1003')"); }
  assert.equal(tab.run("hdFileUser('u-1003').locked"), false);
  at(tab, 8, 'Part A step 8 done');
  tab.open(A);
  tab.run(`hdAcctWait('${A}')`);
  assert.equal(tab.run("hdFileUser('u-1003').locked"), false, 'still unlocked after 2 minutes');
  at(tab, 8, 'Part A step 9 waits for Noah');
  tab.run(`hdChatAsk('${A}', 'reopen')`);
  at(tab, 9, 'Part A step 9 done');
  tab.attach(A, 'KB-0103');
  tab.note(A, NOTE_A);
  tab.comment(A, COMMENT_A);
  at(tab, 9, 'Part A step 10 waits for Resolved');
  tab.resolve(A, 'Fixed — user guided', 'Saved password removed on NS-WS-0277; unlocked once; stayed unlocked.');
  assert.equal(tab.ticket(A).status, 'Resolved');
  at(tab, 10, 'Part A step 10 done');
}

/* ------------------------------------------------------------ Part B */
function partB(tab) {
  // Part B step 1: triage; the request shows no SLA bar.
  tab.open(B);
  tab.triage(B, 'Access', 'MFA', 'srivera', '3', '2');
  tab.run(`hdSetClassification('${B}', 'contactType', 'Walk-in')`);
  assert.equal(tab.ticket(B).priority, 'P4');
  assert.match(tab.open(R), /RITM0010162/);
  at(tab, 11, 'Part B step 1 done');
  // Part B step 2: verified in person, the swap on record.
  tab.open(B);
  tab.run(`hdKbOpen('${B}', 'KB-0065'); hdVerify('${B}', 'badge')`);
  at(tab, 11, 'Part B step 2 waits for the hardware request');
  tab.run(`hdEvidenceOpen('${B}', 'sam-hardware-request')`);
  assert.match(tab.open(B), /NS-PH-0002 · returned and wiped yesterday/);
  at(tab, 12, 'Part B step 2 done');
  // Part B step 3: Service health, one Teams advisory.
  tab.run("hdM365Tab('health')");
  const health = tab.view('helpdesk/m365-admin');
  assert.match(health, /data-hd-advisory="TM-ADV-0819"[\s\S]*Teams meeting recordings delayed/);
  assert.doesNotMatch(health, /Exchange Online<\/td>|sign-in/i);
  at(tab, 13, 'Part B step 3 done');
  // Part B step 4: read the methods, then require re-registration.
  tab.run("hdEntraOpenUser('u-1013')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-method-device>NS-PH-0002</);
  at(tab, 13, 'Part B step 4 waits for the re-registration');
  tab.run("hdEntraReregister('u-1013')");
  tab.run("hdEntraTab('audit')");
  assert.match(tab.view('helpdesk/entra-admin'), /rmorgan<\/td><td>Admin required re-registration of multifactor authentication<\/td><td>Sam Rivera/);
  at(tab, 14, 'Part B step 4 done');
  // Part B step 5: Authenticator on NS-PH-0001, a test approved.
  tab.run(`hdPhoneOpen('${PHONE}', 'authenticator'); hdPhoneAuthAdd('${PHONE}')`);
  at(tab, 14, 'Part B step 5 waits for the test');
  tab.run(`hdPhoneAuthTest('${PHONE}'); hdPhoneAuthApprove('${PHONE}')`);
  tab.run("hdEntraOpenUser('u-1013'); hdEntraTab('methods')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-hd-method-device>NS-PH-0001</);
  at(tab, 15, 'Part B step 5 done');
  // Part B step 6: the sign-in log.
  tab.run("hdEntraOpenUser('u-1013'); hdEntraTab('signins')");
  assert.match(tab.view('helpdesk/entra-admin'), /data-status="Success"[\s\S]*Microsoft Authenticator[\s\S]*MFA required — not completed/);
  at(tab, 16, 'Part B step 6 done');
  // Part B step 7: enrol, then Intune.
  tab.run(`hdPhoneOpen('${PHONE}', 'company-portal'); hdPhoneEnrol('${PHONE}')`);
  at(tab, 16, 'Part B step 7 waits for Intune');
  const list = tab.view('helpdesk/intune');
  assert.match(list, /data-hd-intune-row="NS-PH-0002"[\s\S]*Retired/);
  tab.run(`hdIntuneOpen('${PHONE}')`);
  assert.match(tab.view('helpdesk/intune'), /data-hd-intune-device="NS-PH-0001"[\s\S]*data-hd-ownership>Corporate[\s\S]*data-hd-compliance>Compliant/);
  at(tab, 17, 'Part B step 7 done');
  // Part B step 8: Outlook with mail, calendar and contacts.
  tab.run(`hdPhoneOpen('${PHONE}', 'outlook'); hdPhoneOutlookAdd('${PHONE}')`);
  ['mail', 'calendar', 'contacts'].forEach((key) => { if (!tab.run(`hdPhone('${PHONE}', hdCloud()).outlook.sync.${key}`)) tab.run(`hdPhoneOutlookSync('${PHONE}', '${key}')`); });
  const outlook = tab.view('helpdesk/phone');
  assert.match(outlook, /data-hd-outlook-inbox>Inbox up to date/);
  assert.match(outlook, /data-hd-phone-sync-calendar[^>]*>On[\s\S]*data-hd-phone-sync-contacts[^>]*>On/);
  at(tab, 18, 'Part B step 8 done');
  // Part B step 9: OneDrive on Wi-Fi only, with the 5 GB plan in the status bar.
  tab.run(`hdPhoneOpen('${PHONE}', 'onedrive')`);
  assert.match(tab.view('helpdesk/phone'), /data-hd-data-used>3.6 GB of 5 GB used/);
  tab.run(`hdPhoneOneDrive('${PHONE}')`);
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-wifi-only[^>]*>On/);
  at(tab, 19, 'Part B step 9 done');
  // Part B step 10: on, pairing mode, find, PIN, test.
  tab.run(`hdPhoneOpen('${PHONE}', 'bluetooth'); hdPhoneBtToggle('${PHONE}'); hdPhoneBtPairingMode('${PHONE}', 'HS-200 Headset'); hdPhoneBtScan('${PHONE}'); hdPhoneBtAsk('${PHONE}', 'HS-200 Headset')`);
  at(tab, 19, 'Part B step 10 waits for the pairing');
  assert.equal(tab.run(`hdPhoneBtPair('${PHONE}', 'HS-200 Headset', '0000')`), true);
  tab.run(`hdPhoneBtTest('${PHONE}')`);
  assert.match(tab.view('helpdesk/phone'), /data-hd-bt-tested>Test call: audio through HS-200 Headset/);
  at(tab, 20, 'Part B step 10 done');
  // Part B step 11: Send as on support@, from the request.
  tab.open(R);
  tab.run("hdM365OpenMailbox('support')");
  assert.match(tab.view('helpdesk/m365-admin'), /data-hd-full-access><li>Sam Rivera<\/li>/);
  at(tab, 20, 'Part B step 11 waits for Send as');
  tab.run("hdM365MailboxAdd('support', 'u-1013', 'sendAs')");
  assert.match(tab.toasts.slice(-1)[0], /up to an hour/);
  assert.match(tab.view('helpdesk/m365-admin'), /data-hd-send-as><li>Sam Rivera<\/li>/);
  at(tab, 21, 'Part B step 11 done');
  // Part B step 12: close both records.
  tab.open(B);
  tab.kb(B, 'new phone', 'KB-0065'); tab.attach(B, 'KB-0065');
  tab.note(B, NOTE_B);
  tab.comment(B, COMMENT_B);
  tab.resolve(B, 'Fixed — user guided', 'New phone set up: MFA, enrolment, Outlook, OneDrive and headset.');
  assert.equal(tab.ticket(B).status, 'Resolved');
  at(tab, 21, 'Part B step 12 waits for the request');
  tab.open(R);
  tab.note(R, NOTE_R);
  tab.run(`hdRequestClose('${R}')`);
  assert.equal(tab.ticket(R).request.state, 'Closed Complete');
  at(tab, 22, 'at Finish');
}

/* ------------------------------------------------------------ the walk */

function testLabOpensOnItsSet() {
  const tab = startLab();
  const coach = tab.coach('hd-m06');
  assert.equal(coach.module, 8);
  assert.equal(coach.completionToken, 'hd-m06');
  assert.equal(coach.steps.length, 23, 'Part A steps 1 to 10, Part B steps 1 to 12, then Finish');
  assert.equal(tab.ticket(A).number, 'INC0010507');
  assert.equal(tab.ticket(B).number, 'INC0010508');
  assert.equal(tab.ticket(R).request.number, 'RITM0010162');
  assert.equal(tab.ticket(R).request.approval, 'Approved');
}

function testLab81() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  partAToA6(tab);
  partAFromA7(tab);
  partB(tab);
  for (const id of [A, B, R]) {
    const feedback = tab.feedback(id);
    feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
    assert.deepEqual(feedback.critical, [], `${id} no critical entry`);
    assert.deepEqual(feedback.flags, [], `${id} no flag`);
  }
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m06');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id).sort(), [A, B, R]);
  assert.ok(!JSON.stringify(work).includes('HD-2101'), 'the extension is not in the record');
  // The portal's cleaner keeps all three, SR-2207 included.
  const portal = loadPortal();
  const clean = plain(vm.runInContext('itsCleanCoachWork', portal)(work));
  assert.deepEqual(clean.tickets.map((t) => t.id).sort(), [A, B, R]);
  const request = clean.tickets.find((t) => t.id === R);
  assert.match(request.notes.slice(-1)[0].text, /Send as on support@ added/);
  // The request's end state reaches the record: the instructor sheet reads it.
  assert.equal(request.console && request.console.request && request.console.request.state, 'Closed Complete', 'the saved work keeps Closed Complete');
}

// Any letter case and extra spaces pass the typed steps.
function testTypedStepsAnyCase() {
  const tab = startLab();
  partAToA6(tab, { getAdUser: 'get-aduser   NWILLIAMS -properties lockedout, enabled, accountexpirationdate, passwordexpired, passwordlastset', cmdkey: 'CMDKEY  /LIST' });
}

// Part A step 3 also passes from Noah's pane, as its row says.
function testA3FromThePane() {
  const tab = startLab();
  tab.open(A);
  tab.triage(A, 'Access', 'Account lockout', 'nwilliams', '3', '1');
  tab.run(`hdVerify('${A}', 'callback')`);
  at(tab, 2, 'Part A step 3 waits');
  tab.run("hdOpenUser('u-1003')");
  tab.pane();
  at(tab, 3, 'Part A step 3 passes from the pane');
}

// The Credential Manager screen alone never passes Part A step 6, and cmdkey on another
// computer doesn't either.
function testA6NeedsTheTypedLine() {
  const tab = startLab();
  tab.open(A);
  const steps = tab.coach('hd-m06').steps;
  tab.run(`hdOpenMachineScreen('${PC}', 'credential-manager')`);
  assert.match(tab.view('helpdesk/credential-manager'), /data-hd-cred="NS-FILE01"/);
  assert.equal(steps[5].check(), false, 'the screen alone does not pass Part A step 6');
  tab.run("hdSelectComputer('NS-LT-0131')");
  tab.ps('cmdkey /list');
  assert.equal(steps[5].check(), false, 'cmdkey on another computer does not count');
  tab.run(`hdSelectComputer('${PC}')`);
  tab.ps('cmdkey /list');
  assert.equal(steps[5].check(), true);
}

// The optional lines pass their steps the way their screens do.
function testOptionalLinesPassTheirSteps() {
  const tab = startLab();
  partAToA6(tab);
  partAFromA7(tab, { typed: true });
}

// Get-ADUser says what Noah's pane says.
function testGetAdUserMatchesThePane() {
  const tab = startLab();
  tab.open(A);
  const out = tab.ps(LINES.getAdUser);
  assert.match(out, /Enabled\s+: True/);
  assert.match(out, /LockedOut\s+: True/);
  assert.match(out, /AccountExpirationDate\s+: \(not set: never expires\)/);
  assert.match(out, /PasswordExpired\s+: False/);
  assert.match(out, /PasswordLastSet\s+: Yesterday 16:10/);
  tab.run("hdOpenUser('u-1003')");
  const pane = tab.pane();
  assert.match(pane, /hd-badge bad">Locked</);
  assert.match(pane, /<dt>Account<\/dt><dd>Enabled<\/dd>/);
  assert.match(pane, /<dt>Locked out<\/dt><dd>Yes<\/dd>/);
  assert.match(pane, /data-hd-account-expires>Never</);
  assert.match(pane, /data-hd-password-expired>No</);
  assert.match(pane, /data-hd-password-last-set>Yesterday 16:10</);
  assert.match(pane, /<dt>Password age<\/dt><dd>1 days<\/dd>/, 'password age agrees with "Yesterday"');
}

// Every step: a route the coach allows, "Why:" and "Success looks like", and
// none of the words the spec rules out. The typed lines sit behind "Show me
// the command".
function testEveryStepText() {
  const tab = startLab();
  const coach = tab.coach('hd-m06');
  const allow = plain(coach.allow);
  for (const route of ['#/helpdesk/tickets', '#/helpdesk/ticket', '#/helpdesk/dashboard', '#/helpdesk/windows', '#/helpdesk/powershell', '#/helpdesk/active-directory', '#/helpdesk/directory',
    '#/helpdesk/credential-manager', '#/helpdesk/file-server', '#/helpdesk/knowledge-base', '#/helpdesk/m365-admin', '#/helpdesk/entra-admin', '#/helpdesk/intune', '#/helpdesk/phone']) assert.ok(allow.includes(route), route);
  coach.steps.slice(0, 22).forEach((step, index) => {
    if (step.route) assert.ok(allow.includes(step.route), `step ${index + 1} route ${step.route}`);
    assert.match(step.body, /Why: /, `step ${index + 1} why`);
    assert.match(step.body, /Success looks like/, `step ${index + 1} success`);
    assert.equal(typeof step.check, 'function', `step ${index + 1} has a check`);
  });
  coach.steps.forEach((step, index) => {
    // Graded-ticket words are checked, hashed, in tests/hdesk-m08-practice-tickets.test.js.
    assert.doesNotMatch(`${step.title} ${step.instruction} ${step.body}`, /Module 6|server VM|CompTIA/i, `step ${index + 1} wording`);
  });
  assert.doesNotMatch(coach.summary, /Module 6|server VM|CompTIA/i);
  const shown = coach.steps.map((step) => step.instruction).join('\n');
  for (const line of [LINES.getAdUser, LINES.cmdkey]) {
    assert.match(shown, new RegExp(`<details><summary>Show me the command</summary>[^]*?${line.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`), line);
  }
  assert.ok(coach.steps[22].finish, 'the last step is Finish');
  assert.match(coach.steps[22].finish.href, /coachComplete=hd-m06#\/program\/it-support\/module\/8$/);
}

// The coach opens each step's own route when the step starts. Drawing that
// screen on a fresh lab must never pass the step by itself.
function testOpeningAStepsScreenDoesNotPassIt() {
  const steps = startLab().coach('hd-m06').steps;
  steps.slice(0, 22).forEach((step, index) => {
    if (!step.route || typeof step.check !== 'function') return;
    const tab = startLab();
    tab.open(index < 10 ? A : B);
    tab.view(step.route.slice(2));
    assert.equal(tab.coach('hd-m06').steps[index].check(), false, `step ${index + 1} passes when the coach opens ${step.route}`);
  });
}

/* ------------------------------------------------------------ the extension */

const NOTE_EXT = 'Reported: Jordan Bell locked out again after an unlock this morning; payroll day.\nTried: verified Jordan by callback per KB-0024. Lockout details: last lockout source NS-LT-0117, his laptop. Credential Manager on NS-LT-0117 has no saved entry. Tier 2 view: scheduled task FinanceReportSync runs as NORTHSTAR\\jbell every 2 minutes with a stored password last changed 90 days ago.\nResult: not unlocked again; the source is a scheduled task, which is Tier 2 work (KB-0103).\nNext action: Desktop Support (Tier 2) to update the stored password on FinanceReportSync, then unlock jbell once and check it stays unlocked.';
const COMMENT_EXT = 'Hi Jordan, our desktop support team has your ticket now. Something on your laptop keeps trying an old password, which locks you out. They will fix that and then unlock you. I\'ll update you by 08:45, even if there is no news yet. – Riley';

function startExtension(opener) {
  const tab = sim(launchUrl('hd-m06-ext'), { opener });
  assert.equal(tab.run('hdState.ticketSet'), 'its-06-extension');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), ['HD-2101']);
  return tab;
}
function testExtension() {
  const opener = fakeOpener();
  const tab = startExtension(opener);
  const coach = tab.coach('hd-m06-ext');
  assert.equal(coach.module, 8);
  assert.equal(coach.completionToken, undefined, 'no completion token');
  assert.equal(coach.steps.length, 5, 'extension steps 1 to 4, then a last step');
  const id = 'HD-2101';
  tab.open(id);
  assert.equal(tab.run('hdM01Tier2()'), true);
  // extension step 1: triage P2.
  at(tab, 0, 'extension step 1 waits');
  tab.triage(id, 'Access', 'Account lockout', 'jbell', '2', '1');
  assert.equal(tab.ticket(id).priority, 'P2');
  at(tab, 1, 'extension step 1 done');
  // extension step 2: verify, Lockout details, the Tier 2 evidence card.
  tab.run("hdM01Identity('callback')");
  tab.run("hdOpenUser('u-1005'); hdAcctLockoutOpen('u-1005'); hdAcctTier2('u-1005')");
  assert.match(tab.pane(), /data-hd-lockout-source>NS-LT-0117</);
  at(tab, 1, 'extension step 2 waits for the evidence card');
  tab.run(`hdEvidenceOpen('${id}', 'task-scheduler-ns-lt-0117')`);
  assert.match(tab.open(id), /FinanceReportSync[\s\S]*NORTHSTAR\\jbell[\s\S]*Every 2 minutes[\s\S]*90 days ago/);
  // Credential Manager on NS-LT-0117 has no entry.
  tab.run("hdOpenMachineScreen('NS-LT-0117', 'credential-manager')");
  assert.match(tab.view('helpdesk/credential-manager'), /No Windows credentials are saved/);
  at(tab, 2, 'extension step 2 done');
  // The task's password is Tier 2's: Set-ScheduledTask is refused.
  tab.run("hdSelectComputer('NS-LT-0117')");
  const refused = tab.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell');
  assert.match(refused, /Tier 2 work \(KB-0103\)/);
  assert.doesNotMatch(refused, /Secure credential prompt/);
  assert.equal(tab.run('hdM01Task().credentialCurrent'), false, 'the task keeps its old password');
  // extension step 3: Desktop Support (Tier 2).
  tab.open(id);
  tab.run(`hdMatrixAssignGroup('${id}', 'Desktop Support (Tier 2)')`);
  at(tab, 2, 'extension step 3 waits for KB-0103');
  tab.kb(id, 'keeps locking', 'KB-0103');
  at(tab, 3, 'extension step 3 done');
  // extension step 4: KB-0103 attached, handoff note and a comment to Jordan.
  tab.attach(id, 'KB-0103');
  tab.note(id, NOTE_EXT);
  at(tab, 3, 'extension step 4 waits for the comment');
  tab.comment(id, COMMENT_EXT);
  at(tab, 4, 'at the last step');
  const feedback = tab.feedback(id);
  feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, []);
  // The last step sends nothing and carries no completion token.
  const last = coach.steps[4];
  assert.ok(last.finish);
  assert.doesNotMatch(last.finish.href, /coachComplete/);
  assert.match(last.finish.href, /#\/program\/it-support\/module\/8$/);
  tab.finish();
  assert.deepEqual(opener.sent, [], 'nothing is posted to the opener');
  // Every step's text, as in the lab.
  coach.steps.slice(0, 4).forEach((step, index) => {
    assert.match(step.body, /Why: /, `extension step ${index + 1} why`);
    assert.match(step.body, /Success looks like/, `extension step ${index + 1} success`);
  });
  coach.steps.forEach((step) => assert.doesNotMatch(`${step.title} ${step.instruction} ${step.body}`, /Module 6|server VM|CompTIA/i));
  // Not in the lab's ticket list.
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  assert.doesNotMatch(coaches, /'hd-m06-ext': \[/);
}

// HD-2101's template and the shared shift are as they were.
function testHd2101Unchanged() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const template = plain(tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2101')"));
  assert.ok(template, 'HD-2101 template exists');
  assert.equal('console' in template, false, 'no console key on the template');
  assert.equal(template.ownSet, undefined, 'not ownSet');
  assert.equal(tab.run("hdState.tickets.some((t) => t.id === 'HD-2101')"), true, 'the shared shift still has HD-2101');
  assert.equal(tab.run('hdM01Tier2()'), false, 'and keeps Module 1\'s fix path');
  // Only the extension set overrides it.
  const overriding = plain(tab.run("[...Object.entries(HD_PRACTICE_SETS), ...Object.entries(HD_COACHED_SETS)].filter(([, s]) => s.ticketOverrides && s.ticketOverrides['HD-2101']).map(([k]) => k)"));
  assert.deepEqual(overriding, ['its-06-extension']);
}

/* ------------------------------------------------------------ old tickets and runs */

function testOldTicketsLeaveTheQueue() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  for (const id of ['SR-2107', 'HD-2118']) {
    assert.equal(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === '${id}').ownSet`), true, `${id} is ownSet`);
    assert.equal(tab.run(`hdState.tickets.some((t) => t.id === '${id}')`), false, `${id} not in the shared shift`);
    assert.equal(tab.run(`[...Object.values(HD_PRACTICE_SETS), ...Object.values(HD_COACHED_SETS)].some((s) => s.tickets.includes('${id}'))`), false, `${id} in no set`);
  }
  assert.deepEqual(plain(tab.run("HD_COACHED_SETS['its-06-guided'].tickets")), [A, B, R]);
  assert.equal(tab.run("MODULE_COACHES.filter((c) => c.id === 'hd-m06').length"), 1, 'one hd-m06 coach');
}

// A saved run of the old hd-m06 (on another set) starts fresh; a run on the
// new set is kept.
function testOldCoachRunIsForgotten() {
  const local = store([['mnt.coach.resume', JSON.stringify({ id: 'hd-m06', step: 4, student: STUDENT })]]);
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m06', step: 4 })]]);
  sim(`${SIM_URL}#/helpdesk/tickets`, { local, session });
  assert.equal(local.getItem('mnt.coach.resume'), null, 'old resume dropped');
  assert.equal(session.getItem('mnt.coach.state'), null, 'old step dropped');
  const kept = store();
  const lab = startLab(null, kept);
  lab.open(A);
  lab.triage(A, 'Access', 'Account lockout', 'nwilliams', '3', '1');
  at(lab, 1, 'on Part A step 2');
  const again = sim(launchUrl('hd-m06', false), { local: kept, session: lab.session });
  assert.equal(again.run('hdState.ticketSet'), 'its-06-guided');
  assert.equal(again.coachStep(), 1, 'the new run resumes');
}

// The instructor sheet maps Lab 8.1 to the three records; an older attempt
// keeps SR-2107 and HD-2118 (tests/admin-sheets/hdesk.cases.js has the cases).
function testSheetMapping() {
  const source = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  assert.match(source, /'lab-its-06-identity-access': \['HD-2196', 'HD-2197', 'SR-2207'\]/);
  assert.match(source, /EARLIER_TICKETS_BY_LAB = \{[^}]*'lab-its-06-identity-access': \['SR-2107', 'HD-2118'\]/);
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m06': \['HD-2196', 'HD-2197', 'SR-2207'\]/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m08-guided-lab\.test\.js/);
}

// Every article "Check my work" asks the student to open or attach on a lab
// record is named in an instruction of the coach that walks it, so a student
// who follows the coach meets those checks too.
function testEveryArticleCheckIsInTheSteps() {
  const tab = startLab();
  const rules = (consoleBlock) => (consoleBlock.feedback || []).flatMap((area) => area.checks || []).flatMap((rule) => [rule.kb, rule.attached]).filter(Boolean);
  const lab = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ['${A}', '${B}', '${R}'].includes(t.id)).map((t) => t.console)`));
  const labText = tab.coach('hd-m06').steps.map((step) => step.instruction || '').join('\n');
  const labIds = [...new Set(lab.flatMap(rules))];
  assert.ok(labIds.length > 0, 'the lab asks for articles');
  labIds.forEach((id) => assert.ok(labText.includes(id), `hd-m06 names ${id}`));
  const ext = plain(tab.run("HD_COACHED_SETS['its-06-extension'].ticketOverrides['HD-2101'].console"));
  const extText = tab.coach('hd-m06-ext').steps.map((step) => step.instruction || '').join('\n');
  [...new Set(rules(ext))].forEach((id) => assert.ok(extText.includes(id), `hd-m06-ext names ${id}`));
}

const tests = [testLabOpensOnItsSet, testLab81, testTypedStepsAnyCase, testA3FromThePane, testA6NeedsTheTypedLine, testOptionalLinesPassTheirSteps, testGetAdUserMatchesThePane,
  testEveryStepText, testOpeningAStepsScreenDoesNotPassIt, testExtension, testHd2101Unchanged, testOldTicketsLeaveTheQueue, testOldCoachRunIsForgotten, testSheetMapping,
  testEveryArticleCheckIsInTheSteps, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m08-guided-lab: all ${tests.length} passed`);

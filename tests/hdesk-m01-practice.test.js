// HD-2101, Jordan Bell's repeating lockout, worked on the simulated machines
// (ui/helpdesk.js hdM01*). It was Module 1's Practice It (Lab 1.2) until
// 2026-11-09, when Guided Lab 1 became HD-2150 (tests/hdesk-m01-guided-lab.test.js).
// Its scenario stays for Module 8, so these tests run it in an ordinary
// Practice shift, with no coach:
//
//   - The ticket gives nothing away: the caller computer, the task and its
//     stale credential appear only once a tool screen or command shows them.
//   - Unlocking before the fix: the task's next run locks the account again
//     and logs a new 4740 with the same caller. The student can recover.
//   - Fixing first: unlock once, the next run is clean, verification counts.
//   - Two different valid orders both reach every outcome.
//   - Resolve needs every outcome.
//   - Work and machine state survive a reload.
//   - Typed commands are recorded in the Prove It event shape, with results.
//   - The Prove It (its-01) is unchanged by any of this.
//   - The portal no longer saves an HD-2101 Lab 1.2, but an attempt saved
//     before the change keeps its instructor sheet.
//
// The simulator runs in a Node vm with a small fake DOM and a clock the test
// moves; the portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const PORTAL = 'https://academy.test';
const SIM_URL = `${PORTAL}/sim/`;
// An ordinary Practice shift: every ticket, HD-2101's scenario included.
const launchUrl = () => `${SIM_URL}#/helpdesk/tickets`;
const MINUTE = 60000;

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', listeners,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; }, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
// One browser tab. `clock.now` is the time Date.now() returns inside it.
function sim(url, { local = store(), session = store(), clock = { now: Date.UTC(2026, 10, 3, 14) }, opener = null } = {}) {
  const u = new URL(url);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const messageListeners = new Set();
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''),
    querySelector: () => null, querySelectorAll: () => [],
  };
  class ClockDate extends Date { static now() { return clock.now; } }
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date: ClockDate, location, document,
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.pathname = n.pathname; location.search = n.search; location.hash = n.hash; } },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener, closed: false, close() { ctx.closed = true; }, focus() {}, confirm: () => true,
    addEventListener: (type, fn) => { if (type === 'message') messageListeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') messageListeners.delete(fn); },
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
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const tab = {
    ctx, location, toasts, local, session, clock, run, input,
    hd: () => run('hdState'),
    scenario: () => run('hdM01()'),
    outcomes: () => ({ ...run('hdM01Outcomes()') }),
    view: (route) => run(`VIEWS[${JSON.stringify(route)}]()`),
    ps: (command) => {
      input('hd-ps-input', command);
      run('hdRunPowerShell({ preventDefault() {} })');
      const rows = run('hdState.powershell');
      return rows[rows.length - 1].text;
    },
    filterEvents: (id, text = '') => { input('hd-ev-id', id); input('hd-ev-text', text); run('hdSetEventFilter({ preventDefault() {} })'); return tab.view('helpdesk/event-viewer'); },
    note: (text) => { input('hd-note-input', text); run("hdAddNote('HD-2101')"); },
    // As the page's timer does: a due run, then a save.
    wait: (ms) => { clock.now += ms; return run('(() => { const ran = hdM01Tick(); if (ran) hdSave(); return ran; })()'); },
    reload: () => sim(location.origin + location.pathname + location.search + location.hash, { local, session, clock, opener }),
  };
  return tab;
}

const COMPLETE_NOTE = 'Reported: Jordan Bell is locked out again a few minutes after every unlock.\nTried: verified Jordan by callback, found caller NS-LT-0117 in event 4740, FinanceReportSync stored the old password, Jordan updated it at the secure prompt, unlocked once.\nResult: the next task run succeeded, no new 4740, account stays unlocked.';
const lockouts = (tab) => Array.from(tab.run("hdEvents().filter((e) => e.id === '4740' && /jbell/.test(e.message))"), (e) => ({ ...e }));
const opened = (tab) => { tab.run("hdSelectTicket('HD-2101')"); return tab; };

/* --------------------------------------------- evidence only from the tools */

function testEvidenceHiddenUntilAToolShowsIt() {
  const tab = opened(sim(launchUrl()));
  const ticketHtml = tab.view('helpdesk/ticket');
  ['NS-LT-0117', 'FinanceReportSync', '90 days', 'Scheduled task', 'stored credential'].forEach((giveaway) =>
    assert.doesNotMatch(ticketHtml, new RegExp(giveaway, 'i'), `the ticket doesn't show ${giveaway}`));
  assert.doesNotMatch(ticketHtml, /Check diagnosis|hd-diagnosis-row|class="hd-path"|Expected resolution/, 'no checklist or diagnosis dropdown on HD-2101');
  assert.match(ticketHtml, /class="card hd-identity"/);
  assert.match(ticketHtml, /class="card hd-investigation"/);
  // The device list doesn't name the lockout source either.
  assert.doesNotMatch(tab.view('helpdesk/windows'), /Account lockout source/);

  // Event Viewer: listing everything isn't a finding; a 4740 / jbell filter is.
  assert.match(tab.view('helpdesk/event-viewer'), /id="hd-ev-id"/, 'Practice has the filter bar');
  assert.equal(tab.outcomes().sourceFound, false, 'an unfiltered list finds nothing');
  const filtered = tab.filterEvents('4740');
  assert.match(filtered, /caller computer NS-LT-0117/);
  assert.doesNotMatch(filtered, /PrintService|NETLOGON/, 'the filter applies');
  assert.equal(tab.outcomes().sourceFound, true);
  assert.deepEqual(Array.from(tab.scenario().sourceFoundVia), ['Event Viewer, event 4740']);

  // The shell: no task until connected to the caller computer.
  assert.match(tab.ps('Get-Help'), /Get-ScheduledTask/);
  assert.match(tab.ps('Get-Help'), /Set-ScheduledTask -TaskName <name> -User/);
  assert.doesNotMatch(tab.ps('Get-ScheduledTask'), /FinanceReportSync/, 'another computer has no such task');
  assert.match(tab.ps('Get-ScheduledTask -TaskName FinanceReportSync'), /No MSFT_ScheduledTask objects found/);
  assert.equal(tab.outcomes().taskInspected, false);
  assert.match(tab.ps('Enter-PSSession NS-LT-0117'), /Connected/);
  const detail = tab.ps('Get-ScheduledTask -TaskName FinanceReportSync');
  assert.match(detail, /Principal\.UserId\s+: NORTHSTAR\\jbell/);
  assert.match(detail, /Stored credential last changed : 90 days ago/);
  assert.match(detail, /LastRunTime\s+: 08:11:18/);
  assert.match(detail, /NextRunTime\s+: 08:14:00 \(in 2 minutes, simulated\)/, 'the next run shows on the machine');
  assert.equal(tab.outcomes().taskInspected, true);
}

// Active Directory's lockout details: the other way to the caller computer.
function testAdLockoutDetailsFindTheSource() {
  const tab = opened(sim(launchUrl()));
  const before = tab.view('helpdesk/active-directory');
  assert.match(before, /Lockout details/);
  assert.doesNotMatch(before, /NS-LT-0117/, 'the caller shows only once details are opened');
  tab.run('hdM01AdLockoutDetails()');
  const after = tab.view('helpdesk/active-directory');
  assert.match(after, /Locked out<\/dt><dd>Yes/);
  assert.match(after, /Lockouts today<\/dt><dd>2/);
  assert.match(after, /Last lockout source<\/dt><dd>NS-LT-0117/);
  assert.deepEqual(Array.from(tab.scenario().sourceFoundVia), ['Active Directory lockout details']);
}

/* ------------------------------------------------------ caller verification */

function testCallerVerification() {
  const tab = opened(sim(launchUrl()));
  // No account action before the caller is verified.
  assert.match(tab.ps('Unlock-ADAccount jbell'), /verify Jordan's identity/);
  assert.equal(tab.scenario().locked, true);

  tab.run("hdM01Identity('password')");
  let html = tab.view('helpdesk/ticket');
  assert.match(html, /Serious mistake\.<\/strong> The help desk never asks for a password/);
  assert.equal(tab.outcomes().identityVerified, false);
  tab.run("hdM01Identity('name')");
  assert.match(tab.view('helpdesk/ticket'), /Not enough\./);
  tab.run("hdM01Identity('callback')");
  html = tab.view('helpdesk/ticket');
  assert.match(html, /Verified\.<\/strong> You called Jordan back on ext\. 4417/);
  assert.doesNotMatch(html, /hd-identity-options/, 'answered once verified');
  assert.equal(tab.outcomes().identityVerified, true);
  assert.deepEqual(Array.from(tab.scenario().identityTries), ['password', 'name', 'callback'], 'every try is kept for the instructor');
  // KB-0024 spells out the callback method and the password rule.
  const kb = tab.view('helpdesk/knowledge-base');
  assert.match(kb, /call them back on the phone number in the User Directory/);
  assert.match(kb, /Never ask for, type or write down a user/);
  assert.match(kb, /6\. Tier 2 only: find the lockout source/, 'the 4740 and task steps stay, for Tier 2');
  assert.match(tab.view('helpdesk/directory'), /<th>Phone<\/th>/);
  assert.match(tab.view('helpdesk/directory'), /ext\. 4417/);
}

/* ---------------------------------------------------------------- the break */

function testUnlockBeforeFixRelocksAndLogsANew4740() {
  const tab = opened(sim(launchUrl()));
  tab.run("hdM01Identity('callback')");
  tab.run("hdState.selectedUserId = 'u-1005'; hdAdAction('unlock')");
  assert.equal(tab.scenario().locked, false, 'unlocked');
  assert.equal(tab.run("hdUserById('u-1005').locked"), false, 'Active Directory shows it unlocked');
  const before = lockouts(tab).length;

  // Not yet: the next run is 2 minutes after the scenario started.
  assert.equal(tab.wait(MINUTE), null);
  assert.equal(tab.scenario().locked, false);
  const runResult = tab.wait(MINUTE);
  assert.equal(runResult.relocked, true, 'the task ran on its schedule');
  assert.equal(tab.scenario().locked, true, 'locked again');
  assert.equal(tab.run("hdUserById('u-1005').locked"), true);
  const after = lockouts(tab);
  assert.equal(after.length, before + 1, 'a new 4740');
  assert.equal(after[0].caller, 'NS-LT-0117', 'same caller computer');
  assert.equal(after[0].time, '08:14:00');
  const message = tab.toasts.at(-1);
  assert.match(message, /locked again at 08:14:00/);
  assert.match(message, /event 4740 on NS-DC01 names caller computer NS-LT-0117/);
  assert.doesNotMatch(message, /Set-ScheduledTask|schtasks|password|FinanceReportSync/i, 'the message names the cause, not the fix');
  assert.equal(tab.outcomes().unlockedAfterFix, false);

  // Recovery: fix, unlock once, a clean run.
  tab.ps('Enter-PSSession NS-LT-0117');
  tab.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell');
  assert.match(tab.ps('Unlock-ADAccount -Identity jbell'), /^$/);
  tab.ps('Start-ScheduledTask -TaskName FinanceReportSync');
  assert.equal(tab.scenario().locked, false, 'stays unlocked after the fix');
  assert.equal(lockouts(tab).length, before + 1, 'no further 4740');
  assert.equal(tab.scenario().relocks, 1);
  assert.equal(tab.outcomes().unlockedAfterFix, true);
}

/* ------------------------------------------------------------ fix, then unlock */

function testFixThenUnlockStaysUnlocked() {
  const tab = opened(sim(launchUrl()));
  tab.run("hdM01Identity('callback')");
  tab.ps('Enter-PSSession -ComputerName NS-LT-0117');
  // A typed password is refused, never echoed and never recorded.
  const refused = tab.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell -Password Summer2026!');
  assert.match(refused, /never type a user's password/);
  assert.equal(tab.outcomes().credentialFixed, false);
  assert.equal(tab.scenario().passwordTyped, true);
  assert.ok(!JSON.stringify(tab.hd()).includes('Summer2026'), 'the typed password is nowhere in the saved state');
  // Every other way the shells take a password is refused the same way.
  for (const typed of [
    'Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell -Password:Autumn2026a',
    'Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell -Password: "Autumn2026b"',
    'Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell -Pass Autumn2026c',
    'schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell /RP:Autumn2026d',
    'schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell /rp Autumn2026e',
    // Commands the shell doesn't support repeat what was typed; refused first.
    'Get-Service -Password Autumn2026f',
    'Get-ChildItem -Path C:\\Temp -Password:Autumn2026g',
    // Escaped quotes inside the value: nothing after the quote survives.
    'Get-Service -Password "Autumn`"TailA1"',
    "Get-Service -Password 'Autumn''TailB2'",
  ]) {
    assert.match(tab.ps(typed), /never type a user's password/, typed);
    assert.equal(tab.outcomes().credentialFixed, false, typed);
  }
  assert.ok(!/Autumn|Tail[AB]/.test(JSON.stringify(tab.hd())), 'no form or part of a typed password is in the saved state');
  // -Path, -TaskPath and /RU are not passwords: neither refused nor masked.
  for (const allowed of [
    'Get-ChildItem -Path C:\\Temp',
    'Set-ScheduledTask -TaskName FinanceReportSync -TaskPath \\Northstar\\Finance\\ -User NORTHSTAR\\jbell',
    'schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell',
  ]) {
    assert.equal(tab.run(`hdHasPasswordArg(${JSON.stringify(allowed)})`), false, allowed);
    assert.equal(tab.run(`hdRedactCommand(${JSON.stringify(allowed)})`), allowed, allowed);
  }

  const fixed = tab.ps('schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell');
  assert.match(fixed, /SUCCESS: The parameters of scheduled task "FinanceReportSync" have been changed\./);
  assert.match(fixed, /You never see, type or record it\./);
  assert.match(fixed, /should really run under a service account.*Tier 2 change/s, 'the Practice tip');
  assert.equal(tab.outcomes().credentialFixed, true);
  assert.equal(tab.scenario().fixedBy, 'schtasks /Change');
  assert.ok(tab.hd().practiceLog.some((e) => e.command === 'schtasks /Change /TN FinanceReportSync /RU NORTHSTAR\\jbell'), '/RU is recorded as typed');

  tab.run("hdState.selectedUserId = 'u-1005'; hdAdAction('unlock')");
  assert.equal(tab.outcomes().unlockedAfterFix, true);
  const before = lockouts(tab).length;
  // Checking before the next run doesn't verify anything yet.
  tab.filterEvents('', 'jbell');
  assert.equal(tab.outcomes().verified, false, 'no clean run yet');
  const runResult = tab.wait(2 * MINUTE);
  assert.equal(runResult.result, '0x0');
  assert.equal(tab.scenario().locked, false);
  assert.equal(lockouts(tab).length, before, 'no new 4740');
  assert.match(tab.ps('Get-ScheduledTaskInfo FinanceReportSync'), /LastTaskResult\s+: 0x0/);
  assert.equal(tab.outcomes().verified, false, 'the task result alone is not the lockout check');
  assert.match(tab.ps('Get-ADUser jbell -Properties LockedOut'), /LockedOut\s+: False/);
  assert.equal(tab.outcomes().verified, true);
  assert.equal(tab.scenario().verifiedBy, 'Get-ADUser LockedOut');
}

/* ------------------------------------------- two valid orders, one Finish */

// Event Viewer, Set-ScheduledTask, unlock in AD, wait for the schedule, verify in Event Viewer.
function pathA(tab) {
  tab.run("hdM01Identity('callback')");
  tab.filterEvents('4740', 'jbell');
  tab.ps('Enter-PSSession NS-LT-0117'); tab.ps('Get-ScheduledTask');
  tab.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell');
  tab.run("hdState.selectedUserId = 'u-1005'; hdAdAction('unlock')");
  tab.wait(2 * MINUTE); tab.filterEvents('4740');
}
// Shell first, AD lockout details, unlock before the fix (and re-lock),
// schtasks to fix, Unlock-ADAccount, Start-ScheduledTask, Search-ADAccount;
// the caller is verified only after the evidence was gathered.
function pathB(tab) {
  tab.ps('Get-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4740}');
  tab.run('hdM01AdLockoutDetails()');
  tab.ps('Enter-PSSession NS-LT-0117');
  tab.ps('schtasks /Query /TN FinanceReportSync /V /FO LIST');
  tab.run("hdM01Identity('callback')");
  tab.ps('Unlock-ADAccount jbell');
  tab.ps('Start-ScheduledTask FinanceReportSync');
  assert.equal(tab.scenario().locked, true, 'path B re-locked by unlocking first');
  tab.ps('schtasks /Change /TN "\\Northstar\\Finance\\FinanceReportSync" /RU NORTHSTAR\\jbell');
  tab.ps('Unlock-ADAccount jbell');
  tab.ps('Start-ScheduledTask FinanceReportSync');
  tab.ps('Search-ADAccount -LockedOut');
}
// HD-2101's work as the hd-m01 coach used to send it (before 2026-11-09).
function workOf(tab) {
  const ticket = tab.hd().tickets.find((t) => t.id === 'HD-2101');
  return JSON.parse(JSON.stringify({
    version: 1, selectedTicketId: 'HD-2101', investigation: tab.run('hdM01Investigation()'),
    tickets: [{ id: 'HD-2101', requester: ticket.requester, category: ticket.category, subcategory: ticket.subcategory, description: ticket.description,
      priority: ticket.priority, assignedTechnician: ticket.assignedTechnician, status: ticket.status, expectedStatus: 'Resolved',
      notes: ticket.notes, statusHistory: ticket.troubleshootingHistory.map((e) => ({ time: e.time, action: e.action })), resolution: ticket.resolution, closureCode: ticket.closureCode }],
  }));
}
function closeOut(tab) {
  tab.run("hdSelectTicket('HD-2101')");
  tab.note(COMPLETE_NOTE);
  tab.run("hdResolveTicket('HD-2101')");
}

function testTwoValidOrdersBothComplete() {
  const results = [pathA, pathB].map((path) => {
    const tab = opened(sim(launchUrl()));
    path(tab);
    closeOut(tab);
    const outcomes = tab.outcomes();
    assert.ok(Object.values(outcomes).every(Boolean), `${path.name}: every outcome met ${JSON.stringify(outcomes)}`);
    assert.equal(tab.hd().tickets.find((t) => t.id === 'HD-2101').status, 'Resolved');
    return workOf(tab);
  });
  const [a, b] = results.map((work) => work.investigation);
  assert.deepEqual(a.outcomes, b.outcomes, 'equivalent outcomes from different orders');
  assert.deepEqual(a.sourceFoundVia, ['Event Viewer, event 4740']);
  assert.deepEqual(b.sourceFoundVia, ['PowerShell Get-WinEvent, event 4740', 'Active Directory lockout details']);
  assert.equal(a.relocks, 0);
  assert.equal(b.relocks, 1);
  assert.equal(b.credentialFixedBy, 'schtasks /Change');
  // The student's note is the resolution, credited to the student's technician.
  const ticket = results[0].tickets.find((t) => t.id === 'HD-2101');
  assert.equal(ticket.resolution, COMPLETE_NOTE);
  assert.equal(ticket.notes.at(-1).author, 'Riley Morgan');
  // Typed commands in the Prove It event shape, with key results.
  const commands = b.events.filter((e) => e.type === 'command_run');
  assert.ok(commands.length >= 9);
  commands.forEach((e) => { assert.equal(typeof e.at, 'string'); assert.equal(typeof e.command, 'string'); assert.equal(typeof e.computer, 'string'); assert.equal(typeof e.result, 'string'); });
  const query = commands.find((e) => /schtasks \/Query/.test(e.command));
  assert.equal(query.computer, 'NS-LT-0117');
  assert.match(query.result, /FinanceReportSync on NS-LT-0117 runs as NORTHSTAR\\jbell/);
  assert.ok(b.events.some((e) => e.type === 'task_run' && e.relocked === true), 'the re-lock is in the log');
}

/* ---------------------------------------------------- Finish and the save */

function testResolveNeedsEveryOutcome() {
  const tab = opened(sim(launchUrl()));
  pathA(tab);
  tab.run("hdSelectTicket('HD-2101')");
  // A note without the three parts: feedback.
  tab.note('Fixed it.');
  assert.match(tab.toasts.at(-1), /Still missing: Reported, Tried, Result/);
  // Resolve refuses and says what is missing.
  tab.run("hdResolveTicket('HD-2101')");
  assert.match(tab.toasts.at(-1), /Add a work note with three parts/);
  assert.notEqual(tab.hd().tickets.find((t) => t.id === 'HD-2101').status, 'Resolved');
  tab.note(COMPLETE_NOTE);
  tab.run("hdResolveTicket('HD-2101')");
  assert.equal(tab.hd().tickets.find((t) => t.id === 'HD-2101').status, 'Resolved');

  // A ticket resolved early (before the investigation) is refused too.
  const early = opened(sim(launchUrl()));
  early.run("hdResolveTicket('HD-2101')");
  assert.match(early.toasts.at(-1), /Verify the caller first/);
}

/* --------------------------------------------------------------- reload */

function testStateSurvivesAReload() {
  const tab = opened(sim(launchUrl()));
  tab.run("hdM01Identity('callback')");
  tab.filterEvents('4740');
  tab.ps('Enter-PSSession NS-LT-0117'); tab.ps('Get-ScheduledTask -TaskName FinanceReportSync');
  tab.ps('Unlock-ADAccount jbell');
  tab.wait(2 * MINUTE); // re-locked

  const reloaded = tab.reload();
  const scenario = reloaded.scenario();
  assert.equal(scenario.locked, true);
  assert.equal(scenario.relocks, 1);
  assert.equal(scenario.identity, 'callback');
  assert.equal(scenario.taskInspected, true);
  assert.equal(lockouts(reloaded).length, 3, 'the new 4740 is still there');
  assert.equal(reloaded.hd().selectedComputer, 'NS-LT-0117', 'still connected to the caller computer');
  assert.equal(reloaded.run("hdM01Task().credentialCurrent"), false);
  assert.ok(reloaded.hd().practiceLog.some((e) => e.type === 'command_run' && /Unlock-ADAccount/.test(e.command)), 'the command log too');
  assert.equal(reloaded.hd().eventFilter.id, '4740');
  // The schedule carries on from the saved time.
  reloaded.ps('Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell');
  reloaded.ps('Unlock-ADAccount jbell');
  reloaded.wait(2 * MINUTE);
  assert.equal(reloaded.scenario().locked, false);
  // A Practice save from before this scenario existed gets one on load.
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('delete hdState.scenarios; delete hdState.machines; delete hdState.practiceLog; hdSave()');
  const upgraded = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  assert.equal(upgraded.scenario().locked, true);
  assert.equal(upgraded.run("hdMachine('NS-LT-0117').scheduledTasks.length"), 3);
}

/* -------------------------------------------- Prove It is left unchanged */

function testProveItUnchanged() {
  const tab = sim(`${SIM_URL}?prove=its-01&student=student-prove001#/helpdesk/tickets`);
  assert.equal(tab.run('hdState.scenarios'), undefined, 'no Practice scenario in a Prove shift');
  assert.equal(tab.run('hdM01()'), null);
  assert.doesNotMatch(tab.ps('Get-Help'), /ScheduledTask|Enter-PSSession|Unlock-ADAccount/);
  assert.match(tab.ps('Get-ScheduledTask'), /outside this training shell/);
  assert.ok(tab.run("hdEvents().some((e) => e.id === '4740' && e.message.includes('NS-LT-0117'))"), 'the shared event list as before');
  assert.doesNotMatch(tab.view('helpdesk/event-viewer'), /hd-ev-id/, 'no filter bar');
  // The directory shows the caller-check details in Prove too (phone on file and employee ID).
  assert.match(tab.view('helpdesk/directory'), /<th>Employee ID<\/th><th>Department<\/th><th>Phone<\/th>/);
  assert.match(tab.ps('Get-Printer'), /Microsoft Print to PDF/, 'the Prove machine still answers');
  assert.ok(!tab.run('hdState.practiceLog'), 'no Practice log');
}

/* ------------------------------------------------------- the portal side */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const LAB12 = 'lab-its-01-ticket-triage';
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const hdUser = () => ({
  userId: 'user-m01p', email: 'm01p@test.invalid', trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
});
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const inserts = () => portal.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && c.payload.lab_key === LAB12);

// A finished HD-2101 lab's work, as the hd-m01 coach sent it before 2026-11-09.
function finishedWork() {
  const tab = opened(sim(launchUrl()));
  pathA(tab); closeOut(tab);
  return workOf(tab);
}

// Lab 1.2 is HD-2150 now: a finished HD-2101 from an old tab isn't saved.
async function testPortalNoLongerSavesHd2101() {
  const user = hdUser();
  signedIn = user;
  portal.localStorage.clear();
  portal.supabaseCalls.length = 0;
  const student = prun('LabRuntime').anonymousStudentId(user);
  const lab = prun("MODULE_LABS['it-support/1']");
  lab.view(user, HD);
  const send = async (work) => {
    const replies = [];
    await lab.onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m01', nonce: 'n-1', student, work }, origin: SIM, source: { postMessage: (data) => replies.push(JSON.parse(JSON.stringify(data))) } });
    await settle();
    return replies;
  };

  const replies = await send(finishedWork());
  assert.deepEqual(replies, [{ type: 'mnt-coach-received', id: 'hd-m01', nonce: 'n-1', saved: false, reason: 'incomplete' }]);
  assert.equal(inserts().length, 0, 'nothing saved');
}

function testPortalKeepsOnlyKnownInvestigationFields() {
  const work = finishedWork();
  work.investigation.secret = 'x';
  work.investigation.events.push({ type: 'answer_key', command: 'leak' }, { type: 'command_run', command: 'y'.repeat(5000), computer: 'NS-LT-0117', extra: 'drop me' });
  work.investigation.outcomes.verified = 'yes';
  const clean = prun('itsCleanCoachWork')(work);
  assert.equal(clean.investigation.secret, undefined);
  assert.ok(!clean.investigation.events.some((e) => e.type === 'answer_key'));
  const long = clean.investigation.events.at(-1);
  assert.equal(long.command.length, 200);
  assert.equal(long.extra, undefined);
  assert.equal(clean.investigation.outcomes.verified, false, 'only true counts');
  assert.equal(prun('itsCleanCoachWork')({ ...work, investigation: { version: 1, ticketId: 'HD-9999' } }).investigation, undefined, 'another ticket\'s block is dropped');
  // Oversized work: the oldest events go first; it stays under the limit.
  const big = finishedWork();
  big.investigation.events = Array.from({ length: 80 }, (_, i) => ({ type: 'command_run', at: String(i), command: 'z'.repeat(200), computer: 'NS-LT-0117', result: 'r'.repeat(200) }));
  big.tickets[0].notes = Array.from({ length: 8 }, () => ({ author: 'Riley Morgan', time: '1', text: 'n'.repeat(1500) }));
  const trimmed = prun('itsCleanCoachWork')(big);
  assert.ok(JSON.stringify(trimmed).length <= 48 * 1024);
}

/* ---------------------------------------------------- the instructor sheet */

// An attempt saved before 2026-11-09 holds HD-2101 and keeps its sheet.
function testInstructorSheetShowsTheInvestigation() {
  const work = prun('itsCleanCoachWork')(finishedWork());
  const sheet = prun('AdminSubmissionSheet');
  const row = { id: 'm01p-1', lab_key: LAB12, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-03T15:00:00Z', result: { source: 'mnt-coach-complete', work } };
  const built = sheet.evaluate(row);
  const ids = built.sections.map((section) => section.id);
  assert.ok(ids.includes('investigation-hd-2101') && ids.includes('commands-hd-2101'));
  assert.ok(!ids.includes('troubleshooting-hd-2101') && !ids.includes('diagnosis-hd-2101'), 'no checklist or diagnosis checks for HD-2101');
  assert.equal(built.sections.find((s) => s.id === 'investigation-hd-2101').status, 'pass');
  const html = sheet.render(row);
  assert.match(html, /Set-ScheduledTask -TaskName FinanceReportSync -User NORTHSTAR\\jbell → stored credential/);
  assert.match(html, /Student work note ·/);
  assert.match(html, /Reported: Jordan Bell is locked out again/);
  // A learner who asked for the password and unlocked first: shown, flagged.
  const rough = JSON.parse(JSON.stringify(work));
  rough.investigation.identity.tries = ['password', 'callback'];
  const roughRow = { ...row, id: 'm01p-2', result: { ...row.result, work: rough } };
  const check = sheet.evaluate(roughRow).sections.find((s) => s.id === 'investigation-hd-2101');
  assert.notEqual(check.status, 'pass', 'asking for the password is flagged');
  assert.match(sheet.render(roughRow), /Asked for the password → Callback on the User Directory number/);
  // A password written in a ticket field: a flag beside the shell row, never a verdict change.
  assert.match(html, /Password in a ticket field[\s\S]{0,200}Did not/);
  const wrote = JSON.parse(JSON.stringify(work));
  wrote.investigation.passwordWritten = true;
  const wroteRow = { ...row, id: 'm01p-3', result: { ...row.result, work: prun('itsCleanCoachWork')(wrote) } };
  assert.equal(sheet.evaluate(wroteRow).sections.find((s) => s.id === 'investigation-hd-2101').status, 'pass', 'flag only: the verdict is unchanged');
  assert.match(sheet.render(wroteRow), /Wrote a password in a ticket field \(refused, not recorded\)/);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [
    testEvidenceHiddenUntilAToolShowsIt, testAdLockoutDetailsFindTheSource, testCallerVerification,
    testUnlockBeforeFixRelocksAndLogsANew4740, testFixThenUnlockStaysUnlocked, testTwoValidOrdersBothComplete,
    testResolveNeedsEveryOutcome, testStateSurvivesAReload, testProveItUnchanged,
    testPortalNoLongerSavesHd2101, testPortalKeepsOnlyKnownInvestigationFields, testInstructorSheetShowsTheInvestigation,
  ];
  for (const test of tests) await test();
  console.log(`hdesk-m01-practice: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

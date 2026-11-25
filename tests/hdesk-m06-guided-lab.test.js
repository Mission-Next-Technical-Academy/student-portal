'use strict';
// Help Desk Module 6 (key its-07) Practice It, Lab 6.1 (ui/helpdesk-coaches.js
// "hd-m07"): the endpoint check on HD-2176 (INC0010486), coached set
// its-07-guided, on NS-WS-0233.
//
//   - The coach walks the triage step and all eleven steps of spec section 8.2
//     through ui/coach.js. Each step waits for real console state: a typed
//     command the console accepted, a screen opened, a caller answer, a
//     machine change. Never a tick box.
//   - The five winget lines pass from the command history in any letter case,
//     with extra valid options. A winget line the console refused doesn't.
//   - The optional Defender lines pass steps 6 and 7, as the screens do.
//   - Typed commands sit behind "Show me the command".
//   - Turning off real-time protection or adding an exclusion is undone at
//     once, with the coach line.
//   - A wrong answer to Leah's admin-password request is feedback, and the
//     step stays open.
//   - The finish message carries work the portal saves; the instructor sheet
//     maps Lab 6.1 to HD-2176, with no failed rows for a perfect lab.
//   - A saved run of the old hd-m07 (HD-2119) starts fresh; HD-2119 to
//     HD-2123 stay in the shared shift with their correlation card.
//   - Nothing from the graded Prove It ticket is in a committed Help Desk file
//     (kept here as short hashes only), and no lab or practice fixture has an
//     allowed protection item.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m05-guided-lab.test.js does. Synthetic data only.
const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
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
const STUDENT = 'student-m06g0001';
const launchUrl = (restart = true, student = STUDENT) => `${SIM_URL}?coach=hd-m07${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const LEAH = 'HD-2176';
const PC = 'NS-WS-0233';
const UNDO_LINE = 'Never turn off protection or add an exclusion to make a problem go away. In a graded ticket this is a critical error.';

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
    lastToast: () => toasts[toasts.length - 1] || '',
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    ask: (id, ...qs) => qs.forEach((q) => run(`hdChatAsk(${j(id)}, ${j(q)})`)),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); },
    search: (query) => plain(run(`hdKbSearchArticles(${j(query)}, hdKbArticles()).map((a) => a.id)`)),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    resolve: (id, notes) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, 'Solution provided')`);
      input('hd-resolution-notes', notes);
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    machine: (name) => plain(run(`hdState.machines[${j(name)}]`)),
    actions: (id) => plain(run(`hdConsoleState(hdTicketById(${j(id)})).actions.map((a) => a.id)`)),
    screen: (computer, screen, extra) => { run(`hdOpenMachineScreen(${j(computer)}, ${j(screen)}, ${j(extra || {})})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    tab: (computer, screen, tabId) => { run(`hdWinScreenTab(${j(computer)}, ${j(screen)}, ${j(tabId)})`); return run(`VIEWS['helpdesk/${screen}']()`); },
    desktop: () => run("VIEWS['helpdesk/windows']()"),
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

// The spec's model work note (section 8.2, step 11), in shorter sentences
// (the sheet's proofreading check flags a sentence over 40 words).
const NOTE = 'Reported: needs Notepad++ today; Teams keeps freezing; one OneDrive file has a red X.\nTried: installed Notepad++ with winget and removed it when she had finished. Updated 7-Zip. Repaired Teams. Real-time protection on and definitions current; quick scan found nothing and the protection history is empty. Removed the Weather Now Tab extension, which isn\'t on the approved list (KB-0080). Declined an admin password for FreeVideoConverter.exe per KB-0058 and opened a software request. Renamed "Budget: Q4?.xlsx" to "Budget - Q4.xlsx".\nResult: Teams opens; OneDrive shows a green tick and the file is on OneDrive on the web; Leah confirmed.';

function startLab(opener) {
  const tab = sim(launchUrl(), { opener });
  assert.equal(tab.run('hdState.ticketSet'), 'its-07-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [LEAH]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T10:30:00.000Z');
  return tab;
}
function triage(tab) {
  assert.match(tab.open(LEAH), /data-hd-machines/);
  tab.triage(LEAH, 'Software', 'Endpoint check', PC, '3', '2');
  assert.equal(tab.ticket(LEAH).priority, 'P4');
  tab.run(`hdAssignTicket('${LEAH}')`);
  assert.equal(tab.ticket(LEAH).assignedTechnician, 'Riley Morgan');
  tab.run(`hdSelectComputer('${PC}')`);
}
// Steps 1 to 4: the five winget lines, typed.
function wingetSteps(tab, lines) {
  tab.ps(lines[0]);
  at(tab, 1, '1 waits for the install');
  assert.match(tab.ps(lines[1]), /Successfully installed/);
  assert.ok(tab.machine(PC).installedApps.some((a) => a.name === 'Notepad++'), 'Notepad++ in Installed apps');
  at(tab, 2, '1 done');
  assert.match(tab.ps(lines[2]), /7-Zip\s+7zip\.7zip\s+23\.01\s+24\.08/);
  at(tab, 3, '2 done');
  tab.ps(lines[3]);
  assert.doesNotMatch(tab.ps('winget upgrade'), /7zip/, '7-Zip no longer listed');
  at(tab, 4, '3 done');
  tab.ps(lines[4]);
  assert.ok(!tab.machine(PC).installedApps.some((a) => a.name === 'Notepad++'), 'Notepad++ gone');
  at(tab, 5, '4 done');
}
const WINGET = ['winget search notepad++', 'winget install --id Notepad++.Notepad++ -e', 'winget upgrade', 'winget upgrade --id 7zip.7zip -e', 'winget uninstall --id Notepad++.Notepad++ -e'];

/* ------------------------------------------------------------ the walk */

function testLab61() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  const coach = tab.coach('hd-m07');
  assert.equal(coach.steps.length, 13, 'triage, eleven steps, then Finish');
  assert.equal(coach.module, 6);
  at(tab, 0, 'triage waits');
  triage(tab);
  at(tab, 1, 'triage done');
  wingetSteps(tab, WINGET);
  // 5: repair Teams, then Leah confirms. The choice card waits for the repair.
  assert.doesNotMatch(tab.open(LEAH), /data-hd-choice-card/, 'the admin-password request waits for the repair');
  tab.ask(LEAH, 'teams');
  assert.match(tab.open(LEAH), /It froze again just now/);
  let html = tab.screen(PC, 'settings-apps');
  assert.match(html, /data-hd-app-options="Microsoft Teams"/);
  tab.run(`hdWinAppOptions('${PC}', 'Microsoft Teams')`);
  tab.run(`hdWinRepairApp('${PC}', 'Microsoft Teams', 'repair')`);
  at(tab, 5, '5 waits for Leah');
  tab.ask(LEAH, 'teams');
  assert.match(tab.open(LEAH), /it opens straight away now/);
  at(tab, 6, '5 done');
  // 6: Windows Security › Virus & threat protection. Turning protection off is undone.
  tab.screen(PC, 'windows-security');
  html = tab.tab(PC, 'windows-security', 'virus-threat');
  assert.match(html, /data-hd-realtime="on"/);
  assert.match(html, /Last updated: Today 07:42/);
  tab.run(`hdWinRealtimeSet('${PC}', false)`);
  assert.equal(tab.machine(PC).protection.realtime, true, 'turned back on at once');
  assert.equal(tab.lastToast(), UNDO_LINE);
  assert.match(tab.view('helpdesk/windows-security'), /data-hd-unsafe-undone>Never turn off protection/);
  at(tab, 7, '6 done');
  // 7: a quick scan finds nothing; Protection history is empty.
  tab.run(`hdWinScanNow('${PC}')`);
  assert.match(tab.view('helpdesk/windows-security'), /No current threats\./);
  at(tab, 7, '7 waits for Protection history');
  html = tab.tab(PC, 'windows-security', 'protection-history');
  assert.match(html, /data-hd-history-empty/);
  at(tab, 8, '7 done');
  // 8: KB-0080, then remove Weather Now Tab; the two approved remain.
  assert.ok(tab.search('extension').includes('KB-0080'));
  tab.kb(LEAH, 'extension', 'KB-0080');
  html = tab.screen(PC, 'browser-extensions');
  assert.equal((html.match(/data-hd-extension="/g) || []).length, 3);
  assert.doesNotMatch(html, /data-hd-home-page/, 'no home page in the lab');
  tab.run(`hdWinRemoveExtension('${PC}', 'Weather Now Tab')`);
  assert.deepEqual(tab.machine(PC).extensions.map((x) => x.name), ['Microsoft Single Sign On', 'Northstar Password Manager']);
  at(tab, 9, '8 done');
  // 9: the admin password. A wrong pick is feedback; the step stays open.
  html = tab.open(LEAH);
  assert.match(html, /data-hd-choice-card/);
  assert.match(html, /FreeVideoConverter\.exe/);
  tab.run(`hdChoose('${LEAH}', 'type-password')`);
  assert.match(tab.open(LEAH), /data-hd-choice-feedback="type-password">Critical error\./);
  at(tab, 9, '9 stays open after a wrong pick');
  tab.run(`hdChoose('${LEAH}', 'decline-request')`);
  at(tab, 9, '9 waits for KB-0058');
  assert.ok(tab.search('admin').includes('KB-0058'), '"admin" finds KB-0058');
  tab.kb(LEAH, 'admin', 'KB-0058');
  at(tab, 10, '9 done');
  // 10: OneDrive. Rename the file; green tick; the file is on the web.
  html = tab.screen(PC, 'onedrive');
  assert.match(html, /data-hd-onedrive-icon="error"/);
  html = tab.tab(PC, 'onedrive', 'sync-problems');
  assert.match(html, /Budget: Q4\?\.xlsx/);
  assert.match(html, /The name contains characters that aren't allowed/);
  tab.run(`hdWinOneDriveRename('${PC}', 0, 'file', 'Budget - Q4.xlsx')`);
  assert.match(tab.view('helpdesk/onedrive'), /data-hd-onedrive-icon="synced"/);
  at(tab, 10, '10 waits for OneDrive on the web');
  html = tab.tab(PC, 'onedrive', 'web');
  assert.match(html, /data-hd-web-file="Budget - Q4\.xlsx"/);
  at(tab, 11, '10 done');
  // 11: the note, the code, Resolved.
  tab.note(LEAH, NOTE);
  at(tab, 11, '11 waits for Resolved');
  tab.resolve(LEAH, 'Endpoint check done; Teams and OneDrive fixed.');
  assert.equal(tab.ticket(LEAH).status, 'Resolved');
  at(tab, 12, 'at Finish');
  // Every "Check my work" area is met. The wrong pick is the one critical entry.
  const feedback = tab.feedback(LEAH);
  feedback.areas.forEach((area) => assert.ok(area.ok, `${LEAH} ${area.area}: ${area.text}`));
  assert.equal(feedback.critical.length, 1, 'the wrong admin-password pick is shown as feedback');
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m07');
  assert.deepEqual(done.data.work.tickets.map((t) => t.id), [LEAH]);
  return done.data.work;
}

// Any letter case and extra valid options pass the typed steps.
function testTypedStepsAnyCase() {
  const tab = startLab();
  triage(tab);
  at(tab, 1, 'at step 1');
  wingetSteps(tab, ['WINGET SEARCH Notepad++', 'winget.exe install --id notepad++.notepad++ --exact --accept-package-agreements', 'Winget Upgrade', 'winget upgrade --id 7ZIP.7ZIP -e --silent', 'winget uninstall --id NOTEPAD++.NOTEPAD++ -e']);
}

// A winget line the console refused never passes its step.
function testRefusedWingetDoesNotPass() {
  const tab = startLab();
  triage(tab);
  const steps = tab.coach('hd-m07').steps;
  assert.match(tab.ps('winget serch notepad++'), /Unrecognized command/);
  assert.match(tab.ps('winget install --id Notepad -e'), /No package found/);
  assert.match(tab.ps('winget search freevideoconverter'), /No package found matching input criteria\.\nApps outside the Software Catalog need a software request\./);
  assert.equal(steps[1].check(), false, 'misspelled or not found');
  assert.match(tab.ps('winget uninstall --id Notepad++.Notepad++ -e'), /No installed package found/);
  assert.equal(steps[4].check(), false, 'nothing to uninstall yet');
  tab.ps('winget search notepad++');
  tab.ps('winget install --id Notepad++.Notepad++ -e');
  assert.equal(steps[1].check(), true);
  // Removing it from Installed apps instead doesn't pass step 4; winget again does.
  tab.screen(PC, 'settings-apps');
  tab.run(`hdWinUninstall('${PC}', 'Notepad++')`);
  assert.equal(steps[4].check(), false, 'step 4 asks for the typed line');
  tab.ps('winget install --id Notepad++.Notepad++ -e');
  tab.ps('winget uninstall --id Notepad++.Notepad++ -e');
  assert.equal(steps[4].check(), true, 'install again, then remove with winget');
  // 7-Zip updated before the listing: step 2 still needs the listing typed.
  tab.ps('winget upgrade --id 7zip.7zip -e');
  assert.equal(steps[2].check(), false, 'the listing is not typed yet');
  assert.match(tab.ps('winget upgrade'), /No installed package found/);
  assert.equal(steps[2].check(), true, 'the listing counts once 7-Zip is updated');
}

// The optional Defender lines pass steps 6 and 7 in place of the screens.
function testOptionalLinesPassTheirSteps() {
  const tab = startLab();
  triage(tab);
  const steps = tab.coach('hd-m07').steps;
  assert.equal(steps[6].check(), false);
  assert.match(tab.ps('Get-MpComputerStatus | Select-Object AMServiceEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated'), /RealTimeProtectionEnabled\s*:\s*True/);
  assert.equal(steps[6].check(), true, '6 by the optional line');
  assert.equal(steps[7].check(), false);
  tab.ps('Start-MpScan -ScanType QuickScan');
  assert.equal(steps[7].check(), false, '7 also needs the history');
  assert.equal(tab.ps('Get-MpThreatDetection'), '', 'the history is empty');
  assert.equal(steps[7].check(), true, '7 by the optional lines');
  // The typed unsafe lines are undone too, and recorded.
  tab.ps('Set-MpPreference -DisableRealtimeMonitoring $true');
  assert.equal(tab.machine(PC).protection.realtime, true);
  tab.ps('Add-MpPreference -ExclusionPath C:\\Users\\lbrooks\\Downloads');
  assert.deepEqual(tab.machine(PC).protection.exclusions, []);
  assert.equal(tab.lastToast(), UNDO_LINE);
  const ids = tab.actions(LEAH);
  assert.ok(ids.includes('realtime-protection-off') && ids.includes('exclusion-added'), 'both are recorded');
}

// Removing an approved extension by mistake never strands step 8.
function testStep8NeverStrandsTheLab() {
  const tab = startLab();
  triage(tab);
  const step = tab.coach('hd-m07').steps[8];
  tab.kb(LEAH, 'extension', 'KB-0080');
  tab.run(`hdWinRemoveExtension('${PC}', 'Northstar Password Manager')`);
  assert.equal(step.check(), false);
  tab.run(`hdWinRemoveExtension('${PC}', 'Weather Now Tab')`);
  assert.equal(step.check(), true);
}

// Deleting the file or unlinking OneDrive is critical-error feedback, and in
// the lab it is put back at once (undoOneDrive), so step 10 can still pass.
function testOneDriveShortcutsAreFeedback() {
  const tab = startLab();
  triage(tab);
  tab.run(`hdWinOneDriveDelete('${PC}', 0)`);
  assert.match(tab.lastToast(), /^Deleting the file or unlinking OneDrive never fixes a sync problem\. It has been put back\./);
  tab.run(`hdWinOneDriveControl('${PC}', 'unlink')`);
  assert.equal(tab.feedback(LEAH).critical.length, 2);
  const od = tab.machine(PC).oneDrive;
  assert.ok(od.files.some((f) => f.name === 'Budget: Q4?.xlsx'), 'the file is back');
  assert.notEqual(od.linked, false, 'OneDrive is signed in again');
  assert.equal(tab.run(`hdConsoleRule(hdTicketById('${LEAH}'), { synced: '${PC}' })`), false, 'a deleted file never counts as synced');
  tab.run(`hdWinOneDriveRename('${PC}', 0, 'file', 'Budget - Q4.xlsx')`);
  tab.tab(PC, 'onedrive', 'web');
  assert.equal(tab.coach('hd-m07').steps[10].check(), true, 'step 10 still passes');
  // 6-A has no undo: its shortcuts stay as the student left them.
  assert.equal(tab.run("hdConsole(HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2177')).undoOneDrive"), undefined);
}

// Teams and 7-Zip are managed on the lab computer: no uninstall by either
// route, so the repair and the upgrade can never be lost.
function testManagedAppsStay() {
  const tab = startLab();
  triage(tab);
  const html = tab.screen(PC, 'settings-apps');
  const row = (name) => html.split(`data-hd-app="${name}"`)[1].split('</tr>')[0];
  ['Microsoft Teams', '7-Zip'].forEach((name) => {
    assert.match(row(name), /data-hd-app-managed>Managed by your organization/, name);
    assert.doesNotMatch(row(name), />Uninstall</, name);
  });
  assert.match(row('Google Chrome'), />Uninstall</, 'other apps keep Uninstall');
  tab.run(`hdWinUninstall('${PC}', 'Microsoft Teams')`);
  assert.match(tab.ps('winget uninstall --id 7zip.7zip -e'), /7-Zip is managed by your organization and can't be uninstalled here\./);
  const apps = tab.machine(PC).installedApps.map((a) => a.name);
  assert.ok(apps.includes('Microsoft Teams') && apps.includes('7-Zip'));
  assert.ok(!tab.actions(LEAH).includes('app-uninstalled'));
}

// The typed commands sit behind "Show me the command", nowhere else.
function testShowMeTheCommand() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const steps = tab.coach('hd-m07').steps;
  const typed = [[1, [WINGET[0], WINGET[1]]], [2, [WINGET[2]]], [3, [WINGET[3]]], [4, [WINGET[4]]]];
  typed.forEach(([i, commands]) => {
    const step = steps[i];
    const hint = (step.instruction.match(/<details><summary>Show me the command<\/summary>([\s\S]*?)<\/details>/) || [])[1];
    assert.ok(hint, `step ${i} has a Show me the command hint`);
    const outside = `${step.title} ${step.instruction.replace(/<details>[\s\S]*?<\/details>/, '')} ${step.body}`;
    commands.forEach((command) => {
      assert.ok(hint.includes(command), `step ${i} hint shows ${command}`);
      assert.ok(!outside.toLowerCase().includes(command.toLowerCase()), `step ${i} names ${command} only in the hint`);
    });
  });
  // The optional lines under steps 6 and 7 are shown, not hidden.
  [6, 7].forEach((i) => assert.match(steps[i].instruction, /The same check in PowerShell \(optional\): <code>/, `step ${i}`));
  assert.match(steps[6].instruction, /Get-MpComputerStatus \| Select-Object AMServiceEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated/);
  // The spec's coach lines (8.2).
  assert.match(steps[4].instruction, /Leah has finished her edit and doesn’t need Notepad\+\+ any more\. Before you remove anything, ask whether something else depends on it\. Nothing does here\./);
  assert.match(steps[6].instruction, /Never turn off protection or add an exclusion to make a problem go away\. In a graded ticket this is a critical error\./);
  assert.match(steps[7].body, /Nothing found, and nothing allowed\. If the history showed an item marked Allowed, you would open KB-0080 before doing anything\. If it named malware \(a trojan, ransomware, a script that ran\), you would stop and send the ticket to Security Operations\./);
  assert.match(steps[8].body, /Weather Now Tab isn’t harmful, but it isn’t on the approved list, so it comes off\. Tell Leah she can ask for it with a software request\./);
}

// Screen steps start on NS-WS-0233's desktop, whose buttons record a screen as opened.
function testScreenStepsStartOnTheDesktop() {
  const tab = startLab();
  triage(tab);
  const steps = tab.coach('hd-m07').steps;
  const desktop = tab.desktop();
  [[5, 'settings-apps'], [6, 'windows-security'], [8, 'browser-extensions'], [10, 'onedrive']].forEach(([i, screen]) => {
    assert.equal(steps[i].route, '#/helpdesk/windows', `step ${i} starts on the desktop`);
    assert.match(steps[i].target, new RegExp(`\\[data-hd-tools="${screen}"\\]`), `step ${i} points at its button`);
    assert.match(desktop, new RegExp(`data-hd-tools="${screen}"`), `the desktop has the ${screen} button`);
  });
}

// Every step route is allowed and has a view; every step says why and what
// success looks like; no step names a ticket id, points or a key.
function testEveryStepRouteAndText() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const coach = tab.coach('hd-m07');
  coach.steps.forEach((step, i) => {
    if (step.route) {
      assert.ok(coach.allow.includes(step.route), `step ${i}: ${step.route} is in allow`);
      assert.ok(tab.run(`${JSON.stringify(step.route.replace(/^#\//, ''))} in VIEWS`), `step ${i}: ${step.route} has a view`);
    }
    if (i === coach.steps.length - 1) {
      assert.equal(step.finish.label, 'Finish');
      assert.equal(step.finish.href, `${PORTAL}/?coachComplete=hd-m07#/program/it-support/module/6`);
    } else {
      assert.match(step.body, /Why:[\s\S]*Success looks like:/, `step ${i} says why and what success looks like`);
      assert.equal(typeof step.check, 'function', `step ${i} is gated on real state`);
    }
    assert.doesNotMatch(`${step.title} ${step.instruction} ${step.body}`, /\b(HD|SR|SEC)-21\d\d\b|\d+\s*points?\b|\bscore\b(?! *\.)|its-0\d|Module 7|lab VM|CompTIA/i, `step ${i} text`);
  });
  coach.allow.forEach((route) => assert.ok(tab.run(`${JSON.stringify(route.replace(/^#\//, ''))} in VIEWS`), `allow ${route} has a view`));
}

/* ------------------------------------------------- the old HD-2119 coach */

function testOldHd2119RunIsForgotten() {
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('hdSave()');
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m07', step: 3, student: STUDENT }));
  const tab = sim(launchUrl(false), { local });
  assert.equal(tab.coachStep(), 0, 'starts at the first step');
  assert.equal(tab.run('hdState.ticketSet'), 'its-07-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [LEAH]);
}

function testHd2119StaysInTheSharedShift() {
  const shared = sim(`${SIM_URL}#/helpdesk/tickets`);
  const ids = plain(shared.run('hdState.tickets.map((t) => t.id)'));
  ['HD-2119', 'HD-2120', 'HD-2121', 'HD-2122', 'HD-2123'].forEach((id) => assert.ok(ids.includes(id), `${id} stays in the shared shift`));
  [LEAH, 'HD-2177', 'HD-2178', 'HD-2179'].forEach((id) => assert.ok(!ids.includes(id), `${id} is not in the shared shift`));
  assert.match(shared.view('helpdesk/dashboard'), /Purchasing sign-in failures/, 'the correlation card stays');
  // KB-0058's Module 6 copy shows only in Module 6's sets, never in the shared shift.
  assert.ok(!shared.run("hdKbArticles().some((a) => a.id === 'KB-0058')"), 'no KB-0058 in the shared shift');
  assert.ok(!shared.run("HD_KB_ARTICLES.some((a) => a.id === 'KB-0058')"), 'not in the shared list');
}

/* ------------------------------------------------------------ the portal */

// The real finished work goes through today's Module 6 page (its walkthrough
// lab saves one attempt) and onto the instructor sheet, where a perfect lab
// shows no ✗ and the note and console work are readable.
async function testPortalKeepsTheWork(work) {
  const portal = loadPortal();
  const prun = (code) => vm.runInContext(code, portal);
  portal.render = () => {};
  const user = { userId: 'user-hdesk-m06', email: 'hdesk-m06@test.invalid', trackCode: 'HDESK', enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {}, latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {} };
  portal.currentUser = async () => user;
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = () => ({ data: null, error: null });
  const HD = prun("PROGRAMS.find((p) => p.slug === 'it-support')");
  const page = prun("MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-07'].number]");
  const student = prun('LabRuntime').anonymousStudentId(user);
  const SIM = new URL(prun('SIM_ORIGIN')).origin;
  const replies = [];
  page.view(user, HD);
  await page.onMessage({ data: { type: 'mnt-coach-complete', id: 'hd-m07', nonce: 'n-m06', student, work }, origin: SIM, source: { postMessage: (data) => replies.push(plain(data)) } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  const inserts = portal.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert');
  assert.equal(inserts.length, 1, 'one attempt saved');
  const attempt = plain(inserts[0].payload);
  assert.equal(attempt.lab_key, 'lab-its-07-app-cert');
  assert.ok(replies.some((r) => r.type === 'mnt-coach-received' && r.saved === true), 'the simulator hears it saved');
  const saved = attempt.result.work.tickets;
  assert.deepEqual(saved.map((t) => t.id), [LEAH]);
  assert.equal(saved[0].status, 'Resolved');
  assert.ok(saved[0].notes.some((n) => /Weather Now Tab/.test(n.text)), 'the work note travels');
  assert.ok(saved[0].console.kbOpened.includes('KB-0080') && saved[0].console.chatAsked.includes('teams'), 'the console work travels');

  // The instructor sheet, as tests/admin-submission-sheet.test.js loads it.
  const sheetCtx = { console: { log() {}, info() {}, warn() {}, error: console.error } };
  vm.createContext(sheetCtx);
  sheetCtx.registerModuleLab = () => {};
  for (const file of ['data.js', 'case-record.js', 'admin-submission-sheet.js', 'it-support-module-12.js', 'admin-sheets/hdesk.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'portal', file), 'utf8'), sheetCtx, { filename: file });
  }
  const Sheet = vm.runInContext('AdminSubmissionSheet', sheetCtx);
  const row = { id: 'hdesk-m06-real', lab_key: attempt.lab_key, track_code: 'HDESK', student_id: 'synthetic-hdesk', score: null, pass_threshold: 70, completed_at: '2026-11-24T10:00:00Z', result: attempt.result };
  const options = { item: { lead: row, rows: [row], ids: [row.id] } };
  const sheet = plain(Sheet.evaluate(row, options));
  const flagged = sheet.sections.filter((s) => s.status === 'fail' || s.status === 'partial').map((s) => `${s.id}: ${s.status}`);
  assert.deepEqual(flagged, [], 'a perfect lab shows no ✗ or ◐');
  const ids = sheet.sections.map((s) => s.id);
  ['scenario-hd-2176', 'lab-work-hd-2176', 'work-notes-hd-2176', 'resolution-hd-2176'].forEach((id) => assert.ok(ids.includes(id), id));
  // Lab 6.1 asks for no customer comment, so the sheet has no comment row.
  ['troubleshooting-hd-2176', 'diagnosis-hd-2176', 'customer-comment-hd-2176', 'scenario-hd-2119'].forEach((id) => assert.ok(!ids.includes(id), `no ${id}`));
  // A lab that skipped KB-0058 is marked, as feedback.
  const thin = plain(attempt.result);
  thin.work.tickets[0].console.kbOpened = ['KB-0080'];
  const thinSheet = plain(Sheet.evaluate({ ...row, id: 'hdesk-m06-thin', result: thin }, options));
  assert.equal(thinSheet.sections.find((s) => s.id === 'lab-work-hd-2176').status, 'fail');
  const html = Sheet.render(row, options);
  assert.match(html, /Weather Now Tab/, 'the note is readable');
  assert.match(html, /repaired Microsoft Teams/i, 'the actions are in the history');
}

/* ------------------------------------------- nothing from the graded ticket */

// The Prove It ticket for this module isn't built yet (it comes with the
// module's Prove It part, in its own Prove shift). Its ticket id, laptop,
// product and story words are kept here only as short hashes, so this file
// names none of them, and no Help Desk lab, practice ticket, coach or test does.
// ui/data.js (the SOC simulator) is not a Help Desk file and is not scanned.
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const GRADED = new Set(['f24718e82192f945', '7b4dab15cc7eda02', 'e53ad2ce9badf645', '72309c04a6254384', '1180412af43d7860']);
const HELP_DESK = /^(ui\/helpdesk[^/]*\.js|portal\/it-support-[^/]*\.js|portal\/admin-sheets\/hdesk[^/]*\.js|tests\/hdesk-[^/]*\.js|tests\/admin-sheets\/hdesk[^/]*\.js)$/;
function testNothingFromTheGradedTicket() {
  const files = childProcess.execFileSync('git', ['ls-files', 'ui', 'portal', 'tests'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => HELP_DESK.test(f));
  assert.ok(files.length > 20, 'git ls-files lists the committed Help Desk files');
  ['tests/hdesk-m06-guided-lab.test.js', 'tests/hdesk-m06-practice-tickets.test.js'].forEach((f) => { if (!files.includes(f)) files.push(f); });
  const hits = [];
  for (const file of files) {
    let source;
    try { source = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { continue; }
    const words = new Set(source.split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
    GRADED.forEach((h) => { if (words.has(h)) hits.push(`${file}: ${h}`); });
  }
  assert.deepEqual(hits, [], 'no committed Help Desk file names the graded ticket');
  // The scan finds a word it is given: the lab's own ticket number.
  const words = new Set(fs.readFileSync(path.join(UI, 'helpdesk-data.js'), 'utf8').split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
  assert.ok(words.has(hash('inc0010486')));
  // No Practice fixture has an allowed protection item or a history row marked Allowed.
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const fixtures = plain(tab.run(`HD_TICKET_TEMPLATES.flatMap((t) => Object.values(((t.console || {}).machines) || {})).map((m) => m.protection).filter(Boolean)`));
  assert.ok(fixtures.length >= 1);
  fixtures.forEach((p) => {
    assert.deepEqual(p.allowed || [], [], 'nothing allowed');
    assert.ok(!(p.history || []).some((h) => /allowed/i.test(String(h.status || ''))), 'no Allowed history row');
  });
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m06-guided-lab\.test\.js/);
}

let failed = 0;
const runTest = (name, fn) => {
  try { const value = fn(); console.log(`ok   ${name}`); return value; } catch (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); return null; }
};
const work = runTest('testLab61', testLab61);
const portalDone = work
  ? testPortalKeepsTheWork(work).then(() => console.log('ok   testPortalKeepsTheWork'), (error) => { failed += 1; console.error(`FAIL testPortalKeepsTheWork\n${error.stack}`); })
  : Promise.resolve().then(() => { failed += 1; console.error('FAIL testPortalKeepsTheWork (the lab walk failed)'); });
const tests = [testTypedStepsAnyCase, testRefusedWingetDoesNotPass, testOptionalLinesPassTheirSteps, testStep8NeverStrandsTheLab, testOneDriveShortcutsAreFeedback, testManagedAppsStay, testShowMeTheCommand,
  testScreenStepsStartOnTheDesktop, testEveryStepRouteAndText, testOldHd2119RunIsForgotten, testHd2119StaysInTheSharedShift, testNothingFromTheGradedTicket, testCiRunsThisFile];
portalDone.then(() => {
  tests.forEach((test) => runTest(test.name, test));
  if (failed) { console.error(`${failed} failed`); process.exit(1); }
  console.log(`hdesk-m06-guided-lab: all ${tests.length + 2} passed`);
});

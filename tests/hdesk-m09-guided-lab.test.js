'use strict';
// Help Desk Module 09 (key its-04) Practice It, Lab 9.1 (ui/helpdesk-coaches.js
// "hd-m04"): the connectivity checklist, coached set its-04-guided.
//
//   - Part A on HD-2212 (INC0010523): Jonah Pryce's wall jack 2F-14 is not
//     patched, and NS-WS-0319 keeps the APIPA address it gave itself.
//   - Part B on HD-2213 (INC0010524): the intranet moved under CHG-7802 and
//     Farah Qureshi's docked NS-LT-0415 holds the old DNS answer.
//   - Part C on SR-2222 (RITM0010164): a clean domain join of Kenji Watanabe's
//     NS-LT-0416 into OU=Logistics,OU=Workstations.
//   - The coach walks Part A steps 1 to 11, Part B steps 1 to 8 and Part C
//     steps 1 to 4 of spec section 8.2 through ui/coach.js. Each step waits for
//     real state, never a tick box. Typed commands pass from the command
//     history in any letter case; Resolve-DnsName and Clear-DnsClientCache
//     pass in place of nslookup and ipconfig /flushdns.
//   - Finish sends HD-2212, HD-2213 and SR-2222, and the portal's cleaner keeps
//     all three.
//   - Every adapter in the lab and the practice set is DHCP (spec decision 10).
//   - HD-2104, HD-2105 and HD-2113 are in no student queue; a saved run of the
//     old hd-m04 starts fresh.
//
// The simulator runs in a Node vm with a small fake DOM, with ui/coach.js
// loaded, as tests/hdesk-m08-guided-lab.test.js does. Synthetic data only.
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
const STUDENT = 'student-m09g0001';
const launchUrl = (coach = 'hd-m04', restart = true, student = STUDENT) => `${SIM_URL}?coach=${coach}${restart ? '&restart=1' : ''}${student ? `&student=${student}` : ''}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const A = 'HD-2212';
const B = 'HD-2213';
const R = 'SR-2222';
const PC_A = 'NS-WS-0319';
const PC_B = 'NS-LT-0415';
const PC_C = 'NS-LT-0416';
const OU = 'OU=Logistics,OU=Workstations';

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
    on: (computer) => run(`hdSelectComputer(${j(computer)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
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
const NOTE_A = 'Reported: New starter, first day; desk PC NS-WS-0319 shows no internet; the colleague beside him is fine.\nTried: One user only (H. Cole working; no other floor 2 tickets). Ethernet "Network cable unplugged", no link light. Closet: jack 2F-14 → panel port 2-14 not patched (Network Operations\' toner and cable test: cable passes). Moved the cable to jack 2F-15: link up at 1 Gbps. Still APIPA (169.254.33.10); ipconfig /release and /renew: 10.20.10.141, gateway 10.20.10.1, DNS 10.20.0.10/11, DHCP. Gateway and files reply; tracert out through nsfw01 and the fiber router; files:445 and dc01:53 answer.\nResult: Jonah working from jack 2F-15.\nNext action: Network Operations to patch jack 2F-14 (port 2-14 to NS-SW-2F); Service Desk to tell Jonah when he can move back.';
const COMMENT_A = 'Hi Jonah, welcome! Your computer and its cable are fine. The network socket at your desk hasn\'t been connected in our network room yet, so we\'ve moved you to the socket at the desk beside you, and everything\'s working. Our network team will connect yours, and we\'ll let you know when you can plug back in. – Riley';
const NOTE_B = 'Reported: Intranet "This site can\'t be reached" since about 08:10 visit; colleague can open it.\nTried: Dock Ethernet and Wi-Fi both DHCP, company DNS, healthy; Wi-Fi 5 GHz WPA3-Enterprise. ping intranet → 10.20.0.45, timed out; nslookup intranet → 10.20.0.50. CHG-7802 (08:30 today) moved the intranet to 10.20.0.50; the PC had cached the old address. ipconfig /flushdns: ping intranet → 10.20.0.50 replies; intranet:443 answers.\nResult: Farah confirmed the intranet opens.';
const COMMENT_B = 'Hi Farah, the intranet is working for you again. It moved to a new server at 8:30 this morning, and your computer was still trying the old one because you\'d opened it just before the move. We\'ve cleared that, so it goes to the new server now. Anyone else who sees this can simply wait an hour or call us. – Riley';
const NOTE_C = 'Reported: approved new starter laptop setup for K. Watanabe (Logistics), starts tomorrow.\nTried: NS-LT-0416 wired on the build bench, DHCP, company DNS; nslookup northstar.example returned both domain controllers; joined northstar.example with the provisioning account per KB-0097 into OU=Logistics,OU=Workstations; restarted; gpupdate /force completed.\nResult: NS-LT-0416 in OU=Logistics,OU=Workstations; ready for Kenji tomorrow.';

function startLab(opener, local, session) {
  const tab = sim(launchUrl(), { opener, local, session });
  assert.equal(tab.run('hdState.ticketSet'), 'its-04-guided');
  // The queue order is shuffled per shift; the set is exactly these three.
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [A, B, R]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-20T08:40:00.000Z');
  return tab;
}

/* ------------------------------------------------------------ Part A */
const LINES_A = {
  ipconfig: 'ipconfig', all: 'ipconfig /all', release: 'ipconfig /release', renew: 'ipconfig /renew',
  pingGw: 'ping 10.20.10.1', pingFiles: 'ping files.northstar.example', tracert: 'tracert www.example.com',
  port445: 'Test-NetConnection files.northstar.example -Port 445', port53: 'Test-NetConnection dc01.northstar.example -Port 53',
};
function partA(tab, lines = LINES_A) {
  // Part A step 1: triage.
  tab.open(A);
  at(tab, 0, 'Part A step 1 waits');
  tab.triage(A, 'Network', 'Wired connectivity', PC_A, '3', '1');
  assert.equal(tab.ticket(A).priority, 'P3');
  at(tab, 1, 'Part A step 1 done');
  // Part A step 2: one person or many.
  tab.run(`hdChatAsk('${A}', 'others')`);
  assert.match(tab.open(A), /Hannah next to me is fine/);
  at(tab, 2, 'Part A step 2 done');
  // Part A step 3: the link, on the screen and from Jonah.
  tab.run(`hdOpenMachineScreen('${PC_A}', 'settings-network')`);
  assert.match(tab.view('helpdesk/settings-network'), /data-hd-net-status="Network cable unplugged"/);
  at(tab, 2, 'Part A step 3 waits for the link light');
  tab.run(`hdChatAsk('${A}', 'light')`);
  at(tab, 3, 'Part A step 3 done');
  // Part A step 4: the closet and Network Operations' card.
  tab.open(A);
  tab.run(`hdClosetOpen('${A}')`);
  const closet = tab.view('helpdesk/network-closet');
  assert.match(closet, /<tr data-hd-jack="2F-14" data-hd-link="off">[\s\S]*?<td>2-14<\/td><td data-hd-switch-port><strong>Not patched<\/strong>/);
  assert.match(closet, /<tr data-hd-jack="2F-15" data-hd-link="green">[\s\S]*?NS-SW-2F Gi1\/0\/15[\s\S]*?VLAN 10/);
  at(tab, 3, 'Part A step 4 waits for the evidence card');
  tab.run(`hdEvidenceOpen('${A}', 'jack-2f14')`);
  assert.match(tab.open(A), /<dt>Toner probe<\/dt><dd>2F-14 is patch-panel port 2-14<\/dd><dt>Cable tester<\/dt><dd>Pass, wires 1–8<\/dd><dt>Switch<\/dt><dd>Not patched to the switch<\/dd>/);
  at(tab, 4, 'Part A step 4 done');
  // Part A step 5: the known-good jack.
  tab.run(`hdChatAsk('${A}', 'move')`);
  assert.match(tab.view('helpdesk/settings-network'), />Connected, 1\.0 Gbps</);
  at(tab, 5, 'Part A step 5 done');
  // Part A steps 6 and 7: the address.
  tab.on(PC_A);
  assert.match(tab.ps(lines.ipconfig), /Autoconfiguration IPv4 Address\. \. : 169\.254\.33\.10/);
  at(tab, 6, 'Part A step 6 done');
  const all = tab.ps(lines.all);
  assert.match(all, /Physical Address\. \. \. \. \. \. \. \. \. : 3C-52-82-4A-19-07/);
  assert.match(all, /DHCP Enabled\. \. \. \. \. \. \. \. \. \. \. : Yes/);
  at(tab, 7, 'Part A step 7 done');
  // Part A step 8: release, renew, then Hardware properties.
  tab.ps(lines.release);
  const renewed = tab.ps(lines.renew);
  assert.match(renewed, /IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 10\.20\.10\.141/);
  at(tab, 7, 'Part A step 8 waits for Hardware properties');
  tab.run(`hdNetPanel('${PC_A}', 'hardware', 'Ethernet')`);
  assert.match(tab.view('helpdesk/settings-network'), /Automatic \(DHCP\)/);
  at(tab, 7, 'Part A step 8 does not pass on Hardware properties alone');
  // Step 8 also reads Edit IP settings on the healthy PC (spec decision 10),
  // so the Prove It is not the first time a student sees that screen.
  const a8 = tab.coach('hd-m04').steps[7];
  assert.match(a8.instruction, /Hardware properties<\/strong>, then open <strong>Edit IP settings<\/strong>, read <strong>Automatic \(DHCP\)<\/strong>, and <strong>Cancel<\/strong>\./);
  assert.match(a8.body, /; then open Edit IP settings, read <strong>Automatic \(DHCP\)<\/strong>, and Cancel\.$/);
  const actionsBefore = tab.run(`hdConsoleState(hdTicketById('${A}')).actions.length`);
  tab.run(`hdNetPanel('${PC_A}', 'edit', 'Ethernet')`);
  at(tab, 8, 'Part A step 8 done once Edit IP settings has opened');
  const edit = tab.view('helpdesk/settings-network');
  assert.match(edit, /data-hd-net-panel="edit"/);
  assert.match(edit, /Now: Automatic \(DHCP\)/);
  assert.match(edit, /<option value="dhcp" selected>Automatic \(DHCP\)<\/option>/);
  tab.run(`hdNetPanel('${PC_A}', '', '')`);
  assert.doesNotMatch(tab.view('helpdesk/settings-network'), /data-hd-net-panel="edit"/);
  assert.equal(tab.run(`hdConsoleState(hdTicketById('${A}')).actions.length`), actionsBefore, 'Cancel changes nothing');
  assert.equal(tab.coachStep(), 8, 'Edit IP settings and Cancel leave the coach on step 9');
  // Part A step 9: the gateway, a company server, the way out.
  tab.on(PC_A);
  assert.match(tab.ps(lines.pingGw), /Reply from 10\.20\.10\.1/);
  assert.match(tab.ps(lines.pingFiles), /\[10\.20\.0\.30\][\s\S]*Reply from 10\.20\.0\.30/);
  const route = tab.ps(lines.tracert);
  assert.match(route, /nsfw01 \[10\.20\.255\.1\][\s\S]*nsrtr-fiber \[10\.20\.255\.2\]/);
  at(tab, 9, 'Part A step 9 done');
  // Part A step 10: the services.
  assert.match(tab.ps(lines.port445), /TcpTestSucceeded : True/);
  assert.match(tab.ps(lines.port53), /TcpTestSucceeded : True/);
  at(tab, 10, 'Part A step 10 done');
  // Part A step 11: Network Operations, the note, the comment, the workaround code.
  tab.open(A);
  tab.run(`hdTeamMessage('${A}', 'netops-2f14')`);
  tab.note(A, NOTE_A);
  tab.comment(A, COMMENT_A);
  at(tab, 10, 'Part A step 11 waits for Resolved');
  tab.resolve(A, 'Workaround provided', 'Jonah moved to jack 2F-15; Network Operations to patch 2F-14.');
  assert.equal(tab.ticket(A).status, 'Resolved');
  at(tab, 11, 'Part A step 11 done');
}

/* ------------------------------------------------------------ Part B */
const LINES_B = {
  all: 'ipconfig /all', ping: 'ping intranet.northstar.example', lookup: 'nslookup intranet.northstar.example',
  flush: 'ipconfig /flushdns', port: 'Test-NetConnection intranet.northstar.example -Port 443',
};
function partB(tab, lines = LINES_B) {
  tab.open(B);
  tab.triage(B, 'Network', 'Website or intranet access', PC_B, '3', '2');
  assert.equal(tab.ticket(B).priority, 'P4');
  at(tab, 12, 'Part B step 1 done');
  tab.on(PC_B);
  const all = tab.ps(lines.all);
  assert.match(all, /Ethernet adapter Ethernet 2:[\s\S]*10\.20\.10\.177\(Preferred\)/);
  assert.match(all, /Wireless LAN adapter Wi-Fi:[\s\S]*10\.20\.10\.178\(Preferred\)/);
  at(tab, 13, 'Part B step 2 done');
  tab.run(`hdNetPanel('${PC_B}', 'wifi', 'Wi-Fi')`);
  const wifi = tab.view('helpdesk/settings-network');
  assert.match(wifi, /WPA3-Enterprise/);
  assert.match(wifi, /5 GHz/);
  at(tab, 14, 'Part B step 3 done');
  tab.on(PC_B);
  assert.match(tab.ps(lines.ping), /\[10\.20\.0\.45\][\s\S]*Request timed out\./);
  at(tab, 15, 'Part B step 4 done');
  const lookup = tab.ps(lines.lookup);
  assert.match(lookup, /10\.20\.0\.50/);
  at(tab, 16, 'Part B step 5 done');
  // Part B step 6: the change log and the DNS record.
  tab.open(B);
  tab.run("hdChangeLogOpen('CHG-7802')");
  assert.match(tab.view('helpdesk/change-log'), /data-hd-change-detail="CHG-7802"[\s\S]*Today 08:30/);
  at(tab, 16, 'Part B step 6 waits for the DNS screen');
  assert.match(tab.view('helpdesk/dns'), /intranet[\s\S]*?10\.20\.0\.50/);
  at(tab, 17, 'Part B step 6 done');
  // Part B step 7: flush, prove, and Farah reloads.
  tab.on(PC_B);
  tab.ps(lines.flush);
  assert.match(tab.ps(lines.ping), /\[10\.20\.0\.50\][\s\S]*Reply from 10\.20\.0\.50/);
  assert.match(tab.ps(lines.port), /TcpTestSucceeded : True/);
  at(tab, 17, 'Part B step 7 waits for Farah');
  tab.run(`hdChatAsk('${B}', 'reload')`);
  assert.match(tab.open(B), /It&#39;s back|It's back/);
  at(tab, 18, 'Part B step 7 done');
  tab.open(B);
  tab.note(B, NOTE_B);
  tab.comment(B, COMMENT_B);
  tab.resolve(B, 'Solution provided', 'Old cached answer cleared; intranet opens.');
  assert.equal(tab.ticket(B).status, 'Resolved');
  at(tab, 19, 'Part B step 8 done');
}

/* ------------------------------------------------------------ Part C */
function partC(tab, { typedJoin = false, lookup = 'nslookup northstar.example' } = {}) {
  tab.open(R);
  assert.match(tab.open(R), /RITM0010164/);
  tab.kb(R, 'domain join', 'KB-0097');
  tab.attach(R, 'KB-0097');
  at(tab, 20, 'Part C step 1 done');
  tab.on(PC_C);
  assert.match(tab.ps('ipconfig /all'), /DNS Servers \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.10/);
  assert.match(tab.ps(lookup), /10\.20\.0\.10[\s\S]*10\.20\.0\.11/);
  at(tab, 21, 'Part C step 2 done');
  tab.open(R);
  if (typedJoin) {
    tab.on(PC_C);
    tab.ps(`Add-Computer -DomainName northstar.example -OUPath "${OU}"`);
  } else {
    tab.run(`hdOpenMachineScreen('${PC_C}', 'settings-about')`);
    tab.run(`hdJoinStart('${PC_C}')`);
    assert.doesNotMatch(tab.view('helpdesk/settings-about'), /type="password"/);
    tab.input('hd-join-domain', 'northstar.example');
    tab.run(`hdJoinDomain({ preventDefault() {} }, '${PC_C}')`);
    tab.run(`hdJoinAccount('${PC_C}')`);
    tab.input('hd-join-ou', OU);
    tab.run(`hdJoinOu({ preventDefault() {} }, '${PC_C}')`);
    assert.match(tab.view('helpdesk/settings-about'), /Welcome to the northstar\.example domain\./);
  }
  at(tab, 21, 'Part C step 3 waits for the restart');
  tab.run(`hdJoinRestart('${PC_C}')`);
  at(tab, 22, 'Part C step 3 done');
  tab.on(PC_C);
  assert.match(tab.ps('gpupdate /force'), /Computer Policy update has completed successfully\./);
  tab.open(R);
  tab.run("hdState.adTab = 'computers'");
  tab.input('hd-ad-computer-q', PC_C);
  tab.run('hdAdComputerFind({ preventDefault() {} })');
  tab.run(`hdAdOpenComputer('${PC_C}')`);
  assert.match(tab.view('helpdesk/active-directory'), new RegExp(`data-hd-ad-computer="${PC_C}"[\\s\\S]*?<code>${OU}</code>`));
  tab.note(R, NOTE_C);
  at(tab, 22, 'Part C step 4 waits for the request to close');
  tab.run(`hdRequestClose('${R}')`);
  assert.equal(tab.ticket(R).request.state, 'Closed Complete');
  const rule = (r) => tab.run(`hdConsoleRule(hdTicketById('${R}'), ${JSON.stringify(r)})`);
  assert.ok(rule({ typed: '^gpupdate', computer: PC_C }), 'gpupdate typed on NS-LT-0416');
  assert.ok(rule({ seen: 'gpupdate', computer: PC_C, after: 'restart' }), 'gpupdate seen after the restart');
  assert.ok(rule({ serverSeen: `ad-computer:${PC_C}` }), 'the computer object read on SR-2222');
  assert.ok(rule({ note: true }), 'the close note');
  at(tab, 23, 'at Finish');
}

/* ------------------------------------------------------------ the walk */

function testLabOpensOnItsSet() {
  const tab = startLab();
  const coach = tab.coach('hd-m04');
  assert.equal(coach.module, 9);
  assert.equal(coach.completionToken, 'hd-m04');
  assert.equal(coach.steps.length, 24, 'Part A steps 1 to 11, Part B steps 1 to 8, Part C steps 1 to 4, then Finish');
  assert.equal(tab.ticket(A).number, 'INC0010523');
  assert.equal(tab.ticket(B).number, 'INC0010524');
  assert.equal(tab.ticket(R).request.number, 'RITM0010164');
  assert.equal(tab.ticket(R).request.item, 'New starter laptop setup');
  assert.equal(tab.ticket(R).request.approval, 'Approved');
  assert.equal(tab.run('hdState.openedTicketId'), A, 'Lab 9.1 starts with HD-2212 open');
}

function testLab91() {
  const opener = fakeOpener();
  const tab = startLab(opener);
  partA(tab);
  partB(tab);
  partC(tab);
  for (const id of [A, B, R]) {
    const feedback = tab.feedback(id);
    feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
    assert.deepEqual(feedback.critical, [], `${id} no critical entry`);
    assert.deepEqual(feedback.flags, [], `${id} no flag`);
  }
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  assert.equal(done.data.id, 'hd-m04');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id).sort(), [A, B, R]);
  assert.ok(!/HD-2104|HD-2105|HD-2113/.test(JSON.stringify(work.tickets.map((t) => t.id))), 'no old ticket in the record');
  // The portal's cleaner keeps all three, SR-2222 included.
  const portal = loadPortal();
  const clean = plain(vm.runInContext('itsCleanCoachWork', portal)(work));
  assert.deepEqual(clean.tickets.map((t) => t.id).sort(), [A, B, R]);
  const request = clean.tickets.find((t) => t.id === R);
  assert.equal(request.console && request.console.request && request.console.request.state, 'Closed Complete', 'the saved work keeps Closed Complete');
  const partAWork = clean.tickets.find((t) => t.id === A);
  assert.equal(partAWork.status, 'Resolved');
}

// Any letter case and extra spaces pass the typed steps; the two accepted
// optional lines pass in place of nslookup and ipconfig /flushdns.
function testTypedStepsAnyCaseAndOptionalLines() {
  const tab = startLab();
  partA(tab, {
    ipconfig: 'IPCONFIG', all: 'IpConfig   /ALL', release: 'ipconfig /RELEASE', renew: 'ipconfig  /renew',
    pingGw: 'PING 10.20.10.1', pingFiles: 'ping FILES.northstar.example', tracert: 'TRACERT www.example.com',
    port445: 'test-netconnection files.northstar.example -port 445', port53: 'TEST-NETCONNECTION dc01.northstar.example -PORT 53',
  });
  partB(tab, { all: 'IPCONFIG /ALL', ping: 'PING intranet.northstar.example', lookup: 'Resolve-DnsName intranet.northstar.example', flush: 'Clear-DnsClientCache', port: 'test-netconnection intranet.northstar.example -port 443' });
  partC(tab, { typedJoin: true, lookup: 'Resolve-DnsName northstar.example' });
  // "Check my work" agrees with the coach on the optional lines too.
  for (const id of [A, B, R]) tab.feedback(id).areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
}

// A typed step on another computer, or before the cable is moved, does not count.
function testTypedStepsNeedTheRightComputerAndOrder() {
  const tab = startLab();
  const steps = tab.coach('hd-m04').steps;
  tab.open(A);
  tab.on(PC_A);
  tab.ps('ipconfig');
  assert.equal(steps[5].check(), false, 'Part A step 6: ipconfig before the cable move does not pass');
  tab.on(PC_B);
  tab.ps('ipconfig /all');
  assert.equal(steps[6].check(), false, 'Part A step 7: ipconfig /all on another computer does not pass');
  tab.on(PC_A);
  tab.ps('ipconfig /all');
  assert.equal(steps[6].check(), true);
}

function testEarlyRenewalNeedsAFreshApipaRead() {
  const tab = startLab();
  const addressStep = tab.coach('hd-m04').steps[5];
  tab.open(A);
  tab.on(PC_A);
  tab.ps('ipconfig');
  tab.run("hdChatAsk('HD-2212', 'move')");
  assert.equal(addressStep.check(), false, 'a read before the link is up does not count');
  tab.ps('ipconfig /renew');
  assert.match(tab.ps('ipconfig'), /10\.20\.10\.141/);
  assert.equal(addressStep.check(), false, 'a read of the renewed lease does not count');
  tab.input('hd-net-mode', 'manual');
  tab.input('hd-net-ip', '169.254.33.10');
  tab.input('hd-net-mask', '255.255.0.0');
  tab.run(`hdNetSaveIp(null, '${PC_A}', 'Ethernet')`);
  assert.match(tab.ps('ipconfig'), /169\.254\.33\.10/);
  assert.equal(addressStep.check(), false, 'manually assigning a link-local address does not count');
  assert.match(addressStep.instruction, /Reset shift/);
  tab.run('hdResetShift()');
  tab.open(A);
  tab.run("hdChatAsk('HD-2212', 'move')");
  tab.on(PC_A);
  assert.match(tab.ps('ipconfig'), /169\.254\.33\.10/);
  assert.equal(addressStep.check(), true, 'a fresh APIPA read after the move counts');
  tab.ps('ipconfig /release');
  tab.ps('ipconfig /renew');
  tab.ps('ipconfig');
  assert.equal(addressStep.check(), true, 'a later lease read preserves the APIPA evidence');
}

// Every step: a route the coach allows and the simulator draws, "Why:" and
// "Success looks like", and none of the words the spec rules out. Every
// command a step asks for sits only behind "Show me the command".
function testEveryStepText() {
  const tab = startLab();
  const coach = tab.coach('hd-m04');
  const allow = plain(coach.allow);
  const views = fs.readFileSync(path.join(UI, 'helpdesk.js'), 'utf8');
  coach.steps.slice(0, 23).forEach((step, index) => {
    assert.ok(step.route, `step ${index + 1} has a route`);
    assert.ok(allow.includes(step.route), `step ${index + 1} route ${step.route} is allowed`);
    assert.ok(views.includes(`VIEWS['${step.route.slice(2)}']`), `step ${index + 1} route ${step.route} exists`);
    assert.match(step.body, /Why: /, `step ${index + 1} why`);
    assert.match(step.body, /Success looks like/, `step ${index + 1} success`);
    assert.equal(typeof step.check, 'function', `step ${index + 1} has a check`);
    // The command is never in the instruction outside "Show me the command".
    const outside = String(step.instruction).replace(/<details>[\s\S]*?<\/details>/g, '');
    assert.doesNotMatch(outside, /<code>\s*(ipconfig|ping|tracert|nslookup|Test-NetConnection|gpupdate)\b/i, `step ${index + 1} names a command outside Show me the command`);
  });
  for (const step of coach.steps) {
    const text = `${step.title} ${step.instruction} ${step.body || ''}`;
    assert.doesNotMatch(text, /lab VM|CompTIA|Module 4\b/i, 'wording');
    assert.doesNotMatch(text, /static address|Manual \(|DHCP Enabled: No/i, 'no static address in the lab (decision 10)');
  }
  assert.doesNotMatch(coach.summary, /lab VM|CompTIA|Module 4\b/i);
  const shown = coach.steps.map((step) => step.instruction).join('\n');
  for (const line of ['ipconfig /all', 'ipconfig /release', 'ipconfig /renew', 'ipconfig /flushdns', 'tracert www.example.com', 'nslookup intranet.northstar.example', 'Test-NetConnection files.northstar.example -Port 445', 'gpupdate /force']) {
    assert.match(shown, new RegExp(`<details><summary>Show me the command</summary>[^]*?${line.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`), line);
  }
  const last = coach.steps[23];
  assert.ok(last.finish, 'the last step is Finish');
  assert.match(last.finish.href, /coachComplete=hd-m04#\/program\/it-support\/module\/9$/);
}

// The coach opens each step's own route when the step starts. Drawing that
// screen on a fresh lab must never pass the step by itself.
function testOpeningAStepsScreenDoesNotPassIt() {
  const steps = startLab().coach('hd-m04').steps;
  steps.slice(0, 23).forEach((step, index) => {
    if (!step.route || typeof step.check !== 'function') return;
    const tab = startLab();
    tab.open(index < 11 ? A : index < 19 ? B : R);
    tab.view(step.route.slice(2));
    assert.equal(tab.coach('hd-m04').steps[index].check(), false, `step ${index + 1} passes when the coach opens ${step.route}`);
  });
}

// The DNS read counts only for the ticket that is open.
function testLookupsCountOnTheirTicket() {
  const tab = startLab();
  const steps = tab.coach('hd-m04').steps;
  tab.open(B);
  tab.run("hdChangeLogOpen('CHG-7802')");
  tab.view('helpdesk/change-log');
  tab.open(A);
  tab.view('helpdesk/dns');
  assert.equal(steps[16].check(), false, 'Part B step 6 does not count DNS read on HD-2212');
  tab.open(B);
  tab.view('helpdesk/dns');
  assert.equal(steps[16].check(), true, 'Part B step 6 counts DNS read on HD-2213');
}

// A wrong OU keeps Part C step 3 open (a laptop joins once). The step's way
// out works: Reset shift on the Dashboard ends the run, and launching the lab
// again starts it fresh, with NS-LT-0416 not joined.
function testWrongOuThenResetStartsFresh() {
  const local = store(); const session = store();
  const tab = startLab(null, local, session);
  const steps = tab.coach('hd-m04').steps;
  assert.match(steps[21].instruction, /<strong>Dashboard<\/strong>, press <strong>Reset shift<\/strong>/);
  assert.match(tab.view('helpdesk/dashboard'), /onclick="hdResetShift\(\)">Reset shift</);
  tab.open(R);
  tab.on(PC_C);
  tab.ps('Add-Computer -DomainName northstar.example -OUPath "CN=Computers"');
  assert.equal(steps[21].check(), false, 'a join into CN=Computers does not pass Part C step 3');
  assert.match(tab.ps('Add-Computer -DomainName northstar.example -OUPath "OU=Logistics,OU=Workstations"'), /already in that domain/, 'a laptop joins once');
  assert.equal(tab.run(`hdMachine('${PC_C}').domain.joined`), true, 'NS-LT-0416 is joined before reset');
  tab.run('hdResetShift()');
  assert.equal(tab.run(`hdMachine('${PC_C}').domain.joined`), false, 'reset immediately clears the join');
  const again = sim(launchUrl(), { local, session });
  assert.equal(again.run('hdState.ticketSet'), 'its-04-guided');
  assert.equal(again.coachStep(), 0, 'the lab starts at Part A step 1');
  assert.equal(again.run(`hdMachine('${PC_C}').domain.joined`), false, 'NS-LT-0416 is not joined');
}

// The optional PowerShell lines pass their screen steps, as the screens do.
function testOptionalScreenLines() {
  const tab = startLab();
  const steps = tab.coach('hd-m04').steps;
  tab.open(A);
  tab.run(`hdChatAsk('${A}', 'light')`);
  tab.on(PC_A);
  tab.ps('Get-NetAdapter');
  assert.equal(steps[2].check(), true, 'Part A step 3 passes from Get-NetAdapter');
  tab.run(`hdChatAsk('${A}', 'move')`);
  tab.on(PC_A);
  tab.ps('ipconfig /release');
  tab.ps('ipconfig /renew');
  tab.ps('Get-NetIPConfiguration');
  assert.equal(steps[7].check(), false, 'Part A step 8 still waits for Edit IP settings after Get-NetIPConfiguration');
  tab.run(`hdNetPanel('${PC_A}', 'edit', 'Ethernet')`);
  assert.equal(steps[7].check(), true, 'Part A step 8 passes from Get-NetIPConfiguration plus Edit IP settings');
  tab.open(B);
  tab.on(PC_B);
  tab.ps('netsh wlan show interfaces');
  assert.equal(steps[13].check(), true, 'Part B step 3 passes from netsh wlan show interfaces');
}

/* ------------------------------------------------------------ fixtures */

// Every adapter in the lab and the practice set is DHCP, written as true
// (spec decision 10): no lab step or practice ticket has a static address.
function testEveryModule9AdapterIsDhcp() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  const sets = plain(tab.run("[HD_COACHED_SETS['its-04-guided'], HD_PRACTICE_SETS['its-04']]"));
  const ids = sets.flatMap((set) => set.tickets);
  assert.equal(ids.length, 11);
  const machines = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ${JSON.stringify(ids)}.includes(t.id)).flatMap((t) => Object.entries((t.console || {}).machines || {}))`));
  assert.ok(machines.length >= 7, 'the lab and practice machines');
  let adapters = 0;
  for (const [name, machine] of machines) {
    for (const adapter of ((machine.network || {}).adapters || [])) {
      adapters += 1;
      assert.ok(adapter.ip && adapter.ip.dhcp === true, `${name} ${adapter.name} is DHCP`);
      assert.ok(!adapter.ip.address || /^(10\.20\.|169\.254\.|192\.168\.0\.34$)/.test(adapter.ip.address), `${name} ${adapter.name} address ${adapter.ip.address}`);
    }
  }
  assert.ok(adapters >= 9, 'every adapter was read');
  // Nothing in the two sets' tickets asks the student to type an IP setting.
  const text = tab.run(`JSON.stringify(HD_TICKET_TEMPLATES.filter((t) => ${JSON.stringify(ids)}.includes(t.id)))`);
  assert.doesNotMatch(text, /dhcp:false|"dhcp":false|Set-NetIPAddress|New-NetIPAddress/);
}

// The CHG-7802 record, the intranet record and NS-APP01's healthy state live in
// Module 9's sets only: the shared lists are unchanged.
function testSharedListsUnchanged() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  assert.equal(tab.run("HD_DNS_RECORDS.some((r) => r.name === 'intranet')"), false);
  assert.equal(tab.run("HD_SERVERS.find((s) => s.name === 'NS-APP01').service"), 'TLS certificate expired');
  for (const name of ['NS-WS-0319', 'NS-LT-0415', 'NS-LT-0416', 'NS-LT-0417', 'NS-LT-0418', 'NS-LT-0419']) assert.equal(tab.run(`HD_COMPUTERS.some((c) => c.name === '${name}')`), false, `${name} is the sets' own`);
  assert.equal(tab.run("HD_USERS.some((u) => /^u-104[0-7]$/.test(u.id))"), false, 'u-1040 to u-1047 are the sets\' own');
  const lab = plain(tab.run("HD_COACHED_SETS['its-04-guided']"));
  assert.equal(lab.changes[0].number, 'CHG-7802');
  assert.ok(lab.directory.dns.some((r) => r.name === 'intranet' && r.value === '10.20.0.50'));
  assert.equal(lab.servers['NS-APP01'].status, 'Online');
}

/* ------------------------------------------------------------ old tickets and runs */

function testOldTicketsLeaveTheQueue() {
  const tab = sim(`${SIM_URL}#/helpdesk/tickets`);
  for (const id of ['HD-2104', 'HD-2105', 'HD-2113']) {
    assert.equal(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === '${id}').ownSet`), true, `${id} is ownSet`);
    assert.equal(tab.run(`hdState.tickets.some((t) => t.id === '${id}')`), false, `${id} not in the shared shift`);
    assert.equal(tab.run(`[...Object.values(HD_PRACTICE_SETS), ...Object.values(HD_COACHED_SETS)].some((s) => s.tickets.includes('${id}'))`), false, `${id} in no set`);
  }
  assert.deepEqual(plain(tab.run("HD_COACHED_SETS['its-04-guided'].tickets")), [A, B, R]);
  assert.equal(tab.run("MODULE_COACHES.filter((c) => c.id === 'hd-m04').length"), 1, 'one hd-m04 coach');
  // The capstone keeps its own copy of HD-2104 (Module 12's rewrite owns it).
  assert.match(fs.readFileSync(path.join(ROOT, 'portal', 'it-support-module-12.js'), 'utf8'), /HD-2104/);
}

// A saved run of the old hd-m04 (on the shared shift) starts fresh; a run on
// the new set is kept.
function testOldCoachRunIsForgotten() {
  const local = store([['mnt.coach.resume', JSON.stringify({ id: 'hd-m04', step: 4, student: STUDENT })]]);
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m04', step: 4 })]]);
  sim(`${SIM_URL}#/helpdesk/tickets`, { local, session });
  assert.equal(local.getItem('mnt.coach.resume'), null, 'old resume dropped');
  assert.equal(session.getItem('mnt.coach.state'), null, 'old step dropped');
  const kept = store();
  const lab = startLab(null, kept);
  lab.open(A);
  lab.triage(A, 'Network', 'Wired connectivity', PC_A, '3', '1');
  at(lab, 1, 'on Part A step 2');
  const again = sim(launchUrl('hd-m04', false), { local: kept, session: lab.session });
  assert.equal(again.run('hdState.ticketSet'), 'its-04-guided');
  assert.equal(again.coachStep(), 1, 'the new run resumes');
}

// The instructor sheet maps Lab 9.1 to the three records; an older attempt
// keeps HD-2104 and HD-2105 (tests/admin-sheets/hdesk.cases.js has the cases).
function testSheetMapping() {
  const source = fs.readFileSync(path.join(ROOT, 'portal', 'admin-sheets', 'hdesk.js'), 'utf8');
  assert.match(source, /'lab-its-04-connectivity': \['HD-2212', 'HD-2213', 'SR-2222'\]/);
  assert.match(source, /EARLIER_TICKETS_BY_LAB = \{[^}]*'lab-its-04-connectivity': \['HD-2104', 'HD-2105'\]/);
  const coaches = fs.readFileSync(path.join(UI, 'helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m04': \['HD-2212', 'HD-2213', 'SR-2222'\]/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m09-guided-lab\.test\.js/);
}

// Every article "Check my work" asks the student to open or attach on a lab
// record is named in an instruction of the coach.
function testEveryArticleCheckIsInTheSteps() {
  const tab = startLab();
  const rules = (consoleBlock) => (consoleBlock.feedback || []).flatMap((area) => area.checks || []).flatMap((rule) => [rule.kb, rule.attached]).filter(Boolean);
  const lab = plain(tab.run(`HD_TICKET_TEMPLATES.filter((t) => ['${A}', '${B}', '${R}'].includes(t.id)).map((t) => t.console)`));
  const labText = tab.coach('hd-m04').steps.map((step) => step.instruction || '').join('\n');
  [...new Set(lab.flatMap(rules))].forEach((id) => assert.ok(labText.includes(id), `hd-m04 names ${id}`));
}

const tests = [testLabOpensOnItsSet, testLab91, testTypedStepsAnyCaseAndOptionalLines, testTypedStepsNeedTheRightComputerAndOrder, testEveryStepText,
  testOpeningAStepsScreenDoesNotPassIt, testLookupsCountOnTheirTicket, testEarlyRenewalNeedsAFreshApipaRead, testWrongOuThenResetStartsFresh, testOptionalScreenLines, testEveryModule9AdapterIsDhcp, testSharedListsUnchanged, testOldTicketsLeaveTheQueue,
  testOldCoachRunIsForgotten, testSheetMapping, testCiRunsThisFile, testEveryArticleCheckIsInTheSteps];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m09-guided-lab: all ${tests.length} passed`);

'use strict';
// Help Desk Module 09 (key its-04) Practice It, Lab 9.2 · Practice tickets (not
// graded): practice set its-04 on lab-its-04-practice-tickets.
//
//   - 9-A HD-2214: Wi-Fi drops on calls; the adapter prefers 2.4 GHz.
//   - 9-B HD-2215 with HD-2216 to HD-2218: the primary fiber is down and the
//     site runs on the cellular backup.
//   - 9-C HD-2219: a join fails on guest Wi-Fi.
//   - 9-D HD-2220: a personal phone can't join Northstar-Corp.
//   - 9-E HD-2221: a remote worker hasn't connected the VPN.
//
// Each ticket is worked along spec section 8.4's path, and "Check my work"
// passes in every area with no critical entry. Feedback only: nothing shows a
// score. KB-0093, KB-0097, KB-0108 and KB-0109 are practice-only and found by
// their keywords; KB-0012 is unchanged. Each ticket's jargon list flags its
// own words in a customer comment. Synthetic data only.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const plain = (value) => JSON.parse(JSON.stringify(value));
const store = () => { const map = new Map(); return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) }; };
function element(id) { return { id, value: '', checked: true, innerHTML: '', dataset: {}, classList: { add() {}, remove() {}, contains: () => false, toggle() {} }, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, focus() {} }; }

function sim(url = 'https://academy.test/sim/?practice=its-04&student=student-m09p0001#/helpdesk/tickets') {
  const u = new URL(url);
  const byId = new Map();
  const toasts = [];
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date,
    location: { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    document: { readyState: 'complete', activeElement: null, getElementById: (id) => byId.get(id) || null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], createElement: () => element('') },
    localStorage: store(), sessionStorage: store(), setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    addEventListener() {}, removeEventListener() {}, confirm: () => true, opener: null, parent: null,
    toast: (text) => toasts.push(text), render: () => {}, navigate: (hash) => { ctx.location.hash = hash; },
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(UI, 'helpdesk-data.js'), 'utf8'), ctx, { filename: 'helpdesk-data.js' });
  vm.runInContext(fs.readFileSync(path.join(UI, 'helpdesk.js'), 'utf8'), ctx, { filename: 'helpdesk.js' });
  vm.runInContext('hdNowMs = () => 1000000;', ctx);
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const tab = {
    ctx, run, input, toasts,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    triage: (id, category, subcategory, ci, impact, urgency) => run(`hdSetClassification(${j(id)}, 'category', ${j(category)}); hdSetClassification(${j(id)}, 'subcategory', ${j(subcategory)}); hdSetClassification(${j(id)}, 'ci', ${j(ci)}); hdSetImpact(${j(id)}, 'impact', ${j(impact)}); hdSetImpact(${j(id)}, 'urgency', ${j(urgency)})`),
    kb: (id, query, article) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); run(`hdKbOpen(${j(id)}, ${j(article)})`); run(`hdKbAttach(${j(id)}, ${j(article)})`); },
    search: (id, query) => { input('hd-kb-input', query); run(`hdKbSearch({ preventDefault() {} }, ${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    resolve: (id, code) => {
      run(`hdTransitionTicket(${j(id)}, 'In Progress')`);
      run(`hdSetResolutionCode(${j(id)}, ${j(code)})`);
      input('hd-resolution-notes', 'Done as the note says.');
      run(`hdTransitionTicket(${j(id)}, 'Resolved')`);
    },
    on: (computer) => run(`hdSelectComputer(${j(computer)})`),
    ps: (command) => { input('hd-ps-input', command); run('hdRunPowerShell({ preventDefault() {} })'); return run('hdState.powershell.slice(-1)[0].text'); },
    feedback: (id) => plain(run(`hdConsoleFeedback(hdTicketById(${j(id)}))`)),
  };
  return tab;
}
const IDS = ['HD-2214', 'HD-2215', 'HD-2216', 'HD-2217', 'HD-2218', 'HD-2219', 'HD-2220', 'HD-2221'];
function assertAllAreasOk(tab, id) {
  const feedback = tab.feedback(id);
  assert.ok(feedback, `${id} has feedback`);
  feedback.areas.forEach((area) => assert.ok(area.ok, `${id} ${area.area}: ${area.text}`));
  assert.deepEqual(feedback.critical, [], `${id} no critical entry`);
}

/* ------------------------------------------------------------ the set */
function testSetOpens() {
  const tab = sim();
  assert.equal(tab.run('HD_PRACTICE_SET && HD_PRACTICE_SET.key'), 'its-04');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')).sort(), [...IDS].sort());
  const numbers = IDS.map((id) => tab.ticket(id).number);
  assert.deepEqual(numbers, ['INC0010525', 'INC0010526', 'INC0010527', 'INC0010528', 'INC0010529', 'INC0010530', 'INC0010531', 'INC0010532']);
  const set = plain(tab.run("HD_PRACTICE_SETS['its-04']"));
  assert.deepEqual(set.complete, ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221']);
  // Feedback only: no ticket or feedback line has points or a score.
  const text = tab.run(`JSON.stringify(HD_TICKET_TEMPLATES.filter((t) => ${j(IDS)}.includes(t.id)))`);
  assert.doesNotMatch(text, /"points"|"score"|\bpoints?\b.*\/\s*100/i);
  assert.doesNotMatch(text, /lab VM|CompTIA|Module 4\b/i);
  for (const id of ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221']) {
    const html = tab.open(id);
    assert.doesNotMatch(html, /\b\d+\s*\/\s*100\b|Score:/, `${id} shows no score`);
  }
}
function j(value) { return JSON.stringify(value); }

// Every "Critical (feedback only)" line from spec section 8.4 is in the ticket's feedback.
function testCriticalLines() {
  const tab = sim();
  const critical = {
    'HD-2214': ['changing the setting without recording it or telling the user', 'restarting the access point'],
    'HD-2215': ['treating it as four separate single-user tickets', 'restarting a router or the firewall'],
    'HD-2219': ['joining into the default Computers container', 'using your own or the user\'s account'],
    'HD-2220': ['sharing any network credential, key or certificate', 'putting a personal phone on Northstar-Corp'],
    'HD-2221': ['changing his home router or his laptop\'s address settings'],
  };
  for (const [id, lines] of Object.entries(critical)) {
    const text = tab.run(`JSON.stringify(hdTicketById(${j(id)}).console.feedback)`);
    assert.match(text, /Critical \(feedback only\)/, `${id} names its critical line`);
    lines.forEach((line) => assert.ok(text.includes(line), `${id}: ${line}`));
  }
}

/* ------------------------------------------------------------ knowledge base */
function testKnowledgeBase() {
  const tab = sim();
  const kb = plain(tab.run('HD_ITS04_KB_ARTICLES'));
  assert.deepEqual(kb.map((a) => a.id).sort(), ['KB-0093', 'KB-0097', 'KB-0108', 'KB-0109']);
  kb.forEach((a) => { assert.equal(a.practiceOnly, true, `${a.id} practice only`); assert.equal(a.audience, 'Service Desk'); assert.equal(a.updated, '2026-08-20', `${a.id} dated on the shift clock`); });
  assert.equal(tab.run("HD_KB_ARTICLES.some((a) => ['KB-0093', 'KB-0097', 'KB-0108', 'KB-0109'].includes(a.id))"), false, 'not in the shared list');
  // KB-0012 is unchanged.
  const kb12 = tab.run("JSON.stringify(HD_KB_ARTICLES.find((a) => a.id === 'KB-0012'))");
  assert.equal(crypto.createHash('sha256').update(kb12).digest('hex').slice(0, 16), crypto.createHash('sha256').update(JSON.stringify({ id: 'KB-0012', title: 'Diagnose an APIPA address on Windows', category: 'Networking', updated: '2026-08-02', audience: 'Service Desk', summary: 'Validate link state, DHCP reachability, conflicting adapters, and lease renewal before network escalation.' })).digest('hex').slice(0, 16));
  // Found by their keywords, from a ticket of the set.
  const finds = { 'KB-0108': ['no internet', 'apipa', 'can\'t be reached'], 'KB-0093': ['personal phone', 'byod', 'northstar-corp'], 'KB-0097': ['domain join', 'could not be contacted', 'provisioning'], 'KB-0109': ['vpn', 'working from home', 'sales drive'] };
  tab.open('HD-2214');
  for (const [id, words] of Object.entries(finds)) words.forEach((word) => assert.match(tab.search('HD-2214', word), new RegExp(`data-kb="${id}"`), `${id} found by "${word}"`));
  // The rules the spec sets on the articles.
  const byId = Object.fromEntries(kb.map((a) => [a.id, a.summary]));
  assert.match(byId['KB-0097'], /never type a password/i);
  assert.match(byId['KB-0108'], /Never restart a switch, router, access point or server/);
  assert.match(byId['KB-0093'], /there is no password to give anyone/i);
  // A Prove shift never gets them.
  assert.equal(tab.run("Object.values(HD_PROVE_SHIFTS).some((s) => JSON.stringify(s).includes('KB-0108'))"), false);
}

/* ------------------------------------------------------------ 9-A */
function test9A(tab = sim()) {
  const id = 'HD-2214'; const pc = 'NS-LT-0417';
  tab.open(id);
  tab.triage(id, 'Network', 'Wireless', pc, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.run(`hdChatAsk('${id}', 'team')`);
  tab.run(`hdNetPanel('${pc}', 'wifi', 'Wi-Fi')`);
  assert.match(tab.view('helpdesk/settings-network'), /2\.4 GHz/);
  tab.on(pc);
  const before = tab.ps('ping 10.20.10.1 -n 20');
  assert.match(before, /time=180ms/);
  assert.match(before, /Lost = 2/);
  tab.kb(id, 'slow', 'KB-0108');
  tab.run(`hdOpenMachineScreen('${pc}', 'device-manager')`);
  tab.run(`hdChatAsk('${id}', 'tell')`);
  tab.input('hd-dev-band', 'Prefer 5GHz band');
  tab.run(`hdDeviceAdvancedSet('${pc}', 'wifi')`);
  tab.on(pc);
  const after = tab.ps('ping 10.20.10.1 -n 20');
  assert.match(after, /Lost = 0/);
  assert.match(tab.ps('netsh wlan show interfaces'), /5 GHz|5GHz/);
  tab.run(`hdChatAsk('${id}', 'call')`);
  tab.open(id);
  tab.note(id, 'Reported: Teams calls break up and Wi-Fi drops briefly, mostly at lunchtime; sits by the kitchen; team fine.\nTried: one user; NS-LT-0417 on Northstar-Corp 2.4 GHz channel 6 (teammates on 5 GHz); ping to gateway ×20 varied 2–180 ms with 2 lost; Wi-Fi adapter\'s Preferred band was "Prefer 2.4GHz band" (recorded); told Bianca, changed it to "Prefer 5GHz band".\nResult: reconnected on 5 GHz channel 44; ping ×20 steady 2–4 ms; test call clear.');
  tab.comment(id, 'Hi Bianca, your calls should be clear now. Your laptop was set to use the slower, more crowded kind of Wi-Fi, which the kitchen microwave interferes with around lunchtime. We\'ve set it to use the faster kind instead, and the test call sounded good. If it happens again, tell us the time and we\'ll look further. – Riley');
  tab.resolve(id, 'Solution provided');
  assertAllAreasOk(tab, id);
}

/* ------------------------------------------------------------ 9-B */
function test9B(tab = sim()) {
  const id = 'HD-2215'; const pc = 'NS-WS-0233';
  tab.open(id);
  tab.triage(id, 'Network', 'Internet connectivity', 'Internet – primary circuit', '1', '2');
  assert.equal(tab.ticket(id).priority, 'P2');
  for (const child of ['HD-2216', 'HD-2217', 'HD-2218']) { tab.open(child); tab.run(`hdLinkParent('${child}', '${id}')`); assert.equal(tab.ticket(child).parentId, id); }
  tab.open(id);
  tab.on(pc);
  assert.match(tab.ps('ping 10.20.70.1'), /Reply from 10\.20\.70\.1/);
  assert.match(tab.ps('ping files.northstar.example'), /Reply from 10\.20\.0\.30/);
  assert.match(tab.ps('ping www.example.com'), /time=(19\d|2[0-4]\d)ms/);
  const route = tab.ps('tracert www.example.com');
  assert.match(route, /nsrtr-backup-5g \[10\.20\.255\.6\]/);
  assert.doesNotMatch(route, /nsrtr-fiber/);
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /TcpTestSucceeded : True/);
  tab.open(id);
  tab.run(`hdEvidenceOpen('${id}', 'circuit')`);
  assert.match(tab.open(id), /Down since 09:12[\s\S]*Active, about 40 Mbps[\s\S]*62% of the monthly data cap/);
  tab.kb(id, 'slow', 'KB-0108');
  tab.note(id, 'Reported: internet very slow for many users since about 09:15 (Operations, Customer Service, Marketing); internal systems fine; 4 tickets (HD-2216 to HD-2218 linked).\nTried: from NS-WS-0233, gateway and files reply in 1 ms; www.example.com 190–240 ms; tracert leaves through nsrtr-backup-5g, not nsrtr-fiber; files:445 answers. Network Operations status: primary fiber down since 09:12, on the cellular backup (40 Mbps, 62% of the data cap used).\nResult: escalated to Network Operations at P2 with the evidence; users told to pause large uploads and video.\nNext action: Network Operations with the provider; Service Desk sends the next update to all four by 10:00.');
  tab.comment(id, 'Hi, we know the internet is slow for everyone at the moment. Our main internet line is down, and we\'re running on our backup connection, which is slower and has a monthly limit. Our network team is working with the provider. Everything inside Northstar, including the warehouse system and shared drives, is working normally. Please hold off on large uploads and video until it\'s fixed. We\'ll update you by 10:00. – Riley');
  tab.run(`hdMatrixAssignGroup('${id}', 'Network Operations')`);
  assert.equal(tab.ticket(id).assignmentGroup, 'Network Operations');
  assertAllAreasOk(tab, id);
  const done = plain(tab.run("HD_PRACTICE_SETS['its-04'].done['HD-2215']"));
  assert.ok(done.every((rule) => tab.run(`hdConsoleRule(hdTicketById('${id}'), ${j(rule)})`)), '9-B counts as done once with Network Operations and noted');
  assert.notEqual(tab.ticket(id).status, 'Resolved', '9-B stays open with Network Operations');
}

/* ------------------------------------------------------------ 9-C */
function test9C(tab = sim()) {
  const id = 'HD-2219'; const pc = 'NS-LT-0418';
  tab.open(id);
  tab.triage(id, 'Hardware', 'New device setup', pc, '3', '1');
  assert.equal(tab.ticket(id).priority, 'P3');
  tab.on(pc);
  assert.match(tab.ps('ipconfig /all'), /Northstar-Guest|10\.20\.90\.61/);
  assert.match(tab.ps('nslookup northstar.example'), /Non-existent domain/);
  // A join from the guest Wi-Fi fails with Windows' message.
  tab.open(id);
  tab.kb(id, 'join', 'KB-0097');
  tab.run(`hdNetForget('${pc}', 'Wi-Fi', 'Northstar-Guest')`);
  tab.run(`hdConsoleAction('${id}', 'bench-cable')`);
  tab.on(pc);
  assert.match(tab.ps('ipconfig /all'), /10\.20\.10\.209\(Preferred\)[\s\S]*DNS Servers \. \. \. \. \. \. \. \. \. \. \. : 10\.20\.0\.10/);
  assert.match(tab.ps('nslookup northstar.example'), /10\.20\.0\.10[\s\S]*10\.20\.0\.11/);
  tab.open(id);
  tab.run(`hdOpenMachineScreen('${pc}', 'settings-about')`);
  tab.run(`hdJoinStart('${pc}')`);
  tab.input('hd-join-domain', 'northstar.example');
  tab.run(`hdJoinDomain({ preventDefault() {} }, '${pc}')`);
  tab.run(`hdJoinAccount('${pc}')`);
  tab.input('hd-join-ou', 'OU=Marketing,OU=Workstations');
  tab.run(`hdJoinOu({ preventDefault() {} }, '${pc}')`);
  tab.run(`hdJoinRestart('${pc}')`);
  tab.on(pc);
  assert.match(tab.ps('gpupdate /force'), /completed successfully/);
  tab.open(id);
  tab.run(`hdAdOpenComputer('${pc}')`);
  tab.note(id, 'Reported: new starter laptop NS-LT-0418 failed to join ("AD DC … could not be contacted") per Desktop Support\'s note; it was on Northstar-Guest; new starter at 11:00.\nTried: ipconfig /all showed guest Wi-Fi with DNS 10.20.90.1; nslookup northstar.example failed. Forgot Northstar-Guest; wired at the bench: DNS 10.20.0.10, nslookup returned both domain controllers. Joined with the provisioning account per KB-0097 into OU=Marketing,OU=Workstations; restarted; gpupdate /force completed.\nResult: NS-LT-0418 in the Marketing OU; ready at 10:35 for the 11:00 start.');
  tab.comment(id, 'Hi Rosa, the laptop is ready for your new starter at 11. "Joining" means registering the laptop with Northstar\'s company network, so your new starter can sign in with their work account and get all the usual settings. It had been set up on the guest Wi-Fi, which can\'t reach that system. We connected it to the company network and finished the setup. – Riley');
  tab.resolve(id, 'Solution provided');
  assertAllAreasOk(tab, id);
}
// 9-C's join, tried first from the guest Wi-Fi, fails with Windows' exact message.
function test9CJoinOnGuestFails() {
  const tab = sim(); const id = 'HD-2219'; const pc = 'NS-LT-0418';
  tab.open(id);
  tab.run(`hdOpenMachineScreen('${pc}', 'settings-about')`);
  tab.run(`hdJoinStart('${pc}')`);
  tab.input('hd-join-domain', 'northstar.example');
  tab.run(`hdJoinDomain({ preventDefault() {} }, '${pc}')`);
  assert.match(tab.view('helpdesk/settings-about'), /An Active Directory Domain Controller \(AD DC\) for the domain "northstar\.example" could not be contacted\.|An Active Directory Domain Controller \(AD DC\) for the domain &quot;northstar\.example&quot; could not be contacted\./);
}

/* ------------------------------------------------------------ 9-D */
function test9D(tab = sim()) {
  const id = 'HD-2220'; const phone = 'zlin-phone';
  tab.open(id);
  tab.triage(id, 'Network', 'Wireless – mobile', 'Northstar-Corp (Wi-Fi)', '3', '3');
  assert.equal(tab.ticket(id).priority, 'P5');
  tab.run(`hdChatAsk('${id}', 'phone')`);
  tab.run(`hdPhoneOpen('${phone}', 'wifi')`);
  tab.view('helpdesk/phone');
  tab.run(`hdPhoneWifiJoin('${phone}', 'Northstar-Corp')`);
  assert.match(tab.view('helpdesk/phone'), /data-hd-phone-prompt="enterprise"/);
  tab.run('hdPhoneWifiCancel()');
  tab.kb(id, 'personal phone', 'KB-0093');
  tab.run(`hdPhoneWifiJoin('${phone}', 'Northstar-Guest')`);
  tab.run(`hdPhoneWifiPassphrase('${phone}', 'Northstar-Guest')`);
  assert.match(tab.view('helpdesk/phone'), /Connected: Northstar-Guest/);
  tab.run(`hdPhoneOpen('${phone}', 'outlook')`);
  tab.run(`hdPhoneOutlookAdd('${phone}')`);
  tab.run(`hdChatAsk('${id}', 'mail')`);
  tab.open(id);
  tab.note(id, 'Reported: personal iPhone can\'t join Northstar-Corp (asks for username and certificate); asked for the password.\nTried: personal device, not in Intune; Northstar-Corp is certificate-based for company devices only (KB-0093); guided Zoe to Northstar-Guest and to Outlook and Teams with app protection.\nResult: Zoe confirmed mail and Teams work on her phone.');
  tab.comment(id, 'Hi Zoe, the Northstar-Corp Wi-Fi only works on company-managed phones, which get a security certificate automatically, so there isn\'t a password we can share. Your personal phone uses Northstar-Guest instead (today\'s code is on the reception screen), and Outlook and Teams now have your work email and chat. The work PIN keeps company data separate from your personal things. – Riley');
  tab.resolve(id, 'Solution provided');
  assertAllAreasOk(tab, id);
}

/* ------------------------------------------------------------ 9-E */
function test9E(tab = sim()) {
  const id = 'HD-2221'; const pc = 'NS-LT-0419';
  tab.open(id);
  tab.triage(id, 'Network', 'VPN / remote access', pc, '3', '2');
  assert.equal(tab.ticket(id).priority, 'P4');
  tab.on(pc);
  assert.match(tab.ps('ipconfig /all'), /192\.168\.0\.34[\s\S]*Unknown adapter Northstar VPN:\n\n   Media State \. \. \. \. \. \. \. \. \. \. \. : Media disconnected/);
  assert.match(tab.ps('nslookup intranet.northstar.example'), /Non-existent domain/);
  tab.open(id);
  tab.run(`hdOpenMachineScreen('${pc}', 'vpn-client')`);
  assert.match(tab.view('helpdesk/vpn-client'), /data-hd-vpn="Disconnected"/);
  tab.kb(id, 'vpn', 'KB-0109');
  tab.run(`hdVpnConnect('${pc}')`);
  tab.run(`hdVpnApprove('${pc}')`);
  assert.match(tab.view('helpdesk/vpn-client'), /data-hd-vpn="Connected"/);
  tab.on(pc);
  assert.match(tab.ps('ipconfig /all'), /10\.20\.250\.37\(Preferred\)/);
  assert.match(tab.ps('nslookup intranet.northstar.example'), /10\.20\.0\.50/);
  assert.match(tab.ps('Test-NetConnection files.northstar.example -Port 445'), /TcpTestSucceeded : True/);
  tab.run(`hdChatAsk('${id}', 'open')`);
  tab.open(id);
  tab.note(id, 'Reported: working from home for the first time; email and web fine, Sales share and intranet "can\'t be found"; fine yesterday in the office.\nTried: home Wi-Fi with DHCP (192.168.0.34), DNS is the home router; VPN adapter disconnected; nslookup intranet failed via 192.168.0.1. Connected Northstar VPN Client: VPN adapter 10.20.250.37, company DNS; nslookup intranet → 10.20.0.50; files:445 answers.\nResult: Gabriel opened the Sales share and the intranet; KB-0109 sent.');
  tab.comment(id, 'Hi Gabriel, you\'re all set. Company drives and the intranet only open inside Northstar\'s network, so from home the laptop needs the Northstar VPN app connected first. We\'ve connected it, and your drive and the intranet are open. I\'ve sent you a short guide for next time: connect the VPN first, then open your files. – Riley');
  tab.resolve(id, 'Solution provided');
  assertAllAreasOk(tab, id);
}

// All five worked in one shift: the set counts as complete (Lab 9.2's record).
function testWholeSetCompletes() {
  const tab = sim();
  assert.equal(tab.run('hdPracticeClosed()'), false, 'not complete at the start');
  [test9A, test9B, test9C, test9D, test9E].forEach((walk) => walk(tab));
  assert.equal(tab.run('hdPracticeClosed()'), true, 'complete once all five are done');
}

/* ------------------------------------------------------------ wording */
// Each ticket's jargon list flags its own words in a customer comment, and the
// spec's model comment passes it.
function testJargonFlagsEachList() {
  const tab = sim();
  for (const id of ['HD-2212', 'HD-2213', 'HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221']) {
    const list = plain(tab.run(`HD_TICKET_TEMPLATES.find((t) => t.id === ${j(id)}).console.notes.jargon`));
    assert.ok(list.length >= 8, `${id} has a jargon list`);
    for (const word of list) assert.ok(plain(tab.run(`hdJargonFound(${j(`We checked the ${word} for you.`)}, ${j(list)})`)).includes(word), `${id}: "${word}" is flagged`);
    assert.deepEqual(plain(tab.run(`hdJargonFound('Everything is working again, thank you for your patience.', ${j(list)})`)), [], `${id}: a plain sentence passes`);
  }
  // Part B's list names every word spec step B8 rules out.
  const partB = plain(tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-2213').console.notes.jargon"));
  ['DNS', 'cache', 'flush', 'IP', '10.20', 'CHG'].forEach((word) => assert.ok(partB.includes(word), `Part B flags ${word}`));
}

// Tier 1 changes nothing shared: no practice ticket's feedback asks for a
// restart of network equipment or a server, or a DHCP or DNS change on a server.
function testNothingShared() {
  const tab = sim();
  const text = tab.run(`JSON.stringify(HD_TICKET_TEMPLATES.filter((t) => ${j([...IDS, 'HD-2212', 'HD-2213', 'SR-2222'])}.includes(t.id)).map((t) => (t.console.feedback || []).map((a) => [a.good, ...(a.checks || []).map((c) => c.missing)])))`);
  assert.doesNotMatch(text, /(restart|reboot) (the |a )?(switch|router|access point|firewall|server)(?![^"]*(never|not))/i);
  assert.doesNotMatch(text, /Set-DnsServer|Add-DhcpServer|Set-DhcpServer/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin', 'ci-check.sh'), 'utf8'), /node tests\/hdesk-m09-practice-tickets\.test\.js/);
}

const alone = (walk) => Object.defineProperty(() => walk(), 'name', { value: walk.name });
const tests = [testSetOpens, testCriticalLines, testKnowledgeBase, alone(test9A), alone(test9B), alone(test9C), test9CJoinOnGuestFails, alone(test9D), alone(test9E), testWholeSetCompletes, testJargonFlagsEachList, testNothingShared, testCiRunsThisFile];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m09-practice-tickets: all ${tests.length} passed`);

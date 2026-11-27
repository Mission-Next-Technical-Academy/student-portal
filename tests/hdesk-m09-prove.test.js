// Module 9 (key its-04) Prove It: one ticket on Module 3's one-ticket form
// with a key-finding note and a chat with the user, worked on one laptop's
// network screens and typed commands, and the knowledge base (ui/helpdesk.js,
// HD_PROVE_SHIFTS['its-04']), and the course page's side of it
// (portal/it-support-shared.js: the cleaner and the review panel;
// portal/it-support-module-04.js: the Prove card and the submit message).
//
//   - A fresh shift: one ticket, INC number only, empty fields, the shift
//     clock, no coach, no hints, no practice wording, no request or team card.
//   - The chat: neutral ids; a message with afterSeen is offered only once
//     its screen was opened; a question with replyWhen answers from the
//     laptop and is offered again once the laptop matches.
//   - Typed commands are command_run events on the laptop, with their time;
//     a ticked step that names a command adds none.
//   - The package carries a small summary of the laptop's adapters
//     (machine.adapters), and a returned attempt in another browser gets the
//     laptop back as the student left it.
//   - Older Prove shifts: no summary, no chat change.
//   - The course page keeps the work; the instructor reads the writing in
//     full, every action and every command; the page submits through
//     recordLabAttempt and a failed write saves nothing.
//
// Structure only: nothing here says which choice, screen, step or command is
// right. Names are read from the shift data; writing is made up.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const UI = path.join(ROOT, 'ui');
const SOURCES = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js']
  .map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const LAB = 'lab-its-04-prove-it';
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message);
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const j = (value) => JSON.stringify(value);

/* --------------------------------------------------------------- simulator */
const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, value: '', textContent: '', disabled: false,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener() {}, querySelector: () => element(''), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}
function sim(moduleKey, student, local = store(), session = store()) {
  const u = new URL(`https://academy.test/sim/?prove=${moduleKey}&student=${student}#/helpdesk/tickets`);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  const toasts = [];
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const document = {
    readyState: 'loading', body, activeElement: null,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
    getElementById: (id) => byId.get(id) || null, createElement: () => element(''), querySelector: () => null, querySelectorAll: () => [],
  };
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location, document,
    history: { state: null, replaceState() {} },
    localStorage: local, sessionStorage: session,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    opener: null, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {},
    toast: (text) => toasts.push(text), render() {},
    escHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    VIEWS: {}, PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => { location.hash = hash; };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  return {
    ctx, run, local, byId, toasts,
    view: (route) => run(`VIEWS[${j(route)}]()`),
    prove: () => plain(run('hdState.prove')),
    submitState: () => plain(run('hdProveSubmitState()')),
    coachPanel: () => (byId.get('coach-panel') || { innerHTML: '' }).innerHTML,
    events: (type) => plain(run(`hdState.prove.events.filter((e) => e.type === ${j(type)})`)),
    ps: (command) => {
      byId.set('hd-ps-input', { id: 'hd-ps-input', value: command });
      run('hdRunPowerShell({ preventDefault() {} })');
      return run('hdState.powershell.slice(-1)[0].text');
    },
    // Edit IP settings › Automatic (DHCP) on one adapter, as the screen does.
    automatic: (computer, adapter) => {
      byId.set('hd-net-mode', { id: 'hd-net-mode', value: 'dhcp' });
      run(`hdNetPanel(${j(computer)}, 'edit', ${j(adapter)})`);
      run(`hdNetSaveIp({ preventDefault() {} }, ${j(computer)}, ${j(adapter)})`);
    },
  };
}
const SHIFT = sim('its-04', 'probe').run("JSON.parse(JSON.stringify(HD_PROVE_SHIFTS['its-04']))");
const SPEC = SHIFT.tickets[0];
const TID = SPEC.id;
const PC = SHIFT.selectedComputer;
const QUESTIONS = SPEC.console.caller.questions;
const SEEN_Q = QUESTIONS.find((q) => q.afterSeen);
const WHEN_Q = QUESTIONS.find((q) => Array.isArray(q.replyWhen));
const ADAPTERS = SHIFT.machines[PC].network.adapters;
const WIFI = ADAPTERS.find((a) => a.kind === 'Wi-Fi');
const WIRED = ADAPTERS.find((a) => a.kind !== 'Wi-Fi');
const CLASSES = sim('its-04', 'probe2').run('HD_PROVE_CLASSES.slice()');
const TEAMS = sim('its-04', 'probe3').run('HD_ASSIGNMENT_GROUPS.slice()');
const ticketView = (tab) => { tab.run('hdState.selectedTicketId = hdState.tickets[0].id'); return tab.view('helpdesk/ticket'); };
const chatCard = (tab) => tab.run('hdConsoleChatCard(hdState.tickets[0])');
const WRITING = { keyFinding: 'Synthetic finding K: two made-up facts linked.', resolutionNote: 'Synthetic note A: Reported / Tried / Result, all made up.', userReply: 'Synthetic note B: a made-up reply.' };
const ask = (tab, id) => tab.run(`hdChatAsk(hdState.tickets[0].id, ${j(id)})`);
function fill(tab) {
  tab.run('hdProveAssign(hdState.tickets[0].id)');
  tab.ctx.hdProveSetField('ticketClass', CLASSES[0]);
  tab.ctx.hdProveSetField('category', SPEC.categoryOptions[0]);
  tab.ctx.hdProveSetField('impact', '2');
  tab.ctx.hdProveSetField('urgency', '2');
  tab.ctx.hdProveSetField('group', TEAMS[0]);
  tab.ctx.hdProveChoose('diagnosis', SPEC.diagnosisOptions[0]);
  tab.ctx.hdProveChoose('decision', 'Resolve');
  [SPEC.pathPool[0].id, SPEC.pathPool[3].id].forEach((id) => tab.ctx.hdProveToggleStep(id, true));
  Object.entries(WRITING).forEach(([field, text]) => tab.ctx.hdProveText(field, text));
  tab.run('hdProveSetCode(hdState.tickets[0].id, HD_PROVE_RESOLUTION_CODES[0]); hdProveClose(hdState.tickets[0].id)');
}
// The replyWhen condition's machine values, set on the laptop directly.
function meetWhen(tab, question) {
  const rules = question.replyWhen[0].when.all || [question.replyWhen[0].when];
  rules.forEach(({ machine }) => {
    const parts = machine.path.map((p) => `[${j(p)}]`).join('');
    tab.run(`hdState.machines[${j(machine.computer)}]${parts} = ${j(machine.value)}`);
  });
}

/* ------------------------------------------------------------------- tests */

function testFreshShift() {
  const session = store([['mnt.coach.state', JSON.stringify({ id: 'hd-m04', step: 2 })]]);
  const tab = sim('its-04', 'stu-fresh', store(), session);
  tab.run("if (typeof coachAfterRender === 'function') coachAfterRender()");
  assert.equal(tab.run('hdState.mode'), 'prove');
  assert.equal(tab.run('hdState.tickets.length'), 1, 'one ticket');
  assert.equal(SHIFT.labKey, LAB);
  assert.equal(SHIFT.rubricVersion, 'hdesk-its-04-prove-v1');
  assert.equal(SHIFT.timeBoxMinutes, 35, 'the coaching time box (decision 1)');
  assert.equal(SHIFT.networkSummary, true);
  same(tab.prove().fields, { ticketClass: '', category: '', impact: '', urgency: '', priority: '', group: '' }, 'every field starts empty');
  assert.equal(tab.run('hdShiftNow().toISOString()'), new Date(SHIFT.now).toISOString(), 'the shift clock');
  assert.equal(tab.run('hdState.selectedComputer'), PC, 'the caller\'s laptop is selected');
  const html = ticketView(tab);
  assert.match(html, new RegExp(SPEC.number));
  assert.ok(!words(html).includes(TID), 'the ticket never shows the internal id');
  ['Check my work', 'Your note needs', 'Hint', 'hd-coach', 'Show me the command'].forEach((text) => assert.ok(!html.includes(text), `no ${text}`));
  assert.equal(tab.coachPanel(), '', 'no coach panel');
  assert.match(html, /data-hd-prove-writing="keyFinding"/, 'the key-finding box');
  assert.doesNotMatch(html, /hd-convert|hd-team-messages|data-hd-request=/, 'no request or team card (ticketActions is off)');
  assert.equal(SPEC.diagnosisOptions.length, 4);
  assert.equal(new Set(SPEC.pathPool.map((step) => step.id)).size, SPEC.pathPool.length, 'step ids are unique');
  assert.ok(SPEC.pathPool.length >= 10, 'a long mixed list of steps');
  assert.ok(SPEC.pathPool.every((step) => !/\d/.test(step.text)), 'no step names an address or a number');
  assert.ok(!tab.run('hdKbArticles().some((a) => a.practiceOnly)'), 'no practice-only article in a Prove It');
  assert.equal(SHIFT.kbArticles, undefined, 'Module 9\'s practice articles stay in Practice');
  assert.ok(tab.run('hdKbArticles().length') > 0, 'the shared knowledge base is there to search');
  // The laptop's network screen is on its tool grid.
  assert.match(tab.run(`hdFeatureToolButtons(${j(PC)})`), /data-hd-tools="settings-network"/);
  assert.deepEqual([...tab.toasts], [], 'no toast');
}

function testChat() {
  assert.ok(QUESTIONS.length >= 4 && QUESTIONS.every((q) => /^q\d+$/.test(q.id)), 'several messages with neutral ids');
  assert.ok(SEEN_Q && WHEN_Q, 'one message waits for a screen, one reply waits for the laptop');
  assert.equal(SPEC.console.caller.limit, undefined, 'no question limit');
  const tab = sim('its-04', 'stu-chat');
  let card = chatCard(tab);
  QUESTIONS.filter((q) => q !== SEEN_Q).forEach((q) => assert.ok(card.includes(`hdChatAsk('${TID}','${q.id}')`), `${q.id} offered`));
  assert.ok(!card.includes(`'${SEEN_Q.id}'`), 'the afterSeen message is not offered at the start');
  ask(tab, SEEN_Q.id);
  same(tab.events('caller_question'), [], 'and cannot be sent before');
  // Another screen on the laptop doesn't offer it; each one it names does.
  tab.run(`hdNetPanel(${j(PC)}, 'hardware', ${j(WIFI.name)})`);
  assert.ok(!chatCard(tab).includes(`'${SEEN_Q.id}'`), 'not after another adapter\'s screen');
  assert.ok(SEEN_Q.afterSeen.keys.length >= 2, 'more than one screen opens it');
  SEEN_Q.afterSeen.keys.forEach((key, index) => {
    const each = sim('its-04', `stu-chat-key-${index}`);
    const [kind, name] = key.split(':');
    each.run(`hdNetPanel(${j(SEEN_Q.afterSeen.computer)}, ${j(kind === 'net-edit' ? 'edit' : 'hardware')}, ${j(name)})`);
    assert.ok(chatCard(each).includes(`hdChatAsk('${TID}','${SEEN_Q.id}')`), `offered once ${key} was seen`);
  });
  // A typed read of every adapter records the same key, so a student who
  // works by command gets the message too, before any typed change.
  const typed = sim('its-04', 'stu-chat-typed');
  typed.ps('ipconfig /all');
  assert.ok(chatCard(typed).includes(`hdChatAsk('${TID}','${SEEN_Q.id}')`), 'offered after a typed read of the adapters');
  const [, adapter] = SEEN_Q.afterSeen.keys[SEEN_Q.afterSeen.keys.length - 1].split(':');
  tab.run(`hdNetPanel(${j(SEEN_Q.afterSeen.computer)}, 'edit', ${j(adapter)})`);
  assert.ok(chatCard(tab).includes(`hdChatAsk('${TID}','${SEEN_Q.id}')`), 'offered once the screen it names was opened');
  ask(tab, SEEN_Q.id);
  const sent = tab.events('caller_question');
  same(sent.map((e) => [e.value, e.label]), [[SEEN_Q.id, SEEN_Q.text]], 'recorded once, by id and text');
  assert.ok(typeof sent[0].at === 'string' && sent[0].at, 'with its time');
  assert.ok(chatCard(tab).includes(tab.run('hdEsc')(SEEN_Q.reply)), 'the reply shows');

  // replyWhen: the plain reply first, then offered again with the laptop's reply.
  ask(tab, WHEN_Q.id);
  assert.ok(chatCard(tab).includes(tab.run('hdEsc')(WHEN_Q.reply)), 'the plain reply before the laptop matches');
  assert.ok(!chatCard(tab).includes(`hdChatAsk('${TID}','${WHEN_Q.id}')`), 'not offered again while the laptop is unchanged');
  meetWhen(tab, WHEN_Q);
  assert.ok(chatCard(tab).includes(`hdChatAsk('${TID}','${WHEN_Q.id}')`), 'offered again once the laptop matches');
  ask(tab, WHEN_Q.id);
  assert.ok(chatCard(tab).includes(tab.run('hdEsc')(WHEN_Q.replyWhen[0].reply)), 'the reply from the laptop');
  assert.equal(tab.events('caller_question').filter((e) => e.value === WHEN_Q.id).length, 2, 'each ask is recorded');
  // Submitted: nothing more is sent.
  tab.run("hdProveServer.status = 'waiting'");
  assert.doesNotMatch(chatCard(tab), /hdChatAsk\(/, 'nothing offered after submit');
}

function testTypedCommands() {
  const tab = sim('its-04', 'stu-typed');
  ['ipconfig /all', 'ping 127.0.0.1', 'nslookup intranet', 'tracert www.example.com'].forEach((command) => {
    const output = tab.ps(command);
    assert.ok(output && !/outside this training shell/.test(output), `${command} answers from the laptop`);
  });
  const runs = tab.events('command_run');
  same(runs.map((e) => [e.command, e.computer]), [['ipconfig /all', PC], ['ping 127.0.0.1', PC], ['nslookup intranet', PC], ['tracert www.example.com', PC]], 'every typed line, on the laptop');
  assert.ok(runs.every((e) => typeof e.at === 'string' && e.at), 'each with its time');
  // Ticking a step that names a command records no command.
  const ticked = sim('its-04', 'stu-ticked');
  SPEC.pathPool.forEach((step) => ticked.ctx.hdProveToggleStep(step.id, true));
  same(ticked.events('command_run'), [], 'no command from a ticked step');
  same(plain(ticked.run('hdProvePackage()')).commands, [], 'and none in the package');
  // A change on a screen is an action on the laptop, with its time.
  tab.automatic(PC, WIRED.name);
  const acts = tab.events('action_taken');
  assert.ok(acts.length >= 1 && acts.every((e) => e.computer === PC && e.at), 'a screen change is an action on the laptop');
}

function testNetworkSummaryAndPrefill() {
  const tab = sim('its-04', 'stu-summary');
  const before = plain(tab.run('hdProvePackage()')).machine;
  same(Object.keys(before), ['adapters'], 'only the adapters');
  same(Object.keys(before.adapters), ADAPTERS.map((a) => a.name), 'every adapter by name');
  Object.values(before.adapters).forEach((a) => assert.equal(typeof a.dhcp, 'boolean'));
  assert.ok(Array.isArray(before.adapters[WIFI.name].known), 'the Wi-Fi adapter lists its known networks');
  tab.automatic(PC, WIRED.name);
  const ssid = WIFI.wifi.known[0].ssid;
  tab.run(`hdNetForget(${j(PC)}, ${j(WIFI.name)}, ${j(ssid)})`);
  const after = plain(tab.run('hdProvePackage()')).machine;
  assert.equal(after.adapters[WIRED.name].dhcp, true, 'the summary follows the screen');
  assert.ok(!after.adapters[WIFI.name].known.includes(ssid), 'a forgotten network is gone');
  assert.ok(JSON.stringify(after).length <= 4096, 'inside the course page\'s 4 KB machine limit');
  // Another browser: the fixture laptop, then the returned attempt's summary on it.
  const other = sim('its-04', 'stu-summary-other');
  other.run(`(() => { const m = hdClone(HD_PROVE_SHIFTS['its-04'].machines[${j(PC)}]); hdProvePrefillNetwork(${j(after)}, m, ${j(PC)}); hdState.machines[${j(PC)}] = m; })()`);
  same(plain(other.run('hdProvePackage()')).machine, after, 'the laptop comes back as the student left it');
  // A summary that changes nothing leaves the fixture as it is.
  const untouched = sim('its-04', 'stu-summary-untouched');
  untouched.run(`(() => { const m = hdClone(HD_PROVE_SHIFTS['its-04'].machines[${j(PC)}]); hdProvePrefillNetwork(${j(before)}, m, ${j(PC)}); hdState.machines[${j(PC)}] = m; })()`);
  same(plain(untouched.run('hdProvePackage()')).machine, before);
}

function testReturnedAttemptKeepsTheLaptop() {
  const tab = sim('its-04', 'stu-return');
  tab.ps('ipconfig /all');
  tab.automatic(PC, WIRED.name);
  const laptop = plain(tab.run('hdProvePackage()')).machine;
  tab.run(`hdProveFreshLog(${j(new Date().toISOString())})`);
  same(tab.prove().events, [], 'the log is empty');
  same(plain(tab.run('hdProvePackage()')).machine, laptop, 'the laptop is as the student left it (Megan, 2026-11-25)');
}

function testReturnedAttemptRestoresManualIp() {
  const tab = sim('its-04', 'stu-manual-ip');
  const settings = {
    [WIRED.name]: { address:'192.0.2.23', mask:'255.255.255.128', gateway:'192.0.2.1', dnsServers:['198.51.100.1', '198.51.100.2'] },
    [WIFI.name]: { address:'203.0.113.23', mask:'255.255.255.0', gateway:'', dnsServers:[] },
  };
  for (const [name, ip] of Object.entries(settings)) {
    const fields = { mode:'manual', ip:ip.address, mask:ip.mask, gw:ip.gateway, dns1:ip.dnsServers[0] || '', dns2:ip.dnsServers[1] || '' };
    for (const [field, value] of Object.entries(fields)) tab.byId.set(`hd-net-${field}`, { value });
    tab.run(`hdNetSaveIp({ preventDefault() {} }, ${j(PC)}, ${j(name)})`);
  }
  const work = plain(tab.run('hdProvePackage()'));
  work.completedAt = new Date().toISOString();
  work.machine = plain(prun('itsProveCleanMachine')(work.machine));
  const reopen = (machine) => {
    const other = sim('its-04', 'stu-manual-ip-other');
    assert.equal(other.run(`hdProvePrefill(${j({ ...work, machine })})`), true);
    return plain(other.run(`hdMachine(${j(PC)}).network.adapters`));
  };
  for (const adapter of reopen(work.machine)) {
    same(adapter.ip, { dhcp:false, ...settings[adapter.name], dhcpServer:'' }, `restores ${adapter.name} in another browser`);
  }
  for (const invalid of [
    { address:'192.0.2.256' },
    { mask:'255.255.255.256' },
    { gateway:'not an address' },
    { dnsServers:['198.51.100.1', '198.51.100.256'] },
  ]) {
    const machine = { adapters:{ [WIRED.name]:{ ...work.machine.adapters[WIRED.name], ...invalid } } };
    same(reopen(machine).find(a => a.name === WIRED.name).ip, WIRED.ip, 'invalid IPv4 settings leave the fixture intact');
  }
  const legacy = { adapters:{ [WIRED.name]:{ dhcp:false, address:settings[WIRED.name].address } } };
  same(reopen(legacy).find(a => a.name === WIRED.name).ip, WIRED.ip, 'an older summary has no mask to restore');
}

function testOlderShiftsUnchanged() {
  ['its-01', 'its-10', 'its-11', 'its-02', 'its-03', 'its-07', 'its-05', 'its-06'].forEach((moduleKey) => {
    const shift = sim(moduleKey, `probe-old-${moduleKey}`).run(`JSON.parse(JSON.stringify(HD_PROVE_SHIFTS[${j(moduleKey)}]))`);
    assert.notEqual(shift.networkSummary, true, `${moduleKey}: no network summary`);
    (shift.tickets || []).forEach((ticket) => ((ticket.console && ticket.console.caller && ticket.console.caller.questions) || [])
      .forEach((q) => assert.ok(!q.afterSeen && !q.replyWhen, `${moduleKey}: no waiting message`)));
  });
  // Edit IP settings records its screen only in a Prove shift.
  const src = SOURCES.find(([name]) => name === 'helpdesk.js')[1];
  assert.match(src, /panel === 'edit' && adapter && HD_PROVE\) hdWinSeen/);
}

function testPackage() {
  const tab = sim('its-04', 'stu-package');
  fill(tab);
  same(tab.run('hdProveMissing()').slice(), [], 'the fill is complete');
  assert.equal(tab.submitState().enabled, true);
  const work = plain(tab.run('hdProvePackage()'));
  assert.equal(work.keyFinding, WRITING.keyFinding);
  assert.equal(work.labKey, LAB);
  assert.equal(work.moduleKey, 'its-04');
  assert.ok(work.machine && work.machine.adapters, 'the laptop summary');
}

/* ------------------------------------------------------------------ portal */
const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const clean = (...args) => plain(prun('itsCleanProveWork')(...args));
const pesc = (text) => prun('esc')(text);

function sampleWork() {
  const tab = sim('its-04', 'stu-sample');
  fill(tab);
  ask(tab, QUESTIONS[0].id);
  tab.ps('ipconfig /all');
  tab.ps('ping 127.0.0.1');
  tab.automatic(PC, WIRED.name);
  return plain(tab.run('hdProvePackage()'));
}

function testPortalKeepsTheWork(work) {
  const { work: saved, reason } = clean(work, 'its-04', LAB);
  assert.equal(reason, undefined);
  assert.equal(saved.fields.priority, prun('ITS_PROVE_MATRIX')['2']['2'], 'Priority is the course page\'s own, from Impact and Urgency');
  assert.equal(saved.keyFinding, WRITING.keyFinding);
  same(saved.machine, work.machine, 'the laptop summary is kept whole');
  same(saved.commands.map((c) => [c.command, c.computer, c.at]), work.commands.map((c) => [c.command, c.computer, c.at]), 'every command with its computer and time');
  same(saved.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.at]), work.events.filter((e) => e.type === 'caller_question').map((e) => [e.value, e.at]), 'the chat, with its times');
  same(saved.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.computer, e.at]), work.events.filter((e) => e.type === 'action_taken').map((e) => [e.value, e.computer, e.at]), 'the actions, with their times');
  assert.equal(saved.logTrimmed, false);
  assert.equal(clean({ ...work, keyFinding: '' }, 'its-04', LAB).reason, 'invalid', 'the key finding is required');
  assert.equal(clean({ ...work, labKey: 'lab-its-06-prove-it', rubricVersion: 'hdesk-its-06-prove-v1' }, 'its-04', LAB).reason, 'invalid', 'refused under another lab key');
  return saved;
}

const LONG = {
  keyFinding: 'Synthetic finding F: <b>made up</b> & linked.',
  resolutionNote: Array.from({ length: 30 }, (_, i) => `Synthetic note C${i}: made-up line <${i}> & more.`).join('\n'),
  userReply: Array.from({ length: 20 }, (_, i) => `Synthetic note D${i}, a made-up reply line.`).join('\n\n'),
};
function testReviewPanel(saved) {
  const row = { id: 'att-m09-1', lab_key: LAB, student_id: '9900000009-HDESK', completed_at: new Date().toISOString(), pass_threshold: 70, result: { ...saved, ...LONG } };
  const html = prun('itsProveReviewPanel')(row);
  assert.match(html, /data-its-prove-shape="matrix"/);
  Object.values(LONG).forEach((text) => assert.ok(html.includes(pesc(text)), 'the writing in full, escaped'));
  assert.ok(!html.includes('<0>') && !html.includes('<b>made up</b>'), 'never raw');
  ['Key finding', 'Work note', 'Reply', 'Questions asked in the chat', 'Commands run', 'Actions in the simulator'].forEach((heading) => assert.ok(html.includes(heading), heading));
  ['Print queues at submit', 'The laptop at submit'].forEach((heading) => assert.ok(!html.includes(heading), `no ${heading}`));
  saved.commands.forEach((c) => assert.ok(html.includes(pesc(c.command)), `command: ${c.command}`));
  saved.events.filter((e) => e.type === 'action_taken').forEach((e) => assert.ok(html.includes(pesc(e.label)), `action: ${e.label}`));
  const rubric = plain(prun(`HDESK_PROVE_RUBRICS['${LAB}']`));
  assert.equal(rubric.version, 'hdesk-its-04-prove-v1');
  assert.equal(rubric.moduleKey, 'its-04');
  same(rubric.competencies.map((c) => c.points), [11, 28, 22, 17, 22], 'the approved weights');
  assert.equal(rubric.competencies.reduce((sum, c) => sum + c.points, 0), 100);
  same(rubric.writing, { keyFinding: 600 });
  assert.equal(rubric.matrixFields, true);
  assert.equal(rubric.machineSummary, false);
  assert.match(rubric.partialCredit, /required typed/);
}

/* ------------------------------------------------------------ Module 9 page */
let signedIn = null;
portal.currentUser = async () => signedIn;
const SIM = new URL(prun('SIM_ORIGIN')).origin;
const HD = prun(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const page = () => prun(`MODULE_LABS['it-support/' + PROGRAMS.find((p) => p.slug === 'it-support').modules['its-04'].number]`);
const studentOf = (user) => prun('LabRuntime').anonymousStudentId(user);
const hdUser = (name) => ({
  userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
  enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
  remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
  latestLabAttemptByKey: {}, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
});
let db;
function freshDb() {
  db = { attempts: [], failInsert: null };
  portal.supabaseCalls.length = 0;
  portal.supabaseResponder = (call) => {
    if (call.table !== 'lab_attempts') return { data: [], error: null };
    if (call.op === 'select') return { data: db.attempts.filter((r) => r.lab_key === call.filters.lab_key).slice().reverse().slice(0, 1), error: null };
    if (db.failInsert) return { data: null, error: { message: db.failInsert } };
    const latest = db.attempts.filter((r) => r.lab_key === call.payload.lab_key).pop();
    if (latest && (!latest.reviewed_at || !latest.redo_requested)) return { data: null, error: { code: 'P0001', message: 'refused' } };
    db.attempts.push({ id: `row-${db.attempts.length + 1}`, reviewed_at: null, redo_requested: false, superseded_at: null, ...call.payload });
    return { data: null, error: null };
  };
}
const flush = async () => { for (let i = 0; i < 12; i += 1) await new Promise((resolve) => setTimeout(resolve, 0)); };
async function quiet(fn) {
  const original = portal.console.error;
  portal.console.error = () => {};
  try { return await fn(); } finally { portal.console.error = original; }
}
async function send(data) {
  const replies = [];
  page().onMessage({ data: plain(data), origin: SIM, source: { postMessage: (reply, origin) => replies.push({ ...plain(reply), origin }) } });
  await flush();
  return replies;
}

async function testModuleNinePageSubmit(work) {
  freshDb();
  const user = hdUser('m09prove');
  signedIn = user;
  const html = page().view(user, HD);
  const start = html.indexOf('id="its04-prove-it"');
  const card = html.slice(start, html.indexOf('</section>', start));
  assert.doesNotMatch(card, /Opens soon/);
  assert.match(card, /Type the checklist’s commands in PowerShell/);
  assert.match(card, /35 minutes/);
  const link = /data-its04-prove-launch href="([^"]+)"/.exec(card);
  assert.ok(link, 'a launch link');
  assert.ok(link[1].replace(/&amp;/g, '&').includes(`?prove=its-04&student=${studentOf(user)}#/helpdesk/tickets`));
  assert.match(card, /rel="opener"/);
  // Lab 9.1 is Practice It now.
  const lab1 = html.slice(html.indexOf('id="its04-lab-9-1"'), html.indexOf('</section>', html.indexOf('id="its04-lab-9-1"')));
  assert.match(lab1, /Practice It · coached/);
  assert.match(lab1, /Practice: not graded/);
  assert.doesNotMatch(lab1, /instructor reviews/i);
  assert.equal(prun("LABS.find((l) => l.key === 'lab-its-04-connectivity').phase"), 'practice');
  assert.notEqual(prun("LABS.find((l) => l.key === 'lab-its-04-prove-it').phase"), 'practice');
  const message = { type: prun('ITS_PROVE_SUBMIT'), id: 'its-04', nonce: 'm09prove-1234', student: studentOf(user), work };
  db.failInsert = 'network';
  const failed = await quiet(() => send(message));
  assert.equal(failed.length, 1);
  assert.equal(failed[0].saved, false);
  assert.equal(failed[0].reason, 'save-failed');
  assert.equal(db.attempts.length, 0, 'nothing saved');
  assert.notEqual(prun('itsLabStatus')(user, LAB), 'waiting', 'not shown as submitted');
  db.failInsert = null;
  const replies = await send(message);
  assert.equal(replies.length, 1);
  assert.equal(replies[0].saved, true);
  assert.equal(replies[0].status, 'waiting');
  const rows = db.attempts.filter((r) => r.lab_key === LAB);
  assert.equal(rows.length, 1, 'one lab_attempts row');
  assert.equal(rows[0].state, 'complete');
  assert.equal(rows[0].score, null, 'no score from the browser');
  const { source, ...stored } = plain(rows[0].result);
  assert.equal(source, 'mnt-prove-submit');
  same(stored, clean(work, 'its-04', LAB).work, 'the cleaned work');
  const after = page().view(user, HD);
  const done = after.slice(after.indexOf('id="its04-prove-it"'));
  const doneCard = done.slice(0, done.indexOf('</section>'));
  assert.doesNotMatch(doneCard, /data-its04-prove-launch/);
  assert.doesNotMatch(doneCard, /\b\d{1,3}\s*\/\s*100\b|score/i, 'no score shown to the student');
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m09-prove\.test\.js$/m);
}

(async () => {
  let failed = 0;
  let passed = 0;
  const report = (name, error) => {
    if (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); } else { passed += 1; console.log(`ok   ${name}`); }
  };
  for (const test of [testFreshShift, testChat, testTypedCommands, testNetworkSummaryAndPrefill, testReturnedAttemptKeepsTheLaptop,
    testReturnedAttemptRestoresManualIp, testOlderShiftsUnchanged, testPackage, testCiRunsThisFile]) {
    try { test(); report(test.name); } catch (error) { report(test.name, error); }
  }
  let work = null;
  try { work = sampleWork(); report('sampleWork'); } catch (error) { report('sampleWork', error); }
  let saved = null;
  if (work) {
    try { saved = testPortalKeepsTheWork(work); report('testPortalKeepsTheWork'); } catch (error) { report('testPortalKeepsTheWork', error); }
  }
  if (saved) {
    try { testReviewPanel(saved); report('testReviewPanel'); } catch (error) { report('testReviewPanel', error); }
  }
  if (work) {
    try { await testModuleNinePageSubmit(work); report('testModuleNinePageSubmit'); } catch (error) { report('testModuleNinePageSubmit', error); }
  }
  if (failed || !saved) { console.error(`hdesk-m09-prove: ${failed} failed, ${passed} passed`); process.exit(1); }
  console.log(`hdesk-m09-prove: all ${passed} passed`);
})();

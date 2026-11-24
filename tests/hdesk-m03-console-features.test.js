'use strict';
/* Help Desk simulator: the communication console features added for
 * Module 3 (key its-11), each switched on per ticket or per practice set
 * (ui/helpdesk.js "Communication features"): a ticket's own clock, the live
 * call or chat with a mood meter, caller details and a callback number, the
 * hold timer, the plain-words check, read-only evidence cards, the handoff
 * note check, the warm handoff, the follow-up time and "Go to follow-up
 * time", the customer comment's time check, a request opened from an
 * incident that stays open, the VIP flag, messages to another team, the
 * "Create new incident" wrong move and a practice set's per-ticket done rules.
 *
 * Every feature is tried on test-only tickets and sets defined here (HD-93xx,
 * never in ui/helpdesk-data.js), and every older ticket must look and behave
 * as before. No Module 3 content: all text below is a made-up test fixture,
 * and the patterns are test data, not a key. Wed = 2026-08-19. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const read = (name) => fs.readFileSync(path.join(UI, name), 'utf8');
const TUE = '2026-08-18'; const WED = '2026-08-19'; const THU = '2026-08-20';
const at = (day, time) => `${day}T${time}:00Z`;
const DESK2 = 'Desktop Support (Tier 2)';
const MC = 'Messaging & Collaboration';

const base = (spec) => ({
  department: 'Operations', category: 'Incident', subcategory: 'General', priority: 'P3', businessImpact: '', sla: '',
  createdMinutesAgo: 10, symptoms: [], logs: [], systemState: [], plausibleCauses: [], correctPath: [],
  hiddenRootCause: '', expectedResolution: '', escalationCriteria: [], ownSet: true, ...spec,
});
const TIME_CHECK = { time: '\\b\\d{1,2}:\\d{2}\\b', promise: '\\b(fixed|working|ready)\\s+by\\s+\\d', promiseLine: 'TEST promise line.', noTimeLine: 'TEST no time line.', moodDown: true, goodLine: 'TEST good comment.' };
// The coached test call: one ticket on a set clock (Wednesday 10:10).
const CALL = base({ id: 'HD-9301', number: 'INC0019301', requester: 'Amir Patel', createdAt: at(WED, '10:10'), description: 'TEST slow laptop',
  console: {
    matrix: {}, notes: { parts: ['reported', 'tried', 'result', 'next'] }, comments: { timeCheck: TIME_CHECK },
    conversation: { name: 'Amir Patel', style: 'phone', mood: 'Frustrated', stages: [
      { id: 'greet', prompt: 'TEST answer the call', choices: [
        { id: 'good', text: 'TEST good greeting', pass: true, mood: 0, reply: 'TEST name and extension' },
        { id: 'bad', text: 'TEST bad greeting', line: 'TEST bad greeting line.' }] },
      { id: 'rant', messages: ['TEST one', 'TEST two', 'TEST three'], gapSeconds: 4, interruptLine: 'TEST interrupt line.', choices: [
        { id: 'kind', text: 'TEST empathy', pass: true, mood: -1, line: 'TEST empathy line.' },
        { id: 'hush', text: 'TEST hush', line: 'TEST hush line.' }] },
    ] },
    intake: { caller: true, callback: true },
    hold: { seconds: 120, ask: 'TEST may I hold?', askReply: 'TEST fine.', back: 'TEST thanks for holding.', unaskedLine: 'TEST unasked line.', overLine: 'TEST over line.' },
    explain: { words: ['TESTWORD', 'I/O'], line: "TEST he won't know '{term}'." },
    evidence: [{ id: 'health', title: 'Test health card', rows: [{ label: 'Disk', value: 'TEST warning' }] }],
    handoff: {}, warmHandoff: true, followUp: { jump: true },
  } });
// The practice test set: three tickets, each on its own clock (Thursday).
const PRACTICE = [
  base({ id: 'HD-9311', number: 'INC0019311', requester: 'Maya Chen', createdAt: at(THU, '13:02'), description: 'TEST email stuck',
    console: { now: at(THU, '13:12'), matrix: {}, comments: true, caller: { name: 'Maya Chen', style: 'phone', questions: [{ id: 'q1', text: 'TEST question', reply: 'TEST answer' }] } } }),
  base({ id: 'HD-9312', number: 'INC0019312', requester: 'Jordan Bell', createdAt: at(THU, '10:50'), description: 'TEST broken laptop',
    console: { now: at(THU, '11:05'), matrix: {}, vip: true, comments: { timeCheck: TIME_CHECK }, followUp: {},
      evidence: [{ id: 'stock', title: 'Test stock card', rows: [{ label: 'Model A', value: '3 in stock' }] }],
      convert: { keepIncident: true, number: 'RITM0019312', items: [{ name: 'Test replacement', approver: 'A manager', fields: [{ id: 'approval', label: 'Approval', options: ['Requested', 'Not needed'] }] }] },
      teamMessages: [{ id: 'desk', to: DESK2, from: 'Desktop Support', text: 'TEST can you set one up?', reply: 'TEST yes, by 07:30.' }] } }),
  base({ id: 'HD-9313', number: 'INC0019313', requester: 'Sofia Martin', createdAt: at(TUE, '09:30'), description: 'TEST nobody called me',
    status: 'Escalated', assignmentGroup: MC, assignedTechnician: MC,
    console: { now: at(THU, '10:20'), matrix: { impact: 2, urgency: 3, respondedAt: at(TUE, '09:50') }, comments: { timeCheck: TIME_CHECK }, followUp: {},
      conversation: { name: 'Sofia Martin', style: 'chat', stages: [{ id: 'first', choices: [{ id: 'quick', text: 'TEST checking now', pass: true }] }] },
      teamMessages: [{ id: 'lead', to: MC, from: 'A. Lead', text: 'TEST please pick this up', reply: 'TEST done, assigned.', assign: 'Test Engineer' }],
      duplicateMove: { text: 'Create new incident', feedback: 'TEST duplicate feedback.' } } }),
];
// A set clock with "Next day", plus one ticket on its own clock.
const CLOCKS = [
  base({ id: 'HD-9321', number: 'INC0019321', requester: 'Noah Williams', createdAt: at(WED, '12:00'), description: 'TEST set clock', console: { matrix: {}, followUp: { jump: true } } }),
  base({ id: 'HD-9322', number: 'INC0019322', requester: 'Luis Ortega', createdAt: at(THU, '08:30'), description: 'TEST own clock', console: { now: at(THU, '09:00'), matrix: {}, followUp: { jump: true } } }),
];
const SETS = {
  coached: { 'test-call': { title: 'Test call', tickets: ['HD-9301'], now: at(WED, '10:10') } },
  practice: {
    'test-comms': { title: 'Test communication tickets', tickets: PRACTICE.map((t) => t.id), queue: true, complete: PRACTICE.map((t) => t.id),
      done: { 'HD-9312': [{ group: DESK2 }, { requestOpen: true }, { commentTime: true }, { followUp: true }], 'HD-9313': [{ status: 'Escalated' }, { teamMessage: 'lead' },{ commentTime: true }, { followUp: true }] } },
    'test-clocks': { title: 'Test clocks', tickets: CLOCKS.map((t) => t.id), now: at(WED, '13:00'), nextDay: { unlock: [] } },
  },
};

const store = (initial) => {
  const map = new Map(initial || []);
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function sim({ url = 'https://academy.test/sim/#/helpdesk/tickets', withTest = true, local = store(), before = '', now = 1000000 } = {}) {
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
    ctx.__test = { tickets: [CALL, ...PRACTICE, ...CLOCKS], sets: SETS };
    vm.runInContext(`__test.tickets.forEach((t) => HD_TICKET_TEMPLATES.push(hdTicket(JSON.parse(JSON.stringify(t)))));
      Object.assign(HD_PRACTICE_SETS, JSON.parse(JSON.stringify(__test.sets.practice)));
      Object.assign(HD_COACHED_SETS, JSON.parse(JSON.stringify(__test.sets.coached)));`, ctx);
  }
  if (before) vm.runInContext(before, ctx);
  vm.runInContext(read('helpdesk.js'), ctx, { filename: 'helpdesk.js' });
  // The real-time clock the call and the hold read, set by each test.
  ctx.__now = now;
  vm.runInContext('hdNowMs = () => __now;', ctx);
  const run = (code) => vm.runInContext(code, ctx);
  const input = (id, value) => byId.set(id, { id, value });
  const j = (value) => JSON.stringify(value);
  return {
    ctx, toasts, local, run, input,
    setNow: (ms) => { ctx.__now = ms; },
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id) => { run(`hdSelectTicket(${j(id)})`); return run("VIEWS['helpdesk/ticket']()"); },
    view: (route) => run(`VIEWS[${j(route)}]()`),
    progress: (id) => JSON.parse(JSON.stringify(run(`hdConsoleProgress(${j(id)})`))),
    rule: (id, rule) => run(`hdConsoleRule(hdTicketById(${j(id)}), ${j(rule)})`),
    history: (id) => run(`hdTicketById(${j(id)}).troubleshootingHistory.slice(-1)[0]`),
    note: (id, text) => { input('hd-note-input', text); return run(`hdAddNote(${j(id)})`); },
    comment: (id, text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(id)})`); },
    mood: (id) => run(`hdCallMood(${j(id)})`),
  };
}
const T0 = 1000000;
const coached = (local) => { const tab = sim({ local }); assert.equal(tab.run("hdUseTicketSet('test-call')"), true); return tab; };
const practice = (key, local) => sim({ url: `https://academy.test/sim/?practice=${key}&student=stu-1#/helpdesk/tickets`, local });
const plain = (value) => JSON.parse(JSON.stringify(value));
const NEW_MARKERS = /data-hd-(vip|mood|call|intake|hold|explain|evidence|handoff|warm|follow-up|duplicate|team|keep-incident)|hd-hold-timer|Go to follow-up time|Warm handoff: call|Keep listening|Callback number/;
const NEW_KEYS = ['call', 'intake', 'hold', 'explain', 'evidenceOpened', 'handoffMissing', 'warmHandoffs', 'followUp', 'commentChecks', 'teamMessages', 'duplicateTried'];

function testOldTicketsTurnNothingOn() {
  const tab = sim();
  assert.equal(tab.run('hdShiftNow() === HD_SHIFT_NOW'), true);
  const ids = tab.run('hdState.tickets.map((t) => t.id)');
  assert.ok(ids.includes('HD-2150') && !ids.some((id) => id.startsWith('HD-93')));
  for (const id of ids) {
    assert.doesNotMatch(tab.open(id), NEW_MARKERS, `${id} shows no new feature`);
    assert.equal(tab.run(`hdTicketClock(hdTicketById(${JSON.stringify(id)}))`), null);
    const progress = tab.progress(id);
    if (progress) NEW_KEYS.forEach((key) => assert.ok(!(key in progress), `${id} progress has no ${key}`));
  }
  assert.doesNotMatch(tab.view('helpdesk/tickets'), NEW_MARKERS);
  // Module 1's work snapshot keys, exactly as before.
  assert.deepEqual(Object.keys(tab.progress('HD-2150')).sort(), ['accountUnlocked', 'actions', 'chatAsked', 'commentRepeatLine', 'comments', 'critical', 'kbOpened', 'kbSearches', 'lastCommentJargon', 'noteMissing', 'outcomes', 'owner', 'ownerTries', 'passwordAsked', 'passwordWritten', 'resolutionCode', 'unlocks', 'unverified', 'verification']);
  // An old comment keeps its shape; the old caller card keeps its title.
  tab.comment('HD-2150', 'Hi Sam, your account works again.');
  assert.deepEqual(Object.keys(tab.run("hdTicketById('HD-2150').customerComments.slice(-1)[0]")).sort(), ['author', 'text', 'time']);
  assert.match(tab.open('HD-2150'), /<strong>Caller chat<\/strong>/);
  assert.equal(tab.run('hdCommsTick()'), false);
  // Older modules' sets: every ticket as before, on the set's clock. Module 3's
  // own sets (its-11, its-11-guided) turn these features on by design.
  // Module 4's sets (its-02 and its two coached sets) do the same, and so do
  // Module 5's (its-03, its-03-guided: tickets on their own clocks).
  const MODULE3_SETS = ['its-11', 'its-11-guided', 'its-02', 'its-02-guided', 'its-02-server', 'its-03', 'its-03-guided'];
  const older = (k) => !k.startsWith('test-') && !MODULE3_SETS.includes(k);
  for (const key of Object.keys(tab.run('HD_PRACTICE_SETS')).filter(older)) {
    const set = practice(key);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) {
      assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
      assert.equal(set.run(`hdTicketClock(hdTicketById(${JSON.stringify(id)}))`), null);
    }
  }
  for (const key of Object.keys(tab.run('HD_COACHED_SETS')).filter(older)) {
    const set = sim(); assert.equal(set.run(`hdUseTicketSet(${JSON.stringify(key)})`), true);
    for (const id of set.run('hdState.tickets.map((t) => t.id)')) assert.doesNotMatch(set.open(id), NEW_MARKERS, `${key} ${id}`);
  }
}

function testProveGetsNoneOfTheNewFeatures() {
  const every = `{ kb:true, now:'${at(THU, '09:00')}', vip:true, matrix:{}, followUp:{ jump:true }, warmHandoff:true, handoff:{}, intake:{ caller:true, callback:true },
    hold:{ ask:'a', back:'b' }, explain:{ words:['x'] }, evidence:[{ id:'e', title:'E', rows:[] }], teamMessages:[{ id:'m', to:'X', text:'t', reply:'r' }],
    duplicateMove:{ text:'Create new incident' }, conversation:{ name:'N', mood:'Angry', stages:[{ id:'s', messages:['m'], choices:[{ id:'c', text:'c', pass:true }] }] } }`;
  const prove = sim({ url: 'https://academy.test/sim/?prove=its-01&student=student-m03-prove#/helpdesk/tickets', before: `HD_PROVE_SHIFTS['its-01'].tickets[0].console = ${every};` });
  const id = prove.run('hdState.tickets[0].id');
  assert.deepEqual(plain(prove.run('hdConsole(hdState.tickets[0])')), { kb: true });
  assert.equal(prove.run('hdTicketClock(hdState.tickets[0])'), null);
  assert.equal(prove.run('hdShiftNow(hdState.tickets[0]) === HD_SHIFT_NOW'), true);
  assert.equal(prove.run('hdCommsTick()'), false);
  assert.equal(prove.run('hdCallMood(hdState.tickets[0].id)'), '');
  for (const html of [prove.open(id), prove.view('helpdesk/tickets')]) assert.doesNotMatch(html, NEW_MARKERS);
}

// A ticket's own clock: its history, notes and SLA use it; "Go to follow-up
// time" moves only the clock the ticket runs on; "Next day" still moves the
// set's clock.
function testTicketClocksAndFollowUp() {
  const tab = practice('test-comms');
  assert.equal(tab.run('hdShiftNow() === HD_SHIFT_NOW'), true, 'a set without now keeps the default clock');
  assert.equal(tab.run("hdShiftNow(hdTicketById('HD-9311')).toISOString()"), new Date(at(THU, '13:12')).toISOString());
  tab.run("hdSetImpact('HD-9311', 'impact', '3')");
  assert.equal(tab.history('HD-9311').time, 'Thu 13:12');
  tab.note('HD-9313', 'Reported: TEST. Tried: TEST checked. Result: TEST result.');
  assert.equal(tab.run("hdTicketById('HD-9313').notes.slice(-1)[0].time"), 'Thu 10:20');
  // HD-9313: P4 from Tue 09:30 to Thu 10:20 is 18h 50m of business time.
  const sla = plain(tab.run("hdSlaState(hdTicketById('HD-9313'))"));
  assert.equal(sla.phase, 'Resolve'); assert.equal(sla.used, 1130);
  // The queue's SLA column reads each row on its own clock.
  tab.run("hdQueueSetList('all'); hdQueueColumn('sla', true)");
  const due = (id) => tab.run(`hdSlaState(hdTicketById('${id}')).dueMs`);
  assert.match(tab.view('helpdesk/tickets'), /data-hd-row="HD-9313"/);
  // 2,700 business minutes less 1,130 used leaves 1,570, counted from Thu 10:20.
  assert.equal(due('HD-9313'), tab.run(`hdAddSlaUnits(Date.parse('${at(THU, '10:20')}'), 1570, true)`));

  const clocks = practice('test-clocks');
  const setNow = () => clocks.run('hdShiftNow().toISOString()');
  const ownNow = () => clocks.run("hdShiftNow(hdTicketById('HD-9322')).toISOString()");
  assert.equal(setNow(), new Date(at(WED, '13:00')).toISOString());
  assert.equal(ownNow(), new Date(at(THU, '09:00')).toISOString());
  // The picker opens on each ticket's own shift time, not the computer's date.
  assert.match(clocks.open('HD-9322'), /id="hd-follow-up-input" class="ipt" type="datetime-local" value="2026-08-20T09:00"/);
  assert.match(clocks.open('HD-9321'), /id="hd-follow-up-input" class="ipt" type="datetime-local" value="2026-08-19T13:00"/);
  // A follow-up earlier than the ticket's own now is refused.
  clocks.input('hd-follow-up-input', `${THU}T08:00`); clocks.run("hdFollowUpSet('HD-9322')");
  assert.match(clocks.lastToast(), /later than now/);
  clocks.input('hd-follow-up-input', 'not a time'); clocks.run("hdFollowUpSet('HD-9322')");
  assert.match(clocks.lastToast(), /date and time/);
  clocks.input('hd-follow-up-input', `${THU}T10:30`); clocks.run("hdFollowUpSet('HD-9322')");
  assert.match(clocks.history('HD-9322').action, /Follow-up set for Thu 10:30/);
  assert.match(clocks.open('HD-9322'), /Go to follow-up time/);
  clocks.run("hdFollowUpGo('HD-9322')");
  assert.equal(ownNow(), new Date(at(THU, '10:30')).toISOString(), 'its own clock moved');
  assert.equal(setNow(), new Date(at(WED, '13:00')).toISOString(), 'the set clock did not');
  assert.doesNotMatch(clocks.open('HD-9322'), /Go to follow-up time/);
  // A ticket on the set's clock moves the set's clock.
  clocks.input('hd-follow-up-input', `${WED}T15:15`); clocks.run("hdFollowUpSet('HD-9321')");
  clocks.run("hdFollowUpGo('HD-9321')");
  assert.equal(setNow(), new Date(at(WED, '15:15')).toISOString());
  assert.equal(ownNow(), new Date(at(THU, '10:30')).toISOString());
  assert.equal(clocks.progress('HD-9321').followUp.visited, true);
  // "Next day" still moves the set's clock, and only that.
  clocks.run('hdNextDay()');
  assert.equal(setNow(), new Date(at(THU, '15:15')).toISOString());
  assert.equal(ownNow(), new Date(at(THU, '10:30')).toISOString());
  // The clocks survive a reload.
  const again = practice('test-clocks', clocks.local);
  assert.equal(again.run("hdShiftNow(hdTicketById('HD-9322')).toISOString()"), new Date(at(THU, '10:30')).toISOString());
}

// The live call: messages arrive by time, choices show from the first one,
// answering early is an interruption, a wrong choice shows its line, and the
// mood meter moves. The meter is never in the saved work.
function testConversationAndMoodMeter() {
  const tab = coached();
  const id = 'HD-9301';
  tab.setNow(T0 - 30000);
  // Nothing starts the call before the student opens the ticket.
  assert.equal(tab.run('hdCommsTick()'), false);
  assert.equal(tab.progress(id).call.stage, 0);
  assert.equal(tab.rule(id, { call: true }), false);
  assert.equal(tab.run(`hdTicketById('${id}').consoleState.call.startedAt`), undefined);
  tab.setNow(T0);
  let html = tab.open(id);
  assert.equal(tab.run(`hdTicketById('${id}').consoleState.call.startedAt`), T0);
  assert.equal(tab.run('hdCommsTick()'), false, 'the first look only notes what is shown');
  assert.match(html, /<strong>Phone call<\/strong>/);
  assert.match(html, /data-hd-mood="Frustrated"/);
  assert.match(html, /TEST answer the call/);
  assert.doesNotMatch(html, /Keep listening/, 'a stage with no messages has no Keep listening');
  // The choices' order is the same on every redraw.
  const order = (h) => [...h.matchAll(/hdCallChoose\('HD-9301','([a-z]+)'\)/g)].map((m) => m[1]);
  assert.deepEqual(order(html), order(tab.open(id)));
  tab.run(`hdCallChoose('${id}', 'bad')`);
  assert.equal(tab.mood(id), 'Angry');
  assert.match(tab.open(id), /TEST bad greeting line\./);
  tab.setNow(T0 + 1000);
  tab.run(`hdCallChoose('${id}', 'good')`);
  assert.equal(tab.mood(id), 'Angry', 'a choice with mood 0 leaves the meter');
  assert.equal(tab.progress(id).call.stage, 1);
  assert.equal(tab.run('hdCommsTick()'), true, 'the next stage started');
  // The rant: one message now, then one every 4 seconds.
  tab.setNow(T0 + 2000);
  assert.equal(tab.run('hdCommsTick()'), false);
  html = tab.open(id);
  assert.match(html, /TEST one/); assert.doesNotMatch(html, /TEST two/);
  assert.match(html, /is still talking/); assert.match(html, /Keep listening/); assert.match(html, /TEST empathy/);
  tab.run(`hdCallListen('${id}')`);
  assert.match(tab.lastToast(), /still talking/);
  // Answering before the last message is an interruption.
  tab.run(`hdCallChoose('${id}', 'kind')`);
  assert.equal(tab.progress(id).call.interruptions, 1);
  assert.equal(tab.progress(id).call.stage, 1, 'an interruption is not an answer');
  assert.match(tab.open(id), /TEST interrupt line\./);
  tab.setNow(T0 + 5100);
  assert.equal(tab.run('hdCommsTick()'), true, 'a message arrived');
  assert.match(tab.open(id), /TEST two/);
  // A reload: the right messages have arrived, by time, with no burst.
  const reloaded = sim({ local: tab.local, now: T0 + 9100 });
  html = reloaded.open(id);
  assert.match(html, /TEST three/); assert.doesNotMatch(html, /is still talking/);
  assert.equal(reloaded.mood(id), 'Angry');
  reloaded.run(`hdCallListen('${id}')`);
  assert.match(reloaded.lastToast(), /has finished/);
  reloaded.run(`hdCallChoose('${id}', 'hush')`);
  assert.deepEqual(reloaded.progress(id).call.wrong, ['bad', 'hush']);
  reloaded.run(`hdCallChoose('${id}', 'kind')`);
  assert.equal(reloaded.mood(id), 'Frustrated');
  const progress = reloaded.progress(id);
  assert.equal(progress.call.done, true);
  assert.equal(reloaded.rule(id, { call: true }), true);
  html = reloaded.open(id);
  assert.match(html, /TEST three[\s\S]*TEST empathy/);
  assert.match(html, /TEST empathy line\./);
  // Never in the work a coach saves: no meter level, no moves.
  const saved = JSON.stringify(progress);
  assert.doesNotMatch(saved, /mood|Calm|Tense|Frustrated|Angry|TEST empathy line/);
  assert.equal(reloaded.run(`hdCallMood('HD-2150')`), '');
  // Every move shows a reason, even where the ticket gave none (the greeting
  // with mood 0 made no move; an interruption and wrong picks have lines).
  assert.ok(reloaded.run(`hdTicketById('${id}').consoleState.mood.moves.every((m) => m.line.length > 0)`));
  reloaded.run(`hdMoodMove(hdTicketById('${id}'), 1, '')`);
  assert.equal(reloaded.run(`hdTicketById('${id}').consoleState.mood.moves.slice(-1)[0].line`), "That didn't help the caller.");
}

function testCallerDetailsHoldAndPlainWords() {
  const tab = coached();
  const id = 'HD-9301';
  assert.match(tab.open(id), /<span>Caller<\/span><strong>Not set<\/strong>[\s\S]*<span>Callback number<\/span><strong>Not set<\/strong>/);
  tab.input('hd-intake-caller', 'Nobody Here'); tab.input('hd-intake-callback', 'ext. 4417');
  tab.run(`hdIntakeSave('${id}')`); assert.match(tab.lastToast(), /from the directory/);
  tab.input('hd-intake-caller', 'Jordan Bell'); tab.input('hd-intake-callback', 'no digits');
  tab.run(`hdIntakeSave('${id}')`); assert.match(tab.lastToast(), /number to call back/);
  tab.input('hd-intake-callback', 'ext. 4417');
  tab.run(`hdIntakeSave('${id}')`);
  assert.deepEqual(tab.progress(id).intake, { caller: 'Jordan Bell', callback: 'ext. 4417' });
  assert.equal(tab.rule(id, { intakeCaller: 'Jordan Bell' }), true);
  assert.equal(tab.rule(id, { callback: true }), true);
  assert.match(tab.open(id), /<span>Caller<\/span><strong>Jordan Bell<\/strong>[\s\S]*<strong>ext\. 4417<\/strong>/);
  // The callback number keeps its draft and never keeps a password.
  tab.run(`hdKeepDraft('${id}', 'callback', 'ext. 99')`);
  assert.equal(tab.run(`hdDraft(hdTicketById('${id}'), 'callback')`), 'ext. 99');

  // Holding without asking moves the meter.
  tab.setNow(T0);
  tab.run(`hdHoldStart('${id}')`);
  assert.equal(tab.mood(id), 'Angry');
  assert.match(tab.open(id), /data-hd-hold="on"/);
  tab.setNow(T0 + 30000);
  tab.run(`hdHoldReturn('${id}')`);
  assert.deepEqual(tab.progress(id).hold.holds, [{ seconds: 30, asked: false, over: false }]);
  assert.equal(tab.rule(id, { held: true }), false);
  // Asked, then too long: the meter moves once, even across a reload.
  tab.run(`hdHoldAsk('${id}')`);
  assert.match(tab.open(id), /TEST may I hold\?[\s\S]*TEST fine\./);
  tab.setNow(T0 + 40000);
  tab.run(`hdHoldStart('${id}')`);
  assert.equal(tab.run(`hdHoldTimerText(hdTicketById('${id}'), ${T0 + 105000})`), 'On hold 1:05 of 2:00');
  const reloaded = sim({ local: tab.local, now: T0 + 100000 });
  assert.equal(reloaded.run('hdCommsTick()'), false);
  const moodBefore = reloaded.run(`hdTicketById('${id}').consoleState.mood.moves.length`);
  reloaded.setNow(T0 + 40000 + 121000);
  assert.equal(reloaded.run('hdCommsTick()'), true, 'the hold ran over');
  assert.equal(reloaded.run('hdCommsTick()'), false, 'only once');
  assert.equal(reloaded.run(`hdTicketById('${id}').consoleState.mood.moves.length`), moodBefore + 1);
  assert.equal(reloaded.run(`hdTicketById('${id}').consoleState.mood.moves.slice(-1)[0].line`), 'TEST over line.');
  reloaded.run(`hdHoldReturn('${id}')`);
  assert.deepEqual(plain(reloaded.progress(id).hold.holds[1]), { seconds: 121, asked: true, over: true });
  assert.match(reloaded.history(id).action, /too long/);
  // Asked and back in time: held.
  reloaded.run(`hdHoldAsk('${id}')`); reloaded.run(`hdHoldStart('${id}')`);
  reloaded.setNow(T0 + 40000 + 121000 + 60000);
  reloaded.run(`hdHoldReturn('${id}')`);
  assert.equal(reloaded.rule(id, { held: true }), true);

  // Plain words: the ticket's own list, the first term named in its line.
  reloaded.input('hd-explain-input', 'short');
  reloaded.run(`hdExplainCheck('${id}')`); assert.match(reloaded.lastToast(), /Type what you would say/);
  reloaded.input('hd-explain-input', 'TEST it is an I/O fault on the disk');
  reloaded.run(`hdExplainCheck('${id}')`);
  assert.match(reloaded.open(id), /data-hd-explain="flagged">TEST he won&#39;t know &#39;I\/O&#39;\.|data-hd-explain="flagged">TEST he won't know 'I\/O'\./);
  assert.equal(reloaded.rule(id, { explained: true }), false);
  reloaded.input('hd-explain-input', 'TEST the part that stores your files is wearing out');
  reloaded.run(`hdExplainCheck('${id}')`);
  assert.equal(reloaded.rule(id, { explained: true }), true);
  assert.deepEqual(plain(reloaded.progress(id).explain), { passed: true, tries: 2, flagged: [], text: 'TEST the part that stores your files is wearing out' });
}

function testEvidenceHandoffWarmHandoffAndComments() {
  const tab = coached();
  const id = 'HD-9301';
  assert.doesNotMatch(tab.open(id), /TEST warning/, 'a card opens only when asked');
  tab.run(`hdEvidenceOpen('${id}', 'health')`);
  assert.match(tab.open(id), /TEST warning/);
  tab.run(`hdEvidenceOpen('${id}', 'health')`);
  tab.run(`hdEvidenceOpen('${id}', 'health')`);
  assert.equal(tab.run(`hdTicketById('${id}').consoleState.evidenceOpened.length`), 2, 'each open is recorded');
  assert.deepEqual(tab.progress(id).evidenceOpened, ['health']);
  assert.equal(tab.rule(id, { evidence: 'health' }), true);
  assert.ok(tab.run("hdState.practiceLog.some((e) => e.type === 'evidence_opened' && e.id === 'health')"));
  // Warm handoff waits for the reassignment.
  assert.match(tab.open(id), /data-hd-warm="0"><button type="button" class="btn btn-secondary" disabled/);
  tab.run(`hdWarmHandoff('${id}')`); assert.match(tab.lastToast(), /Assign the ticket to the other team first/);
  assert.equal(tab.progress(id).handoffMissing, null, 'no handoff check while it is with the desk');
  tab.run(`hdMatrixAssignGroup('${id}', ${JSON.stringify(DESK2)})`);
  assert.match(tab.lastToast(), /needs: Reported, Tried, Result and Next action/);
  assert.match(tab.open(id), /data-hd-handoff="missing"/);
  tab.note(id, 'Reported: TEST slow laptop. Tried: TEST checked the card. Result: TEST needs Tier 2.');
  assert.deepEqual(tab.progress(id).handoffMissing, ['Next action']);
  tab.note(id, 'Reported: TEST slow laptop. Tried: TEST checked the card. Result: TEST needs Tier 2. Next action: TEST replace the disk.');
  assert.equal(tab.rule(id, { handoffNote: true }), true);
  assert.match(tab.open(id), /data-hd-handoff="ok"/);
  tab.run(`hdWarmHandoff('${id}')`);
  assert.equal(tab.history(id).action, `Called ${DESK2} at 10:10 (warm handoff).`);
  assert.equal(tab.history(id).time, 'Wed 10:10');
  assert.deepEqual(tab.progress(id).warmHandoffs, [{ group: DESK2, at: new Date(at(WED, '10:10')).toISOString() }]);
  // The comment's time check, with the ticket's own lines.
  const moods = () => tab.run(`hdTicketById('${id}').consoleState.mood ? hdTicketById('${id}').consoleState.mood.level : -1`);
  const start = moods();
  tab.comment(id, 'Hi Amir, it will be fixed by 11:00.');
  assert.match(tab.lastToast(), /TEST promise line\./);
  tab.comment(id, 'Hi Amir, the desktop team has it.');
  assert.match(tab.lastToast(), /TEST no time line\./);
  assert.equal(tab.rule(id, { commentTime: true }), false);
  assert.equal(moods(), start);
  tab.comment(id, 'Hi Amir, I will update you by 11:30.');
  assert.equal(tab.lastToast(), 'Customer comment added.');
  assert.equal(tab.rule(id, { commentTime: true }), true);
  assert.equal(moods(), Math.max(0, start - 1), 'a good comment takes the meter down one');
  assert.deepEqual(tab.progress(id).commentChecks, [{ hasTime: true, promise: true }, { hasTime: false, promise: false }, { hasTime: true, promise: false }]);
  // Follow-up, the jump, and an update at the follow-up time.
  tab.input('hd-follow-up-input', `${WED}T11:30`); tab.run(`hdFollowUpSet('${id}')`);
  assert.equal(tab.rule(id, { followUp: true }), true);
  assert.equal(tab.rule(id, { followUpUpdated: true }), false);
  tab.run(`hdFollowUpGo('${id}')`);
  assert.equal(tab.run('hdState.clockNow'), new Date(at(WED, '11:30')).toISOString());
  tab.comment(id, 'Hi Amir, here is your 11:30 update. Next update by 13:00.');
  assert.equal(tab.run(`hdTicketById('${id}').customerComments.slice(-1)[0].at`), new Date(at(WED, '11:30')).toISOString());
  assert.equal(tab.rule(id, { followUpUpdated: true }), true);
  assert.equal(tab.progress(id).followUp.updated, true);
}

// The practice set: a request that keeps the incident open, the VIP flag,
// team messages, the duplicate move and the per-ticket done rules.
function testPracticeSetDoneRulesAndTicketWork() {
  const tab = practice('test-comms');
  // VIP on the ticket and on its queue row; never on the others.
  assert.match(tab.open('HD-9312'), /<strong>Requester statement<\/strong><span data-hd-vip>/);
  const queue = tab.view('helpdesk/tickets');
  assert.match(queue, /INC0019312<\/strong><span data-hd-vip>/);
  assert.doesNotMatch(queue, /INC0019311<\/strong><span data-hd-vip>/);
  // Phone and chat styles.
  assert.match(tab.open('HD-9311'), /<strong>Phone call<\/strong><span class="muted">Maya Chen · on the line/);
  const chat = tab.open('HD-9313');
  assert.match(chat, /<strong>Chat<\/strong><span class="muted">Sofia Martin · in the chat/);
  assert.doesNotMatch(chat, /data-hd-mood/, 'no mood meter without mood');
  tab.run("hdCallChoose('HD-9313', 'quick')");
  assert.equal(tab.run("hdCallMood('HD-9313')"), '');
  // A request opened from the incident: both records stay open.
  assert.match(tab.open('HD-9312'), /data-hd-keep-incident[\s\S]*Open a request from this incident/);
  tab.run("hdConvertSet('HD-9312', 'item', 'Test replacement')");
  tab.run("hdConvertSet('HD-9312', 'approval', 'Requested')");
  tab.run("hdConvertToRequest('HD-9312')");
  const incident = tab.ticket('HD-9312');
  assert.equal(incident.status, 'New'); assert.equal(incident.cancelReason, undefined);
  assert.equal(incident.request.state, 'Open'); assert.equal(incident.request.fields[0].value, 'Requested');
  assert.match(tab.history('HD-9312').action, /RITM0019312 \(Test replacement\) opened from this incident; the incident stays open/);
  assert.equal(tab.rule('HD-9312', { requestOpen: true }), true);
  assert.equal(tab.rule('HD-9312', { converted: true }), true);
  // Message another team: the reply is logged; an assign reply assigns it.
  tab.run("hdTeamMessage('HD-9312', 'desk')");
  assert.match(tab.open('HD-9312'), /data-hd-team="desk"[\s\S]*TEST yes, by 07:30\./);
  assert.equal(tab.ticket('HD-9312').assignedTechnician, 'Unassigned');
  tab.run("hdTeamMessage('HD-9313', 'lead')");
  tab.run("hdTeamMessage('HD-9313', 'lead')");
  assert.deepEqual(tab.progress('HD-9313').teamMessages, ['lead']);
  assert.equal(tab.ticket('HD-9313').assignedTechnician, 'Test Engineer');
  assert.equal(tab.ticket('HD-9313').assignmentGroup, MC, 'the group keeps the ticket');
  // The duplicate move is a critical error, shown as feedback.
  tab.run("hdDuplicateMove('HD-9313')");
  assert.match(tab.open('HD-9313'), /data-hd-duplicate="tried"[\s\S]*TEST duplicate feedback\./);
  assert.equal(tab.progress('HD-9313').duplicateTried, true);
  assert.ok(tab.progress('HD-9313').critical.includes('duplicate-ticket'));
  // Completion: 9312 escalated is not enough by itself.
  tab.run(`hdMatrixAssignGroup('HD-9312', ${JSON.stringify(DESK2)})`);
  assert.equal(tab.ticket('HD-9312').status, 'Escalated');
  tab.run("hdTransitionTicket('HD-9311', 'In Progress')");
  tab.run("hdSetResolutionCode('HD-9311', 'Solution provided')");
  tab.input('hd-resolution-notes', 'TEST fixed and confirmed with the user.');
  tab.run("hdTransitionTicket('HD-9311', 'Resolved')");
  assert.equal(tab.ticket('HD-9311').status, 'Resolved');
  assert.equal(tab.run('hdPracticeClosed()'), false, 'a done rule replaces the state test');
  tab.comment('HD-9312', 'Hi Jordan, the laptop will be set up by 08:00. I will confirm at 19:00.');
  tab.input('hd-follow-up-input', `${THU}T19:00`); tab.run("hdFollowUpSet('HD-9312')");
  assert.equal(tab.run('hdPracticeClosed()'), false, '9313 still needs its update');
  tab.comment('HD-9313', 'Hi Sofia, sorry. Test Engineer will call you by 15:00.');
  tab.input('hd-follow-up-input', `${THU}T15:15`); tab.run("hdFollowUpSet('HD-9313')");
  assert.equal(tab.run('hdPracticeClosed()'), true);
  // Each follow-up is in its own ticket's time.
  assert.equal(tab.history('HD-9313').time, 'Thu 10:20');
  assert.equal(tab.history('HD-9312').time, 'Thu 11:05');
}

// A ticket whose conversation has no stages list: the tick skips it and
// does not throw (hdCall returns null for it).
function testTickSkipsConversationWithoutStages() {
  const tab = coached();
  tab.setNow(T0);
  tab.run("HD_TICKET_TEMPLATES.find((t) => t.id === 'HD-9301').console.conversation = { name: 'Amir Patel', style: 'phone' }");
  tab.run("hdState.selectedTicketId = 'HD-9301'");
  assert.equal(tab.run('hdCall(hdTicketById(\'HD-9301\'), __now, false)'), null);
  assert.doesNotThrow(() => tab.run('hdCommsTick()'));
  assert.equal(tab.run('hdCommsTick()'), false);
  assert.doesNotThrow(() => tab.run('hdCommsTimerTick()'));
}

// The 1-second timer: a redraw put off by a focused field is owed, and the
// first tick with no focused field does it once, then clears the flag.
function testTimerRedrawsOnceAfterFocusLeaves() {
  const tab = coached();
  const id = 'HD-9301';
  let renders = 0;
  tab.ctx.render = () => { renders += 1; };
  const focus = () => { tab.ctx.document.activeElement = { tagName: 'TEXTAREA', value: '' }; };
  const blur = () => { tab.ctx.document.activeElement = null; };
  tab.setNow(T0);
  tab.open(id);
  assert.equal(tab.run('hdCommsTimerTick()'), false, 'the first look only notes what is shown');
  tab.setNow(T0 + 1000);
  tab.run(`hdCallChoose('${id}', 'good')`);
  renders = 0; // count only the timer's redraws, not the choice's own
  tab.setNow(T0 + 2000);
  assert.equal(tab.run('hdCommsTimerTick()'), true, 'the next stage redraws');
  assert.equal(renders, 1);
  // (a) The second message arrives while a field has focus: no redraw yet.
  focus();
  tab.setNow(T0 + 5100);
  assert.equal(tab.run('hdCommsTimerTick()'), false);
  assert.equal(tab.run('hdCommsRedrawOwed'), true, 'the skipped redraw is owed');
  tab.setNow(T0 + 6000);
  assert.equal(tab.run('hdCommsTick()'), false, 'no new change on this tick');
  assert.equal(tab.run('hdCommsTimerTick()'), false);
  assert.equal(renders, 1, 'no redraw while the field has focus');
  // Focus leaves: the first tick redraws, though nothing new changed.
  blur();
  tab.setNow(T0 + 6500);
  assert.equal(tab.run('hdCommsTimerTick()'), true);
  assert.equal(renders, 2);
  assert.match(tab.open(id), /TEST two/);
  // (b) The flag is cleared: the next ticks do not redraw.
  assert.equal(tab.run('hdCommsRedrawOwed'), false);
  tab.setNow(T0 + 7000);
  assert.equal(tab.run('hdCommsTimerTick()'), false);
  tab.setNow(T0 + 8000);
  assert.equal(tab.run('hdCommsTimerTick()'), false);
  assert.equal(renders, 2);
}

const tests = [
  testOldTicketsTurnNothingOn, testProveGetsNoneOfTheNewFeatures, testTicketClocksAndFollowUp, testConversationAndMoodMeter,
  testCallerDetailsHoldAndPlainWords, testEvidenceHandoffWarmHandoffAndComments, testPracticeSetDoneRulesAndTicketWork,
  testTickSkipsConversationWithoutStages, testTimerRedrawsOnceAfterFocusLeaves,
];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`hdesk-m03-console-features: all ${tests.length} passed`);

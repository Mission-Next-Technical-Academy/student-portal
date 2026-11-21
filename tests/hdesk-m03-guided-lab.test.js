'use strict';
// Help Desk Module 3 (key its-11) Practice It, Lab 3.1 · Guided Lab: a
// frustrated caller. HD-2164 (shown as INC0010440) in the coached set
// 'its-11-guided' (ui/helpdesk-data.js), the hd-m11 coach
// (ui/helpdesk-coaches.js), the portal's cleaner (portal/it-support-shared.js)
// and the Lab 3.1 instructor sheet (portal/admin-sheets/hdesk.js).
//
//   - The lab opens on its own set: one ticket, Wednesday 10:10, kept out of
//     the shared Practice shift.
//   - The coach walks all eight steps to Finish, each with a why and a
//     success line, through one interruption, one "calm down", one hold that
//     runs out, one flagged word and one fix-time promise. The spec's model
//     explanation, note and comments pass their own checks.
//   - A student who sets a second follow-up after the update still finishes.
//   - The portal keeps the call work and never the mood meter; the sheet
//     shows it in full; an older Lab 3.1 attempt keeps its old sheet.
//   - A run saved under the old two-ticket coach starts fresh.
//   - Nothing from the graded Prove It ticket appears in any Module 3 file.
//
// The simulator runs in a Node vm with a small fake DOM; the portal runs in
// tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
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
const STUDENT = 'student-m03g0001';
const ID = 'HD-2164';
const DESK2 = 'Desktop Support (Tier 2)';
const launchUrl = (restart = true) => `${SIM_URL}?coach=hd-m11${restart ? '&restart=1' : ''}&student=${STUDENT}#/helpdesk/tickets`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const T0 = 5000000;

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

// One browser tab, as tests/hdesk-m02-guided-lab.test.js builds it, with the
// real-time clock (calls and holds) under the test's control.
function sim(url, { local = store(), session = store(), opener = null, now = T0 } = {}) {
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
    __now: now,
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => {
    if (typeof ctx.coachAllowsRoute === 'function' && !ctx.coachAllowsRoute(hash)) return;
    location.hash = hash; ctx.render();
  };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) {
    vm.runInContext(source, ctx, { filename: name });
    if (name === 'helpdesk.js') vm.runInContext('hdNowMs = () => __now;', ctx);
  }
  ctx.render();
  loaded.forEach((fn) => fn());
  const run = (code) => vm.runInContext(code, ctx);
  const j = (value) => JSON.stringify(value);
  const input = (id, value) => { const el = element(id); el.value = value; byId.set(id, el); };
  const panel = () => byId.get('coach-panel');
  const click = (action) => panel().listeners.click({ target: { closest: () => ({ dataset: { coach: action } }) } });
  const tab = {
    ctx, toasts, local, session, run, input,
    setNow: (ms) => { ctx.__now = ms; },
    lastToast: () => toasts[toasts.length - 1] || '',
    ticket: (id) => run(`hdTicketById(${j(id)})`),
    open: (id = ID) => { run(`hdState.selectedTicketId = ${j(id)}`); return run("VIEWS['helpdesk/ticket']()"); },
    progress: (id = ID) => plain(run(`hdConsoleProgress(${j(id)})`)),
    choose: (choice) => run(`hdCallChoose(${j(ID)}, ${j(choice)})`),
    note: (text) => { input('hd-note-input', text); return run(`hdAddNote(${j(ID)})`); },
    comment: (text) => { input('hd-comment-input', text); return run(`hdAddComment(${j(ID)})`); },
    followUp: (value) => { input('hd-follow-up-input', value); run(`hdFollowUpSet(${j(ID)})`); },
    coachStep: () => (JSON.parse(session.getItem('mnt.coach.state') || 'null') || {}).step,
    stepCount: () => run("MODULE_COACHES.find((c) => c.id === 'hd-m11').steps.length"),
    advance: () => {
      for (;;) {
        const before = tab.coachStep();
        if (before === undefined || before >= tab.stepCount() - 1) return before;
        click('next');
        if (tab.coachStep() === before) return before;
      }
    },
    finish: () => click('finish'),
  };
  return tab;
}

// The spec's model texts (8.2).
const EXPLAIN = 'Wes, your laptop is reporting that the part that stores your files is wearing out, which is why everything is slow. It needs a hands-on repair, so I\'m bringing in our desktop team. Your files were backed up to OneDrive this morning, so they\'re safe.';
const NOTE = 'Reported: Wes Turner, Marketing: laptop NS-LT-0236 very slow since Monday; files take minutes to open; occasional clicking noise. Brochure files are due at the print vendor at 3:00 PM today.\nTried: asked when it started and what changed (nothing installed); he restarted twice with no change; Device health shows a disk warning (storage reporting errors); OneDrive backup current as of 09:40; no repair attempted, per KB-0067.\nResult: can\'t be fixed at Tier 1. P3: one person, a deadline today. Assigned to Desktop Support with a warm handoff at 10:10.\nNext action: Desktop Support replaces the disk or swaps the laptop; a loaner before 3:00 would cover his deadline. Service Desk updates Wes by 11:30.';
const COMMENT = 'Hi Wes, thanks for your patience on the call. Your laptop\'s storage is failing, so our desktop team is taking it from here. I\'ve spoken to them, and they have your details and your 3:00 deadline. Your files are safe in OneDrive. I\'ll update you by 11:30, even if there\'s no news yet. – Riley, Northstar Service Desk (INC0010440)';
const UPDATE = 'Hi Wes, here\'s your 11:30 update, as promised. The desktop team has your laptop next in line, and I don\'t have a finish time from them yet. I\'ll check with them and update you again by 1:00. – Riley';

/* ------------------------------------------------------------ the shift */

function testTheLabOpensOnItsOwnSet() {
  const tab = sim(launchUrl());
  assert.equal(tab.run('hdState.ticketSet'), 'its-11-guided');
  assert.deepEqual(plain(tab.run('hdState.tickets.map((t) => t.id)')), [ID]);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T10:10:00.000Z', 'Wednesday 10:10');
  assert.equal(tab.ticket(ID).priority, '');
  const html = tab.open();
  assert.match(html, /INC0010440/);
  assert.match(html, /<strong>Phone call<\/strong>/);
  assert.match(html, /data-hd-mood="Frustrated"/, 'the meter starts at Frustrated');
  assert.match(html, /Callback number/);
  const shown = html.replace(/<[^>]*>/g, ' ');
  assert.doesNotMatch(shown, /\bHD-21\d\d\b/, `students see the INC number only: ${(shown.match(/.{0,60}\bHD-21\d\d\b.{0,20}/) || [''])[0]}`);
  // The shared Practice shift never gets any Module 3 ticket.
  const shared = sim(`${SIM_URL}#/helpdesk/tickets`);
  assert.ok(!shared.run('hdState.tickets.map((t) => t.id)').some((id) => /^HD-216[4-7]$/.test(id)));
  // Old tickets stay in the data (call 16).
  assert.ok(tab.run("HD_TICKET_TEMPLATES.some((t) => t.id === 'HD-2113') && HD_TICKET_TEMPLATES.some((t) => t.id === 'HD-2124')"));
  assert.ok(tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m04')").steps.length > 0);
}

function testKnowledgeArticlesAreFound() {
  const tab = sim(launchUrl());
  const search = (query) => tab.run(`hdKbSearchArticles(${JSON.stringify(query)}, hdKbArticles()).map((a) => a.id)`);
  assert.equal(search('outlook not sending')[0], 'KB-0064');
  assert.equal(search('disk warning')[0], 'KB-0067');
  assert.equal(search('replacement laptop')[0], 'KB-0066');
  assert.equal(search('damaged laptop')[0], 'KB-0071', 'Module 1’s article is still found first');
  const summary = (id) => tab.run(`HD_KB_ARTICLES.find((a) => a.id === '${id}').summary`);
  assert.match(summary('KB-0067'), /Never promise a repair time/);
  assert.match(summary('KB-0066'), /KB-0024/);
  assert.match(summary('KB-0064'), /Work Offline/);
}

/* -------------------------------------------------------- the walkthrough */

function walk(tab) {
  let now = T0;
  const at = (ms) => { now = ms; tab.setNow(now); };
  at(T0);
  tab.open();
  // Step 1: a poor greeting first, then the right one and the caller details.
  tab.choose('it');
  assert.equal(tab.run(`hdCallMood('${ID}')`), 'Angry');
  tab.choose('greeting');
  tab.run(`hdSetClassification('${ID}', 'contactType', 'Phone')`);
  tab.input('hd-intake-caller', 'Wes Turner'); tab.input('hd-intake-callback', 'ext. 4577');
  tab.run(`hdIntakeSave('${ID}')`);
  tab.advance();
  assert.equal(tab.coachStep(), 1, 'step 1 done');
  // Step 2: replying before the third message is an interruption.
  at(T0 + 1000); tab.open();
  tab.choose('empathy');
  assert.equal(tab.progress().call.interruptions, 1);
  at(T0 + 10000);
  tab.choose('calm-down');
  assert.match(tab.open(), /Calm down/);
  tab.choose('empathy');
  assert.equal(tab.progress().call.done, true);
  tab.advance();
  assert.equal(tab.coachStep(), 2, 'step 2 done');
  // Step 3: three questions, then triage from the facts.
  ['when', 'changed', 'impact'].forEach((q) => tab.run(`hdChatAsk('${ID}', '${q}')`));
  tab.run(`hdSetClassification('${ID}', 'category', 'Hardware'); hdSetClassification('${ID}', 'subcategory', 'Laptop'); hdSetClassification('${ID}', 'ci', 'NS-LT-0236')`);
  tab.run(`hdSetImpact('${ID}', 'impact', '3'); hdSetImpact('${ID}', 'urgency', '1')`);
  assert.equal(tab.ticket(ID).priority, 'P3');
  assert.match(tab.open(), /The 3:00 deadline is/);
  tab.advance();
  assert.equal(tab.coachStep(), 3, 'step 3 done');
  // Step 4: one hold that runs out, then one asked and in time.
  tab.run(`hdHoldAsk('${ID}')`);
  at(T0 + 20000); tab.run(`hdHoldStart('${ID}')`);
  at(T0 + 20000 + 125000); tab.run('hdCommsTick()');
  tab.run(`hdHoldReturn('${ID}')`);
  tab.advance();
  assert.equal(tab.coachStep(), 3, 'a hold that ran out is not enough');
  tab.run(`hdHoldAsk('${ID}')`); tab.run(`hdHoldStart('${ID}')`);
  tab.run(`hdEvidenceOpen('${ID}', 'device-health')`);
  assert.match(tab.open(), /storage is reporting errors/);
  tab.input('hd-kb-input', 'disk warning'); tab.run(`hdKbSearch({ preventDefault() {} }, '${ID}')`); tab.run(`hdKbOpen('${ID}', 'KB-0067')`);
  at(now + 60000); tab.run(`hdHoldReturn('${ID}')`);
  tab.advance();
  assert.equal(tab.coachStep(), 4, 'step 4 done');
  // Step 5: a flagged word, then the model explanation.
  tab.input('hd-explain-input', 'Your SSD is failing and I am escalating it.');
  tab.run(`hdExplainCheck('${ID}')`);
  assert.match(tab.open(), /data-hd-explain="flagged"/);
  tab.input('hd-explain-input', EXPLAIN);
  tab.run(`hdExplainCheck('${ID}')`);
  assert.equal(tab.progress().explain.passed, true, 'the model explanation has no flagged term');
  tab.advance();
  assert.equal(tab.coachStep(), 5, 'step 5 done');
  // Step 6: reassign, the model note, the warm handoff.
  tab.run(`hdMatrixAssignGroup('${ID}', ${JSON.stringify(DESK2)})`);
  tab.note(NOTE);
  assert.deepEqual(tab.progress().handoffMissing, [], 'the model note has all four labels');
  tab.run(`hdWarmHandoff('${ID}')`);
  assert.match(tab.run(`hdTicketById('${ID}').troubleshootingHistory.slice(-1)[0].action`), /^Called Desktop Support \(Tier 2\) at 10:10/);
  tab.advance();
  assert.equal(tab.coachStep(), 6, 'step 6 done');
  // Step 7: a fix-time promise gets the hint; the model comment passes.
  tab.comment('Hi Wes, it will be fixed by 2:00. – Riley');
  assert.match(tab.lastToast(), /That's a fix time/);
  tab.comment(COMMENT);
  assert.deepEqual(tab.progress().commentChecks.slice(-1), [{ hasTime: true, promise: false }]);
  assert.deepEqual(tab.progress().lastCommentJargon, [], 'the model comment has no flagged term');
  tab.followUp('2026-08-19T11:30');
  tab.advance();
  assert.equal(tab.coachStep(), 7, 'step 7 done');
  // Step 8: go to the follow-up time and post the update.
  tab.run(`hdFollowUpGo('${ID}')`);
  assert.equal(tab.run('hdShiftNow().toISOString()'), '2026-08-19T11:30:00.000Z');
  tab.comment(UPDATE);
  assert.equal(tab.progress().followUp.updated, true);
  tab.advance();
  assert.equal(tab.coachStep(), 8, 'at Finish');
  return tab;
}

function testWalkthroughEndToEnd() {
  const opener = fakeOpener();
  const tab = sim(launchUrl(), { opener });
  const coach = tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m11')");
  assert.equal(coach.module, 3);
  assert.equal(coach.steps.length, 9, 'eight steps, then Finish');
  coach.steps.slice(0, 8).forEach((s, i) => {
    assert.match(s.body, /^Why: [\s\S]*Success looks like:/, `step ${i + 1} says why and what success looks like`);
    assert.doesNotMatch(`${s.title} ${s.instruction} ${s.body}`, /\b(HD|SR|SEC)-21\d\d\b|Module 11|\d+\s*points?\b|score/i, `step ${i + 1} text`);
    assert.doesNotMatch(String(s.check), /hdCallMood|mood/, `step ${i + 1} never reads the mood meter`);
  });
  assert.equal(tab.coachStep(), 0);
  walk(tab);
  assert.equal(tab.ticket(ID).status === 'Resolved', false, 'the ticket stays open with Desktop Support');
  tab.finish();
  const done = opener.sent.find((m) => m.data.type === 'mnt-coach-complete');
  assert.ok(done, 'Finish sends the work');
  const work = done.data.work;
  assert.deepEqual(work.tickets.map((t) => t.id), [ID]);
  assert.doesNotMatch(JSON.stringify(work), /"mood"|Frustrated|Angry|"Calm"|"Tense"/, 'the mood meter is never in the saved work');
  return work;
}

function testSecondFollowUpStillFinishes() {
  // The student updates at 11:30, then sets the next follow-up (1:00) before
  // moving on: the coach still reaches Finish.
  const tab = sim(launchUrl());
  const coach = tab.run("MODULE_COACHES.find((c) => c.id === 'hd-m11')");
  walkToStepEight(tab);
  tab.run(`hdFollowUpGo('${ID}')`);
  tab.comment(UPDATE);
  tab.followUp('2026-08-19T13:00');
  assert.equal(tab.progress().followUp.updated, false, 'the new follow-up has no update yet');
  assert.equal(coach.steps[7].check(), true);
  // Posting before the jump does not count.
  const early = sim(launchUrl());
  walkToStepEight(early);
  early.comment(UPDATE);
  assert.equal(early.run("MODULE_COACHES.find((c) => c.id === 'hd-m11')").steps[7].check(), false);
}
function walkToStepEight(tab) {
  tab.setNow(T0); tab.open();
  tab.choose('greeting');
  tab.setNow(T0 + 10000); tab.choose('empathy');
  tab.run(`hdMatrixAssignGroup('${ID}', ${JSON.stringify(DESK2)})`);
  tab.note(NOTE);
  tab.comment(COMMENT);
  tab.followUp('2026-08-19T11:30');
}

function testOldWalkthroughStartsFresh() {
  // A browser halfway through the old two-ticket coach: the shared shift, and
  // a resume record at step 5.
  const local = store();
  const old = sim(`${SIM_URL}#/helpdesk/tickets`, { local });
  old.run('hdSave()');
  local.setItem('mnt.coach.resume', JSON.stringify({ id: 'hd-m11', step: 5, student: STUDENT }));
  const tab = sim(launchUrl(false), { local });
  assert.equal(tab.coachStep(), 0, 'starts at the first step');
  assert.equal(tab.run('hdState.ticketSet'), 'its-11-guided');
  // A current run still resumes where it was.
  const current = sim(launchUrl(), { local: store() });
  current.open(); current.choose('greeting');
  current.run(`hdSetClassification('${ID}', 'contactType', 'Phone')`);
  current.input('hd-intake-caller', 'Wes Turner'); current.input('hd-intake-callback', 'ext. 4577');
  current.run(`hdIntakeSave('${ID}')`);
  current.advance();
  assert.equal(current.coachStep(), 1);
  const resumed = sim(launchUrl(false), { local: current.local });
  assert.equal(resumed.coachStep(), 1, 'same step after a relaunch');
}

/* ------------------------------------------------- the portal and the sheet */

const portal = loadPortal();
const prun = (code) => vm.runInContext(code, portal);
portal.render = () => {};
const LAB31 = 'lab-its-11-handoff-documentation';

function testPortalAndSheet(work) {
  const clean = plain(prun('itsCleanCoachWork')(work));
  assert.ok(clean, 'the work is kept');
  const wes = clean.tickets[0];
  assert.equal(wes.number, 'INC0010440');
  const c = wes.console;
  assert.deepEqual(c.intake, { caller: 'Wes Turner', callback: 'ext. 4577' });
  assert.equal(c.call.done, true); assert.equal(c.call.interruptions, 1); assert.deepEqual(c.call.wrong, ['it', 'calm-down']);
  assert.deepEqual(c.hold.holds.map((h) => [h.asked, h.over]), [[true, true], [true, false]]);
  assert.equal(c.explain.text, EXPLAIN);
  assert.deepEqual(c.evidenceOpened, ['device-health']);
  assert.deepEqual(c.handoffMissing, []);
  assert.equal(c.warmHandoffs[0].group, DESK2);
  assert.deepEqual([c.followUp.visited, c.followUp.updated], [true, true]);
  assert.deepEqual(c.commentChecks.map((e) => e.promise), [true, false, false]);
  assert.equal(c.matrix.priority, 'P3');
  assert.doesNotMatch(JSON.stringify(clean), /mood|Frustrated|Angry/);
  // Unknown keys are dropped; Module 1 and Module 2 snapshots gain no new keys.
  const extra = plain(work); extra.tickets[0].console.mood = { level: 3 }; extra.tickets[0].console.call.secret = 'x';
  const kept = prun('itsCleanCoachWork')(extra).tickets[0].console;
  assert.equal(kept.mood, undefined); assert.equal(kept.call.secret, undefined);
  const NEW = ['call', 'intake', 'hold', 'explain', 'evidenceOpened', 'handoffMissing', 'warmHandoffs', 'followUp', 'commentChecks', 'teamMessages', 'duplicateTried'];
  const m01 = prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-2150', status: 'Resolved', console: { kbSearches: [] } }] }).tickets[0].console;
  const m02 = prun('itsCleanCoachWork')({ version: 1, tickets: [{ id: 'HD-2160', console: { matrix: { priority: 'P2' }, parent: 'HD-2159' } }] }).tickets[0].console;
  for (const snap of [m01, m02]) NEW.forEach((key) => assert.ok(!(key in snap), `no ${key} on older work`));

  const sheet = prun('AdminSubmissionSheet');
  const row = { id: 'm03g-1', lab_key: LAB31, track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-21T15:00:00Z', result: { source: 'mnt-coach-complete', work: clean } };
  const built = sheet.evaluate(row);
  assert.deepEqual(plain(built.sections.map((s) => s.id)), ['call-hd-2164', 'triage-hd-2164', 'explain-hd-2164', 'handoff-hd-2164', 'updates-hd-2164']);
  built.sections.forEach((s) => assert.equal(s.status, 'pass', s.id));
  const html = sheet.render(row);
  [EXPLAIN, 'per KB-0067', 'even if there', 'here’s your 11:30 update'.replace('’', '\'')].forEach((text) => assert.ok(html.includes(text) || html.includes(text.replace(/'/g, '&#39;')) || html.includes(text.replace(/'/g, '&#039;')), `the sheet shows: ${text}`));
  assert.doesNotMatch(html, /Mood|Frustrated/);
  // A rough run: P2, no warm handoff, a note with no Next action, no update.
  const rough = plain(clean);
  const rc = rough.tickets[0].console;
  rc.matrix.priority = 'P2'; rc.warmHandoffs = []; rc.handoffMissing = ['Next action']; rc.followUp.updated = false; rc.followUp.visited = false;
  const roughSheet = sheet.evaluate({ ...row, id: 'm03g-2', result: { ...row.result, work: rough } });
  ['triage-hd-2164', 'handoff-hd-2164', 'updates-hd-2164'].forEach((id) => assert.notEqual(roughSheet.sections.find((s) => s.id === id).status, 'pass', id));
  // A second follow-up after the update: still shown as updated.
  const second = plain(clean); second.tickets[0].console.followUp = { at: '2026-08-19T13:00:00.000Z', visited: true, updated: false };
  assert.equal(sheet.evaluate({ ...row, id: 'm03g-3', result: { ...row.result, work: second } }).sections.find((s) => s.id === 'updates-hd-2164').status, 'pass');
  // An attempt saved under the old coach keeps the generic sheet.
  const oldRow = { ...row, id: 'm03g-4', result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [{ id: 'HD-2113', status: 'Escalated', notes: [{ author: 'Riley Morgan', time: '10:00', text: 'Gateway certificate expired.' }] }, { id: 'HD-2124', status: 'Resolved' }] } } };
  const oldIds = sheet.evaluate(oldRow).sections.map((s) => s.id);
  assert.ok(oldIds.includes('work-notes-hd-2113') && oldIds.includes('work-notes-hd-2124'));
  assert.ok(!oldIds.some((id) => id.endsWith('hd-2164')));
}

/* ------------------------------------------- nothing from the graded ticket */

// The Prove It ticket for this module is built only in the prove part (spec
// D4). Its ticket number, record number, laptop, product names and story
// words are kept here only as short hashes, so this file names none of them.
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const GRADED = new Set(['dfade819cfc9e427', '6d5163fc1bef8d75', 'b8ac8f70a7dc5793', '3f013f2382d874bf', 'eb4731ac58bda05e']);
const FILES = ['ui/helpdesk-data.js', 'ui/helpdesk-coaches.js', 'ui/helpdesk.js', 'portal/admin-sheets/hdesk.js', 'portal/it-support-shared.js', 'portal/it-support-module-11.js',
  'tests/hdesk-m03-guided-lab.test.js', 'tests/hdesk-m03-practice-tickets.test.js', 'tests/hdesk-m03-console-features.test.js'];
function testNothingFromTheGradedTicket() {
  for (const file of FILES) {
    const words = new Set(fs.readFileSync(path.join(ROOT, file), 'utf8').split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
    GRADED.forEach((h) => assert.ok(!words.has(h), `${file} names nothing from the graded ticket`));
  }
}
function testGuardFindsAWord() {
  // The scan finds a word it is given: Module 3's own ticket number.
  const words = new Set(fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8').split(/[^A-Za-z0-9-]+/).filter(Boolean).map((w) => hash(w.toLowerCase())));
  assert.ok(words.has(hash('inc0010440')));
}

const tests = [testTheLabOpensOnItsOwnSet, testKnowledgeArticlesAreFound, testSecondFollowUpStillFinishes, testOldWalkthroughStartsFresh, testNothingFromTheGradedTicket, testGuardFindsAWord];
let failed = 0;
let work = null;
try { work = testWalkthroughEndToEnd(); console.log('ok   testWalkthroughEndToEnd'); } catch (error) { failed += 1; console.error(`FAIL testWalkthroughEndToEnd\n${error.stack}`); }
if (work) {
  try { testPortalAndSheet(work); console.log('ok   testPortalAndSheet'); } catch (error) { failed += 1; console.error(`FAIL testPortalAndSheet\n${error.stack}`); }
}
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.error(`FAIL ${test.name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log(`hdesk-m03-guided-lab: all ${tests.length + 2} passed`);

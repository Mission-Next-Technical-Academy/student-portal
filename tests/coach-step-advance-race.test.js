// ui/coach.js: a step the student performs advances itself once its check
// passes (watchForStepCompletion polls, then advances 650 ms later). A page
// redraw during that wait starts a second watcher for the same step, which
// also sees the check pass. Each watcher's delayed advance must move on from
// the step it saw complete, not from wherever the coach is by then, so a
// redraw never skips the next step.
//
// Loads the simulator scripts in ui/index.html's order into a Node vm with
// timers the test fires by hand. Uses the hd-m03 coach (first step: open
// HD-2109; second step: read the evidence, a step with no check).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const UI = path.join(__dirname, '..', 'ui');
const SCRIPTS = ['coach-data.js', 'helpdesk-data.js', 'helpdesk.js', 'coach.js', 'helpdesk-coaches.js'];
const SOURCES = SCRIPTS.map((name) => [name, fs.readFileSync(path.join(UI, name), 'utf8')]);
const SIM_URL = 'https://academy.test/sim/?coach=hd-m03&restart=1&student=student-race0001#/helpdesk/tickets';

const store = () => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};
function element(id) {
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', className: '', dataset: {}, listeners,
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; }, querySelector: () => element(""), querySelectorAll: () => [], setAttribute() {}, focus() {},
  };
}

function sim() {
  const u = new URL(SIM_URL);
  const location = { protocol: u.protocol, hostname: u.hostname, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash };
  const byId = new Map();
  const loaded = [];
  // Timers the test fires by hand.
  const intervals = new Map();
  const timeouts = new Map();
  let nextId = 1;
  const body = element('body');
  body.appendChild = (el) => { if (el.id) byId.set(el.id, el); };
  const session = store();
  const ctx = {
    console, URL, URLSearchParams, JSON, Math, Date, location,
    document: {
      readyState: 'loading', body,
      addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') loaded.push(fn); },
      getElementById: (id) => byId.get(id) || null, createElement: () => element(''),
      querySelector: () => null, querySelectorAll: () => [],
    },
    history: { state: null, replaceState: (s, t, next) => { const n = new URL(next, u.origin); location.search = n.search; location.hash = n.hash; } },
    localStorage: store(), sessionStorage: session,
    setInterval: (fn) => { const id = nextId++; intervals.set(id, fn); return id; },
    clearInterval: (id) => intervals.delete(id),
    setTimeout: (fn) => { const id = nextId++; timeouts.set(id, fn); return id; },
    clearTimeout: (id) => timeouts.delete(id),
    opener: null, closed: false, close() {}, focus() {}, confirm: () => true,
    addEventListener() {}, removeEventListener() {}, toast() {},
    render: () => { if (typeof ctx.coachAfterRender === 'function') ctx.coachAfterRender(); },
    escHtml: (s) => String(s),
    VIEWS: new Proxy({}, { get: (views, route) => views[route] || (() => '') }),
    PORTALS: [], CLOUD_NAV: [], NAV: {}, PORTAL_CONTEXT: {}, CLOUD_HIGHLIGHT: {}, CLOUD_APP_ROUTE: {},
  };
  ctx.window = ctx;
  ctx.navigate = (hash) => { location.hash = hash; ctx.render(); };
  vm.createContext(ctx);
  for (const [name, source] of SOURCES) vm.runInContext(source, ctx, { filename: name });
  ctx.render();
  loaded.forEach((fn) => fn());
  return {
    run: (code) => vm.runInContext(code, ctx),
    step: () => JSON.parse(session.getItem('mnt.coach.state')).step,
    pollOnce: () => [...intervals.values()].forEach((fn) => fn()),
    // Fires the delayed advances, one at a time, until none are left. Any
    // spotlight timeouts they queue are fired too; they don't move the step.
    flushTimeouts: () => {
      while (timeouts.size) {
        const [id, fn] = timeouts.entries().next().value;
        timeouts.delete(id);
        fn();
      }
    },
    clearPending: () => { timeouts.clear(); },
  };
}

function testRedrawDuringTheWaitDoesNotSkipAStep() {
  const tab = sim();
  tab.clearPending();
  assert.equal(tab.step(), 0);
  // The student opens the ticket: step 1's check now passes.
  tab.run("hdState.selectedTicketId = 'HD-2109'");
  tab.pollOnce();                 // watcher A sees it and schedules the advance
  tab.run('render()');            // a redraw during the 650 ms starts watcher B
  tab.pollOnce();                 // watcher B sees the same step complete
  tab.flushTimeouts();
  assert.equal(tab.step(), 1, 'one completed step advances the coach once');
}

function testOneWatcherStillAdvances() {
  const tab = sim();
  tab.clearPending();
  tab.run("hdState.selectedTicketId = 'HD-2109'");
  tab.pollOnce();
  tab.flushTimeouts();
  assert.equal(tab.step(), 1, 'the normal path advances as before');
}

const tests = [testRedrawDuringTheWaitDoesNotSkipAStep, testOneWatcherStillAdvances];
let failed = 0;
for (const test of tests) {
  try { test(); console.log(`ok   ${test.name}`); } catch (error) { failed += 1; console.log(`FAIL ${test.name}\n     ${error.message}`); }
}
if (failed) { console.log(`${failed} of ${tests.length} failed`); process.exit(1); }
console.log(`coach-step-advance-race: all ${tests.length} passed`);

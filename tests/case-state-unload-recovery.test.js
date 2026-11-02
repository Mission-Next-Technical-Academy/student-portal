#!/usr/bin/env node
// A case-state save is debounced, then written with two round trips. A reload
// or tab close inside that window used to lose the learner's last action:
// the write never landed and loadCaseState() then let the older server row
// overwrite the newer local copy. Found in the 2026-10-21 student lifecycle
// run (M01 Assessment Lab affected device reverted after a quick reload).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'lab-runtime.js'), 'utf8');
const LAB = 'demo-lab';
const MODULE = 'soc-01';

// One "page load": a fresh LabRuntime over a localStorage that survives
// reloads, like the browser's. Timers only run when the test says so.
function page(store, persistResult) {
  const timers = [];
  const writes = [];
  const context = {
    console,
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    persistModuleCaseState: (user, moduleKey, labId, state) => {
      writes.push(JSON.parse(JSON.stringify(state)));
      return Promise.resolve(persistResult);
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'lab-runtime.js' });
  const runtime = vm.runInContext('LabRuntime', context);
  return { runtime, writes, runTimers: () => timers.splice(0).forEach((fn) => fn()) };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const userWith = (labs) => ({ email: 'learner@example.test', userId: 'u1', trackCode: 'SOCAN', remoteCaseState: { [MODULE]: labs } });

(async () => {
  // 1. Reload before the debounced write fires: the local edit wins and is resent.
  {
    const store = new Map();
    const first = page(store, true);
    const serverRow = { [LAB]: { labId: LAB, device: '', savedAt: '2026-10-21T08:00:00.000Z' } };
    let state = first.runtime.loadCaseState(LAB, MODULE, userWith(serverRow), { device: '' });
    state.device = 'LAP-442';
    first.runtime.saveCaseState(LAB, MODULE, userWith(serverRow), state);
    // Tab reloads here: timers never run, nothing reached the server.
    const second = page(store, true);
    state = second.runtime.loadCaseState(LAB, MODULE, userWith(serverRow), { device: '' });
    assert.strictEqual(state.device, 'LAP-442', 'unsynced local edit survives a reload');
    second.runTimers();
    await flush();
    assert.strictEqual(second.writes.at(-1).device, 'LAP-442', 'unsynced local edit is resent to the server');
  }

  // 2. Write confirmed, then another device saves newer work: the server copy wins.
  {
    const store = new Map();
    const first = page(store, true);
    let state = first.runtime.loadCaseState(LAB, MODULE, userWith({}), { device: '' });
    state.device = 'LAP-442';
    first.runtime.saveCaseState(LAB, MODULE, userWith({}), state);
    first.runTimers();
    await flush();
    const newer = { [LAB]: { labId: LAB, anonymousStudentId: state.anonymousStudentId, device: 'WKS-14', savedAt: '2999-01-01T00:00:00.000Z' } };
    const second = page(store, true);
    state = second.runtime.loadCaseState(LAB, MODULE, userWith(newer), { device: '' });
    assert.strictEqual(state.device, 'WKS-14', 'a confirmed save does not override newer work from another device');
  }

  // 3. Unsynced local edit, but another device saved later: the server copy wins.
  {
    const store = new Map();
    const first = page(store, true);
    let state = first.runtime.loadCaseState(LAB, MODULE, userWith({}), { device: '' });
    state.device = 'LAP-442';
    first.runtime.saveCaseState(LAB, MODULE, userWith({}), state);
    const newer = { [LAB]: { labId: LAB, device: 'WKS-14', savedAt: '2999-01-01T00:00:00.000Z' } };
    const second = page(store, true);
    state = second.runtime.loadCaseState(LAB, MODULE, userWith(newer), { device: '' });
    assert.strictEqual(state.device, 'WKS-14', 'newer server work beats an older unsynced edit');
  }

  // 4. The write ran but failed: the edit is still treated as unsynced.
  {
    const store = new Map();
    const first = page(store, undefined);
    const stale = { [LAB]: { labId: LAB, device: '', savedAt: '2026-10-21T08:00:00.000Z' } };
    let state = first.runtime.loadCaseState(LAB, MODULE, userWith(stale), { device: '' });
    state.device = 'LAP-442';
    first.runtime.saveCaseState(LAB, MODULE, userWith(stale), state);
    first.runTimers();
    await flush();
    const second = page(store, true);
    state = second.runtime.loadCaseState(LAB, MODULE, userWith(stale), { device: '' });
    assert.strictEqual(state.device, 'LAP-442', 'a failed write keeps the local edit');
  }

  // 5. A row written before this fix has no savedAt; an unsynced edit still wins.
  {
    const store = new Map();
    const first = page(store, true);
    const legacy = { [LAB]: { labId: LAB, device: '' } };
    let state = first.runtime.loadCaseState(LAB, MODULE, userWith(legacy), { device: '' });
    state.device = 'LAP-442';
    first.runtime.saveCaseState(LAB, MODULE, userWith(legacy), state);
    const second = page(store, true);
    state = second.runtime.loadCaseState(LAB, MODULE, userWith(legacy), { device: '' });
    assert.strictEqual(state.device, 'LAP-442', 'unsynced edit beats a legacy row without savedAt');
  }

  // 6. A saved-but-untouched state still reads as fresh.
  {
    const store = new Map();
    const { runtime } = page(store, true);
    const user = userWith({});
    const fresh = runtime.resetCaseState(LAB, MODULE, user, { device: '' });
    assert.ok(fresh.savedAt, 'saves are stamped');
    assert.ok(runtime.isFreshState(LAB, user, fresh, { device: '' }), 'savedAt does not make a reset state look edited');
  }

  console.log('Case-state unload recovery: all checks passed');
})().catch((err) => { console.error(err); process.exit(1); });

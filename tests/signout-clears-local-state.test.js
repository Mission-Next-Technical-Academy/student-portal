#!/usr/bin/env node
// Sign-out must remove the outgoing student's cached lab answers from
// localStorage (shared PCs), but never a lab whose server write has not
// landed (unsynced marker present). Found in the 2026-10-21 student
// lifecycle run (bug B1).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'lab-runtime.js'), 'utf8');
const MODULE = 'soc-01';

function page(store, persist) {
  const timers = [];
  const context = {
    console,
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    localStorage: {
      get length() { return store.size; },
      key: (i) => Array.from(store.keys())[i] ?? null,
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
    persistModuleCaseState: persist,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'lab-runtime.js' });
  return vm.runInContext('LabRuntime', context);
}

const mk = (email) => ({ email, userId: email, trackCode: 'SOCAN', remoteCaseState: {} });

(async () => {
  const store = new Map();
  const alice = mk('alice@example.test');
  const bob = mk('bob@example.test');
  store.set('mnt-portal.lab-state.v1.other.' + 'x', 'keep'); // unrelated key
  const synced = [];
  const rt = page(store, (u, m, labId) => { synced.push(labId); return Promise.resolve(labId !== 'stuck'); });

  rt.saveCaseState('done', MODULE, alice, { a: 1 });
  rt.saveCaseState('stuck', MODULE, alice, { a: 2 }); // server never confirms
  rt.saveCaseState('done', MODULE, bob, { b: 1 });

  rt.save('browser-only', alice, { c: 1 }); // load/save labs: no server copy

  // Sign-out sequence: flush, wait, clear.
  await rt.flushAllCaseStateWrites();
  rt.clearStudentLocalState(alice);

  assert.strictEqual(store.has(rt.storageKey('done', alice)), false, 'synced lab answers are removed');
  assert.strictEqual(store.has(rt.storageKey('done', alice) + '.unsynced'), false, 'no stale marker');
  assert.strictEqual(store.has(rt.storageKey('stuck', alice)), true, 'unsynced lab is kept');
  assert.strictEqual(store.has(rt.storageKey('stuck', alice) + '.unsynced'), true, 'unsynced marker is kept');
  assert.strictEqual(store.has(rt.storageKey('browser-only', alice)), true, 'browser-only lab state survives');
  assert.strictEqual(store.has(rt.storageKey('done', bob)), true, 'another student is untouched');
  assert.ok(store.has('mnt-portal.lab-state.v1.other.x'), 'unrelated keys are untouched');
  console.log('signout-clears-local-state: ok');
})().catch((e) => { console.error(e); process.exit(1); });

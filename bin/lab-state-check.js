#!/usr/bin/env node
// Verify LabRuntime keeps each lab's state isolated.
//
// Every module lab passes one module-level DEFAULT_STATE constant to both
// load() and reset(). A shallow spread would hand the live state the same
// array instances the constant holds, so a learner's selections would leak
// back into the defaults and survive a reset. This check fails if that
// regresses, and if one lab's reset ever touches another lab's record.
//
//   node bin/lab-state-check.js   (exit 0 = isolated)
const fs = require('fs'), vm = require('vm'), path = require('path');

const store = {};
const ctx = { console, JSON, Math, structuredClone,
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'lab-runtime.js'), 'utf8'), ctx);
// `const LabRuntime` is lexical inside the vm script, so pull it out by name.
const LabRuntime = vm.runInContext('LabRuntime', ctx);

const user = { email: 'user2@example.test' };
const DEFAULTS = { reviewedStations: [], selectedEvidence: [], nested: { picked: [] }, notes: '' };
let failures = 0;
const check = (label, ok) => { console.log(`  ${label}  ${ok ? 'OK' : 'FAIL'}`); if (!ok) failures += 1; };

const state = LabRuntime.load('probe-lab', user, DEFAULTS);
state.selectedEvidence.push('ev-1');
state.reviewedStations.push('rule-desk');
state.nested.picked.push('p-1');
state.notes = 'typed';
LabRuntime.save('probe-lab', user, state);

check('defaults untouched by learner selections',
  DEFAULTS.selectedEvidence.length === 0 && DEFAULTS.reviewedStations.length === 0 && DEFAULTS.nested.picked.length === 0);

const neighbour = LabRuntime.load('other-lab', user, DEFAULTS);
neighbour.selectedEvidence.push('ev-9');
LabRuntime.save('other-lab', user, neighbour);

const fresh = LabRuntime.reset('probe-lab', user, DEFAULTS);
check('reset clears arrays', fresh.selectedEvidence.length === 0 && fresh.reviewedStations.length === 0);
check('reset clears nested defaults', fresh.nested.picked.length === 0);
check('reset clears scalars', fresh.notes === '' && fresh.attempts === 0 && fresh.score === 0);
check('reset leaves the neighbouring lab intact',
  JSON.parse(store[LabRuntime.storageKey('other-lab', user)]).selectedEvidence.length === 1);

store['unrelated-course-key'] = 'keep';
LabRuntime.reset('probe-lab', user, DEFAULTS);
check('reset leaves unrelated course storage intact', store['unrelated-course-key'] === 'keep');

console.log(failures ? `${failures} lab-state check(s) failed` : 'lab state isolated');
process.exit(failures ? 1 : 0);

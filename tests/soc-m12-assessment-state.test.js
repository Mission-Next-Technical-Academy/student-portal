#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const store = new Map();
const context = { console, setTimeout: () => 0, clearTimeout: () => {}, localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) } };
vm.createContext(context);
for (const file of ['lab-runtime.js','soc-m12-assessment-data.js','soc-m12-assessment-state.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
context.user = { id: 'm12-learner', email: 'm12@example.test' };
vm.runInContext(`(() => {
  let state = SocM12AssessmentState.load(user, SocM12AssessmentData);
  state = SocM12AssessmentState.record(state, SocM12AssessmentData, 'review-alert', {
    alertId: 'AL-1201', disposition: 'true-positive', reason: 'Process and network records corroborate the alert.'
  });
  SocM12AssessmentState.save(user, state, SocM12AssessmentData);
})()`, context);
const restored = JSON.parse(JSON.stringify(vm.runInContext('SocM12AssessmentState.load(user, SocM12AssessmentData)', context)));
assert.equal(restored.alertReviews['AL-1201'].disposition, 'true-positive');
assert.equal(restored.actionHistory.length, 1);
assert.ok(restored.labId && restored.anonymousStudentId, 'LabRuntime identity fields survive normalization and restore');
const reset = JSON.parse(JSON.stringify(vm.runInContext('SocM12AssessmentState.reset(user, SocM12AssessmentData)', context)));
assert.equal(reset.actionHistory.length, 0);
assert.ok(reset.labId && reset.anonymousStudentId, 'reset keeps LabRuntime identity fields for the next state mutation');
console.log('M12 assessment state and LabRuntime identity contract: passed');

#!/usr/bin/env node
// Round-trips each assessment state through the real LabRuntime (not a stub).
// LabRuntime only restores a saved record that keeps its labId and
// anonymousStudentId, so a normalize() that drops them silently loses every
// learner action on the next load.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const store = new Map();
const context = {
  console,
  setTimeout: () => 0,
  clearTimeout: () => {},
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
};
vm.createContext(context);
for (const file of [
  'lab-runtime.js', 'soc-assessment-scorer.js', 'kql-engine.js',
  'soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m06-assessment-data.js', 'soc-m06-assessment-actions.js', 'soc-m06-assessment-state.js', 'attack-catalog.js', 'soc-m06-assessment-related-search.js',
  'soc-m07-assessment-data.js', 'soc-m07-assessment-state.js',
  'soc-m08-assessment-data.js', 'soc-m08-assessment-state.js',
  'soc-m09-assessment-data.js', 'soc-m09-assessment-state.js',
]) vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });

const user = { id: 'persist-learner', email: 'persist@example.test' };
context.testUser = user;
for (const m of ['05', '06', '07', '08', '09']) {
  const reloaded = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    const state = SocM${m}AssessmentState.load(testUser, SocM${m}AssessmentData);
    SocM${m}AssessmentState.save(testUser, state, SocM${m}AssessmentData);
    return LabRuntime.loadCaseState(SocM${m}AssessmentData.scenario.stateKey, SocM${m}AssessmentState.MODULE_KEY, testUser, {});
  })()`, context)));
  assert.strictEqual(reloaded.scenarioId, vm.runInContext(`SocM${m}AssessmentData.scenario.id`, context), `M${m} saved state is restored by LabRuntime`);
}

// An M06 hunt action survives a reload.
const queries = vm.runInContext(`(() => {
  const fixture = SocM06AssessmentData;
  const state = SocM06AssessmentState.load(testUser, fixture);
  const next = SocM06AssessmentRelatedSearch.search(state, fixture, { startTime: '2026-09-26T09:30:00.000Z', endTime: fixture.scenario.scope.timeEnd, entityType: 'device', entityValue: 'ws-318' }, '', '2026-09-27T10:00:00.000Z').state;
  SocM06AssessmentState.save(testUser, next, fixture);
  return SocM06AssessmentState.load(testUser, fixture).queryHistory.length;
})()`, context);
assert.strictEqual(queries, 1, 'an M06 related-event search persists across a reload');
console.log('Assessment state persistence through LabRuntime: all checks passed');

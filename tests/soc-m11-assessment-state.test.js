#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const store = new Map();
const context = {
  console, setTimeout: () => 0, clearTimeout: () => {},
  localStorage: { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
};
vm.createContext(context);
for (const file of ['lab-runtime.js', 'soc-m11-assessment-data.js', 'soc-m11-assessment-state.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const fixture = vm.runInContext('SocM11AssessmentData', context);
const api = vm.runInContext('SocM11AssessmentState', context);
const empty = api.normalize({}, fixture);
assert.strictEqual(empty.actionHistory.length, 0);
assert.strictEqual(empty.nextActionSequence, 1);
assert.strictEqual(empty.closure, null);

let state = api.assign(empty, fixture, 'Q-03', 'an-chen');
assert.strictEqual(state.assignments['Q-03'], 'an-chen');
assert.strictEqual(state.actionHistory[0].id, 'M11-ASSESS-2026-09-27:ACTION-000001');
assert.strictEqual(state.actionHistory[0].timestamp, fixture.scenario.fixedAt, 'actions default to the shift clock');
assert.ok(Object.isFrozen(state.actionHistory[0]), 'history entries are immutable');
assert.strictEqual(empty.actionHistory.length, 0, 'transitions do not mutate their input');
assert.throws(() => api.assign(state, fixture, 'Q-05', 'an-chen'), /unknown id/, 'closed items cannot be assigned');
assert.throws(() => api.assign(state, fixture, 'Q-03', 'an-nobody'), /analyst is unknown/);
assert.throws(() => api.escalate(state, fixture, 'Q-03', 'nowhere', 'Needs incident lead review.'), /route is unknown/);
assert.throws(() => api.setPriority(state, fixture, ['Q-03', 'Q-03']), /duplicates/);
assert.throws(() => api.improvementAction(state, fixture, { title: 'Validate fs-02', ownerId: 'fs02-service-owner', dueDate: '2026-09-26', kind: 'follow_up' }), /on or after/);
assert.throws(() => api.improvementAction(state, fixture, { title: 'Validate fs-02', ownerId: 'someone', dueDate: '2026-09-30', kind: 'follow_up' }), /owner/);
assert.throws(() => api.report(state, fixture, 'memo', { summary: 'A summary that is long enough.' }), /kind is invalid/);
assert.throws(() => api.closureDecision(state, fixture, { decision: 'retain', rationale: 'Pending items.', evidenceIds: ['M11-REC-99'] }), /unknown id/);
assert.throws(() => api.assign(state, fixture, 'Q-02', 'an-patel', '2026-09-27T13:00:00.000Z'), /inside the shift window/);

state = api.escalate(state, fixture, 'Q-03', 'ir-lead-owners', 'Critical macro execution needs incident lead review.');
state = api.setPriority(state, fixture, ['Q-03', 'Q-02', 'Q-04']);
state = api.handoff(state, fixture, { summary: 'Shift summary for evening lead with open work.', openItems: ['Q-01', 'Q-02', 'Q-03'], risks: ['fs-02 validation pending'], nextActions: ['Confirm credential reset'] });
state = api.report(state, fixture, 'closure', { summary: 'Closure review for INC-4937 on ws-173.', residualRisk: 'fs-02 validation pending' });
state = api.improvementAction(state, fixture, { title: 'Validate fs-02 service', ownerId: 'fs02-service-owner', dueDate: '2026-09-29', kind: 'follow_up', evidenceId: 'M11-REC-04' });
state = api.closureDecision(state, fixture, { decision: 'retain', rationale: 'Residual risk remains open.', evidenceIds: ['M11-REC-04'] });
assert.strictEqual(state.actionHistory.length, 7);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.priorityOrder)), ['Q-03', 'Q-02', 'Q-04']);
assert.strictEqual(state.improvementActions[0].id, 'M11-FOLLOWUP-001');
assert.strictEqual(state.reports.closure.residualRisk, 'fs-02 validation pending');

// Replay is the source of truth: tampered projections are rebuilt and invalid actions dropped.
const tampered = JSON.parse(JSON.stringify(state));
tampered.assignments['Q-02'] = 'an-okafor';
tampered.actionHistory.push({ id: 'forged', sequence: 99, type: 'assign', timestamp: fixture.scenario.fixedAt, details: { itemId: 'Q-02', analystId: 'an-okafor' } });
const replayed = api.normalize(tampered, fixture);
assert.strictEqual(replayed.assignments['Q-02'], undefined, 'projections are rebuilt from valid history only');
assert.strictEqual(replayed.actionHistory.length, 7);

// LabRuntime round trip through the real lab-runtime.js.
context.user = { id: 'm11-learner', email: 'm11@example.test' };
// A learner's state always starts from load(), which carries LabRuntime identity fields.
context.history = JSON.parse(JSON.stringify(state.actionHistory));
vm.runInContext(`(() => {
  let current = SocM11AssessmentState.load(user, SocM11AssessmentData);
  current = SocM11AssessmentState.assign(current, SocM11AssessmentData, 'Q-03', 'an-chen');
  SocM11AssessmentState.save(user, { ...current, actionHistory: history }, SocM11AssessmentData);
})()`, context);
const restored = JSON.parse(JSON.stringify(vm.runInContext('SocM11AssessmentState.load(user, SocM11AssessmentData)', context)));
assert.strictEqual(restored.actionHistory.length, 7, 'saved state restores through LabRuntime');
assert.strictEqual(restored.closure.decision, 'retain');
assert.ok(restored.labId && restored.anonymousStudentId, 'LabRuntime identity fields survive normalization');
const reset = JSON.parse(JSON.stringify(vm.runInContext('SocM11AssessmentState.reset(user, SocM11AssessmentData)', context)));
assert.strictEqual(reset.actionHistory.length, 0);
assert.ok(reset.labId && reset.anonymousStudentId, 'reset preserves LabRuntime identity for the next action');
console.log('M11 assessment state contract: all checks passed');

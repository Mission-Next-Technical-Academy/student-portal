#!/usr/bin/env node
'use strict';
// Capstone risk fixes (docs/workstreams/CAPSTONE_SKILL_BACKFILL.md, "Capstone bugs / risks"
// items 2, 4 and 6 of the list, plus the open-risk note on alert-disposition):
// key-order-insensitive load, partial/failed M09 results on permitted actions,
// and the retired alert-disposition type.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const FILES = ['portal/soc-assessment-scorer.js', 'portal/soc-m12-assessment-data.js', 'portal/soc-m12-assessment-state.js',
  'portal/soc-m12-assessment-rubric.js', 'portal/soc-m12-assessment-scorer.js'];
function boot(extra = {}) {
  const ctx = vm.createContext({ console, ...extra });
  for (const file of FILES) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  return ctx;
}
const reverseKeys = (value) => Array.isArray(value) ? value.map(reverseKeys)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).reverse().map((k) => [k, reverseKeys(value[k])]))
  : value;
const clone = (value) => JSON.parse(JSON.stringify(value));

const ctx = boot();
const fixture = vm.runInContext('SocM12AssessmentData', ctx);
const api = vm.runInContext('SocM12AssessmentState', ctx);
const rubric = vm.runInContext('SocM12AssessmentRubric', ctx);
const scorer = vm.runInContext('SocM12AssessmentScorer', ctx);
const rec = (state, type, details) => api.record(state, fixture, type, details);
const last = (state) => state.actionHistory.at(-1).details;
const containment = (state) => rubric.extractV2(state, fixture).criteria.find((c) => c.id === 'tuning-automation-containment').points;

// ---- Risk 2: load() must not re-save when jsonb has only reordered keys.
{
  const base = api.normalize(clone(rec(api.fresh(fixture), 'review-alert', { alertId: 'AL-1201', disposition: 'true-positive',
    reason: 'Process and network records corroborate the alert.' })), fixture);
  const saves = [];
  const runtime = (stored) => ({
    loadCaseState: () => clone(stored),
    saveCaseState: (key, mod, user, state) => { saves.push(state); return state; },
    resetCaseState: () => ({}) });
  const reordered = boot({ user: { id: 'm12-learner' }, LabRuntime: runtime(reverseKeys(clone(base))) });
  const loaded = vm.runInContext('SocM12AssessmentState.load(user, SocM12AssessmentData)', reordered);
  assert.equal(saves.length, 0, 'key-reordered saved state does not trigger a re-save');
  assert.deepStrictEqual(clone(loaded), clone(base), 'reordered state loads with the same content');

  // A stored state that normalization actually changes (an invalid action it drops) is still re-saved.
  const dirty = clone(base);
  dirty.actionHistory.push({ id: 'bogus', sequence: 99, type: 'review-alert', timestamp: 'nope', details: {} });
  vm.runInContext('SocM12AssessmentState.load(user, SocM12AssessmentData)', boot({ user: { id: 'm12-learner' }, LabRuntime: runtime(dirty) }));
  assert.equal(saves.length, 1, 'a stored state that normalization changes is still saved');
}

// ---- Risk 6: an approved, in-scope action keeps its partial/failed result and is not unsafe.
{
  let s = rec(api.fresh(fixture), 'approval', { action: 'isolate', target: 'ws-204', approved: true, reason: 'Approved by incident lead.' });
  s = rec(s, 'execute', { action: 'isolate', target: 'ws-204', sourceOutcome: 'partial' });
  assert.equal(last(s).outcome, 'partial', 'a partial M09 result is recorded as partial');
  assert.equal(last(s).blockReason, '', 'a partial result is not a block');
  assert.equal(rubric.extractV2(s, fixture).unsafeExecution, false, 'approved in-scope partial is not unsafe');
  const result = scorer.score(s, fixture);
  assert.equal(result.unsafeExecution, false);
  assert.equal(result.safetyCap ?? null, null, 'no 69 cap for an approved partial result');

  let success = rec(api.fresh(fixture), 'approval', { action: 'isolate', target: 'ws-204', approved: true, reason: 'Approved by incident lead.' });
  success = rec(success, 'execute', { action: 'isolate', target: 'ws-204' });
  assert.ok(containment(s) < containment(success), 'a partial result earns less containment credit than a success');

  let f = rec(api.fresh(fixture), 'approval', { action: 'revoke-session', target: 'acct-204', approved: true, reason: 'Approved by incident lead.' });
  f = rec(f, 'execute', { action: 'revoke-session', target: 'acct-204', sourceOutcome: 'failure' });
  assert.equal(last(f).outcome, 'failure', 'a failed M09 result is recorded as failure');
  assert.equal(rubric.extractV2(f, fixture).unsafeExecution, false, 'approved in-scope failure is not unsafe');
}

// Unapproved or out-of-scope attempts stay blocked and unsafe, whatever the source result.
{
  const unapproved = rec(api.fresh(fixture), 'execute', { action: 'isolate', target: 'ws-204', sourceOutcome: 'partial' });
  assert.equal(last(unapproved).outcome, 'blocked');
  assert.match(last(unapproved).blockReason, /approval/);
  assert.equal(rubric.extractV2(unapproved, fixture).unsafeExecution, true, 'unapproved protected action is unsafe');

  const outOfScope = rec(api.fresh(fixture), 'execute', { action: 'block-indicator', target: '198.51.100.9', sourceOutcome: 'partial' });
  assert.equal(last(outOfScope).outcome, 'blocked');
  assert.match(last(outOfScope).blockReason, /scope/);
  assert.equal(rubric.extractV2(outOfScope, fixture).unsafeExecution, true, 'out-of-scope action is unsafe');

  const unknownResult = rec(rec(api.fresh(fixture), 'approval', { action: 'isolate', target: 'ws-204', approved: true, reason: 'x' }),
    'execute', { action: 'isolate', target: 'ws-204', sourceOutcome: 'blocked' });
  assert.equal(last(unknownResult).outcome, 'blocked', 'an unrecognised source result still blocks');
}

// Replay re-derives persisted attempts: a partial stored as blocked (older code) reads as partial.
{
  let s = rec(api.fresh(fixture), 'approval', { action: 'isolate', target: 'ws-204', approved: true, reason: 'x' });
  s = rec(s, 'execute', { action: 'isolate', target: 'ws-204', sourceOutcome: 'partial' });
  const stored = clone(s);
  stored.actionHistory.at(-1).details.outcome = 'blocked';
  assert.equal(api.normalize(stored, fixture).actionHistory.at(-1).details.outcome, 'partial', 'replay re-derives the partial outcome');
}

// Recovery monitoring that reopens (residual risk) records partial, not blocked.
{
  let s = rec(api.fresh(fixture), 'execute', { action: 'preserve', target: 'ws-204' });
  s = rec(s, 'recovery', { action: 'remove-persistence', target: 'ws-204' });
  s = rec(s, 'approval', { action: 'restore', target: 'BK-204-0900', approved: true, reason: 'Known-good point approved.' });
  s = rec(s, 'recovery', { action: 'restore', target: 'BK-204-0900' });
  s = rec(s, 'recovery', { action: 'scan', target: 'ws-204' });
  s = rec(s, 'recovery', { action: 'monitor', target: 'ws-204', sourceOutcome: 'partial' });
  assert.equal(last(s).outcome, 'partial', 'a reopened monitor step is recorded as partial');
  assert.equal(rubric.extractV2(s, fixture).unsafeExecution, false);
}

// ---- Risk 1: alert-disposition is retired; review-alert is the one alert determination record.
{
  assert.throws(() => rec(api.fresh(fixture), 'alert-disposition', { alertId: 'AL-1201', disposition: 'true-positive', reason: 'x' }),
    /invalid|Unsupported/, 'the retired type is refused');
  assert.ok(!api.TYPES.includes('alert-disposition'));
  const review = rec(api.fresh(fixture), 'review-alert', { alertId: 'AL-1201', disposition: 'true-positive',
    reason: 'Process and network records corroborate the alert.' });
  assert.equal(review.dispositions['AL-1201'], 'true-positive', 'review-alert still sets the disposition');
  const legacy = clone(review);
  legacy.actionHistory[0].type = 'alert-disposition';
  assert.equal(api.normalize(legacy, fixture).actionHistory.length, 0, 'a persisted legacy alert-disposition entry is dropped on replay');
}

console.log('M12 capstone risk fixes (load compare, partial/failed M09 results, retired alert-disposition): passed');

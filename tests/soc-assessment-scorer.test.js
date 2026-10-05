#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const filename of ['soc-assessment-scorer.js', 'soc-assessment-evolution.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', filename), 'utf8'), context, { filename });
}

const scorer = vm.runInContext('SocAssessmentScorer', context);
const evolution = vm.runInContext('SocAssessmentEvolution', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const domains = ['triage', 'query', 'response', 'closure'];

function check(name, answers, options, expected) {
  assert.deepStrictEqual(local(scorer.scoreDomains(domains, answers, options)), expected, `${name}: shared scorer`);
  assert.deepStrictEqual(local(evolution.scoreDomains(domains, answers, options)), expected, `${name}: evolution API`);
  console.log(`  ok   ${name}`);
}

console.log('SOC assessment shared scorer');

check('passing score at the configured threshold',
  { triage: true, query: true, response: true, closure: false },
  { passingScore: 75 },
  {
    score: 75, rawScore: 30, max: 40, passed: true, criticalMisses: [],
    breakdown: [
      { id: 'triage', score: 10, max: 10 },
      { id: 'query', score: 10, max: 10 },
      { id: 'response', score: 10, max: 10 },
      { id: 'closure', score: 0, max: 10 },
    ],
  });

check('partial credit and rounding',
  { triage: true, query: 0.5, response: 0.25, closure: false },
  undefined,
  {
    score: 45, rawScore: 18, max: 40, passed: false, criticalMisses: [],
    breakdown: [
      { id: 'triage', score: 10, max: 10 },
      { id: 'query', score: 5, max: 10 },
      { id: 'response', score: 3, max: 10 },
      { id: 'closure', score: 0, max: 10 },
    ],
  });

check('critical miss caps a perfect raw result',
  { triage: true, query: true, response: true, closure: true },
  { criticalMisses: ['closed before recovery validation'] },
  {
    score: 69, rawScore: 40, max: 40, passed: false,
    criticalMisses: ['closed before recovery validation'],
    breakdown: domains.map((id) => ({ id, score: 10, max: 10 })),
  });

check('configured threshold above the result fails',
  { triage: true, query: true, response: true, closure: false },
  { passingScore: 76 },
  {
    score: 75, rawScore: 30, max: 40, passed: false, criticalMisses: [],
    breakdown: [
      { id: 'triage', score: 10, max: 10 },
      { id: 'query', score: 10, max: 10 },
      { id: 'response', score: 10, max: 10 },
      { id: 'closure', score: 0, max: 10 },
    ],
  });

const criteria = [
  { id: 'triage', label: 'Alert triage', weight: 40 },
  { id: 'response', label: 'Response', weight: 60 },
];
const outcomes = {
  triage: {
    awards: [
      { points: 25, reason: 'Identified the alert' },
      { points: 10, reason: 'Confirmed the scope' },
    ],
    evidence: ['Alert A1', 'Scoped query Q2'],
    misses: ['No related host pivot'],
    deductions: [{ points: 5, reason: 'Scope was initially too broad' }],
    feedback: 'Triage is supported, but the host pivot is missing.',
  },
  response: {
    awards: [{ points: 60, reason: 'Verified the response' }],
    evidence: ['Validation V1'],
  },
};

const scored = local(scorer.scoreCriteria(criteria, outcomes));
assert.deepStrictEqual(scored.criteria.map(({ id, points, max }) => ({ id, points, max })), [
  { id: 'triage', points: 30, max: 40 },
  { id: 'response', points: 60, max: 60 },
]);
assert.deepStrictEqual(scored.review, {
  total: 90,
  max: 100,
  pass: true,
  cap: null,
  awards: [
    { criterionId: 'triage', criterion: 'Alert triage', points: 25, reason: 'Identified the alert' },
    { criterionId: 'triage', criterion: 'Alert triage', points: 10, reason: 'Confirmed the scope' },
    { criterionId: 'response', criterion: 'Response', points: 60, reason: 'Verified the response' },
  ],
  supportingEvidence: [
    { criterionId: 'triage', criterion: 'Alert triage', text: 'Alert A1' },
    { criterionId: 'triage', criterion: 'Alert triage', text: 'Scoped query Q2' },
    { criterionId: 'response', criterion: 'Response', text: 'Validation V1' },
  ],
  misses: [{ criterionId: 'triage', criterion: 'Alert triage', text: 'No related host pivot' }],
  deductions: [{ criterionId: 'triage', criterion: 'Alert triage', points: 5, reason: 'Scope was initially too broad' }],
  feedback: [
    'Triage is supported, but the host pivot is missing.',
    'Response: 60 of 60 points awarded.',
  ],
});
assert.deepStrictEqual(local(scorer.scoreCriteria(criteria, outcomes)), scored, 'repeat scoring must be deterministic');
console.log('  ok   weighted awards, evidence, misses, deductions, and repeatability');

const viewedOnly = local(scorer.scoreCriteria(criteria, {
  triage: {
    awards: [{ points: 25, reason: 'Identified the alert' }],
    evidence: ['Viewed an unsafe action option without executing it'],
  },
}));
assert.strictEqual(viewedOnly.review.total, 25);
assert.strictEqual(viewedOnly.review.cap, null);
assert.deepStrictEqual(viewedOnly.review.misses, []);
assert.deepStrictEqual(viewedOnly.review.deductions, []);
assert.strictEqual(viewedOnly.criteria[1].points, 0);
console.log('  ok   exploration does not imply a miss, deduction, or cap');

const capped = local(scorer.scoreCriteria(criteria, outcomes, {
  cap: { points: 69, reason: 'Executed an unsafe action' },
}));
assert.deepStrictEqual(capped.review.cap, {
  points: 69, reason: 'Executed an unsafe action', applied: true,
});
assert.strictEqual(capped.review.total, 69);
assert.strictEqual(capped.review.pass, false);
assert.strictEqual(capped.criteria[0].points, 30);
assert.strictEqual(capped.criteria[1].points, 60);
assert.strictEqual(capped.review.feedback.at(-1), 'Score capped at 69 points: Executed an unsafe action.');
console.log('  ok   explicit cap leaves criterion awards reviewable');

const zeroCredit = local(scorer.scoreCriteria(criteria, {}));
assert.deepStrictEqual(zeroCredit.criteria.map(({ points }) => points), [0, 0]);
assert.strictEqual(zeroCredit.review.total, 0);
assert.strictEqual(zeroCredit.review.pass, false);
assert.strictEqual(zeroCredit.review.cap, null);
assert.deepStrictEqual(zeroCredit.review.awards, []);
assert.deepStrictEqual(zeroCredit.review.supportingEvidence, []);
console.log('  ok   zero-credit outcome');

const passLine = local(scorer.scoreCriteria(criteria, {
  triage: { awards: [{ points: 40, reason: 'Completed triage' }] },
  response: { awards: [{ points: 30, reason: 'Partially completed response' }] },
}));
assert.strictEqual(passLine.review.total, 70);
assert.strictEqual(passLine.review.pass, true);
assert.deepStrictEqual(passLine.criteria.map(({ points }) => points), [40, 30]);
const belowPassLine = local(scorer.scoreCriteria(criteria, {
  triage: { awards: [{ points: 40, reason: 'Completed triage' }] },
  response: { awards: [{ points: 29, reason: 'Partially completed response' }] },
}));
assert.strictEqual(belowPassLine.review.total, 69);
assert.strictEqual(belowPassLine.review.pass, false);
console.log('  ok   exact 70-point pass boundary');

const corrected = local(scorer.scoreCriteria(criteria, {
  triage: {
    history: ['Initially missed a related host', 'Corrected the scope'],
    awards: [{ points: 40, reason: 'Confirmed the final scope' }],
    evidence: ['Corrected host pivot'],
  },
  response: { awards: [{ points: 60, reason: 'Verified the final response' }] },
}));
assert.strictEqual(corrected.review.total, 100);
assert.strictEqual(corrected.review.pass, true);
assert.deepStrictEqual(corrected.criteria.map(({ points }) => points), [40, 60]);
assert.deepStrictEqual(corrected.review.misses, []);
assert.deepStrictEqual(corrected.review.deductions, []);
assert.strictEqual(corrected.review.cap, null);
console.log('  ok   corrected final outcome earns full credit without history penalties');

const queryCriteria = [{ id: 'query', label: 'Investigation query', weight: 100 }];
const queryOutcome = (queryText) => ({
  query: {
    queryText,
    awards: [{ points: 100, reason: 'Found the scoped activity' }],
    evidence: ['Scoped activity confirmed'],
  },
});
const directQuery = local(scorer.scoreCriteria(queryCriteria, queryOutcome('SecurityEvent | where Account == "analyst"')));
const pivotQuery = local(scorer.scoreCriteria(queryCriteria, queryOutcome('DeviceProcessEvents | where InitiatingProcessAccountName == "analyst"')));
assert.deepStrictEqual(pivotQuery, directQuery);
assert.strictEqual(pivotQuery.review.total, 100);
console.log('  ok   alternate query paths with the same outcome score equally');

const fullOutcome = {
  triage: { awards: [{ points: 40, reason: 'Completed triage' }] },
  response: { awards: [{ points: 60, reason: 'Verified response' }] },
};
const viewedUnsafe = local(scorer.scoreCriteria(criteria, {
  ...fullOutcome,
  response: { ...fullOutcome.response, evidence: ['Viewed unsafe action option only'] },
}));
assert.strictEqual(viewedUnsafe.review.total, 100);
assert.strictEqual(viewedUnsafe.review.pass, true);
assert.strictEqual(viewedUnsafe.review.cap, null);
const executedUnsafe = local(scorer.scoreCriteria(criteria, {
  ...fullOutcome,
  response: { ...fullOutcome.response, evidence: ['Executed unsafe action'] },
}, { cap: { points: 69, reason: 'Executed unsafe action' } }));
assert.strictEqual(executedUnsafe.review.total, 69);
assert.strictEqual(executedUnsafe.review.pass, false);
assert.deepStrictEqual(executedUnsafe.review.cap, {
  points: 69, reason: 'Executed unsafe action', applied: true,
});
assert.deepStrictEqual(executedUnsafe.criteria.map(({ points }) => points), [40, 60]);
console.log('  ok   view-only evidence remains uncapped; explicit execution applies the cap');

console.log('all passing');

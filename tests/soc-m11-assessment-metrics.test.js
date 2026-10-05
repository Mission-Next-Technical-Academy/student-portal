#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m11-assessment-data.js', 'soc-m11-assessment-metrics.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context, { filename: file });
}
const fixture = vm.runInContext('SocM11AssessmentData', context);
const metrics = vm.runInContext('SocM11AssessmentMetrics', context);
const view = JSON.parse(JSON.stringify(metrics.compute(fixture, {})));
const truth = fixture.expectedTruth.metrics;
assert.strictEqual(view.alertVolume, truth.alertVolume);
assert.strictEqual(view.mttaMinutes, truth.mttaMinutes);
assert.strictEqual(view.mttrMinutes, truth.mttrMinutes);
assert.strictEqual(view.backlog, truth.backlog);
assert.deepStrictEqual(view.distribution, { true_positive: 2, benign_positive: 1, false_positive: 2 }, 'distribution only counts already-dispositioned items');
const status = Object.fromEntries(view.sla.map((entry) => [entry.id, entry.status]));
for (const id of fixture.expectedTruth.slaBreaches) assert.strictEqual(status[id], 'breached', `${id} breached`);
for (const id of fixture.expectedTruth.slaAtRisk) assert.strictEqual(status[id], 'at_risk', `${id} at risk`);
assert.strictEqual(view.ruleNoise.find((rule) => rule.ruleId === fixture.expectedTruth.noisyRuleId).nonTruePositiveRate, truth.noisyRuleNonTruePositiveRate);
assert.ok(view.ruleNoise.filter((rule) => rule.ruleId !== fixture.expectedTruth.noisyRuleId).every((rule) => rule.nonTruePositiveRate === null || rule.nonTruePositiveRate < 1));
assert.ok(view.caveats.some((line) => /does not establish/.test(line)), 'trend carries a no-causation caveat');
assert.strictEqual(view.trend.reduce((sum, bucket) => sum + bucket.created, 0), view.alertVolume);
assert.ok(!JSON.stringify(view.queue).includes('benign_positive'), 'open items never show their truth disposition');
const withAssignment = metrics.compute(fixture, { assignments: { 'Q-03': 'an-chen' } });
assert.strictEqual(withAssignment.unassigned, view.unassigned - 1, 'learner assignments update the assigned count');
assert.strictEqual(withAssignment.workload.find((row) => row.analystId === 'an-chen').openItems, 2);
assert.deepStrictEqual(JSON.parse(JSON.stringify(metrics.compute(fixture, {}))), view, 'deterministic');
console.log('M11 assessment metrics: all checks passed');

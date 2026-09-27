#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m11-assessment-data.js'), 'utf8'), context);
const data = vm.runInContext('SocM11AssessmentData', context);
const s = data.scenario;
assert.strictEqual(s.id, 'M11-ASSESS-2026-09-27');
assert.strictEqual(s.caseId, 'OPS-5511');
assert.strictEqual(s.stateKey, 'm11-soc-operations-assessment-v1'); // gitleaks:allow
assert.ok(Object.isFrozen(data) && Object.isFrozen(s.queue[0]), 'fixture is deeply frozen');
const inWindow = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)
  && Date.parse(value) >= Date.parse(s.start) && Date.parse(value) <= Date.parse(s.end);
assert.ok(s.queue.length >= 10 && s.queue.length <= 14);
const ids = new Set(s.queue.map((item) => item.id));
assert.strictEqual(ids.size, s.queue.length, 'queue ids are unique');
for (const item of s.queue) {
  assert.ok(inWindow(item.createdAt), `${item.id} created inside the shift`);
  for (const field of ['acknowledgedAt', 'containedAt']) if (item[field]) assert.ok(inWindow(item[field]) && item[field] >= item.createdAt, `${item.id} ${field}`);
  assert.ok(s.rules.some((rule) => rule.id === item.ruleId), `${item.id} rule exists`);
  assert.ok(item.assigneeId === null || s.analysts.some((analyst) => analyst.id === item.assigneeId));
  assert.ok(!('truthDisposition' in item) && !('disposition' in item), 'open items carry no hidden truth');
  if (item.recordedDisposition) assert.strictEqual(item.status, 'closed', 'only closed items have a recorded disposition');
}
for (const evidence of s.incident.recoveryEvidence) assert.ok(inWindow(evidence.time));
const truth = data.expectedTruth;
assert.strictEqual(truth.closureDecision, 'retain');
assert.ok(truth.residualRisks.every((risk) => s.incident.recoveryEvidence.find((item) => item.id === risk.evidenceId)?.status === 'pending'),
  'every residual risk is backed by a pending recovery record');
assert.ok([...truth.slaBreaches, ...truth.slaAtRisk, ...truth.queuePriority.map((entry) => entry.itemId)].every((id) => ids.has(id)));
assert.ok(s.rules.some((rule) => rule.id === truth.noisyRuleId));
assert.ok(truth.residualRisks.every((risk) => s.ownerIds.includes(risk.ownerId)));
console.log('M11 assessment data contract: all checks passed');

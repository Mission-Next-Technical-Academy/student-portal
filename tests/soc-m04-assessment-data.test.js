#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m04-assessment-data.js'), 'utf8'), context);
const data = vm.runInContext('SocM04AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(data.scenario.id, 'M04-ASSESS-2026-09-24');
assert.strictEqual(data.scenario.caseId, 'CASE-044424');
const scenarioIdentifiers = [data.scenario.id, data.scenario.caseId, 'm04-detection-enrichment-v1'];
assert.strictEqual(new Set(scenarioIdentifiers).size, scenarioIdentifiers.length,
  'scenario, case, and persisted lab-state identifiers are distinct');
assert.strictEqual(data.scenario.start, '2026-09-24T09:00:00Z');
assert.ok(data.scenario.telemetry.length > 0);
assert.ok(data.scenario.telemetry.every((row) => row.time >= data.scenario.start && row.time <= data.scenario.end));
assert.ok(data.scenario.telemetry.every((row) => row.id.startsWith('M04-A-')));
assert.ok(data.scenario.telemetry.every((row) => row.id !== data.scenario.id && row.id !== data.scenario.caseId));
assert.ok(data.scenario.reports.every((row) => row.id.startsWith('M04-R-')));
assert.ok(data.scenario.reports.every((row) => row.sourceReliability && Number.isInteger(row.confidence) && row.freshness && row.status));
assert.deepStrictEqual(local(data.scenario.reports[1].attackReferences), ['T1110.003 · Password Spraying']);
assert.ok(data.scenario.reports[1].campaign);
assert.ok(data.scenario.iocs.every((row) => row.id.startsWith('M04-I-')));
assert.deepStrictEqual(local(data.scenario.truth.targetedAccounts), ['acct-41', 'acct-42', 'acct-43', 'acct-44', 'acct-45']);
assert.deepStrictEqual(local(data.scenario.truth.confirmedCompromisedAccounts), ['acct-44']);
assert.strictEqual(data.scenario.truth.rule.groupingField, 'sourceIp');
assert.strictEqual(data.scenario.truth.rule.metric, 'distinctAccounts');
assert.deepStrictEqual(local(data.scenario.truth.rule.excludeEventIds), ['M04-A-007', 'M04-A-008', 'M04-A-009']);
const telemetryIds = new Set(data.scenario.telemetry.map((row) => row.id));
const truthEventIds = [
  ...data.scenario.truth.successfulAuthenticationEventIds,
  ...data.scenario.truth.benignRetry.eventIds,
  ...data.scenario.truth.rule.matchEventIds,
  ...data.scenario.truth.rule.excludeEventIds,
];
assert.ok(truthEventIds.every((id) => telemetryIds.has(id)), 'answer-key event references resolve only within this synthetic fixture');
assert.ok(data.scenario.reports.every((report) => report.id.startsWith('M04-R-')));
assert.ok(data.scenario.iocs.every((ioc) => ioc.id.startsWith('M04-I-')));
assert.ok(data.scenario.reports.every((report) => data.scenario.iocs.every((ioc) => ![report.id, data.scenario.id, data.scenario.caseId].includes(ioc.id))));
assert.ok(Object.isFrozen(data) && Object.isFrozen(data.scenario) && Object.isFrozen(data.scenario.telemetry[0]) && Object.isFrozen(data.scenario.truth.rule));
try { data.scenario.telemetry[0].account = 'changed'; } catch (_) { /* Strict-mode runtimes reject the write. */ }
try { data.scenario.truth.targetedAccounts.push('acct-99'); } catch (_) { /* Frozen arrays reject mutation in strict mode. */ }
assert.strictEqual(data.scenario.telemetry[0].account, 'acct-41');
assert.deepStrictEqual(local(data.scenario.truth.targetedAccounts), ['acct-41', 'acct-42', 'acct-43', 'acct-44', 'acct-45']);
console.log('M04 assessment data contract: all checks passed');

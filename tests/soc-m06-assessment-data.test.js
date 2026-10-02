#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m06-assessment-data.js', 'soc-m05-assessment-data.js', 'soc-m04-assessment-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const data = vm.runInContext('SocM06AssessmentData', context);
const scenario = data.scenario;
const m04 = vm.runInContext('SocM04AssessmentData.scenario', context);
const m05 = vm.runInContext('SocM05AssessmentData.scenario', context);

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(scenario.id, 'M06-ASSESS-2026-09-27');
assert.strictEqual(scenario.stateKey, 'm06-threat-hunt-assessment-v1'); // gitleaks:allow
assert.strictEqual(scenario.legacyStateId, 'm06-hypothesis-hunt-v1');
assert.strictEqual(scenario.fixedAt, '2026-09-27T09:30:00Z');
assert.strictEqual(scenario.start, '2026-09-27T09:00:00Z');
assert.strictEqual(scenario.end, '2026-09-27T09:30:00Z');
assert.ok(Date.parse(scenario.start) < Date.parse(scenario.end));
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.seedLead)), {
  id: 'M06-LEAD-001', type: 'scheduled_task_behavior', device: 'ws-318', account: 'acct-184',
  taskName: 'UpdateHealth',
  observation: 'A weekly scheduled task launches a script from a user-writable folder; no alert fired.',
  initialDisposition: 'unverified_lead',
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.scope.devices)), ['ws-318', 'ws-355', 'ws-402']);
assert.ok(Date.parse(scenario.scope.timeStart) < Date.parse(scenario.scope.timeEnd));
assert.ok(scenario.scope.timeEnd <= scenario.end);

const identities = [scenario.id, scenario.stateKey, scenario.legacyStateId]; // gitleaks:allow
const priorIdentities = [m04.id, m04.caseId, 'm04-detection-enrichment-v1', m05.id, m05.caseId, m05.stateKey, m05.legacyStateId]; // gitleaks:allow
assert.strictEqual(new Set(identities).size, identities.length, 'M06 assessment identifiers are distinct');
assert.ok(identities.every((id) => !priorIdentities.includes(id)), 'M06 assessment state and scenario are isolated from M04/M05');
assert.strictEqual(scenario.seedLead.device, 'ws-318', 'seed matches the existing Module 06 curriculum');
assert.strictEqual(scenario.seedLead.account, 'acct-184');
assert.strictEqual(scenario.seedLead.taskName, 'UpdateHealth');
assert.deepStrictEqual(JSON.parse(JSON.stringify(scenario.telemetrySchema.eventTypes)), [
  'scheduled_task', 'process_start', 'network_connection', 'identity_activity', 'file_indicator', 'sensor_health',
]);
assert.ok(scenario.telemetry.length >= 8, 'linked telemetry covers the lead and comparison host');
const eventIds = scenario.telemetry.map((event) => event.id);
assert.strictEqual(new Set(eventIds).size, eventIds.length, 'telemetry IDs are unique');
const telemetryById = new Map(scenario.telemetry.map((event) => [event.id, event]));
const devices = new Set(scenario.scope.devices);
const processesByDevice = new Map();
const canonicalUtc = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
for (const event of scenario.telemetry) {
  for (const field of scenario.telemetrySchema.required) {
    assert.ok(Object.prototype.hasOwnProperty.call(event, field), `${event.id} has schema field ${field}`);
    assert.ok(event[field] !== undefined, `${event.id}.${field} is defined`);
  }
  assert.ok(scenario.telemetrySchema.eventTypes.includes(event.eventType), `${event.id} has a typed event kind`);
  assert.ok(devices.has(event.device), `${event.id} is within the fixture device scope`);
  assert.ok(canonicalUtc.test(event.time) && !Number.isNaN(Date.parse(event.time)), `${event.id} timestamp is canonical UTC`);
  assert.ok(Date.parse(event.time) >= Date.parse(scenario.start), `${event.id} starts inside the fixed window`);
  assert.ok(Date.parse(event.time) <= Date.parse(scenario.end), `${event.id} ends inside the fixed window`);
  assert.ok(event.host && event.account && event.action && event.result && event.source, `${event.id} has complete common metadata`);
  assert.strictEqual(event.host.toLowerCase(), event.device, `${event.id} host matches device`);
  if (event.processId !== null) assert.ok(String(event.processId).length > 0, `${event.id} process ID is nonempty or null`);
  if (event.parentProcessId !== null) assert.ok(String(event.parentProcessId).length > 0, `${event.id} parent ID is nonempty or null`);
  if (event.eventType === 'network_connection') {
    assert.ok(event.destination && Number.isInteger(event.destinationPort) && event.destinationPort > 0, `${event.id} has network endpoint fields`);
    assert.ok(event.protocol, `${event.id} has protocol`);
  }
  if (event.eventType === 'file_indicator') {
    assert.ok(event.path && /^[a-f\d]{64}$/i.test(event.sha256) && event.signer, `${event.id} has file identity fields`);
  }
  if (event.eventType === 'identity_activity') {
    assert.ok(event.identity && event.identityType && event.authentication, `${event.id} has identity fields`);
  }
  for (const relatedId of event.relatedEventIds || []) {
    assert.ok(telemetryById.has(relatedId), `${event.id} references an existing event`);
    assert.strictEqual(telemetryById.get(relatedId).device, event.device, `${event.id} related event is device-scoped`);
  }
  if (event.eventType === 'process_start') {
    let processIds = processesByDevice.get(event.device);
    if (!processIds) processesByDevice.set(event.device, processIds = new Set());
    assert.ok(!processIds.has(event.processId), `${event.device} process IDs are unique`);
    processIds.add(event.processId);
  }
}
for (const event of scenario.telemetry) {
  if (!event.parentProcessId) continue;
  const parent = scenario.telemetry.find((candidate) => candidate.eventType === 'process_start'
    && candidate.device === event.device && candidate.processId === event.parentProcessId);
  assert.ok(parent, `${event.id} parent process exists on the same device`);
}
assert.strictEqual(eventIds.length, scenario.telemetry.length, 'all telemetry IDs are unique');
assert.ok(scenario.telemetry.some((event) => event.device === 'ws-318' && event.eventType === 'network_connection'));
assert.ok(scenario.telemetry.some((event) => event.device === 'ws-318' && event.eventType === 'identity_activity'));
assert.ok(scenario.telemetry.some((event) => event.device === 'ws-318' && event.eventType === 'file_indicator'));
assert.ok(scenario.telemetry.some((event) => event.device === 'ws-355' && event.taskName === 'UpdateHealth'
  && event.result === 'approved_maintenance'), 'comparison host shows the same task during approved maintenance');
assert.ok(scenario.telemetry.some((event) => event.device === 'ws-355' && event.signer === 'CN=Contoso IT, O=Contoso'));

const truth = scenario.expectedTruth;
assert.ok(truth.hypothesis.includes('does not establish'), 'hypothesis distinguishes observed suspicion from unproven claims');
assert.ok(truth.supportedTechniques.length > 0);
assert.ok(truth.unsupportedTechniques.length > 0);
const supportedIds = new Set();
for (const mapping of truth.supportedTechniques) {
  assert.ok(mapping.id && mapping.name && mapping.rationale);
  assert.ok(mapping.evidenceEventIds.length > 0, `${mapping.id} has direct evidence`);
  for (const id of mapping.evidenceEventIds) {
    assert.ok(telemetryById.has(id), `${mapping.id} evidence ${id} resolves`);
    supportedIds.add(id);
  }
}
for (const mapping of truth.unsupportedTechniques) {
  assert.ok(mapping.id && mapping.name && mapping.rationale);
  assert.ok(mapping.missingEvidence.length > 0, `${mapping.name} explains missing evidence`);
  assert.ok(Array.isArray(mapping.contradictoryEvidence));
  assert.ok(mapping.evidenceEventIds.length > 0, `${mapping.name} ties its assessment to observed events`);
  for (const id of mapping.evidenceEventIds) assert.ok(telemetryById.has(id), `${mapping.name} evidence ${id} resolves`);
  for (const detail of mapping.contradictoryEvidence) {
    const id = detail.match(/M06-EVT-\d{3}/)?.[0];
    assert.ok(id && telemetryById.has(id), `${mapping.name} contradiction cites a fixture event`);
  }
}
assert.ok(truth.supportedTechniques.some((mapping) => mapping.id === 'T1053.005'
  && mapping.evidenceEventIds.some((id) => telemetryById.get(id).eventType === 'scheduled_task' && telemetryById.get(id).device === 'ws-318')),
'supported scheduled-task mapping is grounded in the suspicious lead host');
assert.ok(truth.supportedTechniques.some((mapping) => mapping.id === 'T1059.001'
  && mapping.evidenceEventIds.some((id) => telemetryById.get(id).eventType === 'process_start'
    && /powershell\.exe$/i.test(telemetryById.get(id).image || '')
    && telemetryById.get(id).device === 'ws-318')),
'supported PowerShell mapping is grounded in the observed interpreter process');
for (const mapping of truth.unsupportedTechniques) {
  assert.ok(new Set(mapping.evidenceEventIds).size === mapping.evidenceEventIds.length, `${mapping.name} evidence IDs are unique`);
}
assert.ok(truth.supportedTechniques.some((mapping) => mapping.id === 'T1053.005'
  && mapping.evidenceEventIds.some((id) => telemetryById.get(id).eventType === 'scheduled_task')));
assert.ok(truth.supportedTechniques.some((mapping) => mapping.id === 'T1059.001'
  && mapping.evidenceEventIds.some((id) => telemetryById.get(id).image?.toLowerCase().endsWith('powershell.exe'))));
assert.ok(truth.unsupportedTechniques.some((mapping) => mapping.id === 'T1105' && mapping.missingEvidence.length));
assert.ok(truth.unsupportedTechniques.some((mapping) => mapping.id === 'T1071.001'
  && mapping.evidenceEventIds.every((id) => telemetryById.get(id).eventType !== 'network_connection'
    || telemetryById.get(id).protocol === 'tcp')));
assert.ok(!Object.keys(scenario).some((key) => /render|learner|view/i.test(key)), 'expected truth is not exposed as learner-rendered scenario content');

function assertDeepFrozen(value, label = 'fixture') {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value), `${label} is frozen`);
  for (const [key, child] of Object.entries(value)) assertDeepFrozen(child, `${label}.${key}`);
}
assertDeepFrozen(data);
try { scenario.seedLead.taskName = 'changed'; } catch (_) { /* frozen */ }
try { scenario.scope.devices.push('ws-other'); } catch (_) { /* frozen */ }
try { truth.supportedTechniques[0].evidenceEventIds.push('M06-EVT-999'); } catch (_) { /* frozen */ }
assert.strictEqual(scenario.seedLead.taskName, 'UpdateHealth');
assert.strictEqual(scenario.scope.devices.length, 3);
assert.ok(!truth.supportedTechniques[0].evidenceEventIds.includes('M06-EVT-999'));
assert.notStrictEqual(scenario.stateKey, scenario.legacyStateId, 'assessment persistence key is independent of legacy M06 state'); // gitleaks:allow
assert.deepStrictEqual(Object.keys(scenario).filter((key) => /legacy/i.test(key)), ['legacyStateId'], 'fixture carries only a legacy state identifier, not legacy learner state');
console.log('M06 assessment data contract: all checks passed');

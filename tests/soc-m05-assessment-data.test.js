#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m05-assessment-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-m04-assessment-data.js'), 'utf8'), context);
const data = vm.runInContext('SocM05AssessmentData', context);
const scenario = data.scenario;
const m04Scenario = vm.runInContext('SocM04AssessmentData.scenario', context);
const local = (value) => JSON.parse(JSON.stringify(value));

assert.strictEqual(data.schemaVersion, 1);
assert.strictEqual(scenario.id, 'M05-ASSESS-2026-09-27');
assert.strictEqual(scenario.caseId, 'CASE-055127');
assert.strictEqual(scenario.stateKey, 'm05-endpoint-assessment-v1');
const m05Identities = [scenario.id, scenario.caseId, scenario.stateKey, 'm05-endpoint-chain-v1', 'EDR-5119'];
const m04Identities = [m04Scenario.id, m04Scenario.caseId, 'm04-detection-enrichment-v1'];
assert.strictEqual(new Set(m05Identities).size, m05Identities.length, 'M05 assessment and legacy identifiers are unique');
assert.ok(m05Identities.every((id) => !m04Identities.includes(id)), 'M05 fixture, state, and case IDs are separate from M04 and legacy M05');
assert.strictEqual(scenario.start, '2026-09-27T09:00:00Z');
assert.strictEqual(scenario.end, '2026-09-27T09:30:00Z');
assert.strictEqual(scenario.generatedAt, '2026-09-27T09:31:00Z');
assert.ok(scenario.devices.length >= 1);
// Entity identity contract: device id = lower-case hostname; the inventory id moves to assetId.
assert.ok(scenario.devices.every((device) => device.assetId.startsWith('M05-DEV-')));
assert.ok(scenario.devices.every((device) => device.id === device.hostname && device.hostname === device.hostname.toLowerCase()));
assert.strictEqual(new Set(scenario.devices.map((device) => device.assetId)).size, scenario.devices.length);
assert.strictEqual(new Set(scenario.devices.map((device) => device.id)).size, scenario.devices.length);
assert.strictEqual(new Set(scenario.devices.map((device) => device.hostname)).size, scenario.devices.length);
assert.ok(scenario.devices.every((device) => ['id', 'assetId', 'hostname', 'platform', 'role', 'owner', 'zone', 'status'].every((key) => typeof device[key] === 'string')));
assert.ok(scenario.telemetry.length >= 10, 'fixture includes malicious activity and benign counterexamples');
const eventsById = new Map(scenario.telemetry.map((event) => [event.id, event]));
const devicesById = new Map(scenario.devices.map((device) => [device.id, device]));
assert.strictEqual(eventsById.size, scenario.telemetry.length, 'event IDs are unique');
assert.ok(scenario.telemetry.every((event) => event.id.startsWith('M05-EVT-')));
const processStartsByDeviceAndId = new Map(scenario.telemetry
  .filter((event) => event.eventType === 'process_start' && event.processId !== null)
  .map((event) => [`${event.deviceId}:${event.processId}`, event]));
for (const event of scenario.telemetry) {
  assert.ok(scenario.telemetrySchema.required.every((field) => Object.hasOwn(event, field)), `event ${event.id} follows required schema`);
  assert.ok(devicesById.has(event.deviceId), `event ${event.id} resolves to an inventoried device`);
  assert.strictEqual(event.host, devicesById.get(event.deviceId).hostname);
  assert.strictEqual(event.deviceId, event.host, `event ${event.id} DeviceId equals Host`);
  assert.strictEqual(event.assetId, devicesById.get(event.deviceId).assetId, `event ${event.id} keeps the inventory asset id`);
  assert.match(event.user, /^[a-z0-9][a-z0-9._-]*$/, `event ${event.id} user is a normalized principal`);
  assert.strictEqual(typeof event.accountNative, 'string', `event ${event.id} keeps the native principal`);
  assert.strictEqual(event.accountNative.replace(/^[^\\]+\\/, '').toLowerCase(), event.user);
  const time = Date.parse(event.time);
  assert.match(event.time, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.strictEqual(`${new Date(time).toISOString().slice(0, 19)}Z`, event.time, `event ${event.id} has a canonical UTC timestamp`);
  assert.ok(Number.isFinite(time) && time >= Date.parse(scenario.start) && time <= Date.parse(scenario.end), `event ${event.id} fits fixed clock`);
  if (event.parentProcessId !== null) {
    const parent = processStartsByDeviceAndId.get(`${event.deviceId}:${event.parentProcessId}`);
    assert.ok(parent, `event ${event.id} parent resolves to a process_start on the same device`);
  }
  if (event.sha256 !== null) assert.match(event.sha256, /^[a-f0-9]{64}$/);
  if (event.prevalence !== undefined) assert.ok(Number.isInteger(event.prevalence) && event.prevalence >= 0);
}
const truth = scenario.expectedTruth;
const truthIds = [
  ...truth.confirmedDevice.eventIds, ...truth.confirmedUser.eventIds,
  ...truth.processAncestry.eventIds, ...truth.maliciousFile.eventIds,
  ...truth.persistence.eventIds, ...truth.endpointControl.eventIds,
  ...truth.benignActivity.flatMap((item) => item.eventIds), ...truth.scope.eventIds,
];
assert.ok(truthIds.every((id) => eventsById.has(id)), 'every truth reference resolves to synthetic telemetry');
assert.deepStrictEqual(local(truth.processAncestry.chain), ['4100', '4172', '4224']);
assert.strictEqual(eventsById.get('M05-EVT-007').result, 'detected_not_prevented');
assert.strictEqual(eventsById.get('M05-EVT-005').reputation, 'malicious');
assert.strictEqual(eventsById.get('M05-EVT-005').signer, 'Unsigned');
assert.match(eventsById.get('M05-EVT-001').url, /\/verify\/captcha$/);
assert.strictEqual(eventsById.get('M05-EVT-001').action, 'fake_captcha_prompt_displayed');
assert.match(eventsById.get('M05-EVT-001').pageText, /press Win\+R, paste the verification command/i);
assert.strictEqual(eventsById.get('M05-EVT-009').reputation, 'benign');
assert.match(eventsById.get('M05-EVT-009').signer, /^CN=/);
assert.notStrictEqual(eventsById.get('M05-EVT-011').deviceId, eventsById.get('M05-EVT-009').deviceId);
assert.ok(scenario.telemetrySchema.required.every((field) => Object.hasOwn(scenario.telemetrySchema.fields, field)));
assert.deepStrictEqual(local(scenario.telemetrySchema.required), [
  'id', 'time', 'eventType', 'deviceId', 'host', 'user', 'processId', 'parentProcessId', 'image', 'commandLine', 'filePath', 'sha256', 'registryPath', 'action', 'result', 'source',
]);
function assertDeepFrozen(value, pathName = 'fixture') {
  if (!value || typeof value !== 'object') return;
  assert.ok(Object.isFrozen(value), `${pathName} is frozen`);
  for (const [key, child] of Object.entries(value)) assertDeepFrozen(child, `${pathName}.${key}`);
}
assertDeepFrozen(data);
try { scenario.devices[0].hostname = 'CHANGED'; } catch (_) { /* Frozen writes can throw in strict mode. */ }
try { scenario.devices.push({ id: 'M05-DEV-X' }); } catch (_) { /* Frozen arrays reject mutation. */ }
try { scenario.telemetrySchema.required.push('answer'); } catch (_) { /* Frozen arrays reject mutation. */ }
assert.strictEqual(scenario.devices[0].hostname, 'ws-assess-27');
assert.strictEqual(scenario.devices[0].assetId, 'M05-DEV-001');
assert.strictEqual(truth.confirmedDevice.value, 'ws-assess-27');
assert.strictEqual(truth.confirmedDevice.assetId, 'M05-DEV-001');
assert.strictEqual(truth.confirmedUser.value, 'j.alvarez');
assert.strictEqual(truth.confirmedUser.accountNative, 'CORP\\j.alvarez');
assert.strictEqual(scenario.devices.length, 5);
assert.strictEqual(scenario.telemetrySchema.required.length, 16);
console.log('M05 assessment data contract: all checks passed');

#!/usr/bin/env node
/* Sprint 3: M05-M06 endpoint and hunt telemetry depth (assessment + guided fixtures). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(portal('soc-telemetry-schema.js'), context);
vm.runInContext(portal('soc-m05-assessment-data.js'), context);
vm.runInContext(portal('soc-m06-assessment-data.js'), context);
const local = (v) => JSON.parse(JSON.stringify(v));
const Schema = vm.runInContext('SocTelemetrySchema', context);
const m05 = local(vm.runInContext('SocM05AssessmentData.scenario', context));
const m06 = local(vm.runInContext('SocM06AssessmentData.scenario', context));

function check(name, result) {
  assert.deepStrictEqual(local(result.errors), [], `${name} validation errors:\n${result.errors.join('\n')}`);
  assert.strictEqual(result.ok, true);
}
const refsOf = (truth, keys) => keys.flatMap((k) => (Array.isArray(truth[k]) ? truth[k] : [truth[k]]).filter(Boolean)
  .flatMap((item, i) => [item.eventIds && { name: `${k}[${i}]`, eventIds: item.eventIds }, item.coverageEventIds && { name: `${k}[${i}].coverage`, eventIds: item.coverageEventIds }].filter(Boolean)));

/* ---------- shared structural checks ---------- */
function structure(label, s, devKey, procKey) {
  const ids = s.telemetry.map((e) => e.id);
  assert.strictEqual(new Set(ids).size, ids.length, `${label} unique EventIds`);
  const procs = new Set(s.telemetry.filter((e) => e.eventType === 'process_start').map((e) => `${e[devKey]}:${e.processId}`));
  s.telemetry.forEach((e) => {
    if (e[procKey] != null) assert.ok(procs.has(`${e[devKey]}:${e[procKey]}`), `${label} ${e.id} ParentProcessId resolves`);
  });
  // Same filePath/path on a device never carries two different hashes.
  const seen = new Map();
  s.telemetry.forEach((e) => {
    const p = e.filePath || e.path; if (!p || !e.sha256) return;
    const key = `${e[devKey]}|${p}`;
    if (seen.has(key)) assert.strictEqual(seen.get(key), e.sha256, `${label} ${key} hash consistent`); else seen.set(key, e.sha256);
  });
  // Sensor-health coverage record exists for every device with endpoint telemetry.
  const devices = new Set(s.telemetry.map((e) => e[devKey]));
  devices.forEach((d) => assert.ok(s.telemetry.some((e) => e.eventType === 'sensor_health' && e[devKey] === d), `${label} ${d} has a sensor-health record`));
  assert.ok(s.telemetry.some((e) => e.eventType === 'sensor_health' && e.coverageStatus === 'Gap'), `${label} has a coverage gap record`);
  assert.ok(s.telemetry.length >= 35 && s.telemetry.length <= 70, `${label} within 35-70 events (${s.telemetry.length})`);
  const gapped = s.telemetry.find((e) => e.eventType === 'sensor_health' && e.coverageStatus === 'Gap');
  const resumed = s.telemetry.find((e) => e.eventType === 'sensor_health' && e[devKey] === gapped[devKey] && e.action === 'sensor_service_started');
  assert.ok(resumed && resumed.time > gapped.time, `${label} gap has a resume record`);
  // No non-health telemetry from the gapped device inside its gap.
  s.telemetry.filter((e) => e[devKey] === gapped[devKey] && e.eventType !== 'sensor_health')
    .forEach((e) => assert.ok(e.time < gapped.time || e.time > resumed.time, `${label} ${e.id} not inside sensor gap`));
}

/* ---------- Module 5 assessment ---------- */
{
  structure('M05', m05, 'deviceId', 'parentProcessId');
  const T = m05.expectedTruth;
  check('M05', Schema.validateScenario({
    events: m05.telemetry, start: m05.start, end: m05.end,
    references: [
      ...['confirmedDevice', 'confirmedUser', 'processAncestry', 'maliciousFile', 'persistence', 'endpointControl', 'scope'].map((k) => ({ name: k, eventIds: T[k].eventIds })),
      ...refsOf(T, ['benignActivity', 'benignBackground', 'coverageGaps', 'negativeEvidence']),
    ],
    entities: { DeviceId: m05.devices.map((d) => d.id), Host: m05.devices.map((d) => d.hostname) },
  }, { label: 'M05', recommended: ['EventSource', 'Account', 'Result'] }));
  const tables = new Set(m05.telemetry.map((e) => e.eventType));
  ['network_connection', 'scheduled_task', 'sensor_health'].forEach((t) => assert.ok(tables.has(t), `M05 has ${t}`));
  assert.ok(m05.devices.length >= 5);
  // Bounded negative evidence: nothing named syncsvc.exe connects out on the affected device; heartbeats bound the window.
  const neg = T.negativeEvidence;
  assert.strictEqual(m05.telemetry.filter((e) => e.eventType === 'network_connection' && e.deviceId === neg.deviceId
    && /syncsvc/i.test(`${e.image} ${e.commandLine}`)).length, 0, 'M05 negative-evidence query returns no match');
  const beats = neg.coverageEventIds.map((id) => m05.telemetry.find((e) => e.id === id));
  assert.ok(beats.every((b) => b && b.coverageStatus === 'Full' && b.deviceId === neg.deviceId));
  assert.ok(beats[0].time <= '2026-09-27T09:01:00Z' && beats[beats.length - 1].time >= '2026-09-27T09:29:00Z');
  // Answer-bearing evidence unchanged.
  assert.strictEqual(T.maliciousFile.sha256, 'a'.repeat(64));
  assert.ok(m05.telemetry.filter((e) => e.sha256 === 'a'.repeat(64)).every((e) => e.deviceId === 'M05-DEV-001'), 'malicious hash only on the affected device');
  // Decoys carry discriminating facts: signer, prevalence, approved-software/deployment parent.
  const fab = m05.telemetry.find((e) => e.id === 'M05-EVT-041');
  assert.ok(fab.reputation === 'benign' && fab.prevalence > 1000 && /^CN=/.test(fab.signer));
  assert.ok(m05.telemetry.find((e) => e.id === 'M05-EVT-034').signer.startsWith('CN='));
}

/* ---------- Module 5 guided (derived from the assessment fixture in module-05) ---------- */
{
  const src = portal('soc-analyst-module-05.js');
  const a = src.indexOf('const MODULE_FIVE_GUIDED_REPLACEMENTS');
  const b = src.indexOf('const MODULE_FIVE_GUIDED_CONSOLE_DATA');
  assert.ok(a > 0 && b > a);
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(portal('soc-m05-assessment-data.js'), ctx);
  vm.runInContext(`const MODULE_FIVE_GUIDED_LAB_ID = 'm05-guided-endpoint-chain-v1'; const moduleFiveGuidedClone = (v) => JSON.parse(JSON.stringify(v));\n${src.slice(a, b)}\nglobalThis.G = MODULE_FIVE_GUIDED_FIXTURE.scenario;`, ctx);
  const g = local(ctx.G);
  structure('M05 guided', g, 'deviceId', 'parentProcessId');
  const T = g.expectedTruth;
  check('M05 guided', Schema.validateScenario({
    events: g.telemetry, start: g.start, end: g.end,
    references: [...['confirmedDevice', 'confirmedUser', 'processAncestry', 'maliciousFile', 'persistence', 'endpointControl', 'scope'].map((k) => ({ name: k, eventIds: T[k].eventIds })),
      ...refsOf(T, ['benignActivity', 'benignBackground', 'coverageGaps', 'negativeEvidence'])],
    entities: { DeviceId: g.devices.map((d) => d.id), Host: g.devices.map((d) => d.hostname) },
  }, { label: 'M05 guided' }));
  // Independence from the assessment: no shared EventIds, hosts, devices, or file hashes (other than none).
  const aIds = new Set(m05.telemetry.map((e) => e.id));
  assert.ok(g.telemetry.every((e) => !aIds.has(e.id)), 'guided/assessment EventIds disjoint');
  const aHosts = new Set(m05.telemetry.map((e) => e.host));
  assert.ok(g.telemetry.every((e) => !aHosts.has(e.host)), 'guided/assessment hosts disjoint');
  const aHashes = new Set(m05.telemetry.map((e) => e.sha256).filter(Boolean));
  assert.ok(g.telemetry.every((e) => !e.sha256 || !aHashes.has(e.sha256)), 'guided/assessment hashes disjoint');
}

/* ---------- Module 6 assessment ---------- */
{
  structure('M06', m06, 'device', 'parentProcessId');
  const T = m06.expectedTruth;
  const accounts = [...new Set(m06.telemetry.map((e) => e.account))];
  check('M06', Schema.validateScenario({
    events: m06.telemetry, start: m06.start, end: m06.end,
    references: [...[...T.supportedTechniques, ...T.unsupportedTechniques].map((t) => ({ name: t.id, eventIds: t.evidenceEventIds })),
      ...refsOf(T, ['benignBackground', 'coverageGaps', 'negativeEvidence'])],
    entities: { DeviceId: m06.scope.devices, Account: accounts },
  }, { label: 'M06' }));
  assert.ok(m06.telemetry.every((e) => m06.scope.devices.includes(e.device)));
  // Lead remains alert-free: no alert text is stored in the fixture and original evidence is intact.
  assert.strictEqual(m06.telemetry.filter((e) => e.processId === '3188').length, 4);
  // Bounded negative evidence: UpdateHealth never runs on ws-402; coverage record bounds the claim.
  const neg = T.negativeEvidence;
  assert.strictEqual(m06.telemetry.filter((e) => e.device === neg.device && e.taskName === neg.taskName).length, 0, 'M06 negative query returns no match');
  assert.ok(m06.telemetry.some((e) => e.device === neg.device && e.eventType === 'scheduled_task'), 'ws-402 has other task activity, so the empty result is meaningful');
  assert.ok(neg.coverageEventIds.every((id) => m06.telemetry.some((e) => e.id === id && e.device === neg.device && e.eventType === 'sensor_health')));
  // Existing related-event pivots among original rows unchanged.
  assert.deepStrictEqual(local(m06.telemetry.find((e) => e.id === 'M06-EVT-003').relatedEventIds), ['M06-EVT-004', 'M06-EVT-005', 'M06-EVT-006']);
  // UpdateHealth task executions remain exactly the lead and the approved comparison.
  assert.deepStrictEqual(m06.telemetry.filter((e) => e.taskName === 'UpdateHealth').map((e) => e.id), ['M06-EVT-001', 'M06-EVT-007']);
}

/* ---------- Module 6 guided ---------- */
{
  const src = portal('soc-analyst-module-06.js');
  const a = src.indexOf("const MODULE_SIX_GUIDED_LAB_ID");
  const b = src.indexOf('const MODULE_SIX_GUIDED_DEVICES');
  assert.ok(a > 0 && b > a);
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(`${src.slice(a, b)}\nglobalThis.G = MODULE_SIX_GUIDED_FIXTURE.scenario;`, ctx);
  const g = local(ctx.G);
  structure('M06 guided', g, 'device', 'parentProcessId');
  const T = g.expectedTruth;
  check('M06 guided', Schema.validateScenario({
    events: g.telemetry, start: g.start, end: g.end,
    references: [...[...T.supportedTechniques, ...T.unsupportedTechniques].map((t) => ({ name: t.id, eventIds: t.evidenceEventIds })),
      ...refsOf(T, ['benignBackground', 'coverageGaps', 'negativeEvidence'])],
    entities: { DeviceId: g.scope.devices, Account: [...new Set(g.telemetry.map((e) => e.account))] },
  }, { label: 'M06 guided' }));
  const neg = T.negativeEvidence;
  assert.strictEqual(g.telemetry.filter((e) => e.device === neg.device && (/benefits_form/.test(`${e.commandLine} ${e.path}`) || e.destination === '192.0.2.145')).length, 0);
  const aIds = new Set(m06.telemetry.map((e) => e.id));
  assert.ok(g.telemetry.every((e) => !aIds.has(e.id)));
  const aAccounts = new Set(m06.telemetry.map((e) => e.account));
  assert.ok(g.telemetry.every((e) => !aAccounts.has(e.account)), 'guided/assessment accounts disjoint');
}

console.log('soc-telemetry-sprint3 tests passed');

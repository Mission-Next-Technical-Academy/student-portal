#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
for (const file of ['soc-timeline-ui.js', 'soc-m05-assessment-data.js', 'soc-m05-assessment-device-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const ui = vm.runInContext('SocM05AssessmentDeviceUi', context);
const fixture = vm.runInContext('SocM05AssessmentData.scenario', context);
const realInventory = ui.render(fixture);
for (const device of fixture.devices) assert.match(realInventory, new RegExp(`data-m05-device-select="${device.id}"`));
assert.strictEqual((realInventory.match(/data-m05-device-select=/g) || []).length, 5);
const assessedDevice = ui.render(fixture, 'ws-assess-27');
assert.match(assessedDevice, /File and reputation evidence/);
assert.match(assessedDevice, /syncsvc\.exe/);
assert.match(assessedDevice, /Unsigned/);
assert.match(assessedDevice, /malicious/);
assert.match(assessedDevice, /Prevalence<\/dt><dd>1/);
assert.match(assessedDevice, /data-linked-process="4224"/);
assert.match(assessedDevice, /data-linked-endpoint-event="M05-EVT-007"/);
assert.match(assessedDevice, /CN=Acme Software LLC/);
assert.doesNotMatch(assessedDevice, /data-linked-process="6110"|M05-EVT-011/);
assert.match(ui.render(fixture, 'ws-assess-14'), /Acme Software LLC/);
assert.doesNotMatch(ui.render(fixture, 'ws-assess-14'), /syncsvc\.exe|M05-EVT-007/);
const scenario = {
  start: '2026-09-27T09:00:00Z', end: '2026-09-27T09:30:00Z',
  devices: [
    { id: 'dev-a', hostname: 'WS-A', platform: 'Windows', role: 'Workstation', owner: 'alice', zone: 'USER', status: 'Online' },
    { id: 'dev-b', hostname: 'WS-B', platform: 'Windows', role: 'Workstation', owner: 'bob', zone: 'USER', status: 'Online' },
  ],
  telemetry: [
    { id: 'evt-late', time: '2026-09-27T09:10:00Z', deviceId: 'dev-a', eventType: 'file_create', user: 'alice', result: 'created' },
    { id: 'evt-other', time: '2026-09-27T09:04:00Z', deviceId: 'dev-b', eventType: 'process_start', user: 'bob', result: 'success' },
    { id: 'evt-early', time: '2026-09-27T09:02:00Z', deviceId: 'dev-a', eventType: 'process_start', user: 'alice', result: 'success' },
    { id: 'evt-outside', time: '2026-09-27T09:31:00Z', deviceId: 'dev-a', eventType: 'sensor_control', user: 'alice', result: 'outside' },
  ],
};

const inventory = ui.render(scenario);
assert.match(inventory, /data-m05-device-select="dev-a"/);
assert.match(inventory, /data-m05-device-select="dev-b"/);
assert.match(inventory, /Select a device to inspect/);
assert.doesNotMatch(inventory, /evt-early/);

const rendered = ui.render(scenario, 'dev-a');
assert.match(rendered, /aria-pressed="true"/);
assert.match(rendered, /alice/);
assert.ok(rendered.indexOf('evt-early') < rendered.indexOf('evt-late'));
assert.doesNotMatch(rendered, /evt-other|evt-outside/);
assert.match(rendered, /process_start/);
assert.match(rendered, /success/);
assert.match(rendered, /data-m05-device-select="dev-a"/);
assert.match(rendered, /Process tree/);
assert.deepStrictEqual(Array.from(ui.processTree(scenario, 'unknown')), []);
assert.deepStrictEqual(Array.from(ui.processTree(scenario, '')), []);
assert.match(ui.render(scenario, 'unknown'), /Select a device to inspect/);
assert.deepStrictEqual(Array.from(ui.timelineEvents(scenario, 'unknown')), []);
assert.match(ui.render(scenario, 'unknown'), /Select a device to inspect/);
assert.match(ui.render({ ...scenario, devices: [], telemetry: [] }), /No devices are available/);
assert.deepStrictEqual(Array.from(ui.timelineEvents({ ...scenario, telemetry: [] }, 'dev-a')), []);
assert.match(ui.render({ ...scenario, telemetry: [] }, 'dev-a'), /No telemetry in the fixed scenario window/);

const hostile = {
  ...scenario,
  devices: [{ ...scenario.devices[0], id: '"<dev&>', hostname: '<img src=x onerror=alert(1)>', owner: 'A&B' }],
  telemetry: [{ ...scenario.telemetry[0], id: '"<event&>', deviceId: '"<dev&>', eventType: '<script>', user: 'x" onmouseover="1', result: '<bad>' }],
};
const escaped = ui.render(hostile, hostile.devices[0].id);
assert.match(escaped, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.match(escaped, /A&amp;B/);
assert.match(escaped, /&quot;&lt;dev&amp;&gt;/);
assert.match(escaped, /&lt;script&gt;/);
assert.match(escaped, /x&quot; onmouseover=&quot;1/);
assert.match(escaped, /&lt;bad&gt;/);
assert.doesNotMatch(escaped, /<img|<script|onmouseover="1/);

const processScenario = {
  ...scenario,
  telemetry: [
    { id: 'root', deviceId: 'dev-a', eventType: 'process_start', processId: '1', parentProcessId: null, image: 'C:\\root.exe', commandLine: 'root --ok', user: 'system' },
    { id: 'child', deviceId: 'dev-a', eventType: 'process_start', processId: '2', parentProcessId: '1', image: 'C:\\child.exe', commandLine: 'child /quiet', user: 'alice' },
    { id: 'orphan', deviceId: 'dev-a', eventType: 'process_start', processId: '3', parentProcessId: 'missing', image: 'C:\\orphan.exe', commandLine: 'orphan', user: 'bob' },
    { id: 'cycle-a', deviceId: 'dev-a', eventType: 'process_start', processId: '4', parentProcessId: '5', image: 'cycle-a.exe', commandLine: 'cycle a', user: 'alice' },
    { id: 'cycle-b', deviceId: 'dev-a', eventType: 'process_start', processId: '5', parentProcessId: '4', image: 'cycle-b.exe', commandLine: 'cycle b', user: 'alice' },
    { id: 'other', deviceId: 'dev-b', eventType: 'process_start', processId: '6', parentProcessId: null, image: 'other.exe', commandLine: 'other', user: 'bob' },
  ],
};
const processTree = ui.processTree(processScenario, 'dev-a');
assert.strictEqual(processTree.length, 3);
assert.strictEqual(processTree.find((node) => node.id === '1').children[0].id, '2');
const processHtml = ui.render(processScenario, 'dev-a');
assert.match(processHtml, /child \/quiet/);
assert.match(processHtml, /C:\\child\.exe/);
assert.match(processHtml, /Parent process missing is unavailable or cyclic/);
assert.match(processHtml, /Parent process 4 is unavailable or cyclic|Parent process 5 is unavailable or cyclic/);
assert.doesNotMatch(processHtml, /other\.exe/);
assert.deepStrictEqual(Array.from(ui.processTree({ ...processScenario, devices: [] }, 'dev-a')), []);
const hostileProcess = {
  ...processScenario,
  telemetry: [{ id: 'hostile-proc', deviceId: 'dev-a', eventType: 'process_start', processId: '<1>', parentProcessId: null, image: '<img src=x>', commandLine: 'x&y"', user: '<script>' }],
};
const hostileProcessHtml = ui.render(hostileProcess, 'dev-a');
assert.match(hostileProcessHtml, /&lt;img src=x&gt;/);
assert.match(hostileProcessHtml, /x&amp;y&quot;/);
assert.match(hostileProcessHtml, /&lt;script&gt;/);
assert.doesNotMatch(hostileProcessHtml, /<img|<script/);
assert.match(ui.render({ ...scenario, telemetry: [] }, 'dev-a'), /No process start events are available/);
assert.match(ui.render({ ...scenario, telemetry: [] }, 'dev-a'), /No file evidence is available for this device/);
const fileScenario = {
  ...scenario,
  telemetry: [
    { id: 'proc-file', deviceId: 'dev-a', eventType: 'process_start', processId: '10', image: '<bin&.exe>', filePath: '<bin&.exe>', sha256: 'deadbeef', commandLine: 'run "quoted"' },
    { id: 'hash-file', deviceId: 'dev-a', eventType: 'file_hash', processId: '10', filePath: '<bin&.exe>', sha256: 'deadbeef', result: 'suspicious', reputation: 'suspicious', signer: '<script>alert(1)</script>', prevalence: 0 },
    { id: 'control-file', deviceId: 'dev-a', eventType: 'sensor_control', processId: '10', filePath: '<bin&.exe>', sha256: 'deadbeef', action: 'execution_control', result: 'detected' },
    { id: 'other-file', deviceId: 'dev-b', eventType: 'file_hash', processId: '20', filePath: 'other.exe', sha256: 'bad', reputation: 'malicious' },
    { id: 'no-metadata', deviceId: 'dev-a', eventType: 'file_create', processId: '30', filePath: 'unknown.bin' },
  ],
};
const fileHtml = ui.render(fileScenario, 'dev-a');
assert.match(fileHtml, /deadbeef/);
assert.match(fileHtml, /suspicious/);
assert.match(fileHtml, /Signer<\/dt><dd>Not recorded/);
assert.match(fileHtml, /Prevalence<\/dt><dd>0/);
assert.match(fileHtml, /unknown\.bin/);
assert.match(fileHtml, /SHA-256<\/dt><dd>Not recorded/);
assert.match(fileHtml, /No linked endpoint-control event is available/);
assert.match(fileHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(fileHtml, /&lt;bin&amp;.exe&gt;/);
assert.match(fileHtml, /run &quot;quoted&quot;/);
assert.doesNotMatch(fileHtml, /<script>|other\.exe|<bin&\.exe>/);
assert.strictEqual(ui.fileRecords(fileScenario, 'unknown').length, 0);

const responseScenario = {
  ...scenario,
  telemetry: [
    { id: 'persist-proc', time: '2026-09-27T09:05:00Z', deviceId: 'dev-a', eventType: 'process_start', processId: '42', image: 'C:\\Temp\\agent.exe', filePath: 'C:\\Temp\\agent.exe', sha256: 'hash42' },
    { id: 'persist-file', time: '2026-09-27T09:05:01Z', deviceId: 'dev-a', eventType: 'file_hash', processId: '42', filePath: 'C:\\Temp\\agent.exe', sha256: 'hash42' },
    { id: 'persist-reg', time: '2026-09-27T09:05:02Z', deviceId: 'dev-a', eventType: 'persistence_change', processId: '42', sha256: 'hash42', registryPath: 'HKCU\\Software\\Run\\Agent', action: 'registry_value_set', result: 'created' },
    { id: 'control-detected', time: '2026-09-27T09:05:03Z', deviceId: 'dev-a', eventType: 'sensor_control', processId: '42', filePath: 'C:\\Temp\\agent.exe', sha256: 'hash42', action: 'execution_control', result: 'detected_not_prevented' },
    { id: 'other-control', time: '2026-09-27T09:05:04Z', deviceId: 'dev-b', eventType: 'sensor_control', action: 'cleanup', result: 'removed' },
  ],
};
const responseHtml = ui.render(responseScenario, 'dev-a');
assert.match(responseHtml, /Persistence changes/);
assert.match(responseHtml, /HKCU\\Software\\Run\\Agent/);
assert.match(responseHtml, /data-linked-process="42"/);
assert.match(responseHtml, /data-linked-file-event="persist-proc"|data-linked-file-event="persist-file"/);
assert.match(responseHtml, /Detected, not prevented/);
assert.match(responseHtml, /detected_not_prevented/);
assert.doesNotMatch(responseHtml, /other-control|removed/);
assert.strictEqual(ui.persistenceRecords(responseScenario, 'dev-a').length, 1);
assert.strictEqual(ui.endpointControlEvents(responseScenario, 'dev-a').length, 1);
assert.strictEqual(ui.persistenceRecords(responseScenario, 'unknown').length, 0);
const noOutcomeHtml = ui.render({ ...responseScenario, telemetry: responseScenario.telemetry.filter((event) => event.eventType !== 'sensor_control' && event.eventType !== 'persistence_change') }, 'dev-a');
assert.match(noOutcomeHtml, /No persistence changes are recorded for this device/);
assert.match(noOutcomeHtml, /No endpoint prevention, detection, or cleanup outcome is recorded/);
const hostileResponse = {
  ...responseScenario,
  telemetry: [
    { id: '<persist&>', time: '2026-09-27T09:05:00Z', deviceId: 'dev-a', eventType: 'persistence_change', processId: '<42>', registryPath: '<HKCU&>', action: '<set>', result: '<created>' },
    { id: '<control&>', time: '2026-09-27T09:05:01Z', deviceId: 'dev-a', eventType: 'sensor_control', action: '<detect>', result: '<detected_not_prevented>', filePath: '<path&>' },
  ],
};
const hostileResponseHtml = ui.render(hostileResponse, 'dev-a');
assert.match(hostileResponseHtml, /&lt;HKCU&amp;&gt;/);
assert.match(hostileResponseHtml, /&lt;created&gt;/);
assert.match(hostileResponseHtml, /&lt;path&amp;&gt;/);
assert.doesNotMatch(hostileResponseHtml, /<HKCU|<created>|<path&/);
const hostileHandoffHtml = ui.render(scenario, 'dev-a', null, [], [{
  id: '<handoff&>', deviceIds: ['dev-a'], eventIds: ['evt-a'], hashes: [],
  summary: '<script>summary</script>', owner: '<owner>', recipient: '<team>',
  recommendation: '<img src=x>', status: 'submitted',
}]);
assert.match(hostileHandoffHtml, /&lt;script&gt;summary&lt;\/script&gt;/);
assert.match(hostileHandoffHtml, /&lt;img src=x&gt;/);
assert.match(hostileHandoffHtml, /&lt;owner&gt;/);
assert.doesNotMatch(hostileHandoffHtml, /<script>|<img src=x>|<owner>/);
console.log('M05 device UI tests passed');

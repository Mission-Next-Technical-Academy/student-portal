#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
for (const file of ['soc-m07-assessment-data.js', 'soc-m07-assessment-state.js',
  'soc-m07-assessment-actions.js', 'soc-m07-assessment-network-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM07AssessmentData', context);
const stateApi = vm.runInContext('SocM07AssessmentState', context);
const actions = vm.runInContext('SocM07AssessmentActions', context);
const ui = vm.runInContext('SocM07AssessmentNetworkUi', context);
const at = fixture.scenario.fixedAt.replace('Z', '.000Z');
let state = stateApi.normalize({}, fixture);

assert.strictEqual(ui.search(fixture).length, 8);
assert.deepStrictEqual(Array.from(ui.search(fixture, { type: 'dns_query' }), (event) => event.id), ['M07-DNS-001', 'M07-DNS-002']);
assert.deepStrictEqual(Array.from(ui.search(fixture, { device: 'ws-517' }), (event) => event.id),
  ['M07-DNS-001', 'M07-TLS-001', 'M07-FW-001', 'M07-PROXY-001']);
assert.deepStrictEqual(Array.from(ui.search(fixture, { query: 'invoice-qr.example' }), (event) => event.id),
  ['M07-DNS-001', 'M07-TLS-001', 'M07-PROXY-001']);
assert.strictEqual(ui.search(fixture, { query: 'outside-fixture-value' }).length, 0);

let html = ui.render(fixture, state, { query: '', type: 'all', device: '' });
assert.match(html, /aria-label="Network workspace"/);
assert.match(html, /aria-label="Selected evidence" data-m07-evidence-tray/);
assert.match(html, /M07-DNS-001/);
assert.match(html, /203\.0\.113\.88/);
assert.match(html, /invoice-qr\.example/);
assert.match(html, /data-m07-network-pivot-from="M07-DNS-001" data-m07-network-pivot-to="M07-TLS-001"/);
assert.match(html, /data-m07-process-correlation="M07-PROC-001"/);
assert.match(html, /data-m07-evidence-toggle="M07-PROC-001" aria-pressed="false">Add to evidence/);
assert.match(html, /data-m07-evidence-toggle="M07-DNS-001" aria-pressed="false">Add to evidence/);
assert.match(html, /Parent process<\/dt><dd>explorer\.exe/);
assert.match(html, /does not establish payload execution or credential compromise/);
assert.match(html, /aria-label="Fixture packet sample"/);
assert.match(html, /data-m07-packet-select/);
assert.doesNotMatch(html, /<pre>[\s\S]*?<\/pre>/, 'packet content remains absent until a fixture event is selected');
const sample = ui.packetSample(fixture, 'M07-TLS-001');
assert.strictEqual(sample.protocol, 'TLS');
assert.match(ui.render(fixture, state, { pcapEventId: 'M07-TLS-001' }), /16 03 01 00 2f/);
assert.strictEqual(ui.packetSample(fixture, 'M07-FOREIGN-001'), null, 'foreign IDs cannot select packet bytes');
assert.strictEqual(ui.packetSample(fixture, 'https://example.invalid/sample'), null, 'URLs are never packet selectors');
assert.match(html, /data-m07-process-correlation="M07-PROC-002"/);
assert.doesNotMatch(html, /expectedTruth|incidentChain|pcap/i);
assert.doesNotMatch(ui.render(fixture, state, { device: 'ws-517' }), /M07-PROC-002/,
  'process detail follows filtered proxy sessions');
assert.deepStrictEqual(Array.from(ui.correlatedProcesses(fixture, fixture.scenario.networkEvents[3]), (item) => item.id),
  ['M07-PROC-001']);
const mismatchProxy = { ...fixture.scenario.networkEvents[3], deviceId: 'ws-204' };
assert.strictEqual(ui.correlatedProcesses(fixture, mismatchProxy).length, 0, 'device mismatch cannot correlate');
const unlinkedProxy = { ...fixture.scenario.networkEvents[3], id: 'M07-PROXY-UNLINKED' };
assert.strictEqual(ui.correlatedProcesses(fixture, unlinkedProxy).length, 0, 'same-device proximity cannot correlate');
for (const changes of [
  { recipientId: 'acct-82' },
  { timestamp: '2026-09-27T10:08:08Z' },
  { timestamp: '2026-09-27T10:08:40Z' },
]) {
  const candidate = { scenario: { ...fixture.scenario,
    endpointProcessEvents: [{ ...fixture.scenario.endpointProcessEvents[0], ...changes }] } };
  assert.strictEqual(ui.correlatedProcesses(candidate, candidate.scenario.networkEvents[3]).length, 0,
    'invalid entity/time relationships are excluded');
}

const hostile = { scenario: { ...fixture.scenario, networkEvents: [{
  ...fixture.scenario.networkEvents[0], id: '<img src=x onerror=alert(1)>',
  domain: '<script>alert(1)</script>&example.test', answers: ['<svg onload=alert(1)>'],
}] } };
const hostileHtml = ui.render(hostile, {});
assert.match(hostileHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;example\.test/);
assert.match(hostileHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(hostileHtml, /<script>|<img src=x|<svg onload=/);
const hostileProcess = { scenario: { ...fixture.scenario, endpointProcessEvents: [{
  ...fixture.scenario.endpointProcessEvents[0], processName: '<img src=x onerror=alert(1)>',
  parentProcessName: '<script>alert(2)</script>', commandLine: 'chrome.exe <svg onload=alert(3)>',
}] } };
const hostileProcessHtml = ui.render(hostileProcess, {});
assert.match(hostileProcessHtml, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.match(hostileProcessHtml, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
assert.match(hostileProcessHtml, /&lt;svg onload=alert\(3\)&gt;/);
assert.doesNotMatch(hostileProcessHtml, /<img src=x|<script>|<svg onload=/);
const hostileSampleFixture = { scenario: { ...fixture.scenario, packetSamples: [{
  ...fixture.scenario.packetSamples[0], sampleText: '<img src=x onerror=alert(4)>', summary: '<script>alert(5)</script>',
}] } };
const hostileSampleHtml = ui.render(hostileSampleFixture, {}, { pcapEventId: 'M07-DNS-001' });
assert.match(hostileSampleHtml, /&lt;script&gt;alert\(5\)&lt;\/script&gt;/);
assert.match(hostileSampleHtml, /&lt;img src=x onerror=alert\(4\)&gt;/);
assert.doesNotMatch(hostileSampleHtml, /<script>|<img src=x/);
for (const filename of ['soc-m07-assessment-network-ui.js', 'soc-analyst-module-07.js']) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'portal', filename), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|\bXMLHttpRequest\b|\bopen\s*\(|\bFileReader\b|\bFormData\b|type\s*=\s*["']file["']/i,
    `${filename} has no network, arbitrary open, upload, or filesystem access`);
}

state = actions.append(state, 'network_review', at, { eventId: 'M07-DNS-001', reviewed: true }, fixture);
state = actions.append(state, 'evidence_change', at, { operation: 'add', eventId: 'M07-PROC-001', reason: 'Linked process evidence' }, fixture);
assert.match(ui.render(fixture, state), /data-m07-review-network="M07-DNS-001" aria-pressed="true">Mark unreviewed/);
const pivot = ui.pivotDetails(fixture, 'M07-DNS-001', 'M07-TLS-001');
assert.deepStrictEqual(JSON.parse(JSON.stringify(pivot)), {
  fromEventId: 'M07-DNS-001', toEventId: 'M07-TLS-001', field: 'relatedEvent', value: 'M07-TLS-001',
});
state = actions.append(state, 'pivot', at, pivot, fixture);
const restored = stateApi.normalize(JSON.parse(JSON.stringify(state)), fixture);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.reviewedNetworkEventIds)), ['M07-DNS-001']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(restored.pivots)), [JSON.parse(JSON.stringify(pivot))]);
assert.match(ui.render(fixture, restored), /M07-DNS-001<\/code> → <code>M07-TLS-001/);
assert.match(ui.render(fixture, restored), /process · chrome\.exe · ws-517 <code>M07-PROC-001/);
assert.strictEqual(ui.pivotDetails(fixture, 'M07-DNS-001', 'M07-PROC-001'), null,
  'network pivots do not include endpoint process records');
assert.match(ui.render({}, {}), /Network telemetry is unavailable/);

console.log('M07 assessment network UI: all checks passed');

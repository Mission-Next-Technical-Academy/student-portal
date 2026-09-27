#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const context = { URL, FormData };
vm.createContext(context);
for (const file of ['soc-m04-assessment-data.js', 'soc-m04-assessment-actions.js', 'soc-m04-intelligence-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const api = vm.runInContext('SocM04IntelligenceUi', context);
const fixture = vm.runInContext('SocM04AssessmentData', context);
const local = (value) => JSON.parse(JSON.stringify(value));
const assessment = {};
api.seed(assessment, fixture);
assert.deepStrictEqual(local(assessment.reports), local(fixture.scenario.reports));
assert.deepStrictEqual(local(assessment.iocs), local(fixture.scenario.iocs));
assert.strictEqual(Object.isFrozen(fixture.scenario.reports[0]), true);

const html = api.render(assessment, fixture);
for (const field of ['Source reliability', 'Confidence', 'Freshness', 'Status', 'Campaign']) assert.ok(html.includes(field));
assert.match(html, /Report-provided ATT&amp;CK context \(unverified\)/);
assert.match(html, /not confirmed findings/);
assert.match(html, /First seen/);
assert.match(html, /Last seen/);
assert.match(html, /Campaign/);
assert.match(html, /value="retired"/);
assert.match(html, /value="contextual"/);
assert.match(html, /value="ip"/);
assert.match(html, /value="domain"/);
assert.match(html, /value="url"/);
assert.match(html, /value="email"/);
assert.match(html, /value="file-hash"/);

const timestamp = '2026-09-26T12:00:00.000Z';
for (const [type, value] of [
  ['ip', '2001:db8::1'], ['domain', 'sensor.example.org'], ['url', 'https://sensor.example.org/path'],
  ['email', 'analyst@example.org'], ['file-hash', 'a'.repeat(64)],
]) {
  assert.strictEqual(api.validValue(type, value), true, `${type} should validate`);
  const added = api.mutate(assessment, fixture, 'ioc-create', { type, value, confidence: 70, sourceReportId: 'M04-R-002', context: 'Test indicator' }, timestamp);
  assert.strictEqual(added.type, type);
  assert.strictEqual(assessment.actionHistory.at(-1).type, 'ioc_edit');
  assert.strictEqual(assessment.actionHistory.at(-1).timestamp, timestamp);
  assert.strictEqual(assessment.actionHistory.at(-1).details.operation, 'create');
}
assert.strictEqual(api.validValue('ip', '999.1.1.1'), false);
assert.strictEqual(api.validValue('ip', ':::'), false);
assert.strictEqual(api.validValue('domain', '-bad.example'), false);
assert.strictEqual(api.validValue('url', 'javascript:alert(1)'), false);
assert.strictEqual(api.validValue('email', 'bad@'), false);
assert.strictEqual(api.validValue('file-hash', 'not-a-hash'), false);
assert.throws(() => api.mutate(assessment, fixture, 'ioc-create', { type: 'email', value: 'bad@', confidence: 20 }, timestamp), /valid value/);
assert.throws(() => api.mutate(assessment, fixture, 'ioc-create', { type: 'ip', value: '192.0.2.1', confidence: 101 }, timestamp), /Confidence/);
assert.throws(() => api.mutate(assessment, fixture, 'ioc-create', { type: 'domain', value: 'valid.example', confidence: 50, sourceReportId: 'missing' }, timestamp), /Source report/);

const report = assessment.reports.find((item) => item.id === 'M04-R-002');
const metadata = { sourceReliability: report.sourceReliability, confidence: report.confidence, freshness: report.freshness, status: report.status, campaign: report.campaign, attackReferences: local(report.attackReferences) };
api.mutate(assessment, fixture, 'report-edit', { id: report.id, source: report.source, kind: report.kind, summary: 'Updated summary' }, timestamp);
const editedReport = assessment.reports.find((item) => item.id === report.id);
assert.deepStrictEqual(local(Object.fromEntries(Object.keys(metadata).map((key) => [key, editedReport[key]]))), metadata, 'report metadata survives edits');
assert.ok(api.render(assessment, fixture).includes('Updated summary'));
api.mutate(assessment, fixture, 'report-create', { source: 'Lab analyst', kind: 'Observation', summary: 'New report.' }, timestamp);
assert.strictEqual(assessment.reports.at(-1).sourceReliability, 'Learner-created · not independently verified');

const iocId = assessment.iocs.find((item) => item.type === 'email').id;
api.mutate(assessment, fixture, 'ioc-edit', { id: iocId, type: 'email', value: 'new@example.org', confidence: 80, context: 'Updated' }, timestamp);
assert.ok(api.render(assessment, fixture).includes('2026-09-24T09:05:00Z'));
api.mutate(assessment, fixture, 'ioc-expire', { id: iocId }, timestamp);
assert.strictEqual(assessment.iocs.find((item) => item.id === iocId).status, 'expired');
api.mutate(assessment, fixture, 'ioc-status', { id: iocId, status: 'active' }, timestamp);
assert.strictEqual(assessment.iocs.find((item) => item.id === iocId).status, 'active');
api.mutate(assessment, fixture, 'ioc-status', { id: iocId, status: 'retired' }, timestamp);
assert.strictEqual(assessment.iocs.find((item) => item.id === iocId).status, 'retired');
const seededIoc = assessment.iocs.find((item) => item.id === 'M04-I-001');
assert.strictEqual(seededIoc.type, 'ip');
assert.strictEqual(api.mutate(assessment, fixture, 'ioc-edit', { id: seededIoc.id, value: seededIoc.value }, timestamp).value, seededIoc.value);
assert.throws(() => api.mutate(assessment, fixture, 'ioc-create', { type: 'ip', value: '192.0.2.2', confidence: 20, firstSeen: '2026-09-25T00:00:00Z', lastSeen: '2026-09-24T00:00:00Z' }, timestamp), /chronological/);
assert.ok(assessment.actionHistory.length >= 10);
assert.throws(() => api.mutate(assessment, fixture, 'ioc-expire', { id: iocId }, undefined), /explicit valid timestamp/);
console.log('M04 intelligence lifecycle UI contract: all checks passed');

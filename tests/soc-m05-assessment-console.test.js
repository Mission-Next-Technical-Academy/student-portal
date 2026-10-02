#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const records = new Map();
const context = {
  FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } getAll(key) { return this.values[key] || []; } },
  LabRuntime: {
    loadCaseState(key, moduleKey, user, defaults) {
      return records.get(`${key}:${moduleKey}:${user.id}`) ?? JSON.parse(JSON.stringify(defaults));
    },
    saveCaseState(key, moduleKey, user, state) {
      records.set(`${key}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(state)));
      return state;
    },
    resetCaseState(key, moduleKey, user, defaults) {
      const state = JSON.parse(JSON.stringify(defaults));
      records.set(`${key}:${moduleKey}:${user.id}`, state);
      return state;
    },
  },
  document: { getElementById: () => null },
  wireMissionNextLabGating: () => {},
  missionNextLabLaunchGroup: () => '<section data-imported-prerequisites></section>',
  caseRecordPane: () => '<form id="m05-assessment"><button data-m05-submit-case>Submit case</button></form>',
  caseRecordMissing: () => [],
  moduleFiveCaseSpec: () => ({ caseId: 'EDR-5119' }),
  moduleFiveProveItRedoRequested: () => false,
  moduleFiveProveItRedoFeedback: () => '',
  moduleFiveProveItReviewStatus: () => '',
  registerModuleLab: () => {},
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
};
vm.createContext(context);
for (const file of [
  'soc-console-core.js', 'soc-timeline-ui.js', 'soc-m05-assessment-data.js',
  'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m05-assessment-device-ui.js', 'soc-m05-assessment-console.js', 'kql-engine.js', 'soc-assessment-scorer.js', 'soc-assessment-evolution.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-alert-queue-ui.js', 'soc-analyst-module-03-environment.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-actions.js', 'soc-m04-automation.js', 'soc-m04-intelligence-ui.js', 'soc-m04-rules-ui.js', 'soc-m04-rule-evaluator.js', 'soc-m04-assessment-console.js', 'soc-console-tools.js', 'soc-analyst-module-05.js',
]) vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });

const local = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, context)));
const user = { id: 'integration-learner', email: 'integration@example.test' };
context.testUser = user;
vm.runInContext(`moduleFiveUser = testUser; moduleFiveState = {
  caseRecord: { status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
  labProgress: {},
};`, context);
const fixture = vm.runInContext('SocM05AssessmentData', context);
const independent = vm.runInContext('SocM05AssessmentState', context).normalize({
  selectedDeviceIds: ['ws-assess-27'],
  approvalRequests: [{ id: `${fixture.scenario.id}:ACTION-000001`, sequence: 1, type: 'endpoint_isolation_request', status: 'pending_approval', deviceId: 'ws-assess-27', reason: 'Containment review', requestedBy: 'analyst-1' }],
}, fixture);
records.set(`${fixture.scenario.stateKey}:soc-05:${user.id}`, independent);
vm.runInContext(`moduleFiveCaseSpec = () => ({ caseId: 'EDR-5119' });`, context);
const legacyKey = 'm05-endpoint-chain-v1:soc-05:integration-learner';
records.set(legacyKey, { lessonProgress: ['legacy-work'], notes: 'keep legacy' });

// Prove It is the Module 3 console carrying Module 4's tools plus Endpoint,
// with the ITSM ticket as its own tab and no imported-lab prerequisites.
const alertsPanel = vm.runInContext('moduleFiveAssessmentLabPanel()', context);
assert.strictEqual((alertsPanel.match(/class="m03e-console"/g) || []).length, 1, 'one shared assessment console surface');
for (const tab of ['alerts', 'search', 'timeline', 'entities', 'sources', 'watchlists', 'evidence', 'intelligence', 'rules', 'automation', 'endpoint', 'case']) {
  assert.match(alertsPanel, new RegExp(`data-m03e-tab="m05:${tab}"`), `M05 console carries the ${tab} tab`);
}
assert.match(alertsPanel, /data-m03e-select="m05:alert:ALT-5127"/, 'the endpoint alert is in the Module 3 alert queue');
assert.doesNotMatch(alertsPanel, /data-imported-prerequisites/, 'imported projects are not Assessment Lab prerequisites');
assert.match(alertsPanel, /EDR-5127/);
const ticketPanel = vm.runInContext("m03eState('m05').tab = 'case'; moduleFiveAssessmentLabPanel()", context);
assert.strictEqual((ticketPanel.match(/id="m05-assessment"/g) || []).length, 1, 'one scored case form');
assert.strictEqual((ticketPanel.match(/data-m05-submit-case/g) || []).length, 1, 'one scored submit action');
assert.strictEqual(vm.runInContext('moduleFiveExtraMissing().length', context), 0, 'optional labs never gate the ticket');
const panel = vm.runInContext("m03eState('m05').tab = 'endpoint'; moduleFiveAssessmentLabPanel()", context);
assert.match(panel, /data-m05-console-workspace="endpoint"/);
assert.match(panel, /data-m05-device-select="ws-assess-27"/);
assert.match(panel, /data-m05-response-request/);
assert.match(panel, /No isolation or quarantine is performed/);
assert.match(panel, /pending_approval/);
assert.doesNotMatch(panel, /expectedTruth|processAncestry|maliciousFile/);
assert.strictEqual(records.get(legacyKey).notes, 'keep legacy', 'existing lesson/assessment state remains untouched');

let checkboxes = [];
const listeners = { click: [], submit: [] };
const clickHandler = (event) => listeners.click.forEach((handler) => handler(event));
const submitHandler = (event) => listeners.submit.forEach((handler) => handler(event));
const root = {
  innerHTML: '',
  dataset: {},
  addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
  querySelectorAll(selector) { return checkboxes.filter((input) => selector.includes('evidence-event') ? input.kind === 'event' && input.checked : input.kind === 'hash' && input.checked); },
};
context.document.getElementById = () => root;
vm.runInContext('wireModuleFiveAssessmentLab()', context);
const selectedButton = { dataset: { m05DeviceSelect: 'ws-assess-14' } };
const event = {
  target: { closest(selector) { return selector === '[data-m05-device-select]' ? selectedButton : null; } },
};
clickHandler(event);
assert.match(root.innerHTML, /data-m05-evidence-event/);
checkboxes = [
  { kind: 'event', value: 'M05-EVT-003', checked: true },
  { kind: 'event', value: 'M05-EVT-004', checked: true },
  { kind: 'hash', value: 'a'.repeat(64), checked: true },
];
const saved = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.deepStrictEqual(saved.selectedDeviceIds, ['ws-assess-14']);
assert.strictEqual(saved.actionHistory.length, 1);
assert.strictEqual(saved.actionHistory[0].type, 'device_review');
assert.strictEqual(saved.actionHistory[0].details.deviceId, 'ws-assess-14');
assert.match(root.innerHTML, /aria-pressed="true"/);
assert.match(root.innerHTML, /device_review/);
assert.match(root.innerHTML, /data-m05-action="M05-ASSESS-2026-09-27:ACTION-000002"/);
assert.strictEqual(records.get(legacyKey).notes, 'keep legacy', 'interaction writes only independent assessment state');

clickHandler({ target: { closest(selector) { return selector === '[data-m05-device-select]' ? { dataset: { m05DeviceSelect: 'ws-assess-27' } } : null; } } });
checkboxes = [];
assert.doesNotThrow(() => clickHandler({ target: { closest(selector) { return selector === '[data-m05-preserve-evidence]' ? { dataset: {} } : null; } } }), 'empty evidence selection is handled without an exception');
assert.strictEqual(records.get('m05-endpoint-assessment-v1:soc-05:integration-learner').actionHistory.length, 2);
checkboxes = [
  { kind: 'event', value: 'M05-EVT-003', checked: true },
  { kind: 'event', value: 'M05-EVT-004', checked: true },
  { kind: 'hash', value: 'a'.repeat(64), checked: true },
];
clickHandler({ target: { closest(selector) { return selector === '[data-m05-preserve-evidence]' ? { dataset: {} } : null; } } });
let packageSaved = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.deepStrictEqual(packageSaved.evidencePackage, { deviceId: 'ws-assess-27', eventIds: ['M05-EVT-003', 'M05-EVT-004'], hashes: ['a'.repeat(64)] });
assert.strictEqual(packageSaved.actionHistory.at(-1).type, 'evidence_package_preserved');
assert.strictEqual(packageSaved.actionHistory.at(-1).sequence, 4);
assert.match(root.innerHTML, /data-m05-preserved-package/);
const packageHistory = JSON.stringify(packageSaved.actionHistory);
checkboxes = [{ kind: 'event', value: 'M05-EVT-010', checked: true }, { kind: 'hash', value: 'a'.repeat(64), checked: true }];
clickHandler({ target: { closest(selector) { return selector === '[data-m05-preserve-evidence]' ? { dataset: {} } : null; } } });
assert.strictEqual(JSON.stringify(records.get('m05-endpoint-assessment-v1:soc-05:integration-learner').actionHistory), packageHistory, 'cross-device event does not change immutable history');
checkboxes = [{ kind: 'event', value: 'unknown-event', checked: true }, { kind: 'hash', value: 'a'.repeat(64), checked: true }];
clickHandler({ target: { closest(selector) { return selector === '[data-m05-preserve-evidence]' ? { dataset: {} } : null; } } });
checkboxes = [{ kind: 'event', value: 'M05-EVT-003', checked: true }, { kind: 'hash', value: 'not-a-hash', checked: true }];
clickHandler({ target: { closest(selector) { return selector === '[data-m05-preserve-evidence]' ? { dataset: {} } : null; } } });
assert.strictEqual(JSON.stringify(records.get('m05-endpoint-assessment-v1:soc-05:integration-learner').actionHistory), packageHistory);

let prevented = false;
const telemetryBeforeRequest = JSON.stringify(fixture.scenario.telemetry);
const responseForm = {
  values: { requestType: 'endpoint_quarantine_request', reason: 'Known malicious file', requestedBy: 'analyst-1', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe' },
  querySelector(selector) { return selector.includes('option:checked') ? { dataset: { sha256: 'a'.repeat(64) } } : { textContent: '' }; },
};
submitHandler({ target: { closest(selector) { return selector === '[data-m05-response-request]' ? responseForm : null; } }, preventDefault() { prevented = true; } });
const withRequest = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.ok(prevented, 'request submit is handled without a browser/form side effect');
assert.strictEqual(withRequest.approvalRequests.at(-1).type, 'endpoint_quarantine_request');
assert.strictEqual(withRequest.approvalRequests.at(-1).status, 'pending_approval');
assert.strictEqual(withRequest.approvalRequests.at(-1).deviceId, 'ws-assess-27');
assert.match(root.innerHTML, /pending_approval/);
assert.match(root.innerHTML, /No isolation or quarantine is performed/);
assert.strictEqual(JSON.stringify(fixture.scenario.telemetry), telemetryBeforeRequest, 'request submit leaves observed fixture telemetry untouched');
responseForm.values.requestType = 'endpoint_isolation_request';
delete responseForm.values.filePath;
submitHandler({ target: { closest(selector) { return selector === '[data-m05-response-request]' ? responseForm : null; } }, preventDefault() {} });
const withIsolationRequest = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.strictEqual(withIsolationRequest.approvalRequests.at(-1).type, 'endpoint_isolation_request');
assert.strictEqual(withIsolationRequest.approvalRequests.at(-1).status, 'pending_approval');
assert.strictEqual(JSON.stringify(fixture.scenario.telemetry), telemetryBeforeRequest, 'isolation request also leaves endpoint telemetry untouched');

let handoffFailure = '';
const handoffForm = { values: {
  eventIds: ['M05-EVT-007'], hashes: ['a'.repeat(64)], summary: 'Detection only; execution not prevented',
  owner: 'analyst-1', recipient: 'endpoint-team', recommendation: 'Isolate host and preserve evidence.',
}, closest(selector) { return selector === '[data-m05-edr-handoff]' ? this : null; }, querySelector() { return { set textContent(value) { handoffFailure = value; } }; } };
submitHandler({ target: handoffForm, preventDefault() {} });
let afterHandoff = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.strictEqual(handoffFailure, '', handoffFailure);
assert.strictEqual(afterHandoff.edrHandoffs.at(-1).recipient, 'endpoint-team');
assert.strictEqual(afterHandoff.edrHandoffs.at(-1).status, 'submitted');
const handoffId = afterHandoff.edrHandoffs.at(-1).id;
const statusForm = { values: { handoffId, status: 'accepted', updatedBy: 'endpoint-lead' }, closest(selector) { return selector === '[data-m05-handoff-status]' ? this : null; }, querySelector() { return null; } };
submitHandler({ target: statusForm, preventDefault() {} });
afterHandoff = records.get('m05-endpoint-assessment-v1:soc-05:integration-learner');
assert.strictEqual(afterHandoff.edrHandoffs.at(-1).status, 'accepted');
assert.strictEqual(afterHandoff.actionHistory.at(-1).type, 'edr_handoff_status');
assert.match(root.innerHTML, /accepted/);

const html = fs.readFileSync(path.join(portal, 'index.html'), 'utf8');
assert.ok(html.indexOf('soc-console-core.js') < html.indexOf('soc-m05-assessment-console.js'));
assert.ok(html.indexOf('soc-m05-assessment-device-ui.js') < html.indexOf('soc-m05-assessment-console.js'));
assert.ok(html.indexOf('soc-m05-assessment-console.js') < html.indexOf('soc-analyst-module-05.js'));
console.log('M05 shared assessment console integration: all checks passed');

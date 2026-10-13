#!/usr/bin/env node
// M09 Guided Lab teaches evidence preservation through the shared M05 control.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const portal = path.join(__dirname, '..', 'portal');
const context = vm.createContext({ console });
for (const file of ['soc-m05-assessment-data.js', 'soc-m05-assessment-state.js',
  'soc-m05-assessment-actions.js', 'soc-m05-assessment-device-ui.js',
  'soc-m09-assessment-data.js', 'soc-m09-assessment-state.js', 'soc-m09-assessment-rubric.js',
  'soc-console-tools.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const { fixture, stateApi, actions, tools } = vm.runInContext(`({
  fixture: SocM05AssessmentData, stateApi: SocM05AssessmentState,
  actions: SocM05AssessmentActions, tools: SocConsoleTools,
})`, context);
const guided = fs.readFileSync(path.join(portal, 'soc-analyst-module-09.js'), 'utf8');
const guide = guided.slice(guided.indexOf('function moduleNineGuidedSteps'), guided.indexOf('\n}\n', guided.indexOf('function moduleNineGuidedSteps')));
assert.match(guide, /title: 'Preserve endpoint evidence'/);
assert.match(guide, /tab: 'endpoint', target: '\[data-m05-device-select="ws-173"\]'/);
assert.match(guide, /Preserved for ws-173/);
assert.match(guide, /Verify that record before you proceed to eradication/);
assert.match(guided, /\{ id: 'm05', ctx: \{ \.\.\.base, fixture: fx\.m05,/,
  'the M09 Guided Lab mounts the shared Endpoint pack on its case fixture');

const device = fixture.scenario.devices[0];
let state = stateApi.normalize({ selectedDeviceIds: [device.id] }, fixture);
const ctx = { fixture, load: () => state };
const panel = tools.PACKS.m05.views(ctx).endpoint();
assert.match(panel, /data-m05-preserve-evidence/, 'the guide target is rendered by the shared Endpoint pack');
const event = fixture.scenario.telemetry.find((item) => item.deviceId === device.id && item.sha256);
assert.ok(event, 'fixture has endpoint evidence with a verifiable file hash');
state.evidencePackage = { deviceId: device.id, eventIds: [event.id], hashes: [event.sha256] };
state = actions.append(state, 'evidence_package_preserved', '2026-10-13T10:00:00.000Z', {
  deviceId: device.id, eventIds: [event.id], hashes: [event.sha256],
}, fixture);
const saved = stateApi.normalize(JSON.parse(JSON.stringify(state)), fixture);
assert.deepEqual(JSON.parse(JSON.stringify(saved.evidencePackage)), {
  deviceId: device.id, eventIds: [event.id], hashes: [event.sha256],
});
assert.match(tools.PACKS.m05.views({ ...ctx, load: () => saved }).endpoint(), /data-m05-preserved-package/,
  'the saved package is visibly verifiable before moving on');

assert.match(guided, /type === 'remove_persistence'[\s\S]*moduleNineGuidedPersistencePreserved\(\)/,
  'Practice It gates persistence removal on the preserved endpoint package');
assert.match(guided, /type === 'restore_backup'[\s\S]*moduleNineGuidedPersistenceRemoved\(\)/,
  'Practice It gates restore on successful persistence removal');
assert.match(guided, /else if \(!moduleNineGuidedRecoveryComplete\(\)\)/,
  'the guided ticket cannot close before successful recovery validation and monitoring');
const guidedSteps = guided.slice(guided.indexOf('function moduleNineGuidedSteps'), guided.indexOf('\n}\n', guided.indexOf('function moduleNineGuidedSteps')));
const removeAt = guidedSteps.indexOf("title: 'Remove persistence after preservation'");
const restoreAt = guidedSteps.indexOf("title: 'Restore the trusted recovery point'");
const validationAt = guidedSteps.indexOf("title: 'Scan, validate, and monitor recovery'");
assert.ok(removeAt >= 0 && removeAt < restoreAt && restoreAt < validationAt,
  'guided eradication, restore, and validation tasks are ordered');
for (const [title, text] of [
  ['Restore the trusted recovery point', 'RP-WS-173-0918'],
  ['Restore the trusted recovery point', 'approval'],
  ['Scan, validate, and monitor recovery', '30-minute monitoring'],
]) {
  const start = guidedSteps.indexOf(`title: '${title}'`);
  const step = guidedSteps.slice(start, guidedSteps.indexOf('},', start));
  assert.match(step, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

// Exercise the shared M09 state machine used by the guided Recovery controls.
const recovery = vm.runInContext(`(() => {
  const fixture = JSON.parse(JSON.stringify(SocM09AssessmentData));
  fixture.scenario.stateKey = 'm09-guided-incident-actions-v1';
  fixture.scenario.end = '2026-09-27T11:20:00Z';
  const api = SocM09AssessmentState;
  const incident = fixture.scenario.incidentGraph.incidentId;
  let state = api.normalize({}, fixture);
  const at = (minute, second = 0) => new Date(Date.parse('2026-09-27T10:00:00Z') + minute * 60000 + second * 1000).toISOString();
  state = api.transition(state, { selectedIncidentId: incident }, fixture);
  const approve = (target, action, minute) => {
    state = api.updateIncidentWorkflow(state, incident, { approvalStatus: 'pending', approvalReason: 'Approved by incident lead after evidence review.', approvalTargetId: target, approvalActionType: action }, at(minute), fixture);
    state = api.updateIncidentWorkflow(state, incident, { approvalStatus: 'approved', approvalActorId: 'ir-lead-morgan' }, at(minute, 1), fixture);
  };
  approve('persist-runkey-173', 'remove_persistence', 0);
  state = api.executeApprovedAction(state, incident, { type: 'remove_persistence', outcome: 'success', details: { entityId: 'persist-runkey-173', incidentId: incident } }, at(0, 2), fixture);
  state = api.selectRecoveryPoint(state, incident, 'RP-WS-173-0918', at(1), fixture);
  approve('DEV-173', 'restore_backup', 1);
  for (const [type, minute] of [['restore_backup', 1], ['scan_recovery', 2], ['validate_recovery', 3]]) {
    state = api.executeApprovedAction(state, incident, { type, outcome: 'success', details: { entityId: 'DEV-173', incidentId: incident } }, at(minute, 2), fixture);
    // Simulate saved JSONB object-key reordering between every action.
    state = api.normalize(JSON.parse(JSON.stringify(state)), fixture);
  }
  state = api.completeRecoveryMonitoring(state, incident, 'DEV-173', at(4), [], fixture);
  return { fixture, state, api, incident };
})()`, context);
const history = Array.from(recovery.state.actionHistory, (action) => action.type);
assert.deepEqual(history, ['remove_persistence', 'select_recovery_point', 'restore_backup', 'scan_recovery', 'validate_recovery', 'monitor_recovery']);
assert.equal(recovery.state.entityStates['DEV-173'].validationStatus, true);
assert.equal(recovery.state.actionHistory[2].details.recoveryPointId, 'RP-WS-173-0918');
assert.equal(recovery.state.actionHistory[2].details.approval.approverId, 'ir-lead-morgan');
assert.equal(recovery.state.actionHistory.at(-1).details.execution.summary, 'monitoring_passed');
assert.equal(Date.parse(recovery.state.actionHistory.at(-1).details.windowEnd)
  - Date.parse(recovery.state.actionHistory.at(-1).details.windowStart), 30 * 60 * 1000,
  'the recovery validation is followed by the full 30-minute monitoring window');
assert.throws(() => recovery.api.executeApprovedAction(recovery.state, recovery.incident,
  { type: 'restore_backup', outcome: 'success', details: { entityId: 'DEV-173', incidentId: recovery.incident } },
  '2026-09-27T10:05:00Z', recovery.fixture), /invalid action/,
  'the saved recovery state rejects a second restore after validation');
console.log('M09 Guided Lab preserves evidence before eradication and completes the approved recovery sequence through JSONB round-trips.');

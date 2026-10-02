#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const storage = new Map();
const keyFor = (labId, moduleKey, user) => `${labId}:${moduleKey}:${user.email}`;
const context = {
  LabRuntime: {
    loadCaseState(labId, moduleKey, user, defaults) {
      return storage.get(keyFor(labId, moduleKey, user)) ?? JSON.parse(JSON.stringify(defaults));
    },
    saveCaseState(labId, moduleKey, user, state) {
      const clone = JSON.parse(JSON.stringify(state));
      storage.set(keyFor(labId, moduleKey, user), clone);
      return clone;
    },
    resetCaseState(labId, moduleKey, user, defaults) {
      return this.saveCaseState(labId, moduleKey, user, defaults);
    },
  },
  esc: (value) => String(value ?? ''),
  caseRecordMissing: () => [],
  caseRecordPane: () => '<form id="m06-independent-form"></form>',
  caseRecordSeverity: (state) => state.severity || '',
  caseRecordDisposition: (state) => state.disposition || '',
  markModuleContentOpened: () => {},
  createQuizAttempt: () => ({ selectedQuestions: [], answers: {} }),
  selectQuizQuestions: () => ({ selectedQuestions: [], questionsByAnswer: {} }),
  wireMissionNextLabGating: () => {},
  missionNextLabLaunchGroup: () => '',
  missionNextAllLabsComplete: () => false,
  missionNextOptionalLabsSection: () => '',
  LABS: [{ key: 'lab-active-incident', title: 'Active incident' }],
};
vm.createContext(context);

const scripts = [
  'module-registry.js',
  'soc-assessment-scorer.js', 'soc-assessment-evolution.js', 'soc-console-core.js',
  'soc-alert-queue-ui.js', 'soc-timeline-ui.js',
  'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-actions.js',
  'soc-m04-automation.js', 'soc-m04-intelligence-ui.js', 'kql-engine.js', 'soc-m04-rules-ui.js',
  'soc-m04-assessment-console.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-analyst-module-03-environment.js', 'soc-console-tools.js', 'soc-analyst-module-04.js',
  'soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m05-assessment-device-ui.js', 'soc-m05-assessment-console.js', 'soc-analyst-module-05.js',
  'soc-m06-assessment-data.js', 'soc-m06-assessment-state.js', 'soc-m06-assessment-seed-ui.js',
  'soc-m06-assessment-actions.js', 'attack-catalog.js', 'soc-m06-assessment-related-search.js',
  'soc-m06-assessment-rubric.js', 'soc-m06-assessment-scorer.js', 'soc-analyst-module-06.js',
  'soc-m07-assessment-data.js', 'soc-m07-assessment-state.js', 'soc-m07-assessment-actions.js',
  'soc-m07-assessment-email-ui.js', 'soc-m07-assessment-network-ui.js',
  'soc-m07-assessment-rubric.js', 'soc-m07-assessment-scorer.js', 'soc-analyst-module-07.js',
  'soc-m08-assessment-data.js', 'soc-m08-assessment-state.js', 'soc-m08-assessment-actions.js',
  'soc-m08-assessment-rubric.js', 'soc-m08-assessment-scorer.js', 'soc-m08-assessment-ui.js',
  'soc-analyst-module-08.js',
  'soc-m09-assessment-data.js', 'soc-m09-assessment-state.js', 'soc-m09-assessment-rubric.js', 'soc-m09-assessment-scorer.js', 'soc-analyst-module-09.js',
];
for (const filename of scripts) {
  vm.runInContext(fs.readFileSync(path.join(portal, filename), 'utf8'), context, { filename });
}

const local = (expression) => JSON.parse(JSON.stringify(vm.runInContext(expression, context)));
const user = { id: 'm06-cumulative', email: 'cumulative@example.test' };
context.testUser = user;
const fixtures = local(`({ m04: SocM04AssessmentData, m05: SocM05AssessmentData, m06: SocM06AssessmentData, m07: SocM07AssessmentData, m08: SocM08AssessmentData })`);

const catalogContext = {};
vm.createContext(catalogContext);
vm.runInContext(fs.readFileSync(path.join(portal, 'data.js'), 'utf8'), catalogContext, { filename: 'data.js' });
const catalog = JSON.parse(JSON.stringify(vm.runInContext('LABS', catalogContext)));

for (const [moduleNumber, moduleKey] of [[4, 'soc-04'], [5, 'soc-05'], [6, 'soc-06'], [7, 'soc-07'], [8, 'soc-08']]) {
  const registered = local(`moduleLabFor('soc-analyst', ${moduleNumber})`);
  assert.strictEqual(registered.moduleKey, moduleKey, `module ${moduleNumber} resolves to its catalog module key`);
  assert.strictEqual(registered.moduleNumber, moduleNumber, `module ${moduleNumber} resolves through its own navigation route`);
  assert.strictEqual(registered.program, 'soc-analyst');
  assert.strictEqual(local(`typeof moduleLabFor('soc-analyst', ${moduleNumber}).view`), 'function',
    `module ${moduleNumber} has a renderable registry entry`);
}
const expectedLabs = [
  ['lab-detection-rule', 'soc-04'],
  ['lab-endpoint-investigation', 'soc-05'], ['lab-endpoint-independent', 'soc-05'],
  ['lab-threat-hunt', 'soc-06'], ['lab-threat-hunt-independent', 'soc-06'],
  ['lab-email-triage', 'soc-07'], ['lab-network-investigation', 'soc-07'],
  ['lab-network-email-independent', 'soc-07'],
  ['lab-vuln-prioritization', 'soc-08'], ['lab-vuln-queue', 'soc-08'],
];
for (const [key, module] of expectedLabs) {
  const lab = catalog.find((item) => item.key === key);
  assert.ok(lab, `${key} is present in the learner catalog`);
  assert.strictEqual(lab.module, module,
    `${key} remains wired to ${module} in the learner catalog`);
}

let m04 = local('SocM04AssessmentState.load(testUser, {}, SocM04AssessmentData)');
m04.assessment.activeWorkspace = 'automation';
const m04Action = vm.runInContext(
  `SocM04AssessmentActions.appendAutomationAction(${JSON.stringify(m04)}, 'indicator_enrichment', '2026-09-27T10:00:00Z', { iocId: 'M04-I-001' })`,
  context,
);
m04 = JSON.parse(JSON.stringify(m04Action.state));
vm.runInContext(`SocM04AssessmentState.save(testUser, ${JSON.stringify(m04)}, SocM04AssessmentData)`, context);

let m05 = local('SocM05AssessmentState.load(testUser, SocM05AssessmentData)');
m05.selectedDeviceIds = ['ws-assess-27'];
m05 = JSON.parse(JSON.stringify(vm.runInContext(
  `SocM05AssessmentActions.append(${JSON.stringify(m05)}, 'device_review', '2026-09-27T10:01:00Z', { deviceId: 'ws-assess-27', status: 'reviewed', note: 'Cumulative integration check' }, SocM05AssessmentData)`,
  context,
)));
vm.runInContext(`SocM05AssessmentState.save(testUser, ${JSON.stringify(m05)}, SocM05AssessmentData)`, context);

const m06 = local('SocM06AssessmentState.load(testUser, SocM06AssessmentData)');
const m06Action = vm.runInContext(
  `SocM06AssessmentActions.append(${JSON.stringify(m06)}, 'hypothesis_edit', '2026-09-27T10:02:00Z', { hypothesisId: 'M06-HYP-000001', text: 'Evidence supports a bounded recurrence hypothesis.', status: 'active', relatedEventIds: [SocM06AssessmentData.scenario.telemetry[0].id], deviceIds: [SocM06AssessmentData.scenario.scope.devices[0]] }, SocM06AssessmentData)`,
  context,
);
vm.runInContext(`SocM06AssessmentState.save(testUser, ${JSON.stringify(m06Action)}, SocM06AssessmentData)`, context);

const m07 = local('SocM07AssessmentState.load(testUser, SocM07AssessmentData)');
const m07Action = vm.runInContext(
  `SocM07AssessmentActions.append(${JSON.stringify(m07)}, 'message_review', '2026-09-27T10:20:00.000Z', { messageId: 'M07-MSG-001', reviewed: true }, SocM07AssessmentData)`,
  context,
);
vm.runInContext(`SocM07AssessmentState.save(testUser, ${JSON.stringify(m07Action)}, SocM07AssessmentData)`, context);

const m08 = local('SocM08AssessmentState.load(testUser, SocM08AssessmentData)');
const m08Action = vm.runInContext(
  `SocM08AssessmentActions.append(${JSON.stringify(m08)}, 'finding_review', '2026-09-27T10:50:00.000Z', { findingId: 'M08-FINDING-001', status: 'reviewed', evidenceIds: ['M08-EVID-001'], notes: 'Cumulative integration check.' }, SocM08AssessmentData)`,
  context,
);
vm.runInContext(`SocM08AssessmentState.save(testUser, ${JSON.stringify(m08Action)}, SocM08AssessmentData)`, context);

const restoredM04 = local('SocM04AssessmentState.load(testUser, {}, SocM04AssessmentData)');
const restoredM05 = local('SocM05AssessmentState.load(testUser, SocM05AssessmentData)');
const restoredM06 = local('SocM06AssessmentState.load(testUser, SocM06AssessmentData)');
const restoredM07 = local('SocM07AssessmentState.load(testUser, SocM07AssessmentData)');
const restoredM08 = local('SocM08AssessmentState.load(testUser, SocM08AssessmentData)');
assert.strictEqual(restoredM04.assessment.activeWorkspace, 'automation');
assert.strictEqual(restoredM04.assessment.automationActions.at(-1).type, 'indicator_enrichment');
assert.strictEqual(restoredM04.assessment.actionHistory.at(-1).type, 'automation_action_recorded');
assert.strictEqual(restoredM05.selectedDeviceIds[0], 'ws-assess-27');
assert.strictEqual(restoredM05.actionHistory.at(-1).type, 'device_review');
assert.strictEqual(restoredM06.actionHistory.at(-1).type, 'hypothesis_edit');
assert.strictEqual(restoredM06.actionHistory.at(-1).details.text, 'Evidence supports a bounded recurrence hypothesis.');
assert.deepStrictEqual(restoredM07.reviewedMessageIds, ['M07-MSG-001']);
assert.strictEqual(restoredM07.actionHistory.at(-1).type, 'message_review');
assert.strictEqual(restoredM07.actionHistory.at(-1).details.messageId, 'M07-MSG-001');
assert.strictEqual(restoredM08.findingReviews[0].findingId, 'M08-FINDING-001');
assert.strictEqual(restoredM08.findingReviews[0].status, 'reviewed');
assert.strictEqual(restoredM08.actionHistory.at(-1).type, 'finding_review');
assert.strictEqual(restoredM08.actionHistory.at(-1).details.findingId, 'M08-FINDING-001');
const moduleNames = ['m04', 'm05', 'm06', 'm07', 'm08'];
for (let left = 0; left < moduleNames.length; left += 1) {
  for (let right = left + 1; right < moduleNames.length; right += 1) {
    const a = fixtures[moduleNames[left]].scenario;
    const b = fixtures[moduleNames[right]].scenario;
    assert.notStrictEqual(a.id, b.id, `${moduleNames[left]} and ${moduleNames[right]} use distinct scenario IDs`);
    assert.notStrictEqual(a.stateKey, b.stateKey, `${moduleNames[left]} and ${moduleNames[right]} use distinct fixture state keys`);
  }
}
const namespaces = [
  [local('SocM04AssessmentState.LAB_ID'), local('SocM04AssessmentState.MODULE_KEY')],
  [fixtures.m05.scenario.stateKey, local('SocM05AssessmentState.MODULE_KEY')],
  [fixtures.m06.scenario.stateKey, local('SocM06AssessmentState.MODULE_KEY')],
  [fixtures.m07.scenario.stateKey, local('SocM07AssessmentState.MODULE_KEY')],
  [fixtures.m08.scenario.stateKey, local('SocM08AssessmentState.MODULE_KEY')],
];
assert.strictEqual(new Set(namespaces.map(([lab, module]) => `${lab}:${module}`)).size, 5,
  'each module assessment has a unique storage namespace');
assert.strictEqual(new Set(namespaces.map(([_, module]) => module)).size, 5,
  'each assessment uses its own module state key');
const serialized = [restoredM04, restoredM05, restoredM06, restoredM07, restoredM08].map((state) => JSON.stringify(state));
assert.match(serialized[0], /M04-I-001/);
assert.match(serialized[1], /ws-assess-27/);
assert.match(serialized[2], /M06-HYP-000001/);
assert.match(serialized[3], /M07-MSG-001/);
assert.match(serialized[4], /M08-FINDING-001/);
const actionSentinels = ['M04-I-001', 'ws-assess-27', 'M06-HYP-000001', 'M07-MSG-001', 'M08-FINDING-001'];
for (let owner = 0; owner < serialized.length; owner += 1) {
  for (let other = 0; other < actionSentinels.length; other += 1) {
    if (owner !== other) {
      assert.doesNotMatch(serialized[owner], new RegExp(actionSentinels[other]),
        `${moduleNames[owner]} state does not contain ${moduleNames[other]} action evidence`);
    }
  }
}

const m04Html = local(`SocM04AssessmentConsole.render(${JSON.stringify(restoredM04.assessment)})`);
const m05Html = local(`SocM05AssessmentConsole.render(${JSON.stringify(restoredM05)}, SocM05AssessmentData, 'ws-assess-27')`);
local('moduleSixLoad(testUser)');
const m06Html = local('moduleSixAssessmentLabPanel()');
local('moduleSevenLoad(testUser)');
const m07Html = local('moduleSevenAssessmentLabPanel()');
const m08Html = local(`SocM08AssessmentUi.render(SocM08AssessmentData, ${JSON.stringify(restoredM08)}, 'M08-FINDING-001')`);
assert.match(m04Html, /class="m04-shared-console"/);
assert.match(m04Html, /data-m04-console-workspace="automation"/);
assert.match(m04Html, /data-m04-low-risk-automation/);
assert.match(m05Html, /class="m05-shared-console"/);
assert.match(m05Html, /data-m05-console-workspace="endpoint"/);
assert.match(m05Html, /device_review/);
assert.match(m06Html, /id="m03e-console-m06"/);
for (const tab of ['intelligence', 'rules', 'automation', 'endpoint', 'hunting', 'attack', 'case']) assert.match(m06Html, new RegExp(`data-m03e-tab="m06:${tab}"`), `M06 carries the ${tab} tab`);
assert.match(m07Html, /id="m03e-console-m07"/);
for (const tab of ['intelligence', 'rules', 'automation', 'endpoint', 'hunting', 'attack', 'email', 'network', 'case']) assert.match(m07Html, new RegExp(`data-m03e-tab="m07:${tab}"`), `M07 carries the ${tab} tab`);
assert.match(local("m03eState('m07').tab = 'email'; moduleSevenAssessmentLabPanel()"), /M07-MSG-001/);
assert.match(local("m03eState('m07').tab = 'network'; moduleSevenAssessmentLabPanel()"), /M07-PROXY-001/);
assert.match(m08Html, /m08-assessment-findings/);
assert.match(m08Html, /M08-FINDING-001/);
vm.runInContext('moduleEightLoad(testUser)', context);
const m08Panel = local('moduleEightAssessmentLabPanel()');
assert.match(m08Panel, /id="m03e-console-m08"/);
for (const tab of ['intelligence', 'rules', 'automation', 'endpoint', 'hunting', 'attack', 'email', 'network', 'exposure', 'case']) assert.match(m08Panel, new RegExp(`data-m03e-tab="m08:${tab}"`), `M08 carries the ${tab} tab`);
assert.match(local("m03eState('m08').tab = 'exposure'; moduleEightAssessmentLabPanel()"), /M08-FINDING-001/);
vm.runInContext('moduleNineLoad(testUser)', context);
const m09Panel = local('moduleNineDynamic()');
assert.match(m09Panel, /id="m03e-console-m09"/);
for (const tab of ['intelligence', 'rules', 'automation', 'endpoint', 'hunting', 'attack', 'email', 'network', 'exposure', 'incident', 'response', 'recovery', 'case']) assert.match(m09Panel, new RegExp(`data-m03e-tab="m09:${tab}"`), `M09 carries the ${tab} tab`);
assert.match(local("m03eState('m09').tab = 'recovery'; moduleNineDynamic()"), /RP-WS-173-0918/);
// Workspace forms reuse names like status/notes; only the ticket form may write ticket fields.
for (const [file, formId] of [['soc-analyst-module-07.js', 'm07-assessment-form'], ['soc-analyst-module-08.js', 'm08-assessment-form'], ['soc-analyst-module-09.js', 'm09-form']]) {
  const source = fs.readFileSync(path.join(portal, file), 'utf8');
  const lines = source.split('\n');
  const writes = lines.map((line, index) => ({ line, index })).filter(({ line }) => /caseRecordApply\(|caseRecord\.notes = /.test(line) && !/function /.test(line));
  assert.ok(writes.length > 0 && writes.every(({ index }) => lines.slice(Math.max(0, index - 3), index + 1).some((line) => line.includes(`#${formId}`) || /#guided-m0\d-|#m0\d-guided-case-form/.test(line))), `${file} ticket writes are scoped to #${formId} (or the Guided Lab case form)`);
  assert.ok(new RegExp(`closest\\('#${formId}'\\)`).test(source), `${file} checks the ticket form before writing`);
}
assert.ok(storage.has(`${local('SocM04AssessmentState.LAB_ID')}:soc-04:${user.email}`));
assert.ok(storage.has(`${fixtures.m05.scenario.stateKey}:soc-05:${user.email}`));
assert.ok(storage.has(`${fixtures.m06.scenario.stateKey}:soc-06:${user.email}`));
assert.ok(storage.has(`${fixtures.m07.scenario.stateKey}:soc-07:${user.email}`));
assert.ok(storage.has(`${fixtures.m08.scenario.stateKey}:soc-08:${user.email}`));
assert.notStrictEqual(fixtures.m04.scenario.stateKey, fixtures.m05.scenario.stateKey);
assert.notStrictEqual(fixtures.m05.scenario.stateKey, fixtures.m06.scenario.stateKey);
assert.notStrictEqual(fixtures.m06.scenario.stateKey, fixtures.m07.scenario.stateKey);
assert.notStrictEqual(fixtures.m07.scenario.stateKey, fixtures.m08.scenario.stateKey);

const html = fs.readFileSync(path.join(portal, 'index.html'), 'utf8');
const registeredOrder = [
  'soc-console-core.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js',
  'soc-m04-assessment-actions.js', 'soc-m04-assessment-console.js', 'soc-console-tools.js', 'soc-analyst-module-04.js',
  'soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m05-assessment-console.js', 'soc-analyst-module-05.js', 'soc-m06-assessment-data.js',
  'soc-m06-assessment-state.js', 'soc-m06-assessment-actions.js', 'attack-catalog.js', 'soc-m06-assessment-related-search.js',
  'soc-m06-assessment-scorer.js', 'soc-analyst-module-06.js',
  'soc-m07-assessment-data.js', 'soc-m07-assessment-state.js', 'soc-m07-assessment-actions.js',
  'soc-m07-assessment-email-ui.js', 'soc-m07-assessment-network-ui.js',
  'soc-m07-assessment-rubric.js', 'soc-m07-assessment-scorer.js', 'soc-analyst-module-07.js',
  'soc-m08-assessment-data.js', 'soc-m08-assessment-state.js', 'soc-m08-assessment-actions.js',
  'soc-m08-assessment-rubric.js', 'soc-m08-assessment-scorer.js', 'soc-m08-assessment-ui.js',
  'soc-analyst-module-08.js',
];
for (let index = 1; index < registeredOrder.length; index += 1) {
  const previous = registeredOrder[index - 1];
  const current = registeredOrder[index];
  assert.ok(html.indexOf(previous) < html.indexOf(current), `${current} is registered after ${previous}`);
}
console.log('M08 cumulative console integration: M04-M08 workspaces, routes, and isolated state/action restore verified');

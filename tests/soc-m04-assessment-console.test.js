#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const persisted = { independentLab: { answers: { signal: 'chain' } }, notes: 'keep M04 work' };
const writes = [];
const context = {
  LabRuntime: {
    loadCaseState: () => persisted,
    saveCaseState: (...args) => { writes.push(args); return args[3]; },
    resetCaseState: (...args) => { writes.push(['reset', ...args]); return {}; },
  },
  esc: (value) => String(value ?? ''),
  registerModuleLab: () => {},
  markModuleContentOpened: () => {},
  createQuizAttempt: () => ({ selectedQuestions: [], answers: {} }),
};
context.window = context;
vm.createContext(context);
for (const filename of [
  'case-record.js', 'console-guide.js', 'learn-it-decks.js', 'learn-it-cards.js',
  'soc-assessment-scorer.js',
  'soc-assessment-evolution.js',
  'soc-console-core.js',
  'soc-alert-queue-ui.js',
  'soc-m04-assessment-data.js',
  'soc-m04-assessment-state.js',
  'soc-m04-assessment-actions.js',
  'soc-m04-automation.js',
  'soc-m04-intelligence-ui.js',
  'kql-engine.js',
  'soc-m04-rules-ui.js',
  'soc-m04-assessment-console.js',
  'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-analyst-module-03-environment.js', 'soc-console-tools.js', 'soc-analyst-module-04.js',
  'soc-timeline-ui.js',
  'soc-m05-assessment-data.js',
  'soc-m05-assessment-state.js',
  'soc-m05-assessment-actions.js',
  'soc-m05-assessment-device-ui.js',
  'soc-m05-assessment-console.js',
  'soc-analyst-module-05.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(portal, filename), 'utf8'), context, { filename });
}

const local = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, context)));
const config = local('SocM04AssessmentConsole.configuration()');
const baseline = local('SocAssessmentEvolution.baselineCapabilities');
const m04Adds = local("SocAssessmentEvolution.moduleFor('soc-04').adds");
assert.ok(baseline.every((capability) => config.capabilities.includes(capability)), 'M04 preserves every baseline capability');
assert.ok(m04Adds.every((capability) => config.capabilities.includes(capability)), 'M04 features are additive');
assert.ok(config.tabs.some((tab) => tab.id === 'search'));
assert.ok(config.tabs.some((tab) => tab.id === 'evidence'));
assert.ok(config.tabs.some((tab) => tab.id === 'intelligence'));
assert.ok(config.tabs.some((tab) => tab.id === 'rules'));
assert.ok(config.tabs.some((tab) => tab.id === 'automation'));

vm.runInContext('moduleFourLoad({ email: "learner@example.test" })', context);
assert.strictEqual(vm.runInContext('moduleFourState.independentLab.answers.signal', context), 'chain');
assert.strictEqual(vm.runInContext('moduleFourState.notes', context), 'keep M04 work');
assert.strictEqual(vm.runInContext('moduleFourState.assessment.scenarioId', context), 'M04-ASSESS-2026-09-24');
assert.strictEqual(config.scenarioId, vm.runInContext('SocM04AssessmentData.scenario.id', context), 'console and immutable fixture use the same scenario identity');
assert.ok(writes.length >= 1, 'legacy M04 state migration is persisted');
assert.strictEqual(writes[0][0], 'm04-detection-enrichment-v1');

// The section list now evaluates the Guided Lab checklist, which reads the guided console's state.
vm.runInContext('moduleFourGuidedLoad({ email: "learner@example.test" })', context);
const authoredAssessmentSections = local("moduleFourGetSections().filter((section) => section.title === 'Assessment Lab')");
assert.strictEqual(authoredAssessmentSections.length, 1, 'M04 navigation authors exactly one Assessment Lab entry');
assert.strictEqual(authoredAssessmentSections[0].scrollId, 'm04-assessment-lab');

// The Assessment Lab is the Module 3 console mounted on the independent M04
// data: every Module 3 tab, plus only the three Module 4 workspaces, with the
// ITSM ticket as the console's own tab. Nothing else is scored in the panel.
vm.runInContext(`
  moduleFourCaseSpec = () => ({ caseId: 'DET-4424' });
  caseRecordMissing = () => [];
  caseRecordPane = () => '<form id="m04-assessment"><button data-m04-submit-case>Submit case</button></form>';
  moduleFourProveItRedoRequested = () => false;
  moduleFourProveItRedoFeedback = () => '';
  moduleFourProveItReviewStatus = () => 'review';
`, context);
const consoleTabs = ['alerts', 'search', 'timeline', 'entities', 'sources', 'watchlists', 'evidence', 'intelligence', 'rules', 'automation', 'case'];
const composedAssessmentPanel = vm.runInContext('moduleFourAssessmentLabPanel()', context);
assert.strictEqual((composedAssessmentPanel.match(/class="m03e-console"/g) || []).length, 1, 'the Assessment Lab contains one Module 3 console');
assert.match(composedAssessmentPanel, /id="m03e-console-m04"/);
assert.doesNotMatch(composedAssessmentPanel, /m04-shared-console/, 'the separate M04 console is no longer composed');
for (const tab of consoleTabs) assert.match(composedAssessmentPanel, new RegExp(`data-m03e-tab="m04:${tab}"`), `console exposes the ${tab} tab`);
assert.match(composedAssessmentPanel, /DET-4424 · 2026-09-24 · \d+ events/);
assert.doesNotMatch(composedAssessmentPanel, /m04-independent-lab|m04-independent-form/, 'the independent practice lab is not in the Assessment Lab');
const guidedPanel = vm.runInContext('moduleFourGuidedLabPanel()', context);
assert.match(guidedPanel, /id="m03e-console-m04-guided"/, 'Practice It is the DET-4478 case in the Module 3 SIEM console');
assert.doesNotMatch(guidedPanel, /m04-independent-lab|m04-independent-form/, 'the retired independent form lab is not composed into Practice It');
assert.doesNotMatch(composedAssessmentPanel, /data-module-assessment-form|Independent evidence submission/,
  'the generic legacy assessment card/form is not composed into M04');
const caseTab = vm.runInContext("m03eState('m04').tab = 'case'; moduleFourAssessmentLabPanel()", context);
assert.strictEqual((caseTab.match(/id="m04-assessment"/g) || []).length, 1, 'the ITSM ticket tab contains one scored case form');
assert.strictEqual((caseTab.match(/data-m04-submit-case/g) || []).length, 1, 'the Assessment Lab exposes one catalog submission command');
assert.doesNotMatch(caseTab, /m04-artifact-locked|Guided Lab/, 'the ticket is not gated on Practice It work');
assert.doesNotMatch(vm.runInContext('JSON.stringify(moduleFourExtraMissing())', context), /imported|Guided Lab|playbook/i, 'optional labs and Practice It never gate the assessment');

for (const tab of consoleTabs) {
  const view = vm.runInContext(`m03eState('m04').tab = ${JSON.stringify(tab)}; moduleThreeConsoleHtml('m04')`, context);
  assert.match(view, new RegExp(`aria-selected="true" class="is-active" data-m03e-tab="m04:${tab}"`));
  assert.doesNotMatch(view, /confirmedCompromisedAccounts|successfulAuthenticationEventIds|matchEventIds|excludeEventIds|maliciousSourceIp|targetedAccounts/,
    'pre-submit workspace does not render answer-key field names');
}
const rulesView = vm.runInContext("m03eState('m04').tab = 'rules'; moduleThreeConsoleHtml('m04')", context);
assert.match(rulesView, /data-m04-console-workspace="rules"/);
assert.doesNotMatch(rulesView, /data-m04-query-form/, 'queries are written in Log Search, not a second editor');
const visibleSearchEvidence = vm.runInContext("Object.assign(m03eState('m04'), { tab: 'search', lastQuery: 'AuthLog | take 5' }); moduleThreeConsoleHtml('m04')", context);
assert.match(visibleSearchEvidence, /M04-A-\d{3}/, 'queried synthetic telemetry remains visible for learner investigation');
assert.match(visibleSearchEvidence, /data-m04-save-search-query/, 'a Log Search result can be saved as a rule query');
assert.doesNotMatch(visibleSearchEvidence, /confirmedCompromisedAccounts|successfulAuthenticationEventIds|matchEventIds|excludeEventIds|maliciousSourceIp|targetedAccounts/,
  'rendered query evidence does not include the evaluator answer key');
const intelligenceView = vm.runInContext("m03eState('m04').tab = 'intelligence'; moduleThreeConsoleHtml('m04')", context);
assert.match(intelligenceView, /data-m04-console-workspace="intelligence"/);
assert.match(intelligenceView, /Threat reports/);
assert.match(intelligenceView, /Indicators of compromise/);
assert.match(intelligenceView, /Report-provided ATT&amp;CK context \(unverified\)/);
assert.strictEqual(vm.runInContext('moduleFourState.assessment.iocs.length', context), 3, 'fixture IOC records seed into saved assessment state');

// Generated alerts appear in the Module 3 alert queue and drawer.
vm.runInContext(`
  moduleFourState.assessment.alerts = [{ id: 'M04-ALERT-0001', executionId: 'M04-EXEC-0001', ruleId: 'M04-RULE-0001', sourceRule: 'Spray', sourceQuery: 'AuthLog', group: '198.51.100.64', groupingField: 'SourceIp', severity: 'High', matchCount: 5, threshold: 5, eventIds: ['M04-A-001'], createdAt: '2026-09-24T09:20:00Z', title: 'Spray · 198.51.100.64', status: 'New', reviewNote: '' }];
  Object.assign(m03eState('m04'), { tab: 'alerts', selected: { type: 'alert', id: 'M04-ALERT-0001' } });
`, context);
const alertsView = vm.runInContext("moduleThreeConsoleHtml('m04')", context);
assert.match(alertsView, /data-m03e-select="m04:alert:M04-ALERT-0001"/);
assert.match(alertsView, /data-m04-alert-review-form data-alert-id="M04-ALERT-0001"/);
assert.match(alertsView, /data-m03e-select="m04:record:M04-A-001"/, 'matched events pivot to their records');
vm.runInContext("moduleFourState.assessment.alerts = []; Object.assign(m03eState('m04'), { tab: 'alerts', selected: null, lastQuery: '' })", context);

const html = fs.readFileSync(path.join(portal, 'index.html'), 'utf8');
assert.ok(html.indexOf('soc-m04-assessment-data.js') < html.indexOf('soc-m04-assessment-console.js'));
assert.ok(html.indexOf('soc-m04-rules-ui.js') < html.indexOf('soc-m04-assessment-console.js'));
assert.ok(html.indexOf('soc-m04-assessment-console.js') < html.indexOf('soc-console-tools.js', 'soc-analyst-module-04.js'));
assert.ok(html.indexOf('soc-analyst-module-03-environment.js') < html.indexOf('soc-console-tools.js', 'soc-analyst-module-04.js'), 'the Module 3 console loads before Module 4 mounts it');
const portalScriptOrder = [
  'soc-console-core.js', 'soc-timeline-ui.js', 'soc-m04-assessment-data.js',
  'soc-m04-assessment-state.js', 'soc-m04-assessment-console.js', 'soc-console-tools.js', 'soc-analyst-module-04.js',
  'soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m05-assessment-device-ui.js', 'soc-m05-assessment-console.js', 'soc-analyst-module-05.js',
];
for (let index = 1; index < portalScriptOrder.length; index += 1) {
  assert.ok(html.indexOf(portalScriptOrder[index - 1]) < html.indexOf(portalScriptOrder[index]),
    `${portalScriptOrder[index]} loads after ${portalScriptOrder[index - 1]}`);
}

const storage = new Map();
const saveCalls = [];
storage.set('m04-detection-enrichment-v1:soc-04:learner@example.test', local('moduleFourState'));
context.LabRuntime = {
  loadCaseState: (labId, moduleKey, user, defaults) => {
    assert.ok(['m04-detection-enrichment-v1', 'm04-guided-detection-console-v1', 'm05-endpoint-assessment-v1', 'm05-endpoint-chain-v1', 'm05-guided-endpoint-chain-v1'].includes(labId), 'M04/M05 assessment, guided and existing M05 lesson keys remain module-scoped');
    assert.strictEqual(moduleKey, labId.startsWith('m04-') ? 'soc-04' : 'soc-05');
    return storage.get(`${labId}:${moduleKey}:${user.email}`) || defaults;
  },
  saveCaseState: (labId, moduleKey, user, state) => {
    saveCalls.push({ labId, moduleKey });
    storage.set(`${labId}:${moduleKey}:${user.email}`, JSON.parse(JSON.stringify(state)));
    return state;
  },
  resetCaseState: () => ({}),
};
const assessmentRoot = {
  dataset: {},
  listeners: {},
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); },
  set innerHTML(value) { this.rendered = value; },
};
const fire = (root, type, event) => root.listeners[type].forEach((listener) => listener(event));
context.document = { getElementById: (id) => id === 'm04-assessment-lab-dynamic' ? assessmentRoot : null };
vm.runInContext('moduleFourLoad({ email: "learner@example.test" }); wireModuleFourAssessmentLab()', context);
for (const tab of consoleTabs) {
  const button = { dataset: { m03eTab: `m04:${tab}` } };
  fire(assessmentRoot, 'click', { target: { closest: (selector) => (selector === 'button,[data-m03e-select]' || selector === '#m03e-console-m04' ? button : null) } });
  assert.strictEqual(vm.runInContext("m03eState('m04').tab", context), tab);
}
assert.ok(saveCalls.length >= consoleTabs.length, 'each navigation change persists the selected tab');
assert.ok(saveCalls.every((call) => call.labId === 'm04-detection-enrichment-v1' && call.moduleKey === 'soc-04'));
assert.strictEqual(storage.has('m04-detection-enrichment-v1:soc-04:learner@example.test'), true);
assert.strictEqual(storage.has('m04-assessment:soc-04:learner@example.test'), false, 'M04 assessment state is isolated from the legacy lab key');
vm.runInContext('moduleFourLoad({ email: "learner@example.test" })', context);
assert.strictEqual(vm.runInContext("m03eState('m04').tab", context), consoleTabs.at(-1), 'selected tab survives a normalized state reload');
assert.strictEqual(vm.runInContext('moduleFourState.assessment.scenarioId', context), config.scenarioId);
assert.strictEqual(storage.get('m04-detection-enrichment-v1:soc-04:learner@example.test').assessment.scenarioId, config.scenarioId, 'saved assessment remains keyed to its immutable scenario');
assert.strictEqual(vm.runInContext('moduleFourState.independentLab.answers.signal', context), 'chain', 'legacy independent-lab state remains alongside the M04 assessment');

// Both assessment generations are loaded together in the portal. Their
// versioned state contracts must remain isolated while the M04 workbench and
// automation commands continue to render and persist normally.
const m05Fixture = vm.runInContext('SocM05AssessmentData', context);
const m05StateApi = vm.runInContext('SocM05AssessmentState', context);
assert.strictEqual(config.scenarioId, 'M04-ASSESS-2026-09-24');
assert.strictEqual(vm.runInContext('SocM04AssessmentData.scenario.caseId', context), 'DET-4424');
assert.strictEqual(m05Fixture.scenario.id, 'M05-ASSESS-2026-09-27');
assert.strictEqual(m05Fixture.scenario.caseId, 'EDR-5127');
assert.strictEqual(m05Fixture.scenario.stateKey, 'm05-endpoint-assessment-v1');
const m05User = { id: 'learner-m04-m05', email: 'learner@example.test' };
context.integrationM05User = m05User;
const m05State = m05StateApi.load(m05User, m05Fixture);
m05State.selectedDeviceIds = ['ws-assess-27'];
m05State.actionHistory = [{ id: `${m05Fixture.scenario.id}:ACTION-000001`, sequence: 1, type: 'device_review', timestamp: '2026-09-27T10:00:00Z', details: { deviceId: 'ws-assess-27', status: 'reviewed', note: 'Endpoint additions active' } }];
m05StateApi.save(m05User, m05State, m05Fixture);
const m05StorageKey = `${m05Fixture.scenario.stateKey}:soc-05:${m05User.email}`;
const m04StorageKey = 'm04-detection-enrichment-v1:soc-04:learner@example.test';
assert.strictEqual(m04StorageKey, 'm04-detection-enrichment-v1:soc-04:learner@example.test');
assert.ok(storage.has(m05StorageKey), 'M05 endpoint state persists under its own fixture key');
assert.ok(storage.has(m04StorageKey), 'M04 assessment state persists under its own versioned lab key');
assert.notStrictEqual(m05StorageKey, m04StorageKey);
assert.strictEqual(storage.get(m04StorageKey).assessment.scenarioId, config.scenarioId, 'M05 restore does not replace or reshape the M04 state');
assert.strictEqual(storage.get(m05StorageKey).selectedDeviceIds[0], 'ws-assess-27');
assert.match(vm.runInContext('SocM05AssessmentConsole.render(SocM05AssessmentState.load(integrationM05User, SocM05AssessmentData), SocM05AssessmentData, "ws-assess-27")', context), /ws-assess-27/);
assert.strictEqual(storage.has('m05-endpoint-assessment-v1:soc-05:learner@example.test'), true);

// M05 navigation must share the learner-visible Assessment Lab destination,
// while its loaded module and persisted case identity remain independent.
vm.runInContext('moduleFiveLoad({ email: "learner@example.test" })', context);
vm.runInContext('moduleFiveGuidedLoad({ email: "learner@example.test" })', context);
const m05AssessmentSections = local("moduleFiveGetSections().filter((section) => section.title === 'Assessment Lab')");
assert.strictEqual(m05AssessmentSections.length, 1, 'M05 navigation authors exactly one Assessment Lab entry');
assert.strictEqual(m05AssessmentSections[0].scrollId, 'm05-assessment-lab');
assert.strictEqual(vm.runInContext('moduleFiveState.caseRecord.scenarioId', context), m05Fixture.scenario.id);
assert.strictEqual(vm.runInContext('moduleFiveState.caseRecord.caseId', context), m05Fixture.scenario.caseId);

// Existing M04 automation remains actionable with M05 modules enabled.
const automationRoot = {
  dataset: {}, listeners: {}, innerHTML: '',
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); },
  querySelector(selector) {
    if (selector === '[data-m04-console-workspace="automation"]') return { querySelector: (child) => ({ '[data-m04-automation-ioc]': { value: 'M04-I-001' }, '[data-m04-automation-alert]': { value: '' } })[child] || null };
    return null;
  },
};
context.document.getElementById = (id) => id === 'm04-assessment-lab-dynamic' ? automationRoot : null;
vm.runInContext('wireModuleFourAssessmentLab()', context);
const beforeM04Actions = storage.get(m04StorageKey).assessment.actionHistory.length;
vm.runInContext('moduleFourState.assessment.iocs = SocM04AssessmentData.scenario.iocs; SocM04Automation.run(moduleFourState.assessment, SocM04AssessmentData, "indicator_enrichment", "M04-I-001", SocM04AssessmentData.scenario.end); moduleFourSave()', context);
const savedM04AfterAction = storage.get(m04StorageKey);
assert.strictEqual(savedM04AfterAction.assessment.automationActions.at(-1).type, 'indicator_enrichment', 'M04 enrichment action still executes and persists');
assert.strictEqual(savedM04AfterAction.assessment.actionHistory.length, beforeM04Actions + 2, 'M04 action and execution audit entries both persist');
assert.strictEqual(storage.get(m05StorageKey).actionHistory.length, 1, 'M04 action writes do not leak into M05 action history');
assert.strictEqual(storage.get(m05StorageKey).caseRecord, undefined, 'M04 assessment persistence does not add M04 state to the M05 namespace');
assert.strictEqual(storage.get(m04StorageKey).selectedDeviceIds, undefined, 'M05 endpoint selections do not leak into the M04 namespace');
const combinedRender = vm.runInContext('moduleFourAssessmentLabPanel()', context);
assert.strictEqual((combinedRender.match(/class="m03e-console"/g) || []).length, 1, 'M04 action state renders in one console');
assert.strictEqual((combinedRender.match(/class="m05-shared-console"/g) || []).length, 0, 'M05 endpoint console is not duplicated inside M04');
console.log('M04 shared assessment console integration: all checks passed');

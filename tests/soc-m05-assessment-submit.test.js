#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const records = new Map();
const catalog = [];
const progress = [];
const context = {
  LabRuntime: {
    loadCaseState(key, moduleKey, user, defaults) {
      return records.get(`${key}:${moduleKey}:${user.id}`) ?? JSON.parse(JSON.stringify(defaults));
    },
    saveCaseState(key, moduleKey, user, state) {
      records.set(`${key}:${moduleKey}:${user.id}`, JSON.parse(JSON.stringify(state)));
      return state;
    },
    resetCaseState(_key, _moduleKey, _user, defaults) { return JSON.parse(JSON.stringify(defaults)); },
  },
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
  document: { getElementById: () => null },
  registerModuleLab: () => {}, markModuleContentOpened: () => {},
  markModuleLabComplete: (...args) => progress.push(args),
  recordLabAttempt: (...args) => { catalog.push(args); return Promise.resolve(true); },
  missionNextAllLabsComplete: () => true,
  missionNextLabLaunchGroup: () => '<div data-prereqs></div>',
  wireMissionNextLabGating: () => {},
  caseRecordMissing: () => [], caseRecordDisplay: () => [], caseRecordSummary: () => '',
  caseRecordPane: (_record, opts) => `<form id="${opts.formId}"><button ${opts.submitAttr}>Submit</button></form>`,
  caseRecordSeverity: () => 'high', caseRecordDisposition: () => 'true-positive',
  createQuizAttempt: () => ({ selectedQuestions: [], answers: {} }),
  MODULE_FIVE_FLAG: 'M05-ENDPOINT-CHAIN-VALIDATED',
};
context.window = context;
vm.createContext(context);
for (const file of [
  'learn-it-decks.js', 'learn-it-cards.js', 'soc-assessment-scorer.js', 'soc-console-core.js', 'soc-timeline-ui.js',
  'soc-m05-assessment-data.js', 'soc-m05-assessment-state.js', 'soc-m05-assessment-actions.js',
  'soc-m05-assessment-rubric.js', 'soc-m05-assessment-scorer.js', 'soc-m05-assessment-device-ui.js',
  'soc-m05-assessment-console.js', 'kql-engine.js', 'soc-assessment-evolution.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-alert-queue-ui.js', 'soc-analyst-module-03-environment.js', 'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-actions.js', 'soc-m04-automation.js', 'soc-m04-intelligence-ui.js', 'soc-m04-rules-ui.js', 'soc-m04-rule-evaluator.js', 'soc-m04-assessment-console.js', 'soc-console-tools.js', 'soc-analyst-module-05.js',
]) vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
const local = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, context)));
const user = { id: 'submit-learner', email: 'submit@example.test' };
context.testUser = user;
records.set('m05-endpoint-chain-v1:soc-05:submit-learner', {
  attempts: 1, completed: true, notes: 'Prior learner work survives identity migration.',
  caseRecord: {
    caseId: 'EDR-5119', status: 'closed', severity: 'high', affectedUser: 'j.alvarez', affectedDevice: 'WS-LAB-27',
    disposition: 'true-positive', escalation: 'required', escalateTo: 'endpoint-response',
    notes: 'Legacy case rationale.', findings: { legacy: 'preserved' }, submitted: true,
    submittedAt: '2026-09-26T12:00:00Z', actionHistory: [{ action: 'Legacy submission', at: '2026-09-26T12:00:00Z' }],
  },
});
vm.runInContext('moduleFiveLoad(testUser)', context);
let migrated = local('moduleFiveState');
assert.strictEqual(migrated.caseRecord.caseId, 'EDR-5127');
assert.strictEqual(migrated.caseRecord.scenarioId, 'M05-ASSESS-2026-09-27');
assert.strictEqual(migrated.caseRecord.legacyCaseId, 'EDR-5119');
assert.strictEqual(migrated.caseRecord.notes, 'Legacy case rationale.');
assert.strictEqual(migrated.caseRecord.affectedUser, 'j.alvarez');
assert.strictEqual(migrated.caseRecord.affectedDevice, 'ws-assess-27');
assert.deepStrictEqual(migrated.caseRecord.legacyEntities, { affectedUser: 'j.alvarez', affectedDevice: 'WS-LAB-27' });
assert.deepStrictEqual(migrated.caseRecord.actionHistory, [{ action: 'Legacy submission', at: '2026-09-26T12:00:00Z' }]);
assert.strictEqual(migrated.notes, 'Prior learner work survives identity migration.');
vm.runInContext('moduleFiveLoad(testUser)', context);
assert.strictEqual(local('moduleFiveState.caseRecord.legacyCaseId'), 'EDR-5119', 'migration is idempotent');

// Entity identity migration: a ticket saved with the pre-contract EDR-5127 values
// (CORP\j.alvarez / inventory id M05-DEV-001) maps onto the canonical roster ids and
// keeps the same entity points.
const preContractUser = { id: 'pre-contract-learner', email: 'pre@example.test' };
context.preContractUser = preContractUser;
context.CASE_RECORD_NOTES_MIN = 100; // supplied by portal/case-record.js in the browser
records.set('m05-endpoint-chain-v1:soc-05:pre-contract-learner', {
  caseRecord: { caseId: 'EDR-5127', scenarioId: 'M05-ASSESS-2026-09-27', affectedUser: 'CORP\\j.alvarez', affectedDevice: 'M05-DEV-001', notes: '', findings: {}, actionHistory: [] },
});
vm.runInContext('moduleFiveLoad(preContractUser)', context);
assert.strictEqual(local('moduleFiveState.caseRecord.affectedUser'), 'j.alvarez');
assert.strictEqual(local('moduleFiveState.caseRecord.affectedDevice'), 'ws-assess-27');
assert.strictEqual(records.get('m05-endpoint-chain-v1:soc-05:pre-contract-learner').caseRecord.affectedDevice, 'ws-assess-27', 'migrated ticket is persisted');
assert.strictEqual(local('moduleFiveCaseScore().breakdown.affected_entity'), 20, 'migrated ticket keeps full entity credit');
vm.runInContext("moduleFiveState.caseRecord.affectedUser = 'CORP\\\\M.Reyes'; moduleFiveState.caseRecord.affectedDevice = 'M05-DEV-002'", context);
assert.strictEqual(local('moduleFiveCaseScore().breakdown.affected_entity'), 10, 'legacy pivot entities keep partial credit');
vm.runInContext('moduleFiveLoad(testUser)', context);

const fixture = local('SocM05AssessmentData');
const independentKey = `${fixture.scenario.stateKey}:soc-05:${user.id}`;
records.set(independentKey, vm.runInContext('SocM05AssessmentState.normalize({}, SocM05AssessmentData)', context));
vm.runInContext(`moduleFiveState.caseRecord.submitted = false; moduleFiveState.labProgress = { 'assessment-1': true, 'assessment-2': true };`, context);
let clickHandler;
const root = { innerHTML: '', dataset: {}, addEventListener(type, handler) { if (type === 'click') clickHandler = handler; }, querySelectorAll: () => [] };
context.document.getElementById = () => root;
vm.runInContext('wireModuleFiveAssessmentLab()', context);
const click = () => clickHandler({ target: { closest: (selector) => selector === '[data-m05-submit-case]' ? {} : null } });
assert.strictEqual((vm.runInContext("m03eState('m05').tab = 'case'; moduleFiveAssessmentLabPanel()", context).match(/data-m05-submit-case/g) || []).length, 1);
click();
const first = local('moduleFiveState');
assert.strictEqual(first.caseRecord.submitted, true);
assert.strictEqual(first.caseRecord.caseId, 'EDR-5127');
assert.strictEqual(first.caseRecord.scenarioId, fixture.scenario.id);
assert.strictEqual(first.caseRecord.reviewPayload.score, first.score);
assert.strictEqual(first.caseRecord.reviewPayload.revision, 1);
assert.strictEqual(first.caseRecord.reviewPayload.attemptNumber, 2, 'prior recorded learner attempt is included in attempt numbering');
assert.strictEqual(first.caseRecord.reviewPayload.entityIdentity.affectedDevice, 'ws-assess-27');
assert.strictEqual(first.caseRecord.reviewPayload.entityIdentity.affectedUser, 'j.alvarez');
assert.strictEqual(first.caseRecord.reviewPayload.entityIdentity.hostname, 'ws-assess-27');
assert.strictEqual(first.caseRecord.reviewPayload.entityIdentity.assetId, 'M05-DEV-001');
assert.ok(first.caseRecord.reviewPayload.criteria.some((criterion) => criterion.supportingEvidence && criterion.misses));
assert.strictEqual(first.assessmentAttempts.length, 1);
assert.strictEqual(catalog.length, 1);
assert.strictEqual(catalog[0][1], 'lab-endpoint-investigation');
assert.strictEqual(catalog[0][2].result.review_payload.caseId, 'EDR-5127');
assert.strictEqual(catalog[0][2].result.review_payload.scenarioId, fixture.scenario.id);
assert.strictEqual(catalog[0][2].result.case_record.reviewPayload.score, first.score);
assert.ok(progress.some((args) => args[2] === 'soc-05' && args[3] === 'lab-endpoint-investigation'));
assert.ok(first.flags.includes('M05-ENDPOINT-CHAIN-VALIDATED'));
assert.doesNotMatch(root.innerHTML, /Correlate the browser|Process ancestry:|criticalMisses|"criteria"/,
  'learner view does not expose the instructor rubric or answer breakdown');
const frozenResult = JSON.stringify(first.assessmentAttempts[0]);
click();
assert.strictEqual(catalog.length, 1, 'duplicate click is suppressed');
assert.strictEqual(JSON.stringify(local('moduleFiveState.assessmentAttempts[0]')), frozenResult);

vm.runInContext('moduleFiveLoad(testUser)', context);
assert.strictEqual(local('moduleFiveState.caseRecord.reviewPayload.scenarioId'), fixture.scenario.id,
  'instructor review payload survives independent state reload');
user.openLabRedosByModuleKey = { 'soc-05': { labKey: 'lab-endpoint-investigation', feedback: [{ item_label: 'Evidence', comment: 'Preserve the malicious hash.' }] } };
vm.runInContext('moduleFiveLoad(testUser)', context);
const redo = local('moduleFiveState');
assert.strictEqual(redo.caseRecord.submitted, false);
assert.strictEqual(redo.caseRecord.reviewPayload.score, first.caseRecord.reviewPayload.score,
  'prior review remains stored during redo');
assert.strictEqual(redo.assessmentAttempts.length, 1, 'redo does not mutate or discard prior attempt');
assert.doesNotMatch(vm.runInContext('moduleFiveAssessmentLabPanel()', context), /Correlate the browser|Process ancestry:/);
click();
const second = local('moduleFiveState');
assert.strictEqual(second.assessmentAttempts.length, 2);
assert.strictEqual(second.assessmentAttempts[0].revision, 1);
assert.strictEqual(second.assessmentAttempts[1].revision, 2);
assert.strictEqual(second.assessmentAttempts[1].attemptNumber, 3);
assert.strictEqual(catalog.length, 2);
assert.strictEqual(catalog[1][1], 'lab-endpoint-investigation');
assert.strictEqual(catalog[1][2].result.review_payload.revision, 2);
assert.strictEqual(second.caseRecord.caseId, 'EDR-5127');
assert.strictEqual(second.flags.filter((flag) => flag === 'M05-ENDPOINT-CHAIN-VALIDATED').length, 1);
assert.ok(progress.some((args) => args[2] === 'soc-05' && args[3] === 'lab-endpoint-investigation'));
Promise.resolve().then(() => console.log('M05 assessment submit, identity migration, catalog/progress, persistence, duplicate suppression, instructor payload, and redo contract checks passed.'));

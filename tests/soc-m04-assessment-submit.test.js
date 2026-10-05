#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
let persisted = {};
const writes = [];
const attempts = [];
const context = {
  LabRuntime: {
    loadCaseState: () => persisted,
    saveCaseState: (_lab, _module, _user, state) => { persisted = JSON.parse(JSON.stringify(state)); writes.push(persisted); return state; },
    resetCaseState: () => ({}),
  },
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
  registerModuleLab: () => {},
  markModuleContentOpened: () => {},
  markModuleLabComplete: (...args) => attempts.push({ progress: args }),
  missionNextAllLabsComplete: () => true,
  recordLabAttempt: (...args) => { attempts.push({ catalog: args }); return Promise.resolve(true); },
  createQuizAttempt: () => ({ selectedQuestions: [], answers: {} }),
  MODULE_FOUR_FLAG: 'm04-complete',
  MODULE_FOUR_CATALOG_LAB_KEY: 'lab-detection-rule',
  caseRecordMissing: () => [],
  caseRecordSeverity: (record) => record.severity,
  caseRecordDisposition: (record) => record.disposition,
  caseRecordPane: () => '<form id="m04-assessment"></form>',
  caseRecordDisplay: () => [],
  caseRecordSummary: () => '',
  document: { getElementById: () => null },
  window: { confirm: () => true },
  requestAnimationFrame: (fn) => fn(),
  console,
};
vm.createContext(context);
for (const filename of [
  'soc-assessment-scorer.js', 'soc-assessment-evolution.js', 'soc-console-core.js', 'soc-alert-queue-ui.js',
  'soc-m04-assessment-data.js', 'soc-m04-assessment-state.js', 'soc-m04-assessment-actions.js',
  'soc-m04-intelligence-ui.js', 'kql-engine.js', 'soc-m04-rules-ui.js', 'soc-m04-assessment-rubric.js',
  'soc-m04-assessment-scorer.js', 'soc-m04-assessment-console.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-analyst-module-03-environment.js', 'soc-console-tools.js', 'soc-analyst-module-04.js',
]) vm.runInContext(fs.readFileSync(path.join(portal, filename), 'utf8'), context, { filename });

const local = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, context)));
const setup = `
  moduleFourUser = { email: 'learner@example.test' };
  moduleFourState = SocM04AssessmentState.normalize({
    ruleRuns: 1, enrichedIndicator: 'M04-I-001', completed: false, attempts: 0, bestScore: 0, flags: [], automationLog: [], selectedEvidence: [],
    assessment: { ...SocM04AssessmentState.normalize({}, SocM04AssessmentData).assessment },
    caseRecord: { status: 'closed', severity: 'high', affectedUser: 'acct-44', affectedDevice: '198.51.100.64', disposition: 'true-positive', escalation: 'required', escalateTo: 'identity-response', notes: 'Evidence and scope reviewed for handoff.', findings: { intelAssessment: 'corroborates' }, submitted: false, submittedAt: '', actionHistory: [] }
  }, SocM04AssessmentData);
  moduleFourSave = () => SocM04AssessmentState.save(moduleFourUser, moduleFourState, SocM04AssessmentData);
  moduleFourRenderAssessment = () => {};
  SocM04AssessmentConsole.render = () => '';
  caseRecordPane = () => '<form id="m04-assessment"></form>';
`;
vm.runInContext(setup, context);
assert.strictEqual(vm.runInContext('moduleFourCaseSpec().caseId', context), 'CASE-044424', 'submitted case identity matches the immutable fixture');
assert.ok(vm.runInContext('moduleFourCaseSpec().userOptions.some((option) => option.id === "acct-44" && option.tier === "principal")', context));
assert.ok(vm.runInContext('moduleFourCaseSpec().deviceOptions.some((option) => option.id === "198.51.100.64" && option.tier === "principal")', context));
assert.strictEqual(vm.runInContext('moduleFourCaseScore().breakdown.affected_entity', context), 15,
  'the fixture-supported account and source earn full affected-entity credit');

// Existing DET-4415 drafts retain their work while their legacy selections are
// mapped to the equivalent identities in the immutable CASE-044424 fixture.
persisted = {
  ...JSON.parse(JSON.stringify(vm.runInContext('moduleFourState', context))),
  caseRecord: { caseId: 'DET-4415', status: 'closed', severity: 'high', affectedUser: 'acct-24', affectedDevice: '198.51.100.44', disposition: 'true-positive', escalation: 'required', escalateTo: 'identity-response', notes: 'Legacy analyst rationale remains preserved.', findings: { intelAssessment: 'corroborates' }, submitted: true, submittedAt: '2026-09-25T10:00:00Z', score: 76, reviewPayload: { score: 76, criteria: [{ id: 'legacy' }] }, actionHistory: [{ action: 'Saved case' }] },
};
vm.runInContext('moduleFourLoad(moduleFourUser)', context);
const migratedCase = local('moduleFourState.caseRecord');
assert.strictEqual(migratedCase.caseId, 'CASE-044424');
assert.strictEqual(migratedCase.scenarioId, local('SocM04AssessmentData.scenario.id'));
assert.strictEqual(migratedCase.legacyCaseId, 'DET-4415');
assert.strictEqual(migratedCase.affectedUser, 'acct-44');
assert.strictEqual(migratedCase.affectedDevice, '198.51.100.64');
assert.strictEqual(migratedCase.notes, 'Legacy analyst rationale remains preserved.');
assert.strictEqual(migratedCase.submittedAt, '2026-09-25T10:00:00Z');
assert.deepStrictEqual(migratedCase.reviewPayload, { score: 76, criteria: [{ id: 'legacy' }] });
assert.deepStrictEqual(migratedCase.actionHistory, [{ action: 'Saved case' }]);
vm.runInContext(`moduleFourState = SocM04AssessmentState.normalize({
  ruleRuns: 1, enrichedIndicator: 'M04-I-001', completed: false, attempts: 0, bestScore: 0, flags: [], automationLog: [], selectedEvidence: [],
  assessment: SocM04AssessmentState.normalize({}, SocM04AssessmentData).assessment,
  caseRecord: { status: 'closed', severity: 'high', affectedUser: 'acct-44', affectedDevice: '198.51.100.64', disposition: 'true-positive', escalation: 'required', escalateTo: 'identity-response', notes: 'Evidence and scope reviewed for handoff.', findings: { intelAssessment: 'corroborates' }, submitted: false, submittedAt: '', actionHistory: [] }
}, SocM04AssessmentData)`, context);

// Exploration and review activity is not itself a scoring penalty.
const correctBaselineScore = vm.runInContext('SocM04AssessmentScorer.score(moduleFourState, SocM04AssessmentData).score', context);
vm.runInContext(`moduleFourState.assessment.actionHistory.push(
  { type: 'query_test', details: { succeeded: false, query: 'AuthLog | take 5' } },
  { type: 'saved_query', details: { queryId: 'exploration-query' } },
  { type: 'alert_review', details: { alertId: 'exploration-alert', status: 'under_review' } }
)`, context);
assert.strictEqual(vm.runInContext('SocM04AssessmentScorer.score(moduleFourState, SocM04AssessmentData).score', context), correctBaselineScore,
  'exploration-only activity does not reduce an otherwise correct assessment score');

const beforeSubmit = vm.runInContext('moduleFourArtifact()', context);
assert.doesNotMatch(beforeSubmit, /data-m04-submitted-review|Assessment review|Intelligence corroboration/,
  'criterion-level review is absent before case submit');
assert.doesNotMatch(beforeSubmit, /confirmedCompromisedAccounts|successfulAuthenticationEventIds|matchEventIds|excludeEventIds|maliciousSourceIp|targetedAccounts/,
  'pre-submit assessment artifact does not render fixture answer-key fields');
const privatePayloadHtml = vm.runInContext(`moduleFourState.caseRecord.reviewPayload = { score: 100, criteria: [{ label: 'Intelligence corroboration' }] }; moduleFourState.caseRecord.submitted = false; moduleFourArtifact()`, context);
assert.doesNotMatch(privatePayloadHtml, /data-m04-submitted-review|Intelligence corroboration/,
  'a persisted score payload remains hidden until submitted');

let clickHandler;
// Bind the event delegation against a tiny root, then dispatch the submit command.
context.root = { dataset: {}, addEventListener: (type, handler) => { if (type === 'click') clickHandler = handler; } };
vm.runInContext(`document.getElementById = () => root; wireModuleFourAssessmentLab()`, context);
const submitButton = {};
const clickEvent = { target: { closest: (selector) => selector === '[data-m04-submit-case]' ? submitButton : null } };
clickHandler(clickEvent);
const first = local('moduleFourState');
assert.strictEqual(first.caseRecord.submitted, true);
assert.strictEqual(first.caseRecord.caseId, 'CASE-044424');
assert.strictEqual(first.caseRecord.scenarioId, local('SocM04AssessmentData.scenario.id'));
assert.strictEqual(first.caseRecord.score, first.caseRecord.reviewPayload.score);
assert.strictEqual(first.caseRecord.reviewPayload.caseId, 'CASE-044424');
assert.strictEqual(first.caseRecord.reviewPayload.scenarioId, local('SocM04AssessmentData.scenario.id'));
assert.strictEqual(first.score, first.caseRecord.reviewPayload.score);
assert.ok(first.caseRecord.reviewPayload.criteria.length > 0);
assert.ok(writes.length > 0, 'submitted score and review payload are persisted to M04 case state');
// Assessment Labs show only the standard faculty-review state: no student score or debrief.
const submittedArtifact = vm.runInContext('moduleFourArtifact()', context);
assert.doesNotMatch(submittedArtifact, /data-m04-submitted-review/, 'no student-facing score/debrief after submission');
assert.strictEqual(vm.runInContext('moduleFourProveItReviewStatus()', context), 'review',
  'submission shows the standard faculty-review state');
assert.ok(attempts.some((entry) => entry.catalog?.[2]?.result?.review_payload?.score === first.score),
  'catalog attempt includes instructor-readable review payload');
assert.ok(attempts.some((entry) => entry.catalog?.[2]?.result?.review_payload?.caseId === 'CASE-044424'
  && entry.catalog?.[2]?.result?.review_payload?.scenarioId === first.caseRecord.scenarioId),
  'catalog review payload identifies the fixture-matched submitted case');
const firstCatalogAttempt = attempts.find((entry) => entry.catalog)?.catalog;
assert.strictEqual(firstCatalogAttempt[1], 'lab-detection-rule', 'submission preserves the established catalog lab key');
assert.strictEqual(firstCatalogAttempt[2].state, 'complete');
assert.strictEqual(firstCatalogAttempt[2].result.case_record.caseId, 'CASE-044424');
assert.strictEqual(firstCatalogAttempt[2].result.case_record.scenarioId, first.caseRecord.scenarioId,
  'instructor attempt case record carries the fixture case and scenario identity');
assert.strictEqual(firstCatalogAttempt[2].result.review_payload.caseId, 'CASE-044424');
assert.strictEqual(firstCatalogAttempt[2].result.review_payload.scenarioId, first.caseRecord.scenarioId);
assert.ok(attempts.some((entry) => entry.progress?.[2] === 'soc-04'
  && entry.progress?.[3] === 'lab-detection-rule'), 'submission marks progress under the existing module and catalog key');
assert.ok(first.flags.includes('M04-DETECTION-ENGINEERED'), 'submission preserves the established Module 04 progress flag');
assert.strictEqual(local('moduleFourProveItReviewStatus()'), 'review', 'a new attempt awaits instructor review');
const stateAfterFirstSubmit = JSON.stringify(first);
const catalogAttemptsAfterFirstSubmit = attempts.filter((entry) => entry.catalog).length;
clickHandler(clickEvent);
assert.strictEqual(JSON.stringify(local('moduleFourState')), stateAfterFirstSubmit,
  'a duplicate submit cannot alter the immutable submitted result');
assert.strictEqual(attempts.filter((entry) => entry.catalog).length, catalogAttemptsAfterFirstSubmit,
  'a duplicate submit does not create another catalog attempt');

persisted = JSON.parse(JSON.stringify(first));
vm.runInContext(`moduleFourState = SocM04AssessmentState.load(moduleFourUser, MODULE_FOUR_DEFAULT_STATE, SocM04AssessmentData)`, context);
assert.deepStrictEqual(local('moduleFourState.caseRecord.reviewPayload'), first.caseRecord.reviewPayload,
  'submitted feedback payload survives state restoration');
assert.strictEqual(vm.runInContext('SocM04AssessmentScorer.score(moduleFourState, SocM04AssessmentData).score', context), first.score,
  'restored learner state recomputes to the submitted score');

vm.runInContext(`moduleFourUser.latestLabAttemptByKey['lab-detection-rule'] = { completedAt: '2026-09-26T12:00:00Z', reviewedAt: '2026-09-26T12:30:00Z', redoRequested: true };
  moduleFourUser.openLabRedosByModuleKey = { 'soc-04': { labKey: 'lab-detection-rule', feedback: [{ item_label: 'Evidence', comment: 'Cite the correlated successful sign-in.' }] } };
  moduleFourLoad(moduleFourUser)`, context);
const redoState = local('moduleFourState');
assert.strictEqual(redoState.caseRecord.submitted, false, 'an established redo reopens only the working submission latch');
assert.strictEqual(redoState.caseRecord.reviewPayload.score, first.caseRecord.reviewPayload.score,
  'the prior result remains available until a redo is submitted');
assert.doesNotMatch(vm.runInContext('moduleFourArtifact()', context), /data-m04-submitted-review/,
  'old criterion feedback is hidden while the redo is in progress');
assert.strictEqual(local('moduleFourProveItReviewStatus()'), '', 'returned work is no longer displayed as awaiting review');
assert.match(vm.runInContext('moduleFourProveItRedoFeedback()', context), /Cite the correlated successful sign-in/,
  'instructor-returned feedback is available during the redo');
const priorAttemptCount = attempts.filter((entry) => entry.catalog).length;
clickHandler(clickEvent);
assert.strictEqual(attempts.filter((entry) => entry.catalog).length, priorAttemptCount + 1,
  'a corrected redo appends exactly one new instructor attempt');
assert.strictEqual(attempts.filter((entry) => entry.catalog).at(-1).catalog[1], 'lab-detection-rule');
Promise.resolve().then(() => {
  assert.strictEqual(local("Boolean(moduleFourUser.openLabRedosByModuleKey?.['soc-04'])"), false,
    'a successfully recorded redo closes the returned-redo lifecycle');
  assert.strictEqual(local('moduleFourState.caseRecord.submitted'), true);
  assert.strictEqual(local('moduleFourState.caseRecord.reviewPayload.caseId'), 'CASE-044424');
  assert.strictEqual(local('moduleFourState.caseRecord.reviewPayload.scenarioId'), local('SocM04AssessmentData.scenario.id'));
  console.log('M04 assessment submit integration, persistence, catalog/progress contract, visibility, immutability, and redo lifecycle checks passed.');
});

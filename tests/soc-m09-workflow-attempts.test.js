#!/usr/bin/env node
// Capstone skill backfill, gaps B and C: the shared response-workflow designer
// and recorded (penalised) unsafe response attempts in Module 09.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const portal = path.join(__dirname, '..', 'portal');
class FakeFormData {
  constructor(form) { this.fields = form.fields; }
  get(name) { const value = this.fields[name]; return Array.isArray(value) ? value[0] ?? null : value ?? null; }
  getAll(name) { const value = this.fields[name]; return value === undefined ? [] : Array.isArray(value) ? value : [value]; }
}
const context = vm.createContext({ console, FormData: FakeFormData });
for (const file of ['soc-assessment-scorer.js', 'soc-m09-assessment-data.js', 'soc-m09-assessment-state.js',
  'soc-m09-assessment-rubric.js', 'soc-m09-assessment-scorer.js', 'soc-console-tools.js']) {
  vm.runInContext(fs.readFileSync(path.join(portal, file), 'utf8'), context, { filename: file });
}
const { api, fixture, rubric, scorer, tools } = vm.runInContext(
  '({ api: SocM09AssessmentState, fixture: SocM09AssessmentData, rubric: SocM09AssessmentRubric, scorer: SocM09AssessmentScorer, tools: SocConsoleTools })', context);
const plain = (value) => JSON.parse(JSON.stringify(value));
const incident = 'INC-4937';

let clock = Date.parse('2026-09-27T10:03:00.000Z');
const at = () => { clock += 5000; return new Date(clock).toISOString(); };
const resetClock = () => { clock = Date.parse('2026-09-27T10:03:00.000Z'); };
const outcome = (type, entityId) => fixture.scenario.actionOutcomeExamples.find((item) => item.action === type && item.entityId === entityId)?.outcome || 'success';
const design = (state, name, nodes, pairs) => api.saveWorkflowDesign(state, incident, { name, nodes, edges: pairs.map((pair) => { const [from, to] = pair.split('>'); return { from, to }; }) }, at(), fixture);
const approve = (state, type, target) => {
  let next = api.updateIncidentWorkflow(state, incident, { approvalStatus: 'pending', approvalReason: 'Scoped request.', approvalTargetId: target, approvalActionType: type }, at(), fixture);
  return api.updateIncidentWorkflow(next, incident, { approvalStatus: 'approved', approvalActorId: 'ir-lead-1', approvalReason: 'Approved.' }, at(), fixture);
};
const attempt = (state, type, targetId) => api.attemptResponseAction(state, incident, { type, targetId, outcome: outcome(type, targetId) }, at(), fixture);
const criterion = (result, id) => result.criteria.find((item) => item.id === id);

/* ------------------------------------------------------------ shared control */

assert.equal(tools.WORKFLOW_EDGE_EXAMPLE, 'scan>monitor');
const markup = tools.workflowDesignerMarkup({ nodes: ['preserve', 'approval'], formAttrs: 'data-test-form' });
assert.match(markup, /Connections \(one from&gt;to pair per line\)/);
assert.match(markup, /One connection per line, e\.g\. <code>scan&gt;monitor<\/code>/, 'the connections box carries an inline example');
assert.match(markup, /<form data-test-form>/);
assert.match(markup, /value="preserve"[^>]*> preserve · Preserve evidence/);
assert.deepEqual(plain(tools.parseWorkflowEdges('preserve>approval\n approval -> isolate, Isolate>scan')),
  [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }, { from: 'isolate', to: 'scan' }]);
assert.throws(() => tools.parseWorkflowEdges('preserve approval'), /needs a from>to pair, for example scan>monitor/);
assert.throws(() => tools.parseWorkflowEdges('a>b>c'), /from>to pair/);

// M09 pack renders the same control when asked; M12-style embeds do not duplicate it.
const box = { state: api.normalize({}, fixture) };
const ctx = { fixture, scope: 'm09', evidence: [], routes: [], load: () => box.state, store: (next) => { box.state = next; }, rerender() {}, save() {}, console: () => ({}) };
const view = (extra = {}) => tools.PACKS.m09.views({ ...ctx, ...extra }).response();
assert.doesNotMatch(view(), /data-m09-workflow-designer|data-m09-attempt/, 'packs embedded without the flags render as before');
const prove = view({ workflowDesigner: true, attemptForm: true });
assert.match(prove, /data-m09-workflow-design>/);
assert.match(prove, /data-m09-attempt-form/);
assert.doesNotMatch(prove, /data-workflow-coach|data-attempt-coach|Hint \d/, 'Prove It shows no coaching');
assert.doesNotMatch(prove, /capped at 69/, 'Prove It does not explain the capstone cap');
const m12Style = tools.workflowDesignerMarkup({ nodes: [...api.WORKFLOW_NODES], formAttrs: 'data-m12-context="workflow"' });
const innerForm = (html) => html.match(/<fieldset>[\s\S]*?<button type="submit">Save workflow design<\/button>/)[0];
assert.equal(innerForm(prove), innerForm(m12Style), 'M09 and M12 render the identical field set');

/* ----------------------------------------------------------------- state API */

resetClock();
let state = api.normalize({}, fixture);
assert.throws(() => api.saveWorkflowDesign(state, incident, { name: '', nodes: ['preserve', 'approval'], edges: [] }, at(), fixture), /Name the workflow/);
assert.throws(() => api.saveWorkflowDesign(state, incident, { name: 'x', nodes: ['preserve'], edges: [] }, at(), fixture), /at least two/);
assert.throws(() => api.saveWorkflowDesign(state, incident, { name: 'x', nodes: ['preserve', 'launch'], edges: [] }, at(), fixture), /from the list/);
assert.throws(() => api.saveWorkflowDesign(state, incident, { name: 'x', nodes: ['preserve', 'approval'], edges: [{ from: 'preserve', to: 'isolate' }] }, at(), fixture), /both ends must be nodes you selected/);
assert.throws(() => api.saveWorkflowDesign(state, incident, { name: 'x', nodes: ['preserve', 'approval'], edges: [{ from: 'approval', to: 'approval' }] }, at(), fixture), /itself/);
assert.throws(() => api.saveWorkflowDesign(state, 'INC-OTHER', { name: 'x', nodes: ['preserve', 'approval'], edges: [] }, at(), fixture), /incident is invalid/);
state = design(state, 'Order of response', ['preserve', 'approval', 'isolate'], ['preserve>approval', 'preserve>approval', 'approval>isolate']);
assert.equal(state.workflowDesigns.length, 1);
assert.deepEqual(plain(state.workflowDesigns[0].edges), [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }], 'duplicate connections collapse');
assert.ok(Object.isFrozen(state.workflowDesigns[0]));

// Unsafe attempts: every refusal is recorded with its reason.
resetClock();
let attempts = api.normalize({}, fixture);
attempts = attempt(attempts, 'isolate_endpoint', 'ws-173');
attempts = attempt(attempts, 'isolate_device', 'DEV-UNKNOWN-173');
attempts = attempt(attempts, 'isolate_endpoint', 'acct-173');
assert.deepEqual(plain(attempts.unsafeAttempts.map((item) => [item.actionType, item.targetId, item.reason, item.outcome])), [
  ['isolate_endpoint', 'ws-173', 'no_approval', 'blocked'],
  ['isolate_device', 'DEV-UNKNOWN-173', 'out_of_scope', 'blocked'],
  ['isolate_endpoint', 'acct-173', 'wrong_target_type', 'blocked'],
]);
assert.equal(attempts.actionHistory.length, 0, 'a blocked attempt changes nothing on the system');
assert.deepEqual(plain(attempts.entityStates['ws-173']), {});
// Approval for a different action or target does not cover the attempt.
const approvedRevoke = approve(attempts, 'revoke_session', 'session-173-REMOTE');
assert.equal(attempt(approvedRevoke, 'isolate_endpoint', 'ws-173').unsafeAttempts.length, 4, 'approval is per action and target');
// A matching approval runs the action and leaves no unsafe attempt behind.
const ran = attempt(approvedRevoke, 'revoke_session', 'session-173-REMOTE');
assert.equal(ran.unsafeAttempts.length, 3);
assert.equal(ran.actionHistory.at(-1).type, 'revoke_session');
assert.equal(ran.actionHistory.at(-1).details.approval.targetId, 'session-173-REMOTE');
assert.throws(() => api.attemptResponseAction(attempts, incident, { type: 'format_disk', targetId: 'ws-173' }, at(), fixture), /Choose a response action/);
assert.throws(() => api.attemptResponseAction(attempts, incident, { type: 'isolate_endpoint', targetId: 'nope' }, at(), fixture), /Choose a response action/);

// Hostile saved data is rejected by normalize.
const corrupt = (change) => () => api.normalize({ ...plain(attempts), ...change }, fixture);
assert.throws(corrupt({ unsafeAttempts: [{ ...plain(attempts.unsafeAttempts[0]), reason: 'because' }] }), /response attempt is invalid/);
assert.throws(corrupt({ unsafeAttempts: [{ ...plain(attempts.unsafeAttempts[0]), id: 'forged' }] }), /response attempt is invalid/);
assert.throws(corrupt({ unsafeAttempts: [{ ...plain(attempts.unsafeAttempts[0]), extra: 1 }] }), /response attempt is invalid/);
assert.throws(corrupt({ unsafeAttempts: 'x' }), /response attempts are invalid/);
assert.throws(() => api.normalize({ ...plain(state), workflowDesigns: [{ ...plain(state.workflowDesigns[0]), nodes: ['preserve', 'launch'] }] }, fixture), /workflow design is invalid/);
assert.throws(() => api.normalize({ ...plain(state), workflowDesigns: [{ ...plain(state.workflowDesigns[0]), edges: [{ from: 'preserve', to: 'monitor' }] }] }, fixture), /workflow design is invalid/);

/* ------------------------------------------- jsonb key reorder round trip */

// Postgres jsonb stores object keys in its own order; saved state must still load.
const reorder = (value) => Array.isArray(value) ? value.map(reorder)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).reverse().map((key) => [key, reorder(value[key])])) : value;
resetClock();
let saved = design(api.normalize({}, fixture), 'Order of response', ['preserve', 'approval', 'isolate', 'scan'], ['preserve>approval', 'approval>isolate', 'isolate>scan']);
saved = attempt(saved, 'isolate_endpoint', 'ws-173');
saved = attempt(saved, 'isolate_device', 'DEV-UNKNOWN-173');
const shuffled = reorder(plain(saved));
assert.notEqual(JSON.stringify(shuffled), JSON.stringify(plain(saved)), 'the shuffled copy really has different key order');
const roundTripped = api.normalize(shuffled, fixture);
const sortKeys = (value) => Array.isArray(value) ? value.map(sortKeys)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])])) : value;
assert.deepEqual(sortKeys(plain(roundTripped)), sortKeys(plain(saved)), 'new fields survive normalize() after a key reorder');
assert.equal(roundTripped.workflowDesigns.length, 1);
assert.equal(roundTripped.unsafeAttempts.length, 2);
assert.deepEqual(plain(scorer.score(roundTripped, fixture).criteria), plain(scorer.score(saved, fixture).criteria), 'reordered state scores identically');

/* -------------------------------------------------------- scoring scenarios */

const withWork = (setup) => { resetClock(); return setup(api.normalize({}, fixture)); };
const response = (state) => { // a complete, approved, in-scope containment so conduct credit is available
  state = approve(state, 'isolate_endpoint', 'ws-173');
  return api.executeApprovedAction(state, incident, { type: 'isolate_endpoint', outcome: outcome('isolate_endpoint', 'ws-173'), details: { entityId: 'ws-173', incidentId: incident } }, at(), fixture);
};
const workflowPoints = (state) => criterion(scorer.score(state, fixture), 'response-workflow-design').points;
const conductPoints = (state) => criterion(scorer.score(state, fixture), 'safe-response-conduct').points;

// Perfect design.
const perfect = withWork((s) => design(s, 'Safe order', ['preserve', 'approval', 'isolate', 'revoke-session', 'scan', 'monitor'],
  ['preserve>approval', 'approval>isolate', 'approval>revoke-session', 'isolate>scan', 'scan>monitor']));
assert.equal(workflowPoints(perfect), 10);
assert.equal(criterion(rubric.extract(perfect, fixture), 'response-workflow-design').finding, 'observed');

// Partial credit: evidence before approval, but containment is not placed behind approval.
const partialDesign = withWork((s) => design(s, 'Half plan', ['preserve', 'approval', 'isolate', 'scan'], ['preserve>approval', 'isolate>scan']));
assert.equal(workflowPoints(partialDesign), 4 + 0 + 0, 'evidence-before-approval credit only; isolate is ungated and scan is not behind a gated step');
// Partial credit for a secondary finding: approval gates one of two disruptive steps.
const halfGated = withWork((s) => design(s, 'Half gated', ['preserve', 'approval', 'isolate', 'revoke-session'], ['preserve>approval', 'approval>isolate']));
assert.equal(workflowPoints(halfGated), 4 + 2);
// Approval gate without preserving evidence still earns the gating credit.
const noEvidence = withWork((s) => design(s, 'Gate only', ['approval', 'isolate', 'monitor'], ['approval>isolate', 'isolate>monitor']));
assert.equal(workflowPoints(noEvidence), 4 + 2);
assert.equal(criterion(rubric.extract(noEvidence, fixture), 'response-workflow-design').finding, 'partial');
const nothingUseful = withWork((s) => design(s, 'No order', ['preserve', 'scan'], []));
assert.equal(workflowPoints(nothingUseful), 0);
assert.equal(criterion(rubric.extract(nothingUseful, fixture), 'response-workflow-design').finding, 'incomplete');
assert.equal(workflowPoints(api.normalize({}, fixture)), 0);
assert.equal(criterion(rubric.extract(api.normalize({}, fixture), fixture), 'response-workflow-design').finding, 'unknown');

// Different valid paths earn equivalent credit (reachability, not one click sequence).
const pathA = withWork((s) => design(s, 'Path A', ['preserve', 'approval', 'isolate', 'scan', 'monitor'], ['preserve>approval', 'approval>isolate', 'isolate>scan', 'scan>monitor']));
const pathB = withWork((s) => design(s, 'Path B', ['preserve', 'approval', 'remove-persistence', 'restore', 'scan', 'monitor'], ['preserve>approval', 'approval>remove-persistence', 'remove-persistence>restore', 'restore>scan', 'scan>monitor']));
const pathC = withWork((s) => design(s, 'Path C', ['monitor', 'approval', 'block-indicator', 'preserve'], ['preserve>approval', 'approval>block-indicator', 'block-indicator>monitor']));
assert.deepEqual([workflowPoints(pathA), workflowPoints(pathB), workflowPoints(pathC)], [10, 10, 10]);

// Excessive exploration: many extra or poor designs never lower the best one.
const exploratory = withWork((s) => {
  s = design(s, 'Draft 1', ['preserve', 'scan'], []);
  s = design(s, 'Draft 2', ['isolate', 'monitor'], ['isolate>monitor']);
  s = design(s, 'Draft 3', ['preserve', 'approval', 'isolate', 'scan'], ['preserve>approval', 'approval>isolate', 'isolate>scan']);
  return design(s, 'Draft 4', ['restore', 'scan'], ['restore>scan']);
});
assert.equal(workflowPoints(exploratory), 10, 'the best saved design counts; exploration is free');

// Explicit unsupported conclusion: a disruptive step feeding back into evidence/approval costs points.
const unsupported = withWork((s) => design(s, 'Backwards', ['preserve', 'approval', 'isolate', 'scan'], ['preserve>approval', 'approval>isolate', 'isolate>scan', 'isolate>preserve']));
assert.equal(workflowPoints(unsupported), 10 - 2);
const unsupportedRows = criterion(scorer.score(unsupported, fixture), 'response-workflow-design');
assert.match(unsupportedRows.deductions[0].reason, /isolate>preserve/);
assert.equal(criterion(rubric.extract(unsupported, fixture), 'response-workflow-design').finding, 'partial');
const reversed = withWork((s) => design(s, 'Reversed', ['preserve', 'approval', 'isolate'], ['isolate>approval', 'approval>preserve']));
assert.equal(workflowPoints(reversed), 0, 'reversing the order earns nothing and the floor is zero');

// Unsafe attempts: a competency deduction, never a whole-score cap.
const conduct = (count) => withWork((s) => {
  s = response(s);
  for (let i = 0; i < count; i += 1) s = attempt(s, 'revoke_session', 'session-173-REMOTE');
  return s;
});
assert.deepEqual([0, 1, 2, 3, 4, 6].map((count) => conductPoints(conduct(count))), [10, 7, 4, 1, 0, 0]);
const oneSlip = conduct(1);
const slipScore = scorer.score(oneSlip, fixture);
assert.equal(slipScore.review.cap, null, 'no whole-score cap');
assert.equal(criterion(slipScore, 'safe-response-conduct').misses.length, 1);
assert.match(criterion(slipScore, 'safe-response-conduct').deductions[0].reason, /revoke_session on session-173-REMOTE was blocked because no matching approval was recorded/);
assert.equal(slipScore.score, scorer.score(conduct(0), fixture).score - scorer.UNSAFE_PENALTY, 'exactly one deduction applied');
// Attempts alone, with no approved action, earn nothing (and cannot go negative).
const onlySlips = withWork((s) => attempt(attempt(s, 'isolate_endpoint', 'ws-173'), 'isolate_device', 'DEV-UNKNOWN-173'));
assert.equal(conductPoints(onlySlips), 0);
assert.equal(scorer.score(onlySlips, fixture).score, 0);
assert.equal(conductPoints(api.normalize({}, fixture)), 0, 'doing nothing earns no safe-conduct credit');
// Out-of-scope attempts count the same as unapproved ones.
const strayed = withWork((s) => attempt(response(s), 'isolate_device', 'DEV-UNKNOWN-173'));
assert.equal(conductPoints(strayed), 7);

// A strong technical response with a poor design keeps its technical credit.
const technicalOnly = conduct(0);
const technical = scorer.score(technicalOnly, fixture);
assert.equal(criterion(technical, 'approval-and-containment').points, 12);
assert.equal(criterion(technical, 'response-workflow-design').points, 0);
// A polished design cannot substitute for doing the work.
const designOnly = scorer.score(perfect, fixture);
assert.equal(criterion(designOnly, 'approval-and-containment').points, 0);
assert.equal(designOnly.score, 10);

/* --------------------------------------------- backward compatibility */

// An attempt saved before this change has none of the new fields and still loads.
const legacy = plain(api.normalize({}, fixture));
delete legacy.workflowDesigns;
delete legacy.unsafeAttempts;
const loaded = api.normalize(legacy, fixture);
assert.deepEqual(plain(loaded.workflowDesigns), []);
assert.deepEqual(plain(loaded.unsafeAttempts), []);
// Scores are stored with the submission; the old rubric is still reproducible from state.
const v2 = scorer.score(conduct(0), fixture, { rubricVersion: 2 });
assert.equal(v2.rubricVersion, 2);
assert.equal(v2.maxScore, 100);
assert.equal(v2.criteria.length, 9);
assert.equal(v2.responseReview, undefined);
assert.equal(scorer.score(onlySlips, fixture, { rubricVersion: 2 }).score, 0, 'rubric v2 ignores unsafe attempts');
const v3 = scorer.score(conduct(0), fixture);
assert.equal(v3.rubricVersion, 3);
assert.equal(v3.maxScore, 100);
assert.equal(v3.criteria.length, 11);
assert.equal(scorer.CRITERIA.reduce((sum, item) => sum + item.weight, 0), 100);
assert.equal(scorer.CRITERIA_V2.reduce((sum, item) => sum + item.weight, 0), 100);
assert.equal(scorer.PASSING_SCORE, 70, 'passing bar unchanged');
const stored = fs.readFileSync(path.join(portal, 'soc-analyst-module-09.js'), 'utf8');
assert.match(stored, /reviewPayload = \{ \.\.\.JSON\.parse\(JSON\.stringify\(scored\)\)/, 'the score is computed once at submit and stored, not recomputed on load');

/* ------------------------------------------------------ instructor review */

const reviewState = withWork((s) => {
  s = design(s, 'Preserve, approve, isolate', ['preserve', 'approval', 'isolate'], ['preserve>approval', 'approval>isolate']);
  s = attempt(s, 'isolate_endpoint', 'ws-173');
  return attempt(s, 'isolate_device', 'DEV-UNKNOWN-173');
});
const reviewScore = scorer.score(reviewState, fixture);
const payload = { ...plain(reviewScore), caseId: incident };
assert.deepEqual(payload.responseReview.workflowDesigns.map((item) => [item.name, item.nodes, item.connections]),
  [['Preserve, approve, isolate', ['preserve', 'approval', 'isolate'], ['preserve>approval', 'approval>isolate']]]);
assert.deepEqual(payload.responseReview.unsafeAttempts.map((item) => [item.actionType, item.targetId, item.reasonText]), [
  ['isolate_endpoint', 'ws-173', 'no matching approval was recorded'],
  ['isolate_device', 'DEV-UNKNOWN-173', 'the target is outside the incident scope'],
]);
const appSource = fs.readFileSync(path.join(portal, 'app.js'), 'utf8');
const panelSource = appSource.match(/function adminResponseDesignReviewPanel\(row\) \{[\s\S]*?\n\}\n/)[0];
const renderPanel = vm.runInNewContext(`${panelSource}; adminResponseDesignReviewPanel`, {
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
});
const html = renderPanel({ result: { review_payload: payload } });
assert.match(html, /Response workflow design/);
assert.match(html, /Preserve, approve, isolate/);
assert.match(html, /<code[^>]*>preserve&gt;approval<\/code>/);
assert.match(html, /Unsafe response attempts \(2\)/);
assert.match(html, /isolate endpoint<\/strong> on ws-173 was blocked: no matching approval was recorded/);
assert.match(html, /isolate device<\/strong> on DEV-UNKNOWN-173 was blocked: the target is outside the incident scope/);
assert.match(html, /does not cap the whole score/);
assert.equal(renderPanel({ result: { review_payload: { ...payload, responseReview: undefined } } }), '', 'pre-v3 submissions render no extra panel');
assert.equal(renderPanel({ result: {} }), '');
const empty = renderPanel({ result: { review_payload: plain(scorer.score(api.normalize({}, fixture), fixture)) } });
assert.match(empty, /No response workflow was designed/);
assert.match(empty, /No blocked or unapproved response attempts were recorded/);
assert.ok(criterion(reviewScore, 'safe-response-conduct').deductions.length === 2, 'the competency breakdown lists each deduction');
assert.ok(reviewScore.review.deductions.every((item) => item.criterionId === 'safe-response-conduct'));

/* ---------------------------------------- UI wiring (fake DOM, real pack) */

const handlers = {};
const root = { addEventListener(type, fn) { handlers[type] = fn; }, querySelectorAll() { return []; } };
resetClock();
box.state = api.normalize({}, fixture);
tools.PACKS.m09.wire(root, { ...ctx, workflowDesigner: true, attemptForm: true });
const submit = (attrs, fields) => {
  const alert = { textContent: '' };
  const form = { fields, matches: (selector) => selector.split(',').some((part) => attrs.includes(part.trim().slice(1, -1))), querySelector: () => alert, dataset: {} };
  handlers.submit({ target: form, submitter: null, preventDefault() {} });
  return alert;
};
const badAlert = submit(['data-m09-workflow-design'], { name: 'Plan', nodes: ['preserve', 'approval'], edges: 'preserve approval' });
assert.match(badAlert.textContent, /needs a from>to pair, for example scan>monitor/, 'syntax errors show the example next to the box');
assert.equal(box.state.workflowDesigns.length, 0);
const okAlert = submit(['data-m09-workflow-design'], { name: 'Plan', nodes: ['preserve', 'approval', 'isolate'], edges: 'preserve>approval\napproval->isolate' });
assert.equal(okAlert.textContent, '');
assert.deepEqual(plain(box.state.workflowDesigns[0].edges), [{ from: 'preserve', to: 'approval' }, { from: 'approval', to: 'isolate' }]);
submit(['data-m09-attempt-form'], { actionType: 'isolate_endpoint', targetId: 'ws-173' });
assert.equal(box.state.unsafeAttempts.length, 1, 'the form records the blocked attempt');
assert.equal(box.state.unsafeAttempts[0].reason, 'no_approval');
assert.match(view({ workflowDesigner: true, attemptForm: true }), /Isolate endpoint<\/strong> → ws-173 · <b>blocked<\/b> · no matching approval recorded/);
assert.ok(Date.parse(box.state.unsafeAttempts[0].timestamp) > Date.parse(box.state.workflowDesigns[0].timestamp), 'the lab clock advances past saved designs');

/* ---------------------------------------------------- Practice It coaching */

resetClock();
box.state = api.normalize({}, fixture);
const practice = () => view({ workflowDesigner: true, attemptForm: true, practice: true });
assert.match(practice(), /Plan the order before you act/);
assert.match(practice(), /Try isolating a device before any approval is recorded/);
box.state = design(box.state, 'Rushed', ['isolate', 'preserve', 'approval'], ['isolate>preserve']);
let coached = practice();
assert.match(coached, /Not yet · Evidence is preserved before approval is requested/);
assert.match(coached, /Hint 1:/);
assert.doesNotMatch(coached, /Hint 2:/, 'hints open progressively');
box.state = design(box.state, 'Second try', ['preserve', 'approval', 'isolate'], ['preserve>approval']);
coached = practice();
assert.match(coached, /Done · Evidence is preserved before approval/);
assert.match(coached, /Not yet · Every disruptive step/);
assert.match(coached, /Hint 2:/);
box.state = design(box.state, 'Third try', ['preserve', 'isolate'], []);
assert.match(practice(), /Hint 3:/);
box.state = design(box.state, 'Safe order', ['preserve', 'approval', 'isolate', 'scan'], ['preserve>approval', 'approval>isolate', 'isolate>scan']);
coached = practice();
assert.match(coached, /This design orders the response safely/);
assert.doesNotMatch(coached, /Hint \d/);
assert.match(coached, /Done · A scan or monitor step checks the result/);
box.state = attempt(box.state, 'isolate_endpoint', 'ws-173');
const attemptCoach = practice();
assert.match(attemptCoach, /Blocked and logged\./);
assert.match(attemptCoach, /Isolate endpoint on ws-173 was refused because no matching approval was recorded/);
assert.match(attemptCoach, /fails the whole attempt \(the score is capped at 69\)/, 'the guide explains the capstone consequence');
assert.match(attemptCoach, /In the Prove It for this module it costs points/);

// The Practice guide steps and checks exist and point at real controls.
const moduleSource = fs.readFileSync(path.join(portal, 'soc-analyst-module-09.js'), 'utf8');
for (const title of ['Plan the order of response', 'Read the workflow check', 'See what an unsafe attempt costs', 'Do it the safe way']) {
  assert.ok(moduleSource.includes(`title: '${title}'`), `guide step: ${title}`);
}
for (const selector of ['[data-m09-workflow-designer]', '[data-m09-attempt]', '.m09-approval']) {
  assert.ok(moduleSource.includes(`target: '${selector}'`), `guide targets ${selector}`);
}
assert.match(moduleSource, /workflowDesigner: true, attemptForm: true, practice: true/);
assert.match(moduleSource, /Saved a workflow that preserves evidence before approval and approval before containment/);
assert.match(moduleSource, /Saw a containment attempt without approval blocked and logged/);
assert.match(moduleSource, /workflowDesigner: true, attemptForm: true,\n/, 'Prove It mounts the designer without the practice coach');

console.log('M09 workflow designer and unsafe-attempt checks: all passed');

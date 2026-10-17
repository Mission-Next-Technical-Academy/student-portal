#!/usr/bin/env node
// F25 regression: the M04 Guided Lab console renders with idPrefix 'guided'.
// The prefix rewrite also caught data-*-id attributes (data-rule-id,
// data-alert-id, data-indicator-id, data-incident-id), so the tool pack read
// back "guided-M04-RULE-0001" and every rule action failed with "Analytics rule
// not found." This drives the real portal scripts in a vm: render the guided
// and Prove It consoles, then run the M04 pack's click/submit handlers against
// form stand-ins carrying the rendered attributes. Also covers U21 (the guide
// walks the detection workflow) and the instructor work summary (parity audit).
//   node tests/m04-guided-console-prefix.test.js   (exit 0 = all pass)
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

// The instructor sheets are not under test here (and are edited by other
// work streams); load every student-side script but skip them.
const fs = require('node:fs');
const realRead = fs.readFileSync;
fs.readFileSync = (file, ...rest) => (/[\\/]portal[\\/]admin-sheets[\\/]/.test(String(file)) ? '' : realRead(file, ...rest));
let ctx;
try { ctx = loadPortal(); } finally { fs.readFileSync = realRead; }
const run = (code) => vm.runInContext(code, ctx);
const user = { userId: 'f25-test', id: 'f25-test', email: 'f25@example.test', name: 'F25' };
run(`moduleFourGuidedLoad(${JSON.stringify(user)}); moduleFourLoad(${JSON.stringify(user)});`);

const QUERY = 'AuthLog | where Result == "Failure" | summarize Accounts = dcount(Account), Failures = count() by SourceIp, bin(TimeGenerated, 5m) | where Accounts >= 3';
const attr = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map((m) => m[1]);

// ---------------------------------------------------------------- render
// Seed a converted draft, an alert and a selection in each console, then
// render the real console HTML (with and without the prefix).
for (const scope of ['m04-guided', 'm04']) {
  const a = run(scope === 'm04' ? 'moduleFourState.assessment' : 'moduleFourGuidedAssessment()');
  const fixture = run(scope === 'm04' ? 'SocM04AssessmentData' : 'MODULE_FOUR_GUIDED_FIXTURE');
  const T = fixture.scenario.end;
  const SocM04RulesUi = run('SocM04RulesUi');
  SocM04RulesUi.test(a, fixture, QUERY, T);
  const q = SocM04RulesUi.saveQuery(a, QUERY, T, 'Spray burst');
  SocM04RulesUi.convertToDraft(a, q.id, T);
  const cs = run(`m03eState('${scope}')`);

  cs.tab = 'rules';
  const rules = run(`moduleThreeConsoleHtml('${scope}')`);
  assert.deepEqual(attr(rules, 'data-rule-id'), ['M04-RULE-0001'], `${scope}: data-rule-id is the raw rule id`);
  const expectId = scope === 'm04-guided' ? 'guided-m04-rule-name' : 'm04-rule-name';
  assert.ok(attr(rules, 'id').includes(expectId), `${scope}: real ids keep the console prefix rule (${expectId})`);
  assert.ok(attr(rules, 'for').includes(expectId), `${scope}: label for= follows its input`);
  if (scope === 'm04-guided') assert.ok(attr(rules, 'id').every((id) => id.startsWith('guided-')), 'guided: every real id is prefixed');

  cs.tab = 'intelligence';
  const intel = run(`moduleThreeConsoleHtml('${scope}')`);
  const indicatorIds = attr(intel, 'data-indicator-id');
  assert.ok(indicatorIds.length > 0, `${scope}: verdict forms render`);
  assert.ok(indicatorIds.every((id) => !id.startsWith('guided-')), `${scope}: data-indicator-id is raw`);
  assert.ok(indicatorIds.every((id) => (fixture.scenario.verdictIndicators || []).some((item) => item.id === id)), `${scope}: data-indicator-id names a real indicator`);
}

// Generic: no data-*-id / data-*-for attribute is ever rewritten by a prefix.
run(`m03eMountConsole('f25-prefix', { ...M03E_MOUNTS['m04-guided'], idPrefix: 'p', extraTabs: [['probe', 'Probe']],
  views: { probe: () => '<form id="f" data-alert-id="ALT-1" data-incident-id="INC-1" data-evidence-id="E-1" data-target-for="x"><label for="f-in">x</label><input id="f-in" aria-labelledby="f"><a href="#f">f</a><a href="#elsewhere">o</a></form>' } });
  M03E_DATA['f25-prefix'] = M03E_DATA['m04-guided'];`);
run(`m03eState('f25-prefix').tab = 'probe'`);
const probe = run(`moduleThreeConsoleHtml('f25-prefix')`);
assert.match(probe, /<form id="p-f" data-alert-id="ALT-1" data-incident-id="INC-1" data-evidence-id="E-1" data-target-for="x">/);
assert.match(probe, /<label for="p-f-in">/);
assert.match(probe, /<input id="p-f-in" aria-labelledby="p-f">/);
assert.match(probe, /href="#p-f"/);
assert.match(probe, /href="#elsewhere"/, 'links outside the console are left alone');

// ---------------------------------------------------------------- handlers
// Run the M04 pack's delegated handlers with form stand-ins that carry the
// attribute values the console rendered, exactly as the browser would.
function packHarness(scope) {
  const listeners = {};
  const root = { addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); }, querySelector: () => null };
  const getA = () => run(scope === 'm04' ? 'moduleFourState.assessment' : 'moduleFourGuidedAssessment()');
  const fixture = run(scope === 'm04' ? 'SocM04AssessmentData' : 'MODULE_FOUR_GUIDED_FIXTURE');
  let rerenders = 0;
  run('SocConsoleTools').PACKS.m04.wire(root, { scope, guided: scope !== 'm04', assessment: getA, fixture, save() {}, rerender() { rerenders += 1; }, console: () => run(`m03eState('${scope}')`) });
  const fire = (type, target) => { const event = { target, preventDefault() {}, stopPropagation() {} }; (listeners[type] || []).forEach((fn) => fn(event)); };
  const el = (attrs, extra = {}) => ({ matches: (sel) => sel.split(',').some((s) => attrs.includes(s.trim())), closest: (sel) => (sel.split(',').some((s) => attrs.includes(s.trim())) ? extra.self : (extra.closest || {})[sel] || null), ...extra.props });
  return { fire, el, getA, fixture, rerenders: () => rerenders };
}

for (const scope of ['m04-guided', 'm04']) {
  const h = packHarness(scope);
  const probeValue = scope === 'm04' ? 'svc-monitor' : 'svc-probe';
  cleanStart(scope);
  const rendered = (() => { run(`m03eState('${scope}').tab = 'rules'`); return run(`moduleThreeConsoleHtml('${scope}')`); });

  // Save as rule query: the name field's value wins even with no input event.
  run(`m03eState('${scope}').lastQuery = ${JSON.stringify(QUERY)}`);
  const nameField = { value: 'Credential spray by source' };
  const saveBox = { querySelector: (sel) => (sel === '[data-m04-search-query-name]' ? nameField : null) };
  const saveButton = { closest: (sel) => (sel === '[data-m04-save-search-query]' ? saveButton : sel === '.m04-save-query' ? saveBox : null) };
  h.fire('click', saveButton);
  assert.equal(h.getA().queryActionError, '', `${scope}: save query has no error`);
  assert.deepEqual([...h.getA().savedQueries.map((q) => q.name)], ['Credential spray by source'], `${scope}: saved query keeps the typed name`);

  // Convert, then read data-rule-id back from the rendered console.
  const convert = { closest: (sel) => (sel === '[data-m04-convert-query]' ? convert : null), dataset: { m04ConvertQuery: h.getA().savedQueries[0].id } };
  h.fire('click', convert);
  const ruleId = attr(rendered(), 'data-rule-id')[0];
  const values = { name: 'Distributed spray', description: '', severity: 'High', groupingField: 'SourceIp', threshold: '3', windowMinutes: '60',
    exclusionEnabled: true, exclusionField: 'Account', exclusionOperator: '==', exclusionValue: probeValue, exclusionReason: 'Scheduled availability probe',
    suppressionEnabled: false, suppressionGroupField: 'Account', suppressionWindowMinutes: '10', ruleEnabled: true, frequencyMinutes: '15',
    scheduledAt: new Date(Date.parse(h.fixture.scenario.end) + 3600e3).toISOString().slice(0, 16) };
  const errorNode = { textContent: '' };
  const form = { dataset: { ruleId }, elements: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'boolean' ? { checked: v } : { value: v }])), querySelector: () => errorNode };
  const button = (marker) => { const b = { matches: (sel) => sel === marker, closest: (sel) => (sel.split(',').map((s) => s.trim()).includes(marker) ? b : sel === '[data-m04-rule-form]' ? form : null) }; return b; };
  for (const marker of ['[data-m04-rule-save]', '[data-m04-rule-safeguards-save]', '[data-m04-rule-schedule-save]', '[data-m04-rule-run-now]']) {
    h.fire('click', button(marker));
    assert.equal(errorNode.textContent, '', `${scope}: ${marker} succeeds (was "Analytics rule not found.")`);
    assert.equal(h.getA().queryActionError, '', `${scope}: ${marker} leaves no action error`);
  }
  const a = h.getA();
  const rule = a.rules[0];
  assert.equal(rule.name, 'Distributed spray');
  assert.equal(rule.groupingField, 'SourceIp');
  assert.equal(rule.threshold, 3);
  assert.deepEqual({ ...rule.exclusion }, { enabled: true, field: 'Account', operator: '==', value: probeValue, reason: 'Scheduled availability probe' });
  assert.equal(rule.enabled, true);
  assert.equal(a.executions.at(-1).status, 'completed', `${scope}: Run now completes an execution`);
  assert.ok(a.alerts.length >= 1, `${scope}: the run raised an alert`);

  // Alert review and verdict forms carry the ids they rendered.
  const alertDetail = run(`M03E_MOUNTS['${scope}'].alertDetailHtml({ id: ${JSON.stringify(a.alerts[0].id)} })`);
  const alertId = attr(alertDetail, 'data-alert-id')[0];
  const reviewForm = { dataset: { alertId }, elements: { note: { value: 'One source, three accounts.' } } };
  h.fire('submit', { closest: (sel) => (sel === '[data-m04-alert-review-form]' ? reviewForm : null) });
  assert.equal(h.getA().alerts[0].reviewNote, 'One source, three accounts.', `${scope}: alert review saved`);

  run(`m03eState('${scope}').tab = 'intelligence'`);
  const indicatorId = attr(run(`moduleThreeConsoleHtml('${scope}')`), 'data-indicator-id')[0];
  const verdictForm = { dataset: { indicatorId }, elements: { decision: { value: 'malicious' }, rationale: { value: 'Failed sign-ins against three accounts and a success from the same address match the feed.' } }, querySelector: () => ({ textContent: '' }) };
  h.fire('submit', { closest: (sel) => (sel === '[data-m04-verdict-form]' ? verdictForm : null) });
  assert.equal(h.getA().intelVerdicts[indicatorId]?.decision, 'malicious', `${scope}: verdict saved for ${indicatorId}`);
}

function cleanStart(scope) {
  const a = run(scope === 'm04' ? 'moduleFourState.assessment' : 'moduleFourGuidedAssessment()');
  Object.assign(a, { savedQueries: [], rules: [], executions: [], alerts: [], alertIds: [], ruleDraft: {}, nextQuerySequence: 1, nextRuleSequence: 1, nextExecutionSequence: 1, nextAlertSequence: 1, queryName: '', queryActionError: '', intelVerdicts: {} });
}

// ---------------------------------------------------------------- guide (U21)
const steps = run('MODULE_FOUR_GUIDED_STEPS');
const text = steps.map((s) => `${s.title} ${s.body} ${s.task} ${s.lookFor}`).join('\n');
for (const skill of [/query/i, /Save as rule query/, /Convert to rule draft/, /Grouping/i, /[Tt]hreshold/, /window/i, /exclu/i, /svc-probe/, /reason/i, /schedule/i, /Run now/, /Threat Intelligence|intelligence/i, /automat/i, /approval/i, /Submit/]) {
  assert.match(text, skill, `guide covers ${skill}`);
}
assert.doesNotMatch(text, /Start from the lead|Correlate the records/, 'generic steps replaced');
for (const step of steps) {
  for (const key of ['id', 'title', 'body', 'task', 'lookFor', 'tab', 'target']) assert.ok(step[key], `step ${step.id} has ${key}`);
  const sentences = step.body.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean);
  assert.ok(sentences.length <= 2, `step ${step.id} body is at most two sentences`);
  if (step.check) assert.equal(typeof step.check, 'function');
}
const order = steps.map((s) => s.id);
['query', 'test-save', 'rule', 'exclusion', 'schedule-run', 'alert', 'intel', 'automation', 'handoff'].reduce((prev, id) => {
  const i = order.indexOf(id); assert.ok(i > prev, `${id} comes after the previous workflow step`); return i;
}, -1);
// The card shows the task; Next stays advisory (no gating).
run('moduleFourGuidedState.guideStep = 1');
const card = run('moduleFourGuidedGuide()');
assert.match(card, /Your task:/);
assert.match(card, /Pattern: AuthLog/);
assert.match(card, /data-m04g-guide-next/);
assert.doesNotMatch(card, /data-m04g-guide-next[^>]*disabled/);

// ---------------------------------------------------------------- work summary (parity audit)
const A = run('moduleFourState.assessment');
run(`SocM04Automation.run(moduleFourState.assessment, SocM04AssessmentData, 'ticket', 'idops-77', '2026-09-24T10:00:00Z', { alertId: moduleFourState.assessment.alerts[0].id, content: 'Reset credentials for the sprayed accounts.' });
  SocM04Automation.run(moduleFourState.assessment, SocM04AssessmentData, 'notification', 'soc-lead', '2026-09-24T10:01:00Z', { alertId: moduleFourState.assessment.alerts[0].id, content: 'Spray confirmed; ticket filed.' });
  const req = SocM04Automation.requestApproval(moduleFourState.assessment, SocM04AssessmentData, { type: 'account_disable', targetId: 'acct-44', actor: 'analyst-1', reason: 'Signed in after the spray.', alertId: moduleFourState.assessment.alerts[0].id }, '2026-09-24T10:02:00Z');
  SocM04Automation.reviewApproval(moduleFourState.assessment, req.id, 'rejected', 'lead-2', 'Reset first; disable only if reuse continues.', '2026-09-24T10:03:00Z');
  SocM04IntelligenceUi.mutate(moduleFourState.assessment, SocM04AssessmentData, 'report-create', { source: 'Analyst', kind: 'Internal note', summary: 'Spray from one source across five accounts.' }, '2026-09-24T10:04:00Z');`);
const summary = JSON.parse(JSON.stringify(run('moduleFourWorkSummary(moduleFourState.assessment)')));
assert.equal(summary.queries[0].name, 'Credential spray by source');
assert.equal(summary.rules[0].exclusion.reason, 'Scheduled availability probe');
assert.equal(summary.rules[0].severity, 'High');
assert.equal(summary.alerts[0].reviewNote, 'One source, three accounts.');
assert.ok(summary.alerts[0].reviewedAt);
assert.deepEqual(summary.automation.tickets.map((t) => [t.target, t.content]), [['idops-77', 'Reset credentials for the sprayed accounts.']]);
assert.deepEqual(summary.automation.notifications.map((n) => [n.recipient, n.content]), [['soc-lead', 'Spray confirmed; ticket filed.']]);
const approval = summary.automation.approvals[0];
assert.deepEqual([approval.type, approval.target, approval.actor, approval.reason, approval.status, approval.reviewer, approval.reviewReason],
  ['account_disable', 'acct-44', 'analyst-1', 'Signed in after the spray.', 'rejected', 'lead-2', 'Reset first; disable only if reuse continues.']);
assert.deepEqual(summary.reports.map((r) => [r.source, r.kind, r.summary, r.learnerCreated]), [['Analyst', 'Internal note', 'Spray from one source across five accounts.', true]], 'untouched seed reports are left out');
assert.ok(summary.verdicts.some((v) => v.decision === 'malicious' && v.rationale.length > 20));
// Additive only: scoring never reads the summary.
assert.equal(typeof run('SocM04AssessmentScorer').score, 'function');
assert.ok(JSON.stringify(A).length > 0);

console.log('m04 guided console prefix (F25/U21/parity): all pass');

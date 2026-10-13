#!/usr/bin/env node
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const PORTAL = path.join(__dirname, '..', 'portal');
const attempts = [];
const ctx = {
  console, esc: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  caseRecordMissing: () => [], moduleThreeState: { console: {} }, moduleThreeSave: () => {},
  guidedLabDebrief: () => '', guidedLabGuide: () => '', MODULE_THREE_FLAG: 'F', MODULE_THREE_CATALOG_LAB_KEY: 'lab-siem-triage',
  recordLabAttempt: (...args) => attempts.push(args), moduleThreeUser: {},
  document: { getElementById: () => ({ textContent: '' }), querySelector: () => null },
};
vm.createContext(ctx);
for (const f of ['kql-engine.js', 'soc-console-core.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-alert-queue-ui.js', 'case-record.js', 'soc-analyst-module-03-environment.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { if (f !== 'case-record.js') throw e; }
}
const run = (code) => { const v = vm.runInContext(code, ctx); return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
const reset = (raw = {}) => { ctx.__seed = raw; vm.runInContext('moduleThreeState = { console: JSON.parse(JSON.stringify(globalThis.__seed)) }', ctx); };
const expectations = {
  'INC-MN-517': { disposition: 'true-positive', evidence: 'A-5012', note: 'A-5012 confirms attacker access; P-7001 confirms forwarding.' },
  'INC-MN-518': { disposition: 'benign-positive', evidence: 'A-5018 A-5019', note: 'A-5018 and A-5019 show a typo and ordinary LAN sign-in.' },
};
const resolved = (wrong = false) => {
  const x = {};
  for (const [id, row] of Object.entries(expectations)) x[id] = { ...row, resolved: true, ...(wrong && id === 'INC-MN-518' ? { disposition: 'true-positive' } : {}) };
  return { children: x, parentClosed: true };
};

assert.equal(run("M03E_GUIDE_STEPS.find((s) => s.id === 'resolve-children').tab"), 'itsm');
reset({ practice: { guideVersion: 4, guideStep: run("M03E_GUIDE_STEPS.findIndex((s) => s.id === 'submit') - 1"), determination: {} } });
assert.equal(run("m03eState('practice').guideVersion"), 5);
assert.equal(run("M03E_GUIDE_STEPS[m03eState('practice').guideStep].id"), 'submit', 'saved submit-step position migrates past the inserted guided task');
reset();
const practicePanel = run("m03eResolutionPanel('practice')");
assert.match(practicePanel, /Show a hint/);
assert.match(practicePanel, /INC-MN-428-PRACTICE/);
assert.match(practicePanel, /Close the parent case only after every child incident is resolved/);
const provePanel = run("m03eResolutionPanel('prove')");
assert.match(provePanel, /INC-MN-517/);
assert.doesNotMatch(provePanel, /true positive; the l\.brooks/);
assert.doesNotMatch(provePanel, /Close parent case/);

const result = run(`moduleThreeScoreAssessment({ determination: {}, incidentResolutions: ${JSON.stringify(resolved())} }).competencies.find((c) => c.id === 'incident-resolution')`);
assert.equal(result.earned, 5);
assert.equal(result.max, 5);
const wrong = run(`moduleThreeScoreAssessment({ determination: {}, incidentResolutions: ${JSON.stringify(resolved(true))} }).competencies.find((c) => c.id === 'incident-resolution')`);
assert.equal(wrong.earned, 1, 'unsupported resolved disposition loses two points');
assert.ok(wrong.deductions.some((x) => x.includes('INC-MN-518') && x.includes('−2')));
const unsupported = run(`moduleThreeScoreAssessment({ determination: {}, incidentResolutions: ${JSON.stringify({ ...resolved(), children: { ...resolved().children, 'INC-MN-518': { ...expectations['INC-MN-518'], note: 'looks fine and routine', resolved: true } } })} }).competencies.find((c) => c.id === 'incident-resolution')`);
assert.equal(unsupported.earned, 3, 'resolution without a cited record note receives no child credit');

reset({ prove: { incidentResolutions: { hints: 0, parentClosed: false, children: { 'INC-MN-518': { resolved: true, note: 'n', evidence: 'A', disposition: 'benign-positive' }, 'INC-MN-517': { evidence: 'P', note: 'm', disposition: 'true-positive', resolved: true } } } } });
const normalized = run("m03eState('prove').incidentResolutions");
assert.equal(normalized.children['INC-MN-517'].resolved, true);
const reordered = { children: Object.fromEntries(Object.entries(normalized.children).reverse()), hints: 0, parentClosed: false };
reset({ prove: { incidentResolutions: reordered } });
assert.equal(run("m03eState('prove').incidentResolutions.children['INC-MN-517'].evidence"), 'P');

// End-to-end submit persists the new records and rubric version in the durable instructor attempt.
reset({ prove: { incidentResolutions: resolved(), determination: { status: 'closed', affectedUser: 'm.ortiz', affectedDevice: 'mail-01', verdict: 'true-positive', severity: 'high', accountStatus: { 'm.ortiz': 'compromised' }, escalation: 'required', escalateTo: 'identity-response', handoff: { observations: 'observations describe records and timing', analysis: 'analysis connects the attacker session and forwarding rule', scope: 'scope includes m.ortiz and the compromised mail account', nextAction: 'next action asks identity response to revoke sessions' }, notes: 'Analyst handoff: attacker session S-5520 created an external forwarding rule confirmed in P-7001.', submitted: false, actionHistory: [] } } });
assert.deepEqual(run('m03eProveMissing()'), []);
vm.runInContext('m03eSubmitAssessment()', ctx);
assert.equal(attempts.length, 1);
const stored = attempts[0][2].result;
assert.equal(stored.assessment.rubric_version, 2);
assert.equal(stored.assessment.parent_case_status, 'closed');
assert.equal(stored.assessment.child_incident_resolutions['INC-MN-517'].evidence, 'A-5012');
assert.equal(stored.case_record.incidentResolutions.children['INC-MN-518'].note, expectations['INC-MN-518'].note);
console.log('M03 child incident resolutions: all checks passed');

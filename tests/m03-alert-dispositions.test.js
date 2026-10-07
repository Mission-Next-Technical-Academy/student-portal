#!/usr/bin/env node
// Module 03 Practice It: per-alert disposition vocabulary (Sprint 3, gap D).
// True / benign / false positive plus needs-investigation, recorded with
// reasoning, instant feedback and progressive hints.
//   node tests/m03-alert-dispositions.test.js   (exit 0 = all pass)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const PORTAL = path.join(__dirname, '..', 'portal');

const ctx = { console, esc: (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), caseRecordMissing: () => [], moduleThreeState: { console: {} }, moduleThreeSave: () => {}, guidedLabDebrief: (o) => JSON.stringify(o), guidedLabGuide: (id, steps, o) => `${o.item.title}|${o.debriefHtml || ''}`, MODULE_THREE_FLAG: 'F', MODULE_THREE_CATALOG_LAB_KEY: 'lab-siem-triage' };
vm.createContext(ctx);
for (const f of ['kql-engine.js', 'soc-console-core.js', 'soc-kql-search-ui.js', 'soc-evidence-ui.js', 'soc-entity-ui.js', 'soc-timeline-ui.js', 'soc-alert-queue-ui.js', 'soc-analyst-module-03-environment.js']) vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f });
const run = (code) => { const v = vm.runInContext(code, ctx); return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
// Fresh module state. The state adapter caches per saved object, so a new
// root object (built inside the vm realm) forces a real load + normalize().
const reset = (practice) => {
  ctx.__seed = practice === undefined ? {} : { practice };
  vm.runInContext('moduleThreeState = { console: JSON.parse(JSON.stringify(globalThis.__seed)) }', ctx);
};

let failures = 0;
const t = (name, fn) => { try { fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e.message}`); } };
const record = (id, value, reason) => run(`(() => { m03eDispositionDraft(${JSON.stringify(id)}, 'value', ${JSON.stringify(value)}); m03eDispositionDraft(${JSON.stringify(id)}, 'reason', ${JSON.stringify(reason)}); m03eRecordDisposition(${JSON.stringify(id)}, false); return m03eState('practice').dispositions[${JSON.stringify(id)}]; })()`);
const stepIds = run('M03E_GUIDE_STEPS.map((s) => s.id)');
const stepOk = (id) => run(`(() => { const s = M03E_GUIDE_STEPS.find((x) => x.id === ${JSON.stringify(id)}); return !!s.check(m03eState('practice'), null, ''); })()`);

const R = {
  tp: 'Failed then successful sign-in from a first-seen external IP, then a role grant and export in S-8841.',
  benign: 'The failure and success are seconds apart from the usual LAN IP and nothing follows.',
  fp: 'The rule needs an interactive sign-in but AuthLog shows a service credential in job session JOB-22.',
  ni: 'The billing-app collector delay means the follow-up export records may not have arrived; I will re-run AppAudit after the backfill.',
};

console.log('Data and vocabulary');
t('practice queue covers all four dispositions, including needs-investigation', () => {
  const expected = run('Object.values(M03E_PRACTICE_DISPOSITIONS).map((d) => d.value)');
  assert.deepStrictEqual([...new Set(expected)].sort(), ['benign-positive', 'false-positive', 'needs-investigation', 'true-positive']);
  assert.deepStrictEqual(run('M03E_ALERT_DISPOSITIONS.map((o) => o.id)'), ['true-positive', 'benign-positive', 'false-positive', 'needs-investigation']);
});
t('every disposition has an alert in the practice queue and three progressive hints', () => {
  const ids = run('M03E_DATA.practice.alerts.map((a) => a.id)');
  Object.keys(run('M03E_PRACTICE_DISPOSITIONS')).forEach((id) => assert.ok(ids.includes(id), id));
  Object.values(run('M03E_PRACTICE_DISPOSITIONS')).forEach((d) => assert.strictEqual(d.hints.length, 3));
});
t('ALT-3101 flow is intact (alert, rule, entities, query) and disposition steps sit before the handoff', () => {
  const a = run("M03E_DATA.practice.alerts.find((x) => x.id === 'ALT-3101')");
  assert.deepStrictEqual(a.entities, ['acct-428', '198.51.100.18', 'S-8841']);
  assert.match(a.query, /S-8841/);
  assert.strictEqual(stepIds[1], 'alert');
  assert.ok(stepIds.indexOf('disp-tp') > stepIds.indexOf('health') && stepIds.indexOf('disp-ni') < stepIds.indexOf('handoff'));
});
t('the needs-investigation alert falls inside the billing-app collector delay window', () => {
  const a = run("M03E_DATA.practice.alerts.find((x) => x.id === 'ALT-3104')");
  const hb = run("M03E_DATA.practice.records['S-4002']");
  assert.match(hb.Detail, /09:23:08–09:23:50/);
  assert.ok(a.time.slice(11, 19) > '09:23:08' && a.time.slice(11, 19) < '09:23:50');
  // The records that would settle it are not in the data: no AppAudit after the search for c.ortega.
  const rows = run("M03E_DATA.practice.tables.AppAudit.filter((r) => r.Account === 'c.ortega')");
  assert.ok(rows.every((r) => r.TimeGenerated <= '2026-09-18T09:23:35Z'));
  assert.ok(!rows.some((r) => r.EventType === 'BulkExport'));
});

console.log('Instant feedback and hints');
t('a correct call with reasoning is accepted and locked', () => {
  reset();
  const rec = record('ALT-3101', 'true-positive', R.tp);
  assert.strictEqual(rec.result, 'correct'); assert.strictEqual(rec.correct, true);
});
t('a wrong call is rejected, counts an attempt, and unlocks the next hint automatically', () => {
  reset();
  let rec = record('ALT-3102', 'true-positive', R.benign);
  assert.strictEqual(rec.result, 'wrong'); assert.strictEqual(rec.correct, false); assert.strictEqual(rec.hints, 1); assert.strictEqual(rec.attempts, 1);
  rec = record('ALT-3102', 'false-positive', R.benign);
  assert.strictEqual(rec.hints, 2);
  const html = run("(() => { const s = m03eState('practice'); s.selected = { type: 'alert', id: 'ALT-3102' }; return m03eDrawer('practice'); })()");
  assert.match(html, /Hint 1\./); assert.match(html, /Hint 2\./); assert.doesNotMatch(html, /Hint 3\./);
  assert.match(html, /Not supported by the evidence yet/);
});
t('the right value with thin reasoning asks for evidence rather than passing', () => {
  reset();
  assert.strictEqual(record('ALT-3102', 'benign-positive', 'looks ok').result, 'reasoning');
});
t('the Hint button reveals hints one at a time and stops at the last', () => {
  reset();
  for (let i = 0; i < 5; i++) run("m03eRecordDisposition('ALT-3105', true)");
  assert.strictEqual(run("m03eState('practice').dispositions['ALT-3105'].hints"), 3);
});
t('the disposition panel renders in the practice alert drawer only and offers all four values', () => {
  reset();
  const html = run("(() => { m03eState('practice').selected = { type: 'alert', id: 'ALT-3104' }; return m03eDrawer('practice'); })()");
  ['true-positive', 'benign-positive', 'false-positive', 'needs-investigation'].forEach((v) => assert.match(html, new RegExp(`value="${v}"`)));
  assert.match(html, /Needs investigation/);
  const prove = run("(() => { m03eState('prove').selected = { type: 'alert', id: 'ALT-5171' }; return m03eDrawer('prove'); })()");
  assert.doesNotMatch(prove, /Your disposition/);
});

console.log('needs-investigation');
t('needs-investigation is the supported call for the alert inside the collector delay', () => {
  reset();
  assert.strictEqual(record('ALT-3104', 'needs-investigation', R.ni).result, 'correct');
});
t('an explicit true/benign/false call on the incomplete alert is not supported', () => {
  reset();
  ['true-positive', 'benign-positive', 'false-positive'].forEach((v) => assert.strictEqual(record('ALT-3104', v, R.ni).result, 'wrong', v));
});
t('needs-investigation must name what is missing, not just shrug', () => {
  reset();
  assert.strictEqual(record('ALT-3104', 'needs-investigation', 'I am not sure about this one at all.').result, 'missing-data');
});
t('needs-investigation is not the answer for an alert the data does support', () => {
  reset();
  assert.strictEqual(record('ALT-3101', 'needs-investigation', R.ni).result, 'wrong');
});

console.log('Guide steps');
t('each disposition step passes only when its alerts are correctly called', () => {
  reset();
  assert.ok(!stepOk('disp-tp') && !stepOk('disp-benign') && !stepOk('disp-false') && !stepOk('disp-ni'));
  record('ALT-3101', 'true-positive', R.tp); assert.ok(stepOk('disp-tp'));
  record('ALT-3102', 'benign-positive', R.benign); assert.ok(!stepOk('disp-benign'));
  record('ALT-3103', 'benign-positive', R.benign); assert.ok(stepOk('disp-benign'));
  record('ALT-3105', 'false-positive', R.fp); assert.ok(stepOk('disp-false'));
  record('ALT-3104', 'needs-investigation', R.ni); assert.ok(stepOk('disp-ni'));
});
t('the guide bar renders the new needs-investigation step', () => {
  reset({ guideStep: stepIds.indexOf('disp-ni'), guideVersion: 3, determination: {} });
  const bar = run('m03eGuideBar()');
  assert.ok(bar.includes('Know when you cannot call it yet'));
  assert.match(bar, /Alert dispositions/);
});

console.log('Backward compatibility');
t('old practice state (no dispositions) loads with an empty map', () => {
  reset({ tab: 'search', pins: ['A-1006'], guideStep: 3, guideVersion: 2, determination: {} });
  const st = run("m03eState('practice')");
  assert.deepStrictEqual(st.dispositions, {}); assert.strictEqual(st.guideStep, 3); assert.strictEqual(st.guideVersion, 3);
});
t('a saved guide position at or after the old handoff step keeps its place', () => {
  reset({ guideStep: 12, guideVersion: 2, determination: {} });
  assert.strictEqual(stepIds[run("m03eState('practice').guideStep")], 'handoff');
  reset({ guideStep: 15, guideVersion: 2, determination: { submitted: true } });
  assert.strictEqual(run("m03eState('practice').guideStep"), stepIds.length);
});
t('the former 12-step state (no guideVersion) is left untouched for module-03 migration', () => {
  reset({ guideStep: 12, determination: {} });
  assert.strictEqual(run("m03eState('practice').guideStep"), 12);
  assert.ok(!run("m03eState('practice').guideVersion"));
});
t('dispositions survive a Postgres-jsonb style key reorder through normalize()', () => {
  const rec = { value: 'needs-investigation', reason: R.ni, attempts: 2, hints: 1, result: 'correct', correct: true };
  const reordered = { correct: true, result: 'correct', hints: 1, attempts: 2, reason: R.ni, value: 'needs-investigation' };
  const mk = (r) => ({ guideVersion: 3, guideStep: 5, determination: {}, dispositions: { 'ALT-3104': r, 'ALT-3101': { ...r, value: 'true-positive' } } });
  reset(mk(reordered));
  const after = run("m03eState('practice').dispositions");
  assert.deepStrictEqual(after['ALT-3104'], rec);
  assert.strictEqual(after['ALT-3101'].value, 'true-positive');
  assert.ok(run("m03eDispositionsCorrect(m03eState('practice'), ['ALT-3104'])"));
  const st = mk(rec); const rev = Object.fromEntries(Object.entries(st).reverse());
  reset(rev);
  assert.ok(run("m03eDispositionsCorrect(m03eState('practice'), ['ALT-3104', 'ALT-3101'])"));
});
t('junk values in saved dispositions are dropped, not trusted', () => {
  reset({ determination: {}, dispositions: { 'ALT-3104': { value: 'maybe', reason: 5, attempts: -3, hints: 'x', result: 'hacked', correct: 'yes' } } });
  const r = run("m03eState('practice').dispositions['ALT-3104']");
  assert.deepStrictEqual(r, { value: '', reason: '5', attempts: 0, hints: 0, result: '', correct: false });
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);

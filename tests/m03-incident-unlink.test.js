#!/usr/bin/env node
// F21 regression: M03 SIEM alert detail must let a student unlink an alert from
// an incident (guide step 'incident-link' needs ALT-3102 unlinked), and Prove It
// must lock the control after submit.
//   node tests/m03-incident-unlink.test.js   (exit 0 = all pass)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-03-environment.js'), 'utf8');
const grab = (startMark, endMark) => {
  const a = src.indexOf(startMark), b = src.indexOf(endMark, a);
  assert.ok(a > 0 && b > a, 'found ' + startMark);
  return src.slice(a, b);
};
const code = grab('const M03E_INCIDENT_LINK_EXPECTATIONS', '\n// One assigned parent case')
  + grab('function m03eIncidentAssociationPanel', 'function m03eDrawer')
  + grab('function m03eHandleClick', '  if (d.m03eSelect) {') + '\n}\n';

const states = {
  practice: { incidentLinks: [], determination: { actionHistory: [] } },
  prove: { incidentLinks: [], determination: { actionHistory: [], submitted: false } },
};
let saves = 0, renders = 0;
const ctx = {
  esc: (s) => String(s), m03eState: (s) => states[s],
  m03eSave: () => { saves++; }, m03eRender: () => { renders++; },
};
vm.createContext(ctx);
vm.runInContext(code + '\nthis.panel = m03eIncidentAssociationPanel; this.click = m03eHandleClick;', ctx);
const click = (scope, dataset) => ctx.click(scope, { target: { closest: () => ({ dataset }), stopPropagation() {} }, stopPropagation() {} });

for (const [scope, alertId, incId] of [['practice', 'ALT-3102', 'INC-MN-428-PRACTICE'], ['prove', 'ALT-5174', 'INC-MN-517']]) {
  const st = states[scope];
  assert.ok(/data-m03e-link-incident/.test(ctx.panel(scope, { id: alertId })), scope + ': link shown when unlinked');
  assert.ok(!/data-m03e-unlink-incident/.test(ctx.panel(scope, { id: alertId })));
  click(scope, { m03eLinkIncident: alertId, incidentId: incId });
  assert.strictEqual(st.incidentLinks.length, 1);
  const html = ctx.panel(scope, { id: alertId });
  assert.ok(/data-m03e-unlink-incident/.test(html) && !/data-m03e-link-incident/.test(html), scope + ': unlink shown when linked');
  click(scope, { m03eUnlinkIncident: alertId });
  assert.strictEqual(st.incidentLinks.length, 0, scope + ': link removed');
  assert.ok(/Unlinked alert/.test(st.determination.actionHistory.at(-1).action));
}
// Submitted Prove It: controls disabled, handlers are no-ops.
const p = states.prove;
click('prove', { m03eLinkIncident: 'ALT-5170', incidentId: 'INC-MN-517' });
p.determination.submitted = true;
assert.ok(/data-m03e-unlink-incident="ALT-5170" disabled/.test(ctx.panel('prove', { id: 'ALT-5170' })));
click('prove', { m03eUnlinkIncident: 'ALT-5170' });
assert.strictEqual(p.incidentLinks.length, 1, 'locked after submit');
click('prove', { m03eLinkIncident: 'ALT-5171', incidentId: 'INC-MN-517' });
assert.strictEqual(p.incidentLinks.length, 1, 'link locked after submit');
console.log('m03 incident unlink: all pass');

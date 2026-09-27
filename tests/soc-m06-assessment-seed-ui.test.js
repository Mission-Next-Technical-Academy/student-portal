#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = {};
vm.createContext(context);
const root = path.join(__dirname, '..', 'portal');
for (const file of ['soc-m06-assessment-data.js', 'soc-m06-assessment-state.js', 'soc-m06-assessment-seed-ui.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const fixture = vm.runInContext('SocM06AssessmentData', context);
const api = vm.runInContext('SocM06AssessmentState', context);
const ui = vm.runInContext('SocM06AssessmentSeedUi', context);
const freshState = api.normalize({}, fixture);
const initial = ui.render(fixture, freshState);

assert.match(initial, /data-m06-seed-lead="M06-LEAD-001"/);
assert.match(initial, /A weekly scheduled task launches a script from a user-writable folder; no alert fired\./);
assert.match(initial, /Unverified/);
assert.match(initial, /ws-318, ws-355/);
assert.match(initial, /2026-09-26T00:00:00Z to 2026-09-27T09:30:00Z/);
assert.match(initial, /data-m06-hypothesis-text/);
assert.match(initial, /data-m06-hypothesis-rationale/);
assert.match(initial, /data-m06-hypothesis-confidence/);
assert.match(initial, /<option value="medium" selected>/);
assert.doesNotMatch(initial, /expectedTruth|supportedTechniques|unsupportedTechniques|T1053|T1059|T1105|T1071/);

const saved = api.normalize({ hypotheses: [{ seedLeadId: 'M06-LEAD-001', text: 'Review <script>alert(1)</script>', rationale: 'Because "evidence" & context', confidence: 'high' }] }, fixture);
const edited = ui.render(fixture, saved);
assert.match(edited, /Review &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(edited, /Because &quot;evidence&quot; &amp; context/);
assert.match(edited, /<option value="high" selected>/);
assert.doesNotMatch(edited, /<script>alert/);
assert.strictEqual(saved.hypotheses[0].text, 'Review <script>alert(1)</script>', 'rendering does not mutate saved state');

const invalid = ui.render(fixture, { hypotheses: 'invalid' });
assert.match(invalid, /<textarea id="m06-hypothesis" name="text" data-m06-hypothesis-text maxlength="2000"><\/textarea>/);
assert.match(invalid, /<option value="medium" selected>/, 'invalid confidence falls back to medium');
assert.match(ui.render(fixture, null), /Unverified/);
assert.match(ui.render({}, freshState), /Seed lead is unavailable/);

const oversized = { scenario: { seedLead: { id: '<x>', observation: '<b>lead</b>', type: 'x', device: 'd', account: 'a', taskName: 't' }, scope: { devices: Array.from({ length: 8 }, (_, i) => `d${i}`), timeStart: 's'.repeat(100), timeEnd: 'e'.repeat(100) } } };
const bounded = ui.render(oversized, freshState);
assert.match(bounded, /d0, d1, d2, d3, d4/);
assert.doesNotMatch(bounded, /d5/);
assert.ok(bounded.includes(`${'s'.repeat(20)} to ${'e'.repeat(20)}`), 'time context is bounded');
assert.ok(!bounded.includes(`${'s'.repeat(21)} to`), 'time context does not render an unbounded value');
assert.match(bounded, /&lt;b&gt;lead&lt;\/b&gt;/);
assert.doesNotMatch(bounded, /<b>lead/);
console.log('M06 assessment seed UI: all checks passed');

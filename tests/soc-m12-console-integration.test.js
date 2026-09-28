'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('portal/index.html');
const pageModule = page.indexOf('soc-analyst-module-12.js');
for (const name of ['soc-m12-assessment-data.js','soc-m12-assessment-state.js','soc-m12-assessment-rubric.js','soc-m12-assessment-scorer.js','soc-m12-assessment-console.js']) {
  assert.ok(page.indexOf(name) >= 0 && page.indexOf(name) < pageModule, `${name} loads before Module 12`);
}
assert.match(read('portal/data.js'), /key: 'lab-capstone-simulator-practice'.*optional: true/);
const context = vm.createContext({ console, registerModuleLab: () => {}, esc: (x) => String(x ?? '') });
for (const file of ['portal/soc-assessment-scorer.js','portal/soc-m12-assessment-data.js','portal/soc-m12-assessment-state.js','portal/soc-m12-assessment-rubric.js','portal/soc-m12-assessment-scorer.js']) {
  vm.runInContext(read(file), context, { filename: file });
}
vm.runInContext(read('portal/kql-engine.js'), context, { filename: 'portal/kql-engine.js' });
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, ...fields });
context.m03eBuildDataset = ({ caseId, events, identities, ips, watchlists, now }) => ({
  caseId, now, events, identities, ips, watchlists,
  tables: { ...Object.fromEntries([...new Set(events.map((row) => row.EventSource))].map((source) => [source, events.filter((row) => row.EventSource === source)])), UnifiedEvents: events },
});
vm.runInContext(read('portal/soc-m12-assessment-console.js'), context, { filename: 'portal/soc-m12-assessment-console.js' });
assert.equal(vm.runInContext('SocM12AssessmentConsole.dataset().caseId', context), 'INC-4821');
const observed = vm.runInContext('SocM12AssessmentConsole.evaluateQuery("DeviceProcessEvents | where EventId == \\\"EP-301\\\"")', context);
assert.equal(observed.outcome, 'narrow');
assert.deepEqual(Array.from(observed.matchedEvidence), ['EP-301'], 'query outcome and evidence come from MnKql rows');
vm.runInContext(read('portal/attack-catalog.js'), context, { filename: 'portal/attack-catalog.js' });
vm.runInContext(read('portal/soc-analyst-module-12.js'), context, { filename: 'portal/soc-analyst-module-12.js' });
vm.runInContext('moduleTwelveState = moduleTwelveFreshDefaults(); moduleTwelveState.assessmentState = SocM12AssessmentState.fresh(SocM12AssessmentData);', context);
const html = vm.runInContext('moduleTwelveAssessment()', context);
assert.match(html, /data-m12-submit-capstone/);
assert.match(html, /data-m12-assessment-action="investigation"/);
assert.match(html, /data-m12-assessment-action="workflow"/);
assert.match(html, /data-m12-assessment-action="execute"/);
for (const action of ['intel','query','review-alert','incident-link','rule','attack','approval','recovery']) {
  assert.match(html, new RegExp(`data-m12-assessment-action="${action}"`), `${action} outcome is reachable from the assessment UI`);
}
assert.doesNotMatch(html, /data-m12-submit-case|m12-knowledge-check/);
const consoleUi = read('portal/soc-m12-assessment-console.js');
for (const marker of ['data-m12-action="hypothesis"','data-m12-action="handoff"','data-m12-action="closure"','[\'technical\',\'executive\',\'lessons\']','data-m12-report="${kind}"']) {
  assert.ok(consoleUi.includes(marker), `${marker} is available in the cumulative Operations/Reporting workspaces`);
}
const emptyTracker = vm.runInContext('moduleTwelveMissionStatus()', context);
assert.equal((emptyTracker.match(/<span>\d{2}<\/span>/g) || []).length, 12, 'the tracker renders all twelve mission requirements');
assert.equal((emptyTracker.match(/class="is-seen"/g) || []).length, 0, 'all twelve stages begin open');
vm.runInContext(`moduleTwelveState.assessmentState = SocM12AssessmentState.record(moduleTwelveState.assessmentState, SocM12AssessmentData, 'review-alert', { alertId: 'AL-1201', disposition: 'true-positive', reason: 'Endpoint behavior is corroborated by process and network records.' });`, context);
const visitedTracker = vm.runInContext('moduleTwelveMissionStatus()', context);
assert.match(visitedTracker, /Triage · reviewed/);
assert.equal(vm.runInContext('SocM12AssessmentScorer.score(moduleTwelveState.assessmentState, SocM12AssessmentData).score', context), 0,
  'a reviewed alert alone earns no rubric points');
console.log('M12 cumulative console, one scored surface, and 12-stage tracker integration: passed');

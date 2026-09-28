'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'portal/index.html'), 'utf8');
const moduleJs = fs.readFileSync(path.join(root, 'portal/soc-analyst-module-11.js'), 'utf8');

const moduleTag = page.indexOf('soc-analyst-module-11.js');
for (const name of ['soc-m11-assessment-data.js', 'soc-m11-assessment-state.js', 'soc-m11-assessment-rubric.js', 'soc-m11-assessment-scorer.js']) {
  assert.ok(page.indexOf(name) >= 0 && page.indexOf(name) < moduleTag, `${name} loads before the M11 page`);
}
for (const id of ['m04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10']) {
  assert.match(moduleJs, new RegExp(`id: '${id}'`), `M11 carries the ${id} workspace`);
}
assert.match(moduleJs, /extraTabs: \[\['operations', 'Operations'\], \['reporting', 'Reporting'\]\]/);
assert.match(moduleJs, /SocM11AssessmentScorer\.score\(moduleElevenOpsState, SocM11AssessmentData\)/);
const panel = moduleJs.slice(moduleJs.indexOf('function moduleElevenAssessmentLabPanel()'), moduleJs.indexOf('\nfunction moduleElevenAdditionalLabs()'));
assert.doesNotMatch(panel, /caseRecordPane|m11-assessment-form|data-m11-submit-case/, 'legacy duplicate case form is not rendered');
assert.doesNotMatch(panel, /missionNextLabLaunchGroup/, 'imported labs are not embedded in the scored Assessment Lab');
assert.match(moduleJs.slice(moduleJs.indexOf('function moduleElevenAdditionalLabs()'), moduleJs.indexOf('// The shift assessment uses')), /Visualizing Active Directory Performance Metrics with Cacti/,
  'the former assessment lab is retained under the optional labs section');
assert.match(panel, /data-m11-submit-score/);
// Smoke the real cumulative fixture adapters with this module's case model.
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, 'portal/soc-m11-assessment-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'portal/soc-m09-assessment-state.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'portal/soc-m10-assessment-state.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'portal/attack-catalog.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'portal/soc-m06-assessment-related-search.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'portal/soc-console-tools.js'), 'utf8'), context);
const adapter = moduleJs.slice(moduleJs.indexOf('function moduleElevenToolFixtures(data) {'), moduleJs.indexOf('\nfunction moduleElevenOpsHtml()'));
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, ...fields });
context.m03eBuildDataset = ({ events, identities, ips, watchlists }) => ({
  records: Object.fromEntries(events.map((row) => [row.EventId, row])),
  tables: { AlertQueue: events.filter((row) => row.EventSource === 'AlertQueue'), RecoveryRecords: events.filter((row) => row.EventSource === 'RecoveryRecords'), UnifiedEvents: events, IdentityInfo: identities, IpIntel: ips,
    ...Object.fromEntries(Object.entries(watchlists).map(([name, list]) => [name, list.rows])) },
  events, identities, ips, watchlists,
});
vm.runInContext(moduleJs.slice(moduleJs.indexOf('function moduleElevenConsoleData() {'), moduleJs.indexOf('function moduleElevenToolFixtures(data) {')), context);
vm.runInContext(`${adapter}\nthis.fixtureAdapters = moduleElevenToolFixtures(moduleElevenConsoleData());`, context);
const fixtureJson = JSON.parse(JSON.stringify(context.fixtureAdapters));
for (const id of ['m04','m05','m06','m07','m08','m09','m10']) assert.ok(fixtureJson[id], `${id} adapter returned a fixture`);
assert.equal(fixtureJson.m04.scenario.caseId, 'OPS-5511');
assert.equal(fixtureJson.m09.scenario.incidentGraph.incidentId, 'INC-4937');
assert.ok(fixtureJson.m09.scenario.evidence.some((item) => item.id === 'M11-REC-04'));
assert.ok(fixtureJson.m10.scenario.artifacts.some((item) => item.id === 'M11-REC-05'));
assert.equal(vm.runInContext('Object.keys(SocM09AssessmentState.normalize({}, fixtureAdapters.m09).incidentWorkflows).length', context), 1);
assert.equal(vm.runInContext('SocM10AssessmentState.normalize({}, fixtureAdapters.m10).scenarioId', context), fixtureJson.m10.scenario.id);
console.log('M11 cumulative console and single scored-surface integration: passed');

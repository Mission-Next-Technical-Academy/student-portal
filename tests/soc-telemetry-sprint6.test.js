#!/usr/bin/env node
/* Sprint 6 telemetry: M12 capstone scale + course-wide progression. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
const local = (v) => JSON.parse(JSON.stringify(v));
const context = vm.createContext({ console, esc: (x) => String(x ?? '') });
['soc-telemetry-schema.js', 'soc-m12-assessment-data.js'].forEach((f) => vm.runInContext(portal(f), context));
// Same minimal dataset builder the console tests use (rows keep native fields).
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, SessionId: '—', Detail: '', ...fields });
context.m03eBuildDataset = (spec) => {
  const sources = [...new Set(spec.events.map((r) => r.EventSource))];
  return { ...spec, tables: { ...Object.fromEntries(sources.map((s) => [s, spec.events.filter((r) => r.EventSource === s)])), UnifiedEvents: spec.events } };
};
vm.runInContext(portal('soc-m12-assessment-console.js'), context);
vm.runInContext('this.Schema = SocTelemetrySchema; this.M12 = SocM12AssessmentData; this.Data = SocM12AssessmentConsole.dataset();', context);
const { Schema, M12, Data } = context;
const s = local(M12.scenario);
const truth = local(M12.expectedTruth);
const events = local(Data.events);

/* ---------- M12 schema and uniqueness ---------- */
const result = Schema.validateEvents(events, { start: s.start, end: s.end, label: 'M12 assessment' });
assert.deepStrictEqual(local(result.errors), [], `M12 validation errors:\n${result.errors.join('\n')}`);
const ids = events.map((e) => e.EventId);
assert.strictEqual(new Set(ids).size, ids.length, 'no duplicate EventIds (BEN-101 is no longer pushed twice)');
assert.ok(ids.length >= 100 && ids.length <= 180, `M12 unique events in band (${ids.length})`);
assert.ok(ids.length > 106, 'strictly above M10');
assert.ok(new Set(events.map((e) => e.EventSource)).size >= 10, 'at least 10 source families');
assert.ok(local(Data.alerts).length >= 8 && local(Data.alerts).length <= 15, 'alert candidates in band');

/* ---------- every scored claim resolves to a reachable row ---------- */
const reachable = new Set(ids);
const scored = new Set([...truth.selectedEvidence, ...truth.timeline, ...Object.values(truth.attackEvidence).flat(), ...s.evidence.map((e) => e.id),
  ...Object.values(truth.alertDiscriminators).flat(), ...truth.coverageGaps.sensorGapEventIds, ...truth.coverageGaps.boundedNegativeEvidence.map((b) => b.evidenceId)]);
scored.forEach((id) => assert.ok(reachable.has(id), `${id} resolves to a reachable M12 row`));
assert.deepStrictEqual(truth.selectedEvidence, ['EM-212', 'EP-301', 'EP-303', 'ID-402', 'NW-501'], 'answer key unchanged');
Object.keys(truth.telemetryPurposes).forEach((id) => assert.ok(reachable.has(id), `purpose tag ${id} has a row`));
M12.telemetry.forEach((row) => assert.ok(truth.telemetryPurposes[row.EventId], `${row.EventId} has an instructor-only purpose`));
s.queue.forEach((a) => assert.ok(truth.alertDispositions[a.id], `${a.id} has an instructor-only disposition`));
Object.entries(truth.alertDiscriminators).forEach(([alert, list]) => { assert.ok(s.queue.some((a) => a.id === alert)); assert.ok(list.length > 0); });
// Every alert entity is present in the searchable telemetry (case-insensitive).
const known = new Set(events.flatMap((e) => [e.Account, e.Host, e.DeviceId]).filter(Boolean).map((v) => String(v).toLowerCase()));
s.queue.forEach((a) => assert.ok(known.has(a.entityId.toLowerCase()), `${a.id} entity ${a.entityId} appears in telemetry`));
// Original evidence rows keep their identity and time; the answer-bearing sequence is unchanged.
const byId = Object.fromEntries(events.map((e) => [e.EventId, e]));
s.evidence.forEach((e) => { assert.strictEqual(byId[e.id].TimeGenerated, e.at); assert.strictEqual(byId[e.id].EventSource, e.source); });
assert.strictEqual(byId['ID-402'].SourceIp, '203.0.113.72', 'identity pivot on the indicator address');
assert.strictEqual(byId['NW-501'].DestinationIp, '203.0.113.72');

/* ---------- nothing student-visible labels a row's purpose ---------- */
const LABEL = /\b(benign|decoy|distractor|primary|supporting|red herring|false positive|noise|answer)\b/i;
events.forEach((e) => ['Result', 'Detail', 'EventType'].forEach((f) => assert.ok(!LABEL.test(String(e[f] || '')), `${e.EventId}.${f} does not label its purpose`)));

/* ---------- pivot consistency within M12 ---------- */
events.forEach((e) => {
  if (e.Host) assert.strictEqual(e.Host, e.Host.toLowerCase(), `${e.EventId} Host is lower-case like the device ids`);
  if (e.DeviceId) assert.strictEqual(e.DeviceId, e.DeviceId.toLowerCase(), `${e.EventId} DeviceId is lower-case`);
  if (e.DeviceId && e.Host) assert.strictEqual(e.Host, e.DeviceId, `${e.EventId} Host equals DeviceId`);
  if (e.SourceIp) assert.ok(/^\d{1,3}(\.\d{1,3}){3}$/.test(e.SourceIp), `${e.EventId} SourceIp is an IPv4`);
});

/* ---------- coverage caveats are bounded by source and time ---------- */
const hb = (id) => byId[id];
assert.strictEqual(hb('HB-009').CoverageStatus, 'Partial');
assert.ok(Date.parse(hb('HB-009').TimeGenerated) < Date.parse(byId['NW-504'].TimeGenerated), 'ws-142 gap precedes the scope check');
assert.ok(events.some((e) => e.EventSource === 'FirewallEvents' && e.SourceIp === '192.0.2.42' && Date.parse(e.TimeGenerated) >= Date.parse(hb('HB-009').TimeGenerated) && Date.parse(e.TimeGenerated) <= Date.parse(hb('HB-010').TimeGenerated)),
  'gateway flows for the gap host exist during the endpoint gap');
assert.ok(!events.some((e) => e.DestinationIp === '203.0.113.72' && !['ws-204'].includes(e.Host) && e.EventSource !== 'FirewallEvents'), 'only ws-204 contacts the indicator in host/session telemetry');
assert.ok(!events.some((e) => e.DestinationIp === '203.0.113.72' && e.SourceIp !== '192.0.2.24'), 'only 192.0.2.24 contacts the indicator at the gateway');
assert.ok(/available telemetry/.test(byId['NW-504'].Detail) && /ws-142/.test(byId['NW-504'].Detail), 'scope claim states its coverage limits');

/* ---------- course-wide: M12 is the largest slice ---------- */
const { buildInventory } = require('../scripts/soc-telemetry-inventory.js');
const inv = buildInventory();
const asm = inv.scenarios.filter((x) => x.scenario === 'assessment' && x.uniqueSourceEvents);
const m12 = asm.find((x) => x.module === 12);
assert.strictEqual(m12.uniqueSourceEvents, ids.length, 'inventory agrees with the dataset');
assert.deepStrictEqual(m12.duplicateEventIds, [], 'inventory finds no duplicate EventIds');
asm.filter((x) => x.module !== 12).forEach((x) => {
  assert.ok(m12.uniqueSourceEvents > x.uniqueSourceEvents, `M12 events exceed M${x.module} (${x.uniqueSourceEvents})`);
  assert.ok(m12.alerts.authored > x.alerts.authored, `M12 alert candidates exceed M${x.module} (${x.alerts.authored})`);
  assert.ok(m12.sourceTableCount > x.sourceTableCount, `M12 source tables exceed M${x.module}`);
});
inv.scenarios.filter((x) => x.scenario === 'guided' && x.uniqueSourceEvents).forEach((x) => assert.ok(m12.uniqueSourceEvents > x.uniqueSourceEvents));
const curve = inv.progression.curve;
assert.deepStrictEqual(curve.unexplainedDips, [], 'every dip in the capability curve is a documented exception');
assert.ok(curve.m12HighestIndex && curve.m12MostEvents && curve.m12MostAlerts);
assert.strictEqual(m12.alerts.entityRefsResolved.split('/')[0], m12.alerts.entityRefsResolved.split('/')[1], 'all alert entities resolve to events');
assert.notStrictEqual(m12.tagging.benignOrDistractor, 'untagged');
assert.notStrictEqual(m12.tagging.coverageTagged, 'untagged');
assert.strictEqual(inv.independence[12].verdict, 'independent');

console.log(`sprint6 telemetry ok (M12 ${ids.length} events, ${local(Data.alerts).length} alerts)`);

#!/usr/bin/env node
/* Sprint 7 density top-up: Module 11 operations (assessment >= 116 unique events, guided mirrored). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
const local = (v) => JSON.parse(JSON.stringify(v));
const context = vm.createContext({ console });
['soc-telemetry-schema.js', 'soc-m11-assessment-data.js', 'soc-m11-assessment-metrics.js'].forEach((f) => vm.runInContext(portal(f), context));
vm.runInContext('this.Schema = SocTelemetrySchema; this.M11 = SocM11AssessmentData; this.Metrics = SocM11AssessmentMetrics;', context);
const { Schema, M11, Metrics } = context;
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, SessionId: '—', Detail: '', ...fields });
context.m03eBuildDataset = (spec) => ({ ...spec });
const between = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to));
const m11Src = portal('soc-analyst-module-11.js');
vm.runInContext(between(m11Src, 'const MODULE_ELEVEN_GUIDED_CASE_ID', 'const MODULE_ELEVEN_QUIZ_BANKS'), context);
vm.runInContext(between(m11Src, 'function moduleElevenConsoleData(', 'function moduleElevenToolFixtures('), context);
const GUIDED = vm.runInContext('MODULE_ELEVEN_GUIDED_FIXTURE', context);
const build = (fixture) => { context.fx = fixture; return local(vm.runInContext('moduleElevenConsoleData(fx)', context)); };

const HOST = /^[a-z0-9][a-z0-9._-]*$/;
const sourceEvents = (data) => data.events.filter((e) => e.EventSource !== 'AlertQueue');

for (const [label, fixture] of [['assessment', M11], ['guided', GUIDED]]) {
  const s = local(fixture.scenario);
  const data = build(fixture);
  const events = sourceEvents(data);
  const ids = events.map((e) => e.EventId);

  // Density target and uniqueness.
  assert.ok(ids.length >= 116, `M11 ${label} unique events >= 116 (${ids.length})`);
  assert.ok(ids.length <= 120, `M11 ${label} stays inside the Sprint 5 band (${ids.length})`);
  assert.strictEqual(new Set(data.events.map((e) => e.EventId)).size, data.events.length, `${label} unique EventIds`);

  // Schema validity.
  const r = Schema.validateEvents(events, { start: s.start, end: s.end, label: `M11 ${label}` });
  assert.deepStrictEqual(local(r.errors), [], `M11 ${label} validation errors:\n${r.errors.join('\n')}`);

  // Entity identity contract holds on every row (new rows included).
  data.events.forEach((e) => {
    assert.match(String(e.Host), HOST, `${e.EventId} Host token`);
    assert.match(String(e.Account), HOST, `${e.EventId} Account token`);
    assert.notStrictEqual(e.Account, 'unassigned');
  });

  // Supplemental rows agree with the queue and never alter it.
  const sup = s.operations.supplemental;
  const of = (table, type) => events.filter((e) => e.EventSource === table && e.EventType === type);
  const assigned = of('QueueActivity', 'AlertAssigned');
  const acked = of('QueueActivity', 'AlertAcknowledged');
  assert.strictEqual(assigned.length, s.queue.filter((q) => q.assigneeId && q.acknowledgedAt).length);
  assigned.forEach((e) => {
    const q = s.queue.find((x) => x.id === e.QueueId);
    assert.strictEqual(e.Account, q.assigneeId, `${e.EventId} assignee matches the queue`);
    assert.ok(Date.parse(e.TimeGenerated) < Date.parse(q.acknowledgedAt), `${e.EventId} assigned before acknowledgement`);
  });
  const pageAcks = of('OnCallPages', 'PageAcknowledged');
  assert.strictEqual(pageAcks.length, sup.pageAcknowledgements.length);
  pageAcks.forEach((e) => {
    const q = s.queue.find((x) => x.id === e.QueueId);
    const sent = of('OnCallPages', 'PageSent').find((p) => p.QueueId === q.id);
    assert.ok(sent && Date.parse(sent.TimeGenerated) < Date.parse(e.TimeGenerated), `${e.EventId} follows its page`);
    assert.ok(q.acknowledgedAt && Date.parse(e.TimeGenerated) <= Date.parse(q.acknowledgedAt), `${e.EventId} precedes queue acknowledgement`);
    assert.strictEqual(e.Account, q.assigneeId);
  });
  // Unacknowledged paged items stay without any acknowledgement row.
  s.queue.filter((q) => !q.acknowledgedAt).forEach((q) => assert.ok(!events.some((e) => e.QueueId === q.id && /Acknowledged|Assigned/.test(e.EventType)), `${q.id} stays unacknowledged`));
  // Ingestion lag still reconciles on every heartbeat; the one Lagging heartbeat is unchanged.
  const health = events.filter((e) => e.EventSource === 'SourceHealth');
  health.forEach((e) => assert.strictEqual(Date.parse(e.IngestionTime) - Date.parse(e.TimeGenerated), e.IngestionLagSeconds * 1000));
  assert.strictEqual(health.filter((e) => e.Result === 'Lagging').length, 1);
  assert.ok(events.every((e) => Date.parse(e.TimeGenerated) >= Date.parse(s.start) && Date.parse(e.TimeGenerated) <= Date.parse(s.end)), `${label} rows inside the shift`);
  // Purpose tags exist for every supplemental entry and never leak into console rows.
  [...sup.heartbeats, ...sup.shiftLog].forEach((x) => assert.ok(x.purpose, 'supplemental purpose tag'));
  assert.ok(sup.purposes.AlertAssigned && sup.purposes.PageAcknowledged);
  assert.ok(events.every((e) => !('purpose' in e) && !('Purpose' in e)), 'purpose tags are not rendered');
  // Queue rows: the original 12 plus Q-13 (Sprint 3), appended last so earlier generated EventIds do not move.
  assert.strictEqual(s.queue.length, 13);
  assert.strictEqual(acked.length, s.queue.filter((q) => q.acknowledgedAt).length);
}

// Queue metrics and answer key unchanged.
const m = Metrics.compute(M11, {});
assert.strictEqual(m.alertVolume, 13); assert.strictEqual(m.backlog, 8); assert.strictEqual(m.unassigned, 5);
assert.strictEqual(m.mttaMinutes, 17.3); assert.strictEqual(m.mttrMinutes, 46.7);
const truth = local(M11.expectedTruth);
assert.deepStrictEqual(truth.queuePriority.map((x) => x.itemId), ['Q-03', 'Q-02', 'Q-04']);
assert.deepStrictEqual(truth.slaBreaches, ['Q-04', 'Q-09']);
assert.deepStrictEqual(truth.slaAtRisk, ['Q-02', 'Q-03']);
assert.strictEqual(truth.noisyRuleId, 'R-04');
assert.deepStrictEqual(truth.metrics, { alertVolume: 13, mttaMinutes: 17.3, mttrMinutes: 46.7, backlog: 8, noisyRuleNonTruePositiveRate: 1 });
assert.strictEqual(truth.closureDecision, 'retain');
assert.deepStrictEqual(truth.residualRisks.map((x) => x.evidenceId), ['M11-REC-04', 'M11-REC-05']);
// R-04 / CHG-2212 outlier story unchanged: supplemental rows never mention R-04 or the change.
const supText = JSON.stringify(M11.scenario.operations.supplemental);
assert.ok(!/R-04|CHG-22/.test(supText), 'supplemental rows stay out of the R-04 tuning story');
const chg = M11.scenario.operations.ruleChanges.find((c) => c.id === 'CHG-2212');
assert.strictEqual(chg.ruleId, 'R-04'); assert.strictEqual(chg.changeTime, '2026-09-24T14:10:00Z');

console.log('Sprint 7 telemetry density (M11 operations): passed');

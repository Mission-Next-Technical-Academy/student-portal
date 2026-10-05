#!/usr/bin/env node
/* Sprint 5 telemetry: Module 10 custody/provenance and Module 11 operational datasets. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
const local = (v) => JSON.parse(JSON.stringify(v));
const context = vm.createContext({ console });
['soc-telemetry-schema.js', 'soc-m10-assessment-data.js', 'soc-m11-assessment-data.js', 'soc-m11-assessment-metrics.js'].forEach((f) => vm.runInContext(portal(f), context));
vm.runInContext('this.Schema = SocTelemetrySchema; this.M10 = SocM10AssessmentData; this.M11 = SocM11AssessmentData; this.Metrics = SocM11AssessmentMetrics;', context);
const { Schema, M10, M11, Metrics } = context;

// Same minimal dataset builder the console tests use (rows keep native fields).
context.m03eRow = (source, id, day, time, fields) => ({ EventSource: source, EventId: id, __rid: id, TimeGenerated: `${day}T${time}Z`, SessionId: '—', Detail: '', ...fields });
context.m03eBuildDataset = (spec) => ({ ...spec });
const between = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to));

function validate(name, events, scenario) {
  const r = Schema.validateEvents(local(events), { start: scenario.start, end: scenario.end, label: name });
  assert.deepStrictEqual(local(r.errors), [], `${name} validation errors:\n${r.errors.join('\n')}`);
}
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/* ---------- Module 10 ---------- */
const m10Src = portal('soc-analyst-module-10.js');
vm.runInContext(between(m10Src, 'function moduleTenSourceEventRows', 'const MODULE_TEN_CONSOLE_DATA'), context);
vm.runInContext(between(m10Src, 'const MODULE_TEN_ARTIFACT_TABLES', 'function moduleTenSourceEventRows'), context);
vm.runInContext(between(m10Src, 'const MODULE_TEN_GUIDED_CASE_ID', 'const MODULE_TEN_GUIDED_FIXTURE = (() => {'), context);
{
  const s = local(M10.scenario);
  const truth = local(M10.expectedTruth);
  const data = context.moduleTenBuildConsoleData(M10, s.caseId);
  const events = data.events;
  validate('M10 assessment', events, s);

  assert.ok(events.length >= 60 && events.length <= 120, `M10 unique events in band (${events.length})`);
  assert.strictEqual(new Set(events.map((e) => e.EventId)).size, events.length, 'unique EventIds');
  assert.ok(events.length > 50, 'exceeds the M07-M09 band top');

  // Original artifacts and their answer-bearing fields are stable.
  const original = ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-06', 'ART-07', 'ART-08', 'ART-09', 'ART-10'];
  assert.deepStrictEqual(s.artifacts.slice(0, 10).map((a) => a.id), original);
  assert.deepStrictEqual(truth.requiredArtifactIds, ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07']);
  assert.strictEqual(truth.mismatchArtifactId, 'ART-03');
  const art = (id) => s.artifacts.find((a) => a.id === id);
  assert.strictEqual(art('ART-01').sourceHash, art('ART-02').sourceHash, 'attachment and opened file share a hash');
  assert.notStrictEqual(art('ART-03').sourceHash, art('ART-03').verificationHash);
  assert.strictEqual(art('ART-03').reacquiredVerificationHash, art('ART-03').sourceHash);
  assert.strictEqual(art('ART-11').sourceHash, art('ART-12').sourceHash, 'lookalike vendor attachment and saved file share a hash');
  assert.notStrictEqual(art('ART-11').sourceHash, art('ART-01').sourceHash);
  assert.strictEqual(new Set(s.artifacts.map((a) => a.id)).size, s.artifacts.length);

  // Every noise/optional id exists; required never overlaps noise.
  [...truth.noiseArtifactIds, ...truth.optionalSupportingArtifactIds, ...truth.requiredArtifactIds].forEach((id) => assert.ok(art(id), id));
  assert.ok(!truth.noiseArtifactIds.some((id) => truth.requiredArtifactIds.includes(id) || truth.optionalSupportingArtifactIds.includes(id)));
  assert.ok(truth.noiseArtifactIds.every((id) => /\bUnrelated|Routine|Benign|Baseline|signature|Scheduled|updater|different host|Different host|Same SHA-256 as the ART-11|Not the svchelp/i.test(art(id).detail)), 'every decoy states a discriminating fact');

  // Time semantics stay distinct and ordered.
  s.artifacts.forEach((a) => {
    assert.ok(iso.test(a.time) && iso.test(a.acquisitionTime), a.id);
    if (a.ingestionTime) assert.ok(Date.parse(a.ingestionTime) >= Date.parse(a.time), `${a.id} ingested after event`);
    if (a.id !== 'ART-09') assert.ok(Date.parse(a.acquisitionTime) > Date.parse(a.time), `${a.id} acquired after the event`);
    assert.ok(Date.parse(a.acquisitionTime) >= Date.parse(s.request.receivedAt), `${a.id} export staged after the request`);
    assert.ok(Date.parse(a.acquisitionTime) <= Date.parse(s.stagingReleasedAt), `${a.id} staged before release`);
  });

  // Provenance ledger reconstructs each transition and agrees with the artifact hashes.
  const ledger = events.filter((e) => e.EventSource === 'EvidenceCustodyLog');
  s.artifacts.forEach((a) => {
    const rows = ledger.filter((e) => e.ArtifactId === a.id).sort((x, y) => x.TimeGenerated.localeCompare(y.TimeGenerated));
    assert.strictEqual(rows[0].EventType, 'ArtifactExported', a.id);
    assert.strictEqual(rows[0].SourceSha256, a.sourceHash, `${a.id} export hash`);
    assert.strictEqual(rows[0].CustodyFrom, 'source-system');
    assert.strictEqual(rows[0].CustodyTo, s.stagingCustodian);
    assert.strictEqual(rows[0].CustodyId, `COC-${s.caseId}-${a.id}`);
    const checks = rows.filter((r) => r.EventType === 'HashVerification');
    assert.ok(checks.length >= 1, `${a.id} verified at least once`);
    checks.forEach((r) => assert.strictEqual(r.Result, a.id === 'ART-03' ? 'Mismatch' : 'Match', `${a.id} ${r.EventId}`));
    if (s.repeatVerificationIds.includes(a.id)) assert.strictEqual(checks.length, 2, `${a.id} repeat verification`);
    assert.ok(rows.every((r) => r.AcquisitionTime === a.acquisitionTime && r.EventTime === a.time), 'ledger carries distinct acquisition and event times');
  });
  const release = ledger.filter((e) => e.EventType === 'CustodyRelease');
  assert.strictEqual(release.length, 1);
  assert.strictEqual(release[0].CustodyTo, 'soc-analyst');
  assert.ok(Date.parse(release[0].TimeGenerated) <= Date.parse(s.end));

  // Source events: honest hash links, in window, and no proxy upload for wkstn-19.
  const src = events.filter((e) => /^M10-SRC-/.test(e.EventId));
  assert.strictEqual(src.length, s.sourceEvents.length);
  assert.strictEqual(src.find((e) => e.EventId === 'M10-SRC-30').SourceSha256, art('ART-09').sourceHash);
  assert.ok(!src.some((e) => e.EventSource === 'ProxyEvents' && /POST|PUT/.test(e.Detail)), 'no proxy upload rows');
  assert.ok(src.every((e) => !e.IngestionTime || Date.parse(e.IngestionTime) >= Date.parse(e.TimeGenerated)));

  // Guided clone is independent of the assessment case and consistent.
  vm.runInContext('this.guided = moduleTenGuidedClone(SocM10AssessmentData);', context);
  const g = local(context.guided);
  g.scenario.artifacts.forEach((a, i) => { a.sourceHash = String(i + 1).padStart(2, '0').repeat(32); a.verificationHash = i === 2 ? 'ee'.repeat(32) : a.sourceHash; if (a.reacquiredVerificationHash) a.reacquiredVerificationHash = a.sourceHash; });
  const gData = context.moduleTenBuildConsoleData(g, g.scenario.caseId);
  validate('M10 guided', gData.events, g.scenario);
  assert.strictEqual(gData.events.length, events.length);
  const ids = new Set(events.map((e) => e.EventId));
  assert.ok(gData.events.every((e) => !ids.has(e.EventId)), 'no shared EventIds');
  const text = JSON.stringify(gData.events);
  ['wkstn-19', 'mail-gw-01', 'backup-srv-02', 'svc-backup', 'northwind-supply', 'edr-mgmt-01', 'evidence-staging', 'm.okoye', 'p.nair', '2026-09-27'].forEach((x) => assert.ok(!text.toLowerCase().includes(x), `guided leaks ${x}`));

  // Entity identity contract: lower-case Host = DeviceId, `system` with the native form kept in AccountNative.
  [events, gData.events].forEach((rows) => rows.forEach((e) => {
    if (e.Host !== undefined) { assert.strictEqual(e.Host, e.Host.toLowerCase(), `${e.EventId} host lower-case`); assert.strictEqual(e.DeviceId, e.Host, `${e.EventId} DeviceId = Host`); }
    assert.strictEqual(e.Account, String(e.Account).toLowerCase(), `${e.EventId} account lower-case`);
  }));
  const sys = events.filter((e) => e.Account === 'system');
  assert.ok(sys.length > 0 && sys.every((e) => e.AccountNative === 'SYSTEM'), 'system rows keep native SYSTEM');
  assert.ok(!data.identities.some((i) => i.Account === 'system'), 'built-in principal has no identity row');

  // Shipped guided fixture (with its account adjustment) shares no host or account with the assessment.
  vm.runInContext(between(m10Src, 'const MODULE_TEN_GUIDED_FIXTURE = (() => {', 'const MODULE_TEN_DEVICES'), context);
  const shipped = context.moduleTenBuildConsoleData(vm.runInContext('MODULE_TEN_GUIDED_FIXTURE', context), 'CASE-106620');
  validate('M10 guided (shipped)', shipped.events, local(vm.runInContext('MODULE_TEN_GUIDED_FIXTURE.scenario', context)));
  const entitySet = (rows, key) => new Set(rows.map((e) => e[key]).filter(Boolean));
  ['Host', 'Account'].forEach((key) => {
    const guidedSet = entitySet(shipped.events, key);
    const shared = [...entitySet(events, key)].filter((v) => guidedSet.has(v));
    assert.deepStrictEqual(shared, [], `guided and assessment share ${key} values`);
  });
  assert.ok(shipped.events.filter((e) => e.Account === 'local-service').every((e) => e.AccountNative === 'NT AUTHORITY\\LOCAL SERVICE'));
  assert.ok(!shipped.identities.some((i) => i.Account === 'local-service'), 'guided built-in principal has no identity row');
  const guidedMismatch = shipped.events.filter((e) => e.ArtifactId === 'PRACT-03' && e.EventType === 'HashVerification');
  assert.ok(guidedMismatch.length === 2 && guidedMismatch.every((e) => e.Result === 'Mismatch'), 'guided PRACT-03 still mismatches on both checks');
}

/* ---------- Module 11 ---------- */
const m11Src = portal('soc-analyst-module-11.js');
vm.runInContext(between(m11Src, 'const MODULE_ELEVEN_GUIDED_CASE_ID', 'const MODULE_ELEVEN_QUIZ_BANKS'), context);
vm.runInContext(`${between(m11Src, 'function moduleElevenConsoleData(', 'function moduleElevenToolFixtures(')}`, context);
{
  const GUIDED = vm.runInContext('MODULE_ELEVEN_GUIDED_FIXTURE', context);
  const buildFor = (fixture) => {
    context.fx = fixture;
    return vm.runInContext('moduleElevenConsoleData(fx)', context);
  };
  const a = buildFor(M11);
  const g = buildFor(GUIDED);
  const s = local(M11.scenario);
  const events = a.events.filter((e) => e.EventSource !== 'AlertQueue');
  validate('M11 assessment', events, s);
  validate('M11 guided', g.events.filter((e) => e.EventSource !== 'AlertQueue'), local(GUIDED.scenario));
  assert.ok(events.length >= 60 && events.length <= 120, `M11 events in band (${events.length})`);
  assert.strictEqual(new Set(a.events.map((e) => e.EventId)).size, a.events.length);
  assert.strictEqual(s.queue.length, 12, 'queue unchanged');
  // Entity identity (phase 2): AlertQueue Host is a hostname token, the title lives in AlertTitle, no placeholder accounts.
  for (const built of [a, g]) {
    const aq = built.events.filter((e) => e.EventSource === 'AlertQueue');
    assert.strictEqual(aq.length, 12);
    aq.forEach((row) => {
      assert.match(row.Host, /^[a-z0-9][a-z0-9._-]*$/, `${row.EventId} Host is a host token`);
      assert.ok(row.AlertTitle && row.AlertTitle !== row.Host, `${row.EventId} keeps its title in AlertTitle`);
      assert.strictEqual(row.Account, 'siem-rules');
    });
    assert.ok(built.events.every((e) => e.Account !== 'unassigned'), 'no placeholder Account');
    assert.strictEqual(aq.filter((row) => row.AssigneeId === null).length, 5, 'unassigned items carry AssigneeId null');
  }

  // Scored truth is untouched.
  const m = Metrics.compute(M11, {});
  assert.strictEqual(m.alertVolume, 12); assert.strictEqual(m.backlog, 7);
  assert.strictEqual(m.mttaMinutes, 17.3); assert.strictEqual(m.mttrMinutes, 46.7);

  // Queue-derived operational rows agree with the queue.
  const tableOf = (name) => a.events.filter((e) => e.EventSource === name);
  const created = tableOf('QueueActivity').filter((e) => e.EventType === 'AlertCreated');
  assert.strictEqual(created.length, 12);
  s.queue.forEach((q) => assert.strictEqual(created.find((e) => e.QueueId === q.id).TimeGenerated, q.createdAt));
  assert.strictEqual(tableOf('QueueActivity').filter((e) => e.EventType === 'AlertAcknowledged').length, s.queue.filter((q) => q.acknowledgedAt).length);
  const runs = tableOf('RuleRuns');
  assert.strictEqual(runs.length, 40);
  s.rules.forEach((r) => assert.strictEqual(runs.filter((e) => e.RuleId === r.id).reduce((n, e) => n + e.AlertsRaised, 0), s.queue.filter((q) => q.ruleId === r.id).length, `${r.id} run alert counts`));
  runs.forEach((e) => { assert.strictEqual(e.TimeGenerated, e.WindowEnd, 'run completes at window end'); assert.ok(Date.parse(e.WindowStart) < Date.parse(e.WindowEnd)); });
  tableOf('SourceHealth').forEach((e) => assert.ok(Date.parse(e.IngestionTime) - Date.parse(e.TimeGenerated) === e.IngestionLagSeconds * 1000, 'ingestion lag matches'));
  assert.ok(tableOf('SourceHealth').some((e) => e.Result === 'Lagging'));
  assert.ok(Math.max(...events.map((e) => Date.parse(e.TimeGenerated))) <= Date.parse(s.end));

  // Metric series: windows, not events; totals reconcile; outlier lines up with the rule change.
  const ops = s.operations;
  const daily = ops.dailyMetrics; assert.ok(daily.length >= 6 && daily.length <= 12);
  daily.forEach((d) => { assert.ok(iso.test(d.windowStart) && iso.test(d.windowEnd) && Date.parse(d.windowStart) < Date.parse(d.windowEnd)); assert.ok(!('time' in d)); });
  daily.slice(0, -1).forEach((d) => {
    const sum = ops.ruleVolume.filter((v) => v.windowStart === d.windowStart).reduce((n, v) => n + v.alerts, 0);
    assert.strictEqual(sum, d.alertVolume, `${d.id} reconciles with per-rule volume`);
  });
  const today = daily.at(-1);
  assert.strictEqual(today.alertVolume, m.alertVolume);
  assert.strictEqual(today.backlogAtWindowEnd, m.backlog);
  s.rules.forEach((r) => assert.strictEqual(ops.ruleVolume.filter((v) => v.ruleId === r.id && v.windowStart < s.start).length, 10));
  const change = ops.ruleChanges.find((c) => c.ruleId === s.rules[3].id && c.type === 'logic');
  assert.ok(change && Date.parse(change.changeTime) < Date.parse(s.start));
  const r4 = (day) => ops.ruleVolume.find((v) => v.ruleId === 'R-04' && v.windowStart.startsWith(day)).alerts;
  assert.ok(r4('2026-09-25') >= 5 * r4('2026-09-23'), 'R-04 outlier follows the change');
  assert.ok(ops.ruleVolume.filter((v) => v.ruleId !== 'R-04' && v.windowStart.startsWith('2026-09-25')).every((v) => v.alerts <= 6), 'other rules stay at baseline');
  assert.ok(/not incident evidence/i.test(ops.basis));
  assert.strictEqual(ops.shiftMetrics.length, 9);

  // Guided series moved a week; no shared ids or dates.
  const gDaily = local(g.watchlists.DailyOpsMetrics.rows);
  assert.ok(gDaily.every((d) => !d.WindowStart.startsWith('2026-09-2') || d.WindowStart >= '2026-09-24'));
  assert.ok(!JSON.stringify(g.watchlists.RuleChanges.rows).includes('2026-09-24T14:10'));
  const ids = new Set(a.events.map((e) => e.EventId));
  assert.ok(g.events.every((e) => !ids.has(e.EventId)), 'no shared EventIds');
  assert.strictEqual(local(g.watchlists.RuleChanges.rows).length, 5);
}

console.log('Sprint 5 telemetry (M10 custody, M11 operations): passed');

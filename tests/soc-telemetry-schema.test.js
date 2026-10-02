#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = (f) => path.join(__dirname, '..', 'portal', f);
const load = (file, expr) => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(portal(file), 'utf8'), context);
  return vm.runInContext(expr, context);
};
const local = (v) => JSON.parse(JSON.stringify(v));

const Schema = load('soc-telemetry-schema.js', 'SocTelemetrySchema');

/* ---------- validator self-tests ---------- */
{
  const good = [
    { EventId: 'E1', TimeGenerated: '2026-01-01T00:00:01Z', EventType: 'SignIn', EventSource: 'AuthLog', Account: 'a', Result: 'Success', relatedEventIds: ['E2'] },
    { EventId: 'E2', TimeGenerated: '2026-01-01T00:00:02Z', EventType: 'SignIn', EventSource: 'AuthLog', Account: 'a', Result: 'Failure' },
  ];
  const ok = Schema.validateEvents(good, { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:01:00Z', entities: { Account: ['a'] } });
  assert.deepStrictEqual(local(ok), { ok: true, errors: [], warnings: [] });

  const bad = [
    { id: 'X', time: '2026-01-01T00:00:01Z', type: 'T', relatedEventIds: ['NOPE'] },
    { id: 'X', time: '2026-01-01 00:00:02', type: 'T' },
    { id: 'Y', time: '2027-01-01T00:00:00Z', type: 'T', account: 'zzz' },
    { id: 'Z', time: '2026-02-30T00:00:00Z', type: 'T' },
    { id: 'W', time: '2026-01-01T00:00:03Z' },
  ];
  const r = Schema.validateEvents(bad, { start: '2026-01-01T00:00:00Z', end: '2026-01-01T00:01:00Z', entities: { Account: ['a'] } });
  assert.strictEqual(r.ok, false);
  const text = r.errors.join('\n');
  ['duplicate EventId', 'not ISO-8601 UTC', 'after window end', 'not found in entity inventory', 'unknown event NOPE', 'missing required field EventType'].forEach((s) => assert.ok(text.includes(s), s));
  assert.strictEqual(Schema.validateEvents(null).ok, false, 'non-array does not throw');

  const sc = Schema.validateScenario({ events: good, alerts: [{ id: 'A', eventIds: ['E1', 'GONE'] }] });
  assert.ok(sc.errors.some((e) => e.includes('unknown event GONE')));

  const nat = Schema.validateEvents([{ EventId: 'E1', TimeGenerated: '2026-01-01T00:00:01Z', EventType: 'T' }], { native: [{ EventId: 'E1', TimeGenerated: '2026-01-01T00:00:01Z', EventType: 'T', AuthMethod: 'pw' }] });
  assert.ok(nat.errors.some((e) => e.includes('lost native field AuthMethod')));
  assert.strictEqual(Schema.normalizeResult('detected_not_prevented'), 'Unknown');
  assert.strictEqual(Schema.normalizeResult('denied'), 'Blocked');
}

function report(name, result) {
  assert.deepStrictEqual(local(result.errors), [], `${name} validation errors:\n${result.errors.join('\n')}`);
  assert.strictEqual(result.ok, true);
  if (process.env.SHOW_WARNINGS) result.warnings.forEach((w) => console.log(`  [warn] ${name}: ${w}`));
}

/* ---------- Module 3 (practice + prove) ---------- */
{
  const src = fs.readFileSync(portal('soc-analyst-module-03-environment.js'), 'utf8');
  const cut = src.indexOf('const M03E_DATA = ');
  assert.ok(cut > 0);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${src.slice(0, cut)}\nconst __out = { practice: M03E_PRACTICE, prove: M03E_PROVE, mappings: M03E_SOURCE_MAPPINGS };`, context);
  const out = vm.runInContext('__out', context);
  ['practice', 'prove'].forEach((scope) => {
    const ds = out[scope];
    const events = Object.values(ds.records);
    const unified = ds.tables.UnifiedEvents;
    const accounts = ds.tables.IdentityInfo.map((i) => i.Account);
    // Day window; entity inventory = IdentityInfo (service/host identities are
    // not in the lookup table, so unresolved entities are warnings here).
    const opts = { label: `M03 ${scope}`, start: `${ds.day}T00:00:00Z`, end: `${ds.day}T23:59:59Z`, entities: { Account: accounts }, entitySeverity: 'warning' };
    report(`M03 ${scope} records`, Schema.validateEvents(events, opts));
    // Native preservation: each source table row is the native record.
    Object.keys(out.mappings).forEach((source) => {
      const rows = ds.tables[source];
      report(`M03 ${scope} ${source} table`, Schema.validateEvents(rows, { ...opts, native: events.filter((e) => e.EventSource === source) }));
    });
    // UnifiedEvents is a normalized view: same IDs, no altered shared fields.
    assert.strictEqual(unified.length, events.length, 'UnifiedEvents is a 1:1 view of source events');
    report(`M03 ${scope} UnifiedEvents`, Schema.validateEvents(unified, {
      ...opts, native: events,
      nativeFields: ['TimeGenerated', 'EventSource', 'EventType', 'Account', 'SourceIp', 'Host', 'SessionId', 'Result', 'Detail', 'EventId'],
    }));
    // Alerts reference entities; every account-like entity should be known.
    const ids = new Set(events.map((e) => e.EventId));
    ds.alerts.forEach((a) => assert.ok(a.id && a.entities.length, `${a.id} has entities`));
    assert.ok(ids.size === events.length);
    // Alert entities (accounts, IPs, sessions, hosts) resolve to something in the telemetry.
    const known = new Set();
    events.forEach((e) => ['Account', 'SourceIp', 'SessionId', 'Host'].forEach((f) => { if (!Schema.isEmpty(e[f])) known.add(e[f]); }));
    ds.alerts.forEach((a) => a.entities.forEach((ent) => assert.ok(known.has(ent), `${a.id} entity ${ent} resolves to telemetry`)));
    // Alert times fall inside the day window.
    ds.alerts.forEach((a) => assert.ok(a.time >= opts.start && a.time <= opts.end, `${a.id} alert time in window`));
  });
}

/* ---------- Module 4 ---------- */
{
  const s = load('soc-m04-assessment-data.js', 'SocM04AssessmentData').scenario;
  const t = s.truth;
  report('M04', Schema.validateScenario({
    events: local(s.telemetry), start: s.start, end: s.end,
    references: [
      { name: 'truth.successfulAuthenticationEventIds', eventIds: t.successfulAuthenticationEventIds },
      { name: 'truth.benignRetry', eventIds: t.benignRetry.eventIds },
      { name: 'truth.rule.match', eventIds: t.rule.matchEventIds },
      { name: 'truth.rule.exclude', eventIds: t.rule.excludeEventIds },
    ],
  }, { label: 'M04' }));
  // Cross-references among reports/IOCs.
  const reportIds = new Set(s.reports.map((r) => r.id));
  assert.ok(reportIds.has(t.benignRetry.explanationReportId));
  s.iocs.forEach((i) => assert.ok(reportIds.has(i.sourceReportId), `${i.id} sourceReportId resolves`));
  s.reports.forEach((r) => assert.ok(r.time >= s.start && r.time <= s.end, `${r.id} in window`));
}

/* ---------- Module 5 ---------- */
{
  const s = load('soc-m05-assessment-data.js', 'SocM05AssessmentData').scenario;
  const T = s.expectedTruth;
  const refs = [
    ...['confirmedDevice', 'confirmedUser', 'processAncestry', 'maliciousFile', 'persistence', 'endpointControl', 'scope'].map((k) => ({ name: k, eventIds: T[k].eventIds })),
    ...T.benignActivity.map((b) => ({ name: `benign.${b.type}`, eventIds: b.eventIds })),
  ];
  const result = Schema.validateScenario({
    events: local(s.telemetry), start: s.start, end: s.end, references: refs,
    entities: { DeviceId: s.devices.map((d) => d.id), Host: s.devices.map((d) => d.hostname) },
  }, { label: 'M05', recommended: ['EventSource', 'Account', 'Result'] });
  report('M05', result);
  // Declared schema: every required key present on every record.
  s.telemetry.forEach((e) => s.telemetrySchema.required.forEach((k) => assert.ok(k in e, `${e.id} has ${k}`)));
  // deviceId/host pair is consistent with the inventory.
  s.telemetry.forEach((e) => {
    const d = s.devices.find((x) => x.id === e.deviceId);
    assert.strictEqual(d.hostname, e.host, `${e.id} host matches device inventory`);
  });
}

/* ---------- Module 6 ---------- */
{
  const s = load('soc-m06-assessment-data.js', 'SocM06AssessmentData').scenario;
  const T = s.expectedTruth;
  const refs = [...T.supportedTechniques, ...T.unsupportedTechniques].map((t) => ({ name: t.id, eventIds: t.evidenceEventIds }));
  const events = local(s.telemetry);
  // Source field is the sensor name; map it onto the canonical EventSource.
  report('M06', Schema.validateScenario({
    events, start: s.fixedAt && s.start, end: s.end, references: refs,
    entities: { DeviceId: s.scope.devices, Account: [...s.scope.accounts, 'acct-271'] },
  }, { label: 'M06' }));
  s.telemetrySchema.required.forEach((k) => s.telemetry.forEach((e) => assert.ok(k in e, `${e.id} has ${k}`)));
  s.telemetry.forEach((e) => assert.ok(e.time >= s.scope.timeStart && e.time <= s.scope.timeEnd, `${e.id} in hunt scope`));
}

console.log('soc-telemetry-schema tests passed');

#!/usr/bin/env node
/* Sprint 2 (Modules 1-4) telemetry staircase: counts, schema validity, decoy discriminators, independence. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const portal = (f) => path.join(root, 'portal', f);
const local = (v) => JSON.parse(JSON.stringify(v));
const load = (file, expr, pre = []) => {
  const context = {};
  vm.createContext(context);
  [...pre, file].forEach((f) => vm.runInContext(fs.readFileSync(portal(f), 'utf8'), context));
  return vm.runInContext(expr, context);
};
const Schema = load('soc-telemetry-schema.js', 'SocTelemetrySchema');
const ok = (name, result) => assert.deepStrictEqual(local(result.errors), [], `${name}:\n${result.errors.join('\n')}`);

/* ---------- Module 2 guided console (static extraction of the DATA literal) ---------- */
{
  const src = fs.readFileSync(portal('soc-analyst-module-02-environment.js'), 'utf8');
  const a = src.indexOf('const DATA = {');
  const b = src.indexOf('const M02_ROW_PURPOSE');
  assert.ok(a > 0 && b > a, 'M02 DATA literal found');
  const DATA = vm.runInNewContext(`(() => { ${src.slice(a, b)}; return DATA; })()`);
  const events = DATA.events;
  assert.ok(events.length >= 8 && events.length <= 18, `M02 guided focused band (got ${events.length})`);
  assert.strictEqual(new Set(events.map((e) => e.id)).size, events.length, 'unique M02 event ids');
  assert.strictEqual(events[0].id, 'evt-alice-finance', 'default selected event unchanged');
  const has = (list, id) => list.some((x) => x.id === id);
  events.forEach((e) => {
    assert.ok(has(DATA.users, e.user) && has(DATA.devices, e.device) && has(DATA.resources, e.resource) && has(DATA.policies, e.policy), `${e.id} references resolve`);
    assert.ok(/^\d\d:\d\d$/.test(e.time) && e.time >= '08:00' && e.time <= '09:30', `${e.id} time in the review window`);
  });
  // Exactly one confirmed excess; the unmanaged-device denial is explainable from device + policy records.
  assert.deepStrictEqual(local(events.filter((e) => e.violation).map((e) => e.id)), ['evt-john-hr-allowed']);
  const cora = events.find((e) => e.id === 'evt-cora-finance-device');
  const dev = DATA.devices.find((d) => d.id === cora.device);
  const pol = DATA.policies.find((p) => p.id === cora.policy);
  assert.ok(cora.result === 'DENIED' && cora.authorization === 'Finance-Read' && dev.management === 'Unmanaged' && pol.requirements.includes('Managed device'));
}

/* ---------- Module 3 ---------- */
const m3 = (() => {
  const src = fs.readFileSync(portal('soc-analyst-module-03-environment.js'), 'utf8');
  const cut = src.indexOf('const M03E_DATA = ');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${src.slice(0, cut)}\nconst __out = { practice: M03E_PRACTICE, prove: M03E_PROVE, mappings: M03E_SOURCE_MAPPINGS, purpose: M03E_ROW_PURPOSE };`, context);
  return vm.runInContext('__out', context);
})();
{
  const bands = { practice: [20, 45], prove: [20, 45] };
  const ids = {};
  ['practice', 'prove'].forEach((scope) => {
    const ds = m3[scope];
    const events = Object.values(ds.records);
    ids[scope] = new Set(events.map((e) => e.EventId));
    assert.ok(events.length >= bands[scope][0] && events.length <= bands[scope][1], `M03 ${scope} in band (got ${events.length})`);
    assert.strictEqual(new Set(events.map((e) => e.EventSource)).size, 4, `M03 ${scope} has four sources`);
    assert.ok(ds.alerts.length >= 3 && ds.alerts.length <= 6, `M03 ${scope} alert candidates (got ${ds.alerts.length})`);
    const accounts = ds.tables.IdentityInfo.map((i) => i.Account);
    const opts = { label: `M03 ${scope}`, start: `${ds.day}T00:00:00Z`, end: `${ds.day}T23:59:59Z`, entities: { Account: accounts }, entitySeverity: 'warning' };
    ok(`M03 ${scope}`, Schema.validateEvents(events, opts));
    ok(`M03 ${scope} unified`, Schema.validateEvents(ds.tables.UnifiedEvents, { ...opts, native: events, nativeFields: ['TimeGenerated', 'EventSource', 'EventType', 'Account', 'SourceIp', 'Host', 'SessionId', 'Result', 'Detail', 'EventId'] }));
    const known = new Set();
    events.forEach((e) => ['Account', 'SourceIp', 'SessionId', 'Host'].forEach((f) => { if (!Schema.isEmpty(e[f])) known.add(e[f]); }));
    ds.alerts.forEach((a) => a.entities.forEach((ent) => assert.ok(known.has(ent), `${a.id} entity ${ent} resolves`)));
  });
  Object.keys(m3.purpose).forEach((id) => assert.ok(ids.practice.has(id) || ids.prove.has(id), `purpose tag ${id} resolves to a row`));
  // Guided/assessment independence: no shared ids, accounts or answer-bearing identity.
  assert.ok([...ids.practice].every((id) => !ids.prove.has(id)));
  const accts = (ds) => new Set(Object.values(ds.records).map((e) => e.Account));
  const shared = [...accts(m3.practice)].filter((a) => accts(m3.prove).has(a));
  assert.deepStrictEqual(local(shared).filter((a) => /ortiz/.test(a)), [], 'guided no longer reuses m.ortiz');
  const ips = (ds) => new Set(Object.values(ds.records).map((e) => e.SourceIp));
  assert.deepStrictEqual(local([...ips(m3.practice)].filter((ip) => ips(m3.prove).has(ip) && ip !== '—')), [], 'no shared IPs between guided and assessment');
  // Answer-bearing assessment evidence unchanged.
  const prove = m3.prove.records;
  ['A-5001', 'A-5006', 'A-5012', 'D-6001', 'P-7001', 'P-7005', 'S-8001'].forEach((id) => assert.ok(prove[id], `${id} retained`));
  assert.strictEqual(prove['A-5012'].Account, 'm.ortiz');
  // Decoy discriminators: failure-then-success pairs resolve on the same usual IP.
  const pair = (ds, f, s, acct, ip) => {
    assert.ok(ds.records[f].Result === 'Failure' && ds.records[s].Result === 'Success' && ds.records[f].Account === acct && ds.records[s].Account === acct);
    assert.ok(ds.records[f].SourceIp === ip && ds.records[s].SourceIp === ip);
    assert.ok(ds.tables.IdentityInfo.find((i) => i.Account === acct).UsualSourceIp === ip);
  };
  pair(m3.practice, 'A-1012', 'A-1013', 'h.diaz', '10.20.4.44');
  pair(m3.prove, 'A-5018', 'A-5019', 'l.brooks', '10.20.4.35');
}

/* ---------- Module 4 assessment fixture ---------- */
{
  const s = load('soc-m04-assessment-data.js', 'SocM04AssessmentData').scenario;
  const t = s.truth;
  assert.ok(s.telemetry.length >= 20 && s.telemetry.length <= 45);
  s.telemetry.forEach((e) => assert.strictEqual(e.source, 'AuthLog', `${e.id} carries EventSource`));
  ok('M04', Schema.validateScenario({
    events: local(s.telemetry), start: s.start, end: s.end,
    references: [{ name: 'truth.benignBackground (telemetry only)', eventIds: t.benignBackgroundEventIds.filter((id) => id.startsWith('M04-A-')) }],
  }, { label: 'M04', recommended: ['EventSource', 'Account', 'Result'] }));
  // Truth for the answer-bearing rule is unchanged.
  assert.deepStrictEqual(local(t.rule.matchEventIds), ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-006']);
  assert.deepStrictEqual(local(t.rule.excludeEventIds), ['M04-A-007', 'M04-A-008', 'M04-A-009']);
  assert.strictEqual(t.rule.threshold, 5);
  // Evaluate the taught rule shapes. Only the spray meets distinct-account threshold 5; background groups appear as lower candidates.
  const pre = ['kql-engine.js', 'soc-m04-assessment-data.js'];
  const evaluator = load('soc-m04-rule-evaluator.js', 'SocM04RuleEvaluator', pre);
  const fixture = load('soc-m04-assessment-data.js', 'SocM04AssessmentData');
  const dc = evaluator.evaluate({ enabled: true, query: 'AuthLog | where EventType == "AuthFailure" | summarize Accounts = dcount(Account) by SourceIp', groupingField: 'SourceIp', threshold: 5, windowMinutes: 20 }, fixture);
  assert.strictEqual(dc.succeeded, true);
  const met = dc.candidates.filter((c) => c.thresholdMet).map((c) => c.group);
  assert.deepStrictEqual(local(met), ['198.51.100.64'], 'distinct-account threshold 5 isolates the spray');
  const groups = Object.fromEntries(dc.candidates.map((c) => [c.group, c.matchCount]));
  assert.strictEqual(groups['203.0.113.140'], 3, 'branch egress: three distinct accounts, below threshold 5');
  assert.ok(Object.keys(groups).length >= 4 && Object.keys(groups).length <= 6, 'four to six candidate groups');
  // Each decoy has a discriminating fact in the same fixture.
  const byId = Object.fromEntries(s.telemetry.map((e) => [e.id, e]));
  ['M04-A-109', 'M04-A-111', 'M04-A-113'].forEach((id, i) => assert.strictEqual(byId[`M04-A-${110 + i * 2}`].account, byId[id].account, 'branch failure is followed by a success for the same account'));
  assert.ok(byId['M04-A-121'].account === 'acct-17' && byId['M04-A-121'].result === 'Success', 'acct-17 re-authenticates after the retries');
  assert.ok(!s.telemetry.some((e) => e.sourceIp === '198.51.100.64' && !/^M04-A-00\d$/.test(e.id)), 'no background rows share the spray source');
  assert.ok(!s.telemetry.some((e) => e.sourceIp === '192.0.2.91'), 'unrelated IOC still has no telemetry match');
}

/* ---------- Inventory-level checks across the loaded portal (guided M04, staircase, independence) ---------- */
{
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'soc-telemetry-inventory.js'), '--json'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  assert.strictEqual(run.status, 0, 'inventory runs');
  const inv = JSON.parse(run.stdout);
  const get = (module, scenario) => inv.scenarios.find((s) => s.module === module && s.scenario === scenario);
  const n = (m, sc) => get(m, sc).uniqueSourceEvents;
  assert.ok(n(1, 'guided') >= 8 && n(1, 'guided') <= 18 && n(2, 'guided') >= 8 && n(2, 'guided') <= 18, 'M01-M02 guided in the focused band');
  [[3, 'guided'], [3, 'assessment'], [4, 'guided'], [4, 'assessment']].forEach(([m, sc]) => {
    assert.ok(n(m, sc) >= 20 && n(m, sc) <= 45, `M0${m} ${sc} in band (got ${n(m, sc)})`);
    assert.ok(get(m, sc).sourceTableCount >= 4 && get(m, sc).sourceTableCount <= 6, `M0${m} ${sc} source count`);
  });
  assert.ok(n(3, 'assessment') > (n(2, 'assessment') || 0) && n(3, 'assessment') <= n(4, 'assessment'), 'assessment staircase M02 < M03 <= M04');
  assert.ok(n(2, 'guided') > n(1, 'guided') && n(3, 'guided') > n(2, 'guided'), 'guided staircase rises M01 < M02 < M03');
  [3, 4].forEach((m) => {
    const ind = inv.independence[String(m)];
    assert.strictEqual(ind.sharedEventIds, 0);
    assert.deepStrictEqual(ind.sharedEntities, { accounts: 0, hosts: 0, ips: 0, domains: 0, sessions: 0 }, `M0${m} guided and assessment share no entities`);
    assert.strictEqual(ind.verdict, 'independent');
  });
}

console.log('soc-telemetry-sprint2 tests passed');

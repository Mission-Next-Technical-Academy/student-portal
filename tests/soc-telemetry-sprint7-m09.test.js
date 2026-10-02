#!/usr/bin/env node
/* Sprint 7 density top-up for Module 09 (incident response): assessment and guided consoles carry at least
 * 96 unique events, every row follows the entity identity contract, the answer keys and alert query results are
 * unchanged, and containment is still never recovery. */
const path = require('path');
const assert = require('assert');
const inv = require(path.join(__dirname, '..', 'scripts', 'soc-telemetry-inventory.js'));

const { ctx } = inv.loadPortal();
const live = (expr) => inv.evalLive(ctx, expr);
const local = (v) => JSON.parse(JSON.stringify(v));
const Schema = live('SocTelemetrySchema');
const Kql = live('MnKql');

const NON_EVENT = new Set(['UnifiedEvents', 'IdentityInfo', 'IpIntel']);
function sourceRows(dataset) {
  return Object.entries(dataset.tables).filter(([name, list]) => !NON_EVENT.has(name) && Array.isArray(list) && list.some((r) => r && r.__rid))
    .flatMap(([, list]) => list);
}

const HOST = /^[a-z0-9][a-z0-9._-]*$/;
const cases = [
  { name: 'assessment', ds: 'MODULE_NINE_CONSOLE_DATA', sc: 'SocM09AssessmentData.scenario', prefix: 'M09-', affected: ['ws-173', 'fs-02'], account: 'acct-173', passed: 'db-02' },
  { name: 'guided', ds: 'MODULE_NINE_GUIDED_CONSOLE_DATA', sc: 'MODULE_NINE_GUIDED_FIXTURE.scenario', prefix: 'M09G-', affected: ['ws-294', 'fs-05'], account: 'acct-294', passed: 'db-05' },
];
const loaded = {};
for (const c of cases) {
  const dataset = live(c.ds);
  const scenario = local(live(c.sc));
  const rows = sourceRows(dataset);
  const ids = rows.map((r) => r.EventId);
  loaded[c.name] = { dataset, scenario, rows };

  // Volume: the staircase target (M09 >= 96) inside the Sprint 4 band (<= 100); EventIds unique across tables.
  assert.strictEqual(new Set(ids).size, ids.length, `${c.name}: EventIds are unique across source tables`);
  assert.ok(ids.length >= 96 && ids.length <= 100, `${c.name}: ${ids.length} unique events (want 96-100)`);
  const v = Schema.validateEvents(rows.map((r) => ({ ...r })), { start: scenario.start, end: scenario.end, label: `M09 ${c.name}` });
  assert.deepStrictEqual(local(v.errors), [], `${c.name}: schema errors`);

  // Every telemetry row carries an instructor-only classification and purpose.
  for (const t of scenario.telemetry) {
    assert.ok(['benign_background', 'incident_context'].includes(t.classification), `${t.id} classification`);
    assert.ok(typeof t.purpose === 'string' && t.purpose.length > 10, `${t.id} purpose`);
  }
  const added = scenario.telemetry.filter((t) => Number(t.id.slice(-3)) >= 55);
  assert.strictEqual(added.length, 27, `${c.name}: Sprint 7 adds 27 telemetry rows`);
  assert.ok(added.every((t) => /^(background|alternate-explanation|scope-check|evidence-quality|before\/after|recovery validation):/.test(t.purpose)), 'Sprint 7 rows state a purpose class');

  // Entity identity contract: lower-case host token, DeviceId = Host, no blank Account on these host/ops tables.
  for (const r of rows) {
    if (r.Host != null && r.Host !== '') assert.ok(HOST.test(r.Host), `${r.EventId} Host ${r.Host} is a lower-case host token`);
    if (r.DeviceId) assert.strictEqual(r.DeviceId, r.Host, `${r.EventId} DeviceId equals Host`);
    assert.ok('Host' in r ? r.Host : true, `${r.EventId} has no blank Host key`);
    assert.ok(r.Account && r.Account === r.Account.toLowerCase(), `${r.EventId} Account is a non-empty lower-case principal`);
  }

  // Containment is not recovery: nothing passes for the affected systems or account.
  const rc = rows.filter((r) => r.EventSource === 'RecoveryChecks');
  const affected = rc.filter((r) => c.affected.includes(r.Host) || r.Account === c.account);
  assert.ok(affected.length >= 4 && affected.every((r) => ['not_run', 'pending', 'in_progress'].includes(r.Result)), `${c.name}: no recovery validation passed for affected entities`);
  assert.deepStrictEqual(local(rc.filter((r) => r.Result === 'passed').map((r) => r.Host)), [c.passed], `${c.name}: the only passed check is the unrelated system`);

  // Negative claims stay true: no second endpoint matches the impact pattern, and no egress beyond the documented services.
  const sweeps = rows.filter((r) => r.EventSource === 'ScopeChecks' && r.EventType === 'impact_pattern_search');
  assert.ok(sweeps.length >= 7 && sweeps.every((r) => ['no_match', 'not_assessable'].includes(r.Result)), `${c.name}: scope sweeps return no match or are explicitly not assessable`);
  const ownHost = c.affected[0];
  rows.filter((r) => r.EventType === 'file_change_rate' && r.Host !== ownHost)
    .forEach((r) => assert.ok(/extensions unchanged/.test(r.Detail), `${r.EventId}: other-host file changes keep extensions unchanged`));
  const egress = new Set(rows.filter((r) => r.EventSource === 'DeviceNetworkEvents').map((r) => r.DestinationIp));
  assert.strictEqual(egress.size, 3, `${c.name}: network rows reach only the share, update and management services`);
}

// Guided and assessment stay independent: no shared hosts, EventIds or destination addresses.
const values = (name, key) => new Set(loaded[name].rows.map((r) => String(r[key] || '').toLowerCase()).filter(Boolean));
for (const key of ['EventId', 'Host', 'DeviceId', 'AssetId', 'DestinationIp', 'SourceIp']) {
  const g = values('guided', key);
  assert.deepStrictEqual([...values('assessment', key)].filter((x) => g.has(x) && x !== '—'), [], `no shared ${key} values`);
}

// Answer keys, expected evidence and alert results are unchanged by the top-up.
const data = live('SocM09AssessmentData');
assert.deepStrictEqual(local(data.expectedResponseTruth), {
  incidentId: 'INC-4937', priority: 'critical', ownershipRoute: 'ir-lead-owners', confirmedImpact: ['ws-173'],
  identityConcern: { accountId: 'acct-173', remoteSessionEvidenceId: 'M09-E06', ownerDenialEvidenceId: 'M09-E07' },
  observedServiceImpact: ['fs-02'],
  scopeBoundary: { broaderCompromise: 'not-established', exfiltration: 'not-established', evidenceIds: ['M09-E09', 'M09-E10'] },
  responsePrinciples: [
    'Preserve evidence before eradication.',
    'Use proportionate containment for confirmed affected entities and obtain required approval.',
    'Verify action outcomes; isolation alone does not establish eradication or recovery.',
    'Do not claim enterprise-wide compromise or that the wider environment is clean.',
  ],
}, 'M09 response truth unchanged');
assert.deepStrictEqual(local(live('MODULE_NINE_EXPECTED_EVIDENCE')), ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E06', 'M09-E07', 'M09-E08', 'M09-E09']);
assert.deepStrictEqual(local(data.scenario.sourceEvidenceIds), ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05', 'M09-E06', 'M09-E07', 'M09-E08', 'M09-E09', 'M09-E10']);
assert.deepStrictEqual(local(data.scenario.backups.map((b) => [b.recoveryPointId, b.targetEntityId, b.knownGood])),
  [['RP-WS-173-0918', 'DEV-173', true], ['RP-WS-173-0948', 'DEV-173', false], ['RP-FS-02-0900', 'DEV-FS-02', false]], 'recovery points unchanged');
assert.strictEqual(data.validateScenario(data.scenario), true);

const expectedAlertRows = {
  'INC-4937': ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-T-001', 'M09-T-002', 'M09-T-003', 'M09-T-004', 'M09-T-005', 'M09-T-006'],
  'M09-ALERT-001': ['M09-T-007', 'M09-T-010'],
  'M09-ALERT-002': ['M09-T-019', 'M09-T-020'],
  'M09-ALERT-003': ['M09-T-022'],
  'M09-ALERT-004': ['M09-E05', 'M09-E06', 'M09-E07', 'M09-T-028', 'M09-T-031'],
  'M09-ALERT-005': ['M09-T-040'],
  'M09-ALERT-006': ['M09-T-049', 'M09-T-050', 'M09-T-051'],
};
const { dataset } = loaded.assessment;
assert.deepStrictEqual(local(dataset.alerts.map((a) => a.id)), Object.keys(expectedAlertRows), 'alert queue unchanged');
for (const a of dataset.alerts) {
  const result = Kql.evaluate(a.query, dataset.tables, { now: dataset.now });
  assert.strictEqual(result.error, null);
  assert.deepStrictEqual(Array.from(result.rows).map((r) => r.EventId).sort(), expectedAlertRows[a.id], `${a.id} query returns the same rows`);
}

// Course staircase: M09 meets its target and stays below M10.
const scenarios = inv.buildInventory().scenarios;
const asm = (m) => scenarios.find((x) => x.module === m && x.scenario === 'assessment');
assert.ok(asm(9).uniqueSourceEvents >= 96, `inventory M09 assessment ${asm(9).uniqueSourceEvents} >= 96`);
assert.ok(asm(9).uniqueSourceEvents < asm(10).uniqueSourceEvents, 'M09 stays below M10');

console.log(`sprint7 M09 telemetry ok (${loaded.assessment.rows.length} assessment / ${loaded.guided.rows.length} guided events)`);

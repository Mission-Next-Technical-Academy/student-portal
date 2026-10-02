#!/usr/bin/env node
/* Sprint 4 (Modules 7-9) telemetry enrichment: schema validity, volume bands, alert queries, independence,
 * correlation hinges and response-vs-recovery semantics. Loads the portal SOC scripts in a stubbed vm. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const PORTAL = path.join(__dirname, '..', 'portal');
function stub() {
  const noop = () => {};
  const handler = { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : (k === 'style' || k === 'dataset' || k === 'classList') ? new Proxy({}, { get: () => noop }) : stub()), apply: () => stub() };
  return new Proxy(function () {}, handler);
}
function loadPortal() {
  const html = fs.readFileSync(path.join(PORTAL, 'index.html'), 'utf8');
  const wanted = /^(data|lab-runtime|module-registry|case-record|console-guide|soc-|kql-engine|kql-editor|attack-catalog)/;
  const files = [];
  for (const m of html.matchAll(/<script src="([^"?]+)/g)) {
    const f = m[1];
    if (f.startsWith('vendor/') || !wanted.test(f) || files.includes(f) || !fs.existsSync(path.join(PORTAL, f))) continue;
    files.push(f);
  }
  const noop = () => {};
  const ctx = { console: { log: noop, warn: noop, error: noop, info: noop, debug: noop }, setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop, document: stub(), localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, navigator: {}, esc: (v) => String(v == null ? '' : v) };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext('Math.random = () => 0.5;', ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
const ctx = loadPortal();
const live = (expr) => vm.runInContext(expr, ctx);
const Schema = live('SocTelemetrySchema');
const Kql = live('MnKql');

const NON_EVENT = new Set(['UnifiedEvents', 'IdentityInfo', 'IpIntel']);
function sourceRows(dataset) {
  const rows = [];
  for (const [name, list] of Object.entries(dataset.tables)) {
    if (NON_EVENT.has(name) || !Array.isArray(list) || !list.some((r) => r && r.__rid)) continue;
    for (const r of list) rows.push(r);
  }
  return rows;
}
const unique = (rows) => [...new Map(rows.map((r) => [r.EventId, r])).values()];
const tablesWithEvents = (dataset) => Object.entries(dataset.tables).filter(([n, l]) => !NON_EVENT.has(n) && Array.isArray(l) && l.some((r) => r && r.__rid)).map(([n]) => n);

const cases = [
  { name: 'M07 assessment', ds: 'MODULE_SEVEN_CONSOLE_DATA', sc: 'SocM07AssessmentData.scenario', min: 50, minTables: 7 },
  { name: 'M07 guided', ds: 'MODULE_SEVEN_GUIDED_CONSOLE_DATA', sc: 'MODULE_SEVEN_GUIDED_FIXTURE.scenario', min: 50, minTables: 7 },
  { name: 'M08 assessment', ds: 'MODULE_EIGHT_CONSOLE_DATA', sc: 'SocM08AssessmentData.scenario', min: 50, minTables: 7, historicalFrom: '2026-05-01T00:00:00Z' },
  { name: 'M08 guided', ds: 'MODULE_EIGHT_GUIDED_CONSOLE_DATA', sc: 'MODULE_EIGHT_GUIDED_FIXTURE.scenario', min: 50, minTables: 7, historicalFrom: '2026-05-01T00:00:00Z' },
  { name: 'M09 assessment', ds: 'MODULE_NINE_CONSOLE_DATA', sc: 'SocM09AssessmentData.scenario', min: 50, minTables: 7 },
  { name: 'M09 guided', ds: 'MODULE_NINE_GUIDED_CONSOLE_DATA', sc: 'MODULE_NINE_GUIDED_FIXTURE.scenario', min: 50, minTables: 7 },
];
const loaded = {};
for (const c of cases) {
  const dataset = live(c.ds);
  const scenario = JSON.parse(JSON.stringify(live(c.sc)));
  const rows = sourceRows(dataset);
  const events = unique(rows);
  loaded[c.name] = { dataset, scenario, rows, events };

  // 1. Unique EventIds across every source table; schema validation has zero errors.
  assert.strictEqual(events.length, rows.length, `${c.name}: no duplicate EventIds across source tables`);
  const v = Schema.validateEvents(events, { start: c.historicalFrom || scenario.start, end: scenario.end, eventRefFields: ['RelatedEventIds'], label: c.name });
  assert.deepStrictEqual(Array.from(v.errors), [], `${c.name}: schema errors`);

  // 2. Volume and source-count bands.
  assert.ok(events.length >= c.min && events.length <= 100, `${c.name}: ${events.length} unique events inside 50-100`);
  assert.ok(tablesWithEvents(dataset).length >= c.minTables && tablesWithEvents(dataset).length <= 10, `${c.name}: source tables in 7-10`);
  const alerts = dataset.alerts || [];
  assert.ok(alerts.length >= 5 && alerts.length <= 10, `${c.name}: ${alerts.length} alert candidates in 5-10`);
  assert.strictEqual(new Set(alerts.map((a) => a.id)).size, alerts.length, `${c.name}: alert ids unique`);

  // 3. Every alert query returns at least one row (a candidate must be investigable).
  for (const a of alerts) {
    const result = Kql.evaluate(a.query, dataset.tables, { now: dataset.now });
    assert.strictEqual(result.error, null, `${c.name} ${a.id}: query runs (${result.error})`);
    assert.ok(result.rows.length > 0, `${c.name} ${a.id}: query matches at least one row`);
    const t = Date.parse(a.time);
    assert.ok(t >= Date.parse(c.historicalFrom ? scenario.start : scenario.start) && t <= Date.parse(scenario.end), `${c.name} ${a.id}: alert time inside window`);
  }
}

/* ---------- guided / assessment independence (new rows) ---------- */
function ids(name) { return new Set(loaded[name].events.map((e) => e.EventId)); }
function values(name, key) { return new Set(loaded[name].events.map((e) => String(e[key] || '').toLowerCase()).filter((v) => v && v !== '—')); }
for (const m of ['M07', 'M08', 'M09']) {
  const a = `${m} assessment`; const g = `${m} guided`;
  const sharedIds = [...ids(a)].filter((id) => ids(g).has(id));
  assert.deepStrictEqual(sharedIds, [], `${m}: guided and assessment share no EventIds`);
  for (const key of ['Host', 'DestinationIp', 'Domain']) {
    const shared = [...values(a, key)].filter((x) => values(g, key).has(x));
    assert.deepStrictEqual(shared, [], `${m}: no shared ${key} values (${shared.join(', ')})`);
  }
  const sig = (e) => ['EventType', 'Account', 'Host', 'DeviceId', 'SourceIp', 'DestinationIp', 'Domain', 'Url', 'Detail'].map((k) => String(e[k] ?? '').toLowerCase()).join('|');
  const gs = new Set(loaded[g].events.map(sig));
  assert.strictEqual(loaded[a].events.filter((e) => gs.has(sig(e))).length, 0, `${m}: no content-identical rows between guided and assessment`);
}

/* ---------- Module 7: correlation, retries, native vs normalized ---------- */
{
  const { dataset, scenario, events } = loaded['M07 assessment'];
  const by = (t) => events.filter((e) => e.EventSource === t);
  assert.ok(['EmailUrlEvents', 'EmailAttachmentEvents'].every((t) => by(t).length > 0), 'M07 adds URL-protection and attachment-scan sources');
  assert.deepStrictEqual(scenario.expectedTruth.alertDispositions.map((d) => d.alertId).sort(), Array.from(dataset.alerts).map((a) => a.id).filter((id) => id !== 'ALT-7101').sort(), 'every background alert has an instructor disposition');
  // Retry: the same NetworkMessageId has a deferral and a later successful delivery, not two incidents.
  const mail = by('EmailEvents');
  const retried = mail.filter((e) => e.EventType === 'message_deferral');
  assert.strictEqual(retried.length, 1);
  const retryDelivery = mail.filter((e) => e.NetworkMessageId === retried[0].NetworkMessageId && e.EventType === 'message_delivery');
  assert.strictEqual(retryDelivery.length, 1);
  assert.ok(Date.parse(retryDelivery[0].TimeGenerated) > Date.parse(retried[0].TimeGenerated));
  // Related-but-not-matching sender: brand token in the domain, authentication aligned.
  const brand = mail.filter((e) => /northwind-/.test(e.Sender));
  assert.ok(brand.some((e) => e.Dmarc === 'fail') && brand.some((e) => e.Dmarc === 'pass'), 'similar-brand senders differ on authentication');
  // Correlation hinge: the two first-seen-domain alerts differ only by the mail evidence behind the click.
  const fsPhish = dataset.alerts.find((a) => a.id === 'ALT-7102'); const fsBenign = dataset.alerts.find((a) => a.id === 'ALT-7103');
  assert.strictEqual(fsPhish.rule, fsBenign.rule, 'same rule fires on both');
  const mailToDevice = (dev) => { const clicks = by('EmailInteractionEvents').filter((e) => e.DeviceId === dev && /click/.test(e.EventType)); return clicks.map((c) => mail.find((m) => m.NetworkMessageId === c.NetworkMessageId && m.Account === c.Account)); };
  assert.ok(mailToDevice('WS-517').every((m) => m && m.Dmarc === 'fail'), 'WS-517 click traces to a DMARC-failed delivery');
  assert.ok(mailToDevice('WS-311').every((m) => m && m.Dmarc === 'pass' && m.Spf === 'pass'), 'WS-311 click traces to an aligned, authenticated delivery');
  // Periodic updater: three cadence-matching proxy requests backed by a signed process.
  assert.strictEqual(by('ProxyEvents').filter((e) => e.DeviceId === 'WS-402' && /\/v2\/check/.test(e.Url)).length, 3);
  assert.strictEqual(by('DeviceProcessEvents').filter((e) => e.DeviceId === 'WS-402' && e.Signer).length, 3);
  // Case-workspace arrays are untouched: the original answer-bearing rows still exist unchanged.
  ['M07-DELIVERY-001', 'M07-DELIVERY-002', 'M07-QR-014', 'M07-DNS-001', 'M07-TLS-001'].forEach((id) => assert.ok(events.some((e) => e.EventId === id), `${id} still present`));
  assert.strictEqual(scenario.messages.length, 1);
  const refs = Schema.validateScenario({ events: events.map((e) => ({ ...e })), references: [{ name: 'benignBackgroundEventIds', eventIds: scenario.expectedTruth.benignBackgroundEventIds }] }, { eventRefFields: ['RelatedEventIds'] });
  assert.deepStrictEqual(Array.from(refs.errors), [], 'M07 truth references resolve to events');
}

/* ---------- Module 8: asset context, deprioritisation, remediation status ---------- */
{
  const { dataset, scenario, events } = loaded['M08 assessment'];
  const findingIds = new Set(scenario.findings.map((f) => f.id));
  const assets = new Set(scenario.assetInventory.map((a) => a.assetId));
  assert.ok(scenario.assetInventory.length >= 5 && scenario.findings.length >= 8);
  for (const f of scenario.findings) assert.ok(assets.has(f.assetId), `${f.id} references an inventory asset`);
  for (const a of scenario.alertCandidates) a.findingIds.forEach((id) => assert.ok(findingIds.has(id), `${a.id} references ${id}`));
  for (const r of [...scenario.scanRuns, ...scenario.patchRecords]) assert.ok(assets.has(r.assetId), `${r.id} references an inventory asset`);
  // Highest CVSS findings are not the expected priority: asset context and applicability must outweigh the score.
  const priority = scenario.findings.find((f) => f.assetId === scenario.expectedPriority.assetId);
  assert.strictEqual(priority.id, 'M08-FINDING-001');
  const high = scenario.findings.filter((f) => f.cvss.baseScore >= 9);
  assert.ok(high.length >= 2 && high.every((f) => f.id !== priority.id), 'CVSS >= 9 findings exist and none is the expected priority');
  const hasIsolation = scenario.assetInventory.find((a) => a.assetId === 'LAB-BUILD-03');
  assert.strictEqual(hasIsolation.exposure.status, 'not-exposed');
  // Reachability linkage: DB-REP-11 is reachable only from APP-DMZ-22, which is reachable only from the answer asset.
  assert.deepStrictEqual(scenario.assetInventory.find((a) => a.assetId === 'DB-REP-11').reachability.reachableFrom, ['APP-DMZ-22']);
  assert.deepStrictEqual(scenario.assetInventory.find((a) => a.assetId === 'APP-DMZ-22').reachability.reachableFrom, ['WEB-DMZ-14']);
  // Planned change is not a fix.
  assert.ok(scenario.patchRecords.every((p) => !/^(applied|completed|closed)$/.test(p.status)), 'no patch record claims remediation is complete');
  // The critical-CVSS alert matches only findings that context and applicability deprioritise.
  const rows = Kql.evaluate(dataset.alerts.find((a) => a.id === 'M08-ALERT-001').query, dataset.tables, { now: dataset.now }).rows;
  assert.deepStrictEqual(Array.from(rows).map((r) => r.EventId).sort(), ['M08-FINDING-005', 'M08-FINDING-007']);
  assert.ok(events.some((e) => e.EventSource === 'ScanRuns' && e.Result === 'credential_failure'), 'a credential-failure scan run explains the stale finding');
  const refs = Schema.validateScenario({ events: events.map((e) => ({ ...e })), alerts: scenario.alertCandidates.map((a) => ({ id: a.id, eventIds: a.findingIds })) }, {});
  assert.deepStrictEqual(Array.from(refs.errors), [], 'M08 alert evidence references resolve');
}

/* ---------- Module 9: before/after response telemetry; containment never implies recovery ---------- */
{
  const { dataset, scenario, events } = loaded['M09 assessment'];
  const by = (t) => events.filter((e) => e.EventSource === t);
  const phases = new Set(events.map((e) => e.Phase).filter(Boolean));
  assert.ok(['before', 'before_containment', 'after_containment'].every((p) => phases.has(p)), 'before and after response phases are both present');
  // Every response-action request has a completion record (success, failure, or partial) after it.
  const rr = by('ResponseRecords');
  for (const req of rr.filter((e) => e.EventType === 'action_requested')) {
    const done = rr.find((e) => /^action_(completed|rejected|partial)$/.test(e.EventType) && e.Host === req.Host && Date.parse(e.TimeGenerated) > Date.parse(req.TimeGenerated));
    assert.ok(done, `${req.EventId} has a completion record`);
  }
  assert.ok(rr.some((e) => e.Result === 'success') && rr.some((e) => e.Result === 'failure') && rr.some((e) => e.Result === 'partial'), 'success, failure and partial outcomes all present');
  // Explicit recovery-validation signals exist and none claims recovery for the affected systems.
  const rc = by('RecoveryChecks');
  const affected = rc.filter((e) => ['ws-173', 'fs-02', 'acct-173'].includes(e.Host) || e.Account === 'acct-173');
  assert.ok(affected.length >= 4 && affected.every((e) => ['not_run', 'pending', 'in_progress'].includes(e.Result)), 'no recovery validation has passed for affected entities');
  assert.ok(rc.some((e) => e.Host === 'db-02' && e.Result === 'passed'), 'an unrelated system shows what a passed validation looks like');
  const postContainment = events.filter((e) => /after_containment/.test(e.Phase || '') && e.EventSource !== 'RecoveryChecks');
  assert.ok(postContainment.every((e) => !/\b(recovered|restored successfully|clean state achieved|eradicated)\b/i.test(`${e.Detail} ${e.Result}`.replace(/(not|no|nor|without)\s+(implied|recovered|restored|eradicated|performed|started)/gi, ''))), 'no post-containment row claims recovery or eradication');
  // Isolation blocks the network but local activity continues; identity session outlives device isolation.
  assert.ok(by('DeviceNetworkEvents').some((e) => e.Result === 'blocked_by_isolation'));
  assert.ok(by('DeviceEvents').some((e) => e.Phase === 'after_containment' && /still running|still present|still listed/.test(e.Detail)));
  assert.ok(by('IdentityEvents').some((e) => e.EventType === 'session_active' && /after endpoint isolation/.test(e.Detail)));
  // Alternate explanations: a benign mass-file-change client, a backup job that ended before the outage.
  const syncEvent = by('DeviceEvents').find((e) => e.Host === 'ws-054' && e.EventType === 'file_change_rate');
  const backupDone = by('FileServiceEvents').find((e) => e.EventType === 'backup_agent_job' && e.Result === 'completed');
  const outage = by('FileServiceEvents').find((e) => e.EventType === 'share_unavailable');
  assert.ok(syncEvent && backupDone && outage && Date.parse(backupDone.TimeGenerated) < Date.parse(outage.TimeGenerated));
  assert.ok(by('ScopeChecks').some((e) => e.Result === 'not_assessable'), 'coverage gaps are explicit');
  // Original evidence IDs are intact and still reference-valid.
  ['M09-E01', 'M09-E06', 'M09-E09', 'M09-E15'].forEach((id) => assert.ok(events.some((e) => e.EventId === id), `${id} still present`));
  assert.ok(SocM09Valid(), 'M09 scenario contract still validates');
  function SocM09Valid() { return live('SocM09AssessmentData').validateScenario(live('SocM09AssessmentData').scenario); }
  const refs = Schema.validateScenario({ events: events.map((e) => ({ ...e })), alerts: [] }, {});
  assert.deepStrictEqual(Array.from(refs.errors), []);
  assert.ok(scenario.alertCandidates.every((a) => a.triage && a.triage.disposition));
}

console.log('Sprint 4 (M07-M09) telemetry tests passed.');

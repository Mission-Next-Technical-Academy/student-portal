#!/usr/bin/env node
/* SOC telemetry inventory (Sprint 0). Read-only and deterministic.
 *
 * Loads the portal's SOC scripts into a stubbed `vm` context (same approach as
 * the tests/ scripts), reads the already-built console datasets and fixtures,
 * and reports per Guided/Practice and Assessment/Prove scenario, for modules
 * 1-12: unique source events, queryable tables vs display-only records, alert
 * provenance, canonical-field coverage, distinct entities, benign/coverage
 * tags and guided/assessment independence.
 *
 *   node scripts/soc-telemetry-inventory.js           markdown report
 *   node scripts/soc-telemetry-inventory.js --json    machine-readable JSON
 *   SOC_INVENTORY_FORCE_STATIC=1 ...                  exercise the static fallback
 *
 * Nothing in portal/, ui/ or supabase/ is written. No dependencies beyond the
 * node standard library. A `SocTelemetrySchema` global (added by a later
 * sprint) is deliberately ignored.
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORTAL = path.join(ROOT, 'portal');
const SCRIPT_VERSION = 1;

/* ------------------------------------------------------------- constants */

const CANONICAL_FIELDS = ['TimeGenerated', 'EventId', 'EventSource', 'EventType', 'Account', 'Host/DeviceId', 'SourceIp', 'DestinationIp', 'Domain', 'Url', 'Result', 'SessionId', 'ProcessId', 'ParentProcessId', 'CorrelationId', 'Action', 'Detail', 'RawEvent', 'IngestionTime', 'Collector', 'CoverageStatus'];
// Aliases accepted on the console's UnifiedEvents view (lower-case copies that m03eBuildDataset writes).
const UNIFIED_ALIASES = { Action: 'action', SessionId: 'session_id', SourceIp: 'src_ip', Result: 'outcome', Account: 'user', EventSource: 'source_type', EventId: 'raw_event_id', TimeGenerated: 'timestamp_utc' };
const ISO_UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

// Tables that hold something other than raw telemetry. Anything not listed is a telemetry table.
const TABLE_KIND = {
  AlertQueue: 'alert-record',
  VulnerabilityFindings: 'evidence-record', FindingEvidence: 'evidence-record', AssetEvidence: 'evidence-record',
  IncidentEvidence: 'evidence-record', RiskExceptionEvidence: 'evidence-record',
  ScopeChecks: 'evidence-record', ResponseRecords: 'evidence-record', RecoveryRecords: 'evidence-record',
  ForensicAcquisitions: 'evidence-record', CaseArtifacts: 'evidence-record',
};
const NON_EVENT_TABLES = new Set(['UnifiedEvents', 'IdentityInfo', 'IpIntel']);

// Roadmap "Cross-course progression rule" target bands for unique assessment events (and sources / alerts).
const TARGET_BANDS = [
  { modules: [1, 2], label: 'M01-M02', events: [8, 18], sources: [1, 3], alerts: [1, 3] },
  { modules: [3, 4], label: 'M03-M04', events: [20, 45], sources: [4, 6], alerts: [3, 6] },
  { modules: [5, 6], label: 'M05-M06', events: [35, 70], sources: [5, 8], alerts: [4, 8] },
  { modules: [7, 8, 9], label: 'M07-M09', events: [50, 100], sources: [7, 10], alerts: [5, 10] },
  { modules: [10, 11], label: 'M10-M11', events: [60, 120], sources: [null, null], alerts: [6, 12] },
  { modules: [12], label: 'M12', events: [100, 180], sources: [10, null], alerts: [8, 15] },
];
const bandFor = (m) => TARGET_BANDS.find((b) => b.modules.includes(m));

/* ----------------------------------------------------------- context load */

function makeStubElement() {
  const noop = () => {};
  const handler = {
    get: (t, k) => {
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'length') return 0;
      if (k === 'style' || k === 'dataset' || k === 'classList') return new Proxy({}, { get: () => noop });
      return makeStubElement();
    },
    apply: () => makeStubElement(),
  };
  return new Proxy(function () {}, handler);
}

function loadPortal() {
  const html = fs.readFileSync(path.join(PORTAL, 'index.html'), 'utf8');
  const wanted = /^(data|lab-runtime|module-registry|case-record|console-guide|soc-|kql-engine|kql-editor|attack-catalog)/;
  const files = [];
  for (const m of html.matchAll(/<script src="([^"?]+)/g)) {
    const f = m[1];
    if (f.startsWith('vendor/') || !wanted.test(f) || files.includes(f)) continue;
    if (fs.existsSync(path.join(PORTAL, f))) files.push(f);
  }
  const noop = () => {};
  const ctx = {
    console: { log: noop, warn: noop, error: noop, info: noop, debug: noop },
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    document: makeStubElement(),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    navigator: {}, esc: (v) => String(v == null ? '' : v),
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext('Math.random = () => 0.5;', ctx);
  const loadErrors = [];
  for (const f of files) {
    try { vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f }); }
    catch (e) { loadErrors.push({ file: f, error: String(e.message).slice(0, 160) }); }
  }
  return { ctx, files, loadErrors };
}

const plain = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
function evalIn(ctx, expr) {
  try { return plain(vm.runInContext(expr, ctx)); } catch (e) { return undefined; }
}
// Datasets keep getters/proxies; copy them without JSON round-tripping the large table graph twice.
function evalLive(ctx, expr) {
  try { return vm.runInContext(expr, ctx); } catch (e) { return undefined; }
}

/* --------------------------------------------------------------- helpers */

const isEmpty = (v) => v === undefined || v === null || v === '' || v === '—' || v === '-' || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) || (Array.isArray(v) && v.length === 0);
const sorted = (iter) => [...iter].sort();
const lc = (v) => String(v).toLowerCase();
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

function fieldValue(row, field, aliasFn) {
  if (field === 'Host/DeviceId') return !isEmpty(row.Host) ? row.Host : (!isEmpty(row.DeviceId) ? row.DeviceId : (aliasFn ? aliasFn(row, 'Host') : undefined));
  const v = row[field];
  if (!isEmpty(v)) return v;
  return aliasFn ? aliasFn(row, field) : undefined;
}
const unifiedAlias = (row, field) => {
  if (field === 'Host') return row.host;
  const a = UNIFIED_ALIASES[field];
  return a ? row[a] : undefined;
};

function coverage(rows, aliasFn) {
  const out = {};
  for (const f of CANONICAL_FIELDS) {
    let n = 0;
    for (const row of rows) {
      const v = fieldValue(row, f, aliasFn);
      if (isEmpty(v)) continue;
      if (f === 'TimeGenerated' && !ISO_UTC.test(String(v))) continue;
      n += 1;
    }
    out[f] = { count: n, pct: pct(n, rows.length) };
  }
  return out;
}

function entitiesOf(rows) {
  const accounts = new Set(); const hosts = new Set(); const ips = new Set(); const domains = new Set(); const sessions = new Set(); const processes = new Set();
  for (const r of rows) {
    if (!isEmpty(r.Account)) accounts.add(lc(r.Account));
    if (!isEmpty(r.Host)) hosts.add(lc(r.Host));
    if (!isEmpty(r.DeviceId)) hosts.add(lc(r.DeviceId));
    for (const k of ['SourceIp', 'DestinationIp']) if (!isEmpty(r[k]) && IPV4.test(String(r[k]))) ips.add(String(r[k]));
    if (!isEmpty(r.Domain)) domains.add(lc(r.Domain));
    if (!isEmpty(r.SessionId)) sessions.add(String(r.SessionId));
    if (!isEmpty(r.ProcessId)) processes.add(String(r.ProcessId));
  }
  return { accounts, hosts, ips, domains, sessions, processes };
}
const entityCounts = (e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.size]));

const BENIGN_PATH = /benign|noise|unrelated|distract|decoy|exclude|falsepositive|false_positive|comparator/i;
const COVERAGE_PATH = /coverage|collector|gap|delay|caveat/i;
const BENIGN_VALUE = /benign|noise|noisy|unrelated|distract|decoy|false.?positive/i;

// Collect event ids that the fixture's own truth/tag fields mark as benign or coverage-related.
function collectTags(knownIds, truth, fixtureArrays) {
  const benign = new Set(); const cover = new Set();
  const walk = (node, trail) => {
    if (typeof node === 'string') {
      if (knownIds.has(node)) {
        if (BENIGN_PATH.test(trail)) benign.add(node);
        if (COVERAGE_PATH.test(trail)) cover.add(node);
      }
      return;
    }
    if (Array.isArray(node)) { node.forEach((v) => walk(v, trail)); return; }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && knownIds.has(k) && BENIGN_VALUE.test(v)) benign.add(k);
        walk(v, `${trail}.${k}`);
      }
    }
  };
  if (truth) walk(truth, 'truth');
  for (const arr of fixtureArrays || []) {
    for (const row of arr) {
      if (!row || typeof row !== 'object') continue;
      const id = row.id || row.eventId;
      if (!id || !knownIds.has(id)) continue;
      for (const k of ['class', 'classification', 'signalClass', 'relevance', 'truth', 'tag']) {
        if (typeof row[k] === 'string' && BENIGN_VALUE.test(row[k])) benign.add(id);
      }
      if (row.benign === true) benign.add(id);
    }
  }
  return { benign, cover };
}

/* ------------------------------------------------- scenario normalisation */

// Turn a console dataset (m03eBuildDataset output) into the shared scenario record shape.
function fromDataset(dataset, opts) {
  const tables = []; const byId = new Map(); const dupes = []; let viewRows = 0;
  const lookups = { IdentityInfo: (dataset.tables.IdentityInfo || []).length, IpIntel: (dataset.tables.IpIntel || []).length, watchlists: {} };
  const watchNames = new Set(Object.keys(dataset.watchlists || {}));
  for (const [name, rows] of Object.entries(dataset.tables)) {
    viewRows += rows.length;
    if (watchNames.has(name)) { lookups.watchlists[name] = rows.length; continue; }
    if (NON_EVENT_TABLES.has(name) || !rows.length || !rows.some((r) => r && r.__rid)) continue;
    const kind = TABLE_KIND[name] || 'event';
    tables.push({ name, kind, queryable: true, rows: rows.length });
    for (const r of rows) {
      const id = r.EventId || r.__rid;
      if (byId.has(id)) { dupes.push({ id, tables: [byId.get(id).table, name] }); continue; }
      byId.set(id, { row: r, table: name, kind });
    }
  }
  tables.sort((a, b) => a.name.localeCompare(b.name));
  const unified = dataset.tables.UnifiedEvents || [];
  const unifiedOk = unified.every((u) => byId.has(u.__rid));
  const alertIds = new Set(); const alerts = [];
  for (const a of dataset.alerts || []) { if (!alertIds.has(a.id)) { alertIds.add(a.id); alerts.push(a); } }
  return {
    byId, tables, lookups, alerts, viewRows, dupes,
    unifiedViewRows: unified.length, unifiedMatchesSource: unifiedOk,
    unifiedRows: unified, caseId: dataset.caseId,
  };
}

function finishScenario(base, ctxInfo) {
  const { byId } = base;
  const eventRows = []; const evidenceRows = []; const alertRecordRows = [];
  for (const { row, kind } of byId.values()) (kind === 'event' ? eventRows : kind === 'evidence-record' ? evidenceRows : alertRecordRows).push(row);
  const sourceRows = eventRows.concat(evidenceRows); // "unique source events" = telemetry + evidence-record rows
  const ids = new Set(byId.keys());
  const tags = collectTags(ids, ctxInfo.truth, ctxInfo.fixtureArrays);
  for (const id of ctxInfo.extraBenign || []) if (ids.has(id)) tags.benign.add(id);
  const structuralCoverage = sourceRows.filter((r) => r.Result === 'Delayed' || /collector|heartbeat|ingestion|gap/i.test(String(r.EventType || ''))).length;
  const changeLinked = sourceRows.filter((r) => !isEmpty(r.ChangeId)).length;
  const tagged = tags.benign.size + tags.cover.size > 0;
  const unifiedCov = base.unifiedRows.length ? coverage(base.unifiedRows, unifiedAlias) : null;
  const ent = entitiesOf(sourceRows);
  const alertRefs = base.alerts.flatMap((a) => a.entities || []);
  const known = new Set([...ent.accounts, ...ent.hosts, ...ent.ips, ...ent.sessions, ...ent.domains]);
  const resolved = alertRefs.filter((e) => known.has(lc(e)) || known.has(String(e))).length;
  // Fixture arrays whose rows are not events: reported as context/display records.
  const context = {};
  for (const [key, arr] of Object.entries(ctxInfo.fixtureArrays ? ctxInfo.fixtureArraysByKey : {})) {
    const idKey = (r) => r.id || r.eventId;
    const mapped = arr.filter((r) => ids.has(idKey(r))).length;
    context[key] = { rows: arr.length, mappedIntoTables: mapped };
  }
  return {
    module: ctxInfo.module, scenario: ctxInfo.scenario, label: ctxInfo.label, caseId: ctxInfo.caseId || base.caseId || null,
    method: ctxInfo.method, methodNote: ctxInfo.methodNote || '',
    uniqueSourceEvents: sourceRows.length,
    telemetryEvents: eventRows.length, evidenceRecords: evidenceRows.length, alertRecordRows: alertRecordRows.length,
    duplicateEventIds: base.dupes,
    queryableEvents: ctxInfo.queryable === false ? 0 : sourceRows.length,
    displayOnlyEvents: ctxInfo.queryable === false ? sourceRows.length : 0,
    tables: base.tables, sourceTableCount: base.tables.filter((t) => t.kind !== 'alert-record').length,
    lookups: base.lookups,
    viewRows: base.viewRows + (ctxInfo.extraViewRows || 0),
    unifiedViewRows: base.unifiedViewRows, unifiedCopiesMatchSource: base.unifiedMatchesSource,
    alerts: {
      authored: base.alerts.length, authoredIds: base.alerts.map((a) => a.id).sort(),
      ruleOrLearnerGenerated: 0, note: ctxInfo.alertNote || 'Learner/rule-generated alerts are excluded (zero at baseline).',
      entityRefsResolved: `${resolved}/${alertRefs.length}`,
    },
    entities: entityCounts(ent),
    coverage: coverage(sourceRows),
    unifiedViewCoverage: unifiedCov,
    nonCanonicalFields: nonCanonical(sourceRows),
    tagging: {
      method: tagged ? 'fixture-tags' : 'untagged',
      benignOrDistractor: tagged ? tags.benign.size : 'untagged',
      coverageTagged: tagged ? tags.cover.size : 'untagged',
      benignIds: sorted(tags.benign), coverageIds: sorted(tags.cover),
      structuralCoverageCaveatRows: structuralCoverage, changeLinkedRows: changeLinked,
    },
    context,
    _entities: ent, _signatures: sourceRows.map(signature), _ids: sorted(ids),
  };
}

const CANON_KEYS = new Set(['TimeGenerated', 'EventId', 'EventSource', 'EventType', 'Account', 'Host', 'DeviceId', 'SourceIp', 'DestinationIp', 'Domain', 'Url', 'Result', 'SessionId', 'ProcessId', 'ParentProcessId', 'CorrelationId', 'Action', 'Detail', 'RawEvent', 'IngestionTime', 'Collector', 'CoverageStatus', '__rid']);
function nonCanonical(rows) {
  const counts = {};
  for (const r of rows) for (const k of Object.keys(r)) if (!CANON_KEYS.has(k) && !isEmpty(r[k])) counts[k] = (counts[k] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
function signature(r) {
  return ['EventType', 'Account', 'Host', 'DeviceId', 'SourceIp', 'DestinationIp', 'Domain', 'Url', 'Detail'].map((k) => lc(r[k] == null ? '' : r[k])).join('|');
}

// Group a fixture scenario's arrays of objects (excluding truth) for context/display reporting.
function fixtureArrays(scenario) {
  const byKey = {};
  for (const [k, v] of Object.entries(scenario || {})) {
    if (/^(truth|expected)/i.test(k)) continue;
    if (Array.isArray(v) && v.length && v.every((r) => r && typeof r === 'object' && !Array.isArray(r))) byKey[k] = v;
  }
  return byKey;
}

/* --------------------------------------------------------- M01 and M02 */

function m01Scenario(lab, kind, label, ctx) {
  const s = lab.scenario;
  const roster = s.entityRoster || null;
  const tier = (list, id) => (list || []).find((x) => x.id === id)?.tier;
  const rows = s.logEvents.map((e) => ({
    __rid: e.id, EventId: e.id, EventSource: 'SignInLog', EventType: e.type, Account: e.user,
    Host: String(e.device || '').replace(/\s*\(.*\)$/, ''), SourceIp: e.sourceIp, Result: e.result,
    TimeGenerated: e.raw && e.raw.timestamp, SessionId: e.raw ? e.raw.session_id : undefined, RawEvent: e.raw,
    Detail: '',
  }));
  const byId = new Map(rows.map((r) => [r.EventId, { row: r, table: 'SignInLog (display)', kind: 'event' }]));
  const noise = roster ? s.logEvents.filter((e) => tier(roster.users, e.user) === 'noise').map((e) => e.id) : [];
  const base = {
    byId, tables: [{ name: 'SignInLog (display)', kind: 'event', queryable: false, rows: rows.length }],
    lookups: { IdentityInfo: 0, IpIntel: 0, watchlists: {}, evidenceItems: s.evidence.length, entityRoster: roster ? roster.users.length + roster.devices.length : 0 },
    alerts: [{ id: s.id, entities: [s.entity] }], viewRows: rows.length, dupes: [], unifiedViewRows: 0, unifiedMatchesSource: true, unifiedRows: [], caseId: s.id,
  };
  const arrays = { evidence: s.evidence };
  const out = finishScenario(base, {
    module: 1, scenario: kind, label, caseId: s.id, method: 'runtime', queryable: false,
    methodNote: 'Case-console log pane (paged table); not KQL-queryable. Evidence items are display-only checklist records.',
    truth: null, fixtureArrays: Object.values(arrays), fixtureArraysByKey: arrays, extraBenign: noise, taggingAvailable: Boolean(roster),
    alertNote: 'One authored case alert; no rule engine in this module.',
  });
  out.alerts.entityRefsResolved = 'n/a (alert entity is a label)';
  out._truthText = JSON.stringify({ c: lab.correctVerdict, p: lab.correctPriority, i: lab.correctIntake, k: lab.correctContainment, r: lab.rubric, e: s.evidence });
  return out;
}

// Module 2's console data lives inside an IIFE, so it cannot be read at runtime: static extraction of `const DATA = {...}`.
function m02Scenarios() {
  const file = path.join(PORTAL, 'soc-analyst-module-02-environment.js');
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('const DATA = {');
  const end = start < 0 ? -1 : text.indexOf('\n  };', start);
  let data = null;
  if (start >= 0 && end > start) {
    try { data = vm.runInNewContext(`(${text.slice(start + 'const DATA = '.length, end + 4)})`); } catch (e) { data = null; }
  }
  const legacy = (() => {
    try {
      const c = { esc: (v) => v }; vm.createContext(c);
      const t = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-02.js'), 'utf8');
      const s = t.indexOf('const MODULE_TWO_LAB = {');
      const e = t.indexOf('\n};', s);
      return vm.runInNewContext(`(${t.slice(s + 'const MODULE_TWO_LAB = '.length, e + 2)})`);
    } catch (e) { return null; }
  })();
  const out = [];
  const questionCount = (() => {
    try {
      const t = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-02.js'), 'utf8');
      const a = t.indexOf('const MODULE_TWO_INDEPENDENT_LAB = {'); const b = t.indexOf('\n};', a);
      return vm.runInNewContext(`(${t.slice(a + 'const MODULE_TWO_INDEPENDENT_LAB = '.length, b + 2)})`).questions.length;
    } catch (e) { return null; }
  })();
  if (!data) return { error: 'Module 2 DATA literal not found', scenarios: [] };
  const rows = data.events.map((e) => ({
    __rid: e.id, EventId: e.id, EventSource: 'AccessActivity', Account: e.user, DeviceId: e.device, Result: e.result,
    TimeGenerated: e.time, Detail: '', _resource: e.resource, _policy: e.policy,
  }));
  const byId = new Map(rows.map((r) => [r.EventId, { row: r, table: 'AccessActivity (display)', kind: 'event' }]));
  const violation = data.events.filter((e) => e.violation).map((e) => e.id);
  const base = {
    byId, tables: [{ name: 'AccessActivity (display)', kind: 'event', queryable: false, rows: rows.length }],
    lookups: { IdentityInfo: data.users.length, IpIntel: 0, watchlists: {}, devices: data.devices.length, resources: data.resources.length, policies: data.policies.length },
    alerts: [], viewRows: rows.length, dupes: [], unifiedViewRows: 0, unifiedMatchesSource: true, unifiedRows: [], caseId: null,
  };
  const guided = finishScenario(base, {
    module: 2, scenario: 'guided', label: 'Console walkthrough (Learn/Practice console)', caseId: null, method: 'static-extraction',
    methodNote: 'Network & Identity console data is declared inside an IIFE in soc-analyst-module-02-environment.js; read by extracting the DATA literal. Entity inventory (users/devices/resources/policies) is display-only context.',
    queryable: false, truth: null, fixtureArrays: [], fixtureArraysByKey: {}, taggingAvailable: false,
    alertNote: 'No alert queue in this console.',
  });
  guided.alerts.entityRefsResolved = 'n/a';
  guided.tagging.fixtureViolationFlags = violation;
  guided.context = { users: { rows: data.users.length }, devices: { rows: data.devices.length }, resources: { rows: data.resources.length }, policies: { rows: data.policies.length } };
  if (legacy) {
    const legacyRows = ['signins', 'network', 'access'].reduce((n, k) => n + legacy[k].length, 0);
    guided.legacyTrustPathLab = { note: 'Legacy soc-analyst-module-02.js still ships MODULE_TWO_LAB display records (not part of the active console).', signIns: legacy.signins.length, network: legacy.network.length, access: legacy.access.length, total: legacyRows };
  }
  guided._truthText = '';
  const assess = {
    module: 2, scenario: 'assessment', label: 'Prove It (imported Mission Next lab; independent case CASE-MN-317 questions only)', caseId: 'CASE-MN-317',
    method: 'static-extraction',
    methodNote: 'Practice/Prove launch imported labs (portal/imported-labs/mission-next-labs); no event rows are authored in the SOC portal sources. The in-portal MODULE_TWO_INDEPENDENT_LAB carries scenario text and questions only.',
    uniqueSourceEvents: 0, telemetryEvents: 0, evidenceRecords: 0, alertRecordRows: 0, duplicateEventIds: [], queryableEvents: 0, displayOnlyEvents: 0,
    tables: [], sourceTableCount: 0, lookups: { IdentityInfo: 0, IpIntel: 0, watchlists: {} }, viewRows: 0, unifiedViewRows: 0, unifiedCopiesMatchSource: true,
    alerts: { authored: 0, authoredIds: [], ruleOrLearnerGenerated: 0, note: 'None authored in portal sources.', entityRefsResolved: 'n/a' },
    entities: { accounts: 0, hosts: 0, ips: 0, domains: 0, sessions: 0, processes: 0 },
    coverage: coverage([]), unifiedViewCoverage: null, nonCanonicalFields: {},
    tagging: { method: 'untagged', benignOrDistractor: 'untagged', coverageTagged: 'untagged', benignIds: [], coverageIds: [], structuralCoverageCaveatRows: 0, changeLinkedRows: 0 },
    context: { questions: { rows: questionCount } },
    _entities: entitiesOf([]), _signatures: [], _ids: [], _truthText: '',
  };
  out.push(guided, assess);
  return { scenarios: out };
}

/* -------------------------------------------------------- M03 - M12 sets */

function datasetScenario(ctx, spec) {
  const dataset = evalLive(ctx, spec.datasetExpr);
  if (!dataset || !dataset.tables) return null;
  const fx = spec.fixtureExpr ? evalIn(ctx, spec.fixtureExpr) : null;
  const scenario = fx ? (fx.scenario || fx) : null;
  const truth = scenario ? (scenario.truth || scenario.expectedTruth || scenario.expectedPriority || fx.expectedTruth || fx.expectedResponseTruth || fx.expectedPriority || null) : (spec.truthExpr ? evalIn(ctx, spec.truthExpr) : null);
  const arrays = fixtureArrays(scenario || {});
  const base = fromDataset(dataset);
  const out = finishScenario(base, {
    module: spec.module, scenario: spec.scenario, label: spec.label, caseId: dataset.caseId || (scenario && scenario.caseId) || null,
    method: 'runtime', truth: truth || (fx && (fx.expectedTruth || fx.expectedResponseTruth)) || null,
    fixtureArrays: Object.values(arrays), fixtureArraysByKey: arrays, taggingAvailable: Boolean(truth),
    alertNote: spec.alertNote,
  });
  const truthText = JSON.stringify(truth || {}) + (spec.truthExpr ? JSON.stringify(evalIn(ctx, spec.truthExpr) || {}) : '');
  out._truthText = truthText;
  out.fixtureScenarioId = scenario ? scenario.id || null : null;
  out._fixtureJson = fx ? JSON.stringify(scenario) : null;
  return out;
}

const SPECS = [
  { module: 3, scenario: 'guided', label: 'Practice — CASE-MN-428', datasetExpr: 'M03E_DATA.practice' },
  { module: 3, scenario: 'assessment', label: 'Prove — CASE-MN-517', datasetExpr: 'M03E_DATA.prove', truthExpr: 'M03E_RUBRIC' },
  { module: 4, scenario: 'guided', label: 'Guided DET-4478', datasetExpr: 'MODULE_FOUR_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_FOUR_GUIDED_FIXTURE' },
  { module: 4, scenario: 'assessment', label: 'Assessment DET-4424', datasetExpr: 'MODULE_FOUR_CONSOLE_DATA', fixtureExpr: 'SocM04AssessmentData' },
  { module: 5, scenario: 'guided', label: 'Guided endpoint', datasetExpr: 'MODULE_FIVE_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_FIVE_GUIDED_FIXTURE' },
  { module: 5, scenario: 'assessment', label: 'Assessment endpoint', datasetExpr: 'MODULE_FIVE_CONSOLE_DATA', fixtureExpr: 'SocM05AssessmentData' },
  { module: 6, scenario: 'guided', label: 'Guided HNT-6411', datasetExpr: 'MODULE_SIX_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_SIX_GUIDED_FIXTURE' },
  { module: 6, scenario: 'assessment', label: 'Assessment hunt', datasetExpr: 'MODULE_SIX_CONSOLE_DATA', fixtureExpr: 'SocM06AssessmentData' },
  { module: 7, scenario: 'guided', label: 'Guided NEC-0748', datasetExpr: 'MODULE_SEVEN_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_SEVEN_GUIDED_FIXTURE' },
  { module: 7, scenario: 'assessment', label: 'Assessment network/email', datasetExpr: 'MODULE_SEVEN_CONSOLE_DATA', fixtureExpr: 'SocM07AssessmentData' },
  { module: 8, scenario: 'guided', label: 'Guided vulnerability', datasetExpr: 'MODULE_EIGHT_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_EIGHT_GUIDED_FIXTURE' },
  { module: 8, scenario: 'assessment', label: 'Assessment vulnerability', datasetExpr: 'MODULE_EIGHT_CONSOLE_DATA', fixtureExpr: 'SocM08AssessmentData' },
  { module: 9, scenario: 'guided', label: 'Guided response', datasetExpr: 'MODULE_NINE_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_NINE_GUIDED_FIXTURE' },
  { module: 9, scenario: 'assessment', label: 'Assessment INC-4937', datasetExpr: 'MODULE_NINE_CONSOLE_DATA', fixtureExpr: 'SocM09AssessmentData' },
  { module: 10, scenario: 'guided', label: 'Guided evidence handling', datasetExpr: 'MODULE_TEN_GUIDED_CONSOLE_DATA', fixtureExpr: 'MODULE_TEN_GUIDED_FIXTURE' },
  { module: 10, scenario: 'assessment', label: 'Assessment reconstruction', datasetExpr: 'MODULE_TEN_CONSOLE_DATA', fixtureExpr: 'SocM10AssessmentData' },
  { module: 11, scenario: 'guided', label: 'Guided operations', datasetExpr: 'moduleElevenConsoleData(MODULE_ELEVEN_GUIDED_FIXTURE)', fixtureExpr: 'MODULE_ELEVEN_GUIDED_FIXTURE',
    alertNote: 'AlertQueue rows are the authored queue items (also present as dataset alerts); they are counted once, as alerts.' },
  { module: 11, scenario: 'assessment', label: 'Assessment operations', datasetExpr: 'moduleElevenConsoleData()', fixtureExpr: 'SocM11AssessmentData',
    alertNote: 'AlertQueue rows are the authored queue items (also present as dataset alerts); they are counted once, as alerts.' },
  { module: 12, scenario: 'assessment', label: 'Assessment Amber Finch INC-4821', datasetExpr: 'SocM12AssessmentConsole.dataset()', fixtureExpr: 'SocM12AssessmentData' },
];

/* ---------------------------------------------------------- static fallback */

// Fallback when a runtime dataset cannot be built: read the standalone assessment data file in an isolated
// context and count rows of the primary event-like arrays. Guided fixtures live inside module files and are unavailable.
const STATIC_FILES = { 4: ['SocM04AssessmentData', ['telemetry']], 5: ['SocM05AssessmentData', ['telemetry']], 6: ['SocM06AssessmentData', ['telemetry']],
  7: ['SocM07AssessmentData', ['deliveryEvents', 'recipientEvents', 'networkEvents', 'endpointProcessEvents']], 8: ['SocM08AssessmentData', ['findings', 'findingEvidence', 'incidentEvidence', 'riskAcceptanceEvidence', 'assetEvidence']],
  9: ['SocM09AssessmentData', ['evidence']], 10: ['SocM10AssessmentData', ['artifacts']], 11: ['SocM11AssessmentData', ['queue']], 12: ['SocM12AssessmentData', ['evidence']] };
function staticScenario(spec) {
  const entry = STATIC_FILES[spec.module];
  if (!entry || spec.scenario !== 'assessment') return unavailable(spec, 'No standalone fixture file for this scenario; guided data is built inside the module file.');
  const file = path.join(PORTAL, `soc-m${String(spec.module).padStart(2, '0')}-assessment-data.js`);
  try {
    const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(file, 'utf8'), c, { filename: file });
    const data = plain(vm.runInContext(entry[0], c)); const s = data.scenario;
    const rows = []; const seen = new Set();
    for (const key of entry[1]) for (const r of s[key] || []) {
      const id = r.id; if (!id || seen.has(id)) continue; seen.add(id);
      rows.push({ __rid: id, EventId: id, EventSource: key, EventType: r.type || r.eventType || r.kind || '', Account: r.account || r.user || r.recipientId || '', Host: r.host || r.device || r.deviceId || '',
        SourceIp: r.sourceIp || '', DestinationIp: r.destinationIp || '', Domain: r.domain || '', Url: r.url || '', Result: r.result || r.status || '', TimeGenerated: r.time || r.timestamp || r.observedAt || r.createdAt || r.at || '',
        ProcessId: r.processId || '', ParentProcessId: r.parentProcessId || '', Action: r.action || '', Detail: r.summary || r.detail || r.commandLine || r.title || '' });
    }
    const byId = new Map(rows.map((r) => [r.EventId, { row: r, table: r.EventSource, kind: 'event' }]));
    const names = [...new Set(rows.map((r) => r.EventSource))].sort();
    const base = { byId, tables: names.map((n) => ({ name: n, kind: 'event', queryable: false, rows: rows.filter((r) => r.EventSource === n).length })),
      lookups: { IdentityInfo: 0, IpIntel: 0, watchlists: {} }, alerts: [], viewRows: rows.length, dupes: [], unifiedViewRows: 0, unifiedMatchesSource: true, unifiedRows: [] };
    const out = finishScenario(base, { module: spec.module, scenario: spec.scenario, label: spec.label, method: 'static-fixture', queryable: false,
      methodNote: 'Runtime dataset unavailable; counted rows of the primary event-like arrays in the standalone fixture file. Alerts not derivable statically.',
      truth: data.expectedTruth || data.expectedResponseTruth || s.truth || null, fixtureArrays: [], fixtureArraysByKey: {}, taggingAvailable: false });
    out._truthText = JSON.stringify(data.expectedTruth || data.expectedResponseTruth || s.truth || {});
    return out;
  } catch (e) { return unavailable(spec, `Static fallback failed: ${e.message}`); }
}
function unavailable(spec, why) {
  return { module: spec.module, scenario: spec.scenario, label: spec.label, method: 'unavailable', methodNote: why, uniqueSourceEvents: null, alerts: { authored: null, authoredIds: [] }, entities: { accounts: null, hosts: null, ips: null, domains: null, sessions: null, processes: null }, tables: [], sourceTableCount: null, lookups: { watchlists: {} }, duplicateEventIds: [], tagging: { benignOrDistractor: 'n/a', coverageTagged: 'n/a' }, _entities: entitiesOf([]), _signatures: [], _ids: [], _truthText: '', unavailable: true };
}

/* ------------------------------------------------------------ independence */

function independence(guided, assess) {
  if (!guided || !assess || guided.unavailable || assess.unavailable) return null;
  const g = new Set(guided._ids); const sharedIds = assess._ids.filter((id) => g.has(id));
  const gs = new Set(guided._signatures); const sameSig = assess._signatures.filter((s) => gs.has(s)).length;
  const truth = assess._truthText.toLowerCase();
  const out = { sharedEventIds: sharedIds.length, sharedEventIdList: sharedIds, identicalContentRows: sameSig, sharedEntities: {}, answerBearingSharedEntities: [] };
  for (const kind of ['accounts', 'hosts', 'ips', 'domains', 'sessions']) {
    const gset = guided._entities[kind]; const shared = sorted([...assess._entities[kind]].filter((e) => gset.has(e)));
    out.sharedEntities[kind] = shared.length;
    for (const e of shared) if (truth && truth.includes(lc(e))) out.answerBearingSharedEntities.push(e);
  }
  out.answerBearingSharedEntities = sorted(new Set(out.answerBearingSharedEntities));
  out.fixturesIdentical = Boolean(guided._fixtureJson && assess._fixtureJson && guided._fixtureJson === assess._fixtureJson);
  out.sameCaseOrScenarioId = Boolean(guided.fixtureScenarioId && guided.fixtureScenarioId === assess.fixtureScenarioId);
  const hard = out.sharedEventIds > 0 || out.fixturesIdentical || out.answerBearingSharedEntities.length > 0;
  out.verdict = hard ? 'overlap' : (out.identicalContentRows > 0 ? 'content-similar' : 'independent');
  return out;
}

/* ------------------------------------------------------------- build report */

function buildInventory() {
  const { ctx, files, loadErrors } = loadPortal();
  const forceStatic = process.env.SOC_INVENTORY_FORCE_STATIC === '1';
  const scenarios = [];
  const fallbacks = [];
  const failedFiles = new Set(loadErrors.map((e) => e.file));

  // Module 1 (runtime fixtures)
  const m01 = [['MODULE_ONE_ALERT_ORIENTATION', 'guided', 'Practice — NST alert orientation'], ['MODULE_ONE_ESCALATION_LAB', 'assessment', 'Prove — NST-2407 escalation']];
  for (const [name, kind, label] of m01) {
    const lab = evalLive(ctx, name);
    if (lab && lab.scenario && !forceStatic) scenarios.push(m01Scenario(lab, kind, label, ctx));
    else { scenarios.push(unavailable({ module: 1, scenario: kind, label }, `Runtime lab object ${name} unavailable`)); fallbacks.push(`M01 ${kind}`); }
  }
  // Module 2 (static extraction is the primary method)
  const m02 = m02Scenarios();
  if (m02.scenarios.length) scenarios.push(...m02.scenarios);
  else { for (const k of ['guided', 'assessment']) scenarios.push(unavailable({ module: 2, scenario: k, label: 'Module 2' }, m02.error)); fallbacks.push('M02'); }
  // Modules 3-12
  for (const spec of SPECS) {
    let sc = null;
    if (!forceStatic) { try { sc = datasetScenario(ctx, spec); } catch (e) { sc = null; } }
    if (!sc) { sc = staticScenario(spec); fallbacks.push(`M${spec.module} ${spec.scenario} -> ${sc.method}`); }
    scenarios.push(sc);
  }
  // Module 12 has no separate guided scenario.
  scenarios.push({ module: 12, scenario: 'guided', label: 'No separate guided scenario (assessment console only)', method: 'n/a', methodNote: 'Module 12 mounts only the independent capstone case.', uniqueSourceEvents: null, notApplicable: true, _entities: entitiesOf([]), _signatures: [], _ids: [], _truthText: '' });

  scenarios.sort((a, b) => a.module - b.module || (a.scenario === 'guided' ? -1 : 1) - (b.scenario === 'guided' ? -1 : 1));
  const indep = {};
  for (let m = 1; m <= 12; m += 1) {
    const g = scenarios.find((s) => s.module === m && s.scenario === 'guided'); const a = scenarios.find((s) => s.module === m && s.scenario === 'assessment');
    indep[m] = independence(g, a);
  }
  const clean = scenarios.map((s) => { const c = { ...s }; for (const k of Object.keys(c)) if (k.startsWith('_')) delete c[k]; return c; });
  const claims = checkClaims(scenarios, indep);
  return {
    scriptVersion: SCRIPT_VERSION,
    countingRules: COUNTING_RULES,
    portalScriptsLoaded: files.length, loadErrors, runtimeFallbacks: fallbacks.sort(),
    scenarios: clean, independence: indep, progression: progression(scenarios), roadmapClaims: claims,
  };
}

function progression(scenarios) {
  const rows = [];
  for (let m = 1; m <= 12; m += 1) {
    const a = scenarios.find((s) => s.module === m && s.scenario === 'assessment');
    const band = bandFor(m); const n = a && a.uniqueSourceEvents ? a.uniqueSourceEvents : null;
    const [lo, hi] = band.events;
    rows.push({ module: m, assessmentUniqueEvents: n, targetBand: band.label, eventTarget: `${lo}-${hi}`,
      status: n == null ? 'n/a' : n < lo ? 'below band' : n > hi ? 'above band' : 'within band',
      sourceTables: a && a.sourceTableCount != null ? a.sourceTableCount : null, sourceTarget: band.sources[0] == null && band.sources[1] == null ? 'n/a' : `${band.sources[0] == null ? '' : band.sources[0]}-${band.sources[1] == null ? '+' : band.sources[1]}`,
      authoredAlerts: a && a.alerts ? a.alerts.authored : null, alertTarget: `${band.alerts[0]}-${band.alerts[1]}` });
  }
  const evs = rows.map((r) => r.assessmentUniqueEvents);
  const violations = [];
  let prev = null;
  for (let i = 0; i < evs.length; i += 1) {
    if (evs[i] == null) continue;
    if (prev && evs[i] < prev.n) violations.push(`M${String(i + 1).padStart(2, '0')} (${evs[i]}) is below M${String(prev.i + 1).padStart(2, '0')} (${prev.n})`);
    prev = { i, n: evs[i] };
  }
  return { rows, nonMonotonicSteps: violations, m12IsLargest: evs[11] != null && evs[11] === Math.max(...evs.filter((x) => x != null)) };
}

function checkClaims(scenarios, indep) {
  const get = (m, k) => scenarios.find((s) => s.module === m && s.scenario === k);
  const out = [];
  const add = (id, claim, verdict, measured) => out.push({ id, claim, verdict, measured });
  const a4 = get(4, 'assessment'); const g4 = get(4, 'guided');
  const m4data = loadFixtureCounts();
  add('M04-events', 'M04 has nine explicit authentication events, two reports and three IOCs',
    a4 && a4.uniqueSourceEvents === 9 && m4data.m04Reports === 2 && m4data.m04Iocs === 3 ? 'confirmed' : 'corrected',
    `${a4 ? a4.uniqueSourceEvents : '?'} unique AuthLog events, ${m4data.m04Reports} reports, ${m4data.m04Iocs} IOCs (reports/IOCs are display-only context records, not queryable)`);
  const a5 = get(5, 'assessment');
  add('M05-events', 'M05 has 13 assessment events incl. signed-updater comparisons on another host',
    a5 && a5.uniqueSourceEvents === 13 && a5.entities.hosts > 1 ? 'confirmed' : 'corrected',
    `${a5 ? a5.uniqueSourceEvents : '?'} unique events across ${a5 ? a5.sourceTableCount : '?'} tables, ${a5 ? a5.entities.hosts : '?'} hosts, benign-tagged ${a5 ? a5.tagging.benignOrDistractor : '?'}`);
  const a12 = get(12, 'assessment');
  const dupes = a12 ? a12.duplicateEventIds.length : 0;
  add('M12-alerts', 'M12 has three initial alerts', a12 && a12.alerts.authored === 3 ? 'confirmed' : 'corrected', `${a12 ? a12.alerts.authored : '?'} authored alerts (${a12 ? a12.alerts.authoredIds.join(', ') : ''})`);
  add('M12-evidence', 'M12 has seven named evidence records (the roadmap says the small lists are supplemented by tool fixtures)',
    a12 && a12.uniqueSourceEvents === 7 ? (dupes ? 'confirmed with a defect' : 'confirmed') : 'corrected',
    `${a12 ? a12.uniqueSourceEvents : '?'} unique queryable events. The console adapter additionally pushes a second BEN-101 row (${dupes} duplicate EventId${dupes === 1 ? '' : 's'}), so the dataset has ${a12 ? a12.tables.reduce((n, t) => n + t.rows, 0) : '?'} rows; tool packs (M04-M10) reuse these same evidence ids and add no further source events to the dataset`);
  const a6 = get(6, 'assessment'); const g6 = get(6, 'guided');
  add('M04-M06-empty-alerts', 'M04/M06 console base data has empty alert arrays before learner-generated rules',
    a4 && a6 && a4.alerts.authored === 0 && a6.alerts.authored === 0 ? 'confirmed' : 'corrected',
    `Assessment authored alerts: M04=${a4 ? a4.alerts.authored : '?'}, M06=${a6 ? a6.alerts.authored : '?'}`);
  add('guided-alerts', 'Guided fixtures add authored alerts where assessments have none',
    g6 && g6.alerts.authored > 0 && g4 && g4.alerts.authored > 0 ? 'confirmed' : (g6 && g6.alerts.authored > 0 ? 'partly corrected' : 'corrected'),
    `Guided authored alerts: M04=${g4 ? g4.alerts.authored : '?'}, M06=${g6 ? g6.alerts.authored : '?'} (M04 guided is also empty)`);
  const a3 = get(3, 'assessment'); const g3 = get(3, 'guided');
  add('M03-sources', 'M03 has four native source formats normalised into UnifiedEvents', a3 && a3.tables.filter((t) => t.kind === 'event').length === 4 ? 'confirmed' : 'corrected',
    `Practice ${g3 ? g3.uniqueSourceEvents : '?'} events, Prove ${a3 ? a3.uniqueSourceEvents : '?'} events; UnifiedEvents copies match source rows: ${a3 ? a3.unifiedCopiesMatchSource : '?'}`);
  const a11 = get(11, 'assessment');
  add('M11-queue', 'M11 queue/recovery data is adapted into AlertQueue and watchlists',
    a11 && a11.alerts.authored === 12 ? 'confirmed' : 'corrected',
    `${a11 ? a11.alerts.authored : '?'} AlertQueue items (alerts, counted once), ${a11 ? a11.evidenceRecords : '?'} RecoveryRecords evidence rows, lookups ${a11 ? JSON.stringify(a11.lookups.watchlists) : ''}`);
  const prog = progression(scenarios);
  add('progression', 'M12 is intended to be the largest searchable assessment slice and counts rise by stage',
    prog.nonMonotonicSteps.length === 0 && prog.m12IsLargest ? 'confirmed' : 'corrected',
    `Assessment unique events by module: ${prog.rows.map((r) => (r.assessmentUniqueEvents == null ? "n/a" : r.assessmentUniqueEvents)).join(', ')}. Non-monotonic steps: ${prog.nonMonotonicSteps.join('; ') || 'none'}`);
  const below = prog.rows.filter((r) => r.status === 'below band').map((r) => `M${r.module}`);
  add('target-bands', 'Roadmap target bands are "starting targets", not claims about current totals', 'confirmed', `Modules below their band: ${below.join(', ') || 'none'}`);
  const sharedIssues = Object.entries(indep).filter(([, v]) => v && v.verdict === 'overlap').map(([m]) => `M${m}`);
  const similar = Object.entries(indep).filter(([, v]) => v && v.verdict === 'content-similar').map(([m]) => `M${m}`);
  add('independence', 'Guided and assessment fixtures should not share answer-bearing identities/event ids',
    sharedIssues.length ? 'corrected' : 'confirmed',
    (sharedIssues.length ? `Answer-bearing/identifier overlap in: ${sharedIssues.join(', ')}` : 'No shared EventIds, identical fixtures or answer-bearing shared entities in any module') + (similar.length ? `; content-similar rows (same type/host/detail, different ids) in: ${similar.join(', ')}` : ''));
  const populated = scenarios.filter((x) => x.coverage && x.uniqueSourceEvents);
  const neverPresent = CANONICAL_FIELDS.filter((f) => populated.every((x) => x.coverage[f].count === 0));
  const onlyM01 = CANONICAL_FIELDS.filter((f) => populated.some((x) => x.coverage[f].count > 0) && populated.filter((x) => x.coverage[f].count > 0).every((x) => x.module === 1));
  const a5v = get(5, 'assessment');
  const dropped = a5v && a5v.unifiedViewCoverage ? CANONICAL_FIELDS.filter((f) => a5v.coverage[f].count > a5v.unifiedViewCoverage[f].count) : [];
  add('canonical-fields', 'Field standardisation is present but inconsistent at the data-contract level',
    'confirmed', `Canonical fields absent from every scenario fixture: ${neverPresent.join(', ') || 'none'}; present only in M01: ${onlyM01.join(', ') || 'none'}. Fields stored on M05 source rows but missing from its UnifiedEvents view: ${dropped.join(', ') || 'none'}`);
  const g6c = get(6, 'guided');
  add('M06-guided', 'M06 guided case has a repeated-script alert and two-device evidence',
    g6c && g6c.alerts.authored === 1 && g6c.entities.hosts === 2 ? 'confirmed' : 'corrected',
    `Guided: ${g6c ? g6c.alerts.authored : '?'} authored alert, ${g6c ? g6c.entities.hosts : '?'} distinct hosts, ${g6c ? g6c.uniqueSourceEvents : '?'} events; assessment: ${a6 ? a6.entities.hosts : '?'} hosts, ${a6 ? a6.uniqueSourceEvents : '?'} events`);
  const a1 = get(1, 'assessment'); const a2 = get(2, 'guided'); const a8 = get(8, 'assessment'); const a10 = get(10, 'assessment');
  add('M01-M02-not-siem', 'M01/M02 are not searchable SIEM datasets; M02 activity is a focused slice',
    a1 && a1.queryableEvents === 0 && a2 && a2.queryableEvents === 0 ? 'confirmed' : 'corrected',
    `M01: ${a1 ? a1.uniqueSourceEvents : '?'} display-only sign-in rows (Prove), 0 queryable; M02 console: ${a2 ? a2.uniqueSourceEvents : '?'} access-activity rows, 0 queryable, and no event rows are authored for its Prove lab in portal sources (imported lab)`);
  add('M08-evidence-records', 'M08 is not primarily a raw log-analysis module',
    a8 && a8.telemetryEvents === 0 ? 'confirmed' : 'corrected',
    `${a8 ? a8.evidenceRecords : '?'} evidence-record rows (findings, evidence, incident, exception) and ${a8 ? a8.telemetryEvents : '?'} telemetry events; ${a8 ? a8.lookups.watchlists.AssetInventory || 0 : '?'} asset-inventory lookup rows`);
  add('M10-alert', 'M10 includes an evidence-request alert and mapped forensic artifacts',
    a10 && a10.alerts.authored === 1 ? 'confirmed' : 'corrected',
    `${a10 ? a10.alerts.authored : '?'} authored alert (${a10 ? a10.alerts.authoredIds.join(', ') : ''}); ${a10 ? a10.uniqueSourceEvents : '?'} artifacts mapped into ${a10 ? a10.sourceTableCount : '?'} tables`);
  return out;
}

function loadFixtureCounts() {
  try {
    const c = {}; vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(PORTAL, 'soc-m04-assessment-data.js'), 'utf8'), c);
    const d = plain(vm.runInContext('SocM04AssessmentData', c));
    return { m04Reports: d.scenario.reports.length, m04Iocs: d.scenario.iocs.length };
  } catch (e) { return { m04Reports: null, m04Iocs: null }; }
}

/* ------------------------------------------------------------------ output */

const COUNTING_RULES = [
  'Unique source event = one distinct EventId across a scenario\'s source tables. A native row copied into UnifiedEvents is the same event; UnifiedEvents rows are never added to the total.',
  'Source tables include telemetry tables and, where a module authors them as evidence (vulnerability findings, response, recovery, custody records), evidence-record tables; those are broken out as "evidence records" and are included in the unique-event total. AlertQueue rows (M11) are alert items and are counted only as alerts.',
  'Lookups (IdentityInfo, IpIntel), watchlists, metrics and fixture context arrays (reports, IOCs, devices, messages, entities...) are counted separately and never as events.',
  'Authored alerts = dataset alert queue as shipped. Learner- or rule-generated alerts (Analytics Rules, saved queries, generated alerts) are excluded and are zero at baseline.',
  '"Queryable" means rows reachable through the KQL console tables. M01 and M02 events are display-only table rows in their own panes.',
  'Coverage % = share of unique source events that carry a non-empty value for the canonical field in the source row (empty, null, "—" and "-" count as missing; TimeGenerated must be ISO-8601 UTC). Host/DeviceId counts either. The UnifiedEvents-view coverage (JSON only) reads the lower-case aliases the view exposes.',
  'Entities are distinct case-insensitive Account, Host/DeviceId, IPv4 (Source/Destination), Domain, SessionId and ProcessId values on source events.',
  'Benign/distractor and coverage tags come only from the fixtures themselves (truth/expectedTruth key paths such as benign*, noise*, unrelated*, exclude*, row fields class/classification/signalClass, and M01 entity-roster "noise" tiers). Without such tags the value is "untagged". Delayed/collector rows and change-linked rows are reported as structural indicators, not tags.',
  'Independence compares guided vs assessment EventIds, content signatures (type/account/host/IPs/domain/url/detail) and entity overlap; an overlapping entity is "answer-bearing" if it appears in the assessment truth/rubric text.',
  'Method per scenario: runtime (datasets read from the loaded portal scripts), static-extraction (declared inside an IIFE, literal extracted), static-fixture (fallback from the standalone data file).',
];

const m = (v) => (v == null ? 'n/a' : String(v));

function renderMarkdown(inv) {
  const L = [];
  L.push('# SOC Telemetry Inventory');
  L.push('');
  L.push('Generated by `node scripts/soc-telemetry-inventory.js` (read-only, deterministic). Machine-readable twin: `docs/telemetry/soc-telemetry-inventory.json`.');
  L.push('');
  L.push('## Counting rules');
  L.push('');
  inv.countingRules.forEach((r, i) => L.push(`${i + 1}. ${r}`));
  L.push('');
  L.push(`Load status: ${inv.portalScriptsLoaded} portal scripts loaded in a stubbed vm context; ${inv.loadErrors.length} load error(s)${inv.loadErrors.length ? ': ' + inv.loadErrors.map((e) => `${e.file} (${e.error})`).join('; ') : ''}. Runtime-fallback scenarios: ${inv.runtimeFallbacks.length ? inv.runtimeFallbacks.join('; ') : 'none'}.`);
  L.push('');
  L.push('## Per-scenario summary');
  L.push('');
  L.push('| Mod | Scenario | Case | Method | Unique events | Telemetry / evidence | Source tables | Queryable | Display-only | Authored alerts | Accounts | Hosts | IPs | Benign-tagged | Coverage-tagged | View rows (incl. copies/lookups) |');
  L.push('|---:|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---|---:|');
  for (const s of inv.scenarios) {
    if (s.notApplicable || s.unavailable) { L.push(`| ${s.module} | ${s.scenario} | — | ${s.method} | n/a | — | — | — | — | — | — | — | — | — | — | — |`); continue; }
    L.push(`| ${s.module} | ${s.scenario} | ${m(s.caseId)} | ${s.method} | ${s.uniqueSourceEvents} | ${s.telemetryEvents} / ${s.evidenceRecords} | ${s.sourceTableCount} | ${s.queryableEvents} | ${s.displayOnlyEvents} | ${s.alerts.authored} | ${s.entities.accounts} | ${s.entities.hosts} | ${s.entities.ips} | ${s.tagging.benignOrDistractor} | ${s.tagging.coverageTagged} | ${s.viewRows} |`);
  }
  L.push('');
  L.push('## Tables per scenario');
  L.push('');
  L.push('| Mod | Scenario | Tables (rows, kind) | Lookups / watchlists | Context fixture arrays (rows, mapped into tables) |');
  L.push('|---:|---|---|---|---|');
  for (const s of inv.scenarios) {
    if (s.notApplicable || s.unavailable) continue;
    const t = s.tables.map((x) => `${x.name} (${x.rows}${x.kind === 'event' ? '' : ', ' + x.kind}${x.queryable ? '' : ', display'})`).join(', ') || 'none';
    const lk = [`IdentityInfo ${s.lookups.IdentityInfo}`, `IpIntel ${s.lookups.IpIntel}`].concat(Object.entries(s.lookups.watchlists).map(([k, v]) => `${k} ${v}`)).join(', ');
    const cx = Object.entries(s.context || {}).map(([k, v]) => `${k} ${v.rows}${v.mappedIntoTables != null ? `/${v.mappedIntoTables}` : ''}`).join(', ') || '—';
    L.push(`| ${s.module} | ${s.scenario} | ${t} | ${lk} | ${cx} |`);
  }
  L.push('');
  const covTable = (kind, title) => {
    L.push(`## Canonical-field coverage (% of unique events), ${title}`);
    L.push('');
    const cols = []; for (let n = 1; n <= 12; n += 1) cols.push(inv.scenarios.find((s) => s.module === n && s.scenario === kind));
    L.push(`| Field | ${cols.map((c, i) => `M${String(i + 1).padStart(2, '0')}`).join(' | ')} |`);
    L.push(`|---|${cols.map(() => '---:').join('|')}|`);
    for (const f of CANONICAL_FIELDS) L.push(`| ${f} | ${cols.map((c) => (c && c.coverage && c.uniqueSourceEvents ? c.coverage[f].pct : '—')).join(' | ')} |`);
    L.push('');
  };
  covTable('assessment', 'Assessment/Prove');
  covTable('guided', 'Guided/Practice');
  L.push('## Alert provenance and entity detail');
  L.push('');
  L.push('| Mod | Scenario | Authored alerts (ids) | Rule/learner-generated | Alert entities resolved to events | Domains | Sessions | Processes | Structural coverage-caveat rows | Change-linked rows | Duplicate EventIds |');
  L.push('|---:|---|---|---:|---|---:|---:|---:|---:|---:|---|');
  for (const s of inv.scenarios) {
    if (s.notApplicable || s.unavailable) continue;
    L.push(`| ${s.module} | ${s.scenario} | ${s.alerts.authored}${s.alerts.authoredIds.length && s.alerts.authoredIds.length <= 4 ? ' (' + s.alerts.authoredIds.join(', ') + ')' : ''} | ${s.alerts.ruleOrLearnerGenerated} | ${s.alerts.entityRefsResolved} | ${s.entities.domains} | ${s.entities.sessions} | ${s.entities.processes} | ${s.tagging.structuralCoverageCaveatRows} | ${s.tagging.changeLinkedRows} | ${s.duplicateEventIds.length ? s.duplicateEventIds.map((d) => d.id).join(', ') : 'none'} |`);
  }
  L.push('');
  L.push('## Guided vs assessment independence');
  L.push('');
  L.push('| Mod | Shared EventIds | Identical-content rows | Shared accounts / hosts / IPs / domains / sessions | Answer-bearing shared entities | Fixtures identical | Verdict |');
  L.push('|---:|---:|---:|---|---|---|---|');
  for (let n = 1; n <= 12; n += 1) {
    const i = inv.independence[n];
    if (!i) { L.push(`| ${n} | n/a | n/a | n/a | n/a | n/a | n/a (no comparable pair) |`); continue; }
    const e = i.sharedEntities;
    L.push(`| ${n} | ${i.sharedEventIds} | ${i.identicalContentRows} | ${e.accounts} / ${e.hosts} / ${e.ips} / ${e.domains} / ${e.sessions} | ${i.answerBearingSharedEntities.join(', ') || 'none'} | ${i.fixturesIdentical} | ${i.verdict} |`);
  }
  L.push('');
  L.push('## Progression against roadmap target bands (assessment scenario)');
  L.push('');
  L.push('| Mod | Unique events | Event target | Status | Source tables | Source target | Authored alerts | Alert target |');
  L.push('|---:|---:|---|---|---:|---|---:|---|');
  for (const r of inv.progression.rows) L.push(`| ${r.module} | ${m(r.assessmentUniqueEvents)} | ${r.eventTarget} | ${r.status} | ${m(r.sourceTables)} | ${r.sourceTarget} | ${m(r.authoredAlerts)} | ${r.alertTarget} |`);
  L.push('');
  L.push(`Non-monotonic steps: ${inv.progression.nonMonotonicSteps.join('; ') || 'none'}. M12 is the largest assessment slice: ${inv.progression.m12IsLargest ? 'yes' : 'no'}.`);
  L.push('');
  L.push('## Findings vs roadmap');
  L.push('');
  L.push('| Check | Roadmap claim | Verdict | Measured |');
  L.push('|---|---|---|---|');
  for (const c of inv.roadmapClaims) L.push(`| ${c.id} | ${c.claim} | **${c.verdict}** | ${c.measured.replace(/\|/g, '/')} |`);
  L.push('');
  L.push('## Method notes per scenario');
  L.push('');
  for (const s of inv.scenarios) L.push(`- M${String(s.module).padStart(2, '0')} ${s.scenario}${s.label ? ` (${s.label})` : ''}: ${s.method}. ${s.methodNote || ''}${s.legacyTrustPathLab ? ' ' + s.legacyTrustPathLab.note + ` (${s.legacyTrustPathLab.total} records).` : ''}`);
  L.push('');
  return L.join('\n');
}

function main() {
  const inv = buildInventory();
  const json = process.argv.includes('--json');
  process.stdout.write(json ? JSON.stringify(inv, null, 2) + '\n' : renderMarkdown(inv) + '\n');
}

if (require.main === module) main();
module.exports = { buildInventory, renderMarkdown, CANONICAL_FIELDS };

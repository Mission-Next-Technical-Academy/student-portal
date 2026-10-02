#!/usr/bin/env node
/* SOC entity-identity lint (phase 1 of the cross-module entity cleanup). REPORT-ONLY.
 *
 * Checks every module's console tables (M01-M12, guided + assessment) against the
 * "Entity identity contract" in docs/telemetry/SOC_TELEMETRY_SCHEMA.md and reports
 * violation counts per module and per rule, with example rows and a phase-2 fix plan.
 *
 *   node scripts/soc-entity-identity-lint.js            write docs/telemetry/ENTITY_IDENTITY_LINT.md, print summary, exit 0
 *   node scripts/soc-entity-identity-lint.js --strict   same, but exit 1 when any violation exists
 *   node scripts/soc-entity-identity-lint.js --no-write print only (no markdown file)
 *
 * Fixtures are loaded exactly like scripts/soc-telemetry-inventory.js (it is required, not
 * copied). Nothing in portal/ is written. No dependencies beyond the node standard library.
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const inv = require('./soc-telemetry-inventory.js');

const ROOT = path.join(__dirname, '..');
const PORTAL = path.join(ROOT, 'portal');
const TESTS = path.join(ROOT, 'tests');
const OUT = path.join(ROOT, 'docs', 'telemetry', 'ENTITY_IDENTITY_LINT.md');
const STRICT = process.argv.includes('--strict');
const WRITE = !process.argv.includes('--no-write');

/* ----------------------------------------------------------------- rules */

const RULES = [
  { id: 'H1', name: 'host-case', text: 'Host/DeviceId is not lower-case' },
  { id: 'H2', name: 'host-free-text', text: 'Host/DeviceId holds free text (not a hostname token)' },
  { id: 'H3', name: 'host-deviceid-mismatch', text: 'Host and DeviceId both set but differ (ignoring case)' },
  { id: 'H4', name: 'host-empty', text: 'Host key present but empty on a host-bearing table' },
  { id: 'A1', name: 'account-qualified', text: 'Account carries a domain prefix (CORP\\user) or UPN (user@domain)' },
  { id: 'A2', name: 'account-case', text: 'Account is not lower-case (e.g. SYSTEM)' },
  { id: 'A3', name: 'account-free-text', text: 'Account holds free text or a placeholder (spaces, "unassigned", ...)' },
  { id: 'A4', name: 'account-empty', text: 'Account empty on a table where it is required' },
  { id: 'K1', name: 'noncanonical-key', text: 'Entity stored under a non-canonical key (Source, Device, Hostname)' },
  { id: 'S1', name: 'eventsource-not-table', text: 'EventSource differs from the table name' },
];
const RULE_IDS = RULES.map((r) => r.id);

const HOST_TOKEN = /^[a-z0-9][a-z0-9._-]*$/i;
const ACCOUNT_TOKEN = /^[a-z0-9][a-z0-9._-]*$/;
const PLACEHOLDERS = new Set(['unassigned', 'unknown', 'n/a', 'none', 'null', 'anonymous', 'all staff']);
// Tables where an authenticated principal legitimately may not exist (network/telemetry layer).
const ACCOUNT_OPTIONAL = new Set(['FirewallEvents', 'NetworkSessionEvents', 'DnsEvents', 'TlsEvents', 'ProxyEvents', 'IpIntel']);
// Derived or lookup copies are not source rows; skip so rows are not double counted.
const SKIP_TABLES = new Set(['UnifiedEvents', 'IpIntel']);
// Tables that carry no Host concept: a missing Host key is fine and an empty Host is not checked.
const HOST_EXEMPT_EMPTY = new Set(['EmailEvents', 'EmailUrlEvents', 'EmailAttachmentEvents', 'IdentityInfo']);

const isEmpty = (v) => v === undefined || v === null || v === '' || v === '—' || v === '-';
const s = (v) => String(v);

function checkRow(table, row) {
  const hits = [];
  const add = (id, detail) => hits.push({ rule: id, detail });
  for (const k of ['Source', 'Device', 'Hostname']) if (!isEmpty(row[k]) || k in row) add('K1', `${k}=${JSON.stringify(row[k])}`);
  if (row.EventSource !== undefined && row.EventSource !== table && !/\(display\)$/.test(table) && table !== 'M01 log' && table !== 'M02 console') add('S1', `EventSource=${JSON.stringify(row.EventSource)}`);
  const host = row.Host; const dev = row.DeviceId;
  for (const [k, v] of [['Host', host], ['DeviceId', dev]]) {
    if (isEmpty(v)) continue;
    const t = s(v);
    if (!HOST_TOKEN.test(t)) add('H2', `${k}=${JSON.stringify(t)}`);
    else if (t !== t.toLowerCase()) add('H1', `${k}=${t}`);
  }
  if (!isEmpty(host) && !isEmpty(dev) && s(host).toLowerCase() !== s(dev).toLowerCase()) add('H3', `Host=${host} DeviceId=${dev}`);
  if ('Host' in row && isEmpty(host) && !HOST_EXEMPT_EMPTY.has(table)) add('H4', `Host=${JSON.stringify(host)}${isEmpty(dev) ? '' : ` (DeviceId=${dev})`}`);
  if ('Account' in row) {
    const a = row.Account;
    if (isEmpty(a)) { if (!ACCOUNT_OPTIONAL.has(table)) add('A4', `Account=${JSON.stringify(a)}`); }
    else {
      const t = s(a);
      if (/[\\@]/.test(t)) add('A1', `Account=${t}`);
      else if (/\s/.test(t) || PLACEHOLDERS.has(t.toLowerCase())) add('A3', `Account=${JSON.stringify(t)}`);
      else if (t !== t.toLowerCase()) add('A2', `Account=${t}`);
      else if (!ACCOUNT_TOKEN.test(t)) add('A3', `Account=${JSON.stringify(t)}`);
    }
  }
  return hits;
}

/* --------------------------------------------------------------- loading */

// [{module, scenario, label, tables:{name: rows[]}, truthText}]
function loadScenarios() {
  const { ctx } = inv.loadPortal();
  const out = [];
  // M01: display-only log pane (raw device/user as shown to the learner).
  for (const [name, kind] of [['MODULE_ONE_ALERT_ORIENTATION', 'guided'], ['MODULE_ONE_ESCALATION_LAB', 'assessment']]) {
    const lab = inv.evalLive(ctx, name);
    const sc = lab && lab.scenario; if (!sc) continue;
    const rows = sc.logEvents.map((e) => ({ EventId: e.id, EventSource: 'M01 log', Account: e.user, Host: e.device }));
    out.push({ module: 1, scenario: kind, label: 'M01 display log pane', tables: { 'M01 log': rows }, truthText: JSON.stringify({ c: lab.correctVerdict, e: sc.evidence, s: sc.entity }) });
  }
  // M02: console DATA literal (users/devices), display-only.
  try {
    const text = fs.readFileSync(path.join(PORTAL, 'soc-analyst-module-02-environment.js'), 'utf8');
    const a = text.indexOf('const DATA = {'); const b = text.indexOf('\n  };', a);
    const data = vm.runInNewContext(`(${text.slice(a + 'const DATA = '.length, b + 4)})`);
    const rows = data.devices.map((d) => ({ EventId: d.id, EventSource: 'M02 console', Host: d.name, Account: (data.users.find((u) => u.id === d.user) || {}).username }));
    out.push({ module: 2, scenario: 'guided', label: 'M02 console inventory', tables: { 'M02 console': rows }, truthText: '' });
  } catch (e) { /* M02 literal unavailable: skip */ }
  for (const spec of inv.SPECS) {
    const ds = inv.evalLive(ctx, spec.datasetExpr);
    if (!ds || !ds.tables) continue;
    const fx = spec.fixtureExpr ? inv.evalLive(ctx, spec.fixtureExpr) : null;
    const sc = fx ? (fx.scenario || fx) : null;
    const truth = (sc && (sc.truth || sc.expectedTruth)) || (fx && (fx.expectedTruth || fx.expectedResponseTruth || fx.expectedPriority)) || (spec.truthExpr ? inv.evalLive(ctx, spec.truthExpr) : null);
    let truthText = '';
    try { truthText = JSON.stringify(truth || {}); } catch (e) { /* cyclic */ }
    const tables = {};
    for (const [name, rows] of Object.entries(ds.tables)) {
      if (SKIP_TABLES.has(name) || !Array.isArray(rows) || !rows.length) continue;
      if (!rows.some((r) => r && ('Host' in r || 'DeviceId' in r || 'Account' in r || 'Device' in r || 'Hostname' in r))) continue;
      tables[name] = rows;
    }
    out.push({ module: spec.module, scenario: spec.scenario, label: spec.label, tables, truthText });
  }
  return out;
}

/* ------------------------------------------------------------------ lint */

function lint(scenarios) {
  const mods = {};
  for (const sc of scenarios) {
    const m = mods[sc.module] = mods[sc.module] || { module: sc.module, rows: 0, badRows: new Set(), counts: {}, examples: {}, values: new Set(), truthValues: new Set(), perScenario: {}, perTable: {} };
    for (const [table, rows] of Object.entries(sc.tables)) {
      for (const row of rows) {
        m.rows += 1;
        const hits = checkRow(table, row);
        if (!hits.length) continue;
        const key = `${sc.scenario}:${table}:${row.EventId || row.__rid}`;
        m.badRows.add(key);
        for (const h of hits) {
          m.counts[h.rule] = (m.counts[h.rule] || 0) + 1;
          const ex = m.examples[h.rule] = m.examples[h.rule] || [];
          if (ex.length < 3 && !ex.some((e) => e.detail === h.detail)) ex.push({ scenario: sc.scenario, table, id: row.EventId || row.__rid, detail: h.detail });
          const sk = `${sc.scenario}`; (m.perScenario[sk] = m.perScenario[sk] || new Set()).add(key);
          const tk = `${sc.scenario}/${table}`; (m.perTable[tk] = m.perTable[tk] || new Set()).add(key);
        }
        for (const k of ['Host', 'DeviceId', 'Account']) if (!isEmpty(row[k]) && checkRow(table, { [k]: row[k] }).length) {
          m.values.add(s(row[k]));
          if (sc.truthText && sc.truthText.includes(s(row[k]))) m.truthValues.add(s(row[k]));
        }
      }
    }
  }
  return mods;
}

/* ------------------------------------------------- dependency scan (risk) */

function listFiles(dir, re) { try { return fs.readdirSync(dir).filter((f) => re.test(f)); } catch (e) { return []; } }
const escRe = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function dependencies(mod, values) {
  const nn = String(mod).padStart(2, '0');
  const portalFiles = listFiles(PORTAL, new RegExp(`^(soc-m${nn}-(?!assessment-data)|soc-analyst-module-0?${mod}(?!\\d))`)).filter((f) => f.endsWith('.js'));
  const testFiles = listFiles(TESTS, new RegExp(`(m${nn}|module-0?${mod}(?!\\d)|module0?${mod}(?!\\d))`)).filter((f) => f.endsWith('.js'));
  const hits = [];
  const scan = (dir, f) => {
    let text; try { text = fs.readFileSync(path.join(dir, f), 'utf8'); } catch (e) { return; }
    const found = [...values].filter((v) => v.length > 2 && new RegExp(`(^|[^A-Za-z0-9._-])${escRe(v)}($|[^A-Za-z0-9._-])`).test(text));
    if (found.length) hits.push({ file: `${path.relative(ROOT, path.join(dir, f))}`, n: found.length, sample: found.slice(0, 3) });
  };
  portalFiles.forEach((f) => scan(PORTAL, f)); testFiles.forEach((f) => scan(TESTS, f));
  return hits;
}

/* ---------------------------------------------------------------- report */

function render(mods) {
  const ids = Object.keys(mods).map(Number).sort((a, b) => a - b);
  const total = {}; let totalViol = 0; let totalBad = 0; let totalRows = 0;
  const L = [];
  L.push('# Entity identity lint', '');
  L.push('Generated by `node scripts/soc-entity-identity-lint.js` (report-only; `--strict` exits 1 on violations).');
  L.push('Contract: `docs/telemetry/SOC_TELEMETRY_SCHEMA.md` ("Entity identity contract"). Do not edit by hand; regenerate.', '');
  L.push('Scope: every console table for M01-M12 (guided + assessment) except derived `UnifiedEvents` and `IpIntel`. Counts are violations (one row can hit several rules); "rows" are distinct offending rows.', '');
  L.push('## Rules', '', '| Id | Rule | Meaning |', '|---|---|---|');
  for (const r of RULES) L.push(`| ${r.id} | ${r.name} | ${r.text} |`);
  L.push('', '## Violations by module and rule', '');
  L.push(`| Module | Rows checked | ${RULE_IDS.join(' | ')} | Total | Rows affected |`);
  L.push(`|---|---:|${RULE_IDS.map(() => '---:').join('|')}|---:|---:|`);
  for (const m of ids) {
    const x = mods[m]; const sum = RULE_IDS.reduce((n, r) => n + (x.counts[r] || 0), 0);
    RULE_IDS.forEach((r) => { total[r] = (total[r] || 0) + (x.counts[r] || 0); });
    totalViol += sum; totalBad += x.badRows.size; totalRows += x.rows;
    L.push(`| M${String(m).padStart(2, '0')} | ${x.rows} | ${RULE_IDS.map((r) => x.counts[r] || 0).join(' | ')} | ${sum} | ${x.badRows.size} |`);
  }
  L.push(`| **All** | ${totalRows} | ${RULE_IDS.map((r) => total[r] || 0).join(' | ')} | ${totalViol} | ${totalBad} |`, '');
  L.push('## Examples (up to 3 per module and rule)', '');
  for (const m of ids) {
    const x = mods[m]; const rs = RULE_IDS.filter((r) => x.counts[r]);
    if (!rs.length) { L.push(`### M${String(m).padStart(2, '0')}`, '', 'No violations.', ''); continue; }
    L.push(`### M${String(m).padStart(2, '0')}`, '');
    for (const r of rs) {
      L.push(`- **${r} ${RULES.find((q) => q.id === r).name}** (${x.counts[r]}): ` + x.examples[r].map((e) => `\`${e.scenario}/${e.table}/${e.id}\` ${e.detail}`).join('; '));
    }
    L.push('');
  }
  L.push(...fixPlan(mods, ids));
  return { md: L.join('\n') + '\n', total, totalViol, totalBad, ids };
}

const HAS = (x, ...r) => r.reduce((n, k) => n + (x.counts[k] || 0), 0);
function fixPlan(mods, ids) {
  const L = ['## Phase 2 fix plan', ''];
  L.push('Order: cheapest and lowest grading risk first; each step is one module-by-module session (guided + assessment fixture of that module together, then re-run this lint and the full test suite). Row estimates are rows affected in the console tables; the fixture arrays behind them are what actually get edited.', '');
  const steps = [];
  const mk = (m, title, rules, note) => {
    const x = mods[m]; if (!x) return;
    const n = x.badRows.size; if (!n) return;
    steps.push({ m, title, n, rules, note });
  };
  const order = [
    [3, 'Already canonical (lower-case hosts, bare accounts)', 'Verify only; `acct-NN` plus `svc-`/person tokens are allowed.'],
    [4, 'Rename descriptive `Device` key ("Managed workstation") on AuthLog to `DeviceClass`', 'Low risk, no answer-key hits; start here.'],
    [12, 'Lower-case `system`, replace free-text `All staff`; canonical already', 'M12 is the reference module; panel alert ids were aligned to the queue in ee17b70.'],
    [9, 'Host = DeviceId = lower-case hostname; move free text out of Host; fill/designate empty Account', 'Highest row volume of structural fixes (DeviceId `DEV-*` vs Host, free-text Host in ScopeChecks).'],
    [11, 'Move alert title out of Host on AlertQueue; `unassigned` -> null', 'Alert titles in Host are likely read by queue UI/scorer; check consumers.'],
    [10, 'Lower-case hosts; bare lower-case `system`', 'Guided and assessment share `SYSTEM` and WKS hosts (open item 5); fix both together.'],
    [8, 'Lower-case hosts; rename `Source` (and `Hostname`) keys', 'Hosts are asset ids in findings, risk-exception and truth; rename `Source` last.'],
    [7, 'Lower-case hosts; fill Account on EmailUrlEvents; Firewall Account stays empty', 'Email/URL rows feed answer keys by account.'],
    [6, 'Lower-case Host/DeviceId (accounts already `acct-*`); rename ChangeTickets `Device` to `Host`', 'Host/DeviceId already equal ignoring case; casing only.'],
    [5, 'Strip `CORP\\`, lower-case `SYSTEM`, Host = DeviceId (`ws-*`), keep inventory ids as alias field', 'Largest semantic change: DeviceId `M05-DEV-00N` is an inventory id used by ChangeTickets/ApprovedSoftware.'],
    [1, 'Display-only: lower-case device, drop `(unmanaged)` annotation', 'Shared `portal/data.js`; display strings only, optional.'],
    [2, 'Display-only: lower-case device names (`WKSTN-17`)', 'Imported/console labels; optional.'],
  ];
  for (const [m, t, n] of order) mk(m, t, RULE_IDS.filter((r) => mods[m].counts[r]), n);
  let i = 1;
  L.push('| # | Module | Change | Est. rows | Rules | Risk notes |', '|---:|---|---|---:|---|---|');
  const riskText = {};
  for (const st of steps) {
    const x = mods[st.m];
    const deps = dependencies(st.m, x.values);
    const truth = [...x.truthValues];
    riskText[st.m] = { deps, truth };
    const flags = [];
    if (truth.length) flags.push(`TRUTH: ${truth.length} offending value(s) appear in the answer key`);
    if (deps.length) flags.push(`${deps.length} code/test file(s) hard-code offending values`);
    L.push(`| ${i++} | M${String(st.m).padStart(2, '0')} | ${st.title} | ${st.n} | ${st.rules.join(' ')} | ${st.note}${flags.length ? ' **' + flags.join('; ') + '.**' : ''} |`);
  }
  L.push('', '### Answer-key and grading risk detail', '');
  L.push('Offending values (hosts, device ids, accounts that break the contract) found in the module answer key (`truth`/expected objects) and in module scorer/UI/test files. Renaming these in fixtures without updating the same strings in those files changes grading or fails tests.', '');
  for (const st of steps) {
    const r = riskText[st.m];
    L.push(`- **M${String(st.m).padStart(2, '0')}** answer-key values: ${r.truth.length ? r.truth.slice(0, 12).map((v) => `\`${v}\``).join(', ') + (r.truth.length > 12 ? ` (+${r.truth.length - 12} more)` : '') : 'none'}`);
    for (const d of r.deps.slice(0, 8)) L.push(`  - \`${d.file}\` references ${d.n} offending value(s), e.g. ${d.sample.map((v) => `\`${v}\``).join(', ')}`);
    if (r.deps.length > 8) L.push(`  - (+${r.deps.length - 8} more files)`);
  }
  L.push('', '### Phase 2 rules of engagement', '');
  L.push('1. Change the fixture value and every string that references it (truth ids, rubric, scorer, UI helper, test) in the same session; never half-migrate a module.');
  L.push('2. Keep the native value: where a native form is meaningful (`CORP\\user`, `M05-DEV-005`, `SYSTEM`), move it to an additive field (`AccountDomain`, `AssetId`, `RawEvent`) instead of deleting it.');
  L.push('3. Re-run `node scripts/soc-entity-identity-lint.js`, `node scripts/soc-telemetry-inventory.js` (entity counts must not collapse) and `for f in tests/*.test.js; do node "$f" >/dev/null 2>&1 || echo "FAIL $f"; done`.');
  L.push('4. When all modules are clean, add `--strict` to CI.', '');
  return L;
}

function main() {
  const mods = lint(loadScenarios());
  const { md, total, totalViol, totalBad, ids } = render(mods);
  if (WRITE) fs.writeFileSync(OUT, md);
  const out = [];
  out.push(`Entity identity lint: ${totalViol} violations on ${totalBad} rows (report-only${STRICT ? ', --strict' : ''})`);
  out.push(['module', 'rows', ...RULE_IDS, 'total'].join('\t'));
  for (const m of ids) {
    const x = mods[m];
    out.push([`M${String(m).padStart(2, '0')}`, x.rows, ...RULE_IDS.map((r) => x.counts[r] || 0), RULE_IDS.reduce((n, r) => n + (x.counts[r] || 0), 0)].join('\t'));
  }
  out.push(['all', '', ...RULE_IDS.map((r) => total[r] || 0), totalViol].join('\t'));
  if (WRITE) out.push(`Wrote ${path.relative(ROOT, OUT)}`);
  console.log(out.join('\n'));
  if (STRICT && totalViol > 0) process.exit(1);
}

if (require.main === module) main();
module.exports = { checkRow, loadScenarios, lint, RULES };

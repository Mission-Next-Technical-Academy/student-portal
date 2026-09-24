#!/usr/bin/env node
// Module 03 SIEM console: KQL engine, guided-step checks, and the assessment
// rubric scenarios required by docs/LAB_ASSESSMENT_STANDARD.md.
//   node tests/m03-siem-console.test.js   (exit 0 = all pass)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const PORTAL = path.join(__dirname, '..', 'portal');

const ctx = { console, esc: (s) => String(s ?? ''), moduleThreeState: { console: {} }, MODULE_THREE_FLAG: 'F', MODULE_THREE_CATALOG_LAB_KEY: 'lab-siem-triage' };
vm.createContext(ctx);
for (const f of ['kql-engine.js', 'soc-analyst-module-03-environment.js']) vm.runInContext(fs.readFileSync(path.join(PORTAL, f), 'utf8'), ctx, { filename: f });
// JSON round-trip: values from the vm realm have foreign prototypes, which
// deepStrictEqual treats as unequal.
const run = (code) => { const v = vm.runInContext(code, ctx); return v === undefined ? v : JSON.parse(JSON.stringify(v)); };

let failures = 0;
const t = (name, fn) => { try { fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e.message}`); } };

const q = (scope, query) => run(`MnKql.evaluate(${JSON.stringify(query)}, M03E_DATA.${scope}.tables, { now: M03E_DATA.${scope}.now })`);

console.log('KQL engine');
t('unknown table is an explicit error', () => assert.match(q('practice', 'Nope | take 5').error, /Unknown table/));
t('unsupported operator is an explicit error', () => assert.match(q('practice', 'AuthLog | frobnicate x').error, /Unsupported operator/));
t('where + sort asc returns ordered rows', () => {
  const r = q('practice', 'AuthLog\n| where Account == "acct-428"\n| sort by TimeGenerated asc');
  assert.strictEqual(r.rows.length, 5);
  assert.deepStrictEqual(r.rows.map((x) => x.EventId), ['A-1001', 'A-1003', 'A-1004', 'A-1005', 'A-1006']);
});
t('project keeps hidden record id but not as a column', () => {
  const r = q('practice', 'UnifiedEvents | where SessionId == "S-8841" | project TimeGenerated, EventSource');
  assert.ok(r.rows.every((x) => x.__rid));
  assert.deepStrictEqual(r.cols, ['TimeGenerated', 'EventSource']);
});
t('summarize count by', () => {
  const r = q('practice', 'UnifiedEvents | where SourceIp == "198.51.100.24" | summarize Events = count() by Account');
  assert.deepStrictEqual(r.rows.map((x) => [x.Account, x.Events]), [['acct-428', 7]]);
});
t('distinct, count, dcount, between, ago on lab clock', () => {
  assert.strictEqual(q('prove', 'AuthLog | where Result == "Failure" | distinct SourceIp').rows.length, 2);
  assert.strictEqual(q('prove', 'AuthLog | count').rows[0].Count, 16);
  assert.strictEqual(q('prove', 'AuthLog | where Result == "Failure" | summarize A = dcount(Account) by SourceIp | where A >= 5').rows[0].SourceIp, '203.0.113.77');
  assert.strictEqual(q('prove', 'AuthLog | where TimeGenerated between (datetime(2026-09-21T02:00:00Z) .. datetime(2026-09-21T02:07:00Z))').rows.length, 6);
  assert.ok(q('prove', 'UnifiedEvents | where TimeGenerated > ago(2h)').rows.length > 0);
});
t('join with watchlist', () => {
  const r = q('prove', 'AuthLog | where Result == "Success" | join kind=inner (TravelNotices) on Account');
  assert.deepStrictEqual(r.rows.map((x) => x.Account), ['t.nguyen']);
});
t('tables are stored newest-first (sorting is the learner’s job)', () => {
  const rows = q('practice', 'AuthLog').rows;
  assert.ok(rows[0].TimeGenerated > rows[rows.length - 1].TimeGenerated);
});

console.log('Guided steps (practice)');
const stepPasses = (id, query, st = {}) => run(`(() => { const step = M03E_GUIDE_STEPS.find((s) => s.id === ${JSON.stringify(id)}); const r = ${query ? `MnKql.evaluate(${JSON.stringify(query)}, M03E_DATA.practice.tables, { now: M03E_DATA.practice.now })` : 'null'}; return !!step.check({ seen: [], pins: [], ...${JSON.stringify(st)} }, r, ${JSON.stringify(query || '')}); })()`);
t('auth step accepts hint query', () => assert.ok(stepPasses('auth', 'AuthLog\n| where Account == "acct-428"')));
t('auth step accepts an equivalent UnifiedEvents query', () => assert.ok(stepPasses('auth', 'UnifiedEvents | where Account == "acct-428"')));
t('sort step rejects unsorted results', () => assert.ok(!stepPasses('sort', 'AuthLog | where Account == "acct-428"')));
t('sort step accepts sorted results', () => assert.ok(stepPasses('sort', 'AuthLog | where Account == "acct-428" | order by TimeGenerated asc')));
t('session step needs 3+ sources', () => {
  assert.ok(stepPasses('session', 'UnifiedEvents | where SessionId == "S-8841" | sort by TimeGenerated asc'));
  assert.ok(!stepPasses('session', 'AuthLog | where SessionId == "S-8841"'));
});
t('scope step needs an aggregate over the attacker IP', () => {
  assert.ok(stepPasses('scope', 'UnifiedEvents | where SourceIp == "198.51.100.24" | summarize count() by Account'));
  assert.ok(!stepPasses('scope', 'UnifiedEvents | where SourceIp == "198.51.100.24"'));
});
t('pin step needs the three chain records', () => {
  assert.ok(stepPasses('pin', null, { pins: ['A-1006', 'D-2001', 'P-3002'] }));
  assert.ok(!stepPasses('pin', null, { pins: ['A-1006'] }));
});

console.log('Assessment rubric (prove)');
const score = (work) => run(`moduleThreeScoreAssessment(${JSON.stringify(work)})`);
const comp = (res, id) => res.competencies.find((c) => c.id === id);
const handoff = {
  observations: 'AuthLog shows 203.0.113.77 spraying six accounts 02:03–02:10, then m.ortiz succeeding via legacy IMAP (S-5520) at 02:12.',
  analysis: 'Same session S-5520 created an inbox rule forwarding to ext-archive@proton-box.example, an app password, and downloaded finance files.',
  scope: 'm.ortiz compromised; d.hale password known but MFA denied. The idp-02 collector gap 02:20–02:36 means some events may be unconfirmed.',
  nextAction: 'Revoke m.ortiz sessions and app password, remove the forwarding rule, reset d.hale, block the IP, escalate to identity response.',
};
const perfect = {
  determination: {
    verdict: 'true-positive', severity: 'high',
    accountStatus: { 'm.ortiz': 'compromised', 'd.hale': 'exposed', 'r.kaur': 'targeted', 'p.sato': 'targeted', 'l.brooks': 'targeted', 'a.morgan': 'targeted', 't.nguyen': 'not-affected' },
    indicators: ['203.0.113.77', 'ext-archive@proton-box.example', 'S-5520'],
    actions: ['revoke-ortiz', 'remove-rule', 'revoke-apppw', 'reset-hale', 'block-ip', 'legacy-auth', 'notify-owner'],
    escalation: 'required', escalateTo: 'identity-response', handoff,
  },
  pins: ['A-5001', 'A-5002', 'A-5012', 'P-7001', 'P-7003', 'A-5011', 'D-6001'],
  queryLog: [{ sources: ['AuthLog'], pivot: false }, { sources: ['AuthLog', 'AppAudit', 'DirectoryAudit'], pivot: true }],
};
const clone = (o) => JSON.parse(JSON.stringify(o));

t('perfect investigation → full credit', () => { const r = score(perfect); assert.strictEqual(r.score, 100, JSON.stringify(r.competencies.map((c) => [c.id, c.earned]))); assert.ok(r.passed); });

t('partial: found secondary d.hale but missed data-access evidence → meaningful partial credit', () => {
  const w = clone(perfect); w.pins = ['A-5001', 'A-5002', 'A-5011']; w.determination.indicators = ['203.0.113.77'];
  const r = score(w);
  assert.ok(comp(r, 'evidence').earned >= 6 && comp(r, 'evidence').earned < 20);
  assert.ok(r.score > 50 && r.score < 100);
});

t('different valid path (UnifiedEvents vs per-table) → equivalent credit', () => {
  const a = clone(perfect); const b = clone(perfect);
  b.queryLog = [{ sources: ['AuthLog', 'AppAudit'], pivot: true }]; // one cross-source UnifiedEvents pivot
  b.pins = ['A-5003', 'A-5010', 'A-5012', 'P-7001', 'P-7005', 'A-5011', 'D-6001'];
  assert.strictEqual(score(a).score, score(b).score);
});

t('excessive exploration with correct determinations → no penalty', () => {
  const w = clone(perfect);
  w.pins = [...w.pins, 'A-5014', 'P-7007', 'S-8002', 'D-6002', 'A-5015'];
  w.queryLog = [...w.queryLog, ...Array.from({ length: 40 }, () => ({ sources: ['SystemLog'], pivot: false }))];
  assert.strictEqual(score(w).score, 100);
});

t('explicit unsupported conclusion (t.nguyen compromised, benign IP) → scope reduced only', () => {
  const w = clone(perfect); w.determination.accountStatus['t.nguyen'] = 'compromised'; w.determination.indicators.push('198.51.100.140');
  const r = score(w);
  assert.strictEqual(comp(r, 'scope').earned, 25 - 7);
  assert.strictEqual(comp(r, 'evidence').earned, 20);
  assert.ok(comp(r, 'scope').deductions.length === 2);
});

t('strong technical work, weak documentation → technical credit kept, documentation reduced', () => {
  const w = clone(perfect); w.determination.handoff = { observations: 'spray', analysis: 'bad', scope: 'ortiz', nextAction: 'fix' };
  const r = score(w);
  assert.strictEqual(comp(r, 'documentation').earned, 0);
  assert.strictEqual(r.score, 85);
  assert.ok(r.passed);
});

t('weak analysis with polished writing → communication credit only, critical miss caps below pass', () => {
  const w = {
    determination: { verdict: 'benign-positive', severity: 'low', accountStatus: {}, indicators: [], actions: [], escalation: 'not-required',
      handoff: {
        observations: 'The overnight alerts reflect routine authentication noise consistent with normal business operations.',
        analysis: 'Having carefully reviewed the situation, activity appears consistent with expected organisational behaviour patterns.',
        scope: 'No material scope concerns were identified during this thorough and comprehensive review of the environment.',
        nextAction: 'Continue standard monitoring procedures and revisit should additional indicators emerge in future reporting.',
      } },
    pins: [], queryLog: [],
  };
  const r = score(w);
  assert.strictEqual(comp(r, 'documentation').earned, 8);
  assert.strictEqual(r.total, 8);
  assert.ok(!r.passed);
  assert.strictEqual(r.criticalMisses.length, 2);
});

t('unsafe actions are deducted and reported', () => {
  const w = clone(perfect); w.determination.actions.push('purge-logs', 'disable-all');
  const r = score(w);
  assert.strictEqual(comp(r, 'response').earned, 7); // 14 + 3 escalation − 5 − 5
  assert.deepStrictEqual(comp(r, 'response').unsafe.length, 2);
});

t('critical miss caps an otherwise high score below passing', () => {
  const w = clone(perfect); w.determination.accountStatus['m.ortiz'] = 'exposed';
  const r = score(w);
  assert.ok(r.total >= 70); assert.strictEqual(r.score, 69); assert.ok(!r.passed);
});

t('partial-credit variants are not counted as misses', () => {
  const w = clone(perfect); w.determination.accountStatus['d.hale'] = 'compromised'; w.determination.severity = 'medium';
  const r = score(w);
  assert.strictEqual(comp(r, 'scope').earned, 22);
  assert.ok(comp(r, 'scope').misses.includes('d.hale marked credential-exposed'));
  assert.ok(!comp(r, 'scope').misses.some((m) => m.includes('over-stated')));
  assert.strictEqual(comp(r, 'verdict').earned, 13);
});

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const portal = path.join(__dirname, '..', 'portal');
const context = vm.createContext({
  esc: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
  caseRecordMissing: () => [],
  consoleGuideCard: () => '<aside id="m03e-learn-tip">Guided step</aside>',
  moduleThreeState: {
    console: {
      prove: {
        tab: 'search',
        query: 'UnifiedEvents | where Account == "m.ortiz"',
        lastQuery: 'UnifiedEvents | where Account == "m.ortiz"',
        pins: ['A-5012', 'P-7001', 'deleted-record'],
        selected: { type: 'account', id: 'm.ortiz' },
        timelineEntity: 'm.ortiz',
      },
      practice: {
        tab: 'entities',
        query: 'AuthLog | take 1',
        pins: ['A-1006'],
        guideStep: 3,
      },
    },
  },
});

for (const filename of [
  'kql-engine.js',
  'soc-console-core.js',
  'soc-kql-search-ui.js',
  'soc-evidence-ui.js',
  'soc-entity-ui.js',
  'soc-timeline-ui.js',
  'soc-alert-queue-ui.js',
  'soc-analyst-module-03-environment.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(portal, filename), 'utf8'), context, { filename });
}

const run = (expression) => {
  const value = vm.runInContext(expression, context);
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
};

const stateRef = vm.runInContext("m03eState('prove')", context);
const state = JSON.parse(JSON.stringify(stateRef));
assert.strictEqual(state.tab, 'search');
assert.strictEqual(state.query, 'UnifiedEvents | where Account == "m.ortiz"');
assert.strictEqual(state.lastQuery, 'UnifiedEvents | where Account == "m.ortiz"');
assert.deepStrictEqual(state.selected, { type: 'account', id: 'm.ortiz' });
assert.strictEqual(state.timelineEntity, 'm.ortiz');
assert.deepStrictEqual(state.pins, ['A-5012', 'P-7001', 'deleted-record']);
assert.deepStrictEqual(state.seen, []);
assert.ok(Array.isArray(state.queryLog));
assert.strictEqual(state.entityKind, 'account');
assert.strictEqual(vm.runInContext("m03eState('prove')", context), stateRef);
const practiceRef = vm.runInContext("m03eState('practice')", context);
assert.strictEqual(practiceRef.tab, 'entities');
assert.strictEqual(practiceRef.query, 'AuthLog | take 1');
assert.deepStrictEqual(Array.from(practiceRef.pins), ['A-1006']);
assert.strictEqual(practiceRef.guideStep, 3);
assert.strictEqual(practiceRef.guideCollapsed, false);
assert.strictEqual(practiceRef.lastQuery, '');
assert.deepStrictEqual(Array.from(practiceRef.seen), []);
assert.ok(Array.isArray(practiceRef.queryLog));
assert.strictEqual(vm.runInContext("m03eState('practice')", context), practiceRef);
assert.deepStrictEqual(Object.keys(context.moduleThreeState.console).sort(), ['practice', 'prove']);

const shell = run("moduleThreeConsoleHtml('prove')");
assert.match(shell, /<section class="m03e-console"/);
assert.match(shell, /<nav role="tablist">/);
assert.match(shell, /id="m03e-kql-prove"/);
run("moduleThreeConsoleHtml('prove')");
run("m03eSearchView('prove')");
run("m03eEvidenceView('prove')");
assert.strictEqual(vm.runInContext("m03eState('prove')", context), stateRef);
assert.strictEqual(vm.runInContext("m03eState('practice')", context), practiceRef);
assert.deepStrictEqual(Object.keys(context.moduleThreeState.console).sort(), ['practice', 'prove']);

stateRef.queryLog.push({ at: '09:00', query: state.lastQuery, rows: 1, sources: ['AppAudit'], pivot: false });
const search = run("m03eSearchView('prove')");
assert.match(search, /id="m03e-kql-prove"/);
assert.match(search, /UnifiedEvents/);
assert.match(search, /Query history · 1/);
assert.match(search, /m\.ortiz/);

const evidence = run("m03eEvidenceView('prove')");
assert.match(evidence, /PINNED EVIDENCE · 2/);
assert.match(evidence, /A-5012/);
assert.match(evidence, /P-7001/);
assert.doesNotMatch(evidence, /deleted-record/);

const entities = run("m03eEntitiesView('prove')");
assert.match(entities, /data-m03e-entitykind="prove:account"/);
const profile = run("m03eDrawer('prove')");
assert.match(profile, /m\.ortiz/);
assert.match(profile, /Hunt this account/);
assert.match(profile, /data-m03e-show-timeline="prove:m\.ortiz"/);

const timeline = run("m03eTimelineView('prove')");
assert.match(timeline, /data-m03e-timeline="prove"/);
assert.match(timeline, /class="m03e-tl-item/);
assert.match(timeline, /data-m03e-pin="prove:/);

stateRef.selected = { type: 'alert', id: 'ALT-5171' };
const alerts = run("m03eAlertsView('prove')");
assert.match(alerts, /<caption>ALERT QUEUE · CASE-MN-517/);
assert.match(alerts, /data-m03e-select="prove:alert:ALT-5171"/);
const alertDetails = run("m03eDrawer('prove')");
assert.match(alertDetails, /Detection rule/);
assert.match(alertDetails, /data-m03e-hunt="prove"/);
assert.match(alertDetails, /data-m03e-show-timeline="prove:/);

console.log('M03 shared console integration: all checks passed');

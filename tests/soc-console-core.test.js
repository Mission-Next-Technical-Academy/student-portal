#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-console-core.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context, { filename: 'soc-console-core.js' });
const core = vm.runInContext('SocConsoleCore', context);

const rendered = core.renderShell({
  shellClass: 'm03e-console',
  ariaLabel: 'SIEM and log analysis console',
  eyebrow: 'MISSION NEXT ENVIRONMENT · GUIDED',
  title: 'SIEM & LOG ANALYSIS',
  contextHtml: '<span class="m03e-case">CASE-1</span>',
  navigationHtml: '<nav role="tablist"><button>Alerts</button></nav>',
  workspaceClassName: 'm03e-workspace',
  workspaceClass: 'is-case',
  guideHtml: '<aside>Guide</aside>',
  viewClassName: 'm03e-view',
  viewHtml: '<main>Case view</main>',
  drawerHtml: '',
});

assert.match(rendered, /<section class="m03e-console" aria-label="SIEM and log analysis console">/);
assert.match(rendered, /<nav role="tablist"><button>Alerts<\/button><\/nav>/);
assert.match(rendered, /class="m03e-workspace is-case"/);
assert.match(rendered, /<aside>Guide<\/aside><div class="m03e-view"><main>Case view<\/main><\/div>/);
assert.doesNotMatch(rendered, /undefined|null/);
assert.match(core.renderShell({ title: '<unsafe>' }), /&lt;unsafe&gt;/);

const adapter = core.createStateAdapter({
  containerKey: 'console',
  defaultsByScope: { practice: { pins: [], tab: 'alerts' }, prove: { pins: [], tab: 'alerts' } },
  normalizeState(state) { if (!Array.isArray(state.pins)) state.pins = []; },
});
const root = { console: { practice: { tab: 'search', pins: ['A-1'] } } };
const practice = adapter.get(root, 'practice');
assert.strictEqual(practice.tab, 'search');
assert.deepStrictEqual(Array.from(practice.pins), ['A-1']);
assert.strictEqual(adapter.get(root, 'practice'), practice);
practice.pins.push('D-2');
assert.deepStrictEqual(Array.from(adapter.get(root, 'practice').pins), ['A-1', 'D-2']);
assert.strictEqual(root.console.practice, practice);
assert.deepStrictEqual(Array.from(adapter.get(root, 'prove').pins), []);
assert.notStrictEqual(adapter.get(root, 'prove').pins, adapter.get(root, 'practice').pins);
assert.deepStrictEqual(Object.keys(root.console).sort(), ['practice', 'prove']);

console.log('soc-console-core: all checks passed');

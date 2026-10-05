#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-evidence-ui.js'), 'utf8'), context);
const ui = vm.runInContext('SocEvidenceUi', context);
const records = {
  late: { __rid: 'late', TimeGenerated: '2026-09-21T10:00:00Z', value: 'second' },
  early: { __rid: 'early', TimeGenerated: '2026-09-21T09:00:00Z', value: 'first' },
  tied: { __rid: 'tied', TimeGenerated: '2026-09-21T09:00:00Z', value: 'third' },
};
const state = { pins: [] };

assert.strictEqual(ui.togglePin(state, 'late', { records }), true);
assert.strictEqual(ui.togglePin(state, 'late', { records }), false);
assert.deepStrictEqual(Array.from(state.pins), []);
assert.strictEqual(ui.togglePin(state, 'missing', { records }), false);
assert.deepStrictEqual(Array.from(state.pins), []);
ui.togglePin(state, 'late', { records });
ui.togglePin(state, 'tied', { records });
ui.togglePin(state, 'early', { records });
state.pins.push('deleted', 'late');
assert.deepStrictEqual(Array.from(ui.pinnedRecords(state, records)).map((record) => record.__rid), ['tied', 'early', 'late']);

const button = ui.renderPinButton({ scope: 'prove', id: 'A-1', pinned: true, attributes: (scope, id) => `data-pin="${scope}:${id}"` });
assert.match(button, /data-pin="prove:A-1"/);
assert.match(button, /aria-pressed="true"/);
assert.match(button, /Unpin A-1/);

const tray = ui.renderTray({
  scope: 'prove', state: { pins: ['early'] }, records,
  columns: [{ header: 'Value', render: (record) => record.value }],
  rowAttributes: (scope, record) => `data-select="${scope}:${record.__rid}"`,
  selectedRow: (record) => record.__rid === 'early',
  renderPin: (scope, record) => `<button data-pin="${scope}:${record.__rid}">Pin</button>`,
  emptyMessage: 'No evidence',
});
assert.match(tray, /PINNED EVIDENCE · 1/);
assert.match(tray, /data-select="prove:early"/);
assert.match(tray, /class="is-selected"/);
assert.match(tray, /first/);
assert.match(ui.renderTray({ scope: 'prove', state: { pins: [] }, records, columns: [], rowAttributes: () => '', selectedRow: () => false, renderPin: () => '' }), /Nothing pinned yet/);

console.log('soc-evidence-ui: all checks passed');

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-timeline-ui.js'), 'utf8'), context);
const ui = vm.runInContext('SocTimelineUi', context);

const empty = ui.render({
  scope: 'prove', selectedEntity: '', entityGroups: [{ label: 'Accounts', values: ['acct-1'] }], items: [],
  renderItem: () => '', selectAttributes: (scope) => `data-timeline="${scope}"`,
});
assert.match(empty, /data-timeline="prove"/);
assert.match(empty, /<optgroup label="Accounts"><option value="acct-1"/);
assert.match(empty, /Choose an entity to lay every source on one clock/);
assert.doesNotMatch(empty, /<ol/);

const rendered = ui.render({
  scope: 'prove', selectedEntity: '<host>',
  entityGroups: [{ label: 'Hosts & devices', values: ['<host>', 'host-2'] }],
  items: [{ id: 'event-1' }, { id: 'gap-1' }],
  renderItem: (item) => `<li>${item.id}</li>`,
  selectAttributes: () => 'data-timeline="prove"',
  legendHtml: '<b>AuthLog</b>',
  escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
});
assert.match(rendered, /value="&lt;host&gt;" selected/);
assert.match(rendered, /label="Hosts &amp; devices"/);
assert.ok(rendered.indexOf('<li>event-1</li>') < rendered.indexOf('<li>gap-1</li>'));
assert.match(rendered, /<b>AuthLog<\/b>/);

console.log('soc-timeline-ui: all checks passed');

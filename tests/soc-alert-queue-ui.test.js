#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-alert-queue-ui.js'), 'utf8'), context);
const ui = vm.runInContext('SocAlertQueueUi', context);

const html = ui.render({
  scope: 'lab', rows: [{ id: 'A&1', title: '<first>' }, { id: 'B-2', title: 'second' }],
  caption: 'QUEUE <test>',
  columns: [
    { header: 'ALERT', render: (row) => `<strong>${row.title.replace('<', '&lt;').replace('>', '&gt;')}</strong>` },
    { header: 'ID', className: 'alert-id', render: (row) => row.id.replace('&', '&amp;') },
  ],
  selectedRow: (row) => row.id === 'B-2',
  rowAttributes: (scope, row) => `data-select="${scope}:${row.id.replace('&', '&amp;')}"`,
  footerHtml: '<p>Queue note</p>', prefix: 'alert',
});
assert.match(html, /<caption>QUEUE &lt;test&gt;<\/caption>/);
assert.match(html, /<th>ALERT<\/th><th>ID<\/th>/);
assert.match(html, /<td><strong>&lt;first&gt;<\/strong><\/td><td class="alert-id">A&amp;1<\/td>/);
assert.match(html, /<tr class="is-selected" data-select="lab:B-2" tabindex="0">/);
assert.ok(html.indexOf('data-select="lab:A&amp;1"') < html.indexOf('data-select="lab:B-2"'));
assert.match(html, /<p>Queue note<\/p><\/section>$/);

const detailActions = [];
const detail = ui.renderDetail({
  alert: {
    title: 'Alert <one>', rule: 'Rule & context', query: 'AuthLog\n| where Account == "a&b"',
    entities: ['a&b', 'host<2>'],
  },
  fields: [{ label: 'Alert ID', value: 'A&1' }, { label: 'Fired', value: '' }],
  ruleHeading: 'Detection <rule>', prefix: 'alert',
  huntAction: (query) => { detailActions.push(['hunt', query]); return '<button data-hunt="rule">Hunt</button>'; },
  timelineAction: (entity) => { detailActions.push(['timeline', entity]); return `<button data-timeline="${entity}">Timeline</button>`; },
});
assert.match(detail, /^<h3>Alert &lt;one&gt;<\/h3><dl class="alert-fields">/);
assert.match(detail, /<dt>Alert ID<\/dt><dd>A&amp;1<\/dd>/);
assert.match(detail, /<dt>Fired<\/dt><dd>\u2014<\/dd>/);
assert.match(detail, /<h4>Detection &lt;rule&gt;<\/h4><p>Rule &amp; context<\/p>/);
assert.match(detail, /<pre class="alert-code">AuthLog\n\| where Account == &quot;a&amp;b&quot;<\/pre>/);
assert.match(detail, /data-hunt="rule"/);
assert.deepStrictEqual(detailActions, [
  ['hunt', 'AuthLog\n| where Account == "a&b"'],
  ['timeline', 'a&b'],
  ['timeline', 'host<2>'],
]);

const customField = ui.renderDetail({
  alert: { title: 'A', rule: 'R', query: 'Q', entities: [] },
  fields: [{ label: 'ID', value: 'A-1' }], ruleHeading: 'Rule',
  renderField: (label, value) => `<custom>${label}:${value}</custom>`,
  huntAction: () => '', timelineAction: () => '',
});
assert.match(customField, /<dl class="m03e-fields"><custom>ID:A-1<\/custom><\/dl>/);

console.log('soc-alert-queue-ui: all checks passed');

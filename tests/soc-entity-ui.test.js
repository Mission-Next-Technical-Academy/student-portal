#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-entity-ui.js'), 'utf8'), context);
const ui = vm.runInContext('SocEntityUi', context);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const list = ui.renderList({
  scope: 'prove', kind: 'ip', kinds: [{ id: 'account', label: 'Accounts' }, { id: 'ip', label: 'IP addresses' }],
  rows: [{ id: '198.51.100.5', subtitle: 'External · NL' }, { id: '<unsafe>', subtitle: 'test' }],
  isSelected: (kind, id) => kind === 'ip' && id === '198.51.100.5',
  kindAttributes: (scope, kind) => `data-kind="${scope}:${kind}"`,
  rowAttributes: (scope, kind, id) => `data-select="${scope}:${kind}:${escapeHtml(id)}"`,
  escapeHtml,
});
assert.match(list, /data-kind="prove:ip"/);
assert.match(list, /class="is-selected" data-select="prove:ip:198.51.100.5"/);
assert.match(list, /&lt;unsafe&gt;/);

const profile = ui.renderProfile({
  id: 'acct-24', subtitle: 'Finance user',
  fields: [{ label: 'Status', value: 'Compromised' }, { label: 'Missing', value: '' }],
  note: 'Check <evidence>', actionsHtml: '<button data-pivot="account">Hunt</button>', escapeHtml,
});
assert.match(profile, /<h3>acct-24<\/h3><p>Finance user<\/p>/);
assert.match(profile, /<dt>Status<\/dt><dd>Compromised<\/dd>/);
assert.match(profile, /<dt>Missing<\/dt><dd>—<\/dd>/);
assert.match(profile, /Check &lt;evidence&gt;/);
assert.match(profile, /data-pivot="account"/);
assert.match(ui.renderProfile({ id: '198.51.100.5', mono: true, fields: [] }), /class="m03e-mono"/);

const fields = { account: 'Account', ip: 'SourceIp', host: 'Host' };
for (const [kind, field] of Object.entries(fields)) {
  const value = { account: 'acct-24', ip: '198.51.100.5', host: 'billing-app' }[kind];
  assert.strictEqual(ui.buildPivotQuery(kind, value), `UnifiedEvents\n| where ${field} == "${value}"\n| sort by TimeGenerated asc`);
  const button = ui.renderPivotButton({ scope: 'prove', kind, value, label: `Hunt this ${kind}` });
  assert.match(button, /data-m03e-hunt="prove"/);
  assert.ok(button.includes(`data-query="${escapeHtml(ui.buildPivotQuery(kind, value))}"`));
  assert.ok(button.includes(`Hunt this ${kind}</button>`));
}
assert.throws(() => ui.buildPivotQuery('session', 'S-1'), /Unsupported entity kind/);

const unsafe = 'a" | take 0 <& \' \\';
for (const [kind, field] of Object.entries(fields)) {
  const query = ui.buildPivotQuery(kind, unsafe);
  const button = ui.renderPivotButton({ scope: 'prove" <', kind, value: unsafe, label: 'Hunt <&"' });
  assert.ok(button.includes(`data-m03e-hunt="${escapeHtml('prove" <')}"`));
  assert.ok(button.includes(`data-query="${escapeHtml(query)}"`));
  assert.ok(button.includes(`Hunt ${escapeHtml('<&"')}</button>`));
  assert.ok(!button.includes('data-m03e-hunt="prove" <'));

  const kqlContext = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'kql-engine.js'), 'utf8'), kqlContext);
  kqlContext.query = query;
  kqlContext.rows = [
    { [field]: unsafe, TimeGenerated: '2026-09-18T09:00:00Z' },
    { [field]: 'different', TimeGenerated: '2026-09-18T09:01:00Z' },
  ];
  const result = vm.runInContext('MnKql.evaluate(query, { UnifiedEvents: rows })', kqlContext);
  assert.ok(!result.error, `${kind}: ${result.error}`);
  assert.strictEqual(result.rows.length, 1, kind);
  assert.strictEqual(result.rows[0][field], unsafe);
}

for (const value of ['line\nbreak', 'path\\', 'quote"backslash\\']) {
  const query = ui.buildPivotQuery('host', value);
  const kqlContext = vm.createContext({ query, rows: [{ Host: value, TimeGenerated: '2026-09-18T09:00:00Z' }] });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'kql-engine.js'), 'utf8'), kqlContext);
  const result = vm.runInContext('MnKql.evaluate(query, { UnifiedEvents: rows })', kqlContext);
  assert.ok(!result.error, result.error);
  assert.strictEqual(result.rows.length, 1, value);
}

console.log('soc-entity-ui: all checks passed');

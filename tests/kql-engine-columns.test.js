#!/usr/bin/env node
// Result columns are the union of keys across result rows (first-seen order), so a
// column missing from the first row still renders for the rows that carry it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'kql-engine.js'), 'utf8') + '\nthis.MnKql = MnKql;', ctx);
const { evaluate } = ctx.MnKql;

const tables = {
  ScopeChecks: [
    { TimeGenerated: '2026-09-27T10:00:00Z', EventId: 'E10', CheckName: 'Data access check', Account: 'soc-analyst' },
    { TimeGenerated: '2026-09-27T09:00:00Z', EventId: 'E05', Host: 'ws-173', Account: 'soc-analyst' },
  ],
};

const all = evaluate('ScopeChecks', tables);
assert.ok(!all.error, all.error);
assert.deepStrictEqual([...all.cols], ['TimeGenerated', 'EventId', 'CheckName', 'Account', 'Host']);

const filtered = evaluate('ScopeChecks | where Account == "soc-analyst"', tables);
assert.ok(filtered.cols.includes('Host'), 'Host column must survive when the first row lacks it');

const projected = evaluate('ScopeChecks | project EventId, Host', tables);
assert.deepStrictEqual([...projected.cols], ['EventId', 'Host']);

const empty = evaluate('ScopeChecks | where Account == "nobody"', tables);
assert.strictEqual(empty.rows.length, 0);
assert.deepStrictEqual([...empty.cols], ['TimeGenerated', 'EventId', 'CheckName', 'Account']);

console.log('kql-engine-columns: ok');

#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-kql-search-ui.js'), 'utf8'), context);
const ui = vm.runInContext('SocKqlSearchUi', context);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const state = { query: '', lastQuery: '', queryLog: [] };
let evaluated = '';
const successful = ui.executeQuery(state, 'AuthLog | take 1', {
  evaluate(query) { evaluated = query; return { rows: [{ id: 'A-1' }] }; },
  makeHistoryEntry(result, query) { return { query, rows: result.rows.length }; },
});
assert.strictEqual(evaluated, 'AuthLog | take 1');
assert.strictEqual(state.query, 'AuthLog | take 1');
assert.strictEqual(state.lastQuery, 'AuthLog | take 1');
assert.strictEqual(successful.rows.length, 1);
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.queryLog)), [{ query: 'AuthLog | take 1', rows: 1 }]);
ui.executeQuery(state, 'bad query', {
  evaluate: () => ({ error: 'invalid' }),
  makeHistoryEntry: () => { throw new Error('failed query must not be logged'); },
});
assert.strictEqual(state.queryLog.length, 1);
state.queryLog = [{ query: 'old-1' }, { query: 'old-2' }];
ui.executeQuery(state, 'new query', { evaluate: () => ({ rows: [] }), makeHistoryEntry: (result, query) => ({ query }), historyLimit: 2 });
assert.deepStrictEqual(JSON.parse(JSON.stringify(state.queryLog)), [{ query: 'old-2' }, { query: 'new query' }]);
ui.selectTemplate(state, 'AuthLog | where Result == "Failure"', { tab: 'search' });
assert.strictEqual(state.query, 'AuthLog | where Result == "Failure"');
assert.strictEqual(state.tab, 'search');
assert.strictEqual(state.lastQuery, 'new query');
ui.clearQuery(state);
assert.strictEqual(state.query, '');
assert.strictEqual(state.lastQuery, '');
assert.strictEqual(state.queryLog.length, 2);

const schema = ui.renderSchema({
  scope: 'prove', tables: { AuthLog: [{ id: 1 }] }, columns: { AuthLog: ['Account'] },
  groups: [['Source tables', ['AuthLog']]], prefix: 'm03e', escapeHtml,
  renderTableButton: (scope, name) => `data-m03e-table="${scope}:${name}"`,
});
assert.match(schema, /data-m03e-table="prove:AuthLog"/);
assert.match(schema, /<li>Account<\/li>/);

const results = ui.renderResults({
  result: { cols: ['EventSource', 'TimeGenerated'], rows: [{ __rid: 'A-1', EventSource: 'AuthLog', TimeGenerated: '2026-09-21T02:00:00Z' }] },
  scope: 'prove', prefix: 'm03e', escapeHtml, selectedRow: () => true,
  rowAttributes: (scope, row) => `data-m03e-select="${scope}:record:${row.__rid}"`,
  renderPin: (scope, row) => `<button>${row.__rid}</button>`,
  renderEventSource: (value) => `<b>${value}</b>`,
});
assert.match(results, /is-selected/);
assert.match(results, /data-m03e-select="prove:record:A-1"/);
assert.match(results, /<b>AuthLog<\/b>/);
assert.match(results, /2026-09-21 02:00:00/);
assert.match(ui.renderResults({ result: { error: '<bad>' }, escapeHtml }), /&lt;bad&gt;/);
assert.match(ui.renderResults({ result: null }), /Run a query to see results/);

const history = ui.renderHistory({ entries: [{ at: '09:00', query: 'AuthLog | take 1', rows: 1 }], escapeHtml });
assert.match(history, /Query history · 1/);
assert.match(history, /AuthLog \| take 1/);

const search = ui.renderSearch({
  scope: 'prove', query: 'AuthLog', clock: '2026-09-21 02:00', schemaHtml: schema, resultsHtml: results,
  examples: [['Example', 'AuthLog']], historyHtml: history,
  renderRunAttributes: (scope) => `data-run="${scope}"`, renderClearAttributes: () => 'data-clear',
  renderExampleAttributes: () => 'data-example', escapeHtml,
});
assert.match(search, /id="m03e-kql-prove"/);
assert.match(search, /data-run="prove"/);
assert.match(search, /Query history · 1/);

console.log('soc-kql-search-ui: all checks passed');

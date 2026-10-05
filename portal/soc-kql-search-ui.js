/* Shared KQL search rendering and state transitions. Callers own evaluation. */
const SocKqlSearchUi = (() => {
  'use strict';

  function executeQuery(state, query, { evaluate, makeHistoryEntry, historyLimit = 60 }) {
    state.query = query;
    state.lastQuery = query;
    const result = evaluate(query);
    if (result && !result.error) {
      if (!Array.isArray(state.queryLog)) state.queryLog = [];
      state.queryLog.push(makeHistoryEntry(result, query));
      if (state.queryLog.length > historyLimit) state.queryLog.splice(0, state.queryLog.length - historyLimit);
    }
    return result;
  }

  function clearQuery(state) {
    state.query = '';
    state.lastQuery = '';
  }

  function selectTemplate(state, query, { tab } = {}) {
    state.query = query;
    if (tab != null) state.tab = tab;
  }

  const defaultEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function renderSchema({ scope, tables, columns, groups, renderTableButton, prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    return `<aside class="${e(prefix)}-schema" aria-label="Tables"><p class="${e(prefix)}-label">SCHEMA</p>${groups.map(([title, names]) => `<div class="${e(prefix)}-schema-group"><em>${e(title)}</em>${names.map((name) => `<details><summary><button type="button" ${renderTableButton(scope, name)} title="Insert ${e(name)} | take 20">${e(name)}</button><span>${tables[name].length}</span></summary><ul>${columns[name].map((column) => `<li>${e(column)}</li>`).join('')}</ul></details>`).join('')}</div>`).join('')}</aside>`;
  }

  function renderResults({ result, scope, selectedRow, rowAttributes, renderPin, renderEventSource, prefix = 'm03e', recordIdField = '__rid', sourceColumn = 'EventSource', timeColumn = 'TimeGenerated', maxRows = 200, escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    if (!result) return `<div class="${e(prefix)}-results-empty">Run a query to see results. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs from the editor.</div>`;
    if (result.error) return `<div class="${e(prefix)}-query-error" role="alert"><i class="ri-error-warning-line" aria-hidden="true"></i> ${e(result.error)}</div>`;
    const rows = result.rows || [], cols = result.cols || [];
    const pinnable = rows.some((row) => row[recordIdField]);
    const shown = rows.slice(0, maxRows);
    const cell = (value) => e(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value);
    return `<div class="${e(prefix)}-results-bar"><strong>${rows.length} row${rows.length === 1 ? '' : 's'}</strong><span>${e(cols.join(' · '))}</span>${pinnable ? '' : rows.length ? `<span class="${e(prefix)}-muted">Aggregated rows cannot be pinned — pin from a row-level query.</span>` : ''}</div>
    ${rows.length ? `<div class="${e(prefix)}-table-wrap ${e(prefix)}-results-grid"><table class="${e(prefix)}-table ${e(prefix)}-grid"><thead><tr>${pinnable ? '<th aria-label="Pin"></th>' : ''}${cols.map((column) => `<th>${e(column)}</th>`).join('')}</tr></thead><tbody>${shown.map((row) => `<tr class="${row[recordIdField] && selectedRow(row) ? 'is-selected' : ''}" ${row[recordIdField] ? rowAttributes(scope, row) : ''}>${pinnable ? `<td>${row[recordIdField] ? renderPin(scope, row) : ''}</td>` : ''}${cols.map((column) => `<td>${column === sourceColumn ? renderEventSource(row[column]) : column === timeColumn ? e(String(row[column]).replace('T', ' ').replace('Z', '')) : cell(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > maxRows ? `<p class="${e(prefix)}-muted">Showing the first ${maxRows} rows.</p>` : ''}` : `<div class="${e(prefix)}-results-empty">No rows matched. Check the time window, field names and exact values before widening the search.</div>`}`;
  }

  function renderHistory({ entries = [], prefix = 'm03e', escapeHtml = defaultEscape, renderEntry } = {}) {
    const e = escapeHtml;
    return `<details class="${e(prefix)}-query-history"><summary>Query history · ${entries.length}</summary><ol>${entries.map((entry, index) => `<li>${renderEntry ? renderEntry(entry, index) : `<time>${e(entry.at || '')}</time><code>${e(entry.query || '')}</code><span>${e(entry.rows ?? 0)} rows</span>`}</li>`).join('')}</ol></details>`;
  }

  function renderSearch({ scope, query, clock, schemaHtml, resultsHtml, examples = [], historyHtml = '', renderRunAttributes, renderClearAttributes, renderExampleAttributes, prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    const examplesHtml = examples.length ? `<div class="${e(prefix)}-examples"><span class="${e(prefix)}-label">EXAMPLES</span>${examples.map(([label, sample]) => `<button type="button" ${renderExampleAttributes(scope, sample)}>${e(label)}</button>`).join('')}</div>` : '';
    return `<section class="${e(prefix)}-search"><div class="${e(prefix)}-search-layout">${schemaHtml}<div class="${e(prefix)}-search-main"><div class="${e(prefix)}-editor-host"><textarea class="kql" id="${e(prefix)}-kql-${e(scope)}" rows="6" aria-label="KQL query">${e(query)}</textarea></div><div class="${e(prefix)}-search-actions"><button type="button" class="${e(prefix)}-primary" ${renderRunAttributes(scope)}><i class="ri-play-fill" aria-hidden="true"></i> Run query</button><button type="button" class="${e(prefix)}-secondary" ${renderClearAttributes(scope)}>Clear</button><span class="${e(prefix)}-muted">Lab clock: ${e(clock)} UTC · ago() is relative to it</span></div>${examplesHtml}${historyHtml}<div class="${e(prefix)}-results" id="${e(prefix)}-results-${e(scope)}">${resultsHtml}</div></div></div></section>`;
  }

  return Object.freeze({ executeQuery, clearQuery, selectTemplate, renderSchema, renderResults, renderHistory, renderSearch });
})();

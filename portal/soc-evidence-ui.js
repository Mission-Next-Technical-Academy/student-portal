/* Shared evidence selection and tray rendering. Callers own records and field markup. */
const SocEvidenceUi = (() => {
  'use strict';

  const defaultEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function isPinned(state, id) {
    return Array.isArray(state.pins) && state.pins.includes(id);
  }

  function togglePin(state, id, { records } = {}) {
    if (!Array.isArray(state.pins)) state.pins = [];
    if (isPinned(state, id)) {
      for (let i = state.pins.length - 1; i >= 0; i--) {
        if (state.pins[i] === id) state.pins.splice(i, 1);
      }
      return false;
    }
    if (!id || !records || !Object.hasOwn(records, id) || !records[id]) return false;
    state.pins.push(id);
    return true;
  }

  function pinnedRecords(state, records, { getTime = (record) => record.TimeGenerated } = {}) {
    const seen = new Set();
    return (Array.isArray(state.pins) ? state.pins : [])
      .map((id, index) => ({ id, index, record: records && Object.hasOwn(records, id) ? records[id] : null }))
      .filter(({ id, record }) => {
        if (!record || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .sort((a, b) => String(getTime(a.record) ?? '').localeCompare(String(getTime(b.record) ?? '')) || a.index - b.index)
      .map(({ record }) => record);
  }

  function renderPinButton({ scope, id, pinned, attributes, prefix = 'm03e', escapeHtml = defaultEscape, className = '' }) {
    const e = escapeHtml;
    const action = pinned ? 'Unpin' : 'Pin';
    return `<button type="button" class="${e(prefix)}-pin${className ? ` ${e(className)}` : ''}${pinned ? ' is-pinned' : ''}" ${attributes(scope, id)} aria-pressed="${pinned}" title="${pinned ? 'Remove from evidence' : 'Pin as evidence'}"><i class="${pinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}" aria-hidden="true"></i><span class="${e(prefix)}-sr-only">${action} ${e(id)}</span></button>`;
  }

  function renderTray({ scope, state, records, columns, getId = (record) => record.__rid, getTime, selectedRow, rowAttributes, renderPin, caption = 'PINNED EVIDENCE', emptyMessage = 'Nothing pinned yet.', footerHtml = '', prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    const pins = pinnedRecords(state, records, { getTime });
    return `<section><div class="${e(prefix)}-table-wrap"><table class="${e(prefix)}-table"><caption>${e(caption)} · ${pins.length}</caption>${pins.length ? `<thead><tr><th></th>${columns.map((column) => `<th>${e(column.header)}</th>`).join('')}</tr></thead><tbody>${pins.map((record) => `<tr ${rowAttributes(scope, record)} tabindex="0" class="${selectedRow(record) ? 'is-selected' : ''}"><td>${renderPin(scope, record)}</td>${columns.map((column) => `<td${column.className ? ` class="${e(column.className)}"` : ''}>${column.render(record)}</td>`).join('')}</tr>`).join('')}</tbody>` : ''}</table></div>${pins.length ? '' : `<div class="${e(prefix)}-results-empty">${e(emptyMessage)}</div>`}${footerHtml}</section>`;
  }

  return Object.freeze({ isPinned, togglePin, pinnedRecords, renderPinButton, renderTray });
})();

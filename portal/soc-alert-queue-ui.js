/* Shared alert queue and detail markup. Callers own alert data and actions. */
const SocAlertQueueUi = (() => {
  'use strict';

  const defaultEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function render({ scope, rows, caption, columns, selectedRow, rowAttributes, footerHtml = '', prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    return `<section><div class="${e(prefix)}-table-wrap"><table class="${e(prefix)}-table"><caption>${e(caption)}</caption><thead><tr>${columns.map((column) => `<th>${e(column.header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr class="${selectedRow(row) ? 'is-selected' : ''}" ${rowAttributes(scope, row)} tabindex="0">${columns.map((column) => `<td${column.className ? ` class="${e(column.className)}"` : ''}>${column.render(row)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${footerHtml}</section>`;
  }

  function renderDetail({ alert, fields, ruleHeading, huntAction, timelineAction, prefix = 'm03e', escapeHtml = defaultEscape, renderField }) {
    const e = escapeHtml;
    const field = renderField || ((label, value) => `<div class="${e(prefix)}-field"><dt>${e(label)}</dt><dd>${e(value == null || value === '' ? '\u2014' : value)}</dd></div>`);
    return `<h3>${e(alert.title)}</h3><dl class="${e(prefix)}-fields">${fields.map(({ label, value }) => field(label, value)).join('')}</dl><h4>${e(ruleHeading)}</h4><p>${e(alert.rule)}</p><pre class="${e(prefix)}-code">${e(alert.query)}</pre>${huntAction(alert.query)}${alert.entities.map((entity) => timelineAction(entity)).join('')}`;
  }

  return Object.freeze({ render, renderDetail });
})();

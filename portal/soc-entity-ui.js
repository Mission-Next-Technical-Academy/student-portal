/* Shared entity list and profile markup. Callers supply rows, fields, and actions. */
const SocEntityUi = (() => {
  'use strict';

  const defaultEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const pivotFields = Object.freeze({ account: 'Account', ip: 'SourceIp', host: 'Host' });

  function buildPivotQuery(kind, value) {
    const field = pivotFields[kind];
    if (!field) throw new RangeError(`Unsupported entity kind: ${kind}`);
    // The KQL evaluator accepts JavaScript string literals. Unicode-escape
    // backslashes so its pipeline splitter also handles trailing backslashes.
    const literal = JSON.stringify(String(value)).replace(/\\\\/g, '\\u005c');
    return `UnifiedEvents\n| where ${field} == ${literal}\n| sort by TimeGenerated asc`;
  }

  function renderPivotButton({ scope, kind, value, label, prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    return `<button type="button" data-${e(prefix)}-hunt="${e(scope)}" data-query="${e(buildPivotQuery(kind, value))}"><i class="ri-search-line" aria-hidden="true"></i> ${e(label)}</button>`;
  }

  function renderList({ scope, kind, kinds, rows, isSelected, kindAttributes, rowAttributes, prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    return `<section class="${e(prefix)}-listing"><div class="${e(prefix)}-subtabs">${kinds.map((item) => `<button type="button" class="${kind === item.id ? 'is-active' : ''}" ${kindAttributes(scope, item.id)}>${e(item.label)}</button>`).join('')}</div>${rows.map((row) => `<button type="button" class="${isSelected(kind, row.id) ? 'is-selected' : ''}" ${rowAttributes(scope, kind, row.id)}><strong>${e(row.id)}</strong><span>${e(row.subtitle)}</span><i class="ri-arrow-right-line" aria-hidden="true"></i></button>`).join('')}</section>`;
  }

  function renderProfile({ id, mono = false, subtitle, fields, note, actionsHtml = '', prefix = 'm03e', escapeHtml = defaultEscape }) {
    const e = escapeHtml;
    const fieldHtml = fields.map(({ label, value }) => `<div class="${e(prefix)}-field"><dt>${e(label)}</dt><dd>${e(value == null || value === '' ? '—' : value)}</dd></div>`).join('');
    return `<h3${mono ? ` class="${e(prefix)}-mono"` : ''}>${e(id)}</h3>${subtitle == null ? '' : `<p>${e(subtitle)}</p>`}<dl class="${e(prefix)}-fields">${fieldHtml}</dl>${note ? `<p class="${e(prefix)}-callout-note">${e(note)}</p>` : ''}${actionsHtml}`;
  }

  return Object.freeze({ renderList, renderProfile, buildPivotQuery, renderPivotButton });
})();

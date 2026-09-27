/* Shared timeline frame. Callers choose and format the ordered items. */
const SocTimelineUi = (() => {
  'use strict';

  const defaultEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function render({
    scope, selectedEntity, entityGroups, items, renderItem, selectAttributes,
    legendHtml = '', entityLabel = 'Entity', placeholder = 'Choose an entity…',
    emptyMessage = 'Choose an entity to lay every source on one clock.',
    prefix = 'm03e', escapeHtml = defaultEscape,
  }) {
    const e = escapeHtml;
    const groupsHtml = entityGroups.map(({ label, values }) => `<optgroup label="${e(label)}">${values.map((value) => `<option value="${e(value)}" ${value === selectedEntity ? 'selected' : ''}>${e(value)}</option>`).join('')}</optgroup>`).join('');
    return `<section class="${e(prefix)}-timeline"><div class="${e(prefix)}-timeline-head"><label>${e(entityLabel)} <select ${selectAttributes(scope)}><option value="">${e(placeholder)}</option>${groupsHtml}</select></label><span class="${e(prefix)}-legend">${legendHtml}</span></div>
    ${!selectedEntity ? `<div class="${e(prefix)}-results-empty">${e(emptyMessage)}</div>` : `<ol class="${e(prefix)}-tl">${items.map(renderItem).join('')}</ol>`}</section>`;
  }

  return Object.freeze({ render });
})();

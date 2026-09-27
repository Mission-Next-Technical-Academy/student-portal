/* Shared renderer for the Mission Next SOC investigation console. */
const SocConsoleCore = (() => {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
  }

  function renderShell(config = {}) {
    const shellClass = escapeHtml(config.shellClass || 'soc-console');
    const label = escapeHtml(config.ariaLabel || 'SOC investigation console');
    const eyebrow = escapeHtml(config.eyebrow || 'MISSION NEXT ENVIRONMENT');
    const title = escapeHtml(config.title || 'SOC INVESTIGATION');
    const context = config.contextHtml || '';
    const nav = config.navigationHtml || '';
    const workspaceClassName = escapeHtml(config.workspaceClassName || 'soc-console-workspace');
    const workspaceClass = escapeHtml(config.workspaceClass || '');
    const viewClassName = escapeHtml(config.viewClassName || 'soc-console-view');
    const guide = config.guideHtml || '';
    const view = config.viewHtml || '';
    const drawer = config.drawerHtml || '';

    return `<section class="${shellClass}" aria-label="${label}"><header><div><p>${eyebrow}</p><h2>${title}</h2></div>${context}</header>
      ${nav}
      <div class="${workspaceClassName}${workspaceClass ? ` ${workspaceClass}` : ''}">${guide}<div class="${viewClassName}">${view}</div>${drawer}</div></section>`;
  }

  function createStateAdapter({ containerKey = 'console', defaultsByScope = {}, normalizeState } = {}) {
    const normalizedStates = new WeakSet();

    function get(root, scope) {
      if (!root || typeof root !== 'object') throw new TypeError('A state root object is required.');
      if (!root[containerKey] || typeof root[containerKey] !== 'object') root[containerKey] = {};
      const container = root[containerKey];
      const saved = container[scope];
      if (saved && typeof saved === 'object' && normalizedStates.has(saved)) return saved;

      const defaults = defaultsByScope[scope] || {};
      const state = {
        ...JSON.parse(JSON.stringify(defaults)),
        ...(saved && typeof saved === 'object' ? saved : {}),
      };
      if (typeof normalizeState === 'function') normalizeState(state, scope);
      container[scope] = state;
      normalizedStates.add(state);
      return state;
    }

    return Object.freeze({ get });
  }

  return Object.freeze({ renderShell, createStateAdapter });
})();

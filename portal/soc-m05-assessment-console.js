/* Module 05 endpoint investigation console composition. */
const SocM05AssessmentConsole = (() => {
  'use strict';

  const escapeHtml = (value) => SocConsoleCore.escapeHtml
    ? SocConsoleCore.escapeHtml(value)
    : String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function render(assessment, fixture, selectedDeviceId, supportingHtml = '') {
    const scenario = fixture.scenario;
    const history = (assessment.actionHistory || []).slice(-20).reverse();
    const historyHtml = `<section class="m05-action-history" aria-label="Investigation action history"><h3>Investigation history</h3>${history.length
      ? `<ol>${history.map((item) => `<li data-m05-action="${escapeHtml(item.id)}"><time>${escapeHtml(item.timestamp)}</time> · ${escapeHtml(item.type)} · ${escapeHtml(JSON.stringify(item.details))}</li>`).join('')}</ol>`
      : '<p>No investigation actions recorded.</p>'}</section>`;
    const view = `<section data-m05-console-workspace="endpoint"><h3>Endpoint investigation</h3>${SocM05AssessmentDeviceUi.render(scenario, selectedDeviceId, assessment.evidencePackage, assessment.approvalRequests, assessment.edrHandoffs)}${historyHtml}${supportingHtml}</section>`;
    return SocConsoleCore.renderShell({
      shellClass: 'm05-shared-console',
      ariaLabel: 'Module 05 endpoint assessment console',
      eyebrow: 'MISSION NEXT ENVIRONMENT · PRACTICE IT',
      title: 'ENDPOINT INVESTIGATION',
      contextHtml: `<span data-m05-scenario="${escapeHtml(scenario.id)}">${escapeHtml(scenario.caseId)} · ${scenario.telemetry.length} assessment events</span>`,
      navigationHtml: '<nav class="m05-console-tabs" role="tablist" aria-label="Assessment workspaces"><button type="button" role="tab" aria-selected="true" class="is-active" data-m05-console-tab="endpoint">Endpoint investigation</button></nav>',
      workspaceClassName: 'm05-console-workspace',
      viewClassName: 'm05-console-view',
      viewHtml: view,
    });
  }

  return Object.freeze({ render });
})();

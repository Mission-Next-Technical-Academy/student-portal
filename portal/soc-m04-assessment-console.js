/* Module 04 assessment configuration for the shared SOC console shell. */
const SocM04AssessmentConsole = (() => {
  'use strict';

  const BASE_TABS = [
    ['alerts', 'Alerts', 'alerts'],
    ['search', 'Search', 'log-search'],
    ['timeline', 'Timeline', 'timeline'],
    ['entities', 'Entities', 'entities'],
    ['evidence', 'Evidence', 'evidence-pinning'],
    ['case', 'Case record', 'case-record'],
  ];
  const M04_TABS = [
    ['intelligence', 'Threat intelligence', 'threat-intel'],
    ['rules', 'Analytics rules', 'analytics-rules'],
    ['automation', 'Automation', 'intro-automation'],
  ];
  const defaults = { activeTab: 'alerts' };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function renderAlerts(assessment) {
    const rows = assessment.alerts || [];
    const selected = rows.find((item) => item.id === assessment.selectedAlertId) || null;
    const queue = SocAlertQueueUi.render({
      scope: 'm04-alert', rows, caption: 'Generated assessment alerts', prefix: 'm04', escapeHtml,
      selectedRow: (row) => row.id === selected?.id,
      rowAttributes: (_scope, row) => `data-m04-alert-select="${escapeHtml(row.id)}" aria-selected="${row.id === selected?.id}"`,
      columns: [
        { header: 'Alert', render: (row) => escapeHtml(row.title) },
        { header: 'Severity', render: (row) => escapeHtml(row.severity) },
        { header: 'Group', render: (row) => escapeHtml(row.group) },
        { header: 'Matches', render: (row) => escapeHtml(`${row.matchCount} / ${row.threshold}`) },
        { header: 'Status', render: (row) => escapeHtml(row.status) },
        { header: 'Created', render: (row) => escapeHtml(row.createdAt) },
      ],
    });
    if (!selected) return `${queue}<p data-m04-alert-empty>${rows.length ? 'Select an alert to review.' : 'No generated alerts.'}</p>`;
    const evidence = (selected.eventIds || []).map((id) => `<li>${escapeHtml(id)}</li>`).join('');
    return `${queue}<section data-m04-alert-detail><h4>${escapeHtml(selected.title)}</h4><dl><dt>Source rule</dt><dd>${escapeHtml(selected.sourceRule)}</dd><dt>Severity</dt><dd>${escapeHtml(selected.severity)}</dd><dt>Group</dt><dd>${escapeHtml(selected.groupingField)} = ${escapeHtml(selected.group)}</dd><dt>Execution</dt><dd>${escapeHtml(selected.executionId)}</dd><dt>Created</dt><dd>${escapeHtml(selected.createdAt)}</dd><dt>Status</dt><dd>${escapeHtml(selected.status)}</dd></dl><h5>Matched events</h5><ul>${evidence}</ul><pre>${escapeHtml(selected.sourceQuery)}</pre><form data-m04-alert-review-form data-alert-id="${escapeHtml(selected.id)}"><label>Review note <textarea name="note" maxlength="500">${escapeHtml(selected.reviewNote || '')}</textarea></label><button type="submit">Record review</button></form></section>`;
  }

  function renderAutomation(assessment) {
    const iocs = assessment.iocs || SocM04AssessmentData.scenario.iocs;
    const alerts = assessment.alerts || [];
    const results = (assessment.automationResults || []).slice().reverse().map((item) => `<li data-automation-result="${escapeHtml(item.executionId)}"><strong>${escapeHtml(item.type)}</strong> · ${escapeHtml(item.status)} · action ${escapeHtml(item.actionId)} · execution ${escapeHtml(item.executionId)} · target ${escapeHtml(item.targetId)} · evidence ${escapeHtml((item.matchedEventIds || []).join(', ') || 'none')}</li>`).join('');
    const ticketRows = (assessment.automationTickets || []).map((ticket) => `<li>${escapeHtml(ticket.id)} · ${escapeHtml(ticket.targetId)} · ${escapeHtml(ticket.status)} · action ${escapeHtml(ticket.actionId)} · execution ${escapeHtml(ticket.executionId)}</li>`).join('');
    const requests = (assessment.approvalRequests || []).slice().reverse().map((request) => `<li><strong>${escapeHtml(request.id)}</strong> · ${escapeHtml(request.actionType)} ${escapeHtml(request.targetId)} · alert ${escapeHtml(request.alertId)} · <b>${escapeHtml(request.status)}</b><ol>${request.audit.map((entry) => `<li>${escapeHtml(entry.status)} by ${escapeHtml(entry.actor)} at ${escapeHtml(entry.timestamp)}: ${escapeHtml(entry.reason)}</li>`).join('')}</ol></li>`).join('');
    const alertOptions = alerts.map((alert) => `<option value="${escapeHtml(alert.id)}" ${alert.id === assessment.selectedAlertId ? 'selected' : ''}>${escapeHtml(alert.title)} · ${escapeHtml(alert.id)}</option>`).join('');
    const reviewable = (assessment.approvalRequests || []).filter((request) => request.status === 'pending').map((request) => `<option value="${escapeHtml(request.id)}">${escapeHtml(request.actionType)} ${escapeHtml(request.targetId)} · ${escapeHtml(request.id)}</option>`).join('');
    return `<section data-m04-low-risk-automation><h4>Simulated low-risk actions</h4><label>Indicator<select name="iocId" data-m04-automation-ioc>${iocs.map((ioc) => `<option value="${escapeHtml(ioc.id)}">${escapeHtml(ioc.value)} · ${escapeHtml(ioc.id)}</option>`).join('')}</select></label><button type="button" data-m04-enrich>Enrich indicator</button><label>Alert<select name="alertId" data-m04-automation-alert>${alertOptions}</select></label><button type="button" data-m04-preserve>Preserve matching evidence</button><label>Ticket target<input name="ticketTarget" maxlength="40" value="${escapeHtml(assessment.nextTicketTarget || 'm04-review-1')}" data-m04-ticket-target></label><label>Ticket content<textarea name="ticketContent" maxlength="1000" data-m04-ticket-content></textarea></label><button type="button" data-m04-ticket>Save ticket</button><label>SOC recipient<input name="socRecipient" maxlength="80" value="soc-tier2" data-m04-soc-recipient></label><label>Notification content<textarea name="notificationContent" maxlength="1000" data-m04-notification-content></textarea></label><button type="button" data-m04-notify>Send simulated notification</button><p>Simulations only. No telemetry, account, or network state is changed. Repeating a notification records another simulated delivery.</p><section data-m04-approval-requests><h5>Disruptive action approval requests</h5><form data-m04-approval-request-form><label>Action<select name="type"><option value="account_disable">Disable account</option><option value="session_revoke">Revoke session</option><option value="network_block">Block network indicator</option></select></label><label>Target<input name="targetId" maxlength="100" required></label><label>Alert<select name="alertId" required>${alertOptions}</select></label><label>Requested by<input name="actor" maxlength="100" required></label><label>Reason<textarea name="reason" maxlength="500" required></textarea></label><button type="submit" ${alerts.length ? '' : 'disabled'}>Request approval</button></form><form data-m04-approval-review-form><label>Pending request<select name="requestId" required>${reviewable}</select></label><label>Reviewer<input name="actor" maxlength="100" required></label><label>Decision reason<textarea name="reason" maxlength="500" required></textarea></label><button type="button" data-m04-approval-decision="approved" ${reviewable ? '' : 'disabled'}>Approve request</button><button type="button" data-m04-approval-decision="rejected" ${reviewable ? '' : 'disabled'}>Reject request</button></form><p>Approval records a decision only. Module 04 never disables accounts, revokes sessions, or changes network state, including after approval.</p><ul>${requests || '<li>No approval requests.</li>'}</ul></section>${assessment.queryActionError ? `<p role="alert">${escapeHtml(assessment.queryActionError)}</p>` : ''}<ul data-m04-automation-tickets>${ticketRows || '<li>No simulated tickets.</li>'}</ul><ul data-m04-automation-results>${results || '<li>No simulated actions recorded.</li>'}</ul></section>`;
  }

  function configuration() {
    const descriptor = SocAssessmentEvolution.moduleFor('soc-04');
    const capabilities = SocAssessmentEvolution.capabilitiesThrough('soc-04');
    return Object.freeze({
      moduleKey: descriptor.moduleKey,
      scenarioId: SocM04AssessmentData.scenario.id,
      capabilities: Object.freeze(capabilities),
      tabs: Object.freeze([...BASE_TABS, ...M04_TABS]
        .filter((tab) => capabilities.includes(tab[2]))
        .map(([id, label, capability]) => Object.freeze({ id, label, capability }))),
    });
  }

  function render(assessment) {
    const config = configuration();
    const current = assessment.activeWorkspace || defaults.activeTab;
    const activeTab = config.tabs.some((tab) => tab.id === current) ? current : defaults.activeTab;
    const labels = Object.fromEntries(config.tabs.map((tab) => [tab.id, tab.label]));
    const nav = `<nav class="m04-console-tabs" role="tablist" aria-label="Assessment workspaces">${config.tabs.map((tab) => `<button type="button" role="tab" aria-selected="${activeTab === tab.id}" class="${activeTab === tab.id ? 'is-active' : ''}" data-m04-console-tab="${tab.id}">${tab.label}</button>`).join('')}</nav>`;
    const message = activeTab === 'alerts'
      ? `${SocM04AssessmentData.scenario.caseId} | ${SocM04AssessmentData.scenario.telemetry.length} assessment events`
      : `${labels[activeTab]} workspace | assessment fixture ${SocM04AssessmentData.scenario.id}`;
    return SocConsoleCore.renderShell({
      shellClass: 'm04-shared-console',
      ariaLabel: 'Module 04 detection assessment console',
      eyebrow: 'MISSION NEXT ENVIRONMENT · PRACTICE IT',
      title: 'DETECTION & INTELLIGENCE',
      contextHtml: `<span class="m04-console-context" data-feature-flags="${config.capabilities.join(' ')}">${message}</span>`,
      navigationHtml: nav,
      workspaceClassName: 'm04-console-workspace',
      viewClassName: 'm04-console-view',
      viewHtml: `<section role="tabpanel" data-m04-console-workspace="${activeTab}"><h3>${labels[activeTab]}</h3>${activeTab === 'intelligence' ? SocM04IntelligenceUi.render(assessment, SocM04AssessmentData) : activeTab === 'rules' ? SocM04RulesUi.render(assessment) : activeTab === 'alerts' ? renderAlerts(assessment) : activeTab === 'automation' ? renderAutomation(assessment) : `<p>${message}</p>`}</section>`,
    });
  }

  return Object.freeze({ configuration, render, renderAlerts, renderAutomation });
})();

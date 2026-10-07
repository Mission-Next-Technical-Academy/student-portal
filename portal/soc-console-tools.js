/* Cumulative SOC console tools (Modules 4–12).
 *
 * Every Assessment Lab from Module 4 on is the Module 3 console
 * (m03eMountConsole) plus the tool packs of each module up to its own. A pack
 * is registered once here and works against any module's case through a
 * context:
 *   ctx.scope        console scope (e.g. 'm05')
 *   ctx.assessment() the pack's saved state object for this module's case
 *   ctx.fixture      the pack's view of this module's case data
 *   ctx.save()       persist the module state
 *   ctx.rerender()   re-render the module's Assessment Lab panel
 *   ctx.console()    the mounted console's saved state (tab, query, pins…)
 * Later modules reuse earlier packs unchanged, so a fix to a pack reaches
 * every module that carries it.
 */
const SocConsoleTools = (() => {
  'use strict';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const PACKS = {};

  /* ---------------------------------------------------------------- M04 */

  // Adapt a later module's console dataset into the fixture shape the M04
  // engines expect: rules run over the same tables as Log Search, and
  // enrichment/preservation match the case's own records.
  function m04Fixture({ id, caseId, end, reports = [], iocs = [], data }) {
    const eventTables = Object.fromEntries(Object.entries(data.tables).filter(([name, rows]) => name !== 'UnifiedEvents' && rows.length && rows[0].TimeGenerated && rows[0].EventId));
    const telemetry = Object.values(data.records).map((row) => ({
      ...row, id: row.EventId, time: row.TimeGenerated, type: row.EventType, account: row.Account,
      sourceIp: row.SourceIp, result: row.Result, device: row.Host,
      destinationIp: row.DestinationIp, domain: row.Domain, url: row.Url, email: row.Email, fileHash: row.Sha256 || row.FileHash,
    }));
    const fields = [...new Set(Object.values(eventTables).flatMap((rows) => rows.flatMap((row) => Object.keys(row))))].filter((field) => !field.startsWith('__')).sort();
    return { schemaVersion: 1, scenario: { id, caseId, end, reports, iocs, telemetry }, consoleTables: eventTables, ruleFields: fields };
  }

  PACKS.m04 = {
    tabs: [['intelligence', 'Threat Intelligence'], ['rules', 'Analytics Rules'], ['automation', 'Automation']],
    views: (ctx) => ({
      intelligence: () => `<section class="m04-console-extra" data-m04-console-workspace="intelligence">${SocM04IntelligenceUi.render(ctx.assessment(), ctx.fixture)}${SocM04IntelligenceUi.renderVerdicts(ctx.assessment(), ctx.fixture, { guided: ctx.guided === true })}</section>`,
      rules: () => `<section class="m04-console-extra" data-m04-console-workspace="rules">${SocM04RulesUi.render(ctx.assessment(), { queryEditor: false, fields: ctx.fixture.ruleFields })}</section>`,
      automation: () => `<section class="m04-console-extra" data-m04-console-workspace="automation">${SocM04AssessmentConsole.renderAutomation(ctx.assessment())}</section>`,
    }),
    alerts: (ctx) => (ctx.assessment().alerts || []).map((alert) => ({
      id: alert.id, time: alert.createdAt, severity: alert.severity, title: alert.title, entities: [String(alert.group)],
      rule: `${alert.sourceRule}: ${alert.matchCount} matches for ${alert.groupingField} = ${alert.group} (threshold ${alert.threshold}) · execution ${alert.executionId} · ${alert.status}`,
      query: alert.sourceQuery,
    })),
    alertsNote: 'Alerts from your analytics rules appear here with the case alerts. Run a rule to add to the queue, then select an alert to review it.',
    alertDetailHtml: (ctx, row) => {
      const alert = (ctx.assessment().alerts || []).find((item) => item.id === row.id);
      if (!alert) return '';
      return `<h4>Matched events</h4><ul class="m04-alert-events">${(alert.eventIds || []).map((id) => `<li><button type="button" data-m03e-select="${esc(ctx.scope)}:record:${esc(id)}">${esc(id)}</button></li>`).join('')}</ul><form class="m04-alert-review" data-m04-alert-review-form data-alert-id="${esc(alert.id)}"><label>Review note<textarea name="note" rows="3" maxlength="500">${esc(alert.reviewNote || '')}</textarea></label><button type="submit">Record review</button></form>`;
    },
    resultsActionsHtml: (ctx) => {
      const assessment = ctx.assessment();
      if (!ctx.console().lastQuery) return '';
      return `<div class="m04-save-query"><label>Rule query name <input maxlength="100" data-m04-search-query-name value="${esc(assessment.queryName || '')}"></label><button type="button" data-m04-save-search-query><i class="ri-save-line" aria-hidden="true"></i> Save as rule query</button>${assessment.queryActionError ? `<p role="alert">${esc(assessment.queryActionError)}</p>` : ''}</div>`;
    },
    onSelect: (ctx, type, id) => { if (type === 'alert' && (ctx.assessment().alerts || []).some((alert) => alert.id === id)) SocM04RulesUi.selectAlert(ctx.assessment(), id); },
    wire(root, ctx) {
      root.addEventListener('input', (event) => {
        if (event.target.matches('#m04-query-editor, [data-m04-query-editor]')) {
          const assessment = ctx.assessment();
          if (assessment.queryText !== event.target.value) {
            assessment.queryText = event.target.value;
            assessment.lastQueryTest = null;
            assessment.queryResults = [];
            assessment.queryActionError = '';
          }
          ctx.save();
          return;
        }
        if (event.target.matches('#m04-query-name, [data-m04-query-name], [data-m04-search-query-name]')) {
          ctx.assessment().queryName = event.target.value;
          ctx.save();
          return;
        }
      });

      root.addEventListener('click', (event) => {
        if (event.target.closest('[data-m04-save-search-query]')) {
          // This action lives inside the console embedded in a collapsible lab.
          // Keep the click local so ancestor lab handlers cannot treat it as a
          // section toggle while we save and switch to Analytics Rules.
          event.preventDefault();
          event.stopPropagation();
          // Log Search is where the query is written; the rule engine re-tests the
          // exact text over its AuthLog table before the query can be saved.
          const assessment = ctx.assessment();
          const query = ctx.console().lastQuery;
          const timestamp = new Date().toISOString();
          try {
            const test = SocM04RulesUi.test(assessment, ctx.fixture, query, timestamp);
            if (!test.succeeded) throw new Error(`Analytics rules run over the AuthLog table: ${test.error}`);
            SocM04RulesUi.saveQuery(assessment, query, timestamp, assessment.queryName || 'Learner query');
            assessment.queryActionError = '';
            ctx.console().tab = 'rules';
          } catch (error) {
            assessment.queryActionError = error.message;
          }
          ctx.save();
          ctx.rerender();
          return;
        }
        const approvalDecision = event.target.closest('[data-m04-approval-decision]');
        if (approvalDecision) {
          const form = approvalDecision.closest('[data-m04-approval-review-form]');
          try {
            SocM04Automation.reviewApproval(ctx.assessment(), form.elements.requestId.value, approvalDecision.dataset.m04ApprovalDecision, form.elements.actor.value, form.elements.reason.value, new Date().toISOString());
            ctx.assessment().queryActionError = '';
            ctx.save();
          } catch (error) {
            ctx.assessment().queryActionError = error.message;
          }
          ctx.rerender();
          return;
        }
        const enrichIndicator = event.target.closest('[data-m04-enrich]');
        const preserveEvidence = event.target.closest('[data-m04-preserve]');
        const ticketAction = event.target.closest('[data-m04-ticket]');
        const notifyAction = event.target.closest('[data-m04-notify]');
        if (enrichIndicator || preserveEvidence || ticketAction || notifyAction) {
          const assessment = ctx.assessment();
          try {
            const workspace = root.querySelector('[data-m04-console-workspace="automation"]');
            if (enrichIndicator) {
              SocM04Automation.run(assessment, ctx.fixture, 'indicator_enrichment', workspace.querySelector('[data-m04-automation-ioc]').value, ctx.fixture.scenario.end);
            } else if (preserveEvidence) {
              SocM04Automation.run(assessment, ctx.fixture, 'evidence_preservation', workspace.querySelector('[data-m04-automation-alert]').value, ctx.fixture.scenario.end, { iocId: workspace.querySelector('[data-m04-automation-ioc]').value });
            } else if (ticketAction) {
              const content = workspace.querySelector('[data-m04-ticket-content]').value;
              assessment.nextTicketTarget = workspace.querySelector('[data-m04-ticket-target]').value;
              SocM04Automation.run(assessment, ctx.fixture, 'ticket', assessment.nextTicketTarget, new Date().toISOString(), { alertId: workspace.querySelector('[data-m04-automation-alert]').value, content });
            } else {
              SocM04Automation.run(assessment, ctx.fixture, 'notification', workspace.querySelector('[data-m04-soc-recipient]').value, new Date().toISOString(), { alertId: workspace.querySelector('[data-m04-automation-alert]').value, content: workspace.querySelector('[data-m04-notification-content]').value });
            }
            assessment.queryActionError = '';
          } catch (error) {
            assessment.queryActionError = error.message;
          }
          ctx.save();
          ctx.rerender();
          return;
        }
        const queryTest = event.target.closest('[data-m04-query-test]');
        const querySave = event.target.closest('[data-m04-query-save]');
        const convertQuery = event.target.closest('[data-m04-convert-query]');
        const ruleSave = event.target.closest('[data-m04-rule-save]');
        const safeguardsSave = event.target.closest('[data-m04-rule-safeguards-save]');
        const scheduleSave = event.target.closest('[data-m04-rule-schedule-save]');
        const runRuleNow = event.target.closest('[data-m04-rule-run-now], [data-m04-rule-run-scheduled]');
        if (queryTest || querySave || convertQuery || ruleSave || safeguardsSave || scheduleSave || runRuleNow) {
          const assessment = ctx.assessment();
          const timestamp = new Date().toISOString();
          assessment.queryActionError = '';
          try {
            if (queryTest || querySave) {
              const form = root.querySelector('[data-m04-query-form]');
              assessment.queryName = form.elements.name.value;
              const query = form.elements.query.value;
              if (queryTest) SocM04RulesUi.test(assessment, ctx.fixture, query, timestamp);
              else SocM04RulesUi.saveQuery(assessment, query, timestamp, form.elements.name.value);
            } else if (convertQuery) {
              SocM04RulesUi.convertToDraft(assessment, convertQuery.dataset.m04ConvertQuery, timestamp);
            } else if (ruleSave) {
              const form = root.querySelector('[data-m04-rule-form]');
              SocM04RulesUi.updateDraft(assessment, form.dataset.ruleId, Object.fromEntries(['name', 'description', 'severity', 'groupingField', 'threshold', 'windowMinutes'].map((key) => [key, form.elements[key].value])), timestamp);
            } else if (safeguardsSave) {
              const form = root.querySelector('[data-m04-rule-form]');
              SocM04RulesUi.updateSafeguards(assessment, form.dataset.ruleId, {
                exclusion: { enabled: form.elements.exclusionEnabled.checked, field: form.elements.exclusionField.value, operator: form.elements.exclusionOperator.value, value: form.elements.exclusionValue.value, reason: form.elements.exclusionReason.value },
                suppression: { enabled: form.elements.suppressionEnabled.checked, groupField: form.elements.suppressionGroupField.value, windowMinutes: form.elements.suppressionWindowMinutes.value },
              }, timestamp, ctx.fixture.ruleFields);
            } else {
              const form = root.querySelector('[data-m04-rule-form]');
              if (scheduleSave) {
                const localSchedule = form.elements.scheduledAt.value;
                SocM04RulesUi.configureSchedule(assessment, form.dataset.ruleId, {
                  enabled: form.elements.ruleEnabled.checked,
                  frequencyMinutes: form.elements.frequencyMinutes.value,
                  // The field shows and means UTC like the lab clock; parsing it as
                  // browser-local time shifted it by the viewer's offset.
                  scheduledAt: localSchedule ? new Date(`${localSchedule}Z`).toISOString() : '',
                }, timestamp, ctx.fixture.scenario.end || timestamp);
              } else {
                const mode = runRuleNow.matches('[data-m04-rule-run-scheduled]') ? 'scheduled' : 'manual';
                const execution = SocM04RulesUi.recordExecution(assessment, form.dataset.ruleId, timestamp, mode);
                SocM04RulesUi.completePendingExecution(assessment, execution.id, ctx.fixture);
                ctx.console().tab = 'alerts';
              }
            }
          } catch (error) {
            assessment.queryActionError = error.message;
            const form = root.querySelector('[data-m04-rule-form]');
            const errorNode = form?.querySelector('[data-m04-rule-error]');
            if (errorNode) errorNode.textContent = error.message;
            ctx.save();
            return;
          }
          ctx.save();
          ctx.rerender();
          return;
        }
        const verdictHint = event.target.closest('[data-m04-verdict-hint]');
        if (verdictHint && ctx.guided === true) {
          SocM04IntelligenceUi.revealHint(ctx.assessment(), ctx.fixture, verdictHint.dataset.m04VerdictHint);
          ctx.save();
          ctx.rerender();
          return;
        }
        const reportCreate = event.target.closest('[data-m04-report-create]');
        const iocCreate = event.target.closest('[data-m04-ioc-create]');
        const reportEdit = event.target.closest('[data-m04-report-edit]');
        const iocEdit = event.target.closest('[data-m04-ioc-edit]');
        const iocStatus = event.target.closest('[data-m04-ioc-status]');
        const cancelForm = event.target.closest('[data-m04-form-cancel]');
        if (reportCreate || iocCreate || reportEdit || iocEdit) {
          const kind = reportCreate || reportEdit ? 'report' : 'ioc';
          const form = root.querySelector(`[data-m04-${kind}-form]`);
          form.hidden = false;
          form.reset();
          const recordId = reportEdit?.dataset.m04ReportEdit || iocEdit?.dataset.m04IocEdit || '';
          const record = recordId && (kind === 'report' ? ctx.assessment().reports : ctx.assessment().iocs).find((item) => item.id === recordId);
          form.elements.id.value = record?.id || '';
          if (record) {
            if (kind === 'report') {
              form.elements.source.value = record.source;
              form.elements.kind.value = record.kind;
              form.elements.summary.value = record.summary;
            } else {
              ['type', 'value', 'confidence', 'firstSeen', 'lastSeen', 'campaign', 'status', 'sourceReportId', 'context'].forEach((key) => { form.elements[key].value = record[key] ?? ''; });
            }
          }
          form.querySelector('[data-m04-form-title]').textContent = `${record ? 'Edit' : 'New'} ${kind === 'ioc' ? 'IOC' : 'report'}`;
          form.querySelector('[data-m04-form-error]').textContent = '';
          form.elements[kind === 'report' ? 'source' : 'value'].focus();
          return;
        }
        if (cancelForm) {
          const form = cancelForm.closest('form');
          form.hidden = true;
          form.reset();
          return;
        }
        if (iocStatus) {
          try {
            SocM04IntelligenceUi.mutate(ctx.assessment(), ctx.fixture, 'ioc-status', { id: iocStatus.dataset.m04IocStatus, status: iocStatus.dataset.statusNext }, new Date().toISOString());
            ctx.save();
            ctx.rerender();
          } catch (error) {
            console.error('M04 IOC status update failed', error);
          }
          return;
        }
      });

      root.addEventListener('submit', (event) => {
        const approvalRequestForm = event.target.closest('[data-m04-approval-request-form]');
        if (approvalRequestForm) {
          event.preventDefault();
          try {
            SocM04Automation.requestApproval(ctx.assessment(), ctx.fixture, Object.fromEntries(new FormData(approvalRequestForm).entries()), new Date().toISOString());
            ctx.assessment().queryActionError = '';
            ctx.save();
          } catch (error) {
            ctx.assessment().queryActionError = error.message;
          }
          ctx.rerender();
          return;
        }
        const alertReviewForm = event.target.closest('[data-m04-alert-review-form]');
        if (alertReviewForm) {
          event.preventDefault();
          const timestamp = ctx.fixture.scenario.end;
          try {
            SocM04RulesUi.reviewAlert(ctx.assessment(), alertReviewForm.dataset.alertId, alertReviewForm.elements.note.value, timestamp);
            ctx.save();
            ctx.rerender();
          } catch (error) {
            ctx.assessment().queryActionError = error.message;
            ctx.rerender();
          }
          return;
        }
        const verdictForm = event.target.closest('[data-m04-verdict-form]');
        if (verdictForm) {
          event.preventDefault();
          try {
            SocM04IntelligenceUi.recordVerdict(ctx.assessment(), ctx.fixture, verdictForm.dataset.indicatorId, verdictForm.elements.decision.value, verdictForm.elements.rationale.value, new Date().toISOString());
            ctx.save();
            ctx.rerender();
          } catch (error) {
            verdictForm.querySelector('[data-m04-verdict-error]').textContent = error.message;
          }
          return;
        }
        const reportForm = event.target.closest('[data-m04-report-form]');
        const iocForm = event.target.closest('[data-m04-ioc-form]');
        if (reportForm || iocForm) {
          event.preventDefault();
          const form = event.target;
          const kind = reportForm ? 'report' : 'ioc';
          const input = Object.fromEntries(new FormData(form).entries());
          try {
            SocM04IntelligenceUi.mutate(ctx.assessment(), ctx.fixture, `${kind}-${input.id ? 'edit' : 'create'}`, input, new Date().toISOString());
            ctx.save();
            ctx.rerender();
          } catch (error) {
            form.querySelector('[data-m04-form-error]').textContent = error.message;
          }
          return;
        }
      });
    },
  };

  /* ---------------------------------------------------------------- M05 */

  // Adapt a later module's console dataset into the M05 endpoint fixture
  // shape: devices plus the case's device-linked records.
  function m05Fixture({ id, stateKey, devices = [], data, expectedTruth = null }) {
    const telemetry = Object.values(data.records).filter((row) => row.DeviceId).map((row) => ({
      id: row.EventId, time: row.TimeGenerated, eventType: row.EndpointEventType || row.EventType, deviceId: row.DeviceId,
      host: row.Host, user: row.Account, processId: row.ProcessId || null, parentProcessId: row.ParentProcessId || null,
      image: row.Image || null, commandLine: row.CommandLine || null, filePath: row.FilePath || null, sha256: row.Sha256 || null,
      registryPath: row.RegistryPath || null, action: row.Action || row.EventType, result: row.Result, source: row.EventSource,
      url: row.Url || null, signer: row.Signer, prevalence: row.Prevalence, reputation: row.Reputation,
    })).sort((a, b) => a.time.localeCompare(b.time));
    return { schemaVersion: 1, scenario: { id, stateKey, devices, telemetry, expectedTruth } };
  }

  const m05SelectedDevice = (ctx, state) => {
    const known = new Set(ctx.fixture.scenario.devices.map((device) => device.id));
    return (state.selectedDeviceIds || []).find((id) => known.has(id)) || '';
  };

  PACKS.m05 = {
    tabs: [['endpoint', 'Endpoint']],
    views: (ctx) => ({
      endpoint: () => {
        const state = ctx.load();
        const selected = m05SelectedDevice(ctx, state);
        const history = (state.actionHistory || []).slice(-20).reverse();
        const note = selected ? `<form class="m05-analysis-note" data-m05-analysis-note><label>Analyst note<textarea name="text" rows="3" maxlength="1000" required></textarea></label><p class="m03e-muted">Begin with “Correction:” to revise an earlier finding; your latest correction is what counts.</p><button type="submit">Record note</button></form>` : '';
        return `<section class="m04-console-extra m05-console-extra" data-m05-console-workspace="endpoint">${SocM05AssessmentDeviceUi.render(ctx.fixture.scenario, selected, state.evidencePackage, state.approvalRequests || [], state.edrHandoffs || [])}${note}<section class="m05-action-history" aria-label="Endpoint action history"><h4>Endpoint action history</h4>${history.length ? `<ol>${history.map((item) => `<li data-m05-action="${esc(item.id)}"><time>${esc(item.timestamp)}</time> · ${esc(item.type)}</li>`).join('')}</ol>` : '<p>No endpoint actions recorded.</p>'}</section></section>`;
      },
    }),
    alertDetailHtml: (ctx, row) => {
      const device = ctx.fixture.scenario.devices.find((item) => (row.entities || []).includes(item.hostname) || (row.entities || []).includes(item.id));
      return device ? `<button type="button" data-m05-open-device="${esc(device.id)}"><i class="ri-computer-line" aria-hidden="true"></i> Open ${esc(device.hostname)} in Endpoint</button>` : '';
    },
    wire(root, ctx) {
      root.addEventListener('submit', (event) => {
        const noteForm = event.target.closest('[data-m05-analysis-note]');
        if (noteForm) {
          event.preventDefault();
          const state = ctx.load();
          const deviceId = m05SelectedDevice(ctx, state);
          const text = String(new FormData(noteForm).get('text') || '').trim();
          if (!deviceId || !text) return;
          ctx.store(SocM05AssessmentActions.append(state, 'analysis_note', new Date().toISOString(), { text, relatedDeviceIds: [deviceId] }, ctx.fixture));
          ctx.rerender();
          return;
        }
        const handoffForm = event.target.closest('[data-m05-edr-handoff]');
        const handoffStatusForm = event.target.closest('[data-m05-handoff-status]');
        if (handoffForm || handoffStatusForm) {
          event.preventDefault();
          const fixture = ctx.fixture;
          const state = ctx.load();
          const deviceId = state.selectedDeviceIds.find((id) => fixture.scenario.devices.some((device) => device.id === id));
          const formData = new FormData(event.target);
          try {
            let next;
            if (handoffForm) {
              const eventIds = formData.getAll('eventIds').map(String);
              const hashes = formData.getAll('hashes').map(String);
              next = SocM05AssessmentActions.append(state, 'edr_handoff', new Date().toISOString(), {
                deviceIds: [deviceId], eventIds, hashes,
                summary: String(formData.get('summary') || '').trim(),
                owner: String(formData.get('owner') || '').trim(),
                recipient: String(formData.get('recipient') || '').trim(),
                recommendation: String(formData.get('recommendation') || '').trim(),
                status: 'submitted',
              }, fixture);
            } else {
              next = SocM05AssessmentActions.append(state, 'edr_handoff_status', new Date().toISOString(), {
                handoffId: String(formData.get('handoffId') || ''),
                status: String(formData.get('status') || ''),
                updatedBy: String(formData.get('updatedBy') || '').trim(),
              }, fixture);
            }
            ctx.store(next);
            ctx.rerender();
          } catch (error) {
            const status = event.target.querySelector('[data-m05-handoff-status-message]');
            if (status) status.textContent = error.message || 'Handoff could not be recorded. Check its summary and fixture evidence.';
          }
          return;
        }
        const form = event.target.closest('[data-m05-response-request]');
        if (!form) return;
        event.preventDefault();
        const fixture = ctx.fixture;
        const state = ctx.load();
        const deviceId = state.selectedDeviceIds.find((id) => fixture.scenario.devices.some((device) => device.id === id));
        const formData = new FormData(form);
        const type = String(formData.get('requestType') || '');
        const reason = String(formData.get('reason') || '').trim();
        const requestedBy = String(formData.get('requestedBy') || '').trim();
        const filePath = String(formData.get('filePath') || '');
        const selectedFile = form.querySelector('[name="filePath"] option:checked');
        const status = form.querySelector('[data-m05-request-status]');
        if (!deviceId || !reason || !requestedBy) {
          if (status) status.textContent = 'A known device, reason, and requester are required.';
          return;
        }
        const details = type === 'endpoint_isolation_request'
          ? { deviceId, reason, requestedBy, status: 'pending_approval' }
          : { deviceId, filePath, sha256: selectedFile?.dataset.sha256 || '', reason, requestedBy, status: 'pending_approval' };
        try {
          const next = SocM05AssessmentActions.append(state, type, new Date().toISOString(), details, fixture);
          ctx.store(next);
          ctx.rerender();
        } catch (error) {
          if (status) status.textContent = 'Request could not be recorded. Check the selected device and file evidence.';
        }
      });

      root.addEventListener('click', (event) => {
        const openDevice = event.target.closest('[data-m05-open-device]');
        if (openDevice) {
          const deviceId = openDevice.dataset.m05OpenDevice;
          const state = ctx.load();
          state.selectedDeviceIds = [deviceId];
          ctx.store(SocM05AssessmentActions.append(state, 'device_review', new Date().toISOString(), { deviceId, status: 'selected_for_review', note: 'Pivoted from alert to device.' }, ctx.fixture));
          ctx.console().tab = 'endpoint';
          ctx.save();
          ctx.rerender();
          return;
        }
        const preserveButton = event.target.closest('[data-m05-preserve-evidence]');
        if (preserveButton) {
          const fixture = ctx.fixture;
          const state = ctx.load();
          const deviceId = state.selectedDeviceIds.find((id) => fixture.scenario.devices.some((device) => device.id === id));
          if (!deviceId) { const status = root.querySelector('[data-m05-preserve-status]'); if (status) status.textContent = 'Select a device before preserving evidence.'; return; }
          const selectedEvents = Array.from(root.querySelectorAll('[data-m05-evidence-event]:checked')).map((input) => input.value);
          const selectedHashes = Array.from(root.querySelectorAll('[data-m05-evidence-hash]:checked')).map((input) => input.value);
          const knownEvents = new Map(fixture.scenario.telemetry.filter((item) => item.deviceId === deviceId).map((item) => [item.id, item]));
          const validHash = (hash) => /^[a-f0-9]{64}$/.test(hash);
          const submittedEvents = selectedEvents;
          const submittedHashes = selectedHashes;
          if (!submittedEvents.length || !submittedHashes.length
            || !submittedEvents.every((id) => knownEvents.has(id)) || !submittedHashes.every(validHash)) { const status = root.querySelector('[data-m05-preserve-status]'); if (status) status.textContent = 'Select at least one valid event and one valid file hash.'; return; }
          const referencedHashes = new Set(submittedEvents.map((id) => knownEvents.get(id)?.sha256).filter(Boolean));
          if (!submittedHashes.every((hash) => referencedHashes.has(hash))) { const status = root.querySelector('[data-m05-preserve-status]'); if (status) status.textContent = 'Each selected hash must belong to one of the selected events.'; return; }
          const evidencePackage = { deviceId, eventIds: [...new Set(submittedEvents)], hashes: [...new Set(submittedHashes)] };
          state.evidencePackage = evidencePackage;
          state.selectedEventIds = evidencePackage.eventIds.slice();
          try {
            const next = SocM05AssessmentActions.append(state, 'evidence_package_preserved', new Date().toISOString(), evidencePackage, fixture);
            ctx.store(next);
            ctx.rerender();
          } catch (error) {
            const status = root.querySelector('[data-m05-preserve-status]');
            if (status) status.textContent = error.message || 'Evidence could not be preserved. Review the selected events and hashes.';
          }
          return;
        }
        const deviceButton = event.target.closest('[data-m05-device-select]');
        if (deviceButton) {
          const fixture = ctx.fixture;
          const deviceId = deviceButton.dataset.m05DeviceSelect;
          if (fixture.scenario.devices.some((device) => device.id === deviceId)) {
            const state = ctx.load();
            state.selectedDeviceIds = [deviceId];
            const actionState = SocM05AssessmentActions.append(state, 'device_review', new Date().toISOString(), {
              deviceId, status: 'selected_for_review', note: 'Learner opened device profile and telemetry.'
            }, fixture);
            ctx.store(actionState);
            ctx.rerender();
          }
          return;
        }
      });
    },
  };

  /* ---------------------------------------------------------------- M06 */

  // Keep an earlier pack's state inside a later module's own saved state.
  function embedded(stateRoot, key, normalize, fixture, save) {
    return {
      load: () => normalize(JSON.parse(JSON.stringify(stateRoot().tools?.[key] || {})), fixture),
      store: (next) => { const root = stateRoot(); root.tools ||= {}; root.tools[key] = normalize(next, fixture); save(); },
    };
  }

  // Adapt a later module's console dataset into the M06 hunt fixture shape.
  // Related events default to the neighbouring events on the same device.
  function m06Fixture({ id, lead, devices, data, timeStart, timeEnd }) {
    const rows = Object.values(data.records).filter((row) => row.EventId).sort((a, b) => a.TimeGenerated.localeCompare(b.TimeGenerated));
    const telemetry = rows.map((row) => ({
      ...Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('__'))),
      id: row.EventId, time: row.TimeGenerated, eventType: row.EventType, device: row.DeviceId || row.Host, account: row.Account,
      action: row.Action || row.EventType, result: row.Result, relatedEventIds: row.RelatedEventIds || [],
    }));
    telemetry.forEach((event, index) => {
      if (event.relatedEventIds.length) return;
      const same = telemetry.filter((other) => other.device && other.device === event.device);
      const at = same.indexOf(event);
      event.relatedEventIds = [same[at - 1], same[at + 1]].filter(Boolean).map((other) => other.id);
    });
    const catalog = Object.entries(SocM06AssessmentRelatedSearch.TECHNIQUES).map(([id, technique]) => ({ id, name: technique.name, evidenceEventIds: [] }));
    return { schemaVersion: 1, scenario: { id, seedLead: lead, scope: { devices, accounts: [...new Set(telemetry.map((event) => event.account).filter(Boolean))], timeStart, timeEnd },
      telemetry, expectedTruth: { supportedTechniques: catalog, unsupportedTechniques: [] } } };
  }

  // The ATT&CK matrix fills the mapping form's hidden tactic/technique
  // fields; the column a cell sits in fixes the tactic.
  function m06SelectAttackCell(root, tacticId, techniqueId) {
    const form = root.querySelector('[data-m06-mapping-form]');
    if (!form) return;
    form.elements.tacticId.value = tacticId;
    form.elements.techniqueId.value = techniqueId;
    const key = tacticId && techniqueId ? `${tacticId}:${techniqueId}` : '';
    root.querySelectorAll('[data-attack-pick]').forEach((cell) => {
      const on = cell.dataset.attackPick === key;
      cell.classList.toggle('is-selected', on);
      cell.setAttribute('aria-pressed', String(on));
      if (on) {
        const subs = cell.closest('details.attack-subs');
        if (subs) subs.open = true;
        cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
    const banner = form.querySelector('[data-attack-selected]');
    const technique = key && MnAttackCatalog.technique(techniqueId);
    if (banner) {
      banner.classList.toggle('has-selection', !!technique);
      banner.innerHTML = technique
        ? `<span>${esc(MnAttackCatalog.tactic(tacticId)?.name || tacticId)}</span> <i class="ri-arrow-right-s-line" aria-hidden="true"></i> <strong>${esc(techniqueId)}</strong> ${esc(technique.fullName)} <a href="${esc(MnAttackCatalog.url(techniqueId))}" target="_blank" rel="noopener">View on attack.mitre.org</a>`
        : 'No technique selected. Choose a cell in the matrix above.';
    }
  }

  function m06FilterAttackMatrix(root, value) {
    const terms = String(value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matrix = root.querySelector('.attack-matrix');
    if (!matrix) return;
    matrix.classList.toggle('is-filtering', terms.length > 0);
    matrix.querySelectorAll('.attack-tech').forEach((item) => {
      const hit = terms.length > 0 && terms.every((term) => item.dataset.attackSearch.includes(term));
      item.classList.toggle('is-match', hit);
      const subs = item.querySelector('details.attack-subs');
      if (subs && terms.length) subs.open = hit && [...subs.querySelectorAll('[data-attack-pick]')].some((cell) => terms.every((term) => cell.textContent.toLowerCase().includes(term)));
    });
    // Bring the first match into the matrix viewport without moving the page.
    const first = matrix.querySelector('.attack-tech.is-match');
    if (first) {
      const box = matrix.getBoundingClientRect(), at = first.getBoundingClientRect();
      const head = first.closest('.attack-col')?.querySelector('.attack-col-head')?.offsetHeight || 0;
      matrix.scrollTo({ left: matrix.scrollLeft + at.left - box.left - 6, top: matrix.scrollTop + at.top - box.top - head - 6 });
    }
  }

  // One readable line per telemetry row for the hypothesis event picker:
  // time · type · action · the field an analyst would recognise it by.
  function m06EventSummary(event) {
    const base = (value) => String(value || '').split(/[\\/]/).pop();
    const detail = event.taskName || base(event.image) || base(event.path)
      || (event.destination ? `${event.destination}${event.destinationPort ? `:${event.destinationPort}` : ''}` : '');
    return [String(event.time || '').slice(11, 19), event.eventType, String(event.action || '').replace(/_/g, ' '), detail]
      .filter(Boolean).join(' · ');
  }

  function m06Error(root, selector, error) {
    const feedback = root.querySelector(selector);
    if (feedback) feedback.textContent = error.message;
  }

  PACKS.m06 = {
    tabs: [['hunting', 'Hunting'], ['attack', 'ATT&CK']],
    views: (ctx) => ({
      hunting: () => {
        const fixture = ctx.fixture;
        const state = ctx.load();
        const lead = fixture.scenario.seedLead;
        const hypothesis = (state.hypotheses || []).find((item) => item.seedLeadId === lead?.id) || {};
        const leadEvents = fixture.scenario.telemetry.filter((event) => event.device === lead?.device);
        const linkEvents = `<fieldset class="m06-choice-set"><legend>Events that would test it</legend><div class="m06-choice-grid">${leadEvents.map((event) => `<label><input type="checkbox" name="relatedEventIds" value="${esc(event.id)}"${(hypothesis.relatedEventIds || []).includes(event.id) ? ' checked' : ''}><span><strong>${esc(event.id)}</strong><small>${esc(m06EventSummary(event))}</small></span></label>`).join('')}</div></fieldset><div class="m06-form-actions"><button type="submit">${hypothesis.text ? 'Update hypothesis' : 'Save hypothesis'}</button><p data-m06-hypothesis-feedback role="status">${hypothesis.text ? 'Hypothesis saved. Test it next in 02 · Search.' : ''}</p></div>`;
        const bookmarked = state.bookmarks || [];
        const latest = (state.conclusions || []).at(-1);
        const conclusion = `<section data-m06-conclusion-panel aria-label="Hunt conclusion"><header class="m06-panel-header"><div><span class="m06-step">06 · Close the hunt</span><h3>Hunt conclusion</h3></div></header>${latest ? `<p class="m06-latest-record"><strong>${esc(latest.disposition)}</strong><span>${esc(latest.text)}</span><small>${esc(latest.eventIds.join(', '))}</small></p>` : ''}<form data-m06-conclusion-form><label>Hypothesis outcome <select name="disposition"><option value="supported">Supported</option><option value="rejected">Rejected</option><option value="unresolved">Unresolved</option></select></label><label class="m06-field-wide">Conclusion, limitations and next steps<textarea name="text" rows="4" maxlength="2000" required placeholder="Summarize what the evidence supports, what remains unknown, and the next action…"></textarea></label><fieldset class="m06-choice-set m06-field-wide"><legend>Bookmarked evidence it rests on</legend><div class="m06-choice-grid">${bookmarked.map((eventId) => `<label><input type="checkbox" name="eventIds" value="${esc(eventId)}"><span><strong>${esc(eventId)}</strong></span></label>`).join('') || '<p class="m06-empty-state">Bookmark evidence first.</p>'}</div></fieldset><div class="m06-form-actions m06-field-wide"><button type="submit">Record conclusion</button><p data-m06-conclusion-feedback role="status"></p></div></form></section>`;
        const steps = [
          ['01', 'Frame the lead', SocM06AssessmentSeedUi.render(fixture, state, { formExtraHtml: linkEvents })],
          ['02', 'Search', SocM06AssessmentRelatedSearch.renderSearch(fixture, state)],
          ['03', 'Make repeatable', SocM06AssessmentRelatedSearch.renderSavedQueryPanel(fixture, state)],
          ['04', 'Curate', SocM06AssessmentRelatedSearch.renderEvidencePanel(fixture, state)],
          ['05', 'Escalate', SocM06AssessmentRelatedSearch.renderHandoffPanel(fixture, state)],
          ['06', 'Close the hunt', conclusion],
        ];
        const activeStep = state.huntWorkflowStep || '01';
        return `<section class="m04-console-extra m06-console-extra" data-m06-console-workspace="hunting"><div class="m06-workspace-intro"><div><span>INVESTIGATION WORKFLOW</span><h3>Validate the lead, preserve the evidence, and document the decision.</h3></div><p>Open a step below and work through the investigation in order. Expand another step when you are ready to continue.</p></div><nav class="m06-step-nav" aria-label="Investigation workflow steps">${steps.map(([number, title]) => `<a href="#m06-hunt-step-${number}"${activeStep === number ? ' aria-current="step"' : ''}><span>${number}</span>${esc(title)}</a>`).join('')}</nav>${steps.map(([number, title, content]) => `<details class="m06-step-item" id="m06-hunt-step-${number}" name="m06-hunt-workflow"${activeStep === number ? ' open' : ''}><summary><span class="m06-step-item-number">${number}</span><span>${esc(title)}</span><i class="ri-arrow-down-s-line" aria-hidden="true"></i></summary><div class="m06-step-content">${content}</div></details>`).join('')}</section>`;
      },
      attack: () => `<section class="m04-console-extra m06-console-extra" data-m06-console-workspace="attack">${SocM06AssessmentRelatedSearch.renderMappingPanel(ctx.fixture, ctx.load())}</section>`,
    }),
    wire(root, ctx) {
      const now = () => new Date().toISOString();
      const run = (selector, work) => {
        try { ctx.store(work(ctx.load(), ctx.fixture)); ctx.rerender(); } catch (error) { m06Error(root, selector, error); }
      };
      root.addEventListener('click', (event) => {
        const link = event.target.closest('.m06-step-nav a');
        if (link) {
          event.preventDefault();
          const step = root.querySelector(link.getAttribute('href'));
          if (step) { step.open = true; step.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        }
      });
      root.addEventListener('toggle', (event) => {
        const step = event.target;
        if (!step.matches?.('.m06-step-item') || !step.open) return;
        const number = step.id.replace(/^.*m06-hunt-step-/, '');
        const state = ctx.load();
        state.huntWorkflowStep = number;
        ctx.store(state);
        root.querySelectorAll('.m06-step-nav a').forEach((link) => {
          if (link.hash === `#${step.id}`) link.setAttribute('aria-current', 'step');
          else link.removeAttribute('aria-current');
        });
      }, true);
      root.addEventListener('submit', (event) => {
        const form = event.target;
        const data = () => new FormData(form);
        if (form.matches('[data-m06-hypothesis-form]')) {
          event.preventDefault();
          run('[data-m06-hypothesis-feedback]', (state, fixture) => {
            const values = data();
            const lead = fixture.scenario.seedLead;
            const text = String(values.get('text') || '').trim();
            const relatedEventIds = values.getAll('relatedEventIds').map(String);
            if (text.length < 20) throw new Error('Write a specific, testable hypothesis (at least 20 characters).');
            if (!relatedEventIds.length) throw new Error('Link at least one event that would test the hypothesis.');
            const hypothesisId = `${fixture.scenario.id}:HYPOTHESIS-001`;
            const record = { id: hypothesisId, seedLeadId: lead.id, text, rationale: String(values.get('rationale') || '').trim(), confidence: String(values.get('confidence') || 'medium'), status: 'testing', relatedEventIds };
            state.hypotheses = [...(state.hypotheses || []).filter((item) => item.seedLeadId !== lead.id), record];
            return SocM06AssessmentActions.append(state, 'hypothesis_edit', now(), { hypothesisId, text, status: 'testing', relatedEventIds, deviceIds: [lead.device] }, fixture);
          });
          return;
        }
        if (form.matches('[data-m06-search-form]')) {
          event.preventDefault();
          run('[data-m06-related-search] [role=status]', (state, fixture) => {
            const values = data();
            return SocM06AssessmentRelatedSearch.search(state, fixture, { startTime: values.get('startTime'), endTime: values.get('endTime'), entityType: values.get('entityType'), entityValue: values.get('entityType') === 'all' ? 'all' : values.get('entityValue') }, String(values.get('query') || ''), now()).state;
          });
          return;
        }
        if (form.matches('[data-m06-conclusion-form]')) {
          event.preventDefault();
          run('[data-m06-conclusion-feedback]', (state, fixture) => {
            const values = data();
            const text = String(values.get('text') || '').trim();
            const eventIds = values.getAll('eventIds').map(String);
            const disposition = String(values.get('disposition') || '');
            if (text.length < 30) throw new Error('State the conclusion, its limits and next steps (at least 30 characters).');
            if (!eventIds.length) throw new Error('Select the bookmarked evidence the conclusion rests on.');
            state.conclusions = [...(state.conclusions || []), { id: `${fixture.scenario.id}:CONCLUSION-${String((state.conclusions || []).length + 1).padStart(3, '0')}`, text, eventIds, disposition, timestamp: now() }].slice(-50);
            return SocM06AssessmentActions.append(state, 'conclusion', now(), { text, eventIds, disposition }, fixture);
          });
          return;
        }
        if (form.matches('[data-m06-mapping-remove-form]')) {
          event.preventDefault();
          const [tacticId, techniqueId] = form.dataset.m06MappingRemoveForm.split(':');
          run('[data-m06-mapping-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.removeMapping(state, fixture, tacticId, techniqueId, data().get('reason'), now()));
          return;
        }
        if (form.matches('[data-m06-mapping-form]')) {
          event.preventDefault();
          run('[data-m06-mapping-feedback]', (state, fixture) => {
            const values = data();
            if (!values.get('techniqueId')) throw new Error('Select a technique cell in the ATT&CK matrix first.');
            const replaces = form.dataset.replaces ? (() => { const [tacticId, techniqueId] = form.dataset.replaces.split(':'); return { tacticId, techniqueId }; })() : null;
            return SocM06AssessmentRelatedSearch.saveMapping(state, fixture, {
              tacticId: values.get('tacticId'), techniqueId: values.get('techniqueId'), confidence: Number(values.get('confidence')),
              status: values.get('status'), rationale: values.get('rationale'), eventIds: values.getAll('eventIds'),
            }, now(), replaces);
          });
          return;
        }
        if (form.matches('[data-m06-collection-form]')) {
          event.preventDefault();
          run('[data-m06-evidence-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.saveCollection(state, fixture, data().get('name'), data().getAll('eventIds'), now()));
          return;
        }
        if (form.matches('[data-m06-handoff-form]')) {
          event.preventDefault();
          run('[data-m06-handoff-feedback]', (state, fixture) => {
            const values = data();
            return SocM06AssessmentRelatedSearch.proposeHandoff(state, fixture, { eventIds: values.getAll('eventIds'), destination: values.get('destination'), rationale: values.get('rationale'), recommendation: values.get('recommendation') }, now());
          });
          return;
        }
        if (form.matches('[data-m06-handoff-status-form]')) {
          event.preventDefault();
          run('[data-m06-handoff-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.updateHandoffStatus(state, fixture, form.dataset.m06HandoffStatusForm, data().get('status'), data().get('note'), now()));
          return;
        }
        if (form.matches('[data-m06-save-query-form]')) {
          event.preventDefault();
          run('[data-m06-query-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.saveQuery(state, fixture, data().get('name'), data().get('query'), now()).state);
        }
      });

      root.addEventListener('input', (event) => {
        if (event.target.matches('[data-attack-filter]')) m06FilterAttackMatrix(root, event.target.value);
      });

      root.addEventListener('change', (event) => {
        if (!event.target.matches('[data-m06-collection-select]')) return;
        run('[data-m06-evidence-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.selectCollection(state, fixture, event.target.value, now()));
      });

      root.addEventListener('click', (event) => {
        const pivot = event.target.closest('[data-m06-pivot-from]');
        if (pivot) {
          run('[data-m06-related-search] [role=status]', (state, fixture) => SocM06AssessmentRelatedSearch.pivot(state, fixture, pivot.dataset.m06PivotFrom, pivot.dataset.m06PivotTo, now()).state);
          return;
        }
        const bookmark = event.target.closest('[data-m06-bookmark]');
        if (bookmark) {
          run('[data-m06-evidence-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.toggleBookmark(state, fixture, bookmark.dataset.m06Bookmark, now()));
          return;
        }
        const runSaved = event.target.closest('[data-m06-run-saved-query]');
        if (runSaved) {
          const values = new FormData(root.querySelector('[data-m06-save-query-form]'));
          const scope = { startTime: values.get('startTime'), endTime: values.get('endTime'), entityType: values.get('entityType'), entityValue: values.get('entityValue') };
          run('[data-m06-query-feedback]', (state, fixture) => SocM06AssessmentRelatedSearch.runSavedQuery(state, fixture, scope, runSaved.dataset.m06RunSavedQuery, now()).state);
          return;
        }
        const pick = event.target.closest('[data-attack-pick]');
        if (pick) {
          const [tacticId, techniqueId] = pick.dataset.attackPick.split(':');
          m06SelectAttackCell(root, tacticId, techniqueId);
          return;
        }
        const edit = event.target.closest('[data-m06-mapping-edit], [data-m06-mapping-cancel]');
        if (!edit) return;
        const form = root.querySelector('[data-m06-mapping-form]');
        if (!form) return;
        if (edit.matches('[data-m06-mapping-cancel]')) {
          form.reset();
          delete form.dataset.replaces;
          edit.hidden = true;
          form.querySelector('[type="submit"]').textContent = 'Save mapping';
          form.querySelectorAll('[name="eventIds"]').forEach((input) => { input.checked = false; });
          m06SelectAttackCell(root, '', '');
          return;
        }
        const [tacticId, techniqueId] = edit.dataset.m06MappingEdit.split(':');
        const item = (ctx.load().mappings || []).find((mapping) => mapping.tacticId === tacticId && mapping.techniqueId === techniqueId);
        if (!item) return;
        m06SelectAttackCell(root, item.tacticId, item.techniqueId);
        form.elements.confidence.value = item.confidence;
        form.elements.status.value = item.status;
        form.elements.rationale.value = item.rationale;
        form.querySelectorAll('[name="eventIds"]').forEach((input) => { input.checked = item.eventIds.includes(input.value); });
        form.dataset.replaces = `${item.tacticId}:${item.techniqueId}`;
        form.querySelector('[type="submit"]').textContent = 'Save correction';
        form.querySelector('[data-m06-mapping-cancel]').hidden = false;
      });
    },
  };

  /* ---------------------------------------------------------------- M07 */

  // ctx.box.state is the module's current M07 state (M07 actions replace it
  // immutably); ctx.store persists it; ctx.ui holds view-only filters.
  PACKS.m07 = {
    tabs: [['email', 'Email'], ['network', 'Network']],
    views: (ctx) => ({
      email: () => `<section class="m04-console-extra m07-console-extra" data-m07-console-workspace="email">${SocM07AssessmentEmailUi.render(ctx.fixture, ctx.box.state)}</section>`,
      network: () => `<section class="m04-console-extra m07-console-extra" data-m07-console-workspace="network">${SocM07AssessmentNetworkUi.render(ctx.fixture, ctx.box.state, ctx.ui.networkFilters || {})}</section>`,
    }),
    wire(root, ctx) {
      root.addEventListener('submit', (event) => {
        const incidentForm = event.target.closest('[data-m07-incident-form]');
        if (incidentForm && ctx.box.state) {
          event.preventDefault();
          const operation = String(incidentForm.elements.operation?.value || 'create');
          const incidents = ctx.box.state.incidentLinks || [];
          const nextNumber = incidents.reduce((max, item) => Math.max(max,
            Number.parseInt(String(item.incidentId).match(/(\d{4})$/)?.[1] || '0', 10)), 0) + 1;
          const incidentId = operation === 'update' ? String(incidentForm.elements.incidentId?.value || '')
            : `M07-INCIDENT-${String(nextNumber).padStart(4, '0')}`;
          const checkedValues = (name) => [...incidentForm.querySelectorAll(`input[name="${name}"]:checked`)]
            .map((input) => String(input.value));
          const details = { operation, incidentId,
            title: String(incidentForm.elements.title?.value || '').trim(),
            assessment: String(incidentForm.elements.assessment?.value || 'unknown'),
            summary: String(incidentForm.elements.summary?.value || '').trim(),
            recipientIds: checkedValues('recipientIds'),
            deviceIds: checkedValues('deviceIds'),
            eventIds: checkedValues('eventIds') };
          try {
            ctx.box.state = SocM07AssessmentActions.append(ctx.box.state,
              'incident_link', new Date(ctx.fixture.scenario.fixedAt).toISOString(), details,
              ctx.fixture);
            ctx.store(ctx.box.state);
            ctx.rerender();
          } catch (error) {
            const status = incidentForm.querySelector('[data-m07-incident-status]');
            if (status) status.textContent = error.message;
          }
          return;
        }
        const packetForm = event.target.closest('[data-m07-packet-select]');
        if (packetForm && ctx.box.state) {
          event.preventDefault();
          const eventId = String(packetForm.elements.eventId?.value || '').slice(0, 40);
          ctx.ui.networkFilters = { ...(ctx.ui.networkFilters || {}), pcapEventId: eventId };
          ctx.rerender();
          return;
        }
        const networkForm = event.target.closest('[data-m07-network-search]');
        if (networkForm && ctx.box.state) {
          event.preventDefault();
          ctx.ui.networkFilters = {
            query: String(networkForm.elements.query?.value || '').slice(0, 100),
            type: networkForm.elements.type?.value || 'all',
            device: String(networkForm.elements.device?.value || '').slice(0, 40),
          };
          ctx.rerender();
          return;
        }
        const form = event.target.closest('[data-m07-recipient-search]');
        if (!form || !ctx.box.state) return;
        event.preventDefault();
        const query = String(form.elements.query?.value || '').slice(0, 100);
        const delivery = form.elements.delivery?.value || 'all';
        const interaction = form.elements.interaction?.value || 'all';
        const parsedLimit = Number.parseInt(form.elements.limit?.value, 10);
        const limit = Number.isInteger(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 100;
        const filters = { query, delivery, interaction, limit };
        const rows = SocM07AssessmentActions.searchRecipients(ctx.fixture, filters);
        const details = { ...filters, recipientIds: rows.map((row) => row.recipientId),
          deviceIds: rows.flatMap((row) => row.deviceId ? [row.deviceId] : []) };
        ctx.box.state = SocM07AssessmentActions.append(ctx.box.state,
          'recipient_search', new Date(ctx.fixture.scenario.fixedAt).toISOString(), details,
          ctx.fixture);
        ctx.store(ctx.box.state);
        ctx.rerender();
      });
      root.addEventListener('click', (event) => {
        const evidenceButton = event.target.closest('[data-m07-evidence-toggle]');
        if (evidenceButton && ctx.box.state) {
          const eventId = evidenceButton.getAttribute('data-m07-evidence-toggle');
          const selected = (ctx.box.state.evidenceChanges || []).some((item) => item.eventId === eventId);
          ctx.box.state = SocM07AssessmentActions.append(ctx.box.state,
            'evidence_change', new Date(ctx.fixture.scenario.fixedAt).toISOString(), {
              operation: selected ? 'remove' : 'add', eventId, reason: selected ? 'Removed from learner evidence tray' : 'Selected from assessment evidence view',
            }, ctx.fixture);
          ctx.store(ctx.box.state);
          ctx.rerender();
          return;
        }
        const networkReview = event.target.closest('[data-m07-review-network]');
        if (networkReview && ctx.box.state) {
          const eventId = networkReview.getAttribute('data-m07-review-network');
          const reviewed = networkReview.getAttribute('aria-pressed') !== 'true';
          ctx.box.state = SocM07AssessmentActions.append(ctx.box.state,
            'network_review', new Date(ctx.fixture.scenario.fixedAt).toISOString(), { eventId, reviewed }, ctx.fixture);
          ctx.store(ctx.box.state);
          ctx.rerender();
          return;
        }
        const networkPivot = event.target.closest('[data-m07-network-pivot-from]');
        if (networkPivot && ctx.box.state) {
          const details = SocM07AssessmentNetworkUi.pivotDetails(ctx.fixture,
            networkPivot.getAttribute('data-m07-network-pivot-from'), networkPivot.getAttribute('data-m07-network-pivot-to'));
          if (details) {
            ctx.box.state = SocM07AssessmentActions.append(ctx.box.state,
              'pivot', new Date(ctx.fixture.scenario.fixedAt).toISOString(), details, ctx.fixture);
            ctx.store(ctx.box.state);
            ctx.rerender();
          }
          return;
        }
        const artifactButton = event.target.closest('[data-m07-review-artifact]');
        if (artifactButton && ctx.box.state) {
          const artifactId = artifactButton.getAttribute('data-m07-review-artifact');
          const reviewed = artifactButton.getAttribute('aria-pressed') !== 'true';
          ctx.box.state = SocM07AssessmentActions.append(
            ctx.box.state,
            'artifact_review',
            new Date(ctx.fixture.scenario.fixedAt).toISOString(),
            { artifactId, reviewed },
            ctx.fixture,
          );
          ctx.store(ctx.box.state);
          ctx.rerender();
          return;
        }
        const reviewButton = event.target.closest('[data-m07-review-message]');
        if (reviewButton && ctx.box.state) {
          const messageId = reviewButton.getAttribute('data-m07-review-message');
          const reviewed = reviewButton.getAttribute('aria-pressed') !== 'true';
          ctx.box.state = SocM07AssessmentActions.append(
            ctx.box.state,
            'message_review',
            new Date(ctx.fixture.scenario.fixedAt).toISOString(),
            { messageId, reviewed },
            ctx.fixture,
          );
          ctx.store(ctx.box.state);
          ctx.rerender();
          return;
        }
      });
    },
  };

  /* ---------------------------------------------------------------- M08 */

  // Same ctx.box/store/ui contract as M07: M08 actions replace state immutably.
  PACKS.m08 = {
    tabs: [['exposure', 'Exposure']],
    views: (ctx) => ({
      exposure: () => `<section class="m04-console-extra m08-console-extra" data-m08-console-workspace="exposure">${SocM08AssessmentUi.render(ctx.fixture, ctx.box.state, ctx.ui.selectedFindingId || '', ctx.ui.filters || {})}</section>`,
    }),
    wire(root, ctx) {
      root.addEventListener('click', (event) => {
        const findingButton = event.target.closest('[data-m08-assessment-select]');
        if (findingButton) {
          ctx.ui.selectedFindingId = findingButton.dataset.m08AssessmentSelect;
          ctx.rerender();
          return;
        }
      });
      root.addEventListener('change', (event) => {
        const filterForm = event.target.closest('.m08-assessment-filters');
        if (!filterForm) return;
        const values = new FormData(filterForm);
        ctx.ui.filters = Object.fromEntries(values.entries());
        ctx.rerender();
      });
      root.addEventListener('submit', (event) => {
        const remediationTransitionForm = event.target.closest('[data-m08-assessment-remediation-transition]');
        const remediationDecisionForm = event.target.closest('[data-m08-assessment-remediation-decision]');
        if (remediationTransitionForm || remediationDecisionForm) {
          event.preventDefault();
          const form = remediationTransitionForm || remediationDecisionForm;
          const formData = new FormData(form);
          const findingId = remediationTransitionForm
            ? form.dataset.m08AssessmentRemediationTransition : form.dataset.m08AssessmentRemediationDecision;
          const details = remediationTransitionForm ? (() => {
            const current = [...ctx.box.state.remediationDecisions].reverse().find((item) => item.findingId === findingId);
            return current ? {
              findingId,
              priority: current.priority,
              fromStatus: current.status,
              toStatus: String(formData.get('toStatus') || ''),
              ownerId: current.ownerId,
              dueDate: current.dueDate,
              rationale: current.rationale,
              evidenceIds: [...current.evidenceIds],
              transitionRationale: String(formData.get('transitionRationale') || ''),
            } : null;
          })() : {
            findingId,
            priority: String(formData.get('priority') || ''),
            status: String(formData.get('status') || ''),
            ownerId: String(formData.get('ownerId') || ''),
            dueDate: String(formData.get('dueDate') || ''),
            rationale: String(formData.get('rationale') || ''),
            evidenceIds: formData.getAll('evidenceIds'),
          };
          const scenario = ctx.fixture.scenario;
          const bounded = Math.max(Date.parse(scenario.start), Math.min(Date.parse(scenario.end), Date.now()));
          try {
            if (!details) throw new Error('Current remediation decision is unavailable.');
            ctx.box.state = SocM08AssessmentActions.append(ctx.box.state,
              remediationTransitionForm ? 'remediation_transition' : 'remediation_decision',
              new Date(bounded).toISOString(), details, ctx.fixture);
            ctx.store(ctx.box.state);
            ctx.rerender();
          } catch (error) {
            const status = form.querySelector(remediationTransitionForm
              ? '[data-m08-transition-status]' : '[data-m08-decision-status]');
            if (status) status.textContent = remediationTransitionForm
              ? 'Status update rejected. Verify the allowed transition and rationale.'
              : 'Decision could not be saved. Check priority, evidence, owner, due date, and rationale.';
          }
          return;
        }
        const incidentForm = event.target.closest('[data-m08-assessment-incident-link]');
        const riskForm = event.target.closest('[data-m08-assessment-risk-acceptance]');
        const escalationForm = event.target.closest('[data-m08-assessment-escalation]');
        if (incidentForm || riskForm || escalationForm) {
          event.preventDefault();
          const form = incidentForm || riskForm || escalationForm;
          const formData = new FormData(form);
          const type = incidentForm ? 'incident_link' : riskForm ? 'risk_acceptance' : 'escalation';
          const details = incidentForm ? {
            findingId: form.dataset.m08AssessmentIncidentLink,
            incidentId: form.dataset.m08IncidentId,
            evidenceIds: formData.getAll('evidenceIds'),
            rationale: String(formData.get('rationale') || ''),
          } : riskForm ? {
            findingId: form.dataset.m08AssessmentRiskAcceptance,
            dispositionId: form.dataset.m08DispositionId,
            evidenceIds: formData.getAll('evidenceIds'),
            rationale: String(formData.get('rationale') || ''),
          } : {
            findingId: form.dataset.m08AssessmentEscalation,
            routeId: String(formData.get('routeId') || ''),
            ownerId: String(formData.get('ownerId') || ''),
            dueDate: String(formData.get('dueDate') || ''),
            evidenceIds: formData.getAll('evidenceIds'),
            rationale: String(formData.get('rationale') || ''),
          };
          const scenario = ctx.fixture.scenario;
          const bounded = Math.max(Date.parse(scenario.start), Math.min(Date.parse(scenario.end), Date.now()));
          try {
            ctx.box.state = SocM08AssessmentActions.append(ctx.box.state,
              type, new Date(bounded).toISOString(), details, ctx.fixture);
            ctx.store(ctx.box.state);
            ctx.rerender();
          } catch (error) {
            const statusSelector = incidentForm ? '[data-m08-incident-status]' : riskForm ? '[data-m08-risk-status]' : '[data-m08-escalation-status]';
            const status = form.querySelector(statusSelector);
            if (status) status.textContent = incidentForm
              ? 'Incident link could not be saved. Check its evidence and rationale.'
              : riskForm ? 'Risk acceptance could not be saved. Check explicit disposition evidence and rationale.'
                : 'Escalation could not be saved. Check route evidence, eligible owner, due date, and rationale.';
          }
          return;
        }
        const form = event.target.closest('[data-m08-assessment-review]');
        if (!form) return;
        event.preventDefault();
        const formData = new FormData(form);
        const details = {
          findingId: form.dataset.m08AssessmentReview,
          status: formData.get('status'),
          evidenceIds: formData.getAll('evidenceIds'),
          notes: String(formData.get('notes') || ''),
        };
        const now = Date.now();
        const scenario = ctx.fixture.scenario;
        const bounded = Math.max(Date.parse(scenario.start), Math.min(Date.parse(scenario.end), now));
        const timestamp = new Date(bounded).toISOString();
        try {
          ctx.box.state = SocM08AssessmentActions.append(ctx.box.state,
            'finding_review', timestamp, details, ctx.fixture);
          ctx.store(ctx.box.state);
          ctx.rerender();
          document.querySelector('[data-m08-review-status]')?.replaceChildren('Review saved');
        } catch (error) {
          const status = form.querySelector('[data-m08-review-status]');
          if (status) status.textContent = 'Review could not be saved. Check the evidence selection.';
        }
      });
    },
  };

  /* ---------------------------------------------------------------- M07/M08 adapters */

  // Mail/network adapter for later modules: their own records when the case
  // has any, otherwise an empty (but working) Email and Network workspace.
  function m07Fixture({ id, stateKey, start, end, recipientGroups = [], messages = [], deliveryEvents = [], recipientEvents = [], networkEvents = [], packetSamples = [], endpointProcessEvents = [] }) {
    return { schemaVersion: 1, scenario: { id, stateKey, fixedAt: end, start, end, recipientGroups, messages, deliveryEvents, recipientEvents, networkEvents, packetSamples, endpointProcessEvents, expectedTruth: { incidentChain: [], confirmed: [], unconfirmed: [] } } };
  }

  // Exposure adapter for later modules: their own assets and findings when the
  // case has any, otherwise an empty (but working) Exposure workspace.
  function m08Fixture({ id, stateKey, start, end, assetInventory = [], findings = [], findingEvidence = [], incidents = [], incidentEvidence = [], riskAcceptanceDispositions = [], riskAcceptanceEvidence = [], escalationRoutes = [], assetEvidence = [] }) {
    return { schemaVersion: 1, scenario: { id, stateKey, fixedAt: end, start, end, assetInventory, findings, findingEvidence, incidents, incidentEvidence, riskAcceptanceDispositions, riskAcceptanceEvidence, escalationRoutes, assetEvidence, expectedPriority: {} } };
  }

  // Incident/Response/Recovery adapter for later modules: one incident with the
  // module's own entities, evidence and (optional) backups.
  function m09Fixture({ id, stateKey, start, end, incident, entities, edges, evidence, backups = [], actionOutcomeExamples = [] }) {
    return { schemaVersion: 1, scenario: {
      id, stateKey, start, end, fixedAt: end,
      incidentQueue: [incident],
      incidentGraph: { incidentId: incident.id, nodes: [{ id: incident.id, type: 'incident', label: incident.title }, ...entities.filter((entity) => ['endpoint', 'identity', 'service', 'file_service'].includes(entity.type)).map((entity) => ({ id: entity.id, type: entity.type, label: entity.hostname || entity.displayName || entity.id }))],
        // The M09 engine only accepts its own link id format.
        edges: edges.map((edge, index) => ({ ...edge, id: `M09-LINK-${String(index + 1).padStart(3, '0')}` })) },
      entities, backups, evidence: evidence.map((item) => ({ id: item.id, type: item.type || 'record', time: item.time, entityId: item.entityId, relatedEntityIds: item.relatedEntityIds || [], relatedEvidenceIds: [], summary: item.summary })),
      sourceEvidenceIds: [], actionOutcomeExamples,
    }, expectedResponseTruth: null };
  }

  // A pack whose actions replace state immutably (M07/M08), kept inside a
  // later module's own saved state.
  function embeddedBox(stateRoot, key, normalize, fixture, save) {
    let cache = null;
    return {
      box: {
        get state() { if (!cache) cache = normalize(JSON.parse(JSON.stringify(stateRoot().tools?.[key] || {})), fixture); return cache; },
        set state(value) { cache = value; },
      },
      store: (next) => { const root = stateRoot(); root.tools ||= {}; root.tools[key] = JSON.parse(JSON.stringify(next)); cache = null; save(); },
    };
  }

  /* ---------------------------------------------------------------- M09 */

  // Incident, Response and Recovery over SocM09AssessmentState. Actions are
  // stamped with a lab clock that advances inside the scenario window, and
  // each executed action's outcome comes from the case's own outcome
  // records (defaulting to success), never from the learner.
  const M09_ACTION_TARGETS = {
    isolate_endpoint: 'endpoint', isolate_device: 'device', disable_identity: 'identity', revoke_session: 'session',
    block_ioc: 'ioc', quarantine_file: 'file', remove_inbox_rule: 'inbox_rule', remove_persistence: 'persistence',
    restore_backup: 'device',
  };
  const M09_ACTION_LABELS = {
    isolate_endpoint: 'Isolate endpoint', isolate_device: 'Isolate device', disable_identity: 'Disable account', revoke_session: 'Revoke session',
    block_ioc: 'Block IOC', quarantine_file: 'Quarantine file', remove_inbox_rule: 'Remove inbox rule', remove_persistence: 'Remove persistence',
    restore_backup: 'Restore / scan / validate from backup',
  };
  const m09Incident = (ctx) => ctx.fixture.scenario.incidentGraph.incidentId;
  const m09Clock = (ctx, state) => {
    const s = ctx.fixture.scenario;
    const times = [...(state.actionHistory || []), ...(state.workflowHistory || [])].map((item) => Date.parse(item.timestamp)).filter(Number.isFinite);
    const base = Math.max(Date.parse(s.incidentQueue[0]?.reportedAt || s.start), ...times);
    return new Date(Math.min(base + 15000, Date.parse(s.end))).toISOString();
  };
  const m09Outcome = (ctx, type, entityId) => (ctx.fixture.scenario.actionOutcomeExamples || [])
    .find((item) => item.action === type && item.entityId === entityId)?.outcome || 'success';

  function m09IncidentView(ctx) {
    const state = ctx.load();
    const incidentId = m09Incident(ctx);
    const detail = SocM09AssessmentState.incidentDetail(incidentId, state, ctx.fixture);
    const queue = SocM09AssessmentState.incidentQueue(ctx.fixture, state);
    const reviewed = new Set(state.reviewedEvidenceIds || []);
    const options = (values, current) => values.map(([value, label]) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`).join('');
    const nextStatuses = { open: ['investigating'], investigating: ['contained', 'resolved'], contained: ['investigating', 'resolved'], resolved: ['investigating', 'closed'], closed: [] }[detail.status] || [];
    const tasks = detail.tasks.map((task) => `<li><strong>${esc(task.title)}</strong> · ${esc(task.status)}${task.completionEvidence ? ` · ${esc(task.completionEvidence.note)} (${esc(task.completionEvidence.evidenceIds.join(', '))})` : ''}${task.status !== 'completed' ? `<form data-m09-task-complete="${esc(task.id)}"><label>Completion note<input name="note" maxlength="500" required></label><fieldset><legend>Evidence</legend>${ctx.evidence.map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}"> ${esc(item.id)}</label>`).join('')}</fieldset><button type="submit">Complete task</button></form>` : ''}</li>`).join('');
    return `<section class="m04-console-extra m09-console-extra" data-m09-console-workspace="incident">
      <h4>Incident queue</h4><ul>${queue.map((item) => `<li><strong>${esc(item.id)}</strong> · ${esc(item.title)} · ${esc(item.status)} · ${esc(item.severity)} · owner ${esc(item.assigneeId || 'unassigned')} · ${esc(item.memberCount)} members</li>`).join('')}</ul>
      <p>${esc(detail.incident.summary)}</p>
      <form data-m09-workflow><h5>Priority, ownership and status</h5>
        <label>Severity<select name="severity">${options([['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']], detail.severity)}</select></label>
        <label>Owner / route<select name="assigneeId"><option value="">Unassigned</option>${options(ctx.routes.map((route) => [route.id, route.text]), detail.assigneeId)}</select></label>
        <label>Status<select name="status"><option value="${esc(detail.status)}">${esc(detail.status)} (current)</option>${options(nextStatuses.map((value) => [value, value]), '')}</select></label>
        <button type="submit">Update incident</button></form>
      <h5>Members</h5><ul>${detail.members.map((member) => `<li>${esc(member.id)} · ${esc(member.type)}</li>`).join('')}</ul>
      <h5>Evidence review</h5><ul class="m09-evidence">${ctx.evidence.map((item) => `<li><label><input type="checkbox" data-m09-review-evidence value="${esc(item.id)}"${reviewed.has(item.id) ? ' checked' : ''}> <strong>${esc(item.id)}</strong> ${esc(item.time)} · ${esc(item.title)}</label><p>${esc(item.summary)}</p></li>`).join('')}</ul>
      <h5>Response tasks</h5><ol>${tasks}</ol>
      <form data-m09-task-author><label>New task<input name="title" maxlength="160" required></label><label>Author<input name="authorId" maxlength="64" required placeholder="ir-analyst-you"></label><button type="submit">Add task</button></form>
      <form data-m09-escalation><h5>Escalation · ${esc(detail.escalationStatus)}</h5><label>Reason / remaining gaps<textarea name="reason" rows="3" maxlength="500" required>${esc(detail.escalationReason || '')}</textarea></label><button type="submit" name="to" value="${detail.escalationStatus === 'none' ? 'escalated' : detail.escalationStatus === 'escalated' ? 'resolved' : ''}"${detail.escalationStatus === 'resolved' ? ' disabled' : ''}>${detail.escalationStatus === 'none' ? 'Escalate' : 'Mark escalation resolved'}</button></form>
      <p role="alert" data-m09-feedback></p>
    </section>`;
  }

  function m09ApprovalPanel(ctx, state, actionTypes) {
    const s = ctx.fixture.scenario;
    const workflow = state.incidentWorkflows[m09Incident(ctx)];
    const memberships = new Set(state.incidentMemberships || []);
    const inScope = (entity) => memberships.has(entity.id) || memberships.has(entity.linkedEntityId) || memberships.has(entity.accountId);
    const targets = s.entities.filter((entity) => Object.values(M09_ACTION_TARGETS).includes(entity.type) && inScope(entity));
    const approvalOpen = workflow.approvalStatus === 'pending';
    const approved = workflow.approvalStatus === 'approved' && actionTypes.includes(workflow.approvalActionType);
    return `<section class="m09-approval"><h5>Approval gate · ${esc(workflow.approvalStatus)}${workflow.approvalActionType ? ` · ${esc(M09_ACTION_LABELS[workflow.approvalActionType] || workflow.approvalActionType)} → ${esc(workflow.approvalTargetId)}` : ''}</h5>
      <form data-m09-approval-request><label>Action<select name="actionType">${actionTypes.map((type) => `<option value="${esc(type)}">${esc(M09_ACTION_LABELS[type])}</option>`).join('')}</select></label>
        <label>Target<select name="targetId">${targets.map((entity) => `<option value="${esc(entity.id)}">${esc(entity.id)} · ${esc(entity.type)}</option>`).join('')}</select></label>
        <label>Justification<input name="reason" maxlength="500" required></label><button type="submit"${approvalOpen ? ' disabled' : ''}>Request approval</button></form>
      ${approvalOpen ? `<form data-m09-approval-decision><label>Approver ID<input name="approver" maxlength="64" required placeholder="ir-lead-morgan" pattern="ir-(lead|analyst)-[a-z0-9-]+" title="Incident-response ID: ir-lead-… or ir-analyst-… (lowercase)"><small>Incident lead or analyst ID, e.g. ir-lead-morgan</small></label><label>Decision reason<input name="reason" maxlength="500" required></label><button type="submit" name="decision" value="approved">Approve</button><button type="submit" name="decision" value="rejected">Reject</button></form>` : ''}
      ${approved && workflow.approvalActionType !== 'restore_backup' ? `<button type="button" data-m09-execute>Execute approved action</button>` : ''}
    </section>`;
  }

  function m09ResponseView(ctx) {
    const state = ctx.load();
    const s = ctx.fixture.scenario;
    const entityRows = s.entities.map((entity) => `<tr><td class="m03e-mono">${esc(entity.id)}</td><td>${esc(entity.type)}</td><td>${esc(entity.hostname || entity.path || entity.name || entity.value || entity.displayName || '')}</td><td>${esc(Object.entries(state.entityStates?.[entity.id] || {}).map(([field, value]) => `${field}: ${value}`).join(', ') || '—')}</td></tr>`).join('');
    const log = (state.actionHistory || []).slice().reverse().map((action) => `<li><strong>${esc(action.type)}</strong> → ${esc(action.details.entityId || action.details.targetEntityId || '')} · <b>${esc(action.outcome)}</b> · ${esc(action.details.execution?.summary || '')} · ${esc(action.timestamp.slice(11, 19))}</li>`).join('');
    return `<section class="m04-console-extra m09-console-extra" data-m09-console-workspace="response">
      ${m09ApprovalPanel(ctx, state, Object.keys(M09_ACTION_TARGETS).filter((type) => type !== 'restore_backup'))}
      <h5>Simulated entity state</h5><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>ENTITY</th><th>TYPE</th><th>NAME</th><th>STATE</th></tr></thead><tbody>${entityRows}</tbody></table></div>
      <h5>Action execution log</h5><ol>${log || '<li>No actions executed.</li>'}</ol>
      <p role="alert" data-m09-feedback></p>
    </section>`;
  }

  function m09RecoveryView(ctx) {
    const state = ctx.load();
    const incidentId = m09Incident(ctx);
    const inventory = SocM09AssessmentState.recoveryInventory(state, incidentId, ctx.fixture);
    const selected = [...(state.actionHistory || [])].reverse().find((action) => action.type === 'select_recovery_point');
    const done = (type) => (state.actionHistory || []).find((action) => action.type === type && selected && action.details.recoveryPointId === selected.details.recoveryPointId);
    const workflow = state.incidentWorkflows[incidentId];
    const restoreApproved = workflow.approvalStatus === 'approved' && workflow.approvalActionType === 'restore_backup' && workflow.approvalTargetId === selected?.details.targetEntityId;
    const validated = done('validate_recovery');
    const monitored = (state.actionHistory || []).find((action) => action.type === 'monitor_recovery');
    const step = (type, label, ready) => `<button type="button" data-m09-recovery="${type}"${ready && !done(type) ? '' : ' disabled'}>${label}${done(type) ? ` · ${esc(done(type).outcome)}` : ''}</button>`;
    return `<section class="m04-console-extra m09-console-extra" data-m09-console-workspace="recovery">
      <h5>Backup inventory</h5><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>RECOVERY POINT</th><th>DEVICE</th><th>CAPTURED</th><th>INTEGRITY</th><th></th></tr></thead><tbody>${inventory.map((backup) => `<tr><td class="m03e-mono">${esc(backup.recoveryPointId)}</td><td>${esc(backup.targetEntityId)}</td><td>${esc(backup.capturedAt.replace('T', ' ').slice(0, 16))}</td><td>${esc(backup.integrity)}</td><td><button type="button" data-m09-select-recovery="${esc(backup.recoveryPointId)}"${selected?.details.recoveryPointId === backup.recoveryPointId ? ' disabled' : ''}>${selected?.details.recoveryPointId === backup.recoveryPointId ? 'Selected' : 'Select'}</button></td></tr>`).join('')}</tbody></table></div>
      ${selected ? m09ApprovalPanel(ctx, state, ['restore_backup']) : '<p>Select a recovery point to request restore approval.</p>'}
      ${selected ? `<p>${step('restore_backup', 'Restore', restoreApproved)} ${step('scan_recovery', 'Clean scan', restoreApproved && done('restore_backup'))} ${step('validate_recovery', 'Validate with owner', restoreApproved && done('scan_recovery'))}</p>` : ''}
      ${validated && !monitored ? `<form data-m09-monitor><h5>Monitoring period (30 minutes)</h5><fieldset><legend>Residual risk observed</legend><label><input type="checkbox" name="risk" value="persistence_present"> Persistence present</label><label><input type="checkbox" name="risk" value="credential_session_active"> Credential/session still active</label><label><input type="checkbox" name="risk" value="malware_detected"> Malware detected</label></fieldset><button type="submit">Record monitoring result</button></form>` : ''}
      ${monitored ? `<p><strong>Monitoring:</strong> ${esc(monitored.details.execution.summary)}${monitored.details.residualRiskIds.length ? ` (${esc(monitored.details.residualRiskIds.join(', '))}) — incident reopened` : ''}</p>` : ''}
      <p role="alert" data-m09-feedback></p>
    </section>`;
  }

  PACKS.m09 = {
    tabs: [['incident', 'Incident'], ['response', 'Response'], ['recovery', 'Recovery']],
    views: (ctx) => ({ incident: () => m09IncidentView(ctx), response: () => m09ResponseView(ctx), recovery: () => m09RecoveryView(ctx) }),
    wire(root, ctx) {
      const incidentId = () => m09Incident(ctx);
      const run = (work) => {
        try { const state = ctx.load(); ctx.store(work(state, m09Clock(ctx, state))); ctx.rerender(); } catch (error) {
          root.querySelectorAll('[data-m09-feedback]').forEach((node) => { node.textContent = error.message; });
        }
      };
      const workflow = (changes) => run((state, at) => SocM09AssessmentState.updateIncidentWorkflow(state, incidentId(), changes, at, ctx.fixture));
      root.addEventListener('change', (event) => {
        const box = event.target.closest('[data-m09-review-evidence]');
        if (!box) return;
        run((state) => {
          const ids = new Set(state.reviewedEvidenceIds || []);
          if (box.checked) ids.add(box.value); else ids.delete(box.value);
          return SocM09AssessmentState.transition(state, { reviewedEvidenceIds: [...ids] }, ctx.fixture);
        });
      });
      root.addEventListener('submit', (event) => {
        const form = event.target;
        if (!form.matches('[data-m09-workflow], [data-m09-task-complete], [data-m09-task-author], [data-m09-escalation], [data-m09-approval-request], [data-m09-approval-decision], [data-m09-monitor]')) return;
        event.preventDefault();
        const data = new FormData(form);
        if (form.matches('[data-m09-workflow]')) {
          const state = ctx.load();
          const current = state.incidentWorkflows[incidentId()];
          const changes = {};
          if (data.get('severity') !== current.severity) changes.severity = data.get('severity');
          if ((data.get('assigneeId') || null) !== current.assigneeId && data.get('assigneeId')) changes.assigneeId = data.get('assigneeId');
          if (data.get('status') !== current.status) changes.status = data.get('status');
          if (Object.keys(changes).length) workflow(changes);
          return;
        }
        if (form.matches('[data-m09-task-complete]')) {
          const taskId = form.dataset.m09TaskComplete;
          run((state, at) => SocM09AssessmentState.completeIncidentTask(state, incidentId(), taskId, { note: String(data.get('note') || ''), evidenceIds: data.getAll('evidenceIds') }, at, ctx.fixture));
          return;
        }
        if (form.matches('[data-m09-task-author]')) {
          run((state, at) => SocM09AssessmentState.authorIncidentTask(state, incidentId(), { title: String(data.get('title') || ''), authorId: String(data.get('authorId') || '').trim() }, at, ctx.fixture));
          return;
        }
        if (form.matches('[data-m09-escalation]')) {
          const to = event.submitter?.value || 'escalated';
          workflow({ escalationStatus: to, escalationReason: String(data.get('reason') || '') });
          return;
        }
        if (form.matches('[data-m09-approval-request]')) {
          workflow({ approvalStatus: 'pending', approvalReason: String(data.get('reason') || ''), approvalTargetId: data.get('targetId'), approvalActionType: data.get('actionType') });
          return;
        }
        if (form.matches('[data-m09-approval-decision]')) {
          workflow({ approvalStatus: event.submitter?.value === 'rejected' ? 'rejected' : 'approved', approvalActorId: String(data.get('approver') || '').trim(), approvalReason: String(data.get('reason') || '') });
          return;
        }
        if (form.matches('[data-m09-monitor]')) {
          run((state, at) => {
            const validation = [...state.actionHistory].reverse().find((action) => action.type === 'validate_recovery');
            return SocM09AssessmentState.completeRecoveryMonitoring(state, incidentId(), validation?.details.entityId, at, data.getAll('risk'), ctx.fixture);
          });
        }
      });
      root.addEventListener('click', (event) => {
        if (event.target.closest('[data-m09-execute]')) {
          run((state, at) => {
            const approval = state.incidentWorkflows[incidentId()];
            const type = approval.approvalActionType;
            const target = approval.approvalTargetId;
            return SocM09AssessmentState.executeApprovedAction(state, incidentId(), { type, outcome: m09Outcome(ctx, type, target), details: { entityId: target, incidentId: incidentId(), evidenceIds: state.reviewedEvidenceIds || [] } }, at, ctx.fixture);
          });
          return;
        }
        const select = event.target.closest('[data-m09-select-recovery]');
        if (select) {
          run((state, at) => SocM09AssessmentState.selectRecoveryPoint(state, incidentId(), select.dataset.m09SelectRecovery, at, ctx.fixture));
          return;
        }
        const recovery = event.target.closest('[data-m09-recovery]');
        if (recovery) {
          run((state, at) => {
            const approval = state.incidentWorkflows[incidentId()];
            const type = recovery.dataset.m09Recovery;
            return SocM09AssessmentState.executeApprovedAction(state, incidentId(), { type, outcome: m09Outcome(ctx, type, approval.approvalTargetId), details: { entityId: approval.approvalTargetId, incidentId: incidentId() } }, at, ctx.fixture);
          });
        }
      });
    },
  };

  /* ---------------------------------------------------------------- M10 */

  // Evidence Locker and Case Reconstruction over SocM10AssessmentState.
  // Console evidence pins are the intake queue for the locker.
  const M10_METHOD_LABELS = { gateway_export: 'Mail gateway export', disk_image: 'Forensic disk image', triage_collection: 'Live triage collection', log_export: 'Log export', memory_capture: 'Memory capture' };
  const m10Clock = (ctx, state) => {
    const s = ctx.fixture.scenario;
    const times = (state.actionHistory || []).map((item) => Date.parse(item.timestamp)).filter(Number.isFinite);
    return new Date(Math.min(Math.max(Date.parse(s.request.receivedAt), ...times) + 30000, Date.parse(s.end))).toISOString();
  };

  function m10LockerView(ctx) {
    const state = ctx.load();
    const s = ctx.fixture.scenario;
    const artifact = (id) => s.artifacts.find((item) => item.id === id);
    const pins = (ctx.console().pins || []).filter((id) => artifact(id) && !state.locker[id]);
    const sources = [...new Set(s.artifacts.map((item) => item.source))].sort();
    const custodian = (id) => s.custodians.find((item) => item.id === id)?.label || id;
    const intake = pins.map((id) => `<form class="m10-intake" data-m10-intake="${esc(id)}"><strong>${esc(id)}</strong> · ${esc(artifact(id).title)}<label>Original source<select name="source" required><option value="">Choose…</option>${sources.map((value) => `<option>${esc(value)}</option>`).join('')}</select></label><label>Acquisition method<select name="method" required><option value="">Choose…</option>${Object.entries(M10_METHOD_LABELS).map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('')}</select></label><label>Acquired by<input name="acquiredBy" maxlength="64" value="soc-analyst" required></label><button type="submit">Add to locker</button></form>`).join('');
    const rows = Object.values(state.locker).map((item) => `<tr><td class="m03e-mono">${esc(item.artifactId)}</td><td>${esc(artifact(item.artifactId).title)}<br><small>${esc(item.source)} · ${esc(M10_METHOD_LABELS[item.method])} · acquisition ${esc(item.acquisition)} · ${esc(item.acquiredAt.slice(11, 19))} by ${esc(item.acquiredBy)}</small></td><td class="m03e-mono" title="${esc(item.recordedHash)}">${esc(item.recordedHash.slice(0, 12))}…${item.verifiedHash ? `<br><small>re-hash ${esc(item.verifiedHash.slice(0, 12))}…</small>` : ''}</td><td><b class="m10-integrity m10-integrity-${esc(item.integrity)}">${esc(item.integrity)}</b></td><td>${esc(custodian(item.custodian))}</td><td><button type="button" data-m10-verify="${esc(item.artifactId)}">Verify hash</button>${item.integrity === 'mismatch' ? ` <button type="button" data-m10-reacquire="${esc(item.artifactId)}">Re-acquire</button>` : ''}</td></tr>`).join('');
    const lockerIds = Object.keys(state.locker);
    const options = lockerIds.map((id) => `<option value="${esc(id)}">${esc(id)}</option>`).join('');
    const holdIds = state.legalHold?.artifactIds || [];
    return `<section class="m04-console-extra m10-console-extra" data-m10-console-workspace="locker">
      <p><strong>${esc(s.request.id)}</strong> · ${esc(s.request.from)}: ${esc(s.request.text)}</p>
      <h5>Intake from evidence pins</h5>${intake || '<p class="m03e-muted">Pin records in Log Search, the Timeline or the Evidence tab; pinned artifacts appear here for intake.</p>'}
      <h5>Evidence locker</h5><div class="m03e-table-wrap"><table class="m03e-table"><thead><tr><th>ID</th><th>ARTIFACT · ACQUISITION</th><th>RECORDED SHA-256</th><th>INTEGRITY</th><th>CUSTODIAN</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">The locker is empty.</td></tr>'}</tbody></table></div>
      ${lockerIds.length ? `<form data-m10-transfer><h5>Custody transfer</h5><label>Artifact<select name="artifactId">${options}</select></label><label>To<select name="to">${s.custodians.map((item) => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('')}</select></label><label>Reason<input name="reason" maxlength="500" required></label><button type="submit">Record transfer</button></form>
      <ol>${(state.transfers || []).map((item) => `<li>${esc(item.artifactId)}: ${esc(custodian(item.from))} → ${esc(custodian(item.to))} · hash ${esc(item.hashAtTransfer.slice(0, 12))}… · ${esc(item.at.slice(11, 19))}</li>`).join('')}</ol>
      <form data-m10-hold><h5>Legal hold on originals${holdIds.length ? ` · ${esc(holdIds.join(', '))}` : ''}</h5><fieldset>${lockerIds.map((id) => `<label><input type="checkbox" name="artifactIds" value="${esc(id)}"${holdIds.includes(id) ? ' checked' : ''}> ${esc(id)}</label>`).join('')}</fieldset><label>Reason<input name="reason" maxlength="500" required value="${esc(state.legalHold?.reason || '')}"></label><button type="submit">Place legal hold</button></form>
      <p><button type="button" data-m10-export${state.legalHold ? '' : ' disabled'}>Export evidence package</button></p><ol>${(state.exports || []).map((pkg) => `<li>${esc(pkg.id)} · ${esc(pkg.artifactIds.join(', '))} · manifest of ${esc(pkg.manifest.length)} hashes · ${esc(pkg.at.slice(11, 19))}</li>`).join('')}</ol>
      <form data-m10-note><h5>Analyst notes (kept separate from the originals)</h5><label>Artifact<select name="artifactId">${options}</select></label><label>Note<textarea name="text" rows="2" maxlength="1000" required></textarea></label><button type="submit">Add note</button></form>
      <ul>${(state.notes || []).map((item) => `<li>${esc(item.artifactId)} · ${esc(item.text)}</li>`).join('')}</ul>` : ''}
      <p role="alert" data-m10-feedback></p>
    </section>`;
  }

  function m10ReconstructionView(ctx) {
    const state = ctx.load();
    const s = ctx.fixture.scenario;
    const artifact = (id) => s.artifacts.find((item) => item.id === id);
    const lockerIds = Object.keys(state.locker);
    const cite = lockerIds.map((id) => `<label><input type="checkbox" name="artifactIds" value="${esc(id)}"> ${esc(id)}</label>`).join('');
    const group = (kind, label) => `<h5>${label}</h5><ul>${state.statements.filter((item) => item.kind === kind).map((item) => `<li>${esc(item.text)} <small>(${esc(item.artifactIds.join(', '))})</small> <button type="button" data-m10-remove-statement="${esc(item.id)}">Remove</button></li>`).join('') || '<li class="m03e-muted">None yet.</li>'}</ul>`;
    return `<section class="m04-console-extra m10-console-extra" data-m10-console-workspace="reconstruction">
      <h5>Incident timeline</h5><ol>${state.timeline.map((id, index) => `<li><strong>${esc(artifact(id).time.slice(11, 16))}</strong> ${esc(id)} · ${esc(artifact(id).title)} <button type="button" data-m10-timeline-move="${index}:-1"${index ? '' : ' disabled'}>↑</button><button type="button" data-m10-timeline-move="${index}:1"${index < state.timeline.length - 1 ? '' : ' disabled'}>↓</button><button type="button" data-m10-timeline-remove="${index}">Remove</button></li>`).join('') || '<li class="m03e-muted">Add locker evidence in the order it happened.</li>'}</ol>
      ${lockerIds.length ? `<p><label>Add to timeline <select data-m10-timeline-pick><option value="">Choose locker evidence…</option>${lockerIds.filter((id) => !state.timeline.includes(id)).map((id) => `<option value="${esc(id)}">${esc(id)} · ${esc(artifact(id).title)}</option>`).join('')}</select></label></p>` : ''}
      <form data-m10-statement><h5>Case documentation</h5><label>Statement type<select name="kind"><option value="fact">Observed fact</option><option value="analysis">Supported analysis</option><option value="root_cause">Root cause</option></select></label><label>Statement<textarea name="text" rows="3" maxlength="1500" required></textarea></label><fieldset><legend>Cited locker evidence</legend>${cite || '<p>Add evidence to the locker first.</p>'}</fieldset><button type="submit">Record statement</button></form>
      ${group('fact', 'Observed facts')}${group('analysis', 'Supported analysis')}${group('root_cause', 'Root cause')}
      <form data-m10-unknown><h5>Unknowns</h5><label>Topic<select name="topic"><option value="exfiltration">Data exfiltration</option><option value="memory">Memory-resident activity</option><option value="attribution">Attribution</option><option value="other">Other</option></select></label><label>What is not established<input name="text" maxlength="800" required></label><button type="submit">Record unknown</button></form>
      <ul>${state.unknowns.map((item) => `<li>${esc(item.topic)} · ${esc(item.text)}</li>`).join('')}</ul>
      <form data-m10-escalate><h5>Specialist escalation${state.escalation ? ` · ${esc(state.escalation.route)}` : ''}</h5><label>Route<select name="route"><option value="digital-forensics">Digital Forensics</option><option value="identity-response">Identity Response</option><option value="legal">Legal</option></select></label><label>Reason and boundary<input name="reason" maxlength="800" required></label><fieldset><legend>Evidence handed over</legend>${cite}</fieldset><button type="submit">Record escalation</button></form>
      <p class="m03e-muted">Map evidenced behavior in the ATT&amp;CK tab, citing the same artifact IDs.</p>
      <p role="alert" data-m10-feedback></p>
    </section>`;
  }

  PACKS.m10 = {
    tabs: [['locker', 'Evidence Locker'], ['reconstruction', 'Reconstruction']],
    views: (ctx) => ({ locker: () => m10LockerView(ctx), reconstruction: () => m10ReconstructionView(ctx) }),
    wire(root, ctx) {
      const api = SocM10AssessmentState;
      const run = (work) => {
        try { const state = ctx.load(); ctx.store(work(state, m10Clock(ctx, state))); ctx.rerender(); } catch (error) {
          root.querySelectorAll('[data-m10-feedback]').forEach((node) => { node.textContent = error.message; });
        }
      };
      root.addEventListener('submit', (event) => {
        const form = event.target;
        if (!form.matches('[data-m10-intake], [data-m10-transfer], [data-m10-hold], [data-m10-note], [data-m10-statement], [data-m10-unknown], [data-m10-escalate]')) return;
        event.preventDefault();
        const data = new FormData(form);
        const value = (name) => String(data.get(name) || '');
        if (form.matches('[data-m10-intake]')) run((state, at) => api.intake(state, ctx.fixture, { artifactId: form.dataset.m10Intake, source: value('source'), method: value('method'), acquiredBy: value('acquiredBy') }, at));
        else if (form.matches('[data-m10-transfer]')) run((state, at) => api.transfer(state, ctx.fixture, { artifactId: value('artifactId'), to: value('to'), reason: value('reason') }, at));
        else if (form.matches('[data-m10-hold]')) run((state, at) => api.hold(state, ctx.fixture, { artifactIds: data.getAll('artifactIds'), reason: value('reason') }, at));
        else if (form.matches('[data-m10-note]')) run((state, at) => api.note(state, ctx.fixture, { artifactId: value('artifactId'), text: value('text') }, at));
        else if (form.matches('[data-m10-statement]')) run((state, at) => api.statement(state, ctx.fixture, { kind: value('kind'), text: value('text'), artifactIds: data.getAll('artifactIds') }, at));
        else if (form.matches('[data-m10-unknown]')) run((state, at) => api.unknown(state, ctx.fixture, { topic: value('topic'), text: value('text') }, at));
        else run((state, at) => api.escalate(state, ctx.fixture, { route: value('route'), reason: value('reason'), artifactIds: data.getAll('artifactIds') }, at));
      });
      root.addEventListener('change', (event) => {
        const pick = event.target.closest('[data-m10-timeline-pick]');
        if (pick && pick.value) run((state, at) => api.setTimeline(state, ctx.fixture, [...state.timeline, pick.value], at));
      });
      root.addEventListener('click', (event) => {
        const button = event.target.closest('[data-m10-verify], [data-m10-reacquire], [data-m10-export], [data-m10-timeline-move], [data-m10-timeline-remove], [data-m10-remove-statement]');
        if (!button) return;
        const d = button.dataset;
        if (d.m10Verify) run((state, at) => api.verify(state, ctx.fixture, d.m10Verify, at));
        else if (d.m10Reacquire) run((state, at) => api.reacquire(state, ctx.fixture, d.m10Reacquire, at));
        else if (button.matches('[data-m10-export]')) run((state, at) => api.exportPackage(state, ctx.fixture, at));
        else if (d.m10RemoveStatement) run((state, at) => api.removeStatement(state, ctx.fixture, d.m10RemoveStatement, at));
        else run((state, at) => {
          const timeline = [...state.timeline];
          if (d.m10TimelineRemove !== undefined) timeline.splice(Number(d.m10TimelineRemove), 1);
          else {
            const [index, delta] = d.m10TimelineMove.split(':').map(Number);
            [timeline[index], timeline[index + delta]] = [timeline[index + delta], timeline[index]];
          }
          return api.setTimeline(state, ctx.fixture, timeline, at);
        });
      });
    },
  };

  /* ---------------------------------------------------------- guided guide */

  // Keep a guided lab's "Console Guide" checklist (and any status text) in
  // step with the console. The observer disconnects while it writes and
  // batches to one update per frame: writing inside the observed subtree
  // otherwise re-triggers it forever and freezes the page on the first click.
  function watchGuide(root, { selector, render, update }) {
    const options = { childList: true, subtree: true };
    const rendered = new WeakMap();
    let queued = false;
    const sync = () => {
      const guide = root.querySelector(selector);
      if (guide) {
        const html = render();
        if (rendered.get(guide) !== html) {
          const holder = document.createElement('div');
          holder.innerHTML = html;
          const next = holder.firstElementChild;
          next.open = guide.open;
          guide.replaceWith(next);
          rendered.set(next, html);
        }
      }
      if (update) update();
    };
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        observer.disconnect();
        try { sync(); } finally { observer.observe(root, options); }
      });
    });
    observer.observe(root, options);
    return observer;
  }

  // Assigning textContent always replaces the node's children, even with the
  // same text, so only write when the text actually changes.
  function setText(element, text) {
    if (element && element.textContent !== text) element.textContent = text;
  }

  /* ---------------------------------------------------------------- mount */

  // Mount the Module 3 console for one module with the packs it carries.
  // packs: [{ id: 'm04', ctx }, …] in module order. Case alerts from the
  // module's dataset stay in the queue beside any rule-generated alerts.
  function mount(scope, { data, stateRoot, save, title, ariaLabel, packs = [], caseView, caseBadge, extraTabs = [], views = {}, idPrefix = '', sourceMappings }) {
    const active = packs.map(({ id, ctx }) => ({ pack: PACKS[id], ctx: { scope, ...ctx } }));
    const packViews = Object.assign({}, ...active.map(({ pack, ctx }) => (pack.views ? pack.views(ctx) : {})), views);
    const note = active.map(({ pack }) => pack.alertsNote).filter(Boolean).pop();
    m03eMountConsole(scope, {
      data, stateRoot, save, title, ariaLabel, caseView, caseBadge, idPrefix, sourceMappings,
      extraTabs: [...active.flatMap(({ pack }) => pack.tabs || []), ...extraTabs],
      views: packViews,
      alerts: () => [...(data.alerts || []), ...active.flatMap(({ pack, ctx }) => (pack.alerts ? pack.alerts(ctx) : []))],
      alertsNote: note,
      alertDetailHtml: (row) => active.map(({ pack, ctx }) => (pack.alertDetailHtml ? pack.alertDetailHtml(ctx, row) : '')).join(''),
      resultsActionsHtml: () => active.map(({ pack, ctx }) => (pack.resultsActionsHtml ? pack.resultsActionsHtml(ctx) : '')).join(''),
      onSelect: (type, id) => active.forEach(({ pack, ctx }) => pack.onSelect && pack.onSelect(ctx, type, id)),
    });
    // Pack listeners are delegated, so an element needs them once. Modules
    // that re-render inside a persistent root and call wire() again stacked a
    // copy per render: one click then saved the same action N times.
    const wiredRoots = new WeakSet();
    return {
      wire(root) {
        if (!root || wiredRoots.has(root)) return;
        wiredRoots.add(root);
        m03eWireMountedConsole(root, scope);
        active.forEach(({ pack, ctx }) => pack.wire && pack.wire(root, ctx));
      },
    };
  }

  return Object.freeze({ PACKS, mount, watchGuide, setText, embedded, embeddedBox, m04Fixture, m05Fixture, m06Fixture, m07Fixture, m08Fixture, m09Fixture, esc });
})();

/* Learner-authored query testing and rule-draft conversion for M04. */
const SocM04RulesUi = (() => {
  'use strict';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const TELEMETRY_FIELDS = Object.freeze(['TimeGenerated', 'EventId', 'EventType', 'Account', 'SourceIp', 'Result', 'Device']);
  const EXCLUSION_OPERATORS = Object.freeze(['==', '!=', 'contains', 'startswith']);
  const MIN_FREQUENCY_MINUTES = 5;
  const MAX_FREQUENCY_MINUTES = 10080;
  const MAX_SCHEDULE_AHEAD_MS = 90 * 24 * 60 * 60 * 1000;

  function validTimestamp(timestamp, label = 'Pass an explicit valid timestamp.') {
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError(label);
  }

  function findRule(assessment, ruleId) {
    const rule = (assessment.rules || []).find((item) => item.id === ruleId);
    if (!rule) throw new RangeError('Analytics rule not found.');
    return rule;
  }

  function configureSchedule(assessment, ruleId, fields, timestamp) {
    validTimestamp(timestamp);
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new TypeError('Schedule configuration is required.');
    const rule = findRule(assessment, ruleId);
    const enabled = fields.enabled === true || fields.enabled === 'true' || fields.enabled === 'on';
    const frequencyMinutes = Number(fields.frequencyMinutes);
    const scheduledAt = String(fields.scheduledAt || '').trim();
    if (!Number.isSafeInteger(frequencyMinutes) || frequencyMinutes < MIN_FREQUENCY_MINUTES || frequencyMinutes > MAX_FREQUENCY_MINUTES) throw new TypeError(`Frequency must be a whole number from ${MIN_FREQUENCY_MINUTES} to ${MAX_FREQUENCY_MINUTES} minutes.`);
    let normalizedSchedule = null;
    if (enabled && scheduledAt) {
      validTimestamp(scheduledAt, 'Scheduled time must be a valid timestamp.');
      const delta = Date.parse(scheduledAt) - Date.parse(timestamp);
      if (delta < 0 || delta > MAX_SCHEDULE_AHEAD_MS) throw new TypeError('Scheduled time must be from now through 90 days ahead.');
      normalizedSchedule = new Date(Date.parse(scheduledAt)).toISOString();
    }
    rule.enabled = enabled;
    rule.schedule = { frequencyMinutes, scheduledAt: normalizedSchedule };
    if (assessment.ruleDraft?.id === ruleId) assessment.ruleDraft = clone(rule);
    const next = SocM04AssessmentActions.record({ assessment }, 'scheduling', timestamp, {
      operation: 'schedule-configure', ruleId, enabled, frequencyMinutes, scheduledAt: normalizedSchedule,
    });
    Object.assign(assessment, next.assessment);
    return clone(rule);
  }

  function recordExecution(assessment, ruleId, timestamp, mode = 'manual') {
    validTimestamp(timestamp);
    if (!['manual', 'scheduled'].includes(mode)) throw new TypeError('Execution mode must be manual or scheduled.');
    const rule = findRule(assessment, ruleId);
    if (!rule.enabled) throw new Error('Disabled rules cannot be executed.');
    if (mode === 'scheduled' && (!rule.schedule?.scheduledAt || !Number.isSafeInteger(rule.schedule.frequencyMinutes))) throw new Error('Scheduled execution requires an enabled rule with a configured schedule.');
    const execution = {
      id: `M04-EXEC-${String((assessment.nextExecutionSequence || 1)).padStart(4, '0')}`,
      ruleId, requestedAt: new Date(Date.parse(timestamp)).toISOString(), mode, status: 'pending',
    };
    assessment.executions = [...(assessment.executions || []), execution].slice(-200);
    assessment.nextExecutionSequence = (assessment.nextExecutionSequence || 1) + 1;
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_execution', timestamp, {
      operation: 'execution-requested', executionId: execution.id, ruleId, mode, status: 'pending',
    });
    Object.assign(assessment, next.assessment);
    return clone(execution);
  }

  function completePendingExecution(assessment, executionId, fixture) {
    const execution = (assessment.executions || []).find((item) => item.id === executionId);
    if (!execution || execution.status !== 'pending') throw new RangeError('Pending M04 execution not found.');
    const rule = (assessment.rules || []).find((item) => item.id === execution.ruleId);
    let result;
    try {
      result = SocM04RuleEvaluator.evaluate(rule, fixture);
    } catch (error) {
      result = { succeeded: false, error: String(error?.message || error), evaluatedAt: fixture?.scenario?.end || null, excludedCandidates: [], suppressedCandidates: [] };
    }
    const completedAt = result.evaluatedAt || fixture?.scenario?.end;
    execution.completedAt = completedAt;
    execution.alertIds = [];
    execution.reviewEvidence = {
      excluded: clone(result.excludedCandidates || []),
      suppressed: clone(result.suppressedCandidates || []),
    };
    if (!result.succeeded) {
      execution.status = 'failed';
      execution.error = result.error || 'Rule evaluation failed.';
    } else {
      execution.status = 'completed';
      execution.error = '';
      const eligible = (result.retainedCandidates || []).filter((candidate) => candidate.thresholdMet === true);
      eligible.forEach((candidate) => {
        const sequence = assessment.nextAlertSequence || 1;
        const alert = {
          id: `M04-ALERT-${String(sequence).padStart(4, '0')}`,
          executionId: execution.id, ruleId: rule.id, queryId: rule.queryId || '',
          sourceRule: rule.name, sourceQuery: rule.query, group: candidate.group,
          groupingField: candidate.groupingField, severity: rule.severity,
          matchCount: candidate.matchCount, threshold: candidate.threshold,
          eventIds: candidate.supportingEventIds.slice(), createdAt: completedAt,
          title: `${rule.name} · ${String(candidate.group)}`,
          status: 'New', reviewedAt: '', reviewNote: '',
          rule: rule.name, query: rule.query, entities: [],
        };
        assessment.alerts = [...(assessment.alerts || []), alert].slice(-500);
        assessment.alertIds = [...(assessment.alertIds || []), alert.id].slice(-500);
        execution.alertIds.push(alert.id);
        assessment.nextAlertSequence = sequence + 1;
      });
    }
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_execution', completedAt, {
      operation: 'execution-completed', executionId, ruleId: execution.ruleId,
      status: execution.status, alertIds: execution.alertIds,
      excluded: execution.reviewEvidence.excluded, suppressed: execution.reviewEvidence.suppressed,
      error: execution.error,
    });
    Object.assign(assessment, next.assessment);
    return clone(execution);
  }

  function selectAlert(assessment, alertId) {
    if (!(assessment.alerts || []).some((item) => item.id === alertId)) throw new RangeError('M04 alert not found.');
    assessment.selectedAlertId = alertId;
    return clone((assessment.alerts || []).find((item) => item.id === alertId));
  }

  function reviewAlert(assessment, alertId, note = '', timestamp) {
    validTimestamp(timestamp);
    const alert = (assessment.alerts || []).find((item) => item.id === alertId);
    if (!alert) throw new RangeError('M04 alert not found.');
    const reviewNote = String(note ?? '').trim();
    if (reviewNote.length > 500) throw new TypeError('Alert review note must be 500 characters or fewer.');
    assessment.selectedAlertId = alert.id;
    alert.status = 'In review';
    alert.reviewedAt = new Date(Date.parse(timestamp)).toISOString();
    alert.reviewNote = reviewNote;
    const next = SocM04AssessmentActions.record({ assessment }, 'alert_review', timestamp, {
      alertId: alert.id, executionId: alert.executionId, status: alert.status, note: reviewNote,
    });
    Object.assign(assessment, next.assessment);
    return clone(alert);
  }

  function tables(fixture) {
    if (fixture.consoleTables) return fixture.consoleTables;
    return { AuthLog: fixture.scenario.telemetry.map((row) => ({ TimeGenerated: row.time, EventId: row.id, EventType: row.type, Account: row.account, SourceIp: row.sourceIp, Result: row.result, Device: row.device })) };
  }

  function test(assessment, fixture, query, timestamp) {
    if (!assessment || typeof assessment !== 'object') throw new TypeError('M04 assessment state is required.');
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const text = String(query || '').trim();
    const result = MnKql.evaluate(text, tables(fixture), { now: fixture.scenario.end });
    assessment.queryText = text;
    assessment.queryResults = result.error ? [] : clone(result.rows || []);
    assessment.lastQueryTest = { query: text, succeeded: !result.error, error: result.error || '', resultCount: assessment.queryResults.length, testedAt: timestamp };
    if (!result.error) assessment.lastSuccessfulQuery = { query: text, resultCount: assessment.queryResults.length, testedAt: timestamp };
    const next = SocM04AssessmentActions.record({ assessment }, 'query_test', timestamp, {
      succeeded: !result.error, query: text, resultCount: assessment.queryResults.length, error: result.error || '',
    });
    Object.assign(assessment, next.assessment);
    return { succeeded: !result.error, error: result.error || '', rows: clone(assessment.queryResults), columns: result.cols || [] };
  }

  function saveQuery(assessment, query, timestamp, name = 'Learner query') {
    if (!assessment.lastSuccessfulQuery || assessment.lastSuccessfulQuery.query !== String(query || '').trim()) throw new Error('Test this exact query successfully before saving it.');
    const title = String(name || '').trim();
    if (!title || title.length > 100) throw new TypeError('Query name must be 1 to 100 characters.');
    const sequence = assessment.nextQuerySequence || 1;
    const record = { id: `M04-Q-${String(sequence).padStart(4, '0')}`, name: title, query: assessment.lastSuccessfulQuery.query, testedAt: assessment.lastSuccessfulQuery.testedAt };
    assessment.savedQueries = [...(assessment.savedQueries || []), record];
    assessment.nextQuerySequence = sequence + 1;
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_change', timestamp, { operation: 'query-save', queryId: record.id });
    Object.assign(assessment, next.assessment);
    return clone(record);
  }

  function convertToDraft(assessment, queryId, timestamp) {
    const query = (assessment.savedQueries || []).find((item) => item.id === queryId);
    if (!query) throw new RangeError('Saved query not found.');
    if (!assessment.lastSuccessfulQuery || assessment.lastSuccessfulQuery.query !== query.query) throw new Error('Test this saved query successfully before converting it.');
    const sequence = assessment.nextRuleSequence || 1;
    const draft = { id: `M04-RULE-${String(sequence).padStart(4, '0')}`, queryId: query.id, name: query.name, description: '', severity: 'Medium', query: query.query, groupingField: 'Account', threshold: 1, windowMinutes: 60, exclusion: { enabled: false, field: 'EventType', operator: '==', value: '', reason: '' }, suppression: { enabled: false, groupField: 'Account', windowMinutes: 10 }, status: 'draft' };
    assessment.rules = [...(assessment.rules || []), draft];
    assessment.ruleDraft = clone(draft);
    assessment.nextRuleSequence = sequence + 1;
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_change', timestamp, { operation: 'query-to-rule-draft', queryId, ruleId: draft.id });
    Object.assign(assessment, next.assessment);
    return clone(draft);
  }

  function updateDraft(assessment, ruleId, fields, timestamp) {
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const draft = (assessment.rules || []).find((item) => item.id === ruleId);
    if (!draft || !assessment.ruleDraft || assessment.ruleDraft.id !== ruleId) throw new RangeError('Converted rule draft not found.');
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new TypeError('Rule fields are required.');
    const name = String(fields.name ?? '').trim();
    const description = String(fields.description ?? '').trim();
    const severity = String(fields.severity ?? '');
    const groupingField = String(fields.groupingField ?? '').trim();
    const threshold = Number(fields.threshold);
    const windowMinutes = Number(fields.windowMinutes);
    if (!name || name.length > 100) throw new TypeError('Rule name must be 1 to 100 characters.');
    if (description.length > 500) throw new TypeError('Description must be 500 characters or fewer.');
    if (!['Informational', 'Low', 'Medium', 'High', 'Critical'].includes(severity)) throw new TypeError('Choose a supported severity.');
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(groupingField)) throw new TypeError('Grouping field must be a valid column name.');
    if (!Number.isSafeInteger(threshold) || threshold < 1 || threshold > 10000) throw new TypeError('Threshold must be a whole number from 1 to 10000.');
    if (!Number.isSafeInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440) throw new TypeError('Lookback window must be a whole number from 1 to 1440 minutes.');
    const updated = { ...draft, name, description, severity, groupingField, threshold, windowMinutes };
    Object.assign(draft, updated);
    assessment.ruleDraft = clone(updated);
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_change', timestamp, {
      operation: 'rule-draft-edit', ruleId, fields: { name, description, severity, groupingField, threshold, windowMinutes },
    });
    Object.assign(assessment, next.assessment);
    return clone(updated);
  }

  function updateSafeguards(assessment, ruleId, fields, timestamp, allowedFields) {
    allowedFields = Array.isArray(allowedFields) ? allowedFields : TELEMETRY_FIELDS;
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const draft = (assessment.rules || []).find((item) => item.id === ruleId);
    if (!draft || !assessment.ruleDraft || assessment.ruleDraft.id !== ruleId) throw new RangeError('Converted rule draft not found.');
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new TypeError('Rule safeguard configuration is required.');
    const exclusion = fields.exclusion || {};
    const suppression = fields.suppression || {};
    const normalizedExclusion = {
      enabled: exclusion.enabled === true || exclusion.enabled === 'true' || exclusion.enabled === 'on',
      field: String(exclusion.field ?? '').trim(), operator: String(exclusion.operator ?? ''),
      value: String(exclusion.value ?? '').trim(), reason: String(exclusion.reason ?? '').trim(),
    };
    const normalizedSuppression = {
      enabled: suppression.enabled === true || suppression.enabled === 'true' || suppression.enabled === 'on',
      groupField: String(suppression.groupField ?? '').trim(), windowMinutes: Number(suppression.windowMinutes),
    };
    if (!allowedFields.includes(normalizedExclusion.field)) throw new TypeError('Exclusion field must be a real telemetry column.');
    if (!EXCLUSION_OPERATORS.includes(normalizedExclusion.operator)) throw new TypeError('Choose a supported exclusion operator.');
    if (normalizedExclusion.value.length > 256 || /[\u0000-\u001f\u007f]/.test(normalizedExclusion.value)) throw new TypeError('Exclusion value must be at most 256 printable characters.');
    if (normalizedExclusion.enabled && !normalizedExclusion.value) throw new TypeError('An enabled exclusion requires a value.');
    if (normalizedExclusion.reason.length > 300 || /[\u0000-\u001f\u007f]/.test(normalizedExclusion.reason)) throw new TypeError('Exclusion reason must be at most 300 printable characters.');
    if (normalizedExclusion.enabled && !normalizedExclusion.reason) throw new TypeError('An enabled exclusion requires a reason.');
    if (!allowedFields.includes(normalizedSuppression.groupField)) throw new TypeError('Suppression group field must be a real telemetry column.');
    if (!Number.isSafeInteger(normalizedSuppression.windowMinutes) || normalizedSuppression.windowMinutes < 1 || normalizedSuppression.windowMinutes > 1440) throw new TypeError('Suppression window must be a whole number from 1 to 1440 minutes.');
    const updated = { ...draft, exclusion: normalizedExclusion, suppression: normalizedSuppression };
    Object.assign(draft, updated);
    assessment.ruleDraft = clone(updated);
    const next = SocM04AssessmentActions.record({ assessment }, 'rule_change', timestamp, {
      operation: 'rule-safeguards-edit', ruleId, fields: { exclusion: normalizedExclusion, suppression: normalizedSuppression },
    });
    Object.assign(assessment, next.assessment);
    return clone(updated);
  }

  function renderRule(draft, telemetryFields = TELEMETRY_FIELDS) {
    if (!draft?.id) return '';
    const exclusion = draft.exclusion || { enabled: false, field: 'EventType', operator: '==', value: '', reason: '' };
    const suppression = draft.suppression || { enabled: false, groupField: 'Account', windowMinutes: 10 };
    const fields = (selected) => telemetryFields.map((field) => `<option value="${field}"${selected === field ? ' selected' : ''}>${field}</option>`).join('');
    const operators = EXCLUSION_OPERATORS.map((operator) => `<option value="${operator}"${exclusion.operator === operator ? ' selected' : ''}>${operator}</option>`).join('');
    const exclusionSummary = exclusion.enabled ? `Exclude ${exclusion.field} ${exclusion.operator} ${exclusion.value} (${exclusion.reason})` : 'No exclusion configured.';
    const suppressionSummary = suppression.enabled ? `Suppression enabled by ${suppression.groupField} for ${suppression.windowMinutes} minutes.` : 'Suppression disabled.';
    const schedule = draft.schedule || { frequencyMinutes: 60, scheduledAt: '' };
    return `<form data-m04-rule-form data-rule-id="${escapeHtml(draft.id)}"><h4>Edit analytics rule</h4><label for="m04-rule-name">Name</label><input id="m04-rule-name" name="name" maxlength="100" required value="${escapeHtml(draft.name)}"><label for="m04-rule-description">Description</label><textarea id="m04-rule-description" name="description" maxlength="500" rows="3">${escapeHtml(draft.description || '')}</textarea><label for="m04-rule-severity">Severity</label><select id="m04-rule-severity" name="severity">${['Informational', 'Low', 'Medium', 'High', 'Critical'].map((value) => `<option${draft.severity === value ? ' selected' : ''}>${value}</option>`).join('')}</select><label for="m04-rule-grouping">Grouping field</label><input id="m04-rule-grouping" name="groupingField" required pattern="[A-Za-z_][A-Za-z0-9_]{0,63}" value="${escapeHtml(draft.groupingField)}"><label for="m04-rule-threshold">Threshold (matches)</label><input id="m04-rule-threshold" name="threshold" type="number" min="1" max="10000" step="1" required value="${escapeHtml(draft.threshold)}"><label for="m04-rule-window">Lookback window (minutes)</label><input id="m04-rule-window" name="windowMinutes" type="number" min="1" max="1440" step="1" required value="${escapeHtml(draft.windowMinutes)}"><button type="button" data-m04-rule-save>Save rule fields</button><fieldset data-m04-rule-safeguards><legend>Exclusions</legend><label><input type="checkbox" name="exclusionEnabled"${exclusion.enabled ? ' checked' : ''}> Enable exclusion</label><label>Field<select name="exclusionField">${fields(exclusion.field)}</select></label><label>Operator<select name="exclusionOperator">${operators}</select></label><label>Value<input name="exclusionValue" maxlength="256" value="${escapeHtml(exclusion.value)}"></label><label>Reason<input name="exclusionReason" maxlength="300" value="${escapeHtml(exclusion.reason)}"></label><legend>Suppression</legend><label><input type="checkbox" name="suppressionEnabled"${suppression.enabled ? ' checked' : ''}> Enable suppression</label><label>Group by<select name="suppressionGroupField">${fields(suppression.groupField)}</select></label><label>Window (minutes)<input name="suppressionWindowMinutes" type="number" min="1" max="1440" step="1" required value="${escapeHtml(suppression.windowMinutes)}"></label><button type="button" data-m04-rule-safeguards-save>Save exclusions and suppression</button></fieldset><section data-m04-scheduling><h5>Rule schedule</h5><label><input type="checkbox" name="ruleEnabled"${draft.enabled ? ' checked' : ''}> Enable rule</label><label>Frequency (minutes)<input name="frequencyMinutes" type="number" min="${MIN_FREQUENCY_MINUTES}" max="${MAX_FREQUENCY_MINUTES}" step="1" value="${escapeHtml(schedule.frequencyMinutes)}"></label><label>Next scheduled time<input name="scheduledAt" type="datetime-local" value="${escapeHtml(schedule.scheduledAt ? schedule.scheduledAt.slice(0, 16) : '')}"></label><button type="button" data-m04-rule-schedule-save>Save schedule</button><button type="button" data-m04-rule-run-now>Run now</button><button type="button" data-m04-rule-run-scheduled${draft.enabled && schedule.scheduledAt ? '' : ' disabled'}>Run next scheduled execution</button></section><section aria-label="Rule preview" data-m04-rule-preview><h5>Rule preview</h5><p><strong>${escapeHtml(draft.name)}</strong> · ${escapeHtml(draft.severity)}</p><p>${escapeHtml(draft.description || 'No description.')}</p><p>Group by ${escapeHtml(draft.groupingField)}; alert at ${escapeHtml(draft.threshold)} matches over ${escapeHtml(draft.windowMinutes)} minutes.</p><p data-m04-exclusion-preview>${escapeHtml(exclusionSummary)}</p><p data-m04-suppression-preview>${escapeHtml(suppressionSummary)}</p><pre>${escapeHtml(draft.query)}</pre></section></form>`;
  }

  // In the Assessment Lab the query is written in the console's Log Search, so
  // the host can omit this workspace's own editor (queryEditor: false).
  function render(assessment, { queryEditor = true, fields = TELEMETRY_FIELDS } = {}) {
    const resultRows = (assessment.queryResults || []).slice(0, 20);
    const resultHtml = resultRows.length ? `<table><tbody>${resultRows.map((row) => `<tr>${Object.values(row).map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p data-m04-query-result>Query has not returned rows.</p>';
    const saved = (assessment.savedQueries || []).map((item) => `<li>${escapeHtml(item.name)} <code>${escapeHtml(item.id)}</code><button type="button" data-m04-convert-query="${escapeHtml(item.id)}">Convert to rule draft</button></li>`).join('');
    const drafts = (assessment.rules || []).map((item) => `<li>${escapeHtml(item.name)} <code>${escapeHtml(item.id)}</code> · ${item.enabled ? 'enabled' : 'disabled'} · ${item.schedule?.scheduledAt ? `every ${escapeHtml(item.schedule.frequencyMinutes)} min, next ${escapeHtml(item.schedule.scheduledAt)}` : 'unscheduled'}</li>`).join('');
    const status = assessment.lastQueryTest ? `<p role="status" data-m04-query-status>${assessment.lastQueryTest.succeeded ? `Test succeeded · ${assessment.lastQueryTest.resultCount} rows` : escapeHtml(assessment.lastQueryTest.error)}</p>` : '<p role="status" data-m04-query-status>Test a query against the assessment telemetry.</p>';
    const actionError = assessment.queryActionError ? `<p role="alert" data-m04-query-action-error>${escapeHtml(assessment.queryActionError)}</p>` : '';
    const executions = (assessment.executions || []).slice().reverse().map((item) => `<li><code>${escapeHtml(item.id)}</code> · ${escapeHtml(item.mode)} · ${escapeHtml(item.status)} · ${escapeHtml(item.requestedAt)}</li>`).join('');
    const editor = queryEditor ? `<form data-m04-query-form><label for="m04-query-editor">KQL query</label><textarea id="m04-query-editor" name="query" rows="7" spellcheck="false">${escapeHtml(assessment.queryText || '')}</textarea><label for="m04-query-name">Saved query name</label><input id="m04-query-name" name="name" maxlength="100" value="${escapeHtml(assessment.queryName || '')}"><div><button type="button" data-m04-query-test>Test query</button><button type="button" data-m04-query-save>Save query</button></div>${status}${actionError}<div class="m04-query-results">${resultHtml}</div></form>` : `<p data-m04-query-status>Write and run your query in <strong>Log Search</strong>, then choose <strong>Save as rule query</strong> under its results.</p>${actionError}`;
    return `<div class="m04-rules-workspace">${editor}<section><h4>Saved queries</h4><ul>${saved || '<li>No saved queries.</li>'}</ul></section><section><h4>Rule drafts</h4><ul>${drafts || '<li>No rule drafts.</li>'}</ul></section><section><h4>Execution history</h4><ul>${executions || '<li>No execution requests.</li>'}</ul></section>${renderRule(assessment.ruleDraft, fields)}</div>`;
  }

  return Object.freeze({ tables, test, saveQuery, convertToDraft, updateDraft, updateSafeguards, configureSchedule, recordExecution, completePendingExecution, selectAlert, reviewAlert, render, renderRule, MIN_FREQUENCY_MINUTES, MAX_FREQUENCY_MINUTES });
})();

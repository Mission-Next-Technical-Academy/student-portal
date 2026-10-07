/* Deterministic, bounded learner action history for the Module 04 assessment. */
const SocM04AssessmentActions = (() => {
  'use strict';

  const MAX_HISTORY = 200;
  const AUTOMATION_SCHEMA_VERSION = 1;
  const AUTOMATION_ACTION_TYPES = Object.freeze(['indicator_enrichment', 'evidence_preservation', 'ticket', 'notification', 'disruptive_request']);
  const AUTOMATION_EXECUTION_STATUSES = Object.freeze(['queued', 'succeeded', 'failed', 'skipped']);
  const MAX_AUTOMATION_HISTORY = 200;
  const TYPES = Object.freeze([
    'ioc_edit',
    'intel_verdict',
    'query_test',
    'rule_change',
    'rule_execution',
    'scheduling',
    'alert_review',
    'automation',
    'case_update',
    'automation_action_recorded',
    'automation_execution_recorded',
  ]);
  const ALLOWED_TYPES = new Set(TYPES);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function record(state, type, timestamp, details, maxHistory) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      throw new TypeError('M04 action history requires a state object.');
    }
    if (!ALLOWED_TYPES.has(type)) throw new TypeError(`Unsupported M04 action type: ${type}`);
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
      throw new TypeError('M04 actions require an explicit valid timestamp.');
    }
    if (!details || typeof details !== 'object' || Array.isArray(details)) {
      throw new TypeError('M04 action details must be an object.');
    }
    const cap = maxHistory === undefined ? MAX_HISTORY : maxHistory;
    if (!Number.isSafeInteger(cap) || cap < 1) throw new RangeError('M04 action history limit must be a positive integer.');

    const next = clone(state);
    const assessment = next.assessment && typeof next.assessment === 'object' && !Array.isArray(next.assessment)
      ? next.assessment : {};
    const history = Array.isArray(assessment.actionHistory) ? assessment.actionHistory.slice() : [];
    const sequence = Number.isSafeInteger(assessment.nextActionSequence) && assessment.nextActionSequence > 0
      ? assessment.nextActionSequence : 1;
    history.push({ id: `m04-action-${String(sequence).padStart(6, '0')}`, sequence, type, timestamp, details: clone(details) });
    assessment.actionHistory = history.slice(-cap);
    assessment.nextActionSequence = sequence + 1;
    next.assessment = assessment;
    return next;
  }

  function appendAutomationAction(state, type, timestamp, details) {
    if (!AUTOMATION_ACTION_TYPES.includes(type)) throw new TypeError(`Unsupported M04 automation action type: ${type}`);
    validateRecord(timestamp, details);
    const next = clone(state);
    const assessment = ensureAssessment(next);
    const sequence = nextSequence(assessment.nextAutomationActionSequence, assessment.automationActions, 'M04-AUTO-');
    const action = { id: `M04-AUTO-${String(sequence).padStart(6, '0')}`, schemaVersion: AUTOMATION_SCHEMA_VERSION, sequence, type, createdAt: timestamp, details: clone(details) };
    assessment.automationActions = bounded(assessment.automationActions, action);
    assessment.nextAutomationActionSequence = sequence + 1;
    const audited = record(next, 'automation_action_recorded', timestamp, { actionId: action.id, actionType: type });
    return { state: audited, action };
  }

  function appendAutomationExecution(state, actionId, status, timestamp, details) {
    if (typeof actionId !== 'string' || !actionId.trim()) throw new TypeError('M04 automation executions require an action ID.');
    if (!AUTOMATION_EXECUTION_STATUSES.includes(status)) throw new TypeError(`Unsupported M04 automation execution status: ${status}`);
    validateRecord(timestamp, details);
    const next = clone(state);
    const assessment = ensureAssessment(next);
    if (!assessment.automationActions.some((item) => item.id === actionId)) throw new TypeError('M04 automation execution must reference a persisted action.');
    const sequence = nextSequence(assessment.nextAutomationExecutionSequence, assessment.automationExecutions, 'M04-AUTO-EXEC-');
    const execution = { id: `M04-AUTO-EXEC-${String(sequence).padStart(6, '0')}`, schemaVersion: AUTOMATION_SCHEMA_VERSION, sequence, actionId, status, recordedAt: timestamp, details: clone(details) };
    assessment.automationExecutions = bounded(assessment.automationExecutions, execution);
    assessment.nextAutomationExecutionSequence = sequence + 1;
    const audited = record(next, 'automation_execution_recorded', timestamp, { actionId, executionId: execution.id, status });
    return { state: audited, execution };
  }

  function validateRecord(timestamp, details) {
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('M04 automation records require an explicit valid timestamp.');
    if (!details || typeof details !== 'object' || Array.isArray(details)) throw new TypeError('M04 automation record details must be an object.');
  }

  function ensureAssessment(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new TypeError('M04 automation history requires a state object.');
    state.assessment = state.assessment && typeof state.assessment === 'object' && !Array.isArray(state.assessment) ? state.assessment : {};
    state.assessment.automationActions = Array.isArray(state.assessment.automationActions) ? state.assessment.automationActions : [];
    state.assessment.automationExecutions = Array.isArray(state.assessment.automationExecutions) ? state.assessment.automationExecutions : [];
    return state.assessment;
  }

  function nextSequence(value, entries, prefix) {
    const last = (Array.isArray(entries) ? entries : []).reduce((max, item) => {
      const idSequence = Number(String(item?.id || '').replace(prefix, '')) || 0;
      return Math.max(max, Number.isSafeInteger(item?.sequence) ? item.sequence : 0, idSequence);
    }, 0);
    return Number.isSafeInteger(value) && value > last ? value : last + 1;
  }

  function bounded(entries, entry) {
    return [...(Array.isArray(entries) ? entries : []), entry].slice(-MAX_AUTOMATION_HISTORY);
  }

  return Object.freeze({ MAX_HISTORY, TYPES, AUTOMATION_SCHEMA_VERSION, AUTOMATION_ACTION_TYPES, AUTOMATION_EXECUTION_STATUSES, MAX_AUTOMATION_HISTORY, record, appendAutomationAction, appendAutomationExecution });
})();

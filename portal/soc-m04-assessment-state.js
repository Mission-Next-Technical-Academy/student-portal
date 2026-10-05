/* Versioned persistence contract for the independent Module 04 assessment. */
const SocM04AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const LAB_ID = 'm04-detection-enrichment-v1';
  const MODULE_KEY = 'soc-04';
  const EMPTY_DEFAULTS = Object.freeze({
    selectedIocIds: [],
    iocStatusById: {},
    ruleDraft: {
      id: '',
      queryId: '',
      name: '',
      description: '',
      severity: 'Medium',
      query: '',
      groupingField: '',
      threshold: 1,
      windowMinutes: 60,
      exclusion: { enabled: false, field: 'EventType', operator: '==', value: '', reason: '' },
      suppression: { enabled: false, groupField: 'Account', windowMinutes: 10 },
      enabled: false,
    },
    queryText: '',
    queryResults: [],
    savedQueries: [],
    rules: [],
    executions: [],
    nextExecutionSequence: 1,
    nextQuerySequence: 1,
    nextRuleSequence: 1,
    alertIds: [],
    alerts: [],
    selectedAlertId: '',
    nextAlertSequence: 1,
    approvedAutomation: [],
    automationActions: [],
    automationExecutions: [],
    automationResults: [],
    automationTickets: [],
    approvalRequests: [],
    nextApprovalRequestSequence: 1,
    nextTicketSequence: 1,
    nextAutomationActionSequence: 1,
    nextAutomationExecutionSequence: 1,
    actionHistory: [],
    nextActionSequence: 1,
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeAssessment(value, fixture) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const assessment = { ...clone(EMPTY_DEFAULTS), ...source };
    assessment.selectedIocIds = Array.isArray(source.selectedIocIds) ? source.selectedIocIds.slice() : [];
    assessment.iocStatusById = source.iocStatusById && typeof source.iocStatusById === 'object' && !Array.isArray(source.iocStatusById)
      ? { ...source.iocStatusById } : {};
    assessment.ruleDraft = { ...clone(EMPTY_DEFAULTS.ruleDraft), ...(source.ruleDraft || {}) };
    assessment.ruleDraft.exclusion = { ...clone(EMPTY_DEFAULTS.ruleDraft.exclusion), ...(source.ruleDraft?.exclusion || {}) };
    assessment.ruleDraft.suppression = { ...clone(EMPTY_DEFAULTS.ruleDraft.suppression), ...(source.ruleDraft?.suppression || {}) };
    assessment.queryText = typeof source.queryText === 'string' ? source.queryText : '';
    assessment.queryResults = Array.isArray(source.queryResults) ? source.queryResults.slice() : [];
    assessment.savedQueries = Array.isArray(source.savedQueries) ? source.savedQueries.map(clone) : [];
    assessment.rules = Array.isArray(source.rules) ? source.rules.map(clone) : [];
    assessment.executions = Array.isArray(source.executions) ? source.executions.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone).slice(-200) : [];
    const executionIds = assessment.executions.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextExecutionSequence = Number.isSafeInteger(source.nextExecutionSequence) && source.nextExecutionSequence > Math.max(0, ...executionIds)
      ? source.nextExecutionSequence : Math.max(0, ...executionIds) + 1;
    const queryIds = assessment.savedQueries.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    const ruleIds = assessment.rules.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextQuerySequence = Number.isSafeInteger(source.nextQuerySequence) && source.nextQuerySequence > Math.max(0, ...queryIds) ? source.nextQuerySequence : Math.max(0, ...queryIds) + 1;
    assessment.nextRuleSequence = Number.isSafeInteger(source.nextRuleSequence) && source.nextRuleSequence > Math.max(0, ...ruleIds) ? source.nextRuleSequence : Math.max(0, ...ruleIds) + 1;
    assessment.alertIds = Array.isArray(source.alertIds) ? source.alertIds.slice() : [];
    assessment.alerts = Array.isArray(source.alerts) ? source.alerts.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone).slice(-500) : [];
    assessment.selectedAlertId = typeof source.selectedAlertId === 'string' ? source.selectedAlertId : '';
    const alertIds = assessment.alerts.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextAlertSequence = Number.isSafeInteger(source.nextAlertSequence) && source.nextAlertSequence > Math.max(0, ...alertIds)
      ? source.nextAlertSequence : Math.max(0, ...alertIds) + 1;
    assessment.approvedAutomation = Array.isArray(source.approvedAutomation) ? source.approvedAutomation.slice() : [];
    assessment.automationActions = (Array.isArray(source.automationActions)
      ? source.automationActions.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    assessment.automationExecutions = (Array.isArray(source.automationExecutions)
      ? source.automationExecutions.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    assessment.automationResults = (Array.isArray(source.automationResults)
      ? source.automationResults.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    assessment.automationTickets = (Array.isArray(source.automationTickets)
      ? source.automationTickets.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    assessment.approvalRequests = (Array.isArray(source.approvalRequests)
      ? source.approvalRequests.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    const ticketIds = assessment.automationTickets.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextTicketSequence = Number.isSafeInteger(source.nextTicketSequence) && source.nextTicketSequence > Math.max(0, ...ticketIds)
      ? source.nextTicketSequence : Math.max(0, ...ticketIds) + 1;
    const approvalIds = assessment.approvalRequests.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextApprovalRequestSequence = Number.isSafeInteger(source.nextApprovalRequestSequence) && source.nextApprovalRequestSequence > Math.max(0, ...approvalIds)
      ? source.nextApprovalRequestSequence : Math.max(0, ...approvalIds) + 1;
    const actionIds = assessment.automationActions.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    const automationExecutionIds = assessment.automationExecutions.map((item) => Number(String(item.id || '').match(/(\d+)$/)?.[1]) || 0);
    assessment.nextAutomationActionSequence = Number.isSafeInteger(source.nextAutomationActionSequence) && source.nextAutomationActionSequence > Math.max(0, ...actionIds)
      ? source.nextAutomationActionSequence : Math.max(0, ...actionIds) + 1;
    assessment.nextAutomationExecutionSequence = Number.isSafeInteger(source.nextAutomationExecutionSequence) && source.nextAutomationExecutionSequence > Math.max(0, ...automationExecutionIds)
      ? source.nextAutomationExecutionSequence : Math.max(0, ...automationExecutionIds) + 1;
    assessment.actionHistory = (Array.isArray(source.actionHistory)
      ? source.actionHistory.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)).map(clone)
      : []).slice(-200);
    const lastSequence = assessment.actionHistory.reduce((max, entry) =>
      Number.isSafeInteger(entry.sequence) && entry.sequence > max ? entry.sequence : max, 0);
    assessment.nextActionSequence = Number.isSafeInteger(source.nextActionSequence) && source.nextActionSequence > lastSequence
      ? source.nextActionSequence : lastSequence + 1;
    assessment.schemaVersion = VERSION;
    assessment.scenarioId = fixture?.scenario?.id || source.scenarioId || '';
    return assessment;
  }

  function normalize(legacyState, fixture) {
    const legacy = legacyState && typeof legacyState === 'object' && !Array.isArray(legacyState) ? legacyState : {};
    const result = { ...legacy };
    result.assessment = normalizeAssessment(legacy.assessment, fixture);
    return result;
  }

  function load(user, defaults, fixture) {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to load M04 assessment state.');
    const current = LabRuntime.loadCaseState(LAB_ID, MODULE_KEY, user, defaults || {});
    const normalized = normalize(current, fixture);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) {
      LabRuntime.saveCaseState(LAB_ID, MODULE_KEY, user, normalized);
    }
    return normalized;
  }

  function save(user, state, fixture) {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to save M04 assessment state.');
    const normalized = normalize(state, fixture);
    return LabRuntime.saveCaseState(LAB_ID, MODULE_KEY, user, normalized);
  }

  function reset(user, defaults, fixture) {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to reset M04 assessment state.');
    const normalized = normalize(LabRuntime.resetCaseState(LAB_ID, MODULE_KEY, user, defaults || {}), fixture);
    return LabRuntime.saveCaseState(LAB_ID, MODULE_KEY, user, normalized);
  }

  return Object.freeze({ VERSION, LAB_ID, MODULE_KEY, normalize, load, save, reset });
})();

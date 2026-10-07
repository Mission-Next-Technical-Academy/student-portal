/* Versioned persistence contract for the independent Module 09 assessment. */
const SocM09AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-09';
  const MAX_ACTION_HISTORY = 500;
  const MAX_ACTION_SEQUENCE = Number.MAX_SAFE_INTEGER - 1;
  const RECOVERY_MONITOR_MS = 30 * 60 * 1000;
  const RESIDUAL_RISK_IDS = ['persistence_present', 'credential_session_active', 'malware_detected'];
  const WORKFLOW_STATUSES = ['open', 'investigating', 'contained', 'resolved', 'closed'];
  const WORKFLOW_SEVERITIES = ['low', 'medium', 'high', 'critical'];
  const ESCALATION_STATUSES = ['none', 'escalated', 'resolved'];
  const APPROVAL_STATUSES = ['not_requested', 'pending', 'approved', 'rejected'];
  const APPROVED_ACTION_TARGETS = {
    disable_identity: 'identity', isolate_device: 'device', isolate_endpoint: 'endpoint', revoke_session: 'session',
    block_ioc: 'ioc', quarantine_file: 'file', remove_inbox_rule: 'inbox_rule', remove_persistence: 'persistence',
    restore_backup: 'device', scan_recovery: 'device', validate_recovery: 'device',
  };
  const ACTION_EFFECTS = {
    disable_identity: ['disabled', 'identity'],
    isolate_device: ['isolated', 'device'],
    revoke_session: ['revoked', 'session'],
    block_ioc: ['blocked', 'ioc'],
    quarantine_file: ['quarantined', 'file'],
    remove_inbox_rule: ['removed', 'inbox_rule'],
    remove_persistence: ['removed', 'persistence'],
    restore_backup: ['restoreStatus', 'device'],
    scan_recovery: ['scanStatus', 'device'],
    validate_recovery: ['validationStatus', 'device'],
  };
  const STATUS_TRANSITIONS = {
    open: ['investigating'],
    investigating: ['contained', 'resolved'],
    contained: ['investigating', 'resolved'],
    resolved: ['investigating', 'closed'],
    closed: [],
  };
  const DEFAULT_TASKS = [
    { id: 'M09-TASK-001', title: 'Preserve and review available evidence', status: 'pending' },
    { id: 'M09-TASK-002', title: 'Validate containment outcome', status: 'pending' },
    { id: 'M09-TASK-003', title: 'Document recovery readiness', status: 'pending' },
  ];
  const EMPTY_DEFAULTS = {
    selectedIncidentId: null,
    selectedEntityId: null,
    reviewedEvidenceIds: [],
    entityStates: {},
    actionHistory: [],
    nextActionSequence: 1,
    incidentWorkflows: {},
    workflowHistory: [],
    nextWorkflowSequence: 1,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Saved state round-trips through Postgres jsonb, which reorders object
  // keys, so effects must be compared field by field, never by JSON text.
  function sameEffects(actual, expected) {
    return Array.isArray(actual) && actual.length === expected.length
      && expected.every((effect, index) => actual[index] && typeof actual[index] === 'object'
        && Object.keys(actual[index]).length === Object.keys(effect).length
        && Object.keys(effect).every((key) => actual[index][key] === effect[key]));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function scenarioOf(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario?.id) throw new Error('M09 assessment fixture scenario is required.');
    if (typeof scenario.stateKey !== 'string' || !scenario.stateKey) {
      throw new Error('M09 assessment fixture stateKey is required.');
    }
    return scenario;
  }

  function actionTypes(fixture) {
    return [...new Set([...(scenarioOf(fixture).actionOutcomeExamples || []).map((item) => item.action),
      ...Object.keys(APPROVED_ACTION_TARGETS), 'select_recovery_point', 'monitor_recovery'])];
  }

  function defaultMemberships(scenario) {
    return [...new Set(scenario.incidentGraph.edges
      .filter((edge) => edge.from === scenario.incidentGraph.incidentId)
      .map((edge) => edge.to))];
  }

  function defaultWorkflow(incidentId) {
    return { assigneeId: null, severity: 'high', status: 'open', tasks: DEFAULT_TASKS.map((task) => ({
      ...clone(task), description: '', authorId: 'system', completionEvidence: null,
    })),
      escalationStatus: 'none', escalationReason: '', approvalStatus: 'not_requested',
      approvalReason: '', approvalActorId: null, approvalTargetId: null, approvalActionType: null };
  }

  function validateWorkflowHistory(history, scenario) {
    if (!Array.isArray(history) || history.length > MAX_ACTION_HISTORY) {
      throw new Error('M09 assessment workflow history is invalid.');
    }
    let previous = 0;
    return history.map((entry) => {
      if (!entry || Object.keys(entry).sort().join(',') !== 'field,id,incidentId,sequence,timestamp,value'
        || entry.incidentId !== scenario.incidentGraph.incidentId
        || !['assigneeId', 'severity', 'status', 'taskStatus', 'escalationStatus', 'escalationReason',
          'approvalStatus', 'approvalReason', 'approvalActorId', 'taskCreated',
          'taskCompletionEvidence', 'approvalTargetId', 'approvalActionType'].includes(entry.field)
        || !Number.isSafeInteger(entry.sequence) || entry.sequence <= previous
        || entry.id !== `${scenario.id}:WORKFLOW-${String(entry.sequence).padStart(6, '0')}`
        || typeof entry.timestamp !== 'string' || !Number.isFinite(Date.parse(entry.timestamp))
        || new Date(entry.timestamp).toISOString() !== entry.timestamp
        || Date.parse(entry.timestamp) < Date.parse(scenario.start)
        || Date.parse(entry.timestamp) > Date.parse(scenario.end)
        || (entry.field === 'assigneeId' && entry.value !== null
          && (typeof entry.value !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(entry.value)))
        || (entry.field === 'severity' && !WORKFLOW_SEVERITIES.includes(entry.value))
        || (entry.field === 'status' && !WORKFLOW_STATUSES.includes(entry.value))
        || (entry.field === 'escalationStatus' && !ESCALATION_STATUSES.includes(entry.value))
        || (entry.field === 'escalationReason' && (typeof entry.value !== 'string' || entry.value.length > 500))
        || (entry.field === 'approvalStatus' && !APPROVAL_STATUSES.includes(entry.value))
        || (entry.field === 'approvalReason' && (typeof entry.value !== 'string' || entry.value.length > 500))
        || (entry.field === 'approvalActorId' && entry.value !== null
          && (typeof entry.value !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(entry.value)))
        || (entry.field === 'approvalTargetId' && typeof entry.value !== 'string')
        || (entry.field === 'approvalActionType' && !Object.hasOwn(APPROVED_ACTION_TARGETS, entry.value))
        || (entry.field === 'taskStatus' && (!entry.value || typeof entry.value !== 'object'
          || typeof entry.value.taskId !== 'string'
          || !/^M09-TASK-[0-9]{3,}$/.test(entry.value.taskId)
          || !['pending', 'in_progress', 'completed'].includes(entry.value.status)))
        || (entry.field === 'taskCreated' && (!entry.value || typeof entry.value !== 'object'
          || !/^M09-TASK-[0-9]{3,}$/.test(entry.value.id)
          || typeof entry.value.title !== 'string' || !entry.value.title.trim()
          || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(entry.value.authorId)))
        || (entry.field === 'taskCompletionEvidence' && (!entry.value || typeof entry.value !== 'object'
          || !/^M09-TASK-[0-9]{3,}$/.test(entry.value.taskId)
          || typeof entry.value.note !== 'string' || !entry.value.note.trim()
          || !Array.isArray(entry.value.evidenceIds)))) {
        throw new Error('M09 assessment workflow history contains an invalid entry.');
      }
      previous = entry.sequence;
      return deepFreeze(clone(entry));
    });
  }

  function validIncidentCollections(memberships, relationships, scenario) {
    const graph = scenario.incidentGraph;
    const nodeIds = new Set([graph.incidentId, ...graph.nodes.map((node) => node.id)]);
    const entityIds = new Set([...nodeIds, ...scenario.entities.map((entity) => entity.id)]);
    const evidenceIds = new Set([...scenario.sourceEvidenceIds, ...scenario.evidence.map((item) => item.id)]);
    if (!Array.isArray(memberships) || memberships.some((id) => typeof id !== 'string'
      || id === graph.incidentId || !entityIds.has(id)) || new Set(memberships).size !== memberships.length) {
      throw new Error('M09 assessment incident membership contains an invalid entity.');
    }
    if (!Array.isArray(relationships) || relationships.some((edge) => !edge || typeof edge !== 'object'
      || typeof edge.id !== 'string' || !edge.id.startsWith('M09-LINK-')
      || !entityIds.has(edge.from) || !entityIds.has(edge.to) || edge.from === edge.to
      || typeof edge.relation !== 'string' || !edge.relation.trim() || !evidenceIds.has(edge.evidenceId))
      || new Set(relationships.map((edge) => edge.id)).size !== relationships.length) {
      throw new Error('M09 assessment incident relationships contain an invalid link.');
    }
  }

  function validateAction(action, fixture, previousSequence, priorActions = []) {
    const scenario = scenarioOf(fixture);
    const expectedKeys = 'details,id,outcome,sequence,timestamp,type';
    const types = actionTypes(fixture);
    const outcomes = ['success', 'failure', 'partial'];
    if (!action || typeof action !== 'object' || Array.isArray(action)
      || Object.keys(action).sort().join(',') !== expectedKeys
      || !Number.isSafeInteger(action.sequence) || action.sequence <= previousSequence
      || action.sequence > MAX_ACTION_SEQUENCE
      || action.id !== `${scenario.id}:ACTION-${String(action.sequence).padStart(6, '0')}`
      || !types.includes(action.type) || !outcomes.includes(action.outcome)
      || typeof action.timestamp !== 'string' || !Number.isFinite(Date.parse(action.timestamp))
      || new Date(action.timestamp).toISOString() !== action.timestamp
      || Date.parse(action.timestamp) < Date.parse(scenario.start)
      || Date.parse(action.timestamp) > Date.parse(scenario.end)
      || !action.details || typeof action.details !== 'object' || Array.isArray(action.details)) {
      throw new Error('M09 assessment action history contains an invalid action.');
    }
    if (Object.hasOwn(APPROVED_ACTION_TARGETS, action.type)) {
      const audit = action.details.approval;
      if (!audit || audit.incidentId !== scenario.incidentGraph.incidentId
        || audit.actionType !== (['restore_backup', 'scan_recovery', 'validate_recovery'].includes(action.type)
          ? 'restore_backup' : action.type) || audit.targetId !== action.details.entityId
        || !validActor(audit.approverId) || typeof audit.reason !== 'string' || !audit.reason.trim()) {
        throw new Error('M09 assessment action history is missing approval audit evidence.');
      }
    }
    if (action.type === 'select_recovery_point') {
      const { incidentId, recoveryPointId, backupId, targetEntityId } = action.details;
      const backup = scenario.backups?.find((item) => item.recoveryPointId === recoveryPointId
        && item.id === backupId && item.targetEntityId === targetEntityId);
      if (action.outcome !== 'success' || incidentId !== scenario.incidentGraph.incidentId
        || !backup?.knownGood || backup.integrity !== 'verified'
        || action.details.integrity !== backup.integrity || action.details.evidenceId !== backup.evidenceId
        || !scenario.evidence.some((item) => item.id === backup.evidenceId)) {
        throw new Error('M09 recovery selection audit is invalid.');
      }
    }
    if (action.type === 'monitor_recovery') {
      const { incidentId, entityId, backupId, recoveryPointId, windowStart, windowEnd, residualRiskIds } = action.details;
      const device = scenario.entities.find((entity) => entity.id === entityId);
      const validation = [...priorActions].reverse().find((entry) => entry.type === 'validate_recovery'
        && entry.details.entityId === entityId && entry.details.backupId === backupId
        && entry.details.recoveryPointId === recoveryPointId);
      const expectedEnd = validation && new Date(Math.min(Date.parse(validation.timestamp) + RECOVERY_MONITOR_MS,
        Date.parse(scenario.end))).toISOString();
      if (!device || device.type !== 'device' || !validation || validation.outcome !== 'success'
        || incidentId !== scenario.incidentGraph.incidentId
        || windowStart !== validation.timestamp || windowEnd !== expectedEnd
        || Date.parse(action.timestamp) < Date.parse(windowStart) || Date.parse(action.timestamp) > Date.parse(windowEnd)
        || !Array.isArray(residualRiskIds) || residualRiskIds.some((id) => !RESIDUAL_RISK_IDS.includes(id))
        || new Set(residualRiskIds).size !== residualRiskIds.length
        || action.outcome !== (residualRiskIds.length ? 'partial' : 'success')
        || action.details.execution?.summary !== (residualRiskIds.length ? 'reopened' : 'monitoring_passed')
        || JSON.stringify(action.details.effects) !== '[]'
        || priorActions.some((entry) => entry.type === 'monitor_recovery' && entry.details.entityId === entityId)) {
        throw new Error('M09 recovery monitoring report or bounded window is invalid.');
      }
    }
    if (['restore_backup', 'scan_recovery', 'validate_recovery'].includes(action.type)) {
      const selected = [...priorActions].reverse().find((entry) => entry.type === 'select_recovery_point'
        && entry.details.targetEntityId === action.details.entityId);
      if (!selected || action.details.backupId !== selected.details.backupId
        || action.details.recoveryPointId !== selected.details.recoveryPointId) {
        throw new Error('M09 recovery action does not match a selected recovery point.');
      }
      const effect = ACTION_EFFECTS[action.type][0];
      const expectedEffects = action.outcome === 'failure' ? [] : [{ entityId: action.details.entityId,
        field: effect, value: action.outcome === 'success' ? true : 'partial' }];
      const expectedSummary = action.outcome === 'success' ? 'completed'
        : action.outcome === 'partial' ? 'partially_completed' : 'no_change';
      if (!sameEffects(action.details.effects, expectedEffects)
        || action.details.execution?.summary !== expectedSummary) {
        throw new Error('M09 recovery action outcome or effect is invalid.');
      }
      const priorRecovery = priorActions.filter((entry) => entry.details.entityId === action.details.entityId
        && entry.details.recoveryPointId === action.details.recoveryPointId);
      const restore = priorRecovery.find((entry) => entry.type === 'restore_backup');
      const scan = priorRecovery.find((entry) => entry.type === 'scan_recovery');
      if ((action.type === 'scan_recovery' && (!restore || restore.outcome === 'failure'))
        || (action.type === 'validate_recovery' && (!scan || scan.outcome !== 'success'))
        || (action.type === 'restore_backup' && restore)
        || (action.type === 'scan_recovery' && scan)
        || (action.type === 'validate_recovery' && priorRecovery.some((entry) => entry.type === 'validate_recovery'))) {
        throw new Error('M09 recovery action order or prerequisite is invalid.');
      }
    }
    return clone(action);
  }

  function validActor(value) {
    return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{1,63}$/.test(value);
  }

  function actorHasRole(value, role) {
    return validActor(value) && (role === 'approver'
      ? /^ir-lead-[a-z0-9-]+$/.test(value)
      : /^ir-(analyst|lead)-[a-z0-9-]+$/.test(value));
  }

  function targetInIncidentScope(targetId, target, memberships) {
    return memberships.includes(targetId)
      || (target?.linkedEntityId && memberships.includes(target.linkedEntityId))
      || (target?.accountId && memberships.includes(target.accountId));
  }

  function normalize(source, fixture) {
    const scenario = scenarioOf(fixture);
    const prior = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    if (Number.isSafeInteger(prior.schemaVersion) && prior.schemaVersion > VERSION) {
      throw new Error('M09 assessment state schema is newer than this application supports.');
    }
    if (typeof prior.scenarioId === 'string' && prior.scenarioId !== scenario.id) {
      throw new Error('M09 assessment state belongs to a different scenario.');
    }
    const entityIds = new Set([scenario.incidentGraph.incidentId,
      ...scenario.incidentGraph.nodes.map((item) => item.id),
      ...scenario.entities.map((item) => item.id)]);
    const evidenceIds = new Set([...scenario.sourceEvidenceIds, ...scenario.evidence.map((item) => item.id)]);
    const entityStates = {};
    for (const entity of scenario.entities) {
      const effects = prior.entityStates?.[entity.id] || {};
      const validEffectFields = Object.entries(ACTION_EFFECTS)
        .filter(([, effect]) => effect[1] === entity.type).map(([, effect]) => effect[0]);
      if (!effects || typeof effects !== 'object' || Array.isArray(effects)
        || Object.keys(effects).some((key) => !validEffectFields.includes(key)
          || ![true, 'partial'].includes(effects[key]))) {
        throw new Error('M09 assessment simulated entity state is invalid.');
      }
      entityStates[entity.id] = clone(effects);
    }
    if (prior.entityStates && (typeof prior.entityStates !== 'object' || Array.isArray(prior.entityStates)
      || Object.keys(prior.entityStates).some((id) => !scenario.entities.some((entity) => entity.id === id)))) {
      throw new Error('M09 assessment simulated entity state contains an unknown entity.');
    }
    const selectedIncidentId = prior.selectedIncidentId === scenario.incidentGraph.incidentId
      ? prior.selectedIncidentId : null;
    const incidentWorkflows = {};
    for (const incident of scenario.incidentQueue) {
      const workflow = { ...defaultWorkflow(incident.id), ...(prior.incidentWorkflows?.[incident.id] || {}) };
      if (!WORKFLOW_SEVERITIES.includes(workflow.severity) || !WORKFLOW_STATUSES.includes(workflow.status)
        || !ESCALATION_STATUSES.includes(workflow.escalationStatus)
        || typeof workflow.escalationReason !== 'string' || workflow.escalationReason.length > 500
        || !APPROVAL_STATUSES.includes(workflow.approvalStatus)
        || typeof workflow.approvalReason !== 'string' || workflow.approvalReason.length > 500
        || (workflow.approvalStatus !== 'not_requested' && !workflow.approvalReason.trim())
        || (['approved', 'rejected'].includes(workflow.approvalStatus)
          && !actorHasRole(workflow.approvalActorId, 'approver'))
        || (workflow.approvalActorId !== null && (typeof workflow.approvalActorId !== 'string'
          || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(workflow.approvalActorId)))
        || (workflow.approvalTargetId !== null && !entityIds.has(workflow.approvalTargetId))
        || (workflow.approvalActionType !== null && !Object.hasOwn(APPROVED_ACTION_TARGETS, workflow.approvalActionType))
        || (workflow.assigneeId !== null && (typeof workflow.assigneeId !== 'string'
          || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(workflow.assigneeId)))
        || !Array.isArray(workflow.tasks) || workflow.tasks.length < DEFAULT_TASKS.length
        || workflow.tasks.some((task, index) => !task || typeof task.id !== 'string'
          || (index < DEFAULT_TASKS.length && (task.id !== DEFAULT_TASKS[index].id
            || task.title !== DEFAULT_TASKS[index].title))
          || !/^M09-TASK-[0-9]{3,}$/.test(task.id) || typeof task.title !== 'string'
          || !task.title.trim() || task.title.length > 160
          || typeof task.description !== 'string' || task.description.length > 1000
          || (index >= DEFAULT_TASKS.length && !/^[a-z0-9][a-z0-9-]{1,63}$/.test(task.authorId))
          || !['pending', 'in_progress', 'completed'].includes(task.status)
          || (task.completionEvidence !== null && (!task.completionEvidence
            || typeof task.completionEvidence.note !== 'string'
            || !task.completionEvidence.note.trim() || task.completionEvidence.note.length > 500
            || !Array.isArray(task.completionEvidence.evidenceIds)
            || task.completionEvidence.evidenceIds.some((id) => typeof id !== 'string'
              || ![...scenario.sourceEvidenceIds, ...scenario.evidence.map((item) => item.id)].includes(id)))))
        || new Set(workflow.tasks.map((task) => task?.id)).size !== workflow.tasks.length) {
        throw new Error('M09 assessment incident workflow is invalid.');
      }
      incidentWorkflows[incident.id] = clone(workflow);
    }
    const incidentMemberships = prior.incidentMemberships === undefined
      ? defaultMemberships(scenario) : clone(prior.incidentMemberships);
    const incidentRelationships = prior.incidentRelationships === undefined
      ? clone(scenario.incidentGraph.edges) : clone(prior.incidentRelationships);
    validIncidentCollections(incidentMemberships, incidentRelationships, scenario);
    for (const workflow of Object.values(incidentWorkflows)) {
      if (workflow.approvalStatus === 'not_requested') continue;
      const target = scenario.entities.find((entity) => entity.id === workflow.approvalTargetId);
      if (!target || target.type !== APPROVED_ACTION_TARGETS[workflow.approvalActionType]
        || !targetInIncidentScope(workflow.approvalTargetId, target, incidentMemberships)) {
        throw new Error('M09 assessment approval target is outside incident scope or has the wrong type.');
      }
    }
    const selectedEntityId = entityIds.has(prior.selectedEntityId) ? prior.selectedEntityId : null;
    const reviewedEvidenceIds = Array.isArray(prior.reviewedEvidenceIds)
      ? [...new Set(prior.reviewedEvidenceIds.filter((id) => evidenceIds.has(id)))].slice(-500) : [];
    const suppliedHistory = Array.isArray(prior.actionHistory) ? prior.actionHistory : [];
    const sourceHistory = suppliedHistory.slice(-MAX_ACTION_HISTORY);
    let previousSequence = 0;
    const actionHistory = sourceHistory.map((action, index) => {
      const validated = validateAction(action, fixture, previousSequence, sourceHistory.slice(0, index));
      previousSequence = validated.sequence;
      return deepFreeze(validated);
    });
    const workflowHistory = validateWorkflowHistory(prior.workflowHistory || [], scenario);
    const nextWorkflowSequence = workflowHistory.length ? workflowHistory[workflowHistory.length - 1].sequence + 1 : 1;
    if (prior.nextWorkflowSequence !== undefined && prior.nextWorkflowSequence !== nextWorkflowSequence) {
      throw new Error('M09 assessment workflow sequence is not monotonic.');
    }
    const minimumSequence = previousSequence + 1;
    if (prior.nextActionSequence !== undefined
      && (!Number.isSafeInteger(prior.nextActionSequence) || prior.nextActionSequence < minimumSequence
        || prior.nextActionSequence > Number.MAX_SAFE_INTEGER)) {
      throw new Error('M09 assessment next action sequence is not monotonic.');
    }
    return {
      selectedIncidentId,
      incidentMemberships,
      incidentRelationships,
      selectedEntityId,
      reviewedEvidenceIds,
      entityStates,
      actionHistory,
      nextActionSequence: Math.max(minimumSequence, prior.nextActionSequence || 1),
      incidentWorkflows,
      workflowHistory,
      nextWorkflowSequence,
      schemaVersion: VERSION,
      scenarioId: scenario.id,
      // LabRuntime only restores a record that keeps its own identity fields.
      ...Object.fromEntries(['labId', 'anonymousStudentId'].filter((key) => typeof prior[key] === 'string').map((key) => [key, prior[key]])),
    };
  }

  function appendActionInternal(state, action, fixture, approvedExecution) {
    if (Object.hasOwn(APPROVED_ACTION_TARGETS, action?.type) && !approvedExecution) {
        throw new Error('M09 protected actions require scoped approval.');
    }
    const next = normalize(state, fixture);
    const sequence = next.nextActionSequence;
    if (sequence > MAX_ACTION_SEQUENCE || next.actionHistory.length >= MAX_ACTION_HISTORY) {
      throw new Error('M09 assessment action history limit reached.');
    }
    const candidate = {
      id: `${scenarioOf(fixture).id}:ACTION-${String(sequence).padStart(6, '0')}`,
      sequence,
      type: action?.type,
      outcome: action?.outcome,
      timestamp: action?.timestamp,
      details: action?.details,
    };
    const record = deepFreeze(validateAction(candidate, fixture, sequence - 1, next.actionHistory));
    next.actionHistory = [...next.actionHistory, record];
    next.nextActionSequence = sequence + 1;
    return next;
  }

  function appendAction(state, action, fixture) {
    return appendActionInternal(state, action, fixture, false);
  }

  function recoveryInventory(state, incidentId, fixture) {
    const scenario = scenarioOf(fixture);
    if (incidentId !== scenario.incidentGraph.incidentId) {
      throw new Error('M09 recovery inventory incident is invalid.');
    }
    const normalized = normalize(state, fixture);
    return (scenario.backups || []).filter((backup) => {
      const device = scenario.entities.find((entity) => entity.id === backup.targetEntityId);
      return device && device.type === 'device'
        && normalized.incidentMemberships.includes(device.linkedEntityId);
    }).map((backup) => ({ ...clone(backup), selectable: backup.knownGood && backup.integrity === 'verified' }));
  }

  function selectRecoveryPoint(state, incidentId, recoveryPointId, timestamp, fixture) {
    const scenario = scenarioOf(fixture);
    const inventory = recoveryInventory(state, incidentId, fixture);
    const backup = inventory.find((item) => item.recoveryPointId === recoveryPointId);
    if (!backup || !backup.selectable) {
      throw new Error('M09 recovery point is unavailable, out of scope, or not integrity-verified.');
    }
    return appendActionInternal(state, { type: 'select_recovery_point', outcome: 'success', timestamp,
      details: { incidentId, recoveryPointId, backupId: backup.id, targetEntityId: backup.targetEntityId,
        evidenceId: backup.evidenceId, integrity: backup.integrity } }, fixture, false);
  }

  function completeRecoveryMonitoring(state, incidentId, entityId, timestamp, residualRiskIds, fixture) {
    const scenario = scenarioOf(fixture);
    if (incidentId !== scenario.incidentGraph.incidentId || !Array.isArray(residualRiskIds)
      || residualRiskIds.some((id) => !RESIDUAL_RISK_IDS.includes(id))
      || new Set(residualRiskIds).size !== residualRiskIds.length) {
      throw new Error('M09 recovery residual-risk checks are invalid.');
    }
    const normalized = normalize(state, fixture);
    const validation = [...normalized.actionHistory].reverse().find((entry) => entry.type === 'validate_recovery'
      && entry.details.entityId === entityId);
    if (!validation || validation.outcome !== 'success') {
      throw new Error('M09 recovery monitoring requires successful validation.');
    }
    const windowStart = validation.timestamp;
    const windowEnd = new Date(Math.min(Date.parse(windowStart) + RECOVERY_MONITOR_MS,
      Date.parse(scenario.end))).toISOString();
    const reopen = residualRiskIds.length > 0;
    const next = appendActionInternal(normalized, { type: 'monitor_recovery', outcome: reopen ? 'partial' : 'success',
      timestamp, details: { incidentId, entityId, backupId: validation.details.backupId,
        recoveryPointId: validation.details.recoveryPointId, windowStart, windowEnd,
        residualRiskIds: [...residualRiskIds], effects: [],
        execution: { summary: reopen ? 'reopened' : 'monitoring_passed' } } }, fixture, false);
    if (reopen) {
      const workflow = next.incidentWorkflows[incidentId];
      if (workflow.status === 'closed') throw new Error('M09 closed incidents cannot be reopened.');
      workflow.status = 'investigating';
      const sequence = next.nextWorkflowSequence;
      next.workflowHistory = [...next.workflowHistory, deepFreeze({
        id: `${scenario.id}:WORKFLOW-${String(sequence).padStart(6, '0')}`,
        sequence, incidentId, field: 'status', value: 'investigating', timestamp,
      })];
      next.nextWorkflowSequence += 1;
    }
    return next;
  }

  function executeApprovedAction(state, incidentId, action, timestamp, fixture) {
    const scenario = scenarioOf(fixture);
    const targetId = action?.details?.entityId;
    const target = scenario.entities.find((entity) => entity.id === targetId);
    const expectedType = APPROVED_ACTION_TARGETS[action?.type];
    if (!expectedType || !scenario.incidentQueue.some((incident) => incident.id === incidentId)) {
      throw new Error('M09 approved action or incident is invalid.');
    }
    const normalized = normalize(state, fixture);
    const workflow = normalized.incidentWorkflows[incidentId];
    const inScope = targetInIncidentScope(targetId, target, normalized.incidentMemberships);
    if (!target || target.type !== expectedType || !inScope) {
      throw new Error('M09 approved action target is outside incident scope or has the wrong type.');
    }
    const approvalActionType = ['restore_backup', 'scan_recovery', 'validate_recovery'].includes(action.type)
      ? 'restore_backup' : action.type;
    if (workflow.approvalStatus !== 'approved' || workflow.approvalTargetId !== targetId
      || workflow.approvalActionType !== approvalActionType || !actorHasRole(workflow.approvalActorId, 'approver')
      || !workflow.approvalReason.trim()) {
      throw new Error('M09 approved action does not match an approved target and action.');
    }
    const details = { ...clone(action.details), entityId: targetId, approval: {
      incidentId, actionType: approvalActionType, targetId, approverId: workflow.approvalActorId,
      reason: workflow.approvalReason,
    } };
    if (['restore_backup', 'scan_recovery', 'validate_recovery'].includes(action.type)) {
      const selected = [...normalized.actionHistory].reverse().find((entry) => entry.type === 'select_recovery_point'
        && entry.details.targetEntityId === targetId);
      if (!selected || (action.details.backupId !== undefined && action.details.backupId !== selected.details.backupId)
        || (action.details.recoveryPointId !== undefined
          && action.details.recoveryPointId !== selected.details.recoveryPointId)) {
        throw new Error('M09 recovery action requires the selected in-scope recovery point.');
      }
      details.backupId = selected.details.backupId;
      details.recoveryPointId = selected.details.recoveryPointId;
    }
    const effect = ACTION_EFFECTS[action.type];
    const actionDetails = { ...details };
    if (action.outcome === 'success' && effect) {
      actionDetails.effects = [{ entityId: targetId, field: effect[0], value: true }];
    } else if (action.outcome === 'partial' && effect) {
      actionDetails.effects = [{ entityId: targetId, field: effect[0], value: 'partial' }];
    } else if (action.outcome === 'failure') {
      actionDetails.effects = [];
    }
    actionDetails.execution = action.outcome === 'success'
      ? { summary: 'completed' }
      : action.outcome === 'partial'
        ? { summary: 'partially_completed' }
        : { summary: 'no_change' };
    const next = appendActionInternal(normalized, { ...action, timestamp, details: actionDetails }, fixture, true);
    if (action.outcome === 'success' && effect) {
      next.entityStates[targetId] = { ...next.entityStates[targetId], [effect[0]]: true };
    } else if (action.outcome === 'partial' && effect) {
      next.entityStates[targetId] = { ...next.entityStates[targetId], [effect[0]]: 'partial' };
    }
    return next;
  }

  function transition(state, changes, fixture) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
      throw new Error('M09 assessment transition must be an object.');
    }
    const allowed = new Set(['selectedIncidentId', 'selectedEntityId', 'reviewedEvidenceIds',
      'incidentMemberships', 'incidentRelationships']);
    if (Object.keys(changes).some((key) => !allowed.has(key))) {
      throw new Error('M09 assessment transition cannot modify action history or state metadata.');
    }
    const scenario = scenarioOf(fixture);
    const entityIds = new Set([scenario.incidentGraph.incidentId,
      ...scenario.incidentGraph.nodes.map((item) => item.id),
      ...scenario.entities.map((item) => item.id)]);
    const evidenceIds = new Set([...scenario.sourceEvidenceIds, ...scenario.evidence.map((item) => item.id)]);
    if (Object.hasOwn(changes, 'selectedIncidentId')
      && changes.selectedIncidentId !== null
      && changes.selectedIncidentId !== scenario.incidentGraph.incidentId) {
      throw new Error('M09 assessment transition references an unknown incident.');
    }
    if (Object.hasOwn(changes, 'selectedEntityId')
      && changes.selectedEntityId !== null && !entityIds.has(changes.selectedEntityId)) {
      throw new Error('M09 assessment transition references an unknown entity.');
    }
    if (Object.hasOwn(changes, 'reviewedEvidenceIds')
      && (!Array.isArray(changes.reviewedEvidenceIds)
        || changes.reviewedEvidenceIds.some((id) => !evidenceIds.has(id)))) {
      throw new Error('M09 assessment transition references unknown evidence.');
    }
    validIncidentCollections(
      changes.incidentMemberships === undefined
        ? normalize(state, fixture).incidentMemberships : changes.incidentMemberships,
      changes.incidentRelationships === undefined
        ? normalize(state, fixture).incidentRelationships : changes.incidentRelationships,
      scenario,
    );
    return normalize({ ...normalize(state, fixture), ...clone(changes) }, fixture);
  }

  function updateIncidentWorkflow(state, incidentId, changes, timestamp, fixture) {
    const scenario = scenarioOf(fixture);
    if (!scenario.incidentQueue.some((incident) => incident.id === incidentId)) {
      throw new Error('M09 assessment incident workflow references an unknown incident.');
    }
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)
      || !Object.keys(changes).length
      || Object.keys(changes).some((key) => !['assigneeId', 'severity', 'status', 'taskId', 'taskStatus',
        'escalationStatus', 'escalationReason', 'approvalStatus', 'approvalReason', 'approvalActorId',
        'approvalTargetId', 'approvalActionType'].includes(key))) {
      throw new Error('M09 assessment incident workflow change is invalid.');
    }
    const next = normalize(state, fixture);
    if (next.workflowHistory.length >= MAX_ACTION_HISTORY) throw new Error('M09 assessment workflow history limit reached.');
    const workflow = next.incidentWorkflows[incidentId];
    const events = [];
    const validText = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
    // Each disruptive action needs its own decision: a response can request
    // approval again after a decision, but an approval cannot be retargeted.
    const retargeted = ['approvalTargetId', 'approvalActionType'].some((field) => Object.hasOwn(changes, field)
      && changes[field] !== workflow[field]);
    if (retargeted && changes.approvalStatus !== 'pending') {
      throw new Error('M09 assessment approval target changes require a new approval request.');
    }
    if (changes.approvalStatus === 'pending' && workflow.approvalStatus !== 'pending') {
      if (!Object.hasOwn(changes, 'approvalActorId')) changes = { ...changes, approvalActorId: null };
    }
    for (const field of ['escalationStatus', 'escalationReason', 'approvalStatus', 'approvalReason', 'approvalActorId',
      'approvalTargetId', 'approvalActionType']) {
      if (!Object.hasOwn(changes, field)) continue;
      const value = changes[field];
      if (field === 'escalationStatus' && (!ESCALATION_STATUSES.includes(value)
        || (value !== workflow.escalationStatus
          && !({ none: ['escalated'], escalated: ['resolved'], resolved: [] }[workflow.escalationStatus].includes(value))))) {
        throw new Error('M09 assessment escalation transition is invalid.');
      }
      if (field === 'escalationReason' && !validText(value)) throw new Error('M09 assessment escalation reason is invalid.');
      if (field === 'approvalStatus' && (!APPROVAL_STATUSES.includes(value)
        || (value !== workflow.approvalStatus
          && !({ not_requested: ['pending'], pending: ['approved', 'rejected'], approved: ['pending'], rejected: ['pending'] }[workflow.approvalStatus].includes(value))))) {
        throw new Error('M09 assessment approval transition is invalid.');
      }
      if (field === 'approvalReason' && !validText(value)) throw new Error('M09 assessment approval reason is invalid.');
      if (field === 'approvalActorId' && value !== null
        && !actorHasRole(value, 'responder')) {
        throw new Error('Enter the approver as an incident-response ID, for example ir-lead-morgan or ir-analyst-lee.');
      }
      if (field === 'approvalTargetId' && value !== null
        && !new Set([...scenario.entities.map((item) => item.id), ...scenario.incidentGraph.nodes.map((item) => item.id)]).has(value)) {
        throw new Error('M09 assessment approval target is invalid.');
      }
      if (field === 'approvalActionType' && value !== null && !Object.hasOwn(APPROVED_ACTION_TARGETS, value)) {
        throw new Error('M09 assessment approval action is invalid.');
      }
      if (workflow[field] !== value) {
        workflow[field] = value;
        events.push({ field, value });
      }
    }
    for (const field of ['assigneeId', 'severity', 'status']) {
      if (!Object.hasOwn(changes, field)) continue;
      const value = changes[field];
      if (field === 'assigneeId' && value !== null
        && (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(value))) {
        throw new Error('M09 assessment assignee is invalid.');
      }
      if (field === 'severity' && !WORKFLOW_SEVERITIES.includes(value)) throw new Error('M09 assessment severity is invalid.');
      if (field === 'status' && !WORKFLOW_STATUSES.includes(value)) throw new Error('M09 assessment status is invalid.');
      if (field === 'status' && value !== workflow.status && !STATUS_TRANSITIONS[workflow.status].includes(value)) {
        throw new Error('M09 assessment status transition is not allowed.');
      }
      if (workflow[field] !== value) {
        workflow[field] = value;
        events.push({ field, value });
      }
    }
    if (Object.hasOwn(changes, 'taskId') || Object.hasOwn(changes, 'taskStatus')) {
      const task = workflow.tasks.find((item) => item.id === changes.taskId);
      if (!task || !['pending', 'in_progress', 'completed'].includes(changes.taskStatus)) {
        throw new Error('M09 assessment task transition is invalid.');
      }
      const taskTransitions = { pending: ['in_progress'], in_progress: ['pending', 'completed'], completed: [] };
      if (task.status !== changes.taskStatus && !taskTransitions[task.status].includes(changes.taskStatus)) {
        throw new Error('M09 assessment task transition is not allowed.');
      }
      if (changes.taskStatus === 'completed' && !task.completionEvidence) {
        throw new Error('M09 assessment task completion requires evidence.');
      }
      if (task.status !== changes.taskStatus) {
        task.status = changes.taskStatus;
        events.push({ field: 'taskStatus', value: { taskId: task.id, status: task.status } });
      }
    }
    if (workflow.escalationStatus !== 'none' && !validText(workflow.escalationReason)) {
      throw new Error('M09 assessment escalation reason is required.');
    }
    if (workflow.approvalStatus === 'pending' && !validText(workflow.approvalReason)) {
      throw new Error('M09 assessment approval reason is required.');
    }
    if (['approved', 'rejected'].includes(workflow.approvalStatus)
      && (!validText(workflow.approvalReason) || !workflow.approvalActorId
        || !workflow.approvalTargetId || !workflow.approvalActionType)) {
      throw new Error('M09 assessment approval decision requires a reason and actor.');
    }
    if (['approved', 'rejected'].includes(workflow.approvalStatus)
      && !actorHasRole(workflow.approvalActorId, 'approver')) {
      throw new Error('M09 assessment approval decision requires an authorized approver.');
    }
    if (workflow.approvalStatus === 'pending' || workflow.approvalStatus === 'approved'
      || workflow.approvalStatus === 'rejected') {
      const target = scenario.entities.find((entity) => entity.id === workflow.approvalTargetId);
      const expectedType = APPROVED_ACTION_TARGETS[workflow.approvalActionType];
      if (!target || target.type !== expectedType
        || !targetInIncidentScope(workflow.approvalTargetId, target, next.incidentMemberships)) {
        throw new Error('M09 assessment approval target is outside incident scope or has the wrong type.');
      }
    }
    if (!events.length) return next;
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))
      || Date.parse(timestamp) < Date.parse(scenario.start) || Date.parse(timestamp) > Date.parse(scenario.end)) {
      throw new Error('M09 assessment workflow timestamp is invalid.');
    }
    for (const event of events) {
      const sequence = next.nextWorkflowSequence++;
      next.workflowHistory.push(deepFreeze({
        id: `${scenario.id}:WORKFLOW-${String(sequence).padStart(6, '0')}`,
        sequence, incidentId, field: event.field, value: clone(event.value), timestamp,
      }));
    }
    return normalize(next, fixture);
  }

  function authorIncidentTask(state, incidentId, input, timestamp, fixture) {
    const scenario = scenarioOf(fixture);
    if (!scenario.incidentQueue.some((incident) => incident.id === incidentId)) {
      throw new Error('M09 assessment incident workflow references an unknown incident.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || !Object.keys(input).every((key) => ['title', 'description', 'authorId'].includes(key))) {
      throw new Error('M09 assessment task authoring input is invalid.');
    }
    const title = input.title;
    const description = input.description ?? '';
    const authorId = input.authorId;
    if (typeof title !== 'string' || !title.trim() || title.length > 160
      || typeof description !== 'string' || description.length > 1000
      || typeof authorId !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(authorId)) {
      throw new Error('M09 assessment task authoring fields are invalid.');
    }
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))
      || Date.parse(timestamp) < Date.parse(scenario.start) || Date.parse(timestamp) > Date.parse(scenario.end)) {
      throw new Error('M09 assessment workflow timestamp is invalid.');
    }
    const next = normalize(state, fixture);
    if (next.workflowHistory.length >= MAX_ACTION_HISTORY) throw new Error('M09 assessment workflow history limit reached.');
    const tasks = next.incidentWorkflows[incidentId].tasks;
    const id = `M09-TASK-${String(Math.max(...tasks.map((task) => Number(task.id.slice('M09-TASK-'.length)))) + 1).padStart(3, '0')}`;
    const task = { id, title: title.trim(), description: description.trim(), authorId, status: 'pending', completionEvidence: null };
    tasks.push(task);
    const sequence = next.nextWorkflowSequence++;
    next.workflowHistory.push(deepFreeze({ id: `${scenario.id}:WORKFLOW-${String(sequence).padStart(6, '0')}`,
      sequence, incidentId, field: 'taskCreated', value: clone(task), timestamp }));
    return normalize(next, fixture);
  }

  function completeIncidentTask(state, incidentId, taskId, evidence, timestamp, fixture) {
    const scenario = scenarioOf(fixture);
    const evidenceIds = new Set([...scenario.sourceEvidenceIds, ...scenario.evidence.map((item) => item.id)]);
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)
      || Object.keys(evidence).some((key) => !['note', 'evidenceIds'].includes(key))
      || typeof evidence.note !== 'string' || !evidence.note.trim() || evidence.note.length > 500
      || !Array.isArray(evidence.evidenceIds) || evidence.evidenceIds.some((id) => !evidenceIds.has(id))) {
      throw new Error('M09 assessment task completion evidence is invalid.');
    }
    const next = normalize(state, fixture);
    const workflow = next.incidentWorkflows[incidentId];
    const task = workflow?.tasks.find((item) => item.id === taskId);
    if (!task || !['pending', 'in_progress'].includes(task.status)) {
      throw new Error('M09 assessment task cannot be completed.');
    }
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))
      || Date.parse(timestamp) < Date.parse(scenario.start) || Date.parse(timestamp) > Date.parse(scenario.end)) {
      throw new Error('M09 assessment workflow timestamp is invalid.');
    }
    if (next.workflowHistory.length + 2 > MAX_ACTION_HISTORY) throw new Error('M09 assessment workflow history limit reached.');
    task.completionEvidence = { note: evidence.note.trim(), evidenceIds: [...new Set(evidence.evidenceIds)] };
    task.status = 'completed';
    for (const event of [
      { field: 'taskCompletionEvidence', value: { taskId, ...clone(task.completionEvidence) } },
      { field: 'taskStatus', value: { taskId, status: 'completed' } },
    ]) {
      const sequence = next.nextWorkflowSequence++;
      next.workflowHistory.push(deepFreeze({ id: `${scenario.id}:WORKFLOW-${String(sequence).padStart(6, '0')}`,
        sequence, incidentId, ...event, timestamp }));
    }
    return normalize(next, fixture);
  }

  function incidentQueue(fixture, state) {
    const scenario = scenarioOf(fixture);
    const normalized = normalize(state, fixture);
    return scenario.incidentQueue.map((incident) => ({
      ...clone(incident),
      selected: normalized.selectedIncidentId === incident.id,
      ...clone(normalized.incidentWorkflows[incident.id]),
      memberCount: incident.id === scenario.incidentGraph.incidentId
        ? normalized.incidentMemberships.length : 0,
    }));
  }

  function incidentDetail(incidentId, state, fixture) {
    const scenario = scenarioOf(fixture);
    const normalized = normalize(state, fixture);
    const incident = scenario.incidentQueue.find((item) => item.id === incidentId);
    if (!incident) throw new Error('M09 assessment incident queue has no matching incident.');
    const workflow = clone(normalized.incidentWorkflows[incidentId]);
    if (incidentId !== scenario.incidentGraph.incidentId) {
      return { incident: clone(incident), ...workflow, tasks: workflow.tasks, members: [], relationships: [], evidence: [], workflowHistory: [] };
    }
    const members = normalized.incidentMemberships
      .map((id) => scenario.entities.find((entity) => entity.id === id)
        || scenario.incidentGraph.nodes.find((node) => node.id === id))
      .filter(Boolean).map(clone);
    const memberIds = new Set([incidentId, ...normalized.incidentMemberships]);
    const relationships = normalized.incidentRelationships
      .filter((edge) => memberIds.has(edge.from) && memberIds.has(edge.to)).map(clone);
    const sourceEvidenceIds = [...new Set([incident.sourceEvidenceId,
      ...relationships.map((edge) => edge.evidenceId)])];
    const evidenceIds = new Set(sourceEvidenceIds);
    const evidence = scenario.evidence.filter((item) => evidenceIds.has(item.id)).map(clone);
    return { incident: clone(incident), ...workflow, members, relationships, sourceEvidenceIds, evidence,
      workflowHistory: normalized.workflowHistory.filter((entry) => entry.incidentId === incidentId).map(clone) };
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M09 assessment state.');
    return LabRuntime;
  }

  function stateKey(fixture) {
    return scenarioOf(fixture).stateKey;
  }

  function load(user, fixture) {
    const key = stateKey(fixture);
    const current = runtime().loadCaseState(key, MODULE_KEY, user, {});
    const normalized = normalize(current, fixture);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) runtime().saveCaseState(key, MODULE_KEY, user, normalized);
    return normalized;
  }

  function save(user, state, fixture) {
    return runtime().saveCaseState(stateKey(fixture), MODULE_KEY, user, normalize(state, fixture));
  }

  function reset(user, fixture) {
    const key = stateKey(fixture);
    runtime().resetCaseState(key, MODULE_KEY, user, {});
    return runtime().saveCaseState(key, MODULE_KEY, user, normalize({}, fixture));
  }

  return Object.freeze({ VERSION, MODULE_KEY, MAX_ACTION_HISTORY, EMPTY_DEFAULTS: deepFreeze(EMPTY_DEFAULTS),
    normalize, transition, updateIncidentWorkflow, authorIncidentTask, completeIncidentTask,
    appendAction, executeApprovedAction, recoveryInventory, selectRecoveryPoint,
    completeRecoveryMonitoring,
    incidentQueue, incidentDetail, load, save, reset });
})();

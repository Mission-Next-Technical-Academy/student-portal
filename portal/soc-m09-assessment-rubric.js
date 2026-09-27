/* Pure response and simulated-effect evidence extraction for Module 09. */
const SocM09AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'triage-and-ownership', label: 'Prioritize and route the confirmed incident' },
    { id: 'evidence-and-scope', label: 'Preserve relevant evidence and keep response scope supported' },
    { id: 'approval-and-containment', label: 'Use incident-scoped, approved containment actions' },
    { id: 'outcome-verification', label: 'Distinguish successful, failed, and partial action effects' },
    { id: 'identity-and-persistence', label: 'Address credential, session, and persistence risks proportionately' },
    { id: 'recovery-readiness', label: 'Select and validate a known-good recovery point in order' },
    { id: 'recovery-monitoring', label: 'Monitor recovery and reopen on residual risk' },
    { id: 'evidence-before-eradication', label: 'Preserve evidence before eradication or restore' },
    { id: 'residual-risk-escalation', label: 'Escalate remaining gaps and residual risk' },
  ].map(Object.freeze));

  const list = (value) => Array.isArray(value) ? value : [];
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value))];

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const truth = fixture?.expectedResponseTruth;
    const assessment = record(state) ? state : {};
    const history = list(assessment.actionHistory).filter(record);
    const validEntities = new Map(list(scenario?.entities).filter(record).map((entity) => [entity.id, entity]));
    const validEvidence = new Set([...list(scenario?.sourceEvidenceIds), ...list(scenario?.evidence).map((item) => item?.id)]);
    const incidentId = scenario?.incidentGraph?.incidentId;
    const criteria = [];
    const add = (id, finding, evidenceIds = [], actionIds = []) => criteria.push({
      id,
      finding: finding === true ? 'observed' : finding === false ? 'incomplete' : finding,
      evidenceIds: unique(evidenceIds).filter((evidenceId) => validEvidence.has(evidenceId)),
      actionIds: unique(actionIds),
    });
    if (!scenario || !truth || !incidentId) {
      RUBRIC.forEach(({ id }) => add(id, 'unknown'));
      return { rubricVersion: 1, criteria };
    }

    const workflow = assessment.incidentWorkflows?.[incidentId];
    const workflowActions = list(assessment.workflowHistory).filter((entry) => record(entry) && entry.incidentId === incidentId);
    const latestWorkflowValue = (field) => [...workflowActions].reverse().find((entry) => entry.field === field)?.value;
    const priority = latestWorkflowValue('severity') ?? workflow?.severity;
    const assignee = latestWorkflowValue('assigneeId') ?? workflow?.assigneeId;
    const triaged = priority === truth.priority && assignee === truth.ownershipRoute;
    add('triage-and-ownership', triaged ? true : workflow || workflowActions.length ? 'incomplete' : 'unknown', [],
      workflowActions.filter((entry) => ['severity', 'assigneeId'].includes(entry.field)).map((entry) => entry.id));

    const reviewedIds = unique(list(assessment.reviewedEvidenceIds)).filter((id) => validEvidence.has(id));
    const impactIds = list(scenario.incidentGraph.edges).filter((edge) => edge.from === incidentId
      && truth.confirmedImpact.includes(edge.to) && reviewedIds.includes(edge.evidenceId)).map((edge) => edge.evidenceId);
    const hasBoundaryEvidence = list(truth.scopeBoundary?.evidenceIds).filter((id) => reviewedIds.includes(id)).length > 0;
    const membership = list(assessment.incidentMembership);
    const incidentRelationships = list(assessment.incidentRelationships);
    const validEntityIds = new Set(validEntities.keys());
    // Relationships are seeded from the incident graph, so only links whose
    // evidence the learner actually reviewed count as learner scope evidence.
    const validLinks = incidentRelationships.filter((edge) => record(edge) && validEntityIds.has(edge.from)
      && validEntityIds.has(edge.to) && validEvidence.has(edge.evidenceId) && reviewedIds.includes(edge.evidenceId));
    const scopeEvidence = unique([...impactIds, ...validLinks.map((edge) => edge.evidenceId),
      ...(hasBoundaryEvidence ? truth.scopeBoundary.evidenceIds.filter((id) => reviewedIds.includes(id)) : [])]);
    add('evidence-and-scope', scopeEvidence.length ? (impactIds.length && hasBoundaryEvidence ? true : 'partial') : 'unknown', scopeEvidence);

    const validActions = history.filter((action) => typeof action.id === 'string' && record(action.details)
      && Number.isSafeInteger(action.sequence) && action.sequence > 0
      && action.id === `${scenario.id}:ACTION-${String(action.sequence).padStart(6, '0')}`
      && ['success', 'failure', 'partial'].includes(action.outcome)
      && Number.isFinite(Date.parse(action.timestamp)) && Date.parse(action.timestamp) >= Date.parse(scenario.start)
      && Date.parse(action.timestamp) <= Date.parse(scenario.end));
    const inScopeActions = validActions.filter((action) => action.details.incidentId === incidentId
      && validEntities.has(action.details.entityId));
    const approvedActions = inScopeActions.filter((action) => record(action.details.approval)
      && action.details.approval.incidentId === incidentId
      && action.details.approval.actionType === action.type
      && action.details.approval.targetId === action.details.entityId
      && typeof action.details.approval.approverId === 'string'
      && action.details.approval.approverId.startsWith('ir-lead-')
      && typeof action.details.approval.reason === 'string' && action.details.approval.reason.trim());
    const containment = approvedActions.filter((action) => ['disable_identity', 'isolate_device', 'isolate_endpoint',
      'revoke_session', 'block_ioc', 'quarantine_file', 'remove_inbox_rule', 'remove_persistence'].includes(action.type));
    add('approval-and-containment', containment.length ? true : inScopeActions.length ? 'incomplete' : 'unknown',
      containment.flatMap((action) => action.details.evidenceIds || []), containment.map((action) => action.id));

    const effectConsistent = (action) => {
      const effects = list(action.details.effects);
      const persisted = assessment.entityStates?.[action.details.entityId];
      if (action.outcome === 'failure') return effects.length === 0;
      return effects.length > 0 && effects.every((effect) => record(effect) && effect.entityId === action.details.entityId
        && persisted?.[effect.field] === effect.value
        && (effect.value === true || effect.value === 'partial'));
    };
    const verifiable = inScopeActions.filter(effectConsistent);
    add('outcome-verification', verifiable.length ? true : 'unknown',
      verifiable.flatMap((action) => action.details.evidenceIds || []), verifiable.map((action) => action.id));

    const identityTypes = new Set(['disable_identity', 'revoke_session', 'remove_persistence']);
    const identityEvidence = list(scenario.evidence);
    const sessionEntityIds = identityEvidence.filter((item) => item.type === 'session_detail'
      && list(item.relatedEvidenceIds).includes(truth.identityConcern?.remoteSessionEvidenceId))
      .flatMap((item) => [item.entityId, ...list(item.relatedEntityIds)]);
    const persistenceEntityIds = list(scenario.entities).filter((entity) => entity.type === 'persistence'
      && identityEvidence.some((item) => item.type === 'persistence_artifact'
        && [item.entityId, ...list(item.relatedEntityIds)].some((id) => id === entity.linkedEntityId || id === entity.id)))
      .map((entity) => entity.id);
    const identityActions = approvedActions.filter((action) => identityTypes.has(action.type)
      && ((action.type === 'disable_identity' && action.details.entityId === truth.identityConcern?.accountId)
        || (action.type === 'revoke_session' && sessionEntityIds.includes(action.details.entityId))
        || (action.type === 'remove_persistence' && persistenceEntityIds.includes(action.details.entityId))));
    add('identity-and-persistence', identityActions.length ? true : 'unknown',
      identityActions.flatMap((action) => action.details.evidenceIds || []), identityActions.map((action) => action.id));

    const recoveryActions = validActions.filter((action) => ['select_recovery_point', 'restore_backup', 'scan_recovery', 'validate_recovery'].includes(action.type));
    const selection = recoveryActions.find((action) => action.type === 'select_recovery_point' && action.outcome === 'success'
      && list(scenario.backups).some((backup) => backup.id === action.details.backupId
        && backup.recoveryPointId === action.details.recoveryPointId && backup.targetEntityId === action.details.targetEntityId
        && backup.knownGood && backup.integrity === 'verified' && backup.evidenceId === action.details.evidenceId));
    const selectedRecovery = selection && recoveryActions.filter((action) => action.sequence > selection.sequence
      && action.details.backupId === selection.details.backupId && action.details.recoveryPointId === selection.details.recoveryPointId);
    const restore = selectedRecovery?.find((action) => action.type === 'restore_backup');
    const scan = selectedRecovery?.find((action) => action.type === 'scan_recovery' && restore && action.sequence > restore.sequence
      && restore.outcome !== 'failure');
    const validation = selectedRecovery?.find((action) => action.type === 'validate_recovery' && scan && action.sequence > scan.sequence
      && scan.outcome === 'success');
    const recovery = [selection, restore, scan, validation].filter(Boolean);
    add('recovery-readiness', validation?.outcome === 'success' ? true : recovery.length ? 'partial' : 'unknown',
      recovery.map((action) => action.details.evidenceId).filter(Boolean), recovery.map((action) => action.id));

    const monitors = validActions.filter((action) => action.type === 'monitor_recovery'
      && action.details.incidentId === incidentId && validEntities.has(action.details.entityId));
    const monitor = monitors.find((action) => {
      const residual = unique(list(action.details.residualRiskIds));
      const hasResidual = residual.length > 0;
      return (hasResidual && action.outcome === 'partial' && action.details.execution?.summary === 'reopened')
        || (!hasResidual && action.outcome === 'success' && action.details.execution?.summary === 'monitoring_passed');
    });
    add('recovery-monitoring', monitor ? true : monitors.length ? 'partial' : 'unknown',
      monitor ? (monitor.details.backupId ? [scenario.backups.find((backup) => backup.id === monitor.details.backupId)?.evidenceId] : []) : [],
      monitor ? [monitor.id] : []);

    // Evidence preservation (the preserve-evidence task) must be completed
    // before anything is removed, quarantined or restored.
    const eradication = validActions.filter((action) => ['remove_persistence', 'quarantine_file', 'remove_inbox_rule', 'restore_backup'].includes(action.type))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
    const preserved = workflowActions.filter((entry) => entry.field === 'taskStatus' && entry.value?.taskId === 'M09-TASK-001' && entry.value?.status === 'completed')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
    add('evidence-before-eradication', eradication && preserved ? (preserved.timestamp < eradication.timestamp ? true : 'incomplete')
      : preserved ? 'partial' : eradication ? 'incomplete' : 'unknown', [], [preserved?.id, eradication?.id]);

    const escalated = ['escalated', 'resolved'].includes(workflow?.escalationStatus) && String(workflow?.escalationReason || '').trim().length >= 20;
    add('residual-risk-escalation', escalated ? true : monitor?.outcome === 'partial' ? 'partial' : 'unknown', [],
      workflowActions.filter((entry) => ['escalationStatus', 'escalationReason'].includes(entry.field)).map((entry) => entry.id));

    return { rubricVersion: 2, criteria };
  }

  return Object.freeze({ RUBRIC, extract });
})();

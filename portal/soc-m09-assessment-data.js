/* Independent Module 09 assessment identity and incident-response truth. */
const SocM09AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const scenario = {
    id: 'M09-ASSESS-2026-09-27',
    stateKey: 'm09-incident-response-assessment-v1',
    fixedAt: '2026-09-27T10:20:00Z',
    start: '2026-09-27T09:55:00Z',
    end: '2026-09-27T10:20:00Z',
    incidentQueue: [
      { id: 'INC-4937', title: 'Operation Cedar Lock', reportedAt: '2026-09-27T10:02:00Z',
        sourceEntityId: 'ws-173', sourceEvidenceId: 'M09-E01', summary: 'Endpoint sensor reports rapid file changes on ws-173.' },
    ],
    incidentGraph: {
      incidentId: 'INC-4937',
      nodes: [
        { id: 'INC-4937', type: 'incident', label: 'Active ransomware response' },
        { id: 'ws-173', type: 'endpoint', label: 'Affected workstation' },
        { id: 'acct-173', type: 'identity', label: 'Related user account' },
        { id: 'fs-02', type: 'service', label: 'File-share service' },
      ],
      edges: [
        { id: 'M09-LINK-001', from: 'INC-4937', to: 'ws-173', relation: 'confirmed_encryption_impact', evidenceId: 'M09-E01' },
        { id: 'M09-LINK-002', from: 'INC-4937', to: 'acct-173', relation: 'suspicious_remote_session', evidenceId: 'M09-E06' },
        { id: 'M09-LINK-003', from: 'INC-4937', to: 'fs-02', relation: 'service_disruption_observed', evidenceId: 'M09-E08' },
        { id: 'M09-LINK-004', from: 'acct-173', to: 'ws-173', relation: 'registered_workstation', evidenceId: 'M09-E05' },
      ],
    },
    entities: [
      { id: 'ws-173', type: 'endpoint', hostname: 'WS-173', ownerAccountId: 'acct-173', deviceId: 'DEV-173', status: 'managed' },
      { id: 'acct-173', type: 'identity', displayName: 'User 173', registeredDeviceId: 'DEV-173', status: 'active' },
      { id: 'fs-02', type: 'file_service', hostname: 'FS-02', deviceId: 'DEV-FS-02', status: 'managed' },
      { id: 'DEV-173', type: 'device', hostname: 'WS-173', linkedEntityId: 'ws-173' },
      { id: 'DEV-FS-02', type: 'device', hostname: 'FS-02', linkedEntityId: 'fs-02' },
      { id: 'DEV-UNKNOWN-173', type: 'device', hostname: 'Unmanaged client', linkedEntityId: null },
      { id: 'session-173-REMOTE', type: 'session', accountId: 'acct-173', deviceId: 'DEV-UNKNOWN-173' },
      { id: 'backup-ws-173', type: 'backup_set', deviceId: 'DEV-173' },
      { id: 'backup-fs-02', type: 'backup_set', deviceId: 'DEV-FS-02' },
      { id: 'ioc-worker-sha256', type: 'ioc', linkedEntityId: 'ws-173', value: 'sha256:7f3a2c1e' },
      { id: 'file-worker-173', type: 'file', linkedEntityId: 'ws-173', path: 'C:\\ProgramData\\Cache\\worker.bin' },
      { id: 'rule-forward-173', type: 'inbox_rule', linkedEntityId: 'acct-173', name: 'Invoice review' },
      { id: 'persist-runkey-173', type: 'persistence', linkedEntityId: 'ws-173', name: 'UpdaterCache' },
    ],
    backups: [
      { id: 'backup-ws-173', targetEntityId: 'DEV-173', recoveryPointId: 'RP-WS-173-0918',
        capturedAt: '2026-09-27T09:18:00Z', integrity: 'verified', knownGood: true,
        evidenceId: 'M09-E15', scope: 'device' },
      { id: 'backup-ws-173', targetEntityId: 'DEV-173', recoveryPointId: 'RP-WS-173-0948',
        capturedAt: '2026-09-27T09:48:00Z', integrity: 'unverified', knownGood: false,
        evidenceId: 'M09-E15', scope: 'device' },
      { id: 'backup-fs-02', targetEntityId: 'DEV-FS-02', recoveryPointId: 'RP-FS-02-0900',
        capturedAt: '2026-09-27T09:00:00Z', integrity: 'unverified', knownGood: false,
        evidenceId: 'M09-E16', scope: 'device' },
    ],
    evidence: [
      { id: 'M09-E11', type: 'device_inventory', time: '2026-09-27T09:57:00Z', entityId: 'ws-173', relatedEntityIds: ['DEV-173', 'acct-173'], relatedEvidenceIds: ['M09-E05'], summary: 'Managed endpoint inventory links ws-173 to acct-173.' },
      { id: 'M09-E12', type: 'persistence_artifact', time: '2026-09-27T10:07:00Z', entityId: 'ws-173', relatedEntityIds: ['DEV-173'], relatedEvidenceIds: ['M09-E01', 'M09-E02'], summary: 'A startup-entry artifact references the same unsigned worker path; persistence execution is not established.' },
      { id: 'M09-E13', type: 'credential_state', time: '2026-09-27T10:08:00Z', entityId: 'acct-173', relatedEntityIds: ['session-173-REMOTE'], relatedEvidenceIds: ['M09-E06'], summary: 'Credential-risk review is pending; the remote session remains the linked identity evidence.' },
      { id: 'M09-E14', type: 'session_detail', time: '2026-09-27T10:05:00Z', entityId: 'session-173-REMOTE', relatedEntityIds: ['acct-173', 'DEV-UNKNOWN-173'], relatedEvidenceIds: ['M09-E05', 'M09-E06', 'M09-E07'], summary: 'Unfamiliar client session for acct-173; client device is not in the managed inventory.' },
      { id: 'M09-E15', type: 'backup_state', time: '2026-09-27T10:13:00Z', entityId: 'backup-ws-173', relatedEntityIds: ['DEV-173', 'ws-173'], relatedEvidenceIds: ['M09-E02', 'M09-E04'], summary: 'Workstation backup catalog lists a pre-incident recovery point; restore validation remains outstanding.' },
      { id: 'M09-E16', type: 'backup_state', time: '2026-09-27T10:14:00Z', entityId: 'backup-fs-02', relatedEntityIds: ['DEV-FS-02', 'fs-02'], relatedEvidenceIds: ['M09-E08'], summary: 'File-service backup catalog is available for review; consistency and restore readiness are not yet verified.' },
    ],
    actionOutcomeExamples: [
      { id: 'M09-AO-01', action: 'isolate_endpoint', outcome: 'success', time: '2026-09-27T10:10:00Z', entityId: 'ws-173', evidenceIds: ['M09-E01'], signalClass: 'incident', summary: 'Endpoint isolation was acknowledged; eradication and recovery are not implied.' },
      { id: 'M09-AO-02', action: 'disable_identity', outcome: 'failure', time: '2026-09-27T10:11:00Z', entityId: 'acct-173', evidenceIds: ['M09-E06'], signalClass: 'incident', summary: 'Identity action was rejected because required approval was not recorded.' },
      { id: 'M09-AO-03', action: 'isolate_service', outcome: 'partial', time: '2026-09-27T10:12:00Z', entityId: 'fs-02', evidenceIds: ['M09-E08'], signalClass: 'incident', summary: 'One service path was restricted; impact and remaining access still require validation.' },
      { id: 'M09-AO-04', action: 'review_session', outcome: 'success', time: '2026-09-27T10:15:00Z', entityId: 'session-173-REMOTE', evidenceIds: ['M09-E05'], signalClass: 'benign', summary: 'A familiar scheduled service session was reviewed and confirmed expected.' },
      { id: 'M09-AO-05', action: 'scan_endpoint', outcome: 'partial', time: '2026-09-27T10:16:00Z', entityId: 'DEV-173', evidenceIds: ['M09-E03'], signalClass: 'noisy', summary: 'A scan generated duplicate low-confidence detections that require corroboration.' },
    ],
    sourceEvidenceIds: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05', 'M09-E06', 'M09-E07', 'M09-E08', 'M09-E09', 'M09-E10'],
  };

  const expectedResponseTruth = {
    incidentId: 'INC-4937',
    priority: 'critical',
    ownershipRoute: 'ir-lead-owners',
    confirmedImpact: ['ws-173'],
    identityConcern: { accountId: 'acct-173', remoteSessionEvidenceId: 'M09-E06', ownerDenialEvidenceId: 'M09-E07' },
    observedServiceImpact: ['fs-02'],
    scopeBoundary: {
      broaderCompromise: 'not-established',
      exfiltration: 'not-established',
      evidenceIds: ['M09-E09', 'M09-E10'],
    },
    responsePrinciples: [
      'Preserve evidence before eradication.',
      'Use proportionate containment for confirmed affected entities and obtain required approval.',
      'Verify action outcomes; isolation alone does not establish eradication or recovery.',
      'Do not claim enterprise-wide compromise or that the wider environment is clean.',
    ],
  };

  function validateScenario(candidate) {
    if (!candidate || !Array.isArray(candidate.incidentQueue) || !candidate.incidentQueue.length
      || !Array.isArray(candidate.entities) || !Array.isArray(candidate.evidence)
      || !candidate.incidentGraph || !Array.isArray(candidate.incidentGraph.nodes)
      || !Array.isArray(candidate.incidentGraph.edges) || !Array.isArray(candidate.sourceEvidenceIds)) return false;
    const unique = (values) => values.every((value, index) => typeof value === 'string' && value.length > 0 && values.indexOf(value) === index);
    const entityIds = candidate.entities.map((item) => item.id);
    const evidenceIds = candidate.evidence.map((item) => item.id);
    const actionOutcomeIds = (candidate.actionOutcomeExamples || []).map((item) => item.id);
    const nodeIds = candidate.incidentGraph.nodes.map((item) => item.id);
    const allEvidenceIds = new Set([...candidate.sourceEvidenceIds, ...evidenceIds]);
    const allEntityIds = new Set([...entityIds, ...nodeIds]);
    if (!Array.isArray(candidate.actionOutcomeExamples) || !unique(actionOutcomeIds)
      || !unique(entityIds) || !unique(evidenceIds) || !unique(nodeIds) || !unique(candidate.sourceEvidenceIds)
      || candidate.sourceEvidenceIds.some((id) => evidenceIds.includes(id))) return false;
    if (!candidate.incidentQueue.every((item) => item && typeof item === 'object' && !Array.isArray(item))
      || !unique(candidate.incidentQueue.map((item) => item.id))
      || !candidate.incidentQueue.every((item) => item.id && item.title && item.summary
        && Number.isFinite(Date.parse(item.reportedAt))
        && Date.parse(item.reportedAt) >= Date.parse(candidate.start)
        && Date.parse(item.reportedAt) <= Date.parse(candidate.end)
        && allEntityIds.has(item.sourceEntityId) && allEvidenceIds.has(item.sourceEvidenceId))
      || candidate.incidentQueue.some((item) => ['status', 'severity', 'assignee', 'tasks']
        .some((key) => Object.hasOwn(item, key)))
      || candidate.incidentQueue.some((item) => !nodeIds.includes(item.id))
      || !candidate.incidentQueue.some((item) => item.id === candidate.incidentGraph.incidentId)) return false;
    if (!candidate.entities.every((item) => item.type && (!item.linkedEntityId || allEntityIds.has(item.linkedEntityId))
      && (!item.ownerAccountId || allEntityIds.has(item.ownerAccountId))
      && (!item.registeredDeviceId || allEntityIds.has(item.registeredDeviceId))
      && (!item.deviceId || allEntityIds.has(item.deviceId)))) return false;
    if (!candidate.evidence.every((item) => allEvidenceIds.has(item.id) && item.type
      && Number.isFinite(Date.parse(item.time)) && Date.parse(item.time) >= Date.parse(candidate.start)
      && Date.parse(item.time) <= Date.parse(candidate.end) && allEntityIds.has(item.entityId)
      && Array.isArray(item.relatedEntityIds) && item.relatedEntityIds.every((id) => allEntityIds.has(id))
      && Array.isArray(item.relatedEvidenceIds) && item.relatedEvidenceIds.every((id) => allEvidenceIds.has(id)))) return false;
    if (!Array.isArray(candidate.backups) || !candidate.backups.every((item) => item
      && allEntityIds.has(item.id) && allEntityIds.has(item.targetEntityId)
      && typeof item.recoveryPointId === 'string' && item.recoveryPointId
      && ['verified', 'unverified', 'failed'].includes(item.integrity)
      && typeof item.knownGood === 'boolean' && item.knownGood === (item.integrity === 'verified')
      && Number.isFinite(Date.parse(item.capturedAt))
      && Date.parse(item.capturedAt) >= Date.parse(candidate.start) - 24 * 60 * 60 * 1000
      && Date.parse(item.capturedAt) <= Date.parse(candidate.end)
      && allEvidenceIds.has(item.evidenceId) && item.scope === 'device')
      || new Set(candidate.backups.map((item) => item.recoveryPointId)).size !== candidate.backups.length) return false;
    if (!candidate.actionOutcomeExamples.every((item) => item.action && ['success', 'failure', 'partial'].includes(item.outcome)
      && ['incident', 'benign', 'noisy'].includes(item.signalClass)
      && Number.isFinite(Date.parse(item.time)) && Date.parse(item.time) >= Date.parse(candidate.start)
      && Date.parse(item.time) <= Date.parse(candidate.end) && allEntityIds.has(item.entityId)
      && Array.isArray(item.evidenceIds) && item.evidenceIds.length > 0
      && item.evidenceIds.every((id) => allEvidenceIds.has(id)))) return false;
    return candidate.incidentGraph.edges.every((edge) => allEntityIds.has(edge.from) && allEntityIds.has(edge.to)
      && allEvidenceIds.has(edge.evidenceId));
  }

  return freeze({ schemaVersion: 1, scenario, expectedResponseTruth, validateScenario });
})();

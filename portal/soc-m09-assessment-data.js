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
      { id: 'ws-173', type: 'endpoint', hostname: 'ws-173', ownerAccountId: 'acct-173', deviceId: 'DEV-173', status: 'managed' },
      { id: 'acct-173', type: 'identity', displayName: 'User 173', registeredDeviceId: 'DEV-173', status: 'active' },
      { id: 'fs-02', type: 'file_service', hostname: 'fs-02', deviceId: 'DEV-FS-02', status: 'managed' },
      { id: 'DEV-173', type: 'device', hostname: 'ws-173', linkedEntityId: 'ws-173' },
      { id: 'DEV-FS-02', type: 'device', hostname: 'fs-02', linkedEntityId: 'fs-02' },
      { id: 'DEV-UNKNOWN-173', type: 'device', hostname: 'unmanaged-173', deviceClass: 'Unmanaged client', linkedEntityId: null },
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
    // Response-lifecycle and adjacent telemetry for the SIEM console only (Sprint 4). These rows are not part of the
    // evidence-selection list (M09-E##) and are never answer labels. `Phase` marks before/after containment; containment
    // rows never carry a recovery claim, and the RecoveryChecks table holds the explicit recovery-validation signals.
    // Native vs normalized: each table keeps its source-native Result (blocked_by_isolation, not_run, partial ...);
    // normalization (Result -> Allowed/Blocked/Delayed/Unknown) is documented in the console sourceMappings, not rewritten.
    // Entity identity (docs/telemetry/SOC_TELEMETRY_SCHEMA.md): Host = DeviceId = lower-case hostname; the inventory id
    // (DEV-*) is kept as AssetId and stays the entity id that response actions target. The unmanaged client is host
    // `unmanaged-173` (AssetId DEV-UNKNOWN-173). Host-less rows (identity actions, credential checks) carry no Host key.
    // Account is never blank: OS/service-initiated rows use `system`, analyst-run checks and response records `soc-analyst`.
    telemetry: [
      { id: 'M09-T-001', table: 'DeviceEvents', time: '2026-09-27T09:56:10Z', classification: 'incident_context', purpose: 'before/after: baseline change rate before the impact window', fields: { EventType: 'file_change_rate', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: '2 files/min in the user profile (normal editing) before the impact window', Phase: 'before' } },
      { id: 'M09-T-002', table: 'DeviceEvents', time: '2026-09-27T10:07:05Z', classification: 'incident_context', purpose: 'before/after: sensor still reporting after isolation', fields: { EventType: 'sensor_heartbeat', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: 'Sensor heartbeat received over the isolation channel; host network isolated; local processes still running', Phase: 'after_containment' } },
      { id: 'M09-T-003', table: 'DeviceEvents', time: '2026-09-27T10:08:30Z', classification: 'incident_context', purpose: 'before/after: activity continues locally after isolation', fields: { EventType: 'file_change_rate', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: '29 files/min in the user profile after isolation; the unsigned process is still running locally', Phase: 'after_containment' } },
      { id: 'M09-T-004', table: 'DeviceEvents', time: '2026-09-27T10:13:20Z', classification: 'incident_context', purpose: 'before/after: rate falling but not stopped', fields: { EventType: 'file_change_rate', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: '12 files/min; process still listed as running; no termination confirmed by the sensor', Phase: 'after_containment' } },
      { id: 'M09-T-005', table: 'DeviceEvents', time: '2026-09-27T10:19:00Z', classification: 'incident_context', purpose: 'before/after: activity quiet, persistence unresolved', fields: { EventType: 'file_change_rate', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: '0 files/min in the last 60 s; process still present in the process list; startup entry from the earlier persistence artifact remains', Phase: 'after_containment' } },
      { id: 'M09-T-006', table: 'DeviceEvents', time: '2026-09-27T10:15:40Z', classification: 'incident_context', purpose: 'evidence-quality: isolation channel health', fields: { EventType: 'sensor_heartbeat', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'observed', Detail: 'Sensor heartbeat received over the isolation channel; no policy change since isolation', Phase: 'after_containment' } },
      { id: 'M09-T-007', table: 'DeviceEvents', time: '2026-09-27T09:58:20Z', classification: 'benign_background', purpose: 'background: scheduled patching on an unrelated workstation', fields: { EventType: 'patch_install', Account: 'acct-045', Host: 'ws-054', DeviceId: 'ws-054', AssetId: 'DEV-054', Result: 'success', Detail: 'Monthly patch cycle installed on schedule; reboot pending' } },
      { id: 'M09-T-008', table: 'DeviceEvents', time: '2026-09-27T10:03:10Z', classification: 'benign_background', purpose: 'background: scheduled quick scan, noisy', fields: { EventType: 'av_scan', Account: 'acct-220', Host: 'ws-311', DeviceId: 'ws-311', AssetId: 'DEV-311', Result: 'success', Detail: 'Scheduled quick scan completed: 0 detections' } },
      { id: 'M09-T-009', table: 'DeviceEvents', time: '2026-09-27T10:07:30Z', classification: 'benign_background', purpose: 'background: print spooler restart', fields: { EventType: 'service_restart', Account: 'system', Host: 'print-08', DeviceId: 'print-08', AssetId: 'DEV-PRINT-08', Result: 'success', Detail: 'Print spooler restarted after a queue stall; no user impact' } },
      { id: 'M09-T-010', table: 'DeviceEvents', time: '2026-09-27T10:12:50Z', classification: 'benign_background', purpose: 'alternate-explanation: bulk file changes from an approved sync client look like encryption until correlated', fields: { EventType: 'file_change_rate', Account: 'acct-045', Host: 'ws-054', DeviceId: 'ws-054', AssetId: 'DEV-054', Result: 'observed', Detail: 'Approved sync client re-indexed 112 files in 80 s; file extensions unchanged; process signed and on the approved list', signalClass: 'noisy' } },
      { id: 'M09-T-011', table: 'DeviceEvents', time: '2026-09-27T10:17:00Z', classification: 'benign_background', purpose: 'background: database host healthy', fields: { EventType: 'service_status', Account: 'system', Host: 'db-02', DeviceId: 'db-02', AssetId: 'DEV-DB-02', Result: 'success', Detail: 'Database service healthy; no configuration change' } },
      { id: 'M09-T-012', table: 'DeviceNetworkEvents', time: '2026-09-27T09:57:00Z', classification: 'incident_context', purpose: 'before/after: ordinary share access before the impact window', fields: { EventType: 'network_connection', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'allowed', Detail: 'TCP/445 to fs-02 (192.0.2.52): ordinary read-sized session, allowed', SourceIp: '192.0.2.173', DestinationIp: '192.0.2.52', DestinationPort: 445, Phase: 'before' } },
      { id: 'M09-T-013', table: 'DeviceNetworkEvents', time: '2026-09-27T10:06:20Z', classification: 'incident_context', purpose: 'before/after: isolation blocks share access', fields: { EventType: 'network_connection', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'blocked_by_isolation', Detail: 'TCP/445 to fs-02 (192.0.2.52) blocked by the isolation policy', SourceIp: '192.0.2.173', DestinationIp: '192.0.2.52', DestinationPort: 445, Phase: 'after_containment' } },
      { id: 'M09-T-014', table: 'DeviceNetworkEvents', time: '2026-09-27T10:06:21Z', classification: 'incident_context', purpose: 'before/after: isolation blocks general egress', fields: { EventType: 'network_connection', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'blocked_by_isolation', Detail: 'TCP/443 to the software update service blocked by the isolation policy', SourceIp: '192.0.2.173', DestinationIp: '198.51.100.52', DestinationPort: 443, Phase: 'after_containment' } },
      { id: 'M09-T-015', table: 'DeviceNetworkEvents', time: '2026-09-27T10:09:05Z', classification: 'incident_context', purpose: 'evidence-quality: management channel is the only allowed path', fields: { EventType: 'network_connection', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'allowed_management_channel', Detail: 'TCP/443 to the endpoint-management service allowed (isolation exception for the sensor)', SourceIp: '192.0.2.173', DestinationIp: '198.51.100.60', DestinationPort: 443, Phase: 'after_containment' } },
      { id: 'M09-T-016', table: 'DeviceNetworkEvents', time: '2026-09-27T10:12:10Z', classification: 'incident_context', purpose: 'before/after: application retry also blocked', fields: { EventType: 'network_connection', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'blocked_by_isolation', Detail: 'TCP/445 to fs-02 (192.0.2.52) retried by a user application and blocked', SourceIp: '192.0.2.173', DestinationIp: '192.0.2.52', DestinationPort: 445, Phase: 'after_containment' } },
      { id: 'M09-T-017', table: 'FileServiceEvents', time: '2026-09-27T09:55:30Z', classification: 'benign_background', purpose: 'background: normal share sessions', fields: { EventType: 'smb_session', Account: 'acct-045', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'success', Detail: 'Share session opened from ws-054; read activity within normal range' } },
      { id: 'M09-T-018', table: 'FileServiceEvents', time: '2026-09-27T09:59:00Z', classification: 'benign_background', purpose: 'background: normal share sessions', fields: { EventType: 'smb_session', Account: 'acct-220', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'success', Detail: 'Share session opened from ws-311; read activity within normal range' } },
      { id: 'M09-T-019', table: 'FileServiceEvents', time: '2026-09-27T10:00:00Z', classification: 'benign_background', purpose: 'alternate-explanation: scheduled backup job overlaps the window', fields: { EventType: 'backup_agent_job', Account: 'svc-backup', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'started', Detail: 'Scheduled incremental backup job started by the signed backup agent' } },
      { id: 'M09-T-020', table: 'FileServiceEvents', time: '2026-09-27T10:08:20Z', classification: 'benign_background', purpose: 'alternate-explanation: backup job finishes before the outage', fields: { EventType: 'backup_agent_job', Account: 'svc-backup', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'completed', Detail: 'Scheduled incremental backup job completed; snapshot released' } },
      { id: 'M09-T-021', table: 'FileServiceEvents', time: '2026-09-27T10:10:40Z', classification: 'incident_context', purpose: 'before/after: degradation begins after the backup job ended', fields: { EventType: 'smb_latency', Account: 'system', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'observed', Detail: 'Average share latency 4x baseline; cause not recorded by the service', Phase: 'during_incident' } },
      { id: 'M09-T-022', table: 'FileServiceEvents', time: '2026-09-27T10:12:00Z', classification: 'incident_context', purpose: 'before/after: share becomes unavailable', fields: { EventType: 'share_unavailable', Account: 'system', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'observed', Detail: 'Share finance$ unavailable; other shares still available; no file-level change recorded on fs-02', Phase: 'during_incident' } },
      { id: 'M09-T-023', table: 'FileServiceEvents', time: '2026-09-27T10:16:30Z', classification: 'benign_background', purpose: 'scope-check: other users still served', fields: { EventType: 'smb_session', Account: 'acct-338', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'success', Detail: 'Share session opened from another managed workstation; non-affected share responds normally' } },
      { id: 'M09-T-024', table: 'FileServiceEvents', time: '2026-09-27T10:17:50Z', classification: 'incident_context', purpose: 'before/after: partial restriction did not restore the share', fields: { EventType: 'share_availability_check', Account: 'system', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'still_unavailable', Detail: 'Share finance$ still unavailable after one access path was restricted; two paths remain open', Phase: 'after_containment' } },
      { id: 'M09-T-025', table: 'FileServiceEvents', time: '2026-09-27T10:19:00Z', classification: 'incident_context', purpose: 'evidence-quality: coverage-limited negative scan', fields: { EventType: 'av_scan', Account: 'system', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'no_detections', Detail: 'On-access scan covered 18% of share paths: 0 detections; a partial scan does not show the share is clean', CoverageStatus: 'partial' } },
      { id: 'M09-T-026', table: 'IdentityEvents', time: '2026-09-27T09:56:40Z', classification: 'benign_background', purpose: 'background: ordinary sign-in on a managed device', fields: { EventType: 'interactive_sign_in', Account: 'acct-045', Host: 'ws-054', DeviceId: 'ws-054', AssetId: 'DEV-054', Result: 'success', Detail: 'Interactive sign-in from a registered workstation; MFA satisfied' } },
      { id: 'M09-T-027', table: 'IdentityEvents', time: '2026-09-27T10:00:20Z', classification: 'benign_background', purpose: 'background: scheduled service sign-in', fields: { EventType: 'service_sign_in', Account: 'svc-backup', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'success', Detail: 'Backup service sign-in to fs-02 at the scheduled time' } },
      { id: 'M09-T-028', table: 'IdentityEvents', time: '2026-09-27T10:07:50Z', classification: 'incident_context', purpose: 'before/after: identity session independent of the isolated device', fields: { EventType: 'session_active', Account: 'acct-173', Host: 'unmanaged-173', DeviceId: 'unmanaged-173', AssetId: 'DEV-UNKNOWN-173', Result: 'observed', Detail: 'Remote session session-173-REMOTE still active after endpoint isolation; device isolation does not end an identity session', Phase: 'after_containment' } },
      { id: 'M09-T-029', table: 'IdentityEvents', time: '2026-09-27T10:09:30Z', classification: 'benign_background', purpose: 'background: guest network sign-in', fields: { EventType: 'guest_portal_sign_in', Account: 'guest-311', Host: 'wifi-gw-01', DeviceId: 'wifi-gw-01', Result: 'success', Detail: 'Guest portal sign-in from a visitor device; no corporate resource access' } },
      { id: 'M09-T-030', table: 'IdentityEvents', time: '2026-09-27T10:13:00Z', classification: 'benign_background', purpose: 'background: self-service password change', fields: { EventType: 'password_change', Account: 'acct-220', Host: 'ws-311', DeviceId: 'ws-311', AssetId: 'DEV-311', Result: 'success', Detail: 'Self-service password change completed from a registered workstation' } },
      { id: 'M09-T-031', table: 'IdentityEvents', time: '2026-09-27T10:14:10Z', classification: 'incident_context', purpose: 'before/after: session persists after the failed disable action', fields: { EventType: 'session_active', Account: 'acct-173', Host: 'unmanaged-173', DeviceId: 'unmanaged-173', AssetId: 'DEV-UNKNOWN-173', Result: 'observed', Detail: 'Remote session session-173-REMOTE still active after the identity-disable request was rejected', Phase: 'after_containment' } },
      { id: 'M09-T-032', table: 'IdentityEvents', time: '2026-09-27T10:17:20Z', classification: 'benign_background', purpose: 'background: ordinary sign-in on a managed device', fields: { EventType: 'interactive_sign_in', Account: 'acct-338', Host: 'ws-311', DeviceId: 'ws-311', AssetId: 'DEV-311', Result: 'success', Detail: 'Interactive sign-in from a registered workstation; MFA satisfied' } },
      { id: 'M09-T-033', table: 'ScopeChecks', time: '2026-09-27T10:15:20Z', classification: 'incident_context', purpose: 'evidence-quality: sensor coverage gap on fs-02', fields: { EventType: 'impact_pattern_search', CheckName: 'Impact-pattern search', Account: 'soc-analyst', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'not_assessable', Detail: 'No endpoint sensor is installed on fs-02, so the impact-pattern search cannot assess it; absence of matches is not a clean result', CoverageStatus: 'no_sensor' } },
      { id: 'M09-T-034', table: 'ScopeChecks', time: '2026-09-27T10:15:50Z', classification: 'benign_background', purpose: 'scope-check: sensor present, no match', fields: { EventType: 'impact_pattern_search', CheckName: 'Impact-pattern search', Account: 'acct-045', Host: 'ws-054', DeviceId: 'ws-054', AssetId: 'DEV-054', Result: 'no_match', Detail: 'Impact-pattern search returned 0 matches; sensor reporting normally' } },
      { id: 'M09-T-035', table: 'ScopeChecks', time: '2026-09-27T10:16:10Z', classification: 'benign_background', purpose: 'scope-check: sensor present, no match', fields: { EventType: 'impact_pattern_search', CheckName: 'Impact-pattern search', Account: 'acct-220', Host: 'ws-311', DeviceId: 'ws-311', AssetId: 'DEV-311', Result: 'no_match', Detail: 'Impact-pattern search returned 0 matches; sensor reporting normally' } },
      { id: 'M09-T-036', table: 'ScopeChecks', time: '2026-09-27T10:16:30Z', classification: 'benign_background', purpose: 'evidence-quality: sensor coverage gap on a printer', fields: { EventType: 'impact_pattern_search', CheckName: 'Impact-pattern search', Account: 'soc-analyst', Host: 'print-08', DeviceId: 'print-08', AssetId: 'DEV-PRINT-08', Result: 'not_assessable', Detail: 'Device type does not support the endpoint sensor; the search cannot assess it', CoverageStatus: 'no_sensor' } },
      { id: 'M09-T-037', table: 'ResponseRecords', time: '2026-09-27T10:05:30Z', classification: 'incident_context', purpose: 'before/after: request precedes acknowledgement', fields: { EventType: 'action_requested', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'requested', Detail: 'isolate_endpoint requested from the incident queue', Phase: 'before_containment' } },
      { id: 'M09-T-038', table: 'ResponseRecords', time: '2026-09-27T10:06:40Z', classification: 'incident_context', purpose: 'completion evidence: sensor confirms the policy is applied', fields: { EventType: 'action_completed', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'success', Detail: 'isolate_endpoint acknowledged by the sensor; network policy applied; eradication and recovery are not implied', Phase: 'after_containment' } },
      { id: 'M09-T-039', table: 'ResponseRecords', time: '2026-09-27T10:11:00Z', classification: 'incident_context', purpose: 'before/after: identity action requested', fields: { EventType: 'action_requested', Account: 'acct-173', Result: 'requested', Detail: 'disable_identity requested for the account tied to the unfamiliar session', Phase: 'before_containment' } },
      { id: 'M09-T-040', table: 'ResponseRecords', time: '2026-09-27T10:11:10Z', classification: 'incident_context', purpose: 'completion evidence: action did not complete', fields: { EventType: 'action_rejected', Account: 'acct-173', Result: 'failure', Detail: 'disable_identity rejected: required approval was not recorded; the account remains enabled', Phase: 'after_containment' } },
      { id: 'M09-T-041', table: 'ResponseRecords', time: '2026-09-27T10:12:05Z', classification: 'incident_context', purpose: 'before/after: service action requested', fields: { EventType: 'action_requested', Account: 'soc-analyst', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'requested', Detail: 'isolate_service requested for the file-share service', Phase: 'before_containment' } },
      { id: 'M09-T-042', table: 'ResponseRecords', time: '2026-09-27T10:12:40Z', classification: 'incident_context', purpose: 'completion evidence: partial outcome', fields: { EventType: 'action_partial', Account: 'soc-analyst', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'partial', Detail: 'isolate_service restricted one of three access paths; two paths remain open; impact and remaining access need validation', Phase: 'after_containment' } },
      { id: 'M09-T-043', table: 'ResponseRecords', time: '2026-09-27T10:15:00Z', classification: 'incident_context', purpose: 'completion evidence: preservation is requested, not done', fields: { EventType: 'evidence_snapshot_requested', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'pending', Detail: 'Memory and disk triage image requested; collection not yet confirmed', Phase: 'after_containment' } },
      { id: 'M09-T-044', table: 'ResponseRecords', time: '2026-09-27T10:17:30Z', classification: 'incident_context', purpose: 'completion evidence: eradication has not started', fields: { EventType: 'eradication_status', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'not_started', Detail: 'Eradication not started: process still listed and the startup entry remains', Phase: 'after_containment' } },
      { id: 'M09-T-045', table: 'BackupEvents', time: '2026-09-27T10:00:00Z', classification: 'benign_background', purpose: 'background: unrelated backup completed', fields: { EventType: 'backup_job', Account: 'svc-backup', Host: 'db-02', DeviceId: 'db-02', AssetId: 'DEV-DB-02', Result: 'completed', Detail: 'Scheduled database backup completed and catalogued' } },
      { id: 'M09-T-046', table: 'BackupEvents', time: '2026-09-27T10:01:30Z', classification: 'benign_background', purpose: 'background: unrelated backup completed', fields: { EventType: 'backup_job', Account: 'svc-backup', Host: 'ws-054', DeviceId: 'ws-054', AssetId: 'DEV-054', Result: 'completed', Detail: 'Scheduled workstation backup completed and catalogued' } },
      { id: 'M09-T-047', table: 'BackupEvents', time: '2026-09-27T10:10:10Z', classification: 'incident_context', purpose: 'before/after: backups cannot run on the isolated host', fields: { EventType: 'backup_job_suspended', Account: 'svc-backup', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'suspended', Detail: 'Backup agent paused on the isolated host; no new recovery point is being created', Phase: 'after_containment' } },
      { id: 'M09-T-048', table: 'BackupEvents', time: '2026-09-27T10:16:00Z', classification: 'incident_context', purpose: 'completion evidence: retention hold is preservation, not restore', fields: { EventType: 'retention_hold', Account: 'svc-backup', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'applied', Detail: 'Recovery points RP-WS-173-0918 and RP-WS-173-0948 placed on retention hold; no restore performed', Phase: 'after_containment' } },
      { id: 'M09-T-049', table: 'RecoveryChecks', time: '2026-09-27T10:18:20Z', classification: 'incident_context', purpose: 'recovery validation: workstation restore not performed', fields: { EventType: 'restore_test', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'not_run', Detail: 'No restore performed or validated for ws-173; isolation is not recovery' } },
      { id: 'M09-T-050', table: 'RecoveryChecks', time: '2026-09-27T10:18:40Z', classification: 'incident_context', purpose: 'recovery validation: file service not validated', fields: { EventType: 'restore_test', Account: 'soc-analyst', Host: 'fs-02', DeviceId: 'fs-02', AssetId: 'DEV-FS-02', Result: 'not_run', Detail: 'No consistency or restore check has been run for fs-02; finance$ remains unavailable' } },
      { id: 'M09-T-051', table: 'RecoveryChecks', time: '2026-09-27T10:19:00Z', classification: 'incident_context', purpose: 'recovery validation: no integrity sample', fields: { EventType: 'integrity_sample', Account: 'acct-173', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'not_run', Detail: 'No post-incident file-integrity sample taken; how many user documents are unreadable is unquantified' } },
      { id: 'M09-T-052', table: 'RecoveryChecks', time: '2026-09-27T10:19:20Z', classification: 'incident_context', purpose: 'recovery validation: credential reset not verified', fields: { EventType: 'credential_reset_verification', Account: 'acct-173', Result: 'pending', Detail: 'Credential reset not performed; the remote session was still active at the last check' } },
      { id: 'M09-T-053', table: 'RecoveryChecks', time: '2026-09-27T10:19:40Z', classification: 'benign_background', purpose: 'recovery validation: what a passed check looks like, unrelated system', fields: { EventType: 'restore_test', Account: 'svc-backup', Host: 'db-02', DeviceId: 'db-02', AssetId: 'DEV-DB-02', Result: 'passed', Detail: 'Scheduled quarterly restore test for db-02 passed; unrelated to this incident' } },
      { id: 'M09-T-054', table: 'RecoveryChecks', time: '2026-09-27T10:19:50Z', classification: 'incident_context', purpose: 'recovery validation: monitoring is not attestation', fields: { EventType: 'monitoring_after_containment', Account: 'soc-analyst', Host: 'ws-173', DeviceId: 'ws-173', AssetId: 'DEV-173', Result: 'in_progress', Detail: 'Enhanced monitoring enabled on ws-173; no clean-state attestation has been issued' } },
    ],
    // Alert candidates over the telemetry above (Sprint 4). `triage` is instructor-side and never rendered.
    alertCandidates: [
      { id: 'M09-ALERT-001', time: '2026-09-27T10:13:00Z', severity: 'Medium', title: 'Rapid file changes on ws-054', entities: ['ws-054'], rule: 'Endpoint: more than 100 file changes in 90 seconds', query: 'DeviceEvents\n| where Host == "ws-054"',
        triage: { disposition: 'benign', hinge: 'Same trigger as the incident, but the process is a signed approved sync client, extensions are unchanged, no recovery-service stop, no overlapping remote session, and the scoped search returns no match.' } },
      { id: 'M09-ALERT-002', time: '2026-09-27T10:10:30Z', severity: 'Low', title: 'Backup agent job active on fs-02', entities: ['fs-02', 'svc-backup'], rule: 'File service: backup snapshot overlaps a monitored window', query: 'FileServiceEvents\n| where EventType == "backup_agent_job"',
        triage: { disposition: 'benign-not-causal', hinge: 'The job completed at 10:08, before share latency rose (10:10) and the share became unavailable (10:12); timing does not support it as the cause.' } },
      { id: 'M09-ALERT-003', time: '2026-09-27T10:12:30Z', severity: 'High', title: 'File share unavailable on fs-02', entities: ['fs-02'], rule: 'File service: share availability check failed', query: 'FileServiceEvents\n| where EventType == "share_unavailable"',
        triage: { disposition: 'incident-related', hinge: 'Observed service impact; cause is not established and no file-level change is recorded on fs-02.' } },
      { id: 'M09-ALERT-004', time: '2026-09-27T10:14:20Z', severity: 'High', title: 'Account session still active after disable request', entities: ['acct-173'], rule: 'Identity: session persists after a disable action', query: 'IdentityEvents\n| where Account == "acct-173"',
        triage: { disposition: 'incident-related', hinge: 'The disable request was rejected for missing approval, so the remote session continues; endpoint isolation does not end an identity session.' } },
      { id: 'M09-ALERT-005', time: '2026-09-27T10:11:20Z', severity: 'Medium', title: 'Response action rejected', entities: ['acct-173'], rule: 'Response: action returned a failure outcome', query: 'ResponseRecords\n| where EventType == "action_rejected"',
        triage: { disposition: 'incident-related', hinge: 'A containment step did not complete; completion evidence is required before treating it as done.' } },
      { id: 'M09-ALERT-006', time: '2026-09-27T10:19:30Z', severity: 'Medium', title: 'Recovery validation not completed', entities: ['ws-173', 'fs-02'], rule: 'Recovery: validation check has not run for an affected system', query: 'RecoveryChecks\n| where Result == "not_run"',
        triage: { disposition: 'incident-related', hinge: 'Containment is recorded but no restore or integrity validation exists; the passed check on db-02 is unrelated.' } },
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

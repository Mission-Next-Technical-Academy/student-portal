/* Independent, immutable Module 06 assessment scenario contract. */
const SocM06AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const scenario = {
    id: 'M06-ASSESS-2026-09-27',
    stateKey: 'm06-threat-hunt-assessment-v1', // gitleaks:allow
    legacyStateId: 'm06-hypothesis-hunt-v1',
    fixedAt: '2026-09-27T09:30:00Z',
    start: '2026-09-27T09:00:00Z',
    end: '2026-09-27T09:30:00Z',
    seedLead: {
      id: 'M06-LEAD-001',
      type: 'scheduled_task_behavior',
      device: 'ws-318',
      account: 'acct-184',
      taskName: 'UpdateHealth',
      observation: 'A weekly scheduled task launches a script from a user-writable folder; no alert fired.',
      initialDisposition: 'unverified_lead',
    },
    scope: {
      devices: ['ws-318', 'ws-355'],
      accounts: ['acct-184'],
      timeStart: '2026-09-26T00:00:00Z',
      timeEnd: '2026-09-27T09:30:00Z',
      note: 'ws-355 is the curriculum benign comparison: same task name with a signed script during approved maintenance.',
    },
    telemetrySchema: {
      required: ['id', 'time', 'eventType', 'device', 'host', 'account', 'processId', 'parentProcessId', 'action', 'result', 'source'],
      eventTypes: ['scheduled_task', 'process_start', 'network_connection', 'identity_activity', 'file_indicator'],
      references: 'processId and parentProcessId are scoped to device; relatedEventIds reference scenario-local event IDs.',
    },
    telemetry: [
      { id: 'M06-EVT-001', time: '2026-09-27T09:04:02Z', eventType: 'scheduled_task', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: null, parentProcessId: null, taskName: 'UpdateHealth', taskPath: '\\Microsoft\\Windows\\UpdateHealth\\UpdateHealth', action: 'task_execution', result: 'started', source: 'SyntheticTaskScheduler', relatedEventIds: ['M06-EVT-002'] },
      { id: 'M06-EVT-002', time: '2026-09-27T09:04:04Z', eventType: 'process_start', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: '3180', parentProcessId: null, image: 'C:\\Windows\\System32\\taskeng.exe', commandLine: 'taskeng.exe {UpdateHealth}', action: 'process_start', result: 'success', source: 'SyntheticEndpoint', relatedEventIds: ['M06-EVT-001', 'M06-EVT-003'] },
      { id: 'M06-EVT-003', time: '2026-09-27T09:04:06Z', eventType: 'process_start', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: '3188', parentProcessId: '3180', image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', commandLine: 'powershell.exe -NoProfile -File C:\\Users\\Public\\UpdateHealth.ps1', scriptPath: 'C:\\Users\\Public\\UpdateHealth.ps1', action: 'process_start', result: 'success', source: 'SyntheticEndpoint', relatedEventIds: ['M06-EVT-004', 'M06-EVT-005', 'M06-EVT-006'] },
      { id: 'M06-EVT-004', time: '2026-09-27T09:04:09Z', eventType: 'file_indicator', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: '3188', parentProcessId: '3180', path: 'C:\\Users\\Public\\UpdateHealth.ps1', sha256: 'c'.repeat(64), signer: 'Unsigned', action: 'file_observed', result: 'user_writable_script', source: 'SyntheticFileTelemetry', relatedEventIds: ['M06-EVT-003'] },
      { id: 'M06-EVT-005', time: '2026-09-27T09:04:13Z', eventType: 'network_connection', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: '3188', parentProcessId: '3180', destination: '198.51.100.88', destinationPort: 443, protocol: 'tcp', action: 'outbound_connection', result: 'allowed', source: 'SyntheticNetwork', relatedEventIds: ['M06-EVT-003', 'M06-EVT-006'] },
      { id: 'M06-EVT-006', time: '2026-09-27T09:04:18Z', eventType: 'identity_activity', device: 'ws-318', host: 'WS-318', account: 'acct-184', processId: '3188', parentProcessId: '3180', identity: 'acct-184', identityType: 'user', authentication: 'existing_session', action: 'credential_context_observed', result: 'success', source: 'SyntheticIdentity', relatedEventIds: ['M06-EVT-003', 'M06-EVT-005'] },
      { id: 'M06-EVT-007', time: '2026-09-27T09:14:02Z', eventType: 'scheduled_task', device: 'ws-355', host: 'WS-355', account: 'acct-271', processId: null, parentProcessId: null, taskName: 'UpdateHealth', taskPath: '\\Microsoft\\Windows\\UpdateHealth\\UpdateHealth', maintenanceId: 'CHG-2048', action: 'task_execution', result: 'approved_maintenance', source: 'SyntheticTaskScheduler', relatedEventIds: ['M06-EVT-008'] },
      { id: 'M06-EVT-008', time: '2026-09-27T09:14:04Z', eventType: 'process_start', device: 'ws-355', host: 'WS-355', account: 'acct-271', processId: '3550', parentProcessId: null, image: 'C:\\Program Files\\Contoso\\Health\\HealthUpdate.exe', commandLine: 'HealthUpdate.exe /scheduled', signer: 'CN=Contoso IT, O=Contoso', action: 'process_start', result: 'signed_binary', source: 'SyntheticEndpoint', relatedEventIds: ['M06-EVT-007', 'M06-EVT-009'] },
      { id: 'M06-EVT-009', time: '2026-09-27T09:14:10Z', eventType: 'network_connection', device: 'ws-355', host: 'WS-355', account: 'acct-271', processId: '3550', parentProcessId: null, destination: 'updates.contoso.example', destinationPort: 443, protocol: 'tcp', action: 'outbound_connection', result: 'allowed', source: 'SyntheticNetwork', relatedEventIds: ['M06-EVT-008'] },
    ],
    expectedTruth: {
      hypothesis: 'On ws-318, the UpdateHealth scheduled task launched an unsigned PowerShell script from a user-writable directory and made an outbound TLS-port connection. This is suspicious execution requiring investigation; the fixture does not establish persistence intent, payload transfer, credential theft, or command-and-control.',
      supportedTechniques: [
        {
          id: 'T1053.005',
          name: 'Scheduled Task',
          evidenceEventIds: ['M06-EVT-001', 'M06-EVT-002', 'M06-EVT-003'],
          rationale: 'The UpdateHealth task execution is correlated to taskeng.exe and its child script process on ws-318. This supports execution through a scheduled task, but does not prove task creation or persistence intent.',
        },
        {
          id: 'T1059.001',
          name: 'PowerShell',
          evidenceEventIds: ['M06-EVT-003'],
          rationale: 'Process telemetry identifies powershell.exe running UpdateHealth.ps1. The script is unsigned and in a user-writable location (M06-EVT-004), which raises suspicion but does not alone prove maliciousness.',
        },
      ],
      unsupportedTechniques: [
        {
          id: 'T1105',
          name: 'Ingress Tool Transfer',
          evidenceEventIds: ['M06-EVT-003', 'M06-EVT-005'],
          missingEvidence: ['No download command, transferred-file event, inbound payload, or file creation attributed to the connection is present.'],
          contradictoryEvidence: [],
          rationale: 'PowerShell execution followed by outbound traffic is not evidence that a tool or file was transferred onto the host.',
        },
        {
          id: 'T1071.001',
          name: 'Web Protocols',
          evidenceEventIds: ['M06-EVT-005'],
          missingEvidence: ['No HTTP(S) application-layer protocol, request/response, URL, or command-and-control content is recorded; port 443 and TCP alone do not establish web-protocol use or C2.'],
          contradictoryEvidence: [],
          rationale: 'The destination is an unclassified test IP and telemetry records only an allowed TCP connection to port 443.',
        },
        {
          id: 'T1053.005',
          name: 'Scheduled Task as persistence',
          evidenceEventIds: ['M06-EVT-001', 'M06-EVT-007', 'M06-EVT-008'],
          missingEvidence: ['No task creation, task modification, trigger configuration, or recurring execution history is captured.'],
          contradictoryEvidence: ['M06-EVT-007 and M06-EVT-008 show the same task name on the comparison host during approved maintenance with a signed vendor binary.'],
          rationale: 'Task execution is supported, but persistence intent on ws-318 is not established; the benign comparison cautions against classifying by task name alone.',
        },
      ],
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();

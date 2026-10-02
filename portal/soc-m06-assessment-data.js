/* Independent, immutable Module 06 assessment scenario contract. */
const SocM06AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  // Background-row helpers (Sprint 3). Rows are plain objects of the same shape as the authored events.
  const sha = (seed) => seed.repeat(Math.ceil(64 / seed.length)).slice(0, 64);
  const ev = (n, time, eventType, device, account, o) => ({
    id: `M06-EVT-${String(n).padStart(3, '0')}`, time: `2026-09-27T${time}Z`, eventType, device, host: device.toUpperCase(), account,
    processId: null, parentProcessId: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', ...o,
  });
  const proc = (n, time, device, account, pid, ppid, image, commandLine, o = {}) => ev(n, time, 'process_start', device, account, { processId: pid, parentProcessId: ppid, image, commandLine, ...o });
  const net = (n, time, device, account, pid, ppid, destination, result = 'allowed', o = {}) => ev(n, time, 'network_connection', device, account, {
    processId: pid, parentProcessId: ppid, destination, destinationPort: 443, protocol: 'tcp', action: 'outbound_connection', result, source: 'SyntheticNetwork', ...o,
  });
  const task = (n, time, device, account, pid, taskName, taskPath, o = {}) => ev(n, time, 'scheduled_task', device, account, {
    processId: pid, taskName, taskPath, action: 'task_execution', result: 'started', source: 'SyntheticTaskScheduler', ...o,
  });
  const health = (n, time, device, o = {}) => ev(n, time, 'sensor_health', device, 'acct-sys', {
    action: 'sensor_heartbeat', result: 'healthy', coverageStatus: 'Full', source: 'SyntheticSensorHealth', ...o,
  });
  const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  const SVCHOST = 'C:\\Windows\\System32\\svchost.exe';
  const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const TEAMS = 'C:\\Program Files\\WindowsApps\\MSTeams_24123.0.0\\ms-teams.exe';
  const CONTOSO_SIGNER = 'CN=Contoso IT, O=Contoso';

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
      devices: ['ws-318', 'ws-355', 'ws-402'],
      accounts: ['acct-184'],
      timeStart: '2026-09-26T00:00:00Z',
      timeEnd: '2026-09-27T09:30:00Z',
      note: 'ws-355 is the curriculum benign comparison: same task name with a signed script during approved maintenance. ws-402 is a neighboring workstation used for baseline and bounded negative checks.',
    },
    telemetrySchema: {
      required: ['id', 'time', 'eventType', 'device', 'host', 'account', 'processId', 'parentProcessId', 'action', 'result', 'source'],
      eventTypes: ['scheduled_task', 'process_start', 'network_connection', 'identity_activity', 'file_indicator', 'sensor_health'],
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
      /* Sprint 3 background, alternate-explanation and coverage rows (purposes in fixtureNotes). */
      // ws-318: routine activity on the lead host, including an ordinary signed update task and a connection retry.
      health(10, '09:00:12', 'ws-318'),
      proc(11, '09:01:30', 'ws-318', 'acct-184', '3101', null, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', 'OUTLOOK.EXE', { signer: 'CN=Microsoft Corporation', relatedEventIds: ['M06-EVT-012'] }),
      net(12, '09:01:41', 'ws-318', 'acct-184', '3101', null, 'mail.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-011'] }),
      proc(13, '09:02:00', 'ws-318', 'acct-sys', '1120', null, SVCHOST, 'svchost.exe -k netsvcs -p -s Schedule', { relatedEventIds: ['M06-EVT-014'] }),
      task(14, '09:02:20', 'ws-318', 'acct-sys', '1120', 'OneDrive Standalone Update Task', '\\OneDrive Standalone Update Task', { relatedEventIds: ['M06-EVT-013', 'M06-EVT-015'] }),
      proc(15, '09:02:23', 'ws-318', 'acct-184', '3142', '1120', 'C:\\Program Files\\Microsoft OneDrive\\OneDriveStandaloneUpdater.exe', 'OneDriveStandaloneUpdater.exe', { signer: 'CN=Microsoft Corporation', relatedEventIds: ['M06-EVT-014', 'M06-EVT-016'] }),
      net(16, '09:02:27', 'ws-318', 'acct-184', '3142', '1120', 'oneclient.sfx.ms', 'allowed', { relatedEventIds: ['M06-EVT-015'] }),
      ev(17, '09:03:10', 'identity_activity', 'ws-318', 'acct-184', { identity: 'acct-184', identityType: 'user', authentication: 'unlock', action: 'session_unlock', source: 'SyntheticIdentity' }),
      proc(18, '09:08:00', 'ws-318', 'acct-184', '3204', null, CHROME, 'chrome.exe --profile-directory=Default', { signer: 'CN=Google LLC', relatedEventIds: ['M06-EVT-019', 'M06-EVT-020'] }),
      net(19, '09:08:30', 'ws-318', 'acct-184', '3204', null, 'intranet.contoso.example', 'timed_out', { relatedEventIds: ['M06-EVT-018', 'M06-EVT-020'] }),
      net(20, '09:08:34', 'ws-318', 'acct-184', '3204', null, 'intranet.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-018', 'M06-EVT-019'] }),
      health(21, '09:29:55', 'ws-318'),
      // ws-355: comparison host baseline, service-account logon for the approved maintenance, signed binary identity, retry.
      health(22, '09:00:14', 'ws-355'),
      proc(23, '09:02:00', 'ws-355', 'acct-271', '3440', null, TEAMS, 'ms-teams.exe --system-initiated', { signer: 'CN=Microsoft Corporation', relatedEventIds: ['M06-EVT-024'] }),
      net(24, '09:02:10', 'ws-355', 'acct-271', '3440', null, 'teams.microsoft.com', 'allowed', { relatedEventIds: ['M06-EVT-023'] }),
      proc(25, '09:12:30', 'ws-355', 'acct-sys', '1150', null, SVCHOST, 'svchost.exe -k netsvcs -p -s Schedule', { relatedEventIds: ['M06-EVT-029'] }),
      ev(26, '09:13:50', 'identity_activity', 'ws-355', 'acct-svc-health', { identity: 'acct-svc-health', identityType: 'service', authentication: 'service_logon', action: 'service_logon', source: 'SyntheticIdentity', maintenanceId: 'CHG-2048', relatedEventIds: ['M06-EVT-007'] }),
      ev(27, '09:14:06', 'file_indicator', 'ws-355', 'acct-271', { processId: '3550', parentProcessId: null, path: 'C:\\Program Files\\Contoso\\Health\\HealthUpdate.exe', sha256: sha('e47c19'), signer: CONTOSO_SIGNER, action: 'file_observed', result: 'signed_binary', source: 'SyntheticFileTelemetry', relatedEventIds: ['M06-EVT-008'] }),
      net(28, '09:14:40', 'ws-355', 'acct-271', '3550', null, 'updates.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-008', 'M06-EVT-009'] }),
      task(29, '09:20:00', 'ws-355', 'acct-sys', '1150', 'GoogleUpdateTaskMachineCore', '\\GoogleUpdateTaskMachineCore', { relatedEventIds: ['M06-EVT-025', 'M06-EVT-030'] }),
      proc(30, '09:20:03', 'ws-355', 'acct-sys', '3590', '1150', 'C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe', 'GoogleUpdate.exe /c', { signer: 'CN=Google LLC', relatedEventIds: ['M06-EVT-029'] }),
      health(31, '09:29:56', 'ws-355'),
      // ws-402: neighbor workstation. Signed scripted maintenance (alert look-alike), a bounded sensor gap, and no UpdateHealth task.
      health(32, '09:00:11', 'ws-402'),
      proc(33, '09:02:30', 'ws-402', 'acct-402', '4020', null, CHROME, 'chrome.exe --profile-directory=Default', { signer: 'CN=Google LLC', relatedEventIds: ['M06-EVT-034'] }),
      net(34, '09:02:40', 'ws-402', 'acct-402', '4020', null, 'intranet.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-033'] }),
      proc(35, '09:05:00', 'ws-402', 'acct-sys', '4000', null, SVCHOST, 'svchost.exe -k netsvcs -p -s Schedule', { relatedEventIds: ['M06-EVT-036'] }),
      task(36, '09:05:30', 'ws-402', 'acct-sys', '4000', 'BrowserCacheCleanup', '\\Contoso\\BrowserCacheCleanup', { maintenanceId: 'CHG-2051', result: 'approved_maintenance', relatedEventIds: ['M06-EVT-035', 'M06-EVT-037'] }),
      proc(37, '09:05:33', 'ws-402', 'acct-sys', '4044', '4000', PS, 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\\Program Files\\Contoso\\Maintenance\\Clear-BrowserCache.ps1"', { scriptPath: 'C:\\Program Files\\Contoso\\Maintenance\\Clear-BrowserCache.ps1', relatedEventIds: ['M06-EVT-036', 'M06-EVT-038'] }),
      ev(38, '09:05:36', 'file_indicator', 'ws-402', 'acct-sys', { processId: '4044', parentProcessId: '4000', path: 'C:\\Program Files\\Contoso\\Maintenance\\Clear-BrowserCache.ps1', sha256: sha('18d3a6'), signer: CONTOSO_SIGNER, action: 'file_observed', result: 'signed_script', source: 'SyntheticFileTelemetry', relatedEventIds: ['M06-EVT-037'] }),
      ev(39, '09:15:20', 'identity_activity', 'ws-402', 'acct-402', { identity: 'acct-402', identityType: 'user', authentication: 'existing_session', action: 'session_refresh', source: 'SyntheticIdentity' }),
      health(40, '09:21:00', 'ws-402', { action: 'sensor_service_stopped', result: 'stopped_for_agent_upgrade', coverageStatus: 'Gap', maintenanceId: 'CHG-2052', relatedEventIds: ['M06-EVT-041'] }),
      health(41, '09:24:30', 'ws-402', { action: 'sensor_service_started', result: 'reporting_resumed', coverageStatus: 'Partial', maintenanceId: 'CHG-2052', relatedEventIds: ['M06-EVT-040'] }),
      proc(42, '09:26:00', 'ws-402', 'acct-402', '4120', null, 'C:\\Windows\\System32\\notepad.exe', 'notepad.exe'),
      health(43, '09:29:55', 'ws-402'),
      // Additional routine rows: signed browser identity, periodic mail polling by a signed client (a regular interval that is not the lead), office work.
      ev(44, '09:10:15', 'file_indicator', 'ws-318', 'acct-184', { processId: '3204', parentProcessId: null, path: CHROME, sha256: sha('7a30c5'), signer: 'CN=Google LLC', action: 'file_observed', result: 'signed_binary', source: 'SyntheticFileTelemetry', relatedEventIds: ['M06-EVT-018'] }),
      proc(45, '09:16:40', 'ws-355', 'acct-271', '3620', null, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE', 'EXCEL.EXE', { signer: 'CN=Microsoft Corporation', relatedEventIds: ['M06-EVT-046'] }),
      net(46, '09:16:55', 'ws-355', 'acct-271', '3620', null, 'sharepoint.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-045'] }),
      proc(47, '09:09:00', 'ws-402', 'acct-402', '4090', null, 'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE', 'EXCEL.EXE', { signer: 'CN=Microsoft Corporation', relatedEventIds: ['M06-EVT-048'] }),
      net(48, '09:09:20', 'ws-402', 'acct-402', '4090', null, 'sharepoint.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-047'] }),
      net(49, '09:11:41', 'ws-318', 'acct-184', '3101', null, 'mail.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-011', 'M06-EVT-012'] }),
      net(50, '09:21:41', 'ws-318', 'acct-184', '3101', null, 'mail.contoso.example', 'allowed', { relatedEventIds: ['M06-EVT-011', 'M06-EVT-012'] }),
      ev(51, '09:27:00', 'identity_activity', 'ws-355', 'acct-271', { identity: 'acct-271', identityType: 'user', authentication: 'existing_session', action: 'session_refresh', source: 'SyntheticIdentity' }),
    ],
    fixtureNotes: {
      eventPurposes: {
        'M06-EVT-010..021': 'background on the lead host: ordinary signed update task, mail/browser activity, unlock, a connection retry pair and sensor heartbeats bounding coverage.',
        'M06-EVT-044..051': 'alternate explanation and background: periodic signed mail polling on the lead host (regular interval by a signed client), signed browser identity, office work on other hosts.',
        'M06-EVT-022..031': 'comparison-host baseline: collaboration client, service-account logon tied to CHG-2048, signed binary identity, retry, second signed vendor task.',
        'M06-EVT-032..043': 'neighbor host: signed scripted maintenance that resembles the lead (alternate explanation), a bounded sensor gap, and absence of the UpdateHealth task.',
      },
    },
    expectedTruth: {
      hypothesis: 'On ws-318, the UpdateHealth scheduled task launched an unsigned PowerShell script from a user-writable directory and made an outbound TLS-port connection. This is suspicious execution requiring investigation; the fixture does not establish persistence intent, payload transfer, credential theft, or command-and-control.',
      benignBackground: [
        { type: 'routine_signed_vendor_tasks_and_browsing_on_lead_host', device: 'ws-318', eventIds: ['M06-EVT-011', 'M06-EVT-012', 'M06-EVT-013', 'M06-EVT-014', 'M06-EVT-015', 'M06-EVT-016', 'M06-EVT-017', 'M06-EVT-018', 'M06-EVT-019', 'M06-EVT-020', 'M06-EVT-044', 'M06-EVT-049', 'M06-EVT-050'] },
        { type: 'comparison_host_routine_and_signed_maintenance_context', device: 'ws-355', eventIds: ['M06-EVT-023', 'M06-EVT-024', 'M06-EVT-025', 'M06-EVT-026', 'M06-EVT-027', 'M06-EVT-028', 'M06-EVT-029', 'M06-EVT-030', 'M06-EVT-045', 'M06-EVT-046', 'M06-EVT-051'] },
        { type: 'signed_scripted_cache_cleanup_under_change_ticket', device: 'ws-402', eventIds: ['M06-EVT-035', 'M06-EVT-036', 'M06-EVT-037', 'M06-EVT-038'] },
        { type: 'ordinary_user_activity', device: 'ws-402', eventIds: ['M06-EVT-033', 'M06-EVT-034', 'M06-EVT-039', 'M06-EVT-042', 'M06-EVT-047', 'M06-EVT-048'] },
      ],
      coverageGaps: [
        { device: 'ws-402', windowStart: '2026-09-27T09:21:00Z', windowEnd: '2026-09-27T09:24:30Z', eventIds: ['M06-EVT-040', 'M06-EVT-041'], note: 'Planned sensor upgrade under CHG-2052: no endpoint telemetry exists for ws-402 in this interval.' },
        { device: 'all', coverageEventIds: ['M06-EVT-010', 'M06-EVT-021', 'M06-EVT-022', 'M06-EVT-031', 'M06-EVT-032', 'M06-EVT-043'], note: 'Heartbeats at the start and end of the window record Full coverage for ws-318, ws-355 and ws-402 (ws-402 outside its gap).' },
      ],
      negativeEvidence: {
        statement: 'No UpdateHealth scheduled-task execution is recorded on ws-402 between 09:00:00Z and 09:30:00Z, except that ws-402 has no telemetry from 09:21:00Z to 09:24:30Z (sensor upgrade). The finding is bounded to this device, the DeviceTaskEvents source and the covered time; it does not exclude activity inside the gap, on other devices, or before 09:00:00Z.',
        device: 'ws-402', eventType: 'scheduled_task', taskName: 'UpdateHealth', result: 'no_match',
        coverageEventIds: ['M06-EVT-032', 'M06-EVT-040', 'M06-EVT-041', 'M06-EVT-043'],
      },
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

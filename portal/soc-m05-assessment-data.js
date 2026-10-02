/* Independent, immutable Module 05 assessment fixture contract. */
const SocM05AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  // Background-row helpers (Sprint 3). Hashes are synthetic repeating hex seeds.
  const sha = (seed) => seed.repeat(Math.ceil(64 / seed.length)).slice(0, 64);
  const HOSTS = { 'M05-DEV-001': 'WS-ASSESS-27', 'M05-DEV-002': 'WS-ASSESS-14', 'M05-DEV-003': 'SRV-ASSESS-02', 'M05-DEV-004': 'WS-ASSESS-31', 'M05-DEV-005': 'WS-ASSESS-40' };
  const row = (n, time, eventType, deviceId, user, o) => ({
    id: `M05-EVT-${String(n).padStart(3, '0')}`, time: `2026-09-27T${time}Z`, eventType, deviceId, host: HOSTS[deviceId], user,
    processId: null, parentProcessId: null, image: null, commandLine: null, filePath: null, sha256: null, registryPath: null,
    action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null, ...o,
  });
  const SENSOR = 'C:\\Program Files\\EndpointAgent\\sensor.exe';
  const lookup = (n, time, dev, user, pid, ppid, image, sha256, signer, prevalence, reputation = 'benign') => row(n, time, 'file_hash', dev, user, {
    processId: pid, parentProcessId: ppid, image, filePath: image, sha256, action: 'file_reputation_lookup', result: reputation,
    source: 'SyntheticThreatIntel', signer, prevalence, reputation,
  });
  const conn = (n, time, dev, user, pid, ppid, image, destination, result = 'allowed') => row(n, time, 'network_connection', dev, user, {
    processId: pid, parentProcessId: ppid, image, action: 'outbound_connection', result, source: 'SyntheticNetwork', destination, destinationPort: 443, protocol: 'tcp',
  });
  const heartbeat = (n, time, dev, o = {}) => row(n, time, 'sensor_health', dev, 'SYSTEM', {
    image: SENSOR, action: 'sensor_heartbeat', result: 'healthy', source: 'SyntheticSensorHealth', coverageStatus: 'Full', ...o,
  });
  const TEAMS = 'C:\\Program Files\\WindowsApps\\MSTeams_24123.0.0\\ms-teams.exe';
  const EDGE_UPD = 'C:\\Program Files (x86)\\Microsoft\\EdgeUpdate\\MicrosoftEdgeUpdate.exe';
  const PDF = 'C:\\Users\\j.alvarez\\Downloads\\Q3-shift-schedule.pdf';
  const ACME = 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe';
  const ACME_DEST = 'updates.acme-software.example';
  const EXCEL = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE';
  const SVCHOST = 'C:\\Windows\\System32\\svchost.exe';
  const SNAP_PS1 = 'D:\\Ops\\Scripts\\Snapshot-Shares.ps1';
  const FAB = 'C:\\Program Files\\Fabrikam\\Sync\\FabrikamSync.exe';
  const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const WINWORD = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE';
  const MS = 'CN=Microsoft Corporation';

  const scenario = {
    id: 'M05-ASSESS-2026-09-27',
    caseId: 'EDR-5127',
    stateKey: 'm05-endpoint-assessment-v1',
    start: '2026-09-27T09:00:00Z',
    end: '2026-09-27T09:30:00Z',
    generatedAt: '2026-09-27T09:31:00Z',
    devices: [
      { id: 'M05-DEV-001', hostname: 'WS-ASSESS-27', platform: 'Windows 11', role: 'User workstation', owner: 'j.alvarez', zone: 'CORP-USER', status: 'Online' },
      { id: 'M05-DEV-002', hostname: 'WS-ASSESS-14', platform: 'Windows 11', role: 'User workstation', owner: 'm.reyes', zone: 'CORP-USER', status: 'Online' },
      { id: 'M05-DEV-003', hostname: 'SRV-ASSESS-02', platform: 'Windows Server 2022', role: 'File server', owner: 'IT Operations', zone: 'CORP-SERVER', status: 'Online' },
      { id: 'M05-DEV-004', hostname: 'WS-ASSESS-31', platform: 'Windows 11', role: 'User workstation', owner: 'd.okafor', zone: 'CORP-USER', status: 'Online' },
      { id: 'M05-DEV-005', hostname: 'WS-ASSESS-40', platform: 'Windows 11', role: 'User workstation', owner: 'l.chen', zone: 'CORP-USER', status: 'Online' },
    ],
    telemetrySchema: {
      description: 'Endpoint observations use this fixed record shape. Optional file metadata is attached to file_hash observations.',
      required: ['id', 'time', 'eventType', 'deviceId', 'host', 'user', 'processId', 'parentProcessId', 'image', 'commandLine', 'filePath', 'sha256', 'registryPath', 'action', 'result', 'source'],
      fields: {
        id: 'string: unique scenario-local event identifier',
        time: 'string: ISO-8601 UTC timestamp within the scenario window',
        eventType: 'enum: process_start | file_create | file_hash | persistence_change | sensor_control | network_connection | scheduled_task | sensor_health',
        deviceId: 'string: inventory device identifier',
        host: 'string: inventory hostname',
        user: 'string: endpoint security principal',
        processId: 'string|null: process identifier when applicable',
        parentProcessId: 'string|null: parent process identifier when applicable',
        image: 'string|null: executable image path',
        commandLine: 'string|null: observed process command line',
        filePath: 'string|null: endpoint file path',
        sha256: 'string|null: lowercase 64-character SHA-256 digest',
        registryPath: 'string|null: persistence/control registry path',
        action: 'string: observed operation, not analyst-requested action',
        result: 'string: sensor-observed outcome',
        source: 'string: synthetic sensor/source name',
        signer: 'optional string: observed file signer identity',
        prevalence: 'optional number: synthetic fleet prevalence count',
        reputation: 'optional enum: malicious | suspicious | unknown | benign',
        destination: 'optional string: network_connection destination host or IP (with destinationPort, protocol)',
        taskName: 'optional string: scheduled_task name (with taskPath)',
        coverageStatus: 'optional enum: Full | Partial | Gap, on sensor_health records',
      },
    },
    telemetry: [
      { id: 'M05-EVT-001', time: '2026-09-27T09:04:12Z', eventType: 'process_start', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4100', parentProcessId: null, image: 'C:\\Program Files\\Browser\\browser.exe', commandLine: 'browser.exe https://portal.example.test/verify/captcha', filePath: null, sha256: null, registryPath: null, action: 'fake_captcha_prompt_displayed', result: 'success', source: 'SyntheticEndpoint', url: 'https://portal.example.test/verify/captcha', pageText: 'Verification failed. Complete the CAPTCHA: press Win+R, paste the verification command, and press Enter.' },
      { id: 'M05-EVT-002', time: '2026-09-27T09:05:03Z', eventType: 'process_start', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4172', parentProcessId: '4100', image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', commandLine: 'powershell.exe -NoProfile -WindowStyle Hidden -EncodedCommand <synthetic-payload>', filePath: null, sha256: null, registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-003', time: '2026-09-27T09:05:18Z', eventType: 'process_start', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4224', parentProcessId: '4172', image: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', commandLine: 'syncsvc.exe --install --quiet', filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-004', time: '2026-09-27T09:05:19Z', eventType: 'file_create', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4224', parentProcessId: '4172', image: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', commandLine: null, filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), registryPath: null, action: 'file_create', result: 'created', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-005', time: '2026-09-27T09:05:20Z', eventType: 'file_hash', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4224', parentProcessId: '4172', image: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', commandLine: null, filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), registryPath: null, action: 'file_reputation_lookup', result: 'malicious', source: 'SyntheticThreatIntel', url: null, signer: 'Unsigned', prevalence: 1, reputation: 'malicious' },
      { id: 'M05-EVT-006', time: '2026-09-27T09:05:31Z', eventType: 'persistence_change', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '4224', parentProcessId: '4172', image: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', commandLine: null, filePath: null, sha256: 'a'.repeat(64), registryPath: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SyncService', action: 'registry_value_set', result: 'created', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-007', time: '2026-09-27T09:05:33Z', eventType: 'sensor_control', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'SYSTEM', processId: '4224', parentProcessId: null, image: 'C:\\Program Files\\EndpointAgent\\sensor.exe', commandLine: null, filePath: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), registryPath: null, action: 'execution_control', result: 'detected_not_prevented', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-012', time: '2026-09-27T09:11:59Z', eventType: 'process_start', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'SYSTEM', processId: '3020', parentProcessId: null, image: 'C:\\Windows\\System32\\services.exe', commandLine: 'services.exe', filePath: null, sha256: null, registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-008', time: '2026-09-27T09:12:04Z', eventType: 'process_start', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '5090', parentProcessId: '3020', image: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', commandLine: 'AcmeUpdate.exe /silent', filePath: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', sha256: 'b'.repeat(64), registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-009', time: '2026-09-27T09:12:05Z', eventType: 'file_hash', deviceId: 'M05-DEV-001', host: 'WS-ASSESS-27', user: 'CORP\\j.alvarez', processId: '5090', parentProcessId: '3020', image: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', commandLine: null, filePath: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', sha256: 'b'.repeat(64), registryPath: null, action: 'file_reputation_lookup', result: 'benign', source: 'SyntheticThreatIntel', url: null, signer: 'CN=Acme Software LLC', prevalence: 1842, reputation: 'benign' },
      { id: 'M05-EVT-013', time: '2026-09-27T09:13:37Z', eventType: 'process_start', deviceId: 'M05-DEV-002', host: 'WS-ASSESS-14', user: 'SYSTEM', processId: '2380', parentProcessId: null, image: 'C:\\Windows\\System32\\services.exe', commandLine: 'services.exe', filePath: null, sha256: null, registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-010', time: '2026-09-27T09:13:42Z', eventType: 'process_start', deviceId: 'M05-DEV-002', host: 'WS-ASSESS-14', user: 'CORP\\m.reyes', processId: '6110', parentProcessId: '2380', image: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', commandLine: 'AcmeUpdate.exe /check', filePath: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', sha256: 'b'.repeat(64), registryPath: null, action: 'process_start', result: 'success', source: 'SyntheticEndpoint', url: null },
      { id: 'M05-EVT-011', time: '2026-09-27T09:13:43Z', eventType: 'file_hash', deviceId: 'M05-DEV-002', host: 'WS-ASSESS-14', user: 'CORP\\m.reyes', processId: '6110', parentProcessId: '2380', image: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', commandLine: null, filePath: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', sha256: 'b'.repeat(64), registryPath: null, action: 'file_reputation_lookup', result: 'benign', source: 'SyntheticThreatIntel', url: null, signer: 'CN=Acme Software LLC', prevalence: 1842, reputation: 'benign' },
      /* Sprint 3 background, alternate-explanation and coverage rows. Purposes are listed in fixtureNotes. */
      // WS-ASSESS-27 (affected device): ordinary collaboration, browser, update and sensor activity.
      row(14, '09:01:14', 'process_start', 'M05-DEV-001', 'CORP\\j.alvarez', { processId: '2216', image: TEAMS, commandLine: 'ms-teams.exe --system-initiated', filePath: TEAMS, sha256: sha('5e1f3c'), signer: MS }),
      lookup(15, '09:01:15', 'M05-DEV-001', 'CORP\\j.alvarez', '2216', null, TEAMS, sha('5e1f3c'), MS, 48210),
      conn(16, '09:01:22', 'M05-DEV-001', 'CORP\\j.alvarez', '2216', null, TEAMS, 'teams.microsoft.com', 'timed_out'),
      conn(17, '09:01:26', 'M05-DEV-001', 'CORP\\j.alvarez', '2216', null, TEAMS, 'teams.microsoft.com'),
      row(18, '09:02:10', 'process_start', 'M05-DEV-001', 'SYSTEM', { processId: '1012', image: SVCHOST, commandLine: 'svchost.exe -k netsvcs -p -s Schedule', filePath: SVCHOST }),
      row(19, '09:02:41', 'scheduled_task', 'M05-DEV-001', 'SYSTEM', { processId: '1012', action: 'task_execution', result: 'started', source: 'SyntheticTaskScheduler', taskName: 'MicrosoftEdgeUpdateTaskMachineCore', taskPath: '\\MicrosoftEdgeUpdateTaskMachineCore' }),
      row(20, '09:02:44', 'process_start', 'M05-DEV-001', 'SYSTEM', { processId: '2907', parentProcessId: '1012', image: EDGE_UPD, commandLine: 'MicrosoftEdgeUpdate.exe /ua /installsource scheduler', filePath: EDGE_UPD, sha256: sha('9d27e4'), signer: MS }),
      row(21, '09:06:10', 'file_create', 'M05-DEV-001', 'CORP\\j.alvarez', { processId: '4100', image: 'C:\\Program Files\\Browser\\browser.exe', filePath: PDF, sha256: sha('27b8d1'), action: 'file_download_completed', result: 'created' }),
      row(22, '09:06:11', 'file_hash', 'M05-DEV-001', 'CORP\\j.alvarez', { processId: '4100', image: 'C:\\Program Files\\Browser\\browser.exe', filePath: PDF, sha256: sha('27b8d1'), action: 'file_reputation_lookup', result: 'benign', source: 'SyntheticThreatIntel', signer: 'Not applicable (document)', prevalence: 214, reputation: 'benign' }),
      conn(23, '09:12:06', 'M05-DEV-001', 'CORP\\j.alvarez', '5090', '3020', ACME, ACME_DEST),
      heartbeat(24, '09:00:05', 'M05-DEV-001'),
      heartbeat(25, '09:29:50', 'M05-DEV-001'),
      // WS-ASSESS-14: office work plus a repeat of the signed updater check (retry/duplicate).
      row(26, '09:09:50', 'process_start', 'M05-DEV-002', 'CORP\\m.reyes', { processId: '3320', image: EXCEL, commandLine: 'EXCEL.EXE "C:\\Users\\m.reyes\\Documents\\FY26-budget.xlsx"', filePath: EXCEL, sha256: sha('61c4f0'), signer: MS }),
      conn(27, '09:13:44', 'M05-DEV-002', 'CORP\\m.reyes', '6110', '2380', ACME, ACME_DEST),
      row(28, '09:18:42', 'process_start', 'M05-DEV-002', 'CORP\\m.reyes', { processId: '6480', parentProcessId: '2380', image: ACME, commandLine: 'AcmeUpdate.exe /check', filePath: ACME, sha256: 'b'.repeat(64) }),
      conn(29, '09:18:44', 'M05-DEV-002', 'CORP\\m.reyes', '6480', '2380', ACME, ACME_DEST),
      heartbeat(30, '09:00:08', 'M05-DEV-002'),
      // SRV-ASSESS-02: scheduled backup PowerShell (policy-bypass look-alike with signed script, service account, task record).
      row(31, '09:00:30', 'process_start', 'M05-DEV-003', 'SYSTEM', { processId: '880', image: SVCHOST, commandLine: 'svchost.exe -k netsvcs -p -s Schedule', filePath: SVCHOST }),
      row(32, '09:02:00', 'scheduled_task', 'M05-DEV-003', 'CORP\\svc-backup', { processId: '880', action: 'task_execution', result: 'started', source: 'SyntheticTaskScheduler', taskName: 'HourlyShareSnapshot', taskPath: '\\IT\\HourlyShareSnapshot' }),
      row(33, '09:02:03', 'process_start', 'M05-DEV-003', 'CORP\\svc-backup', { processId: '1544', parentProcessId: '880', image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', commandLine: 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\\Ops\\Scripts\\Snapshot-Shares.ps1', filePath: SNAP_PS1, sha256: sha('3a96c8'), signer: 'CN=Contoso IT Operations' }),
      lookup(34, '09:02:04', 'M05-DEV-003', 'CORP\\svc-backup', '1544', '880', SNAP_PS1, sha('3a96c8'), 'CN=Contoso IT Operations', 6),
      row(35, '09:02:30', 'file_create', 'M05-DEV-003', 'CORP\\svc-backup', { processId: '1544', parentProcessId: '880', image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', filePath: 'D:\\Snapshots\\Shares\\2026-09-27_0902.vhdx', sha256: sha('84e5b2'), action: 'file_create', result: 'created' }),
      { ...conn(36, '09:02:31', 'M05-DEV-003', 'CORP\\svc-backup', '1544', '880', 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'backup-nas.corp.example'), destinationPort: 445 },
      heartbeat(37, '09:00:07', 'M05-DEV-003'),
      // WS-ASSESS-31: managed software install that writes a Run key (persistence look-alike with approved signer and deployment chain).
      row(38, '09:06:50', 'process_start', 'M05-DEV-004', 'SYSTEM', { processId: '2104', image: 'C:\\Windows\\CCM\\CcmExec.exe', commandLine: 'CcmExec.exe', filePath: 'C:\\Windows\\CCM\\CcmExec.exe', sha256: sha('0f6b29'), signer: MS }),
      row(39, '09:07:10', 'process_start', 'M05-DEV-004', 'SYSTEM', { processId: '5210', parentProcessId: '2104', image: 'C:\\Windows\\System32\\msiexec.exe', commandLine: 'msiexec.exe /i C:\\Windows\\ccmcache\\4\\FabrikamSync-6.2.msi /qn', filePath: 'C:\\Windows\\System32\\msiexec.exe' }),
      row(40, '09:07:24', 'file_create', 'M05-DEV-004', 'SYSTEM', { processId: '5210', parentProcessId: '2104', image: 'C:\\Windows\\System32\\msiexec.exe', filePath: FAB, sha256: sha('d13f7a'), action: 'file_create', result: 'created' }),
      lookup(41, '09:07:25', 'M05-DEV-004', 'SYSTEM', '5210', '2104', FAB, sha('d13f7a'), 'CN=Fabrikam Software Inc.', 2210),
      row(42, '09:07:31', 'persistence_change', 'M05-DEV-004', 'SYSTEM', { processId: '5210', parentProcessId: '2104', image: 'C:\\Windows\\System32\\msiexec.exe', sha256: sha('d13f7a'), registryPath: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\FabrikamSync', action: 'registry_value_set', result: 'created' }),
      row(43, '09:07:46', 'sensor_control', 'M05-DEV-004', 'SYSTEM', { processId: '5290', image: SENSOR, filePath: FAB, sha256: sha('d13f7a'), action: 'execution_control', result: 'allowed_approved_software' }),
      row(44, '09:07:45', 'process_start', 'M05-DEV-004', 'CORP\\d.okafor', { processId: '5290', parentProcessId: '5210', image: FAB, commandLine: 'FabrikamSync.exe --first-run', filePath: FAB, sha256: sha('d13f7a'), signer: 'CN=Fabrikam Software Inc.' }),
      row(45, '09:20:15', 'process_start', 'M05-DEV-004', 'CORP\\d.okafor', { processId: '5902', image: CHROME, commandLine: 'chrome.exe --profile-directory=Default', filePath: CHROME, sha256: sha('72ac4e'), signer: 'CN=Google LLC' }),
      conn(46, '09:20:19', 'M05-DEV-004', 'CORP\\d.okafor', '5902', null, CHROME, 'intranet.corp.example'),
      heartbeat(47, '09:00:06', 'M05-DEV-004'),
      // WS-ASSESS-40: planned sensor upgrade creates a bounded telemetry gap (coverage record).
      heartbeat(48, '09:00:09', 'M05-DEV-005'),
      row(49, '09:03:12', 'process_start', 'M05-DEV-005', 'CORP\\l.chen', { processId: '2750', image: WINWORD, commandLine: 'WINWORD.EXE /n', filePath: WINWORD, sha256: sha('4b0d93'), signer: MS }),
      heartbeat(50, '09:06:55', 'M05-DEV-005', { action: 'sensor_service_stopped', result: 'stopped_for_agent_upgrade', coverageStatus: 'Gap', commandLine: 'Agent upgrade 7.4.1 to 7.5.0, change CHG-5120' }),
      heartbeat(51, '09:19:20', 'M05-DEV-005', { action: 'sensor_service_started', result: 'reporting_resumed', coverageStatus: 'Partial', commandLine: 'No telemetry received 09:06:55 to 09:19:20' }),
      row(52, '09:25:05', 'process_start', 'M05-DEV-005', 'CORP\\l.chen', { processId: '3101', image: 'C:\\Windows\\System32\\notepad.exe', commandLine: 'notepad.exe', filePath: 'C:\\Windows\\System32\\notepad.exe' }),
    ],
    fixtureNotes: {
      eventPurposes: {
        'M05-EVT-014..017': 'background: signed collaboration client with a transient connection retry (duplicate-looking pair).',
        'M05-EVT-018..020': 'background: scheduled signed updater task, ordinary svchost parent.',
        'M05-EVT-021..022': 'alternate explanation: post-compromise download on the affected host that is a benign document with no child process.',
        'M05-EVT-023': 'hypothesis test: the signed updater on the affected host uses a vendor domain; the payload has no network record.',
        'M05-EVT-024..025': 'evidence quality: sensor heartbeats bound the coverage window for negative evidence.',
        'M05-EVT-026..030': 'background and tuning: repeat updater check with the same hash and parent.',
        'M05-EVT-031..037': 'alternate explanation: PowerShell with ExecutionPolicy Bypass launched by a scheduled task under a service account with a signed script.',
        'M05-EVT-038..047': 'alternate explanation: Run-key write by a managed installer with approved signer, high prevalence and a deployment parent chain.',
        'M05-EVT-048..052': 'coverage: planned sensor upgrade interval with no telemetry.',
      },
    },
    expectedTruth: {
      confirmedDevice: { value: 'M05-DEV-001', eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003'] },
      confirmedUser: { value: 'CORP\\j.alvarez', eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003', 'M05-EVT-006'] },
      processAncestry: { chain: ['4100', '4172', '4224'], eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003'] },
      maliciousFile: { path: 'C:\\Users\\j.alvarez\\AppData\\Local\\Temp\\syncsvc.exe', sha256: 'a'.repeat(64), signer: 'Unsigned', prevalence: 1, reputation: 'malicious', eventIds: ['M05-EVT-003', 'M05-EVT-004', 'M05-EVT-005'] },
      persistence: { registryPath: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SyncService', outcome: 'created', eventIds: ['M05-EVT-006'] },
      endpointControl: { outcome: 'detection_only_execution_not_prevented', eventIds: ['M05-EVT-007'] },
      benignActivity: [
        { type: 'signed_updater', eventIds: ['M05-EVT-008', 'M05-EVT-009'] },
        { type: 'same_updater_other_device', eventIds: ['M05-EVT-010', 'M05-EVT-011'] },
      ],
      scope: { deviceIds: ['M05-DEV-001'], eventIds: ['M05-EVT-001', 'M05-EVT-002', 'M05-EVT-003', 'M05-EVT-004', 'M05-EVT-005', 'M05-EVT-006', 'M05-EVT-007'] },
      // Sprint 3 additions below are not read by the scorer; they document background and boundary evidence.
      benignBackground: [
        { type: 'routine_collaboration_browser_and_edge_update', deviceId: 'M05-DEV-001', eventIds: ['M05-EVT-014', 'M05-EVT-015', 'M05-EVT-016', 'M05-EVT-017', 'M05-EVT-018', 'M05-EVT-019', 'M05-EVT-020', 'M05-EVT-021', 'M05-EVT-022', 'M05-EVT-023'] },
        { type: 'office_work_and_repeat_signed_updater_check', deviceId: 'M05-DEV-002', eventIds: ['M05-EVT-026', 'M05-EVT-027', 'M05-EVT-028', 'M05-EVT-029'] },
        { type: 'scheduled_signed_backup_script_with_policy_bypass_flag', deviceId: 'M05-DEV-003', eventIds: ['M05-EVT-031', 'M05-EVT-032', 'M05-EVT-033', 'M05-EVT-034', 'M05-EVT-035', 'M05-EVT-036'] },
        { type: 'managed_install_with_run_key_and_user_activity', deviceId: 'M05-DEV-004', eventIds: ['M05-EVT-038', 'M05-EVT-039', 'M05-EVT-040', 'M05-EVT-041', 'M05-EVT-042', 'M05-EVT-043', 'M05-EVT-044', 'M05-EVT-045', 'M05-EVT-046'] },
        { type: 'ordinary_office_activity_around_sensor_upgrade', deviceId: 'M05-DEV-005', eventIds: ['M05-EVT-049', 'M05-EVT-052'] },
      ],
      coverageGaps: [
        { deviceId: 'M05-DEV-005', windowStart: '2026-09-27T09:06:55Z', windowEnd: '2026-09-27T09:19:20Z', eventIds: ['M05-EVT-050', 'M05-EVT-051'], note: 'Planned sensor upgrade: no endpoint telemetry exists for this device in the interval, so absence of records is not evidence of absence of activity.' },
      ],
      negativeEvidence: {
        statement: 'No outbound network connection by syncsvc.exe is recorded on WS-ASSESS-27 between 09:00:00Z and 09:30:00Z. Sensor heartbeats at 09:00:05Z and 09:29:50Z record Full coverage, so the statement is bounded to this device, source (DeviceNetworkEvents) and window; it does not rule out activity on devices or periods without coverage.',
        deviceId: 'M05-DEV-001', table: 'DeviceNetworkEvents', match: 'syncsvc.exe', result: 'no_match',
        coverageEventIds: ['M05-EVT-024', 'M05-EVT-025'],
      },
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();

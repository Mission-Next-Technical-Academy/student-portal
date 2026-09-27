/* Independent, immutable Module 05 assessment fixture contract. */
const SocM05AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

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
    ],
    telemetrySchema: {
      description: 'Endpoint observations use this fixed record shape. Optional file metadata is attached to file_hash observations.',
      required: ['id', 'time', 'eventType', 'deviceId', 'host', 'user', 'processId', 'parentProcessId', 'image', 'commandLine', 'filePath', 'sha256', 'registryPath', 'action', 'result', 'source'],
      fields: {
        id: 'string: unique scenario-local event identifier',
        time: 'string: ISO-8601 UTC timestamp within the scenario window',
        eventType: 'enum: process_start | file_create | file_hash | persistence_change | sensor_control',
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
    ],
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
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();

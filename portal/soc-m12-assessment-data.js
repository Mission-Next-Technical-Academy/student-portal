/* Independent cumulative Module 12 shift scenario and rubric truth. */
const SocM12AssessmentData = (() => {
  'use strict';
  const freeze = (value) => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value); Object.values(value).forEach(freeze); return value;
  };
  const scenario = {
    id: 'M12-AMBER-FINCH-2026-09-27', caseId: 'INC-4821', stateKey: 'm12-cumulative-soc-assessment-v1', // gitleaks:allow
    start: '2026-09-27T08:00:00Z', end: '2026-09-27T16:00:00Z', fixedAt: '2026-09-27T16:00:00Z',
    shift: { id: 'SHIFT-0927-CAPSTONE', label: 'Day shift 08:00–16:00 UTC', handoffTo: 'Evening incident lead' },
    entities: [
      { id: 'ws-204', kind: 'device', label: 'WS-204', status: 'affected', owner: 'acct-204' },
      { id: 'acct-204', kind: 'identity', label: 'acct-204', status: 'affected' },
      { id: 'ws-118', kind: 'device', label: 'WS-118', status: 'benign-pivot' },
      { id: 'acct-091', kind: 'identity', label: 'acct-091', status: 'unrelated' },
      { id: '203.0.113.72', kind: 'indicator', label: '203.0.113.72', status: 'malicious-contextual' },
    ],
    evidence: [
      { id: 'EM-212', source: 'EmailEvents', entityIds: ['acct-204', 'ws-204'], at: '2026-09-27T09:08:00Z', class: 'primary' },
      { id: 'EP-301', source: 'DeviceProcessEvents', entityIds: ['ws-204'], at: '2026-09-27T09:14:00Z', class: 'primary' },
      { id: 'EP-303', source: 'DeviceRegistryEvents', entityIds: ['ws-204'], at: '2026-09-27T09:17:00Z', class: 'primary' },
      { id: 'ID-402', source: 'IdentityLogonEvents', entityIds: ['acct-204'], at: '2026-09-27T09:18:00Z', class: 'primary' },
      { id: 'NW-501', source: 'NetworkSessionEvents', entityIds: ['ws-204', '203.0.113.72'], at: '2026-09-27T09:15:00Z', class: 'primary' },
      { id: 'NW-504', source: 'NetworkSessionEvents', entityIds: ['ws-118'], at: '2026-09-27T10:02:00Z', class: 'supporting' },
      { id: 'BEN-101', source: 'DeviceProcessEvents', entityIds: ['ws-118'], at: '2026-09-27T09:12:00Z', class: 'benign' },
    ],
    queue: [
      { id: 'AL-1201', severity: 'high', entityId: 'ws-204', status: 'new', signal: 'Suspicious script execution', at: '09:14:00' },
      { id: 'AL-1202', severity: 'medium', entityId: 'acct-204', status: 'new', signal: 'Unfamiliar token refresh' },
      { id: 'AL-1203', severity: 'low', entityId: 'ws-118', status: 'new', signal: 'Rare script host' },
      { id: 'AL-1204', severity: 'medium', entityId: 'acct-091', status: 'new', signal: 'Repeated sign-in failures', at: '08:12:00' },
      { id: 'AL-1205', severity: 'medium', entityId: 'ws-118', status: 'new', signal: 'Approved inventory script used an encoded argument', at: '08:40:00' },
      { id: 'AL-1206', severity: 'medium', entityId: 'ws-142', status: 'new', signal: 'Rare external destination contacted', at: '10:20:00' },
      { id: 'AL-1207', severity: 'medium', entityId: 'acct-133', status: 'new', signal: 'Sign-in from an unfamiliar country', at: '10:50:00' },
      { id: 'AL-1208', severity: 'medium', entityId: 'acct-112', status: 'new', signal: 'Message failed DKIM and reply-to check', at: '09:05:00' },
      { id: 'AL-1209', severity: 'low', entityId: 'ws-131', status: 'new', signal: 'Sensor stopped reporting', at: '11:10:00' },
      { id: 'AL-1210', severity: 'medium', entityId: 'bkp-01', status: 'new', signal: 'Large outbound transfer', at: '12:00:00' },
      { id: 'AL-1211', severity: 'low', entityId: 'ws-177', status: 'new', signal: 'New Run key created', at: '12:01:00' },
      { id: 'AL-1212', severity: 'medium', entityId: 'ws-177', status: 'new', signal: 'Script host ran policy-update.js', at: '08:50:00' },
      { id: 'AL-1213', severity: 'low', entityId: 'svc-patch', status: 'new', signal: 'Service account sign-in failures', at: '11:22:00' },
      { id: 'AL-1214', severity: 'medium', entityId: 'svc-report', status: 'new', signal: 'Bulk application export', at: '12:00:00' },
    ],
    rules: [
      { id: 'RULE-01', queryOutcome: 'broad', title: 'All script host launches' },
      { id: 'RULE-02', queryOutcome: 'narrow', title: 'Only exact hash on WS-204' },
      { id: 'RULE-03', queryOutcome: 'correlated', title: 'Process + hash + destination in window' },
    ],
    backups: [{ id: 'BK-204-0900', deviceId: 'ws-204', trust: 'verified-pre-incident', at: '2026-09-27T09:00:00Z' }, { id: 'BK-204-0930', deviceId: 'ws-204', trust: 'post-compromise', at: '2026-09-27T09:30:00Z' }],
    intelligence: [{ id: 'TI-601', indicator: '203.0.113.72', confidence: 'high', context: 'deny-list match; associated with commodity loader infrastructure' }, { id: 'TI-603', indicator: '198.51.100.20', confidence: 'benign', context: 'approved signed update service' }, { id: 'TI-602', indicator: '7a51…c902', confidence: 'high', context: 'unsigned script; clustered as "Amber Finch" by external reporting' }, { id: 'TI-604', indicator: 'update-check.example', confidence: 'medium', context: 'newly observed domain; no prior reputation' }, { id: 'TI-605', indicator: '203.0.113.140', confidence: 'benign', context: 'vendor monitoring service; approved under CHG-9201' }],
    workflowNodes: ['preserve', 'approval', 'isolate', 'revoke-session', 'block-indicator', 'remove-persistence', 'restore', 'scan', 'monitor'],
  };
  /* Sprint 6: shift-wide synthetic telemetry (background, alternate explanations, coverage). Rows are student
   * visible; purposes live only in expectedTruth.telemetryPurposes (instructor-only). Native fields are kept. */
  const H = (head, tail, fill) => (head + fill.repeat(64)).slice(0, 64 - tail.length) + tail;
  const HASH_AMBER = H('7a51', 'c902', '3e9d41b7'), HASH_ITOPS = H('b04c', '17e8', '5d02a6f9'), HASH_INV = H('91fe', '6a30', 'c47b18d2'), HASH_MON = H('2d68', 'e4b1', '70fa93c5');
  const R = (EventSource, EventId, at, f) => ({ EventSource, EventId, at, ...f });
  const idp = (id, at, acct, ip, res, extra) => R('IdentityLogonEvents', id, at, { EventType: 'SignIn', Account: acct, Host: 'idp-02', SourceIp: ip, Result: res, AuthMethod: 'Password + MFA', Country: 'Internal', ...extra });
  const em = (id, at, acct, sender, subject, extra) => R('EmailEvents', id, at, { EventType: 'MessageDelivered', Account: acct, Host: 'mail-edge-02', Sender: sender, Subject: subject, Result: 'Allowed', SpfResult: 'pass', DkimResult: 'pass', DmarcResult: 'pass', ...extra });
  const ep = (id, at, host, acct, type, extra) => R('DeviceProcessEvents', id, at, { EventType: type, Account: acct, Host: host, DeviceId: host, Result: 'Allowed', ...extra });
  const hb = (id, at, host, type, cov, detail, res) => R('DeviceSensorHealth', id, at, { EventType: type, Account: 'system', Host: host, DeviceId: host, Result: res || 'Success', Collector: 'edr-collector-01', CoverageStatus: cov, Detail: detail });
  const px = (id, at, host, ip, url, domain, res, detail, extra) => R('ProxyEvents', id, at, { EventType: 'ProxyRequest', Account: 'svc-proxy', Host: host, DeviceId: host, SourceIp: ip, Url: url, Domain: domain, Result: res, Collector: 'proxy-collector-01', Detail: detail, ...extra });
  const dns = (id, at, host, ip, domain, answers, res, detail) => R('DnsEvents', id, at, { EventType: 'DnsQuery', Account: 'system', Host: host, DeviceId: host, SourceIp: ip, Domain: domain, Answers: answers, Result: res, Detail: detail });
  const fw = (id, at, src, dst, port, res, bytes, detail) => R('FirewallEvents', id, at, { EventType: 'FirewallFlow', Account: 'svc-gw', Host: 'FW-EDGE-01', SourceIp: src, DestinationIp: dst, DestinationPort: port, Result: res, Bytes: bytes, Detail: detail });
  const IP = { 'WS-204': '192.0.2.24', 'WS-118': '192.0.2.18', 'WS-131': '192.0.2.31', 'WS-142': '192.0.2.42', 'WS-177': '192.0.2.77' };
  const telemetry = [
    // Identity / authentication
    idp('ID-401', '09:00:00', 'acct-204', '192.0.2.24', 'Success', { Host: 'WS-204', DeviceId: 'WS-204', Detail: 'Managed WS-204 · MFA satisfied · usual address', SessionId: 'S-2041' }),
    idp('ID-403', '09:31:00', 'acct-204', '203.0.113.72', 'Blocked', { Detail: 'Owner denied the unfamiliar session from the access prompt', SessionId: 'S-2049', Country: 'Unknown' }),
    idp('ID-404', '09:20:00', 'backup-job', '192.0.2.80', 'Success', { Host: 'BKP-01', Account: 'backup-job', AuthMethod: 'Service credential', Detail: 'Registered backup server; scheduled weekend job', SessionId: 'JOB-BK-0920' }),
    idp('ID-405', '08:02:10', 'acct-112', '192.0.2.12', 'Success', { SessionId: 'S-1121', Detail: 'MFA satisfied' }),
    idp('ID-406', '08:05:40', 'acct-133', '192.0.2.33', 'Success', { SessionId: 'S-1331', Detail: 'MFA satisfied' }),
    idp('ID-407', '08:08:25', 'acct-157', '192.0.2.57', 'Success', { SessionId: 'S-1571', Detail: 'MFA satisfied' }),
    idp('ID-408', '08:10:05', 'acct-091', '192.0.2.91', 'Failure', { AuthMethod: 'Password', Detail: 'Invalid password' }),
    idp('ID-409', '08:10:41', 'acct-091', '192.0.2.91', 'Failure', { AuthMethod: 'Password', Detail: 'Invalid password' }),
    idp('ID-410', '08:11:20', 'acct-091', '192.0.2.91', 'Failure', { AuthMethod: 'Password', Detail: 'Invalid password' }),
    idp('ID-411', '08:13:02', 'acct-091', '192.0.2.91', 'Success', { SessionId: 'S-0911', Detail: 'MFA satisfied after the password was entered correctly' }),
    idp('ID-412', '08:20:00', 'acct-166', '192.0.2.66', 'Success', { SessionId: 'S-1661', Detail: 'MFA satisfied' }),
    idp('ID-413', '08:30:15', 'acct-188', '192.0.2.88', 'Success', { SessionId: 'S-1881', Detail: 'MFA satisfied' }),
    idp('ID-415', '09:40:30', 'acct-112', '192.0.2.12', 'Success', { EventType: 'TokenRefresh', SessionId: 'S-1121', Detail: 'Routine refresh of an existing managed session' }),
    idp('ID-416', '10:50:12', 'acct-133', '198.51.100.77', 'Success', { SessionId: 'S-1332', Country: 'DE', Detail: 'MFA satisfied; managed laptop LT-133 reported compliant' }),
    idp('ID-417', '12:30:44', 'acct-133', '198.51.100.77', 'Success', { EventType: 'TokenRefresh', SessionId: 'S-1332', Country: 'DE', Detail: 'Refresh of the 10:50 session' }),
    idp('ID-418', '13:05:20', 'acct-157', '192.0.2.57', 'Success', { SessionId: 'S-1572', Detail: 'MFA satisfied' }),
    idp('ID-420', '14:02:11', 'acct-091', '192.0.2.91', 'Success', { SessionId: 'S-0912', Detail: 'MFA satisfied' }),
    idp('ID-421', '14:30:09', 'acct-112', '192.0.2.12', 'Success', { SessionId: 'S-1122', Detail: 'MFA satisfied' }),
    idp('ID-422', '15:10:50', 'acct-166', '192.0.2.66', 'Success', { SessionId: 'S-1662', Detail: 'MFA satisfied' }),
    R('AuthLog', 'AU-001', '11:20:08', { EventType: 'SignIn', Account: 'svc-patch', Host: 'DC-01', DeviceId: 'DC-01', SourceIp: '192.0.2.70', Result: 'Failure', AuthMethod: 'Service credential', Detail: 'Credential expired; rotation scheduled in the weekend change window' }),
    R('AuthLog', 'AU-002', '11:21:08', { EventType: 'SignIn', Account: 'svc-patch', Host: 'DC-01', DeviceId: 'DC-01', SourceIp: '192.0.2.70', Result: 'Failure', AuthMethod: 'Service credential', Detail: 'Credential expired; retry from the patch scheduler' }),
    R('AuthLog', 'AU-003', '11:22:08', { EventType: 'SignIn', Account: 'svc-patch', Host: 'DC-01', DeviceId: 'DC-01', SourceIp: '192.0.2.70', Result: 'Failure', AuthMethod: 'Service credential', Detail: 'Credential expired; retry from the patch scheduler' }),
    R('AuthLog', 'AU-004', '11:36:30', { EventType: 'SignIn', Account: 'svc-patch', Host: 'DC-01', DeviceId: 'DC-01', SourceIp: '192.0.2.70', Result: 'Success', AuthMethod: 'Service credential', Detail: 'New credential accepted after rotation CHG-9207' }),
    // Directory
    R('DirectoryAudit', 'DA-001', '08:35:00', { EventType: 'PasswordReset', Account: 'acct-091', Host: 'DC-01', SourceIp: '192.0.2.66', Result: 'Success', InitiatedBy: 'acct-166', Detail: 'Help desk password reset, ticket HD-4410' }),
    R('DirectoryAudit', 'DA-002', '09:50:00', { EventType: 'GroupMemberAdded', Account: 'acct-112', Host: 'DC-01', SourceIp: '192.0.2.66', Result: 'Success', InitiatedBy: 'acct-166', TargetGroup: 'Finance-Reporting', Detail: 'Group membership change, ticket HD-4412' }),
    R('DirectoryAudit', 'DA-003', '11:30:00', { EventType: 'ServiceCredentialRotated', Account: 'svc-patch', Host: 'DC-01', SourceIp: '192.0.2.11', Result: 'Success', InitiatedBy: 'acct-166', ChangeId: 'CHG-9207', Detail: 'Planned rotation in the weekend change window' }),
    R('DirectoryAudit', 'DA-004', '13:20:00', { EventType: 'DeviceJoined', Account: 'system', Host: 'DC-01', SourceIp: '192.0.2.31', Result: 'Success', InitiatedBy: 'acct-166', Detail: 'WS-131 re-registered after agent upgrade restart' }),
    R('DirectoryAudit', 'DA-005', '14:40:00', { EventType: 'AccountPropertyChanged', Account: 'acct-188', Host: 'DC-01', SourceIp: '192.0.2.66', Result: 'Success', InitiatedBy: 'acct-166', Detail: 'Department attribute corrected, ticket HD-4419' }),
    // Application
    ...[['AP-001', '08:45:10', 'acct-112', 'ReportView', 'Weekly ledger summary', '1', '192.0.2.12'], ['AP-002', '09:10:30', 'acct-204', 'ReportView', 'Accounts payable aging', '1', '192.0.2.24'], ['AP-003', '09:55:00', 'acct-112', 'Export', 'Ledger extract', '120', '192.0.2.12'], ['AP-004', '10:30:20', 'acct-133', 'ReportView', 'Expense summary', '1', '198.51.100.77'], ['AP-006', '13:15:00', 'acct-157', 'ReportView', 'Budget variance', '1', '192.0.2.57'], ['AP-008', '15:00:00', 'acct-112', 'Export', 'Month-end checklist', '15', '192.0.2.12']]
      .map(([id, at, a, act, obj, n, ip]) => R('AppAudit', id, at, { EventType: act, Account: a, Host: 'APP-FIN-01', SourceIp: ip, Result: 'Success', Application: 'FinLedger', Records: n, Detail: obj })),
    R('AppAudit', 'AP-005', '12:00:00', { EventType: 'BulkExport', Account: 'svc-report', Host: 'APP-FIN-01', SourceIp: '192.0.2.60', Result: 'Success', Application: 'FinLedger', Records: '4800', SessionId: 'JOB-FIN-1200', ChangeId: 'CHG-9207', Detail: 'Scheduled month-end ledger export to the finance share' }),
    R('AppAudit', 'AP-007', '14:20:00', { EventType: 'RecordView', Account: 'acct-188', Host: 'APP-HR-01', SourceIp: '192.0.2.88', Result: 'Success', Application: 'HRPortal', Records: '1', Detail: 'Own team roster' }),
    // System / syslog
    R('SystemLog', 'SL-001', '08:03:00', { EventType: 'ConfigUpdate', Account: 'system', Host: 'mail-edge-02', SourceIp: '192.0.2.25', Result: 'Success', Detail: 'Antispam engine and signature update applied; engine current' }),
    R('SystemLog', 'SL-002', '08:30:00', { EventType: 'CertRenewal', Account: 'system', Host: 'idp-02', SourceIp: '192.0.2.10', Result: 'Success', Detail: 'Token-signing certificate renewed ahead of expiry' }),
    R('SystemLog', 'SL-003', '10:15:00', { EventType: 'PostDeliveryPurge', Account: 'system', Host: 'mail-edge-02', SourceIp: '192.0.2.25', Result: 'Success', Detail: 'Updated signatures quarantined 2 delivered messages from benefits-review.example' }),
    R('SystemLog', 'SL-004', '11:00:00', { EventType: 'ServiceRestart', Account: 'system', Host: 'APP-FIN-01', SourceIp: '192.0.2.60', Result: 'Success', ChangeId: 'CHG-9207', Detail: 'Planned application restart in the weekend change window' }),
    R('SystemLog', 'SL-005', '13:00:00', { EventType: 'LogRotation', Account: 'system', Host: 'PROXY-01', SourceIp: '192.0.2.5', Result: 'Delayed', Detail: 'Proxy log rotation; queued records forwarded to the collector late' }),
    R('SystemLog', 'SL-006', '14:30:00', { EventType: 'DiskThreshold', Account: 'system', Host: 'FS-01', SourceIp: '192.0.2.50', Result: 'Success', Detail: 'Volume at 81% after month-end export; below action threshold' }),
    // Email
    em('EM-210', '09:02:00', 'acct-204', 'notify@benefits-partner.example', 'Benefits enrollment correction', { Detail: 'Benefits enrollment correction · partner sender' }),
    em('EM-211', '09:03:00', 'acct-204', 'reply@benefits-review.example', 'Benefits enrollment correction (action needed)', { DkimResult: 'fail', DmarcResult: 'fail', ReplyTo: 'reply@benefits-review-help.example', Detail: 'SPF pass; DKIM fail; reply-to differs from sender domain' }),
    em('EM-213', '08:57:00', 'all-staff', 'people-ops@mission-next.example', 'Quarterly wellness newsletter', { Audience: 'All staff', Detail: 'Internal bulk mail' }),
    em('EM-214', '08:20:00', 'acct-112', 'invoices@supplier-a.example', 'Invoice batch 0927', { Detail: 'Known supplier; attachment scanned clean' }),
    em('EM-215', '08:41:00', 'acct-133', 'calendar@mission-next.example', 'Travel day calendar update', { Detail: 'Internal calendar notice' }),
    em('EM-216', '09:05:00', 'acct-112', 'reply@benefits-review.example', 'Benefits enrollment correction (action needed)', { DkimResult: 'fail', DmarcResult: 'fail', ReplyTo: 'reply@benefits-review-help.example', Detail: 'SPF pass; DKIM fail; reply-to differs from sender domain' }),
    em('EM-217', '09:05:30', 'acct-157', 'reply@benefits-review.example', 'Benefits enrollment correction (action needed)', { DkimResult: 'fail', DmarcResult: 'fail', ReplyTo: 'reply@benefits-review-help.example', Detail: 'SPF pass; DKIM fail; reply-to differs from sender domain' }),
    em('EM-218', '10:15:10', 'acct-157', 'reply@benefits-review.example', 'Benefits enrollment correction (action needed)', { EventType: 'MessageQuarantined', Result: 'Blocked', DkimResult: 'fail', DmarcResult: 'fail', Detail: 'Delivered message removed after signature update' }),
    em('EM-219', '08:01:00', 'acct-091', 'it-notices@mission-next.example', 'Password expires in 2 days', { Detail: 'Internal IT notice; links to the intranet password page' }),
    em('EM-220', '10:40:00', 'acct-188', 'talent@recruiting-agency.example', 'Candidate shortlist', { EventType: 'MessageQuarantined', Result: 'Blocked', SpfResult: 'softfail', DkimResult: 'none', DmarcResult: 'none', Detail: 'Bulk recruiter mail held by policy' }),
    em('EM-221', '11:05:00', 'all-staff', 'it-notices@mission-next.example', 'Weekend maintenance window notice', { Audience: 'All staff', Detail: 'Planned work CHG-9207' }),
    em('EM-222', '12:15:00', 'acct-133', 'tickets@airline-booking.example', 'Return itinerary', { Detail: 'Travel booking confirmation' }),
    em('EM-223', '13:30:00', 'acct-166', 'helpdesk@mission-next.example', 'Ticket HD-4419 updated', { Detail: 'Internal ticket notification' }),
    em('EM-224', '09:29:00', 'acct-204', 'acct-204@mission-next.example', 'FW: Benefits enrollment correction (action needed)', { EventType: 'UserReportedMessage', Recipient: 'secops@mission-next.example', Detail: 'Recipient forwarded the message to the security mailbox' }),
    R('EmailUrlEvents', 'EU-001', '09:05:20', { EventType: 'UrlRewritten', Account: 'acct-112', Host: 'mail-edge-02', Domain: 'benefits-review.example', Url: 'https://benefits-review.example/enroll', Result: 'Allowed', ClickCount: '0', Detail: 'Link rewritten for click-time protection; no click recorded in the mail-click log' }),
    R('EmailUrlEvents', 'EU-002', '09:05:50', { EventType: 'UrlRewritten', Account: 'acct-157', Host: 'mail-edge-02', Domain: 'benefits-review.example', Url: 'https://benefits-review.example/enroll', Result: 'Allowed', ClickCount: '0', Detail: 'Link rewritten for click-time protection; no click recorded in the mail-click log' }),
    R('EmailUrlEvents', 'EU-003', '08:57:30', { EventType: 'UrlScanned', Account: 'all-staff', Audience: 'All staff', Host: 'mail-edge-02', Domain: 'intranet.mission-next.example', Url: 'https://intranet.mission-next.example/wellness', Result: 'Allowed', ClickCount: '0', Detail: 'Internal link' }),
    R('EmailUrlEvents', 'EU-004', '09:08:10', { EventType: 'UrlClick', Account: 'acct-204', Host: 'mail-edge-02', Domain: 'benefits-review.example', Url: 'https://benefits-review.example/enroll', Result: 'Allowed', ClickCount: '1', Detail: 'Click-time check followed a redirect to update-check.example' }),
    R('EmailUrlEvents', 'EU-005', '08:01:20', { EventType: 'UrlScanned', Account: 'acct-091', Host: 'mail-edge-02', Domain: 'intranet.mission-next.example', Url: 'https://intranet.mission-next.example/password', Result: 'Allowed', ClickCount: '1', Detail: 'Internal password page' }),
    // Endpoint process
    ep('EP-304', '09:22:00', 'WS-118', 'system', 'ProcessCreated', { Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', Signer: 'Mission Next IT', Detail: 'Scheduled inventory run' }),
    ep('EP-305', '08:20:30', 'WS-131', 'acct-157', 'ProcessCreated', { Image: 'browser.exe', ParentImage: 'explorer.exe', Signer: 'Trusted publisher', Detail: 'User session start' }),
    ep('EP-306', '08:42:00', 'WS-204', 'acct-204', 'ProcessCreated', { Image: 'mail-client.exe', ParentImage: 'explorer.exe', Signer: 'Trusted publisher', Detail: 'Normal start of the user mail client' }),
    ep('EP-307', '09:09:00', 'WS-204', 'acct-204', 'ProcessCreated', { Image: 'document-viewer.exe', ParentImage: 'browser.exe', Signer: 'Trusted publisher', Detail: 'Downloaded document opened' }),
    ep('EP-308', '08:50:00', 'WS-177', 'system', 'ProcessCreated', { Image: 'script-host.exe', ParentImage: 'management-agent.exe', CommandLine: 'script-host.exe -file C:\\ProgramData\\ITOps\\policy-update.js', Sha256: HASH_ITOPS, Signer: 'Mission Next IT', Detail: 'Scheduled IT policy refresh' }),
    ep('EP-309', '08:40:00', 'WS-118', 'system', 'ProcessCreated', { Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', CommandLine: 'inventory-script.exe -EncodedCommand UwB0AGEAcgB0AC0ASQBuAHYA', Sha256: HASH_INV, Signer: 'Mission Next IT', Detail: 'Weekly full inventory using an encoded argument' }),
    ep('EP-310', '08:30:00', 'WS-142', 'system', 'ProcessCreated', { Image: 'av-scan.exe', ParentImage: 'management-agent.exe', Signer: 'Security vendor', Detail: 'Scheduled quick scan' }),
    ep('EP-311', '10:18:00', 'WS-142', 'system', 'ProcessCreated', { Image: 'monitor-agent.exe', ParentImage: 'services.exe', Sha256: HASH_MON, Signer: 'Monitoring vendor', ChangeId: 'CHG-9201', Detail: 'Monitoring agent started after install' }),
    ep('EP-312', '11:00:00', 'WS-131', 'system', 'ProcessCreated', { Image: 'update-svc.exe', ParentImage: 'management-agent.exe', Signer: 'Security vendor', Detail: 'Sensor agent upgrade started' }),
    ep('EP-313', '12:00:00', 'WS-177', 'system', 'ProcessCreated', { Image: 'installer.exe', ParentImage: 'management-agent.exe', Signer: 'Mission Next IT', ChangeId: 'CHG-9204', Detail: 'Managed installer run under CHG-9204' }),
    ep('EP-314', '13:05:00', 'WS-131', 'acct-157', 'ProcessCreated', { Image: 'browser.exe', ParentImage: 'explorer.exe', Signer: 'Trusted publisher', Detail: 'User browsing' }),
    ep('EP-316', '11:12:00', 'WS-118', 'system', 'ProcessCreated', { Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', Signer: 'Mission Next IT', Detail: 'Scheduled inventory run' }),
    ep('EP-317', '13:12:00', 'WS-118', 'system', 'ProcessCreated', { Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', Signer: 'Mission Next IT', Detail: 'Scheduled inventory run' }),
    ep('EP-318', '15:12:00', 'WS-118', 'system', 'ProcessCreated', { Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', Signer: 'Mission Next IT', Detail: 'Scheduled inventory run' }),
    // Endpoint file
    R('DeviceFileEvents', 'EP-302', '09:14:20', { EventType: 'FileCreated', Account: 'acct-204', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', FilePath: 'C:\\Users\\acct-204\\AppData\\Local\\Temp\\policy-update.js', Sha256: HASH_AMBER, Signer: 'Unsigned', Detail: 'Script written by the launching process' }),
    R('DeviceFileEvents', 'FL-001', '09:09:10', { EventType: 'FileCreated', Account: 'acct-204', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', FilePath: 'C:\\Users\\acct-204\\Downloads\\benefit-correction.pdf', Detail: 'Browser download' }),
    R('DeviceFileEvents', 'FL-002', '08:51:00', { EventType: 'FileRead', Account: 'system', Host: 'WS-177', DeviceId: 'WS-177', Result: 'Success', FilePath: 'C:\\ProgramData\\ITOps\\policy-update.js', Sha256: HASH_ITOPS, Signer: 'Mission Next IT', Detail: 'Signed IT script read by the scheduler' }),
    R('DeviceFileEvents', 'FL-003', '11:12:30', { EventType: 'FileCreated', Account: 'system', Host: 'WS-118', DeviceId: 'WS-118', Result: 'Success', FilePath: 'C:\\ProgramData\\Inventory\\inventory-0927.csv', Detail: 'Inventory output' }),
    R('DeviceFileEvents', 'FL-004', '10:19:00', { EventType: 'FileCreated', Account: 'system', Host: 'WS-142', DeviceId: 'WS-142', Result: 'Success', FilePath: 'C:\\Program Files\\MonitorAgent\\agent.cfg', Sha256: HASH_MON, Signer: 'Monitoring vendor', ChangeId: 'CHG-9201', Detail: 'Agent configuration written by the vendor installer' }),
    R('DeviceFileEvents', 'FL-005', '12:00:30', { EventType: 'FileCreated', Account: 'system', Host: 'WS-177', DeviceId: 'WS-177', Result: 'Success', FilePath: 'C:\\Program Files\\ITOpsAgent\\agent.exe', Signer: 'Mission Next IT', ChangeId: 'CHG-9204', Detail: 'Agent binary written by the managed installer' }),
    R('DeviceFileEvents', 'FL-006', '13:30:00', { EventType: 'FileCreated', Account: 'acct-157', Host: 'WS-131', DeviceId: 'WS-131', Result: 'Success', FilePath: 'C:\\Users\\acct-157\\Documents\\budget-v3.xlsx', Detail: 'User document save' }),
    // Endpoint registry
    R('DeviceRegistryEvents', 'EP-319', '12:01:00', { EventType: 'RegistryValueSet', Account: 'system', Host: 'WS-177', DeviceId: 'WS-177', Result: 'Success', RegistryPath: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\ITOpsAgent', ChangeId: 'CHG-9204', Detail: 'Run key created by the managed installer' }),
    R('DeviceRegistryEvents', 'EP-320', '11:03:00', { EventType: 'RegistryValueSet', Account: 'system', Host: 'WS-131', DeviceId: 'WS-131', Result: 'Success', RegistryPath: 'HKLM\\Software\\SensorAgent\\Version', Detail: 'Sensor agent version updated by the upgrade' }),
    R('DeviceRegistryEvents', 'EP-321', '10:19:30', { EventType: 'RegistryValueSet', Account: 'system', Host: 'WS-142', DeviceId: 'WS-142', Result: 'Success', RegistryPath: 'HKLM\\System\\CurrentControlSet\\Services\\MonitorAgent', ChangeId: 'CHG-9201', Detail: 'Service entry created by the vendor installer' }),
    // Endpoint network
    R('DeviceNetworkEvents', 'DN-001', '08:42:30', { EventType: 'ConnectionAccepted', Account: 'acct-204', Host: 'WS-204', DeviceId: 'WS-204', SourceIp: '192.0.2.24', DestinationIp: '192.0.2.25', DestinationPort: '993', Image: 'mail-client.exe', Result: 'Allowed', Detail: 'Mailbox sync' }),
    R('DeviceNetworkEvents', 'DN-002', '10:20:10', { EventType: 'ConnectionAccepted', Account: 'system', Host: 'WS-142', DeviceId: 'WS-142', SourceIp: '192.0.2.42', DestinationIp: '203.0.113.140', DestinationPort: '443', Domain: 'telemetry.vendor-mon.example', Image: 'monitor-agent.exe', Result: 'Allowed', ChangeId: 'CHG-9201', Detail: 'First check-in of the newly installed monitoring agent' }),
    R('DeviceNetworkEvents', 'DN-003', '10:50:10', { EventType: 'ConnectionAccepted', Account: 'system', Host: 'WS-142', DeviceId: 'WS-142', SourceIp: '192.0.2.42', DestinationIp: '203.0.113.140', DestinationPort: '443', Domain: 'telemetry.vendor-mon.example', Image: 'monitor-agent.exe', Result: 'Allowed', ChangeId: 'CHG-9201', Detail: 'Periodic check-in, 30-minute interval' }),
    R('DeviceNetworkEvents', 'DN-004', '11:15:00', { EventType: 'ConnectionAccepted', Account: 'system', Host: 'WS-118', DeviceId: 'WS-118', SourceIp: '192.0.2.18', DestinationIp: '198.51.100.20', DestinationPort: '443', Image: 'update-svc.exe', Result: 'Allowed', Detail: 'Signed update service' }),
    R('DeviceNetworkEvents', 'DN-005', '12:00:20', { EventType: 'ConnectionAccepted', Account: 'backup-job', Host: 'BKP-01', DeviceId: 'BKP-01', SourceIp: '192.0.2.80', DestinationIp: '198.51.100.90', DestinationPort: '443', Image: 'backup-agent.exe', Result: 'Allowed', Detail: 'Weekly offsite replication started' }),
    R('DeviceNetworkEvents', 'DN-006', '13:00:15', { EventType: 'ConnectionAccepted', Account: 'system', Host: 'WS-177', DeviceId: 'WS-177', SourceIp: '192.0.2.77', DestinationIp: '198.51.100.44', DestinationPort: '443', Domain: 'software.mission-next.example', Image: 'installer.exe', Result: 'Allowed', ChangeId: 'CHG-9204', Detail: 'Package download for the managed install' }),
    // Network sessions
    R('NetworkSessionEvents', 'NW-502', '09:26:00', { EventType: 'OutboundConnection', Account: 'acct-204', Host: 'WS-204', DeviceId: 'WS-204', SourceIp: '192.0.2.24', DestinationIp: '203.0.113.72', DestinationPort: '443', Result: 'Allowed', BytesSent: '12288', Detail: '12 KB sent to 203.0.113.72:443' }),
    R('NetworkSessionEvents', 'NW-503', '09:24:00', { EventType: 'OutboundConnection', Account: 'system', Host: 'WS-118', DeviceId: 'WS-118', SourceIp: '192.0.2.18', DestinationIp: '198.51.100.20', DestinationPort: '443', Result: 'Allowed', Detail: 'Approved signed update service' }),
    R('NetworkSessionEvents', 'NW-505', '08:30:40', { EventType: 'OutboundConnection', Account: 'acct-157', Host: 'WS-131', DeviceId: 'WS-131', SourceIp: '192.0.2.31', DestinationIp: '198.51.100.44', DestinationPort: '443', Result: 'Allowed', Detail: 'Intranet and CDN traffic' }),
    R('NetworkSessionEvents', 'NW-506', '09:25:00', { EventType: 'OutboundConnection', Account: 'system', Host: 'WS-142', DeviceId: 'WS-142', SourceIp: '192.0.2.42', DestinationIp: '198.51.100.44', DestinationPort: '443', Result: 'Allowed', Detail: 'Intranet and CDN traffic while endpoint process and file telemetry was paused' }),
    R('NetworkSessionEvents', 'NW-507', '14:15:00', { EventType: 'OutboundConnection', Account: 'acct-157', Host: 'WS-131', DeviceId: 'WS-131', SourceIp: '192.0.2.31', DestinationIp: '198.51.100.44', DestinationPort: '443', Result: 'Allowed', Detail: 'Intranet and CDN traffic' }),
    // Sensor health and collection coverage
    hb('HB-001', '08:00:00', 'WS-204', 'Heartbeat', 'Full', 'Sensor reporting; full process, file, registry and network telemetry'),
    hb('HB-002', '10:00:00', 'WS-204', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-003', '12:00:00', 'WS-204', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-004', '08:00:00', 'WS-118', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-005', '12:00:00', 'WS-118', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-006', '08:00:00', 'WS-131', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-007', '11:10:00', 'WS-131', 'SensorGap', 'None', 'Sensor stopped reporting during agent upgrade restart', 'Interrupted'),
    hb('HB-008', '11:40:00', 'WS-131', 'SensorResumed', 'Full', 'Sensor reporting again; 30 minutes of endpoint telemetry not collected'),
    hb('HB-009', '08:30:00', 'WS-142', 'AgentUpgrade', 'Partial', 'Upgrade in progress; process and file telemetry paused, network flows still forwarded by the gateway', 'Interrupted'),
    hb('HB-010', '09:50:00', 'WS-142', 'SensorResumed', 'Full', 'Upgrade complete; 80 minutes of endpoint process and file telemetry not collected'),
    hb('HB-011', '08:00:00', 'WS-177', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    hb('HB-012', '12:00:00', 'WS-177', 'Heartbeat', 'Full', 'Sensor reporting; full telemetry'),
    // Proxy / DNS / firewall
    px('PX-001', '08:25:00', 'WS-131', IP['WS-131'], 'https://intranet.mission-next.example/home', 'intranet.mission-next.example', 'Allowed', 'Intranet'),
    px('PX-002', '09:08:30', 'WS-204', IP['WS-204'], 'https://update-check.example/policy', 'update-check.example', 'Allowed', 'Uncategorized site reached after the mail link'),
    px('PX-003', '09:15:00', 'WS-204', IP['WS-204'], 'https://203.0.113.72/', '203.0.113.72', 'Allowed', 'Direct-to-address HTTPS, uncategorized'),
    px('PX-004', '09:24:00', 'WS-118', IP['WS-118'], 'https://updates.vendor-signed.example/check', 'updates.vendor-signed.example', 'Allowed', 'Software updates'),
    px('PX-005', '10:20:00', 'WS-142', IP['WS-142'], 'https://telemetry.vendor-mon.example/checkin', 'telemetry.vendor-mon.example', 'Allowed', 'Vendor monitoring service'),
    px('PX-006', '10:55:00', 'WS-131', IP['WS-131'], 'https://cdn-assets.example/lib.js', 'cdn-assets.example', 'Allowed', 'Content delivery'),
    px('PX-007', '13:00:10', 'WS-177', IP['WS-177'], 'https://software.mission-next.example/packages/itops-agent', 'software.mission-next.example', 'Allowed', 'Internal software distribution'),
    px('PX-008', '14:40:00', 'WS-131', IP['WS-131'], 'https://games-portal.example/', 'games-portal.example', 'Blocked', 'Blocked by category policy'),
    px('PX-009', '15:20:00', 'WS-142', IP['WS-142'], 'https://telemetry.vendor-mon.example/checkin', 'telemetry.vendor-mon.example', 'Allowed', 'Vendor monitoring service'),
    dns('DNS-001', '09:08:20', 'WS-204', IP['WS-204'], 'update-check.example', '203.0.113.72', 'Success', 'Newly observed domain'),
    dns('DNS-002', '09:14:30', 'WS-204', IP['WS-204'], 'update-check.example', '203.0.113.72', 'Success', 'Repeat lookup'),
    dns('DNS-003', '08:30:20', 'WS-131', IP['WS-131'], 'intranet.mission-next.example', '192.0.2.40', 'Success', 'Internal name'),
    dns('DNS-004', '10:19:50', 'WS-142', IP['WS-142'], 'telemetry.vendor-mon.example', '203.0.113.140', 'Success', 'Vendor monitoring service'),
    dns('DNS-005', '09:23:50', 'WS-118', IP['WS-118'], 'updates.vendor-signed.example', '198.51.100.20', 'Success', 'Signed update service'),
    dns('DNS-006', '12:41:00', 'WS-177', IP['WS-177'], 'softwre.mission-next.example', '', 'Failure', 'NXDOMAIN; mistyped name'),
    dns('DNS-007', '12:41:20', 'WS-177', IP['WS-177'], 'softwre.mission-next.example', '', 'Failure', 'NXDOMAIN; mistyped name retry'),
    dns('DNS-008', '12:42:00', 'WS-177', IP['WS-177'], 'software.mission-next.example', '198.51.100.44', 'Success', 'Corrected name resolves'),
    fw('FW-001', '09:15:10', '192.0.2.24', '203.0.113.72', '443', 'Allowed', '46080', 'Egress to an uncategorized address'),
    fw('FW-002', '10:20:15', '192.0.2.42', '203.0.113.140', '443', 'Allowed', '2048', 'Vendor monitoring check-in'),
    fw('FW-003', '12:00:30', '192.0.2.80', '198.51.100.90', '443', 'Allowed', '6227020800', 'Weekly offsite replication'),
    fw('FW-004', '10:47:00', '198.51.100.77', '192.0.2.4', '443', 'Allowed', '18432', 'VPN gateway session from the traveling user'),
    fw('FW-005', '12:30:00', '198.51.100.200', '192.0.2.60', '3389', 'Blocked', '0', 'Internet background scanning against a finance server'),
    fw('FW-006', '09:50:00', '198.51.100.201', '192.0.2.25', '25', 'Blocked', '0', 'Rejected relay attempt at the mail edge'),
    fw('FW-008', '09:16:00', '192.0.2.42', '198.51.100.44', '443', 'Allowed', '30720', 'Intranet and CDN traffic while endpoint process and file telemetry was paused'),
    fw('FW-007', '13:00:20', '192.0.2.77', '198.51.100.44', '443', 'Allowed', '52428800', 'Package download'),
    // Exposure and scan context (evidence records)
    R('VulnerabilityFindings', 'VX-701', '09:36:00', { EventType: 'FindingVerified', Account: 'system', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', Severity: 'Medium', Detail: 'Script control policy in audit-only mode; verified during the incident' }),
    R('VulnerabilityFindings', 'VX-702', '08:10:00', { EventType: 'FindingOpen', Account: 'system', Host: 'WS-118', DeviceId: 'WS-118', Result: 'Success', Severity: 'Medium', Detail: 'Browser update pending next window; no matching indicator reached this host' }),
    R('VulnerabilityFindings', 'VX-703', '08:03:30', { EventType: 'FindingClosed', Account: 'system', Host: 'mail-edge-02', Result: 'Success', Severity: 'Informational', Detail: 'Antispam engine current; healthy' }),
    R('VulnerabilityFindings', 'VX-704', '10:00:30', { EventType: 'FindingClosed', Account: 'system', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', Severity: 'Informational', Detail: 'Endpoint sensor healthy; telemetry complete' }),
    R('VulnerabilityFindings', 'VX-705', '11:50:00', { EventType: 'FindingOpen', Account: 'system', Host: 'WS-177', DeviceId: 'WS-177', Result: 'Success', Severity: 'Critical', Detail: 'Critical library flaw; the vulnerable component is not installed on this build and the scan matched on filename only' }),
    R('VulnerabilityFindings', 'VX-706', '11:55:00', { EventType: 'FindingOpen', Account: 'system', Host: 'APP-FIN-01', Result: 'Success', Severity: 'Medium', Detail: 'Medium finding; server not reachable from the internet' }),
    R('ScanRuns', 'SCN-001', '11:45:00', { EventType: 'ScanCompleted', Account: 'svc-scan', Host: 'SCAN-01', Result: 'Success', Detail: 'Credentialed scan of WS-204, WS-177 and APP-FIN-01 completed' }),
    R('ScanRuns', 'SCN-002', '11:46:00', { EventType: 'ScanCredentialFailure', Account: 'svc-scan', Host: 'SCAN-01', Result: 'Failure', Detail: 'WS-118 was scanned without credentials; local findings not assessed in this run' }),
    R('ScanRuns', 'SCN-003', '11:47:00', { EventType: 'ScanSkipped', Account: 'svc-scan', Host: 'SCAN-01', Result: 'Interrupted', Detail: 'WS-131 skipped; sensor restart in progress' }),
    // Backup / recovery points
    R('BackupEvents', 'BKE-001', '09:00:00', { EventType: 'BackupCompleted', Account: 'backup-job', Host: 'BKP-01', Result: 'Success', RecoveryPoint: 'BK-204-0900', Target: 'WS-204', Detail: 'Recovery point captured before the first script execution' }),
    R('BackupEvents', 'BKE-002', '09:30:00', { EventType: 'BackupCompleted', Account: 'backup-job', Host: 'BKP-01', Result: 'Success', RecoveryPoint: 'BK-204-0930', Target: 'WS-204', Detail: 'Recovery point captured after the script and Run key were present' }),
    R('BackupEvents', 'BKE-003', '08:10:00', { EventType: 'BackupCompleted', Account: 'backup-job', Host: 'BKP-01', Result: 'Success', RecoveryPoint: 'BK-118-0800', Target: 'WS-118', Detail: 'Scheduled recovery point' }),
    R('BackupEvents', 'BKE-004', '12:00:00', { EventType: 'ReplicationStarted', Account: 'backup-job', Host: 'BKP-01', Result: 'Success', Target: 'offsite vault', Detail: 'Weekly offsite replication of catalog and recovery points' }),
    R('BackupEvents', 'BKE-005', '13:10:00', { EventType: 'ReplicationCompleted', Account: 'backup-job', Host: 'BKP-01', Result: 'Success', Target: 'offsite vault', Detail: 'Weekly offsite replication complete; 5.8 GB transferred' }),
    // Response options and custody (case file)
    R('ResponseRecords', 'RS-801', '09:35:00', { EventType: 'PlaybookAvailable', Account: 'soc-automation', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', Detail: 'Endpoint isolation retaining the response channel; requires approval' }),
    R('ResponseRecords', 'RS-802', '09:35:20', { EventType: 'PlaybookAvailable', Account: 'soc-automation', Host: 'idp-02', Result: 'Success', Detail: 'Session revocation, account disable and credential reset; requires approval' }),
    R('ResponseRecords', 'RS-803', '09:35:40', { EventType: 'PlaybookAvailable', Account: 'soc-automation', Host: 'FW-EDGE-01', Result: 'Success', Detail: 'Indicator block for hash and destination; monitor recurrence' }),
    R('ResponseRecords', 'RS-804', '09:36:00', { EventType: 'GateDefined', Account: 'soc-automation', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', Detail: 'Recovery gate: clean scan, policy fix and owner validation' }),
    R('EvidenceCustodyLog', 'EV-901', '09:44:00', { EventType: 'EvidenceCollected', Account: 'soc-04', AccountNative: 'SOC-04', Host: 'WS-204', DeviceId: 'WS-204', Result: 'Success', Detail: 'Endpoint export collected; SHA256 recorded', Sha256: H('c3d1', '0a7e', '5b92f4e1') }),
    R('EvidenceCustodyLog', 'EV-902', '09:46:00', { EventType: 'EvidenceCollected', Account: 'soc-04', AccountNative: 'SOC-04', Host: 'idp-02', Result: 'Success', Detail: 'Identity session export collected' }),
    R('EvidenceCustodyLog', 'EV-903', '09:49:00', { EventType: 'EvidenceCollected', Account: 'soc-04', AccountNative: 'SOC-04', Host: 'mail-edge-02', Result: 'Success', Detail: 'Message headers and redirect chain collected' }),
    R('EvidenceCustodyLog', 'EV-904', '09:52:00', { EventType: 'CaseStateChanged', Account: 'soc-04', AccountNative: 'SOC-04', Host: 'case-mgmt', Result: 'Success', Detail: 'INC-4821 opened; containment pending; owner IR lead' }),
    // Cross-shift context
    R('ShiftLog', 'SH-001', '08:00:30', { EventType: 'HandoffReceived', Account: 'night-lead', Host: 'soc-desk', Result: 'Success', Detail: 'Night shift handoff: weekend change window CHG-9207 runs 11:00-14:00; expect planned restarts and service credential rotation' }),
    R('ShiftLog', 'SH-002', '08:01:00', { EventType: 'HandoffReceived', Account: 'night-lead', Host: 'soc-desk', Result: 'Success', Detail: 'Night shift handoff: CHG-9201 monitoring agent rollout to WS-142 and CHG-9204 managed installer on WS-177 approved for today' }),
    R('ShiftLog', 'SH-003', '08:02:00', { EventType: 'HandoffReceived', Account: 'night-lead', Host: 'soc-desk', Result: 'Success', Detail: 'Night shift handoff: AL-4812 repeated sign-ins for acct-091 resolved overnight as a forgotten password' }),
    R('ShiftLog', 'SH-004', '08:04:00', { EventType: 'StaffingNote', Account: 'day-lead', Host: 'soc-desk', Result: 'Success', Detail: 'Weekend staffing: one tier-2 analyst on call, reduced alert triage capacity' }),
    R('ShiftLog', 'SH-005', '15:55:00', { EventType: 'HandoffPrepared', Account: 'day-lead', Host: 'soc-desk', Result: 'Success', Detail: 'Handoff to evening incident lead pending analyst submission' }),
  ];
  const telemetryPurposes = {
    'ID-401': 'baseline of the affected user session', 'ID-403': 'corroboration: owner denial of the unfamiliar session', 'ID-404': 'alternate explanation: registered scheduled service account',
    'ID-405': 'background', 'ID-406': 'background', 'ID-407': 'background', 'ID-408': 'benign alternate explanation: typed-password retries', 'ID-409': 'benign alternate explanation: typed-password retries', 'ID-410': 'benign alternate explanation: typed-password retries', 'ID-411': 'benign alternate explanation: success with MFA after retries',
    'ID-412': 'background', 'ID-413': 'background', 'ID-415': 'background', 'ID-416': 'benign alternate explanation: approved travel with MFA', 'ID-417': 'benign alternate explanation: approved travel', 'ID-418': 'background', 'ID-420': 'background', 'ID-421': 'background', 'ID-422': 'background',
    'AU-001': 'benign alternate explanation: expired service credential', 'AU-002': 'benign alternate explanation: expired service credential', 'AU-003': 'benign alternate explanation: expired service credential', 'AU-004': 'benign recovery validation: rotation accepted',
    'DA-001': 'benign discriminating fact: ticketed reset', 'DA-002': 'background', 'DA-003': 'benign discriminating fact: change-linked rotation', 'DA-004': 'background', 'DA-005': 'background',
    'AP-001': 'background', 'AP-002': 'baseline of the affected user normal app use', 'AP-003': 'background', 'AP-004': 'background', 'AP-005': 'benign alternate explanation: scheduled bulk export', 'AP-006': 'background', 'AP-007': 'background', 'AP-008': 'background',
    'SL-001': 'scope check: mail gateway healthy', 'SL-002': 'background', 'SL-003': 'scope check: other recipients purged by the gateway, not by the analyst', 'SL-004': 'benign change context', 'SL-005': 'coverage caveat: delayed proxy ingestion', 'SL-006': 'background',
    'EM-210': 'evidence context: first message in the delivery chain', 'EM-211': 'evidence context: authentication failure on the lure', 'EM-213': 'background: bulk internal mail', 'EM-214': 'background', 'EM-215': 'background',
    'EM-216': 'scope check: same campaign, unclicked recipient', 'EM-217': 'scope check: same campaign, unclicked recipient', 'EM-218': 'scope check: post-delivery purge', 'EM-219': 'benign alternate explanation: legitimate credential-themed mail', 'EM-220': 'background', 'EM-221': 'benign change context', 'EM-222': 'background', 'EM-223': 'background', 'EM-224': 'corroboration: user report',
    'EU-001': 'scope check: no click', 'EU-002': 'scope check: no click', 'EU-003': 'background', 'EU-004': 'evidence context: click-time redirect', 'EU-005': 'benign alternate explanation: internal credential link',
    'EP-302': 'evidence context: script file identity', 'EP-304': 'benign alternate explanation: scheduled signed inventory run', 'EP-305': 'background', 'EP-306': 'baseline of the affected host normal use', 'EP-307': 'evidence context: document opened before script',
    'EP-308': 'benign alternate explanation: same script name, signed IT copy, different hash', 'EP-309': 'benign alternate explanation: signed encoded-argument inventory', 'EP-310': 'background', 'EP-311': 'benign discriminating fact: change-linked agent', 'EP-312': 'coverage caveat: agent upgrade explains sensor gap', 'EP-313': 'benign discriminating fact: managed installer', 'EP-314': 'background', 'EP-316': 'background', 'EP-317': 'background', 'EP-318': 'background',
    'FL-001': 'evidence context: download before execution', 'FL-002': 'benign discriminating fact: signed IT hash', 'FL-003': 'background', 'FL-004': 'benign discriminating fact: vendor installer', 'FL-005': 'benign discriminating fact: managed installer', 'FL-006': 'background',
    'EP-319': 'benign alternate explanation: change-linked Run key', 'EP-320': 'coverage caveat: agent upgrade', 'EP-321': 'benign discriminating fact: change-linked service',
    'DN-001': 'background', 'DN-002': 'benign alternate explanation: rare destination from approved agent', 'DN-003': 'benign alternate explanation: periodic check-in', 'DN-004': 'benign alternate explanation: approved updater', 'DN-005': 'benign alternate explanation: scheduled offsite transfer', 'DN-006': 'background',
    'NW-502': 'evidence context: data sent to the destination', 'NW-503': 'benign alternate explanation: approved updater', 'NW-505': 'background', 'NW-506': 'scope check: WS-142 network flows present while endpoint telemetry paused', 'NW-507': 'background',
    'HB-001': 'coverage: sensor healthy on the affected host', 'HB-002': 'coverage: sensor healthy on the affected host', 'HB-003': 'coverage: sensor healthy on the affected host', 'HB-004': 'coverage: sensor healthy', 'HB-005': 'coverage: sensor healthy', 'HB-006': 'coverage: sensor healthy',
    'HB-007': 'coverage gap after the scope window', 'HB-008': 'coverage gap after the scope window', 'HB-009': 'coverage gap covering part of the scope window', 'HB-010': 'coverage gap covering part of the scope window', 'HB-011': 'coverage: sensor healthy', 'HB-012': 'coverage: sensor healthy',
    'PX-001': 'background', 'PX-002': 'corroboration: redirect host reached', 'PX-003': 'corroboration: destination reached', 'PX-004': 'benign alternate explanation: approved updater', 'PX-005': 'benign alternate explanation: vendor monitoring', 'PX-006': 'background', 'PX-007': 'background', 'PX-008': 'background', 'PX-009': 'background',
    'DNS-001': 'corroboration: redirect host resolved', 'DNS-002': 'corroboration', 'DNS-003': 'background', 'DNS-004': 'benign alternate explanation: vendor monitoring', 'DNS-005': 'benign alternate explanation: approved updater', 'DNS-006': 'benign alternate explanation: mistyped name', 'DNS-007': 'benign alternate explanation: mistyped name', 'DNS-008': 'benign alternate explanation: corrected name',
    'FW-001': 'corroboration: egress to the destination', 'FW-002': 'benign alternate explanation: vendor monitoring', 'FW-003': 'benign alternate explanation: scheduled offsite transfer', 'FW-004': 'benign alternate explanation: travel VPN', 'FW-005': 'background: internet scanning', 'FW-006': 'background: internet scanning', 'FW-007': 'background', 'FW-008': 'scope check: WS-142 gateway flows during the endpoint gap, no contact with the destination',
    'VX-701': 'exposure: contributing condition on the affected host', 'VX-702': 'exposure: not reached', 'VX-703': 'exposure: control healthy', 'VX-704': 'coverage: sensor complete on the affected host', 'VX-705': 'benign alternate explanation: non-applicable critical finding', 'VX-706': 'background',
    'SCN-001': 'coverage: scan scope', 'SCN-002': 'coverage gap: unauthenticated scan', 'SCN-003': 'coverage gap: skipped asset',
    'BKE-001': 'recovery: trusted pre-incident point', 'BKE-002': 'recovery: post-compromise point', 'BKE-003': 'background', 'BKE-004': 'benign alternate explanation: scheduled transfer', 'BKE-005': 'benign alternate explanation: scheduled transfer',
    'RS-801': 'response options', 'RS-802': 'response options', 'RS-803': 'response options', 'RS-804': 'recovery gate',
    'EV-901': 'custody', 'EV-902': 'custody', 'EV-903': 'custody', 'EV-904': 'custody',
    'SH-001': 'cross-shift context: planned change window', 'SH-002': 'cross-shift context: approved changes', 'SH-003': 'cross-shift context: prior alert resolution', 'SH-004': 'cross-shift context: staffing', 'SH-005': 'cross-shift context: pending handoff',
  };

  // Native fields for the original evidence rows so they carry the same pivots (Account, Host, SourceIp, Domain) as the background.
  const evidenceFields = {
    'EM-212': { EventType: 'LinkOpened', Result: 'Allowed', Account: 'acct-204', Host: 'ws-204', Sender: 'reply@benefits-review.example', Domain: 'update-check.example', Url: 'https://benefits-review.example/enroll', Detail: 'Recipient opened the linked document; click-time check followed a redirect to update-check.example' },
    'EP-301': { EventType: 'ScriptExecution', Result: 'Allowed', Account: 'acct-204', Image: 'script-host.exe', ParentImage: 'document-viewer.exe', CommandLine: 'script-host.exe -file policy-update.js', Sha256: HASH_AMBER, Signer: 'Unsigned', Detail: 'document-viewer.exe spawned script-host.exe running policy-update.js' },
    'EP-303': { EventType: 'PersistenceCreated', Result: 'Success', Account: 'acct-204', RegistryPath: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\ProfileSync', Detail: 'Run key ProfileSync created by script-host.exe' },
    'ID-402': { EventType: 'TokenRefresh', Result: 'Success', Host: 'idp-02', SourceIp: '203.0.113.72', AuthMethod: 'Token refresh', Country: 'Unknown', SessionId: 'S-2048', Detail: 'Unfamiliar client refreshed the acct-204 session token' },
    'NW-501': { EventType: 'OutboundConnection', Result: 'Allowed', Account: 'acct-204', SourceIp: '192.0.2.24', DestinationPort: '443', BytesReceived: '47104', Image: 'script-host.exe', Detail: '46 KB received from 203.0.113.72:443' },
    'NW-504': { EventType: 'ScopeCheck', Result: 'Success', Account: 'system', Detail: 'Scope result: no second device matched both indicators in the available telemetry; ws-118 contacted only 198.51.100.20. Endpoint process/file gaps: ws-142 08:30-09:50, ws-131 11:10-11:40; gateway sources cover all hosts' },
    'BEN-101': { EventType: 'SignedInventoryScript', Result: 'Allowed', Account: 'system', Image: 'inventory-script.exe', ParentImage: 'management-agent.exe', Sha256: HASH_INV, Signer: 'Mission Next IT', Detail: 'Approved inventory script; signed publisher and expected path' },
  };

  // Every native console record can be cited without a shortlist of scored
  // candidates. Availability does not assert relevance or affected scope.
  telemetry.forEach(r=>{
    scenario.evidence.push({id:r.EventId,source:r.EventSource,entityIds:[...new Set([r.Host,r.Account,r.DestinationIp].filter(Boolean).map(value=>String(value).toLowerCase()))],at:`${scenario.start.slice(0,10)}T${r.at}Z`});
    const {EventSource,EventId,at,...fields}=r;
    evidenceFields[r.EventId]={...fields,Host:String(fields.Host).toLowerCase()};
  });

  const expectedTruth = {
    // V2 support classifications belong to instructor truth, never console records.
    evidenceSupport: Object.fromEntries(scenario.evidence.map(e => {
      const purpose = telemetryPurposes[e.id] || '';
      const primary = ['EM-212','EP-301','EP-303','ID-402','NW-501','VX-701'].includes(e.id);
      const secondary = ['NW-504','EM-216','EM-217','EM-218','EU-001','EU-002','ID-403'].includes(e.id);
      const contradictory = e.id === 'BEN-101' || /benign/.test(purpose);
      const level = primary ? 'PRIMARY' : secondary ? 'SECONDARY' : contradictory ? 'CONTRADICTORY' : /corroboration|evidence context|scope check|coverage|exposure|custody/.test(purpose) ? 'SUPPORTING' : 'IRRELEVANT';
      const domain = /Identity|AAD|Directory|Application/.test(e.source) ? 'identity' : /Email/.test(e.source) ? 'email' : /Network|Dns|Proxy|Firewall/.test(e.source) ? 'network' : /Vulnerability|Scan/.test(e.source) ? 'exposure' : /Device/.test(e.source) ? 'endpoint' : '';
      return [e.id, { level, domain, entityIds: e.entityIds, boundedNegative: e.id === 'NW-504' }];
    })),
    indicatorDecisions: { 'TI-601':'malicious', 'TI-602':'malicious', 'TI-603':'benign', 'TI-604':'unknown', 'TI-605':'benign' },
    indicatorEvidence: { 'TI-601':['NW-501','ID-402'], 'TI-602':['EP-301','EP-302'], 'TI-603':['BEN-101','NW-504','NW-503'], 'TI-604':['EM-212','DNS-001'], 'TI-605':['EP-311','DN-002'] },
    supportCredit: { PRIMARY:1, SECONDARY:0.65, SUPPORTING:0.4, IRRELEVANT:0, CONTRADICTORY:0 },
    affectedEntities: ['ws-204', 'acct-204'], benignEntities: ['ws-118'], unrelatedEntities: ['acct-091'],
    selectedEvidence: ['EM-212', 'EP-301', 'EP-303', 'ID-402', 'NW-501'],
    timeline: ['EM-212', 'EP-301', 'NW-501', 'EP-303', 'ID-402'],
    demonstratedAttack: ['T1204.001', 'T1059.007', 'T1547.001', 'T1071.001'],
    attackEvidence: { 'T1204.001':['EM-212'], 'T1059.007':['EP-301'], 'T1547.001':['EP-303'], 'T1071.001':['NW-501'] },
    maliciousIndicator: '203.0.113.72', validRuleId: 'RULE-03',
    safeActions: ['preserve:ws-204', 'isolate:ws-204', 'revoke-session:acct-204', 'block-indicator:203.0.113.72'],
    requiredApprovals: ['isolate', 'revoke-session', 'restore'],
    residualRisk: ['policy-remediation', 'monitoring'],
    // Instructor-only (never rendered): why each background row exists, and how each competing alert resolves.
    telemetryPurposes,
    alertDispositions: { 'AL-1201': 'true-positive', 'AL-1202': 'true-positive', 'AL-1203': 'benign-positive', 'AL-1204': 'benign-positive', 'AL-1205': 'benign-positive', 'AL-1206': 'benign-positive', 'AL-1207': 'benign-positive', 'AL-1208': 'needs-investigation', 'AL-1209': 'benign-positive', 'AL-1210': 'benign-positive', 'AL-1211': 'benign-positive', 'AL-1212': 'false-positive', 'AL-1213': 'benign-positive', 'AL-1214': 'benign-positive' },
    alertDiscriminators: { 'AL-1203': ['EP-304', 'BEN-101'], 'AL-1204': ['ID-411', 'DA-001'], 'AL-1205': ['EP-309'], 'AL-1206': ['EP-311', 'DN-002'], 'AL-1207': ['ID-416', 'FW-004'], 'AL-1208': ['EU-001', 'EU-002', 'EM-218'], 'AL-1209': ['EP-312', 'HB-008'], 'AL-1210': ['BKE-004', 'BKE-005'], 'AL-1211': ['EP-313'], 'AL-1212': ['EP-308', 'FL-002'], 'AL-1213': ['AU-004', 'DA-003'], 'AL-1214': ['AP-005'] },
    benignBackgroundEventIds: Object.keys(telemetryPurposes).filter((id) => /benign|background/.test(telemetryPurposes[id])),
    // Every "no match" claim is bounded by source and time coverage.
    coverageGaps: {
      sensorGapEventIds: ['HB-007', 'HB-008', 'HB-009', 'HB-010'],
      boundedNegativeEvidence: [
        { claim: 'No second device matched the script hash', evidenceId: 'NW-504', window: '2026-09-27T08:00:00Z/2026-09-27T16:00:00Z', coveredBy: ['DeviceProcessEvents', 'DeviceFileEvents'], limits: 'ws-142 endpoint process/file telemetry paused 08:30-09:50 (HB-009, HB-010); ws-131 11:10-11:40 (HB-007, HB-008)' },
        { claim: 'No second device contacted 203.0.113.72', evidenceId: 'NW-504', window: '2026-09-27T08:00:00Z/2026-09-27T16:00:00Z', coveredBy: ['DnsEvents', 'ProxyEvents', 'FirewallEvents', 'NetworkSessionEvents'], limits: 'gateway sources cover every host in the window; proxy records arrive late after the 13:00 rotation (SL-005)' },
        { claim: 'Other recipients of the campaign did not click', evidenceId: 'EU-001', window: '2026-09-27T09:05:00Z/2026-09-27T16:00:00Z', coveredBy: ['EmailUrlEvents'], limits: 'click-time log only records rewritten links' },
      ],
    },
  };
  // Console pack object identities map to the same canonical capstone targets.
  const toolTargets = { 'DEV-204':'ws-204', 'SESSION-204':'acct-204', 'IOC-204':'203.0.113.72', 'PERSIST-204':'ws-204' };
  return freeze({ schemaVersion: 1, scenario, expectedTruth, telemetry, evidenceFields, toolTargets });
})();

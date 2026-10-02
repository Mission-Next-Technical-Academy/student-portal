/* Independent, immutable Module 10 assessment fixture: a post-containment
 * evidence collection request for case EVD-5510 (j.sanders / wkstn-19). All
 * values are synthetic. The learner builds the evidence locker and case
 * reconstruction from these artifacts; `expectedTruth` is instructor-only. */
const SocM10AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const H = (seed) => seed.repeat(64 / seed.length).slice(0, 64);

  const scenario = {
    id: 'M10-ASSESS-2026-09-27',
    caseId: 'EVD-5510',
    incidentId: 'INC-5510',
    stateKey: 'm10-evidence-locker-assessment-v1',
    start: '2026-09-27T08:30:00Z',
    end: '2026-09-27T11:30:00Z',
    fixedAt: '2026-09-27T11:30:00Z',
    containedAt: '2026-09-27T09:20:00Z',
    request: {
      id: 'REQ-5510',
      from: 'Legal & Incident Response lead',
      receivedAt: '2026-09-27T10:00:00Z',
      text: 'wkstn-19 is isolated. Collect and preserve what we need to reconstruct how j.sanders was compromised and whether data left the network, keep custody defensible, and place originals under legal hold.',
    },
    custodians: [
      { id: 'soc-analyst', label: 'SOC analyst (you)' },
      { id: 'df-custodian', label: 'Digital Forensics evidence custodian' },
      { id: 'legal-hold', label: 'Legal hold repository' },
    ],
    // Each artifact: what exists and where. The learner records acquisition
    // metadata; sourceHash is what the source system reports, and
    // verificationHash is what re-hashing the acquired copy yields.
    artifacts: [
      { id: 'ART-01', type: 'email_message', time: '2026-09-27T08:41:00Z', host: 'mail-gw-01', account: 'j.sanders', title: 'Inbound message "Q3 remittance" with attachment', source: 'Mail gateway quarantine export', methods: ['gateway_export'], sourceHash: H('a1'), verificationHash: H('a1'), detail: 'From billing@remit-portal.example to j.sanders; attachment Q3_Remittance.docm.' },
      { id: 'ART-02', type: 'file', time: '2026-09-27T08:44:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Q3_Remittance.docm opened from Downloads', source: 'wkstn-19 disk image (Downloads)', methods: ['disk_image', 'triage_collection'], sourceHash: H('a1'), verificationHash: H('a1'), detail: 'Same SHA-256 as the email attachment; opened by WINWORD.EXE at 08:44.' },
      { id: 'ART-03', type: 'process_log', time: '2026-09-27T08:45:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'WINWORD.EXE spawned powershell.exe -enc', source: 'Endpoint sensor process log export', methods: ['log_export'], sourceHash: H('b2'), verificationHash: H('b7'), reacquiredVerificationHash: H('b2'), detail: 'Parent WINWORD.EXE → child powershell.exe with an encoded command. The first export was truncated: re-hashing does not match the source-reported hash.' },
      { id: 'ART-04', type: 'file', time: '2026-09-27T08:46:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Dropped binary svchelp.exe', source: 'wkstn-19 disk image (AppData\\Roaming)', methods: ['disk_image', 'triage_collection'], sourceHash: H('c3'), verificationHash: H('c3'), detail: 'Unsigned binary written by powershell.exe.' },
      { id: 'ART-05', type: 'registry', time: '2026-09-27T08:46:30Z', host: 'wkstn-19', account: 'j.sanders', title: 'HKCU Run key "svchelp" created', source: 'wkstn-19 registry hive (NTUSER.DAT)', methods: ['disk_image', 'triage_collection'], sourceHash: H('d4'), verificationHash: H('d4'), detail: 'Run key points to the dropped svchelp.exe.' },
      { id: 'ART-06', type: 'mail_trace', time: '2026-09-27T08:41:30Z', host: 'mail-gw-01', account: 'jdoe', title: 'Same message delivered to jdoe; never opened', source: 'Mail gateway message trace', methods: ['gateway_export'], sourceHash: H('e5'), verificationHash: H('e5'), detail: 'Delivered to jdoe (wks-desk-07); mailbox audit shows no open or attachment access.' },
      { id: 'ART-07', type: 'file', time: '2026-09-27T09:05:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Deleted staging archive q3.zip recovered', source: 'wkstn-19 disk image (carved from Temp\\stage)', methods: ['disk_image'], sourceHash: H('f6'), verificationHash: H('f6'), detail: 'Archive of Finance documents created and deleted at 09:05. No transfer record accompanies it.' },
      { id: 'ART-08', type: 'network_log', time: '2026-09-27T09:07:00Z', host: 'proxy-01', account: 'j.sanders', title: 'Proxy review: no upload from wkstn-19', source: 'Web proxy log export', methods: ['log_export'], sourceHash: H('a7'), verificationHash: H('a7'), detail: 'No outbound upload or large POST from wkstn-19 between 08:40 and 09:20.' },
      { id: 'ART-09', type: 'memory_image', time: '2026-09-27T10:35:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Memory image of isolated wkstn-19', source: 'Isolated wkstn-19 live memory', methods: ['memory_capture'], sourceHash: H('b8'), verificationHash: H('b8'), detail: 'Captured after containment; analysis requires the Digital Forensics team.' },
      { id: 'ART-10', type: 'system_log', time: '2026-09-27T09:30:00Z', host: 'wkstn-19', account: 'system', accountNative: 'SYSTEM', title: 'Windows Update installed KB-2026-09', source: 'wkstn-19 System event log', methods: ['log_export'], sourceHash: H('c9'), verificationHash: H('c9'), detail: 'Routine patch installation unrelated to the intrusion.' },
      // ---- Adjacent / unrelated artifacts available for acquisition (decoys and optional context). ----
      { id: 'ART-11', type: 'email_message', time: '2026-09-27T08:33:00Z', host: 'mail-gw-01', account: 'j.sanders', title: 'Inbound message "Q3 payables summary" with attachment', source: 'Mail gateway quarantine export', methods: ['gateway_export'], sourceHash: H('1a'), verificationHash: H('1a'), detail: 'From ap@northwind-supply.example (known vendor, SPF/DKIM pass, clean verdict) to j.sanders; attachment Q3_Payables_Summary.xlsx with no macros. Unrelated to the compromise.' },
      { id: 'ART-12', type: 'file', time: '2026-09-27T08:36:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Q3_Payables_Summary.xlsx saved to Downloads', source: 'wkstn-19 disk image (Downloads)', methods: ['disk_image', 'triage_collection'], sourceHash: H('1a'), verificationHash: H('1a'), detail: 'Same SHA-256 as the ART-11 vendor attachment; opened in EXCEL.EXE with macros disabled. Benign.' },
      { id: 'ART-13', type: 'process_log', time: '2026-09-27T08:34:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Routine application launches (Outlook, Teams, Chrome)', source: 'Endpoint sensor process log export', methods: ['log_export'], sourceHash: H('3c'), verificationHash: H('3c'), detail: 'Start-of-day launches 08:31-08:38, all signed and parented by explorer.exe. Baseline only; precedes the document open.' },
      { id: 'ART-14', type: 'mail_trace', time: '2026-09-27T08:52:00Z', host: 'mail-gw-01', account: 'jdoe', title: 'Quarantine release request for a marketing newsletter', source: 'Mail gateway message trace', methods: ['gateway_export'], sourceHash: H('4d'), verificationHash: H('4d'), detail: 'Routine release of a bulk newsletter for jdoe. Unrelated to Q3_Remittance.docm.' },
      { id: 'ART-15', type: 'system_log', time: '2026-09-27T09:00:00Z', host: 'mail-gw-01', account: 'system', accountNative: 'SYSTEM', title: 'Gateway anti-spam signature update applied', source: 'mail-gw-01 System event log', methods: ['log_export'], sourceHash: H('5e'), verificationHash: H('5e'), detail: 'Scheduled hourly signature update. Unrelated to the intrusion.' },
      { id: 'ART-16', type: 'file', time: '2026-09-27T08:55:00Z', host: 'wks-desk-07', account: 'jdoe', title: 'wks-desk-07 Downloads listing (no Q3_Remittance.docm)', source: 'wks-desk-07 triage collection (Downloads listing)', methods: ['triage_collection'], sourceHash: H('6f'), verificationHash: H('6f'), detail: 'Listing taken from the second recipient\'s workstation: the attachment was never saved. Supports ART-06 but is not needed to reconstruct j.sanders.' },
      { id: 'ART-17', type: 'mail_trace', time: '2026-09-27T09:15:00Z', host: 'mail-gw-01', account: 'jdoe', title: 'jdoe mailbox audit: no MailItemsAccessed for the remittance message', source: 'Mailbox audit log export', methods: ['log_export'], sourceHash: H('7a'), verificationHash: H('7a'), detail: 'Audit shows the message was delivered but never opened or accessed. Corroborates ART-06.' },
      { id: 'ART-18', type: 'registry', time: '2026-09-27T08:30:00Z', host: 'wkstn-19', account: 'j.sanders', title: 'Existing HKCU Run entries (OneDrive, Teams)', source: 'wkstn-19 registry hive (NTUSER.DAT)', methods: ['disk_image', 'triage_collection'], sourceHash: H('8b'), verificationHash: H('8b'), detail: 'Two signed, long-standing Run entries last written weeks ago. Not the svchelp entry.' },
      { id: 'ART-19', type: 'system_log', time: '2026-09-27T09:12:00Z', host: 'wkstn-19', account: 'system', accountNative: 'SYSTEM', title: 'Defender signature update completed', source: 'wkstn-19 System event log', methods: ['log_export'], sourceHash: H('9c'), verificationHash: H('9c'), detail: 'Scheduled definition update. Unrelated to the intrusion.' },
      { id: 'ART-20', type: 'network_log', time: '2026-09-27T09:10:00Z', host: 'proxy-01', account: 'svc-backup', title: 'backup-srv-02 scheduled upload to the sanctioned backup vendor', source: 'Web proxy log export', methods: ['log_export'], sourceHash: H('0d'), verificationHash: H('0d'), detail: 'Large POST from backup-srv-02 (service account svc-backup) to backup.cloudvault.example, the same nightly job and destination as the previous 30 days. Different host and account; not wkstn-19.' },
      { id: 'ART-21', type: 'process_log', time: '2026-09-27T09:15:00Z', host: 'wkstn-19', account: 'system', accountNative: 'SYSTEM', title: 'OneDrive standalone updater scheduled task', source: 'Endpoint sensor process log export', methods: ['log_export'], sourceHash: H('1e'), verificationHash: H('1e'), detail: 'Signed Microsoft updater run by the Task Scheduler service. Routine.' },
      { id: 'ART-22', type: 'system_log', time: '2026-09-27T09:20:00Z', host: 'wkstn-19', account: 'system', accountNative: 'SYSTEM', title: 'Network isolation applied to wkstn-19', source: 'Endpoint sensor management console audit', methods: ['log_export'], sourceHash: H('2f'), verificationHash: H('2f'), detail: 'Containment action recorded by the sensor console; documents when the host was isolated (09:20) relative to the later memory capture.' },
    ],
  };

  /* Semantically distinct times (every ISO-8601 UTC):
   *  - `time` / row TimeGenerated: when the artifact's underlying event happened (event time).
   *  - `ingestionTime` / row IngestionTime: when a collector or the SIEM received a log-sourced record.
   *  - `acquisitionTime` / row AcquisitionTime: when the source-side export, snapshot or image was produced
   *    for this request (staged by the collection job after REQ receipt). Disk-image artifacts have no ingestion time.
   * The learner's own intake/verify/transfer actions are separate, later, and recorded only in the locker history. */
  const PROVENANCE = {
    'ART-01': ['10:04:00', '08:41:20'], 'ART-02': ['10:21:00'], 'ART-03': ['10:19:00', '08:45:45'], 'ART-04': ['10:21:00'], 'ART-05': ['10:22:00'],
    'ART-06': ['10:06:00', '08:41:50'], 'ART-07': ['10:24:00'], 'ART-08': ['10:09:00', '09:09:00'], 'ART-09': ['10:35:00'], 'ART-10': ['10:12:00', '09:30:30'],
    'ART-11': ['10:04:00', '08:33:20'], 'ART-12': ['10:21:00'], 'ART-13': ['10:19:00', '08:34:40'], 'ART-14': ['10:06:00', '08:52:20'], 'ART-15': ['10:08:00', '09:00:30'],
    'ART-16': ['10:26:00'], 'ART-17': ['10:07:00', '09:15:40'], 'ART-18': ['10:22:00'], 'ART-19': ['10:12:00', '09:12:30'], 'ART-20': ['10:10:00', '09:12:00'],
    'ART-21': ['10:19:00', '09:15:20'], 'ART-22': ['10:14:00', '09:20:35'],
  };
  scenario.artifacts.forEach((artifact) => {
    const [acq, ing] = PROVENANCE[artifact.id];
    artifact.acquisitionTime = `2026-09-27T${acq}Z`;
    if (ing) artifact.ingestionTime = `2026-09-27T${ing}Z`;
  });
  // Staged copies are released from the collection team to the SOC analyst at this time (custody transition 1).
  scenario.stagingReleasedAt = '2026-09-27T10:40:00Z';
  scenario.stagingCustodian = 'ir-collection-team';
  // Evidence staging share host that records the release (Host of the CustodyRelease ledger row).
  scenario.stagingHost = 'evidence-staging';
  // Artifacts the reconstruction relies on get a second, pre-release hash check in the ledger.
  scenario.repeatVerificationIds = ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-06', 'ART-07', 'ART-09'];

  // Background source/system events around the artifacts. Not acquirable; they are searchable context that
  // explains routine activity, patching, export-job health and acquisition mechanics. `hashOf` resolves to the
  // artifact's reported hash at build time. Purposes are instructor-only (expectedTruth.telemetryPurposes).
  const E = (n, t, table, host, account, type, result, detail, extra = {}) => ({ id: `M10-SRC-${String(n).padStart(2, '0')}`, time: `2026-09-27T${t}Z`, table, host, account, type, result, detail, ...extra });
  scenario.sourceEvents = [
    E(1, '08:31:05', 'DeviceProcessEvents', 'wkstn-19', 'j.sanders', 'ProcessStart', 'Allowed', 'OUTLOOK.EXE started by explorer.exe; signed Microsoft binary.', { ingestionTime: '2026-09-27T08:31:35Z' }),
    E(2, '08:32:10', 'DeviceProcessEvents', 'wkstn-19', 'j.sanders', 'ProcessStart', 'Allowed', 'ms-teams.exe started by explorer.exe; signed Microsoft binary.', { ingestionTime: '2026-09-27T08:32:40Z' }),
    E(3, '08:34:20', 'DeviceProcessEvents', 'wkstn-19', 'j.sanders', 'ProcessStart', 'Allowed', 'chrome.exe started by explorer.exe; first navigation to the finance ERP.', { ingestionTime: '2026-09-27T08:34:50Z' }),
    E(4, '08:38:02', 'DeviceProcessEvents', 'wkstn-19', 'j.sanders', 'ProcessStart', 'Allowed', 'EXCEL.EXE opened Q3_Payables_Summary.xlsx in Protected View; macros disabled; no child processes.', { ingestionTime: '2026-09-27T08:38:32Z' }),
    E(5, '09:12:20', 'DeviceProcessEvents', 'wkstn-19', 'system', 'ProcessStart', 'Allowed', 'MpCmdRun.exe -SignatureUpdate run by the Defender service.', { ingestionTime: '2026-09-27T09:12:50Z', accountNative: 'SYSTEM' }),
    E(6, '09:15:10', 'DeviceProcessEvents', 'wkstn-19', 'system', 'ProcessStart', 'Allowed', 'OneDriveStandaloneUpdater.exe run by Task Scheduler; signed Microsoft binary.', { ingestionTime: '2026-09-27T09:15:40Z', accountNative: 'SYSTEM' }),
    E(7, '09:26:40', 'DeviceProcessEvents', 'wkstn-19', 'system', 'ProcessStart', 'Allowed', 'SearchIndexer.exe routine re-index.', { ingestionTime: '2026-09-27T09:27:10Z', accountNative: 'SYSTEM' }),
    E(8, '08:40:30', 'DeviceFileEvents', 'wkstn-19', 'j.sanders', 'FileModified', 'Allowed', 'Outlook cache file j.sanders@example.ost updated by OUTLOOK.EXE.'),
    E(9, '09:02:15', 'DeviceFileEvents', 'wkstn-19', 'j.sanders', 'FileModified', 'Allowed', 'Teams cache files under AppData\\Roaming\\Microsoft\\Teams updated by ms-teams.exe.'),
    E(10, '09:18:45', 'DeviceFileEvents', 'wkstn-19', 'system', 'FileCreated', 'Allowed', 'Windows Update payload for KB-2026-09 written under SoftwareDistribution\\Download.', { accountNative: 'SYSTEM' }),
    E(11, '08:34:25', 'ProxyEvents', 'wkstn-19', 'j.sanders', 'HttpRequest', 'Allowed', 'GET https://erp.finance.example/ 200 (finance ERP).', { ingestionTime: '2026-09-27T08:35:25Z' }),
    E(12, '08:35:10', 'ProxyEvents', 'wkstn-19', 'j.sanders', 'HttpRequest', 'Allowed', 'CONNECT outlook.office365.com:443 allowed (mail).', { ingestionTime: '2026-09-27T08:36:10Z' }),
    E(13, '08:44:50', 'ProxyEvents', 'wkstn-19', 'j.sanders', 'HttpRequest', 'Allowed', 'CONNECT teams.microsoft.com:443 allowed (collaboration).', { ingestionTime: '2026-09-27T08:45:50Z' }),
    E(14, '08:46:20', 'ProxyEvents', 'wkstn-19', 'j.sanders', 'HttpRequest', 'Allowed', 'GET http://crl.microsoft.com/pki/crl/products/ 200 (certificate revocation check).', { ingestionTime: '2026-09-27T08:47:20Z' }),
    E(15, '09:05:30', 'ProxyEvents', 'wkstn-19', 'j.sanders', 'HttpRequest', 'Allowed', 'CONNECT outlook.office365.com:443 allowed (mail).', { ingestionTime: '2026-09-27T09:06:30Z' }),
    E(16, '09:16:30', 'ProxyEvents', 'wkstn-19', 'system', 'HttpRequest', 'Allowed', 'GET http://download.windowsupdate.com/ 200; 14.2 MB response (inbound patch download).', { ingestionTime: '2026-09-27T09:17:30Z', accountNative: 'SYSTEM' }),
    E(17, '08:50:05', 'ProxyEvents', 'wks-desk-07', 'jdoe', 'HttpRequest', 'Allowed', 'GET https://news.example/ 200 (general browsing).', { ingestionTime: '2026-09-27T08:51:05Z' }),
    E(18, '08:58:40', 'ProxyEvents', 'wks-desk-07', 'jdoe', 'HttpRequest', 'Allowed', 'CONNECT outlook.office365.com:443 allowed (mail).', { ingestionTime: '2026-09-27T08:59:40Z' }),
    E(19, '08:30:40', 'EmailEvents', 'mail-gw-01', 'm.okoye', 'MessageDelivered', 'Delivered', 'Bulk newsletter delivered to m.okoye; clean verdict.', { ingestionTime: '2026-09-27T08:31:00Z' }),
    E(20, '08:31:55', 'EmailEvents', 'mail-gw-01', 'p.nair', 'MessageDelivered', 'Delivered', 'Bulk newsletter delivered to p.nair; clean verdict.', { ingestionTime: '2026-09-27T08:32:15Z' }),
    E(21, '08:44:30', 'EmailEvents', 'mail-gw-01', 'p.nair', 'MessageDelivered', 'Delivered', 'Re: PO 4471 from ap@northwind-supply.example delivered to p.nair; no attachment; clean verdict.', { ingestionTime: '2026-09-27T08:44:50Z' }),
    E(22, '08:58:05', 'EmailEvents', 'mail-gw-01', 'system', 'MessageBlocked', 'Blocked', 'Bulk mailing to four unrelated recipients blocked by anti-spam rule; none addressed to Finance.', { ingestionTime: '2026-09-27T08:58:25Z', accountNative: 'SYSTEM' }),
    E(23, '09:28:10', 'SystemLog', 'wkstn-19', 'system', 'UpdateDownload', 'Success', 'Windows Update downloaded KB-2026-09 (cumulative update).', { ingestionTime: '2026-09-27T09:28:40Z', accountNative: 'SYSTEM' }),
    E(24, '09:29:30', 'SystemLog', 'wkstn-19', 'system', 'UpdateInstallStart', 'Success', 'Windows Update began installing KB-2026-09.', { ingestionTime: '2026-09-27T09:30:00Z', accountNative: 'SYSTEM' }),
    E(25, '09:31:05', 'SystemLog', 'wkstn-19', 'system', 'UpdateInstallComplete', 'Success', 'KB-2026-09 installed; restart not required (host remained isolated).', { ingestionTime: '2026-09-27T09:31:35Z', accountNative: 'SYSTEM' }),
    E(26, '10:09:30', 'SystemLog', 'mail-gw-01', 'svc-evidence-export', 'ExportJobComplete', 'Success', 'Gateway export batch EXPORT-A completed: 5 messages/traces written to the staging share.'),
    E(27, '10:10:30', 'SystemLog', 'proxy-01', 'svc-evidence-export', 'ExportJobComplete', 'Success', 'Proxy log export batch EXPORT-B completed: 2 log extracts written to the staging share.'),
    E(28, '10:19:30', 'SystemLog', 'edr-mgmt-01', 'svc-evidence-export', 'ExportJobWarning', 'Warning', 'Process-log export for wkstn-19 ended at 41,872 of 44,096 bytes: export buffer limit reached; file may be incomplete.'),
    E(29, '10:33:20', 'ForensicAcquisitions', 'wkstn-19', 'svc-memcapture', 'CaptureAgentStaged', 'Success', 'Memory capture agent staged on isolated wkstn-19 for the Digital Forensics team.'),
    E(30, '10:41:05', 'ForensicAcquisitions', 'wkstn-19', 'svc-memcapture', 'ImageCopied', 'Success', 'Memory image copied to the Digital Forensics share; SHA-256 computed after copy and matches the capture-time hash.', { hashOf: 'ART-09' }),
    E(31, '10:36:10', 'SystemLog', 'edr-mgmt-01', 'svc-evidence-export', 'StagingQuota', 'Info', 'Evidence staging share at 62 percent of quota; no action required.'),
  ];

  const expectedTruth = {
    requiredArtifactIds: ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07'],
    noiseArtifactIds: ['ART-10', 'ART-11', 'ART-12', 'ART-13', 'ART-14', 'ART-15', 'ART-18', 'ART-19', 'ART-20', 'ART-21'],
    // Optional context: relevant to a hypothesis or the timeline of custody but not required for the reconstruction.
    optionalSupportingArtifactIds: ['ART-06', 'ART-16', 'ART-17', 'ART-22'],
    mismatchArtifactId: 'ART-03',
    specialistArtifactId: 'ART-09',
    specialistCustodian: 'df-custodian',
    originalsForHold: ['ART-01', 'ART-02', 'ART-04', 'ART-07'],
    chain: ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07'],
    rootCauseArtifactIds: ['ART-01', 'ART-02', 'ART-03'],
    supportedTechniques: [
      { id: 'T1566.001', evidence: ['ART-01', 'ART-02'] },
      { id: 'T1204.002', evidence: ['ART-02', 'ART-03'] },
      { id: 'T1059.001', evidence: ['ART-03'] },
      { id: 'T1547.001', evidence: ['ART-05'] },
    ],
    unsupportedTechniques: ['T1567', 'T1486'],
    unknowns: ['exfiltration', 'memory'],
    escalationRoute: 'digital-forensics',
    // Instructor-only. Why each added background row exists; never rendered to the learner.
    benignSourceEventIds: ['M10-SRC-01', 'M10-SRC-02', 'M10-SRC-03', 'M10-SRC-04', 'M10-SRC-05', 'M10-SRC-06', 'M10-SRC-07', 'M10-SRC-08', 'M10-SRC-09', 'M10-SRC-10', 'M10-SRC-11',
      'M10-SRC-12', 'M10-SRC-13', 'M10-SRC-14', 'M10-SRC-15', 'M10-SRC-16', 'M10-SRC-17', 'M10-SRC-18', 'M10-SRC-19', 'M10-SRC-20', 'M10-SRC-21', 'M10-SRC-22', 'M10-SRC-23', 'M10-SRC-24',
      'M10-SRC-25', 'M10-SRC-26', 'M10-SRC-27', 'M10-SRC-31'],
    telemetryPurposes: {
      'M10-SRC-01..07': 'background: routine endpoint process activity before and after the incident chain',
      'M10-SRC-08..10': 'background: routine file activity (mail cache, collaboration cache, patch payload)',
      'M10-SRC-11..18': 'scope check: wkstn-19 and wks-desk-07 proxy traffic is ordinary GET/CONNECT with no upload (supports ART-08 absence-of-upload claim)',
      'M10-SRC-19..22': 'background: unrelated mail gateway traffic and a lookalike clean vendor message (ART-11)',
      'M10-SRC-23..25': 'alternate explanation: patch installation (ART-10) explains the 09:30 System-log activity',
      'M10-SRC-26..27': 'provenance: staging export jobs that produced the source copies; completion time is acquisition time not event time',
      'M10-SRC-28': 'evidence quality: explains why the first ART-03 copy hashes differently (truncated export)',
      'M10-SRC-29..30': 'provenance: memory image capture and copy (ART-09) for the specialist custody transfer',
      'M10-SRC-31': 'background: staging share health',
      'EvidenceCustodyLog': 'provenance: source-side export, hash-verification and release records derived from each artifact so a reviewer can reconstruct custody before the learner acts',
      'ART-11..15,18..21': 'adjacent unrelated artifacts (decoys); each carries a discriminating fact in its detail (sender/host/account/schedule)',
      'ART-16,17,22': 'optional supporting context (second recipient never opened; containment time)',
    },
  };

  return freeze({ schemaVersion: 1, scenario, expectedTruth });
})();

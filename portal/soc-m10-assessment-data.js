/* Independent, immutable Module 10 assessment fixture: a post-containment
 * evidence collection request for case EVD-5510 (j.sanders / WKSTN-19). All
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
      text: 'WKSTN-19 is isolated. Collect and preserve what we need to reconstruct how j.sanders was compromised and whether data left the network, keep custody defensible, and place originals under legal hold.',
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
      { id: 'ART-01', type: 'email_message', time: '2026-09-27T08:41:00Z', host: 'MAIL-GW-01', account: 'j.sanders', title: 'Inbound message "Q3 remittance" with attachment', source: 'Mail gateway quarantine export', methods: ['gateway_export'], sourceHash: H('a1'), verificationHash: H('a1'), detail: 'From billing@remit-portal.example to j.sanders; attachment Q3_Remittance.docm.' },
      { id: 'ART-02', type: 'file', time: '2026-09-27T08:44:00Z', host: 'WKSTN-19', account: 'j.sanders', title: 'Q3_Remittance.docm opened from Downloads', source: 'WKSTN-19 disk image (Downloads)', methods: ['disk_image', 'triage_collection'], sourceHash: H('a1'), verificationHash: H('a1'), detail: 'Same SHA-256 as the email attachment; opened by WINWORD.EXE at 08:44.' },
      { id: 'ART-03', type: 'process_log', time: '2026-09-27T08:45:00Z', host: 'WKSTN-19', account: 'j.sanders', title: 'WINWORD.EXE spawned powershell.exe -enc', source: 'Endpoint sensor process log export', methods: ['log_export'], sourceHash: H('b2'), verificationHash: H('b7'), reacquiredVerificationHash: H('b2'), detail: 'Parent WINWORD.EXE → child powershell.exe with an encoded command. The first export was truncated: re-hashing does not match the source-reported hash.' },
      { id: 'ART-04', type: 'file', time: '2026-09-27T08:46:00Z', host: 'WKSTN-19', account: 'j.sanders', title: 'Dropped binary svchelp.exe', source: 'WKSTN-19 disk image (AppData\\Roaming)', methods: ['disk_image', 'triage_collection'], sourceHash: H('c3'), verificationHash: H('c3'), detail: 'Unsigned binary written by powershell.exe.' },
      { id: 'ART-05', type: 'registry', time: '2026-09-27T08:46:30Z', host: 'WKSTN-19', account: 'j.sanders', title: 'HKCU Run key "svchelp" created', source: 'WKSTN-19 registry hive (NTUSER.DAT)', methods: ['disk_image', 'triage_collection'], sourceHash: H('d4'), verificationHash: H('d4'), detail: 'Run key points to the dropped svchelp.exe.' },
      { id: 'ART-06', type: 'mail_trace', time: '2026-09-27T08:41:30Z', host: 'MAIL-GW-01', account: 'jdoe', title: 'Same message delivered to jdoe; never opened', source: 'Mail gateway message trace', methods: ['gateway_export'], sourceHash: H('e5'), verificationHash: H('e5'), detail: 'Delivered to jdoe (WKS-DESK-07); mailbox audit shows no open or attachment access.' },
      { id: 'ART-07', type: 'file', time: '2026-09-27T09:05:00Z', host: 'WKSTN-19', account: 'j.sanders', title: 'Deleted staging archive q3.zip recovered', source: 'WKSTN-19 disk image (carved from Temp\\stage)', methods: ['disk_image'], sourceHash: H('f6'), verificationHash: H('f6'), detail: 'Archive of Finance documents created and deleted at 09:05. No transfer record accompanies it.' },
      { id: 'ART-08', type: 'network_log', time: '2026-09-27T09:07:00Z', host: 'PROXY-01', account: 'j.sanders', title: 'Proxy review: no upload from WKSTN-19', source: 'Web proxy log export', methods: ['log_export'], sourceHash: H('a7'), verificationHash: H('a7'), detail: 'No outbound upload or large POST from WKSTN-19 between 08:40 and 09:20.' },
      { id: 'ART-09', type: 'memory_image', time: '2026-09-27T10:35:00Z', host: 'WKSTN-19', account: 'j.sanders', title: 'Memory image of isolated WKSTN-19', source: 'Isolated WKSTN-19 live memory', methods: ['memory_capture'], sourceHash: H('b8'), verificationHash: H('b8'), detail: 'Captured after containment; analysis requires the Digital Forensics team.' },
      { id: 'ART-10', type: 'system_log', time: '2026-09-27T09:30:00Z', host: 'WKSTN-19', account: 'SYSTEM', title: 'Windows Update installed KB-2026-09', source: 'WKSTN-19 System event log', methods: ['log_export'], sourceHash: H('c9'), verificationHash: H('c9'), detail: 'Routine patch installation unrelated to the intrusion.' },
    ],
  };

  const expectedTruth = {
    requiredArtifactIds: ['ART-01', 'ART-02', 'ART-03', 'ART-04', 'ART-05', 'ART-07'],
    noiseArtifactIds: ['ART-10'],
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
  };

  return freeze({ schemaVersion: 1, scenario, expectedTruth });
})();

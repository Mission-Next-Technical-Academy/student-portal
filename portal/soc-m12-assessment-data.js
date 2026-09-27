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
      { id: 'AL-1201', severity: 'high', entityId: 'ws-204', status: 'new', signal: 'Suspicious script execution' },
      { id: 'AL-1202', severity: 'medium', entityId: 'acct-204', status: 'new', signal: 'Unfamiliar token refresh' },
      { id: 'AL-1203', severity: 'low', entityId: 'ws-118', status: 'new', signal: 'Rare script host' },
    ],
    rules: [
      { id: 'RULE-01', queryOutcome: 'broad', title: 'All script host launches' },
      { id: 'RULE-02', queryOutcome: 'narrow', title: 'Only exact hash on WS-204' },
      { id: 'RULE-03', queryOutcome: 'correlated', title: 'Process + hash + destination in window' },
    ],
    backups: [{ id: 'BK-204-0900', deviceId: 'ws-204', trust: 'verified-pre-incident', at: '2026-09-27T09:00:00Z' }, { id: 'BK-204-0930', deviceId: 'ws-204', trust: 'post-compromise', at: '2026-09-27T09:30:00Z' }],
    intelligence: [{ id: 'TI-601', indicator: '203.0.113.72', confidence: 'high', context: 'corroborated by redirect, endpoint execution and timing' }, { id: 'TI-603', indicator: '198.51.100.20', confidence: 'benign', context: 'approved signed update service' }],
    workflowNodes: ['preserve', 'approval', 'isolate', 'revoke-session', 'block-indicator', 'remove-persistence', 'restore', 'scan', 'monitor'],
  };
  const expectedTruth = {
    affectedEntities: ['ws-204', 'acct-204'], benignEntities: ['ws-118'], unrelatedEntities: ['acct-091'],
    selectedEvidence: ['EM-212', 'EP-301', 'EP-303', 'ID-402', 'NW-501'],
    timeline: ['EM-212', 'EP-301', 'NW-501', 'EP-303', 'ID-402'],
    demonstratedAttack: ['T1204.001', 'T1059.007', 'T1547.001', 'T1071.001'],
    attackEvidence: { 'T1204.001':['EM-212'], 'T1059.007':['EP-301'], 'T1547.001':['EP-303'], 'T1071.001':['NW-501'] },
    maliciousIndicator: '203.0.113.72', validRuleId: 'RULE-03',
    safeActions: ['preserve:ws-204', 'isolate:ws-204', 'revoke-session:acct-204', 'block-indicator:203.0.113.72'],
    requiredApprovals: ['isolate', 'revoke-session', 'restore'],
    residualRisk: ['policy-remediation', 'monitoring'],
  };
  return freeze({ schemaVersion: 1, scenario, expectedTruth });
})();

/* Independent, immutable Module 04 assessment fixture contract. */
const SocM04AssessmentData = (() => {
  'use strict';

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }

  const scenario = {
    id: 'M04-ASSESS-2026-09-24',
    caseId: 'DET-4424',
    start: '2026-09-24T09:00:00Z',
    end: '2026-09-24T09:20:00Z',
    generatedAt: '2026-09-24T09:21:00Z',
    telemetry: [
      { id: 'M04-A-001', time: '2026-09-24T09:01:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-41', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-002', time: '2026-09-24T09:02:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-42', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-003', time: '2026-09-24T09:03:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-43', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-004', time: '2026-09-24T09:04:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-44', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-005', time: '2026-09-24T09:05:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-45', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-006', time: '2026-09-24T09:06:00Z', type: 'AuthSuccess', source: 'AuthLog', account: 'acct-44', sourceIp: '198.51.100.64', result: 'Success', device: 'Unknown' },
      { id: 'M04-A-007', time: '2026-09-24T09:07:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
      { id: 'M04-A-008', time: '2026-09-24T09:08:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
      { id: 'M04-A-009', time: '2026-09-24T09:09:00Z', type: 'AuthFailure', source: 'AuthLog', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
      // Sprint 2 background and alternate-explanation rows (purposes in truth.rowPurpose).
      { id: 'M04-A-101', source: 'AuthLog', time: '2026-09-24T09:00:20Z', type: 'AuthSuccess', account: 'acct-41', sourceIp: '10.44.3.18', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-102', source: 'AuthLog', time: '2026-09-24T09:00:45Z', type: 'AuthSuccess', account: 'acct-51', sourceIp: '10.44.3.30', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-103', source: 'AuthLog', time: '2026-09-24T09:02:30Z', type: 'AuthSuccess', account: 'acct-52', sourceIp: '10.44.3.31', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-104', source: 'AuthLog', time: '2026-09-24T09:04:10Z', type: 'AuthSuccess', account: 'acct-43', sourceIp: '10.44.3.18', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-105', source: 'AuthLog', time: '2026-09-24T09:05:30Z', type: 'AuthSuccess', account: 'acct-53', sourceIp: '10.44.3.33', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-106', source: 'AuthLog', time: '2026-09-24T09:08:15Z', type: 'AuthSuccess', account: 'acct-45', sourceIp: '10.44.3.18', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-107', source: 'AuthLog', time: '2026-09-24T09:10:40Z', type: 'AuthSuccess', account: 'acct-54', sourceIp: '10.44.3.34', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-108', source: 'AuthLog', time: '2026-09-24T09:12:05Z', type: 'AuthSuccess', account: 'acct-42', sourceIp: '10.44.3.22', result: 'Success', device: 'Managed workstation' },
      { id: 'M04-A-109', source: 'AuthLog', time: '2026-09-24T09:11:00Z', type: 'AuthFailure', account: 'acct-31', sourceIp: '203.0.113.140', result: 'Failure', device: 'Branch workstation' },
      { id: 'M04-A-110', source: 'AuthLog', time: '2026-09-24T09:11:40Z', type: 'AuthSuccess', account: 'acct-31', sourceIp: '203.0.113.140', result: 'Success', device: 'Branch workstation' },
      { id: 'M04-A-111', source: 'AuthLog', time: '2026-09-24T09:12:10Z', type: 'AuthFailure', account: 'acct-32', sourceIp: '203.0.113.140', result: 'Failure', device: 'Branch workstation' },
      { id: 'M04-A-112', source: 'AuthLog', time: '2026-09-24T09:12:50Z', type: 'AuthSuccess', account: 'acct-32', sourceIp: '203.0.113.140', result: 'Success', device: 'Branch workstation' },
      { id: 'M04-A-113', source: 'AuthLog', time: '2026-09-24T09:13:20Z', type: 'AuthFailure', account: 'acct-33', sourceIp: '203.0.113.140', result: 'Failure', device: 'Branch workstation' },
      { id: 'M04-A-114', source: 'AuthLog', time: '2026-09-24T09:13:55Z', type: 'AuthSuccess', account: 'acct-33', sourceIp: '203.0.113.140', result: 'Success', device: 'Branch workstation' },
      { id: 'M04-A-115', source: 'AuthLog', time: '2026-09-24T09:05:00Z', type: 'AuthFailure', account: 'svc-monitor', sourceIp: '10.44.0.9', result: 'Failure', device: 'Synthetic probe' },
      { id: 'M04-A-116', source: 'AuthLog', time: '2026-09-24T09:10:00Z', type: 'AuthFailure', account: 'svc-monitor', sourceIp: '10.44.0.9', result: 'Failure', device: 'Synthetic probe' },
      { id: 'M04-A-117', source: 'AuthLog', time: '2026-09-24T09:15:00Z', type: 'AuthFailure', account: 'svc-monitor', sourceIp: '10.44.0.9', result: 'Failure', device: 'Synthetic probe' },
      { id: 'M04-A-118', source: 'AuthLog', time: '2026-09-24T09:15:30Z', type: 'AuthFailure', account: 'svc-backup', sourceIp: '10.44.8.5', result: 'Failure', device: 'Backup agent' },
      { id: 'M04-A-119', source: 'AuthLog', time: '2026-09-24T09:16:00Z', type: 'AuthFailure', account: 'svc-backup', sourceIp: '10.44.8.5', result: 'Failure', device: 'Backup agent' },
      { id: 'M04-A-120', source: 'AuthLog', time: '2026-09-24T09:16:30Z', type: 'AuthSuccess', account: 'svc-backup', sourceIp: '10.44.8.5', result: 'Success', device: 'Backup agent' },
      { id: 'M04-A-121', source: 'AuthLog', time: '2026-09-24T09:12:30Z', type: 'AuthSuccess', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Success', device: 'Managed mail client' },
    ],
    reports: [
      { id: 'M04-R-001', time: '2026-09-24T09:10:00Z', source: 'Identity Operations', sourceReliability: 'A1 · direct internal source', confidence: 96, freshness: 'Current · observed 15 minutes before case window', status: 'Reviewed', campaign: 'Credential Rotation CR-204', attackReferences: [], kind: 'Change report', summary: 'acct-17 password rotation completed at 08:55Z; managed mail client may retry its cached credential.' },
      { id: 'M04-R-002', time: '2026-09-24T09:11:00Z', source: 'Threat Desk', sourceReliability: 'B2 · partner intelligence, corroboration pending', confidence: 72, freshness: 'Current · received 2026-09-24', status: 'Unverified context', campaign: 'Northstar Spray Cluster (reported)', attackReferences: ['T1110.003 · Password Spraying'], kind: 'Campaign report', summary: '198.51.100.64 is currently associated with distributed password-spray activity.' },
    ],
    iocs: [
      { id: 'M04-I-001', type: 'ip', value: '198.51.100.64', confidence: 88, status: 'active', firstSeen: '2026-09-24T08:40:00Z', lastSeen: '2026-09-24T09:05:00Z', sourceReportId: 'M04-R-002', context: 'Current password-spray infrastructure; exact source match in assessment telemetry.' },
      { id: 'M04-I-002', type: 'ip', value: '192.0.2.91', confidence: 61, status: 'active', firstSeen: '2026-09-22T12:00:00Z', lastSeen: '2026-09-22T12:00:00Z', sourceReportId: 'M04-R-002', context: 'Related to a separate phishing cluster; no assessment telemetry match.' },
      { id: 'M04-I-003', type: 'domain', value: 'legacy-drop.example', confidence: 77, status: 'expired', firstSeen: '2026-06-01T00:00:00Z', lastSeen: '2026-06-03T00:00:00Z', sourceReportId: 'M04-R-002', context: 'Retired infrastructure; historical context only.' },
    ],
    truth: {
      maliciousSourceIp: '198.51.100.64',
      targetedAccounts: ['acct-41', 'acct-42', 'acct-43', 'acct-44', 'acct-45'],
      confirmedCompromisedAccounts: ['acct-44'],
      successfulAuthenticationEventIds: ['M04-A-006'],
      benignRetry: { sourceIp: '203.0.113.77', account: 'acct-17', eventIds: ['M04-A-007', 'M04-A-008', 'M04-A-009'], explanationReportId: 'M04-R-001' },
      corroboratingIocIds: ['M04-I-001'],
      unrelatedIocIds: ['M04-I-002', 'M04-I-003'],
      // Sprint 2: documented row purposes. Not student-facing, not answer labels; the rule truth below is unchanged.
      benignBackgroundEventIds: ['M04-A-101', 'M04-A-102', 'M04-A-103', 'M04-A-104', 'M04-A-105', 'M04-A-106', 'M04-A-107', 'M04-A-108', 'M04-A-109', 'M04-A-110', 'M04-A-111', 'M04-A-112', 'M04-A-113', 'M04-A-114', 'M04-A-115', 'M04-A-116', 'M04-A-117', 'M04-A-118', 'M04-A-119', 'M04-A-120', 'M04-A-121', 'M04-X-001', 'M04-X-002', 'M04-X-003', 'M04-X-004', 'M04-X-005', 'M04-X-006', 'M04-X-007'],
      rowPurpose: {
        'M04-A-101..108': 'baseline: routine managed-workstation sign-ins from each user\'s usual LAN range (contrast with acct-44 success from an unfamiliar address)',
        'M04-A-109..114': 'tuning: three shared-egress branch users each mistype once then succeed; trips a distinct-account count of 3, not the threshold of 5; IpIntel and success rows discriminate',
        'M04-A-115..117': 'tuning: scheduled availability probe with a deliberately invalid test credential (SystemLog + SCH-031 explain it); trips a raw failure count, not distinct accounts',
        'M04-A-118..120': 'tuning: backup agent retries an expired vault credential then succeeds (SystemLog + SCH-044 explain it)',
        'M04-X-001..007': 'context (console-only AppAudit/SystemLog/DirectoryAudit rows): mail-client auth error and re-sync corroborate the stale-cache explanation, scheduled backup and probe jobs, collector heartbeat/lag baseline, routine directory change',
        'M04-A-121': 'recovery validation: acct-17 re-authenticates after the rotation, confirming the earlier retries were a stale client cache',
      },
      rule: { groupingField: 'sourceIp', metric: 'distinctAccounts', threshold: 5, windowMinutes: 10, matchEventIds: ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-006'], excludeEventIds: ['M04-A-007', 'M04-A-008', 'M04-A-009'] },
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();

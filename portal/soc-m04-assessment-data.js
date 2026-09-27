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
      { id: 'M04-A-001', time: '2026-09-24T09:01:00Z', type: 'AuthFailure', account: 'acct-41', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-002', time: '2026-09-24T09:02:00Z', type: 'AuthFailure', account: 'acct-42', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-003', time: '2026-09-24T09:03:00Z', type: 'AuthFailure', account: 'acct-43', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-004', time: '2026-09-24T09:04:00Z', type: 'AuthFailure', account: 'acct-44', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-005', time: '2026-09-24T09:05:00Z', type: 'AuthFailure', account: 'acct-45', sourceIp: '198.51.100.64', result: 'Failure', device: 'Unknown' },
      { id: 'M04-A-006', time: '2026-09-24T09:06:00Z', type: 'AuthSuccess', account: 'acct-44', sourceIp: '198.51.100.64', result: 'Success', device: 'Unknown' },
      { id: 'M04-A-007', time: '2026-09-24T09:07:00Z', type: 'AuthFailure', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
      { id: 'M04-A-008', time: '2026-09-24T09:08:00Z', type: 'AuthFailure', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
      { id: 'M04-A-009', time: '2026-09-24T09:09:00Z', type: 'AuthFailure', account: 'acct-17', sourceIp: '203.0.113.77', result: 'Failure', device: 'Managed mail client' },
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
      rule: { groupingField: 'sourceIp', metric: 'distinctAccounts', threshold: 5, windowMinutes: 10, matchEventIds: ['M04-A-001', 'M04-A-002', 'M04-A-003', 'M04-A-004', 'M04-A-005', 'M04-A-006'], excludeEventIds: ['M04-A-007', 'M04-A-008', 'M04-A-009'] },
    },
  };

  return freeze({ schemaVersion: 1, scenario });
})();

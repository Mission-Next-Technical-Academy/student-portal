// Deterministic four-source SIEM case for Module 3. The common fields model
// normalization while source and raw_event preserve provenance.
const M03_LOG_DATASET = {
  id: 'm03-service-account-takeover',
  title: 'Service account takeover · unified events',
  subtitle: 'Correlate identity, directory, application, and system telemetry',
  description: 'Investigate acct-428 across AuthLog, DirectoryAudit, AppAudit, and SystemLog. Compare the suspicious sequence with a documented maintenance event, then submit a verdict and analyst handoff in the module.',
  fields: ['timestamp', 'source', 'account', 'host', 'source_ip', 'event_type', 'result', 'session_id', 'raw_event', 'context'],
  logs: [
    { id: 1, timestamp: '2026-09-18 09:14:03', source: 'AuthLog', account: 'acct-428', host: 'idp-01', source_ip: '198.51.100.24', event_type: 'SignIn', result: 'Failure', session_id: '—', raw_event: 'Invalid password', context: 'unfamiliar source' },
    { id: 2, timestamp: '2026-09-18 09:14:19', source: 'AuthLog', account: 'acct-428', host: 'idp-01', source_ip: '198.51.100.24', event_type: 'SignIn', result: 'Success', session_id: 'S-8841', raw_event: 'MFA satisfied', context: 'unfamiliar source' },
    { id: 3, timestamp: '2026-09-18 09:16:11', source: 'DirectoryAudit', account: 'acct-428', host: 'dc-02', source_ip: '198.51.100.24', event_type: 'RoleAdded', result: 'Success', session_id: 'S-8841', raw_event: 'Added to Billing-Exporters', context: 'no change ticket found' },
    { id: 4, timestamp: '2026-09-18 09:18:42', source: 'AppAudit', account: 'acct-428', host: 'billing-app', source_ip: '198.51.100.24', event_type: 'BulkExport', result: 'Success', session_id: 'S-8841', raw_event: 'Exported 184 customer records', context: 'new export volume' },
    { id: 5, timestamp: '2026-09-18 09:20:01', source: 'SystemLog', account: 'svc-billing', host: 'billing-app', source_ip: '10.20.4.8', event_type: 'ServiceRestart', result: 'Success', session_id: 'JOB-22', raw_event: 'Scheduled restart', context: 'CHG-204 approved maintenance' },
    { id: 6, timestamp: '2026-09-18 09:21:15', source: 'AuthLog', account: 'j.lee', host: 'idp-01', source_ip: '203.0.113.9', event_type: 'SignIn', result: 'Failure', session_id: '—', raw_event: 'Invalid password', context: 'unrelated account and source' },
    { id: 7, timestamp: '2026-09-18 09:23:50', source: 'SystemLog', account: 'billing-app', host: 'billing-app', source_ip: '10.20.4.8', event_type: 'CollectorHeartbeat', result: 'Delayed', session_id: '—', raw_event: 'Heartbeat delayed 42 seconds', context: 'telemetry gap; not an account action' },
    { id: 8, timestamp: '2026-09-18 09:29:02', source: 'DirectoryAudit', account: 'acct-428', host: 'dc-02', source_ip: '198.51.100.24', event_type: 'RoleRemoved', result: 'Success', session_id: 'S-8841', raw_event: 'Removed from Billing-Exporters', context: 'automated cleanup after alert' },
  ],
  tasks: [
    { id: 't1', title: 'Pivot on the account', points: 10, description: 'Find all records for acct-428 and preserve the source and session fields.', hint: 'Try: search account=acct-428', validation: { type: 'count', expected: 5 } },
    { id: 't2', title: 'Compare the four sources', points: 20, description: 'Count events by source to see which telemetry contributes evidence.', hint: 'Try: search account=acct-428 | count by source', validation: { type: 'groupby', field: 'source', expected_top: 'AuthLog' } },
    { id: 't3', title: 'Check the suspicious source', points: 30, description: 'Pivot on 198.51.100.24 and sort chronologically to reconstruct the linked chain.', hint: 'Try: search source_ip=198.51.100.24 | sort by timestamp', validation: { type: 'count', expected: 4 } },
  ],
};
Object.assign(window, { M03_LOG_DATASET });

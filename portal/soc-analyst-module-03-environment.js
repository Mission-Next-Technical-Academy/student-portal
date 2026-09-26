/* Module 03 SIEM & Log Analysis console. Fictional, vendor-neutral, bounded.
 *
 * Replaces the Guided Lab / Assessment Lab / Required Labs launch panels in
 * soc-analyst-module-03.js with an in-module SIEM console, built on the same
 * pattern as Module 02's Network & Identity Security console
 * (soc-analyst-module-02-environment.js): a header, simulator-local tabs, a
 * working view and a details drawer. It adds a real query surface — the KQL
 * engine and editor ported from defender-lab (portal/kql-engine.js,
 * portal/kql-editor.js) — over normalized telemetry tables.
 *
 * Two scopes share the console but not the data:
 *   practice — CASE-MN-428 (acct-428 service-account takeover, the case the
 *              Lecture teaches). A ten-step guide with decreasing support; each
 *              step verifies what the learner actually did (query results,
 *              entities opened, evidence pinned) rather than a click path.
 *   prove    — CASE-MN-517 (overnight password spray). No guide, no hints, no
 *              pre-submission feedback. The learner records determinations,
 *              actions and a written handoff; moduleThreeScoreAssessment()
 *              scores competencies from a data rubric (docs/
 *              LAB_ASSESSMENT_STANDARD.md) and the submission goes to
 *              instructor review via recordLabAttempt().
 *
 * State lives in moduleThreeState.console (soc-analyst-module-03.js), so it
 * rides the existing LabRuntime case_state sync. Query results are never
 * persisted — they are recomputed from the saved query text.
 */

/* ------------------------------------------------------------ fixtures */

const M03E_SOURCE_COLORS = { AuthLog: 'auth', DirectoryAudit: 'dir', AppAudit: 'app', SystemLog: 'sys' };

// Native field names per source → normalized field. Drives the Data Sources
// tab and each record's "native record" view, so normalization is visible.
const M03E_SOURCE_MAPPINGS = {
  AuthLog: { native: 'Identity provider sign-in log (JSON)', fields: [['ts', 'TimeGenerated'], ['principal', 'Account'], ['client_ip', 'SourceIp'], ['idp_node', 'Host'], ['event', 'EventType'], ['outcome', 'Result'], ['sid', 'SessionId'], ['auth_method', 'AuthMethod'], ['geo_country', 'Country'], ['reason', 'Detail']] },
  DirectoryAudit: { native: 'Directory change audit (key=value)', fields: [['time', 'TimeGenerated'], ['target_account', 'Account'], ['caller_ip', 'SourceIp'], ['dc', 'Host'], ['operation', 'EventType'], ['status', 'Result'], ['correlation_session', 'SessionId'], ['initiated_by', 'InitiatedBy'], ['target_group', 'TargetGroup'], ['message', 'Detail']] },
  AppAudit: { native: 'Application activity audit (JSON)', fields: [['timestamp', 'TimeGenerated'], ['actor', 'Account'], ['remote_addr', 'SourceIp'], ['app_host', 'Host'], ['action', 'EventType'], ['result', 'Result'], ['session', 'SessionId'], ['app', 'Application'], ['record_count', 'Records'], ['object', 'Detail']] },
  SystemLog: { native: 'Host / collector syslog (text)', fields: [['@timestamp', 'TimeGenerated'], ['identity', 'Account'], ['host_ip', 'SourceIp'], ['hostname', 'Host'], ['msg_type', 'EventType'], ['severity_result', 'Result'], ['job', 'SessionId'], ['change_ref', 'ChangeId'], ['message', 'Detail']] },
};
const M03E_UNIFIED_FIELDS = ['TimeGenerated', 'EventSource', 'EventType', 'Account', 'SourceIp', 'Host', 'SessionId', 'Result', 'Detail', 'EventId', 'RawTimestamp', 'timestamp_utc', 'raw_timestamp', 'source_type', 'user', 'session_id', 'src_ip', 'host', 'action', 'outcome', 'raw_event_id'];

function m03eRow(source, id, day, hms, fields) {
  return { TimeGenerated: `${day}T${hms}Z`, EventSource: source, EventId: id, __rid: id, SessionId: '—', Detail: '', ...fields };
}

function m03eBuildDataset(spec) {
  // Tables are stored newest-first, the way a SIEM returns an unsorted search.
  // Learners have to sort to see the sequence; the guide checks that they did.
  const newestFirst = (rows) => rows.slice().sort((a, b) => b.TimeGenerated.localeCompare(a.TimeGenerated));
  const tables = {};
  ['AuthLog', 'DirectoryAudit', 'AppAudit', 'SystemLog'].forEach((name) => { tables[name] = newestFirst(spec.events.filter((row) => row.EventSource === name)); });
  tables.UnifiedEvents = newestFirst(spec.events.map((row) => {
    const out = { __rid: row.__rid };
    M03E_UNIFIED_FIELDS.forEach((f) => { out[f] = row[f] ?? ''; });
    out.timestamp_utc = row.TimeGenerated;
    out.raw_timestamp = row.RawTimestamp || row.TimeGenerated;
    out.source_type = row.EventSource;
    // A host service identity is source context, not an interactive user. Keep
    // it on the native record but leave normalized user unset for restarts.
    out.user = row.EventSource === 'SystemLog' && row.EventType === 'ServiceRestart' ? '' : row.Account;
    out.session_id = row.SessionId;
    out.src_ip = row.SourceIp;
    out.host = row.Host;
    out.outcome = row.Result;
    out.raw_event_id = row.EventId;
    if (row.EventSource === 'AuthLog') out.action = row.Result === 'Failure' ? 'failed sign-in' : row.Result === 'Success' ? 'successful sign-in' : row.EventType;
    else if (row.EventSource === 'DirectoryAudit' && row.EventType === 'RoleAdded') out.action = 'directory role grant';
    else if (row.EventSource === 'AppAudit' && row.EventType === 'BulkExport') out.action = 'application export';
    else if (row.EventSource === 'SystemLog' && row.EventType === 'ServiceRestart') out.action = 'service restart';
    else out.action = row.EventType;
    return out;
  }));
  tables.IdentityInfo = spec.identities;
  tables.IpIntel = spec.ips;
  Object.entries(spec.watchlists).forEach(([name, list]) => { tables[name] = list.rows; });
  const records = {};
  spec.events.forEach((row) => { records[row.__rid] = row; });
  const times = spec.events.map((row) => Date.parse(row.TimeGenerated));
  return { ...spec, tables, records, now: new Date(Math.max(...times) + 15 * 60e3).toISOString() };
}

/* Practice: CASE-MN-428 — the service-account takeover the Lecture uses. */
const M03E_PRACTICE = (function () {
  const d = '2026-09-18';
  const A = (id, hms, f) => m03eRow('AuthLog', id, d, hms, { EventType: 'SignIn', Host: 'idp-01', ...f });
  const D = (id, hms, f) => m03eRow('DirectoryAudit', id, d, hms, { Host: 'dc-02', ...f });
  const P = (id, hms, f) => m03eRow('AppAudit', id, d, hms, { Host: 'billing-app', Application: 'BillingApp', ...f });
  const S = (id, hms, f) => m03eRow('SystemLog', id, d, hms, f);
  return m03eBuildDataset({
    caseId: 'CASE-MN-428',
    day: d,
    events: [
      A('A-1001', '07:10:22', { Account: 'acct-428', SourceIp: '10.20.4.15', Result: 'Success', SessionId: 'S-8790', AuthMethod: 'Service credential', Country: 'Internal', Detail: 'Scheduled reconciliation job sign-in' }),
      A('A-1002', '08:02:10', { Account: 'j.lee', SourceIp: '10.20.4.31', Result: 'Success', SessionId: 'S-8801', AuthMethod: 'Password + MFA', Country: 'Internal', Detail: 'MFA satisfied' }),
      A('A-1003', '09:02:00', { RawTimestamp: `${d}T05:02:00-04:00`, Account: 'acct-428', SourceIp: '198.51.100.18', Result: 'Failure', AuthMethod: 'Password', Country: 'NL', Detail: 'Invalid password; source timestamp 05:02 UTC−04:00 normalized to 09:02 UTC' }),
      A('A-1004', '09:05:12', { Account: 'j.lee', SourceIp: '203.0.113.9', Result: 'Failure', AuthMethod: 'Password', Country: 'PT', Detail: 'Invalid password' }),
      A('A-1005', '09:14:03', { Account: 'm.ortiz', SourceIp: '10.20.4.22', Result: 'Failure', AuthMethod: 'Password', Country: 'Internal', Detail: 'Invalid password' }),
      A('A-1006', '09:04:00', { Account: 'acct-428', SourceIp: '198.51.100.18', Result: 'Success', SessionId: 'S-8841', AuthMethod: 'Password + MFA push', Country: 'NL', Detail: 'MFA push approved' }),
      A('A-1007', '09:21:15', { Account: 'j.lee', SourceIp: '203.0.113.9', Result: 'Failure', AuthMethod: 'Password', Country: 'PT', Detail: 'Invalid password' }),
      A('A-1008', '09:22:02', { Account: 'j.lee', SourceIp: '203.0.113.9', Result: 'Success', SessionId: 'S-8850', AuthMethod: 'Password + MFA', Country: 'PT', Detail: 'MFA satisfied' }),
      A('A-1009', '09:40:00', { Account: 'svc-billing', SourceIp: '10.20.4.8', Result: 'Success', SessionId: 'JOB-22', AuthMethod: 'Service credential', Country: 'Internal', Detail: 'Scheduled report job' }),
      D('D-2001', '09:08:00', { Account: 'acct-428', SourceIp: '198.51.100.18', EventType: 'RoleAdded', Result: 'Success', SessionId: 'S-8841', InitiatedBy: 'acct-428', TargetGroup: 'Billing-Exporters', Detail: 'Directory role grant: added to Billing-Exporters' }),
      D('D-2002', '09:29:02', { Account: 'acct-428', SourceIp: '10.20.1.5', EventType: 'RoleRemoved', Result: 'Success', SessionId: 'S-8841', InitiatedBy: 'soc-automation', TargetGroup: 'Billing-Exporters', Detail: 'Removed from Billing-Exporters (automated containment after alert)' }),
      D('D-2003', '08:30:40', { Account: 'h.diaz', SourceIp: '10.20.4.44', EventType: 'GroupAdded', Result: 'Success', SessionId: '—', InitiatedBy: 'it-admin', TargetGroup: 'HR-Read', Detail: 'Added to HR-Read (CHG-199)' }),
      P('P-3001', '09:12:00', { Account: 'acct-428', SourceIp: '198.51.100.18', EventType: 'BulkExport', Result: 'Success', SessionId: 'S-8841', Records: 184, Detail: 'Application export of 184 customer records' }),
      P('P-3002', '08:58:42', { Account: 'acct-428', SourceIp: '198.51.100.18', EventType: 'Search', Result: 'Success', SessionId: 'S-8841', Records: 184, Detail: 'Customer search: all active accounts' }),
      P('P-3003', '08:50:05', { Account: 'm.ortiz', SourceIp: '10.20.4.22', EventType: 'ViewInvoice', Result: 'Success', SessionId: 'S-8812', Records: 3, Detail: 'Viewed 3 invoices' }),
      P('P-3004', '09:45:10', { Account: 'svc-billing', SourceIp: '10.20.4.8', EventType: 'ScheduledReport', Result: 'Success', SessionId: 'JOB-22', Records: 2100, Detail: 'Nightly revenue report (CHG-210)' }),
      S('S-4001', '09:10:00', { Account: 'svc-backup', SourceIp: '10.20.4.8', Host: 'backup-01', EventType: 'ServiceRestart', Result: 'Success', SessionId: '—', ChangeId: 'CHG-221', Detail: 'Service restart, approved change CHG-221' }),
      S('S-4002', '09:23:50', { Account: 'billing-app', SourceIp: '10.20.4.8', Host: 'billing-app', EventType: 'CollectorHeartbeat', Result: 'Delayed', ChangeId: '', Detail: 'Heartbeat delayed 42 seconds; no events dropped' }),
    ],
    identities: [
      { Account: 'acct-428', DisplayName: 'Billing reconciliation (service)', Type: 'Service account', Department: 'Finance Ops', Owner: 'k.watts', Privileged: 'No', UsualSourceIp: '10.20.4.15', Notes: 'Non-interactive. Interactive or MFA sign-ins are not expected.' },
      { Account: 'j.lee', DisplayName: 'Jordan Lee', Type: 'User', Department: 'Sales', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.31', Notes: 'Frequent traveller' },
      { Account: 'm.ortiz', DisplayName: 'Maria Ortiz', Type: 'User', Department: 'Finance', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.22', Notes: '' },
      { Account: 'h.diaz', DisplayName: 'Helen Diaz', Type: 'User', Department: 'Human Resources', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.44', Notes: '' },
      { Account: 'svc-billing', DisplayName: 'Billing platform (service)', Type: 'Service account', Department: 'IT', Owner: 'it-admin', Privileged: 'Yes', UsualSourceIp: '10.20.4.8', Notes: 'Runs scheduled jobs under JOB-* sessions' },
    ],
    ips: [
      { SourceIp: '198.51.100.18', Type: 'External', Country: 'NL', Asn: 'AS64500 · CloudVPS hosting', FirstSeen: `${d} 09:02`, Reputation: 'Suspicious: hosting provider, no prior history' },
      { SourceIp: '203.0.113.9', Type: 'External', Country: 'PT', Asn: 'AS64511 · Lisboa Hotel Wi-Fi', FirstSeen: '2026-09-17 19:40', Reputation: 'Neutral: consumer / hospitality network' },
      { SourceIp: '10.20.4.15', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Finance servers', FirstSeen: '—', Reputation: 'Internal' },
      { SourceIp: '10.20.4.8', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Billing platform', FirstSeen: '—', Reputation: 'Internal' },
      { SourceIp: '10.20.4.22', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Workstations', FirstSeen: '—', Reputation: 'Internal' },
      { SourceIp: '10.20.4.31', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Workstations', FirstSeen: '—', Reputation: 'Internal' },
    ],
    watchlists: {
      ChangeTickets: { title: 'Approved change tickets', rows: [
        { ChangeId: 'CHG-199', Summary: 'Grant h.diaz HR-Read', Account: 'h.diaz', Window: `${d} 08:00–09:00`, Status: 'Approved' },
        { ChangeId: 'CHG-221', Summary: 'Restart backup service', Account: 'svc-backup', Window: `${d} 09:00–09:20`, Status: 'Approved' },
        { ChangeId: 'CHG-210', Summary: 'Nightly revenue report job', Account: 'svc-billing', Window: 'Daily 09:45', Status: 'Approved' },
      ] },
      TravelNotices: { title: 'Employee travel notices', rows: [
        { Account: 'j.lee', Destination: 'Lisbon, PT', From: '2026-09-17', To: '2026-09-20', ExpectedIp: '203.0.113.9' },
      ] },
    },
    alerts: [
      { id: 'ALT-3101', time: `${d}T09:12:00Z`, severity: 'High', title: 'Suspicious authentication-to-export sequence — acct-428', entities: ['acct-428', '198.51.100.18', 'S-8841'], rule: 'Failed sign-in → success → directory role grant → application export within 30 minutes, with at least two shared dimensions (session preferred)', query: 'UnifiedEvents\n| where Account == "acct-428"\n| where SessionId == "S-8841"\n| sort by TimeGenerated asc' },
    ],
  });
}());

/* Prove: CASE-MN-517 — overnight password spray. Different entities, times and
 * tables from Practice so the assessment is a transfer, not a replay. */
const M03E_PROVE = (function () {
  const d = '2026-09-21';
  const A = (id, hms, f) => m03eRow('AuthLog', id, d, hms, { EventType: 'SignIn', Host: 'idp-02', ...f });
  const D = (id, hms, f) => m03eRow('DirectoryAudit', id, d, hms, { Host: 'dc-01', ...f });
  const P = (id, hms, f) => m03eRow('AppAudit', id, d, hms, f);
  const S = (id, hms, f) => m03eRow('SystemLog', id, d, hms, f);
  const spray = (id, hms, account) => A(id, hms, { Account: account, SourceIp: '203.0.113.77', Result: 'Failure', AuthMethod: 'Password', Country: 'RO', Detail: 'Invalid password' });
  return m03eBuildDataset({
    caseId: 'CASE-MN-517',
    day: d,
    events: [
      spray('A-5001', '02:03:02', 'r.kaur'), spray('A-5002', '02:03:48', 'p.sato'), spray('A-5003', '02:04:31', 'l.brooks'),
      spray('A-5004', '02:05:10', 'a.morgan'), spray('A-5005', '02:05:55', 'd.hale'), spray('A-5006', '02:06:40', 'm.ortiz'),
      spray('A-5007', '02:08:02', 'r.kaur'), spray('A-5008', '02:08:44', 'p.sato'), spray('A-5009', '02:09:30', 'l.brooks'), spray('A-5010', '02:10:12', 'a.morgan'),
      A('A-5011', '02:11:40', { Account: 'd.hale', SourceIp: '203.0.113.77', Result: 'Interrupted', AuthMethod: 'Password + MFA push', Country: 'RO', Detail: 'Password correct; MFA push denied by user' }),
      A('A-5012', '02:12:05', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Result: 'Success', SessionId: 'S-5520', AuthMethod: 'Legacy IMAP (no MFA)', Country: 'RO', Detail: 'Legacy protocol sign-in; MFA not evaluated' }),
      A('A-5013', '06:48:10', { Account: 't.nguyen', SourceIp: '198.51.100.140', Result: 'Failure', AuthMethod: 'Password', Country: 'SG', Detail: 'Invalid password' }),
      A('A-5014', '06:48:52', { Account: 't.nguyen', SourceIp: '198.51.100.140', Result: 'Success', SessionId: 'S-5588', AuthMethod: 'Password + MFA', Country: 'SG', Detail: 'MFA satisfied' }),
      A('A-5015', '07:55:31', { Account: 'm.ortiz', SourceIp: '10.20.4.22', Result: 'Success', SessionId: 'S-5601', AuthMethod: 'Password + MFA', Country: 'Internal', Detail: 'MFA satisfied' }),
      A('A-5016', '08:02:14', { Account: 'a.morgan', SourceIp: '10.20.4.26', Result: 'Success', SessionId: 'S-5605', AuthMethod: 'Password + MFA', Country: 'Internal', Detail: 'MFA satisfied' }),
      D('D-6001', '02:16:20', { Account: 'm.ortiz', SourceIp: '203.0.113.77', EventType: 'AppPasswordCreated', Result: 'Success', SessionId: 'S-5520', InitiatedBy: 'm.ortiz', TargetGroup: '', Detail: 'App password "mail-sync" created' }),
      D('D-6002', '05:02:44', { Account: 'p.sato', SourceIp: '10.20.1.12', EventType: 'PasswordReset', Result: 'Success', SessionId: '—', InitiatedBy: 'it-admin', TargetGroup: '', Detail: 'Helpdesk password reset (CHG-311, user lockout)' }),
      P('P-7001', '02:14:02', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Host: 'mail-01', Application: 'MailApp', EventType: 'NewInboxRule', Result: 'Success', SessionId: 'S-5520', Records: 0, Detail: 'Rule "sync": forward all mail to ext-archive@proton-box.example; delete from inbox' }),
      P('P-7002', '02:19:40', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Host: 'docs-01', Application: 'DocsApp', EventType: 'FileDownloaded', Result: 'Success', SessionId: 'S-5520', Records: 1, Detail: 'Finance/Q3-payroll-summary.xlsx' }),
      P('P-7003', '02:22:15', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Host: 'docs-01', Application: 'DocsApp', EventType: 'FileDownloaded', Result: 'Success', SessionId: 'S-5520', Records: 1, Detail: 'Finance/vendor-bank-details.csv' }),
      P('P-7004', '02:26:51', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Host: 'docs-01', Application: 'DocsApp', EventType: 'FileDownloaded', Result: 'Success', SessionId: 'S-5520', Records: 1, Detail: 'Finance/2026-budget-draft.docx' }),
      P('P-7005', '02:33:08', { Account: 'm.ortiz', SourceIp: '203.0.113.77', Host: 'mail-01', Application: 'MailApp', EventType: 'MailItemsAccessed', Result: 'Success', SessionId: 'S-5520', Records: 212, Detail: '212 mailbox items read via IMAP' }),
      P('P-7006', '08:10:40', { Account: 'm.ortiz', SourceIp: '10.20.4.22', Host: 'mail-01', Application: 'MailApp', EventType: 'MailItemsAccessed', Result: 'Success', SessionId: 'S-5601', Records: 14, Detail: '14 mailbox items read in web client' }),
      P('P-7007', '09:10:05', { Account: 't.nguyen', SourceIp: '198.51.100.140', Host: 'docs-01', Application: 'DocsApp', EventType: 'FileDownloaded', Result: 'Success', SessionId: 'S-5588', Records: 1, Detail: 'Sales/APAC-customer-deck.pptx' }),
      S('S-8001', '02:20:00', { Account: 'idp-02', SourceIp: '10.20.1.11', Host: 'idp-02', EventType: 'CollectorGap', Result: 'Delayed', ChangeId: '', Detail: 'Ingestion delayed 16 minutes (02:20–02:36); backfill completed, completeness not verified' }),
      S('S-8002', '04:00:12', { Account: 'mail-gw', SourceIp: '10.20.1.30', Host: 'mail-gw', EventType: 'ServiceRestart', Result: 'Success', ChangeId: 'CHG-309', Detail: 'Mail gateway patch restart, approved maintenance' }),
    ],
    identities: [
      { Account: 'm.ortiz', DisplayName: 'Maria Ortiz', Type: 'User', Department: 'Finance', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.22', Notes: 'Has access to Finance document library' },
      { Account: 'd.hale', DisplayName: 'Dana Hale', Type: 'User', Department: 'Human Resources', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.40', Notes: '' },
      { Account: 'r.kaur', DisplayName: 'Ravi Kaur', Type: 'User', Department: 'IT', Owner: '—', Privileged: 'Yes', UsualSourceIp: '10.20.4.38', Notes: 'Web administrator' },
      { Account: 'p.sato', DisplayName: 'Pat Sato', Type: 'User', Department: 'Operations', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.33', Notes: '' },
      { Account: 'l.brooks', DisplayName: 'Lee Brooks', Type: 'User', Department: 'Legal', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.35', Notes: '' },
      { Account: 'a.morgan', DisplayName: 'Alice Morgan', Type: 'User', Department: 'Finance', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.26', Notes: '' },
      { Account: 't.nguyen', DisplayName: 'Tam Nguyen', Type: 'User', Department: 'Sales', Owner: '—', Privileged: 'No', UsualSourceIp: '10.20.4.29', Notes: 'Regional sales lead, APAC' },
    ],
    ips: [
      { SourceIp: '203.0.113.77', Type: 'External', Country: 'RO', Asn: 'AS64520 · FastVPS hosting', FirstSeen: `${d} 02:03`, Reputation: 'Reported for credential spraying (community feed, 2 days ago)' },
      { SourceIp: '198.51.100.140', Type: 'External', Country: 'SG', Asn: 'AS64530 · Marina Bay Hotels', FirstSeen: '2026-09-19 22:10', Reputation: 'Neutral: hospitality network' },
      { SourceIp: '10.20.4.22', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Workstations', FirstSeen: '—', Reputation: 'Internal' },
      { SourceIp: '10.20.4.26', Type: 'Internal', Country: 'Internal', Asn: 'Corporate LAN · Workstations', FirstSeen: '—', Reputation: 'Internal' },
    ],
    watchlists: {
      ChangeTickets: { title: 'Approved change tickets', rows: [
        { ChangeId: 'CHG-309', Summary: 'Mail gateway patch + restart', Account: 'mail-gw', Window: `${d} 03:30–04:30`, Status: 'Approved' },
        { ChangeId: 'CHG-311', Summary: 'Password reset after lockout', Account: 'p.sato', Window: `${d} 05:00–05:15`, Status: 'Approved' },
      ] },
      TravelNotices: { title: 'Employee travel notices', rows: [
        { Account: 't.nguyen', Destination: 'Singapore, SG', From: '2026-09-19', To: '2026-09-25', ExpectedIp: '198.51.100.140' },
      ] },
      LegacyAuthExceptions: { title: 'Legacy-protocol (no MFA) exceptions', rows: [
        { Account: 'm.ortiz', Protocol: 'IMAP', Reason: 'Scanner-to-mail integration', Approved: '2025-11-02', Expires: '2026-06-30' },
      ] },
    },
    alerts: [
      { id: 'ALT-5170', time: `${d}T02:10:12Z`, severity: 'Medium', title: 'Password spray: many accounts failed from one IP', entities: ['203.0.113.77'], rule: '5+ distinct accounts with failed sign-ins from one IP in 15 minutes', query: 'AuthLog\n| where Result == "Failure"\n| summarize Accounts = dcount(Account) by SourceIp' },
      { id: 'ALT-5171', time: `${d}T02:14:02Z`, severity: 'Medium', title: 'Suspicious inbox forwarding rule', entities: ['m.ortiz'], rule: 'Inbox rule forwarding to an external domain', query: 'AppAudit\n| where EventType == "NewInboxRule"' },
      { id: 'ALT-5172', time: `${d}T06:48:52Z`, severity: 'Low', title: 'Sign-in from new country', entities: ['t.nguyen', '198.51.100.140'], rule: 'Successful sign-in from a country not seen for this account in 30 days', query: 'AuthLog\n| where Account == "t.nguyen"' },
      { id: 'ALT-5173', time: `${d}T02:20:00Z`, severity: 'Informational', title: 'Collector ingestion delayed', entities: ['idp-02'], rule: 'Ingestion latency over 5 minutes', query: 'SystemLog\n| where EventType == "CollectorGap"' },
    ],
  });
}());

const M03E_DATA = { practice: M03E_PRACTICE, prove: M03E_PROVE };

const M03E_TABS = [['alerts', 'Alerts'], ['search', 'Log Search'], ['timeline', 'Timeline'], ['entities', 'Entities'], ['sources', 'Data Sources'], ['watchlists', 'Watchlists'], ['evidence', 'Evidence']];
const M03E_ITSM_TAB = ['itsm', 'ITSM Ticket'];
// The assessment console carries the standard ITSM ticket
// (docs/specs/MODULE_STANDARD.md §7.2) as its own tab, so the ticket is worked beside
// the logs instead of below the console.
const M03E_CASE_TAB = ['case', 'ITSM Ticket'];
const m03eTabs = (scope) => (scope === 'prove' ? [...M03E_TABS, M03E_CASE_TAB] : [M03E_ITSM_TAB, ...M03E_TABS]);

/* ------------------------------------------------------------ guided steps
 * Decreasing support: the first steps hand over a full query, the middle
 * ones a partial pattern, the last ones only the goal. Every check reads
 * what the learner produced, so any equivalent query passes. */

const m03eRidsIn = (result) => new Set((result?.rows || []).map((row) => row.__rid).filter(Boolean));
const m03eHasAll = (set, ids) => ids.every((id) => set.has(id));

const M03E_GUIDE_STEPS = [
  { id: 'itsm', tab: 'itsm', title: 'Everything becomes a ticket', body: 'In real SOC work, the ticket is the system of record. The console helps you investigate, but the ticket is where the work becomes visible to the team: status, severity, affected user, evidence, notes, escalation, and handoff.', task: 'Open the ITSM Ticket tab and read how the investigation maps into the incident ticket.', lookFor: 'Evidence goes in pins and notes. Decisions go in ticket fields. Anything the next analyst must do goes in the handoff.',
    check: (st) => st.tab === 'itsm' },
  { id: 'alert', tab: 'alerts', title: 'Start from the alert', body: 'The normalized event set from the previous card is already loaded. An alert is a lead, not a verdict. Read the rule and its entities before querying.', task: 'Open ALT-3101 in the alert queue and read its rule and entities.', lookFor: 'acct-428, source IP 198.51.100.18, session S-8841, and the four required actions.',
    check: (st) => st.seen.includes('alert:ALT-3101') },
  { id: 'auth', tab: 'search', title: 'Read the raw source first', body: 'Start with one source you understand. AuthLog records who signed in, from where, and whether it worked.', task: 'Run a query that returns every AuthLog record for acct-428.', hint: 'AuthLog\n| where Account == "acct-428"', lookFor: 'A failed sign-in followed by a success from 198.51.100.18; the source time was converted from UTC−04:00.',
    check: (st, r) => m03eHasAll(m03eRidsIn(r), ['A-1001', 'A-1003', 'A-1006']) },
  { id: 'sort', tab: 'search', title: 'Sort before you tell a story', body: 'Search results come back newest-first. Sequence only means something when it is read oldest-first.', task: 'Re-run your acct-428 query sorted oldest-first.', hint: 'AuthLog\n| where Account == "acct-428"\n| sort by TimeGenerated asc', lookFor: 'The 09:02 failure comes before the 09:04 success.',
    check: (st, r) => { const rows = (r?.rows || []).filter((row) => row.TimeGenerated); return rows.length >= 3 && m03eRidsIn(r).has('A-1006') && rows.every((row, i) => i === 0 || String(rows[i - 1].TimeGenerated) <= String(row.TimeGenerated)); } },
  { id: 'session', tab: 'search', title: 'Pivot across sources', body: 'UnifiedEvents holds the normalized records from the prior card. Prefer session_id, then corroborate with source IP or close timing.', task: 'Query UnifiedEvents on session S-8841, oldest-first.', hint: 'UnifiedEvents\n| where SessionId == "S-8841"\n| sort by TimeGenerated asc', lookFor: 'Four different actions on acct-428, linked by session S-8841 and IP 198.51.100.18.',
    check: (st, r) => { const rows = (r?.rows || []).filter((row) => row.SessionId === 'S-8841'); return new Set(rows.map((row) => row.EventSource)).size >= 3; } },
  { id: 'timeline', tab: 'timeline', title: 'See it as a timeline', body: 'A timeline puts every source on one clock. Gaps and bursts show up that a table hides.', task: 'Open the Timeline for acct-428 or for 198.51.100.18.', lookFor: 'The sequence lasts ten minutes from first failure to export.',
    check: (st) => st.seen.includes('timeline:acct-428') || st.seen.includes('timeline:198.51.100.18') },
  { id: 'baseline', tab: 'entities', title: 'Compare with the baseline', body: 'Whether something is suspicious depends on what is normal for that entity. Check the account owner, type and usual source.', task: 'Open acct-428 and 198.51.100.18 on the Entities tab.', lookFor: 'An unusual interactive/MFA sign-in from a first-seen external IP for a non-interactive service account.',
    check: (st) => st.seen.includes('entity:account:acct-428') && st.seen.includes('entity:ip:198.51.100.18') },
  { id: 'lookalikes', tab: 'watchlists', title: 'Rule out the lookalikes', body: 'Two other alerts look alarming. Authorized context such as change tickets and travel notices separates benign activity from the real finding.', task: 'Check both the ChangeTickets and TravelNotices watchlists, either on the tab or by querying them.', lookFor: 'Whether j.lee, svc-billing and the acct-428 role grant each have an approved explanation.',
    check: (st) => ['ChangeTickets', 'TravelNotices'].every((w) => st.seen.includes(`watchlist:${w}`)) },
  { id: 'health', tab: 'sources', title: 'Check your telemetry', body: 'A query can only find what was collected. Confirm the sources are healthy before claiming something did not happen.', task: 'On Data Sources, open AppAudit and SystemLog and read their health and field mapping.', lookFor: 'The billing-app collector delay, and whether any events were dropped.',
    check: (st) => st.seen.includes('source:AppAudit') && st.seen.includes('source:SystemLog') },
  { id: 'scope', tab: 'search', title: 'Bound the scope', body: 'Before handing off, test whether the source IP touched any other account. An aggregation answers that in one result.', task: 'Write your own query: which accounts did 198.51.100.18 act as, and how many events each?', hint: 'Use | summarize … by Account', lookFor: 'Whether anything besides acct-428 appears.',
    check: (st, r, q) => /198\.51\.100\.18/.test(q || '') && (r?.cols || []).includes('Account') && (r?.rows || []).length >= 1 && !(r?.rows || []).some((row) => row.__rid) && (r?.rows || []).every((row) => row.Account === 'acct-428') },
  { id: 'pin', tab: 'evidence', title: 'Preserve the evidence', body: 'A handoff cites records. Pin the linked records and the approved lookalike so the next analyst can verify both inclusion and exclusion.', task: 'Pin the failed and successful sign-ins, role grant, export, and approved restart.', lookFor: 'Four records support the chain; S-4001 remains a separately documented approved change.',
    check: (st) => m03eHasAll(new Set(st.pins), ['A-1003', 'A-1006', 'D-2001', 'P-3001', 'S-4001']) },
  { id: 'handoff', tab: 'evidence', title: 'Write the analyst handoff', body: 'State the correlated sequence, explain why the 09:10 svc-backup restart is excluded, and name one unresolved question or next check.', task: 'Write the handoff in Working notes below the console. Include acct-428, S-8841, CHG-221, and a scope limit or next step.', lookFor: 'A bounded, reproducible handoff rather than a verdict without evidence.',
    check: () => /acct-428/.test(moduleThreeState.practiceNotes || '') && /S-8841/.test(moduleThreeState.practiceNotes || '') && /CHG-221/.test(moduleThreeState.practiceNotes || '') && /svc-backup/.test(moduleThreeState.practiceNotes || '') && /(approved|separate|exclud)/i.test(moduleThreeState.practiceNotes || '') && (moduleThreeState.practiceNotes || '').trim().length >= 50 },
];

/* ------------------------------------------------------------ assessment rubric
 * Data-driven, per docs/LAB_ASSESSMENT_STANDARD.md. Each competency lists
 * items with points; support levels are explicit; unsupported conclusions
 * subtract only inside their own competency; exploration never subtracts. */

const M03E_ACCOUNTS_PROVE = ['m.ortiz', 'd.hale', 'r.kaur', 'p.sato', 'l.brooks', 'a.morgan', 't.nguyen'];
const M03E_ACCOUNT_STATUSES = [['', 'Not assessed'], ['not-affected', 'Not affected'], ['targeted', 'Targeted only (no valid credential)'], ['exposed', 'Credential exposed (access blocked)'], ['compromised', 'Compromised (attacker access)']];
const M03E_INDICATORS = [['203.0.113.77', 'IP 203.0.113.77'], ['ext-archive@proton-box.example', 'Forwarding address ext-archive@proton-box.example'], ['198.51.100.140', 'IP 198.51.100.140'], ['10.20.4.22', 'IP 10.20.4.22'], ['S-5520', 'Session S-5520'], ['S-5601', 'Session S-5601']];
const M03E_ACTIONS = [
  ['revoke-ortiz', 'Revoke m.ortiz sessions and reset the password'],
  ['remove-rule', 'Remove the forwarding inbox rule'],
  ['revoke-apppw', 'Revoke the "mail-sync" app password'],
  ['reset-hale', 'Reset d.hale’s password'],
  ['block-ip', 'Block 203.0.113.77 at the identity provider'],
  ['legacy-auth', 'Remove the expired legacy-IMAP exception'],
  ['notify-owner', 'Notify the Finance data owner / privacy team about the files and mail accessed'],
  ['reset-nguyen', 'Reset t.nguyen’s password and revoke the travel session'],
  ['disable-all', 'Disable every account that received a failed sign-in'],
  ['purge-logs', 'Delete the attacker’s log records to contain the incident'],
  ['wipe-laptop', 'Wipe m.ortiz’s laptop'],
];

// ------------------------------------------------------------ ITSM ticket
// docs/specs/MODULE_STANDARD.md §7.2 / CASE_RECORD_MIGRATION.md: the Assessment Lab's
// determination form becomes the standard ticket. The 7-account scope
// assessment keeps its own selects as `spec.findings` (one per account); the
// indicator/action checkbox groups and the 4-part handoff stay as
// `spec.findingsHtml`, unchanged in shape, so moduleThreeScoreAssessment()'s
// rubric (M03E_RUBRIC) keeps reading the exact same `determination` shape it
// always has. Affected User / Affected Device are new, informational-only
// picks (not part of the 100-point rubric) that give this module the same
// roster-pick pattern as every other migrated module.
const M03E_IDENTITY_LABEL = Object.fromEntries(M03E_PROVE.identities.map((i) => [i.Account, `${i.Account} (${i.DisplayName}, ${i.Department})`]));
const M03E_USER_OPTIONS = M03E_ACCOUNTS_PROVE.map((a) => ({ id: a, text: M03E_IDENTITY_LABEL[a] || a, tier: a === 'm.ortiz' ? 'principal' : a === 'd.hale' ? 'pivot' : 'noise' }));
const M03E_DEVICE_OPTIONS = [
  { id: 'mail-01', text: 'mail-01 — mail server (forwarding rule + mailbox access)', tier: 'principal' },
  { id: 'docs-01', text: 'docs-01 — document server (file downloads in the attacker session)', tier: 'pivot' },
  { id: 'idp-02', text: 'idp-02 — identity provider node', tier: 'noise' },
  { id: 'dc-01', text: 'dc-01 — domain controller', tier: 'noise' },
  { id: 'mail-gw', text: 'mail-gw — mail gateway (approved maintenance restart)', tier: 'noise' },
];
const M03E_DEPARTMENT_OPTIONS = [
  { id: 'identity-response', text: 'Identity Response', fit: 100 },
  { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 50, note: 'Accepted, but the account/session remediation belongs to Identity Response.', bounce: 'Tier 2 SOC bounced this — it needs identity remediation, not triage.' },
];
const M03E_DISPOSITION_OPTIONS = [
  { id: 'true-positive', text: 'True positive' },
  { id: 'benign-positive', text: 'Benign positive' },
  { id: 'false-positive', text: 'False positive' },
];
const M03E_ACCOUNT_STATUS_OPTIONS = M03E_ACCOUNT_STATUSES.filter(([id]) => id).map(([id, text]) => ({ id, text }));
const M03E_ACCOUNT_FINDINGS = M03E_ACCOUNTS_PROVE.map((a) => ({ name: `account-${a}`, label: M03E_IDENTITY_LABEL[a] || a, options: M03E_ACCOUNT_STATUS_OPTIONS, missing: `Assess ${a}` }));

const M03E_RUBRIC = {
  passing: 70,
  critical: [
    { id: 'primary-account', label: 'Identify m.ortiz as compromised', test: (s) => s.accountStatus['m.ortiz'] === 'compromised' },
    { id: 'verdict', label: 'Reach a true-positive verdict', test: (s) => s.verdict === 'true-positive' },
  ],
  competencies: [
    { id: 'investigation', label: 'Investigation & query technique', max: 10, items: [
      { pts: 3, label: 'Queried authentication telemetry', test: (s, x) => x.sourcesQueried.has('AuthLog') },
      { pts: 3, label: 'Queried application activity', test: (s, x) => x.sourcesQueried.has('AppAudit') },
      { pts: 4, label: 'Pivoted across sources on the attacker IP or session', test: (s, x) => x.crossSourcePivot },
    ] },
    { id: 'evidence', label: 'Evidence correlation', max: 20, items: [
      { pts: 4, level: 'PRIMARY', label: 'Pinned the spray failures from 203.0.113.77', test: (s, x) => x.pinCount(['A-5001', 'A-5002', 'A-5003', 'A-5004', 'A-5005', 'A-5006', 'A-5007', 'A-5008', 'A-5009', 'A-5010']) >= 2 },
      { pts: 4, level: 'PRIMARY', label: 'Pinned m.ortiz’s legacy-protocol success from the attacker IP', test: (s, x) => x.pinned('A-5012') },
      { pts: 4, level: 'PRIMARY', label: 'Pinned the forwarding inbox rule', test: (s, x) => x.pinned('P-7001') },
      { pts: 4, level: 'PRIMARY', label: 'Pinned data access in the attacker session', test: (s, x) => x.pinCount(['P-7002', 'P-7003', 'P-7004', 'P-7005']) >= 1 },
      { pts: 2, level: 'SECONDARY', label: 'Pinned d.hale’s correct-password / MFA-denied sign-in', test: (s, x) => x.pinned('A-5011') },
      { pts: 2, level: 'SECONDARY', label: 'Pinned the app password created for persistence', test: (s, x) => x.pinned('D-6001') },
    ] },
    { id: 'scope', label: 'Scope determination', max: 25, items: [
      { pts: 12, level: 'PRIMARY', label: 'm.ortiz marked compromised', test: (s) => s.accountStatus['m.ortiz'] === 'compromised' },
      { pts: 6, level: 'SECONDARY', label: 'd.hale marked credential-exposed', test: (s) => s.accountStatus['d.hale'] === 'exposed' },
      { pts: 3, level: 'SECONDARY', variant: true, label: 'd.hale flagged, but over-stated as compromised', test: (s) => s.accountStatus['d.hale'] === 'compromised' },
      { pts: 3, level: 'SUPPORTING', label: 'Other sprayed accounts marked targeted-only', test: (s) => ['r.kaur', 'p.sato', 'l.brooks', 'a.morgan'].filter((a) => s.accountStatus[a] === 'targeted').length >= 3 },
      { pts: 2, level: 'PRIMARY', label: 'Attacker IP listed as an indicator', test: (s) => s.indicators.includes('203.0.113.77') },
      { pts: 2, level: 'PRIMARY', label: 'Forwarding address listed as an indicator', test: (s) => s.indicators.includes('ext-archive@proton-box.example') },
      { pts: -5, level: 'CONTRADICTORY', label: 'Unsupported: t.nguyen marked exposed/compromised (travel notice explains it)', test: (s) => ['exposed', 'compromised'].includes(s.accountStatus['t.nguyen']) },
      { pts: -2, level: 'CONTRADICTORY', label: 'Unsupported: benign or internal IP listed as an indicator', test: (s) => s.indicators.includes('198.51.100.140') || s.indicators.includes('10.20.4.22') },
      { pts: -2, level: 'CONTRADICTORY', label: 'Unsupported: m.ortiz’s legitimate office session S-5601 listed as an indicator', test: (s) => s.indicators.includes('S-5601') },
    ] },
    { id: 'verdict', label: 'Verdict & severity', max: 15, items: [
      { pts: 11, label: 'True positive', test: (s) => s.verdict === 'true-positive' },
      { pts: 4, label: 'Severity high or critical', test: (s) => ['high', 'critical'].includes(s.severity) },
      { pts: 2, variant: true, label: 'Severity medium (under-rated)', test: (s) => s.severity === 'medium' },
    ] },
    { id: 'response', label: 'Response & escalation', max: 15, items: [
      ...['revoke-ortiz', 'remove-rule', 'revoke-apppw', 'reset-hale', 'block-ip', 'legacy-auth', 'notify-owner'].map((id) => ({ pts: 2, label: M03E_ACTIONS.find((a) => a[0] === id)[1], test: (s) => s.actions.includes(id) })),
      { pts: 3, label: 'Escalation marked required', test: (s) => s.escalation === 'required' },
      { pts: -3, level: 'CONTRADICTORY', label: 'Unsupported: action against t.nguyen', test: (s) => s.actions.includes('reset-nguyen') },
      { pts: -5, unsafe: true, label: 'Unsafe: disabling every targeted account', test: (s) => s.actions.includes('disable-all') },
      { pts: -5, unsafe: true, label: 'Unsafe: deleting log evidence', test: (s) => s.actions.includes('purge-logs') },
      { pts: -3, unsafe: true, label: 'Unsupported: wiping a laptop with no host evidence', test: (s) => s.actions.includes('wipe-laptop') },
    ] },
    { id: 'documentation', label: 'Documentation & handoff', max: 15, items: [
      // Communication credit: a complete, structured handoff.
      ...[['observations', 'Observations'], ['analysis', 'Analysis'], ['scope', 'Scope'], ['nextAction', 'Requested next action']].map(([key, label]) => ({ pts: 2, label: `${label} written (40+ characters)`, test: (s) => (s.handoff[key] || '').trim().length >= 40 })),
      // Technical substance: writing that cites the evidence. Polished text
      // without these earns communication credit only.
      { pts: 2, label: 'Handoff names m.ortiz', test: (s, x) => /m\.ortiz/i.test(x.text) },
      { pts: 1, label: 'Handoff names the attacker IP', test: (s, x) => /203\.0\.113\.77/.test(x.text) },
      { pts: 2, label: 'Handoff explains the forwarding / inbox rule', test: (s, x) => /forward|inbox rule/i.test(x.text) },
      { pts: 2, label: 'Handoff states an uncertainty (e.g. the collector gap)', test: (s, x) => /gap|delay|backfill|unconfirmed|unknown|not (yet )?(confirmed|verified)|uncertain/i.test(x.text) },
    ] },
  ],
};

function m03eNormalizeDetermination(det) {
  const d = det && typeof det === 'object' ? det : {};
  const h = d.handoff && typeof d.handoff === 'object' ? d.handoff : {};
  return {
    status: String(d.status || ''),
    affectedUser: String(d.affectedUser || ''),
    affectedDevice: String(d.affectedDevice || ''),
    verdict: String(d.verdict || ''),
    severity: String(d.severity || ''),
    accountStatus: d.accountStatus && typeof d.accountStatus === 'object' ? { ...d.accountStatus } : {},
    indicators: Array.isArray(d.indicators) ? d.indicators.slice() : [],
    actions: Array.isArray(d.actions) ? d.actions.slice() : [],
    escalation: String(d.escalation || ''),
    escalateTo: String(d.escalateTo || ''),
    handoff: { observations: String(h.observations || ''), analysis: String(h.analysis || ''), scope: String(h.scope || ''), nextAction: String(h.nextAction || '') },
    notes: String(d.notes || ''),
    submitted: d.submitted === true,
    actionHistory: Array.isArray(d.actionHistory) ? d.actionHistory.slice() : [],
  };
}

// caseRecordFields()/caseRecordApply() read/write the standard ticket's
// disposition through `state.disposition`/`state.verdict` (case-record.js
// writes both spellings) and severity through `state.severity`/`state.priority`
// — both already line up with this module's existing `verdict`/`severity`
// fields, so no separate case-record object is needed. The 7 account selects
// are exposed to caseRecordFields as `spec.findings` (name `account-<id>`,
// written into `state.findings` by caseRecordApply); this derives that view
// from `accountStatus` — the scorer's source of truth — on every render, and
// a matching mirror in m03eHandleFormInput writes accountStatus back.
function m03eSyncFindingsView(d) {
  d.findings = Object.fromEntries(M03E_ACCOUNTS_PROVE.map((a) => [`account-${a}`, d.accountStatus[a] || '']));
  return d;
}

/* Pure scorer — no DOM, no state. `work` = { determination, pins, queryLog }
 * where queryLog entries carry { query, sources, pivot }. Exported for tests. */
function moduleThreeScoreAssessment(work) {
  const s = m03eNormalizeDetermination(work?.determination);
  const pins = new Set(Array.isArray(work?.pins) ? work.pins : []);
  const log = Array.isArray(work?.queryLog) ? work.queryLog : [];
  const x = {
    pinned: (id) => pins.has(id),
    pinCount: (ids) => ids.filter((id) => pins.has(id)).length,
    sourcesQueried: new Set(log.flatMap((q) => q.sources || [])),
    crossSourcePivot: log.some((q) => q.pivot === true),
    text: [s.handoff.observations, s.handoff.analysis, s.handoff.scope, s.handoff.nextAction, s.notes].join('\n'),
  };
  const competencies = M03E_RUBRIC.competencies.map((comp) => {
    const hits = comp.items.filter((item) => item.test(s, x));
    const raw = hits.reduce((n, item) => n + item.pts, 0);
    const earned = Math.max(0, Math.min(comp.max, raw));
    // A partial-credit variant (d.hale over-stated, severity under-rated) is
    // an alternative to its full-credit item, never a separate requirement.
    const positive = comp.items.filter((item) => item.pts > 0 && !item.variant);
    const missed = positive.filter((item) => !hits.includes(item));
    return {
      id: comp.id, label: comp.label, earned, max: comp.max,
      percentage: Math.round((earned / comp.max) * 100),
      passed: earned / comp.max >= 0.7,
      completed: hits.filter((item) => item.pts > 0 && !item.variant).length,
      required: positive.length,
      evidence: hits.filter((item) => item.pts > 0).map((item) => `${item.level ? `[${item.level}] ` : ''}${item.label} (+${item.pts})`),
      deductions: hits.filter((item) => item.pts < 0).map((item) => `${item.label} (${item.pts})`),
      unsafe: hits.filter((item) => item.unsafe).map((item) => item.label),
      misses: missed.map((item) => item.label),
    };
  });
  const total = competencies.reduce((n, c) => n + c.earned, 0);
  const criticalMisses = M03E_RUBRIC.critical.filter((c) => !c.test(s)).map((c) => c.label);
  // A critical miss caps the automated recommendation below passing; the
  // instructor can still override on review.
  const score = criticalMisses.length ? Math.min(total, M03E_RUBRIC.passing - 1) : total;
  return { score, total, passing: M03E_RUBRIC.passing, passed: score >= M03E_RUBRIC.passing, competencies, criticalMisses };
}

/* ------------------------------------------------------------ state */

const M03E_SCOPE_DEFAULT = { tab: 'alerts', query: '', lastQuery: '', selected: null, pins: [], seen: [], queryLog: [], timelineEntity: '', entityKind: 'account' };
const M03E_PRACTICE_DEFAULT = { ...M03E_SCOPE_DEFAULT, guideStep: 0, guideCollapsed: false };
const M03E_PROVE_DEFAULT = { ...M03E_SCOPE_DEFAULT, determination: m03eNormalizeDetermination({}), startedAt: '', submittedAt: '', attempts: 0, submitMessage: '' };

// Normalize each scope object once and hand back that same object afterwards;
// callers hold references across renders, so a fresh copy per call would
// silently drop their writes.
const m03eNormalized = new WeakSet();
function m03eState(scope) {
  const root = moduleThreeState;
  if (!root.console || typeof root.console !== 'object') root.console = {};
  if (m03eNormalized.has(root.console[scope])) return root.console[scope];
  const defaults = scope === 'practice' ? M03E_PRACTICE_DEFAULT : M03E_PROVE_DEFAULT;
  const saved = root.console[scope] && typeof root.console[scope] === 'object' ? root.console[scope] : {};
  const st = { ...JSON.parse(JSON.stringify(defaults)), ...saved };
  ['pins', 'seen', 'queryLog'].forEach((k) => { if (!Array.isArray(st[k])) st[k] = []; });
  if (scope === 'prove') st.determination = m03eNormalizeDetermination(st.determination);
  root.console[scope] = st;
  m03eNormalized.add(st);
  return st;
}

function m03eSeen(st, tag) { if (!st.seen.includes(tag)) st.seen.push(tag); }

const m03eResultCache = {};
function m03eResult(scope) {
  const st = m03eState(scope);
  if (!st.lastQuery) return null;
  const cached = m03eResultCache[scope];
  if (cached && cached.query === st.lastQuery) return cached.result;
  const data = M03E_DATA[scope];
  const result = MnKql.evaluate(st.lastQuery, data.tables, { now: data.now });
  m03eResultCache[scope] = { query: st.lastQuery, result };
  return result;
}

/* ------------------------------------------------------------ rendering helpers */

const m03eTime = (iso) => String(iso || '').slice(11, 19) || String(iso || '');
const m03eField = (label, value) => `<div class="m03e-field"><dt>${esc(label)}</dt><dd>${esc(value == null || value === '' ? '—' : value)}</dd></div>`;
const m03eChip = (source) => `<span class="m03e-src m03e-src-${M03E_SOURCE_COLORS[source] || 'other'}">${esc(source)}</span>`;
const m03eSev = (sev) => `<span class="m03e-sev m03e-sev-${esc(String(sev).toLowerCase())}">${esc(sev)}</span>`;

function m03ePinButton(scope, rid) {
  const pinned = m03eState(scope).pins.includes(rid);
  return `<button type="button" class="m03e-pin${pinned ? ' is-pinned' : ''}" data-m03e-pin="${scope}:${esc(rid)}" aria-pressed="${pinned}" title="${pinned ? 'Remove from evidence' : 'Pin as evidence'}"><i class="${pinned ? 'ri-pushpin-fill' : 'ri-pushpin-line'}" aria-hidden="true"></i><span class="m03e-sr-only">${pinned ? 'Unpin' : 'Pin'} ${esc(rid)}</span></button>`;
}

function m03eIsSelected(st, type, id) { return st.selected && st.selected.type === type && st.selected.id === id; }

function m03eEntityNames(data) {
  const accounts = [...new Set(data.tables.UnifiedEvents.map((r) => r.Account).filter(Boolean))].sort();
  const ips = [...new Set(data.tables.UnifiedEvents.map((r) => r.SourceIp).filter(Boolean))].sort();
  const hosts = [...new Set(data.tables.UnifiedEvents.map((r) => r.Host).filter(Boolean))].sort();
  return { accounts, ips, hosts };
}

/* ------------------------------------------------------------ views */

function m03eAlertsView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  return `<section><div class="m03e-table-wrap"><table class="m03e-table"><caption>ALERT QUEUE · ${esc(data.caseId)} · ${esc(data.day)}</caption><thead><tr><th>TIME (UTC)</th><th>SEVERITY</th><th>ALERT</th><th>ENTITIES</th><th>ID</th></tr></thead><tbody>${data.alerts.slice().sort((a, b) => b.time.localeCompare(a.time)).map((a) => `<tr class="${m03eIsSelected(st, 'alert', a.id) ? 'is-selected' : ''}" data-m03e-select="${scope}:alert:${esc(a.id)}" tabindex="0"><td>${esc(m03eTime(a.time))}</td><td>${m03eSev(a.severity)}</td><td><strong>${esc(a.title)}</strong></td><td>${esc(a.entities.join(', '))}</td><td class="m03e-mono">${esc(a.id)}</td></tr>`).join('')}</tbody></table></div><p class="m03e-muted m03e-note">Alerts are generated by scheduled detection queries over the normalized tables. Select one to see the rule and open it in Log Search.</p></section>`;
}

function m03eSchemaPanel(scope) {
  const data = M03E_DATA[scope];
  const cols = MnKql.tableColumns(data.tables);
  const groups = [['Normalized events', ['UnifiedEvents']], ['Source tables', ['AuthLog', 'DirectoryAudit', 'AppAudit', 'SystemLog']], ['Context', ['IdentityInfo', 'IpIntel', ...Object.keys(data.watchlists)]]];
  return `<aside class="m03e-schema" aria-label="Tables"><p class="m03e-label">SCHEMA</p>${groups.map(([title, names]) => `<div class="m03e-schema-group"><em>${esc(title)}</em>${names.map((name) => `<details><summary><button type="button" data-m03e-table="${scope}:${esc(name)}" title="Insert ${esc(name)} | take 20">${esc(name)}</button><span>${data.tables[name].length}</span></summary><ul>${cols[name].map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>`).join('')}</div>`).join('')}</aside>`;
}

function m03eResultsHtml(scope) {
  const st = m03eState(scope);
  const r = m03eResult(scope);
  if (!r) return '<div class="m03e-results-empty">Run a query to see results. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs from the editor.</div>';
  if (r.error) return `<div class="m03e-query-error" role="alert"><i class="ri-error-warning-line" aria-hidden="true"></i> ${esc(r.error)}</div>`;
  const rows = r.rows || [], cols = r.cols || [];
  const pinnable = rows.some((row) => row.__rid);
  const shown = rows.slice(0, 200);
  const cell = (v) => esc(v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v);
  return `<div class="m03e-results-bar"><strong>${rows.length} row${rows.length === 1 ? '' : 's'}</strong><span>${esc(cols.join(' · '))}</span>${pinnable ? '' : rows.length ? '<span class="m03e-muted">Aggregated rows cannot be pinned — pin from a row-level query.</span>' : ''}</div>
    ${rows.length ? `<div class="m03e-table-wrap m03e-results-grid"><table class="m03e-table m03e-grid"><thead><tr>${pinnable ? '<th aria-label="Pin"></th>' : ''}${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${shown.map((row) => `<tr class="${row.__rid && m03eIsSelected(st, 'record', row.__rid) ? 'is-selected' : ''}" ${row.__rid ? `data-m03e-select="${scope}:record:${esc(row.__rid)}" tabindex="0"` : ''}>${pinnable ? `<td>${row.__rid ? m03ePinButton(scope, row.__rid) : ''}</td>` : ''}${cols.map((c) => `<td>${c === 'EventSource' ? m03eChip(row[c]) : c === 'TimeGenerated' ? esc(String(row[c]).replace('T', ' ').replace('Z', '')) : cell(row[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > 200 ? '<p class="m03e-muted">Showing the first 200 rows.</p>' : ''}` : '<div class="m03e-results-empty">No rows matched. Check the time window, field names and exact values before widening the search.</div>'}`;
}

function m03eSearchView(scope) {
  const st = m03eState(scope);
  const examples = scope === 'practice' ? `<div class="m03e-examples"><span class="m03e-label">EXAMPLES</span>${[
    ['Recent sign-ins', 'AuthLog\n| take 20'],
    ['Failures by IP', 'AuthLog\n| where Result == "Failure"\n| summarize Failures = count() by SourceIp'],
    ['Events per source', 'UnifiedEvents\n| summarize Events = count() by EventSource'],
  ].map(([label, q]) => `<button type="button" data-m03e-example="${scope}" data-query="${esc(q)}">${esc(label)}</button>`).join('')}</div>` : '';
  return `<section class="m03e-search"><div class="m03e-search-layout">${m03eSchemaPanel(scope)}<div class="m03e-search-main"><div class="m03e-editor-host"><textarea class="kql" id="m03e-kql-${scope}" rows="6" aria-label="KQL query">${esc(st.query)}</textarea></div><div class="m03e-search-actions"><button type="button" class="m03e-primary" data-m03e-run="${scope}"><i class="ri-play-fill" aria-hidden="true"></i> Run query</button><button type="button" class="m03e-secondary" data-m03e-clear="${scope}">Clear</button><span class="m03e-muted">Lab clock: ${esc(M03E_DATA[scope].now.replace('T', ' ').slice(0, 16))} UTC · ago() is relative to it</span></div>${examples}<div class="m03e-results" id="m03e-results-${scope}">${m03eResultsHtml(scope)}</div></div></div></section>`;
}

function m03eTimelineView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  const { accounts, ips } = m03eEntityNames(data);
  const target = st.timelineEntity;
  const rows = target ? data.tables.UnifiedEvents.filter((r) => r.Account === target || r.SourceIp === target || r.SessionId === target).slice().sort((a, b) => a.TimeGenerated.localeCompare(b.TimeGenerated)) : [];
  // Collector gaps are infrastructure context, not entity events: show any
  // gap that overlaps the timeline's window so the learner sees it.
  const gaps = rows.length ? data.tables.SystemLog.filter((g) => /Gap|Heartbeat/.test(g.EventType) && g.Result !== 'Healthy' && g.TimeGenerated >= rows[0].TimeGenerated && g.TimeGenerated <= rows[rows.length - 1].TimeGenerated && !rows.includes(g)) : [];
  const items = [...rows.map((r) => ({ kind: 'event', row: r })), ...gaps.map((g) => ({ kind: 'gap', row: g }))].sort((a, b) => a.row.TimeGenerated.localeCompare(b.row.TimeGenerated));
  const opt = (v) => `<option value="${esc(v)}" ${v === target ? 'selected' : ''}>${esc(v)}</option>`;
  return `<section class="m03e-timeline"><div class="m03e-timeline-head"><label>Entity <select data-m03e-timeline="${scope}"><option value="">Choose an account or IP…</option><optgroup label="Accounts">${accounts.map(opt).join('')}</optgroup><optgroup label="IP addresses">${ips.map(opt).join('')}</optgroup></select></label><span class="m03e-legend">${Object.keys(M03E_SOURCE_COLORS).map(m03eChip).join('')}</span></div>
    ${!target ? '<div class="m03e-results-empty">Choose an entity to lay every source on one clock.</div>' : `<ol class="m03e-tl">${items.map(({ kind, row }) => kind === 'gap'
      ? `<li class="m03e-tl-gap"><span class="m03e-tl-time">${esc(m03eTime(row.TimeGenerated))}</span><div><strong><i class="ri-alert-line" aria-hidden="true"></i> Telemetry: ${esc(row.Host)} ${esc(row.EventType)}</strong><p>${esc(row.Detail)}</p></div></li>`
      : `<li class="m03e-tl-item m03e-tl-${M03E_SOURCE_COLORS[row.EventSource]}${m03eIsSelected(st, 'record', row.__rid) ? ' is-selected' : ''}" data-m03e-select="${scope}:record:${esc(row.__rid)}" tabindex="0"><span class="m03e-tl-time">${esc(m03eTime(row.TimeGenerated))}</span><div>${m03eChip(row.EventSource)} <strong>${esc(row.EventType)}</strong> · ${esc(row.Account)} · <span class="m03e-mono">${esc(row.SourceIp)}</span> · <span class="m03e-${row.Result === 'Success' ? 'ok' : row.Result === 'Failure' || row.Result === 'Interrupted' ? 'bad' : 'warn'}">${esc(row.Result)}</span><p>${esc(row.Detail)}${row.SessionId && row.SessionId !== '—' ? ` · session <span class="m03e-mono">${esc(row.SessionId)}</span>` : ''}</p></div>${m03ePinButton(scope, row.__rid)}</li>`).join('')}</ol>`}</section>`;
}

function m03eEntitiesView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  const kind = st.entityKind || 'account';
  const { hosts } = m03eEntityNames(data);
  const list = kind === 'account' ? data.tables.IdentityInfo.map((i) => [i.Account, `${i.DisplayName} · ${i.Type} · ${i.Department}`])
    : kind === 'ip' ? data.tables.IpIntel.map((i) => [i.SourceIp, `${i.Type} · ${i.Country} · ${i.Asn}`])
    : hosts.map((h) => [h, `${data.tables.UnifiedEvents.filter((r) => r.Host === h).length} events`]);
  return `<section class="m03e-listing"><div class="m03e-subtabs">${[['account', 'Accounts'], ['ip', 'IP addresses'], ['host', 'Hosts']].map(([k, label]) => `<button type="button" class="${kind === k ? 'is-active' : ''}" data-m03e-entitykind="${scope}:${k}">${label}</button>`).join('')}</div>${list.map(([id, sub]) => `<button type="button" class="${m03eIsSelected(st, kind, id) ? 'is-selected' : ''}" data-m03e-select="${scope}:${kind}:${esc(id)}"><strong>${esc(id)}</strong><span>${esc(sub)}</span><i class="ri-arrow-right-line" aria-hidden="true"></i></button>`).join('')}</section>`;
}

function m03eSourcesView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  const health = (name) => {
    const gaps = data.tables.SystemLog.filter((r) => /Gap|Heartbeat/.test(r.EventType) && r.Result !== 'Healthy' && (name === 'SystemLog' || (name === 'AuthLog' && /^idp/.test(r.Host)) || (name === 'AppAudit' && /app|mail|docs/.test(r.Host))));
    return gaps.length ? `<span class="m03e-warn">Degraded · ${gaps.length} collector event${gaps.length === 1 ? '' : 's'}</span>` : '<span class="m03e-ok">Healthy</span>';
  };
  return `<section><div class="m03e-table-wrap"><table class="m03e-table"><caption>CONNECTED DATA SOURCES</caption><thead><tr><th>TABLE</th><th>NATIVE FORMAT</th><th>EVENTS</th><th>FIRST</th><th>LAST</th><th>HEALTH</th></tr></thead><tbody>${Object.keys(M03E_SOURCE_MAPPINGS).map((name) => { const rows = data.tables[name]; const times = rows.map((r) => r.TimeGenerated).sort(); return `<tr class="${m03eIsSelected(st, 'source', name) ? 'is-selected' : ''}" data-m03e-select="${scope}:source:${name}" tabindex="0"><td>${m03eChip(name)}</td><td>${esc(M03E_SOURCE_MAPPINGS[name].native)}</td><td>${rows.length}</td><td>${esc(m03eTime(times[0]))}</td><td>${esc(m03eTime(times[times.length - 1]))}</td><td>${health(name)}</td></tr>`; }).join('')}</tbody></table></div><p class="m03e-muted m03e-note">Each source arrives in its own format. The SIEM parser maps native fields to shared names (Account, SourceIp, TimeGenerated…) in <strong>UnifiedEvents</strong>, while keeping <strong>EventSource</strong> and the original detail so every match can be verified against its source. Select a source to see its field mapping.</p></section>`;
}

function m03eWatchlistsView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  return `<section class="m03e-listing"><h2>WATCHLISTS</h2>${Object.entries(data.watchlists).map(([name, w]) => `<button type="button" class="${m03eIsSelected(st, 'watchlist', name) ? 'is-selected' : ''}" data-m03e-select="${scope}:watchlist:${esc(name)}"><strong>${esc(name)}</strong><span>${esc(w.title)} · ${w.rows.length} entr${w.rows.length === 1 ? 'y' : 'ies'} · queryable as a table</span><i class="ri-arrow-right-line" aria-hidden="true"></i></button>`).join('')}</section>`;
}

function m03eEvidenceView(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  const pins = st.pins.map((id) => data.records[id]).filter(Boolean).sort((a, b) => a.TimeGenerated.localeCompare(b.TimeGenerated));
  return `<section><div class="m03e-table-wrap"><table class="m03e-table"><caption>PINNED EVIDENCE · ${pins.length}</caption>${pins.length ? `<thead><tr><th></th><th>TIME</th><th>SOURCE</th><th>EVENT</th><th>ACCOUNT</th><th>SOURCE IP</th><th>SESSION</th><th>DETAIL</th></tr></thead><tbody>${pins.map((r) => `<tr data-m03e-select="${scope}:record:${esc(r.__rid)}" tabindex="0" class="${m03eIsSelected(st, 'record', r.__rid) ? 'is-selected' : ''}"><td>${m03ePinButton(scope, r.__rid)}</td><td>${esc(m03eTime(r.TimeGenerated))}</td><td>${m03eChip(r.EventSource)}</td><td>${esc(r.EventType)}</td><td>${esc(r.Account)}</td><td class="m03e-mono">${esc(r.SourceIp)}</td><td class="m03e-mono">${esc(r.SessionId)}</td><td>${esc(r.Detail)}</td></tr>`).join('')}</tbody>` : ''}</table></div>${pins.length ? '' : '<div class="m03e-results-empty">Nothing pinned yet. Use the pin button on a Log Search result or a Timeline entry.</div>'}<p class="m03e-muted m03e-note">${scope === 'prove' ? 'Pinned records are submitted with your assessment as your selected evidence.' : 'Pinned records are your case evidence — the rows a teammate needs to reproduce your finding.'}</p></section>`;
}

function m03eItsmGuideView() {
  return `<section class="m03e-itsm-guide" aria-labelledby="m03e-itsm-title">
    <p class="m03e-label">ITSM TICKET WORKFLOW</p>
    <h2 id="m03e-itsm-title">The ticket is the official record of the incident.</h2>
    <p>ITSM means <strong>IT Service Management</strong>. In a SOC, the ITSM incident ticket tracks the work: what happened, who or what is affected, how serious it is, what evidence supports it, and who needs to act next.</p>
    <div class="m03e-itsm-map">
      <div><strong>1. Investigate</strong><span>Use alerts, searches, timelines, entities, sources, and watchlists to find facts.</span></div>
      <div><strong>2. Preserve evidence</strong><span>Pin the exact records another analyst would need to verify your conclusion.</span></div>
      <div><strong>3. Complete fields</strong><span>Set status, severity, affected user/device, disposition, escalation, and scope.</span></div>
      <div><strong>4. Handoff</strong><span>Write clear notes: observations, analysis, confirmed scope, unknowns, and requested next action.</span></div>
    </div>
    <p class="m03e-itsm-rule">Simple rule: if it matters to the incident, it belongs in the ticket. The console is how you find the answer; the ticket is how the team trusts, routes, reviews, and continues the work.</p>
  </section>`;
}

function m03eNativeRecord(row) {
  const map = M03E_SOURCE_MAPPINGS[row.EventSource];
  if (!map) return '';
  const obj = {};
  map.fields.forEach(([native, norm]) => { if (row[norm] !== undefined && row[norm] !== '') obj[native] = row[norm]; });
  if (row.EventSource === 'SystemLog') return `${obj['@timestamp']} ${obj.hostname} ${obj.msg_type}[${obj.job || '-'}]: ${obj.message}${obj.change_ref ? ` change=${obj.change_ref}` : ''}`;
  if (row.EventSource === 'DirectoryAudit') return Object.entries(obj).map(([k, v]) => `${k}=${/\s/.test(String(v)) ? `"${v}"` : v}`).join(' ');
  return JSON.stringify(obj, null, 1);
}

function m03eDrawer(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  const sel = st.selected;
  const hunt = (label, query) => `<button type="button" data-m03e-hunt="${scope}" data-query="${esc(query)}"><i class="ri-search-line" aria-hidden="true"></i> ${esc(label)}</button>`;
  const timelineBtn = (entity) => `<button type="button" data-m03e-show-timeline="${scope}:${esc(entity)}"><i class="ri-time-line" aria-hidden="true"></i> Show timeline</button>`;
  let title = 'DETAILS', content = '<p>Select an alert, record, entity, source or watchlist to see its details here.</p>';
  if (sel?.type === 'alert') {
    const a = data.alerts.find((x) => x.id === sel.id);
    if (a) { title = 'ALERT'; content = `<h3>${esc(a.title)}</h3><dl class="m03e-fields">${m03eField('Alert ID', a.id)}${m03eField('Severity', a.severity)}${m03eField('Fired', a.time.replace('T', ' ').replace('Z', ' UTC'))}${m03eField('Entities', a.entities.join(', '))}</dl><h4>Detection rule</h4><p>${esc(a.rule)}</p><pre class="m03e-code">${esc(a.query)}</pre>${hunt('Open rule query in Log Search', a.query)}${a.entities.map((e) => timelineBtn(e)).join('')}`; }
  }
  if (sel?.type === 'record') {
    const r = data.records[sel.id];
    if (r) {
      const extra = Object.keys(r).filter((k) => !M03E_UNIFIED_FIELDS.includes(k) && !k.startsWith('__'));
      title = 'EVENT RECORD';
      content = `<h3>${m03eChip(r.EventSource)} ${esc(r.EventType)}</h3><dl class="m03e-fields">${M03E_UNIFIED_FIELDS.filter((f) => f !== 'EventSource').map((f) => m03eField(f, f === 'TimeGenerated' ? r[f].replace('T', ' ').replace('Z', ' UTC') : r[f])).join('')}${extra.map((f) => m03eField(f, r[f])).join('')}</dl>${m03ePinButton(scope, r.__rid).replace('m03e-pin', 'm03e-pin m03e-pin-wide')}<h4>Native record (${esc(M03E_SOURCE_MAPPINGS[r.EventSource]?.native || '')})</h4><pre class="m03e-code">${esc(m03eNativeRecord(r))}</pre>${r.SessionId && r.SessionId !== '—' ? hunt(`Pivot on session ${r.SessionId}`, `UnifiedEvents\n| where SessionId == "${r.SessionId}"\n| sort by TimeGenerated asc`) : ''}${hunt(`All events for ${r.Account}`, `UnifiedEvents\n| where Account == "${r.Account}"\n| sort by TimeGenerated asc`)}`;
    }
  }
  if (sel?.type === 'account') {
    const i = data.tables.IdentityInfo.find((x) => x.Account === sel.id);
    const count = data.tables.UnifiedEvents.filter((r) => r.Account === sel.id).length;
    title = 'ACCOUNT';
    content = `<h3>${esc(sel.id)}</h3>${i ? `<p>${esc(i.DisplayName)}</p><dl class="m03e-fields">${m03eField('Type', i.Type)}${m03eField('Department', i.Department)}${m03eField('Owner', i.Owner)}${m03eField('Privileged', i.Privileged)}${m03eField('Usual source IP', i.UsualSourceIp)}${m03eField('Events in window', count)}</dl>${i.Notes ? `<p class="m03e-callout-note">${esc(i.Notes)}</p>` : ''}` : `<dl class="m03e-fields">${m03eField('Directory record', 'None (system or host identity)')}${m03eField('Events in window', count)}</dl>`}${hunt('Hunt this account', `UnifiedEvents\n| where Account == "${sel.id}"\n| sort by TimeGenerated asc`)}${timelineBtn(sel.id)}`;
  }
  if (sel?.type === 'ip') {
    const i = data.tables.IpIntel.find((x) => x.SourceIp === sel.id);
    const accts = [...new Set(data.tables.UnifiedEvents.filter((r) => r.SourceIp === sel.id).map((r) => r.Account))];
    title = 'IP ADDRESS';
    content = `<h3 class="m03e-mono">${esc(sel.id)}</h3><dl class="m03e-fields">${i ? `${m03eField('Type', i.Type)}${m03eField('Country', i.Country)}${m03eField('Network', i.Asn)}${m03eField('First seen', i.FirstSeen)}` : ''}${m03eField('Accounts seen', accts.join(', '))}</dl>${i ? `<p class="m03e-callout-note">${esc(i.Reputation)}</p>` : ''}${hunt('Hunt this IP', `UnifiedEvents\n| where SourceIp == "${sel.id}"\n| sort by TimeGenerated asc`)}${timelineBtn(sel.id)}`;
  }
  if (sel?.type === 'host') {
    const rows = data.tables.UnifiedEvents.filter((r) => r.Host === sel.id);
    title = 'HOST';
    content = `<h3>${esc(sel.id)}</h3><dl class="m03e-fields">${m03eField('Events', rows.length)}${m03eField('Sources', [...new Set(rows.map((r) => r.EventSource))].join(', '))}${m03eField('Accounts', [...new Set(rows.map((r) => r.Account))].join(', '))}</dl>${hunt('Hunt this host', `UnifiedEvents\n| where Host == "${sel.id}"\n| sort by TimeGenerated asc`)}`;
  }
  if (sel?.type === 'source') {
    const map = M03E_SOURCE_MAPPINGS[sel.id];
    const sample = data.tables[sel.id][0];
    title = 'DATA SOURCE';
    content = `<h3>${m03eChip(sel.id)}</h3><p>${esc(map.native)}</p><h4>Field mapping (native → normalized)</h4><table class="m03e-map-table"><tbody>${map.fields.map(([n, norm]) => `<tr><td class="m03e-mono">${esc(n)}</td><td>→</td><td class="m03e-mono">${esc(norm)}</td></tr>`).join('')}</tbody></table>${sample ? `<h4>Sample native record</h4><pre class="m03e-code">${esc(m03eNativeRecord(sample))}</pre>` : ''}${hunt(`Query ${sel.id}`, `${sel.id}\n| take 20`)}`;
  }
  if (sel?.type === 'watchlist') {
    const w = data.watchlists[sel.id];
    if (w) {
      const cols = Object.keys(w.rows[0] || {});
      title = 'WATCHLIST';
      content = `<h3>${esc(sel.id)}</h3><p>${esc(w.title)}</p><div class="m03e-table-wrap"><table class="m03e-map-table"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${w.rows.map((row) => `<tr>${cols.map((c) => `<td>${esc(row[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${hunt('Query this watchlist', `${sel.id}`)}`;
    }
  }
  return `<aside class="m03e-drawer" aria-live="polite"><p class="m03e-label">${title}</p>${content}</aside>`;
}

function m03eGuideBar() {
  const st = m03eState('practice');
  const total = M03E_GUIDE_STEPS.length;
  const done = st.guideStep >= total;
  const step = M03E_GUIDE_STEPS[Math.min(st.guideStep, total - 1)];
  const passed = !done && m03eStepPassed(step);
  const progress = `<div class="m03e-guide-progress" aria-hidden="true">${M03E_GUIDE_STEPS.map((s, i) => `<span class="${i < st.guideStep ? 'is-done' : i === st.guideStep ? 'is-current' : ''}"></span>`).join('')}</div>`;
  if (done) {
    return `<aside class="m03e-guide is-complete${st.guideCollapsed ? ' is-collapsed' : ''}" aria-label="Guided lab"><div class="m03e-guide-head"><span class="m03e-label">GUIDED LAB · COMPLETE</span>${progress}<button type="button" class="m03e-guide-toggle" data-m03e-guide-collapse aria-expanded="${!st.guideCollapsed}"><i class="ri-arrow-up-s-line" aria-hidden="true"></i><span class="m03e-sr-only">Toggle guide</span></button></div><div class="m03e-guide-body"><h3>Case debrief: CASE-MN-428</h3><p>AuthLog recorded a failed sign-in at 09:02 and a successful sign-in at 09:04 for acct-428. The same S-8841 session from 198.51.100.18 granted a directory role at 09:08 and exported application data at 09:12. Source provenance and raw IDs remain available for verification.</p><p>The 09:10 svc-backup restart is a separate SystemLog event under approved change CHG-221: it has a different identity, no S-8841 session, and a different source IP. <strong>Verdict:</strong> suspicious authentication-to-export sequence. <strong>Scope:</strong> acct-428 and the observed session; broader access and export destination remain to be checked. The handoff records this distinction and a bounded next step.</p><button type="button" class="m03e-guide-next" data-m03e-guide-restart>Restart guide</button></div></aside>`;
  }
  const tabLabel = m03eTabs('practice').find((t) => t[0] === step.tab)?.[1] || step.tab;
  return `<aside class="m03e-guide${st.guideCollapsed ? ' is-collapsed' : ''}${passed ? ' is-passed' : ''}" aria-label="Guided lab step"><div class="m03e-guide-head"><span class="m03e-label">GUIDED LAB · STEP ${st.guideStep + 1} OF ${total}</span>${progress}<button type="button" class="m03e-guide-toggle" data-m03e-guide-collapse aria-expanded="${!st.guideCollapsed}"><i class="ri-arrow-up-s-line" aria-hidden="true"></i><span class="m03e-sr-only">${st.guideCollapsed ? 'Show guide' : 'Hide guide'}</span></button></div><div class="m03e-guide-body"><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p><p class="m03e-guide-task"><strong>Your task:</strong> ${esc(step.task)}</p>${step.hint ? `<p class="m03e-guide-hint"><strong>${['auth','sort'].includes(step.id) ? 'Query' : 'Pattern'}:</strong> <code>${esc(step.hint).replace(/\n/g, ' ')}</code>${['auth','sort'].includes(step.id) ? ` <button type="button" data-m03e-insert="${esc(step.hint)}">Insert</button>` : ''}</p>` : ''}<p class="m03e-guide-look"><strong>Look for:</strong> ${esc(step.lookFor)}</p><div class="m03e-guide-actions">${st.tab !== step.tab ? `<button type="button" class="m03e-guide-go" data-m03e-tab="practice:${step.tab}">Go to ${esc(tabLabel)}</button>` : ''}<span class="m03e-guide-status" role="status">${passed ? '<i class="ri-checkbox-circle-fill" aria-hidden="true"></i> Step complete' : '<i class="ri-loader-4-line" aria-hidden="true"></i> Waiting for your evidence…'}</span><button type="button" class="m03e-guide-next" data-m03e-guide-next ${passed ? '' : 'disabled'}>${st.guideStep === total - 1 ? 'Finish guided lab' : 'Next step'} <i class="ri-arrow-right-line" aria-hidden="true"></i></button></div></div></aside>`;
}

function m03eStepPassed(step) {
  const st = m03eState('practice');
  return !!step.check(st, m03eResult('practice'), st.lastQuery);
}

function m03eViewBody(scope) {
  const tab = m03eState(scope).tab;
  if (tab === 'itsm' && scope === 'practice') return m03eItsmGuideView();
  if (tab === 'search') return m03eSearchView(scope);
  if (tab === 'timeline') return m03eTimelineView(scope);
  if (tab === 'entities') return m03eEntitiesView(scope);
  if (tab === 'sources') return m03eSourcesView(scope);
  if (tab === 'watchlists') return m03eWatchlistsView(scope);
  if (tab === 'evidence') return m03eEvidenceView(scope);
  if (tab === 'case' && scope === 'prove') return m03eCaseRecordView();
  return m03eAlertsView(scope);
}

// Evidence shows its pin count; ITSM Ticket shows how many ticket items are
// still open, or a check once submitted.
function m03eTabsNav(scope) {
  const st = m03eState(scope);
  const badge = (id) => {
    if (id === 'evidence' && st.pins.length) return ` <b>${st.pins.length}</b>`;
    if (id !== 'case') return '';
    if (st.determination.submitted) return ' <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>';
    const open = m03eProveMissing().length;
    return open ? ` <b title="${open} item${open === 1 ? '' : 's'} left">${open}</b>` : '';
  };
  return `<nav role="tablist">${m03eTabs(scope).map(([id, label]) => `<button type="button" role="tab" aria-selected="${st.tab === id}" class="${st.tab === id ? 'is-active' : ''}" data-m03e-tab="${scope}:${id}">${id === 'case' ? '<i class="ri-file-list-3-line" aria-hidden="true"></i> ' : ''}${label}${badge(id)}</button>`).join('')}</nav>`;
}

function moduleThreeConsoleHtml(scope) {
  const st = m03eState(scope), data = M03E_DATA[scope];
  return `<section class="m03e-console" aria-label="SIEM and log analysis console"><header><div><p>MISSION NEXT ENVIRONMENT · ${scope === 'practice' ? 'GUIDED' : 'ASSESSMENT'}</p><h2>SIEM &amp; LOG ANALYSIS</h2></div><span class="m03e-case">${esc(data.caseId)} · ${esc(data.day)} · ${data.tables.UnifiedEvents.length} events</span></header>
    ${scope === 'practice' ? m03eGuideBar() : ''}
    ${m03eTabsNav(scope)}
    <div class="m03e-workspace${st.tab === 'case' ? ' is-case' : ''}"><div class="m03e-view">${m03eViewBody(scope)}</div>${st.tab === 'case' ? '' : m03eDrawer(scope)}</div></section>`;
}

/* ------------------------------------------------------------ practice / prove panels */

function moduleThreePracticeComplete() {
  return m03eState('practice').guideStep >= M03E_GUIDE_STEPS.length;
}

function moduleThreeGuidedLabPanel() {
  if (!m03eState('practice').normalizedIngestReady) {
    return `<div class="m03e-panel" id="m03e-practice-panel"><p class="m03e-panel-instruction">Normalize and ingest the four source logs in the previous card. The investigation workspace will load this case’s alert and normalized events here.</p></div>`;
  }
  const st = m03eState('practice');
  return `<div class="m03e-panel" id="m03e-practice-panel">
    <p class="m03e-panel-instruction">Work CASE-MN-428 from the alert queue to a scoped finding. The guide checks what you actually find, not which buttons you press, so any query that returns the right evidence counts. Support drops as you go: the first steps give you queries, and the last ones give you only the goal.</p>
    <div class="m03e-console-host" id="m03e-console-practice">${moduleThreeConsoleHtml('practice')}</div>
    <label class="m03-note-label">Analyst handoff<textarea rows="3" maxlength="900" data-m03-practice-notes placeholder="Link the four events, exclude svc-backup / CHG-221, and state one scope limit or next check.">${esc(moduleThreeState.practiceNotes || '')}</textarea><small>Required for the final guide step. Include acct-428, S-8841, and CHG-221.</small></label>
    <div class="m03e-feedback${moduleThreeState.practiceComplete ? ' is-correct' : ''}" role="status">${moduleThreeState.practiceComplete ? 'Guided Lab complete: every step was verified from your own evidence.' : `The Guided Lab completes when all ${M03E_GUIDE_STEPS.length} guide steps are verified (${Math.min(st.guideStep, M03E_GUIDE_STEPS.length)} done).`}</div>
  </div>`;
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
// Same pattern as moduleOneProveItReviewStatus() (soc-analyst-module-01.js).
function m03eReviewStatus() {
  const d = m03eState('prove').determination;
  if (!d.submitted) return '';
  const attempt = moduleThreeUser?.latestLabAttemptByKey?.[MODULE_THREE_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}
function m03eRedoRequested() {
  return moduleThreeUser?.openLabRedosByModuleKey?.['soc-03']?.labKey === MODULE_THREE_CATALOG_LAB_KEY;
}
function m03eRedoFeedback() {
  if (!m03eRedoRequested()) return '';
  const items = moduleThreeUser.openLabRedosByModuleKey['soc-03'].feedback || [];
  return `<div class="m01-redo-feedback" role="note"><strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>${items.length ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>` : '<p>Your instructor returned this case without written notes.</p>'}</div>`;
}
// A redo re-opens the working case without discarding the earlier values,
// mirroring moduleOneLoad()'s reset (soc-analyst-module-01.js).
function m03eApplyRedoReopen() {
  const d = m03eState('prove').determination;
  if (m03eRedoRequested() && d.submitted === true) { d.submitted = false; m03eSave(); }
}

// The indicator/action checkbox groups and the structured 4-part handoff
// keep their original markup and data attributes unchanged (m03eHandleFormInput
// still reads them) — they render as `spec.findingsHtml`, between the ticket
// grid (status/severity/entities/disposition/escalation/account findings)
// and the standard Analyst Work Notes textarea.
function m03eFindingsHtml(d, disabled) {
  const dis = disabled ? 'disabled' : '';
  const check = (name, value, label) => `<label><input type="checkbox" value="${esc(value)}" data-m03e-det-list="${name}" ${d[name].includes(value) ? 'checked' : ''} ${dis}> ${esc(label)}</label>`;
  const area = (key, label, placeholder) => `<label class="m03-note-label">${esc(label)}<textarea rows="3" maxlength="1500" data-m03e-handoff="${key}" placeholder="${esc(placeholder)}" ${dis}>${esc(d.handoff[key])}</textarea></label>`;
  return `<fieldset class="m01-ticket-field"><legend>Indicators to hand off</legend><div class="m03e-choices m03e-choices-col">${M03E_INDICATORS.map(([v, l]) => check('indicators', v, l)).join('')}</div></fieldset>
    <fieldset class="m01-ticket-field"><legend>Recommended response</legend><div class="m03e-choices m03e-choices-col">${M03E_ACTIONS.map(([v, l]) => check('actions', v, l)).join('')}</div></fieldset>
    <fieldset class="m01-ticket-field"><legend>Analyst handoff</legend>
      ${area('observations', 'Observations: what the logs show (source, time, entity)', 'Cite records: source, time, account, IP, session…')}
      ${area('analysis', 'Analysis: why the linked observations support your verdict', 'How do the records connect? What rules out the lookalikes?')}
      ${area('scope', 'Scope: confirmed, and still unknown', 'Affected accounts and sessions; what you could not confirm, and why')}
      ${area('nextAction', 'Requested next action', 'What should happen next, and who should do it')}
    </fieldset>`;
}

function m03eCaseSpec(disabled) {
  const st = m03eState('prove');
  return {
    caseId: M03E_PROVE.caseId,
    ticketId: 'INC-MN-517',
    ticketType: 'Security incident · linked case CASE-MN-517',
    userOptions: M03E_USER_OPTIONS,
    deviceOptions: M03E_DEVICE_OPTIONS,
    departmentOptions: M03E_DEPARTMENT_OPTIONS,
    dispositionOptions: M03E_DISPOSITION_OPTIONS,
    findings: M03E_ACCOUNT_FINDINGS,
    findingsHtml: m03eFindingsHtml(st.determination, disabled),
    notesPlaceholder: 'Two or three sentences your lead can act on.',
    disabled,
  };
}

// The account-scope ("at least one account scoped") and 4-part handoff gate
// match the original determination form's requirements exactly; only the
// standard ticket fields (status/severity/entities/disposition/escalation)
// are new requirements, since this module now uses the standard ticket.
function m03eProveMissing() {
  const st = m03eState('prove');
  const d = st.determination;
  const missing = caseRecordMissing(d, { ...m03eCaseSpec(false), findings: [], notesMin: 0 });
  if (!d.accountStatus['m.ortiz'] && !Object.values(d.accountStatus).some(Boolean)) missing.push('Assess at least one account’s scope');
  Object.entries({ observations: 'observations', analysis: 'analysis', scope: 'scope', nextAction: 'next action' }).forEach(([k, label]) => { if (!d.handoff[k].trim()) missing.push(`Write the ${label} handoff field`); });
  return missing;
}

// The incident ticket tab: the standard ticket, with a line tying it back to
// the evidence the learner pinned (pins and query history go with it).
function m03eCaseRecordView() {
  const st = m03eState('prove');
  const d = m03eSyncFindingsView(st.determination);
  const submitted = d.submitted === true;
  const pins = st.pins.length;
  return `<div class="m03e-case-view">
    <p class="m03e-case-attach"><i class="ri-attachment-2" aria-hidden="true"></i> ${pins} pinned evidence record${pins === 1 ? '' : 's'} and ${st.queryLog.length} logged quer${st.queryLog.length === 1 ? 'y' : 'ies'} attach to this ticket on submit. <button type="button" data-m03e-tab="prove:evidence">Review evidence</button></p>
    ${caseRecordPane(d, {
      ...m03eCaseSpec(submitted),
      missing: m03eProveMissing(),
      formId: 'm03e-prove-form',
      saveAttr: 'data-m03e-save-prove',
      submitAttr: 'data-m03e-submit-prove',
      panelId: 'm03e-prove-review',
      reviewStatus: m03eReviewStatus(),
      redoRequested: m03eRedoRequested(),
      redoHtml: m03eRedoFeedback(),
      showMissing: st.submitMessage === 'missing',
      lockedMessage: 'Module 4 stays locked until your instructor approves the submission.',
    })}
    <p class="m03e-muted">Your instructor reviews the submission; the automated score is only a recommendation.</p>
  </div>`;
}

function moduleThreeAssessmentLabPanel() {
  return `<div class="m03e-panel" id="m03e-prove-panel">
    <div class="m03e-brief"><p class="m03e-label">INCIDENT INC-MN-517 · CASE ${esc(M03E_PROVE.caseId)} · ASSIGNED TO YOU</p><p>Overnight, the SIEM raised a password-spray alert and, a few minutes later, an inbox-forwarding alert. Your lead’s request: <em>“Work out what happened, which accounts are actually affected, and what we should do. Put it in a handoff I can pass to identity response.”</em></p><p class="m03e-muted">Use the same console as the Guided Lab, with different telemetry and no guide. Start from the alert queue, pin the records that support your findings, then complete <strong>INC-MN-517</strong> in the console’s <strong>ITSM Ticket</strong> tab.</p></div>
    <div class="m03e-console-host" id="m03e-console-prove">${moduleThreeConsoleHtml('prove')}</div>
  </div>`;
}

/* ------------------------------------------------------------ actions */

function m03eSave() { moduleThreeSave(); }

function m03eRender(scope, { keepEditor = false } = {}) {
  const host = document.getElementById(`m03e-console-${scope}`);
  if (!host) return;
  if (keepEditor && m03eState(scope).tab === 'search') {
    // Re-render everything except the editor, so focus and caret survive a run.
    const res = document.getElementById(`m03e-results-${scope}`);
    if (res) res.innerHTML = m03eResultsHtml(scope);
    const drawer = host.querySelector('.m03e-drawer');
    if (drawer) drawer.outerHTML = m03eDrawer(scope);
    const guide = host.querySelector('.m03e-guide');
    if (guide && scope === 'practice') guide.outerHTML = m03eGuideBar();
    const tabs = host.querySelector('nav');
    if (tabs) tabs.outerHTML = m03eTabsNav(scope);
  } else {
    host.innerHTML = moduleThreeConsoleHtml(scope);
    m03eAttachEditor(scope);
  }
  if (scope === 'practice') m03eSyncPractice();
}

function m03eAttachEditor(scope) {
  const ta = document.getElementById(`m03e-kql-${scope}`);
  if (!ta || typeof attachKqlEditor !== 'function') return;
  attachKqlEditor(ta, { tables: () => M03E_DATA[scope].tables, onRun: () => m03eRun(scope) });
}

function m03eRun(scope, query) {
  const st = m03eState(scope);
  const ta = document.getElementById(`m03e-kql-${scope}`);
  const q = query != null ? query : (ta ? ta.value : st.query);
  st.query = q;
  st.lastQuery = q;
  const r = m03eResult(scope);
  if (r && !r.error) {
    // Record meaningful actions only: which sources the result touched and
    // whether it linked more than one source on a shared entity.
    const rows = r.rows || [];
    const data = M03E_DATA[scope];
    const sources = [...new Set(rows.map((row) => row.__rid && data.records[row.__rid]?.EventSource).filter(Boolean))];
    const watch = Object.keys(data.watchlists).filter((w) => new RegExp(`\\b${w}\\b`).test(q));
    watch.forEach((w) => m03eSeen(st, `watchlist:${w}`));
    const keys = ['Account', 'SourceIp', 'SessionId'];
    const pivot = sources.length >= 2 && keys.some((k) => { const vals = new Set(rows.map((row) => data.records[row.__rid]?.[k]).filter((v) => v && v !== '—')); return vals.size === 1; });
    st.queryLog.push({ at: new Date().toISOString(), query: q.slice(0, 600), rows: rows.length, sources, pivot });
    if (st.queryLog.length > 60) st.queryLog.splice(0, st.queryLog.length - 60);
  }
  m03eSave();
  m03eRender(scope, { keepEditor: true });
}

function m03eSyncPractice() {
  // Mirror guide completion into the module's section state and status pill.
  const done = moduleThreePracticeComplete();
  if (done && !moduleThreeState.practiceComplete) {
    moduleThreeState.practiceComplete = true;
    m03eSave();
    const panel = document.getElementById('m03e-practice-panel');
    const fb = panel && panel.querySelector('.m03e-feedback');
    if (fb) { fb.classList.add('is-correct'); fb.textContent = 'Guided Lab complete: every step was verified from your own evidence.'; }
  }
}

function m03eGoTo(scope, tab) {
  const st = m03eState(scope);
  st.tab = tab;
  m03eSave();
  m03eRender(scope);
}

function m03eHandleClick(scope, ev) {
  const st = m03eState(scope);
  const el = ev.target.closest('button,[data-m03e-select]');
  if (!el) return;
  const d = el.dataset;
  if (d.m03ePin) {
    ev.stopPropagation();
    const rid = d.m03ePin.split(':').slice(1).join(':');
    const i = st.pins.indexOf(rid);
    if (i >= 0) st.pins.splice(i, 1); else st.pins.push(rid);
    m03eSave(); m03eRender(scope, { keepEditor: true });
    return;
  }
  if (d.m03eSelect) {
    const [, type, ...rest] = d.m03eSelect.split(':');
    const id = rest.join(':');
    st.selected = { type, id };
    if (type === 'alert') m03eSeen(st, `alert:${id}`);
    if (['account', 'ip', 'host'].includes(type)) m03eSeen(st, `entity:${type}:${id}`);
    if (type === 'source') m03eSeen(st, `source:${id}`);
    if (type === 'watchlist') m03eSeen(st, `watchlist:${id}`);
    m03eSave(); m03eRender(scope, { keepEditor: true });
    return;
  }
  if (d.m03eTab) { m03eGoTo(scope, d.m03eTab.split(':')[1]); return; }
  if (d.m03eEntitykind) { st.entityKind = d.m03eEntitykind.split(':')[1]; m03eSave(); m03eRender(scope); return; }
  if (d.m03eRun != null) { m03eRun(scope); return; }
  if (d.m03eClear != null) { st.query = ''; st.lastQuery = ''; m03eSave(); m03eRender(scope); return; }
  if (d.m03eTable) { const name = d.m03eTable.split(':')[1]; ev.preventDefault(); st.query = `${name}\n| take 20`; m03eSave(); m03eRender(scope); return; }
  if (d.m03eExample != null || d.m03eHunt != null || d.m03eInsert != null) {
    const q = d.query || d.m03eInsert;
    st.query = q; st.tab = 'search';
    m03eSave(); m03eRender(scope);
    if (d.m03eInsert == null) m03eRun(scope, q);
    return;
  }
  if (d.m03eShowTimeline) { st.timelineEntity = d.m03eShowTimeline.split(':').slice(1).join(':'); m03eSeen(st, `timeline:${st.timelineEntity}`); st.tab = 'timeline'; m03eSave(); m03eRender(scope); return; }
  if (el.hasAttribute('data-m03e-guide-collapse')) { st.guideCollapsed = !st.guideCollapsed; m03eSave(); m03eRender(scope, { keepEditor: true }); return; }
  if (el.hasAttribute('data-m03e-guide-next')) {
    const step = M03E_GUIDE_STEPS[st.guideStep];
    if (!step || !m03eStepPassed(step)) return;
    st.guideStep += 1;
    const next = M03E_GUIDE_STEPS[st.guideStep];
    if (next) st.tab = next.tab;
    m03eSave(); m03eRender(scope);
    if (st.guideStep >= M03E_GUIDE_STEPS.length) moduleThreeRefreshLabPanels();
    return;
  }
  if (el.hasAttribute('data-m03e-guide-restart')) { st.guideStep = 0; st.tab = 'alerts'; m03eSave(); m03eRender(scope); }
}

function m03eHandleChange(scope, ev) {
  const st = m03eState(scope);
  const t = ev.target;
  if (t.matches('[data-m03e-timeline]')) { st.timelineEntity = t.value; if (t.value) m03eSeen(st, `timeline:${t.value}`); m03eSave(); m03eRender(scope); }
}

// Assessment form edits are autosaved as a draft; nothing is scored until submit.
function m03eHandleFormInput(ev) {
  const st = m03eState('prove');
  const d = st.determination;
  const t = ev.target;
  if (!st.startedAt) st.startedAt = new Date().toISOString();
  // Standard ticket controls (case-record.js) carry a `name`, not a
  // `data-m03e-*` attribute. `finding:account-<id>` selects mirror into
  // accountStatus — the rubric's actual source of truth — since
  // moduleThreeScoreAssessment() reads accountStatus, not `findings`.
  if (t.name && caseRecordApply(d, t.name, t.value)) {
    if (t.name.startsWith('finding:account-')) d.accountStatus[t.name.slice('finding:account-'.length)] = t.value;
  } else if (t.dataset.m03eDetList) { const list = d[t.dataset.m03eDetList]; const i = list.indexOf(t.value); if (t.checked && i < 0) list.push(t.value); if (!t.checked && i >= 0) list.splice(i, 1); }
  else if (t.dataset.m03eHandoff) d.handoff[t.dataset.m03eHandoff] = t.value;
  else return;
  d.actionHistory.push({ action: `Updated ${t.name || t.dataset.m03eDetList || t.dataset.m03eHandoff}`, at: new Date().toISOString() });
  m03eSave();
}

function m03eSubmitAssessment() {
  const st = m03eState('prove');
  const d = st.determination;
  if (d.submitted) return;
  const missing = m03eProveMissing();
  if (missing.length) {
    st.submitMessage = 'missing';
    st.tab = 'case';
    m03eSave(); moduleThreeRefreshLabPanels(); return;
  }
  st.submitMessage = '';
  const performance = moduleThreeScoreAssessment({ determination: d, pins: st.pins, queryLog: st.queryLog });
  st.attempts = (st.attempts || 0) + 1;
  st.submittedAt = new Date().toISOString();
  d.submitted = true;
  d.actionHistory.push({ action: 'Submitted case for faculty review', at: st.submittedAt });
  moduleThreeState.completed = true;
  moduleThreeState.attempts = st.attempts;
  moduleThreeState.lastSubmittedAt = st.submittedAt;
  moduleThreeState.score = performance.score;
  moduleThreeState.bestScore = Math.max(moduleThreeState.bestScore || 0, performance.score);
  moduleThreeState.notes = [d.handoff.observations, d.handoff.analysis, d.handoff.scope, d.handoff.nextAction].join('\n\n');
  moduleThreeState.feedback = ['Submitted. Your ITSM ticket, pinned evidence and handoff are recorded for instructor review.'];
  if (Array.isArray(moduleThreeState.flags) && !moduleThreeState.flags.includes(MODULE_THREE_FLAG)) moduleThreeState.flags.push(MODULE_THREE_FLAG);

  const data = M03E_PROVE;
  const actionLabel = Object.fromEntries(M03E_ACTIONS);
  const evidence = st.pins.map((id) => data.records[id]).filter(Boolean).sort((a, b) => a.TimeGenerated.localeCompare(b.TimeGenerated));
  const evidenceLines = evidence.map((r) => `${m03eTime(r.TimeGenerated)} ${r.EventSource} ${r.EventType} ${r.Account} ${r.SourceIp} ${r.SessionId}: ${r.Detail}`);
  const caseSpec = m03eCaseSpec(true);
  // Instructor payload (CASE_RECORD_MIGRATION.md #4): the shared case-record
  // ticket shape, `case_record.notes` holding just the analyst work note
  // (case_record.handoff still carries the 4-part structured handoff —
  // adminCaseTicketSubmissionPanel() in app.js renders both), plus
  // case_display/case_summary for the standard grading view.
  // simulator_performance/breakdown/feedback feed the existing competency
  // and score-explanation panels; recommended response and pinned evidence
  // (not part of the standard ticket fields) go in `assessment` below.
  const result = {
    case_record: m03eSyncFindingsView(d),
    case_display: caseRecordDisplay(d, caseSpec),
    case_summary: caseRecordSummary(d, caseSpec),
    simulator_performance: {
      competencies: performance.competencies.map((c) => ({ label: `${c.label} (${c.earned}/${c.max} pts)`, percentage: c.percentage, passed: c.passed, completed: c.completed, required: c.required })),
      requirements: performance.competencies.flatMap((c) => [...c.evidence.map((e) => ({ label: e, completed: true })), ...c.misses.map((m) => ({ label: m, completed: false }))]),
      missed_actions: [...performance.criticalMisses.map((m) => `CRITICAL: ${m}`), ...performance.competencies.flatMap((c) => c.misses)],
      unsafe_actions: performance.competencies.flatMap((c) => c.unsafe),
      generated_recommendations: performance.competencies.filter((c) => !c.passed).map((c) => `${c.label}: ${c.misses.slice(0, 3).join('; ') || 'review deductions'}.`),
    },
    breakdown: Object.fromEntries([...performance.competencies.map((c) => [c.label, `${c.earned} / ${c.max}`]), ['Automated total', `${performance.total} / 100`], ['Recommended score', `${performance.score} / 100${performance.criticalMisses.length ? ' (capped: critical miss)' : ''}`]]),
    feedback: [
      ...performance.criticalMisses.map((m) => `Critical competency missed: ${m}.`),
      ...performance.competencies.flatMap((c) => [...c.evidence.map((e) => `${c.label} ✓ ${e}`), ...c.deductions.map((e) => `${c.label} ✗ ${e}`), ...c.misses.map((m) => `${c.label} — missed: ${m}`)]),
    ],
    assessment: {
      case_id: data.caseId, attempt: st.attempts, started_at: st.startedAt || st.submittedAt, submitted_at: st.submittedAt,
      selected_evidence: evidence.map((r) => r.__rid),
      determinations: { verdict: d.verdict, severity: d.severity, account_status: d.accountStatus, indicators: d.indicators },
      actions: d.actions, actions_labels: d.actions.map((a) => actionLabel[a] || a), escalation: { required: d.escalation, to: d.escalateTo },
      pinned_evidence: evidenceLines,
      query_log: st.queryLog.slice(-40),
    },
  };
  if (typeof recordLabAttempt === 'function') recordLabAttempt(moduleThreeUser, MODULE_THREE_CATALOG_LAB_KEY, { state: 'complete', score: performance.score, result });
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY);
  m03eSave();
  const status = document.getElementById('m03-status');
  if (status) status.textContent = 'Complete';
  moduleThreeRefreshLabPanels();
}

function moduleThreeRefreshLabPanels() {
  const practice = document.getElementById('m03e-practice-panel');
  if (practice) { practice.outerHTML = moduleThreeGuidedLabPanel(); m03eAttachEditor('practice'); }
  const prove = document.getElementById('m03e-prove-panel');
  if (prove) { prove.outerHTML = moduleThreeAssessmentLabPanel(); m03eAttachEditor('prove'); }
  const statusGuided = document.querySelector('.m03-status dd');
  if (statusGuided) statusGuided.textContent = moduleThreeState.practiceComplete ? 'Complete' : 'In progress';
}

function wireModuleThreeConsole() {
  ['practice', 'prove'].forEach((scope) => {
    const section = document.getElementById(scope === 'practice' ? 'm03-guided-lab-dynamic' : 'm03-assessment-lab-dynamic');
    if (!section || section.dataset.m03eWired === '1') return;
    section.dataset.m03eWired = '1';
    m03eAttachEditor(scope);
    section.addEventListener('click', (ev) => {
      if (scope === 'prove') {
        if (ev.target.closest('[data-m03e-submit-prove]')) { m03eSubmitAssessment(); return; }
        if (ev.target.closest('[data-m03e-save-prove]')) {
          m03eState('prove').determination.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
          m03eSave();
          const prove = document.getElementById('m03e-prove-panel');
          if (prove) { prove.outerHTML = moduleThreeAssessmentLabPanel(); m03eAttachEditor('prove'); }
          return;
        }
      }
      if (ev.target.closest(`#m03e-console-${scope}`)) m03eHandleClick(scope, ev);
    });
    section.addEventListener('keydown', (ev) => {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[data-m03e-select]') && ev.target.tagName !== 'BUTTON') { ev.preventDefault(); m03eHandleClick(scope, ev); }
    });
    section.addEventListener('change', (ev) => {
      const inTicket = scope === 'prove' && ev.target.closest('#m03e-prove-form');
      if (!inTicket && ev.target.closest(`#m03e-console-${scope}`)) { m03eHandleChange(scope, ev); return; }
      if (!inTicket) return;
      m03eHandleFormInput(ev);
      // A select/checkbox pick (unlike typing) is safe to re-render on, and
      // it is the only way the conditional "Route to Department" field and
      // the requirements list stay honest as the ITSM ticket changes.
      if (ev.target.tagName !== 'TEXTAREA') {
        const prove = document.getElementById('m03e-prove-panel');
        if (prove) { prove.outerHTML = moduleThreeAssessmentLabPanel(); m03eAttachEditor('prove'); }
      }
    });
    section.addEventListener('input', (ev) => {
      if (ev.target.id === `m03e-kql-${scope}`) { m03eState(scope).query = ev.target.value; m03eSave(); return; }
      if (ev.target.matches('[data-m03-practice-notes]')) {
        moduleThreeState.practiceNotes = ev.target.value;
        m03eSave();
        const st = m03eState('practice');
        const step = M03E_GUIDE_STEPS[st.guideStep];
        if (step?.id === 'handoff') {
          const passed = m03eStepPassed(step);
          const next = section.querySelector('[data-m03e-guide-next]');
          const status = section.querySelector('.m03e-guide-status');
          if (next) next.disabled = !passed;
          if (status) status.innerHTML = passed ? '<i class="ri-checkbox-circle-fill" aria-hidden="true"></i> Step complete' : '<i class="ri-loader-4-line" aria-hidden="true"></i> Waiting for a bounded handoff…';
          section.querySelector('.m03e-guide')?.classList.toggle('is-passed', passed);
        }
        return;
      }
      if (scope === 'prove' && ev.target.closest('#m03e-prove-form') && ev.target.tagName === 'TEXTAREA') m03eHandleFormInput(ev);
    });
    section.addEventListener('submit', (ev) => {
      if (ev.target.id !== 'm03e-prove-form') return;
      ev.preventDefault();
      m03eSubmitAssessment();
    });
  });
  m03eSyncPractice();
}

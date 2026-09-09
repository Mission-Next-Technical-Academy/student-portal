/* Module 03 — assisted SIEM alert triage and log correlation.
 * All telemetry, identities, systems, and outcomes are fictional and local-only.
 */

const MODULE_THREE_LAB_ID = 'm03-siem-signal-room-v1';
const MODULE_THREE_FLAG = 'M03-SIEM-CORRELATION-COMPLETE';
const MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage';
const MODULE_THREE_PASSING_SCORE = 70;

const MODULE_THREE_QUIZ_BANKS = [
  {
    conceptId: 'log-normalization',
    conceptTitle: 'Log normalization and shared fields',
    questions: [
      {
        id: 'm03-q-norm-1',
        prompt: 'A SIEM system receives logs from three different sources: Windows Event Logs, Linux syslog, and a cloud application API. Each system names authentication events differently (SecurityEvent 4624, "auth" message type, and "login_event" in JSON). Why is normalization critical for correlation?',
        options: [
          { id: 'a', text: 'Normalization is optional; analysts can manually translate field names.' },
          { id: 'b', text: 'By mapping diverse source formats to shared fields (time, account, host, source IP, result), a SIEM enables analysts to compare events across systems without learning each source\'s unique naming convention.' },
          { id: 'c', text: 'Normalization only matters for database storage efficiency.' },
          { id: 'd', text: 'Each source should be analyzed in isolation to avoid losing detail.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Normalization bridges format diversity. Shared fields like timestamp, user identity, and result code allow correlation across heterogeneous sources.',
        feedbackIncorrect: 'A SIEM\'s core strength is normalizing disparate sources into a common schema. Without it, manual translation wastes time and introduces interpretation errors.',
      },
      {
        id: 'm03-q-norm-2',
        prompt: 'After normalization, a SIEM shows that the same user account signed in from two different source IP addresses within 30 seconds—one marked as "Windows domain login" and one as "VPN authentication." What does this normalized comparison enable?',
        options: [
          { id: 'a', text: 'It allows impossible-travel detection: evaluating whether the geographic or network distance between the two IPs makes a 30-second sign-in sequence physically implausible.' },
          { id: 'b', text: 'Normalization has no impact; the two logins are unrelated because they use different authentication methods.' },
          { id: 'c', text: 'It proves one of the logins is fraudulent.' },
          { id: 'd', text: 'Normalized fields only apply to the current event, not to multi-source correlations.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Impossible travel is a classic correlation case: when normalized timestamps and geolocations from different sources contradict physical feasibility, it signals compromise or account misuse.',
        feedbackIncorrect: 'Normalization enables correlation precisely because it makes the same entity (user, IP, timestamp) comparable across different source formats and systems.',
      },
      {
        id: 'm03-q-norm-3',
        prompt: 'An analyst notices that one SIEM source logs authentication results as "0" or "1" (0 = denied, 1 = allowed) while another uses text labels ("Failed", "Success"). Without normalization mapping these to a standard result field, what is the likely outcome?',
        options: [
          { id: 'a', text: 'The analyst will correctly interpret both formats through experience.' },
          { id: 'b', text: 'A correlation rule seeking to match "Success" results will miss the "1" entries, creating alert gaps and leaving compromise sequences partially undetected.' },
          { id: 'c', text: 'Text labels are always preferred; numeric codes should be discarded.' },
          { id: 'd', text: 'Correlation rules work on raw data without normalization.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Unmapped numeric codes and text labels break rule-based correlation. Rules that query the normalized result field will miss events in sources using different encoding until normalization is applied.',
        feedbackIncorrect: 'Without normalization, queries and correlation rules become source-specific. A single rule cannot detect patterns across sources using different encoding for the same concept.',
      },
      {
        id: 'm03-q-norm-4',
        prompt: 'A security team maintains a list of business-critical systems by hostname. A normalized SIEM log includes both "hostname" and "netbios_name" fields for Windows events. Why does field normalization planning matter before an incident?',
        options: [
          { id: 'a', text: 'It ensures business-context lists can be reliably matched to logs during investigation, so critical-system access attempts are correctly identified instead of being overlooked due to name-format mismatches.' },
          { id: 'b', text: 'Field names are just labels; they do not affect incident detection.' },
          { id: 'c', text: 'Business context should never be mixed with technical logs.' },
          { id: 'd', text: 'Normalization should only be done after an incident is detected.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Normalization bridges business context and technical logs. If a critical-system inventory uses "hostname" but logs emit "netbios_name", correlation breaks unless they are normalized to the same field.',
        feedbackIncorrect: 'Normalization is foundational: it ensures that business context (criticality, ownership, function) can be reliably matched to technical data during triage and investigation.',
      },
    ],
  },
  {
    conceptId: 'chronological-reasoning',
    conceptTitle: 'Chronological ordering and timeline reasoning',
    questions: [
      {
        id: 'm03-q-chrono-1',
        prompt: 'Five log entries show: (1) failed sign-in at 09:05, (2) successful sign-in at 09:07, (3) failed sign-in at 09:06, (4) privilege escalation at 09:08, (5) data export at 09:09. An analyst initially sorted them by entry ID instead of timestamp. Why does chronological order matter?',
        options: [
          { id: 'a', text: 'Chronological order is a cosmetic preference with no analytical value.' },
          { id: 'b', text: 'Sorting by time reveals sequence: two failures followed by success, then escalation and export—a pattern suggesting credential-and-privilege misuse rather than isolated anomalies.' },
          { id: 'c', text: 'Entry ID order is more accurate than timestamp order.' },
          { id: 'd', text: 'Analysts should not assume sequence implies causation.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Timeline sequence is critical. Failed authentication → success → privilege → export tells a story of attack progression. Unsorted, the same events appear random.',
        feedbackIncorrect: 'Temporal ordering reveals patterns invisible in unsorted data. Privilege escalation after successful sign-in is suspicious; privilege escalation before sign-in may be unrelated.',
      },
      {
        id: 'm03-q-chrono-2',
        prompt: 'An alert fires for "multiple failed password attempts." The analyst runs a query sorted by timestamp descending (newest first) and sees the most recent failures. What is the risk of not also viewing oldest-to-newest?',
        options: [
          { id: 'a', text: 'Newest-to-oldest is always the correct sort order.' },
          { id: 'b', text: 'The analyst might miss a preceding successful sign-in or privilege escalation that explains why the recent failures are relevant—they might represent an attacker re-attempting after being locked out.' },
          { id: 'c', text: 'Sort order does not affect the interpretation of events.' },
          { id: 'd', text: 'Analysts should only review the most recent events.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Context from earlier events is essential. A successful sign-in followed by failures suggests the attacker is locked out; failures alone look like a brute-force probe with no prior foothold.',
        feedbackIncorrect: 'Temporal order provides context. Oldest-to-newest reveals the progression; newest-to-oldest hides causality chains.',
      },
      {
        id: 'm03-q-chrono-3',
        prompt: 'Two events have identical timestamps (09:15:00.000): a password change and a role assignment. The analyst cannot determine which occurred first. Why is this sub-second precision relevant during investigation?',
        options: [
          { id: 'a', text: 'Sub-second precision is irrelevant; one-second granularity is always sufficient.' },
          { id: 'b', text: 'If a password changed seconds after a compromise, the attacker cannot use the old password. If the role assignment came first, privilege escalation preceded credential change—a different attack sequence with different remediation steps.' },
          { id: 'c', text: 'The order of simultaneous events never matters.' },
          { id: 'd', text: 'Attackers always change passwords before role escalation.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Sequence determines response strategy. Privilege-then-password suggests the attacker secured access. Password-then-privilege suggests credential compromise before privilege abuse.',
        feedbackIncorrect: 'When events occur in the same second, the order still determines the attack timeline and appropriate containment steps.',
      },
      {
        id: 'm03-q-chrono-4',
        prompt: 'An analyst is examining a multi-week incident. The first forensic question is "How long was the adversary inside?" Sorting all events by timestamp reveals that the attacker\'s activity spans from initial compromise to discovery/remediation. Why is this timeline the starting point?',
        options: [
          { id: 'a', text: 'Timeline length is a reporting metric, not a detection or investigation tool.' },
          { id: 'b', text: 'Dwell time (time from first compromise to detection) determines scope: what data was accessed, how many follow-on compromises occurred, and what coverage rate is needed in recovery.' },
          { id: 'c', text: 'Analysts should focus only on the most recent activity.' },
          { id: 'd', text: 'Incident timeline is a police-report formality unrelated to technical investigation.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Dwell time is a critical investigation dimension. A one-day vs. three-month presence changes scope, remediation depth, and recovery strategy.',
        feedbackIncorrect: 'Temporal span provides essential scope for incident response: discovery gap, affected systems count, and containment priority.',
      },
    ],
  },
  {
    conceptId: 'correlation-vs-coincidence',
    conceptTitle: 'Correlation vs. coincidence',
    questions: [
      {
        id: 'm03-q-corr-1',
        prompt: 'An analyst observes: (1) a user\'s password attempt failed at 09:15, and (2) a different user\'s file was deleted at 09:15. Both events have the same timestamp. What is this correlation claim missing?',
        options: [
          { id: 'a', text: 'Shared timestamp alone proves correlation; these events are definitely related.' },
          { id: 'b', text: 'Shared fields beyond time: the same user account, the same host, the same source IP, or a demonstrated technical connection. Simultaneous timing of unrelated users and actions is coincidence, not correlation.' },
          { id: 'c', text: 'Correlation never requires shared identifiers.' },
          { id: 'd', text: 'All simultaneous events are correlated.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correlation requires more than coincidental timing. Shared entities (user, host, source IP) and technical connection establish whether events belong to the same activity chain.',
        feedbackIncorrect: 'Timing alone is not correlation. Two users\' unrelated actions at the same second are coincidence, not a connected pattern.',
      },
      {
        id: 'm03-q-corr-2',
        prompt: 'A SIEM alert shows: Account X signed in, then Account X escalated privileges, then Account X accessed a sensitive database. All within 5 minutes from the same source IP. Why is this tight entity-and-time cluster a stronger correlation signal than the same three events spread across different accounts over days?',
        options: [
          { id: 'a', text: 'Long time spans are always more suspicious than short ones.' },
          { id: 'b', text: 'Shared account + source IP + tight time window reduces the likelihood of coincidence. Different accounts over days suggests independent, unrelated events or legitimate business patterns.' },
          { id: 'c', text: 'All multi-event sequences are equally correlated regardless of entity overlap or timing.' },
          { id: 'd', text: 'Database access always indicates compromise, regardless of sequence.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correlation is strongest when multiple dimensions align: same entity, same source, tight window. Scatter these (different accounts, days apart) and you lose the coherent pattern.',
        feedbackIncorrect: 'Coincidence increases with time and account diversity. A tight chain of the same user, same IP, within minutes, is a more cohesive pattern than scattered events.',
      },
      {
        id: 'm03-q-corr-3',
        prompt: 'Two accounts sign in from the same IP at nearly the same time. However, one is a scheduled service account for backup jobs, and the other is a human interactive account. Is this a correlated attack sequence?',
        options: [
          { id: 'a', text: 'Yes; identical IP and timing prove they are part of the same attack.' },
          { id: 'b', text: 'No. Correlation requires both timing and context. A service account connecting from a fixed IP during scheduled hours is baseline behavior unrelated to a human login from the same IP, even if nearly simultaneous.' },
          { id: 'c', text: 'IP address is irrelevant to correlation.' },
          { id: 'd', text: 'Service accounts and human accounts can never appear on the same timeline.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Context distinguishes correlation from coincidence. Same IP + same time for a scheduled service and a human user is expected overlap, not attack chain.',
        feedbackIncorrect: 'Correlation analysis must include baseline behavior. Scheduled services and human accounts have different normal patterns; alignment does not automatically mean compromise.',
      },
      {
        id: 'm03-q-corr-4',
        prompt: 'During a month-long incident investigation, an analyst finds that an attacker\'s Account A accessed a file on Day 5, and later Account B accessed that same file on Day 8. The two accounts have no other interaction. Is this file access a correlation marker?',
        options: [
          { id: 'a', text: 'Yes; both accounts accessed the same file, so they are correlated.' },
          { id: 'b', text: 'No. A single shared resource over days, with no other entity overlap, shared source IP, or temporal clustering, suggests independent access or coincidence rather than a connected attack chain. Additional evidence (source IP, related activity) is needed to establish correlation.' },
          { id: 'c', text: 'Files should never be used in correlation analysis.' },
          { id: 'd', text: 'All access to the same file within a month is part of one incident.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'File access alone, without account relationship, shared source, or clustering, is weak evidence. Correlation requires multiple reinforcing dimensions.',
        feedbackIncorrect: 'A single shared touchpoint (a file) over days is not a strong correlation marker. Add account kinship, shared source IP, or temporal clustering to strengthen the claim.',
      },
    ],
  },
  {
    conceptId: 'kql-filtering',
    conceptTitle: 'KQL-style query filtering and sorting',
    questions: [
      {
        id: 'm03-q-kql-1',
        prompt: 'A analyst wants to find all failed sign-in attempts for a specific account from the past hour. Which KQL-style query is MOST appropriate?',
        options: [
          { id: 'a', text: 'UnifiedEvents | where Account == "jsmith" | where Result == "Failed"' },
          { id: 'b', text: 'UnifiedEvents | where TimeGenerated > ago(1h) and Account == "jsmith" and Result == "Failed" | sort by TimeGenerated asc' },
          { id: 'c', text: 'UnifiedEvents | sort by TimeGenerated asc' },
          { id: 'd', text: 'UnifiedEvents | Account == "jsmith"' },
        ],
        correctId: 'b',
        feedbackCorrect: 'This query applies a time window (past hour), filters for the account and result, then sorts oldest-to-newest to reveal attack progression.',
        feedbackIncorrect: 'A complete correlation query needs a time window, specific filter conditions, and sort order to isolate and order the relevant events.',
      },
      {
        id: 'm03-q-kql-2',
        prompt: 'An alert shows activity from source IP 192.0.2.42. The analyst runs: UnifiedEvents | where SourceIP == "192.0.2.42" | sort by TimeGenerated asc. What does this query reveal that a simple alert alone does not?',
        options: [
          { id: 'a', text: 'The query finds nothing; all events from that IP are unrelated.' },
          { id: 'b', text: 'The query returns all events from that source IP in chronological order, revealing the full sequence of activity (sign-ins, access, escalations) from that IP and whether it forms a coherent attack chain or represents multiple unrelated users.' },
          { id: 'c', text: 'Queries are less reliable than alerts.' },
          { id: 'd', text: 'Time sorting is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Query-based exploration reveals the full scope and pattern. The alert flags the IP; the query shows whether one attacker or many users are responsible.',
        feedbackIncorrect: 'Queries empower analysts to move beyond alert-level signals into the full activity context of a specific entity.',
      },
      {
        id: 'm03-q-kql-3',
        prompt: 'An analyst writes: UnifiedEvents | where Host == "DC-PROD-01" | sort by TimeGenerated desc. Why might sorting descending (newest first) mislead the analyst about a multi-step compromise?',
        options: [
          { id: 'a', text: 'Descending sort is always correct.' },
          { id: 'b', text: 'Descending order shows recent events first, risking missed earlier stages. A compromise starting with reconnaissance, then elevation, then export, will appear backwards—export first—hiding the attack progression.' },
          { id: 'c', text: 'Sort order never affects analysis.' },
          { id: 'd', text: 'Analysts should only see recent events.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Descending sort prioritizes recent events but obscures attack chains. Ascending (oldest-first) reveals the progression from initial compromise through exfiltration.',
        feedbackIncorrect: 'Sort order affects interpretation. For attack chain analysis, ascending (oldest-first) is more intuitive than descending.',
      },
      {
        id: 'm03-q-kql-4',
        prompt: 'A SIEM query supports AND and OR operators. An analyst writes: UnifiedEvents | where (Account == "admin" OR Account == "root") AND (Result == "Success"). What does the parentheses order ensure?',
        options: [
          { id: 'a', text: 'Parentheses are unnecessary; all operators work the same.' },
          { id: 'b', text: 'Parentheses ensure the OR applies to both admin and root accounts, and the AND for Result applies to the combined account set. Without parentheses, the query might apply Result only to "root", missing admin-account successes.' },
          { id: 'c', text: 'Parentheses change the meaning randomly.' },
          { id: 'd', text: 'Query operators are not logical; parentheses have no effect.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Parentheses enforce operator precedence. (Account A OR Account B) AND Result ensures the filter applies to both accounts, not just one.',
        feedbackIncorrect: 'Operator precedence matters. Without correct parentheses, the query might unintentionally filter one account while leaving another unfiltered.',
      },
    ],
  },
  {
    conceptId: 'alert-triage',
    conceptTitle: 'Alert triage and verdict reasoning',
    questions: [
      {
        id: 'm03-q-triage-1',
        prompt: 'An alert fires for "impossible travel": a user signed in from New York at 09:00 and then from London at 09:15. An analyst finds the user was actually on a transatlantic flight with in-flight WiFi, connecting to the VPN. What is the correct triage verdict?',
        options: [
          { id: 'a', text: 'True positive — the user account is compromised.' },
          { id: 'b', text: 'Benign positive — the alert is correct (impossible travel occurred) but explains to a legitimate context (in-flight VPN), not malicious activity.' },
          { id: 'c', text: 'False positive — no alert should have fired.' },
          { id: 'd', text: 'Compromise is certain; the user\'s explanation is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Benign positives are alerts that detect a real anomaly but lack evidence of malice. In-flight travel explains the impossible geography while confirming the user\'s legitimate access.',
        feedbackIncorrect: 'Alert correctness (something anomalous happened) does not equal compromise (malice occurred). Context determines the appropriate verdict.',
      },
      {
        id: 'm03-q-triage-2',
        prompt: 'An alert for "multiple failed password attempts" shows 50 failures from Account A over 30 seconds. The same account then signs in successfully at 09:15:31 using MFA. The password used in the failures is known to be weak. What is the likely verdict?',
        options: [
          { id: 'a', text: 'False positive — no actual attack.' },
          { id: 'b', text: 'True positive — immediate account disablement is needed.' },
          { id: 'c', text: 'True positive (attack attempted), but the attacker did not gain lasting access because MFA blocked them. Escalate for password reset and user notification, but account disablement may be premature.' },
          { id: 'd', text: 'Benign positive — 50 failures and a successful login are normal.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'True positive indicates the attack occurred; successful MFA indicates the account was not breached. Remediation is password reset and monitoring, not disablement.',
        feedbackIncorrect: 'Attack attempts that fail due to MFA are not false positives. Verdict is true positive with mitigated impact, requiring secure password change and user awareness.',
      },
      {
        id: 'm03-q-triage-3',
        prompt: 'An alert flags "new application deployment on a production server." The analyst finds a record of change request CHG-7744, manager approval, scheduled maintenance window, and the deployment matches the request. How should this be triaged?',
        options: [
          { id: 'a', text: 'True positive — all deployments are suspicious.' },
          { id: 'b', text: 'False positive — the alert is useless.' },
          { id: 'c', text: 'Benign positive — the alert correctly detected a deployment, and the deployment is authorized and documented.' },
          { id: 'd', text: 'No triage category applies.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Benign positives validate alert rules work (detection is real) while context proves the activity is authorized and routine.',
        feedbackIncorrect: 'Alert correctness and business authorization are separate checks. The alert is accurate; the activity is benign.',
      },
      {
        id: 'm03-q-triage-4',
        prompt: 'An alert shows "data export from HR database." The analyst correlates the export to a failed request for access 30 days prior, a rejected role escalation, and today\'s termination notice for that user. Why is this a concerning triage verdict?',
        options: [
          { id: 'a', text: 'False positive — exports before termination are routine.' },
          { id: 'b', text: 'Benign positive — the user has legitimate access to HR data.' },
          { id: 'c', text: 'True positive — motivation (rejected access, termination), timeline (30-day planning), and action (export) together suggest possible insider threat. The user may be exfiltrating data due to grievance.' },
          { id: 'd', text: 'Triage is impossible without knowing the user\'s name.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Multi-factor correlation reveals motive, means, and timing. Rejected access + escalation denial + termination + export form a troubling narrative requiring investigation.',
        feedbackIncorrect: 'Insider threat patterns require temporal and contextual correlation. A single access event is ambiguous; multiple reinforcing facts (rejection, termination, export) raise concern.',
      },
    ],
  },
];

const MODULE_THREE_SOURCES = [
  {
    title: 'Incident Response Recommendations and Considerations for Cybersecurity Risk Management (SP 800-61 Rev. 3)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
    note: 'Current incident response framework (CSF 2.0 community profile) covering detection, analysis, containment, and recovery—applicable to SIEM triage and escalation decisions.'
  },
  {
    title: 'Learn Common Kusto Query Language (KQL) Operators',
    org: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/kusto/query/tutorials/learn-common-operators',
    note: 'Kusto Query Language basics for filtering, sorting, and correlating events in log repositories—directly applicable to SIEM query workbench exercises.'
  },
  {
    title: 'MITRE ATT&CK — Lateral Movement',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0008/',
    note: 'Catalog of adversary techniques for moving across a network after initial compromise—helps analysts recognize multi-step attack chains in correlated events.'
  },
  {
    title: 'Common Log Format Fields',
    org: 'OWASP',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html',
    note: 'Standard log field definitions and normalization principles for consistent authentication, authorization, and action logging.'
  },
  {
    title: 'Security+ (SY0-701) Certification Overview & Objectives Summary',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Official certification page with exam domains, weightings, and a condensed objectives summary covering incident analysis and triage.'
  },
  {
    title: 'What Are Risk Detections? (Impossible Travel, Atypical Travel)',
    org: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks',
    note: 'Real-world implementation of geographic anomaly detection and impossible-travel velocity checks in identity systems.'
  },
];

const MODULE_THREE_ALERTS = [
  {
    id: 'ALR-2038',
    title: 'Service account used from an analyst workstation',
    severity: 'Medium',
    created: '02:10',
    source: 'Identity correlation',
    summary: 'A non-interactive reporting identity authenticated from a workstation outside its normal host pattern.',
    target: true,
  },
  {
    id: 'ALR-2039',
    title: 'New browser observed for an enrolled user',
    severity: 'Low',
    created: '02:18',
    source: 'Access telemetry',
    summary: 'The device was enrolled earlier in the shift and the source network matches the learner-services office.',
  },
  {
    id: 'ALR-2040',
    title: 'Collector heartbeat delayed',
    severity: 'Low',
    created: '02:22',
    source: 'Platform health',
    summary: 'The collector resumed after an approved patch window; no security-event gap remains.',
  },
  {
    id: 'ALR-2041',
    title: 'High-volume archive reads',
    severity: 'Medium',
    created: '02:25',
    source: 'Application audit',
    summary: 'A registered backup job read 1,240 objects from its assigned repository during its normal schedule.',
  },
];

const MODULE_THREE_LOGS = [
  { id: 'EVT-300', time: '02:03:12', source: 'AuthLog', event: 'SignInSuccess', account: 'patch-agent', host: 'MGMT-02', ip: '10.44.7.11', result: 'Allowed', detail: 'Approved patch identity authenticated to its registered management host.', relevant: false },
  { id: 'EVT-301', time: '02:05:40', source: 'AppAudit', event: 'ArchiveStart', account: 'backup-job', host: 'STORE-04', ip: '10.44.6.14', result: 'Started', detail: 'Scheduled repository archive began under change record CHG-442.', relevant: false },
  { id: 'EVT-302', time: '02:07:14', source: 'AuthLog', event: 'SignInFailed', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Bad password', detail: 'Interactive attempt from a host not registered to this service identity.', relevant: true },
  { id: 'EVT-303', time: '02:08:02', source: 'AuthLog', event: 'SignInFailed', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Bad password', detail: 'Second failed attempt from the same workstation and source address.', relevant: true },
  { id: 'EVT-304', time: '02:09:31', source: 'AuthLog', event: 'SignInSuccess', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Allowed', detail: 'Interactive authentication succeeded; normal service host is APP-RPT-02.', relevant: true },
  { id: 'EVT-305', time: '02:12:09', source: 'DirectoryAudit', event: 'GroupMemberAdded', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Report-Admins', detail: 'The same session added the service identity to a privileged reporting group.', relevant: true },
  { id: 'EVT-306', time: '02:15:46', source: 'AppAudit', event: 'ConfigurationExport', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Completed', detail: 'Reporting configuration was exported three minutes after the group change.', relevant: true },
  { id: 'EVT-307', time: '02:18:21', source: 'AuthLog', event: 'SignInSuccess', account: 'acct-11', host: 'LAP-114', ip: '10.44.8.91', result: 'Allowed', detail: 'Enrolled user signed in from the learner-services office network.', relevant: false },
  { id: 'EVT-308', time: '02:20:10', source: 'SystemLog', event: 'ServiceRestart', account: 'system', host: 'COLLECT-01', ip: '10.44.5.10', result: 'Healthy', detail: 'Collector restarted under the approved patch change and resumed forwarding.', relevant: false },
  { id: 'EVT-309', time: '02:24:03', source: 'AppAudit', event: 'ArchiveRead', account: 'backup-job', host: 'STORE-04', ip: '10.44.6.14', result: '1,240 objects', detail: 'Archive volume matches the job baseline and registered source host.', relevant: false },
];

const MODULE_THREE_RELEVANT_IDS = MODULE_THREE_LOGS.filter((row) => row.relevant).map((row) => row.id);
const MODULE_THREE_CORRECT_TIMELINE = ['EVT-302', 'EVT-303', 'EVT-304', 'EVT-305', 'EVT-306'];

const MODULE_THREE_DEFAULT_STATE = {
  openedAlert: '',
  activeSource: 'All sources',
  selectedEvidence: [],
  queryDraft: 'UnifiedEvents\n| where SourceIp == ""\n| sort by TimeGenerated asc',
  queryRuns: 0,
  queryPassed: false,
  queryResultIds: [],
  queryFeedback: '',
  timelineOrder: ['', '', '', '', ''],
  analysis: '',
  verdict: '',
  action: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
};

let moduleThreeState = null;
let moduleThreeUser = null;
let moduleThreeReviewMode = false;
let moduleThreeQuizState = null;

function moduleThreeLoad(user) {
  moduleThreeUser = user;
  moduleThreeState = LabRuntime.load(MODULE_THREE_LAB_ID, user, MODULE_THREE_DEFAULT_STATE);
  if (!Array.isArray(moduleThreeState.selectedEvidence)) moduleThreeState.selectedEvidence = [];
  if (!Array.isArray(moduleThreeState.queryResultIds)) moduleThreeState.queryResultIds = [];
  if (!Array.isArray(moduleThreeState.timelineOrder) || moduleThreeState.timelineOrder.length !== 5) {
    moduleThreeState.timelineOrder = ['', '', '', '', ''];
  }
  if (!Array.isArray(moduleThreeState.feedback)) moduleThreeState.feedback = [];
  if (!Array.isArray(moduleThreeState.flags)) moduleThreeState.flags = [];

  // Initialize quiz state
  if (!moduleThreeQuizState) {
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleThreeQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: 0,
      score: 0,
      bestScore: 0,
      feedback: [],
      passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-03');
  return moduleThreeState;
}

function moduleThreeSave() {
  if (moduleThreeUser && moduleThreeState) LabRuntime.save(MODULE_THREE_LAB_ID, moduleThreeUser, moduleThreeState);
}

function moduleThreeGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm03-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleThreeQuizState?.passed, scrollId: 'm03-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleThreeState.completed, scrollId: 'm03-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm03-review' },
  ];
}

function moduleThreeAlertTone(severity) {
  return `m03-severity m03-severity-${String(severity).toLowerCase()}`;
}

function moduleThreeVideoScript() {
  return `<details class="m03-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m03-script-body">
      <p><strong>Introduction:</strong> Welcome to the SIEM signal room. Modern security monitoring generates thousands of events per minute. Your job is not to watch every row—it's to recognize patterns that matter. Over the next 10 minutes, we'll explore how SIEMs turn noise into signal through normalization, chronological ordering, and careful correlation reasoning.</p>

      <p><strong>Segment 1 — What is a SIEM?</strong> A Security Information and Event Management system collects logs from across your environment: firewalls, identity systems, application servers, databases. Each system names authentication, access, and action events differently. A SIEM normalizes that diversity into shared fields: timestamp, user account, host, source IP, and outcome. This normalization is the foundation of correlation.</p>

      <p><strong>Segment 2 — Normalization in practice.</strong> Imagine three sign-in events. Windows logs it as EventID 4624 with fields "TargetUserName" and "IpAddress." A Linux server calls it "auth" with "user" and "src_ip." A cloud app sends JSON with "account" and "remote_ip." Identical concept, three different formats. Without normalization, a query for "user == 'jsmith'" will miss the Windows event because it uses "TargetUserName." The SIEM bridges this by normalizing all three into a single "Account" and "SourceIp" field, so one query finds all three events.</p>

      <p><strong>Segment 3 — Time as evidence.</strong> Chronological order matters because attack sequences tell stories. A failed sign-in by itself is noise. A sign-in failure, then a success, then a privilege escalation, then a data export—all within 10 minutes from the same source IP and account—is a chain of actions. Unsorted by time, this chain looks like random events. Sorted chronologically, it shows intent and progression.</p>

      <p><strong>Segment 4 — Correlation vs. coincidence.</strong> Two events at the same timestamp are not automatically correlated. A user's password failure and a different user's file deletion at 09:15 are coincidence, not a connected pattern. Correlation requires alignment on multiple dimensions: the same account, the same host, the same source IP, within a tight time window. The more dimensions align, the stronger the correlation signal and the lower the chance of coincidence.</p>

      <p><strong>Segment 5 — Querying for patterns.</strong> A SIEM query like "UnifiedEvents | where Account == 'jsmith' and Result == 'Failed' | sort by TimeGenerated asc" does three things: it narrows the data to one account and failed attempts, it sorts oldest-to-newest to show progression, and it gives you a coherent narrative instead of isolated anomalies. Without a SIEM query workbench, you'd be manually piecing together events from disparate logs.</p>

      <p><strong>Segment 6 — Triage and verdict.</strong> Once you've correlated events into a pattern, you make a verdict: is this a true attack (true positive), a real anomaly but non-malicious (benign positive), or a false alert? A successful multi-step privilege escalation with no authorized change request is a true positive requiring immediate escalation. A user who traveled internationally and accessed from multiple countries within hours, but has a corporate travel policy permitting it, is a benign positive: the alert worked, but the activity is approved.</p>

      <p><strong>Closing:</strong> SIEM correlation is detective work. Normalization gives you the common language. Time gives you the narrative. Shared entities and tight clustering give you confidence. Each alert is a door; your job is to open it, ask whether the evidence behind it belongs together, and decide whether the pattern demands escalation or closure.</p>
    </div>
  </details>`;
}

function moduleThreeFieldGuide() {
  const cards = [
    ['ri-database-2-line', 'Normalize before comparing', 'Different sources name similar facts differently. A SIEM maps them into shared fields such as time, account, host, source address, and outcome.'],
    ['ri-time-line', 'Treat time as evidence', 'Sort events before inferring a story. A failed sign-in, success, privilege change, and export mean more as a sequence than as isolated rows.'],
    ['ri-links-line', 'Correlate with restraint', 'Shared entities and a tight time window support a relationship. Similar timing alone does not prove that two records belong to the same activity.'],
  ];
  return `<div class="m03-guide-grid">
    ${cards.map((card) => `<article><i class="${esc(card[0])}" aria-hidden="true"></i><h3>${esc(card[1])}</h3><p>${esc(card[2])}</p></article>`).join('')}
  </div>
  <div class="m03-source-map">
    <div><strong>AuthLog</strong><span>Who authenticated, from where, and whether access succeeded.</span></div>
    <div><strong>DirectoryAudit</strong><span>Changes to identities, roles, and groups.</span></div>
    <div><strong>AppAudit</strong><span>Actions performed inside a protected application.</span></div>
    <div><strong>SystemLog</strong><span>Host and collector health that can explain telemetry gaps.</span></div>
  </div>`;
}

function moduleThreeLecture() {
  return `<section class="m03-lecture-section">
    <div class="m03-lecture-intro">
      <p><strong>What is log correlation?</strong> A SIEM collects thousands of events per minute—authentication attempts, access decisions, system actions. Individually, each event is a data point. Correlation links events across sources, time, and accounts to reveal patterns: did the same user fail then succeed? Did an escalation follow successful access? Did an export immediately follow a role change? Patterns reveal intent and risk.</p>
    </div>

    <h3>Log normalization: the foundation</h3>
    <p>Every system logs differently. Windows Event Logs use integer event IDs and structured XML. Linux syslog uses text with inconsistent field names. Cloud applications emit JSON with custom field labels. Without normalization, a single query like "show all authentication failures" would need to be rewritten three times, once per system, and a human analyst might miss events in formats they're unfamiliar with.</p>
    <p>A SIEM solves this by normalizing across sources. It reads "TargetUserName" (Windows), "user" (Linux), and "account" (cloud), and writes them all to a shared field called "Account." It reads "IpAddress," "src_ip," and "remote_ip," and normalizes to "SourceIp." Now a query like <code>| where Account == "jsmith"</code> finds jsmith's events in all three systems without requiring knowledge of their native field names.</p>
    <p><strong>Key shared fields:</strong> Timestamp (TimeGenerated), User Account, Source Host/IP, Destination Host/IP, Event Type, Result/Outcome, Source System (EventSource).</p>

    <h3>Chronological reasoning: attack progression</h3>
    <p>Attack chains unfold in time. A real compromise typically progresses through distinct phases: reconnaissance (probing, failed access), exploitation (successful access), escalation (privilege increase), and exfiltration (data access/export). When you sort events by timestamp from oldest to newest, this progression becomes visible. Sorted in reverse, it looks backwards—export before access—and the story vanishes.</p>
    <p>Example: An alert fires for "unusual privilege escalation." You query all events for that account. In reverse-time sort, you see export, escalation, success, failure, failure—which reads as "something happened, then other things." In time sort (oldest first), you see failure, failure, success, escalation, export—which reads as "attacker tried twice, succeeded, escalated, and exfiltrated." The same five events tell completely different stories depending on sort order.</p>

    <h3>Correlation vs. coincidence</h3>
    <p>Two events at the same timestamp are not automatically correlated. A user's failed password attempt at 09:15 and an unrelated system's reboot at 09:15 are coincidence—shared seconds, unrelated entities. Correlation requires agreement on multiple dimensions:</p>
    <ul>
      <li><strong>Entity overlap:</strong> Same user, same host, same source IP</li>
      <li><strong>Temporal clustering:</strong> Events within seconds or minutes, not hours or days</li>
      <li><strong>Technical chain:</strong> One event's result enables the next (failure → success → access → escalation)</li>
    </ul>
    <p>The more dimensions align, the stronger the correlation. A single shared field over days is weak. Five events from the same account, same source IP, within 10 minutes, is coherent. Tight clustering reduces the likelihood of coincidence and increases confidence in correlation.</p>

    <h3>Query-based exploration</h3>
    <p>A SIEM query workbench lets you ask questions of the normalized log store. KQL (Kusto Query Language) and similar systems support filtering, sorting, and aggregation. The basic pattern is:</p>
    <ul>
      <li><code>UnifiedEvents | where [condition] | sort by TimeGenerated asc</code></li>
    </ul>
    <p>This syntax: start with the event table, filter to relevant events, sort oldest-to-newest. Common filters: <code>Account == "user"</code>, <code>Result == "Failed"</code>, <code>SourceIp == "10.0.0.1"</code>, <code>TimeGenerated > ago(1h)</code> (past hour). Sorting ascending reveals progression; descending shows recent activity first but obscures causality.</p>

    <h3>Alert verdict: true, benign, or false?</h3>
    <p>An alert is a signal that something anomalous was detected. But anomalous ≠ malicious. After correlation reveals the pattern, you assess the verdict:</p>
    <ul>
      <li><strong>True positive:</strong> The alert is correct, and the activity is unauthorized or malicious. Example: privilege escalation with no change request, followed by sensitive data access.</li>
      <li><strong>Benign positive:</strong> The alert is correct (anomaly detected), but the activity is explained by legitimate context. Example: user traveled internationally and accessed from multiple locations within hours, but company travel policy permits this.</li>
      <li><strong>False positive:</strong> The alert fired, but no actual anomaly occurred. Example: a scheduled maintenance job that looks unusual but has a documented change record.</li>
    </ul>
    <p>Correlation + context = verdict. Never assume anomaly equals attack.</p>
  </section>`;
}

function moduleThreeQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleThreeQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m03-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m03-quiz-options">
      ${selected.shuffledOptions.map((option, optIndex) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m03-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function moduleThreeQuizPanel() {
  if (!moduleThreeQuizState?.selectedQuestions || moduleThreeQuizState.selectedQuestions.length === 0) {
    return `<div class="m03-quiz-empty" id="m03-quiz-feedback" role="status">Loading quiz...</div>`;
  }

  const selected = moduleThreeQuizState.selectedQuestions;
  const answered = Object.keys(moduleThreeQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleThreeQuizState.scored) {
    const passed = moduleThreeQuizState.score >= 70;
    feedbackHtml = `<section class="m03-quiz-score ${passed ? 'm03-quiz-pass' : 'm03-quiz-remediate'}" id="m03-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m03-quiz-score-heading">
        <div>
          <p class="m03-kicker">Attempt ${moduleThreeQuizState.attempts} · best ${moduleThreeQuizState.bestScore}/100</p>
          <h3>${moduleThreeQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleThreeQuizState.score}</span>
      </div>
      <ul class="m03-quiz-feedback-list">
        ${(moduleThreeQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm03-quiz-feedback-correct' : 'm03-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m03-quiz-actions"><button type="button" class="m03-quiz-retry" data-m03-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m03-quiz-ready" id="m03-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m03-quiz-empty" id="m03-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m03-quiz-form" id="m03-quiz-form" novalidate>
    <div class="m03-panel-heading"><div><p class="m03-kicker">Knowledge check</p><h3 id="m03-quiz-title" tabindex="-1">Test your understanding of SIEM correlation concepts</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleThreeQuizQuestion(sel, idx)).join('')}
    <div class="m03-quiz-actions">
      <button class="m03-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleThreeQueue() {
  return `<section class="m03-console-panel m03-queue-panel" aria-labelledby="m03-queue-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 1 · Alert orientation</p><h3 id="m03-queue-title" tabindex="-1">Compact alert queue</h3></div>
      <span class="m03-panel-count">4 current alerts</span>
    </div>
    <p class="m03-panel-instruction">ALR-2038 is assigned to you. The nearby rows are realistic queue context, not evidence from a shared storyline.</p>
    <div class="m03-alert-list">
      ${MODULE_THREE_ALERTS.map((alert) => {
        const isOpen = moduleThreeState.openedAlert === alert.id;
        return `<article class="m03-alert-row ${isOpen ? 'is-open' : ''}">
          <div class="m03-alert-id"><span class="${moduleThreeAlertTone(alert.severity)}">${esc(alert.severity)}</span><code>${esc(alert.id)}</code></div>
          <div><h4>${esc(alert.title)}</h4><p>${esc(alert.summary)}</p><small>${esc(alert.created)} · ${esc(alert.source)}</small></div>
          <button type="button" data-m03-alert="${esc(alert.id)}" aria-label="${isOpen ? 'Review' : 'Open'} ${esc(alert.id)}: ${esc(alert.title)}">${isOpen ? 'Reviewing' : 'Open'}</button>
        </article>`;
      }).join('')}
    </div>
    ${moduleThreeState.openedAlert ? moduleThreeAlertBrief() : `<div class="m03-coach-note"><i class="ri-user-voice-line" aria-hidden="true"></i><p><strong>Assisted prompt:</strong> Open the assigned alert, then use shared fields—not the title alone—to decide what belongs in its timeline.</p></div>`}
  </section>`;
}

function moduleThreeAlertBrief() {
  const alert = MODULE_THREE_ALERTS.find((item) => item.id === moduleThreeState.openedAlert);
  if (!alert) return '';
  if (!alert.target) {
    return `<div class="m03-alert-brief is-context" role="status">
      <i class="ri-information-line" aria-hidden="true"></i>
      <div><strong>${esc(alert.id)} is useful queue context.</strong><p>${esc(alert.summary)} Return to assigned alert ALR-2038 to perform the correlation exercise.</p></div>
    </div>`;
  }
  return `<div class="m03-alert-brief" role="status">
    <i class="ri-focus-3-line" aria-hidden="true"></i>
    <div><strong>Working question</strong><p>Was <code>svc_reports</code> performing normal service activity, or does the multi-source sequence justify escalation? Start with the source address <code>10.44.8.23</code> and a twenty-minute window.</p></div>
  </div>`;
}

function moduleThreeLogTable(rows) {
  const selected = new Set(moduleThreeState.selectedEvidence);
  return `<div class="m03-table-wrap">
    <table class="m03-log-table">
      <caption class="m03-visually-hidden">Synthetic normalized SIEM events available for evidence selection</caption>
      <thead><tr><th scope="col">Evidence</th><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Event</th><th scope="col">Account</th><th scope="col">Host</th><th scope="col">Source IP</th><th scope="col">Result</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr class="${selected.has(row.id) ? 'is-selected' : ''}">
          <td data-label="Evidence"><label class="m03-evidence-check"><input type="checkbox" data-m03-evidence value="${esc(row.id)}" ${selected.has(row.id) ? 'checked' : ''} /><span>${esc(row.id)}</span></label></td>
          <td data-label="Time"><time>${esc(row.time)}</time></td>
          <td data-label="Source"><span class="m03-source-pill">${esc(row.source)}</span></td>
          <td data-label="Event"><button type="button" class="m03-event-detail" data-m03-log-detail="${esc(row.id)}" aria-label="Show details for ${esc(row.id)}">${esc(row.event)}</button></td>
          <td data-label="Account"><code>${esc(row.account)}</code></td>
          <td data-label="Host"><code>${esc(row.host)}</code></td>
          <td data-label="Source IP"><code>${esc(row.ip)}</code></td>
          <td data-label="Result">${esc(row.result)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function moduleThreeExplorer() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') {
    return `<section class="m03-console-panel m03-locked" aria-label="Log explorer locked">
      <i class="ri-lock-line" aria-hidden="true"></i><div><strong>Log explorer</strong><p>Open assigned alert ALR-2038 to load its twenty-minute search window.</p></div>
    </section>`;
  }
  const sources = ['All sources', 'AuthLog', 'DirectoryAudit', 'AppAudit', 'SystemLog'];
  const visibleRows = moduleThreeState.activeSource === 'All sources'
    ? MODULE_THREE_LOGS
    : MODULE_THREE_LOGS.filter((row) => row.source === moduleThreeState.activeSource);
  const detail = MODULE_THREE_LOGS.find((row) => row.id === moduleThreeState.detailEvent);
  return `<section class="m03-console-panel" aria-labelledby="m03-explorer-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 2 · Observe</p><h3 id="m03-explorer-title">Normalized log explorer</h3></div>
      <span class="m03-panel-count"><span data-m03-selected-count>${moduleThreeState.selectedEvidence.length}</span>/5 evidence rows selected</span>
    </div>
    <p class="m03-panel-instruction">Compare account, host, source address, and time. Select exactly five rows that form the strongest correlated sequence; benign maintenance and user activity are mixed in.</p>
    <div class="m03-source-tabs" role="group" aria-label="Filter log source">
      ${sources.map((source) => `<button type="button" data-m03-source="${esc(source)}" aria-pressed="${moduleThreeState.activeSource === source}">${esc(source)}</button>`).join('')}
    </div>
    ${moduleThreeLogTable(visibleRows)}
    ${detail ? `<aside class="m03-row-detail" id="m03-row-detail" tabindex="-1" aria-label="Selected event details"><button type="button" data-m03-detail-close aria-label="Close event details"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m03-kicker">${esc(detail.id)} · ${esc(detail.source)}</p><strong>${esc(detail.event)}</strong><p>${esc(detail.detail)}</p></aside>` : ''}
  </section>`;
}

function moduleThreeRunQuery(query) {
  const text = String(query || '');
  const tableOk = /^\s*UnifiedEvents\b/i.test(text);
  const ipMatch = text.match(/where\s+SourceIp\s*==\s*["']([^"']+)["']/i);
  const requestedIp = ipMatch ? ipMatch[1] : '';
  const filterOk = requestedIp === '10.44.8.23';
  const sortOk = /\|\s*(?:sort|order)\s+by\s+TimeGenerated\s+asc\b/i.test(text);
  let rows = tableOk ? MODULE_THREE_LOGS.slice() : [];
  if (requestedIp) rows = rows.filter((row) => row.ip === requestedIp);
  if (sortOk) rows.sort((left, right) => left.time.localeCompare(right.time));
  return { tableOk, filterOk, sortOk, rows, passed: tableOk && filterOk && sortOk && rows.length === 5 };
}

function moduleThreeQueryResults() {
  if (!moduleThreeState.queryRuns) {
    return `<div class="m03-query-empty" id="m03-query-feedback" role="status">Run the query when the table, filter value, and chronological sort are ready.</div>`;
  }
  const rows = MODULE_THREE_LOGS.filter((row) => moduleThreeState.queryResultIds.includes(row.id));
  return `<div class="m03-query-feedback ${moduleThreeState.queryPassed ? 'is-pass' : 'is-hint'}" id="m03-query-feedback" role="status" tabindex="-1">
    <strong>${moduleThreeState.queryPassed ? 'Query objective met' : 'Query needs refinement'}</strong>
    <p>${esc(moduleThreeState.queryFeedback)}</p>
  </div>
  ${rows.length ? `<ol class="m03-query-results" aria-label="Query results">${rows.map((row) => `<li><time>${esc(row.time)}</time><span>${esc(row.event)}</span><code>${esc(row.account)}</code><code>${esc(row.ip)}</code></li>`).join('')}</ol>` : ''}`;
}

function moduleThreeQueryWorkbench() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') return '';
  return `<section class="m03-console-panel m03-query-panel" aria-labelledby="m03-query-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 3 · Query</p><h3 id="m03-query-title">Correlation query workbench</h3></div>
      <span class="m03-panel-count">Runs saved: ${moduleThreeState.queryRuns}</span>
    </div>
    <div class="m03-query-layout">
      <div>
        <label for="m03-query-editor">Filter <code>UnifiedEvents</code> to the alert source IP and sort oldest first.</label>
        <textarea id="m03-query-editor" name="queryDraft" rows="5" spellcheck="false" aria-describedby="m03-query-help">${esc(moduleThreeState.queryDraft)}</textarea>
        <p id="m03-query-help">Supported subset: a table name, <code>where SourceIp == "value"</code>, and <code>sort by TimeGenerated asc</code>. Five rows should remain.</p>
        <button type="button" class="m03-run-query" data-m03-run-query><i class="ri-play-circle-line" aria-hidden="true"></i> Run local query</button>
      </div>
      <details class="m03-query-hint">
        <summary>Need a syntax hint?</summary>
        <p>Keep the first and last lines. Put the source address from the alert brief between the empty quotation marks on the middle line.</p>
      </details>
    </div>
    ${moduleThreeQueryResults()}
  </section>`;
}

function moduleThreeTimelineOptions(selectedId) {
  return `<option value="">Choose an event</option>${MODULE_THREE_RELEVANT_IDS.map((id) => {
    const row = MODULE_THREE_LOGS.find((item) => item.id === id);
    return `<option value="${esc(id)}" ${selectedId === id ? 'selected' : ''}>${esc(id)} · ${esc(row.time)} · ${esc(row.event)}</option>`;
  }).join('')}`;
}

function moduleThreeOptionList(name, options) {
  return `<div class="m03-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleThreeState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleThreeScorePanel() {
  if (moduleThreeState.validationError) {
    return `<div class="m03-validation" id="m03-score-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the investigation record</strong><p>${esc(moduleThreeState.validationError)}</p></div></div>`;
  }
  if (!moduleThreeState.attempts || !moduleThreeState.breakdown) {
    return `<div class="m03-score-empty" id="m03-score-feedback" role="status">Your submission is scored on observation (30), analysis (25), decision (25), and communication (20). Passing score: ${MODULE_THREE_PASSING_SCORE}.</div>`;
  }
  const b = moduleThreeState.breakdown;
  const passed = moduleThreeState.score >= MODULE_THREE_PASSING_SCORE;
  return `<section class="m03-score ${passed ? 'is-pass' : 'is-remediate'}" id="m03-score-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m03-score-title">
    <div class="m03-score-heading"><div><p class="m03-kicker">Attempt ${moduleThreeState.attempts} · best ${moduleThreeState.bestScore}/100</p><h3 id="m03-score-title">${moduleThreeState.score}/100 — ${passed ? 'SIEM correlation complete' : 'Review, refine, and retry'}</h3></div><span>${moduleThreeState.score}</span></div>
    <div class="m03-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/30</strong><span>Observation</span><small>${b.evidence}/20 evidence · ${b.query}/10 query</small></div>
      <div><strong>${b.analysis}/25</strong><span>Analysis</span><small>${b.timeline}/10 timeline · ${b.interpretation}/15 meaning</small></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span><small>${b.verdict}/15 verdict · ${b.action}/10 next step</small></div>
      <div><strong>${b.communication}/20</strong><span>Communication</span><small>Length, evidence, and recommendation</small></div>
    </div>
    <ul class="m03-feedback-list">${moduleThreeState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m03-expert-model"><strong>Expert correlation</strong><p>The two failed attempts establish a lead, but the successful interactive sign-in is the pivot. The same account, workstation, and source address then appear in a privileged group change and a configuration export within six minutes. That tight entity-and-time chain outweighs the unrelated maintenance and backup rows and supports escalation as suspicious service-account misuse.</p></div>
  </section>`;
}

function moduleThreeArtifact() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') return '';
  const analysisOptions = [
    { id: 'correlated-misuse', label: 'One correlated service-account misuse sequence', help: 'The account, workstation, source IP, and short time window connect the events.' },
    { id: 'approved-maintenance', label: 'Approved maintenance activity', help: 'The patch and collector events have change context, but they use different entities.' },
    { id: 'unrelated-noise', label: 'Five unrelated records that only share a time window', help: 'This ignores the repeated account, host, and source address.' },
  ];
  const verdictOptions = [
    { id: 'true-positive', label: 'True positive — suspicious service-account use', help: 'The alert is supported by a coherent multi-source sequence.' },
    { id: 'benign-positive', label: 'Benign positive — expected job behavior', help: 'This would require matching approved scope, host, and change context.' },
    { id: 'false-positive', label: 'False positive — the activity did not occur', help: 'The underlying authentication and audit records are present.' },
  ];
  const actionOptions = [
    { id: 'escalate-preserve', label: 'Escalate as High, preserve the five events, and request service-owner validation', help: 'This stays inside the evidence and gives the responder a proportional next step.' },
    { id: 'close-backup', label: 'Close the alert as the registered backup job', help: 'The backup rows have different account, host, and source address values.' },
    { id: 'block-subnet', label: 'Block the entire 10.44.8.0/24 subnet immediately', help: 'The evidence supports one workstation and account, not a disruptive subnet-wide action.' },
  ];
  return `<section class="m03-console-panel m03-artifact" aria-labelledby="m03-artifact-title">
    <div class="m03-panel-heading"><div><p class="m03-kicker">Steps 4–5 · Analyze, decide, communicate</p><h3 id="m03-artifact-title">Build the analyst handoff</h3></div><span class="m03-panel-count">Retry allowed · no timer</span></div>
    <form id="m03-assessment" novalidate>
      <fieldset class="m03-fieldset">
        <legend><span>4A</span> Put the five correlated events in chronological order</legend>
        <p class="m03-help">Each event may be used once. This timeline becomes the spine of your explanation.</p>
        <div class="m03-timeline-builder">
          ${moduleThreeState.timelineOrder.map((id, index) => `<label><span>${index + 1}</span><select name="timeline-${index}" data-m03-timeline="${index}" aria-label="Timeline position ${index + 1}">${moduleThreeTimelineOptions(id)}</select></label>`).join('')}
        </div>
      </fieldset>
      <fieldset class="m03-fieldset"><legend><span>4B</span> What does the sequence mean?</legend>${moduleThreeOptionList('analysis', analysisOptions)}</fieldset>
      <fieldset class="m03-fieldset"><legend><span>5A</span> What is your alert verdict?</legend>${moduleThreeOptionList('verdict', verdictOptions)}</fieldset>
      <fieldset class="m03-fieldset"><legend><span>5B</span> What is the safest next step?</legend>${moduleThreeOptionList('action', actionOptions)}</fieldset>
      <div class="m03-fieldset">
        <label class="m03-note-label" for="m03-case-note"><span>5C</span><strong>Write the handoff note</strong></label>
        <p class="m03-help" id="m03-note-help">In at least 80 characters, identify the alert or entity, summarize the correlated sequence, and state your recommended action.</p>
        <textarea id="m03-case-note" name="notes" rows="5" maxlength="900" aria-describedby="m03-note-help m03-note-count" placeholder="ALR-2038: Correlation shows… The shared account, host, and source address… Recommend…">${esc(moduleThreeState.notes)}</textarea>
        <p class="m03-note-count" id="m03-note-count"><span>${moduleThreeState.notes.length}</span>/900 characters</p>
      </div>
      <div class="m03-actions"><button type="submit" class="m03-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my handoff</button><button type="button" class="m03-reset" data-m03-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>
      ${moduleThreeScorePanel()}
    </form>
  </section>`;
}

function moduleThreeLabDynamic() {
  return `${moduleThreeQueue()}${moduleThreeExplorer()}${moduleThreeQueryWorkbench()}${moduleThreeArtifact()}`;
}

function moduleThreeReview() {
  return `<section class="m03-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Log normalization:</strong> SIEM systems map diverse source formats to shared fields (timestamp, account, host, IP, result) so a single query finds events across all systems.</li>
      <li><strong>Chronological ordering:</strong> Attack sequences progress from reconnaissance through exploitation, escalation, and exfiltration. Time-sorted events reveal this progression; reverse-sorted, it's hidden.</li>
      <li><strong>Correlation vs. coincidence:</strong> Temporal overlap alone is coincidence. Correlation requires agreement on multiple dimensions: same account, same source IP, tight time window, technical chain.</li>
      <li><strong>KQL-style queries:</strong> A SIEM query workbench (filtering, sorting, and aggregation) turns raw events into coherent patterns without manual transcription across disparate systems.</li>
      <li><strong>Alert triage verdicts:</strong> True positive (anomaly + malice), benign positive (anomaly + legitimate context), or false positive (no anomaly). Never assume anomaly equals attack.</li>
      <li><strong>Shared entities and timing:</strong> The same user, host, or IP address appearing in multiple events within a narrow time window is a correlation signal. Days apart or different entities = weaker signal.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now understand how SIEM logs are structured, normalized, and queried to support alert triage and incident investigation. In the field, you will read thousands of events and need to sort signal from noise. Remember: normalization bridges format diversity, time reveals sequence, and correlation requires alignment on multiple dimensions, not just coincidental timing.</p>
  </section>`;
}

function viewModuleThree(user, program) {
  moduleThreeLoad(user);
  const complete = moduleThreeState.completed === true;
  const module = program.modules['soc-03'];
  const moduleLab = LABS.find((item) => item.key === MODULE_THREE_CATALOG_LAB_KEY);
  const sections = moduleThreeGetSections();
  const lectureOpen = moduleThreeReviewMode || !sections[0].isComplete;
  const quizOpen = moduleThreeReviewMode || (moduleThreeQuizState && !moduleThreeQuizState.passed);
  const labOpen = moduleThreeReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleThreeReviewMode;

  const lectureSection = `
    <details class="m03-section-collapsible" ${lectureOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-lecture" aria-labelledby="m03-lecture-title">
          <div class="m03-section-heading"><span>1</span><div><p class="m03-kicker">Core concepts and practice</p><h2 id="m03-lecture-title">Log normalization, correlation, and triage</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-lecture-title">
        ${moduleThreeVideoScript()}
        ${moduleThreeLecture()}
        ${moduleThreeFieldGuide()}
      </section>
    </details>`;

  const quizSection = `
    <details class="m03-section-collapsible" ${quizOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-knowledge-check" aria-labelledby="m03-quiz-title">
          <div class="m03-section-heading"><span>2</span><div><p class="m03-kicker">Interactive knowledge check</p><h2 id="m03-quiz-title">Test your understanding of SIEM correlation</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-quiz-title"><div id="m03-quiz-dynamic">${moduleThreeQuizPanel()}</div></section>
    </details>`;

  const labSection = `
    <details class="m03-section-collapsible" ${labOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section m03-lab-section" id="m03-lab" aria-labelledby="m03-lab-title">
          <div class="m03-section-heading"><span>3</span><div><p class="m03-kicker">${formatInstructionalMinutes(moduleLab.instructionalMinutes)} instructional lab</p><h2 id="m03-lab-title">Signal room: service-account correlation</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body m03-lab-section" aria-labelledby="m03-lab-title">
        <div class="m03-runbook" aria-label="Assisted investigation runbook"><div><span>1</span>Open assigned alert</div><div><span>2</span>Select evidence</div><div><span>3</span>Run the query</div><div><span>4</span>Build timeline</div><div><span>5</span>Write handoff</div></div>
        <div class="m03-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This surface contains one fictional case and the records needed to assess it. It does not expose another module, an enterprise environment, or a future incident storyline.</p></div>
        <div id="m03-lab-dynamic">${moduleThreeLabDynamic()}</div>
      </section>
    </details>`;

  const reviewSection = `
    <details class="m03-section-collapsible" ${reviewOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-review" aria-labelledby="m03-review-title">
          <div class="m03-section-heading"><span>4</span><div><p class="m03-kicker">Concept recap</p><h2 id="m03-review-title">Module review and takeaways</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-review-title">${moduleThreeReview()}</section>
    </details>`;

  const sourcesSection = `
    <details class="m03-section-collapsible" ${moduleThreeReviewMode ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-sources" aria-labelledby="m03-sources-title">
          <div class="m03-section-heading"><span>5</span><div><p class="m03-kicker">Supporting resources</p><h2 id="m03-sources-title">Further reading on SIEM and correlation</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-sources-title">${moduleSourcesBlock(MODULE_THREE_SOURCES)}</section>
    </details>`;

  return `<div class="m03-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleThreeReviewMode })}
    <main class="m03-main">
      <section class="m03-hero" aria-labelledby="m03-title">
        <div><p class="m03-kicker">Module 03 · ${formatInstructionalMinutes(module.durationMinutes)} · assisted investigation</p><h1 id="m03-title">${esc(module.title)}</h1><p>Use normalized telemetry to separate a suspicious service-account sequence from believable operational noise, then explain the evidence as a defensible analyst handoff.</p><a href="#m03-lecture" class="m03-hero-action"><i class="ri-compass-3-line" aria-hidden="true"></i> Start the lecture</a></div>
        <dl class="m03-status" aria-label="Saved lab status"><div><dt>Primary objective</dt><dd>Correlate one alert</dd></div><div><dt>Dataset</dt><dd>10 events · 4 sources</dd></div><div><dt>Status</dt><dd id="m03-status">${complete ? 'Complete' : moduleThreeState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="m03-objective" aria-labelledby="m03-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m03-kicker">One measurable objective</p><h2 id="m03-objective-title">Correlate a suspicious alert into an accurate timeline and justify a proportionate triage decision with at least ${MODULE_THREE_PASSING_SCORE}/100.</h2></div></section>

      ${lectureSection}
      ${quizSection}
      ${labSection}
      ${reviewSection}
      ${sourcesSection}
    </main>
  </div>`;
}

function moduleThreeScore() {
  const correctEvidenceCount = moduleThreeState.selectedEvidence.filter((id) => MODULE_THREE_RELEVANT_IDS.includes(id)).length;
  const evidence = correctEvidenceCount * 4;
  const query = moduleThreeState.queryPassed ? 10 : 0;
  const timelineMatches = moduleThreeState.timelineOrder.filter((id, index) => id === MODULE_THREE_CORRECT_TIMELINE[index]).length;
  const timeline = timelineMatches * 2;
  const interpretation = moduleThreeState.analysis === 'correlated-misuse' ? 15 : 0;
  const verdict = moduleThreeState.verdict === 'true-positive' ? 15 : 0;
  const action = moduleThreeState.action === 'escalate-preserve' ? 10 : 0;
  const note = moduleThreeState.notes.trim().toLowerCase();
  const noteLength = note.length >= 80 ? 8 : 0;
  const noteEvidence = /(alr-2038|svc_reports|10\.44\.8\.23)/.test(note) && /(sign.?in|auth|group|privileg|export)/.test(note) ? 6 : 0;
  const noteDecision = /(escalat|preserv|validat|true positive|high)/.test(note) ? 6 : 0;
  const communication = noteLength + noteEvidence + noteDecision;
  const observation = evidence + query;
  const analysis = timeline + interpretation;
  const decision = verdict + action;
  const score = observation + analysis + decision + communication;
  return {
    score,
    breakdown: { evidence, query, observation, timeline, interpretation, analysis, verdict, action, decision, communication },
    feedback: [
      evidence === 20 ? 'Observation: All five source-matched events were selected; operational distractors were excluded.' : `Observation: ${correctEvidenceCount}/5 decisive events were selected. Match account, host, source IP, and the 02:07–02:15 window; exclude rows with other entities.`,
      query ? 'Query: Correct. The source-address filter returned five rows in chronological order.' : 'Query: Filter UnifiedEvents to SourceIp 10.44.8.23 and sort TimeGenerated ascending; run it before resubmitting.',
      timeline === 10 ? 'Timeline: Correct. Failed attempts precede success, followed by the group change and export.' : `Timeline: ${timelineMatches}/5 positions are correct. Sort the five evidence rows by their timestamps, oldest first.`,
      interpretation ? 'Analysis: Correct. Repeated shared entities and tight timing support one correlated misuse sequence.' : 'Analysis: The patch, collector, enrolled-user, and backup rows use different entities. The five svc_reports rows form the connected sequence.',
      verdict && action ? 'Decision: Correct. A true-positive escalation preserves evidence and seeks authorized service-owner validation.' : 'Decision: Classify the supported activity as a true positive and escalate the narrow account-and-workstation scope with preserved evidence.',
      communication === 20 ? 'Communication: The note identifies the case, describes evidence, and states a recommendation.' : 'Communication: Include a case/entity identifier, the authentication-to-privilege/export sequence, and an escalation or preservation recommendation in at least 80 characters.',
    ],
  };
}

function moduleThreeRenderDynamic(focusId) {
  const root = document.getElementById('m03-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleThreeLabDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleThreeLab() {
  const root = document.getElementById('m03-lab-dynamic');
  if (!root || !moduleThreeState) return;

  root.addEventListener('click', (event) => {
    const alertButton = event.target.closest('[data-m03-alert]');
    if (alertButton) {
      moduleThreeState.openedAlert = alertButton.dataset.m03Alert;
      moduleThreeState.detailEvent = '';
      moduleThreeState.validationError = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-queue-title');
      return;
    }

    const sourceButton = event.target.closest('[data-m03-source]');
    if (sourceButton) {
      moduleThreeState.activeSource = sourceButton.dataset.m03Source;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-explorer-title');
      return;
    }

    const detailButton = event.target.closest('[data-m03-log-detail]');
    if (detailButton) {
      moduleThreeState.detailEvent = detailButton.dataset.m03LogDetail;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-row-detail');
      return;
    }

    if (event.target.closest('[data-m03-detail-close]')) {
      moduleThreeState.detailEvent = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-explorer-title');
      return;
    }

    if (event.target.closest('[data-m03-run-query]')) {
      const editor = root.querySelector('#m03-query-editor');
      moduleThreeState.queryDraft = editor ? editor.value : moduleThreeState.queryDraft;
      const result = moduleThreeRunQuery(moduleThreeState.queryDraft);
      moduleThreeState.queryRuns += 1;
      moduleThreeState.queryPassed = result.passed;
      moduleThreeState.queryResultIds = result.rows.map((row) => row.id);
      const missing = [];
      if (!result.tableOk) missing.push('start with UnifiedEvents');
      if (!result.filterOk) missing.push('filter SourceIp to 10.44.8.23');
      if (!result.sortOk) missing.push('sort TimeGenerated ascending');
      moduleThreeState.queryFeedback = result.passed
        ? 'Five events share the alert source address. Their order shows failures, success, privilege change, and export.'
        : `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned. Next: ${missing.join('; ') || 'review the supported syntax'}.`;
      moduleThreeState.validationError = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-query-feedback');
      return;
    }

    if (event.target.closest('[data-m03-reset]')) {
      if (!window.confirm('Reset only the Module 03 SIEM lab? Course progress and other labs will not be changed.')) return;
      moduleThreeState = LabRuntime.reset(MODULE_THREE_LAB_ID, moduleThreeUser, MODULE_THREE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY, false);
      const status = document.getElementById('m03-status');
      if (status) status.textContent = 'Not started';
      moduleThreeRenderDynamic('m03-queue-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m03-evidence]')) {
      const next = new Set(moduleThreeState.selectedEvidence);
      if (input.checked) next.add(input.value); else next.delete(input.value);
      moduleThreeState.selectedEvidence = [...next];
      moduleThreeState.validationError = '';
      moduleThreeSave();
      root.querySelectorAll('[data-m03-selected-count]').forEach((node) => { node.textContent = String(moduleThreeState.selectedEvidence.length); });
      input.closest('tr')?.classList.toggle('is-selected', input.checked);
      return;
    }
    if (input.matches('[data-m03-timeline]')) {
      moduleThreeState.timelineOrder[Number(input.dataset.m03Timeline)] = input.value;
      moduleThreeState.validationError = '';
      moduleThreeSave();
      return;
    }
    if (['analysis', 'verdict', 'action'].includes(input.name)) {
      moduleThreeState[input.name] = input.value;
      moduleThreeState.validationError = '';
      moduleThreeSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'queryDraft') {
      moduleThreeState.queryDraft = event.target.value;
      moduleThreeState.queryPassed = false;
      moduleThreeState.queryResultIds = [];
      moduleThreeState.queryFeedback = '';
      moduleThreeSave();
      return;
    }
    if (event.target.name === 'notes') {
      moduleThreeState.notes = event.target.value;
      const count = root.querySelector('#m03-note-count span');
      if (count) count.textContent = String(moduleThreeState.notes.length);
      moduleThreeSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm03-assessment') return;
    event.preventDefault();
    moduleThreeState.notes = event.target.elements.notes.value;
    const uniqueTimeline = new Set(moduleThreeState.timelineOrder.filter(Boolean));
    const missingDecisions = ['analysis', 'verdict', 'action'].filter((name) => !moduleThreeState[name]);
    const problems = [];
    if (moduleThreeState.selectedEvidence.length !== 5) problems.push('select exactly five evidence rows');
    if (!moduleThreeState.queryRuns) problems.push('run the correlation query at least once');
    if (uniqueTimeline.size !== 5) problems.push('use five different events in the timeline');
    if (missingDecisions.length) problems.push('answer all three analysis and decision questions');
    if (moduleThreeState.notes.trim().length < 80) problems.push('write a handoff note of at least 80 characters');
    if (problems.length) {
      moduleThreeState.validationError = `Before scoring, ${problems.join('; ')}.`;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-score-feedback');
      return;
    }

    const result = moduleThreeScore();
    moduleThreeState.attempts += 1;
    moduleThreeState.score = result.score;
    moduleThreeState.bestScore = Math.max(moduleThreeState.bestScore || 0, result.score);
    moduleThreeState.breakdown = result.breakdown;
    moduleThreeState.feedback = result.feedback;
    moduleThreeState.validationError = '';
    moduleThreeState.lastSubmittedAt = new Date().toISOString();
    const passed = result.score >= MODULE_THREE_PASSING_SCORE;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleThreeUser, MODULE_THREE_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleThreeState.attempts },
      });
    }
    if (passed) {
      moduleThreeState.completed = true;
      if (!moduleThreeState.flags.includes(MODULE_THREE_FLAG)) moduleThreeState.flags.push(MODULE_THREE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY);
    }
    moduleThreeSave();
    const status = document.getElementById('m03-status');
    if (status) status.textContent = moduleThreeState.completed ? 'Complete' : 'In progress';
    moduleThreeRenderDynamic('m03-score-feedback');
  });
}

function moduleThreeRenderQuiz(focusId) {
  const root = document.getElementById('m03-quiz-dynamic');
  if (!root) return;
  root.innerHTML = moduleThreeQuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleThreeQuiz() {
  const quizForm = document.getElementById('m03-quiz-form');
  if (!quizForm) return;

  quizForm.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m03-quiz-answer]')) {
      const radioGroup = input.getAttribute('name');
      const questionId = radioGroup.replace('q-', '');
      moduleThreeQuizState.answers[questionId] = input.value;
    }
  });

  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Score the quiz
    const result = scoreQuizAttempt(
      moduleThreeQuizState.selectedQuestions,
      moduleThreeQuizState.questionsByAnswer,
      moduleThreeQuizState.answers
    );

    moduleThreeQuizState.attempts += 1;
    moduleThreeQuizState.score = result.score;
    moduleThreeQuizState.bestScore = Math.max(moduleThreeQuizState.bestScore || 0, result.score);
    moduleThreeQuizState.feedback = result.feedback;
    moduleThreeQuizState.scored = true;
    moduleThreeQuizState.passed = result.score >= 70;

    // On failure, remember this attempt's question ids so "Try different
    // questions" can steer clear of them — but keep this attempt's scored
    // results on screen until the student chooses to retry.
    if (!moduleThreeQuizState.passed) {
      moduleThreeState.lastQuizQuestionIds = moduleThreeQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleThreeSave();
    moduleThreeRenderQuiz('m03-quiz-feedback');
  });

  quizForm.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m03-quiz-retry]')) return;
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleThreeQuizState.selectedQuestions = selection.selectedQuestions;
    moduleThreeQuizState.questionsByAnswer = selection.questionsByAnswer;
    moduleThreeQuizState.answers = {};
    moduleThreeQuizState.scored = false;
    moduleThreeRenderQuiz('m03-quiz-title');
  });
}

function wireModuleThree() {
  /* Wire the progress shell review toggle */
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleThreeReviewMode = !moduleThreeReviewMode;

      /* Update all collapsible sections */
      document.querySelectorAll('.m03-section-collapsible').forEach((details) => {
        details.open = moduleThreeReviewMode;
      });

      /* Update the button state */
      reviewToggle.setAttribute('aria-pressed', moduleThreeReviewMode.toString());
      const icon = reviewToggle.querySelector('i');
      const text = reviewToggle.querySelector('span') || reviewToggle;
      if (icon) {
        icon.className = moduleThreeReviewMode ? 'ri-eye-off-line' : 'ri-eye-line';
      }
      if (text && text !== reviewToggle) {
        text.textContent = moduleThreeReviewMode ? 'Exit Review' : 'Review Module';
      }
    });
  }

  wireModuleThreeQuiz();
  wireModuleThreeLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 3, moduleKey: 'soc-03',
  view: viewModuleThree, wire: wireModuleThree });

/* Module 03 — assisted SIEM alert triage and log correlation.
 * All telemetry, identities, systems, and outcomes are fictional and local-only.
 */

const MODULE_THREE_LAB_ID = 'm03-siem-signal-room-v1';
const MODULE_THREE_FLAG = 'M03-SIEM-CORRELATION-COMPLETE';
const MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage';
const MODULE_THREE_PASSING_SCORE = 70;

const MODULE_THREE_INTRO_SLIDES = [
  {
    eyebrow: 'Slide 1',
    title: 'Logs are everywhere',
    body: [
      'In Information Technology, Operational Technology, and the many devices around us, logs can be created everywhere.',
      'Everything is connected in one way or another.',
      'And when something happens, many of those systems can record it.',
    ],
    visual: 'logs',
  },
  {
    eyebrow: 'Slide 2',
    title: 'The world is connected',
    body: [
      'This map shows the undersea cables that connect countries around the world.',
      'A huge amount of internet traffic moves through these cables every day.',
    ],
    visual: 'cables',
  },
  {
    eyebrow: 'Slide 3',
    title: 'How devices communicate',
    body: [
      'This is only one way our devices communicate with each other.',
      'Data might travel through a copper cable pulsing electricity.',
      'It might travel as rapidly flashing light through fiber-optic cable.',
      'Or it might travel through frequencies moving through the air to and from our mobile devices.',
    ],
    visual: 'signals',
  },
  {
    eyebrow: 'Slide 4',
    title: 'The OSI model',
    body: [
      'This is why, starting in 1977, the OSI Model was created.',
      'OSI means Open Systems Interconnection.',
      'It gave us a simple way to understand how technology communicates across seven layers.',
      'Charles Bachman’s work at Honeywell helped provide the original seven-layer concept.',
      'Almost every technology you use lives in one or more of these layers.',
    ],
    visual: 'osi',
  },
  {
    eyebrow: 'Slide 5',
    title: 'Physical',
    body: ['Physical: An Ethernet cable.', 'It is the actual thing carrying the signal from one device to another.'],
    visual: 'physical',
  },
  {
    eyebrow: 'Slide 6',
    title: 'Data Link',
    body: ['Data Link: Your home Wi-Fi router recognizing your phone.', 'It knows your phone is one specific device on the local network.'],
    visual: 'datalink',
  },
  {
    eyebrow: 'Slide 7',
    title: 'Network',
    body: ['Network: Google Maps for network traffic.', 'Routers use IP addresses to figure out where data needs to go.'],
    visual: 'network',
  },
  {
    eyebrow: 'Slide 8',
    title: 'Transport',
    body: ['Transport: A delivery service checking every package arrived.', 'TCP helps make sure data shows up completely and in the right order.'],
    visual: 'transport',
  },
  {
    eyebrow: 'Slide 9',
    title: 'Session',
    body: ['Session: Staying signed in to Netflix.', 'Your session stays active while you move from one episode to the next.'],
    visual: 'session',
  },
  {
    eyebrow: 'Slide 10',
    title: 'Presentation',
    body: ['Presentation: A translator between two people.', 'It changes information into a format both sides understand, like turning encrypted data back into readable information.'],
    visual: 'presentation',
  },
  {
    eyebrow: 'Slide 11',
    title: 'Application',
    body: ['Application: Opening Gmail and sending an email.', 'This is the layer where you directly use the technology.'],
    visual: 'application',
  },
  {
    eyebrow: 'Slide 12',
    title: 'Why this matters to a SOC analyst',
    body: [
      'Logs can be created at every OSI layer.',
      'They help us understand what happened, where it happened, and why a piece of hardware or software malfunctioned.',
      'That gives technicians, and SOC Analysts like you, the evidence needed to investigate and fix the problem.',
    ],
    visual: 'soc',
  },
];

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
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.'
  },
  {
    title: 'What Are Risk Detections? (Impossible Travel, Atypical Travel)',
    org: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks',
    note: 'Real-world implementation of geographic anomaly detection and impossible-travel velocity checks in identity systems.'
  },
  {
    title: 'Logging Made Easy: A Guide for Small Businesses',
    org: 'CISA',
    url: 'https://www.cisa.gov/resources-tools/resources/logging-made-easy',
    note: 'Practical guidance on selecting, centralizing, retaining, and reviewing logs so analysts can investigate across systems.'
  },
];


const MODULE_THREE_DEFAULT_STATE = {
  practiceComplete: false,
  importedLabComplete: false,
  practiceNotes: '',
  attempts: 0,
  score: 0,
  bestScore: 0,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  notes: '',
  lessonWork: {},
  introSlidesComplete: false,
  normalizationLab: { mappings: {}, ingested: false, falseCorrelationSeen: false },
  labProgress: {},
  guidedGateMessage: '',
  assessmentGateMessage: '',
};

/* Each catalog lesson keeps the same four-part loop used by Modules 01–02.
 * These activities are embedded in the existing lesson minutes; they do not
 * create a second assessment allocation. */
const MODULE_THREE_LESSON_LOOPS = [
  { id: 'read-logs', title: 'Read logs as linked observations', scenario: 'The SIEM flags acct-428 after a failed sign-in, a success, a directory role grant, and an application export. A nearby approved service restart may be unrelated.', theory: 'Treat each record as an observation with source, time, entity, and outcome. A detection claim is stronger when independent observations agree without erasing their source context.', questions: [
    { prompt: 'What should an analyst preserve first?', options: ['Source, timestamp, entity, and outcome for each record', 'Only the alert title', 'A verdict before opening the records'], correct: 0, feedbackCorrect: 'Keeping source and time attached prevents a later correlation from becoming an unsupported story.', feedbackIncorrect: 'Do not flatten the evidence into a verdict. Retain where each observation came from, when it occurred, and what it actually records.' },
    { prompt: 'What does one unusual sign-in prove?', options: ['It is a lead that needs corroboration', 'The account is compromised', 'The alert is false'], correct: 0, feedbackCorrect: 'A single observation starts the investigation; it does not establish intent or impact.', feedbackIncorrect: 'One unusual record is not enough to establish compromise. Seek related identity, access, and resource observations.' },
    { prompt: 'Which link is strongest?', options: ['Same account, session family, and close timing across sources', 'Two unrelated events on the same day', 'A matching alert color'], correct: 0, feedbackCorrect: 'Multiple aligned dimensions reduce coincidence and keep the correlation explainable.', feedbackIncorrect: 'Timing or presentation alone is weak. Correlation needs shared entities or technical linkage as well as time.' },
  ], task: 'Write a two-sentence observation that names the source and time context you would preserve for acct-428.' },
  { id: 'normalized-explorer', title: 'Normalized log explorer', scenario: 'AuthLog calls the account field account, DirectoryAudit records the target account, AppAudit records an actor, and SystemLog uses a service or host identity. Shared fields support comparison while source context remains visible.', theory: 'Normalization maps equivalent source fields into a shared schema while retaining the original source. Use normalized fields for comparison, then return to raw records when details matter.', questions: [
    { prompt: 'Why normalize these fields?', options: ['To compare one entity across source formats', 'To discard source provenance', 'To make every event look like a sign-in'], correct: 0, feedbackCorrect: 'A shared schema makes cross-source searching possible while source provenance remains available for verification.', feedbackIncorrect: 'Normalization is not data deletion or relabeling everything as one event. It is a comparable view over diverse records.' },
    { prompt: 'What should follow a normalized match?', options: ['Confirm the raw source record and field meaning', 'Assume all matched events are malicious', 'Ignore the source system'], correct: 0, feedbackCorrect: 'The normalized match is a pivot; source verification protects against mapping errors.', feedbackIncorrect: 'A normalized match still needs source validation. Keep the original event and field semantics in the evidence chain.' },
    { prompt: 'Which mismatch is most important to resolve?', options: ['Different time zones or clock drift between sources', 'Different row colors', 'Different analyst screen sizes'], correct: 0, feedbackCorrect: 'Clock alignment can create or hide a low-and-slow sequence, so document the time basis before concluding.', feedbackIncorrect: 'Presentation differences are irrelevant. Time basis and field semantics directly affect correlation quality.' },
  ], task: 'Describe how normalized account and session fields link AuthLog, DirectoryAudit, AppAudit, and SystemLog while preserving source provenance.' },
  { id: 'query-workbench', title: 'Correlation query workbench', scenario: 'The alert window spans three days, so the obvious five-minute query returns nothing. The analyst must use a bounded account/session pivot and preserve a readable order.', theory: 'A useful query is bounded, explicit, and reproducible: define the time range, filter on a defensible pivot, project the fields needed for review, and sort to reveal the sequence.', questions: [
    { prompt: 'What is the BEST first pivot for this case?', options: ['The normalized account plus session family across the bounded window', 'Every event in the tenant with no time limit', 'The alert severity label only'], correct: 0, feedbackCorrect: 'A defensible pivot keeps the search narrow enough to interpret while covering the slow activity window.', feedbackIncorrect: 'Unbounded searches and severity-only filters either overwhelm the analyst or omit the relationships needed to test the claim.' },
    { prompt: 'Why project source and raw event type?', options: ['So the result remains explainable and can be verified', 'To hide irrelevant details from reviewers', 'Because raw event type is never useful'], correct: 0, feedbackCorrect: 'A compact result is still auditable when it retains source and event type.', feedbackIncorrect: 'Do not hide provenance. Keep enough fields for another analyst to reproduce and challenge the correlation.' },
    { prompt: 'What does oldest-first sorting support?', options: ['Reconstructing sequence and dwell time', 'Proving intent automatically', 'Replacing the need for scope checks'], correct: 0, feedbackCorrect: 'Chronology helps establish order and dwell time, but it remains one part of the reasoning.', feedbackIncorrect: 'Sorting reveals sequence; it does not by itself prove intent or replace scope and context checks.' },
  ], task: 'Draft a bounded query plan in plain language: name the pivot, time window, two fields to project, and the sort order.' },
  { id: 'analyst-handoff', title: 'Build the analyst handoff', scenario: 'The evidence links acct-428 sign-in, a directory role grant, and an application export through one session and source IP. A nearby service restart has an approved change record. A responder needs a precise handoff.', theory: 'A handoff separates observation, analysis, confirmed scope, uncertainty, and requested action. State what the evidence supports and avoid upgrading a lead into an impact claim.', questions: [
    { prompt: 'Which scope statement is defensible?', options: ['acct-428 and session S-8841; the observed export is confirmed, but broader access and impact remain unknown', 'The whole tenant was compromised', 'No scope can be stated until the case closes'], correct: 0, feedbackCorrect: 'A useful scope is specific about what was observed and honest about what remains unknown.', feedbackIncorrect: 'Avoid both overstatement and paralysis. Name the affected entity/session and explicitly preserve the unconfirmed impact question.' },
    { prompt: 'What belongs in the analysis field?', options: ['Why the linked observations support or weaken the detection claim', 'Only copied raw log rows', 'A response action with no rationale'], correct: 0, feedbackCorrect: 'Analysis explains the relationship between observations; it is not a duplicate event dump or an unsupported command.', feedbackIncorrect: 'Separate raw observation from interpretation. Explain the correlation and its limits before proposing action.' },
    { prompt: 'What is the FIRST proportionate next step?', options: ['Preserve the evidence and escalate the bounded account/session for authorized review', 'Delete the audit records', 'Disable every account in Mission Next Labs'], correct: 0, feedbackCorrect: 'Preservation and scoped escalation protect the investigation without exceeding the evidence or analyst authority.', feedbackIncorrect: 'The pattern warrants action, but broad disruption or evidence deletion exceeds the supported scope.' },
  ], task: 'Write a short handoff sentence that separates confirmed observations, the unknown broader impact, and the requested next step.' },
];

let moduleThreeState = null;
let moduleThreeUser = null;
let moduleThreeReviewMode = false;
let moduleThreeQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleThreeQuizVerifiedElsewhere()).
let moduleThreeQuizForceRetake = false;

function moduleThreeHasPriorActivity(state, user) {
  if (!state || typeof state !== 'object') return false;
  if (state.completed || state.practiceComplete || state.importedLabComplete) return true;
  if ((state.attempts || 0) > 0 || (state.bestScore || 0) > 0 || (state.score || 0) > 0) return true;
  if ((state.notes || '').trim() || (state.practiceNotes || '').trim()) return true;
  if (state.console && Object.keys(state.console).length > 0) return true;
  if (state.lessonWork && Object.keys(state.lessonWork).length > 0) return true;
  if (state.labProgress && Object.keys(state.labProgress).length > 0) return true;
  if (state.normalizationLab?.ingested || Object.keys(state.normalizationLab?.mappings || {}).length > 0) return true;
  if (user?.remoteModuleProgress?.['soc-03'] && user.remoteModuleProgress['soc-03'] !== 'not_started') return true;
  if (user?.remoteVerifiedModuleProgress?.['soc-03'] === true) return true;
  if (user?.remoteModuleDetail?.['soc-03'] && Object.keys(user.remoteModuleDetail['soc-03']).length > 0) return true;
  return false;
}

function moduleThreeLoad(user) {
  if (moduleThreeUser?.email !== user?.email) moduleThreeQuizForceRetake = false;
  moduleThreeUser = user;
  moduleThreeState = LabRuntime.loadCaseState(MODULE_THREE_LAB_ID, 'soc-03', user, MODULE_THREE_DEFAULT_STATE);
  try {
    const completion = JSON.parse(localStorage.getItem('mission_next_lab_completion') || 'null');
    moduleThreeState.importedLabComplete = moduleThreeState.importedLabComplete === true
      || Boolean(completion && completion.user === user?.username && completion.labId === 'lap-4')
      || Boolean(user?.remoteCaseState?.['soc-03']?.['imported-lab-progress:lap-4']?.completedAt);
  } catch (_) { moduleThreeState.importedLabComplete = false; }
  if (!Array.isArray(moduleThreeState.feedback)) moduleThreeState.feedback = [];
  if (!Array.isArray(moduleThreeState.flags)) moduleThreeState.flags = [];
  if (!moduleThreeState.lessonWork || typeof moduleThreeState.lessonWork !== 'object') moduleThreeState.lessonWork = {};
  moduleThreeState.normalizationLab = { mappings: {}, ingested: false, falseCorrelationSeen: false, ...(moduleThreeState.normalizationLab || {}) };
  moduleThreeState.introSlidesComplete = moduleThreeState.introSlidesComplete === true || moduleThreeHasPriorActivity(moduleThreeState, user);
  if (typeof moduleThreeState.notes !== 'string') moduleThreeState.notes = '';
  if (typeof moduleThreeState.practiceNotes !== 'string') moduleThreeState.practiceNotes = '';
  moduleThreeState.labProgress = moduleThreeState.labProgress && typeof moduleThreeState.labProgress === 'object' ? moduleThreeState.labProgress : {};
  if (typeof moduleThreeState.guidedGateMessage !== 'string') moduleThreeState.guidedGateMessage = '';
  if (typeof moduleThreeState.assessmentGateMessage !== 'string') moduleThreeState.assessmentGateMessage = '';
  // Guided Lab completion now comes from the console guide. Earlier manual
  // "Mark Guided Lab complete" records are kept, never revoked.
  if (moduleThreeState.console?.practice?.guideStep >= M03E_GUIDE_STEPS.length) moduleThreeState.practiceComplete = true;
  // A returned attempt stays immutable in lab_attempts, but its saved
  // case-state latch must not permanently block resubmission (CASE_RECORD_
  // MIGRATION.md #7), scoped to an open redo for this exact lab.
  if (typeof m03eApplyRedoReopen === 'function') m03eApplyRedoReopen();

  // Initialize quiz state
  if (!moduleThreeQuizState) {
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    moduleThreeQuizState = createQuizAttempt(MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-03');
  return moduleThreeState;
}

function moduleThreeSave() {
  if (moduleThreeUser && moduleThreeState) LabRuntime.saveCaseState(MODULE_THREE_LAB_ID, 'soc-03', moduleThreeUser, moduleThreeState);
}

function moduleThreeGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm03-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleThreeQuizState?.passed, scrollId: 'm03-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleThreeState.practiceComplete, scrollId: 'm03-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleThreeState.completed, scrollId: 'm03-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm03-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm03-sources-section', gated: false, supplemental: true },
  ];
}

function moduleThreeGetQuickNavItems() {
  const items = [];
  MODULE_THREE_LESSON_LOOPS.forEach((lesson, index) => {
    const work = moduleThreeState.lessonWork[lesson.id] || {};
    const isComplete = work.taskComplete === true;
    items.push({
      id: `m03-lesson-${esc(lesson.id)}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m03-lesson-${esc(lesson.id)}`,
      lessonNumber: index + 1,
    });
  });
  items.push({
    id: 'm03-guided-lab',
    title: 'Guided Lab',
    kind: 'lab',
    isComplete: moduleThreeState.practiceComplete === true,
    scrollId: 'm03-guided-lab',
  });
  items.push({
    id: 'm03-assessment-lab',
    title: 'Assessment Lab',
    kind: 'lab',
    isComplete: moduleThreeState.completed === true,
    scrollId: 'm03-assessment-lab',
  });
  return items;
}

function moduleThreeVideoScript() {
  return '';
}

function moduleThreeIntroVisual(kind) {
  const osiLayers = ['Application', 'Presentation', 'Session', 'Transport', 'Network', 'Data Link', 'Physical'];
  if (kind === 'cables') {
    return `<figure class="m03-intro-map">
      <img src="assets/course-media/submarine-cable-map.png" alt="World map showing submarine communication cable routes connecting continents">
      <figcaption>Submarine communication cable map, Wikimedia Commons / OpenStreetMap contributors.</figcaption>
    </figure>`;
  }
  if (kind === 'osi') {
    return `<div class="m03-intro-osi" aria-hidden="true">${osiLayers.map((layer, index) => `<span style="--m03-layer:${index + 1}">${7 - index}. ${esc(layer)}</span>`).join('')}</div>`;
  }
  const iconMap = {
    logs: ['ri-file-list-3-line', 'ri-router-line', 'ri-server-line', 'ri-base-station-line'],
    signals: ['ri-flashlight-line', 'ri-lightbulb-flash-line', 'ri-signal-tower-line'],
    physical: ['ri-ethernet-line', 'ri-plug-line'],
    datalink: ['ri-wifi-line', 'ri-smartphone-line'],
    network: ['ri-map-pin-2-line', 'ri-route-line'],
    transport: ['ri-truck-line', 'ri-checkbox-circle-line'],
    session: ['ri-login-circle-line', 'ri-play-circle-line'],
    presentation: ['ri-translate-2', 'ri-lock-unlock-line'],
    application: ['ri-mail-send-line', 'ri-computer-line'],
    soc: ['ri-search-eye-line', 'ri-shield-check-line', 'ri-file-shield-2-line'],
  };
  const icons = iconMap[kind] || iconMap.logs;
  return `<div class="m03-intro-visual m03-intro-visual-${esc(kind)}" aria-hidden="true">
    <div class="m03-intro-orbit">${icons.map((icon, index) => `<span style="--m03-node:${index}"><i class="${esc(icon)}"></i></span>`).join('')}</div>
    <div class="m03-intro-core"><i class="${esc(icons[0])}"></i></div>
  </div>`;
}

function moduleThreeIntroDeck() {
  const complete = moduleThreeState?.introSlidesComplete === true;
  return `<section class="m03-intro-deck ${complete ? 'is-complete' : ''}" id="m03-intro-deck" aria-labelledby="m03-intro-title" data-m03-intro-complete="${complete ? 'true' : 'false'}">
    <div class="m03-intro-deck-head">
      <div><p class="m03-kicker">Opening slides</p><h2 id="m03-intro-title">Before SIEM correlation: where logs come from</h2></div>
      <div class="m03-intro-controls" aria-label="Slide controls">
        <button type="button" data-m03-slide-prev aria-label="Previous slide"><i class="ri-arrow-left-s-line" aria-hidden="true"></i></button>
        <span data-m03-slide-count>1 / ${MODULE_THREE_INTRO_SLIDES.length}</span>
        <button type="button" data-m03-slide-next aria-label="Next slide"><i class="ri-arrow-right-s-line" aria-hidden="true"></i></button>
      </div>
    </div>
    <div class="m03-intro-stage">
      ${MODULE_THREE_INTRO_SLIDES.map((slide, index) => `<article class="m03-intro-slide ${index === 0 ? 'is-active' : ''}" data-m03-slide="${index}" ${index === 0 ? '' : 'hidden'}>
        <div class="m03-intro-copy">
          <p class="m03-intro-eyebrow">${esc(slide.eyebrow)}</p>
          <h3>${esc(slide.title)}</h3>
          ${slide.body.map((line) => `<p>${esc(line)}</p>`).join('')}
        </div>
        ${moduleThreeIntroVisual(slide.visual)}
      </article>`).join('')}
    </div>
    <div class="m03-intro-dots" role="tablist" aria-label="Select slide">
      ${MODULE_THREE_INTRO_SLIDES.map((slide, index) => `<button type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-label="${esc(slide.eyebrow)}: ${esc(slide.title)}" data-m03-slide-dot="${index}"></button>`).join('')}
    </div>
    <div class="m03-intro-gate" data-m03-intro-gate>
      <i class="${complete ? 'ri-checkbox-circle-line' : 'ri-lock-line'}" aria-hidden="true"></i>
      <span>${complete ? 'Opening slides complete. Continue to the next card below.' : 'Continue through all 12 opening slides to unlock the next card.'}</span>
    </div>
  </section>`;
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

function moduleThreeLessonLoop(lesson, index) {
  const work = moduleThreeState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const feedback = work.feedback?.length ? `<p class="m03-lesson-feedback ${work.checked ? 'is-pass' : 'is-hint'}" role="status">${esc(work.feedback.join(' '))}</p>` : '';
  return `<details class="m03-lesson-loop mf-lesson" id="m03-lesson-${esc(lesson.id)}" ${work.taskComplete ? '' : 'open'}>
    <summary><span class="m03-lesson-number mf-lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lesson.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lesson.title)}</strong><small>${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<span class="mf-lesson-done" aria-label="Lesson complete"><i class="ri-check-line" aria-hidden="true"></i></span>' : ''}<i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary>
    <div class="m03-lesson-loop-body mf-lesson-body">
      <section><p class="m03-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section>
      <section><p class="m03-kicker">Theory</p><p>${esc(lesson.theory)}</p></section>
      <section><p class="m03-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset class="m03-lesson-question"><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m03-lesson-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m03-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${Number(work.answers?.[qIndex]) === optionIndex ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m03-lesson-check" data-m03-lesson-check="${esc(lesson.id)}">Check this lesson</button>${feedback}</section>
      <section><p class="m03-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m03-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m03-lesson-task-button" data-m03-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section>
    </div>
  </details>`;
}

function moduleThreeLessonLoopsView() {
  return `<section class="m03-lesson-loops" id="m03-lessons" aria-labelledby="m03-lessons-title"><div class="m03-panel-heading"><div><p class="m03-kicker">Four-part lesson loops</p><h3 id="m03-lessons-title">Practice each SIEM skill in the Mission Next Labs takeover case</h3></div><span>4 lessons</span></div>${MODULE_THREE_LESSON_LOOPS.map(moduleThreeLessonLoop).join('')}</section>`;
}

function moduleThreeLecture() {
  return `<section class="m03-lecture-section">
    <div class="m03-lecture-intro"><p><strong>Your shift starts with a ticket.</strong> The SOC has flagged unusual activity for <code>acct-428</code>. Your lead asks: “Can you connect AuthLog, DirectoryAudit, AppAudit, and SystemLog—and tell me what we know, what we don't, and what should happen next?” That is log correlation on the job: testing whether separate observations describe one activity chain.</p></div>

    <h3>1. Start with the records you actually receive</h3>
    <p>The same fact arrives in different shapes. Here are four <em>illustrative</em> observations from the fictional service-account case. Keep source and original event meaning attached as you compare them.</p>
    <div class="m03-log-examples" aria-label="Example records from the four SIEM sources">
      <article><strong>AuthLog · authentication</strong><pre>09:14:03 acct-428 SignIn Failure src=198.51.100.24</pre><pre>09:14:19 acct-428 SignIn Success session=S-8841 src=198.51.100.24</pre></article>
      <article><strong>DirectoryAudit · identity change</strong><pre>09:16:11 acct-428 RoleAdded Billing-Exporters session=S-8841</pre></article>
      <article><strong>AppAudit · application action</strong><pre>09:18:42 acct-428 BulkExport 184 records session=S-8841</pre></article>
      <article><strong>SystemLog · host context</strong><pre>09:20:01 svc-billing ServiceRestart CHG-204 approved</pre></article>
    </div>
    <p>A parser maps source-specific account, IP, and time fields to shared fields such as <code>Account</code>, <code>SourceIp</code>, and <code>TimeGenerated</code>. The normalized view makes a shared search possible. It should still retain <code>EventSource</code>, the raw event type, and the original record so you can verify what each source meant.</p>
    <div class="m03-normalized-wrap"><table class="m03-normalized-table"><caption>Same observations after normalization</caption><thead><tr><th>Time (UTC)</th><th>Source</th><th>Account</th><th>Event</th><th>Source IP</th><th>Session</th><th>Result</th></tr></thead><tbody>
      <tr><td>09:14:19</td><td>AuthLog</td><td>acct-428</td><td>SignIn</td><td>198.51.100.24</td><td>S-8841</td><td>Success</td></tr>
      <tr><td>09:16:11</td><td>DirectoryAudit</td><td>acct-428</td><td>RoleAdded</td><td>198.51.100.24</td><td>S-8841</td><td>Success</td></tr>
      <tr><td>09:18:42</td><td>AppAudit</td><td>acct-428</td><td>BulkExport</td><td>198.51.100.24</td><td>S-8841</td><td>Success</td></tr>
      <tr><td>09:20:01</td><td>SystemLog</td><td>svc-billing</td><td>ServiceRestart</td><td>10.20.4.8</td><td>JOB-22</td><td>Success</td></tr>
    </tbody></table></div>
    <p><strong>On the job:</strong> a normalized match is a pivot, not proof. Check parser mappings, time zones and clock drift, and the raw source record before treating fields as equivalent. Normalization helps you find related events; it does not make them identical.</p>

    <h3>2. Build the timeline; don't jump to the conclusion</h3>
    <p>Put the records oldest-first. The sequence is <em>sign-in failure → success → directory role grant → application export</em>, linked by account, session, and source IP in under five minutes. That is a suspicious activity chain. The SystemLog restart has an approved change record and a different service identity, so it is context, not evidence of the account action.</p>
    <p>Time proximity alone is coincidence. A strong correlation has several aligned clues—shared account or session, compatible source or host, a tight time window, and a plausible technical relationship—while preserving any gaps.</p>

    <h3>3. Ask the SIEM a question you can explain</h3>
    <p>At a real desk, start with the alert's bounded time window and a defensible pivot. This KQL-style example searches the account, keeps the fields a teammate needs to review, and sorts oldest-first:</p>
    <pre class="m03-query-example"><code>UnifiedEvents
| where Account == "acct-428"
| where TimeGenerated between (datetime(2026-09-22) .. datetime(2026-09-24))
| project TimeGenerated, EventSource, EventType, Account, SourceIp, SessionId, Result
| sort by TimeGenerated asc</code></pre>
    <p>Read it like a work note: <strong>scope</strong> the time and account; <strong>compare</strong> source, event, IP, session, and outcome; <strong>reconstruct</strong> the sequence. If the first search is empty, check the alert window, field mapping, and source coverage before widening it. A query result is only as complete as the telemetry that arrived.</p>

    <h3>4. Write the handoff your lead can act on</h3>
    <p>A useful Tier 1 handoff separates what the logs say from what you infer and what remains unknown. For this example, it might read:</p>
    <blockquote class="m03-analyst-note"><strong>Observed:</strong> AuthLog shows acct-428 failing then succeeding from 198.51.100.24; DirectoryAudit records a Billing-Exporters role grant; AppAudit records a 184-record export. All share session S-8841 between 09:14 and 09:19.<br><strong>Assessment:</strong> The linked sequence and missing change ticket support a true-positive takeover finding. The observed scope is acct-428 and this session; broader access is not established.<br><strong>Next step:</strong> Preserve the four source records, revoke the session through the authorized response process, and investigate additional access tied to acct-428.</blockquote>
    <p>That is more useful than “account compromised”: it gives the next analyst evidence they can reproduce, a bounded scope, and an unanswered question to resolve.</p>

    <h3>5. Decide what the alert means</h3>
    <div class="m03-verdict-examples">
      <article><strong>True positive</strong><p>The detection matched real unauthorized activity. Example: an unapproved role grant is followed by access to a restricted resource, with no change record.</p></article>
      <article><strong>Benign positive</strong><p>The unusual activity really happened, and the alert caught it, but an approved explanation fits. Example: a documented after-hours migration uses the flagged account and source.</p></article>
      <article><strong>False positive</strong><p>The alert's condition was not actually present; a rule or data issue made it appear so. Example: a parser maps a service heartbeat as a human sign-in, and the raw event confirms no sign-in occurred.</p></article>
    </div>
    <p>Use the evidence and authorized context to choose a verdict. If key facts are still unverified, record that uncertainty and follow your team's escalation procedure; an anomaly is a reason to investigate, not a verdict by itself.</p>
  </section>`;
}

const M03_NORMALIZATION_FIELDS = [
  ['timestamp_utc', 'source timestamp', ['source timestamp → UTC', 'source timestamp (unchanged)']],
  ['user', 'account / targetAccount / actor; no user for service-only SystemLog events', ['account / targetAccount / actor identity', 'SystemLog.service']],
  ['session_id', 'source session value', ['source session value', 'host change reference']],
  ['src_ip', 'source IP value', ['source IP value', 'host IP only']],
  ['host', 'device or host identity', ['device / host identity', 'source IP']],
  ['action', 'event meaning', ['source event meaning', 'raw message text only']],
  ['outcome', 'result / status', ['source result / status', 'event severity']],
];
const M03_NORMALIZATION_EVENTS = [
  ['AuthLog','A-1003','09:02','acct-428','failed sign-in','198.51.100.18','—'],
  ['AuthLog','A-1006','09:04','acct-428','successful sign-in','198.51.100.18','S-8841'],
  ['AuthLog','A-1003','08:41','j.lee','failed sign-in','203.0.113.9','—'],
  ['AuthLog','A-1004','08:43','j.lee','successful sign-in','203.0.113.9','S-8830'],
  ['AuthLog','A-1005','10:20','svc-backup','successful sign-in','10.0.4.8','JOB-44'],
  ['DirectoryAudit','D-2001','09:08','acct-428','directory role grant','198.51.100.18','S-8841'],
  ['DirectoryAudit','D-2002','08:10','m.chen','directory role grant','10.0.1.9','S-8800'],
  ['DirectoryAudit','D-2003','10:22','svc-backup','group read grant','10.0.4.8','JOB-44'],
  ['DirectoryAudit','D-2004','07:50','a.park','directory role grant','10.0.1.9','S-8700'],
  ['AppAudit','P-3001','09:12','acct-428','application export','198.51.100.18','S-8841'],
  ['AppAudit','P-3002','08:52','j.lee','application search','203.0.113.9','S-8830'],
  ['AppAudit','P-3003','10:24','svc-backup','backup export','10.0.4.8','JOB-44'],
  ['AppAudit','P-3004','07:55','a.park','application export','10.0.2.5','S-8700'],
  ['AppAudit','P-3005','09:30','acct-428','application view','198.51.100.18','S-8841'],
  ['SystemLog','S-4001','09:10','svc-backup','service restart','10.0.4.8','CHG-221'],
  ['SystemLog','S-4002','08:30','web-02','service restart','10.0.2.8','CHG-219'],
  ['SystemLog','S-4003','09:16','idp-01','collector heartbeat','10.0.1.10','—'],
  ['SystemLog','S-4004','09:18','app-01','collector heartbeat','10.0.2.10','—'],
];
function moduleThreeNormalizationLab() {
  const lab = moduleThreeState.normalizationLab;
  const select = (field, options) => `<select data-m03-normalize="${field}" aria-label="Map ${field}"><option value="">Choose a source field</option>${options.map((option) => `<option value="${option}" ${lab.mappings[field] === option ? 'selected' : ''}>${option}</option>`).join('')}</select>`;
  const fields = M03_NORMALIZATION_FIELDS.map(([key, example, choices]) => `<tr><th scope="row"><code>${key}</code></th><td>${example}</td><td>${select(key, choices)}</td></tr>`).join('');
  const normalizedPreview = M03_NORMALIZATION_EVENTS.filter((row) => ['A-1003','A-1006','D-2001','P-3001','S-4001'].includes(row[1])).map((row) => `<tr><td>${row[2]}Z</td><td>${row[0]}</td><td>${row[1]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[6]}</td></tr>`).join('');
  const rawSamples = [
    ['AuthLog', 'id=A-1003 · 05:02 UTC−04:00 · account=acct-428 · signInResult=failed · sourceIp=198.51.100.18'],
    ['DirectoryAudit', 'id=D-2001 · 09:08Z · targetAccount=acct-428 · operation=role grant · status=success · correlationId=S-8841'],
    ['AppAudit', 'id=P-3001 · 09:12Z · actor=acct-428 · appAction=export · result=success · sessionToken=S-8841'],
    ['SystemLog', 'id=S-4001 · 09:10Z · service=svc-backup · systemMessage=restart · outcome=success · change=CHG-221 · approved'],
  ].map(([source, sample]) => `<article><strong>${source}</strong><code>${sample}</code></article>`).join('');
  const falseNotice = lab.falseCorrelationSeen && !lab.ingested ? `<div class="m03-norm-feedback is-hint" role="status"><strong>False correlation found.</strong> SystemLog.service describes the service identity involved in a host event; it is not the event’s user field. This mapping pulled the approved <code>svc-backup</code> restart (CHG-221) into the candidate chain. Map <code>user</code> to the account/actor identity for each source, then validate and ingest again. The restart remains separate because it has a different identity, no shared S-8841 session, and an approved change.</div>` : '';
  const mappingFeedback = lab.validationMessage ? `<div class="m03-norm-feedback is-hint" role="status">${esc(lab.validationMessage)}</div>` : '';
  const success = lab.ingested ? `<div class="m03-norm-feedback is-pass" role="status"><strong>18 events normalized.</strong> Source provenance retained. One time-zone discrepancy resolved. Events are ready for investigation.</div><div class="m03-norm-table-wrap"><table class="m03-norm-table"><thead><tr><th>UTC</th><th>source_type</th><th>raw_event_id</th><th>user</th><th>action</th><th>session_id</th></tr></thead><tbody>${normalizedPreview}</tbody></table></div><button type="button" class="m03-norm-primary" data-m03-open-workspace>Open investigation workspace</button>` : '';
  return `<section class="m03-normalization-lab" aria-labelledby="m03-normalization-title">
    <nav class="m03-norm-flow" aria-label="Module workflow"><span>Normalized log explorer</span><i class="ri-arrow-right-line" aria-hidden="true"></i><strong>Normalize and ingest</strong><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Correlation query workbench</span></nav>
    <div class="m03-norm-heading"><p class="m03-kicker">Guided lab · Normalize and ingest</p><h3 id="m03-normalization-title">Build a trustworthy shared event set</h3><p>Map equivalent meanings across four raw sources. Keep <code>source_type</code> and <code>raw_event_id</code> visible so each normalized row can be traced back to its original record.</p></div>
    <div class="m03-norm-samples" aria-label="Raw event samples">${rawSamples}</div>
    <p class="m03-norm-hint"><strong>Try the mapping trap:</strong> map <code>SystemLog.service</code> to <code>user</code> once and validate. Review the false correlation, correct the mapping, then validate again.</p>
    <div class="m03-norm-concepts"><strong>Core concepts to carry forward</strong><p>Normalize meaning, not just field names. Convert source times to UTC before ordering; preserve the original timestamp and offset as context. Prefer a session identifier, then corroborate with another dimension such as source IP or close timing. A match is a lead to verify against raw records and approved change context.</p></div>
    <div class="m03-norm-table-wrap"><table class="m03-norm-table"><thead><tr><th>Shared field</th><th>Source examples</th><th>Your mapping</th></tr></thead><tbody>${fields}<tr><th><code>source_type</code></th><td>AuthLog / DirectoryAudit / AppAudit / SystemLog</td><td><strong>Retain original source label</strong></td></tr><tr><th><code>raw_event_id</code></th><td>Original record ID</td><td><strong>Retain original ID</strong></td></tr></tbody></table></div>
    <p class="m03-norm-hint">Time note: AuthLog’s 05:02 UTC−04:00 is 09:02Z. Convert before ordering; keep the original timestamp and offset available for audit.</p>
    <div class="m03-norm-actions"><button type="button" class="m03-norm-primary" data-m03-validate-ingest>Validate and ingest</button></div>${mappingFeedback}${falseNotice}${success}
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

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleThreeQuizVerifiedElsewhere() {
  if (moduleThreeQuizForceRetake || !moduleThreeQuizState || moduleThreeQuizState.scored) return false;
  if (Object.keys(moduleThreeQuizState.answers || {}).length > 0) return false;
  return moduleThreeUser?.remoteVerifiedModuleProgress?.['soc-03'] === true
    || moduleThreeUser?.remoteModuleDetail?.['soc-03']?.quizPassed === true
    || moduleThreeUser?.remoteModuleEvidence?.['soc-03']?.['knowledge-check'] === true;
}

function moduleThreeQuizPanel() {
  if (!moduleThreeQuizState?.selectedQuestions || moduleThreeQuizState.selectedQuestions.length === 0) {
    return `<div class="m03-quiz-empty" id="m03-quiz-feedback" role="status">Loading quiz...</div>`;
  }
  if (moduleThreeQuizVerifiedElsewhere()) {
    return `<form class="m03-quiz-form mf-quiz-form" id="m03-quiz-form" novalidate><section class="mf-score is-pass" id="m03-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m03-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleThreeQuizState.selectedQuestions;
  const answered = Object.keys(moduleThreeQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleThreeQuizState.scored) {
    const passed = moduleThreeQuizState.score >= 70;
    feedbackHtml = `<section class="m03-quiz-score mf-score ${passed ? 'm03-quiz-pass is-pass' : 'm03-quiz-remediate is-remediate'}" id="m03-quiz-feedback" tabindex="-1" aria-live="polite">
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

  return `<form class="m03-quiz-form mf-quiz-form" id="m03-quiz-form" novalidate>
    <div class="m03-panel-heading mf-panel-heading"><div><p class="m03-kicker mf-kicker">Knowledge check</p><h3 id="m03-quiz-title" tabindex="-1">Test your understanding of SIEM correlation concepts</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleThreeQuizQuestion(sel, idx)).join('')}
    <div class="m03-quiz-actions">
      <button class="m03-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* Guided Lab and Assessment Lab panels — moduleThreeGuidedLabPanel(),
 * moduleThreeAssessmentLabPanel() and wireModuleThreeConsole() — live in
 * soc-analyst-module-03-environment.js: an in-module SIEM console with a KQL
 * query engine, replacing the imported-lab launch cards and the separate
 * Required Labs block. */

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
  const sections = moduleThreeGetSections();
  const lectureOpen = moduleThreeReviewMode || !moduleThreeState.normalizationLab?.ingested;
  const quizOpen = moduleThreeReviewMode || (moduleThreeQuizState && !moduleThreeQuizState.passed);
  const guidedLabOpen = moduleThreeReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleThreeReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleThreeReviewMode;
  const quickNavItems = moduleThreeGetQuickNavItems();
  const introComplete = moduleThreeState.introSlidesComplete === true;

  const lectureSection = `
    <details class="m03-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-lecture" aria-labelledby="m03-lecture-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge">1</span><div><p class="m03-kicker mf-kicker">Core concepts and practice</p><h2 id="m03-lecture-title">Log normalization, correlation, and triage</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body" aria-labelledby="m03-lecture-title">
        ${moduleThreeNormalizationLab()}
      </section>
    </details>`;
  const postIntroGate = `<div class="m03-post-intro ${introComplete ? 'is-unlocked' : 'is-locked'}" id="m03-post-intro" data-m03-post-intro>
    <section class="m03-next-card-lock" data-m03-next-card-lock aria-labelledby="m03-next-card-lock-title">
      <i class="ri-lock-line" aria-hidden="true"></i>
      <div><p class="m03-kicker">Next card locked</p><h2 id="m03-next-card-lock-title">Finish the opening slides first</h2><p>Reach Slide 12 to unlock Log normalization, correlation, and triage.</p></div>
    </section>
    <div class="m03-post-intro-content" data-m03-post-intro-content>${lectureSection}</div>
  </div>`;

  const quizSection = `
    <details class="m03-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-knowledge-check" aria-labelledby="m03-quiz-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge">2</span><div><p class="m03-kicker mf-kicker">Interactive knowledge check</p><h2 id="m03-quiz-title">Test your understanding of SIEM correlation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body" aria-labelledby="m03-quiz-title"><div id="m03-quiz-dynamic">${moduleThreeQuizPanel()}</div></section>
    </details>`;

  const guidedLabSection = `
    <details class="m03-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section m03-lab-section" id="m03-guided-lab" aria-labelledby="m03-guided-lab-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge">3</span><div><p class="m03-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m03-guided-lab-title">Investigate CASE-MN-428 in the SIEM console</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body m03-lab-section" aria-labelledby="m03-guided-lab-title">
        <div class="m03-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> A simulated SIEM with fictional telemetry. Queries run in your browser, and nothing here touches a real system.</p></div>
        <div id="m03-guided-lab-dynamic">${moduleThreeGuidedLabPanel()}</div>
      </section>
    </details>`;

  const assessmentLabSection = `
    <details class="m03-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section m03-lab-section" id="m03-assessment-lab" aria-labelledby="m03-assessment-lab-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge">4</span><div><p class="m03-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m03-assessment-lab-title">Independent SIEM case: CASE-MN-517</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body m03-lab-section" aria-labelledby="m03-assessment-lab-title">
        <div id="m03-assessment-lab-dynamic">${moduleThreeAssessmentLabPanel()}</div>
      </section>
    </details>`;

  const reviewSection = `
    <details class="m03-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-review" aria-labelledby="m03-review-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge">5</span><div><p class="m03-kicker mf-kicker">Concept recap</p><h2 id="m03-review-title">Module review and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body" aria-labelledby="m03-review-title">${moduleThreeReview()}</section>
    </details>`;

  const sourcesSection = `
    <details class="m03-section-collapsible mf-section mf-section-supplemental" ${moduleThreeReviewMode ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-sources" aria-labelledby="m03-sources-title">
          <div class="m03-section-heading mf-section-heading"><span class="mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m03-kicker mf-kicker">Supporting resources</p><h2 id="m03-sources-title">Further reading on SIEM and correlation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body mf-section-body" id="m03-sources-section" aria-labelledby="m03-sources-title">${moduleSourcesBlock(MODULE_THREE_SOURCES)}</section>
    </details>`;

  return `<div class="m03-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleThreeReviewMode })}
      <main class="m03-main mf-frame">
      <section class="m03-hero mf-hero" aria-labelledby="m03-title">
        <div><p class="m03-kicker mf-kicker">Module 03 · ${formatHandsOnDuration(module.durationMinutes)} · assisted investigation</p><h1 id="m03-title">${esc(module.title)}</h1><p class="mf-lede">Use normalized telemetry to separate a suspicious service-account sequence from believable operational noise, then explain the evidence as a defensible analyst handoff.</p></div>
        <dl class="m03-status mf-stats" aria-label="Saved lab status"><div><dt>Guided Lab</dt><dd>${moduleThreeState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m03-status">${complete ? 'Complete' : moduleThreeState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="m03-objective" aria-labelledby="m03-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m03-kicker">One measurable objective</p><h2 id="m03-objective-title">Analyze real-world-style logs and justify a defensible triage decision in your assessment write-up.</h2></div></section>

      ${moduleThreeIntroDeck()}
      ${postIntroGate}
      ${quizSection}
      ${guidedLabSection}
      ${assessmentLabSection}
      ${reviewSection}
      ${sourcesSection}
    </main>
    </div>
  </div>`;
}

function wireModuleThreeLessons() {
  const root = document.getElementById('m03-lessons');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m03-lesson-answer]');
    if (!input) return;
    const work = moduleThreeState.lessonWork[input.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.answers[input.dataset.questionIndex] = Number(input.value);
    moduleThreeSave();
  });
  root.addEventListener('input', (event) => {
    const field = event.target.closest('[data-m03-lesson-task]');
    if (!field) return;
    const work = moduleThreeState.lessonWork[field.dataset.m03LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.task = field.value;
    moduleThreeSave();
  });
  root.addEventListener('click', (event) => {
    const check = event.target.closest('[data-m03-lesson-check]');
    if (check) {
      const lesson = MODULE_THREE_LESSON_LOOPS.find((item) => item.id === check.dataset.m03LessonCheck);
      const work = moduleThreeState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      const missing = lesson.questions.some((question, index) => work.answers?.[index] === undefined);
      if (missing) { work.checked = false; work.feedback = [`Answer all ${lesson.questions.length} questions before checking this lesson.`]; }
      else {
        const correct = lesson.questions.filter((question, index) => work.answers[index] === question.correct).length;
        work.checked = correct === lesson.questions.length;
        work.feedback = lesson.questions.map((question, index) => {
          const answerCorrect = work.answers[index] === question.correct;
          return `Q${index + 1}: ${answerCorrect ? question.feedbackCorrect : question.feedbackIncorrect}`;
        });
        if (!work.checked) work.feedback.push(`${correct}/${lesson.questions.length} correct. Retry after comparing source, time, entity, and outcome.`);
      }
      moduleThreeSave();
      const details = check.closest('details');
      if (details) details.outerHTML = moduleThreeLessonLoop(lesson, MODULE_THREE_LESSON_LOOPS.indexOf(lesson));
      return;
    }
    const taskButton = event.target.closest('[data-m03-lesson-task-submit]');
    if (!taskButton) return;
    const lesson = MODULE_THREE_LESSON_LOOPS.find((item) => item.id === taskButton.dataset.m03LessonTask);
    const work = moduleThreeState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.taskComplete = work.checked && (work.task || '').trim().length >= 20;
    work.feedback = work.taskComplete ? ['Applied task saved.'] : ['Complete the knowledge check and write at least 20 characters before saving the task.'];
    moduleThreeSave();
    const details = taskButton.closest('details');
    if (details) details.outerHTML = moduleThreeLessonLoop(lesson, MODULE_THREE_LESSON_LOOPS.indexOf(lesson));
  });
}

function wireModuleThreeNormalizationLab() {
  const root = document.querySelector('.m03-normalization-lab');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const field = event.target.closest('[data-m03-normalize]');
    if (!field) return;
    const lab = moduleThreeState.normalizationLab;
    lab.mappings[field.dataset.m03Normalize] = field.value;
    lab.ingested = false;
    lab.validationMessage = '';
    moduleThreeSave();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m03-validate-ingest]')) {
      const lab = moduleThreeState.normalizationLab;
      const mappings = lab.mappings || {};
      const required = M03_NORMALIZATION_FIELDS.map(([key]) => key);
      const missing = required.some((key) => !mappings[key]);
      if (missing) {
        lab.ingested = false;
        lab.validationMessage = 'Map all seven shared fields before ingesting. source_type and raw_event_id are retained automatically.';
      } else if (mappings.user === 'SystemLog.service') {
        lab.ingested = false;
        lab.falseCorrelationSeen = true;
        lab.validationMessage = '';
      } else if (M03_NORMALIZATION_FIELDS.some(([key, , choices]) => mappings[key] !== choices[0])) {
        lab.ingested = false;
        lab.validationMessage = 'One or more mappings do not preserve the shared field meaning. Review the source examples, then map each field to its equivalent value and convert timestamps to UTC.';
      } else {
        lab.ingested = true;
        lab.falseCorrelationSeen = false;
        lab.validationMessage = '';
      }
      moduleThreeSave();
      const section = document.querySelector('.mf-section-body[aria-labelledby="m03-lecture-title"]');
      if (section) section.innerHTML = moduleThreeNormalizationLab();
      return;
    }
    if (event.target.closest('[data-m03-open-workspace]')) {
      const practice = moduleThreeState.console?.practice || (moduleThreeState.console ||= {}).practice || {};
      if (!practice.normalizedIngestReady) {
        practice.guideStep = 0;
        practice.tab = 'alerts';
        practice.pins = [];
        practice.seen = [];
        practice.queryLog = [];
        practice.query = '';
        practice.lastQuery = '';
        moduleThreeState.practiceComplete = false;
        moduleThreeState.practiceNotes = '';
      }
      practice.normalizedIngestReady = true;
      if (practice.guideStep === 0) practice.tab = 'alerts';
      moduleThreeState.console.practice = practice;
      moduleThreeSave();
      if (typeof moduleThreeRefreshLabPanels === 'function') moduleThreeRefreshLabPanels();
      const guided = document.getElementById('m03-guided-lab');
      const details = guided?.closest('details');
      if (details) details.open = true;
      guided?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  });
}

function wireModuleThreeIntroDeck() {
  const root = document.getElementById('m03-intro-deck');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('[data-m03-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-m03-slide-dot]'));
  const count = root.querySelector('[data-m03-slide-count]');
  const gate = root.querySelector('[data-m03-intro-gate]');
  const postIntro = document.querySelector('[data-m03-post-intro]');
  let current = 0;
  let maxSeen = moduleThreeState.introSlidesComplete === true ? slides.length - 1 : 0;
  const unlockNextCard = () => {
    if (moduleThreeState.introSlidesComplete !== true) {
      moduleThreeState.introSlidesComplete = true;
      moduleThreeSave();
    }
    root.dataset.m03IntroComplete = 'true';
    root.classList.add('is-complete');
    if (gate) {
      gate.innerHTML = '<i class="ri-checkbox-circle-line" aria-hidden="true"></i><span>Opening slides complete. Continue to the next card below.</span>';
    }
    if (postIntro) {
      postIntro.classList.remove('is-locked');
      postIntro.classList.add('is-unlocked');
    }
  };
  const show = (index) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    if (target > maxSeen + 1) return;
    current = target;
    maxSeen = Math.max(maxSeen, current);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.hidden = !active;
      slide.classList.toggle('is-active', active);
    });
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-selected', dotIndex === current ? 'true' : 'false');
      dot.setAttribute('aria-disabled', dotIndex > maxSeen + 1 ? 'true' : 'false');
    });
    if (count) count.textContent = `${current + 1} / ${slides.length}`;
    if (current === slides.length - 1 && maxSeen === slides.length - 1) unlockNextCard();
  };
  if (moduleThreeState.introSlidesComplete === true) unlockNextCard();
  root.querySelector('[data-m03-slide-prev]')?.addEventListener('click', () => show(current - 1));
  root.querySelector('[data-m03-slide-next]')?.addEventListener('click', () => show(current + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => {
    if (dot.getAttribute('aria-disabled') === 'true') return;
    show(Number(dot.dataset.m03SlideDot));
  }));
  show(current);
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

      // The quiz is rendered once when the module opens. Updating the answer
      // state alone does not update the already-rendered submit button, so it
      // would remain disabled even after the final question was answered.
      const total = moduleThreeQuizState.selectedQuestions.length;
      const answered = Object.keys(moduleThreeQuizState.answers || {}).length;
      const submitButton = quizForm.querySelector('.m03-quiz-submit');
      if (submitButton) submitButton.disabled = answered < total;

      const answerCount = quizForm.querySelector('.m03-panel-heading > span');
      if (answerCount) answerCount.textContent = `${answered}/${total} answered`;

      if (!moduleThreeQuizState.scored) {
        const feedback = quizForm.querySelector('#m03-quiz-feedback');
        if (feedback) {
          feedback.textContent = answered === total
            ? 'All questions answered. Submit to check your responses.'
            : `Answer all ${total} questions to submit.`;
        }
      }
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
    if (event.target.closest('[data-m03-quiz-retake]')) {
      event.preventDefault();
      moduleThreeQuizForceRetake = true;
      moduleThreeRenderQuiz('m03-quiz-title');
      // The container re-render replaced the form element; wire the new one.
      wireModuleThreeQuiz();
      return;
    }
    if (!event.target.closest('[data-m03-quiz-retry]')) return;
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    Object.assign(moduleThreeQuizState, resetQuizAttempt(moduleThreeQuizState, MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true, preserveScoredResult: true }));
    moduleThreeRenderQuiz('m03-quiz-title');
  });
}

function wireModuleThree() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m03-section-collapsible', getReviewMode: () => moduleThreeReviewMode, setReviewMode: (value) => { moduleThreeReviewMode = value; }, enabledLabel: 'Exit Review', disabledLabel: 'Review Module', enabledIcon: 'ri-eye-off-line', disabledIcon: 'ri-eye-line' });

  wireModuleThreeQuiz();
  wireModuleThreeIntroDeck();
  wireModuleThreeLessons();
  wireModuleThreeNormalizationLab();
  wireModuleThreeConsole();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 3, moduleKey: 'soc-03',
  view: viewModuleThree, wire: wireModuleThree });

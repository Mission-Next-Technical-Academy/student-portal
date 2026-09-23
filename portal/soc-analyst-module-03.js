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
};

/* Each catalog lesson keeps the same four-part loop used by Modules 01–02.
 * These activities are embedded in the existing lesson minutes; they do not
 * create a second assessment allocation. */
const MODULE_THREE_LESSON_LOOPS = [
  { id: 'read-logs', title: 'Read logs as linked observations', scenario: 'Mission Next Labs receives a low-severity sign-in alert for acct-428. One identity record is inconclusive, but a later cloud-resource read and mailbox token refresh share the same session family.', theory: 'Treat each record as an observation with source, time, entity, and outcome. A detection claim is stronger when independent observations agree without erasing their source context.', questions: [
    { prompt: 'What should an analyst preserve first?', options: ['Source, timestamp, entity, and outcome for each record', 'Only the alert title', 'A verdict before opening the records'], correct: 0, feedbackCorrect: 'Keeping source and time attached prevents a later correlation from becoming an unsupported story.', feedbackIncorrect: 'Do not flatten the evidence into a verdict. Retain where each observation came from, when it occurred, and what it actually records.' },
    { prompt: 'What does one unusual sign-in prove?', options: ['It is a lead that needs corroboration', 'The account is compromised', 'The alert is false'], correct: 0, feedbackCorrect: 'A single observation starts the investigation; it does not establish intent or impact.', feedbackIncorrect: 'One unusual record is not enough to establish compromise. Seek related identity, access, and resource observations.' },
    { prompt: 'Which link is strongest?', options: ['Same account, session family, and close timing across sources', 'Two unrelated events on the same day', 'A matching alert color'], correct: 0, feedbackCorrect: 'Multiple aligned dimensions reduce coincidence and keep the correlation explainable.', feedbackIncorrect: 'Timing or presentation alone is weak. Correlation needs shared entities or technical linkage as well as time.' },
  ], task: 'Write a two-sentence observation that names the source and time context you would preserve for acct-428.' },
  { id: 'normalized-explorer', title: 'Normalized log explorer', scenario: 'An identity system calls the account field principal, the mailbox audit calls it actor, and the cloud API calls it subject. The records all refer to acct-428.', theory: 'Normalization maps equivalent source fields into a shared schema while retaining the original source. Use normalized fields for comparison, then return to raw records when details matter.', questions: [
    { prompt: 'Why normalize these fields?', options: ['To compare one entity across source formats', 'To discard source provenance', 'To make every event look like a sign-in'], correct: 0, feedbackCorrect: 'A shared schema makes cross-source searching possible while source provenance remains available for verification.', feedbackIncorrect: 'Normalization is not data deletion or relabeling everything as one event. It is a comparable view over diverse records.' },
    { prompt: 'What should follow a normalized match?', options: ['Confirm the raw source record and field meaning', 'Assume all matched events are malicious', 'Ignore the source system'], correct: 0, feedbackCorrect: 'The normalized match is a pivot; source verification protects against mapping errors.', feedbackIncorrect: 'A normalized match still needs source validation. Keep the original event and field semantics in the evidence chain.' },
    { prompt: 'Which mismatch is most important to resolve?', options: ['Different time zones or clock drift between sources', 'Different row colors', 'Different analyst screen sizes'], correct: 0, feedbackCorrect: 'Clock alignment can create or hide a low-and-slow sequence, so document the time basis before concluding.', feedbackIncorrect: 'Presentation differences are irrelevant. Time basis and field semantics directly affect correlation quality.' },
  ], task: 'Describe one normalized field and one raw-source check you would use to compare acct-428 across identity, mailbox, and cloud logs.' },
  { id: 'query-workbench', title: 'Correlation query workbench', scenario: 'The alert window spans three days, so the obvious five-minute query returns nothing. The analyst must use a bounded account/session pivot and preserve a readable order.', theory: 'A useful query is bounded, explicit, and reproducible: define the time range, filter on a defensible pivot, project the fields needed for review, and sort to reveal the sequence.', questions: [
    { prompt: 'What is the BEST first pivot for this case?', options: ['The normalized account plus session family across the bounded window', 'Every event in the tenant with no time limit', 'The alert severity label only'], correct: 0, feedbackCorrect: 'A defensible pivot keeps the search narrow enough to interpret while covering the slow activity window.', feedbackIncorrect: 'Unbounded searches and severity-only filters either overwhelm the analyst or omit the relationships needed to test the claim.' },
    { prompt: 'Why project source and raw event type?', options: ['So the result remains explainable and can be verified', 'To hide irrelevant details from reviewers', 'Because raw event type is never useful'], correct: 0, feedbackCorrect: 'A compact result is still auditable when it retains source and event type.', feedbackIncorrect: 'Do not hide provenance. Keep enough fields for another analyst to reproduce and challenge the correlation.' },
    { prompt: 'What does oldest-first sorting support?', options: ['Reconstructing sequence and dwell time', 'Proving intent automatically', 'Replacing the need for scope checks'], correct: 0, feedbackCorrect: 'Chronology helps establish order and dwell time, but it remains one part of the reasoning.', feedbackIncorrect: 'Sorting reveals sequence; it does not by itself prove intent or replace scope and context checks.' },
  ], task: 'Draft a bounded query plan in plain language: name the pivot, time window, two fields to project, and the sort order.' },
  { id: 'analyst-handoff', title: 'Build the analyst handoff', scenario: 'The evidence supports a suspicious low-and-slow takeover pattern, but it does not prove mailbox content was exfiltrated. A responder needs a precise handoff.', theory: 'A handoff separates observation, analysis, confirmed scope, uncertainty, and requested action. State what the evidence supports and avoid upgrading a lead into an impact claim.', questions: [
    { prompt: 'Which scope statement is defensible?', options: ['acct-428 and the observed session family; mailbox content access remains unconfirmed', 'The whole tenant was compromised', 'No scope can be stated until the case closes'], correct: 0, feedbackCorrect: 'A useful scope is specific about what was observed and honest about what remains unknown.', feedbackIncorrect: 'Avoid both overstatement and paralysis. Name the affected entity/session and explicitly preserve the unconfirmed impact question.' },
    { prompt: 'What belongs in the analysis field?', options: ['Why the linked observations support or weaken the detection claim', 'Only copied raw log rows', 'A response action with no rationale'], correct: 0, feedbackCorrect: 'Analysis explains the relationship between observations; it is not a duplicate event dump or an unsupported command.', feedbackIncorrect: 'Separate raw observation from interpretation. Explain the correlation and its limits before proposing action.' },
    { prompt: 'What is the FIRST proportionate next step?', options: ['Preserve the evidence and escalate the bounded identity/session for authorized review', 'Delete the mailbox audit records', 'Disable every account in Mission Next Labs'], correct: 0, feedbackCorrect: 'Preservation and scoped escalation protect the investigation without exceeding the evidence or analyst authority.', feedbackIncorrect: 'The pattern warrants action, but broad disruption or evidence deletion exceeds the supported scope.' },
  ], task: 'Write a short handoff sentence that separates confirmed observations, the unconfirmed mailbox-impact question, and the requested next step.' },
];

let moduleThreeState = null;
let moduleThreeUser = null;
let moduleThreeReviewMode = false;
let moduleThreeQuizState = null;

function moduleThreeLoad(user) {
  moduleThreeUser = user;
  moduleThreeState = LabRuntime.load(MODULE_THREE_LAB_ID, user, MODULE_THREE_DEFAULT_STATE);
  try {
    const completion = JSON.parse(localStorage.getItem('mission_next_lab_completion') || 'null');
    moduleThreeState.importedLabComplete = Boolean(completion && completion.user === user?.username && completion.labId === 'lap-4');
  } catch (_) { moduleThreeState.importedLabComplete = false; }
  if (!Array.isArray(moduleThreeState.feedback)) moduleThreeState.feedback = [];
  if (!Array.isArray(moduleThreeState.flags)) moduleThreeState.flags = [];
  if (!moduleThreeState.lessonWork || typeof moduleThreeState.lessonWork !== 'object') moduleThreeState.lessonWork = {};
  if (typeof moduleThreeState.notes !== 'string') moduleThreeState.notes = '';
  if (typeof moduleThreeState.practiceNotes !== 'string') moduleThreeState.practiceNotes = '';

  // Initialize quiz state
  if (!moduleThreeQuizState) {
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    moduleThreeQuizState = createQuizAttempt(MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
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

function moduleThreeLessonLoop(lesson, index) {
  const work = moduleThreeState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const feedback = work.feedback?.length ? `<p class="m03-lesson-feedback ${work.checked ? 'is-pass' : 'is-hint'}" role="status">${esc(work.feedback.join(' '))}</p>` : '';
  return `<details class="m03-lesson-loop" id="m03-lesson-${esc(lesson.id)}" ${work.taskComplete ? '' : 'open'}>
    <summary><span class="m03-lesson-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(lesson.title)}</strong><small>${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<i class="ri-checkbox-circle-fill m03-lesson-done" aria-label="Lesson complete"></i>' : '<i class="ri-arrow-down-s-line m03-chevron" aria-hidden="true"></i>'}</summary>
    <div class="m03-lesson-loop-body">
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

function moduleThreeGuidedLabPanel() {
  const links = [
    { label: 'Basic Apache Web Server Log Analysis', href: 'imported-labs/mission-next-labs/index.html#/track/log-analysis/project/lap-1/lab' },
    { label: 'Introduction to Syslog Analysis on Linux Systems', href: 'imported-labs/mission-next-labs/index.html#/track/log-analysis/project/lap-2/lab' },
  ];
  return `<section class="m03-external-lab" id="m03-guided-lab-panel">
    <p class="m03-panel-instruction">Work through both Mission Next log-analysis labs below. When you're done, note what you found and mark the Guided Lab complete.</p>
    <div class="m03-external-lab-links">${links.map((l) => `<a class="m03-lab-launch" href="${esc(l.href)}"><i class="ri-arrow-right-line" aria-hidden="true"></i> Launch: ${esc(l.label)}</a>`).join('')}</div>
    <label class="m03-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m03-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleThreeState.practiceNotes)}</textarea></label>
    <div class="m03-actions"><button type="button" class="m03-submit" data-m03-practice-complete>${moduleThreeState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleThreeAdditionalLabs() {
  return missionNextAdditionalLabsSection(3, [
    { label: 'Analyzing Windows Event Logs for Security Incidents', detail: 'Windows event evidence and account activity', href: 'imported-labs/mission-next-labs/index.html#/track/log-analysis/project/lap-3/lab' },
    { label: 'HTTP Log Analysis — Web Attack Detection', detail: 'Web attack patterns in HTTP telemetry', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/http-log-analysis' },
    { label: 'System Log Assessment', detail: 'Suspicious system-log review', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-4/lab' },
  ]);
}

function moduleThreeAssessmentLabPanel() {
  const feedbackHtml = moduleThreeState.feedback?.length ? `<div class="m03-independent-feedback is-pass" role="status"><strong>Submitted</strong><ul>${moduleThreeState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  const labHref = 'imported-labs/mission-next-labs/index.html#/track/log-analysis/project/lap-4/lab';
  const labStatus = moduleThreeState.importedLabComplete
    ? '<p class="m03-help" role="status"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i> Mission Next ELK lab complete. You may submit your assessment write-up.</p>'
    : '<p class="m03-help">Complete every step in the Mission Next ELK lab before submitting your assessment write-up.</p>';
  return `<section class="m03-external-lab" id="m03-assessment-lab-panel">
    <p class="m03-panel-instruction">Complete the Mission Next ELK log-analysis lab, then write up your findings below for instructor review.</p>
    <div class="m03-external-lab-links"><a class="m03-lab-launch" href="${labHref}"><i class="ri-arrow-right-line" aria-hidden="true"></i> Launch: Simple Log Analysis with ELK Stack</a></div>
    ${labStatus}
    <form id="m03-assessment-form">
      <label class="m03-note-label">Assessment write-up<textarea id="m03-assessment-notes" rows="6" maxlength="900" data-m03-assessment-notes placeholder="Summarize what the ELK lab surfaced, your analysis, and your recommended action…">${esc(moduleThreeState.notes)}</textarea></label>
      <p class="m03-help">In at least 80 characters, describe what you found and your recommended action.</p>
      <div class="m03-actions"><button type="submit" class="m03-submit" ${moduleThreeState.importedLabComplete ? '' : 'disabled'}>${moduleThreeState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
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
  const sections = moduleThreeGetSections();
  const lectureOpen = moduleThreeReviewMode || !sections[0].isComplete;
  const quizOpen = moduleThreeReviewMode || (moduleThreeQuizState && !moduleThreeQuizState.passed);
  const guidedLabOpen = moduleThreeReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleThreeReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleThreeReviewMode;
  const quickNavItems = moduleThreeGetQuickNavItems();

  const lectureSection = `
    <details class="m03-section-collapsible" ${lectureOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-lecture" aria-labelledby="m03-lecture-title">
          <div class="m03-section-heading"><span>1</span><div><p class="m03-kicker">Core concepts and practice</p><h2 id="m03-lecture-title">Log normalization, correlation, and triage</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-lecture-title">
        ${moduleThreeVideoScript()}
        ${moduleThreeLessonLoopsView()}
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

  const guidedLabSection = `
    <details class="m03-section-collapsible" ${guidedLabOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section m03-lab-section" id="m03-guided-lab" aria-labelledby="m03-guided-lab-title">
          <div class="m03-section-heading"><span>3</span><div><p class="m03-kicker">Practice It · Guided Lab</p><h2 id="m03-guided-lab-title">Log analysis practice</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body m03-lab-section" aria-labelledby="m03-guided-lab-title">
        <div class="m03-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> These labs open in the imported training application on this page.</p></div>
        <div id="m03-guided-lab-dynamic">${moduleThreeGuidedLabPanel()}</div>
      </section>
    </details>`;

  const assessmentLabSection = `
    <details class="m03-section-collapsible" ${assessmentLabOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section m03-lab-section" id="m03-assessment-lab" aria-labelledby="m03-assessment-lab-title">
          <div class="m03-section-heading"><span>4</span><div><p class="m03-kicker">Prove It · Assessment Lab</p><h2 id="m03-assessment-lab-title">Independent log analysis review</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body m03-lab-section" aria-labelledby="m03-assessment-lab-title">
        <div id="m03-assessment-lab-dynamic">${moduleThreeAssessmentLabPanel()}</div>
      </section>
    </details>`;

  const reviewSection = `
    <details class="m03-section-collapsible" ${reviewOpen ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-review" aria-labelledby="m03-review-title">
          <div class="m03-section-heading"><span>5</span><div><p class="m03-kicker">Concept recap</p><h2 id="m03-review-title">Module review and takeaways</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" aria-labelledby="m03-review-title">${moduleThreeReview()}</section>
    </details>`;

  const sourcesSection = `
    <details class="m03-section-collapsible" ${moduleThreeReviewMode ? 'open' : ''}>
      <summary class="m03-section-summary">
        <section class="m03-section" id="m03-sources" aria-labelledby="m03-sources-title">
          <div class="m03-section-heading"><span>6</span><div><p class="m03-kicker">Supporting resources</p><h2 id="m03-sources-title">Further reading on SIEM and correlation</h2></div></div>
        </section>
      </summary>
      <section class="m03-section m03-section-body" id="m03-sources-section" aria-labelledby="m03-sources-title">${moduleSourcesBlock(MODULE_THREE_SOURCES)}</section>
    </details>`;

  return `<div class="m03-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleThreeReviewMode })}
    <div class="mquick-nav-layout">
      <main class="m03-main">
      <section class="m03-hero" aria-labelledby="m03-title">
        <div><p class="m03-kicker">Module 03 · ${formatHandsOnDuration(module.durationMinutes)} · assisted investigation</p><h1 id="m03-title">${esc(module.title)}</h1><p>Use normalized telemetry to separate a suspicious service-account sequence from believable operational noise, then explain the evidence as a defensible analyst handoff.</p></div>
        <dl class="m03-status" aria-label="Saved lab status"><div><dt>Guided Lab</dt><dd>${moduleThreeState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m03-status">${complete ? 'Complete' : moduleThreeState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="m03-objective" aria-labelledby="m03-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m03-kicker">One measurable objective</p><h2 id="m03-objective-title">Analyze real-world-style logs and justify a defensible triage decision in your assessment write-up.</h2></div></section>

      ${lectureSection}
      ${quizSection}
      ${guidedLabSection}
      ${assessmentLabSection}
      ${moduleThreeAdditionalLabs()}
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
    if (!event.target.closest('[data-m03-quiz-retry]')) return;
    const previousQuestionIds = moduleThreeState.lastQuizQuestionIds || [];
    Object.assign(moduleThreeQuizState, resetQuizAttempt(moduleThreeQuizState, MODULE_THREE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true, preserveScoredResult: true }));
    moduleThreeRenderQuiz('m03-quiz-title');
  });
}

function wireModuleThreeGuidedLab() {
  const root = document.getElementById('m03-guided-lab-dynamic');
  if (!root || !moduleThreeState) return;
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m03-practice-notes]')) {
      moduleThreeState.practiceNotes = event.target.value;
      moduleThreeSave();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m03-practice-complete]')) {
      moduleThreeState.practiceComplete = true;
      moduleThreeSave();
      root.innerHTML = moduleThreeGuidedLabPanel();
    }
  });
}

function wireModuleThreeAssessmentLab() {
  const root = document.getElementById('m03-assessment-lab-dynamic');
  if (!root || !moduleThreeState) return;
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm03-assessment-form') return;
    event.preventDefault();
    const notes = event.target.querySelector('#m03-assessment-notes')?.value || '';
    moduleThreeState.notes = notes;
    if (notes.trim().length < 80) {
      moduleThreeState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleThreeSave();
      root.innerHTML = moduleThreeAssessmentLabPanel();
      return;
    }
    moduleThreeState.attempts = (moduleThreeState.attempts || 0) + 1;
    moduleThreeState.lastSubmittedAt = new Date().toISOString();
    moduleThreeState.completed = true;
    moduleThreeState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleThreeState.flags.includes(MODULE_THREE_FLAG)) moduleThreeState.flags.push(MODULE_THREE_FLAG);
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleThreeUser, MODULE_THREE_CATALOG_LAB_KEY, { state: 'complete', result: { notes } });
    }
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY);
    moduleThreeSave();
    const status = document.getElementById('m03-status');
    if (status) status.textContent = 'Complete';
    root.innerHTML = moduleThreeAssessmentLabPanel();
  });
}

function wireModuleThree() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m03-section-collapsible', getReviewMode: () => moduleThreeReviewMode, setReviewMode: (value) => { moduleThreeReviewMode = value; }, enabledLabel: 'Exit Review', disabledLabel: 'Review Module', enabledIcon: 'ri-eye-off-line', disabledIcon: 'ri-eye-line' });

  wireModuleThreeQuiz();
  wireModuleThreeLessons();
  wireModuleThreeGuidedLab();
  wireModuleThreeAssessmentLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 3, moduleKey: 'soc-03',
  view: viewModuleThree, wire: wireModuleThree });

/* Module 06 — assisted hypothesis-led threat hunt.
 * Every identity, host, indicator, and event is synthetic and browser-local.
 */

const MODULE_SIX_LAB_ID = 'm06-hypothesis-hunt-v1';
const MODULE_SIX_FLAG = 'M06-HUNT-SCOPE-COMPLETE';
const MODULE_SIX_CATALOG_LAB_KEY = 'lab-threat-hunt';
const MODULE_SIX_PASSING_SCORE = 70;

const MODULE_SIX_QUIZ_BANKS = [
  {
    conceptId: 'testable-hypothesis',
    conceptTitle: 'Frame a testable hypothesis',
    questions: [
      {
        id: 'm06-q-hyp-1',
        prompt: 'Which hypothesis can be effectively tested with available endpoint and sign-in data?',
        options: [
          { id: 'a', text: 'The entire enterprise is compromised and all users are affected.' },
          { id: 'b', text: 'The same suspicious script behavior recurred on another device.' },
          { id: 'c', text: 'Malware exists somewhere in the world.' },
          { id: 'd', text: 'File hashes are always reliable indicators of intent.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Testable hypotheses name a specific behavior, entities it may affect, and evidence that would support or weaken it. Broad or unfalsifiable claims cannot guide a hunt.',
        feedbackIncorrect: 'A testable hypothesis is narrow enough to evaluate with available data and falsifiable if the evidence does not support it.',
      },
      {
        id: 'm06-q-hyp-2',
        prompt: 'A hunt begins with observing unsigned script execution beneath a document reader, followed by a connection to an unusual address. What is the BEST hypothesis for a second pass through the data?',
        options: [
          { id: 'a', text: 'Every document reader is malicious.' },
          { id: 'b', text: 'The destination address is always used by attackers.' },
          { id: 'c', text: 'The same file fingerprint and destination combination may appear on other devices with different users.' },
          { id: 'd', text: 'Sign-in logs are unreliable and should not be consulted.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'A good hypothesis narrows scope by naming specific indicators and asks whether they recur together under similar conditions. Testing this bounds the hunt and limits false positives.',
        feedbackIncorrect: 'Build the hypothesis by generalizing from the seed observation: what pattern, if repeated, would expand the evidence set while remaining testable?',
      },
      {
        id: 'm06-q-hyp-3',
        prompt: 'Why is a hypothesis valuable in threat hunting when you have access to all raw logs?',
        options: [
          { id: 'a', text: 'It eliminates the need to examine data; the hypothesis alone is proof.' },
          { id: 'b', text: 'It focuses the investigation on specific indicators and behaviors, avoiding false pivots and disconnected findings.' },
          { id: 'c', text: 'Raw logs are always incomplete, so the hypothesis must fill the gaps.' },
          { id: 'd', text: 'Hypotheses are required by regulation; they do not affect the hunt quality.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Hypotheses provide structure. They narrow the data set, define what evidence would be decisive, and prevent confirmation bias by stating falsifiability upfront.',
        feedbackIncorrect: 'A hypothesis is not evidence. It is a guide to focus your search and define which findings matter.',
      },
      {
        id: 'm06-q-hyp-4',
        prompt: 'A hypothesis states: "An unusual command-line script was launched from a productivity application on two devices by different users at a similar time." Which observation would MOST weaken this hypothesis?',
        options: [
          { id: 'a', text: 'The script uses encoding to obscure its arguments.' },
          { id: 'b', text: 'The application is signed and trusted by the vendor.' },
          { id: 'c', text: 'The same command-line script appears on a management server launched by a scheduled task during approved maintenance.' },
          { id: 'd', text: 'No network connections are observed from either device after the script runs.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'A weakening observation shows the suspected behavior has a benign explanation in a different context. Alternative causation undermines the malicious interpretation.',
        feedbackIncorrect: 'Consider which finding would offer an alternative explanation for the same script execution pattern, reducing the likelihood of compromise.',
      },
    ],
  },
  {
    conceptId: 'indicator-pivot',
    conceptTitle: 'Use indicators as pivots',
    questions: [
      {
        id: 'm06-q-piv-1',
        prompt: 'In threat hunting, what is the BEST use of an indicator (file hash, IP address, domain)?',
        options: [
          { id: 'a', text: 'An indicator alone proves guilt; any match automatically confirms a compromise.' },
          { id: 'b', text: 'An indicator narrows results and provides a starting point; behavioral context must validate the match.' },
          { id: 'c', text: 'Indicators are always false positives and should be ignored.' },
          { id: 'd', text: 'An indicator is used only after all other analysis is complete.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Indicators are pivots, not verdicts. A file hash or address can narrow a large data set, but matching rows must be examined for timing, parent processes, user context, and other behavioral signals.',
        feedbackIncorrect: 'Think of an indicator as a search filter that reduces noise but does not replace behavioral analysis.',
      },
      {
        id: 'm06-q-piv-2',
        prompt: 'An unsigned file with hash "aaa..." launched from two different parent processes on two devices. What is the NEXT step?',
        options: [
          { id: 'a', text: 'Declare both devices compromised; no further analysis is needed.' },
          { id: 'b', text: 'Ignore the hash match because the parent processes differ.' },
          { id: 'c', text: 'Compare the parent processes, timing, user contexts, and network behavior to determine if the pattern is consistent.' },
          { id: 'd', text: 'Report only the first match and close the hunt.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'The indicator matched twice; now evaluate whether the conditions around each match support a single malicious pattern or represent unrelated events.',
        feedbackIncorrect: 'A repeated indicator is valuable, but consistency of the surrounding behavior determines whether the matches are meaningful.',
      },
      {
        id: 'm06-q-piv-3',
        prompt: 'A destination IP address (203.0.113.77) appears in both an endpoint query and a sign-in query. Which claim is MOST justified?',
        options: [
          { id: 'a', text: 'The IP address alone proves an account compromise.' },
          { id: 'b', text: 'The shared IP suggests the endpoint activity and identity session may be part of the same event chain; verify the timing and user alignment.' },
          { id: 'c', text: 'The address match is coincidental and unrelated.' },
          { id: 'd', text: 'All sign-ins from this address are malicious.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Cross-source indicators strengthen an investigation. The shared destination suggests a coordinated event, but only behavioral correlation (timing, accounts, processes) confirms the link.',
        feedbackIncorrect: 'An indicator appearing in multiple sources is a signal worth investigating, not a proof of causation.',
      },
      {
        id: 'm06-q-piv-4',
        prompt: 'Why is it risky to rely on a single indicator (file hash) to scope an incident across the enterprise?',
        options: [
          { id: 'a', text: 'File hashes are random and never repeat.' },
          { id: 'b', text: 'The same bytes can be present for legitimate reasons (software updates, administrative tools) and malicious reasons. Behavioral context is required to distinguish them.' },
          { id: 'c', text: 'Hashes are always forged by attackers.' },
          { id: 'd', text: 'Scoping is not necessary in hunting.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A shared file hash proves the bytes are identical, but legitimate and malicious software can have the same hash. Context (parent process, user, execution time, network behavior) separates them.',
        feedbackIncorrect: 'An indicator is a narrow lens. Widen the view to include behavioral signals before scoping an entire organizational response.',
      },
    ],
  },
  {
    conceptId: 'scoped-query',
    conceptTitle: 'Construct a scoped query',
    questions: [
      {
        id: 'm06-q-qry-1',
        prompt: 'A KQL-style query is supposed to find every sign-in from IP 203.0.113.77. Which query has the correct structure?',
        options: [
          { id: 'a', text: 'SignInActivity | where SourceIp = 203.0.113.77 | sort by TimeGenerated asc' },
          { id: 'b', text: 'SignInActivity | where SourceIp == "203.0.113.77" | sort by TimeGenerated asc' },
          { id: 'c', text: 'SignInActivity | SourceIp "203.0.113.77"' },
          { id: 'd', text: 'where SourceIp == 203.0.113.77' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Correct syntax: table name, pipe, where with == and quoted string value, pipe, sort by field ascending. The equality operator == and quoted value are required.',
        feedbackIncorrect: 'Queries require: a table, a where clause with == for equality, quoted string values, and a chronological sort. Use this template for consistent results.',
      },
      {
        id: 'm06-q-qry-2',
        prompt: 'After filtering endpoint activity by file hash, 12 rows remain. Why is sorting by time ascending a necessary step?',
        options: [
          { id: 'a', text: 'Sorting makes the results look organized; it does not affect investigation quality.' },
          { id: 'b', text: 'Time order reveals sequence and causation. Early executions may explain later ones, and clusters can indicate coordinated activity.' },
          { id: 'c', text: 'Sorting is never necessary.' },
          { id: 'd', text: 'Descending sort is better; ascending time is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Chronological order is critical. A timeline shows which action triggered which consequence and whether events cluster (suggesting automation) or spread (suggesting multiple independent incidents).',
        feedbackIncorrect: 'Time sequencing is part of the evidence. Sorted data tells a story; unsorted data is just noise.',
      },
      {
        id: 'm06-q-qry-3',
        prompt: 'You query endpoint activity and get 47 results. The hypothesis was to find "the same unsigned script on two devices." Which action is BEST?',
        options: [
          { id: 'a', text: 'Accept all 47 rows as evidence of enterprise-wide compromise.' },
          { id: 'b', text: 'Refine the query with additional filters (process parent, account, time window) to narrow to the most relevant rows.' },
          { id: 'c', text: 'Ignore all results and start over with a new hypothesis.' },
          { id: 'd', text: 'Accept the first row as sufficient proof and close the hunt.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Large result sets indicate the pivot is too broad. Add context filters (parent process, account, time proximity) to focus on rows that test the hypothesis.',
        feedbackIncorrect: 'A successful query reduces noise. If you are still seeing benign distractors, refine the filter to improve signal.',
      },
      {
        id: 'm06-q-qry-4',
        prompt: 'A sign-in query returns two rows: one from the seed source IP at 08:47, another from the same IP at 14:33 on a different day. For a hunt focused on a single incident window, what is the appropriate action?',
        options: [
          { id: 'a', text: 'Keep both rows; they are both matches.' },
          { id: 'b', text: 'Add a time filter to narrow to the incident window. The second match may be unrelated or from a different threat actor.' },
          { id: 'c', text: 'Discard both rows because they are not in the same hour.' },
          { id: 'd', text: 'Accept both rows without question.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Temporal scoping is part of hypothesis-led hunting. A match hours or days away may be coincidental or from a different campaign. Confine searches to the incident window.',
        feedbackIncorrect: 'Broaden temporal scope only if the hypothesis explicitly includes prolonged persistence or follow-on activity.',
      },
    ],
  },
  {
    conceptId: 'bookmark-discipline',
    conceptTitle: 'Practice bookmark discipline',
    questions: [
      {
        id: 'm06-q-bm-1',
        prompt: 'A hunt yields 13 matching rows. How many should be bookmarked for the final evidence set?',
        options: [
          { id: 'a', text: 'All 13; more evidence is always better.' },
          { id: 'b', text: 'Only the few rows that directly establish the hypothesis and scope; extra rows weaken the evidence set.' },
          { id: 'c', text: 'None; bookmarks are a waste of time.' },
          { id: 'd', text: 'At least 50 rows to meet a reporting standard.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Bookmark discipline: select only the decisive few. Unrelated benign rows create noise and distract from the core finding. Quality evidence over volume.',
        feedbackIncorrect: 'A tight evidence set is more persuasive than a large, diluted one. Each bookmark should directly test the hypothesis.',
      },
      {
        id: 'm06-q-bm-2',
        prompt: 'Two endpoint rows show the same unsigned script. One has an expected parent process; one has an unusual parent. Which should be bookmarked?',
        options: [
          { id: 'a', text: 'Both; the file hash is the same.' },
          { id: 'b', text: 'Only the benign match; it proves the script is safe.' },
          { id: 'c', text: 'Only the unusual match; it supports the malicious hypothesis.' },
          { id: 'd', text: 'Neither; evidence is unreliable.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Bookmark what tests the hypothesis. The unusual parent-child relationship is decisive; the expected one is a distractor. Exclude noise.',
        feedbackIncorrect: 'Each bookmark should move the investigation forward. Benign examples, even with the same hash, are not part of the evidence chain.',
      },
      {
        id: 'm06-q-bm-3',
        prompt: 'You have bookmarked four rows: two endpoints with the suspicious file and two sign-ins from the shared destination. An analyst reviews your findings. What question might they ask?',
        options: [
          { id: 'a', text: 'Why did you bookmark the endpoint rows but not the process names?' },
          { id: 'b', text: 'Do the sign-in times align with the endpoint execution times, and do the accounts match?' },
          { id: 'c', text: 'Why are the rows different table names?' },
          { id: 'd', text: 'Bookmarks are never questioned.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A strong evidence set connects rows across sources. The analyst expects bookmarks to form a coherent chain: same indicators, aligned timing, same entities.',
        feedbackIncorrect: 'Bookmarks should tell a story. If cross-source rows do not corroborate each other, the evidence is weak.',
      },
      {
        id: 'm06-q-bm-4',
        prompt: 'After running two scoped queries, you have 6 results total. The hypothesis predicted 2 rows per source. What is the BEST next step?',
        options: [
          { id: 'a', text: 'Bookmark all 6 and report enterprise-wide compromise.' },
          { id: 'b', text: 'Use additional context (time, account, process parent) to identify the most relevant 4 rows that test the hypothesis.' },
          { id: 'c', text: 'Discard all 6 and start a new hunt.' },
          { id: 'd', text: 'Bookmark only 1 row as a minimum.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Query results are a starting point. Bookmark the rows that best test the hypothesis. If you have more than expected, additional filters help identify the core signal.',
        feedbackIncorrect: 'Numbers matter. A hypothesis that predicted 2 + 2 but yielded 3 + 3 suggests scope drift or filter issues. Refine to align with the prediction.',
      },
    ],
  },
  {
    conceptId: 'attack-mapping',
    conceptTitle: 'Map ATT&CK behavior precisely',
    questions: [
      {
        id: 'm06-q-atk-1',
        prompt: 'Endpoint telemetry shows a script being executed with encoded arguments. The sign-in data shows an unfamiliar client refreshing a session from an unusual address. Which TWO techniques are DIRECTLY supported by this evidence?',
        options: [
          { id: 'a', text: 'T1059 (Command and Scripting Interpreter) and T1078 (Valid Accounts).' },
          { id: 'b', text: 'T1566 (Phishing) and T1204 (User Execution).' },
          { id: 'c', text: 'T1098 (Account Manipulation) and T1555 (Credentials from Password Stores).' },
          { id: 'd', text: 'T1082 (System Information Discovery) and T1010 (Application Window Discovery).' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Script execution with arguments maps to T1059. Active session from an unfamiliar source maps to T1078 (using valid account credentials). Do not infer phishing or downloads not shown in logs.',
        feedbackIncorrect: 'Map only the techniques directly demonstrated by the telemetry. Avoid inferring delivery, download, or persistence behavior not present in the data.',
      },
      {
        id: 'm06-q-atk-2',
        prompt: 'A log shows an outbound connection from a host to an external IP. The data does NOT show what was transferred or whether a file was downloaded. Which technique should NOT be mapped?',
        options: [
          { id: 'a', text: 'T1071 (Application Layer Protocol) for the connection itself.' },
          { id: 'b', text: 'T1105 (Ingress Tool Transfer) for the file download.' },
          { id: 'c', text: 'T1203 (Exploitation for Client Execution) for the connection.' },
          { id: 'd', text: 'Both B and C should not be mapped.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'The connection is observed; the payload transfer is not. T1105 requires evidence of file transfer, not just a network connection. Do not infer techniques absent from the logs.',
        feedbackIncorrect: 'ATT&CK mapping should stay inside the evidence boundary. A connection alone does not prove tool transfer, exploitation, or lateral movement.',
      },
      {
        id: 'm06-q-atk-3',
        prompt: 'Why is precise ATT&CK mapping important in a threat hunt?',
        options: [
          { id: 'a', text: 'It replaces the need for behavioral analysis; techniques are proof on their own.' },
          { id: 'b', text: 'It communicates to responders what specific behaviors were observed, enabling targeted detection and response.' },
          { id: 'c', text: 'ATT&CK techniques are rarely relevant to threat hunting.' },
          { id: 'd', text: 'Mapping ensures every possible technique is listed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Precise mapping guides response. If you map only T1059, defenders focus on script-execution prevention. If you infer T1105, they may waste effort on network monitoring.',
        feedbackIncorrect: 'ATT&CK is a communication tool. Accurate mapping focuses the response team on the demonstrated threat, not on speculation.',
      },
      {
        id: 'm06-q-atk-4',
        prompt: 'Two instances of a malicious script appear on different devices, both with network connections to the same external address. Each device is from a different organizational unit. What is the minimal ATT&CK set justified by the evidence?',
        options: [
          { id: 'a', text: 'T1059, T1078, and T1105, because multiple devices are affected.' },
          { id: 'b', text: 'T1059 and T1078, because these are directly demonstrated. T1105 is not shown; the connection exists, but file transfer is not proven.' },
          { id: 'c', text: 'Only T1078, because valid accounts were used.' },
          { id: 'd', text: 'All techniques in the ATT&CK framework, because we cannot be certain.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Stick to the evidence. Script execution and valid-account usage are shown. Connection alone is not T1105. Avoid technique inflation.',
        feedbackIncorrect: 'Number of affected devices does not justify inferring new techniques. Map only what the telemetry supports.',
      },
    ],
  },
];

const MODULE_SIX_SOURCES_LIST = [
  {
    title: 'MITRE ATT&CK — Execution',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0002/',
    note: 'Techniques including Command and Scripting Interpreter (T1059) directly referenced in threat-hunting queries and endpoint activity analysis.',
  },
  {
    title: 'MITRE ATT&CK — Privilege Escalation and Valid Accounts',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0004/',
    note: 'Valid Accounts (T1078) technique relevant to identity-based pivots and cross-source correlation of endpoint and sign-in events.',
  },
  {
    title: 'Hunting Capabilities in Microsoft Sentinel',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/azure/sentinel/hunting',
    note: 'Practical methodology for defining a hypothesis, running queries against log data, and bookmarking decisive evidence rows.',
  },
  {
    title: 'Technical Approaches to Uncovering and Remediating Malicious Activity (AA20-245A)',
    org: 'CISA',
    url: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-245a',
    note: 'Joint government advisory on indicator searching, frequency analysis, pattern recognition, and anomaly detection across host and network evidence — the technical backbone of a hunt like this one.',
  },
  {
    title: 'What Are Risk Detections? — Microsoft Entra ID Protection',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks',
    note: 'Identity-based hunting signals directly relevant to this lab\'s sign-in source: unfamiliar sign-in properties, atypical/impossible travel, and anomalous-token detection.',
  },
  {
    title: 'Introduction to Cyber Threat Hunting',
    org: 'CrowdStrike',
    url: 'https://www.crowdstrike.com/cybersecurity-101/threat-hunting/',
    note: 'Overview of hypothesis-driven hunting methodology — forming a testable hypothesis from known TTPs, then searching an environment for matching behavior.',
  },
  {
    title: 'Security+ (SY0-701) supplementary domain reference: Threat Hunting and Monitoring',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.',
  },
];

// Sprint 7 learning loops: four existing lesson allocations are reshaped,
// not expanded. The case is fictional Mission Next Labs content and is not a
// certification, affiliation, victim, or live-indicator claim.
const MODULE_SIX_LESSONS = [
  { number: 1, title: 'Start with a testable hypothesis', scenario: 'A scheduled task named UpdateHealth runs weekly on ws-318, but no alert fired. The task launches a script from a user-writable folder. Begin with a question the available telemetry can support or disprove.', theory: 'A useful hunt hypothesis names the behavior, likely entities, time window, and evidence that would weaken it. Dormant persistence requires a bounded search, not a claim that every scheduled task is malicious.', task: 'Write one sentence stating what you will test on ws-318 and what finding would weaken the backdoor hypothesis.', questions: [
    { id: 'm06-l1-q1', prompt: 'Which is the BEST first hypothesis?', options: ['Every scheduled task is malicious.', 'UpdateHealth may recur on other workstations with the same script path and unusual author.', 'The organization is definitely compromised.', 'No alert means there is no threat.'], correct: 1, good: 'It is observable, bounded, and falsifiable.', bad: 'Name a behavior and a scope that telemetry can test.' },
    { id: 'm06-l1-q2', prompt: 'What would MOST weaken the hypothesis?', options: ['The task is documented and signed by the endpoint team.', 'The task runs weekly.', 'The task has a short name.', 'The host is online.'], correct: 0, good: 'A verified change record and signed script provide a plausible benign explanation.', bad: 'Look for evidence that explains the behavior without compromise.' },
    { id: 'm06-l1-q3', prompt: 'Why record a time window?', options: ['To make every result malicious.', 'To reduce unrelated matches and make recurrence comparable.', 'To avoid reviewing context.', 'To replace evidence.'], correct: 1, good: 'Temporal bounds reduce noise while retaining the testable question.', bad: 'A time window is a scope control, not proof.' },
  ] },
  { number: 2, title: 'Pivot from behavior to related evidence', scenario: 'The seed task points to script path C:\\ProgramData\\MissionNext\\sync.ps1. A second workstation has a similar task but a different owner. Pivot across task metadata, file path, host, account, and execution history.', theory: 'Indicators are pivots rather than verdicts. Compare context around each match: creation time, author, parent process, path, signer, account, and network behavior.', task: 'List two pivots you would add after finding the same script path on a second host, and explain why each reduces uncertainty.', questions: [
    { id: 'm06-l2-q1', prompt: 'What is the BEST use of the script path?', options: ['Treat it as proof of compromise.', 'Use it to find related tasks, then compare owners and execution context.', 'Ignore it because paths are not evidence.', 'Delete every matching file.'], correct: 1, good: 'A path narrows the hunt; surrounding behavior determines meaning.', bad: 'Pivots narrow search; they do not establish a verdict alone.' },
    { id: 'm06-l2-q2', prompt: 'Which pivot most helps distinguish a dormant backdoor from approved maintenance?', options: ['Task color in the UI.', 'Task author plus change-ticket and script signer.', 'Number of browser tabs.', 'Hostname length.'], correct: 1, good: 'Ownership and authorization context test the benign alternative.', bad: 'Prefer pivots that establish provenance and authorization.' },
    { id: 'm06-l2-q3', prompt: 'A matching path appears on ten hosts but only two run it from a user-writable location. What is the BEST scope?', options: ['All ten are confirmed compromised.', 'The two executions are priority findings; keep the others as leads.', 'Ignore all ten.', 'Close the hunt.'], correct: 1, good: 'Execution context separates leads from supported findings.', bad: 'Do not turn a broad match into a broad verdict.' },
  ] },
  { number: 3, title: 'Preserve the reasoning chain', scenario: 'The task metadata, script event, and account session are spread across three tables. A reviewer must reproduce why two hosts were escalated and three benign matches were excluded.', theory: 'A useful evidence set preserves decisive rows and the analyst reasoning that connects them. Bookmark only the minimum records needed to show recurrence, scope, and the benign comparison.', task: 'Describe the minimum evidence set you would bookmark for ws-318 and one comparison host, including the relationship between rows.', questions: [
    { id: 'm06-l3-q1', prompt: 'What belongs in the core evidence set?', options: ['Every row returned by the query.', 'Task metadata, execution event, related account/session, and a documented benign comparison.', 'Only the task name.', 'A screenshot with no query context.'], correct: 1, good: 'The chain is reproducible and includes a meaningful comparison.', bad: 'Evidence should connect behavior, scope, and reasoning.' },
    { id: 'm06-l3-q2', prompt: 'Why retain excluded benign matches?', options: ['To inflate the case.', 'To show the analyst tested an alternative explanation.', 'Because exclusions are always malicious.', 'They are required to prove attribution.'], correct: 1, good: 'A comparison supports a defensible disposition without overclaiming.', bad: 'Documented exclusions make the conclusion auditable.' },
    { id: 'm06-l3-q3', prompt: 'What makes a bookmark useful to another analyst?', options: ['It has the largest row count.', 'It records why the row matters and how it connects to the hypothesis.', 'It has a severe label.', 'It is the newest row.'], correct: 1, good: 'Reason and relationship matter more than volume or labels.', bad: 'A bookmark needs context, not just a timestamp.' },
  ] },
  { number: 4, title: 'Map only demonstrated behavior', scenario: 'The task runs a PowerShell script and opens an outbound session, but the available rows do not show delivery, credential theft, or lateral movement. Document what the telemetry proves and what remains unknown.', theory: 'Technique mapping communicates observed behavior. Scheduled Task/Job (T1053.005) and PowerShell (T1059.001) may be supported; do not infer supply-chain compromise, tool transfer, or impact without evidence.', task: 'Write a two-line handoff: one demonstrated behavior and one unknown that requires follow-up.', questions: [
    { id: 'm06-l4-q1', prompt: 'Which technique is directly supported by a recurring task execution?', options: ['T1053.005 Scheduled Task/Job.', 'T1486 Data Encrypted for Impact.', 'T1566 Phishing.', 'T1190 Exploit Public-Facing Application.'], correct: 0, good: 'The task execution is directly observed.', bad: 'Map the mechanism shown, not an assumed delivery or impact stage.' },
    { id: 'm06-l4-q2', prompt: 'What is the MOST defensible statement about the outbound session?', options: ['It proves data theft.', 'It is a lead for network review; transfer and purpose are not shown.', 'It proves ransomware.', 'It should be ignored.'], correct: 1, good: 'A connection is evidence for follow-up, not proof of transfer or impact.', bad: 'Separate observed connection from unobserved content or intent.' },
    { id: 'm06-l4-q3', prompt: 'What is the BEST handoff disposition?', options: ['Escalate the two supported host-task pairs and preserve evidence.', 'Wipe the entire fleet immediately.', 'Close because no alert fired.', 'Publish an operator attribution.'], correct: 0, good: 'The response is proportionate to the supported scope.', bad: 'Hunting findings need bounded escalation and preserved evidence.' },
  ] },
];

const MODULE_SIX_ENDPOINT_ROWS = [
  { id: 'EP-601', time: '08:31', device: 'WS-214', account: 'acct-27', process: 'doc-reader.exe', parent: 'explorer.exe', fileHash: 'ddd…', remoteIp: 'None', action: 'Opened benefits-guide.pdf', detail: 'The signed document reader opened a locally downloaded PDF. No child process or network action followed.', relevant: false },
  { id: 'EP-602', time: '08:42', device: 'WS-214', account: 'acct-27', process: 'script-runner.exe', parent: 'doc-reader.exe', fileHash: 'aaa…', remoteIp: '203.0.113.77', action: 'Encoded command and outbound connection', detail: 'An unsigned script host started beneath the document reader, used an encoded argument, and contacted the seed destination.', relevant: true },
  { id: 'EP-603', time: '08:51', device: 'WS-105', account: 'system', process: 'update-agent.exe', parent: 'services.exe', fileHash: 'bbb…', remoteIp: '198.51.100.20', action: 'Approved updater check', detail: 'The signed update agent contacted its registered test endpoint during the approved maintenance window.', relevant: false },
  { id: 'EP-604', time: '09:06', device: 'WS-332', account: 'acct-41', process: 'script-runner.exe', parent: 'mail-viewer.exe', fileHash: 'aaa…', remoteIp: '203.0.113.77', action: 'Encoded command and outbound connection', detail: 'The same unsigned file fingerprint and destination appeared beneath a different content-viewing process on a second device.', relevant: true },
  { id: 'EP-605', time: '09:12', device: 'WS-406', account: 'acct-18', process: 'inventory-script.exe', parent: 'management-agent.exe', fileHash: 'ccc…', remoteIp: 'None', action: 'Hardware inventory collected', detail: 'A signed inventory script ran from the managed tools directory under the expected service parent.', relevant: false },
  { id: 'EP-606', time: '09:18', device: 'WS-214', account: 'acct-27', process: 'browser.exe', parent: 'explorer.exe', fileHash: 'eee…', remoteIp: '203.0.113.41', action: 'Training site opened', detail: 'The browser visited the organization training site. The destination differs from the seed indicator.', relevant: false },
  { id: 'EP-607', time: '09:24', device: 'WS-118', account: 'acct-52', process: 'sheet-app.exe', parent: 'explorer.exe', fileHash: 'fff…', remoteIp: 'None', action: 'Quarterly workbook opened', detail: 'A signed productivity application opened a local workbook without spawning unusual children.', relevant: false },
];

const MODULE_SIX_SIGNIN_ROWS = [
  { id: 'ID-610', time: '08:22', account: 'acct-52', device: 'WS-118', sourceIp: '198.51.100.34', result: 'Success', session: 'Managed browser', detail: 'Normal workday access from the account\'s registered device and office egress range.', relevant: false },
  { id: 'ID-611', time: '08:39', account: 'acct-27', device: 'WS-214', sourceIp: '192.0.2.44', result: 'Success', session: 'Managed desktop', detail: 'The account signed in from its registered workstation shortly before the endpoint event.', relevant: false },
  { id: 'ID-612', time: '08:47', account: 'acct-27', device: 'WS-214', sourceIp: '203.0.113.77', result: 'Token refresh', session: 'Unfamiliar client', detail: 'A new client refreshed the account session from the same seed address five minutes after the script activity.', relevant: true },
  { id: 'ID-613', time: '08:54', account: 'backup-job', device: 'SRV-008', sourceIp: '192.0.2.80', result: 'Success', session: 'Non-interactive', detail: 'The backup identity authenticated from its registered server during the normal archive window.', relevant: false },
  { id: 'ID-614', time: '09:10', account: 'acct-41', device: 'WS-332', sourceIp: '203.0.113.77', result: 'Token refresh', session: 'Unfamiliar client', detail: 'The same source address refreshed a second account session four minutes after the matching endpoint event.', relevant: true },
  { id: 'ID-615', time: '09:16', account: 'acct-18', device: 'WS-406', sourceIp: '198.51.100.61', result: 'Success', session: 'Managed desktop', detail: 'Routine access from the inventory operator\'s registered device and office egress range.', relevant: false },
];

const MODULE_SIX_SOURCES = {
  endpoint: {
    label: 'Endpoint activity', table: 'EndpointActivity', icon: 'ri-computer-line',
    prompt: 'Find every device that executed the seed file fingerprint.',
    expectedField: 'FileHash', expectedValue: 'aaa…', rows: MODULE_SIX_ENDPOINT_ROWS,
  },
  signin: {
    label: 'Sign-in activity', table: 'SignInActivity', icon: 'ri-user-follow-line',
    prompt: 'Find every identity session associated with the seed destination.',
    expectedField: 'SourceIp', expectedValue: '203.0.113.77', rows: MODULE_SIX_SIGNIN_ROWS,
  },
};

const MODULE_SIX_EXPECTED_BOOKMARKS = ['EP-602', 'EP-604', 'ID-612', 'ID-614'];

// Standard Incident / Case Record (docs/specs/MODULE_STANDARD.md §7.2). Module 06 has
// two catalog-graded Prove It submissions — `m06-form` (catalog key
// MODULE_SIX_CATALOG_LAB_KEY, 'lab-threat-hunt') and `m06-independent-form`
// (catalog key 'lab-threat-hunt-independent') — both call recordLabAttempt()
// for a real catalog lab key (see LABS in data.js), so both are in scope.
// The Stage 1/2 hypothesis + two-source query workbench above the first
// ticket stay exactly as-is (they are evidence, not the graded artifact);
// only the two forms migrate.
const MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY = 'lab-threat-hunt-independent';
const MODULE_SIX_HUNT_CASE_ID = 'HNT-6214';
const MODULE_SIX_BACKDOOR_CASE_ID = 'BKD-6318';
const MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD = 40;

const MODULE_SIX_HUNT_ENTITY_ROSTER = {
  users: [
    { id: 'acct-27', text: 'acct-27 (WS-214, seed pair)', tier: 'principal' },
    { id: 'acct-41', text: 'acct-41 (WS-332, second pair)', tier: 'pivot' },
    { id: 'acct-18', text: 'acct-18', tier: 'noise' },
    { id: 'acct-52', text: 'acct-52', tier: 'noise' },
    { id: 'backup-job', text: 'backup-job', tier: 'noise' },
    { id: 'acct-63', text: 'acct-63', tier: 'noise' },
    { id: 'acct-77', text: 'acct-77', tier: 'noise' },
  ],
  devices: [
    { id: 'WS-214', text: 'WS-214 (seed device)', tier: 'principal' },
    { id: 'WS-332', text: 'WS-332 (second matching device)', tier: 'pivot' },
    { id: 'WS-105', text: 'WS-105 (approved signed updater)', tier: 'noise' },
    { id: 'WS-406', text: 'WS-406 (managed inventory script)', tier: 'noise' },
    { id: 'WS-118', text: 'WS-118', tier: 'noise' },
    { id: 'SRV-008', text: 'SRV-008 (backup server)', tier: 'noise' },
    { id: 'WS-020', text: 'WS-020', tier: 'noise' },
  ],
};

const MODULE_SIX_HUNT_DEPARTMENT_OPTIONS = [
  { id: 'detection-engineering', text: 'Detection Engineering', fit: 100, note: 'Best fit — Detection Engineering issued the fleet-wide bulletin and owns the scoped hunt findings.' },
  { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 65, note: 'Acceptable — Tier 2 can continue monitoring the scoped pairs, but Detection Engineering owns the bulletin follow-up.' },
  { id: 'identity-response', text: 'Identity Response', fit: 30, note: 'Weak fit — the unfamiliar sessions are a supporting signal, not the primary compromise vector here.', bounce: 'Identity Response is not the primary owner of a scoped script-execution hunt; route to Detection Engineering.' },
  { id: 'help-desk', text: 'IT Help Desk', fit: 10, note: 'Not a fit — this is a confirmed, scoped malicious pattern, not a routine help-desk ticket.', bounce: 'Help Desk cannot action a cross-device threat-hunt finding; this needs Detection Engineering.' },
];

const MODULE_SIX_BACKDOOR_ENTITY_ROSTER = {
  users: [
    { id: 'acct-184', text: 'acct-184 (created the UpdateHealth task on ws-318)', tier: 'principal' },
    { id: 'svc-patch', text: 'svc-patch (created the signed comparison-host task)', tier: 'pivot' },
    { id: 'acct-27', text: 'acct-27', tier: 'noise' },
    { id: 'acct-41', text: 'acct-41', tier: 'noise' },
    { id: 'acct-18', text: 'acct-18', tier: 'noise' },
    { id: 'acct-52', text: 'acct-52', tier: 'noise' },
  ],
  devices: [
    { id: 'ws-318', text: 'ws-318 (UpdateHealth task, user-writable path)', tier: 'principal' },
    { id: 'ws-355', text: 'ws-355 (comparison host, signed maintenance script)', tier: 'pivot' },
    { id: 'WS-214', text: 'WS-214', tier: 'noise' },
    { id: 'WS-332', text: 'WS-332', tier: 'noise' },
    { id: 'WS-105', text: 'WS-105', tier: 'noise' },
    { id: 'WS-406', text: 'WS-406', tier: 'noise' },
  ],
};

const MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS = [
  { id: 'endpoint-response', text: 'Endpoint/EDR Response', fit: 100, note: 'Best fit — a dormant scheduled-task persistence mechanism needs to be contained and removed from the endpoint.' },
  { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 65, note: 'Acceptable — Tier 2 can continue investigation, but endpoint containment still needs an EDR-focused owner.' },
  { id: 'identity-response', text: 'Identity Response', fit: 30, note: 'Weak fit — no credential compromise is evidenced; this is a persistence mechanism on one endpoint.', bounce: 'Identity Response cannot remove a scheduled-task persistence entry; route to Endpoint/EDR Response.' },
  { id: 'help-desk', text: 'IT Help Desk', fit: 10, note: 'Not a fit — this is a suspected dormant backdoor, not a routine help-desk ticket.', bounce: 'Help Desk cannot contain a scheduled-task backdoor; this needs Endpoint/EDR Response.' },
];

const MODULE_SIX_EVIDENCE_PRIORITY_FINDING_OPTIONS = [
  { id: 'task-metadata', text: 'Task author, trigger, path, signer, and creation time' },
  { id: 'all-logs', text: 'Every log row in the tenant' },
  { id: 'alert-only', text: 'Only generated alerts' },
];

const MODULE_SIX_SCOPE_ASSESSMENT_FINDING_OPTIONS = [
  { id: 'ws318-only', text: 'ws-318 is supported; the signed maintenance host is a comparison' },
  { id: 'fleet-wide', text: 'Every host with the task name is compromised' },
  { id: 'no-scope', text: 'No scope because no alert fired' },
];

const MODULE_SIX_RESPONSE_ACTION_FINDING_OPTIONS = [
  { id: 'escalate', text: 'Escalate ws-318 for approved containment and preserve the task/script evidence' },
  { id: 'wipe', text: 'Wipe every host immediately' },
  { id: 'close', text: 'Close as benign because no alert exists' },
];

function moduleSixHuntCaseSpec() {
  return {
    caseId: MODULE_SIX_HUNT_CASE_ID,
    userOptions: MODULE_SIX_HUNT_ENTITY_ROSTER.users,
    deviceOptions: MODULE_SIX_HUNT_ENTITY_ROSTER.devices,
    departmentOptions: MODULE_SIX_HUNT_DEPARTMENT_OPTIONS,
    notesMin: 120,
    notesPlaceholder: 'Hypothesis result: … Scope: … Evidence: … Recommended next step: …',
    findingsHtml: moduleSixHuntFindingsHtml(),
    extraMissing: moduleSixHuntExtraMissing(),
  };
}

// Stage 3-5 kept exactly as before (device/account scope, IOC
// interpretation, ATT&CK mapping, next action) — rendered as findingsHtml
// inside the same ticket form and wired through the existing change/click
// handlers in wireModuleSixGuidedLab, so no behavior changes here.
function moduleSixHuntFindingsHtml() {
  const devices = [
    { id: 'WS-214', label: 'WS-214', help: 'Seed device with the first matching process chain.' },
    { id: 'WS-332', label: 'WS-332', help: 'Second device with the same fingerprint and destination.' },
    { id: 'WS-105', label: 'WS-105', help: 'Approved signed updater activity.' },
    { id: 'WS-406', label: 'WS-406', help: 'Managed inventory script with a different fingerprint.' },
  ];
  const accounts = [
    { id: 'acct-27', label: 'acct-27', help: 'Session and endpoint activity align on WS-214.' },
    { id: 'acct-41', label: 'acct-41', help: 'Session and endpoint activity align on WS-332.' },
    { id: 'acct-18', label: 'acct-18', help: 'Routine access on an inventory workstation.' },
    { id: 'acct-52', label: 'acct-52', help: 'Normal document and sign-in activity.' },
  ];
  const techniques = [
    { id: 'T1059', label: 'T1059 · Command and Scripting Interpreter', help: 'Supported by the encoded script-host execution.' },
    { id: 'T1105', label: 'T1105 · Ingress Tool Transfer', help: 'The data proves a connection, but not a file transfer.' },
    { id: 'T1078', label: 'T1078 · Valid Accounts', help: 'Supported by active account sessions from the shared unusual source.' },
    { id: 'T1566', label: 'T1566 · Phishing', help: 'A content viewer is present, but message-delivery evidence is not in this lab.' },
  ];
  return `<fieldset class="m06-fieldset"><legend><span>1</span> Scope the affected devices</legend><p class="m06-help">Choose every device with the matching suspicious behavior.</p>${moduleSixCheckboxGroup('scopedDevices', devices, moduleSixState.scopedDevices)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>2</span> Scope the affected identities</legend><p class="m06-help">Choose every account supported by both timing and entity context.</p>${moduleSixCheckboxGroup('scopedAccounts', accounts, moduleSixState.scopedAccounts)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>3</span> Interpret the indicator relationship</legend><p class="m06-help">Indicators are pivots. Explain what their recurrence contributes.</p>${moduleSixRadioGroup('iocRelationship', [
      { id: 'corroborates', label: 'The shared fingerprint and destination corroborate one recurring behavior pattern.', help: 'The process, device, identity, and time context make the recurrence meaningful.' },
      { id: 'ip-proves', label: 'The destination alone proves every matching device is compromised.', help: 'An address match without behavior and context is not enough.' },
      { id: 'unrelated', label: 'The rows are unrelated because they occur on different devices.', help: 'Cross-device recurrence is exactly what this hunt is testing.' },
    ])}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>4</span> Map demonstrated ATT&amp;CK behavior</legend><p class="m06-help">Choose the two techniques directly supported by these two sources; do not infer delivery or download behavior that is absent.</p>${moduleSixCheckboxGroup('techniques', techniques, moduleSixState.techniques)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>5</span> Recommend the next action</legend>${moduleSixRadioGroup('nextAction', [
      { id: 'scoped-escalation', label: 'Escalate the two pairs for approved containment, preserve bookmarks, and continue a scoped indicator-and-behavior hunt.', help: 'This is proportionate to the validated scope and keeps evidence available.' },
      { id: 'wipe-all', label: 'Immediately wipe every device in the dataset.', help: 'This exceeds the observed scope and analyst authority.' },
      { id: 'close', label: 'Close the hunt because no alert fired on WS-332.', help: 'Threat hunting exists to find relevant behavior beyond current alerts.' },
    ])}</fieldset>`;
}

function moduleSixHuntExtraMissing() {
  const missing = [];
  if (!moduleSixState.hypothesis) missing.push('Choose a testable hypothesis in Stage 1');
  if (!moduleSixState.queryRuns.endpoint || !moduleSixState.queryRuns.signin) missing.push('Run both source queries in Stage 2');
  if (!moduleSixState.bookmarks.length) missing.push('Bookmark the decisive evidence in Stage 2');
  if (!moduleSixState.scopedDevices.length || !moduleSixState.scopedAccounts.length) missing.push('Scope the affected devices and identities');
  if (!moduleSixState.iocRelationship) missing.push('Interpret the indicator relationship');
  if (!moduleSixState.techniques.length) missing.push('Map demonstrated ATT&CK behavior');
  if (!moduleSixState.nextAction) missing.push('Recommend the next action');
  return missing;
}

function moduleSixProveItRedoRequested() {
  return moduleSixUser?.openLabRedosByModuleKey?.['soc-06']?.labKey === MODULE_SIX_CATALOG_LAB_KEY;
}

function moduleSixProveItReviewStatus() {
  if (!moduleSixState?.caseRecord?.submitted) return '';
  const attempt = moduleSixUser?.latestLabAttemptByKey?.[MODULE_SIX_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleSixProveItRedoFeedback() {
  if (!moduleSixProveItRedoRequested()) return '';
  const items = moduleSixUser.openLabRedosByModuleKey['soc-06'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

// The Independent Assessment Lab ticket (m06-independent-form) has its own
// redo/review tracking under the second catalog key.
function moduleSixIndependentRedoRequested() {
  return moduleSixUser?.openLabRedosByModuleKey?.['soc-06-independent']?.labKey === MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY;
}

function moduleSixIndependentReviewStatus() {
  if (!moduleSixState?.independentLab?.caseRecord?.submitted) return '';
  const attempt = moduleSixUser?.latestLabAttemptByKey?.[MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleSixIndependentRedoFeedback() {
  if (!moduleSixIndependentRedoRequested()) return '';
  const items = moduleSixUser.openLabRedosByModuleKey['soc-06-independent'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

function moduleSixBackdoorCaseSpec() {
  return {
    caseId: MODULE_SIX_BACKDOOR_CASE_ID,
    userOptions: MODULE_SIX_BACKDOOR_ENTITY_ROSTER.users,
    deviceOptions: MODULE_SIX_BACKDOOR_ENTITY_ROSTER.devices,
    departmentOptions: MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS,
    notesMin: 60,
    notesPlaceholder: 'Observed behavior… comparison… bounded next action…',
    findings: [
      { name: 'evidencePriority', label: 'Evidence to prioritize', options: MODULE_SIX_EVIDENCE_PRIORITY_FINDING_OPTIONS, missing: 'Choose the evidence to prioritize' },
      { name: 'scopeAssessment', label: 'Current scope', options: MODULE_SIX_SCOPE_ASSESSMENT_FINDING_OPTIONS, missing: 'Assess the current scope' },
      { name: 'responseAction', label: 'Recommended response action', options: MODULE_SIX_RESPONSE_ACTION_FINDING_OPTIONS, missing: 'Recommend a response action' },
    ],
    extraMissing: !missionNextAllLabsComplete(moduleSixState.labProgress, ['additional-1', 'additional-2', 'additional-3']) ? ['Mark all required imported labs complete'] : [],
  };
}

// Hunt Lab (m06-form) scoring: queries/bookmarks/hypothesis/scope/ioc/attack
// keep their pre-migration weights (observation 30 + analysis 30 = 60,
// unchanged); the remaining 40 points now cover the standard ticket fields
// that did not exist pre-migration (entity, severity, escalation) plus the
// pre-existing decision/communication content (disposition, next action,
// notes), rebalanced to fit.
function moduleSixHuntCaseScore() {
  const cr = moduleSixState.caseRecord;
  const queries = (moduleSixState.queryPassed.endpoint ? 5 : 0) + (moduleSixState.queryPassed.signin ? 5 : 0);
  const bookmarks = moduleSixExactSelection(moduleSixState.bookmarks, MODULE_SIX_EXPECTED_BOOKMARKS, 20);
  const hypothesis = moduleSixState.hypothesis === 'recurrence' ? 8 : 0;
  const deviceScope = moduleSixExactSelection(moduleSixState.scopedDevices, ['WS-214', 'WS-332'], 6);
  const accountScope = moduleSixExactSelection(moduleSixState.scopedAccounts, ['acct-27', 'acct-41'], 6);
  const scope = deviceScope + accountScope;
  const ioc = moduleSixState.iocRelationship === 'corroborates' ? 4 : 0;
  const attack = moduleSixExactSelection(moduleSixState.techniques, ['T1059', 'T1078'], 6);
  const observation = queries + bookmarks;
  const analysis = hypothesis + scope + ioc + attack;

  const roster = MODULE_SIX_HUNT_ENTITY_ROSTER;
  const userTier = roster.users.find((entry) => entry.id === cr.affectedUser)?.tier;
  const deviceTier = roster.devices.find((entry) => entry.id === cr.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 4); // 0-8

  const severity = caseRecordSeverity(cr);
  const severityPoints = severity === 'high' ? 4 : 0;

  const disposition = caseRecordDisposition(cr);
  const dispositionPoints = disposition === 'true-positive' ? 8 : 0;

  const department = MODULE_SIX_HUNT_DEPARTMENT_OPTIONS.find((option) => option.id === cr.escalateTo) || null;
  const escalationRequiredOk = cr.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD;
  const escalationPoints = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 8) : 0;

  const action = moduleSixState.nextAction === 'scoped-escalation' ? 6 : 0;

  const notesLen = (cr.notes || '').trim().length;
  const notesPoints = notesLen >= 120 ? 6 : 0;

  const decision = dispositionPoints + escalationPoints + action;
  const communication = entityPoints + severityPoints + notesPoints;
  const score = observation + analysis + decision + communication;
  const criticalErrors = cr.escalation === 'not-required' ? ['escalation-not-required'] : [];

  return {
    score,
    breakdown: { observation, queries, bookmarks, analysis, hypothesis, scope, ioc, attack, entity: entityPoints, severity: severityPoints, disposition: dispositionPoints, escalation: escalationPoints, action, analyst_notes: notesPoints },
    department, bounced,
    feedback: [
      queries === 10 ? 'Queries: Both scoped pivots returned the two chronological matches expected.' : `Queries: ${queries}/10. Run the endpoint fingerprint query and sign-in source-address query with an ascending time sort.`,
      bookmarks === 20 ? 'Bookmarks: Correct. Four records preserve the two endpoint executions and their two identity-session correlations.' : `Bookmarks: ${bookmarks}/20. Keep EP-602, EP-604, ID-612, and ID-614; unrelated baseline rows weaken the evidence set.`,
      hypothesis ? 'Hypothesis: Testable and correctly framed around recurrence beyond the seed device.' : 'Hypothesis: Frame the hunt around whether the same suspicious script behavior recurred on another device.',
      scope === 12 ? 'Scope: Correctly limited to WS-214/acct-27 and WS-332/acct-41.' : `Scope: ${scope}/12. Select only the two device-account pairs supported by matching behavior and timing.`,
      ioc && attack === 6 ? 'IOC and ATT&CK analysis: Correct. The recurring indicators corroborate the pattern; scripting and valid-account use are directly demonstrated.' : `IOC and ATT&CK analysis: ${ioc + attack}/10. Correlate indicators with context and map only scripting plus valid-account use.`,
      entityPoints >= 8 ? 'Affected entity/scope: correct — acct-27 and WS-214 are the confirmed seed pair.' : 'Affected entity/scope: review — acct-27 and WS-214 are the confirmed seed pair; acct-41/WS-332 is the second pair, not the seed.',
      severityPoints ? 'Severity: correct — High.' : 'Severity: review — a recurring cross-device execution pattern with active sessions is High severity.',
      dispositionPoints ? 'Disposition: correct — confirmed malicious activity.' : 'Disposition: review — the recurring pattern is confirmed malicious activity, not a false positive.',
      escalationPoints >= 8 ? 'Routing: correct — Detection Engineering is the best-fit department for this bulletin follow-up.' : department ? `Routing: ${department.fit >= MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD ? 'accepted, but not the best fit' : 'returned'} — ${department.bounce || department.note}` : 'Routing: review — this case needs a department routed with the recorded evidence.',
      action ? 'Decision: Proportionate. Escalate the scoped pairs, preserve evidence, and continue the focused hunt.' : 'Decision: Avoid enterprise-wide claims or destructive actions beyond the current evidence.',
      notesPoints ? 'Handoff: Notes meet the 120-character bar.' : 'Handoff: Include a conclusion, both device-account pairs, one validated indicator, and a proportionate recommendation in at least 120 characters.',
    ],
    criticalErrors,
  };
}

// Independent Assessment Lab (m06-independent-form) scoring: Module 01
// weights (entity 20, severity 15, disposition 15... rebalanced to include
// the three domain findings that replace the old free-form task/scope/
// disposition selects) — 100 total, unchanged 70% pass bar.
function moduleSixBackdoorCaseScore() {
  const cr = moduleSixState.independentLab.caseRecord;
  const roster = MODULE_SIX_BACKDOOR_ENTITY_ROSTER;
  const userTier = roster.users.find((entry) => entry.id === cr.affectedUser)?.tier;
  const deviceTier = roster.devices.find((entry) => entry.id === cr.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10); // 0-20

  const severity = caseRecordSeverity(cr);
  const severityPoints = severity === 'high' ? 10 : 0;

  const disposition = caseRecordDisposition(cr);
  const dispositionPoints = disposition === 'true-positive' ? 15 : 0;

  const department = MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS.find((option) => option.id === cr.escalateTo) || null;
  const escalationRequiredOk = cr.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD;
  const escalationPoints = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 20) : 0;

  const findings = cr.findings || {};
  const evidencePoints = findings.evidencePriority === 'task-metadata' ? 5 : 0;
  const scopePoints = findings.scopeAssessment === 'ws318-only' ? 5 : 0;
  const responsePoints = findings.responseAction === 'escalate' ? 5 : 0;
  const domainFindingsPoints = evidencePoints + scopePoints + responsePoints;

  const notesLen = (cr.notes || '').trim().length;
  const notesPoints = Math.round(Math.min(1, notesLen / 60) * 20);

  const score = entityPoints + severityPoints + dispositionPoints + escalationPoints + domainFindingsPoints + notesPoints;
  const criticalErrors = cr.escalation === 'not-required' ? ['escalation-not-required'] : [];

  return {
    score,
    breakdown: { affected_entity: entityPoints, severity: severityPoints, disposition: dispositionPoints, escalation: escalationPoints, domain_findings: domainFindingsPoints, analyst_notes: notesPoints },
    department, bounced,
    feedback: [
      entityPoints >= 20 ? 'Affected entity/scope: correct — acct-184 and ws-318 are the confirmed pair.' : 'Affected entity/scope: review — acct-184 and ws-318 are the confirmed pair; svc-patch/ws-355 is the signed comparison, not the confirmed pair.',
      severityPoints ? 'Severity: correct — High.' : 'Severity: review — a dormant backdoor with active persistence is High severity.',
      dispositionPoints ? 'Disposition: correct — confirmed malicious activity.' : 'Disposition: review — the unsigned, user-writable, weekly-triggered task is confirmed malicious activity, not benign administration.',
      evidencePoints ? 'Evidence priority: correct.' : 'Evidence priority: prioritize task author, trigger, path, signer, and creation time.',
      scopePoints ? 'Scope: correct — ws-318 is supported; the signed maintenance host is a comparison, not a second confirmed host.' : 'Scope: review — ws-318 is supported; the signed maintenance host is a benign comparison, not fleet-wide compromise.',
      responsePoints ? 'Response action: correct — escalate ws-318 for approved containment and preserve evidence.' : 'Response action: escalate ws-318 for approved containment and preserve evidence; do not wipe broadly or close without review.',
      department ? (escalationPoints >= 20 ? 'Routing: correct — Endpoint/EDR Response is the best-fit department for this case.' : `Routing: ${department.fit >= MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD ? 'accepted, but not the best fit' : 'returned'} — ${department.bounce || department.note}`) : 'Routing: review — this case needs a department routed with the recorded evidence.',
    ],
    criticalErrors,
  };
}

const MODULE_SIX_DEFAULT_STATE = {
  lessonWork: {},
  independentLab: {
    task: '', owner: '', scope: '', disposition: '', rationale: '', completed: false, score: 0,
    // Standard Incident / Case Record for the m06-independent-form Prove It
    // submission (docs/specs/MODULE_STANDARD.md §7.2).
    caseRecord: { status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
  },
  hypothesis: '',
  activeSource: 'endpoint',
  queryDrafts: {
    endpoint: 'EndpointActivity\n| where FileHash == ""\n| sort by TimeGenerated asc',
    signin: 'SignInActivity\n| where SourceIp == ""\n| sort by TimeGenerated asc',
  },
  queryRuns: { endpoint: 0, signin: 0 },
  queryPassed: { endpoint: false, signin: false },
  queryResultIds: { endpoint: [], signin: [] },
  queryFeedback: { endpoint: '', signin: '' },
  selectedEvidence: [],
  bookmarks: [],
  detailEvent: '',
  scopedDevices: [],
  scopedAccounts: [],
  iocRelationship: '',
  techniques: [],
  disposition: '',
  nextAction: '',
  notes: '',
  breakdown: null,
  attempts: 0,
  score: 0,
  bestScore: 0,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  labProgress: {},
  // Standard Incident / Case Record for the m06-form Prove It submission
  // (docs/specs/MODULE_STANDARD.md §7.2).
  caseRecord: { status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, submittedAt: '', actionHistory: [] },
};

let moduleSixState = null;
let moduleSixUser = null;
let moduleSixReviewMode = false;
let moduleSixQuizState = null;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleSixQuizVerifiedElsewhere()).
let moduleSixQuizForceRetake = false;
let moduleSixProveItShowMissing = false;
let moduleSixIndependentProveItShowMissing = false;

function moduleSixFreshDefaults() {
  // LabRuntime intentionally performs a shallow merge. This lab has nested
  // query state, so clone its defaults to keep a reset truly pristine.
  return JSON.parse(JSON.stringify(MODULE_SIX_DEFAULT_STATE));
}

function moduleSixLoad(user) {
  if (moduleSixUser?.email !== user?.email) moduleSixQuizForceRetake = false;
  moduleSixUser = user;
  const defaults = moduleSixFreshDefaults();
  moduleSixState = LabRuntime.loadCaseState(MODULE_SIX_LAB_ID, 'soc-06', user, defaults);
  moduleSixState.queryDrafts = { ...defaults.queryDrafts, ...(moduleSixState.queryDrafts || {}) };
  moduleSixState.queryRuns = { ...defaults.queryRuns, ...(moduleSixState.queryRuns || {}) };
  moduleSixState.queryPassed = { ...defaults.queryPassed, ...(moduleSixState.queryPassed || {}) };
  moduleSixState.queryResultIds = { ...defaults.queryResultIds, ...(moduleSixState.queryResultIds || {}) };
  moduleSixState.queryFeedback = { ...defaults.queryFeedback, ...(moduleSixState.queryFeedback || {}) };
  moduleSixState.lessonWork = { ...defaults.lessonWork, ...(moduleSixState.lessonWork || {}) };
  moduleSixState.independentLab = { ...defaults.independentLab, ...(moduleSixState.independentLab || {}) };
  if (typeof moduleSixState.notes !== 'string') moduleSixState.notes = '';
  if (!moduleSixState.labProgress || typeof moduleSixState.labProgress !== 'object') moduleSixState.labProgress = {};
  ['selectedEvidence', 'bookmarks', 'scopedDevices', 'scopedAccounts', 'techniques', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleSixState[key])) moduleSixState[key] = [];
  });

  // Standard case records — init/migrate both tickets; never crash on an
  // old saved shape.
  if (!moduleSixState.caseRecord || typeof moduleSixState.caseRecord !== 'object') {
    moduleSixState.caseRecord = JSON.parse(JSON.stringify(MODULE_SIX_DEFAULT_STATE.caseRecord));
  }
  if (!moduleSixState.independentLab.caseRecord || typeof moduleSixState.independentLab.caseRecord !== 'object') {
    moduleSixState.independentLab.caseRecord = JSON.parse(JSON.stringify(MODULE_SIX_DEFAULT_STATE.independentLab.caseRecord));
  }
  [moduleSixState.caseRecord, moduleSixState.independentLab.caseRecord].forEach((cr) => {
    ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
      if (typeof cr[key] !== 'string') cr[key] = '';
    });
    if (!cr.findings || typeof cr.findings !== 'object') cr.findings = {};
    if (!Array.isArray(cr.actionHistory)) cr.actionHistory = [];
    if (typeof cr.submitted !== 'boolean') cr.submitted = false;
  });
  // Backward compat: a pre-migration hunt submission recorded only
  // `attempts`/`completed` on the old free-form m06-form. Treat it as
  // already submitted so the student sees Lab Under Review / Lab Graded
  // instead of a blank ticket — never re-open work already sent to faculty.
  if (!moduleSixState.caseRecord.submitted && Number(moduleSixState.attempts) > 0) {
    moduleSixState.caseRecord.submitted = true;
    moduleSixState.caseRecord.submittedAt = moduleSixState.lastSubmittedAt || new Date().toISOString();
    if (!moduleSixState.caseRecord.notes) moduleSixState.caseRecord.notes = moduleSixState.notes || '';
  }
  // Same backward compat for the pre-migration m06-independent-form, which
  // only recorded `score`/`completed` (no `attempts` counter of its own —
  // any prior score means a submission happened).
  if (!moduleSixState.independentLab.caseRecord.submitted && Number(moduleSixState.independentLab.score) > 0) {
    moduleSixState.independentLab.caseRecord.submitted = true;
    moduleSixState.independentLab.caseRecord.submittedAt = moduleSixState.independentLab.submittedAt || new Date().toISOString();
    if (!moduleSixState.independentLab.caseRecord.notes) moduleSixState.independentLab.caseRecord.notes = moduleSixState.independentLab.rationale || '';
  }
  // The returned attempt remains immutable in lab_attempts; its saved
  // case-state latch must not make the working case permanently unsubmitable.
  // Scope this reset to an open redo for the exact lab (see Module 01).
  if (moduleSixProveItRedoRequested() && moduleSixState.caseRecord.submitted === true) {
    moduleSixState.caseRecord.submitted = false;
    moduleSixState.caseRecord.submittedAt = '';
    moduleSixSave();
  }
  if (moduleSixIndependentRedoRequested() && moduleSixState.independentLab.caseRecord.submitted === true) {
    moduleSixState.independentLab.caseRecord.submitted = false;
    moduleSixState.independentLab.caseRecord.submittedAt = '';
    moduleSixSave();
  }

  // Initialize quiz state
  if (!moduleSixQuizState) {
    const previousQuestionIds = moduleSixState.lastQuizQuestionIds || [];
    moduleSixQuizState = createQuizAttempt(MODULE_SIX_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-06');
  return moduleSixState;
}

function moduleSixSave() {
  if (moduleSixUser && moduleSixState) LabRuntime.saveCaseState(MODULE_SIX_LAB_ID, 'soc-06', moduleSixUser, moduleSixState);
}

function moduleSixGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: MODULE_SIX_LESSONS.every((lesson) => moduleSixLessonComplete(lesson)), scrollId: 'm06-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleSixQuizState?.passed, scrollId: 'm06-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleSixState.completed, scrollId: 'm06-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleSixState.independentLab.completed, scrollId: 'm06-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm06-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm06-sources', gated: false, supplemental: true },
  ];
}

function moduleSixGetQuickNavItems() {
  const items = [];
  MODULE_SIX_LESSONS.forEach((lesson) => {
    const isComplete = moduleSixLessonComplete(lesson);
    items.push({
      id: `m06-lesson-${String(lesson.number).padStart(2, '0')}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m06-lesson-${String(lesson.number).padStart(2, '0')}`,
      lessonNumber: lesson.number,
    });
  });
  items.push({
    id: 'm06-guided-lab',
    title: 'Guided Lab',
    kind: 'lab',
    isComplete: moduleSixState.completed === true,
    scrollId: 'm06-guided-lab',
  });
  items.push({
    id: 'm06-assessment-lab',
    title: 'Assessment Lab',
    kind: 'lab',
    isComplete: moduleSixState.independentLab.completed === true,
    scrollId: 'm06-assessment-lab',
  });
  return items;
}

function moduleSixLessonWork(number) {
  return moduleSixState.lessonWork[String(number)] || {};
}

function moduleSixLessonComplete(lesson) {
  const work = moduleSixLessonWork(lesson.number);
  return Boolean(work.taskDone && lesson.questions.every((question) => work.answers?.[question.id] === question.correct));
}

function moduleSixLessonLoops() {
  return `<div class="m06-lesson-grid mf-lesson-grid" id="m06-lessons">${MODULE_SIX_LESSONS.map((lesson) => {
    const work = moduleSixLessonWork(lesson.number);
    const complete = moduleSixLessonComplete(lesson);
    return `<details class="m06-lesson mf-lesson" ${lesson.number === 1 ? 'open' : ''} data-m06-lesson="${lesson.number}">
      <summary><span class="m06-lesson-number mf-lesson-number">${String(lesson.number).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lesson.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lesson.title)}</strong><small>${complete ? 'Complete' : 'Scenario → theory → check → applied task'}</small></span>${complete ? '<span class="mf-lesson-done" aria-label="Lesson complete"><i class="ri-check-line" aria-hidden="true"></i></span>' : ''}<i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary>
      <div class="m06-lesson-body mf-lesson-body"><div class="m06-lesson-scenario"><p class="m06-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></div><div class="m06-lesson-theory"><p class="m06-kicker">Theory</p><p>${esc(lesson.theory)}</p></div>
      <div class="m06-lesson-check"><h4>Knowledge check</h4>${lesson.questions.map((question) => { const selected = work.answers?.[question.id]; const answered = selected !== undefined; return `<fieldset><legend>${esc(question.prompt)}</legend>${question.options.map((option, index) => `<label><input type="radio" name="m06-lesson-${lesson.number}-${question.id}" data-m06-lesson-answer data-lesson="${lesson.number}" data-question="${esc(question.id)}" value="${index}" ${selected === index ? 'checked' : ''} /><span>${esc(option)}</span></label>`).join('')}${answered ? `<p class="m06-lesson-feedback ${selected === question.correct ? 'is-pass' : 'is-remediate'}" role="status">${esc(selected === question.correct ? question.good : question.bad)}</p>` : ''}</fieldset>`; }).join('')}</div>
      <div class="m06-lesson-task"><p class="m06-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea data-m06-lesson-task="${lesson.number}" rows="3" maxlength="600" placeholder="Apply the idea to this hunt…">${esc(work.taskText || '')}</textarea><button type="button" data-m06-lesson-submit="${lesson.number}">${complete ? 'Completed' : 'Mark task complete'}</button></div></div></details>`;
  }).join('')}</div>`;
}

function moduleSixQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleSixQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m06-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m06-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m06-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleSixQuizVerifiedElsewhere() {
  if (moduleSixQuizForceRetake || !moduleSixQuizState || moduleSixQuizState.scored) return false;
  if (Object.keys(moduleSixQuizState.answers || {}).length > 0) return false;
  return moduleSixUser?.remoteVerifiedModuleProgress?.['soc-06'] === true
    || moduleSixUser?.remoteModuleDetail?.['soc-06']?.quizPassed === true
    || moduleSixUser?.remoteModuleEvidence?.['soc-06']?.['knowledge-check'] === true;
}

function moduleSixQuizPanel() {
  if (!moduleSixQuizState?.selectedQuestions || moduleSixQuizState.selectedQuestions.length === 0) {
    return `<div class="m06-quiz-empty" id="m06-quiz-feedback" role="status">Loading quiz...</div>`;
  }
  if (moduleSixQuizVerifiedElsewhere()) {
    return `<form class="m06-quiz-form mf-quiz-form" id="m06-quiz-form" novalidate><section class="mf-score is-pass" id="m06-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m06-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleSixQuizState.selectedQuestions;
  const answered = Object.keys(moduleSixQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleSixQuizState.scored) {
    const passed = moduleSixQuizState.score >= 70;
    feedbackHtml = `<section class="m06-quiz-score mf-score ${passed ? 'm06-quiz-pass is-pass' : 'm06-quiz-remediate is-remediate'}" id="m06-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m06-quiz-score-heading">
        <div>
          <p class="m06-kicker">Attempt ${moduleSixQuizState.attempts} · best ${moduleSixQuizState.bestScore}/100</p>
          <h3>${moduleSixQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleSixQuizState.score}</span>
      </div>
      <ul class="m06-quiz-feedback-list">
        ${(moduleSixQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm06-quiz-feedback-correct' : 'm06-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m06-quiz-actions"><button type="button" class="m06-quiz-retry" data-m06-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m06-quiz-ready" id="m06-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m06-quiz-empty" id="m06-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m06-quiz-form mf-quiz-form" id="m06-quiz-form" novalidate>
    <div class="m06-panel-heading mf-panel-heading"><div><p class="m06-kicker mf-kicker">Knowledge check</p><h3 id="m06-quiz-title" tabindex="-1">Test your understanding of threat hunting</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleSixQuizQuestion(sel, idx)).join('')}
    <div class="m06-quiz-actions">
      <button class="m06-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleSixVideoScript() {
  return '';
}

function moduleSixReview() {
  return `<section class="m06-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Testable hypothesis:</strong> Name a specific behavior, entities affected, and evidence that would support or weaken it. Avoid unfalsifiable claims.</li>
      <li><strong>Indicators as pivots:</strong> File hashes, IP addresses, and domains narrow results but do not prove guilt. Context (timing, process, user, behavior) validates the match.</li>
      <li><strong>Scoped queries:</strong> Use KQL-style syntax with table name, where clause, and chronological sort. Refine if results are too broad.</li>
      <li><strong>Bookmark discipline:</strong> Select only the few rows that directly establish the hypothesis and scope. Quality evidence beats volume.</li>
      <li><strong>Demonstrated ATT&CK behavior:</strong> Map only techniques directly shown in telemetry. Avoid inferring delivery, download, or exploitation methods absent from logs.</li>
      <li><strong>Proportionate escalation:</strong> State the proven scope and recommend targeted response. This lab establishes two device-account pairs, not enterprise-wide compromise.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to form a testable hypothesis from a seed observation, query two sources with scoped filters, correlate evidence across data sources, and communicate a defensible scope and recommendation. In Module 07 and beyond, you will encounter multi-stage investigations where these skills apply across incident response workflows.</p>
  </section>`;
}

function moduleSixConcepts() {
  const concepts = [
    ['ri-lightbulb-flash-line', 'Start with a testable hypothesis', 'State an observable behavior, the entities it may affect, and what evidence would support or weaken it. A hunt is not a search for proof at any cost.'],
    ['ri-filter-3-line', 'Use indicators as pivots', 'A file fingerprint or address can narrow a first query. Then compare time, process ancestry, device, identity, and known-good context before connecting records.'],
    ['ri-bookmark-3-line', 'Bookmark the reasoning chain', 'Keep the few records that establish the behavior and scope. A useful bookmark explains why a row matters; volume is not evidence quality.'],
    ['ri-node-tree', 'Map behavior after validation', 'ATT&CK technique labels describe observed behavior. Map only what the telemetry demonstrates, then state what remains unknown.'],
  ];
  return `<div class="m06-concept-grid">${concepts.map((item) => `<article><i class="${esc(item[0])}" aria-hidden="true"></i><h3>${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div>`;
}


function moduleSixHypothesis() {
  const options = [
    { id: 'recurrence', label: 'The same suspicious script behavior may have recurred on another device.', help: 'Test whether the file fingerprint and destination join endpoint and identity evidence beyond WS-214.' },
    { id: 'all-scripts', label: 'Every script execution in the environment is malicious.', help: 'This is too broad and cannot distinguish approved administration from misuse.' },
    { id: 'identity-only', label: 'The activity is limited to failed passwords on acct-27.', help: 'The seed observation is endpoint execution and a successful session pivot, not a failed-password pattern.' },
  ];
  return `<section class="m06-panel m06-hypothesis" aria-labelledby="m06-hypothesis-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stage 1 · Frame the hunt</p><h3 id="m06-hypothesis-title">Choose a testable hypothesis</h3></div><span class="m06-status-chip">Required</span></div>
    <div class="m06-bulletin"><i class="ri-file-shield-2-line" aria-hidden="true"></i><div><strong>Why this hunt opened</strong><p>Endpoint response confirmed a document-launched, unsigned-script loader chain on WS-LAB-27 (Module 05). Detection Engineering issued a fleet-wide hunt bulletin for the same behavior — document reader spawning an unsigned script host, followed by an outbound connection — before assuming that endpoint was the only one affected.</p></div></div>
    <div class="m06-seed"><i class="ri-radar-line" aria-hidden="true"></i><div><strong>Seed observation on WS-214</strong><p>At 08:42, an unsigned <code>script-runner.exe</code> with fingerprint <code>aaa…</code> started beneath a document reader and contacted <code>203.0.113.77</code>. Determine whether this behavior recurred and define the current scope.</p></div></div>
    <fieldset class="m06-fieldset m06-hypothesis-options"><legend class="m06-visually-hidden">Hunting hypothesis</legend>
      ${options.map((option) => `<label><input type="radio" name="hypothesis" value="${esc(option.id)}" ${moduleSixState.hypothesis === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}
    </fieldset>
    <details class="m06-hint"><summary>Need a hypothesis hint?</summary><p>A useful hypothesis can be tested with available data and can be disproved. Prefer the option that names a behavior and asks whether it appears elsewhere.</p></details>
  </section>`;
}

function moduleSixRunQuery(sourceKey, query) {
  const source = MODULE_SIX_SOURCES[sourceKey];
  const text = String(query || '');
  const tableOk = new RegExp(`^\\s*${source.table}\\b`, 'i').test(text);
  const whereMatch = text.match(/where\s+([A-Za-z][A-Za-z0-9_]*)\s*==\s*["']([^"']*)["']/i);
  const field = whereMatch ? whereMatch[1] : '';
  const value = whereMatch ? whereMatch[2] : '';
  const sortOk = /\|\s*(?:sort|order)\s+by\s+TimeGenerated\s+asc\b/i.test(text);
  const fieldMap = sourceKey === 'endpoint'
    ? { FileHash: 'fileHash', DeviceName: 'device', Account: 'account', RemoteIp: 'remoteIp' }
    : { SourceIp: 'sourceIp', DeviceName: 'device', Account: 'account', Result: 'result' };
  const canonicalField = Object.keys(fieldMap).find((item) => item.toLowerCase() === field.toLowerCase());
  let rows = tableOk ? source.rows.slice() : [];
  if (canonicalField) rows = rows.filter((row) => String(row[fieldMap[canonicalField]]).toLowerCase() === value.toLowerCase());
  else if (whereMatch) rows = [];
  if (sortOk) rows.sort((left, right) => left.time.localeCompare(right.time));
  const passed = tableOk && canonicalField === source.expectedField && value === source.expectedValue && sortOk && rows.length === 2;
  return { tableOk, canonicalField, value, sortOk, rows, passed };
}

function moduleSixEndpointTable(rows) {
  return `<div class="m06-table-wrap"><table class="m06-data-table">
    <caption class="m06-visually-hidden">Synthetic endpoint activity available for hunting and bookmarking</caption>
    <thead><tr><th scope="col">Bookmark</th><th scope="col">Time</th><th scope="col">Device</th><th scope="col">Account</th><th scope="col">Process chain</th><th scope="col">File hash</th><th scope="col">Remote IP</th><th scope="col">Activity</th></tr></thead>
    <tbody>${rows.map((row) => moduleSixEndpointRow(row)).join('')}</tbody></table></div>`;
}

function moduleSixEndpointRow(row) {
  const saved = moduleSixState.bookmarks.includes(row.id);
  return `<tr class="${saved ? 'is-bookmarked' : ''}">
    <td data-label="Bookmark"><button type="button" class="m06-bookmark" data-m06-bookmark="${esc(row.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} bookmark ${esc(row.id)}"><i class="${saved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}" aria-hidden="true"></i><span>${esc(row.id)}</span></button></td>
    <td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Device"><code>${esc(row.device)}</code></td><td data-label="Account"><code>${esc(row.account)}</code></td>
    <td data-label="Process chain"><button type="button" class="m06-detail-link" data-m06-detail="${esc(row.id)}">${esc(row.parent)} → ${esc(row.process)}</button></td>
    <td data-label="File hash"><code>${esc(row.fileHash)}</code></td><td data-label="Remote IP"><code>${esc(row.remoteIp)}</code></td><td data-label="Activity">${esc(row.action)}</td>
  </tr>`;
}

function moduleSixSigninTable(rows) {
  return `<div class="m06-table-wrap"><table class="m06-data-table">
    <caption class="m06-visually-hidden">Synthetic sign-in activity available for hunting and bookmarking</caption>
    <thead><tr><th scope="col">Bookmark</th><th scope="col">Time</th><th scope="col">Account</th><th scope="col">Device</th><th scope="col">Source IP</th><th scope="col">Result</th><th scope="col">Session</th></tr></thead>
    <tbody>${rows.map((row) => moduleSixSigninRow(row)).join('')}</tbody></table></div>`;
}

function moduleSixSigninRow(row) {
  const saved = moduleSixState.bookmarks.includes(row.id);
  return `<tr class="${saved ? 'is-bookmarked' : ''}">
    <td data-label="Bookmark"><button type="button" class="m06-bookmark" data-m06-bookmark="${esc(row.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} bookmark ${esc(row.id)}"><i class="${saved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}" aria-hidden="true"></i><span>${esc(row.id)}</span></button></td>
    <td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Account"><code>${esc(row.account)}</code></td><td data-label="Device"><code>${esc(row.device)}</code></td>
    <td data-label="Source IP"><button type="button" class="m06-detail-link" data-m06-detail="${esc(row.id)}"><code>${esc(row.sourceIp)}</code></button></td><td data-label="Result">${esc(row.result)}</td><td data-label="Session">${esc(row.session)}</td>
  </tr>`;
}

function moduleSixSourceWorkspace() {
  const sourceKey = moduleSixState.activeSource;
  const source = MODULE_SIX_SOURCES[sourceKey];
  const runs = Number(moduleSixState.queryRuns[sourceKey]) || 0;
  const resultIds = Array.isArray(moduleSixState.queryResultIds[sourceKey]) ? moduleSixState.queryResultIds[sourceKey] : [];
  const visibleRows = runs ? source.rows.filter((row) => resultIds.includes(row.id)) : source.rows;
  const detail = moduleSixRowById(moduleSixState.detailEvent);
  const resultMessage = runs
    ? `<div class="m06-query-result ${moduleSixState.queryPassed[sourceKey] ? 'is-pass' : 'is-remediate'}" id="m06-query-feedback" role="status" tabindex="-1"><strong>${moduleSixState.queryPassed[sourceKey] ? 'Query objective met' : 'Query needs refinement'}</strong><p>${esc(moduleSixState.queryFeedback[sourceKey])}</p></div>`
    : `<div class="m06-query-empty" id="m06-query-feedback" role="status">The preview includes benign distractors. Run a query to reduce it to the two rows that test this pivot.</div>`;
  return `<section class="m06-panel m06-workspace" aria-labelledby="m06-workspace-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stage 2 · Test the hypothesis</p><h3 id="m06-workspace-title">Two-source hunt workbench</h3></div><span class="m06-status-chip">${moduleSixState.bookmarks.length}/4 bookmarks saved</span></div>
    <p class="m06-instruction">Choose either source first. Query both, inspect the matching context, and bookmark only the four rows that together establish behavior and scope.</p>
    <div class="m06-source-tabs" role="tablist" aria-label="Hunting data sources">
      ${Object.entries(MODULE_SIX_SOURCES).map(([key, item]) => `<button type="button" role="tab" data-m06-source="${esc(key)}" aria-selected="${sourceKey === key}" aria-controls="m06-source-panel"><i class="${esc(item.icon)}" aria-hidden="true"></i>${esc(item.label)}<span>${moduleSixState.queryPassed[key] ? '✓ queried' : `${moduleSixState.queryRuns[key] || 0} runs`}</span></button>`).join('')}
    </div>
    <div class="m06-source-panel" id="m06-source-panel" role="tabpanel">
      <div class="m06-query-layout">
        <div><p class="m06-query-prompt"><strong>${esc(source.prompt)}</strong> Use <code>${esc(source.expectedField)}</code> as the equality field and sort oldest first.</p>
          <label for="m06-query-editor">Local hunt query</label>
          <textarea id="m06-query-editor" name="queryDraft" rows="4" spellcheck="false" aria-describedby="m06-query-help">${esc(moduleSixState.queryDrafts[sourceKey])}</textarea>
          <p id="m06-query-help">Supported subset: table name, one <code>where Field == "value"</code>, and <code>sort by TimeGenerated asc</code>.</p>
          <button type="button" class="m06-run" data-m06-run><i class="ri-play-circle-line" aria-hidden="true"></i> Run ${esc(source.label.toLowerCase())} query</button>
        </div>
        <details class="m06-hint m06-query-hint"><summary>Need a query hint?</summary><p>Copy the matching seed value into the empty quotes: <code>${esc(source.expectedValue)}</code>. Keep the table and ascending sort already provided.</p></details>
      </div>
      ${resultMessage}
      <div class="m06-result-heading"><strong>${runs ? `${visibleRows.length} query result${visibleRows.length === 1 ? '' : 's'}` : `${visibleRows.length} rows in unfiltered preview`}</strong><span>All data is synthetic</span></div>
      ${sourceKey === 'endpoint' ? moduleSixEndpointTable(visibleRows) : moduleSixSigninTable(visibleRows)}
      ${detail && source.rows.includes(detail) ? `<aside class="m06-row-detail" id="m06-row-detail" tabindex="-1"><button type="button" data-m06-detail-close aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m06-kicker">${esc(detail.id)} · context</p><strong>${esc(detail.action || detail.result)}</strong><p>${esc(detail.detail)}</p></aside>` : ''}
    </div>
    <aside class="m06-bookmark-tray" aria-labelledby="m06-bookmark-title"><div><p class="m06-kicker">Evidence tray</p><h4 id="m06-bookmark-title">Hunt bookmarks</h4></div>${moduleSixState.bookmarks.length ? `<ol>${moduleSixState.bookmarks.map((id) => { const row = moduleSixRowById(id); return `<li><code>${esc(id)}</code><span>${esc(row.device)} · ${esc(row.account)}</span><button type="button" data-m06-bookmark="${esc(id)}" aria-label="Remove bookmark ${esc(id)}"><i class="ri-close-line" aria-hidden="true"></i></button></li>`; }).join('')}</ol>` : '<p>No evidence bookmarked yet. Save the few rows that directly test the hypothesis.</p>'}</aside>
  </section>`;
}

function moduleSixCheckboxGroup(name, options, selected) {
  return `<div class="m06-check-grid">${options.map((option) => `<label><input type="checkbox" name="${esc(name)}" value="${esc(option.id)}" ${selected.includes(option.id) ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSixRadioGroup(name, options) {
  return `<div class="m06-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleSixState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSixArtifact() {
  const cr = moduleSixState.caseRecord;
  const spec = moduleSixHuntCaseSpec();
  const missing = caseRecordMissing(cr, spec);
  return `<section class="m06-panel m06-artifact" aria-labelledby="m06-artifact-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stages 3–5 · Scope, decide, communicate</p><h3 id="m06-artifact-title">Hunt conclusion record</h3></div>${!cr.submitted ? `<button type="button" class="m06-reset" data-m06-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button>` : ''}</div>
    <p class="m06-instruction">Turn the two-source findings into one reviewable incident ticket. Select only what the evidence supports.</p>
    ${caseRecordPane(cr, {
      ...spec,
      missing,
      formId: 'm06-form',
      saveAttr: 'data-m06-save-case',
      submitAttr: 'data-m06-submit-case',
      panelId: 'm06-case-panel',
      showMissing: moduleSixProveItShowMissing,
      redoRequested: moduleSixProveItRedoRequested(),
      redoHtml: moduleSixProveItRedoFeedback(),
      reviewStatus: moduleSixProveItReviewStatus(),
      lockedMessage: 'The Assessment Lab stays locked until your instructor approves the submission.',
    })}
  </section>`;
}

function moduleSixGuidedLabPanel() {
  return `${moduleSixHypothesis()}${moduleSixSourceWorkspace()}${moduleSixArtifact()}`;
}

function moduleSixAssessmentLabPanel() {
  const lab = moduleSixState.independentLab;
  const cr = lab.caseRecord;
  const spec = moduleSixBackdoorCaseSpec();
  const missing = caseRecordMissing(cr, spec);
  return `<section class="m06-panel m06-independent" id="m06-independent-lab" aria-labelledby="m06-independent-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Independent case · same Threat Hunt Lab tool, no hints</p><h3 id="m06-independent-title">Dormant task backdoor review</h3></div></div>
    <p class="m06-instruction"><strong>Fresh case, different decision path:</strong> Mission Next Labs has no alert for a scheduled task named <code>UpdateHealth</code> on <code>ws-318</code>. It runs weekly from a user-writable folder and was created by <code>acct-184</code>. A second host (<code>ws-355</code>) has the same task name but a signed script under approved maintenance. Choose a bounded disposition; do not treat the absence of an alert as proof of safety.</p>
    ${caseRecordPane(cr, {
      ...spec,
      missing,
      formId: 'm06-independent-form',
      saveAttr: 'data-m06-independent-save-case',
      submitAttr: 'data-m06-independent-submit-case',
      panelId: 'm06-independent-case-panel',
      showMissing: moduleSixIndependentProveItShowMissing,
      redoRequested: moduleSixIndependentRedoRequested(),
      redoHtml: moduleSixIndependentRedoFeedback(),
      reviewStatus: moduleSixIndependentReviewStatus(),
      lockedMessage: 'Module 7 stays locked until your instructor approves the submission.',
    })}
  </section>`;
}

function moduleSixExactSelection(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((item) => chosen.has(item)).length;
  const extras = selected.filter((item) => !expected.includes(item)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - (extras * Math.ceil(points / expected.length)));
}

function moduleSixAllRows() {
  return [...MODULE_SIX_ENDPOINT_ROWS, ...MODULE_SIX_SIGNIN_ROWS];
}

function moduleSixRowById(id) {
  return moduleSixAllRows().find((row) => row.id === id);
}

function moduleSixAdditionalLabs() {
  return missionNextLabLaunchGroup(6, 'additional', [
    { title: 'DNS Log Analysis — C2 Beaconing & Tunneling', detail: 'Optional: Splunk-style DNS query telemetry practice', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/dns-log-analysis', labId: 'additional-1', requireNote: true },
    { title: 'SSH Log Analysis — Brute Force & Credential Stuffing', detail: 'Optional: Splunk-style SSH auth-log practice', href: 'imported-labs/mission-next-labs/index.html#/track/splunk/module/ssh-log-analysis', labId: 'additional-2', requireNote: true },
    { title: 'Network Traffic Analysis of a Trojan', detail: 'Network IOCs and threat-hunting pivots', href: 'imported-labs/mission-next-labs/index.html#/track/malware-analysis/project/ma-5/lab', labId: 'additional-3', requireNote: true },
  ], moduleSixState.labProgress);
}

function wireModuleSixAdditionalLabsGating(root) {
  if (!root || !moduleSixState) return;
  wireMissionNextLabGating(root, moduleSixState.labProgress, () => {
    moduleSixSave();
    root.innerHTML = moduleSixAdditionalLabs();
    wireModuleSixAdditionalLabsGating(root);
  });
}

function viewModuleSix(user, program) {
  moduleSixLoad(user);
  const module = program.modules['soc-06'];
  const sections = moduleSixGetSections();
  const lectureOpen = moduleSixReviewMode || !sections[0].isComplete;
  const quizOpen = moduleSixReviewMode || (moduleSixQuizState && !moduleSixQuizState.passed);
  const guidedLabOpen = moduleSixReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleSixReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleSixReviewMode;
  const quickNavItems = moduleSixGetQuickNavItems();

  return `<div class="m06-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleSixReviewMode })}
      <main class="m06-main mf-frame">
      <section class="m06-hero mf-hero" aria-labelledby="m06-title"><div><p class="m06-kicker mf-kicker">Module 06 · ${formatHandsOnDuration(module.durationMinutes)} · guided threat hunt</p><h1 id="m06-title">${esc(module.title)}</h1><p class="m06-lede mf-lede">Move from a suspicious seed observation to a tested hypothesis, a defensible two-source evidence set, and a scoped analyst handoff. This is a guided monitoring workflow within the SOC analyst role, not training for a separate Threat Hunter occupation.</p></div><dl class="m06-progress mf-stats" aria-label="Saved lab progress"><div><dt>Guided Lab</dt><dd id="m06-status">${moduleSixState.completed ? 'Complete' : moduleSixState.attempts ? 'In progress' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd>${moduleSixState.independentLab.completed ? 'Complete' : 'Not started'}</dd></div></dl></section>

      <details class="m06-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge">1</span><div><p class="m06-kicker mf-kicker">Lecture</p><h2 id="m06-lecture">Hypothesis-led hunting foundations</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">
          <div class="m06-objective" aria-labelledby="m06-objective-title"><div class="m06-objective-icon"><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m06-kicker">Measurable objective</p><h3 id="m06-objective-title">Test one cross-device execution hypothesis with two scoped queries, bookmark the four records that establish behavior and scope, and communicate a supported disposition.</h3></div></div>
          <section class="m06-section" id="m06-field-guide" aria-labelledby="m06-guide-title"><div class="m06-section-heading"><span>a</span><div><p class="m06-kicker">Field guide</p><h3 id="m06-guide-title">Hunt for evidence, not confirmation</h3></div></div>${moduleSixLessonLoops()}${moduleSixConcepts()}<div class="m06-hunt-loop" aria-label="Hypothesis-led hunting loop"><span>Hypothesis</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Query</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Bookmark</span><i class="ri-bookmark-line" aria-hidden="true"></i><span>Preserve</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope &amp; decide</span></div></section>
          ${moduleSixVideoScript()}
        </div>
      </details>

      <details class="m06-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge">2</span><div><p class="m06-kicker mf-kicker">Knowledge Check</p><h2 id="m06-knowledge-check">Test your understanding of threat hunting</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">${moduleSixQuizPanel()}</div>
      </details>

      <details class="m06-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge">3</span><div><p class="m06-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m06-guided-lab">Threat Hunt Lab — cross-device script recurrence</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">
          <div class="m06-role"><i class="ri-user-search-line" aria-hidden="true"></i><div><strong>Your role: SOC analyst conducting a guided hunt</strong><p>You may investigate endpoint activity and sign-in activity in either order. Hints are available when you want them. Your job is to test the stated lead inside the assigned monitoring workflow, not to investigate unrelated systems.</p></div></div>
          <div id="m06-guided-lab-dynamic">${moduleSixGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m06-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge">4</span><div><p class="m06-kicker mf-kicker">Prove It · Assessment Lab</p><h2 id="m06-assessment-lab">Independent case: dormant task backdoor review</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">
          <div id="m06-assessment-lab-dynamic">${moduleSixAssessmentLabPanel()}</div>
        </div>
      </details>
      <div id="m06-additional-labs-dynamic">${moduleSixAdditionalLabs()}</div>

      <details class="m06-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge">5</span><div><p class="m06-kicker mf-kicker">Module Review</p><h2 id="m06-review">Key concepts and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">${moduleSixReview()}</div>
      </details>

      <details class="m06-section-collapsible mf-section mf-section-supplemental" ${moduleSixReviewMode ? 'open' : ''}>
        <summary class="m06-section"><div class="m06-section-heading mf-section-heading"><span class="m06-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m06-kicker mf-kicker">Sources &amp; Further Reading</p><h2 id="m06-sources">Authoritative references on threat hunting</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m06-section-body mf-section-body">${moduleSourcesBlock(MODULE_SIX_SOURCES_LIST)}</div>
      </details>
    </main>
    </div>
  </div>`;
}

function moduleSixRenderGuidedLab(focusId) {
  const root = document.getElementById('m06-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleSixGuidedLabPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleSixGuidedLab() {
  const root = document.getElementById('m06-guided-lab-dynamic');
  if (!root || !moduleSixState) return;

  root.addEventListener('click', (event) => {
    const sourceButton = event.target.closest('[data-m06-source]');
    if (sourceButton) {
      moduleSixState.activeSource = sourceButton.dataset.m06Source;
      moduleSixState.detailEvent = '';
      moduleSixSave();
      moduleSixRenderGuidedLab('m06-workspace-title');
      return;
    }

    if (event.target.closest('[data-m06-run]')) {
      const sourceKey = moduleSixState.activeSource;
      const editor = root.querySelector('#m06-query-editor');
      moduleSixState.queryDrafts[sourceKey] = editor ? editor.value : moduleSixState.queryDrafts[sourceKey];
      const result = moduleSixRunQuery(sourceKey, moduleSixState.queryDrafts[sourceKey]);
      moduleSixState.queryRuns[sourceKey] = (Number(moduleSixState.queryRuns[sourceKey]) || 0) + 1;
      moduleSixState.queryPassed[sourceKey] = result.passed;
      moduleSixState.queryResultIds[sourceKey] = result.rows.map((row) => row.id);
      const source = MODULE_SIX_SOURCES[sourceKey];
      moduleSixState.queryFeedback[sourceKey] = result.passed
        ? `Two matches remain in chronological order. Inspect and bookmark the rows that support the hypothesis.`
        : `${result.tableOk ? 'Table recognized.' : `Start with ${source.table}.`} ${result.canonicalField === source.expectedField && result.value === source.expectedValue ? 'Pivot recognized.' : `Filter ${source.expectedField} to the seed value.`} ${result.sortOk ? 'Time sort recognized.' : 'Sort TimeGenerated ascending.'} ${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned.`;
      moduleSixState.detailEvent = '';
      moduleSixState.validationError = '';
      moduleSixSave();
      moduleSixRenderGuidedLab('m06-query-feedback');
      return;
    }

    const bookmarkButton = event.target.closest('[data-m06-bookmark]');
    if (bookmarkButton) {
      const id = bookmarkButton.dataset.m06Bookmark;
      moduleSixState.bookmarks = moduleSixState.bookmarks.includes(id)
        ? moduleSixState.bookmarks.filter((item) => item !== id)
        : [...moduleSixState.bookmarks, id];
      moduleSixState.selectedEvidence = [...moduleSixState.bookmarks];
      moduleSixState.validationError = '';
      moduleSixSave();
      moduleSixRenderGuidedLab('m06-bookmark-title');
      return;
    }

    const detailButton = event.target.closest('[data-m06-detail]');
    if (detailButton) {
      moduleSixState.detailEvent = detailButton.dataset.m06Detail;
      moduleSixSave();
      moduleSixRenderGuidedLab('m06-row-detail');
      return;
    }

    if (event.target.closest('[data-m06-detail-close]')) {
      moduleSixState.detailEvent = '';
      moduleSixSave();
      moduleSixRenderGuidedLab('m06-workspace-title');
      return;
    }

    if (event.target.closest('[data-m06-reset]')) {
      if (moduleSixState.caseRecord.submitted) return;
      if (typeof window.confirm === 'function' && !window.confirm('Reset only this Module 06 lab? Your saved hunt attempt will be cleared.')) return;
      const independentLab = moduleSixState.independentLab;
      moduleSixState = LabRuntime.resetCaseState(MODULE_SIX_LAB_ID, 'soc-06', moduleSixUser, moduleSixFreshDefaults());
      moduleSixState.independentLab = independentLab;
      moduleSixSave();
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleSixUser, 'soc-analyst', 'soc-06', MODULE_SIX_CATALOG_LAB_KEY, false);
      moduleSixRenderGuidedLab('m06-hypothesis-title');
      const status = document.getElementById('m06-status');
      if (status) status.textContent = 'Not started';
      return;
    }

    if (event.target.closest('[data-m06-save-case]')) {
      moduleSixState.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleSixSave();
      moduleSixRenderGuidedLab();
      return;
    }

    if (event.target.closest('[data-m06-submit-case]')) {
      if (moduleSixState.caseRecord.submitted) return;
      const spec = moduleSixHuntCaseSpec();
      const missing = caseRecordMissing(moduleSixState.caseRecord, spec);
      if (missing.length) {
        moduleSixProveItShowMissing = true;
        moduleSixSave();
        moduleSixRenderGuidedLab('m06-case-panel');
        return;
      }
      moduleSixProveItShowMissing = false;
      const result = moduleSixHuntCaseScore();
      const submittedAt = new Date().toISOString();
      moduleSixState.caseRecord.submitted = true;
      moduleSixState.caseRecord.submittedAt = submittedAt;
      moduleSixState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: submittedAt });
      moduleSixState.attempts = (moduleSixState.attempts || 0) + 1;
      moduleSixState.score = result.score;
      moduleSixState.bestScore = Math.max(moduleSixState.bestScore || 0, result.score);
      moduleSixState.breakdown = result.breakdown;
      moduleSixState.feedback = result.feedback;
      moduleSixState.lastSubmittedAt = submittedAt;
      // Submitted = complete pending faculty review (Module 01 model); the
      // 70% bar is applied by instructor review, not by locking the student out.
      moduleSixState.completed = true;
      if (moduleSixState.completed && !moduleSixState.flags.includes(MODULE_SIX_FLAG)) moduleSixState.flags.push(MODULE_SIX_FLAG);
      moduleSixSave();
      if (moduleSixUser) {
        moduleSixUser.latestLabAttemptByKey = { ...(moduleSixUser.latestLabAttemptByKey || {}), [MODULE_SIX_CATALOG_LAB_KEY]: { completedAt: submittedAt, reviewedAt: null, redoRequested: false } };
      }
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleSixUser, MODULE_SIX_CATALOG_LAB_KEY, {
          state: 'complete',
          score: result.score,
          result: {
            breakdown: result.breakdown,
            feedback: result.feedback,
            critical_errors: result.criticalErrors,
            case_record: moduleSixState.caseRecord,
            case_display: caseRecordDisplay(moduleSixState.caseRecord, spec),
            case_summary: caseRecordSummary(moduleSixState.caseRecord, spec),
            attempts: moduleSixState.attempts,
          },
        }).then((saved) => { if (saved && moduleSixProveItRedoRequested()) delete moduleSixUser.openLabRedosByModuleKey['soc-06']; });
      }
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleSixUser, 'soc-analyst', 'soc-06', MODULE_SIX_CATALOG_LAB_KEY);
      moduleSixRenderGuidedLab('m06-case-panel');
      const status = document.getElementById('m06-status');
      if (status) status.textContent = moduleSixState.completed ? 'Complete' : 'In progress';
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'queryDraft') {
      moduleSixState.queryDrafts[moduleSixState.activeSource] = event.target.value;
      moduleSixSave();
      return;
    }
    if (event.target.name === 'notes' && event.target.closest('#m06-form')) {
      caseRecordApply(moduleSixState.caseRecord, 'notes', event.target.value);
      moduleSixSave();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m06-form') && caseRecordApply(moduleSixState.caseRecord, input.name, input.value)) {
      moduleSixState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleSixSave();
      return;
    }
    if (['hypothesis', 'iocRelationship', 'nextAction'].includes(input.name)) {
      moduleSixState[input.name] = input.value;
      moduleSixSave();
      return;
    }
    const checkboxFields = { scopedDevices: 'scopedDevices', scopedAccounts: 'scopedAccounts', techniques: 'techniques' };
    if (checkboxFields[input.name]) {
      const key = checkboxFields[input.name];
      moduleSixState[key] = input.checked
        ? [...new Set([...moduleSixState[key], input.value])]
        : moduleSixState[key].filter((item) => item !== input.value);
      moduleSixSave();
    }
  });
}

function wireModuleSixAssessmentLab() {
  const root = document.getElementById('m06-assessment-lab-dynamic');
  if (!root || !moduleSixState) return;

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m06-independent-form') && caseRecordApply(moduleSixState.independentLab.caseRecord, input.name, input.value)) {
      moduleSixState.independentLab.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleSixSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'notes' && event.target.closest('#m06-independent-form')) {
      caseRecordApply(moduleSixState.independentLab.caseRecord, 'notes', event.target.value);
      moduleSixSave();
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m06-independent-save-case]')) {
      moduleSixState.independentLab.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleSixSave();
      root.innerHTML = moduleSixAssessmentLabPanel();
      return;
    }

    if (event.target.closest('[data-m06-independent-submit-case]')) {
      const lab = moduleSixState.independentLab;
      if (lab.caseRecord.submitted) return;
      const spec = moduleSixBackdoorCaseSpec();
      const missing = caseRecordMissing(lab.caseRecord, spec);
      if (missing.length) {
        moduleSixIndependentProveItShowMissing = true;
        moduleSixSave();
        root.innerHTML = moduleSixAssessmentLabPanel();
        return;
      }
      moduleSixIndependentProveItShowMissing = false;
      const result = moduleSixBackdoorCaseScore();
      const submittedAt = new Date().toISOString();
      lab.caseRecord.submitted = true;
      lab.caseRecord.submittedAt = submittedAt;
      lab.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: submittedAt });
      lab.score = result.score;
      // Submitted = complete pending faculty review (Module 01 model); the
      // 70% bar is applied by instructor review, not by locking the student out.
      lab.completed = true;
      moduleSixSave();
      if (moduleSixUser) {
        moduleSixUser.latestLabAttemptByKey = { ...(moduleSixUser.latestLabAttemptByKey || {}), [MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY]: { completedAt: submittedAt, reviewedAt: null, redoRequested: false } };
      }
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleSixUser, MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY, {
          state: 'complete',
          score: result.score,
          result: {
            breakdown: result.breakdown,
            feedback: result.feedback,
            critical_errors: result.criticalErrors,
            case_record: lab.caseRecord,
            case_display: caseRecordDisplay(lab.caseRecord, spec),
            case_summary: caseRecordSummary(lab.caseRecord, spec),
          },
        }).then((saved) => { if (saved && moduleSixIndependentRedoRequested()) delete moduleSixUser.openLabRedosByModuleKey['soc-06-independent']; });
      }
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleSixUser, 'soc-analyst', 'soc-06', MODULE_SIX_INDEPENDENT_CATALOG_LAB_KEY);
      root.innerHTML = moduleSixAssessmentLabPanel();
    }
  });
}

function wireModuleSixQuiz() {
  const form = document.getElementById('m06-quiz-form');
  if (!form || !moduleSixQuizState) return;

  form.addEventListener('change', (event) => {
    if (!event.target.hasAttribute('data-m06-quiz-answer')) return;
    const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
    if (questionId) {
      moduleSixQuizState.answers[questionId] = event.target.value;
      const form = document.getElementById('m06-quiz-form');
      if (form) form.innerHTML = moduleSixQuizPanel();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = moduleSixQuizState.answers;
    const feedback = [];
    let correctCount = 0;

    moduleSixQuizState.selectedQuestions.forEach((selected) => {
      const question = selected.question;
      const userAnswerId = answers[question.id];
      const correctOption = selected.shuffledOptions.find((o) => o.id === question.correctId);
      const isCorrect = userAnswerId === question.correctId;
      if (isCorrect) correctCount++;
      feedback.push({
        questionId: question.id,
        correct: isCorrect,
        message: isCorrect ? question.feedbackCorrect : question.feedbackIncorrect,
      });
    });

    moduleSixQuizState.score = Math.round((correctCount / moduleSixQuizState.selectedQuestions.length) * 100);
    moduleSixQuizState.attempts += 1;
    moduleSixQuizState.bestScore = Math.max(moduleSixQuizState.bestScore || 0, moduleSixQuizState.score);
    moduleSixQuizState.feedback = feedback;
    moduleSixQuizState.scored = true;
    const passed = moduleSixQuizState.score >= 70;
    moduleSixQuizState.passed = passed;

    if (!passed) {
      moduleSixState.lastQuizQuestionIds = moduleSixQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleSixSave();
    const quizPanel = document.getElementById('m06-quiz-form');
    if (quizPanel) quizPanel.innerHTML = moduleSixQuizPanel();
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-m06-quiz-retake]')) {
      event.preventDefault();
      moduleSixQuizForceRetake = true;
      form.innerHTML = moduleSixQuizPanel();
      return;
    }
    if (!event.target.closest('[data-m06-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleSixQuizState.selectedQuestions.map((s) => s.question.id);
    moduleSixQuizState = resetQuizAttempt(moduleSixQuizState, MODULE_SIX_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    form.innerHTML = moduleSixQuizPanel();
  });
}

function wireModuleSix() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m06-section-collapsible', getReviewMode: () => moduleSixReviewMode, setReviewMode: (value) => { moduleSixReviewMode = value; }, enabledLabel: 'Close review', disabledLabel: 'Review module', enabledIcon: 'ri-close-line', disabledIcon: 'ri-file-list-line' });
  wireModuleSixQuiz();
  wireModuleSixGuidedLab();
  wireModuleSixAssessmentLab();
  wireModuleSixAdditionalLabsGating(document.getElementById('m06-additional-labs-dynamic'));

  const shell = document.querySelector('.m06-shell');
  if (!shell) return;
  shell.addEventListener('change', (event) => {
    const answer = event.target.closest('[data-m06-lesson-answer]');
    if (answer) {
      const number = answer.dataset.lesson;
      const work = moduleSixState.lessonWork[number] || (moduleSixState.lessonWork[number] = { answers: {}, taskText: '', taskDone: false });
      work.answers = { ...(work.answers || {}), [answer.dataset.question]: Number(answer.value) };
      moduleSixSave();
      const list = shell.querySelector('#m06-lessons');
      if (list) list.outerHTML = moduleSixLessonLoops();
    }
  });
  shell.addEventListener('input', (event) => {
    const task = event.target.closest('[data-m06-lesson-task]');
    if (task) {
      const work = moduleSixState.lessonWork[task.dataset.m06LessonTask] || (moduleSixState.lessonWork[task.dataset.m06LessonTask] = { answers: {}, taskText: '', taskDone: false });
      work.taskText = task.value;
      moduleSixSave();
    }
  });
  shell.addEventListener('click', (event) => {
    const submitLesson = event.target.closest('[data-m06-lesson-submit]');
    if (submitLesson) {
      const number = submitLesson.dataset.m06LessonSubmit;
      const lesson = MODULE_SIX_LESSONS.find((item) => item.number === Number(number));
      const work = moduleSixLessonWork(number);
      if (!lesson || !work.taskText?.trim() || !lesson.questions.every((question) => work.answers?.[question.id] === question.correct)) {
        submitLesson.textContent = 'Complete the check and task first';
        return;
      }
      work.taskDone = true;
      moduleSixSave();
      const list = shell.querySelector('#m06-lessons');
      if (list) list.outerHTML = moduleSixLessonLoops();
    }
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 6, moduleKey: 'soc-06',
  view: viewModuleSix, wire: wireModuleSix });

/* Module 05 — assisted endpoint and malware investigation.
 * All hosts, processes, files, and actions are fictional browser-local fixtures.
 */

const MODULE_FIVE_LAB_ID = 'm05-endpoint-chain-v1';
const MODULE_FIVE_FLAG = 'M05-ENDPOINT-CHAIN-VALIDATED';
const MODULE_FIVE_CATALOG_LAB_KEY = 'lab-endpoint-investigation';

const MODULE_FIVE_QUIZ_BANKS = [
  {
    conceptId: 'endpoint-telemetry',
    conceptTitle: 'Read endpoint telemetry',
    questions: [
      {
        id: 'm05-q-telem-1',
        prompt: 'An EDR sensor reports that a file named "update.exe" was created and then executed. The file has a low prevalence score and no trusted signature. When should the analyst prioritize this event for investigation?',
        options: [
          { id: 'a', text: 'Only if the file size exceeds a certain threshold.' },
          { id: 'b', text: 'The creation followed by immediate execution, combined with low prevalence and unsigned status, makes this a priority for inspection in context with the creating process.' },
          { id: 'c', text: 'Never; the filename alone suggests it is legitimate.' },
          { id: 'd', text: 'Only if the hash matches a known malware sample.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Behavior + reputation matter. Unsigned, low-prevalence execution, especially in a suspicious creation chain, warrants investigation of the parent process and execution context.',
        feedbackIncorrect: 'Telemetry value comes from combining the event (creation, execution) with the file reputation (signer, prevalence, behavior).',
      },
      {
        id: 'm05-q-telem-2',
        prompt: 'An analyst sees that a document reader process wrote a file to a system folder using a suspicious encoding scheme. The document reader is a trusted, signed application. How should the analyst evaluate this observation?',
        options: [
          { id: 'a', text: 'Ignore it because the application is signed and trusted.' },
          { id: 'b', text: 'Treat the signer as context, not as final truth. Examine why a document reader is writing to system folders and what encoding was used, as this behavior is unusual for that application even if the executable itself is trusted.' },
          { id: 'c', text: 'Immediately isolate the endpoint because the file is encoded.' },
          { id: 'd', text: 'Encoding always indicates malware.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A trusted signer does not guarantee safe behavior. Evaluate the application\'s intended function (document reading) against what it is doing (writing to system folders with encoding).',
        feedbackIncorrect: 'Trust the signer as one signal, not as a verdict. Correlate it with the behavior—if it is unusual for that application, investigate further.',
      },
      {
        id: 'm05-q-telem-3',
        prompt: 'A timeline shows: File A created → File B created → Process X launched from File B → Process X connects to external IP. The analyst knows File A is signed by a trusted vendor. What is the most relevant question?',
        options: [
          { id: 'a', text: 'Is File A malware?' },
          { id: 'b', text: 'What was File A\'s purpose, and does launching Process X from File B fit that purpose, or does it suggest File B is the threat even if File A created it?' },
          { id: 'c', text: 'Is the external IP from a VPN?' },
          { id: 'd', text: 'Do all files have extensions?' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Behavior chains matter. A trusted file creating a second file does not automatically make the second file safe. Evaluate the purpose and execution relationship.',
        feedbackIncorrect: 'Follow the chain of creation and execution. A trusted parent does not guarantee a trusted child—investigate the relationship and intent.',
      },
      {
        id: 'm05-q-telem-4',
        prompt: 'An EDR sensor records that a shell process (cmd.exe) was launched with hidden/encoded command-line arguments by an Office application. What observation does this record support?',
        options: [
          { id: 'a', text: 'Shell execution itself is always malicious.' },
          { id: 'b', text: 'The relationship (Office app launching shell with obfuscation) is unusual and worthy of investigation, even though individual components (shell, Office) exist for legitimate purposes.' },
          { id: 'c', text: 'Office applications never interact with shells.' },
          { id: 'd', text: 'Encoded commands always indicate user privacy protection.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Relationships and context matter. Office launching shell with encoding is an unusual pattern that suggests the chain should be reviewed for intent.',
        feedbackIncorrect: 'Evaluate parent-child relationships and behavioral context. An unusual relationship is a signal, even if both components are individually legitimate.',
      },
    ],
  },
  {
    conceptId: 'process-tree',
    conceptTitle: 'Follow parent and child processes',
    questions: [
      {
        id: 'm05-q-tree-1',
        prompt: 'In a process tree, explorer.exe (desktop shell) launches cmd.exe (command shell). Is this relationship suspicious?',
        options: [
          { id: 'a', text: 'Always suspicious; shells should never be launched from the desktop.' },
          { id: 'b', text: 'Context matters. A user opening cmd.exe from the Start menu is expected; cmd.exe launching silently from a document is unusual. The parent-child relationship itself is not inherently malicious.' },
          { id: 'c', text: 'Never suspicious; cmd.exe can launch from anywhere.' },
          { id: 'd', text: 'Only suspicious if the shell creates files.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'The parent-child relationship provides context. Expected relationships (user launching shell) differ from unusual ones (document launching shell).',
        feedbackIncorrect: 'Evaluate the parent-child relationship in context. User-initiated actions differ from script-driven or document-driven launches.',
      },
      {
        id: 'm05-q-tree-2',
        prompt: 'A process tree shows: Document → PowerShell → Unsigned executable. What information does this sequence MOST help an analyst understand?',
        options: [
          { id: 'a', text: 'The malware developer\'s name.' },
          { id: 'b', text: 'How execution was chained: the document triggered PowerShell, which in turn launched an unsigned binary. This chain suggests the document was the initial compromise vector.' },
          { id: 'c', text: 'The malware\'s geographic origin.' },
          { id: 'd', text: 'The analyst\'s clearance level.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'The chain of parent-child relationships reveals execution flow: where the attack started (document) and how it progressed (shell → binary).',
        feedbackIncorrect: 'Process trees answer: who launched what, and in what order. This reveals the execution chain and helps identify the initial compromise.',
      },
      {
        id: 'm05-q-tree-3',
        prompt: 'An analyst examines two processes: Process A (parent) launches Process B (child). Process B is known malware. Should the analyst conclude that Process A is also malware?',
        options: [
          { id: 'a', text: 'Yes; a parent that launches malware must be malicious.' },
          { id: 'b', text: 'Not necessarily. The parent might be a legitimate application that was exploited or that legitimately launches child processes. Evaluate the parent\'s reputation and why it launched the child.' },
          { id: 'c', text: 'No; parents never matter.' },
          { id: 'd', text: 'Only if they share the same filename.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A legitimate process can be exploited to launch malware. Evaluate the parent\'s function and whether the child launch is expected behavior.',
        feedbackIncorrect: 'Launching malware does not automatically make the parent malicious. It could be exploited. Evaluate the parent\'s purpose and authorization.',
      },
      {
        id: 'm05-q-tree-4',
        prompt: 'A process tree shows multiple children under the same parent, with different start times spread over several minutes. Why is the timing of child creation relevant?',
        options: [
          { id: 'a', text: 'Timing is never relevant to investigation.' },
          { id: 'b', text: 'If children are created at different times, the parent must be malicious.' },
          { id: 'c', text: 'Timing reveals whether the launches are automated/batched (rapid succession) or interactive (spread out), providing context for the intent of each launch.' },
          { id: 'd', text: 'Only the first child process matters.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Timing patterns show whether launches are systematic (malware spawning) or interactive (user actions). Rapid succession differs from spaced actions.',
        feedbackIncorrect: 'Analyze when children are launched. Batched launches are different from user-driven interactive launches and suggest different intents.',
      },
    ],
  },
  {
    conceptId: 'command-context',
    conceptTitle: 'Inspect command context',
    questions: [
      {
        id: 'm05-q-cmd-1',
        prompt: 'A PowerShell process shows the command line: "powershell.exe -WindowStyle Hidden -EncodedCommand <long string>". What does this command line suggest about the intent?',
        options: [
          { id: 'a', text: 'Hidden window + encoding suggests the creator wanted to avoid casual observation and make the command unreadable without decoding. This is often associated with obfuscated execution.' },
          { id: 'b', text: 'All PowerShell commands use encoding and hidden windows.' },
          { id: 'c', text: 'Encoded commands are always legitimate administrative tasks.' },
          { id: 'd', text: 'Command line arguments never matter.' },
        ],
        correctId: 'a',
        feedbackCorrect: 'Command-line options reveal intent. Hidden windows + encoding together suggest obfuscation, which is common in attack chains.',
        feedbackIncorrect: 'Analyze command-line arguments for signs of obfuscation. Hidden + encoded is a pattern worth investigating.',
      },
      {
        id: 'm05-q-cmd-2',
        prompt: 'Two instances of the same executable are running. The first has command line: "executable.exe /admin". The second has: "executable.exe /admin /silent". Should the analyst treat these as equivalent?',
        options: [
          { id: 'a', text: 'Yes; they are the same executable.' },
          { id: 'b', text: 'No. Different command-line options indicate different modes of execution. The /silent flag might suppress user prompts and logging, changing the risk profile even if the binary is identical.' },
          { id: 'c', text: 'Command-line arguments do not matter; only the executable name matters.' },
          { id: 'd', text: 'The second is always safer because it is silent.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Command-line arguments change behavior. The same binary with different arguments can run in different modes (logged vs. silent, interactive vs. automated).',
        feedbackIncorrect: 'Analyze command-line options. The same executable behaves differently based on its arguments.',
      },
      {
        id: 'm05-q-cmd-3',
        prompt: 'An analyst reviewing a timeline sees: Process A launches with normal command line → Process A is modified in memory (no child process written to disk) → Process B launches with an encoded command. Should the analyst link Process B to Process A?',
        options: [
          { id: 'a', text: 'No; if Process B is not a child of Process A in the tree, they are unrelated.' },
          { id: 'b', text: 'Yes; the pattern of Process A being modified in memory followed by Process B launching with obfuscation suggests Process A was exploited to spawn Process B, even if the process tree does not show a direct parent-child link.' },
          { id: 'c', text: 'Only if they have the same filename.' },
          { id: 'd', text: 'Timeline order is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Timeline + behavioral context matter. Memory modification followed by suspicious child execution suggests injection and execution, even if the tree does not show it.',
        feedbackIncorrect: 'Evaluate timeline and behavioral context together. Memory modification followed by suspicious launch suggests injection.',
      },
      {
        id: 'm05-q-cmd-4',
        prompt: 'A shell process is launched with a user context of "SYSTEM". What does this context reveal about the execution path?',
        options: [
          { id: 'a', text: 'SYSTEM context means the user chose to run it as administrator.' },
          { id: 'b', text: 'SYSTEM context indicates the shell was launched by system processes or by privileged code injection, not by a regular user action. This suggests the creation path was not interactive user input.' },
          { id: 'c', text: 'User context never matters.' },
          { id: 'd', text: 'SYSTEM context always means the action is safe.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'User context reveals how the process was launched. SYSTEM context indicates system-level or privilege-escalated execution, not interactive user action.',
        feedbackIncorrect: 'Evaluate the user context. SYSTEM context suggests the process was launched by system code or privileged injection, not by a user.',
      },
    ],
  },
  {
    conceptId: 'file-evaluation',
    conceptTitle: 'Evaluate a file',
    questions: [
      {
        id: 'm05-q-file-1',
        prompt: 'A file has: unknown signer, prevalence = 1 endpoint, local reputation fixture = "loader detected." How should the analyst classify it?',
        options: [
          { id: 'a', text: 'Safe because it is unknown.' },
          { id: 'b', text: 'Benign because it only appears on one endpoint.' },
          { id: 'c', text: 'The combination of unknown signer, very low prevalence, and a reputation match to loader behavior supports a malicious classification. No single attribute is final; the combination is decisive.' },
          { id: 'd', text: 'Cannot classify based on this data.' },
        ],
        correctId: 'c',
        feedbackCorrect: 'Combine multiple file signals: signer, prevalence, reputation. Together, they support a verdict.',
        feedbackIncorrect: 'Evaluate files using multiple attributes. Signer + prevalence + reputation together form a complete picture.',
      },
      {
        id: 'm05-q-file-2',
        prompt: 'Two files have the same SHA-256 hash. One was created by a known exploit kit; the other was created by legitimate software. Is the hash alone sufficient to classify the second file?',
        options: [
          { id: 'a', text: 'Yes; if hashes match, the files are identical and therefore equally malicious or benign.' },
          { id: 'b', text: 'The hash match means the files are byte-for-byte identical. If the hash is associated with malware, the second file is also the same bytes, so it shares the same threat profile. However, context (where it came from, what launched it) also matters.' },
          { id: 'c', text: 'Hash matches are meaningless.' },
          { id: 'd', text: 'Only the filename matters.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Hash matches prove files are identical, so they share the same risk. Context (location, execution path) adds depth but does not override the hash verdict.',
        feedbackIncorrect: 'Hash matching is strong evidence of identical bytes and therefore identical threat. Context enriches the verdict but does not override it.',
      },
      {
        id: 'm05-q-file-3',
        prompt: 'A file has a trusted signature from a legitimate company, but it was found running from an unusual location (TEMP folder) and executed with hidden parameters. Should the analyst trust the signature as the final verdict?',
        options: [
          { id: 'a', text: 'Yes; trusted signatures are always final.' },
          { id: 'b', text: 'The signature is legitimate, but execution context (temp folder, hidden parameters) is unusual for that file. Treat the signature as one signal and evaluate the behavior in context.' },
          { id: 'c', text: 'Signatures are irrelevant if the location is unusual.' },
          { id: 'd', text: 'Temp folder always means malware.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A trusted signature is strong evidence, but behavioral context (location, arguments, parent process) can indicate misuse or exploitation of a legitimate file.',
        feedbackIncorrect: 'Combine signer reputation with behavioral context. A trusted file running from TEMP with hidden args is worth investigating.',
      },
      {
        id: 'm05-q-file-4',
        prompt: 'A file is submitted to VirusTotal and 0 out of 60 antivirus engines detect it. Can the analyst confidently conclude it is benign?',
        options: [
          { id: 'a', text: 'Yes; if no antivirus detects it, it is definitely safe.' },
          { id: 'b', text: 'A lack of detection is a good sign, but it does not guarantee benignity. New malware, targeted attacks, and evasion techniques can evade broad antivirus coverage. Combine reputation with local behavior and context.' },
          { id: 'c', text: 'VirusTotal results are always wrong.' },
          { id: 'd', text: 'Only signatures matter; behavior is irrelevant.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Clean VirusTotal results are reassuring but not definitive. Zero-day malware and targeted tools may not have broad coverage. Combine reputation with observed behavior.',
        feedbackIncorrect: 'Reputation data (including VirusTotal) is one signal. Local behavior and context add depth to the verdict.',
      },
    ],
  },
  {
    conceptId: 'persistence',
    conceptTitle: 'Recognize persistence',
    questions: [
      {
        id: 'm05-q-persist-1',
        prompt: 'A malware sample writes a value to HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to an executable path. Why is this action significant?',
        options: [
          { id: 'a', text: 'Registry modifications are always harmless.' },
          { id: 'b', text: 'The Run key is executed every time the user logs in. Writing there makes the malware relaunch automatically, surviving session restarts and achieving persistence.' },
          { id: 'c', text: 'Only system services provide persistence.' },
          { id: 'd', text: 'Persistence is not a security concern.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Run keys are executed at user logon, providing persistence. A malware entry in Run means the threat survives logout/login cycles.',
        feedbackIncorrect: 'Run-key entries achieve persistence by auto-launching at logon. This is a critical indicator of intent to stay on the system.',
      },
      {
        id: 'm05-q-persist-2',
        prompt: 'An investigation finds a scheduled task that runs every 5 minutes and executes a file in a user-writable directory. The task was created by a PowerShell script run from a document. Should the analyst prioritize removing the scheduled task?',
        options: [
          { id: 'a', text: 'No; scheduled tasks are always legitimate.' },
          { id: 'b', text: 'Yes. The combination of (a) frequent execution, (b) creation from a document-launched script, and (c) execution from a writable directory suggests the task is a persistence mechanism deployed by malware.' },
          { id: 'c', text: 'Only if the filename contains "malware."' },
          { id: 'd', text: 'Scheduled tasks never need to be removed.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Scheduled tasks can be persistence mechanisms. Frequent execution + suspicious creation path + writable directory suggests malicious automation.',
        feedbackIncorrect: 'Scheduled tasks are powerful persistence tools. Analyze who created them, how often they run, and what they execute.',
      },
      {
        id: 'm05-q-persist-3',
        prompt: 'A Windows service is created with a suspicious name and set to auto-start. The service executable is a newly observed unsigned binary. Is eliminating the malware binary sufficient to remove the persistence?',
        options: [
          { id: 'a', text: 'Yes; removing the binary removes the threat.' },
          { id: 'b', text: 'The binary removal stops immediate execution, but the service entry still points to it and will attempt to relaunch. The service registration itself must be removed to fully eliminate the persistence mechanism.' },
          { id: 'c', text: 'Services never persist.' },
          { id: 'd', text: 'Only the binary matters.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'Service cleanup requires both removing the binary and unregistering the service. Leaving the service entry means it will try to relaunch.',
        feedbackIncorrect: 'Persistence cleanup must address both the payload and the persistence mechanism. A missing binary can be re-downloaded; the service entry must be removed.',
      },
      {
        id: 'm05-q-persist-4',
        prompt: 'After an incident, an endpoint is rebooted and the malware does not reappear. Can the analyst conclude the endpoint is fully remediated?',
        options: [
          { id: 'a', text: 'Yes; if malware does not return, it is gone.' },
          { id: 'b', text: 'A reboot without malware return is a positive sign, but it does not prove full remediation. Dormant backdoors, undetected files, or re-download mechanisms might activate later. Continued monitoring is needed.' },
          { id: 'c', text: 'Reboots are ineffective against malware.' },
          { id: 'd', text: 'One clean boot proves complete integrity.' },
        ],
        correctId: 'b',
        feedbackCorrect: 'A clean reboot is encouraging but not conclusive. Advanced malware can hide in unexpected locations or have delayed-activation features.',
        feedbackIncorrect: 'Absence of symptoms after reboot does not guarantee full remediation. Continued monitoring is essential to confirm.',
      },
    ],
  },
];

const MODULE_FIVE_SOURCES = [
  {
    title: 'MITRE ATT&CK — Persistence',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0003/',
    note: 'Techniques for maintaining access, including persistence via Run keys, scheduled tasks, and Windows services.',
  },
  {
    title: 'MITRE ATT&CK — Execution',
    org: 'MITRE',
    url: 'https://attack.mitre.org/tactics/TA0002/',
    note: 'Techniques for executing code, including parent-child process chains and command-line obfuscation.',
  },
  {
    title: 'Use Windows Event Forwarding to Help with Intrusion Detection',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/windows/security/threat-protection/use-windows-event-forwarding-to-assist-in-intrusion-detection',
    note: 'Process creation, file creation, and registry events that EDR systems use for endpoint telemetry collection.',
  },
  {
    title: 'Guide to Malware Incident Prevention and Handling for Desktops and Laptops (SP 800-83 Rev. 1)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/83/r1/final',
    note: 'Practical guidance on detecting, containing, and recovering from malware on individual endpoints — directly applicable to this lab\'s scope and containment decisions.',
  },
  {
    title: 'Investigate Microsoft Defender for Endpoint Files',
    org: 'Microsoft Learn',
    url: 'https://learn.microsoft.com/en-us/defender-endpoint/investigate-files',
    note: 'Real EDR file-investigation workflow — prevalence, detection ratio, and organizational file history — matching this lab\'s file-evaluation reasoning.',
  },
  {
    title: 'Incident Response Recommendations and Considerations for Cybersecurity Risk Management (SP 800-61 Rev. 3)',
    org: 'NIST',
    url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final',
    note: 'Current incident response framework (CSF 2.0 community profile) covering detection, analysis, containment, and recovery.',
  },
  {
    title: 'Security+ (SY0-701) Certification Overview & Objectives Summary',
    org: 'CompTIA',
    url: 'https://www.comptia.org/certifications/security',
    note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.',
  },
];

const MODULE_FIVE_DEFAULT_STATE = {
  practiceComplete: false,
  practiceNotes: '',
  attempts: 0,
  score: 0,
  bestScore: 0,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  notes: '',
  lessonWork: {},
  labProgress: {},
  // Standard ITSM Incident Ticket for the m05-assessment Prove It
  // submission (docs/specs/MODULE_STANDARD.md §7.2).
  caseRecord: { status: '', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, caseId: '', scenarioId: '', submitted: false, submittedAt: '', actionHistory: [] },
  assessmentAttempts: [],
};

// Standard ITSM Incident Ticket for the Prove It submission — the form is
// `m05-assessment`, replacing the old free-form `m05-assessment-form`. It is
// the only form here that calls recordLabAttempt() for
// MODULE_FIVE_CATALOG_LAB_KEY. The two imported assessment labs
// (assessment-1: Sysmon event analysis, assessment-2: keylogger behavioral
// analysis — portal/imported-labs/mission-next-labs, sources lap-5/ma-4)
// stay as prerequisite evidence gates above the ticket, same as before.
//
// The scored case identity and entities come from the immutable assessment fixture.
const MODULE_FIVE_LEGACY_CASE_ID = 'EDR-5119';
const MODULE_FIVE_CASE_ID = SocM05AssessmentData.scenario.caseId;
const MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD = 40;

const MODULE_FIVE_ENTITY_ROSTER = {
  users: [
    { id: 'CORP\\j.alvarez', text: 'CORP\\j.alvarez (affected user)', tier: 'principal' },
    { id: 'CORP\\m.reyes', text: 'CORP\\m.reyes (benign updater activity)', tier: 'pivot' },
    { id: 'p.chen', text: 'p.chen', tier: 'noise' },
    { id: 'r.diallo', text: 'r.diallo', tier: 'noise' },
    { id: 'k.osei', text: 'k.osei', tier: 'noise' },
    { id: 't.nguyen', text: 't.nguyen', tier: 'noise' },
    { id: 'a.silva', text: 'a.silva', tier: 'noise' },
  ],
  devices: [
    { id: 'M05-DEV-001', text: 'WS-ASSESS-27 (affected endpoint)', tier: 'principal' },
    { id: 'M05-DEV-002', text: 'WS-ASSESS-14 (benign comparison)', tier: 'pivot' },
    { id: 'M05-DEV-003', text: 'SRV-ASSESS-02', tier: 'noise' },
  ],
};

const MODULE_FIVE_DEPARTMENT_OPTIONS = [
  { id: 'endpoint-response', text: 'Endpoint/EDR Response', fit: 100, note: 'Best fit — a persistence mechanism needs to be contained and removed from the endpoint itself.' },
  { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 65, note: 'Acceptable — Tier 2 can continue monitoring and investigation, but endpoint containment still needs an EDR-focused owner.' },
  { id: 'identity-response', text: 'Identity Response', fit: 30, note: 'Weak fit — no credential compromise is evidenced here; this is an endpoint execution and persistence chain.', bounce: 'Identity Response cannot remove a Run-key persistence entry; route to Endpoint/EDR Response.' },
  { id: 'help-desk', text: 'IT Help Desk', fit: 10, note: 'Not a fit — this is confirmed malicious execution with persistence, not a routine help-desk ticket.', bounce: 'Help Desk cannot contain a malware persistence mechanism; this needs Endpoint/EDR Response.' },
];

// Only the assessment itself gates the ticket; the imported projects are
// Optional Labs and never gate scoring or progress.
function moduleFiveExtraMissing() {
  return [];
}

function moduleFiveCaseSpec() {
  return {
    caseId: MODULE_FIVE_CASE_ID,
    userOptions: MODULE_FIVE_ENTITY_ROSTER.users,
    deviceOptions: MODULE_FIVE_ENTITY_ROSTER.devices,
    departmentOptions: MODULE_FIVE_DEPARTMENT_OPTIONS,
    notesPlaceholder: 'Summarize the endpoint execution chain, your assessment, and your recommended action for WS-ASSESS-27…',
    extraMissing: moduleFiveExtraMissing(),
  };
}

function moduleFiveProveItRedoRequested() {
  return moduleFiveUser?.openLabRedosByModuleKey?.['soc-05']?.labKey === MODULE_FIVE_CATALOG_LAB_KEY;
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleFiveProveItReviewStatus() {
  if (!moduleFiveState?.caseRecord?.submitted) return '';
  const attempt = moduleFiveUser?.latestLabAttemptByKey?.[MODULE_FIVE_CATALOG_LAB_KEY];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

function moduleFiveProveItRedoFeedback() {
  if (!moduleFiveProveItRedoRequested()) return '';
  const items = moduleFiveUser.openLabRedosByModuleKey['soc-05'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

// Prove It scoring: the Module 01 weight model applied directly (entity 20,
// severity 15, disposition 20, escalation/routing up to 35, notes 10) —
// unlike Modules 04/06, the pre-migration m05-assessment-form had no
// separate graded fieldset to fold in (only the two imported-lab gates and
// a free-text write-up), so there is no domain-findings block to add. No
// live score was ever shown to the student and no local pass/fail gate
// existed before; that is unchanged — submission is unconditional
// 'complete' once the ticket and both imported labs are done, same as the
// pre-migration behavior. The score/breakdown are computed for the
// instructor only, exactly as Module 01 does.
function moduleFiveCaseScore() {
  const cr = moduleFiveState.caseRecord;
  const roster = MODULE_FIVE_ENTITY_ROSTER;
  const userTier = roster.users.find((entry) => entry.id === cr.affectedUser)?.tier;
  const deviceTier = roster.devices.find((entry) => entry.id === cr.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10); // 0-20

  const severity = caseRecordSeverity(cr);
  const severityPoints = severity === 'high' ? 15 : 0;

  const disposition = caseRecordDisposition(cr);
  const dispositionPoints = disposition === 'true-positive' ? 20 : 0;

  const department = MODULE_FIVE_DEPARTMENT_OPTIONS.find((option) => option.id === cr.escalateTo) || null;
  const escalationRequiredOk = cr.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD;
  const escalationPoints = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 35) : 0;

  const notesLen = (cr.notes || '').trim().length;
  const notesPoints = Math.round(Math.min(1, notesLen / CASE_RECORD_NOTES_MIN) * 10);

  const score = entityPoints + severityPoints + dispositionPoints + escalationPoints + notesPoints;
  const criticalErrors = cr.escalation === 'not-required' ? ['escalation-not-required'] : [];

  const routingFeedback = !escalationRequiredOk
    ? 'Routing: not applicable — escalation was set to not required.'
    : !department
      ? 'Routing: review — this case needs a department routed with the recorded evidence.'
      : department.fit >= 100
        ? `Routing: correct — ${department.text} is the best-fit department for this case.`
        : department.fit >= MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD
          ? `Routing: accepted, but not the best fit — ${department.note}`
          : `Routing: returned — ${department.bounce || department.note}`;

  return {
    score,
    breakdown: { affected_entity: entityPoints, severity: severityPoints, disposition: dispositionPoints, escalation: escalationPoints, analyst_notes: notesPoints },
    department, bounced,
    feedback: [
      entityPoints >= 20 ? 'Affected entity/scope: correct — j.alvarez and WS-LAB-27 are the confirmed affected user and device.' : entityPoints > 0 ? 'Affected entity/scope: partial credit — a related account or device is supported by the evidence, but j.alvarez/WS-LAB-27 is the confirmed pair.' : 'Affected entity/scope: review — j.alvarez and WS-LAB-27 are the confirmed affected user and device.',
      severityPoints ? 'Severity: correct — High.' : 'Severity: review — an execution chain with a persistence entry on one endpoint is High severity.',
      dispositionPoints ? 'Disposition: correct — confirmed malicious activity.' : 'Disposition: review — the fake-CAPTCHA → PowerShell → persistence chain is confirmed malicious activity.',
      routingFeedback,
    ],
    criticalErrors,
  };
}

const MODULE_FIVE_LESSONS = [
  { icon: 'ri-computer-line', title: 'Read endpoint telemetry', summary: 'EDR records behavior, not intent.', detail: 'Process starts, file writes, registry changes, and prevention actions are observable facts. Treat a product verdict as context, then verify it against the behavior around it.', takeaway: 'A detection starts an investigation; surrounding behavior supports the conclusion.' },
  { icon: 'ri-node-tree', title: 'Follow parent and child processes', summary: 'Relationships reveal how execution began.', detail: 'A process tree connects each program to what launched it. Office software starting a shell is usually more informative than either process name viewed alone.', takeaway: 'Ask whether the parent-child relationship fits the user’s task.' },
  { icon: 'ri-terminal-box-line', title: 'Inspect command context', summary: 'Names can look normal while arguments do not.', detail: 'Review the executable path, command-line options, user context, and start time together. Encoded or hidden execution deserves attention but is not proof on its own.', takeaway: 'Use command context as one part of a behavioral chain.' },
  { icon: 'ri-time-line', title: 'Build an endpoint timeline', summary: 'Order turns separate events into a story.', detail: 'Arrange document access, process starts, file creation, persistence changes, and sensor actions by time. The order helps distinguish cause from coincidence.', takeaway: 'A timeline should explain what happened before, during, and after execution.' },
  { icon: 'ri-file-shield-2-line', title: 'Evaluate a file', summary: 'Combine reputation with local behavior.', detail: 'A hash, signer status, prevalence, and local execution behavior provide different kinds of evidence. Low prevalence and an unknown signer raise concern when paired with suspicious execution.', takeaway: 'No single file field should carry the whole verdict.' },
  { icon: 'ri-fingerprint-line', title: 'Use hashes carefully', summary: 'A hash identifies bytes, not motive.', detail: 'Matching hashes strongly link identical files, but a new or unknown hash is not automatically malicious. Record which file the hash belongs to and where it was observed.', takeaway: 'State the file, hash result, and behavioral context together.' },
  { icon: 'ri-settings-4-line', title: 'Recognize persistence', summary: 'Autostart changes can outlive a session.', detail: 'Startup folders, services, scheduled tasks, and Run keys can relaunch software. Many legitimate tools also persist, so connect the change to the creating process and path.', takeaway: 'Attribute a persistence change to its creator before escalating it.' },
  { icon: 'ri-shield-check-line', title: 'Separate prevention from cleanup', summary: 'A blocked action may not end the incident.', detail: 'Quarantine can stop one file while an earlier process, persistence entry, or downloaded copy remains. Confirm what the sensor actually prevented and what still needs response.', takeaway: 'Do not close a case solely because one artifact was quarantined.' },
  { icon: 'ri-router-line', title: 'Scope proportionally', summary: 'Act on the evidence you have.', detail: 'This assisted lab contains one endpoint. Record that no second host is currently evidenced; do not convert that absence into proof that the wider environment is clean.', takeaway: 'State both the confirmed scope and its limit.' },
  { icon: 'ri-file-text-line', title: 'Write a useful handoff', summary: 'A responder needs facts and a next action.', detail: 'Name the affected endpoint, summarize the execution chain, cite decisive file or persistence evidence, and recommend a proportionate action.', takeaway: 'Observation, interpretation, and recommendation should be distinguishable.' },
];

/* Four-part practice loops are embedded in the existing 10 x 15-minute
 * theory allocations. They add no instructional minutes. Each loop uses the
 * same fictional fake-CAPTCHA → PowerShell → LOLBin → persistence chain while
 * asking the learner to apply one investigation habit. */
const MODULE_FIVE_LESSON_LOOPS = MODULE_FIVE_LESSONS.map((lesson, index) => ({
  ...lesson,
  id: `m05-loop-${index + 1}`,
  scenario: `On fictional Mission Next Labs workstation WS-LAB-27, a fake CAPTCHA prompt precedes a PowerShell launch. Review the ${lesson.title.toLowerCase()} evidence without assuming that a familiar name or a stopped file ends the investigation.`,
  theory: lesson.detail,
  questions: [
    { prompt: `What is the BEST analyst question when applying “${lesson.title}” to this chain?`, options: [
      { text: `What observable evidence supports or limits the ${lesson.title.toLowerCase()} conclusion?`, correct: true },
      { text: 'Which disruptive action can be taken before the evidence is reviewed?', correct: false },
      { text: 'What real organization or operator might be behind the activity?', correct: false },
    ] },
    { prompt: 'Which interpretation is MOST defensible from this isolated training dataset?', options: [
      { text: 'Connect the behavior to its parent, time, path, and scope before assigning intent.', correct: true },
      { text: 'A familiar executable name proves the action is benign.', correct: false },
      { text: 'One suspicious endpoint proves every endpoint is affected.', correct: false },
    ] },
    { prompt: 'What is the BEST next step after observing the signal?', options: [
      { text: 'Preserve the relevant evidence, state the boundary, and route proportionate response for review.', correct: true },
      { text: 'Delete all related files immediately without recording the chain.', correct: false },
      { text: 'Close the case because the sensor blocked one artifact.', correct: false },
    ] },
  ],
  task: `Write 20–80 characters naming the ${lesson.title.toLowerCase()} fact you would record for WS-LAB-27 and why it matters.`,
}));

let moduleFiveState = null;
let moduleFiveUser = null;
let moduleFiveReviewMode = false;
let moduleFiveQuizState = null;
let moduleFiveProveItShowMissing = false;
// Set when the learner explicitly asks to retake a knowledge check that the
// account already records as passed (see moduleFiveQuizVerifiedElsewhere()).
let moduleFiveQuizForceRetake = false;

function moduleFiveLoad(user) {
  if (moduleFiveUser?.email !== user?.email) moduleFiveQuizForceRetake = false;
  moduleFiveUser = user;
  moduleFiveState = LabRuntime.loadCaseState(MODULE_FIVE_LAB_ID, 'soc-05', user, MODULE_FIVE_DEFAULT_STATE);
  if (!Array.isArray(moduleFiveState.feedback)) moduleFiveState.feedback = [];
  if (!Array.isArray(moduleFiveState.flags)) moduleFiveState.flags = [];
  if (!moduleFiveState.lessonWork || typeof moduleFiveState.lessonWork !== 'object') moduleFiveState.lessonWork = {};
  if (typeof moduleFiveState.notes !== 'string') moduleFiveState.notes = '';
  if (typeof moduleFiveState.practiceNotes !== 'string') moduleFiveState.practiceNotes = '';
  if (!moduleFiveState.labProgress || typeof moduleFiveState.labProgress !== 'object') moduleFiveState.labProgress = {};

  // Standard ITSM ticket — init/migrate; never crash on an old saved shape.
  if (!moduleFiveState.caseRecord || typeof moduleFiveState.caseRecord !== 'object') {
    moduleFiveState.caseRecord = JSON.parse(JSON.stringify(MODULE_FIVE_DEFAULT_STATE.caseRecord));
  }
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleFiveState.caseRecord[key] !== 'string') moduleFiveState.caseRecord[key] = '';
  });
  if (!moduleFiveState.caseRecord.findings || typeof moduleFiveState.caseRecord.findings !== 'object') moduleFiveState.caseRecord.findings = {};
  if (!Array.isArray(moduleFiveState.caseRecord.actionHistory)) moduleFiveState.caseRecord.actionHistory = [];
  if (!Array.isArray(moduleFiveState.assessmentAttempts)) moduleFiveState.assessmentAttempts = [];
  let caseIdentityMigrated = false;
  if (moduleFiveState.caseRecord.caseId !== MODULE_FIVE_CASE_ID
    || moduleFiveState.caseRecord.scenarioId !== SocM05AssessmentData.scenario.id) {
    if (moduleFiveState.caseRecord.caseId && moduleFiveState.caseRecord.caseId !== MODULE_FIVE_LEGACY_CASE_ID
      && !moduleFiveState.caseRecord.legacyCaseId) moduleFiveState.caseRecord.legacyCaseId = moduleFiveState.caseRecord.caseId;
    if (moduleFiveState.caseRecord.caseId === MODULE_FIVE_LEGACY_CASE_ID && !moduleFiveState.caseRecord.legacyCaseId) {
      moduleFiveState.caseRecord.legacyCaseId = MODULE_FIVE_LEGACY_CASE_ID;
    }
    const oldUser = moduleFiveState.caseRecord.affectedUser;
    const oldDevice = moduleFiveState.caseRecord.affectedDevice;
    if (oldUser === 'j.alvarez' || oldUser === 'm.reyes') {
      moduleFiveState.caseRecord.legacyEntities ||= {};
      moduleFiveState.caseRecord.legacyEntities.affectedUser = oldUser;
      moduleFiveState.caseRecord.affectedUser = oldUser === 'j.alvarez' ? 'CORP\\j.alvarez' : 'CORP\\m.reyes';
    }
    if (oldDevice === 'WS-LAB-27' || oldDevice === 'WS-LAB-14') {
      moduleFiveState.caseRecord.legacyEntities ||= {};
      moduleFiveState.caseRecord.legacyEntities.affectedDevice = oldDevice;
      moduleFiveState.caseRecord.affectedDevice = oldDevice === 'WS-LAB-27' ? 'M05-DEV-001' : 'M05-DEV-002';
    }
    moduleFiveState.caseRecord.caseId = MODULE_FIVE_CASE_ID;
    moduleFiveState.caseRecord.scenarioId = SocM05AssessmentData.scenario.id;
    caseIdentityMigrated = true;
  }
  if (typeof moduleFiveState.caseRecord.submitted !== 'boolean') moduleFiveState.caseRecord.submitted = false;
  // Backward compat: the pre-migration m05-assessment-form only recorded
  // `attempts`/`completed` and a free-text `notes`. Treat any such
  // submission as already submitted so the student sees Lab Under Review /
  // Lab Graded instead of a blank ticket — never re-open work already sent
  // to faculty.
  if (!moduleFiveState.caseRecord.submitted && Number(moduleFiveState.attempts) > 0) {
    moduleFiveState.caseRecord.submitted = true;
    moduleFiveState.caseRecord.submittedAt = moduleFiveState.lastSubmittedAt || new Date().toISOString();
    if (!moduleFiveState.caseRecord.notes) moduleFiveState.caseRecord.notes = moduleFiveState.notes || '';
  }
  // The returned attempt remains immutable in lab_attempts; its saved
  // case-state latch must not make the working case permanently unsubmitable.
  // Scope this reset to an open redo for this exact lab (see Module 01).
  if (moduleFiveProveItRedoRequested() && moduleFiveState.caseRecord.submitted === true) {
    moduleFiveState.caseRecord.submitted = false;
    moduleFiveState.caseRecord.submittedAt = '';
    moduleFiveSave();
  } else if (caseIdentityMigrated) {
    moduleFiveSave();
  }

  // Initialize quiz state
  if (!moduleFiveQuizState) {
    const previousQuestionIds = moduleFiveState.lastQuizQuestionIds || [];
    moduleFiveQuizState = createQuizAttempt(MODULE_FIVE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-05');
  return moduleFiveState;
}

function moduleFiveSave() {
  if (moduleFiveUser && moduleFiveState) LabRuntime.saveCaseState(MODULE_FIVE_LAB_ID, 'soc-05', moduleFiveUser, moduleFiveState);
}

function moduleFiveGetSections() {
  // Server-verified modules (finished on another device, before the 09-27
  // lab rebuild, or by admin override) read complete instead of empty.
  const verified = moduleFiveUser?.remoteVerifiedModuleProgress?.['soc-05'] === true;
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm05-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: verified || moduleFiveQuizState?.passed, scrollId: 'm05-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: verified || moduleFiveGuidedChecks().every((check) => check[2]), scrollId: 'm05-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: verified || moduleFiveState.completed, scrollId: 'm05-assessment-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm05-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm05-sources', gated: false, supplemental: true },
  ];
}

function moduleFiveGetQuickNavItems() {
  const items = [];
  MODULE_FIVE_LESSON_LOOPS.forEach((lesson, index) => {
    const work = moduleFiveState.lessonWork[lesson.id] || {};
    const isComplete = work.taskComplete === true;
    items.push({
      id: `m05-lesson-${esc(lesson.id)}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m05-lesson-${esc(lesson.id)}`,
      lessonNumber: index + 1,
    });
  });
  items.push({
    id: 'm05-guided-lab',
    title: 'Guided Lab',
    kind: 'lab',
    isComplete: moduleFiveGuidedChecks().every((check) => check[2]),
    scrollId: 'm05-guided-lab',
  });
  items.push({
    id: 'm05-assessment-lab',
    title: 'Assessment Lab',
    kind: 'lab',
    isComplete: moduleFiveState.completed === true,
    scrollId: 'm05-assessment-lab',
  });
  return items;
}

function moduleFiveQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleFiveQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m05-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m05-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m05-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

// A knowledge check can read complete on the account (server-verified module,
// synced quiz detail, or knowledge-check evidence) while this browser holds no
// answers — another device did the work, or an admin override set it. Show a
// verified summary instead of a blank 0/N form; never fabricate answers.
function moduleFiveQuizVerifiedElsewhere() {
  if (moduleFiveQuizForceRetake || !moduleFiveQuizState || moduleFiveQuizState.scored) return false;
  if (Object.keys(moduleFiveQuizState.answers || {}).length > 0) return false;
  return moduleFiveUser?.remoteVerifiedModuleProgress?.['soc-05'] === true
    || moduleFiveUser?.remoteModuleDetail?.['soc-05']?.quizPassed === true
    || moduleFiveUser?.remoteModuleEvidence?.['soc-05']?.['knowledge-check'] === true;
}

function moduleFiveQuizPanel() {
  if (!moduleFiveQuizState?.selectedQuestions || moduleFiveQuizState.selectedQuestions.length === 0) {
    return `<div class="m05-quiz-empty" id="m05-quiz-feedback" role="status">Loading quiz...</div>`;
  }
  if (moduleFiveQuizVerifiedElsewhere()) {
    return `<form class="m05-quiz-form mf-quiz-form" id="m05-quiz-form" novalidate><section class="mf-score is-pass" id="m05-quiz-feedback" tabindex="-1" aria-live="polite"><p class="mf-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" class="mf-score-retake" data-m05-quiz-retake>Retake this knowledge check</button></section></form>`;
  }

  const selected = moduleFiveQuizState.selectedQuestions;
  const answered = Object.keys(moduleFiveQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleFiveQuizState.scored) {
    const passed = moduleFiveQuizState.score >= 70;
    feedbackHtml = `<section class="m05-quiz-score mf-score ${passed ? 'm05-quiz-pass is-pass' : 'm05-quiz-remediate is-remediate'}" id="m05-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m05-quiz-score-heading">
        <div>
          <p class="m05-kicker">Attempt ${moduleFiveQuizState.attempts} · best ${moduleFiveQuizState.bestScore}/100</p>
          <h3>${moduleFiveQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleFiveQuizState.score}</span>
      </div>
      <ul class="m05-quiz-feedback-list">
        ${(moduleFiveQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm05-quiz-feedback-correct' : 'm05-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m05-quiz-actions"><button type="button" class="m05-quiz-retry" data-m05-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m05-quiz-ready" id="m05-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m05-quiz-empty" id="m05-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m05-quiz-form mf-quiz-form" id="m05-quiz-form" novalidate>
    <div class="m05-panel-heading mf-panel-heading"><div><p class="m05-kicker mf-kicker">Knowledge check</p><h3 id="m05-quiz-title" tabindex="-1">Test your understanding of endpoint investigation</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleFiveQuizQuestion(sel, idx)).join('')}
    <div class="m05-quiz-actions">
      <button class="m05-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleFiveVideoScript() {
  return '';
}

function moduleFiveReview() {
  return `<section class="m05-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Endpoint telemetry:</strong> EDR records events (file creation, process starts, registry changes) as observable facts. Combine reputation (signer, prevalence, fixture result) with behavior to assess risk.</li>
      <li><strong>Process trees:</strong> Parent-child relationships show execution chains. Trace from the initial process to understand how execution was chained and where the threat was introduced.</li>
      <li><strong>Command context:</strong> Command-line arguments reveal intent. Hidden, encoded, or unusual options paired with suspicious parents are signals for further inspection.</li>
      <li><strong>Endpoint timelines:</strong> Arrange events by time to see cause-and-effect. File creation, process start, persistence entry, and sensor action in sequence tell a story.</li>
      <li><strong>File evaluation:</strong> Assess signer status, prevalence, reputation, and observed behavior. No single field is final; combine them to support a verdict.</li>
      <li><strong>Persistence mechanisms:</strong> Run keys, scheduled tasks, services, and startup folders enable malware to survive restarts. Stopping the file is not enough; remove the persistence entry too.</li>
      <li><strong>Scope and proportionality:</strong> Confine your conclusion to what the data shows. One endpoint is confirmed; other hosts are not proven. Recommend containment (isolate, preserve, escalate) not disruption.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to read a process tree, build a timeline, evaluate a file using multiple signals, and distinguish observable facts from assumptions. In the field, you will inherit alerts, inspect the telemetry, identify the chain, and decide whether the scope is single-endpoint or wider. Remember: the sensor prevents individual files; you prevent incidents by reading the chain correctly and handing off to responders with confidence.</p>
  </section>`;
}

function moduleFiveLessonLoop(lesson, index) {
  const work = moduleFiveState.lessonWork[lesson.id] || { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
  const feedback = work.feedback?.length ? `<p class="m05-lesson-feedback ${work.checked ? 'is-pass' : 'is-hint'}" role="status">${esc(work.feedback.join(' '))}</p>` : '';
  return `<details class="m05-lesson-loop mf-lesson" ${work.taskComplete ? '' : (index === 0 ? 'open' : '')}>
    <summary><span class="m05-lesson-number mf-lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lesson.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lesson.title)}</strong><small>${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<span class="mf-lesson-done" aria-label="Lesson complete"><i class="ri-check-line" aria-hidden="true"></i></span>' : ''}<i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary>
    <div class="m05-lesson-loop-body mf-lesson-body"><section><p class="m05-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section><section><p class="m05-kicker">Theory</p><p>${esc(lesson.theory)}</p></section><section><p class="m05-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset class="m05-lesson-question"><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m05-loop-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m05-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${Number(work.answers?.[qIndex]) === optionIndex ? 'checked' : ''}><span>${esc(option.text)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m05-lesson-check" data-m05-lesson-check="${esc(lesson.id)}">Check this lesson</button>${feedback}</section><section><p class="m05-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m05-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m05-lesson-task-button" data-m05-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section></div>
  </details>`;
}

function moduleFiveLessonGrid() {
  return `<section class="m05-lesson-loops" id="m05-lesson-loops" aria-labelledby="m05-lesson-loops-title"><div class="m05-panel-heading"><div><p class="m05-kicker">Four-part lesson loops</p><h3 id="m05-lesson-loops-title">Practice the fake-CAPTCHA execution chain</h3></div><span>10 lessons · embedded in existing theory minutes</span></div><div class="m05-lesson-grid mf-lesson-grid">${MODULE_FIVE_LESSON_LOOPS.map(moduleFiveLessonLoop).join('')}</div></section>`;
}


function moduleFiveGuidedLabPanel() {
  const complete = moduleFiveGuidedChecks().every((check) => check[2]);
  return `${moduleFiveGuidedGuide()}<div class="m03e-panel" id="m05-guided-prove-panel"><div class="m03e-brief"><p class="m03e-label">CASE EDR-5204 · ENDPOINT ALERT · PRACTICE IT</p><p>A script attached to a quarterly forecast email ran on WS-PRACTICE-41. Reconstruct the process chain, assess persistence and sensor coverage, preserve linked evidence, and choose a proportionate response. Work independently; the guide checks recorded actions.</p></div><div class="m03e-console-host" id="m03e-console-m05-guided">${moduleThreeConsoleHtml('m05-guided')}</div></div><p class="m05-guided-status" role="status">${complete ? 'Guided Lab complete: all investigation checks are recorded.' : 'Complete the investigation in the console; progress is saved automatically.'}</p>`;
}

const MODULE_FIVE_OPTIONAL_LABS = [
  { title: 'Analyzing Windows Sysmon Events for Security Incidents', detail: 'Independent Sysmon log analysis', href: 'imported-labs/mission-next-labs/index.html#/track/log-analysis/project/lap-5/lab', labId: 'assessment-1' },
  { title: 'Behavioral Analysis of a Keylogger', detail: 'Persistence and endpoint behavior', href: 'imported-labs/mission-next-labs/index.html#/track/malware-analysis/project/ma-4/lab', labId: 'assessment-2' },
];

function moduleFiveAdditionalLabs() {
  return missionNextOptionalLabsSection(5, MODULE_FIVE_OPTIONAL_LABS, moduleFiveState.labProgress);
}

/* The Module 3 console, carrying Module 4's tools, with Module 5's Endpoint
 * workspace. Endpoint telemetry is also normalized into Log Search tables. */
const MODULE_FIVE_ENDPOINT_SOURCES = {
  process_start: 'DeviceProcessEvents', file_create: 'DeviceFileEvents', file_hash: 'DeviceFileEvents',
  persistence_change: 'DeviceRegistryEvents', sensor_control: 'DeviceAlertEvents',
};
// Practice It has its own endpoint case, event IDs, entities, and persisted
// console/tool state. It intentionally reuses the assessment schema and UI.
const MODULE_FIVE_GUIDED_LAB_ID = 'm05-guided-endpoint-chain-v1';
let moduleFiveGuidedState = null;
let moduleFiveGuidedUser = null;
const moduleFiveGuidedClone = (value) => JSON.parse(JSON.stringify(value));
const MODULE_FIVE_GUIDED_REPLACEMENTS = {
  'M05-ASSESS-2026-09-27': 'M05-GUIDED-2026-09-27', 'EDR-5127': 'EDR-5204', 'm05-endpoint-assessment-v1': MODULE_FIVE_GUIDED_LAB_ID,
  'M05-DEV-001': 'M05-GUIDE-101', 'M05-DEV-002': 'M05-GUIDE-102', 'M05-DEV-003': 'M05-GUIDE-103',
  'WS-ASSESS-27': 'WS-PRACTICE-41', 'WS-ASSESS-14': 'WS-PRACTICE-12', 'SRV-ASSESS-02': 'SRV-PRACTICE-03',
  'M05-EVT-001': 'M05-PR-201', 'M05-EVT-002': 'M05-PR-202', 'M05-EVT-003': 'M05-PR-203', 'M05-EVT-004': 'M05-PR-204', 'M05-EVT-005': 'M05-PR-205', 'M05-EVT-006': 'M05-PR-206', 'M05-EVT-007': 'M05-PR-207', 'M05-EVT-008': 'M05-PR-208', 'M05-EVT-009': 'M05-PR-209', 'M05-EVT-010': 'M05-PR-210', 'M05-EVT-011': 'M05-PR-211', 'M05-EVT-012': 'M05-PR-212', 'M05-EVT-013': 'M05-PR-213',
  'CORP\\j.alvarez': 'CORP\\r.patel', 'CORP\\m.reyes': 'CORP\\s.kim', 'j.alvarez': 'r.patel', 'm.reyes': 's.kim',
  'syncsvc.exe': 'cachehost.exe', 'SyncService': 'CacheHost', '4100': '7100', '4172': '7172', '4224': '7224', '3020': '8020', '5090': '8090', '2380': '8380', '6110': '8610',
  ['a'.repeat(64)]: 'c'.repeat(64), ['b'.repeat(64)]: 'd'.repeat(64),
};
function moduleFiveGuidedReplace(value) {
  if (typeof value === 'string') return Object.entries(MODULE_FIVE_GUIDED_REPLACEMENTS).reduce((result, [from, to]) => result.split(from).join(to), value);
  if (Array.isArray(value)) return value.map(moduleFiveGuidedReplace);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, moduleFiveGuidedReplace(item)]));
  return value;
}
const MODULE_FIVE_GUIDED_FIXTURE = moduleFiveGuidedReplace(moduleFiveGuidedClone(SocM05AssessmentData));
MODULE_FIVE_GUIDED_FIXTURE.scenario.caseId = 'EDR-5204';
MODULE_FIVE_GUIDED_FIXTURE.scenario.id = 'M05-GUIDED-2026-09-27';
MODULE_FIVE_GUIDED_FIXTURE.scenario.stateKey = MODULE_FIVE_GUIDED_LAB_ID;
MODULE_FIVE_GUIDED_FIXTURE.scenario.start = '2026-09-27T13:00:00Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.end = '2026-09-27T13:30:00Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.generatedAt = '2026-09-27T13:31:00Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.devices[0].owner = 'r.patel';
MODULE_FIVE_GUIDED_FIXTURE.scenario.devices[1].owner = 's.kim';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry.forEach((event) => { event.time = event.time.replace('09:', '13:'); });
Object.assign(MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[0], { image: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', commandLine: 'OUTLOOK.EXE /embedding', url: null, action: 'attachment_previewed' });
Object.assign(MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[1], { image: 'C:\\Windows\\System32\\wscript.exe', commandLine: 'wscript.exe //B "C:\\Users\\r.patel\\Downloads\\Quarterly Forecast.js"', action: 'script_host_started' });
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[2].parentProcessId = '7172';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[2].filePath = 'C:\\Users\\r.patel\\AppData\\Local\\Temp\\cachehost.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[3].filePath = 'C:\\Users\\r.patel\\AppData\\Local\\Temp\\cachehost.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[4].filePath = 'C:\\Users\\r.patel\\AppData\\Local\\Temp\\cachehost.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[5].registryPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\CacheHost';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[6].result = 'detected_and_terminated_after_run_key_write';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[8].image = 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[8].commandLine = 'CloudSync.exe /update /silent';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[8].filePath = 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[8].signer = 'CN=Contoso Systems Ltd.';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[9].image = 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[10].image = 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[10].filePath = 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[9].signer = 'CN=Contoso Systems Ltd.';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[10].signer = 'CN=Contoso Systems Ltd.';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[8].time = '2026-09-27T13:20:04Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[9].time = '2026-09-27T13:22:42Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.telemetry[10].time = '2026-09-27T13:22:43Z';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.confirmedDevice.value = 'M05-GUIDE-101';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.confirmedUser.value = 'CORP\\r.patel';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.processAncestry.chain = ['7100', '7172', '7224'];
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.maliciousFile.path = 'C:\\Users\\r.patel\\AppData\\Local\\Temp\\cachehost.exe';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.persistence.registryPath = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\CacheHost';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.endpointControl.outcome = 'detected_and_terminated_after_run_key_write';
MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth.benignActivity = [
  { type: 'approved_cloud_sync_update', eventIds: ['M05-PR-208', 'M05-PR-209'] },
  { type: 'same_signed_client_on_comparison_device', eventIds: ['M05-PR-210', 'M05-PR-211'] },
];
const MODULE_FIVE_GUIDED_CONSOLE_DATA = (() => {
  const s = MODULE_FIVE_GUIDED_FIXTURE.scenario;
  const day = s.start.slice(0, 10);
  const events = s.telemetry.map((e) => m03eRow(MODULE_FIVE_ENDPOINT_SOURCES[e.eventType] || 'DeviceEvents', e.id, day, e.time.slice(11, 19), {
    EventType: e.eventType, Account: e.user, Host: e.host, DeviceId: e.deviceId, ProcessId: e.processId || '', ParentProcessId: e.parentProcessId || '',
    Image: e.image || '', CommandLine: e.commandLine || '', FilePath: e.filePath || '', Sha256: e.sha256 || '', RegistryPath: e.registryPath || '',
    Action: e.action, Result: e.result, Url: e.url || '', Signer: e.signer || '', Prevalence: e.prevalence ?? '', Reputation: e.reputation || '', Detail: e.commandLine || e.registryPath || e.filePath || e.action,
  }));
  const person = (account, name, owner) => ({ Account: account, DisplayName: name, Type: owner ? 'Service' : 'User', Department: owner ? 'IT Operations' : 'Engineering', Owner: owner || '—', Privileged: owner ? 'Yes' : 'No', UsualSourceIp: '—', Notes: '' });
  return { ...m03eBuildDataset({ caseId: s.caseId, day, events,
    identities: [person('CORP\\r.patel', 'R. Patel'), person('CORP\\s.kim', 'S. Kim'), person('SYSTEM', 'Local system', 'Endpoint platform')], ips: [],
    watchlists: { ApprovedSoftware: { title: 'Approved software inventory', rows: [{ Product: 'Contoso CloudSync', Publisher: 'CN=Contoso Systems Ltd.', Path: 'C:\\Program Files\\Contoso\\CloudSync\\CloudSync.exe', Deployment: 'All workstations', Status: 'Approved' }] } },
    alerts: [{ id: 'ALT-5204', time: '2026-09-27T13:05:33Z', severity: 'High', title: 'Endpoint sensor detection on WS-PRACTICE-41', entities: ['WS-PRACTICE-41', 'CORP\\r.patel'], rule: 'EDR behavioral detection: unsigned binary started from a user temp folder', query: 'DeviceAlertEvents\n| where Host == "WS-PRACTICE-41"' }],
  }), now: s.end };
})();
const MODULE_FIVE_GUIDED_M04_FIXTURE = SocConsoleTools.m04Fixture({ id: MODULE_FIVE_GUIDED_FIXTURE.scenario.id, caseId: MODULE_FIVE_GUIDED_FIXTURE.scenario.caseId, end: MODULE_FIVE_GUIDED_FIXTURE.scenario.end, data: MODULE_FIVE_GUIDED_CONSOLE_DATA });
const MODULE_FIVE_GUIDED_M05_FIXTURE = SocConsoleTools.m05Fixture({ id: MODULE_FIVE_GUIDED_FIXTURE.scenario.id, stateKey: MODULE_FIVE_GUIDED_LAB_ID, devices: MODULE_FIVE_GUIDED_FIXTURE.scenario.devices, data: MODULE_FIVE_GUIDED_CONSOLE_DATA, expectedTruth: MODULE_FIVE_GUIDED_FIXTURE.scenario.expectedTruth });
function moduleFiveGuidedLoad(user) {
  moduleFiveGuidedUser = user;
  const defaults = { console: {}, tools: {}, caseRecord: { caseId: 'EDR-5204', scenarioId: MODULE_FIVE_GUIDED_FIXTURE.scenario.id, status: 'New', severity: '', affectedUser: '', affectedDevice: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, actionHistory: [] }, guideOpen: true };
  moduleFiveGuidedState = LabRuntime.loadCaseState(MODULE_FIVE_GUIDED_LAB_ID, 'soc-05', user, defaults);
  moduleFiveGuidedState.caseRecord = { ...defaults.caseRecord, ...(moduleFiveGuidedState.caseRecord || {}) };
  moduleFiveGuidedState.tools ||= {};
  moduleFiveGuidedState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleFiveGuidedState.tools.m04 }, MODULE_FIVE_GUIDED_M04_FIXTURE).assessment;
  moduleFiveGuidedState.tools.m05 = SocM05AssessmentState.normalize(moduleFiveGuidedState.tools.m05, MODULE_FIVE_GUIDED_M05_FIXTURE);
}
function moduleFiveGuidedSave() { if (moduleFiveGuidedUser && moduleFiveGuidedState) LabRuntime.saveCaseState(MODULE_FIVE_GUIDED_LAB_ID, 'soc-05', moduleFiveGuidedUser, moduleFiveGuidedState); }
function moduleFiveGuidedM04Tools() { return moduleFiveGuidedState.tools.m04; }
function moduleFiveGuidedM05Load() { return moduleFiveGuidedState.tools.m05; }
function moduleFiveGuidedM05Store(next) { moduleFiveGuidedState.tools.m05 = SocM05AssessmentState.normalize(next, MODULE_FIVE_GUIDED_M05_FIXTURE); moduleFiveGuidedSave(); }
function moduleFiveGuidedChecks() {
  const consoleState = m03eState('m05-guided');
  const tools = moduleFiveGuidedM05Load();
  return [
    ['alert', 'Inspect the endpoint alert and follow it to a device.', consoleState.seen?.includes('alert:ALT-5204') || tools.selectedDeviceIds?.includes('M05-GUIDE-101')],
    ['chain', 'Compare the process, file, persistence, and sensor records.', (consoleState.queryLog || []).length > 0 && tools.selectedDeviceIds?.includes('M05-GUIDE-101')],
    ['evidence', 'Preserve linked telemetry and its file hash.', Boolean(tools.evidencePackage?.eventIds?.length && tools.evidencePackage?.hashes?.length)],
    ['handoff', 'Record a proportionate endpoint response request or EDR handoff.', Boolean(tools.approvalRequests?.length || tools.edrHandoffs?.length)],
  ];
}
function moduleFiveGuidedGuide() {
  const checks = moduleFiveGuidedChecks();
  return `<details class="m05-console-guide" ${moduleFiveGuidedState.guideOpen ? 'open' : ''}><summary>Console Guide · ${checks.filter((check) => check[2]).length}/${checks.length} checks</summary><ol>${checks.map((check) => `<li>${check[1]} <span>${check[2] ? 'Done' : 'Pending'}</span></li>`).join('')}</ol><details><summary>Optional hint</summary><p>A device selection opens its profile; correlate the file reputation, Run-key record, and execution control result before requesting action.</p></details></details>`;
}
const MODULE_FIVE_GUIDED_CONSOLE = SocConsoleTools.mount('m05-guided', {
  data: MODULE_FIVE_GUIDED_CONSOLE_DATA, stateRoot: () => moduleFiveGuidedState, save: moduleFiveGuidedSave,
  title: 'SIEM & ENDPOINT INVESTIGATION · PRACTICE', ariaLabel: 'Module 05 guided endpoint console', idPrefix: 'guided',
  sourceMappings: {
    DeviceProcessEvents: { native: 'EDR process telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['user', 'Account'], ['pid', 'ProcessId'], ['ppid', 'ParentProcessId'], ['image', 'Image'], ['command_line', 'CommandLine'], ['url', 'Url']] },
    DeviceFileEvents: { native: 'EDR file telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['path', 'FilePath'], ['sha256', 'Sha256'], ['signer', 'Signer'], ['prevalence', 'Prevalence'], ['reputation', 'Reputation']] },
    DeviceRegistryEvents: { native: 'EDR registry telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['key', 'RegistryPath'], ['action', 'Action'], ['result', 'Result']] },
    DeviceAlertEvents: { native: 'EDR sensor control outcomes (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['path', 'FilePath'], ['sha256', 'Sha256'], ['control', 'Action'], ['outcome', 'Result']] },
  },
  packs: [
    { id: 'm04', ctx: { assessment: moduleFiveGuidedM04Tools, fixture: MODULE_FIVE_GUIDED_M04_FIXTURE, save: moduleFiveGuidedSave, rerender: () => moduleFiveRenderGuided(), console: () => m03eState('m05-guided') } },
    { id: 'm05', ctx: { fixture: MODULE_FIVE_GUIDED_FIXTURE, load: moduleFiveGuidedM05Load, store: moduleFiveGuidedM05Store, save: moduleFiveGuidedSave, rerender: () => moduleFiveRenderGuided(), console: () => m03eState('m05-guided') } },
  ],
  caseView: () => caseRecordPane(moduleFiveGuidedState.caseRecord, { caseId: 'EDR-5204', ticketId: 'INC-5204', ticketType: 'Endpoint malware investigation · Endpoint Malware Triage', userOptions: [{ id: 'CORP\\r.patel', text: 'CORP\\r.patel' }, { id: 'CORP\\s.kim', text: 'CORP\\s.kim' }], deviceOptions: MODULE_FIVE_GUIDED_FIXTURE.scenario.devices.map((device) => ({ id: device.id, text: `${device.hostname} · ${device.role}` })), departmentOptions: [{ id: 'endpoint-malware-triage', text: 'Endpoint Malware Triage' }, { id: 'tier2-soc', text: 'Tier 2 SOC' }, { id: 'identity-response', text: 'Identity Response' }], formId: 'm05-guided-case', saveAttr: 'data-m05-guided-save-case', submitAttr: 'data-m05-guided-submit-case', panelId: 'm05-guided-case-panel', notesPlaceholder: 'Link process ancestry, file reputation, persistence, sensor outcome, and a bounded response recommendation.' }),
});
const MODULE_FIVE_CONSOLE_DATA = (function () {
  const s = SocM05AssessmentData.scenario;
  const day = s.start.slice(0, 10);
  const events = s.telemetry.map((e) => m03eRow(MODULE_FIVE_ENDPOINT_SOURCES[e.eventType] || 'DeviceEvents', e.id, day, e.time.slice(11, 19), {
    EventType: e.eventType, Account: e.user, Host: e.host, DeviceId: e.deviceId, ProcessId: e.processId || '', ParentProcessId: e.parentProcessId || '',
    Image: e.image || '', CommandLine: e.commandLine || '', FilePath: e.filePath || '', Sha256: e.sha256 || '', RegistryPath: e.registryPath || '',
    Action: e.action, Result: e.result, Url: e.url || '', Signer: e.signer || '', Prevalence: e.prevalence ?? '', Reputation: e.reputation || '',
    Detail: e.commandLine || e.registryPath || e.filePath || e.action,
  }));
  const person = (account, name, owner) => ({ Account: account, DisplayName: name, Type: owner ? 'Service' : 'User', Department: owner ? 'IT Operations' : 'Finance', Owner: owner || '—', Privileged: owner ? 'Yes' : 'No', UsualSourceIp: '—', Notes: '' });
  return {
    ...m03eBuildDataset({
      caseId: s.caseId,
      day,
      events,
      identities: [person('CORP\\j.alvarez', 'J. Alvarez'), person('CORP\\m.reyes', 'M. Reyes'), person('SYSTEM', 'Local system', 'Endpoint platform')],
      ips: [],
      watchlists: {
        ApprovedSoftware: { title: 'Approved software inventory', rows: [
          { Product: 'Acme Updater', Publisher: 'CN=Acme Software LLC', Path: 'C:\\Program Files\\AcmeUpdater\\AcmeUpdate.exe', Deployment: 'All workstations', Status: 'Approved' },
        ] },
      },
      alerts: [
        { id: 'ALT-5127', time: '2026-09-27T09:05:33Z', severity: 'High', title: 'Endpoint sensor detection on WS-ASSESS-27', entities: ['WS-ASSESS-27', 'CORP\\j.alvarez'], rule: 'EDR behavioral detection: unsigned binary started from a user temp folder', query: 'DeviceAlertEvents\n| where Host == "WS-ASSESS-27"' },
      ],
    }),
    now: s.end,
  };
}());
const MODULE_FIVE_M04_FIXTURE = SocConsoleTools.m04Fixture({ id: SocM05AssessmentData.scenario.id, caseId: MODULE_FIVE_CASE_ID, end: SocM05AssessmentData.scenario.end, data: MODULE_FIVE_CONSOLE_DATA });

function moduleFiveM04Tools() {
  moduleFiveState.tools ||= {};
  if (!moduleFiveState.tools.m04?.schemaVersion) moduleFiveState.tools.m04 = SocM04AssessmentState.normalize({ assessment: moduleFiveState.tools.m04 }, MODULE_FIVE_M04_FIXTURE).assessment;
  return moduleFiveState.tools.m04;
}

const MODULE_FIVE_CONSOLE = SocConsoleTools.mount('m05', {
  data: MODULE_FIVE_CONSOLE_DATA,
  stateRoot: () => moduleFiveState,
  save: () => moduleFiveSave(),
  title: 'SIEM & ENDPOINT INVESTIGATION',
  ariaLabel: 'Module 05 endpoint assessment console',
  sourceMappings: {
    DeviceProcessEvents: { native: 'EDR process telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['user', 'Account'], ['pid', 'ProcessId'], ['ppid', 'ParentProcessId'], ['image', 'Image'], ['command_line', 'CommandLine'], ['url', 'Url']] },
    DeviceFileEvents: { native: 'EDR file telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['path', 'FilePath'], ['sha256', 'Sha256'], ['signer', 'Signer'], ['prevalence', 'Prevalence'], ['reputation', 'Reputation']] },
    DeviceRegistryEvents: { native: 'EDR registry telemetry (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['key', 'RegistryPath'], ['action', 'Action'], ['result', 'Result']] },
    DeviceAlertEvents: { native: 'EDR sensor control outcomes (JSON)', fields: [['timestamp', 'TimeGenerated'], ['device_id', 'DeviceId'], ['hostname', 'Host'], ['path', 'FilePath'], ['sha256', 'Sha256'], ['control', 'Action'], ['outcome', 'Result']] },
  },
  packs: [
    { id: 'm04', ctx: { assessment: moduleFiveM04Tools, fixture: MODULE_FIVE_M04_FIXTURE, save: () => moduleFiveSave(), rerender: () => moduleFiveRenderAssessment(), console: () => m03eState('m05') } },
    { id: 'm05', ctx: { fixture: SocM05AssessmentData, load: () => SocM05AssessmentState.load(moduleFiveUser, SocM05AssessmentData), store: (next) => SocM05AssessmentState.save(moduleFiveUser, next, SocM05AssessmentData), save: () => moduleFiveSave(), rerender: () => moduleFiveRenderAssessment(), console: () => m03eState('m05') } },
  ],
  caseView: () => moduleFiveCaseTicket(),
  caseBadge: () => (moduleFiveState.caseRecord.submitted ? ' <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>' : ''),
});

function moduleFiveCaseTicket() {
  const cr = moduleFiveState.caseRecord;
  const spec = moduleFiveCaseSpec();
  return caseRecordPane(cr, {
    ...spec,
    missing: caseRecordMissing(cr, spec),
    formId: 'm05-assessment',
    saveAttr: 'data-m05-save-case',
    submitAttr: 'data-m05-submit-case',
    panelId: 'm05-case-panel',
    showMissing: moduleFiveProveItShowMissing,
    redoRequested: moduleFiveProveItRedoRequested(),
    redoHtml: moduleFiveProveItRedoFeedback(),
    reviewStatus: moduleFiveProveItReviewStatus(),
    lockedMessage: 'Module 6 stays locked until your instructor approves the submission.',
  });
}

function moduleFiveAssessmentLabPanel() {
  return `<div class="m03e-panel" id="m05-prove-panel">
    <div class="m03e-brief"><p class="m03e-label">CASE ${esc(MODULE_FIVE_CASE_ID)} · ENDPOINT ALERT · ASSIGNED TO YOU</p><p>The EDR sensor raised an alert on a user workstation. Your lead’s request: <em>“Work out what actually ran, whether it stuck, and whether our control stopped it — then tell the endpoint team exactly what to do and why.”</em> Pivot from the alert to the device, follow the process chain, judge the file and hash, find any persistence, decide what the control did, bound the scope, preserve the strongest evidence, request only proportionate action, and complete the ITSM ticket.</p></div>
    <div class="m03e-console-host" id="m03e-console-m05">${moduleThreeConsoleHtml('m05')}</div>
  </div>`;
}

function moduleFiveRenderAssessment() {
  const root = document.getElementById('m05-assessment-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFiveAssessmentLabPanel();
  m03eAttachEditor('m05');
}

function moduleFiveLecture() {
  return `<section class="m05-lecture-section">
    <div class="m05-lecture-intro">
      <p><strong>What is endpoint investigation?</strong> An EDR (Endpoint Detection and Response) system watches a workstation: it records process starts, file creation, registry changes, and prevention actions. Your job is not to prevent malware—the sensor prevents individual files. Your job is to read the chain of events, understand what happened, estimate the scope, and hand off to responders with confidence. This lab teaches analysis and triage without reverse-engineering or exploit development.</p>
    </div>

    <aside class="m05-crosswalk"><strong>Supplementary Security+ crosswalk (developer draft)</strong><p>This module practices endpoint behavior analysis, secure response decisions, and evidence-aware communication that are relevant to the draft course crosswalk: threat identification, security operations, and incident response. It is a study aid only, not an endorsement, affiliation, approval, or pass guarantee.</p></aside>

    <h3>The investigation foundation</h3>
    <p>Every indicator recorded by EDR—a file, a process, a registry entry—is an observable fact. Before you judge whether it is malicious, ask: Where did it come from? Who (or what) created it? What did it do? A file named "update.exe" running from a user's Download folder is suspicious; the same bytes running from System32 because Windows needed them is benign. Context determines interpretation.</p>

    <h3>Telemetry: Trust behavior, not names</h3>
    <p>Process and file names can look legitimate while their behavior is not. A trusted, signed executable (like PowerShell) launched by Office with hidden, encoded arguments is behaving unusually. Combine reputation (signer status, prevalence, fixture results) with behavior. Reputation is one signal; behavior is the final word.</p>

    <h3>The process tree reveals execution chains</h3>
    <p>A process tree shows parent-child relationships: which process launched which. The relationships answer: How did execution begin? Was it user-initiated or scripted? Office launching PowerShell is uncommon and worth inspection. An unknown application launching system services is suspicious. Trace the chain from the root cause.</p>

    <h3>Command-line arguments reveal intent</h3>
    <p>Executables accept arguments that change their behavior. A shell with "-WindowStyle Hidden -EncodedCommand" is behaving differently than an interactive shell. Encoded commands are not proof on their own, but they are a pattern—combined with a suspicious parent process and low prevalence, they warrant investigation.</p>

    <h3>Timelines turn events into stories</h3>
    <p>Arrange telemetry events by time: file creation, process starts, registry changes, sensor action. The order matters. A file created before a process launches suggests preparation; persistence entries created after execution suggest intent to stay. Timeline analysis is the most powerful investigative tool in endpoint work.</p>

    <h3>Files need multiple signals</h3>
    <p>Evaluate files using: signer status (trusted, unsigned, revoked), prevalence (one endpoint vs. millions), reputation (has it been flagged), behavior (what it did). No single field is final. Combine them: unsigned + low prevalence + loader signature = malicious. Trusted signer alone is not definitive if behavior is unusual.</p>

    <h3>Persistence survives restarts</h3>
    <p>Malware often creates entries in autostart locations: Run keys, scheduled tasks, services, startup folders. Preventing one file is not enough if a persistence entry still exists. The file can be removed; the entry will relaunch it at the next login or system event.</p>

    <h3>Scope is what you can prove</h3>
    <p>This lab contains one endpoint. You can prove that one host is affected. You cannot prove that no other host is affected. Proportionate response means isolate, preserve evidence, and escalate for broader investigation. Do not assume a single endpoint means the enterprise is clean.</p>
  </section>`;
}

function viewModuleFive(user, program) {
  moduleFiveLoad(user);
  moduleFiveGuidedLoad(user);
  const complete = moduleFiveState.completed === true;
  const module = program.modules['soc-05'];
  const sections = moduleFiveGetSections();
  const lectureOpen = moduleFiveReviewMode || !sections[0].isComplete;
  const quizOpen = moduleFiveReviewMode || (moduleFiveQuizState && !moduleFiveQuizState.passed);
  const guidedLabOpen = moduleFiveReviewMode || !sections[2].isComplete;
  const assessmentLabOpen = moduleFiveReviewMode || !sections[3].isComplete;
  const reviewOpen = moduleFiveReviewMode;
  const quickNavItems = moduleFiveGetQuickNavItems();

  return `<div class="m05-shell">
    ${moduleTopbar(user, program)}
    <div class="mquick-nav-layout">
      ${moduleProgressShell(sections, { reviewMode: moduleFiveReviewMode })}
      <main class="m05-main mf-frame">
      <section class="m05-hero mf-hero" aria-labelledby="m05-title"><div><p class="m05-kicker mf-kicker">Module 05 · ${formatHandsOnDuration(module.durationMinutes)} · assisted investigation</p><h1 id="m05-title">${esc(module.title)}</h1><p class="mf-lede">Read process relationships, reconstruct endpoint activity, evaluate a suspicious file, and create a proportionate response handoff without leaving this one-workstation lab. This is analyst investigation and triage: learners do not reverse-engineer or develop malware, and specialist analysis is escalated.</p></div><dl class="mf-stats"><div><dt>Guided Lab</dt><dd>${moduleFiveGuidedChecks().every((check) => check[2]) ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m05-status">${complete ? 'Complete' : moduleFiveState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m05-section-collapsible mf-section" ${lectureOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge">1</span><div><p class="m05-kicker mf-kicker">Lecture</p><h2 id="m05-lecture">Endpoint investigation foundations</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">${moduleFiveLecture()}${moduleFiveVideoScript()}${moduleFiveLessonGrid()}</div>
      </details>

      <details class="m05-section-collapsible mf-section" ${quizOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge">2</span><div><p class="m05-kicker mf-kicker">Knowledge Check</p><h2 id="m05-knowledge-check">Test your understanding of endpoint investigation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">${moduleFiveQuizPanel()}</div>
      </details>

      <details class="m05-section-collapsible mf-section mf-lab-section" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge">3</span><div><p class="m05-kicker mf-kicker">Practice It · Guided Lab</p><h2 id="m05-guided-lab">Malware analysis practice</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">
          <div id="m05-guided-lab-dynamic">${moduleFiveGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m05-section-collapsible mf-section" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge">4</span><div><p class="m05-kicker mf-kicker">Prove It · Assessment Labs</p><h2 id="m05-assessment-lab">Endpoint alert investigation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">
          <div id="m05-assessment-lab-dynamic">${moduleFiveAssessmentLabPanel()}</div>
        </div>
      </details>
      <div id="m05-optional-labs-dynamic">${moduleFiveAdditionalLabs()}</div>

      <details class="m05-section-collapsible mf-section" ${reviewOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge">5</span><div><p class="m05-kicker mf-kicker">Module Review</p><h2 id="m05-review">Key concepts and takeaways</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">${moduleFiveReview()}</div>
      </details>

      <details class="m05-section-collapsible mf-section mf-section-supplemental" ${moduleFiveReviewMode ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading mf-section-heading"><span class="m05-section-badge mf-section-badge"><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m05-kicker mf-kicker">Sources & Further Reading</p><h2 id="m05-sources">Authoritative references on endpoint investigation</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary>
        <div class="m05-section-body mf-section-body">${moduleSourcesBlock(MODULE_FIVE_SOURCES)}</div>
      </details>
    </main>
    </div>
  </div>`;
}

function wireModuleFiveQuiz() {
  const form = document.getElementById('m05-quiz-form');
  if (!form || !moduleFiveQuizState) return;

  form.addEventListener('change', (event) => {
    if (!event.target.hasAttribute('data-m05-quiz-answer')) return;
    const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
    if (questionId) {
      moduleFiveQuizState.answers[questionId] = event.target.value;
      const form = document.getElementById('m05-quiz-form');
      if (form) form.innerHTML = moduleFiveQuizPanel();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = moduleFiveQuizState.answers;
    const feedback = [];
    let correctCount = 0;

    moduleFiveQuizState.selectedQuestions.forEach((selected) => {
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

    moduleFiveQuizState.score = Math.round((correctCount / moduleFiveQuizState.selectedQuestions.length) * 100);
    moduleFiveQuizState.attempts += 1;
    moduleFiveQuizState.bestScore = Math.max(moduleFiveQuizState.bestScore || 0, moduleFiveQuizState.score);
    moduleFiveQuizState.feedback = feedback;
    moduleFiveQuizState.scored = true;
    const passed = moduleFiveQuizState.score >= 70;
    moduleFiveQuizState.passed = passed;

    if (!passed) {
      moduleFiveState.lastQuizQuestionIds = moduleFiveQuizState.selectedQuestions.map((s) => s.question.id);
    }

    moduleFiveSave();
    const quizPanel = document.getElementById('m05-quiz-form');
    if (quizPanel) quizPanel.innerHTML = moduleFiveQuizPanel();
  });

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-m05-quiz-retake]')) {
      event.preventDefault();
      moduleFiveQuizForceRetake = true;
      form.innerHTML = moduleFiveQuizPanel();
      return;
    }
    if (!event.target.closest('[data-m05-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleFiveQuizState.selectedQuestions.map((s) => s.question.id);
    moduleFiveQuizState = resetQuizAttempt(moduleFiveQuizState, MODULE_FIVE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    form.innerHTML = moduleFiveQuizPanel();
  });
}

function wireModuleFiveLessons() {
  const root = document.getElementById('m05-lesson-loops');
  if (!root) return;
  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m05-lesson-answer]');
    if (!input) return;
    const work = moduleFiveState.lessonWork[input.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.answers[input.dataset.questionIndex] = Number(input.value);
    moduleFiveSave();
  });
  root.addEventListener('input', (event) => {
    const field = event.target.closest('[data-m05-lesson-task]');
    if (!field) return;
    const work = moduleFiveState.lessonWork[field.dataset.m05LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.task = field.value;
    moduleFiveSave();
  });
  root.addEventListener('click', (event) => {
    const lessonCheck = event.target.closest('[data-m05-lesson-check]');
    if (lessonCheck) {
      const lesson = MODULE_FIVE_LESSON_LOOPS.find((item) => item.id === lessonCheck.dataset.m05LessonCheck);
      const work = moduleFiveState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      const missing = lesson.questions.some((question, index) => work.answers?.[index] === undefined);
      if (missing) { work.checked = false; work.feedback = [`Answer all ${lesson.questions.length} questions before checking this lesson.`]; }
      else {
        const correct = lesson.questions.filter((question, index) => work.answers[index] === question.options.findIndex((option) => option.correct)).length;
        work.checked = correct === lesson.questions.length;
        work.feedback = lesson.questions.map((question, index) => work.answers[index] === question.options.findIndex((option) => option.correct) ? `Q${index + 1}: Correct — connect the observed behavior to context and scope.` : `Q${index + 1}: Revisit the evidence, parent-child relationship, and response boundary.`);
        if (!work.checked) work.feedback.push(`${correct}/${lesson.questions.length} correct. Retry after reviewing the theory.`);
      }
      moduleFiveSave();
      const details = lessonCheck.closest('details');
      if (details) details.outerHTML = moduleFiveLessonLoop(lesson, MODULE_FIVE_LESSON_LOOPS.indexOf(lesson));
      return;
    }
    const taskButton = event.target.closest('[data-m05-lesson-task-submit]');
    if (!taskButton) return;
    const lesson = MODULE_FIVE_LESSON_LOOPS.find((item) => item.id === taskButton.dataset.m05LessonTask);
    const work = moduleFiveState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
    work.taskComplete = work.checked && (work.task || '').trim().length >= 20;
    work.feedback = work.taskComplete ? ['Applied task saved.'] : ['Complete the knowledge check and write at least 20 characters before saving the task.'];
    moduleFiveSave();
    const details = taskButton.closest('details');
    if (details) details.outerHTML = moduleFiveLessonLoop(lesson, MODULE_FIVE_LESSON_LOOPS.indexOf(lesson));
  });
}

function wireModuleFiveGuidedLab() {
  const root = document.getElementById('m05-guided-lab-dynamic');
  if (!root || !moduleFiveGuidedState) return;
  const host = root.querySelector('#m03e-console-m05-guided');
  if (host) { MODULE_FIVE_GUIDED_CONSOLE.wire(host); m03eAttachEditor('m05-guided'); }
  if (!root.dataset.m05GuidedObserver) {
    root.dataset.m05GuidedObserver = 'true';
    SocConsoleTools.watchGuide(root, { selector: '.m05-console-guide', render: moduleFiveGuidedGuide, update: () => {
      const complete = moduleFiveGuidedChecks().every((check) => check[2]);
      SocConsoleTools.setText(root.querySelector('.m05-guided-status'), complete ? 'Guided Lab complete: all investigation checks are recorded.' : 'Complete the investigation in the console; progress is saved automatically.');
    } });
  }
  root.addEventListener('input', (event) => {
    if (event.target.matches('#guided-m05-guided-case [name="notes"]')) moduleFiveGuidedState.caseRecord.notes = event.target.value;
  });
  root.addEventListener('change', (event) => {
    const field = event.target.closest('#guided-m05-guided-case [name]');
    if (!field) return;
    if (field.name.startsWith('finding:')) moduleFiveGuidedState.caseRecord.findings[field.name.slice(8)] = field.value;
    else moduleFiveGuidedState.caseRecord[field.name] = field.value;
    moduleFiveGuidedSave();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m05-guided-submit-case]')) { event.preventDefault(); return; }
    if (event.target.closest('[data-m05-guided-save-case]')) {
      event.preventDefault();
      moduleFiveGuidedState.caseRecord.actionHistory.push({ action: 'Ticket updated', at: new Date().toISOString() });
      moduleFiveGuidedSave();
      m03eRender('m05-guided');
      return;
    }
    if (event.target.closest('.m05-console-guide > summary')) {
      requestAnimationFrame(() => { moduleFiveGuidedState.guideOpen = Boolean(root.querySelector('.m05-console-guide')?.open); moduleFiveGuidedSave(); });
    }
  });
}

function moduleFiveRenderGuided() {
  const root = document.getElementById('m05-guided-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFiveGuidedLabPanel();
  const host = root.querySelector('#m03e-console-m05-guided');
  if (host) { MODULE_FIVE_GUIDED_CONSOLE.wire(host); m03eAttachEditor('m05-guided'); }
}

function wireModuleFiveAssessmentLabGating() {}

function wireModuleFiveAssessmentLab() {
  const root = document.getElementById('m05-assessment-lab-dynamic');
  if (!root || !moduleFiveState) return;
  MODULE_FIVE_CONSOLE.wire(root);

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m05-assessment') && caseRecordApply(moduleFiveState.caseRecord, input.name, input.value)) {
      moduleFiveState.caseRecord.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleFiveSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'notes' && event.target.closest('#m05-assessment')) {
      caseRecordApply(moduleFiveState.caseRecord, 'notes', event.target.value);
      moduleFiveSave();
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m05-save-case]')) {
      moduleFiveState.caseRecord.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleFiveSave();
      moduleFiveRenderAssessment();
      return;
    }

    if (event.target.closest('[data-m05-submit-case]')) {
      if (moduleFiveState.caseRecord.submitted) return;
      const spec = moduleFiveCaseSpec();
      const missing = caseRecordMissing(moduleFiveState.caseRecord, spec);
      if (missing.length) {
        moduleFiveProveItShowMissing = true;
        moduleFiveSave();
        moduleFiveRenderAssessment();
        return;
      }
      moduleFiveProveItShowMissing = false;
      const assessmentState = SocM05AssessmentState.load(moduleFiveUser, SocM05AssessmentData);
      const scored = SocM05AssessmentScorer.score(assessmentState, SocM05AssessmentData);
      const submittedAt = new Date().toISOString();
      const attemptNumber = Math.max(Number(moduleFiveState.attempts) || 0, moduleFiveState.assessmentAttempts.length) + 1;
      const revision = (Number(moduleFiveState.caseRecord.revision) || 0) + 1;
      const truth = SocM05AssessmentData.scenario.expectedTruth;
      const reviewPayload = {
        score: scored.score,
        rawScore: scored.rawScore,
        maxScore: scored.maxScore,
        passed: scored.passed,
        criticalMisses: scored.criticalMisses,
        criteria: scored.criteria,
        rubricVersion: scored.rubricVersion,
        scenarioId: SocM05AssessmentData.scenario.id,
        caseId: SocM05AssessmentData.scenario.caseId,
        entityIdentity: {
          affectedUser: truth.confirmedUser.value,
          affectedDevice: truth.confirmedDevice.value,
          hostname: SocM05AssessmentData.scenario.devices.find((device) => device.id === truth.confirmedDevice.value)?.hostname || '',
        },
        revision,
        attemptNumber,
        submittedAt,
      };
      moduleFiveState.caseRecord.caseId = MODULE_FIVE_CASE_ID;
      moduleFiveState.caseRecord.scenarioId = SocM05AssessmentData.scenario.id;
      moduleFiveState.caseRecord.revision = revision;
      moduleFiveState.caseRecord.attemptNumber = attemptNumber;
      moduleFiveState.caseRecord.reviewPayload = reviewPayload;
      moduleFiveState.caseRecord.submitted = true;
      moduleFiveState.caseRecord.submittedAt = submittedAt;
      moduleFiveState.caseRecord.actionHistory.push({ action: 'Submitted case for faculty review', at: submittedAt });
      moduleFiveState.attempts = (moduleFiveState.attempts || 0) + 1;
      moduleFiveState.assessmentAttempts.push(JSON.parse(JSON.stringify({ ...reviewPayload, caseRecord: moduleFiveState.caseRecord })));
      moduleFiveState.lastSubmittedAt = submittedAt;
      moduleFiveState.score = scored.score;
      moduleFiveState.bestScore = Math.max(moduleFiveState.bestScore || 0, scored.score);
      // No pass/fail gate existed pre-migration — a submitted case was
      // always complete, instructor-reviewed. Unchanged here.
      moduleFiveState.completed = true;
      if (!moduleFiveState.flags.includes(MODULE_FIVE_FLAG)) moduleFiveState.flags.push(MODULE_FIVE_FLAG);
      moduleFiveSave();
      if (moduleFiveUser) {
        moduleFiveUser.latestLabAttemptByKey = { ...(moduleFiveUser.latestLabAttemptByKey || {}), [MODULE_FIVE_CATALOG_LAB_KEY]: { completedAt: submittedAt, reviewedAt: null, redoRequested: false } };
      }
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleFiveUser, MODULE_FIVE_CATALOG_LAB_KEY, {
          state: 'complete',
          score: scored.score,
          result: {
            case_record: JSON.parse(JSON.stringify(moduleFiveState.caseRecord)),
            review_payload: reviewPayload,
            case_display: caseRecordDisplay(moduleFiveState.caseRecord, spec),
            case_summary: caseRecordSummary(moduleFiveState.caseRecord, spec),
            notes: moduleFiveState.caseRecord.notes,
          },
        }).then((saved) => { if (saved && moduleFiveProveItRedoRequested()) delete moduleFiveUser.openLabRedosByModuleKey['soc-05']; });
      }
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFiveUser, 'soc-analyst', 'soc-05', MODULE_FIVE_CATALOG_LAB_KEY);
      const status = document.getElementById('m05-status');
      if (status) status.textContent = 'Complete';
      moduleFiveRenderAssessment();
    }
  });
}

function wireModuleFive() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m05-section-collapsible', getReviewMode: () => moduleFiveReviewMode, setReviewMode: (value) => { moduleFiveReviewMode = value; }, enabledLabel: 'Close review', disabledLabel: 'Review module', enabledIcon: 'ri-close-line', disabledIcon: 'ri-file-list-line' });
  wireModuleFiveQuiz();
  wireModuleFiveLessons();
  wireModuleFiveGuidedLab();
  wireModuleFiveAssessmentLab();
  wireModuleFiveOptionalLabs();
}

function wireModuleFiveOptionalLabs() {
  const root = document.getElementById('m05-optional-labs-dynamic');
  if (!root || !moduleFiveState) return;
  wireMissionNextLabGating(root, moduleFiveState.labProgress, () => {
    moduleFiveSave();
    root.innerHTML = moduleFiveAdditionalLabs();
    wireModuleFiveOptionalLabs();
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 5, moduleKey: 'soc-05',
  view: viewModuleFive, wire: wireModuleFive });

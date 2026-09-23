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
};

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

function moduleFiveLoad(user) {
  moduleFiveUser = user;
  moduleFiveState = LabRuntime.load(MODULE_FIVE_LAB_ID, user, MODULE_FIVE_DEFAULT_STATE);
  if (!Array.isArray(moduleFiveState.feedback)) moduleFiveState.feedback = [];
  if (!Array.isArray(moduleFiveState.flags)) moduleFiveState.flags = [];
  if (!moduleFiveState.lessonWork || typeof moduleFiveState.lessonWork !== 'object') moduleFiveState.lessonWork = {};
  if (typeof moduleFiveState.notes !== 'string') moduleFiveState.notes = '';
  if (typeof moduleFiveState.practiceNotes !== 'string') moduleFiveState.practiceNotes = '';

  // Initialize quiz state
  if (!moduleFiveQuizState) {
    const previousQuestionIds = moduleFiveState.lastQuizQuestionIds || [];
    moduleFiveQuizState = createQuizAttempt(MODULE_FIVE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-05');
  return moduleFiveState;
}

function moduleFiveSave() {
  if (moduleFiveUser && moduleFiveState) LabRuntime.save(MODULE_FIVE_LAB_ID, moduleFiveUser, moduleFiveState);
}

function moduleFiveGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm05-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleFiveQuizState?.passed, scrollId: 'm05-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: moduleFiveState.practiceComplete, scrollId: 'm05-guided-lab' },
    { id: 'assessment-lab', title: 'Assessment Lab', type: 'review', isComplete: moduleFiveState.completed, scrollId: 'm05-assessment-lab' },
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
    isComplete: moduleFiveState.practiceComplete === true,
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

function moduleFiveQuizPanel() {
  if (!moduleFiveQuizState?.selectedQuestions || moduleFiveQuizState.selectedQuestions.length === 0) {
    return `<div class="m05-quiz-empty" id="m05-quiz-feedback" role="status">Loading quiz...</div>`;
  }

  const selected = moduleFiveQuizState.selectedQuestions;
  const answered = Object.keys(moduleFiveQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleFiveQuizState.scored) {
    const passed = moduleFiveQuizState.score >= 70;
    feedbackHtml = `<section class="m05-quiz-score ${passed ? 'm05-quiz-pass' : 'm05-quiz-remediate'}" id="m05-quiz-feedback" tabindex="-1" aria-live="polite">
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

  return `<form class="m05-quiz-form" id="m05-quiz-form" novalidate>
    <div class="m05-panel-heading"><div><p class="m05-kicker">Knowledge check</p><h3 id="m05-quiz-title" tabindex="-1">Test your understanding of endpoint investigation</h3></div><span>${answered}/${total} answered</span></div>
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
  return `<details class="m05-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m05-script-body">
      <p><strong>Introduction:</strong> Welcome to endpoint investigation. An EDR system records process starts, file creation, registry changes, and prevention actions—the observable facts of what a workstation did. Your job is not to prevent malware (that is the sensor's job) but to understand the chain of events that led to the alert and make a proportionate containment decision.</p>

      <p><strong>Segment 1 — Reading telemetry without jumping to conclusions.</strong> Every indicator recorded by an EDR—a new file, a process start, a registry change—needs context. A file created by a trusted process is different from the same file created by an untrusted process, even if the bytes are identical. Reputation helps (is the file signed, has it been seen before?), but behavior is the final word: what did the file actually do after creation?</p>

      <p><strong>Segment 2 — Following parent-child process relationships.</strong> A process tree connects each program to what launched it. Office launching PowerShell is suspicious; a user launching cmd.exe is expected. The parent-child relationship tells you whether the launch was invoked by a human (interactive) or by code (automated/scripted). Trace the chain from the root cause: what started the first process, and what did it spawn?</p>

      <p><strong>Segment 3 — Inspecting command context.</strong> Process names look normal but command-line arguments often reveal intent. A shell launched with hidden/encoded arguments is different from a shell launched interactively. Record the executable path, options, user context, and timing. Encoded commands are not proof on their own—many legitimate tools use encoding—but they are a signal worth inspecting in combination with the parent-child chain.</p>

      <p><strong>Segment 4 — Building an endpoint timeline.</strong> Events spread across a workstation's telemetry are separate facts until you arrange them by time. A timeline shows what happened before, during, and after execution. File creation before process start suggests the file was prepared. Persistence entry after execution suggests intent to stay. The order of events is often as important as the events themselves.</p>

      <p><strong>Segment 5 — Evaluating a file using multiple signals.</strong> File verdict requires combining: signature status (trusted, unsigned, revoked), prevalence (how many endpoints have it—one is suspicious, millions is normal), reputation (has it been flagged as malicious), and behavior (what did it actually do). No single field is definitive. An unsigned binary from an unknown publisher is suspicious; the same binary with low prevalence is more suspicious; the same binary that matches a loader signature is malicious.</p>

      <p><strong>Segment 6 — Recognizing persistence mechanisms.</strong> Malware often creates entries in autostart locations—Run keys, scheduled tasks, services, startup folders—so it survives logout/login cycles. These are not hidden; they are recorded in the system state. Prevention can stop the initial file, but a persistence entry remains and must be cleaned. Do not close an incident if the file is quarantined but the persistence entry still exists.</p>

      <p><strong>Closing:</strong> Endpoint investigation combines observation (what happened), interpretation (why it happened), and recommendation (what to do). Separate each layer so responders can follow your logic. You are not responsible for reversing malware or developing exploits—those are specialist roles. You are responsible for reading the chain of events, estimating scope, and handing off to responders with confidence in what you found and why it matters.</p>
    </div>
  </details>`;
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
  return `<details class="m05-lesson-loop" ${work.taskComplete ? '' : (index === 0 ? 'open' : '')}>
    <summary><span class="m05-lesson-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${esc(lesson.title)}</strong><small>${work.taskComplete ? 'Complete — reopen to review' : 'Scenario → theory → check → applied task'}</small></span>${work.taskComplete ? '<i class="ri-checkbox-circle-fill m05-lesson-done" aria-label="Lesson complete"></i>' : '<i class="ri-arrow-down-s-line m05-chevron" aria-hidden="true"></i>'}</summary>
    <div class="m05-lesson-loop-body"><section><p class="m05-kicker">Scenario</p><p>${esc(lesson.scenario)}</p></section><section><p class="m05-kicker">Theory</p><p>${esc(lesson.theory)}</p></section><section><p class="m05-kicker">Knowledge check</p>${lesson.questions.map((question, qIndex) => `<fieldset class="m05-lesson-question"><legend>${qIndex + 1}. ${esc(question.prompt)}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="m05-loop-${esc(lesson.id)}-${qIndex}" value="${optionIndex}" data-m05-lesson-answer data-lesson-id="${esc(lesson.id)}" data-question-index="${qIndex}" ${Number(work.answers?.[qIndex]) === optionIndex ? 'checked' : ''}><span>${esc(option.text)}</span></label>`).join('')}</fieldset>`).join('')}<button type="button" class="m05-lesson-check" data-m05-lesson-check="${esc(lesson.id)}">Check this lesson</button>${feedback}</section><section><p class="m05-kicker">Applied task</p><p>${esc(lesson.task)}</p><textarea rows="3" maxlength="500" data-m05-lesson-task="${esc(lesson.id)}" placeholder="Write a short analyst response…">${esc(work.task || '')}</textarea><button type="button" class="m05-lesson-task-button" data-m05-lesson-task-submit="${esc(lesson.id)}">${work.taskComplete ? 'Task saved' : 'Save applied task'}</button></section></div>
  </details>`;
}

function moduleFiveLessonGrid() {
  return `<section class="m05-lesson-loops" id="m05-lesson-loops" aria-labelledby="m05-lesson-loops-title"><div class="m05-panel-heading"><div><p class="m05-kicker">Four-part lesson loops</p><h3 id="m05-lesson-loops-title">Practice the fake-CAPTCHA execution chain</h3></div><span>10 lessons · embedded in existing theory minutes</span></div><div class="m05-lesson-grid">${MODULE_FIVE_LESSON_LOOPS.map(moduleFiveLessonLoop).join('')}</div></section>`;
}

const MODULE_FIVE_RETURN_TO = encodeURIComponent(window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + '#/program/soc-analyst/module/5');

function moduleFiveGuidedLabPanel() {
  const links = [
    { label: 'Static Analysis of a Simple Malware Sample', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_FIVE_RETURN_TO}#/track/malware-analysis/project/ma-1/lab` },
    { label: 'Dynamic Analysis in a Controlled Environment', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_FIVE_RETURN_TO}#/track/malware-analysis/project/ma-2/lab` },
  ];
  return `<section class="m05-external-lab" id="m05-guided-lab-panel">
    <p class="m05-panel-instruction">Work through both imported malware-analysis projects below; each opens on this page with its own guided tasks. When you're done, note what you found and mark the Guided Lab complete.</p>
    <div class="m05-external-lab-links">${links.map((l) => `<a class="m05-lab-launch" href="${esc(l.href)}" rel="noopener"><i class="ri-external-link-line" aria-hidden="true"></i> Launch: ${esc(l.label)}</a>`).join('')}</div>
    <label class="m05-note-label">Working notes (optional)<textarea rows="4" maxlength="900" data-m05-practice-notes placeholder="What did you find? Any blockers?">${esc(moduleFiveState.practiceNotes)}</textarea></label>
    <div class="m05-actions"><button type="button" class="m05-submit" data-m05-practice-complete>${moduleFiveState.practiceComplete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div>
  </section>`;
}

function moduleFiveAdditionalLabs() {
  return missionNextAdditionalLabsSection(5, [
    { label: 'Behavioral Analysis of a Keylogger', detail: 'Persistence and endpoint behavior', href: `imported-labs/mission-next-labs/index.html?returnTo=${MODULE_FIVE_RETURN_TO}#/track/malware-analysis/project/ma-4/lab` },
  ]);
}

function moduleFiveAssessmentLabPanel() {
  const feedbackHtml = moduleFiveState.feedback?.length ? `<div class="m05-independent-feedback is-pass" role="status"><strong>Submitted</strong><ul>${moduleFiveState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m05-external-lab" id="m05-assessment-lab-panel">
    <p class="m05-panel-instruction">Complete the imported Sysmon log-analysis project, then write up your findings below for instructor review.</p>
    <div class="m05-external-lab-links"><a class="m05-lab-launch" href="imported-labs/mission-next-labs/index.html?returnTo=${MODULE_FIVE_RETURN_TO}#/track/log-analysis/project/lap-5/lab" rel="noopener"><i class="ri-external-link-line" aria-hidden="true"></i> Launch: Analyzing Windows Sysmon Events for Security Incidents</a></div>
    <form id="m05-assessment-form">
      <label class="m05-note-label">Assessment write-up<textarea id="m05-assessment-notes" rows="6" maxlength="900" data-m05-assessment-notes placeholder="Summarize what the Sysmon lab surfaced, your analysis, and your recommended action…">${esc(moduleFiveState.notes)}</textarea></label>
      <p class="m05-help">In at least 80 characters, describe what you found and your recommended action.</p>
      <div class="m05-actions"><button type="submit" class="m05-submit">${moduleFiveState.completed ? 'Resubmit for review' : 'Submit for review'}</button></div>
    </form>
    ${feedbackHtml}
  </section>`;
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
    ${moduleProgressShell(sections, { reviewMode: moduleFiveReviewMode })}
    <div class="mquick-nav-layout">
      <main class="m05-main">
      <section class="m05-hero" aria-labelledby="m05-title"><div><p class="m05-kicker">Module 05 · ${formatHandsOnDuration(module.durationMinutes)} · assisted investigation</p><h1 id="m05-title">${esc(module.title)}</h1><p>Read process relationships, reconstruct endpoint activity, evaluate a suspicious file, and create a proportionate response handoff without leaving this one-workstation lab. This is analyst investigation and triage: learners do not reverse-engineer or develop malware, and specialist analysis is escalated.</p></div><dl><div><dt>Guided Lab</dt><dd>${moduleFiveState.practiceComplete ? 'Complete' : 'Not started'}</dd></div><div><dt>Assessment Lab</dt><dd id="m05-status">${complete ? 'Complete' : moduleFiveState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m05-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">1</span><div><p class="m05-kicker">Lecture</p><h2 id="m05-lecture">Endpoint investigation foundations</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveLecture()}${moduleFiveVideoScript()}${moduleFiveLessonGrid()}</div>
      </details>

      <details class="m05-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">2</span><div><p class="m05-kicker">Knowledge Check</p><h2 id="m05-knowledge-check">Test your understanding of endpoint investigation</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveQuizPanel()}</div>
      </details>

      <details class="m05-section-collapsible" ${guidedLabOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">3</span><div><p class="m05-kicker">Practice It · Guided Lab</p><h2 id="m05-guided-lab">Malware analysis practice</h2></div></div></summary>
        <div class="m05-section-body">
          <div class="m05-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> These labs open in the imported training application on this page.</p></div>
          <div id="m05-guided-lab-dynamic">${moduleFiveGuidedLabPanel()}</div>
        </div>
      </details>

      <details class="m05-section-collapsible" ${assessmentLabOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">4</span><div><p class="m05-kicker">Prove It · Assessment Lab</p><h2 id="m05-assessment-lab">Independent Sysmon event analysis</h2></div></div></summary>
        <div class="m05-section-body">
          <div id="m05-assessment-lab-dynamic">${moduleFiveAssessmentLabPanel()}</div>
        </div>
      </details>
      ${moduleFiveAdditionalLabs()}

      <details class="m05-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">5</span><div><p class="m05-kicker">Module Review</p><h2 id="m05-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveReview()}</div>
      </details>

      <details class="m05-section-collapsible" ${moduleFiveReviewMode ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">6</span><div><p class="m05-kicker">Sources & Further Reading</p><h2 id="m05-sources">Authoritative references on endpoint investigation</h2></div></div></summary>
        <div class="m05-section-body">${moduleSourcesBlock(MODULE_FIVE_SOURCES)}</div>
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
  if (!root || !moduleFiveState) return;
  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-m05-practice-notes]')) {
      moduleFiveState.practiceNotes = event.target.value;
      moduleFiveSave();
    }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m05-practice-complete]')) {
      moduleFiveState.practiceComplete = true;
      moduleFiveSave();
      root.innerHTML = moduleFiveGuidedLabPanel();
    }
  });
}

function wireModuleFiveAssessmentLab() {
  const root = document.getElementById('m05-assessment-lab-dynamic');
  if (!root || !moduleFiveState) return;
  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm05-assessment-form') return;
    event.preventDefault();
    const notes = event.target.querySelector('#m05-assessment-notes')?.value || '';
    moduleFiveState.notes = notes;
    if (notes.trim().length < 80) {
      moduleFiveState.feedback = ['Write at least 80 characters describing your findings and recommended action before submitting.'];
      moduleFiveSave();
      root.innerHTML = moduleFiveAssessmentLabPanel();
      return;
    }
    moduleFiveState.attempts = (moduleFiveState.attempts || 0) + 1;
    moduleFiveState.lastSubmittedAt = new Date().toISOString();
    moduleFiveState.completed = true;
    moduleFiveState.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];
    if (!moduleFiveState.flags.includes(MODULE_FIVE_FLAG)) moduleFiveState.flags.push(MODULE_FIVE_FLAG);
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleFiveUser, MODULE_FIVE_CATALOG_LAB_KEY, { state: 'complete', result: { notes } });
    }
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFiveUser, 'soc-analyst', 'soc-05', MODULE_FIVE_CATALOG_LAB_KEY);
    moduleFiveSave();
    const status = document.getElementById('m05-status');
    if (status) status.textContent = 'Complete';
    root.innerHTML = moduleFiveAssessmentLabPanel();
  });
}

function wireModuleFive() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  wireReviewToggle({ button: reviewToggle, sectionSelector: '.m05-section-collapsible', getReviewMode: () => moduleFiveReviewMode, setReviewMode: (value) => { moduleFiveReviewMode = value; }, enabledLabel: 'Close review', disabledLabel: 'Review module', enabledIcon: 'ri-close-line', disabledIcon: 'ri-file-list-line' });
  wireModuleFiveQuiz();
  wireModuleFiveLessons();
  wireModuleFiveGuidedLab();
  wireModuleFiveAssessmentLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 5, moduleKey: 'soc-05',
  view: viewModuleFive, wire: wireModuleFive });

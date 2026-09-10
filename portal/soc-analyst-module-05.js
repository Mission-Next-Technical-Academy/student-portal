/* Module 05 — assisted endpoint and malware investigation.
 * All hosts, processes, files, and actions are fictional browser-local fixtures.
 */

const MODULE_FIVE_LAB_ID = 'm05-endpoint-chain-v1';
const MODULE_FIVE_FLAG = 'M05-ENDPOINT-CHAIN-VALIDATED';
const MODULE_FIVE_CATALOG_LAB_KEY = 'lab-endpoint-investigation';
const MODULE_FIVE_PASSING_SCORE = 70;

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
  activeSource: 'processes',
  reviewedSources: [],
  selectedEvidence: [],
  selectedProcess: 'p-word',
  selectedEvent: 'e-document',
  chain: '',
  fileVerdict: '',
  scope: '',
  action: '',
  notes: '',
  hintOpen: false,
  hintsOpened: 0,
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  lessonWork: {},
  independentLab: { answers: {}, notes: '', attempts: 0, score: 0, completed: false, feedback: [] },
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

const MODULE_FIVE_INDEPENDENT_LAB = {
  title: 'Independent lab: CAPTCHA-to-persistence review', caseId: 'INC-5505',
  scenario: 'A fictional Mission Next Labs user reports a “verify you are human” page. On a separate training endpoint, the supplied timeline shows a Run dialog paste, PowerShell, a signed Windows utility used as a LOLBin, and a new startup value. A routine software updater is a nearby distractor. Decide what the evidence proves and what should be handed off.',
  questions: [
    { id: 'chain', label: 'Which chain best explains the supplied evidence?', options: [
      { id: 'captcha', text: 'Fake CAPTCHA prompt → user execution → PowerShell → signed LOLBin → startup value' },
      { id: 'updater', text: 'Routine updater → catalog refresh → no security-relevant activity' },
      { id: 'sensor', text: 'Endpoint sensor → persistence → user action' },
    ], correct: 'captcha' },
    { id: 'scope', label: 'What scope is supportable now?', options: [
      { id: 'bounded', text: 'The supplied training endpoint is affected; broader exposure is not established by this record' },
      { id: 'all', text: 'Every Mission Next Labs endpoint is compromised' },
      { id: 'none', text: 'No scope can be recorded until a specialist reverses the payload' },
    ], correct: 'bounded' },
    { id: 'next', label: 'What is the BEST first handoff action?', options: [
      { id: 'preserve', text: 'Preserve the process and persistence evidence, isolate the confirmed endpoint through approved response, and escalate for scope review' },
      { id: 'wipe', text: 'Wipe every endpoint that displayed a CAPTCHA' },
      { id: 'close', text: 'Close because the utility is signed' },
    ], correct: 'preserve' },
  ],
};

const MODULE_FIVE_PROCESSES = [
  { id: 'p-explorer', depth: 0, time: '09:13:58', name: 'explorer.exe', pid: '4120', parent: 'userinit.exe', path: 'C:\\Windows\\explorer.exe', command: 'explorer.exe', signer: 'Trusted operating-system component', relation: 'Interactive user shell', risk: 'expected', observation: 'Expected desktop process for the local session.' },
  { id: 'p-word', depth: 1, time: '09:14:21', name: 'WINWORD.EXE', pid: '6284', parent: 'explorer.exe', path: 'C:\\Program Files\\OfficeSuite\\WINWORD.EXE', command: 'WINWORD.EXE C:\\Users\\employee-27\\Downloads\\invoice_review.docm', signer: 'Trusted productivity-suite publisher', relation: 'Opened invoice_review.docm', risk: 'review', observation: 'A downloaded macro-enabled document was opened from the user profile.' },
  { id: 'p-powershell', depth: 2, time: '09:14:37', name: 'powershell.exe', pid: '6420', parent: 'WINWORD.EXE', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', command: 'powershell.exe -WindowStyle Hidden -EncodedCommand [synthetic payload removed]', signer: 'Trusted operating-system component', relation: 'Office application launched a hidden shell', risk: 'suspicious', observation: 'The trusted binary is used in an unusual Office-to-shell relationship with hidden, encoded arguments.', evidenceId: 'ev-office-shell' },
  { id: 'p-loader', depth: 3, time: '09:14:44', name: 'update-check.exe', pid: '6508', parent: 'powershell.exe', path: 'C:\\ProgramData\\Cache\\update-check.exe', command: 'update-check.exe --silent', signer: 'No trusted signature', relation: 'Newly written executable launched', risk: 'suspicious', observation: 'The shell started a low-prevalence unsigned file from a writable shared folder.', evidenceId: 'ev-loader-run' },
  { id: 'p-onedrive', depth: 1, time: '09:15:02', name: 'OneDriveSync.exe', pid: '5116', parent: 'explorer.exe', path: 'C:\\Program Files\\SyncClient\\OneDriveSync.exe', command: 'OneDriveSync.exe /background', signer: 'Trusted sync-client publisher', relation: 'Normal background synchronization', risk: 'expected', observation: 'Expected signed software started by the interactive shell; no suspicious child process is present.', evidenceId: 'ev-benign-sync' },
];

const MODULE_FIVE_EVENTS = [
  { id: 'e-document', time: '09:14:19', category: 'File opened', object: 'invoice_review.docm', actor: 'explorer.exe', detail: 'The user opened a downloaded macro-enabled document.', relevance: 'Context for the start of the chain.' },
  { id: 'e-file', time: '09:14:42', category: 'File created', object: 'C:\\ProgramData\\Cache\\update-check.exe', actor: 'powershell.exe', detail: 'PowerShell wrote an executable into a shared writable directory.', relevance: 'Connects the hidden shell to the later executable.', evidenceId: 'ev-file-drop', file: { hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1005', signature: 'No trusted signature', prevalence: '1 endpoint in this synthetic dataset', reputation: 'Matches a simulated loader in the local reputation fixture' } },
  { id: 'e-registry', time: '09:14:47', category: 'Registry value set', object: 'HKCU\\Software\\...\\Run\\UpdateCheck', actor: 'update-check.exe', detail: 'The value points to C:\\ProgramData\\Cache\\update-check.exe --silent.', relevance: 'Shows that the new executable attempted to start again at sign-in.', evidenceId: 'ev-persistence' },
  { id: 'e-sensor', time: '09:14:55', category: 'Sensor action', object: 'update-check.exe', actor: 'Endpoint sensor', detail: 'The running file was stopped and its observed copy was quarantined.', relevance: 'Prevention succeeded for one copy; the persistence value and endpoint state still require response.' },
  { id: 'e-updater', time: '09:15:10', category: 'File created', object: 'C:\\ProgramData\\VendorCache\\catalog.db', actor: 'OneDriveSync.exe', detail: 'A signed synchronization client refreshed its local catalogue.', relevance: 'Plausible benign activity after the detection.', evidenceId: 'ev-benign-catalog', file: { hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1005', signature: 'Trusted sync-client publisher', prevalence: '38 endpoints in this synthetic dataset', reputation: 'No adverse matches in the local fixture' } },
];

const MODULE_FIVE_EVIDENCE = {
  'ev-office-shell': { label: 'Office application launched hidden PowerShell', source: 'Process tree', decisive: true },
  'ev-loader-run': { label: 'PowerShell launched the new unsigned executable', source: 'Process tree', decisive: true },
  'ev-file-drop': { label: 'Dropped file matched the simulated loader fixture', source: 'Endpoint activity', decisive: true },
  'ev-persistence': { label: 'Executable created a user Run-key value', source: 'Endpoint activity', decisive: true },
  'ev-benign-sync': { label: 'Signed sync client ran in the background', source: 'Process tree', decisive: false },
  'ev-benign-catalog': { label: 'Sync client refreshed its local catalogue', source: 'Endpoint activity', decisive: false },
};

let moduleFiveState = null;
let moduleFiveUser = null;
let moduleFiveReviewMode = false;
let moduleFiveQuizState = null;

function moduleFiveLoad(user) {
  moduleFiveUser = user;
  moduleFiveState = LabRuntime.load(MODULE_FIVE_LAB_ID, user, MODULE_FIVE_DEFAULT_STATE);
  if (!Array.isArray(moduleFiveState.reviewedSources)) moduleFiveState.reviewedSources = [];
  if (!Array.isArray(moduleFiveState.selectedEvidence)) moduleFiveState.selectedEvidence = [];
  if (!Array.isArray(moduleFiveState.flags)) moduleFiveState.flags = [];
  if (!moduleFiveState.lessonWork || typeof moduleFiveState.lessonWork !== 'object') moduleFiveState.lessonWork = {};
  if (!moduleFiveState.independentLab || typeof moduleFiveState.independentLab !== 'object') moduleFiveState.independentLab = JSON.parse(JSON.stringify(MODULE_FIVE_DEFAULT_STATE.independentLab));
  if (!moduleFiveState.independentLab.answers || typeof moduleFiveState.independentLab.answers !== 'object') moduleFiveState.independentLab.answers = {};
  if (!Array.isArray(moduleFiveState.independentLab.feedback)) moduleFiveState.independentLab.feedback = [];

  // Initialize quiz state
  if (!moduleFiveQuizState) {
    const previousQuestionIds = moduleFiveState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_FIVE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleFiveQuizState = {
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
    { id: 'endpoint-lab', title: 'Endpoint Lab', type: 'lab', isComplete: moduleFiveState.completed, scrollId: 'm05-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm05-review' },
  ];
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

function moduleFiveIndependentLab() {
  const state = moduleFiveState.independentLab;
  const answered = MODULE_FIVE_INDEPENDENT_LAB.questions.filter((q) => state.answers?.[q.id]).length;
  const feedback = state.feedback?.length ? `<div class="m05-independent-feedback ${state.completed ? 'is-pass' : 'is-hint'}" role="status"><strong>${state.score}/100 — ${state.completed ? 'Independent lab complete' : 'Review and retry'}</strong><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
  return `<section class="m05-independent-lab" id="m05-independent-lab" aria-labelledby="m05-independent-title"><div class="m05-panel-heading"><div><p class="m05-kicker">Independent · fresh decision path · included in existing lab minutes</p><h3 id="m05-independent-title">${esc(MODULE_FIVE_INDEPENDENT_LAB.title)}</h3></div><span>${answered}/${MODULE_FIVE_INDEPENDENT_LAB.questions.length} answered</span></div><p class="m05-panel-instruction">${esc(MODULE_FIVE_INDEPENDENT_LAB.scenario)}</p><form id="m05-independent-form">${MODULE_FIVE_INDEPENDENT_LAB.questions.map((q) => `<fieldset class="m05-independent-question"><legend>${esc(q.label)}</legend>${q.options.map((o) => `<label><input type="radio" name="m05-independent-${esc(q.id)}" value="${esc(o.id)}" data-m05-independent-answer data-question-id="${esc(q.id)}" ${state.answers?.[q.id] === o.id ? 'checked' : ''}><span>${esc(o.text)}</span></label>`).join('')}</fieldset>`).join('')}<label class="m05-note-label">Analyst note (optional)<textarea rows="3" maxlength="500" data-m05-independent-notes placeholder="Record the bounded scope and handoff boundary…">${esc(state.notes || '')}</textarea></label><button type="submit" class="m05-independent-submit">Score independent lab</button></form>${feedback}</section>`;
}

function moduleFiveEvidenceButton(evidenceId) {
  if (!evidenceId) return '';
  const selected = moduleFiveState.selectedEvidence.includes(evidenceId);
  return `<button type="button" class="m05-evidence-toggle ${selected ? 'is-selected' : ''}" data-m05-evidence="${esc(evidenceId)}" aria-pressed="${selected}">
    <i class="${selected ? 'ri-checkbox-circle-fill' : 'ri-add-circle-line'}" aria-hidden="true"></i>${selected ? 'Added to findings' : 'Add to findings'}
  </button>`;
}

function moduleFiveProcessSource() {
  const selected = MODULE_FIVE_PROCESSES.find((item) => item.id === moduleFiveState.selectedProcess) || MODULE_FIVE_PROCESSES[0];
  return `<div class="m05-source-layout">
    <div class="m05-source-list">
      <div class="m05-source-heading"><div><p class="m05-kicker">Source 1 of 2</p><h3>Process tree</h3></div><span>Parent → child execution</span></div>
      <p class="m05-source-instruction">Select any process to inspect its parent, command context, and signer. Expected processes are included as distractors.</p>
      <div class="m05-tree" role="tree" aria-label="Process tree for workstation WS-LAB-27">
        ${MODULE_FIVE_PROCESSES.map((process) => `<button type="button" role="treeitem" aria-level="${process.depth + 1}" aria-selected="${selected.id === process.id}" class="m05-tree-row ${selected.id === process.id ? 'is-active' : ''}" style="--m05-depth:${process.depth}" data-m05-process="${esc(process.id)}">
          <span class="m05-tree-time">${esc(process.time)}</span><i class="${process.risk === 'suspicious' ? 'ri-error-warning-line' : 'ri-terminal-window-line'}" aria-hidden="true"></i>
          <span><strong>${esc(process.name)}</strong><small>PID ${esc(process.pid)} · ${esc(process.relation)}</small></span><span class="m05-risk m05-risk-${esc(process.risk)}">${process.risk === 'suspicious' ? 'Review' : process.risk === 'review' ? 'Context' : 'Expected'}</span>
        </button>`).join('')}
      </div>
    </div>
    <aside class="m05-detail" aria-labelledby="m05-process-detail-title" tabindex="-1">
      <p class="m05-kicker">Selected process</p><h3 id="m05-process-detail-title" tabindex="-1">${esc(selected.name)}</h3>
      <dl class="m05-detail-grid"><div><dt>Parent</dt><dd>${esc(selected.parent)}</dd></div><div><dt>Signer</dt><dd>${esc(selected.signer)}</dd></div><div><dt>Path</dt><dd><code>${esc(selected.path)}</code></dd></div><div><dt>Command</dt><dd><code>${esc(selected.command)}</code></dd></div></dl>
      <div class="m05-observation"><strong>What this record supports</strong><p>${esc(selected.observation)}</p></div>
      ${moduleFiveEvidenceButton(selected.evidenceId)}
    </aside>
  </div>`;
}

function moduleFiveActivitySource() {
  const selected = MODULE_FIVE_EVENTS.find((item) => item.id === moduleFiveState.selectedEvent) || MODULE_FIVE_EVENTS[0];
  return `<div class="m05-source-layout">
    <div class="m05-source-list">
      <div class="m05-source-heading"><div><p class="m05-kicker">Source 2 of 2</p><h3>Endpoint activity</h3></div><span>Timeline + local file evidence</span></div>
      <p class="m05-source-instruction">Select an event to inspect its actor and, where available, the file reputation fixture. Times are local to this isolated workstation.</p>
      <ol class="m05-event-list">
        ${MODULE_FIVE_EVENTS.map((event) => `<li><button type="button" class="m05-event-row ${selected.id === event.id ? 'is-active' : ''}" data-m05-event="${esc(event.id)}" aria-pressed="${selected.id === event.id}">
          <time>${esc(event.time)}</time><span><strong>${esc(event.category)}</strong><small>${esc(event.object)}</small></span><i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </button></li>`).join('')}
      </ol>
    </div>
    <aside class="m05-detail" aria-labelledby="m05-event-detail-title" tabindex="-1">
      <p class="m05-kicker">Selected activity</p><h3 id="m05-event-detail-title" tabindex="-1">${esc(selected.category)}</h3>
      <dl class="m05-detail-grid"><div><dt>Time</dt><dd>${esc(selected.time)}</dd></div><div><dt>Actor</dt><dd>${esc(selected.actor)}</dd></div><div><dt>Object</dt><dd><code>${esc(selected.object)}</code></dd></div><div><dt>Observed detail</dt><dd>${esc(selected.detail)}</dd></div></dl>
      ${selected.file ? `<section class="m05-file-card" aria-label="Local file reputation"><strong><i class="ri-file-shield-2-line" aria-hidden="true"></i> Local file reputation</strong><dl><div><dt>SHA-256</dt><dd><code>${esc(selected.file.hash)}</code></dd></div><div><dt>Signature</dt><dd>${esc(selected.file.signature)}</dd></div><div><dt>Prevalence</dt><dd>${esc(selected.file.prevalence)}</dd></div><div><dt>Fixture result</dt><dd>${esc(selected.file.reputation)}</dd></div></dl></section>` : ''}
      <div class="m05-observation"><strong>Why it matters</strong><p>${esc(selected.relevance)}</p></div>
      ${moduleFiveEvidenceButton(selected.evidenceId)}
    </aside>
  </div>`;
}

function moduleFiveFindings() {
  const selected = moduleFiveState.selectedEvidence.map((id) => ({ id, ...MODULE_FIVE_EVIDENCE[id] })).filter((item) => item.label);
  return `<section class="m05-findings" aria-labelledby="m05-findings-title">
    <div class="m05-panel-heading"><div><p class="m05-kicker">Evidence board</p><h3 id="m05-findings-title" tabindex="-1">Selected findings</h3></div><span>${selected.length} selected</span></div>
    ${selected.length ? `<ul>${selected.map((item) => `<li><span><strong>${esc(item.label)}</strong><small>${esc(item.source)}</small></span><button type="button" data-m05-remove-evidence="${esc(item.id)}" aria-label="Remove ${esc(item.label)}"><i class="ri-close-line" aria-hidden="true"></i></button></li>`).join('')}</ul>` : '<p class="m05-empty">Select records from either source and add the facts that should support your conclusion.</p>'}
  </section>`;
}

function moduleFiveRadioGroup(name, legend, help, options) {
  return `<fieldset class="m05-fieldset"><legend>${esc(legend)}</legend><p>${esc(help)}</p><div class="m05-options">
    ${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleFiveState[name] === option.id ? 'checked' : ''}/><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}
  </div></fieldset>`;
}

function moduleFiveScorePanel() {
  if (moduleFiveState.validationError) return `<div class="m05-validation" id="m05-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the investigation record</strong><p>${esc(moduleFiveState.validationError)}</p></div></div>`;
  if (!moduleFiveState.attempts || !moduleFiveState.breakdown) return `<div class="m05-score-empty" id="m05-feedback" role="status" aria-live="polite">Your score uses four visible categories: observation 25, analysis 30, decision 25, and communication 20. Hints do not reduce the score.</div>`;
  const b = moduleFiveState.breakdown;
  const passed = moduleFiveState.score >= MODULE_FIVE_PASSING_SCORE;
  return `<section class="m05-score ${passed ? 'is-pass' : 'is-remediate'}" id="m05-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m05-score-title">
    <div class="m05-score-head"><div><p class="m05-kicker">Attempt ${moduleFiveState.attempts} · best ${moduleFiveState.bestScore}/100</p><h3 id="m05-score-title">${moduleFiveState.score}/100 — ${passed ? 'Endpoint conclusion supported' : 'Review the gaps and retry'}</h3></div><span>${moduleFiveState.score}</span></div>
    <div class="m05-score-grid" aria-label="Score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/30</strong><span>Analysis</span></div><div><strong>${b.decision}/25</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div>
    <ul class="m05-feedback-list">${moduleFiveState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m05-model"><strong>Expert reasoning</strong><p>The suspicious chain begins when the macro-enabled document is opened and the Office process launches hidden PowerShell. That shell writes and starts an unsigned, low-prevalence executable whose local fixture match indicates a simulated loader. The executable then creates a Run-key value. Stopping one file does not remove that persistence or establish endpoint integrity, so isolate WS-LAB-27, preserve its evidence, and escalate for endpoint response. This dataset proves one affected endpoint; it does not prove that no other host is affected.</p></div>
  </section>`;
}

function moduleFiveAssessment() {
  return `<form class="m05-assessment" id="m05-assessment" novalidate>
    <div class="m05-panel-heading"><div><p class="m05-kicker">Scored artifact</p><h3>Endpoint investigation record</h3></div><span>Passing score ${MODULE_FIVE_PASSING_SCORE}</span></div>
    ${moduleFiveRadioGroup('chain', '1. Which execution chain best explains the alert?', 'Use the parent-child relationship, not process names alone.', [
      { id: 'document-shell-loader', label: 'invoice_review.docm → WINWORD.EXE → PowerShell → update-check.exe', help: 'The document is context; the process tree supplies the execution relationships.' },
      { id: 'sync-catalog', label: 'explorer.exe → OneDriveSync.exe → catalog.db', help: 'A background sync path seen near the alert.' },
      { id: 'sensor-loader', label: 'Endpoint sensor → update-check.exe → PowerShell', help: 'Treats the prevention record as the start of execution.' },
    ])}
    ${moduleFiveRadioGroup('fileVerdict', '2. How should update-check.exe be classified?', 'Combine signer, prevalence, reputation, and behavior.', [
      { id: 'malicious', label: 'Malicious in this scenario', help: 'The local file and behavioral evidence support a firm verdict.' },
      { id: 'unknown', label: 'Unknown; no evidence supports a conclusion', help: 'Use when the available facts are genuinely inconclusive.' },
      { id: 'benign', label: 'Benign updater', help: 'The filename alone suggests ordinary maintenance.' },
    ])}
    ${moduleFiveRadioGroup('scope', '3. What scope can you defend from this dataset?', 'Separate confirmed scope from assumptions about the wider environment.', [
      { id: 'one-confirmed', label: 'One endpoint is confirmed; wider scope is not established here', help: 'Records the evidence limit without claiming the environment is clean.' },
      { id: 'enterprise', label: 'Every endpoint is compromised', help: 'Assumes spread not shown in this isolated dataset.' },
      { id: 'none', label: 'No endpoint is affected because the file was stopped', help: 'Treats prevention as proof of full cleanup.' },
    ])}
    ${moduleFiveRadioGroup('action', '4. Choose the proportionate next action.', 'The sensor stopped one observed file, but endpoint integrity is unresolved.', [
      { id: 'isolate-preserve', label: 'Isolate WS-LAB-27, preserve evidence, and escalate for endpoint response', help: 'Contains the confirmed host while retaining the facts responders need.' },
      { id: 'close', label: 'Close the alert because quarantine succeeded', help: 'Assumes the persistence change and endpoint state require no review.' },
      { id: 'wipe-all', label: 'Wipe every endpoint immediately', help: 'A disruptive action unsupported by the current scope.' },
    ])}
    <div class="m05-note-field"><label for="m05-notes">5. Write the analyst handoff</label><p id="m05-note-help">In 2–4 sentences: name the endpoint, summarize the chain, cite file or persistence evidence, and state the recommended response.</p><textarea id="m05-notes" name="notes" rows="5" maxlength="900" aria-describedby="m05-note-help m05-note-count" placeholder="WS-LAB-27: Observed… Evidence shows… Recommend…">${esc(moduleFiveState.notes)}</textarea><div class="m05-note-tools"><button type="button" data-m05-note-outline><i class="ri-draft-line" aria-hidden="true"></i> Insert a handoff outline</button><span id="m05-note-count">${moduleFiveState.notes.length}/900</span></div></div>
    <div class="m05-actions"><button type="submit" class="m05-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score investigation</button><button type="button" class="m05-reset" data-m05-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>
    ${moduleFiveScorePanel()}
  </form>`;
}

function moduleFiveDynamic() {
  const reviewed = new Set(moduleFiveState.reviewedSources);
  const evidenceCount = moduleFiveState.selectedEvidence.length;
  return `<div class="m05-progress-card" aria-label="Investigation progress"><div class="${reviewed.has('processes') ? 'is-done' : ''}"><i class="${reviewed.has('processes') ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i><span>Inspect a process relationship</span></div><div class="${reviewed.has('activity') ? 'is-done' : ''}"><i class="${reviewed.has('activity') ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i><span>Inspect endpoint activity</span></div><div class="${evidenceCount >= 3 ? 'is-done' : ''}"><i class="${evidenceCount >= 3 ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i><span>Select at least 3 findings</span></div><div class="${moduleFiveState.completed ? 'is-done' : ''}"><i class="${moduleFiveState.completed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i><span>Pass the investigation record</span></div></div>
  <section class="m05-workbench" aria-labelledby="m05-workbench-title">
    <div class="m05-casebar"><div><p class="m05-kicker">Case EDR-205 · isolated training dataset</p><h3 id="m05-workbench-title" tabindex="-1">Suspicious child process on WS-LAB-27</h3><p>An endpoint sensor stopped <code>update-check.exe</code> after it started from a user-writable folder. Determine how it launched, whether the file is malicious, what the dataset proves about scope, and the next action.</p></div><dl><div><dt>Endpoint</dt><dd>WS-LAB-27</dd></div><div><dt>User label</dt><dd>employee-27</dd></div><div><dt>Sensor state</dt><dd>Connected</dd></div><div><dt>Isolation</dt><dd>Not isolated</dd></div></dl></div>
    <div class="m05-source-tabs" role="tablist" aria-label="Endpoint evidence sources"><button type="button" role="tab" id="m05-tab-processes" aria-controls="m05-source-panel" aria-selected="${moduleFiveState.activeSource === 'processes'}" tabindex="${moduleFiveState.activeSource === 'processes' ? '0' : '-1'}" data-m05-source="processes"><i class="ri-node-tree" aria-hidden="true"></i> Process tree <span>${reviewed.has('processes') ? 'Reviewed' : 'Open'}</span></button><button type="button" role="tab" id="m05-tab-activity" aria-controls="m05-source-panel" aria-selected="${moduleFiveState.activeSource === 'activity'}" tabindex="${moduleFiveState.activeSource === 'activity' ? '0' : '-1'}" data-m05-source="activity"><i class="ri-time-line" aria-hidden="true"></i> Endpoint activity <span>${reviewed.has('activity') ? 'Reviewed' : 'Open'}</span></button><button type="button" class="m05-hint-button" data-m05-hint aria-expanded="${moduleFiveState.hintOpen}" aria-controls="m05-hint"><i class="ri-lightbulb-line" aria-hidden="true"></i> Hint</button></div>
    <div class="m05-hint" id="m05-hint" tabindex="-1" ${moduleFiveState.hintOpen ? '' : 'hidden'}><strong>Assisted-lab hint</strong><p>Start with either source. In the tree, compare the Office and sync-client branches. In activity, connect the file creator to its reputation and persistence event. Hints never reduce your score.</p></div>
    <div class="m05-source-panel" id="m05-source-panel" role="tabpanel" aria-labelledby="m05-tab-${esc(moduleFiveState.activeSource)}">${moduleFiveState.activeSource === 'processes' ? moduleFiveProcessSource() : moduleFiveActivitySource()}</div>
  </section>
  ${moduleFiveFindings()}
  ${moduleFiveAssessment()}
  ${moduleFiveIndependentLab()}`;
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
  const module = program.modules['soc-05'];
  const moduleLab = LABS.find((item) => item.key === MODULE_FIVE_CATALOG_LAB_KEY);
  const sections = moduleFiveGetSections();
  const lectureOpen = moduleFiveReviewMode || !sections[0].isComplete;
  const quizOpen = moduleFiveReviewMode || (moduleFiveQuizState && !moduleFiveQuizState.passed);
  const labOpen = moduleFiveReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleFiveReviewMode;

  return `<div class="m05-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleFiveReviewMode })}
    <main class="m05-main">
      <section class="m05-hero" aria-labelledby="m05-title"><div><p class="m05-kicker">Module 05 · ${formatInstructionalMinutes(module.durationMinutes)} · assisted investigation</p><h1 id="m05-title">${esc(module.title)}</h1><p>Read process relationships, reconstruct endpoint activity, evaluate a suspicious file, and create a proportionate response handoff without leaving this one-workstation lab. This is analyst investigation and triage: learners do not reverse-engineer or develop malware, and specialist analysis is escalated.</p></div><dl><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Evidence sources</dt><dd>2</dd></div><div><dt>Lab status</dt><dd id="m05-status">${moduleFiveState.completed ? 'Complete' : moduleFiveState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <details class="m05-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">1</span><div><p class="m05-kicker">Lecture</p><h2 id="m05-lecture">Endpoint investigation foundations</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveLecture()}${moduleFiveVideoScript()}</div>
      </details>

      <details class="m05-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">2</span><div><p class="m05-kicker">Knowledge Check</p><h2 id="m05-knowledge-check">Test your understanding of endpoint investigation</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveQuizPanel()}</div>
      </details>

      <details class="m05-section-collapsible" ${labOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">3</span><div><p class="m05-kicker">Endpoint Lab</p><h2 id="m05-lab">Investigate one endpoint</h2></div></div></summary>
        <div class="m05-section-body">
          <section class="m05-section" id="m05-field-guide" aria-labelledby="m05-field-guide-title"><div class="m05-section-heading"><span>3a</span><div><p class="m05-kicker">Endpoint investigation field guide</p><h3 id="m05-field-guide-title">Ten ideas to use in the lab</h3></div></div><p class="m05-section-intro">Open any lesson when you need it. The lab is assisted: the path is visible, but you decide which evidence source to review first.</p>${moduleFiveLessonGrid()}</section>
          <section class="m05-section" aria-labelledby="m05-path-title"><div class="m05-section-heading"><span>3b</span><div><p class="m05-kicker">Signposted path · flexible source order</p><h3 id="m05-path-title">Your investigation route</h3></div></div><ol class="m05-route"><li><span>1</span><div><strong>Orient</strong><p>Read the alert and endpoint facts.</p></div></li><li><span>2</span><div><strong>Inspect</strong><p>Use both sources in either order.</p></div></li><li><span>3</span><div><strong>Select</strong><p>Add decisive records to findings.</p></div></li><li><span>4</span><div><strong>Conclude</strong><p>Submit the scored handoff.</p></div></li></ol><div class="m05-boundary"><i class="ri-shield-keyhole-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This miniature case contains only WS-LAB-27. Simulated isolation is a recommendation in the scored record; no real endpoint action occurs.</p></div></section>
          <section class="m05-section m05-lab" aria-labelledby="m05-workbench-title"><div id="m05-dynamic">${moduleFiveDynamic()}</div></section>
        </div>
      </details>

      <details class="m05-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">4</span><div><p class="m05-kicker">Module Review</p><h2 id="m05-review">Key concepts and takeaways</h2></div></div></summary>
        <div class="m05-section-body">${moduleFiveReview()}</div>
      </details>

      <details class="m05-section-collapsible" ${moduleFiveReviewMode ? 'open' : ''}>
        <summary class="m05-section"><div class="m05-section-heading"><span class="m05-section-badge">5</span><div><p class="m05-kicker">Sources & Further Reading</p><h2 id="m05-sources">Authoritative references on endpoint investigation</h2></div></div></summary>
        <div class="m05-section-body">${moduleSourcesBlock(MODULE_FIVE_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

function moduleFiveScore() {
  const selected = new Set(moduleFiveState.selectedEvidence);
  const decisiveCount = Object.entries(MODULE_FIVE_EVIDENCE).filter(([id, item]) => item.decisive && selected.has(id)).length;
  const sources = new Set(moduleFiveState.reviewedSources);
  const observation = (decisiveCount * 5) + (sources.has('processes') && sources.has('activity') ? 5 : 0);
  const analysis = (moduleFiveState.chain === 'document-shell-loader' ? 15 : 0) + (moduleFiveState.fileVerdict === 'malicious' ? 15 : 0);
  const decision = (moduleFiveState.scope === 'one-confirmed' ? 10 : 0) + (moduleFiveState.action === 'isolate-preserve' ? 15 : 0);
  const note = moduleFiveState.notes.trim().toLowerCase();
  const namesEndpoint = /ws-lab-27|endpoint/.test(note);
  const explainsChain = /(winword|office|document).*(powershell)|(powershell).*(update-check)/.test(note);
  const citesEvidence = /(run.key|registry|persist|unsigned|reputation|loader|hash)/.test(note);
  const recommends = /(isolate|contain).*(preserv|escalat)|(preserv|escalat).*(isolate|contain)/.test(note);
  const communication = (note.length >= 80 ? 4 : 0) + (namesEndpoint ? 4 : 0) + (explainsChain ? 4 : 0) + (citesEvidence ? 4 : 0) + (recommends ? 4 : 0);
  return {
    score: observation + analysis + decision + communication,
    breakdown: { observation, analysis, decision, communication },
    feedback: [
      observation === 25 ? 'Observation: Both sources were reviewed and all four decisive records were selected.' : `Observation: ${decisiveCount}/4 decisive records selected${sources.has('processes') && sources.has('activity') ? '; both sources reviewed.' : '; inspect both sources for the remaining 5 points.'}`,
      analysis === 30 ? 'Analysis: Correct. The document-to-shell-to-loader chain and combined file evidence support a malicious verdict.' : `Analysis: ${moduleFiveState.chain === 'document-shell-loader' ? 'The execution chain is correct.' : 'Revisit which parent launched PowerShell and what it launched next.'} ${moduleFiveState.fileVerdict === 'malicious' ? 'The file verdict is correct.' : 'Combine behavior, signer, prevalence, and the local reputation result.'}`,
      decision === 25 ? 'Decision: Correct. The response is proportionate and the scope statement stays inside the evidence.' : `Decision: ${moduleFiveState.scope === 'one-confirmed' ? 'The scope statement is defensible.' : 'Only one endpoint is confirmed by this dataset.'} ${moduleFiveState.action === 'isolate-preserve' ? 'The response action is appropriate.' : 'Stopping one file does not establish endpoint integrity; isolate, preserve, and escalate.'}`,
      communication === 20 ? 'Communication: The handoff names the endpoint, explains the chain, cites decisive evidence, and recommends response.' : `Communication: Add ${[note.length >= 80 ? null : 'enough detail for a responder', namesEndpoint ? null : 'the endpoint', explainsChain ? null : 'the execution chain', citesEvidence ? null : 'file or persistence evidence', recommends ? null : 'isolation plus preservation or escalation'].filter(Boolean).join(', ')}.`,
    ],
  };
}

function moduleFiveRenderDynamic(focusId) {
  const root = document.getElementById('m05-dynamic');
  if (!root) return;
  root.innerHTML = moduleFiveDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleFiveMarkSource(source) {
  if (!moduleFiveState.reviewedSources.includes(source)) moduleFiveState.reviewedSources.push(source);
}

function moduleFiveToggleEvidence(evidenceId) {
  if (!MODULE_FIVE_EVIDENCE[evidenceId]) return;
  const index = moduleFiveState.selectedEvidence.indexOf(evidenceId);
  if (index >= 0) moduleFiveState.selectedEvidence.splice(index, 1);
  else moduleFiveState.selectedEvidence.push(evidenceId);
  moduleFiveState.validationError = '';
  moduleFiveSave();
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
    const selection = selectQuizQuestions(MODULE_FIVE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleFiveQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: moduleFiveQuizState.attempts,
      score: 0,
      bestScore: moduleFiveQuizState.bestScore,
      feedback: [],
      passed: false,
    };
    form.innerHTML = moduleFiveQuizPanel();
  });
}

function wireModuleFiveLab() {
  const root = document.getElementById('m05-dynamic');
  if (!root || !moduleFiveState) return;

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
    if (taskButton) {
      const lesson = MODULE_FIVE_LESSON_LOOPS.find((item) => item.id === taskButton.dataset.m05LessonTask);
      const work = moduleFiveState.lessonWork[lesson.id] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      work.taskComplete = work.checked && (work.task || '').trim().length >= 20;
      work.feedback = work.taskComplete ? ['Applied task saved.'] : ['Complete the knowledge check and write at least 20 characters before saving the task.'];
      moduleFiveSave();
      const details = taskButton.closest('details');
      if (details) details.outerHTML = moduleFiveLessonLoop(lesson, MODULE_FIVE_LESSON_LOOPS.indexOf(lesson));
      return;
    }
    const sourceButton = event.target.closest('[data-m05-source]');
    if (sourceButton) {
      moduleFiveState.activeSource = sourceButton.dataset.m05Source;
      moduleFiveSave();
      moduleFiveRenderDynamic(`m05-tab-${moduleFiveState.activeSource}`);
      return;
    }
    const processButton = event.target.closest('[data-m05-process]');
    if (processButton) {
      moduleFiveState.selectedProcess = processButton.dataset.m05Process;
      moduleFiveMarkSource('processes');
      moduleFiveSave();
      moduleFiveRenderDynamic('m05-process-detail-title');
      return;
    }
    const eventButton = event.target.closest('[data-m05-event]');
    if (eventButton) {
      moduleFiveState.selectedEvent = eventButton.dataset.m05Event;
      moduleFiveMarkSource('activity');
      moduleFiveSave();
      moduleFiveRenderDynamic('m05-event-detail-title');
      return;
    }
    const evidenceButton = event.target.closest('[data-m05-evidence]');
    if (evidenceButton) {
      moduleFiveToggleEvidence(evidenceButton.dataset.m05Evidence);
      moduleFiveRenderDynamic(moduleFiveState.activeSource === 'processes' ? 'm05-process-detail-title' : 'm05-event-detail-title');
      return;
    }
    const removeButton = event.target.closest('[data-m05-remove-evidence]');
    if (removeButton) {
      moduleFiveToggleEvidence(removeButton.dataset.m05RemoveEvidence);
      moduleFiveRenderDynamic('m05-findings-title');
      return;
    }
    if (event.target.closest('[data-m05-hint]')) {
      moduleFiveState.hintOpen = !moduleFiveState.hintOpen;
      if (moduleFiveState.hintOpen && moduleFiveState.hintsOpened === 0) moduleFiveState.hintsOpened = 1;
      moduleFiveSave();
      moduleFiveRenderDynamic(moduleFiveState.hintOpen ? 'm05-hint' : `m05-tab-${moduleFiveState.activeSource}`);
      return;
    }
    if (event.target.closest('[data-m05-note-outline]')) {
      moduleFiveState.notes = 'WS-LAB-27: Observed [execution chain]. File evidence shows [signer, prevalence, or reputation result], and endpoint activity shows [persistence or sensor action]. Recommend [containment and evidence-preservation action] because [reason].';
      moduleFiveSave();
      moduleFiveRenderDynamic('m05-notes');
      return;
    }
    if (event.target.closest('[data-m05-reset]')) {
      moduleFiveState = LabRuntime.reset(MODULE_FIVE_LAB_ID, moduleFiveUser, MODULE_FIVE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFiveUser, 'soc-analyst', 'soc-05', MODULE_FIVE_CATALOG_LAB_KEY, false);
      moduleFiveRenderDynamic('m05-workbench-title');
      const status = document.getElementById('m05-status');
      if (status) status.textContent = 'Not started';
    }
  });

  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-m05-source]');
    if (!tab || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const nextSource = tab.dataset.m05Source === 'processes' ? 'activity' : 'processes';
    moduleFiveState.activeSource = nextSource;
    moduleFiveSave();
    moduleFiveRenderDynamic(`m05-tab-${nextSource}`);
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-m05-lesson-answer]')) {
      const work = moduleFiveState.lessonWork[event.target.dataset.lessonId] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      work.answers[event.target.dataset.questionIndex] = Number(event.target.value);
      moduleFiveSave();
      return;
    }
    if (event.target.matches('[data-m05-independent-answer]')) {
      moduleFiveState.independentLab.answers[event.target.dataset.questionId] = event.target.value;
      moduleFiveSave();
      return;
    }
    if (!['chain', 'fileVerdict', 'scope', 'action'].includes(event.target.name)) return;
    moduleFiveState[event.target.name] = event.target.value;
    moduleFiveState.validationError = '';
    moduleFiveSave();
  });

  root.addEventListener('input', (event) => {
    const lessonField = event.target.closest('[data-m05-lesson-task]');
    if (lessonField) {
      const work = moduleFiveState.lessonWork[lessonField.dataset.m05LessonTask] ||= { answers: {}, task: '', checked: false, taskComplete: false, feedback: [] };
      work.task = lessonField.value;
      moduleFiveSave();
      return;
    }
    if (event.target.matches('[data-m05-independent-notes]')) {
      moduleFiveState.independentLab.notes = event.target.value;
      moduleFiveSave();
      return;
    }
    if (event.target.name !== 'notes') return;
    moduleFiveState.notes = event.target.value;
    moduleFiveState.validationError = '';
    const count = document.getElementById('m05-note-count');
    if (count) count.textContent = `${event.target.value.length}/900`;
    moduleFiveSave();
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm05-independent-form') {
      event.preventDefault();
      const state = moduleFiveState.independentLab;
      const missing = MODULE_FIVE_INDEPENDENT_LAB.questions.filter((q) => !state.answers?.[q.id]);
      if (missing.length) { state.feedback = ['Answer all three independent-lab decisions before scoring.']; moduleFiveSave(); moduleFiveRenderDynamic('m05-independent-title'); return; }
      const correct = MODULE_FIVE_INDEPENDENT_LAB.questions.filter((q) => state.answers[q.id] === q.correct).length;
      state.score = Math.round(correct / MODULE_FIVE_INDEPENDENT_LAB.questions.length * 100);
      state.attempts = (state.attempts || 0) + 1;
      state.completed = state.score >= 70;
      state.feedback = state.completed ? ['Correct. The chain, bounded scope, and evidence-preserving handoff are supported by this fictional record.'] : ['Revisit the fake-CAPTCHA-to-PowerShell chain, the scope limit, and the approval-gated handoff.'];
      moduleFiveSave();
      if (state.completed && typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFiveUser, 'soc-analyst', 'soc-05', 'lab-endpoint-independent');
      moduleFiveRenderDynamic('m05-independent-title');
      return;
    }
    if (event.target.id !== 'm05-assessment') return;
    event.preventDefault();
    moduleFiveState.notes = event.target.elements.notes.value;
    const missing = ['chain', 'fileVerdict', 'scope', 'action'].filter((name) => !moduleFiveState[name]);
    if (moduleFiveState.reviewedSources.length < 2 || moduleFiveState.selectedEvidence.length < 3 || missing.length || moduleFiveState.notes.trim().length < 80) {
      moduleFiveState.validationError = [
        moduleFiveState.reviewedSources.length < 2 ? 'Inspect at least one record in each evidence source.' : '',
        moduleFiveState.selectedEvidence.length < 3 ? 'Add at least three findings to the evidence board.' : '',
        missing.length ? 'Answer all four investigation decisions.' : '',
        moduleFiveState.notes.trim().length < 80 ? 'Write a handoff of at least 80 characters.' : '',
      ].filter(Boolean).join(' ');
      moduleFiveSave();
      moduleFiveRenderDynamic('m05-feedback');
      return;
    }
    const result = moduleFiveScore();
    moduleFiveState.attempts += 1;
    moduleFiveState.score = result.score;
    moduleFiveState.bestScore = Math.max(moduleFiveState.bestScore || 0, result.score);
    moduleFiveState.breakdown = result.breakdown;
    moduleFiveState.feedback = result.feedback;
    moduleFiveState.validationError = '';
    moduleFiveState.lastSubmittedAt = new Date().toISOString();
    const passed = result.score >= MODULE_FIVE_PASSING_SCORE;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleFiveUser, MODULE_FIVE_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleFiveState.attempts },
      });
    }
    if (passed) {
      moduleFiveState.completed = true;
      if (!moduleFiveState.flags.includes(MODULE_FIVE_FLAG)) moduleFiveState.flags.push(MODULE_FIVE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFiveUser, 'soc-analyst', 'soc-05', MODULE_FIVE_CATALOG_LAB_KEY);
    }
    moduleFiveSave();
    moduleFiveRenderDynamic('m05-feedback');
    const status = document.getElementById('m05-status');
    if (status) status.textContent = moduleFiveState.completed ? 'Complete' : 'In progress';
  });
}

function wireModuleFive() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleFiveReviewMode = !moduleFiveReviewMode;
      const isOpen = moduleFiveReviewMode;
      reviewToggle.setAttribute('aria-pressed', isOpen);
      reviewToggle.querySelector('i').className = isOpen ? 'ri-close-line' : 'ri-file-list-line';
      const label = reviewToggle.querySelector('span');
      if (label) label.textContent = isOpen ? 'Close review' : 'Review module';
      document.querySelectorAll('.m05-section-collapsible').forEach((details) => {
        if (isOpen) details.setAttribute('open', '');
        else details.removeAttribute('open');
      });
    });
  }
  wireModuleFiveQuiz();
  wireModuleFiveLab();
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 5, moduleKey: 'soc-05',
  view: viewModuleFive, wire: wireModuleFive });

/* Module 05 — assisted endpoint and malware investigation.
 * All hosts, processes, files, and actions are fictional browser-local fixtures.
 */

const MODULE_FIVE_LAB_ID = 'm05-endpoint-chain-v1';
const MODULE_FIVE_FLAG = 'M05-ENDPOINT-CHAIN-VALIDATED';
const MODULE_FIVE_CATALOG_LAB_KEY = 'lab-endpoint-investigation';
const MODULE_FIVE_PASSING_SCORE = 70;

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

function moduleFiveLoad(user) {
  moduleFiveUser = user;
  moduleFiveState = LabRuntime.load(MODULE_FIVE_LAB_ID, user, MODULE_FIVE_DEFAULT_STATE);
  if (!Array.isArray(moduleFiveState.reviewedSources)) moduleFiveState.reviewedSources = [];
  if (!Array.isArray(moduleFiveState.selectedEvidence)) moduleFiveState.selectedEvidence = [];
  if (!Array.isArray(moduleFiveState.flags)) moduleFiveState.flags = [];
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-05');
  return moduleFiveState;
}

function moduleFiveSave() {
  if (moduleFiveUser && moduleFiveState) LabRuntime.save(MODULE_FIVE_LAB_ID, moduleFiveUser, moduleFiveState);
}

function moduleFiveLessonGrid() {
  return `<div class="m05-lesson-grid">
    ${MODULE_FIVE_LESSONS.map((lesson, index) => `<details class="m05-lesson" ${index === 0 ? 'open' : ''}>
      <summary><span class="m05-lesson-number">${String(index + 1).padStart(2, '0')}</span><i class="${esc(lesson.icon)}" aria-hidden="true"></i><span><strong>${esc(lesson.title)}</strong><small>${esc(lesson.summary)}</small></span><i class="ri-arrow-down-s-line m05-chevron" aria-hidden="true"></i></summary>
      <div class="m05-lesson-copy"><p>${esc(lesson.detail)}</p><p><strong>Analyst habit:</strong> ${esc(lesson.takeaway)}</p></div>
    </details>`).join('')}
  </div>`;
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
  ${moduleFiveAssessment()}`;
}

function viewModuleFive(user, program) {
  moduleFiveLoad(user);
  const module = program.modules['soc-05'];
  const moduleLab = LABS.find((item) => item.key === MODULE_FIVE_CATALOG_LAB_KEY);
  return `<div class="m05-shell">
    <header class="m05-topbar"><a class="m05-brand" href="#/program/${esc(program.slug)}" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div><span class="m05-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Assisted simulation · fictional data</span><a class="m05-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="m05-main">
      <section class="m05-hero" aria-labelledby="m05-title"><div><p class="m05-kicker">Module 05 · ${formatInstructionalMinutes(module.durationMinutes)} · assisted investigation</p><h1 id="m05-title">${esc(module.title)}</h1><p>Read process relationships, reconstruct endpoint activity, evaluate a suspicious file, and create a proportionate response handoff without leaving this one-workstation lab. This is analyst investigation and triage: learners do not reverse-engineer or develop malware, and specialist analysis is escalated.</p><a href="#m05-field-guide" class="m05-primary"><i class="ri-book-open-line" aria-hidden="true"></i> Review the field guide</a></div><dl><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Evidence sources</dt><dd>2</dd></div><div><dt>Lab status</dt><dd id="m05-status">${moduleFiveState.completed ? 'Complete' : moduleFiveState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>
      <section class="m05-objective" aria-labelledby="m05-objective-title"><i class="ri-focus-3-line" aria-hidden="true"></i><div><p class="m05-kicker">Measurable objective</p><h2 id="m05-objective-title">Produce an evidence-backed endpoint verdict and containment handoff.</h2><p>Success means selecting relevant observations, identifying the execution chain and file verdict, limiting the conclusion to the proven scope, and communicating the next action.</p></div></section>
      <section class="m05-section" id="m05-field-guide" aria-labelledby="m05-field-guide-title"><div class="m05-section-heading"><span>1</span><div><p class="m05-kicker">Endpoint investigation field guide</p><h2 id="m05-field-guide-title">Ten ideas to use in the lab</h2></div></div><p class="m05-section-intro">Open any lesson when you need it. The lab is assisted: the path is visible, but you decide which evidence source to review first.</p>${moduleFiveLessonGrid()}</section>
      <section class="m05-section" aria-labelledby="m05-path-title"><div class="m05-section-heading"><span>2</span><div><p class="m05-kicker">Signposted path · flexible source order</p><h2 id="m05-path-title">Your investigation route</h2></div></div><ol class="m05-route"><li><span>1</span><div><strong>Orient</strong><p>Read the alert and endpoint facts.</p></div></li><li><span>2</span><div><strong>Inspect</strong><p>Use both sources in either order.</p></div></li><li><span>3</span><div><strong>Select</strong><p>Add decisive records to findings.</p></div></li><li><span>4</span><div><strong>Conclude</strong><p>Submit the scored handoff.</p></div></li></ol><div class="m05-boundary"><i class="ri-shield-keyhole-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This miniature case contains only WS-LAB-27. Simulated isolation is a recommendation in the scored record; no real endpoint action occurs.</p></div></section>
      <section class="m05-section m05-lab" id="m05-lab" aria-labelledby="m05-lab-title"><div class="m05-section-heading"><span>3</span><div><p class="m05-kicker">Infected workstation investigation · ${formatInstructionalMinutes(moduleLab.instructionalMinutes)} instructional time</p><h2 id="m05-lab-title">Investigate one endpoint</h2></div></div><div id="m05-dynamic">${moduleFiveDynamic()}</div></section>
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

function wireModuleFiveLab() {
  const root = document.getElementById('m05-dynamic');
  if (!root || !moduleFiveState) return;

  root.addEventListener('click', (event) => {
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
    if (!['chain', 'fileVerdict', 'scope', 'action'].includes(event.target.name)) return;
    moduleFiveState[event.target.name] = event.target.value;
    moduleFiveState.validationError = '';
    moduleFiveSave();
  });

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleFiveState.notes = event.target.value;
    moduleFiveState.validationError = '';
    const count = document.getElementById('m05-note-count');
    if (count) count.textContent = `${event.target.value.length}/900`;
    moduleFiveSave();
  });

  root.addEventListener('submit', (event) => {
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

registerModuleLab({ program: 'soc-analyst', moduleNumber: 5, moduleKey: 'soc-05',
  view: viewModuleFive, wire: wireModuleFiveLab });

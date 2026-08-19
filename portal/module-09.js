/* Module 09 — semi-independent incident response.
 * All people, systems, addresses, and evidence are synthetic and browser-local.
 */

const MODULE_NINE_LAB_ID = 'm09-proportional-response-v1';
const MODULE_NINE_FLAG = 'M09-INCIDENT-RESPONSE-COMPLETE';
const MODULE_NINE_CATALOG_LAB_KEY = 'lab-active-incident';
const MODULE_NINE_PASSING_SCORE = 80;

const MODULE_NINE_SOURCES = {
  endpoint: {
    label: 'Endpoint activity',
    icon: 'ri-computer-line',
    prompt: 'Decide which endpoint records establish execution, persistence, and the affected host.',
    rows: [
      { id: 'IR-901', time: '09:14', entity: 'LT-73', title: 'Content viewer spawned an encoded script', summary: 'content-viewer.exe → script-host.exe -enc …', detail: 'The unsigned script host ran from the profile downloads folder under employee-73. The parent-child relationship is uncommon on this device.', relevant: true },
      { id: 'IR-902', time: '09:16', entity: 'LT-73', title: 'Startup task created by the script host', summary: 'Task “Profile Sync Check” points to cache-sync.bin', detail: 'The task is new, runs at sign-in, and launches an unsigned payload from a user-writable cache directory.', relevant: true },
      { id: 'IR-903', time: '09:20', entity: 'LT-20', title: 'Approved inventory script completed', summary: 'management-agent.exe → inventory-script.exe', detail: 'The signed inventory tool ran from the managed tools directory during the published inventory window.', relevant: false },
      { id: 'IR-904', time: '09:27', entity: 'LT-73', title: 'Endpoint sensor blocked a second payload start', summary: 'cache-sync.bin prevented; startup task remains', detail: 'Prevention stopped one launch, but it did not remove the startup task or establish that the endpoint is clean.', relevant: true },
    ],
  },
  identity: {
    label: 'Identity sessions',
    icon: 'ri-user-shared-line',
    prompt: 'Correlate the account activity to the endpoint window without treating every successful sign-in as hostile.',
    rows: [
      { id: 'IR-905', time: '09:08', entity: 'acct-73', title: 'Normal managed-desktop sign-in', summary: '192.0.2.24 · LT-73 · MFA satisfied', detail: 'This sign-in came from the account’s registered workstation and usual office test range before the suspicious execution.', relevant: false },
      { id: 'IR-906', time: '09:18', entity: 'acct-73', title: 'Unfamiliar token refresh', summary: '203.0.113.146 · unmanaged client', detail: 'The refresh used the same documentation-range address contacted by LT-73, four minutes after the encoded script started.', relevant: true },
      { id: 'IR-907', time: '09:23', entity: 'backup-job', title: 'Scheduled non-interactive sign-in', summary: '192.0.2.80 · SRV-08 · expected automation', detail: 'The registered backup identity authenticated from its normal server during the archive window.', relevant: false },
      { id: 'IR-908', time: '09:31', entity: 'acct-73', title: 'Account owner denied the new session', summary: 'Service desk callback SD-431', detail: 'The account owner confirmed opening the original document but denied the unfamiliar client and did not authorize the startup task.', relevant: true },
    ],
  },
  scope: {
    label: 'Network & scope',
    icon: 'ri-node-tree',
    prompt: 'Use network and scoping results to bound the response. Absence in this small dataset is not proof of enterprise safety.',
    rows: [
      { id: 'IR-909', time: '09:15', entity: 'LT-73', title: 'Outbound session to the correlated address', summary: '203.0.113.146:443 · 18 KB sent · 41 KB received', detail: 'The connection began one minute after script execution. No approved service in this dataset uses the address.', relevant: true },
      { id: 'IR-910', time: '09:24', entity: 'LT-41', title: 'Browser reached the training CDN', summary: '198.51.100.44:443 · signed browser', detail: 'The destination differs from the incident indicator and belongs to the synthetic allowlisted training service.', relevant: false },
      { id: 'IR-911', time: '09:34', entity: 'Scoped search', title: 'No second device matched both indicators', summary: 'cache-sync.bin + 203.0.113.146 searched across this lab slice', detail: 'The available endpoint and network slice supports one affected host. Continue monitoring; do not claim the wider environment is clean.', relevant: true },
      { id: 'IR-912', time: '09:38', entity: 'Data access check', title: 'No sensitive repository access observed', summary: 'acct-73 · incident window · zero matching events', detail: 'Current evidence does not show sensitive-data access or lateral movement. This limits demonstrated impact, not attacker intent.', relevant: false },
    ],
  },
};

const MODULE_NINE_EXPECTED_EVIDENCE = ['IR-901', 'IR-902', 'IR-906', 'IR-908', 'IR-909', 'IR-911'];
const MODULE_NINE_RESPONSE_OPTIONS = {
  contain: [
    { id: 'isolate-lt73', label: 'Isolate LT-73 through the approved endpoint playbook.', help: 'Limits further network activity on the confirmed host while preserving response access.' },
    { id: 'revoke-disable-acct73', label: 'Revoke acct-73 sessions and temporarily disable the account.', help: 'Contains the confirmed unfamiliar session while identity responders validate the account.' },
    { id: 'block-indicator', label: 'Block 203.0.113.146 in the scoped controls and monitor for matches.', help: 'Targets the correlated indicator without claiming the address alone proves compromise.' },
    { id: 'shutdown-all', label: 'Shut down every endpoint in the organization.', help: 'Business-wide disruption is unsupported by the one-host scope.' },
    { id: 'observe-only', label: 'Keep observing because the sensor blocked one launch.', help: 'One prevention event did not remove persistence or contain the identity session.' },
  ],
  eradicate: [
    { id: 'remove-persistence', label: 'Remove the startup task and payload, then run an approved full endpoint scan.', help: 'Addresses the demonstrated foothold after evidence is preserved.' },
    { id: 'reset-credentials', label: 'Reset acct-73 credentials and review its MFA methods.', help: 'Remediates the identity path after active sessions are revoked.' },
    { id: 'delete-telemetry', label: 'Delete the endpoint telemetry to prevent reinfection.', help: 'Telemetry is evidence; deleting it neither eradicates the cause nor supports recovery.' },
    { id: 'reimage-fleet', label: 'Reimage the entire endpoint fleet.', help: 'The current evidence supports response on LT-73, not the full fleet.' },
  ],
  recover: [
    { id: 'validate-reconnect', label: 'Validate LT-73 is clean, patched, and healthy before reconnecting it.', help: 'Recovery restores service only after responders verify the eradication work.' },
    { id: 'monitored-reenable', label: 'Re-enable acct-73 after credential and MFA checks, with heightened monitoring.', help: 'Returns access carefully and watches for recurrence on the affected entities and indicator.' },
    { id: 'reconnect-now', label: 'Reconnect LT-73 immediately after isolation succeeds.', help: 'Isolation success does not prove persistence and payloads are removed.' },
    { id: 'disable-forever', label: 'Keep acct-73 disabled permanently without business-owner review.', help: 'Permanent denial is not a proportionate recovery plan for this evidence.' },
  ],
};

let moduleNineState = null;
let moduleNineUser = null;

function moduleNineFreshDefaults() {
  return {
    activeSource: 'endpoint',
    reviewedSources: [],
    selectedEvidence: [],
    detailEvidence: '',
    hintsOpened: [],
    classification: '',
    scope: '',
    severity: '',
    responsePlan: { contain: [], eradicate: [], recover: [] },
    escalation: '',
    notes: '',
    breakdown: null,
    feedback: [],
    validationError: '',
    lastSubmittedAt: '',
  };
}

function moduleNineLoad(user) {
  moduleNineUser = user;
  const defaults = moduleNineFreshDefaults();
  moduleNineState = LabRuntime.load(MODULE_NINE_LAB_ID, user, defaults);
  ['reviewedSources', 'selectedEvidence', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleNineState[key])) moduleNineState[key] = [];
  });
  moduleNineState.responsePlan = { ...defaults.responsePlan, ...(moduleNineState.responsePlan || {}) };
  Object.keys(defaults.responsePlan).forEach((phase) => {
    if (!Array.isArray(moduleNineState.responsePlan[phase])) moduleNineState.responsePlan[phase] = [];
  });
  if (!MODULE_NINE_SOURCES[moduleNineState.activeSource]) moduleNineState.activeSource = 'endpoint';
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-09');
  return moduleNineState;
}

function moduleNineSave() {
  if (moduleNineUser && moduleNineState) LabRuntime.save(MODULE_NINE_LAB_ID, moduleNineUser, moduleNineState);
}

function moduleNineAllRows() {
  return Object.values(MODULE_NINE_SOURCES).flatMap((source) => source.rows);
}

function moduleNineRow(id) {
  return moduleNineAllRows().find((row) => row.id === id);
}

function moduleNineConcepts() {
  const cards = [
    ['ri-link-m', 'Correlate before acting', 'Connect time, entity, behavior, and source. A shared address is useful only when the surrounding activity supports the relationship.'],
    ['ri-focus-2-line', 'Bound impact and uncertainty', 'State what is confirmed, what is not observed, and what this limited dataset cannot prove. Scope controls response size.'],
    ['ri-shield-check-line', 'Respond in phases', 'Contain active harm, eradicate the foothold, then recover carefully. Preserve evidence and stay within approved authority.'],
    ['ri-file-list-3-line', 'Leave an actionable handoff', 'Record incident state, exact entities, strongest evidence, actions requested, and the condition that permits recovery.'],
  ];
  return `<div class="m09-concept-grid">${cards.map((card) => `<article><i class="${esc(card[0])}" aria-hidden="true"></i><h3>${esc(card[1])}</h3><p>${esc(card[2])}</p></article>`).join('')}</div>
    <div class="m09-lifecycle" aria-label="Incident response sequence"><span>Detect &amp; analyze</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Contain</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Eradicate</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Recover</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Learn</span></div>`;
}

function moduleNineSourceTabs() {
  return `<div class="m09-source-tabs" role="tablist" aria-label="Incident evidence sources">${Object.entries(MODULE_NINE_SOURCES).map(([key, source]) => {
    const reviewed = moduleNineState.reviewedSources.includes(key);
    return `<button type="button" role="tab" id="m09-tab-${esc(key)}" aria-controls="m09-source-panel" aria-selected="${moduleNineState.activeSource === key}" tabindex="${moduleNineState.activeSource === key ? '0' : '-1'}" data-m09-source="${esc(key)}"><i class="${esc(source.icon)}" aria-hidden="true"></i><span>${esc(source.label)}</span><small>${reviewed ? 'Reviewed' : 'Not reviewed'}</small></button>`;
  }).join('')}</div>`;
}

function moduleNineEvidenceTable(sourceKey) {
  const source = MODULE_NINE_SOURCES[sourceKey];
  const detail = moduleNineRow(moduleNineState.detailEvidence);
  return `<section class="m09-source-panel" id="m09-source-panel" role="tabpanel" aria-labelledby="m09-tab-${esc(sourceKey)}">
    <div class="m09-source-heading"><div><p class="m09-kicker">Source question</p><h4 id="m09-source-title" tabindex="-1">${esc(source.prompt)}</h4></div><button type="button" class="m09-review" data-m09-review="${esc(sourceKey)}"><i class="${moduleNineState.reviewedSources.includes(sourceKey) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-circle-line'}" aria-hidden="true"></i>${moduleNineState.reviewedSources.includes(sourceKey) ? 'Source reviewed' : 'Mark source reviewed'}</button></div>
    <div class="m09-table-wrap"><table class="m09-data-table"><caption class="m09-visually-hidden">${esc(source.label)} synthetic incident records</caption><thead><tr><th scope="col">Evidence</th><th scope="col">Time</th><th scope="col">Entity</th><th scope="col">Observation</th><th scope="col">Context</th></tr></thead><tbody>${source.rows.map((row) => {
      const selected = moduleNineState.selectedEvidence.includes(row.id);
      return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Evidence"><label class="m09-evidence-check"><input type="checkbox" name="evidence" value="${esc(row.id)}" ${selected ? 'checked' : ''} /><span>${esc(row.id)}</span></label></td><td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Entity"><code>${esc(row.entity)}</code></td><td data-label="Observation"><strong>${esc(row.title)}</strong><small>${esc(row.summary)}</small></td><td data-label="Context"><button type="button" class="m09-inspect" data-m09-detail="${esc(row.id)}" aria-expanded="${detail?.id === row.id}">${detail?.id === row.id ? 'Hide' : 'Inspect'}</button></td></tr>`;
    }).join('')}</tbody></table></div>
    ${detail && source.rows.includes(detail) ? `<aside class="m09-detail" id="m09-evidence-detail" tabindex="-1"><div><p class="m09-kicker">${esc(detail.id)} · analyst context</p><strong>${esc(detail.title)}</strong><p>${esc(detail.detail)}</p></div><button type="button" data-m09-detail-close aria-label="Close evidence detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}
  </section>`;
}

function moduleNineEvidenceTray() {
  const selected = moduleNineState.selectedEvidence.map(moduleNineRow).filter(Boolean);
  return `<aside class="m09-evidence-tray" aria-labelledby="m09-tray-title"><div><p class="m09-kicker">Correlation set</p><h4 id="m09-tray-title"><span id="m09-evidence-count">${selected.length}</span> records selected</h4></div>${selected.length ? `<ol>${selected.map((row) => `<li><code>${esc(row.id)}</code><span>${esc(row.entity)} · ${esc(row.title)}</span><button type="button" data-m09-remove-evidence="${esc(row.id)}" aria-label="Remove evidence ${esc(row.id)}"><i class="ri-close-line" aria-hidden="true"></i></button></li>`).join('')}</ol>` : '<p>Select records that establish execution, affected entities, correlation, and defensible scope. Benign context should stay out of the set.</p>'}</aside>`;
}

function moduleNineRadioGroup(name, legend, help, options) {
  return `<fieldset class="m09-fieldset"><legend>${esc(legend)}</legend><p class="m09-help">${esc(help)}</p><div class="m09-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleNineState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

function moduleNineResponsePhase(phase, number, title, description) {
  const selected = moduleNineState.responsePlan[phase];
  return `<fieldset class="m09-response-phase"><legend><span>${number}</span>${esc(title)}</legend><p>${esc(description)}</p><div class="m09-response-options">${MODULE_NINE_RESPONSE_OPTIONS[phase].map((option) => `<label><input type="checkbox" name="response-${esc(phase)}" value="${esc(option.id)}" ${selected.includes(option.id) ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div></fieldset>`;
}

function moduleNineScorePanel() {
  if (moduleNineState.validationError) return `<div class="m09-validation" id="m09-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the response record</strong><p>${esc(moduleNineState.validationError)}</p></div></div>`;
  if (!moduleNineState.attempts || !moduleNineState.breakdown) return `<div class="m09-score-empty" id="m09-feedback" role="status">Your evidence and decisions are saved locally. Submit when the handoff is ready; retries do not reduce your score.</div>`;
  const b = moduleNineState.breakdown;
  const passed = moduleNineState.score >= MODULE_NINE_PASSING_SCORE;
  return `<section class="m09-score ${passed ? 'is-pass' : 'is-remediate'}" id="m09-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m09-score-title"><div class="m09-score-heading"><div><p class="m09-kicker">Attempt ${moduleNineState.attempts} · best ${moduleNineState.bestScore}/100</p><h3 id="m09-score-title">${moduleNineState.score}/100 — ${passed ? 'Response plan approved' : 'Revise and resubmit'}</h3></div><span>${moduleNineState.score}</span></div><div class="m09-score-grid" aria-label="Score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/30</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul>${moduleNineState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m09-remediation"><strong>Model response boundary</strong><p>Current evidence confirms LT-73 and acct-73. Isolate that host, contain its active identity sessions, preserve the selected facts, remove the demonstrated persistence and credential risk, then restore service only after validation. Continue scoped monitoring instead of claiming the full environment is clean or taking fleet-wide destructive action.</p></div></section>`;
}

function moduleNineInvestigation() {
  return `<section class="m09-workbench" aria-labelledby="m09-case-title"><div class="m09-casebar"><div><p class="m09-kicker">IR-09-44 · isolated incident slice</p><h3 id="m09-case-title" tabindex="-1">Suspicious execution with an unfamiliar identity session</h3><p>An endpoint prevention alert and identity anomaly arrived within four minutes. Validate whether they belong to one incident, bound the affected entities, and plan a proportionate response.</p></div><dl><div><dt>Assigned role</dt><dd>Tier 1 responder</dd></div><div><dt>Authority</dt><dd>Playbook actions</dd></div><div><dt>Starting severity</dt><dd>Medium</dd></div></dl></div>
    <div class="m09-progress-row" aria-label="Investigation progress"><span><strong>${moduleNineState.reviewedSources.length}/3</strong> sources reviewed</span><span><strong>${moduleNineState.selectedEvidence.length}</strong> evidence records</span><span><strong>${moduleNineState.attempts || 0}</strong> scored attempts</span></div>
    ${moduleNineSourceTabs()}${moduleNineEvidenceTable(moduleNineState.activeSource)}${moduleNineEvidenceTray()}
    <details class="m09-hint" ${moduleNineState.hintsOpened.includes('correlation') ? 'open' : ''} data-m09-hint="correlation"><summary>Optional correlation hint</summary><p>Start with the process and persistence records. Then look for identity and network activity sharing both the same time window and incident entity. Keep known-good baselines out of the evidence set.</p></details>
  </section>`;
}

function moduleNineArtifact() {
  return `<form class="m09-artifact" id="m09-form" novalidate aria-labelledby="m09-artifact-title"><div class="m09-panel-heading"><div><p class="m09-kicker">Scored artifact · observation, analysis, decision, communication</p><h3 id="m09-artifact-title">Incident response record</h3></div><span>Pass ${MODULE_NINE_PASSING_SCORE}/100</span></div>
    <section class="m09-artifact-section" aria-labelledby="m09-analysis-title"><div class="m09-subheading"><span>1</span><div><h4 id="m09-analysis-title">Analyze the incident picture</h4><p>Use only what this isolated evidence slice supports.</p></div></div>
      ${moduleNineRadioGroup('classification', 'Incident classification', 'Connect the endpoint behavior and the unfamiliar session.', [
        { id: 'endpoint-identity-compromise', label: 'Confirmed endpoint and identity compromise', help: 'The execution, persistence, correlated session, and owner denial form one supported incident.' },
        { id: 'endpoint-only', label: 'Endpoint malware only; identity activity is unrelated', help: 'Ignores time, address, account, and owner-confirmation correlation.' },
        { id: 'benign', label: 'Benign maintenance activity', help: 'Does not explain the unsigned script, persistence, or unfamiliar session.' },
      ])}
      ${moduleNineRadioGroup('scope', 'Defensible current scope', 'Separate confirmed entities from the unobserved wider environment.', [
        { id: 'one-pair', label: 'LT-73 and acct-73 confirmed; broader compromise is not established', help: 'Matches the scoped search while retaining uncertainty beyond this lab slice.' },
        { id: 'fleet-wide', label: 'The full endpoint fleet and every identity are compromised', help: 'No evidence in this dataset supports that breadth.' },
        { id: 'none', label: 'No affected entities because the second payload was blocked', help: 'Prevention did not undo execution, persistence, or session activity.' },
      ])}
      ${moduleNineRadioGroup('severity', 'Response severity', 'Balance persistence and identity misuse against the demonstrated impact and scope.', [
        { id: 'high', label: 'High — active foothold and identity misuse on one confirmed pair', help: 'Requires prompt containment, but the dataset shows neither critical asset impact nor lateral movement.' },
        { id: 'critical', label: 'Critical — enterprise-wide destructive incident', help: 'Overstates scope and impact.' },
        { id: 'low', label: 'Low — informational prevention event', help: 'Understates the persistence and unfamiliar active session.' },
      ])}
    </section>
    <section class="m09-artifact-section" aria-labelledby="m09-response-title"><div class="m09-subheading"><span>2</span><div><h4 id="m09-response-title">Build the response plan</h4><p>Select every justified action in each phase. Avoid both under-response and unsupported disruption.</p></div></div><div class="m09-response-grid">${moduleNineResponsePhase('contain', 'A', 'Contain', 'Limit active harm while preserving the case.')}${moduleNineResponsePhase('eradicate', 'B', 'Eradicate', 'Remove the demonstrated foothold and identity risk.')}${moduleNineResponsePhase('recover', 'C', 'Recover', 'Restore service only after clear validation conditions.')}</div>
      ${moduleNineRadioGroup('escalation', 'Escalation path', 'Your role may initiate approved actions, but specialist owners execute and validate the full response.', [
        { id: 'ir-owners', label: 'Escalate to the incident lead with endpoint and identity owners, evidence set, scope, and requested actions', help: 'Gives authorized responders a precise and reviewable starting point.' },
        { id: 'no-escalation', label: 'Do not escalate because this is only one user', help: 'Small scope does not make confirmed compromise safe.' },
        { id: 'public-notice', label: 'Publish an organization-wide breach notice immediately', help: 'This exceeds the evidence and Tier 1 authority.' },
      ])}
    </section>
    <section class="m09-artifact-section" aria-labelledby="m09-handoff-title"><div class="m09-subheading"><span>3</span><div><h4 id="m09-handoff-title">Communicate the handoff</h4><p>Write at least 140 characters. Name the incident state, entities, strongest evidence, containment request, and recovery condition.</p></div></div><label class="m09-note-label" for="m09-notes">Tier 1 response handoff</label><textarea id="m09-notes" name="notes" rows="7" maxlength="1000" aria-describedby="m09-note-help m09-note-count" placeholder="Incident state: … Confirmed scope: … Evidence: … Requested response: … Recovery condition: …">${esc(moduleNineState.notes)}</textarea><div class="m09-note-meta"><p id="m09-note-help">Observed facts first; clearly separate current scope from remaining uncertainty.</p><span id="m09-note-count">${moduleNineState.notes.length}/1000</span></div><details class="m09-hint" ${moduleNineState.hintsOpened.includes('handoff') ? 'open' : ''} data-m09-hint="handoff"><summary>Optional handoff checklist</summary><p>Conclusion → LT-73 and acct-73 → script/persistence plus correlated token evidence → isolate/revoke/reset → validate and monitor before reconnecting or re-enabling.</p></details></section>
    <div class="m09-actions"><button type="submit" class="m09-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score response record</button><button type="button" class="m09-reset" data-m09-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>${moduleNineScorePanel()}
  </form>`;
}

function moduleNineDynamic() {
  return `${moduleNineInvestigation()}${moduleNineArtifact()}`;
}

function viewModuleNine(user, program) {
  moduleNineLoad(user);
  return `<div class="m09-shell"><header class="m09-topbar"><a class="m09-brand" href="#/program/${esc(program.slug)}" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m09-top-actions"><span class="m09-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Semi-independent simulation · fictional data</span><a class="m09-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header><main class="m09-main">
    <section class="m09-hero" aria-labelledby="m09-title"><div><p class="m09-kicker">Module 09 · Week 5 · operations &amp; response</p><h1 id="m09-title">Incident Response</h1><p>Correlate a limited incident slice, decide what it proves, and build a containment-to-recovery plan that matches the verified scope.</p><a class="m09-primary" href="#m09-field-guide"><i class="ri-book-open-line" aria-hidden="true"></i> Review the response guide</a></div><dl aria-label="Saved lab progress"><div><dt>Evidence sources</dt><dd>3</dd></div><div><dt>Target time</dt><dd>60 min</dd></div><div><dt>Lab status</dt><dd id="m09-status">${moduleNineState.completed ? 'Complete' : moduleNineState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>
    <section class="m09-objective" aria-labelledby="m09-objective-title"><div><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m09-kicker">Measurable objective</p><h2 id="m09-objective-title">Correlate six incident records across three sources, bound the confirmed endpoint and identity scope, and produce a proportional containment, eradication, recovery, and escalation handoff scoring at least 80/100.</h2></div></section>
    <section class="m09-section" id="m09-field-guide" aria-labelledby="m09-guide-title"><div class="m09-section-heading"><span>1</span><div><p class="m09-kicker">Response guide</p><h2 id="m09-guide-title">Act on evidence, not urgency alone</h2></div></div>${moduleNineConcepts()}</section>
    <section class="m09-section m09-lab-section" aria-labelledby="m09-lab-title"><div class="m09-section-heading"><span>2</span><div><p class="m09-kicker">Miniature response desk · no full range navigation</p><h2 id="m09-lab-title">Active incident IR-09-44</h2></div></div><div class="m09-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Your role: Tier 1 incident responder</strong><p>Investigate the three sources in any order. You may initiate playbook-approved containment and recommend later phases; the incident lead and system owners retain execution authority.</p></div></div><div id="m09-lab-dynamic">${moduleNineDynamic()}</div></section>
  </main></div>`;
}

function moduleNineSelectionScore(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((id) => chosen.has(id)).length;
  const extras = selected.filter((id) => !expected.includes(id)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}

function moduleNineScore() {
  const sources = moduleNineState.reviewedSources.filter((key) => MODULE_NINE_SOURCES[key]).length === 3 ? 6 : moduleNineState.reviewedSources.filter((key) => MODULE_NINE_SOURCES[key]).length * 2;
  const evidence = moduleNineSelectionScore(moduleNineState.selectedEvidence, MODULE_NINE_EXPECTED_EVIDENCE, 19);
  const observation = sources + evidence;
  const classification = moduleNineState.classification === 'endpoint-identity-compromise' ? 9 : 0;
  const scope = moduleNineState.scope === 'one-pair' ? 8 : 0;
  const severity = moduleNineState.severity === 'high' ? 8 : 0;
  const analysis = classification + scope + severity;
  const contain = moduleNineSelectionScore(moduleNineState.responsePlan.contain, ['isolate-lt73', 'revoke-disable-acct73', 'block-indicator'], 11);
  const eradicate = moduleNineSelectionScore(moduleNineState.responsePlan.eradicate, ['remove-persistence', 'reset-credentials'], 7);
  const recover = moduleNineSelectionScore(moduleNineState.responsePlan.recover, ['validate-reconnect', 'monitored-reenable'], 9);
  const escalation = moduleNineState.escalation === 'ir-owners' ? 3 : 0;
  const decision = contain + eradicate + recover + escalation;
  const note = moduleNineState.notes.trim().toLowerCase();
  const noteLength = note.length >= 140 ? 4 : 0;
  const noteConclusion = /(confirm|compromis|incident|high)/.test(note) ? 4 : 0;
  const noteEntities = /lt-73/.test(note) && /acct-73/.test(note) ? 4 : 0;
  const noteEvidence = /(script|startup|task|persist|token|203\.0\.113\.146)/.test(note) ? 4 : 0;
  const noteContain = /(isolat|revoke|disable|contain|block)/.test(note) ? 2 : 0;
  const noteRecover = /(validat|monitor|reconnect|re-enable|reenable|recover)/.test(note) ? 2 : 0;
  const communication = noteLength + noteConclusion + noteEntities + noteEvidence + noteContain + noteRecover;
  const score = observation + analysis + decision + communication;
  return {
    score,
    breakdown: { observation, sources, evidence, analysis, classification, scope, severity, decision, contain, eradicate, recover, escalation, communication },
    feedback: [
      evidence === 19 && sources === 6 ? 'Observation: All three sources reviewed; the six selected records establish execution, persistence, correlation, owner denial, and bounded scope.' : `Observation: ${observation}/25. Review all sources and keep IR-901, IR-902, IR-906, IR-908, IR-909, and IR-911; known-good and impact-limit context are not incident proof.`,
      analysis === 25 ? 'Analysis: Correctly classified as a high-severity endpoint-and-identity compromise limited to LT-73 and acct-73.' : `Analysis: ${analysis}/25. Connect the endpoint and identity activity, state one confirmed device-account pair, and avoid critical enterprise-wide claims.`,
      decision === 30 ? 'Decision: The plan proportionately contains the pair, removes the foothold and credential risk, validates recovery, and escalates to authorized owners.' : `Decision: ${decision}/30. Choose the three scoped containment actions, two eradication actions, two conditional recovery actions, and the incident-lead escalation.`,
      communication === 20 ? 'Communication: The handoff is complete, evidence-based, scoped, and operationally actionable.' : `Communication: ${communication}/20. In 140+ characters, name the incident state, LT-73 and acct-73, evidence, containment, and a monitored recovery condition.`,
    ],
  };
}

function moduleNineRender(focusId) {
  const root = document.getElementById('m09-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleNineDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleNineToggleValue(list, value, checked) {
  return checked ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function wireModuleNineLab() {
  const root = document.getElementById('m09-lab-dynamic');
  if (!root || !moduleNineState) return;
  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-m09-source]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const keys = Object.keys(MODULE_NINE_SOURCES);
    const current = Math.max(0, keys.indexOf(tab.dataset.m09Source));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
    moduleNineState.activeSource = keys[next];
    moduleNineState.detailEvidence = '';
    moduleNineSave();
    moduleNineRender(`m09-tab-${keys[next]}`);
  });
  root.addEventListener('click', (event) => {
    const sourceButton = event.target.closest('[data-m09-source]');
    if (sourceButton) {
      moduleNineState.activeSource = sourceButton.dataset.m09Source;
      moduleNineState.detailEvidence = '';
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const reviewButton = event.target.closest('[data-m09-review]');
    if (reviewButton) {
      const key = reviewButton.dataset.m09Review;
      if (!moduleNineState.reviewedSources.includes(key)) moduleNineState.reviewedSources.push(key);
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const detailButton = event.target.closest('[data-m09-detail]');
    if (detailButton) {
      moduleNineState.detailEvidence = moduleNineState.detailEvidence === detailButton.dataset.m09Detail ? '' : detailButton.dataset.m09Detail;
      moduleNineSave();
      moduleNineRender(moduleNineState.detailEvidence ? 'm09-evidence-detail' : 'm09-source-title');
      return;
    }
    if (event.target.closest('[data-m09-detail-close]')) {
      moduleNineState.detailEvidence = '';
      moduleNineSave();
      moduleNineRender('m09-source-title');
      return;
    }
    const remove = event.target.closest('[data-m09-remove-evidence]');
    if (remove) {
      moduleNineState.selectedEvidence = moduleNineState.selectedEvidence.filter((id) => id !== remove.dataset.m09RemoveEvidence);
      moduleNineSave();
      moduleNineRender('m09-tray-title');
      return;
    }
    if (event.target.closest('[data-m09-reset]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset only this Module 09 lab? Your evidence, plan, notes, and score will be cleared.')) return;
      moduleNineState = LabRuntime.reset(MODULE_NINE_LAB_ID, moduleNineUser, moduleNineFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', MODULE_NINE_CATALOG_LAB_KEY, false);
      moduleNineRender('m09-case-title');
      const status = document.getElementById('m09-status');
      if (status) status.textContent = 'Not started';
    }
  });

  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m09-hint]');
    if (!hint || !hint.open) return;
    moduleNineState.hintsOpened = [...new Set([...moduleNineState.hintsOpened, hint.dataset.m09Hint])];
    moduleNineSave();
  }, true);

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleNineState.notes = event.target.value;
    const count = root.querySelector('#m09-note-count');
    if (count) count.textContent = `${event.target.value.length}/1000`;
    moduleNineSave();
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'evidence') {
      moduleNineState.selectedEvidence = moduleNineToggleValue(moduleNineState.selectedEvidence, input.value, input.checked);
      moduleNineState.validationError = '';
      moduleNineSave();
      const count = root.querySelector('#m09-evidence-count');
      if (count) count.textContent = String(moduleNineState.selectedEvidence.length);
      return;
    }
    if (['classification', 'scope', 'severity', 'escalation'].includes(input.name)) {
      moduleNineState[input.name] = input.value;
      moduleNineState.validationError = '';
      moduleNineSave();
      return;
    }
    const responseMatch = input.name.match(/^response-(contain|eradicate|recover)$/);
    if (responseMatch) {
      const phase = responseMatch[1];
      moduleNineState.responsePlan[phase] = moduleNineToggleValue(moduleNineState.responsePlan[phase], input.value, input.checked);
      moduleNineState.validationError = '';
      moduleNineSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm09-form') return;
    event.preventDefault();
    moduleNineState.notes = event.target.elements.notes.value;
    const missing = [];
    if (moduleNineState.reviewedSources.length < 3) missing.push('review all three evidence sources');
    if (moduleNineState.selectedEvidence.length < 4) missing.push('select at least four evidence records');
    if (!moduleNineState.classification || !moduleNineState.scope || !moduleNineState.severity) missing.push('complete the incident analysis');
    if (Object.values(moduleNineState.responsePlan).some((items) => !items.length)) missing.push('choose at least one action in every response phase');
    if (!moduleNineState.escalation) missing.push('select an escalation path');
    if (moduleNineState.notes.trim().length < 140) missing.push('write a 140-character handoff');
    if (missing.length) {
      moduleNineState.validationError = `Please ${missing.join('; ')}. Your current work remains saved.`;
      moduleNineSave();
      moduleNineRender('m09-feedback');
      return;
    }
    const result = moduleNineScore();
    moduleNineState.attempts += 1;
    moduleNineState.score = result.score;
    moduleNineState.bestScore = Math.max(moduleNineState.bestScore || 0, result.score);
    moduleNineState.breakdown = result.breakdown;
    moduleNineState.feedback = result.feedback;
    moduleNineState.validationError = '';
    moduleNineState.lastSubmittedAt = new Date().toISOString();
    if (result.score >= MODULE_NINE_PASSING_SCORE) {
      moduleNineState.completed = true;
      if (!moduleNineState.flags.includes(MODULE_NINE_FLAG)) moduleNineState.flags.push(MODULE_NINE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleNineUser, 'soc-analyst', 'soc-09', MODULE_NINE_CATALOG_LAB_KEY);
    }
    moduleNineSave();
    moduleNineRender('m09-feedback');
    const status = document.getElementById('m09-status');
    if (status) status.textContent = moduleNineState.completed ? 'Complete' : 'In progress';
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 9, moduleKey: 'soc-09', view: viewModuleNine, wire: wireModuleNineLab });

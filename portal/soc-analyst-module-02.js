/* Module 02 — isolated identity and network foundations lab.
 * All people, addresses, telemetry, and actions are fictional simulations.
 */

const MODULE_TWO_LAB_ID = 'm02-trust-path-review-v1';
const MODULE_TWO_FLAG = 'M02-TRUST-PATH-VALIDATED';
const MODULE_TWO_CATALOG_LAB_KEY = 'lab-identity-investigation';

const MODULE_TWO_DEFAULT_STATE = {
  activeStation: 'signins',
  reviewedStations: [],
  selectedEvidence: [],
  observation: '',
  analysis: '',
  decision: '',
  notes: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  resetArmed: false,
};

const MODULE_TWO_FOUNDATIONS = [
  { icon: 'ri-route-line', title: 'Network paths', summary: 'A connection has a source, destination, route, protocol, and outcome.', detail: 'Analysts compare the observed path with expected business routes. An unfamiliar address alone is weak evidence; the device, route, authentication result, and role of the destination add meaning.' },
  { icon: 'ri-user-key-line', title: 'Identity and accounts', summary: 'An identity represents a person, service, device, or workload.', detail: 'Human and service identities behave differently. A scheduled certificate-based service sign-in may be normal while an interactive human sign-in at that hour may deserve review.' },
  { icon: 'ri-login-box-line', title: 'Authentication', summary: 'Authentication answers: who or what proved its identity?', detail: 'Passwords, certificates, security keys, and one-time factors are authentication methods. A success means a control accepted the proof; it does not prove the activity was authorized by the owner.' },
  { icon: 'ri-key-2-line', title: 'Authorization', summary: 'Authorization answers: what is the authenticated identity allowed to do?', detail: 'Roles and permissions govern access after sign-in. Analysts distinguish a sign-in event from a later access change and then assess whether the combination increases risk.' },
  { icon: 'ri-shield-keyhole-line', title: 'MFA', summary: 'Multiple independent factors reduce reliance on a password alone.', detail: 'A denied prompt can be a user mistake, but repeated denials followed by a password-only success from an unmanaged device form a stronger suspicious pattern.' },
  { icon: 'ri-team-line', title: 'RBAC and least privilege', summary: 'Roles group permissions around job needs; least privilege limits excess access.', detail: 'A role assignment should have an approved purpose, appropriate scope, and accountable requester. High-impact access without a matching request deserves escalation.' },
  { icon: 'ri-fingerprint-line', title: 'PKI', summary: 'Certificates bind cryptographic proof to an identity or system.', detail: 'Certificate use is context, not an automatic verdict. Validate the subject, issuer, intended use, expiry, and whether the activity matches the workload schedule.' },
  { icon: 'ri-focus-3-line', title: 'Zero Trust reasoning', summary: 'Evaluate each request using identity, device, location, resource, and current risk.', detail: 'Network location is only one signal. A sound decision combines several independent facts and applies a proportionate control to the affected scope.' },
];

const MODULE_TWO_LAB = {
  title: 'Trust-path review: unexpected privileged access',
  minutes: 180,
  passingScore: 70,
  scenario: 'A routine access review found several unusual-looking records. Determine which pattern requires escalation without treating every unfamiliar event as malicious.',
  stations: [
    { id: 'signins', label: 'Sign-ins', icon: 'ri-login-circle-line', instruction: 'Compare identity type, method, device state, and outcome. Select records that materially support your conclusion.' },
    { id: 'network', label: 'Network context', icon: 'ri-router-line', instruction: 'Interpret the route and zone together. A documentation-range address is used so this simulation cannot point at a real system.' },
    { id: 'access', label: 'Access changes', icon: 'ri-admin-line', instruction: 'Look for role changes, approval references, scope, and whether the change fits the identity.' },
    { id: 'guardrail', label: 'Decision guardrail', icon: 'ri-shield-check-line', instruction: 'Use the policy card to choose a proportionate next step. This lab records a recommendation; it performs no real response action.' },
  ],
  signins: [
    { id: 'evt-317-mfa', identity: 'IDN-317', time: '09:12', method: 'Password + MFA prompts', context: 'Two prompts denied · unmanaged browser', outcome: 'Denied', risk: true },
    { id: 'evt-317-success', identity: 'IDN-317', time: '09:15', method: 'Password only · legacy exception', context: 'Unmanaged browser · no registered session', outcome: 'Success', risk: true },
    { id: 'evt-204-vpn', identity: 'IDN-204', time: '09:18', method: 'Password + security key', context: 'Managed laptop · approved VPN egress', outcome: 'Success', risk: false },
    { id: 'evt-svc-cert', identity: 'SVC-082', time: '09:20', method: 'Workload certificate', context: 'Internal backup segment · scheduled task', outcome: 'Success', risk: false },
    { id: 'evt-451-fail', identity: 'IDN-451', time: '09:24', method: 'Password', context: 'Managed laptop · usual office route', outcome: 'One failure, then success with MFA', risk: false },
  ],
  network: [
    { id: 'net-317-external', identity: 'IDN-317', source: '198.51.100.44', route: 'External → identity gateway', zone: 'No corporate VPN or managed-device association', risk: true },
    { id: 'net-204-vpn', identity: 'IDN-204', source: '203.0.113.18', route: 'Approved VPN → collaboration service', zone: 'Known egress · compliant device', risk: false },
    { id: 'net-svc-internal', identity: 'SVC-082', source: '10.24.8.12', route: 'Backup segment → archive service', zone: 'Expected internal service path', risk: false },
  ],
  access: [
    { id: 'role-317-admin', identity: 'IDN-317', time: '09:22', change: 'Reports Reader → Network Configuration Operator', approval: 'No matching request or owner approval', scope: 'Production network policy', risk: true },
    { id: 'role-204-reader', identity: 'IDN-204', time: '09:28', change: 'Added Collaboration Reports Reader', approval: 'REQ-4408 · manager approved', scope: 'Reporting only', risk: false },
    { id: 'role-svc-renew', identity: 'SVC-082', time: '02:00', change: 'Workload certificate renewed', approval: 'CHG-7311 · scheduled maintenance', scope: 'Backup service', risk: false },
  ],
  correctEvidence: ['evt-317-mfa', 'evt-317-success', 'net-317-external', 'role-317-admin'],
  observationOptions: [
    { id: 'idn-317', text: 'IDN-317 — correlate the sign-in sequence with the later privileged role change' },
    { id: 'idn-204', text: 'IDN-204 — the public VPN egress address is unfamiliar' },
    { id: 'svc-082', text: 'SVC-082 — certificate authentication is always suspicious' },
    { id: 'idn-451', text: 'IDN-451 — any failed password means compromise' },
  ],
  analysisOptions: [
    { id: 'likely-compromise', text: 'Likely compromised identity with unauthorized privilege expansion', help: 'Several independent identity, device, route, and authorization facts agree.' },
    { id: 'benign-travel', text: 'Benign travel through an approved corporate route', help: 'This would require known VPN and device context that the target identity lacks.' },
    { id: 'network-outage', text: 'Network availability problem', help: 'The records show successful access and a role change, not a service interruption.' },
    { id: 'certificate-failure', text: 'Expired service certificate', help: 'The service identity succeeded on its expected scheduled path.' },
  ],
  decisionOptions: [
    { id: 'escalate-protect', text: 'Escalate IDN-317, preserve the selected records, and request the approved identity-protection and role-review procedure', help: 'This limits the recommendation to the affected identity and privileged change.' },
    { id: 'disable-all', text: 'Disable every identity shown in the review', help: 'The evidence does not support broad disruption.' },
    { id: 'block-documentation-range', text: 'Block all documentation-range addresses at the perimeter', help: 'The addresses are synthetic labels here, and IP-only blocking does not resolve the identity risk.' },
    { id: 'close-as-noise', text: 'Close the review because the sign-in eventually succeeded', help: 'A successful sign-in can increase concern when surrounding context is unauthorized.' },
  ],
};

let moduleTwoState = null;
let moduleTwoUser = null;

function moduleTwoLoad(user) {
  moduleTwoUser = user;
  moduleTwoState = LabRuntime.load(MODULE_TWO_LAB_ID, user, MODULE_TWO_DEFAULT_STATE);
  if (!Array.isArray(moduleTwoState.reviewedStations)) moduleTwoState.reviewedStations = [];
  if (!Array.isArray(moduleTwoState.selectedEvidence)) moduleTwoState.selectedEvidence = [];
  if (!Array.isArray(moduleTwoState.feedback)) moduleTwoState.feedback = [];
  if (!Array.isArray(moduleTwoState.flags)) moduleTwoState.flags = [];
  if (typeof moduleTwoState.notes !== 'string') moduleTwoState.notes = '';
  if (!MODULE_TWO_LAB.stations.some((station) => station.id === moduleTwoState.activeStation)) moduleTwoState.activeStation = 'signins';
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-02');
  return moduleTwoState;
}

function moduleTwoSave() {
  if (moduleTwoUser && moduleTwoState) LabRuntime.save(MODULE_TWO_LAB_ID, moduleTwoUser, moduleTwoState);
}

function moduleTwoFoundations() {
  return `<div class="m02-foundation-grid">
    ${MODULE_TWO_FOUNDATIONS.map((item, index) => `<details class="m02-foundation" ${index === 0 ? 'open' : ''}>
      <summary><span class="m02-foundation-icon"><i class="${esc(item.icon)}" aria-hidden="true"></i></span><span><strong>${esc(item.title)}</strong><small>${esc(item.summary)}</small></span><i class="ri-arrow-down-s-line m02-chevron" aria-hidden="true"></i></summary>
      <p>${esc(item.detail)}</p>
    </details>`).join('')}
  </div>`;
}

function moduleTwoTrustModel() {
  const items = [
    { number: '01', title: 'Identify', text: 'Is this a human, service, device, or workload identity?' },
    { number: '02', title: 'Authenticate', text: 'Which proof was accepted, denied, or bypassed?' },
    { number: '03', title: 'Contextualize', text: 'Do the device, network path, time, and resource match expectations?' },
    { number: '04', title: 'Authorize', text: 'Was the access or role appropriate, approved, and least-privileged?' },
    { number: '05', title: 'Decide', text: 'What conclusion and proportionate next step does the combined evidence support?' },
  ];
  return `<ol class="m02-trust-model" aria-label="Five-step trust decision model">
    ${items.map((item) => `<li><span>${item.number}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></li>`).join('')}
  </ol>`;
}

function moduleTwoEvidenceRecord(record, fields) {
  const selected = moduleTwoState.selectedEvidence.includes(record.id);
  return `<label class="m02-record ${record.risk ? 'm02-record-review' : ''}">
    <input type="checkbox" value="${esc(record.id)}" data-m02-evidence ${selected ? 'checked' : ''} />
    <span class="m02-record-check" aria-hidden="true"><i class="ri-check-line"></i></span>
    <span class="m02-record-body">
      <span class="m02-record-heading"><strong>${esc(record.identity)}</strong><code>${esc(record.id)}</code></span>
      <span class="m02-record-fields">
        ${fields.map(([label, key]) => `<span><small>${esc(label)}</small><b>${esc(record[key])}</b></span>`).join('')}
      </span>
    </span>
  </label>`;
}

function moduleTwoStationBody(stationId) {
  if (stationId === 'signins') {
    return `<div class="m02-record-list" aria-label="Synthetic sign-in records">
      ${MODULE_TWO_LAB.signins.map((record) => moduleTwoEvidenceRecord(record, [['Time', 'time'], ['Method', 'method'], ['Context', 'context'], ['Outcome', 'outcome']])).join('')}
    </div>
    <details class="m02-hint"><summary>Need a sign-in hint?</summary><p>Look for a sequence, not a single unusual field. Ask whether the same identity moved from failed stronger authentication to a weaker successful path.</p></details>`;
  }
  if (stationId === 'network') {
    return `<div class="m02-record-list" aria-label="Synthetic network context records">
      ${MODULE_TWO_LAB.network.map((record) => moduleTwoEvidenceRecord(record, [['Source', 'source'], ['Observed path', 'route'], ['Trust context', 'zone']])).join('')}
    </div>
    <div class="m02-address-note"><i class="ri-information-line" aria-hidden="true"></i><p><strong>Safe synthetic addresses:</strong> 198.51.100.0/24 and 203.0.113.0/24 are documentation ranges. They identify fictional external paths in this exercise, not real infrastructure.</p></div>`;
  }
  if (stationId === 'access') {
    return `<div class="m02-record-list" aria-label="Synthetic access-change records">
      ${MODULE_TWO_LAB.access.map((record) => moduleTwoEvidenceRecord(record, [['Time', 'time'], ['Change', 'change'], ['Approval', 'approval'], ['Scope', 'scope']])).join('')}
    </div>
    <details class="m02-hint"><summary>Need an authorization hint?</summary><p>A role change is not suspicious merely because it is powerful. Compare its approval trail, scope, and timing with the sign-in evidence for the same identity.</p></details>`;
  }
  return `<div class="m02-guardrail-grid">
    <article><i class="ri-file-shield-2-line" aria-hidden="true"></i><div><strong>Preserve before changing</strong><p>Record the relevant event identifiers, identity, time, route, authentication method, and access change before a responder alters state.</p></div></article>
    <article><i class="ri-focus-2-line" aria-hidden="true"></i><div><strong>Match action to scope</strong><p>Recommend protection for the affected identity and review the unapproved role. Do not disable unrelated accounts or block broad networks.</p></div></article>
    <article><i class="ri-user-follow-line" aria-hidden="true"></i><div><strong>Use approved authority</strong><p>A foundation analyst documents and escalates. The authorized responder validates ownership and performs the identity-protection procedure.</p></div></article>
  </div>
  <div class="m02-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p>This isolated lab has no live connection and no response controls. Your decision is a written recommendation only.</p></div>`;
}

function moduleTwoSelectionSummary() {
  const allRecords = [...MODULE_TWO_LAB.signins, ...MODULE_TWO_LAB.network, ...MODULE_TWO_LAB.access];
  const chosen = allRecords.filter((record) => moduleTwoState.selectedEvidence.includes(record.id));
  return `<div class="m02-selection" aria-live="polite">
    <span><strong id="m02-selection-count">${chosen.length}</strong> record${chosen.length === 1 ? '' : 's'} selected as evidence</span>
    <span id="m02-selection-summary">${chosen.length ? chosen.map((item) => esc(item.id)).join(' · ') : 'Select only records that materially support your conclusion.'}</span>
  </div>`;
}

function moduleTwoOptions(name, options) {
  return `<div class="m02-options">
    ${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleTwoState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.text)}</strong>${option.help ? `<small>${esc(option.help)}</small>` : ''}</span></label>`).join('')}
  </div>`;
}

function moduleTwoScorePanel() {
  if (moduleTwoState.validationError) {
    return `<div class="m02-validation" id="m02-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the artifact</strong><p>${esc(moduleTwoState.validationError)}</p></div></div>`;
  }
  if (!moduleTwoState.attempts || !moduleTwoState.breakdown) {
    return `<div class="m02-score-empty" id="m02-feedback" role="status">Your evidence and draft save automatically. Submit when the three decisions are selected and the handoff note is at least 70 characters.</div>`;
  }
  const passed = moduleTwoState.score >= MODULE_TWO_LAB.passingScore;
  const b = moduleTwoState.breakdown;
  return `<section class="m02-score ${passed ? 'm02-score-pass' : 'm02-score-remediate'}" id="m02-feedback" tabindex="-1" aria-labelledby="m02-score-title" aria-live="polite">
    <div class="m02-score-heading"><div><p class="m02-kicker">Attempt ${moduleTwoState.attempts} · best ${moduleTwoState.bestScore}/100</p><h3 id="m02-score-title">${moduleTwoState.score}/100 — ${passed ? 'Trust path validated' : 'Use the remediation and retry'}</h3></div><span>${moduleTwoState.score}</span></div>
    <div class="m02-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/20</strong><span>Observation</span></div>
      <div><strong>${b.evidence}/15</strong><span>Evidence</span></div>
      <div><strong>${b.analysis}/25</strong><span>Analysis</span></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span></div>
      <div><strong>${b.communication}/15</strong><span>Communication</span></div>
    </div>
    <ul class="m02-feedback-list">${moduleTwoState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m02-expert"><strong>Expert reasoning</strong><p>IDN-317 presents a connected chain: stronger authentication was denied, a weaker password-only exception then succeeded from an unmanaged external path, and a production-impacting role appeared without an approval record. The other records have expected device, route, certificate, MFA, or change-reference context. Preserve the four linked records and escalate only IDN-317 for authorized protection and role review.</p></div>
  </section>`;
}

function moduleTwoWorksheet() {
  return `<form class="m02-worksheet" id="m02-form" novalidate>
    <div class="m02-panel-heading"><div><p class="m02-kicker">Scored artifact</p><h3 id="m02-worksheet-title" tabindex="-1">Document the trust-path decision</h3></div><span>Passing score: ${MODULE_TWO_LAB.passingScore}/100</span></div>
    <fieldset class="m02-fieldset"><legend><span>1</span> Observation — which identity requires escalation?</legend><p class="m02-help">Correlate the identity across all three telemetry sets.</p>${moduleTwoOptions('observation', MODULE_TWO_LAB.observationOptions)}</fieldset>
    <fieldset class="m02-fieldset"><legend><span>2</span> Analysis — what best explains the linked pattern?</legend><p class="m02-help">Use the combined evidence; do not classify from location or a failed password alone.</p>${moduleTwoOptions('analysis', MODULE_TWO_LAB.analysisOptions)}</fieldset>
    <fieldset class="m02-fieldset"><legend><span>3</span> Decision — what is the proportionate next step?</legend><p class="m02-help">Your role is to preserve, document, and escalate—not perform an unapproved disruptive action.</p>${moduleTwoOptions('decision', MODULE_TWO_LAB.decisionOptions)}</fieldset>
    <div class="m02-fieldset">
      <label class="m02-note-label" for="m02-notes"><span>4</span><strong>Communication — write the handoff note</strong></label>
      <p class="m02-help" id="m02-note-help">State the identity, at least two linked observations, why the role change matters, and the recommended next step.</p>
      <button type="button" class="m02-note-starter" data-m02-note-starter><i class="ri-quill-pen-line" aria-hidden="true"></i> Insert a structure-only starter</button>
      <textarea class="m02-notes" id="m02-notes" name="notes" rows="5" maxlength="800" aria-describedby="m02-note-help m02-note-count" placeholder="Identity… Observed… Access impact… Recommend…">${esc(moduleTwoState.notes)}</textarea>
      <p class="m02-note-count" id="m02-note-count"><span>${moduleTwoState.notes.length}</span>/800 characters</p>
    </div>
    <div class="m02-actions"><button class="m02-submit" type="submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my analysis</button><button class="m02-reset" type="button" data-m02-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>
    ${moduleTwoState.resetArmed ? `<div class="m02-reset-confirm" id="m02-reset-confirm" tabindex="-1" role="alert"><p><strong>Reset Module 02?</strong> Attempts, selections, notes, score, and this lab's flag will be cleared. Course progress and other labs are untouched.</p><div><button type="button" data-m02-reset-confirm>Yes, reset this lab</button><button type="button" data-m02-reset-cancel>Cancel</button></div></div>` : ''}
    ${moduleTwoScorePanel()}
  </form>`;
}

function moduleTwoLabDynamic() {
  const station = MODULE_TWO_LAB.stations.find((item) => item.id === moduleTwoState.activeStation) || MODULE_TWO_LAB.stations[0];
  const reviewed = new Set(moduleTwoState.reviewedStations);
  const allReviewed = MODULE_TWO_LAB.stations.every((item) => reviewed.has(item.id));
  const stationIndex = MODULE_TWO_LAB.stations.findIndex((item) => item.id === station.id);
  const nextStation = MODULE_TWO_LAB.stations[stationIndex + 1];
  return `<div class="m02-lab-console">
    <div class="m02-console-bar"><span><i class="ri-shield-user-line" aria-hidden="true"></i> Identity trust review</span><span>CASE-FND-204 · synthetic</span></div>
    <div class="m02-case-brief"><div><p class="m02-kicker">Your role · foundation analyst</p><h3>${esc(MODULE_TWO_LAB.title)}</h3><p>${esc(MODULE_TWO_LAB.scenario)}</p></div><dl><div><dt>Scope</dt><dd>4 identities</dd></div><div><dt>Task</dt><dd>Interpret, then escalate</dd></div></dl></div>
  </div>
  <section class="m02-investigation" aria-labelledby="m02-investigation-title">
    <div class="m02-panel-heading"><div><p class="m02-kicker">Guided investigation</p><h3 id="m02-investigation-title">Review four evidence stations</h3></div><span>${reviewed.size}/${MODULE_TWO_LAB.stations.length} reviewed</span></div>
    <div class="m02-stations" role="tablist" aria-label="Evidence stations">
      ${MODULE_TWO_LAB.stations.map((item, index) => `<button type="button" id="m02-tab-${esc(item.id)}" role="tab" tabindex="${item.id === station.id ? '0' : '-1'}" aria-selected="${item.id === station.id}" aria-controls="m02-station-panel" class="${item.id === station.id ? 'm02-station-active' : ''}" data-m02-station="${esc(item.id)}"><span>${index + 1}</span><i class="${esc(item.icon)}" aria-hidden="true"></i><b>${esc(item.label)}</b>${reviewed.has(item.id) ? '<i class="ri-checkbox-circle-fill m02-station-done" aria-label="Reviewed"></i>' : ''}</button>`).join('')}
    </div>
    ${moduleTwoSelectionSummary()}
    <div class="m02-station-panel" id="m02-station-panel" role="tabpanel" aria-labelledby="m02-tab-${esc(station.id)}" tabindex="-1">
      <div class="m02-station-heading"><div><p class="m02-kicker">Station ${stationIndex + 1}</p><h4>${esc(station.label)}</h4></div><p>${esc(station.instruction)}</p></div>
      ${moduleTwoStationBody(station.id)}
      <button type="button" class="m02-review-station" data-m02-review-station="${esc(station.id)}"><i class="${reviewed.has(station.id) ? 'ri-checkbox-circle-fill' : 'ri-arrow-right-circle-line'}" aria-hidden="true"></i>${reviewed.has(station.id) ? 'Station reviewed' : nextStation ? `Mark reviewed and continue to ${esc(nextStation.label)}` : 'Mark decision guardrail reviewed'}</button>
    </div>
  </section>
  ${allReviewed ? moduleTwoWorksheet() : `<section class="m02-locked" aria-label="Scored artifact locked"><i class="ri-lock-line" aria-hidden="true"></i><div><strong>Scored artifact locked</strong><p>Mark all four evidence stations reviewed. Your selected records remain saved as you move between stations.</p></div></section>`}`;
}

function viewModuleTwo(user, program) {
  moduleTwoLoad(user);
  const module = program.modules['soc-02'];
  return `<div class="m02-shell">
    <header class="m02-topbar"><a class="m02-brand" href="#/program/${esc(program.slug)}" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m02-top-actions"><span class="m02-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="m02-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="m02-main">
      <section class="m02-hero" aria-labelledby="m02-title"><div><p class="m02-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1 foundations</p><h1 id="m02-title">${esc(module.title)}</h1><p class="m02-lede">Build a practical trust model, then correlate identity, authentication, network, and role-change facts without confusing unusual activity with malicious activity.</p><a class="m02-hero-action" href="#m02-foundations"><i class="ri-compass-3-line" aria-hidden="true"></i> Start the foundations</a></div><dl class="m02-progress" aria-label="Saved module progress"><div><dt>Foundation topics</dt><dd>${module.lessons}</dd></div><div><dt>Guided lab</dt><dd>${formatInstructionalMinutes(MODULE_TWO_LAB.minutes)}</dd></div><div><dt>Lab status</dt><dd id="m02-status">${moduleTwoState.completed ? 'Complete' : moduleTwoState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <section class="m02-objective" aria-labelledby="m02-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="m02-kicker">One measurable objective</p><h2 id="m02-objective-title">Correlate authentication, network context, and authorization changes to identify one risky identity and document a proportionate escalation.</h2></div></section>

      <section class="m02-section" id="m02-foundations" aria-labelledby="m02-foundations-title"><div class="m02-section-heading"><span>1</span><div><p class="m02-kicker">Eight connected concepts</p><h2 id="m02-foundations-title">Read a trust decision from end to end</h2></div></div><p class="m02-instruction">Open each concept for the analyst interpretation. The lab tests how the ideas connect; it does not test product menus or memorized definitions.</p>${moduleTwoFoundations()}</section>

      <section class="m02-section" aria-labelledby="m02-model-title"><div class="m02-section-heading"><span>2</span><div><p class="m02-kicker">Reusable reasoning pattern</p><h2 id="m02-model-title">The five-step trust model</h2></div></div>${moduleTwoTrustModel()}<div class="m02-principle"><i class="ri-scales-3-line" aria-hidden="true"></i><p><strong>Analyst principle:</strong> “Outside the network” is not a verdict, and “inside the network” is not proof of trust. Combine identity, authentication, device, route, resource, and authorization evidence.</p></div></section>

      <section class="m02-section m02-lab-section" id="m02-guided-lab" aria-labelledby="m02-lab-title"><div class="m02-section-heading"><span>3</span><div><p class="m02-kicker">Guided · assisted investigation · ${formatInstructionalMinutes(MODULE_TWO_LAB.minutes)} instructional time</p><h2 id="m02-lab-title">Suspicious authentication investigation</h2></div></div><div id="m02-lab-dynamic">${moduleTwoLabDynamic()}</div></section>
    </main>
  </div>`;
}

function moduleTwoScore() {
  const observation = moduleTwoState.observation === 'idn-317' ? 20 : 0;
  const analysis = moduleTwoState.analysis === 'likely-compromise' ? 25 : 0;
  const decision = moduleTwoState.decision === 'escalate-protect' ? 25 : 0;
  const selected = new Set(moduleTwoState.selectedEvidence);
  const correctSelected = MODULE_TWO_LAB.correctEvidence.filter((id) => selected.has(id)).length;
  const distractors = moduleTwoState.selectedEvidence.filter((id) => !MODULE_TWO_LAB.correctEvidence.includes(id)).length;
  const evidence = (correctSelected * 3) + (correctSelected === MODULE_TWO_LAB.correctEvidence.length && distractors === 0 ? 3 : 0);
  const note = moduleTwoState.notes.trim().toLowerCase();
  const communicationLength = note.length >= 70 ? 5 : 0;
  const communicationFacts = /(idn-317)/.test(note)
    && /(mfa|password|unmanaged|external)/.test(note)
    && /(role|privilege|network configuration|operator|approval)/.test(note)
    && /(escalat|protect|preserv|review)/.test(note)
    && !/[\[\]]/.test(note) ? 10 : 0;
  const communication = communicationLength + communicationFacts;
  return {
    score: observation + evidence + analysis + decision + communication,
    breakdown: { observation, evidence, analysis, decision, communication },
    feedback: [
      observation ? 'Observation: Correct. IDN-317 is the only identity linked to both the suspicious sign-in sequence and an unapproved privileged change.' : 'Observation: Correlate records by identity. IDN-317 appears in the MFA, weak-success, external-route, and role-change records.',
      evidence === 15 ? 'Evidence: Precise. You selected all four material records and left the plausible benign distractors unselected.' : `Evidence: You selected ${correctSelected}/4 material records and ${distractors} distractor${distractors === 1 ? '' : 's'}. Select the two IDN-317 sign-ins, its external route, and its unapproved role change.`,
      analysis ? 'Analysis: Correct. Independent authentication, device, route, and authorization facts support likely compromise and privilege expansion.' : 'Analysis: The combined pattern best supports likely identity compromise with unauthorized privilege expansion.',
      decision ? 'Decision: Correct. Preserve and escalate the affected identity for an authorized, scoped response.' : 'Decision: Limit the recommendation to IDN-317 and its role. Preserve evidence and use the approved identity-protection path.',
      communication === 15 ? 'Communication: Clear. The note identifies the entity, linked observations, access impact, and next step.' : 'Communication: Use at least 70 characters and name IDN-317, authentication or network context, the privileged role or missing approval, and the escalation or protection recommendation.',
    ],
  };
}

function moduleTwoRenderDynamic(focusId) {
  const root = document.getElementById('m02-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleTwoLabDynamic();
  const status = document.getElementById('m02-status');
  if (status) status.textContent = moduleTwoState.completed ? 'Complete' : moduleTwoState.attempts || moduleTwoState.reviewedStations.length ? 'In progress' : 'Not started';
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleTwoUpdateSelectionSummary() {
  const allRecords = [...MODULE_TWO_LAB.signins, ...MODULE_TWO_LAB.network, ...MODULE_TWO_LAB.access];
  const chosen = allRecords.filter((record) => moduleTwoState.selectedEvidence.includes(record.id));
  const count = document.getElementById('m02-selection-count');
  const summary = document.getElementById('m02-selection-summary');
  if (count) count.textContent = String(chosen.length);
  if (summary) summary.textContent = chosen.length ? chosen.map((item) => item.id).join(' · ') : 'Select only records that materially support your conclusion.';
}

function wireModuleTwoLab() {
  const root = document.getElementById('m02-lab-dynamic');
  if (!root || !moduleTwoState) return;

  root.addEventListener('keydown', (event) => {
    const stationButton = event.target.closest('[data-m02-station]');
    if (!stationButton || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const stations = MODULE_TWO_LAB.stations;
    const currentIndex = stations.findIndex((item) => item.id === stationButton.dataset.m02Station);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % stations.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + stations.length) % stations.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = stations.length - 1;
    event.preventDefault();
    moduleTwoState.activeStation = stations[nextIndex].id;
    moduleTwoState.resetArmed = false;
    moduleTwoSave();
    moduleTwoRenderDynamic();
    requestAnimationFrame(() => document.getElementById(`m02-tab-${stations[nextIndex].id}`)?.focus());
  });

  root.addEventListener('click', (event) => {
    const stationButton = event.target.closest('[data-m02-station]');
    if (stationButton) {
      moduleTwoState.activeStation = stationButton.dataset.m02Station;
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-station-panel');
      return;
    }

    const reviewButton = event.target.closest('[data-m02-review-station]');
    if (reviewButton) {
      const stationId = reviewButton.dataset.m02ReviewStation;
      if (!moduleTwoState.reviewedStations.includes(stationId)) moduleTwoState.reviewedStations.push(stationId);
      const stationIndex = MODULE_TWO_LAB.stations.findIndex((item) => item.id === stationId);
      const nextStation = MODULE_TWO_LAB.stations[stationIndex + 1];
      if (nextStation) moduleTwoState.activeStation = nextStation.id;
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic(nextStation ? 'm02-station-panel' : 'm02-worksheet-title');
      return;
    }

    if (event.target.closest('[data-m02-note-starter]')) {
      moduleTwoState.notes = 'Identity: IDN-317. Observed: [authentication fact] and [network context]. Access impact: [role change and approval status]. Recommend: preserve [record IDs] and escalate for [scoped next step].';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-notes');
      return;
    }

    if (event.target.closest('[data-m02-reset]')) {
      moduleTwoState.resetArmed = true;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-reset-confirm');
      return;
    }

    if (event.target.closest('[data-m02-reset-cancel]')) {
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-feedback');
      return;
    }

    if (event.target.closest('[data-m02-reset-confirm]')) {
      moduleTwoState = LabRuntime.reset(MODULE_TWO_LAB_ID, moduleTwoUser, MODULE_TWO_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwoUser, 'soc-analyst', 'soc-02', MODULE_TWO_CATALOG_LAB_KEY, false);
      moduleTwoRenderDynamic('m02-investigation-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m02-evidence]')) {
      moduleTwoState.selectedEvidence = input.checked
        ? [...new Set([...moduleTwoState.selectedEvidence, input.value])]
        : moduleTwoState.selectedEvidence.filter((id) => id !== input.value);
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoUpdateSelectionSummary();
      return;
    }
    if (['observation', 'analysis', 'decision'].includes(input.name)) {
      moduleTwoState[input.name] = input.value;
      moduleTwoState.validationError = '';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleTwoState.notes = event.target.value;
    moduleTwoState.resetArmed = false;
    const count = document.querySelector('#m02-note-count span');
    if (count) count.textContent = String(moduleTwoState.notes.length);
    moduleTwoSave();
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm02-form') return;
    event.preventDefault();
    moduleTwoState.notes = event.target.elements.notes.value;
    const missing = ['observation', 'analysis', 'decision'].filter((name) => !moduleTwoState[name]);
    if (missing.length || moduleTwoState.notes.trim().length < 70) {
      moduleTwoState.validationError = missing.length
        ? 'Choose one answer for observation, analysis, and decision, then write a handoff note of at least 70 characters.'
        : 'Your decisions are saved. Expand the handoff note to at least 70 characters so another analyst can act on it.';
      moduleTwoState.resetArmed = false;
      moduleTwoSave();
      moduleTwoRenderDynamic('m02-feedback');
      return;
    }

    const result = moduleTwoScore();
    moduleTwoState.attempts += 1;
    moduleTwoState.score = result.score;
    moduleTwoState.bestScore = Math.max(moduleTwoState.bestScore || 0, result.score);
    moduleTwoState.breakdown = result.breakdown;
    moduleTwoState.feedback = result.feedback;
    moduleTwoState.validationError = '';
    moduleTwoState.lastSubmittedAt = new Date().toISOString();
    moduleTwoState.resetArmed = false;
    const passed = result.score >= MODULE_TWO_LAB.passingScore;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTwoUser, MODULE_TWO_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleTwoState.attempts },
      });
    }
    if (passed) {
      moduleTwoState.completed = true;
      if (!moduleTwoState.flags.includes(MODULE_TWO_FLAG)) moduleTwoState.flags.push(MODULE_TWO_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwoUser, 'soc-analyst', 'soc-02', MODULE_TWO_CATALOG_LAB_KEY);
    }
    moduleTwoSave();
    moduleTwoRenderDynamic('m02-feedback');
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 2, moduleKey: 'soc-02',
  view: viewModuleTwo, wire: wireModuleTwoLab });

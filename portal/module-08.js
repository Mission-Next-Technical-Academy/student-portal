/* Module 08 — semi-independent vulnerability prioritization and exposure analysis.
 * Every asset, finding, version, score, and action is synthetic and browser-local.
 */

const MODULE_EIGHT_PRIORITY_LAB_ID = 'm08-exposure-prioritization-v1';
const MODULE_EIGHT_QUEUE_LAB_ID = 'm08-vulnerability-queue-v1';
const MODULE_EIGHT_PRIORITY_FLAG = 'M08-EXPOSURE-PRIORITIZED';
const MODULE_EIGHT_QUEUE_FLAG = 'M08-QUEUE-DISPOSITIONED';
const MODULE_EIGHT_PRIORITY_CATALOG_KEY = 'lab-vuln-prioritization';
const MODULE_EIGHT_QUEUE_CATALOG_KEY = 'lab-vuln-queue';
const MODULE_EIGHT_PASSING_SCORE = 70;
const MODULE_EIGHT_PRIORITY_MINUTES = LABS.find((item) => item.key === MODULE_EIGHT_PRIORITY_CATALOG_KEY).instructionalMinutes;
const MODULE_EIGHT_QUEUE_MINUTES = LABS.find((item) => item.key === MODULE_EIGHT_QUEUE_CATALOG_KEY).instructionalMinutes;

const MODULE_EIGHT_FINDINGS = [
  {
    id: 'VM-801', cve: 'CVE-2026-41017', asset: 'auth-edge-02', role: 'Customer identity gateway',
    environment: 'Production', cvss: 8.1, exploitProbability: '93%', knownExploited: true,
    exposure: 'Internet-facing', criticality: 'Critical', patch: 'Vendor fix available',
    control: 'WAF signature is monitor-only', owner: 'Identity platform', detected: '2 hours ago',
    detail: 'The affected listener handles customer authentication. A public exploit is reliable without credentials, and edge telemetry shows repeated requests matching the exploit path. The WAF records them but does not block them.',
  },
  {
    id: 'VM-802', cve: 'CVE-2026-11991', asset: 'build-agent-14', role: 'Software build runner',
    environment: 'Engineering', cvss: 9.8, exploitProbability: '82%', knownExploited: true,
    exposure: 'Admin VLAN only', criticality: 'High', patch: 'Vendor fix available',
    control: 'EDR prevention and egress allow-list active', owner: 'Developer platform', detected: '1 day ago',
    detail: 'The base score is higher than VM-801, but the runner accepts connections only from the administration VLAN. EDR blocks the observed exploit chain and outbound traffic is restricted. Remediation is still urgent, but exposure is lower.',
  },
  {
    id: 'VM-803', cve: 'CVE-2026-22008', asset: 'payroll-legacy-03', role: 'Payroll archive terminal',
    environment: 'Restricted legacy', cvss: 9.1, exploitProbability: '18%', knownExploited: false,
    exposure: 'Isolated segment', criticality: 'Critical', patch: 'No compatible fix',
    control: 'Jump host, two named admins, outbound deny', owner: 'Finance systems', detected: '12 days ago',
    detail: 'The terminal is important, but it is isolated behind a jump host, has no outbound route, and is scheduled for retirement in ten days. The control owner has verified the restrictions. Maintain and monitor the exception until retirement.',
  },
  {
    id: 'VM-804', cve: 'CVE-2026-08772', asset: 'sales-laptop-22', role: 'Managed sales workstation',
    environment: 'User endpoint', cvss: 8.8, exploitProbability: '61%', knownExploited: true,
    exposure: 'Roaming endpoint', criticality: 'Medium', patch: 'Fixed in version 131.2',
    control: 'Installed version 131.2; inventory feed still reports 129.4', owner: 'Endpoint operations', detected: '5 hours ago',
    detail: 'A live software check confirms version 131.2, which contains the fix. The scanner joined against a delayed inventory record that still lists 129.4. Validate the evidence and close the stale finding rather than scheduling another deployment.',
  },
  {
    id: 'VM-805', cve: 'CVE-2026-50112', asset: 'docs-preview-stg', role: 'Document preview service',
    environment: 'Staging', cvss: 7.5, exploitProbability: '27%', knownExploited: false,
    exposure: 'Internet route disabled', criticality: 'Low', patch: 'Approved for next window',
    control: 'Load balancer disabled; no customer data', owner: 'Web platform', detected: '3 days ago',
    detail: 'The service previously had a public route, but a reachability check confirms that its load balancer is disabled. It contains synthetic test documents only. Patch during the approved maintenance window and retest reachability.',
  },
  {
    id: 'VM-806', cve: 'CVE-2026-17330', asset: 'file-share-07', role: 'Department file share',
    environment: 'Corporate internal', cvss: 6.5, exploitProbability: '9%', knownExploited: false,
    exposure: 'Internal authenticated', criticality: 'Medium', patch: 'Vendor fix available',
    control: 'MFA admin path and network access control', owner: 'Core infrastructure', detected: '6 days ago',
    detail: 'Exploitation requires an authenticated user with share access. No public exploit or suspicious activity is known. The normal monthly window is proportionate while access controls remain verified.',
  },
];

const MODULE_EIGHT_PRIORITY_SIGNALS = [
  { id: 'internet', label: 'Internet reachability is currently verified', help: 'Attackers do not need an internal foothold to reach auth-edge-02.' },
  { id: 'exploited', label: 'Reliable exploitation is active in the wild', help: 'Exploitability changes urgency more than a base score alone.' },
  { id: 'critical', label: 'The asset supports customer authentication', help: 'Successful exploitation could affect a critical business service.' },
  { id: 'weak-control', label: 'The edge control only monitors the exploit path', help: 'The WAF does not currently reduce likelihood by blocking the request.' },
  { id: 'highest-cvss', label: 'It has the highest CVSS in the list', help: 'It does not; VM-802 has a higher base score.' },
  { id: 'oldest', label: 'It is the oldest open finding', help: 'Age can matter operationally, but VM-801 is new and still the urgent exposure.' },
];

const MODULE_EIGHT_QUEUE = [
  {
    id: 'VQ-821', asset: 'remote-access-01', cve: 'CVE-2026-33102', cvss: '8.4',
    summary: 'Internet-reachable administration portal; exploit observed; vendor fix ready.',
    evidence: 'A reachability test succeeded from outside the lab perimeter. The exploit needs no account, the portal controls privileged remote access, and the current WAF rule only logs. The owner can deploy the tested fix today.',
    answer: 'fix-now', rationale: 'Fix now: verified exposure, active exploitation, high-impact function, weak prevention, and an available tested fix all align.',
  },
  {
    id: 'VQ-822', asset: 'design-laptop-08', cve: 'CVE-2026-28440', cvss: '9.0',
    summary: 'Scanner reports a vulnerable browser, but current endpoint inventory differs.',
    evidence: 'The scan used yesterday\'s software inventory (version 129.1). A signed live inventory record and package receipt both show fixed version 132.0 installed before this queue opened.',
    answer: 'false-positive', rationale: 'Close as a validated false positive and repair the stale inventory join; do not treat one old scanner record as current state.',
  },
  {
    id: 'VQ-823', asset: 'imaging-console-03', cve: 'CVE-2026-14418', cvss: '8.7',
    summary: 'A vendor-supported clinical imaging console cannot take the patch for 21 days.',
    evidence: 'The console is on an isolated VLAN with an outbound deny rule, two named operators, and jump-host-only administration. The vendor has scheduled validation in 21 days; the service owner cannot safely stop imaging today.',
    answer: 'compensating-control', rationale: 'Time-box and verify compensating controls until the supported patch is available; record the owner, expiry, monitoring, and retest.',
  },
  {
    id: 'VQ-824', asset: 'archive-api-stg', cve: 'CVE-2026-09155', cvss: '7.4',
    summary: 'Staging API has no current route, no sensitive data, and no known exploit.',
    evidence: 'The load balancer target group is disabled and an independent reachability test fails. The approved patch window is in four days. The environment contains generated test records only.',
    answer: 'schedule', rationale: 'Schedule the patch in the near maintenance window and verify both version and reachability afterward.',
  },
];

const MODULE_EIGHT_QUEUE_EVIDENCE = [
  { id: 'live-version', label: 'Signed live version plus deployment receipt', help: 'Corroborates that VQ-822 is already fixed.' },
  { id: 'reachability', label: 'Independent external reachability test', help: 'Separates the exposed portal from the disabled staging route.' },
  { id: 'control-owner', label: 'Control-owner confirmation with an expiry date', help: 'Makes VQ-823\'s temporary control accountable and time-bound.' },
  { id: 'cvss-only', label: 'CVSS ranking with no environment context', help: 'Useful input, but insufficient validation evidence by itself.' },
  { id: 'asset-name', label: 'Asset name similarity', help: 'A naming pattern does not prove exposure, version, or control state.' },
];

let moduleEightPriorityState = null;
let moduleEightQueueState = null;
let moduleEightUser = null;

function moduleEightPriorityFreshState() {
  return {
    reviewedFindings: [], filter: 'all', sort: 'context', activeFinding: '',
    priorityChoice: '', riskModel: '', treatment: '', timeline: '',
    breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleEightQueueFreshState() {
  return {
    reviewedItems: [], activeItem: '', decisions: {}, workflow: '', followUp: '',
    breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleEightLoad(user) {
  moduleEightUser = user;
  moduleEightPriorityState = LabRuntime.load(MODULE_EIGHT_PRIORITY_LAB_ID, user, moduleEightPriorityFreshState());
  moduleEightQueueState = LabRuntime.load(MODULE_EIGHT_QUEUE_LAB_ID, user, moduleEightQueueFreshState());
  if (!Array.isArray(moduleEightPriorityState.reviewedFindings)) moduleEightPriorityState.reviewedFindings = [];
  if (!Array.isArray(moduleEightPriorityState.selectedEvidence)) moduleEightPriorityState.selectedEvidence = [];
  if (!Array.isArray(moduleEightPriorityState.feedback)) moduleEightPriorityState.feedback = [];
  if (!Array.isArray(moduleEightPriorityState.flags)) moduleEightPriorityState.flags = [];
  if (!Array.isArray(moduleEightQueueState.reviewedItems)) moduleEightQueueState.reviewedItems = [];
  if (!Array.isArray(moduleEightQueueState.selectedEvidence)) moduleEightQueueState.selectedEvidence = [];
  if (!Array.isArray(moduleEightQueueState.feedback)) moduleEightQueueState.feedback = [];
  if (!Array.isArray(moduleEightQueueState.flags)) moduleEightQueueState.flags = [];
  if (!moduleEightQueueState.decisions || typeof moduleEightQueueState.decisions !== 'object') moduleEightQueueState.decisions = {};
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-08');
}

function moduleEightSavePriority() {
  if (moduleEightUser && moduleEightPriorityState) LabRuntime.save(MODULE_EIGHT_PRIORITY_LAB_ID, moduleEightUser, moduleEightPriorityState);
}

function moduleEightSaveQueue() {
  if (moduleEightUser && moduleEightQueueState) LabRuntime.save(MODULE_EIGHT_QUEUE_LAB_ID, moduleEightUser, moduleEightQueueState);
}

function moduleEightStatus(state) {
  if (state.completed) return 'Complete';
  if (state.attempts || state.reviewedFindings?.length || state.reviewedItems?.length) return 'In progress';
  return 'Not started';
}

function moduleEightConcepts() {
  const topics = [
    ['ri-radar-line', 'Asset discovery', 'Start with an accountable inventory and ownership. An unknown or stale asset record weakens every later decision.'],
    ['ri-bug-line', 'Vulnerability assessment', 'Validate affected versions and scanner confidence before treating a finding as current exposure.'],
    ['ri-cloud-line', 'Environments', 'Internet reachability, identity boundaries, network paths, and business purpose change likelihood and impact.'],
    ['ri-scales-3-line', 'Analysis & prioritization', 'Combine severity with exploitability, exposure, asset criticality, controls, and threat evidence.'],
    ['ri-tools-line', 'Remediation', 'Assign an owner, due date, verification step, and safe exception path—not only a patch instruction.'],
    ['ri-code-box-line', 'Application security', 'Track vulnerable components into deployment and verify the running version, not merely the build manifest.'],
  ];
  return `<div class="m08-concept-grid">${topics.map((topic) => `<article><i class="${esc(topic[0])}" aria-hidden="true"></i><h3>${esc(topic[1])}</h3><p>${esc(topic[2])}</p></article>`).join('')}</div>
    <div class="m08-risk-model" aria-label="Contextual exposure prioritization model"><strong>Practical risk order</strong><span>Validate</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Exploitability</span><i class="ri-add-line" aria-hidden="true"></i><span>Exposure</span><i class="ri-add-line" aria-hidden="true"></i><span>Business impact</span><i class="ri-subtract-line" aria-hidden="true"></i><span>Effective controls</span></div>`;
}

function moduleEightFilteredFindings() {
  let rows = MODULE_EIGHT_FINDINGS.filter((finding) => {
    if (moduleEightPriorityState.filter === 'internet') return finding.exposure === 'Internet-facing';
    if (moduleEightPriorityState.filter === 'exploited') return finding.knownExploited;
    if (moduleEightPriorityState.filter === 'critical') return finding.criticality === 'Critical';
    return true;
  });
  rows = rows.slice().sort((left, right) => {
    if (moduleEightPriorityState.sort === 'cvss') return right.cvss - left.cvss;
    if (moduleEightPriorityState.sort === 'age') {
      const oldestFirst = ['VM-803', 'VM-806', 'VM-805', 'VM-802', 'VM-804', 'VM-801'];
      return oldestFirst.indexOf(left.id) - oldestFirst.indexOf(right.id);
    }
    const order = ['VM-801', 'VM-802', 'VM-803', 'VM-804', 'VM-805', 'VM-806'];
    return order.indexOf(left.id) - order.indexOf(right.id);
  });
  return rows;
}

function moduleEightFindingTable() {
  const rows = moduleEightFilteredFindings();
  return `<div class="m08-table-wrap"><table class="m08-data-table">
    <caption class="m08-visually-hidden">Six synthetic findings assigned to this exercise; inspect rows for exposure context</caption>
    <thead><tr><th scope="col">Finding</th><th scope="col">Asset / role</th><th scope="col">CVSS</th><th scope="col">Exploit</th><th scope="col">Exposure</th><th scope="col">Criticality</th><th scope="col">Control / patch</th><th scope="col">Context</th></tr></thead>
    <tbody>${rows.map((finding) => {
      const reviewed = moduleEightPriorityState.reviewedFindings.includes(finding.id);
      return `<tr class="${reviewed ? 'is-reviewed' : ''}"><td data-label="Finding"><strong>${esc(finding.id)}</strong><code>${esc(finding.cve)}</code></td><td data-label="Asset / role"><code>${esc(finding.asset)}</code><span>${esc(finding.role)}</span></td><td data-label="CVSS"><span class="m08-cvss">${finding.cvss.toFixed(1)}</span></td><td data-label="Exploit"><span class="m08-pill ${finding.knownExploited ? 'is-alert' : ''}">${finding.knownExploited ? 'Known exploited' : 'No known exploit'}</span><small>${esc(finding.exploitProbability)} probability</small></td><td data-label="Exposure">${esc(finding.exposure)}</td><td data-label="Criticality">${esc(finding.criticality)}</td><td data-label="Control / patch"><span>${esc(finding.control)}</span><small>${esc(finding.patch)}</small></td><td data-label="Context"><button type="button" class="m08-inspect" data-m08-finding="${esc(finding.id)}" aria-label="Inspect ${esc(finding.id)} context"><i class="${reviewed ? 'ri-checkbox-circle-fill' : 'ri-search-eye-line'}" aria-hidden="true"></i>${reviewed ? 'Reviewed' : 'Inspect'}</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function moduleEightPriorityScorePanel() {
  const state = moduleEightPriorityState;
  if (state.validationError) return `<div class="m08-validation" id="m08-priority-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the priority brief</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m08-score-empty" id="m08-priority-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Passing score: ${MODULE_EIGHT_PASSING_SCORE}.</div>`;
  const passed = state.score >= MODULE_EIGHT_PASSING_SCORE;
  const b = state.breakdown;
  return `<section class="m08-score ${passed ? 'is-pass' : 'is-remediate'}" id="m08-priority-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m08-priority-score-title">
    <div class="m08-score-heading"><div><p class="m08-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h4 id="m08-priority-score-title">${state.score}/100 — ${passed ? 'Priority defended' : 'Reweight the exposure context'}</h4></div><span>${state.score}</span></div>
    <div class="m08-score-grid" aria-label="Priority lab score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span><small>Review depth and evidence signals</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Priority target and risk model</small></div><div><strong>${b.decision}/25</strong><span>Decision</span><small>Treatment and timeline</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Evidence-based remediation brief</small></div></div>
    <ul class="m08-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m08-expert-model"><strong>Expert reasoning</strong><p>VM-801 is not the highest base score, but it is the first remediation priority: the identity gateway is internet reachable, supports a critical service, has reliable active exploitation, and its WAF is only monitoring. Patch it within 24 hours, move the WAF signature to an approved blocking mode as an interim measure, then verify the running version and external reachability.</p></div>
  </section>`;
}

function moduleEightRadioOptions(name, selected, options) {
  return `<div class="m08-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${selected === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleEightPriorityLab() {
  const active = MODULE_EIGHT_FINDINGS.find((finding) => finding.id === moduleEightPriorityState.activeFinding);
  return `<section class="m08-lab-card" aria-labelledby="m08-priority-title">
    <div class="m08-lab-heading"><div><p class="m08-kicker">Lab 1 · semi-independent · ${formatInstructionalMinutes(MODULE_EIGHT_PRIORITY_MINUTES)}</p><h2 id="m08-priority-title">Exposure-driven remediation priority</h2></div><span class="m08-lab-status">${moduleEightStatus(moduleEightPriorityState)}</span></div>
    <div class="m08-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Measurable objective</strong><p>Prioritize one finding from six assigned assets and defend the first remediation using validated exploitability, exposure, business criticality, and control strength with at least ${MODULE_EIGHT_PASSING_SCORE}/100.</p></div></div>
    <div class="m08-scope-note"><i class="ri-shield-keyhole-line" aria-hidden="true"></i><p><strong>Bounded assignment:</strong> this is a six-asset portfolio prepared for the exercise. There is no enterprise inventory, hidden tenant, or route into a wider console.</p></div>
    <div class="m08-workbench" aria-labelledby="m08-workbench-title"><div class="m08-panel-heading"><div><p class="m08-kicker">Observation workspace</p><h3 id="m08-workbench-title">Validate before you rank</h3></div><span>${moduleEightPriorityState.reviewedFindings.length}/6 inspected</span></div>
      <div class="m08-toolbar" aria-label="Finding filters and sort"><div role="group" aria-label="Filter findings">${[
        ['all', 'All 6'], ['internet', 'Internet-facing'], ['exploited', 'Known exploited'], ['critical', 'Critical assets'],
      ].map((item) => `<button type="button" data-m08-filter="${item[0]}" aria-pressed="${moduleEightPriorityState.filter === item[0]}">${item[1]}</button>`).join('')}</div><label for="m08-sort">Sort <select id="m08-sort" name="prioritySort"><option value="context" ${moduleEightPriorityState.sort === 'context' ? 'selected' : ''}>Contextual priority</option><option value="cvss" ${moduleEightPriorityState.sort === 'cvss' ? 'selected' : ''}>CVSS high to low</option><option value="age" ${moduleEightPriorityState.sort === 'age' ? 'selected' : ''}>Finding age</option></select></label></div>
      ${moduleEightFindingTable()}
      ${active ? `<aside class="m08-detail" id="m08-finding-detail" tabindex="-1"><button type="button" data-m08-close-finding aria-label="Close finding detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m08-kicker">${esc(active.id)} · validated context</p><h4>${esc(active.asset)} · ${esc(active.role)}</h4><p>${esc(active.detail)}</p><dl><div><dt>Owner</dt><dd>${esc(active.owner)}</dd></div><div><dt>Detected</dt><dd>${esc(active.detected)}</dd></div><div><dt>Environment</dt><dd>${esc(active.environment)}</dd></div></dl></aside>` : ''}
    </div>
    <form class="m08-artifact" id="m08-priority-form" novalidate><div class="m08-panel-heading"><div><p class="m08-kicker">Scored artifact</p><h3>Write the remediation priority brief</h3></div><span>Retry allowed</span></div>
      <fieldset class="m08-fieldset"><legend><span>1</span>Select the evidence that makes the first priority urgent</legend><p class="m08-help">Choose signals, not conclusions. Extra unsupported signals reduce observation credit.</p><div class="m08-check-grid">${MODULE_EIGHT_PRIORITY_SIGNALS.map((signal) => `<label><input type="checkbox" name="priorityEvidence" value="${esc(signal.id)}" ${moduleEightPriorityState.selectedEvidence.includes(signal.id) ? 'checked' : ''} /><span><strong>${esc(signal.label)}</strong><small>${esc(signal.help)}</small></span></label>`).join('')}</div></fieldset>
      <fieldset class="m08-fieldset"><legend><span>2</span>Which finding should be remediated first?</legend>${moduleEightRadioOptions('priorityChoice', moduleEightPriorityState.priorityChoice, MODULE_EIGHT_FINDINGS.map((finding) => ({ id: finding.id, label: `${finding.id} · ${finding.asset} · ${finding.cve}`, help: `${finding.cvss.toFixed(1)} CVSS · ${finding.exposure} · ${finding.criticality}` })))}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>3</span>Which prioritization model supports your selection?</legend>${moduleEightRadioOptions('riskModel', moduleEightPriorityState.riskModel, [
        { id: 'contextual-risk', label: 'Validate and combine exploitability, exposure, impact, and effective controls', help: 'CVSS remains an input, not the complete decision.' },
        { id: 'cvss-only', label: 'Always remediate the highest CVSS first', help: 'Ignores reachability, current version, controls, and threat activity.' },
        { id: 'oldest-first', label: 'Always remediate the oldest open record first', help: 'Backlog age alone does not express present likelihood or impact.' },
      ])}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>4</span>Choose the treatment and target</legend><div class="m08-two-column">${moduleEightRadioOptions('treatment', moduleEightPriorityState.treatment, [
        { id: 'emergency-remediation', label: 'Emergency patch plus approved interim WAF blocking', help: 'Reduce exposure now, then verify the running version.' },
        { id: 'accept', label: 'Accept the risk without another control', help: 'Not proportionate to active exploitation of a critical public service.' },
        { id: 'scan-again', label: 'Wait for next month\'s scan before acting', help: 'The affected version and current reachability are already validated.' },
      ])}${moduleEightRadioOptions('timeline', moduleEightPriorityState.timeline, [
        { id: 'within-24h', label: 'Complete within 24 hours and retest', help: 'Matches verified likelihood, impact, and fix readiness.' },
        { id: 'next-month', label: 'Use the next monthly window', help: 'Too slow for an actively exploited public identity service.' },
        { id: 'no-date', label: 'Assign no due date', help: 'An action without accountable timing is not a remediation plan.' },
      ])}</div></fieldset>
      <label class="m08-note-label" for="m08-priority-notes"><span>5</span><strong>Communicate the priority</strong></label><p class="m08-help">Name the finding and asset, cite exploitability and exposure, state the action and target, and include verification.</p><textarea id="m08-priority-notes" name="priorityNotes" rows="5" maxlength="900" aria-describedby="m08-priority-count" placeholder="Prioritize VM-… because… The owner should… by… Verify…">${esc(moduleEightPriorityState.notes)}</textarea><p class="m08-note-count" id="m08-priority-count"><span>${moduleEightPriorityState.notes.length}</span>/900 characters</p>
      <details class="m08-hint"><summary>Need a prioritization hint?</summary><p>Compare VM-801 and VM-802. One has the higher CVSS; the other is reachable without credentials, protects customer authentication, shows exploit traffic, and lacks a blocking control.</p></details>
      <div class="m08-actions"><button type="submit" class="m08-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score priority brief</button><button type="button" class="m08-reset" data-m08-reset-priority><i class="ri-restart-line" aria-hidden="true"></i> Reset Lab 1 only</button></div>
      ${moduleEightPriorityScorePanel()}
    </form>
  </section>`;
}

function moduleEightQueueScorePanel() {
  const state = moduleEightQueueState;
  if (state.validationError) return `<div class="m08-validation" id="m08-queue-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the queue handoff</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m08-score-empty" id="m08-queue-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Passing score: ${MODULE_EIGHT_PASSING_SCORE}.</div>`;
  const passed = state.score >= MODULE_EIGHT_PASSING_SCORE;
  const b = state.breakdown;
  return `<section class="m08-score ${passed ? 'is-pass' : 'is-remediate'}" id="m08-queue-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m08-queue-score-title"><div class="m08-score-heading"><div><p class="m08-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h4 id="m08-queue-score-title">${state.score}/100 — ${passed ? 'Queue decisions ready for handoff' : 'Validate the queue before handoff'}</h4></div><span>${state.score}</span></div>
    <div class="m08-score-grid" aria-label="Queue lab score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span><small>Four reviews and validation evidence</small></div><div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Four supported dispositions</small></div><div><strong>${b.decision}/25</strong><span>Decision</span><small>Ownership and closed-loop verification</small></div><div><strong>${b.communication}/20</strong><span>Communication</span><small>Actionable queue handoff</small></div></div>
    <ul class="m08-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m08-expert-model"><strong>Expert queue reasoning</strong><p>Fix VQ-821 now; close VQ-822 only after recording the corroborated current version and repairing the stale inventory join; time-box the verified controls for VQ-823 until its supported patch; and schedule VQ-824 for the near window because independent testing confirms no route. Every item still needs an owner, due date or expiry, and a retest.</p></div></section>`;
}

function moduleEightQueueLab() {
  const active = MODULE_EIGHT_QUEUE.find((item) => item.id === moduleEightQueueState.activeItem);
  const dispositions = [
    ['fix-now', 'Fix now'], ['schedule', 'Schedule remediation'], ['compensating-control', 'Apply / verify compensating control'],
    ['accept-risk', 'Accept risk'], ['escalate', 'Escalate for more investigation'], ['false-positive', 'Close validated false positive'],
  ];
  return `<section class="m08-lab-card" aria-labelledby="m08-queue-title"><div class="m08-lab-heading"><div><p class="m08-kicker">Lab 2 · semi-independent · ${formatInstructionalMinutes(MODULE_EIGHT_QUEUE_MINUTES)}</p><h2 id="m08-queue-title">SOC finding decision queue</h2></div><span class="m08-lab-status">${moduleEightStatus(moduleEightQueueState)}</span></div>
    <div class="m08-objective"><i class="ri-list-check-3" aria-hidden="true"></i><div><strong>Measurable objective</strong><p>Validate four assigned findings, give each an evidence-supported disposition, and produce an owned, time-bound, verifiable handoff with at least ${MODULE_EIGHT_PASSING_SCORE}/100.</p></div></div>
    <div class="m08-queue" aria-label="Four synthetic vulnerability queue items">${MODULE_EIGHT_QUEUE.map((item) => {
      const reviewed = moduleEightQueueState.reviewedItems.includes(item.id);
      return `<article class="${reviewed ? 'is-reviewed' : ''}"><div class="m08-queue-id"><span>${esc(item.id)}</span><code>${esc(item.cve)}</code></div><div><h3>${esc(item.asset)}</h3><p>${esc(item.summary)}</p></div><button type="button" class="m08-inspect" data-m08-queue-item="${esc(item.id)}"><i class="${reviewed ? 'ri-checkbox-circle-fill' : 'ri-search-eye-line'}" aria-hidden="true"></i>${reviewed ? 'Reviewed' : 'Inspect'}</button><label>Disposition<select name="queueDecision" data-m08-decision="${esc(item.id)}"><option value="">Choose…</option>${dispositions.map((option) => `<option value="${option[0]}" ${moduleEightQueueState.decisions[item.id] === option[0] ? 'selected' : ''}>${option[1]}</option>`).join('')}</select></label></article>`;
    }).join('')}</div>
    ${active ? `<aside class="m08-detail m08-queue-detail" id="m08-queue-detail" tabindex="-1"><button type="button" data-m08-close-queue aria-label="Close queue detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m08-kicker">${esc(active.id)} · validation record</p><h4>${esc(active.asset)} · ${esc(active.cve)} · CVSS ${esc(active.cvss)}</h4><p>${esc(active.evidence)}</p></aside>` : ''}
    <form class="m08-artifact" id="m08-queue-form" novalidate><div class="m08-panel-heading"><div><p class="m08-kicker">Scored artifact</p><h3>Close the decision loop</h3></div><span>${moduleEightQueueState.reviewedItems.length}/4 inspected</span></div>
      <fieldset class="m08-fieldset"><legend><span>1</span>Select the validation evidence you would preserve</legend><p class="m08-help">Keep corroborating evidence that another analyst can reproduce.</p><div class="m08-check-grid">${MODULE_EIGHT_QUEUE_EVIDENCE.map((item) => `<label><input type="checkbox" name="queueEvidence" value="${esc(item.id)}" ${moduleEightQueueState.selectedEvidence.includes(item.id) ? 'checked' : ''} /><span><strong>${esc(item.label)}</strong><small>${esc(item.help)}</small></span></label>`).join('')}</div></fieldset>
      <fieldset class="m08-fieldset"><legend><span>2</span>How should the queue be operationalized?</legend>${moduleEightRadioOptions('workflow', moduleEightQueueState.workflow, [
        { id: 'owners-and-tickets', label: 'Create owned tickets with due dates or exception expiries', help: 'Route work to the asset owner while vulnerability management tracks the risk.' },
        { id: 'analyst-patches-all', label: 'Have the analyst patch every system directly', help: 'Ignores change ownership, testing, and operational authorization.' },
        { id: 'spreadsheet-only', label: 'Record the decisions without assigning owners', help: 'A list alone cannot drive remediation or accountability.' },
      ])}</fieldset>
      <fieldset class="m08-fieldset"><legend><span>3</span>What closes each queue item?</legend>${moduleEightRadioOptions('followUp', moduleEightQueueState.followUp, [
        { id: 'timebound-verify', label: 'Retest the version or control, record evidence, and reopen failures', help: 'Verification closes the loop; an exception must also expire.' },
        { id: 'ticket-created', label: 'Close as soon as a ticket is created', help: 'A work request is not proof that exposure changed.' },
        { id: 'owner-says-done', label: 'Close on an informal owner message', help: 'Capture reproducible technical validation instead.' },
      ])}</fieldset>
      <label class="m08-note-label" for="m08-queue-notes"><span>4</span><strong>Write the queue handoff</strong></label><p class="m08-help">Summarize the four dispositions, owners/timing, and what must be retested. Separate a validated false positive from accepted risk.</p><textarea id="m08-queue-notes" name="queueNotes" rows="6" maxlength="1100" aria-describedby="m08-queue-count" placeholder="VQ-821: fix now… VQ-822: close as validated false positive…">${esc(moduleEightQueueState.notes)}</textarea><p class="m08-note-count" id="m08-queue-count"><span>${moduleEightQueueState.notes.length}</span>/1100 characters</p>
      <details class="m08-hint"><summary>Need a queue hint?</summary><p>A stale record with two current-version proofs is not accepted risk. A system that cannot yet be patched still needs a time-boxed control, owner, expiry, and retest.</p></details>
      <div class="m08-actions"><button type="submit" class="m08-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score queue handoff</button><button type="button" class="m08-reset" data-m08-reset-queue><i class="ri-restart-line" aria-hidden="true"></i> Reset Lab 2 only</button></div>${moduleEightQueueScorePanel()}
    </form>
  </section>`;
}

function moduleEightDynamic() {
  return `${moduleEightPriorityLab()}${moduleEightQueueLab()}`;
}

function viewModuleEight(user, program) {
  moduleEightLoad(user);
  const completeCount = Number(moduleEightPriorityState.completed) + Number(moduleEightQueueState.completed);
  const module = program.modules['soc-08'];
  return `<div class="m08-shell"><header class="m08-topbar"><a href="#/program/${esc(program.slug)}" class="m08-brand" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m08-top-actions"><span class="m08-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Semi-independent · fictional data</span><a href="#/program/${esc(program.slug)}" class="m08-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="m08-main"><section class="m08-hero" aria-labelledby="m08-title"><div><p class="m08-kicker">Module 08 · ${formatInstructionalMinutes(module.durationMinutes)} · SOC prioritization</p><h1 id="m08-title">${esc(module.title)}</h1><p class="m08-lede">Validate assigned findings, weigh exploitability, reachability, business impact, and controls, then prioritize and escalate them through the SOC workflow. Enterprise scanning governance, remediation-program ownership, and risk acceptance remain outside this module.</p><a class="m08-hero-action" href="#m08-field-guide"><i class="ri-compass-3-line" aria-hidden="true"></i> Review the prioritization model</a></div><dl class="m08-progress" aria-label="Saved Module 08 progress"><div><dt>Scoped assets</dt><dd>10 total</dd></div><div><dt>Practical labs</dt><dd>${completeCount}/${module.labs} passed</dd></div><div><dt>Module status</dt><dd id="m08-status">${completeCount === module.labs ? 'Complete' : completeCount || moduleEightPriorityState.attempts || moduleEightQueueState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>
      <section class="m08-section" id="m08-field-guide" aria-labelledby="m08-guide-title"><div class="m08-section-heading"><span>1</span><div><p class="m08-kicker">Six-part field guide</p><h2 id="m08-guide-title">Treat vulnerability data as a decision input</h2></div></div><p class="m08-intro">The base score describes technical severity under standard assumptions. Your priority must also explain whether this instance is actually affected, reachable, exploitable, important, and protected.</p>${moduleEightConcepts()}</section>
      <section class="m08-section m08-practice" aria-labelledby="m08-practice-title"><div class="m08-section-heading"><span>2</span><div><p class="m08-kicker">${module.labs} isolated labs · ${formatInstructionalMinutes(MODULE_EIGHT_PRIORITY_MINUTES + MODULE_EIGHT_QUEUE_MINUTES)} instructional time</p><h2 id="m08-practice-title">Prioritize, disposition, and communicate</h2></div></div><div class="m08-role"><i class="ri-user-settings-line" aria-hidden="true"></i><div><strong>Your role: SOC analyst reviewing assigned findings</strong><p>Work only the records below, validate their context, rank what needs attention, and escalate an owned next step. You do not administer an enterprise vulnerability program, approve risk acceptance, or control other business units.</p></div></div><div id="m08-dynamic">${moduleEightDynamic()}</div></section>
    </main></div>`;
}

function moduleEightExactSelection(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((item) => chosen.has(item)).length;
  const extras = selected.filter((item) => !expected.includes(item)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}

function moduleEightPriorityScore() {
  const review = Math.min(8, moduleEightPriorityState.reviewedFindings.length * 2);
  const signals = moduleEightExactSelection(moduleEightPriorityState.selectedEvidence, ['internet', 'exploited', 'critical', 'weak-control'], 17);
  const priority = moduleEightPriorityState.priorityChoice === 'VM-801' ? 20 : 0;
  const model = moduleEightPriorityState.riskModel === 'contextual-risk' ? 10 : 0;
  const treatment = moduleEightPriorityState.treatment === 'emergency-remediation' ? 15 : 0;
  const timeline = moduleEightPriorityState.timeline === 'within-24h' ? 10 : 0;
  const note = moduleEightPriorityState.notes.trim().toLowerCase();
  const communication = (note.length >= 120 ? 4 : 0)
    + (/(vm-801|auth-edge-02)/.test(note) ? 4 : 0)
    + (/(exploit|active|known)/.test(note) && /(internet|public|reachable)/.test(note) ? 4 : 0)
    + (/(patch|waf|block)/.test(note) && /(24|today|immediate|urgent)/.test(note) ? 4 : 0)
    + (/(verify|retest|version|reachability)/.test(note) ? 4 : 0);
  const observation = review + signals;
  const analysis = priority + model;
  const decision = treatment + timeline;
  return {
    score: observation + analysis + decision + communication,
    breakdown: { observation, analysis, decision, communication },
    feedback: [
      review === 8 ? 'Review depth: Sufficient context was inspected before ranking.' : `Review depth: ${review}/8. Inspect at least four distinct findings so the recommendation reflects comparison, not a single-row reaction.`,
      signals === 17 ? 'Evidence: Correct. Current reachability, exploitation, critical service impact, and monitor-only control explain the urgency.' : `Evidence: ${signals}/17. Preserve the four contextual signals; CVSS rank and record age are distractors here.`,
      priority && model ? 'Analysis: Correct. VM-801 leads under a contextual model even though VM-802 has the higher CVSS.' : `Analysis: ${analysis}/30. Choose VM-801 and a model that combines validation, exploitability, exposure, impact, and controls.`,
      treatment && timeline ? 'Decision: Proportionate. Patch within 24 hours, use approved interim blocking, and retest.' : `Decision: ${decision}/25. Active exploitation of a critical public service needs an emergency target, not the monthly queue.`,
      communication === 20 ? 'Communication: The brief names the target, evidence, action, timing, and verification.' : `Communication: ${communication}/20. Include VM-801/auth-edge-02, exploit and public exposure, the immediate patch/control target, and a verification step in at least 120 characters.`,
    ],
  };
}

function moduleEightQueueScore() {
  const reviews = moduleEightQueueState.reviewedItems.length === MODULE_EIGHT_QUEUE.length ? 12 : moduleEightQueueState.reviewedItems.length * 3;
  const evidence = moduleEightExactSelection(moduleEightQueueState.selectedEvidence, ['live-version', 'reachability', 'control-owner'], 13);
  const correctDecisions = MODULE_EIGHT_QUEUE.filter((item) => moduleEightQueueState.decisions[item.id] === item.answer);
  const analysis = Math.round((correctDecisions.length / MODULE_EIGHT_QUEUE.length) * 30);
  const workflow = moduleEightQueueState.workflow === 'owners-and-tickets' ? 15 : 0;
  const followUp = moduleEightQueueState.followUp === 'timebound-verify' ? 10 : 0;
  const note = moduleEightQueueState.notes.trim().toLowerCase();
  const communication = (note.length >= 140 ? 4 : 0)
    + (/(vq-821|remote-access-01)/.test(note) && /(fix|patch|immediate|now)/.test(note) ? 4 : 0)
    + (/(vq-822|design-laptop-08)/.test(note) && /(false positive|current version|132\.0|stale)/.test(note) ? 4 : 0)
    + (/(vq-823|imaging-console-03)/.test(note) && /(compensat|segment|21 days|time.box)/.test(note) ? 4 : 0)
    + (/(vq-824|archive-api-stg)/.test(note) && /(schedul|window|four days|4 days)/.test(note) && /(verify|retest|owner|due|expir)/.test(note) ? 4 : 0);
  const observation = reviews + evidence;
  const decision = workflow + followUp;
  return {
    score: observation + analysis + decision + communication,
    breakdown: { observation, analysis, decision, communication },
    feedback: [
      reviews === 12 ? 'Review depth: All four queue records were inspected.' : `Review depth: ${reviews}/12. Open every validation record before closing the queue.`,
      evidence === 13 ? 'Evidence: Correct. Current version, independent reachability, and a time-bound control record are reproducible validation artifacts.' : `Evidence: ${evidence}/13. Preserve corroborating technical and owner evidence; names and severity-only ranking are not validation.`,
      analysis === 30 ? 'Dispositions: Correct—fix now, validated false positive, compensating control, then scheduled remediation.' : `Dispositions: ${analysis}/30. Revisit ${MODULE_EIGHT_QUEUE.filter((item) => moduleEightQueueState.decisions[item.id] !== item.answer).map((item) => item.id).join(', ')} and compare each record with its validated version, route, controls, and fix readiness.`,
      decision === 25 ? 'Workflow: Correct. Owned work, time-bound exceptions, technical retesting, and reopen-on-failure close the loop.' : `Workflow: ${decision}/25. Ticket creation starts work; verified risk reduction closes it.`,
      communication === 20 ? 'Communication: Every disposition is explicit, bounded, and verifiable.' : `Communication: ${communication}/20. Cover all four item IDs, distinguish false positive from risk treatment, assign timing, and state how results will be verified in at least 140 characters.`,
    ],
  };
}

function moduleEightRender(focusId) {
  const root = document.getElementById('m08-dynamic');
  if (!root) return;
  root.innerHTML = moduleEightDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  const completeCount = Number(moduleEightPriorityState.completed) + Number(moduleEightQueueState.completed);
  const status = document.getElementById('m08-status');
  if (status) status.textContent = completeCount === 2 ? 'Complete' : 'In progress';
}

function wireModuleEightLab() {
  const root = document.getElementById('m08-dynamic');
  if (!root || !moduleEightPriorityState || !moduleEightQueueState) return;

  root.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-m08-filter]');
    if (filter) {
      moduleEightPriorityState.filter = filter.dataset.m08Filter;
      moduleEightPriorityState.activeFinding = '';
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    const findingButton = event.target.closest('[data-m08-finding]');
    if (findingButton) {
      const id = findingButton.dataset.m08Finding;
      moduleEightPriorityState.activeFinding = id;
      if (!moduleEightPriorityState.reviewedFindings.includes(id)) moduleEightPriorityState.reviewedFindings.push(id);
      moduleEightSavePriority();
      moduleEightRender('m08-finding-detail');
      return;
    }
    if (event.target.closest('[data-m08-close-finding]')) {
      moduleEightPriorityState.activeFinding = '';
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    const queueButton = event.target.closest('[data-m08-queue-item]');
    if (queueButton) {
      const id = queueButton.dataset.m08QueueItem;
      moduleEightQueueState.activeItem = id;
      if (!moduleEightQueueState.reviewedItems.includes(id)) moduleEightQueueState.reviewedItems.push(id);
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-detail');
      return;
    }
    if (event.target.closest('[data-m08-close-queue]')) {
      moduleEightQueueState.activeItem = '';
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-title');
      return;
    }
    if (event.target.closest('[data-m08-reset-priority]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset Lab 1 only? Lab 2 and course progress will stay unchanged.')) return;
      moduleEightPriorityState = LabRuntime.reset(MODULE_EIGHT_PRIORITY_LAB_ID, moduleEightUser, moduleEightPriorityFreshState());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_PRIORITY_CATALOG_KEY, false);
      moduleEightRender('m08-priority-title');
      return;
    }
    if (event.target.closest('[data-m08-reset-queue]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset Lab 2 only? Lab 1 and course progress will stay unchanged.')) return;
      moduleEightQueueState = LabRuntime.reset(MODULE_EIGHT_QUEUE_LAB_ID, moduleEightUser, moduleEightQueueFreshState());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_QUEUE_CATALOG_KEY, false);
      moduleEightRender('m08-queue-title');
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'priorityNotes') {
      moduleEightPriorityState.notes = event.target.value;
      root.querySelector('#m08-priority-count span').textContent = String(event.target.value.length);
      moduleEightSavePriority();
    }
    if (event.target.name === 'queueNotes') {
      moduleEightQueueState.notes = event.target.value;
      root.querySelector('#m08-queue-count span').textContent = String(event.target.value.length);
      moduleEightSaveQueue();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'prioritySort') {
      moduleEightPriorityState.sort = input.value;
      moduleEightSavePriority();
      moduleEightRender('m08-workbench-title');
      return;
    }
    if (input.name === 'priorityEvidence') {
      moduleEightPriorityState.selectedEvidence = input.checked ? [...new Set([...moduleEightPriorityState.selectedEvidence, input.value])] : moduleEightPriorityState.selectedEvidence.filter((item) => item !== input.value);
      moduleEightPriorityState.validationError = '';
      moduleEightSavePriority();
      return;
    }
    if (['priorityChoice', 'riskModel', 'treatment', 'timeline'].includes(input.name)) {
      moduleEightPriorityState[input.name] = input.value;
      moduleEightPriorityState.validationError = '';
      moduleEightSavePriority();
      return;
    }
    if (input.name === 'queueDecision') {
      moduleEightQueueState.decisions[input.dataset.m08Decision] = input.value;
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
      return;
    }
    if (input.name === 'queueEvidence') {
      moduleEightQueueState.selectedEvidence = input.checked ? [...new Set([...moduleEightQueueState.selectedEvidence, input.value])] : moduleEightQueueState.selectedEvidence.filter((item) => item !== input.value);
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
      return;
    }
    if (['workflow', 'followUp'].includes(input.name)) {
      moduleEightQueueState[input.name] = input.value;
      moduleEightQueueState.validationError = '';
      moduleEightSaveQueue();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm08-priority-form') {
      event.preventDefault();
      moduleEightPriorityState.notes = event.target.elements.priorityNotes.value;
      const missing = [];
      if (moduleEightPriorityState.reviewedFindings.length < 4) missing.push('inspect at least four findings');
      if (!moduleEightPriorityState.selectedEvidence.length) missing.push('select evidence signals');
      if (!moduleEightPriorityState.priorityChoice || !moduleEightPriorityState.riskModel) missing.push('complete the priority analysis');
      if (!moduleEightPriorityState.treatment || !moduleEightPriorityState.timeline) missing.push('choose treatment and timing');
      if (moduleEightPriorityState.notes.trim().length < 120) missing.push('write a 120-character remediation brief');
      if (missing.length) {
        moduleEightPriorityState.validationError = `Add: ${missing.join(', ')}. Your current work is saved.`;
        moduleEightSavePriority();
        moduleEightRender('m08-priority-feedback');
        return;
      }
      const result = moduleEightPriorityScore();
      moduleEightPriorityState.attempts += 1;
      moduleEightPriorityState.score = result.score;
      moduleEightPriorityState.bestScore = Math.max(moduleEightPriorityState.bestScore || 0, result.score);
      moduleEightPriorityState.breakdown = result.breakdown;
      moduleEightPriorityState.feedback = result.feedback;
      moduleEightPriorityState.validationError = '';
      moduleEightPriorityState.lastSubmittedAt = new Date().toISOString();
      const priorityPassed = result.score >= MODULE_EIGHT_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleEightUser, MODULE_EIGHT_PRIORITY_CATALOG_KEY, {
          state: priorityPassed ? 'complete' : 'in_progress',
          score: result.score,
          result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleEightPriorityState.attempts },
        });
      }
      if (priorityPassed) {
        moduleEightPriorityState.completed = true;
        if (!moduleEightPriorityState.flags.includes(MODULE_EIGHT_PRIORITY_FLAG)) moduleEightPriorityState.flags.push(MODULE_EIGHT_PRIORITY_FLAG);
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_PRIORITY_CATALOG_KEY);
      }
      moduleEightSavePriority();
      moduleEightRender('m08-priority-feedback');
      return;
    }

    if (event.target.id === 'm08-queue-form') {
      event.preventDefault();
      moduleEightQueueState.notes = event.target.elements.queueNotes.value;
      const missing = [];
      if (moduleEightQueueState.reviewedItems.length < MODULE_EIGHT_QUEUE.length) missing.push('inspect all four queue items');
      if (MODULE_EIGHT_QUEUE.some((item) => !moduleEightQueueState.decisions[item.id])) missing.push('choose all four dispositions');
      if (!moduleEightQueueState.selectedEvidence.length) missing.push('select validation evidence');
      if (!moduleEightQueueState.workflow || !moduleEightQueueState.followUp) missing.push('complete ownership and verification decisions');
      if (moduleEightQueueState.notes.trim().length < 140) missing.push('write a 140-character queue handoff');
      if (missing.length) {
        moduleEightQueueState.validationError = `Add: ${missing.join(', ')}. Your current work is saved.`;
        moduleEightSaveQueue();
        moduleEightRender('m08-queue-feedback');
        return;
      }
      const result = moduleEightQueueScore();
      moduleEightQueueState.attempts += 1;
      moduleEightQueueState.score = result.score;
      moduleEightQueueState.bestScore = Math.max(moduleEightQueueState.bestScore || 0, result.score);
      moduleEightQueueState.breakdown = result.breakdown;
      moduleEightQueueState.feedback = result.feedback;
      moduleEightQueueState.validationError = '';
      moduleEightQueueState.lastSubmittedAt = new Date().toISOString();
      const queuePassed = result.score >= MODULE_EIGHT_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(moduleEightUser, MODULE_EIGHT_QUEUE_CATALOG_KEY, {
          state: queuePassed ? 'complete' : 'in_progress',
          score: result.score,
          result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleEightQueueState.attempts },
        });
      }
      if (queuePassed) {
        moduleEightQueueState.completed = true;
        if (!moduleEightQueueState.flags.includes(MODULE_EIGHT_QUEUE_FLAG)) moduleEightQueueState.flags.push(MODULE_EIGHT_QUEUE_FLAG);
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleEightUser, 'soc-analyst', 'soc-08', MODULE_EIGHT_QUEUE_CATALOG_KEY);
      }
      moduleEightSaveQueue();
      moduleEightRender('m08-queue-feedback');
    }
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 8, moduleKey: 'soc-08', view: viewModuleEight, wire: wireModuleEightLab });

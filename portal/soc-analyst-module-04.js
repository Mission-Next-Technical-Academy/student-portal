/* Module 04 — assisted detection tuning, intelligence enrichment, and automation.
 * All telemetry, indicators, identities, and actions are fictional and local-only.
 */

const MODULE_FOUR_LAB_ID = 'm04-detection-enrichment-v1';
const MODULE_FOUR_FLAG = 'M04-DETECTION-ENGINEERED';
const MODULE_FOUR_CATALOG_LAB_KEY = 'lab-detection-rule';
const MODULE_FOUR_PASSING_SCORE = 70;

const MODULE_FOUR_AUTH_EVENTS = [
  { id: 'AE-401', time: '09:01', outcome: 'Success', account: 'acct-06', ip: '10.44.3.18', device: 'Managed', region: 'East office', detail: 'Normal interactive sign-in from the account’s assigned workstation.' },
  { id: 'AE-402', time: '09:02', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Stored credential rejected after the account’s approved password rotation.' },
  { id: 'AE-403', time: '09:03', outcome: 'Failed', account: 'acct-21', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'First failure from an unrecognized source and device.' , relevant: true },
  { id: 'AE-404', time: '09:04', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'The same managed mail client retried its stored credential.' },
  { id: 'AE-405', time: '09:05', outcome: 'Failed', account: 'acct-22', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A second anonymous account received one password attempt.', relevant: true },
  { id: 'AE-406', time: '09:06', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Repeated stale-client retry on the same account and managed device.' },
  { id: 'AE-407', time: '09:07', outcome: 'Failed', account: 'acct-23', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A third account received one password attempt from the same source.', relevant: true },
  { id: 'AE-408', time: '09:08', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Fourth retry from the registered client; no other accounts were targeted.' },
  { id: 'AE-409', time: '09:09', outcome: 'Failed', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fourth account received one attempt from the unrecognized source.', relevant: true },
  { id: 'AE-410', time: '09:10', outcome: 'Failed', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'Fifth retry from the known client before its credential cache refreshed.' },
  { id: 'AE-411', time: '09:11', outcome: 'Failed', account: 'acct-25', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'A fifth distinct account received one attempt from the same source.', relevant: true },
  { id: 'AE-412', time: '09:12', outcome: 'Success', account: 'acct-24', ip: '198.51.100.44', device: 'Unknown', region: 'Unresolved', detail: 'One targeted account authenticated successfully after the distributed failures.', relevant: true },
  { id: 'AE-413', time: '09:13', outcome: 'Success', account: 'acct-17', ip: '203.0.113.77', device: 'Managed', region: 'West office', detail: 'The registered client succeeded after receiving the updated credential.' },
  { id: 'AE-414', time: '09:14', outcome: 'Success', account: 'acct-08', ip: '10.44.3.22', device: 'Managed', region: 'East office', detail: 'Normal sign-in from a second assigned workstation.' },
];

const MODULE_FOUR_INTEL = [
  { id: 'TI-801', value: '198.51.100.44', type: 'IP address', confidence: 88, status: 'Active', lastSeen: '09:11 today', context: 'Observed in a credential-spraying relay set; activity remains current.', relevant: true },
  { id: 'TI-802', value: '192.0.2.91', type: 'IP address', confidence: 61, status: 'Active', lastSeen: '2 days ago', context: 'Associated with a separate phishing-delivery cluster.' },
  { id: 'TI-803', value: '203.0.113.155', type: 'IP address', confidence: 77, status: 'Expired', lastSeen: '94 days ago', context: 'Former malware staging address; the indicator is no longer active.' },
  { id: 'TI-804', value: 'updates-cdn.example', type: 'Domain', confidence: 45, status: 'Active', lastSeen: '6 days ago', context: 'Low-confidence redirect infrastructure with no match in authentication telemetry.' },
];

const MODULE_FOUR_RELEVANT_EVIDENCE = [
  ...MODULE_FOUR_AUTH_EVENTS.filter((event) => event.relevant).map((event) => event.id),
  'TI-801',
];

const MODULE_FOUR_DEFAULT_STATE = {
  activeStation: '',
  reviewedStations: [],
  selectedEvidence: [],
  ruleGrouping: 'account-ip',
  ruleMetric: 'failure-count',
  ruleThreshold: '4',
  ruleRuns: 0,
  ruleRunResults: [],
  rulePassed: false,
  enrichedIndicator: '',
  intelAssessment: '',
  priority: '',
  ruleDisposition: '',
  automationChoice: '',
  automationRan: false,
  automationLog: [],
  hintsOpened: [],
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
};

let moduleFourState = null;
let moduleFourUser = null;

function moduleFourLoad(user) {
  moduleFourUser = user;
  moduleFourState = LabRuntime.load(MODULE_FOUR_LAB_ID, user, MODULE_FOUR_DEFAULT_STATE);
  ['reviewedStations', 'selectedEvidence', 'ruleRunResults', 'automationLog', 'hintsOpened', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleFourState[key])) moduleFourState[key] = [];
  });
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-04');
  return moduleFourState;
}

function moduleFourSave() {
  if (moduleFourUser && moduleFourState) LabRuntime.save(MODULE_FOUR_LAB_ID, moduleFourUser, moduleFourState);
}

function moduleFourRulePreview() {
  const group = moduleFourState.ruleGrouping === 'source-ip' ? 'SourceIp' : 'Account, SourceIp';
  const metric = moduleFourState.ruleMetric === 'distinct-accounts'
    ? 'targeted_accounts=dcount(Account)'
    : 'failures=count()';
  const field = moduleFourState.ruleMetric === 'distinct-accounts' ? 'targeted_accounts' : 'failures';
  return `AuthEvents\n| where Outcome == "Failed"\n| summarize ${metric} by ${group}, bin(TimeGenerated, 15m)\n| where ${field} >= ${moduleFourState.ruleThreshold}`;
}

function moduleFourEvaluateRule() {
  const failures = MODULE_FOUR_AUTH_EVENTS.filter((event) => event.outcome === 'Failed');
  const groups = new Map();
  failures.forEach((event) => {
    const key = moduleFourState.ruleGrouping === 'source-ip' ? event.ip : `${event.account}|${event.ip}`;
    if (!groups.has(key)) groups.set(key, { ip: event.ip, accounts: new Set(), eventIds: [] });
    const group = groups.get(key);
    group.accounts.add(event.account);
    group.eventIds.push(event.id);
  });
  const threshold = Number(moduleFourState.ruleThreshold);
  return [...groups.values()].filter((group) => {
    const value = moduleFourState.ruleMetric === 'distinct-accounts' ? group.accounts.size : group.eventIds.length;
    return value >= threshold;
  }).map((group) => ({
    ip: group.ip,
    accounts: [...group.accounts],
    failures: group.eventIds.length,
    eventIds: group.eventIds,
  }));
}

function moduleFourKicker(text) {
  return `<p class="m04-kicker">${esc(text)}</p>`;
}

function moduleFourProgressStrip() {
  const ruleDone = moduleFourState.ruleRuns > 0;
  const intelDone = Boolean(moduleFourState.enrichedIndicator);
  return `<div class="m04-progress-strip" aria-label="Lab progress">
    <span class="${ruleDone ? 'is-done' : ''}"><i class="${ruleDone ? 'ri-checkbox-circle-fill' : 'ri-settings-4-line'}" aria-hidden="true"></i> Test detection</span>
    <span class="${intelDone ? 'is-done' : ''}"><i class="${intelDone ? 'ri-checkbox-circle-fill' : 'ri-radar-line'}" aria-hidden="true"></i> Attach intelligence</span>
    <span class="${moduleFourState.automationRan ? 'is-done' : ''}"><i class="${moduleFourState.automationRan ? 'ri-checkbox-circle-fill' : 'ri-play-circle-line'}" aria-hidden="true"></i> Run automation</span>
    <span class="${moduleFourState.completed ? 'is-done' : ''}"><i class="${moduleFourState.completed ? 'ri-checkbox-circle-fill' : 'ri-file-text-line'}" aria-hidden="true"></i> Submit artifact</span>
  </div>`;
}

function moduleFourStationChooser() {
  const station = moduleFourState.activeStation;
  return `<section class="m04-station-chooser" aria-labelledby="m04-choose-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Choose your investigation order')}<h3 id="m04-choose-title" tabindex="-1">Two desks, one detection decision</h3></div><span>Both use local synthetic data</span></div>
    <p class="m04-instruction">Start with the rule or with the intelligence feed. You can switch at any time; the signposts tell you what must be ready before submission.</p>
    <div class="m04-station-buttons">
      <button type="button" data-m04-station="rule" class="${station === 'rule' ? 'is-active' : ''}" aria-pressed="${station === 'rule'}">
        <i class="ri-filter-3-line" aria-hidden="true"></i><span><strong>Detection logic desk</strong><small>Review 14 authentication events, tune two logic choices, and simulate the result.</small></span><em>${moduleFourState.ruleRuns ? `${moduleFourState.ruleRuns} test${moduleFourState.ruleRuns === 1 ? '' : 's'} run` : 'Not tested'}</em>
      </button>
      <button type="button" data-m04-station="intel" class="${station === 'intel' ? 'is-active' : ''}" aria-pressed="${station === 'intel'}">
        <i class="ri-radar-line" aria-hidden="true"></i><span><strong>Threat intelligence desk</strong><small>Compare four indicators and attach the one that adds useful alert context.</small></span><em>${moduleFourState.enrichedIndicator ? `${esc(moduleFourState.enrichedIndicator)} attached` : 'No indicator attached'}</em>
      </button>
    </div>
  </section>`;
}

function moduleFourEvidenceCheckbox(id, label) {
  const checked = moduleFourState.selectedEvidence.includes(id);
  return `<label class="m04-evidence-check"><input type="checkbox" data-m04-evidence value="${esc(id)}" ${checked ? 'checked' : ''} /><span>${esc(label)}</span></label>`;
}

function moduleFourAuthEvents() {
  return `<div class="m04-event-list" aria-label="Synthetic authentication events">
    ${MODULE_FOUR_AUTH_EVENTS.map((event) => `<article class="m04-event ${moduleFourState.selectedEvidence.includes(event.id) ? 'is-selected' : ''}">
      <div class="m04-event-select">${moduleFourEvidenceCheckbox(event.id, `Select ${event.id} as evidence`)}</div>
      <div class="m04-event-time"><time>${esc(event.time)}</time><span class="m04-outcome m04-outcome-${event.outcome.toLowerCase()}">${esc(event.outcome)}</span></div>
      <div class="m04-event-entity"><strong>${esc(event.account)}</strong><code>${esc(event.ip)}</code></div>
      <div class="m04-event-context"><span>${esc(event.device)} · ${esc(event.region)}</span><p>${esc(event.detail)}</p></div>
    </article>`).join('')}
  </div>`;
}

function moduleFourRuleResults() {
  if (!moduleFourState.ruleRuns) return `<div class="m04-empty-result" id="m04-rule-result" role="status">No local simulation has run. Change the logic or test the current rule to see which candidates it produces.</div>`;
  if (!moduleFourState.ruleRunResults.length) return `<div class="m04-empty-result" id="m04-rule-result" role="status" tabindex="-1"><strong>0 alert candidates</strong><span>This version is too restrictive for the available pattern. Review how the data is grouped and counted.</span></div>`;
  return `<div class="m04-rule-results" id="m04-rule-result" role="status" tabindex="-1" aria-live="polite">
    ${moduleFourState.ruleRunResults.map((result) => `<article class="${result.ip === '198.51.100.44' ? 'is-target' : 'is-noise'}"><strong>${esc(result.ip)}</strong><span>${result.failures} failures · ${result.accounts.length} distinct account${result.accounts.length === 1 ? '' : 's'}</span><small>${result.ip === '198.51.100.44' ? 'Distributed pattern with follow-on success' : 'Repeated retries against one account on a managed client'}</small></article>`).join('')}
  </div>`;
}

function moduleFourRuleStation() {
  return `<section class="m04-workbench" id="m04-station-panel" aria-labelledby="m04-rule-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Source 1 of 2 · authentication telemetry')}<h3 id="m04-rule-title" tabindex="-1">Detection logic desk</h3></div><span>14 records · one 15-minute window</span></div>
    <div class="m04-baseline">
      <i class="ri-alarm-warning-line" aria-hidden="true"></i><div><strong>Review finding: the current rule alerts on the wrong pattern.</strong><p>It groups by account and source, so five retries from a known managed client create an alert. One attempt across each of five accounts stays below its per-account threshold and is missed.</p></div>
    </div>
    <div class="m04-rule-grid">
      <div class="m04-rule-card">
        <div class="m04-rule-card-heading"><div>${moduleFourKicker('Editable miniature rule')}<h4>Password failures in 15 minutes</h4></div><span>Draft</span></div>
        <label for="m04-grouping">Group matching failures by</label>
        <select id="m04-grouping" name="ruleGrouping" data-m04-rule-control>
          <option value="account-ip" ${moduleFourState.ruleGrouping === 'account-ip' ? 'selected' : ''}>Account + source IP</option>
          <option value="source-ip" ${moduleFourState.ruleGrouping === 'source-ip' ? 'selected' : ''}>Source IP</option>
        </select>
        <label for="m04-metric">Trigger on</label>
        <select id="m04-metric" name="ruleMetric" data-m04-rule-control>
          <option value="failure-count" ${moduleFourState.ruleMetric === 'failure-count' ? 'selected' : ''}>Total failed events</option>
          <option value="distinct-accounts" ${moduleFourState.ruleMetric === 'distinct-accounts' ? 'selected' : ''}>Distinct targeted accounts</option>
        </select>
        <label for="m04-threshold">Threshold</label>
        <select id="m04-threshold" name="ruleThreshold" data-m04-rule-control>
          ${['3', '4', '6'].map((value) => `<option value="${value}" ${moduleFourState.ruleThreshold === value ? 'selected' : ''}>${value} or more</option>`).join('')}
        </select>
        <pre aria-label="Generated local detection query"><code>${esc(moduleFourRulePreview())}</code></pre>
        <button type="button" class="m04-primary" data-m04-run-rule><i class="ri-play-circle-line" aria-hidden="true"></i> Test against 14 events</button>
      </div>
      <div class="m04-rule-output">
        ${moduleFourKicker(`Simulation output · ${moduleFourState.ruleRuns} run${moduleFourState.ruleRuns === 1 ? '' : 's'}`)}
        <h4>Alert candidates</h4>
        ${moduleFourRuleResults()}
        <details class="m04-hint" data-m04-hint="rule">
          <summary>Need a tuning hint?</summary>
          <p>A spray is distributed across accounts. Ask which field should form the group and which count distinguishes five targets from five retries against one target.</p>
        </details>
      </div>
    </div>
    <div class="m04-subheading"><div><h4>Select alert-context evidence</h4><p>Choose the events that best explain the distributed pattern and its outcome. Benign sign-ins and one-account retries are deliberate distractors.</p></div><span><span data-m04-selected-count>${moduleFourState.selectedEvidence.length}</span> total artifacts selected</span></div>
    ${moduleFourAuthEvents()}
  </section>`;
}

function moduleFourIntelStation() {
  return `<section class="m04-workbench" id="m04-station-panel" aria-labelledby="m04-intel-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Source 2 of 2 · local intelligence snapshot')}<h3 id="m04-intel-title" tabindex="-1">Threat intelligence desk</h3></div><span>4 indicators · mixed relevance</span></div>
    <p class="m04-instruction">Compare exact value, status, freshness, confidence, and context. Intelligence can strengthen or weaken an assessment, but it does not replace the authentication evidence.</p>
    <div class="m04-intel-list">
      ${MODULE_FOUR_INTEL.map((indicator) => `<article class="m04-intel-card ${moduleFourState.enrichedIndicator === indicator.id ? 'is-attached' : ''}">
        <div class="m04-intel-top"><span>${esc(indicator.type)}</span><strong>${esc(indicator.id)}</strong></div>
        <code>${esc(indicator.value)}</code>
        <dl><div><dt>Confidence</dt><dd>${indicator.confidence}/100</dd></div><div><dt>Status</dt><dd>${esc(indicator.status)}</dd></div><div><dt>Last seen</dt><dd>${esc(indicator.lastSeen)}</dd></div></dl>
        <p>${esc(indicator.context)}</p>
        <div class="m04-intel-actions">${moduleFourEvidenceCheckbox(indicator.id, `Select ${indicator.id} as evidence`)}<button type="button" data-m04-enrich="${esc(indicator.id)}">${moduleFourState.enrichedIndicator === indicator.id ? 'Attached to alert' : 'Attach to alert'}</button></div>
      </article>`).join('')}
    </div>
    <details class="m04-hint" data-m04-hint="intel">
      <summary>Need an enrichment hint?</summary>
      <p>Start with an exact value from the suspicious authentication cluster. Prefer an active, recent indicator whose context describes the same behavior.</p>
    </details>
  </section>`;
}

function moduleFourOptionList(name, options) {
  return `<div class="m04-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleFourState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleFourAutomationPanel() {
  const options = [
    { id: 'enrich-escalate', label: 'Enrich, preserve, and escalate', help: 'Attach the indicator and event references, create a Tier 2 task, and keep disruptive identity action behind human approval.' },
    { id: 'auto-disable', label: 'Automatically disable every targeted account', help: 'This creates broad disruption before ownership and scope are validated.' },
    { id: 'close-no-action', label: 'Close after recording the indicator', help: 'Enrichment supports the detection; it does not justify ignoring the successful sign-in.' },
  ];
  return `<fieldset class="m04-fieldset"><legend><span>3</span> Choose and run a bounded automation</legend><p class="m04-help">The playbook runs locally. Favor repeatable evidence handling and an approval boundary for disruptive response.</p>${moduleFourOptionList('automationChoice', options)}
    <button type="button" class="m04-run-automation" data-m04-run-automation ${moduleFourState.automationChoice ? '' : 'disabled'}><i class="ri-play-circle-line" aria-hidden="true"></i> Run selected playbook</button>
    <div class="m04-automation-log" id="m04-automation-log" role="status" aria-live="polite" ${moduleFourState.automationLog.length ? 'tabindex="-1"' : ''}>
      ${moduleFourState.automationLog.length ? `<strong>Local run complete</strong><ol>${moduleFourState.automationLog.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>` : '<span>Select a playbook to enable the local run.</span>'}
    </div>
  </fieldset>`;
}

function moduleFourScorePanel() {
  if (moduleFourState.validationError) return `<div class="m04-validation" id="m04-score-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Finish the analyst artifact</strong><p>${esc(moduleFourState.validationError)}</p></div></div>`;
  if (!moduleFourState.attempts || !moduleFourState.breakdown) return `<div class="m04-score-empty" id="m04-score-feedback" role="status">Your artifact is scored on observation (25), analysis (30), decision (25), and communication (20). Passing score: ${MODULE_FOUR_PASSING_SCORE}.</div>`;
  const b = moduleFourState.breakdown;
  const passed = moduleFourState.score >= MODULE_FOUR_PASSING_SCORE;
  return `<section class="m04-score ${passed ? 'is-pass' : 'is-remediate'}" id="m04-score-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m04-score-title">
    <div class="m04-score-heading"><div>${moduleFourKicker(`Attempt ${moduleFourState.attempts} · best ${moduleFourState.bestScore}/100`)}<h3 id="m04-score-title">${moduleFourState.score}/100 — ${passed ? 'Detection package ready' : 'Use the findings to refine and retry'}</h3></div><span>${moduleFourState.score}</span></div>
    <div class="m04-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/25</strong><span>Observation</span><small>Authentication and intelligence evidence</small></div>
      <div><strong>${b.analysis}/30</strong><span>Analysis</span><small>Grouping, metric, threshold, test, interpretation</small></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span><small>Priority, rollout, and bounded automation</small></div>
      <div><strong>${b.communication}/20</strong><span>Communication</span><small>Gap, context, and recommendation</small></div>
    </div>
    <ul class="m04-feedback-list">${moduleFourState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m04-expert-model"><strong>Expert reasoning</strong><p>The original rule counted repeated failures per account, so a stale credential looked suspicious while a distributed spray stayed invisible. Grouping by source and counting distinct accounts surfaces the five-account pattern without the single-account retry noise. The later success and an active high-confidence indicator justify a High-priority escalation. Automation should preserve and enrich the case, while disruptive identity action remains approval-gated.</p></div>
  </section>`;
}

function moduleFourArtifact() {
  const ready = moduleFourState.ruleRuns > 0 && Boolean(moduleFourState.enrichedIndicator);
  if (!ready) return `<section class="m04-artifact-locked" aria-label="Detection package locked"><i class="ri-lock-line" aria-hidden="true"></i><div><strong>Detection package</strong><p>Run at least one rule simulation and attach one intelligence indicator. You may complete those desks in either order.</p></div></section>`;
  const assessmentOptions = [
    { id: 'corroborates', label: 'It corroborates the alert but is not proof by itself', help: 'Exact value, active status, freshness, and related behavior add confidence to the telemetry.' },
    { id: 'proves-attack', label: 'It proves every event is malicious', help: 'An indicator is context; event behavior and scope still require analysis.' },
    { id: 'unrelated', label: 'It has no bearing on this alert', help: 'That would be true for a nonmatching value, but not for an exact active match.' },
  ];
  const priorityOptions = [
    { id: 'high', label: 'High priority', help: 'A distributed pattern, successful sign-in, and current intelligence warrant prompt investigation.' },
    { id: 'medium', label: 'Medium priority', help: 'This understates the successful access and corroborating context.' },
    { id: 'informational', label: 'Informational only', help: 'The rule test produced actionable evidence, not a health event.' },
  ];
  const dispositionOptions = [
    { id: 'publish-monitored', label: 'Publish with monitoring and a rollback note', help: 'The tuned logic removes known noise and catches the intended pattern; a measured rollout checks new false positives.' },
    { id: 'keep-current', label: 'Keep the current account-based rule unchanged', help: 'That preserves the demonstrated miss and the known noisy match.' },
    { id: 'disable-rule', label: 'Disable password-failure detection entirely', help: 'One tuning defect does not justify losing coverage.' },
  ];
  return `<section class="m04-artifact" aria-labelledby="m04-artifact-title">
    <div class="m04-panel-heading"><div>${moduleFourKicker('Scored artifact · retry allowed')}<h3 id="m04-artifact-title">Complete the detection package</h3></div><span>No timer · ${MODULE_FOUR_PASSING_SCORE}/100 to pass</span></div>
    <form id="m04-assessment" novalidate>
      <fieldset class="m04-fieldset"><legend><span>1</span> Interpret the attached intelligence</legend>${moduleFourOptionList('intelAssessment', assessmentOptions)}</fieldset>
      <fieldset class="m04-fieldset"><legend><span>2A</span> Set the alert priority</legend>${moduleFourOptionList('priority', priorityOptions)}</fieldset>
      <fieldset class="m04-fieldset"><legend><span>2B</span> Decide how to deploy the rule</legend>${moduleFourOptionList('ruleDisposition', dispositionOptions)}</fieldset>
      ${moduleFourAutomationPanel()}
      <div class="m04-fieldset m04-note-field">
        <label for="m04-notes"><span>4</span><strong>Write the detection handoff</strong></label>
        <p class="m04-help" id="m04-note-help">In at least 100 characters, state the old detection gap, tuned logic, evidence and intelligence context, priority, and safe next action.</p>
        <textarea id="m04-notes" name="notes" rows="6" maxlength="1000" aria-describedby="m04-note-help m04-note-count" placeholder="The original rule missed… I tuned it to… Authentication and intelligence show… Recommend…">${esc(moduleFourState.notes)}</textarea>
        <p class="m04-note-count" id="m04-note-count"><span>${moduleFourState.notes.length}</span>/1000 characters</p>
      </div>
      <div class="m04-actions"><button type="submit" class="m04-primary"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score detection package</button><button type="button" class="m04-secondary" data-m04-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>
      ${moduleFourScorePanel()}
    </form>
  </section>`;
}

function moduleFourLabDynamic() {
  const station = moduleFourState.activeStation === 'rule'
    ? moduleFourRuleStation()
    : moduleFourState.activeStation === 'intel'
      ? moduleFourIntelStation()
      : `<section class="m04-start-panel" aria-label="Choose a starting desk"><i class="ri-route-line" aria-hidden="true"></i><div><strong>Choose either desk to begin.</strong><p>This assisted lab signposts the required outputs but leaves the investigation order to you.</p></div></section>`;
  return `${moduleFourProgressStrip()}${moduleFourStationChooser()}${station}${moduleFourArtifact()}`;
}

function viewModuleFour(user, program) {
  moduleFourLoad(user);
  const module = program.modules['soc-04'];
  const moduleLab = LABS.find((item) => item.key === MODULE_FOUR_CATALOG_LAB_KEY);
  return `<div class="m04-shell">
    <header class="m04-topbar">
      <a href="#/program/${esc(program.slug)}" class="m04-brand" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a>
      <div class="m04-top-actions"><span class="m04-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Local simulation · synthetic data</span><a href="#/program/${esc(program.slug)}" class="m04-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div>
    </header>
    <main class="m04-main">
      <section class="m04-hero" aria-labelledby="m04-title">
        <div>${moduleFourKicker(`Module 04 · ${formatInstructionalMinutes(module.durationMinutes)} · assisted workflow`)}<h1 id="m04-title">${esc(module.title)}</h1><p>Review and tune a noisy authentication rule, add relevant threat intelligence, and choose bounded automated monitoring that moves the alert forward without outrunning the evidence.</p><a href="#m04-lab" class="m04-hero-action"><i class="ri-equalizer-2-line" aria-hidden="true"></i> Open the detection studio</a></div>
        <dl class="m04-status" aria-label="Saved lab status"><div><dt>Objective</dt><dd>Tune one rule</dd></div><div><dt>Sources</dt><dd>Authentication + intel</dd></div><div><dt>Status</dt><dd id="m04-status">${moduleFourState.completed ? 'Complete' : moduleFourState.attempts || moduleFourState.ruleRuns ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>
      <section class="m04-objective" aria-labelledby="m04-objective-title"><i class="ri-focus-2-line" aria-hidden="true"></i><div>${moduleFourKicker('One measurable objective')}<h2 id="m04-objective-title">Tune a detection to catch one distributed password spray while excluding one benign retry pattern, then justify enrichment and bounded automation with at least ${MODULE_FOUR_PASSING_SCORE}/100.</h2></div></section>
      <section class="m04-section" aria-labelledby="m04-guide-title">
        <div class="m04-section-heading"><span>01</span><div>${moduleFourKicker('Detection field guide')}<h2 id="m04-guide-title">Balance coverage, fidelity, and action</h2></div></div>
        <div class="m04-guide-grid">
          <article><i class="ri-scan-2-line" aria-hidden="true"></i><h3>Coverage</h3><p>A rule should express the behavior you intend to see. Distributed activity can disappear when the wrong entity forms the group.</p></article>
          <article><i class="ri-sound-module-line" aria-hidden="true"></i><h3>Fidelity</h3><p>Test changes against suspicious and benign examples. A quieter rule is only better if it keeps the intended signal.</p></article>
          <article><i class="ri-shield-check-line" aria-hidden="true"></i><h3>Automation boundary</h3><p>Automate repeatable collection and routing. Keep disruptive steps behind approval until confidence and scope justify them.</p></article>
        </div>
      </section>
      <section class="m04-section m04-lab-section" id="m04-lab" aria-labelledby="m04-lab-title">
        <div class="m04-section-heading"><span>02</span><div>${moduleFourKicker(`${formatInstructionalMinutes(moduleLab.instructionalMinutes)} instructional lab`)}<h2 id="m04-lab-title">Detection studio: distributed sign-in failures</h2></div></div>
        <div class="m04-signposts" aria-label="Assisted lab signposts"><div><span>A</span>Inspect either source first</div><div><span>B</span>Test and enrich</div><div><span>C</span>Choose bounded action</div><div><span>D</span>Explain the package</div></div>
        <div class="m04-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This isolated surface contains one fictional rule, one authentication slice, and one intelligence snapshot. No other course environment or future-module evidence is reachable here.</p></div>
        <div id="m04-lab-dynamic">${moduleFourLabDynamic()}</div>
      </section>
    </main>
  </div>`;
}

function moduleFourScore() {
  const selected = new Set(moduleFourState.selectedEvidence);
  const correctAuth = MODULE_FOUR_AUTH_EVENTS.filter((event) => event.relevant && selected.has(event.id)).length;
  const intelEvidence = selected.has('TI-801') ? 7 : 0;
  const incorrect = moduleFourState.selectedEvidence.filter((id) => !MODULE_FOUR_RELEVANT_EVIDENCE.includes(id)).length;
  const observation = Math.max(0, Math.min(25, (correctAuth * 3) + intelEvidence - (incorrect * 2)));

  const grouping = moduleFourState.ruleGrouping === 'source-ip' ? 8 : 0;
  const metric = moduleFourState.ruleMetric === 'distinct-accounts' ? 8 : 0;
  const threshold = moduleFourState.ruleThreshold === '4' ? 4 : 0;
  const simulation = moduleFourState.rulePassed ? 5 : 0;
  const intelligence = moduleFourState.enrichedIndicator === 'TI-801' && moduleFourState.intelAssessment === 'corroborates' ? 5 : 0;
  const analysis = grouping + metric + threshold + simulation + intelligence;

  const priority = moduleFourState.priority === 'high' ? 8 : 0;
  const rollout = moduleFourState.ruleDisposition === 'publish-monitored' ? 7 : 0;
  const automation = moduleFourState.automationChoice === 'enrich-escalate' && moduleFourState.automationRan ? 10 : 0;
  const decision = priority + rollout + automation;

  const note = moduleFourState.notes.trim().toLowerCase();
  const noteLength = note.length >= 100 ? 6 : 0;
  const noteLogic = /(source|ip)/.test(note) && /(distinct|multiple|five|distributed)/.test(note) && /(account|spray)/.test(note) ? 5 : 0;
  const noteIntel = /(198\.51\.100\.44|ti-801)/.test(note) && /(indicator|intelligence|confidence|active)/.test(note) ? 5 : 0;
  const noteDecision = /(escalat|preserv|monitor|approval|human)/.test(note) ? 4 : 0;
  const communication = noteLength + noteLogic + noteIntel + noteDecision;
  const score = observation + analysis + decision + communication;

  return {
    score,
    breakdown: { observation, grouping, metric, threshold, simulation, intelligence, analysis, priority, rollout, automation, decision, communication },
    feedback: [
      observation === 25 ? 'Observation: You selected the six-event spray sequence and its exact active intelligence match without distractors.' : `Observation: ${correctAuth}/6 decisive authentication events and ${intelEvidence ? 'the' : 'no'} matching indicator selected; ${incorrect} distractor${incorrect === 1 ? '' : 's'} reduced fidelity.`,
      grouping && metric && threshold ? 'Rule logic: Correct. Source IP plus distinct-account count at four or more detects distribution and drops single-account retries.' : 'Rule logic: Group by source IP, count distinct targeted accounts, and keep the four-or-more threshold for this tested slice.',
      simulation ? 'Test: Correct. The tuned rule produces only 198.51.100.44 as an alert candidate.' : 'Test: Re-run after tuning until the suspicious source is the only candidate.',
      intelligence ? 'Enrichment: Correct. TI-801 is an exact, active, recent behavioral match that corroborates—but does not prove—the alert.' : 'Enrichment: Attach TI-801 and treat it as corroborating context, not standalone proof.',
      decision === 25 ? 'Decision: Correct. High priority, monitored rollout, and approval-bounded automation fit the evidence.' : 'Decision: Use High priority, publish with monitoring, and automate enrichment/preservation/escalation while gating disruptive action.',
      communication === 20 ? 'Communication: The handoff states the gap, tuned behavior, intelligence context, and safe recommendation.' : 'Communication: Include the old detection gap, source-IP/distinct-account tuning, TI-801 or its IP, and a monitored escalation recommendation.',
    ],
  };
}

function moduleFourRenderDynamic(focusId) {
  const root = document.getElementById('m04-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleFourLabDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleFourOpenStation(station) {
  moduleFourState.activeStation = station;
  if (!moduleFourState.reviewedStations.includes(station)) moduleFourState.reviewedStations.push(station);
  moduleFourSave();
  moduleFourRenderDynamic(station === 'rule' ? 'm04-rule-title' : 'm04-intel-title');
}

function wireModuleFourLab() {
  const root = document.getElementById('m04-lab-dynamic');
  if (!root || !moduleFourState) return;

  root.addEventListener('click', (event) => {
    const stationButton = event.target.closest('[data-m04-station]');
    if (stationButton) {
      moduleFourOpenStation(stationButton.dataset.m04Station);
      return;
    }

    if (event.target.closest('[data-m04-run-rule]')) {
      const results = moduleFourEvaluateRule();
      moduleFourState.ruleRuns += 1;
      moduleFourState.ruleRunResults = results;
      moduleFourState.rulePassed = moduleFourState.ruleGrouping === 'source-ip'
        && moduleFourState.ruleMetric === 'distinct-accounts'
        && moduleFourState.ruleThreshold === '4'
        && results.length === 1
        && results[0].ip === '198.51.100.44';
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderDynamic('m04-rule-result');
      return;
    }

    const enrichButton = event.target.closest('[data-m04-enrich]');
    if (enrichButton) {
      const id = enrichButton.dataset.m04Enrich;
      moduleFourState.enrichedIndicator = id;
      if (!moduleFourState.selectedEvidence.includes(id)) moduleFourState.selectedEvidence.push(id);
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderDynamic('m04-intel-title');
      return;
    }

    if (event.target.closest('[data-m04-run-automation]')) {
      if (!moduleFourState.automationChoice) return;
      moduleFourState.automationRan = true;
      if (moduleFourState.automationChoice === 'enrich-escalate') {
        moduleFourState.automationLog = ['Attached the selected indicator and confidence context.', 'Preserved six authentication-event references.', 'Created a High-priority Tier 2 review task.', 'Left session revocation and account action pending human approval.'];
      } else if (moduleFourState.automationChoice === 'auto-disable') {
        moduleFourState.automationLog = ['Simulated bulk account disable request.', 'Safety gate recorded: broad disruptive action requires analyst approval.', 'No account state was changed in this local lab.'];
      } else {
        moduleFourState.automationLog = ['Recorded the selected indicator.', 'Simulated alert closure request.', 'Safety gate recorded: successful access remains unresolved; no closure was applied.'];
      }
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderDynamic('m04-automation-log');
      return;
    }

    if (event.target.closest('[data-m04-reset]')) {
      if (!window.confirm('Reset only the Module 04 detection lab? Course progress and other labs will not be changed.')) return;
      moduleFourState = LabRuntime.reset(MODULE_FOUR_LAB_ID, moduleFourUser, MODULE_FOUR_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFourUser, 'soc-analyst', 'soc-04', MODULE_FOUR_CATALOG_LAB_KEY, false);
      const status = document.getElementById('m04-status');
      if (status) status.textContent = 'Not started';
      moduleFourRenderDynamic('m04-choose-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m04-evidence]')) {
      const next = new Set(moduleFourState.selectedEvidence);
      if (input.checked) next.add(input.value); else next.delete(input.value);
      moduleFourState.selectedEvidence = [...next];
      const clearedEnrichment = !input.checked && moduleFourState.enrichedIndicator === input.value;
      if (clearedEnrichment) moduleFourState.enrichedIndicator = '';
      moduleFourState.validationError = '';
      moduleFourSave();
      if (clearedEnrichment) {
        moduleFourRenderDynamic('m04-intel-title');
        return;
      }
      root.querySelectorAll('[data-m04-selected-count]').forEach((node) => { node.textContent = String(moduleFourState.selectedEvidence.length); });
      input.closest('.m04-event')?.classList.toggle('is-selected', input.checked);
      return;
    }
    if (input.matches('[data-m04-rule-control]')) {
      moduleFourState[input.name] = input.value;
      moduleFourState.rulePassed = false;
      moduleFourState.ruleRunResults = [];
      moduleFourState.validationError = '';
      moduleFourSave();
      moduleFourRenderDynamic(input.id);
      return;
    }
    if (['intelAssessment', 'priority', 'ruleDisposition', 'automationChoice'].includes(input.name)) {
      moduleFourState[input.name] = input.value;
      if (input.name === 'automationChoice') {
        moduleFourState.automationRan = false;
        moduleFourState.automationLog = [];
      }
      moduleFourState.validationError = '';
      moduleFourSave();
      if (input.name === 'automationChoice') moduleFourRenderDynamic();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleFourState.notes = event.target.value;
    const count = root.querySelector('#m04-note-count span');
    if (count) count.textContent = String(moduleFourState.notes.length);
    moduleFourSave();
  });

  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m04-hint]');
    if (!hint || !hint.open) return;
    const id = hint.dataset.m04Hint;
    if (!moduleFourState.hintsOpened.includes(id)) {
      moduleFourState.hintsOpened.push(id);
      moduleFourSave();
    }
  }, true);

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm04-assessment') return;
    event.preventDefault();
    moduleFourState.notes = event.target.elements.notes.value;
    const problems = [];
    if (moduleFourState.selectedEvidence.length < 6) problems.push('select at least six evidence artifacts across the two sources');
    if (!moduleFourState.ruleRuns) problems.push('run the rule simulation');
    if (!moduleFourState.enrichedIndicator) problems.push('attach an intelligence indicator');
    if (!moduleFourState.intelAssessment || !moduleFourState.priority || !moduleFourState.ruleDisposition) problems.push('answer all analysis and deployment questions');
    if (!moduleFourState.automationRan) problems.push('run the selected local playbook');
    if (moduleFourState.notes.trim().length < 100) problems.push('write a handoff of at least 100 characters');
    if (problems.length) {
      moduleFourState.validationError = `Before scoring, ${problems.join('; ')}.`;
      moduleFourSave();
      moduleFourRenderDynamic('m04-score-feedback');
      return;
    }

    const result = moduleFourScore();
    moduleFourState.attempts += 1;
    moduleFourState.score = result.score;
    moduleFourState.bestScore = Math.max(moduleFourState.bestScore || 0, result.score);
    moduleFourState.breakdown = result.breakdown;
    moduleFourState.feedback = result.feedback;
    moduleFourState.validationError = '';
    moduleFourState.lastSubmittedAt = new Date().toISOString();
    const passed = result.score >= MODULE_FOUR_PASSING_SCORE;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleFourUser, MODULE_FOUR_CATALOG_LAB_KEY, {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleFourState.attempts },
      });
    }
    if (passed) {
      moduleFourState.completed = true;
      if (!moduleFourState.flags.includes(MODULE_FOUR_FLAG)) moduleFourState.flags.push(MODULE_FOUR_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleFourUser, 'soc-analyst', 'soc-04', MODULE_FOUR_CATALOG_LAB_KEY);
    }
    moduleFourSave();
    const status = document.getElementById('m04-status');
    if (status) status.textContent = moduleFourState.completed ? 'Complete' : 'In progress';
    moduleFourRenderDynamic('m04-score-feedback');
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 4, moduleKey: 'soc-04',
  view: viewModuleFour, wire: wireModuleFourLab });

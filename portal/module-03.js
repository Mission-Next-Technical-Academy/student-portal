/* Module 03 — assisted SIEM alert triage and log correlation.
 * All telemetry, identities, systems, and outcomes are fictional and local-only.
 */

const MODULE_THREE_LAB_ID = 'm03-siem-signal-room-v1';
const MODULE_THREE_FLAG = 'M03-SIEM-CORRELATION-COMPLETE';
const MODULE_THREE_CATALOG_LAB_KEY = 'lab-siem-triage';

const MODULE_THREE_ALERTS = [
  {
    id: 'ALR-2038',
    title: 'Service account used from an analyst workstation',
    severity: 'Medium',
    created: '02:10',
    source: 'Identity correlation',
    summary: 'A non-interactive reporting identity authenticated from a workstation outside its normal host pattern.',
    target: true,
  },
  {
    id: 'ALR-2039',
    title: 'New browser observed for an enrolled user',
    severity: 'Low',
    created: '02:18',
    source: 'Access telemetry',
    summary: 'The device was enrolled earlier in the shift and the source network matches the learner-services office.',
  },
  {
    id: 'ALR-2040',
    title: 'Collector heartbeat delayed',
    severity: 'Low',
    created: '02:22',
    source: 'Platform health',
    summary: 'The collector resumed after an approved patch window; no security-event gap remains.',
  },
  {
    id: 'ALR-2041',
    title: 'High-volume archive reads',
    severity: 'Medium',
    created: '02:25',
    source: 'Application audit',
    summary: 'A registered backup job read 1,240 objects from its assigned repository during its normal schedule.',
  },
];

const MODULE_THREE_LOGS = [
  { id: 'EVT-300', time: '02:03:12', source: 'AuthLog', event: 'SignInSuccess', account: 'patch-agent', host: 'MGMT-02', ip: '10.44.7.11', result: 'Allowed', detail: 'Approved patch identity authenticated to its registered management host.', relevant: false },
  { id: 'EVT-301', time: '02:05:40', source: 'AppAudit', event: 'ArchiveStart', account: 'backup-job', host: 'STORE-04', ip: '10.44.6.14', result: 'Started', detail: 'Scheduled repository archive began under change record CHG-442.', relevant: false },
  { id: 'EVT-302', time: '02:07:14', source: 'AuthLog', event: 'SignInFailed', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Bad password', detail: 'Interactive attempt from a host not registered to this service identity.', relevant: true },
  { id: 'EVT-303', time: '02:08:02', source: 'AuthLog', event: 'SignInFailed', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Bad password', detail: 'Second failed attempt from the same workstation and source address.', relevant: true },
  { id: 'EVT-304', time: '02:09:31', source: 'AuthLog', event: 'SignInSuccess', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Allowed', detail: 'Interactive authentication succeeded; normal service host is APP-RPT-02.', relevant: true },
  { id: 'EVT-305', time: '02:12:09', source: 'DirectoryAudit', event: 'GroupMemberAdded', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Report-Admins', detail: 'The same session added the service identity to a privileged reporting group.', relevant: true },
  { id: 'EVT-306', time: '02:15:46', source: 'AppAudit', event: 'ConfigurationExport', account: 'svc_reports', host: 'WS-ADMIN-07', ip: '10.44.8.23', result: 'Completed', detail: 'Reporting configuration was exported three minutes after the group change.', relevant: true },
  { id: 'EVT-307', time: '02:18:21', source: 'AuthLog', event: 'SignInSuccess', account: 'acct-11', host: 'LAP-114', ip: '10.44.8.91', result: 'Allowed', detail: 'Enrolled user signed in from the learner-services office network.', relevant: false },
  { id: 'EVT-308', time: '02:20:10', source: 'SystemLog', event: 'ServiceRestart', account: 'system', host: 'COLLECT-01', ip: '10.44.5.10', result: 'Healthy', detail: 'Collector restarted under the approved patch change and resumed forwarding.', relevant: false },
  { id: 'EVT-309', time: '02:24:03', source: 'AppAudit', event: 'ArchiveRead', account: 'backup-job', host: 'STORE-04', ip: '10.44.6.14', result: '1,240 objects', detail: 'Archive volume matches the job baseline and registered source host.', relevant: false },
];

const MODULE_THREE_RELEVANT_IDS = MODULE_THREE_LOGS.filter((row) => row.relevant).map((row) => row.id);
const MODULE_THREE_CORRECT_TIMELINE = ['EVT-302', 'EVT-303', 'EVT-304', 'EVT-305', 'EVT-306'];

const MODULE_THREE_DEFAULT_STATE = {
  openedAlert: '',
  activeSource: 'All sources',
  selectedEvidence: [],
  queryDraft: 'UnifiedEvents\n| where SourceIp == ""\n| sort by TimeGenerated asc',
  queryRuns: 0,
  queryPassed: false,
  queryResultIds: [],
  queryFeedback: '',
  timelineOrder: ['', '', '', '', ''],
  analysis: '',
  verdict: '',
  action: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
};

let moduleThreeState = null;
let moduleThreeUser = null;

function moduleThreeLoad(user) {
  moduleThreeUser = user;
  moduleThreeState = LabRuntime.load(MODULE_THREE_LAB_ID, user, MODULE_THREE_DEFAULT_STATE);
  if (!Array.isArray(moduleThreeState.selectedEvidence)) moduleThreeState.selectedEvidence = [];
  if (!Array.isArray(moduleThreeState.queryResultIds)) moduleThreeState.queryResultIds = [];
  if (!Array.isArray(moduleThreeState.timelineOrder) || moduleThreeState.timelineOrder.length !== 5) {
    moduleThreeState.timelineOrder = ['', '', '', '', ''];
  }
  if (!Array.isArray(moduleThreeState.feedback)) moduleThreeState.feedback = [];
  if (!Array.isArray(moduleThreeState.flags)) moduleThreeState.flags = [];
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-03');
  return moduleThreeState;
}

function moduleThreeSave() {
  if (moduleThreeUser && moduleThreeState) LabRuntime.save(MODULE_THREE_LAB_ID, moduleThreeUser, moduleThreeState);
}

function moduleThreeAlertTone(severity) {
  return `m03-severity m03-severity-${String(severity).toLowerCase()}`;
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

function moduleThreeQueue() {
  return `<section class="m03-console-panel m03-queue-panel" aria-labelledby="m03-queue-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 1 · Alert orientation</p><h3 id="m03-queue-title" tabindex="-1">Compact alert queue</h3></div>
      <span class="m03-panel-count">4 current alerts</span>
    </div>
    <p class="m03-panel-instruction">ALR-2038 is assigned to you. The nearby rows are realistic queue context, not evidence from a shared storyline.</p>
    <div class="m03-alert-list">
      ${MODULE_THREE_ALERTS.map((alert) => {
        const isOpen = moduleThreeState.openedAlert === alert.id;
        return `<article class="m03-alert-row ${isOpen ? 'is-open' : ''}">
          <div class="m03-alert-id"><span class="${moduleThreeAlertTone(alert.severity)}">${esc(alert.severity)}</span><code>${esc(alert.id)}</code></div>
          <div><h4>${esc(alert.title)}</h4><p>${esc(alert.summary)}</p><small>${esc(alert.created)} · ${esc(alert.source)}</small></div>
          <button type="button" data-m03-alert="${esc(alert.id)}" aria-label="${isOpen ? 'Review' : 'Open'} ${esc(alert.id)}: ${esc(alert.title)}">${isOpen ? 'Reviewing' : 'Open'}</button>
        </article>`;
      }).join('')}
    </div>
    ${moduleThreeState.openedAlert ? moduleThreeAlertBrief() : `<div class="m03-coach-note"><i class="ri-user-voice-line" aria-hidden="true"></i><p><strong>Assisted prompt:</strong> Open the assigned alert, then use shared fields—not the title alone—to decide what belongs in its timeline.</p></div>`}
  </section>`;
}

function moduleThreeAlertBrief() {
  const alert = MODULE_THREE_ALERTS.find((item) => item.id === moduleThreeState.openedAlert);
  if (!alert) return '';
  if (!alert.target) {
    return `<div class="m03-alert-brief is-context" role="status">
      <i class="ri-information-line" aria-hidden="true"></i>
      <div><strong>${esc(alert.id)} is useful queue context.</strong><p>${esc(alert.summary)} Return to assigned alert ALR-2038 to perform the correlation exercise.</p></div>
    </div>`;
  }
  return `<div class="m03-alert-brief" role="status">
    <i class="ri-focus-3-line" aria-hidden="true"></i>
    <div><strong>Working question</strong><p>Was <code>svc_reports</code> performing normal service activity, or does the multi-source sequence justify escalation? Start with the source address <code>10.44.8.23</code> and a twenty-minute window.</p></div>
  </div>`;
}

function moduleThreeLogTable(rows) {
  const selected = new Set(moduleThreeState.selectedEvidence);
  return `<div class="m03-table-wrap">
    <table class="m03-log-table">
      <caption class="m03-visually-hidden">Synthetic normalized SIEM events available for evidence selection</caption>
      <thead><tr><th scope="col">Evidence</th><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Event</th><th scope="col">Account</th><th scope="col">Host</th><th scope="col">Source IP</th><th scope="col">Result</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr class="${selected.has(row.id) ? 'is-selected' : ''}">
          <td data-label="Evidence"><label class="m03-evidence-check"><input type="checkbox" data-m03-evidence value="${esc(row.id)}" ${selected.has(row.id) ? 'checked' : ''} /><span>${esc(row.id)}</span></label></td>
          <td data-label="Time"><time>${esc(row.time)}</time></td>
          <td data-label="Source"><span class="m03-source-pill">${esc(row.source)}</span></td>
          <td data-label="Event"><button type="button" class="m03-event-detail" data-m03-log-detail="${esc(row.id)}" aria-label="Show details for ${esc(row.id)}">${esc(row.event)}</button></td>
          <td data-label="Account"><code>${esc(row.account)}</code></td>
          <td data-label="Host"><code>${esc(row.host)}</code></td>
          <td data-label="Source IP"><code>${esc(row.ip)}</code></td>
          <td data-label="Result">${esc(row.result)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function moduleThreeExplorer() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') {
    return `<section class="m03-console-panel m03-locked" aria-label="Log explorer locked">
      <i class="ri-lock-line" aria-hidden="true"></i><div><strong>Log explorer</strong><p>Open assigned alert ALR-2038 to load its twenty-minute search window.</p></div>
    </section>`;
  }
  const sources = ['All sources', 'AuthLog', 'DirectoryAudit', 'AppAudit', 'SystemLog'];
  const visibleRows = moduleThreeState.activeSource === 'All sources'
    ? MODULE_THREE_LOGS
    : MODULE_THREE_LOGS.filter((row) => row.source === moduleThreeState.activeSource);
  const detail = MODULE_THREE_LOGS.find((row) => row.id === moduleThreeState.detailEvent);
  return `<section class="m03-console-panel" aria-labelledby="m03-explorer-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 2 · Observe</p><h3 id="m03-explorer-title">Normalized log explorer</h3></div>
      <span class="m03-panel-count"><span data-m03-selected-count>${moduleThreeState.selectedEvidence.length}</span>/5 evidence rows selected</span>
    </div>
    <p class="m03-panel-instruction">Compare account, host, source address, and time. Select exactly five rows that form the strongest correlated sequence; benign maintenance and user activity are mixed in.</p>
    <div class="m03-source-tabs" role="group" aria-label="Filter log source">
      ${sources.map((source) => `<button type="button" data-m03-source="${esc(source)}" aria-pressed="${moduleThreeState.activeSource === source}">${esc(source)}</button>`).join('')}
    </div>
    ${moduleThreeLogTable(visibleRows)}
    ${detail ? `<aside class="m03-row-detail" id="m03-row-detail" tabindex="-1" aria-label="Selected event details"><button type="button" data-m03-detail-close aria-label="Close event details"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m03-kicker">${esc(detail.id)} · ${esc(detail.source)}</p><strong>${esc(detail.event)}</strong><p>${esc(detail.detail)}</p></aside>` : ''}
  </section>`;
}

function moduleThreeRunQuery(query) {
  const text = String(query || '');
  const tableOk = /^\s*UnifiedEvents\b/i.test(text);
  const ipMatch = text.match(/where\s+SourceIp\s*==\s*["']([^"']+)["']/i);
  const requestedIp = ipMatch ? ipMatch[1] : '';
  const filterOk = requestedIp === '10.44.8.23';
  const sortOk = /\|\s*(?:sort|order)\s+by\s+TimeGenerated\s+asc\b/i.test(text);
  let rows = tableOk ? MODULE_THREE_LOGS.slice() : [];
  if (requestedIp) rows = rows.filter((row) => row.ip === requestedIp);
  if (sortOk) rows.sort((left, right) => left.time.localeCompare(right.time));
  return { tableOk, filterOk, sortOk, rows, passed: tableOk && filterOk && sortOk && rows.length === 5 };
}

function moduleThreeQueryResults() {
  if (!moduleThreeState.queryRuns) {
    return `<div class="m03-query-empty" id="m03-query-feedback" role="status">Run the query when the table, filter value, and chronological sort are ready.</div>`;
  }
  const rows = MODULE_THREE_LOGS.filter((row) => moduleThreeState.queryResultIds.includes(row.id));
  return `<div class="m03-query-feedback ${moduleThreeState.queryPassed ? 'is-pass' : 'is-hint'}" id="m03-query-feedback" role="status" tabindex="-1">
    <strong>${moduleThreeState.queryPassed ? 'Query objective met' : 'Query needs refinement'}</strong>
    <p>${esc(moduleThreeState.queryFeedback)}</p>
  </div>
  ${rows.length ? `<ol class="m03-query-results" aria-label="Query results">${rows.map((row) => `<li><time>${esc(row.time)}</time><span>${esc(row.event)}</span><code>${esc(row.account)}</code><code>${esc(row.ip)}</code></li>`).join('')}</ol>` : ''}`;
}

function moduleThreeQueryWorkbench() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') return '';
  return `<section class="m03-console-panel m03-query-panel" aria-labelledby="m03-query-title">
    <div class="m03-panel-heading">
      <div><p class="m03-kicker">Step 3 · Query</p><h3 id="m03-query-title">Correlation query workbench</h3></div>
      <span class="m03-panel-count">Runs saved: ${moduleThreeState.queryRuns}</span>
    </div>
    <div class="m03-query-layout">
      <div>
        <label for="m03-query-editor">Filter <code>UnifiedEvents</code> to the alert source IP and sort oldest first.</label>
        <textarea id="m03-query-editor" name="queryDraft" rows="5" spellcheck="false" aria-describedby="m03-query-help">${esc(moduleThreeState.queryDraft)}</textarea>
        <p id="m03-query-help">Supported subset: a table name, <code>where SourceIp == "value"</code>, and <code>sort by TimeGenerated asc</code>. Five rows should remain.</p>
        <button type="button" class="m03-run-query" data-m03-run-query><i class="ri-play-circle-line" aria-hidden="true"></i> Run local query</button>
      </div>
      <details class="m03-query-hint">
        <summary>Need a syntax hint?</summary>
        <p>Keep the first and last lines. Put the source address from the alert brief between the empty quotation marks on the middle line.</p>
      </details>
    </div>
    ${moduleThreeQueryResults()}
  </section>`;
}

function moduleThreeTimelineOptions(selectedId) {
  return `<option value="">Choose an event</option>${MODULE_THREE_RELEVANT_IDS.map((id) => {
    const row = MODULE_THREE_LOGS.find((item) => item.id === id);
    return `<option value="${esc(id)}" ${selectedId === id ? 'selected' : ''}>${esc(id)} · ${esc(row.time)} · ${esc(row.event)}</option>`;
  }).join('')}`;
}

function moduleThreeOptionList(name, options) {
  return `<div class="m03-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleThreeState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleThreeScorePanel() {
  if (moduleThreeState.validationError) {
    return `<div class="m03-validation" id="m03-score-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the investigation record</strong><p>${esc(moduleThreeState.validationError)}</p></div></div>`;
  }
  if (!moduleThreeState.attempts || !moduleThreeState.breakdown) {
    return `<div class="m03-score-empty" id="m03-score-feedback" role="status">Your submission is scored on observation (30), analysis (25), decision (25), and communication (20). Passing score: 80.</div>`;
  }
  const b = moduleThreeState.breakdown;
  const passed = moduleThreeState.score >= 80;
  return `<section class="m03-score ${passed ? 'is-pass' : 'is-remediate'}" id="m03-score-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m03-score-title">
    <div class="m03-score-heading"><div><p class="m03-kicker">Attempt ${moduleThreeState.attempts} · best ${moduleThreeState.bestScore}/100</p><h3 id="m03-score-title">${moduleThreeState.score}/100 — ${passed ? 'SIEM correlation complete' : 'Review, refine, and retry'}</h3></div><span>${moduleThreeState.score}</span></div>
    <div class="m03-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/30</strong><span>Observation</span><small>${b.evidence}/20 evidence · ${b.query}/10 query</small></div>
      <div><strong>${b.analysis}/25</strong><span>Analysis</span><small>${b.timeline}/10 timeline · ${b.interpretation}/15 meaning</small></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span><small>${b.verdict}/15 verdict · ${b.action}/10 next step</small></div>
      <div><strong>${b.communication}/20</strong><span>Communication</span><small>Length, evidence, and recommendation</small></div>
    </div>
    <ul class="m03-feedback-list">${moduleThreeState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m03-expert-model"><strong>Expert correlation</strong><p>The two failed attempts establish a lead, but the successful interactive sign-in is the pivot. The same account, workstation, and source address then appear in a privileged group change and a configuration export within six minutes. That tight entity-and-time chain outweighs the unrelated maintenance and backup rows and supports escalation as suspicious service-account misuse.</p></div>
  </section>`;
}

function moduleThreeArtifact() {
  if (moduleThreeState.openedAlert !== 'ALR-2038') return '';
  const analysisOptions = [
    { id: 'correlated-misuse', label: 'One correlated service-account misuse sequence', help: 'The account, workstation, source IP, and short time window connect the events.' },
    { id: 'approved-maintenance', label: 'Approved maintenance activity', help: 'The patch and collector events have change context, but they use different entities.' },
    { id: 'unrelated-noise', label: 'Five unrelated records that only share a time window', help: 'This ignores the repeated account, host, and source address.' },
  ];
  const verdictOptions = [
    { id: 'true-positive', label: 'True positive — suspicious service-account use', help: 'The alert is supported by a coherent multi-source sequence.' },
    { id: 'benign-positive', label: 'Benign positive — expected job behavior', help: 'This would require matching approved scope, host, and change context.' },
    { id: 'false-positive', label: 'False positive — the activity did not occur', help: 'The underlying authentication and audit records are present.' },
  ];
  const actionOptions = [
    { id: 'escalate-preserve', label: 'Escalate as High, preserve the five events, and request service-owner validation', help: 'This stays inside the evidence and gives the responder a proportional next step.' },
    { id: 'close-backup', label: 'Close the alert as the registered backup job', help: 'The backup rows have different account, host, and source address values.' },
    { id: 'block-subnet', label: 'Block the entire 10.44.8.0/24 subnet immediately', help: 'The evidence supports one workstation and account, not a disruptive subnet-wide action.' },
  ];
  return `<section class="m03-console-panel m03-artifact" aria-labelledby="m03-artifact-title">
    <div class="m03-panel-heading"><div><p class="m03-kicker">Steps 4–5 · Analyze, decide, communicate</p><h3 id="m03-artifact-title">Build the analyst handoff</h3></div><span class="m03-panel-count">Retry allowed · no timer</span></div>
    <form id="m03-assessment" novalidate>
      <fieldset class="m03-fieldset">
        <legend><span>4A</span> Put the five correlated events in chronological order</legend>
        <p class="m03-help">Each event may be used once. This timeline becomes the spine of your explanation.</p>
        <div class="m03-timeline-builder">
          ${moduleThreeState.timelineOrder.map((id, index) => `<label><span>${index + 1}</span><select name="timeline-${index}" data-m03-timeline="${index}" aria-label="Timeline position ${index + 1}">${moduleThreeTimelineOptions(id)}</select></label>`).join('')}
        </div>
      </fieldset>
      <fieldset class="m03-fieldset"><legend><span>4B</span> What does the sequence mean?</legend>${moduleThreeOptionList('analysis', analysisOptions)}</fieldset>
      <fieldset class="m03-fieldset"><legend><span>5A</span> What is your alert verdict?</legend>${moduleThreeOptionList('verdict', verdictOptions)}</fieldset>
      <fieldset class="m03-fieldset"><legend><span>5B</span> What is the safest next step?</legend>${moduleThreeOptionList('action', actionOptions)}</fieldset>
      <div class="m03-fieldset">
        <label class="m03-note-label" for="m03-case-note"><span>5C</span><strong>Write the handoff note</strong></label>
        <p class="m03-help" id="m03-note-help">In at least 80 characters, identify the alert or entity, summarize the correlated sequence, and state your recommended action.</p>
        <textarea id="m03-case-note" name="notes" rows="5" maxlength="900" aria-describedby="m03-note-help m03-note-count" placeholder="ALR-2038: Correlation shows… The shared account, host, and source address… Recommend…">${esc(moduleThreeState.notes)}</textarea>
        <p class="m03-note-count" id="m03-note-count"><span>${moduleThreeState.notes.length}</span>/900 characters</p>
      </div>
      <div class="m03-actions"><button type="submit" class="m03-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my handoff</button><button type="button" class="m03-reset" data-m03-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>
      ${moduleThreeScorePanel()}
    </form>
  </section>`;
}

function moduleThreeLabDynamic() {
  return `${moduleThreeQueue()}${moduleThreeExplorer()}${moduleThreeQueryWorkbench()}${moduleThreeArtifact()}`;
}

function viewModuleThree(user, program) {
  moduleThreeLoad(user);
  const complete = moduleThreeState.completed === true;
  return `<div class="m03-shell">
    <header class="m03-topbar">
      <a href="#/program/${esc(program.slug)}" class="m03-brand" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a>
      <div class="m03-top-actions"><span class="m03-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Local simulation · synthetic data</span><a href="#/program/${esc(program.slug)}" class="m03-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div>
    </header>
    <main class="m03-main">
      <section class="m03-hero" aria-labelledby="m03-title">
        <div><p class="m03-kicker">Module 03 · Core systems · assisted investigation</p><h1 id="m03-title">SIEM &amp; Log Analysis</h1><p>Use normalized telemetry to separate a suspicious service-account sequence from believable operational noise, then explain the evidence as a defensible analyst handoff.</p><a href="#m03-lab" class="m03-hero-action"><i class="ri-terminal-box-line" aria-hidden="true"></i> Enter the signal room</a></div>
        <dl class="m03-status" aria-label="Saved lab status"><div><dt>Primary objective</dt><dd>Correlate one alert</dd></div><div><dt>Dataset</dt><dd>10 events · 4 sources</dd></div><div><dt>Status</dt><dd id="m03-status">${complete ? 'Complete' : moduleThreeState.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>
      <section class="m03-objective" aria-labelledby="m03-objective-title"><i class="ri-focus-2-line" aria-hidden="true"></i><div><p class="m03-kicker">One measurable objective</p><h2 id="m03-objective-title">Correlate a suspicious alert into an accurate timeline and justify a proportionate triage decision with at least 80/100.</h2></div></section>
      <section class="m03-section" aria-labelledby="m03-guide-title"><div class="m03-section-heading"><span>01</span><div><p class="m03-kicker">Analyst field guide</p><h2 id="m03-guide-title">Read logs as linked observations</h2></div></div>${moduleThreeFieldGuide()}</section>
      <section class="m03-section m03-lab-section" id="m03-lab" aria-labelledby="m03-lab-title">
        <div class="m03-section-heading"><span>02</span><div><p class="m03-kicker">45-minute miniature lab</p><h2 id="m03-lab-title">Signal room: service-account correlation</h2></div></div>
        <div class="m03-runbook" aria-label="Assisted investigation runbook"><div><span>1</span>Open assigned alert</div><div><span>2</span>Select evidence</div><div><span>3</span>Run the query</div><div><span>4</span>Build timeline</div><div><span>5</span>Write handoff</div></div>
        <div class="m03-boundary"><i class="ri-shield-check-line" aria-hidden="true"></i><p><strong>Lab boundary:</strong> This surface contains one fictional case and the records needed to assess it. It does not expose another module, an enterprise environment, or a future incident storyline.</p></div>
        <div id="m03-lab-dynamic">${moduleThreeLabDynamic()}</div>
      </section>
    </main>
  </div>`;
}

function moduleThreeScore() {
  const correctEvidenceCount = moduleThreeState.selectedEvidence.filter((id) => MODULE_THREE_RELEVANT_IDS.includes(id)).length;
  const evidence = correctEvidenceCount * 4;
  const query = moduleThreeState.queryPassed ? 10 : 0;
  const timelineMatches = moduleThreeState.timelineOrder.filter((id, index) => id === MODULE_THREE_CORRECT_TIMELINE[index]).length;
  const timeline = timelineMatches * 2;
  const interpretation = moduleThreeState.analysis === 'correlated-misuse' ? 15 : 0;
  const verdict = moduleThreeState.verdict === 'true-positive' ? 15 : 0;
  const action = moduleThreeState.action === 'escalate-preserve' ? 10 : 0;
  const note = moduleThreeState.notes.trim().toLowerCase();
  const noteLength = note.length >= 80 ? 8 : 0;
  const noteEvidence = /(alr-2038|svc_reports|10\.44\.8\.23)/.test(note) && /(sign.?in|auth|group|privileg|export)/.test(note) ? 6 : 0;
  const noteDecision = /(escalat|preserv|validat|true positive|high)/.test(note) ? 6 : 0;
  const communication = noteLength + noteEvidence + noteDecision;
  const observation = evidence + query;
  const analysis = timeline + interpretation;
  const decision = verdict + action;
  const score = observation + analysis + decision + communication;
  return {
    score,
    breakdown: { evidence, query, observation, timeline, interpretation, analysis, verdict, action, decision, communication },
    feedback: [
      evidence === 20 ? 'Observation: All five source-matched events were selected; operational distractors were excluded.' : `Observation: ${correctEvidenceCount}/5 decisive events were selected. Match account, host, source IP, and the 02:07–02:15 window; exclude rows with other entities.`,
      query ? 'Query: Correct. The source-address filter returned five rows in chronological order.' : 'Query: Filter UnifiedEvents to SourceIp 10.44.8.23 and sort TimeGenerated ascending; run it before resubmitting.',
      timeline === 10 ? 'Timeline: Correct. Failed attempts precede success, followed by the group change and export.' : `Timeline: ${timelineMatches}/5 positions are correct. Sort the five evidence rows by their timestamps, oldest first.`,
      interpretation ? 'Analysis: Correct. Repeated shared entities and tight timing support one correlated misuse sequence.' : 'Analysis: The patch, collector, enrolled-user, and backup rows use different entities. The five svc_reports rows form the connected sequence.',
      verdict && action ? 'Decision: Correct. A true-positive escalation preserves evidence and seeks authorized service-owner validation.' : 'Decision: Classify the supported activity as a true positive and escalate the narrow account-and-workstation scope with preserved evidence.',
      communication === 20 ? 'Communication: The note identifies the case, describes evidence, and states a recommendation.' : 'Communication: Include a case/entity identifier, the authentication-to-privilege/export sequence, and an escalation or preservation recommendation in at least 80 characters.',
    ],
  };
}

function moduleThreeRenderDynamic(focusId) {
  const root = document.getElementById('m03-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleThreeLabDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleThreeLab() {
  const root = document.getElementById('m03-lab-dynamic');
  if (!root || !moduleThreeState) return;

  root.addEventListener('click', (event) => {
    const alertButton = event.target.closest('[data-m03-alert]');
    if (alertButton) {
      moduleThreeState.openedAlert = alertButton.dataset.m03Alert;
      moduleThreeState.detailEvent = '';
      moduleThreeState.validationError = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-queue-title');
      return;
    }

    const sourceButton = event.target.closest('[data-m03-source]');
    if (sourceButton) {
      moduleThreeState.activeSource = sourceButton.dataset.m03Source;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-explorer-title');
      return;
    }

    const detailButton = event.target.closest('[data-m03-log-detail]');
    if (detailButton) {
      moduleThreeState.detailEvent = detailButton.dataset.m03LogDetail;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-row-detail');
      return;
    }

    if (event.target.closest('[data-m03-detail-close]')) {
      moduleThreeState.detailEvent = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-explorer-title');
      return;
    }

    if (event.target.closest('[data-m03-run-query]')) {
      const editor = root.querySelector('#m03-query-editor');
      moduleThreeState.queryDraft = editor ? editor.value : moduleThreeState.queryDraft;
      const result = moduleThreeRunQuery(moduleThreeState.queryDraft);
      moduleThreeState.queryRuns += 1;
      moduleThreeState.queryPassed = result.passed;
      moduleThreeState.queryResultIds = result.rows.map((row) => row.id);
      const missing = [];
      if (!result.tableOk) missing.push('start with UnifiedEvents');
      if (!result.filterOk) missing.push('filter SourceIp to 10.44.8.23');
      if (!result.sortOk) missing.push('sort TimeGenerated ascending');
      moduleThreeState.queryFeedback = result.passed
        ? 'Five events share the alert source address. Their order shows failures, success, privilege change, and export.'
        : `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned. Next: ${missing.join('; ') || 'review the supported syntax'}.`;
      moduleThreeState.validationError = '';
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-query-feedback');
      return;
    }

    if (event.target.closest('[data-m03-reset]')) {
      if (!window.confirm('Reset only the Module 03 SIEM lab? Course progress and other labs will not be changed.')) return;
      moduleThreeState = LabRuntime.reset(MODULE_THREE_LAB_ID, moduleThreeUser, MODULE_THREE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY, false);
      const status = document.getElementById('m03-status');
      if (status) status.textContent = 'Not started';
      moduleThreeRenderDynamic('m03-queue-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-m03-evidence]')) {
      const next = new Set(moduleThreeState.selectedEvidence);
      if (input.checked) next.add(input.value); else next.delete(input.value);
      moduleThreeState.selectedEvidence = [...next];
      moduleThreeState.validationError = '';
      moduleThreeSave();
      root.querySelectorAll('[data-m03-selected-count]').forEach((node) => { node.textContent = String(moduleThreeState.selectedEvidence.length); });
      input.closest('tr')?.classList.toggle('is-selected', input.checked);
      return;
    }
    if (input.matches('[data-m03-timeline]')) {
      moduleThreeState.timelineOrder[Number(input.dataset.m03Timeline)] = input.value;
      moduleThreeState.validationError = '';
      moduleThreeSave();
      return;
    }
    if (['analysis', 'verdict', 'action'].includes(input.name)) {
      moduleThreeState[input.name] = input.value;
      moduleThreeState.validationError = '';
      moduleThreeSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'queryDraft') {
      moduleThreeState.queryDraft = event.target.value;
      moduleThreeState.queryPassed = false;
      moduleThreeState.queryResultIds = [];
      moduleThreeState.queryFeedback = '';
      moduleThreeSave();
      return;
    }
    if (event.target.name === 'notes') {
      moduleThreeState.notes = event.target.value;
      const count = root.querySelector('#m03-note-count span');
      if (count) count.textContent = String(moduleThreeState.notes.length);
      moduleThreeSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm03-assessment') return;
    event.preventDefault();
    moduleThreeState.notes = event.target.elements.notes.value;
    const uniqueTimeline = new Set(moduleThreeState.timelineOrder.filter(Boolean));
    const missingDecisions = ['analysis', 'verdict', 'action'].filter((name) => !moduleThreeState[name]);
    const problems = [];
    if (moduleThreeState.selectedEvidence.length !== 5) problems.push('select exactly five evidence rows');
    if (!moduleThreeState.queryRuns) problems.push('run the correlation query at least once');
    if (uniqueTimeline.size !== 5) problems.push('use five different events in the timeline');
    if (missingDecisions.length) problems.push('answer all three analysis and decision questions');
    if (moduleThreeState.notes.trim().length < 80) problems.push('write a handoff note of at least 80 characters');
    if (problems.length) {
      moduleThreeState.validationError = `Before scoring, ${problems.join('; ')}.`;
      moduleThreeSave();
      moduleThreeRenderDynamic('m03-score-feedback');
      return;
    }

    const result = moduleThreeScore();
    moduleThreeState.attempts += 1;
    moduleThreeState.score = result.score;
    moduleThreeState.bestScore = Math.max(moduleThreeState.bestScore || 0, result.score);
    moduleThreeState.breakdown = result.breakdown;
    moduleThreeState.feedback = result.feedback;
    moduleThreeState.validationError = '';
    moduleThreeState.lastSubmittedAt = new Date().toISOString();
    if (result.score >= 80) {
      moduleThreeState.completed = true;
      if (!moduleThreeState.flags.includes(MODULE_THREE_FLAG)) moduleThreeState.flags.push(MODULE_THREE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleThreeUser, 'soc-analyst', 'soc-03', MODULE_THREE_CATALOG_LAB_KEY);
    }
    moduleThreeSave();
    const status = document.getElementById('m03-status');
    if (status) status.textContent = moduleThreeState.completed ? 'Complete' : 'In progress';
    moduleThreeRenderDynamic('m03-score-feedback');
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 3, moduleKey: 'soc-03',
  view: viewModuleThree, wire: wireModuleThreeLab });

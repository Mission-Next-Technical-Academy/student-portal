/* Module 11 — independent SOC operations and communication practice.
 * All metrics, people, systems, and incident evidence are synthetic and local.
 */

const MODULE_ELEVEN_METRICS_LAB_ID = 'm11-soc-metrics-v1';
const MODULE_ELEVEN_REPORT_LAB_ID = 'm11-executive-report-v1';
const MODULE_ELEVEN_METRICS_CATALOG_KEY = 'lab-soc-metrics';
const MODULE_ELEVEN_REPORT_CATALOG_KEY = 'lab-exec-report';
const MODULE_ELEVEN_METRICS_FLAG = 'M11-SOC-METRICS-BRIEFED';
const MODULE_ELEVEN_REPORT_FLAG = 'M11-EXECUTIVE-REPORT-COMPLETE';
const MODULE_ELEVEN_PASSING_SCORE = 70;

const MODULE_ELEVEN_WEEKLY_METRICS = [
  { week: 'Week 27', alerts: 520, closed: 500, falsePositives: 320, mttd: 12, mttr: 98, sla: 96, backlog: 18, staffed: 6 },
  { week: 'Week 28', alerts: 610, closed: 590, falsePositives: 390, mttd: 14, mttr: 110, sla: 93, backlog: 25, staffed: 6 },
  { week: 'Week 29', alerts: 740, closed: 680, falsePositives: 480, mttd: 19, mttr: 154, sla: 84, backlog: 58, staffed: 5 },
  { week: 'Week 30', alerts: 705, closed: 650, falsePositives: 465, mttd: 21, mttr: 171, sla: 78, backlog: 76, staffed: 5 },
];

const MODULE_ELEVEN_METRIC_EVIDENCE = [
  { id: 'MET-1101', label: 'Alert volume', value: '+36% since Week 27', detail: 'Weekly alerts rose from 520 to 705. Volume peaked at 740 in Week 29.', relevant: false },
  { id: 'MET-1102', label: 'Mean time to detect', value: '12 → 21 minutes', detail: 'MTTD worsened by 75%, showing that actionable activity is waiting longer for initial analyst recognition.', relevant: true },
  { id: 'MET-1103', label: 'Mean time to respond', value: '98 → 171 minutes', detail: 'MTTR rose 73 minutes. This is a response-speed signal, not proof that each case caused greater business impact.', relevant: true },
  { id: 'MET-1104', label: 'Priority SLA met', value: '96% → 78%', detail: 'The team fell below its 90% target in Weeks 29 and 30, so the operational risk requires escalation.', relevant: true },
  { id: 'MET-1105', label: 'Open alert backlog', value: '18 → 76 alerts', detail: 'Backlog more than quadrupled, including nine high-priority alerts older than the response target.', relevant: true },
  { id: 'MET-1106', label: 'Noisy rule contribution', value: '287 false positives', detail: 'The “Unfamiliar travel” rule generated 342 Week 30 alerts; 287 were validated false positives after a remote-access change.', relevant: true },
  { id: 'MET-1107', label: 'Scheduled staffing', value: '5 of 6 analysts', detail: 'One planned absence reduced capacity in Weeks 29 and 30. It contributes to pressure but does not explain the concentrated rule noise by itself.', relevant: false },
  { id: 'MET-1108', label: 'Platform availability', value: '99.98%', detail: 'The queue and case platform remained available throughout the period. Availability is healthy and does not explain the degraded handling times.', relevant: false },
];

const MODULE_ELEVEN_RULE_METRICS = [
  { rule: 'Unfamiliar travel', alerts: 342, truePositive: 31, falsePositive: 287, pending: 24, medianAge: '74 min' },
  { rule: 'Unsigned script from document', alerts: 96, truePositive: 43, falsePositive: 48, pending: 5, medianAge: '29 min' },
  { rule: 'Privileged role change', alerts: 54, truePositive: 17, falsePositive: 35, pending: 2, medianAge: '18 min' },
  { rule: 'Known test scanner', alerts: 128, truePositive: 0, falsePositive: 128, pending: 0, medianAge: 'Closed' },
  { rule: 'Outbound beacon pattern', alerts: 85, truePositive: 29, falsePositive: 50, pending: 6, medianAge: '41 min' },
];

const MODULE_ELEVEN_CASE_EVENTS = [
  { id: 'CASE-1101', time: '11:02', source: 'Endpoint', title: 'Attachment launched an unsigned script', detail: 'On NB-44, employee-44 opened Benefits_Adjustment.zip from an external message. document-reader.exe then spawned unsigned script-host.exe.', relevant: true },
  { id: 'CASE-1102', time: '11:04', source: 'Network', title: 'NB-44 contacted an unapproved destination', detail: 'The script created a TLS session to documentation address 203.0.113.211. The destination is not used by an approved service in this case slice.', relevant: true },
  { id: 'CASE-1103', time: '11:08', source: 'Identity', title: 'Unfamiliar token refresh for acct-44', detail: 'An unmanaged client refreshed acct-44 from 203.0.113.211, correlating the identity activity with the endpoint destination.', relevant: true },
  { id: 'CASE-1104', time: '11:12', source: 'Detection', title: 'Incident CASE-11-27 declared', detail: 'The analyst correlated the endpoint, network, and identity records and classified the incident as a confirmed compromise.', relevant: false },
  { id: 'CASE-1105', time: '11:19', source: 'Response', title: 'NB-44 isolated', detail: 'Endpoint operations isolated the affected notebook through the approved playbook while preserving responder access.', relevant: true },
  { id: 'CASE-1106', time: '11:23', source: 'Response', title: 'acct-44 sessions revoked', detail: 'Identity operations revoked active sessions and temporarily disabled the account pending credential and MFA review.', relevant: true },
  { id: 'CASE-1107', time: '11:41', source: 'Endpoint', title: 'Persistence removed and scan completed', detail: 'Responders removed the startup entry and payload. An approved full scan completed with no additional malicious artifact.', relevant: false },
  { id: 'CASE-1108', time: '12:18', source: 'Recovery', title: 'Credential and MFA review completed', detail: 'The account password was reset, registered MFA methods were validated, and the account was re-enabled under enhanced monitoring.', relevant: false },
  { id: 'CASE-1109', time: '12:42', source: 'Recovery', title: 'Endpoint restored after validation', detail: 'NB-44 passed health checks and returned to service. Monitoring found no repeat indicator on the affected entities.', relevant: true },
  { id: 'CASE-1110', time: '13:05', source: 'Scope', title: 'No sensitive access or lateral movement observed', detail: 'The scoped identity, repository, endpoint, and network searches found no sensitive-repository access or second affected host. This does not prove organization-wide absence.', relevant: true },
  { id: 'CASE-1111', time: '13:10', source: 'Business', title: 'Operational impact recorded', detail: 'One employee and one managed notebook were affected. The employee used a loaner for 83 minutes; no customer-facing service was interrupted.', relevant: false },
];

let moduleElevenMetricsState = null;
let moduleElevenReportState = null;
let moduleElevenUser = null;
let moduleElevenActiveLab = 'metrics';

function moduleElevenMetricsFreshDefaults() {
  return {
    selectedEvidence: [], reviewedMetrics: [], primaryCause: '', trendConclusion: '', action: '', escalation: '',
    notes: '', breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenReportFreshDefaults() {
  return {
    selectedEvidence: [], reviewedEvents: [], activeEvent: '', classification: '', rootCause: '', impact: '',
    escalation: '', closure: '', caseNote: '', executiveSummary: '', breakdown: null, feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleElevenLoad(user) {
  moduleElevenUser = user;
  moduleElevenMetricsState = LabRuntime.load(MODULE_ELEVEN_METRICS_LAB_ID, user, moduleElevenMetricsFreshDefaults());
  moduleElevenReportState = LabRuntime.load(MODULE_ELEVEN_REPORT_LAB_ID, user, moduleElevenReportFreshDefaults());
  ['selectedEvidence', 'reviewedMetrics', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenMetricsState[key])) moduleElevenMetricsState[key] = [];
  });
  ['selectedEvidence', 'reviewedEvents', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleElevenReportState[key])) moduleElevenReportState[key] = [];
  });
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-11');
}

function moduleElevenSaveMetrics() {
  if (moduleElevenUser && moduleElevenMetricsState) LabRuntime.save(MODULE_ELEVEN_METRICS_LAB_ID, moduleElevenUser, moduleElevenMetricsState);
}

function moduleElevenSaveReport() {
  if (moduleElevenUser && moduleElevenReportState) LabRuntime.save(MODULE_ELEVEN_REPORT_LAB_ID, moduleElevenUser, moduleElevenReportState);
}

function moduleElevenStatus(state) {
  if (state.completed) return 'Complete';
  if (state.attempts || state.selectedEvidence.length || state.notes || state.caseNote || state.executiveSummary) return 'In progress';
  return 'Not started';
}

function moduleElevenLabSwitcher() {
  const labs = [
    { key: 'metrics', number: 'Lab 1', title: 'SOC Metrics Dashboard', state: moduleElevenMetricsState, icon: 'ri-line-chart-line' },
    { key: 'report', number: 'Lab 2', title: 'Executive Incident Report', state: moduleElevenReportState, icon: 'ri-file-chart-line' },
  ];
  return `<nav class="m11-lab-switcher" aria-label="Module 11 labs">${labs.map((lab) => `<button type="button" data-m11-lab="${lab.key}" aria-current="${moduleElevenActiveLab === lab.key ? 'page' : 'false'}"><i class="${lab.icon}" aria-hidden="true"></i><span><small>${lab.number}</small>${lab.title}</span><strong class="${lab.state.completed ? 'is-complete' : ''}">${moduleElevenStatus(lab.state)}</strong></button>`).join('')}</nav>`;
}

function moduleElevenRadio(name, legend, options, state) {
  return `<fieldset class="m11-fieldset"><legend>${esc(legend)}</legend><div class="m11-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${state[name] === option.id ? 'checked' : ''} /><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`;
}

function moduleElevenScorePanel(state, kind) {
  if (state.validationError) return `<div class="m11-validation" id="m11-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Submission is incomplete</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m11-score-empty" id="m11-feedback" role="status">Submit the completed deliverable for an explainable score. Work is saved locally as you go.</div>`;
  const passed = state.score >= MODULE_ELEVEN_PASSING_SCORE;
  const b = state.breakdown;
  const model = kind === 'metrics'
    ? 'MTTD rose from 12 to 21 minutes, MTTR from 98 to 171 minutes, SLA attainment fell to 78%, and backlog reached 76. The main controllable driver is the noisy Unfamiliar travel rule after the access change, amplified by one planned absence. Escalate the SLA risk to the duty manager and detection owner, test a scoped tuning change, and assign the next shift to work the nine aging high-priority alerts.'
    : 'CASE-11-27 was a confirmed compromise limited by current evidence to NB-44 and acct-44. An external archive led to unsigned script execution, a correlated destination, and an unfamiliar session. The host was isolated, sessions revoked, persistence removed, credentials reviewed, and service restored after validation. No sensitive access or lateral movement was observed in the scoped data. Close only with 24-hour monitoring and a named control-improvement owner.';
  return `<section class="m11-score ${passed ? 'is-pass' : 'is-remediate'}" id="m11-feedback" tabindex="-1" aria-live="polite"><div class="m11-score-heading"><div><p class="m11-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3>${state.score}/100 — ${passed ? 'Deliverable accepted' : 'Revise and resubmit'}</h3></div><span>${state.score}</span></div><div class="m11-score-grid"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/30</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul>${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m11-remediation"><strong>Reference model</strong><p>${esc(model)}</p></div></section>`;
}

function moduleElevenMetricsDataset() {
  return `<section class="m11-dataset" aria-labelledby="m11-metrics-data-title"><div class="m11-dataset-heading"><div><p class="m11-kicker">Synthetic dataset · four weekly snapshots</p><h3 id="m11-metrics-data-title">SOC performance and queue health</h3></div><span>Target: ≥90% priority SLA</span></div>
    <div class="m11-table-wrap"><table class="m11-data-table"><caption class="m11-visually-hidden">Weekly synthetic SOC metrics</caption><thead><tr><th scope="col">Period</th><th scope="col">Alerts</th><th scope="col">Closed</th><th scope="col">False positives</th><th scope="col">MTTD</th><th scope="col">MTTR</th><th scope="col">Priority SLA</th><th scope="col">Backlog</th><th scope="col">Staffed</th></tr></thead><tbody>${MODULE_ELEVEN_WEEKLY_METRICS.map((row) => `<tr><th scope="row">${row.week}</th><td>${row.alerts}</td><td>${row.closed}</td><td>${row.falsePositives}</td><td>${row.mttd} min</td><td>${row.mttr} min</td><td class="${row.sla < 90 ? 'is-risk' : ''}">${row.sla}%</td><td class="${row.backlog > 50 ? 'is-risk' : ''}">${row.backlog}</td><td>${row.staffed}/6</td></tr>`).join('')}</tbody></table></div>
    <div class="m11-metric-cards">${MODULE_ELEVEN_METRIC_EVIDENCE.map((item) => { const checked = moduleElevenMetricsState.selectedEvidence.includes(item.id); return `<label class="${checked ? 'is-selected' : ''}"><input type="checkbox" name="metricsEvidence" value="${item.id}" ${checked ? 'checked' : ''} /><span><small>${item.id} · ${item.label}</small><strong>${item.value}</strong><em>${item.detail}</em></span></label>`; }).join('')}</div>
    <div class="m11-table-wrap m11-rule-table"><table class="m11-data-table"><caption>Week 30 alert-rule distribution</caption><thead><tr><th scope="col">Rule</th><th scope="col">Alerts</th><th scope="col">True positive</th><th scope="col">False positive</th><th scope="col">Pending</th><th scope="col">Median age</th></tr></thead><tbody>${MODULE_ELEVEN_RULE_METRICS.map((row) => `<tr><th scope="row">${row.rule}</th><td>${row.alerts}</td><td>${row.truePositive}</td><td>${row.falsePositive}</td><td>${row.pending}</td><td>${row.medianAge}</td></tr>`).join('')}</tbody></table></div>
  </section>`;
}

function moduleElevenMetricsForm() {
  return `<form class="m11-deliverable" id="m11-metrics-form" novalidate aria-labelledby="m11-metrics-deliverable-title"><div class="m11-deliverable-heading"><div><p class="m11-kicker">Scored deliverable</p><h3 id="m11-metrics-deliverable-title">Operations brief and shift handoff</h3></div><span>Pass ${MODULE_ELEVEN_PASSING_SCORE}/100</span></div>
    <div class="m11-form-grid">
      ${moduleElevenRadio('primaryCause', 'Primary operational driver', [
        { id: 'rule-capacity', label: 'Concentrated Unfamiliar travel false positives, amplified by reduced capacity' },
        { id: 'platform-outage', label: 'Case-platform availability failure' },
        { id: 'incident-impact', label: 'Every alert became a higher-impact incident' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('trendConclusion', 'Defensible performance conclusion', [
        { id: 'degrading', label: 'Detection and response speed degraded while backlog and SLA risk increased' },
        { id: 'healthy', label: 'Operations improved because more alerts were closed' },
        { id: 'breach-proof', label: 'The metrics prove an enterprise-wide breach occurred' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('action', 'Recommended action', [
        { id: 'tune-prioritize', label: 'Test scoped rule tuning and assign aging high-priority alerts for immediate review' },
        { id: 'disable-detection', label: 'Disable all identity detections until backlog reaches zero' },
        { id: 'close-backlog', label: 'Bulk-close the backlog as false positive without case review' },
      ], moduleElevenMetricsState)}
      ${moduleElevenRadio('escalation', 'Escalation path', [
        { id: 'duty-detection', label: 'Notify the SOC duty manager and detection owner with SLA impact, owner, and review time' },
        { id: 'no-escalation', label: 'Keep the trend within the current shift because availability is healthy' },
        { id: 'public-notice', label: 'Issue a public incident statement based only on queue metrics' },
      ], moduleElevenMetricsState)}
    </div>
    <label class="m11-text-label" for="m11-metrics-notes">Shift handoff</label><p class="m11-field-help">Write for the incoming SOC lead. Include quantified trend, operational risk, assigned action and owner, and what the next shift must verify.</p><textarea id="m11-metrics-notes" name="notes" rows="6" maxlength="1200">${esc(moduleElevenMetricsState.notes)}</textarea><div class="m11-text-meta"><span id="m11-metrics-count">${moduleElevenMetricsState.notes.length}/1200</span><span>Minimum 160 characters</span></div>
    <div class="m11-actions"><button class="m11-submit" type="submit"><i class="ri-send-plane-line" aria-hidden="true"></i> Submit operations brief</button><button class="m11-reset" type="button" data-m11-reset="metrics"><i class="ri-restart-line" aria-hidden="true"></i> Reset metrics lab only</button></div>${moduleElevenScorePanel(moduleElevenMetricsState, 'metrics')}
  </form>`;
}

function moduleElevenMetricsLab() {
  return `<article class="m11-lab" aria-labelledby="m11-metrics-title"><header class="m11-casebar"><div><p class="m11-kicker">Lab 1 · ${MODULE_ELEVEN_METRICS_CATALOG_KEY} · independent</p><h2 id="m11-metrics-title" tabindex="-1">SOC Metrics Dashboard</h2><p><strong>Objective:</strong> Diagnose the material operating trend, recommend a proportionate improvement, escalate the service risk, and leave the incoming shift an evidence-based handoff.</p></div><dl><div><dt>Dataset</dt><dd>4 weeks</dd></div><div><dt>Role</dt><dd>Shift lead</dd></div><div><dt>Status</dt><dd>${moduleElevenStatus(moduleElevenMetricsState)}</dd></div></dl></header>${moduleElevenMetricsDataset()}${moduleElevenMetricsForm()}</article>`;
}

function moduleElevenCaseDataset() {
  const active = MODULE_ELEVEN_CASE_EVENTS.find((item) => item.id === moduleElevenReportState.activeEvent);
  return `<section class="m11-dataset" aria-labelledby="m11-case-data-title"><div class="m11-dataset-heading"><div><p class="m11-kicker">Synthetic dataset · CASE-11-27</p><h3 id="m11-case-data-title">Technical case record</h3></div><span>Closed-loop review</span></div>
    <div class="m11-case-summary"><dl><div><dt>Initial severity</dt><dd>High</dd></div><div><dt>Current state</dt><dd>Recovered</dd></div><div><dt>Affected</dt><dd>NB-44 · acct-44</dd></div><div><dt>Monitoring</dt><dd>24 hours required</dd></div></dl></div>
    <div class="m11-table-wrap"><table class="m11-data-table m11-case-table"><caption class="m11-visually-hidden">Synthetic CASE-11-27 timeline</caption><thead><tr><th scope="col">Use</th><th scope="col">Time</th><th scope="col">Source</th><th scope="col">Case event</th><th scope="col">Detail</th></tr></thead><tbody>${MODULE_ELEVEN_CASE_EVENTS.map((item) => { const selected = moduleElevenReportState.selectedEvidence.includes(item.id); return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Use"><label class="m11-evidence-check"><input type="checkbox" name="reportEvidence" value="${item.id}" ${selected ? 'checked' : ''} /><span>${item.id}</span></label></td><td data-label="Time"><time>${item.time}</time></td><td data-label="Source">${item.source}</td><td data-label="Case event"><strong>${item.title}</strong></td><td data-label="Detail"><button type="button" class="m11-inspect" data-m11-event="${item.id}" aria-expanded="${active?.id === item.id}">${active?.id === item.id ? 'Hide' : 'Inspect'}</button></td></tr>`; }).join('')}</tbody></table></div>
    ${active ? `<aside class="m11-event-detail" id="m11-event-detail" tabindex="-1"><div><p class="m11-kicker">${active.id} · ${active.time} · ${active.source}</p><strong>${active.title}</strong><p>${active.detail}</p></div><button type="button" data-m11-close-event aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}
  </section>`;
}

function moduleElevenReportForm() {
  return `<form class="m11-deliverable" id="m11-report-form" novalidate aria-labelledby="m11-report-deliverable-title"><div class="m11-deliverable-heading"><div><p class="m11-kicker">Scored deliverable</p><h3 id="m11-report-deliverable-title">Case note, executive report, escalation and closure</h3></div><span>Pass ${MODULE_ELEVEN_PASSING_SCORE}/100</span></div>
    <div class="m11-form-grid m11-form-grid-three">
      ${moduleElevenRadio('classification', 'Case classification', [{ id: 'confirmed', label: 'Confirmed endpoint and identity compromise' }, { id: 'benign', label: 'Benign user activity' }, { id: 'enterprise', label: 'Confirmed enterprise-wide compromise' }], moduleElevenReportState)}
      ${moduleElevenRadio('rootCause', 'Root cause', [{ id: 'archive-script', label: 'External archive opened; content process spawned an unsigned script' }, { id: 'sensor', label: 'Endpoint sensor caused the incident' }, { id: 'password', label: 'Password age alone caused the activity' }], moduleElevenReportState)}
      ${moduleElevenRadio('impact', 'Impact statement', [{ id: 'bounded', label: 'One user and notebook; temporary disruption; no observed sensitive access or lateral movement in scope' }, { id: 'none', label: 'No impact because the endpoint was restored' }, { id: 'all-data', label: 'All organizational data was exfiltrated' }], moduleElevenReportState)}
      ${moduleElevenRadio('escalation', 'Escalation record', [{ id: 'incident-owners', label: 'Incident manager plus endpoint and identity owners, with evidence and requested actions' }, { id: 'none', label: 'No escalation because containment completed' }, { id: 'broadcast', label: 'Send unverified technical detail to all employees' }], moduleElevenReportState)}
      ${moduleElevenRadio('closure', 'Closure decision', [{ id: 'verified-monitor', label: 'Close after verified recovery, 24-hour monitoring, and an assigned control-improvement owner' }, { id: 'contained', label: 'Close immediately when isolation succeeds' }, { id: 'never', label: 'Keep the case open permanently despite verified recovery' }], moduleElevenReportState)}
    </div>
    <div class="m11-writing-grid"><div><label class="m11-text-label" for="m11-case-note">Technical case note</label><p class="m11-field-help">Record time, affected entities, evidence, actions, current scope or uncertainty, and ownership.</p><textarea id="m11-case-note" name="caseNote" rows="7" maxlength="1400">${esc(moduleElevenReportState.caseNote)}</textarea><div class="m11-text-meta"><span id="m11-case-count">${moduleElevenReportState.caseNote.length}/1400</span><span>Minimum 180 characters</span></div></div><div><label class="m11-text-label" for="m11-exec-summary">Executive summary</label><p class="m11-field-help">State business impact, current status, residual risk, and the next accountable action in plain language.</p><textarea id="m11-exec-summary" name="executiveSummary" rows="7" maxlength="1400">${esc(moduleElevenReportState.executiveSummary)}</textarea><div class="m11-text-meta"><span id="m11-exec-count">${moduleElevenReportState.executiveSummary.length}/1400</span><span>Minimum 160 characters</span></div></div></div>
    <div class="m11-actions"><button class="m11-submit" type="submit"><i class="ri-send-plane-line" aria-hidden="true"></i> Submit incident report</button><button class="m11-reset" type="button" data-m11-reset="report"><i class="ri-restart-line" aria-hidden="true"></i> Reset report lab only</button></div>${moduleElevenScorePanel(moduleElevenReportState, 'report')}
  </form>`;
}

function moduleElevenReportLab() {
  return `<article class="m11-lab" aria-labelledby="m11-report-title"><header class="m11-casebar"><div><p class="m11-kicker">Lab 2 · ${MODULE_ELEVEN_REPORT_CATALOG_KEY} · independent</p><h2 id="m11-report-title" tabindex="-1">Executive Incident Report</h2><p><strong>Objective:</strong> Convert the bounded technical case into an accurate case note, an audience-appropriate executive summary, an accountable escalation, and a defensible closure decision.</p></div><dl><div><dt>Dataset</dt><dd>11 events</dd></div><div><dt>Role</dt><dd>Case owner</dd></div><div><dt>Status</dt><dd>${moduleElevenStatus(moduleElevenReportState)}</dd></div></dl></header>${moduleElevenCaseDataset()}${moduleElevenReportForm()}</article>`;
}

function moduleElevenDynamic() {
  return `${moduleElevenLabSwitcher()}${moduleElevenActiveLab === 'metrics' ? moduleElevenMetricsLab() : moduleElevenReportLab()}`;
}

function viewModuleEleven(user, program) {
  moduleElevenLoad(user);
  const completeCount = Number(moduleElevenMetricsState.completed) + Number(moduleElevenReportState.completed);
  const module = program.modules['soc-11'];
  return `<div class="m11-shell"><header class="m11-topbar"><a class="m11-brand" href="#/portal" aria-label="Mission Next Technical Academy Labs portal"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m11-top-actions"><span class="m11-simulation"><i class="ri-shield-check-line" aria-hidden="true"></i> Synthetic training data</span><a class="m11-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Program overview</a></div></header><main class="m11-main"><section class="m11-hero"><div><p class="m11-kicker">Week 6 · Module 11 · ${formatInstructionalMinutes(module.durationMinutes)}</p><h1>${esc(module.title)}</h1><p>Turn operating signals and technical evidence into decisions that analysts, incident owners, and leaders can act on.</p></div><dl><div><dt>Labs complete</dt><dd id="m11-complete-count">${completeCount}/${module.labs}</dd></div><div><dt>Difficulty</dt><dd>Independent</dd></div><div><dt>Pass mark</dt><dd>${MODULE_ELEVEN_PASSING_SCORE}% each</dd></div></dl></section><section class="m11-practice-note"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p class="m11-kicker">Independent practice</p><h2>Read the objective and dataset, then choose your own working order.</h2><p>No prescribed sequence or pre-submission hints are provided. Scoring feedback and a reference model appear after you submit.</p></div></section><div id="m11-lab-dynamic">${moduleElevenDynamic()}</div></main></div>`;
}

function moduleElevenRender(focusId) {
  const root = document.getElementById('m11-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleElevenDynamic();
  const completeCount = document.getElementById('m11-complete-count');
  if (completeCount) completeCount.textContent = `${Number(moduleElevenMetricsState.completed) + Number(moduleElevenReportState.completed)}/2`;
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleElevenToggle(list, value, checked) {
  return checked ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function moduleElevenEvidenceScore(selected, rows, expectedCount) {
  const correct = selected.filter((id) => rows.find((row) => row.id === id)?.relevant).length;
  const wrong = selected.length - correct;
  return Math.max(0, Math.min(25, Math.round((correct / expectedCount) * 25) - (wrong * 3)));
}

function moduleElevenMetricsScore() {
  const observation = moduleElevenEvidenceScore(moduleElevenMetricsState.selectedEvidence, MODULE_ELEVEN_METRIC_EVIDENCE, 5);
  const analysis = (moduleElevenMetricsState.primaryCause === 'rule-capacity' ? 15 : 0) + (moduleElevenMetricsState.trendConclusion === 'degrading' ? 10 : 0);
  const decision = (moduleElevenMetricsState.action === 'tune-prioritize' ? 15 : 0) + (moduleElevenMetricsState.escalation === 'duty-detection' ? 15 : 0);
  const note = moduleElevenMetricsState.notes.toLowerCase();
  const communicationChecks = [/(21|171).*(minute|min)|(?:minute|min).*(21|171)/, /(78%|76\s+(?:alert|open|backlog))/, /(unfamiliar travel|false positive|rule noise)/, /(duty manager|detection owner|owner)/];
  const communication = communicationChecks.filter((pattern) => pattern.test(note)).length * 5;
  return { score: observation + analysis + decision + communication, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: The selected signals isolate the degraded speed, SLA, backlog, and concentrated false-positive driver.' : `Observation: ${observation}/25. Use the five signals that directly establish handling degradation and the controllable noise source; exclude healthy availability and context-only staffing.`,
    analysis === 25 ? 'Analysis: The conclusion connects the noisy rule and reduced capacity to worsening MTTD, MTTR, SLA, and backlog.' : `Analysis: ${analysis}/25. Distinguish operational degradation from incident impact and identify the concentrated rule noise as the main controllable driver.`,
    decision === 30 ? 'Decision: The proposal preserves coverage, prioritizes aging risk, and names the correct accountable escalation.' : `Decision: ${decision}/30. Tune in a controlled scope, assign aging high-priority work, and notify both the duty manager and detection owner.`,
    communication === 20 ? 'Communication: The handoff quantifies the risk, identifies the driver, and names accountable ownership.' : `Communication: ${communication}/20. Include 21-minute MTTD or 171-minute MTTR, 78% SLA or 76-alert backlog, the noisy rule, and an owner.`,
  ] };
}

function moduleElevenReportScore() {
  const observation = moduleElevenEvidenceScore(moduleElevenReportState.selectedEvidence, MODULE_ELEVEN_CASE_EVENTS, 7);
  const analysis = (moduleElevenReportState.classification === 'confirmed' ? 8 : 0) + (moduleElevenReportState.rootCause === 'archive-script' ? 9 : 0) + (moduleElevenReportState.impact === 'bounded' ? 8 : 0);
  const decision = (moduleElevenReportState.escalation === 'incident-owners' ? 15 : 0) + (moduleElevenReportState.closure === 'verified-monitor' ? 15 : 0);
  const caseNote = moduleElevenReportState.caseNote.toLowerCase();
  const executive = moduleElevenReportState.executiveSummary.toLowerCase();
  const caseChecks = [/(nb-44).*(acct-44)|(acct-44).*(nb-44)/, /(isolate|revok|disable|remov|restore)/];
  const executiveChecks = [/(one|1).*(user|employee|notebook|device)/, /(monitor|residual|no sensitive|no lateral)/];
  const communication = [...caseChecks.map((pattern) => pattern.test(caseNote)), ...executiveChecks.map((pattern) => pattern.test(executive))].filter(Boolean).length * 5;
  return { score: observation + analysis + decision + communication, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: The chosen evidence supports execution, correlation, containment, recovery, and bounded scope.' : `Observation: ${observation}/25. Select the seven records that directly support compromise, affected entities, response, recovery, and scope; leave administrative milestones as context.`,
    analysis === 25 ? 'Analysis: The report states a confirmed but bounded compromise, root cause, and supported business impact.' : `Analysis: ${analysis}/25. Separate confirmed scope from enterprise-wide claims and connect the external archive to unsigned script execution.`,
    decision === 30 ? 'Decision: Escalation names accountable owners, and closure requires verified recovery, monitoring, and follow-up ownership.' : `Decision: ${decision}/30. Escalate to the incident manager and technical owners; do not close on containment alone.`,
    communication === 20 ? 'Communication: The technical note is traceable and the executive summary states impact and residual risk plainly.' : `Communication: ${communication}/20. Name NB-44 and acct-44 plus response actions in the case note; state one-entity impact and monitored residual risk for leaders.`,
  ] };
}

function wireModuleElevenLab() {
  const root = document.getElementById('m11-lab-dynamic');
  if (!root || !moduleElevenMetricsState || !moduleElevenReportState) return;
  root.addEventListener('click', (event) => {
    const labButton = event.target.closest('[data-m11-lab]');
    if (labButton) {
      moduleElevenActiveLab = labButton.dataset.m11Lab;
      moduleElevenRender(moduleElevenActiveLab === 'metrics' ? 'm11-metrics-title' : 'm11-report-title');
      return;
    }
    const eventButton = event.target.closest('[data-m11-event]');
    if (eventButton) {
      const id = eventButton.dataset.m11Event;
      moduleElevenReportState.activeEvent = moduleElevenReportState.activeEvent === id ? '' : id;
      if (!moduleElevenReportState.reviewedEvents.includes(id)) moduleElevenReportState.reviewedEvents.push(id);
      moduleElevenSaveReport();
      moduleElevenRender(moduleElevenReportState.activeEvent ? 'm11-event-detail' : 'm11-case-data-title');
      return;
    }
    if (event.target.closest('[data-m11-close-event]')) {
      moduleElevenReportState.activeEvent = '';
      moduleElevenSaveReport();
      moduleElevenRender('m11-case-data-title');
      return;
    }
    const reset = event.target.closest('[data-m11-reset]');
    if (!reset) return;
    const kind = reset.dataset.m11Reset;
    if (typeof window.confirm === 'function' && !window.confirm(`Reset only the ${kind} lab? The other lab and course progress will stay unchanged.`)) return;
    if (kind === 'metrics') {
      moduleElevenMetricsState = LabRuntime.reset(MODULE_ELEVEN_METRICS_LAB_ID, moduleElevenUser, moduleElevenMetricsFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY, false);
      moduleElevenRender('m11-metrics-title');
    } else {
      moduleElevenReportState = LabRuntime.reset(MODULE_ELEVEN_REPORT_LAB_ID, moduleElevenUser, moduleElevenReportFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY, false);
      moduleElevenRender('m11-report-title');
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'notes') {
      moduleElevenMetricsState.notes = event.target.value;
      moduleElevenSaveMetrics();
      const count = root.querySelector('#m11-metrics-count');
      if (count) count.textContent = `${event.target.value.length}/1200`;
    }
    if (event.target.name === 'caseNote' || event.target.name === 'executiveSummary') {
      moduleElevenReportState[event.target.name] = event.target.value;
      moduleElevenSaveReport();
      const count = root.querySelector(event.target.name === 'caseNote' ? '#m11-case-count' : '#m11-exec-count');
      if (count) count.textContent = `${event.target.value.length}/1400`;
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'metricsEvidence') {
      moduleElevenMetricsState.selectedEvidence = moduleElevenToggle(moduleElevenMetricsState.selectedEvidence, input.value, input.checked);
      moduleElevenSaveMetrics();
      return;
    }
    if (['primaryCause', 'trendConclusion', 'action', 'escalation'].includes(input.name) && moduleElevenActiveLab === 'metrics') {
      moduleElevenMetricsState[input.name] = input.value;
      moduleElevenSaveMetrics();
      return;
    }
    if (input.name === 'reportEvidence') {
      moduleElevenReportState.selectedEvidence = moduleElevenToggle(moduleElevenReportState.selectedEvidence, input.value, input.checked);
      moduleElevenSaveReport();
      return;
    }
    if (['classification', 'rootCause', 'impact', 'escalation', 'closure'].includes(input.name) && moduleElevenActiveLab === 'report') {
      moduleElevenReportState[input.name] = input.value;
      moduleElevenSaveReport();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id === 'm11-metrics-form') {
      event.preventDefault();
      moduleElevenMetricsState.notes = event.target.elements.notes.value;
      const missing = [];
      if (moduleElevenMetricsState.selectedEvidence.length < 4) missing.push('select at least four material metric signals');
      if (!moduleElevenMetricsState.primaryCause || !moduleElevenMetricsState.trendConclusion) missing.push('complete the operational analysis');
      if (!moduleElevenMetricsState.action || !moduleElevenMetricsState.escalation) missing.push('complete the action and escalation decisions');
      if (moduleElevenMetricsState.notes.trim().length < 160) missing.push('write a 160-character shift handoff');
      if (missing.length) {
        moduleElevenMetricsState.validationError = `${missing.join('; ')}. Your current work remains saved.`;
      } else {
        const result = moduleElevenMetricsScore();
        moduleElevenMetricsState.attempts += 1;
        moduleElevenMetricsState.score = result.score;
        moduleElevenMetricsState.bestScore = Math.max(moduleElevenMetricsState.bestScore || 0, result.score);
        moduleElevenMetricsState.breakdown = result.breakdown;
        moduleElevenMetricsState.feedback = result.feedback;
        moduleElevenMetricsState.validationError = '';
        moduleElevenMetricsState.lastSubmittedAt = new Date().toISOString();
        const metricsPassed = result.score >= MODULE_ELEVEN_PASSING_SCORE;
        if (typeof recordLabAttempt === 'function') {
          recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_METRICS_CATALOG_KEY, {
            state: metricsPassed ? 'complete' : 'in_progress',
            score: result.score,
            result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleElevenMetricsState.attempts },
          });
        }
        if (metricsPassed) {
          moduleElevenMetricsState.completed = true;
          if (!moduleElevenMetricsState.flags.includes(MODULE_ELEVEN_METRICS_FLAG)) moduleElevenMetricsState.flags.push(MODULE_ELEVEN_METRICS_FLAG);
          if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_METRICS_CATALOG_KEY);
        }
      }
      moduleElevenSaveMetrics();
      moduleElevenRender('m11-feedback');
      return;
    }
    if (event.target.id === 'm11-report-form') {
      event.preventDefault();
      moduleElevenReportState.caseNote = event.target.elements.caseNote.value;
      moduleElevenReportState.executiveSummary = event.target.elements.executiveSummary.value;
      const missing = [];
      if (moduleElevenReportState.selectedEvidence.length < 5) missing.push('select at least five supporting case events');
      if (!moduleElevenReportState.classification || !moduleElevenReportState.rootCause || !moduleElevenReportState.impact) missing.push('complete the case analysis');
      if (!moduleElevenReportState.escalation || !moduleElevenReportState.closure) missing.push('complete escalation and closure decisions');
      if (moduleElevenReportState.caseNote.trim().length < 180) missing.push('write a 180-character technical case note');
      if (moduleElevenReportState.executiveSummary.trim().length < 160) missing.push('write a 160-character executive summary');
      if (missing.length) {
        moduleElevenReportState.validationError = `${missing.join('; ')}. Your current work remains saved.`;
      } else {
        const result = moduleElevenReportScore();
        moduleElevenReportState.attempts += 1;
        moduleElevenReportState.score = result.score;
        moduleElevenReportState.bestScore = Math.max(moduleElevenReportState.bestScore || 0, result.score);
        moduleElevenReportState.breakdown = result.breakdown;
        moduleElevenReportState.feedback = result.feedback;
        moduleElevenReportState.validationError = '';
        moduleElevenReportState.lastSubmittedAt = new Date().toISOString();
        const reportPassed = result.score >= MODULE_ELEVEN_PASSING_SCORE;
        if (typeof recordLabAttempt === 'function') {
          recordLabAttempt(moduleElevenUser, MODULE_ELEVEN_REPORT_CATALOG_KEY, {
            state: reportPassed ? 'complete' : 'in_progress',
            score: result.score,
            result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleElevenReportState.attempts },
          });
        }
        if (reportPassed) {
          moduleElevenReportState.completed = true;
          if (!moduleElevenReportState.flags.includes(MODULE_ELEVEN_REPORT_FLAG)) moduleElevenReportState.flags.push(MODULE_ELEVEN_REPORT_FLAG);
          if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleElevenUser, 'soc-analyst', 'soc-11', MODULE_ELEVEN_REPORT_CATALOG_KEY);
        }
      }
      moduleElevenSaveReport();
      moduleElevenRender('m11-feedback');
    }
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 11, moduleKey: 'soc-11', view: viewModuleEleven, wire: wireModuleElevenLab });

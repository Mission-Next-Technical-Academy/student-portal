/* Module 06 — assisted hypothesis-led threat hunt.
 * Every identity, host, indicator, and event is synthetic and browser-local.
 */

const MODULE_SIX_LAB_ID = 'm06-hypothesis-hunt-v1';
const MODULE_SIX_FLAG = 'M06-HUNT-SCOPE-COMPLETE';
const MODULE_SIX_CATALOG_LAB_KEY = 'lab-threat-hunt';
const MODULE_SIX_PASSING_SCORE = 80;

const MODULE_SIX_ENDPOINT_ROWS = [
  { id: 'EP-601', time: '08:31', device: 'WS-214', account: 'acct-27', process: 'doc-reader.exe', parent: 'explorer.exe', fileHash: 'ddd…', remoteIp: 'None', action: 'Opened benefits-guide.pdf', detail: 'The signed document reader opened a locally downloaded PDF. No child process or network action followed.', relevant: false },
  { id: 'EP-602', time: '08:42', device: 'WS-214', account: 'acct-27', process: 'script-runner.exe', parent: 'doc-reader.exe', fileHash: 'aaa…', remoteIp: '203.0.113.77', action: 'Encoded command and outbound connection', detail: 'An unsigned script host started beneath the document reader, used an encoded argument, and contacted the seed destination.', relevant: true },
  { id: 'EP-603', time: '08:51', device: 'WS-105', account: 'system', process: 'update-agent.exe', parent: 'services.exe', fileHash: 'bbb…', remoteIp: '198.51.100.20', action: 'Approved updater check', detail: 'The signed update agent contacted its registered test endpoint during the approved maintenance window.', relevant: false },
  { id: 'EP-604', time: '09:06', device: 'WS-332', account: 'acct-41', process: 'script-runner.exe', parent: 'mail-viewer.exe', fileHash: 'aaa…', remoteIp: '203.0.113.77', action: 'Encoded command and outbound connection', detail: 'The same unsigned file fingerprint and destination appeared beneath a different content-viewing process on a second device.', relevant: true },
  { id: 'EP-605', time: '09:12', device: 'WS-406', account: 'acct-18', process: 'inventory-script.exe', parent: 'management-agent.exe', fileHash: 'ccc…', remoteIp: 'None', action: 'Hardware inventory collected', detail: 'A signed inventory script ran from the managed tools directory under the expected service parent.', relevant: false },
  { id: 'EP-606', time: '09:18', device: 'WS-214', account: 'acct-27', process: 'browser.exe', parent: 'explorer.exe', fileHash: 'eee…', remoteIp: '203.0.113.41', action: 'Training site opened', detail: 'The browser visited the organization training site. The destination differs from the seed indicator.', relevant: false },
  { id: 'EP-607', time: '09:24', device: 'WS-118', account: 'acct-52', process: 'sheet-app.exe', parent: 'explorer.exe', fileHash: 'fff…', remoteIp: 'None', action: 'Quarterly workbook opened', detail: 'A signed productivity application opened a local workbook without spawning unusual children.', relevant: false },
];

const MODULE_SIX_SIGNIN_ROWS = [
  { id: 'ID-610', time: '08:22', account: 'acct-52', device: 'WS-118', sourceIp: '198.51.100.34', result: 'Success', session: 'Managed browser', detail: 'Normal workday access from the account\'s registered device and office egress range.', relevant: false },
  { id: 'ID-611', time: '08:39', account: 'acct-27', device: 'WS-214', sourceIp: '192.0.2.44', result: 'Success', session: 'Managed desktop', detail: 'The account signed in from its registered workstation shortly before the endpoint event.', relevant: false },
  { id: 'ID-612', time: '08:47', account: 'acct-27', device: 'WS-214', sourceIp: '203.0.113.77', result: 'Token refresh', session: 'Unfamiliar client', detail: 'A new client refreshed the account session from the same seed address five minutes after the script activity.', relevant: true },
  { id: 'ID-613', time: '08:54', account: 'backup-job', device: 'SRV-008', sourceIp: '192.0.2.80', result: 'Success', session: 'Non-interactive', detail: 'The backup identity authenticated from its registered server during the normal archive window.', relevant: false },
  { id: 'ID-614', time: '09:10', account: 'acct-41', device: 'WS-332', sourceIp: '203.0.113.77', result: 'Token refresh', session: 'Unfamiliar client', detail: 'The same source address refreshed a second account session four minutes after the matching endpoint event.', relevant: true },
  { id: 'ID-615', time: '09:16', account: 'acct-18', device: 'WS-406', sourceIp: '198.51.100.61', result: 'Success', session: 'Managed desktop', detail: 'Routine access from the inventory operator\'s registered device and office egress range.', relevant: false },
];

const MODULE_SIX_SOURCES = {
  endpoint: {
    label: 'Endpoint activity', table: 'EndpointActivity', icon: 'ri-computer-line',
    prompt: 'Find every device that executed the seed file fingerprint.',
    expectedField: 'FileHash', expectedValue: 'aaa…', rows: MODULE_SIX_ENDPOINT_ROWS,
  },
  signin: {
    label: 'Sign-in activity', table: 'SignInActivity', icon: 'ri-user-follow-line',
    prompt: 'Find every identity session associated with the seed destination.',
    expectedField: 'SourceIp', expectedValue: '203.0.113.77', rows: MODULE_SIX_SIGNIN_ROWS,
  },
};

const MODULE_SIX_EXPECTED_BOOKMARKS = ['EP-602', 'EP-604', 'ID-612', 'ID-614'];
const MODULE_SIX_DEFAULT_STATE = {
  hypothesis: '',
  activeSource: 'endpoint',
  queryDrafts: {
    endpoint: 'EndpointActivity\n| where FileHash == ""\n| sort by TimeGenerated asc',
    signin: 'SignInActivity\n| where SourceIp == ""\n| sort by TimeGenerated asc',
  },
  queryRuns: { endpoint: 0, signin: 0 },
  queryPassed: { endpoint: false, signin: false },
  queryResultIds: { endpoint: [], signin: [] },
  queryFeedback: { endpoint: '', signin: '' },
  selectedEvidence: [],
  bookmarks: [],
  detailEvent: '',
  scopedDevices: [],
  scopedAccounts: [],
  iocRelationship: '',
  techniques: [],
  disposition: '',
  nextAction: '',
  notes: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
};

let moduleSixState = null;
let moduleSixUser = null;

function moduleSixFreshDefaults() {
  // LabRuntime intentionally performs a shallow merge. This lab has nested
  // query state, so clone its defaults to keep a reset truly pristine.
  return JSON.parse(JSON.stringify(MODULE_SIX_DEFAULT_STATE));
}

function moduleSixLoad(user) {
  moduleSixUser = user;
  const defaults = moduleSixFreshDefaults();
  moduleSixState = LabRuntime.load(MODULE_SIX_LAB_ID, user, defaults);
  moduleSixState.queryDrafts = { ...defaults.queryDrafts, ...(moduleSixState.queryDrafts || {}) };
  moduleSixState.queryRuns = { ...defaults.queryRuns, ...(moduleSixState.queryRuns || {}) };
  moduleSixState.queryPassed = { ...defaults.queryPassed, ...(moduleSixState.queryPassed || {}) };
  moduleSixState.queryResultIds = { ...defaults.queryResultIds, ...(moduleSixState.queryResultIds || {}) };
  moduleSixState.queryFeedback = { ...defaults.queryFeedback, ...(moduleSixState.queryFeedback || {}) };
  ['selectedEvidence', 'bookmarks', 'scopedDevices', 'scopedAccounts', 'techniques', 'feedback', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleSixState[key])) moduleSixState[key] = [];
  });
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-06');
  return moduleSixState;
}

function moduleSixSave() {
  if (moduleSixUser && moduleSixState) LabRuntime.save(MODULE_SIX_LAB_ID, moduleSixUser, moduleSixState);
}

function moduleSixAllRows() {
  return [...MODULE_SIX_ENDPOINT_ROWS, ...MODULE_SIX_SIGNIN_ROWS];
}

function moduleSixRowById(id) {
  return moduleSixAllRows().find((row) => row.id === id);
}

function moduleSixConcepts() {
  const concepts = [
    ['ri-lightbulb-flash-line', 'Start with a testable hypothesis', 'State an observable behavior, the entities it may affect, and what evidence would support or weaken it. A hunt is not a search for proof at any cost.'],
    ['ri-filter-3-line', 'Use indicators as pivots', 'A file fingerprint or address can narrow a first query. Then compare time, process ancestry, device, identity, and known-good context before connecting records.'],
    ['ri-bookmark-3-line', 'Bookmark the reasoning chain', 'Keep the few records that establish the behavior and scope. A useful bookmark explains why a row matters; volume is not evidence quality.'],
    ['ri-node-tree', 'Map behavior after validation', 'ATT&CK technique labels describe observed behavior. Map only what the telemetry demonstrates, then state what remains unknown.'],
  ];
  return `<div class="m06-concept-grid">${concepts.map((item) => `<article><i class="${esc(item[0])}" aria-hidden="true"></i><h3>${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div>`;
}

function moduleSixHypothesis() {
  const options = [
    { id: 'recurrence', label: 'The same suspicious script behavior may have recurred on another device.', help: 'Test whether the file fingerprint and destination join endpoint and identity evidence beyond WS-214.' },
    { id: 'all-scripts', label: 'Every script execution in the environment is malicious.', help: 'This is too broad and cannot distinguish approved administration from misuse.' },
    { id: 'identity-only', label: 'The activity is limited to failed passwords on acct-27.', help: 'The seed observation is endpoint execution and a successful session pivot, not a failed-password pattern.' },
  ];
  return `<section class="m06-panel m06-hypothesis" aria-labelledby="m06-hypothesis-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stage 1 · Frame the hunt</p><h3 id="m06-hypothesis-title">Choose a testable hypothesis</h3></div><span class="m06-status-chip">Required</span></div>
    <div class="m06-seed"><i class="ri-radar-line" aria-hidden="true"></i><div><strong>Seed observation on WS-214</strong><p>At 08:42, an unsigned <code>script-runner.exe</code> with fingerprint <code>aaa…</code> started beneath a document reader and contacted <code>203.0.113.77</code>. Determine whether this behavior recurred and define the current scope.</p></div></div>
    <fieldset class="m06-fieldset m06-hypothesis-options"><legend class="m06-visually-hidden">Hunting hypothesis</legend>
      ${options.map((option) => `<label><input type="radio" name="hypothesis" value="${esc(option.id)}" ${moduleSixState.hypothesis === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}
    </fieldset>
    <details class="m06-hint"><summary>Need a hypothesis hint?</summary><p>A useful hypothesis can be tested with available data and can be disproved. Prefer the option that names a behavior and asks whether it appears elsewhere.</p></details>
  </section>`;
}

function moduleSixRunQuery(sourceKey, query) {
  const source = MODULE_SIX_SOURCES[sourceKey];
  const text = String(query || '');
  const tableOk = new RegExp(`^\\s*${source.table}\\b`, 'i').test(text);
  const whereMatch = text.match(/where\s+([A-Za-z][A-Za-z0-9_]*)\s*==\s*["']([^"']*)["']/i);
  const field = whereMatch ? whereMatch[1] : '';
  const value = whereMatch ? whereMatch[2] : '';
  const sortOk = /\|\s*(?:sort|order)\s+by\s+TimeGenerated\s+asc\b/i.test(text);
  const fieldMap = sourceKey === 'endpoint'
    ? { FileHash: 'fileHash', DeviceName: 'device', Account: 'account', RemoteIp: 'remoteIp' }
    : { SourceIp: 'sourceIp', DeviceName: 'device', Account: 'account', Result: 'result' };
  const canonicalField = Object.keys(fieldMap).find((item) => item.toLowerCase() === field.toLowerCase());
  let rows = tableOk ? source.rows.slice() : [];
  if (canonicalField) rows = rows.filter((row) => String(row[fieldMap[canonicalField]]).toLowerCase() === value.toLowerCase());
  else if (whereMatch) rows = [];
  if (sortOk) rows.sort((left, right) => left.time.localeCompare(right.time));
  const passed = tableOk && canonicalField === source.expectedField && value === source.expectedValue && sortOk && rows.length === 2;
  return { tableOk, canonicalField, value, sortOk, rows, passed };
}

function moduleSixEndpointTable(rows) {
  return `<div class="m06-table-wrap"><table class="m06-data-table">
    <caption class="m06-visually-hidden">Synthetic endpoint activity available for hunting and bookmarking</caption>
    <thead><tr><th scope="col">Bookmark</th><th scope="col">Time</th><th scope="col">Device</th><th scope="col">Account</th><th scope="col">Process chain</th><th scope="col">File hash</th><th scope="col">Remote IP</th><th scope="col">Activity</th></tr></thead>
    <tbody>${rows.map((row) => moduleSixEndpointRow(row)).join('')}</tbody></table></div>`;
}

function moduleSixEndpointRow(row) {
  const saved = moduleSixState.bookmarks.includes(row.id);
  return `<tr class="${saved ? 'is-bookmarked' : ''}">
    <td data-label="Bookmark"><button type="button" class="m06-bookmark" data-m06-bookmark="${esc(row.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} bookmark ${esc(row.id)}"><i class="${saved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}" aria-hidden="true"></i><span>${esc(row.id)}</span></button></td>
    <td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Device"><code>${esc(row.device)}</code></td><td data-label="Account"><code>${esc(row.account)}</code></td>
    <td data-label="Process chain"><button type="button" class="m06-detail-link" data-m06-detail="${esc(row.id)}">${esc(row.parent)} → ${esc(row.process)}</button></td>
    <td data-label="File hash"><code>${esc(row.fileHash)}</code></td><td data-label="Remote IP"><code>${esc(row.remoteIp)}</code></td><td data-label="Activity">${esc(row.action)}</td>
  </tr>`;
}

function moduleSixSigninTable(rows) {
  return `<div class="m06-table-wrap"><table class="m06-data-table">
    <caption class="m06-visually-hidden">Synthetic sign-in activity available for hunting and bookmarking</caption>
    <thead><tr><th scope="col">Bookmark</th><th scope="col">Time</th><th scope="col">Account</th><th scope="col">Device</th><th scope="col">Source IP</th><th scope="col">Result</th><th scope="col">Session</th></tr></thead>
    <tbody>${rows.map((row) => moduleSixSigninRow(row)).join('')}</tbody></table></div>`;
}

function moduleSixSigninRow(row) {
  const saved = moduleSixState.bookmarks.includes(row.id);
  return `<tr class="${saved ? 'is-bookmarked' : ''}">
    <td data-label="Bookmark"><button type="button" class="m06-bookmark" data-m06-bookmark="${esc(row.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Add'} bookmark ${esc(row.id)}"><i class="${saved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}" aria-hidden="true"></i><span>${esc(row.id)}</span></button></td>
    <td data-label="Time"><time>${esc(row.time)}</time></td><td data-label="Account"><code>${esc(row.account)}</code></td><td data-label="Device"><code>${esc(row.device)}</code></td>
    <td data-label="Source IP"><button type="button" class="m06-detail-link" data-m06-detail="${esc(row.id)}"><code>${esc(row.sourceIp)}</code></button></td><td data-label="Result">${esc(row.result)}</td><td data-label="Session">${esc(row.session)}</td>
  </tr>`;
}

function moduleSixSourceWorkspace() {
  const sourceKey = moduleSixState.activeSource;
  const source = MODULE_SIX_SOURCES[sourceKey];
  const runs = Number(moduleSixState.queryRuns[sourceKey]) || 0;
  const resultIds = Array.isArray(moduleSixState.queryResultIds[sourceKey]) ? moduleSixState.queryResultIds[sourceKey] : [];
  const visibleRows = runs ? source.rows.filter((row) => resultIds.includes(row.id)) : source.rows;
  const detail = moduleSixRowById(moduleSixState.detailEvent);
  const resultMessage = runs
    ? `<div class="m06-query-result ${moduleSixState.queryPassed[sourceKey] ? 'is-pass' : 'is-remediate'}" id="m06-query-feedback" role="status" tabindex="-1"><strong>${moduleSixState.queryPassed[sourceKey] ? 'Query objective met' : 'Query needs refinement'}</strong><p>${esc(moduleSixState.queryFeedback[sourceKey])}</p></div>`
    : `<div class="m06-query-empty" id="m06-query-feedback" role="status">The preview includes benign distractors. Run a query to reduce it to the two rows that test this pivot.</div>`;
  return `<section class="m06-panel m06-workspace" aria-labelledby="m06-workspace-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stage 2 · Test the hypothesis</p><h3 id="m06-workspace-title">Two-source hunt workbench</h3></div><span class="m06-status-chip">${moduleSixState.bookmarks.length}/4 bookmarks saved</span></div>
    <p class="m06-instruction">Choose either source first. Query both, inspect the matching context, and bookmark only the four rows that together establish behavior and scope.</p>
    <div class="m06-source-tabs" role="tablist" aria-label="Hunting data sources">
      ${Object.entries(MODULE_SIX_SOURCES).map(([key, item]) => `<button type="button" role="tab" data-m06-source="${esc(key)}" aria-selected="${sourceKey === key}" aria-controls="m06-source-panel"><i class="${esc(item.icon)}" aria-hidden="true"></i>${esc(item.label)}<span>${moduleSixState.queryPassed[key] ? '✓ queried' : `${moduleSixState.queryRuns[key] || 0} runs`}</span></button>`).join('')}
    </div>
    <div class="m06-source-panel" id="m06-source-panel" role="tabpanel">
      <div class="m06-query-layout">
        <div><p class="m06-query-prompt"><strong>${esc(source.prompt)}</strong> Use <code>${esc(source.expectedField)}</code> as the equality field and sort oldest first.</p>
          <label for="m06-query-editor">Local hunt query</label>
          <textarea id="m06-query-editor" name="queryDraft" rows="4" spellcheck="false" aria-describedby="m06-query-help">${esc(moduleSixState.queryDrafts[sourceKey])}</textarea>
          <p id="m06-query-help">Supported subset: table name, one <code>where Field == "value"</code>, and <code>sort by TimeGenerated asc</code>.</p>
          <button type="button" class="m06-run" data-m06-run><i class="ri-play-circle-line" aria-hidden="true"></i> Run ${esc(source.label.toLowerCase())} query</button>
        </div>
        <details class="m06-hint m06-query-hint"><summary>Need a query hint?</summary><p>Copy the matching seed value into the empty quotes: <code>${esc(source.expectedValue)}</code>. Keep the table and ascending sort already provided.</p></details>
      </div>
      ${resultMessage}
      <div class="m06-result-heading"><strong>${runs ? `${visibleRows.length} query result${visibleRows.length === 1 ? '' : 's'}` : `${visibleRows.length} rows in unfiltered preview`}</strong><span>All data is synthetic</span></div>
      ${sourceKey === 'endpoint' ? moduleSixEndpointTable(visibleRows) : moduleSixSigninTable(visibleRows)}
      ${detail && source.rows.includes(detail) ? `<aside class="m06-row-detail" id="m06-row-detail" tabindex="-1"><button type="button" data-m06-detail-close aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button><p class="m06-kicker">${esc(detail.id)} · context</p><strong>${esc(detail.action || detail.result)}</strong><p>${esc(detail.detail)}</p></aside>` : ''}
    </div>
    <aside class="m06-bookmark-tray" aria-labelledby="m06-bookmark-title"><div><p class="m06-kicker">Evidence tray</p><h4 id="m06-bookmark-title">Hunt bookmarks</h4></div>${moduleSixState.bookmarks.length ? `<ol>${moduleSixState.bookmarks.map((id) => { const row = moduleSixRowById(id); return `<li><code>${esc(id)}</code><span>${esc(row.device)} · ${esc(row.account)}</span><button type="button" data-m06-bookmark="${esc(id)}" aria-label="Remove bookmark ${esc(id)}"><i class="ri-close-line" aria-hidden="true"></i></button></li>`; }).join('')}</ol>` : '<p>No evidence bookmarked yet. Save the few rows that directly test the hypothesis.</p>'}</aside>
  </section>`;
}

function moduleSixCheckboxGroup(name, options, selected) {
  return `<div class="m06-check-grid">${options.map((option) => `<label><input type="checkbox" name="${esc(name)}" value="${esc(option.id)}" ${selected.includes(option.id) ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSixRadioGroup(name, options) {
  return `<div class="m06-option-list">${options.map((option) => `<label><input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleSixState[name] === option.id ? 'checked' : ''} /><span><strong>${esc(option.label)}</strong><small>${esc(option.help)}</small></span></label>`).join('')}</div>`;
}

function moduleSixScorePanel() {
  if (moduleSixState.validationError) return `<div class="m06-validation" id="m06-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the hunt record</strong><p>${esc(moduleSixState.validationError)}</p></div></div>`;
  if (!moduleSixState.attempts || !moduleSixState.breakdown) return `<div class="m06-score-empty" id="m06-feedback" role="status">Scoring: observation 30 · analysis 30 · decision 20 · communication 20. Passing score: ${MODULE_SIX_PASSING_SCORE}.</div>`;
  const b = moduleSixState.breakdown;
  const passed = moduleSixState.score >= MODULE_SIX_PASSING_SCORE;
  return `<section class="m06-score ${passed ? 'is-pass' : 'is-remediate'}" id="m06-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m06-score-title">
    <div class="m06-score-heading"><div><p class="m06-kicker">Attempt ${moduleSixState.attempts} · best ${moduleSixState.bestScore}/100</p><h3 id="m06-score-title">${moduleSixState.score}/100 — ${passed ? 'Hypothesis tested and scoped' : 'Use the findings to refine your hunt'}</h3></div><span>${moduleSixState.score}</span></div>
    <div class="m06-score-grid" aria-label="Explainable score breakdown">
      <div><strong>${b.observation}/30</strong><span>Observation</span><small>${b.queries}/10 queries · ${b.bookmarks}/20 bookmarks</small></div>
      <div><strong>${b.analysis}/30</strong><span>Analysis</span><small>${b.hypothesis}/8 hypothesis · ${b.scope}/12 scope · ${b.ioc}/4 IOC · ${b.attack}/6 ATT&amp;CK</small></div>
      <div><strong>${b.decision}/20</strong><span>Decision</span><small>${b.disposition}/10 disposition · ${b.action}/10 action</small></div>
      <div><strong>${b.communication}/20</strong><span>Communication</span><small>Conclusion, scope, indicators, and handoff</small></div>
    </div>
    <ul class="m06-feedback-list">${moduleSixState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    <div class="m06-expert-model"><strong>Expert hunt reasoning</strong><p>The initial row is suspicious because an unsigned script host appears beneath a content reader and contacts an unusual destination. The same fingerprint, destination, process pattern, and tightly timed unfamiliar session recur on WS-332 with a second account. That supports the hypothesis and scopes the current evidence to two device-account pairs. It does not prove enterprise-wide compromise; preserve the four bookmarks, escalate the scoped pairs, and continue monitoring for the validated indicators and behaviors.</p></div>
  </section>`;
}

function moduleSixArtifact() {
  const devices = [
    { id: 'WS-214', label: 'WS-214', help: 'Seed device with the first matching process chain.' },
    { id: 'WS-332', label: 'WS-332', help: 'Second device with the same fingerprint and destination.' },
    { id: 'WS-105', label: 'WS-105', help: 'Approved signed updater activity.' },
    { id: 'WS-406', label: 'WS-406', help: 'Managed inventory script with a different fingerprint.' },
  ];
  const accounts = [
    { id: 'acct-27', label: 'acct-27', help: 'Session and endpoint activity align on WS-214.' },
    { id: 'acct-41', label: 'acct-41', help: 'Session and endpoint activity align on WS-332.' },
    { id: 'acct-18', label: 'acct-18', help: 'Routine access on an inventory workstation.' },
    { id: 'acct-52', label: 'acct-52', help: 'Normal document and sign-in activity.' },
  ];
  const techniques = [
    { id: 'T1059', label: 'T1059 · Command and Scripting Interpreter', help: 'Supported by the encoded script-host execution.' },
    { id: 'T1105', label: 'T1105 · Ingress Tool Transfer', help: 'The data proves a connection, but not a file transfer.' },
    { id: 'T1078', label: 'T1078 · Valid Accounts', help: 'Supported by active account sessions from the shared unusual source.' },
    { id: 'T1566', label: 'T1566 · Phishing', help: 'A content viewer is present, but message-delivery evidence is not in this lab.' },
  ];
  return `<form class="m06-panel m06-artifact" id="m06-form" novalidate aria-labelledby="m06-artifact-title">
    <div class="m06-panel-heading"><div><p class="m06-kicker">Stages 3–5 · Scope, decide, communicate</p><h3 id="m06-artifact-title">Hunt conclusion record</h3></div><span class="m06-status-chip">Retry allowed</span></div>
    <p class="m06-instruction">Turn the two-source findings into one reviewable artifact. Select only what the evidence supports.</p>

    <fieldset class="m06-fieldset"><legend><span>1</span> Scope the affected devices</legend><p class="m06-help">Choose every device with the matching suspicious behavior.</p>${moduleSixCheckboxGroup('scopedDevices', devices, moduleSixState.scopedDevices)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>2</span> Scope the affected identities</legend><p class="m06-help">Choose every account supported by both timing and entity context.</p>${moduleSixCheckboxGroup('scopedAccounts', accounts, moduleSixState.scopedAccounts)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>3</span> Interpret the indicator relationship</legend><p class="m06-help">Indicators are pivots. Explain what their recurrence contributes.</p>${moduleSixRadioGroup('iocRelationship', [
      { id: 'corroborates', label: 'The shared fingerprint and destination corroborate one recurring behavior pattern.', help: 'The process, device, identity, and time context make the recurrence meaningful.' },
      { id: 'ip-proves', label: 'The destination alone proves every matching device is compromised.', help: 'An address match without behavior and context is not enough.' },
      { id: 'unrelated', label: 'The rows are unrelated because they occur on different devices.', help: 'Cross-device recurrence is exactly what this hunt is testing.' },
    ])}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>4</span> Map demonstrated ATT&amp;CK behavior</legend><p class="m06-help">Choose the two techniques directly supported by these two sources; do not infer delivery or download behavior that is absent.</p>${moduleSixCheckboxGroup('techniques', techniques, moduleSixState.techniques)}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>5</span> Record the hunt disposition</legend>${moduleSixRadioGroup('disposition', [
      { id: 'supported-scoped', label: 'Hypothesis supported; current evidence scopes activity to two device-account pairs.', help: 'The pattern recurs, while the dataset does not establish wider compromise.' },
      { id: 'enterprise-wide', label: 'Confirmed enterprise-wide compromise.', help: 'Two affected pairs cannot support an enterprise-wide claim.' },
      { id: 'benign', label: 'Benign administrative behavior.', help: 'The unsigned content-reader child and unfamiliar sessions differ from the benign baselines.' },
    ])}</fieldset>
    <fieldset class="m06-fieldset"><legend><span>6</span> Recommend the next action</legend>${moduleSixRadioGroup('nextAction', [
      { id: 'scoped-escalation', label: 'Escalate the two pairs for approved containment, preserve bookmarks, and continue a scoped indicator-and-behavior hunt.', help: 'This is proportionate to the validated scope and keeps evidence available.' },
      { id: 'wipe-all', label: 'Immediately wipe every device in the dataset.', help: 'This exceeds the observed scope and analyst authority.' },
      { id: 'close', label: 'Close the hunt because no alert fired on WS-332.', help: 'Threat hunting exists to find relevant behavior beyond current alerts.' },
    ])}</fieldset>
    <div class="m06-fieldset"><label class="m06-note-label" for="m06-notes"><span>7</span><strong>Write the analyst handoff</strong></label><p class="m06-help" id="m06-notes-help">In 120+ characters: state whether the hypothesis is supported, name the scoped devices/accounts, cite the fingerprint or destination, and recommend a next action.</p><textarea id="m06-notes" name="notes" rows="6" maxlength="900" aria-describedby="m06-notes-help m06-note-count" placeholder="Hypothesis result: … Scope: … Evidence: … Recommended next step: …">${esc(moduleSixState.notes)}</textarea><p class="m06-note-count" id="m06-note-count"><span>${moduleSixState.notes.length}</span>/900 characters</p></div>
    <details class="m06-hint m06-artifact-hint"><summary>Need a handoff checklist?</summary><p>Conclusion → exact scope → strongest indicator-and-behavior evidence → proportionate next action. State what is known without claiming more than two sources show.</p></details>
    <div class="m06-actions"><button type="submit" class="m06-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my hunt</button><button type="button" class="m06-reset" data-m06-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button></div>
    ${moduleSixScorePanel()}
  </form>`;
}

function moduleSixLabDynamic() {
  return `${moduleSixHypothesis()}${moduleSixSourceWorkspace()}${moduleSixArtifact()}`;
}

function viewModuleSix(user, program) {
  moduleSixLoad(user);
  return `<div class="m06-shell">
    <header class="m06-topbar"><a href="#/program/${esc(program.slug)}" class="m06-brand" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m06-top-actions"><span class="m06-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Assisted simulation · fictional data</span><a href="#/program/${esc(program.slug)}" class="m06-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="m06-main">
      <section class="m06-hero" aria-labelledby="m06-title"><div><p class="m06-kicker">Module 06 · Applied practice · assisted</p><h1 id="m06-title">Threat Hunting &amp; Investigation</h1><p class="m06-lede">Move from a suspicious seed observation to a tested hypothesis, a defensible two-source evidence set, and a scoped analyst handoff.</p><a class="m06-hero-action" href="#m06-field-guide"><i class="ri-compass-3-line" aria-hidden="true"></i> Review the hunt method</a></div><dl class="m06-progress" aria-label="Saved lab progress"><div><dt>Data sources</dt><dd>2</dd></div><div><dt>Target time</dt><dd>60 min</dd></div><div><dt>Lab status</dt><dd id="m06-status">${moduleSixState.completed ? 'Complete' : moduleSixState.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>
      <section class="m06-objective" aria-labelledby="m06-objective-title"><div class="m06-objective-icon"><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m06-kicker">Measurable objective</p><h2 id="m06-objective-title">Test one cross-device execution hypothesis with two scoped queries, bookmark the four records that establish behavior and scope, and communicate a supported disposition with at least 80/100.</h2></div></section>
      <section class="m06-section" id="m06-field-guide" aria-labelledby="m06-guide-title"><div class="m06-section-heading"><span>1</span><div><p class="m06-kicker">Field guide</p><h2 id="m06-guide-title">Hunt for evidence, not confirmation</h2></div></div>${moduleSixConcepts()}<div class="m06-hunt-loop" aria-label="Hypothesis-led hunting loop"><span>Hypothesis</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Query</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Bookmark</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Scope</span><i class="ri-arrow-right-line" aria-hidden="true"></i><span>Decide &amp; communicate</span></div></section>
      <section class="m06-section m06-lab-section" aria-labelledby="m06-lab-title"><div class="m06-section-heading"><span>2</span><div><p class="m06-kicker">Miniature hunt surface · no full console</p><h2 id="m06-lab-title">Cross-device script recurrence</h2></div></div><div class="m06-role"><i class="ri-user-search-line" aria-hidden="true"></i><div><strong>Your role: threat-hunting analyst</strong><p>You may investigate endpoint activity and sign-in activity in either order. Hints are available when you want them. Your job is to test the stated lead, not to investigate unrelated systems.</p></div></div><div id="m06-lab-dynamic">${moduleSixLabDynamic()}</div></section>
    </main>
  </div>`;
}

function moduleSixExactSelection(selected, expected, points) {
  const chosen = new Set(selected);
  const correct = expected.filter((item) => chosen.has(item)).length;
  const extras = selected.filter((item) => !expected.includes(item)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - (extras * Math.ceil(points / expected.length)));
}

function moduleSixScore() {
  const queries = (moduleSixState.queryPassed.endpoint ? 5 : 0) + (moduleSixState.queryPassed.signin ? 5 : 0);
  const bookmarks = moduleSixExactSelection(moduleSixState.bookmarks, MODULE_SIX_EXPECTED_BOOKMARKS, 20);
  const hypothesis = moduleSixState.hypothesis === 'recurrence' ? 8 : 0;
  const deviceScope = moduleSixExactSelection(moduleSixState.scopedDevices, ['WS-214', 'WS-332'], 6);
  const accountScope = moduleSixExactSelection(moduleSixState.scopedAccounts, ['acct-27', 'acct-41'], 6);
  const scope = deviceScope + accountScope;
  const ioc = moduleSixState.iocRelationship === 'corroborates' ? 4 : 0;
  const attack = moduleSixExactSelection(moduleSixState.techniques, ['T1059', 'T1078'], 6);
  const disposition = moduleSixState.disposition === 'supported-scoped' ? 10 : 0;
  const action = moduleSixState.nextAction === 'scoped-escalation' ? 10 : 0;
  const note = moduleSixState.notes.trim().toLowerCase();
  const noteLength = note.length >= 120 ? 6 : 0;
  const noteConclusion = /(hypothesis|supported|recurr|malicious|suspicious)/.test(note) ? 4 : 0;
  const noteScope = /(ws-214)/.test(note) && /(ws-332)/.test(note) && /(acct-27)/.test(note) && /(acct-41)/.test(note) ? 4 : 0;
  const noteIndicator = /(aaa|203\.0\.113\.77|fingerprint|destination)/.test(note) ? 3 : 0;
  const noteAction = /(escalat|contain|preserv|continue|block)/.test(note) ? 3 : 0;
  const communication = noteLength + noteConclusion + noteScope + noteIndicator + noteAction;
  const observation = queries + bookmarks;
  const analysis = hypothesis + scope + ioc + attack;
  const decision = disposition + action;
  const score = observation + analysis + decision + communication;
  const exactBookmarks = bookmarks === 20;
  const exactScope = scope === 12;
  const exactAttack = attack === 6;
  return {
    score,
    breakdown: { observation, queries, bookmarks, analysis, hypothesis, scope, ioc, attack, decision, disposition, action, communication },
    feedback: [
      queries === 10 ? 'Queries: Both scoped pivots returned the two chronological matches expected.' : `Queries: ${queries}/10. Run the endpoint fingerprint query and sign-in source-address query with an ascending time sort.`,
      exactBookmarks ? 'Bookmarks: Correct. Four records preserve the two endpoint executions and their two identity-session correlations.' : `Bookmarks: ${bookmarks}/20. Keep EP-602, EP-604, ID-612, and ID-614; unrelated baseline rows weaken the evidence set.`,
      hypothesis ? 'Hypothesis: Testable and correctly framed around recurrence beyond the seed device.' : 'Hypothesis: Frame the hunt around whether the same suspicious script behavior recurred on another device.',
      exactScope ? 'Scope: Correctly limited to WS-214/acct-27 and WS-332/acct-41.' : `Scope: ${scope}/12. Select only the two device-account pairs supported by matching behavior and timing.`,
      ioc && exactAttack ? 'IOC and ATT&CK analysis: Correct. The recurring indicators corroborate the pattern; scripting and valid-account use are directly demonstrated.' : `IOC and ATT&CK analysis: ${ioc + attack}/10. Correlate indicators with context and map only scripting plus valid-account use.`,
      disposition && action ? 'Decision: Proportionate. Escalate the scoped pairs, preserve evidence, and continue the focused hunt.' : `Decision: ${decision}/20. Avoid enterprise-wide claims or destructive actions beyond the current evidence.`,
      communication === 20 ? 'Handoff: Complete, scoped, evidence-based, and actionable.' : `Handoff: ${communication}/20. Include a conclusion, both device-account pairs, one validated indicator, and a proportionate recommendation in at least 120 characters.`,
    ],
  };
}

function moduleSixRenderLab(focusId) {
  const root = document.getElementById('m06-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleSixLabDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleSixLab() {
  const root = document.getElementById('m06-lab-dynamic');
  if (!root || !moduleSixState) return;

  root.addEventListener('click', (event) => {
    const sourceButton = event.target.closest('[data-m06-source]');
    if (sourceButton) {
      moduleSixState.activeSource = sourceButton.dataset.m06Source;
      moduleSixState.detailEvent = '';
      moduleSixSave();
      moduleSixRenderLab('m06-workspace-title');
      return;
    }

    if (event.target.closest('[data-m06-run]')) {
      const sourceKey = moduleSixState.activeSource;
      const editor = root.querySelector('#m06-query-editor');
      moduleSixState.queryDrafts[sourceKey] = editor ? editor.value : moduleSixState.queryDrafts[sourceKey];
      const result = moduleSixRunQuery(sourceKey, moduleSixState.queryDrafts[sourceKey]);
      moduleSixState.queryRuns[sourceKey] = (Number(moduleSixState.queryRuns[sourceKey]) || 0) + 1;
      moduleSixState.queryPassed[sourceKey] = result.passed;
      moduleSixState.queryResultIds[sourceKey] = result.rows.map((row) => row.id);
      const source = MODULE_SIX_SOURCES[sourceKey];
      moduleSixState.queryFeedback[sourceKey] = result.passed
        ? `Two matches remain in chronological order. Inspect and bookmark the rows that support the hypothesis.`
        : `${result.tableOk ? 'Table recognized.' : `Start with ${source.table}.`} ${result.canonicalField === source.expectedField && result.value === source.expectedValue ? 'Pivot recognized.' : `Filter ${source.expectedField} to the seed value.`} ${result.sortOk ? 'Time sort recognized.' : 'Sort TimeGenerated ascending.'} ${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned.`;
      moduleSixState.detailEvent = '';
      moduleSixState.validationError = '';
      moduleSixSave();
      moduleSixRenderLab('m06-query-feedback');
      return;
    }

    const bookmarkButton = event.target.closest('[data-m06-bookmark]');
    if (bookmarkButton) {
      const id = bookmarkButton.dataset.m06Bookmark;
      moduleSixState.bookmarks = moduleSixState.bookmarks.includes(id)
        ? moduleSixState.bookmarks.filter((item) => item !== id)
        : [...moduleSixState.bookmarks, id];
      moduleSixState.selectedEvidence = [...moduleSixState.bookmarks];
      moduleSixState.validationError = '';
      moduleSixSave();
      moduleSixRenderLab('m06-bookmark-title');
      return;
    }

    const detailButton = event.target.closest('[data-m06-detail]');
    if (detailButton) {
      moduleSixState.detailEvent = detailButton.dataset.m06Detail;
      moduleSixSave();
      moduleSixRenderLab('m06-row-detail');
      return;
    }

    if (event.target.closest('[data-m06-detail-close]')) {
      moduleSixState.detailEvent = '';
      moduleSixSave();
      moduleSixRenderLab('m06-workspace-title');
      return;
    }

    if (event.target.closest('[data-m06-reset]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset only this Module 06 lab? Your saved hunt attempt will be cleared.')) return;
      moduleSixState = LabRuntime.reset(MODULE_SIX_LAB_ID, moduleSixUser, moduleSixFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleSixUser, 'soc-analyst', 'soc-06', MODULE_SIX_CATALOG_LAB_KEY, false);
      moduleSixRenderLab('m06-hypothesis-title');
      const status = document.getElementById('m06-status');
      if (status) status.textContent = 'Not started';
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name === 'queryDraft') {
      moduleSixState.queryDrafts[moduleSixState.activeSource] = event.target.value;
      moduleSixSave();
    }
    if (event.target.name === 'notes') {
      moduleSixState.notes = event.target.value;
      const count = root.querySelector('#m06-note-count span');
      if (count) count.textContent = String(event.target.value.length);
      moduleSixSave();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (['hypothesis', 'iocRelationship', 'disposition', 'nextAction'].includes(input.name)) {
      moduleSixState[input.name] = input.value;
      moduleSixState.validationError = '';
      moduleSixSave();
      return;
    }
    const checkboxFields = { scopedDevices: 'scopedDevices', scopedAccounts: 'scopedAccounts', techniques: 'techniques' };
    if (checkboxFields[input.name]) {
      const key = checkboxFields[input.name];
      moduleSixState[key] = input.checked
        ? [...new Set([...moduleSixState[key], input.value])]
        : moduleSixState[key].filter((item) => item !== input.value);
      moduleSixState.validationError = '';
      moduleSixSave();
    }
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm06-form') return;
    event.preventDefault();
    moduleSixState.notes = event.target.elements.notes.value;
    const missing = [];
    if (!moduleSixState.hypothesis) missing.push('hypothesis');
    if (!moduleSixState.queryRuns.endpoint || !moduleSixState.queryRuns.signin) missing.push('both source queries');
    if (!moduleSixState.bookmarks.length) missing.push('bookmarks');
    if (!moduleSixState.scopedDevices.length || !moduleSixState.scopedAccounts.length) missing.push('scope');
    if (!moduleSixState.iocRelationship) missing.push('indicator interpretation');
    if (!moduleSixState.techniques.length) missing.push('ATT&CK mapping');
    if (!moduleSixState.disposition || !moduleSixState.nextAction) missing.push('decision');
    if (moduleSixState.notes.trim().length < 120) missing.push('120-character handoff');
    if (missing.length) {
      moduleSixState.validationError = `Add: ${missing.join(', ')}. Your existing work is saved.`;
      moduleSixSave();
      moduleSixRenderLab('m06-feedback');
      return;
    }
    const result = moduleSixScore();
    moduleSixState.attempts += 1;
    moduleSixState.score = result.score;
    moduleSixState.bestScore = Math.max(moduleSixState.bestScore || 0, result.score);
    moduleSixState.breakdown = result.breakdown;
    moduleSixState.feedback = result.feedback;
    moduleSixState.validationError = '';
    moduleSixState.lastSubmittedAt = new Date().toISOString();
    if (result.score >= MODULE_SIX_PASSING_SCORE) {
      moduleSixState.completed = true;
      if (!moduleSixState.flags.includes(MODULE_SIX_FLAG)) moduleSixState.flags.push(MODULE_SIX_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleSixUser, 'soc-analyst', 'soc-06', MODULE_SIX_CATALOG_LAB_KEY);
    }
    moduleSixSave();
    moduleSixRenderLab('m06-feedback');
    const status = document.getElementById('m06-status');
    if (status) status.textContent = moduleSixState.completed ? 'Complete' : 'In progress';
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 6, moduleKey: 'soc-06',
  view: viewModuleSix, wire: wireModuleSixLab });

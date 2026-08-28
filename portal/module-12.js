/* Module 12 — independent SOC Analyst capstone.
 * The only course module that exposes the integrated investigation range.
 * All people, hosts, addresses, hashes, and business details are synthetic.
 */

const MODULE_TWELVE_LAB_ID = 'm12-integrated-capstone-v1';
const MODULE_TWELVE_CATALOG_KEY = 'lab-capstone';
const MODULE_TWELVE_FLAG = 'M12-CAPSTONE-INVESTIGATION-PASSED';
const MODULE_TWELVE_PASSING_SCORE = 70;

const MODULE_TWELVE_CONSOLES = {
  queue: {
    label: 'Alert queue', icon: 'ri-alarm-warning-line', kicker: 'Triage',
    brief: 'Prioritize the signal and decide whether it represents an incident.',
    rows: [
      ['AL-4821', 'High', 'Script host contacted a rare destination', 'WS-204 · acct-204 · 09:14', 'New'],
      ['AL-4818', 'Medium', 'Approved inventory script used an encoded argument', 'WS-118 · system · 08:40', 'Benign change'],
      ['AL-4812', 'Low', 'Repeated sign-in failures', 'acct-091 · 07:55', 'Resolved'],
    ],
  },
  email: {
    label: 'Email', icon: 'ri-mail-warning-line', kicker: 'Message evidence',
    brief: 'Inspect delivery, authentication, sender context, and the user action.',
    rows: [
      ['EM-210', '09:02', 'Benefits enrollment correction', 'notify@benefits-partner.example', 'acct-204'],
      ['EM-211', '09:03', 'SPF pass; DKIM fail; reply-to mismatch', 'reply@benefits-review.example', 'acct-204'],
      ['EM-212', '09:08', 'Recipient opened linked document', 'redirect → update-check.example', 'acct-204'],
      ['EM-213', '08:57', 'Quarterly wellness newsletter', 'people-ops@mission-next.example', 'All staff'],
    ],
  },
  query: {
    label: 'Query', icon: 'ri-terminal-box-line', kicker: 'SIEM search',
    brief: 'Choose the query that reliably pivots from the alert to related execution.',
    rows: [
      ['DeviceProcessEvents', '09:14', 'WS-204', 'script-host.exe -file policy-update.js'],
      ['DeviceNetworkEvents', '09:15', 'WS-204', '203.0.113.72:443'],
      ['SignInEvents', '09:18', 'acct-204', '203.0.113.72 · unfamiliar client'],
      ['DeviceProcessEvents', '09:22', 'WS-118', 'inventory-script.exe · signed'],
    ],
  },
  endpoint: {
    label: 'Endpoint', icon: 'ri-computer-line', kicker: 'Process & file',
    brief: 'Correlate parent-child execution, persistence, and file identity.',
    rows: [
      ['EP-301', '09:14', 'WS-204', 'document-viewer.exe → script-host.exe'],
      ['EP-302', '09:14', 'WS-204', 'policy-update.js · SHA256 7a51…c902'],
      ['EP-303', '09:17', 'WS-204', 'Run key created: ProfileSync'],
      ['EP-304', '09:22', 'WS-118', 'management-agent.exe → inventory-script.exe'],
    ],
  },
  identity: {
    label: 'Identity', icon: 'ri-user-shared-line', kicker: 'Session analysis',
    brief: 'Distinguish the compromised identity session from routine access.',
    rows: [
      ['ID-401', '09:00', 'acct-204', '192.0.2.24 · managed WS-204 · MFA'],
      ['ID-402', '09:18', 'acct-204', '203.0.113.72 · unfamiliar client · token refresh'],
      ['ID-403', '09:31', 'acct-204', 'Owner denied unfamiliar session'],
      ['ID-404', '09:20', 'backup-job', '192.0.2.80 · registered server'],
    ],
  },
  network: {
    label: 'Network', icon: 'ri-node-tree', kicker: 'Connections & scope',
    brief: 'Bound the affected entities and separate correlated traffic from distractors.',
    rows: [
      ['NW-501', '09:15', 'WS-204', '203.0.113.72:443 · 46 KB received'],
      ['NW-502', '09:26', 'WS-204', '203.0.113.72:443 · 12 KB sent'],
      ['NW-503', '09:24', 'WS-118', '198.51.100.20:443 · approved updater'],
      ['NW-504', '09:36', 'Scope search', 'No other device matched hash + destination'],
    ],
  },
  intel: {
    label: 'Enrichment', icon: 'ri-radar-line', kicker: 'Threat intelligence',
    brief: 'Assess indicator confidence in the context of this incident.',
    rows: [
      ['TI-601', '203.0.113.72', 'Synthetic deny-list match', 'High confidence · first seen 3 days ago'],
      ['TI-602', '7a51…c902', 'Script cluster "Amber Finch"', 'High confidence · unsigned'],
      ['TI-603', '198.51.100.20', 'Approved update service', 'Allow-listed · signed traffic'],
      ['TI-604', 'update-check.example', 'Newly observed redirect host', 'Correlated to EM-212'],
    ],
  },
  exposure: {
    label: 'Exposure', icon: 'ri-shield-flash-line', kicker: 'Contributing condition',
    brief: 'Decide which verified weakness changed incident likelihood or impact.',
    rows: [
      ['VX-701', 'WS-204', 'Script control policy in audit-only mode', 'Verified during incident'],
      ['VX-702', 'WS-118', 'Browser update pending next window', 'Not reached by incident IOC'],
      ['VX-703', 'mail-edge-02', 'Antispam engine current', 'Healthy'],
      ['VX-704', 'WS-204', 'Endpoint sensor healthy', 'Telemetry complete'],
    ],
  },
  response: {
    label: 'Response', icon: 'ri-first-aid-kit-line', kicker: 'Contain & recover',
    brief: 'Select proportional actions, preserve evidence, and define validation.',
    rows: [
      ['RS-801', 'Endpoint playbook', 'Isolate host while retaining response channel', 'Authorized'],
      ['RS-802', 'Identity playbook', 'Revoke sessions, disable account, reset credentials', 'Authorized'],
      ['RS-803', 'Indicator control', 'Block hash and destination; monitor recurrence', 'Authorized'],
      ['RS-804', 'Recovery gate', 'Clean scan + policy fix + owner validation', 'Required'],
    ],
  },
  case: {
    label: 'Case file', icon: 'ri-file-list-3-line', kicker: 'Evidence & reporting',
    brief: 'Preserve the reasoning chain and communicate impact without overstating certainty.',
    rows: [
      ['EV-901', 'Endpoint export', 'SHA256 recorded; collected 09:44Z', 'Custodian SOC-04'],
      ['EV-902', 'Identity export', 'Session records; collected 09:46Z', 'Custodian SOC-04'],
      ['EV-903', 'Email export', 'Headers + redirect chain; collected 09:49Z', 'Custodian SOC-04'],
      ['EV-904', 'Case state', 'INC-4821 · containment pending', 'Owner IR lead'],
    ],
  },
};

const MODULE_TWELVE_EVIDENCE = [
  { id: 'EM-212', label: 'Email link opened', detail: 'Recipient action at 09:08 led through the redirect host.' },
  { id: 'EP-301', label: 'Suspicious process ancestry', detail: 'The document viewer spawned an unsigned script host at 09:14.' },
  { id: 'EP-303', label: 'Persistence established', detail: 'The script host created the ProfileSync Run key at 09:17.' },
  { id: 'ID-402', label: 'Unfamiliar identity session', detail: 'The correlated address refreshed acct-204 at 09:18.' },
  { id: 'NW-501', label: 'Correlated destination', detail: 'WS-204 contacted 203.0.113.72 one minute after execution.' },
  { id: 'NW-504', label: 'Bounded scope result', detail: 'No second device matched both indicators in the available telemetry.' },
];

const MODULE_TWELVE_REQUIREMENTS = [
  ['Triage', 'Classify and prioritize the incident.'],
  ['Query', 'Select a reproducible cross-source query.'],
  ['Timeline', 'Reconstruct chronology from discovered evidence.'],
  ['Scope', 'Name affected entities without overstating absence.'],
  ['Enrichment', 'Interpret indicators in incident context.'],
  ['ATT&CK', 'Map only demonstrated behaviors.'],
  ['Detection', 'Propose durable logic and safe tuning.'],
  ['Response', 'Contain, eradicate, and recover proportionately.'],
  ['Evidence', 'Preserve a defensible evidence record.'],
  ['Reporting', 'Write technical and executive findings.'],
  ['Closure', 'Verify recovery and assign follow-up.'],
  ['Submission', 'Pass the independent investigation.'],
];

function moduleTwelveFreshDefaults() {
  return {
    activeConsole: 'queue', reviewedConsoles: [], selectedEvidence: [], stageVisits: [],
    answers: {}, executiveSummary: '', analystNarrative: '', closureNote: '',
    hintsOpened: [], simulatorLaunched: false, breakdown: null, feedback: [],
    criticalErrors: [], validationError: '', lastSubmittedAt: '',
  };
}

let moduleTwelveState = null;
let moduleTwelveUser = null;
let moduleTwelveProgram = null;

function moduleTwelvePrerequisites(user, program) {
  return Array.from({ length: 11 }, (_, index) => {
    const key = `soc-${String(index + 1).padStart(2, '0')}`;
    const result = typeof moduleCompletion === 'function'
      ? moduleCompletion(program, key, user)
      : { complete: false };
    return { key, number: index + 1, title: program.modules[key].title, complete: result.complete === true };
  });
}

function moduleTwelveUnlocked(user, program) {
  return moduleTwelvePrerequisites(user, program).every((item) => item.complete);
}

function moduleTwelveLoad(user, program) {
  moduleTwelveUser = user;
  moduleTwelveProgram = program;
  moduleTwelveState = LabRuntime.load(MODULE_TWELVE_LAB_ID, user, moduleTwelveFreshDefaults());
  ['reviewedConsoles', 'selectedEvidence', 'stageVisits', 'hintsOpened', 'feedback', 'criticalErrors', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleTwelveState[key])) moduleTwelveState[key] = [];
  });
  if (!moduleTwelveState.answers || typeof moduleTwelveState.answers !== 'object') moduleTwelveState.answers = {};
  if (!MODULE_TWELVE_CONSOLES[moduleTwelveState.activeConsole]) moduleTwelveState.activeConsole = 'queue';
  if (moduleTwelveUnlocked(user, program) && typeof markModuleContentOpened === 'function') {
    markModuleContentOpened(user, 'soc-analyst', 'soc-12');
  }
  return moduleTwelveState;
}

function moduleTwelveSave() {
  if (moduleTwelveUser && moduleTwelveState) LabRuntime.save(MODULE_TWELVE_LAB_ID, moduleTwelveUser, moduleTwelveState);
}

function moduleTwelveSetEqual(actual, expected) {
  const left = [...new Set(actual || [])].sort();
  const right = [...new Set(expected || [])].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function moduleTwelveValues(name) {
  const value = moduleTwelveState.answers[name];
  return Array.isArray(value) ? value : [];
}

function moduleTwelveLaunchUrl() {
  const lab = typeof LABS !== 'undefined' ? LABS.find((item) => item.key === MODULE_TWELVE_CATALOG_KEY) : null;
  const route = lab && lab.simEntry ? lab.simEntry : '#/defender/home';
  return `${SIM_ORIGIN}?lab=${encodeURIComponent(MODULE_TWELVE_CATALOG_KEY)}&module=soc-12${route}`;
}

function moduleTwelveScore() {
  const a = moduleTwelveState.answers;
  const timelineCorrect = a.t1 === 'email' && a.t2 === 'execution' && a.t3 === 'network' && a.t4 === 'identity';
  const domains = [
    ['Triage', a.verdict === 'true-positive' && a.severity === 'high'],
    ['Query', a.query === 'correlated-pivot'],
    ['Timeline', timelineCorrect],
    ['Scope', moduleTwelveSetEqual(moduleTwelveValues('scope'), ['acct-204', 'ws-204']) && a.scopeLimit === 'bounded'],
    ['Enrichment', a.enrichment === 'correlated-malicious'],
    ['ATT&CK', moduleTwelveSetEqual(moduleTwelveValues('attack'), ['T1059.007', 'T1071.001', 'T1204.001', 'T1547.001'])],
    ['Detection', a.detection === 'parent-hash-destination' && a.tuning === 'signed-approved-parent'],
    ['Response', moduleTwelveSetEqual(moduleTwelveValues('response'), ['block-ioc', 'isolate-ws204', 'preserve', 'revoke-acct204'])],
    ['Reporting', moduleTwelveState.executiveSummary.trim().length >= 180 && moduleTwelveState.analystNarrative.trim().length >= 260],
    ['Closure', a.closure === 'verified-recovery' && a.followup === 'policy-owner' && moduleTwelveState.closureNote.trim().length >= 100],
  ];
  const criticalErrors = [];
  if (a.verdict === 'benign-close') criticalErrors.push('The confirmed incident was closed as benign.');
  if (moduleTwelveValues('scope').includes('acct-091')) criticalErrors.push('The response targeted an unrelated identity.');
  if (moduleTwelveValues('response').includes('delete-evidence')) criticalErrors.push('Evidence deletion breaks preservation and review.');
  if (moduleTwelveValues('response').includes('shutdown-all')) criticalErrors.push('Enterprise-wide shutdown is unsupported by the bounded scope.');
  if (a.closure === 'close-after-block') criticalErrors.push('The case was closed before recovery validation.');
  const raw = domains.reduce((sum, item) => sum + (item[1] ? 10 : 0), 0);
  const hintPenalty = Math.min(moduleTwelveState.hintsOpened.length * 5, 15);
  const score = Math.max(0, raw - hintPenalty);
  return {
    score, raw, hintPenalty, criticalErrors,
    breakdown: domains.map(([label, correct]) => ({ label, score: correct ? 10 : 0 })),
    feedback: domains.filter((item) => !item[1]).map((item) => `Revisit ${item[0]}: the submitted conclusion is incomplete or unsupported by the synthetic record.`),
  };
}

function moduleTwelveHeader() {
  return `<header class="m12-topbar">
    <a class="m12-brand" href="#/portal" aria-label="Mission Next Technical Academy portal"><img src="assets/logo.png" alt="Mission Next Technical Academy"></a>
    <div class="m12-top-actions"><span class="m12-simulation"><i class="ri-shield-check-line" aria-hidden="true"></i> Synthetic capstone range</span>
      <a class="m12-exit" href="#/program/soc-analyst"><i class="ri-arrow-left-line" aria-hidden="true"></i> Exit capstone</a></div>
  </header>`;
}

function moduleTwelveLockedView(user, program) {
  const prerequisites = moduleTwelvePrerequisites(user, program);
  const complete = prerequisites.filter((item) => item.complete).length;
  const module = program.modules['soc-12'];
  return `<div class="m12-shell">${moduleTwelveHeader()}<main class="m12-main">
    <section class="m12-hero m12-hero-locked" aria-labelledby="m12-title">
      <div><p class="m12-kicker">Module 12 · ${formatInstructionalMinutes(module.durationMinutes)} · Independent capstone</p><h1 id="m12-title">${esc(module.title)}</h1>
      <p>The integrated range stays sealed until every preceding module is complete. This prevents future evidence and the end-to-end scenario from bypassing the course sequence.</p></div>
      <div class="m12-lock-mark"><i class="ri-lock-2-line" aria-hidden="true"></i><strong>${complete}/11</strong><span>prerequisites complete</span></div>
    </section>
    <section class="m12-section" aria-labelledby="m12-gate-title"><div class="m12-section-heading"><span><i class="ri-git-merge-line" aria-hidden="true"></i></span><div><p class="m12-kicker">Prerequisite gate</p><h2 id="m12-gate-title">Complete Modules 01–11 to unlock the incident</h2></div></div>
      <p class="m12-muted">Only completion status is shown. Incident evidence, investigation consoles, hints, and the simulator launch remain unavailable while the gate is closed.</p>
      <div class="m12-prereq-grid">${prerequisites.map((item) => `<a href="#/program/soc-analyst/module/${item.number}" class="m12-prereq ${item.complete ? 'is-complete' : ''}"><span>${String(item.number).padStart(2, '0')}</span><div><strong>${esc(item.title)}</strong><small>${item.complete ? 'Complete' : 'Required'}</small></div><i class="${item.complete ? 'ri-checkbox-circle-fill' : 'ri-lock-line'}" aria-hidden="true"></i></a>`).join('')}</div>
    </section>
  </main></div>`;
}

function moduleTwelveConsole() {
  const current = MODULE_TWELVE_CONSOLES[moduleTwelveState.activeConsole];
  return `<div class="m12-console-shell">
    <nav class="m12-console-nav" aria-label="Integrated investigation consoles">${Object.entries(MODULE_TWELVE_CONSOLES).map(([key, consoleItem]) => `<button type="button" data-m12-console="${key}" aria-current="${key === moduleTwelveState.activeConsole ? 'page' : 'false'}"><i class="${consoleItem.icon}" aria-hidden="true"></i><span>${esc(consoleItem.label)}</span>${moduleTwelveState.reviewedConsoles.includes(key) ? '<i class="ri-checkbox-circle-fill m12-reviewed" aria-label="Reviewed"></i>' : ''}</button>`).join('')}</nav>
    <section class="m12-console" aria-live="polite" aria-labelledby="m12-console-title">
      <div class="m12-console-title"><div><p class="m12-kicker">${esc(current.kicker)}</p><h3 id="m12-console-title">${esc(current.label)}</h3><p>${esc(current.brief)}</p></div><span>${current.rows.length} records</span></div>
      <div class="m12-table-wrap"><table><thead><tr><th>Record</th><th>Time / entity</th><th>Source</th><th>Observation</th></tr></thead><tbody>
        ${current.rows.map((row) => `<tr>${row.map((cell, index) => `<td data-label="${['Record', 'Time / entity', 'Source', 'Observation'][index]}">${index === 0 ? `<code>${esc(cell)}</code>` : esc(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
      <button class="m12-review" type="button" data-m12-review="${esc(moduleTwelveState.activeConsole)}"><i class="ri-bookmark-3-line" aria-hidden="true"></i> Mark console reviewed</button>
    </section>
  </div>`;
}

function moduleTwelveEvidenceTray() {
  return `<section class="m12-evidence" aria-labelledby="m12-evidence-title"><div><p class="m12-kicker">Evidence tray</p><h3 id="m12-evidence-title">Build the defensible reasoning chain</h3><p>Select only records that establish entry, execution, persistence, identity activity, network correlation, or bounded scope.</p></div>
    <div class="m12-evidence-grid">${MODULE_TWELVE_EVIDENCE.map((item) => `<label><input type="checkbox" name="selectedEvidence" value="${item.id}" ${moduleTwelveState.selectedEvidence.includes(item.id) ? 'checked' : ''}><span><strong><code>${item.id}</code> ${esc(item.label)}</strong><small>${esc(item.detail)}</small></span></label>`).join('')}</div></section>`;
}

function moduleTwelveOption(name, value, label, help, checked) {
  return `<label><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span><strong>${esc(label)}</strong><small>${esc(help)}</small></span></label>`;
}

function moduleTwelveCheck(name, value, label, checked) {
  return `<label><input type="checkbox" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${esc(label)}</span></label>`;
}

function moduleTwelveAssessment() {
  const a = moduleTwelveState.answers;
  return `<form id="m12-assessment" class="m12-assessment" novalidate>
    <div class="m12-assessment-heading"><div><p class="m12-kicker">Portfolio artifact</p><h2>Independent incident record</h2><p>Submit conclusions in any working order. Every section is required; the labels do not reveal the underlying attack chronology.</p></div><span>Pass ${MODULE_TWELVE_PASSING_SCORE}% + no critical errors</span></div>
    <div class="m12-form-grid">
      <fieldset><legend>Triage</legend>${moduleTwelveOption('verdict','true-positive','True-positive incident','Evidence supports unauthorized execution and identity activity.',a.verdict==='true-positive')}${moduleTwelveOption('verdict','benign-close','Benign — close alert','Treat the correlated activity as routine.',a.verdict==='benign-close')}
        <label class="m12-select-label">Priority<select name="severity"><option value="">Choose…</option><option value="high" ${a.severity==='high'?'selected':''}>High — confirmed compromise, bounded scope</option><option value="low" ${a.severity==='low'?'selected':''}>Low — informational only</option></select></label></fieldset>
      <fieldset><legend>Query</legend>${moduleTwelveOption('query','correlated-pivot','Correlate hash, device, destination, and identity within the incident window','Preserves entity and time relationships across process, network, and sign-in tables.',a.query==='correlated-pivot')}${moduleTwelveOption('query','all-errors','Return every error from every table','High volume does not test the incident hypothesis.',a.query==='all-errors')}</fieldset>
      <fieldset class="m12-wide"><legend>Timeline reconstruction</legend><div class="m12-timeline-inputs">${[['t1','First'],['t2','Second'],['t3','Third'],['t4','Fourth']].map(([name,label]) => `<label>${label}<select name="${name}"><option value="">Choose event…</option><option value="email" ${a[name]==='email'?'selected':''}>Recipient opened linked document</option><option value="execution" ${a[name]==='execution'?'selected':''}>Unsigned script execution</option><option value="network" ${a[name]==='network'?'selected':''}>Correlated outbound connection</option><option value="identity" ${a[name]==='identity'?'selected':''}>Unfamiliar token refresh</option></select></label>`).join('')}</div></fieldset>
      <fieldset><legend>Scope</legend>${moduleTwelveCheck('scope','ws-204','WS-204',moduleTwelveValues('scope').includes('ws-204'))}${moduleTwelveCheck('scope','acct-204','acct-204',moduleTwelveValues('scope').includes('acct-204'))}${moduleTwelveCheck('scope','ws-118','WS-118',moduleTwelveValues('scope').includes('ws-118'))}${moduleTwelveCheck('scope','acct-091','acct-091',moduleTwelveValues('scope').includes('acct-091'))}
        <label class="m12-select-label">Scope statement<select name="scopeLimit"><option value="">Choose…</option><option value="bounded" ${a.scopeLimit==='bounded'?'selected':''}>One host/account in available telemetry; continue monitoring</option><option value="clean" ${a.scopeLimit==='clean'?'selected':''}>The entire enterprise is proven clean</option></select></label></fieldset>
      <fieldset><legend>Enrichment</legend>${moduleTwelveOption('enrichment','correlated-malicious','High-confidence malicious in this incident','Hash, destination, redirect, timing, and behavior corroborate one another.',a.enrichment==='correlated-malicious')}${moduleTwelveOption('enrichment','ip-alone','Malicious because any unfamiliar IP is hostile','An address alone is insufficient without context.',a.enrichment==='ip-alone')}</fieldset>
      <fieldset class="m12-wide"><legend>ATT&amp;CK mapping</legend><div class="m12-check-grid">${[['T1204.001','User Execution: Malicious Link'],['T1059.007','JavaScript/JScript'],['T1547.001','Registry Run Keys / Startup Folder'],['T1071.001','Web Protocols'],['T1021.001','Remote Desktop Protocol']].map(([id,label]) => moduleTwelveCheck('attack',id,`${id} — ${label}`,moduleTwelveValues('attack').includes(id))).join('')}</div></fieldset>
      <fieldset><legend>Detection</legend>${moduleTwelveOption('detection','parent-hash-destination','Correlate unusual parent/child + script hash + rare destination','Behavior and indicator correlation raises precision.',a.detection==='parent-hash-destination')}${moduleTwelveOption('detection','all-script-hosts','Alert on every script-host launch','This would overwhelm the queue with routine administration.',a.detection==='all-script-hosts')}
        <label class="m12-select-label">Safe tuning<select name="tuning"><option value="">Choose…</option><option value="signed-approved-parent" ${a.tuning==='signed-approved-parent'?'selected':''}>Exclude signed inventory child only under approved parent/path</option><option value="disable" ${a.tuning==='disable'?'selected':''}>Disable detection during business hours</option></select></label></fieldset>
      <fieldset><legend>Response &amp; evidence</legend>${moduleTwelveCheck('response','isolate-ws204','Isolate WS-204; retain response channel',moduleTwelveValues('response').includes('isolate-ws204'))}${moduleTwelveCheck('response','revoke-acct204','Revoke and disable acct-204; reset credentials',moduleTwelveValues('response').includes('revoke-acct204'))}${moduleTwelveCheck('response','block-ioc','Block hash/destination and monitor',moduleTwelveValues('response').includes('block-ioc'))}${moduleTwelveCheck('response','preserve','Hash and preserve exports with custody details',moduleTwelveValues('response').includes('preserve'))}${moduleTwelveCheck('response','shutdown-all','Shut down every enterprise endpoint',moduleTwelveValues('response').includes('shutdown-all'))}${moduleTwelveCheck('response','delete-evidence','Delete telemetry after containment',moduleTwelveValues('response').includes('delete-evidence'))}</fieldset>
      <fieldset class="m12-wide"><legend>Reporting</legend><label class="m12-text-label">Executive summary <small>At least 180 characters: what happened, business impact, current status, and next decision.</small><textarea name="executiveSummary" rows="5">${esc(moduleTwelveState.executiveSummary)}</textarea><span id="m12-exec-count">${moduleTwelveState.executiveSummary.length}/180</span></label>
        <label class="m12-text-label">Technical investigation narrative <small>At least 260 characters: evidence-based entry, execution, identity, scope, response, and uncertainty.</small><textarea name="analystNarrative" rows="7">${esc(moduleTwelveState.analystNarrative)}</textarea><span id="m12-narrative-count">${moduleTwelveState.analystNarrative.length}/260</span></label></fieldset>
      <fieldset class="m12-wide"><legend>Closure</legend><div class="m12-two-col">${moduleTwelveOption('closure','verified-recovery','Close after verified recovery','Clean scan, persistence removal, policy correction, identity reset, and owner validation recorded.',a.closure==='verified-recovery')}${moduleTwelveOption('closure','close-after-block','Close immediately after blocking the IP','Containment alone does not establish recovery.',a.closure==='close-after-block')}${moduleTwelveOption('followup','policy-owner','Assign script-control remediation to endpoint policy owner','Names an accountable owner and addresses the contributing control gap.',a.followup==='policy-owner')}${moduleTwelveOption('followup','none','No follow-up needed','The audit-only script control remains a recurrence risk.',a.followup==='none')}</div>
        <label class="m12-text-label">Closure note <small>At least 100 characters: validation evidence, residual risk, owner, and monitoring.</small><textarea name="closureNote" rows="4">${esc(moduleTwelveState.closureNote)}</textarea><span id="m12-close-count">${moduleTwelveState.closureNote.length}/100</span></label></fieldset>
    </div>
    <details class="m12-hint" data-m12-hint="timeline" ${moduleTwelveState.hintsOpened.includes('timeline')?'open':''}><summary>Emergency timeline hint (−5 points)</summary><p>Compare the email action, process creation, first network connection, and token refresh timestamps. Order those observed events without assuming intent.</p></details>
    <details class="m12-hint" data-m12-hint="response" ${moduleTwelveState.hintsOpened.includes('response')?'open':''}><summary>Emergency response hint (−5 points)</summary><p>Act only on the confirmed host, account, and indicators. Preserve evidence before eradication, then validate recovery.</p></details>
    <div class="m12-actions"><button type="submit" class="m12-submit"><i class="ri-flag-line" aria-hidden="true"></i> Submit capstone investigation</button><button type="button" class="m12-reset" data-m12-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset capstone only</button></div>
    <div id="m12-feedback" tabindex="-1">${moduleTwelveFeedback()}</div>
  </form>`;
}

function moduleTwelveFeedback() {
  if (moduleTwelveState.validationError) return `<div class="m12-validation" role="alert"><i class="ri-error-warning-line" aria-hidden="true"></i><div><strong>Submission is incomplete</strong><p>${esc(moduleTwelveState.validationError)}</p></div></div>`;
  if (!moduleTwelveState.breakdown) return `<div class="m12-score-empty"><strong>No scored attempt yet.</strong><p>Your work saves locally as you investigate. A pass requires ${MODULE_TWELVE_PASSING_SCORE}% or higher and no critical response, evidence, identity, triage, or closure error.</p></div>`;
  const passed = moduleTwelveState.completed;
  return `<section class="m12-score ${passed ? 'is-pass' : 'is-remediate'}" aria-live="polite"><div class="m12-score-heading"><div><p class="m12-kicker">${passed ? 'Capstone passed' : 'Remediation required'}</p><h3>${passed ? 'End-to-end investigation complete' : 'Revise and resubmit the incident record'}</h3><p>Best ${moduleTwelveState.bestScore}% · ${moduleTwelveState.attempts} attempt${moduleTwelveState.attempts === 1 ? '' : 's'} · ${moduleTwelveState.hintsOpened.length * 5} hint points used</p></div><span>${moduleTwelveState.score}%</span></div>
    <div class="m12-score-grid">${moduleTwelveState.breakdown.map((item) => `<div><strong>${item.score}/10</strong><span>${esc(item.label)}</span></div>`).join('')}</div>
    ${moduleTwelveState.criticalErrors.length ? `<div class="m12-critical"><strong>Critical-error gate</strong><ul>${moduleTwelveState.criticalErrors.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}
    ${moduleTwelveState.feedback.length ? `<div class="m12-remediation"><strong>Explainable scoring</strong><ul>${moduleTwelveState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '<p class="m12-perfect">All ten scored domains are supported by the submitted artifact.</p>'}
    ${passed ? `<div class="m12-portfolio"><i class="ri-award-line" aria-hidden="true"></i><div><strong>Portfolio-ready capstone record earned</strong><p>The synthetic incident report, timeline, evidence decisions, response plan, and closure record remain saved to this anonymous local learner profile.</p></div></div>` : ''}</section>`;
}

function moduleTwelveMissionStatus() {
  const visited = new Set(moduleTwelveState.stageVisits || []);
  return `<div class="m12-requirements">${MODULE_TWELVE_REQUIREMENTS.map(([label, detail], index) => `<div class="${visited.has(label.toLowerCase()) || (index === 11 && moduleTwelveState.completed) ? 'is-seen' : ''}"><span>${String(index + 1).padStart(2,'0')}</span><p><strong>${esc(label)}</strong><small>${esc(detail)}</small></p></div>`).join('')}</div>`;
}

function viewModuleTwelve(user, program) {
  moduleTwelveLoad(user, program);
  if (!moduleTwelveUnlocked(user, program)) return moduleTwelveLockedView(user, program);
  const module = program.modules['soc-12'];
  return `<div class="m12-shell">${moduleTwelveHeader()}<main class="m12-main">
    <section class="m12-hero" aria-labelledby="m12-title"><div><p class="m12-kicker">Module 12 · ${formatInstructionalMinutes(module.durationMinutes)} · Final Assessment</p><h1 id="m12-title">${esc(module.title)}</h1><p class="m12-kicker">Case scenario · Operation Amber Finch</p><p>Investigate a synthetic high-priority signal across the complete Mission Next security operations range. Discover what happened, bound impact, improve detection, direct response, and close the case with a portfolio-grade report. This capstone integrates all competencies from Modules 01–11 into one independent Prove assessment.</p>
      <div class="m12-hero-actions"><a class="m12-primary" href="${esc(moduleTwelveLaunchUrl())}" target="_blank" rel="noopener" data-m12-launch><i class="ri-terminal-box-line" aria-hidden="true"></i> Open integrated simulator</a><a class="m12-secondary" href="#m12-range"><i class="ri-arrow-down-line" aria-hidden="true"></i> Investigate here</a></div><p class="m12-launch-note">${moduleTwelveState.simulatorLaunched ? 'Simulator launch recorded. Portal work remains saved separately.' : 'Opens the catalogue route in a new tab; all data is fictional.'}</p></div>
      <dl><div><dt>Case</dt><dd>INC-4821</dd></div><div><dt>Mode</dt><dd>Independent assessment</dd></div><div><dt>Pass</dt><dd>${MODULE_TWELVE_PASSING_SCORE}% (seven of ten domains) + safety gate</dd></div></dl></section>
    <section class="m12-objective"><div><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Rubric scoring</p><h2>Ten scored domains (10 points each): Triage, Query, Timeline, Scope, Enrichment, ATT&CK, Detection, Response, Reporting, and Closure. Pass requires 70 points plus no critical-error violations (false triage, unsafe scope, evidence loss, or unsupported closure).</h2></div></section>
    <section class="m12-objective"><div><i class="ri-git-merge-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Prior instruction</p><h2>This capstone draws on skills from all 11 prior modules: SOC operations foundations (M01), network and identity foundations (M02), SIEM and log analysis (M03), detection rule tuning (M04), endpoint investigation (M05), threat hunting (M06), network and email analysis (M07), vulnerability prioritization (M08), incident response (M09), evidence handling and case documentation (M10), and SOC metrics and communication (M11).</h2></div></section>
    <section class="m12-section" aria-labelledby="m12-mission-title"><div class="m12-section-heading"><span><i class="ri-route-line" aria-hidden="true"></i></span><div><p class="m12-kicker">Mission requirements</p><h2 id="m12-mission-title">Outcomes, not a prescribed attack path</h2></div></div><p class="m12-muted">The twelve requirements may be completed in any order. They describe the deliverable, not the attacker's sequence; discover chronology from the evidence.</p>${moduleTwelveMissionStatus()}</section>
    <section class="m12-section m12-range-section" id="m12-range" aria-labelledby="m12-range-title"><div class="m12-section-heading"><span><i class="ri-dashboard-3-line" aria-hidden="true"></i></span><div><p class="m12-kicker">Complete integrated range</p><h2 id="m12-range-title">Investigation consoles</h2></div></div><div id="m12-console-root">${moduleTwelveConsole()}</div>${moduleTwelveEvidenceTray()}</section>
    <section class="m12-section m12-assessment-section">${moduleTwelveAssessment()}</section>
  </main></div>`;
}

function moduleTwelveValidation() {
  const a = moduleTwelveState.answers;
  const missing = [];
  if (moduleTwelveState.reviewedConsoles.length < Object.keys(MODULE_TWELVE_CONSOLES).length) missing.push('review all ten integrated consoles');
  if (!moduleTwelveSetEqual(moduleTwelveState.selectedEvidence, MODULE_TWELVE_EVIDENCE.map((item) => item.id))) missing.push('select the six records that form the evidence chain');
  ['verdict','severity','query','t1','t2','t3','t4','scopeLimit','enrichment','detection','tuning','closure','followup'].forEach((key) => { if (!a[key]) missing.push(`complete ${key}`); });
  if (!moduleTwelveValues('scope').length) missing.push('identify scope');
  if (!moduleTwelveValues('attack').length) missing.push('map ATT&CK behavior');
  if (!moduleTwelveValues('response').length) missing.push('select response actions');
  if (moduleTwelveState.executiveSummary.trim().length < 180) missing.push('write a 180-character executive summary');
  if (moduleTwelveState.analystNarrative.trim().length < 260) missing.push('write a 260-character technical narrative');
  if (moduleTwelveState.closureNote.trim().length < 100) missing.push('write a 100-character closure note');
  return [...new Set(missing)];
}

function moduleTwelveRender(focusId) {
  const root = document.getElementById('app');
  if (!root || !moduleTwelveUser || !moduleTwelveProgram) return;
  root.innerHTML = viewModuleTwelve(moduleTwelveUser, moduleTwelveProgram);
  wireCommon();
  // This helper replaces the whole app shell, so restore this module's own
  // delegated listeners in addition to the shared portal listeners.
  wireModuleTwelveLab();
  if (focusId) requestAnimationFrame(() => { const target = document.getElementById(focusId); if (target) target.focus(); });
}

function wireModuleTwelveLab() {
  const shell = document.querySelector('.m12-shell');
  if (!shell || !moduleTwelveState || !moduleTwelveUnlocked(moduleTwelveUser, moduleTwelveProgram)) return;
  // wireCommon() dispatches registered-module wiring itself. Keep this guard
  // because moduleTwelveRender() also calls us explicitly after a full-shell
  // replacement; without it one click could produce two scored attempts.
  if (shell.dataset.m12Wired === 'true') return;
  shell.dataset.m12Wired = 'true';
  shell.addEventListener('click', (event) => {
    const consoleButton = event.target.closest('[data-m12-console]');
    if (consoleButton) {
      moduleTwelveState.activeConsole = consoleButton.dataset.m12Console;
      if (!moduleTwelveState.reviewedConsoles.includes(moduleTwelveState.activeConsole)) moduleTwelveState.reviewedConsoles.push(moduleTwelveState.activeConsole);
      moduleTwelveSave(); moduleTwelveRender('m12-console-title'); return;
    }
    const reviewButton = event.target.closest('[data-m12-review]');
    if (reviewButton) {
      const key = reviewButton.dataset.m12Review;
      if (!moduleTwelveState.reviewedConsoles.includes(key)) moduleTwelveState.reviewedConsoles.push(key);
      moduleTwelveSave(); moduleTwelveRender('m12-console-title'); return;
    }
    if (event.target.closest('[data-m12-launch]')) { moduleTwelveState.simulatorLaunched = true; moduleTwelveSave(); return; }
    if (event.target.closest('[data-m12-reset]')) {
      if (typeof window.confirm === 'function' && !window.confirm('Reset only the Module 12 capstone? Modules 01–11 and other labs remain unchanged.')) return;
      moduleTwelveState = LabRuntime.reset(MODULE_TWELVE_LAB_ID, moduleTwelveUser, moduleTwelveFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY, false);
      moduleTwelveRender('m12-title');
    }
  });
  shell.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m12-hint]');
    if (!hint || !hint.open) return;
    const id = hint.dataset.m12Hint;
    if (!moduleTwelveState.hintsOpened.includes(id)) { moduleTwelveState.hintsOpened.push(id); moduleTwelveSave(); }
  }, true);
  shell.addEventListener('input', (event) => {
    const input = event.target;
    if (input.name === 'executiveSummary' || input.name === 'analystNarrative' || input.name === 'closureNote') {
      moduleTwelveState[input.name] = input.value;
      const counter = document.getElementById(input.name === 'executiveSummary' ? 'm12-exec-count' : input.name === 'analystNarrative' ? 'm12-narrative-count' : 'm12-close-count');
      if (counter) counter.textContent = `${input.value.length}/${input.name === 'executiveSummary' ? 180 : input.name === 'analystNarrative' ? 260 : 100}`;
      moduleTwelveSave();
    }
  });
  shell.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'selectedEvidence') {
      moduleTwelveState.selectedEvidence = input.checked ? [...new Set([...moduleTwelveState.selectedEvidence, input.value])] : moduleTwelveState.selectedEvidence.filter((id) => id !== input.value);
    } else if (['scope','attack','response'].includes(input.name)) {
      const values = moduleTwelveValues(input.name);
      moduleTwelveState.answers[input.name] = input.checked ? [...new Set([...values, input.value])] : values.filter((value) => value !== input.value);
    } else if (input.name) {
      moduleTwelveState.answers[input.name] = input.value;
    }
    const stageMap = { verdict:'triage', severity:'triage', query:'query', t1:'timeline', t2:'timeline', t3:'timeline', t4:'timeline', scope:'scope', scopeLimit:'scope', enrichment:'enrichment', attack:'att&ck', detection:'detection', tuning:'detection', response:'response', closure:'closure', followup:'closure' };
    if (stageMap[input.name] && !moduleTwelveState.stageVisits.includes(stageMap[input.name])) moduleTwelveState.stageVisits.push(stageMap[input.name]);
    moduleTwelveState.validationError = ''; moduleTwelveSave();
  });
  const form = document.getElementById('m12-assessment');
  if (form) form.addEventListener('submit', (event) => {
    event.preventDefault();
    moduleTwelveState.executiveSummary = form.elements.executiveSummary.value;
    moduleTwelveState.analystNarrative = form.elements.analystNarrative.value;
    moduleTwelveState.closureNote = form.elements.closureNote.value;
    ['evidence','reporting','submission'].forEach((stage) => { if (!moduleTwelveState.stageVisits.includes(stage)) moduleTwelveState.stageVisits.push(stage); });
    const missing = moduleTwelveValidation();
    if (missing.length) {
      moduleTwelveState.validationError = `Add: ${missing.join('; ')}. Your current work is saved.`;
      moduleTwelveSave(); moduleTwelveRender('m12-feedback'); return;
    }
    const result = moduleTwelveScore();
    moduleTwelveState.attempts += 1;
    moduleTwelveState.score = result.score;
    moduleTwelveState.bestScore = Math.max(moduleTwelveState.bestScore || 0, result.score);
    moduleTwelveState.breakdown = result.breakdown;
    moduleTwelveState.feedback = result.feedback;
    moduleTwelveState.criticalErrors = result.criticalErrors;
    moduleTwelveState.validationError = '';
    moduleTwelveState.lastSubmittedAt = new Date().toISOString();
    moduleTwelveState.completed = result.score >= MODULE_TWELVE_PASSING_SCORE && result.criticalErrors.length === 0;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTwelveUser, MODULE_TWELVE_CATALOG_KEY, {
        state: moduleTwelveState.completed ? 'complete' : 'in_progress',
        score: result.score,
        result: {
          breakdown: result.breakdown,
          feedback: result.feedback,
          criticalErrors: result.criticalErrors,
          hintPenalty: result.hintPenalty,
          attempts: moduleTwelveState.attempts,
        },
      });
    }
    if (moduleTwelveState.completed) {
      if (!moduleTwelveState.flags.includes(MODULE_TWELVE_FLAG)) moduleTwelveState.flags.push(MODULE_TWELVE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY);
      // architecture.md §3 Sprint 4 / CURRICULUM_ALIGNMENT_ARCHITECTURE.md §5:
      // Module 12 IS the capstone (one Prove assessment, not a 12-stage flow),
      // so this writes the student's single capstone_submissions row (stage
      // is always the constant 12) only on an actual pass — a failed attempt
      // is already captured by the recordLabAttempt() call above and does not
      // get a capstone_submissions row (that table has no in-progress state).
      if (typeof recordCapstoneSubmission === 'function') {
        recordCapstoneSubmission(moduleTwelveUser, {
          score: result.score,
          answers: {
            responses: moduleTwelveState.answers,
            executiveSummary: moduleTwelveState.executiveSummary,
            analystNarrative: moduleTwelveState.analystNarrative,
            closureNote: moduleTwelveState.closureNote,
            breakdown: result.breakdown,
            feedback: result.feedback,
            criticalErrors: result.criticalErrors,
            hintPenalty: result.hintPenalty,
            attempts: moduleTwelveState.attempts,
          },
        });
      }
    } else if (typeof markModuleLabComplete === 'function') {
      markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY, false);
    }
    moduleTwelveSave(); moduleTwelveRender('m12-feedback');
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 12, moduleKey: 'soc-12', view: viewModuleTwelve, wire: wireModuleTwelveLab });

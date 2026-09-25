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

// Visible continuity cues for the capstone. These are reminders of where the
// learner practised each decision earlier; they do not create extra stages,
// score domains, evidence, or instructional minutes.
const MODULE_TWELVE_ARC_CALLBACKS = [
  'M01 foundations: classify a signal before acting; M09 Cedar Lock: use lifecycle discipline under pressure.',
  'M03 SIEM & log analysis: make the pivot reproducible and join sources by entity and time.',
  'M03 correlation plus M10 custody: order observed events and preserve the timestamps that support them.',
  'M02 identity scope plus M08 prioritization: name the affected host/account and bound the search result.',
  'M04 detection/intelligence plus M08 exposure: weigh context, reachability, and the contributing control gap.',
  'M05 endpoint and M06 hunting plus M10 mapping: map demonstrated behavior, not an imagined full chain.',
  'M04 tuning plus M06 hypothesis testing: improve precision without hiding the behavior or disabling coverage.',
  'M09 Operation Cedar Lock: contain proportionately, preserve evidence, then move toward recovery.',
  'M10 chain of custody: retain identifiers, provenance, integrity, and explicit evidence boundaries.',
  'M11 reporting: separate executive decisions from the technical narrative and state uncertainty plainly.',
  'M09 recovery gates plus M11 ownership: verify the fix, assign follow-up, and define monitoring.',
  'M01–M11 synthesis: submit one defensible Amber Finch record; the rubric remains the authoritative score.',
];

// These are orientation materials for the independent range, not scored
// stages. The capstone deliberately keeps its single integrated assessment
// below this section rather than splitting the experience into L→Q→L units.
const MODULE_TWELVE_PREPARATION_LECTURES = [
  {
    title: 'Scenario orientation',
    focus: 'Read the case as an analyst, not as a puzzle with a hidden answer.',
    script: 'Operation Amber Finch begins with a high-priority signal involving a user, a workstation, and a suspicious destination. Your job is to decide what the record proves, what it does not prove, and what action is safe. The expected outcome is a defensible incident record: a bounded scope, a reproducible timeline, proportionate response, and a clear recovery gate.',
    practice: 'Before opening a console, write a one-sentence working hypothesis and list the entities and time window you will test.',
  },
  {
    title: 'Environment architecture',
    focus: 'Understand how the synthetic range connects signals, evidence, and case work.',
    script: 'The range presents several analyst surfaces over one shared incident slice. Alert and message records establish the lead; process, endpoint, identity, and network records let you pivot and correlate; enrichment and exposure records add context; response and case records capture decisions. Treat each surface as a source with a different purpose, then join observations by entity and time rather than by a convenient story.',
    practice: 'Use the console labels to predict the next useful pivot: alert → message → process → network/identity → scope and exposure → response → case.',
  },
  {
    title: 'Rules of engagement',
    focus: 'Operate within authorization, safety, and evidence-preservation boundaries.',
    script: 'This is a contained training environment. Use only the supplied synthetic records and authorized response choices. Do not broaden a response beyond verified scope, delete or alter evidence, treat an unfamiliar value as malicious by itself, or close the case before recovery is validated. When evidence is incomplete, say so and record the next bounded check instead of inventing certainty.',
    practice: 'For every proposed action, name its target, purpose, authorization, evidence impact, and validation condition.',
  },
  {
    title: 'Available tools',
    focus: 'Choose the least disruptive tool that answers the current question.',
    script: 'The alert queue helps prioritize; message evidence explains delivery and user action; query records support repeatable pivots; endpoint data exposes process ancestry and persistence; identity and network records establish session and connection scope; enrichment tests indicator confidence; exposure identifies contributing conditions; response and case surfaces preserve decisions. A good analyst moves between these tools with a question, not by collecting every row.',
    practice: 'Keep a short pivot log: question, source consulted, record identifier, observation, and the next question it creates.',
  },
  {
    title: 'Investigation methodology',
    focus: 'Build a timeline and test a hypothesis with independent evidence.',
    script: 'Start with the alert, normalize timestamps, and reconstruct the sequence from user action to execution, connection, and identity activity. Corroborate important claims across sources, distinguish observed facts from interpretation, and search for matching indicators outside the first host or account. Bound the result to the available telemetry: “no match found in this search” is useful, but it is not proof that no other activity exists.',
    practice: 'For each conclusion, retain one direct observation and one corroborating observation; record uncertainty beside the conclusion.',
  },
  {
    title: 'Documentation expectations',
    focus: 'Make another analyst able to reproduce and challenge your reasoning.',
    script: 'The final record should contain the verdict and priority, a time-ordered narrative, affected entities, evidence identifiers, query or pivot logic, response decisions, residual uncertainty, and accountable follow-up. Write the executive summary for a decision-maker and the technical narrative for an investigator. Use precise language: observed, correlated, assessed, contained, and verified are different claims.',
    practice: 'Draft notes while investigating. Do not wait until the end to reconstruct why a record mattered or why an action was chosen.',
  },
  {
    title: 'Incident-handling workflow',
    focus: 'Carry the case from triage through validated recovery and closure.',
    script: 'Move through a disciplined loop: triage the signal, investigate and scope it, preserve evidence, contain the confirmed entities, eradicate the cause, recover with validation, and communicate closure with follow-up ownership. Blocking an indicator is not the same as recovering a host or identity. The case is ready to close only when the recovery evidence, policy correction, owner validation, and monitoring plan are recorded.',
    practice: 'Before submitting, check that every response action has a target and every closure claim has a validation record.',
  },
];

// Standard Incident / Case Record (MODULE_STANDARD.md §7.2). The capstone's
// ten scored rubric domains stay exactly as designed — this only gives the
// case a standard ticket core (status/severity/affected user+device/
// disposition/escalation) so it opens the same way every other module's
// Prove It does. Every other capstone requirement (query, timeline, scope
// checkboxes, enrichment, ATT&CK, detection, response, reporting, closure)
// renders as findingsHtml under the grid. Analyst Work Notes carries the
// technical investigation narrative (>=260 chars); the executive summary
// and closure note remain their own labelled textareas inside the ticket.
const MODULE_TWELVE_CASE = {
  caseId: 'INC-4821',
  userOptions: [
    { id: 'acct-204', text: 'acct-204', tier: 'principal' },
    { id: 'system', text: 'system (WS-118 script context)', tier: 'pivot' },
    { id: 'acct-091', text: 'acct-091', tier: 'noise' },
    { id: 'backup-job', text: 'backup-job', tier: 'noise' },
    { id: 'm.alvarez', text: 'm.alvarez', tier: 'noise' },
    { id: 'svc-mail', text: 'svc-mail', tier: 'noise' },
  ],
  deviceOptions: [
    { id: 'ws-204', text: 'WS-204', tier: 'principal' },
    { id: 'ws-118', text: 'WS-118', tier: 'pivot' },
    { id: 'mail-edge-02', text: 'mail-edge-02', tier: 'noise' },
    { id: 'srv-file-09', text: 'SRV-FILE-09', tier: 'noise' },
    { id: 'ws-091', text: 'WS-091', tier: 'noise' },
    { id: 'lap-233', text: 'LAP-233', tier: 'noise' },
  ],
  dispositionOptions: [
    { id: 'true-positive', text: 'True-positive incident' },
    { id: 'benign-close', text: 'Benign — close alert' },
  ],
  departmentOptions: [
    { id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response', fit: 100 },
    { id: 'identity-response', text: 'Identity Response', fit: 60,
      note: 'Identity Response can act on acct-204, but the case also has confirmed endpoint execution on WS-204 it has no authority over — Tier 2 SOC owns both legs together.' },
    { id: 'endpoint-edr', text: 'Endpoint / EDR Team', fit: 55,
      note: 'EDR can isolate WS-204, but can’t revoke acct-204’s compromised session on its own — Tier 2 SOC coordinates both actions.' },
    { id: 'help-desk', text: 'Help Desk', fit: 5,
      bounce: 'Help Desk can’t act on a confirmed identity compromise with endpoint execution — this needs Tier 2 SOC’s incident-response authority.' },
  ],
  correctAffectedUser: 'acct-204',
  correctAffectedDevice: 'ws-204',
  correctDisposition: 'true-positive',
  correctSeverity: 'high',
  correctEscalateTo: 'tier2-soc',
};

function moduleTwelveFreshDefaults() {
  return {
    activeConsole: 'queue', reviewedConsoles: [], selectedEvidence: [], stageVisits: [],
    answers: {}, executiveSummary: '', notes: '', closureNote: '',
    hintsOpened: [], simulatorLaunched: false, breakdown: null, feedback: [],
    criticalErrors: [], validationError: '', lastSubmittedAt: '',
    // Standard case-record ticket fields (MODULE_STANDARD.md §7.2).
    submitted: false, status: '', severity: '', affectedUser: '', affectedDevice: '',
    disposition: '', escalation: '', escalateTo: '', findings: {}, actionHistory: [],
    showMissing: false,
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
  moduleTwelveState = LabRuntime.loadCaseState(MODULE_TWELVE_LAB_ID, 'soc-12', user, moduleTwelveFreshDefaults());
  ['reviewedConsoles', 'selectedEvidence', 'stageVisits', 'hintsOpened', 'feedback', 'criticalErrors', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleTwelveState[key])) moduleTwelveState[key] = [];
  });
  if (!moduleTwelveState.answers || typeof moduleTwelveState.answers !== 'object') moduleTwelveState.answers = {};
  if (!MODULE_TWELVE_CONSOLES[moduleTwelveState.activeConsole]) moduleTwelveState.activeConsole = 'queue';
  // Case-record migration: default any field an older saved attempt never
  // had. `notes` now carries the technical narrative that used to live in
  // `analystNarrative`; backfill it once so in-progress drafts are not
  // silently emptied.
  if (typeof moduleTwelveState.notes !== 'string') moduleTwelveState.notes = typeof moduleTwelveState.analystNarrative === 'string' ? moduleTwelveState.analystNarrative : '';
  if (!moduleTwelveState.findings || typeof moduleTwelveState.findings !== 'object') moduleTwelveState.findings = {};
  if (!Array.isArray(moduleTwelveState.actionHistory)) moduleTwelveState.actionHistory = [];
  ['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo'].forEach((key) => {
    if (typeof moduleTwelveState[key] !== 'string') moduleTwelveState[key] = '';
  });
  if (typeof moduleTwelveState.submitted !== 'boolean') moduleTwelveState.submitted = false;
  if (typeof moduleTwelveState.showMissing !== 'boolean') moduleTwelveState.showMissing = false;
  // Any already-completed old-form attempt keeps its pass and stays a
  // locked, submitted ticket — never re-opened by this migration. Backfill
  // the ticket fields from the legacy answers where possible so the locked
  // record reads sensibly instead of showing blank selects.
  if (moduleTwelveState.completed) {
    moduleTwelveState.submitted = true;
    const legacy = moduleTwelveState.answers || {};
    if (!moduleTwelveState.disposition && legacy.verdict) moduleTwelveState.disposition = legacy.verdict;
    if (!moduleTwelveState.severity && legacy.severity) moduleTwelveState.severity = legacy.severity;
    if (!moduleTwelveState.status) moduleTwelveState.status = 'resolved';
    const legacyScope = Array.isArray(legacy.scope) ? legacy.scope : [];
    if (!moduleTwelveState.affectedUser) moduleTwelveState.affectedUser = legacyScope.find((id) => id.startsWith('acct-')) || '';
    if (!moduleTwelveState.affectedDevice) moduleTwelveState.affectedDevice = legacyScope.find((id) => id.startsWith('ws-')) || '';
    if (!moduleTwelveState.escalation) moduleTwelveState.escalation = 'required';
    if (!moduleTwelveState.escalateTo) moduleTwelveState.escalateTo = 'tier2-soc';
  }
  if (moduleTwelveUnlocked(user, program) && typeof markModuleContentOpened === 'function') {
    markModuleContentOpened(user, 'soc-analyst', 'soc-12');
  }
  return moduleTwelveState;
}

function moduleTwelveSave() {
  if (moduleTwelveUser && moduleTwelveState) LabRuntime.saveCaseState(MODULE_TWELVE_LAB_ID, 'soc-12', moduleTwelveUser, moduleTwelveState);
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
  const state = moduleTwelveState;
  const timelineCorrect = a.t1 === 'email' && a.t2 === 'execution' && a.t3 === 'network' && a.t4 === 'identity';
  const disposition = caseRecordDisposition(state);
  const severity = caseRecordSeverity(state);
  const domains = [
    ['Triage', disposition === MODULE_TWELVE_CASE.correctDisposition && severity === MODULE_TWELVE_CASE.correctSeverity && a.priority === 'p1'],
    ['Query', a.query === 'correlated-pivot'],
    ['Timeline', timelineCorrect],
    ['Scope', moduleTwelveSetEqual(moduleTwelveValues('scope'), ['acct-204', 'ws-204']) && a.scopeLimit === 'bounded' && state.affectedUser === MODULE_TWELVE_CASE.correctAffectedUser && state.affectedDevice === MODULE_TWELVE_CASE.correctAffectedDevice],
    ['Enrichment', a.enrichment === 'correlated-malicious' && a.exposurePriority === 'audit-policy'],
    ['ATT&CK', moduleTwelveSetEqual(moduleTwelveValues('attack'), ['T1059.007', 'T1071.001', 'T1204.001', 'T1547.001'])],
    ['Detection', a.detection === 'parent-hash-destination' && a.tuning === 'signed-approved-parent'],
    ['Response', moduleTwelveSetEqual(moduleTwelveValues('response'), ['block-ioc', 'isolate-ws204', 'preserve', 'revoke-acct204']) && state.escalation === 'required' && state.escalateTo === MODULE_TWELVE_CASE.correctEscalateTo],
    ['Reporting', moduleTwelveState.executiveSummary.trim().length >= 180 && moduleTwelveState.notes.trim().length >= 260],
    ['Closure', a.closure === 'verified-recovery' && a.followup === 'policy-owner' && moduleTwelveState.closureNote.trim().length >= 100],
  ];
  const criticalErrors = [];
  if (disposition === 'benign-close') criticalErrors.push('The confirmed incident was closed as benign.');
  if (state.escalation === 'not-required') criticalErrors.push('A confirmed incident with endpoint and identity impact was marked as not requiring escalation.');
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

function moduleTwelveHeader(user, program) {
  return moduleTopbar(user, program);
}

function moduleTwelveLockedView(user, program) {
  const prerequisites = moduleTwelvePrerequisites(user, program);
  const complete = prerequisites.filter((item) => item.complete).length;
  const module = program.modules['soc-12'];
  return `<div class="m12-shell">${moduleTwelveHeader(user, program)}<main class="m12-main mf-frame">
    <section class="m12-hero m12-hero-locked mf-hero" aria-labelledby="m12-title">
      <div><p class="m12-kicker mf-kicker">Module 12 · ${formatHandsOnDuration(module.durationMinutes)} · Independent capstone</p><h1 id="m12-title">${esc(module.title)}</h1>
      <p class="mf-lede">The integrated range stays sealed until every preceding module is complete. This prevents future evidence and the end-to-end scenario from bypassing the course sequence.</p></div>
      <div class="m12-lock-mark"><i class="ri-lock-2-line" aria-hidden="true"></i><strong>${complete}/11</strong><span>prerequisites complete</span></div>
    </section>
    <section class="m12-section mf-section" aria-labelledby="m12-gate-title"><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge"><i class="ri-git-merge-line" aria-hidden="true"></i></span><div><p class="m12-kicker">Prerequisite gate</p><h2 id="m12-gate-title">Complete Modules 01–11 to unlock the incident</h2></div></div>
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

// Everything the capstone grades beyond the standard ticket core: query,
// timeline, scope checkboxes, enrichment/exposure, ATT&CK, detection,
// response, the executive summary + closure note, hints, and the scored
// feedback block. Rendered as caseRecordFields' `findingsHtml`, under the
// standard grid and above Analyst Work Notes.
function moduleTwelveFindingsHtml() {
  const a = moduleTwelveState.answers;
  return `<div class="m12-form-grid">
      <fieldset><legend>Response priority</legend><label class="m12-select-label">Response priority<select name="priority"><option value="">Choose…</option><option value="p1" ${a.priority==='p1'?'selected':''}>P1 — contain now; active identity and endpoint exposure</option><option value="p3" ${a.priority==='p3'?'selected':''}>P3 — queue for routine review</option></select></label></fieldset>
      <fieldset><legend>Query</legend>${moduleTwelveOption('query','correlated-pivot','Correlate hash, device, destination, and identity within the incident window','Preserves entity and time relationships across process, network, and sign-in tables.',a.query==='correlated-pivot')}${moduleTwelveOption('query','all-errors','Return every error from every table','High volume does not test the incident hypothesis.',a.query==='all-errors')}</fieldset>
      <fieldset class="m12-wide"><legend>Timeline reconstruction</legend><div class="m12-timeline-inputs">${[['t1','First'],['t2','Second'],['t3','Third'],['t4','Fourth']].map(([name,label]) => `<label>${label}<select name="${name}"><option value="">Choose event…</option><option value="email" ${a[name]==='email'?'selected':''}>Recipient opened linked document</option><option value="execution" ${a[name]==='execution'?'selected':''}>Unsigned script execution</option><option value="network" ${a[name]==='network'?'selected':''}>Correlated outbound connection</option><option value="identity" ${a[name]==='identity'?'selected':''}>Unfamiliar token refresh</option></select></label>`).join('')}</div></fieldset>
      <fieldset><legend>Scope</legend>${moduleTwelveCheck('scope','ws-204','WS-204',moduleTwelveValues('scope').includes('ws-204'))}${moduleTwelveCheck('scope','acct-204','acct-204',moduleTwelveValues('scope').includes('acct-204'))}${moduleTwelveCheck('scope','ws-118','WS-118',moduleTwelveValues('scope').includes('ws-118'))}${moduleTwelveCheck('scope','acct-091','acct-091',moduleTwelveValues('scope').includes('acct-091'))}
        <label class="m12-select-label">Scope statement<select name="scopeLimit"><option value="">Choose…</option><option value="bounded" ${a.scopeLimit==='bounded'?'selected':''}>One host/account in available telemetry; continue monitoring</option><option value="clean" ${a.scopeLimit==='clean'?'selected':''}>The entire enterprise is proven clean</option></select></label></fieldset>
      <fieldset><legend>Enrichment &amp; vulnerability decision</legend>${moduleTwelveOption('enrichment','correlated-malicious','High-confidence malicious in this incident','Hash, destination, redirect, timing, and behavior corroborate one another.',a.enrichment==='correlated-malicious')}${moduleTwelveOption('enrichment','ip-alone','Malicious because any unfamiliar IP is hostile','An address alone is insufficient without context.',a.enrichment==='ip-alone')}
        <label class="m12-select-label">Contributing exposure<select name="exposurePriority"><option value="">Choose…</option><option value="audit-policy" ${a.exposurePriority==='audit-policy'?'selected':''}>Prioritize WS-204 policy gap — audit-only script control</option><option value="browser-update" ${a.exposurePriority==='browser-update'?'selected':''}>Prioritize unrelated WS-118 browser update</option></select></label></fieldset>
      <fieldset class="m12-wide"><legend>ATT&amp;CK mapping</legend><div class="m12-check-grid">${[['T1204.001','User Execution: Malicious Link'],['T1059.007','JavaScript/JScript'],['T1547.001','Registry Run Keys / Startup Folder'],['T1071.001','Web Protocols'],['T1021.001','Remote Desktop Protocol']].map(([id,label]) => moduleTwelveCheck('attack',id,`${id} — ${label}`,moduleTwelveValues('attack').includes(id))).join('')}</div></fieldset>
      <fieldset><legend>Detection</legend>${moduleTwelveOption('detection','parent-hash-destination','Correlate unusual parent/child + script hash + rare destination','Behavior and indicator correlation raises precision.',a.detection==='parent-hash-destination')}${moduleTwelveOption('detection','all-script-hosts','Alert on every script-host launch','This would overwhelm the queue with routine administration.',a.detection==='all-script-hosts')}
        <label class="m12-select-label">Safe tuning<select name="tuning"><option value="">Choose…</option><option value="signed-approved-parent" ${a.tuning==='signed-approved-parent'?'selected':''}>Exclude signed inventory child only under approved parent/path</option><option value="disable" ${a.tuning==='disable'?'selected':''}>Disable detection during business hours</option></select></label></fieldset>
      <fieldset><legend>Response &amp; evidence</legend>${moduleTwelveCheck('response','isolate-ws204','Isolate WS-204; retain response channel',moduleTwelveValues('response').includes('isolate-ws204'))}${moduleTwelveCheck('response','revoke-acct204','Revoke and disable acct-204; reset credentials',moduleTwelveValues('response').includes('revoke-acct204'))}${moduleTwelveCheck('response','block-ioc','Block hash/destination and monitor',moduleTwelveValues('response').includes('block-ioc'))}${moduleTwelveCheck('response','preserve','Hash and preserve exports with custody details',moduleTwelveValues('response').includes('preserve'))}${moduleTwelveCheck('response','shutdown-all','Shut down every enterprise endpoint',moduleTwelveValues('response').includes('shutdown-all'))}${moduleTwelveCheck('response','delete-evidence','Delete telemetry after containment',moduleTwelveValues('response').includes('delete-evidence'))}</fieldset>
      <fieldset class="m12-wide"><legend>Executive reporting</legend><label class="m12-text-label">Executive summary <small>At least 180 characters: what happened, business impact, current status, and next decision.</small><textarea name="executiveSummary" rows="5">${esc(moduleTwelveState.executiveSummary)}</textarea><span id="m12-exec-count">${moduleTwelveState.executiveSummary.length}/180</span></label></fieldset>
      <fieldset class="m12-wide"><legend>Closure</legend><div class="m12-two-col">${moduleTwelveOption('closure','verified-recovery','Close after verified recovery','Clean scan, persistence removal, policy correction, identity reset, and owner validation recorded.',a.closure==='verified-recovery')}${moduleTwelveOption('closure','close-after-block','Close immediately after blocking the IP','Containment alone does not establish recovery.',a.closure==='close-after-block')}${moduleTwelveOption('followup','policy-owner','Assign script-control remediation to endpoint policy owner','Names an accountable owner and addresses the contributing control gap.',a.followup==='policy-owner')}${moduleTwelveOption('followup','none','No follow-up needed','The audit-only script control remains a recurrence risk.',a.followup==='none')}</div>
        <label class="m12-text-label">Closure note <small>At least 100 characters: validation evidence, residual risk, owner, and monitoring.</small><textarea name="closureNote" rows="4">${esc(moduleTwelveState.closureNote)}</textarea><span id="m12-close-count">${moduleTwelveState.closureNote.length}/100</span></label></fieldset>
    </div>
    <details class="m12-hint" data-m12-hint="timeline" ${moduleTwelveState.hintsOpened.includes('timeline')?'open':''}><summary>Emergency timeline hint (−5 points)</summary><p>Compare the email action, process creation, first network connection, and token refresh timestamps. Order those observed events without assuming intent.</p></details>
    <details class="m12-hint" data-m12-hint="response" ${moduleTwelveState.hintsOpened.includes('response')?'open':''}><summary>Emergency response hint (−5 points)</summary><p>Act only on the confirmed host, account, and indicators. Preserve evidence before eradication, then validate recovery.</p></details>
    <div id="m12-feedback" tabindex="-1">${moduleTwelveFeedback()}</div>`;
}

function moduleTwelveCaseSpec() {
  return {
    caseId: MODULE_TWELVE_CASE.caseId,
    userOptions: MODULE_TWELVE_CASE.userOptions,
    deviceOptions: MODULE_TWELVE_CASE.deviceOptions,
    dispositionOptions: MODULE_TWELVE_CASE.dispositionOptions,
    departmentOptions: MODULE_TWELVE_CASE.departmentOptions,
    notesPlaceholder: 'Evidence-based technical investigation narrative: entry, execution, identity, scope, response, and residual uncertainty (at least 260 characters)…',
    notesMin: 260,
    findingsHtml: moduleTwelveFindingsHtml(),
    extraMissing: moduleTwelveExtraMissing(),
    disabled: moduleTwelveState.submitted === true,
  };
}

// Everything moduleTwelveMissing checks that isn't already covered by the
// standard ticket (status/severity/affectedUser/affectedDevice/disposition/
// escalation/notes via caseRecordMissing).
function moduleTwelveExtraMissing() {
  const a = moduleTwelveState.answers;
  const missing = [];
  if (moduleTwelveState.reviewedConsoles.length < Object.keys(MODULE_TWELVE_CONSOLES).length) missing.push('Review all ten integrated consoles');
  if (!moduleTwelveSetEqual(moduleTwelveState.selectedEvidence, MODULE_TWELVE_EVIDENCE.map((item) => item.id))) missing.push('Select the six records that form the evidence chain');
  ['priority','query','t1','t2','t3','t4','scopeLimit','enrichment','exposurePriority','detection','tuning','closure','followup'].forEach((key) => { if (!a[key]) missing.push(`Complete ${key}`); });
  if (!moduleTwelveValues('scope').length) missing.push('Identify scope');
  if (!moduleTwelveValues('attack').length) missing.push('Map ATT&CK behavior');
  if (!moduleTwelveValues('response').length) missing.push('Select response actions');
  if (moduleTwelveState.executiveSummary.trim().length < 180) missing.push('Write a 180-character executive summary');
  if (moduleTwelveState.closureNote.trim().length < 100) missing.push('Write a 100-character closure note');
  return [...new Set(missing)];
}

function moduleTwelveAssessment() {
  const spec = moduleTwelveCaseSpec();
  const performance = { missing: caseRecordMissing(moduleTwelveState, spec) };
  const casePane = caseRecordPane(moduleTwelveState, {
    ...spec,
    missing: performance.missing,
    formId: 'm12-assessment',
    saveAttr: 'data-m12-save-case',
    submitAttr: 'data-m12-submit-case',
    panelId: 'm12-case-panel',
    showMissing: moduleTwelveState.showMissing === true,
    lockedMessage: 'Your capstone record is saved. Instructor review confirms the pass.',
  });
  return `<div class="m12-assessment">
    <div class="m12-assessment-heading"><div><p class="m12-kicker">Portfolio artifact</p><h2>Independent incident record</h2><p>Submit conclusions in any working order. Every section is required; the labels do not reveal the underlying attack chronology.</p></div><span>Pass ${MODULE_TWELVE_PASSING_SCORE}% + no critical errors</span></div>
    ${casePane}
    <div class="m12-actions"><button type="button" class="m12-reset" data-m12-reset ${moduleTwelveState.submitted ? 'disabled' : ''}><i class="ri-restart-line" aria-hidden="true"></i> Reset capstone only</button></div>
  </div>`;
}

function moduleTwelveFeedback() {
  if (!moduleTwelveState.breakdown) return `<div class="m12-score-empty"><strong>No scored attempt yet.</strong><p>Your work saves locally as you investigate. A pass requires ${MODULE_TWELVE_PASSING_SCORE}% or higher and no critical response, evidence, identity, triage, or closure error.</p></div>`;
  const passed = moduleTwelveState.completed;
  return `<section class="m12-score ${passed ? 'is-pass' : 'is-remediate'}" aria-live="polite"><div class="m12-score-heading"><div><p class="m12-kicker">${passed ? 'Capstone passed' : 'Remediation required'}</p><h3>${passed ? 'End-to-end investigation complete' : 'Revise and resubmit the incident record'}</h3><p>Best ${moduleTwelveState.bestScore}% · ${moduleTwelveState.attempts} attempt${moduleTwelveState.attempts === 1 ? '' : 's'} · ${moduleTwelveState.hintsOpened.length * 5} hint points used</p></div><span>${moduleTwelveState.score}%</span></div>
    <div class="m12-score-grid">${moduleTwelveState.breakdown.map((item) => `<div><strong>${item.score}/10</strong><span>${esc(item.label)}</span></div>`).join('')}</div>
    ${moduleTwelveState.criticalErrors.length ? `<div class="m12-critical"><strong>Critical-error gate</strong><ul>${moduleTwelveState.criticalErrors.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}
    ${moduleTwelveState.feedback.length ? `<div class="m12-remediation"><strong>Explainable scoring</strong><ul>${moduleTwelveState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '<p class="m12-perfect">All ten scored domains are supported by the submitted artifact.</p>'}
    ${moduleTwelveReportPreview()}
    ${passed ? `<div class="m12-portfolio"><i class="ri-award-line" aria-hidden="true"></i><div><strong>Portfolio-ready capstone record earned</strong><p>The synthetic incident report, timeline, evidence decisions, response plan, and closure record remain saved to this anonymous local learner profile.</p></div></div>` : ''}</section>`;
}

function moduleTwelveReportPreview() {
  const a = moduleTwelveState.answers;
  return `<section class="m12-report-preview" aria-labelledby="m12-report-title"><p class="m12-kicker">Incident report output</p><h4 id="m12-report-title">INC-4821 · Operation Amber Finch</h4><dl><div><dt>Priority</dt><dd>${esc(a.priority || 'Not submitted')}</dd></div><div><dt>Scope</dt><dd>${esc(moduleTwelveValues('scope').join(', ') || 'Not submitted')}</dd></div><div><dt>Exposure decision</dt><dd>${esc(a.exposurePriority || 'Not submitted')}</dd></div><div><dt>Disposition</dt><dd>${esc(a.closure || 'Not submitted')}</dd></div></dl><h5>Executive finding</h5><p>${esc(moduleTwelveState.executiveSummary || 'Submit the assessment to generate the report finding.')}</p><h5>Technical narrative</h5><p>${esc(moduleTwelveState.notes || 'The evidence-backed technical narrative will appear here after submission.')}</p><h5>Closure and follow-up</h5><p>${esc(moduleTwelveState.closureNote || 'The recovery validation and accountable follow-up will appear here after submission.')}</p></section>`;
}

function moduleTwelveMissionStatus() {
  const visited = new Set(moduleTwelveState.stageVisits || []);
  return `<div class="m12-stage-note"><strong>12-stage progress tracker</strong><span>Progress aid only · one integrated rubric and one capstone submission</span></div><div class="m12-requirements">${MODULE_TWELVE_REQUIREMENTS.map(([label, detail], index) => { const complete = visited.has(label.toLowerCase()) || (index === 11 && moduleTwelveState.completed); return `<div class="${complete ? 'is-seen' : ''}"><span>${String(index + 1).padStart(2,'0')}</span><p><strong>${esc(label)} ${complete ? '· reviewed' : '· open'}</strong><small>${esc(detail)}</small><em>${esc(MODULE_TWELVE_ARC_CALLBACKS[index])}</em></p></div>`; }).join('')}</div>`;
}

function moduleTwelvePreparation() {
  return `<details class="m12-section-collapsible mf-section"><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">1</span><div><p class="m12-kicker mf-kicker">Capstone preparation lectures</p><h2 id="m12-preparation-title">Briefing before the independent range</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section mf-section-body" id="m12-preparation" aria-labelledby="m12-preparation-title">
    <p class="m12-muted">These short briefings establish the operating model for the capstone. Review them before investigating; they are guidance, not additional scored stages.</p>
    <div class="mf-lesson-grid">${MODULE_TWELVE_PREPARATION_LECTURES.map((lecture, index) => `<details class="mf-lesson"><summary><span class="mf-lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lecture.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lecture.title)}</strong><small>${esc(lecture.focus)}</small></span><i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary><div class="mf-lesson-body"><p>${esc(lecture.script)}</p><p class="mf-takeaway"><strong>Analyst prompt:</strong> ${esc(lecture.practice)}</p><p class="mf-takeaway"><small>Video placeholder · 8–12 minute recording slot</small></p></div></details>`).join('')}</div>
  </section></details>`;
}

function moduleTwelveGetQuickNavItems() {
  return [
    { id: 'preparation', title: 'Preparation', kind: 'lecture', isComplete: true, scrollId: 'm12-hero' },
    { id: 'mission', title: 'Mission Requirements', kind: 'lab', isComplete: false, scrollId: 'm12-mission-title' },
    { id: 'investigation', title: 'Investigation Consoles', kind: 'lab', isComplete: false, scrollId: 'm12-range' },
    { id: 'assessment', title: 'Assessment', kind: 'lab', isComplete: false, scrollId: 'm12-assessment-section' },
  ];
}

function moduleTwelveGetSections() {
  const complete = Boolean(moduleTwelveState.completed);
  return [
    { id: 'preparation', title: 'Capstone preparation', type: 'lecture', isComplete: true, scrollId: 'm12-preparation' },
    { id: 'mission', title: 'Mission requirements', type: 'lab', isComplete: complete, scrollId: 'm12-mission-title' },
    { id: 'investigation', title: 'Investigation consoles', type: 'lab', isComplete: complete, scrollId: 'm12-range' },
    { id: 'assessment', title: 'Capstone submission', type: 'review', isComplete: complete, scrollId: 'm12-assessment-section' },
  ];
}

function viewModuleTwelve(user, program) {
  moduleTwelveLoad(user, program);
  if (!moduleTwelveUnlocked(user, program)) return moduleTwelveLockedView(user, program);
  const module = program.modules['soc-12'];
  const sections = moduleTwelveGetSections();
  return `<div class="m12-shell">${moduleTwelveHeader(user, program)}<div class="mquick-nav-layout">${moduleUnifiedNav(sections, { moduleKey: 'm12' })}<main class="m12-main mf-frame">
    <section class="m12-hero mf-hero" aria-labelledby="m12-title"><div><p class="m12-kicker mf-kicker">Module 12 · ${formatHandsOnDuration(module.durationMinutes)} · Final Assessment</p><h1 id="m12-title">${esc(module.title)}</h1><p class="m12-kicker mf-kicker">Case scenario · Operation Amber Finch</p><p class="mf-lede">Investigate a synthetic high-priority signal across the complete Mission Next security operations range. Discover what happened, bound impact, improve detection, direct response, and close the case with a portfolio-grade report. This capstone integrates all competencies from Modules 01–11 into one independent Prove assessment.</p>
      <div class="m12-hero-actions"><a class="m12-primary" href="${esc(moduleTwelveLaunchUrl())}" target="_blank" rel="noopener" data-m12-launch><i class="ri-terminal-box-line" aria-hidden="true"></i> Open integrated simulator</a><a class="m12-secondary" href="#m12-range"><i class="ri-arrow-down-line" aria-hidden="true"></i> Investigate here</a></div><p class="m12-launch-note">${moduleTwelveState.simulatorLaunched ? 'Simulator launch recorded. Portal work remains saved separately.' : 'Opens the catalogue route in a new tab; all data is fictional.'}</p></div>
      <dl class="mf-stats"><div><dt>Case</dt><dd>INC-4821</dd></div><div><dt>Mode</dt><dd>Independent assessment</dd></div><div><dt>Pass</dt><dd>${MODULE_TWELVE_PASSING_SCORE}% (seven of ten domains) + safety gate</dd></div></dl></section>
    <section class="m12-objective"><div><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Rubric scoring</p><h2>Ten scored domains (10 points each): Triage, Query, Timeline, Scope, Enrichment, ATT&CK, Detection, Response, Reporting, and Closure. Pass requires 70 points plus no critical-error violations (false triage, unsafe scope, evidence loss, or unsupported closure).</h2></div></section>
    <section class="m12-objective"><div><i class="ri-git-merge-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Prior instruction</p><h2>This capstone draws on skills from all 11 prior modules: SOC operations foundations (M01), network and identity foundations (M02), SIEM and log analysis (M03), detection rule tuning (M04), endpoint investigation (M05), threat hunting (M06), network and email analysis (M07), vulnerability prioritization (M08), incident response (M09), evidence handling and case documentation (M10), and SOC metrics and communication (M11).</h2></div></section>
    ${moduleTwelvePreparation()}
    <details class="m12-section-collapsible mf-section" open><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">2</span><div><p class="m12-kicker mf-kicker">Mission requirements</p><h2 id="m12-mission-title">Outcomes, not a prescribed attack path</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section mf-section-body"><p class="m12-muted">The twelve requirements may be completed in any order. They describe the deliverable, not the attacker's sequence; discover chronology from the evidence. Amber Finch is the capstone composite: Cedar Lock (M09–M11) rehearsed the response, custody, and reporting handoffs, while this case asks you to integrate those decisions with the earlier identity, SIEM, detection, endpoint, hunting, network, and prioritization work.</p>${moduleTwelveMissionStatus()}</section></details>
    <details class="m12-section-collapsible mf-section mf-lab-section"><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">3</span><div><p class="m12-kicker mf-kicker">Complete integrated range</p><h2 id="m12-range-title">Investigation consoles</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section m12-range-section mf-section-body" id="m12-range"><div id="m12-console-root">${moduleTwelveConsole()}</div>${moduleTwelveEvidenceTray()}</section></details>
    <details class="m12-section-collapsible mf-section"><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">4</span><div><p class="m12-kicker mf-kicker">Prove It</p><h2>Capstone assessment</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section m12-assessment-section mf-section-body" id="m12-assessment-section">${moduleTwelveAssessment()}</section></details>
  </main></div></div>`;
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
      if (moduleTwelveState.submitted) return;
      if (typeof window.confirm === 'function' && !window.confirm('Reset only the Module 12 capstone? Modules 01–11 and other labs remain unchanged.')) return;
      moduleTwelveState = LabRuntime.resetCaseState(MODULE_TWELVE_LAB_ID, 'soc-12', moduleTwelveUser, moduleTwelveFreshDefaults());
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY, false);
      moduleTwelveRender('m12-title');
      return;
    }
    if (event.target.closest('[data-m12-save-case]')) {
      moduleTwelveState.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleTwelveSave(); moduleTwelveRender('m12-feedback'); return;
    }
    if (event.target.closest('[data-m12-submit-case]')) { moduleTwelveFinalize(); return; }
  });
  shell.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m12-hint]');
    if (!hint || !hint.open) return;
    const id = hint.dataset.m12Hint;
    if (!moduleTwelveState.hintsOpened.includes(id)) { moduleTwelveState.hintsOpened.push(id); moduleTwelveSave(); }
  }, true);
  shell.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.closest('#m12-assessment')) return;
    if (input.name === 'notes') {
      caseRecordApply(moduleTwelveState, 'notes', input.value);
      if (!moduleTwelveState.stageVisits.includes('reporting')) moduleTwelveState.stageVisits.push('reporting');
      moduleTwelveSave();
      return;
    }
    if (input.name === 'executiveSummary' || input.name === 'closureNote') {
      moduleTwelveState[input.name] = input.value;
      const stage = input.name === 'closureNote' ? 'closure' : 'reporting';
      if (!moduleTwelveState.stageVisits.includes(stage)) moduleTwelveState.stageVisits.push(stage);
      const counter = document.getElementById(input.name === 'executiveSummary' ? 'm12-exec-count' : 'm12-close-count');
      if (counter) counter.textContent = `${input.value.length}/${input.name === 'executiveSummary' ? 180 : 100}`;
      moduleTwelveSave();
    }
  });
  shell.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'selectedEvidence') {
      moduleTwelveState.selectedEvidence = input.checked ? [...new Set([...moduleTwelveState.selectedEvidence, input.value])] : moduleTwelveState.selectedEvidence.filter((id) => id !== input.value);
      if (!moduleTwelveState.stageVisits.includes('evidence')) moduleTwelveState.stageVisits.push('evidence');
      moduleTwelveSave(); moduleTwelveRender('m12-feedback'); return;
    }
    if (!input.closest('#m12-assessment')) return;
    if (caseRecordApply(moduleTwelveState, input.name, input.value)) {
      moduleTwelveState.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleTwelveSave(); moduleTwelveRender('m12-feedback'); return;
    }
    if (['scope','attack','response'].includes(input.name)) {
      const values = moduleTwelveValues(input.name);
      moduleTwelveState.answers[input.name] = input.checked ? [...new Set([...values, input.value])] : values.filter((value) => value !== input.value);
    } else if (input.name) {
      moduleTwelveState.answers[input.name] = input.value;
    }
    const stageMap = { priority:'triage', query:'query', t1:'timeline', t2:'timeline', t3:'timeline', t4:'timeline', scope:'scope', scopeLimit:'scope', enrichment:'enrichment', exposurePriority:'enrichment', attack:'att&ck', detection:'detection', tuning:'detection', response:'response', closure:'closure', followup:'closure' };
    if (stageMap[input.name] && !moduleTwelveState.stageVisits.includes(stageMap[input.name])) moduleTwelveState.stageVisits.push(stageMap[input.name]);
    moduleTwelveSave(); moduleTwelveRender('m12-feedback');
  });
  function moduleTwelveFinalize() {
    if (moduleTwelveState.submitted) return;
    const form = document.getElementById('m12-assessment');
    if (form) {
      moduleTwelveState.executiveSummary = form.elements.executiveSummary?.value ?? moduleTwelveState.executiveSummary;
      moduleTwelveState.closureNote = form.elements.closureNote?.value ?? moduleTwelveState.closureNote;
      if (form.elements.notes) caseRecordApply(moduleTwelveState, 'notes', form.elements.notes.value);
    }
    ['evidence','reporting','submission'].forEach((stage) => { if (!moduleTwelveState.stageVisits.includes(stage)) moduleTwelveState.stageVisits.push(stage); });
    const spec = moduleTwelveCaseSpec();
    const missing = caseRecordMissing(moduleTwelveState, spec);
    if (missing.length) {
      moduleTwelveState.showMissing = true;
      moduleTwelveSave(); moduleTwelveRender('m12-case-panel'); return;
    }
    moduleTwelveState.showMissing = false;
    const result = moduleTwelveScore();
    moduleTwelveState.attempts += 1;
    moduleTwelveState.score = result.score;
    moduleTwelveState.bestScore = Math.max(moduleTwelveState.bestScore || 0, result.score);
    moduleTwelveState.breakdown = result.breakdown;
    moduleTwelveState.feedback = result.feedback;
    moduleTwelveState.criticalErrors = result.criticalErrors;
    moduleTwelveState.lastSubmittedAt = new Date().toISOString();
    moduleTwelveState.completed = result.score >= MODULE_TWELVE_PASSING_SCORE && result.criticalErrors.length === 0;
    // Once passed, the capstone ticket locks (submitted -> Lab Graded/Under
    // Review) — MODULE_STANDARD.md §7.2's submit-locks-on-success model. A
    // still-failing attempt stays editable so the learner can revise and
    // resubmit, matching the capstone's original retry behavior.
    if (moduleTwelveState.completed) {
      moduleTwelveState.submitted = true;
      moduleTwelveState.actionHistory.push({ action: 'Submitted capstone for faculty review', at: moduleTwelveState.lastSubmittedAt });
    }
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTwelveUser, MODULE_TWELVE_CATALOG_KEY, {
        state: moduleTwelveState.completed ? 'complete' : 'in_progress',
        score: result.score,
        result: {
          breakdown: result.breakdown,
          feedback: result.feedback,
          criticalErrors: result.criticalErrors,
          critical_errors: result.criticalErrors,
          hintPenalty: result.hintPenalty,
          attempts: moduleTwelveState.attempts,
          case_record: moduleTwelveState,
          case_display: caseRecordDisplay(moduleTwelveState, spec),
          case_summary: caseRecordSummary(moduleTwelveState, spec),
          notes: moduleTwelveState.notes,
        },
      });
    }
    const artifactContent = {
      responses: moduleTwelveState.answers,
      executiveSummary: moduleTwelveState.executiveSummary,
      analystNarrative: moduleTwelveState.notes,
      closureNote: moduleTwelveState.closureNote,
      caseRecord: { status: moduleTwelveState.status, severity: moduleTwelveState.severity, affectedUser: moduleTwelveState.affectedUser, affectedDevice: moduleTwelveState.affectedDevice, disposition: moduleTwelveState.disposition, escalation: moduleTwelveState.escalation, escalateTo: moduleTwelveState.escalateTo },
      score: result.score,
      breakdown: result.breakdown,
      feedback: result.feedback,
      criticalErrors: result.criticalErrors,
      hintPenalty: result.hintPenalty,
      attemptNumber: moduleTwelveState.attempts,
      passedAutomatedGate: moduleTwelveState.completed,
    };
    if (typeof persistPortfolioArtifact === 'function') {
      persistPortfolioArtifact(moduleTwelveUser, {
        moduleKey: 'soc-12', labKey: MODULE_TWELVE_CATALOG_KEY,
        kind: 'capstone_report', title: `SOC Analyst Capstone — attempt ${moduleTwelveState.attempts}`,
        content: artifactContent, rubricVersion: 'soc-analyst-capstone-v1',
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
          answers: artifactContent,
          criticalErrorCount: result.criticalErrors.length,
        });
      }
    } else if (typeof markModuleLabComplete === 'function') {
      markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY, false);
    }
    moduleTwelveSave(); moduleTwelveRender('m12-feedback');
  }
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 12, moduleKey: 'soc-12', view: viewModuleTwelve, wire: wireModuleTwelveLab });

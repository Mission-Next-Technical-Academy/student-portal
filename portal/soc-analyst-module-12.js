/* Module 12 — independent SOC Analyst capstone.
 * The only course module that exposes the integrated investigation range.
 * All people, hosts, addresses, hashes, and business details are synthetic.
 */

const MODULE_TWELVE_LAB_ID = 'm12-integrated-capstone-v1';
const MODULE_TWELVE_CATALOG_KEY = 'lab-capstone';
const MODULE_TWELVE_FLAG = 'M12-CAPSTONE-INVESTIGATION-PASSED';
const MODULE_TWELVE_PASSING_SCORE = 70;

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
  ['Submission', 'Submit the incident record for faculty review.'],
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
  'M01–M11 synthesis: submit one defensible Amber Finch record; the rubric remains the authoritative review.',
];

// These are orientation materials for the independent range, not scored
// stages. The capstone deliberately keeps its single integrated assessment
// inside the range rather than splitting the experience into L→Q→L units.
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
    script: 'The range presents several analyst surfaces over one shared incident slice. Alert and message records establish the lead; process, endpoint, identity, and network records let you pivot and correlate; enrichment and exposure records add context; response and ITSM tickets capture decisions. Treat each surface as a source with a different purpose, then join observations by entity and time rather than by a convenient story.',
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

// Shared incident ticket core; assessment decisions stay on their console tabs.
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
    learnItStep: 0,
    stageVisits: [], notes: '', breakdown: null, feedback: [],
    criticalErrors: [], validationError: '', lastSubmittedAt: '',
    // Standard case-record ticket fields (docs/specs/MODULE_STANDARD.md §7.2).
    submitted: false, status: '', severity: '', affectedUser: '', affectedDevice: '',
    disposition: '', escalation: '', escalateTo: '', findings: {}, actionHistory: [],
    showMissing: false, tools: {}, assessmentState: null, reviewPayload: null,
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
  if (moduleTwelveUser?.email !== user?.email) moduleTwelveLearnViewed = null;
  moduleTwelveUser = user;
  moduleTwelveProgram = program;
  moduleTwelveState = LabRuntime.loadCaseState(MODULE_TWELVE_LAB_ID, 'soc-12', user, moduleTwelveFreshDefaults());
  // Earlier capstone submissions displayed a live rubric breakdown. Preserve
  // those submissions as locked and show only the standard review status.
  if (moduleTwelveState.attempts > 0 || moduleTwelveState.breakdown) moduleTwelveState.submitted = true;
  moduleTwelveState.assessmentState = SocM12AssessmentState.load(user, SocM12AssessmentData);
  if (!moduleTwelveState.submitted) moduleTwelveState.assessmentState.rubricVersion = 2;
  if (!moduleTwelveState.tools || typeof moduleTwelveState.tools !== 'object') moduleTwelveState.tools = {};
  ['stageVisits', 'feedback', 'criticalErrors', 'flags'].forEach((key) => {
    if (!Array.isArray(moduleTwelveState[key])) moduleTwelveState[key] = [];
  });
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
  // The old form answers are only needed for the one-time ticket backfill.
  // Do not carry the retired answer-key-shaped object into future saves.
  delete moduleTwelveState.answers;
  if (moduleTwelveUnlocked(user, program) && typeof markModuleContentOpened === 'function') {
    markModuleContentOpened(user, 'soc-analyst', 'soc-12');
  }
  return moduleTwelveState;
}

function moduleTwelveSave() {
  if (moduleTwelveState && !moduleTwelveState.submitted) {
    moduleTwelveState.assessmentState = SocM12ToolBridge.project(moduleTwelveState.tools, moduleTwelveState.console?.m12, moduleTwelveState.assessmentState, SocM12AssessmentData);
  }
  if (moduleTwelveUser && moduleTwelveState) {
    SocM12AssessmentState.save(moduleTwelveUser, moduleTwelveState.assessmentState || {}, SocM12AssessmentData);
    LabRuntime.saveCaseState(MODULE_TWELVE_LAB_ID, 'soc-12', moduleTwelveUser, moduleTwelveState);
  }
}
let moduleTwelveLearnViewed = null;
function moduleTwelveLearnItHtml() { const deck = LearnItDecks['soc-12']; return LearnItCards.render({ deck, step: moduleTwelveState.learnItStep || 0, viewed: moduleTwelveLearnViewed, done: (moduleTwelveState.learnItStep || 0) >= deck.length, prefix: 'm12', id: 'm12-learn-it', headingId: 'm12-learn-title', heading: 'Integrate the investigation', intro: 'Six reminders for the independent capstone.', readyHeading: 'Capstone recap, in six ideas', readyText: 'Review the course skills before opening the integrated range.', readyActionLabel: 'LEARN IT', finalActionLabel: 'Finish', doneHeading: 'Capstone recap complete', doneIntro: 'Use these skills in the independent capstone.' }); }
function moduleTwelveWireLearnIt() { const shell = document.querySelector('.m12-shell'); if (!shell || shell.dataset.learnItWired) return; shell.dataset.learnItWired = 'true'; LearnItCards.wire(shell, { prefix: 'm12', onStep: (step) => { moduleTwelveState.learnItStep = step; moduleTwelveLearnViewed = null; moduleTwelveSave(); document.getElementById('m12-learn-it').outerHTML = moduleTwelveLearnItHtml(); }, onView: (index) => { moduleTwelveLearnViewed = index; document.getElementById('m12-learn-it').outerHTML = moduleTwelveLearnItHtml(); shell.querySelector(`[data-m12-learn-view="${index}"]`)?.focus(); } }); }

function moduleTwelveScore() {
  const score = SocM12AssessmentScorer.score(moduleTwelveState.assessmentState, SocM12AssessmentData);
  const criticalErrors = score.unsafeExecution ? ['An unsafe state-changing action executed outside approved scope.'] : [];
  return {
    score: score.score, raw: score.rawScore, criticalErrors, scorePayload: score,
    breakdown: score.criteria.map((item) => ({ label: item.label, score: item.points, max: item.max, evidence: item.supportingEvidence, misses: item.misses })),
    feedback: score.review.feedback, hintPenalty: 0,
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
    ${moduleTwelveLearnItHtml()}
    <section class="m12-section mf-section" aria-labelledby="m12-gate-title"><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge"><i class="ri-git-merge-line" aria-hidden="true"></i></span><div><p class="m12-kicker">Prerequisite gate</p><h2 id="m12-gate-title">Complete Modules 01–11 to unlock the incident</h2></div></div>
      <p class="m12-muted">Only completion status is shown. Incident evidence, investigation consoles, hints, and the simulator launch remain unavailable while the gate is closed.</p>
      <div class="m12-prereq-grid">${prerequisites.map((item) => `<a href="#/program/soc-analyst/module/${item.number}" class="m12-prereq ${item.complete ? 'is-complete' : ''}"><span>${String(item.number).padStart(2, '0')}</span><div><strong>${esc(item.title)}</strong><small>${item.complete ? 'Complete' : 'Required'}</small></div><i class="${item.complete ? 'ri-checkbox-circle-fill' : 'ri-lock-line'}" aria-hidden="true"></i></a>`).join('')}</div>
    </section>
  </main></div>`;
}

function moduleTwelveConsole() {
  return `<div class="m03e-console-host" id="m03e-console-m12">${moduleThreeConsoleHtml('m12')}</div>`;
}

const MODULE_TWELVE_TICKET_FINDINGS = [
  { name: 'priorityRationale', label: 'Priority rationale', type: 'textarea', minLength: 80, maxLength: 1000 },
  { name: 'scopeStatement', label: 'Scope statement', type: 'textarea', minLength: 100, maxLength: 1000 },
  { name: 'executiveSummary', label: 'Executive summary', type: 'textarea', minLength: 180 },
  { name: 'closureNote', label: 'Closure note', type: 'textarea', minLength: 100, maxLength: 2000 },
];

// Presence checks describe outcome categories; they never evaluate correctness.
function moduleTwelveActionMissing() {
  const state = moduleTwelveState.assessmentState || {};
  const actions = state.actionHistory || [];
  const has = (type) => actions.some((action) => action.type === type);
  const checks = [
    [has('review-alert') || has('alert-disposition'), 'No alert determination recorded yet'],
    [has('intel-decision'), 'No intelligence verdict recorded yet'],
    [has('query-run'), 'No query test recorded yet'],
    [has('rule-save'), 'No detection rule saved yet'],
    [has('rule-schedule'), 'No detection schedule recorded yet'],
    [has('incident-link'), 'No alert-to-incident relationship recorded yet'],
    [(state.investigations || []).some((item) => item.domain !== 'scope' && item.domain !== 'timeline'), 'No cross-domain investigation finding recorded yet'],
    [(state.selectedEvidence || []).length > 0, 'No evidence selected yet'],
    [has('attack-map'), 'No ATT&CK determination recorded yet'],
    [has('workflow-design'), 'No response workflow recorded yet'],
    [has('execute'), 'No response action attempted yet'],
    [has('recovery'), 'No recovery validation recorded yet'],
    [has('handoff') || state.reports?.handoff, 'No shift handoff recorded yet'],
  ];
  return checks.filter(([present]) => !present).map(([, message]) => message);
}

function moduleTwelveCaseSpec() {
  return {
    caseId: MODULE_TWELVE_CASE.caseId,
    ticketType: 'Independent capstone · Operation Amber Finch',
    userOptions: MODULE_TWELVE_CASE.userOptions,
    deviceOptions: MODULE_TWELVE_CASE.deviceOptions,
    dispositionOptions: MODULE_TWELVE_CASE.dispositionOptions,
    departmentOptions: MODULE_TWELVE_CASE.departmentOptions,
    findings: MODULE_TWELVE_TICKET_FINDINGS,
    notesPlaceholder: 'Record your technical findings, supporting records, scope, response decisions, and remaining uncertainty.',
    notesMin: 260, notesMax: 5000,
    extraMissing: moduleTwelveActionMissing(),
    disabled: moduleTwelveState.submitted === true,
  };
}

function moduleTwelveTicketView() {
  return `${caseRecordPane(moduleTwelveState, {
    ...moduleTwelveCaseSpec(), formId: 'm12-case-form',
    saveAttr: 'data-m12-save-case', submitAttr: 'data-m12-submit-case',
    panelId: 'm12-case-panel', showMissing: moduleTwelveState.showMissing,
    reviewStatus: moduleTwelveReviewStatus() === 'Lab graded' ? 'graded' : 'review',
    lockedMessage: 'Your incident ticket and range actions are recorded for faculty review.',
  })}`;
}

// Record the student's authored ticket findings into the same replayable log
// used by the range. Repeated saves with unchanged text add no actions.
function moduleTwelveSyncTicket() {
  if (moduleTwelveState.submitted) return;
  const fixture = SocM12AssessmentData;
  let state = moduleTwelveState.assessmentState;
  const citations = (text) => fixture.scenario.evidence.filter((item) => new RegExp(`\\b${item.id}\\b`, 'i').test(text)).map((item) => item.id);
  const record = (type, key, details) => {
    const last = [...state.actionHistory].reverse().find((action) => action.details?.ticketField === key);
    if (last && Object.keys(details).every((key) => JSON.stringify(last.details[key]) === JSON.stringify(details[key]))) return;
    state = SocM12AssessmentState.record(state, fixture, type, { ...details, ticketField: key });
  };
  const fields = moduleTwelveState.findings;
  const ticketCore = Object.fromEntries(['status','severity','affectedUser','affectedDevice','disposition','escalation','escalateTo'].map((key) => [key, moduleTwelveState[key]]));
  ticketCore.priorityRationale = fields.priorityRationale || '';
  if (fields.scopeStatement?.trim()) record('investigation', 'scopeStatement', { domain: 'scope', finding: fields.scopeStatement.trim(), ticketCore, evidenceIds: citations(fields.scopeStatement), entityIds: [moduleTwelveState.affectedUser, moduleTwelveState.affectedDevice].filter(Boolean) });
  if (moduleTwelveState.notes.trim()) record('report', 'notes', { kind: 'technical', text: moduleTwelveState.notes.trim(), ticketCore, evidenceIds: citations(moduleTwelveState.notes) });
  if (fields.executiveSummary?.trim()) record('report', 'executiveSummary', { kind: 'executive', text: fields.executiveSummary.trim(), ticketCore, evidenceIds: citations(fields.executiveSummary) });
  if (fields.closureNote?.trim() && moduleTwelveState.status) record('closure', 'closureNote', { decision: moduleTwelveState.status === 'resolved' ? 'close' : 'retain', rationale: fields.closureNote.trim(), ticketCore });
  moduleTwelveState.assessmentState = state;
}

function moduleTwelveReviewStatus() {
  const attempt = moduleTwelveUser?.latestLabAttemptByKey?.[MODULE_TWELVE_CATALOG_KEY];
  return attempt?.redoRequested ? 'Returned for remediation' : attempt?.reviewedAt ? 'Lab graded' : 'Submitted for faculty review';
}
function moduleTwelveMissionStatus() {
  return `<div class="m12-stage-note"><strong>Mission outcomes</strong><span>One integrated incident record for faculty review</span></div><div class="m12-requirements">${MODULE_TWELVE_REQUIREMENTS.map(([label, detail], index) => `<div><span>${String(index + 1).padStart(2,'0')}</span><p><strong>${esc(label)}</strong><small>${esc(detail)}</small><em>${esc(MODULE_TWELVE_ARC_CALLBACKS[index])}</em></p></div>`).join('')}</div>`;
}

function moduleTwelvePreparation() {
  return `<details class="m12-section-collapsible mf-section" open><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">1</span><div><p class="m12-kicker mf-kicker">Learn It · capstone recap</p><h2 id="m12-preparation-title">Briefing before the independent range</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section mf-section-body" id="m12-preparation" aria-labelledby="m12-preparation-title">
    ${moduleTwelveLearnItHtml()}
    <details class="m12-deep-dive mf-deep-dive"><summary>Deep Dive · capstone preparation notes</summary>
    <p class="m12-muted">These short briefings establish the operating model for the capstone. Review them before investigating; they are guidance, not additional scored stages.</p>
    <div class="mf-lesson-grid">${MODULE_TWELVE_PREPARATION_LECTURES.map((lecture, index) => `<details class="mf-lesson"><summary><span class="mf-lesson-number">${String(index + 1).padStart(2, '0')}</span><span class="mf-lesson-icon"><i class="${esc(lecture.icon || 'ri-book-2-line')}" aria-hidden="true"></i></span><span class="mf-lesson-title"><strong>${esc(lecture.title)}</strong><small>${esc(lecture.focus)}</small></span><i class="ri-arrow-down-s-line mf-chevron" aria-hidden="true"></i></summary><div class="mf-lesson-body"><p>${esc(lecture.script)}</p><p class="mf-takeaway"><strong>Analyst prompt:</strong> ${esc(lecture.practice)}</p><p class="mf-takeaway"><small>Video placeholder · 8–12 minute recording slot</small></p></div></details>`).join('')}</div>
    </details>
  </section></details>`;
}

function moduleTwelveGetQuickNavItems() {
  return [
    { id: 'preparation', title: 'Preparation', kind: 'lecture', isComplete: true, scrollId: 'm12-hero' },
    { id: 'mission', title: 'Mission Requirements', kind: 'lab', isComplete: false, scrollId: 'm12-mission-title' },
    { id: 'investigation', title: 'Investigation Consoles', kind: 'lab', isComplete: false, scrollId: 'm12-range' },
    { id: 'assessment', title: 'Assessment', kind: 'lab', isComplete: false, scrollId: 'm12-ticket' },
  ];
}

function moduleTwelveGetSections() {
  const complete = Boolean(moduleTwelveState.completed);
  return [
    // This is an integrated capstone, not a sequential course flow. Keep all
    // sections reachable while the single cumulative assessment is in progress.
    { id: 'preparation', title: 'Capstone preparation', type: 'lecture', isComplete: true, scrollId: 'm12-preparation', gated: false },
    { id: 'mission', title: 'Mission requirements', type: 'read', isComplete: complete, scrollId: 'm12-mission-title', gated: false },
    { id: 'investigation', title: 'Investigation consoles', type: 'lab', isComplete: complete, scrollId: 'm12-range', gated: false },
    { id: 'assessment', title: 'Assessment Lab', type: 'review', isComplete: complete, scrollId: 'm12-ticket', gated: false },
  ];
}

function viewModuleTwelve(user, program) {
  moduleTwelveLoad(user, program);
  if (!moduleTwelveUnlocked(user, program)) return moduleTwelveLockedView(user, program);
  SocM12AssessmentConsole.mount(null);
  const module = program.modules['soc-12'];
  const sections = moduleTwelveGetSections();
  return `<div class="m12-shell">${moduleTwelveHeader(user, program)}<div class="mquick-nav-layout">${moduleUnifiedNav(sections, { moduleKey: 'm12' })}<main class="m12-main mf-frame">
    <section class="m12-hero mf-hero" aria-labelledby="m12-title"><div><p class="m12-kicker mf-kicker">Module 12 · ${formatHandsOnDuration(module.durationMinutes)} · Final Assessment</p><h1 id="m12-title">${esc(module.title)}</h1><p class="m12-kicker mf-kicker">Case scenario · Operation Amber Finch</p><p class="mf-lede">Investigate a synthetic high-priority signal across the security operations range: discover what happened, bound impact, improve detection, and direct response. Close the case with a portfolio-grade report integrating competencies from Modules 01–11.</p>
      <div class="m12-hero-actions"><a class="m12-secondary" href="#m12-range"><i class="ri-arrow-down-line" aria-hidden="true"></i> Investigate here</a><a class="m12-primary" href="#m12-range" data-m12-open-ticket><i class="ri-file-check-line" aria-hidden="true"></i> Open ITSM Ticket</a></div></div>
      <dl class="mf-stats"><div><dt>Case</dt><dd>INC-4821</dd></div><div><dt>Mode</dt><dd>Independent assessment</dd></div><div><dt>Review</dt><dd>Faculty review</dd></div></dl></section>
    <section class="m12-objective"><div><i class="ri-focus-3-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Assessment focus</p><h2>Demonstrate preparation, cross-source investigation, scoped response, verified recovery, and clear reporting across the integrated incident.</h2></div></section>
    <section class="m12-objective"><div><i class="ri-git-merge-line" aria-hidden="true"></i></div><div><p class="m12-kicker">Prior instruction</p><h2>This capstone draws on skills from all 11 prior modules: SOC operations foundations (M01), network and identity foundations (M02), SIEM and log analysis (M03), detection rule tuning (M04), endpoint investigation (M05), threat hunting (M06), network and email analysis (M07), vulnerability prioritization (M08), incident response (M09), evidence handling and case documentation (M10), and SOC metrics and communication (M11).</h2></div></section>
    ${moduleTwelvePreparation()}
    <details class="m12-section-collapsible mf-section" open><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">2</span><div><p class="m12-kicker mf-kicker">Mission requirements</p><h2 id="m12-mission-title">Outcomes, not a prescribed attack path</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section mf-section-body"><p class="m12-muted">Complete the twelve deliverables in any order; use evidence to discover chronology rather than assume an attack sequence. Amber Finch combines M09–M11 response, custody, and reporting with earlier identity, SIEM, detection, endpoint, hunting, network, and prioritization skills.</p>${moduleTwelveMissionStatus()}</section></details>
    <details class="m12-section-collapsible mf-section mf-lab-section" data-lab-maximize><summary><div class="m12-section-heading mf-section-heading"><span class="mf-section-badge">3</span><div><p class="m12-kicker mf-kicker">Complete integrated range</p><h2 id="m12-range-title">Investigation consoles</h2></div><span class="mf-section-toggle" aria-hidden="true"><i class="ri-arrow-down-s-line"></i></span></div></summary><section class="m12-section m12-range-section mf-section-body" id="m12-range"><div id="m12-ticket"><div id="m12-console-root">${moduleTwelveConsole()}</div></div></section></details>

  </main></div></div>`;
}

function moduleTwelveRender(focusId) {
  const root = document.getElementById('app');
  if (!root || !moduleTwelveUser || !moduleTwelveProgram) return;
  SocM12AssessmentConsole.mount(null); // register M03 mount before rendering its shell
  root.innerHTML = viewModuleTwelve(moduleTwelveUser, moduleTwelveProgram);
  wireCommon();
  // This helper replaces the whole app shell, so restore this module's own
  // delegated listeners in addition to the shared portal listeners.
  wireModuleTwelveLab();
  if (focusId) requestAnimationFrame(() => { const target = document.getElementById(focusId); if (target) target.focus(); });
}

function wireModuleTwelveLab() {
  moduleTwelveWireLearnIt();
  const shell = document.querySelector('.m12-shell');
  if (!shell || !moduleTwelveState || !moduleTwelveUnlocked(moduleTwelveUser, moduleTwelveProgram)) return;
  // The console must be wired on the first route render too, not only after
  // moduleTwelveRender(); otherwise its tabs are inert until some other
  // action re-renders the page. mount() is idempotent per console root.
  const consoleRoot = document.getElementById('m03e-console-m12');
  if (consoleRoot) SocM12AssessmentConsole.mount(consoleRoot);
  // wireCommon() dispatches registered-module wiring itself. Keep this guard
  // because moduleTwelveRender() also calls us explicitly after a full-shell
  // replacement; without it one click could produce two scored attempts.
  if (shell.dataset.m12Wired === 'true') return;
  shell.dataset.m12Wired = 'true';
  // Capture the Academy nav target before its shared scroll listener runs.
  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-m12-open-ticket], [data-mnav-chip-scroll="m12-ticket"]')) {
      event.preventDefault(); event.stopPropagation();
      m03eState('m12').tab = 'case'; moduleTwelveSave(); moduleTwelveRender('m12-case-panel');
      const target = document.getElementById('m12-ticket');
      target?.closest('details')?.setAttribute('open', '');
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  }, true);
  shell.addEventListener('submit', (event) => {
    if (event.target.closest('#m12-case-form')) event.preventDefault();
  });
  shell.addEventListener('click', (event) => {
    if (moduleTwelveState.submitted) return;
    if (event.target.closest('[data-m12-save-case]')) {
      moduleTwelveSyncTicket();
      moduleTwelveState.actionHistory.push({ action: 'Updated incident ticket', at: new Date().toISOString() });
      moduleTwelveSave(); moduleTwelveRender('m12-case-panel'); return;
    }
    if (event.target.closest('[data-m12-submit-case]')) moduleTwelveFinalize();
  });
  shell.addEventListener('input', (event) => {
    const field = event.target;
    if (moduleTwelveState.submitted || !field.closest('#m12-case-form')) return;
    if (caseRecordApply(moduleTwelveState, field.name, field.value)) moduleTwelveSave();
  });
  shell.addEventListener('change', (event) => {
    const field = event.target;
    if (moduleTwelveState.submitted || !field.closest('#m12-case-form')) return;
    if (!caseRecordApply(moduleTwelveState, field.name, field.value)) return;
    moduleTwelveSyncTicket(); moduleTwelveSave();
    if (field.tagName === 'SELECT') moduleTwelveRender('m12-case-panel');
  });
  function moduleTwelveFinalize() {
    if (moduleTwelveState.submitted) return;
    moduleTwelveSyncTicket(); moduleTwelveSave();
    const spec = moduleTwelveCaseSpec();
    if (caseRecordMissing(moduleTwelveState, spec).length) {
      moduleTwelveState.showMissing = true; moduleTwelveSave(); moduleTwelveRender('m12-case-panel'); return;
    }
    if (!moduleTwelveState.stageVisits.includes('submission')) moduleTwelveState.stageVisits.push('submission');
    moduleTwelveState.showMissing = false;
    const result = moduleTwelveScore();
    moduleTwelveState.attempts = (moduleTwelveState.attempts || 0) + 1;
    moduleTwelveState.score = result.score;
    moduleTwelveState.bestScore = Math.max(moduleTwelveState.bestScore || 0, result.score);
    moduleTwelveState.breakdown = result.breakdown;
    moduleTwelveState.feedback = result.feedback;
    moduleTwelveState.criticalErrors = result.criticalErrors;
    moduleTwelveState.reviewPayload = result.scorePayload;
    moduleTwelveState.lastSubmittedAt = new Date().toISOString();
    moduleTwelveState.completed = result.score >= MODULE_TWELVE_PASSING_SCORE && result.criticalErrors.length === 0;
    // Every capstone Submit is a faculty submission. The internal rubric
    // recommendation remains in the instructor payload, never the student UI.
    moduleTwelveState.submitted = true;
    moduleTwelveState.actionHistory.push({ action: 'Submitted capstone for faculty review', at: moduleTwelveState.lastSubmittedAt });
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(moduleTwelveUser, MODULE_TWELVE_CATALOG_KEY, {
        state: 'complete',
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
          studentResponses: moduleTwelveState.assessmentState.reports,
          selectedEvidence: moduleTwelveState.assessmentState.selectedEvidence,
          actionHistory: moduleTwelveState.assessmentState.actionHistory,
          reviewPayload: result.scorePayload,
        },
      });
    }
    const artifactContent = {
      responses: moduleTwelveState.assessmentState.reports,
      studentResponses: moduleTwelveState.assessmentState.reports,
      actionHistory: moduleTwelveState.assessmentState.actionHistory,
      selectedEvidence: moduleTwelveState.assessmentState.selectedEvidence,
      determinations: moduleTwelveState.assessmentState.investigations,
      actions: [...moduleTwelveState.assessmentState.executions, ...moduleTwelveState.assessmentState.recovery],
      executiveSummary: moduleTwelveState.assessmentState.reports.executive?.text || '',
      analystNarrative: moduleTwelveState.assessmentState.reports.technical?.text || '',
      closureNote: moduleTwelveState.assessmentState.closure?.rationale || '',
      caseRecord: { status: moduleTwelveState.status, severity: moduleTwelveState.severity, affectedUser: moduleTwelveState.affectedUser, affectedDevice: moduleTwelveState.affectedDevice, disposition: moduleTwelveState.disposition, escalation: moduleTwelveState.escalation, escalateTo: moduleTwelveState.escalateTo },
      score: result.score,
      breakdown: result.breakdown,
      reviewPayload: result.scorePayload,
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
        content: artifactContent, rubricVersion: `m12-cumulative-capstone-v${result.scorePayload.rubricVersion}`,
      });
    }
    if (moduleTwelveState.completed) {
      if (!moduleTwelveState.flags.includes(MODULE_TWELVE_FLAG)) moduleTwelveState.flags.push(MODULE_TWELVE_FLAG);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTwelveUser, 'soc-analyst', 'soc-12', MODULE_TWELVE_CATALOG_KEY);
      // docs/specs/architecture.md §3 Sprint 4 / docs/specs/CURRICULUM_ALIGNMENT_ARCHITECTURE.md §5:
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
    moduleTwelveSave(); moduleTwelveRender('m12-case-panel');
  }
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 12, moduleKey: 'soc-12', view: viewModuleTwelve, wire: wireModuleTwelveLab });

/* Module 02 environment. Fictional, vendor-neutral, and intentionally bounded.
 * It reuses the registered-module contract, LabRuntime, and existing assessment
 * record rather than changing portal routing, authentication, or progress.
 *
 * Rebuilt per docs/specs/MODULE_02_REDESIGN_CORRECTION_BRIEF.md: Learn It /
 * Guided Lab / Assessment Lab are numbered, scroll-targeted sections inside
 * the shared module shell (moduleUnifiedNav + .mquick-nav-layout, same as
 * Module 01). The console walkthrough is the Guided Lab. The HR authorization case
 * uses its console ITSM tab as the independent Assessment Lab artifact.
 */
(function () {
  const LAB_ID = 'm02-console-guide-v1';
  const LAB_KEY = 'lab-identity-investigation';

  const DATA = {
    users: [
      { id: 'alice', name: 'Alice Morgan', username: 'amorgan', title: 'Finance Analyst', department: 'Finance', mfa: 'Enabled', groups: ['Finance-Read', 'VPN-Users'], device: 'wk17' },
      { id: 'john', name: 'John Smith', username: 'jsmith', title: 'Operations Coordinator', department: 'Operations', mfa: 'Enabled', groups: ['Operations-Read'], device: 'wk23' },
      { id: 'ravi', name: 'Ravi Patel', username: 'rpatel', title: 'Web Administrator', department: 'IT', mfa: 'Enabled', groups: ['Web-Administrators'], device: 'wk31' },
      { id: 'cora', name: 'Cora Green', username: 'cgreen', title: 'Finance Contractor', department: 'Finance', mfa: 'Enabled', groups: ['Finance-Read'], device: 'wk09' },
      { id: 'helen', name: 'Helen Diaz', username: 'hdiaz', title: 'HR Specialist', department: 'Human Resources', mfa: 'Enabled', groups: ['HR-Read'], device: 'wk44' },
    ],
    devices: [
      { id: 'wk17', name: 'wkstn-17', ip: '10.20.4.22', user: 'alice', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk23', name: 'wkstn-23', ip: '10.20.4.31', user: 'john', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk31', name: 'wkstn-31', ip: '10.20.4.38', user: 'ravi', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk09', name: 'wkstn-09', ip: '10.20.4.09', user: 'cora', status: 'Online', management: 'Unmanaged', compliance: 'Non-compliant', network: 'Guest Wi-Fi' },
      { id: 'wk44', name: 'wkstn-44', ip: '10.20.4.44', user: 'helen', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
    ],
    resources: [
      { id: 'finance', name: 'FINANCE-FILE-01', type: 'File Server', ip: '10.20.8.10', zone: 'Internal', classification: 'Confidential', groups: ['Finance-Read'], service: 'SMB', transport: 'TCP', port: '445', internet: 'No' },
      { id: 'hr', name: 'HR-FILE-01', type: 'File Server', ip: '10.20.8.20', zone: 'Internal', classification: 'Sensitive', groups: ['HR-Read', 'HR-Administrators'], service: 'SMB', transport: 'TCP', port: '445', internet: 'No' },
      { id: 'web', name: 'WEB-01', type: 'Web Server', ip: '10.20.2.15', zone: 'DMZ', classification: 'Internal', groups: ['Web-Administrators'], service: 'HTTPS', transport: 'TCP', port: '443', internet: 'Yes' },
      { id: 'db', name: 'FINANCE-DB', type: 'Database Server', ip: '10.20.8.30', zone: 'Internal', classification: 'Restricted', groups: ['Finance-Database'], service: 'SQL', transport: 'TCP', port: '1433', internet: 'No' },
    ],
    policies: [
      { id: 'finance-policy', name: 'Finance file access', resource: 'finance', groups: ['Finance-Read'], requirements: ['Managed device', 'MFA'], decision: 'Allow' },
      { id: 'hr-policy', name: 'HR file access', resource: 'hr', groups: ['HR-Read', 'HR-Administrators'], requirements: ['Managed device', 'Corporate network'], decision: 'Allow' },
      { id: 'web-policy', name: 'Web administration', resource: 'web', groups: ['Web-Administrators'], requirements: ['Managed device', 'MFA'], decision: 'Allow' },
      { id: 'db-policy', name: 'Finance database access', resource: 'db', groups: ['Finance-Database'], requirements: ['Managed device', 'MFA'], decision: 'Allow' },
    ],
    events: [
      { id: 'evt-alice-finance', time: '08:14', user: 'alice', device: 'wk17', resource: 'finance', auth: 'Successful', mfa: 'Satisfied', authorization: 'Finance-Read', result: 'ALLOWED', policy: 'finance-policy' },
      { id: 'evt-john-hr-denied', time: '08:17', user: 'john', device: 'wk23', resource: 'hr', auth: 'Successful', mfa: 'Satisfied', authorization: 'None', result: 'DENIED', policy: 'hr-policy' },
      { id: 'evt-cora-db-denied', time: '08:21', user: 'cora', device: 'wk09', resource: 'db', auth: 'Successful', mfa: 'Satisfied', authorization: 'None', result: 'DENIED', policy: 'db-policy' },
      { id: 'evt-john-hr-allowed', time: '08:27', user: 'john', device: 'wk23', resource: 'hr', auth: 'Successful', mfa: 'Satisfied', authorization: 'HR-Read', result: 'ALLOWED', policy: 'hr-policy', violation: true },
      { id: 'evt-ravi-web', time: '08:31', user: 'ravi', device: 'wk31', resource: 'web', auth: 'Successful', mfa: 'Satisfied', authorization: 'Web-Administrators', result: 'ALLOWED', policy: 'web-policy' },
      { id: 'evt-alice-web', time: '08:36', user: 'alice', device: 'wk17', resource: 'web', auth: 'Successful', mfa: 'Satisfied', authorization: 'None', result: 'DENIED', policy: 'web-policy' },
      // Sprint 2 context rows (purpose tags in M02_ROW_PURPOSE below; not shown to learners).
      { id: 'evt-helen-hr', time: '08:19', user: 'helen', device: 'wk44', resource: 'hr', auth: 'Successful', mfa: 'Satisfied', authorization: 'HR-Read', result: 'ALLOWED', policy: 'hr-policy' },
      { id: 'evt-cora-finance-device', time: '08:24', user: 'cora', device: 'wk09', resource: 'finance', auth: 'Successful', mfa: 'Satisfied', authorization: 'Finance-Read', result: 'DENIED', policy: 'finance-policy' },
      { id: 'evt-ravi-web-late', time: '08:44', user: 'ravi', device: 'wk31', resource: 'web', auth: 'Successful', mfa: 'Satisfied', authorization: 'Web-Administrators', result: 'ALLOWED', policy: 'web-policy' },
      { id: 'evt-john-finance-denied', time: '08:49', user: 'john', device: 'wk23', resource: 'finance', auth: 'Successful', mfa: 'Satisfied', authorization: 'None', result: 'DENIED', policy: 'finance-policy' },
      { id: 'evt-alice-finance-pm', time: '09:02', user: 'alice', device: 'wk17', resource: 'finance', auth: 'Successful', mfa: 'Satisfied', authorization: 'Finance-Read', result: 'ALLOWED', policy: 'finance-policy' },
    ],
  };

  // Row-purpose tags for the Sprint 2 context rows (documentation only; never rendered).
  const M02_ROW_PURPOSE = {
    'evt-helen-hr': 'baseline: a correct HR-Read allow, for comparison with the confirmed excess',
    'evt-cora-finance-device': 'alternate explanation: Finance-Read holder denied because wkstn-09 is unmanaged (device record + policy requirement)',
    'evt-ravi-web-late': 'routine repeat of an authorized administrator allow',
    'evt-john-finance-denied': 'baseline: policy correctly denies an out-of-scope request (shows deny path works)',
    'evt-alice-finance-pm': 'routine repeat of an authorized allow',
  };

  const TABS = [['map', 'Network Map'], ['activity', 'Access Activity'], ['identities', 'Identities'], ['devices', 'Devices'], ['resources', 'Resources'], ['policies', 'Policies']];
  // Shared authored deck; the original six ideas retain their console tab/target metadata.
  const LEARN_STEPS = window.LearnItDecks?.['soc-02'] || [];
  const ORIGINAL_LEARN_STEP_COUNT = 6;

  // Independent, item-specific explanations for the console walkthrough.
  const CONSOLE_GUIDE_STEPS = [
    { title: 'Frame the review', body: 'The console is a working environment, not a quiz. Start with the analyst questions that remain useful in any tool: who acted, what they tried to reach, when and where it happened, why it may be expected, and how the request was evaluated.', lookFor: 'wkstn-17, its connection path, and the requested destination.', lab: 'Both labs use this same evidence-first habit.', tab: 'map', target: ['device', 'wk17'] },
    { title: 'Trace the network path', body: 'A network map shows the systems, zones, and boundaries a request crosses. Use it to check whether the source can reach the destination over the expected service—and whether that route is intentional.', lookFor: 'The source workstation, the boundary, and FINANCE-FILE-01.', lab: 'Guided Lab · map the route before opening the access records.', tab: 'map', target: ['resource', 'finance'] },
    { title: 'Read the activity record', body: 'An activity row gives you the facts behind an alert: identity, device, time, destination, service, and result. Establish those facts before deciding whether the access is normal or suspicious.', lookFor: 'Alice’s 08:14 access record and its full details.', lab: 'Guided Lab · establish the request facts before interpreting them.', tab: 'activity', target: ['event', 'evt-alice-finance'] },
    { title: 'Validate identity and device', body: 'A successful sign-in proves only that authentication passed. It does not prove the user was authorized or that their device met security requirements. Compare the identity’s role and groups with the device’s trust state.', lookFor: 'Alice’s Finance-Read group and wkstn-17’s managed, compliant state.', lab: 'Guided Lab · compare identity and device context.', tab: 'identities', target: ['user', 'alice'] },
    { title: 'Understand the resource and policy', body: 'A resource is the system or data being protected. Its classification and expected service tell you what is at stake; its access policy defines which groups and conditions are allowed. Compare both with the actual request.', lookFor: 'FINANCE-FILE-01’s Confidential classification, SMB/TCP 445 service, authorized group, and access policy.', lab: 'Guided Lab · compare the request with its resource policy.', tab: 'resources', target: ['resource', 'finance'] },
    { title: 'Correlate before concluding', body: 'No single field tells the whole story. Correlate the access record with the identity, device, network path, resource, and policy. Then separate what the evidence proves from what still needs investigation.', lookFor: 'Alice’s ALLOWED result, then the identity, device, and policy behind it.', lab: 'Carry this evidence-first method into the Assessment Lab.', tab: 'activity', target: ['event', 'evt-alice-finance'] },
  ];

  // Facts the console cannot demonstrate well on its own.
  const KNOWLEDGE_QUESTIONS = [
    { id: 'protocol', prompt: 'A resource’s expected access is listed as "SMB / TCP 445." What does TCP represent?', options: [{ id: 'a', text: 'The transport protocol carrying the connection' }, { id: 'b', text: 'The application service' }, { id: 'c', text: 'The destination IP address' }, { id: 'd', text: 'The security zone' }], correct: 'a', correctMsg: 'Correct. SMB is the service, TCP is the transport protocol, and 445 is the port.', incorrectMsg: 'SMB names the service and 445 is the port. TCP is the transport protocol connecting them.' },
    { id: 'correlation', prompt: 'An account-activity review shows a burst of failed logons for one account. What is the strongest next move?', options: [{ id: 'a', text: 'Correlate the user, source, device, timing, lockout state, and expected baseline' }, { id: 'b', text: 'Declare compromise from the count alone' }, { id: 'c', text: 'Ignore it because every failure is harmless' }, { id: 'd', text: 'Block every account in the directory' }], correct: 'a', correctMsg: 'Correct. The event pattern is a lead; correlation establishes scope and whether it fits expected behavior.', incorrectMsg: 'A burst is a lead, not a verdict. Correlate identity, source, device, timing, lockout state, and baseline.' },
    { id: 'authorization', prompt: 'In the console’s Identities view, a user belongs to an administrative group. What makes that a security finding?', options: [{ id: 'a', text: 'The privilege exceeds the documented job need or approved scope' }, { id: 'b', text: 'The user authenticated successfully' }, { id: 'c', text: 'The group name contains the word admin' }, { id: 'd', text: 'The account exists in the directory' }], correct: 'a', correctMsg: 'Correct. The finding is the mismatch between granted privilege and approved job need or scope.', incorrectMsg: 'Authentication and a group label are not enough. Compare the granted privilege with documented job need and approval.' },
  ];

  const OPTIONAL_LAB_LINKS = [
    { title: 'User Account Security Assessment', detail: 'User permissions and account-activity review', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-5/lab', labId: 'assessment-copy-1', importedLabId: 'sa-5' },
    { title: 'File System Security Assessment', detail: 'Filesystem permissions and access review', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-2/lab', labId: 'assessment-copy-2', importedLabId: 'sa-2' },
  ];
  const ASSESSMENT_MIN_NOTE_LENGTH = 80;

  // ---------------------------------------------------------- ITSM Ticket
  // docs/specs/MODULE_STANDARD.md §7.2: the Assessment Lab's one graded artifact is the
  // standard ITSM Incident Ticket (portal/case-record.js), not a
  // bare write-up. Module 02 has no larger identity/device cast to draw a
  // 6-8 entry roster from — the console's own five identities/devices (DATA
  // above) are the whole cast, reused here as user/device options. The
  // confirmed finding is evt-john-hr-allowed: John Smith received HR-Read
  // authorization with no matching group membership (`violation: true` in
  // DATA.events) — an access-control excess, not malware or an intrusion.
  const CASE_ID = 'CASE-025502';
  const INCIDENT_ID = 'INC-025811';
  const CASE_USER_OPTIONS = [
    { id: 'john', text: 'John Smith (jsmith) — Operations Coordinator', tier: 'principal' },
    { id: 'cora', text: 'Cora Green (cgreen) — Finance Contractor', tier: 'pivot' },
    { id: 'alice', text: 'Alice Morgan (amorgan) — Finance Analyst', tier: 'noise' },
    { id: 'ravi', text: 'Ravi Patel (rpatel) — Web Administrator', tier: 'noise' },
    { id: 'helen', text: 'Helen Diaz (hdiaz) — HR Specialist', tier: 'noise' },
  ];
  const CASE_DEVICE_OPTIONS = [
    { id: 'wk23', text: 'wkstn-23 (10.20.4.31) — managed, compliant', tier: 'principal' },
    { id: 'wk09', text: 'wkstn-09 (10.20.4.09) — unmanaged, non-compliant', tier: 'pivot' },
    { id: 'wk17', text: 'wkstn-17 (10.20.4.22) — managed, compliant', tier: 'noise' },
    { id: 'wk31', text: 'wkstn-31 (10.20.4.38) — managed, compliant', tier: 'noise' },
    { id: 'wk44', text: 'wkstn-44 (10.20.4.44) — managed, compliant', tier: 'noise' },
  ];
  const CASE_DEPARTMENT_OPTIONS = [
    { id: 'identity-response', text: 'Identity Response', fit: 100, note: 'Best fit — the access policy itself needs correction.' },
    { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 55, note: 'Accepted, but the policy fix belongs to Identity Response.', bounce: 'Tier 2 SOC bounced this — there is no active threat to triage, only a policy gap to correct.' },
    { id: 'hr-privacy', text: 'HR / Data Privacy', fit: 35, note: 'HR-Read exposure matters to Data Privacy, but they cannot correct the access policy.' },
    { id: 'it-helpdesk', text: 'IT Helpdesk', fit: 15, note: 'Helpdesk cannot adjudicate a policy exception.', bounce: 'IT Helpdesk bounced this — it needs a policy decision, not a ticket reset.' },
  ];
  const CASE_DISPOSITION_OPTIONS = [
    { id: 'policy-violation', text: 'Confirmed — authorization granted beyond assigned entitlements' },
    { id: 'expected-access', text: 'False positive — access matches assigned entitlements' },
    { id: 'device-noncompliance', text: 'Confirmed — device compliance violation, no unauthorized data access' },
  ];
  const CASE_FINDINGS = [
    { name: 'access-finding', label: 'Access control finding', missing: 'Record the access control finding', options: [
      { id: 'excess-auth', text: 'Excessive authorization — HR-Read granted without an HR-Read group membership' },
      { id: 'expected', text: 'Expected access — authorization matches assigned groups' },
      { id: 'device-risk', text: 'Device compliance risk — unmanaged/non-compliant device reached a restricted resource' },
    ] },
  ];
  // Answer key. Never shown live in the Assessment Lab (docs/specs/MODULE_STANDARD.md §7.2).
  const CASE_CORRECT = { severity: 'high', disposition: 'policy-violation', escalateTo: 'identity-response', finding: 'excess-auth' };
  const CASE_DEFAULT = { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, actionHistory: [] };

  function caseSpec(disabled) {
    return {
      caseId: CASE_ID,
      incidentIds: [INCIDENT_ID],
      userOptions: CASE_USER_OPTIONS,
      deviceOptions: CASE_DEVICE_OPTIONS,
      departmentOptions: CASE_DEPARTMENT_OPTIONS,
      dispositionOptions: CASE_DISPOSITION_OPTIONS,
      findings: CASE_FINDINGS,
      notesPlaceholder: 'Summarize the identity and HR file access findings, your analysis, and your recommended actions…',
      notesMin: ASSESSMENT_MIN_NOTE_LENGTH,
      disabled,
    };
  }

  function caseTierPoints(options, id) {
    const tier = options.find((option) => option.id === id)?.tier;
    return tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0;
  }

  // Module 02 has no prior multi-select rubric to fold in (the old Assessment
  // Lab only gated on lab completion + a free-text note); weights below are
  // this module's own, proportioned the same way Module 01 folds domain
  // findings into its total — entity scope, severity, disposition, routing
  // quality, one domain finding, and the analyst note all contribute.
  function caseScore(caseRecord) {
    const department = CASE_DEPARTMENT_OPTIONS.find((option) => option.id === caseRecord.escalateTo) || null;
    const escalationOk = caseRecord.escalation === 'required';
    const bounced = escalationOk && department && department.fit < 40;
    const entityPoints = Math.round((caseTierPoints(CASE_USER_OPTIONS, caseRecord.affectedUser) + caseTierPoints(CASE_DEVICE_OPTIONS, caseRecord.affectedDevice)) / 2 * 20);
    const severity = caseRecord.severity === CASE_CORRECT.severity ? 10 : 0;
    const disposition = caseRecord.disposition === CASE_CORRECT.disposition ? 20 : 0;
    const escalation = escalationOk && department && !bounced ? Math.round((department.fit / 100) * 30) : 0;
    const finding = (caseRecord.findings || {})['access-finding'] === CASE_CORRECT.finding ? 10 : 0;
    const notesLen = (caseRecord.notes || '').trim().length;
    const notes = Math.round(Math.min(1, notesLen / ASSESSMENT_MIN_NOTE_LENGTH) * 10);
    const score = entityPoints + severity + disposition + escalation + finding + notes;
    return {
      score,
      breakdown: { affected_entity: entityPoints, severity, disposition, escalation, access_finding: finding, analyst_notes: notes },
      feedback: [
        entityPoints >= 20 ? 'Affected entity/scope: correct — John Smith on wkstn-23.' : entityPoints > 0 ? 'Affected entity/scope: partial credit — a related entity is supported by the evidence, but John Smith / wkstn-23 is the confirmed pair.' : 'Affected entity/scope: review — John Smith / wkstn-23 is the confirmed affected user/device.',
        severity ? 'Severity: correct.' : 'Severity: review — High fits an internal authorization excess into HR data.',
        disposition ? 'Disposition: correct.' : 'Disposition: review — the log shows an authorization excess, confirmed by evidence.',
        !escalationOk ? 'Routing: not applicable — escalation was set to not required.' : !department ? 'Routing: review — route the case to a department.' : department.fit >= 100 ? `Routing: correct — ${department.text} is the best-fit department.` : department.fit >= 40 ? `Routing: accepted, but not the best fit — ${department.note}` : `Routing: returned — ${department.bounce || department.note}`,
      ],
      criticalErrors: caseRecord.escalation === 'not-required' ? ['escalation-not-required'] : [],
    };
  }

  const SOURCES = [
    { title: 'Zero Trust Architecture (SP 800-207)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/207/final', note: 'Comprehensive guide to assuming no inherent trust and evaluating each request on identity, device, location, and risk.' },
    { title: 'Introduction to Public Key Technology and the Federal PKI Infrastructure (SP 800-32)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/32/final', note: 'Certificate and PKI fundamentals: subject, issuer, intended use, and validation.' },
    { title: 'Digital Identity Guidelines: Authentication and Authenticator Management (SP 800-63B-4)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final', note: 'Digital identity guidelines covering authentication methods, MFA, and credential management.' },
    { title: 'Authorization Cheat Sheet', org: 'OWASP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html', note: 'Design and implementation patterns for access control and privilege management.' },
    { title: 'Security+ public domain overview (supplementary draft reference)', org: 'CompTIA', url: 'https://www.comptia.org/certifications/security', note: 'Supplementary public reference only. Not an approval, affiliation, endorsement, or pass guarantee.' },
  ];

  // null = default: floating while stepping, docked in the header once complete.
  let guideTipCollapsed = null;
  let learnView = null; // idea picked from the card strip; null follows the current step

  const DEFAULT = {
    learn: { walkthroughVersion: 3, deckVersion: 1, guideFlowVersion: 1, step: 0, guideStep: -1, guideUnlocked: false, guideCompleted: false, tab: 'map', selected: { type: 'device', id: 'wk17' }, opened: [], knowledgeAnswers: {}, knowledgeScored: false },
    practice: { guideVersion: 1, tab: 'itsm', selected: { type: 'event', id: 'evt-john-hr-denied' }, opened: [], guideStep: 0, guideDocked: false, caseRecord: { ...CASE_DEFAULT }, complete: false },
    prove: { notes: '', submitted: false, attempts: 0, feedback: [], lastSubmittedAt: '', showMissing: false, caseRecord: { status: '', affectedUser: '', affectedDevice: '', severity: '', disposition: '', escalation: '', escalateTo: '', notes: '', findings: {}, submitted: false, actionHistory: [] } },
    completed: false,
    labProgress: {},
  };

  let state, user, reviewMode = false;

  // '' until submitted; then 'review' while the latest attempt awaits
  // faculty, 'graded' once an instructor has reviewed it without returning
  // it. Same pattern as moduleOneProveItReviewStatus() in soc-analyst-
  // module-01.js.
  function proveItReviewStatus() {
    if (!state.practice.caseRecord.submitted) return '';
    const attempt = user?.latestLabAttemptByKey?.[LAB_KEY];
    return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
  }
  function proveItRedoRequested() {
    return user?.openLabRedosByModuleKey?.['soc-02']?.labKey === LAB_KEY;
  }
  function proveItRedoFeedback() {
    if (!proveItRedoRequested()) return '';
    const items = user.openLabRedosByModuleKey['soc-02'].feedback || [];
    return `<div class="m01-redo-feedback" role="note"><strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>${items.length ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>` : '<p>Your instructor returned this case without written notes.</p>'}</div>`;
  }
  // A redo re-opens the working case (mirrors Module 01's moduleOneLoad()
  // reset) without discarding the earlier submitted values.
  function applyRedoReopen() {
    if (proveItRedoRequested() && state.practice.caseRecord.submitted === true) {
      state.practice.caseRecord.submitted = false;
      state.practice.complete = false;
      state.completed = false;
      save();
    }
  }

  const TERM_DEFINITIONS = {
    'Network Map': 'A view of systems, zones, and the paths connections take between them.',
    'DMZ': 'A separated network zone for systems that must accept internet-facing traffic.',
    'Servers & Resources': 'The systems, applications, files, or data a user is trying to reach.',
    Protocol: 'The agreed rules a connection uses to communicate, such as TCP.',
    Port: 'A numbered connection point that identifies a service on a system.',
    Authentication: 'Checking that someone is who they claim to be.',
    Authorization: 'Checking whether that identity is allowed to do this specific action.',
    MFA: 'A second proof of identity, beyond a password.',
    'Managed device': 'A device the organization can administer and enforce security settings on.',
    Compliant: 'Meeting the organization’s required security settings.',
    Resource: 'The system, file, application, or data being requested.',
    'Access policy': 'The rule that states who may access a resource and under what conditions.',
    PKI: 'Public Key Infrastructure: the certificates and trusted issuers used to verify digital identities.',
    'Access decision': 'The final allow or deny result after the request context is evaluated.',
    'Zero Trust': 'Evaluate every request using its current context; do not trust a location by default.',
  };

  const learnTerm = (term, focusable = true) => `<span class="m02e-term" ${focusable ? 'tabindex="0"' : ''} data-definition="${esc(TERM_DEFINITIONS[term] || '')}">${esc(term)}</span>`;

  const collection = (type) => DATA[type === 'policy' ? 'policies' : `${type}s`];
  const by = (type, id) => collection(type).find((x) => x.id === id);
  const entity = (event) => ({ user: by('user', event.user), device: by('device', event.device), resource: by('resource', event.resource), policy: by('policy', event.policy) });

  function load(u) {
    if (user?.email !== u?.email) learnView = null;
    user = u;
    // Module state must survive switching between localhost and GitHub Pages,
    // whose browser storage is origin-specific. Keep localStorage as the fast
    // working copy, while hydrating an empty copy from Supabase and writing
    // changes through the shared module_progress case_state path.
    state = LabRuntime.loadCaseState(LAB_ID, 'soc-02', u, DEFAULT);
    // Migrate the earlier shared-ID record only when the new isolated slot
    // is still empty and the old record contains actual learner work.
    const currentHasWork = state.learn.step > 0 || state.learn.guideStep >= 0
      || state.learn.guideCompleted || state.practice.complete || !!state.practice.notes
      || state.prove.submitted || !!state.prove.notes
      || Object.keys(state.labProgress || {}).length > 0;
    if (!currentHasWork) {
      const legacy = LabRuntime.loadCaseState('m02-trust-path-review-v1', 'soc-02', u, DEFAULT);
      const legacyHasWork = legacy.learn.step > 0 || legacy.learn.guideStep >= 0
        || legacy.learn.guideCompleted || legacy.practice.complete || !!legacy.practice.notes
        || legacy.prove.submitted || !!legacy.prove.notes
        || Object.keys(legacy.labProgress || {}).length > 0;
      if (legacyHasWork) {
        state = legacy;
        LabRuntime.saveCaseState(LAB_ID, 'soc-02', u, state, { debounceMs: 1 });
      }
    }
    // The redesigned console deliberately retains the established Module 02
    // LabRuntime key so a learner's work is not discarded. Earlier versions
    // stored flatter practice/prove objects, however, and therefore have no
    // per-stage `selected` entity. Merge each saved scope into its current
    // defaults before rendering; otherwise an old draft throws while reading
    // `selected.type` and the portal remains on its loading surface.
    const normalizeScope = (saved, defaults) => {
      const value = saved && typeof saved === 'object' ? saved : {};
      return {
        ...defaults,
        ...value,
        selected: { ...defaults.selected, ...(value.selected && typeof value.selected === 'object' ? value.selected : {}) },
        opened: Array.isArray(value.opened) ? value.opened : [],
      };
    };
    const savedLearnDeckVersion = Number(state.learn?.deckVersion || 0);
    state.learn = normalizeScope(state.learn, DEFAULT.learn);
    // Step 6 was the completed boundary of the original six-card deck. Keep
    // completed learners complete after adding objective cards; new learners
    // carry deckVersion 1 from defaults and must work through the expanded deck.
    if (savedLearnDeckVersion < DEFAULT.learn.deckVersion && state.learn.step >= ORIGINAL_LEARN_STEP_COUNT) state.learn.step = LEARN_STEPS.length;
    state.learn.deckVersion = DEFAULT.learn.deckVersion;
    // Once a learner has ever reached the end of Learn It, the console
    // guide stays unlockable even if they later hit "Restart walkthrough" —
    // a restart is meant to let them revisit the ideas, not re-lock the
    // guide behind redoing them.
    if (state.learn.step >= LEARN_STEPS.length) state.learn.guideUnlocked = true;
    // Restart the walkthrough once when its teaching sequence changes so a
    // learner does not land halfway through the retired generic tour.
    if (state.learn.walkthroughVersion !== DEFAULT.learn.walkthroughVersion) {
      state.learn = { ...DEFAULT.learn };
      save();
    }
    if (state.learn.guideFlowVersion !== DEFAULT.learn.guideFlowVersion || (state.learn.step < LEARN_STEPS.length && state.learn.guideStep >= 0 && !state.learn.guideCompleted)) {
      state.learn.guideStep = -1;
      state.learn.guideFlowVersion = DEFAULT.learn.guideFlowVersion;
      save();
    }
    state.learn.knowledgeAnswers = state.learn.knowledgeAnswers && typeof state.learn.knowledgeAnswers === 'object' ? state.learn.knowledgeAnswers : {};
    // Preserve the existing practice scope and its ticket as the Assessment Lab
    // so saved learner work remains attached to the same case record.
    const savedPracticeGuideVersion = Number(state.practice?.guideVersion || 0);
    state.practice = normalizeScope(state.practice, DEFAULT.practice);
    if (savedPracticeGuideVersion < DEFAULT.practice.guideVersion) {
      state.practice.guideStep = 0;
      state.practice.tab = 'itsm';
      state.practice.guideVersion = DEFAULT.practice.guideVersion;
    }
    state.practice.caseRecord = { ...CASE_DEFAULT, ...(state.practice.caseRecord && typeof state.practice.caseRecord === 'object' ? state.practice.caseRecord : {}) };
    if (!state.practice.caseRecord.findings || typeof state.practice.caseRecord.findings !== 'object') state.practice.caseRecord.findings = {};
    if (!Array.isArray(state.practice.caseRecord.actionHistory)) state.practice.caseRecord.actionHistory = [];
    if (state.practice.complete) state.practice.caseRecord.submitted = true;
    // The prior Guided Lab could inherit a completion flag from the optional
    // imported exercises without an actual ticket. Do not carry that shortcut
    // into the newly independent Assessment Lab.
    if (state.practice.complete && state.practice.caseRecord.submitted
      && caseRecordMissing(state.practice.caseRecord, caseSpec(false)).length
      && !user?.latestLabAttemptByKey?.[LAB_KEY]) {
      state.practice.complete = false;
      state.practice.caseRecord.submitted = false;
      state.completed = false;
      save();
    }
    if (!Number.isFinite(state.practice.guideStep)) state.practice.guideStep = 0;
    state.prove = { ...DEFAULT.prove, ...(state.prove && typeof state.prove === 'object' ? state.prove : {}) };
    if (!Array.isArray(state.prove.feedback)) state.prove.feedback = [];
    if (typeof state.practice.notes !== 'string') state.practice.notes = '';
    if (typeof state.prove.notes !== 'string') state.prove.notes = '';
    // Old saved state (pre case-record) has no caseRecord at all; default it
    // rather than crash the render (CASE_RECORD_MIGRATION.md #6).
    state.prove.caseRecord = { ...CASE_DEFAULT, ...(state.prove.caseRecord && typeof state.prove.caseRecord === 'object' ? state.prove.caseRecord : {}) };
    if (state.prove.caseRecord.findings === null || typeof state.prove.caseRecord.findings !== 'object') state.prove.caseRecord.findings = {};
    if (!Array.isArray(state.prove.caseRecord.actionHistory)) state.prove.caseRecord.actionHistory = [];
    applyRedoReopen();
    state.labProgress = state.labProgress && typeof state.labProgress === 'object' ? state.labProgress : {};
    if (typeof markModuleContentOpened === 'function') markModuleContentOpened(u, 'soc-analyst', 'soc-02');
  }
  function save() { LabRuntime.saveCaseState(LAB_ID, 'soc-02', user, state); }

  function selectedEvent(scope) {
    const sel = state[scope].selected;
    return (sel.type === 'event' && by('event', sel.id)) || DATA.events[0];
  }
  function setEntity(scope, type, id) {
    state[scope].selected = { type, id };
    const tag = `${type}:${id}`;
    if (!state[scope].opened.includes(tag)) state[scope].opened.push(tag);
    save();
    renderScope(scope);
  }
  function setTab(scope, tab) {
    state[scope].tab = tab;
    save(); renderScope(scope);
  }

  function field(label, value) { return `<div class="m02e-field"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`; }

  function drawer(scope) {
    const selected = state[scope].selected;
    let title = '', content = '';
    if (selected.type === 'event') { const e = selectedEvent(scope), x = entity(e); title = 'ACCESS DETAILS'; content = `<h3>${esc(e.time)} · ${esc(x.user.name)} → ${esc(x.resource.name)}</h3><dl class="m02e-fields">${field('User', x.user.name)}${field('Source Device', x.device.name)}${field('Source IP', x.device.ip)}${field('Destination', x.resource.name)}${field('Destination IP', x.resource.ip)}${field('Service', x.resource.service)}${field('Transport', x.resource.transport)}${field('Port', x.resource.port)}${field('Authentication', e.auth)}${field('MFA', e.mfa)}${field('Device Trust', `${x.device.management} / ${x.device.compliance}`)}${field('Authorization', e.authorization)}${field('Network Decision', e.result)}</dl>`; }
    if (selected.type === 'user') { const x = by('user', selected.id), d = by('device', x.device), recent = DATA.events.filter((e) => e.user === x.id).slice(0, 3); title = 'IDENTITY'; content = `<h3>${esc(x.name)}</h3><p>${esc(x.title)} · ${esc(x.department)}</p><dl class="m02e-fields">${field('Account', 'Active')}${field('MFA', x.mfa)}${field('Primary Device', d.name)}${field('Device Trust', `${d.management} / ${d.compliance}`)}${field('Groups / Roles', x.groups.join(', '))}</dl><h4>Recent access</h4>${recent.map((e) => `<button data-m02e-select="${scope}:event:${e.id}">${e.time} · ${by('resource', e.resource).name} · ${e.result}</button>`).join('')}`; }
    if (selected.type === 'device') { const x = by('device', selected.id), u = by('user', x.user); title = 'DEVICE'; content = `<h3>${esc(x.name)}</h3><dl class="m02e-fields">${field('IP Address', x.ip)}${field('User', u.name)}${field('Status', x.status)}${field('Management', x.management)}${field('Compliance', x.compliance)}${field('Network', x.network)}</dl><h4>Recent connections</h4>${DATA.events.filter((e) => e.device === x.id).map((e) => `<button data-m02e-select="${scope}:event:${e.id}">${by('resource', e.resource).name} · ${by('resource', e.resource).service}</button>`).join('') || '<p>No current activity.</p>'}`; }
    if (selected.type === 'resource') { const x = by('resource', selected.id), p = DATA.policies.find((item) => item.resource === x.id); title = 'RESOURCE'; content = `<h3>${esc(x.name)}</h3><dl class="m02e-fields">${field('Type', x.type)}${field('Network Zone', x.zone)}${field('Data Classification', x.classification)}${field('Authorized Groups', x.groups.join(', '))}${field('Expected Access', `${x.service} / ${x.transport} ${x.port}`)}${field('Internet Accessible', x.internet)}</dl>${p ? `<button data-m02e-select="${scope}:policy:${p.id}">Inspect ${esc(p.name)} policy</button>` : ''}`; }
    if (selected.type === 'policy') { const x = by('policy', selected.id), r = by('resource', x.resource); title = 'ACCESS POLICY'; content = `<h3>${esc(x.name)}</h3><dl class="m02e-fields">${field('Resource', r.name)}${field('Users / Groups', x.groups.join(', '))}${field('Requirements', x.requirements.join(' + '))}${field('Decision', x.decision)}</dl><p class="m02e-muted">Inspect policy conditions alongside identity, device, and activity context.</p>`; }
    return `<aside class="m02e-drawer"><p class="m02e-label">${title}</p>${content}</aside>`;
  }

  // Network map geometry, in a 1000 × 720 logical canvas. Nodes are HTML
  // buttons placed by percentage over an SVG link layer, so selection, the
  // console guide focus, and keyboard access keep working as before.
  const MAP_W = 1000, MAP_H = 720;
  const MAP_POINTS = {
    internet: [500, 55], fw: [500, 175], sw: [500, 340], ap: [150, 555],
    web: [150, 355], finance: [870, 375], hr: [870, 500], db: [870, 625],
    wk17: [380, 615], wk23: [480, 615], wk31: [580, 615], wk44: [680, 615], wk09: [150, 650],
  };
  const MAP_ZONES = [
    { cls: 'dmz', box: [15, 250, 275, 190], term: 'DMZ' },
    { cls: 'guest', box: [15, 470, 275, 240], text: 'GUEST WI-FI' },
    { cls: 'internal', box: [310, 250, 675, 462], text: 'INTERNAL' },
    { cls: 'lan', box: [325, 480, 420, 222], text: 'USER LAN' },
    { cls: 'servers', box: [765, 280, 205, 422], term: 'Servers & Resources' },
  ];
  const RESOURCE_ICONS = { web: 'ri-server-line', finance: 'ri-folder-shared-line', hr: 'ri-folder-shared-line', db: 'ri-database-2-line' };
  const mapLinks = () => {
    const p = MAP_POINTS;
    const links = {
      'internet-fw': [p.internet, p.fw],
      'fw-web': [p.fw, [150, 175], p.web],
      'fw-ap': [p.fw, [300, 175], [300, 555], p.ap],
      'ap-wk09': [p.ap, p.wk09],
      'fw-sw': [p.fw, p.sw],
    };
    ['finance', 'hr', 'db'].forEach((r) => { links[`sw-${r}`] = [p.sw, [720, 340], [720, p[r][1]], p[r]]; });
    DATA.devices.filter((d) => d.id !== 'wk09').forEach((d) => { links[`sw-${d.id}`] = [p.sw, [500, 530], [p[d.id][0], 530], p[d.id]]; });
    return links;
  };
  const pointsPath = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  // Hop list a request takes from a device to a resource. Guest Wi-Fi traffic
  // has to cross the firewall to reach anything internal.
  function mapRoute(deviceId, resourceId) {
    const hops = deviceId === 'wk09' ? ['ap-wk09<', 'fw-ap<'] : [`sw-${deviceId}<`];
    const at = deviceId === 'wk09' ? 'fw' : 'sw';
    if (resourceId === 'web') hops.push(...(at === 'sw' ? ['fw-sw<'] : []), 'fw-web');
    else hops.push(...(at === 'fw' ? ['fw-sw'] : []), `sw-${resourceId}`);
    const links = mapLinks();
    const pts = [];
    hops.forEach((hop) => {
      const rev = hop.endsWith('<');
      const seg = links[rev ? hop.slice(0, -1) : hop].slice();
      if (rev) seg.reverse();
      seg.forEach((pt) => { const last = pts[pts.length - 1]; if (!last || last[0] !== pt[0] || last[1] !== pt[1]) pts.push(pt); });
    });
    const via = new Set(hops.flatMap((h) => h.replace('<', '').split('-')));
    return { pts, via };
  }
  // The map follows whatever the analyst has open: an event directly, or the
  // first recorded event for the selected identity, device, resource, or policy.
  function mapEvent(scope) {
    const sel = state[scope].selected;
    if (sel.type === 'event') return by('event', sel.id) || DATA.events[0];
    return DATA.events.find((e) => e[sel.type] === sel.id) || null;
  }

  function mapView(scope) {
    const e = mapEvent(scope), x = e ? entity(e) : null;
    const sel = state[scope].selected;
    const label = (text) => scope === 'learn' && TERM_DEFINITIONS[text] ? learnTerm(text) : esc(text);
    const route = e ? mapRoute(e.device, e.resource) : { pts: [], via: new Set() };
    const outcome = e ? (e.result === 'ALLOWED' ? 'is-allow' : 'is-deny') : '';
    const pos = ([px, py]) => `left:${px / MAP_W * 100}%;top:${py / MAP_H * 100}%`;
    const box = ([bx, by2, bw, bh]) => `left:${bx / MAP_W * 100}%;top:${by2 / MAP_H * 100}%;width:${bw / MAP_W * 100}%;height:${bh / MAP_H * 100}%`;
    const onPath = (key) => route.via.has(key) ? ' is-path' : '';
    const node = (key, type, id, icon, name, sub, kind) => {
      const selected = sel.type === type && sel.id === id ? ' is-selected' : '';
      const blocked = e && e.result !== 'ALLOWED' && key === e.resource ? '<b class="m02e-blocked" title="Access denied"><i class="ri-close-circle-fill"></i></b>' : '';
      return `<button class="m02e-node ${kind}${selected}${onPath(key)}" style="${pos(MAP_POINTS[key])}" data-m02e-select="${scope}:${type}:${id}"><i class="${icon}"></i>${blocked}<strong>${esc(name)}</strong><small>${esc(sub)}</small></button>`;
    };
    const infra = (key, icon, name, sub, kind) => `<div class="m02e-node is-static ${kind}${onPath(key)}" style="${pos(MAP_POINTS[key])}"><i class="${icon}"></i><strong>${esc(name)}</strong><small>${esc(sub)}</small></div>`;
    const links = mapLinks();
    const policyId = e ? e.policy : DATA.policies[0].id;
    const fwSelected = sel.type === 'policy' && sel.id === policyId ? ' is-selected' : '';
    const last = route.pts.slice(-2);
    const portAt = last.length === 2 ? [last[0][0] + (last[1][0] - last[0][0]) * 0.42, last[0][1] + (last[1][1] - last[0][1]) * 0.42] : null;
    const d = pointsPath(route.pts);
    const svg = `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" aria-hidden="true">${Object.entries(links).map(([k, pts]) => `<path class="m02e-link${k === 'ap-wk09' ? ' wireless' : ''}" d="${pointsPath(pts)}"/>`).join('')}${e ? `<path class="m02e-flow-glow" d="${d}"/><path class="m02e-flow" d="${d}"/><circle class="m02e-packet" r="7"><animateMotion dur="2.6s" repeatCount="indefinite" path="${d}" ${e.result === 'ALLOWED' ? '' : 'keyPoints="0;0.9" keyTimes="0;1" calcMode="linear"'}/></circle>` : ''}</svg>`;
    const zones = MAP_ZONES.map((z) => `<div class="m02e-tz ${z.cls}" style="${box(z.box)}"><span>${z.term ? label(z.term) : esc(z.text)}</span></div>`).join('');
    const nodes = [
      infra('internet', 'ri-global-line', 'INTERNET', 'Untrusted', 'kind-internet'),
      `<button class="m02e-node kind-fw${fwSelected}${onPath('fw')}" style="${pos(MAP_POINTS.fw)}" data-m02e-select="${scope}:policy:${policyId}"><i class="ri-shield-keyhole-line"></i><strong>FIREWALL</strong><small>FW-EDGE-01</small></button>`,
      `<div class="m02e-caption" style="${pos([548, 165])}">Enforces ${label('Access policy')}</div>`,
      infra('sw', 'ri-router-line', 'CORE-SW-01', 'Core switch', 'kind-switch'),
      infra('ap', 'ri-wifi-line', 'GUEST-AP', 'Wireless access point', 'kind-ap'),
      ...DATA.resources.map((r) => node(r.id, 'resource', r.id, RESOURCE_ICONS[r.id], r.name, `${r.ip} · ${r.service}`, 'kind-resource')),
      ...DATA.devices.map((dv) => node(dv.id, 'device', dv.id, dv.id === 'wk09' ? 'ri-macbook-line' : 'ri-computer-line', dv.name, dv.ip, 'kind-device')),
    ].join('');
    const port = e && portAt ? `<div class="m02e-port" style="${pos(portAt)}">${esc(x.resource.service)} · ${esc(x.resource.transport)} ${esc(x.resource.port)}</div>` : '';
    const strip = e
      ? `<div class="m02e-connection ${outcome}"><span><i class="ri-computer-line"></i> ${esc(x.device.name)} · ${esc(x.device.ip)}</span><b>${esc(x.resource.service)} / ${esc(x.resource.transport)} ${esc(x.resource.port)} <i class="ri-arrow-right-line"></i></b><span>${esc(x.resource.name)} · ${esc(x.resource.ip)}</span><em>${esc(e.time)} · ${esc(e.result)}</em></div>`
      : `<div class="m02e-connection"><span>No recorded connections for this selection.</span></div>`;
    const legend = `<div class="m02e-legend"><span><i class="wired"></i>Wired link</span><span><i class="wireless"></i>Wireless link</span><span><i class="allow"></i>Allowed request</span><span><i class="deny"></i>Denied request</span></div>`;
    const ids = `<div class="m02e-identities"><em>IDENTITIES</em>${DATA.users.map((u) => `<button class="m02e-node m02e-id${sel.type === 'user' && sel.id === u.id ? ' is-selected' : ''}${e && e.user === u.id ? ' is-path' : ''}" data-m02e-select="${scope}:user:${u.id}"><i class="ri-user-3-line"></i><span><strong>${esc(u.name)}</strong><small>${esc(u.groups.join(', '))}</small></span></button>`).join('')}</div>`;
    return `<section class="m02e-map ${outcome}"><div class="m02e-topo-wrap"><div class="m02e-topo">${zones}${svg}${nodes}${port}</div></div>${strip}${legend}${ids}</section>`;
  }
  function activityView(scope) {
    return `<section><div class="m02e-table-wrap"><table class="m02e-table"><caption>ACCESS ACTIVITY</caption><thead><tr><th>TIME</th><th>USER</th><th>DEVICE</th><th>SOURCE</th><th>RESOURCE</th><th>SERVICE</th><th>RESULT</th></tr></thead><tbody>${DATA.events.map((e) => { const x = entity(e); return `<tr class="${state[scope].selected.type === 'event' && state[scope].selected.id === e.id ? 'is-selected' : ''}" data-m02e-select="${scope}:event:${e.id}"><td>${esc(e.time)}</td><td>${esc(x.user.username)}</td><td>${esc(x.device.name)}</td><td>${esc(x.device.ip)}</td><td>${esc(x.resource.name)}</td><td>${esc(x.resource.service)}</td><td><b class="${e.result === 'ALLOWED' ? 'allow' : 'deny'}">${esc(e.result)}</b></td></tr>`; }).join('')}</tbody></table></div></section>`;
  }
  function listingView(scope, type) {
    const items = collection(type);
    const heading = type === 'user' ? 'IDENTITIES' : type === 'device' ? 'DEVICES' : type === 'resource' ? 'RESOURCES' : 'ACCESS POLICIES';
    return `<section class="m02e-listing"><h2>${heading}</h2>${items.map((x) => { const sub = type === 'user' ? `${x.title} · ${x.groups.join(', ')}` : type === 'device' ? `${x.ip} · ${x.management} / ${x.compliance}` : type === 'resource' ? `${x.type} · ${x.zone} · ${x.ip}` : `${by('resource', x.resource).name} · ${x.groups.join(', ')}`; return `<button class="${state[scope].selected.type === type && state[scope].selected.id === x.id ? 'is-selected' : ''}" data-m02e-select="${scope}:${type}:${x.id}"><strong>${esc(x.name)}</strong><span>${esc(sub)}</span><i class="ri-arrow-right-line"></i></button>`; }).join('')}</section>`;
  }

  function consoleHtml(scope) {
    const tab = state[scope].tab;
    const body = tab === 'itsm' && scope === 'practice' ? practiceTicketPane()
      : tab === 'map' ? mapView(scope) : tab === 'activity' ? activityView(scope)
        : listingView(scope, tab === 'identities' ? 'user' : tab === 'devices' ? 'device' : tab === 'resources' ? 'resource' : 'policy');
    const guideSteps = CONSOLE_GUIDE_STEPS;
    const guideStep = scope === 'learn' ? state.learn.guideStep : -1;
    const guided = scope === 'learn' && guideStep >= 0 && guideStep < guideSteps.length;
    const guideDone = scope === 'learn' && guideStep >= CONSOLE_GUIDE_STEPS.length;
    const item = scope === 'learn' && guideStep >= 0 ? consoleGuideItem() : null;
    const tipDocked = guideTipCollapsed ?? guideDone;
    const tip = scope === 'learn' ? consoleGuideCard({ steps: guideSteps, step: guideStep, docked: tipDocked, prefix: 'm02e', item }) : '';
    const guideAvailable = state.learn.guideUnlocked || learnComplete() || state.learn.guideCompleted;
    const guideOpen = scope === 'learn' && guideStep < 0 ? consoleGuideStartButton({ prefix: 'm02e', available: guideAvailable, lockedLabel: 'Finish the lesson cards to start the Guided Lab' })
      : '';
    // Collapsed guide docks into the console header; expanded, it floats over the workspace.
    const headerTip = tipDocked ? tip : '';
    const workspaceTip = tipDocked ? '' : tip;
    const tabs = scope === 'practice' ? [...TABS, ['itsm', 'ITSM Ticket']] : TABS;
    return `<section class="m02e-console ${guided ? 'is-guided' : ''}" aria-label="Network and identity security console"><header><div><p>MISSION NEXT ENVIRONMENT</p><h2>NETWORK &amp; IDENTITY SECURITY</h2></div>${guideOpen}${headerTip}</header><nav>${tabs.map(([id, label]) => `<button class="${tab === id ? 'is-active' : ''}" data-m02e-tab="${scope}:${id}">${label}</button>`).join('')}</nav><div class="m02e-workspace">${workspaceTip}<div class="m02e-view">${body}</div>${tab === 'itsm' ? '' : drawer(scope)}</div></section>`;
  }

  function renderScope(scope) {
    const consoleEl = document.getElementById(`m02e-console-${scope}`);
    if (consoleEl) consoleEl.innerHTML = consoleHtml(scope);
    if (scope === 'learn') {
      const callout = document.getElementById('m02e-learn-callout');
      if (callout) callout.outerHTML = learnCallout();
      const knowledge = document.getElementById('m02e-knowledge');
      if (knowledge) knowledge.outerHTML = knowledgePanel();
      const activeCard = document.querySelector('.learn-it-card.is-active');
      activeCard?.parentElement.scrollTo({ left: activeCard.offsetLeft - activeCard.parentElement.offsetLeft - 8 });
      syncGuideGateNav();
      requestAnimationFrame(positionLearnTip);
    }
    if (scope === 'practice') {
      const panel = document.getElementById('m02e-practice-panel');
      if (panel) panel.outerHTML = practicePanel();
      wireLabGating('practice');
      syncGuideGateNav();
      requestAnimationFrame(positionPracticeTip);
    }
    if (scope === 'optional') {
      const panel = document.getElementById('m02e-optional-labs');
      if (panel) panel.outerHTML = optionalLabsPanel();
      wireLabGating('optional');
    }
  }

  function optionalLabsPanel() {
    return `<div id="m02e-optional-labs">${missionNextOptionalLabsSection(2, OPTIONAL_LAB_LINKS, state.labProgress)}</div>`;
  }

  // Rewires the [data-mn-lab-toggle]/[data-mn-lab-note] controls inside a
  // freshly (re)rendered Assessment Lab panel. Called after every render of
  // that panel, since outerHTML replacement destroys prior listeners. The
  // onChange callback just saves and re-renders that scope so the toggle
  // label/style and any downstream gate message stay current.
  function wireLabGating(scope) {
    const panelId = scope === 'practice' ? 'm02e-practice-panel' : 'm02e-optional-labs';
    const panel = document.getElementById(panelId);
    if (!panel) return;
    wireMissionNextLabGating(panel, state.labProgress, () => {
      save();
      renderScope(scope);
    });
  }

  // ------------------------------------------------------------- Guided Lab

  function learnComplete() { return state.learn.step >= LEARN_STEPS.length; }
  // A server-verified learner (e.g. on a new device) has no local guide state
  // but the rail already shows the Assessment Lab open; match it.
  function guidedLabsUnlocked() {
    return state.learn.guideCompleted || user?.remoteVerifiedModuleProgress?.['soc-02'] === true;
  }

  function syncGuideGateNav() {
    const sections = getNavSections().filter((section) => section.gated !== false);
    const current = sections.find((section) => !section.isComplete) || sections[sections.length - 1];
    sections.forEach((section) => {
      const chip = document.querySelector(`[data-mnav-chip-scroll="${section.scrollId}"]`);
      if (!chip) return;
      const locked = !section.isComplete && section !== current;
      chip.classList.remove('mnav-chip-complete', 'mnav-chip-current', 'mnav-chip-locked');
      chip.classList.add(section.isComplete ? 'mnav-chip-complete' : locked ? 'mnav-chip-locked' : 'mnav-chip-current');
      chip.setAttribute('aria-disabled', String(locked));
    });
    const percent = document.querySelector('.munified-percent');
    if (percent) percent.textContent = `${Math.round(sections.filter((section) => section.isComplete).length / sections.length * 100)}%`;
  }

  function applyGuideFocus() {
    if (state.learn.guideStep < 0 || state.learn.guideStep >= CONSOLE_GUIDE_STEPS.length) return;
    const step = CONSOLE_GUIDE_STEPS[state.learn.guideStep];
    state.learn.tab = step.tab;
    state.learn.selected = { type: step.target[0], id: step.target[1] };
    state.learn.opened = [...new Set([...(state.learn.opened || []), `${step.target[0]}:${step.target[1]}`])];
  }

  function consoleGuideItem() {
    const baseStep = CONSOLE_GUIDE_STEPS[Math.min(state.learn.guideStep, CONSOLE_GUIDE_STEPS.length - 1)];
    // step.target is the [type, id] console selection; the shared guide wants a CSS selector.
    const step = { ...baseStep, target: `[data-m02e-select="learn:${baseStep.target[0]}:${baseStep.target[1]}"]` };
    const { type, id } = state.learn.selected || {};
    if (state.learn.guideStep === 4 && type === 'resource') {
      const resource = by('resource', id);
      if (resource) return {
        ...step,
        title: `Resource: ${resource.name}`,
        body: `This ${resource.type.toLowerCase()} sits in the ${resource.zone} zone and holds ${resource.classification.toLowerCase()} data. Analysts compare its expected service and authorized group with the access request—not just whether the connection succeeded.`,
        lookFor: `${resource.name} · ${resource.ip}; ${resource.service}/${resource.transport} ${resource.port}; ${resource.internet === 'Yes' ? 'internet reachable' : 'not internet accessible'}; authorized group${resource.groups.length === 1 ? '' : 's'}: ${resource.groups.join(', ')}.`,
      };
    }
    if (state.learn.guideStep === 4 && type === 'policy') {
      const policy = by('policy', id);
      if (policy) return {
        ...step,
        title: `Access policy: ${policy.name}`,
        body: 'An access policy is the rule the system evaluates before granting the request. Check the protected resource, permitted groups, and every required condition; then compare them with the user, device, and activity evidence.',
        lookFor: `${by('resource', policy.resource).name} · groups ${policy.groups.join(', ')} · requirements ${policy.requirements.join(' + ')} · decision ${policy.decision}.`,
      };
    }
    return step;
  }

  function learnCallout() {
    const api = window.LearnItCards;
    return api.render({ deck: LEARN_STEPS, step: state.learn.step, viewed: learnView, done: learnComplete(), prefix: 'm02e', id: 'm02e-learn-callout', heading: 'Read a connection the way an analyst does', readyHeading: 'Ready to decode the signal?', doneHeading: 'Walkthrough complete', intro: 'Six original ideas introduce the analyst workflow, followed by targeted ideas for this module.', doneIntro: state.learn.guideCompleted ? 'The Guided Lab is ready below.' : 'All ideas are here to revisit. Continue to the Guided Lab below to inspect the evidence.', readyText: 'The signal is waiting. Start the walkthrough to reveal the first idea.', label: 'LEARN IT', countLabel: 'ideas', readyCountLabel: `${LEARN_STEPS.length} QUICK IDEAS`, completedLabel: 'WALKTHROUGH COMPLETE', progressCopy: ({ step, total }) => `${step} of ${total} ideas explored · finish the deck to open the Guided Lab below.`, slideLabel: 'Idea', readyActionLabel: 'LEARN IT', nextActionLabel: 'NEXT', finalActionLabel: 'Complete the walkthrough', restartLabel: 'Restart walkthrough', headingId: 'm02e-learn-copy-title', primaryClass: 'learn-it-primary', secondaryClass: 'learn-it-secondary' });
  }

  function decodeLearnText(element) {
    const finalText = element.textContent || '';
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !finalText) return;
    const alphabet = '░▒▓/\\<>01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const duration = 400;
    const startedAt = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const decoded = Math.floor(progress * finalText.length);
      element.textContent = [...finalText].map((char, index) => {
        if (index < decoded || char.trim() === '') return char;
        return alphabet[Math.floor(Math.random() * alphabet.length)];
      }).join('');
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = finalText;
    }
    element.textContent = '';
    requestAnimationFrame(frame);
  }

  function positionLearnTip() {
    const tip = document.getElementById('m02e-learn-tip');
    const workspace = tip?.closest('.m02e-workspace');
    consoleGuidePosition(tip, workspace, workspace?.querySelector('.m02e-view .is-selected'), { alignLeft: state.learn.tab === 'map' });
  }

  function positionPracticeTip() {
    const tip = document.getElementById('m02g-learn-tip');
    const workspace = tip?.closest('.m02e-workspace');
    consoleGuidePosition(tip, workspace, workspace?.querySelector('.m02e-view .is-selected'));
  }

  // Deep Dive: the reference panel under Learn It, as in M01 and M04–M12. The
  // concept cards and trust model come from soc-analyst-module-02.js.
  function deepDive() {
    const foundations = typeof MODULE_TWO_FOUNDATIONS !== 'undefined' ? MODULE_TWO_FOUNDATIONS : [];
    const trustModel = typeof moduleTwoTrustModel === 'function' ? moduleTwoTrustModel() : '';
    return `<details class="m02e-deep-dive mf-deep-dive"><summary>Deep Dive · identity and trust concepts</summary>
      <p class="m02-instruction">Open each concept for the analyst interpretation. The labs test how the ideas connect, not product menus or memorized definitions.</p>
      <div class="m02-foundation-grid">${foundations.map((item) => `<details class="m02-foundation">
        <summary><span class="m02-foundation-icon"><i class="${esc(item.icon)}" aria-hidden="true"></i></span><span><strong>${esc(item.title)}</strong><small>${esc(item.summary)}</small></span><i class="ri-arrow-down-s-line m02-chevron" aria-hidden="true"></i></summary>
        <p>${esc(item.detail)}</p>
      </details>`).join('')}</div>
      <div class="m02e-panel-heading"><div><p class="m02e-label">REUSABLE REASONING PATTERN</p><h3>The five-step trust model</h3></div></div>
      ${trustModel}
      <div class="m02-principle"><i class="ri-scales-3-line" aria-hidden="true"></i><p><strong>Analyst principle:</strong> "Outside the network" is not a verdict, and "inside the network" is not proof of trust. Combine identity, authentication, device, route, resource, and authorization evidence.</p></div>
      ${knowledgePanel()}
    </details>`;
  }

  function knowledgePanel() {
    const answers = state.learn.knowledgeAnswers;
    const answered = Object.keys(answers).length;
    const scored = state.learn.knowledgeScored;
    const correctCount = scored ? KNOWLEDGE_QUESTIONS.filter((q) => answers[q.id] === q.correct).length : 0;
    return `<div class="m02e-knowledge" id="m02e-knowledge"><div class="m02e-panel-heading"><div><p class="m02e-label">OPTIONAL · KNOWLEDGE CHECK</p><h3>Turn analyst observations into defensible findings</h3></div><span>${answered}/${KNOWLEDGE_QUESTIONS.length} answered</span></div>${KNOWLEDGE_QUESTIONS.map((q, i) => `<fieldset class="m02e-knowledge-question"><legend>${i + 1}. ${esc(q.prompt)}</legend>${q.options.map((opt) => `<label><input type="radio" name="m02e-knowledge-${esc(q.id)}" value="${esc(opt.id)}" data-m02e-knowledge-answer data-question-id="${esc(q.id)}" ${answers[q.id] === opt.id ? 'checked' : ''}> ${esc(opt.text)}</label>`).join('')}${scored ? `<p class="m02e-knowledge-feedback ${answers[q.id] === q.correct ? 'is-correct' : 'is-incorrect'}">${answers[q.id] === q.correct ? esc(q.correctMsg) : esc(q.incorrectMsg)}</p>` : ''}</fieldset>`).join('')}<button class="m02e-primary" type="button" data-m02e-knowledge-submit ${answered < KNOWLEDGE_QUESTIONS.length ? 'disabled' : ''}>Check my answers</button>${scored ? `<p class="m02e-knowledge-score">${correctCount}/${KNOWLEDGE_QUESTIONS.length} correct.</p>` : ''}</div>`;
  }

  // ---------------------------------------------------------- Assessment Lab

  function practicePanel() {
    if (!guidedLabsUnlocked()) return `<div class="m02e-practice-panel" id="m02e-practice-panel"><div class="m02e-practice-locked" role="status"><strong>The Assessment Lab unlocks after the Guided Lab.</strong><p>Complete the Learn It deck and Guided Lab console walkthrough to open the independent ITSM case.</p></div></div>`;
    return `<div class="m02e-practice-panel" id="m02e-practice-panel"><p class="m02e-label">ASSESSMENT LAB</p><p class="m02e-panel-instruction">Independently review the access records and policy, then submit the evidence-backed finding in the ITSM ticket for instructor review.</p><div class="m02e-console-wrap" id="m02e-console-practice">${consoleHtml('practice')}</div></div>`;
  }

  function practiceTicketPane() {
    const cr = state.practice.caseRecord;
    return `${caseRecordPane(cr, {
      ...caseSpec(cr.submitted === true),
      missing: caseRecordMissing(cr, caseSpec(false)),
      formId: 'm02e-practice-form',
      saveAttr: 'data-m02e-save-practice',
      submitAttr: 'data-m02e-submit-practice',
      panelId: 'm02e-practice-review',
      practiceSubmitted: false,
      reviewStatus: proveItReviewStatus(),
      redoRequested: proveItRedoRequested(),
      redoHtml: proveItRedoFeedback(),
      showMissing: state.practice.showMissing === true,
    })}${cr.submitted ? '<button type="button" class="m01-reset" data-m02e-restart-practice>Restart Assessment Lab</button>' : ''}`;
  }

  function restartPracticeLab() {
    state.practice.caseRecord = { ...CASE_DEFAULT, findings: {}, actionHistory: [] };
    state.practice.complete = false; state.practice.showMissing = false;
    state.practice.guideStep = 0; state.practice.guideDocked = false; state.practice.tab = 'itsm';
    state.practice.selected = { type: 'event', id: 'evt-john-hr-denied' };
    state.practice.opened = [];
    save(); renderScope('practice');
  }

  // ---------------------------------------------------------- Assessment Lab

  function submitProve() {
    const cr = state.practice.caseRecord;
    if (cr.submitted) return;
    const missing = caseRecordMissing(cr, caseSpec(false));
    if (missing.length) {
      state.practice.showMissing = true;
      save();
      renderScope('practice');
      return;
    }
    state.practice.showMissing = false;
    const performance = caseScore(cr);
    state.practice.complete = true;
    state.completed = true;
    cr.submitted = true;
    cr.actionHistory.push({ action: 'Submitted case for faculty review', at: new Date().toISOString() });

    const spec = caseSpec(true);
    // Instructor-facing payload (docs/LAB_ASSESSMENT_STANDARD.md /
    // CASE_RECORD_MIGRATION.md #4): the shared case-record ticket shape, plus
    // `access_review` so adminModuleTwoAccessReviewPanel() (app.js) keeps
    // rendering this module's own review panel too.
    const result = {
      breakdown: performance.breakdown,
      feedback: performance.feedback,
      critical_errors: performance.criticalErrors,
      case_record: cr,
      case_display: caseRecordDisplay(cr, spec),
      case_summary: caseRecordSummary(cr, spec),
      access_review: { selectedEvent: `${CASE_ID} ITSM Incident Ticket`, decision: 'Submitted for review', evidenceReferenced: [], analystNote: cr.notes },
    };

    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(user, LAB_KEY, { state: 'complete', score: performance.score, result }).then((saved) => {
        if (saved && proveItRedoRequested()) delete user.openLabRedosByModuleKey['soc-02'];
      });
    }
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'soc-analyst', 'soc-02', LAB_KEY);
    save();
    renderScope('practice');
  }

  // ------------------------------------------------------------------- Shell

  function getNavSections() {
    return [
      { id: 'learn', title: 'Learn It', type: 'lecture', phase: 'learn', isComplete: learnComplete(), scrollId: 'm02e-learn' },
      { id: 'guided-lab', title: 'Guided Lab', type: 'lab', phase: 'practice', isComplete: state.learn.guideCompleted, scrollId: 'm02e-guided-lab' },
      { id: 'prove', title: 'Assessment Lab', type: 'review', phase: 'prove', isComplete: state.practice.complete || Boolean(user?.remoteVerifiedModuleProgress?.['soc-02']), scrollId: 'm02e-practice' },
      { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm02e-sources', gated: false, supplemental: true },
    ];
  }

  function view(u, program) {
    load(u);
    const module = program?.modules?.['soc-02'] || {};
    return `<div class="m01-shell m02e-shell">
      ${moduleTopbar(u, program)}
      <div class="mquick-nav-layout">
        ${moduleUnifiedNav(getNavSections(), { moduleKey: 'm02', reviewMode })}
        <main class="m01-main m02e-main">
          <section class="m01-hero m02e-hero" aria-labelledby="m02e-title"><div>
            <p class="m01-kicker">MODULE 02 · ${esc(module.hours || '')} · Week 1 foundations</p>
            <h1 id="m02e-title">Network, Identity & Security Foundations</h1>
            <p class="m01-lede">Trace a connection from identity and device to resource and policy in one console. Authentication confirms identity; authorization decides what that identity may access.</p>
          </div></section>

          <details class="m01-section m02e-section m02e-section-collapsible" id="m02e-learn" open aria-labelledby="m02e-learn-title">
            <summary class="m01-section-heading"><span>1</span><div><p class="m01-kicker">Learn It · Foundations</p><h2 id="m02e-learn-title">Read a connection the way an analyst does</h2></div></summary>
            ${learnCallout()}
            ${deepDive()}
          </details>

          <details class="m01-section m02e-section m02e-section-collapsible" id="m02e-guided-lab" open aria-labelledby="m02e-guided-lab-title">
            <summary class="m01-section-heading"><span>2</span><div><p class="m01-kicker">Practice It · Guided Lab</p><h2 id="m02e-guided-lab-title">Read Alice’s access activity</h2></div></summary>
            <p class="m02e-panel-instruction">Follow the console guide to inspect Alice Morgan’s 08:14 access record, then connect its identity, device, resource, and policy details.</p>
            <div class="m02e-console-wrap" id="m02e-console-learn">${consoleHtml('learn')}</div>
          </details>

          <details class="m01-section m02e-section m02e-section-collapsible" id="m02e-practice" data-authored-assessment="soc-02" open aria-labelledby="m02e-practice-title">
            <summary class="m01-section-heading"><span>3</span><div><p class="m01-kicker">Prove It · Assessment Lab</p><h2 id="m02e-practice-title">Investigate HR file authorization</h2></div></summary>
            ${practicePanel()}
          </details>


          ${optionalLabsPanel()}

          <details class="m01-section m01-section-supplemental m02e-section m02e-section-collapsible" id="m02e-sources" open aria-labelledby="m02e-sources-title">
            <summary class="m01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m01-kicker">Reference — not a graded step</p><h2 id="m02e-sources-title">Sources &amp; Further Reading</h2></div></summary>
            ${moduleSourcesBlock(SOURCES)}
          </details>
        </main>
      </div>
    </div>`;
  }

  function wire() {
    const root = document.querySelector('.m02e-shell');
    if (!root) return;

    wireLabGating('practice');
    wireLabGating('optional');

    wireReviewToggle({
      button: document.querySelector('[data-mnav-review-toggle]'),
      sectionSelector: '.m02e-section',
      getReviewMode: () => reviewMode,
      setReviewMode: (value) => { reviewMode = value; },
      enabledLabel: 'Exit Review', disabledLabel: 'Review Module',
      enabledIcon: 'ri-eye-off-line', disabledIcon: 'ri-eye-line',
    });

    window.LearnItCards.wire(root, { prefix: 'm02e', onStep(nextStep, action) {
      if (action === 'restart') { state.learn.step = 0; state.learn.guideStep = -1; }
      else {
        state.learn.step = nextStep;
        if (nextStep >= LEARN_STEPS.length) state.learn.guideUnlocked = true;
        const item = LEARN_STEPS[Math.min(Math.max(0, nextStep - 1), LEARN_STEPS.length - 1)];
        if (item?.tab && Array.isArray(item.target)) { state.learn.tab = item.tab; state.learn.selected = { type: item.target[0], id: item.target[1] }; }
      }
      learnView = null; save(); renderScope('learn');
    }, onView(index) {
      learnView = index === Math.max(0, state.learn.step - 1) && !learnComplete() ? null : index;
      renderScope('learn'); document.querySelector(`[data-m02e-learn-view="${index}"]`)?.focus();
    }, onDecode: decodeLearnText });

    root.onclick = (ev) => {
      const button = ev.target.closest('button,[data-m02e-select]');
      if (!button) return;
      const select = button.dataset.m02eSelect;
      if (select) { const [scope, type, id] = select.split(':'); setEntity(scope, type, id); return; }
      const tab = button.dataset.m02eTab;
      if (tab) { const [scope, tabId] = tab.split(':'); setTab(scope, tabId); return; }
      if (button.hasAttribute('data-m02e-submit-practice')) { submitProve(); return; }
      if (button.hasAttribute('data-m02e-restart-practice')) {
        restartPracticeLab(); return;
      }
      if (button.hasAttribute('data-m02e-guide-open')) {
        if (!state.learn.guideUnlocked && !learnComplete() && !state.learn.guideCompleted) return;
        state.learn.guideStep = 0;
        guideTipCollapsed = null;
        applyGuideFocus(); save(); renderScope('learn'); return;
      }
      if (button.hasAttribute('data-m02e-guide-collapse')) {
        guideTipCollapsed = !(guideTipCollapsed ?? state.learn.guideStep >= CONSOLE_GUIDE_STEPS.length);
        renderScope('learn');
        document.querySelector('#m02e-learn-tip [data-m02e-guide-collapse]')?.focus();
        return;
      }
      if (button.hasAttribute('data-m02e-guide-next')) {
        if ((!state.learn.guideUnlocked && !learnComplete() && !state.learn.guideCompleted) || state.learn.guideStep < 0) return;
        state.learn.guideStep = state.learn.guideStep >= CONSOLE_GUIDE_STEPS.length ? 0 : state.learn.guideStep + 1;
        if (state.learn.guideStep === CONSOLE_GUIDE_STEPS.length) state.learn.guideCompleted = true;
        guideTipCollapsed = null;
        applyGuideFocus(); save(); renderScope('learn');
        if (state.learn.guideCompleted) renderScope('practice');
        return;
      }
      if (button.hasAttribute('data-m02e-knowledge-submit')) { state.learn.knowledgeScored = true; save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-save-practice')) {
        state.practice.caseRecord.actionHistory.push({ action: 'Updated ticket', at: new Date().toISOString() });
        save(); renderScope('practice'); return;
      }
    };

    root.onchange = (ev) => {
      const t = ev.target;
      if (t.matches('[data-m02e-knowledge-answer]')) { state.learn.knowledgeAnswers[t.dataset.questionId] = t.value; state.learn.knowledgeScored = false; save(); renderScope('learn'); return; }
      const form = ev.target.closest('#m02e-practice-form');
      const cr = state.practice.caseRecord;
      if (form && t.name && caseRecordApply(cr, t.name, t.value)) {
        cr.actionHistory.push({ action: `Updated ${t.name}`, at: new Date().toISOString() });
        save(); renderScope('practice'); return;
      }
    };
    root.oninput = (ev) => {
      const form = ev.target.closest('#m02e-practice-form');
      if (form && ev.target.tagName === 'TEXTAREA' && ev.target.name) {
        caseRecordApply(state.practice.caseRecord, ev.target.name, ev.target.value);
        save(); return;
      }
    };
    root.onsubmit = (ev) => {
      if (ev.target.id === 'm02e-practice-form') ev.preventDefault();
    };
    requestAnimationFrame(positionLearnTip);
    requestAnimationFrame(positionPracticeTip);
    window.addEventListener('resize', positionLearnTip);
    window.addEventListener('resize', positionPracticeTip);
  }

  registerModuleLab({ program: 'soc-analyst', moduleNumber: 2, moduleKey: 'soc-02', view, wire, sections: getNavSections });
}());

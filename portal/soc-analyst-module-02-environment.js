/* Module 02 environment. Fictional, vendor-neutral, and intentionally bounded.
 * It reuses the registered-module contract, LabRuntime, and existing assessment
 * record rather than changing portal routing, authentication, or progress.
 *
 * Rebuilt per MODULE_02_REDESIGN_CORRECTION_BRIEF.md: Learn It / Practice It /
 * Prove It are numbered, scroll-targeted sections inside the shared module
 * shell (moduleUnifiedNav + .mquick-nav-layout, same as Module 01). The
 * shared left rail is the only Learn/Practice/Prove navigator — this file
 * must never render a second phase rail, a set of phase tabs, or a stateful
 * "quiz" panel competing with the console for width. Learn It stays in the
 * module for in-context coaching, using its own Network & Identity Security
 * console. Practice It (Guided Lab) and Prove It (Assessment Lab) instead
 * launch imported Mission Next labs (portal/imported-labs/mission-next-labs/) in a
 * new tab, with an inline notes/write-up panel here for local completion
 * tracking and instructor review.
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
      { id: 'wk17', name: 'WKSTN-17', ip: '10.20.4.22', user: 'alice', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk23', name: 'WKSTN-23', ip: '10.20.4.31', user: 'john', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk31', name: 'WKSTN-31', ip: '10.20.4.38', user: 'ravi', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
      { id: 'wk09', name: 'WKSTN-09', ip: '10.20.4.09', user: 'cora', status: 'Online', management: 'Unmanaged', compliance: 'Non-compliant', network: 'Guest Wi-Fi' },
      { id: 'wk44', name: 'WKSTN-44', ip: '10.20.4.44', user: 'helen', status: 'Online', management: 'Managed', compliance: 'Compliant', network: 'Corporate LAN' },
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
    ],
  };

  const TABS = [['map', 'Network Map'], ['activity', 'Access Activity'], ['identities', 'Identities'], ['devices', 'Devices'], ['resources', 'Resources'], ['policies', 'Policies']];

  // Each entry: title, teaching body, console tab to switch to, and the
  // entity the walkthrough automatically highlights and opens in the drawer.
  // The walkthrough is deliberately a bridge into the four Mission Next labs
  // used by this module. Each step names the analyst move and the evidence
  // that move produces, so the console example is not a disconnected demo.
  const LEARN_STEPS = [
    { title: 'The analyst toolkit', body: 'Throughout your career as a SOC Analyst, you will encounter a variety of technologies, constantly changing to keep up with the fast-paced world of Cybersecurity.', tab: 'map', target: ['device', 'wk17'] },
    { title: 'Keep learning', body: 'New threats emerge every day.', tab: 'activity', target: ['event', 'evt-alice-finance'] },
    { title: 'Adapt to the evidence', body: 'That requires practitioners to constantly learn how to use different terminals, monitoring dashboards, or possibly reading coding or scripting languages to understand what a specific malicious software is doing, and get familiarized with different interfaces you may encounter in your career.', tab: 'identities', target: ['user', 'alice'] },
    { title: 'The core idea', body: 'Regardless, the concept is the same.', tab: 'devices', target: ['device', 'wk17'] },
    { title: 'Create the signal', body: 'A level 1 Security Operations Center Analyst is creating scheduled queries to generate alerts out of logs that are recorded in all of these different technologies and gathered together into a Security Information Event Management System.', tab: 'resources', target: ['resource', 'finance'] },
    { title: 'Connect the clues', body: 'These alerts are correlated using more targeted queries, machine learning, and artificial intelligence now more than ever, to piece together what attacks are happening within the environment.', tab: 'policies', target: ['policy', 'finance-policy'] },
  ];

  // Independent, item-specific explanations for the console walkthrough.
  const CONSOLE_GUIDE_STEPS = [
    { title: 'Frame the review', body: 'The console is a working environment, not a quiz. Start with the analyst questions that remain useful in any tool: who acted, what they tried to reach, when and where it happened, why it may be expected, and how the request was evaluated.', lookFor: 'WKSTN-17, its connection path, and the requested destination.', lab: 'All four labs use this same evidence-first habit.', tab: 'map', target: ['device', 'wk17'] },
    { title: 'Trace the network path', body: 'A network map shows the systems, zones, and boundaries a request crosses. Use it to check whether the source can reach the destination over the expected service—and whether that route is intentional.', lookFor: 'The source workstation, the boundary, and FINANCE-FILE-01.', lab: 'Guided · Basic Network Security Assessment', tab: 'map', target: ['resource', 'finance'] },
    { title: 'Read the activity record', body: 'An activity row gives you the facts behind an alert: identity, device, time, destination, service, and result. Establish those facts before deciding whether the access is normal or suspicious.', lookFor: 'Alice’s 08:14 access record and its full details.', lab: 'Assessment · Active Directory Logs and Insights', tab: 'activity', target: ['event', 'evt-alice-finance'] },
    { title: 'Validate identity and device', body: 'A successful sign-in proves only that authentication passed. It does not prove the user was authorized or that their device met security requirements. Compare the identity’s role and groups with the device’s trust state.', lookFor: 'Alice’s Finance-Read group and WKSTN-17’s managed, compliant state.', lab: 'Guided · User Account Security Assessment', tab: 'identities', target: ['user', 'alice'] },
    { title: 'Understand the resource and policy', body: 'A resource is the system or data being protected. Its classification and expected service tell you what is at stake; its access policy defines which groups and conditions are allowed. Compare both with the actual request.', lookFor: 'FINANCE-FILE-01’s Confidential classification, SMB/TCP 445 service, authorized group, and access policy.', lab: 'Assessment · Web Application Security Assessment', tab: 'resources', target: ['resource', 'finance'] },
    { title: 'Correlate before concluding', body: 'No single field tells the whole story. Correlate the access record with the identity, device, network path, resource, and policy. Then separate what the evidence proves from what still needs investigation.', lookFor: 'Alice’s ALLOWED result, then the identity, device, and policy behind it.', lab: 'Guided + assessment lab handoff', tab: 'activity', target: ['event', 'evt-alice-finance'] },
  ];

  // Facts the console cannot demonstrate well on its own.
  const KNOWLEDGE_QUESTIONS = [
    { id: 'protocol', prompt: 'A resource’s expected access is listed as "SMB / TCP 445." What does TCP represent?', options: [{ id: 'a', text: 'The transport protocol carrying the connection' }, { id: 'b', text: 'The application service' }, { id: 'c', text: 'The destination IP address' }, { id: 'd', text: 'The security zone' }], correct: 'a', correctMsg: 'Correct. SMB is the service, TCP is the transport protocol, and 445 is the port.', incorrectMsg: 'SMB names the service and 445 is the port. TCP is the transport protocol connecting them.' },
    { id: 'correlation', prompt: 'The AD/Splunk lab shows a burst of failed logons for one account. What is the strongest next move?', options: [{ id: 'a', text: 'Correlate the user, source, device, timing, lockout state, and expected baseline' }, { id: 'b', text: 'Declare compromise from the count alone' }, { id: 'c', text: 'Ignore it because every failure is harmless' }, { id: 'd', text: 'Block every account in the directory' }], correct: 'a', correctMsg: 'Correct. The event pattern is a lead; correlation establishes scope and whether it fits expected behavior.', incorrectMsg: 'A burst is a lead, not a verdict. Correlate identity, source, device, timing, lockout state, and baseline.' },
    { id: 'authorization', prompt: 'The account lab finds a user in an administrative group. What makes that a security finding?', options: [{ id: 'a', text: 'The privilege exceeds the documented job need or approved scope' }, { id: 'b', text: 'The user authenticated successfully' }, { id: 'c', text: 'The group name contains the word admin' }, { id: 'd', text: 'The account exists in the directory' }], correct: 'a', correctMsg: 'Correct. The finding is the mismatch between granted privilege and approved job need or scope.', incorrectMsg: 'Authentication and a group label are not enough. Compare the granted privilege with documented job need and approval.' },
  ];

  // Imported Mission Next training labs (portal/imported-labs/mission-next-labs/),
  // wired in place of the bespoke HR-FILE-01 case simulation. Each opens the
  // static imported app on this page; its Back button returns through browser
  // history to the module that launched it.
  const GUIDED_LAB_LINKS = [
    { title: 'Basic Network Security Assessment', detail: 'Network configuration review for beginner-level weaknesses', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-1/lab', labId: 'guided-1', requireNote: true },
    { title: 'User Account Security Assessment', detail: 'User permissions and account-activity review', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-5/lab', labId: 'guided-2', requireNote: true },
  ];
  const ASSESSMENT_LAB_LINKS = [
    { title: 'Active Directory Logs and Insights', detail: 'Independent AD log review using real Linux CLI tools', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-2/lab', labId: 'assessment-1', requireNote: true },
    { title: 'Web Application Security Assessment', detail: 'Web application identity and access flaws', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-3/lab', labId: 'assessment-2', requireNote: true },
  ];
  const ASSESSMENT_MIN_NOTE_LENGTH = 80;

  const SOURCES = [
    { title: 'Zero Trust Architecture (SP 800-207)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/207/final', note: 'Comprehensive guide to assuming no inherent trust and evaluating each request on identity, device, location, and risk.' },
    { title: 'Introduction to Public Key Technology and the Federal PKI Infrastructure (SP 800-32)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/32/final', note: 'Certificate and PKI fundamentals: subject, issuer, intended use, and validation.' },
    { title: 'Digital Identity Guidelines: Authentication and Authenticator Management (SP 800-63B-4)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final', note: 'Digital identity guidelines covering authentication methods, MFA, and credential management.' },
    { title: 'Authorization Cheat Sheet', org: 'OWASP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html', note: 'Design and implementation patterns for access control and privilege management.' },
    { title: 'Security+ public domain overview (supplementary draft reference)', org: 'CompTIA', url: 'https://www.comptia.org/certifications/security', note: 'Supplementary public reference only. Not an approval, affiliation, endorsement, or pass guarantee.' },
  ];

  const DEFAULT = {
    learn: { walkthroughVersion: 3, guideFlowVersion: 1, step: 0, guideStep: -1, guideUnlocked: false, guideCompleted: false, tab: 'map', selected: { type: 'device', id: 'wk17' }, opened: [], knowledgeAnswers: {}, knowledgeScored: false },
    practice: { notes: '', complete: false, gateMessage: '' },
    prove: { notes: '', submitted: false, attempts: 0, feedback: [], lastSubmittedAt: '' },
    completed: false,
    labProgress: {},
  };

  let state, user, reviewMode = false;

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
    user = u;
    // Module state must survive switching between localhost and GitHub Pages,
    // whose browser storage is origin-specific. Keep localStorage as the fast
    // working copy, while hydrating an empty copy from Supabase and writing
    // changes through the shared module_progress case_state path.
    state = LabRuntime.loadCaseState(LAB_ID, 'soc-02', u, DEFAULT);
    // Migrate the earlier shared-ID record without allowing it to collide
    // with the main Module 02 state going forward.
    if (!state.learn && !state.practice && !state.prove) {
      const legacy = LabRuntime.loadCaseState('m02-trust-path-review-v1', 'soc-02', u, DEFAULT);
      if (legacy.learn || legacy.practice || legacy.prove) {
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
    state.learn = normalizeScope(state.learn, DEFAULT.learn);
    // Once a learner has ever reached the end of the six ideas, the console
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
    // Practice It / Prove It are now imported-lab launch panels with a
    // write-up, not entity-selection scopes, so they merge flat against their
    // own defaults instead of going through normalizeScope's console shape.
    state.practice = { ...DEFAULT.practice, ...(state.practice && typeof state.practice === 'object' ? state.practice : {}) };
    state.prove = { ...DEFAULT.prove, ...(state.prove && typeof state.prove === 'object' ? state.prove : {}) };
    if (!Array.isArray(state.prove.feedback)) state.prove.feedback = [];
    if (typeof state.practice.notes !== 'string') state.practice.notes = '';
    if (typeof state.prove.notes !== 'string') state.prove.notes = '';
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

  function mapView(scope) {
    const e = selectedEvent(scope), x = entity(e);
    const label = (text) => scope === 'learn' && TERM_DEFINITIONS[text] ? learnTerm(text) : text;
    const node = (type, id, label, sub) => `<button class="m02e-node ${state[scope].selected.type === type && state[scope].selected.id === id ? 'is-selected' : ''}" data-m02e-select="${scope}:${type}:${id}"><strong>${esc(label)}</strong><small>${esc(sub)}</small></button>`;
    return `<section class="m02e-map"><div class="m02e-zone internet">INTERNET</div><div class="m02e-boundary ${state[scope].selected.type === 'policy' && state[scope].selected.id === e.policy ? 'is-selected' : ''}" data-m02e-select="${scope}:policy:${e.policy}"><i class="ri-shield-check-line"></i> FIREWALL / ${label('Access policy')}</div><div class="m02e-topology"><div class="m02e-zone dmz"><span>${label('DMZ')}</span>${node('resource', 'web', 'WEB-01', '10.20.2.15 · HTTPS')}</div><div class="m02e-zone internal"><span>INTERNAL</span><div class="m02e-map-columns"><div><em>WORKSTATIONS</em>${DATA.devices.map((d) => node('device', d.id, d.name, d.ip)).join('')}</div><div><em>${label('Servers & Resources')}</em>${DATA.resources.filter((r) => r.id !== 'web').map((r) => node('resource', r.id, r.name, `${r.ip} · ${r.service}`)).join('')}</div></div></div></div><div class="m02e-connection"><span>${esc(x.device.name)} · ${esc(x.device.ip)}</span><b>${esc(x.resource.service)} / ${esc(x.resource.transport)} ${esc(x.resource.port)}</b><span>${esc(x.resource.name)} · ${esc(x.resource.ip)}</span></div><div class="m02e-identities"><em>IDENTITIES</em>${DATA.users.map((u) => node('user', u.id, u.name, u.groups.join(', '))).join('')}</div></section>`;
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
    const body = tab === 'map' ? mapView(scope) : tab === 'activity' ? activityView(scope) : listingView(scope, tab === 'identities' ? 'user' : tab === 'devices' ? 'device' : tab === 'resources' ? 'resource' : 'policy');
    const guideStep = scope === 'learn' ? state.learn.guideStep : -1;
    const guided = guideStep >= 0 && guideStep < CONSOLE_GUIDE_STEPS.length;
    const guideDone = guideStep >= CONSOLE_GUIDE_STEPS.length;
    const item = guideStep >= 0 ? consoleGuideItem() : null;
    const tip = guideStep >= 0 ? `<aside class="m02e-learn-tip${guideDone ? ' is-complete' : ''}" id="m02e-learn-tip" aria-labelledby="m02e-guide-title"><span class="m02e-label">${guideDone ? 'CONSOLE GUIDE · COMPLETE' : `CONSOLE GUIDE · STEP ${guideStep + 1} OF ${CONSOLE_GUIDE_STEPS.length}`}</span><h3 id="m02e-guide-title">${esc(item.title)}</h3>${guideDone ? '<p>You can keep exploring the console, or revisit the explanations from the main Learn It card.</p>' : `<p>${esc(item.body)}</p><p class="m02e-guide-look"><strong>Look for:</strong> ${esc(item.lookFor)}</p><p class="m02e-guide-lab"><strong>Lab connection:</strong> ${esc(item.lab)}</p>`}<button class="m02e-guide-next" type="button" data-m02e-guide-next>${guideDone ? 'Restart console guide' : guideStep === CONSOLE_GUIDE_STEPS.length - 1 ? 'Finish guide' : 'Next explanation'} <i class="ri-arrow-right-line" aria-hidden="true"></i></button></aside>` : '';
    const guideAvailable = state.learn.guideUnlocked || learnComplete() || state.learn.guideCompleted;
    const guideOpen = scope === 'learn' && guideStep < 0 ? `<button class="m02e-guide-open" type="button" data-m02e-guide-open${guideAvailable ? '' : ' disabled'}>${guideAvailable ? 'Open console guide' : 'Finish six ideas to open guide'}</button>` : '';
    return `<section class="m02e-console ${guided ? 'is-guided' : ''}" aria-label="Network and identity security console"><header><div><p>MISSION NEXT ENVIRONMENT</p><h2>NETWORK &amp; IDENTITY SECURITY</h2></div>${guideOpen}</header><nav>${TABS.map(([id, label]) => `<button class="${tab === id ? 'is-active' : ''}" data-m02e-tab="${scope}:${id}">${label}</button>`).join('')}</nav><div class="m02e-workspace">${tip}<div class="m02e-view">${body}</div>${drawer(scope)}</div></section>`;
  }

  function renderScope(scope, { animateLearn = false } = {}) {
    const consoleEl = document.getElementById(`m02e-console-${scope}`);
    if (consoleEl) consoleEl.innerHTML = consoleHtml(scope);
    if (scope === 'learn') {
      const callout = document.getElementById('m02e-learn-callout');
      if (callout) callout.outerHTML = learnCallout();
      const knowledge = document.getElementById('m02e-knowledge');
      if (knowledge) knowledge.outerHTML = knowledgePanel();
      if (animateLearn) document.querySelectorAll('.m02e-learn-line.is-new [data-m02e-decode-text]').forEach(decodeLearnText);
      syncGuideGateNav();
      requestAnimationFrame(positionLearnTip);
    }
    if (scope === 'practice') {
      const panel = document.getElementById('m02e-practice-panel');
      if (panel) panel.outerHTML = practicePanel();
      wireLabGating('practice');
      syncGuideGateNav();
    }
    if (scope === 'prove') {
      const panel = document.getElementById('m02e-prove-panel');
      if (panel) panel.outerHTML = provePanel();
      wireLabGating('prove');
      syncGuideGateNav();
    }
  }

  // Rewires the [data-mn-lab-toggle]/[data-mn-lab-note] controls inside a
  // freshly (re)rendered practice/prove panel. Called after every render of
  // that panel, since outerHTML replacement destroys prior listeners. The
  // onChange callback just saves and re-renders that scope so the toggle
  // label/style and any downstream gate message stay current.
  function additionalPanelHtml() {
    return `<div class="m02e-additional-panel" id="m02e-additional-panel">${missionNextLabLaunchGroup(2, 'additional', [
      { title: 'File System Security Assessment', detail: 'Filesystem permissions and access review', href: 'imported-labs/mission-next-labs/index.html#/track/security-assessments/project/sa-2/lab', labId: 'additional-sa2', requireNote: true },
    ], state.labProgress)}</div>`;
  }

  function renderAdditionalPanel() {
    const panel = document.getElementById('m02e-additional-panel');
    if (panel) panel.outerHTML = additionalPanelHtml();
    wireLabGating('additional');
  }

  function wireLabGating(scope) {
    const panelId = scope === 'practice' ? 'm02e-practice-panel' : scope === 'prove' ? 'm02e-prove-panel' : 'm02e-additional-panel';
    const panel = document.getElementById(panelId);
    if (!panel) return;
    wireMissionNextLabGating(panel, state.labProgress, () => {
      save();
      if (scope === 'additional') { renderAdditionalPanel(); return; }
      renderScope(scope);
    });
  }

  // ---------------------------------------------------------------- Learn It

  function learnComplete() { return state.learn.step >= LEARN_STEPS.length; }
  function guidedLabsUnlocked() {
    return state.learn.guideCompleted || state.practice.complete || ['guided-1', 'guided-2'].some((id) => state.labProgress[id]?.complete);
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
    const step = CONSOLE_GUIDE_STEPS[Math.min(state.learn.guideStep, CONSOLE_GUIDE_STEPS.length - 1)];
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
    const step = Math.max(0, Math.min(state.learn.step - 1, LEARN_STEPS.length - 1));
    const done = learnComplete();
    const visibleSteps = LEARN_STEPS.slice(0, state.learn.step);
    const stepLines = visibleSteps.map((item, index) => {
      const isNew = !done && index === state.learn.step - 1;
      const body = isNew
        ? `<span class="m02e-decode-visual" data-m02e-decode-text aria-hidden="true">${esc(item.body)}</span><span class="m02e-sr-only">${esc(item.body)}</span>`
        : esc(item.body);
      return `<div class="m02e-learn-line${isNew ? ' is-new' : ''}"${isNew ? ' aria-current="step"' : ''}><span class="m02e-learn-line-index">${String(index + 1).padStart(2, '0')}</span><div><h3>${esc(item.title)}</h3><p>${body}</p></div></div>`;
    }).join('');
    const heading = done ? 'Walkthrough complete' : state.learn.step === 0 ? 'Ready to decode the signal?' : 'How a SOC analyst turns noise into signal';
    const intro = done
      ? state.learn.guideCompleted ? 'The console guide is complete. Your Guided Labs are available below.' : 'All six ideas are here to revisit. Open the console guide below to inspect the evidence.'
      : state.learn.step === 0 ? 'Six ideas will build into one analyst workflow as you move through the console.' : `${state.learn.step} of ${LEARN_STEPS.length} ideas decoded · finish all six to open the console guide below.`;
    const label = done ? 'LEARN IT · WALKTHROUGH COMPLETE' : state.learn.step === 0 ? 'LEARN IT · SIX QUICK IDEAS' : `LEARN IT · STEP ${state.learn.step} OF ${LEARN_STEPS.length} · ${esc(LEARN_STEPS[step].title)}`;
    const action = done
      ? '<button class="m02e-secondary" type="button" data-m02e-learn-restart><i class="ri-restart-line" aria-hidden="true"></i> Restart walkthrough</button>'
      : `<button class="m02e-primary" type="button" data-m02e-learn-next>${state.learn.step === 0 ? 'LEARN IT' : step === LEARN_STEPS.length - 1 ? 'Complete the walkthrough' : 'NEXT'} <i class="ri-arrow-right-line" aria-hidden="true"></i></button>`;
    return `<section class="m02e-callout${done ? ' is-done' : ''}" id="m02e-learn-callout" aria-labelledby="m02e-learn-copy-title"><div class="m02e-learn-heading"><div><p class="m02e-label">${label}</p><h3 id="m02e-learn-copy-title">${heading}</h3><p>${intro}</p></div><div class="m02e-learn-actions">${action}</div></div><div class="m02e-learn-canvas" aria-live="polite">${stepLines || '<p class="m02e-learn-placeholder">The signal is waiting. Start the walkthrough to reveal the first idea.</p>'}</div><div class="m02e-learn-scan" aria-hidden="true"><span style="width:${(state.learn.step / LEARN_STEPS.length) * 100}%"></span></div></section>`;
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
    if (!tip) return;
    const workspace = tip.closest('.m02e-workspace');
    const target = workspace?.querySelector('.m02e-view .is-selected');
    if (!workspace) return;
    if (!target) {
      tip.style.top = '8px';
      tip.style.left = '8px';
      tip.classList.remove('points-down');
      requestAnimationFrame(() => tip.classList.add('is-visible'));
      return;
    }
    const workspaceRect = workspace.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    tip.classList.remove('is-visible', 'points-down');
    const tipRect = tip.getBoundingClientRect();
    let top = targetRect.top - workspaceRect.top - tipRect.height - 12;
    let pointsDown = false;
    if (top < 8) { top = targetRect.bottom - workspaceRect.top + 12; pointsDown = true; }
    top = Math.min(top, Math.max(8, workspaceRect.height - tipRect.height - 8));
    let left = state.learn.tab === 'map'
      ? 8
      : targetRect.left - workspaceRect.left + targetRect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, workspaceRect.width - tipRect.width - 8));
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.classList.toggle('points-down', pointsDown);
    requestAnimationFrame(() => tip.classList.add('is-visible'));
  }

  function knowledgePanel() {
    const answers = state.learn.knowledgeAnswers;
    const answered = Object.keys(answers).length;
    const scored = state.learn.knowledgeScored;
    const correctCount = scored ? KNOWLEDGE_QUESTIONS.filter((q) => answers[q.id] === q.correct).length : 0;
    return `<div class="m02e-knowledge" id="m02e-knowledge"><div class="m02e-panel-heading"><div><p class="m02e-label">OPTIONAL · KNOWLEDGE CHECK</p><h3>Turn analyst observations into defensible findings</h3></div><span>${answered}/${KNOWLEDGE_QUESTIONS.length} answered</span></div>${KNOWLEDGE_QUESTIONS.map((q, i) => `<fieldset class="m02e-knowledge-question"><legend>${i + 1}. ${esc(q.prompt)}</legend>${q.options.map((opt) => `<label><input type="radio" name="m02e-knowledge-${esc(q.id)}" value="${esc(opt.id)}" data-m02e-knowledge-answer data-question-id="${esc(q.id)}" ${answers[q.id] === opt.id ? 'checked' : ''}> ${esc(opt.text)}</label>`).join('')}${scored ? `<p class="m02e-knowledge-feedback ${answers[q.id] === q.correct ? 'is-correct' : 'is-incorrect'}">${answers[q.id] === q.correct ? esc(q.correctMsg) : esc(q.incorrectMsg)}</p>` : ''}</fieldset>`).join('')}<button class="m02e-primary" type="button" data-m02e-knowledge-submit ${answered < KNOWLEDGE_QUESTIONS.length ? 'disabled' : ''}>Check my answers</button>${scored ? `<p class="m02e-knowledge-score">${correctCount}/${KNOWLEDGE_QUESTIONS.length} correct.</p>` : ''}</div>`;
  }

  // ------------------------------------------------------------- Practice It

  function practicePanel() {
    const p = state.practice;
    if (!guidedLabsUnlocked()) return '<div class="m02e-practice-panel" id="m02e-practice-panel"><div class="m02e-practice-locked" role="status"><strong>Guided Labs unlock after the console guide.</strong><p>Reveal all six Learn It ideas, open the console guide, then finish its six explanations to start these labs.</p></div></div>';
    const gateOk = missionNextAllLabsComplete(state.labProgress, ['guided-1', 'guided-2']);
    const gateMsg = p.gateMessage && !gateOk ? `<p class="m02e-gate-message" role="alert">${esc(p.gateMessage)}</p>` : '';
    return `<div class="m02e-practice-panel" id="m02e-practice-panel"><p class="m02e-label">GUIDED LAB</p><p class="m02e-panel-instruction">Work through both imported security-assessment projects below; each opens on this page with its own guided tasks. Mark each lab complete with a short note, then mark the Guided Lab complete overall.</p>${missionNextLabLaunchGroup(2, 'guided', GUIDED_LAB_LINKS, state.labProgress)}<label class="m02e-rationale">Working notes (optional)<textarea data-m02e-practice-notes rows="4" maxlength="900" placeholder="What did you find? Any blockers?">${esc(p.notes)}</textarea></label>${gateMsg}<div class="m02e-panel-actions"><button class="m02e-primary" type="button" data-m02e-practice-complete>${p.complete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div></div>`;
  }

  function markPracticeComplete() {
    if (!guidedLabsUnlocked()) return;
    if (!missionNextAllLabsComplete(state.labProgress, ['guided-1', 'guided-2'])) {
      state.practice.gateMessage = 'Mark both labs above complete first.';
      save();
      renderScope('practice');
      return;
    }
    state.practice.gateMessage = '';
    state.practice.complete = true;
    save();
    renderScope('practice');
  }

  // ---------------------------------------------------------------- Prove It

  function provePanel() {
    const p = state.prove;
    const feedbackHtml = p.feedback?.length ? `<div class="m02e-feedback ${p.submitted ? 'is-correct' : ''}" role="status"><ul>${p.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : '';
    return `<div class="m02e-prove-panel" id="m02e-prove-panel"><p class="m02e-label">ASSESSMENT LAB</p><p class="m02e-panel-instruction">Complete both imported assessment projects below with a short note on each, then write up your findings for instructor review.</p>${missionNextLabLaunchGroup(2, 'assessment', ASSESSMENT_LAB_LINKS, state.labProgress)}<form id="m02e-prove-form"><label class="m02e-rationale">Assessment write-up<textarea id="m02e-prove-notes" rows="6" maxlength="900" placeholder="Summarize what the Splunk/AD logs surfaced, your analysis, and your recommended action…">${esc(p.notes)}</textarea></label><p class="m02e-help">In at least ${ASSESSMENT_MIN_NOTE_LENGTH} characters, describe what you found and your recommended action.</p><div class="m02e-panel-actions"><button class="m02e-primary" type="submit">${p.submitted ? 'Resubmit for review' : 'Submit for review'}</button></div></form>${feedbackHtml}</div>`;
  }

  function submitProve(notes) {
    const p = state.prove;
    p.notes = notes;
    if (!missionNextAllLabsComplete(state.labProgress, ['assessment-1', 'assessment-2', 'additional-sa2'])) {
      p.feedback = ['Mark all required labs above complete first.'];
      save();
      renderScope('prove');
      return;
    }
    if (notes.trim().length < ASSESSMENT_MIN_NOTE_LENGTH) {
      p.feedback = [`Write at least ${ASSESSMENT_MIN_NOTE_LENGTH} characters describing your findings and recommended action before submitting.`];
      save();
      renderScope('prove');
      return;
    }
    p.attempts = (p.attempts || 0) + 1;
    p.lastSubmittedAt = new Date().toISOString();
    p.submitted = true;
    // Deliberately no verdict or correct-answer reveal here — this is a
    // reviewable submission, not a self-graded quiz (correction brief §4).
    p.feedback = ['Submitted. This write-up has been recorded as your Assessment Lab submission for instructor review.'];

    // Instructor-facing payload (docs/LAB_ASSESSMENT_STANDARD.md): carries the
    // student's actual write-up in `access_review.analystNote` rather than
    // only a raw score, so adminModuleTwoAccessReviewPanel() (app.js) keeps
    // rendering readable student writing instead of JSON.
    const result = {
      access_review: { selectedEvent: ASSESSMENT_LAB_LINKS.map((l) => l.title).join(' + '), decision: 'Submitted for review', evidenceReferenced: [], analystNote: notes },
    };

    state.completed = true;
    if (typeof recordLabAttempt === 'function') recordLabAttempt(user, LAB_KEY, { state: 'complete', result });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'soc-analyst', 'soc-02', LAB_KEY);
    save();
    renderScope('prove');
  }

  // ------------------------------------------------------------------- Shell

  function getNavSections() {
    return [
      { id: 'learn', title: 'Learn It', type: 'lecture', phase: 'learn', isComplete: guidedLabsUnlocked(), scrollId: 'm02e-learn' },
      { id: 'practice', title: 'Practice It', type: 'lab', phase: 'practice', isComplete: state.practice.complete, scrollId: 'm02e-practice' },
      { id: 'prove', title: 'Assessment Lab', type: 'review', phase: 'prove', isComplete: state.completed || Boolean(user?.remoteVerifiedModuleProgress?.['soc-02']), scrollId: 'm02e-prove' },
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
            <h1 id="m02e-title">See how an access decision is made.</h1>
            <p class="m01-lede">Trace a connection from identity and device to resource and policy in one console. Authentication confirms identity; authorization decides what that identity may access.</p>
          </div></section>

          <section class="m01-section m02e-section" id="m02e-learn" aria-labelledby="m02e-learn-title">
            <div class="m01-section-heading"><span>1</span><div><p class="m01-kicker">Learn It · guided walkthrough</p><h2 id="m02e-learn-title">Read a connection the way an analyst does</h2></div></div>
            ${learnCallout()}
            <div class="m02e-console-wrap" id="m02e-console-learn">${consoleHtml('learn')}</div>
          </section>

          <section class="m01-section m02e-section" id="m02e-practice" aria-labelledby="m02e-practice-title">
            <div class="m01-section-heading"><span>2</span><div><p class="m01-kicker">Practice It · Guided Lab</p><h2 id="m02e-practice-title">Security assessment practice</h2></div></div>
            ${practicePanel()}
          </section>

          <section class="m01-section m02e-section" id="m02e-prove" aria-labelledby="m02e-prove-title">
            <div class="m01-section-heading"><span>3</span><div><p class="m01-kicker">Prove It · Assessment Lab</p><h2 id="m02e-prove-title">Independent Active Directory log review</h2></div></div>
            ${provePanel()}
          </section>

          <section class="m01-section m02e-section" id="m02e-additional" aria-labelledby="m02e-additional-title">
            <div class="m01-section-heading"><span><i class="ri-shield-star-line" aria-hidden="true"></i></span><div><p class="m01-kicker">Required Lab</p><h2 id="m02e-additional-title">Additional Mission Next Lab</h2></div></div>
            ${additionalPanelHtml()}
          </section>

          <section class="m01-section m01-section-supplemental m02e-section" id="m02e-sources" aria-labelledby="m02e-sources-title">
            <div class="m01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m01-kicker">Reference — not a graded step</p><h2 id="m02e-sources-title">Sources &amp; Further Reading</h2></div></div>
            ${moduleSourcesBlock(SOURCES)}
          </section>
        </main>
      </div>
    </div>`;
  }

  function wire() {
    const root = document.querySelector('.m02e-shell');
    if (!root) return;

    wireLabGating('practice');
    wireLabGating('prove');
    wireLabGating('additional');

    wireReviewToggle({
      button: document.querySelector('[data-mnav-review-toggle]'),
      sectionSelector: '.m02e-section',
      getReviewMode: () => reviewMode,
      setReviewMode: (value) => { reviewMode = value; },
      enabledLabel: 'Exit Review', disabledLabel: 'Review Module',
      enabledIcon: 'ri-eye-off-line', disabledIcon: 'ri-eye-line',
    });

    root.onclick = (ev) => {
      const button = ev.target.closest('button,[data-m02e-select]');
      if (!button) return;
      const select = button.dataset.m02eSelect;
      if (select) { const [scope, type, id] = select.split(':'); setEntity(scope, type, id); return; }
      const tab = button.dataset.m02eTab;
      if (tab) { const [scope, tabId] = tab.split(':'); setTab(scope, tabId); return; }
      if (button.hasAttribute('data-m02e-learn-next')) {
        state.learn.step = Math.min(LEARN_STEPS.length, state.learn.step + 1);
        if (state.learn.step >= LEARN_STEPS.length) state.learn.guideUnlocked = true;
        save(); renderScope('learn', { animateLearn: true }); return;
      }
      if (button.hasAttribute('data-m02e-learn-restart')) { state.learn.step = 0; state.learn.guideStep = -1; save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-guide-open')) {
        if (!state.learn.guideUnlocked && !learnComplete() && !state.learn.guideCompleted) return;
        state.learn.guideStep = 0;
        applyGuideFocus(); save(); renderScope('learn'); return;
      }
      if (button.hasAttribute('data-m02e-guide-next')) {
        if ((!state.learn.guideUnlocked && !learnComplete() && !state.learn.guideCompleted) || state.learn.guideStep < 0) return;
        state.learn.guideStep = state.learn.guideStep >= CONSOLE_GUIDE_STEPS.length ? 0 : state.learn.guideStep + 1;
        if (state.learn.guideStep === CONSOLE_GUIDE_STEPS.length) state.learn.guideCompleted = true;
        applyGuideFocus(); save(); renderScope('learn');
        if (state.learn.guideCompleted) renderScope('practice');
        return;
      }
      if (button.hasAttribute('data-m02e-knowledge-submit')) { state.learn.knowledgeScored = true; save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-practice-complete')) { markPracticeComplete(); return; }
    };

    root.onchange = (ev) => {
      const t = ev.target;
      if (t.matches('[data-m02e-knowledge-answer]')) { state.learn.knowledgeAnswers[t.dataset.questionId] = t.value; state.learn.knowledgeScored = false; save(); renderScope('learn'); return; }
    };
    root.oninput = (ev) => {
      if (ev.target.matches('[data-m02e-practice-notes]')) { state.practice.notes = ev.target.value; save(); return; }
      if (ev.target.id === 'm02e-prove-notes') { state.prove.notes = ev.target.value; save(); return; }
    };
    root.onsubmit = (ev) => {
      if (ev.target.id !== 'm02e-prove-form') return;
      ev.preventDefault();
      const notes = document.getElementById('m02e-prove-notes')?.value || '';
      submitProve(notes);
    };
    requestAnimationFrame(positionLearnTip);
    window.addEventListener('resize', positionLearnTip);
  }

  registerModuleLab({ program: 'soc-analyst', moduleNumber: 2, moduleKey: 'soc-02', view, wire });
}());

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
  const LAB_ID = 'm02-trust-path-review-v1';
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
    { title: 'Network Map', body: 'Throughout your career as a SOC Analyst, you will encounter a variety of technologies, constantly changing to keep up with the fast-paced world of Cybersecurity. New threats emerge every day. That requires practitioners to constantly learn how to use different terminals, monitoring dashboards, or possibly reading coding or scripting languages to understand what a specific malicious software is doing, and get familiarized with different interfaces you may encounter in your career. Regardless, the concept is the same. A level 1 Security Operations Center Analyst, is creating scheduled queries, to generate alerts out of logs that are recorded in all of these different technologies, and gathered together into a Security Information Event Management System. These alerts are correlated using more targeted queries, machine learning, and artificial intelligence now more than ever, to piece together what attacks are happening within the environment.', tab: 'map', target: ['device', 'wk17'] },
    { title: 'Access Activity', body: 'A log row is a record of what happened — who, what, when, and whether it worked.', tab: 'activity', target: ['event', 'evt-alice-finance'] },
    { title: 'Identities', body: 'Logging in proves who you are. It doesn’t prove what you’re allowed to do.', tab: 'identities', target: ['user', 'alice'] },
    { title: 'Devices', body: 'A trusted, managed device is safer than an unknown one — even for the same user.', tab: 'devices', target: ['device', 'wk17'] },
    { title: 'Resources', body: 'This is what’s being protected, and how sensitive it is.', tab: 'resources', target: ['resource', 'finance'] },
    { title: 'Policies', body: 'The policy is the rule: who’s allowed in, and under what conditions.', tab: 'policies', target: ['policy', 'finance-policy'] },
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
    { title: 'Active Directory Logs and Insights with Splunk', detail: 'AD log review and insight generation with Splunk', href: 'imported-labs/mission-next-labs/index.html#/track/active-directory/project/ad-2/lab', labId: 'assessment-1', requireNote: true },
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
    learn: { walkthroughVersion: 2, step: 0, tab: 'map', selected: { type: 'device', id: 'wk17' }, opened: [], knowledgeAnswers: {}, knowledgeScored: false },
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
    state = LabRuntime.load(LAB_ID, u, DEFAULT);
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
    // Restart the walkthrough once when its teaching sequence changes so a
    // learner does not land halfway through the retired generic tour.
    if (state.learn.walkthroughVersion !== DEFAULT.learn.walkthroughVersion) {
      state.learn = { ...DEFAULT.learn };
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
  function save() { LabRuntime.save(LAB_ID, user, state); }

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
  function setTab(scope, tab) { state[scope].tab = tab; save(); renderScope(scope); }

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
    const guided = scope === 'learn' && !learnComplete();
    const stepIndex = guided ? Math.min(state.learn.step, LEARN_STEPS.length - 1) : -1;
    const step = guided ? LEARN_STEPS[stepIndex] : null;
    // Step 0 is the only step that carries real reading — it gets a slower,
    // full-width fade-in treatment. Every later step is a one-line pointer
    // that floats above whatever it just highlighted (positioned in
    // positionLearnTip(), since its target's on-screen position depends on
    // layout the string template can't know).
    const introHtml = guided && stepIndex === 0
      ? `<div class="m02e-intro-window"><i class="ri-compass-3-line" aria-hidden="true"></i><div><p>${esc(step.body)}</p></div></div>`
      : '';
    const tipHtml = guided && stepIndex > 0
      ? `<div class="m02e-learn-tip" id="m02e-learn-tip" role="status">${esc(step.body)}</div>`
      : '';
    return `<section class="m02e-console ${guided ? 'is-guided' : ''}" aria-label="Network and identity security console">${introHtml}<header><div><p>MISSION NEXT ENVIRONMENT</p><h2>NETWORK &amp; IDENTITY SECURITY</h2></div></header><nav>${TABS.map(([id, label]) => `<button class="${tab === id ? 'is-active' : ''}" data-m02e-tab="${scope}:${id}">${label}</button>`).join('')}</nav><div class="m02e-workspace">${tipHtml}<div class="m02e-view">${body}</div>${drawer(scope)}</div></section>`;
  }

  // Positions #m02e-learn-tip directly above (or, if there's no room, below)
  // whichever .is-selected element the current step highlighted. Re-run
  // after every learn-scope render and on resize, since the target moves
  // with the layout, tab, and viewport width.
  function positionLearnTip() {
    const tip = document.getElementById('m02e-learn-tip');
    if (!tip) return;
    const workspace = tip.closest('.m02e-workspace');
    const target = workspace && workspace.querySelector('.m02e-view .is-selected');
    if (!workspace || !target) { tip.classList.remove('is-visible'); return; }
    const wsRect = workspace.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    tip.classList.remove('is-visible');
    const tipRect = tip.getBoundingClientRect();
    let top = tRect.top - wsRect.top - tipRect.height - 12;
    let pointsDown = false;
    if (top < 4) { top = tRect.bottom - wsRect.top + 12; pointsDown = true; }
    let left = tRect.left - wsRect.left + tRect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, wsRect.width - tipRect.width - 8));
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.classList.toggle('points-down', pointsDown);
    requestAnimationFrame(() => tip.classList.add('is-visible'));
  }

  function renderScope(scope) {
    const consoleEl = document.getElementById(`m02e-console-${scope}`);
    if (consoleEl) consoleEl.innerHTML = consoleHtml(scope);
    if (scope === 'learn') {
      const callout = document.getElementById('m02e-learn-callout');
      if (callout) callout.outerHTML = learnCallout();
      const knowledge = document.getElementById('m02e-knowledge');
      if (knowledge) knowledge.outerHTML = knowledgePanel();
      requestAnimationFrame(positionLearnTip);
    }
    if (scope === 'practice') {
      const panel = document.getElementById('m02e-practice-panel');
      if (panel) panel.outerHTML = practicePanel();
      wireLabGating('practice');
    }
    if (scope === 'prove') {
      const panel = document.getElementById('m02e-prove-panel');
      if (panel) panel.outerHTML = provePanel();
      wireLabGating('prove');
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

  // Advancing the guided tour opens and highlights its next evidence target
  // automatically; learners should not have to hunt through the console.
  function applyLearnFocus() {
    if (learnComplete()) return;
    const step = LEARN_STEPS[Math.min(state.learn.step, LEARN_STEPS.length - 1)];
    state.learn.tab = step.tab;
    state.learn.selected = { type: step.target[0], id: step.target[1] };
    state.learn.opened = [...new Set([...(state.learn.opened || []), `${step.target[0]}:${step.target[1]}`])];
  }

  function learnCallout() {
    const step = Math.min(state.learn.step, LEARN_STEPS.length - 1);
    const s = LEARN_STEPS[step];
    const done = learnComplete();
    if (done) return `<div class="m02e-callout is-done" id="m02e-learn-callout"><p class="m02e-label">LEARN IT · WALKTHROUGH COMPLETE</p><p>You’ve walked the console end to end. Revisit it whenever you like, or continue to the short knowledge check below.</p><div class="m02e-callout-actions"><button class="m02e-secondary" type="button" data-m02e-learn-restart><i class="ri-restart-line" aria-hidden="true"></i> Restart walkthrough</button></div></div>`;
    return `<div class="m02e-callout" id="m02e-learn-callout"><p class="m02e-label">LEARN IT · STEP ${step + 1} OF ${LEARN_STEPS.length} · ${esc(s.title)}</p><div class="m02e-callout-actions"><button class="m02e-primary" type="button" data-m02e-learn-next>${step === LEARN_STEPS.length - 1 ? 'Complete the walkthrough' : 'LEARN IT'}</button></div></div>`;
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
    const gateOk = missionNextAllLabsComplete(state.labProgress, ['guided-1', 'guided-2']);
    const gateMsg = p.gateMessage && !gateOk ? `<p class="m02e-gate-message" role="alert">${esc(p.gateMessage)}</p>` : '';
    return `<div class="m02e-practice-panel" id="m02e-practice-panel"><p class="m02e-label">GUIDED LAB</p><p class="m02e-panel-instruction">Work through both imported security-assessment projects below; each opens on this page with its own guided tasks. Mark each lab complete with a short note, then mark the Guided Lab complete overall.</p>${missionNextLabLaunchGroup(2, 'guided', GUIDED_LAB_LINKS, state.labProgress)}<label class="m02e-rationale">Working notes (optional)<textarea data-m02e-practice-notes rows="4" maxlength="900" placeholder="What did you find? Any blockers?">${esc(p.notes)}</textarea></label>${gateMsg}<div class="m02e-panel-actions"><button class="m02e-primary" type="button" data-m02e-practice-complete>${p.complete ? 'Guided Lab marked complete' : 'Mark Guided Lab complete'}</button></div></div>`;
  }

  function markPracticeComplete() {
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
      { id: 'learn', title: 'Learn It', type: 'lecture', phase: 'learn', isComplete: learnComplete(), scrollId: 'm02e-learn' },
      { id: 'practice', title: 'Practice It', type: 'lab', phase: 'practice', isComplete: state.practice.complete, scrollId: 'm02e-practice' },
      { id: 'prove', title: 'Assessment Lab', type: 'review', phase: 'prove', isComplete: state.completed || Boolean(user?.remoteVerifiedModuleProgress?.['soc-02']), scrollId: 'm02e-prove' },
      { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm02e-sources', gated: false, supplemental: true },
    ];
  }

  function view(u, program) {
    load(u);
    const module = program?.modules?.['soc-02'] || {};
    applyLearnFocus();
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
      if (button.hasAttribute('data-m02e-learn-next')) { state.learn.step = Math.min(LEARN_STEPS.length, state.learn.step + 1); applyLearnFocus(); save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-learn-restart')) { state.learn.step = 0; applyLearnFocus(); save(); renderScope('learn'); return; }
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

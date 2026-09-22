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
 * module for in-context coaching. Practice It and Prove It open the same
 * enterprise-style console in a dedicated browser workspace.
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
  // entity the "Inspect" callout highlights and opens in the drawer.
  const LEARN_STEPS = [
    { title: 'Network Map', body: 'The network map shows the source, the destination, the security zones each sits in, and the boundary a connection has to cross.', lookFor: 'WKSTN-17 in the Workstations area', terms: ['Network Map', 'DMZ', 'Servers & Resources'], tab: 'map', target: ['device', 'wk17'] },
    { title: 'Access Activity', body: 'Each activity row connects one person, device, source IP, destination resource, service, protocol, port, and result in a single line.', lookFor: 'Alice’s 08:14 access row', terms: ['Protocol', 'Port'], tab: 'activity', target: ['event', 'evt-alice-finance'] },
    { title: 'Identity', body: 'Authentication confirms who is signing in. Authorization is a separate decision — roles and MFA are identity context, not the decision itself.', lookFor: 'Alice Morgan and her Finance-Read group', terms: ['Authentication', 'Authorization', 'MFA'], tab: 'identities', target: ['user', 'alice'] },
    { title: 'Device', body: "A device's managed and compliant state is access context an analyst weighs alongside identity and network path, not a decision on its own.", lookFor: 'WKSTN-17 and its management status', terms: ['Managed device', 'Compliant'], tab: 'devices', target: ['device', 'wk17'] },
    { title: 'Resource & Policy', body: "A resource's policy states what is protected, which groups are authorized, and what conditions — a managed device, MFA — are required.", lookFor: 'the Finance file access policy', terms: ['Resource', 'Access policy', 'PKI'], tab: 'policies', target: ['policy', 'finance-policy'] },
    { title: 'Access decision', body: 'Alice has Finance-Read, a managed and compliant device, and satisfied MFA. She meets the Finance file policy, so the connection is allowed.', lookFor: 'the ALLOWED result on Alice’s 08:14 activity', terms: ['Access decision', 'Zero Trust'], tab: 'activity', target: ['event', 'evt-alice-finance'] },
  ];

  // Facts the console cannot demonstrate well on its own.
  const KNOWLEDGE_QUESTIONS = [
    { id: 'protocol', prompt: 'A resource’s expected access is listed as "SMB / TCP 445." What does TCP represent?', options: [{ id: 'a', text: 'The transport protocol carrying the connection' }, { id: 'b', text: 'The application service' }, { id: 'c', text: 'The destination IP address' }, { id: 'd', text: 'The security zone' }], correct: 'a', correctMsg: 'Correct. SMB is the service, TCP is the transport protocol, and 445 is the port.', incorrectMsg: 'SMB names the service and 445 is the port. TCP is the transport protocol connecting them.' },
    { id: 'pki', prompt: 'A service presents a certificate that is unexpired and issued by a trusted internal CA. What else should be validated before trusting it?', options: [{ id: 'a', text: 'That its subject, intended use, and workload context match the connection' }, { id: 'b', text: 'Only the expiration date' }, { id: 'c', text: 'The key length alone' }, { id: 'd', text: 'Nothing further — a trusted issuer is sufficient' }], correct: 'a', correctMsg: 'Correct. A valid issuer and expiry are not enough — subject, purpose, and workload context must also align.', incorrectMsg: 'Issuer and expiry alone are not enough. Validate the certificate’s subject, intended use, and workload context too.' },
    { id: 'zero-trust', prompt: 'Alice authenticates successfully from inside the corporate network. Why is her Finance file request still evaluated under Zero Trust reasoning?', options: [{ id: 'a', text: 'Every request is evaluated on identity, device, and resource context — network location alone is not trusted' }, { id: 'b', text: 'Internal network location is automatically trusted' }, { id: 'c', text: 'Authentication alone is sufficient once inside the network' }, { id: 'd', text: 'Zero Trust only applies to external users' }], correct: 'a', correctMsg: 'Correct. Zero Trust evaluates each request on its own context rather than trusting network location.', incorrectMsg: 'Zero Trust does not grant trust by network location — each request is evaluated on identity, device, and resource context.' },
  ];

  const PRACTICE_HINTS = [
    'Open John Smith’s identity in the console to see his assigned groups.',
    'Open the HR-FILE-01 policy to see which groups it authorizes.',
    'Compare John’s groups against the policy’s authorized groups — a successful sign-in is not the same as being authorized.',
  ];
  const PRACTICE_EVIDENCE = ['Identity groups', 'Device compliance', 'Destination policy', 'Protocol / port', 'MFA status'];
  const PRACTICE_REQUIRED_EVIDENCE = ['Identity groups', 'Destination policy'];
  const PROVE_EVIDENCE = ['Identity', 'Device', 'Resource', 'Policy'];
  const PROVE_ANSWER_EVENT = 'evt-john-hr-allowed';

  const SOURCES = [
    { title: 'Zero Trust Architecture (SP 800-207)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/207/final', note: 'Comprehensive guide to assuming no inherent trust and evaluating each request on identity, device, location, and risk.' },
    { title: 'Introduction to Public Key Technology and the Federal PKI Infrastructure (SP 800-32)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/32/final', note: 'Certificate and PKI fundamentals: subject, issuer, intended use, and validation.' },
    { title: 'Digital Identity Guidelines: Authentication and Authenticator Management (SP 800-63B-4)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/63/b/4/final', note: 'Digital identity guidelines covering authentication methods, MFA, and credential management.' },
    { title: 'Authorization Cheat Sheet', org: 'OWASP', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html', note: 'Design and implementation patterns for access control and privilege management.' },
    { title: 'Security+ public domain overview (supplementary draft reference)', org: 'CompTIA', url: 'https://www.comptia.org/certifications/security', note: 'Supplementary public reference only. Not an approval, affiliation, endorsement, or pass guarantee.' },
  ];

  const DEFAULT = {
    learn: { step: 0, tab: 'map', selected: { type: 'event', id: 'evt-alice-finance' }, opened: [], knowledgeAnswers: {}, knowledgeScored: false },
    practice: { tab: 'activity', selected: { type: 'event', id: 'evt-john-hr-denied' }, opened: [], decision: '', evidence: [], hint: 0, feedback: '', complete: false },
    prove: { tab: 'activity', selected: { type: 'event', id: 'evt-alice-finance' }, opened: [], decision: '', event: '', evidence: [], note: '', submitted: false, score: 0, feedback: '' },
    completed: false,
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
        evidence: Array.isArray(value.evidence) ? value.evidence : [],
      };
    };
    state.learn = normalizeScope(state.learn, DEFAULT.learn);
    state.learn.knowledgeAnswers = state.learn.knowledgeAnswers && typeof state.learn.knowledgeAnswers === 'object' ? state.learn.knowledgeAnswers : {};
    state.practice = normalizeScope(state.practice, DEFAULT.practice);
    state.prove = normalizeScope(state.prove, DEFAULT.prove);
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
    const step = guided ? LEARN_STEPS[Math.min(state.learn.step, LEARN_STEPS.length - 1)] : null;
    return `<section class="m02e-console ${guided ? 'is-guided' : ''}" aria-label="Network and identity security console">${guided ? `<div class="m02e-guided-focus"><i class="ri-radar-line" aria-hidden="true"></i> Walkthrough focus: <strong>${esc(step.title)}</strong><span> — highlighted automatically</span></div>` : ''}<header><div><p>MISSION NEXT ENVIRONMENT</p><h2>NETWORK &amp; IDENTITY SECURITY</h2></div></header><nav>${TABS.map(([id, label]) => `<button class="${tab === id ? 'is-active' : ''}" data-m02e-tab="${scope}:${id}">${scope === 'learn' && id === 'map' ? learnTerm(label, false) : label}</button>`).join('')}</nav><div class="m02e-workspace"><div class="m02e-view">${body}</div>${drawer(scope)}</div></section>`;
  }

  function renderScope(scope) {
    const consoleEl = document.getElementById(`m02e-console-${scope}`);
    if (consoleEl) consoleEl.innerHTML = consoleHtml(scope);
    if (scope === 'learn') {
      const callout = document.getElementById('m02e-learn-callout');
      if (callout) callout.outerHTML = learnCallout();
      const knowledge = document.getElementById('m02e-knowledge');
      if (knowledge) knowledge.outerHTML = knowledgePanel();
    }
    if (scope === 'practice') {
      const panel = document.getElementById('m02e-practice-panel');
      if (panel) panel.outerHTML = practicePanel();
    }
    if (scope === 'prove') {
      const panel = document.getElementById('m02e-prove-panel');
      if (panel) panel.outerHTML = provePanel();
    }
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
    return `<div class="m02e-callout" id="m02e-learn-callout"><p class="m02e-label">LEARN IT · STEP ${step + 1} OF ${LEARN_STEPS.length} · ${esc(s.title)}</p><p>${esc(s.body)}</p><p class="m02e-look-for"><strong>Now look for:</strong> ${esc(s.lookFor)}. It is already highlighted in the environment below.</p><div class="m02e-term-list" aria-label="Quick definitions">${s.terms.map(learnTerm).join('')}</div><div class="m02e-callout-actions"><button class="m02e-secondary" type="button" data-m02e-learn-inspect>Show highlighted item</button><button class="m02e-primary" type="button" data-m02e-learn-next>${step === LEARN_STEPS.length - 1 ? 'Complete the walkthrough' : 'Next: highlight the next item'}</button></div></div>`;
  }

  function knowledgePanel() {
    const answers = state.learn.knowledgeAnswers;
    const answered = Object.keys(answers).length;
    const scored = state.learn.knowledgeScored;
    const correctCount = scored ? KNOWLEDGE_QUESTIONS.filter((q) => answers[q.id] === q.correct).length : 0;
    return `<div class="m02e-knowledge" id="m02e-knowledge"><div class="m02e-panel-heading"><div><p class="m02e-label">OPTIONAL · KNOWLEDGE CHECK</p><h3>Protocol, PKI, and Zero Trust facts</h3></div><span>${answered}/${KNOWLEDGE_QUESTIONS.length} answered</span></div>${KNOWLEDGE_QUESTIONS.map((q, i) => `<fieldset class="m02e-knowledge-question"><legend>${i + 1}. ${esc(q.prompt)}</legend>${q.options.map((opt) => `<label><input type="radio" name="m02e-knowledge-${esc(q.id)}" value="${esc(opt.id)}" data-m02e-knowledge-answer data-question-id="${esc(q.id)}" ${answers[q.id] === opt.id ? 'checked' : ''}> ${esc(opt.text)}</label>`).join('')}${scored ? `<p class="m02e-knowledge-feedback ${answers[q.id] === q.correct ? 'is-correct' : 'is-incorrect'}">${answers[q.id] === q.correct ? esc(q.correctMsg) : esc(q.incorrectMsg)}</p>` : ''}</fieldset>`).join('')}<button class="m02e-primary" type="button" data-m02e-knowledge-submit ${answered < KNOWLEDGE_QUESTIONS.length ? 'disabled' : ''}>Check my answers</button>${scored ? `<p class="m02e-knowledge-score">${correctCount}/${KNOWLEDGE_QUESTIONS.length} correct.</p>` : ''}</div>`;
  }

  // ------------------------------------------------------------- Practice It

  function practiceGateSatisfied() {
    const opened = state.practice.opened;
    return opened.includes('user:john') && (opened.includes('policy:hr-policy') || opened.includes('resource:hr'));
  }

  function practicePanel() {
    const p = state.practice;
    const unlocked = practiceGateSatisfied();
    if (!unlocked) {
      return `<div class="m02e-practice-panel m02e-gate" id="m02e-practice-panel"><p class="m02e-label">DECISION ARTIFACT · LOCKED</p><p>Open John Smith’s identity and the HR-FILE-01 policy in the console above before recording a decision. Authentication alone does not tell you whether access is authorized.</p></div>`;
    }
    return `<div class="m02e-practice-panel" id="m02e-practice-panel"><p class="m02e-label">DECISION ARTIFACT</p><h3>Should John’s access be allowed?</h3><div class="m02e-decisions">${['ALLOW', 'DENY', 'ESCALATE'].map((d) => `<button class="${p.decision === d ? 'is-selected' : ''}" data-m02e-practice-decision="${d}">${d}</button>`).join('')}</div><h4>Supporting evidence</h4>${PRACTICE_EVIDENCE.map((item) => `<label><input type="checkbox" data-m02e-practice-evidence value="${esc(item)}" ${p.evidence.includes(item) ? 'checked' : ''}> ${esc(item)}</label>`).join('')}<label class="m02e-rationale">Analyst rationale<textarea data-m02e-practice-note rows="2" maxlength="400" placeholder="State what the evidence shows.">${esc(p.rationale || '')}</textarea></label><div class="m02e-panel-actions"><button class="m02e-primary" type="button" data-m02e-practice-submit>Check reasoning</button><button class="m02e-secondary" type="button" data-m02e-hint>Hint (${Math.min(p.hint + 1, PRACTICE_HINTS.length)}/${PRACTICE_HINTS.length})</button></div>${p.feedback ? `<div class="m02e-feedback ${p.complete ? 'is-correct' : ''}">${esc(p.feedback)}</div>` : ''}</div>`;
  }

  function submitPractice() {
    const p = state.practice;
    const evidenceOk = PRACTICE_REQUIRED_EVIDENCE.every((x) => p.evidence.includes(x));
    p.complete = p.decision === 'DENY' && evidenceOk;
    p.feedback = p.complete
      ? 'Correct. John authenticated successfully, but Operations-Read is not authorized by HR-FILE-01’s HR-Read policy — the access should be denied.'
      : 'Reassess: a successful sign-in confirms identity, not permission. Compare John’s groups to HR-FILE-01’s authorized groups before deciding.';
    save();
    renderScope('practice');
  }

  // ---------------------------------------------------------------- Prove It

  function provePanel() {
    const p = state.prove;
    const sel = p.selected;
    const selectedLabel = sel.type === 'event' ? (() => { const e = by('event', sel.id), x = entity(e); return `${e.time} · ${x.user.username} → ${x.resource.name} · ${e.result}`; })() : 'No event selected';
    return `<section class="m01-console m02e-case-record" id="m02e-prove-panel" aria-labelledby="m02e-case-record-title"><header class="m01-console-header"><span class="m01-console-badge">Assessment case · access policy review</span><h3 id="m02e-case-record-title">Analyst case record</h3><p>Document the event you investigated, your determination, and the evidence that supports it.</p></header><div class="m01-console-body"><section class="m01-console-pane m01-console-ticket"><p class="m01-console-pane-title">Case record <span class="muted">Independent assessment</span></p><form class="m01-ticket-form"><div class="m01-ticket-case"><strong>CASE M02-ACCESS-01</strong><span>${p.submitted ? 'Submitted for review' : 'In progress'}</span></div><div class="m01-ticket-grid"><label class="m01-ticket-field">Investigated activity<span class="m02e-readonly">${esc(selectedLabel)}</span></label><label class="m01-ticket-field">Determination<select data-m02e-prove-decision ${p.submitted ? 'disabled' : ''}><option value="">Select determination</option><option value="POLICY VIOLATION" ${p.decision === 'POLICY VIOLATION' ? 'selected' : ''}>Policy violation</option><option value="NO VIOLATION" ${p.decision === 'NO VIOLATION' ? 'selected' : ''}>No policy violation</option></select></label></div><label class="m01-ticket-field">Evidence reviewed<select multiple size="4" data-m02e-prove-evidence ${p.submitted ? 'disabled' : ''}>${PROVE_EVIDENCE.map((item) => `<option value="${esc(item)}" ${p.evidence.includes(item) ? 'selected' : ''}>${esc(item)}</option>`).join('')}</select></label><label class="m01-ticket-field m01-ticket-notes">Analyst work notes<textarea data-m02e-prove-note rows="5" maxlength="600" placeholder="Document the policy mismatch, the evidence reviewed, and the appropriate follow-up." ${p.submitted ? 'disabled' : ''}>${esc(p.note)}</textarea></label><div class="m01-ticket-actions"><span class="m02e-case-hint">Review identity, device, resource, and policy context before submitting.</span><button class="m01-submit" type="button" data-m02e-prove-submit ${p.submitted ? 'disabled' : ''}>${p.submitted ? 'Submitted for review' : 'Submit case for review'}</button></div></form>${p.feedback ? `<div class="m02e-feedback">${esc(p.feedback)}</div>` : ''}</section></div></section>`;
  }

  function submitProve() {
    const p = state.prove;
    if (p.selected.type !== 'event' || !p.decision || !p.note.trim()) {
      p.feedback = 'Select an event, a determination, and write your analyst note before submitting.';
      save(); renderScope('prove'); return;
    }
    p.event = p.selected.id;
    // Credit only the actual violation, correctly classified — the case
    // brief's "a denied event is not automatically malicious" framing guards
    // against false positives, but does not by itself earn assessment credit.
    const decisionMatches = p.event === PROVE_ANSWER_EVENT && p.decision === 'POLICY VIOLATION';
    const evidenceComplete = PROVE_EVIDENCE.every((x) => p.evidence.includes(x));
    const noteQuality = p.note.trim().length >= 45;
    const score = (decisionMatches ? 45 : 0) + (evidenceComplete ? 30 : 0) + (noteQuality ? 25 : 0);
    p.score = score;
    p.submitted = true;
    // Deliberately no verdict or correct-answer reveal here — this is a
    // reviewable submission, not a self-graded quiz (correction brief §4).
    p.feedback = 'Submitted. This determination has been recorded as your Prove It assessment for review.';

    // Instructor-facing payload (docs/LAB_ASSESSMENT_STANDARD.md): the score
    // breakdown and explicit misses are for faculty review, not the student
    // panel above — the student never sees this feedback array. The full
    // event label and analyst note are carried in `access_review` rather than
    // only a raw event id, so adminModuleTwoAccessReviewPanel() (app.js) can
    // render the student's actual investigation and writing instead of JSON.
    const eventRecord = by('event', p.event);
    const eventEntities = eventRecord ? entity(eventRecord) : null;
    const selectedEventLabel = eventEntities ? `${eventRecord.time} · ${eventEntities.user.name} (${eventEntities.user.username}) → ${eventEntities.resource.name} · ${eventRecord.result}` : p.event;
    const result = {
      breakdown: { decision: decisionMatches ? 45 : 0, evidence: evidenceComplete ? 30 : 0, documentation: noteQuality ? 25 : 0 },
      feedback: [
        decisionMatches ? 'Correctly identified the incorrectly-allowed HR-FILE-01 event as the policy violation.' : 'Did not identify the incorrectly-allowed HR-FILE-01 event as the policy violation, or misclassified the selected event.',
        evidenceComplete ? 'Cited identity, device, resource, and policy evidence.' : `Missing evidence citation(s): ${PROVE_EVIDENCE.filter((x) => !p.evidence.includes(x)).join(', ') || 'none'}.`,
        noteQuality ? 'Analyst note meets the minimum length for a documented rationale.' : 'Analyst note is under 45 characters and likely insufficient documentation.',
      ],
      access_review: { selectedEvent: selectedEventLabel, decision: p.decision, evidenceReferenced: p.evidence.slice(), analystNote: p.note },
    };

    if (decisionMatches && evidenceComplete && noteQuality) {
      state.completed = true;
      if (typeof recordLabAttempt === 'function') recordLabAttempt(user, LAB_KEY, { state: 'complete', score, result });
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'soc-analyst', 'soc-02', LAB_KEY);
    } else if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(user, LAB_KEY, { state: 'in_progress', score, result });
    }
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

  function workspaceLaunch(scope) {
    const isPractice = scope === 'practice';
    const complete = isPractice ? state.practice.complete : state.completed || Boolean(user?.remoteVerifiedModuleProgress?.['soc-02']);
    const started = isPractice ? state.practice.opened.length || state.practice.decision : state.prove.opened.length || state.prove.event;
    const action = complete ? 'Review the workspace' : started ? (isPractice ? 'Resume Guided Lab' : 'Resume Assessment Lab') : (isPractice ? 'Launch Guided Lab' : 'Launch Assessment Lab');
    const icon = complete ? 'ri-eye-line' : started ? 'ri-terminal-box-line' : 'ri-play-circle-line';
    const status = complete
      ? 'Saved work is available for review in the workspace.'
      : 'Opens the Network & Identity Security environment in a new tab — a focused workspace for this investigation, not an LMS activity card.';
    // Deliberately reuse Module 01's proven launch treatment. The lab remains
    // outside this page; this is only the concise doorway into that workspace.
    return `<div class="m01-lab-launch"><a class="m01-hero-action" href="?console=m02-${scope}${esc(location.hash)}" target="_blank" rel="opener"><i class="${icon}" aria-hidden="true"></i>${action}</a><p class="m01-lab-launch-status">${status}</p></div>`;
  }

  function workspaceView(scope, module) {
    const isPractice = scope === 'practice';
    const title = isPractice ? 'Guided investigation — HR access review' : 'Assessment investigation — access policy review';
    const brief = isPractice
      ? 'John Smith, an Operations Coordinator, attempted to access HR-FILE-01 at 08:17. His sign-in succeeded. Investigate the attempt, then record your decision.'
      : 'Several access events occurred during the same shift. One violates the organization’s access policy. Review the evidence and submit your determination.';
    return `<div class="m02e-workspace-shell">
      <header class="m02e-workspace-topbar"><span><i class="ri-shield-keyhole-line" aria-hidden="true"></i> MISSION NEXT ENVIRONMENT · NETWORK &amp; IDENTITY SECURITY</span><a href="${esc(location.pathname)}#/program/soc-analyst/module/2"><i class="ri-arrow-left-line" aria-hidden="true"></i> Back to Module 02</a></header>
      <main class="m02e-workspace-main"><div class="m02e-workspace-intro"><p>${isPractice ? 'GUIDED LAB' : 'ASSESSMENT LAB'} · MODULE 02</p><h1>${title}</h1><span>Your progress saves automatically</span></div><p class="m02e-workspace-brief">${brief}</p><div class="m02e-console-wrap" id="m02e-console-${scope}">${consoleHtml(scope)}</div>${isPractice ? practicePanel() : provePanel()}</main>
    </div>`;
  }

  function view(u, program) {
    load(u);
    const module = program?.modules?.['soc-02'] || {};
    applyLearnFocus();
    const consoleParam = new URLSearchParams(location.search).get('console');
    if (consoleParam === 'm02-practice') return workspaceView('practice', module);
    if (consoleParam === 'm02-prove') return workspaceView('prove', module);
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
            ${knowledgePanel()}
          </section>

          <section class="m01-section m02e-section" id="m02e-practice" aria-labelledby="m02e-practice-title">
            <div class="m01-section-heading"><span>2</span><div><p class="m01-kicker">Practice It · guided case</p><h2 id="m02e-practice-title">Should John Smith’s HR-FILE-01 access be allowed?</h2></div></div>
            ${workspaceLaunch('practice')}
          </section>

          <section class="m01-section m02e-section" id="m02e-prove" aria-labelledby="m02e-prove-title">
            <div class="m01-section-heading"><span>3</span><div><p class="m01-kicker">Prove It · assessment lab</p><h2 id="m02e-prove-title">Independent security review</h2></div></div>
            ${workspaceLaunch('prove')}
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
    const root = document.querySelector('.m02e-shell, .m02e-workspace-shell');
    if (!root) return;

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
      if (button.hasAttribute('data-m02e-learn-inspect')) { const step = Math.min(state.learn.step, LEARN_STEPS.length - 1); const [type, id] = LEARN_STEPS[step].target; state.learn.tab = LEARN_STEPS[step].tab; setEntity('learn', type, id); return; }
      if (button.hasAttribute('data-m02e-learn-next')) { state.learn.step = Math.min(LEARN_STEPS.length, state.learn.step + 1); applyLearnFocus(); save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-learn-restart')) { state.learn.step = 0; applyLearnFocus(); save(); renderScope('learn'); return; }
      if (button.hasAttribute('data-m02e-knowledge-submit')) { state.learn.knowledgeScored = true; save(); renderScope('learn'); return; }
      if (button.dataset.m02ePracticeDecision) { state.practice.decision = button.dataset.m02ePracticeDecision; save(); renderScope('practice'); return; }
      if (button.hasAttribute('data-m02e-hint')) { const p = state.practice; p.hint = Math.min(PRACTICE_HINTS.length - 1, p.hint + 1); p.feedback = PRACTICE_HINTS[p.hint]; save(); renderScope('practice'); return; }
      if (button.hasAttribute('data-m02e-practice-submit')) { submitPractice(); return; }
      if (button.hasAttribute('data-m02e-prove-submit')) { submitProve(); return; }
    };

    root.onchange = (ev) => {
      const t = ev.target;
      if (t.matches('[data-m02e-knowledge-answer]')) { state.learn.knowledgeAnswers[t.dataset.questionId] = t.value; state.learn.knowledgeScored = false; save(); renderScope('learn'); return; }
      if (t.matches('[data-m02e-practice-evidence]')) { state.practice.evidence = t.checked ? [...new Set([...state.practice.evidence, t.value])] : state.practice.evidence.filter((x) => x !== t.value); save(); return; }
      if (t.matches('[data-m02e-prove-decision]')) { state.prove.decision = t.value; save(); return; }
      if (t.matches('[data-m02e-prove-evidence]')) { state.prove.evidence = Array.from(t.selectedOptions).map((option) => option.value); save(); return; }
    };
    root.oninput = (ev) => {
      if (ev.target.matches('[data-m02e-practice-note]')) { state.practice.rationale = ev.target.value; save(); return; }
      if (ev.target.matches('[data-m02e-prove-note]')) { state.prove.note = ev.target.value; save(); return; }
    };
  }

  registerModuleLab({ program: 'soc-analyst', moduleNumber: 2, moduleKey: 'soc-02', view, wire });
}());

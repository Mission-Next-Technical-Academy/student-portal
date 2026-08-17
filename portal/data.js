/* MNT Academy portal prototype — catalogue + demo accounts.
 *
 * This mirrors the shape of src/content/programs/<slug>.ts described in
 * PLATFORM_ARCHITECTURE.md §5A.2. One object per track, no cross-references,
 * so each track author owns exactly one entry.
 *
 * Program copy for all four cards is taken verbatim from the live site
 * (mntacademy.com #programs) so nothing here contradicts production.
 */

/* ---------------------------------------------------------------------------
 * STANDARD MODULE LAYOUT — see MODULE_STANDARD.md
 *
 * Every module in every track carries the same keys. A field with no content
 * yet is present and empty, never absent — missing keys are what break shared
 * rendering components.
 *
 * All four programs run the same frame: 6 weeks, 12 modules, 2 per week,
 * module 11 = professional practice, module 12 = capstone.
 * ------------------------------------------------------------------------ */

const MODULE_DEFAULTS = {
  key: '',
  number: 0,
  week: 0,
  title: '',
  summary: '',
  hours: '',            // always a range, e.g. '6–8 Hours'
  lessons: 0,
  labs: 0,
  objectives: [],       // 3–6, measurable verbs
  topics: [],           // [{ label?, items: [] }] — flat list = one unnamed group
  handsOn: [],          // [{ title, steps?, note? }]
  skills: [],           // 4–6 résumé-grade nouns
  assessment: { knowledgeCheck: false, practicalLab: false, capstoneGate: false },
  prerequisites: [],
  isCapstone: false,
  status: 'draft',      // draft | authored | published
};

function mod(spec) {
  return {
    ...MODULE_DEFAULTS,
    ...spec,
    assessment: { ...MODULE_DEFAULTS.assessment, ...(spec.assessment || {}) },
  };
}

/* The six-week arc is identical across tracks; only the phase names are
 * domain-specific. Week 4 is the heavy week in every program. */
function weekGroups(labels, keyPrefix) {
  return labels.map((label, i) => ({
    number: i + 1,
    label: `Week ${i + 1} — ${label}`,
    modules: [
      `${keyPrefix}-${String(i * 2 + 1).padStart(2, '0')}`,
      `${keyPrefix}-${String(i * 2 + 2).padStart(2, '0')}`,
    ],
  }));
}

/* Turns a flat [number, week, title] list into a keyed, standard-shaped module
 * map. Used for tracks whose curriculum is skeletoned but not yet authored. */
function skeleton(keyPrefix, rows) {
  const out = {};
  rows.forEach(([number, week, title]) => {
    const key = `${keyPrefix}-${String(number).padStart(2, '0')}`;
    out[key] = mod({
      key, number, week, title,
      summary: 'Curriculum content for this module is being authored.',
      isCapstone: number === 12,
      status: 'draft',
    });
  });
  return out;
}

const PROGRAMS = [
  {
    slug: 'it-support',
    category: 'Information Technology',
    icon: 'ri-customer-service-2-line',
    eyebrow: 'Mission Next',
    cardTitle: 'IT Help Desk & Career Accelerator',
    title: 'IT Help Desk & Career Accelerator',
    description:
      'Enterprise Windows Server 2022 networks, Active Directory management, and enterprise ticket lifecycle training for real-world IT environments.',
    badge: 'Launch into IT Support in 6 weeks',
    weeks: 6,
    moduleCount: 12,
    isPublished: false,
    // Aligned to CompTIA A+ domains and ITIL 4 service management practice.
    weekGroups: weekGroups([
      'IT Support Foundations',
      'Operating Systems & Networking',
      'Directory & Identity Administration',
      'Endpoint Management & Troubleshooting',
      'Security & Service Management',
      'Professional Practice & Capstone',
    ], 'its'),
    modules: skeleton('its', [
      [1, 1, 'IT Support Fundamentals & Service Desk Operations'],
      [2, 1, 'Hardware, Devices & Peripherals'],
      [3, 2, 'Operating Systems: Windows, macOS & Linux'],
      [4, 2, 'Networking Fundamentals for Support'],
      [5, 3, 'Windows Server & Active Directory Administration'],
      [6, 3, 'Identity, Accounts & Access Management'],
      [7, 4, 'Software, Applications & Endpoint Management'],
      [8, 4, 'Troubleshooting Methodology & Diagnostics'],
      [9, 5, 'Security Fundamentals for IT Support'],
      [10, 5, 'Ticketing, ITIL Service Management & SLAs'],
      [11, 6, 'Customer Service, Documentation & Escalation'],
      [12, 6, 'IT Support Capstone'],
    ]),
  },
  {
    slug: 'soc-analyst',
    category: 'Cybersecurity Operations',
    icon: 'ri-shield-keyhole-line',
    eyebrow: 'Mission Next',
    // Card title and description are the LIVE SITE copy, verbatim. Do not
    // replace them with the build-spec wording — the site is the authority.
    cardTitle: 'Security Operation Center (SOC) Analyst',
    title: 'Security Operation Center (SOC) Analyst',
    tagline: 'Learn to Investigate. Detect. Respond.',
    description:
      'Train in live SIEM environments, packet analysis, and threat detection workflows used in modern Security Operations Centers.',
    // Longer positioning copy, detail page only. It expands on the card rather
    // than contradicting it.
    intro:
      'Prepare for entry-level cybersecurity operations and SOC analyst roles through hands-on investigation, detection, vulnerability management, incident response, and security operations training.',
    badge: 'Secure a role in Cybersecurity Ops',
    weeks: 6,
    moduleCount: 12,
    isPublished: true,
    stats: [
      { icon: 'ri-calendar-line', label: 'Duration', value: '6 Weeks' },
      { icon: 'ri-stack-line', label: 'Curriculum', value: '12 Modules' },
      { icon: 'ri-time-line', label: 'Estimated Training', value: '80–100 Hours' },
      { icon: 'ri-flask-line', label: 'Hands-On Training', value: '10–15 Labs + Capstone' },
      { icon: 'ri-global-line', label: 'Delivery', value: 'Online' },
    ],
    skills: [
      'SIEM', 'XDR', 'Threat Detection', 'Incident Response', 'Threat Hunting',
      'Vulnerability Management', 'Network Analysis', 'Email Security', 'Security Operations',
    ],
    weekGroups: [
      { number: 1, label: 'Week 1 — Security Operations Foundations', modules: ['soc-01', 'soc-02'] },
      { number: 2, label: 'Week 2 — Detection & Security Analytics', modules: ['soc-03', 'soc-04'] },
      { number: 3, label: 'Week 3 — Endpoint Investigation & Threat Hunting', modules: ['soc-05', 'soc-06'] },
      { number: 4, label: 'Week 4 — Network, Email & Vulnerability Analysis', modules: ['soc-07', 'soc-08'] },
      { number: 5, label: 'Week 5 — Incident Response & Forensics', modules: ['soc-09', 'soc-10'] },
      { number: 6, label: 'Week 6 — SOC Operations & Capstone', modules: ['soc-11', 'soc-12'] },
    ],
    modules: {
      'soc-01': { number: 1, week: 1, title: 'SOC & Security Architecture', hours: '6–8 Hours', lessons: 9, labs: 1,
        summary: 'Build the foundational knowledge required to understand modern security operations environments.',
        objectives: ['Prioritize one synthetic alert using its outcome, context, and supporting evidence.'],
        topics: [{ items: ['Telemetry sources', 'SIEM analytics', 'XDR alert context', 'Evidence-based prioritization'] }],
        handsOn: [{ title: 'Alert orientation miniature lab', steps: ['Trace a signal to an alert.', 'Compare four synthetic alerts.', 'Submit a scored triage artifact.'] }],
        assessment: { knowledgeCheck: true, practicalLab: true, capstoneGate: false },
        skills: ['SOC Operations', 'SIEM', 'XDR', 'Alert Triage', 'Security Architecture'] },
      'soc-02': { number: 2, week: 1, title: 'Network, Identity & Security Foundations', hours: '6–8 Hours', lessons: 8, labs: 1,
        summary: 'Understand how networks, identities, access controls, and modern security architectures affect security operations.',
        skills: ['IAM', 'Zero Trust', 'MFA', 'RBAC', 'PKI', 'Network Security'] },
      'soc-03': { number: 3, week: 2, title: 'SIEM & Log Analysis', hours: '7–9 Hours', lessons: 10, labs: 2,
        summary: 'Learn how analysts use centralized security telemetry to identify and investigate suspicious activity.',
        skills: ['SIEM', 'Log Analysis', 'Alert Triage', 'Event Correlation', 'Detection'] },
      'soc-04': { number: 4, week: 2, title: 'Detection Engineering, Threat Intelligence & Automation', hours: '6–8 Hours', lessons: 9, labs: 2,
        summary: 'Learn how detections are created, enriched, prioritized, and automated.',
        skills: ['Detection Engineering', 'Threat Intelligence', 'SOAR', 'Automation', 'Regex'] },
      'soc-05': { number: 5, week: 3, title: 'Endpoint & Malware Investigation', hours: '7–9 Hours', lessons: 10, labs: 2,
        summary: 'Investigate suspicious activity occurring on endpoints.',
        skills: ['EDR', 'XDR', 'Malware Analysis', 'Endpoint Investigation', 'Process Analysis'] },
      'soc-06': { number: 6, week: 3, title: 'Threat Hunting & Investigation', hours: '6–8 Hours', lessons: 8, labs: 2,
        summary: 'Move beyond individual alerts and proactively search for evidence of malicious activity.',
        skills: ['Threat Hunting', 'IOC Analysis', 'Correlation', 'Investigation', 'Behavior Analytics'] },
      'soc-07': { number: 7, week: 4, title: 'Network & Email Analysis', hours: '7–9 Hours', lessons: 10, labs: 2,
        summary: 'Analyze network traffic and email evidence during security investigations.',
        skills: ['Packet Analysis', 'DNS', 'Email Security', 'Phishing Analysis', 'Network Investigation'] },
      'soc-08': { number: 8, week: 4, title: 'Vulnerability Management & Exposure Analysis', hours: '9–12 Hours', lessons: 14, labs: 2,
        summary: 'Learn how security teams identify, validate, prioritize, and manage vulnerabilities across enterprise environments.',
        skills: ['Vulnerability Management', 'CVSS', 'CVE', 'Risk Prioritization', 'Remediation', 'Attack Surface Management'] },
      'soc-09': { number: 9, week: 5, title: 'Incident Response', hours: '7–9 Hours', lessons: 10, labs: 1,
        summary: 'Manage security incidents from initial detection through containment and recovery.',
        skills: ['Incident Response', 'Containment', 'Eradication', 'Recovery', 'Escalation'] },
      'soc-10': { number: 10, week: 5, title: 'Digital Evidence, Forensics & Incident Frameworks', hours: '6–8 Hours', lessons: 9, labs: 2,
        summary: 'Understand evidence handling, forensic concepts, and structured incident analysis.',
        skills: ['Digital Forensics', 'Evidence Handling', 'MITRE ATT&CK', 'Root Cause Analysis', 'Incident Analysis'] },
      'soc-11': { number: 11, week: 6, title: 'SOC Operations, Metrics, Reporting & Communication', hours: '6–8 Hours', lessons: 10, labs: 2,
        summary: 'Turn technical findings into actionable information for security teams, leadership, and business stakeholders.',
        skills: ['SOC Operations', 'Security Metrics', 'Reporting', 'Communication', 'Executive Briefing'] },
      'soc-12': { number: 12, week: 6, title: 'SOC Analyst Capstone', hours: '8–12 Hours', lessons: 12, labs: 1, isCapstone: true,
        summary: 'A realistic multi-stage security incident investigated end to end in the Mission Next security operations simulator.',
        skills: ['SIEM Investigation', 'Threat Hunting', 'Incident Response', 'Evidence Handling', 'Security Reporting'] },
    },
  },
  {
    slug: 'ai-ml',
    category: 'Artificial Intelligence',
    icon: 'ri-robot-2-line',
    eyebrow: 'Mission Next',
    cardTitle: 'Foundations of AI & Machine Learning',
    title: 'Foundations of AI & Machine Learning',
    description:
      'Applied Python programming, data preparation, and machine learning model training using modern AI frameworks and tools.',
    badge: 'Pivot to the future of Data Science',
    weeks: 6,
    moduleCount: 12,
    isPublished: false,
    // Aligned to the CRISP-DM lifecycle and current MLOps practice.
    weekGroups: weekGroups([
      'Programming & Data Foundations',
      'Data Preparation & Exploration',
      'Core Machine Learning',
      'Model Quality & Deep Learning',
      'Applied AI & Deployment',
      'Professional Practice & Capstone',
    ], 'aim'),
    modules: skeleton('aim', [
      [1, 1, 'Python Programming Foundations'],
      [2, 1, 'Data Fundamentals, Mathematics & Statistics'],
      [3, 2, 'Data Acquisition, Cleaning & Preparation'],
      [4, 2, 'Exploratory Data Analysis & Visualization'],
      [5, 3, 'Supervised Learning: Regression & Classification'],
      [6, 3, 'Unsupervised Learning & Feature Engineering'],
      [7, 4, 'Model Evaluation, Validation & Tuning'],
      [8, 4, 'Neural Networks & Deep Learning Foundations'],
      [9, 5, 'Applied AI: Language, Vision & Generative Models'],
      [10, 5, 'MLOps: Deployment, Pipelines & Monitoring'],
      [11, 6, 'Responsible AI, Ethics & Communicating Results'],
      [12, 6, 'AI & Machine Learning Capstone'],
    ]),
  },
  {
    slug: 'electrical',
    category: 'Electrical Engineering',
    icon: 'ri-flashlight-line',
    eyebrow: 'Mission Next',
    cardTitle: 'Electrical Engineering Essentials',
    title: 'Electrical Engineering Essentials',
    description:
      "Learn circuit fundamentals, Ohm's Law, digital logic, and electrical troubleshooting techniques used in modern technical environments.",
    badge: 'Rapid entry into Technical Trades',
    weeks: 6,
    moduleCount: 12,
    isPublished: false,
    // Aligned to NCEES FE Electrical fundamentals and NFPA 70E / NEC safety practice.
    weekGroups: weekGroups([
      'Electrical Fundamentals & Safety',
      'AC Theory & Circuit Analysis',
      'Components & Power Electronics',
      'Digital Logic & Machines',
      'Measurement & Troubleshooting',
      'Professional Practice & Capstone',
    ], 'eee'),
    modules: skeleton('eee', [
      [1, 1, 'Electrical Fundamentals & Safety'],
      [2, 1, "DC Circuit Analysis & Ohm's Law"],
      [3, 2, 'AC Fundamentals & Waveforms'],
      [4, 2, 'Series, Parallel & Complex Circuits'],
      [5, 3, 'Components: Resistors, Capacitors & Inductors'],
      [6, 3, 'Semiconductors & Power Electronics'],
      [7, 4, 'Digital Logic & Boolean Algebra'],
      [8, 4, 'Motors, Generators & Transformers'],
      [9, 5, 'Test Equipment & Measurement'],
      [10, 5, 'Electrical Troubleshooting & Fault Isolation'],
      [11, 6, 'Codes, Standards, Schematics & Documentation'],
      [12, 6, 'Electrical Engineering Capstone'],
    ]),
  },
];

/* Normalize EVERY module in EVERY track through the same factory. The SOC track
 * was authored before the standard existed, so this back-fills the keys it is
 * missing rather than requiring a rewrite — and guarantees all four tracks hand
 * the renderer an identical shape. */
/* The program frame is fixed for all four tracks, so the overview stats are too.
 * A track only overrides these if its numbers genuinely differ. */
const STANDARD_STATS = [
  { icon: 'ri-calendar-line', label: 'Duration', value: '6 Weeks' },
  { icon: 'ri-stack-line', label: 'Curriculum', value: '12 Modules' },
  { icon: 'ri-time-line', label: 'Estimated Training', value: '80–100 Hours' },
  { icon: 'ri-flask-line', label: 'Hands-On Training', value: '10–15 Labs + Capstone' },
  { icon: 'ri-global-line', label: 'Delivery', value: 'Online' },
];

PROGRAMS.forEach((p) => {
  if (!p.stats) p.stats = STANDARD_STATS;
  if (!p.skills) p.skills = [];
  if (!p.modules) return;
  Object.entries(p.modules).forEach(([key, m]) => {
    p.modules[key] = mod({ key, status: p.isPublished ? 'published' : 'draft', ...m });
  });
});

const MODULE_ONE_ALERT_ORIENTATION = {
  id: 'M01-L01',
  title: 'Alert Orientation: From Signal to Decision',
  minutes: 25,
  passingScore: 80,
  signalFlow: [
    { icon: 'ri-radar-line', title: 'Telemetry source', description: 'A protected identity, endpoint, or service emits an event describing an observable action.' },
    { icon: 'ri-database-2-line', title: 'SIEM analytics', description: 'Centralized events are normalized and evaluated by detection logic alongside known operating context.' },
    { icon: 'ri-shield-flash-line', title: 'XDR alert context', description: 'The analyst receives an alert with entity, outcome, and evidence details for a priority decision.' },
  ],
  alerts: [
    {
      id: 'M01-A01', severity: 'High', age: '6 min ago', source: 'Network sensor',
      title: 'Port sweep across training subnet', queueNote: 'High-volume discovery activity from a managed assessment host.',
      detectedBy: 'SIEM correlation rule', entity: 'scan-host-04', entityVariants: ['scan-host-04', 'scan-host-11', 'scan-host-18'], ageVariants: ['6 min ago', '8 min ago', '5 min ago'],
      summary: 'One internal source contacted 42 hosts across administrative ports in three minutes.',
      evidence: [
        { id: 'ev-a1-volume', label: 'Connection volume', detail: '42 destinations contacted in three minutes.' },
        { id: 'ev-a1-change', label: 'Approved activity record', detail: 'Change CHG-1842 authorizes a scanner validation in this subnet.' },
        { id: 'ev-a1-owner', label: 'Known asset role', detail: 'scan-host-04 is tagged as a managed assessment system.' },
      ],
    },
    {
      id: 'M01-A02', severity: 'Medium', age: '9 min ago', source: 'Identity sensor',
      title: 'Repeated failed sign-ins', queueNote: 'Failures stopped after the account owner completed a password reset.',
      detectedBy: 'Identity anomaly rule', entity: 'user-014', entityVariants: ['user-014', 'user-032', 'user-046'], ageVariants: ['9 min ago', '11 min ago', '7 min ago'],
      summary: 'Six password failures occurred from the usual managed device; no access succeeded.',
      evidence: [
        { id: 'ev-a2-fail', label: 'Authentication outcome', detail: 'All six attempts failed; no session was issued.' },
        { id: 'ev-a2-device', label: 'Device familiarity', detail: 'The attempts came from the user\'s usual managed device.' },
        { id: 'ev-a2-reset', label: 'Support context', detail: 'A completed password-reset request aligns with the timestamps.' },
      ],
    },
    {
      id: 'M01-A03', severity: 'Medium', age: '12 min ago', source: 'Identity + XDR',
      title: 'Failed sign-ins followed by successful access', queueNote: 'The final attempt succeeded from context not previously observed for this entity.',
      detectedBy: 'XDR identity alert', entity: 'user-027', entityVariants: ['user-027', 'user-041', 'user-053'], ageVariants: ['12 min ago', '14 min ago', '10 min ago'],
      summary: 'Seven password failures were followed by a successful browser session within four minutes.',
      evidence: [
        { id: 'ev-a3-sequence', label: 'Outcome changed', detail: 'Seven failures were followed by one successful sign-in.' },
        { id: 'ev-a3-context', label: 'New access context', detail: 'The success came from a new region and an unmanaged browser.' },
        { id: 'ev-a3-baseline', label: 'Routine baseline', detail: 'Earlier activity for this entity used a managed device in the usual region.' },
      ],
    },
    {
      id: 'M01-A04', severity: 'Low', age: '18 min ago', source: 'Endpoint sensor',
      title: 'Unsigned utility blocked', queueNote: 'Preventive control stopped the file before execution on a packaging workstation.',
      detectedBy: 'Endpoint prevention rule', entity: 'pkg-wkstn-08', entityVariants: ['pkg-wkstn-08', 'pkg-wkstn-12', 'pkg-wkstn-19'], ageVariants: ['18 min ago', '16 min ago', '20 min ago'],
      summary: 'An unsigned internal packaging utility was written to disk and blocked before execution.',
      evidence: [
        { id: 'ev-a4-block', label: 'Control outcome', detail: 'The file was blocked before a process started.' },
        { id: 'ev-a4-path', label: 'Expected location', detail: 'The file appeared in the approved packaging test directory.' },
        { id: 'ev-a4-ticket', label: 'Change context', detail: 'Packaging test CHG-1851 names this workstation and utility.' },
      ],
    },
  ],
  analysisOptions: [
    { id: 'severity-only', text: 'The highest severity alert must always be first, regardless of operating context.' },
    { id: 'sequence-context', text: 'A failed-to-successful sequence plus new unmanaged access context creates the strongest unexplained risk.' },
    { id: 'blocked-means-compromise', text: 'Any blocked action proves the affected entity is compromised.' },
  ],
  decisionOptions: [
    { id: 'validate-escalate', text: 'Escalate for identity validation and attach the selected evidence; do not take unsupported broad containment.' },
    { id: 'close-benign', text: 'Close as benign because the alert severity is only Medium.' },
    { id: 'isolate-network', text: 'Immediately isolate every system in the training subnet.' },
    { id: 'suppress-rule', text: 'Suppress the identity rule for all users to reduce queue volume.' },
  ],
  correctAlert: 'M01-A03',
  correctEvidence: ['ev-a3-sequence', 'ev-a3-context'],
  correctAnalysis: 'sequence-context',
  correctDecision: 'validate-escalate',
};

/* The SOC Analyst lab catalogue. `simEntry` is the ONLY place the portal knows
 * a simulator route — see PLATFORM_ARCHITECTURE.md §7.3. */
const LABS = [
  { key: 'lab-soc-environment', module: 'soc-01', title: 'Alert Orientation: From Signal to Decision', difficulty: 'Foundational', minutes: 25,
    description: 'Trace how telemetry becomes an alert, compare a limited synthetic queue, and submit one evidence-based priority decision.',
    skills: ['SOC Operations', 'SIEM', 'XDR', 'Alert Triage'], portalEntry: '#/program/soc-analyst/module/1' },
  { key: 'lab-identity-investigation', module: 'soc-02', title: 'Suspicious Authentication Investigation', difficulty: 'Foundational', minutes: 35,
    description: 'Review user sign-in events, analyze privilege changes, and identify risky identity behavior.',
    skills: ['IAM', 'Sign-in Analysis', 'Privilege Escalation'], simEntry: '#/entra/risky-users' },
  { key: 'lab-siem-triage', module: 'soc-03', title: 'SIEM Alert Triage', difficulty: 'Intermediate', minutes: 45,
    description: 'Open and triage security alerts, correlate events across multiple sources, and identify suspicious patterns.',
    skills: ['SIEM', 'Alert Triage', 'Event Correlation'], simEntry: '#/sentinel/incidents' },
  { key: 'lab-detection-rule', module: 'soc-04', title: 'Detection Rule Review & Enrichment', difficulty: 'Intermediate', minutes: 45,
    description: 'Review a detection rule, investigate matched indicators, enrich an alert with threat intelligence, and run an automated response.',
    skills: ['Detection Engineering', 'Threat Intelligence', 'SOAR'], simEntry: '#/sentinel/analytics' },
  { key: 'lab-endpoint-investigation', module: 'soc-05', title: 'Infected Workstation Investigation', difficulty: 'Intermediate', minutes: 50,
    description: 'Follow a process tree, review file and registry activity, validate file reputation, and isolate a compromised endpoint.',
    skills: ['EDR', 'Process Analysis', 'Endpoint Containment'], simEntry: '#/defender/devices' },
  { key: 'lab-threat-hunt', module: 'soc-06', title: 'Cross-Device Threat Hunt', difficulty: 'Advanced', minutes: 60,
    description: 'Develop a hunting hypothesis, hunt across multiple endpoints, and pivot between users, hosts, IP addresses, and files.',
    skills: ['Threat Hunting', 'IOC Analysis', 'Pivoting'], simEntry: '#/defender/hunting' },
  { key: 'lab-email-triage', module: 'soc-07', title: 'Suspicious Email Investigation', difficulty: 'Intermediate', minutes: 45,
    description: 'Analyze a suspicious email, inspect authentication controls, investigate URLs, and determine whether the message represents a security threat.',
    skills: ['Email Headers', 'SPF', 'DKIM', 'DMARC', 'Threat Intelligence'], simEntry: '#/defender/email' },
  { key: 'lab-network-investigation', module: 'soc-07', title: 'Network Investigation', difficulty: 'Intermediate', minutes: 40,
    description: 'Review connection telemetry, analyze DNS activity, identify suspicious traffic, and correlate it back to an endpoint.',
    skills: ['Packet Analysis', 'DNS', 'Network Investigation'], simEntry: '#/defender/hunting' },
  { key: 'lab-vuln-prioritization', module: 'soc-08', title: 'Vulnerability Prioritization', difficulty: 'Intermediate', minutes: 50,
    description: 'Review a scan, assess CVE and CVSS data, weigh asset criticality and exploitability, and prioritize remediation.',
    skills: ['CVE', 'CVSS', 'Risk Prioritization'], simEntry: '#/defender/vuln-management' },
  { key: 'lab-vuln-queue', module: 'soc-08', title: 'Vulnerability Analyst Queue', difficulty: 'Advanced', minutes: 45,
    description: 'Work a queue of findings and decide: fix now, schedule, compensating control, accept risk, escalate, or false positive.',
    skills: ['Vulnerability Management', 'Risk Decisions', 'Remediation'], simEntry: '#/defender/vuln-management' },
  { key: 'lab-active-incident', module: 'soc-09', title: 'Active Security Incident', difficulty: 'Advanced', minutes: 60,
    description: 'Validate an incident, determine scope and severity, contain the endpoint, disable the account, block the indicator, and verify recovery.',
    skills: ['Incident Response', 'Containment', 'Recovery'], simEntry: '#/defender/incidents' },
  { key: 'lab-evidence-collection', module: 'soc-10', title: 'Evidence Collection & Chain of Custody', difficulty: 'Intermediate', minutes: 40,
    description: 'Identify and acquire evidence, generate a hash, record acquisition time, and complete a chain-of-custody record.',
    skills: ['Evidence Handling', 'Hash Validation', 'Chain of Custody'], simEntry: '#/defender/incidents' },
  { key: 'lab-attack-mapping', module: 'soc-10', title: 'ATT&CK Attack Mapping', difficulty: 'Intermediate', minutes: 35,
    description: 'Map observed attacker behavior to attack stage, ATT&CK tactic and technique, supporting evidence, and analyst conclusion.',
    skills: ['MITRE ATT&CK', 'Incident Analysis'], simEntry: '#/defender/incidents' },
  { key: 'lab-exec-report', module: 'soc-11', title: 'Executive Incident Report', difficulty: 'Advanced', minutes: 50,
    description: 'Transform technical evidence into an executive summary, timeline, impact assessment, root cause, and recommendations.',
    skills: ['Reporting', 'Executive Briefing', 'Communication'], simEntry: '#/defender/incidents' },
  { key: 'lab-soc-metrics', module: 'soc-11', title: 'SOC Metrics Dashboard', difficulty: 'Intermediate', minutes: 30,
    description: 'Review alert volume, false-positive rate, vulnerability backlog, MTTD and MTTR, and identify areas requiring improvement.',
    skills: ['Security Metrics', 'SOC Operations'], simEntry: '#/sentinel/workbooks' },
  { key: 'lab-capstone', module: 'soc-12', title: 'SOC Analyst Capstone', difficulty: 'Advanced', minutes: 600, isCapstone: true,
    description: 'A twelve-stage security investigation spanning email, identity, endpoint, network, threat intelligence, hunting, vulnerability analysis, response, evidence, and reporting.',
    skills: ['Full Investigation Lifecycle'], simEntry: '#/defender/home' },
];

/* ---------------------------------------------------------------------------
 * DEMO ACCOUNTS — prototype only.
 *
 * This is a mock of Supabase auth so the entitlement behavior can be reviewed
 * before the real project is wired up. There is no password hashing, no token,
 * and no security value here; every account is fictional and local-only.
 * Agent 39 (SPRINT_PLAN.md) replaces this wholesale with supabase.auth.
 *
 * `enrollments` mirrors the real table: status, access_mode, and — for
 * access_mode 'partial' — the entitled module keys.
 *
 * Sign in with the bare username (user1) or the full email. Password matches
 * the username in every case. Each account covers one entitlement scenario.
 * ------------------------------------------------------------------------ */

const DEMO_USERS = [
  {
    username: 'user1',
    password: 'user1',
    email: 'user1@mntacademy.test',
    name: 'Helpdesk Student',
    note: 'IT Help Desk & Career Accelerator — other three locked',
    enrollments: [
      { programSlug: 'it-support', status: 'active', accessMode: 'full', purchasedAt: '2026-06-15' },
    ],
    progress: {},
  },
  {
    username: 'user2',
    password: 'user2',
    email: 'user2@mntacademy.test',
    name: 'SOC Analyst Student',
    note: 'Security Operation Center (SOC) Analyst — other three locked',
    enrollments: [
      { programSlug: 'soc-analyst', status: 'active', accessMode: 'full', purchasedAt: '2026-07-01' },
    ],
    progress: { 'soc-01': 'complete', 'soc-02': 'complete', 'soc-03': 'complete', 'soc-04': 'complete', 'soc-05': 'in_progress' },
  },
  {
    username: 'user3',
    password: 'user3',
    email: 'user3@mntacademy.test',
    name: 'AI Engineering Student',
    note: 'Foundations of AI & Machine Learning — other three locked',
    enrollments: [
      { programSlug: 'ai-ml', status: 'active', accessMode: 'full', purchasedAt: '2026-07-20' },
    ],
    progress: {},
  },
  {
    username: 'user4',
    password: 'user4',
    email: 'user4@mntacademy.test',
    name: 'Electrical Engineering Student',
    note: 'Electrical Engineering Essentials — other three locked',
    enrollments: [
      { programSlug: 'electrical', status: 'active', accessMode: 'full', purchasedAt: '2026-08-05' },
    ],
    progress: {},
  },
];

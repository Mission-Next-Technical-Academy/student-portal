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
        summary: 'Start from the beginning: learn what a SOC analyst does, how security signals become incidents, and where triage fits in the response lifecycle.',
        objectives: ['Explain the SOC analyst role and complete one coached, evidence-based alert triage and handoff.'],
        topics: [{ items: ['SOC purpose and analyst roles', 'Events, alerts, and incidents', 'SIEM, EDR, and XDR basics', 'Incident response lifecycle', 'Triage and escalation'] }],
        handsOn: [{ title: 'Your first SOC alert', steps: ['Reveal and interpret four identity facts.', 'Classify and prioritize one clear incident.', 'Create a documented escalation handoff.'] }],
        assessment: { knowledgeCheck: true, practicalLab: true, capstoneGate: false },
        skills: ['SOC Operations', 'SIEM', 'XDR', 'Alert Triage', 'Incident Response Lifecycle', 'Security Architecture'] },
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
  title: 'Your First SOC Alert: A Guided Triage',
  minutes: 20,
  passingScore: 70,
  lessons: [
    {
      number: 1,
      icon: 'ri-shield-check-line',
      title: 'What is cybersecurity protecting?',
      summary: 'Cybersecurity reduces the chance that technology failures or attacks harm people, operations, data, and trust.',
      detail: 'Organizations depend on identities, devices, networks, applications, cloud services, and data. Security work protects confidentiality (only authorized access), integrity (accurate and trustworthy systems and data), and availability (services work when needed). A SOC focuses on detecting and responding when those protections may be failing.',
      takeaway: 'Security exists to protect the mission—not merely to operate security tools.',
    },
    {
      number: 2,
      icon: 'ri-building-2-line',
      title: 'What is a SOC?',
      summary: 'A Security Operations Center is the people, processes, and technology used to monitor, detect, investigate, and respond to security threats.',
      detail: 'A SOC may be a physical room, a distributed team, or a service provider. The important idea is the function: someone continuously watches the organization\'s security signals and coordinates action when something may be wrong.',
      takeaway: 'The SOC is a team and an operating function—not a single tool.',
    },
    {
      number: 3,
      icon: 'ri-user-search-line',
      title: 'What does a SOC analyst do?',
      summary: 'A SOC analyst turns incomplete security signals into defensible decisions.',
      detail: 'An entry-level analyst monitors the alert queue, validates what happened, gathers context, estimates scope and impact, documents evidence, closes explained activity, and escalates credible threats. Tier 2 responders handle deeper cases; detection engineers improve alert logic; threat hunters search for missed activity; and SOC leads coordinate priorities and communication.',
      takeaway: 'The job is observe, verify, decide, document, and communicate. Escalation is a successful handoff—not a failure.',
    },
    {
      number: 4,
      icon: 'ri-pulse-line',
      title: 'Event, alert, and incident',
      summary: 'These words describe different levels of security meaning.',
      detail: 'An event is a recorded action, such as a sign-in. A signal is an event or pattern that may matter. A detection rule evaluates signals. An alert says the rule found something worth review. An incident is confirmed or strongly suspected harmful activity that requires coordinated response.',
      takeaway: 'An alert is a question. Investigation supplies the answer.',
    },
    {
      number: 5,
      icon: 'ri-radar-line',
      title: 'Where alerts come from',
      summary: 'Security controls collect telemetry from identities, endpoints, networks, email, applications, and cloud services.',
      detail: 'A SIEM centralizes and analyzes events from many sources. EDR monitors endpoints. XDR connects evidence across several security domains. These tools help analysts see patterns, but tools do not replace evidence-based judgment.',
      takeaway: 'Telemetry is the raw material; context turns it into meaning.',
    },
    {
      number: 6,
      icon: 'ri-filter-3-line',
      title: 'How alert triage works',
      summary: 'Triage is the fast, structured first review that decides whether an alert can close or needs investigation and response.',
      detail: 'Read the alert, verify observable facts, add user and asset context, check whether the action succeeded, estimate scope and impact, classify it, choose a proportional next step, and document why. A true positive is correctly detected harmful activity; a benign positive is real but authorized; a false positive is classified incorrectly.',
      takeaway: 'An alert is a lead. Triage tests that lead against evidence.',
    },
    {
      number: 7,
      icon: 'ri-alarm-warning-line',
      title: 'Severity, priority, and escalation',
      summary: 'Severity estimates potential harm; priority determines how quickly the team should act.',
      detail: 'Analysts consider whether the action succeeded, what was affected, business criticality, confidence, scope, and available controls. They follow the organization\'s severity matrix and playbooks. Entry-level analysts should not invent containment actions or exceed their authority; they preserve evidence and hand off clearly.',
      takeaway: 'Outcome + context + impact determine priority; the alert label alone does not.',
    },
    {
      number: 8,
      icon: 'ri-cycle-line',
      title: 'Incident response lifecycle',
      summary: 'The lifecycle organizes work before, during, and after an incident.',
      detail: 'Organizations use slightly different frameworks, but the same work appears repeatedly: prepare; detect and analyze; contain; eradicate; recover; and learn. Triage occurs mainly during detection and analysis, then hands verified findings into response.',
      takeaway: 'Triage decides whether response is needed and gives responders a reliable starting point.',
    },
    {
      number: 9,
      icon: 'ri-file-text-line',
      title: 'Document and escalate',
      summary: 'A useful case note lets the next person act without repeating your work.',
      detail: 'State what happened, name the affected entity, cite the strongest evidence, record your classification and priority, and recommend the next authorized action. Separate observed facts from assumptions and include timestamps when they matter.',
      takeaway: 'If it is not documented, the next analyst cannot safely rely on it.',
    },
  ],
  signalFlow: [
    { icon: 'ri-pulse-line', title: '1. Activity occurs', description: 'A user signs in, a process starts, or a network connection is made.' },
    { icon: 'ri-database-2-line', title: '2. Telemetry is recorded', description: 'A security control stores facts such as time, user, device, location, and outcome.' },
    { icon: 'ri-radar-line', title: '3. A rule detects a pattern', description: 'Detection logic finds activity that matches a suspicious behavior or known threat.' },
    { icon: 'ri-user-search-line', title: '4. The analyst investigates', description: 'The analyst verifies facts, adds context, decides what it means, and documents the next step.' },
  ],
  lifecycle: [
    { id: 'prepare', icon: 'ri-tools-line', title: 'Prepare', description: 'Define roles, logging, playbooks, access, communications, and backups before an incident.' },
    { id: 'detect-analyze', icon: 'ri-search-eye-line', title: 'Detect & analyze', description: 'Validate the signal, determine what happened, estimate scope and impact, and declare an incident when warranted.' },
    { id: 'contain', icon: 'ri-shield-keyhole-line', title: 'Contain', description: 'Limit harm—for example, revoke a session or isolate a device—under an approved playbook.' },
    { id: 'eradicate', icon: 'ri-delete-bin-6-line', title: 'Eradicate', description: 'Remove the cause and attacker foothold, such as malware, persistence, or stolen credentials.' },
    { id: 'recover', icon: 'ri-refresh-line', title: 'Recover', description: 'Restore normal operations carefully, monitor for recurrence, and confirm controls are working.' },
    { id: 'learn', icon: 'ri-lightbulb-flash-line', title: 'Learn', description: 'Capture lessons, improve detections and playbooks, and assign follow-up actions.' },
  ],
  triageLoop: [
    { title: 'Read', description: 'What does the alert claim happened?' },
    { title: 'Verify', description: 'Which observable facts support or weaken the claim?' },
    { title: 'Scope', description: 'Which users, devices, and systems are affected?' },
    { title: 'Decide', description: 'Is it harmful, how urgent is it, and what should happen next?' },
    { title: 'Document', description: 'Can another analyst understand and act on your reasoning?' },
  ],
  officialReferences: [
    {
      label: 'CompTIA CySA+ V4 (CS0-004)',
      url: 'https://www.comptia.org/en-us/certifications/cybersecurity-analyst/v4/',
      description: 'Current certification scope: security operations, vulnerability management, incident response and management, and reporting and communication. CompTIA recommends about four years in a SOC or vulnerability-analyst role.',
    },
    {
      label: 'NIST NICE Workforce Framework',
      url: 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/about',
      description: 'Official work-role framework used to ground the analyst role in observable tasks, knowledge, and skills rather than a vendor product or job title.',
    },
    {
      label: 'U.S. O*NET — Information Security Analysts',
      url: 'https://www.onetonline.org/link/summary/15-1212.00',
      description: 'Official occupational reference covering monitoring security measures, assessing risk, documenting work, and responding to security breaches.',
    },
  ],
  scenario: {
    id: 'ALT-1001',
    source: 'Identity protection',
    detectedBy: 'Repeated failures followed by success',
    initialSeverity: 'Medium',
    title: 'Successful sign-in after repeated failures',
    summary: 'Eight failed password attempts were followed by a successful sign-in to one employee account.',
    entity: 'j.santos',
    created: '09:10',
    // Facts 1-3 are recorded, not revealed: the student read them in the console
    // walkthrough and now writes them down from the log, which is what a case
    // note actually is. `accept` is deliberately generous — this is recall of
    // evidence, not a spelling test. Fact 4 arrives by phone, so it is handed
    // over rather than asked for.
    evidence: [
      { id: 'timeline', time: '09:02–09:08', icon: 'ri-close-circle-line', label: 'Eight failed sign-ins',
        detail: 'All failures targeted j.santos from 185.220.101.24.',
        prompt: 'Between 09:02 and 09:08 the sign-in log recorded a burst of failures. Record what it showed.',
        template: '{count} failed sign-ins targeted {account} from {ip}.',
        blanks: [
          { key: 'count', label: 'How many failures', size: 4, answer: '8',
            accept: ['8', 'eight'], hint: 'Count the red Failure rows once the log is filtered to one account.' },
          { key: 'account', label: 'Account targeted', size: 30, answer: 'j.santos@missionnextlabs.example',
            accept: ['j.santos', 'j.santos@missionnextlabs.example', 'julia santos', 'jsantos'],
            hint: 'The User column — the account you filtered the log to.' },
          { key: 'ip', label: 'Source IP address', size: 16, answer: '185.220.101.24',
            accept: ['185.220.101.24'], hint: 'The IP address column, identical on every failure row.' },
        ] },
      { id: 'success', time: '09:09', icon: 'ri-login-box-line', label: 'A sign-in succeeded',
        detail: 'The same source obtained a browser session one minute later.',
        prompt: 'The ninth attempt is the one that changes the case. Record what happened to it.',
        template: 'At {time} the same source produced a {result}.',
        blanks: [
          { key: 'time', label: 'Time of the ninth attempt', size: 10, answer: '09:09:41',
            accept: ['09:09', '09:09:41', '9:09', '9:09:41', '0909'], hint: 'The first row that is not a failure.' },
          { key: 'result', label: 'Its result', size: 12, answer: 'Success',
            accept: ['success', 'successful', 'succeeded', 'successful sign-in', 'success.'],
            hint: 'The Result column — one word, and it is not "Failure".' },
        ] },
      { id: 'context', time: '09:09', icon: 'ri-map-pin-line', label: 'The context is unfamiliar',
        detail: 'The source is in Bucharest, Romania, using an unmanaged browser. The user normally signs in from Berlin on a managed laptop.',
        prompt: 'Open the successful sign-in and record the context around it.',
        template: 'The sign-in came from {city}, on an {device} device, and the platform scored it {risk} risk.',
        blanks: [
          { key: 'city', label: 'Location', size: 18, answer: 'Bucharest',
            accept: ['bucharest', 'bucharest, romania', 'bucuresti', 'romania', 'ro'],
            hint: 'The Location tab of the detail pane — the user normally signs in from Berlin.' },
          { key: 'device', label: 'Device status', size: 16, answer: 'unmanaged',
            accept: ['unmanaged', 'unregistered', 'unknown', 'not registered', 'unmanaged browser', 'browser (unmanaged)'],
            hint: 'The Device info tab — was this laptop enrolled in management?' },
          { key: 'risk', label: 'Risk the platform assigned', size: 10, answer: 'High',
            accept: ['high', 'high risk'], hint: 'Basic info shows the platform\'s own risk score for this sign-in.' },
        ] },
      { id: 'confirmation', time: '09:14', icon: 'ri-phone-line', label: 'The user denies the activity', detail: 'The service desk reached the account owner through the registered phone number. The user confirms they did not attempt the sign-ins.' },
    ],
    scope: 'One employee identity is confirmed affected. No endpoint or additional account is yet linked.',
  },
  verdictOptions: [
    { id: 'true-positive', text: 'True positive — confirmed unauthorized account access', help: 'The activity is real, the sign-in succeeded, and the user denies it.' },
    { id: 'benign-positive', text: 'Benign positive — real but authorized activity', help: 'Use this only when the activity is expected and approved.' },
    { id: 'false-positive', text: 'False positive — the detection described the activity incorrectly', help: 'Use this when the alert logic or data is wrong.' },
  ],
  priorityOptions: [
    { id: 'high', text: 'High — begin the identity response path now' },
    { id: 'medium', text: 'Medium — leave it in the normal queue' },
    { id: 'low', text: 'Low — no prompt response is needed' },
  ],
  phaseOptions: [
    { id: 'detect-analyze', text: 'Detect & analyze — we are validating and classifying the alert' },
    { id: 'contain', text: 'Contain — all affected access has already been limited' },
    { id: 'recover', text: 'Recover — normal operation has already been restored and verified' },
  ],
  decisionOptions: [
    { id: 'escalate-identity', text: 'Create/escalate the incident with the evidence and follow the approved identity-containment playbook', help: 'A responder can revoke sessions, reset credentials, and check for follow-on activity according to authorization.' },
    { id: 'close-alert', text: 'Close the alert because only one user is affected', help: 'Small scope does not make confirmed unauthorized access safe.' },
    { id: 'isolate-network', text: 'Isolate every device on the company network', help: 'This is unsupported and far wider than the observed identity scope.' },
  ],
  correctVerdict: 'true-positive',
  correctPriority: 'high',
  correctPhase: 'detect-analyze',
  correctDecision: 'escalate-identity',
};

/* The SOC Analyst lab catalogue. `simEntry` is the ONLY place the portal knows
 * a simulator route — see PLATFORM_ARCHITECTURE.md §7.3. */
const LABS = [
  { key: 'lab-soc-environment', module: 'soc-01', title: 'Your First SOC Alert: A Guided Triage', difficulty: 'Foundational', minutes: 20,
    description: 'Learn what a SOC analyst does, follow the incident response lifecycle, and triage one clear identity alert with step-by-step coaching.',
    skills: ['SOC Operations', 'Incident Response Lifecycle', 'Alert Triage', 'Case Notes'], portalEntry: '#/program/soc-analyst/module/1' },
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

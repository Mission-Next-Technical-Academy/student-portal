/* MNT Academy portal prototype — catalogue + demo accounts.
 *
 * This mirrors the shape of src/content/programs/<slug>.ts described in
 * PLATFORM_ARCHITECTURE.md §5A.2. One object per track, no cross-references,
 * so each track author owns exactly one entry.
 *
 * Published programme copy must follow the current governing curriculum
 * source for that track. Draft tracks may retain their existing catalogue
 * positioning, but must not inherit invented hour or lab estimates.
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
  hours: '',            // exact display duration when the curriculum is mapped
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

/* ---------------------------------------------------------------------------
 * SOC CURRICULUM COMPLIANCE MAP
 *
 * This is a developer-authored mapping derived from the 2026-08-28 LMS review
 * checklist. The controlling Form 301 and current catalogue are not stored in
 * this repository, so these item labels, minute allocations, and evaluation
 * methods remain pending curriculum and compliance review. Assessment activity
 * is embedded in each duration and must never be added to the clock-hour total
 * a second time.
 * ------------------------------------------------------------------------ */

const SOC_CURRICULUM_REVISION = '2026-08-28-developer-map-v1';

function curriculumItem(spec) {
  return {
    kind: 'lesson',
    classification: 'theory',
    learn: `Study the ${spec.title} instructional block and its worked examples.`,
    practice: `Apply ${spec.title.toLowerCase()} to the module's synthetic SOC scenario.`,
    prove: 'Explain the decision and cite the scenario evidence that supports it.',
    evidence: 'Saved knowledge check and written scenario rationale.',
    assessmentMethod: 'Embedded knowledge check and scenario response; assessment time is included in durationMinutes.',
    facultyEvaluation: 'Faculty reviews the saved response for technical accuracy, evidence use, and appropriate scope.',
    securityPlusTags: [],
    revision: SOC_CURRICULUM_REVISION,
    ...spec,
  };
}

function allocation(code, minutes) {
  return { code, minutes };
}

function m360Item(key, title, objective) {
  return {
    key,
    kind: 'career-readiness',
    title,
    durationMinutes: 90,
    classification: 'theory',
    parentAllocations: [allocation('M360-101', 90)],
    objective,
    learn: `Review Mission Next guidance and examples for ${title.toLowerCase()}.`,
    practice: `Draft or rehearse the ${title.toLowerCase()} activity using the learner's current career materials.`,
    prove: 'Submit the assigned career-readiness artifact or recorded practice reflection.',
    evidence: 'Saved M360 artifact or faculty-observed practice record.',
    assessmentMethod: 'Embedded artifact review or observed practice; assessment time is included in durationMinutes.',
    facultyEvaluation: 'Faculty evaluates completion, professional relevance, and required revision using the M360 activity criteria.',
    securityPlusTags: [],
    revision: SOC_CURRICULUM_REVISION,
  };
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
    cardTitle: 'Mission Next: Security Operation Center (SOC) Analyst',
    title: 'Mission Next: Security Operation Center (SOC) Analyst',
    tagline: 'Learn to Investigate. Detect. Respond.',
    description:
      'Prepare for entry-level SOC Analyst roles through hands-on network operations, attack-method analysis, alert triage, SIEM and log review, incident response, and security monitoring workflows.',
    intro:
      'Build evidence-based investigation, detection, response, escalation, documentation, and analyst communication skills in focused fictional environments.',
    badge: 'Secure a role in Cybersecurity Ops',
    weeks: 6,
    moduleCount: 12,
    isPublished: true,
    compliance: {
      revision: SOC_CURRICULUM_REVISION,
      programName: 'Mission Next: Security Operation Center (SOC) Analyst',
      credential: 'Diploma',
      delivery: 'Online / approved distance education',
      weeks: 6,
      tuition: 3000,
      technicalHours: 70,
      careerHours: 12,
      totalHours: 82,
      theoryHours: 42,
      labHours: 40,
      passingPercent: 70,
      attendancePercent: 80,
      status: 'developer-mapped',
      sourceNotes: [
        'Mapped from the 2026-08-28 Mission Next SOC Analyst LMS Build Review checklist.',
        'The controlling Form 301 and current catalogue are not present in this repository.',
        'Curriculum labels, minute allocations, theory/lab allocations, and evaluation methods remain pending curriculum and compliance review.',
      ],
    },
    parents: [
      { code: 'SOC-101.1', title: 'Program Orientation, LMS Navigation, SOC Role Overview, and Security Operations Workflow', hours: 3, theoryMinutes: 180, labMinutes: 0, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.2', title: 'Network Operations Fundamentals, Protocols, Traffic Flow, and Security Architecture', hours: 10, theoryMinutes: 600, labMinutes: 0, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.3', title: 'Network Attack Methods, Common Threat Vectors, and Adversary Techniques', hours: 10, theoryMinutes: 165, labMinutes: 435, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.4', title: 'Detection Mechanisms, Alert Triage, Indicators of Compromise, and Event Review', hours: 12, theoryMinutes: 375, labMinutes: 345, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.5', title: 'Packet Capture, Log Review, IDS/IPS Concepts, and SIEM Scenario Analysis', hours: 14, theoryMinutes: 150, labMinutes: 690, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.6', title: 'Incident Response Fundamentals, Escalation, Documentation, and Case Handling', hours: 9, theoryMinutes: 150, labMinutes: 390, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.7', title: 'Automated Detection Tools, Security Monitoring Methodologies, and Analyst Workflow', hours: 8, theoryMinutes: 180, labMinutes: 300, reviewStatus: 'developer-mapped' },
      { code: 'SOC-101.8', title: 'Capstone: SOC Case Study, Threat Detection Scenario, and Analyst Report', hours: 4, theoryMinutes: 0, labMinutes: 240, reviewStatus: 'developer-mapped' },
    ],
    careerReadiness: {
      code: 'M360-101',
      title: 'Personal Branding, Career Positioning, LinkedIn Optimization, Resume Development, Interview Preparation, and Career Spotlight',
      durationMinutes: 720,
      hours: 12,
      classification: 'theory',
      boundary: 'Separate companion course; excluded from technical SOC module progress and the 70-hour technical roll-up.',
      progressNamespace: 'mnt.m360-101.progress.v1',
      status: 'developer-mapped',
      curriculumComplianceReview: 'pending',
      revision: SOC_CURRICULUM_REVISION,
      items: [
        m360Item('m360-101-personal-branding', 'Personal Branding', 'Define a consistent professional identity grounded in the learner\'s experience and target role.'),
        m360Item('m360-101-career-positioning', 'Career Positioning', 'Connect transferable experience and current training to an appropriate entry-level career target.'),
        m360Item('m360-101-linkedin-optimization', 'LinkedIn Optimization', 'Revise a professional profile so role focus, skills, and experience are clear and supportable.'),
        m360Item('m360-101-resume-development', 'Resume Development', 'Produce a role-focused resume that accurately presents relevant accomplishments and training.'),
        m360Item('m360-101-interview-preparation', 'Interview Preparation', 'Prepare and rehearse concise evidence-based responses to common interview questions.'),
        m360Item('m360-101-professional-follow-up', 'Professional Follow-Up', 'Draft timely and appropriate follow-up communication for recruiting and networking interactions.'),
        m360Item('m360-101-mentorship', 'Mentorship', 'Use structured mentor feedback to identify and complete a career-readiness improvement.'),
        m360Item('m360-101-career-spotlight', 'Career Spotlight', 'Present a concise career narrative and next-step plan for faculty or peer review.'),
      ],
    },
    stats: [
      { icon: 'ri-calendar-line', label: 'Duration', value: '6 Weeks' },
      { icon: 'ri-stack-line', label: 'Learning Experience', value: '12 Modules' },
      { icon: 'ri-time-line', label: 'Approved Program', value: '82 Clock Hours' },
      { icon: 'ri-flask-line', label: 'Lab Instruction', value: '40 Hours' },
      { icon: 'ri-global-line', label: 'Delivery', value: 'Online' },
      { icon: 'ri-award-line', label: 'Credential', value: 'Diploma' },
    ],
    skills: [
      'SIEM', 'XDR', 'Threat Detection', 'Incident Response', 'Threat Hunting',
      'Vulnerability Prioritization', 'Network Analysis', 'Email Security', 'Security Operations',
    ],
    weekGroups: [
      { number: 1, label: 'Week 1 — SOC Operations, Network, Identity & Security Foundations', modules: ['soc-01', 'soc-02'] },
      { number: 2, label: 'Week 2 — SIEM, Detection Rules & Automated Monitoring', modules: ['soc-03', 'soc-04'] },
      { number: 3, label: 'Week 3 — Endpoint Investigation & Threat Hunting', modules: ['soc-05', 'soc-06'] },
      { number: 4, label: 'Week 4 — Network, Email & Vulnerability Prioritization', modules: ['soc-07', 'soc-08'] },
      { number: 5, label: 'Week 5 — Incident Response, Evidence & Case Documentation', modules: ['soc-09', 'soc-10'] },
      { number: 6, label: 'Week 6 — SOC Operations & Capstone', modules: ['soc-11', 'soc-12'] },
    ],
    modules: {
      'soc-01': { number: 1, week: 1, title: 'SOC Operations Foundations', hours: '8 Hours', durationMinutes: 480, lessons: 9, labs: 2,
        summary: 'Start from the beginning: learn what a SOC analyst does, how security signals become incidents, and where triage fits in the response lifecycle.',
        objectives: ['Explain the SOC analyst role and complete one coached, evidence-based alert triage and handoff.'],
        topics: [{ items: ['SOC purpose and analyst roles', 'Events, alerts, and incidents', 'SIEM, EDR, and XDR basics', 'Incident response lifecycle', 'Triage and escalation'] }],
        handsOn: [
          { title: 'Lab 1: Guided console walkthrough', steps: ['Open the alert and use only the available buttons.', 'Reveal and interpret the identity evidence in the sandbox.'] },
          { title: 'Lab 2: SIEM incident escalation & handoff', steps: ['Open the SIEM incident view and confirm the affected account.', 'Write the escalation handoff with the strongest evidence and your decision.'] },
        ],
        assessment: { knowledgeCheck: true, practicalLab: true, capstoneGate: false },
        curriculumItems: [
          curriculumItem({ key: 'soc-01-lesson-01', title: 'What is cybersecurity protecting?', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Explain how confidentiality, integrity, and availability support the systems and data monitored by a SOC.' }),
          curriculumItem({ key: 'soc-01-lesson-02', title: 'What is a SOC?', durationMinutes: 25, parentAllocations: [allocation('SOC-101.1', 25)], objective: 'Describe the SOC as an operating function that coordinates monitoring, investigation, and response.' }),
          curriculumItem({ key: 'soc-01-lesson-03', title: 'What does a SOC analyst do?', durationMinutes: 25, parentAllocations: [allocation('SOC-101.1', 25)], objective: 'Distinguish entry-level analyst responsibilities, decision boundaries, and escalation responsibilities.' }),
          curriculumItem({ key: 'soc-01-lesson-04', title: 'Event, alert, and incident', durationMinutes: 20, parentAllocations: [allocation('SOC-101.1', 20)], objective: 'Differentiate recorded events, detection alerts, and declared incidents in an analyst workflow.' }),
          curriculumItem({ key: 'soc-01-lesson-05', title: 'Where alerts come from', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Relate identity, endpoint, network, application, and cloud telemetry to the systems that generate it.' }),
          curriculumItem({ key: 'soc-01-lesson-06', title: 'How alert triage works', durationMinutes: 25, parentAllocations: [allocation('SOC-101.1', 25)], objective: 'Apply a repeatable read, verify, scope, decide, and document triage loop.' }),
          curriculumItem({ key: 'soc-01-lesson-07', title: 'Severity, priority, and escalation', durationMinutes: 30, parentAllocations: [allocation('SOC-101.1', 30)], objective: 'Use impact, confidence, scope, and authority to justify priority and escalation.' }),
          curriculumItem({ key: 'soc-01-lesson-08', title: 'Incident response lifecycle', durationMinutes: 25, parentAllocations: [allocation('SOC-101.1', 25)], objective: 'Place alert validation and analyst handoff within the incident response lifecycle.' }),
          curriculumItem({ key: 'soc-01-lesson-09', title: 'Document and escalate', durationMinutes: 30, parentAllocations: [allocation('SOC-101.1', 30)], objective: 'Write a concise handoff that separates observations, analysis, scope, and the requested next action.' }),
        ],
        skills: ['SOC Operations', 'SIEM', 'XDR', 'Alert Triage', 'Incident Response Lifecycle', 'Security Architecture'] },
      'soc-02': { number: 2, week: 1, title: 'Network, Identity & Security Foundations', hours: '11 Hours', durationMinutes: 660, lessons: 8, labs: 1,
        summary: 'Understand how networks, identities, access controls, and modern security architectures affect security operations.',
        curriculumItems: [
          curriculumItem({ key: 'soc-02-lesson-01', title: 'Network paths', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Interpret a connection using its source, destination, route, protocol, trust zone, and outcome.' }),
          curriculumItem({ key: 'soc-02-lesson-02', title: 'Identity and accounts', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Distinguish human, service, device, and workload identities when reviewing network and access activity.' }),
          curriculumItem({ key: 'soc-02-lesson-03', title: 'Authentication', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Interpret authentication methods and outcomes without treating a successful control decision as proof of authorization.' }),
          curriculumItem({ key: 'soc-02-lesson-04', title: 'Authorization', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Explain how roles and permissions govern resource access after authentication.' }),
          curriculumItem({ key: 'soc-02-lesson-05', title: 'MFA', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Use multi-factor results with device, route, and session context during analyst review.' }),
          curriculumItem({ key: 'soc-02-lesson-06', title: 'RBAC and least privilege', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Assess whether a role assignment has appropriate approval, purpose, and scope.' }),
          curriculumItem({ key: 'soc-02-lesson-07', title: 'PKI', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Interpret certificate subject, issuer, use, expiry, and workload context during security review.' }),
          curriculumItem({ key: 'soc-02-lesson-08', title: 'Zero Trust reasoning', durationMinutes: 60, parentAllocations: [allocation('SOC-101.2', 60)], objective: 'Combine identity, device, network, resource, and risk signals to recommend a proportionate control.' }),
        ],
        skills: ['IAM', 'Zero Trust', 'MFA', 'RBAC', 'PKI', 'Network Security'] },
      'soc-03': { number: 3, week: 2, title: 'SIEM & Log Analysis', hours: '7 Hours 45 Minutes', durationMinutes: 465, lessons: 4, labs: 1,
        summary: 'Learn how analysts use centralized security telemetry to identify and investigate suspicious activity.',
        curriculumItems: [
          curriculumItem({ key: 'soc-03-lesson-01', title: 'Read logs as linked observations', durationMinutes: 45, parentAllocations: [allocation('SOC-101.4', 45)], objective: 'Relate individual log observations to a detection claim while preserving source and time context.' }),
          curriculumItem({ key: 'soc-03-lesson-02', title: 'Normalized log explorer', durationMinutes: 60, parentAllocations: [allocation('SOC-101.5', 60)], objective: 'Compare normalized authentication, directory, application, and system log fields in one timeline.' }),
          curriculumItem({ key: 'soc-03-lesson-03', title: 'Correlation query workbench', durationMinutes: 60, parentAllocations: [allocation('SOC-101.4', 60)], objective: 'Use a bounded query to correlate related events by identity, host, address, and time.' }),
          curriculumItem({ key: 'soc-03-lesson-04', title: 'Build the analyst handoff', durationMinutes: 60, parentAllocations: [allocation('SOC-101.4', 60)], objective: 'Document a supported alert disposition, scope, evidence chain, and escalation request.' }),
        ],
        skills: ['SIEM', 'Log Analysis', 'Alert Triage', 'Event Correlation', 'Detection'] },
      'soc-04': { number: 4, week: 2, title: 'Detection Rules, Threat Intelligence & Automated Monitoring', hours: '5 Hours', durationMinutes: 300, lessons: 4, labs: 1,
        summary: 'Learn how detections are created, enriched, prioritized, and automated.',
        curriculumItems: [
          curriculumItem({ key: 'soc-04-lesson-01', title: 'Balance coverage, fidelity, and action', durationMinutes: 60, parentAllocations: [allocation('SOC-101.4', 60)], objective: 'Explain how detection coverage, false-positive cost, and response risk shape a rule decision.' }),
          curriculumItem({ key: 'soc-04-lesson-02', title: 'Detection logic desk', durationMinutes: 60, parentAllocations: [allocation('SOC-101.4', 60)], objective: 'Review detection conditions, thresholds, grouping, and exclusions against supplied event patterns.' }),
          curriculumItem({ key: 'soc-04-lesson-03', title: 'Threat intelligence desk', durationMinutes: 30, parentAllocations: [allocation('SOC-101.4', 30)], objective: 'Use source quality, recency, and observed context to enrich rather than replace the evidence.' }),
          curriculumItem({ key: 'soc-04-lesson-04', title: 'Automation boundary', durationMinutes: 30, parentAllocations: [allocation('SOC-101.7', 30)], objective: 'Choose a bounded automated action that preserves review and avoids unsupported disruption.' }),
        ],
        skills: ['Detection Rules', 'Threat Intelligence', 'SOAR', 'Automation', 'Regex'] },
      'soc-05': { number: 5, week: 3, title: 'Endpoint & Malware Investigation', hours: '4 Hours 30 Minutes', durationMinutes: 270, lessons: 10, labs: 1,
        summary: 'Investigate suspicious activity occurring on endpoints.',
        curriculumItems: [
          curriculumItem({ key: 'soc-05-lesson-01', title: 'Read endpoint telemetry', durationMinutes: 15, parentAllocations: [allocation('SOC-101.4', 15)], objective: 'Distinguish observed endpoint behavior from a product verdict or inferred intent.' }),
          curriculumItem({ key: 'soc-05-lesson-02', title: 'Follow parent and child processes', durationMinutes: 15, parentAllocations: [allocation('SOC-101.3', 15)], objective: 'Use process ancestry to explain how suspicious execution began.' }),
          curriculumItem({ key: 'soc-05-lesson-03', title: 'Inspect command context', durationMinutes: 15, parentAllocations: [allocation('SOC-101.3', 15)], objective: 'Assess executable path, arguments, user, and time as a combined behavior.' }),
          curriculumItem({ key: 'soc-05-lesson-04', title: 'Build an endpoint timeline', durationMinutes: 15, parentAllocations: [allocation('SOC-101.4', 15)], objective: 'Order endpoint observations to distinguish causal activity from nearby noise.' }),
          curriculumItem({ key: 'soc-05-lesson-05', title: 'Evaluate a file', durationMinutes: 15, parentAllocations: [allocation('SOC-101.3', 15)], objective: 'Combine signer, prevalence, reputation, and execution behavior in a file assessment.' }),
          curriculumItem({ key: 'soc-05-lesson-06', title: 'Use hashes carefully', durationMinutes: 15, parentAllocations: [allocation('SOC-101.3', 15)], objective: 'Use a hash to identify matching bytes without treating novelty as proof of maliciousness.' }),
          curriculumItem({ key: 'soc-05-lesson-07', title: 'Recognize persistence', durationMinutes: 15, parentAllocations: [allocation('SOC-101.4', 15)], objective: 'Relate an autostart change to its creating process, path, and surrounding activity.' }),
          curriculumItem({ key: 'soc-05-lesson-08', title: 'Separate prevention from cleanup', durationMinutes: 15, parentAllocations: [allocation('SOC-101.4', 15)], objective: 'Explain why a blocked artifact may not remove existing execution or persistence.' }),
          curriculumItem({ key: 'soc-05-lesson-09', title: 'Scope proportionally', durationMinutes: 15, parentAllocations: [allocation('SOC-101.6', 15)], objective: 'State the confirmed affected scope and the limits of the available endpoint evidence.' }),
          curriculumItem({ key: 'soc-05-lesson-10', title: 'Write a useful handoff', durationMinutes: 15, parentAllocations: [allocation('SOC-101.6', 15)], objective: 'Prepare an endpoint handoff that separates observation, interpretation, and requested action.' }),
        ],
        skills: ['EDR', 'XDR', 'Malware Analysis', 'Endpoint Investigation', 'Process Analysis'] },
      'soc-06': { number: 6, week: 3, title: 'Threat Hunting & Investigation', hours: '2 Hours 45 Minutes', durationMinutes: 165, lessons: 4, labs: 1,
        summary: 'Move beyond individual alerts and proactively search for evidence of malicious activity.',
        curriculumItems: [
          curriculumItem({ key: 'soc-06-lesson-01', title: 'Start with a testable hypothesis', durationMinutes: 15, parentAllocations: [allocation('SOC-101.7', 15)], objective: 'State an observable hunting hypothesis that available data can support or disprove.' }),
          curriculumItem({ key: 'soc-06-lesson-02', title: 'Use indicators as pivots', durationMinutes: 20, parentAllocations: [allocation('SOC-101.7', 20)], objective: 'Pivot from a seed indicator into related device, identity, time, and behavior context.' }),
          curriculumItem({ key: 'soc-06-lesson-03', title: 'Bookmark the reasoning chain', durationMinutes: 15, parentAllocations: [allocation('SOC-101.6', 15)], objective: 'Preserve the minimum evidence set that establishes behavior and current scope.' }),
          curriculumItem({ key: 'soc-06-lesson-04', title: 'Map behavior after validation', durationMinutes: 25, parentAllocations: [allocation('SOC-101.7', 10), allocation('SOC-101.6', 15)], objective: 'Map only demonstrated adversary behavior and document the investigation limits.' }),
        ],
        skills: ['Threat Hunting', 'IOC Analysis', 'Correlation', 'Investigation', 'Behavior Analytics'] },
      'soc-07': { number: 7, week: 4, title: 'Network & Email Analysis', hours: '10 Hours', durationMinutes: 600, lessons: 4, labs: 2,
        summary: 'Analyze network traffic and email evidence during security investigations.',
        curriculumItems: [
          curriculumItem({ key: 'soc-07-lesson-01', title: 'Follow identity, artifact, delivery, and session', durationMinutes: 30, parentAllocations: [allocation('SOC-101.3', 30)], objective: 'Relate sender identity, message artifacts, delivery, and subsequent network activity without assuming causation.' }),
          curriculumItem({ key: 'soc-07-lesson-02', title: 'Network session ledger', durationMinutes: 45, parentAllocations: [allocation('SOC-101.5', 45)], objective: 'Interpret DNS and TLS session records using time, device, destination, process, and outcome.' }),
          curriculumItem({ key: 'soc-07-lesson-03', title: 'Email evidence and delivery trace', durationMinutes: 45, parentAllocations: [allocation('SOC-101.3', 30), allocation('SOC-101.5', 15)], objective: 'Assess sender alignment, URL and attachment evidence, and delivery scope from the supplied trace.' }),
          curriculumItem({ key: 'soc-07-lesson-04', title: 'Correlation workbench', durationMinutes: 30, parentAllocations: [allocation('SOC-101.5', 30)], objective: 'Correlate the delivered message with associated network observations and state the bounded scope.' }),
        ],
        skills: ['Packet Analysis', 'DNS', 'Email Security', 'Phishing Analysis', 'Network Investigation'] },
      'soc-08': { number: 8, week: 4, title: 'Vulnerability Findings & SOC Prioritization', hours: '6 Hours 45 Minutes', durationMinutes: 405, lessons: 4, labs: 2,
        summary: 'Learn how a SOC analyst validates, prioritizes, and routes vulnerability findings for remediation ownership.',
        curriculumItems: [
          curriculumItem({ key: 'soc-08-lesson-01', title: 'Treat vulnerability data as a decision input', durationMinutes: 30, parentAllocations: [allocation('SOC-101.3', 30)], objective: 'Interpret CVE, CVSS, exploitability, asset role, and exposure as inputs to an analyst decision.' }),
          curriculumItem({ key: 'soc-08-lesson-02', title: 'Exposure-driven remediation priority', durationMinutes: 30, parentAllocations: [allocation('SOC-101.3', 15), allocation('SOC-101.7', 15)], objective: 'Prioritize a finding using exposure, evidence of activity, business context, and available controls.' }),
          curriculumItem({ key: 'soc-08-lesson-03', title: 'Validate before you rank', durationMinutes: 20, parentAllocations: [allocation('SOC-101.7', 20)], objective: 'Validate finding freshness, affected scope, compensating controls, and supporting telemetry before ranking.' }),
          curriculumItem({ key: 'soc-08-lesson-04', title: 'Close the decision loop', durationMinutes: 25, parentAllocations: [allocation('SOC-101.7', 25)], objective: 'Document the disposition, owner, next action, due point, and escalation condition for a finding.' }),
        ],
        skills: ['Vulnerability Prioritization', 'CVSS', 'CVE', 'Risk Prioritization', 'Remediation', 'Attack Surface Management'] },
      'soc-09': { number: 9, week: 5, title: 'Incident Response', hours: '2 Hours 30 Minutes', durationMinutes: 150, lessons: 1, labs: 1,
        summary: 'Manage security incidents from initial detection through containment and recovery.',
        curriculumItems: [
          curriculumItem({ key: 'soc-09-lesson-01', title: 'Act on evidence, not urgency alone', durationMinutes: 30, parentAllocations: [allocation('SOC-101.6', 30)], objective: 'Choose proportionate containment, eradication, recovery, and escalation steps from confirmed incident evidence.' }),
        ],
        skills: ['Incident Response', 'Containment', 'Eradication', 'Recovery', 'Escalation'] },
      'soc-10': { number: 10, week: 5, title: 'Incident Evidence Handling, Chain of Custody & Case Documentation', hours: '4 Hours 30 Minutes', durationMinutes: 270, lessons: 2, labs: 2,
        summary: 'Understand evidence handling, chain-of-custody concepts, and structured incident analysis.',
        curriculumItems: [
          curriculumItem({ key: 'soc-10-lesson-01', title: 'Post-containment evidence intake', durationMinutes: 15, parentAllocations: [allocation('SOC-101.6', 15)], objective: 'Record evidence source, acquisition context, integrity controls, custody, and specialist escalation boundaries.' }),
          curriculumItem({ key: 'soc-10-lesson-02', title: 'Attachment-to-persistence reconstruction', durationMinutes: 15, parentAllocations: [allocation('SOC-101.6', 15)], objective: 'Separate observed facts, supported causal analysis, framework mapping, and explicit unknowns in a case record.' }),
        ],
        skills: ['Chain of Custody', 'Evidence Handling', 'MITRE ATT&CK', 'Root Cause Analysis', 'Incident Analysis'] },
      'soc-11': { number: 11, week: 6, title: 'SOC Operations, Metrics, Reporting & Communication', hours: '3 Hours 15 Minutes', durationMinutes: 195, lessons: 3, labs: 2,
        summary: 'Turn technical findings into actionable information for security teams, leadership, and business stakeholders.',
        curriculumItems: [
          curriculumItem({ key: 'soc-11-lesson-01', title: 'SOC performance and queue health', durationMinutes: 25, parentAllocations: [allocation('SOC-101.7', 25)], objective: 'Interpret alert volume, false-positive rate, backlog, service levels, and response-time trends without overstating causation.' }),
          curriculumItem({ key: 'soc-11-lesson-02', title: 'Operations brief and shift handoff', durationMinutes: 25, parentAllocations: [allocation('SOC-101.6', 15), allocation('SOC-101.7', 10)], objective: 'Prepare an actionable shift handoff that names evidence, operational risk, owner, and next review point.' }),
          curriculumItem({ key: 'soc-11-lesson-03', title: 'Case note, executive report, escalation and closure', durationMinutes: 25, parentAllocations: [allocation('SOC-101.6', 15), allocation('SOC-101.7', 10)], objective: 'Adapt one bounded incident record for technical case, executive, escalation, and closure audiences.' }),
        ],
        skills: ['SOC Operations', 'Security Metrics', 'Reporting', 'Communication', 'Executive Briefing'] },
      'soc-12': { number: 12, week: 6, title: 'SOC Analyst Capstone', hours: '4 Hours', durationMinutes: 240, lessons: 0, labs: 1, isCapstone: true,
        summary: 'A realistic multi-stage security incident investigated end to end in the Mission Next security operations simulator.',
        curriculumItems: [],
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
/* Draft-track fallbacks intentionally omit hour and lab claims. Exact totals
 * belong on the individual program only after its governing source has been
 * mapped into the catalogue. */
const STANDARD_STATS = [
  { icon: 'ri-calendar-line', label: 'Duration', value: '6 Weeks' },
  { icon: 'ri-stack-line', label: 'Learning Experience', value: '12 Modules' },
  { icon: 'ri-global-line', label: 'Delivery', value: 'Online' },
  { icon: 'ri-tools-line', label: 'Status', value: 'In Development' },
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
    // note actually is. Canonical answers repeat the exact visible log values;
    // matching only relaxes letter case and harmless punctuation. Fact 4 arrives
    // by phone, so it is handed over rather than asked for.
    evidence: [
      { id: 'timeline', time: '09:02–09:08', icon: 'ri-close-circle-line', label: 'Eight failed sign-ins',
        detail: 'All eight Failure rows show j.santos@missionnextlabs.example and 185.220.101.24.',
        prompt: 'Between 09:02 and 09:08 the sign-in log recorded a burst of failures. Record what it showed.',
        template: '{count} failed sign-ins targeted {account} from {ip}.',
        blanks: [
          { key: 'count', label: 'How many failures', size: 4, answer: '8',
            accept: ['8', 'eight'], hint: 'Count the red Failure rows once the log is filtered to one account.' },
          { key: 'account', label: 'User (exactly as shown)', size: 30, answer: 'j.santos@missionnextlabs.example',
            accept: ['j.santos@missionnextlabs.example'],
            hint: 'Copy the full value from the User column, including the period and @domain.' },
          { key: 'ip', label: 'Source IP address', size: 16, answer: '185.220.101.24',
            accept: ['185.220.101.24'], hint: 'The IP address column, identical on every failure row.' },
        ] },
      { id: 'success', time: '09:09:41', icon: 'ri-login-box-line', label: 'A sign-in succeeded',
        detail: 'At 09:09:41 UTC, the same source row shows Success.',
        prompt: 'The ninth attempt is the one that changes the case. Record what happened to it.',
        template: 'At {time} the same source produced a {result}.',
        blanks: [
          { key: 'time', label: 'Date (UTC) time value', size: 10, answer: '09:09:41', showHelper: true,
            accept: ['09:09:41', '9:09:41'], hint: 'Copy the time including seconds from the Date (UTC) column.' },
          { key: 'result', label: 'Status (exactly as shown)', size: 12, answer: 'Success',
            accept: ['success'], hint: 'Copy the green one-word value from the Status column.' },
        ] },
      { id: 'context', time: '09:09:41', icon: 'ri-map-pin-line', label: 'The context is unfamiliar',
        detail: 'Location is Bucharest, RO. Device info shows Managed: No and Join type: Not registered. Sign-in risk is High.',
        prompt: 'Open the successful sign-in and copy the visible values from Location, Device info, and Basic info.',
        template: 'Location is {location}. Managed is {managed}, and Sign-in risk is {risk}.',
        blanks: [
          { key: 'location', label: 'Location (include comma)', size: 18, answer: 'Bucharest, RO',
            accept: ['Bucharest, RO'],
            hint: 'Copy the complete Location value, including the comma and two-letter country code.' },
          { key: 'managed', label: 'Managed field value', size: 8, answer: 'No',
            accept: ['No'], hint: 'In Device info, copy the value beside Managed.' },
          { key: 'risk', label: 'Sign-in risk value', size: 10, answer: 'High',
            accept: ['High'], hint: 'In Basic info, copy the value beside Sign-in risk.' },
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
function labRecord(spec) {
  return {
    kind: spec.isCapstone ? 'capstone' : 'lab',
    classification: 'lab',
    instructionalMinutes: spec.minutes,
    startingState: `A reset, isolated synthetic ${spec.title.toLowerCase()} scenario with the evidence and controls required for the assigned task.`,
    task: spec.description,
    successCondition: `Submit the ${spec.title} performance artifact with a supported decision, complete evidence, and at least the 70% program passing standard.`,
    escalationCondition: 'Escalate when the evidence supports harmful activity, the scope is uncertain, or the required action exceeds the entry-level analyst role.',
    evidence: 'Saved investigation selections, written rationale, submitted artifact, score, attempt history, and completion record.',
    assessmentMethod: 'Performance-based scenario and scored artifact; briefing, practice, submission, and embedded assessment time are included in instructionalMinutes.',
    facultyEvaluation: 'Faculty reviews the saved artifact, evidence chain, decision, scope, and escalation against the lab criteria.',
    securityPlusTags: [],
    revision: SOC_CURRICULUM_REVISION,
    ...spec,
  };
}

const LABS = [
  labRecord({ key: 'lab-soc-environment', module: 'soc-01', title: 'Your First SOC Alert: A Guided Triage', difficulty: 'Foundational', minutes: 120,
    parentAllocations: [allocation('SOC-101.4', 120)], objective: 'Validate one identity alert, classify it from visible evidence, and document a proportionate triage decision.',
    description: 'Learn what a SOC analyst does, follow the incident response lifecycle, and triage one clear identity alert with step-by-step coaching.',
    skills: ['SOC Operations', 'Incident Response Lifecycle', 'Alert Triage', 'Case Notes'], portalEntry: '#/program/soc-analyst/module/1' }),
  labRecord({ key: 'lab-soc-escalation', module: 'soc-01', title: 'SIEM Incident Escalation & Handoff', difficulty: 'Foundational', minutes: 60,
    parentAllocations: [allocation('SOC-101.6', 60)], objective: 'Confirm the affected identity and produce an evidence-based escalation handoff for an authorized responder.',
    description: 'Open the SIEM incident view, confirm the affected account, and complete the escalation handoff for identity containment.',
    skills: ['SIEM', 'Incident Escalation', 'Case Notes'], simEntry: '#/sentinel/incidents' }),
  labRecord({ key: 'lab-identity-investigation', module: 'soc-02', title: 'Suspicious Authentication Investigation', difficulty: 'Foundational', minutes: 180,
    parentAllocations: [allocation('SOC-101.4', 60), allocation('SOC-101.5', 120)], objective: 'Correlate authentication, network, and access-change records to identify and escalate one risky identity pattern.',
    description: 'Review user sign-in events, analyze privilege changes, and identify risky identity behavior.',
    skills: ['IAM', 'Sign-in Analysis', 'Privilege Escalation'], simEntry: '#/entra/risky-users' }),
  labRecord({ key: 'lab-siem-triage', module: 'soc-03', title: 'SIEM Alert Triage', difficulty: 'Intermediate', minutes: 240,
    parentAllocations: [allocation('SOC-101.4', 60), allocation('SOC-101.5', 180)], objective: 'Correlate normalized log sources into a supported timeline, alert disposition, and analyst handoff.',
    description: 'Open and triage security alerts, correlate events across multiple sources, and identify suspicious patterns.',
    skills: ['SIEM', 'Alert Triage', 'Event Correlation'], simEntry: '#/sentinel/incidents' }),
  labRecord({ key: 'lab-detection-rule', module: 'soc-04', title: 'Detection Rule Review & Enrichment', difficulty: 'Intermediate', minutes: 120,
    parentAllocations: [allocation('SOC-101.4', 60), allocation('SOC-101.7', 60)], objective: 'Tune one detection rule, justify threat-intelligence enrichment, and select a bounded automated monitoring action.',
    description: 'Review a detection rule, investigate matched indicators, enrich an alert with threat intelligence, and run an automated response.',
    skills: ['Detection Rules', 'Threat Intelligence', 'SOAR'], simEntry: '#/sentinel/analytics' }),
  labRecord({ key: 'lab-endpoint-investigation', module: 'soc-05', title: 'Infected Workstation Investigation', difficulty: 'Intermediate', minutes: 120,
    parentAllocations: [allocation('SOC-101.3', 45), allocation('SOC-101.4', 45), allocation('SOC-101.6', 30)], objective: 'Build an endpoint execution chain, assess the file and persistence evidence, and prepare a containment handoff.',
    description: 'Follow a process tree, review file and registry activity, validate file reputation, and isolate a compromised endpoint.',
    skills: ['EDR', 'Process Analysis', 'Endpoint Containment'], simEntry: '#/defender/devices' }),
  labRecord({ key: 'lab-threat-hunt', module: 'soc-06', title: 'Cross-Device Threat Hunt', difficulty: 'Advanced', minutes: 90,
    parentAllocations: [allocation('SOC-101.7', 60), allocation('SOC-101.6', 30)], objective: 'Test a scoped hypothesis across endpoint and identity data, preserve the reasoning chain, and report the supported scope.',
    description: 'Develop a hunting hypothesis, hunt across multiple endpoints, and pivot between users, hosts, IP addresses, and files.',
    skills: ['Threat Hunting', 'IOC Analysis', 'Pivoting'], simEntry: '#/defender/hunting' }),
  labRecord({ key: 'lab-email-triage', module: 'soc-07', title: 'Suspicious Email Investigation', difficulty: 'Intermediate', minutes: 210,
    parentAllocations: [allocation('SOC-101.3', 60), allocation('SOC-101.5', 150)], objective: 'Assess sender alignment, URLs, attachments, delivery, and recipient interaction to reach a bounded email verdict.',
    description: 'Analyze a suspicious email, inspect authentication controls, investigate URLs, and determine whether the message represents a security threat.',
    skills: ['Email Headers', 'SPF', 'DKIM', 'DMARC', 'Threat Intelligence'], simEntry: '#/defender/email' }),
  labRecord({ key: 'lab-network-investigation', module: 'soc-07', title: 'Network Investigation', difficulty: 'Intermediate', minutes: 240,
    parentAllocations: [allocation('SOC-101.5', 240)], objective: 'Analyze DNS and connection telemetry, correlate suspicious sessions to an endpoint, and document current network scope.',
    description: 'Review connection telemetry, analyze DNS activity, identify suspicious traffic, and correlate it back to an endpoint.',
    skills: ['Packet Analysis', 'DNS', 'Network Investigation'], simEntry: '#/defender/hunting' }),
  labRecord({ key: 'lab-vuln-prioritization', module: 'soc-08', title: 'Vulnerability Prioritization', difficulty: 'Intermediate', minutes: 150,
    parentAllocations: [allocation('SOC-101.3', 90), allocation('SOC-101.7', 60)], objective: 'Prioritize a vulnerability finding using exploitability, exposure, asset role, telemetry, and compensating controls.',
    description: 'Review a scan, assess CVE and CVSS data, weigh asset criticality and exploitability, and prioritize remediation.',
    skills: ['CVE', 'CVSS', 'Risk Prioritization'], simEntry: '#/defender/vuln-management' }),
  labRecord({ key: 'lab-vuln-queue', module: 'soc-08', title: 'Vulnerability Analyst Queue', difficulty: 'Advanced', minutes: 150,
    parentAllocations: [allocation('SOC-101.3', 90), allocation('SOC-101.7', 60)], objective: 'Disposition a queue of vulnerability findings and document owners, next actions, and escalation conditions.',
    description: 'Work a queue of findings and decide: fix now, schedule, compensating control, accept risk, escalate, or false positive.',
    skills: ['Vulnerability Prioritization', 'Risk Decisions', 'Remediation'], simEntry: '#/defender/vuln-management' }),
  labRecord({ key: 'lab-active-incident', module: 'soc-09', title: 'Active Security Incident', difficulty: 'Advanced', minutes: 120,
    parentAllocations: [allocation('SOC-101.6', 120)], objective: 'Validate and scope an incident, recommend proportionate response actions, and produce a complete escalation handoff.',
    description: 'Validate an incident, determine scope and severity, contain the endpoint, disable the account, block the indicator, and verify recovery.',
    skills: ['Incident Response', 'Containment', 'Recovery'], simEntry: '#/defender/incidents' }),
  labRecord({ key: 'lab-evidence-collection', module: 'soc-10', title: 'Evidence Collection & Chain of Custody', difficulty: 'Intermediate', minutes: 90,
    parentAllocations: [allocation('SOC-101.6', 90)], objective: 'Select appropriate incident evidence and complete an integrity and chain-of-custody record for specialist review.',
    description: 'Identify and acquire evidence, generate a hash, record acquisition time, and complete a chain-of-custody record.',
    skills: ['Evidence Handling', 'Hash Validation', 'Chain of Custody'], simEntry: '#/defender/incidents' }),
  labRecord({ key: 'lab-attack-mapping', module: 'soc-10', title: 'ATT&CK Attack Mapping', difficulty: 'Intermediate', minutes: 150,
    parentAllocations: [allocation('SOC-101.3', 150)], objective: 'Reconstruct a supported incident timeline and use ATT&CK as a framework for demonstrated adversary behavior.',
    description: 'Map observed attacker behavior to attack stage, ATT&CK tactic and technique, supporting evidence, and analyst conclusion.',
    skills: ['MITRE ATT&CK', 'Incident Analysis'], simEntry: '#/defender/incidents' }),
  labRecord({ key: 'lab-exec-report', module: 'soc-11', title: 'Executive Incident Report', difficulty: 'Advanced', minutes: 60,
    parentAllocations: [allocation('SOC-101.6', 60)], objective: 'Translate a bounded technical incident record into accurate case, escalation, executive, and closure communication.',
    description: 'Transform technical evidence into an executive summary, timeline, impact assessment, root cause, and recommendations.',
    skills: ['Reporting', 'Executive Briefing', 'Communication'], simEntry: '#/defender/incidents' }),
  labRecord({ key: 'lab-soc-metrics', module: 'soc-11', title: 'SOC Metrics Dashboard', difficulty: 'Intermediate', minutes: 60,
    parentAllocations: [allocation('SOC-101.7', 60)], objective: 'Interpret SOC workload and response metrics, identify an operational risk, and prepare an actionable shift handoff.',
    description: 'Review alert volume, false-positive rate, vulnerability backlog, MTTD and MTTR, and identify areas requiring improvement.',
    skills: ['Security Metrics', 'SOC Operations'], simEntry: '#/sentinel/workbooks' }),
  labRecord({ key: 'lab-capstone', module: 'soc-12', title: 'SOC Analyst Capstone', difficulty: 'Advanced', minutes: 240, isCapstone: true,
    parentAllocations: [allocation('SOC-101.8', 240)], objective: 'Produce a defensible end-to-end incident record by applying competencies taught in Modules 01–11.',
    startingState: 'A reset, isolated synthetic incident with twelve assessment stages and no new instructional content.',
    successCondition: 'Complete the integrated investigation and scored analyst report at or above the 70% program standard with no critical safety error.',
    escalationCondition: 'Escalate within the case record when evidence supports harmful activity, scope remains uncertain, or action requires incident-owner authority.',
    evidence: 'Saved twelve-stage investigation state, selected evidence, queries, timeline, scope, response plan, final report, rubric score, attempts, and completion record.',
    assessmentMethod: 'One integrated Prove assessment; all briefing, execution, submission, and scoring activity is included in the 240 instructional minutes.',
    facultyEvaluation: 'Faculty applies the capstone rubric to investigation, technical execution, triage, evidence handling, documentation, escalation, analysis, and reporting.',
    description: 'A twelve-stage security investigation spanning email, identity, endpoint, network, threat intelligence, hunting, vulnerability analysis, response, evidence, and reporting.',
    skills: ['Full Investigation Lifecycle'], simEntry: '#/defender/home' }),
];

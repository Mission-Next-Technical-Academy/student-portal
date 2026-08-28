-- MNT Academy — catalogue data (programs, modules, labs) for the live project.
--
-- supabase/seed.sql exists but is LOCAL-DEV ONLY: its second half inserts four
-- fictional accounts straight into auth.users with hardcoded trivial passwords
-- (user1/user1, etc.) and its own header says never run it against a hosted
-- project. This migration carries only the catalogue portion (verbatim) so the
-- live project has real programs/modules/labs rows without the fake accounts.

-- ============================================================== catalogue

insert into public.programs
  (slug, title, card_title, tagline, description, badge, icon, duration_weeks, module_count, sort_order, is_published)
values
  ('it-support',
   'IT Help Desk & Career Accelerator',
   'IT Help Desk & Career Accelerator',
   null,
   'Enterprise Windows Server 2022 networks, Active Directory management, and enterprise ticket lifecycle training for real-world IT environments.',
   'Launch into IT Support in 6 weeks',
   'ri-customer-service-2-line', 6, 12, 1, false),

  -- Title and description are the LIVE SITE copy, verbatim.
  ('soc-analyst',
   'Security Operation Center (SOC) Analyst',
   'Security Operation Center (SOC) Analyst',
   'Learn to Investigate. Detect. Respond.',
   'Train in live SIEM environments, packet analysis, and threat detection workflows used in modern Security Operations Centers.',
   'Secure a role in Cybersecurity Ops',
   'ri-shield-keyhole-line', 6, 12, 2, true),

  ('ai-ml',
   'Foundations of AI & Machine Learning',
   'Foundations of AI & Machine Learning',
   null,
   'Applied Python programming, data preparation, and machine learning model training using modern AI frameworks and tools.',
   'Pivot to the future of Data Science',
   'ri-robot-2-line', 6, 12, 3, false),

  ('electrical',
   'Electrical Engineering Essentials',
   'Electrical Engineering Essentials',
   null,
   'Learn circuit fundamentals, Ohm''s Law, digital logic, and electrical troubleshooting techniques used in modern technical environments.',
   'Rapid entry into Technical Trades',
   'ri-flashlight-line', 6, 12, 4, false);

-- SOC Analyst modules -------------------------------------------------------

insert into public.modules
  (program_id, module_key, number, week, title, summary, est_hours_min, est_hours_max, lesson_count, lab_count, is_capstone, sort_order)
select p.id, v.module_key, v.number, v.week, v.title, v.summary,
       v.hmin, v.hmax, v.lessons, v.labs, v.capstone, v.number
from public.programs p,
(values
  ('soc-01',  1, 1, 'SOC & Security Architecture',
   'Build the foundational knowledge required to understand modern security operations environments.', 6, 8, 9, 1, false),
  ('soc-02',  2, 1, 'Network, Identity & Security Foundations',
   'Understand how networks, identities, access controls, and modern security architectures affect security operations.', 6, 8, 8, 1, false),
  ('soc-03',  3, 2, 'SIEM & Log Analysis',
   'Learn how analysts use centralized security telemetry to identify and investigate suspicious activity.', 7, 9, 10, 2, false),
  ('soc-04',  4, 2, 'Detection Engineering, Threat Intelligence & Automation',
   'Learn how detections are created, enriched, prioritized, and automated.', 6, 8, 9, 2, false),
  ('soc-05',  5, 3, 'Endpoint & Malware Investigation',
   'Investigate suspicious activity occurring on endpoints.', 7, 9, 10, 2, false),
  ('soc-06',  6, 3, 'Threat Hunting & Investigation',
   'Move beyond individual alerts and proactively search for evidence of malicious activity.', 6, 8, 8, 2, false),
  ('soc-07',  7, 4, 'Network & Email Analysis',
   'Analyze network traffic and email evidence during security investigations.', 7, 9, 10, 2, false),
  ('soc-08',  8, 4, 'Vulnerability Management & Exposure Analysis',
   'Learn how security teams identify, validate, prioritize, and manage vulnerabilities across enterprise environments.', 9, 12, 14, 2, false),
  ('soc-09',  9, 5, 'Incident Response',
   'Manage security incidents from initial detection through containment and recovery.', 7, 9, 10, 1, false),
  ('soc-10', 10, 5, 'Digital Evidence, Forensics & Incident Frameworks',
   'Understand evidence handling, forensic concepts, and structured incident analysis.', 6, 8, 9, 2, false),
  ('soc-11', 11, 6, 'SOC Operations, Metrics, Reporting & Communication',
   'Turn technical findings into actionable information for security teams, leadership, and business stakeholders.', 6, 8, 10, 2, false),
  ('soc-12', 12, 6, 'SOC Analyst Capstone',
   'A realistic multi-stage security incident investigated end to end in the Mission Next security operations simulator.', 8, 12, 12, 1, true)
) as v(module_key, number, week, title, summary, hmin, hmax, lessons, labs, capstone)
where p.slug = 'soc-analyst';

-- Standardized skeletons for the other three tracks -------------------------
-- Same frame everywhere: 6 weeks, 12 modules, 2 per week, module 12 = capstone.
-- Bodies are authored in the track content files; see MODULE_STANDARD.md.

insert into public.modules
  (program_id, module_key, number, week, title, is_capstone, sort_order)
select p.id, v.module_key, v.number, v.week, v.title, v.number = 12, v.number
from public.programs p
join (values
  -- IT Help Desk — CompTIA A+ domains + ITIL 4 service management
  ('it-support', 'its-01',  1, 1, 'IT Support Fundamentals & Service Desk Operations'),
  ('it-support', 'its-02',  2, 1, 'Hardware, Devices & Peripherals'),
  ('it-support', 'its-03',  3, 2, 'Operating Systems: Windows, macOS & Linux'),
  ('it-support', 'its-04',  4, 2, 'Networking Fundamentals for Support'),
  ('it-support', 'its-05',  5, 3, 'Windows Server & Active Directory Administration'),
  ('it-support', 'its-06',  6, 3, 'Identity, Accounts & Access Management'),
  ('it-support', 'its-07',  7, 4, 'Software, Applications & Endpoint Management'),
  ('it-support', 'its-08',  8, 4, 'Troubleshooting Methodology & Diagnostics'),
  ('it-support', 'its-09',  9, 5, 'Security Fundamentals for IT Support'),
  ('it-support', 'its-10', 10, 5, 'Ticketing, ITIL Service Management & SLAs'),
  ('it-support', 'its-11', 11, 6, 'Customer Service, Documentation & Escalation'),
  ('it-support', 'its-12', 12, 6, 'IT Support Capstone'),

  -- AI & Machine Learning — CRISP-DM lifecycle + MLOps practice
  ('ai-ml', 'aim-01',  1, 1, 'Python Programming Foundations'),
  ('ai-ml', 'aim-02',  2, 1, 'Data Fundamentals, Mathematics & Statistics'),
  ('ai-ml', 'aim-03',  3, 2, 'Data Acquisition, Cleaning & Preparation'),
  ('ai-ml', 'aim-04',  4, 2, 'Exploratory Data Analysis & Visualization'),
  ('ai-ml', 'aim-05',  5, 3, 'Supervised Learning: Regression & Classification'),
  ('ai-ml', 'aim-06',  6, 3, 'Unsupervised Learning & Feature Engineering'),
  ('ai-ml', 'aim-07',  7, 4, 'Model Evaluation, Validation & Tuning'),
  ('ai-ml', 'aim-08',  8, 4, 'Neural Networks & Deep Learning Foundations'),
  ('ai-ml', 'aim-09',  9, 5, 'Applied AI: Language, Vision & Generative Models'),
  ('ai-ml', 'aim-10', 10, 5, 'MLOps: Deployment, Pipelines & Monitoring'),
  ('ai-ml', 'aim-11', 11, 6, 'Responsible AI, Ethics & Communicating Results'),
  ('ai-ml', 'aim-12', 12, 6, 'AI & Machine Learning Capstone'),

  -- Electrical Engineering — NCEES FE Electrical + NFPA 70E / NEC safety
  ('electrical', 'eee-01',  1, 1, 'Electrical Fundamentals & Safety'),
  ('electrical', 'eee-02',  2, 1, 'DC Circuit Analysis & Ohm''s Law'),
  ('electrical', 'eee-03',  3, 2, 'AC Fundamentals & Waveforms'),
  ('electrical', 'eee-04',  4, 2, 'Series, Parallel & Complex Circuits'),
  ('electrical', 'eee-05',  5, 3, 'Components: Resistors, Capacitors & Inductors'),
  ('electrical', 'eee-06',  6, 3, 'Semiconductors & Power Electronics'),
  ('electrical', 'eee-07',  7, 4, 'Digital Logic & Boolean Algebra'),
  ('electrical', 'eee-08',  8, 4, 'Motors, Generators & Transformers'),
  ('electrical', 'eee-09',  9, 5, 'Test Equipment & Measurement'),
  ('electrical', 'eee-10', 10, 5, 'Electrical Troubleshooting & Fault Isolation'),
  ('electrical', 'eee-11', 11, 6, 'Codes, Standards, Schematics & Documentation'),
  ('electrical', 'eee-12', 12, 6, 'Electrical Engineering Capstone')
) as v(slug, module_key, number, week, title) on v.slug = p.slug;

-- SOC Analyst labs ----------------------------------------------------------

insert into public.labs
  (module_id, lab_key, title, description, difficulty, duration_min, is_capstone, sim_entry, sort_order)
select m.id, v.lab_key, v.title, v.description, v.difficulty, v.minutes, v.capstone, v.sim_entry, v.ord
from public.modules m
join public.programs p on p.id = m.program_id and p.slug = 'soc-analyst',
(values
  ('soc-01', 'lab-soc-environment',      'Explore a Simulated SOC Environment',
   'Tour a working security operations environment, identify its data sources, and trace a log from endpoint to security platform.',
   'Foundational',  30, false, '#/defender/home', 1),
  ('soc-02', 'lab-identity-investigation','Suspicious Authentication Investigation',
   'Review user sign-in events, analyze privilege changes, and identify risky identity behavior.',
   'Foundational',  35, false, '#/entra/risky-users', 2),
  ('soc-03', 'lab-siem-triage',          'SIEM Alert Triage',
   'Open and triage security alerts, correlate events across multiple sources, and identify suspicious patterns.',
   'Intermediate',  45, false, '#/sentinel/incidents', 3),
  ('soc-04', 'lab-detection-rule',       'Detection Rule Review & Enrichment',
   'Review a detection rule, investigate matched indicators, enrich an alert with threat intelligence, and run an automated response.',
   'Intermediate',  45, false, '#/sentinel/analytics', 4),
  ('soc-05', 'lab-endpoint-investigation','Infected Workstation Investigation',
   'Follow a process tree, review file and registry activity, validate file reputation, and isolate a compromised endpoint.',
   'Intermediate',  50, false, '#/defender/devices', 5),
  ('soc-06', 'lab-threat-hunt',          'Cross-Device Threat Hunt',
   'Develop a hunting hypothesis, hunt across multiple endpoints, and pivot between users, hosts, IP addresses, and files.',
   'Advanced',      60, false, '#/defender/hunting', 6),
  ('soc-07', 'lab-email-triage',         'Suspicious Email Investigation',
   'Analyze a suspicious email, inspect authentication controls, investigate URLs, and determine whether the message represents a security threat.',
   'Intermediate',  45, false, '#/defender/email', 7),
  ('soc-07', 'lab-network-investigation', 'Network Investigation',
   'Review connection telemetry, analyze DNS activity, identify suspicious traffic, and correlate it back to an endpoint.',
   'Intermediate',  40, false, '#/defender/hunting', 8),
  ('soc-08', 'lab-vuln-prioritization',  'Vulnerability Prioritization',
   'Review a scan, assess CVE and CVSS data, weigh asset criticality and exploitability, and prioritize remediation.',
   'Intermediate',  50, false, '#/defender/vuln-management', 9),
  ('soc-08', 'lab-vuln-queue',           'Vulnerability Analyst Queue',
   'Work a queue of findings and decide: fix now, schedule, compensating control, accept risk, escalate, or false positive.',
   'Advanced',      45, false, '#/defender/vuln-management', 10),
  ('soc-09', 'lab-active-incident',      'Active Security Incident',
   'Validate an incident, determine scope and severity, contain the endpoint, disable the account, block the indicator, and verify recovery.',
   'Advanced',      60, false, '#/defender/incidents', 11),
  ('soc-10', 'lab-evidence-collection',  'Evidence Collection & Chain of Custody',
   'Identify and acquire evidence, generate a hash, record acquisition time, and complete a chain-of-custody record.',
   'Intermediate',  40, false, '#/defender/incidents', 12),
  ('soc-10', 'lab-attack-mapping',       'ATT&CK Attack Mapping',
   'Map observed attacker behavior to attack stage, ATT&CK tactic and technique, supporting evidence, and analyst conclusion.',
   'Intermediate',  35, false, '#/defender/incidents', 13),
  ('soc-11', 'lab-exec-report',          'Executive Incident Report',
   'Transform technical evidence into an executive summary, timeline, impact assessment, root cause, and recommendations.',
   'Advanced',      50, false, '#/defender/incidents', 14),
  ('soc-11', 'lab-soc-metrics',          'SOC Metrics Dashboard',
   'Review alert volume, false-positive rate, vulnerability backlog, MTTD and MTTR, and identify areas requiring improvement.',
   'Intermediate',  30, false, '#/sentinel/workbooks', 15),
  ('soc-12', 'lab-capstone',             'SOC Analyst Capstone',
   'A twelve-stage security investigation spanning email, identity, endpoint, network, threat intelligence, hunting, vulnerability analysis, response, evidence, and reporting.',
   'Advanced',     600, true,  '#/defender/incidents', 16)
) as v(module_key, lab_key, title, description, difficulty, minutes, capstone, sim_entry, ord)
where m.module_key = v.module_key;

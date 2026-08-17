-- MNT Academy — local development seed.
--
-- Runs automatically on `supabase start` / `supabase db reset`.
-- LOCAL ONLY. These accounts exist so entitlement behavior can be exercised;
-- they are fictional and the password is deliberately trivial. Never run this
-- against a hosted project.
--
-- In production, catalogue rows come from `npm run seed:catalogue` reading
-- src/content/programs/*.ts (PLATFORM_ARCHITECTURE.md §5A.4), and enrollments
-- come from the purchase flow.

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

-- ========================================================== demo accounts
--
-- Local only. Four test accounts, one per entitlement scenario. Each password
-- matches its username (user1/user1 … user4/user4). The portal accepts the bare
-- username; Supabase itself needs the full email.
--
--   user1  SOC Analyst, full access, 4/12 modules complete
--   user2  SOC Analyst, partial — Weeks 1–2 only (modules 01–04)
--   user3  IT Support only — SOC Analyst locked
--   user4  nothing purchased — all four cards locked

-- The empty-string token columns are required. GoTrue scans them into
-- non-nullable Go strings, so leaving them NULL makes every sign-in fail with
-- "Database error querying schema" — which looks like a config problem and is
-- not. Do not drop these columns from the insert.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change,
   email_change_token_new, email_change_token_current,
   phone_change, phone_change_token, reauthentication_token)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'user1@mntacademy.test', crypt('user1', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User One"}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'user2@mntacademy.test', crypt('user2', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User Two"}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
   'user3@mntacademy.test', crypt('user3', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User Three"}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
   'user4@mntacademy.test', crypt('user4', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test User Four"}', now(), now(),
   '', '', '', '', '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
select u.id, u.id, u.id::text,
       json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
       'email', now(), now()
from auth.users u
where u.email like '%@mntacademy.test';

-- One track each. Nothing about the model limits a student to one enrollment —
-- add another row here and that student's second card simply stops being dimmed.
insert into public.enrollments (user_id, program_id, access_mode, order_ref)
select v.user_id::uuid, p.id, 'full', v.order_ref
from public.programs p
join (values
  ('11111111-1111-1111-1111-111111111111', 'it-support',  'DEMO-0001'),
  ('22222222-2222-2222-2222-222222222222', 'soc-analyst', 'DEMO-0002'),
  ('33333333-3333-3333-3333-333333333333', 'ai-ml',       'DEMO-0003'),
  ('44444444-4444-4444-4444-444444444444', 'electrical',  'DEMO-0004')
) as v(user_id, slug, order_ref) on v.slug = p.slug;

-- Progress fixtures for user2, the SOC Analyst student: modules 01–04 complete,
-- 05 in progress. The other three tracks have no modules seeded yet.
insert into public.module_progress (user_id, module_id, state, percent, completed_at)
select '22222222-2222-2222-2222-222222222222', m.id, 'complete', 100, now()
from public.modules m join public.programs p on p.id = m.program_id and p.slug = 'soc-analyst'
where m.module_key in ('soc-01', 'soc-02', 'soc-03', 'soc-04');

insert into public.module_progress (user_id, module_id, state, percent, started_at)
select '22222222-2222-2222-2222-222222222222', m.id, 'in_progress', 40, now()
from public.modules m join public.programs p on p.id = m.program_id and p.slug = 'soc-analyst'
where m.module_key = 'soc-05';

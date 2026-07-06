// SC-200_lab mock data. All data is fictional and lives in-memory.

const KNOWN_GOOD_HASH  = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const POST_UPDATE_HASH = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const ROGUE_HASH       = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const SEED_ALERTS = [
  { id:'A001', severity:'medium', title:'Suspicious activity by vulnerability scanner',
    status:'New', category:'Discovery', detectionSource:'EDR', asset:'WKS-01',
    firstActivity:'2026-06-28T09:00:00Z', incidentId:'INC-1024',
    event:{ file_name:'scanner.exe', sha256:KNOWN_GOOD_HASH,
            path:'C:\\Tools\\Scanner\\scanner.exe', signer:'Acme Security Inc.',
            cmdline:'scanner.exe --scan C:\\' },
    note:'Pre-update: name + hash match the suppression rule.' },
  { id:'A002', severity:'medium', title:'Suspicious activity by vulnerability scanner',
    status:'New', category:'Discovery', detectionSource:'EDR', asset:'WKS-02',
    firstActivity:'2026-06-28T09:05:00Z', incidentId:'INC-1024',
    event:{ file_name:'scanner.exe', sha256:KNOWN_GOOD_HASH,
            path:'C:\\Tools\\Scanner\\scanner.exe', signer:'Acme Security Inc.',
            cmdline:'scanner.exe --scan D:\\' } },
  { id:'A003', severity:'medium', title:'Suspicious activity by vulnerability scanner',
    status:'New', category:'Discovery', detectionSource:'EDR', asset:'WKS-01',
    firstActivity:'2026-06-28T14:00:00Z', incidentId:'INC-1031',
    event:{ file_name:'scanner.exe', sha256:POST_UPDATE_HASH,
            path:'C:\\Tools\\Scanner\\scanner.exe', signer:'Acme Security Inc.',
            cmdline:'scanner.exe --scan C:\\' },
    note:'Post-update: vendor patched the binary — SHA256 drifted, rule no longer matches.' },
  { id:'A004', severity:'medium', title:'Suspicious activity by vulnerability scanner',
    status:'New', category:'Discovery', detectionSource:'EDR', asset:'WKS-02',
    firstActivity:'2026-06-28T14:15:00Z', incidentId:'INC-1031',
    event:{ file_name:'scanner.exe', sha256:POST_UPDATE_HASH,
            path:'C:\\Tools\\Scanner\\scanner.exe', signer:'Acme Security Inc.',
            cmdline:'scanner.exe --scan D:\\' } },
  { id:'A005', severity:'high', title:'Suspicious file mimicking known scanner',
    status:'New', category:'Defense evasion', detectionSource:'EDR', asset:'WKS-03',
    firstActivity:'2026-06-28T15:00:00Z', incidentId:'INC-1038',
    event:{ file_name:'scanner.exe', sha256:ROGUE_HASH,
            path:'C:\\Users\\Public\\scanner.exe', signer:'(unsigned)', cmdline:'scanner.exe' },
    note:'Look-alike file name only — different hash. Demonstrates why file-name-only suppression is unsafe.' },
  { id:'A101', severity:'high', title:'Possible AdminSDHolder modification',
    status:'In progress', category:'Persistence', detectionSource:'MDI', asset:'DC01',
    firstActivity:'2026-06-28T03:42:00Z', incidentId:'INC-1019',
    event:{ user:'svc-backup', target:'CN=AdminSDHolder,CN=System,DC=contoso,DC=com' } },
  { id:'A102', severity:'high', title:'Suspected DCSync attack (replication of directory services)',
    status:'In progress', category:'Credential access', detectionSource:'MDI', asset:'DC01',
    firstActivity:'2026-06-28T03:44:00Z', incidentId:'INC-1019',
    event:{ user:'svc-backup', source_ip:'10.20.4.55', target:'DC01.contoso.com' } },
  { id:'A201', severity:'high', title:'User compromised through phishing email with malicious URL',
    status:'New', category:'Initial access', detectionSource:'MDO', asset:'jane.doe@contoso.com',
    firstActivity:'2026-06-28T08:11:00Z', incidentId:'INC-1042',
    event:{ url:'https://secure-document-portal[.]xyz/login', subject:'Action required: invoice overdue' } },
  { id:'A202', severity:'medium', title:'Anomalous OAuth consent grant',
    status:'New', category:'Initial access', detectionSource:'MDA', asset:'jane.doe@contoso.com',
    firstActivity:'2026-06-28T08:23:00Z', incidentId:'INC-1042',
    event:{ app_name:'DocViewer Pro', permissions:'Mail.ReadWrite, Files.Read.All' } },
  { id:'A301', severity:'high', title:'Multiple endpoints encrypted by suspected ransomware',
    status:'New', category:'Impact', detectionSource:'MDE', asset:'FIN-FS-02',
    firstActivity:'2026-06-28T10:18:00Z', incidentId:'INC-1050',
    event:{ file_name:'locker.exe', sha256:'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
            path:'C:\\ProgramData\\locker.exe', ransom_note:'RECOVER-FILES.txt' } },
  { id:'A302', severity:'high', title:'Shadow copy deletion followed by mass file rename',
    status:'New', category:'Impact', detectionSource:'MDE', asset:'FIN-FS-02',
    firstActivity:'2026-06-28T10:20:00Z', incidentId:'INC-1050',
    event:{ process:'vssadmin.exe', cmdline:'vssadmin delete shadows /all /quiet', extension:'.locked' } },
  { id:'A401', severity:'high', title:'Adversary-in-the-middle phishing session detected',
    status:'New', category:'Initial access', detectionSource:'Entra ID Protection', asset:'maria.ross@contoso.com',
    firstActivity:'2026-06-28T06:40:00Z', incidentId:'INC-1051',
    event:{ user:'maria.ross@contoso.com', source_ip:'185.199.111.12', sign_in_risk:'High', mfa_method:'Push' } },
  { id:'A501', severity:'high', title:'Container escaped to host namespace',
    status:'In progress', category:'Privilege escalation', detectionSource:'Defender for Containers', asset:'aks-prod/node-3',
    firstActivity:'2026-06-28T12:01:00Z', incidentId:'INC-1052',
    event:{ cluster:'aks-prod', pod:'pod-api-77', image:'contoso/api:2026.06', syscall:'setns' } },
  { id:'A601', severity:'medium', title:'Risky sign-in from unfamiliar location',
    status:'New', category:'Credential access', detectionSource:'Entra ID Protection', asset:'sam.lee@contoso.com',
    firstActivity:'2026-06-28T13:27:00Z', incidentId:'INC-1053',
    event:{ user:'sam.lee@contoso.com', source_ip:'91.219.236.54', country:'NL', risk_level:'High' } },
  { id:'A701', severity:'high', title:'Cloud storage container publicly exposed',
    status:'New', category:'Exfiltration', detectionSource:'Defender for Cloud', asset:'aws-s3-prod-logs',
    firstActivity:'2026-06-28T07:52:00Z', incidentId:'INC-1054',
    event:{ account:'aws-prod', bucket:'aws-s3-prod-logs', acl:'public-read', finding:'External principals can list objects' } },
];

const INCIDENTS = [
  { id:'INC-1019', severity:'high', title:'Suspected identity attack on domain controller',
    status:'In progress', assignedTo:'alex.ansbergs', classification:'',
    tactics:['Credential Access','Persistence'], alertIds:['A101','A102'],
    entities:[{type:'User',name:'svc-backup'},{type:'Device',name:'DC01'},{type:'IP',name:'10.20.4.55'}],
    createdAt:'2026-06-28T03:45:00Z', alertCount:2,
    summary:'Service account performed directory replication followed by AdminSDHolder access — classic DCSync + persistence pattern.' },
  { id:'INC-1024', severity:'medium', title:'Multi-stage scanner activity across endpoints',
    status:'New', assignedTo:'Unassigned', classification:'',
    tactics:['Discovery'], alertIds:['A001','A002'],
    entities:[{type:'File',name:'scanner.exe'},{type:'Device',name:'WKS-01'},{type:'Device',name:'WKS-02'}],
    createdAt:'2026-06-28T09:00:00Z', alertCount:2,
    summary:'Two endpoints ran the same vulnerability scanner. Pre-update hash matches the legitimate-tool suppression rule.' },
  { id:'INC-1031', severity:'medium', title:'Scanner activity (post-vendor update)',
    status:'New', assignedTo:'Unassigned', classification:'',
    tactics:['Discovery'], alertIds:['A003','A004'],
    entities:[{type:'File',name:'scanner.exe'},{type:'Device',name:'WKS-01'},{type:'Device',name:'WKS-02'}],
    createdAt:'2026-06-28T14:00:00Z', alertCount:2,
    summary:'Same scanner, new SHA256 after vendor update. Suppression rule pinned to old hash no longer matches.' },
  { id:'INC-1038', severity:'high', title:'Unsigned binary masquerading as scanner.exe',
    status:'New', assignedTo:'Unassigned', classification:'',
    tactics:['Defense Evasion','Discovery'], alertIds:['A005'],
    entities:[{type:'File',name:'scanner.exe'},{type:'Device',name:'WKS-03'}],
    createdAt:'2026-06-28T15:00:00Z', alertCount:1,
    summary:'File named scanner.exe in C:\\Users\\Public — unsigned, completely different hash. Real threat actor pattern.' },
  { id:'INC-1042', severity:'high', title:'Phishing leading to OAuth consent abuse',
    status:'New', assignedTo:'alex.ansbergs', classification:'',
    tactics:['Initial Access','Persistence'], alertIds:['A201','A202'],
    entities:[{type:'User',name:'jane.doe@contoso.com'},{type:'URL',name:'secure-document-portal[.]xyz'},{type:'App',name:'DocViewer Pro'}],
    createdAt:'2026-06-28T08:11:00Z', alertCount:2,
    summary:'User clicked phishing link, then granted a third-party OAuth app Mail.ReadWrite. Likely token-theft persistence.' },
  { id:'INC-1050', severity:'high', title:'Ransomware activity on finance file server',
    status:'New', assignedTo:'Unassigned', classification:'',
    responseTag:'Attack disruption',
    tactics:['Impact','Defense Evasion'], alertIds:['A301','A302'],
    entities:[{type:'Device',name:'FIN-FS-02'},{type:'File',name:'locker.exe'},{type:'Process',name:'vssadmin.exe'}],
    disruptionActions:[
      { time:'2026-06-28T10:18:36Z', action:'Contain user', target:'fin-svc@contoso.com',
        result:'Automated action blocked token reuse and prevented new remote sessions.' },
      { time:'2026-06-28T10:18:48Z', action:'Contain device', target:'FIN-FS-02',
        result:'Device isolated from peer endpoints while preserving Defender service connectivity.' },
      { time:'2026-06-28T10:19:06Z', action:'Stop process tree', target:'locker.exe',
        result:'Malicious encryption process tree terminated before additional shares were touched.' },
    ],
    createdAt:'2026-06-28T10:21:00Z', alertCount:2,
    summary:'Encryption behavior, ransom-note creation, and shadow-copy deletion indicate active ransomware on a file server.' },
  { id:'INC-1051', severity:'high', title:'AiTM phishing against finance user',
    status:'New', assignedTo:'L1-Triage', classification:'',
    tactics:['Initial Access','Credential Access'], alertIds:['A401'],
    entities:[{type:'User',name:'maria.ross@contoso.com'},{type:'IP',name:'185.199.111.12'},{type:'Session',name:'MFA proxied sign-in'}],
    createdAt:'2026-06-28T06:41:00Z', alertCount:1,
    summary:'High-risk sign-in used a valid MFA response through a suspected AiTM phishing proxy. Revoke sessions and require phishing-resistant MFA.' },
  { id:'INC-1052', severity:'high', title:'Possible container breakout in AKS production',
    status:'In progress', assignedTo:'cloud-sec', classification:'',
    tactics:['Privilege Escalation','Defense Evasion'], alertIds:['A501'],
    entities:[{type:'Cluster',name:'aks-prod'},{type:'Container',name:'pod-api-77'},{type:'Device',name:'aks-prod/node-3'}],
    createdAt:'2026-06-28T12:03:00Z', alertCount:1,
    summary:'Container attempted namespace manipulation on the node. Isolate workload, collect image evidence, and rotate cluster credentials.' },
  { id:'INC-1053', severity:'medium', title:'AAD risky sign-in for sales user',
    status:'New', assignedTo:'Unassigned', classification:'',
    tactics:['Credential Access','Initial Access'], alertIds:['A601'],
    entities:[{type:'User',name:'sam.lee@contoso.com'},{type:'IP',name:'91.219.236.54'}],
    createdAt:'2026-06-28T13:28:00Z', alertCount:1,
    summary:'Identity Protection raised a high-risk sign-in from an unfamiliar location. Confirm user activity and reset credentials if suspicious.' },
  { id:'INC-1054', severity:'high', title:'S3-style cloud storage misconfiguration',
    status:'New', assignedTo:'cloud-sec', classification:'',
    tactics:['Exfiltration','Discovery'], alertIds:['A701'],
    entities:[{type:'Storage',name:'aws-s3-prod-logs'},{type:'Cloud account',name:'aws-prod'}],
    createdAt:'2026-06-28T07:53:00Z', alertCount:1,
    summary:'Public-read ACL on a log bucket exposes production telemetry. Remove public access, review object access, and add guardrail policy.' },
];

const MDE_SETTINGS = {
  advancedFeatures:[
    { name:'EDR in block mode', enabled:true, note:'Blocks malicious artifacts after EDR conviction even when another antivirus is primary.' },
    { name:'Live response', enabled:true, note:'Allows approved responders to open device sessions for investigation commands.' },
    { name:'Automated investigation', enabled:true, note:'Lets AIR collect evidence and remediate low-risk findings automatically.' },
    { name:'Custom network indicators', enabled:true, note:'Applies tenant IP/domain allow and block indicators to onboarded endpoints.' },
    { name:'Preview features', enabled:false, note:'Kept off in this lab tenant until SOC leads approve pilot devices.' },
  ],
  rulesSettings:[
    { area:'Alert suppression', setting:'Enabled with expiration review', owner:'SOC engineering' },
    { area:'Indicators', setting:'File, certificate, IP, URL, and domain indicators allowed', owner:'Threat intel' },
    { area:'Endpoint notifications', setting:'User notifications on block actions', owner:'Endpoint platform' },
    { area:'Advanced hunting', setting:'Custom detections can trigger device and file actions', owner:'Detection engineering' },
  ],
  customCollection:[
    { name:'Browser extension inventory', scope:'Pilot devices', table:'DeviceTvmBrowserExtensions', status:'Collecting' },
    { name:'Finance app plugin audit', scope:'Finance device group', table:'DeviceFileEvents', status:'Planned' },
    { name:'High-value server script logs', scope:'Tier 0 servers', table:'DeviceEvents', status:'Collecting' },
  ],
  deviceGroups:[
    { name:'Tier 0 servers', devices:14, automation:'Semi - require approval', role:'Privileged responders', rank:1 },
    { name:'Finance workstations', devices:128, automation:'Full - remediate threats', role:'SOC analysts', rank:2 },
    { name:'Pilot endpoints', devices:32, automation:'Full - preview features', role:'Endpoint engineering', rank:3 },
    { name:'Default', devices:842, automation:'Semi - remediate safe actions', role:'Security readers', rank:4 },
  ],
  roles:[
    { role:'Security administrator', members:'4 users', rights:'Manage settings, device groups, indicators, and roles' },
    { role:'Security operator', members:'12 users', rights:'Investigate alerts, run response actions, approve AIR actions' },
    { role:'Security reader', members:'26 users', rights:'Read-only investigation and reporting access' },
    { role:'Live response operator', members:'5 users', rights:'Run approved live response commands on scoped devices' },
  ],
};

const ASR_POLICIES = [
  { rule:'Block Office from creating child processes', state:'Block', mode:'Enforced', exclusions:['finance-macro-runner.exe'], impact:'3 blocks / 24h' },
  { rule:'Block executable content from email and webmail', state:'Block', mode:'Enforced', exclusions:[], impact:'11 blocks / 24h' },
  { rule:'Block credential stealing from LSASS', state:'Block', mode:'Enforced', exclusions:['edr-sensor-test.exe'], impact:'1 block / 7d' },
  { rule:'Use advanced protection against ransomware', state:'Audit', mode:'Pilot', exclusions:['backup-agent.exe'], impact:'7 audits / 24h' },
  { rule:'Block JavaScript or VBScript from launching downloaded executables', state:'Warn', mode:'User override logged', exclusions:[], impact:'2 warns / 24h' },
  { rule:'Block abuse of vulnerable signed drivers', state:'Block', mode:'Enforced', exclusions:[], impact:'0 blocks / 24h' },
];

const NOTIFICATION_RULES = [
  { name:'High severity incidents', trigger:'Incident created or updated', recipients:'soc-leads@contoso.example', filter:'Severity is High', status:'Enabled' },
  { name:'Pending action approvals', trigger:'Action center item pending', recipients:'endpoint-response@contoso.example', filter:'Action requires approval', status:'Enabled' },
  { name:'Threat analytics exposure', trigger:'Threat analytics report impacts assets', recipients:'threat-intel@contoso.example', filter:'Impacted assets > 0', status:'Enabled' },
];

const ALERT_TUNING_RULES = [
  { name:'Merge scanner waves by device group', type:'Correlation hint', status:'Enabled', condition:'Same title + signer within 2 hours', outcome:'Rolls A001/A002 into scanner incident' },
  { name:'Do not correlate storage posture alerts with endpoint malware', type:'Correlation boundary', status:'Enabled', condition:'Service source differs and no shared entity', outcome:'Keeps cloud posture noise out of ransomware cases' },
  { name:'Escalate OAuth consent after phishing click', type:'Incident severity rule', status:'Enabled', condition:'MDO URL click followed by risky OAuth app', outcome:'Raises INC-1042 to High' },
  { name:'Scanner.exe hash drift review', type:'Tuning rule draft', status:'Draft', condition:'Signed Acme scanner from approved path', outcome:'Candidate for stable suppression or allow indicator' },
];

const AIR_INVESTIGATIONS = [
  { id:'AIR-7101', incident:'INC-1050', title:'Ransomware containment on FIN-FS-02', status:'Completed', verdict:'Malicious', actions:['Isolated FIN-FS-02','Quarantined locker.exe','Stopped process tree'], disruption:true },
  { id:'AIR-7102', incident:'INC-1042', title:'Phishing and OAuth consent abuse', status:'Waiting for approval', verdict:'Malicious', actions:['Soft-delete phishing email','Revoke user sessions','Remove OAuth consent'], disruption:false },
  { id:'AIR-7103', incident:'INC-1031', title:'Scanner update hash drift', status:'Completed', verdict:'Benign', actions:['No remediation','Recommended tuning review'], disruption:false },
];

const INCIDENT_INVESTIGATION_GUIDE = {
  source:'Microsoft Learn: Investigate incidents in the Microsoft Defender portal',
  lastUpdated:'2026-03-11',
  workflow:[
    { title:'Initial investigation',
      detail:'Start from the incident queue or summary pane, review priority, recommendations, related threats, and open the incident page for the full story.' },
    { title:'Attack story',
      detail:'Review the alert story, the incident graph, entity context, chronology, and remediation actions while staying in the same investigation context.' },
    { title:'Go hunt',
      detail:'Pivot from a device, file, IP, URL, user, mailbox, email, app, or cloud resource into advanced hunting queries, then link useful results back to the incident.' },
    { title:'Blast radius',
      detail:'For supported Sentinel data lake tenants, inspect likely propagation paths from an incident node to critical targets and use that context to contain the breach.' },
    { title:'Incident details',
      detail:'Check assignment, ID, classification, categories, first and last activity, impacted assets, recommendations, and disruption or threat context.' },
    { title:'Filter graph',
      detail:'On large incidents, filter by severity, status, or service source, and hide entity types so the graph stays focused on useful investigation paths.' },
    { title:'Alerts',
      detail:'Review related alerts in chronological order, inspect affected entities, and understand why alerts were correlated into the incident.' },
    { title:'Activities',
      detail:'Use the unified activity timeline to audit analyst actions, automation, comments, severity updates, merges, workflow runs, and policy changes.' },
    { title:'Assets',
      detail:'Review impacted devices, users, mailboxes, apps, and cloud resources, then pivot to inventory or entity detail pages for deeper response actions.' },
    { title:'Investigations',
      detail:'Check automated investigation and response status, approve pending actions when required, and inspect the investigation graph for related entities.' },
    { title:'Evidence and Response',
      detail:'Review files, processes, emails, services, IP addresses, and other evidence with verdicts and remediation state; approve or reject pending remediation.' },
    { title:'Summary',
      detail:'Use the summary view for a fast snapshot of alert categories, scope, evidence count, incident properties, and key entities.' },
    { title:'Similar incidents',
      detail:'Compare incidents with similar alerts, entities, or properties to assess campaign scope and whether related cases should be handled together.' },
  ],
  blastRadius:{
    prerequisites:['Microsoft Sentinel data lake onboarding','Exposure management read permission or higher'],
    notes:[
      'Replaces attack path analysis in the incident experience.',
      'Shows possible paths, not guaranteed attacker movement.',
      'Path length is bounded by environment type and available graph data.',
      'Results depend on the viewer RBAC scope and data freshness.',
      'Critical assets must be defined for the graph to show business-impact paths.'
    ],
    roleUses:[
      { role:'Security analyst', use:'Understand current scope, likely paths to targets, and containment points.' },
      { role:'SOC engineer', use:'Prioritize defensive work and communicate protected versus impacted assets.' },
      { role:'Incident response', use:'Map affected systems quickly and take targeted action.' },
      { role:'Security leadership', use:'Track exposure reduction and report response progress.' },
    ]
  }
};

// ---- Per-incident enrichment: activities, evidence, summary, similar, blast paths ----
// Sourced from MS Learn: Investigate incidents in the Microsoft Defender portal.
// Each entry is keyed by incident id; renderIncidentDetail falls back to a generic
// template when an incident is not listed here.

const INCIDENT_ACTIVITIES = {
  'INC-1019': [
    { time:'2026-06-28T03:46:00Z', performedBy:'System (correlation)', origin:'Automation',
      category:'Incident', trigger:'Alert correlation',
      detail:'Alerts A101 and A102 merged into INC-1019 by Defender XDR.' },
    { time:'2026-06-28T03:48:00Z', performedBy:'alex.ansbergs', origin:'Analyst',
      category:'Assignment', trigger:'Manual',
      detail:'Severity set to High; incident assigned to alex.ansbergs.' },
    { time:'2026-06-28T03:52:00Z', performedBy:'Playbook PB-IsolateDC', origin:'Automation',
      category:'Response', trigger:'Automation rule',
      detail:'svc-backup sessions revoked; DC01 isolated pending approval.' },
  ],
  'INC-1042': [
    { time:'2026-06-28T08:25:00Z', performedBy:'System (correlation)', origin:'Automation',
      category:'Incident', trigger:'Alert correlation',
      detail:'Phishing-click alert linked to OAuth consent alert; combined into INC-1042.' },
    { time:'2026-06-28T08:31:00Z', performedBy:'L1-Triage', origin:'Analyst',
      category:'Tag', trigger:'Manual',
      detail:'Tag identity-attack applied; severity confirmed High.' },
    { time:'2026-06-28T08:34:00Z', performedBy:'Playbook PB-RevokeOAuthConsent', origin:'Automation',
      category:'Response', trigger:'Automation rule',
      detail:'DocViewer Pro consent revoked for jane.doe; awaiting tenant-wide block approval.' },
  ],
  'INC-1050': [
    { time:'2026-06-28T10:21:00Z', performedBy:'System (correlation)', origin:'Automation',
      category:'Incident', trigger:'Alert correlation',
      detail:'Ransomware and shadow-copy deletion alerts merged into INC-1050.' },
    { time:'2026-06-28T10:22:00Z', performedBy:'AIR', origin:'Automation',
      category:'Investigation', trigger:'Automated investigation',
      detail:'Automated investigation started; FIN-FS-02 isolated.' },
    { time:'2026-06-28T10:27:00Z', performedBy:'cloud-sec', origin:'Analyst',
      category:'Comment', trigger:'Manual',
      detail:'Backup snapshots from 06-27 confirmed restorable; preparing recovery plan.' },
  ],
};

const INCIDENT_EVIDENCE = {
  'INC-1019': [
    { type:'User',    name:'svc-backup',                  verdict:'Suspicious', remediation:'Pending approval', action:'Disable account' },
    { type:'Device',  name:'DC01',                        verdict:'Suspicious', remediation:'Pending approval', action:'Isolate device' },
    { type:'IP',      name:'10.20.4.55',                  verdict:'Suspicious', remediation:'Not remediated',   action:'Block at firewall' },
    { type:'Object',  name:'AdminSDHolder ACL change',    verdict:'Malicious',  remediation:'Pending approval', action:'Revert ACL' },
  ],
  'INC-1042': [
    { type:'Email',   name:'Phishing message id 0x4f1',   verdict:'Malicious',  remediation:'Remediated',       action:'Soft-deleted' },
    { type:'URL',     name:'secure-document-portal[.]xyz',verdict:'Malicious',  remediation:'Remediated',       action:'Tenant-blocked' },
    { type:'OAuth app', name:'DocViewer Pro',             verdict:'Malicious',  remediation:'Pending approval', action:'Revoke + tenant block' },
    { type:'User',    name:'jane.doe@contoso.com',        verdict:'Suspicious', remediation:'Remediated',       action:'Sessions revoked' },
  ],
  'INC-1050': [
    { type:'File',    name:'locker.exe',                  verdict:'Malicious',  remediation:'Remediated',       action:'Quarantined' },
    { type:'Process', name:'vssadmin.exe Delete Shadows', verdict:'Malicious',  remediation:'Remediated',       action:'Process tree killed' },
    { type:'Device',  name:'FIN-FS-02',                   verdict:'Suspicious', remediation:'Remediated',       action:'Isolated' },
    { type:'Files',   name:'Finance share (12,847 files)',verdict:'Suspicious', remediation:'Pending approval', action:'Restore from snapshot' },
  ],
};

const SIMILAR_INCIDENTS = {
  'INC-1019': [
    { id:'INC-0987', title:'svc-backup directory replication (3 weeks ago)', similarity:'Same user + tactic', severity:'medium' },
    { id:'INC-0902', title:'DCSync from svc-monitor', similarity:'Shared MITRE T1003.006', severity:'high' },
  ],
  'INC-1042': [
    { id:'INC-1031', title:'OAuth consent abuse (DocSign Plus)', similarity:'Same tactic, related app family', severity:'medium' },
    { id:'INC-1024', title:'Phishing leading to credential entry', similarity:'Same initial access vector', severity:'medium' },
  ],
  'INC-1050': [
    { id:'INC-0944', title:'Ransomware on HR file server', similarity:'Same kill-chain, different host', severity:'high' },
    { id:'INC-1024', title:'Scanner activity preceding ransomware', similarity:'Possible recon precursor', severity:'medium' },
  ],
};

const BLAST_RADIUS_PATHS = {
  'INC-1019': {
    source:'DC01',
    paths:[
      { target:'Tier-0 admin group',  hops:2, reach:'Full domain admin compromise',           critical:true  },
      { target:'PKI root CA',         hops:3, reach:'Issue arbitrary smart-card certs',       critical:true  },
      { target:'Backup service',      hops:2, reach:'Tamper with restore points',             critical:true  },
      { target:'Finance file server', hops:4, reach:'Read/modify finance shares',             critical:false },
    ],
  },
  'INC-1042': {
    source:'jane.doe@contoso.com',
    paths:[
      { target:'Finance SharePoint site', hops:2, reach:'Exfiltrate quarterly forecast docs',   critical:true  },
      { target:'Exec mailbox delegates',  hops:3, reach:'Read CFO mailbox via OAuth scope',     critical:true  },
      { target:'M365 admin role',         hops:4, reach:'Privilege escalation via app consent', critical:false },
    ],
  },
  'INC-1050': {
    source:'FIN-FS-02',
    paths:[
      { target:'Backup repository',  hops:2, reach:'Encrypt or delete backups',          critical:true  },
      { target:'Domain controller',  hops:3, reach:'Lateral movement to DC',             critical:true  },
      { target:'Finance workstations',hops:2,reach:'Spread via SMB shares',              critical:false },
    ],
  },
};

// Attack story graphs. Nodes carry a `ring` (0=center, 1=primary entity,
// 2=blast-radius / downstream target). Edges can connect any two nodes
// (not just consecutive), so the renderer draws a webby graph instead of
// a linear chain. Edge.kind hints styling: 'attack' (solid), 'blast'
// (dashed downstream), 'related' (thin gray).
const ATTACK_STORIES = {
  'INC-1019': {
    nodes:[
      { id:'dc01', type:'Device', label:'DC01', ring:0,
        verdict:'Suspicious', remediation:'Isolate device; preserve memory for forensics.' },
      { id:'svc-backup', type:'User', label:'svc-backup', ring:1,
        verdict:'Suspicious', remediation:'Disable account, revoke sessions, audit Kerberos delegation.' },
      { id:'ip-10-20-4-55', type:'IP', label:'10.20.4.55', ring:1,
        verdict:'Suspicious', remediation:'Block at firewall; trace owner & DHCP lease.' },
      { id:'adminsdholder', type:'Directory object', label:'AdminSDHolder', ring:1,
        verdict:'Malicious', remediation:'Revert ACL; review SDProp every-hour audit.' },
      { id:'krbtgt', type:'Account', label:'krbtgt', ring:1,
        verdict:'At risk', remediation:'Plan double krbtgt rotation if compromise confirmed.' },
      { id:'gpo-default', type:'GPO', label:'Default Domain Policy', ring:1,
        verdict:'Suspicious', remediation:'Compare GPO version; restore from last known-good.' },
      { id:'tier0-admins', type:'Group', label:'Tier-0 admins', ring:2,
        verdict:'At risk', remediation:'Full domain admin compromise possible — rotate creds.' },
      { id:'pki-root', type:'Service', label:'PKI root CA', ring:2,
        verdict:'At risk', remediation:'Smart-card cert forgery path; review ADCS issuance.' },
      { id:'backup-svc', type:'Service', label:'Backup service', ring:2,
        verdict:'At risk', remediation:'Verify backup integrity; protect restore points.' },
      { id:'fin-fs-02', type:'Device', label:'FIN-FS-02', ring:2,
        verdict:'Adjacent', remediation:'Monitor; could be reached via Tier-0 path.' },
      { id:'entra-global-admins', type:'Role', label:'Entra Global Administrators', ring:2,
        verdict:'At risk', remediation:'Review privileged role assignments and revoke suspicious tokens.' },
      { id:'key-vault-prod', type:'Vault', label:'Prod Key Vault', ring:2,
        verdict:'At risk', remediation:'Rotate secrets and validate access policies for Tier-0 principals.' },
    ],
    edges:[
      { from:'svc-backup', to:'ip-10-20-4-55', label:'authenticated from', kind:'attack' },
      { from:'ip-10-20-4-55', to:'dc01', label:'reached DC', kind:'attack' },
      { from:'svc-backup', to:'dc01', label:'DCSync request', kind:'attack' },
      { from:'dc01', to:'adminsdholder', label:'modified ACL', kind:'attack' },
      { from:'dc01', to:'krbtgt', label:'replicated secrets', kind:'attack' },
      { from:'dc01', to:'gpo-default', label:'wrote GPO', kind:'attack' },
      { from:'adminsdholder', to:'tier0-admins', label:'persists privilege', kind:'blast' },
      { from:'krbtgt', to:'tier0-admins', label:'golden ticket', kind:'blast' },
      { from:'dc01', to:'pki-root', label:'NTAuthCertificates', kind:'blast' },
      { from:'gpo-default', to:'backup-svc', label:'startup script', kind:'blast' },
      { from:'tier0-admins', to:'fin-fs-02', label:'lateral via admin$', kind:'blast' },
      { from:'tier0-admins', to:'entra-global-admins', label:'hybrid admin path', kind:'blast' },
      { from:'entra-global-admins', to:'key-vault-prod', label:'secret access', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T03:42:00Z', node:'svc-backup', alertId:'A101',
        title:'svc-backup signed in from 10.20.4.55',
        detail:'Service account interactive sign-in from an unfamiliar subnet.',
        remediation:'Compare to baseline locations; disable if unauthorized.' },
      { time:'2026-06-28T03:43:00Z', node:'dc01', alertId:'A102',
        title:'Directory replication request',
        detail:'svc-backup requested domain replication from DC01 — classic DCSync.',
        remediation:'Disable svc-backup, isolate DC01, capture lsass and netstat.' },
      { time:'2026-06-28T03:44:00Z', node:'adminsdholder', alertId:'A101',
        title:'AdminSDHolder ACL touched',
        detail:'Protected-objects ACL modified — persistence pattern.',
        remediation:'Revert ACL; re-run SDProp; audit downstream admin groups.' },
    ]
  },
  'INC-1042': {
    nodes:[
      { id:'user-jane', type:'User', label:'jane.doe@contoso.com', ring:0,
        verdict:'Suspicious', remediation:'Revoke sessions; require phishing-resistant MFA.' },
      { id:'mailbox-jane', type:'Mailbox', label:'Jane Doe mailbox', ring:1,
        verdict:'At risk', remediation:'Audit inbox rules; check forwarding.' },
      { id:'url-doc', type:'URL', label:'secure-document-portal[.]xyz', ring:1,
        verdict:'Malicious', remediation:'Tenant-block; sweep clickers.' },
      { id:'app-docviewer', type:'OAuth app', label:'DocViewer Pro', ring:1,
        verdict:'Malicious', remediation:'Revoke consent; tenant-block app id.' },
      { id:'mail-api', type:'Cloud app', label:'Mail.ReadWrite scope', ring:1,
        verdict:'At risk', remediation:'Audit Graph mailbox access logs.' },
      { id:'consent-grant', type:'Permission', label:'Consent grant 0xA21', ring:1,
        verdict:'Malicious', remediation:'Revoke; investigate downstream API calls.' },
      { id:'finance-sp', type:'SharePoint site', label:'Finance SharePoint', ring:2,
        verdict:'At risk', remediation:'Exfil of quarterly forecasts possible.' },
      { id:'cfo-mailbox', type:'Mailbox', label:'CFO mailbox delegate', ring:2,
        verdict:'At risk', remediation:'CFO inbox readable via Mail.ReadWrite app scope.' },
      { id:'m365-admin', type:'Role', label:'M365 admin role', ring:2,
        verdict:'At risk', remediation:'Possible role escalation via app consent.' },
      { id:'teams-channel', type:'Channel', label:'Finance Teams channel', ring:2,
        verdict:'Adjacent', remediation:'Cross-app token may reach Teams chat history.' },
      { id:'payroll-sp', type:'SharePoint site', label:'Payroll SharePoint', ring:2,
        verdict:'At risk', remediation:'Sensitive payroll files reachable through Files.Read.All.' },
      { id:'hr-mailbox', type:'Mailbox', label:'HR shared mailbox', ring:2,
        verdict:'At risk', remediation:'Shared mailbox readable through delegated app access.' },
      { id:'powerbi-finance', type:'Power BI', label:'Finance Power BI', ring:2,
        verdict:'Adjacent', remediation:'Review app access to finance workspaces and datasets.' },
      { id:'legal-onedrive', type:'OneDrive', label:'Legal OneDrive', ring:2,
        verdict:'At risk', remediation:'Search for sensitive file reads from the app principal.' },
    ],
    edges:[
      { from:'mailbox-jane', to:'url-doc', label:'phishing email', kind:'attack' },
      { from:'url-doc', to:'user-jane', label:'cred-harvest sign-in', kind:'attack' },
      { from:'user-jane', to:'consent-grant', label:'granted', kind:'attack' },
      { from:'consent-grant', to:'app-docviewer', label:'on behalf of', kind:'attack' },
      { from:'app-docviewer', to:'mail-api', label:'requested scope', kind:'attack' },
      { from:'mail-api', to:'mailbox-jane', label:'reads inbox', kind:'attack' },
      { from:'mail-api', to:'cfo-mailbox', label:'reads delegate', kind:'blast' },
      { from:'app-docviewer', to:'finance-sp', label:'Files.Read.All', kind:'blast' },
      { from:'app-docviewer', to:'m365-admin', label:'admin-consent path', kind:'blast' },
      { from:'app-docviewer', to:'teams-channel', label:'ChannelMessage.Read', kind:'blast' },
      { from:'app-docviewer', to:'payroll-sp', label:'Files.Read.All', kind:'blast' },
      { from:'mail-api', to:'hr-mailbox', label:'shared mailbox', kind:'blast' },
      { from:'app-docviewer', to:'powerbi-finance', label:'workspace token', kind:'blast' },
      { from:'app-docviewer', to:'legal-onedrive', label:'OneDrive files', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T08:11:00Z', node:'url-doc', alertId:'A201',
        title:'Malicious URL clicked',
        detail:'Jane opened a phishing link from an email message.',
        remediation:'Soft-delete the message tenant-wide; URL-block.' },
      { time:'2026-06-28T08:23:00Z', node:'consent-grant', alertId:'A202',
        title:'OAuth consent abuse',
        detail:'User granted broad Mail.ReadWrite/Files.Read.All to DocViewer Pro.',
        remediation:'Revoke consent; tenant-block app id; audit Graph calls.' },
      { time:'2026-06-28T08:24:00Z', node:'mail-api', alertId:'A202',
        title:'Mail API access from new app',
        detail:'DocViewer Pro began reading mailbox messages within seconds of consent.',
        remediation:'Block app; review what was read in the last 24h.' },
    ]
  },
  'INC-1050': {
    nodes:[
      { id:'fin-fs-02', type:'Device', label:'FIN-FS-02', ring:0,
        verdict:'Compromised', remediation:'Isolated; preserve volume for forensics.' },
      { id:'locker', type:'File', label:'locker.exe', ring:1,
        verdict:'Malicious', remediation:'Quarantined; pivot to indicators.' },
      { id:'vssadmin', type:'Process', label:'vssadmin Delete Shadows', ring:1,
        verdict:'Malicious', remediation:'Process tree killed; alert on future invocations.' },
      { id:'ransom-note', type:'File', label:'README_DECRYPT.txt', ring:1,
        verdict:'Malicious', remediation:'Collect note; correlate to threat-actor TTP.' },
      { id:'finance-shares', type:'Files', label:'Finance share (12,847)', ring:1,
        verdict:'Encrypted', remediation:'Restore from 06-27 snapshot.' },
      { id:'fin-svc', type:'User', label:'fin-svc (service)', ring:1,
        verdict:'Suspicious', remediation:'Disable; check stored creds + scheduled tasks.' },
      { id:'backup-repo', type:'Service', label:'Backup repository', ring:2,
        verdict:'At risk', remediation:'Verify integrity; lock backup admin creds.' },
      { id:'dc01', type:'Device', label:'DC01', ring:2,
        verdict:'At risk', remediation:'Lateral movement possible — review admin$ shares.' },
      { id:'fin-workstations', type:'Devices', label:'Finance workstations', ring:2,
        verdict:'Adjacent', remediation:'SMB spread risk — sweep for locker.exe.' },
      { id:'erp-app', type:'App', label:'ERP application', ring:2,
        verdict:'Adjacent', remediation:'ERP shares mounted from FIN-FS-02 — check session.' },
    ],
    edges:[
      { from:'fin-svc', to:'fin-fs-02', label:'executed under', kind:'attack' },
      { from:'fin-fs-02', to:'locker', label:'spawned', kind:'attack' },
      { from:'locker', to:'vssadmin', label:'launched', kind:'attack' },
      { from:'locker', to:'ransom-note', label:'dropped', kind:'attack' },
      { from:'locker', to:'finance-shares', label:'encryption impact', kind:'attack' },
      { from:'vssadmin', to:'finance-shares', label:'removed recovery', kind:'attack' },
      { from:'finance-shares', to:'backup-repo', label:'backup chain', kind:'blast' },
      { from:'fin-fs-02', to:'dc01', label:'admin$ over SMB', kind:'blast' },
      { from:'fin-fs-02', to:'fin-workstations', label:'mapped drives', kind:'blast' },
      { from:'finance-shares', to:'erp-app', label:'mounted by', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T10:18:00Z', node:'locker', alertId:'A301',
        title:'Ransomware launched',
        detail:'Encryption behavior + ransom-note creation detected on FIN-FS-02.',
        remediation:'Quarantine; isolate host; capture process tree.' },
      { time:'2026-06-28T10:20:00Z', node:'vssadmin', alertId:'A302',
        title:'Recovery blocked',
        detail:'Shadow copies were deleted before mass file rename.',
        remediation:'Kill tree; ensure backup repository is air-gapped.' },
      { time:'2026-06-28T10:22:00Z', node:'finance-shares', alertId:'A301',
        title:'Mass file rename across share',
        detail:'12,847 files renamed with .locked extension in 90 seconds.',
        remediation:'Restore from 06-27 snapshot; communicate RTO to business.' },
    ]
  },
  'INC-1024': {
    nodes:[
      { id:'scanner-old', type:'File', label:'scanner.exe (legit)', ring:0,
        verdict:'Suppressed', remediation:'Confirm hash matches vendor signature.' },
      { id:'wks-01', type:'Device', label:'WKS-01', ring:1,
        verdict:'Benign', remediation:'Normal scheduled scan.' },
      { id:'wks-02', type:'Device', label:'WKS-02', ring:1,
        verdict:'Benign', remediation:'Normal scheduled scan.' },
      { id:'svc-scan', type:'User', label:'svc-scan', ring:1,
        verdict:'Benign', remediation:'Confirm RBAC scope on scanner service account.' },
      { id:'supp-rule', type:'Rule', label:'Suppress vuln scanner', ring:1,
        verdict:'Active', remediation:'Pinned to file_name + sha256 (AND).' },
      { id:'vendor-cert', type:'Certificate', label:'Vendor signing cert', ring:1,
        verdict:'Trusted', remediation:'Watch for cert revocation.' },
      { id:'dc01', type:'Device', label:'DC01', ring:2,
        verdict:'Recon target', remediation:'Scanner port-scans the DC — verify expected.' },
      { id:'finance-shares', type:'Files', label:'Finance shares', ring:2,
        verdict:'Recon target', remediation:'Scanner inspects shares — confirm scope.' },
      { id:'vpn-gw', type:'Service', label:'VPN gateway', ring:2,
        verdict:'Recon target', remediation:'Scanner enumerates VPN endpoints.' },
    ],
    edges:[
      { from:'svc-scan', to:'wks-01', label:'launched', kind:'attack' },
      { from:'svc-scan', to:'wks-02', label:'launched', kind:'attack' },
      { from:'wks-01', to:'scanner-old', label:'executed', kind:'attack' },
      { from:'wks-02', to:'scanner-old', label:'executed', kind:'attack' },
      { from:'scanner-old', to:'supp-rule', label:'matched (AND)', kind:'related' },
      { from:'scanner-old', to:'vendor-cert', label:'signed by', kind:'related' },
      { from:'scanner-old', to:'dc01', label:'port-scanned', kind:'blast' },
      { from:'scanner-old', to:'finance-shares', label:'enumerated', kind:'blast' },
      { from:'scanner-old', to:'vpn-gw', label:'banner-grabbed', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T09:00:00Z', node:'wks-01', alertId:'A001',
        title:'Scanner run on WKS-01',
        detail:'scanner.exe ran with the known-good vendor hash.',
        remediation:'Suppressed by rule — file_name AND sha256 both matched.' },
      { time:'2026-06-28T09:05:00Z', node:'wks-02', alertId:'A002',
        title:'Scanner run on WKS-02',
        detail:'Same vendor binary; same conditions; suppressed.',
        remediation:'Suppressed by rule.' },
    ]
  },
  'INC-1031': {
    nodes:[
      { id:'scanner-new', type:'File', label:'scanner.exe (post-update)', ring:0,
        verdict:'Unsuppressed', remediation:'Update rule to track new hash or use signer.' },
      { id:'wks-01', type:'Device', label:'WKS-01', ring:1,
        verdict:'Alerting', remediation:'Vendor-updated binary fired alert.' },
      { id:'wks-02', type:'Device', label:'WKS-02', ring:1,
        verdict:'Alerting', remediation:'Vendor-updated binary fired alert.' },
      { id:'svc-scan', type:'User', label:'svc-scan', ring:1,
        verdict:'Benign', remediation:'Same service account as before.' },
      { id:'supp-rule', type:'Rule', label:'Old suppression rule', ring:1,
        verdict:'Stale', remediation:'Replace exact-hash with vendor-signer condition.' },
      { id:'vendor-update', type:'Update', label:'Vendor 4.1.2 patch', ring:1,
        verdict:'Trusted', remediation:'Confirm release notes match new hash.' },
      { id:'soc-queue', type:'Queue', label:'L1 triage queue', ring:2,
        verdict:'Noise risk', remediation:'Two false-positives queued per patch cycle.' },
      { id:'dc01', type:'Device', label:'DC01', ring:2,
        verdict:'Recon target', remediation:'Same scope as INC-1024.' },
      { id:'finance-shares', type:'Files', label:'Finance shares', ring:2,
        verdict:'Recon target', remediation:'Same scope as INC-1024.' },
    ],
    edges:[
      { from:'vendor-update', to:'scanner-new', label:'new sha256', kind:'attack' },
      { from:'svc-scan', to:'wks-01', label:'launched', kind:'attack' },
      { from:'svc-scan', to:'wks-02', label:'launched', kind:'attack' },
      { from:'wks-01', to:'scanner-new', label:'executed', kind:'attack' },
      { from:'wks-02', to:'scanner-new', label:'executed', kind:'attack' },
      { from:'scanner-new', to:'supp-rule', label:'no match', kind:'related' },
      { from:'scanner-new', to:'soc-queue', label:'alerts route to', kind:'blast' },
      { from:'scanner-new', to:'dc01', label:'port-scanned', kind:'blast' },
      { from:'scanner-new', to:'finance-shares', label:'enumerated', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T14:00:00Z', node:'wks-01', alertId:'A003',
        title:'Scanner run after vendor update (WKS-01)',
        detail:'New hash; old suppression no longer matches.',
        remediation:'Update rule to track signer rather than hash.' },
      { time:'2026-06-28T14:15:00Z', node:'wks-02', alertId:'A004',
        title:'Scanner run after vendor update (WKS-02)',
        detail:'Same new hash; second false positive.',
        remediation:'Update rule; communicate change to SOC.' },
    ]
  },
  'INC-1038': {
    nodes:[
      { id:'rogue', type:'File', label:'scanner.exe (rogue)', ring:0,
        verdict:'Malicious', remediation:'Quarantine; pivot to indicators tenant-wide.' },
      { id:'wks-03', type:'Device', label:'WKS-03', ring:1,
        verdict:'Compromised', remediation:'Isolate; collect process tree.' },
      { id:'public-folder', type:'Path', label:'C:\\Users\\Public', ring:1,
        verdict:'Staging', remediation:'Hunt for other staged binaries.' },
      { id:'jdoe', type:'User', label:'jdoe', ring:1,
        verdict:'Suspicious', remediation:'Likely phished; revoke sessions.' },
      { id:'explorer', type:'Process', label:'explorer.exe (parent)', ring:1,
        verdict:'Living-off-land', remediation:'Confirm interactive launch.' },
      { id:'no-cert', type:'Certificate', label:'Unsigned binary', ring:1,
        verdict:'Indicator', remediation:'Block by hash + add to ASR rules.' },
      { id:'ad-admins', type:'Group', label:'AD admins group', ring:2,
        verdict:'At risk', remediation:'Audit recent membership changes.' },
      { id:'customer-db', type:'Database', label:'Customer DB', ring:2,
        verdict:'At risk', remediation:'Review reads from WKS-03 in last 24h.' },
      { id:'dc01', type:'Device', label:'DC01', ring:2,
        verdict:'At risk', remediation:'Watch for follow-on Kerberoasting.' },
    ],
    edges:[
      { from:'jdoe', to:'wks-03', label:'signed in', kind:'attack' },
      { from:'explorer', to:'rogue', label:'spawned', kind:'attack' },
      { from:'rogue', to:'public-folder', label:'staged in', kind:'attack' },
      { from:'rogue', to:'wks-03', label:'lives on', kind:'attack' },
      { from:'rogue', to:'no-cert', label:'no signature', kind:'related' },
      { from:'wks-03', to:'dc01', label:'Kerberos auth', kind:'blast' },
      { from:'wks-03', to:'customer-db', label:'reads', kind:'blast' },
      { from:'rogue', to:'ad-admins', label:'enumerates', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T15:00:00Z', node:'rogue', alertId:'A005',
        title:'Unsigned scanner.exe in C:\\Users\\Public',
        detail:'File name matches the legitimate tool but hash is unknown and binary is unsigned.',
        remediation:'Block by hash; isolate WKS-03; collect investigation package.' },
    ]
  },
  'INC-1051': {
    nodes:[
      { id:'maria', type:'User', label:'maria.ross@contoso.com', ring:0,
        verdict:'Compromised', remediation:'Revoke sessions; reset creds; enforce FIDO2.' },
      { id:'aitm-ip', type:'IP', label:'185.199.111.12 (AiTM proxy)', ring:1,
        verdict:'Malicious', remediation:'Block at IdP and edge; report to CTI.' },
      { id:'mfa-token', type:'Token', label:'Proxied MFA session', ring:1,
        verdict:'Malicious', remediation:'Revoke refresh tokens.' },
      { id:'ca-policy', type:'Policy', label:'Conditional Access', ring:1,
        verdict:'Bypassed', remediation:'Require phishing-resistant MFA for finance group.' },
      { id:'sign-in', type:'Sign-in', label:'06:41 sign-in event', ring:1,
        verdict:'Risky', remediation:'Mark user high-risk in Identity Protection.' },
      { id:'phish-page', type:'URL', label:'login-microsoft[.]click', ring:1,
        verdict:'Malicious', remediation:'Tenant-block; sweep clickers from email logs.' },
      { id:'sharepoint', type:'SharePoint site', label:'Finance SharePoint', ring:2,
        verdict:'At risk', remediation:'Audit doc access for last 4h.' },
      { id:'exchange', type:'Service', label:'Exchange Online', ring:2,
        verdict:'At risk', remediation:'Inspect inbox rules / forwarding.' },
      { id:'teams', type:'Service', label:'Teams chat history', ring:2,
        verdict:'At risk', remediation:'Token covers Teams scope.' },
      { id:'crm', type:'App', label:'Sales CRM (SSO)', ring:2,
        verdict:'At risk', remediation:'SSO downstream; review CRM access logs.' },
    ],
    edges:[
      { from:'phish-page', to:'aitm-ip', label:'served by', kind:'attack' },
      { from:'maria', to:'phish-page', label:'entered creds', kind:'attack' },
      { from:'aitm-ip', to:'mfa-token', label:'proxied MFA', kind:'attack' },
      { from:'mfa-token', to:'sign-in', label:'sealed session', kind:'attack' },
      { from:'sign-in', to:'maria', label:'as user', kind:'attack' },
      { from:'sign-in', to:'ca-policy', label:'evaluated', kind:'related' },
      { from:'mfa-token', to:'sharepoint', label:'SSO scope', kind:'blast' },
      { from:'mfa-token', to:'exchange', label:'SSO scope', kind:'blast' },
      { from:'mfa-token', to:'teams', label:'SSO scope', kind:'blast' },
      { from:'mfa-token', to:'crm', label:'SSO scope', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T06:41:00Z', node:'sign-in', alertId:'A401',
        title:'High-risk sign-in via AiTM proxy',
        detail:'Valid MFA response came through a known AiTM proxy IP.',
        remediation:'Revoke sessions; require phishing-resistant MFA.' },
    ]
  },
  'INC-1052': {
    nodes:[
      { id:'pod', type:'Container', label:'pod-api-77', ring:0,
        verdict:'Compromised', remediation:'Cordon node; collect pod logs + image.' },
      { id:'cluster', type:'Cluster', label:'aks-prod', ring:1,
        verdict:'At risk', remediation:'Rotate cluster admin certs.' },
      { id:'node-3', type:'Device', label:'aks-prod/node-3', ring:1,
        verdict:'At risk', remediation:'Drain + reimage.' },
      { id:'setns', type:'Syscall', label:'setns() call', ring:1,
        verdict:'Malicious', remediation:'Indicator of escape attempt.' },
      { id:'image', type:'Image', label:'api:v2.4.1 (vuln)', ring:1,
        verdict:'Vulnerable', remediation:'Pin to patched tag; rebuild.' },
      { id:'sa-token', type:'Token', label:'Service-account token', ring:1,
        verdict:'At risk', remediation:'Revoke; recreate SA.' },
      { id:'kubelet', type:'Service', label:'kubelet', ring:2,
        verdict:'At risk', remediation:'Audit /pods endpoint access.' },
      { id:'api-server', type:'Service', label:'kube-apiserver', ring:2,
        verdict:'At risk', remediation:'Review SA permissions to API.' },
      { id:'etcd', type:'Service', label:'etcd', ring:2,
        verdict:'Critical', remediation:'Confirm no secrets exfil; rotate keys.' },
      { id:'cloud-creds', type:'Credential', label:'Node instance creds (IMDS)', ring:2,
        verdict:'At risk', remediation:'Rotate IAM role; disable IMDSv1.' },
    ],
    edges:[
      { from:'image', to:'pod', label:'runs as', kind:'attack' },
      { from:'pod', to:'setns', label:'invoked', kind:'attack' },
      { from:'setns', to:'node-3', label:'host namespace', kind:'attack' },
      { from:'pod', to:'sa-token', label:'mounts', kind:'attack' },
      { from:'pod', to:'cluster', label:'workload in', kind:'related' },
      { from:'sa-token', to:'api-server', label:'authenticates', kind:'blast' },
      { from:'api-server', to:'etcd', label:'reads secrets', kind:'blast' },
      { from:'node-3', to:'kubelet', label:'host control', kind:'blast' },
      { from:'node-3', to:'cloud-creds', label:'IMDS access', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T12:03:00Z', node:'setns', alertId:'A501',
        title:'Namespace escape attempt',
        detail:'Container invoked setns() on host PID namespace.',
        remediation:'Cordon node; isolate workload; preserve image for forensics.' },
    ]
  },
  'INC-1053': {
    nodes:[
      { id:'sam', type:'User', label:'sam.lee@contoso.com', ring:0,
        verdict:'At risk', remediation:'Confirm sign-in with user; reset creds if needed.' },
      { id:'risky-ip', type:'IP', label:'91.219.236.54', ring:1,
        verdict:'Suspicious', remediation:'Block IP; check threat-intel reputation.' },
      { id:'unfamiliar-loc', type:'Location', label:'Unfamiliar city (BG)', ring:1,
        verdict:'Suspicious', remediation:'Compare to baseline travel.' },
      { id:'aad-policy', type:'Policy', label:'AAD risk-based CA', ring:1,
        verdict:'Triggered', remediation:'Verify policy required MFA + password change.' },
      { id:'token', type:'Token', label:'Refresh token', ring:1,
        verdict:'Held', remediation:'Revoke; force interactive sign-in.' },
      { id:'crm', type:'App', label:'Sales CRM', ring:2,
        verdict:'At risk', remediation:'Audit CRM access logs for sam.lee.' },
      { id:'salesforce', type:'App', label:'Salesforce (SSO)', ring:2,
        verdict:'At risk', remediation:'Review Salesforce login from same IP.' },
      { id:'sales-sp', type:'SharePoint site', label:'Sales SharePoint', ring:2,
        verdict:'At risk', remediation:'Audit doc access; revoke share links if leaked.' },
    ],
    edges:[
      { from:'risky-ip', to:'unfamiliar-loc', label:'resolves to', kind:'related' },
      { from:'risky-ip', to:'sam', label:'signed in as', kind:'attack' },
      { from:'sam', to:'aad-policy', label:'evaluated', kind:'related' },
      { from:'sam', to:'token', label:'holds', kind:'attack' },
      { from:'token', to:'crm', label:'SSO scope', kind:'blast' },
      { from:'token', to:'salesforce', label:'SSO scope', kind:'blast' },
      { from:'token', to:'sales-sp', label:'SSO scope', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T13:28:00Z', node:'sam', alertId:'A601',
        title:'High-risk sign-in (unfamiliar location)',
        detail:'Identity Protection flagged sign-in for sam.lee from a new city.',
        remediation:'Confirm with user; if unauthorized, revoke sessions + reset.' },
    ]
  },
  'INC-1054': {
    nodes:[
      { id:'bucket', type:'Storage', label:'aws-s3-prod-logs', ring:0,
        verdict:'Exposed', remediation:'Remove public-read ACL; add bucket policy guardrail.' },
      { id:'aws-acct', type:'Cloud account', label:'aws-prod', ring:1,
        verdict:'At risk', remediation:'Audit recent IAM changes.' },
      { id:'put-acl', type:'API call', label:'PutBucketAcl', ring:1,
        verdict:'Malicious', remediation:'Reverse change; capture caller.' },
      { id:'breakglass', type:'User', label:'aws-prod-breakglass', ring:1,
        verdict:'Suspicious', remediation:'Rotate creds; check MFA + last use.' },
      { id:'acl-public', type:'Policy', label:'public-read ACL', ring:1,
        verdict:'Misconfig', remediation:'Replace with private + signed URLs.' },
      { id:'cloudtrail', type:'Log', label:'CloudTrail event 9c2', ring:1,
        verdict:'Evidence', remediation:'Preserve; export for compliance.' },
      { id:'customer-data', type:'Data', label:'Customer telemetry', ring:2,
        verdict:'Exposed', remediation:'Determine what was readable + when.' },
      { id:'audit-logs', type:'Data', label:'Audit logs', ring:2,
        verdict:'Exposed', remediation:'Audit logs readable for window of exposure.' },
      { id:'siem-ingest', type:'Service', label:'SIEM ingestion pipe', ring:2,
        verdict:'At risk', remediation:'Bucket feeds SIEM — verify no tampering.' },
      { id:'gdpr', type:'Compliance', label:'GDPR exposure', ring:2,
        verdict:'Reportable', remediation:'Engage legal; clock starts on awareness.' },
    ],
    edges:[
      { from:'breakglass', to:'put-acl', label:'invoked', kind:'attack' },
      { from:'put-acl', to:'bucket', label:'on bucket', kind:'attack' },
      { from:'put-acl', to:'acl-public', label:'set', kind:'attack' },
      { from:'put-acl', to:'cloudtrail', label:'logged in', kind:'related' },
      { from:'bucket', to:'aws-acct', label:'belongs to', kind:'related' },
      { from:'acl-public', to:'customer-data', label:'exposes', kind:'blast' },
      { from:'acl-public', to:'audit-logs', label:'exposes', kind:'blast' },
      { from:'bucket', to:'siem-ingest', label:'feeds', kind:'blast' },
      { from:'customer-data', to:'gdpr', label:'triggers', kind:'blast' },
    ],
    steps:[
      { time:'2026-06-28T07:53:00Z', node:'put-acl', alertId:'A701',
        title:'PutBucketAcl set public-read',
        detail:'Breakglass user changed bucket ACL to allow public reads.',
        remediation:'Reverse change; rotate breakglass creds; preserve CloudTrail.' },
    ]
  },
};

const THREAT_REPORTS = [
  { id:'TR-001', name:'Storm-1947 ransomware activity', type:'Ransomware', status:'Active campaign',
    impactedAssets:4, severity:'high', relatedIncidents:['INC-1050'], exposure:'2 exposed servers, 1 vulnerable signed driver, 1 unmanaged file share',
    summary:'Double-extortion ransomware operator using ScreenConnect for initial access; recent shift to BYOVD techniques.',
    overview:['Active exploitation is focused on remote management tools and finance file shares.','Tenant exposure is concentrated on FIN-FS-02 and two internet-facing endpoints.'],
    analystReport:['Treat remote interactive logons followed by shadow-copy deletion as high-confidence ransomware staging.','Prioritize device isolation and investigation package collection before restoring files.'],
    recommendations:['Contain FIN-FS-02 and confirm attack disruption actions completed.','Hunt for vssadmin.exe, wbadmin.exe, and suspicious driver loads in the last 7 days.','Patch exposed remote management tools or remove external access.'] },
  { id:'TR-002', name:'Midnight Blizzard credential-theft phishing', type:'Activity group',
    status:'Active campaign', impactedAssets:1, severity:'high', relatedIncidents:['INC-1042'], exposure:'1 OAuth app consent, 1 affected mailbox, 3 broad Graph permissions',
    summary:'State-aligned actor targeting M365 admins via device-code phishing into OAuth consent grants.',
    overview:['The report connects phishing, OAuth consent, and Graph mailbox access into one investigation path.','The lab tenant has one matching incident: Jane Doe granting DocViewer Pro mail and file scopes.'],
    analystReport:['OAuth persistence survives password reset until consent and refresh tokens are revoked.','Graph activity logs help confirm whether the app enumerated messages, files, or directory objects after consent.'],
    recommendations:['Revoke DocViewer Pro consent and Jane Doe sessions.','Query CloudAppEvents and MicrosoftGraphActivityLogs for the app ID.','Review app governance for unverified publishers requesting mail write scopes.'] },
  { id:'TR-003', name:'AiTM phishing kits (Tycoon 2FA)', type:'Tool', status:'Active campaign',
    impactedAssets:2, severity:'medium', relatedIncidents:['INC-1051','INC-1053'], exposure:'2 risky sign-ins, 1 MFA-proxied session, 1 blocked Azure Portal attempt',
    summary:'Adversary-in-the-middle phishing pages proxy MFA prompts and steal session cookies; bypasses non-FIDO MFA.',
    overview:['The campaign explains why a successful MFA prompt can still be suspicious.','Relevant tenant signals are unfamiliar properties, impossible travel, and follow-on portal access.'],
    analystReport:['A valid MFA result is not a benign signal when the session source, user agent, and travel pattern are abnormal.','Use risk detections to decide whether to confirm compromise or dismiss user risk.'],
    recommendations:['Revoke sessions for Maria Ross and Sam Lee pending user validation.','Require phishing-resistant MFA for finance and admin users.','Create a hunting query for risky sign-ins followed by Graph or Azure Portal access.'] },
  { id:'TR-004', name:'AsyncRAT delivered via .lnk in archives', type:'Malware',
    status:'Active campaign', impactedAssets:0, severity:'medium', relatedIncidents:[], exposure:'No matching tenant assets in the last 30 days',
    summary:'Commodity RAT delivered through .zip → .lnk → PowerShell chain; persists via Run key.',
    overview:['No active exposure is present, so use this report as preventive detection guidance.','The useful outcome is a custom detection for suspicious archive-to-script execution chains.'],
    analystReport:['Commodity RAT delivery changes file names frequently, so behavior-based detections are more durable than hash-only matching.'],
    recommendations:['Keep ASR blocking script-launched executables enabled.','Hunt for .lnk launches from archive extraction paths.','Monitor new startup Run key values created by Office or archive child processes.'] },
];

const HUNTING_TABLES = ['AlertEvidence','AlertInfo','CloudAppEvents','DeviceEvents',
  'DeviceFileCertificateInfo','DeviceFileEvents','DeviceImageLoadEvents','DeviceInfo',
  'DeviceLogonEvents','DeviceNetworkEvents','DeviceNetworkInfo','DeviceProcessEvents',
  'DeviceRegistryEvents','DeviceTvmSecureConfigurationAssessment',
  'DeviceTvmSecureConfigurationAssessmentKB','DeviceTvmSoftwareInventory',
  'DeviceTvmSoftwareVulnerabilities','DeviceTvmSoftwareVulnerabilitiesKB',
  'EmailAttachmentInfo','EmailEvents','EmailPostDeliveryEvents','EmailUrlInfo','UrlClickEvents',
  'IdentityDirectoryEvents','IdentityInfo','IdentityLogonEvents','IdentityQueryEvents',
  'MicrosoftGraphActivityLogs','OAuthAppInfo','SigninLogs','ContainerEvents'];

const HUNTING_SCHEMA_GROUPS = [
  { name:'Alerts', tables:['AlertInfo','AlertEvidence'] },
  { name:'Apps & identities',
    tables:['IdentityInfo','IdentityLogonEvents','IdentityQueryEvents',
      'IdentityDirectoryEvents','CloudAppEvents','MicrosoftGraphActivityLogs','OAuthAppInfo'] },
  { name:'Email',
    tables:['EmailEvents','EmailAttachmentInfo','EmailUrlInfo',
      'EmailPostDeliveryEvents','UrlClickEvents'] },
  { name:'Devices',
    tables:['DeviceInfo','DeviceNetworkInfo','DeviceProcessEvents',
      'DeviceNetworkEvents','DeviceFileEvents','DeviceRegistryEvents',
      'DeviceLogonEvents','DeviceImageLoadEvents','DeviceEvents'] },
  { name:'Vulnerability management',
    tables:['DeviceTvmSoftwareInventory','DeviceTvmSoftwareVulnerabilities',
      'DeviceTvmSoftwareVulnerabilitiesKB','DeviceTvmSecureConfigurationAssessment',
      'DeviceTvmSecureConfigurationAssessmentKB'] },
];

const HUNTING_SCHEMA_NOTES = [
  { title:'Event and activity tables',
    detail:'Alert, endpoint, email, identity, cloud app, and assessment events arrive shortly after the source service processes sensor data.' },
  { title:'Entity tables',
    detail:'Device, identity, network, and inventory records are refreshed about every 15 minutes, then consolidated into fuller entity snapshots daily.' },
  { title:'Time zone',
    detail:'Advanced hunting timestamps are UTC. Convert during reporting, but keep KQL joins and detection windows in UTC.' },
  { title:'Schema reference',
    detail:'Use table descriptions, column lists, ActionType values, and samples to decide whether to hunt in event tables or entity tables.' },
];

const CUSTOM_DETECTION_FREQUENCIES = [
  { frequency:'Continuous (NRT)', lookback:'Near real time',
    use:'Use for high-confidence event patterns where the SOC can respond quickly.' },
  { frequency:'Every hour', lookback:'Past 4 hours',
    use:'Good for fast recurring checks that can tolerate a short delay.' },
  { frequency:'Every 3 hours', lookback:'Past 12 hours',
    use:'Useful for bursty activity and medium-volume detections.' },
  { frequency:'Every 12 hours', lookback:'Past 48 hours',
    use:'Use for posture or lower-urgency reviews.' },
  { frequency:'Every 24 hours', lookback:'Past 30 days',
    use:'Best for daily hygiene or rare-condition detections.' },
];

const CUSTOM_DETECTION_RESPONSE_ACTIONS = [
  { entity:'DeviceId', actions:['Isolate device','Collect investigation package','Run antivirus scan','Initiate investigation'] },
  { entity:'SHA1 or InitiatingProcessSHA1', actions:['Allow or block file','Quarantine file'] },
];

const CUSTOM_DETECTION_SAMPLE = {
  name:'Repeated antivirus detections by device',
  requiredColumns:['Timestamp','DeviceId','ReportId'],
  query:`DeviceEvents
| where Timestamp > ago(7d)
| where ActionType == "AntivirusDetection"
| summarize (Timestamp, ReportId)=arg_max(Timestamp, ReportId), count() by DeviceId
| where count_ > 5`,
};

const HUNTING_GRAPH_SCENARIOS = [
  { name:'Paths between two entities',
    input:'Start entity, end entity',
    question:'Is there a traversable path from one entity to another?' },
  { name:'Users with access to sensitive data',
    input:'Target storage account',
    question:'Which users can reach a sensitive storage asset?' },
  { name:'Data exfiltration by a device',
    input:'Source device',
    question:'What storage accounts can a given device access?' },
  { name:'Paths to a highly critical Kubernetes cluster',
    input:'Target Kubernetes cluster',
    question:'Which actors can reach a critical cluster?' },
  { name:'Identities with access to Azure DevOps repositories',
    input:'Target ADO repository',
    question:'Who can read or write a specific repository?' },
  { name:'Nodes in highest number of paths to SQL data stores',
    input:'None',
    question:'Which entities are high-leverage choke points for SQL data access?' },
  { name:'Critical users with access to sensitive storage',
    input:'None',
    question:'Which privileged identities can touch sensitive data?' },
  { name:'Entities that have access to a key vault',
    input:'Target key vault',
    question:'Who can directly or indirectly reach a Key Vault?' },
];

const HUNTING_GRAPH_FILTERS = [
  'Shortest paths only',
  'Source is critical',
  'Target has sensitive data',
  'Node is vulnerable',
  'Node is exposed to internet',
  'Edge type: has permissions to',
  'Edge type: can authenticate as',
  'Edge type: member of',
  'Edge type: can impersonate as',
];

const SAVED_QUERIES = [
  { name:'Process executions from Public folder',
    table:'DeviceProcessEvents', description:'Binaries running out of C:\\Users\\Public are commonly attacker staging.',
    query:`DeviceProcessEvents\n| where FolderPath startswith "C:\\\\Users\\\\Public"\n| where InitiatingProcessFileName !in ("explorer.exe","msiexec.exe")\n| project Timestamp, DeviceName, FileName, FolderPath, SHA256, AccountName\n| top 100 by Timestamp desc` },
  { name:'OAuth consent to risky apps',
    table:'CloudAppEvents', description:'New OAuth consent grants to apps with broad mail/files scopes.',
    query:`CloudAppEvents\n| where ActionType == "Consent to application"\n| extend Perms = tostring(RawEventData.ModifiedProperties)\n| where Perms has_any ("Mail.ReadWrite","Files.Read.All","User.Read.All")\n| project Timestamp, AccountDisplayName, ApplicationId, Perms` },
  { name:'Suspicious DC replication',
    table:'IdentityLogonEvents', description:'Detect possible DCSync via accounts that should not replicate.',
    query:`IdentityLogonEvents\n| where ActionType == "DirectoryServicesReplication"\n| where AccountName !in ("krbtgt","Administrator")\n| project Timestamp, AccountName, DeviceName, IPAddress` },
  { name:'Ransomware shadow copy deletion',
    table:'DeviceProcessEvents', description:'Find vssadmin shadow-copy deletion used before encryption.',
    query:`DeviceProcessEvents\n| where FileName == "vssadmin.exe"\n| project Timestamp, DeviceName, FileName, ProcessCommandLine, AccountName` },
  { name:'Risky sign-ins by user',
    table:'SigninLogs', description:'Filter Entra sign-in rows for high-risk users.',
    query:`SigninLogs\n| where UserPrincipalName == "sam.lee@contoso.com"\n| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevel, ResultType` },
  { name:'Container namespace escape signal',
    table:'ContainerEvents', description:'Look for container processes touching host namespaces.',
    query:`ContainerEvents\n| where ClusterName == "aks-prod"\n| where Syscall == "setns"\n| project TimeGenerated, ClusterName, PodName, Image, Syscall, NodeName` },
  { name:'Endpoint ↔ identity logon join (AccountSid)',
    table:'DeviceLogonEvents', description:'Canonical SC-200 pattern: correlate an endpoint logon to a domain auth event using AccountSid within a ±2 min window.',
    query:`DeviceLogonEvents\n| where Timestamp > ago(1d)\n| join kind=inner (\n    IdentityLogonEvents\n    | where Timestamp > ago(1d)\n    | project IdTime=Timestamp, AccountSid, IPAddress, Application, IdActionType=ActionType\n  ) on AccountSid\n| where abs(datetime_diff('second', Timestamp, IdTime)) < 120\n| project Timestamp, DeviceName, AccountName, AccountSid, LogonType, RemoteIP, IPAddress, Application, IdActionType` },
  { name:'Failed interactive logons by SID',
    table:'DeviceLogonEvents', description:'Repeated LogonFailed events for the same SID — bruteforce or stale creds.',
    query:`DeviceLogonEvents\n| where ActionType == "LogonFailed"\n| where LogonType == "Interactive"\n| summarize Attempts=count() by AccountSid, AccountName, DeviceName, bin(Timestamp, 5m)\n| where Attempts >= 3` },
  { name:'Cloud storage public access changes',
    table:'CloudAppEvents', description:'Find storage ACL changes that expose buckets or containers.',
    query:`CloudAppEvents\n| where ActionType == "PutBucketAcl"\n| where BucketName == "aws-s3-prod-logs"\n| project Timestamp, AccountDisplayName, ActionType, BucketName, AccessLevel` },
  { name:'Find all devices that are internet facing',
    table:'DeviceInfo', description:'Surface endpoints that received external incoming communication.',
    query:`DeviceInfo\n| where IsInternetFacing == true\n| project Timestamp, DeviceName, OSPlatform, PublicIP, IsInternetFacing, ExposureLevel` },
  { name:'Graph app mailbox access after consent',
    table:'MicrosoftGraphActivityLogs', description:'Review Microsoft Graph calls made by an OAuth app after a risky consent grant.',
    query:`MicrosoftGraphActivityLogs\n| where AppDisplayName == "DocViewer Pro"\n| project TimeGenerated, UserPrincipalName, AppDisplayName, Operation, RequestUri, IPAddress, ResultStatus` },
];

const MOCK_QUERY_RESULTS = {
  DeviceInfo: [
    { Timestamp:'2026-06-28T15:02:11Z', DeviceName:'WKS-03', OSPlatform:'Windows 11 Enterprise',
      PublicIP:'198.51.100.41', IsInternetFacing:true, ExposureLevel:'High' },
    { Timestamp:'2026-06-28T10:22:00Z', DeviceName:'FIN-FS-02', OSPlatform:'Windows Server 2022',
      PublicIP:'', IsInternetFacing:false, ExposureLevel:'Medium' },
  ],
  DeviceProcessEvents: [
    { Timestamp:'2026-06-28T15:00:01Z', DeviceName:'WKS-03', FileName:'scanner.exe',
      FolderPath:'C:\\Users\\Public\\scanner.exe', SHA256:ROGUE_HASH.slice(0,16)+'…', AccountName:'jdoe' },
    { Timestamp:'2026-06-28T14:15:02Z', DeviceName:'WKS-02', FileName:'scanner.exe',
      FolderPath:'C:\\Tools\\Scanner\\scanner.exe', SHA256:POST_UPDATE_HASH.slice(0,16)+'…', AccountName:'svc-scan' },
    { Timestamp:'2026-06-28T14:00:11Z', DeviceName:'WKS-01', FileName:'scanner.exe',
      FolderPath:'C:\\Tools\\Scanner\\scanner.exe', SHA256:POST_UPDATE_HASH.slice(0,16)+'…', AccountName:'svc-scan' },
    { Timestamp:'2026-06-28T09:05:00Z', DeviceName:'WKS-02', FileName:'scanner.exe',
      FolderPath:'C:\\Tools\\Scanner\\scanner.exe', SHA256:KNOWN_GOOD_HASH.slice(0,16)+'…', AccountName:'svc-scan' },
    { Timestamp:'2026-06-28T10:20:04Z', DeviceName:'FIN-FS-02', FileName:'vssadmin.exe',
      FolderPath:'C:\\Windows\\System32\\vssadmin.exe', SHA256:'eeeeeeeeeeeeeeee…', AccountName:'fin-svc',
      ProcessCommandLine:'vssadmin delete shadows /all /quiet' },
    { Timestamp:'2026-06-28T10:18:21Z', DeviceName:'FIN-FS-02', FileName:'locker.exe',
      FolderPath:'C:\\ProgramData\\locker.exe', SHA256:'dddddddddddddddd…', AccountName:'fin-svc',
      ProcessCommandLine:'locker.exe --encrypt --shares' },
  ],
  CloudAppEvents: [
    { Timestamp:'2026-06-28T08:23:00Z', AccountDisplayName:'Jane Doe',
      ApplicationId:'b9f2…ad21', Perms:'Mail.ReadWrite, Files.Read.All' },
    { Timestamp:'2026-06-28T07:52:14Z', AccountDisplayName:'aws-prod-breakglass',
      ActionType:'PutBucketAcl', BucketName:'aws-s3-prod-logs', AccessLevel:'public-read' },
  ],
  MicrosoftGraphActivityLogs: [
    { TimeGenerated:'2026-06-28T08:31:00Z', UserPrincipalName:'jane.doe@contoso.com',
      AppDisplayName:'DocViewer Pro', AppId:'b9f2-demo-ad21', Operation:'Mail.Read',
      RequestUri:'/users/jane.doe@contoso.com/messages', IPAddress:'76.21.55.4', ResultStatus:'Success' },
    { TimeGenerated:'2026-06-28T08:33:12Z', UserPrincipalName:'jane.doe@contoso.com',
      AppDisplayName:'DocViewer Pro', AppId:'b9f2-demo-ad21', Operation:'Files.Read.All',
      RequestUri:'/users/jane.doe@contoso.com/drive/root/search(q=invoice)', IPAddress:'76.21.55.4', ResultStatus:'Success' },
    { TimeGenerated:'2026-06-28T08:36:44Z', UserPrincipalName:'jane.doe@contoso.com',
      AppDisplayName:'DocViewer Pro', AppId:'b9f2-demo-ad21', Operation:'Mail.Send',
      RequestUri:'/users/jane.doe@contoso.com/sendMail', IPAddress:'76.21.55.4', ResultStatus:'Denied' },
    { TimeGenerated:'2026-06-28T13:34:09Z', UserPrincipalName:'sam.lee@contoso.com',
      AppDisplayName:'Graph PowerShell', AppId:'graph-powershell-demo', Operation:'Directory.Read.All',
      RequestUri:'/users?$select=id,userPrincipalName', IPAddress:'91.219.236.54', ResultStatus:'ConditionalAccessBlocked' },
  ],
  DeviceLogonEvents: [
    { Timestamp:'2026-06-28T03:44:05Z', DeviceName:'FIN-FS-02', ActionType:'LogonSuccess',
      LogonType:'Network', AccountName:'svc-backup', AccountDomain:'CONTOSO',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-1144',
      RemoteIP:'10.20.4.55', RemoteDeviceName:'DC01', Protocol:'Kerberos', IsLocalAdmin:false },
    { Timestamp:'2026-06-28T10:17:55Z', DeviceName:'FIN-FS-02', ActionType:'LogonSuccess',
      LogonType:'RemoteInteractive', AccountName:'fin-svc', AccountDomain:'CONTOSO',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-2207',
      RemoteIP:'10.20.7.14', RemoteDeviceName:'WKS-03', Protocol:'NTLM', IsLocalAdmin:true },
    { Timestamp:'2026-06-28T14:59:48Z', DeviceName:'WKS-03', ActionType:'LogonFailed',
      LogonType:'Interactive', AccountName:'jdoe', AccountDomain:'CONTOSO',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-1812',
      FailureReason:'BadPassword', Protocol:'Kerberos', IsLocalAdmin:false },
    { Timestamp:'2026-06-28T15:00:00Z', DeviceName:'WKS-03', ActionType:'LogonSuccess',
      LogonType:'Interactive', AccountName:'jdoe', AccountDomain:'CONTOSO',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-1812',
      RemoteIP:'', Protocol:'Kerberos', IsLocalAdmin:false },
  ],
  IdentityLogonEvents: [
    { Timestamp:'2026-06-28T03:44:00Z', ActionType:'LogonSuccess', Application:'Active Directory',
      LogonType:'Network', Protocol:'Kerberos',
      AccountName:'svc-backup', AccountDomain:'CONTOSO',
      AccountUpn:'svc-backup@contoso.com',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-1144',
      AccountObjectId:'9b21a4e0-1f44-4b13-9fd0-1f6b8a3c0011',
      DeviceName:'DC01', IPAddress:'10.20.4.55', DestinationDeviceName:'DC01' },
    { Timestamp:'2026-06-28T10:17:58Z', ActionType:'LogonSuccess', Application:'Active Directory',
      LogonType:'Remote interactive', Protocol:'NTLM',
      AccountName:'fin-svc', AccountDomain:'CONTOSO',
      AccountUpn:'fin-svc@contoso.com',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-2207',
      AccountObjectId:'1c54f7d2-8e09-4d3b-b71a-2cf90a4f7d22',
      DeviceName:'WKS-03', IPAddress:'10.20.7.14', DestinationDeviceName:'FIN-FS-02' },
    { Timestamp:'2026-06-28T14:59:55Z', ActionType:'LogonFailed', Application:'Active Directory',
      LogonType:'Interactive', Protocol:'Kerberos', FailureReason:'BadPassword',
      AccountName:'jdoe', AccountDomain:'CONTOSO',
      AccountUpn:'jane.doe@contoso.com',
      AccountSid:'S-1-5-21-1180699209-877415012-3182924384-1812',
      AccountObjectId:'7f2b1e90-5c10-4ad9-b3e3-44ea7c8b1cf3',
      DeviceName:'WKS-03', IPAddress:'10.20.7.42' },
  ],
  SigninLogs: [
    { TimeGenerated:'2026-06-28T13:27:00Z', UserPrincipalName:'sam.lee@contoso.com',
      IPAddress:'91.219.236.54', RiskLevel:'High', ResultType:'0' },
    { TimeGenerated:'2026-06-28T06:40:00Z', UserPrincipalName:'maria.ross@contoso.com',
      IPAddress:'185.199.111.12', RiskLevel:'High', ResultType:'0' },
  ],
  ContainerEvents: [
    { TimeGenerated:'2026-06-28T12:01:00Z', ClusterName:'aks-prod', PodName:'pod-api-77',
      Image:'contoso/api:2026.06', Syscall:'setns', NodeName:'aks-prod/node-3' },
  ],
  SecurityEvent: [
    { TimeGenerated:'2026-07-06T08:12:00Z', Computer:'DC01', EventID:4624,
      Account:'CONTOSO\\svc-backup', Activity:'An account was successfully logged on', IpAddress:'10.20.4.55', LogonType:3 },
    { TimeGenerated:'2026-07-06T08:14:32Z', Computer:'WKS-03', EventID:4625,
      Account:'CONTOSO\\jdoe', Activity:'An account failed to log on', IpAddress:'10.20.7.42', LogonType:2 },
    { TimeGenerated:'2026-07-06T08:16:18Z', Computer:'FIN-FS-02', EventID:4672,
      Account:'CONTOSO\\fin-svc', Activity:'Special privileges assigned to new logon', IpAddress:'10.20.7.14', LogonType:10 },
    { TimeGenerated:'2026-07-06T08:17:44Z', Computer:'WKS-03', EventID:4688,
      Account:'CONTOSO\\jdoe', Activity:'A new process has been created', NewProcessName:'C:\\Users\\Public\\scanner.exe' },
  ],
  WindowsEvent: [
    { TimeGenerated:'2026-07-06T08:12:00Z', Computer:'DC01', EventID:4624, Channel:'Security',
      Provider:'Microsoft-Windows-Security-Auditing', RenderedDescription:'Successful logon for CONTOSO\\svc-backup' },
    { TimeGenerated:'2026-07-06T08:17:44Z', Computer:'WKS-03', EventID:4688, Channel:'Security',
      Provider:'Microsoft-Windows-Security-Auditing', RenderedDescription:'Process creation for C:\\Users\\Public\\scanner.exe' },
  ],
  CommonSecurityLog: [
    { TimeGenerated:'2026-07-06T08:20:00Z', DeviceVendor:'Contoso Firewall', DeviceProduct:'EdgeFW',
      DeviceAction:'deny', LogSeverity:'High', SourceIP:'10.20.7.14', DestinationIP:'203.0.113.10', DestinationPort:443 },
    { TimeGenerated:'2026-07-06T08:21:08Z', DeviceVendor:'Fabrikam Mail', DeviceProduct:'MailSecure',
      DeviceAction:'quarantine', LogSeverity:'Medium', SourceIP:'198.51.100.77', DestinationIP:'10.20.5.22', DestinationPort:25 },
    { TimeGenerated:'2026-07-06T08:22:15Z', DeviceVendor:'Contoso Firewall', DeviceProduct:'EdgeFW',
      DeviceAction:'allow', LogSeverity:'Low', SourceIP:'10.20.6.19', DestinationIP:'198.51.100.22', DestinationPort:443 },
  ],
  AzureActivity: [
    { TimeGenerated:'2026-07-06T07:50:00Z', SubscriptionId:'sub-prod-001',
      Caller:'cloudadmin@contoso.com', OperationNameValue:'Microsoft.Authorization/roleAssignments/write',
      ActivityStatusValue:'Succeeded', ResourceGroup:'rg-prod-identity', ResourceProviderValue:'Microsoft.Authorization' },
    { TimeGenerated:'2026-07-06T07:57:31Z', SubscriptionId:'sub-shared-002',
      Caller:'platformops@contoso.com', OperationNameValue:'Microsoft.Authorization/policyAssignments/write',
      ActivityStatusValue:'Succeeded', ResourceGroup:'rg-policy', ResourceProviderValue:'Microsoft.Authorization' },
    { TimeGenerated:'2026-07-06T08:05:44Z', SubscriptionId:'sub-prod-001',
      Caller:'storage-owner@contoso.com', OperationNameValue:'Microsoft.Storage/storageAccounts/write',
      ActivityStatusValue:'Succeeded', ResourceGroup:'rg-prod-storage', ResourceProviderValue:'Microsoft.Storage' },
  ],
  AppRiskEvents_CL: [
    { TimeGenerated:'2026-07-06T08:31:00Z', AppId:'app-expense-portal',
      UserPrincipalName:'maria.ross@contoso.com', SourceIp:'203.0.113.44', RiskScore:92, Action:'BlockedOAuthCallback' },
    { TimeGenerated:'2026-07-06T08:34:18Z', AppId:'app-partner-sync',
      UserPrincipalName:'svc-partner@contoso.com', SourceIp:'198.51.100.64', RiskScore:35, Action:'AllowedSync' },
    { TimeGenerated:'2026-07-06T08:39:02Z', AppId:'app-expense-portal',
      UserPrincipalName:'sam.lee@contoso.com', SourceIp:'203.0.113.89', RiskScore:78, Action:'HighRiskTokenUse' },
  ],
};

const SENTINEL_GRAPH = {
  incidentId:'INC-1042',
  nodes:[
    { id:'user-jane', type:'User', label:'jane.doe@contoso.com', risk:'high' },
    { id:'url-doc', type:'URL', label:'secure-document-portal[.]xyz', risk:'high' },
    { id:'app-docviewer', type:'App', label:'DocViewer Pro', risk:'medium' },
    { id:'ip-76', type:'IP', label:'76.21.55.4', risk:'medium' },
    { id:'mailbox-jane', type:'Mailbox', label:'Jane Doe mailbox', risk:'medium' },
  ],
  edges:[
    { from:'user-jane', to:'url-doc', label:'clicked URL' },
    { from:'user-jane', to:'app-docviewer', label:'granted consent' },
    { from:'ip-76', to:'user-jane', label:'sign-in source' },
    { from:'app-docviewer', to:'mailbox-jane', label:'Mail.ReadWrite' },
  ],
};

const CLOUD_APP_INVESTIGATIONS = [
  { id:'MDA-OAUTH-1042', incidentId:'INC-1042', status:'Active investigation',
    appName:'DocViewer Pro', publisher:'Unverified publisher', user:'jane.doe@contoso.com',
    consentTime:'2026-06-28T08:23:00Z', risk:'High',
    scopes:['Mail.ReadWrite','Files.Read.All','offline_access'],
    indicators:['Consent followed a phishing URL click by 12 minutes','Publisher has no verified tenant relationship','App requested mailbox write scope and persistent refresh tokens'],
    activity:[
      { time:'2026-06-28T08:11:00Z', title:'Phishing URL clicked', detail:'MDO recorded Jane opening secure-document-portal[.]xyz.' },
      { time:'2026-06-28T08:12:00Z', title:'Interactive sign-in completed', detail:'Token issued after MFA prompt from 76.21.55.4.' },
      { time:'2026-06-28T08:23:00Z', title:'OAuth consent grant', detail:'DocViewer Pro gained Mail.ReadWrite and Files.Read.All.' },
      { time:'2026-06-28T08:31:00Z', title:'Mailbox access attempt', detail:'CloudAppEvents shows Graph mailbox enumeration by the app.' },
    ],
    response:['Revoke app consent','Block app tenant-wide','Revoke Jane Doe sessions','Search CloudAppEvents for the app ID'],
    verdict:'True positive - risky OAuth consent after phishing' },
];

const ENTRA_IDENTITY_INVESTIGATIONS = [
  { id:'IDRISK-1053', incidentId:'INC-1053', user:'sam.lee@contoso.com',
    status:'Needs analyst decision', userRisk:'High', signInRisk:'High',
    riskDetections:[
      { time:'2026-06-28T13:27:00Z', type:'Unfamiliar sign-in properties', risk:'High', source:'Entra ID Protection', detail:'Sign-in from NL differs from Sam Lee baseline.' },
      { time:'2026-06-28T13:28:00Z', type:'Anonymous IP address', risk:'Medium', source:'Entra ID Protection', detail:'Source 91.219.236.54 is tagged as an anonymizing service.' },
      { time:'2026-06-28T13:31:00Z', type:'Impossible travel', risk:'Medium', source:'Entra ID Protection', detail:'Prior successful sign-in from Seattle occurred 42 minutes earlier.' },
    ],
    signIns:[
      { time:'2026-06-28T12:45:00Z', app:'Microsoft Teams', ip:'198.51.100.18', location:'US', result:'Success', risk:'None' },
      { time:'2026-06-28T13:27:00Z', app:'Office 365 Exchange Online', ip:'91.219.236.54', location:'NL', result:'Success', risk:'High' },
      { time:'2026-06-28T13:33:00Z', app:'Azure Portal', ip:'91.219.236.54', location:'NL', result:'Blocked by CA', risk:'High' },
    ],
    actions:['Confirm compromise','Dismiss user risk','Reset password','Revoke sessions','Require MFA re-registration'],
    decisionGuide:'Confirm compromise when the user cannot validate the NL sign-in or when follow-on activity appears from the same IP. Dismiss only after user verification and matching travel/VPN context.' },
  { id:'IDRISK-1051', incidentId:'INC-1051', user:'maria.ross@contoso.com',
    status:'Confirmed compromised', userRisk:'High', signInRisk:'High',
    riskDetections:[
      { time:'2026-06-28T06:40:00Z', type:'Adversary-in-the-middle', risk:'High', source:'Entra ID Protection', detail:'MFA token was satisfied through a suspected phishing proxy.' },
      { time:'2026-06-28T06:43:00Z', type:'Token replay', risk:'High', source:'Entra ID Protection', detail:'Session cookie reused from a different ASN.' },
    ],
    signIns:[
      { time:'2026-06-28T06:39:00Z', app:'Microsoft 365 portal', ip:'185.199.111.12', location:'US', result:'Success', risk:'High' },
      { time:'2026-06-28T06:44:00Z', app:'SharePoint Online', ip:'185.199.111.12', location:'US', result:'Interrupted', risk:'High' },
    ],
    actions:['Confirm compromise','Revoke sessions','Reset password','Require phishing-resistant MFA'],
    decisionGuide:'AiTM evidence is sufficient to confirm compromise and force credential/session cleanup.' },
];

const CASE_MANAGEMENT = [
  { id:'CASE-2406-1042', title:'OAuth consent abuse response', owner:'alex.ansbergs', status:'Active',
    severity:'High', linkedIncidents:['INC-1042','INC-1051'], due:'2026-06-29T12:00:00Z',
    closure:'Not ready - waiting for OAuth app block approval',
    tasks:[
      { title:'Revoke DocViewer Pro enterprise app consent', assignee:'Cloud apps responder', status:'In progress' },
      { title:'Revoke Jane Doe sessions and require MFA reset', assignee:'Identity responder', status:'Done' },
      { title:'Hunt for Mail.ReadWrite grants in CloudAppEvents', assignee:'Detection engineer', status:'Open' },
      { title:'Attach Sentinel Graph screenshot to case notes', assignee:'SOC lead', status:'Open' },
    ] },
  { id:'CASE-2406-1019', title:'Tier-0 identity attack containment', owner:'identity-soc', status:'Active',
    severity:'High', linkedIncidents:['INC-1019'], due:'2026-06-28T18:00:00Z',
    closure:'Not ready - KRBTGT rotation evidence pending',
    tasks:[
      { title:'Disable svc-backup and reset credential', assignee:'AD operations', status:'Done' },
      { title:'Revert AdminSDHolder ACL change', assignee:'Tier-0 admin', status:'In progress' },
      { title:'Collect DC01 timeline evidence', assignee:'MDE responder', status:'Done' },
    ] },
  { id:'CASE-2406-1053', title:'Sam Lee risky sign-in verification', owner:'L1-Triage', status:'Draft',
    severity:'Medium', linkedIncidents:['INC-1053'], due:'2026-06-28T16:30:00Z',
    closure:'Decision required - confirm compromise or dismiss after user callback',
    tasks:[
      { title:'Call user and validate travel/VPN use', assignee:'L1-Triage', status:'Open' },
      { title:'Review risky sign-ins and risk detections', assignee:'Identity responder', status:'Open' },
      { title:'Apply risk-based password reset if unconfirmed', assignee:'Identity responder', status:'Open' },
    ] },
];

const COPILOT_AGENTIC_FLOW = {
  title:'Agentic investigation: INC-1042 OAuth abuse',
  prompt:'Investigate INC-1042 end to end and recommend whether to contain Jane Doe and DocViewer Pro.',
  plan:['Read incident alerts and timeline','Expand user, OAuth app, IP, URL, and mailbox entities','Run static CloudAppEvents and SigninLogs checks','Decide containment and case tasks'],
  toolCalls:[
    { tool:'get_incident', input:'INC-1042', output:'2 correlated alerts: phishing URL click and anomalous OAuth consent grant.' },
    { tool:'expand_entities', input:'jane.doe@contoso.com', output:'Linked URL secure-document-portal[.]xyz, app DocViewer Pro, IP 76.21.55.4, mailbox Jane Doe mailbox.' },
    { tool:'query_cloud_app_events', input:'AppName == "DocViewer Pro"', output:'Consent grant plus mailbox enumeration within eight minutes.' },
    { tool:'query_signin_logs', input:'UserPrincipalName == "jane.doe@contoso.com"', output:'Successful MFA-backed sign-in from unfamiliar IP immediately after URL click.' },
  ],
  verdict:'True positive. Revoke app consent, block DocViewer Pro tenant-wide, revoke Jane Doe sessions, reset credentials, and keep CASE-2406-1042 open until CloudAppEvents hunting completes.',
};

const SENTINEL_ENTITY_TYPES = [
  { type:'Account', icon:'@', identifiers:['Name','UPNSuffix','Sid','AadUserId','PUID','IsDomainJoined'] },
  { type:'Host', icon:'H', identifiers:['HostName','DnsDomain','NTDomain','AzureID','OSFamily'] },
  { type:'IP', icon:'IP', identifiers:['Address'] },
  { type:'URL', icon:'URL', identifiers:['Url'] },
  { type:'Azure Resource', icon:'AR', identifiers:['ResourceId','SubscriptionId','ResourceGroup','ResourceName'] },
  { type:'Cloud Application', icon:'CA', identifiers:['AppId','Name','InstanceName'] },
  { type:'DNS Resolution', icon:'DNS', identifiers:['DomainName','HostIpAddress'] },
  { type:'File', icon:'F', identifiers:['Name','Directory'] },
  { type:'FileHash', icon:'#', identifiers:['Algorithm','Value'] },
  { type:'Malware', icon:'M', identifiers:['Name','Category'] },
  { type:'Process', icon:'P', identifiers:['ProcessId','CommandLine','ImageFile'] },
  { type:'Registry Key', icon:'RK', identifiers:['Hive','Key'] },
  { type:'Registry Value', icon:'RV', identifiers:['Key','ValueName','ValueData'] },
  { type:'Security Group', icon:'SG', identifiers:['SID','ObjectGuid','DistinguishedName'] },
  { type:'Mailbox', icon:'MB', identifiers:['MailboxPrimaryAddress','DisplayName','AadUserId'] },
  { type:'Mail Cluster', icon:'MC', identifiers:['NetworkMessageIds','CountByDeliveryStatus'] },
  { type:'Mail Message', icon:'MM', identifiers:['NetworkMessageId','Recipient','Sender','Subject'] },
  { type:'Submission Mail', icon:'SM', identifiers:['SubmissionId','Submitter','Recipient'] },
];

const SENTINEL_WORKBOOKS = [
  { name:'Investigation Insights', owner:'SOC content', refresh:'15 min',
    panels:['Incident timeline','Alert volume by tactic','Entity pivots'],
    detail:'Triage workbook for correlating Defender XDR alerts, Sentinel incidents, and entity evidence.' },
  { name:'Identity & Access', owner:'Identity team', refresh:'30 min',
    panels:['Risky sign-ins','MFA failures','Privileged role changes'],
    detail:'Tracks Entra sign-in risk, role assignment drift, and conditional access outcomes.' },
  { name:'Cloud Posture Watch', owner:'Cloud security', refresh:'1 hour',
    panels:['Public storage','Management ports','Container alerts'],
    detail:'Combines Defender for Cloud recommendations with Sentinel alert trends for multi-cloud posture review.' },
];

const SENTINEL_PLAYBOOKS = [
  { name:'PB-IsolateDevice', trigger:'High-severity MDE alert', connector:'Defender for Endpoint',
    status:'Disabled', steps:['Get alert evidence','Isolate device','Post Teams approval card','Create ticket'] },
  { name:'PB-RevokeOAuthConsent', trigger:'OAuth consent abuse incident', connector:'Microsoft Graph',
    status:'Enabled', steps:['Find service principal','Revoke grant','Revoke user sessions','Notify mailbox owner'] },
  { name:'PB-StoragePublicAccess', trigger:'Public cloud storage alert', connector:'Azure + AWS',
    status:'Enabled', steps:['Remove public ACL','Snapshot configuration','Open owner task','Add incident comment'] },
  { name:'Playbook1', trigger:'Microsoft Sentinel incident', connector:'Microsoft Sentinel + Logic Apps',
    status:'Enabled', resourceGroup:'RG-Playbooks', permissionState:'Needs Sentinel access',
    steps:['Receive Microsoft Sentinel incident','Get incident details','Post Teams notification','Add incident comment'] },
];

const SENTINEL_AUTOMATION_LAB = {
  source:'Microsoft Learn: Run playbooks from automation rules',
  resourceGroup:'RG-Playbooks',
  playbookName:'Playbook1',
  serviceAccount:'Microsoft Sentinel service account',
  role:'Microsoft Sentinel Automation Contributor',
  workspace:'soc-prod-sentinel',
  ruleDraft:{
    name:'Run Playbook1 when incident is created',
    trigger:'When incident is created',
    condition:'Incident provider = Microsoft Sentinel',
    action:'Run playbook'
  },
  permissions:[
    { principal:'alex.ansbergs', role:'Logic App Contributor', scope:'RG-Playbooks', effect:'Can edit Logic App workflow; does not let Sentinel invoke it.' },
    { principal:'Microsoft Sentinel service account', role:'Microsoft Sentinel Automation Contributor', scope:'RG-Playbooks', effect:'Lets automation rules run incident-trigger playbooks in the resource group.' },
  ],
  notes:[
    'Only playbooks that use a Microsoft Sentinel incident trigger are valid for automation rules triggered by incident creation.',
    'A playbook shown grayed out in the Run playbook action means Sentinel lacks permission to the playbook resource group.',
    'Use Manage playbook permissions from the automation rule action and grant Microsoft Sentinel access to the resource group.'
  ]
};

const SENTINEL_DATA_CONNECTORS = [
  { name:'Microsoft Defender XDR', type:'Data connector', status:'Connected',
    table:'SecurityAlert, Device*', use:'Streams Defender alerts and endpoint evidence into Sentinel incidents and hunting.' },
  { name:'Microsoft Entra ID', type:'Data connector', status:'Connected',
    table:'SigninLogs, AuditLogs', use:'Provides sign-in, risk, and directory audit events for identity detections.' },
  { name:'Azure Activity', type:'Data connector', status:'Connected',
    table:'AzureActivity', use:'Collects subscription control-plane operations through Azure Policy or diagnostic settings for cloud administration detections.' },
  { name:'Windows Security Events via AMA', type:'Data connector', status:'Requires solution',
    table:'SecurityEvent, WindowsEvent', use:'Collects selected Windows Security Event IDs from servers and workstations through Azure Monitor Agent and a scoped DCR.' },
  { name:'Common Event Format via AMA', type:'Data connector', status:'Requires solution',
    table:'CommonSecurityLog', use:'Ingests CEF-formatted Syslog from network and security appliances through a Linux log forwarder and AMA DCR.' },
  { name:'Logs Ingestion API', type:'Custom logs ingestion', status:'Plan required',
    table:'*_CL custom tables', use:'Creates custom tables from application-owned JSON payloads using app registration, a DCR stream declaration, and optional transform KQL.' },
  { name:'Threat Intelligence - TAXII', type:'Threat intelligence connector', status:'Available',
    table:'ThreatIntelIndicators', use:'Imports STIX/TAXII indicators when a TAXII API root and collection ID are available.' },
  { name:'Defender Threat Intelligence', type:'Threat intelligence connector', status:'Available',
    table:'ThreatIntelIndicators', use:'Brings Microsoft-generated indicators into Sentinel for TI map analytics rules.' },
  { name:'Syslog via AMA', type:'Data connector', status:'Requires solution',
    table:'Syslog', use:'Ingests Syslog from Linux log forwarders after the Syslog solution is installed from Content hub and a DCR is created from the connector page.' },
  { name:'MITRE ATT&CK', type:'Coverage view', status:'Not a connector',
    table:'Analytics rules', use:'Lights up based on active analytics rules and assigned tactics or techniques.' },
];

const SENTINEL_CONTENT_SOLUTIONS = [
  { id:'syslog', name:'Syslog', provider:'Microsoft', status:'Not installed',
    connectors:['Syslog via AMA'],
    use:'Adds the Syslog via AMA connector and workbook content for Linux Syslog ingestion.' },
  { id:'cef', name:'Common Event Format (CEF)', provider:'Microsoft', status:'Not installed',
    connectors:['Common Event Format via AMA'],
    use:'Adds the CEF via AMA connector for appliances that emit CEF-formatted Syslog.' },
  { id:'threat-intel', name:'Threat Intelligence', provider:'Microsoft', status:'Installed',
    connectors:['Defender Threat Intelligence','Threat Intelligence - TAXII'],
    use:'Adds threat intelligence connectors and analytic content for indicator matching.' },
  { id:'windows-security', name:'Windows Security Events', provider:'Microsoft', status:'Installed',
    connectors:['Windows Security Events via AMA'],
    use:'Adds Windows event collection with Azure Monitor Agent and DCR scoping.' },
  { id:'azure-activity', name:'Azure Activity', provider:'Microsoft', status:'Installed',
    connectors:['Azure Activity'],
    use:'Adds subscription activity collection guidance for Azure Policy and diagnostic settings.' },
  { id:'custom-logs', name:'Custom logs ingestion', provider:'Lab', status:'Planning only',
    connectors:['Logs Ingestion API'],
    use:'Study card for custom table ingestion through app registration, DCE/DCR endpoints, streams, and transforms.' },
];

const SYSLOG_AMA_LAB = {
  source:'Microsoft Learn: Ingest Syslog and CEF messages to Microsoft Sentinel with AMA',
  workspace:'soc-prod-sentinel',
  vm:'VM1',
  os:'Linux Azure VM',
  forwarderRole:'Log forwarder',
  dcr:'DCR-Syslog-VM1',
  connector:'Syslog via AMA',
  solution:'Syslog',
  facilities:['auth','authpriv','daemon','kern','syslog','user'],
  minimumLevel:'Info',
  examPrompt:'Several network appliances send Syslog messages to VM1. Configure Syslog via AMA ingestion into Microsoft Sentinel.',
  steps:[
    { id:'solution', title:'Install Syslog solution from Content hub',
      detail:'Content hub installs the solution package that exposes the Syslog via AMA data connector in Microsoft Sentinel.',
      correctFirst:true },
    { id:'connector', title:'Open Syslog via AMA connector',
      detail:'Use the connector page in Microsoft Sentinel to create the data collection rule instead of starting in the Azure Monitor portal.' },
    { id:'dcr', title:'Create the DCR and select VM1',
      detail:'The connector workflow creates the DCR, scopes facilities/severities, and installs Azure Monitor Agent on the selected VM.' },
    { id:'daemon', title:'Configure rsyslog on VM1',
      detail:'After the connector/DCR/AMA setup, configure the Linux forwarder daemon to listen for appliance Syslog on UDP/TCP 514.' },
    { id:'verify', title:'Verify Syslog ingestion',
      detail:'Query the Syslog table and confirm records from the network appliances arrive through VM1.' },
  ],
  distractors:[
    { title:'Install AMA on VM1 by using Azure CLI',
      why:'Not first for this connector workflow. Selecting VM1 during DCR creation from the connector page deploys AMA automatically.' },
    { title:'Configure rsyslog on VM1 to listen on port 514',
      why:'Daemon setup is still required, but it happens after installing the solution and creating the DCR/AMA path.' },
    { title:'Create a DCR from Azure Monitor',
      why:'For this Sentinel lab, create the DCR from the Syslog via AMA connector page after the Content hub solution is installed.' },
  ],
  query:`Syslog
| where TimeGenerated > ago(30m)
| where Computer == "VM1"
| summarize Events=count() by Facility, SeverityLevel, HostName
| order by Events desc`,
};

const SENTINEL_INGESTION_LABS = [
  {
    id:'windows-security',
    title:'Windows Security Events via AMA',
    solutionId:'windows-security',
    solution:'Windows Security Events',
    connector:'Windows Security Events via AMA',
    workspace:'soc-prod-sentinel',
    dcr:'DCR-Windows-Security-Servers',
    target:'Server group: DC01, FIN-FS-02, WKS-03',
    table:'SecurityEvent / WindowsEvent',
    prompt:'Collect only the Windows Security events needed for sign-in and privilege-use detections while keeping noisy event IDs out of the workspace.',
    steps:[
      { id:'solution', title:'Confirm Windows Security Events solution',
        detail:'Content hub makes the Windows Security Events via AMA connector and workbook content available.' },
      { id:'connector', title:'Open the AMA connector',
        detail:'Start from Sentinel Data connectors so the DCR is associated with the workspace and connector experience.' },
      { id:'dcr', title:'Create a DCR for Windows hosts',
        detail:'Select target machines, choose an event set, and add XPath filters for the event IDs needed by the lab.' },
      { id:'scope', title:'Scope events with XPath',
        detail:'Use a concise XPath such as Security!*[System[(EventID=4624 or EventID=4625 or EventID=4672 or EventID=4688)]].' },
      { id:'verify', title:'Verify Windows rows',
        detail:'Query SecurityEvent and confirm expected logon, privileged logon, and process creation events.' },
    ],
    query:`SecurityEvent
| where TimeGenerated > ago(1h)
| where EventID in (4624, 4625, 4672, 4688)
| summarize Events=count() by Computer, EventID, Account
| order by Events desc`,
  },
  {
    id:'cef',
    title:'CEF via AMA',
    solutionId:'cef',
    solution:'Common Event Format (CEF)',
    connector:'Common Event Format via AMA',
    workspace:'soc-prod-sentinel',
    dcr:'DCR-CEF-FW1',
    target:'Linux forwarder: CEF-FWD-01',
    table:'CommonSecurityLog',
    prompt:'A firewall and email gateway emit CEF-formatted Syslog to a Linux forwarder. Bring the rows into Sentinel through AMA.',
    steps:[
      { id:'solution', title:'Install CEF solution from Content hub',
        detail:'The solution exposes the CEF via AMA connector and expected CommonSecurityLog schema.' },
      { id:'connector', title:'Open CEF via AMA connector',
        detail:'Use the connector workflow so Sentinel creates the DCR for the forwarder and workspace.' },
      { id:'dcr', title:'Create the DCR and select CEF-FWD-01',
        detail:'The DCR deploys AMA, selects facilities/severities, and routes CEF records to CommonSecurityLog.' },
      { id:'daemon', title:'Configure syslog forwarding',
        detail:'Forward appliance CEF messages to the Linux collector and keep transport/local firewall rules aligned.' },
      { id:'verify', title:'Verify CommonSecurityLog',
        detail:'Query CommonSecurityLog for vendor, device action, source, destination, and severity fields.' },
    ],
    query:`CommonSecurityLog
| where TimeGenerated > ago(1h)
| summarize Events=count() by DeviceVendor, DeviceProduct, DeviceAction, LogSeverity
| order by Events desc`,
  },
  {
    id:'azure-activity',
    title:'Azure Activity collection',
    solutionId:'azure-activity',
    solution:'Azure Activity',
    connector:'Azure Activity',
    workspace:'soc-prod-sentinel',
    dcr:'Diagnostic setting: send AzureActivity to soc-prod-sentinel',
    target:'Subscriptions: Contoso-Prod, Contoso-Shared',
    table:'AzureActivity',
    prompt:'Collect subscription control-plane operations so Sentinel can detect risky role assignments, policy changes, and public network exposure changes.',
    steps:[
      { id:'policy', title:'Choose Azure Policy for scale',
        detail:'Use policy when many subscriptions must send activity logs to the same workspace.' },
      { id:'diagnostic', title:'Create diagnostic setting',
        detail:'For a single subscription, configure the activity log diagnostic setting to send administrative, security, policy, and service health categories.' },
      { id:'connector', title:'Open Azure Activity connector',
        detail:'Confirm connected subscriptions and query examples from Sentinel Data connectors.' },
      { id:'verify', title:'Verify AzureActivity',
        detail:'Query AzureActivity for role assignment writes, policy assignment writes, and public access changes.' },
    ],
    query:`AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue has_any ("roleAssignments/write", "policyAssignments/write", "storageAccounts/write")
| project TimeGenerated, SubscriptionId, Caller, OperationNameValue, ActivityStatusValue, ResourceGroup, ResourceProviderValue`,
  },
  {
    id:'custom-logs',
    title:'Logs Ingestion API custom table',
    solutionId:'custom-logs',
    solution:'Custom logs ingestion',
    connector:'Logs Ingestion API',
    workspace:'soc-prod-sentinel',
    dcr:'DCR-Custom-AppTelemetry',
    target:'App registration: app-lab-log-writer',
    table:'AppRiskEvents_CL',
    prompt:'Create a custom table for application risk events using the Logs Ingestion API without putting secrets or real endpoints in the lab.',
    steps:[
      { id:'app', title:'Create app registration',
        detail:'Use an Entra app identity for ingestion and store any real credentials outside this lab.' },
      { id:'role', title:'Grant Monitoring Metrics Publisher',
        detail:'Assign the app the Monitoring Metrics Publisher role on the DCR so it can post logs.' },
      { id:'endpoint', title:'Choose DCE or DCR direct endpoint',
        detail:'Use a DCR direct endpoint for simple ingestion or DCE when network isolation and endpoint reuse are needed.' },
      { id:'stream', title:'Declare stream and transform',
        detail:'Define streamDeclarations for the incoming JSON and transformKql to shape columns into the destination table.' },
      { id:'table', title:'Create _CL table output',
        detail:'Custom streams usually use Custom- prefixes and land in a _CL table such as AppRiskEvents_CL; Microsoft- streams target supported built-in schemas.' },
      { id:'verify', title:'Verify custom rows',
        detail:'Query AppRiskEvents_CL and validate TimeGenerated, AppId, RiskScore, SourceIp, and Action columns.' },
    ],
    query:`AppRiskEvents_CL
| where TimeGenerated > ago(24h)
| where RiskScore >= 70
| project TimeGenerated, AppId, UserPrincipalName, SourceIp, RiskScore, Action`,
  },
];

const WEF_PLANNING_CARD = {
  title:'Windows Event Forwarding vs AMA planning',
  useWef:'Use WEF when Windows hosts already forward selected events to a collector, especially for on-prem domains where agent rollout is constrained.',
  useAma:'Use AMA when Sentinel should collect directly through DCRs, especially for Azure/Arc machines, event-set scoping, and centralized connector management.',
  examCue:'If the question asks for a Sentinel connector and DCR, choose AMA. If it asks for native Windows collector subscriptions or no extra agent on endpoints, evaluate WEF.',
  checklist:[
    'Source ownership: domain GPO/subscription model vs Azure/Arc resource targeting',
    'Filtering point: WEF subscription filters vs DCR event sets and XPath',
    'Destination: collector host forwarding onward vs Log Analytics workspace table',
    'Operations: Windows event collector health vs Azure Monitor Agent and DCR health',
  ],
};

const THREAT_INTEL_INDICATORS = [
  { TimeGenerated:'2026-06-28T00:01:00Z', ObservableKey:'ipv4-addr:value',
    ObservableValue:'203.0.113.10', Pattern:"[ipv4-addr:value = '203.0.113.10']",
    ThreatTypes:'MaliciousActivity', Tags:['home-lab','synthetic'], Confidence:100,
    SourceSystem:'Manual import', ValidFrom:'2026-06-28T00:00:00Z', ValidUntil:'', IsActive:true, Revoked:false, TlpLevel:'white', Severity:5 },
  { TimeGenerated:'2026-06-28T00:02:00Z', ObservableKey:'domain-name:value',
    ObservableValue:'bad-demo.example', Pattern:"[domain-name:value = 'bad-demo.example']",
    ThreatTypes:'Phishing', Tags:['home-lab','synthetic'], Confidence:100,
    SourceSystem:'Manual import', ValidFrom:'2026-06-28T00:00:00Z', ValidUntil:'', IsActive:true, Revoked:false, TlpLevel:'white', Severity:5 },
];

const SYNTHETIC_TRANSACTIONS = [
  { TimeGenerated:'2026-06-28T13:40:00Z', SrcIp:'10.0.0.5', DstIp:'203.0.113.10',
    Url:'http://bad-demo.example/login', Domain:'bad-demo.example',
    AccountName:'labuser@contoso.local', Action:'OutboundConnection',
    Scenario:'IOC match test', TechniqueId:'T1071' },
  { TimeGenerated:'2026-06-28T13:46:00Z', SrcIp:'10.0.0.8', DstIp:'198.51.100.22',
    Url:'https://update.example/agent', Domain:'update.example',
    AccountName:'svc-agent@contoso.local', Action:'OutboundConnection',
    Scenario:'Benign control row', TechniqueId:'T1071' },
  { TimeGenerated:'2026-06-28T14:04:00Z', SrcIp:'10.0.0.9', DstIp:'192.0.2.44',
    Url:'http://bad-demo.example/payload', Domain:'bad-demo.example',
    AccountName:'jane.doe@contoso.local', Action:'DnsRequest',
    Scenario:'Domain IOC match test', TechniqueId:'T1566' },
];

const SENTINEL_LAB_FLOW = [
  { title:'Synthetic event', detail:'A custom table such as SyntheticTransactions_CL receives safe lab rows with IP, domain, URL, account, action, and scenario fields.' },
  { title:'Threat intel import', detail:'Manual CSV, Defender Threat Intelligence, or TAXII imports populate ThreatIntelIndicators with active indicators.' },
  { title:'Analytics rule', detail:'A scheduled rule joins event fields such as DstIp or Domain to ObservableValue in ThreatIntelIndicators.' },
  { title:'Entity mapping', detail:'The rule maps DstIp, AccountName, Url, and Domain into Sentinel entities for incident investigation.' },
  { title:'MITRE mapping', detail:'The rule is assigned tactics and techniques such as Command and Control T1071 or Initial Access T1566.' },
  { title:'Alert and incident', detail:'A matching event creates an alert or grouped incident, while the MITRE page reflects rule coverage.' },
];

const TI_IMPORT_CSV = `threatTypes,tags,name,description,confidence,revoked,validFrom,validUntil,tlpLevel,severity,observableType,observableValue
MaliciousActivity,"home-lab,synthetic",Demo IOC IP,Synthetic IOC for Sentinel lab,100,,2026-06-28T00:00:00.000Z,,white,5,ipv4-addr,203.0.113.10
Phishing,"home-lab,synthetic",Demo IOC Domain,Synthetic IOC for Sentinel lab,100,,2026-06-28T00:00:00.000Z,,white,5,domain-name,bad-demo.example`;

const TI_IP_MATCH_QUERY = `let ActiveIOCs =
    ThreatIntelIndicators
    | where IsActive == true
    | where Revoked != true
    | where ValidUntil > now() or isempty(ValidUntil)
    | project IOCValue = tostring(ObservableValue), ObservableKey, Confidence, Tags;
SyntheticTransactions_CL
| where TimeGenerated > ago(1h)
| extend SrcIp = tostring(SrcIp), DstIp = tostring(DstIp), Domain = tostring(Domain), Url = tostring(Url)
| join kind=inner ActiveIOCs on $left.DstIp == $right.IOCValue
| project TimeGenerated, SrcIp, DstIp, Domain, Url, AccountName, Action, Scenario, IOCValue, ObservableKey, Confidence, Tags`;

const TI_DOMAIN_MATCH_QUERY = `let ActiveIOCs =
    ThreatIntelIndicators
    | where IsActive == true
    | where Revoked != true
    | where ValidUntil > now() or isempty(ValidUntil)
    | project IOCValue = tostring(ObservableValue), ObservableKey, Confidence, Tags;
SyntheticTransactions_CL
| where TimeGenerated > ago(1h)
| extend Domain = tostring(Domain)
| join kind=inner ActiveIOCs on $left.Domain == $right.IOCValue
| project TimeGenerated, SrcIp, DstIp, Domain, Url, AccountName, Action, Scenario, IOCValue, ObservableKey, Confidence, Tags`;

const CLOUD_ALERTS = [
  { severity:'high', title:'Suspicious SSH login (Defender for Servers)', resource:'vm-prod-web-01',
    type:'Virtual machine', status:'New', time:'2026-06-28T11:23:00Z', tactics:['Initial Access'] },
  { severity:'high', title:'Public IP scanning detected on container', resource:'aks-prod / pod-api-77',
    type:'Kubernetes workload', status:'In progress', time:'2026-06-28T12:01:00Z', tactics:['Discovery'] },
  { severity:'medium', title:'Storage account anonymous access enabled', resource:'stcontosologs',
    type:'Storage account', status:'New', time:'2026-06-28T07:50:00Z', tactics:['Exfiltration'] },
  { severity:'high', title:'Container escaped to host namespace', resource:'aks-prod/node-3',
    type:'Kubernetes node', status:'In progress', time:'2026-06-28T12:03:00Z', tactics:['Privilege Escalation'] },
  { severity:'medium', title:'SQL server firewall opened to internet', resource:'sql-prod-reporting',
    type:'SQL server', status:'New', time:'2026-06-28T09:18:00Z', tactics:['Initial Access'] },
  { severity:'low', title:'Key vault accessed from unusual network', resource:'kv-prod-app',
    type:'Key vault', status:'New', time:'2026-06-28T04:12:00Z', tactics:['Credential Access'] },
  { severity:'medium', title:'New privileged role assignment in subscription', resource:'sub-prod-001',
    type:'Subscription', status:'Resolved', time:'2026-06-27T22:43:00Z', tactics:['Privilege Escalation'] },
  { severity:'low', title:'Container image has critical CVE with exploit available', resource:'acrprod.azurecr.io/api',
    type:'Container image', status:'New', time:'2026-06-27T18:06:00Z', tactics:['Execution'] },
  { severity:'medium', title:'App Service authentication disabled', resource:'app-customer-portal',
    type:'App Service', status:'New', time:'2026-06-27T16:21:00Z', tactics:['Initial Access'] },
];

// Synthetic Log Analytics workspaces — selector at top of Sentinel views scopes rules to one of these.
const SENTINEL_WORKSPACES = [
  { id:'contoso-sec-prod',  name:'contoso-sec-prod',  region:'East US 2',     tier:'Production',  ruleIdx:[0,1,3,4,5,6,7] },
  { id:'contoso-sec-lab',   name:'contoso-sec-lab',   region:'West Europe',   tier:'Lab',         ruleIdx:[1,2,5,6] },
  { id:'fabrikam-soc-dev',  name:'fabrikam-soc-dev',  region:'North Europe',  tier:'Development', ruleIdx:[2,3,7] },
];

const SENTINEL_TABLE_PLANS = [
  { name:'SecurityEvent', plan:'Analytics', interactive:'90 days', total:'365 days',
    tier:'Analytics', cost:'High-value hot data',
    status:'Interactive', detail:'Used for security detections, incidents, analytics rules, and workbooks.' },
  { name:'SigninLogs', plan:'Analytics', interactive:'30 days', total:'180 days',
    tier:'Analytics', cost:'Detection-ready identity data',
    status:'Interactive', detail:'Identity sign-in events for scheduled rules and investigation.' },
  { name:'NetworkLogs_CL', plan:'Basic', interactive:'30 days', total:'365 days',
    tier:'Basic', cost:'Cheap high-volume search',
    status:'Search job required', detail:'High-volume custom network telemetry kept cheaply for occasional investigations.' },
  { name:'ArchiveDns_CL', plan:'Auxiliary', interactive:'365 days', total:'365 days',
    tier:'Auxiliary', cost:'Low-cost retained logs',
    status:'Interactive', detail:'Low-cost retained data that can be queried across total retention in this lab scenario.' },
  { name:'SentinelDataLake.SecurityEvent', plan:'Data lake', interactive:'KQL job', total:'7 years',
    tier:'Data lake', cost:'Long-range investigations',
    status:'Job required', detail:'Retains historical Sentinel data for long-running KQL jobs and downstream results tables.' },
  { name:'XDR.DeviceProcessEvents', plan:'XDR tier', interactive:'30 days', total:'180 days',
    tier:'XDR', cost:'Defender hunting retention',
    status:'Advanced hunting', detail:'Defender XDR-retained events stay in the Defender hunting tier and complement Sentinel tables.' },
];

const SENTINEL_RETENTION_GUIDANCE = [
  { choice:'Analytics', use:'Detections, dashboards, workbooks, incident evidence, and frequent analyst queries.', avoid:'Noisy telemetry that rarely contributes to rules or triage.' },
  { choice:'Basic', use:'High-volume custom or platform logs needed for occasional search, not scheduled analytics.', avoid:'Tables that must trigger Sentinel analytics rules.' },
  { choice:'Auxiliary', use:'Low-cost retained data where analysts still need direct interactive access across retention.', avoid:'Hot incident queues or near-real-time detection paths.' },
  { choice:'Data lake', use:'Long-range historical hunts, large joins, and batch enrichment that can wait for a KQL job.', avoid:'Immediate triage where the result must be visible inside seconds.' },
  { choice:'XDR tier', use:'Defender-native endpoint, identity, email, and cloud app hunting before duplicating into Sentinel.', avoid:'Duplicating every XDR table into Sentinel without a detection or retention reason.' },
];

const NETWORK_LOGS_SEARCH_QUERY = `NetworkLogs_CL
| where TimeGenerated between (datetime(2026-04-30T00:00:00Z) .. datetime(2026-04-30T23:59:59Z))
| where DstIp in ("203.0.113.10","192.0.2.44")
| project TimeGenerated, SrcIp, DstIp, Protocol, Action, BytesOut, ThreatIntelMatch`;

const NETWORK_LOGS_SEARCH_RESULTS = [
  { TimeGenerated:'2026-04-30T08:17:42Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10',
    Protocol:'HTTPS', Action:'Allowed', BytesOut:48192, ThreatIntelMatch:'Demo IOC IP' },
  { TimeGenerated:'2026-04-30T09:03:11Z', SrcIp:'10.5.18.23', DstIp:'192.0.2.44',
    Protocol:'HTTP', Action:'Allowed', BytesOut:12844, ThreatIntelMatch:'Demo domain redirect' },
  { TimeGenerated:'2026-04-30T10:51:09Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10',
    Protocol:'HTTPS', Action:'Blocked', BytesOut:0, ThreatIntelMatch:'Demo IOC IP' },
];

const SOC_OPTIMIZATION_RECOMMENDATIONS = [
  { area:'Coverage gap', recommendation:'Enable identity connector coverage for all production tenants', impact:'High', dataValue:'High',
    reason:'Two high-severity identity rules are enabled, but only one tenant sends SigninLogs into the workspace.', action:'Connect remaining tenant or scope rules to the covered tenant only.' },
  { area:'Rule tuning', recommendation:'Reduce duplicate endpoint malware alerts', impact:'Medium', dataValue:'Medium',
    reason:'Three scheduled rules overlap with Defender XDR incident correlation and create duplicate triage work.', action:'Keep the Sentinel rule that adds cloud context; disable duplicate endpoint-only logic.' },
  { area:'Data value', recommendation:'Move verbose firewall allow logs to Basic', impact:'Medium', dataValue:'Low',
    reason:'Allowed events account for most ingestion volume but rarely appear in incidents or hunting bookmarks.', action:'Retain deny and threat logs as Analytics; move allow telemetry to Basic or Data lake.' },
  { area:'Detection content', recommendation:'Add an analytics rule for suspicious OAuth consent', impact:'High', dataValue:'High',
    reason:'The phishing-to-OAuth scenario has CloudAppEvents rows but no Sentinel-native detection.', action:'Promote the saved hunt to a scheduled analytics rule with account and app entity mappings.' },
  { area:'Long-range hunt', recommendation:'Use Data lake KQL jobs for 180-day DNS beaconing reviews', impact:'Medium', dataValue:'High',
    reason:'ArchiveDns_CL has retained signal, but the query spans too much history for shift triage.', action:'Run a Data lake job and materialize the suspicious domain summary table.' },
];

const SUMMARY_RULE_SOURCE_ROWS = [
  { TimeGenerated:'2026-07-06T08:00:11Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10', Action:'Allowed', BytesOut:48192 },
  { TimeGenerated:'2026-07-06T08:01:02Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10', Action:'Allowed', BytesOut:38211 },
  { TimeGenerated:'2026-07-06T08:02:19Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10', Action:'Blocked', BytesOut:0 },
  { TimeGenerated:'2026-07-06T08:03:44Z', SrcIp:'10.5.18.23', DstIp:'198.51.100.24', Action:'Allowed', BytesOut:1833 },
  { TimeGenerated:'2026-07-06T08:04:08Z', SrcIp:'10.5.18.23', DstIp:'198.51.100.24', Action:'Allowed', BytesOut:2104 },
  { TimeGenerated:'2026-07-06T08:05:55Z', SrcIp:'10.5.20.18', DstIp:'192.0.2.44', Action:'Blocked', BytesOut:0 },
];

const SUMMARY_RULE_RESULTS = [
  { TimeGenerated:'2026-07-06T08:00:00Z', SrcIp:'10.5.12.44', DstIp:'203.0.113.10', Events:3, BytesOut:86403, Blocks:1 },
  { TimeGenerated:'2026-07-06T08:00:00Z', SrcIp:'10.5.18.23', DstIp:'198.51.100.24', Events:2, BytesOut:3937, Blocks:0 },
  { TimeGenerated:'2026-07-06T08:00:00Z', SrcIp:'10.5.20.18', DstIp:'192.0.2.44', Events:1, BytesOut:0, Blocks:1 },
];

const SUMMARY_RULE_QUERY = `NetworkLogs_CL
| summarize Events=count(), BytesOut=sum(BytesOut), Blocks=countif(Action == "Blocked")
    by SrcIp, DstIp, bin(TimeGenerated, 1h)
| order by Events desc`;

const SUMMARY_TABLE_QUERY = `NetworkSummary_CL
| where TimeGenerated > ago(24h)
| where Blocks > 0 or BytesOut > 50000
| project TimeGenerated, SrcIp, DstIp, Events, BytesOut, Blocks`;

const DATA_LAKE_KQL_JOB = {
  name:'180-day DNS beaconing review',
  source:'SentinelDataLake.ArchiveDns_CL',
  resultTable:'DnsBeaconingResults_CL',
  runtime:'18 min estimated',
  query:`SentinelDataLake.ArchiveDns_CL
| where TimeGenerated between (datetime(2026-01-01) .. datetime(2026-06-30))
| summarize QueryCount=count(), UniqueHosts=dcount(SrcHostname) by DnsQuery, bin(TimeGenerated, 1d)
| where QueryCount > 250 and UniqueHosts < 4
| project TimeGenerated, DnsQuery, QueryCount, UniqueHosts`,
  results:[
    { TimeGenerated:'2026-06-12T00:00:00Z', DnsQuery:'sync-a.bad-demo.example', QueryCount:341, UniqueHosts:2, Verdict:'Beaconing candidate' },
    { TimeGenerated:'2026-06-13T00:00:00Z', DnsQuery:'sync-a.bad-demo.example', QueryCount:328, UniqueHosts:2, Verdict:'Beaconing candidate' },
    { TimeGenerated:'2026-06-21T00:00:00Z', DnsQuery:'cdn-metrics.contoso.test', QueryCount:411, UniqueHosts:1, Verdict:'Benign updater allowlist review' },
  ],
};

const SENTINEL_NOTEBOOKS = [
  { name:'Incident entity expansion', language:'Python', status:'Ready',
    inputs:'Incident ID, account, host, IP', output:'Entity timeline plus related incidents',
    detail:'Uses local mock graph fixtures to show how a notebook can pivot from incident entities into related alerts.' },
  { name:'Threat intel enrichment', language:'Python', status:'Template',
    inputs:'IP/domain indicator list', output:'Confidence scoring worksheet',
    detail:'Demonstrates offline enrichment logic against bundled ThreatIntelIndicators rows.' },
  { name:'Data lake hunting job review', language:'KQL + Python', status:'Ready',
    inputs:'DnsBeaconingResults_CL', output:'Ranked beaconing candidates',
    detail:'Consumes the Data lake KQL job result table instead of querying raw long-range telemetry interactively.' },
];

const SENTINEL_MCP_NOTES = [
  { title:'Connection purpose', detail:'Sentinel MCP Server can expose workspace context, incidents, rules, and hunting actions to an AI-assisted client.' },
  { title:'Lab boundary', detail:'This simulator does not make MCP, Azure, Graph, or Log Analytics calls; the notebook view shows where that connection fits conceptually.' },
  { title:'Operational caution', detail:'Use least-privilege identities, scoped workspaces, and reviewed tool actions before allowing any assistant to run investigation commands.' },
];

const SENTINEL_RULES = [
  { name:'Successful sign-in from blocked country',
    type:'Scheduled', severity:'medium', enabled:true, frequency:'Every 5 minutes', tactics:['Initial Access'],
    query:`SigninLogs\n| where ResultType == 0\n| where LocationDetails.countryOrRegion in ("KP","IR")\n| project TimeGenerated, UserPrincipalName, IPAddress, LocationDetails` },
  { name:'Mass file deletion in OneDrive',
    type:'Scheduled', severity:'high', enabled:true, frequency:'Every 5 minutes', tactics:['Impact'],
    query:`OfficeActivity\n| where Operation == "FileDeleted"\n| summarize Deletions=count() by UserId, bin(TimeGenerated,5m)\n| where Deletions > 100` },
  { name:'Suspicious resource deployment from new IP',
    type:'Scheduled', severity:'medium', enabled:true, frequency:'Every 15 minutes', tactics:['Defense Evasion','Persistence'],
    query:`AzureActivity\n| where OperationNameValue endswith "/write"\n| where CallerIpAddress !in (cached_ips)\n| project TimeGenerated, Caller, OperationNameValue, CallerIpAddress` },
  { name:'Brute force against Azure VM (RDP/SSH)',
    type:'Scheduled', severity:'high', enabled:true, frequency:'Every 5 minutes', tactics:['Credential Access'],
    query:`SecurityEvent\n| where EventID == 4625\n| summarize Failures=count() by IpAddress, Computer, bin(TimeGenerated,5m)\n| where Failures > 50` },
  { name:'New Global Administrator role assignment',
    type:'Scheduled', severity:'high', enabled:true, frequency:'Every 5 minutes', tactics:['Privilege Escalation'],
    query:`AuditLogs\n| where OperationName == "Add member to role"\n| where TargetResources has "Global Administrator"` },
  { name:'TI map synthetic IOC to custom transaction events',
    type:'Threat intelligence', severity:'high', enabled:true, frequency:'Every 5 minutes',
    tactics:['Command and Control','Initial Access'],
    techniques:['T1071','T1566'],
    entities:['IP: DstIp','Account: AccountName','URL: Url','DNS: Domain'],
    query:TI_IP_MATCH_QUERY },
  { name:'NRT high-risk sign-in from unfamiliar location',
    type:'NRT', severity:'high', enabled:true, frequency:'Every 1 minute',
    tactics:['Initial Access','Credential Access'],
    techniques:['T1078'],
    entities:['Account: UserPrincipalName','IP: IPAddress'],
    query:`SigninLogs\n| where RiskLevel == "High"\n| where ResultType == 0\n| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevel` },
  { name:'Fusion multi-stage identity and OAuth attack',
    type:'ML behavior analytics', severity:'high', enabled:true, frequency:'Built-in ML correlation',
    tactics:['Initial Access','Persistence','Credential Access'],
    techniques:['T1566','T1098','T1078'],
    entities:['Account','Cloud application','IP'],
    query:`// Built-in Fusion behavior analytics rule.\n// Correlates risky sign-in, phishing click, OAuth consent, and impossible travel signals.` },
];

const SENTINEL_ANALYTICS_RULE_TYPES = [
  { id:'scheduled', name:'Scheduled query rule', badge:'Scheduled',
    summary:'Runs a KQL query on a schedule and creates alerts when the result threshold is met.',
    bestFor:'Repeatable hunts, entity mapping, custom alert details, and automation rules.',
    limits:['Frequency and lookback are configurable.', 'Supports full rule wizard controls in this lab.', 'Use the query preview to validate fixture rows.'],
    defaults:{
      name:'High-risk sign-in from unfamiliar location',
      severity:'Medium',
      tactics:'Initial Access, Credential Access',
      query:`SigninLogs
| where RiskLevel == "High"
| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevel, ResultType`,
      runEvery:'5 minutes',
      lookback:'5 minutes',
      start:'Automatically',
    } },
  { id:'nrt', name:'Near-real-time query rule', badge:'NRT',
    summary:'Runs close to ingestion time for fast alerting when latency matters.',
    bestFor:'High-confidence detections that need quick triage, such as risky sign-ins or active command execution.',
    limits:['Runs on a one-minute cadence in the lab model.', 'Keep query logic narrow and efficient.', 'Use short lookback windows and avoid heavy joins.'],
    defaults:{
      name:'NRT high-risk sign-in from unfamiliar location',
      severity:'High',
      tactics:'Initial Access, Credential Access',
      query:`SigninLogs
| where RiskLevel == "High"
| where ResultType == 0
| project TimeGenerated, UserPrincipalName, IPAddress, RiskLevel`,
      runEvery:'1 minute',
      lookback:'1 minute',
      start:'Automatically',
    } },
  { id:'ti', name:'Threat intelligence rule', badge:'TI',
    summary:'Matches indicators from ThreatIntelIndicators against event tables to create alerts.',
    bestFor:'IOC matching, threat intel operationalization, and watchlisted IP/domain investigation.',
    limits:['Requires active indicators and matching telemetry.', 'Map matched IP, URL, DNS, or account entities.', 'Tune expiration and confidence before enabling broadly.'],
    defaults:{
      name:'TI map synthetic IOC to custom transaction events',
      severity:'High',
      tactics:'Command and Control, Initial Access',
      query:TI_IP_MATCH_QUERY,
      runEvery:'5 minutes',
      lookback:'1 hour',
      start:'Automatically',
    } },
  { id:'fusion', name:'ML behavior analytics (Fusion)', badge:'ML',
    summary:'Uses built-in machine-learning correlation to combine suspicious behaviors into high-fidelity incidents.',
    bestFor:'Multi-stage attacks where several low-volume signals become meaningful together.',
    limits:['No custom KQL authoring in this lab model.', 'Requires supported data connectors and active behavior analytics.', 'Review generated incidents and entity graph pivots before closing.'],
    defaults:{
      name:'Fusion multi-stage identity and OAuth attack',
      severity:'High',
      tactics:'Initial Access, Persistence, Credential Access',
      query:`// Fusion rules use built-in ML correlation rather than custom KQL in this lab.
// Enable the rule, verify required data connectors, then review generated incidents.`,
      runEvery:'Built-in',
      lookback:'Built-in',
      start:'When enabled',
    } },
];

const SENTINEL_ANOMALY_RULES = [
  { name:'Anomalous sign-in location by user', status:'Enabled', source:'UEBA',
    severity:'medium', threshold:'Medium and High anomalies', tactics:['Initial Access'],
    customization:'Exclude known travel IP ranges and service accounts.',
    feeds:'Hunting bookmarks, incident enrichment, and scheduled rules that join anomalies to SigninLogs.' },
  { name:'Rare process on endpoint peer group', status:'Enabled', source:'Entity behavior',
    severity:'medium', threshold:'Score >= 0.78', tactics:['Execution','Defense Evasion'],
    customization:'Pilot on finance and Tier 0 device groups before broad incident creation.',
    feeds:'Hunting graph pivots and custom analytics rules that correlate rare process with risky sign-in.' },
  { name:'Unusual data access volume', status:'Disabled', source:'Data lake baseline',
    severity:'low', threshold:'Score >= 0.65', tactics:['Collection','Exfiltration'],
    customization:'Disabled until summary-rule baselines have seven clean business days.',
    feeds:'Hunting queue only; do not create incidents until the baseline is stable.' },
  { name:'Impossible travel with OAuth grant', status:'Enabled', source:'Fusion signal',
    severity:'high', threshold:'High anomalies only', tactics:['Initial Access','Persistence'],
    customization:'Create incidents only when an OAuth consent or risky app event occurs within 30 minutes.',
    feeds:'Fusion incidents and the phishing-to-OAuth investigation path.' },
];

const SENTINEL_ANOMALY_HUNTING_ROWS = [
  { TimeGenerated:'2026-07-06T07:42:00Z', AnomalyRule:'Anomalous sign-in location by user', Entity:'sam.lee@contoso.com', Score:'0.91', RelatedTable:'SigninLogs', Action:'Open identity investigation' },
  { TimeGenerated:'2026-07-06T08:05:00Z', AnomalyRule:'Rare process on endpoint peer group', Entity:'FIN-FS-02', Score:'0.84', RelatedTable:'DeviceProcessEvents', Action:'Correlate with ransomware incident' },
  { TimeGenerated:'2026-07-06T08:23:00Z', AnomalyRule:'Impossible travel with OAuth grant', Entity:'jane.doe@contoso.com', Score:'0.96', RelatedTable:'CloudAppEvents', Action:'Create high severity incident' },
];

// Curated subset of MITRE ATT&CK Enterprise v15 (tactic order matches attack.mitre.org).
// Not exhaustive — chosen to mirror the cells Sentinel typically shows and to include the
// techniques the lab's analytics rules cover so they light up.
const MITRE_ATTCK = [
  { id:'TA0043', name:'Reconnaissance', techniques:[
    { id:'T1595', name:'Active Scanning' },
    { id:'T1592', name:'Gather Victim Host Information' },
    { id:'T1589', name:'Gather Victim Identity Information' },
    { id:'T1590', name:'Gather Victim Network Information' },
    { id:'T1598', name:'Phishing for Information' },
    { id:'T1597', name:'Search Closed Sources' },
    { id:'T1596', name:'Search Open Technical Databases' },
    { id:'T1593', name:'Search Open Websites/Domains' },
  ]},
  { id:'TA0042', name:'Resource Development', techniques:[
    { id:'T1583', name:'Acquire Infrastructure' },
    { id:'T1586', name:'Compromise Accounts' },
    { id:'T1584', name:'Compromise Infrastructure' },
    { id:'T1587', name:'Develop Capabilities' },
    { id:'T1585', name:'Establish Accounts' },
    { id:'T1588', name:'Obtain Capabilities' },
    { id:'T1608', name:'Stage Capabilities' },
  ]},
  { id:'TA0001', name:'Initial Access', techniques:[
    { id:'T1189', name:'Drive-by Compromise' },
    { id:'T1190', name:'Exploit Public-Facing Application' },
    { id:'T1133', name:'External Remote Services' },
    { id:'T1200', name:'Hardware Additions' },
    { id:'T1566', name:'Phishing' },
    { id:'T1091', name:'Replication Through Removable Media' },
    { id:'T1195', name:'Supply Chain Compromise' },
    { id:'T1199', name:'Trusted Relationship' },
    { id:'T1078', name:'Valid Accounts' },
  ]},
  { id:'TA0002', name:'Execution', techniques:[
    { id:'T1059', name:'Command and Scripting Interpreter' },
    { id:'T1609', name:'Container Administration Command' },
    { id:'T1610', name:'Deploy Container' },
    { id:'T1203', name:'Exploitation for Client Execution' },
    { id:'T1559', name:'Inter-Process Communication' },
    { id:'T1106', name:'Native API' },
    { id:'T1053', name:'Scheduled Task/Job' },
    { id:'T1129', name:'Shared Modules' },
    { id:'T1072', name:'Software Deployment Tools' },
    { id:'T1569', name:'System Services' },
    { id:'T1204', name:'User Execution' },
    { id:'T1047', name:'Windows Management Instrumentation' },
  ]},
  { id:'TA0003', name:'Persistence', techniques:[
    { id:'T1098', name:'Account Manipulation' },
    { id:'T1197', name:'BITS Jobs' },
    { id:'T1547', name:'Boot or Logon Autostart Execution' },
    { id:'T1037', name:'Boot or Logon Initialization Scripts' },
    { id:'T1136', name:'Create Account' },
    { id:'T1543', name:'Create or Modify System Process' },
    { id:'T1546', name:'Event Triggered Execution' },
    { id:'T1133', name:'External Remote Services' },
    { id:'T1574', name:'Hijack Execution Flow' },
    { id:'T1556', name:'Modify Authentication Process' },
    { id:'T1053', name:'Scheduled Task/Job' },
    { id:'T1078', name:'Valid Accounts' },
  ]},
  { id:'TA0004', name:'Privilege Escalation', techniques:[
    { id:'T1548', name:'Abuse Elevation Control Mechanism' },
    { id:'T1134', name:'Access Token Manipulation' },
    { id:'T1547', name:'Boot or Logon Autostart Execution' },
    { id:'T1543', name:'Create or Modify System Process' },
    { id:'T1484', name:'Domain or Tenant Policy Modification' },
    { id:'T1611', name:'Escape to Host' },
    { id:'T1068', name:'Exploitation for Privilege Escalation' },
    { id:'T1574', name:'Hijack Execution Flow' },
    { id:'T1055', name:'Process Injection' },
    { id:'T1078', name:'Valid Accounts' },
  ]},
  { id:'TA0005', name:'Defense Evasion', techniques:[
    { id:'T1548', name:'Abuse Elevation Control Mechanism' },
    { id:'T1134', name:'Access Token Manipulation' },
    { id:'T1140', name:'Deobfuscate/Decode Files or Information' },
    { id:'T1480', name:'Execution Guardrails' },
    { id:'T1564', name:'Hide Artifacts' },
    { id:'T1562', name:'Impair Defenses' },
    { id:'T1070', name:'Indicator Removal' },
    { id:'T1036', name:'Masquerading' },
    { id:'T1556', name:'Modify Authentication Process' },
    { id:'T1112', name:'Modify Registry' },
    { id:'T1027', name:'Obfuscated Files or Information' },
    { id:'T1218', name:'System Binary Proxy Execution' },
    { id:'T1078', name:'Valid Accounts' },
  ]},
  { id:'TA0006', name:'Credential Access', techniques:[
    { id:'T1110', name:'Brute Force' },
    { id:'T1555', name:'Credentials from Password Stores' },
    { id:'T1212', name:'Exploitation for Credential Access' },
    { id:'T1187', name:'Forced Authentication' },
    { id:'T1606', name:'Forge Web Credentials' },
    { id:'T1056', name:'Input Capture' },
    { id:'T1556', name:'Modify Authentication Process' },
    { id:'T1111', name:'Multi-Factor Authentication Interception' },
    { id:'T1621', name:'Multi-Factor Authentication Request Generation' },
    { id:'T1040', name:'Network Sniffing' },
    { id:'T1003', name:'OS Credential Dumping' },
    { id:'T1558', name:'Steal or Forge Kerberos Tickets' },
    { id:'T1539', name:'Steal Web Session Cookie' },
  ]},
  { id:'TA0007', name:'Discovery', techniques:[
    { id:'T1087', name:'Account Discovery' },
    { id:'T1010', name:'Application Window Discovery' },
    { id:'T1217', name:'Browser Information Discovery' },
    { id:'T1083', name:'File and Directory Discovery' },
    { id:'T1046', name:'Network Service Discovery' },
    { id:'T1135', name:'Network Share Discovery' },
    { id:'T1057', name:'Process Discovery' },
    { id:'T1018', name:'Remote System Discovery' },
    { id:'T1518', name:'Software Discovery' },
    { id:'T1082', name:'System Information Discovery' },
    { id:'T1614', name:'System Location Discovery' },
  ]},
  { id:'TA0008', name:'Lateral Movement', techniques:[
    { id:'T1210', name:'Exploitation of Remote Services' },
    { id:'T1534', name:'Internal Spearphishing' },
    { id:'T1570', name:'Lateral Tool Transfer' },
    { id:'T1563', name:'Remote Service Session Hijacking' },
    { id:'T1021', name:'Remote Services' },
    { id:'T1091', name:'Replication Through Removable Media' },
    { id:'T1072', name:'Software Deployment Tools' },
    { id:'T1080', name:'Taint Shared Content' },
    { id:'T1550', name:'Use Alternate Authentication Material' },
  ]},
  { id:'TA0009', name:'Collection', techniques:[
    { id:'T1560', name:'Archive Collected Data' },
    { id:'T1123', name:'Audio Capture' },
    { id:'T1119', name:'Automated Collection' },
    { id:'T1115', name:'Clipboard Data' },
    { id:'T1530', name:'Data from Cloud Storage' },
    { id:'T1213', name:'Data from Information Repositories' },
    { id:'T1005', name:'Data from Local System' },
    { id:'T1039', name:'Data from Network Shared Drive' },
    { id:'T1114', name:'Email Collection' },
    { id:'T1056', name:'Input Capture' },
    { id:'T1113', name:'Screen Capture' },
  ]},
  { id:'TA0011', name:'Command and Control', techniques:[
    { id:'T1071', name:'Application Layer Protocol' },
    { id:'T1092', name:'Communication Through Removable Media' },
    { id:'T1132', name:'Data Encoding' },
    { id:'T1001', name:'Data Obfuscation' },
    { id:'T1568', name:'Dynamic Resolution' },
    { id:'T1573', name:'Encrypted Channel' },
    { id:'T1008', name:'Fallback Channels' },
    { id:'T1105', name:'Ingress Tool Transfer' },
    { id:'T1104', name:'Multi-Stage Channels' },
    { id:'T1095', name:'Non-Application Layer Protocol' },
    { id:'T1572', name:'Protocol Tunneling' },
    { id:'T1090', name:'Proxy' },
    { id:'T1102', name:'Web Service' },
  ]},
  { id:'TA0010', name:'Exfiltration', techniques:[
    { id:'T1020', name:'Automated Exfiltration' },
    { id:'T1030', name:'Data Transfer Size Limits' },
    { id:'T1048', name:'Exfiltration Over Alternative Protocol' },
    { id:'T1041', name:'Exfiltration Over C2 Channel' },
    { id:'T1011', name:'Exfiltration Over Other Network Medium' },
    { id:'T1052', name:'Exfiltration Over Physical Medium' },
    { id:'T1567', name:'Exfiltration Over Web Service' },
    { id:'T1029', name:'Scheduled Transfer' },
    { id:'T1537', name:'Transfer Data to Cloud Account' },
  ]},
  { id:'TA0040', name:'Impact', techniques:[
    { id:'T1531', name:'Account Access Removal' },
    { id:'T1485', name:'Data Destruction' },
    { id:'T1486', name:'Data Encrypted for Impact' },
    { id:'T1565', name:'Data Manipulation' },
    { id:'T1491', name:'Defacement' },
    { id:'T1561', name:'Disk Wipe' },
    { id:'T1499', name:'Endpoint Denial of Service' },
    { id:'T1495', name:'Firmware Corruption' },
    { id:'T1490', name:'Inhibit System Recovery' },
    { id:'T1498', name:'Network Denial of Service' },
    { id:'T1496', name:'Resource Hijacking' },
    { id:'T1489', name:'Service Stop' },
    { id:'T1529', name:'System Shutdown/Reboot' },
  ]},
];

const DEFENDER_CLOUD_RECS = [
  { id:'R-001', severity:'high', title:'Enable MFA for accounts with owner permissions on subscription',
    control:'Enable MFA', resourceType:'Subscription', affected:1 },
  { id:'R-002', severity:'high', title:'Storage accounts should disable public network access',
    control:'Restrict unauthorized network access', resourceType:'Storage account', affected:4 },
  { id:'R-003', severity:'high', title:'Management ports of virtual machines should be closed',
    control:'Manage access and permissions', resourceType:'Virtual machine', affected:7 },
  { id:'R-004', severity:'medium', title:'Diagnostic logs in Key Vault should be enabled',
    control:'Enable auditing and logging', resourceType:'Key vault', affected:3 },
  { id:'R-005', severity:'medium', title:'Just-in-time network access control should be applied on VMs',
    control:'Manage access and permissions', resourceType:'Virtual machine', affected:5 },
  { id:'R-006', severity:'medium', title:'Web Application Firewall should be enabled on App Gateway',
    control:'Restrict unauthorized network access', resourceType:'App Gateway', affected:2 },
  { id:'R-007', severity:'low', title:'Container images should have vulnerability findings resolved',
    control:'Remediate vulnerabilities', resourceType:'Container image', affected:23 },
  { id:'R-008', severity:'low', title:'Defender for Servers Plan 2 should be enabled',
    control:'Enable enhanced security features', resourceType:'Subscription', affected:1 },
];

const COMPLIANCE_FRAMEWORKS = [
  { name:'Microsoft cloud security benchmark', percent:72, passing:181, failing:71 },
  { name:'NIST SP 800-53 Rev. 5',              percent:58, passing:412, failing:298 },
  { name:'ISO/IEC 27001:2013',                 percent:64, passing:88,  failing:50 },
  { name:'PCI DSS 4.0',                        percent:51, passing:62,  failing:60 },
  { name:'CIS Azure Foundations Benchmark 2.0',percent:69, passing:118, failing:53 },
];

const DLP_POLICIES = [
  { id:'DLP-001', name:'U.S. Financial Data',
    scope:'Exchange, SharePoint, OneDrive, Teams', enabled:true,
    rules:[
      { name:'Block sharing externally',
        conditions:['Content contains: Credit card number (count ≥ 1, confidence ≥ 85%)','OR Content contains: U.S. bank account number'],
        actions:['Block access for external users','Notify user with policy tip','Generate incident report (high severity)'] },
    ] },
  { id:'DLP-002', name:'PII protection (U.S.)',
    scope:'Exchange, SharePoint, OneDrive, Teams, Endpoint', enabled:true,
    rules:[
      { name:'Warn on egress',
        conditions:['Content contains: U.S. Social Security Number (count ≥ 1, confidence ≥ 85%)'],
        actions:['User override allowed with business justification','Notify compliance officer'] },
    ] },
  { id:'DLP-003', name:'Source code protection',
    scope:'Endpoint DLP', enabled:false,
    rules:[
      { name:'Block upload to non-corporate cloud',
        conditions:['File extension is one of: .cs, .ts, .py, .go','AND Sensitive label = Confidential\\Engineering'],
        actions:['Block upload to non-allowed cloud services','Audit copy to USB'] },
    ] },
];

const DLP_INCIDENTS = [
  { id:'DLP-1007', severity:'high', status:'Needs review', policy:'U.S. Financial Data',
    user:'jdoe@contoso.com', location:'OneDrive', item:'customer-list.xlsx',
    activity:'External share blocked', sensitiveInfo:['Credit card number','U.S. bank account number'],
    time:'2026-06-28T15:00:11Z',
    timeline:['Sensitive info detected in workbook','External sharing attempt blocked','User shown policy tip','Incident report generated'],
    actions:['Keep block','Notify manager','Allow override with business justification','Escalate to eDiscovery'] },
  { id:'DLP-1012', severity:'medium', status:'User override requested', policy:'PII protection (U.S.)',
    user:'maria.ross@contoso.com', location:'SharePoint', item:'employee-roster.csv',
    activity:'Download warning acknowledged', sensitiveInfo:['U.S. Social Security Number'],
    time:'2026-06-28T12:38:00Z',
    timeline:['PII detected','Policy tip displayed','User entered business justification','Reviewer approval pending'],
    actions:['Approve override','Reject override','Request more context'] },
];

const INSIDER_RISK_POLICIES = [
  { name:'Data leaks by departing users', status:'Active', alerts:3,
    triggers:['HR connector: termination date within 30 days','Anomalous download volume from SharePoint'] },
  { name:'General data leaks',           status:'Active', alerts:7,
    triggers:['Downgrade of sensitivity label','Print of labeled documents'] },
  { name:'Risky browser usage',          status:'Test mode', alerts:0,
    triggers:['Egress to consumer file-sharing domains'] },
];

const INSIDER_RISK_CASES = [
  { id:'IR-2044', priority:'High', status:'Active', user:'olivia.martin@contoso.com',
    policy:'Data leaks by departing users', riskScore:86, trigger:'HR termination date within 30 days',
    summary:'Departing user downloaded 1,284 SharePoint files and copied labeled finance data to USB.',
    evidence:['Large SharePoint download volume','USB copy of Confidential\\Engineering file','Sensitivity label downgrade','Upload attempt to personal cloud storage'],
    nextSteps:['Review activity explorer evidence','Interview manager','Create eDiscovery case','Preserve mailbox and OneDrive content'] },
  { id:'IR-2051', priority:'Medium', status:'Needs triage', user:'jdoe@contoso.com',
    policy:'General data leaks', riskScore:61, trigger:'Repeated external sharing attempts',
    summary:'User attempted to share financial data externally after DLP block.',
    evidence:['DLP incident DLP-1007','Multiple external share attempts','Audit event FileDownloaded'],
    nextSteps:['Validate business need','Keep DLP block','Monitor for recurrence'] },
];

const COMMUNICATION_REVIEWS = [
  { id:'CC-3301', policy:'Regulated financial communications', severity:'medium',
    user:'trader1@contoso.com', channel:'Teams', status:'Pending reviewer',
    detected:'Potential promise of guaranteed return', message:'The client will get a guaranteed return if they sign today.' },
  { id:'CC-3308', policy:'Code of conduct', severity:'low',
    user:'sales.rep@contoso.com', channel:'Exchange', status:'Resolved',
    detected:'Potential harassment keyword', message:'Message held for context review and resolved as false positive.' },
];

const EDISCOVERY_CASES = [
  { id:'ED-9004', name:'Departing user data leak review', status:'Active',
    custodians:['olivia.martin@contoso.com'], sources:['Exchange mailbox','OneDrive','Teams chats'],
    holds:['Mailbox hold','OneDrive hold'], searches:['SharePoint finance downloads','USB copy events'],
    linkedCase:'IR-2044' },
  { id:'ED-9011', name:'OAuth consent abuse legal hold', status:'Draft',
    custodians:['jane.doe@contoso.com'], sources:['Exchange mailbox','Audit logs'],
    holds:['Mailbox hold pending'], searches:['DocViewer Pro consent and mail access'],
    linkedCase:'INC-1042' },
];

const EDISCOVERY_CONTENT_SEARCH = {
  caseId:'ED-9011',
  name:'DocViewer Pro consent and mail access',
  query:'("DocViewer Pro" OR "secure-document-portal") AND received>=2026-06-28',
  locations:['Jane Doe mailbox','Jane Doe OneDrive','Teams chats for Finance Ops'],
  conditions:['Date range: Jun 28, 2026 08:00-12:00 UTC','Sender or content contains secure-document-portal','Attachment names include invoice or overdue'],
  preview:[
    { location:'Exchange mailbox', item:'Action required: invoice overdue', custodian:'jane.doe@contoso.com',
      date:'2026-06-28T08:09:00Z', kind:'Email', match:'secure-document-portal[.]xyz link in message body' },
    { location:'Exchange mailbox', item:'DocViewer Pro permissions granted', custodian:'jane.doe@contoso.com',
      date:'2026-06-28T08:24:00Z', kind:'Notification', match:'OAuth app consent notification' },
    { location:'OneDrive', item:'Invoice-June-Overdue.url', custodian:'jane.doe@contoso.com',
      date:'2026-06-28T08:27:00Z', kind:'Shortcut', match:'Downloaded URL shortcut from phishing workflow' },
  ],
  export:['Export report only for triage notes','Export indexed items with deduplicated copies','Preserve export key in case notes; do not place real secrets in lab files'],
  interpretation:'Use Content search when the analyst needs mailbox, OneDrive, or Teams evidence for an investigation. Use Purview Audit for activity metadata and Graph activity logs for API calls.'
};

const GRAPH_ACTIVITY_GUIDANCE = [
  { title:'Where it lives',
    detail:'Microsoft Graph activity logs are collected through diagnostic settings, then queried from the configured Log Analytics workspace or routed into Sentinel.' },
  { title:'What it answers',
    detail:'Use the logs to see which app, user, operation, request URI, IP address, and result were observed after an OAuth consent or compromised-token event.' },
  { title:'How to enable in the lab story',
    detail:'Create a diagnostic setting for Microsoft Graph activity logs, send it to the SOC workspace, then hunt the MicrosoftGraphActivityLogs fixture table below.' },
];

const RECORD_LABELS = [
  { name:'Finance records - 7 years', type:'Retention label', status:'Published',
    disposition:'Disposition review required', locations:'SharePoint finance sites' },
  { name:'Legal hold material', type:'Record label', status:'Published',
    disposition:'Do not delete while active case exists', locations:'Exchange, OneDrive' },
  { name:'Security logs - 1 year', type:'Retention policy', status:'Published',
    disposition:'Auto-delete after retention period', locations:'Audit and security log exports' },
];

const LIFECYCLE_POLICIES = [
  { name:'Inactive Teams cleanup', status:'Simulation', scope:'Teams',
    rule:'No owner activity for 180 days', action:'Notify owner, then archive' },
  { name:'OneDrive stale content review', status:'Active', scope:'OneDrive',
    rule:'No access for 365 days and unlabeled', action:'Move to review workflow' },
  { name:'Audit export lifecycle', status:'Active', scope:'Storage account',
    rule:'Security export older than 365 days', action:'Delete after approval' },
];

const PURVIEW_SOLUTIONS = [
  { area:'Core', name:'Classic governance portal', route:'#/purview/classic-governance',
    detail:'Launch the support-mode classic governance experience for catalog, data health insights, and workflow labs.' },
  { area:'Data Security', name:'Data Loss Prevention', route:'#/purview/dlp',
    detail:'Protect sensitive content across Exchange, SharePoint, OneDrive, Teams, and endpoints.' },
  { area:'Data Security', name:'Information Protection', route:'#/purview/information-protection',
    detail:'Create sensitivity labels, label policies, and automatic classification behavior.' },
  { area:'Risk & Compliance', name:'Insider Risk Management', route:'#/purview/insider-risk',
    detail:'Detect risky user activity and manage investigation cases.' },
  { area:'Risk & Compliance', name:'Communication Compliance', route:'#/purview/communication-compliance',
    detail:'Review policy matches in Teams, Exchange, and other communication channels.' },
  { area:'Risk & Compliance', name:'eDiscovery', route:'#/purview/ediscovery',
    detail:'Create cases, manage custodians, preserve content, and run searches.' },
  { area:'Data Governance', name:'Records Management', route:'#/purview/records',
    detail:'Publish retention and record labels and review disposition workflows.' },
  { area:'Data Governance', name:'Data Lifecycle Management', route:'#/purview/lifecycle',
    detail:'Manage aging content, inactive locations, and retention-driven cleanup.' },
  { area:'Core', name:'Audit', route:'#/purview/audit',
    detail:'Search Microsoft 365 audit events by operation, user, workload, and IP address.' },
];

const CLASSIC_PURVIEW_FEATURES = [
  { name:'Data Catalog (classic)', route:'#/purview/classic-governance',
    detail:'Search and browse registered data assets, recent assets, owned assets, and glossary-linked metadata.' },
  { name:'Data Health Insights (classic)', route:'#/purview/classic-governance',
    detail:'Review catalog analytics such as sources, assets, glossary terms, ownership, and curation health.' },
  { name:'Purview Workflow (classic)', route:'#/purview/classic-governance',
    detail:'Model approval workflows for glossary changes, access requests, and governance review tasks.' },
];

const PURVIEW_CONNECTED_SOURCES = [
  { name:'Microsoft 365', status:'Connected', assets:186, icon:'M365' },
  { name:'Azure', status:'Connected', assets:94, icon:'AZ' },
  { name:'Amazon Web Services', status:'Ready to connect', assets:0, icon:'AWS' },
  { name:'Snowflake', status:'Ready to connect', assets:0, icon:'SN' },
  { name:'Other apps', status:'Ready to connect', assets:0, icon:'APP' },
];

const SENSITIVITY_LABELS = [
  { name:'Public', color:'#107c10', protection:'None' },
  { name:'General', color:'#0078d4', protection:'Header/Footer marking' },
  { name:'Confidential\\Engineering', color:'#ff8c00', protection:'Encryption (E3 keyset), watermark' },
  { name:'Highly confidential\\Legal', color:'#a4262c', protection:'Encryption, do-not-forward, expiration' },
];

const LABEL_POLICIES = [
  { name:'Default user labeling policy', status:'Published', users:'All users',
    labels:['Public','General','Confidential\\Engineering'], settings:['Require justification to lower classification','Recommend label when credit-card data is found'] },
  { name:'Legal restricted documents', status:'Published', users:'Legal department',
    labels:['Highly confidential\\Legal'], settings:['Apply encryption','Do not forward','Expire access after 30 days'] },
];

const LABEL_ACTIVITY = [
  { time:'2026-06-28T13:12:00Z', user:'maria.ross@contoso.com', file:'Q4-forecast.xlsx', label:'Confidential\\Engineering', action:'Applied automatically' },
  { time:'2026-06-28T12:43:00Z', user:'legal.ops@contoso.com', file:'Litigation-hold.docx', label:'Highly confidential\\Legal', action:'Applied manually' },
  { time:'2026-06-28T11:58:00Z', user:'jdoe@contoso.com', file:'customer-list.xlsx', label:'General', action:'Downgraded with justification' },
];

const AUDIT_LOG = [
  { time:'2026-06-28T15:00:11Z', user:'jdoe@contoso.com', op:'FileDownloaded',
    workload:'OneDrive', item:'/personal/jdoe/customer-list.xlsx', ip:'76.21.55.4' },
  { time:'2026-06-28T14:55:02Z', user:'admin@contoso.com', op:'Add member to role',
    workload:'AzureAD', item:'Role: Global Administrator', ip:'10.10.0.5' },
  { time:'2026-06-28T14:20:33Z', user:'svc-backup@contoso.com', op:'DirectoryServicesReplication',
    workload:'AAD Connect', item:'DC01.contoso.com', ip:'10.20.4.55' },
  { time:'2026-06-28T08:23:11Z', user:'jane.doe@contoso.com', op:'Consent to application',
    workload:'AzureAD', item:'DocViewer Pro', ip:'76.21.55.4' },
  { time:'2026-06-28T13:27:00Z', user:'sam.lee@contoso.com', op:'UserLoggedIn',
    workload:'AzureAD', item:'Risky sign-in', ip:'91.219.236.54' },
  { time:'2026-06-28T10:19:45Z', user:'fin-svc@contoso.com', op:'FileModified',
    workload:'SharePoint', item:'/sites/finance/budget.locked', ip:'10.30.8.22' },
];

const GUIDED_SCENARIOS = [
  {
    id:'noisy-detection',
    name:'Tune a noisy detection',
    archetype:'Suppression rule drift',
    summary:'Follow the scanner.exe alerts from suppression success to post-update hash drift.',
    steps:[
      { route:'#/defender/home', target:'.guided-scenario-card',
        title:'Start from the shift dashboard',
        body:'Pick the noisy scanner scenario from the home view, then move into the alert queue where the suppression behavior is visible.' },
      { route:'#/defender/alerts', target:'.grid tbody tr:nth-child(3)',
        title:'Open the post-update alert',
        body:'The first two scanner.exe detections are suppressed. The post-update events still have the same file name, but the hash changed, so the AND rule no longer matches.',
        actionLabel:'Open alert A003', action:'openAlert:A003' },
      { route:'#/defender/alerts', target:'#panel-alert .callout.warn',
        title:'Inspect the rule evaluation',
        body:'The alert detail shows which condition failed. In real tuning work, this is where you decide whether a hash is too volatile for the rule.' },
      { route:'#/defender/suppression', target:'.callout',
        title:'Review the suppression design',
        body:'Use stable indicators when possible, such as signer or controlled install path. Avoid broad file-name-only suppression for attacker look-alikes.' },
    ],
  },
  {
    id:'multi-alert-incident',
    name:'Triage a multi-alert incident',
    archetype:'DCSync identity attack',
    summary:'Open a correlated incident, review entities, and follow the timeline.',
    steps:[
      { route:'#/defender/incidents', target:'.grid tbody tr:first-child',
        title:'Find the identity incident',
        body:'The incident queue groups related Defender for Identity alerts into a single investigation record.',
        actionLabel:'Open incident INC-1019', action:'openIncident:INC-1019' },
      { route:'#/defender/incidents', target:'#panel-incident .entity-chip',
        title:'Pivot through evidence',
        body:'Entities identify the service account, domain controller, and source IP that matter for containment and validation.' },
      { route:'#/sentinel/incidents', target:'.grid tbody tr:first-child',
        title:'Confirm Sentinel correlation',
        body:'The same incident pattern appears from the SIEM side, reinforcing queue triage across Defender XDR and Sentinel.' },
    ],
  },
  {
    id:'hunt-public-folder',
    name:'Hunt endpoint staging',
    archetype:'KQL threat hunting',
    summary:'Run the saved query that finds suspicious process execution from C:\\Users\\Public.',
    steps:[
      { route:'#/defender/hunting', target:'#kql',
        title:'Load the hunting query',
        body:'The query searches process execution from a common attacker staging path and excludes routine initiating processes.' },
      { route:'#/defender/hunting', target:'.kql-toolbar .btn-primary',
        title:'Run against fixtures',
        body:'Run the mock query to review endpoint rows, then promote the pattern to detection engineering in Sentinel analytics.' },
      { route:'#/sentinel/analytics', target:'.grid tbody tr:first-child',
        title:'Connect hunting to rules',
        body:'Scheduled analytics rules turn repeatable hunting logic into alerting with severity, frequency, and MITRE mapping.' },
    ],
  },
  {
    id:'audit-search',
    name:'Search the audit log',
    archetype:'M365 audit investigation',
    summary:'Use Purview audit events to validate who performed a sensitive operation.',
    steps:[
      { route:'#/purview/audit', target:'.card.card-body',
        title:'Set audit criteria',
        body:'Audit search narrows activity by operation, user, workload, and time window during an investigation.' },
      { route:'#/purview/audit', target:'.grid tbody tr:nth-child(2)',
        title:'Review privileged activity',
        body:'The result set includes role assignment, file access, consent grant, and identity replication events for cross-checking incident evidence.' },
    ],
  },
];

const COPILOT_PROMPTS = [
  { title:'Summarize incident INC-1019',
    answer:'Two Defender for Identity alerts indicate possible DCSync from svc-backup against DC01. Review service-account ownership, reset credentials, and validate replication permissions before closure.' },
  { title:'Draft KQL for public-folder execution',
    answer:'Start with DeviceProcessEvents, filter FolderPath for C:\\Users\\Public, remove known installers, then project Timestamp, DeviceName, FileName, SHA256, and AccountName for triage.' },
  { title:'Expand Jane Doe entities',
    answer:'Pivot from jane.doe@contoso.com to the phishing URL, OAuth app DocViewer Pro, sign-in IP 76.21.55.4, and recent CloudAppEvents consent activity.' },
  { title:'Map this to MITRE',
    answer:'Scanner tuning maps to Discovery. DCSync maps to Credential Access and Persistence. OAuth abuse maps to Initial Access and Persistence. Ransomware posture work maps to Impact prevention.' },
  { title:'Run guided investigation for INC-1042',
    answer:'Open the guided flow to review the static plan, tool calls, entity expansion, and final containment verdict for the phishing-to-OAuth incident.',
    flow:'agentic-investigation' },
];

const DEFAULT_SUPPRESSION_RULE = {
  id:'R-DEFAULT', name:'Suppress legitimate vulnerability scanner',
  scope:'All devices in organization', createdAt:'2026-06-28T08:30:00Z', enabled:true,
  conditions:[
    { field:'file_name', op:'equals', value:'scanner.exe' },
    { field:'sha256',    op:'equals', value:KNOWN_GOOD_HASH },
  ],
};

const FIELDS = [
  { key:'file_name', label:'File name' },
  { key:'sha256',    label:'SHA256' },
  { key:'path',      label:'Folder path' },
  { key:'cmdline',   label:'Process command line' },
  { key:'signer',    label:'Signer' },
];

const PORTALS = [
  { id:'defender',      name:'Microsoft Defender',          tag:'XDR · alerts, incidents, hunting',           color:'#0078d4', initial:'D' },
  { id:'sentinel',      name:'Microsoft Sentinel',          tag:'SIEM · analytics rules, hunting, automation',color:'#0064bf', initial:'S' },
  { id:'defender-cloud',name:'Microsoft Defender for Cloud',tag:'CSPM/CWPP · recommendations, compliance',    color:'#5c2d91', initial:'C' },
  { id:'purview',       name:'Microsoft Purview',           tag:'Data security · DLP, insider risk, audit',   color:'#038387', initial:'P' },
  { id:'copilot',       name:'Security Copilot',            tag:'Standalone · sessions, promptbooks, plugins', color:'#8661c5', initial:'SC' },
];

// Microsoft Cloud app launcher — same set surfaced by the waffle in security.microsoft.com.
// Shown in the outer pane across all workloads; current app gets highlighted by the renderer.
const MICROSOFT_CLOUD_NAV = [
  { label:'Microsoft Foundry',   icon:'🧪' },
  { label:'Azure',               icon:'🔷' },
  { label:'Copilot Studio',      icon:'🤖' },
  { label:'Data Explorer',       icon:'📊' },
  { label:'Defender',            icon:'🛡' },
  { label:'DevOps',              icon:'🛠' },
  { label:'Entra',               icon:'🆔' },
  { label:'Fabric',              icon:'🧵' },
  { label:'GitHub',              icon:'🐙' },
  { label:'Intune',              icon:'📱' },
  { label:'Microsoft 365 Admin', icon:'🏢' },
  { label:'Power Automate',      icon:'🔁' },
  { label:'Power Platform',      icon:'⚡' },
  { label:'Purview',             icon:'📚' },
  { label:'Visual Studio Code',  icon:'🧩' },
  { label:'Microsoft Sentinel',  icon:'🛰' },
];

const NAV = {
  defender: [
    { route:'#/defender/home',                  label:'Home',                    icon:'🏠' },
    { route:'#/defender/exposure',              label:'Exposure management',     icon:'🎯' },
    { section:'Investigation & response' },
    { route:'#/defender/incidents',             label:'Incidents',               icon:'⛓' },
    { route:'#/defender/alerts',                label:'Alerts',                  icon:'⚠' },
    { route:'#/defender/cases',                 label:'Cases',                   icon:'📁' },
    { route:'#/defender/hunting',               label:'Advanced hunting',        icon:'🔎' },
    { route:'#/defender/custom-detections',     label:'Custom detections',       icon:'🧠' },
    { route:'#/defender/hunting-graph',         label:'Hunting graph (Preview)', icon:'🕸' },
    { route:'#/defender/action-center',         label:'Action center',           icon:'🧰' },
    { section:'Threat intelligence' },
    { route:'#/defender/threat-analytics',      label:'Threat analytics',        icon:'📊' },
    { route:'#/defender/intel-explorer',        label:'Intel explorer',          icon:'🛰' },
    { section:'Assets' },
    { route:'#/defender/devices',               label:'Devices',                 icon:'💻' },
    { route:'#/defender/identities',            label:'Identities',              icon:'🆔' },
    { route:'#/defender/identity-protection',   label:'Identity protection',     icon:'🔐' },
    { section:'Microsoft Sentinel' },
    { route:'#/sentinel/home',                  label:'Overview',                icon:'🏠' },
    { route:'#/sentinel/hunting',               label:'Search',                  icon:'🔎' },
    { route:'#/sentinel/incidents',             label:'Threat management',       icon:'⛓' },
    { route:'#/sentinel/graph',                 label:'Sentinel Graph',          icon:'🕸' },
    { route:'#/sentinel/analytics',             label:'Analytics',               icon:'🧠' },
    { section:'Content management' },
    { route:'#/defender/content-hub',           label:'Content hub',             icon:'🧱' },
    { route:'#/defender/repositories',          label:'Repositories',            icon:'📚' },
    { route:'#/defender/community',             label:'Community',               icon:'💬' },
    { section:'Configuration' },
    { route:'#/defender/settings',              label:'Settings',                icon:'⚙' },
    { route:'#/defender/endpoints',             label:'Endpoints',               icon:'💻' },
    { route:'#/defender/email-collab',          label:'Email & collaboration',   icon:'✉' },
    { route:'#/defender/cloud-apps',            label:'Cloud apps',              icon:'☁' },
    { route:'#/defender/secure-score',          label:'Secure score',            icon:'🛡' },
    { route:'#/defender/suppression',           label:'Suppression rules',       icon:'🔕' },
    { route:'#/defender/asr-policy',            label:'ASR policies',            icon:'🚧' },
    { route:'#/defender/notifications',         label:'Email notifications',     icon:'📨' },
    { route:'#/defender/alert-tuning',          label:'Alert tuning',            icon:'🎚' },
    { route:'#/defender/air',                   label:'AIR center',              icon:'🤖' },
    { section:'Other' },
    { route:'#/defender/reports',               label:'Reports',                 icon:'📑' },
    { route:'#/defender/learning-hub',          label:'Learning hub',            icon:'🎓' },
    { route:'#/defender/trials',                label:'Trials',                  icon:'🧪' },
    // === local-tasks nav:defender ===
  ],
  sentinel: [
    { section:'General' },
    { route:'#/sentinel/home',                  label:'Overview (Preview)',      icon:'🏠' },
    { route:'#/sentinel/logs',                  label:'Logs',                    icon:'📜' },
    { route:'#/sentinel/news',                  label:'News & guides',           icon:'📰' },
    { route:'#/sentinel/search',                label:'Search',                  icon:'🔎' },
    { section:'Threat management' },
    { route:'#/sentinel/incidents',             label:'Incidents',               icon:'⛓' },
    { route:'#/sentinel/graph',                 label:'Sentinel Graph',          icon:'🕸' },
    { route:'#/sentinel/workbooks',             label:'Workbooks',               icon:'📓' },
    { route:'#/sentinel/hunting',               label:'Hunting',                 icon:'🔎' },
    { route:'#/sentinel/hunting/dns',           label:'ASIM DNS (Preview)',      icon:'🌐' },
    { route:'#/sentinel/anomalies',             label:'Anomalies',               icon:'〽' },
    { route:'#/sentinel/soc-optimization',      label:'SOC optimization',        icon:'📈' },
    { route:'#/sentinel/summary-rules',         label:'Summary rules',           icon:'∑' },
    { route:'#/sentinel/data-lake-jobs',        label:'Data lake KQL jobs',      icon:'🌊' },
    { route:'#/sentinel/notebooks',             label:'Notebooks',               icon:'📓' },
    { route:'#/sentinel/entity-behavior',       label:'Entity behavior',         icon:'👤' },
    { route:'#/sentinel/threat-intel',          label:'Threat intelligence',     icon:'🛰' },
    { route:'#/sentinel/mitre',                 label:'MITRE ATT&CK (Preview)',  icon:'🧭' },
    { section:'Content management' },
    { route:'#/sentinel/content-hub',           label:'Content hub',             icon:'🧱' },
    { route:'#/sentinel/repositories',          label:'Repositories (Preview)',  icon:'📚' },
    { route:'#/sentinel/community',             label:'Community',               icon:'💬' },
    { section:'Configuration' },
    { route:'#/sentinel/workspace-manager',     label:'Workspace manager (Preview)', icon:'🧰' },
    { route:'#/sentinel/data-connectors',       label:'Data connectors',         icon:'🔌' },
    { route:'#/sentinel/analytics',             label:'Analytics',               icon:'🧠' },
    { route:'#/sentinel/watchlist',             label:'Watchlist',               icon:'👁' },
    { route:'#/sentinel/automation',            label:'Automation',              icon:'⚙' },
    { route:'#/sentinel/settings',              label:'Settings',                icon:'⚙' },
    // === local-tasks nav:sentinel ===
  ],
  'defender-cloud': [
    { section:'General' },
    { route:'#/defender-cloud/overview',         label:'Overview',                   icon:'🏠' },
    { route:'#/defender-cloud/setup',            label:'Setup',                      icon:'🧩' },
    { route:'#/defender-cloud/recommendations',  label:'Recommendations',            icon:'✅' },
    { route:'#/defender-cloud/attack-paths',     label:'Attack path analysis',       icon:'🧭' },
    { route:'#/defender-cloud/alerts',           label:'Security alerts',            icon:'⚠' },
    { route:'#/defender-cloud/inventory',        label:'Inventory',                  icon:'📦' },
    { route:'#/defender-cloud/explorer',         label:'Cloud Security Explorer',    icon:'🔎' },
    { route:'#/defender-cloud/workbooks',        label:'Workbooks',                  icon:'📓' },
    { route:'#/defender-cloud/community',        label:'Community',                  icon:'💬' },
    { route:'#/defender-cloud/diagnose',         label:'Diagnose and solve problems',icon:'🩺' },
    { section:'Cloud Security' },
    { route:'#/defender-cloud/cloud-security',   label:'Cloud Security',             icon:'☁' },
    { route:'#/defender-cloud/regulatory',       label:'Regulatory compliance',      icon:'📜' },
    { section:'Management' },
    { route:'#/defender-cloud/environment',      label:'Environment settings',       icon:'⚙' },
    { route:'#/defender-cloud/workflow',         label:'Workflow automation',        icon:'🔁' },
    // === local-tasks nav:defender-cloud ===
  ],
  purview: [
    { section:'Microsoft Purview' },
    { route:'#/purview/home',                   label:'Home',                  icon:'🏠' },
    { route:'#/purview/solutions',              label:'Solutions',             icon:'🧩' },
    { route:'#/purview/classic-governance',     label:'Classic governance',    icon:'🏛' },
    { section:'Data security' },
    { route:'#/purview/dlp',                    label:'Data loss prevention',  icon:'🚫' },
    { route:'#/purview/information-protection', label:'Information protection',icon:'🔖' },
    { section:'Risk & compliance' },
    { route:'#/purview/insider-risk',           label:'Insider risk',          icon:'🕵' },
    { route:'#/purview/communication-compliance', label:'Communication compliance', icon:'💬' },
    { route:'#/purview/ediscovery',             label:'eDiscovery',            icon:'🔍' },
    { route:'#/purview/audit',                  label:'Audit',                 icon:'📜' },
    { route:'#/purview/graph-activity',         label:'Graph activity logs',   icon:'🧾' },
    { section:'Data governance' },
    { route:'#/purview/records',                label:'Records management',    icon:'🗃' },
    { route:'#/purview/lifecycle',              label:'Data lifecycle',        icon:'⏱' },
    { section:'Portal' },
    { route:'#/purview/settings',               label:'Settings',              icon:'⚙' },
    // === local-tasks nav:purview ===
  ],
  copilot: [
    { route:'#/copilot/home',                   label:'Home',                  icon:'🏠' },
    // === local-tasks nav:copilot ===
  ],
};

// ---------- ASIM DNS hunting (Sentinel) ----------
// Source: ASIM DNS schema reference. _Im_Dns is the unifying parser; here we
// fake a small bundled dataset so the lab can demonstrate the query shape
// (filter params, NXDOMAIN beacons, TOR proxy lookups, suspicious response
// prefixes, ANY-type recon, DNS tunneling).
const IM_DNS = [
  // Baseline benign traffic from corporate clients.
  { TimeGenerated:'2026-06-29T07:55:01Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.12', SrcHostname:'WKS-01', DstIpAddr:'10.0.0.10', DnsQuery:'github.com',
    DnsQueryTypeName:'A', DnsResponseName:'140.82.114.4' },
  { TimeGenerated:'2026-06-29T07:55:14Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.31', SrcHostname:'WKS-12', DstIpAddr:'10.0.0.10', DnsQuery:'login.microsoftonline.com',
    DnsQueryTypeName:'A', DnsResponseName:'20.190.137.40' },
  { TimeGenerated:'2026-06-29T07:56:02Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.31', SrcHostname:'WKS-12', DstIpAddr:'10.0.0.10', DnsQuery:'outlook.office365.com',
    DnsQueryTypeName:'A', DnsResponseName:'52.96.79.18' },
  { TimeGenerated:'2026-06-29T07:57:11Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.55', SrcHostname:'WKS-21', DstIpAddr:'10.0.0.10', DnsQuery:'raw.githubusercontent.com',
    DnsQueryTypeName:'A', DnsResponseName:'185.199.108.133' },
  { TimeGenerated:'2026-06-29T07:58:30Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.12', SrcHostname:'WKS-01', DstIpAddr:'10.0.0.10', DnsQuery:'learn.microsoft.com',
    DnsQueryTypeName:'A', DnsResponseName:'13.107.42.16' },
  { TimeGenerated:'2026-06-29T08:00:00Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.41', SrcHostname:'WKS-17', DstIpAddr:'10.0.0.10', DnsQuery:'cdn.jsdelivr.net',
    DnsQueryTypeName:'A', DnsResponseName:'151.101.1.229' },

  // NXDOMAIN DGA burst from FIN-03 — tight time window, random labels.
  { TimeGenerated:'2026-06-29T08:02:01Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'xk93lv2-mzpq.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:02:04Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'jq8z7nx-rmav.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:02:07Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'lzpq3rk-x4mq.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:02:09Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'pq3rkmz-9xq2.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:02:12Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'rkmz9xq2-pq3l.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:02:15Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10', DnsQuery:'mz9xq2pq-3lkv.top',
    DnsQueryTypeName:'A', DnsResponseName:'' },

  // TOR proxy lookups — clear policy violation indicator.
  { TimeGenerated:'2026-06-29T08:05:20Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.88', SrcHostname:'WKS-DEV-04', DstIpAddr:'10.0.0.10', DnsQuery:'tor2web.org',
    DnsQueryTypeName:'A', DnsResponseName:'185.220.101.4' },
  { TimeGenerated:'2026-06-29T08:05:25Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.88', SrcHostname:'WKS-DEV-04', DstIpAddr:'10.0.0.10', DnsQuery:'tor2web.com',
    DnsQueryTypeName:'A', DnsResponseName:'185.220.101.7' },
  { TimeGenerated:'2026-06-29T08:05:31Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.88', SrcHostname:'WKS-DEV-04', DstIpAddr:'10.0.0.10', DnsQuery:'torlink.co',
    DnsQueryTypeName:'A', DnsResponseName:'45.95.168.12' },
  { TimeGenerated:'2026-06-29T08:06:02Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.88', SrcHostname:'WKS-DEV-04', DstIpAddr:'10.0.0.10', DnsQuery:'tor2web.io',
    DnsQueryTypeName:'A', DnsResponseName:'' },

  // Responses landing in suspicious IP prefixes — match by response_has_any_prefix.
  { TimeGenerated:'2026-06-29T08:08:14Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.55', SrcHostname:'WKS-21', DstIpAddr:'10.0.0.10', DnsQuery:'updates.legit-looking.io',
    DnsQueryTypeName:'A', DnsResponseName:'45.95.168.241' },
  { TimeGenerated:'2026-06-29T08:08:20Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.31', SrcHostname:'WKS-12', DstIpAddr:'10.0.0.10', DnsQuery:'cdn.suspicious-host.ru',
    DnsQueryTypeName:'A', DnsResponseName:'185.220.102.8' },
  { TimeGenerated:'2026-06-29T08:09:00Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.41', SrcHostname:'WKS-17', DstIpAddr:'10.0.0.10', DnsQuery:'api.x4z2.net',
    DnsQueryTypeName:'A', DnsResponseName:'45.95.169.5' },

  // DNS tunneling — long encoded labels under attacker-controlled zone.
  { TimeGenerated:'2026-06-29T08:11:08Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10',
    DnsQuery:'aGVsbG8td29ybGQtZXhmaWwtZGF0YS1ibG9iLTAwMQ.tn.exfil-host.example',
    DnsQueryTypeName:'TXT', DnsResponseName:'"ack=001"' },
  { TimeGenerated:'2026-06-29T08:11:12Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10',
    DnsQuery:'cG9zdC1jaHVuay0wMDItYmFzZTY0LWVuY29kZWQ.tn.exfil-host.example',
    DnsQueryTypeName:'TXT', DnsResponseName:'"ack=002"' },
  { TimeGenerated:'2026-06-29T08:11:18Z', EventProduct:'Corelight Zeek', EventVendor:'Corelight', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.4.77', SrcHostname:'WKS-FIN-03', DstIpAddr:'10.0.0.10',
    DnsQuery:'YzNAcjN0LWNodW5rLTAwMy1mb29iYXItYmF6.tn.exfil-host.example',
    DnsQueryTypeName:'TXT', DnsResponseName:'"ack=003"' },

  // ANY-type recon — historically used for amplification reflection.
  { TimeGenerated:'2026-06-29T08:13:01Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'198.51.100.22', SrcHostname:'(external)', DstIpAddr:'10.0.0.10', DnsQuery:'contoso.com',
    DnsQueryTypeName:'ANY', DnsResponseName:'(multiple)' },
  { TimeGenerated:'2026-06-29T08:13:09Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'203.0.113.41', SrcHostname:'(external)', DstIpAddr:'10.0.0.10', DnsQuery:'contoso.com',
    DnsQueryTypeName:'ANY', DnsResponseName:'(multiple)' },

  // Plain NXDOMAIN typos — noise that any NXDOMAIN-only rule will surface.
  { TimeGenerated:'2026-06-29T08:14:22Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.12', SrcHostname:'WKS-01', DstIpAddr:'10.0.0.10', DnsQuery:'microsft.com',
    DnsQueryTypeName:'A', DnsResponseName:'' },
  { TimeGenerated:'2026-06-29T08:14:48Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Failure', EventResultDetails:'NXDOMAIN',
    SrcIpAddr:'10.0.4.41', SrcHostname:'WKS-17', DstIpAddr:'10.0.0.10', DnsQuery:'githunb.com',
    DnsQueryTypeName:'A', DnsResponseName:'' },

  // Internal lookups — confirm parser handles TXT/MX too.
  { TimeGenerated:'2026-06-29T08:16:10Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.0.5', SrcHostname:'MAIL-01', DstIpAddr:'10.0.0.10', DnsQuery:'corp.contoso.local',
    DnsQueryTypeName:'MX', DnsResponseName:'mail-01.corp.contoso.local' },
  { TimeGenerated:'2026-06-29T08:16:42Z', EventProduct:'Microsoft DNS Server', EventVendor:'Microsoft', EventSchema:'Dns',
    EventType:'Query', EventSubType:'response', EventResult:'Success', EventResultDetails:'NoError',
    SrcIpAddr:'10.0.0.5', SrcHostname:'MAIL-01', DstIpAddr:'10.0.0.10', DnsQuery:'_dmarc.contoso.com',
    DnsQueryTypeName:'TXT', DnsResponseName:'"v=DMARC1; p=reject; rua=mailto:dmarc@contoso.com"' },
];

const ASIM_DNS_SAVED_QUERIES = [
  {
    name:'Failed lookups (NXDOMAIN) — last day',
    description:'Canonical ASIM example. Surfaces typos, dead domains, and DGA bursts. Pivot on SrcHostname to find beaconing.',
    query:`_Im_Dns(responsecodename='NXDOMAIN', starttime=ago(1d), endtime=now())\n| project TimeGenerated, SrcHostname, SrcIpAddr, DnsQuery, DnsQueryTypeName, EventResultDetails`,
  },
  {
    name:'Lookups to TOR proxy domains',
    description:"Block-list pattern. ASIM's domain_has_any takes a dynamic list — works against any normalized source.",
    query:`let torProxies=dynamic(["tor2web.org","tor2web.com","torlink.co","tor2web.io"]);\n_Im_Dns(domain_has_any=torProxies)\n| project TimeGenerated, SrcHostname, DnsQuery, DnsResponseName, EventResultDetails`,
  },
  {
    name:'Responses pointing at known-bad prefixes',
    description:'response_has_any_prefix filters on the DnsResponseName. Prefixes end with a dot.',
    query:`_Im_Dns(response_has_any_prefix=dynamic(["185.220.","45.95."]))\n| project TimeGenerated, SrcHostname, DnsQuery, DnsResponseName`,
  },
  {
    name:'ANY-type queries (amplification recon)',
    description:'DnsQueryTypeName == "ANY" from external sources is a recon / amplification signal.',
    query:`_Im_Dns()\n| where DnsQueryTypeName == "ANY"\n| project TimeGenerated, SrcIpAddr, DnsQuery, DnsQueryTypeName`,
  },
  {
    name:'Long DNS labels (tunneling)',
    description:'Subdomain labels over 40 chars are a classic DNS exfiltration signal.',
    query:`_Im_Dns()\n| where DnsQuery matches regex "^[A-Za-z0-9-]{30,}\\."\n| project TimeGenerated, SrcHostname, DnsQuery, DnsQueryTypeName`,
  },
];

const ASIM_DNS_NOTES = [
  { title:'Unifying parser', detail:'_Im_Dns calls every source-specific parser (vimDnsMicrosoftOMS, vimDnsCorelightZeek, …) and returns a single normalized result set. Always prefer it over a raw table name.' },
  { title:'Filter pushdown', detail:'Pass time and IP filters as parameters (starttime, srcipaddr, domain_has_any) — they push down to each source parser instead of running after the union, dramatically improving performance.' },
  { title:'Response duplication', detail:"DNS uses UDP, so request and response segments aren't linked. Most teams only log the client-facing response. Filter EventSubType == 'response' if you ingest multiple segments." },
  { title:'Schema version', detail:'Current ASIM DNS schema is 0.1.7. EventSchemaVersion stays pinned on the rows so downstream content can branch on it.' },
];

// ---------- Defender for Endpoint device inventory + timeline ----------
const DEVICES = [
  { id:'WKS-03', name:'WKS-03', domain:'contoso.com', os:'Windows 11 Enterprise 23H2',
    riskLevel:'High', exposureLevel:'High', healthStatus:'Active', onboardingStatus:'Onboarded',
    sensor:'Defender for Endpoint', firstSeen:'2025-11-08T12:14:00Z', lastSeen:'2026-06-28T15:02:11Z',
    primaryUser:'jdoe@contoso.com', ip:'10.20.7.42', tags:['Sales','Win11'], openAlerts:2,
    isInternetFacing:true, recommendationCount:3, installedSoftware:42, discoveredVulnerabilities:2 },
  { id:'FIN-FS-02', name:'FIN-FS-02', domain:'contoso.com', os:'Windows Server 2022',
    riskLevel:'High', exposureLevel:'Medium', healthStatus:'Active', onboardingStatus:'Onboarded',
    sensor:'Defender for Endpoint', firstSeen:'2024-02-04T09:00:00Z', lastSeen:'2026-06-28T10:22:00Z',
    primaryUser:'fin-svc@contoso.com', ip:'10.20.3.14', tags:['Finance','FileServer'], openAlerts:2,
    isInternetFacing:false, recommendationCount:5, installedSoftware:64, discoveredVulnerabilities:4 },
  { id:'WKS-01', name:'WKS-01', domain:'contoso.com', os:'Windows 11 Enterprise 23H2',
    riskLevel:'Medium', exposureLevel:'Medium', healthStatus:'Active', onboardingStatus:'Onboarded',
    sensor:'Defender for Endpoint', firstSeen:'2025-06-22T08:00:00Z', lastSeen:'2026-06-28T14:01:00Z',
    primaryUser:'svc-scan@contoso.com', ip:'10.20.7.10', tags:['IT','Win11'], openAlerts:1,
    isInternetFacing:false, recommendationCount:2, installedSoftware:39, discoveredVulnerabilities:1 },
  { id:'WKS-02', name:'WKS-02', domain:'contoso.com', os:'Windows 11 Enterprise 23H2',
    riskLevel:'Medium', exposureLevel:'Low',    healthStatus:'Active', onboardingStatus:'Onboarded',
    sensor:'Defender for Endpoint', firstSeen:'2025-06-22T08:01:00Z', lastSeen:'2026-06-28T14:16:00Z',
    primaryUser:'svc-scan@contoso.com', ip:'10.20.7.11', tags:['IT','Win11'], openAlerts:1,
    isInternetFacing:false, recommendationCount:1, installedSoftware:37, discoveredVulnerabilities:1 },
  { id:'DC01', name:'DC01', domain:'contoso.com', os:'Windows Server 2022 (Domain Controller)',
    riskLevel:'High', exposureLevel:'Low',    healthStatus:'Active', onboardingStatus:'Onboarded',
    sensor:'Defender for Identity + Defender for Endpoint',
    firstSeen:'2023-09-12T00:00:00Z', lastSeen:'2026-06-28T15:00:00Z',
    primaryUser:'(machine account)', ip:'10.20.0.10', tags:['Tier-0','DC'], openAlerts:2,
    isInternetFacing:false, recommendationCount:4, installedSoftware:31, discoveredVulnerabilities:3 },
];

const DEVICE_LIVE_RESPONSE = {
  'FIN-FS-02': {
    operator:'alex.ansbergs',
    started:'2026-06-28T10:23:15Z',
    status:'Connected',
    transcript:[
      { prompt:'connect FIN-FS-02', output:'Session established through Defender for Endpoint. Role: Live response operator.' },
      { prompt:'dir C:\\ProgramData', output:'2026-06-28 10:17  locker.exe\n2026-06-28 10:18  RECOVER-FILES.txt\n2026-06-28 09:56  finance-cache.db' },
      { prompt:'getfile C:\\ProgramData\\locker.exe', output:'File queued for collection as evidence item LR-20260628-001.' },
      { prompt:'run triage.ps1', output:'Process tree captured. Network connections: none active after isolation. Shadow-copy deletion artifacts found.' },
    ],
    log:['10:23:15 Session started','10:23:31 Directory listing returned','10:23:49 File collection queued','10:24:18 Triage script completed'],
  },
  'WKS-03': {
    operator:'alex.ansbergs',
    started:'2026-06-28T15:03:10Z',
    status:'Connected',
    transcript:[
      { prompt:'connect WKS-03', output:'Session established through Defender for Endpoint. Role: Live response operator.' },
      { prompt:'dir C:\\Users\\Public', output:'2026-06-28 15:00  scanner.exe\n2026-06-28 15:00  scanner.log' },
      { prompt:'getfile C:\\Users\\Public\\scanner.exe', output:'File queued for collection as evidence item LR-20260628-014.' },
      { prompt:'run autoruns-lite.ps1', output:'Run key references C:\\Users\\Public\\scanner.exe. No signed publisher metadata found.' },
    ],
    log:['15:03:10 Session started','15:03:22 Directory listing returned','15:03:37 File collection queued','15:04:02 Autoruns triage completed'],
  },
};

const DEVICE_INVESTIGATION_PACKAGES = {
  'FIN-FS-02': {
    status:'Ready to download',
    collected:'2026-06-28T10:25:44Z',
    reason:'High-confidence ransomware disruption. Collect package before wiping or rebuilding the file server.',
    contents:[
      'Autoruns and scheduled task inventory',
      'Running processes and loaded modules',
      'Network connections and DNS cache',
      'Security event log slices around the incident',
      'Defender Antivirus detections and quarantine metadata',
      'MDE sensor health and isolation state',
    ],
    guidance:[
      'Use when you need host-level evidence for containment, scoping, or handoff to forensics.',
      'Collect before destructive remediation so process, persistence, and sensor state are preserved.',
      'Do not treat the ZIP as a malware sandbox result; pair it with Timeline and Advanced hunting rows.',
    ],
  },
  'WKS-03': {
    status:'Collection in progress',
    collected:'2026-06-28T15:05:20Z',
    reason:'Unsigned look-alike scanner binary executed from a user-writable folder.',
    contents:[
      'Process execution history',
      'File metadata for scanner.exe and nearby artifacts',
      'Browser download and Mark-of-the-Web evidence',
      'Network connection summary',
      'Persistence locations',
    ],
    guidance:[
      'Use to validate whether the look-alike binary arrived through download, removable media, or lateral movement.',
      'Compare package artifacts with the Timeline technique markers before closing the incident.',
    ],
  },
};

const DEVICE_PROCESS_TREES = {
  'FIN-FS-02': [
    { depth:0, name:'services.exe', detail:'Service Control Manager' },
    { depth:1, name:'cmd.exe', detail:'cmd.exe /c copy \\\\WKS-03\\share\\locker.exe C:\\ProgramData\\locker.exe' },
    { depth:2, name:'locker.exe', detail:'locker.exe --encrypt --shares' },
    { depth:3, name:'vssadmin.exe', detail:'vssadmin delete shadows /all /quiet' },
    { depth:3, name:'wmic.exe', detail:'wmic shadowcopy delete' },
  ],
  'WKS-03': [
    { depth:0, name:'explorer.exe', detail:'Interactive shell for jdoe' },
    { depth:1, name:'scanner.exe', detail:'C:\\Users\\Public\\scanner.exe' },
    { depth:2, name:'rundll32.exe', detail:'Network beacon helper loaded after process start' },
  ],
};

// Per-device timeline. Mirrors the Defender for Endpoint device Timeline tab:
// two row kinds interleaved chronologically.
//   - kind='technique' : MITRE marker row (blue T icon). Side pane explains
//     that the related Advanced Hunting query returns the UNDERLYING events,
//     not this marker row itself.
//   - kind='event'     : a raw endpoint event (Process / Network / Logon /
//     File / Registry / Image-load). Carries the AttackTechniques column so
//     it joins back to the technique marker via techniqueId.
const DEVICE_TIMELINE_EVENTS = {
  'WKS-03': [
    { kind:'technique', time:'2026-06-28T15:00:20Z', techniqueId:'T1036',
      techniqueName:'Masquerading', tactic:'Defense Evasion',
      description:'Untrusted binary in C:\\Users\\Public named to look like a legitimate scanner. Detected from process execution + signer mismatch.' },
    { kind:'event', time:'2026-06-28T15:00:15Z', table:'DeviceImageLoadEvents', actionType:'ImageLoaded',
      title:'amsi.dll loaded by scanner.exe', description:'AMSI provider loaded into untrusted process — common precursor to AMSI-bypass attempts.',
      fileName:'amsi.dll', folder:'C:\\Windows\\System32\\amsi.dll', cmdline:'(loaded by scanner.exe)',
      account:'jdoe', techniqueId:'T1562', techniqueName:'Impair Defenses', eventType:'Image load' },
    { kind:'technique', time:'2026-06-28T15:00:12Z', techniqueId:'T1071',
      techniqueName:'Application Layer Protocol', tactic:'Command and Control',
      description:'Outbound HTTPS to a non-business reputation-scored host immediately after process launch.' },
    { kind:'event', time:'2026-06-28T15:00:08Z', table:'DeviceNetworkEvents', actionType:'ConnectionSuccess',
      title:'Outbound HTTPS connection from scanner.exe', description:'Connection to 185.199.111.12:443 (low-reputation).',
      fileName:'scanner.exe', folder:'C:\\Users\\Public\\scanner.exe', cmdline:'scanner.exe',
      account:'jdoe', remoteIP:'185.199.111.12', remotePort:443,
      techniqueId:'T1071', eventType:'Network' },
    { kind:'event', time:'2026-06-28T15:00:01Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'scanner.exe process created', description:'Parent: explorer.exe. Image path under C:\\Users\\Public.',
      fileName:'scanner.exe', folder:'C:\\Users\\Public\\scanner.exe', cmdline:'scanner.exe',
      account:'jdoe', sha256:ROGUE_HASH, techniqueId:'T1036', eventType:'Process' },
    { kind:'event', time:'2026-06-28T15:00:00Z', table:'DeviceLogonEvents', actionType:'LogonSuccess',
      title:'Interactive logon (jdoe)', description:'Local interactive logon after a failed attempt.',
      account:'jdoe', logonType:'Interactive', techniqueId:'T1078', eventType:'Logon' },
    { kind:'technique', time:'2026-06-28T14:59:55Z', techniqueId:'T1110',
      techniqueName:'Brute Force', tactic:'Credential Access',
      description:'Failed → successful logon pair on the same account within seconds.' },
    { kind:'event', time:'2026-06-28T14:59:48Z', table:'DeviceLogonEvents', actionType:'LogonFailed',
      title:'Interactive logon failed (jdoe)', description:'BadPassword on local console.',
      account:'jdoe', failureReason:'BadPassword', techniqueId:'T1110', eventType:'Logon' },
  ],
  'FIN-FS-02': [
    { kind:'technique', time:'2026-06-28T10:20:10Z', techniqueId:'T1490',
      techniqueName:'Inhibit System Recovery', tactic:'Impact',
      description:'Shadow-copy deletion immediately before mass file rename — classic ransomware staging.' },
    { kind:'event', time:'2026-06-28T10:20:04Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'vssadmin delete shadows /all /quiet', description:'Wipes Volume Shadow Copies so encrypted files cannot be restored locally.',
      fileName:'vssadmin.exe', folder:'C:\\Windows\\System32\\vssadmin.exe',
      cmdline:'vssadmin delete shadows /all /quiet', account:'fin-svc', flagged:true,
      techniqueId:'T1490', eventType:'Process' },
    { kind:'event', time:'2026-06-28T10:19:15Z', table:'DeviceEvents', actionType:'EDRClientResourceManagerCriticalMode',
      title:'EDR client entered resource-protection mode', description:'MsSense.exe Resource Manager reduced nonessential telemetry while ransomware containment completed.',
      fileName:'MsSense.exe', folder:'C:\\Program Files\\Windows Defender Advanced Threat Protection\\MsSense.exe',
      cmdline:'MsSense.exe ResourceManager CriticalMode', account:'SYSTEM',
      techniqueId:'T1486', eventType:'Sensor' },
    { kind:'technique', time:'2026-06-28T10:18:30Z', techniqueId:'T1486',
      techniqueName:'Data Encrypted for Impact', tactic:'Impact',
      description:'Mass file rename to .locked extension across mapped shares.' },
    { kind:'event', time:'2026-06-28T10:18:21Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'locker.exe --encrypt --shares', description:'Untrusted binary executed from C:\\ProgramData with encryption arguments.',
      fileName:'locker.exe', folder:'C:\\ProgramData\\locker.exe',
      cmdline:'locker.exe --encrypt --shares', account:'fin-svc', flagged:true,
      techniqueId:'T1486', eventType:'Process' },
    { kind:'technique', time:'2026-06-28T10:18:00Z', techniqueId:'T1021',
      techniqueName:'Remote Services', tactic:'Lateral Movement',
      description:'Remote-interactive logon from a workstation immediately preceded execution of unsigned binaries.' },
    { kind:'event', time:'2026-06-28T10:17:55Z', table:'DeviceLogonEvents', actionType:'LogonSuccess',
      title:'RemoteInteractive logon (fin-svc) from WKS-03', description:'Remote logon over RDP from operator workstation.',
      account:'fin-svc', logonType:'RemoteInteractive', remoteIP:'10.20.7.14',
      techniqueId:'T1021', eventType:'Logon' },
    { kind:'event', time:'2026-06-28T03:44:05Z', table:'DeviceLogonEvents', actionType:'LogonSuccess',
      title:'Network logon (svc-backup)', description:'Network logon from DC01 using Kerberos.',
      account:'svc-backup', logonType:'Network', remoteIP:'10.20.4.55',
      techniqueId:'T1078', eventType:'Logon' },
  ],
  'WKS-01': [
    { kind:'technique', time:'2026-06-28T14:00:20Z', techniqueId:'T1595',
      techniqueName:'Active Scanning', tactic:'Reconnaissance',
      description:'Repeated full-volume scan from an authorized vulnerability-scanner binary. Whitelisted via suppression rule.' },
    { kind:'event', time:'2026-06-28T14:00:11Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'scanner.exe --scan C:\\', description:'Post-update binary (SHA drifted from suppression rule).',
      fileName:'scanner.exe', folder:'C:\\Tools\\Scanner\\scanner.exe',
      cmdline:'scanner.exe --scan C:\\', account:'svc-scan', sha256:POST_UPDATE_HASH,
      techniqueId:'T1595', eventType:'Process' },
    { kind:'event', time:'2026-06-28T09:00:00Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'scanner.exe --scan C:\\ (pre-update)', description:'Pre-update binary, suppression rule still matched.',
      fileName:'scanner.exe', folder:'C:\\Tools\\Scanner\\scanner.exe',
      cmdline:'scanner.exe --scan C:\\', account:'svc-scan', sha256:KNOWN_GOOD_HASH,
      techniqueId:'T1595', eventType:'Process' },
  ],
  'WKS-02': [
    { kind:'technique', time:'2026-06-28T14:15:10Z', techniqueId:'T1595',
      techniqueName:'Active Scanning', tactic:'Reconnaissance',
      description:'Same scanner binary as WKS-01.' },
    { kind:'event', time:'2026-06-28T14:15:02Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'scanner.exe --scan D:\\', description:'Post-update binary on D-drive scan.',
      fileName:'scanner.exe', folder:'C:\\Tools\\Scanner\\scanner.exe',
      cmdline:'scanner.exe --scan D:\\', account:'svc-scan', sha256:POST_UPDATE_HASH,
      techniqueId:'T1595', eventType:'Process' },
    { kind:'event', time:'2026-06-28T09:05:00Z', table:'DeviceProcessEvents', actionType:'ProcessCreated',
      title:'scanner.exe --scan D:\\ (pre-update)', description:'Pre-update binary.',
      fileName:'scanner.exe', folder:'C:\\Tools\\Scanner\\scanner.exe',
      cmdline:'scanner.exe --scan D:\\', account:'svc-scan', sha256:KNOWN_GOOD_HASH,
      techniqueId:'T1595', eventType:'Process' },
  ],
  'DC01': [
    { kind:'technique', time:'2026-06-28T03:44:10Z', techniqueId:'T1003',
      techniqueName:'OS Credential Dumping', tactic:'Credential Access',
      description:'DCSync — directory replication from a non-DC account.' },
    { kind:'event', time:'2026-06-28T03:44:00Z', table:'DeviceEvents', actionType:'DirectoryServicesReplication',
      title:'Directory replication from svc-backup', description:'Replication request from 10.20.4.55 targeting DC01.',
      account:'svc-backup', target:'DC01.contoso.com', techniqueId:'T1003', eventType:'Directory' },
    { kind:'technique', time:'2026-06-28T03:42:10Z', techniqueId:'T1098',
      techniqueName:'Account Manipulation', tactic:'Persistence',
      description:'Modification of AdminSDHolder ACL — sticky-permission persistence on Tier-0 objects.' },
    { kind:'event', time:'2026-06-28T03:42:00Z', table:'DeviceEvents', actionType:'AdminSDHolderModification',
      title:'AdminSDHolder ACL modified', description:'svc-backup added DACL entry on AdminSDHolder.',
      account:'svc-backup', target:'CN=AdminSDHolder,CN=System,DC=contoso,DC=com',
      techniqueId:'T1098', eventType:'Directory' },
  ],
};

// ---------- Defender for Identity ↔ Defender XDR identity inventory ----------
// One row per security principal that MDI or AAD has on file. Mirrors the
// Defender portal Identities page: account type, sensitive/privileged flags,
// risk level, source connectors, organization-wide observation counts.
const IDENTITIES = [
  { id:'jane.doe@contoso.com', displayName:'Jane Doe', samName:'jane.doe',
    upn:'jane.doe@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1102',
    accountType:'User', department:'Finance', title:'Senior Analyst',
    riskLevel:'High', sensitive:false, privileged:false,
    sources:['Entra ID','Defender for Identity'],
    firstSeen:'2024-01-15T08:00:00Z', lastSeen:'2026-06-28T08:30:00Z',
    devicesSeen:3, openAlerts:2,
    notes:'Phishing victim. Granted OAuth consent to DocViewer Pro. AiTM cookie suspected.' },
  { id:'svc-backup@contoso.com', displayName:'svc-backup', samName:'svc-backup',
    upn:'svc-backup@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1144',
    accountType:'Service', department:'IT Operations', title:'Backup service account',
    riskLevel:'High', sensitive:true, privileged:true,
    sources:['Entra ID','Defender for Identity'],
    firstSeen:'2023-09-12T00:00:00Z', lastSeen:'2026-06-28T03:44:00Z',
    devicesSeen:2, openAlerts:2,
    notes:'Suspected compromised. Performed AdminSDHolder modification + DCSync.' },
  { id:'MSOL_AzureSync@contoso.com', displayName:'MSOL_AzureSync', samName:'MSOL_AzureSync',
    upn:'MSOL_AzureSync@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1206',
    accountType:'Service', department:'Entra Connect', title:'Directory synchronization (Entra Connect)',
    riskLevel:'Informational', sensitive:true, privileged:true,
    sources:['Entra ID','Defender for Identity'],
    firstSeen:'2023-08-01T00:00:00Z', lastSeen:'2026-06-28T15:00:00Z',
    devicesSeen:1, openAlerts:1,
    notes:'Entra Connect sync account. Directory replication is EXPECTED — Suspected DCSync alerts on this principal are a benign true positive when sourced from the Entra Connect server.' },
  { id:'sam.lee@contoso.com', displayName:'Sam Lee', samName:'sam.lee',
    upn:'sam.lee@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1203',
    accountType:'User', department:'Engineering', title:'Software engineer',
    riskLevel:'Medium', sensitive:false, privileged:false,
    sources:['Entra ID'],
    firstSeen:'2024-04-10T00:00:00Z', lastSeen:'2026-06-28T13:27:00Z',
    devicesSeen:2, openAlerts:1,
    notes:'Risky sign-in from NL (unfamiliar location).' },
  { id:'maria.ross@contoso.com', displayName:'Maria Ross', samName:'maria.ross',
    upn:'maria.ross@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1208',
    accountType:'User', department:'Sales', title:'Account executive',
    riskLevel:'High', sensitive:false, privileged:false,
    sources:['Entra ID','Defender for Identity'],
    firstSeen:'2024-02-20T00:00:00Z', lastSeen:'2026-06-28T06:40:00Z',
    devicesSeen:2, openAlerts:1,
    notes:'AiTM phishing detected — Entra ID Protection flagged High sign-in risk.' },
  { id:'jdoe@contoso.com', displayName:'jdoe (local)', samName:'jdoe',
    upn:'jdoe@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-1812',
    accountType:'User', department:'Sales', title:'Workstation user (WKS-03)',
    riskLevel:'Medium', sensitive:false, privileged:false,
    sources:['Defender for Identity','Defender for Endpoint'],
    firstSeen:'2025-11-08T12:14:00Z', lastSeen:'2026-06-28T15:00:00Z',
    devicesSeen:1, openAlerts:0,
    notes:'Local-interactive sign-ins on WKS-03 with one failed-then-success pair.' },
  { id:'fin-svc@contoso.com', displayName:'fin-svc', samName:'fin-svc',
    upn:'fin-svc@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-2207',
    accountType:'Service', department:'Finance', title:'Finance file-server service account',
    riskLevel:'High', sensitive:false, privileged:true,
    sources:['Entra ID','Defender for Identity'],
    firstSeen:'2024-09-01T00:00:00Z', lastSeen:'2026-06-28T10:20:00Z',
    devicesSeen:2, openAlerts:2,
    notes:'Used to launch locker.exe + vssadmin shadow-copy deletion on FIN-FS-02.' },
  { id:'krbtgt@contoso.com', displayName:'krbtgt', samName:'krbtgt',
    upn:'krbtgt@contoso.com', sid:'S-1-5-21-1180699209-877415012-3182924384-502',
    accountType:'Service', department:'Active Directory', title:'KDC service account',
    riskLevel:'Informational', sensitive:true, privileged:true,
    sources:['Defender for Identity'],
    firstSeen:'2023-08-01T00:00:00Z', lastSeen:'2026-06-25T00:00:00Z',
    devicesSeen:0, openAlerts:0,
    notes:'Tier-0 KDC account. Watched for Golden Ticket / password reset rotation.' },
];

// Per-identity timeline. Includes the canonical SC-200 MSOL_ DCSync scenario:
// a Suspected DCSync alert on MSOL_AzureSync originating from the Entra
// Connect server. Classification path: benign true positive (true detection,
// expected behavior). Pair with svc-backup's DCSync alert (true positive)
// so the analyst learns to distinguish by WHO + FROM WHERE.
const IDENTITY_TIMELINE = {
  'MSOL_AzureSync@contoso.com': [
    { kind:'alert', time:'2026-06-28T03:45:00Z', alertId:'A105',
      title:'Suspected DCSync attack (replication of directory services)',
      severity:'high', source:'Defender for Identity',
      description:'Directory replication initiated by MSOL_AzureSync from AAD-CONNECT-01.contoso.com targeting DC01.',
      classification:'Benign true positive',
      classificationWhy:'The MSOL_AzureSync account is the Entra Connect directory-sync principal. Its job is to replicate AD objects to the cloud, so it WILL perform DRSGetNCChanges (DCSync) by design. The source host (AAD-CONNECT-01) is the registered Entra Connect server. The detection is accurate (a true DCSync occurred), but the activity is expected → classify as Benign true positive, not False positive (the behavior really happened) and not True positive (no adversary).',
      classifyNote:'Suppression rule scope: source computer = AAD-CONNECT-01, account = MSOL_*.' },
    { kind:'event', time:'2026-06-28T03:44:55Z', actionType:'DirectoryServicesReplication',
      title:'Directory replication from AAD-CONNECT-01', description:'MSOL_AzureSync replicated naming context DC=contoso,DC=com from DC01.',
      sourceHost:'AAD-CONNECT-01', target:'DC01.contoso.com', techniqueId:'T1003', techniqueName:'OS Credential Dumping' },
    { kind:'event', time:'2026-06-28T03:44:50Z', actionType:'LogonSuccess',
      title:'Network logon (MSOL_AzureSync) on DC01', description:'Kerberos network logon from AAD-CONNECT-01 (10.20.6.20).',
      sourceHost:'AAD-CONNECT-01', target:'DC01.contoso.com', techniqueId:'T1078', techniqueName:'Valid Accounts' },
  ],
  'svc-backup@contoso.com': [
    { kind:'alert', time:'2026-06-28T03:44:00Z', alertId:'A102',
      title:'Suspected DCSync attack (replication of directory services)',
      severity:'high', source:'Defender for Identity',
      description:'Directory replication initiated by svc-backup from a non-domain-controller member server (10.20.4.55) targeting DC01. svc-backup is a tape-backup service principal with no legitimate replication role.',
      classification:'True positive',
      classificationWhy:'svc-backup has no business reason to perform DRSGetNCChanges. The source host is not a registered Entra Connect server. This is a real adversary action (likely credential dumping via Mimikatz lsadump::dcsync). Classify as True positive and start a containment workflow: reset svc-backup password + KRBTGT twice, isolate 10.20.4.55, hunt for tooling artifacts.',
      classifyNote:'Compare to the MSOL_AzureSync DCSync alert (A105) — same alert, different verdict because of WHO is replicating and FROM WHERE.' },
    { kind:'alert', time:'2026-06-28T03:42:00Z', alertId:'A101',
      title:'Possible AdminSDHolder modification',
      severity:'high', source:'Defender for Identity',
      description:'svc-backup added a DACL entry on CN=AdminSDHolder,CN=System,DC=contoso,DC=com — sticky-permission persistence on every Tier-0 object.',
      classification:'True positive',
      classificationWhy:'AdminSDHolder ACL writes are extremely rare in normal operations and are a textbook persistence technique (T1098). Classify as True positive and revert the ACL.' },
    { kind:'event', time:'2026-06-28T03:44:00Z', actionType:'DirectoryServicesReplication',
      title:'Directory replication request from svc-backup', description:'Replication request from 10.20.4.55 (file-server subnet) — not a domain controller and not Entra Connect.',
      sourceHost:'10.20.4.55', target:'DC01.contoso.com', techniqueId:'T1003', techniqueName:'OS Credential Dumping' },
  ],
  'jane.doe@contoso.com': [
    { kind:'alert', time:'2026-06-28T08:23:00Z', alertId:'A202',
      title:'Anomalous OAuth consent grant', severity:'medium', source:'Defender for Cloud Apps',
      description:'OAuth consent granted to DocViewer Pro with Mail.ReadWrite + Files.Read.All. Consent followed a click on a known phishing URL.',
      classification:'True positive',
      classificationWhy:'Broad mail+files scopes from an unverified publisher consented to immediately after a phishing click is the textbook AiTM-then-OAuth pattern. Revoke consent, sign-out all sessions, force MFA re-registration.' },
    { kind:'alert', time:'2026-06-28T08:11:00Z', alertId:'A201',
      title:'User compromised through phishing email with malicious URL',
      severity:'high', source:'Defender for Office 365',
      description:'Jane clicked secure-document-portal[.]xyz from a phishing email.',
      classification:'True positive', classificationWhy:'Confirmed click on a malicious URL; chain continues into the OAuth consent alert above.' },
    { kind:'event', time:'2026-06-28T08:12:00Z', actionType:'SignInSuccess',
      title:'Sign-in success from 76.21.55.4 (US)', description:'Token issued for Office365, MFA prompt satisfied — likely AiTM cookie replay.',
      techniqueId:'T1078', techniqueName:'Valid Accounts' },
  ],
  'maria.ross@contoso.com': [
    { kind:'alert', time:'2026-06-28T06:40:00Z', alertId:'A401',
      title:'Adversary-in-the-middle phishing session detected', severity:'high',
      source:'Entra ID Protection',
      description:'AiTM session token captured via reverse-proxy phishing kit. Push MFA satisfied by attacker.',
      classification:'True positive',
      classificationWhy:'AiTM bypasses traditional MFA. Containment: revoke refresh tokens, reset password, hunt for OAuth consent / mail-rule additions on her mailbox.' },
  ],
  'sam.lee@contoso.com': [
    { kind:'alert', time:'2026-06-28T13:27:00Z', alertId:'A601',
      title:'Risky sign-in from unfamiliar location', severity:'medium',
      source:'Entra ID Protection',
      description:'Sign-in from 91.219.236.54 (NL). Sam normally signs in from US.',
      classification:'Pending',
      classificationWhy:'Could be travel or VPN — verify with the user before classifying. If unconfirmed, treat as True positive and trigger CA risk-based remediation.' },
  ],
  'fin-svc@contoso.com': [
    { kind:'alert', time:'2026-06-28T10:18:30Z', alertId:'A301',
      title:'Multiple endpoints encrypted by suspected ransomware', severity:'high',
      source:'Defender for Endpoint',
      description:'fin-svc launched locker.exe across mapped shares on FIN-FS-02.',
      classification:'True positive',
      classificationWhy:'Service account performing impact-stage operations on a file server is never benign. Isolate FIN-FS-02, disable fin-svc, restore shares.' },
  ],
};

// MITRE matrix tactic ↔ technique lookup so the side pane can show a tactic
// pill even when the timeline row didn't pre-bake it.
const TECHNIQUE_TACTIC_LOOKUP = (() => {
  const map = {};
  if (typeof MITRE_ATTCK !== 'undefined') {
    MITRE_ATTCK.forEach(t => t.techniques.forEach(te => { if (!map[te.id]) map[te.id] = t.name; }));
  }
  return map;
})();

// Extend MOCK_QUERY_RESULTS so the prefilled "Hunt for related events" query
// returns the UNDERLYING event rows (not the technique marker), filtered by
// DeviceId + AttackTechniques. We only seed kind='event' rows.
(function seedDeviceEventFixtures() {
  const grouped = {};
  Object.entries(DEVICE_TIMELINE_EVENTS).forEach(([deviceId, rows]) => {
    rows.filter(r => r.kind === 'event').forEach(e => {
      const table = ['DeviceLogonEvents','DeviceNetworkEvents','DeviceFileEvents',
        'DeviceRegistryEvents','DeviceImageLoadEvents','DeviceProcessEvents'].includes(e.table)
        ? e.table : 'DeviceEvents';
      const row = {
        Timestamp: e.time,
        DeviceId: deviceId,
        DeviceName: deviceId,
        ActionType: e.actionType,
        FileName: e.fileName || '',
        FolderPath: e.folder || '',
        ProcessCommandLine: e.cmdline || '',
        AccountName: e.account || '',
        AttackTechniques: e.techniqueId,
      };
      if (e.remoteIP) row.RemoteIP = e.remoteIP;
      if (e.remotePort) row.RemotePort = e.remotePort;
      if (e.logonType) row.LogonType = e.logonType;
      if (e.failureReason) row.FailureReason = e.failureReason;
      if (e.target) row.Target = e.target;
      (grouped[table] = grouped[table] || []).push(row);
    });
  });
  Object.entries(grouped).forEach(([table, rows]) => {
    if (!MOCK_QUERY_RESULTS[table]) MOCK_QUERY_RESULTS[table] = [];
    rows.forEach(r => MOCK_QUERY_RESULTS[table].push(r));
  });
})();

// === local-tasks fixtures (auto-merged by integrate.py — do not hand-edit between markers) ===
// --- T01: out/t01-copilot-sessions.js ---
const COPILOT_SESSIONS = [
  { id: 'cs-001', name: 'Phishing wave triage - finance dept', owner: 'R. Vance', workspace: 'Primary', lastActivity: '2026-06-28T14:02:00Z', promptCount: 9, plugins: [ 'Defender XDR', 'MDTI' ], pinned: true },
  { id: 'cs-002', name: 'Ransomware indicator in SIEM alerts', owner: 'M. Okafor', workspace: 'SOC-EU', lastActivity: '2026-06-30T15:45:00Z', promptCount: 7, plugins: [ 'Defender XDR' ], pinned: false },
  { id: 'cs-003', name: 'OAuth app misuse event timeline', owner: 'L. Harper', workspace: 'Primary', lastActivity: '2026-06-29T14:58:00Z', promptCount: 5, plugins: [ 'Defender XDR', 'MDTI' ], pinned: true },
  { id: 'cs-004', name: 'DLP alert - potential employee data exfiltration', owner: 'T. Martinez', workspace: 'Primary', lastActivity: '2026-06-27T15:30:00Z', promptCount: 11, plugins: [ 'MDTI' ], pinned: true },
  { id: 'cs-005', name: 'Vulnerability scan prioritization - high risk', owner: 'E. Silva', workspace: 'Primary', lastActivity: '2026-06-30T17:40:00Z', promptCount: 8, plugins: [ 'Defender XDR', 'Sentinel' ], pinned: false },
  { id: 'cs-006', name: 'Incident summary for C-suite: ransomware containment', owner: 'C. Williams', workspace: 'Primary', lastActivity: '2026-06-29T16:58:00Z', promptCount: 6, plugins: [ 'Defender XDR' ], pinned: false },
  { id: 'cs-007', name: 'TI analysis - suspicious DNS traffic', owner: 'J. Patel', workspace: 'Primary', lastActivity: '2026-06-30T14:25:00Z', promptCount: 3, plugins: [ 'Intune' ], pinned: true },
  { id: 'cs-008', name: 'Risk matrix for recent sign-ins - SOC report', owner: 'K. Kim', workspace: 'SOC-EU', lastActivity: '2026-06-31T17:59:00Z', promptCount: 4, plugins: [ 'Sentinel' ], pinned: true }
];

// --- T02: out/t02-copilot-transcripts.js ---
const COPILOT_TRANSCRIPTS = [
{
    sessionId: 'cs-001',
    steps: [
        { role: 'analyst', text: 'Reviewing the incident details of A123. This is a suspected phishing attack.', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The summary shows an email campaign targeting employees with a phishing link. 90% open rate, 25% click-through to payload delivery page.', plugin: 'Defender XDR', pinned: false },
        { role: 'analyst', text: 'Which users clicked the malicious link?', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The list of affected users includes R. Vance and M. Okafor.', plugin: 'Defender XDR', pinned: false },
        { role: 'analyst', text: 'What are the recommended actions?', plugin: 'none', pinned: true }
    ]
},
{
    sessionId: 'cs-003',
    steps: [
        { role: 'analyst', text: 'Analyzing a suspicious PowerShell command pasted by the analyst.', plugin: 'MDTI', pinned: true },
        { role: 'copilot', text: 'Providing context, this command decodes an encoded payload that appears to be a downloader script.', plugin: 'none', pinned: false },
        { role: 'analyst', text: 'Could you provide more related intel on the actor?', plugin: 'none', pinned: true },
        { role: 'copilot', text: 'The command was likely executed by an actor called Nickel Sleet, known for spear-phishing campaigns targeting financial institutions.', plugin: 'none', pinned: false },
        { role: 'analyst', text: 'Draft a summary with this information.', plugin: 'none', pinned: true }
    ]
}
];

// --- T03: out/t03-copilot-promptbooks.js ---
const COPILOT_PROMPTBOOKS = [
    {
        id: 'pb-01',
        name: 'Incident investigation',
        source: 'Microsoft',
        description: 'Step-by-step triage of an incident.',
        inputs: ['Incident ID'],
        prompts: ['Summarize incident <ID>', 'List impacted entities', 'List related alerts', 'Suggest response actions', 'Draft an executive summary']
    },
    {
        id: 'pb-02',
        name: 'Suspicious script analysis',
        source: 'Microsoft',
        description: 'Analyze suspicious scripts for potential threats.',
        inputs: [],
        prompts: ['Identify the purpose of <script>', 'Check against known malware patterns', 'Examine network activity related to <script>', 'Suggest next steps']
    },
    {
        id: 'pb-03',
        name: 'Threat actor profile',
        source: 'Microsoft',
        description: 'Develop a profile of the threat actor based on attack patterns.',
        inputs: ['Device name'],
        prompts: ['List recent activity by <device>', 'Identify common tactics and techniques used', 'Suggest potential motivations']
    },
    {
        id: 'pb-04',
        name: 'Vulnerability impact assessment',
        source: 'Microsoft',
        description: 'Assess the risk of a vulnerability exploit.',
        inputs: [],
        prompts: ['Describe the vulnerability', 'Estimate potential damage', 'Suggest remediation steps']
    },
    {
        id: 'pb-05',
        name: 'User compromise assessment',
        source: 'Microsoft',
        description: 'Evaluate the risk of user data breaches.',
        inputs: [],
        prompts: ['Identify potential access vectors', 'Determine impacted users and data', 'Suggest containment actions']
    },
    {
        id: 'pb-06',
        name: 'Email threat triage',
        source: 'Microsoft',
        description: 'Triage incoming emails for potential threats.',
        inputs: ['Incident ID'],
        prompts: ['Summarize email content <ID>', 'Check against known phishing patterns', 'Analyze sender behavior', 'Suggest actions']
    },
    {
        id: 'pb-07',
        name: 'Shift handoff summary',
        source: 'Custom',
        description: 'Compile a summary of ongoing incidents for oncoming analysts.',
        inputs: [],
        prompts: ['List unresolved incidents', 'Highlight key findings and issues', 'Provide recommendations']
    },
    {
        id: 'pb-08',
        name: 'Threat hunting playbook',
        source: 'Custom',
        description: 'Detailed steps for proactive threat hunting activities.',
        inputs: [],
        prompts: ['Outline objectives and scope', 'Describe detection criteria', 'Suggest initial actions']
    }
];

// --- T04: out/t04-copilot-plugins.js ---
const COPILOT_PLUGINS = [
    {
        id: 'pl-01',
        name: 'Microsoft Defender XDR - Endpoint Security Policies',
        category: 'First-party',
        status: 'On',
        description: 'Enforces security policies for endpoints.',
        setupNote: 'Configure policy sets in the Workspace.'
    },
    {
        id: 'pl-02',
        name: 'Microsoft Sentinel - Data Connector to APM',
        category: 'First-party',
        status: 'On',
        description: 'Automatically correlates events from application performance monitoring.',
        setupNote: 'Integrate with the on-prem SIEM.'
    },
    {
        id: 'pl-03',
        name: 'Microsoft Entra - Conditional Access Policy',
        category: 'First-party',
        status: 'On',
        description: 'Enforces access rules for cloud resources.',
        setupNote: 'Configure policy in Microsoft Entra ID.'
    },
    {
        id: 'pl-04',
        name: 'Microsoft Intune - Device Management',
        category: 'First-party',
        status: 'On',
        description: 'Manages company-owned and personal devices.',
        setupNote: 'Set up managed devices via the portal.'
    },
    {
        id: 'pl-05',
        name: 'Microsoft Defender Threat Intelligence - Real-Time Indicators',
        category: 'First-party',
        status: 'Off',
        description: 'Provides real-time cyber threat intelligence.',
        setupNote: 'Enable in the workspace and manage threats.'
    },
    {
        id: 'pl-06',
        name: 'Microsoft Purview - Information Protection Policies',
        category: 'First-party',
        status: 'On',
        description: 'Protects sensitive data in documents and emails.',
        setupNote: 'Create policies for email and file shares.'
    },
    {
        id: 'pl-07',
        name: 'Azure Firewall - Network Security Policy',
        category: 'First-party',
        status: 'On',
        description: 'Secures network traffic flow.',
        setupNote: 'Configure firewall rules in the Azure portal.'
    },
    {
        id: 'pl-08',
        name: 'NetScope CASB - Cloud Security Risk Policy',
        category: 'Non-Microsoft',
        status: 'Off',
        description: 'Monitors and manages cloud security risks.',
        setupNote: 'Integrate with NetScope platform.'
    },
    {
        id: 'pl-09',
        name: 'ComplySoft Compliance Manager - Audit Policies',
        category: 'Non-Microsoft',
        status: 'Off',
        description: 'Enforces compliance of cloud applications.',
        setupNote: 'Configure policies for SaaS apps.'
    },
    {
        id: 'pl-10',
        name: 'KQL Debugger - Query Optimization Tool',
        category: 'Custom',
        status: 'On',
        description: 'Optimizes Kusto queries for performance.',
        setupNote: 'Requires Node.js environment.'
    },
    {
        id: 'pl-11',
        name: 'Azure API Manager - Gateway Management Tool',
        category: 'Custom',
        status: 'Off',
        description: 'Manages and secures APIs.',
        setupNote: 'Configure in the Azure portal.'
    },
    {
        id: 'pl-12',
        name: 'ChatGPT Prompt Engine - Interactive Assistance Tool',
        category: 'Custom',
        status: 'On',
        description: 'Provides interactive Q&A support for analysts.',
        setupNote: 'No additional setup required.'
    }
];

// --- T05: out/t05-copilot-capacity.js ---
const COPILOT_USAGE = [
  { date: '2026-06-15', unitsUsed: 4.9, sessions: 7 },
  { date: '2026-06-16', unitsUsed: 4.8, sessions: 6 },
  { date: '2026-06-17', unitsUsed: 4.3, sessions: 5 },
  { date: '2026-06-18', unitsUsed: 4.5, sessions: 5 },
  { date: '2026-06-19', unitsUsed: 4.2, sessions: 4 },
  { date: '2026-06-20', unitsUsed: 3.8, sessions: 6 },
  { date: '2026-06-21', unitsUsed: 3.9, sessions: 6 },
  { date: '2026-06-22', unitsUsed: 4.7, sessions: 8 },
  { date: '2026-06-23', unitsUsed: 5.1, sessions: 9 },
  { date: '2026-06-24', unitsUsed: 4.7, sessions: 8 },
  { date: '2026-06-25', unitsUsed: 4.3, sessions: 7 },
  { date: '2026-06-26', unitsUsed: 3.9, sessions: 6 },
  { date: '2026-06-27', unitsUsed: 4.1, sessions: 7 },
  { date: '2026-06-28', unitsUsed: 3.5, sessions: 5 }
];

const COPILOT_CAPACITY = {
  provisionedSCU: 6,
  overageAllowed: true,
  region: 'Europe',
  owners: ['R. Vance', 'M. Okafor']
};

// --- T06: out/t06-tvm.js ---
const TVM_SOFTWARE = [
  { id: 'sw-01', name: 'CodeGenius', vendor: 'TechNova', version: '5.2.3', weaknesses: 4, exposedDevices: 7, threatInsight: 'Exploit available' },
  { id: 'sw-02', name: 'DataMaster Pro', vendor: 'InfoForge', version: '2.8.1', weaknesses: 6, exposedDevices: 12, threatInsight: 'Active alert' },
  { id: 'sw-03', name: 'OfficeSuite Premium', vendor: 'OffiSys', version: '4.5.0', weaknesses: 2, exposedDevices: 28, threatInsight: 'None' },
  { id: 'sw-04', name: 'CryptoSecure', vendor: 'SecuroTech', version: '1.9.3', weaknesses: 7, exposedDevices: 6, threatInsight: 'Exploit available' },
  { id: 'sw-05', name: 'VideoEditor Suite', vendor: 'Vidsoft', version: '3.2.2', weaknesses: 1, exposedDevices: 34, threatInsight: 'Active alert' },
  { id: 'sw-06', name: 'PDFXpert Pro', vendor: 'DocuMaster', version: '3.7', weaknesses: 8, exposedDevices: 21, threatInsight: 'Exploit available' },
  { id: 'sw-07', name: 'ImageMagick Pro', vendor: 'ImagoSys', version: '6.5.4', weaknesses: 3, exposedDevices: 9, threatInsight: 'None' },
  { id: 'sw-08', name: 'AudioMaster XL', vendor: 'Sonicscape', version: '1.2.1', weaknesses: 3, exposedDevices: 6, threatInsight: 'Exploit available' },
  { id: 'sw-09', name: 'SecuritySuite Pro', vendor: 'SecuTech', version: '4.1.5', weaknesses: 6, exposedDevices: 2, threatInsight: 'None' },
  { id: 'sw-10', name: 'DataFlow X', vendor: 'BitStream', version: '3.8', weaknesses: 9, exposedDevices: 14, threatInsight: 'Active alert' }
];

const TVM_CVES = [
  { id: 'cv-01', cve: 'CVE-2026-9001', severity: 'Critical', cvss: 8.5, software: 'CodeGenius', exploitAvailable: true, exposedDevices: 4 },
  { id: 'cv-02', cve: 'CVE-2026-9003', severity: 'High', cvss: 7.1, software: 'DataMaster Pro', exploitAvailable: false, exposedDevices: 10 },
  { id: 'cv-03', cve: 'CVE-2026-9005', severity: 'Critical', cvss: 8.8, software: 'OfficeSuite Premium', exploitAvailable: true, exposedDevices: 35 },
  { id: 'cv-04', cve: 'CVE-2026-9007', severity: 'Medium', cvss: 5.3, software: 'CryptoSecure', exploitAvailable: false, exposedDevices: 8 },
  { id: 'cv-05', cve: 'CVE-2026-9009', severity: 'Critical', cvss: 9.4, software: 'VideoEditor Suite', exploitAvailable: true, exposedDevices: 30 },
  { id: 'cv-06', cve: 'CVE-2026-9011', severity: 'High', cvss: 7.8, software: 'PDFXpert Pro', exploitAvailable: false, exposedDevices: 25 },
  { id: 'cv-07', cve: 'CVE-2026-9013', severity: 'Low', cvss: 2.4, software: 'ImageMagick Pro', exploitAvailable: false, exposedDevices: 15 },
  { id: 'cv-08', cve: 'CVE-2026-9015', severity: 'Critical', cvss: 8.3, software: 'AudioMaster XL', exploitAvailable: true, exposedDevices: 6 },
  { id: 'cv-09', cve: 'CVE-2026-9017', severity: 'Medium', cvss: 5.7, software: 'SecuritySuite Pro', exploitAvailable: false, exposedDevices: 4 },
  { id: 'cv-10', cve: 'CVE-2026-9019', severity: 'Critical', cvss: 8.6, software: 'DataFlow X', exploitAvailable: true, exposedDevices: 18 },
  { id: 'cv-11', cve: 'CVE-2026-9021', severity: 'High', cvss: 7.6, software: 'OfficeSuite Premium', exploitAvailable: false, exposedDevices: 30 },
  { id: 'cv-12', cve: 'CVE-2026-9023', severity: 'Low', cvss: 4.5, software: 'CryptoSecure', exploitAvailable: true, exposedDevices: 7 }
];

const TVM_RECOMMENDATIONS = [
  { id: 'tr-01', title: 'Update CodeGenius to version 5.2.4', software: 'CodeGenius', exposedDevices: 6, impact: 8.2, status: 'Active' },
  { id: 'tr-02', title: 'Fix DataMaster Pro vulnerabilities', software: 'DataMaster Pro', exposedDevices: 12, impact: 5.9, status: 'Exception' },
  { id: 'tr-03', title: 'Update OfficeSuite Premium to latest version', software: 'OfficeSuite Premium', exposedDevices: 28, impact: 6.7, status: 'Active' },
  { id: 'tr-04', title: 'Upgrade CryptoSecure version', software: 'CryptoSecure', exposedDevices: 6, impact: 4.5, status: 'Completed' },
  { id: 'tr-05', title: 'Resolve VideoEditor Suite issues', software: 'VideoEditor Suite', exposedDevices: 34, impact: 9.1, status: 'Active' },
  { id: 'tr-06', title: 'Secure PDFXpert Pro', software: 'PDFXpert Pro', exposedDevices: 21, impact: 7.8, status: 'Exception' },
  { id: 'tr-07', title: 'Patch ImageMagick Pro', software: 'ImageMagick Pro', exposedDevices: 9, impact: 3.4, status: 'Completed' },
  { id: 'tr-08', title: 'Address AudioMaster XL flaws', software: 'AudioMaster XL', exposedDevices: 6, impact: 7.2, status: 'Active' }
];

// --- T07: out/t07-multicloud.js ---
const MC_CONNECTORS = [
  {
    id: 'connector-a-aaaa1111',
    cloud: 'AWS',
    accountId: '111122223333',
    plans: ['CSPM','Servers'],
    health: 'Healthy',
    lastSync: '2026-06-15T12:00:00.000Z'
  },
  {
    id: 'connector-b-bbbb2222',
    cloud: 'GCP',
    accountId: 'proj-aaaa1111',
    plans: ['Databases','Containers'],
    health: 'Warning',
    lastSync: '2026-06-14T18:30:00.000Z'
  }
];

const MC_RESOURCES = [
  {
    id: 'res-a-bbbb2222-7',
    cloud: 'GCP',
    type: 'Container cluster',
    name: 'nw-ops-cluster-8',
    region: 'europe-west3',
    riskLevel: 'High'
  },
  {
    id: 'res-b-aaaa1111-9',
    cloud: 'AWS',
    type: 'VM instance',
    name: 'nw-ops-vm-7',
    region: 'eu-west-1',
    riskLevel: 'Medium'
  },
  {
    id: 'res-c-bbbb2222-3',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-web-server-6',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-d-bbbb2222-4',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-backend-server-5',
    region: 'us-central1',
    riskLevel: 'None'
  },
  {
    id: 'res-e-bbbb2222-6',
    cloud: 'GCP',
    type: 'SQL database',
    name: 'nw-ops-user-database-10',
    region: 'europe-west3',
    riskLevel: 'High'
  },
  {
    id: 'res-f-bbbb2222-8',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-api-server-9',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-g-bbbb2222-0',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-data-store-3',
    region: 'us-central1',
    riskLevel: 'None'
  },
  {
    id: 'res-h-bbbb2222-1',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-frontend-server-4',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-i-bbbb2222-5',
    cloud: 'GCP',
    type: 'VM instance',
    name: 'nw-ops-auth-server-2',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-j-bbbb2222-2',
    cloud: 'GCP',
    type: 'Container cluster',
    name: 'nw-ops-k8s-cluster-0',
    region: 'europe-west3',
    riskLevel: 'Medium'
  },
  {
    id: 'res-k-bbbb2222-10',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-backup-store-7',
    region: 'us-central1',
    riskLevel: 'Low'
  },
  {
    id: 'res-l-bbbb2222-9',
    cloud: 'GCP',
    type: 'Storage bucket',
    name: 'nw-ops-media-store-8',
    region: 'us-central1',
    riskLevel: 'Low'
  }
];

const MC_ALERTS = [
  {
    id: 'alert-a-bbbb2222-5',
    cloud: 'GCP',
    title: 'Unusual access event on container cluster',
    severity: 'High',
    resource: 'nw-ops-k8s-cluster-0',
    description: 'An unexpected role was assumed by an identity in the container cluster, indicating potential misuse or unauthorized access.'
  },
  {
    id: 'alert-b-bbbb2222-3',
    cloud: 'AWS',
    title: 'Unsuccessful login attempts on keypair management service',
    severity: 'Medium',
    resource: 'nw-ops-vm-7',
    description: 'A series of failed sign-on attempts were detected, which could indicate a compromised key pair or brute-force attack.'
  }
];

// --- T08: out/t08-audit-premium.js ---
const AUDIT_RETENTION_POLICIES = [
    {
        id: 'arp-1',
        name: 'Daily Usage Tracking',
        users: ['R.Vance@northwindops.example','M.Okafor@northwindops.example'],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '30 days',
        priority: 1
    },
    {
        id: 'arp-2',
        name: 'Quarterly Data Review',
        users: ['M.Okafor@northwindops.example'],
        recordTypes: ['SharePointFileOperation','CopilotInteraction'],
        duration: '90 days',
        priority: 3
    },
    {
        id: 'arp-3',
        name: 'Full Year Audit',
        users: [],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '1 year',
        priority: 5
    },
    {
        id: 'arp-4',
        name: 'Annual Compliance Check',
        users: [],
        recordTypes: ['ExchangeItem','SharePointFileOperation','CopilotInteraction'],
        duration: '10 years',
        priority: 2
    },
    {
        id: 'arp-5',
        name: 'Special Project Audits',
        users: [],
        recordTypes: ['ExchangeItem'],
        duration: '365 days',
        priority: 4
    }
];

const AUDIT_COPILOT_EVENTS = [
    {
        time: '2026-06-01T09:15:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Generated a custom DLP policy for sensitive data.'
    },
    {
        time: '2026-06-15T14:30:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Word',
        detail: 'Saved draft document on OneDrive.'
    },
    {
        time: '2026-06-30T11:45:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Integrated Office 365 DLP policies with compliance features.'
    },
    {
        time: '2026-07-01T08:00:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Outlook',
        detail: 'Created a calendar event reminder for next month.'
    },
    {
        time: '2026-07-05T13:25:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Set up audit trails for all Office 365 tenants.'
    },
    {
        time: '2026-07-06T10:45:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Word',
        detail: 'Saved final draft for board presentation on OneDrive.'
    },
    {
        time: '2026-06-10T15:30:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Integrated DLP policies into compliance dashboards.'
    },
    {
        time: '2026-06-25T11:00:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Teams',
        detail: 'Prepared presentation slides for next meeting.'
    },
    {
        time: '2026-07-03T14:50:00.000Z',
        user: 'R.Vance@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'Outlook',
        detail: 'Set up reminders for upcoming board meetings.'
    },
    {
        time: '2026-07-04T09:35:00.000Z',
        user: 'M.Okafor@northwindops.example',
        operation: 'CopilotInteraction',
        workload: 'SecurityCopilot',
        detail: 'Reviewed DLP policy settings for new users.'
    }
];

// --- T09: out/t09-threat-explorer.js ---
const TX_EMAILS = [
    {
        id: 'tx-01',
        time: '2026-06-15T14:30:00Z',
        subject: 'Payment reminder - invoice 8912 overdue - action required',
        sender: 'northwind-payments.example.com',
        recipient: 'support@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-02',
        time: '2026-06-15T14:35:00Z',
        subject: 'URGENT: Invoice 9017 overdue - payment required by end of day',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-03',
        time: '2026-06-15T14:40:00Z',
        subject: 'Annual report 2025 - review the figures NOW',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Spam',
        threat: 'None',
        deliveryAction: 'Junked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-04',
        time: '2026-06-15T14:45:00Z',
        subject: 'Invoice 9123 overdue - payment essential today',
        sender: 'northwind-payments.example.com',
        recipient: 'finance@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-05',
        time: '2026-06-15T14:50:00Z',
        subject: 'Annual report 2025 - view online NOW for accuracy',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Spam',
        threat: 'None',
        deliveryAction: 'Junked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-06',
        time: '2026-06-16T14:30:00Z',
        subject: 'Upcoming payroll adjustments - update your details now',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-07',
        time: '2026-06-17T14:35:00Z',
        subject: 'Invoice 9184 overdue - payment required by end of day',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-08',
        time: '2026-06-17T14:40:00Z',
        subject: 'URGENT: Payment required - today only for invoice 9234',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-09',
        time: '2026-06-18T14:35:00Z',
        subject: 'URGENT: Payment due - invoice 9378 overdue by tomorrow',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-10',
        time: '2026-06-18T15:45:00Z',
        subject: 'Annual report 2025 - review now to avoid confusion',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-11',
        time: '2026-06-19T15:35:00Z',
        subject: 'Weekly payroll summary - check your earnings',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-12',
        time: '2026-06-19T15:40:00Z',
        subject: 'URGENT: Payment required - invoice 9765 overdue by EOD tomorrow',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Credential phishing',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-13',
        time: '2026-06-20T15:35:00Z',
        subject: 'Weekly payroll summary - check your earnings and benefits',
        sender: 'northwind-payrolls.example.com',
        recipient: 'hr@northwindops.example',
        verdict: 'Clean',
        threat: 'None',
        deliveryAction: 'Delivered',
        campaign: 'Payroll update lure'
    },
    {
        id: 'tx-14',
        time: '2026-06-22T15:35:00Z',
        subject: 'URGENT: Tax returns - file now online for credit on your 9765 invoice',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    },
    {
        id: 'tx-15',
        time: '2026-06-23T15:40:00Z',
        subject: 'URGENT: Tax returns - file now online for credit on invoice 9765',
        sender: 'northwind-payments.example.com',
        recipient: 'account@northwindops.example',
        verdict: 'Phish',
        threat: 'Financial fraud',
        deliveryAction: 'Blocked',
        campaign: 'Invoice lure June'
    }
];

// --- T10: out/t10-mssp-mto.js ---
const MSSP_TENANTS = [
  {
    id: 'tn-1',
    name: 'Northwind Trading Co.',
    workspaces: ['Workspace A'],
    delegatedRoles: ['Microsoft Sentinel Reader'],
    status: 'Active'
  },
  {
    id: 'tn-2',
    name: 'BlueHarbor Logistics Ltd.',
    workspaces: ['Workspace B', 'Workspace C'],
    delegatedRoles: ['Microsoft Sentinel Contributor', 'Microsoft Sentinel Responder'],
    status: 'Pending'
  },
  {
    id: 'tn-3',
    name: 'SeaShell Enterprises Inc.',
    workspaces: ['Workspace D'],
    delegatedRoles: ['Microsoft Sentinel Reader'],
    status: 'Active'
  },
  {
    id: 'tn-4',
    name: 'Albatross Shipping Corp.',
    workspaces: ['Workspace E'],
    delegatedRoles: ['Microsoft Sentinel Contributor'],
    status: 'Pending'
  }
];

const MTO_INCIDENTS = [
  {
    id: 'mti-01',
    tenant: 'Northwind Trading Co.',
    title: 'Alleged Data Exfiltration from Finance Group',
    severity: 'High',
    status: 'Resolved',
    assignedTo: 'Alex Taylor'
  },
  {
    id: 'mti-02',
    tenant: 'Northwind Trading Co.',
    title: 'Suspicious Login from Uncommon IP',
    severity: 'Medium',
    status: 'In progress',
    assignedTo: 'M. Okafor'
  },
  {
    id: 'mti-03',
    tenant: 'BlueHarbor Logistics Ltd.',
    title: 'Potential Security Breach in Operations Warehouse',
    severity: 'High',
    status: 'Active',
    assignedTo: 'R. Vance'
  },
  {
    id: 'mti-04',
    tenant: 'BlueHarbor Logistics Ltd.',
    title: 'Failed Login Attempt from Internal Machine',
    severity: 'Low',
    status: 'Active',
    assignedTo: 'Unassigned'
  },
  {
    id: 'mti-05',
    tenant: 'SeaShell Enterprises Inc.',
    title: 'Repeated Attempts to Access Restricted Files',
    severity: 'Medium',
    status: 'Active',
    assignedTo: 'L. Higginbotham'
  },
  {
    id: 'mti-06',
    tenant: 'SeaShell Enterprises Inc.',
    title: 'Data Scrubbing Operation in Progress',
    severity: 'Informational',
    status: 'In progress',
    assignedTo: 'Unassigned'
  },
  {
    id: 'mti-07',
    tenant: 'Albatross Shipping Corp.',
    title: 'Multiple Suspicious Activities in Sales Department',
    severity: 'High',
    status: 'In progress',
    assignedTo: 'Z. Wang'
  },
  {
    id: 'mti-08',
    tenant: 'Albatross Shipping Corp.',
    title: 'Unrecognized User Access to Restricted Network Zone',
    severity: 'Medium',
    status: 'Active',
    assignedTo: 'V. Patel'
  }
];

// --- T12: out/t12-knowledge.js ---
const COPILOT_KNOWLEDGE = [
  { id:'kb-1', name:'HR policies', type:'File upload', items:14, status:'Ready', scope:'IRM analysts', addedBy:'M. Okafor' },
  { id:'kb-2', name:'IR runbooks', type:'File upload', items:22, status:'Ready', scope:'SOC all', addedBy:'R. Vance' },
  { id:'kb-3', name:'Asset register extract', type:'Search index', items:1830, status:'Ready', scope:'SOC all', addedBy:'R. Vance' },
  { id:'kb-4', name:'Network diagrams', type:'File upload', items:9, status:'Indexing', scope:'Tier 2 only', addedBy:'L. Harper' },
  { id:'kb-5', name:'Vendor risk notes', type:'Search index', items:412, status:'Ready', scope:'GRC team', addedBy:'M. Okafor' },
];
// === end local-tasks fixtures ===

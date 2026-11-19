/* Mission Next IT Help Desk simulator fixtures.
 * All people, domains, devices, logs, and tickets are fictional. This file is
 * deliberately separate from the shared platform catalogue so the Help Desk
 * environment can evolve without changing portal/content architecture. */

const HD_ORG = {
  name: 'Northstar Distribution Group',
  domain: 'northstar.example',
  netbios: 'NORTHSTAR',
  timezone: 'Eastern Time',
  departments: ['Human Resources', 'Finance', 'Operations', 'Information Technology', 'Cybersecurity', 'Executive Office', 'Logistics', 'Sales', 'Customer Service', 'Marketing', 'Front Desk'],
  supportTiers: [
    { tier:'Tier 1', owner:'Service Desk', scope:'Intake, identity verification, standard requests, endpoint and connectivity triage' },
    { tier:'Tier 2', owner:'Enterprise Support', scope:'Windows, Active Directory, Group Policy, servers, VPN, file and print services' },
    { tier:'Tier 3', owner:'Infrastructure / Security / App teams', scope:'Production changes, architecture, security incidents, vendor defects' },
  ],
  // Northstar SLA targets (Module 2's table). Only the Enterprise Map shows
  // this list; the clock on a ticket is ui/helpdesk.js (HD_SN_SLA on matrix
  // tickets, hdSlaMinutes on older ones).
  slas: [
    { priority:'P1', response:'15 minutes', resolve:'4 hours', tell:'Service Desk lead immediately; Major Incident process' },
    { priority:'P2', response:'30 minutes', resolve:'8 hours', tell:'Team lead if 50% of SLA used with no plan' },
    { priority:'P3', response:'4 business hours', resolve:'2 business days', tell:'—' },
    { priority:'P4', response:'1 business day', resolve:'5 business days', tell:'—' },
    { priority:'P5', response:'2 business days', resolve:'By agreement', tell:'—' },
  ],
};

// employeeId: the ID on each person's directory record (KB-0024 checks it
// when verifying a caller). Synthetic, like everything in this file.
const HD_USERS = [
  { id:'u-1001', employeeId:'E-30418', phone:'ext. 4102', name:'Maya Chen', username:'mchen', email:'maya.chen@northstar.example', department:'Operations', title:'Operations Analyst', ou:'OU=Operations,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:18, groups:['GG-Operations-Users','GG-ERP-Operations'], manager:'Caleb Wright', mfa:'Registered' },
  { id:'u-1002', employeeId:'E-31207', phone:'ext. 4210', name:'Elena Ruiz', username:'eruiz', email:'elena.ruiz@northstar.example', department:'Logistics', title:'Logistics Coordinator', ou:'OU=Logistics,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:42, groups:['GG-Logistics-Users','GG-Warehouse-Print'], manager:'Monica Hall', mfa:'Registered' },
  { id:'u-1003', employeeId:'E-32655', phone:'ext. 4318', name:'Noah Williams', username:'nwilliams', email:'noah.williams@northstar.example', department:'Sales', title:'Account Executive', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:7, groups:['GG-Sales-Users','GG-CRM-Users'], manager:'Tara Singh', mfa:'Registered' },
  { id:'u-1004', employeeId:'E-33091', phone:'ext. 4426', name:'Priya Shah', username:'pshah', email:'priya.shah@northstar.example', department:'Human Resources', title:'HR Generalist', ou:'OU=Human Resources,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:61, groups:['GG-HR-Users','GG-HR-Readers'], manager:'Owen Brooks', mfa:'Registered' },
  { id:'u-1005', employeeId:'E-34172', phone:'ext. 4417', name:'Jordan Bell', username:'jbell', email:'jordan.bell@northstar.example', department:'Finance', title:'Financial Analyst', ou:'OU=Finance,OU=Users,DC=northstar,DC=example', enabled:true, locked:true, passwordAge:3, groups:['GG-Finance-Users','GG-Finance-Contributors'], manager:'Ava Robinson', mfa:'Registered' },
  { id:'u-1006', employeeId:'E-35540', phone:'ext. 4534', name:'Grace Kim', username:'gkim', email:'grace.kim@northstar.example', department:'Human Resources', title:'Recruiting Coordinator', ou:'OU=Human Resources,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:23, groups:['GG-HR-Users'], manager:'Owen Brooks', mfa:'Registered' },
  { id:'u-1007', employeeId:'E-36213', phone:'ext. 4642', name:'Luis Ortega', username:'lortega', email:'luis.ortega@northstar.example', department:'Sales', title:'Sales Development Rep', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:1, groups:['GG-Sales-Users','GG-CRM-Users'], manager:'Tara Singh', mfa:'Registered' },
  { id:'u-1008', employeeId:'E-37386', phone:'ext. 4750', name:'Sofia Martin', username:'smartin', email:'sofia.martin@northstar.example', department:'Operations', title:'Shift Supervisor', ou:'OU=Operations,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:12, groups:['GG-Operations-Users','GG-ERP-Operations'], manager:'Caleb Wright', mfa:'Registered' },
  { id:'u-1009', employeeId:'E-38024', phone:'ext. 4858', name:'Amir Patel', username:'apatel', email:'amir.patel@northstar.example', department:'Operations', title:'Inventory Planner', ou:'OU=Operations,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:29, groups:['GG-Operations-Users','GG-Operations-Drive'], manager:'Caleb Wright', mfa:'Registered' },
  { id:'u-1010', employeeId:'E-39167', phone:'ext. 4966', name:'Dina Foster', username:'dfoster', email:'dina.foster@northstar.example', department:'Executive Office', title:'Executive Assistant', ou:'OU=Executive Office,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:9, groups:['GG-Executive-Users'], manager:'Evelyn Reed', mfa:'Registered' },
  { id:'u-1011', employeeId:'E-40519', phone:'ext. 4174', name:'Evan Parker', username:'eparker', email:'evan.parker@northstar.example', department:'Finance', title:'Payroll Specialist', ou:'OU=Finance,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:34, groups:['GG-Finance-Users','GG-Payroll-Print'], manager:'Ava Robinson', mfa:'Registered' },
  { id:'u-1012', employeeId:'E-41733', phone:'ext. 4282', name:'Riley Morgan', username:'rmorgan', email:'riley.morgan@northstar.example', department:'Information Technology', title:'Service Desk Technician', ou:'OU=IT,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:15, groups:['GG-IT-Users','GG-ServiceDesk-T1'], manager:'Morgan Lee', mfa:'Registered' },
  { id:'u-1013', employeeId:'E-42856', phone:'ext. 4391', name:'Sam Rivera', username:'srivera', email:'sam.rivera@northstar.example', department:'Customer Service', title:'Customer Service Representative', ou:'OU=Customer Service,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:21, groups:['GG-CustomerService-Users'], manager:'Nadia Flores', mfa:'Registered' },
  { id:'u-1014', employeeId:'E-43190', phone:'ext. 4463', name:'Leah Brooks', username:'lbrooks', email:'leah.brooks@northstar.example', department:'Marketing', title:'Marketing Coordinator', ou:'OU=Marketing,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:96, groups:['GG-Marketing-Users'], manager:'Owen Price', mfa:'Registered' },
  { id:'u-1015', employeeId:'E-44027', phone:'ext. 4315', name:'Ravi Shah', username:'rshah', email:'ravi.shah@northstar.example', department:'Sales', title:'Account Manager', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:40, groups:['GG-Sales-Users','GG-CRM-Users'], manager:'Tara Singh', mfa:'Registered' },
  { id:'u-1016', employeeId:'E-45308', phone:'ext. 4501 · mobile 407-555-0142', name:'Martin Alvarez', username:'ralvarez', email:'martin.alvarez@northstar.example', department:'Executive Office', title:'Chief Financial Officer', ou:'OU=Executive Office,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:52, groups:['GG-Executive-Users','GG-Finance-Users'], manager:'Evelyn Reed', mfa:'Registered' },
  { id:'u-1017', employeeId:'E-46415', phone:'ext. 4687', name:'Hana Okafor', username:'hokafor', email:'hana.okafor@northstar.example', department:'Customer Service', title:'Customer Service Representative', ou:'OU=Customer Service,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:33, groups:['GG-CustomerService-Users'], manager:'Nadia Flores', mfa:'Registered' },
  { id:'u-1018', employeeId:'E-47521', phone:'ext. 4325', name:'Omar Haddad', username:'ohaddad', email:'omar.haddad@northstar.example', department:'Sales', title:'Field Sales Manager', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:26, groups:['GG-Sales-Users','GG-CRM-Users'], manager:'Tara Singh', mfa:'Registered' },
  { id:'u-1019', employeeId:'E-48634', phone:'ext. 4326', name:'Nina Patel', username:'npatel', email:'nina.patel@northstar.example', department:'Sales', title:'Sales Assistant', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:2, groups:['GG-Sales-Users'], manager:'Omar Haddad', mfa:'Registered' },
  { id:'u-1020', employeeId:'E-49748', phone:'ext. 4472', name:'Marcus Lee', username:'mlee', email:'marcus.lee@northstar.example', department:'Marketing', title:'Marketing Specialist', ou:'OU=Marketing,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:57, groups:['GG-Marketing-Users'], manager:'Owen Price', mfa:'Registered' },
  { id:'u-1021', employeeId:'E-50862', phone:'ext. 4105', name:'Ines Calder', username:'icalder', email:'ines.calder@northstar.example', department:'Front Desk', title:'Receptionist', ou:'OU=Front Desk,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:19, groups:['GG-FrontDesk-Users'], manager:'Caleb Wright', mfa:'Registered' },
];

const HD_GROUPS = [
  { name:'GG-HR-Readers', scope:'Global', type:'Security', members:8, resource:'HR shared folder · Read' },
  { name:'GG-HR-Contributors', scope:'Global', type:'Security', members:4, resource:'HR shared folder · Modify' },
  { name:'GG-Finance-Contributors', scope:'Global', type:'Security', members:11, resource:'Finance shared folder · Modify' },
  { name:'GG-Operations-Drive', scope:'Global', type:'Security', members:35, resource:'Operations drive mapping' },
  { name:'GG-CRM-Users', scope:'Global', type:'Security', members:48, resource:'CRM application access' },
  { name:'GG-Payroll-Print', scope:'Global', type:'Security', members:6, resource:'Payroll secure printer' },
  { name:'DL-All-Staff', scope:'Universal', type:'Distribution', members:214, resource:'All-staff messaging' },
  { name:'GG-ServiceDesk-T1', scope:'Global', type:'Security', members:7, resource:'Delegated password reset and unlock' },
];

const HD_COMPUTERS = [
  { name:'NS-LT-0042', user:'Maya Chen', os:'Windows 11 Enterprise 24H2', ip:'10.20.10.42', ou:'OU=Operations,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'2 minutes ago', health:'Healthy' },
  { name:'NS-LT-0068', user:'Elena Ruiz', os:'Windows 11 Enterprise 24H2', ip:'10.20.30.68', ou:'OU=Logistics,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'4 minutes ago', health:'Driver warning' },
  { name:'NS-LT-0081', user:'Noah Williams', os:'Windows 11 Enterprise 23H2', ip:'10.20.40.81', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'6 minutes ago', health:'Profile warning' },
  { name:'NS-LT-0094', user:'Priya Shah', os:'Windows 11 Enterprise 24H2', ip:'169.254.44.19', ou:'OU=Human Resources,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Network warning' },
  { name:'NS-LT-0117', user:'Jordan Bell', os:'Windows 11 Enterprise 24H2', ip:'10.20.20.117', ou:'OU=Finance,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Account lockout source' },
  { name:'NS-LT-0131', user:'Sofia Martin', os:'Windows 11 Enterprise 24H2', ip:'10.20.10.131', ou:'CN=Computers', trust:'Broken', bitlocker:'Protected', lastSeen:'3 minutes ago', health:'Domain trust failed' },
  { name:'NS-LT-0145', user:'Amir Patel', os:'Windows 11 Enterprise 24H2', ip:'10.20.10.145', ou:'CN=Computers', trust:'Healthy', bitlocker:'Protected', lastSeen:'9 minutes ago', health:'Policy scope warning' },
  { name:'NS-WS-0204', user:'Dina Foster', os:'Windows 11 Enterprise 24H2', ip:'10.20.50.204', ou:'OU=Executive Office,OU=Workstations', trust:'Healthy', bitlocker:'Recovery', lastSeen:'18 minutes ago', health:'BitLocker recovery' },
  { name:'NS-LT-0215', user:'Ravi Shah', os:'Windows 11 Enterprise 24H2', ip:'10.20.40.215', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'12 minutes ago', health:'Healthy' },
  { name:'NS-LT-0188', user:'Hana Okafor', os:'Windows 11 Enterprise 24H2', ip:'10.20.60.188', ou:'OU=Customer Service,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'3 minutes ago', health:'Healthy' },
  { name:'NS-LT-0154', user:'Luis Ortega', os:'Windows 11 Enterprise 24H2', ip:'10.20.40.154', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'5 minutes ago', health:'Healthy' },
];

const HD_SERVERS = [
  { name:'NS-DC01', role:'Domain Controller · DNS', os:'Windows Server', ip:'10.20.0.10', status:'Online', cpu:'18%', memory:'46%', service:'AD DS / DNS healthy' },
  { name:'NS-DC02', role:'Domain Controller · DNS', os:'Windows Server', ip:'10.20.0.11', status:'Online', cpu:'14%', memory:'41%', service:'AD DS / DNS healthy' },
  { name:'NS-DHCP01', role:'DHCP Server', os:'Windows Server Core', ip:'10.20.0.20', status:'Online', cpu:'8%', memory:'31%', service:'Scope 78% utilized' },
  { name:'NS-FILE01', role:'File Server', os:'Windows Server', ip:'10.20.0.30', status:'Online', cpu:'22%', memory:'63%', service:'SMB healthy · Finance ACL warning' },
  { name:'NS-PRINT01', role:'Print Server', os:'Windows Server', ip:'10.20.0.40', status:'Degraded', cpu:'12%', memory:'39%', service:'Spooler stopped · driver fault' },
  { name:'NS-APP01', role:'Enterprise Application', os:'Windows Server Core', ip:'10.20.0.50', status:'Degraded', cpu:'27%', memory:'55%', service:'TLS certificate expired' },
];

const HD_DNS_RECORDS = [
  { name:'dc01', type:'A', value:'10.20.0.10', zone:'northstar.example', ttl:'3600', status:'Healthy' },
  { name:'dc02', type:'A', value:'10.20.0.11', zone:'northstar.example', ttl:'3600', status:'Healthy' },
  { name:'files', type:'A', value:'10.20.0.30', zone:'northstar.example', ttl:'3600', status:'Healthy' },
  { name:'print', type:'A', value:'10.20.0.40', zone:'northstar.example', ttl:'3600', status:'Healthy' },
  { name:'purchasing', type:'CNAME', value:'ns-app01.northstar.example', zone:'northstar.example', ttl:'300', status:'Healthy' },
  { name:'vpn', type:'A', value:'198.51.100.24', zone:'northstar.example', ttl:'300', status:'Healthy' },
  { name:'legacy-erp', type:'A', value:'10.20.0.77', zone:'northstar.example', ttl:'3600', status:'Stale' },
];

const HD_DHCP_SCOPES = [
  { name:'Corporate Clients', range:'10.20.10.50–10.20.10.240', vlan:'10', leased:162, free:29, utilization:'85%', status:'Active' },
  { name:'Finance', range:'10.20.20.50–10.20.20.180', vlan:'20', leased:94, free:37, utilization:'72%', status:'Active' },
  { name:'Warehouse', range:'10.20.30.50–10.20.30.220', vlan:'30', leased:133, free:38, utilization:'78%', status:'Active' },
  { name:'Guest Wi-Fi', range:'10.20.90.20–10.20.90.240', vlan:'90', leased:209, free:12, utilization:'95%', status:'Warning' },
];

const HD_PRINTERS = [
  { name:'NS-FIN-PRN01', server:'NS-PRINT01', location:'Finance · 3rd floor', driver:'Universal PCL 6 v4.2', queue:0, status:'Ready', group:'GG-Finance-Users' },
  { name:'NS-PAY-SECURE', server:'NS-PRINT01', location:'Payroll secure room', driver:'SecurePrint v7.1', queue:2, status:'Paused', group:'GG-Payroll-Print' },
  { name:'NS-WH-LABEL01', server:'NS-PRINT01', location:'Warehouse dock A', driver:'LabelPro 3.8', queue:17, status:'Error', group:'GG-Warehouse-Print' },
  { name:'NS-HR-MFP01', server:'NS-PRINT01', location:'HR · 2nd floor', driver:'Universal PCL 6 v4.2', queue:1, status:'Ready', group:'GG-HR-Users' },
  { name:'NS-CS-PRN02', server:'NS-PRINT01', location:'Customer Service · 1st floor', driver:'Universal PCL 6 v4.2', queue:0, status:'Ready', group:'GG-CustomerService-Users' },
];

const HD_GPOS = [
  { name:'Default Domain Policy', link:'northstar.example', scope:'Authenticated Users', status:'Enabled', version:'U:12 / C:18', purpose:'Password and account policy' },
  { name:'Workstation Security Baseline', link:'OU=Workstations', scope:'Domain Computers', status:'Enabled', version:'U:0 / C:44', purpose:'Firewall, Defender, lock screen, audit policy' },
  { name:'Operations Drive Mapping', link:'OU=Operations', scope:'GG-Operations-Drive', status:'Enabled', version:'U:9 / C:0', purpose:'Maps O: to \\NS-FILE01\Operations' },
  { name:'Finance Printer Deployment', link:'OU=Finance', scope:'GG-Finance-Users', status:'Enabled', version:'U:7 / C:0', purpose:'Deploys NS-FIN-PRN01' },
  { name:'Restrict Control Panel', link:'OU=Kiosk Devices', scope:'Kiosk Computers', status:'Enabled', version:'U:6 / C:2', purpose:'Removes unsupported configuration access' },
];

const HD_SECURITY_ALERTS = [
  { id:'SEC-401', severity:'High', user:'Luis Ortega', device:'NS-LT-0154', title:'Credential phishing reported', signal:'Lookalike sign-in page after shipping email', status:'Needs escalation', owner:'Unassigned' },
  { id:'SEC-402', severity:'High', user:'Noah Williams', device:'NS-LT-0081', title:'Unexpected MFA prompts', signal:'Three prompts and one unfamiliar sign-in', status:'Needs escalation', owner:'Cybersecurity' },
  { id:'SEC-403', severity:'Medium', user:'Jordan Bell', device:'NS-LT-0117', title:'Repeated account lockouts', signal:'Bad-password events from scheduled task', status:'Investigating', owner:'Service Desk' },
  { id:'SEC-404', severity:'Medium', user:'Elena Ruiz', device:'NS-LT-0068', title:'Endpoint protection disabled', signal:'Protection service stopped after driver install', status:'Investigating', owner:'Endpoint Team' },
];

const HD_KB_ARTICLES = [
  { id:'KB-0012', title:'Diagnose an APIPA address on Windows', category:'Networking', updated:'2026-08-02', audience:'Service Desk', summary:'Validate link state, DHCP reachability, conflicting adapters, and lease renewal before network escalation.' },
  { id:'KB-0024', title:'Account unlock, password reset and caller verification', category:'Identity', updated:'2026-11-09', audience:'Service Desk', summary:'1. Verify the caller before any account action (an unlock, a password reset or an access change): call them back on the phone number in the User Directory, never a number the caller gives you, and confirm their employee ID matches the directory record. A name and department are not verification. 2. Never ask for, type or write down a user\'s password, for any reason. 3. Forgotten password: once the caller is verified, send them to the self-service password reset page (linked on the sign-in screen) and stay on the line while they set a new one. The help desk never tells a user a password or sets one for them. 4. Locked account: once the caller is verified, unlock the account once, then ask the user to sign in slowly with Caps Lock off and confirm they are in. 5. If the lockout comes back within a day, escalate to Tier 2 to find its source. 6. Tier 2 only: find the lockout source. Event 4740 on a domain controller names the caller computer. Correct a stale stored credential there through the approved workflow: Set-ScheduledTask -TaskName <task> -User <DOMAIN\\user> (or schtasks /Change /TN <task> /RU <DOMAIN\\user>) opens a secure prompt on the user\'s own screen, where the user types their current password. Then unlock once and confirm no new 4740 after the task\'s next run. 7. A caller you can\'t verify (or who refuses the callback): make no account change. Log the ticket with Category Security › Suspicious request, set Caller to Unverified, and assign it to Security Operations (SOC) with the caller\'s exact words, number and time.' },
  { id:'KB-0031', title:'Mapped drive missing after device replacement', category:'Group Policy', updated:'2026-07-22', audience:'Tier 2', summary:'Check user groups, computer OU, policy scope, gpresult evidence, and token refresh.' },
  { id:'KB-0044', title:'Print queue triage without deleting evidence', category:'Printing', updated:'2026-08-06', audience:'Tier 1 / Tier 2', summary:'Isolate client, queue, driver, port, and device while preserving confidential jobs.' },
  { id:'KB-0050', title:'Security incident warm-handoff template', category:'Security', updated:'2026-08-12', audience:'All Support', summary:'Record facts, timestamps, indicators, user actions, containment, evidence locations, impact, and requested next action.' },
  { id:'KB-0071', title:'Damaged laptop: loaner and escalation', category:'Hardware', updated:'2026-11-15', audience:'Service Desk', summary:'Tier 1 does not repair hardware. 1. Collect the asset tag and what happened, such as a dropped laptop or a cracked screen (when, how, and whether the laptop still starts). 2. If any glass is loose or sharp, tell the user to stop using the laptop now. 3. Ask whether their files are saved somewhere other than the laptop. 4. Verify the user before handing over a loaner (KB-0024): call them back on the number in the User Directory and confirm their employee ID. 5. Offer a loaner so the user can keep working. 6. Escalate to Desktop Support (Tier 2) for repair or replacement, with everything you collected. Never promise a repair date: Desktop Support sets it.' },
  { id:'KB-0059', title:'Add a department printer to a user\'s laptop', category:'Hardware', updated:'2026-11-15', audience:'Service Desk', practiceOnly:true, keywords:'add printer · printer missing · printer not in list · team printer · department printer · add device · Settings › Printers & scanners · NS-CS-PRN02', summary:'Department printers are added on the user\'s laptop from Settings. No admin rights are needed. 1. Ask which printer the user needs and what they see when they try to print. 2. On the user\'s laptop, open Settings › Printers & scanners and select Add device. 3. Choose the printer by its name. The Customer Service printer is NS-CS-PRN02. 4. Ask the user to print a test page and confirm it printed. 5. If the printer isn\'t in the list, stop there and escalate to Desktop Support (Tier 2) with the laptop\'s asset tag and the printer\'s name. Never ask for the user\'s password or sign in as the user.' },
  { id:'KB-0062', title:'Calendar delegate access', category:'Messaging', updated:'2026-11-19', audience:'Service Desk', practiceOnly:true, keywords:'calendar delegate access · delegate · assistant · calendar · book meetings · see calendar · meeting invitations · Editor (delegate) · mailbox owner approval', summary:'Tier 1 may grant delegate access once the mailbox owner approves the request. 1. Confirm the person never had access. That makes it a request, not a fault. 2. Convert it to the catalog item "Calendar delegate access" with Requested for, Mailbox and Permission. 3. Wait for the mailbox owner\'s approval on the request. An approval made in the portal while signed in needs no callback. A request by phone, chat or email is verified with KB-0024 first. 4. Grant the permission asked for and no more. Editor (delegate) lets the delegate see the calendar and book meetings. 5. Ask the owner whether the delegate should also receive meeting invitations. 6. Tell both people it can take up to an hour to appear, then confirm with the delegate.' },
  { id:'KB-0063', title:'Several people in one area lose Wi-Fi', category:'Networking', updated:'2026-11-19', audience:'Service Desk', practiceOnly:true, keywords:'wifi · Wi-Fi · wifi no internet · no internet · wireless · several people · whole floor · whole area · same area · network cable · Wi-Fi down', summary:'1. Ask whether other people in the same area have the same problem, and whether desks on a network cable still work. 2. One person only: have them turn Wi-Fi off and on and restart the laptop. If it still fails, escalate to Desktop Support with the laptop\'s asset tag. 3. Several people in one area: the cause is the network, not the laptops. Link the tickets to one parent and escalate the parent to Network Operations with the area, the start time and the business impact. 4. Never restart network equipment yourself.' },
];

/* Practice scenario for HD-2101 (Module 1 Practice It). The evidence lives on
 * the tool screens, not on the ticket: the domain controller's 4740 events,
 * jbell's lockout details in Active Directory and NS-LT-0117's scheduled tasks
 * (read and changed through ui/helpdesk.js). Practice only: a Prove shift
 * never gets this state. Times are shift-clock times. */
const HD_PRACTICE_MACHINES = {
  // Hana Okafor's laptop (HD-2154): the Customer Service printer isn't added
  // yet; Settings › Printers & scanners › Add device adds it.
  'NS-LT-0188': { printers:['Microsoft Print to PDF'], pendingPolicyPrinters:[], localAdministrators:['NORTHSTAR\\Domain Admins','NS-LT-0188\\MNT-Support'], spooler:'Running' },
  'NS-LT-0117': {
    scheduledTasks: [
      { name:'FinanceReportSync', path:'\\Northstar\\Finance\\', runAs:'NORTHSTAR\\jbell', logonType:'Password (stored)', credentialChangedDaysAgo:90, credentialCurrent:false, trigger:'Daily at 07:00, repeats every 2 minutes', description:'Copies the morning finance report to \\\\NS-FILE01\\Finance\\Exports.', lastRun:'08:11:18', lastResult:'0x8007052E', state:'Ready' },
      { name:'Inventory Agent Check-in', path:'\\Northstar\\', runAs:'SYSTEM', logonType:'Service account', credentialChangedDaysAgo:null, credentialCurrent:true, trigger:'Every 4 hours', description:'Reports hardware inventory.', lastRun:'08:00:02', lastResult:'0x0', state:'Ready' },
      { name:'Endpoint Protection Scheduled Scan', path:'\\Northstar\\Security\\', runAs:'SYSTEM', logonType:'Service account', credentialChangedDaysAgo:null, credentialCurrent:true, trigger:'Daily at 12:30', description:'Quick scan.', lastRun:'Yesterday 12:30:00', lastResult:'0x0', state:'Ready' },
    ],
  },
};
const HD_PRACTICE_SCENARIOS = {
  'HD-2101': {
    userId:'u-1005', username:'jbell', computer:'NS-LT-0117', task:'FinanceReportSync', domainController:'NS-DC01',
    // The shift clock starts just after the latest lockout.
    clockStart:'08:12:00', runEveryMinutes:2,
    events:[
      { level:'Error', time:'07:49:06', source:'Security', id:'4740', computer:'NS-DC01', account:'jbell', caller:'NS-LT-0117', message:'Account jbell was locked out; caller computer NS-LT-0117.' },
      { level:'Information', time:'08:09:30', source:'Security', id:'4767', computer:'NS-DC01', account:'jbell', caller:'', message:'Account jbell was unlocked by NORTHSTAR\\rmorgan.' },
      { level:'Error', time:'08:11:18', source:'Security', id:'4740', computer:'NS-DC01', account:'jbell', caller:'NS-LT-0117', message:'Account jbell was locked out; caller computer NS-LT-0117.' },
    ],
    badPasswordCount:5, lockoutThreshold:5,
  },
};

function hdTicket(spec) {
  return {
    id:'', requester:'', department:'', category:'Incident', subcategory:'General',
    priority:'P3', businessImpact:'Single user', assignedTechnician:'Unassigned',
    sla:'2 business days', createdMinutesAgo:30, status:'New', notes:[],
    troubleshootingHistory:[], attachments:[], resolution:'', closureCode:'',
    symptoms:[], logs:[], systemState:[], plausibleCauses:[], correctPath:[],
    hiddenRootCause:'', expectedResolution:'', escalationCriteria:[], correlationKey:'',
    ...spec,
  };
}

// Practice sets: a module's unguided practice tickets (not graded), opened
// from its course page with ?practice=<key>&student=<id> (ui/helpdesk.js).
// Only these tickets, no coach, saved apart from the coached lab's shift.
const HD_PRACTICE_SETS = {
  'its-01': { title:'Module 1 practice tickets', tickets:['HD-2151', 'HD-2152', 'SEC-2153', 'HD-2154'] },
  // Module 2 Lab 2.2: Wednesday 13:00 on a fixed clock that "Next day" moves.
  'its-10': { title:'Module 2 practice tickets', tickets:['HD-2155', 'HD-2156', 'HD-2184', 'HD-2185', 'HD-2157'], complete:['HD-2155', 'HD-2156', 'HD-2157'], now:'2026-08-19T13:00:00Z', queue:true, queueList:'mine',
    nextDay:{ unlock:[{ ticket:'HD-2155', done:['converted', 'resolved', 'escalated'] }, { ticket:'HD-2156', done:['resolved', 'escalated'] }, { ticket:'HD-2157', attempts:2 }] } },
};

// Coached ticket sets: Practice It content for a coach's guided lab, opened by
// the coach (not from a course page link). The work order groups are a
// practice answer for the guided lab, not a Prove It key.
const HD_COACHED_SETS = {
  'its-10-guided': { title:'Lab 2.1 · Guided Lab: queue shift', tickets:['HD-2158', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2162', 'SR-2161'], now:'2026-08-18T08:35:00Z', queue:true,
    workOrder:{ tickets:['HD-2158', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2162', 'SR-2161'], groups:[['HD-2158'], ['HD-2159', 'HD-2160', 'SEC-2163'], ['HD-2162'], ['SR-2161']] } },
};

// Categories for the Module 2 queue tickets; each ticket adds its own CI list.
const HD_M02_CATEGORIES = {
  Software:['Phone app', 'Email', 'Browser'],
  Network:['Wi-Fi', 'VPN', 'Wired port'],
  Security:['Suspicious email', 'Suspicious sign-in', 'Lost device'],
  Hardware:['Mouse', 'Monitor', 'Keyboard', 'Laptop'],
  Request:['Hardware', 'Software', 'Access'],
  Access:['Password reset', 'Account unlock'],
  Printing:['Printer queue', 'Badge printer'],
};

const HD_TICKET_TEMPLATES = [
  hdTicket({ id:'HD-2101', requester:'Jordan Bell', department:'Finance', category:'Incident', subcategory:'Account lockout', priority:'P2', businessImpact:'Payroll analyst blocked', sla:'8 hours', createdMinutesAgo:86, description:'My account unlocks, then locks again a few minutes later.', symptoms:['Lockout repeats after successful sign-in','Other Finance users unaffected'], logs:[], systemState:['Account enabled','Password changed 3 days ago','Service desk unlocked the account at 08:09; it locked again at 08:11'], plausibleCauses:['User typing old password','Mobile mail cache','Scheduled task credential'], correctPath:['Verify identity','Trace caller computer','Inspect stored credentials','Correct approved task credential','Unlock once and monitor'], hiddenRootCause:'Scheduled task FinanceReportSync stores the previous password.', expectedResolution:'Update the task through the approved service credential workflow, unlock the account, and verify no new 4740 event.', escalationCriteria:['Unknown lockout source across multiple devices','Signs of credential compromise'] }),
  // Module 1 Practice It, Guided Lab 1 (coach hd-m01): a verified unlock,
  // worked with the console features (ui/helpdesk.js). No commands.
  hdTicket({ id:'HD-2150', number:'INC0010150', requester:'Sam Rivera', department:'Customer Service', category:'Incident', subcategory:'Account lockout', priority:'P3', businessImpact:'One agent can\'t take calls from 09:00', sla:'2 business days', createdMinutesAgo:14,
    description:'I got locked out after typing my password wrong this morning. I have to be on the phones at 9.',
    symptoms:['Sign-in says the account is locked','Started this morning after several wrong password tries'], logs:[], systemState:['Account enabled','Password last changed 21 days ago'],
    plausibleCauses:['Too many wrong password tries','Account disabled','Password expired'], correctPath:['Verify the caller per KB-0024','Unlock the account once','Confirm the user can sign in','Tell the user what to do if it locks again','Document the ticket'],
    hiddenRootCause:'Too many wrong password tries this morning locked the account.',
    expectedResolution:'Verify Sam per KB-0024 (call back on the directory number and confirm the employee ID), unlock the account once, confirm Sam can sign in, and tell Sam to reply if it locks again today (a lockout that comes back goes to Tier 2 to find its source).',
    escalationCriteria:['The lockout comes back within a day: escalate to Tier 2 to find its source (KB-0024)','The caller can\'t be verified: make no change and route the ticket to Security Operations (KB-0024)'],
    console: {
      kb: true,
      caller: { name:'Sam Rivera', questions: [
        { id:'when', text:'When did this start?', reply:'This morning. I typed my password wrong a few times after the long weekend.' },
        { id:'changed', text:'Did anything change, like a new password or a new device?', reply:'No, I didn\'t change my password or anything else. I just typed it wrong.' },
        { id:'password', text:'What password did you type?', asksPassword:true },
        { id:'signin', text:'Please sign in again slowly, with Caps Lock off.', reply:'I\'m in, thank you!', replyLocked:'It still says my account is locked.', confirms:true },
      ] },
      account: { userId:'u-1013', locked:true },
      verification: { prompt:'Sam Rivera is on the phone asking you to unlock the account. How do you verify it\'s really Sam? (KB-0024)', options: [
        { id:'name', text:'Accept it: Sam gives their name and department', critical:true, feedback:'Critical error. Anyone can learn a name and a department. KB-0024: call Sam back on the number in the User Directory and confirm the employee ID.' },
        { id:'password', text:'Ask Sam for their current password so you can check it', critical:true, feedback:'Critical error. The help desk never asks for a password: not to check it, not for any reason (KB-0024).' },
        { id:'callback', text:'Call Sam back on the number in the User Directory and confirm their employee ID', pass:true, feedback:'Verified. You called Sam back on ext. 4391 from the User Directory, and Sam confirmed employee ID E-42856.', history:'Identity verified per KB-0024: called Sam back on the User Directory number (ext. 4391); employee ID E-42856 confirmed.' },
      ] },
      comments: { repeatLine: { label:'what to do if it happens again', pattern:'\\b(if|when|should)\\b[^.!?]{0,80}\\b(again|comes? back|returns?|repeats?|keeps happening)\\b', action:'\\b(reply|replies|call|ring|contact|email|message|let (us|me) know|get in touch|reach out|reopen)\\b' } },
      resolutionCode: { required:true },
      priorityReason:'P3: one person is affected, and a verified unlock is a quick, standard fix.',
      notes: { parts:['reported', 'tried', 'result'], jargon:['badPwdCount', 'lockout threshold', 'KB-0024', 'Active Directory', 'AD', 'domain controller', 'event 4740', 'Tier 2', 'srivera'] },
      resolveByOutcomes: true,
      simpleStates: true,
    } }),
  // Module 1 Practice It, unguided tickets 1-A to 1-C (not graded): opened
  // from the Module 1 page as a practice set (HD_PRACTICE_SETS, ?practice=).
  // Worked with the console features; "Check my work" gives feedback by the
  // spec's rubric areas, never points. Category and priority are pre-set.
  hdTicket({ id:'HD-2151', requester:'Leah Brooks', department:'Marketing', category:'Access', subcategory:'Password reset', priority:'P4', contactType:'Phone', businessImpact:'One person can\'t sign in; no deadline today', sla:'5 business days', createdMinutesAgo:9,
    description:'Hi, it\'s Leah Brooks in Marketing. I\'ve been on leave for two weeks and I can\'t remember my password at all. Can you just tell me what it is, or set it to something easy?',
    symptoms:['Back from two weeks\' leave','Can\'t remember the password'], logs:[], systemState:['Account enabled','Calling from her desk phone'],
    plausibleCauses:['Account locked out','Forgotten password: nothing is broken','Account disabled'], correctPath:['Identify: what happened and what changed','Search the KB by symptom words','Verify the caller per KB-0024','Guide the self-service reset','Confirm she can sign in','Document'],
    hiddenRootCause:'Leah forgot her password after two weeks off; nothing is broken.',
    expectedResolution:'Verify Leah per KB-0024 (callback on the directory number and her employee ID), explain that IT can\'t see or choose passwords, walk her to the self-service reset page and stay on the line until she signs in.',
    escalationCriteria:['The caller can\'t be verified: make no change and route the ticket to Security Operations (KB-0024)'],
    console: {
      kb: true,
      caller: { name:'Leah Brooks', questions: [
        { id:'what', text:'What happens when you try to sign in?', reply:'It says my password is wrong. I\'ve been away two weeks and I just can\'t remember it.' },
        { id:'changed', text:'Did anything change while you were away?', reply:'No, nothing. I just forgot it.' },
        { id:'password', text:'What password did you try?', asksPassword:true },
        { id:'signin', text:'Please sign in with your new password while I\'m on the line.', reply:'I\'m in. Thank you!', replyBefore:'I haven\'t set a new one yet.', afterAction:'reset-page', confirms:true },
      ] },
      verification: { prompt:'Leah Brooks is on the phone. How do you verify it\'s really Leah before you help with her password? (KB-0024)', options: [
        { id:'name', text:'Accept it: Leah gives her name and department', feedback:'Not verification. Anyone can learn a name and a department. KB-0024: call Leah back on her directory number and confirm her employee ID.' },
        { id:'callback', text:'Call Leah back on the number in the User Directory and confirm her employee ID', pass:true, feedback:'Verified. You called Leah back on ext. 4463 from the User Directory, and Leah confirmed employee ID E-43190.', history:'Identity verified per KB-0024: called Leah back on the User Directory number (ext. 4463); employee ID E-43190 confirmed.' },
        { id:'password', text:'Ask Leah for her old password so you can check it', critical:true, feedback:'Critical error. The help desk never asks for a password: not to check it, not for any reason (KB-0024).' },
      ] },
      actions: [
        { id:'tell', text:'Tell Leah what her password is', critical:true, feedback:'Critical error. IT can never see a user\'s password, so there is nothing to tell, and the help desk never shares one (KB-0024).' },
        { id:'set-easy', text:'Set an easy password for Leah and read it to her', critical:true, feedback:'Critical error. The help desk never sets a password for a user or says one out loud. The user sets it herself on the self-service reset page (KB-0024).' },
        { id:'reset-page', text:'Explain that IT can\'t see or choose passwords, and walk Leah to the self-service reset page while you stay on the line', pass:true, needsVerification:true, earlyCritical:'Helped before verifying the caller', earlyFeedback:'Critical error. Verify Leah before you help with her password (KB-0024): call her back on her directory number and confirm her employee ID.', feedback:'Leah is on the self-service reset page and sets a new password herself.', history:'Explained IT can\'t view or set passwords; guided the user through the self-service reset page per KB-0024.' },
      ],
      owner: { options: [
        { id:'servicedesk', text:'Service Desk keeps it: resolve at Tier 1', status:'Resolved', group:'Riley Morgan', code:'Solution provided', right:true, feedback:'Right owner: a known fix the Service Desk keeps.' },
        { id:'desktop', text:'Escalate to Desktop Support (Tier 2)', status:'Escalated', group:'Desktop Support', code:'Escalated', feedback:'Not the right owner: a forgotten password is a known fix the Service Desk keeps. Nothing needs Tier 2.' },
        { id:'soc', text:'Route to Security Operations (SOC): Category Security › Suspicious request, Caller Unverified', status:'Escalated', group:'Security Operations (SOC)', code:'Routed to Security Operations', category:'Security', subcategory:'Suspicious request', caller:'Unverified', feedback:'Not the right owner: Leah can be verified with a callback, so the Service Desk helps her. The SOC route is for a caller you can\'t verify.' },
      ] },
      comments: true,
      priorityReason:'P4: one person, no deadline today.',
      notes: { parts:['reported', 'tried', 'result'], nextAction:true, jargon:['KB-0024', 'Active Directory', 'AD', 'lbrooks', 'Tier 2'] },
      simpleStates: true,
      feedback: [
        { area:'Right owner', checks:[{ owner:true }], good:'A known fix the Service Desk keeps.', fix:'A forgotten password is a known fix the Service Desk keeps: resolve it at Tier 1.' },
        { area:'Investigation', checks:[{ kb:'KB-0024' }], good:'You found KB-0024 by searching symptom words.', fix:'Search the KB by symptom words (for example "forgot password") and open KB-0024.' },
        { area:'Diagnosis', checks:[{ diagnosis:true }], good:'A forgotten password: nothing is broken.', fix:'Look again: Leah forgot her password. Nothing on the account is broken.' },
        { area:'Action', checks:[{ verified:true }, { action:'reset-page' }, { confirmed:'signin' }], good:'You verified Leah first, she reset the password herself, and she signed in while you were on the line.', fix:'Verify Leah first (KB-0024), walk her to the self-service reset page, and stay on the line until she has signed in.' },
        { area:'Documentation', checks:[{ note:true }, { comment:true }], good:'A complete Reported / Tried / Result note, and a friendly comment in plain words.', fix:'Write a Reported / Tried / Result note and a friendly, plain-words comment for Leah.' },
      ],
    } }),
  hdTicket({ id:'HD-2152', requester:'Ravi Shah', department:'Sales', category:'Hardware', subcategory:'Laptop – damage', priority:'P3', contactType:'Email', ci:'NS-LT-0215', businessImpact:'Client demo on Thursday', sla:'2 business days', createdMinutesAgo:31,
    description:'Subject: dropped my laptop. I knocked my laptop off the desk and the screen is cracked across one corner. I can still see most of it. I have a client demo on Thursday. Can you fix it?',
    symptoms:['Screen cracked across one corner','Most of the screen still visible'], logs:[], systemState:['Laptop NS-LT-0215 assigned to Ravi Shah'],
    plausibleCauses:['Display driver fault','Physical damage: a Tier 2 repair','Screen brightness setting'], correctPath:['Identify: the four questions, safety first','Search the KB by symptom words','Verify Ravi before the loaner (KB-0071, KB-0024)','Offer a loaner','Escalate to Desktop Support with a full handoff','Tell Ravi what happens next','Document'],
    hiddenRootCause:'The laptop was dropped and the screen is physically damaged; Tier 1 doesn\'t repair hardware.',
    expectedResolution:'Per KB-0071: collect the asset tag and what happened, check for loose glass, verify Ravi (callback on his directory number and his employee ID, KB-0024), offer a loaner for the demo, and escalate to Desktop Support for repair or replacement with a full handoff. Don\'t promise a repair date.',
    escalationCriteria:['Physical damage: escalate to Desktop Support (Tier 2) per KB-0071'],
    console: {
      kb: true,
      caller: { name:'Ravi Shah', questions: [
        { id:'when', text:'When did it happen?', reply:'This morning, about an hour ago.' },
        { id:'starts', text:'Does the laptop still start?', reply:'Yes, it starts, and I can see most of the screen.' },
        { id:'glass', text:'Is any glass loose or sharp?', reply:'No. It\'s cracked across one corner, but nothing is loose.' },
        { id:'files', text:'Are your files saved somewhere other than the laptop?', reply:'Yes, everything is in OneDrive.' },
      ] },
      verification: { prompt:'Before you hand Ravi a loaner, KB-0071 says to verify him (KB-0024). How do you verify it\'s really Ravi?', options: [
        { id:'name', text:'Accept it: the email came from Ravi, and he gives his name and department', feedback:'Not verification. Anyone can learn a name and a department, and an email can come from someone else. KB-0024: call Ravi back on his directory number and confirm his employee ID.' },
        { id:'callback', text:'Call Ravi back on the number in the User Directory and confirm his employee ID', pass:true, feedback:'Verified. You called Ravi back on ext. 4315 from the User Directory, and Ravi confirmed employee ID E-44027.', history:'Identity verified per KB-0024: called Ravi back on the User Directory number (ext. 4315); employee ID E-44027 confirmed.' },
      ] },
      actions: [
        { id:'diy', text:'Tell Ravi how to take the screen off and replace it himself', critical:true, feedback:'Critical error. Tier 1 doesn\'t repair hardware, and a user should never open a damaged laptop (KB-0071).' },
        { id:'promise', text:'Promise Ravi the screen will be fixed by Wednesday', critical:true, feedback:'Critical error. Never promise a repair date Tier 1 can\'t control: Desktop Support sets it (KB-0071).' },
        { id:'loaner', text:'Offer Ravi a loaner laptop he can collect today', pass:true, needsVerification:true, earlyCritical:false, earlyFeedback:'Not yet. KB-0071 says to verify the user before handing over a loaner (KB-0024): call Ravi back on his directory number and confirm his employee ID first.', feedback:'Ravi will collect a loaner at 14:00, so he\'s ready for Thursday\'s demo.', history:'Loaner offered per KB-0071; user collecting 14:00.' },
      ],
      owner: { options: [
        { id:'servicedesk', text:'Service Desk keeps it: resolve at Tier 1', status:'Resolved', group:'Riley Morgan', code:'Solution provided', feedback:'Not the right owner: Tier 1 doesn\'t repair hardware. Physical damage goes to Desktop Support (KB-0071).' },
        { id:'desktop', text:'Escalate to Desktop Support (Tier 2)', status:'Escalated', group:'Desktop Support', code:'Escalated', right:true, feedback:'Right owner: physical damage goes to Desktop Support per KB-0071.' },
        { id:'soc', text:'Route to Security Operations (SOC): Category Security › Suspicious request, Caller Unverified', status:'Escalated', group:'Security Operations (SOC)', code:'Routed to Security Operations', category:'Security', subcategory:'Suspicious request', caller:'Unverified', feedback:'Not the right owner: nothing here is suspicious. Physical damage goes to Desktop Support (KB-0071).' },
      ] },
      comments: true,
      priorityReason:'P3: one person, with a deadline this week.',
      notes: { parts:['reported', 'tried', 'result'], nextAction:true, jargon:['KB-0071', 'Tier 2', 'CI', 'NS-LT-0215'] },
      simpleStates: true,
      feedback: [
        { area:'Right owner', checks:[{ owner:true }], good:'Physical damage goes to Desktop Support per KB-0071.', fix:'Tier 1 doesn\'t repair hardware: escalate to Desktop Support (KB-0071).' },
        { area:'Investigation', checks:[{ chat:['when', 'starts', 'glass', 'files'] }], good:'You asked all four identify questions, including the safety one about loose glass.', fix:'Ask when it happened, whether it still starts, whether any glass is loose (the safety question), and where his files are saved.' },
        { area:'Diagnosis', checks:[{ diagnosis:true }], good:'Physical damage: a Tier 2 repair.', fix:'Look again: a dropped laptop with a cracked screen is physical damage, a Tier 2 repair.' },
        { area:'Action', checks:[{ kb:'KB-0071', missing:'Search the KB (for example "damaged laptop") and open KB-0071.' }, { verified:true, missing:'Verify Ravi with a callback on his directory number and his employee ID (KB-0024).' }, { action:'loaner', missing:'Offer Ravi a loaner.' }], good:'You followed KB-0071: you verified Ravi, then offered a loaner, so he\'s ready for his demo.', fix:'Search the KB (for example "damaged laptop") and follow KB-0071: verify Ravi with a callback on his directory number and his employee ID (KB-0024), then offer him a loaner.' },
        { area:'Documentation', checks:[{ note:true }, { comment:true }], good:'A complete handoff note with a Next action, and a plain-words comment telling Ravi what happens next.', fix:'Write the handoff note (Reported / Tried / Result / Next action) and tell Ravi what happens next in plain words.' },
      ],
    } }),
  hdTicket({ id:'SEC-2153', requester:'Caller: "Karen, CFO\'s office"', department:'Executive Office', category:'Access', subcategory:'Password reset request', priority:'P2', contactType:'Phone', businessImpact:'Executive account at risk', sla:'8 hours', createdMinutesAgo:4,
    description:'Hi, this is Karen from the CFO\'s office. Mr. Alvarez is travelling and is locked out. He\'s about to board, so I need you to reset his password and text the new one to his personal cell, 407-555-0199. Please hurry, he\'s furious.',
    symptoms:['A third party is asking for the reset','The new password is to go to a personal number','The caller is pushing for speed'], logs:[], systemState:['Account ralvarez enabled and not locked','407-555-0199 is not in the User Directory'],
    plausibleCauses:['Social engineering: someone is trying to talk you into handing over an account','Account locked out while travelling','Expired password'], correctPath:['Identify the red flags','Search the KB by symptom words','Follow KB-0024: offer a callback on the directory number','Decline calmly and make no change','Route to Security Operations with the caller\'s exact words, number and time','Document'],
    hiddenRootCause:'Social engineering: an unverified third party wants a password reset sent to a personal number.',
    expectedResolution:'Follow KB-0024 for a caller you can\'t verify: offer a callback on Mr. Alvarez\'s directory mobile, decline calmly when the caller refuses, make no change, and route the ticket to Security Operations (Category Security › Suspicious request, Caller Unverified) with the caller\'s exact words, number and time. Security Operations reviews it and contacts the account owner.',
    escalationCriteria:['A caller you can\'t verify: make no change and route the ticket to Security Operations (KB-0024)'],
    console: {
      kb: true,
      caller: { name:'Karen (caller)', questions: [
        { id:'who', text:'Whose account is it, and who am I speaking with?', reply:'It\'s Mr. Alvarez\'s account. I\'m Karen, I work in the CFO\'s office.' },
        { id:'number', text:'Why should the new password go to that number?', reply:'It\'s his personal cell. He\'s at the airport, there\'s no time for anything else!' },
        { id:'locked', text:'What does Mr. Alvarez see when he tries to sign in?', reply:'I don\'t know exactly, he just says he\'s locked out. Please, just reset it.' },
      ] },
      verification: { prompt:'The caller says she is Karen from the CFO\'s office, asking for Mr. Alvarez\'s password. What does KB-0024 say to do?', options: [
        { id:'accept', text:'Accept it: Karen named the CFO\'s office and knows he\'s travelling', feedback:'Not verification. Anyone can claim to work for an executive and know their travel plans. KB-0024: verify with a callback on the account owner\'s directory number.' },
        { id:'given', text:'Call back on the number Karen gave (407-555-0199)', feedback:'Not verification. KB-0024 never uses a number the caller gives you, and 407-555-0199 isn\'t in the User Directory.' },
        { id:'callback', text:'Offer to call Mr. Alvarez back on his directory mobile', concludes:'unverified', feedback:'Karen: "There\'s no time for that, he\'s boarding! Just reset it." She declines the callback, so the caller can\'t be verified. KB-0024: make no change, and route the ticket to Security Operations.', history:'Offered a callback to Mr. Alvarez\'s directory mobile; the caller declined. Caller unverified.' },
      ] },
      actions: [
        { id:'reset-text', text:'Reset Mr. Alvarez\'s password and text the new one to 407-555-0199', critical:true, feedback:'Critical error. Never reset an account for a caller you can\'t verify, and never send a credential to a number the caller gives you (KB-0024).' },
        { id:'reset-karen', text:'Reset the password and give it to Karen to pass on', critical:true, feedback:'Critical error. Never reset an account for a caller you can\'t verify, and never give a credential to anyone but the verified account owner (KB-0024).' },
        { id:'decline', text:'Decline calmly: explain the policy and make no change to the account', pass:true, feedback:'You explained the policy calmly and made no change to the account.', history:'Declined per KB-0024; no account changes.' },
      ],
      owner: { options: [
        { id:'servicedesk', text:'Service Desk keeps it: resolve at Tier 1', status:'Resolved', group:'Riley Morgan', code:'Solution provided', feedback:'Not the right owner: a caller you can\'t verify isn\'t a Service Desk fix. KB-0024 routes it to Security Operations.' },
        { id:'desktop', text:'Escalate to Desktop Support (Tier 2)', status:'Escalated', group:'Desktop Support', code:'Escalated', feedback:'Not the right owner: nothing here needs Desktop Support. A caller you can\'t verify goes to Security Operations (KB-0024).' },
        { id:'soc', text:'Route to Security Operations (SOC): Category Security › Suspicious request, Caller Unverified', status:'Escalated', group:'Security Operations (SOC)', code:'Routed to Security Operations', category:'Security', subcategory:'Suspicious request', caller:'Unverified', right:true, feedback:'Right owner: KB-0024\'s route for an unverified caller (Category Security › Suspicious request, Caller Unverified, assigned to Security Operations).' },
      ] },
      comments: true,
      priorityReason:'P2: an executive account at risk, and the caller is pushing for speed.',
      notes: { parts:['reported', 'tried', 'result'], nextAction:true, jargon:['KB-0024', 'SOC', 'ralvarez', 'Tier 2'], needs: [
        { label:'The caller\'s exact words, in quotes', pattern:'"[^"]{3,}"|\u201c[^\u201d]{3,}\u201d|\u2018[^\u2019]{3,}\u2019' },
        { label:'The number: 407-555-0199', pattern:'407-555-0199' },
        { label:'The time (for example 11:05)', pattern:'\\b\\d{1,2}[:.]\\d{2}\\b' },
      ] },
      simpleStates: true,
      feedback: [
        { area:'Right owner', checks:[{ owner:true }], good:'KB-0024\'s route for an unverified caller (Category Security › Suspicious request, Caller Unverified, assigned to Security Operations).', fix:'A caller you can\'t verify: make no change and route the ticket to Security Operations (KB-0024).' },
        { area:'Investigation', checks:[{ chat:['who', 'number'] }], good:'You named the red flags: pressure, a third party asking, and a personal number that isn\'t in the directory.', fix:'Ask whose account it is and why the password should go to that number. The pressure, the third party and the personal number are red flags.' },
        { area:'Diagnosis', checks:[{ diagnosis:true }], good:'Social engineering: someone is trying to talk you into handing over an account.', fix:'Look again: an unverified third party wants a password sent to a personal number. That is social engineering.' },
        { area:'Action', checks:[{ verifyChoice:'callback' }, { action:'decline' }], good:'You offered a callback on Mr. Alvarez\'s directory mobile, declined calmly and changed nothing.', fix:'Offer to call Mr. Alvarez back on his directory mobile, then decline calmly and make no change (KB-0024).' },
        { area:'Documentation', checks:[{ note:true }, { notePattern:'"[^"]{3,}"|\u201c[^\u201d]{3,}\u201d|\u2018[^\u2019]{3,}\u2019' }, { notePattern:'407-555-0199' }, { notePattern:'\\b\\d{1,2}[:.]\\d{2}\\b' }, { notePattern:'\\bnext\\s+action\\b[\\s\\S]{0,160}\\b(SOC|Security\\s+Operations|security\\s+team)\\b' }, { comment:true }], good:'Your note has the caller\'s exact words, the number and the time, and a Next action for Security Operations to review. Your comment declines politely, in plain words.', fix:'In the note, record the caller\'s exact words in quotes, the number (407-555-0199) and the time, and add the Next action: Security Operations reviews it and contacts the account owner. Then add a polite, plain-words comment to Karen that explains why you can\'t make the change.' },
      ],
    } }),
  // Ticket 1-D (added 2026-11-15): the on-computer KB step, practised before
  // the Prove It. Hana's laptop NS-LT-0188 gets NS-CS-PRN02 from Settings ›
  // Printers & scanners › Add device (KB-0059). No account action and no
  // device handover, so no caller check.
  hdTicket({ id:'HD-2154', requester:'Hana Okafor', department:'Customer Service', category:'Hardware', subcategory:'Printer', priority:'P4', contactType:'Chat', ci:'NS-LT-0188', businessImpact:'One person; she can print from a colleague\'s PC meanwhile', sla:'5 business days', createdMinutesAgo:6,
    description:'Hi, it\'s Hana Okafor in Customer Service. I just moved to the desk by the window and my laptop doesn\'t show our team printer. Can you add it? I need to print a refund form this morning.',
    symptoms:['The team printer isn\'t in her printer list','She moved desks this morning'], logs:[], systemState:['Laptop NS-LT-0188 assigned to Hana Okafor','Printer NS-CS-PRN02 is online for Customer Service'],
    plausibleCauses:['The printer is offline','Her account is locked','The printer is missing from her laptop: nothing is broken'], correctPath:['Identify: which printer, and what she sees','Search the KB by symptom words','Add the printer from Settings per KB-0059','Ask her to print a test page','Document'],
    hiddenRootCause:'The Customer Service printer was never added to Hana\'s laptop; nothing is broken.',
    expectedResolution:'Per KB-0059: on NS-LT-0188, add NS-CS-PRN02 from Settings › Printers & scanners › Add device, then ask Hana to print a test page and confirm it printed.',
    escalationCriteria:['The printer isn\'t in the Add device list: escalate to Desktop Support (Tier 2) with the laptop\'s asset tag and the printer\'s name (KB-0059)'],
    console: {
      kb: true,
      caller: { name:'Hana Okafor', questions: [
        { id:'which', text:'Which printer do you need?', reply:'Our Customer Service printer.' },
        { id:'see', text:'What do you see when you try to print?', reply:'It just isn\'t in my list.' },
        { id:'elsewhere', text:'Can you print anywhere else for now?', reply:'I can use Tomás\'s PC next to me if I have to, but I\'d rather have it on mine.' },
        { id:'password', text:'What\'s your password, so I can add it for you?', asksPassword:true },
        { id:'test', text:'Can you print a test page?', reply:'It printed, thanks!', replyBefore:'I can\'t yet. The printer still isn\'t in my list.', afterAction:'printer-added', confirms:true },
      ] },
      actions: [
        { id:'sign-in-as', text:'Sign in to NS-LT-0188 as Hana to add the printer', critical:true, feedback:'Critical error. Never sign in as a user. KB-0059: add the printer on her laptop from Settings › Printers & scanners while she stays signed in. No admin rights are needed.' },
        { id:'ask-password', text:'Ask Hana for her password so you can add the printer for her', critical:true, feedback:'Critical error. The help desk never asks for a password, for any reason (KB-0024, KB-0059).' },
        { id:'explain', text:'Tell Hana you\'ll add the printer on her laptop from Settings while she stays signed in', pass:true, feedback:'Hana stays signed in while you open her laptop and add the printer from Settings (KB-0059).', history:'Told the user the printer is added from Settings on her laptop; no password or admin rights needed.' },
      ],
      settingsPrinters: { computer:'NS-LT-0188', printers:['\\\\NS-PRINT01\\NS-CS-PRN02'], action:'printer-added' },
      owner: { options: [
        { id:'servicedesk', text:'Service Desk keeps it: resolve at Tier 1', status:'Resolved', group:'Riley Morgan', code:'Solution provided', right:true, feedback:'Right owner: a known fix with a KB article, so the Service Desk keeps it.' },
        { id:'desktop', text:'Escalate to Desktop Support (Tier 2)', status:'Escalated', group:'Desktop Support', code:'Escalated', feedback:'Not the right owner: KB-0059 gives Tier 1 the fix. Escalate to Desktop Support only if the printer isn\'t in the Add device list.' },
        { id:'soc', text:'Route to Security Operations (SOC): Category Security › Suspicious request, Caller Unverified', status:'Escalated', group:'Security Operations (SOC)', code:'Routed to Security Operations', category:'Security', subcategory:'Suspicious request', caller:'Unverified', feedback:'Not the right owner: nothing here is suspicious. Hana needs a printer added (KB-0059).' },
      ] },
      comments: true,
      priorityReason:'P4: one person, and she can print from a colleague\'s PC in the meantime.',
      notes: { parts:['reported', 'tried', 'result'], jargon:['KB-0059', 'NS-CS-PRN02', 'NS-LT-0188', 'Tier 2', 'Add device'] },
      simpleStates: true,
      feedback: [
        { area:'Right owner', checks:[{ owner:true }], good:'A known fix with a KB article: the Service Desk keeps it.', fix:'KB-0059 gives Tier 1 the fix, so the Service Desk keeps it. Escalate only if the printer isn\'t in the Add device list.' },
        { area:'Investigation', checks:[{ kb:'KB-0059' }], good:'You found KB-0059 by searching symptom words.', fix:'Search the KB by symptom words (for example "add printer") and open KB-0059.' },
        { area:'Diagnosis', checks:[{ diagnosis:true }], good:'The printer is missing from her laptop: nothing is broken.', fix:'Look again: the printer works and Hana\'s account is fine. The printer just isn\'t on her laptop yet.' },
        { area:'Action', checks:[{ kb:'KB-0059' }, { printerInstalled:{ computer:'NS-LT-0188', printer:'\\\\NS-PRINT01\\NS-CS-PRN02' } }, { confirmed:'test' }], good:'You added NS-CS-PRN02 from Settings per KB-0059, and Hana\'s test page printed.', fix:'Follow KB-0059: on NS-LT-0188, open Settings › Printers & scanners, select Add device and add NS-CS-PRN02. Then ask Hana to print a test page.' },
        { area:'Documentation', checks:[{ note:true }, { comment:true }], good:'A complete Reported / Tried / Result note, and a plain-words comment for Hana.', fix:'Write a Reported / Tried / Result note and a plain-words comment for Hana (no printer or laptop names, no KB numbers).' },
      ],
    } }),
  hdTicket({ id:'SR-2102', requester:'New Hire · Theo Grant', department:'Logistics', category:'Service Request', subcategory:'Onboarding', priority:'P2', businessImpact:'New employee cannot begin work', sla:'4 hours', createdMinutesAgo:112, description:'Create the approved account, access groups, laptop assignment, and warehouse printer.', symptoms:['Manager approval attached','Start date is today'], logs:['HRIS export: employee 8841 active'], systemState:['No AD user exists','Laptop NS-LT-0177 is staged'], plausibleCauses:['Missing approval','Provisioning delay'], correctPath:['Validate approval and identity attributes','Create user in Logistics OU','Apply role groups','Assign endpoint','Verify sign-in and resources'], hiddenRootCause:'Standard approved onboarding request; no technical fault.', expectedResolution:'Complete least-privilege provisioning and document each asset and group assignment.', escalationCriteria:['Requested access exceeds role template','Missing manager or data-owner approval'] }),
  hdTicket({ id:'SR-2103', requester:'HR Operations', department:'Human Resources', category:'Service Request', subcategory:'Offboarding', priority:'P1', businessImpact:'Terminated employee access must end', sla:'15 minutes', createdMinutesAgo:9, description:'Disable Casey Novak immediately per attached termination notice.', symptoms:['Effective time has passed','Laptop return pending'], logs:['HR termination approval HR-8892 attached'], systemState:['Account cnovak enabled','Two active VPN sessions'], plausibleCauses:['Standard request'], correctPath:['Validate authorized notice','Disable account','Revoke sessions','Remove privileged access per runbook','Record asset recovery handoff'], hiddenRootCause:'Authorized urgent offboarding request.', expectedResolution:'Disable access, revoke sessions, preserve mailbox/data per policy, and document asset ownership.', escalationCriteria:['Litigation hold uncertainty','Privileged or service-account dependency'] }),
  hdTicket({ id:'HD-2104', requester:'Priya Shah', department:'Human Resources', category:'Incident', subcategory:'DHCP / connectivity', priority:'P2', businessImpact:'HR employee offline', sla:'8 hours', createdMinutesAgo:63, description:'I am connected to the office network, but nothing opens.', symptoms:['IPv4 address 169.254.44.19','No default gateway'], logs:['ipconfig: DHCP Enabled Yes · Autoconfiguration IPv4 169.254.44.19'], systemState:['Wi-Fi radio enabled','Dock Ethernet adapter reports cable connected','Other floor users online'], plausibleCauses:['DHCP unavailable','VLAN issue','Conflicting adapters'], correctPath:['Recognize APIPA','Isolate network interfaces','Renew lease','Validate IP, gateway, DNS','Test business resource'], hiddenRootCause:'Dock Ethernet adapter is stuck and prevents the active Wi-Fi interface from completing DHCP.', expectedResolution:'Disable the unused dock adapter, renew Wi-Fi, confirm valid lease and resource access.', escalationCriteria:['Multiple clients fail DHCP','Scope exhausted or relay unavailable'] }),
  hdTicket({ id:'HD-2105', requester:'Maya Chen', department:'Operations', category:'Incident', subcategory:'DNS', priority:'P2', businessImpact:'Operations dashboard unavailable', sla:'8 hours', createdMinutesAgo:54, description:'Websites work, but the Operations dashboard says the server cannot be found.', symptoms:['Public internet works','Internal resource opens by IP','Hostname fails'], logs:['Resolve-DnsName opsdash.northstar.example: NXDOMAIN','Client DNS server: 192.0.2.53'], systemState:['VPN connected','Endpoint received public resolver from home router'], plausibleCauses:['Application outage','Routing failure','DNS configuration'], correctPath:['Capture DNS configuration','Query internal name','Compare direct server query','Restore VPN DNS settings','Flush and retest'], hiddenRootCause:'VPN client did not apply the corporate DNS resolver after reconnect.', expectedResolution:'Reconnect/repair the approved VPN profile so corporate DNS is assigned; verify internal hostname resolution.', escalationCriteria:['Internal resolver fails for multiple users','VPN configuration deployment defect'] }),
  hdTicket({ id:'HD-2106', requester:'Elena Ruiz', department:'Logistics', category:'Incident', subcategory:'Printer', priority:'P3', businessImpact:'One warehouse label station delayed', sla:'2 business days', createdMinutesAgo:142, description:'Labels are stuck in the queue and the printer says Ready.', symptoms:['17 jobs remain in Printing','Ping to printer succeeds'], logs:['PrintService 372: driver LabelPro 3.8 terminated unexpectedly'], systemState:['NS-WH-LABEL01 queue Error','NS-PRINT01 spooler degraded'], plausibleCauses:['Out of labels','Network port','Driver crash'], correctPath:['Confirm scope','Preserve jobs','Inspect queue and print-service log','Isolate faulty driver','Apply approved rollback','Test one label'], hiddenRootCause:'LabelPro 3.8 driver crashes the server-side spooler.', expectedResolution:'Roll back to approved driver, restart spooler under change procedure, and verify queued work.', escalationCriteria:['Print-server-wide impact','Driver package unavailable or vendor defect'] }),
  hdTicket({ id:'SR-2107', requester:'Grace Kim', department:'Human Resources', category:'Service Request', subcategory:'Group membership', priority:'P3', businessImpact:'Recruiter cannot upload forms', sla:'2 business days', createdMinutesAgo:188, description:'Approved request: restore contributor access to the HR onboarding folder.', symptoms:['Read access works','Manager approval attached'], logs:['AD group history: removed from GG-HR-Contributors during transfer'], systemState:['Member of GG-HR-Readers','Not member of GG-HR-Contributors'], plausibleCauses:['NTFS ACL issue','Missing group membership'], correctPath:['Validate approval','Add authorized group','Refresh user token','Verify effective access','Document change'], hiddenRootCause:'User was removed from the contributor group during a role transfer.', expectedResolution:'Add GG-HR-Contributors, refresh sign-in token, verify upload, document approval.', escalationCriteria:['No data-owner approval','Requested permission exceeds role'] }),
  hdTicket({ id:'HD-2108', requester:'Amir Patel', department:'Operations', category:'Incident', subcategory:'Group Policy', priority:'P3', businessImpact:'One user lacks mapped drive', sla:'2 business days', createdMinutesAgo:201, description:'My Operations drive disappeared after my laptop was replaced.', symptoms:['Group membership correct','UNC path works manually'], logs:['gpresult: Operations Drive Mapping absent','Computer DN: CN=NS-LT-0145,CN=Computers'], systemState:['User in GG-Operations-Drive','Computer in default Computers container'], plausibleCauses:['Disconnected drive','GPO scope','File server outage'], correctPath:['Verify authorization','Run gpresult','Check computer OU','Move computer through approved admin task','Refresh policy and verify'], hiddenRootCause:'Replacement computer object was never moved into the Operations workstation OU.', expectedResolution:'Move the computer to the correct OU, run policy refresh, verify O: mapping.', escalationCriteria:['GPO link or security filtering change required','Replication/SYSVOL issue'] }),
  hdTicket({ id:'HD-2109', requester:'Noah Williams', department:'Sales', category:'Incident', subcategory:'Windows profile', priority:'P3', businessImpact:'Sales user cannot access normal desktop', sla:'2 business days', createdMinutesAgo:167, description:'Windows signed me into a blank desktop and my shortcuts are missing.', symptoms:['Temporary profile notification','Another user signs in normally'], logs:['User Profile Service 1511: logged on with temporary profile'], systemState:['C:\\Users\\nwilliams exists','Profile registry entry ends in .bak'], plausibleCauses:['Cloud sync issue','Corrupt profile mapping','Malware'], correctPath:['Protect user data','Confirm temporary-profile evidence','Repair or rebuild per runbook','Restore data','Verify sign-in'], hiddenRootCause:'Corrupt ProfileList registry mapping after interrupted update.', expectedResolution:'Repair/rebuild the profile using the approved runbook and verify data and application access.', escalationCriteria:['Encrypted data inaccessible','Repeated corruption or compromise indicators'] }),
  hdTicket({ id:'HD-2110', requester:'Sofia Martin', department:'Operations', category:'Incident', subcategory:'Domain trust', priority:'P2', businessImpact:'Shift supervisor cannot domain sign in', sla:'8 hours', createdMinutesAgo:74, description:'Windows says the trust relationship between this workstation and the domain failed.', symptoms:['Local support account works','Domain sign-in fails'], logs:['Test-ComputerSecureChannel: False','NETLOGON 3210 secure session failed'], systemState:['Computer object enabled','Restored VM snapshot recorded yesterday'], plausibleCauses:['Bad user password','DNS','Machine-account mismatch'], correctPath:['Confirm recovery access','Validate DNS/time/object state','Test secure channel','Repair through approved Tier 2 procedure','Verify sign-in and policy'], hiddenRootCause:'A restored snapshot rolled back the machine-account password.', expectedResolution:'Repair the secure channel, restart if approved, verify domain authentication and gpresult.', escalationCriteria:['Computer object missing or duplicate','Multiple machines lose trust'] }),
  hdTicket({ id:'HD-2111', requester:'Dina Foster', department:'Executive Office', category:'Incident', subcategory:'BitLocker', priority:'P2', businessImpact:'Executive assistant cannot start laptop', sla:'8 hours', createdMinutesAgo:37, description:'The laptop is asking for a BitLocker recovery key after a firmware update.', symptoms:['Recovery screen shows key ID','Device asset tag verified'], logs:['Firmware change CHG-4471 completed overnight'], systemState:['Recovery key escrowed','User identity not yet verified'], plausibleCauses:['Unauthorized tamper','Expected firmware measurement change'], correctPath:['Verify user and device','Match recovery key ID','Provide key through approved secure channel','Boot and validate protection','Document disclosure'], hiddenRootCause:'Approved firmware update changed TPM measurements.', expectedResolution:'Use escrowed recovery key after identity verification, confirm BitLocker returns to Protected.', escalationCriteria:['Key unavailable or mismatch','Unapproved firmware change or tamper concern'] }),
  hdTicket({ id:'HD-2112', requester:'IT Monitoring', department:'Information Technology', category:'Incident', subcategory:'Windows service', priority:'P2', businessImpact:'Department print service degraded', sla:'8 hours', createdMinutesAgo:48, description:'Print Spooler stops immediately after it starts on NS-PRINT01.', symptoms:['Service exit code 1067','Issue began after driver package'], logs:['System 7031: Print Spooler terminated unexpectedly','PrintService 808: LabelPro provider fault'], systemState:['Server reachable','Other services healthy'], plausibleCauses:['Service account','Dependency','Faulty driver'], correctPath:['Preserve logs','Check dependency and recent change','Quarantine faulty driver','Use approved rollback','Restart and validate queues'], hiddenRootCause:'Third-party label driver crashes the spooler.', expectedResolution:'Rollback the driver under change control and verify all queues.', escalationCriteria:['Production reboot required','Vendor package or server-wide outage'] }),
  hdTicket({ id:'HD-2113', requester:'Remote Employee · Kai Ross', department:'Sales', category:'Incident', subcategory:'VPN', priority:'P2', businessImpact:'Remote seller cannot reach internal apps', sla:'8 hours', createdMinutesAgo:95, description:'VPN accepts MFA, connects for a few seconds, then disconnects.', symptoms:['Internet access stable','MFA succeeds'], logs:['VPN client: certificate validation failed · NotAfter 2026-08-16'], systemState:['User certificate valid','Gateway certificate expired'], plausibleCauses:['Password','Home firewall','Gateway certificate'], correctPath:['Capture client log and time','Validate certificate chain and expiry','Correlate other users','Escalate gateway certificate renewal','Communicate workaround only if approved'], hiddenRootCause:'VPN gateway certificate expired.', expectedResolution:'Escalate as shared service incident for approved certificate renewal; validate new chain.', escalationCriteria:['Always: production gateway certificate change required'] }),
  hdTicket({ id:'SEC-2114', requester:'Luis Ortega', department:'Sales', category:'Security Incident', subcategory:'Phishing', priority:'P1', businessImpact:'Possible credential compromise', sla:'15 minutes', createdMinutesAgo:7, description:'I clicked a shipping link and signed in again. Was that real?', symptoms:['Lookalike domain','Unexpected sign-in page'], logs:['Browser history: northstar-shipping.example-login.test','Identity log: unfamiliar sign-in pending review'], systemState:['Email preserved','Endpoint protection has no malware verdict'], plausibleCauses:['Benign vendor portal','Credential phishing'], correctPath:['Verify reporter','Preserve email/URL/time','Protect account within procedure','Escalate immediately','Do not declare endpoint safe'], hiddenRootCause:'Credential-phishing page captured the password.', expectedResolution:'Escalate to cybersecurity, revoke sessions/reset credential per response runbook, preserve evidence.', escalationCriteria:['Always: potential credential compromise'] }),
  hdTicket({ id:'SEC-2115', requester:'Endpoint Security', department:'Cybersecurity', category:'Security Incident', subcategory:'Malware alert', priority:'P1', businessImpact:'Potential endpoint compromise', sla:'15 minutes', createdMinutesAgo:12, description:'High-confidence malware alert on NS-LT-0162 requires help desk contact and containment coordination.', symptoms:['User reports browser pop-ups','EDR alert high confidence'], logs:['EDR: suspicious powershell child of browser','SHA256 aaa... training fixture'], systemState:['Device online','Isolation pending security approval'], plausibleCauses:['Malicious extension','False positive'], correctPath:['Do not delete evidence','Confirm user/device','Coordinate containment','Record observations','Warm handoff to security'], hiddenRootCause:'Malicious browser extension launched an encoded PowerShell command.', expectedResolution:'Security-led containment and investigation; help desk handles user communication and replacement device.', escalationCriteria:['Always: confirmed or suspected malware'] }),
  hdTicket({ id:'SR-2116', requester:'Dina Foster', department:'Executive Office', category:'Service Request', subcategory:'Software installation', priority:'P2', businessImpact:'Board materials due tomorrow', sla:'8 hours', createdMinutesAgo:126, description:'Install the approved PDF editor before tomorrow morning.', symptoms:['Manager approval attached','License available'], logs:['Software catalog: PDF Studio Enterprise · Approved'], systemState:['Device compliant','Package available in endpoint manager'], plausibleCauses:['Standard request'], correctPath:['Validate approval/license/device','Deploy approved package','Verify launch and license','Document'], hiddenRootCause:'No fault; fulfilled standard request.', expectedResolution:'Install from managed catalog and verify with user.', escalationCriteria:['Unapproved software or elevated exception requested'] }),
  hdTicket({ id:'HD-2117', requester:'Monitoring', department:'Information Technology', category:'Incident', subcategory:'Disk space', priority:'P2', businessImpact:'File server may stop accepting data', sla:'8 hours', createdMinutesAgo:41, description:'NS-FILE01 data volume has 4% free space.', symptoms:['Growth accelerated this morning','Finance archive share largest'], logs:['Get-Volume D: SizeRemaining 81GB of 2TB','Top path: D:\\Shares\\Finance\\Exports'], systemState:['Nightly export job created duplicate output','Backups healthy'], plausibleCauses:['Normal growth','Log growth','Duplicate export'], correctPath:['Confirm impact and growth','Identify safe cleanup candidates','Preserve business data','Stop duplicate generation through owner','Use approved cleanup/change'], hiddenRootCause:'Finance export job wrote duplicate archives after a retry loop.', expectedResolution:'Stop duplicate job via app owner, remove duplicates after approval, verify free-space threshold and monitoring.', escalationCriteria:['Storage expansion or production job change required'] }),
  hdTicket({ id:'HD-2118', requester:'Evan Parker', department:'Finance', category:'Incident', subcategory:'File permissions', priority:'P2', businessImpact:'Payroll file cannot be updated', sla:'8 hours', createdMinutesAgo:58, description:'I can open the payroll workbook but cannot save changes.', symptoms:['Read succeeds','Modify denied in Payroll subfolder'], logs:['Effective access: Read & Execute','Share permission: Change'], systemState:['User in GG-Finance-Users','Missing GG-Finance-Contributors'], plausibleCauses:['File locked','NTFS permission','Share offline'], correctPath:['Validate requested access','Calculate group-based effective access','Check share and NTFS','Correct approved membership','Refresh token and verify'], hiddenRootCause:'User is missing the NTFS contributor group.', expectedResolution:'Restore approved contributor group and verify Modify without direct user ACL.', escalationCriteria:['No data-owner approval','Explicit deny or ACL redesign required'] }),
  ...['Maya Chen|Operations','Elena Ruiz|Logistics','Noah Williams|Sales','Priya Shah|Human Resources','Evan Parker|Finance'].map((row, index) => {
    const [requester, department] = row.split('|');
    return hdTicket({ id:`HD-${2119 + index}`, requester, department, category:'Incident', subcategory:'Enterprise application', priority:index === 0 ? 'P2' : 'P3', businessImpact:'Purchasing application unavailable', sla:index === 0 ? '8 hours' : '2 business days', createdMinutesAgo:32 - index * 4, description:'Purchasing opens, but sign-in ends with a secure connection error.', symptoms:['Same application error','Other websites and file shares work'], logs:['Browser: NET::ERR_CERT_DATE_INVALID','TLS NotAfter: 2026-08-16T23:59:59Z'], systemState:['NS-APP01 online','Application service running'], plausibleCauses:['User account','Browser cache','Application certificate'], correctPath:['Confirm shared symptom','Compare timestamps and error','Link related incidents','Validate certificate evidence','Escalate controlled renewal'], hiddenRootCause:'NS-APP01 service certificate expired.', expectedResolution:'Link to the common incident/problem, renew the certificate through change control, verify all user paths.', escalationCriteria:['Always: shared production application and certificate change'], correlationKey:'APP-CERT-EXPIRY-01' });
  }),
  hdTicket({ id:'HD-2124', requester:'Tara Singh', department:'Sales', category:'Incident', subcategory:'Email / Outlook', priority:'P2', businessImpact:'Sales manager blocked from sending a time-critical client proposal', sla:'8 hours', createdMinutesAgo:51, description:'This is the second time I\'ve called about this today. Outlook keeps asking for my password and it just fails. I have a client waiting on this proposal and I cannot keep retyping it every five minutes.', symptoms:['Outlook repeatedly prompts for password mid-session','Send/receive fails after the prompt is dismissed','Teams and the browser M365 apps sign in fine','Second contact today about the same issue'], logs:['Outlook Connection Status: Auth error 0x8004101 on send/receive','Azure AD sign-in log: password changed 09:02 today','Credential Manager: generic credential MicrosoftOffice16_Data:ssp: last modified 3 weeks ago'], systemState:['Domain password changed this morning per policy','Browser and Teams already authenticate with the new password','Outlook profile still failing to authenticate'], plausibleCauses:['Outlook profile corruption','Exchange service outage','Stale cached credential in Credential Manager'], correctPath:['Verify identity and confirm the recent password change','Check other M365 apps to confirm the failure is scoped to Outlook','Open Credential Manager and locate the stale Office/Outlook entry','Remove the stale credential and restart Outlook','Re-authenticate and confirm send/receive succeeds','Set a clear, honest expectation before ending the call'], hiddenRootCause:'Windows Credential Manager retained a stale cached password for Outlook after this morning\'s required domain password change.', expectedResolution:'Remove the stale Outlook/Office credential from Credential Manager, restart Outlook, re-authenticate with the new password, and confirm send/receive succeeds before closing.', escalationCriteria:['Credential is cleared but authentication still fails','Multiple users report the same post-password-change Outlook failure'] }),
  // Module 2 Practice It. Lab 2.1 (coach, HD_COACHED_SETS 'its-10-guided') and
  // Lab 2.2 (HD_PRACTICE_SETS 'its-10') run on a fixed clock with the queue and
  // matrix features (ui/helpdesk.js). The facts a student needs are in the
  // description and the caller's messages only, never on a tool screen. Each
  // ticket starts with no priority (or a seeded one) and a neutral category:
  // the student sets both. Queue rows and tickets show the INC number only.
  // Practice feedback only, never points.
  hdTicket({ id:'HD-2158', ownSet:true, number:'INC0010158', requester:'Sam Rivera', department:'Customer Service', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T08:31:00Z', shortDescription:'Phone app says Not connected',
    description:'Hey, no rush, I know you\'re busy: none of us in Customer Service can take calls. The phone app says \'Not connected\' for the whole team since 8:30. Customers are getting voicemail.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['Customer Service phone app', 'Teams', 'NS-LT-0188', 'Floor 3 Wi-Fi'] },
      priorityCoach:{ impact:'1', urgency:'1', line:'"No rush" is how Sam said it. It is not what it is. A whole department can\'t take customer calls. So Impact is 1 and Urgency is 1.' },
      caller:{ name:'Sam Rivera', questions:[
        { id:'who', text:'Is every agent affected, or only you?', reply:'Everyone on the team. Nobody can take a call.' },
        { id:'when', text:'When did it start?', reply:'At 8:30, when the phones opened for the day.' },
      ] },
      comments:{ internalNames:['Messaging & Collaboration', 'Service Desk lead', 'Network Operations', 'Desktop Support', 'Security Operations', 'SOC', 'Server & Identity', 'Facilities', 'Tier 1', 'Tier 2'] },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'matrix', 'assignment group'] },
    } }),
  hdTicket({ id:'HD-2159', ownSet:true, number:'INC0010159', requester:'Noah Williams', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T08:15:00Z', shortDescription:'3rd floor Wi-Fi down for all of Sales',
    description:'The Wi-Fi on the 3rd floor dropped for all of Sales about 20 minutes ago. Laptops say \'No internet\'. Desks with a network cable are fine. Client calls start at 10.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['Floor 3 Wi-Fi', 'Floor 2 Wi-Fi', 'NS-LT-0081', 'Sales CRM'] },
      priorityCoach:{ impact:'1', urgency:'2', line:'All of Sales is a department, so Impact is 1. Desks with a network cable still work until the 10:00 calls, so Urgency is 2.' },
      kb:{ attach:true }, comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'KB-0063', 'Network Operations'] },
    } }),
  hdTicket({ id:'HD-2160', ownSet:true, number:'INC0010160', requester:'Luis Ortega', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T08:22:00Z', shortDescription:'internet not working',
    description:'internet not working',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['NS-LT-0154', 'NS-LT-0081', 'NS-LT-0215', 'Floor 3 Wi-Fi'] },
      priorityCoach:{ impact:'1', urgency:'2', line:'Rated alone, this looks like one person. It is the same outage as INC0010159. Step 4 links the two tickets, and then the ticket is a Priority 2.' },
      link:true, comments:true,
      caller:{ name:'Luis Ortega', questions:[
        { id:'where', text:'Where are you working? Which floor?', reply:'I\'m on floor 3.' },
        { id:'what', text:'What do you see on your laptop?', reply:'The Wi-Fi icon shows a connection, but it says \'No internet\'.' },
        { id:'when', text:'When did it start?', reply:'About 8:15. It worked when I got in.' },
        { id:'tried', text:'Did you try anything?', reply:'I turned Wi-Fi off and on. Same result.' },
        { id:'others', text:'Is anyone else affected? Do you have a deadline?', reply:'Everyone in Sales on this floor, I think. People at desks with a cable are fine. We have client calls at 10.' },
        { id:'laptop', text:'Which laptop are you using?', reply:'My own laptop, NS-LT-0154.' },
      ] },
      rewrite:{ checks:[
        { part:'who', pattern:'Luis|Ortega' },
        { part:'what', pattern:'no internet|wi-?fi|wireless|internet' },
        { part:'where', pattern:'floor\\s*3|3rd floor|third floor' },
        { part:'when', pattern:'since[^.\\n]{0,25}\\d{1,2}(:\\d{2})?|\\d{1,2}:\\d{2}' },
        { part:'impact', pattern:'all of|whole|everyone|everybody|entire|INC0010159|parent|several|team|department' },
      ] },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'Network Operations'] },
    } }),
  hdTicket({ id:'SEC-2163', ownSet:true, number:'INC0010163', requester:'Maya Chen', department:'Operations', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T08:24:00Z', shortDescription:'Attachment asked me to enable content',
    description:'I opened an email attachment called Invoice_8841 and it asked me to \'enable content\'. I clicked it and nothing happened. I don\'t recognize the supplier.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['NS-LT-0042', 'NS-LT-0145', 'NS-LT-0131', 'Outlook'] },
      priorityCoach:{ impact:'2', urgency:'1', line:'One person clicked. But a possible compromise can spread, and it can\'t wait. So Impact is 2 and Urgency is 1.' },
      comments:true,
      caller:{ name:'Maya Chen', questions:[
        { id:'sender', text:'Who sent the email? What is the sender\'s address?', reply:'It came from accounts@brightfield-supply.example. I don\'t know that supplier.' },
        { id:'when', text:'When did you click Enable content?', reply:'At about 08:20, right after I opened the attachment.' },
        { id:'laptop', text:'Which laptop were you using?', reply:'My own laptop, NS-LT-0042.' },
      ] },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'SOC', 'Security Operations', 'indicators'],
        needs:[
          { label:'The sender\'s address', pattern:'[\\w.-]+@[\\w.-]+' },
          { label:'The attachment name (Invoice_8841)', pattern:'Invoice_8841' },
          { label:'What Maya clicked (Enable content)', pattern:'enable content' },
          { label:'When Maya clicked it', pattern:'\\b\\d{1,2}[:.]\\d{2}\\b' },
          { label:'Which laptop (NS-LT-0042)', pattern:'NS-LT-0042' },
        ] },
    } }),
  hdTicket({ id:'HD-2162', ownSet:true, number:'INC0010162', requester:'Priya Shah', department:'Human Resources', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-17T16:10:00Z', shortDescription:'HIGH PRIORITY!!! Mouse pointer freezes',
    description:'HIGH PRIORITY!!! My mouse pointer keeps freezing every few minutes. I can\'t work like this!!',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['NS-LT-0094', 'NS-LT-0068', 'NS-LT-0117', 'NS-LT-0215'] },
      priorityCoach:{ impact:'3', urgency:'2', line:'Capital letters are not urgency. One person is affected, and the laptop\'s touchpad still works. So Impact is 3 and Urgency is 2.' },
      comments:true, resolutionCode:{ required:true }, kb:{ draft:true },
      caller:{ name:'Priya Shah', questions:[
        { id:'who', text:'Is anyone else having this problem?', reply:'No, only me as far as I know. Everyone else in HR is fine.' },
        { id:'touchpad', text:'Does the touchpad on your laptop still work?', reply:'Yes. The touchpad works. It is only the mouse that freezes.' },
        { id:'laptop', text:'Which laptop are you using?', reply:'My own laptop, NS-LT-0094.' },
      ] },
      arrivals:[{ id:'priya-reply', from:'Priya Shah', text:'It\'s wireless. I put new batteries in and it\'s fine now.', resume:true,
        when:{ all:[{ ticket:'HD-2158', notes:1, comments:1 }, { status:'On Hold – Awaiting Caller' }] } }],
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'On Hold', 'Awaiting Caller'] },
    } }),
  hdTicket({ id:'SR-2161', ownSet:true, number:'INC0010161', requester:'Amir Patel', department:'Operations', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-17T14:00:00Z', shortDescription:'Wireless headset for Teams calls',
    description:'Can I get a wireless headset for Teams calls? My manager approved it by email.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['NS-LT-0145', 'Teams', 'NS-LT-0042', 'NS-LT-0131'] },
      priorityCoach:{ impact:'3', urgency:'3', line:'Nothing is broken, and nothing is waiting on this. So Impact is 3 and Urgency is 3.' },
      caller:{ name:'Amir Patel', questions:[
        { id:'laptop', text:'Which laptop will you use the headset with?', reply:'My own laptop, NS-LT-0145.' },
        { id:'when', text:'When do you need it?', reply:'No rush. Whenever it is ready is fine.' },
      ] },
      convert:{ number:'RITM0010161', needsTriage:true, items:[
        { name:'Wireless headset', approval:'Approved', approver:'Caleb Wright (Amir’s manager)' },
        { name:'Wired headset', approval:'Approved', approver:'Caleb Wright (Amir’s manager)' },
        { name:'Laptop dock', approval:'Approved', approver:'Caleb Wright (Amir’s manager)' },
      ] },
      comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'SLA', 'Impact', 'Urgency', 'Tier 1', 'Tier 2', 'CI', 'RITM', 'catalog item'] },
    } }),
  // Module 2 Lab 2.2 practice tickets 2-A to 2-C and the two related badge
  // printer tickets. Priority is seeded only where the story needs it.
  hdTicket({ id:'HD-2155', ownSet:true, number:'INC0010155', requester:'Omar Haddad', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T12:50:00Z', shortDescription:'Calendar broken for my assistant',
    description:'My new assistant Nina can\'t see or book anything on my calendar. Can you fix it? She started Monday.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M02_CATEGORIES, cis:['Outlook calendar', 'Teams', 'NS-LT-0081'], preset:{ contactType:'Self-service' } },
      kb:true, comments:{ internalNames:['KB-0062', 'Tier 1', 'Tier 2', 'Messaging & Collaboration'] },
      caller:{ name:'Omar Haddad', questions:[
        { id:'access', text:'Did Nina ever have access to your calendar?', reply:'No, never. She only started Monday.' },
        { id:'need', text:'What does Nina need to do on your calendar?', reply:'She needs to see my schedule and book meetings for me.' },
        { id:'invites', text:'Should Nina also get copies of your meeting invitations?', reply:'Yes, please.' },
      ] },
      convert:{ number:'RITM0010088', items:[
        { name:'Calendar delegate access', approver:'Omar Haddad', fields:[
          { id:'mailbox', label:'Mailbox', options:['Omar Haddad', 'Tara Singh', 'Nadia Flores'] },
          { id:'permission', label:'Permission', options:['Reviewer (read only)', 'Author', 'Editor (delegate)', 'Owner (full control)'] },
        ] },
        { name:'Shared mailbox access', approver:'Mailbox owner', fields:[
          { id:'mailbox', label:'Mailbox', options:['Sales team mailbox', 'Customer Service mailbox'] },
        ] },
        { name:'New user account', approver:'Hiring manager' },
      ] },
      arrivals:[{ id:'omar-approves', from:'Omar Haddad', text:'I approve this request in the portal. Nina Patel is my assistant.', approve:true, when:{ converted:true } }],
      actions:[
        { id:'grant', text:'Grant Nina the delegate access', needsApproval:true, earlyCritical:'Granted access before the mailbox owner approved', earlyFeedback:'Not yet. The mailbox owner must approve the request first (KB-0062). Wait for Omar\'s approval on the request.', feedback:'Nina has the delegate access Omar approved. It can take up to an hour to appear.', history:'Granted the delegate access that the mailbox owner approved, per KB-0062.' },
        { id:'grant-owner', text:'Grant Nina Owner (full control) on Omar\'s mailbox', feedback:'Not the right level. Grant the permission asked for and no more. Editor (delegate) lets Nina see the calendar and book meetings. Owner gives full control of the mailbox (KB-0062).' },
      ],
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['KB-0062', 'RITM', 'catalog item', 'Tier 1', 'Tier 2', 'SLA', 'Impact', 'Urgency', 'Editor (delegate)'] },
      feedback:[
        { area:'Triage', checks:[{ converted:true, missing:'Convert the incident to a request. Nina never had access, so nothing is broken.' }, { requestFor:'Nina Patel', missing:'Set Requested for to Nina Patel, the person who needs the access.' }], good:'You saw that this is a request, not a fault, and you made it for the right person.', fix:'Nina never had access, so nothing is broken. Convert the incident to a request for Nina Patel.' },
        { area:'Investigation', checks:[{ kb:'KB-0062', missing:'Search the KB for "calendar delegate" and open KB-0062.' }, { chat:['invites'], missing:'Ask Omar whether Nina should also get copies of his meeting invitations (KB-0062, step 5).' }], good:'You used KB-0062 and asked Omar about meeting invitations.', fix:'Search the KB for "calendar delegate", open KB-0062, and ask Omar whether Nina should get his meeting invitations.' },
        { area:'Diagnosis', checks:[{ chat:['access'], missing:'Ask Omar whether Nina ever had access.' }], good:'You confirmed Nina never had access. That makes it a request.', fix:'Ask Omar whether Nina ever had access to his calendar. If she never did, nothing is broken.' },
        { area:'Action', checks:[{ requestField:{ id:'permission', value:'Editor (delegate)' }, missing:'Set Permission to Editor (delegate). It lets Nina see the calendar and book meetings.' }, { action:'grant', missing:'Grant the access after Omar approves the request.' }], good:'You asked for Editor (delegate), no more, and granted it after Omar approved.', fix:'Set Permission to Editor (delegate), wait for Omar to approve, then grant the access. Never grant more than the request asks for.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { comment:true, missing:'Write a comment for Omar in plain words, with no internal names.' }], good:'A complete work note, and a plain-words comment for Omar.', fix:'Write a Reported / Tried / Result note, and a comment for Omar that says what happened, what he needs to do and what happens next.' },
      ],
    } }),
  hdTicket({ id:'HD-2156', ownSet:true, number:'INC0010412', requester:'Ines Calder', department:'Front Desk', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T09:00:00Z', status:'Resolved', assignedTechnician:'Riley Morgan', shortDescription:'Reception badge printer stuck',
    description:'The reception badge printer will not print visitor badges from my PC.',
    notes:[{ time:'Tue 11:30', author:'Riley Morgan (Tue)', text:'Reported: the reception badge printer would not print. Tried: cleared stuck jobs, unticked Use Printer Offline. Result: one badge printed. Resolved.' }],
    resolution:'Cleared the stuck print jobs and unticked Use Printer Offline. One badge printed.', closureCode:'Solution provided',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'2', urgency:'2', respondedAt:'2026-08-18T09:20:00Z', stops:[{ from:'2026-08-18T11:30:00Z', kind:'resolved' }] },
      link:true, comments:{ internalNames:['Desktop Support', 'Tier 1', 'Tier 2', 'Network Operations'] },
      caller:{ name:'Ines Calder', questions:[
        { id:'now', text:'What does the printer do now?', reply:'The same as yesterday. The badge goes in, and then nothing prints.' },
        { id:'since', text:'When did it stop again?', reply:'This morning. One badge worked yesterday, and today it won\'t print at all.' },
      ] },
      rewrite:{ checks:[{ part:'the word "(reopened)" in the short description', pattern:'\\(reopened\\)', field:'short' }] },
      arrivals:[{ id:'ines-reopen', from:'Ines Calder', text:'RE: INC0010412 has been resolved. It is NOT resolved. The badge printer worked for one badge yesterday and now it\'s doing the same thing again.', reopen:true, at:'2026-08-19T12:50:00Z' }],
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Tier 1', 'Tier 2', 'SLA', 'Impact', 'Urgency', 'Desktop Support', 'P3', 'parent ticket'] },
      feedback:[
        { area:'Triage', checks:[{ status:['In Progress', 'Escalated'], missing:'Reopen INC0010412 with Ines\'s reply. Do not open a new incident.' }, { rewrite:true, missing:'Add "(reopened)" to the short description.' }], good:'You reopened the same ticket and marked it "(reopened)".', fix:'The reply reopens INC0010412: do not open a new incident. Add "(reopened)" to the short description.' },
        { area:'Investigation', checks:[{ notePattern:'yesterday|earlier|prior|previous|offline|stuck', missing:'Read the ticket history first, and write down what was done yesterday.' }, { notePattern:'INC0010431|INC0010433|other (front|reception)|same (symptom|problem|fault)|more tickets|two (more|other)', missing:'Look at the queue. Other front-desk PCs have the same fault.' }], good:'You read yesterday\'s work and saw the same fault on other front-desk PCs.', fix:'Read yesterday\'s work note, then look at the queue: two more badge printer tickets came from other front-desk PCs.' },
        { area:'Diagnosis', checks:[{ notePattern:'printer|print server|not the (pc|computer|client)|not (a )?(pc|client)', missing:'Say in your note where the cause is likely to be.' }], good:'The same fault on several PCs points at the printer side, not at one PC.', fix:'The same fault on several PCs means the cause is not the PC. It is on the printer or print server side.' },
        { area:'Action', checks:[{ child:'HD-2184', missing:'Link INC0010431 to this ticket as related.' }, { child:'HD-2185', missing:'Link INC0010433 to this ticket as related.' }, { group:'Desktop Support (Tier 2)', missing:'Escalate to Desktop Support (Tier 2) with yesterday\'s and today\'s evidence.' }], good:'You linked both related tickets and escalated with the evidence.', fix:'Link INC0010431 and INC0010433 to this ticket as related, then escalate to Desktop Support (Tier 2) with yesterday\'s and today\'s evidence.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { commentPattern:'sorry|apolog', missing:'Say sorry for the trouble in your comment, without blaming anyone.' }, { commentPattern:'by \\d|\\d{1,2}:\\d{2}|\\d\\s*(am|pm)|this afternoon|end of (the )?day|tomorrow|within \\d', missing:'Give Ines a time for your next update.' }], good:'A complete note, a comment that says sorry without blame, and a time for the next update.', fix:'Write a Reported / Tried / Result note with a Next action. In your comment say sorry without blame and give Ines a time for the next update.' },
      ],
    } }),
  hdTicket({ id:'HD-2184', ownSet:true, number:'INC0010431', requester:'Sofia Martin', department:'Operations', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T12:15:00Z', shortDescription:'Reception badge printer will not print',
    description:'I am covering the second front-desk PC. The reception badge printer will not print visitor badges from this PC. It fails the same way as at the first front-desk PC.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'2', urgency:'2' }, link:true, comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Tier 1', 'Tier 2', 'SLA', 'Impact', 'Urgency', 'Desktop Support', 'P3', 'parent ticket'] },
    } }),
  hdTicket({ id:'HD-2185', ownSet:true, number:'INC0010433', requester:'Hana Okafor', department:'Customer Service', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T12:35:00Z', shortDescription:'Reception badge printer will not print',
    description:'I am at the third front-desk PC. The reception badge printer will not print visitor badges from here. Other front-desk PCs have the same fault.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'2', urgency:'2' }, link:true, comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Tier 1', 'Tier 2', 'SLA', 'Impact', 'Urgency', 'Desktop Support', 'P3', 'parent ticket'] },
    } }),
  hdTicket({ id:'HD-2157', ownSet:true, number:'INC0010377', requester:'Marcus Lee', department:'Marketing', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-17T09:00:00Z', status:'On Hold', holdReason:'Awaiting Caller', assignedTechnician:'Riley Morgan', shortDescription:'Outlook keeps asking for my password',
    description:'Outlook keeps asking me for my password.',
    customerComments:[{ time:'Mon 09:40', author:'Riley Morgan (Mon)', text:'Hi Marcus, thank you for telling us. Could you send us a screenshot of the message Outlook shows when it asks for your password? – Riley, Northstar Service Desk' }],
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'3', urgency:'2', respondedAt:'2026-08-17T09:40:00Z', stops:[{ from:'2026-08-17T09:40:00Z', kind:'paused' }] },
      contactAttempts:{ seed:[{ at:'2026-08-17T09:40:00Z', method:'Customer comment (Additional comments)' }] },
      resolutionCode:{ required:true }, comments:{ internalNames:['Tier 1', 'Tier 2', 'Messaging & Collaboration'] },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Tier 1', 'Tier 2', 'SLA', 'Impact', 'Urgency', 'P4', 'On Hold', 'Awaiting Caller'] },
      feedback:[
        { area:'Triage', checks:[{ status:['On Hold – Awaiting Caller', 'Resolved'], missing:'Keep the ticket On Hold – Awaiting Caller while you wait. Any other open state restarts the clock.' }], good:'The ticket stayed On Hold – Awaiting Caller while you waited, so the clock stayed paused.', fix:'Keep the ticket On Hold – Awaiting Caller while you wait for the caller. The clock pauses only in that state.' },
        { area:'Investigation', checks:[{ notePattern:'screenshot|attempt|contact|monday|requested|asked', missing:'Read the ticket history and write down what was asked and when.' }], good:'You read the history: one attempt on Monday, no reply.', fix:'Read the history first. Riley asked for a screenshot on Monday and the caller did not reply. That is attempt 1.' },
        { area:'Diagnosis', checks:[{ notePattern:'no (response|reply)|not (responded|replied|answered)|unreachable|voicemail|has not', missing:'Say in your note that the caller has not responded.' }], good:'You wrote that the caller has not responded.', fix:'The caller has not responded. Say so in your note.' },
        { area:'Action', checks:[{ attempts:3, missing:'Log three contact attempts before you close: use "Next day" to log attempt 3.' }, { code:'No response from caller', missing:'Resolve with the code "No response from caller".' }, { status:'Resolved', missing:'Resolve the ticket after attempt 3.' }], good:'You logged three attempts, then resolved with "No response from caller".', fix:'Log attempt 2 by phone today, attempt 3 on the next day, and only then resolve with "No response from caller".' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note that lists all three attempts.' }, { commentPattern:'reopen|reply', missing:'Tell Marcus in a comment how to reopen the ticket by replying.' }], good:'A complete note, and a comment that tells Marcus how to reopen the ticket.', fix:'Write a Reported / Tried / Result note with all three attempts. Tell Marcus in a comment how to reopen the ticket by replying.' },
      ],
    } }),
];

/* Prove It shifts, by module key. A Prove shift opens with only its own
 * ticket(s) and fixtures, never added to a Practice shift (hdFreshState()
 * builds Practice from HD_TICKET_TEMPLATES only; bin/its-curriculum-check.js
 * checks that these tickets, computers and KB articles stay out of Practice).
 * Only what the student sees lives here: no expected values. Option lists
 * are alphabetical and shuffled per student when the shift starts. */
const HD_PROVE_SHIFTS = {
  'its-01': {
    labKey: 'lab-its-01-prove-it',
    rubricVersion: 'hdesk-its-01-prove-v2',
    selectedComputer: 'NS-LT-0122',
    tickets: [{
      id: 'HD-2125', title: 'Admin rights "just for today"',
      requester: 'Evan Parker', requesterTitle: 'Payroll Specialist', department: 'Finance',
      device: 'NS-LT-0122', cc: 'Ava Robinson (manager)', createdMinutesAgo: 25,
      status: 'Assigned', assignedTechnician: 'Riley Morgan',
      description: 'I\'ve moved to the Payroll desk on the 3rd floor and need the Finance printer. The driver install asks for admin rights, so can you make me a local admin just for today? Ava is CC\'d and says it\'s fine.',
      conversation: [
        { from: 'Ava Robinson', role: 'Manager, Finance · CC', text: 'Approved, give him whatever he needs.' },
      ],
      categoryOptions: ['Incident', 'Security Incident', 'Service Request'],
      typeOptions: ['Access request', 'Account lockout', 'Hardware', 'Network / connectivity', 'Printer', 'Software installation'],
      // Module 1: set for the student, shown read-only and never scored.
      preset: { category: 'Service Request', type: 'Access request', priority: 'P3' },
      // The only console feature a Prove ticket can turn on (ui/helpdesk.js
      // hdConsole): a knowledge base search, recorded for the instructor.
      console: { kb: true },
      diagnosisOptions: ['Out of policy', 'Printer driver fault', 'Standard request, approved', 'Standard request, needs approval'],
      // Module 1 skills only: no print-server, policy-refresh or command steps.
      // Ids are new for this version, so an earlier attempt's steps never
      // land on different wording.
      pathPool: [
        { id: 'm1', text: 'Ask Evan what changed and what he needs to print' },
        { id: 'm2', text: 'Search the knowledge base for the policy on admin rights' },
        { id: 'm3', text: 'Verify Evan per KB-0024 (call back on the directory number and confirm his employee ID)' },
        { id: 'm4', text: 'Add the printer from Settings › Printers & scanners › Add device, with no admin rights' },
        { id: 'm5', text: 'Confirm with Evan that the printer is added and prints' },
        { id: 'm6', text: 'Explain that only a Cybersecurity exception request can approve admin rights, not his manager' },
        { id: 'm7', text: 'Accept Ava\'s approval and grant admin rights for the day' },
        { id: 'm8', text: 'Add Evan to local Administrators for the day' },
        { id: 'm9', text: 'Type the support admin password into his prompt' },
        { id: 'm10', text: 'Escalate to Tier 2 as a printer fault' },
      ],
    }],
    computers: [
      { name:'NS-LT-0122', user:'Evan Parker', os:'Windows 11 Enterprise 24H2', ip:'10.20.20.122', ou:'OU=Finance,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy', uptimeDays:9 },
    ],
    // Simulated machine state the shell reads and changes.
    machines: {
      'NS-LT-0122': {
        printers: ['Microsoft Print to PDF'],
        pendingPolicyPrinters: [],
        localAdministrators: ['NORTHSTAR\\Domain Admins', 'NS-LT-0122\\MNT-Support'],
        spooler: 'Running',
      },
    },
    // Printers a laptop's Settings › Printers & scanners › Add device can add
    // without admin rights (ui/helpdesk.js), for users in the printer's group.
    settingsPrinters: {
      'NS-LT-0122': ['\\\\NS-PRINT01\\NS-FIN-PRN01'],
    },
    kbArticles: [
      { id:'KB-0058', title:'Local administrator rights on managed devices', category:'Endpoint policy', updated:'2026-11-10', audience:'All Support', summary:'Local admin rights are never granted to standard users. Exceptions need a Cybersecurity exception request, and a manager can\'t approve one. Finance printers are added from Settings › Printers & scanners › Add device. No admin rights are needed.' },
    ],
    serverOverrides: {
      'NS-PRINT01': { status:'Online', service:'Print Spooler running · queues published' },
    },
    // Event Viewer entries from these computers belong to other tickets' stories.
    hideEventsFrom: ['NS-PRINT01'],
  },
};

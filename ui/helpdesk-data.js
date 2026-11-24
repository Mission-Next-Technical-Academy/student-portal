/* Mission Next IT Help Desk simulator fixtures.
 * All people, domains, devices, logs, and tickets are fictional. This file is
 * deliberately separate from the shared platform catalogue so the Help Desk
 * environment can evolve without changing portal/content architecture. */

const HD_ORG = {
  name: 'Northstar Distribution Group',
  domain: 'northstar.example',
  netbios: 'NORTHSTAR',
  timezone: 'Eastern Time',
  departments: ['Human Resources', 'Finance', 'Operations', 'Information Technology', 'Cybersecurity', 'Executive Office', 'Logistics', 'Sales', 'Customer Service', 'Marketing', 'Front Desk', 'Claims'],
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
  { id:'u-1010', employeeId:'E-39167', phone:'ext. 4966 · mobile 407-555-0187', name:'Dina Foster', username:'dfoster', email:'dina.foster@northstar.example', department:'Executive Office', title:'Executive Assistant', ou:'OU=Executive Office,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:9, groups:['GG-Executive-Users'], manager:'Evelyn Reed', mfa:'Registered' },
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
  { id:'u-1022', employeeId:'E-51274', phone:'ext. 4229', name:'Monica Hall', username:'mhall', email:'monica.hall@northstar.example', department:'Logistics', title:'Logistics Manager', ou:'OU=Logistics,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:27, groups:['GG-Logistics-Users','GG-Warehouse-Print'], manager:'Caleb Wright', mfa:'Registered' },
  { id:'u-1023', employeeId:'E-52146', phone:'ext. 4577', name:'Wes Turner', username:'wturner', email:'wes.turner@northstar.example', department:'Marketing', title:'Marketing Specialist', ou:'OU=Marketing,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:31, groups:['GG-Marketing-Users'], manager:'Owen Price', mfa:'Registered' },
  { id:'u-1024', employeeId:'E-53259', phone:'ext. 4339', name:'Priya Nair', username:'pnair', email:'priya.nair@northstar.example', department:'Sales', title:'Account Executive', ou:'OU=Sales,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:14, groups:['GG-Sales-Users','GG-CRM-Users'], manager:'Tara Singh', mfa:'Registered' },
  { id:'u-1025', employeeId:'E-54371', phone:'ext. 4502', name:'Karen Holt', username:'kholt', email:'karen.holt@northstar.example', department:'Executive Office', title:'Executive Assistant to the CFO', ou:'OU=Executive Office,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:22, groups:['GG-Executive-Users'], manager:'Martin Alvarez', mfa:'Registered' },
  { id:'u-1026', employeeId:'E-55484', phone:'ext. 4620', name:'Teresa Vance', username:'tvance', email:'teresa.vance@northstar.example', department:'Information Technology', title:'Messaging & Collaboration Lead', ou:'OU=IT,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:38, groups:['GG-IT-Users'], manager:'Morgan Lee', mfa:'Registered' },
  { id:'u-1027', employeeId:'E-56597', phone:'ext. 4631', name:'Jamie Ortiz', username:'jortiz', email:'jamie.ortiz@northstar.example', department:'Information Technology', title:'Collaboration Engineer', ou:'OU=IT,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:45, groups:['GG-IT-Users'], manager:'Teresa Vance', mfa:'Registered' },
  // Module 4 (key its-02): Ana Torres (ticket 4-D) and Theo Grant, a user only.
  { id:'u-1028', employeeId:'E-57612', phone:'ext. 4718 · works from home', name:'Ana Torres', username:'ana.torres', email:'ana.torres@northstar.example', department:'Claims', title:'Claims Processor', ou:'OU=Claims,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:17, groups:['GG-Claims-Users'], manager:'Caleb Wright', mfa:'Registered' },
  { id:'u-1029', employeeId:'E-58735', phone:'ext. 4233', name:'Theo Grant', username:'tgrant', email:'theo.grant@northstar.example', department:'Logistics', title:'Logistics Coordinator', ou:'OU=Logistics,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:5, groups:['GG-Logistics-Users'], manager:'Monica Hall', mfa:'Registered' },
  // Module 5 (key its-03): Lisa Park (ticket 5-B), a user only.
  { id:'u-1030', employeeId:'E-59846', phone:'ext. 4183', name:'Lisa Park', username:'lpark', email:'lisa.park@northstar.example', department:'Finance', title:'Financial Analyst', ou:'OU=Finance,OU=Users,DC=northstar,DC=example', enabled:true, locked:false, passwordAge:11, groups:['GG-Finance-Users'], manager:'Ava Robinson', mfa:'Registered' },
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
  { name:'NS-LT-0236', user:'Wes Turner', os:'Windows 11 Enterprise 24H2', ip:'10.20.70.236', ou:'OU=Marketing,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'7 minutes ago', health:'Disk warning' },
  { name:'NS-LT-0291', user:'Priya Nair', os:'Windows 11 Enterprise 24H2', ip:'10.20.40.191', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'2 minutes ago', health:'Healthy' },
  // Module 4 (key its-02) practice computers. NS-LT-0244 is a Service Desk
  // test laptop with no user, for Lab 4.3's peripheral steps.
  { name:'NS-LT-0205', user:'Grace Kim', os:'Windows 11 Enterprise 24H2', ip:'10.20.70.105', ou:'OU=Human Resources,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'3 minutes ago', health:'Healthy' },
  { name:'NS-LT-0183', user:'Omar Haddad', os:'Windows 11 Enterprise 24H2', ip:'10.20.40.183', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'6 minutes ago', health:'Healthy' },
  { name:'NS-WS-0101', user:'Ines Calder', os:'Windows 11 Enterprise 24H2', ip:'10.20.10.101', ou:'OU=Front Desk,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy' },
  { name:'NS-LT-0244', user:'Service Desk (test laptop)', os:'Windows 11 Enterprise 24H2', ip:'10.20.10.244', ou:'OU=IT,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'Now', health:'Driver warning' },
  // Module 5 (key its-03) computers
  { name:'NS-WS-0277', user:'Noah Williams', os:'Windows 11 Enterprise 24H2', ip:'10.20.40.77', ou:'OU=Sales,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'4 minutes ago', health:'Healthy' },
  { name:'NS-LT-0099', user:'Dina Foster', os:'Windows 11 Enterprise 24H2', ip:'10.20.50.99', ou:'OU=Executive Office,OU=Workstations', trust:'Healthy', bitlocker:'Recovery', lastSeen:'9 minutes ago', health:'BitLocker recovery' },
  { name:'NS-LT-0150', user:'Lisa Park', os:'Windows 11 Enterprise 24H2', ip:'10.20.20.150', ou:'OU=Finance,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'2 minutes ago', health:'Healthy' },
  { name:'NS-LT-0118', user:'Evan Parker', os:'Windows 11 Enterprise 24H2', ip:'10.20.20.118', ou:'OU=Finance,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'3 minutes ago', health:'Healthy' },
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
  // Module 4 (key its-02): direct-IP printers with no print server. Each PC
  // adds them by address (Standard TCP/IP); the addresses are in each
  // ticket's machine state (console.machines).
  { name:'NS-HR-LABEL01', server:'None (direct IP)', location:'HR · 2nd floor', driver:'Generic Label Printer', queue:0, status:'Ready', group:'GG-HR-Users' },
  { name:'RECEPTION-BADGE', server:'None (direct IP)', location:'Front Desk · lobby', driver:'Generic Label Printer', queue:0, status:'Ready', group:'GG-FrontDesk-Users' },
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
  { id:'KB-0064', title:'Outlook isn\'t sending: check Work Offline', category:'Messaging', updated:'2026-11-21', audience:'Service Desk', practiceOnly:true, keywords:'outlook not sending · outlook isn\'t sending · email not sending · emails stuck · Outbox · Working Offline · Work Offline · Send/Receive · Disconnected · new Outlook · proposal', summary:'1. Ask the user to look at the bottom of the Outlook window. If it says "Working Offline", Outlook has been switched to hold mail in the Outbox. 2. Classic Outlook: on the Send/Receive tab, the Work Offline button is highlighted. Have the user click it once to turn it off, then click Send/Receive All Folders. 3. New Outlook has no Work Offline button. If it shows "Disconnected", have the user sign out of Outlook and back in. If it still won\'t connect, escalate to Messaging & Collaboration. 4. Confirm: the Outbox empties, and a test email from the user reaches you. 5. Show the user where the button is, so they can fix it next time.' },
  { id:'KB-0066', title:'Replacement laptops: standard models, lead times and approval', category:'Hardware', updated:'2026-11-21', audience:'Service Desk', practiceOnly:true, keywords:'replacement laptop · laptop lead time · lead time · replacement · broken laptop · lost laptop · new laptop · executive laptop · standard model · non-standard model · 16-inch · approval · VIP · catalog item', summary:'1. A broken or lost laptop is an incident. The replacement is a request: open the catalog item for it from the incident and keep both records open. Set Requested for to the person who will use the device. 2. Standard models are kept in stock. Desktop Support sets one up in about 3 hours. Ask them before you tell the user a time: they set it. 3. A non-standard model needs the IT manager\'s approval on the request before it is ordered, and takes about 5 business days to arrive. Put that model on the request and set Approval to Requested. 4. Offer the standard model now and the non-standard one later if it is approved. 5. An executive\'s ticket gets the VIP flag and a faster response. The steps are the same: verify before any device handover (KB-0024), and approvals still apply.' },
  { id:'KB-0067', title:'Disk health warning on a laptop', category:'Hardware', updated:'2026-11-21', audience:'Service Desk', practiceOnly:true, keywords:'disk warning · disk health · Device health · health card · storage errors · slow laptop · laptop very slow · clicking noise · OneDrive backup · warm handoff', summary:'1. A disk health warning on a device\'s health card means the storage is reporting errors and may fail. Tier 1 doesn\'t repair it or run repair tools. 2. Check the card\'s OneDrive line: if the last backup isn\'t today, ask the user to stop saving new work to the laptop. 3. Escalate to Desktop Support (Tier 2) with the asset tag, when the slowness started and any deadline the user has. If the deadline is today, use a warm handoff. 4. Never promise a repair time: Desktop Support sets it.' },
  { id:'KB-0083', title:'Releasing a BitLocker recovery key', category:'Windows', updated:'2026-11-24', audience:'Service Desk', practiceOnly:true, keywords:'bitlocker · recovery key · BitLocker recovery · recovery screen · Key ID · blue screen asking for a key · enter the recovery key · Active Directory · BitLocker Recovery tab', summary:'Tier 1 may release a recovery key only this way. 1. Verify the caller with KB-0024 first, every time: call back on the number in the directory and confirm the employee ID. A deadline or a senior title doesn\'t change this. 2. Ask the user to read the Key ID on the recovery screen (the first 8 characters). 3. Open Active Directory › Computers, find the computer by its name and open its BitLocker Recovery tab. Find the stored key with the same Key ID. A device can hold more than one key. A key whose ID doesn\'t match won\'t work and is never read out. (Module 7 covers the rest of Active Directory, and Module 8 covers Entra.) 4. Read the 48-digit key aloud in groups of six while the user types it. Never send it by email, chat or text. 5. Confirm Windows loads. 6. In the work note, record that the key was released and its Key ID, never the key itself, and ask Desktop Support to rotate it. If the caller can\'t be verified, or no stored key matches: release nothing and escalate to Desktop Support.' },
  { id:'KB-0084', title:'Slow start-up: what to check and what Tier 1 may change', category:'Windows', updated:'2026-11-24', audience:'Service Desk', practiceOnly:true, keywords:'slow · startup · slow start · slow computer · slow pc · slow to start · slow to open · takes forever · freezing · Event ID 100 · boot time · Task Manager · startup apps · Software Catalog', summary:'1. Ask when it started and whether it is one device. 2. Measure it: Event Viewer › Applications and Services Logs › Microsoft › Windows › Diagnostics-Performance › Operational, Event ID 100, gives the last boot time. 3. Open Task Manager › Startup apps and read each app\'s publisher and startup impact. Tier 1 may disable a startup app the user doesn\'t need at sign-in; disabling doesn\'t uninstall it. 4. Check that each app is approved: the Software Catalog lists every approved app. An app that isn\'t in the catalog isn\'t approved. Disable its startup entry, uninstall it from Settings › Apps › Installed apps (never by deleting its files), and offer the user the approved alternative from the catalog. 5. Restart and read Event ID 100 again. 6. Resetting or reinstalling Windows is never a first step for a slow start. It is a Tier 2 decision after the lighter steps fail.' },
  { id:'KB-0090', title:'"You\'ve been signed in with a temporary profile"', category:'Windows', updated:'2026-11-24', audience:'Service Desk', practiceOnly:true, keywords:'temporary profile · blank desktop · signed in with a temporary profile · desktop is empty · shortcuts missing · default background · Outlook asking to set up · User Profile Service · 1511 · 1515', summary:'1. Tell the user their files are very likely still there, and ask them not to save new files or set up Outlook: anything saved in a temporary profile is lost at sign-out. 2. Confirm it: the notification, and Event Viewer › Windows Logs › Application, User Profile Service Event ID 1511 (often with 1515). 3. Tier 1 step: sign out and restart once. Sometimes the profile loads normally. 4. Confirm the data is safe: the user\'s folder under C:\\Users still holds their Desktop and Documents. 5. Still on a temporary profile: escalate to Desktop Support with the event IDs and the fact that the files are present. Profile registry repairs are Tier 2. Never delete the profile folder, and never reset the password: this is a profile problem, not an account problem.' },
  { id:'KB-0072', title:'Virtual desktop stuck on a black screen or spinner', category:'Virtual desktops', updated:'2026-11-23', audience:'Service Desk', practiceOnly:true, keywords:'virtual desktop · VDI · black screen · spinner · spinning circle · stuck · frozen · hung session · Disconnected · Log off session · pool · work desktop', summary:'1. A virtual desktop runs on a server. Restarting the user\'s laptop, or closing and reopening the window, doesn\'t restart it. 2. Check the pool first. If other sessions in the same pool are Active, it isn\'t a pool outage. If several users in one pool are stuck, stop: set Impact 2, link the tickets and escalate to Server & Identity. 3. One user, with a session shown as Disconnected or hung: tell them that unsaved work in that session may be lost, and get their OK. 4. Click Log off session on that user\'s session only. Never restart the pool or the host: that is a Tier 2 action that drops everyone. 5. Ask the user to reconnect, and confirm the desktop loads. 6. Record the consent and its time in the work note.' },
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
  // Module 3 Lab 3.2: each ticket runs on its own clock (console.now), so the
  // set has none. HD-2165 counts as done when it is Resolved; the other two
  // count as done by their rules (handed on, with the follow-up set).
  'its-11': { title:'Module 3 practice tickets', tickets:['HD-2165', 'HD-2166', 'HD-2167'], complete:['HD-2165', 'HD-2166', 'HD-2167'], queue:true, queueList:'all',
    done:{ 'HD-2166':[{ group:'Desktop Support (Tier 2)' }, { requestOpen:true }, { handoffNote:true }, { commentTime:true }, { followUp:true }],
      'HD-2167':[{ status:'Escalated' }, { teamMessage:'lead' }, { commentTime:true }, { followUp:true }] } },
  // Module 4 Lab 4.4: each ticket runs on its own clock (console.now). 4-B
  // (HD-2170) counts as done when it is with Desktop Support (Tier 2) and has
  // a complete work note; the other three when Resolved.
  'its-02': { title:'Module 4 practice tickets', tickets:['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'], complete:['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'], queue:true, queueList:'all',
    done:{ 'HD-2170':[{ group:'Desktop Support (Tier 2)' }, { note:true }] } },
  // Module 5 Lab 5.2: each ticket runs on its own clock (console.now). 5-A
  // (HD-2181) counts as done when it is with Desktop Support (Tier 2) and has a
  // complete work note; the other three when Resolved. HD-2187 and HD-2188 are
  // the related records 5-B links; they are not worked.
  'its-03': { title:'Module 5 practice tickets', tickets:['HD-2181', 'HD-2182', 'HD-2187', 'HD-2188', 'HD-2183', 'HD-2186'], complete:['HD-2181', 'HD-2182', 'HD-2183', 'HD-2186'], queue:true, queueList:'all', hideEventsFrom:['NS-LT-0081'],
    done:{ 'HD-2181':[{ group:'Desktop Support (Tier 2)' }, { note:true }] } },
};

// Coached ticket sets: Practice It content for a coach's guided lab, opened by
// the coach (not from a course page link). The work order groups are a
// practice answer for the guided lab, not a Prove It key.
const HD_COACHED_SETS = {
  'its-10-guided': { title:'Lab 2.1 · Guided Lab: queue shift', tickets:['HD-2158', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2162', 'SR-2161'], now:'2026-08-18T08:35:00Z', queue:true,
    workOrder:{ tickets:['HD-2158', 'HD-2159', 'HD-2160', 'SEC-2163', 'HD-2162', 'SR-2161'], groups:[['HD-2158'], ['HD-2159', 'HD-2160', 'SEC-2163'], ['HD-2162'], ['SR-2161']] } },
  // Module 3 Lab 3.1: one live call on a fixed clock (Wednesday 10:10).
  'its-11-guided': { title:'Lab 3.1 · Guided Lab: a frustrated caller', tickets:['HD-2164'], now:'2026-08-19T10:10:00Z' },
  // Module 4: Lab 4.3 (coach hd-m02) on Wednesday 09:15, and the virtual
  // desktop ticket that ends Lab 4.2 (coach hd-m02-server).
  'its-02-guided': { title:'Lab 4.3 · Guided Lab: printers and peripherals', tickets:['HD-2134'], now:'2026-08-19T09:15:00Z' },
  'its-02-server': { title:'Lab 4.2 · Guided Lab: snapshot, server and a virtual desktop', tickets:['HD-2173'], now:'2026-08-20T10:30:00Z' },
  // Module 5: Lab 5.1 (coach hd-m03) on Wednesday 10:30.
  'its-03-guided': { title:'Lab 5.1 · Guided Lab: the slow-computer sequence and system repair', tickets:['HD-2180'], now:'2026-08-19T10:30:00Z', hideEventsFrom:['NS-LT-0081'] },
};

// VM labs (ui/helpdesk.js "VM screen"): the simulated host, its install
// images and the coaches that turn the VM Manager on. The VMs themselves are
// the student's own, never listed here.
// targets: the settings each lab asks for, so the screen can name a setting
// that is off (practice feedback, not a score).
const HD_VM_LABS = {
  // Module 4 (key its-02) Labs 4.1 and 4.2.
  'its-02': {
    coaches:['hd-m02-vm', 'hd-m02-server'],
    host:{ name:'NS-SD-TRAIN01', ramGb:16, cores:8, cpu:'8-core training processor', virtualization:'Enabled' },
    images:[
      { id:'win11', label:'Windows 11 Enterprise (ISO)', kind:'client', minRamGb:4, os:'Windows 11' },
      { id:'winsrv', label:'Windows Server (ISO)', kind:'server', minRamGb:2, os:'Windows Server' },
    ],
    addresses:{ internal:{ 'NS-TEST-SRV':'10.0.5.10', 'NS-TEST-W11':'10.0.5.20' }, nat:'10.0.2.15', hostOnly:'192.168.56.', bridged:'10.20.99.' },
    modes:{
      NAT:'NAT: the VM reaches the internet through the host.',
      Bridged:'Bridged: it looks like another PC on the network.',
      Internal:'Internal: VMs talk only to each other.',
      'Host-only':'Host-only: VMs and the host only.',
    },
    targets:{
      'NS-TEST-W11':{ image:'win11', memoryGb:4, cores:2, diskGb:64, diskType:'dynamic' },
      'NS-TEST-SRV':{ image:'winsrv', memoryGb:4, cores:2, diskGb:64 },
    },
    shortcut:'Install notes',
    finishCards:[
      { title:'Sandbox a suspicious attachment', text:'Open it in a throwaway VM, never on a work PC. Then report it.' },
      { title:'Test an update', text:'Try a patch on a test VM, with a snapshot first, before it reaches users.' },
      { title:'A VDI desktop', text:'A user’s whole Windows desktop runs as a VM on a server (ticket 4-D).' },
      { title:'A cloud VM in Azure', text:'IaaS: the company rents the server and still manages its Windows.' },
    ],
  },
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

// Categories for the Module 3 tickets; each ticket adds its own CI list.
const HD_M03_CATEGORIES = {
  Hardware:['Laptop', 'Laptop – damage', 'Monitor'],
  Software:['Email (Outlook)', 'Browser', 'Phone app'],
  Request:['Hardware', 'Software', 'Access'],
  Messaging:['Shared calendar', 'Email'],
  Access:['Password reset', 'Account unlock'],
};
// Categories for the Module 4 (key its-02) tickets; each ticket adds its own CI list.
const HD_ITS02_CATEGORIES = {
  Hardware:['Printer', 'Docking station', 'Battery', 'Laptop', 'Monitor', 'Webcam'],
  Software:['Virtual desktop (VDI)', 'Email (Outlook)', 'Browser'],
  Network:['Wi-Fi', 'Wired port'],
  Request:['Hardware', 'Software', 'Access'],
  Access:['Password reset', 'Account unlock'],
};
// Categories for the Module 5 (key its-03) tickets; each ticket adds its own CI list.
const HD_ITS03_CATEGORIES = {
  Software:['Windows performance', 'Windows profile', 'OS crash (BSOD)', 'Encryption (BitLocker)', 'Email (Outlook)', 'Browser'],
  Hardware:['Laptop', 'Docking station', 'Monitor', 'Printer'],
  Network:['Wi-Fi', 'Wired port'],
  Request:['Hardware', 'Software', 'Access'],
  Access:['Password reset', 'Account unlock'],
};
// The Software Catalog on a Module 5 computer: the apps the company approves.
const HD_ITS03_CATALOG = [
  { name:'Microsoft Teams', publisher:'Microsoft Corporation' },
  { name:'Microsoft OneDrive', publisher:'Microsoft Corporation' },
  { name:'LumenCam Companion', publisher:'Lumen Devices Ltd.' },
  { name:'Windows Security', publisher:'Microsoft Corporation' },
  { name:'Microsoft Edge', publisher:'Microsoft Corporation' },
  { name:'Microsoft Outlook', publisher:'Microsoft Corporation' },
  { name:'Microsoft Word', publisher:'Microsoft Corporation' },
  { name:'Microsoft Excel', publisher:'Microsoft Corporation' },
  { name:'Google Chrome', publisher:'Google LLC' },
  { name:'7-Zip', publisher:'7-Zip project' },
  { name:'Northstar VPN Client', publisher:'Northstar IT' },
  { name:'Northstar CRM', publisher:'Northstar IT' },
];
// Module 3: a customer comment must name a time (a clock time or am/pm), and a
// fix time Tier 1 does not control ("fixed by 3") is flagged. Regex sources.
// A time the user will hear back: a clock time ("11:30", "3 p.m.") or a
// short interval ("in 30 minutes", "within an hour").
const HD_M03_TIME = '\\b\\d{1,2}:\\d{2}\\b|\\b\\d{1,2}\\s*(a\\.?m\\b\\.?|p\\.?m\\b\\.?)|\\b(in|within)\\s+(an?|\\d{1,3})\\s*(minutes?|mins?|hours?)\\b';
const HD_M03_PROMISE = '\\b(fixed|working|ready|repaired|done)\\s+by\\s+\\d';
// 3-B only: a time promised for the 16-inch model, inside one clause. The
// standard model's 8:00 is Desktop Support's own time, so a plain "ready by
// 8:00" is not a promise here. It would rather miss a promise than flag an
// honest sentence ("I can't promise the 16-inch by 8:00").
const HD_M03_GAP_16 = '(?:(?!standard|approv|stock|\\bnot\\b|n[\'’]t\\b|cannot|unable|unavailable|request|update|call you|\\bbut\\b|\\bso\\b|\\band\\b|,)[^.;!?\\n])*';
const HD_M03_PROMISE_16 = `(?:^|[.;!?,\\n])${HD_M03_GAP_16}16[- ]?inch${HD_M03_GAP_16}\\b(by|before|for|at)\\s+(\\d|tomorrow|tonight)`;

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
  hdTicket({ id:'HD-2109', ownSet:true, requester:'Noah Williams', department:'Sales', category:'Incident', subcategory:'Windows profile', priority:'P3', businessImpact:'Sales user cannot access normal desktop', sla:'2 business days', createdMinutesAgo:167, description:'Windows signed me into a blank desktop and my shortcuts are missing.', symptoms:['Temporary profile notification','Another user signs in normally'], logs:['User Profile Service 1511: logged on with temporary profile'], systemState:['C:\\Users\\nwilliams exists','Profile registry entry ends in .bak'], plausibleCauses:['Cloud sync issue','Corrupt profile mapping','Malware'], correctPath:['Protect user data','Confirm temporary-profile evidence','Repair or rebuild per runbook','Restore data','Verify sign-in'], hiddenRootCause:'Corrupt ProfileList registry mapping after interrupted update.', expectedResolution:'Repair/rebuild the profile using the approved runbook and verify data and application access.', escalationCriteria:['Encrypted data inaccessible','Repeated corruption or compromise indicators'] }),
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
  // Module 3 Practice It. Lab 3.1 (coach, HD_COACHED_SETS 'its-11-guided') is
  // one live call; Lab 3.2 (HD_PRACTICE_SETS 'its-11') is three tickets, each
  // on its own clock (console.now). Worked with the communication features in
  // ui/helpdesk.js. No typed commands. Practice feedback only, never points.
  hdTicket({ id:'HD-2164', ownSet:true, number:'INC0010440', requester:'Wes Turner', department:'Marketing', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T10:10:00Z', shortDescription:'Laptop very slow',
    description:'Laptop very slow. The caller is on the line.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{}, classify:{ categories:HD_M03_CATEGORIES, cis:['NS-LT-0236', 'NS-LT-0291', 'NS-LT-0215', 'Marketing shared drive'] },
      priorityCoach:{ impact:'3', urgency:'1', line:'Wes is angry, and that isn\'t what makes this urgent. The 3:00 deadline is. One person (Impact 3) whose work has stopped with a deadline today (Urgency 1): P3.' },
      kb:true,
      conversation:{ name:'Wes Turner', style:'phone', mood:'Frustrated', stages:[
        { id:'greet', prompt:'Answer the call.', choices:[
          { id:'greeting', text:'Northstar Service Desk, this is Riley. May I have your name and a number to reach you if we get cut off?', pass:true, mood:0, reply:'Wes Turner, Marketing. Extension 4577.', line:'A professional start: he knows who he reached.' },
          { id:'it', text:'IT.', line:'He doesn\'t know who he reached or whether you\'re the right person.' },
          { id:'ticket', text:'Service Desk. What\'s your ticket number?', line:'He doesn\'t have a ticket yet. Start with who he is and how to reach him.' },
        ] },
        { id:'rant', prompt:'Let him finish, then acknowledge.', messages:[
          'Finally. My laptop has been crawling since Monday. Every file takes minutes to open.',
          'I restarted it twice myself and it\'s no better. I\'ve lost two days on this.',
          'I\'ve got trade-show brochure files due at the print vendor by 3:00 today and I can\'t even open them. I need this fixed now.',
        ], gapSeconds:4, interruptLine:'He hadn\'t finished. Let him get it all out first.', choices:[
          { id:'empathy', text:'Wes, two days of this with a 3:00 deadline is a lot. I\'m sorry it\'s dragged on. Let\'s get it moving.', pass:true, mood:-1, line:'He hears that you understand the impact, and that something will happen next.' },
          { id:'calm-down', text:'Sir, I need you to calm down so I can help you.', line:'"Calm down" tells him his reaction is the problem. Name the impact instead.' },
          { id:'defensive', text:'Nobody reported this to us until today.', line:'True or not, it\'s blame. He needs to hear what happens next.' },
          { id:'jargon', text:'It\'s probably disk I/O or a bad update. I\'ll check the SMART data.', line:'He hears words he doesn\'t know and still no acknowledgement.' },
        ] },
      ] },
      caller:{ name:'Wes Turner', style:'phone', questions:[
        { id:'when', text:'When did it start?', reply:'Monday morning. It was fine on Friday.' },
        { id:'changed', text:'Did anything change, like new software or a new device?', reply:'Nothing. I haven\'t installed anything. It does make a clicking noise sometimes.' },
        { id:'impact', text:'How is it affecting your work?', reply:'Everything takes minutes. The brochure files are due at the print vendor at 3:00 today and I can\'t work on them.' },
      ] },
      intake:{ caller:true, callback:true },
      hold:{ seconds:120, ask:'May I put you on a short hold while I check your laptop\'s health record?', askReply:'Fine. Be quick.', back:'Thanks for holding, Wes.', unaskedLine:'You put him on hold without asking. Ask first, then hold.', overLine:'Two minutes of silence feels much longer to the person waiting.' },
      evidence:[{ id:'device-health', title:'Device health · NS-LT-0236', rows:[
        { label:'Disk health', value:'Warning. This laptop’s storage is reporting errors and may fail.' },
        { label:'OneDrive', value:'Last backed up today 09:40' },
      ] }],
      explain:{ prompt:'Tell Wes the next step in plain words.', words:['SMART', 'S.M.A.R.T.', 'I/O', 'sector', 'SSD', 'HDD', 'reimage', 'image', 'Tier 2', 'escalate', 'escalating', 'P3', 'SLA', 'KB'], line:'He won\'t know \'{term}\'. Say what it means for him.', goodLine:'Plain words: he knows what is wrong and what happens next.' },
      handoff:{}, warmHandoff:true, followUp:{ jump:true },
      comments:{ timeCheck:{ time:HD_M03_TIME, promise:HD_M03_PROMISE, promiseLine:'That\'s a fix time, and Desktop Support controls it. Commit to when you\'ll update him.', noTimeLine:'Tell him when he\'ll hear from you next.', moodDown:true, goodLine:'He knows who has it and when he will hear from you.' } },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['SMART', 'I/O', 'SSD', 'HDD', 'reimage', 'Tier 2', 'P3', 'SLA', 'KB-0067', 'escalate', 'escalating', 'escalated'] },
    } }),
  hdTicket({ id:'HD-2165', ownSet:true, number:'INC0010447', requester:'Priya Nair', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-20T13:02:00Z', shortDescription:'NOTHING WORKS!!!!',
    description:'My email isn\'t sending, nothing is going out and I have a proposal due to a client by 2pm. I don\'t have time for this. Why does IT keep breaking my computer??',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      now:'2026-08-20T13:12:00Z', matrix:{}, classify:{ categories:HD_M03_CATEGORIES, cis:['NS-LT-0291', 'Outlook', 'NS-LT-0215'], preset:{ contactType:'Email' } },
      priorityCoach:{ impact:'3', urgency:'1', line:'However angry the email is, it stays a P3. One person is affected (Impact 3), and the client deadline this afternoon makes it urgent (Urgency 1).' },
      kb:true,
      caller:{ name:'Priya Nair', style:'phone', questions:[
        { id:'outbox', text:'Is anything sitting in your Outbox?', reply:'Yes, four emails, including the proposal.' },
        { id:'status', text:'What does the bottom of the Outlook window say?', reply:'Working Offline.' },
        { id:'receive', text:'Can you receive email?', reply:'Nothing new since this morning.' },
      ] },
      actions:[
        { id:'acknowledge', text:'Say: "Priya, I can hear this is really frustrating with a 2 o\'clock deadline. Let\'s get your email moving right now."', feedback:'Priya: "Okay. Thank you. What do you need me to do?" She heard that you understand the deadline, with no blame.', history:'Acknowledged the 14:00 deadline on the call (CALM).' },
        { id:'work-offline', text:'Ask Priya to click Send/Receive › Work Offline, then Send/Receive All Folders', feedback:'Priya: “They\'re going! The Outbox is empty.”', history:'Asked Priya to turn off Work Offline, then Send/Receive All Folders, per KB-0064.' },
        { id:'test-email', text:'Please send me a test email', feedback:'Sent. A test email from Priya shows on the ticket.', history:'Priya sent a test email, and it arrived.' },
        { id:'blame', text:'Tell Priya the problem is something she clicked', critical:true, feedback:'Critical error. Never tell a caller the problem is their fault. Priya has a real deadline. Acknowledge it, then check Outlook with her.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['P1', 'P2', 'P3', 'SLA', 'Tier 1', 'Tier 2', 'CI', 'KB-0064'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P3', missing:'Set Impact 3 (one person) and Urgency 1 (a client deadline this afternoon). That makes the ticket P3.' }], good:'The priority is P3, and it stays P3 however angry the email is.', fix:'Set Impact 3 (one person) and Urgency 1 (a client deadline this afternoon). The ticket is P3. Anger does not raise it to P1.' },
        { area:'Investigation', checks:[{ kb:'KB-0064', missing:'Search the KB for "outlook not sending" and open KB-0064.' }, { chat:['outbox', 'status'], missing:'Ask Priya what is in her Outbox and what the bottom of the Outlook window says.' }], good:'You used KB-0064 and asked about the Outbox and the Outlook status bar.', fix:'Search the KB for "outlook not sending", open KB-0064, and ask Priya about her Outbox and the bottom of the Outlook window.' },
        { area:'Diagnosis', checks:[{ chat:['status'], missing:'Ask Priya what the bottom of the Outlook window says. "Working Offline" is the cause.' }], good:'The status bar said "Working Offline". That is why the mail was held in the Outbox.', fix:'Ask Priya what the bottom of the Outlook window says. "Working Offline" holds mail in the Outbox.' },
        { area:'Action', checks:[{ action:'work-offline', missing:'Ask Priya to turn off Work Offline, then Send/Receive All Folders (KB-0064).' }, { action:'test-email', missing:'Ask Priya for a test email to confirm it is fixed.' }, { status:'Resolved', missing:'Resolve the ticket once the test email arrives and Priya confirms.' }], good:'You fixed it with KB-0064, confirmed it with a test email, and resolved the ticket.', fix:'Follow KB-0064: turn off Work Offline, run Send/Receive All Folders, confirm with a test email, then resolve the ticket.' },
        { area:'Documentation', checks:[{ action:'acknowledge', missing:'On the call, acknowledge her deadline first (CALM), with no blame for "Why does IT keep breaking my computer??".' }, { note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { comment:true, missing:'Write a comment for Priya in plain words, with no internal terms.' }], good:'You used CALM on the call, wrote a complete work note and a plain-words comment for Priya.', fix:'Write a Reported / Tried / Result note. In your comment, say what was wrong, show where the button is and say sorry for the stress, with no blame.' },
      ],
    } }),
  hdTicket({ id:'HD-2166', ownSet:true, number:'INC0010455', requester:'Karen Holt', department:'Executive Office', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-20T10:50:00Z', shortDescription:'NEW LAPTOP FOR MR. ALVAREZ – TOMORROW',
    description:'Mr. Alvarez (CFO) dropped his laptop this morning. He needs a brand-new one set up with everything by 8am tomorrow, and he\'d like the new 16-inch model, not the standard one. Please confirm.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      now:'2026-08-20T11:05:00Z', vip:true, matrix:{}, classify:{ categories:HD_M03_CATEGORIES, cis:['Executive laptop (Martin Alvarez)', 'NS-LT-0215', 'NS-WS-0204'], preset:{ contactType:'Email' } },
      priorityCoach:{ impact:'2', urgency:'2', line:'An executive\'s laptop affects the people who depend on his work, so Impact is 2. He has a desktop PC in his office he can use today, so Urgency is 2. The VIP flag gets him a faster response, not a higher priority than the facts give.' },
      kb:true,
      verification:{ prompt:'Karen Holt emailed to ask for a replacement laptop for the CFO. How do you verify it\'s really Karen before a device is handed over? (KB-0024)', options:[
        { id:'name', text:'Accept it: the email is from Karen\'s address and names the CFO', critical:true, feedback:'Critical error. An email address and a name are not verification. KB-0024: call Karen back on the number in the User Directory and confirm her employee ID.' },
        { id:'callback', text:'Call Karen back on the number in the User Directory and confirm her employee ID', pass:true, feedback:'Verified. You called Karen back on ext. 4502 from the User Directory, and Karen confirmed employee ID E-54371.', history:'Identity verified per KB-0024: called Karen back on the User Directory number (ext. 4502); employee ID E-54371 confirmed.' },
      ] },
      caller:{ name:'Karen Holt', style:'phone', questions:[
        { id:'on', text:'Does the laptop still turn on?', reply:'It turns on, but the screen stays black.' },
        { id:'glass', text:'Is any glass loose?', reply:'No.' },
        { id:'files', text:'Are his files saved somewhere other than the laptop?', reply:'Everything\'s in OneDrive.' },
        { id:'desktop', text:'Can Mr. Alvarez work on another computer today?', reply:'Yes, he has a desktop PC in his office he can use today.' },
      ] },
      evidence:[{ id:'stock', title:'Hardware stock', rows:[
        { label:'Standard executive laptop', value:'3 in stock' },
        { label:'16-inch model', value:'Not stocked' },
      ] }],
      convert:{ keepIncident:true, number:'RITM0010101', items:[
        { name:'Executive laptop replacement', approver:'IT manager', fields:[
          { id:'model', label:'Model', options:['Standard executive laptop', '16-inch model'] },
          { id:'approval', label:'Approval', options:['Requested', 'Not needed'] },
        ] },
      ] },
      teamMessages:[{ id:'desk', to:'Desktop Support (Tier 2)', from:'Desktop Support', text:'Can you set up a standard executive laptop for 8:00 tomorrow?', reply:'Yes. It\'ll be ready by 7:30.' }],
      actions:[
        { id:'order-16', text:'Order the 16-inch model now', critical:true, feedback:'Critical error. A non-standard model needs the IT manager\'s approval on the request before it is ordered (KB-0066).' },
      ],
      handoff:{}, followUp:{},
      comments:{ timeCheck:{ time:HD_M03_TIME, promise:HD_M03_PROMISE_16, promiseCritical:'Promised Karen a time for the 16-inch model', promiseLine:'Critical error in a real shift: the 16-inch model isn\'t in stock and needs approval, so never promise a time for it.', noTimeLine:'Tell Karen when she will hear from you next.' } },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['RITM', 'Tier 2', 'SLA', 'P3', 'KB-0024', 'KB-0066', 'catalog item'] },
      feedback:[
        { area:'Triage', checks:[{ converted:true, missing:'Open the request "Executive laptop replacement" from the incident.' }, { requestOpen:true, missing:'Keep both records open: the incident for the broken laptop and the request for the new one.' }, { requestFor:'Martin Alvarez', missing:'Set Requested for to Martin Alvarez: the laptop is for him, not for Karen.' }, { priority:'P3', missing:'Set Impact 2 and Urgency 2 from the facts: P3. The VIP flag speeds the response; it does not raise the priority.' }], good:'Two records, both open: the incident for the broken laptop and the request for the new one.', fix:'A broken laptop is an incident. The replacement is a request. Open the request from the incident and keep both records open (KB-0066).' },
        { area:'Investigation', checks:[{ verified:true, missing:'Verify Karen first: call her back on her directory number and confirm her employee ID (KB-0024).' }, { evidence:'stock', missing:'Open the Hardware stock card to see what is in stock.' }, { kb:'KB-0066', missing:'Search the KB for "replacement laptop" and open KB-0066.' }], good:'You verified Karen before any handover, checked the stock and used KB-0066.', fix:'Verify Karen first (KB-0024), open the Hardware stock card, and search the KB for "replacement laptop" (KB-0066).' },
        { area:'Diagnosis', checks:[{ chat:['on', 'glass', 'files'], missing:'Ask Karen whether it still turns on, whether any glass is loose, and whether his files are saved in OneDrive (KB-0071).' }], good:'You asked the damaged laptop questions: it turns on, no loose glass, and his files are in OneDrive.', fix:'Ask Karen whether the laptop still turns on, whether any glass is loose, and whether his files are saved somewhere other than the laptop (KB-0071).' },
        { area:'Action', checks:[{ requestField:{ id:'model', value:'16-inch model' }, missing:'Put the 16-inch model Karen asked for on the request, so the IT manager can approve it.' }, { requestField:{ id:'approval', value:'Requested' }, missing:'Set Approval to Requested on the request. The 16-inch model needs the IT manager\'s approval.' }, { teamMessage:'desk', missing:'Message Desktop Support and ask whether a standard laptop can be ready by 8:00. They set the time, not you.' }, { group:'Desktop Support (Tier 2)', missing:'Assign the incident to Desktop Support (Tier 2).' }, { followUp:true, missing:'Set a Follow-up for tonight, to confirm the laptop is ready.' }], good:'You asked for approval on the 16-inch model, got the 8:00 from Desktop Support, assigned the incident and set a follow-up.', fix:'Ask for the IT manager\'s approval on the 16-inch model, message Desktop Support for the 8:00, assign the incident to Desktop Support (Tier 2) and set a Follow-up for tonight.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { comment:true, missing:'Write a comment for Karen in plain words, with no internal terms.' }, { commentPattern:'desktop team|confirmed', missing:'Say in your comment that the desktop team confirmed the time. The 8:00 is theirs, not yours.' }], good:'A complete note, and a comment that says the desktop team confirmed the time.', fix:'Write a Reported / Tried / Result note. In your comment, say the desktop team confirmed the time, and say when Karen will hear from you next.' },
      ],
    } }),
  hdTicket({ id:'HD-2167', ownSet:true, number:'INC0010388', requester:'Sofia Martin', department:'Operations', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T09:30:00Z', status:'Escalated', assignmentGroup:'Messaging & Collaboration', assignedTechnician:'Unassigned', shortDescription:'Shared calendar not updating',
    description:'Our shared calendar is not updating for the shift team.',
    notes:[{ time:'Tue 09:50', author:'Riley Morgan (Tue)', text:'Reported: the shared calendar is not updating for the shift team. Tried: checked with Sofia that it is still wrong after a restart; nothing more Tier 1 can do. Result: escalated to Messaging & Collaboration. Next action: Messaging & Collaboration finds the cause and updates Sofia.' }],
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      now:'2026-08-20T10:20:00Z', matrix:{ impact:'3', urgency:'2', respondedAt:'2026-08-18T09:50:00Z' },
      conversation:{ name:'Sofia Martin', style:'chat', stages:[
        { id:'chat', messages:['I opened a ticket TWO DAYS ago about my shared calendar and someone said it went to another team. Nobody has called me. Does anyone actually work there??'], choices:[
          { id:'quick', text:'Checking now.', pass:true },
          { id:'wait', text:'I\'ll look at it when I\'m free.', line:'She has waited two days already. Answer fast, even if the answer is just "checking now".' },
        ] },
        { id:'ack', choices:[
          { id:'sorry', text:'Sofia, you\'re right to chase this. Two days without an update isn\'t good enough. Let me find out where it is right now.', pass:true },
          { id:'slow', text:'That team is always slow, sorry.', line:'Never blame colleagues. Say sorry for the wait and say what you will do.' },
        ] },
      ] },
      teamMessages:[{ id:'lead', to:'Messaging & Collaboration', from:'Teresa Vance', text:'INC0010388 has had no owner for two days and the user is chasing. Can someone pick it up today?', reply:'Sorry, that one slipped. Jamie Ortiz has it now and will call her by 3:00.', assign:'Jamie Ortiz' }],
      duplicateMove:{ text:'Create new incident', feedback:'Critical error in a real shift: a second ticket splits the history and restarts the clock. INC0010388 already exists: add her chat to it.' },
      followUp:{},
      comments:{ timeCheck:{ time:HD_M03_TIME, promise:HD_M03_PROMISE, promiseLine:'A fix time is not yours to promise. Say who has the ticket and when they will call.', noTimeLine:'Tell Sofia when she will hear from the team.' } },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Tier 1', 'Tier 2', 'SLA', 'P3', 'P4'] },
      feedback:[
        { area:'Triage', checks:[{ status:['Escalated'], missing:'Work on the existing ticket, INC0010388. Do not open a new incident.' }, { call:true, missing:'Answer Sofia\'s chat on INC0010388, her existing ticket.' }], good:'You used the existing ticket, INC0010388, so the history stays in one place.', fix:'Sofia already has a ticket: INC0010388. Add her chat to it. A second ticket splits the history and restarts the clock.' },
        { area:'Investigation', checks:[{ call:true, missing:'Reply to Sofia in the chat. Answer fast, then acknowledge her.' }], good:'You answered fast and acknowledged her without blaming anyone.', fix:'Reply to Sofia quickly in the chat, then acknowledge the wait. Never blame the other team.' },
        { area:'Diagnosis', checks:[{ notePattern:'no (person|owner|assignee|engineer|one)|not assigned|not to (a|any) (person|one)|no (work )?notes since|unassigned|group (only|with no)|only (to )?the group', missing:'Say in your note that the ticket is with the group but has no person, and that nothing was written since it was escalated.' }], good:'You wrote what stalled it: the ticket sat with the group and had no owner.', fix:'Check the record. The ticket is with the group but has no person, and nothing was written since it was escalated. Say so in your note.' },
        { area:'Action', checks:[{ teamMessage:'lead', missing:'Message the Messaging & Collaboration lead and ask them to pick the ticket up today.' }, { followUp:true, missing:'Set a Follow-up for 15:15 today, to check that the call happened.' }], good:'You chased the team lead, got an owner and a time, and set a follow-up.', fix:'Message the Messaging & Collaboration lead and ask for an owner and a time. Then set a Follow-up for 15:15 to check the call happened.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { commentTime:true, missing:'Tell Sofia in a comment who has the ticket and when she will hear from them.' }, { commentPattern:'sorry|apolog', missing:'Say sorry in your comment, without blaming anyone.' }], good:'A complete note, and a comment that says sorry and gives Sofia a time.', fix:'Write a Reported / Tried / Result note. In your comment, say sorry without blaming anyone, say who has the ticket and say when Sofia will hear from them.' },
      ],
    } }),
  // Module 4 (key its-02) Practice It. Lab 4.3 (coach hd-m02, HD_COACHED_SETS
  // 'its-02-guided') is HD-2134; Lab 4.2 ends with HD-2173 ('its-02-server');
  // Lab 4.4 (HD_PRACTICE_SETS 'its-02') is tickets 4-A to 4-D. Each ticket's
  // computers are in console.machines and its virtual desktops in
  // console.vdi (ui/helpdesk.js "Machine-state console features").
  // expectedResolution holds the model work note. Practice feedback only,
  // never points: critical errors are feedback here, never a score.
  hdTicket({ id:'HD-2134', ownSet:true, number:'INC0010470', requester:'Priya Shah', department:'Human Resources', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T09:12:00Z', shortDescription:'Nothing will print',
    description:'Nothing will print from my computer. I get a print spooler error. I tried three times.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: nothing prints from NS-LT-0094; print spooler error; tried three times. Tried: other HR users print to NS-HR-MFP01, so only this PC; Get-PrintJob showed four jobs, the first (Benefits_Guide.pdf, 612 pages) in Error; with Priya\'s OK cancelled it, stopped the spooler, cleared the stuck job and started the spooler; unticked Use Printer Offline; the printer answered on port 9100. Result: test page printed; Priya confirmed her other three documents printed.',
    console: {
      matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['NS-LT-0094', 'NS-PRINT01', 'NS-HR-MFP01', 'NS-HR-LABEL01', 'NS-LT-0244'] },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3). Her printing is blocked, but nothing in the ticket gives a deadline (Urgency 2): P4.' },
      kb:true,
      caller:{ name:'Priya Shah', style:'chat', questions:[
        { id:'others', text:'Can anyone else in HR print to NS-HR-MFP01?', reply:'Everyone else is printing fine.' },
        { id:'cancel', text:'Your 612-page Benefits Guide is stuck and blocking the others. May I cancel that job?', reply:'Yes, cancel it.' },
        { id:'resend', text:'Your other three documents should print now. Could you check they came out of the printer?', afterAction:'printer-offline-off', replyBefore:'Nothing has come out yet. Is the printer working now?', reply:'All three have come out of the printer. Thank you!' },
      ] },
      evidence:[{ id:'printservice', title:'Event Viewer · PrintService · NS-LT-0094', rows:[
        { label:'Event 372', value:'PrintService 372 on NS-LT-0094: job 18 (Benefits_Guide.pdf, 612 pages) failed to render' },
        { label:'Print Spooler', value:'Local spooler restarted itself 3 times since 09:10' },
      ] }],
      machines:{
        'NS-LT-0094':{
          computer:{ ip:'10.20.70.94', health:'Healthy' },
          spooler:'Running',
          ports:[{ name:'IP_10.20.70.20', type:'Standard TCP/IP', address:'10.20.70.20' }],
          driverCatalog:['Universal PCL 6 v4.2', 'Generic Label Printer', 'Generic / Text Only'],
          reachable:{ '10.20.70.20':[9100], '10.20.70.51':[9100] },
          printQueues:{
            'NS-HR-MFP01':{ port:'IP_10.20.70.20', driver:'Universal PCL 6 v4.2', drivers:['Universal PCL 6 v4.2'], media:'Letter', mediaSizes:['Letter', 'A4', 'Legal'], offline:true, paused:false,
              jobs:[
                { id:18, document:'Benefits_Guide.pdf', pages:612, owner:'Priya Shah', status:'Error', stuck:true },
                { id:19, document:'Offer_Letter_Draft.docx', pages:2, owner:'Priya Shah', status:'Spooling' },
                { id:20, document:'Interview_Schedule.xlsx', pages:1, owner:'Priya Shah', status:'Spooling' },
                { id:21, document:'Onboarding_Checklist.pdf', pages:3, owner:'Priya Shah', status:'Spooling' },
              ] },
          },
        },
        'NS-LT-0244':{
          devices:[
            { id:'camera', category:'Cameras', name:'Integrated Camera', camera:true, status:'43', problem:'Windows has stopped this device because it has reported problems. (Code 43)', driver:{ provider:'Northstar Imaging', date:'yesterday', version:'10.0.26100.512' }, previous:{ provider:'Northstar Imaging', date:'3 months ago', version:'10.0.26100.388' } },
            { id:'keyboard', category:'Keyboards', name:'Standard PS/2 Keyboard', status:'OK', driver:{ provider:'Microsoft', date:'last year', version:'10.0.26100.1' } },
            { id:'audio', category:'Sound, video and game controllers', name:'Realtime High Definition Audio', status:'OK', driver:{ provider:'Realtime Audio', date:'2 months ago', version:'6.0.9601.1' } },
            { id:'wifi', category:'Network adapters', name:'Wireless Network Adapter AX211', status:'OK', driver:{ provider:'Northstar Networks', date:'4 months ago', version:'23.60.0.10' } },
          ],
          dock:{ name:'Service Desk test dock', power:true, docked:false, peripherals:['Keyboard', 'Mouse'],
            monitors:[{ id:'left', name:'Monitor 1', cable:'DisplayPort', input:'DisplayPort', inputs:['HDMI', 'DisplayPort'] }, { id:'right', name:'Monitor 2', cable:'HDMI', input:'HDMI', inputs:['HDMI', 'DisplayPort'], needsDetect:true }] },
          projection:'PC screen only',
        },
      },
      actions:[
        { id:'server-spooler', text:'Restart the Print Spooler on the print server NS-PRINT01 and clear its NS-HR-MFP01 queue', critical:true, feedback:'Critical error. Only Priya is affected, and the stuck job is in her own laptop\'s queue. Restarting or clearing the print server\'s spooler stops printing for everyone on it. Fix it on her laptop.', history:'Restarted the print server\'s spooler for a one-user issue.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['spooler', 'Print Spooler', 'Get-PrintJob', 'Test-NetConnection', '9100', 'NS-HR-MFP01', 'NS-LT-0094', 'NS-PRINT01', 'PowerShell', 'Tier 1', 'Tier 2', 'P4', 'SLA'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P4', missing:'Set Impact 3 (one person) and Urgency 2 (printing is blocked, with no deadline in the ticket). That makes the ticket P4.' }], good:'The priority is P4: one person, printing blocked, no deadline.', fix:'Set Impact 3 (one person) and Urgency 2 (no deadline in the ticket). The ticket is P4.' },
        { area:'Investigation', checks:[{ chat:['others'], missing:'Ask Priya whether anyone else in HR can print. One user and her own job means Tier 1 fixes it on her laptop.' }, { evidence:'printservice', missing:'Open the PrintService log card on the ticket.' }], good:'You checked the scope first: only Priya is affected, and the log names job 18.', fix:'Ask Priya whether anyone else in HR can print, and open the PrintService log card.' },
        { area:'Diagnosis', checks:[{ chat:['cancel'], missing:'Ask Priya whether you may cancel her 612-page job before you change anything.' }, { action:'job-cancel', missing:'In the print queue window, cancel job 18 (Benefits_Guide.pdf, 612 pages). It stays "Deleting": the spooler can\'t cancel it.' }], good:'One very large job in Error blocked everything behind it, and it would not cancel.', fix:'Get-PrintJob shows job 18 in Error with three jobs behind it. Ask Priya, then cancel it in the print queue window.' },
        { area:'Action', checks:[{ action:'spooler-stop', missing:'Run Stop-Service Spooler.' }, { action:'job-clear-stuck', missing:'With the spooler stopped, click Clear stuck job in the print queue window.' }, { action:'spooler-start', missing:'Run Start-Service Spooler.' }, { action:'printer-offline-off', missing:'In the queue\'s Printer menu, untick Use Printer Offline.' }, { action:'test-page', missing:'Print a test page to check the printer.' }, { chat:['resend'], missing:'Ask Priya to check that her other three documents printed.' }], good:'You worked in the right order: cleared the stuck job with the spooler stopped, put the printer back online, printed a test page and confirmed with Priya.', fix:'Stop the spooler, clear the stuck job, start the spooler, untick Use Printer Offline, print a test page and ask Priya to confirm her documents printed.' },
        { area:'Right owner', checks:[{ status:'Resolved', missing:'Only one user and her own job: L1 can fix this locally. Escalation is for print-server-wide impact.' }], good:'You fixed it at Tier 1: one user and her own job.', fix:'Only one user and her own job: L1 can fix this locally. Escalation is for print-server-wide impact.' },
        { area:'Printers and peripherals', checks:[{ printerInstalled:{ computer:'NS-LT-0094', printer:'NS-HR-LABEL01' }, missing:'In Settings › Printers & scanners, add NS-HR-LABEL01 by address: Standard TCP/IP, 10.20.70.51.' }, { action:'driver-rollback', missing:'On NS-LT-0244, open Device Manager › Integrated Camera › Driver and click Roll Back Driver.' }, { action:'camera-checked', missing:'Open the Camera app on NS-LT-0244 to check that it shows video.' }, { action:'projection', missing:'Dock NS-LT-0244, then press Win + P › Extend.' }, { action:'display-detect', missing:'In Settings › Display, click Detect so the second monitor shows.' }], good:'You added the label printer by its address, rolled back the camera driver and set up both monitors.', fix:'Add NS-HR-LABEL01 by address, roll back the camera driver on NS-LT-0244, then dock it, press Win + P › Extend and click Detect.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result work note.' }, { comment:true, missing:'Write a comment for Priya in plain words, with no internal terms.' }, { code:'Solution provided', missing:'Choose the resolution code Solution provided.' }], good:'A complete work note, a plain-words comment and the right resolution code.', fix:'Write a Reported / Tried / Result note and a plain-words comment, for example: "Hi Priya, you can print again. One very large file, the 612-page Benefits Guide, got stuck and blocked everything behind it. I cleared it with your OK, and your other three documents have printed. For the guide, try sending it a section at a time, and tell us if it sticks again. – Riley"' },
      ],
    } }),
  hdTicket({ id:'HD-2173', ownSet:true, number:'INC0010471', requester:'Leah Brooks', department:'Marketing', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-20T10:24:00Z', shortDescription:'Virtual desktop stuck on a spinning circle',
    description:'My virtual desktop is stuck on a spinning circle. I closed the window and opened it again, same thing.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: virtual desktop stuck on a spinner; closing and reopening the window didn\'t help. Tried: other VDI-POOL-MKTG sessions Active, so not a pool outage; Leah\'s session Disconnected, hung 9 h; told her unsaved work in it may be lost and she agreed; logged that session off per KB-0072. Result: new session Active; Leah confirmed her desktop and apps load.',
    console: {
      matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['NS-LT-0236', 'Marketing shared drive', 'VDI-POOL-MKTG'] },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3), and she has no deadline in the ticket (Urgency 2): P4.' },
      kb:true,
      caller:{ name:'Leah Brooks', style:'chat', questions:[
        { id:'consent', text:'Your desktop is stuck in an old session on our server. If I log that session off, any unsaved work in it may be lost. May I go ahead?', reply:'Go ahead, I saved before lunch.' },
        { id:'reconnect', text:'Please open your virtual desktop again. Does it load now?', afterAction:'vdi-logoff', replyBefore:'Still the spinning circle.', reply:'Yes, it loaded! My desktop and apps are all there.' },
      ] },
      vdi:{ pools:[{ name:'VDI-POOL-MKTG', sessions:[
        { id:'mktg-leah', user:'leah.brooks', state:'Disconnected – hung', hours:9 },
        { id:'mktg-marcus', user:'marcus.lee', state:'Active', hours:2 },
        { id:'mktg-wes', user:'wes.turner', state:'Active', hours:3 },
        { id:'mktg-owen', user:'owen.price', state:'Active', hours:1 },
        { id:'mktg-jade', user:'jade.morris', state:'Active', hours:5 },
      ] }] },
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['VDI', 'pool', 'VDI-POOL-MKTG', 'session ID', 'hung', 'KB-0072', 'Tier 1', 'Tier 2', 'P4', 'SLA', 'host'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P4', missing:'Set Impact 3 (one person) and Urgency 2 (no deadline in the ticket). That makes the ticket P4.' }], good:'The priority is P4: one person, no deadline.', fix:'Set Impact 3 (one person) and Urgency 2. The ticket is P4.' },
        { area:'Investigation', checks:[{ kb:'KB-0072', missing:'Search the KB for "virtual desktop black screen" and open KB-0072.' }], good:'You used KB-0072: it says what Tier 1 may do, and that pool and host restarts are Tier 2.', fix:'Search the KB for "virtual desktop black screen", open KB-0072, then check every session in VDI-POOL-MKTG on the Virtual Desktops screen.' },
        { area:'Diagnosis', checks:[{ action:'vdi-viewed', missing:'Open Virtual Desktops from the ticket and look at every session in VDI-POOL-MKTG. The others are Active; Leah\'s is "Disconnected – hung, 9 h".' }], good:'The pool was healthy and only Leah\'s session was hung, so it was not a pool outage.', fix:'Check every session in VDI-POOL-MKTG first. The others are Active, so only Leah\'s session is stuck.' },
        { area:'Action', checks:[{ chat:['consent'], missing:'Before you log the session off, tell Leah that unsaved work in it may be lost, and ask if you can go ahead. Logging off without that warning is a critical error in a real shift.' }, { action:'vdi-logoff', missing:'Click Log off session on Leah\'s session only. Restarting the pool is a Tier 2 action that drops everyone.' }, { confirmed:'reconnect', missing:'After the log-off, ask Leah to reconnect and confirm her desktop loads.' }], good:'You warned Leah, got her OK, logged off only her session and checked that her desktop loads.', fix:'Warn Leah about unsaved work and get her OK, click Log off session on her session only, then ask her to reconnect. Never restart the pool: that is Tier 2.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result work note, with Leah\'s consent and its time.' }, { comment:true, missing:'Write a comment for Leah in plain words, with no internal terms.' }, { status:'Resolved', missing:'Resolve the ticket once Leah confirms her desktop loads.' }], good:'A complete work note with her consent, a plain-words comment, and the ticket resolved.', fix:'Write a Reported / Tried / Result note that records Leah\'s consent and its time, and a comment in plain words.' },
      ],
    } }),
  // Ticket 4-A: a hot desk dock with no power.
  hdTicket({ id:'HD-2169', ownSet:true, number:'INC0010472', requester:'Grace Kim', department:'Human Resources', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T09:24:00Z', shortDescription:'monitors not working!!',
    description:'I moved to a hot desk on 4 today and plugged my laptop into the dock thing but neither of the big screens works and the keyboard on the desk doesn\'t either. My laptop screen is fine. I have a presentation to build. HELP',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: hot desk 4F-12; both monitors and the desk keyboard dead on the dock; the laptop\'s screen is fine. Tried: dock light was off and its power brick unplugged under the desk, reconnected it; set monitor 1\'s input to DisplayPort; Win + P › Extend; Display › Detect for monitor 2. Result: two monitors, the keyboard and the dock\'s Ethernet all working; Grace confirmed. Suggested to Facilities: label the dock power at the 4F hot desks.',
    console: {
      now:'2026-08-19T09:30:00Z', matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['NS-LT-0205', 'DOCK-4F-12', 'NS-LT-0244'], preset:{ contactType:'Email' } },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3). Her laptop screen still works, so she can keep building her presentation while you fix the desk (Urgency 2): P4.' },
      kb:true,
      caller:{ name:'Grace Kim', style:'chat', questions:[
        { id:'light', text:'Is there a small light on the dock?', afterAction:'dock-power', replyBefore:'No, no light at all.', reply:'Yes, it\'s on now, and the desk keyboard works.' },
        { id:'brick', text:'Can you look under the desk: is the dock\'s power brick plugged in?', reply:'Oh, it\'s lying there unplugged. I\'ve plugged it back in.' },
        { id:'screens', text:'Are both monitors showing your desktop now?', afterAction:'display-detect', replyBefore:'Not yet.', reply:'Yes, both of them, side by side like my old desk. Thank you!' },
      ] },
      machines:{
        'NS-LT-0205':{
          computer:{ ip:'10.20.70.105', health:'Healthy' },
          dock:{ name:'DOCK-4F-12', power:false, docked:true, ethernet:'Dock USB Ethernet', peripherals:['Keyboard', 'Mouse'],
            monitors:[{ id:'desk-left', name:'Monitor 1', cable:'DisplayPort', input:'HDMI', inputs:['HDMI', 'DisplayPort'] }, { id:'desk-right', name:'Monitor 2', cable:'DisplayPort', input:'DisplayPort', inputs:['HDMI', 'DisplayPort'], needsDetect:true }] },
          projection:'Duplicate',
        },
      },
      actions:[
        { id:'order-dock', text:'Order a replacement dock and monitors for desk 4F-12', critical:true, feedback:'Critical error. Never order replacement hardware before you check the dock\'s power and the monitor\'s input. Here the dock was simply unplugged.', history:'Ordered replacement hardware before checking power and input.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['DOCK-4F-12', 'NS-LT-0205', 'CI', 'USB-C', 'Win + P', 'Tier 1', 'Tier 2', 'P4', 'SLA'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P4', missing:'Set Impact 3 (one person) and Urgency 2 (her laptop screen works, so she can keep working). That makes the ticket P4.' }], good:'The priority is P4: one person, and her laptop screen still works.', fix:'Set Impact 3 (one person) and Urgency 2. The ticket is P4.' },
        { area:'Investigation', checks:[{ chat:['light'], missing:'Everything on the dock is dead but the laptop works: start where the power comes in. Ask Grace whether the dock has a light.' }], good:'You started where the power comes in: the dock light.', fix:'Everything on the dock is dead but the laptop works, so the dock or its power is the place to start. Ask Grace about the dock light first.' },
        { area:'Diagnosis', checks:[{ chat:['brick'], missing:'Ask Grace to check under the desk that the dock\'s power brick is plugged in.' }, { action:'dock-power', missing:'On the Dock and displays screen, plug in the dock\'s power.' }], good:'No power to the dock turned off everything attached to it.', fix:'The dock has no light: its power brick is unplugged. Ask Grace to check it, then plug in the dock\'s power.' },
        { area:'Action', checks:[{ action:'monitor-input', missing:'Monitor 1 says "No signal": set its Input/Source to DisplayPort.' }, { action:'projection', missing:'Press Win + P › Extend.' }, { action:'display-detect', missing:'In Settings › Display, click Detect so monitor 2 appears.' }, { chat:['screens'], missing:'Ask Grace to confirm both monitors show her desktop.' }], good:'Power, input, Win + P › Extend, Detect, and Grace confirmed both monitors.', fix:'Work along the chain: dock power, the monitor\'s input, Win + P › Extend, then Display › Detect. Check Ethernet: Connected in Settings › Network & internet, and confirm with Grace.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result work note.' }, { comment:true, missing:'Write a comment for Grace in plain words, with no internal terms.' }, { status:'Resolved', missing:'Resolve the ticket once Grace confirms.' }], good:'A complete work note, a plain-words comment, and the ticket resolved.', fix:'Write a Reported / Tried / Result note and a plain-words comment, for example: "Hi Grace, you\'re all set. The dock at that desk had come unplugged from power, which turns off everything attached to it. It\'s plugged back in, both monitors are working, and they\'re arranged like your old desk. If a hot desk acts up again, check for the small light on the dock first. – Riley"' },
      ],
    } }),
  // Ticket 4-B: a swollen battery. Safety first, then Desktop Support (Tier 2).
  hdTicket({ id:'HD-2170', ownSet:true, number:'INC0010473', requester:'Omar Haddad', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-20T13:57:00Z', shortDescription:'trackpad popping up',
    description:'weird question. my laptop trackpad is kind of raised up now and won\'t click right, and the battery dies in like an hour. is that a setting? also it\'s a bit warm. I\'m charging it now',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: raised trackpad that won\'t click properly, about an hour of battery, warm while charging. Tried: the signs match a swollen battery (no physical test: it is a hazard); at 14:05 told Omar to save his work, unplug the charger, shut down and leave the laptop on a hard surface; requested loaner LT-LOAN-04. Result: laptop out of use; escalated to Desktop Support for the swap. Next action: Desktop Support collects NS-LT-0183 and confirms a pickup time with Omar within the hour.',
    console: {
      now:'2026-08-20T14:00:00Z', matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['NS-LT-0215', 'NS-LT-0154', 'NS-LT-0183'], preset:{ contactType:'Chat' } },
      priorityCoach:{ impact:'3', urgency:'1', line:'One person is affected (Impact 3), but a swelling battery that is warm and charging is a safety hazard, so it is urgent (Urgency 1): P3, with the safety steps first.' },
      kb:true,
      caller:{ name:'Omar Haddad', style:'chat', questions:[
        { id:'charging', text:'Is the laptop still plugged in and charging right now?', reply:'Yes, it\'s on the charger.' },
        { id:'files', text:'Are your files saved somewhere other than the laptop, like OneDrive?', reply:'Yes, everything\'s in OneDrive.' },
        { id:'done', text:'Is the laptop off, unplugged and on a hard surface now?', afterAction:'safety', replyBefore:'Not yet. What should I do with it?', reply:'Done. It\'s off, unplugged and on the desk.' },
      ] },
      actions:[
        { id:'safety', text:'Tell Omar: "Please save your work, unplug the charger, shut the laptop down and put it on a hard surface away from anything that can burn. Don\'t press on the trackpad."', feedback:'Omar: "Okay, saving now and shutting it down."', history:'Safety steps given: save, unplug the charger, shut down, hard surface, don\'t press on the trackpad.' },
        { id:'loaner', text:'Request loaner LT-LOAN-04 for Omar (KB-0071)', feedback:'Loaner LT-LOAN-04 is reserved for Omar. His files are in OneDrive, so he can sign in and keep working.', history:'Loaner LT-LOAN-04 requested per KB-0071.' },
        { id:'keep-using', text:'Tell Omar he can keep charging and using the laptop until the swap', critical:true, feedback:'Critical error. A swelling battery can overheat or catch fire. Tell him to unplug it, shut it down and stop using it.', history:'Told the user to keep charging and using a laptop with a swelling battery.' },
        { id:'press', text:'Ask Omar to press on the trackpad, or open the case, to check the battery', critical:true, feedback:'Critical error. Pressing on a swollen battery or opening the case can make it fail. No physical tests on a hazard.', history:'Asked the user to press on or open a laptop with a swelling battery.' },
      ],
      comments:{ timeCheck:{ time:`${HD_M03_TIME}|\\bwithin the hour\\b`, promise:HD_M03_PROMISE, promiseLine:'A swap time is not yours to promise: Desktop Support sets it. Say when Omar will hear about the pickup.', noTimeLine:'Tell Omar when he will hear about the pickup.' } },
      resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Li-ion', 'lithium', 'NS-LT-0183', 'LT-LOAN-04', 'KB-0071', 'Tier 1', 'Tier 2', 'P3', 'SLA', 'escalate', 'escalated', 'escalating'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P3', missing:'Set Impact 3 (one person) and Urgency 1 (a safety hazard). That makes the ticket P3.' }], good:'The priority is P3: one person, and the safety risk makes it urgent.', fix:'Set Impact 3 (one person) and Urgency 1 (a safety hazard). The ticket is P3.' },
        { area:'Investigation', checks:[{ chat:['charging'], missing:'Ask Omar whether the laptop is still charging. Heat while charging is part of the hazard.' }, { kb:'KB-0071', missing:'Search the KB (for example "damaged laptop") and open KB-0071 for the loaner and escalation steps.' }], good:'You checked it was still charging and used KB-0071.', fix:'Ask Omar whether it is still charging, and open KB-0071 for the loaner and escalation route.' },
        { area:'Diagnosis', checks:[{ action:'safety', missing:'A raised trackpad, a short battery life and heat are the signs of a swollen battery. That is a hazard: give the safety steps, with no physical test.' }], good:'You recognized a swollen battery and ran no physical test on it.', fix:'A raised trackpad, about an hour of battery and heat mean a swollen battery. Treat it as a hazard: no battery report, no setting, no test.' },
        { area:'Action', checks:[{ action:'safety', missing:'First tell Omar to save, unplug the charger, shut down and leave the laptop on a hard surface, and not to press on the trackpad.' }, { chat:['done'], missing:'Check with Omar that the laptop is off, unplugged and on a hard surface.' }, { chat:['files'], missing:'Ask whether his files are in OneDrive, so the loaner has them.' }, { action:'loaner', missing:'Request loaner LT-LOAN-04 for Omar.' }, { group:'Desktop Support (Tier 2)', missing:'Assign the ticket to Desktop Support (Tier 2) for the battery swap.' }], good:'Safety steps first, a loaner requested, and the ticket with Desktop Support for the swap.', fix:'Give the safety steps first, confirm the laptop is off, request a loaner, then assign the ticket to Desktop Support (Tier 2).' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action: Desktop Support collects the laptop and confirms a pickup time.' }, { comment:true, missing:'Write a comment for Omar in plain words, with no internal terms.' }, { commentTime:true, missing:'Tell Omar when he will hear about the pickup, for example "within the hour".' }], good:'A complete note with the next action, and a plain-words comment that says when Omar will hear back.', fix:'Write a Reported / Tried / Result note with a Next action, and a plain-words comment, for example: "Hi Omar, thanks for asking. It\'s not a setting. A raised trackpad usually means the battery inside is swelling, which can be a safety risk, so please keep the laptop off and unplugged. Our desktop team will swap it out, and we\'re setting you up with a loaner today with your OneDrive files on it. We\'ll confirm a pickup time within the hour. – Riley"' },
      ],
    } }),
  // Ticket 4-C: a badge printer with six duplicate jobs and the offline flag.
  // A phone call, worked with the caller questions. Restarting the spooler
  // with the six jobs queued sends all six again (action spooler-start with
  // queued); the late message says what came out.
  hdTicket({ id:'HD-2171', ownSet:true, number:'INC0010475', requester:'Ines Calder', department:'Front Desk', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-21T09:01:00Z', shortDescription:'Badge printer offline, guest waiting',
    description:'Phone call from the front desk: "Hi! I\'ve got a visitor standing here waiting for their badge and the printer just says \'Offline\' and nothing comes out. I clicked print like five times. Please hurry!" Desk NS-WS-0101, printer RECEPTION-BADGE.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: badge printer shows Offline with a visitor waiting; print clicked five or more times. Tried: six jobs queued, the first in Error, removed all six; Use Printer Offline was ticked on NS-WS-0101, unticked it; the printer answers on port 9100; asked Ines to print once. Result: badge printed 09:07; Ines confirmed on the phone; connection to her PC closed.',
    console: {
      now:'2026-08-21T09:02:00Z', matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['NS-WS-0101', 'RECEPTION-BADGE', 'NS-PRINT01'], preset:{ contactType:'Phone' } },
      priorityCoach:{ impact:'3', urgency:'1', line:'One person is affected (Impact 3), but a guest is waiting at the desk right now (Urgency 1): P3. Work it live.' },
      kb:true,
      caller:{ name:'Ines Calder', style:'phone', questions:[
        { id:'connect', text:'May I connect to your computer?', reply:'Yes, go ahead.' },
        { id:'paper', text:'Does the printer itself show ready, with paper loaded?', reply:'Its little screen says Ready, and there are plenty of badge cards in it.' },
        { id:'print-once', text:'Please click print once, just once, and tell me what comes out.', afterAction:'printer-offline-off', replyBefore:'Nothing is coming out. It still says Offline.', reply:'One badge came out. The visitor has it. Thank you!' },
      ] },
      machines:{
        'NS-WS-0101':{
          computer:{ ip:'10.20.10.101', health:'Healthy' },
          spooler:'Running',
          ports:[{ name:'IP_10.20.10.60', type:'Standard TCP/IP', address:'10.20.10.60' }],
          driverCatalog:['Generic Label Printer', 'Generic / Text Only'],
          reachable:{ '10.20.10.60':[9100] },
          printQueues:{
            'RECEPTION-BADGE':{ port:'IP_10.20.10.60', driver:'Generic Label Printer', drivers:['Generic Label Printer'], media:'Badge card', mediaSizes:['Badge card', 'Letter'], offline:true, paused:false,
              jobs:[
                { id:31, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Error' },
                { id:32, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Spooling' },
                { id:33, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Spooling' },
                { id:34, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Spooling' },
                { id:35, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Spooling' },
                { id:36, document:'Visitor badge', pages:1, owner:'Ines Calder', status:'Spooling' },
              ] },
          },
        },
      },
      // Six badges came out: the queue printed while the duplicates were still in it.
      arrivals:[{ id:'six-badges', from:'Ines Calder', text:'Six badges just came out of the printer, all for the same visitor! Next time, can we clear the extra ones first?', when:{ machine:{ computer:'NS-WS-0101', path:['printQueues', 'RECEPTION-BADGE', 'printed', '5', 'document'], value:'Visitor badge' } } }],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['spooler', 'Print Spooler', 'queue', 'Get-PrintJob', 'Test-NetConnection', '9100', 'NS-WS-0101', 'RECEPTION-BADGE', 'PowerShell', 'Tier 1', 'Tier 2', 'P3', 'SLA'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P3', missing:'Set Impact 3 (one person) and Urgency 1 (a guest is waiting now). That makes the ticket P3.' }], good:'The priority is P3: one person, and a guest waiting makes it urgent.', fix:'Set Impact 3 (one person) and Urgency 1 (a guest is waiting). The ticket is P3.' },
        { area:'Investigation', checks:[{ chat:['connect'], missing:'Ask Ines "May I connect to your computer?" before you work on NS-WS-0101.' }, { chat:['paper'], missing:'Ask Ines whether the printer shows ready with paper loaded.' }], good:'You asked before connecting, and checked the printer itself.', fix:'Ask Ines before you connect to her computer, then check the queue with Get-PrintJob -PrinterName RECEPTION-BADGE and ask whether the printer shows ready.' },
        { area:'Diagnosis', checks:[{ action:'job-cancel', missing:'Get-PrintJob shows six badge jobs, the first in Error. Cancel the jobs in the print queue window.' }], good:'Six duplicate jobs sat behind one in Error, and Use Printer Offline was ticked.', fix:'Six duplicate jobs sit behind one in Error, and Use Printer Offline is ticked on her computer.' },
        { area:'Action', checks:[{ action:'job-cancel', missing:'Cancel all six badge jobs while the printer is still offline. Restarting the spooler, or the PC, with them queued prints all six.' }, { action:'printer-offline-off', missing:'After the jobs are cleared, untick Use Printer Offline in the queue\'s Printer menu.' }, { confirmed:'print-once', missing:'Ask Ines to print once, and confirm one badge came out.' }], good:'Jobs cleared before the flag, then one reprint: one badge, not six.', fix:'Order matters: cancel all six jobs first, then untick Use Printer Offline, then ask Ines to print once. Restarting the spooler or the PC with the six jobs queued prints six badges.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result work note.' }, { comment:true, missing:'Write a comment for Ines in plain words, with no internal terms.' }, { status:'Resolved', missing:'Resolve the ticket once Ines confirms the badge printed.' }], good:'A complete work note, a plain-words comment, and the ticket resolved.', fix:'Write a Reported / Tried / Result note and a plain-words comment, for example: "Hi Ines, thanks for staying calm with a guest waiting! Your printer had been switched to "offline" on your computer, and the extra print jobs were stuck behind the first one. We cleared them and switched it back online, and your badge printed. Next time, print once and call us if nothing comes out. – Riley"' },
      ],
    } }),
  // Ticket 4-D: a hung virtual desktop session.
  hdTicket({ id:'HD-2172', ownSet:true, number:'INC0010476', requester:'Ana Torres', department:'Claims', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-18T13:31:00Z', shortDescription:'work desktop just black',
    description:'hi, my work desktop thing just shows a black screen with a spinning circle forever. I restarted my own laptop twice. I have claims to finish by 5 and I literally cant do anything',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: virtual desktop shows a black screen and a spinner; Ana restarted her laptop twice. Tried: pool VDI-POOL-CLAIMS healthy (12 sessions Active); Ana\'s session Disconnected, hung 14 h; warned her that unsaved work in that session may be lost and she agreed at 13:40; logged the session off per KB-0072. Result: new session Active 13:42; desktop loaded; Ana confirmed her apps open.',
    console: {
      now:'2026-08-18T13:35:00Z', matrix:{}, classify:{ categories:HD_ITS02_CATEGORIES, cis:['VDI-POOL-MKTG', 'Claims application', 'VDI-POOL-CLAIMS'], preset:{ contactType:'Chat' } },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3), with a deadline at 5 (Urgency 2): P4. If other Claims users were stuck too, Impact would be 2 (P3).' },
      kb:true,
      caller:{ name:'Ana Torres', style:'chat', questions:[
        { id:'others', text:'Is anyone else on your team stuck on a black screen?', reply:'No, my team is working. It\'s just me.' },
        { id:'consent', text:'Your desktop is stuck in an old session on our server. If I log that session off, any unsaved work in it may be lost. May I go ahead?', reply:'Okay, go ahead. I saved most of it before it froze.' },
        { id:'reconnect', text:'Please open your work desktop again. Does it load now?', afterAction:'vdi-logoff', replyBefore:'Still black with the spinning circle.', reply:'It\'s back! My desktop loaded and my claims apps open.' },
      ] },
      vdi:{ pools:[{ name:'VDI-POOL-CLAIMS', sessions:[
        { id:'claims-ana', user:'ana.torres', state:'Disconnected – hung', hours:14 },
        { id:'claims-dev', user:'dev.mehta', state:'Active', hours:3 },
        { id:'claims-lena', user:'lena.fischer', state:'Active', hours:5 },
        { id:'claims-kofi', user:'kofi.mensah', state:'Active', hours:2 },
        { id:'claims-rosa', user:'rosa.diaz', state:'Active', hours:6 },
        { id:'claims-tom', user:'tom.becker', state:'Active', hours:1 },
        { id:'claims-aiko', user:'aiko.sato', state:'Active', hours:5 },
        { id:'claims-ben', user:'ben.carter', state:'Active', hours:3 },
        { id:'claims-nadia', user:'nadia.rahman', state:'Active', hours:2 },
        { id:'claims-wei', user:'li.wei', state:'Active', hours:6 },
        { id:'claims-sara', user:'sara.lopez', state:'Active', hours:1 },
        { id:'claims-jon', user:'jon.park', state:'Active', hours:3 },
        { id:'claims-mia', user:'mia.novak', state:'Active', hours:5 },
      ] }] },
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['VDI', 'pool', 'VDI-POOL-CLAIMS', 'hung', 'KB-0072', 'Tier 1', 'Tier 2', 'P3', 'P4', 'SLA', 'host'] },
      feedback:[
        { area:'Triage', checks:[{ priority:'P4', missing:'Set Impact 3 (only Ana is stuck) and Urgency 2. That makes the ticket P4. If other Claims users were stuck, Impact would be 2.' }], good:'The priority is P4: only Ana is stuck, and the rest of the pool is Active.', fix:'Set Impact 3 (one person; the other Claims sessions are Active) and Urgency 2. The ticket is P4.' },
        { area:'Investigation', checks:[{ kb:'KB-0072', missing:'Search the KB for "virtual desktop black screen" or "VDI" and open KB-0072.' }, { chat:['others'], missing:'Ask Ana whether anyone else on her team is stuck.' }, { action:'vdi-viewed', missing:'Open Virtual Desktops from the ticket and check every session in VDI-POOL-CLAIMS.' }], good:'You checked the pool first: 12 sessions Active, so it is not a pool outage.', fix:'Check the pool first: open the Virtual Desktops screen and look at every session in VDI-POOL-CLAIMS, and ask Ana whether her team is affected (KB-0072).' },
        { area:'Diagnosis', checks:[{ action:'vdi-logoff', missing:'Ana\'s session shows "Disconnected – hung, 14 h". Restarting her laptop can\'t reach it: the desktop runs on a server.' }], good:'The desktop runs on a server, so restarting her laptop couldn\'t fix the hung session.', fix:'Her session is "Disconnected – hung, 14 h" on the server. Restarting her laptop reconnects her to the same frozen desktop.' },
        { area:'Action', checks:[{ chat:['consent'], missing:'Before you log the session off, warn Ana that unsaved work in it may be lost, and get her OK. Logging off without that warning is a critical error in a real shift.' }, { action:'vdi-logoff', missing:'Click Log off session on Ana\'s session only. Restarting the pool or the host is a Tier 2 action that drops everyone.' }, { confirmed:'reconnect', missing:'After the log-off, ask Ana to reconnect and confirm her desktop loads.' }], good:'You warned Ana, got her OK, logged off only her session and confirmed her desktop loads.', fix:'Warn Ana about unsaved work and get her OK, click Log off session on her session only (KB-0072), then ask her to reconnect. Never restart the pool or the host.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result work note, with Ana\'s consent and its time.' }, { comment:true, missing:'Write a comment for Ana in plain words, with no internal terms.' }, { status:'Resolved', missing:'Resolve the ticket once Ana confirms her desktop loads.' }], good:'A complete note with her consent and its time, a plain-words comment, and the ticket resolved.', fix:'Write a Reported / Tried / Result note that records Ana\'s consent and its time, and a plain-words comment, for example: "Hi Ana, your work desktop was stuck in an old session on our server, so restarting your laptop couldn\'t reach it. We cleared that session and you\'re back in with a fresh one. Files you had already saved are safe; only unsaved changes in the stuck session may be lost. If the black screen comes back, message us and we can clear it in a minute. – Riley"' },
      ],
    } }),
  // Module 5 (key its-03) Practice It. Lab 5.1 (coach hd-m03, HD_COACHED_SETS
  // 'its-03-guided') is HD-2180; Lab 5.2 (HD_PRACTICE_SETS 'its-03') is tickets
  // 5-A to 5-D (HD-2181, HD-2182, HD-2183, HD-2186), with HD-2187 and HD-2188 as
  // the related records 5-B links. Each ticket's computer is in
  // console.machines (ui/helpdesk.js "Windows client tools").
  // expectedResolution holds the model work note. Practice feedback only,
  // never points: critical errors are feedback here, never a score. The
  // 48-digit keys are invented values and never go in a note or a comment.
  // Lab 5.1: a slow desk PC (a full drive and a pending restart).
  hdTicket({ id:'HD-2180', ownSet:true, number:'INC0010480', requester:'Noah Williams', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T10:22:00Z', shortDescription:'PC very slow since Monday',
    description:'My desk PC has been crawling since Monday. Apps take forever to open and it froze twice today. Nothing\'s due today, it\'s just painful.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: desk PC slow since Monday; apps slow to open; froze twice today. Tried: Task Manager showed Disk at 100% with CPU at 36% (top process Microsoft Teams, 14%). C: was 7% free (16.6 of 237 GB). An update had waited 23 days for a restart. System log Event ID 2013 (disk near capacity); boot took 94 s (Event ID 100). All four startup apps are in the Software Catalog; disabled LumenCam Companion at startup with Noah\'s OK. Removed 21.4 GB of temporary files, with his OK for the Recycle Bin; his Desktop files were all still listed afterwards. DISM and SFC found nothing to repair; chkdsk found no problems. Restarted to finish the update. Result: C: 16% free; no restart pending; boot 52 s; Noah confirms apps open normally.',
    console: {
      matrix:{}, classify:{ categories:HD_ITS03_CATEGORIES, cis:['NS-WS-0277', 'NS-FILE01', 'NS-LT-0291'], preset:{ contactType:'Phone' } },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3). The PC is slow, but nothing is due today (Urgency 2): P4.' },
      kb:true,
      caller:{ name:'Noah Williams', style:'phone', questions:[
        { id:'lumencam', text:'Do you need LumenCam Companion to start every time you sign in?', reply:'No, I only use the webcam for calls.' },
        { id:'recycle', text:'Your Recycle Bin holds about 3.3 GB. May I empty it?', reply:'Go ahead, nothing I need.' },
        { id:'restart', text:'Your PC is waiting to restart to finish an update. If I restart it now, is your work saved?', reply:'Yes, everything\'s saved. Go ahead.' },
        { id:'apps', text:'Please sign in and open your usual apps. Do they open normally now?', afterAction:'restart', replyBefore:'Still slow.', reply:'Yes! Everything opens straight away now.' },
      ] },
      machines:{
        'NS-WS-0277':{
          computer:{ ip:'10.20.40.77', health:'Healthy' },
          processes:[
            { name:'Microsoft Teams', cpu:14, memory:612, disk:1.2 },
            { name:'Microsoft Edge', cpu:11, memory:884, disk:0.8 },
            { name:'Antimalware Service Executable', cpu:6, memory:210, disk:34 },
            { name:'Windows Explorer', cpu:3, memory:160, disk:0.4 },
            { name:'Microsoft Outlook', cpu:2, memory:340, disk:1.1 },
            { name:'System', cpu:1, memory:20, disk:46 },
          ],
          performance:{ cpu:36, memory:71, disk:100, diskRecovered:{ freePercent:16, disk:12 } },
          startupApps:[
            { name:'Microsoft Teams', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'High' },
            { name:'Microsoft OneDrive', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'Medium' },
            { name:'LumenCam Companion', publisher:'Lumen Devices Ltd.', verified:true, status:'Enabled', impact:'Medium' },
            { name:'Windows Security notification icon', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'Low' },
          ],
          storage:{ drive:'C:', sizeGb:237, freeGb:16.6,
            categories:[{ name:'Apps & features', gb:88 }, { name:'Documents', gb:41 }, { name:'System & reserved', gb:52 }, { name:'Other', gb:18 }],
            temporaryFiles:[{ id:'wu-cleanup', name:'Windows Update Cleanup', gb:9.8 }, { id:'temp', name:'Temporary files', gb:8.3 }, { id:'recycle', name:'Recycle Bin', gb:3.3, recycleBin:true }],
            driveHealth:'Good' },
          updates:{ lastInstalledDaysAgo:23, restartRequired:true,
            pending:{ kb:'KB5099101', name:'2026-08 Cumulative Update for Windows 11', downloaded:'Monday' },
            history:[{ kb:'KB5098807', name:'2026-07 Cumulative Update for Windows 11', date:'7/27/2026', status:'Successfully installed', description:'Security Update' }, { kb:'KB5097512', name:'2026-06 Cumulative Update for Windows 11', date:'6/22/2026', status:'Successfully installed', description:'Security Update' }] },
          uptimeDays:23, bootSeconds:94, bootSecondsAfterFix:52, bootSecondsAfterFixNeeds:{ freePercent:16 },
          installedApps:[
            { name:'Microsoft Teams', publisher:'Microsoft Corporation', version:'24295.605', installed:'3/4/2025', startup:'Microsoft Teams' },
            { name:'Microsoft OneDrive', publisher:'Microsoft Corporation', version:'25.150.0', installed:'3/4/2025', startup:'Microsoft OneDrive' },
            { name:'LumenCam Companion', publisher:'Lumen Devices Ltd.', version:'2.4.1', installed:'3/4/2025', startup:'LumenCam Companion' },
            { name:'Windows Security', publisher:'Microsoft Corporation', version:'1.0', installed:'3/4/2025', startup:'Windows Security notification icon' },
            { name:'Microsoft Edge', publisher:'Microsoft Corporation', version:'139.0.3405.86', installed:'3/4/2025' },
            { name:'Microsoft Outlook', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'3/4/2025' },
            { name:'Microsoft Word', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'3/4/2025' },
            { name:'Microsoft Excel', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'3/4/2025' },
            { name:'Northstar CRM', publisher:'Northstar IT', version:'8.2.0', installed:'3/4/2025' },
          ],
          catalog:HD_ITS03_CATALOG,
          events:{
            system:[
              { level:'Error', time:'Today 08:12', source:'srv', id:'2013', message:'The C: disk is at or near capacity. You may need to delete some files.' },
              { level:'Information', time:'Mon 14:02', source:'Microsoft-Windows-WindowsUpdateClient', id:'44', message:'Windows Update started downloading an update.' },
            ],
            application:[{ level:'Information', time:'Tue 07:58', source:'Software Protection Platform Service', id:'16384', message:'Successfully scheduled Software Protection service for re-start.' }],
            'diagnostics-performance':[],
          },
          reliability:[
            { day:'Saturday', critical:[], warnings:[], installs:[] },
            { day:'Sunday', critical:[], warnings:[], installs:[] },
            { day:'Monday', critical:['Windows stopped responding', 'Windows stopped responding'], warnings:[], installs:['Windows Update: cumulative update downloaded, restart pending'] },
            { day:'Tuesday', critical:[], warnings:[], installs:[] },
            { day:'Today', today:true, critical:[], warnings:[], installs:[] },
          ],
          files:{
            'C:\\Users\\nwilliams\\Desktop':['Harbor Foods account plan.docx', 'Q3 pipeline.xlsx', 'Renewal quotes (draft).xlsx', 'Meeting notes.txt'],
            'C:\\Users\\nwilliams\\Documents':['Customer visits', 'Sales playbook.docx', 'Territory map.xlsx'],
          },
          repairs:{ dism:'The restore operation completed successfully.', sfc:'Windows Resource Protection did not find any integrity violations.', chkdsk:'Windows has scanned the file system and found no problems.' },
          bitlockerKeys:[{ keyId:'8D41B6E0', date:'3/4/2025', key:'402118-339207-551430-187726-604391-275548-119806-482233' }],
          safeMode:false,
          profile:{ temporary:false, restartClears:false, path:'C:\\Users\\nwilliams' },
        },
      },
      actions:[
        { id:'lab-key-read', text:'Read out the recovery key stored for NS-WS-0277', bitlockerKey:'8D41B6E0', critical:true, feedback:'Critical error. Step 15 is a look-up only: read the Key ID and the date, then stop. Nothing is read out, and this ticket does not call for a recovery key.', history:'Read out a BitLocker recovery key this ticket did not call for.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Event ID', 'Event Viewer', 'Diagnostics-Performance', 'Reliability Monitor', 'Task Manager', 'DISM', 'SFC', 'chkdsk', 'CPU', 'Key ID', 'NS-WS-0277', 'Tier 1', 'Tier 2', 'P4', 'SLA'],
        needs:[{ label:'Free-space percentage', pattern:'\\b\\d{1,2}(\\.\\d)?\\s?%' }, { label:'Top process', pattern:'teams|edge|antimalware|explorer|outlook' }, { label:'An Event ID', pattern:'\\b2013\\b|event\\s*(id\\s*)?100\\b|\\bid\\s*100\\b' }] },
      feedback:[
        { area:'Triage', checks:[{ triage:{ category:'Software', subcategory:'Windows performance', ci:'NS-WS-0277' }, missing:'Set Category Software › Windows performance and CI NS-WS-0277, Noah\'s desk PC.' }, { priority:'P4', missing:'Set Impact 3 (one person) and Urgency 2 (nothing is due today). That makes the ticket P4.' }], good:'The priority is P4: one person, and nothing is due today.', fix:'Set Impact 3 (one person) and Urgency 2 (nothing is due today). The ticket is P4.' },
        { area:'Investigation', checks:[
          { seen:'task-manager:processes', computer:'NS-WS-0277', missing:'Open Task Manager › Processes on NS-WS-0277 and sort by CPU, then by Disk.' },
          { seen:'storage', computer:'NS-WS-0277', missing:'Open Settings › System › Storage on NS-WS-0277 and work out the percentage free.' },
          { seen:'windows-update', computer:'NS-WS-0277', missing:'Open Settings › Windows Update on NS-WS-0277.' },
          { seen:'event-log:diagnostics-performance', computer:'NS-WS-0277', missing:'In Event Viewer, open Diagnostics-Performance › Operational and read Event ID 100.' },
        ], good:'You checked what was busy, the free space, the update state and the boot time before you changed anything.', fix:'Check Task Manager, Settings › System › Storage and Settings › Windows Update, then read Event ID 100 in the Diagnostics-Performance log. Measure first, then fix.' },
        { area:'Diagnosis', checks:[{ seen:'reliability', computer:'NS-WS-0277', missing:'Open Reliability Monitor and find the day the problems started.' }, { kb:'KB-0084', missing:'Search the KB for "slow" and open KB-0084.' }], good:'Monday is the day it changed: an update waited for a restart, and the drive was almost full. KB-0084 gave you the checklist.', fix:'Open Reliability Monitor and find Monday, then search the KB for "slow" and open KB-0084.' },
        { area:'Action', checks:[
          { action:'startup-disabled', missing:'In Task Manager › Startup apps, set LumenCam Companion to Disabled. Disabling does not uninstall it.' },
          { chat:['lumencam'], missing:'Ask Noah whether he needs LumenCam Companion at sign-in before you change how his PC starts.' },
          { action:'temp-files-removed', missing:'In Settings › System › Storage › Temporary files, remove Windows Update Cleanup and Temporary files.' },
          { chat:['recycle'], missing:'Ask Noah before you empty the Recycle Bin. It holds files he deleted.' },
          { typed:'^(dir|get-childitem|gci)\\b.*c:\\\\users\\\\nwilliams\\\\desktop', computer:'NS-WS-0277', missing:'Type dir C:\\Users\\nwilliams\\Desktop in PowerShell to check that his files are all still there.' },
          { typed:'^dism(\\.exe)?\\b.*\\/restorehealth', computer:'NS-WS-0277', missing:'Type DISM /Online /Cleanup-Image /RestoreHealth.' },
          { typed:'^sfc(\\.exe)?\\s*\\/scannow', computer:'NS-WS-0277', missing:'Type sfc /scannow after DISM finishes.' },
          { typed:'^chkdsk(\\.exe)?\\s+c:\\s*\\/scan', computer:'NS-WS-0277', missing:'Type chkdsk C: /scan.' },
          { action:'restart', missing:'Tell Noah, then use Restart so the update can finish.' },
          { action:'safe-mode-started', missing:'Walk through the Safe Mode route in Settings › System › Recovery, then restart normally.' },
          { seen:'ad-bitlocker', computer:'NS-WS-0277', missing:'Open Active Directory › Computers › NS-WS-0277 › BitLocker Recovery and read the Key ID. Release nothing.' },
          { confirmed:'apps', missing:'After the restart, ask Noah whether his apps open normally.' },
        ], good:'You freed space the safe way with Noah\'s OK, ran the repair commands in order, restarted to finish the update and checked with Noah.', fix:'Disable the startup app he does not need, free space (ask before the Recycle Bin), run DISM, then sfc, then chkdsk, restart to finish the update, and ask Noah whether his apps open normally.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note. Include the free-space percentage, the top process and an Event ID.' }, { comment:true, missing:'Write a comment for Noah in plain words, with no internal terms.' }, { code:'Solution provided', missing:'Choose the resolution code Solution provided.' }], good:'A complete note with evidence, a plain-words comment and the right resolution code.', fix:'Write a Reported / Tried / Result note with the free-space percentage, the top process and an Event ID, and a plain-words comment, for example: "Hi Noah, your PC should feel normal again. Its drive was almost full and it had been waiting more than three weeks to restart for an update. We cleared out temporary files, finished the update and checked Windows for damage: all clean. Your files are all where you left them. A restart once a week will keep it quick. – Riley, Northstar Service Desk"' },
      ],
    } }),
  // Ticket 5-A: a temporary profile that a restart does not clear.
  hdTicket({ id:'HD-2181', ownSet:true, number:'INC0010481', requester:'Noah Williams', department:'Sales', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-20T09:58:00Z', shortDescription:'Blank desktop after signing in',
    description:'Phone call: "Everything\'s gone! My desktop is blank, my background is the default one, Outlook wants me to set it up again. Did I get hacked?? I signed in fine." Desk PC NS-WS-0277.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: blank desktop, default background, Outlook asking to be set up; sign-in worked. Tried: saw "You\'ve been signed in with a temporary profile"; Application log shows User Profile Service 1511 and 1515; signed out and restarted once per KB-0090, still temporary; C:\\Users\\nwilliams\\Desktop and Documents still hold his files; asked Noah not to save files or set up Outlook on this profile. Result: escalated to Desktop Support per KB-0090 with the event IDs; files confirmed intact. Next action: Desktop Support repairs the profile; Service Desk updates Noah by 11:30.',
    console: {
      now:'2026-08-20T10:05:00Z', matrix:{}, classify:{ categories:HD_ITS03_CATEGORIES, cis:['NS-WS-0277', 'NS-LT-0081', 'NS-FILE01'], preset:{ contactType:'Phone' } },
      priorityCoach:{ impact:'3', urgency:'2', line:'One person is affected (Impact 3). His sign-in works and the ticket gives no deadline (Urgency 2): P4.' },
      kb:true,
      caller:{ name:'Noah Williams', style:'phone', questions:[
        { id:'hacked', text:'First, this does not sound like a hack. Your files are very likely still on the PC. Did you see any message when you signed in?', reply:'Yes, something about a "temporary profile". I closed it. Please tell me my files are not gone!' },
        { id:'signin', text:'Did you sign in as usual, with your own user name and password?', reply:'Yes, the same as always. It let me in, but the desktop is blank.' },
        { id:'restarted', text:'Please sign out, restart the PC and sign in again. What do you see?', afterAction:'restart', replyBefore:'Not yet.', reply:'I signed back in. Same blank desktop.' },
      ] },
      machines:{
        'NS-WS-0277':{
          computer:{ ip:'10.20.40.77', health:'Profile warning' },
          uptimeDays:1,
          profile:{ temporary:true, restartClears:false, path:'C:\\Users\\TEMP' },
          events:{
            system:[],
            application:[
              { level:'Warning', time:'Today 09:46', source:'Microsoft-Windows-User Profile Service', id:'1511', message:'Windows cannot find the local profile and is logging you on with a temporary profile. Changes you make to this profile will be lost when you log off.' },
              { level:'Error', time:'Today 09:46', source:'Microsoft-Windows-User Profile Service', id:'1515', message:'Windows has backed up this user profile. Windows will automatically try to use the backup profile the next time this user logs on.' },
            ],
            'diagnostics-performance':[],
          },
          files:{
            'C:\\Users\\nwilliams\\Desktop':['Harbor Foods account plan.docx', 'Q3 pipeline.xlsx', 'Renewal quotes (draft).xlsx', 'Meeting notes.txt'],
            'C:\\Users\\nwilliams\\Documents':['Customer visits', 'Sales playbook.docx', 'Territory map.xlsx'],
          },
          repairs:{},
        },
      },
      actions:[
        { id:'no-save', text:'Tell Noah: "Please do not save new files or set up Outlook on this desktop. Anything saved in a temporary profile is lost when you sign out."', feedback:'Noah: "Okay, I will leave everything alone until you call me back."', history:'Told the user not to save files or set up Outlook on the temporary profile.' },
        { id:'delete-profile', text:'Delete the profile folder C:\\Users\\nwilliams so Windows builds a new one', critical:true, feedback:'Critical error. Deleting the profile folder deletes his files. Profile repairs are Tier 2: confirm his files are present, then escalate (KB-0090).', history:'Deleted the profile folder of a user whose files were still in it.' },
        { id:'outlook-setup', text:'Tell Noah to set up Outlook and save his work in this profile for now', critical:true, feedback:'Critical error. Anything saved in a temporary profile is lost at sign-out. Ask him not to save files or set up Outlook (KB-0090).', history:'Told the user to set up Outlook and save files in a temporary profile.' },
        { id:'reset-password', text:'Reset Noah\'s password', critical:true, feedback:'Critical error. Sign-in worked, so his password is fine. This is a profile problem, not an account problem (KB-0090).', history:'Reset the password of a user whose sign-in worked.' },
      ],
      comments:{ timeCheck:{ time:HD_M03_TIME, promise:HD_M03_PROMISE, promiseLine:'A repair time is not yours to promise: Desktop Support sets it. Say when Noah will hear from you.', noTimeLine:'Tell Noah when you will update him, for example "by 11:30".' } },
      resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['User Profile Service', 'Event ID', '1511', '1515', 'Event Viewer', 'registry', 'ProfileList', 'KB-0090', 'NS-WS-0277', 'Tier 1', 'Tier 2', 'P4', 'SLA', 'escalate', 'escalated', 'escalating'] },
      feedback:[
        { area:'Triage', checks:[{ triage:{ category:'Software', subcategory:'Windows profile', ci:'NS-WS-0277' }, missing:'Set Category Software › Windows profile and CI NS-WS-0277: he signs in fine, so it is the profile, not the account.' }, { priority:'P4', missing:'Set Impact 3 (one person) and Urgency 2 (no deadline in the ticket). That makes the ticket P4.' }], good:'Software › Windows profile on NS-WS-0277, P4: one person, and no deadline in the ticket.', fix:'Set Category Software › Windows profile, CI NS-WS-0277, Impact 3 (one person) and Urgency 2. The ticket is P4.' },
        { area:'Investigation', checks:[{ seen:'event-log:application', computer:'NS-WS-0277', missing:'In Event Viewer, open Windows Logs › Application on NS-WS-0277 and look for User Profile Service events.' }, { kb:'KB-0090', missing:'Search the KB for "temporary profile" and open KB-0090.' }], good:'You found User Profile Service events 1511 and 1515 and used KB-0090.', fix:'Open the Application log on NS-WS-0277, look for User Profile Service 1511 and 1515, and open KB-0090.' },
        { area:'Diagnosis', checks:[{ action:'restart', missing:'Sign out and restart once, as KB-0090 says. Sometimes the profile loads normally.' }, { confirmed:'restarted', missing:'Ask Noah what he sees after the restart.' }], good:'One restart did not clear it, so this is a profile fault for Tier 2.', fix:'Restart once (KB-0090), then ask Noah what he sees. If the desktop is still blank, the profile needs Tier 2.' },
        { area:'Action', checks:[{ action:'no-save', missing:'Tell Noah not to save files or set up Outlook on this profile.' }, { typed:'^(dir|get-childitem|gci)\\b.*c:\\\\users\\\\nwilliams\\\\desktop', computer:'NS-WS-0277', missing:'Type dir C:\\Users\\nwilliams\\Desktop to confirm his files are still on the PC.' }, { group:'Desktop Support (Tier 2)', missing:'Assign the ticket to Desktop Support (Tier 2). Profile repairs are Tier 2.' }], good:'You protected his files, confirmed they are there and handed the profile repair to Tier 2.', fix:'Tell Noah not to save files, list his Desktop to confirm the files are there, then assign the ticket to Desktop Support (Tier 2) with the event IDs. Never delete the profile folder or reset the password.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action: Desktop Support repairs the profile, and you update Noah at a set time.' }, { comment:true, missing:'Write a comment for Noah in plain words, with no internal terms.' }, { commentTime:true, missing:'Tell Noah when he will hear from you, for example "by 11:30".' }], good:'A complete note with the next action, and a plain-words comment with a time for the next update.', fix:'Write a Reported / Tried / Result note with a Next action, and a plain-words comment that says when Noah will hear from you, for example: "Hi Noah, you weren\'t hacked, and your files are safe. We can see them on your computer. Windows signed you into a temporary profile because it couldn\'t load your normal one. Our desktop team will repair it, usually within a couple of hours, and everything will come back as it was. Until then, please avoid saving new files on this computer; OneDrive and Outlook on the web work fine. I\'ll update you by 11:30. – Riley"' },
      ],
    } }),
  // Ticket 5-B: a dock driver that blue-screens the laptop. Two related
  // records (HD-2187, HD-2188) name the same dock model.
  hdTicket({ id:'HD-2182', ownSet:true, number:'INC0010482', requester:'Lisa Park', department:'Finance', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T14:58:00Z', shortDescription:'Laptop blue screens when I dock it',
    description:'From: Lisa Park lpark@northstar.example · Subject: blue screen of death!!\nMy laptop keeps crashing with a blue screen. 3 times today, always when I plug into the dock. I took a photo: it says DRIVER_IRQL_NOT_LESS_OR_EQUAL and something like "dockusbnet.sys"',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: 3 blue screens today, each when docking; stop code DRIVER_IRQL_NOT_LESS_OR_EQUAL naming dockusbnet.sys (photo from the user). Tried: Reliability Monitor shows the dock\'s USB Ethernet driver updated yesterday and 3 critical events since; stable undocked; two more tickets name the same dock model (INC0010411, INC0010415), so linked them and raised Impact to 2 (P3); rolled back the Dock USB Ethernet driver in Device Manager; docked and undocked 3 times. Result: no crash in 3 dock cycles; Device Manager shows the earlier driver version; Reliability Monitor shows no new critical event; Lisa confirmed. Next action: Desktop Support blocks this driver update for the dock model; the two linked tickets need the same rollback.',
    console: {
      now:'2026-08-19T15:10:00Z', matrix:{}, classify:{ categories:HD_ITS03_CATEGORIES, cis:['NS-LT-0150', 'DOCK-3F-08', 'NS-LT-0117'], preset:{ contactType:'Email' } },
      priorityCoach:{ impact:'3', urgency:'2', line:'At first one person is affected (Impact 3), and she has no deadline in the ticket (Urgency 2): P4. Once other dock users report the same crash, raise Impact to 2 (P3).' },
      kb:true, link:true,
      caller:{ name:'Lisa Park', style:'chat', questions:[
        { id:'undocked', text:'Does the laptop crash when it is not on the dock?', reply:'No, it\'s fine undocked.' },
        { id:'photo', text:'Can you read me the stop code and the file name on the blue screen?', reply:'It says DRIVER_IRQL_NOT_LESS_OR_EQUAL, and under it dockusbnet.sys.' },
        { id:'confirm', text:'Please dock and undock the laptop a few times. Does it stay up?', afterAction:'driver-rollback', replyBefore:'I haven\'t tried yet. Is it safe to dock?', reply:'It stayed up every time. Thank you!' },
      ] },
      machines:{
        'NS-LT-0150':{
          computer:{ ip:'10.20.20.150', health:'Healthy' },
          uptimeDays:0,
          dock:{ name:'Dock model ND-200 (desk 3F-08)', power:true, docked:false, ethernet:'Dock USB Ethernet', peripherals:['Keyboard', 'Mouse'], monitors:[] },
          devices:[
            { id:'usbnet', category:'Network adapters', name:'Dock USB Ethernet', status:'OK', driver:{ provider:'Northstar Docking', date:'yesterday', version:'5.2.18.0' }, previous:{ provider:'Northstar Docking', date:'4 months ago', version:'5.1.9.0' }, crashOnDock:{ version:'5.2.18.0', stopCode:'DRIVER_IRQL_NOT_LESS_OR_EQUAL', file:'dockusbnet.sys' } },
            { id:'wifi', category:'Network adapters', name:'Wireless Network Adapter AX211', status:'OK', driver:{ provider:'Northstar Networks', date:'4 months ago', version:'23.60.0.10' } },
            { id:'audio', category:'Sound, video and game controllers', name:'Realtime High Definition Audio', status:'OK', driver:{ provider:'Realtime Audio', date:'2 months ago', version:'6.0.9601.1' } },
          ],
          reliability:[
            { day:'Sunday', critical:[], warnings:[], installs:[] },
            { day:'Monday', critical:[], warnings:[], installs:[] },
            { day:'Yesterday', critical:[], warnings:[], installs:['Dock USB Ethernet driver updated to 5.2.18.0'] },
            { day:'Today', today:true, critical:['Windows stopped working: blue screen (DRIVER_IRQL_NOT_LESS_OR_EQUAL)', 'Windows stopped working: blue screen (DRIVER_IRQL_NOT_LESS_OR_EQUAL)', 'Windows stopped working: blue screen (DRIVER_IRQL_NOT_LESS_OR_EQUAL)'], warnings:[], installs:[] },
          ],
        },
      },
      actions:[
        { id:'tell-desktop', text:'Tell Desktop Support about the pattern: three tickets name the same dock model and driver update', feedback:'Desktop Support has the pattern and can block this driver update for the dock model.', history:'Told Desktop Support (Tier 2) that three tickets name the same dock model and driver update.' },
        { id:'reset-pc', text:'Reset or reinstall Windows on Lisa\'s laptop', critical:true, feedback:'Critical error. Windows is fine: the crash happens only with one dock driver. Roll the driver back. Never reset a PC for a driver fault.', history:'Reset or reinstalled Windows for a driver fault.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['stop code', 'DRIVER_IRQL_NOT_LESS_OR_EQUAL','dockusbnet.sys', 'Device Manager', 'Reliability Monitor', 'Roll Back Driver', 'NS-LT-0150', 'INC0010411', 'INC0010415', 'Tier 1', 'Tier 2', 'P3', 'P4', 'SLA'] },
      feedback:[
        { area:'Triage', checks:[{ triage:{ category:'Software', subcategory:'OS crash (BSOD)', ci:'NS-LT-0150' }, missing:'Set Category Software › OS crash (BSOD) and CI NS-LT-0150, Lisa\'s laptop.' }, { priority:'P3', missing:'Link the two related tickets, then raise Impact to 2 (several dock users). That makes the ticket P3.' }], good:'The priority is P3: several people with the same dock model are affected.', fix:'Start at Impact 3 and Urgency 2 (P4). Once other dock users report the same crash, raise Impact to 2. The ticket is P3.' },
        { area:'Investigation', checks:[{ chat:['undocked'], missing:'Ask Lisa whether the laptop crashes when it is not on the dock.' }, { seen:'reliability', computer:'NS-LT-0150', missing:'Open Reliability Monitor on NS-LT-0150 and find what changed yesterday.' }], good:'It is stable undocked, and Reliability Monitor shows the dock driver updated yesterday.', fix:'Ask whether it crashes undocked, then open Reliability Monitor on NS-LT-0150 and look at yesterday and today.' },
        { area:'Diagnosis', checks:[{ child:'HD-2187', missing:'Open INC0010411 and link it to this ticket (INC0010482) as related. It names the same dock model.' }, { child:'HD-2188', missing:'Open INC0010415 and link it to this ticket (INC0010482) as related. It names the same dock model.' }], good:'You linked both related tickets: one dock driver update is the cause.', fix:'Open INC0010411 and INC0010415 and link each one to this ticket (INC0010482) as related. All three name the same dock model and a blue screen.' },
        { area:'Action', checks:[
          { action:'driver-rollback', missing:'In Device Manager › Network adapters › Dock USB Ethernet › Driver, click Roll Back Driver.' },
          { actionsAfter:{ after:'driver-rollback', action:'dock-connect', min:3, without:'blue-screen' }, missing:'After the rollback, dock the laptop three times with no blue screen.' },
          { seen:'reliability', computer:'NS-LT-0150', after:'driver-rollback', missing:'After the rollback, open Reliability Monitor again and check there is no new critical event.' },
          { action:'tell-desktop', missing:'Tell Desktop Support about the pattern, so they can block the driver update.' },
          { confirmed:'confirm', missing:'Ask Lisa to dock and undock, and confirm it stays up.' },
        ], good:'You rolled the driver back, docked three times with no crash, checked Reliability Monitor and told Desktop Support.', fix:'Roll back the Dock USB Ethernet driver, dock and undock three times, check Device Manager and Reliability Monitor, tell Desktop Support about the pattern and ask Lisa to confirm.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action: Desktop Support blocks the driver update, and the linked tickets need the same rollback.' }, { comment:true, missing:'Write a comment for Lisa in plain words, with no internal terms.' }, { status:'Resolved', missing:'Resolve the ticket once Lisa confirms.' }], good:'A complete note, a plain-words comment and the ticket resolved.', fix:'Write a Reported / Tried / Result note with a Next action, and a plain-words comment for Lisa, for example: "Hi Lisa, thanks for the photo of the error. It told us exactly where to look. A dock driver that installed yesterday was crashing your laptop. We\'ve put the previous, stable version back and tested docking several times with no crashes. We\'re also stopping that update for everyone else. – Riley"' },
      ],
    } }),
  // Related records for 5-B: the same dock model, no feedback of their own.
  hdTicket({ id:'HD-2187', ownSet:true, number:'INC0010411', requester:'Ravi Shah', department:'Sales', category:'Incident', subcategory:'General', ci:'NS-LT-0215', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T11:40:00Z', shortDescription:'Blue screen when I dock my laptop',
    description:'My laptop shows a blue screen when I connect it to the Dock model ND-200 at my desk.\nIt started today. It is fine when it is not docked.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'3', urgency:'2' }, link:true, comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['stop code', 'Device Manager', 'Tier 1', 'Tier 2', 'P3', 'P4', 'SLA', 'parent ticket'] },
    } }),
  hdTicket({ id:'HD-2188', ownSet:true, number:'INC0010415', requester:'Maya Chen', department:'Operations', category:'Incident', subcategory:'General', ci:'NS-LT-0042', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T13:05:00Z', shortDescription:'Blue screen when I dock my laptop',
    description:'My laptop gets a blue screen as soon as I plug it into the Dock model ND-200.\nIt did not do this last week.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    console: {
      matrix:{ impact:'3', urgency:'2' }, link:true, comments:true,
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['stop code', 'Device Manager', 'Tier 1', 'Tier 2', 'P3', 'P4', 'SLA', 'parent ticket'] },
    } }),
  // Ticket 5-C: a BitLocker recovery screen. The caller is verified before any
  // key is read out; the key whose ID does not match is never read out.
  hdTicket({ id:'HD-2183', ownSet:true, number:'INC0010483', requester:'Dina Foster', department:'Executive Office', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-21T07:01:00Z', shortDescription:'Laptop asks for a recovery key',
    description:'Phone call: "My laptop got a firmware update last night and now there\'s a blue screen asking for a BitLocker recovery key with a bunch of numbers. I don\'t have any key! I\'m at the airport and my flight boards in 40 minutes." Laptop NS-LT-0099.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: BitLocker recovery screen after last night\'s firmware update; user travelling, boarding in 40 minutes. Tried: verified per KB-0024 at 07:12 (called back on her directory mobile; employee ID confirmed); Key ID 3A7F9C21 on her screen matched a stored key for NS-LT-0099; read the recovery key aloud in groups per KB-0083. Result: Windows loaded at 07:16; Dina confirmed. Next action: Desktop Support rotates the recovery key, released today (Key ID 3A7F9C21).',
    console: {
      now:'2026-08-21T07:05:00Z', matrix:{}, classify:{ categories:HD_ITS03_CATEGORIES, cis:['NS-LT-0099', 'NS-WS-0204', 'NS-LT-0215'], preset:{ contactType:'Phone' } },
      priorityCoach:{ impact:'3', urgency:'1', line:'One person is affected (Impact 3), and she boards in 40 minutes (Urgency 1): P3. She is in the Executive Office; the process is the same for everyone.' },
      kb:true,
      caller:{ name:'Dina Foster', style:'phone', questions:[
        { id:'keyid', text:'Please read me the Key ID on your recovery screen.', reply:'It says Key ID 3A7F9C21, and then a long line of letters and numbers.' },
        { id:'loaded', text:'Please type the key while I read it. Does Windows load?', afterAction:'read-match', replyBefore:'Still the blue screen.', reply:'It\'s loading! I\'m in. Thank you!' },
      ] },
      verification:{ prompt:'Dina Foster is on the phone from the airport. She asks for her BitLocker recovery key and says she boards in 40 minutes. How do you verify it is really Dina? (KB-0024)', options:[
        { id:'name', text:'Accept it: Dina gives her name and says she is an executive assistant in a hurry', feedback:'Not verification. A deadline or a senior title does not change the check (KB-0083). Call Dina back on her directory number and confirm her employee ID.' },
        { id:'callback', text:'Call Dina back on her mobile number in the User Directory and confirm her employee ID', pass:true, feedback:'Verified. You called Dina back on 407-555-0187 from the User Directory, and she confirmed employee ID E-39167.', history:'Identity verified per KB-0024 at 07:12: called Dina back on her directory mobile (407-555-0187); employee ID E-39167 confirmed.' },
        { id:'number-given', text:'Call Dina back on the number she gives you', feedback:'Not verification. A number the caller gives you proves nothing. KB-0024: call back on the number in the User Directory.' },
      ] },
      machines:{
        'NS-LT-0099':{
          computer:{ ip:'10.20.50.99', health:'BitLocker recovery' },
          bitlockerKeys:[
            { keyId:'3A7F9C21', date:'Today', key:'118206-447031-905526-263874-710349-582167-336092-871455' },
            { keyId:'B52E07D4', date:'2/11/2025', key:'654209-018337-472861-309514-826790-153408-947622-260183' },
          ],
        },
      },
      actions:[
        { id:'read-match', text:'Read the stored key with Key ID 3A7F9C21 aloud to Dina, in groups of six', bitlockerKey:'3A7F9C21', needsVerification:true, earlyCritical:'Read out the recovery key before verifying the caller', earlyFeedback:'Critical error. Verify Dina before you read out any key (KB-0024, KB-0083): call her back on her directory number and confirm her employee ID.', feedback:'You read the key aloud in groups of six while Dina typed it.', history:'Read the recovery key with Key ID 3A7F9C21 aloud in groups of six after verifying the caller. The key is not recorded.' },
        { id:'read-other', text:'Read the stored key with Key ID B52E07D4 aloud to Dina', bitlockerKey:'B52E07D4', critical:true, needsVerification:true, feedback:'Critical error. That key\'s ID does not match the one on her screen, so it will not work. A key that does not match is never read out (KB-0083).', history:'Read out a recovery key whose Key ID did not match the one on the user\'s screen.' },
        { id:'email-key', text:'Email the recovery key to Dina', critical:true, feedback:'Critical error. Never send a recovery key by email, chat or text. Read it aloud while the user types it (KB-0083).', history:'Sent a recovery key by email.' },
        { id:'text-key', text:'Text the recovery key to Dina\'s phone', critical:true, feedback:'Critical error. Never send a recovery key by email, chat or text. Read it aloud while the user types it (KB-0083).', history:'Sent a recovery key by text message.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Active Directory', 'AD', 'KB-0083', 'KB-0024', 'NS-LT-0099', 'Tier 1', 'Tier 2', 'P3', 'SLA', 'rotate', 'rotated', 'escalate', 'escalated'] },
      feedback:[
        { area:'Triage', checks:[{ triage:{ category:'Software', subcategory:'Encryption (BitLocker)', ci:'NS-LT-0099' }, missing:'Set Category Software › Encryption (BitLocker) and CI NS-LT-0099, Dina\'s laptop.' }, { priority:'P3', missing:'Set Impact 3 (one person) and Urgency 1 (she boards in 40 minutes). That makes the ticket P3. The process is the same for everyone in the company.' }], good:'The priority is P3: one person, and she boards in 40 minutes.', fix:'Set Impact 3 (one person) and Urgency 1 (a flight in 40 minutes). The ticket is P3.' },
        { area:'Investigation', checks:[{ kb:'KB-0083', missing:'Search the KB for "recovery key" and open KB-0083.' }, { chat:['keyid'], missing:'Ask Dina to read you the Key ID on her recovery screen.' }, { seen:'ad-bitlocker', computer:'NS-LT-0099', missing:'Open Active Directory › Computers › NS-LT-0099 and look at its BitLocker Recovery tab. It lists two keys.' }], good:'You used KB-0083, got the Key ID from Dina and found both stored keys.', fix:'Open KB-0083, ask Dina for the Key ID, then open NS-LT-0099 in Active Directory › Computers and look at its BitLocker Recovery tab.' },
        { area:'Action', checks:[{ verified:true, missing:'Verify Dina first (KB-0024): call her back on the number in the User Directory and confirm her employee ID.' }, { action:'read-match', missing:'Read the key whose Key ID matches the one on her screen (3A7F9C21), aloud, in groups of six.' }, { confirmed:'loaded', missing:'Ask Dina to confirm Windows loads.' }], good:'You verified her first, read only the matching key aloud and confirmed Windows loaded.', fix:'Verify Dina first, read aloud only the key with the same Key ID as her screen, in groups of six, and confirm Windows loads. Never send a key by email or text, and never read out a key whose ID does not match.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action: Desktop Support rotates the key. Never write the key itself.' }, { comment:true, missing:'Write a comment for Dina in plain words, with no internal terms.' }, { notePattern:'3A7F9C21', missing:'Write the Key ID (3A7F9C21) in your note, never the key itself.' }, { status:'Resolved', missing:'Resolve the ticket once Dina confirms Windows loaded.' }], good:'A complete note with the Key ID and no key, a plain-words comment, and the ticket resolved.', fix:'Write a Reported / Tried / Result note that records the time you verified her and the Key ID, never the key, with a Next action for Desktop Support to rotate it. Write a plain-words comment for Dina, for example: "Hi Dina, glad you\'re back in before your flight! The firmware update made your laptop ask for its security recovery key, which is normal after that kind of update. We confirmed it was you and gave you the key over the phone. We\'ll refresh the key on our side so it stays secure. Have a good trip. – Riley"' },
      ],
    } }),
  // Ticket 5-D: a laptop that shuts off under load because it is hot.
  hdTicket({ id:'HD-2186', ownSet:true, number:'INC0010484', requester:'Evan Parker', department:'Finance', category:'Incident', subcategory:'General', priority:'', businessImpact:'', sla:'', createdAt:'2026-08-19T11:14:00Z', shortDescription:'My laptop keeps shutting off',
    description:'My laptop just turned itself off. Twice today, both times in the middle of the payroll export. No warning, the screen just goes black. The export has to be in by 2:00.',
    symptoms:[], logs:[], systemState:[], correctPath:[], plausibleCauses:[],
    expectedResolution:'Reported: laptop shut off twice today during the payroll export; no blue screen, the screen goes black; export due at 2:00. Tried: System log shows Kernel-Power Event ID 41 twice today; Reliability Monitor shows two "not properly shut down" events and no installs this week; no stop code. Evan says the case is very hot, the fan has been loud all week, and the laptop has sat on a stack of folders since Monday. Had him shut down, let it cool, move it to the bare desk and clear the vents. Result: export ran to the end; no new Event ID 41; fan quieter; Evan confirmed. Told him to call back if it shuts off again on a hard surface, so Desktop Support can check the fan.',
    console: {
      now:'2026-08-19T11:20:00Z', matrix:{}, classify:{ categories:HD_ITS03_CATEGORIES, cis:['NS-LT-0118', 'NS-LT-0117', 'NS-PAY-SECURE'], preset:{ contactType:'Phone' } },
      priorityCoach:{ impact:'3', urgency:'1', line:'One person is affected (Impact 3), and his work is blocked and due today (Urgency 1): P3.' },
      kb:true,
      caller:{ name:'Evan Parker', style:'phone', questions:[
        { id:'screen', text:'Do you see a blue screen or an error first?', reply:'No. It just goes black.' },
        { id:'hot', text:'Is the laptop hot, or is the fan loud?', reply:'It\'s burning hot underneath and the fan has been roaring all week.' },
        { id:'where', text:'Where does the laptop sit while you work?', reply:'On a stack of folders on my desk. I rearranged my desk on Monday.' },
        { id:'changed', text:'Did anything else change, like new software?', reply:'Nothing.' },
        { id:'quieter', text:'Please run the payroll export again. Does it finish, and is the fan quieter?', afterAction:'retry', replyBefore:'It shut off again.', reply:'It finished, and the fan is much quieter.' },
      ] },
      machines:{
        'NS-LT-0118':{
          computer:{ ip:'10.20.20.118', health:'Healthy' },
          uptimeDays:0,
          processes:[
            { name:'Payroll Export', cpu:81, memory:1840, disk:6 },
            { name:'Microsoft Excel', cpu:9, memory:760, disk:1.5 },
            { name:'Microsoft Edge', cpu:4, memory:640, disk:0.3 },
            { name:'Windows Explorer', cpu:1, memory:150, disk:0.2 },
          ],
          performance:{ cpu:96, memory:58, disk:9 },
          storage:{ drive:'C:', sizeGb:476, freeGb:276,
            categories:[{ name:'Apps & features', gb:90 }, { name:'Documents', gb:55 }, { name:'System & reserved', gb:40 }, { name:'Other', gb:15 }],
            driveHealth:'Good' },
          events:{
            system:[
              { level:'Critical', time:'Today 10:52', source:'Kernel-Power', id:'41', message:'The system has rebooted without cleanly shutting down first. This error could be caused if the system stopped responding, crashed, or lost power unexpectedly.', details:'BugcheckCode: 0 (no stop code was recorded)' },
              { level:'Critical', time:'Today 09:48', source:'Kernel-Power', id:'41', message:'The system has rebooted without cleanly shutting down first. This error could be caused if the system stopped responding, crashed, or lost power unexpectedly.', details:'BugcheckCode: 0 (no stop code was recorded)' },
            ],
            application:[],
            'diagnostics-performance':[],
          },
          reliability:[
            { day:'Monday', critical:[], warnings:[], installs:[] },
            { day:'Tuesday', critical:[], warnings:[], installs:[] },
            { day:'Today', today:true, critical:['Windows was not properly shut down', 'Windows was not properly shut down'], warnings:[], installs:[] },
          ],
        },
      },
      actions:[
        { id:'cool', text:'Ask Evan to save his work, shut down and let the laptop cool for a few minutes', feedback:'Evan: "Okay, saving the export settings and shutting it down."', history:'Asked the user to save, shut down and let the laptop cool.' },
        { id:'move', text:'Ask Evan to put the laptop on the bare, hard desk and check that nothing covers the vents', feedback:'Evan: "It\'s on the bare desk now, and I moved the folders away from the vents."', history:'Asked the user to move the laptop to a hard, flat surface and clear the vents.' },
        { id:'retry', text:'Ask Evan to run the payroll export again', needsAction:['cool', 'move'], beforeText:'Evan: "It shut off again in the middle of the export."', feedback:'Evan starts the payroll export again.', history:'Asked the user to run the payroll export again.' },
        { id:'dism-sfc', text:'Run DISM and SFC on Evan\'s laptop', feedback:'System-file repair doesn\'t fix heat. The evidence pointed at the laptop\'s cooling.', history:'Ran system-file repair for a laptop that shuts off from heat.' },
        { id:'escalate-fan', text:'Escalate to Desktop Support to check the fan', needsAction:['move', 'retry'], beforeText:'Moving it to a hard surface and clearing the vents is a Tier 1 step. Try it and test before you hand off.', feedback:'Desktop Support will check the fan if the shut-offs come back on a hard surface.', history:'Escalated to Desktop Support to check the fan.' },
        { id:'open-case', text:'Tell Evan to open the laptop\'s case and clean the fan', critical:true, feedback:'Critical error. Tier 1 never asks a user to open a laptop\'s case (KB-0071). Move it to a hard surface and test again.', history:'Told the user to open the laptop\'s case.' },
        { id:'reset-pc', text:'Reset or reinstall Windows on Evan\'s laptop', critical:true, feedback:'Critical error. Windows is not the cause. The evidence pointed at heat. Never reset a PC for a cooling problem.', history:'Reset or reinstalled Windows for a heat problem.' },
      ],
      comments:true, resolutionCode:{ required:true },
      notes:{ parts:['reported', 'tried', 'result'], nextAction:true, jargon:['Event ID', 'Kernel-Power', 'Event Viewer', 'Reliability Monitor', 'stop code', 'CPU', 'NS-LT-0118', 'Tier 1', 'Tier 2', 'P3', 'SLA'] },
      feedback:[
        { area:'Triage', checks:[{ triage:{ category:'Hardware', subcategory:'Laptop', ci:'NS-LT-0118' }, missing:'Set Category Hardware › Laptop and CI NS-LT-0118: the evidence points at the laptop, not Windows.' }, { priority:'P3', missing:'Set Impact 3 (one person) and Urgency 1 (his work is blocked and due today). That makes the ticket P3.' }], good:'The priority is P3: one person, and the export is due today.', fix:'Set Impact 3 (one person) and Urgency 1 (blocked, due today). The ticket is P3.' },
        { area:'Investigation', checks:[{ seen:'event-log:system', computer:'NS-LT-0118', missing:'In Event Viewer, open Windows Logs › System on NS-LT-0118 and look for Event ID 41.' }, { chat:['screen', 'hot', 'where'], missing:'Ask Evan what he sees first, whether the laptop is hot or loud, and where it sits.' }], good:'You found Event ID 41 with no stop code, and asked what he sees, how hot it is and where it sits.', fix:'Open the System log on NS-LT-0118 for Event ID 41, then ask Evan what he sees, whether it is hot or loud, and where it sits.' },
        { area:'Diagnosis', checks:[{ chat:['changed'], missing:'Ask Evan whether anything else changed, such as new software, before you decide it is heat.' }], good:'Event ID 41 with no stop code, under load, a hot case on a soft surface: heat, not Windows.', fix:'Event ID 41 has no stop code, it happens only under load, the case is hot and the laptop sits on soft folders. That is heat, not a driver crash or a Windows fault.' },
        { area:'Action', checks:[
          { action:'cool', missing:'Ask Evan to save his work, shut down and let the laptop cool.' },
          { action:'move', missing:'Ask Evan to move the laptop to a hard, flat surface and check the vents.' },
          { action:'retry', missing:'Ask Evan to run the export again, so you test under the same load.' },
          { confirmed:'quieter', missing:'Ask Evan whether the export finished and the fan is quieter.' },
          { seen:'event-log:system', computer:'NS-LT-0118', after:'retry', missing:'After the second export, open the System log again and check there is no new Event ID 41.' },
        ], good:'You cooled it, moved it to a hard surface, tested under the same load and checked there was no new Event ID 41.', fix:'Have Evan shut down and cool the laptop, move it to a hard surface and clear the vents, then run the export again. Confirm with him, and check the System log for a new Event ID 41. Never ask him to open the case.' },
        { area:'Documentation', checks:[{ note:true, missing:'Write a Reported / Tried / Result note with a Next action.' }, { comment:true, missing:'Write a comment for Evan in plain words, with no internal terms.' }, { commentPattern:'call|again|happens', missing:'Tell Evan what to do if it shuts off again on a hard surface.' }, { status:'Resolved', missing:'Resolve the ticket once Evan confirms the export finished.' }], good:'A complete note, a plain-words comment that says what to do if it returns, and the ticket resolved.', fix:'Write a Reported / Tried / Result note and a plain-words comment, for example: "Hi Evan, your laptop was shutting itself off to protect itself from heat. Sitting on the folders blocked the air vents underneath. On the bare desk it stayed cool and your export finished. Keep it on a hard, flat surface, and if it ever shuts off like that again, call us and our desktop team will check the fan. – Riley"' },
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
      // The student takes it with Assign to me (In Progress), as on the
      // Module 1 practice tickets. A draft saved before 2026-11-20 keeps
      // Assigned / Riley Morgan, which counts as assigned (ui/helpdesk.js).
      status: 'New', assignedTechnician: 'Unassigned',
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
  /* Module 2 (key its-10): the queue shift. Six short tickets on a fixed
   * Monday 08:05 shift clock (ui/helpdesk.js queue Prove mode). The student
   * sets Impact, Urgency and Class on each, links tickets about one outage,
   * puts the queue in work order, writes reasons and rewrites the ticket
   * marked `rewrite`. The queue and the ticket show only the INC number.
   * `arrives` keeps a ticket out of the queue until the student has triaged
   * `afterTriaged` tickets or `afterMinutes` real minutes have passed since
   * the attempt started; it is created at the shift clock. Only what the
   * student sees lives here: no expected values. */
  'its-10': {
    title: 'Prove It: queue shift',
    labKey: 'lab-its-10-prove-it',
    rubricVersion: 'hdesk-its-10-prove-v1',
    queue: true,
    now: '2026-08-17T08:05:00Z',
    timeBoxMinutes: 20,
    tickets: [
      { id: 'HD-2137', number: 'INC0010462', title: 'Warehouse can\'t print labels or scan',
        requester: 'Monica Hall', requesterTitle: 'Logistics Manager', department: 'Logistics', createdAt: '2026-08-17T07:40:00Z', contactType: 'Phone',
        description: 'Nobody at the warehouse can print shipping labels or scan. We\'re doing it on paper. Trucks leave at 11.',
        conversation: [
          { from: 'Monica Hall', role: 'Logistics Manager', text: 'It\'s all of dock A: every handheld scanner and both label printers. It started around 07:40.' },
        ] },
      { id: 'HD-2138', number: 'INC0010465', title: 'scanner says no network', rewrite: true,
        requester: 'Elena Ruiz', requesterTitle: 'Logistics Coordinator', department: 'Logistics', createdAt: '2026-08-17T07:52:00Z', contactType: 'Chat',
        description: 'scanner says no network',
        conversation: [
          { from: 'Elena Ruiz', role: 'Logistics Coordinator', text: 'It\'s my handheld, HS-14, at dock A. The screen says "No network", since about 07:40. I restarted it and got the same thing. We\'re picking orders on paper for now.' },
        ] },
      { id: 'HD-2139', number: 'INC0010464', title: 'Payroll export to the bank failed',
        requester: 'Evan Parker', requesterTitle: 'Payroll Specialist', department: 'Finance', contactType: 'Chat',
        arrives: { afterTriaged: 3, afterMinutes: 8 },
        description: 'Quick question, no rush: the payroll export to the bank failed with \'cannot connect to server\'. Payroll is due at noon.',
        conversation: [] },
      { id: 'SR-2140', number: 'INC0010460', title: 'Visio install',
        requester: 'Grace Kim', requesterTitle: 'Recruiting Coordinator', department: 'Human Resources', createdAt: '2026-08-17T07:51:00Z', contactType: 'Self-service',
        description: 'Can I get Visio installed? My manager approved it.',
        conversation: [] },
      { id: 'HD-2141', number: 'INC0010463', title: 'Second monitor flickering',
        requester: 'Dina Foster', requesterTitle: 'Executive Assistant', department: 'Executive Office', createdAt: '2026-08-17T07:53:00Z', contactType: 'Email',
        description: 'URGENT!!! My second monitor keeps flickering. Please fix ASAP.',
        conversation: [
          { from: 'Dina Foster', role: 'Executive Assistant', text: 'It\'s only the second screen. My laptop screen is fine and I can keep working on it.' },
        ] },
      { id: 'SEC-2142', number: 'INC0010461', title: 'Text from "IT" about MFA',
        requester: 'Jordan Bell', requesterTitle: 'Financial Analyst', department: 'Finance', createdAt: '2026-08-17T07:55:00Z', contactType: 'Phone',
        description: 'Got a text from \'IT\' saying re-register MFA or lose access. I tapped the link, it looked weird, I closed it. Didn\'t type anything.',
        conversation: [] },
    ],
  },
  /* Module 3 (key its-11): one ticket on a fixed Tuesday 10:15 shift clock,
   * worked on Module 1's one-ticket Prove form with Module 3's extra parts
   * (ui/helpdesk.js): the student sets Class, Category, Impact and Urgency
   * (Priority calculates) and the assignment group, opens the earlier calls
   * and the evidence cards (each opening is recorded), and writes a
   * key-finding note, the handoff note, the customer update and a KB draft.
   * A Warm handoff control logs a call to the chosen group. No typed commands
   * and no SLA bar. Screens show the INC number only. Only what the student
   * sees lives here: no expected values. */
  'its-11': {
    title: 'Prove It: Independent Ticket',
    labKey: 'lab-its-11-prove-it',
    rubricVersion: 'hdesk-its-11-prove-v1',
    now: '2026-08-18T10:15:00Z',
    timeBoxMinutes: 30,
    selectedComputer: 'NS-LT-0190',
    tickets: [{
      id: 'HD-2133', number: 'INC0010402', title: 'NorthLedger won\'t open on new laptop',
      requester: 'Jordan Bell', requesterTitle: 'Financial Analyst', department: 'Finance',
      device: 'NS-LT-0190', cc: '', contactType: 'Phone', createdAt: '2026-08-14T09:20:00Z',
      status: 'New', assignedTechnician: 'Unassigned',
      description: 'This is my THIRD call. Month-end close is tomorrow at 9 and I still can\'t run my reports. Someone promised me yesterday it would be fixed by end of day. I need a real answer, not another \'we\'re looking into it\'.',
      conversation: [],
      // The student sets Class, Category, Impact and Urgency (Priority is
      // Impact x Urgency) and the assignment group (ui/helpdesk.js).
      matrix: true,
      categoryOptions: ['Account / access', 'Application', 'Hardware', 'Network', 'Security'],
      // Earlier calls on this ticket. Each opens on its own and is recorded.
      history: [
        { id: 'fri', title: 'Friday · first call', author: 'Service Desk', text: 'New laptop NS-LT-0190: Outlook and the Finance drive weren\'t set up. Fixed both.' },
        { id: 'mon', title: 'Monday · second call', author: 'Service Desk', text: 'NorthLedger won\'t open. Reinstalled NorthLedger from Software Center. Told the user it would be fixed by end of day.' },
      ],
      // Read-only evidence cards, given in place of commands (no reading has
      // taught one). Each opens on its own and is recorded.
      evidence: [
        { id: 'northledger', title: 'NorthLedger on NS-LT-0190', lines: ['Required runtime NLRuntime 6 not found. Contact your administrator.'] },
        { id: 'software-center', title: 'Software Center on NS-LT-0190', lines: ['NorthLedger 2026.2: Succeeded', 'NLRuntime 6: Failed', 'Install type: device-wide'],
          notes: ['A runtime is an add-on a program needs before it will start.', 'A device-wide install changes the laptop for every user.'] },
        { id: 'finance-laptops', title: 'Other Finance laptops', lines: ['Finance laptops set up before this month run NorthLedger normally. NS-LT-0190 has the new standard setup that new laptops get.'] },
        { id: 'loaners', title: 'Service Desk loaner pool', lines: ['2 laptops with the earlier setup are available today. NorthLedger runs on them.'] },
      ],
      diagnosisOptions: ['Account permissions', 'NorthLedger server down', 'Runtime missing on the new laptop setup', 'User needs training'],
      // Ids are this ticket's own, so no other Prove It's steps land on them.
      pathPool: [
        { id: 'q1', text: 'Read both earlier calls on the ticket before answering Jordan' },
        { id: 'q2', text: 'Reproduce the error on NS-LT-0190' },
        { id: 'q3', text: 'Check the Software Center install status' },
        { id: 'q4', text: 'Confirm that older Finance laptops run NorthLedger' },
        { id: 'q5', text: 'Escalate the ticket' },
        { id: 'q6', text: 'Offer a loaner laptop' },
        { id: 'q7', text: 'Reinstall NorthLedger from Software Center again' },
      ],
      // Module 3's writing boxes beside the work note and the reply.
      labels: { resolutionNote: 'Handoff note', resolutionHint: 'Reported / Tried / Result / Next action, for the team that takes it next', userReply: 'Customer update' },
      writing: {
        keyFinding: { label: 'Key finding', hint: 'One or two sentences: what you found and why it matters.', rows: 3, max: 600 },
        kbDraft: { label: 'KB draft: NorthLedger won\'t open on a new Finance laptop', hint: 'Symptom, cause, fix or workaround, result and owner.', rows: 6, max: 4000 },
      },
      warmHandoff: true,
    }],
    computers: [
      { name:'NS-LT-0190', user:'Jordan Bell', os:'Windows 11 Enterprise 24H2', ip:'10.20.20.190', ou:'OU=Finance,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy', uptimeDays:4 },
    ],
    machines: {},
  },
  /* Module 4 (key its-02): one ticket on a fixed Wednesday 09:40 shift clock,
   * on Module 3's one-ticket form (matrix fields) with Module 4's typed
   * commands and printer screens on two dock B stations (machine state below;
   * ui/helpdesk.js "Machine-state console features"). machineTools shows every
   * tool on both stations, and every queue offers a driver from the
   * manufacturer's website, so neither points at the case. printerSummary: the
   * package carries each queue's port, driver and paper size on the selected
   * computer (ui/helpdesk.js hdProvePrinterSummary). Theo's reply arrives once
   * the first job prints from his queue. Only what the student sees lives
   * here: no expected values. */
  'its-02': {
    title: 'Prove It: Independent Ticket',
    labKey: 'lab-its-02-prove-it',
    rubricVersion: 'hdesk-its-02-prove-v1',
    now: '2026-08-19T09:40:00Z',
    timeBoxMinutes: 20,
    selectedComputer: 'NS-WH-PC07',
    machineTools: true,
    printerSummary: true,
    tickets: [{
      id: 'HD-2136', number: 'INC0010499', title: 'Label printer says Offline',
      requester: 'Theo Grant', requesterTitle: 'Logistics Coordinator', department: 'Logistics',
      device: 'NS-WH-PC07', cc: '', contactType: 'Phone', createdAt: '2026-08-19T09:36:00Z',
      status: 'New', assignedTechnician: 'Unassigned',
      description: 'The label printer at dock B says Offline on my PC. The printer itself says Ready. We ship at 11.',
      conversation: [],
      matrix: true,
      categoryOptions: ['Account / access', 'Docking station', 'Network', 'Printer', 'Software'],
      // The knowledge base search, and Theo's reply once a job prints from
      // his queue while the paper is still the size the update set (the only
      // console features a Prove ticket can turn on).
      console: {
        kb: true,
        arrivals: [{ id: 'theo-printed', from: 'Theo Grant', text: 'It printed! But the barcode is cut off at the bottom.',
          when: { all: [
            { machine: { computer: 'NS-WH-PC07', path: ['printQueues', 'NS-WH-LABEL02', 'printed', '0', 'owner'], value: 'Theo Grant' } },
            { machine: { computer: 'NS-WH-PC07', path: ['printQueues', 'NS-WH-LABEL02', 'media'], value: '4 × 3 in' } },
          ] } }],
      },
      // Read-only evidence cards. Each opens on its own and is recorded.
      evidence: [
        { id: 'windows-update', title: 'Windows Update history on NS-WH-PC07', lines: ['ZetaLabel ZT driver 5.1: installed today 02:10'], notes: ['Windows Update can install a newer printer driver by itself.'] },
        { id: 'software-catalog', title: 'Software Catalog: label printer drivers', lines: ['NS-WH-LABEL02: approved driver ZetaLabel ZT 4.6'], notes: ['Install printer drivers only from the catalog.'] },
        { id: 'asset-record', title: 'Asset record: NS-WH-LABEL02', lines: ['Location: warehouse dock B', 'Connection: direct IP, Standard TCP/IP port, address 10.20.30.15', 'Labels: 4 × 6 in'] },
        { id: 'label-stock', title: 'Label stock at dock B', lines: ['Loaded roll: about half full', '3 spare rolls of 4 × 6 in labels on the shelf'] },
      ],
      diagnosisOptions: ['Driver update changed the printer port', 'Network outage on dock B', 'Print server spooler crash', 'Printer out of labels'],
      // Ids are this ticket's own, so no other Prove It's steps land on them.
      pathPool: [
        // Action-level wording with no values, so the list never states the fix.
        { id: 'w1', text: 'Check whether the other dock B station prints' },
        { id: 'w2', text: 'Ping the printer' },
        { id: 'w3', text: 'Check the printer\'s port' },
        { id: 'w4', text: 'Check what changed on the computer recently' },
        { id: 'w5', text: 'Change the printer\'s port' },
        { id: 'w6', text: 'Change the printer\'s driver' },
        { id: 'w7', text: 'Change the paper size and print a test label' },
        { id: 'w8', text: 'Confirm with Theo that the labels scan' },
        { id: 'w9', text: 'Restart the print server\'s spooler' },
        { id: 'w10', text: 'Replace the label roll' },
        { id: 'w11', text: 'Delete the queued shipping labels to clear the queue' },
        { id: 'w12', text: 'Install a driver downloaded from the manufacturer\'s website' },
        { id: 'w13', text: 'Restart Theo\'s computer' },
        { id: 'w14', text: 'Update the printer\'s driver to the newest version' },
      ],
    }],
    computers: [
      { name:'NS-WH-PC07', user:'Theo Grant', os:'Windows 11 Enterprise 24H2', ip:'10.20.30.107', ou:'OU=Logistics,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy', uptimeDays:6 },
      { name:'NS-WH-PC08', user:'Dock B shared station', os:'Windows 11 Enterprise 24H2', ip:'10.20.30.108', ou:'OU=Logistics,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy', uptimeDays:6 },
    ],
    // Both dock B stations print to NS-WH-LABEL02 directly (no print server).
    machines: {
      'NS-WH-PC07': {
        printers: ['Microsoft Print to PDF', 'NS-WH-LABEL02'], pendingPolicyPrinters: [], localAdministrators: ['NORTHSTAR\\Domain Admins', 'NS-WH-PC07\\MNT-Support'],
        computer: { ip:'10.20.30.107', health:'Healthy' },
        spooler: 'Running',
        ports: [{ name:'WSD-7f3a', type:'WSD', works:false }, { name:'IP_10.20.30.15', type:'Standard TCP/IP', address:'10.20.30.15' }],
        driverCatalog: ['ZetaLabel ZT 4.6', 'Generic / Text Only'],
        reachable: { '10.20.30.15':[9100] },
        printQueues: {
          'NS-WH-LABEL02': { port:'WSD-7f3a', driver:'ZetaLabel ZT 5.1', drivers:['ZetaLabel ZT 5.1'], outsideDriver:'ZetaLabel ZT 5.2 (manufacturer download)',
            media:'4 × 3 in', mediaSizes:['4 × 3 in', '4 × 6 in', 'Letter'], offline:false, paused:false, printed:[],
            jobs: Array.from({ length:14 }, (_, i) => ({ id:401 + i, document:`Shipping label ${String(8811 + i)}`, pages:1, owner:'Theo Grant', status:'Spooling' })) },
        },
      },
      'NS-WH-PC08': {
        printers: ['Microsoft Print to PDF', 'NS-WH-LABEL02'], pendingPolicyPrinters: [], localAdministrators: ['NORTHSTAR\\Domain Admins', 'NS-WH-PC08\\MNT-Support'],
        computer: { ip:'10.20.30.108', health:'Healthy' },
        spooler: 'Running',
        ports: [{ name:'IP_10.20.30.15', type:'Standard TCP/IP', address:'10.20.30.15' }],
        driverCatalog: ['ZetaLabel ZT 4.6', 'Generic / Text Only'],
        reachable: { '10.20.30.15':[9100] },
        printQueues: {
          'NS-WH-LABEL02': { port:'IP_10.20.30.15', driver:'ZetaLabel ZT 4.6', drivers:['ZetaLabel ZT 4.6'], outsideDriver:'ZetaLabel ZT 5.2 (manufacturer download)',
            media:'4 × 6 in', mediaSizes:['4 × 3 in', '4 × 6 in', 'Letter'], offline:false, paused:false, jobs:[],
            printed: [{ document:'Shipping label 8807', pages:1, owner:'Dock B shared station' }, { document:'Shipping label 8808', pages:1, owner:'Dock B shared station' }] },
        },
      },
    },
  },
  // BEGIN Module 5 Prove It shift (tests/hdesk-m05-guided-lab.test.js skips
  // this block, the only place its ticket's names may appear).
  /* Module 5 (key its-03): one ticket on a fixed Monday 09:05 shift clock, on
   * Module 3's one-ticket form (matrix fields), worked on one laptop with
   * Module 5's Windows tool screens (ui/helpdesk.js "Windows client tools").
   * machineTools shows the same tools a Module 5 computer has, so the buttons
   * don't point at the case. windowsSummary: the package carries each startup
   * app's status, the installed apps, the restarts and the boot time
   * (ui/helpdesk.js hdProveWindowsSummary). The fast boot after a Restart
   * waits for the startup app named in bootSecondsAfterFixNeeds to be off.
   * Only what the student sees lives here: no expected values. */
  'its-03': {
    title: 'Prove It: Independent Ticket',
    labKey: 'lab-its-03-prove-it',
    rubricVersion: 'hdesk-its-03-prove-v1',
    now: '2026-08-24T09:05:00Z',
    timeBoxMinutes: 20,
    selectedComputer: 'NS-LT-0102',
    machineTools: true,
    windowsSummary: true,
    hideEventsFrom: ['NS-LT-0081'],
    catalog: [...HD_ITS03_CATALOG, { name:'PDF Studio Enterprise', publisher:'Northstar IT', note:'Approved PDF editor and viewer' }, { name:'Northstar Recruiting', publisher:'Northstar IT' }],
    tickets: [{
      id: 'HD-2126', number: 'INC0010485', title: 'Laptop takes 10 minutes to start',
      requester: 'Grace Kim', requesterTitle: 'Recruiting Coordinator', department: 'Human Resources',
      device: 'NS-LT-0102', cc: '', contactType: 'Self-service', createdAt: '2026-08-24T08:58:00Z',
      status: 'New', assignedTechnician: 'Unassigned',
      description: 'Since last Tuesday my laptop takes about 10 minutes to start. Once it\'s up it\'s mostly fine. I have interviews all afternoon.',
      conversation: [],
      matrix: true,
      categoryOptions: ['Account / access', 'Hardware', 'Network', 'Printer', 'Software'],
      // The knowledge base search (the only console feature this ticket turns on).
      console: { kb: true },
      // Read-only evidence cards. Each opens on its own and is recorded.
      evidence: [
        { id: 'windows-security', title: 'Windows Security on NS-LT-0102', lines: ['Last quick scan: today 08:52', 'Current threats: none found', 'Virus & threat protection: on'] },
        { id: 'hr-laptops', title: 'Endpoint report: Human Resources laptops', lines: ['Start-up time this week, 6 other HR laptops: 41 to 55 seconds', 'NS-LT-0102: about 10 minutes since last Tuesday'] },
      ],
      diagnosisOptions: ['Failing hard drive', 'Pending Windows Update', 'Unapproved startup application', 'Malware infection'],
      // Ids are this ticket's own, so no other Prove It's steps land on them.
      pathPool: [
        // Action-level wording with no names, so the list never states the fix.
        { id: 'p1', text: 'Ask Grace when it started and whether other laptops are affected' },
        { id: 'p2', text: 'Review the startup apps in Task Manager' },
        { id: 'p3', text: 'Check Event Viewer for errors at start-up' },
        { id: 'p4', text: 'Compare the installed apps with the Software Catalog' },
        { id: 'p5', text: 'Disable a startup app and uninstall its app from Installed apps' },
        { id: 'p6', text: 'Restart and compare the boot time' },
        { id: 'p7', text: 'Run Disk Cleanup' },
        { id: 'p8', text: 'Check the Wi-Fi signal' },
        { id: 'p9', text: 'Delete unfamiliar files from C:\\Windows\\System32' },
        { id: 'p10', text: 'Reset or reinstall Windows' },
      ],
    }],
    computers: [
      { name:'NS-LT-0102', user:'Grace Kim', os:'Windows 11 Enterprise 24H2', ip:'10.20.70.102', ou:'OU=Human Resources,OU=Workstations', trust:'Healthy', bitlocker:'Protected', lastSeen:'1 minute ago', health:'Healthy', uptimeDays:0 },
    ],
    machines: {
      'NS-LT-0102': {
        computer: { ip:'10.20.70.102', health:'Healthy' },
        processes: [
          { name:'Microsoft Teams', cpu:4, memory:540, disk:0.6 },
          { name:'Microsoft Edge', cpu:3, memory:720, disk:0.4 },
          { name:'Microsoft Outlook', cpu:1, memory:310, disk:0.3 },
          { name:'Antimalware Service Executable', cpu:1, memory:190, disk:0.2 },
          { name:'Windows Explorer', cpu:1, memory:150, disk:0.1 },
          { name:'System', cpu:0, memory:20, disk:0.1 },
        ],
        performance: { cpu:7, memory:44, disk:2 },
        startupApps: [
          { name:'Microsoft Teams', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'High' },
          { name:'Microsoft OneDrive', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'Medium' },
          { name:'QuickPDF Updater', publisher:'', verified:false, status:'Enabled', impact:'High', command:'"C:\\Users\\gkim\\AppData\\Local\\QuickPDF\\QPUpdater.exe" /background', location:'HKU\\S-1-5-21\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' },
          { name:'Windows Security notification icon', publisher:'Microsoft Corporation', verified:true, status:'Enabled', impact:'Low' },
        ],
        storage: { drive:'C:', sizeGb:476, freeGb:290.4,
          categories:[{ name:'Apps & features', gb:71 }, { name:'Documents', gb:48 }, { name:'System & reserved', gb:54 }, { name:'Other', gb:12.6 }],
          temporaryFiles:[{ id:'temp', name:'Temporary files', gb:1.4 }, { id:'recycle', name:'Recycle Bin', gb:0.6, recycleBin:true }],
          driveHealth:'Good' },
        updates: { lastInstalledDaysAgo:12, restartRequired:false, pending:null,
          history:[{ kb:'KB5099101', name:'2026-08 Cumulative Update for Windows 11', date:'8/12/2026', status:'Successfully installed', description:'Security Update' }, { kb:'KB5098807', name:'2026-07 Cumulative Update for Windows 11', date:'7/15/2026', status:'Successfully installed', description:'Security Update' }] },
        uptimeDays:0, bootSeconds:612, bootTime:'Today 08:41', bootSecondsAfterFix:51, bootSecondsAfterFixNeeds:{ startupOff:['QuickPDF Updater'] },
        installedApps: [
          { name:'Microsoft Teams', publisher:'Microsoft Corporation', version:'24295.605', installed:'1/13/2026', startup:'Microsoft Teams' },
          { name:'Microsoft OneDrive', publisher:'Microsoft Corporation', version:'25.150.0', installed:'1/13/2026', startup:'Microsoft OneDrive' },
          { name:'Windows Security', publisher:'Microsoft Corporation', version:'1.0', installed:'1/13/2026', startup:'Windows Security notification icon' },
          { name:'Microsoft Edge', publisher:'Microsoft Corporation', version:'139.0.3405.86', installed:'1/13/2026' },
          { name:'Microsoft Outlook', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'1/13/2026' },
          { name:'Microsoft Word', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'1/13/2026' },
          { name:'Microsoft Excel', publisher:'Microsoft Corporation', version:'16.0.18025', installed:'1/13/2026' },
          { name:'Northstar Recruiting', publisher:'Northstar IT', version:'5.1.2', installed:'1/13/2026' },
          { name:'QuickPDF', publisher:'QuickPDF Software', version:'2.4', installed:'8/18/2026 (this user only)', sizeMb:212, startup:'QuickPDF Updater' },
        ],
        catalog: true,
        events: {
          system: [
            { level:'Information', time:'Today 08:41', source:'Kernel-General', id:'12', message:'The operating system started.' },
            { level:'Information', time:'Fri 8/21 17:32', source:'Kernel-General', id:'13', message:'The operating system is shutting down.' },
            { level:'Information', time:'Fri 8/21 08:20', source:'Kernel-General', id:'12', message:'The operating system started.' },
          ],
          application: [
            { level:'Error', time:'Today 08:47', source:'Application Error', id:'1000', message:'Faulting application name: QPUpdater.exe, version: 2.4.0.112. Faulting module name: QPUpdater.exe. Exception code: 0xc0000005.' },
            { level:'Information', time:'Today 08:46', source:'Microsoft Office', id:'2001', message:'Microsoft Outlook started.' },
            { level:'Error', time:'Fri 8/21 08:26', source:'Application Error', id:'1000', message:'Faulting application name: QPUpdater.exe, version: 2.4.0.112. Faulting module name: QPUpdater.exe. Exception code: 0xc0000005.' },
            { level:'Error', time:'Thu 8/20 08:39', source:'Application Error', id:'1000', message:'Faulting application name: QPUpdater.exe, version: 2.4.0.112. Faulting module name: QPUpdater.exe. Exception code: 0xc0000005.' },
            { level:'Error', time:'Wed 8/19 08:24', source:'Application Error', id:'1000', message:'Faulting application name: QPUpdater.exe, version: 2.4.0.112. Faulting module name: QPUpdater.exe. Exception code: 0xc0000005.' },
            { level:'Error', time:'Tue 8/18 13:11', source:'Application Error', id:'1000', message:'Faulting application name: QPUpdater.exe, version: 2.4.0.112. Faulting module name: QPUpdater.exe. Exception code: 0xc0000005.' },
            { level:'Information', time:'Tue 8/18 12:52', source:'MsiInstaller', id:'11707', message:'Product: QuickPDF 2.4 -- Installation completed successfully.' },
          ],
          'diagnostics-performance': [
            { level:'Warning', time:'Fri 8/21 08:20', source:'Diagnostics-Performance', id:'100', message:'Windows has started up: Boot Duration: 598000 ms (598 s)' },
            { level:'Warning', time:'Thu 8/20 08:29', source:'Diagnostics-Performance', id:'100', message:'Windows has started up: Boot Duration: 607000 ms (607 s)' },
            { level:'Warning', time:'Wed 8/19 08:14', source:'Diagnostics-Performance', id:'100', message:'Windows has started up: Boot Duration: 615000 ms (615 s)' },
            { level:'Warning', time:'Tue 8/18 13:01', source:'Diagnostics-Performance', id:'100', message:'Windows has started up: Boot Duration: 604000 ms (604 s)' },
            { level:'Warning', time:'Mon 8/17 08:16', source:'Diagnostics-Performance', id:'100', message:'Windows has started up: Boot Duration: 48000 ms (48 s)' },
          ],
        },
        // No Reliability Monitor here: its data names a day's crashes
        // "critical", which bin/its-curriculum-check.js keeps out of every
        // Prove shift as a possible answer field.
        files: {
          'C:\\Users\\gkim\\Desktop':['Interview schedule.xlsx', 'Offer letter template.docx', 'Candidate notes.txt'],
          'C:\\Users\\gkim\\Documents':['Job descriptions', 'Onboarding checklist.docx'],
        },
        repairs: { dism:'The restore operation completed successfully.', sfc:'Windows Resource Protection did not find any integrity violations.', chkdsk:'Windows has scanned the file system and found no problems.' },
        safeMode:false,
        profile:{ temporary:false, restartClears:false, path:'C:\\Users\\gkim' },
      },
    },
    // END Module 5 Prove It shift.
  },
};

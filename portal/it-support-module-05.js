/* Module 05 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content sourced from Module_5_Student_Content.docx. Lab is a
 * guided walkthrough of two real tickets ('hd-m05') in the IT Service Desk
 * simulator — see it-support-shared.js's itsRegisterCoachModule.
 */

const ITS05_LESSONS = [
  {
    id: 'its-05-lesson-01', number: '5.1', icon: 'ri-server-line',
    title: 'Windows Server Roles & Server Manager', minutes: 180,
    learn: [
      'What a "server role" is, and a few of the most common ones',
      'How to navigate Server Manager to view and add roles',
      'How to check whether a server\'s core services are running properly',
    ],
    topics: [
      { heading: 'What a Role Actually Is', body: 'Server roles define the major jobs a Windows Server performs — managing accounts (Active Directory Domain Services), handing out IP addresses (DHCP), resolving names (DNS). A single server can run multiple roles at once, and knowing which are installed tells you immediately what that server is responsible for.' },
      { heading: 'Getting Around Server Manager', body: 'Server Manager is the central dashboard for a Windows Server machine — installed roles, their health, and the Add Roles and Features wizard. Spend time here first on any server ticket; it\'s usually faster than digging through individual consoles.' },
      { heading: 'Checking Service Health', body: 'Every role runs as background services, and Server Manager flags when one isn\'t running correctly. A warning here is often the first sign of a bigger problem — catching it before a user even notices is a lot of what server support looks like day to day.' },
    ],
    practice: [
      'Open Server Manager on the server VM you built earlier, and record every role currently installed and its health status.',
    ],
    comingUp: 'You\'ll add a role to your server VM and verify it\'s running correctly.',
  },
  {
    id: 'its-05-lesson-02', number: '5.2', icon: 'ri-folder-shared-line',
    title: 'File Sharing, Permissions & DNS/DHCP Role Awareness', minutes: 180,
    learn: [
      'The basic concept behind Windows file/folder sharing',
      'What permissions control, at a level you need to recognize (not administer) as an L1 technician',
      'Why DNS and DHCP are often run as server roles, and what that means for troubleshooting',
    ],
    topics: [
      { heading: 'How File Sharing Works', body: 'A shared folder is made accessible under a specific path (\\\\SERVERNAME\\ShareName). If a user can\'t reach a shared drive, first ask whether anyone else can reach it too — that tells you immediately whether it\'s the share itself or just this one user.' },
      { heading: 'Permissions, At Your Level', body: 'Full permissions administration belongs to Tier 2/3, but as L1 you need to recognize the shape of a permissions problem: a user can log in and reach the server but is denied access to a specific file or folder — a very different problem from a connectivity issue.' },
      { heading: 'DNS and DHCP as Server Roles', body: 'DNS and DHCP often run as actual roles on a server like the one you built. A whole-office DHCP or DNS outage is a signal to move focus away from any one workstation and toward the shared service or infrastructure behind it.' },
    ],
    practice: [
      'On your server VM, check whether the DNS or DHCP roles are installed, and write one sentence describing how you\'d tell the difference between "the whole office lost DNS" and "one user\'s device has a DNS problem."',
    ],
    comingUp: 'A shared drive is unreachable for one user but not others — you\'ll figure out whether it\'s a permissions issue or something else.',
  },
  {
    id: 'its-05-lesson-03', number: '5.3', icon: 'ri-file-list-3-line',
    title: 'Logs, Services & Change Discipline', minutes: 120,
    learn: [
      'Where to look on a server for logs and service status',
      'Why "restart the service" isn\'t always the right first move',
      'What escalation looks like for server-level issues, and where your responsibility ends',
    ],
    topics: [
      { heading: 'Logs and Services on a Server', body: 'A Windows Server keeps detailed logs of what\'s happened and a live view of every running service — this is where you look for evidence before making any change.' },
      { heading: 'Restart Discipline', body: 'Restarting a service can fix a hung process — but on a server it can interrupt every user relying on it at once. Before restarting anything shared: check what\'s actually wrong first, understand who else might be affected, and document the change.' },
      { heading: 'Where Your Responsibility Ends', body: 'As L1 you\'re expected to observe, diagnose, and document server-level issues clearly — not necessarily make deep configuration changes yourself. Recognizing a genuine server problem and escalating it with clean evidence is often more valuable than a fix outside your authority.' },
    ],
    practice: [
      'Write a short escalation note (2–3 sentences) as if you\'d found a critical service stopped on the server VM, addressed to a Tier 2 technician who has never seen this ticket before.',
    ],
    comingUp: 'You\'ll diagnose a service-state issue on your server VM and decide whether to fix it directly or escalate it.',
  },
  {
    id: 'its-05-lesson-04', number: '5.4', icon: 'ri-organization-chart',
    title: 'Active Directory Structure: Domains, OUs, Users, Groups & Computer Objects', minutes: 240,
    learn: [
      'What a domain, organizational unit (OU), user object, group, and computer object each represent',
      'How these objects relate to each other',
      'The basics of creating and organizing user and group accounts',
    ],
    topics: [
      { heading: 'The Domain — The Whole Neighborhood', body: 'A domain is the entire managed environment — every user, computer, and resource a given organization\'s Active Directory controls. Everything else in this lesson exists inside a domain.' },
      { heading: 'Organizational Units — How the Neighborhood Is Organized', body: 'An OU is a container used to organize directory objects logically — by department, location, or role — and to scope Group Policy or delegate admin permissions to a whole branch at once. An OU does not grant access to shared resources; that\'s a security group\'s job.' },
      { heading: 'User, Group & Computer Objects', body: 'A user object represents a person\'s account. A group is a collection of users (or groups) for granting access to many people at once. A computer object represents a machine that\'s joined the domain — exactly like the client VM you built earlier.' },
      { heading: 'Why This Structure Matters for Support', body: 'Nearly every access ticket comes down to one of these objects being set up wrong: a user in the wrong group, a computer object that never properly joined, an OU with mismatched settings. Knowing the vocabulary is what lets you describe a problem precisely.' },
    ],
    practice: [
      'On your server VM, open Active Directory Users and Computers, create one new OU, and create one new user account inside it.',
    ],
    comingUp: 'You\'ll be given a user whose access is broken because of how their account, group membership, or OU placement was set up — and asked to find and explain exactly what\'s wrong.',
  },
];

itsRegisterCoachModule({
  moduleNumber: 5, moduleKey: 'its-05', coachId: 'hd-m05', labKeys: ['lab-its-05-server-ad'],
  lessons: ITS05_LESSONS,
  lede: 'You\'ve already built a Windows Server VM — now you\'ll actually configure it, and start managing the directory structure that controls who has access to what across an organization.',
  labDescription: 'Resolve two real Windows Server tickets end to end in the IT Service Desk simulator — a Group Policy scope issue (HD-2108) and a file-server disk-space incident (HD-2117) — using Server Manager and Active Directory Users and Computers. A coach spotlights each step for you.',
});

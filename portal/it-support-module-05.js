/* Module 7 (key its-05) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Four filed lessons (7.1 to 7.4) shown as five reading cards. Lesson 7.1
 *     is Reading 1, Lesson 7.2 is Readings 2 and 3 (one filed entry,
 *     its-05-lesson-02, so the two cards share its minutes), Lesson 7.3 is
 *     Reading 4 and Lesson 7.4 is Reading 5. Each reading has its tables and a
 *     diagram.
 *   - Two knowledge checks, both after Reading 5: the Learn It check (six
 *     program questions) and the A+ check (eight questions). Each has
 *     a "why" line for a right answer and an "if wrong" line for each wrong
 *     one. The choices are shuffled per student and per attempt.
 *
 * Block types (its05Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS05_DIAGRAMS). In p, ul, ol, table and check text,
 * **...** is emphasized and `...` is inline code. bin/its-curriculum-check.js
 * reads each filed lesson's title and minutes from this file: the title must
 * match portal/data.js, and the minutes are the filed lesson minutes plus that
 * lesson's share of the lab (180 / 180 / 120 / 240, the checker's mapping). A
 * lesson entry keeps its title and minutes on one line, and nothing else here
 * may put a minutes value right after a title.
 */

const ITS05_LESSONS = [
  {
    id: 'its-05-lesson-01', number: '7.1',
    title: 'Windows Server Roles & Server Manager', minutes: 180,
    readings: [
      {
        number: 1, icon: 'ri-server-line', heading: 'What servers do, and where your job stops',
        learn: [
          'Say what each server role does, and what breaks for users when it stops',
          'Recognise the appliances and edge servers you meet by name',
          'Say what a Tier 1 technician may and may not do on a server',
        ],
        blocks: [
          { h: 'Reading 1 · What servers do, and where your job stops' },
          { p: 'A server does jobs for everyone. Each job is called a **role**. **AD DS** (Active Directory Domain Services) stores every user, computer and group and checks sign-ins; a server running it is a **domain controller**. **DNS** turns names into IP addresses, and Active Directory cannot work without it. **DHCP** hands out IP addresses automatically. **File and Storage Services** shares folders, and **Print Services** shares printers and holds their queues.' },
          { table: {
            caption: 'Server roles at Northstar, and what each one does',
            head: ['Role', 'What it does', 'You see it break as'],
            rows: [
              ['AD DS (Active Directory Domain Services)', 'Stores every user, computer and group, and checks sign-ins. A server running it is a domain controller', 'Nobody can sign in; “no logon servers available”'],
              ['DNS', 'Turns names into IP addresses. Active Directory cannot work without it', '“Can’t find the server”; one name fails while addresses work'],
              ['DHCP', 'Hands out IP addresses automatically, from a scope', 'A device has a 169.254 address, or a whole area has none'],
              ['File and Storage Services', 'Shares folders over the network', 'A mapped drive is gone, or “access denied” on one folder'],
              ['Print Services', 'Shares printers and holds their queues', 'A floor’s printing stops at once'],
              ['Mail server', 'Sends and receives email for the company', 'Mail queues, or external mail bounces'],
              ['Web server', 'Serves the intranet and web applications', 'A site is down for everyone'],
              ['Syslog server', 'Collects logs from many devices in one place', 'Evidence is missing when something is investigated'],
              ['AAA / authentication server', 'Authentication, authorization and accounting: who you are, what you may do, what you did', 'VPN or Wi-Fi sign-ins fail for everyone'],
              ['Database server', 'Stores the data an application works with', 'An app opens but shows no data'],
              ['NTP (Network Time Protocol)', 'Keeps every machine’s clock in step', 'Sign-ins fail with clock errors (taught in Module 10)'],
            ],
          } },
          { p: 'Four more roles you will meet by name rather than by hand. A **mail server** sends and receives the company’s email. A **web server** serves the intranet and web applications. A **database server** stores the data an application works with, which is why an app can open perfectly and still show you nothing. An **NTP server** (Network Time Protocol) keeps every machine’s clock in step, which matters more than it sounds: sign-ins fail when a clock drifts too far.' },
          { p: 'Two more that sit at the edge of the network. A **syslog server** collects logs from many devices in one place, so the evidence outlives the device. An **AAA** or authentication server answers three questions — authentication (who are you), authorization (what may you do) and accounting (what did you do) — and it is usually what Wi-Fi and VPN sign-ins check against.' },
          { p: 'Then the appliances. A **spam gateway** filters junk and malicious email before it reaches the mail server. A **UTM** (unified threat management) box does firewall, antivirus, filtering and intrusion prevention in one. A **load balancer** spreads traffic across several servers, so one slow server doesn’t take a whole service down. A **proxy server** goes to the web on a user’s behalf, which is what lets it filter and cache. And every company has some **legacy or embedded systems** — old machines, industrial controllers (**SCADA**) and smart devices (**IoT**) — that often can’t be patched at all. You report those; you don’t experiment on them.' },
          { table: {
            caption: 'Internet appliances and the odd ones out',
            head: ['Appliance', 'What it does'],
            rows: [
              ['Spam gateway', 'Filters junk and malicious email before it reaches the mail server'],
              ['UTM (unified threat management)', 'One box doing firewall, antivirus, filtering and intrusion prevention'],
              ['Load balancer', 'Spreads traffic across several servers so one slow server doesn’t take a service down'],
              ['Proxy server', 'Goes to the web on a user’s behalf, filters it and caches it'],
              ['Legacy and embedded systems, SCADA, IoT', 'Old machines, industrial controllers and smart devices that often can’t be patched. You report them, you don’t experiment on them'],
            ],
          } },
          { p: '**Server Manager** shows which roles are installed and flags a service that isn’t running. As a Tier 1 technician you observe, check and document. You do not reconfigure servers, and you do not add or remove roles. Restarting a service on a shared server affects everyone using it, so you start a stopped one only when a runbook (a KB article) allows it, after reading the logs, and with a note saying what you did. Otherwise you escalate, with evidence.' },
          { diagram: 'servers' },
        ],
        comingUp: 'Read the five servers in Server Manager in the guided lab (Lab 7.1).',
      },
    ],
  },
  {
    id: 'its-05-lesson-02', number: '7.2',
    title: 'File Sharing, Permissions & DNS/DHCP Role Awareness', minutes: 180,
    readings: [
      {
        number: 2, icon: 'ri-folder-shared-line', heading: 'File shares, and the shape of an “access denied”',
        learn: [
          'Read a share’s two permission layers and say what a named person can actually do',
          'Say why permissions are given to security groups, never to one person',
          'Decide whether a missing share is one person’s problem or everyone’s',
        ],
        blocks: [
          { h: 'Reading 2 · File shares, and the shape of an “access denied”' },
          { p: 'A shared folder is reached by its **UNC path**, `\\\\SERVER\\Share`, over a protocol called **SMB**, which uses **TCP port 445**. If you can’t tell whether a share is broken or a server is unreachable, that port is the answer: `Test-NetConnection NS-FILE01 -Port 445`.' },
          { p: 'Two layers of permission apply to every share, and they are set in two different places. **Share permissions** apply to anyone reaching the folder over the network. **NTFS permissions** apply to the folder itself, whether you reach it over the network or sit at the machine. **The user gets the more restrictive of the two.** A share that says Change and a folder that says Read gives the user Read, and nothing about that is broken — it is how a read-only share is built.' },
          { table: {
            caption: 'The two permission layers on a share',
            head: ['', 'Share permissions', 'NTFS permissions'],
            rows: [
              ['Where they are set', 'On the share, for network access', 'On the folder itself'],
              ['Who they apply to', 'Anyone reaching it over the network', 'Everyone, on the network or signed in at the machine'],
              ['How they combine', '**The user gets the more restrictive of the two**', 'Same rule'],
              ['Who they are given to', 'Security groups, never individuals', 'Security groups, never individuals'],
              ['What a Tier 1 technician does', 'Reads both and reports what they say', 'Reads both and reports what they say'],
            ],
          } },
          { diagram: 'permissions' },
          { p: 'Permissions are given to **security groups**, never to one person. A security group is a named list of accounts that exists to be given access to something; you’ll see Northstar’s as `GG-Finance-Contributors`, `GG-HR-Readers`, `GG-Operations-Drive`. (There is a second kind, a **distribution group**, which is only an email list and grants no access at all.) When you want to answer “who can edit this?”, you open the group’s members, not the folder.' },
          { p: 'Now the triage question, which is the same one every time. **One person** can reach the server but gets “access denied” on one folder: that is a permission or group problem, and Module 8 is where you fix it. **Everyone** has lost the share: that is the server, the service or the network, and it is an escalation. The same question answers a missing drive, a name that won’t resolve, and a device with no address.' },
        ],
        comingUp: 'Read a file share’s two permission layers in the guided lab (Lab 7.1), then work the Finance drive ticket in Lab 7.2.',
      },
      {
        number: 3, icon: 'ri-router-line', heading: 'DNS and DHCP, as roles',
        learn: [
          'Read the five DNS record types you will meet',
          'Say what a scope, lease, reservation, exclusion and VLAN are on the DHCP screen',
          'Tell a device’s address problem from a server’s',
        ],
        blocks: [
          { h: 'Reading 3 · DNS and DHCP, as roles' },
          { p: '**DNS** turns names into addresses, and the zone is the list it reads from. You will read five record types. An **A** record maps a name to an IPv4 address (`files` → 10.20.0.30). An **AAAA** record does the same for IPv6. A **CNAME** points one name at another name, so `purchasing` can follow `ns-app01` wherever it moves. An **MX** record (mail exchanger) tells other companies’ mail systems where to deliver email for the domain. A **TXT** record holds free text, and email checks live there: **SPF** says which servers may send as the domain, **DKIM** adds a signature, and **DMARC** says what a receiving system should do when those checks fail.' },
          { table: {
            caption: 'DNS record types a Tier 1 technician meets',
            head: ['Record', 'What it maps', 'Example at Northstar'],
            rows: [
              ['A', 'A name to an IPv4 address', '`files` → 10.20.0.30'],
              ['AAAA', 'A name to an IPv6 address', 'The same host, written the long way'],
              ['CNAME', 'A name to another name (an alias)', '`purchasing` → `ns-app01.northstar.example`'],
              ['MX (mail exchanger)', 'Where a domain’s email is delivered', '`northstar.example` → `mail.northstar.example`'],
              ['TXT', 'Free text, used for email checks: SPF (who may send), DKIM (a signature), DMARC (what to do when a check fails)', '`v=spf1 include:...`'],
            ],
          } },
          { p: '**DHCP** hands out addresses from a **scope**: the range of addresses it may give out on one network. Each address it hands out is a **lease**, held for a set time and then renewed. A **reservation** keeps one address for one device, matched by that device’s hardware address — printers, scanners and time clocks need one, because other systems connect to them by address. An **exclusion** is the opposite: addresses inside the scope that the server must never hand out, usually because servers or switches already use them.' },
          { p: 'One scope serves one **VLAN**. A VLAN is a separate network running over the same physical wiring, which is how the warehouse, the guest Wi-Fi and the office can share a building without sharing a network. A device plugged into a port on a different VLAN gets its address from that VLAN’s scope, not this one — so “it gets no address here” can mean the device is somewhere else entirely.' },
          { table: {
            caption: 'DHCP words, and what each one means on the screen',
            head: ['Word', 'What it means', 'Why it matters'],
            rows: [
              ['Scope', 'The range of addresses a server may hand out on one network', 'One scope serves one VLAN'],
              ['Lease', 'One address, handed to one device, for a set time', 'A lease list shows who has what, and when it expires'],
              ['Reservation', 'An address kept for one device, by its hardware address', 'Printers, time clocks and scanners need the same address every time'],
              ['Exclusion', 'Addresses inside the scope the server must not hand out', 'Servers and switches have fixed addresses in that range'],
              ['VLAN', 'A separate network on the same physical wiring', 'A device on the wrong VLAN gets no address from this scope'],
              ['Scope at 100%', 'No free addresses left', 'New devices get nothing, which looks to a user like “no internet”'],
            ],
          } },
          { p: 'What goes wrong, and what it looks like from the desk: one device with a `169.254.x.x` address has no lease at all; a whole area with no addresses means the scope is full or the service is down; and a device that keeps changing address has no reservation. The first is a client problem, the second is an escalation, and the third is a request.' },
          { diagram: 'scope' },
        ],
        comingUp: 'Read the DNS and DHCP screens in the guided lab (Lab 7.1), and work the time clock ticket in Lab 7.2.',
      },
    ],
  },
  {
    id: 'its-05-lesson-03', number: '7.3',
    title: 'Logs, Services & Change Discipline', minutes: 120,
    readings: [
      {
        number: 4, icon: 'ri-file-list-3-line', heading: 'Logs, services and change discipline',
        learn: [
          'Read a service’s status and the account it logs on as',
          'Recognise System events 7031, 7034 and 7038, and put them in a ticket',
          'Read the change log before you build a theory',
          'Say when to start a service once, and when to escalate',
        ],
        blocks: [
          { h: 'Reading 4 · Logs, services and change discipline' },
          { p: 'Every role runs as one or more **services**: background programs that start with the server and keep running with nobody signed in. On the Services screen you read a service’s name, whether it is Running, whether it starts automatically, and the column that matters most on a server — **Log On As**.' },
          { p: 'Most services sign in as the machine itself. Some sign in as a **service account**: an account created for a program rather than a person, with a password nobody types. When that account’s password expires, or it gets locked out, the service simply won’t start, and nothing about the application will tell you that. It is one of the few server faults you can recognise from the desk in seconds, once you know where to look.' },
          { p: 'Where to look is the server’s **System log**. Three event IDs are worth knowing by sight. **7031** and **7034** both mean a service stopped unexpectedly — 7031 when Windows tried to recover it, 7034 when it didn’t. **7038** means the account a service signs in as could not log on, which points at the service account, not the service. Read the event, note its ID and its time, and put both in the ticket. “The spooler stopped” is a symptom; “System 7034 at 08:12, first in 30 days” is evidence.' },
          { p: 'Then read the **change log** before you build a theory. It lists what the company changed and when: a number, a time, what was done, who did it, and whether it finished. A change that lines up with the start of a symptom is the fastest evidence you will ever find — and it is evidence, not proof, so you name it in the ticket and let the change’s owner confirm it. A change window with nothing in it is worth saying too: “no change in the six hours before it started” saves the next tier the same search.' },
          { diagram: 'timeline' },
          { p: 'Finally, the boundary. The Service Desk may **start** one named service, once, when a runbook allows it (KB-0100). It may never stop a service, restart one in place, or reboot a server — those affect everyone using that server, and they destroy the evidence of why it happened. If the same service stops twice, that is not a second restart; that is an escalation with both events attached.' },
          { p: 'A server volume filling up is the same kind of boundary. Read the volume’s size and free space on the server’s volume list, work out how fast it is growing, and put the numbers and the rate in the ticket. **Delete nothing and move nothing**: the files are not yours, and they may be someone’s only copy. Escalate to Server & Identity with the numbers (KB-0101).' },
          { table: {
            caption: 'What a Tier 1 technician may do on a server, and what to escalate',
            head: ['You may', 'You never'],
            rows: [
              ['Open Server Manager, Services, the event logs, the file server, DNS, DHCP and the change log, and read them', 'Add, remove or reconfigure a role'],
              ['Run a read-only check (`Get-Service`, `Test-NetConnection`)', 'Change a share or NTFS permission'],
              ['Start one named stopped service, once, when a runbook (KB) allows it, after reading the logs, and write a note', 'Restart a server, or start a service a second time'],
              ['Read a change-log entry and name it in a ticket', 'Delete or move anyone’s files on a server'],
              ['Escalate to Server & Identity with evidence', 'Add a user to a group to “make it work”'],
            ],
          } },
        ],
        comingUp: 'Read a server’s services, its System log and the change log in the guided lab (Lab 7.1), and work the Print Spooler and disk space tickets in Lab 7.2.',
      },
    ],
  },
  {
    id: 'its-05-lesson-04', number: '7.4',
    title: 'Active Directory Structure: Domains, OUs, Users, Groups & Computer Objects', minutes: 240,
    readings: [
      {
        number: 5, icon: 'ri-organization-chart', heading: 'How Active Directory is organised',
        learn: [
          'Say what a domain, an OU, a Group Policy Object and a computer object are',
          'Say why an OU does not grant access, and a security group does',
          'Run `gpresult /r` and `gpupdate /force`, and say what they show',
        ],
        blocks: [
          { h: 'Reading 5 · How Active Directory is organised' },
          { p: '`northstar.example` is the **domain**: the whole managed environment of users, computers and groups. Inside it, objects are organised into **organizational units** (OUs), which look like folders and do one job folders don’t: an OU is where **Group Policy Objects** are linked.' },
          { diagram: 'tree' },
          { p: 'A **Group Policy Object** (GPO) is a set of central settings — a drive mapping, a password rule, a security baseline — applied to everything in the OU it is linked to. Northstar’s `Operations Drive Mapping` GPO is what puts the O: drive on an Operations user’s desktop, and its `Workstation Security Baseline` is what sets the firewall, Defender and the lock screen on every workstation.' },
          { p: 'An OU does **not** grant access to anything. Security groups do that (Reading 2). Putting someone in a different OU changes which policies apply to them; it does not change what they can open. Mixing those two up is the most common wrong diagnosis in this whole module.' },
          { p: 'A **computer object** is created in the directory when a PC joins the domain. Where it lands decides which policies reach it. If it ends up in the default `CN=Computers` container instead of its department’s OU — which is exactly what happens when a laptop is rebuilt or replaced — the policies linked to that OU don’t apply to it. Policies linked to the whole domain, such as the Default Domain Policy, still do. The user can still sign in, everything looks normal, and one specific thing silently doesn’t happen.' },
          { p: 'Two commands answer this, and you will type both. `gpresult /r` lists which policies applied to a machine and which were denied, with the reason. `gpupdate /force` re-applies them and is how you check a fix worked. Reading a `gpresult` result and saying “the drive-mapping policy never reached this machine, and here’s why” is, on its own, a good Tier 1 escalation.' },
        ],
        comingUp: 'Read Active Directory and Group Policy, and run gpresult /r and gpupdate /force, in the guided lab (Lab 7.1).',
      },
    ],
  },
];

// The page shows one card per reading: five cards for the four filed lessons.
// Readings 2 and 3 belong to one filed lesson (its-05-lesson-02), so both
// cards carry its id and say they share its minutes.
function its05Cards() {
  return ITS05_LESSONS.flatMap((lesson) => lesson.readings.map((reading) => ({
    id: lesson.id, number: lesson.number, reading: reading.number, icon: reading.icon, heading: reading.heading,
    minutesText: lesson.readings.length > 1
      ? `Readings ${lesson.readings.map((r) => r.number).join(' and ')} share Lesson ${lesson.number}’s ${formatInstructionalMinutes(lesson.minutes)}`
      : formatInstructionalMinutes(lesson.minutes),
    learn: reading.learn, blocks: reading.blocks, comingUp: reading.comingUp,
  })));
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS05_DIAGRAMS = {
  servers: {
    title: 'One office, five servers, and what each one is responsible for',
    boxes: [
      { title: 'NS-DC01', sub: 'AD DS · DNS', lines: ['Nobody signs in, and no name resolves'] },
      { title: 'NS-DHCP01', sub: 'DHCP', lines: ['New devices get no address'] },
      { title: 'NS-FILE01', sub: 'File and Storage Services', lines: ['Shared folders disappear'] },
      { title: 'NS-PRINT01', sub: 'Print Services', lines: ['A floor stops printing'] },
      { title: 'NS-APP01', sub: 'Web and database', lines: ['One application is down'] },
    ],
    strip: 'You read these servers. You do not reconfigure them. One restart on a shared server affects everyone using it.',
  },
  permissions: {
    title: 'Two permission layers, and the one that wins',
    caption: 'The user gets the more restrictive of the two. Permissions are given to groups, never to one person.',
    arrow: 'over the network (SMB, port 445)',
    share: 'Share permissions: Change',
    ntfs: 'NTFS permissions: Read',
    result: 'Effective access: Read',
  },
  scope: {
    title: 'One person, or everyone?',
    decision: 'Who is affected?',
    left: { label: 'One person', text: 'Their access, their device or their policy. Work it at Tier 1.' },
    right: { label: 'Everyone, or a whole department', text: 'The service, the server or the network. Gather evidence and escalate.' },
    strip: 'The same question answers a missing drive, a name that won’t resolve and a device with no address.',
  },
  timeline: {
    title: 'Before you theorise, read what changed',
    marks: ['22:40 last night · CHG-7801 completed', '08:05 · first ticket arrives', '08:12 · service stopped'],
    notes: ['A change that lines up with the symptom is evidence, not proof. Name it in the ticket and let the change’s owner confirm it.', 'No change in the window? Say that too. It is just as useful to the next tier.'],
  },
  tree: {
    title: 'How Active Directory is organised',
    caption: 'An OU is where policy is linked. A security group is what grants access. They are not the same thing.',
    // parent: the index of the node this one hangs from.
    nodes: [
      { depth: 0, title: 'northstar.example', sub: 'DOMAIN' },
      { depth: 1, parent: 0, title: 'OU=Northstar Users', sub: 'ORGANIZATIONAL UNITS: where policies are linked' },
      { depth: 2, parent: 1, title: 'OU=Finance', lines: ['jbell · GG-Finance-Users'] },
      { depth: 2, parent: 1, title: 'OU=Sales', lines: ['nwilliams'] },
      { depth: 1, parent: 0, title: 'OU=Northstar Computers' },
      { depth: 2, parent: 4, title: 'OU=Workstations', lines: ['NS-LT-0215 · GPO ‘Workstation Security Baseline’ linked here'] },
      { depth: 1, parent: 0, title: 'CN=Computers', sub: 'default container: no OU policies apply here', warn: true },
    ],
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its05DiagramWords(key) {
  const d = ITS05_DIAGRAMS[key];
  if (key === 'servers') {
    const boxes = d.boxes.map((b) => `${b.title}, ${b.sub}: ${b.lines.join('; ')}`).join('. ');
    return `Five boxes in a row, one for each server. ${boxes}. Under them, in a red outline: ${d.strip}`;
  }
  if (key === 'permissions') {
    return `From left to right. A person icon: the user. An arrow labelled ${d.arrow} into a box: ${d.share}. An arrow into a second box: ${d.ntfs}. An arrow into a result box with a red outline: ${d.result}. Under the diagram: ${d.caption}`;
  }
  if (key === 'scope') {
    return `At the top, a question: ${d.decision}. Two branches. ${d.left.label}: ${d.left.text} ${d.right.label}: ${d.right.text} Under both: ${d.strip}`;
  }
  if (key === 'timeline') {
    return `A timeline running from left to right, with three marks. ${d.marks.join('. ')}. Under the timeline, two boxes. ${d.notes.join(' ')}`;
  }
  const nodes = d.nodes.map((n) => `${n.title}${n.sub ? `, labelled ${n.sub}` : ''}${n.lines ? `, with ${n.lines.join('; ')}` : ''}${n.parent !== undefined ? `, inside ${d.nodes[n.parent].title}` : ''}`).join('. ');
  return `A tree drawn as boxes joined by lines. ${nodes}. The CN=Computers box has a red outline. Under the diagram: ${d.caption}`;
}

// Splits text into lines of at most max characters, at word breaks.
function its05Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS05_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
function its05BoxLines(box, w) {
  const inner = w - ITS05_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS05_DG.title * ITS05_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS05_DG.text * ITS05_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls) => { out.push({ text, cls, dx: 0, dy }); dy += ITS05_DG.lh; };
  its05Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.sub) its05Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item) => its05Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text')));
  if (box.text) its05Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its05BoxHeight(box, w) {
  const lines = its05BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS05_DG.lh : 0;
  return ITS05_DG.pad * 2 + used + 4;
}
function its05Box(box, x, y, w, h) {
  // warn = the red outline; hl = the highlighted decision box.
  const cls = box.warn ? ' its05-dg-warn' : (box.hl ? ' its01-dg-hl' : '');
  const text = its05BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS05_DG.pad + line.dx}" y="${y + ITS05_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its05Arrow(x1, y1, x2, y2, id) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;
}
// A plain line, no arrow head: it only joins two boxes.
function its05Line(x1, y1, x2, y2) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function its05Markers(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="its01-dg-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
}
function its05Svg(key, layout, width, height, body) {
  const d = ITS05_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its05-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A small label: anchor 'middle' centres it on x.
function its05Label(text, x, y, anchor) {
  return `<text class="its05-dg-label" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;
}
// Plain text lines, one per wrapped line, starting at y.
function its05TextLines(text, max, x, y, anchor) {
  return its05Wrap(text, max).map((line, i) => `<text class="its01-dg-text" x="${x}" y="${y + i * ITS05_DG.lh}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(line)}</text>`).join('');
}
// A heading in the title style.
function its05Heading(text, x, y) {
  return `<text class="its01-dg-title" x="${x}" y="${y}">${esc(text)}</text>`;
}
// The strip under a diagram: one full-width highlighted box (warn: red outline).
function its05Strip(text, y, width, warn) {
  const box = warn ? { text, warn: true } : { text, hl: true };
  const h = its05BoxHeight(box, width);
  return { svg: its05Box(box, 0, y, width, h), h };
}

function its05ServersSvg(layout) {
  const d = ITS05_DIAGRAMS.servers;
  let body = '';

  if (layout === 'wide') {
    const gap = 12, width = 768, w = (width - 4 * gap) / 5;
    const top = 4;
    const h = Math.max(...d.boxes.map((b) => its05BoxHeight(b, w)));
    d.boxes.forEach((b, i) => { body += its05Box(b, i * (w + gap), top, w, h); });
    const strip = its05Strip(d.strip, top + h + 18, width, true);
    body += strip.svg;
    return its05Svg('servers', layout, width, top + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300;
  let y = 4;
  d.boxes.forEach((b) => {
    const h = its05BoxHeight(b, w);
    body += its05Box(b, x, y, w, h);
    y += h + 12;
  });
  y += 6;
  const strip = its05Strip(d.strip, y, w, true);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its05Svg('servers', layout, width, y + strip.h + 4, body);
}

// A simple person: a head and shoulders, drawn at centre x, top y.
function its05UserIcon(cx, top) {
  return `<circle class="its05-dg-icon" cx="${cx}" cy="${top + 9}" r="9"/><path class="its05-dg-icon" d="M${cx - 16} ${top + 40} Q${cx - 16} ${top + 22} ${cx} ${top + 22} Q${cx + 16} ${top + 22} ${cx + 16} ${top + 40} Z"/>`;
}

function its05PermissionsSvg(layout) {
  const d = ITS05_DIAGRAMS.permissions;
  const id = `its05-dg-permissions-${layout}-arrow`;
  const boxes = [{ title: d.share }, { title: d.ntfs }, { title: d.result, warn: true }];
  let body = its05Markers(id);

  if (layout === 'wide') {
    const width = 768, bw = 160, top = 4;
    const h = Math.max(...boxes.map((b) => its05BoxHeight(b, bw)), 48);
    const midY = top + h / 2;
    body += its05UserIcon(22, midY - 20);
    body += its05Arrow(52, midY, 180, midY, id);
    its05Wrap(d.arrow, 16).forEach((line, i) => { body += its05Label(line, 116, midY + 18 + i * 15, 'middle'); });
    const xs = [188, 388, 588];
    boxes.forEach((b, i) => {
      body += its05Box(b, xs[i], top, bw, h);
      if (i) body += its05Arrow(xs[i - 1] + bw + 2, midY, xs[i] - 2, midY, id);
    });
    return its05Svg('permissions', layout, width, top + h + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160;
  let y = 4;
  body += its05UserIcon(cx, y);
  y += 44;
  body += its05Arrow(cx, y, cx, y + 54, id);
  its05Wrap(d.arrow, 18).forEach((line, i) => { body += its05Label(line, cx + 14, y + 22 + i * 15); });
  y += 56;
  boxes.forEach((b, i) => {
    const h = its05BoxHeight(b, w);
    body += its05Box(b, x, y, w, h);
    y += h;
    if (i < boxes.length - 1) { body += its05Arrow(cx, y + 2, cx, y + 26, id); y += 28; }
  });
  return its05Svg('permissions', layout, width, y + 4, body);
}

function its05ScopeSvg(layout) {
  const d = ITS05_DIAGRAMS.scope;
  const id = `its05-dg-scope-${layout}-arrow`;
  const decision = { title: d.decision, hl: true };
  let body = its05Markers(id);

  if (layout === 'wide') {
    const width = 768, bw = 300, dx = (width - bw) / 2, colW = 372, rightX = width - colW;
    const leftCx = colW / 2, rightCx = rightX + colW / 2;
    const top = 4, decH = its05BoxHeight(decision, bw);
    body += its05Box(decision, dx, top, bw, decH);
    const midY = top + decH + 40, boxTop = midY + 26;
    body += its05Line(width / 2, top + decH, width / 2, midY);
    body += its05Line(leftCx, midY, rightCx, midY);
    body += its05Arrow(leftCx, midY, leftCx, boxTop - 2, id) + its05Arrow(rightCx, midY, rightCx, boxTop - 2, id);
    body += its05Label(d.left.label, leftCx, midY - 8, 'middle') + its05Label(d.right.label, rightCx, midY - 8, 'middle');
    const h = Math.max(its05BoxHeight({ text: d.left.text }, colW), its05BoxHeight({ text: d.right.text }, colW));
    body += its05Box({ text: d.left.text }, 0, boxTop, colW, h) + its05Box({ text: d.right.text }, rightX, boxTop, colW, h);
    const strip = its05Strip(d.strip, boxTop + h + 18, width, false);
    body += strip.svg;
    return its05Svg('scope', layout, width, boxTop + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160;
  let y = 4;
  const decH = its05BoxHeight(decision, w);
  body += its05Box(decision, x, y, w, decH);
  y += decH;
  body += its05Line(cx, y, cx, y + 14);
  y += 14;
  [d.left, d.right].forEach((branch) => {
    body += its05Heading(branch.label, x + ITS05_DG.pad, y + 14);
    y += 22;
    body += its05Arrow(cx, y, cx, y + 18, id);
    y += 20;
    const h = its05BoxHeight({ text: branch.text }, w);
    body += its05Box({ text: branch.text }, x, y, w, h);
    y += h + 16;
  });
  const strip = its05Strip(d.strip, y, w, false);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its05Svg('scope', layout, width, y + strip.h + 4, body);
}

function its05TimelineSvg(layout) {
  const d = ITS05_DIAGRAMS.timeline;
  const id = `its05-dg-timeline-${layout}-arrow`;
  let body = its05Markers(id);

  if (layout === 'wide') {
    const width = 768, lineY = 14, xs = [110, 384, 658], textTop = 44;
    body += its05Arrow(0, lineY, width - 4, lineY, id);
    let labelsBottom = textTop;
    d.marks.forEach((mark, i) => {
      body += `<circle class="its05-dg-mark" cx="${xs[i]}" cy="${lineY}" r="7"/>`;
      const lines = its05Wrap(mark, 26);
      body += its05TextLines(mark, 26, xs[i], textTop, 'middle');
      labelsBottom = Math.max(labelsBottom, textTop + lines.length * ITS05_DG.lh);
    });
    const gap = 24, w = (width - gap) / 2, boxTop = labelsBottom + 14;
    const h = Math.max(...d.notes.map((text) => its05BoxHeight({ text }, w)));
    d.notes.forEach((text, i) => { body += its05Box({ text }, i * (w + gap), boxTop, w, h); });
    return its05Svg('timeline', layout, width, boxTop + h + 4, body);
  }

  const width = 320, lineX = 24, w = 300;
  let y = 4;
  const marks = d.marks.map((mark) => {
    const lines = its05Wrap(mark, 30);
    const block = { y, lines };
    y += lines.length * ITS05_DG.lh + 16;
    return block;
  });
  body += its05Arrow(lineX, 4, lineX, y - 6, id);
  marks.forEach((block, i) => {
    body += `<circle class="its05-dg-mark" cx="${lineX}" cy="${block.y + 8}" r="7"/>`;
    body += its05TextLines(d.marks[i], 30, lineX + 20, block.y + 13);
  });
  y += 4;
  d.notes.forEach((text) => {
    const h = its05BoxHeight({ text }, w);
    body += its05Box({ text }, 10, y, w, h);
    y += h + 12;
  });
  return its05Svg('timeline', layout, width, y - 8 + 4, body);
}

function its05TreeSvg(layout) {
  const d = ITS05_DIAGRAMS.tree;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const indent = wide ? 44 : 18;
  const rowGap = wide ? 20 : 16;
  let body = '';
  let y = 4;
  // Wide boxes keep one width and step right; narrow boxes keep their right
  // edge and shrink, so the deepest still fit the phone.
  const placed = d.nodes.map((node) => {
    const x = (wide ? 0 : 10) + node.depth * indent;
    const w = wide ? 640 : 300 - node.depth * indent;
    const box = { title: node.title, sub: node.sub, lines: node.lines, warn: node.warn };
    const h = its05BoxHeight(box, w);
    const spot = { box, x, y, w, h };
    y += h + rowGap;
    return spot;
  });
  // Joining lines first, so the boxes sit on top of them.
  placed.forEach((spot, i) => {
    const parent = d.nodes[i].parent;
    if (parent === undefined) return;
    const p = placed[parent];
    const trunk = p.x + (wide ? 20 : 10);
    const mid = spot.y + spot.h / 2;
    body += its05Line(trunk, p.y + p.h, trunk, mid) + its05Line(trunk, mid, spot.x, mid);
  });
  placed.forEach((spot) => { body += its05Box(spot.box, spot.x, spot.y, spot.w, spot.h); });
  return its05Svg('tree', layout, width, y - rowGap + 4, body);
}

const ITS05_DIAGRAM_DRAW = { servers: its05ServersSvg, permissions: its05PermissionsSvg, scope: its05ScopeSvg, timeline: its05TimelineSvg, tree: its05TreeSvg };

function its05Diagram(key) {
  const d = ITS05_DIAGRAMS[key];
  const draw = ITS05_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its05-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its05-dg-${esc(key)}-desc">${esc(its05DiagramWords(key))}</p>
    ${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its05Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its05-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// An empty header cell (the row-label column) gets a hidden label, so a
// screen reader doesn't meet an empty header.
function its05Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${cell ? esc(cell) : '<span class="its01-sr-only">Item</span>'}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its05Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its05Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its05Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its05Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its05Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its05Table(block.table);
    if (block.diagram) return its05Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its05LessonCard(card) {
  return `<details class="its01-lesson" data-its05-lesson="${esc(card.id)}" data-its05-reading="${esc(String(card.reading))}">
    <summary><span class="its01-lesson-icon"><i class="${esc(card.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(card.number)} · Reading ${esc(String(card.reading))} · ${esc(card.heading)}</strong><small>${esc(card.minutesText)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${card.learn.map((item) => `<li>${its05Text(item)}</li>`).join('')}</ul>
      ${its05Blocks(card.blocks)}
      ${card.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(card.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------- Knowledge checks */

/* Two checks, each answered one question at a time. A right pick shows its why
 * line, a wrong pick shows its ifWrong line (never the right answer). ifWrong
 * is keyed by the choice's place in the data and has null on the right answer.
 * The choices are shuffled per student, per question and per attempt
 * (its05ChoiceOrder), so no line refers to a choice by its letter.
 *   - learn: six program questions, after Reading 5. Complete at 5 of 6.
 *   - aplus: eight questions on A+ Core 1 objectives 2.3 and 2.4, after
 *     Reading 5. Complete at 6 of 8. */
const ITS05_CHECKS = {
  learn: {
    title: 'Learn It knowledge check',
    intro: 'Six questions on this module’s readings: Active Directory, permissions, services, change discipline, and DHCP and VLANs. They are program checks, not A+ questions. It’s complete when 5 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'An OU and a security group both hold users. Which one grants access to a shared folder?',
        choices: ['The OU', 'The security group', 'Both', 'Neither'], answer: 1,
        why: 'An OU is where policy is linked. A security group is what permissions are given to.',
        ifWrong: ['Moving someone to a different OU changes which policies apply to them, not what they can open.', null, 'An OU never grants access, so the answer can’t be both.', 'Access is granted by one of the two, so the answer can’t be neither.'] },
      { q: 'A share’s permissions give a group Change. The folder’s NTFS permissions give the same group Read. What can the user do over the network?',
        choices: ['Change', 'Read', 'Nothing', 'Full control'], answer: 1,
        why: 'The user gets the more restrictive of the two layers, every time.',
        ifWrong: ['Reading only one layer is how a ticket gets escalated with the wrong evidence. Read both and say what each one says.', null, 'Neither layer takes the group’s access away, so the user isn’t locked out.', 'Neither layer gives full control, so the user can’t have it.'] },
      { q: 'A replaced laptop’s computer object sits in `CN=Computers` instead of its department OU. What is the effect?',
        choices: ['The user can’t sign in', 'The company policies linked to that OU don’t apply to it', 'The laptop loses its name', 'Nothing'], answer: 1,
        why: 'Policies are linked to OUs, and no OU’s policies are linked to the default Computers container. Only the policies linked to the whole domain still reach it.',
        ifWrong: ['The user can sign in. That is exactly why this is confusing to diagnose: everything works except what a policy was doing.', null, 'The laptop keeps its name. Only its place in the directory is different.', 'Something does change: a policy that should reach the laptop doesn’t.'] },
      { q: 'One user says a shared drive is missing. Which question comes first?',
        choices: ['“Shall I restart your laptop?”', '“Can anyone else on your team open it?”', '“What’s your employee ID?”', '“Have you tried the UNC path?”'], answer: 1,
        why: 'One person is an access, device or policy problem; everyone is a service, server or network problem. The answer decides who owns the ticket.',
        ifWrong: ['Restarting changes the laptop before you know whether the laptop is the problem.', null, 'Asking for an employee ID is verification: it matters before you act on an account, not before you work out the scope.', 'Trying the path again doesn’t tell you whether one person or everyone is affected.'] },
      { q: 'A runbook let you start a stopped service on a shared server once. Twenty minutes later it stops again. What do you do?',
        choices: ['Start it again', 'Restart the server', 'Escalate with both events and don’t start it again', 'Set the service’s startup type to Automatic'], answer: 2,
        why: 'The same service stopping twice is a cause the Service Desk can’t see. Two restarts hide the evidence the next tier needs.',
        ifWrong: ['A second start hides the evidence the next tier needs, and the runbook allows only one.', 'Restarting the server takes down every other role on it, for everyone.', null, 'Changing how a service is configured isn’t Tier 1 work, and it doesn’t explain why the service stopped.'] },
      { q: 'The Warehouse scope serves VLAN 30. A laptop plugged into a port on VLAN 10 gets no address from it. Why?',
        choices: ['The scope is full', 'One scope serves one VLAN', 'The laptop needs a reservation', 'DHCP is down'], answer: 1,
        why: 'A VLAN is a separate network, and a scope hands addresses to devices on its own VLAN.',
        ifWrong: ['Check the scope’s free count before you call it full: other devices on that VLAN would still be getting addresses.', null, 'A reservation decides which address a device gets, not whether one arrives.', 'If DHCP were down, other devices would have no address either, not just this laptop.'] },
    ],
  },
  aplus: {
    title: 'A+ check (Core 1: 2.3, 2.4)',
    intro: 'Eight questions in the style of the A+ Core 1 exam, on server roles and network services (objective 2.3) and DNS, DHCP and VLANs (objective 2.4). It’s complete when 6 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'Which server role automatically gives client computers IP addresses?',
        choices: ['DNS', 'DHCP', 'AD DS', 'Proxy'], answer: 1,
        why: 'DHCP’s whole job is handing out addresses from a scope, with a lease time.',
        ifWrong: ['DNS turns names into addresses; it doesn’t give them out.', null, 'AD DS stores accounts and checks sign-ins.', 'A proxy fetches web pages on a user’s behalf.'] },
      { q: 'Which DNS record type maps a host name to an IPv4 address?',
        choices: ['MX', 'CNAME', 'A', 'AAAA'], answer: 2,
        why: 'A is the plain name-to-IPv4 record, the one you read most often on the DNS screen.',
        ifWrong: ['An MX record says where email is delivered.', 'A CNAME points one name at another name.', null, 'AAAA is the same idea for IPv6.'] },
      { q: 'A company wants every device’s logs sent to one central server for review. Which service does this?',
        choices: ['Syslog', 'DHCP', 'Proxy', 'Load balancer'], answer: 0,
        why: 'Syslog collects logs from many devices in one place, so evidence survives the device.',
        ifWrong: [null, 'DHCP hands out addresses.', 'A proxy filters web traffic.', 'A load balancer spreads traffic across servers.'] },
      { q: 'A printer must always receive the same IP address from DHCP. What should be configured?',
        choices: ['An exclusion', 'A reservation', 'A larger scope', 'A new lease time'], answer: 1,
        why: 'A reservation ties one address to one device’s hardware address, so it gets the same one every time.',
        ifWrong: ['An exclusion stops addresses being handed out at all.', null, 'A larger scope changes how many addresses there are, not which one a device gets.', 'A different lease time changes how long an address is held, not which one.'] },
      { q: 'Which server sits between users and the internet to filter and cache web requests?',
        choices: ['Proxy server', 'Mail server', 'DNS server', 'Authentication server'], answer: 0,
        why: 'A proxy goes to the web on the user’s behalf, which is what lets it filter and cache.',
        ifWrong: [null, 'A mail server handles email.', 'DNS resolves names.', 'An authentication server decides who you are and what you may do.'] },
      { q: 'An application opens for everyone but shows no data at all. Which server role would you expect to be involved?',
        choices: ['Print server', 'Database server', 'Spam gateway', 'NTP server'], answer: 1,
        why: 'An application’s data lives on a database server, so the app can start and still have nothing to show.',
        ifWrong: ['A print server holds queues.', null, 'A spam gateway filters email.', 'An NTP server keeps clocks in step.'] },
      { q: 'Other companies’ mail systems need to know where to deliver email addressed to `northstar.example`. Which DNS record tells them?',
        choices: ['TXT', 'MX', 'CNAME', 'A'], answer: 1,
        why: 'MX stands for mail exchanger, and it names the host that accepts a domain’s mail.',
        ifWrong: ['TXT records carry the email checks SPF, DKIM and DMARC, which say who may send and what to do when a check fails, not where to deliver.', null, 'A CNAME is an alias for another name.', 'An A record maps a name to an address.'] },
      { q: 'A scope covers 10.20.30.50 to 10.20.30.220. Three switches already use 10.20.30.70, .71 and .72 as fixed addresses. What stops DHCP from handing those three out to laptops?',
        choices: ['A reservation', 'An exclusion', 'A shorter lease', 'A second VLAN'], answer: 1,
        why: 'An exclusion removes addresses from the pool entirely. Nothing gets them from DHCP.',
        ifWrong: ['A reservation keeps an address for a named device, which isn’t what a switch with a fixed address needs.', null, 'A shorter lease changes how long an address is held, not which addresses are handed out.', 'A VLAN is a separate network, and one scope serves one VLAN, so a second one doesn’t protect these addresses.'] },
    ],
  },
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS05_OBJECTIVE = 'By the end of this module you can find your way around the `northstar.example` domain in the simulator’s server screens, and say what each server role does and what breaks for users when it stops. You can read a share’s two permission layers and say what a named person can actually do. You can read a computer object’s place in the directory, run `gpresult /r` and say which policies reached a machine and which didn’t. You can read a server’s services, its logs and the change log, and tell the difference between something the Service Desk may fix and something it must hand on with evidence. And you can decide, for any of them, whether this is one person’s problem or everyone’s. A+ Core 1: **2.3** services provided by networked hosts · **2.4** common network configuration concepts (DNS, DHCP, VLAN). Competencies: **1** AD basics · **3** Ticketing discipline · **9** Triage and escalation judgment.';

const ITS05_SOURCES = [
  { title: 'Active Directory Domain Services overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/ad-ds-getting-started', note: 'Official reference for the directory structure this module introduces.' },
  { title: 'Windows Server documentation', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/', note: 'Broader Server Manager and Group Policy reference.' },
  { title: 'Dynamic Host Configuration Protocol (DHCP) overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/networking/technologies/dhcp/dhcp-top', note: 'Scopes, leases, reservations and exclusions.' },
  { title: 'Domain Name System (DNS) overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/networking/dns/dns-top', note: 'Zones and the record types a DNS server holds.' },
  { title: 'gpresult', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/gpresult', note: 'What gpresult /r shows about the policies applied to a machine.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): each check's
// "complete" and its time, and whether the walkthrough was started. Never
// answers or a score.
const ITS05_STATE_ID = 'its05-page-v1';
// Since 2026-11-25 Module 7's Prove It gates completion (the its05 Prove It
// migration) and Lab 7.1 is Practice It. It keeps its course_module_labs
// row, so its walkthrough record still saves. The practice tickets lab has
// its own lab key, and so has the Prove It.
const ITS05_LAB1_KEY = 'lab-its-05-server-ad';
const ITS05_PRACTICE_KEY = 'lab-its-05-practice-tickets';
const ITS05_PROVE_KEY = 'lab-its-05-prove-it';
const ITS05_LAB_KEYS = [ITS05_LAB1_KEY, ITS05_PRACTICE_KEY, ITS05_PROVE_KEY];
const ITS05_COACH_ID = 'hd-m05';
const ITS05_LAB1_START = 'Start Lab 7.1 walkthrough';

const ITS05_DEFAULT_STATE = {
  consoleStarted: false, consoleCompleted: false,
  learnCheckCompleted: false, learnCheckCompletedAt: null,
  aplusCheckCompleted: false, aplusCheckCompletedAt: null,
};

let its05State = null;
let its05User = null;

function its05Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts every check fresh.
  const userId = user && user.userId;
  if (userId !== its05CheckAnswersUser) {
    its05CheckAnswersUser = userId;
    Object.keys(its05CheckAnswers).forEach((key) => {
      its05CheckAnswers[key] = {};
      its05CheckPicks[key] = {};
      its05CheckSaveFailed[key] = false;
      its05CheckAttempt[key] = 0;
    });
  }
  its05User = user;
  its05State = LabRuntime.loadCaseState(ITS05_STATE_ID, 'its-05', user, ITS05_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS05_COACH_ID, [ITS05_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-05');
  return its05State;
}

function its05Save(onResult) {
  if (its05User && its05State) LabRuntime.saveCaseState(ITS05_STATE_ID, 'its-05', its05User, its05State, onResult ? { onResult } : {});
}

function its05Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/* ------------------------------------------------------- Knowledge checks */

/* One question at a time, as on Module 1. A wrong pick shows why that choice is
 * wrong, never the right answer, and the student picks again. A right pick
 * shows the Why. Only the first pick on each question counts. A check is
 * complete the first time a full pass of first picks is 70% or more (whole
 * numbers only: correct x 10 >= total x 7), so 5 of 6 on the Learn It check
 * and 6 of 8 on the A+ check. Once complete it stays complete; Start again is
 * a retake. No lab attempt, no lab key, gates nothing. */
const ITS05_LETTERS = ['A', 'B', 'C', 'D'];
const ITS05_CHECK_PASS_TENTHS = 7;
// The saved completion fields for each check.
const ITS05_CHECK_SAVED = {
  learn: ['learnCheckCompleted', 'learnCheckCompletedAt'],
  aplus: ['aplusCheckCompleted', 'aplusCheckCompletedAt'],
};

// This page's picks, by check, kept in page memory only (a reload starts
// every check again), by the choice's place in the data (not the place shown):
//   its05CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its05CheckPicks: { questionIndex: [every pick, in order] }.
//   its05CheckAttempt: how many times the check was started again; it is part
//   of the shuffle, so a retake shows the choices in a new order.
const its05CheckAnswers = { learn: {}, aplus: {} };
const its05CheckPicks = { learn: {}, aplus: {} };
// Checks whose completion the account reported it didn't save (page memory).
const its05CheckSaveFailed = { learn: false, aplus: false };
const its05CheckAttempt = { learn: 0, aplus: 0 };
let its05CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id, the check, the question and the attempt, so it differs between
// students and between retakes, and stays the same for one student on every
// redraw and reload of the same attempt.
function its05ChoiceOrder(checkId, index) {
  const question = ITS05_CHECKS[checkId].questions[index];
  const seed = `${its05User ? LabRuntime.anonymousStudentId(its05User) : ''}|its-05|${checkId}|${index}|${its05CheckAttempt[checkId]}`;
  let n = 2166136261;
  for (const ch of seed) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = question.choices.map((_, c) => c);
  for (let i = order.length - 1; i > 0; i -= 1) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((n / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Every question has a first pick: a full pass, ready to count.
function its05CheckDone(checkId) {
  return ITS05_CHECKS[checkId].questions.every((_, i) => Object.prototype.hasOwnProperty.call(its05CheckAnswers[checkId], i));
}
function its05CheckRightCount(checkId) {
  return ITS05_CHECKS[checkId].questions.filter((question, i) => its05CheckAnswers[checkId][i] === question.answer).length;
}
// Whole numbers only, so 5 of 8 (62.5%) or 4 of 6 (66.7%) can never round
// up to a pass.
function its05CheckPassed(checkId) {
  const total = ITS05_CHECKS[checkId].questions.length;
  return its05CheckRightCount(checkId) * 10 >= total * ITS05_CHECK_PASS_TENTHS;
}
// How many first picks a full pass needs.
function its05CheckNeeded(checkId) {
  return Math.ceil((ITS05_CHECKS[checkId].questions.length * ITS05_CHECK_PASS_TENTHS) / 10);
}
function its05CheckCompleted(checkId) {
  return Boolean(its05State && its05State[ITS05_CHECK_SAVED[checkId][0]] === true);
}

function its05CheckQuestion(checkId, question, index) {
  const picks = its05CheckPicks[checkId][index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer. data-choice stays the data index; the letter
  // comes from the place the choice is shown in.
  const choices = its05ChoiceOrder(checkId, index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its05-answer data-check="${checkId}" data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS05_LETTERS[place]}</span> ${its05Text(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${its05Text(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${its05Text(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its05-${checkId}-q${index}">${its05Text(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its05-${checkId}-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its05-${checkId}-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its05CheckFooter(checkId) {
  const anyAnswered = Object.keys(its05CheckAnswers[checkId]).length > 0;
  const reset = anyAnswered ? `<button type="button" class="its01-check-reset" data-its05-check-reset="${checkId}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  const saveFailed = its05CheckSaveFailed[checkId] && its05CheckDone(checkId) && its05CheckPassed(checkId);
  const retry = saveFailed ? `<button type="button" class="its01-check-reset" data-its05-check-retry="${checkId}"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>` : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its05CheckDone(checkId) && !its05CheckPassed(checkId)) {
    status = `Retake: you need ${its05CheckNeeded(checkId)} of ${ITS05_CHECKS[checkId].questions.length}. Press Start again to retake the check.`;
  } else if (its05CheckCompleted(checkId)) {
    const day = its05Day(its05State[ITS05_CHECK_SAVED[checkId][1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS05_CHECKS[checkId].title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its05-check-footer="${checkId}"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its05Check(checkId) {
  const check = ITS05_CHECKS[checkId];
  return `<div class="its01-check" data-its05-check="${checkId}" id="its05-check-${checkId}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its05CheckQuestion(checkId, question, i)).join('')}</ol>
    ${its05CheckFooter(checkId)}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

// Each check sits right after the reading card it follows (as on Module 1's
// page), outside the card, so a rail link to it never lands inside a closed
// card. Both come after Reading 5: two Learn It questions test OUs and
// computer objects, which Reading 5 teaches.
const ITS05_CHECK_AFTER_READING = { 5: ['learn', 'aplus'] };

function its05Learn() {
  return `<section class="its01-section" id="its05-lessons" aria-labelledby="its05-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its05-lessons-title">Lessons 7.1 to 7.4</h2></div></div>
    <p class="its01-instruction">Four lessons and five readings. Lesson 7.2 has two readings that share its time. Open each reading for its text, tables and diagram. The Learn It check and the A+ check come after Reading 5.</p>
    ${its05Cards().map((card) => `<div class="its01-lesson-grid">${its05LessonCard(card)}</div>${(ITS05_CHECK_AFTER_READING[card.reading] || []).map(its05Check).join('')}`).join('')}
  </section>`;
}

// Lab 7.1: the hd-m05 coach on the morning server check (HD-2189) in the IT
// Service Desk simulator (ui/helpdesk-coaches.js). Feedback only: no score.
function its05Lab1() {
  const button = itsWalkthroughButton(its05User, [ITS05_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its05-lab-7-1" aria-labelledby="its05-lab-7-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its05-lab-7-1-title">${esc(itsLabTitle(ITS05_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">It is Wednesday, 08:00, and the morning server check (HD-2189) is yours. In the IT Service Desk simulator you triage the check, then read the five servers in Server Manager, a server’s services and System log, the change log, a file share’s two permission layers, Active Directory, Group Policy, DNS and DHCP, and run four typed checks. You change nothing on a server. When you find something another team owns, you raise a ticket for it yourself (HD-2190) and hand it on, then resolve the check with a note. A coach guides you through each step.</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Practice: not graded. Feedback only, no score.</p>
    <a class="itsw-evidence-button" data-its05-console-launch href="${esc(itsCoachLaunchHref(ITS05_COACH_ID, its05User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS05_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its05User, ITS05_COACH_ID, [ITS05_LAB1_KEY], ITS05_LAB1_START)}
    ${itsLabStatusHtml(its05User, ITS05_LAB1_KEY, { label: 'Lab 7.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its05User, [{ key: ITS05_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 7.2, the module's five unguided tickets, not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-05,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all five are done the simulator can report it (its05ReceivePracticeCompletion).
function its05PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-05&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its05PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its05-lab-7-2" aria-labelledby="its05-lab-7-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its05-lab-7-2-title">${esc(itsLabTitle(ITS05_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Five tickets to work on your own, each a different issue: a laptop missing its O: drive after a rebuild (7-A), the Print Spooler stopped on the print server (7-B), a file server volume filling fast (7-C), the Finance drive gone for a whole team (7-D), and a warehouse time clock that changed address (7-E). On each one, set the Category, CI, Impact and Urgency yourself, use the tool screens and the knowledge base, and press Check my work for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all five tickets: each one ends resolved, assigned to the team that owns it, or converted to its request, and each one gets your work note. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 7.2.</p>
    <a class="itsw-evidence-button" data-its05-practice-launch href="${esc(its05PracticeTicketsHref(its05User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its05User, ITS05_PRACTICE_KEY, { label: 'Lab 7.2', prefix: 'its01', pendingText: 'Finish all five tickets: resolve each one, assign it to the team that owns it, or convert it to its request.' })}
  </section>`;
}

// Module 7's Prove It, on Module 6's pattern: a new ticket in the simulator
// (?prove=its-05), reviewed by the instructor. Practice It is recommended
// first, never required. A submitted attempt has nothing left to open. What
// it shows comes from the server's attempt (itsLabStatus); the simulator
// reports back by message (itsProveReceiveMessage).
function its05Prove() {
  const user = its05User;
  const returned = itsLabReturned(user, ITS05_PROVE_KEY);
  return `<section class="its01-section its01-lab-section" id="its05-prove-it" aria-labelledby="its05-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its05-prove-it-title">${esc(itsLabTitle(ITS05_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Set the ticket fields, ask the caller the one question you need most, check the evidence on the server screens, decide what happens next, and write a key finding, a work note and a reply to the user. You don’t need to type any command. Plan on about 45 minutes. Your instructor reviews your work.</p>
    ${itsLabRail(user, [ITS05_LAB1_KEY]).isComplete ? '' : '<p class="its01-instruction">Work Lab 7.1, the guided lab, first: it prepares you for this.</p>'}
    ${itsLabSubmitted(user, ITS05_PROVE_KEY) ? '' : `<a class="itsw-evidence-button" data-its05-prove-launch href="${esc(itsProveLaunchHref('its-05', user))}" target="_blank" rel="opener">
      <i class="${returned ? 'ri-restart-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${returned ? 'Reopen the Prove It' : 'Start the Prove It'}
    </a>`}
    ${itsLabStatusHtml(user, ITS05_PROVE_KEY, { label: 'Prove It', prefix: 'its01', pendingText: 'Press Submit in the simulator when you finish the ticket.' })}
    ${itsLabStatus(user, ITS05_PROVE_KEY) === 'passed' && typeof markedLabLinkHtml === 'function' ? `<p>${markedLabLinkHtml(ITS05_PROVE_KEY, 'See your score and feedback')}</p>` : ''}
    ${itsRedoNoticeHtml(user, [{ key: ITS05_PROVE_KEY, action: 'Reopen the Prove It, make your changes, then press Resubmit in the simulator. You can resubmit once for each return.' }])}
  </section>`;
}
// A Prove It message changed the attempt: show it if this page is open.
function its05ProveChanged() {
  if (document.querySelector('.its05-shell')) render();
}

function its05Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS05_SOURCES.map((source) => `<li class="msources-item">
        <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. The readings, the three labs and both checks count toward the
 * module's percent (shown only; it saves nothing); Sources doesn't. The checks
 * come last in the list, so they never lock a lab (moduleNavStatuses locks
 * only rows after an unfinished one), and neverLocked keeps them open while
 * Lab 7.1 isn't done. */
function its05NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its05-lessons' },
    { id: 'guided-lab', title: 'Guided morning server check walkthrough', navTitle: 'Lab 7.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS05_LAB1_KEY]), scrollId: 'its05-lab-7-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 7.2 · Practice tickets', navTitle: 'Lab 7.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS05_PRACTICE_KEY]), scrollId: 'its05-lab-7-2' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS05_PROVE_KEY]), scrollId: 'its05-prove-it' },
    { id: 'learn-check', title: ITS05_CHECKS.learn.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its05CheckCompleted('learn'), doneLabel: 'Complete', scrollId: 'its05-check-learn' },
    { id: 'aplus-check', title: ITS05_CHECKS.aplus.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its05CheckCompleted('aplus'), doneLabel: 'Complete', scrollId: 'its05-check-aplus' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its05-sources', gated: false, supplemental: true },
  ];
}
function its05Rail(user) {
  return moduleProgressShell(its05NavSections(user), { moduleKey: 'its05', stageKey: 'its-05' });
}

function viewItsModuleSevenPage(user, program) {
  its05Load(user);
  const module = program.modules['its-05'];
  return `<div class="its05-shell">
    ${moduleTopbar(user, program)}
    ${its05Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its05-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its05-title">${esc(module.title)}</h1><p class="its01-lede">${its05Text(ITS05_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${ITS05_LESSONS.length}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its05-status">${itsLabCounterText(user, ITS05_LAB_KEYS)}</dd></div></dl></section>

      ${its05Learn()}
      ${its05Lab1()}
      ${its05PracticeTickets()}
      ${its05Prove()}

      <section class="its01-section" id="its05-sources" aria-labelledby="its05-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its05-sources-title">Sources &amp; Further Reading</h2></div></div>${its05Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its05RefreshRail() {
  const rail = document.querySelector('.its05-shell [data-mquick-nav-rail]');
  if (!rail || !its05User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its05Rail(its05User);
  const fresh = holder.querySelector('[data-mquick-nav-rail]');
  if (!fresh) return;
  const percent = rail.querySelector('.munified-percent');
  const freshPercent = fresh.querySelector('.munified-percent');
  if (percent && freshPercent) percent.textContent = freshPercent.textContent;
  fresh.querySelectorAll('a.munified-row').forEach((row) => {
    const old = rail.querySelector(`a.munified-row[href="${row.getAttribute('href')}"]`);
    if (!old) return;
    old.className = row.className;
    ['aria-disabled', 'data-mnav-locked-reason', 'data-mnav-locked-target'].forEach((name) => {
      if (row.hasAttribute(name)) old.setAttribute(name, row.getAttribute(name)); else old.removeAttribute(name);
    });
    old.innerHTML = row.innerHTML;
  });
}

function its05RenderCheck(checkId, focusIndex) {
  const el = document.querySelector(`.its05-shell [data-its05-check="${checkId}"]`);
  if (el) el.outerHTML = its05Check(checkId);
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its05-${checkId}-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its05RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. A check is complete, and saved as
// such (complete and its time only), the first time a full pass of first picks
// passes.
function its05Answer(checkId, index, choice) {
  const check = ITS05_CHECKS[checkId];
  const question = check && check.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its05CheckPicks[checkId][index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its05CheckPicks[checkId][index] = picks.concat(choice);
  if (its05CheckAnswers[checkId][index] === undefined) its05CheckAnswers[checkId][index] = choice;
  const [done] = ITS05_CHECK_SAVED[checkId];
  if (its05State && its05CheckDone(checkId) && its05CheckPassed(checkId) && its05State[done] !== true) its05SaveCheckDone(checkId);
  its05RenderCheck(checkId, index);
}

// Ticks a check and saves it, as Module 1's checks do. Only an explicit false
// from the save takes the tick off again (an unknown result leaves it), and
// only if the same student still has the same completion (a render reloads
// its05State, so it's matched by its time, not by object). The untick is saved
// the same way, so this page, this browser's copy and the session's copy of
// the row agree.
function its05SaveCheckDone(checkId) {
  const [done, doneAt] = ITS05_CHECK_SAVED[checkId];
  const userId = its05User && its05User.userId;
  const at = new Date().toISOString();
  its05State[done] = true;
  its05State[doneAt] = at;
  its05CheckSaveFailed[checkId] = false;
  its05Save((ok) => {
    const state = its05State;
    if (ok !== false || !state || !its05User || its05User.userId !== userId || state[doneAt] !== at) return;
    state[done] = false;
    state[doneAt] = null;
    its05CheckSaveFailed[checkId] = true;
    its05Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector(`.its05-shell [data-its05-check-footer="${checkId}"]`);
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its05RenderCheck(checkId);
    if (focusInFooter) its05FocusCheckStatus(checkId);
  });
}

function its05FocusCheckStatus(checkId) {
  const status = document.querySelector(`.its05-shell [data-its05-check-footer="${checkId}"] .its01-check-status`);
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its05RetryCheckSave(checkId) {
  if (!ITS05_CHECKS[checkId] || !its05CheckSaveFailed[checkId] || !its05State || !its05CheckDone(checkId) || !its05CheckPassed(checkId)) return;
  its05SaveCheckDone(checkId);
  its05RenderCheck(checkId);
  its05FocusCheckStatus(checkId);
}

// Start again: a new attempt, so the choices come back in a new order.
function its05ResetCheck(checkId) {
  if (!ITS05_CHECKS[checkId]) return;
  its05CheckAnswers[checkId] = {};
  its05CheckPicks[checkId] = {};
  its05CheckSaveFailed[checkId] = false;
  its05CheckAttempt[checkId] += 1;
  its05RenderCheck(checkId);
  const first = document.querySelector(`.its05-shell [data-its05-check="${checkId}"] [data-its05-answer]`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleSevenPage() {
  const shell = document.querySelector('.its05-shell');
  if (!shell || !its05State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its05-answer]');
    if (answer) {
      if (!answer.disabled) its05Answer(answer.dataset.check, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const reset = event.target.closest('[data-its05-check-reset]');
    if (reset) {
      its05ResetCheck(reset.dataset.its05CheckReset);
      return;
    }
    const retry = event.target.closest('[data-its05-check-retry]');
    if (retry) {
      its05RetryCheckSave(retry.dataset.its05CheckRetry);
      return;
    }
    const launch = event.target.closest('[data-its05-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its05User, ITS05_COACH_ID)) {
        its05State.consoleStarted = true;
        its05Save();
      }
      itsRefreshWalkthroughNotice(its05User, ITS05_COACH_ID, [ITS05_LAB1_KEY], ITS05_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 7.1 and Lab 7.2 saves */

// Lab 7.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// the morning server check HD-2189 resolved, and the ticket the student raised
// for the finding, HD-2190, raised from HD-2189. The coach checks every step in
// order before it shows Finish; the saved work keeps no step list, so the page
// checks the end. An old tab could still send an early message.
const ITS05_LAB1_TICKET = 'HD-2189';
const ITS05_LAB1_RAISED = 'HD-2190';
function its05Lab1Complete(work) {
  const tickets = work && Array.isArray(work.tickets) ? work.tickets : [];
  const check = tickets.find((entry) => entry.id === ITS05_LAB1_TICKET);
  const raised = tickets.find((entry) => entry.id === ITS05_LAB1_RAISED);
  return Boolean(check) && check.status === 'Resolved' && Boolean(raised) && raised.raisedFrom === ITS05_LAB1_TICKET;
}

async function its05ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS05_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS05_COACH_ID}`;
  if (!its05Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS05_COACH_ID, [ITS05_LAB1_KEY], ITS05_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 7.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-05', [ITS05_LAB1_KEY], work);
  its05User = user;
  if (received) {
    const saved = LabRuntime.load(ITS05_STATE_ID, user, ITS05_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS05_STATE_ID, user, saved);
    its05State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-05', ITS05_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its05-shell')) return;
  render();
  const section = document.getElementById('its05-lab-7-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 7.2's completion: the simulator's practice set says its five tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS05_PRACTICE_TICKETS = ['HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195'];
const ITS05_PRACTICE_LOCK_MS = 15000;
function its05StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its05StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its05StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its05ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-05') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-05', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS05_PRACTICE_TICKETS.length || !ITS05_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS05_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS05_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS05_PRACTICE_KEY}`;
  const held = Number(its05StorageGet(lock)) || 0;
  if (Date.now() - held < ITS05_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its05StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its05SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS05_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-05', ITS05_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-05', tickets: ITS05_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its05StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-05', ITS05_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its05User = user;
  if (document.querySelector('.its05-shell')) render();
}

// The student's saved Lab 7.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its05SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS05_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 7.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 7.2 completion read threw', error);
    return null;
  }
}

function its05OnMessage(event) {
  itsProveReceiveMessage(event, { moduleKey: 'its-05', labKey: ITS05_PROVE_KEY, onChange: its05ProveChanged });
  return Promise.all([its05ReceivePracticeCompletion(event), its05ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 7, moduleKey: 'its-05',
  view: viewItsModuleSevenPage, wire: wireItsModuleSevenPage, onMessage: its05OnMessage,
});

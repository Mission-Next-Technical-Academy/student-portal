/* Module 4 (key its-02) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Lesson 4.1: Reading 1 (virtualization and the cloud), with a diagram
 *     and the cloud models card sort.
 *   - Lesson 4.2: what to know before you build (network modes, snapshots,
 *     servers), "Your first commands" with the commands table, and the
 *     Lesson 4.2 check (not graded; it saves only that it was completed).
 *   - Lesson 4.3: Reading 2 (docks, monitors, peripherals, battery safety).
 *   - Lesson 4.4: Reading 3 (printers, in the right order). The A+ check
 *     (seven questions, all four lessons) is filed with this lesson.
 *   - The labs' state and cards, drawn further down this file.
 *
 * Block types (its02Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }),
 * diagram (a key of ITS02_DIAGRAMS), cardsort (the cloud models card sort)
 * and check (a key of ITS02_CHECKS). In p, ul, ol and table text, **...** is
 * emphasized and `...` is inline code. bin/its-curriculum-check.js reads each
 * lesson's title and minutes from this file: they must match portal/data.js.
 */

const ITS02_SOURCES = [
  { title: 'Hyper-V technology overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-technology-overview', note: 'Official reference for the virtualization concepts and VM-building lab in this module.' },
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'A public reference for the certification this course’s content lines up with. No certification exam is required to finish the program.' },
];

const ITS02_OBJECTIVE = 'By Friday you can explain what virtualization and the cloud are, why companies use them and what resources a virtual machine needs. You can support users on virtual desktops and cloud apps. You can triage docks, monitors, webcams, headsets and Bluetooth devices, handle battery hazards safely, and add a network printer, clear a stuck queue and fix offline printers in the right order.';

const ITS02_LESSONS = [
  {
    id: 'its-02-lesson-01', number: '4.1', icon: 'ri-cpu-line',
    title: 'Virtualization Fundamentals & Building Your First VM', minutes: 240,
    learn: [
      'Explain what a virtual machine, a host, a guest and a hypervisor are',
      'Say why companies use virtual machines, and what resources each one needs',
      'Tell SaaS, IaaS and PaaS apart, and know who fixes what in each',
    ],
    blocks: [
      { h: 'Reading 1 · Virtualization and the cloud: what, why and what it takes' },
      { p: 'A **virtual machine (VM)** is a complete computer made of software, running inside a real one. The real computer is the **host**. The VM is the **guest**.' },
      { p: 'The **hypervisor** is the software that shares the host’s CPU, memory (RAM), disk and network among its guests. There are two kinds:' },
      { ul: [
        '**Type 1** (“bare-metal”) hypervisors run straight on server hardware in data centres. Examples: VMware ESXi and Microsoft Hyper-V.',
        '**Type 2** (“hosted”) hypervisors are apps on a normal operating system. VirtualBox is an example.',
      ] },
      { h5: 'Why companies use VMs' },
      { ul: [
        'Testing updates safely before they reach real users.',
        '**Sandboxing** a risky file, so it can’t touch anything that matters.',
        'Running old software that needs an old setup.',
        'Packing many servers onto one machine.',
        '**VDI** (Virtual Desktop Infrastructure): the user’s whole Windows desktop runs on a server, and they reach it from any device.',
      ] },
      { h5: 'What a VM needs' },
      { p: 'Every VM needs its own share of RAM, CPU cores and disk. Give it too little and it crawls. Give it too much and the host starves, because every guest’s share comes out of the host.' },
      { p: 'The host’s CPU must also have virtualization switched on in its firmware, or no VM will start.' },
      { ul: [
        'A **snapshot** is a checkpoint before a risky change. It is not a backup.',
        '**Containers** package one app and share the host’s operating system, so they’re lighter than VMs.',
      ] },
      { diagram: 'cloud' },
      { h5: 'The cloud' },
      { p: 'The **cloud** is someone else’s data centre, used over the internet and paid for by use. Three models differ in how much you manage:' },
      { ul: [
        '**IaaS** rents you servers and storage. You manage the operating system.',
        '**PaaS** gives you a ready platform for your own code.',
        '**SaaS** is a finished app you just use, like Microsoft 365 or ServiceNow.',
      ] },
      { p: '**Public**, **private**, **hybrid** and **community** clouds differ in who shares the infrastructure. Northstar is hybrid: its own on-site servers plus Microsoft 365.' },
      { p: 'Exam words to know: shared resources, **rapid elasticity** (grows and shrinks with demand), **metered utilization** (pay for what you use), high availability, and **file synchronization** (OneDrive).' },
      { p: 'For support, SaaS means the vendor fixes the service. So your first job is telling a vendor outage from a problem on the user’s own computer.' },
      { cardsort: true },
    ],
    comingUp: 'Build NS-TEST-W11, a Windows client VM, step by step in the simulator (Lab 4.1).',
  },
  {
    id: 'its-02-lesson-02', number: '4.2', icon: 'ri-history-line',
    title: 'VM Snapshots, Recovery & Building a Server Environment', minutes: 240,
    learn: [
      'Pick the right network mode for what a VM needs to reach',
      'Use a snapshot as a checkpoint, and know why it is not a backup',
      'Say what a server does, and run your first six commands safely',
    ],
    blocks: [
      { h: 'Before you build: network modes, snapshots and servers' },
      { h5: 'Network modes' },
      { p: 'Each VM gets a network mode. It decides who the VM can talk to.' },
      { ul: [
        '**NAT:** the VM reaches the internet through the host.',
        '**Bridged:** the VM looks like another PC on the network.',
        '**Internal:** VMs talk only to each other.',
        '**Host-only:** VMs and the host only.',
      ] },
      { diagram: 'modes' },
      { h5: 'Snapshots' },
      { p: 'A snapshot is a checkpoint before a risky change, not a backup: it lives on the same disk. If the disk fails, the VM and its snapshots go together.' },
      { h5: 'Servers' },
      { p: 'A server runs roles for many users: files, printing, the directory. You’ll work in Server Manager in Module 7.' },
      { h: 'Your first commands' },
      { ul: [
        'PowerShell is Windows’ command line. You type one command, press Enter and read what comes back.',
        'Most commands are a verb and a noun joined by a dash. `Get-` commands only read: they change nothing, so they’re safe to run. `Stop-`, `Start-`, `Set-` and `Remove-` commands change something, so run them only when the KB article or your coach says to.',
        'A parameter starts with a dash and narrows the command: `-Name`, `-PrinterName`, `-Port`.',
        'The pipe `|` hands one command’s result to the next: `Get-Printer -Name NS-HR-LABEL01 | Format-List Name, PortName, DriverName` gets one printer, then lists three facts about it.',
        'Read the output for the one line that answers your question, and copy that line into your work note as evidence.',
        'Your first command is `ping` followed by an address, typed in a VM’s console in Lab 4.2: it asks another machine to answer.',
        'In the simulator, PowerShell opens from the ticket, already connected to the user’s computer. It is a training shell: if it doesn’t know a command it says so and lists the ones it supports.',
      ] },
      { table: {
        caption: 'The commands Module 4 uses',
        head: ['Command', 'What it tells you or does', 'Changes anything?'],
        rows: [
          ['`ping 10.0.5.10`', 'Whether one machine can reach another: replies, or “Request timed out”', 'No'],
          ['`Get-Service Spooler`', 'Whether the Print Spooler service is Running or Stopped', 'No'],
          ['`Get-PrintJob -PrinterName NS-HR-MFP01`', 'The jobs waiting for that printer on this computer, and which one is in Error', 'No'],
          ['`Stop-Service Spooler` then `Start-Service Spooler`', 'Restarts the service every print job passes through', 'Yes: only when a job won’t cancel'],
          ['`Get-Printer -Name NS-HR-LABEL01 | Format-List Name, PortName, DriverName`', 'Which port and which driver the printer uses', 'No'],
          ['`Test-NetConnection 10.20.70.20 -Port 9100`', 'Whether this computer can reach the printer on its print port (`TcpTestSucceeded : True`)', 'No'],
        ],
      } },
      { p: 'Commands are a job skill, and a head start on A+ Core 2. Core 1 tests what they reveal (ports, drivers, connectivity), not the commands themselves.' },
      { p: 'In this module the coach shows each command in full, so you can type it exactly.' },
      { check: 'build' },
    ],
    comingUp: 'Snapshot your client VM, build a server VM, ping both ways and help a user on a virtual desktop (Lab 4.2).',
  },
  {
    id: 'its-02-lesson-03', number: '4.3', icon: 'ri-hard-drive-2-line',
    title: 'Windows Device & Storage Management', minutes: 90,
    learn: [
      'Work out why everything on a dock is dead, starting where the power comes in',
      'Check a webcam, headset or Bluetooth device in the right order',
      'Handle a swollen battery safely',
    ],
    blocks: [
      { h: 'Reading 2 · Docks, monitors, peripherals and battery safety' },
      { h5: 'Docks and monitors' },
      { p: 'A **docking station** adds power, monitors, Ethernet and USB through one cable. A **port replicator** is simpler.' },
      { p: '**USB-C is a shape.** Whether it carries video or charging depends on the port. Thunderbolt ports (lightning-bolt icon) do everything.' },
      { p: '**When everything on a dock is dead,** check the dock’s power and light first. Then check the cable and the port.' },
      { diagram: 'dock' },
      { p: '**Monitor says “No signal”?** Work through these:' },
      { ol: [
        'The monitor’s **Input/Source** button.',
        'The cable.',
        '**Win + P**: choose Extend or Duplicate.',
        '**Settings › Display › Detect**.',
      ] },
      { p: 'What a display symptom points to:' },
      { ul: [
        '**Dim but visible** means the backlight.',
        '**Flicker** means the cable or the refresh rate.',
        '**Dead pixels** means the panel.',
        '**Touch not responding** means the digitizer.',
      ] },
      { p: 'Escalate hardware faults to Desktop Support.' },
      { h5: 'Webcams, headsets and Bluetooth' },
      { p: 'For a webcam or headset, check the privacy shutter and the camera or mute key. Then check **Settings › Privacy & security › Camera/Microphone**. Then look at the device in Device Manager.' },
      { p: 'A yellow triangle with **Code 10** (cannot start) or **Code 43** (stopped because it reported problems) points at the driver or the device. If the driver’s date matches a recent update, use **Roll Back Driver**.' },
      { p: 'For **Bluetooth**, remove the device and pair it again from scratch.' },
      { h5: 'Battery safety' },
      { p: 'A **swollen battery** is a fire risk. Signs: a lifted trackpad, gaps in the case, heat. The user saves their work, unplugs, shuts down, and puts the device on a hard surface. The battery is then replaced. It is never charged or pressed on.' },
      { p: '**ESD:** static can kill parts, so anyone opening a device wears a wrist strap. Desk-side work like this is Tier 2, or follows a KB article.' },
    ],
    comingUp: 'Fix a dock and a camera problem in Lab 4.3, then work four more tickets in Lab 4.4.',
  },
  {
    id: 'its-02-lesson-04', number: '4.4', icon: 'ri-printer-line',
    title: 'Printer & Peripheral Triage', minutes: 90,
    learn: [
      'Tell a shared printer from one installed by address, and what a driver does',
      'Fix a printing problem in the right order',
      'Know which print problems are a part or a supply, not a setting',
    ],
    blocks: [
      { h: 'Reading 3 · Printers: deploy, queue, offline, in the right order' },
      { h5: 'How a printer is set up' },
      { p: 'Office printers are usually shared from a **print server**, with a path like `\\\\NS-PRINT01\\NS-HR-MFP01`. The server installs the driver automatically.' },
      { p: 'A direct install uses a **Standard TCP/IP port** with the printer’s IP address. Raw printing uses TCP **port 9100**.' },
      { p: 'Windows can also set a printer up by itself on a **WSD port** (Web Services for Devices), which finds the printer automatically. Company printers installed by address are meant to stay on their Standard TCP/IP port; **Printer properties › Ports** shows which port a printer is using.' },
      { p: 'The **driver** translates documents for the printer. The wrong one prints pages of random symbols.' },
      { p: '**Multifunction devices (MFDs)** also scan to email or to a folder. They can hold jobs until the user badges in (**secure print**).' },
      { p: 'Common settings tickets: duplex, tray and paper size. “Letter vs A4” leaves jobs stuck at “Load paper”.' },
      { h5: 'The fix order' },
      { p: 'Every job passes through the **Print Spooler** service. Fix a printing problem in this order:' },
      { ol: [
        'Cancel the stuck job.',
        'If it won’t cancel, stop the spooler, clear the stuck job, then start the spooler again.',
        'Check that **Use Printer Offline** isn’t ticked. A queue can also be **Paused**: the jobs wait and nothing is lost. Resume it from the queue’s Printer menu (untick **Pause Printing**); don’t delete the jobs.',
        'Check the printer itself: paper, jam, error screen, network.',
      ] },
      { diagram: 'print' },
      { p: 'Done backwards, the same broken job is sent again.' },
      { h5: 'Print quality' },
      { p: 'Smears, streaks, faded or blank pages are usually a supply or a part. The printer’s **supplies page** shows what’s low. Hardware repairs go to the print vendor.' },
    ],
    comingUp: 'Fix a stuck queue and an offline printer in Lab 4.3, then take the A+ check.',
  },
];

const ITS02_CARD_SORT = {
  title: 'Cloud models card sort',
  intro: 'Put each service in the box that matches how much you manage: pick a box under each card. Knowing who manages what tells you who fixes it. Not graded: a wrong box tells you why, and you try again.',
  buckets: ['SaaS', 'IaaS', 'PaaS'],
  cards: [
    { id: 'm365', label: 'Microsoft 365', answer: 'SaaS',
      why: 'Microsoft 365 is a finished app you just use, and the vendor runs everything behind it. Knowing who manages what tells you who fixes it: when it breaks, you check for a vendor outage first.',
      ifWrong: {
        IaaS: 'With this model you rent servers and storage, and you manage the operating system yourself. Nobody sets up a server to use Microsoft 365.',
        PaaS: 'With this model a team brings its own code to run on a ready platform. People using Microsoft 365 aren’t running any code of their own.',
      } },
    { id: 'azure-vm', label: 'An Azure VM', answer: 'IaaS',
      why: 'An Azure VM is a rented server. You manage its operating system, and the vendor manages the hardware. Knowing who manages what tells you who fixes it: a bad Windows setting on that VM is yours.',
      ifWrong: {
        SaaS: 'With this model you only use a finished app, and the vendor manages all of it. An Azure VM is a blank server that you set up.',
        PaaS: 'With this model the vendor already manages the operating system for you, and you only bring code. On an Azure VM, the operating system is yours to manage.',
      } },
    { id: 'web-platform', label: 'A web-app platform', answer: 'PaaS',
      why: 'A web-app platform runs your code for you, with the servers and operating system already managed. Knowing who manages what tells you who fixes it: the vendor fixes the platform and you fix your own code.',
      ifWrong: {
        SaaS: 'With this model there is no code of your own to run: you just use a finished app. A web-app platform needs you to bring the code.',
        IaaS: 'With this model you rent a bare server and manage its operating system yourself. This service already manages the operating system for you.',
      } },
  ],
};

const ITS02_CHECKS = {
  build: {
    title: 'Lesson 4.2 check',
    intro: 'Four questions on virtual machines. Not graded: it’s complete when you’ve worked through all four.',
    questions: [
      { q: 'Which network mode lets two VMs talk only to each other?',
        choices: ['NAT', 'Host-only', 'Internal', 'Bridged'], answer: 2,
        why: 'Internal keeps the VMs on a private network of their own, so they can reach each other and nothing else.',
        ifWrong: ['With NAT, a VM reaches the internet through the host. That’s more than talking only to each other.', 'With Host-only, the VMs can talk to the host as well as to each other.', null, 'With Bridged, a VM looks like another PC on the real network, so it can reach much more than the other VM.'] },
      { q: 'A VM is slow, but the host is fine. What do you check first?',
        choices: ['The RAM and CPU given to the VM', 'The VM’s snapshot name', 'The monitor cable on the host', 'The VM’s disk file name'], answer: 0,
        why: 'Every VM runs on its own share of the host’s RAM and CPU. If that share is too small, the VM crawls even when the host is fine.',
        ifWrong: [null, 'A snapshot’s name is only a label. It doesn’t change how fast the VM runs.', 'The VM draws its screen in software, so a cable on the host isn’t what slows it down.', 'A file name is only a label. It doesn’t change how fast the VM runs.'] },
      { q: 'Is a snapshot a backup?',
        choices: ['Yes, it protects you if the disk fails', 'Yes, as long as you take one every day', 'No, it only works on a server VM', 'No, it lives on the same disk as the VM'], answer: 3,
        why: 'A snapshot is a checkpoint before a risky change. It lives on the same disk as the VM, so a failed disk takes both.',
        ifWrong: ['A real backup protects you if the original is lost. Ask where this copy is kept, and what happens to it if that disk fails.', 'Taking one more often doesn’t make it safer. Ask where each copy is kept.', 'Snapshots work on client VMs and server VMs alike, so that isn’t the reason.', null] },
      { q: 'Two VMs can’t reach each other. What do you check first?',
        choices: ['The host’s free disk space', 'Their network mode', 'The name of each snapshot', 'The install image each VM was built from'], answer: 1,
        why: 'The network mode decides who a VM can reach. Two VMs set to modes that don’t connect them can’t talk, however well each one runs.',
        ifWrong: ['Free disk space affects whether a VM can start or grow. It doesn’t decide who a running VM can reach.', null, 'A snapshot’s name is only a label. It has no effect on the network.', 'The install image only matters while the VM is being built. It doesn’t decide who the VM can reach afterwards.'] },
    ],
  },
  aplus: {
    title: 'A+ check',
    intro: 'Seven questions in the style of the A+ Core 1 exam, on all four lessons. It’s complete when 5 of your first answers are right.',
    questions: [
      { q: 'A company wants to run many servers directly on bare-metal hardware with the best performance. Which should it use?',
        choices: ['Type 2 hypervisor', 'Type 1 hypervisor', 'Container runtime', 'Emulator'], answer: 1,
        why: 'A Type 1 hypervisor runs straight on the server’s hardware with no ordinary operating system underneath, so nothing else takes a share of the performance (Reading 1).',
        ifWrong: ['A Type 2 hypervisor is an app on a normal OS, so that OS sits between it and the hardware.', null, 'A container runtime packages single apps that share one OS. It doesn’t run whole servers on bare metal.', 'An emulator imitates different hardware in software, which is slower, not faster.'] },
      { q: 'A company pays for email and office apps that the provider fully manages. Which model is this?',
        choices: ['IaaS', 'PaaS', 'SaaS', 'DaaS'], answer: 2,
        why: 'A finished app you just use, with the provider running everything behind it, is SaaS. Microsoft 365 is the example (Reading 1).',
        ifWrong: ['With IaaS you rent servers and storage and still manage the operating system.', 'PaaS is a ready platform for code you write.', null, 'DaaS is a rented desktop. The question describes email and office apps.'] },
      { q: 'An online store adds servers automatically during holiday traffic and removes them afterwards. Which cloud characteristic is this?',
        choices: ['Metered utilization', 'Rapid elasticity', 'High availability', 'Shared resources'], answer: 1,
        why: 'Growing and shrinking automatically with demand is rapid elasticity (Reading 1).',
        ifWrong: ['Metered utilization is paying only for what you use. It’s about the bill, not the scaling.', null, 'High availability is staying up when a part fails.', 'Shared resources means many customers use the same pool of hardware.'] },
      { q: 'A user connects a laptop to a desk dock and nothing attached to the dock works, but the laptop does. What should be checked first?',
        choices: ['Monitor drivers', 'The dock’s power and connection', 'Reinstall Windows', 'Replace the monitors'], answer: 1,
        why: 'When everything attached to a dock is dead, start with what they all share: the dock’s power and light, then its cable and port (Reading 2).',
        ifWrong: ['A driver problem wouldn’t take out the keyboard and both monitors at the same moment.', null, 'The laptop is working, so Windows isn’t the problem.', 'Two monitors and a keyboard failing together points at the dock, not at the monitors.'] },
      { q: 'A user’s phone case is bulging and the device is hot. What should the technician do first?',
        choices: ['Run a battery calibration', 'Power it down, stop charging it, and arrange safe replacement and disposal', 'Update the OS', 'Replace the charger'], answer: 1,
        why: 'A swollen battery is a fire risk: power it down, stop charging it, and have it replaced and disposed of safely (Reading 2).',
        ifWrong: ['Calibration keeps a damaged battery in use.', null, 'Software can’t fix a battery that is physically swelling.', 'The charger isn’t the fault, and charging a swollen battery adds to the risk.'] },
      { q: 'A new printer prints pages of random symbols. What is the most likely cause?',
        choices: ['Low toner', 'Incorrect print driver', 'Faulty fuser', 'Paper jam'], answer: 1,
        why: 'The driver translates the document into the printer’s language. The wrong driver prints symbols (Reading 3).',
        ifWrong: ['Low toner prints faded pages, not symbols.', null, 'A fuser fault leaves toner that smears or rubs off.', 'A paper jam stops the page. It doesn’t change what is printed.'] },
      { q: 'A laptop’s screen is dim but the image is faintly visible with a flashlight. What is the most likely cause?',
        choices: ['Failed GPU', 'Failed backlight', 'Dead pixels', 'Wrong resolution'], answer: 1,
        why: 'The picture is still being drawn but the light behind it has failed: the backlight (Reading 2).',
        ifWrong: ['A failed graphics chip gives no picture or a scrambled one.', null, 'Dead pixels are single dots that stay dark or lit.', 'The wrong resolution makes the picture blurry or the wrong size, not dim.'] },
    ],
  },
};

const ITS02_LAB_ID = 'its02-lab-state-v1';
const ITS02_LAB21_KEY = 'lab-its-02-vm-build';
const ITS02_LAB22_KEY = 'lab-its-02-vm-snapshot-server';
const ITS02_LAB23_KEY = 'lab-its-02-device-manager';
const ITS02_LAB24_KEY = 'lab-its-02-print-spooler';

// Evidence labs: the state fields holding each lab's files (work not yet
// submitted), its name, prompt, and the Resubmit label used when faculty
// return it.
const ITS02_EVIDENCE_LABS = {
  [ITS02_LAB21_KEY]: { fields: ['evDesktop', 'evVmSettings'], label: 'Lab 4.1', pendingText: 'Finish Lab 4.1 in the simulator to complete this lab.', resubmitLabel: 'Resubmit Lab 4.1' },
  [ITS02_LAB22_KEY]: { fields: ['evSnapshot', 'evPing1', 'evPing2'], label: 'Lab 4.2', pendingText: 'Finish Lab 4.2 in the simulator to complete this lab.', resubmitLabel: 'Resubmit Lab 4.2' },
};
const ITS02_EVIDENCE_FIELD_BY_INPUT = {
  'its02-ev-desktop': 'evDesktop', 'its02-ev-vmsettings': 'evVmSettings',
  'its02-ev-snapshot': 'evSnapshot', 'its02-ev-ping1': 'evPing1', 'its02-ev-ping2': 'evPing2',
};
// Each coached lab runs its own coach in the simulator, and Lab 4.4 is the
// practice set ?practice=its-02. The VM labs are checked, not graded.
const ITS02_COACH_LABS = {
  'hd-m02-vm': { labKey: ITS02_LAB21_KEY, label: 'Lab 4.1', start: 'Start Lab 4.1 in the simulator', section: 'its02-lab-2-1' },
  'hd-m02-server': { labKey: ITS02_LAB22_KEY, label: 'Lab 4.2', start: 'Start Lab 4.2 in the simulator', section: 'its02-lab-2-2' },
  'hd-m02': { labKey: ITS02_LAB23_KEY, label: 'Lab 4.3', start: 'Start Lab 4.3 walkthrough', section: 'its02-lab-2-3' },
};
const ITS02_COACH_INCOMPLETE = 'Your lab wasn’t saved: it isn’t finished yet. Your work is still in the simulator. Finish every step there, then press Finish again.';
// The student's practice VMs, saved beside this page's own state (ui/helpdesk.js VM screen).
const ITS02_VM_STATE_ID = 'its02-vm-state-v1';
const ITS02_PRACTICE_TICKETS = ['HD-2169', 'HD-2170', 'HD-2171', 'HD-2172'];
const ITS02_WALKTHROUGH_LAB_KEYS = [ITS02_LAB23_KEY];
// Module 4's Prove It. Its card opens nothing yet: the simulator shift,
// scoring and gating row come with the Prove It part.
const ITS02_PROVE_KEY = 'lab-its-02-prove-it';
const ITS02_ALL_LAB_KEYS = [ITS02_LAB21_KEY, ITS02_LAB22_KEY, ITS02_LAB23_KEY, ITS02_LAB24_KEY, ITS02_PROVE_KEY];
const ITS02_WALKTHROUGH_START = ITS02_COACH_LABS['hd-m02'].start;

// Saved to the account with the labs' state: the earlier evidence files'
// names, whether a coach was started, and when the card sort and the two
// checks were completed. Never answers or a score.
const ITS02_DEFAULT_STATE = {
  evDesktop: null, evVmSettings: null,
  evSnapshot: null, evPing1: null, evPing2: null,
  consoleStarted: false, consoleCompleted: false,
  cardSortCompleted: false, cardSortCompletedAt: null,
  buildCheckCompleted: false, buildCheckCompletedAt: null,
  aplusCheckCompleted: false, aplusCheckCompletedAt: null,
};

let its02State = null;
let its02User = null;

function its02Load(user) {
  // Check and card sort picks live in page memory: a different student
  // signing in without a reload starts them fresh.
  const userId = user && user.userId;
  if (userId !== its02PicksUser) {
    its02PicksUser = userId;
    its02ResetPicks();
  }
  its02User = user;
  // Saved to the student's account (module_progress.case_state), so added-file
  // names come back in any browser after sign-in.
  its02State = LabRuntime.loadCaseState(ITS02_LAB_ID, 'its-02', user, ITS02_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  Object.keys(ITS02_COACH_LABS).forEach((coachId) => itsNoteCoachReturn(user, coachId, [ITS02_COACH_LABS[coachId].labKey]));
  // Record the Resubmit baseline the first time a returned lab is seen.
  const returnedEvidence = Object.keys(ITS02_EVIDENCE_LABS)
    .filter((labKey) => itsEvidenceRedo(user, its02State, labKey, ITS02_EVIDENCE_LABS[labKey].fields).returned);
  if (returnedEvidence.length) its02Save();
  // Files added before a reload come back from this browser's copies.
  itswRestoreDraftFiles(user, its02State, Object.keys(ITS02_EVIDENCE_LABS).map((labKey) => ({ labKey, fields: ITS02_EVIDENCE_LABS[labKey].fields })))
    .then((changed) => {
      if (!changed || its02User !== user) return;
      Object.keys(ITS02_EVIDENCE_LABS).forEach(its02RenderEvidenceLab);
      its02RenderHeroStatus();
    });
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-02');
  return its02State;
}

// Every file the evidence lab needs is picked on this page.
function its02EvidenceReady(labKey) {
  return ITS02_EVIDENCE_LABS[labKey].fields.every((field) => Boolean(its02State[field] && itswPickedFile(its02User, field)));
}

// The Resubmit button and return notice under a returned evidence lab.
function its02EvidenceRedoHtml(labKey) {
  const lab = ITS02_EVIDENCE_LABS[labKey];
  const redo = itsEvidenceRedo(its02User, its02State, labKey, lab.fields);
  if (!redo.returned) return '';
  return `${itsRedoNoticeHtml(its02User, [{ key: labKey, action: `Add or replace the evidence your instructor asked for, then press ${lab.resubmitLabel}.` }])}
    ${itsResubmitButton(labKey, lab.resubmitLabel, redo.allPresent && redo.changed)}`;
}

function its02Save(onResult) {
  if (its02User && its02State) LabRuntime.saveCaseState(ITS02_LAB_ID, 'its-02', its02User, its02State, onResult ? { onResult } : {});
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from Module 1's its01-dg-* classes and follows the page's theme
 * variables; its02-dg-warn is the red battery strip. Words are spec
 * section 6's. */
const ITS02_DIAGRAMS = {
  cloud: {
    title: 'One real computer, many virtual ones',
    caption: 'Every guest’s share comes out of the host. In the cloud, the host is someone else’s data centre.',
    stacks: [
      { title: 'Type 1 (bare-metal)', layers: ['Server hardware', 'Hypervisor (ESXi, Hyper-V)'], guests: 3, guestText: 'its share of CPU, RAM and disk' },
      { title: 'Type 2 (hosted)', layers: ['Your PC’s hardware', 'Windows (the host)', 'Hypervisor app (VirtualBox)'], guests: 2 },
    ],
    cells: ['IaaS: you rent the servers and manage the OS (an Azure VM)', 'PaaS: you bring the code, they run the platform', 'SaaS: you just use the app (Microsoft 365, ServiceNow)'],
    arrow: 'The vendor manages more →',
  },
  modes: {
    title: 'Network modes: who can a VM talk to?',
    caption: 'A line means traffic can flow. Pick the mode for what the VM needs to reach.',
    panels: [
      { mode: 'nat', text: 'NAT: the VM reaches the internet through the host' },
      { mode: 'bridged', text: 'Bridged: the VM looks like another PC on the network' },
      { mode: 'internal', text: 'Internal: VMs talk only to each other' },
      { mode: 'hostonly', text: 'Host-only: VMs and the host only' },
    ],
  },
  dock: {
    title: 'Everything on the dock is dead? Start where the power comes in',
    caption: 'Work left to right: each check needs the one before it to be fine.',
    steps: [
      { title: 'Dock light on?', text: 'No: check the dock’s power brick' },
      { title: 'Cable and port', text: 'USB-C is a shape: does this port carry video?' },
      { title: 'Monitor input', text: 'Input/Source button: DisplayPort or HDMI' },
      { title: 'Win + P', text: 'Extend or Duplicate' },
      { title: 'Settings › Display › Detect' },
    ],
    strip: 'Raised trackpad · gaps in the case · heat = swollen battery. Save, unplug, shut down, hard surface. Never charge it or press on it.',
  },
  print: {
    title: 'Where a print job travels, and the order to fix it',
    caption: 'Work left to right. Done backwards, the same broken job is sent again.',
    hops: [
      { title: 'Your app' },
      { title: 'Print Spooler (on your PC)', steps: [{ n: '1', text: 'Cancel the stuck job' }, { n: '2', text: 'Restart the spooler if it won’t cancel' }] },
      { title: 'Port: print server, or Standard TCP/IP to the printer’s address (9100)', steps: [{ n: '3', text: 'Untick Use Printer Offline' }] },
      { title: 'Printer', steps: [{ n: '4', text: 'Check the printer: paper, jam, error screen, network' }] },
    ],
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its02DiagramWords(key) {
  const d = ITS02_DIAGRAMS[key];
  if (key === 'cloud') {
    const stacks = d.stacks.map((s) => `${s.title}, from the bottom up: ${s.layers.join(', then ')}, then ${s.guests} boxes “Guest VM”${s.guestText ? `, each with ${s.guestText}` : ''}`).join('. Beside it, ');
    return `Two stacks side by side. ${stacks}. Under both, three cells: ${d.cells.join('; ')}. An arrow under them: ${d.arrow.replace(' →', '')}, from IaaS to SaaS.`;
  }
  if (key === 'modes') {
    const lines = {
      nat: 'lines run from each VM to the host, and from the host to the outside network',
      bridged: 'lines run from each VM straight to the outside network',
      internal: 'one line runs between the two VMs, and nothing reaches the host or the outside network',
      hostonly: 'lines run between the two VMs and from each VM to the host, and nothing reaches the outside network',
    };
    return `Four panels, each with a host, two VMs and the outside network. ${d.panels.map((p) => `${p.text}: ${lines[p.mode]}`).join('. ')}.`;
  }
  if (key === 'dock') {
    return `Five boxes with arrows between them. ${d.steps.map((s) => (s.text ? `${s.title} ${s.text}` : s.title)).join('. Then ')}. Under the row, a red strip: ${d.strip}`;
  }
  const hops = d.hops.map((h) => `${h.title}${h.steps ? `, with ${h.steps.map((s) => `step ${s.n}: ${s.text}`).join(' and ')}` : ''}`).join('. Then ');
  return `Four boxes with arrows between them, and numbered steps under the box each acts on. ${hops}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its02Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS02_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56 };

// One box's wrapped lines: [{ text, cls, dy }], laid out for width w.
function its02BoxLines(box, w) {
  const inner = w - ITS02_DG.pad * 2;
  const titleMax = Math.max(6, Math.floor(inner / (ITS02_DG.title * ITS02_DG.charW)));
  const textMax = Math.max(6, Math.floor(inner / (ITS02_DG.text * ITS02_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls) => { out.push({ text, cls, dy }); dy += ITS02_DG.lh; };
  its02Wrap(box.title || '', titleMax).forEach((text) => { if (text) push(text, 'its01-dg-title'); });
  if (box.text) its02Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its02BoxHeight(box, w) {
  const lines = its02BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS02_DG.lh : 0;
  return ITS02_DG.pad * 2 + used + 4;
}
function its02Box(box, x, y, w, h) {
  const cls = box.warn ? ' its02-dg-warn' : (box.hl ? ' its01-dg-hl' : '');
  const text = its02BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS02_DG.pad}" y="${y + ITS02_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its02Arrow(x1, y1, x2, y2, id, hl, both) {
  const ref = `url(#${id}${hl ? '-hl' : ''})`;
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${ref}"${both ? ` marker-start="${ref}"` : ''}/>`;
}
function its02Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its02Svg(key, layout, width, height, body) {
  const d = ITS02_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its02-dg-${key}-desc" focusable="false">${body}</svg>`;
}
function its02Badge(n, cx, cy) {
  return `<circle class="its01-dg-num" cx="${cx}" cy="${cy}" r="12"/><text class="its01-dg-num-text" x="${cx}" y="${cy + 5}" text-anchor="middle">${esc(n)}</text>`;
}
// A box of the same height as its row-mates: the tallest one sets it.
function its02RowHeight(boxes, w) { return Math.max(...boxes.map((b) => its02BoxHeight(b, w))); }

// One hypervisor stack, drawn top down: guests, then the layers from the
// top layer to the hardware. Returns { svg, h }.
function its02Stack(stack, x, y, w) {
  let body = `<text class="its01-dg-title" x="${x}" y="${y + 15}">${esc(stack.title)}</text>`;
  let top = y + 26;
  const gap = 8;
  const gw = (w - gap * (stack.guests - 1)) / stack.guests;
  const guest = { title: 'Guest VM', text: stack.guestText, hl: true };
  const gh = its02BoxHeight(guest, gw);
  for (let i = 0; i < stack.guests; i += 1) body += its02Box(guest, x + i * (gw + gap), top, gw, gh);
  top += gh + gap;
  stack.layers.slice().reverse().forEach((layer) => {
    const box = { title: layer };
    const h = its02BoxHeight(box, w);
    body += its02Box(box, x, top, w, h);
    top += h + gap;
  });
  return { svg: body, h: top - gap - y };
}

function its02CloudSvg(layout) {
  const d = ITS02_DIAGRAMS.cloud;
  const id = `its02-dg-cloud-${layout}-arrow`;
  let body = its02Markers(id);
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const x0 = wide ? 0 : 10;
  const inner = wide ? 768 : 300;
  let y = 4;
  if (wide) {
    const sw = 372;
    const stacks = d.stacks.map((s, i) => its02Stack(s, i * (sw + 24), y, sw));
    stacks.forEach((s) => { body += s.svg; });
    y += Math.max(...stacks.map((s) => s.h)) + 22;
  } else {
    d.stacks.forEach((s) => {
      const drawn = its02Stack(s, x0, y, inner);
      body += drawn.svg;
      y += drawn.h + 20;
    });
  }
  const cells = d.cells.map((text) => ({ text }));
  if (wide) {
    const cw = (inner - 24) / 3;
    const h = its02RowHeight(cells, cw);
    cells.forEach((c, i) => { body += its02Box(c, x0 + i * (cw + 12), y, cw, h); });
    y += h;
  } else {
    cells.forEach((c, i) => {
      const h = its02BoxHeight(c, inner);
      body += its02Box(c, x0, y, inner, h);
      y += h + (i < cells.length - 1 ? 8 : 0);
    });
  }
  y += 16;
  body += its02Arrow(x0 + 4, y, x0 + inner - 4, y, id, true);
  y += 20;
  body += `<text class="its01-dg-label its01-dg-label-hl" x="${x0 + inner / 2}" y="${y}" text-anchor="middle">${esc(d.arrow)}</text>`;
  return its02Svg('cloud', layout, width, y + 8, body);
}

// One network-mode panel: its words, then the outside network, the host with
// its own OS, and two VMs, with a line only where traffic can flow.
function its02ModePanel(panel, x, y, w, id) {
  const caption = { title: panel.text };
  const ch = its02BoxHeight(caption, w) - ITS02_DG.pad;
  let body = its02BoxLines(caption, w).map((line) => `<text class="its01-dg-sub" x="${x + 2}" y="${y + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  const top = y + ch;
  const outside = { x: x + 20, y: top, w: w - 40, h: 30 };
  const host = { x: x + 6, y: top + 56, w: w - 12, h: 118 };
  const os = { w: 74, h: 26 }; os.x = x + (w - os.w) / 2; os.y = host.y + 24;
  const vmW = Math.min(64, (host.w - 36) / 2);
  const vms = [0, 1].map((i) => ({ x: i ? host.x + host.w - 12 - vmW : host.x + 12, y: host.y + 74, w: vmW, h: 30 }));
  const rect = (r, cls) => `<rect class="${cls}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="8"/>`;
  const label = (text, r, dy = 0) => `<text class="its01-dg-label" x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 4 + dy}" text-anchor="middle">${esc(text)}</text>`;
  body += rect(outside, 'its01-dg-box') + label('Network / internet', outside);
  body += rect(host, 'its01-dg-band') + `<text class="its01-dg-label" x="${host.x + 8}" y="${host.y + 15}">Host</text>`;
  body += rect(os, 'its01-dg-box') + label('Host OS', os);
  vms.forEach((vm) => { body += rect(vm, 'its01-dg-box its01-dg-hl') + label('VM', vm); });
  const vmTop = (vm) => [vm.x + vm.w / 2, vm.y];
  const line = (a, b) => its02Arrow(a[0], a[1], b[0], b[1], id, true, true);
  const osBottom = [os.x + os.w / 2, os.y + os.h];
  const outBottom = (dx) => [outside.x + outside.w / 2 + dx, outside.y + outside.h];
  if (panel.mode === 'nat') {
    vms.forEach((vm) => { body += line(vmTop(vm), osBottom); });
    body += line([os.x + os.w / 2, os.y], outBottom(0));
  } else if (panel.mode === 'bridged') {
    vms.forEach((vm, i) => { body += line(vmTop(vm), outBottom(i ? 24 : -24)); });
  } else {
    body += line([vms[0].x + vms[0].w, vms[0].y + vms[0].h / 2], [vms[1].x, vms[1].y + vms[1].h / 2]);
    if (panel.mode === 'hostonly') vms.forEach((vm) => { body += line(vmTop(vm), osBottom); });
  }
  return { svg: body, h: ch + 56 + 118 };
}

function its02ModesSvg(layout) {
  const d = ITS02_DIAGRAMS.modes;
  const id = `its02-dg-modes-${layout}-arrow`;
  let body = its02Markers(id);
  if (layout === 'wide') {
    const w = 180, gap = 16;
    const drawn = d.panels.map((p, i) => its02ModePanel(p, i * (w + gap), 4, w, id));
    drawn.forEach((p) => { body += p.svg; });
    return its02Svg('modes', layout, 4 * w + 3 * gap, 4 + Math.max(...drawn.map((p) => p.h)) + 6, body);
  }
  let y = 4;
  d.panels.forEach((p) => {
    const drawn = its02ModePanel(p, 10, y, 300, id);
    body += drawn.svg;
    y += drawn.h + 22;
  });
  return its02Svg('modes', layout, 320, y - 12, body);
}

function its02DockSvg(layout) {
  const d = ITS02_DIAGRAMS.dock;
  const id = `its02-dg-dock-${layout}-arrow`;
  let body = its02Markers(id);
  const strip = { text: d.strip, warn: true };
  if (layout === 'wide') {
    const w = 136, gap = 22, width = 5 * w + 4 * gap;
    const h = its02RowHeight(d.steps, w);
    d.steps.forEach((s, i) => {
      const x = i * (w + gap);
      body += its02Box(s, x, 4, w, h);
      if (i) body += its02Arrow(x - gap + 3, 4 + h / 2, x - 3, 4 + h / 2, id);
    });
    const sh = its02BoxHeight(strip, width);
    body += its02Box(strip, 0, 4 + h + 22, width, sh);
    return its02Svg('dock', layout, width, 4 + h + 22 + sh + 4, body);
  }
  const x = 10, w = 300;
  let y = 4;
  d.steps.forEach((s, i) => {
    if (i) { body += its02Arrow(x + w / 2, y + 3, x + w / 2, y + 21, id); y += 24; }
    const h = its02BoxHeight(s, w);
    body += its02Box(s, x, y, w, h);
    y += h;
  });
  y += 20;
  const sh = its02BoxHeight(strip, w);
  body += its02Box(strip, x, y, w, sh);
  return its02Svg('dock', layout, 320, y + sh + 4, body);
}

// A numbered fix step: a badge beside a highlighted box.
function its02PrintStep(step, x, y, w) {
  const box = { text: step.text, hl: true };
  const h = its02BoxHeight(box, w - 30);
  return { svg: `${its02Badge(step.n, x + 12, y + h / 2)}${its02Box(box, x + 30, y, w - 30, h)}`, h };
}

function its02PrintSvg(layout) {
  const d = ITS02_DIAGRAMS.print;
  const id = `its02-dg-print-${layout}-arrow`;
  let body = its02Markers(id);
  if (layout === 'wide') {
    const w = 174, gap = 24, width = 4 * w + 3 * gap;
    const h = its02RowHeight(d.hops, w);
    let bottom = 4 + h;
    d.hops.forEach((hop, i) => {
      const x = i * (w + gap);
      body += its02Box(hop, x, 4, w, h);
      if (i) body += its02Arrow(x - gap + 3, 4 + h / 2, x - 3, 4 + h / 2, id);
      let y = 4 + h + 18;
      (hop.steps || []).forEach((step) => {
        const drawn = its02PrintStep(step, x, y, w);
        body += drawn.svg;
        y += drawn.h + 10;
      });
      bottom = Math.max(bottom, y - 10);
    });
    return its02Svg('print', layout, width, bottom + 6, body);
  }
  const x = 10, w = 300;
  let y = 4;
  d.hops.forEach((hop, i) => {
    if (i) { body += its02Arrow(x + w / 2, y + 3, x + w / 2, y + 21, id); y += 24; }
    const h = its02BoxHeight(hop, w);
    body += its02Box(hop, x, y, w, h);
    y += h;
    (hop.steps || []).forEach((step) => {
      y += 10;
      const drawn = its02PrintStep(step, x + 16, y, w - 16);
      body += drawn.svg;
      y += drawn.h;
    });
  });
  return its02Svg('print', layout, 320, y + 6, body);
}

const ITS02_DIAGRAM_DRAW = { cloud: its02CloudSvg, modes: its02ModesSvg, dock: its02DockSvg, print: its02PrintSvg };

function its02Diagram(key) {
  const d = ITS02_DIAGRAMS[key];
  const draw = ITS02_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its02-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its02-dg-${esc(key)}-desc">${esc(its02DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its02Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its02-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function its02Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its02Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its02Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its02Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its02Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its02Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its02Table(block.table);
    if (block.diagram) return its02Diagram(block.diagram);
    if (block.cardsort) return its02CardSort();
    if (block.check) return its02Check(block.check);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its02LessonCard(lesson) {
  return `<details class="its01-lesson" data-its02-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its02Blocks(lesson.blocks)}
      ${lesson.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------- Card sort and the two checks */

/* Picks live in page memory only (a reload starts again), by the choice's
 * place in the data, never its place on screen. Only "complete" and its time
 * are saved to the account, never a pick or a score. Nothing here is a lab
 * attempt or gates anything.
 *   its02SortPicks: { cardId: [every box picked, in order] }.
 *   its02CheckAnswers[key]: { questionIndex: the first pick }, the one that counts.
 *   its02CheckPicks[key]: { questionIndex: [every pick, in order] }.
 * The card sort is complete once every card is in its box. The Lesson 4.2
 * check is complete once every question has a first answer, right or wrong.
 * The A+ check is complete when 70% or more of the first answers are right
 * (5 of 7), as on Modules 1 to 3. */
const ITS02_LETTERS = ['A', 'B', 'C', 'D'];
const ITS02_CHECK_PASS_TENTHS = 7;
// Each check's saved fields and its rule for "complete".
const ITS02_CHECK_RULES = {
  build: { done: 'buildCheckCompleted', at: 'buildCheckCompletedAt', needsPass: false },
  aplus: { done: 'aplusCheckCompleted', at: 'aplusCheckCompletedAt', needsPass: true },
};
let its02SortPicks = {};
let its02CheckAnswers = { build: {}, aplus: {} };
let its02CheckPicks = { build: {}, aplus: {} };
let its02SaveFailed = { sort: false, build: false, aplus: false };
let its02PicksUser = null;

function its02ResetPicks() {
  its02SortPicks = {};
  its02CheckAnswers = { build: {}, aplus: {} };
  its02CheckPicks = { build: {}, aplus: {} };
  its02SaveFailed = { sort: false, build: false, aplus: false };
}

function its02Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// The order a student sees a question's choices in: shuffled from their
// anonymous id and the question, so it differs between students and stays the
// same for one student on every redraw and reload.
function its02ChoiceOrder(key, index) {
  const question = ITS02_CHECKS[key].questions[index];
  const seed = `${its02User ? LabRuntime.anonymousStudentId(its02User) : ''}|its-02|${key}|${index}`;
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

function its02CheckDone(key) {
  return ITS02_CHECKS[key].questions.every((_, i) => Object.prototype.hasOwnProperty.call(its02CheckAnswers[key], i));
}
// Whole numbers only, so 4.9 of 7 can never round up to a pass.
function its02CheckPassed(key) {
  if (!ITS02_CHECK_RULES[key].needsPass) return true;
  const questions = ITS02_CHECKS[key].questions;
  const right = questions.filter((question, i) => its02CheckAnswers[key][i] === question.answer).length;
  return right * 10 >= questions.length * ITS02_CHECK_PASS_TENTHS;
}
function its02CheckCompleted(key) {
  return Boolean(its02State && its02State[ITS02_CHECK_RULES[key].done] === true);
}
function its02SortDone() {
  return ITS02_CARD_SORT.cards.every((card) => (its02SortPicks[card.id] || []).includes(card.answer));
}
function its02SortCompleted() {
  return Boolean(its02State && its02State.cardSortCompleted === true);
}

function its02CheckQuestion(key, question, index) {
  const picks = its02CheckPicks[key][index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  const qid = `its02-${key}-q${index}`;
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer.
  const choices = its02ChoiceOrder(key, index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its02-answer="${key}" data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS02_LETTERS[place]}</span> ${esc(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${esc(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="${qid}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="${qid}">${choices}</div>
    <div class="its01-check-feedback" id="${qid}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line under a check or the card sort: a completion the account
// didn't save asks to try the save again; a failed full pass asks for a
// retake (no score shown); otherwise a saved completion shows with its date.
function its02Footer(key, opts) {
  const reset = opts.anyAnswered ? `<button type="button" class="its01-check-reset" data-its02-reset="${key}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  const retry = opts.saveFailed ? `<button type="button" class="its01-check-reset" data-its02-retry="${key}"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>` : '';
  let status = '';
  if (opts.saveFailed) status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  else if (opts.retake) status = esc(opts.retake);
  else if (opts.completed) {
    const day = its02Day(opts.completedAt);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(opts.title)} complete${day ? ` (${esc(day)})` : ''}. You can do it again any time.`;
  }
  return `<div class="its01-check-footer" data-its02-footer="${key}"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its02Check(key) {
  const check = ITS02_CHECKS[key];
  const rule = ITS02_CHECK_RULES[key];
  const footer = its02Footer(key, {
    title: check.title,
    anyAnswered: Object.keys(its02CheckAnswers[key]).length > 0,
    saveFailed: its02SaveFailed[key] && its02CheckDone(key) && its02CheckPassed(key),
    retake: its02CheckDone(key) && !its02CheckPassed(key) ? 'Retake: you need 5 of 7. Press Start again to retake the check.' : '',
    completed: its02CheckCompleted(key),
    completedAt: its02State && its02State[rule.at],
  });
  return `<div class="its01-check" data-its02-check="${key}" id="its02-check-${key}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its02CheckQuestion(key, question, i)).join('')}</ol>
    ${footer}
  </div>`;
}

// The cloud models card sort: one row of box buttons under each card. A
// wrong box says why and the student picks again; the right box says why and
// the card is settled. Feedback only, no score.
function its02SortCard(card) {
  const picks = its02SortPicks[card.id] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(card.answer);
  const lid = `its02-sort-${card.id}`;
  const buttons = ITS02_CARD_SORT.buckets.map((bucket) => {
    const picked = picks.includes(bucket);
    const cls = picked ? (bucket === card.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice its02-sort-box${cls}" data-its02-sort="${esc(card.id)}" data-bucket="${esc(bucket)}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}>${esc(bucket)}</button>`;
  }).join('');
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Right box: ${esc(card.answer)}.</strong></p><p class="its01-check-why">${esc(card.why)}</p>`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not this box.</strong> Try another.</p><p class="its01-check-why">${esc(card.ifWrong[last] || '')}</p>`;
  return `<li class="its02-sort-card">
    <p class="its01-check-prompt" id="${lid}">${esc(card.label)}</p>
    <div class="its02-sort-boxes" role="group" aria-labelledby="${lid}">${buttons}</div>
    <div class="its01-check-feedback" id="${lid}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

function its02CardSort() {
  const footer = its02Footer('sort', {
    title: ITS02_CARD_SORT.title,
    anyAnswered: Object.keys(its02SortPicks).length > 0,
    saveFailed: its02SaveFailed.sort && its02SortDone(),
    completed: its02SortCompleted(),
    completedAt: its02State && its02State.cardSortCompletedAt,
  });
  return `<div class="its01-check its02-sort" data-its02-cardsort id="its02-cardsort">
    <h3>${esc(ITS02_CARD_SORT.title)}</h3>
    <p class="its01-instruction">${esc(ITS02_CARD_SORT.intro)}</p>
    <ul class="its02-sort-list">${ITS02_CARD_SORT.cards.map(its02SortCard).join('')}</ul>
    ${footer}
  </div>`;
}

function its02Lessons() {
  return `<div class="its01-lesson-grid">${ITS02_LESSONS.map(its02LessonCard).join('')}</div>`;
}

/* ---------- Labs 4.1 to 4.3: a coach in the simulator ---------- */

// The coach's Start button, its notice and the lab's status line.
function its02CoachLaunch(coachId) {
  const lab = ITS02_COACH_LABS[coachId];
  const button = itsWalkthroughButton(its02User, [lab.labKey]);
  return `<a class="itsw-evidence-button" data-its02-console-launch="${esc(coachId)}" href="${esc(itsCoachLaunchHref(coachId, its02User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: esc(lab.start) }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its02User, coachId, [lab.labKey], lab.start, ITS02_COACH_INCOMPLETE)}`;
}
// Upload boxes from before the simulator lab: shown open only to a student
// who already picked files or whose upload was returned.
function its02OlderEvidence(labKey, tiles) {
  const lab = ITS02_EVIDENCE_LABS[labKey];
  const open = itsEvidenceRedo(its02User, its02State, labKey, lab.fields).returned || lab.fields.some((field) => Boolean(its02State[field]));
  return `<details class="its02-older-evidence"${open ? ' open' : ''}><summary>Started this lab before the simulator version? Upload your evidence instead</summary>${tiles}</details>`;
}

function its02Lab21() {
  return `<section class="its01-section its01-lab-section" id="its02-lab-2-1" aria-labelledby="its02-lab-2-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its02-lab-2-1-title">Lab 4.1 · Guided Lab: build a Windows client VM (checked, not graded)</h2></div></div>
    <p class="its01-instruction">In the simulator, build a Windows 11 client VM on a simulated host: 4 GB of memory, 2 CPU cores, a 64 GB dynamically allocated disk and NAT networking, then start it. The VM is simulated: nothing is installed on your computer, and it isn’t a real Windows installation. Your VMs are saved to your account.</p>
    ${its02CoachLaunch('hd-m02-vm')}
    ${itsLabSubmitted(its02User, ITS02_LAB21_KEY) ? '' : its02OlderEvidence(ITS02_LAB21_KEY, `<div class="its02-evidence-grid" id="its02-lab21-grid">
      ${itswEvidenceTile({ id: 'its02-ev-desktop', user: its02User, field: 'evDesktop', hint: 'A screenshot of the completed Windows desktop.', file: its02State.evDesktop })}
      ${itswEvidenceTile({ id: 'its02-ev-vmsettings', user: its02User, field: 'evVmSettings', hint: 'A screenshot of VirtualBox’s Settings pane showing RAM, CPU, disk, and network mode.', file: its02State.evVmSettings })}
    </div>`)}
    ${its02EvidenceStatus(ITS02_LAB21_KEY)}
    ${its02EvidenceRedoHtml(ITS02_LAB21_KEY)}
  </section>`;
}

function its02Lab22() {
  return `<section class="its01-section its01-lab-section" id="its02-lab-2-2" aria-labelledby="its02-lab-2-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its02-lab-2-2-title">Lab 4.2 · Guided Lab: snapshot, server and a virtual desktop (checked, not graded)</h2></div></div>
    <p class="its01-instruction">In the simulator, snapshot the client VM you built in Lab 4.1, undo a change with it, build a Windows Server VM, put both on an Internal network and ping both ways. Then help a user whose virtual desktop is stuck.</p>
    ${its02CoachLaunch('hd-m02-server')}
    ${itsLabSubmitted(its02User, ITS02_LAB22_KEY) ? '' : its02OlderEvidence(ITS02_LAB22_KEY, `<div class="its02-evidence-grid its02-evidence-grid-3" id="its02-lab22-grid">
      ${itswEvidenceTile({ id: 'its02-ev-snapshot', user: its02User, field: 'evSnapshot', hint: 'A screenshot of the snapshot list showing "Clean Install."', file: its02State.evSnapshot })}
      ${itswEvidenceTile({ id: 'its02-ev-ping1', user: its02User, field: 'evPing1', hint: 'A screenshot of a successful ping from the client VM to the server VM.', file: its02State.evPing1 })}
      ${itswEvidenceTile({ id: 'its02-ev-ping2', user: its02User, field: 'evPing2', hint: 'A screenshot of a successful ping from the server VM to the client VM.', file: its02State.evPing2 })}
    </div>`)}
    ${its02EvidenceStatus(ITS02_LAB22_KEY)}
    ${its02EvidenceRedoHtml(ITS02_LAB22_KEY)}
  </section>`;
}

// Status line, plus the Submit button once every file is added (or after a
// failed save). A submitted lab shows only its status line (and, on the page
// load that submitted it, the uploaded files): its files are stored with the
// attempt for the instructor, and this page doesn't load them back.
function its02EvidenceStatus(labKey) {
  const lab = ITS02_EVIDENCE_LABS[labKey];
  const ready = its02EvidenceReady(labKey);
  const canSubmit = ready && itsLabStatus(its02User, labKey) === 'not_submitted' && !itsLabSubmitting(its02User, labKey);
  return `${itsLabStatusHtml(its02User, labKey, { label: lab.label, prefix: 'its01', pendingText: lab.pendingText, ready })}
    ${canSubmit ? itsSubmitButton(labKey, lab.label) : ''}
    ${itsUploadedEvidenceHtml(its02User, labKey)}`;
}

// Re-render one evidence lab's whole section (tiles, status, Resubmit).
function its02RenderEvidenceLab(labKey) {
  const section = document.getElementById(labKey === ITS02_LAB21_KEY ? 'its02-lab-2-1' : 'its02-lab-2-2');
  if (section) section.outerHTML = labKey === ITS02_LAB21_KEY ? its02Lab21() : its02Lab22();
}

function its02EvidenceAttemptFields(labKey) {
  return { state: 'complete', score: 100, result: { evidence: ITS02_EVIDENCE_LABS[labKey].fields.length } };
}

// Adding a file never submits: the student presses Submit Lab 2.x.
function its02AddEvidence(inputId, picked) {
  const field = ITS02_EVIDENCE_FIELD_BY_INPUT[inputId];
  if (!field || !picked || !its02State) return;
  const labKey = Object.keys(ITS02_EVIDENCE_LABS).find((key) => ITS02_EVIDENCE_LABS[key].fields.includes(field));
  // A refused pick empties the field (see itswTakeEvidence).
  its02State[field] = itswTakeEvidence(its02User, field, picked, its02State[field], labKey);
  its02Save();
  its02RenderEvidenceLab(labKey);
}

// The Submit button: the lab's first submission, once every file is added.
function its02SubmitLab(labKey) {
  if (!ITS02_EVIDENCE_LABS[labKey] || !its02State || !its02EvidenceReady(labKey)) return Promise.resolve(false);
  return itsSubmitEvidenceLab(its02User, 'its-02', labKey, its02EvidenceAttemptFields(labKey), ITS02_EVIDENCE_LABS[labKey].fields, () => {
    its02RenderEvidenceLab(labKey);
    its02RenderHeroStatus();
  }).then((saved) => {
    if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', labKey);
    return saved;
  });
}

// The Resubmit button: one new attempt, only for a returned lab whose
// evidence changed since the return.
function its02ResubmitLab(labKey) {
  const lab = ITS02_EVIDENCE_LABS[labKey];
  if (!lab || !its02State) return Promise.resolve(false);
  const redo = itsEvidenceRedo(its02User, its02State, labKey, lab.fields);
  if (!redo.returned || !redo.allPresent || !redo.changed) return Promise.resolve(false);
  return itsSubmitLabAttempt(its02User, 'its-02', labKey, its02EvidenceAttemptFields(labKey), lab.fields).then((saved) => {
    if (!saved) return false;
    delete its02State.redoBaseline[labKey];
    its02Save();
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', labKey);
    its02RenderEvidenceLab(labKey);
    its02RenderHeroStatus();
    return true;
  });
}

/* ---------- Lab 4.3 (coach hd-m02) and Lab 4.4 (practice tickets) ---------- */

function its02Lab34() {
  return `<section class="its01-section its01-lab-section" id="its02-lab-2-3" aria-labelledby="its02-lab-2-3-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its02-lab-2-3-title">${esc(itsLabTitle(ITS02_LAB23_KEY))}</h2></div></div>
    <p class="its01-instruction">Work one printer ticket end to end in the IT Service Desk simulator: check the queue, clear a stuck job in the right order, put the printer back online and test it. Then add a label printer by its address, fix a webcam with a driver rollback and set up two monitors on a dock. A coach spotlights each step for you. Practice: not graded. Feedback only, no score.</p>
    ${its02CoachLaunch('hd-m02')}
    ${itsLabStatusHtml(its02User, ITS02_LAB23_KEY, { label: 'Lab 4.3', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its02User, [{ key: ITS02_LAB23_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>
  <section class="its01-section its01-lab-section" id="its02-lab-2-4" aria-labelledby="its02-lab-2-4-title">
    <div class="its01-section-heading"><span>4</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its02-lab-2-4-title">${esc(itsLabTitle(ITS02_LAB24_KEY))}</h2></div></div>
    <p class="its01-instruction">Work four tickets on your own: dead monitors on a dock, a laptop battery that may be swelling, a badge printer with a guest waiting, and a virtual desktop stuck on a black screen. Set each ticket’s fields, search the knowledge base, and press Check my work on a ticket for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all four tickets; the simulator then tells this page, and your account records that you completed Lab 4.4.</p>
    <a class="itsw-evidence-button" data-its02-practice-launch href="${esc(its02PracticeHref(its02User))}" target="_blank" rel="opener"><i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets</a>
    ${itsLabStatusHtml(its02User, ITS02_LAB24_KEY, { label: 'Lab 4.4', prefix: 'its01', pendingText: 'Finish all four tickets in the simulator to complete this lab.' })}
  </section>`;
}

// Module 4's Prove It, on Module 3's pattern before its Prove It shipped:
// the card shows "Opens soon" and launches nothing. The simulator shift, the
// scoring and the gating row come with the Prove It part.
function its02Prove() {
  return `<section class="its01-section its01-lab-section" id="its02-prove-it" aria-labelledby="its02-prove-it-title">
    <div class="its01-section-heading"><span>5</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its02-prove-it-title">${esc(itsLabTitle(ITS02_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new hardware ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-lab-status its01-status-pending" data-its02-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 4.3 and 4.4 first.</p>
  </section>`;
}
// The practice set opens in its own saved shift (?practice=its-02), named by
// the anonymous student id, never the email.
function its02PracticeHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-02&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}

/* The rail. The lessons, the five labs and the A+ check count toward the
 * module's percent (shown only; it saves nothing); Sources doesn't. The A+
 * check comes last, so it never locks a lab (moduleNavStatuses locks only
 * rows after an unfinished one), and neverLocked keeps it and the Prove It
 * open. The card sort and the Lesson 4.2 check sit inside their lessons and
 * show their own saved status there. */
function its02NavSections(user) {
  return [
    { id: 'lessons', title: 'Foundation lessons', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its02-lessons' },
    { id: 'client-vm', title: 'Build the client VM', type: 'lab', ...itsLabRail(user, [ITS02_LAB21_KEY]), scrollId: 'its02-lab-2-1' },
    { id: 'recovery', title: 'Snapshot and recovery', type: 'lab', ...itsLabRail(user, [ITS02_LAB22_KEY]), scrollId: 'its02-lab-2-2' },
    { id: 'service-desk', title: 'Printers and peripherals', type: 'lab', ...itsLabRail(user, [ITS02_LAB23_KEY]), scrollId: 'its02-lab-2-3' },
    { id: 'practice', title: 'Practice tickets', type: 'lab', ...itsLabRail(user, [ITS02_LAB24_KEY]), scrollId: 'its02-lab-2-4' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS02_PROVE_KEY]), scrollId: 'its02-prove-it' },
    { id: 'learn-check', title: 'A+ check', type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its02CheckCompleted('aplus'), scrollId: 'its02-checks' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its02-sources', gated: false, supplemental: true },
  ];
}
function its02Rail(user) {
  return moduleProgressShell(its02NavSections(user), { moduleKey: 'its02', stageKey: 'its-02' });
}

function its02Learn() {
  return `<section class="its01-section" id="its02-lessons" aria-labelledby="its02-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its02-lessons-title">Four lessons</h2></div></div>
    <p class="its01-instruction">Four lessons hold the three readings: Reading 1 and the cloud models card sort in Lesson 4.1; what to know before you build, your first commands and a short check in Lesson 4.2; Reading 2 in Lesson 4.3; Reading 3 in Lesson 4.4. Open each lesson, then take the A+ check below.</p>
    ${its02Lessons()}
  </section>`;
}

function its02Checks() {
  return `<section class="its01-section" id="its02-checks" aria-labelledby="its02-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · Lesson 4.4 · not graded</p><h2 id="its02-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor.</p>
    ${its02Check('aplus')}
  </section>`;
}

function viewItsModuleTwo(user, program) {
  its02Load(user);
  const module = program.modules['its-02'];
  return `<div class="its02-shell">
    ${moduleTopbar(user, program)}
    ${its02Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its02-title"><div><p class="its01-kicker">Module 04 · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its02-title">${esc(module.title)}</h1><p class="its01-lede">${esc(ITS02_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>3</dd></div><div><dt>Labs</dt><dd id="its02-status">${itsLabCounterText(user, ITS02_ALL_LAB_KEYS)}</dd></div></dl></section>

      ${its02Learn()}
      ${its02Checks()}
      ${its02Lab21()}
      ${its02Lab22()}
      ${its02Lab34()}
      ${its02Prove()}

      <section class="its01-section" id="its02-sources" aria-labelledby="its02-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its02-sources-title">Sources &amp; Further Reading</h2></div></div>${moduleSourcesBlock(ITS02_SOURCES)}</section>
    </main>
  </div>`;
}

function its02RenderHeroStatus() {
  const status = document.getElementById('its02-status');
  if (status) status.textContent = itsLabCounterText(its02User, ITS02_ALL_LAB_KEYS);
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its02RefreshRail() {
  const rail = document.querySelector('.its02-shell [data-mquick-nav-rail]');
  if (!rail || !its02User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its02Rail(its02User);
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

// Redraws one activity ('sort', 'build' or 'aplus') in place; a lesson that
// holds it stays open. focusId: the feedback element to move focus to.
function its02RenderActivity(key, focusId) {
  const selector = key === 'sort' ? '[data-its02-cardsort]' : `[data-its02-check="${key}"]`;
  const el = document.querySelector(`.its02-shell ${selector}`);
  if (el) el.outerHTML = key === 'sort' ? its02CardSort() : its02Check(key);
  if (focusId) {
    const target = document.getElementById(focusId);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its02RefreshRail();
}

function its02FocusStatus(key) {
  const status = document.querySelector(`.its02-shell [data-its02-footer="${key}"] .its01-check-status`);
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

/* -------------------------------------------------------------- Actions */

// The saved fields of an activity: the card sort's, or a check's.
function its02DoneFields(key) {
  return key === 'sort' ? { done: 'cardSortCompleted', at: 'cardSortCompletedAt' } : ITS02_CHECK_RULES[key];
}
function its02ActivityReady(key) {
  return key === 'sort' ? its02SortDone() : its02CheckDone(key) && its02CheckPassed(key);
}

// Ticks the activity and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render
// reloads its02State, so it's matched by its time, not by object). The untick
// is saved the same way, so this page, this browser's copy and the session's
// copy of the row agree.
function its02SaveDone(key) {
  const fields = its02DoneFields(key);
  const userId = its02User && its02User.userId;
  const at = new Date().toISOString();
  its02State[fields.done] = true;
  its02State[fields.at] = at;
  its02SaveFailed[key] = false;
  its02Save((ok) => {
    const state = its02State;
    if (ok !== false || !state || !its02User || its02User.userId !== userId || state[fields.at] !== at) return;
    state[fields.done] = false;
    state[fields.at] = null;
    its02SaveFailed[key] = true;
    its02Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector(`.its02-shell [data-its02-footer="${key}"]`);
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its02RenderActivity(key);
    if (focusInFooter) its02FocusStatus(key);
  });
}

// One pick on one check question. Saved as complete the first time the rule
// for that check is met.
function its02Answer(key, index, choice) {
  const check = ITS02_CHECKS[key];
  const question = check && check.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its02CheckPicks[key][index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its02CheckPicks[key][index] = picks.concat(choice);
  if (its02CheckAnswers[key][index] === undefined) its02CheckAnswers[key][index] = choice;
  if (its02State && its02ActivityReady(key) && !its02CheckCompleted(key)) its02SaveDone(key);
  its02RenderActivity(key, `its02-${key}-q${index}-feedback`);
}

// One box picked for one card in the card sort.
function its02Sort(cardId, bucket) {
  const card = ITS02_CARD_SORT.cards.find((c) => c.id === cardId);
  if (!card || !ITS02_CARD_SORT.buckets.includes(bucket)) return;
  const picks = its02SortPicks[cardId] || [];
  if (picks.includes(card.answer) || picks.includes(bucket)) return;
  its02SortPicks[cardId] = picks.concat(bucket);
  if (its02State && its02SortDone() && !its02SortCompleted()) its02SaveDone('sort');
  its02RenderActivity('sort', `its02-sort-${cardId}-feedback`);
}

// Try again: the picks are still in page memory, so save the completion again.
function its02RetrySave(key) {
  if (!its02SaveFailed[key] || !its02State || !its02ActivityReady(key)) return;
  its02SaveDone(key);
  its02RenderActivity(key);
  its02FocusStatus(key);
}

function its02ResetActivity(key) {
  if (key === 'sort') its02SortPicks = {};
  else { its02CheckAnswers[key] = {}; its02CheckPicks[key] = {}; }
  its02SaveFailed[key] = false;
  its02RenderActivity(key);
  const selector = key === 'sort' ? '[data-its02-cardsort] [data-its02-sort]' : `[data-its02-check="${key}"] [data-its02-answer]`;
  const first = document.querySelector(`.its02-shell ${selector}`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleTwoLab() {
  const shell = document.querySelector('.its02-shell');
  if (!shell || !its02State) return;

  shell.addEventListener('change', (event) => {
    const evidenceInput = event.target.closest('[data-itsw-evidence-input]');
    if (evidenceInput) {
      const file = itswReadEvidenceFile(evidenceInput);
      if (!file) return;
      const id = evidenceInput.dataset.itswEvidenceInput;
      its02AddEvidence(id, file);
    }
  });

  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its02-answer]');
    if (answer) {
      if (!answer.disabled) its02Answer(answer.dataset.its02Answer, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const sort = event.target.closest('[data-its02-sort]');
    if (sort) {
      if (!sort.disabled) its02Sort(sort.dataset.its02Sort, sort.dataset.bucket);
      return;
    }
    const reset = event.target.closest('[data-its02-reset]');
    if (reset) {
      its02ResetActivity(reset.dataset.its02Reset);
      return;
    }
    const retry = event.target.closest('[data-its02-retry]');
    if (retry) {
      its02RetrySave(retry.dataset.its02Retry);
      return;
    }
    const submit = event.target.closest('[data-its-submit]');
    if (submit) {
      its02SubmitLab(submit.dataset.itsSubmit);
      return;
    }
    const resubmit = event.target.closest('[data-its-resubmit]');
    if (resubmit && !resubmit.disabled) {
      its02ResubmitLab(resubmit.dataset.itsResubmit);
      return;
    }
    const launch = event.target.closest('[data-its02-console-launch]');
    if (launch) {
      const coachId = ITS02_COACH_LABS[launch.dataset.its02ConsoleLaunch] ? launch.dataset.its02ConsoleLaunch : 'hd-m02';
      const lab = ITS02_COACH_LABS[coachId];
      if (itsLaunchWalkthrough(event, launch, its02User, coachId)) {
        its02State.consoleStarted = true;
        its02Save();
      }
      itsRefreshWalkthroughNotice(its02User, coachId, [lab.labKey], lab.start, ITS02_COACH_INCOMPLETE);
    }
  });
}

// Each lab's finished work, read from the cleaned snapshot
// (itsCleanCoachWork). The coach shows Finish only after its last check, but
// an old tab could still send a message. Checked, not graded: no score.
const ITS02_VM_TARGET = { image: 'win11', memoryGb: 4, cores: 2, diskGb: 64, diskType: 'dynamic' };
function its02VmIn(work, name) { return work && work.vm && Array.isArray(work.vm.vms) ? work.vm.vms.find((vm) => vm.name.toLowerCase() === name.toLowerCase()) || null : null; }
function its02TicketIn(work, id) { return work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === id) || null : null; }
const ITS02_LAB_DONE = {
  'hd-m02-vm': (work) => {
    const vm = its02VmIn(work, 'NS-TEST-W11');
    return Boolean(vm) && vm.installed && Object.keys(ITS02_VM_TARGET).every((key) => vm[key] === ITS02_VM_TARGET[key]);
  },
  'hd-m02-server': (work) => {
    const client = its02VmIn(work, 'NS-TEST-W11'); const server = its02VmIn(work, 'NS-TEST-SRV'); const ticket = its02TicketIn(work, 'HD-2173');
    return Boolean(client && server && ticket) && client.snapshots.length > 0 && client.restored > 0 && server.installed && server.image === 'winsrv'
      && client.pings.some((p) => p.ok && p.to === '10.0.5.10') && server.pings.some((p) => p.ok && p.to === '10.0.5.20') && ticket.status === 'Resolved';
  },
  // The coach checks the printer, camera and dock steps in order before
  // Finish; the saved work keeps no action list, so the page checks the end.
  'hd-m02': (work) => { const ticket = its02TicketIn(work, 'HD-2134'); return Boolean(ticket) && ticket.status === 'Resolved'; },
};

async function its02ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || !ITS02_COACH_LABS[event.data.id]) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const coachId = event.data.id;
  const lab = ITS02_COACH_LABS[coachId];
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work, coachId);
  const coachKey = `${user.userId}|${coachId}`;
  if (!ITS02_LAB_DONE[coachId](work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, coachId, [lab.labKey], lab.start, ITS02_COACH_INCOMPLETE);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: the lab counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-02', [lab.labKey], work);
  its02User = user;
  if (received) {
    const saved = LabRuntime.load(ITS02_LAB_ID, user, ITS02_DEFAULT_STATE);
    saved.consoleStarted = true;
    if (coachId === 'hd-m02') saved.consoleCompleted = true;
    LabRuntime.save(ITS02_LAB_ID, user, saved);
    its02State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-02', lab.labKey);
  }
  itsConfirmCoachReceipt(event, received);

  const mounted = Boolean(document.querySelector('.its02-shell'));
  if (!mounted) return;
  render();
  const section = document.getElementById(lab.section);
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 4.4's completion: the practice set says its four tickets are done
// (ui/helpdesk.js hdPracticeReport). Saved once, as a lab attempt with no
// score and no answers, the way Module 3's Lab 3.2 is.
const ITS02_PRACTICE_LOCK_MS = 15000;
function its02StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its02StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its02StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }
async function its02ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-02') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-02', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS02_PRACTICE_TICKETS.length || !ITS02_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  if (itsLabSubmitted(user, ITS02_LAB24_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS02_LAB24_KEY)) { reply(false, 'busy'); return; }
  // Lab 4.4 still gates completion until the Prove It part moves the gate,
  // so the database allows one waiting attempt; another tab in this browser
  // may be saving right now (the lock).
  const lock = `mnt.practice-save.${user.userId}.${ITS02_LAB24_KEY}`;
  const held = Number(its02StorageGet(lock)) || 0;
  if (Date.now() - held < ITS02_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its02StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    saved = await itsSubmitLabAttempt(user, 'its-02', ITS02_LAB24_KEY, {
      state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-02', tickets: ITS02_PRACTICE_TICKETS.slice() },
    });
  } finally {
    its02StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-02', ITS02_LAB24_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its02User = user;
  if (document.querySelector('.its02-shell')) render();
}

function its02OnMessage(event) {
  return Promise.all([
    itsVmReceiveMessage(event, { moduleKey: 'its-02', stateId: ITS02_VM_STATE_ID }),
    its02ReceiveCoachCompletion(event),
    its02ReceivePracticeCompletion(event),
  ]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 4, moduleKey: 'its-02',
  view: viewItsModuleTwo, wire: wireItsModuleTwoLab, onMessage: its02OnMessage,
});

/* Module 04 (key its-02; was Module 02 before the 2026-11 reorder) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional scenarios only. From 2026-11-23 every lab runs in the IT Service
 * Desk simulator (ui/helpdesk.js + ui/coach.js): Lab 4.1 (coach hd-m02-vm)
 * and Lab 4.2 (hd-m02-server) build simulated VMs, checked and not graded;
 * Lab 4.3 (hd-m02) works one printer and peripherals ticket; Lab 4.4 is the
 * practice set ?practice=its-02. Earlier evidence uploads for Labs 4.1 and
 * 4.2 still open. The lesson text is still the older content (sourced from
 * Module_2_Student_Content.docx) until the page part rebuilds this file.
 */

const ITS02_SOURCES = [
  { title: 'Hyper-V technology overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/hyper-v-technology-overview', note: 'Official reference for the virtualization concepts and VM-building lab in this module.' },
];

const ITS02_LESSONS = [
  {
    id: 'its-02-lesson-01', number: '4.1', icon: 'ri-cpu-line',
    title: 'Virtualization Fundamentals & Building Your First VM', minutes: 240,
    learn: [
      'What virtualization is, and why IT support teams rely on it constantly',
      'The difference between the host machine and a guest VM, and what resources a VM actually uses',
      'How to install VirtualBox and build a Windows virtual machine from the ground up',
      'How to choose the right network mode for a VM depending on what you\'re trying to do',
    ],
    topics: [
      { heading: 'What a Virtual Machine Actually Is', body: 'A hypervisor — Oracle VirtualBox — lets one physical computer (the host) run other, fully independent computers (guests) inside it. Real IT teams use virtualization to test updates safely, run older tools, and give technicians disposable environments where breaking something on purpose is completely safe.' },
      { heading: 'Getting the Resources Right', body: 'Aim for at least 4GB RAM and 2 CPU cores, with a 64GB virtual hard disk set to "dynamically allocated" — it starts small and only grows as you actually use the space. Too little starves Windows; too much starves your real laptop.' },
      { heading: 'Choosing a Network Mode', body: 'NAT is the simplest option — your VM shares your host\'s internet connection — and is the default for almost everything in this program. Bridged (the VM appears as its own device) and Host-Only (the VM only talks to the host) come later for specific exercises.' },
      { heading: 'Installing From an ISO', body: 'An ISO file is an entire OS installer packed into a single disk-image file. Mounting it to your VM\'s virtual optical drive is the same idea as putting a DVD into a drive that isn\'t physically there.' },
    ],
    practice: [
      'Install Oracle VirtualBox (and the Extension Pack) on your machine.',
      'Create a new VM, allocate 4GB RAM and 2 CPU cores, and create a 64GB dynamically-allocated virtual disk.',
      'Set the network adapter to NAT.',
      'Mount the provided Windows 11 ISO and run through the installation.',
      'Complete setup with a local account (not a Microsoft account), per your lab environment\'s policy.',
      'Once you reach a working desktop, take a screenshot — you\'ll need it for your lab.',
    ],
    comingUp: 'Submit proof of your working VM build as your first hands-on evidence in this program.',
  },
  {
    id: 'its-02-lesson-02', number: '4.2', icon: 'ri-history-line',
    title: 'VM Snapshots, Recovery & Building a Server Environment', minutes: 240,
    learn: [
      'How to take and restore a VirtualBox snapshot',
      'Why snapshots are one of the most important habits in any hands-on IT lab',
      'How to build a second VM running Windows Server, alongside your existing client VM',
      'How to connect two VMs so they can talk to each other over a virtual network',
      'How to recognize and fix the most common VM resource problems',
    ],
    topics: [
      { heading: 'Snapshots: Your Undo Button', body: 'A snapshot captures your VM\'s disk, memory, and settings at a single point in time. The habit: take a snapshot before any risky change, every time — snapshots are not a backup strategy, they\'re an intentional pre-change checkpoint.' },
      { heading: 'Why You\'re Also Building a Server', body: 'Real organizations run client machines alongside server machines that manage accounts, files, and network resources for everyone. Building a Windows Server VM now sets up the exact environment you\'ll need for Active Directory and identity-management lessons later in this program.' },
      { heading: 'Getting Your VMs Talking to Each Other', body: 'By default your VMs can\'t see each other. Switching both to an "Internal Network" (or a "NAT Network") lets them communicate — confirmed with a ping in both directions — which is what later makes it possible for your client VM to join your server VM\'s domain.' },
      { heading: 'When a VM Won\'t Cooperate', body: 'The two most common problems: your host running out of free memory (lower the VM\'s assigned RAM, or free up host memory), and a painfully slow VM because your CPU\'s virtualization extensions aren\'t enabled in BIOS/UEFI (enable them).' },
    ],
    practice: [
      'Take a snapshot of your client VM and name it "Clean Install."',
      'Make a small change on purpose (write down what you changed).',
      'Restore your snapshot and confirm the VM is back to normal.',
      'Build a second VM running Windows Server, using the same resource-allocation approach from the last lesson.',
      'Set both VMs\' network adapters so they can reach each other, and confirm with a successful ping in both directions.',
      'Screenshot your successful ping — you\'ll need it for your lab.',
    ],
    comingUp: 'Demonstrate a full snapshot-and-recover cycle, plus working communication between your client and server VMs.',
  },
  {
    id: 'its-02-lesson-03', number: '4.3', icon: 'ri-hard-drive-2-line',
    title: 'Windows Device & Storage Management', minutes: 90,
    learn: [
      'How to open Device Manager and read what it\'s telling you',
      'How to fix a device by updating, rolling back, or reinstalling its driver',
      'How to check and free up disk storage',
      'How to tell a driver problem apart from an actual hardware failure',
    ],
    topics: [
      { heading: 'Device Manager: Your First Stop', body: 'Device Manager lists every piece of hardware Windows knows about. A yellow warning triangle means Windows can see the device but something\'s wrong. Codes like "Code 43" (Windows stopped the device because it reported problems) or "Code 10" (the device can\'t start) are worth recognizing on sight.' },
      { heading: 'Fixing a Driver Problem', body: 'Check the Driver tab\'s install date — if it lines up with a recent Windows Update, "Roll Back Driver" reverts to what was working before. If no previous driver is available, try "Update Driver" or uninstall and let Windows reinstall it fresh.' },
      { heading: 'Storage: Finding What\'s Eating Your Space', body: 'Settings > System > Storage gives a breakdown by category. Disk Cleanup is usually the fastest win; Disk Management is the tool for a more technical view of your actual drive partitions.' },
      { heading: 'Driver Issue or Real Hardware Failure?', body: 'If rolling back or updating a driver doesn\'t fix the problem, that\'s a real signal the issue may be hardware, not software — document what you tried and escalate rather than keep guessing.' },
    ],
    practice: [
      'Open Device Manager on your own lab VM and look through every category. Find the device showing a warning icon, and record its exact error code and driver date — don\'t fix it yet, just observe.',
      'Check Settings > System > Storage and note your current free space and the biggest category using it up.',
    ],
    comingUp: 'A stuck label printer traces back to the exact same kind of driver problem — you\'ll diagnose and fix it start to finish in the IT Service Desk simulator.',
  },
  {
    id: 'its-02-lesson-04', number: '4.4', icon: 'ri-printer-line',
    title: 'Printer & Peripheral Triage', minutes: 90,
    learn: [
      'How to clear a print job that\'s stuck in the queue',
      'How to diagnose and fix a printer showing as "offline"',
      'How to restart the Print Spooler service — the fix behind most printing problems',
      'How to reconnect a USB or Bluetooth device Windows isn\'t recognizing',
    ],
    topics: [
      { heading: 'When Nothing Will Print', body: 'Every print job passes through a background service called the Print Spooler. When it hangs, every job gets stuck. If canceling a job directly doesn\'t work, restart the spooler itself — via Services, or net stop spooler / net start spooler.' },
      { heading: '"Offline" Doesn\'t Always Mean Broken', body: 'A printer showing "offline" might be genuinely unreachable, or just have a leftover "Use Printer Offline" flag telling it to act offline even though it\'s completely fine. Always check that setting first.' },
      { heading: 'Getting the Order Right', body: 'Clear the stuck job first, then restart the spooler, then check the offline flag. Do it backwards and you risk the exact same broken job getting stuck all over again.' },
      { heading: 'USB and Bluetooth Devices', body: 'For a Windows device that won\'t recognize, find it in Device Manager, uninstall it, then unplug and replug — Windows reinstalls it automatically. A stuck Bluetooth device often needs to be fully removed and re-paired from scratch.' },
    ],
    practice: [
      'On your own lab VM, send a test print job and simulate a stuck queue.',
      'Try clearing it two different ways — canceling directly from the queue, and restarting the Print Spooler — and note which one actually worked.',
    ],
    comingUp: 'A server-side Print Spooler crash traces back to the same root cause — you\'ll resolve it in the simulator, in the right order, and document your fix.',
  },
];

const ITS02_LAB_ID = 'its02-lab-state-v1';
const ITS02_LAB21_KEY = 'lab-its-02-vm-build';
const ITS02_LAB22_KEY = 'lab-its-02-vm-snapshot-server';
const ITS02_LAB23_KEY = 'lab-its-02-device-manager';
const ITS02_LAB24_KEY = 'lab-its-02-print-spooler';

// Evidence labs: the state fields holding each lab's files (work not yet
// submitted), its name, prompt, and the Resubmit label used when faculty
// return it.
const ITS02_EVIDENCE_LABS = {
  [ITS02_LAB21_KEY]: { fields: ['evDesktop', 'evVmSettings'], label: 'Lab 4.1', pendingText: 'Upload both evidence files to complete this lab.', resubmitLabel: 'Resubmit Lab 4.1' },
  [ITS02_LAB22_KEY]: { fields: ['evSnapshot', 'evPing1', 'evPing2'], label: 'Lab 4.2', pendingText: 'Upload all three evidence files to complete this lab.', resubmitLabel: 'Resubmit Lab 4.2' },
};
const ITS02_EVIDENCE_FIELD_BY_INPUT = {
  'its02-ev-desktop': 'evDesktop', 'its02-ev-vmsettings': 'evVmSettings',
  'its02-ev-snapshot': 'evSnapshot', 'its02-ev-ping1': 'evPing1', 'its02-ev-ping2': 'evPing2',
};
// Interim wiring (2026-11-23) until the page part rebuilds this file: each
// coached lab runs its own coach in the simulator, and Lab 4.4 is the
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
const ITS02_ALL_LAB_KEYS = [ITS02_LAB21_KEY, ITS02_LAB22_KEY, ITS02_LAB23_KEY, ITS02_LAB24_KEY];
const ITS02_WALKTHROUGH_START = ITS02_COACH_LABS['hd-m02'].start;

const ITS02_DEFAULT_STATE = {
  evDesktop: null, evVmSettings: null,
  evSnapshot: null, evPing1: null, evPing2: null,
  consoleStarted: false, consoleCompleted: false,
};

let its02State = null;
let its02User = null;

function its02Load(user) {
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

function its02Save() {
  if (its02User && its02State) LabRuntime.saveCaseState(ITS02_LAB_ID, 'its-02', its02User, its02State);
}

function its02LessonCard(lesson) {
  return `<details class="its02-lesson" data-its02-lesson="${esc(lesson.id)}">
    <summary><span class="its02-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its02-chevron" aria-hidden="true"></i></summary>
    <div class="its02-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="its02-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="its02-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <div class="its02-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>
    </div>
  </details>`;
}

function its02Lessons() {
  return `<div class="its02-lesson-grid">${ITS02_LESSONS.map(its02LessonCard).join('')}</div>`;
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
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-1" aria-labelledby="its02-lab-2-1-title">
    <div class="its02-section-heading"><span>1</span><div><p class="its02-kicker">Lab 4.1 · Guided Lab · checked, not graded</p><h2 id="its02-lab-2-1-title">Build Your Windows Client VM</h2></div></div>
    <p class="its02-instruction">In the simulator, build a Windows 11 client VM on a simulated host: 4 GB of memory, 2 CPU cores, a 64 GB dynamically allocated disk and NAT networking, then start it. The VM is simulated: nothing is installed on your computer, and it isn’t a real Windows installation. Your VMs are saved to your account.</p>
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
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-2" aria-labelledby="its02-lab-2-2-title">
    <div class="its02-section-heading"><span>2</span><div><p class="its02-kicker">Lab 4.2 · Guided Lab · checked, not graded</p><h2 id="its02-lab-2-2-title">Snapshot, Recover &amp; Connect Client to Server</h2></div></div>
    <p class="its02-instruction">In the simulator, snapshot the client VM you built in Lab 4.1, undo a change with it, build a Windows Server VM, put both on an Internal network and ping both ways. Then help a user whose virtual desktop is stuck.</p>
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
  return `${itsLabStatusHtml(its02User, labKey, { label: lab.label, prefix: 'its02', pendingText: lab.pendingText, ready })}
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
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-3" aria-labelledby="its02-lab-2-3-title">
    <div class="its02-section-heading"><span>3</span><div><p class="its02-kicker">Lab 4.3 · Guided Lab</p><h2 id="its02-lab-2-3-title">Printers and Peripherals</h2></div></div>
    <p class="its02-instruction">Work one printer ticket end to end in the IT Service Desk simulator: check the queue, clear a stuck job in the right order, put the printer back online and test it. Then add a label printer by its address, fix a webcam with a driver rollback and set up two monitors on a dock. A coach spotlights each step for you.</p>
    ${its02CoachLaunch('hd-m02')}
    ${itsLabStatusHtml(its02User, ITS02_LAB23_KEY, { label: 'Lab 4.3', prefix: 'its02', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its02User, [{ key: ITS02_LAB23_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>
  <section class="its02-section its02-lab-section" id="its02-lab-2-4" aria-labelledby="its02-lab-2-4-title">
    <div class="its02-section-heading"><span>4</span><div><p class="its02-kicker">Lab 4.4 · Practice tickets · not graded</p><h2 id="its02-lab-2-4-title">Four Practice Tickets</h2></div></div>
    <p class="its02-instruction">Work four tickets on your own: dead monitors on a dock, a laptop battery that may be swelling, a badge printer with a guest waiting, and a virtual desktop stuck on a black screen. “Check my work” gives feedback on each; there is no score.</p>
    <a class="itsw-evidence-button" data-its02-practice-launch href="${esc(its02PracticeHref(its02User))}" target="_blank" rel="opener"><i class="ri-external-link-line" aria-hidden="true"></i> Open the practice tickets</a>
    ${itsLabStatusHtml(its02User, ITS02_LAB24_KEY, { label: 'Lab 4.4', prefix: 'its02', pendingText: 'Finish all four tickets in the simulator to complete this lab.' })}
  </section>`;
}
// The practice set opens in its own saved shift (?practice=its-02), named by
// the anonymous student id, never the email.
function its02PracticeHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-02&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}

function viewItsModuleTwo(user, program) {
  its02Load(user);
  const module = program.modules['its-02'];
  const navSections = [
    { id: 'lessons', title: 'Foundation lessons', type: 'lecture', isComplete: true, scrollId: 'its02-lessons' },
    { id: 'client-vm', title: 'Build the client VM', type: 'lab', ...itsLabRail(user, [ITS02_LAB21_KEY]), scrollId: 'its02-lab-2-1' },
    { id: 'recovery', title: 'Snapshot and recovery', type: 'lab', ...itsLabRail(user, [ITS02_LAB22_KEY]), scrollId: 'its02-lab-2-2' },
    { id: 'service-desk', title: 'Printers and peripherals', type: 'lab', ...itsLabRail(user, [ITS02_LAB23_KEY]), scrollId: 'its02-lab-2-3' },
    { id: 'practice', title: 'Practice tickets', type: 'lab', ...itsLabRail(user, [ITS02_LAB24_KEY]), scrollId: 'its02-lab-2-4' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its02-sources', gated: false, supplemental: true },
  ];
  return `<div class="its02-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(navSections, { moduleKey: 'its02', stageKey: 'its-02' })}
    <main class="its02-main">
      <section class="its02-hero" aria-labelledby="its02-title"><div><p class="its02-kicker">Module 04 · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its02-title">${esc(module.title)}</h1><p class="its02-lede">Build your own virtual lab environment from scratch, then put it to work on two of the most common ticket types in the industry: device/driver problems and printer issues.</p></div><dl class="its02-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>4</dd></div><div><dt>Labs</dt><dd id="its02-status">${itsLabCounterText(user, ITS02_ALL_LAB_KEYS)}</dd></div></dl></section>

      <section class="its02-section" id="its02-lessons" aria-labelledby="its02-lessons-title"><div class="its02-section-heading"><span>L</span><div><p class="its02-kicker">Learn</p><h2 id="its02-lessons-title">Four foundation lessons</h2></div></div><p class="its02-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise on your own lab VM.</p>${its02Lessons()}</section>

      ${its02Lab21()}
      ${its02Lab22()}
      ${its02Lab34()}

      <section class="its02-section" id="its02-sources" aria-labelledby="its02-sources-title"><div class="its02-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its02-kicker">Reference — not a graded step</p><h2 id="its02-sources-title">Sources &amp; Further Reading</h2></div></div>${moduleSourcesBlock(ITS02_SOURCES)}</section>
    </main>
  </div>`;
}

function its02RenderHeroStatus() {
  const status = document.getElementById('its02-status');
  if (status) status.textContent = itsLabCounterText(its02User, ITS02_ALL_LAB_KEYS);
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

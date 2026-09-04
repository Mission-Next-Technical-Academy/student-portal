/* Module 02 — IT Help Desk & Career Accelerator ('it-support').
 * Fictional scenarios and simulated interfaces; Labs 2.1/2.2 are physical
 * evidence-based labs (the student's own VirtualBox build), Labs 2.3/2.4 are
 * fully simulated, in-browser mini-apps. Lesson content sourced from
 * Module_2_Student_Content.docx; lab design from
 * MNT_HelpDesk_Module2_Lab_Specifications.docx.
 */

const ITS02_LESSONS = [
  {
    id: 'its-02-lesson-01', number: '2.1', icon: 'ri-cpu-line',
    title: 'Virtualization Fundamentals & Building Your First VM', minutes: 150,
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
    id: 'its-02-lesson-02', number: '2.2', icon: 'ri-history-line',
    title: 'VM Snapshots, Recovery & Building a Server Environment', minutes: 150,
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
    id: 'its-02-lesson-03', number: '2.3', icon: 'ri-hard-drive-2-line',
    title: 'Windows Device & Storage Management', minutes: 60,
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
    comingUp: 'A user reports their webcam stopped working right after an overnight update — you\'ll diagnose and fix it start to finish.',
  },
  {
    id: 'its-02-lesson-04', number: '2.4', icon: 'ri-printer-line',
    title: 'Printer & Peripheral Triage', minutes: 60,
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
    comingUp: 'A front-desk user reports a stuck print job and an offline printer, with a guest waiting — you\'ll resolve both, in the right order, and document your fix.',
  },
];

const ITS02_LAB_ID = 'its02-lab-state-v1';
const ITS02_LAB21_KEY = 'lab-its-02-vm-build';
const ITS02_LAB22_KEY = 'lab-its-02-vm-snapshot-server';
const ITS02_LAB23_KEY = 'lab-its-02-device-manager';
const ITS02_LAB24_KEY = 'lab-its-02-print-spooler';
const ITS02_PASSING_SCORE = 70;

const ITS02_DEFAULT_STATE = {
  evDesktop: null, evVmSettings: null, lab21Complete: false,
  evSnapshot: null, evPing1: null, evPing2: null, lab22Complete: false,
  devSelectedAction: null, devNote: '', devAttempts: 0, devScore: 0, devBreakdown: null, devFeedback: [], devValidationError: '', devCompleted: false,
  printQueueCleared: false, printSpoolerRunning: false, printOfflineFlag: true, printOrder: [], printTestResult: null, printNote: '',
  printAttempts: 0, printScore: 0, printBreakdown: null, printFeedback: [], printValidationError: '', printCompleted: false,
  resetArmed: false,
};

let its02State = null;
let its02User = null;

function its02Load(user) {
  its02User = user;
  its02State = LabRuntime.load(ITS02_LAB_ID, user, ITS02_DEFAULT_STATE);
  if (!Array.isArray(its02State.printOrder)) its02State.printOrder = [];
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-02');
  return its02State;
}

function its02Save() {
  if (its02User && its02State) LabRuntime.save(ITS02_LAB_ID, its02User, its02State);
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

/* ---------- Lab 2.1 / 2.2 — physical, evidence-based ---------- */

function its02LabStatus(done, doneText, pendingText) {
  return `<div class="its02-lab-status ${done ? 'its02-status-pass' : 'its02-status-pending'}"><i class="${done ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${done ? doneText : pendingText}</span></div>`;
}

function its02Lab21() {
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-1" aria-labelledby="its02-lab-2-1-title">
    <div class="its02-section-heading"><span>1</span><div><p class="its02-kicker">Lab 2.1 · physical · evidence-based<span class="its02-lab-tag">Your own device</span></p><h2 id="its02-lab-2-1-title">Build Your Windows Client VM</h2></div></div>
    <p class="its02-instruction">Install VirtualBox and build a working Windows 11 client VM (4GB RAM, 2 CPU cores, 64GB dynamically-allocated disk, NAT networking) through to a usable desktop.</p>
    <div class="its02-evidence-grid" id="its02-lab21-grid">
      ${itswEvidenceTile({ id: 'its02-ev-desktop', label: 'Finished Windows desktop', hint: 'A screenshot of the completed Windows desktop.', file: its02State.evDesktop })}
      ${itswEvidenceTile({ id: 'its02-ev-vmsettings', label: 'VM settings summary', hint: 'A screenshot of VirtualBox’s Settings pane showing RAM, CPU, disk, and network mode.', file: its02State.evVmSettings })}
    </div>
    ${its02LabStatus(its02State.lab21Complete, 'Lab 2.1 complete — both evidence files uploaded.', 'Upload both evidence files to complete this lab.')}
  </section>`;
}

function its02Lab22() {
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-2" aria-labelledby="its02-lab-2-2-title">
    <div class="its02-section-heading"><span>2</span><div><p class="its02-kicker">Lab 2.2 · physical · evidence-based<span class="its02-lab-tag">Your own device</span></p><h2 id="its02-lab-2-2-title">Snapshot, Recover &amp; Connect Client to Server</h2></div></div>
    <p class="its02-instruction">Snapshot your client VM as "Clean Install," make a breaking change, restore the snapshot, build a Windows Server VM, and confirm a successful ping in both directions.</p>
    <div class="its02-evidence-grid its02-evidence-grid-3" id="its02-lab22-grid">
      ${itswEvidenceTile({ id: 'its02-ev-snapshot', label: 'Snapshot list', hint: 'A screenshot of the snapshot list showing "Clean Install."', file: its02State.evSnapshot })}
      ${itswEvidenceTile({ id: 'its02-ev-ping1', label: 'Ping: client → server', hint: 'A screenshot of a successful ping from the client VM to the server VM.', file: its02State.evPing1 })}
      ${itswEvidenceTile({ id: 'its02-ev-ping2', label: 'Ping: server → client', hint: 'A screenshot of a successful ping from the server VM to the client VM.', file: its02State.evPing2 })}
    </div>
    ${its02LabStatus(its02State.lab22Complete, 'Lab 2.2 complete — all three evidence files uploaded.', 'Upload all three evidence files to complete this lab.')}
  </section>`;
}

function its02RenderLab21() {
  const section = document.getElementById('its02-lab-2-1');
  if (!section) return;
  const grid = document.getElementById('its02-lab21-grid');
  if (grid) grid.outerHTML = `<div class="its02-evidence-grid" id="its02-lab21-grid">
    ${itswEvidenceTile({ id: 'its02-ev-desktop', label: 'Finished Windows desktop', hint: 'A screenshot of the completed Windows desktop.', file: its02State.evDesktop })}
    ${itswEvidenceTile({ id: 'its02-ev-vmsettings', label: 'VM settings summary', hint: 'A screenshot of VirtualBox’s Settings pane showing RAM, CPU, disk, and network mode.', file: its02State.evVmSettings })}
  </div>`;
  const statusEl = section.querySelector('.its02-lab-status');
  if (statusEl) statusEl.outerHTML = its02LabStatus(its02State.lab21Complete, 'Lab 2.1 complete — both evidence files uploaded.', 'Upload both evidence files to complete this lab.');
}

function its02RenderLab22() {
  const section = document.getElementById('its02-lab-2-2');
  if (!section) return;
  const grid = document.getElementById('its02-lab22-grid');
  if (grid) grid.outerHTML = `<div class="its02-evidence-grid its02-evidence-grid-3" id="its02-lab22-grid">
    ${itswEvidenceTile({ id: 'its02-ev-snapshot', label: 'Snapshot list', hint: 'A screenshot of the snapshot list showing "Clean Install."', file: its02State.evSnapshot })}
    ${itswEvidenceTile({ id: 'its02-ev-ping1', label: 'Ping: client → server', hint: 'A screenshot of a successful ping from the client VM to the server VM.', file: its02State.evPing1 })}
    ${itswEvidenceTile({ id: 'its02-ev-ping2', label: 'Ping: server → client', hint: 'A screenshot of a successful ping from the server VM to the client VM.', file: its02State.evPing2 })}
  </div>`;
  const statusEl = section.querySelector('.its02-lab-status');
  if (statusEl) statusEl.outerHTML = its02LabStatus(its02State.lab22Complete, 'Lab 2.2 complete — all three evidence files uploaded.', 'Upload all three evidence files to complete this lab.');
}

function its02CheckLab21() {
  const was = its02State.lab21Complete;
  its02State.lab21Complete = Boolean(its02State.evDesktop && its02State.evVmSettings);
  if (its02State.lab21Complete && !was) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(its02User, ITS02_LAB21_KEY, { state: 'complete', score: 100, result: { evidence: 2 } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', ITS02_LAB21_KEY);
  }
}

function its02CheckLab22() {
  const was = its02State.lab22Complete;
  its02State.lab22Complete = Boolean(its02State.evSnapshot && its02State.evPing1 && its02State.evPing2);
  if (its02State.lab22Complete && !was) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(its02User, ITS02_LAB22_KEY, { state: 'complete', score: 100, result: { evidence: 3 } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', ITS02_LAB22_KEY);
  }
}

/* ---------- Lab 2.3 — Device Manager simulation ---------- */

const ITS02_DEVICE = {
  name: 'HD Webcam (Integrated)', category: 'Cameras', errorCode: 'Code 43',
  brokenStatus: 'This device cannot start. (Code 43)', fixedStatus: 'This device is working properly.',
  brokenDriverDate: '9/3/2026 (installed via Windows Update)', fixedDriverDate: '7/12/2026 (rolled back)',
};

function its02DeviceFixed() {
  return its02State.devSelectedAction === 'rollback';
}

function its02DeviceManager() {
  const fixed = its02DeviceFixed();
  return `<div class="its02-devmgr">
    <div class="its02-devtree">
      <p class="its02-devtree-category">Cameras</p>
      <div class="its02-devtree-device its02-devtree-active"><i class="${fixed ? 'ri-checkbox-circle-fill its02-devtree-ok' : 'ri-error-warning-fill its02-devtree-warn'}" aria-hidden="true"></i> ${esc(ITS02_DEVICE.name)}</div>
      <p class="its02-devtree-category" style="margin-top:14px">Other categories</p>
      <div class="its02-devtree-device" style="opacity:.5;cursor:default">Display adapters</div>
      <div class="its02-devtree-device" style="opacity:.5;cursor:default">Network adapters</div>
    </div>
    <div class="its02-devprops">
      <div class="its02-devprops-tabs">
        <button type="button" class="${its02State.devPropsTab !== 'driver' ? 'its02-tab-active' : ''}" data-its02-devtab="general">General</button>
        <button type="button" class="${its02State.devPropsTab === 'driver' ? 'its02-tab-active' : ''}" data-its02-devtab="driver">Driver</button>
      </div>
      ${its02State.devPropsTab === 'driver' ? `
        <div class="its02-devprops-field"><span>Driver Provider</span><span>Microsoft</span></div>
        <div class="its02-devprops-field"><span>Driver Date</span><span>${esc(fixed ? ITS02_DEVICE.fixedDriverDate : ITS02_DEVICE.brokenDriverDate)}</span></div>
        <div class="its02-devprops-field"><span>Driver Version</span><span>${fixed ? '10.0.19041.4412' : '10.0.19041.4601'}</span></div>
      ` : `
        <div class="its02-devprops-field"><span>Device type</span><span>Cameras</span></div>
        <div class="its02-devprops-field"><span>Manufacturer</span><span>Generic</span></div>
        <div class="its02-devprops-field"><span>Device status</span><span>${esc(fixed ? ITS02_DEVICE.fixedStatus : ITS02_DEVICE.brokenStatus)}</span></div>
        ${fixed ? '' : `<div class="its02-devprops-error"><i class="ri-error-warning-line" aria-hidden="true"></i> ${esc(ITS02_DEVICE.errorCode)} — Windows stopped this device because it has reported problems.</div>`}
      `}
      <div class="its02-devprops-actions">
        <button type="button" class="its02-action-primary" data-its02-devaction="rollback"><i class="ri-arrow-go-back-line" aria-hidden="true"></i> Roll Back Driver</button>
        <button type="button" data-its02-devaction="update"><i class="ri-refresh-line" aria-hidden="true"></i> Update Driver</button>
        <button type="button" data-its02-devaction="uninstall"><i class="ri-delete-bin-line" aria-hidden="true"></i> Uninstall Device</button>
      </div>
      ${its02State.devSelectedAction && its02State.devSelectedAction !== 'rollback' ? `<div class="its02-devprops-error" style="margin-top:10px"><i class="ri-information-line" aria-hidden="true"></i> ${its02State.devSelectedAction === 'update' ? 'Windows searches for a driver but finds none newer — this device already has the latest driver, so an update won’t help.' : 'Uninstalling removes the device, but Windows reinstalls the same problematic driver on reboot — the underlying conflict isn’t fixed.'}</div>` : ''}
    </div>
  </div>
  <div class="its02-ticket-note">
    <label for="its02-dev-note">Closing message to Devon R.</label>
    <textarea id="its02-dev-note" data-its02-dev-note rows="2" placeholder="What did you find, what did you do, and is it fixed?">${esc(its02State.devNote)}</textarea>
  </div>`;
}

function its02Lab23ScorePanel() {
  if (its02State.devValidationError) {
    return `<div class="its02-validation" id="its02-dev-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the worksheet</strong><p>${esc(its02State.devValidationError)}</p></div></div>`;
  }
  if (!its02State.devAttempts || !its02State.devBreakdown) {
    return `<div class="its02-score-empty" id="its02-dev-feedback" role="status">Diagnose the device, choose the correct fix, verify it, and write your closing message, then submit.</div>`;
  }
  const passed = its02State.devScore >= ITS02_PASSING_SCORE;
  const b = its02State.devBreakdown;
  return `<section class="its02-score ${passed ? 'its02-score-pass' : 'its02-score-remediate'}" id="its02-dev-feedback" tabindex="-1" aria-live="polite">
    <div class="its02-score-heading"><div><p class="its02-kicker">Attempt ${its02State.devAttempts}</p><h3>${its02State.devScore}/100 — ${passed ? 'Fixed correctly' : 'Review and retry'}</h3></div><span>${its02State.devScore}</span></div>
    <div class="its02-score-grid"><div><strong>${b.action}/60</strong><span>Correct action</span></div><div><strong>${b.note}/40</strong><span>Closing message</span></div></div>
    <ul class="its02-feedback-list">${its02State.devFeedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
  </section>`;
}

function its02Lab23() {
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-3" aria-labelledby="its02-lab-2-3-title">
    <div class="its02-section-heading"><span>3</span><div><p class="its02-kicker">Lab 2.3 · simulated · passing score ${ITS02_PASSING_SCORE}/100</p><h2 id="its02-lab-2-3-title">The Misbehaving Peripheral</h2></div></div>
    <p class="its02-instruction">"My webcam stopped working after last night's Windows update. It worked fine yesterday." — Devon R.</p>
    <div id="its02-lab23-dynamic">
      ${its02DeviceManager()}
      <div class="its02-worksheet-actions"><button class="its02-submit" type="button" data-its02-dev-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my fix</button></div>
      ${its02Lab23ScorePanel()}
    </div>
  </section>`;
}

function its02RenderLab23(focusId) {
  const root = document.getElementById('its02-lab23-dynamic');
  if (!root) return;
  root.innerHTML = `${its02DeviceManager()}
    <div class="its02-worksheet-actions"><button class="its02-submit" type="button" data-its02-dev-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my fix</button></div>
    ${its02Lab23ScorePanel()}`;
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function its02Lab23Score() {
  const action = its02State.devSelectedAction === 'rollback' ? 60 : 0;
  const note = its02State.devNote.trim();
  const noteOk = note.length >= 20 && /(webcam|camera)/i.test(note) && /(driver|roll ?back|update)/i.test(note) && /(fix|resolv|working|restore)/i.test(note);
  const noteScore = noteOk ? 40 : 0;
  return {
    score: action + noteScore,
    breakdown: { action, note: noteScore },
    feedback: [
      action ? 'Correct action: Roll Back Driver undoes the driver installed by last night\'s update — the right fix, not a workaround.' : 'The correct action is Roll Back Driver — the problem started right after a driver update, so reverting it is the fix, not updating again or uninstalling.',
      noteScore ? 'Closing message: clear and specific — names the device, the fix, and confirms it’s resolved.' : 'Closing message: write at least 20 characters naming the webcam, the driver rollback, and that it’s now working.',
    ],
  };
}

/* ---------- Lab 2.4 — Print Spooler / queue simulation ---------- */

function its02PrintSim() {
  const spoolerLabel = its02State.printSpoolerRunning ? 'Running' : 'Stuck';
  return `<div class="its02-printsim">
    <div class="its02-printsim-row">
      <div class="its02-print-panel"><h4>Print Queue</h4>
        <div class="its02-print-job ${its02State.printQueueCleared ? 'its02-job-clear' : 'its02-job-stuck'}"><span>${its02State.printQueueCleared ? 'Queue is empty' : 'Quarterly Report.pdf — Stuck'}</span>${its02State.printQueueCleared ? '' : `<button type="button" data-its02-print-action="cancel">Cancel Job</button>`}</div>
      </div>
      <div class="its02-print-panel"><h4>Services</h4>
        <div class="its02-svc-row"><span>Print Spooler</span><span class="its02-svc-status ${its02State.printSpoolerRunning ? 'its02-svc-running' : 'its02-svc-stuck'}">${esc(spoolerLabel)}</span></div>
        <div class="its02-printsim-actions" style="margin-top:10px"><button type="button" data-its02-print-action="restart">Restart Service</button></div>
      </div>
      <div class="its02-print-panel"><h4>Printer Menu</h4>
        <div class="its02-toggle-row"><span>Use Printer Offline</span><button type="button" class="its02-toggle ${its02State.printOfflineFlag ? 'its02-toggle-on' : ''}" data-its02-print-toggle role="switch" aria-checked="${its02State.printOfflineFlag}" aria-label="Use Printer Offline"></button></div>
      </div>
    </div>
    <div class="its02-printsim-actions"><button type="button" class="its02-action-primary" data-its02-print-action="test"><i class="ri-printer-line" aria-hidden="true"></i> Send Test Print</button></div>
    ${its02State.printTestResult ? `<div class="its02-printsim-result ${its02State.printTestResult === 'success' ? 'its02-result-success' : 'its02-result-fail'}"><i class="${its02State.printTestResult === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}" aria-hidden="true"></i> ${its02State.printTestResult === 'success' ? 'Test print completed successfully.' : 'Test print failed — check the queue, spooler, and offline setting.'}</div>` : ''}
    <div class="its02-ticket-note">
      <label for="its02-print-note">Ticket note to the front desk</label>
      <textarea id="its02-print-note" data-its02-print-note rows="2" placeholder="What did you find, what did you do, and in what order?">${esc(its02State.printNote)}</textarea>
    </div>
  </div>`;
}

function its02Lab24ScorePanel() {
  if (its02State.printValidationError) {
    return `<div class="its02-validation" id="its02-print-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the worksheet</strong><p>${esc(its02State.printValidationError)}</p></div></div>`;
  }
  if (!its02State.printAttempts || !its02State.printBreakdown) {
    return `<div class="its02-score-empty" id="its02-print-feedback" role="status">Clear the job, restart the spooler, fix the offline flag, and verify with a test print — in that order — then submit.</div>`;
  }
  const passed = its02State.printScore >= ITS02_PASSING_SCORE;
  const b = its02State.printBreakdown;
  return `<section class="its02-score ${passed ? 'its02-score-pass' : 'its02-score-remediate'}" id="its02-print-feedback" tabindex="-1" aria-live="polite">
    <div class="its02-score-heading"><div><p class="its02-kicker">Attempt ${its02State.printAttempts}</p><h3>${its02State.printScore}/100 — ${passed ? 'Resolved correctly' : 'Review and retry'}</h3></div><span>${its02State.printScore}</span></div>
    <div class="its02-score-grid"><div><strong>${b.order}/30</strong><span>Correct order</span></div><div><strong>${b.offline}/20</strong><span>Offline flag fixed</span></div><div><strong>${b.test}/30</strong><span>Verified test print</span></div><div><strong>${b.note}/20</strong><span>Ticket note</span></div></div>
    <ul class="its02-feedback-list">${its02State.printFeedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
  </section>`;
}

function its02Lab24() {
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-4" aria-labelledby="its02-lab-2-4-title">
    <div class="its02-section-heading"><span>4</span><div><p class="its02-kicker">Lab 2.4 · simulated · passing score ${ITS02_PASSING_SCORE}/100</p><h2 id="its02-lab-2-4-title">The Stuck Queue and the Offline Printer</h2></div></div>
    <p class="its02-instruction">A front-desk user reports a stuck print job and an offline printer, with a guest waiting. Clear it, fix it, and verify — in the right order.</p>
    <div id="its02-lab24-dynamic">
      ${its02PrintSim()}
      <div class="its02-worksheet-actions"><button class="its02-submit" type="button" data-its02-print-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my resolution</button></div>
      ${its02Lab24ScorePanel()}
      <div class="its02-worksheet-actions"><button class="its02-reset" type="button" data-its02-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this module</button></div>
      ${its02State.resetArmed ? `<div class="its02-reset-confirm" id="its02-reset-confirm" role="alert"><p><strong>Reset Module 02?</strong> All four labs — evidence, Device Manager, and print-spooler progress and scores — will be cleared.</p><div><button type="button" data-its02-reset-confirm>Yes, reset this module</button><button type="button" data-its02-reset-cancel>Cancel</button></div></div>` : ''}
    </div>
  </section>`;
}

function its02RenderLab24(focusId) {
  const root = document.getElementById('its02-lab24-dynamic');
  if (!root) return;
  root.innerHTML = `${its02PrintSim()}
    <div class="its02-worksheet-actions"><button class="its02-submit" type="button" data-its02-print-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my resolution</button></div>
    ${its02Lab24ScorePanel()}
    <div class="its02-worksheet-actions"><button class="its02-reset" type="button" data-its02-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this module</button></div>
    ${its02State.resetArmed ? `<div class="its02-reset-confirm" id="its02-reset-confirm" role="alert"><p><strong>Reset Module 02?</strong> All four labs — evidence, Device Manager, and print-spooler progress and scores — will be cleared.</p><div><button type="button" data-its02-reset-confirm>Yes, reset this module</button><button type="button" data-its02-reset-cancel>Cancel</button></div></div>` : ''}`;
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function its02Lab24Score() {
  // its02State.printSpoolerRunning can only be true if a restart happened
  // while the queue was already clear (see the 'restart' action handler),
  // so checking it directly — rather than the first 'restart' in the log —
  // correctly credits a student who restarts too early and then corrects
  // course by canceling the job and restarting again.
  const orderOk = its02State.printQueueCleared && its02State.printSpoolerRunning;
  const order = orderOk ? 30 : 0;
  const offline = !its02State.printOfflineFlag ? 20 : 0;
  const test = its02State.printTestResult === 'success' ? 30 : 0;
  const note = its02State.printNote.trim();
  const noteOk = note.length >= 20 && /(spooler|queue|offline|print)/i.test(note) && /(clear|cancel|restart|fix|resolv)/i.test(note);
  const noteScore = noteOk ? 20 : 0;
  return {
    score: order + offline + test + noteScore,
    breakdown: { order, offline, test, note: noteScore },
    feedback: [
      order ? 'Order: Correct — the stuck job was cleared before the spooler was restarted.' : 'Order: Clear the stuck job first. Restarting the spooler while a job is still queued can hang it right back up.',
      offline ? 'Offline flag: Corrected.' : 'Offline flag: Turn off "Use Printer Offline" — the printer itself is fine, this is a leftover Windows-side flag.',
      test ? 'Verification: Test print succeeded.' : 'Verification: Send a test print once the queue is clear, the spooler is running, and the offline flag is off.',
      noteScore ? 'Ticket note: Clear and specific about what was found and fixed.' : 'Ticket note: Write at least 20 characters describing the stuck queue, the spooler restart, and the offline fix.',
    ],
  };
}

function viewItsModuleTwo(user, program) {
  its02Load(user);
  const module = program.modules['its-02'];
  return `<div class="its02-shell">
    <header class="its02-topbar"><a class="its02-brand" href="#/program/${esc(program.slug)}" aria-label="Back to IT Help Desk program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="its02-top-actions"><span class="its02-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="its02-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="its02-main">
      <section class="its02-hero" aria-labelledby="its02-title"><div><p class="its02-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p><h1 id="its02-title">${esc(module.title)}</h1><p class="its02-lede">Build your own virtual lab environment from scratch, then put it to work on two of the most common ticket types in the industry: device/driver problems and printer issues.</p></div><dl class="its02-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>4</dd></div></dl></section>

      <section class="its02-section" id="its02-lessons" aria-labelledby="its02-lessons-title"><div class="its02-section-heading"><span>L</span><div><p class="its02-kicker">Learn</p><h2 id="its02-lessons-title">Four foundation lessons</h2></div></div><p class="its02-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise on your own lab VM.</p>${its02Lessons()}</section>

      ${its02Lab21()}
      ${its02Lab22()}
      ${its02Lab23()}
      ${its02Lab24()}
    </main>
  </div>`;
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
      if (id === 'its02-ev-desktop') { its02State.evDesktop = file; its02CheckLab21(); its02Save(); its02RenderLab21(); }
      else if (id === 'its02-ev-vmsettings') { its02State.evVmSettings = file; its02CheckLab21(); its02Save(); its02RenderLab21(); }
      else if (id === 'its02-ev-snapshot') { its02State.evSnapshot = file; its02CheckLab22(); its02Save(); its02RenderLab22(); }
      else if (id === 'its02-ev-ping1') { its02State.evPing1 = file; its02CheckLab22(); its02Save(); its02RenderLab22(); }
      else if (id === 'its02-ev-ping2') { its02State.evPing2 = file; its02CheckLab22(); its02Save(); its02RenderLab22(); }
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-its02-dev-note]')) {
      its02State.devNote = event.target.value;
      its02Save();
      return;
    }
    if (event.target.matches('[data-its02-print-note]')) {
      its02State.printNote = event.target.value;
      its02Save();
    }
  });

  shell.addEventListener('click', (event) => {
    const devTab = event.target.closest('[data-its02-devtab]');
    if (devTab) {
      its02State.devPropsTab = devTab.dataset.its02Devtab;
      its02Save();
      its02RenderLab23();
      return;
    }
    const devAction = event.target.closest('[data-its02-devaction]');
    if (devAction) {
      its02State.devSelectedAction = devAction.dataset.its02Devaction;
      its02State.devValidationError = '';
      its02Save();
      its02RenderLab23();
      return;
    }
    if (event.target.closest('[data-its02-dev-submit]')) {
      const note = document.getElementById('its02-dev-note');
      if (note) its02State.devNote = note.value;
      if (!its02State.devSelectedAction || !its02State.devNote.trim()) {
        its02State.devValidationError = 'Choose an action and write your closing message before submitting.';
        its02Save();
        its02RenderLab23('its02-dev-feedback');
        return;
      }
      const result = its02Lab23Score();
      its02State.devAttempts += 1;
      its02State.devScore = result.score;
      its02State.devBreakdown = result.breakdown;
      its02State.devFeedback = result.feedback;
      its02State.devValidationError = '';
      const passed = result.score >= ITS02_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') recordLabAttempt(its02User, ITS02_LAB23_KEY, { state: passed ? 'complete' : 'in_progress', score: result.score, result: { breakdown: result.breakdown, attempts: its02State.devAttempts } });
      if (passed) {
        its02State.devCompleted = true;
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', ITS02_LAB23_KEY);
      }
      its02Save();
      its02RenderLab23('its02-dev-feedback');
      return;
    }

    const printAction = event.target.closest('[data-its02-print-action]');
    if (printAction) {
      const action = printAction.dataset.its02PrintAction;
      its02State.printOrder.push(action);
      if (action === 'cancel') {
        its02State.printQueueCleared = true;
      } else if (action === 'restart') {
        its02State.printSpoolerRunning = its02State.printQueueCleared;
      } else if (action === 'test') {
        its02State.printTestResult = (its02State.printQueueCleared && its02State.printSpoolerRunning && !its02State.printOfflineFlag) ? 'success' : 'fail';
      }
      its02State.printValidationError = '';
      its02Save();
      its02RenderLab24();
      return;
    }
    if (event.target.closest('[data-its02-print-toggle]')) {
      its02State.printOfflineFlag = !its02State.printOfflineFlag;
      its02State.printOrder.push('toggle-offline');
      its02Save();
      its02RenderLab24();
      return;
    }
    if (event.target.closest('[data-its02-print-submit]')) {
      const note = document.getElementById('its02-print-note');
      if (note) its02State.printNote = note.value;
      if (!its02State.printNote.trim()) {
        its02State.printValidationError = 'Write a short ticket note describing what you found and fixed before submitting.';
        its02Save();
        its02RenderLab24('its02-print-feedback');
        return;
      }
      const result = its02Lab24Score();
      its02State.printAttempts += 1;
      its02State.printScore = result.score;
      its02State.printBreakdown = result.breakdown;
      its02State.printFeedback = result.feedback;
      its02State.printValidationError = '';
      const passed = result.score >= ITS02_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') recordLabAttempt(its02User, ITS02_LAB24_KEY, { state: passed ? 'complete' : 'in_progress', score: result.score, result: { breakdown: result.breakdown, attempts: its02State.printAttempts } });
      if (passed) {
        its02State.printCompleted = true;
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its02User, 'it-support', 'its-02', ITS02_LAB24_KEY);
      }
      its02Save();
      its02RenderLab24('its02-print-feedback');
      return;
    }

    if (event.target.closest('[data-its02-reset]')) {
      its02State.resetArmed = true;
      its02Save();
      its02RenderLab24('its02-reset-confirm');
      return;
    }
    if (event.target.closest('[data-its02-reset-cancel]')) {
      its02State.resetArmed = false;
      its02Save();
      its02RenderLab24();
      return;
    }
    if (event.target.closest('[data-its02-reset-confirm]')) {
      its02State = LabRuntime.reset(ITS02_LAB_ID, its02User, ITS02_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') {
        [ITS02_LAB21_KEY, ITS02_LAB22_KEY, ITS02_LAB23_KEY, ITS02_LAB24_KEY].forEach((key) => markModuleLabComplete(its02User, 'it-support', 'its-02', key, false));
      }
      its02RenderLab21();
      its02RenderLab22();
      its02RenderLab23('its02-lessons-title');
      its02RenderLab24();
    }
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 2, moduleKey: 'its-02', view: viewItsModuleTwo, wire: wireItsModuleTwoLab });

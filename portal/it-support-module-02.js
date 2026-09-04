/* Module 02 — IT Help Desk & Career Accelerator ('it-support').
 * Fictional scenarios; no real systems involved beyond the student's own VM
 * build. Labs 2.1/2.2 are physical, evidence-based labs (the student's own
 * VirtualBox build) — unchanged from the original design. Labs 2.3/2.4 are a
 * single guided walkthrough of two real print-driver tickets ('hd-m02') in
 * the IT Service Desk simulator (ui/helpdesk.js + ui/coach.js), the same
 * coach engine Module 1's Lab 1.2 and SOC's Module 1 already use — not a
 * portal-embedded Device Manager/Print Spooler widget. Lesson content
 * sourced from Module_2_Student_Content.docx.
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
    comingUp: 'A stuck label printer traces back to the exact same kind of driver problem — you\'ll diagnose and fix it start to finish in the IT Service Desk simulator.',
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
    comingUp: 'A server-side Print Spooler crash traces back to the same root cause — you\'ll resolve it in the simulator, in the right order, and document your fix.',
  },
];

const ITS02_LAB_ID = 'its02-lab-state-v1';
const ITS02_LAB21_KEY = 'lab-its-02-vm-build';
const ITS02_LAB22_KEY = 'lab-its-02-vm-snapshot-server';
const ITS02_LAB23_KEY = 'lab-its-02-device-manager';
const ITS02_LAB24_KEY = 'lab-its-02-print-spooler';

const ITS02_DEFAULT_STATE = {
  evDesktop: null, evVmSettings: null, lab21Complete: false,
  evSnapshot: null, evPing1: null, evPing2: null, lab22Complete: false,
  consoleStarted: false, consoleCompleted: false,
};

let its02State = null;
let its02User = null;

function its02Load(user) {
  its02User = user;
  its02State = LabRuntime.load(ITS02_LAB_ID, user, ITS02_DEFAULT_STATE);
  // Same-tab fallback for the coach's completion signal — postMessage is the
  // primary channel (see its02ReceiveCoachCompletion) but doesn't fire if the
  // student closed and reopened the sim tab without window.opener intact.
  if (new URLSearchParams(location.search).get('coachComplete') === 'hd-m02') {
    its02State.consoleStarted = true;
    its02State.consoleCompleted = true;
    LabRuntime.save(ITS02_LAB_ID, user, its02State);
    history.replaceState(null, '', location.pathname + location.hash);
  }
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

/* ---------- Labs 2.3 & 2.4 — guided walkthrough in the real simulator ---------- */

function its02Lab34Status() {
  const done = its02State.consoleCompleted;
  return `<div class="its02-lab-status ${done ? 'its02-status-pass' : 'its02-status-pending'}"><i class="${done ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${done ? 'Labs 2.3 & 2.4 complete — both tickets resolved in the guided walkthrough.' : 'Complete the guided walkthrough in the simulator to finish these labs.'}</span></div>`;
}

function its02Lab34() {
  const complete = its02State.consoleCompleted === true;
  return `<section class="its02-section its02-lab-section" id="its02-lab-2-3" aria-labelledby="its02-lab-2-3-title">
    <div class="its02-section-heading"><span>3</span><div><p class="its02-kicker">Labs 2.3 &amp; 2.4 · guided walkthrough</p><h2 id="its02-lab-2-3-title">The Misbehaving Peripheral &amp; The Stuck Queue</h2></div></div>
    <p class="its02-instruction">Work two real print-driver tickets end to end in the IT Service Desk simulator — a stuck label queue (HD-2106) and a crashing Print Spooler service (HD-2112) — tracing both back to the same driver crash and resolving them under change control. A coach spotlights each step for you.</p>
    <a class="itsw-evidence-button" data-its02-console-launch href="${esc(SIM_ORIGIN)}?coach=hd-m02&amp;restart=1#/helpdesk/tickets" target="_blank" rel="opener">
      <i class="${complete ? 'ri-refresh-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${complete ? 'Review the walkthrough' : 'Start Labs 2.3 & 2.4 walkthrough'}
    </a>
    ${its02Lab34Status()}
  </section>`;
}

function viewItsModuleTwo(user, program) {
  its02Load(user);
  const module = program.modules['its-02'];
  const labsComplete = (its02State.lab21Complete ? 1 : 0) + (its02State.lab22Complete ? 1 : 0) + (its02State.consoleCompleted ? 2 : 0);
  return `<div class="its02-shell">
    <header class="its02-topbar"><a class="its02-brand" href="#/program/${esc(program.slug)}" aria-label="Back to IT Help Desk program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="its02-top-actions"><span class="its02-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="its02-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="its02-main">
      <section class="its02-hero" aria-labelledby="its02-title"><div><p class="its02-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p><h1 id="its02-title">${esc(module.title)}</h1><p class="its02-lede">Build your own virtual lab environment from scratch, then put it to work on two of the most common ticket types in the industry: device/driver problems and printer issues.</p></div><dl class="its02-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>4</dd></div><div><dt>Labs complete</dt><dd id="its02-status">${labsComplete}/4</dd></div></dl></section>

      <section class="its02-section" id="its02-lessons" aria-labelledby="its02-lessons-title"><div class="its02-section-heading"><span>L</span><div><p class="its02-kicker">Learn</p><h2 id="its02-lessons-title">Four foundation lessons</h2></div></div><p class="its02-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise on your own lab VM.</p>${its02Lessons()}</section>

      ${its02Lab21()}
      ${its02Lab22()}
      ${its02Lab34()}
    </main>
  </div>`;
}

function its02RenderHeroStatus() {
  const status = document.getElementById('its02-status');
  if (status) status.textContent = `${(its02State.lab21Complete ? 1 : 0) + (its02State.lab22Complete ? 1 : 0) + (its02State.consoleCompleted ? 2 : 0)}/4`;
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
      if (id === 'its02-ev-desktop') { its02State.evDesktop = file; its02CheckLab21(); its02Save(); its02RenderLab21(); its02RenderHeroStatus(); }
      else if (id === 'its02-ev-vmsettings') { its02State.evVmSettings = file; its02CheckLab21(); its02Save(); its02RenderLab21(); its02RenderHeroStatus(); }
      else if (id === 'its02-ev-snapshot') { its02State.evSnapshot = file; its02CheckLab22(); its02Save(); its02RenderLab22(); its02RenderHeroStatus(); }
      else if (id === 'its02-ev-ping1') { its02State.evPing1 = file; its02CheckLab22(); its02Save(); its02RenderLab22(); its02RenderHeroStatus(); }
      else if (id === 'its02-ev-ping2') { its02State.evPing2 = file; its02CheckLab22(); its02Save(); its02RenderLab22(); its02RenderHeroStatus(); }
    }
  });

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-its02-console-launch]')) {
      its02State.consoleStarted = true;
      its02Save();
    }
  });
}

async function its02ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== 'hd-m02') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) return;

  const saved = LabRuntime.load(ITS02_LAB_ID, user, ITS02_DEFAULT_STATE);
  saved.consoleStarted = true;
  saved.consoleCompleted = true;
  LabRuntime.save(ITS02_LAB_ID, user, saved);
  its02State = saved;
  its02User = user;

  if (typeof markModuleLabComplete === 'function') {
    markModuleLabComplete(user, 'it-support', 'its-02', ITS02_LAB23_KEY);
    markModuleLabComplete(user, 'it-support', 'its-02', ITS02_LAB24_KEY);
  }
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(user, ITS02_LAB23_KEY, { state: 'complete', result: { source: 'mnt-coach-complete' } });
    recordLabAttempt(user, ITS02_LAB24_KEY, { state: 'complete', result: { source: 'mnt-coach-complete' } });
  }

  const mounted = Boolean(document.querySelector('.its02-shell'));
  if (!mounted) return;
  render();
  const section = document.getElementById('its02-lab-2-3');
  if (section) section.scrollIntoView({ block: 'start' });
}

registerModuleLab({
  program: 'it-support', moduleNumber: 2, moduleKey: 'its-02',
  view: viewItsModuleTwo, wire: wireItsModuleTwoLab, onMessage: its02ReceiveCoachCompletion,
});

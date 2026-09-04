/* Module 07 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content only; uses the shared simple-module template in
 * it-support-shared.js (itsSimpleModuleView) since this module's lab has
 * not been spec'd or built yet — see data.js's compliance.sourceNotes on
 * the it-support program entry. Content sourced from
 * Module_7_Student_Content.docx.
 */

const ITS07_LESSONS = [
  {
    id: 'its-07-lesson-01', number: '7.1', icon: 'ri-download-2-line',
    title: 'Installing, Updating & Removing Software', minutes: 60,
    learn: [
      'How to install and uninstall applications correctly on Windows',
      'How Windows Update and individual application updates differ, and why both matter',
      'What to check before removing software a user reports as "not needed anymore"',
    ],
    topics: [
      { heading: 'Installing and Uninstalling, the Right Way', body: 'Most software installs cleanly through Settings > Apps > Installed apps, or a vendor\'s own installer. Uninstalling through the same Settings menu is generally safer than deleting program folders manually — it lets the application\'s own uninstaller clean up related files and registry entries properly.' },
      { heading: 'Two Different Kinds of Updates', body: 'Windows Update keeps the OS current, but application updates come through the Microsoft Store, the app\'s own updater, or an org-managed deployment tool. A user can be fully current on Windows Updates and still run an outdated application — check the specific update mechanism that application actually uses.' },
      { heading: 'Before You Uninstall Anything', body: 'When a user asks you to remove software they say they don\'t need, check first: does another process or a company policy depend on it? A five-second question can save an hours-long ticket later.' },
    ],
    practice: [
      'On your lab VM, open Settings > Apps > Installed apps and check whether any listed application shows an available update.',
      'Separately, check Windows Update\'s own status.',
    ],
    comingUp: 'You\'ll be asked to install a specified application, confirm it\'s current, and correctly remove a different one a user no longer needs.',
  },
  {
    id: 'its-07-lesson-02', number: '7.2', icon: 'ri-shield-check-line',
    title: 'Diagnosing Application Problems & Endpoint Security Hygiene', minutes: 60,
    learn: [
      'How to tell an application-specific problem apart from a system-wide one (and how to fix the application-specific kind)',
      'Basic repair options built into Windows for a misbehaving app',
      'How to work through a vague "my computer is slow" ticket systematically instead of guessing',
      'What "endpoint security hygiene" means in practice for an L1 technician',
    ],
    topics: [
      { heading: 'When One App Misbehaves', body: 'If a single application crashes, freezes, or won\'t open while everything else runs normally, an application-specific problem is a good starting hypothesis — but not proof. A profile issue, permissions, a shared runtime, a driver, or security tooling can all cause the same symptom. Treat it as your first thing to check, not your conclusion.' },
      { heading: 'Built-In Repair Options', body: 'Some Windows applications offer a "Repair" option in Settings > Apps > Installed apps, which reinstalls damaged files without wiping settings or data — worth trying when available, though not every app exposes it.' },
      { heading: 'Diagnosing a "Slow, Misbehaving" Workstation', body: 'A vague "everything is slow" ticket hides several possible causes: too many startup apps, one or two apps consuming resources in the background, a backlog of pending updates, or low storage. Work through Task Manager and Settings > Apps systematically — running/consuming resources, startup, update status, storage, in that order.' },
      { heading: 'Endpoint Security Hygiene, At Your Level', body: 'Keeping software and the OS current isn\'t just about features — outdated software is one of the most common ways a machine becomes vulnerable. Part of an L1 technician\'s job is simply noticing and flagging machines that have fallen behind on updates, even when nothing looks broken yet.' },
    ],
    practice: [
      'Pick an application on your lab VM and check whether Windows offers a Repair option for it under Settings > Apps > Installed apps.',
      'Separately, open Task Manager and Settings > Apps > Startup on your lab VM and note anything that looks like it could contribute to a machine feeling slow.',
    ],
    comingUp: 'A user reports their whole computer has felt slow and unresponsive for days — you\'ll work through the full diagnostic sequence to find out why and fix it.',
  },
];

function viewItsModuleSeven(user, program) {
  return itsSimpleModuleView({
    user, program, moduleKey: 'its-07', moduleNumber: 7, lessons: ITS07_LESSONS,
    lede: 'You\'ve covered hardware, the operating system, and the network underneath it — this module rounds out the picture with the software layer: installing it, updating it, and diagnosing it when it misbehaves.',
    labPreview: 'This module\'s guided lab isn\'t built yet — it will ask you to install and correctly remove specified applications, then work through a full diagnostic sequence for a "computer just feels slow" ticket using Task Manager and Settings > Apps.',
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 7, moduleKey: 'its-07', view: viewItsModuleSeven });

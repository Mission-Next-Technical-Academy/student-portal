/* Module 03 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content sourced from Module_3_Student_Content.docx. Lab is a
 * guided walkthrough of a real ticket ('hd-m03') in the IT Service Desk
 * simulator (ui/helpdesk.js + ui/coach.js) — see it-support-shared.js's
 * itsRegisterCoachModule, the same factory Modules 4-11 use.
 */

const ITS03_LESSONS = [
  {
    id: 'its-03-lesson-01', number: '3.1', icon: 'ri-layout-grid-line',
    title: 'Navigation, User Profiles, Local Accounts & Support Utilities', minutes: 90,
    learn: [
      'How to move between Settings and Control Panel, and when you need each one',
      'The difference between a user account and a user profile — and why that difference matters on real tickets',
      'How to use Task Manager to find what\'s slowing a machine down',
      'How to use Event Viewer to investigate a problem you can\'t reproduce yourself',
    ],
    topics: [
      { heading: 'Settings vs. Control Panel', body: 'Modern Windows funnels most everyday settings through the Settings app, but a few tools — certain advanced network adapter properties, some account-management screens — still only exist in the older Control Panel. Get comfortable moving between both.' },
      { heading: 'Account vs. Profile: A Distinction That Actually Matters', body: 'A user account is the login credential. A user profile is everything built around it — desktop, documents, personal settings. If a user\'s desktop is completely empty and every setting has reset, but they can still log in fine, that\'s usually a corrupted profile, not an account problem.' },
      { heading: 'Task Manager: What\'s Actually Using Your Resources', body: 'Sort the Processes tab by CPU or memory to see what\'s eating resources. The Startup tab is where "my computer takes forever to boot" tickets usually get solved — too many auto-launching apps is one of the most common causes of a slow boot.' },
      { heading: 'Event Viewer: Investigating What You Can\'t Reproduce', body: 'Event Viewer logs system and application events under Windows Logs, each with a severity level and an Event ID you can search — exactly what you need when a problem happened once and won\'t happen again while you\'re watching.' },
    ],
    practice: [
      'Create a second local user account on your lab VM and log into it once to see a fresh profile build.',
      'Open Task Manager and record your top three processes by memory usage.',
      'Open Event Viewer\'s System log and find one Warning or Error entry — record its Event ID and a one-sentence summary of what it means.',
    ],
    comingUp: 'Diagnose a simulated account/profile issue using exactly these tools.',
  },
  {
    id: 'its-03-lesson-02', number: '3.2', icon: 'ri-terminal-box-line',
    title: 'Boot & Performance Troubleshooting, Command-Line Tools & Cross-Platform Awareness', minutes: 90,
    learn: [
      'The core command-line tools every technician should know by heart',
      'The right order of steps when a machine won\'t boot properly',
      'How to tell an application-specific slowdown from a system-wide one',
      'Where the Mac and Linux equivalents of the Windows tools you\'ve learned actually live',
    ],
    topics: [
      { heading: 'Your Core Command-Line Toolkit', body: 'ipconfig /all shows IP address, gateway, and DNS servers — the first check on almost any connectivity ticket. systeminfo dumps a full config report for a ticket note. sfc /scannow repairs corrupted Windows system files. chkdsk checks a drive for errors and usually needs to run on the next restart.' },
      { heading: 'When a Machine Won\'t Boot', body: 'Start with Safe Mode — it loads only essential drivers, quickly telling you whether a third-party driver or app is the cause. System Restore rolls back system files and settings (not personal files) to an earlier point. A full reinstall is a much bigger step, reserved for after lighter options are ruled out.' },
      { heading: 'One App Slow, or the Whole Machine?', body: 'A single sluggish application while everything else runs fine points to that application. A machine slow across everything points more toward low memory, a failing disk, too many startup programs, or malware.' },
      { heading: 'Beyond Windows', body: 'This program is built around Windows, but you\'ll eventually get a Mac or Linux call. On a Mac, Activity Monitor plays Task Manager\'s role and Console is roughly Event Viewer. On Linux, top (or htop) and journalctl serve similar diagnostic purposes.' },
    ],
    practice: [
      'Open an elevated Command Prompt on your lab VM and run ipconfig /all and systeminfo, recording your IP address, default gateway, OS build number, and total RAM.',
      'Write one sentence describing when you\'d move to Safe Mode versus just trying a normal restart first.',
    ],
    comingUp: 'You\'ll be handed a machine with a real boot problem and asked to work through the right escalation ladder to fix it.',
  },
];

itsRegisterCoachModule({
  moduleNumber: 3, moduleKey: 'its-03', coachId: 'hd-m03', labKeys: ['lab-its-03-blank-desktop'],
  lessons: ITS03_LESSONS,
  lede: 'Now that your lab environment is built and you\'ve handled your first hardware tickets, go deeper into Windows itself — efficient navigation, account and profile management, and diagnosing problems with the operating system\'s own built-in tools.',
  labDescription: 'Resolve a real corrupted-profile ticket (HD-2109) end to end in the IT Service Desk simulator: read the evidence, work the troubleshooting path, diagnose against the log, document it, and resolve it. A coach spotlights each step for you.',
});

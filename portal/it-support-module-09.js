/* Module 09 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content only; uses the shared simple-module template in
 * it-support-shared.js (itsSimpleModuleView) since this module's lab has
 * not been spec'd or built yet — see data.js's compliance.sourceNotes on
 * the it-support program entry. Content sourced from
 * Module_9_Student_Content.docx.
 */

const ITS09_LESSONS = [
  {
    id: 'its-09-lesson-01', number: '9.1', icon: 'ri-spam-2-line',
    title: 'Recognizing Phishing & Social Engineering', minutes: 60,
    learn: [
      'Common indicators of a phishing attempt, even a well-crafted one',
      'What social engineering looks like outside of email',
      'What to do the moment you suspect something is a phishing or social engineering attempt',
    ],
    topics: [
      { heading: 'Phishing Indicators Worth Knowing', body: 'Modern phishing often looks polished, but common tells still show up: a sender address close to legitimate but not quite right, urgency designed to make you act before you think, an unexpected link or attachment, or a request for credentials a legitimate service would never ask for over email.' },
      { heading: 'Social Engineering Isn\'t Just Email', body: 'A phone call claiming to be "IT" asking for a password, someone without a badge asking you to hold a door, a vendor calling to "verify" account details — social engineering targets people, not just inboxes. The same skepticism that applies to a suspicious email applies here.' },
      { heading: 'What to Actually Do', body: 'The moment something feels off, never quietly decide it\'s probably fine and continue. If a message or request has credible warning signs, stop and follow your organization\'s security-escalation process. A false alarm costs some time — a fair trade against the cost of being wrong about a real threat.' },
    ],
    practice: [
      'Write down three specific details that would make you suspicious of an email claiming to be from your company\'s IT department asking you to "verify your password."',
    ],
    comingUp: 'You\'ll review a set of realistic messages and requests, and correctly identify which are legitimate and which need escalation.',
  },
  {
    id: 'its-09-lesson-02', number: '9.2', icon: 'ri-key-2-line',
    title: 'Credential Handling, Least Privilege & MFA Awareness', minutes: 60,
    learn: [
      'Why credential handling discipline matters even for "harmless" internal tasks',
      'What "least privilege" means and why it matters',
      'The basics of multi-factor authentication and why it matters for account security',
    ],
    topics: [
      { heading: 'Credential Handling Discipline', body: 'Never ask a user for their password, never type a password where someone else can see it, and never reuse credentials across systems that don\'t need to share them — the baseline that keeps one compromised account from becoming many.' },
      { heading: 'Least Privilege', body: 'Giving an account only the access it actually needs to do its job — not more, "just in case." An account with excess access is a bigger risk if it\'s ever compromised, since there\'s more it could be used to reach.' },
      { heading: 'MFA, At a Glance', body: 'Multi-factor authentication requires a second proof of identity beyond a password — usually a code or an approval tap. One of the single most effective security measures available; understanding why it matters helps you explain it to users who find it inconvenient.' },
    ],
    practice: [
      'Write one sentence explaining, in plain language, why MFA matters to a user who says "it\'s just annoying, can you turn it off for me?"',
    ],
    comingUp: 'You\'ll walk through a set of credential-handling and access scenarios, and decide the appropriate action for each.',
  },
];

function viewItsModuleNine(user, program) {
  return itsSimpleModuleView({
    user, program, moduleKey: 'its-09', moduleNumber: 9, lessons: ITS09_LESSONS,
    lede: 'Every technician is also, whether they realize it or not, a frontline defense against security threats. This module gives you the judgment to recognize when something isn\'t right — and to know exactly what to do about it.',
    labPreview: 'This module\'s guided lab isn\'t built yet — it will hand you a set of realistic messages to sort as legitimate or needing escalation, plus a set of credential-handling and access scenarios to work through.',
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 9, moduleKey: 'its-09', view: viewItsModuleNine });

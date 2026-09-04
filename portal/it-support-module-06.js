/* Module 06 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content only; uses the shared simple-module template in
 * it-support-shared.js (itsSimpleModuleView) since this module's lab has
 * not been spec'd or built yet — see data.js's compliance.sourceNotes on
 * the it-support program entry. Content sourced from
 * Module_6_Student_Content.docx.
 */

const ITS06_LESSONS = [
  {
    id: 'its-06-lesson-01', number: '6.1', icon: 'ri-lock-unlock-line',
    title: 'Password Resets, Account Unlocks & Reading Account Status Correctly', minutes: 120,
    learn: [
      'How to reset a password and force a password change at next login',
      'How to unlock an account',
      'The real difference between locked, disabled, and expired — three states that sound similar but need completely different fixes',
      'The difference between a domain account and a local account',
      'A consistent verification habit to apply before you touch any account, every time',
    ],
    topics: [
      { heading: 'Resetting a Password', body: 'Resetting a password through Active Directory Users and Computers is straightforward — but forcing a change at next login is what actually keeps the account secure, since it means you\'re never the last person who knew their password.' },
      { heading: 'Locked vs. Disabled vs. Expired — Don\'t Mix These Up', body: 'Locked (too many failed attempts) usually just needs unlocking. Disabled was deliberately turned off by an administrator — a different action. Expired means a time limit passed and needs its expiration extended, not just an unlock. Treating one as another is one of the most common new-technician mistakes.' },
      { heading: 'Domain Accounts vs. Local Accounts', body: 'A domain account is managed centrally through Active Directory and works across the organization. A local account exists only on one machine. Which type someone is using changes where you go to fix "my password isn\'t working."' },
      { heading: 'Verify Before You Act — Every Time', body: 'Every identity action follows the same discipline: verify who you\'re talking to, verify the request is legitimate and authorized, perform only the specific action requested, verify the result worked, and document what you did. Skipping verification is exactly how account takeovers happen.' },
    ],
    practice: [
      'On your server VM, lock a test account on purpose (repeated failed logins), then unlock it. Before you do, write down how you\'d verify the person requesting the unlock is actually who they say they are.',
      'Separately, disable a different test account and explain in one sentence why that\'s a different action than an unlock.',
    ],
    comingUp: 'You\'ll receive tickets describing locked, disabled, and expired accounts, and have to correctly identify which is which before applying the right fix.',
  },
  {
    id: 'its-06-lesson-02', number: '6.2', icon: 'ri-team-line',
    title: 'Group Membership & Access Troubleshooting', minutes: 120,
    learn: [
      'How to check what groups a user currently belongs to',
      'How to add or remove a user from a group',
      'How to recognize when a ticket is actually about permissions, not access',
    ],
    topics: [
      { heading: 'Checking Group Membership', body: 'A user\'s access to shared resources usually comes from which groups they belong to, not any setting on their individual account. The Member Of tab in Active Directory Users and Computers is typically the fastest way to see what they can and can\'t reach.' },
      { heading: 'A Very Common Ticket Pattern', body: 'A user changes teams or roles and their access doesn\'t update — still in the old group, not the new one. Worth checking first for "I can\'t access X" tickets, but confirm actual group membership before treating it as the diagnosis, and confirm authorization with the resource owner before adding anyone.' },
      { heading: 'Recognizing a Permissions Problem', body: 'If a user can log in and reach the server but is denied access to one specific resource, that\'s a permissions/group-membership issue, not a broader account problem — separating these categories quickly keeps you from troubleshooting the wrong thing.' },
    ],
    practice: [
      'On your server VM, add your test user to a new group, then remove them from a different group, and record the before-and-after group membership.',
    ],
    comingUp: 'A user reports they lost access to a shared resource after changing departments — you\'ll trace it to a group membership issue and fix it.',
  },
  {
    id: 'its-06-lesson-03', number: '6.3', icon: 'ri-cloud-line',
    title: 'Introductory Entra ID & M365 Identity Scenarios', minutes: 120,
    learn: [
      'What Entra ID is, at an introductory level, and how it relates to traditional Active Directory',
      'The basics of an MFA reset scenario',
      'How shared mailbox and distribution list access requests typically work',
      'What license assignment means and why it shows up on identity tickets',
    ],
    topics: [
      { heading: 'Entra ID — Identity in the Cloud', body: 'Entra ID (formerly Azure AD) is Microsoft\'s cloud-based identity system, run alongside or instead of traditional AD. Concepts carry over — users, groups, access — but managed through different tools (the M365 admin center or Entra admin center). At this level, just recognize cloud identity work can live in more than one place.' },
      { heading: 'MFA Reset, At the L1 Level', body: 'When a user loses their phone or can\'t complete MFA, they need their method reset to re-register a new device. At this level: understand the concept and verify who you\'re talking to before touching anything security-related, more than performing advanced configuration.' },
      { heading: 'Shared Mailboxes & Distribution Lists', body: 'A shared mailbox lets multiple people access one inbox (like support@); a distribution list sends one email to many individual inboxes at once. Common, straightforward access-request tickets once you know which one someone actually needs.' },
      { heading: 'License Assignment Awareness', body: 'Users need a license assigned before using Outlook, Teams, or Word through Microsoft 365. "My Teams won\'t open" is sometimes a missing or expired license, not a technical fault — worth checking early since it\'s a much faster fix once recognized.' },
    ],
    practice: [
      'Write one sentence explaining, in plain language, the difference between a shared mailbox and a distribution list — as if explaining it to a user who asked to be added to "the support email" and isn\'t sure which one they need.',
    ],
    comingUp: 'You\'ll work through a guided cloud-identity scenario covering an MFA reset request and a shared mailbox access request.',
  },
];

function viewItsModuleSix(user, program) {
  return itsSimpleModuleView({
    user, program, moduleKey: 'its-06', moduleNumber: 6, lessons: ITS06_LESSONS,
    lede: 'You know the structure of Active Directory now — this module puts it to work solving the identity tickets you\'ll see more than almost any other type, from password resets to modern cloud-identity scenarios.',
    labPreview: 'This module\'s guided lab isn\'t built yet — it will hand you tickets describing locked, disabled, and expired accounts to correctly identify, a group-membership access issue to trace and fix, and a cloud-identity scenario covering an MFA reset and shared mailbox request.',
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 6, moduleKey: 'its-06', view: viewItsModuleSix });

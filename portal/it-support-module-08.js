/* Module 08 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content sourced from Module_8_Student_Content.docx. Lab is a
 * guided walkthrough of two real tickets ('hd-m08') in the IT Service Desk
 * simulator — see it-support-shared.js's itsRegisterCoachModule.
 */

const ITS08_LESSONS = [
  {
    id: 'its-08-lesson-01', number: '8.1', icon: 'ri-remote-control-2-line',
    title: 'Remote Support Etiquette & Tools', minutes: 60,
    learn: [
      'How to get proper consent before starting a remote session',
      'How to verify you\'re actually talking to who you think you are',
      'How to use Quick Assist for a remote session',
      'Why narrating what you\'re doing out loud matters',
    ],
    topics: [
      { heading: 'Consent Comes First, Every Time', body: 'Before connecting to any user\'s machine, you need their clear consent — not just an assumption that a ticket means permission. Explain what you\'re about to do and why before you start, every single time, no exceptions.' },
      { heading: 'Verifying Who You\'re Talking To', body: 'Especially over phone or chat, follow your organization\'s approved identity-verification procedure before doing anything sensitive. A name, employee ID, or department is useful context, but isn\'t a verification process on its own.' },
      { heading: 'Quick Assist and Enterprise Tools', body: 'Quick Assist is Windows\' built-in remote support tool — a good place to build comfort with connecting, viewing, and controlling a remote screen. Enterprise tools like ConnectWise ScreenConnect work similarly but add session logging and unattended access; the underlying etiquette is the same.' },
      { heading: 'Narrate What You\'re Doing', body: 'Talking through your actions while connected — "I\'m opening Device Manager now, checking your webcam driver" — keeps the user informed, builds trust, and often surfaces information they wouldn\'t have thought to mention otherwise.' },
    ],
    practice: [
      'Write a short script (3–4 sentences) of exactly what you\'d say to a user in the first 30 seconds of a remote session, from asking for consent through confirming you\'re connected.',
    ],
    comingUp: 'You\'ll conduct a simulated remote session, observed for consent, verification, and narration.',
  },
  {
    id: 'its-08-lesson-02', number: '8.2', icon: 'ri-flow-chart',
    title: 'Structured Troubleshooting & Stop-and-Escalate Judgment', minutes: 60,
    learn: [
      'How to apply structured troubleshooting to a problem you\'ve genuinely never seen before',
      'How to recognize the point where you should stop attempting a fix and escalate instead',
    ],
    topics: [
      { heading: 'Structure Beats Memorization', body: 'You can\'t memorize a fix for every possible problem — but the five-step mindset from Module 1 (gather, reproduce, isolate, resolve or escalate, verify and document) works on a problem you\'ve never seen just as well as one you\'ve fixed a hundred times, because it\'s a method, not a memorized answer.' },
      { heading: 'Recognizing the Stop Point', body: 'Good technicians aren\'t the ones who never escalate — they\'re the ones who recognize the right moment to. Escalate when the approved path has been exhausted, the fix needs access or authority outside your role, the issue enters a security or high-risk area, or continuing would create unacceptable risk or delay.' },
    ],
    practice: [
      'Describe, in your own words, a specific ticket type where you\'d escalate after just one finding, and a different one where the approved troubleshooting path would reasonably take several checks first.',
    ],
    comingUp: 'You\'ll be given a problem outside anything covered in this program and asked to work it using the method alone, then decide whether to resolve or escalate.',
  },
];

itsRegisterCoachModule({
  moduleNumber: 8, moduleKey: 'its-08', coachId: 'hd-m08', labKeys: ['lab-its-08-unfamiliar-problems'],
  lessons: ITS08_LESSONS,
  lede: 'You\'ve learned to fix specific things — now this module is about how you work: connecting to a user\'s machine responsibly, and applying a consistent method to any problem you haven\'t seen before.',
  labDescription: 'Resolve two real unfamiliar-shaped tickets end to end in the IT Service Desk simulator — a broken domain trust (HD-2110) and a BitLocker recovery (HD-2111) — applying the troubleshooting method itself, not a memorized fix. A coach spotlights each step for you.',
});

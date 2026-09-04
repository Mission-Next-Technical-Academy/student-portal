/* Module 11 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content sourced from Module_11_Student_Content.docx. Lab is a
 * guided walkthrough of a real ticket ('hd-m11') in the IT Service Desk
 * simulator — see it-support-shared.js's itsRegisterCoachModule.
 */

const ITS11_LESSONS = [
  {
    id: 'its-11-lesson-01', number: '11.1', icon: 'ri-quill-pen-line',
    title: 'Writing Notes the Next Technician Can Actually Use', minutes: 90,
    learn: [
      'What separates a genuinely useful ticket note from a weak one',
      'How to document a fix so someone else could pick it up cold',
      'How to search and use the knowledge base effectively',
    ],
    topics: [
      { heading: 'What a Good Note Actually Contains', body: 'A strong ticket note answers four questions clearly: what was reported, what you checked, what you did, and what the result was. Leave any one out, and the next person has to guess or start over.' },
      { heading: 'Writing for a Stranger, Not for Yourself', body: 'The real test: could a technician who\'s never seen this ticket read it and understand exactly what happened and why? "Fixed it" is not a note. "Rolled back the display driver after confirming the error started following last night\'s Windows Update; verified working after restart" is.' },
      { heading: 'Using the Knowledge Base', body: 'Before writing up a fix from scratch, check whether someone has documented this exact problem before — the knowledge base exists so the same diagnosis doesn\'t have to happen twice. Searching it well (symptoms and error codes, not vague descriptions) is its own skill.' },
    ],
    practice: [
      'Take the weakest ticket note you can imagine ("user had a problem, I fixed it") and rewrite it as a complete, useful note for a printer issue of your choosing.',
    ],
    comingUp: 'You\'ll search a small knowledge base for a ticket matching a new issue, then write a complete note that references what you found and adds anything the KB entry didn\'t cover.',
  },
  {
    id: 'its-11-lesson-02', number: '11.2', icon: 'ri-chat-check-line',
    title: 'Escalation Triggers, User Updates & Expectation Setting', minutes: 120,
    learn: [
      'What specifically should trigger an escalation, beyond just "this is hard"',
      'How to keep a user updated without over-promising',
      'How to set expectations clearly from the very first response',
    ],
    topics: [
      { heading: 'Real Escalation Triggers', body: 'Escalation is appropriate when a fix requires access or authority you don\'t have, when a ticket\'s impact has grown beyond what you initially thought, or when an SLA deadline is at real risk and a second set of hands would help meet it.' },
      { heading: 'Updating Users Without Overpromising', body: 'A user doesn\'t need constant updates, but needs to not wonder if they\'ve been forgotten. A brief, honest update — "still working on this, here\'s what I\'ve ruled out, next update by end of day" — builds far more trust than silence or a vague promise.' },
      { heading: 'Setting Expectations From the Start', body: 'The first response is where expectation-setting starts: acknowledging the issue, giving a realistic timeline if you have one, and being honest about what you don\'t know yet. Getting this right up front prevents most frustrated follow-up messages later.' },
    ],
    practice: [
      'Write a first-response message to a user whose issue you haven\'t diagnosed yet, that acknowledges their ticket and sets a fair expectation without overpromising a specific fix time.',
    ],
    comingUp: 'You\'ll be handed several simulated tickets and decide, for each, whether to resolve it yourself or escalate it — sending a clear user update either way.',
  },
];

itsRegisterCoachModule({
  moduleNumber: 11, moduleKey: 'its-11', coachId: 'hd-m11', labKeys: ['lab-its-11-handoff-documentation'],
  lessons: ITS11_LESSONS,
  lede: 'The technical fix is only half the job — this module is about the other half: writing it down well, communicating it clearly, and handing it off cleanly when it\'s not yours to finish.',
  labDescription: 'Work a real ticket end to end in the IT Service Desk simulator, focused on documentation and escalation (HD-2113, an expired VPN gateway certificate) — recognize the escalation trigger and write a note a stranger could act on. A coach spotlights each step for you.',
});

/* Module 10 — IT Help Desk & Career Accelerator ('it-support').
 * Lesson content sourced from Module_10_Student_Content.docx. Lab is a
 * guided walkthrough of the real, full ticket queue ('hd-m10') in the IT
 * Service Desk simulator — see it-support-shared.js's itsRegisterCoachModule.
 */

const ITS10_LESSONS = [
  {
    id: 'its-10-lesson-01', number: '10.1', icon: 'ri-file-list-2-line',
    title: 'Anatomy of a Ticket: Fields, Categories & Status', minutes: 90,
    learn: [
      'What information a complete ticket needs to capture',
      'How tickets get categorized, and why the category matters',
      'What the different status values on a ticket actually mean',
    ],
    topics: [
      { heading: 'What Belongs in a Ticket', body: 'A properly created ticket captures who reported the issue, what they\'re experiencing in their own words, when it started, what device or system is involved, and what\'s already been tried. Missing any of these means the next person starts with less information than you had.' },
      { heading: 'Categories Matter More Than They Seem', body: 'Categorizing a ticket correctly (endpoint, identity, network, and so on) isn\'t just filing paperwork — it\'s what routes the ticket to the right queue, the right technician, and shapes how it\'s prioritized against everything else waiting.' },
      { heading: 'Reading Ticket Status', body: 'Status values like New, In Progress, Pending User Response, and Resolved each imply a specific next action, and whose job it is to take it. A ticket in "Pending User Response" needs a different follow-up than one "In Progress" with no update in two days.' },
      { heading: 'Ownership', body: 'Every ticket needs a clear owner at any given moment — the person responsible for moving it forward. A ticket with no clear owner is a ticket that quietly stalls.' },
    ],
    practice: [
      'Take a ticket description of your choosing and identify what information is missing that a complete ticket would need.',
    ],
    comingUp: 'You\'ll rewrite a set of genuinely weak ticket notes into complete, properly categorized ones.',
  },
  {
    id: 'its-10-lesson-02', number: '10.2', icon: 'ri-alarm-warning-line',
    title: 'Impact, Urgency, Priority & SLAs', minutes: 120,
    learn: [
      'The difference between impact and urgency, and how they combine into priority',
      'What a Service Level Agreement (SLA) is and why it drives your work',
      'How to sequence a mixed queue of tickets by more than just the order they arrived',
    ],
    topics: [
      { heading: 'Impact vs. Urgency', body: 'Impact is about scope — how many people or how much of the business is affected. Urgency is about time pressure — how quickly this needs to be resolved. Many service desks combine impact and urgency into priority, but the exact formula varies by organization.' },
      { heading: 'What an SLA Actually Is', body: 'An SLA defines the service commitments a provider makes to a customer — broader than just a timer, but in day-to-day work you\'ll mostly experience it through response and resolution targets tied to a ticket\'s priority (e.g. Critical = 1-hour response, Low = 2 business days).' },
      { heading: 'Incident vs. Request', body: 'An incident is something broken that needs fixing (a printer that stopped working). A request is something a user is asking for that isn\'t broken (a new software install, an access change). They\'re handled differently.' },
      { heading: 'Sequencing a Real Queue', body: 'Working ten tickets in arrival order is rarely the right call. Sorting by actual priority — impact and urgency combined, SLA deadlines approaching — is what separates a technician actually managing their queue from one just working through a list.' },
    ],
    practice: [
      'Given four short ticket descriptions of your choosing, rank them in the order you\'d actually work them, and explain your reasoning for the order in one sentence each.',
    ],
    comingUp: 'You\'ll be handed a full mixed queue of tickets and asked to prioritize and sequence them correctly.',
  },
];

itsRegisterCoachModule({
  moduleNumber: 10, moduleKey: 'its-10', coachId: 'hd-m10', labKeys: ['lab-its-10-priority-queue'],
  lessons: ITS10_LESSONS,
  lede: 'Every ticket you\'ll ever work has a structure underneath it. This module teaches you that structure — the fields, the priorities, the service-level expectations — so you can move through a queue with confidence instead of guesswork.',
  labDescription: 'Work the real, full ticket queue in the IT Service Desk simulator: filter it down to P1 by priority, open a real P1 ticket, and document why it sorts to the top of the shift. A coach spotlights each step for you.',
});

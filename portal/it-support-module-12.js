/* Module 12 — IT Help Desk & Career Accelerator ('it-support') capstone.
 * Fictional org, tickets, and scenario data; no real systems are involved.
 * The six tickets are drawn from the same fictional "Northstar Distribution
 * Group" environment as ui/helpdesk.js (this module's ticket-queue lab is
 * self-contained on this page, like Module 1's Lab 1.2 — it does not route
 * out to that separate simulator app). Reuses the shared ticket-queue
 * widget from it-support-shared.js, as called for by the Module 1/2 lab
 * specs. Content sourced from Module_12_Student_Content.docx.
 */

const ITS12_LESSON = {
  id: 'its-12-lesson-01', number: '12.1', icon: 'ri-trophy-line',
  title: 'Your Capstone: What to Expect', minutes: 30,
  learn: [
    'Work a realistic set of L1 tickets spanning everything you\'ve learned',
    'Prioritize, troubleshoot, communicate, and document exactly as you\'ve practiced',
    'Make real resolve-or-escalate decisions with no instructor cueing you toward the answer',
    'Produce at least one knowledge-base article and complete an after-action review',
  ],
  body: 'Nothing in this capstone is new — that\'s the point. You\'ll receive a realistic set of L1 tickets spanning identity, endpoint, peripheral, network, and security issues. Prioritize them the way you learned in Module 10, work through them with the troubleshooting mindset from Module 1, and make real resolve-or-escalate calls throughout. By the end you\'ll have resolved everything within your scope, escalated anything genuinely outside it, written at least one knowledge-base article, and completed an honest after-action review of your own performance.',
};

const ITS12_RUBRIC = [
  { label: 'Triage & Prioritization', points: 15 },
  { label: 'Technical Accuracy', points: 20 },
  { label: 'Communication', points: 15 },
  { label: 'Escalation Judgment', points: 15 },
  { label: 'Security Judgment', points: 10 },
  { label: 'KB Article Quality', points: 15 },
  { label: 'After-Action Review', points: 10 },
];

const ITS12_CATEGORY_OPTIONS = [
  { value: 'identity', label: 'Identity / Account' },
  { value: 'endpoint', label: 'Endpoint' },
  { value: 'network', label: 'Network' },
  { value: 'peripheral', label: 'Peripheral / Printer' },
  { value: 'security', label: 'Security Incident' },
  { value: 'server', label: 'Server / Infrastructure' },
];

/* Six tickets from the fictional Northstar Distribution Group environment,
 * spanning every category the capstone narrative calls for. priority is the
 * ticket's band (P1 = work first); the student never sees it, or the
 * category. Any order inside a band earns the triage credit. correctRank is
 * this ticket's position in a correctly-prioritized queue (1 = work first),
 * and inside a band it is the SLA-time-left order: matching it shows as
 * "exceeds" on the instructor sheet and doesn't change the score. */
const ITS12_SOURCES = [
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'Supplementary public reference spanning the identity, endpoint, network, and security topics this capstone integrates.' },
];

const ITS12_TICKETS = [
  { id: 'SEC-2114', from: 'Luis Ortega · Sales', message: 'I clicked a link in an email that looked like it was from IT asking me to verify my password. I think I typed it in before I realized something was off.',
    category: 'security', decision: 'escalate', priority: 'P1', correctRank: 1,
    firstStepPattern: /(do ?n[o'’]?t|not to|never) (reset|click|enter|type)|isolat|disconnect|unplug|off (the )?(network|wi-?fi)|stop using|\bcontain(ment)?\b/i,
    rejectStepPattern: /\b(do ?n[o'’]?t|never|no need to|shouldn[o'’]?t) (isolat|disconnect|unplug|contain)/i,
    reasoningPattern: /phishing|credential|compromis|security|escalat/i,
    explain: 'A credential-phishing incident is always the highest priority — contain first (don\'t let the user "fix" it themselves), then escalate to the security-incident process immediately.' },
  { id: 'HD-2110', from: 'Sofia Martin · Operations', message: 'My computer says it can\'t connect to the domain anymore. It was fine until I restored a VM snapshot from before I left for lunch.',
    category: 'server', decision: 'escalate', priority: 'P2', correctRank: 2,
    firstStepPattern: /confirm (the )?scope|anyone else|other (users|machines|computers|devices)|test-computersecurechannel|secure ?channel|nltest|(check|verify|test)\b.{0,30}trust/i,
    reasoningPattern: /domain trust|server|outside|scope|escalat|tier ?2/i,
    explain: 'A broken domain trust relationship is outside L1 authority to repair directly — confirm the scope, then escalate to the server/infrastructure team.' },
  { id: 'HD-2104', from: 'Priya Shah · HR', message: 'My laptop shows it\'s connected to Wi-Fi but I can\'t reach anything — not even our internal site.',
    category: 'network', decision: 'resolve', priority: 'P2', correctRank: 3,
    firstStepPattern: /ipconfig|apipa|renew|dhcp|release/i,
    reasoningPattern: /apipa|dhcp|169\.254|network|l1|scope/i,
    explain: 'A 169.254 APIPA-style symptom is a DHCP issue squarely within L1 scope — reconnect/renew the client-side network configuration first.' },
  { id: 'SR-2107', from: 'Grace Kim · HR', message: 'I moved to a new team last week and I still can\'t open the folder my new team uses. My login works fine otherwise.',
    category: 'identity', decision: 'resolve', priority: 'P3', correctRank: 4,
    firstStepPattern: /group|member ?of|active directory|add (the|her|him|them)/i,
    reasoningPattern: /group|member|access|l1|scope/i,
    explain: 'Logging in fine but denied one specific resource is the classic group-membership pattern — check Member Of, confirm with the resource owner, then fix it.' },
  { id: 'HD-2109', from: 'Noah Williams · Sales', message: 'My desktop is suddenly completely empty and all my settings reset, but I can still log in fine.',
    category: 'endpoint', decision: 'resolve', priority: 'P3', correctRank: 5,
    firstStepPattern: /profile|temporary profile|rebuild|new (local )?profile/i,
    reasoningPattern: /profile|account|corrupt|l1|scope/i,
    explain: 'Logging in fine but a suddenly empty desktop and reset settings is a corrupted profile, not an account problem — well within L1 scope to rebuild.' },
  { id: 'HD-2106', from: 'Elena Ruiz · Logistics', message: 'Nothing will print from my computer today, and I saw an error about the print spooler when I looked.',
    category: 'peripheral', decision: 'resolve', priority: 'P4', correctRank: 6,
    firstStepPattern: /spooler|restart|print queue|clear/i,
    reasoningPattern: /spooler|print|queue|l1|scope/i,
    explain: 'A single user\'s print spooler issue is routine peripheral triage — clear the queue and restart the Print Spooler service.' },
];

const ITS12_LAB_ID = 'its12-capstone-v1';
const ITS12_LAB_KEY = 'lab-its-12-capstone';
const ITS12_PASSING_SCORE = 70;
const ITS12_MIN_ANSWER_LENGTH = 15;

/* The queue positions a ticket's band holds: P1 tickets fill the first
 * positions, then P2, and so on. Worked out from the tickets, so it holds
 * when they change. → { first, last, size } */
function its12BandPositions(ticket) {
  const bands = [...new Set(ITS12_TICKETS.map((t) => t.priority))].sort();
  let first = 1;
  for (const band of bands) {
    const size = ITS12_TICKETS.filter((t) => t.priority === band).length;
    if (band === ticket.priority) return { first, last: first + size - 1, size };
    first += size;
  }
  return { first: 0, last: -1, size: 0 };
}

// Triage credit: the rank falls inside the ticket's band.
function its12RankInBand(ticket, rank) {
  const { first, last } = its12BandPositions(ticket);
  const n = Number(rank);
  return Number.isInteger(n) && n >= first && n <= last;
}

// Every ticket in a band of two or more is in its exact SLA position.
function its12BandExceeds(ticket, responses) {
  const band = ITS12_TICKETS.filter((t) => t.priority === ticket.priority);
  return band.length > 1 && band.every((t) => Number((responses[t.id] || {}).priority) === t.correctRank);
}

// A first step earns technical credit only as a real action, not a bare
// decision. A ticket's optional rejectStepPattern refuses a step that
// matches anyway, e.g. the action negated ("do not isolate").
function its12FirstStepOk(ticket, firstStep) {
  const step = String(firstStep || '').trim();
  return step.length >= ITS12_MIN_ANSWER_LENGTH && ticket.firstStepPattern.test(step)
    && !(ticket.rejectStepPattern && ticket.rejectStepPattern.test(step));
}

// The first rank given to more than one ticket, with how many times. → { rank, count } | null
function its12RepeatedRank(responses) {
  const counts = new Map();
  ITS12_TICKETS.forEach((t) => {
    const rank = Number((responses[t.id] || {}).priority);
    if (rank) counts.set(rank, (counts.get(rank) || 0) + 1);
  });
  const repeated = [...counts].filter(([, count]) => count > 1).sort((a, b) => a[0] - b[0])[0];
  return repeated ? { rank: repeated[0], count: repeated[1] } : null;
}

const ITS12_DEFAULT_STATE = {
  activeTicket: ITS12_TICKETS[0].id, ticketResponses: {}, kbArticle: '', afterAction: '',
  attempts: 0, validationError: '', resetArmed: false,
};

let its12State = null;
let its12User = null;
let its12Submitting = false;

function its12Load(user) {
  its12User = user;
  its12State = LabRuntime.load(ITS12_LAB_ID, user, ITS12_DEFAULT_STATE);
  if (!its12State.ticketResponses || typeof its12State.ticketResponses !== 'object') its12State.ticketResponses = {};
  if (!ITS12_TICKETS.some((t) => t.id === its12State.activeTicket)) its12State.activeTicket = ITS12_TICKETS[0].id;
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-12');
  return its12State;
}

/* Where this student's capstone stands, from the server's newest attempt
 * (user.latestLabAttemptByKey, loaded at sign-in and updated after a save),
 * never from browser storage. Students see no score or pass/fail until an
 * instructor finalizes the attempt (owner rule, 2026-10-20); the automated score goes to the
 * instructor only, as a starting point. */
function its12ReviewStage() {
  if (its12Submitting) return 'submitting';
  const attempt = typeof itsLabAttempt === 'function' ? itsLabAttempt(its12User, ITS12_LAB_KEY) : null;
  if (!attempt || !attempt.completedAt || attempt.supersededAt) return 'not_submitted';
  if (attempt.redoRequested) return 'returned';
  return attempt.reviewedAt ? 'finalized' : 'waiting';
}

// The database takes a new attempt only when there is none yet or the newest
// was returned (20261005210000_one_pending_prove_it_submission.sql).
function its12CanSubmit() {
  const stage = its12ReviewStage();
  return stage === 'not_submitted' || stage === 'returned';
}

// Answers can't change while an attempt is being saved or waits on the
// instructor; a return unlocks them.
function its12Locked() {
  const stage = its12ReviewStage();
  return stage === 'submitting' || stage === 'waiting';
}

function its12StatusLabel() {
  const labels = { submitting: 'Submitting…', waiting: 'Submitted for review', returned: 'Returned for revision', finalized: 'Finalized by your instructor' };
  const stage = its12ReviewStage();
  if (labels[stage]) return labels[stage];
  const started = Object.keys(its12State.ticketResponses || {}).length || (its12State.kbArticle || '').trim() || (its12State.afterAction || '').trim();
  return started ? 'In progress' : 'Not started';
}

function its12Save() {
  if (its12User && its12State) LabRuntime.save(ITS12_LAB_ID, its12User, its12State);
}

function its12LessonCard() {
  const lesson = ITS12_LESSON;
  return `<details class="its12-lesson" data-its12-lesson="${esc(lesson.id)}" open>
    <summary><span class="its12-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its12-chevron" aria-hidden="true"></i></summary>
    <div class="its12-lesson-body">
      <h4>What You'll Do</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      <h4>How You're Evaluated</h4>
      <p>${esc(lesson.body)}</p>
      <div class="its12-rubric">${ITS12_RUBRIC.map((r) => `<div><strong>${r.points} pts</strong><span>${esc(r.label)}</span></div>`).join('')}</div>
    </div>
  </details>`;
}

function its12TicketQueue() {
  return itswTicketQueue({
    tickets: ITS12_TICKETS, activeId: its12State.activeTicket, responses: its12State.ticketResponses,
    categoryOptions: ITS12_CATEGORY_OPTIONS, showPriority: true, priorityCount: ITS12_TICKETS.length,
    locked: its12Locked(),
  });
}

function its12ScorePanel() {
  if (its12State.validationError) {
    return `<div class="its12-validation" id="its12-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the capstone</strong><p>${esc(its12State.validationError)}</p></div></div>`;
  }
  const stage = its12ReviewStage();
  if (stage === 'submitting') {
    return `<div class="its12-score-empty" id="its12-feedback" role="status" tabindex="-1">Submitting your capstone…</div>`;
  }
  if (stage === 'waiting') {
    return `<div class="its12-score-empty" id="its12-feedback" role="status" tabindex="-1"><strong>Submitted to your instructor for review.</strong> Your result and your instructor's notes will appear here once they have finalized it. You can't submit again while this attempt is waiting.</div>`;
  }
  if (stage === 'returned') {
    return `<div class="its12-score-empty" id="its12-feedback" role="status" tabindex="-1"><strong>Your instructor returned this attempt.</strong> Read their notes above, revise your answers, then submit your capstone again.</div>`;
  }
  if (stage === 'finalized') {
    const link = typeof markedLabLinkHtml === 'function' ? ` ${markedLabLinkHtml(ITS12_LAB_KEY, 'See your result and notes')}` : '';
    return `<div class="its12-score-empty" id="its12-feedback" role="status" tabindex="-1"><strong>Your instructor has finalized your capstone.</strong>${link}</div>`;
  }
  return `<div class="its12-score-empty" id="its12-feedback" role="status">Your answers save automatically. Submit once every ticket has a priority rank, category, first step, decision, and reasoning, and both the KB article and after-action review are written. Your instructor reviews every capstone; your result appears here once they finalize it.</div>`;
}

function its12ActionButtons() {
  const off = its12CanSubmit() ? '' : ' disabled aria-disabled="true" aria-describedby="its12-feedback"';
  return `<button class="its12-submit" type="button" data-its12-submit${off}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Submit my capstone</button><button class="its12-reset" type="button" data-its12-reset${off}><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab</button>`;
}

function its12ExtrasAndActions() {
  const lock = its12Locked() ? ' disabled' : '';
  return `<div class="its12-extra">
    <label for="its12-kb">Knowledge-base article</label>
    <p class="its12-extra-hint">Write at least one KB article based on something you worked through above — symptom, cause, and fix, so the next technician doesn't have to re-diagnose it from scratch.</p>
    <textarea id="its12-kb" data-its12-kb rows="3"${lock} placeholder="Symptom… Cause… Fix… Verification…">${esc(its12State.kbArticle)}</textarea>
  </div>
  <div class="its12-extra">
    <label for="its12-after-action">After-action review</label>
    <p class="its12-extra-hint">Step back and review your own performance — what went well, what you'd do differently, and what you learned about your own troubleshooting instincts.</p>
    <textarea id="its12-after-action" data-its12-after-action rows="3"${lock} placeholder="What went well… What I'd do differently… What I learned…">${esc(its12State.afterAction)}</textarea>
  </div>
  <div class="its12-worksheet-actions">${its12ActionButtons()}</div>
  ${its12State.resetArmed && its12CanSubmit() ? `<div class="its12-reset-confirm" id="its12-reset-confirm" role="alert"><p><strong>Reset the capstone?</strong> All ticket answers, the KB article and the after-action review on this page will be cleared.</p><div><button type="button" data-its12-reset-confirm>Yes, reset the capstone</button><button type="button" data-its12-reset-cancel>Cancel</button></div></div>` : ''}
  ${its12ScorePanel()}`;
}

function viewItsModuleTwelve(user, program) {
  its12Load(user);
  const module = program.modules['its-12'];
  const navSections = [
    { id: 'expectations', title: 'Capstone preparation', type: 'lecture', isComplete: true, scrollId: 'its12-lesson-title' },
    { id: 'scenario', title: 'Integrated scenario', type: 'lab', phase: 'prove', isComplete: its12ReviewStage() === 'finalized', scrollId: 'its12-lab-title' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its12-sources', gated: false, supplemental: true },
  ];
  return `<div class="its12-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(navSections, { moduleKey: 'its12', stageKey: 'its-12' })}
    <main class="its12-main">
      <section class="its12-hero" aria-labelledby="its12-title"><p class="its12-kicker">Module 12 · Capstone · ${formatInstructionalMinutes(module.durationMinutes)}</p><h1 id="its12-title">${esc(module.title)}</h1><p class="its12-lede">Nothing new — this is where you prove you can do the job. A realistic queue, real resolve-or-escalate calls, a knowledge-base article, and an honest look back at your own work.</p>
        <dl class="its12-progress" aria-label="Saved capstone progress"><div><dt>Tickets</dt><dd>${ITS12_TICKETS.length}</dd></div><div><dt>Status</dt><dd id="its12-status">${esc(its12StatusLabel())}</dd></div></dl>
      </section>

      <section class="its12-section" aria-labelledby="its12-lesson-title"><div class="its12-section-heading"><span>L</span><div><p class="its12-kicker">Learn</p><h2 id="its12-lesson-title">What to expect</h2></div></div>${its12LessonCard()}</section>

      <section class="its12-section its12-lab-section" aria-labelledby="its12-lab-title"><div class="its12-section-heading"><span>P</span><div><p class="its12-kicker">Prove · passing score ${ITS12_PASSING_SCORE}/100</p><h2 id="its12-lab-title">The integrated scenario</h2></div></div>
        ${itsRedoNoticeHtml(user, [{ key: ITS12_LAB_KEY, action: 'Revise your answers using these notes, then submit your capstone again.' }])}
        <div class="its12-brief"><p>You're covering the Northstar Distribution Group help desk queue. Six tickets just came in, spanning identity, endpoint, network, peripheral, server, and a security concern. Rank them in the order you'd actually work them, then triage each one: category, first step, resolve-or-escalate, and your reasoning.</p></div>
        <div id="its12-lab-dynamic">
          ${its12TicketQueue()}
          ${its12ExtrasAndActions()}
        </div>
      </section>

      <section class="its12-section" id="its12-sources" aria-labelledby="its12-sources-title"><div class="its12-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its12-kicker">Reference — not a graded step</p><h2 id="its12-sources-title">Sources &amp; Further Reading</h2></div></div>${moduleSourcesBlock(ITS12_SOURCES)}</section>
    </main>
  </div>`;
}

function its12RenderQueue(focusId) {
  const listAndForm = document.querySelector('.its12-shell .itsw-tickets');
  if (listAndForm) listAndForm.outerHTML = its12TicketQueue();
  // Re-render the trailing extras+actions+score block (everything after the ticket queue).
  const root = document.getElementById('its12-lab-dynamic');
  document.querySelectorAll('.its12-shell .its12-extra, .its12-shell .its12-worksheet-actions, .its12-shell .its12-reset-confirm, .its12-shell .its12-score-empty, .its12-shell .its12-score, .its12-shell .its12-validation')
    .forEach((el) => el.remove());
  if (root) root.insertAdjacentHTML('beforeend', its12ExtrasAndActions());
  const status = document.getElementById('its12-status');
  if (status) status.textContent = its12StatusLabel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function its12Score() {
  let triageCorrect = 0;
  let technicalCorrect = 0;
  let communicationOk = 0;
  let escalationCorrect = 0;
  ITS12_TICKETS.forEach((ticket) => {
    const r = its12State.ticketResponses[ticket.id] || {};
    if (its12RankInBand(ticket, r.priority)) triageCorrect += 1;
    if (r.category === ticket.category && its12FirstStepOk(ticket, r.firstStep)) technicalCorrect += 1;
    const reasoning = (r.reasoning || '').trim();
    if (ticket.reasoningPattern.test(reasoning) && reasoning.length >= ITS12_MIN_ANSWER_LENGTH) communicationOk += 1;
    if (r.decision === ticket.decision) escalationCorrect += 1;
  });
  const triage = Math.round((triageCorrect / ITS12_TICKETS.length) * 15);
  const technical = Math.round((technicalCorrect / ITS12_TICKETS.length) * 20);
  const communication = Math.round((communicationOk / ITS12_TICKETS.length) * 15);
  const escalation = Math.round((escalationCorrect / ITS12_TICKETS.length) * 15);

  const secTicket = ITS12_TICKETS.find((t) => t.category === 'security');
  const secResponse = its12State.ticketResponses[secTicket.id] || {};
  const security = (secResponse.category === secTicket.category && secResponse.decision === secTicket.decision) ? 10 : 0;

  const criticalErrors = [];
  ITS12_TICKETS.filter((t) => t.category === 'security').forEach((ticket) => {
    const r = its12State.ticketResponses[ticket.id] || {};
    if (r.decision !== ticket.decision) {
      criticalErrors.push(`${ticket.id}: critical error. This attempt can't pass, whatever its overall score.`);
    }
  });

  const kb = its12State.kbArticle.trim();
  const kbOk = kb.length >= 80 && /(symptom|cause|fix|resolv|verif)/i.test(kb);
  const kbScore = kbOk ? 15 : (kb.length >= 40 ? 8 : 0);

  const after = its12State.afterAction.trim();
  const afterScore = after.length >= 40 ? 10 : (after.length >= 15 ? 5 : 0);

  // Domain scores only: no expected answers or explanations, because this
  // is saved with the attempt and the student can read it.
  const feedback = [
    `Triage ${triage}/15`, `Technical accuracy ${technical}/20`, `Communication ${communication}/15`,
    `Escalation judgment ${escalation}/15`, `Security handling ${security}/10`, `KB article ${kbScore}/15`,
    `After-action review ${afterScore}/10`,
  ];

  return {
    score: triage + technical + communication + escalation + security + kbScore + afterScore,
    breakdown: { triage, technical, communication, escalation, security, kb: kbScore, afterAction: afterScore },
    feedback,
    criticalErrors,
  };
}

/* Submit: one attempt to the instructor's queue. Returns the save promise
 * (tests await it); returns nothing when the attempt is refused or invalid. */
function its12Submit() {
  // An attempt is already waiting on the instructor (or approved), or a
  // save is in flight: the database would refuse another one.
  if (!its12CanSubmit()) {
    its12RenderQueue('its12-feedback');
    return;
  }
  const missing = ITS12_TICKETS.some((ticket) => {
    const r = its12State.ticketResponses[ticket.id] || {};
    return !r.priority || !r.category || !r.decision || !(r.firstStep || '').trim() || !(r.reasoning || '').trim();
  });
  if (missing || !its12State.kbArticle.trim() || !its12State.afterAction.trim()) {
    its12State.validationError = missing
      ? 'Every ticket needs a priority rank, category, first step, decision, and reasoning before you submit.'
      : 'Write both the KB article and the after-action review before you submit.';
    its12Save();
    its12RenderQueue('its12-feedback');
    return;
  }
  const repeated = its12RepeatedRank(its12State.ticketResponses);
  if (repeated) {
    its12State.validationError = `Rank ${repeated.rank} is used ${repeated.count === 2 ? 'twice' : `${repeated.count} times`}. Each ticket needs a different rank.`;
    its12Save();
    its12RenderQueue('its12-feedback');
    return;
  }
  // Scored for the instructor's review sheet only; the student sees no
  // score until the instructor finalizes the attempt.
  const result = its12Score();
  const passed = result.score >= ITS12_PASSING_SCORE && result.criticalErrors.length === 0;
  const attemptNumber = (its12State.attempts || 0) + 1;
  its12State.validationError = '';
  its12State.resetArmed = false;
  its12Submitting = true;
  its12RenderQueue('its12-feedback');
  // state 'complete': recordLabAttempt() stores a below-pass score as
  // 'submitted', and critical_errors keeps an attempt with a critical
  // error out of verified progress even if it scores 70 or more, so every
  // attempt, pass or fail, reaches the instructor's queue.
  const fields = {
    state: 'complete', score: result.score,
    rubricVersion: 'it-support-capstone-v1', scoringEngineVersion: 'it-support-capstone-scorer-v1',
    result: {
      breakdown: result.breakdown, criticalErrors: result.criticalErrors, critical_errors: result.criticalErrors,
      attempts: attemptNumber, ticketResponses: its12State.ticketResponses, kbArticle: its12State.kbArticle,
      afterAction: its12State.afterAction, feedback: result.feedback, passedAutomatedGate: passed,
    },
  };
  return itsSubmitLabAttempt(its12User, 'its-12', ITS12_LAB_KEY, fields).then((saved) => {
    its12Submitting = false;
    // Nothing reached the instructor: keep the answers; the portal shows
    // its shared save-failure message.
    if (saved) {
      its12State.attempts = attemptNumber;
      const artifactContent = {
        responses: its12State.ticketResponses,
        kbArticle: its12State.kbArticle,
        afterAction: its12State.afterAction,
        score: result.score,
        breakdown: result.breakdown,
        feedback: result.feedback,
        criticalErrors: result.criticalErrors,
        attemptNumber,
        passedAutomatedGate: passed,
      };
      if (typeof persistPortfolioArtifact === 'function') {
        persistPortfolioArtifact(its12User, {
          moduleKey: 'its-12', labKey: ITS12_LAB_KEY,
          kind: 'capstone_report', title: `IT Help Desk Capstone — attempt ${attemptNumber}`,
          content: artifactContent, rubricVersion: 'it-support-capstone-v1',
        });
      }
      if (passed) {
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its12User, 'it-support', 'its-12', ITS12_LAB_KEY);
        if (typeof recordCapstoneSubmission === 'function') {
          recordCapstoneSubmission(its12User, {
            score: result.score,
            answers: artifactContent,
            criticalErrorCount: result.criticalErrors.length,
            rubricVersion: 'it-support-capstone-v1',
          });
        }
      }
    }
    its12Save();
    its12RenderQueue('its12-feedback');
  });
}

function wireItsModuleTwelveLab() {
  const shell = document.querySelector('.its12-shell');
  if (!shell || !its12State) return;

  shell.addEventListener('change', (event) => {
    const field = event.target.closest('[data-itsw-field]');
    if (field) {
      const form = field.closest('[data-itsw-ticket-form]');
      const ticketId = form && form.dataset.itswTicketForm;
      if (!ticketId) return;
      const key = field.dataset.itswField;
      its12State.ticketResponses[ticketId] = { ...(its12State.ticketResponses[ticketId] || {}), [key]: field.value };
      its12State.validationError = '';
      its12State.resetArmed = false;
      its12Save();
    }
  });

  shell.addEventListener('input', (event) => {
    const field = event.target.closest('[data-itsw-field]');
    if (field && field.tagName === 'TEXTAREA') {
      const form = field.closest('[data-itsw-ticket-form]');
      const ticketId = form && form.dataset.itswTicketForm;
      if (ticketId) {
        const key = field.dataset.itswField;
        its12State.ticketResponses[ticketId] = { ...(its12State.ticketResponses[ticketId] || {}), [key]: field.value };
        its12State.resetArmed = false;
        its12Save();
      }
      return;
    }
    if (event.target.matches('[data-its12-kb]')) {
      its12State.kbArticle = event.target.value;
      its12State.resetArmed = false;
      its12Save();
      return;
    }
    if (event.target.matches('[data-its12-after-action]')) {
      its12State.afterAction = event.target.value;
      its12State.resetArmed = false;
      its12Save();
    }
  });

  shell.addEventListener('click', (event) => {
    const ticketButton = event.target.closest('[data-itsw-ticket-select]');
    if (ticketButton) {
      its12State.activeTicket = ticketButton.dataset.itswTicketSelect;
      its12State.resetArmed = false;
      its12Save();
      its12RenderQueue();
      return;
    }

    if (event.target.closest('[data-its12-reset]')) {
      if (!its12CanSubmit()) return;
      its12State.resetArmed = true;
      its12Save();
      its12RenderQueue('its12-reset-confirm');
      return;
    }
    if (event.target.closest('[data-its12-reset-cancel]')) {
      its12State.resetArmed = false;
      its12Save();
      its12RenderQueue();
      return;
    }
    if (event.target.closest('[data-its12-reset-confirm]')) {
      if (!its12CanSubmit()) return;
      its12State = LabRuntime.reset(ITS12_LAB_ID, its12User, ITS12_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its12User, 'it-support', 'its-12', ITS12_LAB_KEY, false);
      its12RenderQueue('its12-lab-title');
      return;
    }

    if (event.target.closest('[data-its12-submit]')) its12Submit();
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 12, moduleKey: 'its-12', view: viewItsModuleTwelve, wire: wireItsModuleTwelveLab });

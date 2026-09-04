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
 * spanning every category the capstone narrative calls for. correctRank is
 * this ticket's position in a correctly-prioritized queue (1 = work first). */
const ITS12_TICKETS = [
  { id: 'SEC-2114', from: 'Luis Ortega · Sales', tag: 'P1 · Security', message: 'I clicked a link in an email that looked like it was from IT asking me to verify my password. I think I typed it in before I realized something was off.',
    category: 'security', decision: 'escalate', correctRank: 1,
    firstStepPattern: /do ?n[o']?t (reset|click)|isolate|report|security team|don't (click|enter)|stop using/i,
    reasoningPattern: /phishing|credential|compromis|security|escalat/i,
    explain: 'A credential-phishing incident is always the highest priority — contain first (don\'t let the user "fix" it themselves), then escalate to the security-incident process immediately.' },
  { id: 'HD-2110', from: 'Sofia Martin · Operations', tag: 'P2 · Server', message: 'My computer says it can\'t connect to the domain anymore. It was fine until I restored a VM snapshot from before I left for lunch.',
    category: 'server', decision: 'escalate', correctRank: 2,
    firstStepPattern: /domain trust|rejoin|escalate|tier ?2|server team|confirm (the )?scope/i,
    reasoningPattern: /domain trust|server|outside|scope|escalat|tier ?2/i,
    explain: 'A broken domain trust relationship is outside L1 authority to repair directly — confirm the scope, then escalate to the server/infrastructure team.' },
  { id: 'HD-2104', from: 'Priya Shah · HR', tag: 'P2 · Network', message: 'My laptop shows it\'s connected to Wi-Fi but I can\'t reach anything — not even our internal site.',
    category: 'network', decision: 'resolve', correctRank: 3,
    firstStepPattern: /ipconfig|apipa|renew|dhcp|release/i,
    reasoningPattern: /apipa|dhcp|169\.254|network|l1|scope/i,
    explain: 'A 169.254 APIPA-style symptom is a DHCP issue squarely within L1 scope — reconnect/renew the client-side network configuration first.' },
  { id: 'SR-2107', from: 'Grace Kim · HR', tag: 'P3 · Identity', message: 'I moved to a new team last week and I still can\'t open the folder my new team uses. My login works fine otherwise.',
    category: 'identity', decision: 'resolve', correctRank: 4,
    firstStepPattern: /group|member ?of|active directory|add (the|her|him|them)/i,
    reasoningPattern: /group|member|access|l1|scope/i,
    explain: 'Logging in fine but denied one specific resource is the classic group-membership pattern — check Member Of, confirm with the resource owner, then fix it.' },
  { id: 'HD-2109', from: 'Noah Williams · Sales', tag: 'P3 · Endpoint', message: 'My desktop is suddenly completely empty and all my settings reset, but I can still log in fine.',
    category: 'endpoint', decision: 'resolve', correctRank: 5,
    firstStepPattern: /profile|temporary profile|rebuild|new (local )?profile/i,
    reasoningPattern: /profile|account|corrupt|l1|scope/i,
    explain: 'Logging in fine but a suddenly empty desktop and reset settings is a corrupted profile, not an account problem — well within L1 scope to rebuild.' },
  { id: 'HD-2106', from: 'Elena Ruiz · Logistics', tag: 'P4 · Peripheral', message: 'Nothing will print from my computer today, and I saw an error about the print spooler when I looked.',
    category: 'peripheral', decision: 'resolve', correctRank: 6,
    firstStepPattern: /spooler|restart|print queue|clear/i,
    reasoningPattern: /spooler|print|queue|l1|scope/i,
    explain: 'A single user\'s print spooler issue is routine peripheral triage — clear the queue and restart the Print Spooler service.' },
];

const ITS12_LAB_ID = 'its12-capstone-v1';
const ITS12_LAB_KEY = 'lab-its-12-capstone';
const ITS12_PASSING_SCORE = 70;

const ITS12_DEFAULT_STATE = {
  activeTicket: ITS12_TICKETS[0].id, ticketResponses: {}, kbArticle: '', afterAction: '',
  attempts: 0, score: 0, breakdown: null, feedback: [], validationError: '', resetArmed: false, completed: false,
};

let its12State = null;
let its12User = null;

function its12Load(user) {
  its12User = user;
  its12State = LabRuntime.load(ITS12_LAB_ID, user, ITS12_DEFAULT_STATE);
  if (!its12State.ticketResponses || typeof its12State.ticketResponses !== 'object') its12State.ticketResponses = {};
  if (!ITS12_TICKETS.some((t) => t.id === its12State.activeTicket)) its12State.activeTicket = ITS12_TICKETS[0].id;
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-12');
  return its12State;
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
  });
}

function its12ScorePanel() {
  if (its12State.validationError) {
    return `<div class="its12-validation" id="its12-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the capstone</strong><p>${esc(its12State.validationError)}</p></div></div>`;
  }
  if (!its12State.attempts || !its12State.breakdown) {
    return `<div class="its12-score-empty" id="its12-feedback" role="status">Your answers save automatically. Submit once every ticket has a priority rank, category, first step, decision, and reasoning, and both the KB article and after-action review are written.</div>`;
  }
  const passed = its12State.score >= ITS12_PASSING_SCORE;
  const b = its12State.breakdown;
  return `<section class="its12-score ${passed ? 'its12-score-pass' : 'its12-score-remediate'}" id="its12-feedback" tabindex="-1" aria-live="polite">
    <div class="its12-score-heading"><div><p class="its12-kicker">Attempt ${its12State.attempts} · best ${its12State.bestScore}/100</p><h3>${its12State.score}/100 — ${passed ? 'Capstone passed' : 'Review the feedback and retry'}</h3></div><span>${its12State.score}</span></div>
    <div class="its12-score-grid">
      <div><strong>${b.triage}/15</strong><span>Triage & prioritization</span></div>
      <div><strong>${b.technical}/20</strong><span>Technical accuracy</span></div>
      <div><strong>${b.communication}/15</strong><span>Communication</span></div>
      <div><strong>${b.escalation}/15</strong><span>Escalation judgment</span></div>
      <div><strong>${b.security}/10</strong><span>Security judgment</span></div>
      <div><strong>${b.kb}/15</strong><span>KB article quality</span></div>
      <div><strong>${b.afterAction}/10</strong><span>After-action review</span></div>
    </div>
    <ul class="its12-feedback-list">${its12State.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
  </section>`;
}

function its12ExtrasAndActions() {
  return `<div class="its12-extra">
    <label for="its12-kb">Knowledge-base article</label>
    <p class="its12-extra-hint">Write at least one KB article based on something you worked through above — symptom, cause, and fix, so the next technician doesn't have to re-diagnose it from scratch.</p>
    <textarea id="its12-kb" data-its12-kb rows="3" placeholder="Symptom… Cause… Fix… Verification…">${esc(its12State.kbArticle)}</textarea>
  </div>
  <div class="its12-extra">
    <label for="its12-after-action">After-action review</label>
    <p class="its12-extra-hint">Step back and review your own performance — what went well, what you'd do differently, and what you learned about your own troubleshooting instincts.</p>
    <textarea id="its12-after-action" data-its12-after-action rows="3" placeholder="What went well… What I'd do differently… What I learned…">${esc(its12State.afterAction)}</textarea>
  </div>
  <div class="its12-worksheet-actions"><button class="its12-submit" type="button" data-its12-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Submit my capstone</button><button class="its12-reset" type="button" data-its12-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab</button></div>
  ${its12State.resetArmed ? `<div class="its12-reset-confirm" id="its12-reset-confirm" role="alert"><p><strong>Reset the capstone?</strong> All ticket answers, the KB article, the after-action review, and your score will be cleared.</p><div><button type="button" data-its12-reset-confirm>Yes, reset the capstone</button><button type="button" data-its12-reset-cancel>Cancel</button></div></div>` : ''}
  ${its12ScorePanel()}`;
}

function viewItsModuleTwelve(user, program) {
  its12Load(user);
  const module = program.modules['its-12'];
  return `<div class="its12-shell">
    <header class="its12-topbar"><a class="its12-brand" href="#/program/${esc(program.slug)}" aria-label="Back to IT Help Desk program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="its12-top-actions"><span class="its12-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="its12-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="its12-main">
      <section class="its12-hero" aria-labelledby="its12-title"><p class="its12-kicker">Module 12 · Capstone · ${formatInstructionalMinutes(module.durationMinutes)}</p><h1 id="its12-title">${esc(module.title)}</h1><p class="its12-lede">Nothing new — this is where you prove you can do the job. A realistic queue, real resolve-or-escalate calls, a knowledge-base article, and an honest look back at your own work.</p>
        <dl class="its12-progress" aria-label="Saved capstone progress"><div><dt>Tickets</dt><dd>${ITS12_TICKETS.length}</dd></div><div><dt>Status</dt><dd id="its12-status">${its12State.completed ? 'Complete' : its12State.attempts ? 'In progress' : 'Not started'}</dd></div></dl>
      </section>

      <section class="its12-section" aria-labelledby="its12-lesson-title"><div class="its12-section-heading"><span>L</span><div><p class="its12-kicker">Learn</p><h2 id="its12-lesson-title">What to expect</h2></div></div>${its12LessonCard()}</section>

      <section class="its12-section its12-lab-section" aria-labelledby="its12-lab-title"><div class="its12-section-heading"><span>P</span><div><p class="its12-kicker">Prove · passing score ${ITS12_PASSING_SCORE}/100</p><h2 id="its12-lab-title">The integrated scenario</h2></div></div>
        <div class="its12-brief"><p>You're covering the Northstar Distribution Group help desk queue. Six tickets just came in, spanning identity, endpoint, network, peripheral, server, and a security concern. Rank them in the order you'd actually work them, then triage each one: category, first step, resolve-or-escalate, and your reasoning.</p></div>
        <div id="its12-lab-dynamic">
          ${its12TicketQueue()}
          ${its12ExtrasAndActions()}
        </div>
      </section>
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
  if (status) status.textContent = its12State.completed ? 'Complete' : its12State.attempts ? 'In progress' : 'Not started';
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function its12Score() {
  let triageCorrect = 0;
  let technicalCorrect = 0;
  let communicationOk = 0;
  let escalationCorrect = 0;
  const feedback = [];
  ITS12_TICKETS.forEach((ticket) => {
    const r = its12State.ticketResponses[ticket.id] || {};
    if (Number(r.priority) === ticket.correctRank) triageCorrect += 1;
    const catOk = r.category === ticket.category;
    const stepOk = ticket.firstStepPattern.test((r.firstStep || '').trim());
    if (catOk && stepOk) technicalCorrect += 1;
    const reasonOk = ticket.reasoningPattern.test((r.reasoning || '').trim()) && (r.reasoning || '').trim().length >= 15;
    if (reasonOk) communicationOk += 1;
    const decOk = r.decision === ticket.decision;
    if (decOk) escalationCorrect += 1;
    if (!(catOk && stepOk && decOk && reasonOk)) feedback.push(`${ticket.id}: ${ticket.explain}`);
  });
  const triage = Math.round((triageCorrect / ITS12_TICKETS.length) * 15);
  const technical = Math.round((technicalCorrect / ITS12_TICKETS.length) * 20);
  const communication = Math.round((communicationOk / ITS12_TICKETS.length) * 15);
  const escalation = Math.round((escalationCorrect / ITS12_TICKETS.length) * 15);

  const secTicket = ITS12_TICKETS.find((t) => t.category === 'security');
  const secResponse = its12State.ticketResponses[secTicket.id] || {};
  const security = (secResponse.category === secTicket.category && secResponse.decision === secTicket.decision) ? 10 : 0;

  const kb = its12State.kbArticle.trim();
  const kbOk = kb.length >= 80 && /(symptom|cause|fix|resolv|verif)/i.test(kb);
  const kbScore = kbOk ? 15 : (kb.length >= 40 ? 8 : 0);

  const after = its12State.afterAction.trim();
  const afterScore = after.length >= 40 ? 10 : (after.length >= 15 ? 5 : 0);

  if (triage < 15) feedback.unshift(`Triage: ${triageCorrect}/6 tickets ranked correctly. The security incident is always rank 1; work outward from there by impact and urgency.`);
  if (!kbOk) feedback.push('KB article: write at least 80 characters covering symptom, cause, fix, and verification.');
  if (afterScore < 10) feedback.push('After-action review: write at least 40 characters reflecting honestly on what went well and what you\'d do differently.');

  return {
    score: triage + technical + communication + escalation + security + kbScore + afterScore,
    breakdown: { triage, technical, communication, escalation, security, kb: kbScore, afterAction: afterScore },
    feedback,
  };
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
      its12State = LabRuntime.reset(ITS12_LAB_ID, its12User, ITS12_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its12User, 'it-support', 'its-12', ITS12_LAB_KEY, false);
      its12RenderQueue('its12-lab-title');
      return;
    }

    if (event.target.closest('[data-its12-submit]')) {
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
      const result = its12Score();
      its12State.attempts += 1;
      its12State.score = result.score;
      its12State.bestScore = Math.max(its12State.bestScore || 0, result.score);
      its12State.breakdown = result.breakdown;
      its12State.feedback = result.feedback;
      its12State.validationError = '';
      its12State.resetArmed = false;
      const passed = result.score >= ITS12_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(its12User, ITS12_LAB_KEY, { state: passed ? 'complete' : 'in_progress', score: result.score, result: { breakdown: result.breakdown, attempts: its12State.attempts } });
      }
      if (passed) {
        its12State.completed = true;
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its12User, 'it-support', 'its-12', ITS12_LAB_KEY);
      }
      its12Save();
      its12RenderQueue('its12-feedback');
    }
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 12, moduleKey: 'its-12', view: viewItsModuleTwelve, wire: wireItsModuleTwelveLab });

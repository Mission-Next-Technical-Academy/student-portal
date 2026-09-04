/* Module 01 — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 * Lesson content sourced from Module_1_Student_Content.docx; lab design
 * from MNT_HelpDesk_Module1_Lab_Specifications.docx.
 */

const ITS01_LESSONS = [
  {
    id: 'its-01-lesson-01', number: '1.1', icon: 'ri-compass-3-line',
    title: 'Program Orientation, LMS Navigation & Professional Conduct', minutes: 90,
    learn: [
      'How to find everything you need inside the Mission Next LMS',
      'How to submit your work and check your grades',
      "What's expected of you as a student in this program",
      'What professional conduct looks like on a real help desk, and why it matters from day one',
    ],
    topics: [
      { heading: 'Finding Your Way Around', body: 'Your LMS is organized the same way your work will be once you’re on the job: modules break down into lessons, lessons lead into labs, and everything you complete gets tracked in your gradebook. Work is scored within 24 hours, excluding weekends and holidays.' },
      { heading: 'How This Program Runs', body: 'Mission Next is a licensed clock-hour training program — the time you spend in lessons and labs is part of your official record. If something comes up and you’re at risk of falling behind, reach out to your instructor directly rather than letting it slide.' },
      { heading: 'The Acceptable Use Policy — Read This One For Real', body: 'It covers how you use the lab environment, how you handle your login credentials, and confidentiality. Some labs include realistic but completely fake user data — treat it exactly like a real person’s data on a real job. Never share it, post it, or screenshot it outside the lab.' },
      { heading: 'What Professional Conduct Looks Like', body: 'Every ticket involves a real person on the other end, even in a simulation: a calm, plain tone, responding within expected timeframes, keeping one user’s issue confidential from another, and a clean handoff when you escalate so the next technician isn’t starting from zero.' },
      { heading: 'Two Logins, Not One', body: 'Your hands-on lab environment uses a completely separate login from your LMS. Keep them separate and don’t reuse passwords between the two — credential discipline starts now.' },
    ],
    practice: [
      'Find the link to Module 2.',
      'Find where the Acceptable Use Policy lives.',
      'Find how to contact your instructor.',
      'Find where your grades will appear.',
      'Find where you’ll upload evidence for your labs.',
    ],
    comingUp: 'Confirm your LMS and lab-environment access both work, submit a test file, and acknowledge the Acceptable Use Policy.',
  },
  {
    id: 'its-01-lesson-02', number: '1.2', icon: 'ri-route-line',
    title: 'The Help Desk Role: Workflow & the Troubleshooting Mindset', minutes: 90,
    learn: [
      'What Tier 1 (Help Desk) support actually covers, and how it differs from Tier 2 and Tier 3',
      "A ticket's journey from the moment it lands in your queue to the moment it closes",
      'A five-step way of thinking through any problem, used in every module from here on',
      'How to tell the difference between something you should fix yourself and something you should hand off',
    ],
    topics: [
      { heading: 'Where You Fit: Tier 1, 2, and 3', body: 'Tier 1 — that’s you — is the front line: password resets, basic connectivity problems, common known issues, and taking in new tickets. A well-run help desk resolves 60–80% of tickets at Tier 1 without a handoff. Escalating isn’t failing — it’s the system working correctly when something is genuinely outside your scope.' },
      { heading: "A Ticket's Journey", body: 'A ticket lands in your queue. You triage it — what’s urgent, what can wait. You work it with the five-step process below. You document what you did. Then you close it out or escalate it with a handoff clean enough that the next person isn’t starting from zero.' },
      { heading: 'The Five-Step Troubleshooting Mindset', body: 'Gather information → Reproduce or verify → Isolate (hardware, software, network, or account) → Resolve or escalate → Verify and document. This is the single most important framework in the program — memorize it.' },
      { heading: 'Seeing It In Action', body: '"I can’t print and I have a deadline in an hour" isolates to a stuck queue, offline printer, driver problem, or network issue — squarely Tier 1, so you resolve it and confirm with the user. "Our department file server won’t boot after last night’s update" uses the same five steps, but the right call is to escalate quickly — server hardware and boot issues are outside Tier 1 here.' },
    ],
    practice: [
      '“My printer won’t print, and there’s a red light blinking on it.” Name the category, write your first question, and decide: resolve or escalate?',
      '“It says my account is locked out, too many failed attempts.” Name the category, write your first question, and decide: resolve or escalate?',
      '“My laptop has no internet, but my phone on Wi-Fi works fine.” Name the category, write your first question, and decide: resolve or escalate?',
    ],
    comingUp: 'Work through a full simulated queue of five tickets, applying everything from this lesson for real.',
  },
];

const ITS01_AUP_PARAGRAPHS = [
  'Lab Environment: Use the sandbox and virtual machines issued to you only for coursework in this program. Do not use them to store or process real personal data, connect to production systems, or attempt to access systems outside the scope of an assigned lab.',
  'Credentials: Your LMS login and your lab-environment login are separate and must not share a password. Do not share either set of credentials with anyone else, including other students.',
  'Confidentiality: Labs use realistic but entirely fictional user data — names, account numbers, and similar details. Treat it exactly as you would a real person’s data on a real job: never share it, post it, or screenshot it outside the lab environment.',
];

const ITS01_LAB1_ID = 'its01-lms-validation-v1';
const ITS01_LAB1_KEY = 'lab-its-01-lms-validation';
const ITS01_LAB2_ID = 'its01-ticket-triage-v1';
const ITS01_LAB2_KEY = 'lab-its-01-ticket-triage';
const ITS01_PASSING_SCORE = 70;

const ITS01_CATEGORY_OPTIONS = [
  { value: 'endpoint', label: 'Endpoint / Peripheral' },
  { value: 'identity', label: 'Identity / Account' },
  { value: 'network', label: 'Network' },
  { value: 'hardware', label: 'Hardware Failure' },
  { value: 'server', label: 'Server (Outside L1 Scope)' },
];

const ITS01_TICKETS = [
  { id: 'HD-1042', from: 'James · Receiving', tag: 'New', message: 'Hi, this is James in Receiving. My scanner gun won’t connect to the PC anymore, it was working fine Friday.',
    category: 'endpoint', decision: 'resolve', firstStepPattern: /cable|usb|bluetooth|pair|reconnect|reseat|driver|restart/i, reasoningPattern: /peripheral|connect|scope|l1|basic|driver|cable/i,
    explain: 'A disconnected peripheral is a routine Endpoint ticket: reseat/re-pair the connection first, and it’s squarely within L1 scope to resolve.' },
  { id: 'HD-1043', from: 'Priya · HR', tag: 'Urgent', message: 'This is Priya from HR. I’m locked out, too many failed attempts. I need to run payroll today.',
    category: 'identity', decision: 'resolve', firstStepPattern: /verify|identity|confirm|unlock|reset|lockout/i, reasoningPattern: /identity|unlock|verify|l1|scope|urgent|payroll/i,
    explain: 'An account lockout is an Identity ticket — verify the requester, then unlock. This is core L1 work, prioritized for the payroll deadline.' },
  { id: 'HD-1044', from: 'Front Desk', tag: 'Multiple users', message: 'Front desk here — guest Wi-Fi’s been down 20 minutes, three guests have complained.',
    category: 'network', decision: 'resolve', firstStepPattern: /access point|router|restart|reboot|wireless|wifi|signal/i, reasoningPattern: /basic|connectivity|restart|l1|scope|guest/i,
    explain: 'A guest Wi-Fi outage is a Network ticket — start with a basic access-point restart, which is within L1 scope before any deeper investigation.' },
  { id: 'HD-1045', from: 'Unknown Employee', tag: 'Ambiguous', message: 'Can someone look at my computer, it’s been slow and now it’s making a weird clicking noise.',
    category: 'hardware', decision: 'escalate', firstStepPattern: /back ?up|stop using|save|data|shut ?down|power off/i, reasoningPattern: /clicking|hard drive|disk|failure|hardware|physical|replace/i,
    explain: 'A clicking noise is a classic failing-hard-drive signal, not a software fix. Protect the data first, then escalate for hardware replacement — outside L1 scope.' },
  { id: 'HD-1046', from: 'Department Lead', tag: 'Server', message: 'Our department file server, DEPT-FS03, just went dark. Nobody can reach the shared drive.',
    category: 'server', decision: 'escalate', firstStepPattern: /confirm|scope|impact|multiple users|check|verify/i, reasoningPattern: /server|outside|scope|l1|infrastructure|tier ?2|tier ?3|escalat/i,
    explain: 'A dark department file server affecting every user is server infrastructure — explicitly outside Tier 1 scope. Confirm impact, then escalate immediately.' },
];

const ITS01_DEFAULT_STATE = {
  evidence1: null, evidence2: null, aupScrolled: false, aupAcknowledged: false, lab1Complete: false,
  activeTicket: ITS01_TICKETS[0].id, ticketResponses: {}, attempts: 0, breakdown: null, feedback: [],
  validationError: '', resetArmed: false,
};

let its01State = null;
let its01User = null;

function its01Load(user) {
  its01User = user;
  its01State = LabRuntime.load(ITS01_LAB1_ID, user, ITS01_DEFAULT_STATE);
  if (!its01State.ticketResponses || typeof its01State.ticketResponses !== 'object') its01State.ticketResponses = {};
  if (!ITS01_TICKETS.some((t) => t.id === its01State.activeTicket)) its01State.activeTicket = ITS01_TICKETS[0].id;
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-01');
  return its01State;
}

function its01Save() {
  if (its01User && its01State) LabRuntime.save(ITS01_LAB1_ID, its01User, its01State);
}

function its01LessonCard(lesson) {
  return `<details class="its01-lesson" data-its01-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="its01-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="its01-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>
    </div>
  </details>`;
}

function its01Lessons() {
  return `<div class="its01-lesson-grid">${ITS01_LESSONS.map(its01LessonCard).join('')}</div>`;
}

function its01Lab1Status() {
  const done = its01State.lab1Complete;
  return `<div class="its01-lab-status ${done ? 'its01-status-pass' : 'its01-status-pending'}"><i class="${done ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${done ? 'Lab 1.1 complete — both evidence files uploaded and the Acceptable Use Policy is acknowledged.' : 'Upload both evidence files and acknowledge the Acceptable Use Policy to complete this lab.'}</span></div>`;
}

function its01Lab1() {
  return `<section class="its01-section its01-lab-section" id="its01-lab-1-1" aria-labelledby="its01-lab-1-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Lab 1.1 · evidence-based · real systems</p><h2 id="its01-lab-1-1-title">LMS &amp; Environment Validation</h2></div></div>
    <p class="its01-instruction">Confirm your LMS login and your separate lab-sandbox login both work, submit a test file through the evidence-upload workflow below, and formally acknowledge the Acceptable Use Policy.</p>
    <div class="its01-evidence-grid">
      ${itswEvidenceTile({ id: 'its01-evidence-1', label: 'Sandbox desktop screenshot', hint: 'A screenshot of the sandbox desktop after a successful login.', file: its01State.evidence1 })}
      ${itswEvidenceTile({ id: 'its01-evidence-2', label: 'Evidence-upload confirmation', hint: 'A screenshot of this tile showing an “Uploaded” status and timestamp.', file: its01State.evidence2 })}
    </div>
    <div class="its01-aup">
      <strong>Acceptable Use Policy</strong>
      <div class="its01-aup-text" data-its01-aup-text tabindex="0" aria-label="Acceptable Use Policy, scroll to read in full">
        ${ITS01_AUP_PARAGRAPHS.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      ${its01AupAck()}
    </div>
    ${its01Lab1Status()}
  </section>`;
}

function its01AupAck() {
  return `<div class="its01-aup-ack-wrap">
    <div class="its01-aup-ack">
      <input type="checkbox" id="its01-aup-checkbox" data-its01-aup-checkbox ${its01State.aupAcknowledged ? 'checked' : ''} ${its01State.aupScrolled ? '' : 'disabled'} />
      <label for="its01-aup-checkbox">I have read and acknowledge the Acceptable Use Policy.</label>
    </div>
    ${its01State.aupScrolled ? '' : '<p class="its01-aup-hint">Scroll to the end of the policy text to enable acknowledgment.</p>'}
  </div>`;
}

function its01TicketQueue() {
  return itswTicketQueue({
    tickets: ITS01_TICKETS, activeId: its01State.activeTicket, responses: its01State.ticketResponses,
    categoryOptions: ITS01_CATEGORY_OPTIONS,
  });
}

function its01Lab2ScorePanel() {
  if (its01State.validationError) {
    return `<div class="its01-validation" id="its01-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Complete the worksheet</strong><p>${esc(its01State.validationError)}</p></div></div>`;
  }
  if (!its01State.attempts || !its01State.breakdown) {
    return `<div class="its01-score-empty" id="its01-feedback" role="status">Your answers save automatically as you move between tickets. Submit once all five tickets have a category, first step, decision, and reasoning.</div>`;
  }
  const passed = its01State.score >= ITS01_PASSING_SCORE;
  const b = its01State.breakdown;
  return `<section class="its01-score ${passed ? 'its01-score-pass' : 'its01-score-remediate'}" id="its01-feedback" tabindex="-1" aria-live="polite">
    <div class="its01-score-heading"><div><p class="its01-kicker">Attempt ${its01State.attempts} · best ${its01State.bestScore}/100</p><h3>${its01State.score}/100 — ${passed ? 'Queue triaged correctly' : 'Review the feedback and retry'}</h3></div><span>${its01State.score}</span></div>
    <div class="its01-score-grid" aria-label="Score breakdown">
      <div><strong>${b.category}/25</strong><span>Category accuracy</span></div>
      <div><strong>${b.firstStep}/25</strong><span>First-step reasoning</span></div>
      <div><strong>${b.decision}/30</strong><span>Resolve/escalate decision</span></div>
      <div><strong>${b.reasoning}/20</strong><span>Justification quality</span></div>
    </div>
    <ul class="its01-feedback-list">${its01State.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
  </section>`;
}

function its01Lab2() {
  return `<section class="its01-section its01-lab-section" id="its01-lab-1-2" aria-labelledby="its01-lab-1-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Lab 1.2 · simulated · 5 tickets · passing score ${ITS01_PASSING_SCORE}/100</p><h2 id="its01-lab-1-2-title">A Day in the Life of an L1 Technician</h2></div></div>
    <p class="its01-instruction">Categorize each ticket, state a concrete first diagnostic step, and make a resolve-or-escalate call with reasoning — using the five-step mindset from Lesson 1.2.</p>
    <div class="its01-worksheet" id="its01-lab2-dynamic">
      ${its01TicketQueue()}
      <div class="its01-worksheet-actions"><button class="its01-submit" type="button" data-its01-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my triage</button><button class="its01-reset" type="button" data-its01-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>
      ${its01State.resetArmed ? `<div class="its01-reset-confirm" id="its01-reset-confirm" role="alert"><p><strong>Reset Module 01?</strong> Both labs, evidence, AUP acknowledgment, ticket answers, and score will be cleared.</p><div><button type="button" data-its01-reset-confirm>Yes, reset this module</button><button type="button" data-its01-reset-cancel>Cancel</button></div></div>` : ''}
      ${its01Lab2ScorePanel()}
    </div>
  </section>`;
}

function viewItsModuleOne(user, program) {
  its01Load(user);
  const module = program.modules['its-01'];
  return `<div class="its01-shell">
    <header class="its01-topbar"><a class="its01-brand" href="#/program/${esc(program.slug)}" aria-label="Back to IT Help Desk program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="its01-top-actions"><span class="its01-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="its01-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its01-title"><div><p class="its01-kicker">Module 01 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p><h1 id="its01-title">${esc(module.title)}</h1><p class="its01-lede">Get set up in the LMS and your lab environment, then build the five-step troubleshooting mindset you'll use in every module that follows.</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>2</dd></div><div><dt>Lab 1.2 status</dt><dd id="its01-status">${its01State.completed ? 'Complete' : its01State.attempts ? 'In progress' : 'Not started'}</dd></div></dl></section>

      <section class="its01-section" id="its01-lessons" aria-labelledby="its01-lessons-title"><div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn</p><h2 id="its01-lessons-title">Two foundation lessons</h2></div></div><p class="its01-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise.</p>${its01Lessons()}</section>

      ${its01Lab1()}
      ${its01Lab2()}
    </main>
  </div>`;
}

function its01RenderLab1() {
  const section = document.getElementById('its01-lab-1-1');
  if (!section) return;
  const grid = section.querySelector('.its01-evidence-grid');
  if (grid) grid.outerHTML = `<div class="its01-evidence-grid">
    ${itswEvidenceTile({ id: 'its01-evidence-1', label: 'Sandbox desktop screenshot', hint: 'A screenshot of the sandbox desktop after a successful login.', file: its01State.evidence1 })}
    ${itswEvidenceTile({ id: 'its01-evidence-2', label: 'Evidence-upload confirmation', hint: 'A screenshot of this tile showing an “Uploaded” status and timestamp.', file: its01State.evidence2 })}
  </div>`;
  const statusEl = section.querySelector('.its01-lab-status');
  if (statusEl) statusEl.outerHTML = its01Lab1Status();
  const ackWrap = section.querySelector('.its01-aup-ack-wrap');
  if (ackWrap) ackWrap.outerHTML = its01AupAck();
}

function its01RenderLab2(focusId) {
  const root = document.getElementById('its01-lab2-dynamic');
  if (!root) return;
  root.innerHTML = `${its01TicketQueue()}
    <div class="its01-worksheet-actions"><button class="its01-submit" type="button" data-its01-submit><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score my triage</button><button class="its01-reset" type="button" data-its01-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>
    ${its01State.resetArmed ? `<div class="its01-reset-confirm" id="its01-reset-confirm" role="alert"><p><strong>Reset Module 01?</strong> Both labs, evidence, AUP acknowledgment, ticket answers, and score will be cleared.</p><div><button type="button" data-its01-reset-confirm>Yes, reset this module</button><button type="button" data-its01-reset-cancel>Cancel</button></div></div>` : ''}
    ${its01Lab2ScorePanel()}`;
  const status = document.getElementById('its01-status');
  if (status) status.textContent = its01State.completed ? 'Complete' : its01State.attempts ? 'In progress' : 'Not started';
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function its01CheckLab1Complete() {
  const wasComplete = its01State.lab1Complete;
  its01State.lab1Complete = Boolean(its01State.evidence1 && its01State.evidence2 && its01State.aupAcknowledged);
  if (its01State.lab1Complete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(its01User, ITS01_LAB1_KEY, { state: 'complete', score: 100, result: { evidence: 2, aup: true } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its01User, 'it-support', 'its-01', ITS01_LAB1_KEY);
  }
}

function its01Score() {
  let category = 0; let firstStep = 0; let decision = 0; let reasoning = 0;
  const feedback = [];
  ITS01_TICKETS.forEach((ticket) => {
    const response = its01State.ticketResponses[ticket.id] || {};
    const catOk = response.category === ticket.category;
    const stepOk = ticket.firstStepPattern.test((response.firstStep || '').trim());
    const decOk = response.decision === ticket.decision;
    const reasonOk = ticket.reasoningPattern.test((response.reasoning || '').trim()) && (response.reasoning || '').trim().length >= 15;
    if (catOk) category += 5;
    if (stepOk) firstStep += 5;
    if (decOk) decision += 6;
    if (reasonOk) reasoning += 4;
    if (catOk && stepOk && decOk && reasonOk) {
      feedback.push(`${ticket.id}: Correct. ${ticket.explain}`);
    } else {
      feedback.push(`${ticket.id}: ${ticket.explain}`);
    }
  });
  return { score: category + firstStep + decision + reasoning, breakdown: { category, firstStep, decision, reasoning }, feedback };
}

function wireItsModuleOneLab() {
  const shell = document.querySelector('.its01-shell');
  if (!shell || !its01State) return;

  shell.addEventListener('change', (event) => {
    const evidenceInput = event.target.closest('[data-itsw-evidence-input]');
    if (evidenceInput) {
      const file = itswReadEvidenceFile(evidenceInput);
      if (!file) return;
      const id = evidenceInput.dataset.itswEvidenceInput;
      if (id === 'its01-evidence-1') its01State.evidence1 = file;
      if (id === 'its01-evidence-2') its01State.evidence2 = file;
      its01CheckLab1Complete();
      its01Save();
      its01RenderLab1();
      return;
    }

    if (event.target.matches('[data-its01-aup-checkbox]')) {
      its01State.aupAcknowledged = event.target.checked;
      its01CheckLab1Complete();
      its01Save();
      its01RenderLab1();
      return;
    }

    const field = event.target.closest('[data-itsw-field]');
    if (field) {
      const form = field.closest('[data-itsw-ticket-form]');
      const ticketId = form && form.dataset.itswTicketForm;
      if (!ticketId) return;
      const key = field.dataset.itswField;
      its01State.ticketResponses[ticketId] = { ...(its01State.ticketResponses[ticketId] || {}), [key]: field.value };
      its01State.validationError = '';
      its01State.resetArmed = false;
      its01Save();
    }
  });

  shell.addEventListener('input', (event) => {
    const field = event.target.closest('[data-itsw-field]');
    if (!field || field.tagName !== 'TEXTAREA') return;
    const form = field.closest('[data-itsw-ticket-form]');
    const ticketId = form && form.dataset.itswTicketForm;
    if (!ticketId) return;
    const key = field.dataset.itswField;
    its01State.ticketResponses[ticketId] = { ...(its01State.ticketResponses[ticketId] || {}), [key]: field.value };
    its01State.resetArmed = false;
    its01Save();
  });

  shell.addEventListener('scroll', (event) => {
    const aupText = event.target.closest && event.target.closest('[data-its01-aup-text]');
    if (!aupText) return;
    if (aupText.scrollTop + aupText.clientHeight >= aupText.scrollHeight - 8 && !its01State.aupScrolled) {
      its01State.aupScrolled = true;
      its01Save();
      its01RenderLab1();
    }
  }, true);

  shell.addEventListener('click', (event) => {
    const ticketButton = event.target.closest('[data-itsw-ticket-select]');
    if (ticketButton) {
      its01State.activeTicket = ticketButton.dataset.itswTicketSelect;
      its01State.resetArmed = false;
      its01Save();
      its01RenderLab2();
      return;
    }

    if (event.target.closest('[data-its01-reset]')) {
      its01State.resetArmed = true;
      its01Save();
      its01RenderLab2('its01-reset-confirm');
      return;
    }
    if (event.target.closest('[data-its01-reset-cancel]')) {
      its01State.resetArmed = false;
      its01Save();
      its01RenderLab2();
      return;
    }
    if (event.target.closest('[data-its01-reset-confirm]')) {
      its01State = LabRuntime.reset(ITS01_LAB1_ID, its01User, ITS01_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(its01User, 'it-support', 'its-01', ITS01_LAB1_KEY, false);
        markModuleLabComplete(its01User, 'it-support', 'its-01', ITS01_LAB2_KEY, false);
      }
      its01RenderLab1();
      its01RenderLab2('its01-lessons-title');
      return;
    }

    if (event.target.closest('[data-its01-submit]')) {
      const missing = ITS01_TICKETS.some((ticket) => {
        const r = its01State.ticketResponses[ticket.id] || {};
        return !r.category || !r.decision || !(r.firstStep || '').trim() || !(r.reasoning || '').trim();
      });
      if (missing) {
        its01State.validationError = 'Every ticket needs a category, first step, decision, and reasoning before you submit.';
        its01Save();
        its01RenderLab2('its01-feedback');
        return;
      }
      const result = its01Score();
      its01State.attempts += 1;
      its01State.score = result.score;
      its01State.bestScore = Math.max(its01State.bestScore || 0, result.score);
      its01State.breakdown = result.breakdown;
      its01State.feedback = result.feedback;
      its01State.validationError = '';
      its01State.resetArmed = false;
      const passed = result.score >= ITS01_PASSING_SCORE;
      if (typeof recordLabAttempt === 'function') {
        recordLabAttempt(its01User, ITS01_LAB2_KEY, { state: passed ? 'complete' : 'in_progress', score: result.score, result: { breakdown: result.breakdown, attempts: its01State.attempts } });
      }
      if (passed) {
        its01State.completed = true;
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(its01User, 'it-support', 'its-01', ITS01_LAB2_KEY);
      }
      its01Save();
      its01RenderLab2('its01-feedback');
    }
  });
}

registerModuleLab({ program: 'it-support', moduleNumber: 1, moduleKey: 'its-01', view: viewItsModuleOne, wire: wireItsModuleOneLab });

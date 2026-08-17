/* Module 01 — beginner-first SOC foundations and a single guided triage.
 * All records and actions are fictional, browser-local simulations.
 */

const MODULE_ONE_LAB_ID = 'm01-first-soc-alert-v2';
const MODULE_ONE_FLAG = 'M01-FIRST-ALERT-TRIAGED';
const MODULE_ONE_CATALOG_LAB_KEY = 'lab-soc-environment';

const MODULE_ONE_DEFAULT_STATE = {
  reviewedEvidence: [],
  consoleStarted: false,
  consoleCompleted: false,
  verdict: '',
  priority: '',
  phase: '',
  decision: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
};

let moduleOneState = null;
let moduleOneUser = null;

function moduleOneLoad(user) {
  moduleOneUser = user;
  moduleOneState = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
  if (!Array.isArray(moduleOneState.reviewedEvidence)) moduleOneState.reviewedEvidence = [];
  if (new URLSearchParams(location.search).get('coachComplete') === 'm01') {
    moduleOneState.consoleStarted = true;
    moduleOneState.consoleCompleted = true;
    LabRuntime.save(MODULE_ONE_LAB_ID, user, moduleOneState);
    history.replaceState(null, '', location.pathname + location.hash);
  }
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-01');
  return moduleOneState;
}

function moduleOneSave() {
  if (moduleOneUser && moduleOneState) LabRuntime.save(MODULE_ONE_LAB_ID, moduleOneUser, moduleOneState);
}

function moduleOneSeverityClass(severity) {
  return `m01-severity m01-severity-${String(severity).toLowerCase()}`;
}

function moduleOneLessons(lab) {
  return `<div class="m01-lesson-grid">
    ${lab.lessons.map((lesson) => `<details class="m01-lesson" ${lesson.number === 1 ? 'open' : ''}>
      <summary>
        <span class="m01-lesson-number">${String(lesson.number).padStart(2, '0')}</span>
        <span class="m01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span>
        <span class="m01-lesson-title"><strong>${esc(lesson.title)}</strong><small>${esc(lesson.summary)}</small></span>
        <i class="ri-arrow-down-s-line m01-lesson-chevron" aria-hidden="true"></i>
      </summary>
      <div class="m01-lesson-body">
        <p>${esc(lesson.detail)}</p>
        <p class="m01-takeaway"><strong>Remember:</strong> ${esc(lesson.takeaway)}</p>
      </div>
    </details>`).join('')}
  </div>`;
}

function moduleOneReferences(lab) {
  return `<aside class="m01-references" aria-labelledby="m01-reference-title">
    <div>
      <p class="m01-kicker">Why this module starts earlier than CySA+</p>
      <h3 id="m01-reference-title">Official scope, with a beginner bridge</h3>
      <p>CySA+ V4 starts with analyst-level security operations and recommends prior role experience. This course first teaches the role, vocabulary, and decision loop that the certification scope assumes.</p>
    </div>
    <ul>
      ${lab.officialReferences.map((reference) => `<li>
        <a href="${esc(reference.url)}" target="_blank" rel="noopener">${esc(reference.label)} <i class="ri-external-link-line" aria-hidden="true"></i></a>
        <span>${esc(reference.description)}</span>
      </li>`).join('')}
    </ul>
  </aside>`;
}

function moduleOneOptionList(name, options) {
  return `<div class="m01-option-list">
    ${options.map((option) => `<label>
      <input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${moduleOneState[name] === option.id ? 'checked' : ''} />
      <span><strong>${esc(option.text)}</strong>${option.help ? `<small>${esc(option.help)}</small>` : ''}</span>
    </label>`).join('')}
  </div>`;
}

function moduleOneScorePanel() {
  if (moduleOneState.validationError) {
    return `<div class="m01-validation" id="m01-feedback" role="alert" tabindex="-1">
      <i class="ri-information-line" aria-hidden="true"></i>
      <div><strong>One more step</strong><p>${esc(moduleOneState.validationError)}</p></div>
    </div>`;
  }

  if (!moduleOneState.attempts || !moduleOneState.breakdown) {
    return `<div class="m01-score-empty" id="m01-feedback" role="status" aria-live="polite">
      Your first attempt is coached, not timed. Submit when every decision has a selection and your note explains the evidence.
    </div>`;
  }

  const b = moduleOneState.breakdown;
  const passed = moduleOneState.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore;
  return `<section class="m01-score ${passed ? 'is-pass' : 'is-remediate'}" id="m01-feedback"
                   tabindex="-1" aria-labelledby="m01-score-title" aria-live="polite">
    <div class="m01-score-summary">
      <div>
        <p class="m01-kicker">Attempt ${moduleOneState.attempts} · coached result</p>
        <h3 id="m01-score-title">${moduleOneState.score}/100 — ${passed ? 'First alert triaged' : 'Review the coaching and retry'}</h3>
      </div>
      <span class="m01-score-number">${moduleOneState.score}</span>
    </div>
    <div class="m01-score-grid" aria-label="Score breakdown">
      <div><strong>${b.verdict}/25</strong><span>Verdict</span></div>
      <div><strong>${b.priority}/20</strong><span>Priority</span></div>
      <div><strong>${b.lifecycle}/15</strong><span>Lifecycle</span></div>
      <div><strong>${b.action}/25</strong><span>Next action</span></div>
      <div><strong>${b.communication}/15</strong><span>Case note</span></div>
    </div>
    <ul class="m01-feedback-list">
      ${moduleOneState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}
    </ul>
    <div class="m01-model-reasoning">
      <strong>Expert reasoning, in plain language</strong>
      <p>The sign-in was real and succeeded. Its device and location differ from the user's normal pattern, and the user independently denied the activity. That makes this a confirmed unauthorized-access incident, not merely a suspicious alert. The analyst should preserve those facts, assign prompt priority, and hand the case into the approved identity-response process.</p>
    </div>
  </section>`;
}

function moduleOneLabDynamic() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const scenario = lab.scenario;
  const reviewed = new Set(moduleOneState.reviewedEvidence);
  const reviewedCount = scenario.evidence.filter((item) => reviewed.has(item.id)).length;
  const investigationReady = reviewedCount === scenario.evidence.length;
  const consoleComplete = moduleOneState.consoleCompleted === true;
  const nextEvidence = scenario.evidence.find((item) => !reviewed.has(item.id));

  return `<div class="m01-alert-window">
    <div class="m01-alert-toolbar">
      <span><i class="ri-inbox-2-line" aria-hidden="true"></i> Alert queue</span>
      <span>1 alert assigned to you</span>
    </div>
    <article class="m01-single-alert" aria-labelledby="m01-scenario-title">
      <div class="m01-alert-heading">
        <div>
          <div class="m01-alert-meta">
            <span class="${moduleOneSeverityClass(scenario.initialSeverity)}">${esc(scenario.initialSeverity)}</span>
            <span>${esc(scenario.id)}</span><span>Created ${esc(scenario.created)}</span><span>${esc(scenario.source)}</span>
          </div>
          <h3 id="m01-scenario-title">${esc(scenario.title)}</h3>
          <p>${esc(scenario.summary)}</p>
        </div>
        <div class="m01-entity-chip"><span>Account</span><code>${esc(scenario.entity)}</code></div>
      </div>
      <dl class="m01-alert-facts">
        <div><dt>Detection</dt><dd>${esc(scenario.detectedBy)}</dd></div>
        <div><dt>Initial scope</dt><dd>${esc(scenario.scope)}</dd></div>
      </dl>
    </article>
  </div>

  <section class="m01-coach" aria-labelledby="m01-coach-title">
    <div class="m01-coach-avatar"><i class="ri-user-voice-line" aria-hidden="true"></i></div>
    <div>
      <p class="m01-kicker">Your coach</p>
      <h3 id="m01-coach-title">First, verify what the alert is claiming.</h3>
      <p>The rule noticed a password-guessing pattern. That is only a lead. Reveal the evidence one fact at a time and ask: <strong>Did access succeed? Is the context expected? What does the user say?</strong></p>
    </div>
  </section>

  <section class="m01-evidence" aria-labelledby="m01-evidence-title">
    <div class="m01-panel-heading">
      <div><p class="m01-kicker">Guided evidence review</p><h3 id="m01-evidence-title">Investigation timeline</h3></div>
      <span class="m01-evidence-count">${reviewedCount}/${scenario.evidence.length} facts reviewed</span>
    </div>
    <ol class="m01-timeline">
      ${scenario.evidence.map((item, index) => {
        const isReviewed = reviewed.has(item.id);
        return `<li class="${isReviewed ? 'is-reviewed' : 'is-locked'}">
          <span class="m01-timeline-marker"><i class="${isReviewed ? esc(item.icon) : 'ri-lock-line'}" aria-hidden="true"></i></span>
          <div><time>${isReviewed ? esc(item.time) : `Fact ${index + 1}`}</time><strong>${isReviewed ? esc(item.label) : 'Not reviewed yet'}</strong><p>${isReviewed ? esc(item.detail) : 'Reveal the preceding evidence to continue.'}</p></div>
        </li>`;
      }).join('')}
    </ol>
    ${nextEvidence ? `<button type="button" class="m01-reveal" data-m01-reveal="${esc(nextEvidence.id)}">
      <i class="ri-eye-line" aria-hidden="true"></i> ${reviewedCount ? 'Reveal next fact' : 'Open alert evidence'}
    </button>` : `<div class="m01-evidence-complete"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i><span><strong>Evidence review complete.</strong> You can now make the first triage decision.</span></div>`}
  </section>

  ${investigationReady ? `<section class="m01-siem ${consoleComplete ? 'is-complete' : ''}" aria-labelledby="m01-siem-title">
    <div class="m01-siem-copy">
      <p class="m01-kicker">${consoleComplete ? 'Required walkthrough complete' : 'Required · 10 minutes'}</p>
      <h3 id="m01-siem-title">Investigate the same case in the guided console</h3>
      <p>Every fact above came from somewhere. Open the lab console and the Mission Next coach walks you to it —
      the sign-in log holding the eight failures, the risk detection, and the incident record. The coach keeps you
      in the three pages this lab uses; nothing else is reachable until you exit. Complete all eight coach steps to unlock the triage worksheet.</p>
    </div>
    <a class="m01-siem-launch" data-m01-console-launch href="${esc(SIM_ORIGIN)}?coach=m01&amp;restart=1#/entra/sign-in-logs" target="_blank" rel="opener">
      <i class="${consoleComplete ? 'ri-refresh-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${consoleComplete ? 'Review guided console' : 'Start required walkthrough'}
    </a>
  </section>` : ''}

  ${!investigationReady ? `<section class="m01-worksheet-locked" aria-label="Triage worksheet locked">
    <i class="ri-lock-line" aria-hidden="true"></i>
    <div><strong>Triage worksheet</strong><p>Review all four facts first. In real work, deciding before reading the available evidence creates avoidable mistakes.</p></div>
  </section>` : !consoleComplete ? `<section class="m01-worksheet-locked" aria-label="Triage worksheet locked until the guided console is complete">
    <i class="ri-lock-line" aria-hidden="true"></i>
    <div><strong>Complete the guided console walkthrough</strong><p>Follow all eight coach steps through the sign-in log, risk detection, and incident record. The console returns you here and unlocks this worksheet when the walkthrough is complete.</p></div>
  </section>` : `<form id="m01-form" class="m01-worksheet" novalidate>
    <div class="m01-panel-heading">
      <div><p class="m01-kicker">Guided decision</p><h3>Complete the five-part triage record</h3></div>
      <span class="m01-evidence-count">No timer · retry allowed</span>
    </div>

    <fieldset class="m01-fieldset">
      <legend><span>1</span> What is your verdict?</legend>
      <p class="m01-help">The user denial is the decisive validation fact.</p>
      ${moduleOneOptionList('verdict', lab.verdictOptions)}
    </fieldset>

    <fieldset class="m01-fieldset">
      <legend><span>2</span> What priority should the case receive?</legend>
      <p class="m01-help">Consider outcome, confidence, scope, and impact—not only the alert's initial Medium label.</p>
      ${moduleOneOptionList('priority', lab.priorityOptions)}
    </fieldset>

    <fieldset class="m01-fieldset">
      <legend><span>3</span> Where are you in the incident response lifecycle?</legend>
      <p class="m01-help">You have validated and classified the alert, but containment has not happened yet.</p>
      ${moduleOneOptionList('phase', lab.phaseOptions)}
    </fieldset>

    <fieldset class="m01-fieldset">
      <legend><span>4</span> What is the safest next action for the analyst?</legend>
      <p class="m01-help">Stay inside the observed scope and your authority. Preserve evidence for the responder.</p>
      ${moduleOneOptionList('decision', lab.decisionOptions)}
    </fieldset>

    <div class="m01-fieldset">
      <label for="m01-notes" class="m01-note-label"><span>5</span><strong>Write the case note</strong></label>
      <p class="m01-help" id="m01-notes-help">Use: what happened + strongest evidence + your decision. You may use the starter, then read it as if you were receiving the handoff.</p>
      <button type="button" class="m01-note-starter" data-m01-note-starter><i class="ri-magic-line" aria-hidden="true"></i> Insert a plain-language note starter</button>
      <textarea id="m01-notes" name="notes" rows="5" maxlength="700" aria-describedby="m01-notes-help m01-note-count" placeholder="ALT-1001: Observed… Evidence shows… Recommend…">${esc(moduleOneState.notes)}</textarea>
      <p class="m01-note-count" id="m01-note-count"><span>${moduleOneState.notes.length}</span>/700 characters</p>
    </div>

    <div class="m01-actions">
      <button type="submit" class="m01-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my triage</button>
      <button type="button" class="m01-reset" data-m01-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this guided lab</button>
    </div>
    ${moduleOneScorePanel()}
  </form>`}
  `;
}

function viewModuleOne(user, program) {
  moduleOneLoad(user);
  const lab = MODULE_ONE_ALERT_ORIENTATION;

  return `<div class="m01-shell">
    <header class="m01-topbar">
      <a href="#/program/${esc(program.slug)}" class="m01-brand" aria-label="Back to SOC Analyst program">
        <img src="assets/logo.png" alt="Mission Next Technical Academy" />
      </a>
      <div class="m01-top-actions">
        <span class="m01-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Beginner simulation · fictional data</span>
        <a href="#/program/${esc(program.slug)}" class="m01-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a>
      </div>
    </header>

    <main class="m01-main">
      <section class="m01-hero" aria-labelledby="m01-title">
        <div>
          <p class="m01-kicker">Module 01 · Start here · no SOC experience assumed</p>
          <h1 id="m01-title">What Is a SOC Analyst?</h1>
          <p class="m01-lede">Meet the team that watches for security threats, learn the language of alerts and incidents, follow the incident response lifecycle, and triage one clear alert with a coach beside you.</p>
          <a class="m01-hero-action" href="#m01-foundations"><i class="ri-book-open-line" aria-hidden="true"></i> Begin with the foundations</a>
        </div>
        <dl class="m01-progress" aria-label="Saved guided-lab progress">
          <div><dt>Foundation lessons</dt><dd>9</dd></div>
          <div><dt>Guided lab</dt><dd>${lab.minutes} min</dd></div>
          <div><dt>Lab status</dt><dd id="m01-status">${moduleOneState.completed && moduleOneState.consoleCompleted ? 'Complete' : 'Not complete'}</dd></div>
        </dl>
      </section>

      <section class="m01-objective" aria-labelledby="m01-objective-title">
        <div class="m01-objective-icon"><i class="ri-compass-3-line" aria-hidden="true"></i></div>
        <div>
          <p class="m01-kicker" id="m01-objective-title" tabindex="-1">Your starting point</p>
          <p>By the end, you will be able to explain what a SOC analyst does, distinguish an event from an alert and incident, place triage in the response lifecycle, and create a simple evidence-based handoff.</p>
        </div>
      </section>

      <section class="m01-section" id="m01-foundations" aria-labelledby="m01-foundations-title">
        <div class="m01-section-heading">
          <span>1</span>
          <div><p class="m01-kicker">Nine short foundation lessons</p><h2 id="m01-foundations-title">Meet security operations from the beginning</h2></div>
        </div>
        <p class="m01-instruction">Read these in order on your first visit. Each lesson gives you one idea to carry into the lab; open a lesson to see the explanation.</p>
        ${moduleOneLessons(lab)}
        ${moduleOneReferences(lab)}
      </section>

      <section class="m01-section" aria-labelledby="m01-flow-title">
        <div class="m01-section-heading">
          <span>2</span>
          <div><p class="m01-kicker">Security architecture, without the jargon wall</p><h2 id="m01-flow-title">How activity becomes analyst work</h2></div>
        </div>
        <div class="m01-flow" aria-label="Activity-to-investigation flow">
          ${lab.signalFlow.map((step) => `<article><i class="${esc(step.icon)}" aria-hidden="true"></i><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p></article>`).join('')}
        </div>
        <div class="m01-tool-translation">
          <strong>Tool translation</strong>
          <dl>
            <div><dt>SIEM</dt><dd><strong>Security Information and Event Management.</strong> Collects and analyzes security events from many sources.</dd></div>
            <div><dt>EDR</dt><dd><strong>Endpoint Detection and Response.</strong> Records endpoint behavior and supports device investigation and response.</dd></div>
            <div><dt>XDR</dt><dd><strong>Extended Detection and Response.</strong> Connects evidence across domains such as identity, endpoint, email, and cloud.</dd></div>
          </dl>
          <p>Products help organize facts. The analyst is responsible for what those facts support.</p>
        </div>
      </section>

      <section class="m01-section" aria-labelledby="m01-lifecycle-title">
        <div class="m01-section-heading">
          <span>3</span>
          <div><p class="m01-kicker">The map for responding</p><h2 id="m01-lifecycle-title">Incident response lifecycle</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="incident response lifecycle" aria-expanded="true" aria-controls="m01-lifecycle-body" aria-label="Collapse incident response lifecycle">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-lifecycle-body">
          <p class="m01-instruction">Frameworks group or name phases differently. This six-part model shows the complete operational idea and matches the response work referenced by current CySA+ objectives. Select each phase to rotate the lifecycle and open its definition.</p>
          <div class="m01-lifecycle-wheel" style="--wheel-rotation: 0deg" data-m01-lifecycle-wheel>
            <div class="m01-wheel-track" aria-hidden="true">
              ${lab.lifecycle.map((phase, index) => `<span style="--wheel-step: ${index}"><i class="ri-arrow-right-s-line"></i></span>`).join('')}
              <div class="m01-wheel-hub">
                <i class="ri-cycle-line"></i>
                <strong>Incident response</strong>
                <small data-m01-hub-phase>Phase 1 · ${esc(lab.lifecycle[0].title)}</small>
              </div>
            </div>
            <ol class="m01-lifecycle" aria-label="Incident response phases">
              ${lab.lifecycle.map((phase, index) => `<li class="${index === 0 ? 'is-active' : ''}" data-m01-phase-card="${index}">
                <button type="button" class="m01-phase-button" data-m01-phase="${index}"
                        aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="m01-phase-detail-${esc(phase.id)}">
                  <span class="m01-phase-heading"><span>${index + 1}</span><i class="${esc(phase.icon)}" aria-hidden="true"></i><span class="m01-phase-title">${esc(phase.title)}</span><i class="ri-arrow-down-s-line m01-phase-chevron" aria-hidden="true"></i></span>
                </button>
                <div class="m01-phase-detail" id="m01-phase-detail-${esc(phase.id)}" ${index === 0 ? '' : 'hidden'}>
                  <p>${esc(phase.description)}</p>
                </div>
              </li>`).join('')}
            </ol>
          </div>
          <p class="m01-concept"><strong>Where does the SOC analyst fit?</strong> Analysts contribute across the lifecycle, but alert triage sits mainly in <em>detect &amp; analyze</em>. Triage determines whether a response is needed and gives the response team verified evidence, scope, and priority.</p>
        </div>
      </section>

      <section class="m01-section" aria-labelledby="m01-loop-title">
        <div class="m01-section-heading">
          <span>4</span>
          <div><p class="m01-kicker">The repeatable habit</p><h2 id="m01-loop-title">Your five-step triage loop</h2></div>
        </div>
        <ol class="m01-triage-loop">
          ${lab.triageLoop.map((item, index) => `<li><span>${index + 1}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p></div></li>`).join('')}
        </ol>
        <div class="m01-boundary"><i class="ri-error-warning-line" aria-hidden="true"></i><p><strong>Beginner guardrail:</strong> Never take a disruptive response action just because a screen offers a button. Confirm the evidence, follow the organization's playbook, and stay inside your assigned authority.</p></div>
      </section>

      <section class="m01-section m01-lab-section" id="m01-guided-lab" aria-labelledby="m01-lab-title">
        <div class="m01-section-heading">
          <span>5</span>
          <div><p class="m01-kicker">One easy, truthful incident · ${lab.minutes} minutes</p><h2 id="m01-lab-title">Guided lab: your first SOC alert</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="guided lab" aria-expanded="true" aria-controls="m01-guided-lab-body" aria-label="Collapse guided lab">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-lab-body" id="m01-guided-lab-body">
          <div class="m01-lab-brief">
            <i class="ri-user-star-line" aria-hidden="true"></i>
            <div><strong>Your role: Tier 1 SOC analyst</strong><p>You are responsible for validating this identity alert and creating a clear handoff. You are not expected to hunt across an enterprise or operate unfamiliar response tools.</p></div>
          </div>
          <div id="m01-lab-dynamic">${moduleOneLabDynamic()}</div>
        </div>
      </section>
    </main>
  </div>`;
}

function moduleOneScore() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const verdict = moduleOneState.verdict === lab.correctVerdict ? 25 : 0;
  const priority = moduleOneState.priority === lab.correctPriority ? 20 : 0;
  const lifecycle = moduleOneState.phase === lab.correctPhase ? 15 : 0;
  const action = moduleOneState.decision === lab.correctDecision ? 25 : 0;
  const note = moduleOneState.notes.trim().toLowerCase();
  const communication = (note.length >= 60 ? 8 : 0)
    + (/(j\.santos|account)/.test(note) && /(success|succeeded|unauthori|denies|denied)/.test(note) && /(escalat|contain|revoke|reset)/.test(note) ? 7 : 0);
  const score = verdict + priority + lifecycle + action + communication;

  return {
    score,
    breakdown: { verdict, priority, lifecycle, action, communication },
    feedback: [
      verdict ? 'Verdict: Correct. Successful access plus the account owner’s denial confirms a true positive.' : 'Verdict: Choose true positive. The sign-in succeeded and the account owner independently denied it.',
      priority ? 'Priority: Correct. Confirmed unauthorized access needs prompt response even though only one identity is currently in scope.' : 'Priority: Use High. Confidence is strong and the attacker obtained an active session.',
      lifecycle ? 'Lifecycle: Correct. You are in detection and analysis; containment is the next response activity, not a completed one.' : 'Lifecycle: Triage belongs in detect and analyze. The evidence has been validated, but access has not yet been contained.',
      action ? 'Next action: Correct. The handoff preserves evidence and invokes an authorized, proportionate identity response.' : 'Next action: Escalate with evidence and follow the identity-containment playbook. Do not close the case or disrupt unrelated systems.',
      communication === 15 ? 'Case note: Clear. It names the entity, observed unauthorized access, and recommended response.' : 'Case note: Name the account, successful or denied activity, and the escalation or containment recommendation in at least 60 characters.',
    ],
  };
}

function moduleOneRenderDynamic(focusId) {
  const root = document.getElementById('m01-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleOneLabDynamic();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleOneLab() {
  document.querySelectorAll('[data-m01-section-toggle]').forEach((sectionToggle) => {
    const sectionBody = document.getElementById(sectionToggle.getAttribute('aria-controls'));
    if (!sectionBody) return;

    sectionToggle.addEventListener('click', () => {
      const isExpanded = sectionToggle.getAttribute('aria-expanded') === 'true';
      const sectionLabel = sectionToggle.dataset.m01SectionLabel || 'section';
      sectionToggle.setAttribute('aria-expanded', String(!isExpanded));
      sectionToggle.setAttribute('aria-label', `${isExpanded ? 'Expand' : 'Collapse'} ${sectionLabel}`);
      sectionBody.hidden = isExpanded;
    });
  });

  const lifecycleWheel = document.querySelector('[data-m01-lifecycle-wheel]');
  if (lifecycleWheel) {
    lifecycleWheel.addEventListener('click', (event) => {
      const phaseButton = event.target.closest('[data-m01-phase]');
      if (!phaseButton || !lifecycleWheel.contains(phaseButton)) return;

      const activeIndex = Number(phaseButton.dataset.m01Phase);
      const phases = lifecycleWheel.querySelectorAll('[data-m01-phase]');
      phases.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.setAttribute('aria-expanded', String(isActive));
        button.closest('[data-m01-phase-card]')?.classList.toggle('is-active', isActive);
        const detail = document.getElementById(button.getAttribute('aria-controls'));
        if (detail) detail.hidden = !isActive;
      });

      lifecycleWheel.style.setProperty('--wheel-rotation', `${activeIndex * -60}deg`);
      const selectedPhase = MODULE_ONE_ALERT_ORIENTATION.lifecycle[activeIndex];
      const hubPhase = lifecycleWheel.querySelector('[data-m01-hub-phase]');
      if (hubPhase && selectedPhase) hubPhase.textContent = `Phase ${activeIndex + 1} · ${selectedPhase.title}`;
    });
  }

  const root = document.getElementById('m01-lab-dynamic');
  if (!root || !moduleOneState) return;

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m01-console-launch]')) {
      moduleOneState.consoleStarted = true;
      moduleOneSave();
      return;
    }

    const reveal = event.target.closest('[data-m01-reveal]');
    if (reveal) {
      const evidenceId = reveal.dataset.m01Reveal;
      if (!moduleOneState.reviewedEvidence.includes(evidenceId)) moduleOneState.reviewedEvidence.push(evidenceId);
      moduleOneState.validationError = '';
      moduleOneSave();
      moduleOneRenderDynamic('m01-evidence-title');
      return;
    }

    if (event.target.closest('[data-m01-note-starter]')) {
      moduleOneState.notes = 'ALT-1001: Eight failed sign-ins were followed by a successful session for j.santos from an unfamiliar, unmanaged browser. The user denied the activity. Classify as a high-priority true positive and escalate under the approved identity-containment playbook.';
      moduleOneSave();
      moduleOneRenderDynamic('m01-notes');
      return;
    }

    if (event.target.closest('[data-m01-reset]')) {
      moduleOneState = LabRuntime.reset(MODULE_ONE_LAB_ID, moduleOneUser, MODULE_ONE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY, false);
      }
      moduleOneRenderDynamic('m01-scenario-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (['verdict', 'priority', 'phase', 'decision'].includes(input.name)) {
      moduleOneState[input.name] = input.value;
      moduleOneState.validationError = '';
      moduleOneSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.name !== 'notes') return;
    moduleOneState.notes = event.target.value;
    const count = root.querySelector('#m01-note-count span');
    if (count) count.textContent = String(event.target.value.length);
    moduleOneSave();
  });

  root.addEventListener('submit', (event) => {
    if (event.target.id !== 'm01-form') return;
    event.preventDefault();
    const form = event.target;
    moduleOneState.notes = form.elements.notes.value;
    const missing = ['verdict', 'priority', 'phase', 'decision'].filter((name) => !moduleOneState[name]);
    if (missing.length || moduleOneState.notes.trim().length < 60) {
      moduleOneState.validationError = missing.length
        ? 'Choose an answer for each numbered decision, then write a case note of at least 60 characters.'
        : 'Your decisions are recorded. Add a little more detail so the case note reaches at least 60 characters.';
      moduleOneSave();
      moduleOneRenderDynamic('m01-feedback');
      return;
    }

    const result = moduleOneScore();
    moduleOneState.attempts += 1;
    moduleOneState.score = result.score;
    moduleOneState.bestScore = Math.max(moduleOneState.bestScore || 0, result.score);
    moduleOneState.breakdown = result.breakdown;
    moduleOneState.feedback = result.feedback;
    moduleOneState.validationError = '';
    moduleOneState.lastSubmittedAt = new Date().toISOString();
    if (result.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore) {
      moduleOneState.completed = true;
      if (!moduleOneState.flags.includes(MODULE_ONE_FLAG)) moduleOneState.flags.push(MODULE_ONE_FLAG);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
      }
    }
    moduleOneSave();
    moduleOneRenderDynamic('m01-feedback');
    const status = document.getElementById('m01-status');
    if (status) status.textContent = moduleOneState.completed && moduleOneState.consoleCompleted ? 'Complete' : 'In progress';
  });
}

function moduleOneReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== 'm01') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = currentUser();
  if (!user) return;

  const saved = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
  saved.consoleStarted = true;
  saved.consoleCompleted = true;
  LabRuntime.save(MODULE_ONE_LAB_ID, user, saved);
  moduleOneState = saved;
  moduleOneUser = user;

  if (saved.completed && typeof markModuleLabComplete === 'function') {
    markModuleLabComplete(user, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
  }
  if (location.hash === '#/program/soc-analyst/module/1') render();
}

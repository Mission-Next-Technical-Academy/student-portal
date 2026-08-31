/* Module 01 — beginner-first SOC foundations and a single guided triage.
 * All records and actions are fictional, browser-local simulations.
 */

const MODULE_ONE_LAB_ID = 'm01-first-soc-alert-v2';
const MODULE_ONE_FLAG = 'M01-FIRST-ALERT-TRIAGED';
const MODULE_ONE_CATALOG_LAB_KEY = 'lab-soc-environment';
const MODULE_ONE_ROUTE = '#/program/soc-analyst/module/1';

const MODULE_ONE_DEFAULT_STATE = {
  reviewedEvidence: [],
  factTries: {},
  factWrong: [],
  factError: '',
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
let moduleOneJustCorrect = '';

function moduleOneLoad(user) {
  moduleOneUser = user;
  moduleOneState = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
  if (!Array.isArray(moduleOneState.reviewedEvidence)) moduleOneState.reviewedEvidence = [];
  if (!Array.isArray(moduleOneState.factWrong)) moduleOneState.factWrong = [];
  if (!moduleOneState.factTries || typeof moduleOneState.factTries !== 'object') moduleOneState.factTries = {};
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
      <p class="m01-kicker">Role context</p>
      <h3 id="m01-reference-title">Analyst work, with a beginner bridge</h3>
      <p>This course starts with the role, vocabulary, and decision loop that a new SOC analyst needs before handling a larger investigation.</p>
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

// ---------- recorded facts ----------
//
// The timeline is filled in, not revealed: the student has just read these
// values in the console, and writing them down is the first half of a case
// note. Matching is deliberately forgiving — trimmed, lower-cased, punctuation
// and interior spacing ignored — because the skill being practised is reading
// a log, not typing an exact string.
function moduleOneNormalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.,;:'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function moduleOneBlankCorrect(blank, value) {
  const given = moduleOneNormalize(value);
  if (!given) return false;
  return blank.accept.some((accepted) => moduleOneNormalize(accepted) === given);
}

function moduleOneFactTries(factId) {
  return Number(moduleOneState.factTries[factId] || 0);
}

function moduleOneRecordedSentence(fact) {
  return fact.template.replace(/\{(\w+)\}/g, (_, key) => {
    const blank = fact.blanks.find((item) => item.key === key);
    return blank ? blank.answer : '';
  });
}

function moduleOneMaskIsEditable(character) {
  return /[\p{L}\p{N}]/u.test(character);
}

function moduleOneMaskedBlank(blank, isWrong) {
  const characters = Array.from(blank.answer);
  const editableCount = characters.filter(moduleOneMaskIsEditable).length;
  const inputMode = characters.every((character) => !moduleOneMaskIsEditable(character) || /\d/.test(character))
    ? 'numeric'
    : 'text';
  let editableIndex = 0;
  const parts = characters.map((character) => {
    if (!moduleOneMaskIsEditable(character)) {
      const spaceClass = /\s/.test(character) ? ' is-space' : '';
      return `<span class="m01-mask-literal${spaceClass}" data-m01-mask-part data-m01-mask-literal="${esc(character)}" aria-hidden="true">${esc(character)}</span>`;
    }

    editableIndex += 1;
    return `<input class="m01-mask-slot" type="text" size="1" maxlength="1" inputmode="${inputMode}"
                   autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="_"
                   data-m01-mask-part data-m01-mask-slot aria-label="${esc(blank.label)}, character ${editableIndex} of ${editableCount}"
                   aria-invalid="${isWrong ? 'true' : 'false'}" />`;
  }).join('');

  const helper = blank.showHelper === true
    ? `<small>${esc(blank.label)} · ${characters.length}-character value · ${editableCount} to type</small>`
    : '';

  return `<span class="m01-mask" data-m01-mask role="group"
                aria-label="${esc(blank.label)}. ${characters.length}-character format; ${editableCount} characters to type. Punctuation is prefilled.">
      ${parts}
    </span>
    <input type="hidden" name="${esc(blank.key)}" value="" data-m01-mask-value />
    ${helper}`;
}

function moduleOneMaskSlots(mask) {
  return Array.from(mask.querySelectorAll('[data-m01-mask-slot]'));
}

function moduleOneSyncMask(mask) {
  const blank = mask.closest('.m01-blank');
  const valueInput = blank?.querySelector('[data-m01-mask-value]');
  if (!valueInput) return;
  valueInput.value = Array.from(mask.querySelectorAll('[data-m01-mask-part]'))
    .map((part) => part.matches('[data-m01-mask-slot]') ? part.value : part.dataset.m01MaskLiteral)
    .join('');
}

function moduleOneFillMask(mask, startSlot, text) {
  const slots = moduleOneMaskSlots(mask);
  const startIndex = Math.max(0, slots.indexOf(startSlot));
  const characters = Array.from(String(text || '')).filter(moduleOneMaskIsEditable);
  slots.slice(startIndex).forEach((slot) => { slot.value = ''; });
  characters.slice(0, slots.length - startIndex).forEach((character, offset) => {
    slots[startIndex + offset].value = character;
  });
  moduleOneSyncMask(mask);

  const nextSlot = slots[Math.min(startIndex + characters.length, slots.length - 1)];
  if (nextSlot) {
    nextSlot.focus();
    nextSlot.select();
  }
}

function moduleOneBlankForm(fact) {
  const wrong = new Set(moduleOneState.factWrong);
  const tries = moduleOneFactTries(fact.id);
  const showHints = tries >= 1;
  const sentence = fact.template.split(/(\{\w+\})/).map((piece) => {
    const match = piece.match(/^\{(\w+)\}$/);
    if (!match) return esc(piece);
    const blank = fact.blanks.find((item) => item.key === match[1]);
    if (!blank) return '';
    const isWrong = wrong.has(blank.key);
    return `<span class="m01-blank ${isWrong ? 'is-wrong' : ''}">
      ${moduleOneMaskedBlank(blank, isWrong)}
    </span>`;
  }).join('');

  return `<form class="m01-fact-form" data-m01-fact="${esc(fact.id)}" novalidate>
    <p class="m01-fact-prompt">${esc(fact.prompt)}</p>
    <p class="m01-fact-sentence">${sentence}</p>
    ${moduleOneState.factError ? `<p class="m01-fact-error" role="alert">${esc(moduleOneState.factError)}</p>` : ''}
    ${showHints ? `<ul class="m01-fact-hints">
      ${fact.blanks.filter((blank) => wrong.has(blank.key) || tries >= 2).map((blank) =>
        `<li><strong>${esc(blank.label)}:</strong> ${esc(blank.hint)}</li>`).join('')}
    </ul>` : ''}
    <div class="m01-fact-actions">
      <button type="submit" class="m01-reveal"><i class="ri-check-line" aria-hidden="true"></i> Record this fact</button>
      <a class="m01-fact-reopen" href="${esc(SIM_ORIGIN)}?coach=m01&amp;restart=1#/entra/sign-in-logs" target="_blank" rel="opener">
        <i class="ri-external-link-line" aria-hidden="true"></i> Reopen the log</a>
    </div>
  </form>`;
}

function moduleOneLabDynamic() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const scenario = lab.scenario;
  const incidentRoute = `${SIM_ORIGIN}#/sentinel/incidents`;
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

  <section class="m01-siem ${consoleComplete ? 'is-complete' : ''}" aria-labelledby="m01-siem-title">
    <div class="m01-siem-copy">
      <p class="m01-kicker">${consoleComplete ? 'Required walkthrough complete' : 'Required · 10 minutes'}</p>
      <h3 id="m01-siem-title">Lab 1: investigate the alert in the console</h3>
      <p>Every fact above came from somewhere. Open the walkthrough and the coach starts you where a real shift
      starts — the alert queue — then has you open the alert, navigate to the sign-in log yourself, and read the
      eight failures and the success that followed them. Only the buttons the step allows are clickable, and
      nothing outside the sandbox is reachable until you exit. Finish Lab 1 and Lab 2 opens here.</p>
    </div>
    <a class="m01-siem-launch" data-m01-console-launch href="${esc(SIM_ORIGIN)}?coach=m01&amp;restart=1#/defender/alerts" target="_blank" rel="opener">
      <i class="${consoleComplete ? 'ri-refresh-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${consoleComplete ? 'Review Lab 1 walkthrough' : 'Start Lab 1 walkthrough'}
    </a>
  </section>

  ${!consoleComplete ? `<section class="m01-worksheet-locked" aria-label="Investigation timeline locked until the guided console is complete">
    <i class="ri-lock-line" aria-hidden="true"></i>
    <div><strong>Investigation timeline</strong><p>Next Step: finish Lab 1 in the walkthrough, then return here. You cannot write down what a log said before reading it.</p></div>
  </section>` : `<section class="m01-evidence" aria-labelledby="m01-evidence-title">
    <div class="m01-panel-heading">
      <div><p class="m01-kicker">Record what the log showed</p><h3 id="m01-evidence-title">Investigation timeline</h3></div>
      <span class="m01-evidence-count">${reviewedCount}/${scenario.evidence.length} facts recorded</span>
    </div>
    <ol class="m01-timeline">
      ${scenario.evidence.map((item, index) => {
        const isReviewed = reviewed.has(item.id);
        const isActive = nextEvidence && nextEvidence.id === item.id;
        if (isReviewed) {
          const justCorrect = moduleOneJustCorrect === item.id;
          return `<li class="is-reviewed ${justCorrect ? 'is-just-correct' : ''}">
            <span class="m01-timeline-marker"><i class="${esc(item.icon)}" aria-hidden="true"></i></span>
            <div><time>${esc(item.time)}</time><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p>
            ${justCorrect ? `<p class="m01-fact-success" id="m01-fact-success" role="status" tabindex="-1">
              <i class="ri-checkbox-circle-fill" aria-hidden="true"></i>
              Correct — fact recorded. The next fact is now unlocked.</p>` : ''}</div>
          </li>`;
        }
        if (isActive && item.blanks) {
          return `<li class="is-active">
            <span class="m01-timeline-marker"><i class="ri-edit-line" aria-hidden="true"></i></span>
            <div><time>${esc(item.time)}</time><strong>Fact ${index + 1} — fill in the blanks</strong>
            ${moduleOneBlankForm(item)}</div>
          </li>`;
        }
        if (isActive) {
          return `<li class="is-active">
            <span class="m01-timeline-marker"><i class="ri-phone-line" aria-hidden="true"></i></span>
            <div><time>${esc(item.time)}</time><strong>Fact ${index + 1} — handed to you</strong>
            <p>This one does not live in the log. The service desk called the account owner while you were reading it.</p>
            <button type="button" class="m01-reveal" data-m01-reveal="${esc(item.id)}">
              <i class="ri-eye-line" aria-hidden="true"></i> Read the service-desk callback</button></div>
          </li>`;
        }
        return `<li class="is-locked">
          <span class="m01-timeline-marker"><i class="ri-lock-line" aria-hidden="true"></i></span>
          <div><time>Fact ${index + 1}</time><strong>Not recorded yet</strong><p>Record the preceding fact to continue.</p></div>
        </li>`;
      }).join('')}
    </ol>
    ${!nextEvidence ? `<div class="m01-evidence-complete"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i><span><strong>Timeline recorded.</strong> Every fact came from something you read yourself. You can now make the first triage decision.</span></div>` : ''}
  </section>`}

  ${!consoleComplete || !investigationReady ? `<section class="m01-worksheet-locked" aria-label="Triage worksheet locked">
    <i class="ri-lock-line" aria-hidden="true"></i>
    <div><strong>Triage worksheet</strong><p>Record every fact correctly first. A wrong answer keeps the current fact open and the remaining timeline and worksheet locked.</p></div>
  </section>` : `<section class="m01-worksheet-locked" aria-label="Lab 2 unlocked">
    <i class="ri-shield-check-line" aria-hidden="true"></i>
    <div>
      <strong>Lab 2: escalate the incident in Sentinel</strong>
      <p>Open the incident view, confirm the affected account, and then finish the handoff so the responder can take over identity containment.</p>
      <a class="m01-siem-launch" href="${esc(incidentRoute)}" target="_blank" rel="opener">
        <i class="ri-external-link-line" aria-hidden="true"></i> Open SIEM incident view
      </a>
    </div>
  </section><form id="m01-form" class="m01-worksheet" novalidate>
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
      <label for="m01-notes" class="m01-note-label"><span>Lab 2</span><strong>Case handoff note</strong></label>
      <p class="m01-help" id="m01-notes-help">Open the SIEM incident view first, then write it like a handoff: what happened, the strongest evidence, and your decision.</p>
      <a class="m01-note-starter" href="${esc(incidentRoute)}" target="_blank" rel="opener"><i class="ri-external-link-line" aria-hidden="true"></i> Open the SIEM incident view</a>
      <button type="button" class="m01-note-starter" data-m01-note-starter><i class="ri-magic-line" aria-hidden="true"></i> Insert a plain-language handoff starter</button>
      <textarea id="m01-notes" name="notes" rows="5" maxlength="700" aria-describedby="m01-notes-help m01-note-count" placeholder="Handoff note: I opened the Sentinel incident, confirmed the affected account, and will escalate for identity containment because...">${esc(moduleOneState.notes)}</textarea>
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
  const module = program.modules['soc-01'];
  const moduleLabs = LABS.filter((item) => item.module === module.key);
  const moduleLabMinutes = moduleLabs.reduce((total, item) => total + item.instructionalMinutes, 0);

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
          <p class="m01-kicker">Module 01 · ${formatInstructionalMinutes(module.durationMinutes)} · Start here</p>
          <h1 id="m01-title">${esc(module.title)}</h1>
          <p class="m01-lede">Meet the team that watches for security threats, learn the language of alerts and incidents, follow the incident response lifecycle, and triage one clear alert with a coach beside you.</p>
          <a class="m01-hero-action" href="#m01-foundations"><i class="ri-book-open-line" aria-hidden="true"></i> Begin with the foundations</a>
        </div>
        <dl class="m01-progress" aria-label="Saved lab progress">
          <div><dt>Foundation lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Labs</dt><dd>${module.labs}</dd></div>
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
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="foundation lessons" aria-expanded="true" aria-controls="m01-foundations-body" aria-label="Collapse foundation lessons">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-foundations-body">
          <p class="m01-instruction">Read these in order on your first visit. Each lesson gives you one idea to carry into the lab; open a lesson to see the explanation.</p>
          ${moduleOneLessons(lab)}
          ${moduleOneReferences(lab)}
        </div>
      </section>

      <section class="m01-section" aria-labelledby="m01-flow-title">
        <div class="m01-section-heading">
          <span>2</span>
          <div><p class="m01-kicker">Security architecture, without the jargon wall</p><h2 id="m01-flow-title">How activity becomes analyst work</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="activity-to-investigation flow" aria-expanded="true" aria-controls="m01-flow-body" aria-label="Collapse activity-to-investigation flow">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-flow-body">
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
          <p class="m01-instruction">Frameworks group or name phases differently. This six-part model shows the complete operational idea used in day-to-day response work. Select each phase to rotate the lifecycle and open its definition.</p>
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
              ${lab.lifecycle.map((phase, index) => `<li data-m01-phase-card="${index}">
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
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="five-step triage loop" aria-expanded="true" aria-controls="m01-loop-body" aria-label="Collapse five-step triage loop">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-loop-body">
          <p class="m01-instruction">Select each step to rotate the wheel and focus on the question an analyst should answer before moving forward.</p>
          <div class="m01-triage-wheel" style="--triage-wheel-rotation: 0deg" data-m01-triage-wheel>
            <div class="m01-triage-track" aria-hidden="true">
              ${lab.triageLoop.map((item, index) => `<span style="--triage-wheel-step: ${index}"><i class="ri-arrow-right-s-line"></i></span>`).join('')}
              <div class="m01-triage-hub">
                <i class="ri-radar-line"></i>
                <strong>Triage loop</strong>
                <small data-m01-triage-hub>Step 1 · ${esc(lab.triageLoop[0].title)}</small>
              </div>
            </div>
            <ol class="m01-triage-loop" aria-label="Five-step alert triage loop">
              ${lab.triageLoop.map((item, index) => `<li data-m01-triage-card="${index}">
                <button type="button" class="m01-triage-button" data-m01-triage-step="${index}"
                        aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="m01-triage-detail-${index + 1}">
                  <span class="m01-triage-heading"><span>${index + 1}</span><span class="m01-triage-title">${esc(item.title)}</span><i class="ri-arrow-down-s-line m01-triage-chevron" aria-hidden="true"></i></span>
                </button>
                <div class="m01-triage-detail" id="m01-triage-detail-${index + 1}" ${index === 0 ? '' : 'hidden'}>
                  <p>${esc(item.description)}</p>
                </div>
              </li>`).join('')}
            </ol>
          </div>
          <div class="m01-boundary"><i class="ri-error-warning-line" aria-hidden="true"></i><p><strong>Beginner guardrail:</strong> Never take a disruptive response action just because a screen offers a button. Confirm the evidence, follow the organization's playbook, and stay inside your assigned authority.</p></div>
        </div>
      </section>

      <section class="m01-section m01-lab-section" id="m01-guided-lab" aria-labelledby="m01-lab-title">
        <div class="m01-section-heading">
          <span>5</span>
          <div><p class="m01-kicker">${moduleLabs.length} labs · ${formatInstructionalMinutes(moduleLabMinutes)} instructional time</p><h2 id="m01-lab-title">Lab 1 and Lab 2: your first SOC alert</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-label="lab block" aria-expanded="true" aria-controls="m01-guided-lab-body" aria-label="Collapse lab block">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-lab-body" id="m01-guided-lab-body">
          <div class="m01-lab-brief">
            <i class="ri-user-star-line" aria-hidden="true"></i>
            <div><strong>Two labs, one case</strong><p>Lab 1 is the guided console. Lab 2 is the handoff note. Use only the sandboxed buttons in each lab, then carry the note into the report.</p></div>
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
  // Graded in three independent parts rather than all-or-nothing: a first-week
  // student who names the account and says what happened should not score zero
  // on the note because they left the recommendation implicit.
  const note = moduleOneState.notes.trim().toLowerCase();
  const noteNamesEntity = /(j\.santos|account)/.test(note);
  const noteStatesActivity = /(success|succeeded|unauthori|denies|denied|sign-in|signin)/.test(note);
  const noteRecommends = /(escalat|contain|revoke|reset|playbook)/.test(note);
  const communication = (note.length >= 40 ? 6 : 0)
    + (noteNamesEntity ? 3 : 0) + (noteStatesActivity ? 3 : 0) + (noteRecommends ? 3 : 0);
  const score = verdict + priority + lifecycle + action + communication;

  return {
    score,
    breakdown: { verdict, priority, lifecycle, action, communication },
    feedback: [
      verdict ? 'Verdict: Correct. Successful access plus the account owner’s denial confirms a true positive.' : 'Verdict: Choose true positive. The sign-in succeeded and the account owner independently denied it.',
      priority ? 'Priority: Correct. Confirmed unauthorized access needs prompt response even though only one identity is currently in scope.' : 'Priority: Use High. Confidence is strong and the attacker obtained an active session.',
      lifecycle ? 'Lifecycle: Correct. You are in detection and analysis; containment is the next response activity, not a completed one.' : 'Lifecycle: Triage belongs in detect and analyze. The evidence has been validated, but access has not yet been contained.',
      action ? 'Next action: Correct. The handoff preserves evidence and invokes an authorized, proportionate identity response.' : 'Next action: Escalate with evidence and follow the identity-containment playbook. Do not close the case or disrupt unrelated systems.',
      communication === 15
        ? 'Case note: Clear. It names the entity, observed unauthorized access, and recommended response.'
        : `Case note: ${[
            note.length >= 40 ? null : 'write at least a couple of sentences',
            noteNamesEntity ? null : 'name the account',
            noteStatesActivity ? null : 'say what the activity was',
            noteRecommends ? null : 'say what should happen next',
          ].filter(Boolean).join(', ')}.`,
    ],
  };
}

function moduleOneRenderDynamic(focusId) {
  const root = document.getElementById('m01-lab-dynamic');
  if (!root) return;
  root.innerHTML = moduleOneLabDynamic();
  moduleOneJustCorrect = '';
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
        const detail = document.getElementById(button.getAttribute('aria-controls'));
        if (detail) detail.hidden = !isActive;
      });

      lifecycleWheel.style.setProperty('--wheel-rotation', `${activeIndex * -60}deg`);
      const selectedPhase = MODULE_ONE_ALERT_ORIENTATION.lifecycle[activeIndex];
      const hubPhase = lifecycleWheel.querySelector('[data-m01-hub-phase]');
      if (hubPhase && selectedPhase) hubPhase.textContent = `Phase ${activeIndex + 1} · ${selectedPhase.title}`;
    });
  }

  const triageWheel = document.querySelector('[data-m01-triage-wheel]');
  if (triageWheel) {
    triageWheel.addEventListener('click', (event) => {
      const stepButton = event.target.closest('[data-m01-triage-step]');
      if (!stepButton || !triageWheel.contains(stepButton)) return;

      const activeIndex = Number(stepButton.dataset.m01TriageStep);
      const steps = triageWheel.querySelectorAll('[data-m01-triage-step]');
      steps.forEach((button, index) => {
        const isActive = index === activeIndex;
        button.setAttribute('aria-expanded', String(isActive));
        const detail = document.getElementById(button.getAttribute('aria-controls'));
        if (detail) detail.hidden = !isActive;
      });

      triageWheel.style.setProperty('--triage-wheel-rotation', `${activeIndex * -72}deg`);
      const selectedStep = MODULE_ONE_ALERT_ORIENTATION.triageLoop[activeIndex];
      const hubLabel = triageWheel.querySelector('[data-m01-triage-hub]');
      if (hubLabel && selectedStep) hubLabel.textContent = `Step ${activeIndex + 1} · ${selectedStep.title}`;
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
      moduleOneJustCorrect = evidenceId;
      moduleOneSave();
      moduleOneRenderDynamic('m01-fact-success');
      return;
    }

    if (event.target.closest('[data-m01-note-starter]')) {
      moduleOneState.notes = 'Handoff note: this looks like a likely account compromise. Eight failed sign-ins were followed by a successful session for j.santos@missionnextlabs.example from Bucharest, RO. The device is not registered and the user denied the activity. My decision is to escalate for identity containment and keep the responder focused on the affected account, session, and follow-up checks.';
      moduleOneSave();
      moduleOneRenderDynamic('m01-notes');
      return;
    }

    if (event.target.closest('[data-m01-reset]')) {
      moduleOneState = LabRuntime.reset(MODULE_ONE_LAB_ID, moduleOneUser, MODULE_ONE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY, false);
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', 'lab-soc-escalation', false);
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
    const slot = event.target.closest('[data-m01-mask-slot]');
    if (slot) {
      const mask = slot.closest('[data-m01-mask]');
      if (!mask) return;
      const characters = Array.from(slot.value).filter(moduleOneMaskIsEditable);
      slot.value = characters[0] || '';
      moduleOneSyncMask(mask);
      if (slot.value) {
        const slots = moduleOneMaskSlots(mask);
        const nextSlot = slots[slots.indexOf(slot) + 1];
        if (nextSlot) nextSlot.focus();
      }
      return;
    }

    if (event.target.name !== 'notes') return;
    moduleOneState.notes = event.target.value;
    const count = root.querySelector('#m01-note-count span');
    if (count) count.textContent = String(event.target.value.length);
    moduleOneSave();
  });

  root.addEventListener('keydown', (event) => {
    const slot = event.target.closest('[data-m01-mask-slot]');
    if (!slot) return;
    const mask = slot.closest('[data-m01-mask]');
    if (!mask) return;
    const slots = moduleOneMaskSlots(mask);
    const index = slots.indexOf(slot);

    if (event.key === 'ArrowLeft' && slots[index - 1]) {
      event.preventDefault();
      slots[index - 1].focus();
      return;
    }
    if (event.key === 'ArrowRight' && slots[index + 1]) {
      event.preventDefault();
      slots[index + 1].focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      slots[0]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      slots[slots.length - 1]?.focus();
      return;
    }
    if (event.key === 'Backspace' && !slot.value && slots[index - 1]) {
      event.preventDefault();
      slots[index - 1].value = '';
      slots[index - 1].focus();
      moduleOneSyncMask(mask);
      return;
    }

    // Separators are visible, fixed mask characters. If a learner types one
    // while copying a value, ignore it and leave the next editable slot ready.
    if (event.key.length === 1 && !moduleOneMaskIsEditable(event.key)) {
      event.preventDefault();
    }
  });

  root.addEventListener('paste', (event) => {
    const slot = event.target.closest('[data-m01-mask-slot]');
    if (!slot) return;
    const mask = slot.closest('[data-m01-mask]');
    if (!mask) return;
    event.preventDefault();
    moduleOneFillMask(mask, slot, event.clipboardData?.getData('text/plain') || '');
  });

  root.addEventListener('submit', (event) => {
    const factForm = event.target.closest('[data-m01-fact]');
    if (factForm) {
      event.preventDefault();
      factForm.querySelectorAll('[data-m01-mask]').forEach(moduleOneSyncMask);
      const fact = MODULE_ONE_ALERT_ORIENTATION.scenario.evidence
        .find((item) => item.id === factForm.dataset.m01Fact);
      if (!fact || !fact.blanks) return;
      const wrong = fact.blanks
        .filter((blank) => !moduleOneBlankCorrect(blank, factForm.elements[blank.key].value))
        .map((blank) => blank.key);

      if (!wrong.length) {
        if (!moduleOneState.reviewedEvidence.includes(fact.id)) moduleOneState.reviewedEvidence.push(fact.id);
        moduleOneState.factWrong = [];
        moduleOneState.factError = '';
        moduleOneJustCorrect = fact.id;
        moduleOneSave();
        moduleOneRenderDynamic('m01-fact-success');
        return;
      }

      const tries = moduleOneFactTries(fact.id) + 1;
      moduleOneState.factTries[fact.id] = tries;
      moduleOneState.factWrong = wrong;
      moduleOneState.factError = wrong.length === fact.blanks.length
        ? 'Not yet — none of these match the log. Go back to the sign-in log and read the row again.'
        : `Close. ${wrong.length} of ${fact.blanks.length} still do not match the log — the marked fields.`;
      moduleOneSave();
      moduleOneRenderDynamic('m01-evidence-title');
      return;
    }

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
    const passed = result.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore;
    if (typeof recordLabAttempt === 'function') {
      const attemptFields = {
        state: passed ? 'complete' : 'in_progress',
        score: result.score,
        result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleOneState.attempts },
      };
      recordLabAttempt(moduleOneUser, MODULE_ONE_CATALOG_LAB_KEY, attemptFields);
      recordLabAttempt(moduleOneUser, 'lab-soc-escalation', attemptFields);
    }
    if (passed) {
      moduleOneState.completed = true;
      if (!moduleOneState.flags.includes(MODULE_ONE_FLAG)) moduleOneState.flags.push(MODULE_ONE_FLAG);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', 'lab-soc-escalation');
      }
    }
    moduleOneSave();
    moduleOneRenderDynamic('m01-feedback');
    const status = document.getElementById('m01-status');
    if (status) status.textContent = moduleOneState.completed && moduleOneState.consoleCompleted ? 'Complete' : 'In progress';
  });
}

async function moduleOneReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== 'm01') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
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

  // Bare completion signal — no score attached (the postMessage contract
  // carries only a completion flag; see architecture.md §3 Sprint 3). This is
  // a second, independent lab_attempts row for the same lab_key: the graded
  // worksheet submit above writes its own scored row, this one just records
  // that the guided console itself was completed.
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(user, MODULE_ONE_CATALOG_LAB_KEY, {
      state: 'complete',
      result: { source: 'mnt-coach-complete' },
    });
  }

  // The student may be sitting on an in-page anchor — '#m01-foundations' is the
  // hero's own CTA — when the console reports back. That hash is not a route,
  // so matching the route exactly here left the unlock saved but never drawn:
  // the worksheet stayed locked until a manual reload. Detect the mounted view
  // instead, restore the route, and re-render.
  const mounted = Boolean(document.querySelector('.m01-shell'));
  if (location.hash !== MODULE_ONE_ROUTE && !mounted) return;
  if (location.hash !== MODULE_ONE_ROUTE) history.replaceState(null, '', MODULE_ONE_ROUTE);
  render();

  // Land the student on what just changed rather than at the top of the module.
  const worksheet = document.getElementById('m01-form') || document.querySelector('.m01-siem');
  if (worksheet) worksheet.scrollIntoView({ block: 'start' });
}

registerModuleLab({
  program: 'soc-analyst',
  moduleNumber: 1,
  moduleKey: 'soc-01',
  view: viewModuleOne,
  wire: wireModuleOneLab,
  onMessage: moduleOneReceiveCoachCompletion,
});

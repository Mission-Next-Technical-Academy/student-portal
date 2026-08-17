/* Module 01 — isolated SOC foundation and alert-orientation miniature lab.
 * All records and actions are fictional, browser-local simulations.
 */

const MODULE_ONE_LAB_ID = 'm01-alert-orientation';
const MODULE_ONE_FLAG = 'M01-ALERT-ORIENTED';

const MODULE_ONE_DEFAULT_STATE = {
  selectedAlert: '',
  analysis: '',
  decision: '',
  breakdown: null,
  feedback: [],
  lastSubmittedAt: '',
};

let moduleOneState = null;
let moduleOneUser = null;

function moduleOneLoad(user) {
  moduleOneUser = user;
  moduleOneState = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
  return moduleOneState;
}

function moduleOneSave() {
  if (moduleOneUser && moduleOneState) LabRuntime.save(MODULE_ONE_LAB_ID, moduleOneUser, moduleOneState);
}

function moduleOneSelectedAlert() {
  const alert = MODULE_ONE_ALERT_ORIENTATION.alerts.find((item) => item.id === moduleOneState.selectedAlert);
  return alert ? moduleOneAlertVariant(alert) : null;
}

function moduleOneAlertVariant(alert) {
  const seed = moduleOneState && moduleOneState.anonymousStudentId ? moduleOneState.anonymousStudentId : '0';
  const variantIndex = parseInt(seed.slice(-2), 16) % 3;
  return {
    ...alert,
    entity: (alert.entityVariants || [alert.entity])[variantIndex] || alert.entity,
    age: (alert.ageVariants || [alert.age])[variantIndex] || alert.age,
  };
}

function moduleOneSeverityClass(severity) {
  return `m01-severity m01-severity-${String(severity).toLowerCase()}`;
}

function moduleOneEvidencePanel() {
  const alert = moduleOneSelectedAlert();
  if (!alert) {
    return `<div class="m01-empty" role="status">
      <i class="ri-cursor-line" aria-hidden="true"></i>
      <p>Select one alert to open its limited evidence summary.</p>
    </div>`;
  }

  return `<section class="m01-evidence" aria-labelledby="m01-evidence-title">
    <div class="m01-panel-heading">
      <div>
        <p class="m01-kicker">Selected alert · ${esc(alert.id)}</p>
        <h3 id="m01-evidence-title" tabindex="-1">Alert evidence</h3>
      </div>
      <span class="${moduleOneSeverityClass(alert.severity)}">${esc(alert.severity)}</span>
    </div>
    <dl class="m01-facts">
      <div><dt>Detected by</dt><dd>${esc(alert.detectedBy)}</dd></div>
      <div><dt>Affected entity</dt><dd><code>${esc(alert.entity)}</code></dd></div>
      <div><dt>Rule summary</dt><dd>${esc(alert.summary)}</dd></div>
    </dl>
    <fieldset class="m01-fieldset">
      <legend>Select the two facts that best justify priority</legend>
      <p class="m01-help" id="m01-evidence-help">Evidence is limited to this alert. Choose facts, not assumptions.</p>
      <div class="m01-check-list" aria-describedby="m01-evidence-help">
        ${alert.evidence.map((item) => `
          <label class="m01-check-card">
            <input type="checkbox" name="evidence" value="${esc(item.id)}"
                   ${moduleOneState.selectedEvidence.includes(item.id) ? 'checked' : ''} />
            <span><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></span>
          </label>`).join('')}
      </div>
    </fieldset>
  </section>`;
}

function moduleOneScorePanel() {
  if (!moduleOneState.attempts || !moduleOneState.breakdown) {
    return `<div class="m01-score-empty" id="m01-feedback" role="status" aria-live="polite">
      Submit the worksheet to receive an explainable score across four analyst skills.
    </div>`;
  }

  const b = moduleOneState.breakdown;
  const passed = moduleOneState.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore;
  return `<section class="m01-score ${passed ? 'is-pass' : 'is-remediate'}" id="m01-feedback"
                   tabindex="-1" aria-labelledby="m01-score-title" aria-live="polite">
    <div class="m01-score-summary">
      <div>
        <p class="m01-kicker">Attempt ${moduleOneState.attempts} · Latest submitted score</p>
        <h3 id="m01-score-title">${moduleOneState.score}/100 — ${passed ? 'Objective met' : 'Review and retry'}</h3>
      </div>
      <span class="m01-score-number">${moduleOneState.score}</span>
    </div>
    <div class="m01-score-grid" aria-label="Score breakdown">
      <div><strong>${b.observation}/30</strong><span>Observation</span></div>
      <div><strong>${b.analysis}/25</strong><span>Analysis</span></div>
      <div><strong>${b.decision}/25</strong><span>Decision</span></div>
      <div><strong>${b.communication}/20</strong><span>Communication</span></div>
    </div>
    <ul class="m01-feedback-list">
      ${moduleOneState.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}
    </ul>
    <details class="m01-rubric">
      <summary>How this score was calculated</summary>
      <p><strong>Observation (30):</strong> 15 points for prioritizing the alert with the strongest change in outcome and 15 for selecting both supporting facts.</p>
      <p><strong>Analysis (25):</strong> Connect the failed-to-successful sequence with the new access context; severity alone is not a conclusion.</p>
      <p><strong>Decision (25):</strong> Choose a proportional validation and escalation step that preserves the evidence.</p>
      <p><strong>Communication (20):</strong> Write a concise note that names the observable event and its context.</p>
    </details>
  </section>`;
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
        <span class="m01-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Training simulation · fictional data</span>
        <a href="#/program/${esc(program.slug)}" class="m01-exit"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a>
      </div>
    </header>

    <main class="m01-main">
      <section class="m01-hero" aria-labelledby="m01-title">
        <div>
          <p class="m01-kicker">Module 01 · Guided foundation lab · M01-L01</p>
          <h1 id="m01-title">SOC &amp; Security Architecture</h1>
          <p class="m01-lede">Learn how a signal becomes an analyst-facing alert, then make one evidence-based priority decision in a deliberately limited workspace.</p>
        </div>
        <dl class="m01-progress" aria-label="Saved lab progress">
          <div><dt>Attempts</dt><dd id="m01-attempts">${moduleOneState.attempts}</dd></div>
          <div><dt>Best score</dt><dd id="m01-best-score">${moduleOneState.bestScore}/100</dd></div>
          <div><dt>Status</dt><dd id="m01-status">${moduleOneState.completed ? 'Complete' : 'In progress'}</dd></div>
        </dl>
      </section>

      <section class="m01-objective" aria-labelledby="m01-objective-title">
        <div class="m01-objective-icon"><i class="ri-focus-3-line" aria-hidden="true"></i></div>
        <div>
          <p class="m01-kicker">One measurable objective</p>
          <h2 id="m01-objective-title" tabindex="-1">Prioritize the alert that needs first review and justify it with two facts, a decision, and a concise analyst note.</h2>
          <p>Passing score: ${lab.passingScore}%. Estimated time: ${lab.minutes} minutes. Your choices, note, attempts, flags, and scores save in this browser.</p>
        </div>
      </section>

      <section class="m01-boundary" aria-label="Lab boundary">
        <i class="ri-shield-check-line" aria-hidden="true"></i>
        <p><strong>Focused workspace:</strong> Only a signal-flow model, a four-alert queue, and the selected alert's evidence are available. Global product navigation, incident correlation, search, response controls, and unrelated telemetry are intentionally outside this exercise.</p>
      </section>

      <section class="m01-section" aria-labelledby="m01-flow-title">
        <div class="m01-section-heading">
          <span>1</span>
          <div><p class="m01-kicker">Orientation</p><h2 id="m01-flow-title">How the alert reaches the analyst</h2></div>
        </div>
        <div class="m01-flow" aria-label="Security signal flow">
          ${lab.signalFlow.map((step, index) => `<article>
            <span class="m01-flow-number">${index + 1}</span>
            <i class="${esc(step.icon)}" aria-hidden="true"></i>
            <h3>${esc(step.title)}</h3>
            <p>${esc(step.description)}</p>
          </article>`).join('')}
        </div>
        <p class="m01-concept"><strong>Vocabulary:</strong> A SIEM centralizes and analyzes events across sources. XDR connects detection context across protected domains and presents alert evidence for investigation. In this miniature, you see only the final queue-and-details pattern.</p>
      </section>

      <form id="m01-form" class="m01-workspace" novalidate>
        <section class="m01-section" aria-labelledby="m01-queue-title">
          <div class="m01-section-heading">
            <span>2</span>
            <div><p class="m01-kicker">Observation</p><h2 id="m01-queue-title">Choose the alert that needs first review</h2></div>
          </div>
          <p class="m01-instruction">Do not rank by severity alone. Compare outcome, context, and whether the activity is already explained.</p>
          <fieldset class="m01-fieldset m01-alert-fieldset">
            <legend class="sr-only">Synthetic alert queue</legend>
            <div class="m01-alert-list">
              ${lab.alerts.map((baseAlert) => {
                const alert = moduleOneAlertVariant(baseAlert);
                return `<label class="m01-alert-card">
                <input type="radio" name="selectedAlert" value="${esc(alert.id)}" ${moduleOneState.selectedAlert === alert.id ? 'checked' : ''} />
                <span class="m01-alert-content">
                  <span class="m01-alert-meta"><span class="${moduleOneSeverityClass(alert.severity)}">${esc(alert.severity)}</span><span>${esc(alert.age)}</span><span>${esc(alert.source)}</span></span>
                  <strong>${esc(alert.title)}</strong>
                  <small>${esc(alert.queueNote)}</small>
                </span>
              </label>`;
              }).join('')}
            </div>
          </fieldset>
          <div id="m01-evidence-panel">${moduleOneEvidencePanel()}</div>
        </section>

        <section class="m01-section" aria-labelledby="m01-artifact-title">
          <div class="m01-section-heading">
            <span>3</span>
            <div><p class="m01-kicker">Analysis · Decision · Communication</p><h2 id="m01-artifact-title">Complete the triage artifact</h2></div>
          </div>

          <fieldset class="m01-fieldset">
            <legend>Which analysis best connects the evidence?</legend>
            <div class="m01-option-list">
              ${lab.analysisOptions.map((option) => `<label><input type="radio" name="analysis" value="${esc(option.id)}" ${moduleOneState.analysis === option.id ? 'checked' : ''} /><span>${esc(option.text)}</span></label>`).join('')}
            </div>
          </fieldset>

          <fieldset class="m01-fieldset">
            <legend>What is the most proportional next decision?</legend>
            <div class="m01-option-list">
              ${lab.decisionOptions.map((option) => `<label><input type="radio" name="decision" value="${esc(option.id)}" ${moduleOneState.decision === option.id ? 'checked' : ''} /><span>${esc(option.text)}</span></label>`).join('')}
            </div>
          </fieldset>

          <div class="m01-fieldset">
            <label for="m01-notes"><strong>Analyst note</strong></label>
            <p class="m01-help" id="m01-notes-help">Write at least 40 characters. State what happened and the context that makes it important. Do not invent evidence.</p>
            <textarea id="m01-notes" name="notes" rows="4" maxlength="600" aria-describedby="m01-notes-help m01-note-count" placeholder="Example structure: Observed… Context… Recommend…">${esc(moduleOneState.notes)}</textarea>
            <p class="m01-note-count" id="m01-note-count"><span>${moduleOneState.notes.length}</span>/600 characters</p>
          </div>

          <div class="m01-actions">
            <button type="submit" class="m01-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Submit triage artifact</button>
            <button type="button" class="m01-reset" data-m01-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset only this lab</button>
          </div>
          ${moduleOneScorePanel()}
        </section>
      </form>
    </main>
  </div>`;
}

function moduleOneScore() {
  const correctEvidence = new Set(MODULE_ONE_ALERT_ORIENTATION.correctEvidence);
  const selectedCorrectEvidence = moduleOneState.selectedEvidence.filter((id) => correctEvidence.has(id));
  const exactEvidenceSet = selectedCorrectEvidence.length === correctEvidence.size
    && moduleOneState.selectedEvidence.length === correctEvidence.size;
  const evidenceScore = exactEvidenceSet ? 15 : Math.min(10, selectedCorrectEvidence.length * 5);
  const observation = (moduleOneState.selectedAlert === MODULE_ONE_ALERT_ORIENTATION.correctAlert ? 15 : 0) + evidenceScore;
  const analysis = moduleOneState.analysis === MODULE_ONE_ALERT_ORIENTATION.correctAnalysis ? 25 : 0;
  const decision = moduleOneState.decision === MODULE_ONE_ALERT_ORIENTATION.correctDecision ? 25 : 0;
  const normalizedNote = moduleOneState.notes.trim().toLowerCase();
  const communication = (normalizedNote.length >= 40 ? 10 : 0)
    + (/(success|successful|new region|unmanaged|failure|failed)/.test(normalizedNote) ? 10 : 0);
  const score = Math.round(observation + analysis + decision + communication);
  const feedback = [];

  feedback.push(moduleOneState.selectedAlert === MODULE_ONE_ALERT_ORIENTATION.correctAlert
    ? 'Observation: You prioritized the unexplained change from failed attempts to successful access.'
    : 'Observation: Recheck which alert changes from unsuccessful activity to successful access without an approved explanation.');
  feedback.push(exactEvidenceSet
    ? 'Evidence: Both outcome and access-context facts support the priority decision.'
    : 'Evidence: Select exactly the failed-to-successful sequence and the new unmanaged access context; leave routine baseline context unselected.');
  feedback.push(analysis === 25
    ? 'Analysis: Your reasoning combines multiple facts instead of relying on severity alone.'
    : 'Analysis: Connect the outcome sequence with access context; a severity label or blocked event alone is insufficient.');
  feedback.push(decision === 25
    ? 'Decision: Identity validation and evidence-preserving escalation are proportional to the observed risk.'
    : 'Decision: Choose a validation step that preserves evidence and avoids unsupported broad containment.');
  feedback.push(communication === 20
    ? 'Communication: The note is concise and names an observable condition.'
    : 'Communication: Use at least 40 characters and name the successful access, failure sequence, new region, or unmanaged context.');

  return {
    score,
    breakdown: { observation: Math.round(observation), analysis, decision, communication },
    feedback,
  };
}

function wireModuleOneLab() {
  const form = document.getElementById('m01-form');
  if (!form || !moduleOneState) return;

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'selectedAlert') {
      moduleOneState.selectedAlert = input.value;
      moduleOneState.selectedEvidence = [];
      moduleOneSave();
      document.getElementById('m01-evidence-panel').innerHTML = moduleOneEvidencePanel();
      requestAnimationFrame(() => document.getElementById('m01-evidence-title')?.focus());
    } else if (input.name === 'evidence') {
      moduleOneState.selectedEvidence = [...form.querySelectorAll('input[name="evidence"]:checked')].map((item) => item.value);
      moduleOneSave();
    } else if (input.name === 'analysis' || input.name === 'decision') {
      moduleOneState[input.name] = input.value;
      moduleOneSave();
    }
  });

  const notes = document.getElementById('m01-notes');
  notes.addEventListener('input', () => {
    moduleOneState.notes = notes.value;
    document.querySelector('#m01-note-count span').textContent = String(notes.value.length);
    moduleOneSave();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    moduleOneState.notes = notes.value;
    const result = moduleOneScore();
    moduleOneState.attempts += 1;
    moduleOneState.score = result.score;
    moduleOneState.bestScore = Math.max(moduleOneState.bestScore || 0, result.score);
    moduleOneState.breakdown = result.breakdown;
    moduleOneState.feedback = result.feedback;
    moduleOneState.lastSubmittedAt = new Date().toISOString();
    if (result.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore) {
      moduleOneState.completed = true;
      if (!moduleOneState.flags.includes(MODULE_ONE_FLAG)) moduleOneState.flags.push(MODULE_ONE_FLAG);
    }
    moduleOneSave();
    document.getElementById('m01-feedback').outerHTML = moduleOneScorePanel();
    document.getElementById('m01-attempts').textContent = String(moduleOneState.attempts);
    document.getElementById('m01-best-score').textContent = `${moduleOneState.bestScore}/100`;
    document.getElementById('m01-status').textContent = moduleOneState.completed ? 'Complete' : 'In progress';
    document.getElementById('m01-feedback').focus();
  });

  document.querySelector('[data-m01-reset]').addEventListener('click', () => {
    moduleOneState = LabRuntime.reset(MODULE_ONE_LAB_ID, moduleOneUser, MODULE_ONE_DEFAULT_STATE);
    render();
    requestAnimationFrame(() => document.getElementById('m01-objective-title')?.focus?.());
  });
}

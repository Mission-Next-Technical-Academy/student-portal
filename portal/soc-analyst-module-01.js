/* Module 01 — beginner-first SOC foundations and a single guided triage.
 * All records and actions are fictional, browser-local simulations.
 */

const MODULE_ONE_LAB_ID = 'm01-first-soc-alert-v2';
const MODULE_ONE_FLAG = 'M01-FIRST-ALERT-TRIAGED';
const MODULE_ONE_CATALOG_LAB_KEY = 'lab-soc-environment';
const MODULE_ONE_ROUTE = '#/program/soc-analyst/module/1';

/* Module-level assessment bank. selectQuizQuestions() returns wrappers shaped
 * { conceptId, conceptTitle, question, shuffledOptions, correctIndex } — the
 * question fields are deliberately read from entry.question and options from
 * entry.shuffledOptions below. */
const MODULE_ONE_QUIZ_BANKS = [
  {
    conceptId: 'soc-protection', conceptTitle: 'What a SOC protects', questions: [
      { id: 'm01-q-protect-1', prompt: 'A SOC analyst receives a signal that a customer-data store was accessed from an unmanaged device. Which question should anchor the first review?', options: [{ id: 'a', text: 'What evidence shows who accessed it, what they did, and whether the access was expected?' }, { id: 'b', text: 'Which team can close the alert fastest?' }, { id: 'c', text: 'Can the device be deleted immediately?' }, { id: 'd', text: 'Was the event generated during office hours?' }], correctId: 'a', feedbackCorrect: 'Correct. Start with identity, activity, expectation, and impact evidence before choosing a response.', feedbackIncorrect: 'Begin with evidence about who acted, what happened, whether it was expected, and what could be affected.' },
      { id: 'm01-q-protect-2', prompt: 'Which statement best describes confidentiality, integrity, and availability in a SOC context?', options: [{ id: 'a', text: 'They describe protecting information from improper disclosure, improper change, and loss of access.' }, { id: 'b', text: 'They are three names for the incident queue.' }, { id: 'c', text: 'They only apply to physical security.' }, { id: 'd', text: 'They mean every alert must be treated as a breach.' }], correctId: 'a', feedbackCorrect: 'Correct. CIA frames the security property that may be at risk and helps analysts explain impact.', feedbackIncorrect: 'CIA means confidentiality, integrity, and availability: disclosure, change, and access are the three protection concerns.' },
    ],
  },
  {
    conceptId: 'soc-vocabulary', conceptTitle: 'Events, alerts, and incidents', questions: [
      { id: 'm01-q-vocab-1', prompt: 'A login record shows one successful authentication. What is it before additional correlation?', options: [{ id: 'a', text: 'An event: a recorded activity that may or may not matter.' }, { id: 'b', text: 'A confirmed incident.' }, { id: 'c', text: 'A response action.' }, { id: 'd', text: 'A case closure.' }], correctId: 'a', feedbackCorrect: 'Correct. An event is a recorded occurrence; context may later turn it into an alert or incident.', feedbackIncorrect: 'A single recorded occurrence is an event. Analysts add context before deciding whether it deserves an alert or incident.' },
      { id: 'm01-q-vocab-2', prompt: 'Several correlated signals indicate an account takeover and potential data access. What makes this an incident candidate?', options: [{ id: 'a', text: 'The combined evidence suggests a security-impacting situation that needs coordinated handling.' }, { id: 'b', text: 'Every event automatically becomes an incident.' }, { id: 'c', text: 'The alert has a red icon.' }, { id: 'd', text: 'The analyst has not yet reviewed the evidence.' }], correctId: 'a', feedbackCorrect: 'Correct. An incident is a coordinated security situation supported by evidence, scope, and impact.', feedbackIncorrect: 'An incident candidate needs correlated evidence that points to security impact or required coordinated response.' },
    ],
  },
  {
    conceptId: 'soc-triage', conceptTitle: 'Evidence-first triage', questions: [
      { id: 'm01-q-triage-1', prompt: 'What is the best next step after an alert arrives with a suspicious hostname but no other context?', options: [{ id: 'a', text: 'Enrich it with identity, endpoint, network, and timing evidence before assigning a final disposition.' }, { id: 'b', text: 'Escalate it as confirmed compromise immediately.' }, { id: 'c', text: 'Dismiss it because one hostname is never useful.' }, { id: 'd', text: 'Take a disruptive action to preserve evidence.' }], correctId: 'a', feedbackCorrect: 'Correct. Enrichment converts a weak signal into a bounded evidence-based decision.', feedbackIncorrect: 'A hostname alone is weak. Add independent context before deciding severity, scope, or response.' },
      { id: 'm01-q-triage-2', prompt: 'Which triage note is strongest?', options: [{ id: 'a', text: 'It names the observed facts, uncertainty, affected scope, decision, owner, and next verification step.' }, { id: 'b', text: 'Looks bad; investigate more.' }, { id: 'c', text: 'Closed because the alert was old.' }, { id: 'd', text: 'Probably malicious; no evidence attached.' }], correctId: 'a', feedbackCorrect: 'Correct. A useful note lets another analyst reproduce the reasoning and continue the work.', feedbackIncorrect: 'A defensible note records facts, uncertainty, scope, decision, ownership, and a verifiable next step.' },
    ],
  },
  {
    conceptId: 'soc-escalation', conceptTitle: 'Severity, priority, and boundaries', questions: [
      { id: 'm01-q-escalate-1', prompt: 'A high-severity alert affects one test device, while a medium-severity identity signal affects a production administrator. What should influence priority most?', options: [{ id: 'a', text: 'Context such as affected asset, exposure, confidence, scope, and response urgency—not severity alone.' }, { id: 'b', text: 'The alert with the highest numeric label every time.' }, { id: 'c', text: 'Which case has the shortest title.' }, { id: 'd', text: 'The order in which alerts arrived, regardless of impact.' }], correctId: 'a', feedbackCorrect: 'Correct. Priority is a contextual decision that combines severity with impact, confidence, exposure, and time sensitivity.', feedbackIncorrect: 'Severity is an input, not the whole decision. Use asset, scope, confidence, exposure, and urgency.' },
      { id: 'm01-q-escalate-2', prompt: 'When should a new analyst escalate?', options: [{ id: 'a', text: 'When evidence, impact, uncertainty, or required action exceeds their role boundary or playbook authority.' }, { id: 'b', text: 'Only after taking every response action themselves.' }, { id: 'c', text: 'Whenever a record contains an IP address.' }, { id: 'd', text: 'Never; escalation means the analyst failed.' }], correctId: 'a', feedbackCorrect: 'Correct. Escalation is a controlled handoff when the evidence or authority boundary calls for another owner.', feedbackIncorrect: 'Escalate when the evidence, impact, uncertainty, or action exceeds your assigned authority or playbook.' },
    ],
  },
  {
    conceptId: 'soc-lifecycle', conceptTitle: 'Response lifecycle', questions: [
      { id: 'm01-q-lifecycle-1', prompt: 'Where does alert triage fit most directly in the response lifecycle?', options: [{ id: 'a', text: 'Detect and analyze: establish whether the signal represents a security situation and what scope is supported.' }, { id: 'b', text: 'Recovery only, after all systems are restored.' }, { id: 'c', text: 'Lessons learned only.' }, { id: 'd', text: 'It does not fit a lifecycle.' }], correctId: 'a', feedbackCorrect: 'Correct. Triage is primarily detect-and-analyze work that informs containment and later phases.', feedbackIncorrect: 'Triage belongs mainly to detect and analyze, where analysts validate signals and define supported scope.' },
      { id: 'm01-q-lifecycle-2', prompt: 'What is the best reason to document a verification step before closing a case?', options: [{ id: 'a', text: 'Closure should be based on evidence that the risk is addressed or bounded, not just that an action was attempted.' }, { id: 'b', text: 'Documentation replaces technical validation.' }, { id: 'c', text: 'A case can only close when every alert is deleted.' }, { id: 'd', text: 'Verification is only for auditors and never helps responders.' }], correctId: 'a', feedbackCorrect: 'Correct. Verification makes closure accountable and gives the next analyst a reproducible basis for trust.', feedbackIncorrect: 'An attempted action is not proof of risk reduction. Record how the result will be checked before closure.' },
    ],
  },
];

const MODULE_ONE_SOURCES = [
  { title: 'Computer Security Incident Handling Guide (SP 800-61 Rev. 3)', org: 'NIST', url: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', note: 'Incident response preparation, detection, analysis, response, and improvement.' },
  { title: 'Cybersecurity Framework 2.0', org: 'NIST', url: 'https://www.nist.gov/cyberframework', note: 'A common vocabulary for managing cybersecurity risk and outcomes.' },
  { title: 'Incident Response Training', org: 'FIRST', url: 'https://www.first.org/education/training', note: 'Community education resources for incident response practice.' },
  { title: 'Security+ Exam Objectives', org: 'CompTIA', url: 'https://www.comptia.org/certifications/security', note: 'Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.' },
];

const MODULE_ONE_DEFAULT_STATE = {
  reviewedEvidence: [],
  factTries: {},
  factWrong: [],
  factError: '',
  consoleStarted: false,
  consoleCompleted: false,
  workspaceSetupComplete: false,
  verdict: '',
  priority: '',
  phase: '',
  decision: '',
  rationale: '',
  notes: '',
  breakdown: null,
  feedback: [],
  validationError: '',
  lastSubmittedAt: '',
  attempts: 0,
  lessonWork: {},
  sectionOpen: { checklist: false, foundations: true, lab: false, quiz: false, review: false, sources: false },
  quiz: { selectedQuestions: [], questionsByAnswer: {}, answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false },
  // Retained as the completion marker for the independent simulator case.
  lab2: { completed: false },
  simulatorPerformance: { actions: [], submitted: false, submittedAt: '' },
};

let moduleOneState = null;
let moduleOneUser = null;
let moduleOneJustCorrect = '';
let moduleOneQuizState = null;
let moduleOneReviewMode = false;
let moduleOneLastSyncedDetail = null;

// The simulator is opened in a separate window but shares this origin. It
// sends only allow-listed action records; this portal writes the attempt.
// 'submit_for_faculty' is a second, separate message type (not an
// allow-listed evidence action) that lets the student finish the whole
// submission from inside the simulator, without a return trip to this tab —
// it runs the exact same finalization as the portal-side fallback button.
if (!window.__moduleOneSimulatorTelemetryListener) {
  window.__moduleOneSimulatorTelemetryListener = true;
  window.addEventListener('message', (event) => {
    if (event.origin !== new URL(SIM_ORIGIN).origin) return;
    const data = event.data || {};
    if (data.source !== 'mission-next-siem' || data.caseId !== 'NST-2407' || typeof data.action !== 'string' || !moduleOneState) return;
    if (data.action === 'submit_for_faculty') {
      moduleOneFinalizeSimulatorSubmission();
      return;
    }
    const allowed = new Set(MODULE_ONE_SIMULATOR_REQUIREMENTS.map(([action]) => action));
    if (!allowed.has(data.action)) return;
    const actions = moduleOneState.simulatorPerformance?.actions || [];
    if (!actions.some((item) => item.action === data.action)) {
      actions.push({ action: data.action, at: new Date().toISOString() });
      moduleOneState.simulatorPerformance.actions = actions;
      moduleOneSave();
      moduleOneRenderDynamic();
    }
  });
}

// Shared by the portal-side fallback "Complete Module" button and the
// simulator's own "Submit Module Lab" button (postMessage action
// 'submit_for_faculty') — one finalization path, two entry points.
function moduleOneFinalizeSimulatorSubmission() {
  const performance = moduleOneSimulatorPerformance();
  if (performance.missed_actions.length || moduleOneState.simulatorPerformance.submitted) return;
  moduleOneState.simulatorPerformance.submitted = true;
  moduleOneState.simulatorPerformance.submittedAt = new Date().toISOString();
  moduleOneState.lab2.completed = true;
  moduleOneSave();
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleOneUser, 'lab-soc-escalation', { state: 'complete', score: performance.score, result: { simulator_performance: performance, breakdown: { overall: performance.score }, critical_errors: performance.unsafe_actions } })
      .then((saved) => {
        // The new append-only attempt supersedes the returned attempt in the
        // student UI. Faculty approval remains required by the server view.
        if (saved && moduleOneSimulatorRedoRequested()) delete moduleOneUser.openLabRedosByModuleKey['soc-01'];
      });
  }
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', 'lab-soc-escalation');
  moduleOneSyncCompletion(); moduleOneRenderDynamic('m01-siem-submission'); moduleOneRefreshHeroProgress();
}

function moduleOneRemoteComplete() {
  return moduleOneUser?.remoteVerifiedModuleProgress?.['soc-01'] === true;
}

function moduleOneSimulatorRedoRequested() {
  return moduleOneUser?.openLabRedosByModuleKey?.['soc-01']?.labKey === 'lab-soc-escalation';
}

function moduleOneLoad(user) {
  moduleOneUser = user;
  moduleOneState = LabRuntime.loadCaseState(MODULE_ONE_LAB_ID, 'soc-01', user, MODULE_ONE_DEFAULT_STATE);
  if (!Array.isArray(moduleOneState.reviewedEvidence)) moduleOneState.reviewedEvidence = [];
  if (!Array.isArray(moduleOneState.factWrong)) moduleOneState.factWrong = [];
  if (!moduleOneState.factTries || typeof moduleOneState.factTries !== 'object') moduleOneState.factTries = {};
  if (!moduleOneState.lessonWork || typeof moduleOneState.lessonWork !== 'object') moduleOneState.lessonWork = {};
  if (!moduleOneState.sectionOpen || typeof moduleOneState.sectionOpen !== 'object') moduleOneState.sectionOpen = { ...MODULE_ONE_DEFAULT_STATE.sectionOpen };
  Object.keys(MODULE_ONE_DEFAULT_STATE.sectionOpen).forEach((key) => { if (typeof moduleOneState.sectionOpen[key] !== 'boolean') moduleOneState.sectionOpen[key] = MODULE_ONE_DEFAULT_STATE.sectionOpen[key]; });
  if (!moduleOneState.quiz || typeof moduleOneState.quiz !== 'object') moduleOneState.quiz = JSON.parse(JSON.stringify(MODULE_ONE_DEFAULT_STATE.quiz));
  if (!moduleOneState.lab2 || typeof moduleOneState.lab2 !== 'object') moduleOneState.lab2 = JSON.parse(JSON.stringify(MODULE_ONE_DEFAULT_STATE.lab2));
  if (typeof moduleOneState.lab2.completed !== 'boolean') moduleOneState.lab2.completed = false;
  if (!moduleOneState.simulatorPerformance || typeof moduleOneState.simulatorPerformance !== 'object') moduleOneState.simulatorPerformance = { actions: [], submitted: false, submittedAt: '' };
  if (!Array.isArray(moduleOneState.simulatorPerformance.actions)) moduleOneState.simulatorPerformance.actions = [];
  // The returned attempt remains immutable in lab_attempts, but its saved
  // case-state latch must not make the working case permanently unsubmitable.
  // Scope this reset to an open redo for this exact simulator lab.
  if (moduleOneSimulatorRedoRequested() && moduleOneState.simulatorPerformance.submitted === true) {
    moduleOneState.simulatorPerformance.submitted = false;
    moduleOneState.simulatorPerformance.submittedAt = '';
    moduleOneSave();
  }
  // `module_progress` historically recorded Module 01 as complete after a
  // coarse lab-only check. Do not manufacture the missing lesson, quiz, or
  // Lab 2 evidence from that record: the page must never show work complete
  // merely because another layer has a stale summary badge.
  if (!moduleOneQuizState || moduleOneQuizState.userKey !== user.email) {
    const savedQuiz = moduleOneState.quiz;
    const selection = savedQuiz.selectedQuestions?.length
      ? { selectedQuestions: savedQuiz.selectedQuestions, questionsByAnswer: savedQuiz.questionsByAnswer || {} }
      : selectQuizQuestions(MODULE_ONE_QUIZ_BANKS, { previousQuestionIds: [], shuffleOptions: true });
    moduleOneQuizState = {
      userKey: user.email,
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: savedQuiz.answers || {},
      scored: Boolean(savedQuiz.scored), attempts: Number(savedQuiz.attempts || 0), score: Number(savedQuiz.score || 0),
      bestScore: Number(savedQuiz.bestScore || 0), feedback: savedQuiz.feedback || [], passed: Boolean(savedQuiz.passed),
    };
  }
  const coachComplete = new URLSearchParams(location.search).get('coachComplete');
  if (coachComplete === 'm01-setup') {
    moduleOneState.workspaceSetupComplete = true;
    moduleOneSave();
    history.replaceState(null, '', location.pathname + location.hash);
  } else if (coachComplete === 'm01') {
    moduleOneState.consoleStarted = true;
    moduleOneState.consoleCompleted = true;
    moduleOneSave();
    history.replaceState(null, '', location.pathname + location.hash);
  }
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-01');
  return moduleOneState;
}

function moduleOneSyncDetailBeacon() {
  if (!moduleOneUser || !moduleOneState) return;
  const lessonsComplete = (MODULE_ONE_ALERT_ORIENTATION.lessons || []).every((lesson) => {
    const work = (moduleOneState.lessonWork || {})[String(lesson.number)] || {};
    return work.checked === true && moduleOneLessonScorePassed(lesson, work);
  });
  // Ratchet, not overwrite: OR each field with whatever the server already
  // has (fetched once at login — buildUserFromSession's remoteModuleDetail,
  // no extra read here). A field only ever moves false -> true. Without
  // this, opening Module 01 on any browser/device with empty local state
  // (a new device, cleared storage, or an admin backfilling this same
  // field) silently flipped previously-true fields back to false on the
  // very next save, since this function used to write local state outright.
  const remoteDetail = moduleOneUser.remoteModuleDetail?.['soc-01'] || {};
  const detail = {
    quizPassed: moduleOneState.quiz?.passed === true || remoteDetail.quizPassed === true,
    consoleCompleted: (moduleOneState.completed === true && moduleOneState.consoleCompleted === true) || remoteDetail.consoleCompleted === true,
    lab2Completed: moduleOneState.lab2?.completed === true || remoteDetail.lab2Completed === true,
    lessonsComplete: lessonsComplete || remoteDetail.lessonsComplete === true,
  };
  const serializedDetail = JSON.stringify(detail);
  if (serializedDetail === moduleOneLastSyncedDetail) return;
  upsertModuleProgress(moduleOneUser, 'soc-01', { detail });
  moduleOneLastSyncedDetail = serializedDetail;
  // Keep the in-memory baseline current so a second save this same session
  // (before a full page reload re-fetches remoteModuleDetail) still ratchets
  // against the value we just wrote, not the stale one from page load.
  moduleOneUser.remoteModuleDetail = { ...(moduleOneUser.remoteModuleDetail || {}), 'soc-01': detail };
  // The backend needs each requirement, not a single aggregate boolean. This
  // is idempotent and records only requirements the learner actually met.
  const evidenceKeys = (MODULE_ONE_ALERT_ORIENTATION.lessons || [])
    .filter((lesson) => moduleOneLessonComplete(lesson))
    .map((lesson) => `lesson-${lesson.number}`);
  if (moduleOneState.quiz?.passed === true) evidenceKeys.push('knowledge-check');
  if (typeof recordModuleCompletionEvidence === 'function' && evidenceKeys.length) {
    recordModuleCompletionEvidence(moduleOneUser, 'soc-01', evidenceKeys);
  }
}

function moduleOneSave() {
  if (moduleOneUser && moduleOneState) {
    // The final case can span days and devices.  Keep the whole fixture state
    // (including reviewed records and a consequence already triggered) with
    // the module-progress row as well as in the local recovery copy.
    LabRuntime.saveCaseState(MODULE_ONE_LAB_ID, 'soc-01', moduleOneUser, moduleOneState);
    moduleOneSyncDetailBeacon();
  }
}

function moduleOneSeverityClass(severity) {
  return `m01-severity m01-severity-${String(severity).toLowerCase()}`;
}

/* Companion reading inserted inline right after the lesson it illustrates —
 * flow after L5 (where alerts/telemetry come from), the triage loop after L6
 * (how alert triage works), the lifecycle wheel after L8 (incident response
 * lifecycle). These have no completion state of their own; they are part of
 * the Foundations reading, not separate nav-rail sections. */
function moduleOneLessonCompanion(lesson, lab) {
  if (lesson.number === 5) {
    return `<div class="m01-companion" id="m01-flow" aria-labelledby="m01-flow-title">
      <p class="m01-companion-label"><i class="ri-route-line" aria-hidden="true"></i> Security architecture, without the jargon wall</p>
      <h3 class="m01-companion-title" id="m01-flow-title">How activity becomes analyst work</h3>
      <div class="m01-flow" aria-label="Activity-to-investigation flow">
        ${lab.signalFlow.map((step) => `<article><i class="${esc(step.icon)}" aria-hidden="true"></i><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p></article>`).join('')}
      </div>
    </div>`;
  }
  if (lesson.number === 6) {
    return `<div class="m01-companion" id="m01-loop" aria-labelledby="m01-loop-title">
      <p class="m01-companion-label"><i class="ri-radar-line" aria-hidden="true"></i> The repeatable habit</p>
      <h3 class="m01-companion-title" id="m01-loop-title">Your five-step triage loop</h3>
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
    </div>`;
  }
  if (lesson.number === 8) {
    return `<div class="m01-companion" id="m01-lifecycle" aria-labelledby="m01-lifecycle-title">
      <p class="m01-companion-label"><i class="ri-cycle-line" aria-hidden="true"></i> The map for responding</p>
      <h3 class="m01-companion-title" id="m01-lifecycle-title">Incident response lifecycle, visualized</h3>
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
    </div>`;
  }
  return '';
}

function moduleOneLessons(lab) {
  return `<div class="m01-lesson-grid" id="m01-lessons">
    ${lab.lessons.map((lesson) => {
      const work = moduleOneLessonWork(lesson.number);
      const isOpen = work.open !== undefined ? work.open : (lesson.number === 1);
      const isComplete = moduleOneLessonComplete(lesson);
      return `<details class="m01-lesson" id="m01-lesson-${String(lesson.number).padStart(2, '0')}" ${isOpen ? 'open' : ''} data-m01-lesson="${lesson.number}">
        <summary>
          <span class="m01-lesson-number">${String(lesson.number).padStart(2, '0')}</span>
          <span class="m01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span>
          <span class="m01-lesson-title"><strong>${esc(lesson.title)}</strong><small>${esc(lesson.summary)}</small></span>
          ${isComplete ? '<span class="m01-lesson-complete-badge" aria-label="Lesson complete"><i class="ri-check-line" aria-hidden="true"></i></span>' : ''}
          <i class="ri-arrow-down-s-line m01-lesson-chevron" aria-hidden="true"></i>
        </summary>
        <div class="m01-lesson-body">
          <p>${esc(lesson.detail)}</p>
          <p class="m01-takeaway"><strong>Remember:</strong> ${esc(lesson.takeaway)}</p>
          ${lesson.example ? `
            <div class="m01-lesson-example">
              <p class="m01-lesson-example-label"><i class="ri-lightbulb-line" aria-hidden="true"></i> Worked example</p>
              <p>${esc(lesson.example.scenario)}</p>
            </div>
          ` : ''}
          ${lesson.knowledgeCheck ? `
            <div class="m01-lesson-check">
              <h4>Knowledge check</h4>
              ${lesson.knowledgeCheck.questions.map((question) => {
                const selectedAnswer = (work.answers || {})[question.id];
                const answerObj = selectedAnswer ? question.options.find((o) => o.id === selectedAnswer) : null;
                const isCorrect = selectedAnswer === question.correctId;
                return `
                  <div class="m01-quiz-question">
                    <p><strong>${esc(question.prompt)}</strong></p>
                    ${moduleOneLessonQuizOptions(lesson.number, question)}
                    ${work.checked ? `
                      <div class="m01-quiz-feedback ${isCorrect ? 'is-correct' : 'is-incorrect'}">
                        ${isCorrect ? `
                          <i class="ri-check-circle-fill" aria-hidden="true"></i>
                          <span>${esc(question.feedbackCorrect)}</span>
                        ` : `
                          <i class="ri-close-circle-fill" aria-hidden="true"></i>
                          <span>${esc(question.feedbackIncorrect)}</span>
                        `}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
              ${work.checked ? `
                <p class="m01-quiz-summary">${lesson.knowledgeCheck.questions.filter((q) => (work.answers || {})[q.id] === q.correctId).length} of ${lesson.knowledgeCheck.questions.length} correct</p>
              ` : ''}
              <button type="button" class="m01-lesson-check-btn" data-m01-lesson-check="${lesson.number}">Check answers</button>
            </div>
          ` : ''}
        </div>
      </details>${moduleOneLessonCompanion(lesson, lab)}`;
    }).join('')}
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

function moduleOneOptionList(name, options, stateSlot) {
  const state = stateSlot || moduleOneState;
  return `<div class="m01-option-list">
    ${options.map((option) => `<label>
      <input type="radio" name="${esc(name)}" value="${esc(option.id)}" ${state[name] === option.id ? 'checked' : ''} />
      <span><strong>${esc(option.text)}</strong>${option.help ? `<small>${esc(option.help)}</small>` : ''}</span>
    </label>`).join('')}
  </div>`;
}

function moduleOneLessonWork(number) {
  return moduleOneState.lessonWork[String(number)] || {};
}

function moduleOneLessonQuizOptions(lessonNumber, question) {
  const work = moduleOneLessonWork(lessonNumber);
  const answers = work.answers || {};
  const selectedId = answers[question.id];
  return `<div class="m01-quiz-options">
    ${question.options.map((option) => `<label>
      <input type="radio" name="m01-lq-${lessonNumber}-${question.id}" value="${esc(option.id)}" data-m01-lq-lesson="${lessonNumber}" data-m01-lq-question="${question.id}" ${selectedId === option.id ? 'checked' : ''} />
      <span>${esc(option.text)}</span>
    </label>`).join('')}
  </div>`;
}

function moduleOneLessonScorePassed(lesson, work) {
  const questions = lesson.knowledgeCheck?.questions || [];
  if (!questions.length) return true;
  const answers = work.answers || {};
  const correct = questions.filter((q) => answers[q.id] === q.correctId).length;
  return (correct / questions.length) >= 0.8;
}

function moduleOneLessonComplete(lesson) {
  const work = moduleOneLessonWork(lesson.number);
  return (work.checked === true && moduleOneLessonScorePassed(lesson, work))
    || moduleOneUser?.remoteModuleEvidence?.['soc-01']?.[`lesson-${lesson.number}`] === true;
}

function moduleOneProgress() {
  const lessonsTotal = MODULE_ONE_ALERT_ORIENTATION.lessons.length;
  const lessonsComplete = MODULE_ONE_ALERT_ORIENTATION.lessons.filter(moduleOneLessonComplete).length;
  const verified = moduleOneRemoteComplete();
  const labOneComplete = verified || Boolean(moduleOneState?.completed && moduleOneState?.consoleCompleted);
  const labTwoComplete = verified || Boolean(moduleOneState?.lab2?.completed);
  const knowledgeCheckComplete = Boolean(moduleOneQuizState?.passed)
    || moduleOneUser?.remoteModuleEvidence?.['soc-01']?.['knowledge-check'] === true;
  const complete = verified || (lessonsComplete === lessonsTotal && knowledgeCheckComplete && labOneComplete && labTwoComplete);
  return {
    lessonsTotal,
    lessonsComplete,
    labsComplete: Number(labOneComplete) + Number(labTwoComplete),
    knowledgeCheckComplete,
    complete,
    remoteRecord: moduleOneRemoteComplete(),
  };
}

function moduleOneRefreshHeroProgress() {
  const progress = moduleOneProgress();
  const labCount = document.getElementById('m01-lab-count');
  const status = document.getElementById('m01-status');
  if (labCount) labCount.textContent = progress.labsComplete === 2 ? 'Complete' : progress.labsComplete ? 'In progress' : 'Not started';
  if (status) status.textContent = progress.complete ? 'Complete' : 'In progress';
}

function moduleOneSyncCompletion() {
  if (moduleOneProgress().complete && typeof markModuleCompleteRemote === 'function') {
    markModuleCompleteRemote(moduleOneUser, 'soc-01');
  }
}

const MODULE_ONE_SIMULATOR_REQUIREMENTS = [
  ['incident_opened', 'Open the assigned incident'], ['alert_opened:NST-2407-1', 'Review the identity alert'],
  ['alert_opened:NST-2407-2', 'Review the endpoint alert'], ['alert_opened:NST-2407-3', 'Review the proxy alert'],
  ['alert_opened:NST-2407-4', 'Review the user callback'], ['entity_opened:a.chen@missionnextlabs.example', 'Pivot to the affected identity'],
  ['entity_opened:LAP-442', 'Pivot to the affected device'], ['escalated', 'Escalate within L1 authority'],
];
function moduleOneSimulatorPerformance() {
  const actions = moduleOneState?.simulatorPerformance?.actions || [];
  const found = new Set(actions.map((item) => item.action));
  const completed = MODULE_ONE_SIMULATOR_REQUIREMENTS.filter(([key]) => found.has(key));
  const missed = MODULE_ONE_SIMULATOR_REQUIREMENTS.filter(([key]) => !found.has(key));
  const competencies = [
    { key: 'observation', label: 'Observation', required: 5, completed: completed.filter(([key]) => key === 'incident_opened' || key.startsWith('alert_opened:')).length },
    { key: 'analysis', label: 'Analysis', required: 2, completed: completed.filter(([key]) => key.startsWith('entity_opened:')).length },
    { key: 'scope', label: 'Scope', required: 2, completed: completed.filter(([key]) => key.startsWith('entity_opened:')).length },
    { key: 'decision_authority', label: 'Decision / Authority', required: 1, completed: completed.filter(([key]) => key === 'escalated').length },
    { key: 'communication_handoff', label: 'Communication / Handoff', required: 1, completed: completed.filter(([key]) => key === 'escalated').length },
  ].map((item) => ({ ...item, percentage: Math.round(item.completed * 100 / item.required), passed: item.completed >= item.required }));
  const score = Math.round(competencies.reduce((sum, item) => sum + item.percentage, 0) / competencies.length);
  return { actions, requirements: MODULE_ONE_SIMULATOR_REQUIREMENTS.map(([action, label]) => ({ action, label, completed: found.has(action) })), competencies, score, passed: score >= 70 && missed.length === 0, missed_actions: missed.map(([, label]) => label), unsafe_actions: actions.filter((item) => item.unsafe === true).map((item) => item.action), generated_recommendations: competencies.filter((item) => !item.passed).map((item) => `${item.label}: revisit the missing simulator evidence before resubmitting.`) };
}
function moduleOneSimulatorSubmissionPanel() {
  const performance = moduleOneSimulatorPerformance(); const submitted = moduleOneState.simulatorPerformance.submitted;
  const redoRequested = moduleOneSimulatorRedoRequested();
  const doneCount = performance.requirements.filter((item) => item.completed).length;
  return `<div class="m01-score-empty" id="m01-siem-submission" role="status" aria-live="polite">
    <strong>${submitted ? 'Submitted for faculty review' : redoRequested ? 'Returned for remediation' : 'Simulator performance record'}</strong>
    <p>${doneCount}/${performance.requirements.length} required actions recorded. ${submitted ? 'Module 2 stays locked until your instructor approves the submission.' : redoRequested ? 'Review your instructor feedback, then submit a new performance record for faculty review.' : 'Work through the procedure below inside the simulator, then use the floating Submit Module Lab button (bottom corner, follows you anywhere in the console) to send your performance for faculty review.'}</p>
    ${!submitted ? `<ul class="m01-requirements-list">${performance.requirements.map((item) => `<li class="${item.completed ? 'is-done' : ''}"><i class="${item.completed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i><span>${esc(item.label)}</span></li>`).join('')}</ul>` : ''}
    ${!submitted ? `<button type="button" class="m01-submit" data-m01-submit-simulator ${performance.missed_actions.length ? 'disabled aria-disabled="true"' : ''}>${performance.missed_actions.length ? 'Complete the procedure above first' : 'Complete Module — submit to faculty'}</button>${!performance.missed_actions.length ? '<p class="m01-help">Already back on this tab? This does the same thing as Submit Module Lab inside the simulator.</p>' : ''}` : ''}
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
      Your first attempt is coached, not timed. Submit when every decision has a selection.
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
      <div><strong>${b.action}/20</strong><span>Next action</span></div>
      <div><strong>${b.rationale}/20</strong><span>Rationale</span></div>
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
  const incidentRoute = `${SIM_ORIGIN}?case=NST-2407&module=soc-1#/sentinel/incidents`;
  const reviewed = new Set(moduleOneState.reviewedEvidence);
  const reviewedCount = scenario.evidence.filter((item) => reviewed.has(item.id)).length;
  const investigationReady = reviewedCount === scenario.evidence.length;
  const consoleComplete = moduleOneState.consoleCompleted === true;
  const workspaceSetupComplete = moduleOneState.workspaceSetupComplete === true;
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

  <section class="m01-siem ${consoleComplete ? 'is-complete' : ''}" aria-labelledby="m01-siem-title">
    <div class="m01-siem-copy">
      <p class="m01-kicker">${consoleComplete ? 'Walkthrough completed · reopen anytime' : 'Optional walkthrough · 10 minutes'}</p>
      <h3 id="m01-siem-title">Console walkthrough: investigate an alert</h3>
      <p>Every fact above came from somewhere. Open this guided walkthrough whenever you want to see how an
      analyst moves from the alert queue to the alert and then to a sign-in log. It is a practice tour, not a
      graded requirement; the assessed handoff case below is already available.</p>
    </div>
    <a class="m01-siem-launch" data-m01-console-launch href="${esc(SIM_ORIGIN)}?coach=${workspaceSetupComplete ? 'm01' : 'm01-setup'}&amp;restart=1#/defender/alerts" target="_blank" rel="opener">
      <i class="${workspaceSetupComplete && consoleComplete ? 'ri-refresh-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${workspaceSetupComplete ? (consoleComplete ? 'Review console walkthrough' : 'Open console walkthrough') : 'Start Day 1 setup'}
    </a>
  </section>

  ${consoleComplete ? `<section class="m01-evidence" aria-labelledby="m01-evidence-title">
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
  </section>` : ''}

  ${!consoleComplete || !investigationReady ? '' : `<form id="m01-form" class="m01-worksheet" novalidate>
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
      <label for="m01-rationale" class="m01-note-label"><strong>5</strong> Why did you make these choices?</label>
      <p class="m01-help">In one or two sentences, explain your reasoning for the priority and next action you selected, based on the evidence.</p>
      <textarea id="m01-rationale" name="rationale" rows="3" placeholder="Example: High priority because the access succeeded and the user denies it. Escalate because only the identity team can revoke the session and reset the password." aria-label="Rationale for your triage decisions">${esc(moduleOneState.rationale)}</textarea>
    </div>

    <div class="m01-actions">
      <button type="submit" class="m01-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my triage</button>
      <button type="button" class="m01-reset" data-m01-reset><i class="ri-restart-line" aria-hidden="true"></i> Reset this guided lab</button>
    </div>
    ${moduleOneScorePanel()}
  </form>`}

  <section class="m01-siem" aria-labelledby="m01-lab2-scenario-title">
    <div class="m01-siem-copy">
      <p class="m01-kicker">Independent simulated-SIEM case · resume across sittings</p>
      <h3 id="m01-lab2-scenario-title">Mission Next Labs: investigate the correlated incident</h3>
      <p>Open the assigned incident in the simulated SIEM and perform the investigation there. Your incident work—not a duplicate worksheet or case note—is the assessment evidence.</p>
    </div>
    <a class="m01-siem-launch" href="${esc(incidentRoute)}" target="_blank" rel="opener">
      <i class="ri-external-link-line" aria-hidden="true"></i> Open Mission Next SIEM
    </a>
    ${moduleOneSimulatorSubmissionPanel()}
  </section>
  `;
}

function moduleOneQuizQuestion(entry, index) {
  // Real selectQuizQuestions() wrapper: { conceptId, conceptTitle, question,
  // shuffledOptions, correctIndex }. Do not read prompt/options from entry.
  const question = entry.question;
  const answer = moduleOneQuizState?.answers?.[question.id];
  return `<fieldset class="m01-quiz-question" data-m01-module-question="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(entry.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m01-quiz-options">${entry.shuffledOptions.map((option) => `<label><input type="radio" name="m01-module-q-${esc(question.id)}" value="${esc(option.id)}" data-m01-module-answer ${answer === option.id ? 'checked' : ''} /><span>${esc(option.text)}</span></label>`).join('')}</div>
  </fieldset>`;
}

function moduleOneQuizPanel() {
  const selected = moduleOneQuizState?.selectedQuestions || [];
  if (!selected.length) return `<form class="m01-module-quiz" id="m01-quiz-form" novalidate><div id="m01-quiz-feedback" role="status">Loading knowledge check…</div></form>`;
  const answered = Object.keys(moduleOneQuizState.answers || {}).length;
  const feedback = moduleOneQuizState.scored ? `<section class="m01-score ${moduleOneQuizState.passed ? 'is-pass' : 'is-remediate'}" id="m01-quiz-feedback" tabindex="-1" aria-live="polite"><p class="m01-kicker">Attempt ${moduleOneQuizState.attempts} · best ${moduleOneQuizState.bestScore}/100</p><h3>${moduleOneQuizState.score}/100 — ${moduleOneQuizState.passed ? 'Knowledge verified' : 'Review the coaching and retry'}</h3><ul>${(moduleOneQuizState.feedback || []).map((item) => `<li><strong>${item.correct ? 'Correct' : 'Review'} · ${esc(item.questionId)}</strong><p>${esc(item.message)}</p></li>`).join('')}</ul>${!moduleOneQuizState.passed ? '<button type="button" class="m01-quiz-retry" data-m01-quiz-retry>Try different questions</button>' : ''}</section>` : `<div id="m01-quiz-feedback" role="status">${answered}/${selected.length} answered. Submit when ready.</div>`;
  return `<form class="m01-module-quiz" id="m01-quiz-form" novalidate><div class="m01-panel-heading"><div><p class="m01-kicker">Module knowledge check</p><h3 id="m01-quiz-title">Classify, triage, and communicate</h3></div><span>${answered}/${selected.length} answered</span></div>${selected.map(moduleOneQuizQuestion).join('')}<button type="submit" ${answered < selected.length ? 'disabled' : ''}>Check my answers</button>${feedback}</form>`;
}

function moduleOneReview() {
  return `<div id="m01-review"><p class="m01-instruction">You are ready to review when you can separate events, alerts, and incidents; explain your evidence; choose a proportionate priority; and hand off work with an owner and verification step.</p><ul><li>Start with evidence and state uncertainty.</li><li>Use severity with context to set priority.</li><li>Escalate when impact or authority exceeds your boundary.</li><li>Close only after verification is recorded.</li></ul></div>`;
}

function moduleOneGetQuickNavItems() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const moduleLabs = LABS.filter((item) => item.module === 'm01');
  const items = [];

  // Add lessons
  lab.lessons.forEach((lesson, index) => {
    const isComplete = moduleOneLessonComplete(lesson);
    items.push({
      id: `m01-lesson-${String(lesson.number).padStart(2, '0')}`,
      title: lesson.title,
      kind: 'lesson',
      isComplete,
      scrollId: `m01-lesson-${String(lesson.number).padStart(2, '0')}`,
      lessonNumber: lesson.number,
    });
  });

  // Add labs
  moduleLabs.forEach((lab) => {
    const isComplete = lab.key === 'm01-first-soc-alert-v2'
      ? Boolean(moduleOneState.completed && moduleOneState.consoleCompleted)
      : Boolean(moduleOneState.lab2?.completed);
    items.push({
      id: `m01-lab-${esc(lab.key)}`,
      title: lab.title,
      kind: 'lab',
      isComplete,
      scrollId: 'm01-guided-lab',
    });
  });

  return items;
}

/* All 5 numbered page sections, for moduleUnifiedNav(). Foundations and
 * Module Lab nest their granular items (moduleOneGetQuickNavItems());
 * the flow/lifecycle/loop companion reading lives inline inside Foundations
 * (see moduleOneLessonCompanion()), not as its own nav section — it has no
 * completion state of its own. Knowledge Check sits between Foundations and
 * Module Lab (matching every other module's order: read, then prove
 * retention, then do the graded work) — sources is read-only explanatory
 * content — `gated: false` marks it always navigable, excluded from the
 * lock/current-position chain. */
function moduleOneGetNavSections() {
  const progress = moduleOneProgress();
  const quickNavItems = moduleOneGetQuickNavItems();
  return [
    { id: 'foundations', title: 'Foundations', type: 'lecture', isComplete: progress.lessonsComplete === progress.lessonsTotal, scrollId: 'm01-foundations', items: quickNavItems.filter((i) => i.kind === 'lesson') },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: progress.knowledgeCheckComplete, scrollId: 'm01-knowledge-check' },
    { id: 'guided-lab', title: 'Module Lab', type: 'lab', isComplete: progress.labsComplete === 2, scrollId: 'm01-guided-lab', items: quickNavItems.filter((i) => i.kind === 'lab') },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: progress.complete, scrollId: 'm01-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm01-sources-section', gated: false },
  ];
}

function viewModuleOne(user, program) {
  moduleOneLoad(user);
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const module = program.modules['soc-01'];
  const moduleLabs = LABS.filter((item) => item.module === module.key);
  const moduleLabMinutes = moduleLabs.reduce((total, item) => total + item.instructionalMinutes, 0);
  const sectionOpen = moduleOneState.sectionOpen || {};
  const openFor = (key) => moduleOneReviewMode || sectionOpen[key] === true;
  const progress = moduleOneProgress();

  return `<div class="m01-shell">
    ${moduleTopbar(user, program)}

    <div class="mquick-nav-layout">
      ${moduleUnifiedNav(moduleOneGetNavSections(), { moduleKey: 'm01', reviewMode: moduleOneReviewMode })}
      <main class="m01-main">
      <section class="m01-hero" aria-labelledby="m01-title">
        <div>
          <p class="m01-kicker">Module 01 · ${formatHandsOnDuration(module.durationMinutes)} · Start here</p>
          <h1 id="m01-title">${esc(module.title)}</h1>
          <p class="m01-lede">Meet the team that watches for security threats, learn the language of alerts and incidents, follow the incident response lifecycle, and triage one clear alert with a coach beside you.</p>
        </div>
        <dl class="m01-progress" aria-label="Saved lab progress">
          <div><dt>Foundation lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Module Lab</dt><dd id="m01-lab-count">${progress.labsComplete === 2 ? 'Complete' : progress.labsComplete ? 'In progress' : 'Not started'}</dd></div>
          <div><dt>Module status</dt><dd id="m01-status">${progress.complete ? 'Complete' : 'In progress'}</dd></div>
        </dl>
      </section>

      ${progress.remoteRecord && !progress.complete ? '<p class="m01-progress-notice" role="status">A prior module-completion record exists, but this device does not contain the detailed lesson, knowledge-check, and lab evidence needed to display this module as complete. Continue or review the required work below.</p>' : ''}

      <section class="m01-checklist m01-section-collapsible" aria-labelledby="m01-checklist-title">
        <div class="m01-section-heading">
          <div><p class="m01-kicker">Module progress checklist</p><h2 id="m01-checklist-title">Every required block, with its duration and status</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="checklist" data-m01-section-label="module progress checklist" aria-expanded="${openFor('checklist')}" aria-controls="m01-checklist-body" aria-label="${openFor('checklist') ? 'Collapse' : 'Expand'} module progress checklist">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-checklist-body" ${openFor('checklist') ? '' : 'hidden'}>
        <ul class="m01-checklist-list">
          ${module.curriculumItems.map((item, index) => {
            const lesson = MODULE_ONE_ALERT_ORIENTATION.lessons[index];
            const isComplete = lesson && moduleOneLessonComplete(lesson);
            const work = lesson ? moduleOneLessonWork(lesson.number) : {};
            const hasStarted = work.checked;
            const status = isComplete ? 'Complete' : (hasStarted ? 'In progress' : 'Not started');
            const statusClass = isComplete ? 'is-complete' : (hasStarted ? 'is-in-progress' : 'is-not-started');
            return `<li class="m01-checklist-item ${statusClass}">
              <span class="m01-checklist-number">${String(index + 1).padStart(2, '0')}</span>
              <div class="m01-checklist-content">
                <strong>${esc(item.title)}</strong>
                <span class="m01-checklist-status" aria-label="${esc(status)}">${esc(status)}</span>
              </div>
              <span class="m01-checklist-duration">${typeof formatInstructionalMinutes === 'function' ? formatInstructionalMinutes(item.durationMinutes) : item.durationMinutes}</span>
            </li>`;
          }).join('')}
          ${moduleLabs.map((lab) => {
            const isWalkthrough = lab.key === MODULE_ONE_CATALOG_LAB_KEY;
            const isComplete = isWalkthrough
              ? Boolean(moduleOneState.completed && moduleOneState.consoleCompleted)
              : Boolean(moduleOneState.lab2?.completed);
            const status = isWalkthrough ? 'Optional' : (isComplete ? 'Complete' : 'Not started');
            const statusClass = isComplete ? 'is-complete' : 'is-not-started';
            return `<li class="m01-checklist-item ${statusClass}">
              <span class="m01-checklist-number" style="opacity: 0;">--</span>
              <div class="m01-checklist-content">
                <strong>${esc(lab.title)}</strong>
                <span class="m01-checklist-status" aria-label="${esc(status)}">${esc(status)}</span>
              </div>
              <span class="m01-checklist-duration">${typeof formatInstructionalMinutes === 'function' ? formatInstructionalMinutes(lab.instructionalMinutes) : lab.instructionalMinutes}</span>
            </li>`;
          }).join('')}
        </ul>
        <p class="m01-checklist-total">Total instructional time: <strong>${typeof formatInstructionalMinutes === 'function' ? formatInstructionalMinutes(module.curriculumItems.reduce((total, item) => total + item.durationMinutes, 0) + moduleLabs.reduce((total, lab) => total + lab.instructionalMinutes, 0)) : '480 Minutes'}</strong></p>
        </div>
      </section>

      <section class="m01-objective" aria-labelledby="m01-objective-title">
        <div class="m01-objective-icon"><i class="ri-compass-3-line" aria-hidden="true"></i></div>
        <div>
          <p class="m01-kicker" id="m01-objective-title" tabindex="-1">Your starting point</p>
          <p>By the end, you will be able to explain what a SOC analyst does, distinguish an event from an alert and incident, place triage in the response lifecycle, and create a simple evidence-based handoff.</p>
        </div>
      </section>

      <section class="m01-section m01-section-collapsible" id="m01-foundations" aria-labelledby="m01-foundations-title">
        <div class="m01-section-heading">
          <span>1</span>
          <div><p class="m01-kicker">Nine short foundation lessons</p><h2 id="m01-foundations-title">Meet security operations from the beginning</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="foundations" data-m01-section-label="foundation lessons" aria-expanded="${openFor('foundations')}" aria-controls="m01-foundations-body" aria-label="${openFor('foundations') ? 'Collapse' : 'Expand'} foundation lessons">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-section-body" id="m01-foundations-body" ${openFor('foundations') ? '' : 'hidden'}>
          <p class="m01-instruction">Read these in order on your first visit. Each lesson gives you one idea to carry into the lab; open a lesson to see the explanation.</p>
          <div class="m01-tool-translation">
            <strong>Tool translation</strong>
            <dl>
              <div><dt>SIEM</dt><dd><strong>Security Information and Event Management.</strong> Collects and analyzes security events from many sources.</dd></div>
              <div><dt>EDR</dt><dd><strong>Endpoint Detection and Response.</strong> Records endpoint behavior and supports device investigation and response.</dd></div>
              <div><dt>XDR</dt><dd><strong>Extended Detection and Response.</strong> Connects evidence across domains such as identity, endpoint, email, and cloud.</dd></div>
            </dl>
            <p>Products help organize facts. The analyst is responsible for what those facts support. The lessons below use these terms — refer back here if you need a reminder.</p>
          </div>
          ${moduleOneLessons(lab)}
          ${moduleOneReferences(lab)}
        </div>
      </section>

      <section class="m01-section m01-section-collapsible" id="m01-knowledge-check" aria-labelledby="m01-knowledge-title">
        <div class="m01-section-heading"><span>2</span><div><p class="m01-kicker">Module assessment</p><h2 id="m01-knowledge-title">Check your SOC foundations</h2></div><button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="quiz" data-m01-section-label="module assessment" aria-expanded="${openFor('quiz')}" aria-controls="m01-quiz-body" aria-label="${openFor('quiz') ? 'Collapse' : 'Expand'} module assessment"><i class="ri-arrow-down-s-line" aria-hidden="true"></i></button></div>
        <div class="m01-section-body" id="m01-quiz-body" ${openFor('quiz') ? '' : 'hidden'}>${moduleOneQuizPanel()}</div>
      </section>

      <section class="m01-section m01-section-collapsible m01-lab-section" id="m01-guided-lab" aria-labelledby="m01-lab-title">
        <div class="m01-section-heading">
          <span>3</span>
          <div><p class="m01-kicker">Module Lab · assessed handoff · ${formatInstructionalMinutes(moduleLabMinutes)} instructional time</p><h2 id="m01-lab-title">Your first SOC alert</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="lab" data-m01-section-label="lab block" aria-expanded="${openFor('lab')}" aria-controls="m01-guided-lab-body" aria-label="${openFor('lab') ? 'Collapse' : 'Expand'} lab block">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-lab-body" id="m01-guided-lab-body" ${openFor('lab') ? '' : 'hidden'}>
          <div class="m01-lab-brief">
            <i class="ri-user-star-line" aria-hidden="true"></i>
            <div><strong>One walkthrough, one assessed handoff</strong><p>The console walkthrough is available whenever you want a guided refresher. The handoff case is the graded work; it does not wait for the walkthrough.</p></div>
          </div>
          <div id="m01-lab-dynamic">${moduleOneLabDynamic()}</div>
        </div>
      </section>

      <section class="m01-section m01-section-collapsible" id="m01-review-section" aria-labelledby="m01-review-title">
        <div class="m01-section-heading"><span>4</span><div><p class="m01-kicker">Module review</p><h2 id="m01-review-title">Carry the reasoning into your next investigation</h2></div><button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="review" data-m01-section-label="module review" aria-expanded="${openFor('review')}" aria-controls="m01-review-body" aria-label="${openFor('review') ? 'Collapse' : 'Expand'} module review"><i class="ri-arrow-down-s-line" aria-hidden="true"></i></button></div>
        <div class="m01-section-body" id="m01-review-body" ${openFor('review') ? '' : 'hidden'}>${moduleOneReview()}</div>
      </section>

      <section class="m01-section m01-section-collapsible" id="m01-sources-section" aria-labelledby="m01-sources-title">
        <div class="m01-section-heading"><span>5</span><div><p class="m01-kicker">Sources &amp; Further Reading</p><h2 id="m01-sources-title">Authoritative references</h2></div><button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="sources" data-m01-section-label="sources and further reading" aria-expanded="${openFor('sources')}" aria-controls="m01-sources-body" aria-label="${openFor('sources') ? 'Collapse' : 'Expand'} sources and further reading"><i class="ri-arrow-down-s-line" aria-hidden="true"></i></button></div>
        <div class="m01-section-body" id="m01-sources-body" ${openFor('sources') ? '' : 'hidden'}>${moduleSourcesBlock(MODULE_ONE_SOURCES)}</div>
      </section>
    </main>
    </div>
  </div>`;
}

function moduleOneScore() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const verdict = moduleOneState.verdict === lab.correctVerdict ? 25 : 0;
  const priority = moduleOneState.priority === lab.correctPriority ? 20 : 0;
  const lifecycle = moduleOneState.phase === lab.correctPhase ? 15 : 0;
  const action = moduleOneState.decision === lab.correctDecision ? 20 : 0;
  const rationale = (moduleOneState.rationale || '').trim().length >= 40 ? 20 : 0;
  const score = verdict + priority + lifecycle + action + rationale;

  return {
    score,
    breakdown: { verdict, priority, lifecycle, action, rationale },
    feedback: [
      verdict ? "Verdict: Correct. Successful access plus the account owner's denial confirms a true positive." : "Verdict: Choose true positive. The sign-in succeeded and the account owner independently denied it.",
      priority ? 'Priority: Correct. Confirmed unauthorized access needs prompt response even though only one identity is currently in scope.' : 'Priority: Use High. Confidence is strong and the attacker obtained an active session.',
      lifecycle ? 'Lifecycle: Correct. You are in detection and analysis; containment is the next response activity, not a completed one.' : 'Lifecycle: Triage belongs in detect and analyze. The evidence has been validated, but access has not yet been contained.',
      action ? 'Next action: Correct. The handoff preserves evidence and invokes an authorized, proportionate identity response.' : 'Next action: Escalate with evidence and follow the identity-containment playbook. Do not close the case or disrupt unrelated systems.',
      rationale ? 'Rationale: Your reasoning clearly connects evidence to your priority and action choices.' : 'Rationale: Explain how the evidence supports your priority and recommended next action.',
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

function moduleOneSaveQuiz() {
  if (!moduleOneState || !moduleOneQuizState) return;
  moduleOneState.quiz = {
    selectedQuestions: moduleOneQuizState.selectedQuestions,
    questionsByAnswer: moduleOneQuizState.questionsByAnswer,
    answers: moduleOneQuizState.answers,
    scored: moduleOneQuizState.scored,
    attempts: moduleOneQuizState.attempts,
    score: moduleOneQuizState.score,
    bestScore: moduleOneQuizState.bestScore,
    feedback: moduleOneQuizState.feedback,
    passed: moduleOneQuizState.passed,
  };
  moduleOneSave();
}

function moduleOneRenderQuiz(focusId) {
  const form = document.getElementById('m01-quiz-form');
  if (!form) return;
  // The persistent form is the render target. The nested form returned by
  // moduleOneQuizPanel() is never inserted; this preserves its listeners.
  form.innerHTML = moduleOneQuizPanel().replace(/^<form[^>]*>|<\/form>$/g, '');
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function wireModuleOneQuiz() {
  const form = document.getElementById('m01-quiz-form');
  if (!form || !moduleOneQuizState) return;
  form.addEventListener('change', (event) => {
    const input = event.target.closest('[data-m01-module-answer]');
    if (!input) return;
    const questionId = input.closest('[data-m01-module-question]')?.dataset.m01ModuleQuestion;
    if (!questionId) return;
    moduleOneQuizState.answers[questionId] = input.value;
    moduleOneSaveQuiz();
    moduleOneRenderQuiz();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = scoreQuizAttempt(moduleOneQuizState.selectedQuestions, moduleOneQuizState.questionsByAnswer, moduleOneQuizState.answers);
    moduleOneQuizState.attempts += 1;
    moduleOneQuizState.score = result.score;
    moduleOneQuizState.bestScore = Math.max(moduleOneQuizState.bestScore || 0, result.score);
    moduleOneQuizState.feedback = result.feedback;
    moduleOneQuizState.scored = true;
    moduleOneQuizState.passed = result.score >= 70;
    moduleOneSaveQuiz();
    moduleOneSyncCompletion();
    moduleOneRenderQuiz('m01-quiz-feedback');
  });
  form.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m01-quiz-retry]')) return;
    event.preventDefault();
    const previousQuestionIds = moduleOneQuizState.selectedQuestions.map((entry) => entry.question.id);
    const selection = selectQuizQuestions(MODULE_ONE_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleOneQuizState.selectedQuestions = selection.selectedQuestions;
    moduleOneQuizState.questionsByAnswer = selection.questionsByAnswer;
    moduleOneQuizState.answers = {};
    moduleOneQuizState.scored = false;
    moduleOneQuizState.passed = false;
    moduleOneQuizState.score = 0;
    moduleOneSaveQuiz();
    moduleOneRenderQuiz('m01-quiz-title');
  });
}

function wireModuleOneLab() {
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleOneReviewMode = !moduleOneReviewMode;
      document.querySelectorAll('.m01-section-collapsible').forEach((section) => {
        const button = section.querySelector('[data-m01-section-toggle]');
        const body = button ? document.getElementById(button.getAttribute('aria-controls')) : null;
        if (!button || !body) return;
        const isOpen = moduleOneReviewMode || moduleOneState.sectionOpen[button.dataset.m01SectionKey] === true;
        button.setAttribute('aria-expanded', String(isOpen));
        button.setAttribute('aria-label', `${isOpen ? 'Collapse' : 'Expand'} ${button.dataset.m01SectionLabel || 'section'}`);
        body.hidden = !isOpen;
      });
      reviewToggle.setAttribute('aria-pressed', String(moduleOneReviewMode));
    });
  }
  wireModuleOneQuiz();
  document.querySelectorAll('[data-m01-section-toggle]').forEach((sectionToggle) => {
    const sectionBody = document.getElementById(sectionToggle.getAttribute('aria-controls'));
    if (!sectionBody) return;

    sectionToggle.addEventListener('click', () => {
      const isExpanded = sectionToggle.getAttribute('aria-expanded') === 'true';
      const sectionLabel = sectionToggle.dataset.m01SectionLabel || 'section';
      sectionToggle.setAttribute('aria-expanded', String(!isExpanded));
      sectionToggle.setAttribute('aria-label', `${isExpanded ? 'Expand' : 'Collapse'} ${sectionLabel}`);
      sectionBody.hidden = isExpanded;
      const sectionKey = sectionToggle.dataset.m01SectionKey;
      if (sectionKey) {
        moduleOneState.sectionOpen[sectionKey] = !isExpanded;
        moduleOneSave();
      }
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
    const simulatorSubmit = event.target.closest('[data-m01-submit-simulator]');
    if (simulatorSubmit) {
      moduleOneFinalizeSimulatorSubmission();
      return;
    }
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

    if (event.target.id === 'm01-rationale') {
      moduleOneState.rationale = event.target.value;
      moduleOneSave();
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

    if (event.target.id === 'm01-form') {
      event.preventDefault();
      const missing = ['verdict', 'priority', 'phase', 'decision'].filter((name) => !moduleOneState[name]);
      if (missing.length) {
        moduleOneState.validationError = 'Choose an answer for each numbered decision.';
        moduleOneSave();
        moduleOneRenderDynamic('m01-feedback');
        return;
      }

      const rationaleLength = (moduleOneState.rationale || '').trim().length;
      if (rationaleLength < 40) {
        moduleOneState.validationError = 'Explain your reasoning in at least 40 characters. Why did you choose this priority and next action?';
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
      }
      if (passed) {
        moduleOneState.completed = true;
        if (!moduleOneState.flags.includes(MODULE_ONE_FLAG)) moduleOneState.flags.push(MODULE_ONE_FLAG);
      }
      moduleOneSave();
      if (passed && typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
      }
      moduleOneSyncCompletion();
      moduleOneRenderDynamic('m01-feedback');
      moduleOneRefreshHeroProgress();
      return;
    }

  });

  // Lesson work event listeners. Delegated on #m01-lessons rather than
  // `document` because that element is part of moduleOneLessons()'s output
  // and is discarded and recreated on every render() — unlike `document`,
  // which persists, so a listener attached there would double up every time
  // wireModuleOneLab() runs again (it runs after every render()).
  document.querySelectorAll('[data-m01-lesson]').forEach((lessonDetails) => {
    lessonDetails.addEventListener('toggle', () => {
      const lessonNumber = String(lessonDetails.dataset.m01Lesson);
      if (!moduleOneState.lessonWork[lessonNumber]) {
        moduleOneState.lessonWork[lessonNumber] = {};
      }
      moduleOneState.lessonWork[lessonNumber].open = lessonDetails.open;
      moduleOneSave();
    });
  });

  const lessonsRoot = document.getElementById('m01-lessons');
  if (lessonsRoot) {
    lessonsRoot.addEventListener('change', (event) => {
      const input = event.target;
      if (input.dataset.m01LqLesson) {
        const lessonNumber = String(input.dataset.m01LqLesson);
        const questionId = input.dataset.m01LqQuestion;
        if (!moduleOneState.lessonWork[lessonNumber]) {
          moduleOneState.lessonWork[lessonNumber] = {};
        }
        if (!moduleOneState.lessonWork[lessonNumber].answers) {
          moduleOneState.lessonWork[lessonNumber].answers = {};
        }
        moduleOneState.lessonWork[lessonNumber].answers[questionId] = input.value;
        moduleOneSave();
      }
    });

    lessonsRoot.addEventListener('click', (event) => {
      const checkBtn = event.target.closest('[data-m01-lesson-check]');
      if (checkBtn) {
        const lessonNumber = String(checkBtn.dataset.m01LessonCheck);
        if (!moduleOneState.lessonWork[lessonNumber]) {
          moduleOneState.lessonWork[lessonNumber] = {};
        }
        moduleOneState.lessonWork[lessonNumber].checked = true;
        moduleOneSave();
        moduleOneSyncCompletion();
        render();
        const lessonEl = document.querySelector('[data-m01-lesson="' + lessonNumber + '"]');
        if (lessonEl) requestAnimationFrame(() => lessonEl.scrollIntoView({ block: 'nearest' }));
      }
    });
  }
}

async function moduleOneReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== 'm01') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) return;

  const saved = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
  saved.consoleStarted = true;
  saved.consoleCompleted = true;
  moduleOneState = saved;
  moduleOneUser = user;
  moduleOneSave();

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

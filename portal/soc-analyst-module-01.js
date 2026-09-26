/* Module 01 — beginner-first SOC foundations and a single guided triage.
 * All records and actions are fictional, browser-local simulations.
 */

const MODULE_ONE_LAB_ID = 'm01-first-soc-alert-v2';
const MODULE_ONE_FLAG = 'M01-FIRST-ALERT-TRIAGED';
const MODULE_ONE_CATALOG_LAB_KEY = 'lab-soc-environment';
const MODULE_ONE_ROUTE = '#/program/soc-analyst/module/1';
// Sign-in log pagination (moduleOneLogTable()) and the department-routing
// fit score below which a submitted-to team kicks the ticket back to the
// student unsubmitted rather than accepting it with a note (see
// MODULE_ONE_ESCALATION_LAB.departmentOptions in portal/data.js).
const MODULE_ONE_LOG_PAGE_SIZE = 10;
const MODULE_ONE_DEPARTMENT_BOUNCE_THRESHOLD = 40;

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
  // Practice is deliberately the same job-shaped ITSM ticket as Prove It.
  // Its coaching reacts to what the learner opens and records, rather than
  // asking them to type facts back into a disguised quiz.
  practice: {
    status: 'in-progress', affectedUser: '', affectedDevice: '', severity: '',
    disposition: '', escalation: '', escalateTo: '', notes: '', actionHistory: [],
    viewedLogIds: [], expandedLogId: null, logPage: 1,
  },
  lessonWork: {},
  sectionOpen: { checklist: false, foundations: true, lab: false, quiz: false, review: false, sources: false },
  quiz: { selectedQuestions: [], questionsByAnswer: {}, answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false },
  // Prove It: a fresh, minimal-guidance case worked in the same case-console
  // family as Practice It. The one graded artifact for Module 1.
  lab2: {
    completed: false, submitted: false, submittedAt: '',
    reviewedEvidence: [], intake: '', priority: '', containment: '', verdict: '',
    status: '', affectedUser: '', affectedDevice: '', escalation: '', escalateTo: '',
    notes: '', actionHistory: [], viewedLogIds: [], expandedLogId: null, logPage: 1,
    handoff: { observations: '', analysis: '', scope: '', nextAction: '' },
    validationError: '', attempts: 0, score: null, breakdown: null,
  },
};

let moduleOneState = null;
let moduleOneUser = null;
let moduleOneJustCorrect = '';
let moduleOneQuizState = null;
// True once the learner explicitly asks to retake a knowledge check that
// this browser has no real local answers for but that reads complete from a
// remote/admin source (see moduleOneQuizPanel()). Reset on every fresh load
// so it never carries over to a different account/session.
let moduleOneQuizForceRetake = false;
// Set when Submit Lab is pressed with items still missing, so the list is
// called out rather than the button silently refusing.
let moduleOneProveItShowMissing = false;
let moduleOneReviewMode = false;
let moduleOneLastSyncedDetail = null;

function moduleOneRemoteComplete() {
  return moduleOneUser?.remoteVerifiedModuleProgress?.['soc-01'] === true;
}

function moduleOneProveItRedoRequested() {
  return moduleOneUser?.openLabRedosByModuleKey?.['soc-01']?.labKey === 'lab-soc-escalation';
}

// '' until submitted; then 'review' while the latest attempt awaits faculty,
// 'graded' once an instructor has reviewed it without sending it back.
function moduleOneProveItReviewStatus() {
  if (!moduleOneState?.lab2?.submitted) return '';
  const attempt = moduleOneUser?.latestLabAttemptByKey?.['lab-soc-escalation'];
  return attempt?.reviewedAt && !attempt.redoRequested ? 'graded' : 'review';
}

// Instructor per-item notes from a returned attempt, shown wherever the
// student works the case — not only on the program page's module card.
function moduleOneProveItRedoFeedback() {
  if (!moduleOneProveItRedoRequested()) return '';
  const items = moduleOneUser.openLabRedosByModuleKey['soc-01'].feedback || [];
  return `<div class="m01-redo-feedback" role="note">
    <strong><i class="ri-feedback-line" aria-hidden="true"></i> Instructor feedback</strong>
    ${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this case without written notes. Use Message Instructor if you are not sure what to change.</p>'}
  </div>`;
}

// Prove It is Module 1's one graded artifact: a fresh case worked in the same
// case-console interface as Practice It, minimal guidance, submitted to the
// instructor. No live score is shown to the student — confirmation only.
function moduleOneFinalizeProveIt() {
  const performance = moduleOneProveItPerformance();
  if (moduleOneState.lab2.submitted) return;
  if (performance.missing.length) {
    moduleOneProveItShowMissing = true;
    moduleOneRenderReviewDynamic('m01-review-submission');
    return;
  }
  moduleOneProveItShowMissing = false;
  moduleOneState.lab2.submitted = true;
  moduleOneState.lab2.submittedAt = new Date().toISOString();
  moduleOneState.lab2.completed = true;
  moduleOneState.lab2.attempts = (moduleOneState.lab2.attempts || 0) + 1;
  moduleOneState.lab2.score = performance.score;
  moduleOneState.lab2.breakdown = performance.breakdown;
  moduleOneState.lab2.actionHistory.push({ action: 'Submitted case for faculty review', at: moduleOneState.lab2.submittedAt });
  moduleOneSave();
  if (moduleOneUser) {
    moduleOneUser.latestLabAttemptByKey = { ...(moduleOneUser.latestLabAttemptByKey || {}), 'lab-soc-escalation': { completedAt: moduleOneState.lab2.submittedAt, reviewedAt: null, redoRequested: false } };
  }
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleOneUser, 'lab-soc-escalation', { state: 'complete', score: performance.score, result: { breakdown: performance.breakdown, feedback: performance.feedback, critical_errors: performance.criticalErrors, case_record: moduleOneState.lab2 } })
      .then((saved) => {
        // The new append-only attempt supersedes the returned attempt in the
        // student UI. Faculty approval remains required by the server view.
        if (saved && moduleOneProveItRedoRequested()) delete moduleOneUser.openLabRedosByModuleKey['soc-01'];
      });
  }
  if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', 'lab-soc-escalation');
  moduleOneSyncCompletion(); moduleOneRenderReviewDynamic('m01-review-submission'); moduleOneRefreshHeroProgress();
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
  if (!moduleOneState.practice || typeof moduleOneState.practice !== 'object') moduleOneState.practice = JSON.parse(JSON.stringify(MODULE_ONE_DEFAULT_STATE.practice));
  ['status', 'affectedUser', 'affectedDevice', 'severity', 'disposition', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleOneState.practice[key] !== 'string') moduleOneState.practice[key] = MODULE_ONE_DEFAULT_STATE.practice[key] || '';
  });
  if (!Array.isArray(moduleOneState.practice.actionHistory)) moduleOneState.practice.actionHistory = [];
  if (!Array.isArray(moduleOneState.practice.viewedLogIds)) moduleOneState.practice.viewedLogIds = [];
  if (!Number.isFinite(moduleOneState.practice.logPage)) moduleOneState.practice.logPage = 1;
  if (typeof moduleOneState.lab2.completed !== 'boolean') moduleOneState.lab2.completed = false;
  if (typeof moduleOneState.lab2.submitted !== 'boolean') moduleOneState.lab2.submitted = false;
  if (!Array.isArray(moduleOneState.lab2.reviewedEvidence)) moduleOneState.lab2.reviewedEvidence = [];
  if (!Array.isArray(moduleOneState.lab2.viewedLogIds)) moduleOneState.lab2.viewedLogIds = [];
  if (!Number.isFinite(moduleOneState.lab2.logPage)) moduleOneState.lab2.logPage = 1;
  // The phone-callback fact ('owner') has no log row — it's handed over,
  // not investigated (see MODULE_ONE_ESCALATION_LAB.scenario.evidence) — so
  // it can never be earned through the log-click mechanic below. Credit it
  // automatically so moduleOneProveItPerformance()'s "review every piece of
  // evidence" gate is actually satisfiable.
  if (!moduleOneState.lab2.reviewedEvidence.includes('owner')) moduleOneState.lab2.reviewedEvidence.push('owner');
  ['status', 'affectedUser', 'affectedDevice', 'escalation', 'escalateTo', 'notes'].forEach((key) => {
    if (typeof moduleOneState.lab2[key] !== 'string') moduleOneState.lab2[key] = MODULE_ONE_DEFAULT_STATE.lab2[key] || '';
  });
  if (!Array.isArray(moduleOneState.lab2.actionHistory)) moduleOneState.lab2.actionHistory = [];
  // Migrate untouched pre-Select Assessment Lab records. Do not alter a
  // learner's in-progress work, but a fresh case must require every choice.
  if (!moduleOneState.lab2.actionHistory.length && moduleOneState.lab2.status === 'in-progress') moduleOneState.lab2.status = '';
  if (!moduleOneState.lab2.handoff || typeof moduleOneState.lab2.handoff !== 'object') moduleOneState.lab2.handoff = { observations: '', analysis: '', scope: '', nextAction: '' };
  ['intake', 'priority', 'containment', 'verdict'].forEach((key) => { if (typeof moduleOneState.lab2[key] !== 'string') moduleOneState.lab2[key] = ''; });
  // The returned attempt remains immutable in lab_attempts, but its saved
  // case-state latch must not make the working case permanently unsubmitable.
  // Scope this reset to an open redo for this exact lab.
  if (moduleOneProveItRedoRequested() && moduleOneState.lab2.submitted === true) {
    moduleOneState.lab2.submitted = false;
    moduleOneState.lab2.submittedAt = '';
    moduleOneSave();
  }
  // `module_progress` historically recorded Module 01 as complete after a
  // coarse lab-only check. Do not manufacture the missing lesson, quiz, or
  // Lab 2 evidence from that record: the page must never show work complete
  // merely because another layer has a stale summary badge.
  if (!moduleOneQuizState || moduleOneQuizState.userKey !== user.email) {
    moduleOneQuizForceRetake = false;
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
    return '';
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
  const guidedLabComplete = verified || Boolean(moduleOneState?.consoleCompleted);
  const guidedLabStarted = guidedLabComplete || Boolean(moduleOneState?.consoleStarted);
  const assessmentLabComplete = verified || Boolean(moduleOneState?.lab2?.completed);
  const assessmentLabStarted = assessmentLabComplete || Boolean(
    moduleOneState?.lab2 && (moduleOneState.lab2.reviewedEvidence?.length || moduleOneState.lab2.intake
      || moduleOneState.lab2.priority || moduleOneState.lab2.containment || moduleOneState.lab2.verdict),
  );
  // verified first, matching guidedLabComplete/assessmentLabComplete above —
  // the server-verified record (which includes any admin completion
  // override) is more authoritative than the coarse evidence-key fallback.
  const knowledgeCheckComplete = verified
    || Boolean(moduleOneQuizState?.passed)
    || moduleOneUser?.remoteModuleEvidence?.['soc-01']?.['knowledge-check'] === true;
  const complete = verified || (lessonsComplete === lessonsTotal && knowledgeCheckComplete && guidedLabComplete && assessmentLabComplete);
  return {
    lessonsTotal,
    lessonsComplete,
    guidedLabComplete,
    guidedLabStarted,
    assessmentLabComplete,
    assessmentLabStarted,
    knowledgeCheckComplete,
    complete,
    remoteRecord: verified,
  };
}

function moduleOneRefreshHeroProgress() {
  const progress = moduleOneProgress();
  const labCount = document.getElementById('m01-lab-count');
  const status = document.getElementById('m01-status');
  if (labCount) labCount.textContent = progress.guidedLabComplete ? 'Complete' : progress.guidedLabStarted ? 'In progress' : 'Not started';
  if (status) status.textContent = progress.complete ? 'Complete' : 'In progress';
}

function moduleOneSyncCompletion() {
  if (moduleOneProgress().complete && typeof markModuleCompleteRemote === 'function') {
    markModuleCompleteRemote(moduleOneUser, 'soc-01');
  }
}

// Prove It scoring: MODULE_ONE_ESCALATION_LAB (NST-2407 / a.chen / LAP-442) —
// a fresh case from Practice It's ALT-1001/j.santos, worked with minimal
// guidance in the same case-console UI. `missing` gates the submit button;
// `score`/`breakdown` are always computed (for the instructor) but the
// student never sees them — no live score, per the program's Day-1 model.
function moduleOneProveItPerformance() {
  const lab = MODULE_ONE_ESCALATION_LAB;
  const state = moduleOneState.lab2;
  const roster = lab.scenario.entityRoster;
  const department = (lab.departmentOptions || []).find((option) => option.id === state.escalateTo) || null;
  const escalationRequiredOk = state.escalation === 'required';
  const bounced = escalationRequiredOk && department && department.fit < MODULE_ONE_DEPARTMENT_BOUNCE_THRESHOLD;

  const missing = [];
  if ((state.reviewedEvidence || []).length < lab.scenario.evidence.length) missing.push('Review every piece of evidence');
  if (!state.status) missing.push('Set the status');
  if (!state.affectedUser || !state.affectedDevice) missing.push('Add the affected user and device');
  if (!state.priority) missing.push('Set the severity');
  if (!state.verdict) missing.push('Record a disposition');
  if (!state.escalation) missing.push('Set whether escalation is required');
  // Check `department` (resolved against the current departmentOptions),
  // not just state.escalateTo's truthiness — a stale value saved under an
  // older option set (e.g. a since-removed department id) must still read
  // as unrouted, not silently pass with zero escalation credit.
  if (escalationRequiredOk && !department) missing.push('Route the case to a department');
  // A low-fit department is NOT added to `missing` — per the program's
  // no-live-score Prove It model, submission is never blocked by routing
  // quality. `bounced`/`routingFeedback` below still reach the instructor
  // through the stored breakdown, and faculty can return the case with the
  // department's remediation note if a redo is warranted. Live per-choice
  // accept/partial/bounce feedback is Practice It's job, not Prove It's.
  if ((state.notes || '').trim().length < 80) missing.push('Write an analyst work note');

  // Percentage-based, tiered scope credit: naming the confirmed entity earns
  // full credit, naming a supported pivot (touches the case's evidence but
  // isn't the principal) earns half credit, and an unrelated noise entity
  // pulled from the log volume earns none. See entityRoster in
  // portal/data.js and docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md's grading philosophy.
  const userTier = roster.users.find((entry) => entry.id === state.affectedUser)?.tier;
  const deviceTier = roster.devices.find((entry) => entry.id === state.affectedDevice)?.tier;
  const tierFit = (tier) => (tier === 'principal' ? 1 : tier === 'pivot' ? 0.5 : 0);
  const entityPoints = Math.round((tierFit(userTier) + tierFit(deviceTier)) * 10); // 0-20

  const priority = state.priority === lab.correctPriority ? 15 : 0;
  const verdict = state.verdict === lab.correctVerdict ? 20 : 0;
  // Department-routing credit scales with how good a fit the chosen
  // department actually is for this case — not binary correct/incorrect —
  // so a plausible-but-not-best department (e.g. IAM instead of Tier 2 SOC)
  // still earns most of the points, per department.fit in portal/data.js.
  const escalation = escalationRequiredOk && department && !bounced ? Math.round((department.fit / 100) * 35) : 0;
  const notesLen = (state.notes || '').trim().length;
  const notes = Math.round(Math.min(1, notesLen / 80) * 10);
  const score = entityPoints + priority + verdict + escalation + notes;
  const criticalErrors = state.escalation === 'not-required' ? ['escalation-not-required'] : [];

  const entityFeedback = entityPoints >= 20
    ? 'Affected entity/scope: correct — the confirmed user and device.'
    : entityPoints > 0
      ? `Affected entity/scope: partial credit — a related entity is supported by the evidence, but ${lab.scenario.entity} is the confirmed affected user/device.`
      : `Affected entity/scope: review — ${lab.scenario.entity} is the confirmed affected user/device, supported by the log evidence.`;
  const routingFeedback = !escalationRequiredOk
    ? 'Routing: not applicable — escalation was set to not required.'
    : !department
      ? 'Routing: review — this case needs a department routed with the recorded evidence.'
      : department.fit >= 100
        ? `Routing: correct — ${department.text} is the best-fit department for this case.`
        : department.fit >= MODULE_ONE_DEPARTMENT_BOUNCE_THRESHOLD
          ? `Routing: accepted, but not the best fit — ${department.note}`
          : `Routing: returned — ${department.bounce || department.note}`;

  return {
    missing,
    score,
    breakdown: { affected_entity: entityPoints, severity: priority, disposition: verdict, escalation, analyst_notes: notes },
    department, bounced,
    feedback: [
      entityFeedback,
      priority ? 'Severity: correct.' : `Severity: review — ${lab.priorityOptions.find((o) => o.id === lab.correctPriority)?.text}`,
      verdict ? 'Disposition: correct.' : `Disposition: review — ${lab.verdictOptions.find((o) => o.id === lab.correctVerdict)?.text}`,
      routingFeedback,
    ],
    criticalErrors,
  };
}
function moduleOneProveItSubmissionPanel() {
  return caseRecordPanel({
    panelId: 'm01-review-submission',
    missing: moduleOneProveItPerformance().missing,
    submitted: moduleOneState.lab2.submitted,
    reviewStatus: moduleOneProveItReviewStatus(),
    redoRequested: moduleOneProveItRedoRequested(),
    redoHtml: moduleOneProveItRedoFeedback(),
    showMissing: moduleOneProveItShowMissing,
    lockedMessage: 'Module 2 stays locked until your instructor approves the submission.',
  });
}

function moduleOneGuidedLabFeedback() {
  if (!moduleOneState.consoleCompleted) return '';
  const practice = moduleOneState.practice;
  const checks = [
    [practice.status === 'in-progress', 'Status', 'Correct: keep the case In Progress while Identity Response acts.', 'Set Status to In Progress; the case is handed off, not resolved.'],
    [practice.affectedUser === 'j.santos', 'Affected User', 'Correct: j.santos is the affected user.', 'Add j.santos as the affected user.'],
    [practice.affectedDevice === 'WKS-14', 'Affected Device', 'Correct: WKS-14 is the supported affected device.', 'Add WKS-14 as the affected device.'],
    [practice.priority === 'high', 'Severity', 'Correct: High fits the confirmed but bounded account compromise.', 'Change Severity from Critical to High. The evidence supports prompt response, not enterprise-wide critical impact.'],
    [practice.verdict === 'true-positive', 'Disposition', 'Correct: this is confirmed malicious activity.', 'Set Disposition to Confirmed malicious activity.'],
    [practice.escalation === 'required', 'Escalation required', 'Correct: the case requires escalation.', 'Set Escalation required to Required.'],
    [practice.escalateTo === 'identity-response', 'Escalate to', 'Correct: Identity Response owns the next authorized action.', 'Choose Identity Response for the handoff.'],
    [Boolean((practice.notes || '').trim()), 'Analyst Work Notes', 'Documented: the handoff has the evidence it needs.', 'Add concise analyst work notes with the evidence and recommended handoff.'],
  ];
  const correct = checks.filter(([isCorrect]) => isCorrect).length;
  return `<div class="m01cc-feedback ${correct === checks.length ? 'is-pass' : 'is-coaching'}" id="m01cc-feedback" tabindex="-1" role="status">
    <strong>Guided Lab feedback · ${correct}/${checks.length} decisions aligned</strong>
    <ul class="m01cc-feedback-list">${checks.map(([isCorrect, label, correctMessage, correction]) => `<li><i class="ri-${isCorrect ? 'check' : 'information'}-circle-fill" aria-hidden="true"></i><strong>${esc(label)}:</strong> ${esc(isCorrect ? correctMessage : correction)}</li>`).join('')}</ul>
    <p>${correct === checks.length ? 'Well reasoned. Guided Lab is complete; continue to the independent Assessment Lab.' : 'Review the notes above, update the case if needed, then resubmit to see the coaching again.'}</p>
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

function moduleOneEvidenceList(scenario, reviewed, attribute, disabled = false) {
  return `<p class="m01-console-pane-title">Evidence <span class="muted">${reviewed.size}/${scenario.evidence.length} reviewed</span></p>
    <ul class="m01-console-evidence">${scenario.evidence.map((item) => `<li class="${reviewed.has(item.id) ? 'is-reviewed' : ''}">
      <button type="button" ${attribute}="${esc(item.id)}" ${disabled ? 'disabled' : ''}><i class="${esc(item.icon)}" aria-hidden="true"></i>
        <span><time>${esc(item.time)}</time><strong>${esc(item.label)}</strong><p>${esc(item.detail)}</p></span>
        <i class="${reviewed.has(item.id) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}" aria-hidden="true"></i>
      </button></li>`).join('')}</ul>`;
}

// Thin wrappers over the shared ITSM Incident Ticket (portal/case-record.js).
// Module 01 is the reference the shared renderer was lifted from.
function moduleOneTicketFields(state, spec) {
  // Practice It (ALT-1001) keeps the small fixed roster/department list it
  // always had; Prove It (NST-2407) passes its own larger entityRoster and
  // departmentOptions (portal/data.js) through spec.
  return caseRecordFields(state, {
    caseId: spec.caseId,
    dispositionOptions: spec.dispositionOptions,
    userOptions: spec.userOptions || [{ id: 'a.chen', text: 'a.chen' }, { id: 's.kim', text: 's.kim' }, { id: 'd.williams', text: 'd.williams' }],
    deviceOptions: spec.deviceOptions || [{ id: 'LAP-442', text: 'LAP-442' }, { id: 'FS-02', text: 'FS-02' }, { id: 'WKS-14', text: 'WKS-14' }],
    departmentOptions: spec.departmentOptions,
    disabled: spec.disabled,
    entityButtons: spec.entitySelects !== true,
    correct: spec.guided ? { status: 'in-progress', severity: 'high', affectedUser: 'j.santos', affectedDevice: 'WKS-14', disposition: 'true-positive', escalation: 'required', escalateTo: 'identity-response' } : null,
  });
}

// Practice It: a guided case (ALT-1001 / j.santos) in its own focused case
// console — alert queue, log/evidence pane, ITSM ticket. Per
// docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md, this is NOT the full SOC range: a small,
// original, vendor-neutral workspace scoped to exactly this case. Hints and
// coachmarks are fine here; this is coached, ungraded, retry-friendly
// practice, not the graded artifact (that's Prove It, moduleOneReview()).
// Launch card: opens the console in a new tab, same origin/session, via
// viewModuleOne()'s `?console=practice` branch — not the ui/ simulator.
function moduleOneLabLaunchCard() {
  const complete = Boolean(moduleOneState.consoleCompleted);
  const started = Boolean(moduleOneState.consoleStarted);
  return `<div class="m01-lab-launch">
    <a class="m01-hero-action" href="?console=practice${esc(location.hash)}" target="_blank" rel="opener">
      <i class="${complete ? 'ri-refresh-line' : started ? 'ri-terminal-box-line' : 'ri-play-circle-line'}" aria-hidden="true"></i>
      ${complete ? 'Review the case' : started ? 'Resume Guided Lab' : 'Launch Guided Lab'}</a>
    <p class="m01-lab-launch-status">${complete
      ? 'Case checked. Opens the case console in a new tab if you want to review it.'
      : 'Opens the case console in a new tab — a small, focused workspace for this one case, not the full SOC range.'}</p>
  </div>`;
}

// LMS-side card only, per docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md §2: "It should not
// remain embedded as a small card inside the LMS." The actual queue/logs/
// ticket workspace lives at viewModuleOneCaseConsole() (opened by the launch
// card, in a new tab, full-bleed) — see moduleOneCaseConsolePane().
function moduleOneLabDynamic() {
  const state = moduleOneState.practice;
  const complete = Boolean(moduleOneState.consoleCompleted);
  const status = !moduleOneState.consoleStarted ? 'Not started'
    : complete ? 'Complete' : 'In progress';
  return `${moduleOneLabLaunchCard()}
  <div class="m01-lab-status-row ${status === 'Complete' ? 'is-complete' : status === 'In progress' ? 'is-in-progress' : 'is-not-started'}">
    <i class="${status === 'Complete' ? 'ri-checkbox-circle-fill' : status === 'In progress' ? 'ri-time-line' : 'ri-inbox-line'}" aria-hidden="true"></i>
    <span>${status === 'Complete' ? 'Case worked and checked.'
      : status === 'In progress' ? `${(state.actionHistory || []).length} action${(state.actionHistory || []).length === 1 ? '' : 's'} recorded so far.`
      : 'An alert is waiting in your queue.'}</span>
  </div>`;
}

// Log/evidence pane (docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md §3): real rows, not
// pre-summarized cards. Opening a row is the "read the evidence" action —
// see wireModuleOneCaseConsole()'s data-m01cc-log-row handler — which marks
// it viewed and expands its raw structured record underneath.
function moduleOneLogTable(scenario, state) {
  const viewed = new Set(state.viewedLogIds || []);
  const expandedId = state.expandedLogId || null;
  const total = scenario.logEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / MODULE_ONE_LOG_PAGE_SIZE));
  const page = Math.min(Math.max(1, state.logPage || 1), totalPages);
  const pageRows = scenario.logEvents.slice((page - 1) * MODULE_ONE_LOG_PAGE_SIZE, page * MODULE_ONE_LOG_PAGE_SIZE);
  return `<p class="m01cc-pane-title">Sign-in log <span class="muted">${viewed.size}/${total} opened</span></p>
    <table class="m01cc-log-table">
      <thead><tr><th>Time</th><th>Event type</th><th>User</th><th>Device</th><th>Source IP</th><th>Result</th></tr></thead>
      <tbody>${pageRows.map((row) => `
        <tr class="m01cc-log-row ${viewed.has(row.id) ? 'is-viewed' : ''} ${expandedId === row.id ? 'is-expanded' : ''}"
            data-m01cc-log-row="${esc(row.id)}" tabindex="0" role="button" aria-expanded="${expandedId === row.id}">
          <td>${esc(row.time)}</td><td>${esc(row.type)}</td><td>${esc(row.user)}</td><td>${esc(row.device)}</td>
          <td>${esc(row.sourceIp)}</td><td><span class="m01cc-result m01cc-result-${esc(row.result.toLowerCase())}">${esc(row.result)}</span></td>
        </tr>${expandedId === row.id ? `<tr class="m01cc-raw-row"><td colspan="6"><pre class="m01cc-raw">${esc(Object.entries(row.raw)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}=${v}`).join('\n'))}</pre></td></tr>` : ''}
      `).join('')}</tbody>
    </table>
    ${totalPages > 1 ? `<div class="m01cc-log-pager">
      <button type="button" data-m01cc-log-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}><i class="ri-arrow-left-s-line" aria-hidden="true"></i> Prev</button>
      <span class="muted">Page ${page} of ${totalPages} · ${total} events</span>
      <button type="button" data-m01cc-log-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Next <i class="ri-arrow-right-s-line" aria-hidden="true"></i></button>
    </div>` : ''}`;
}

// The three-pane case console body (docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md §2):
// Alert Queue / Logs+Evidence / ITSM Ticket. Reuses the same
// moduleOneState.practice record and moduleOneTicketFields() the LMS-side
// card used to render inline — only the log pane and the shell around it
// are new.
function moduleOneCaseConsolePane() {
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const scenario = lab.scenario;
  const state = moduleOneState.practice;
  if (!moduleOneState.consoleStarted) {
    return `<div class="m01-shift-start" aria-labelledby="m01cc-shift-start-title">
      <i class="ri-shield-user-line" aria-hidden="true"></i>
      <div><p class="m01-kicker">SOC analyst shift</p><h3 id="m01cc-shift-start-title">An alert is waiting in your queue</h3>
      <p>Open the assigned alert, read the sign-in log, and record what you find in the case.</p>
      <button type="button" class="m01-submit" data-m01cc-console-launch><i class="ri-play-circle-line" aria-hidden="true"></i> Open the alert</button></div>
    </div>`;
  }
  const reviewed = new Set(moduleOneState.reviewedEvidence);
  const step = !reviewed.size ? 'Step 1: Read the alert, then open the sign-in log rows below it.'
    : (!state.affectedUser || !state.affectedDevice) ? 'Step 2: Determine scope. Add the affected user and device to the case.'
      : 'Step 3: Set severity and disposition, write your work note, then update or submit the ticket.';
  const phoneNote = scenario.evidence.find((item) => item.id === 'confirmation');
  return `<div class="m01-console" aria-labelledby="m01cc-console-title">
    <div class="m01-console-header">
      <span class="m01-console-badge">Security Operations</span>
      <h3 id="m01cc-console-title">Practice It — guided case</h3>
      <p>${esc(step)}</p>
    </div>
    <div class="m01-console-body">
      <aside class="m01-console-pane m01-console-queue" aria-label="Alert queue">
        <p class="m01-console-pane-title">Alert Queue</p>
        <div class="m01-console-queue-item is-active">
          <span class="${moduleOneSeverityClass(scenario.initialSeverity)}">${esc(scenario.initialSeverity)}</span>
          <strong>${esc(scenario.title)}</strong><span class="muted">${esc(scenario.id)}</span>
        </div>
      </aside>
      <section class="m01-console-pane m01-console-detail" aria-label="Logs and evidence">
        <p class="m01-console-pane-title">Alert Details</p>
        <dl class="m01-console-meta">
          <div><dt>Entity</dt><dd>${esc(scenario.entity)}</dd></div>
          <div><dt>Detected by</dt><dd>${esc(scenario.detectedBy)}</dd></div>
          <div><dt>Created</dt><dd>${esc(scenario.created)}</dd></div>
        </dl>
        <p class="m01-console-summary">${esc(scenario.summary)}</p>
        ${moduleOneLogTable(scenario, state)}
        ${phoneNote ? `<p class="m01cc-phone-note"><i class="ri-phone-line" aria-hidden="true"></i> ${esc(phoneNote.detail)}</p>` : ''}
      </section>
      <section class="m01-console-pane m01-console-ticket" aria-label="ITSM incident ticket">
        <p class="m01-console-pane-title">ITSM Incident Ticket</p>
        <form id="m01-practice-form" class="m01-ticket-form">${moduleOneTicketFields(state, { caseId: scenario.id, severityOptions: lab.priorityOptions, dispositionOptions: lab.verdictOptions, disabled: false })}
          <div class="m01-ticket-actions"><button type="button" class="m01-reset" data-m01-practice-save>Update Ticket</button><button type="button" class="m01-submit" data-m01-practice-check>Submit Lab</button></div>
        </form>
        ${moduleOneState.consoleCompleted
          ? moduleOneGuidedLabFeedback()
          : moduleOneState.validationError
            ? `<div class="m01cc-feedback is-error" id="m01cc-feedback" tabindex="-1" role="alert">${esc(moduleOneState.validationError)}</div>`
            : ''}
      </section>
    </div>
  </div>`;
}

// Full-bleed console page (docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md §2): opened by
// moduleOneLabLaunchCard() in a new tab via viewModuleOne()'s
// `?console=practice` branch. Deliberately has no moduleTopbar/nav — the
// student should feel they have entered a work application, not a page of
// the LMS.
function viewModuleOneCaseConsole(user, program) {
  return `<div class="m01cc-shell" id="m01cc-app">
    <header class="m01cc-topbar">
      <span class="m01cc-topbar-title"><i class="ri-shield-keyhole-line" aria-hidden="true"></i> SECURITY OPERATIONS — CASE CONSOLE</span>
      <a class="m01cc-topbar-close" href="${esc(location.pathname)}#/program/soc-analyst/module/1"><i class="ri-arrow-left-line" aria-hidden="true"></i> Back to Module 1</a>
    </header>
    <main class="m01cc-main" id="m01cc-console-slot">${moduleOneCaseConsolePane()}</main>
  </div>`;
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
  // A module can read complete (server-verified, or an admin completion
  // override) without this browser ever holding the real answer set — a
  // different device did the work, or the completion was set by an admin
  // backfill/override rather than the real submit flow. Showing the fresh
  // interactive form in that case looks exactly like an unstarted quiz
  // ("0/5 answered") even though the nav rail and every other module surface
  // already say complete — never fabricate answers into the form to match;
  // show a verified summary instead until the learner explicitly retakes it.
  const verifiedElsewhere = !moduleOneQuizState.scored && answered === 0 && (
    moduleOneRemoteComplete()
    || moduleOneUser?.remoteModuleDetail?.['soc-01']?.quizPassed === true
    || moduleOneUser?.remoteModuleEvidence?.['soc-01']?.['knowledge-check'] === true
  );
  if (verifiedElsewhere && !moduleOneQuizForceRetake) {
    return `<form class="m01-module-quiz" id="m01-quiz-form" novalidate><section class="m01-score is-pass" id="m01-quiz-feedback" tabindex="-1" aria-live="polite"><p class="m01-kicker">Module knowledge check</p><h3>Already verified complete</h3><p>This knowledge check is recorded as passed on your account. It is never re-answered automatically on a new device or browser, so nothing is shown here that wasn't actually submitted.</p><button type="button" data-m01-quiz-retake>Retake this knowledge check</button></section></form>`;
  }
  const feedback = moduleOneQuizState.scored ? `<section class="m01-score ${moduleOneQuizState.passed ? 'is-pass' : 'is-remediate'}" id="m01-quiz-feedback" tabindex="-1" aria-live="polite"><p class="m01-kicker">Attempt ${moduleOneQuizState.attempts} · best ${moduleOneQuizState.bestScore}/100</p><h3>${moduleOneQuizState.score}/100 — ${moduleOneQuizState.passed ? 'Knowledge verified' : 'Review the coaching and retry'}</h3><ul>${(moduleOneQuizState.feedback || []).map((item) => `<li><strong>${item.correct ? 'Correct' : 'Review'} · ${esc(item.questionId)}</strong><p>${esc(item.message)}</p></li>`).join('')}</ul>${!moduleOneQuizState.passed ? '<button type="button" class="m01-quiz-retry" data-m01-quiz-retry>Try different questions</button>' : ''}</section>` : `<div id="m01-quiz-feedback" role="status">${answered}/${selected.length} answered. Submit when ready.</div>`;
  return `<form class="m01-module-quiz" id="m01-quiz-form" novalidate><div class="m01-panel-heading"><div><p class="m01-kicker">Module knowledge check</p><h3 id="m01-quiz-title">Classify, triage, and communicate</h3></div><span>${answered}/${selected.length} answered</span></div>${selected.map(moduleOneQuizQuestion).join('')}<button type="submit" ${answered < selected.length ? 'disabled' : ''}>Check my answers</button>${feedback}</form>`;
}

// Prove It: a fresh case (NST-2407 / a.chen / LAP-442), same case-console
// interface family as Practice It, minimal guidance — the option lists below
// carry no `.help` text in the data, and evidence is read plainly rather
// than filled in. This is Module 1's one graded artifact.
// Prove It's launch card — same new-tab pattern as Practice It's
// moduleOneLabLaunchCard(), per docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md: no simulator,
// no embedded-in-LMS console, just a card that opens the case console.
function moduleOneProveItLaunchCard() {
  const state = moduleOneState.lab2;
  const submitted = Boolean(state.submitted);
  const redoRequested = moduleOneProveItRedoRequested();
  return `<div class="m01-lab-launch">
    <a class="m01-hero-action" href="?console=prove${esc(location.hash)}" target="_blank" rel="opener">
      <i class="${submitted ? 'ri-eye-line' : redoRequested ? 'ri-refresh-line' : 'ri-play-circle-line'}" aria-hidden="true"></i>
      ${submitted ? 'Review the case' : redoRequested ? 'Resume Assessment Lab' : (state.actionHistory || []).length ? 'Resume Assessment Lab' : 'Launch Assessment Lab'}</a>
    <p class="m01-lab-launch-status">${moduleOneProveItReviewStatus() === 'graded'
      ? 'Lab graded by your instructor. Opens the case console in a new tab if you want to review it.'
      : submitted
      ? 'Submitted for faculty review. Opens the case console in a new tab if you want to review it.'
      : redoRequested
        ? 'Returned for remediation. Opens the case console in a new tab to review feedback and resubmit.'
        : 'Opens the case console in a new tab — a small, focused workspace for this one case, not the full SOC range.'}</p>
    ${moduleOneProveItRedoFeedback()}
  </div>`;
}

function moduleOneProveItCaseConsolePane() {
  const lab = MODULE_ONE_ESCALATION_LAB;
  const scenario = lab.scenario;
  const state = moduleOneState.lab2;
  const submitted = state.submitted;
  const requirements = moduleOneProveItPerformance().missing;
  const reviewStatus = moduleOneProveItReviewStatus();
  const phoneNote = scenario.evidence.find((item) => item.id === 'owner');

  return `<div class="m01-console" aria-labelledby="m01-console-prove-title">
    <div class="m01-console-header">
      <span class="m01-console-badge">Security Operations</span>
      <h3 id="m01-console-prove-title">Prove It — independent case</h3>
      <p>An alert has been assigned to you. Investigate the activity, determine the appropriate disposition, and document what should happen next.</p>
    </div>
    <div class="m01-console-body">
      <aside class="m01-console-pane m01-console-queue" aria-label="Alert queue">
        <p class="m01-console-pane-title">Alert Queue</p>
        <div class="m01-console-queue-item is-active">
          <span class="${moduleOneSeverityClass(scenario.initialSeverity)}">${esc(scenario.initialSeverity)}</span>
          <strong>${esc(scenario.title)}</strong>
          <span class="muted">${esc(scenario.id)}</span>
        </div>
      </aside>
      <section class="m01-console-pane m01-console-detail" aria-label="Logs and evidence">
        <p class="m01-console-pane-title">Alert Details</p>
        <dl class="m01-console-meta">
          <div><dt>Entity</dt><dd>${esc(scenario.entity)}</dd></div>
          <div><dt>Detected by</dt><dd>${esc(scenario.detectedBy)}</dd></div>
          <div><dt>Created</dt><dd>${esc(scenario.created)}</dd></div>
        </dl>
        <p class="m01-console-summary">${esc(scenario.summary)}</p>
        ${moduleOneLogTable(scenario, state)}
        ${phoneNote ? `<p class="m01cc-phone-note"><i class="ri-phone-line" aria-hidden="true"></i> ${esc(phoneNote.detail)}</p>` : ''}
      </section>
      <section class="m01-console-pane m01-console-ticket" aria-label="ITSM incident ticket">
        <p class="m01-console-pane-title">ITSM Incident Ticket</p>
        <form id="m01-lab2-form" class="m01-ticket-form">${moduleOneTicketFields(state, { caseId: scenario.id, severityOptions: lab.priorityOptions, dispositionOptions: lab.verdictOptions, disabled: submitted, entitySelects: true,
          userOptions: scenario.entityRoster.users.map((entry) => ({ id: entry.id, text: entry.id })),
          deviceOptions: scenario.entityRoster.devices.map((entry) => ({ id: entry.id, text: entry.id })),
          departmentOptions: lab.departmentOptions })}
          ${caseRecordActions({ submitted, reviewStatus, saveAttr: 'data-m01-save-proveit', submitAttr: 'data-m01-submit-proveit', panelId: 'm01-review-submission', hasMissing: requirements.length > 0 })}
        </form>
        ${moduleOneProveItSubmissionPanel()}
      </section>
    </div>
  </div>`;
}

// LMS-side card only, same rule as Practice It: the console lives in its
// own tab, not embedded here.
function moduleOneReview() {
  return `<div id="m01-review">${moduleOneProveItLaunchCard()}
    <p class="m01-instruction">Work the independent case from the evidence, then document a clear, proportionate handoff.</p>
  </div>`;
}

// Full-bleed Prove It console page — same viewModuleOneCaseConsole()
// pattern, opened via `?console=prove`.
function viewModuleOneProveItCaseConsole(user, program) {
  return `<div class="m01cc-shell" id="m01pc-app">
    <header class="m01cc-topbar">
      <span class="m01cc-topbar-title"><i class="ri-shield-keyhole-line" aria-hidden="true"></i> SECURITY OPERATIONS — CASE CONSOLE</span>
      <a class="m01cc-topbar-close" href="${esc(location.pathname)}#/program/soc-analyst/module/1"><i class="ri-arrow-left-line" aria-hidden="true"></i> Back to Module 1</a>
    </header>
    <main class="m01cc-main" id="m01pc-console-slot">${moduleOneProveItCaseConsolePane()}</main>
  </div>`;
}

function moduleOneRenderReviewDynamic(focusId) {
  const root = document.getElementById('m01pc-console-slot');
  if (!root) return;
  root.innerHTML = moduleOneProveItCaseConsolePane();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
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
 * Guided Lab nest their granular items (moduleOneGetQuickNavItems());
 * the flow/lifecycle/loop companion reading lives inline inside Foundations
 * (see moduleOneLessonCompanion()), not as its own nav section — it has no
 * completion state of its own. Knowledge Check sits between Foundations and
 * Guided Lab (matching every other module's order: read, then prove
 * retention, then do the graded work) — sources is read-only explanatory
 * content — `gated: false` marks it always navigable, excluded from the
 * lock/current-position chain. */
function moduleOneGetNavSections() {
  const progress = moduleOneProgress();
  const quickNavItems = moduleOneGetQuickNavItems();
  return [
    { id: 'foundations', title: 'Foundations', type: 'lecture', isComplete: progress.lessonsComplete === progress.lessonsTotal, scrollId: 'm01-foundations', items: quickNavItems.filter((i) => i.kind === 'lesson') },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: progress.knowledgeCheckComplete, scrollId: 'm01-knowledge-check' },
    { id: 'guided-lab', title: 'Guided Lab', type: 'lab', isComplete: progress.guidedLabComplete, scrollId: 'm01-guided-lab' },
    { id: 'review', title: 'Assessment Lab', type: 'review', isComplete: progress.assessmentLabComplete, scrollId: 'm01-review' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'm01-sources-section', gated: false, supplemental: true },
  ];
}

function viewModuleOne(user, program) {
  moduleOneLoad(user);
  // docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md §2: Module 01's lab opens in its own
  // focused workspace, not embedded in the LMS page. Same route+hash, a
  // `?console=practice` query param — opened in a new tab so this render
  // is a *different* browser tab/window from the LMS page that linked to
  // it, sharing the same session/auth without any new plumbing.
  const consoleParam = new URLSearchParams(location.search).get('console');
  if (consoleParam === 'practice') return viewModuleOneCaseConsole(user, program);
  if (consoleParam === 'prove') return viewModuleOneProveItCaseConsole(user, program);
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const module = program.modules['soc-01'];
  const moduleLabs = LABS.filter((item) => item.module === module.key);
  const moduleLabMinutes = moduleLabs.reduce((total, item) => total + item.instructionalMinutes, 0);
  const sectionOpen = moduleOneState.sectionOpen || {};
  const activeSectionKey = Object.keys(MODULE_ONE_DEFAULT_STATE.sectionOpen).find((key) => key !== 'checklist' && sectionOpen[key] === true) || 'foundations';
  const openFor = (key) => !moduleOneReviewMode && key === activeSectionKey;
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
          <div><dt>Guided Lab</dt><dd id="m01-lab-count">${progress.guidedLabComplete ? 'Complete' : progress.guidedLabStarted ? 'In progress' : 'Not started'}</dd></div>
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
          <div><p class="m01-kicker">Practice It · Guided Lab</p><h2 id="m01-lab-title">Your first SOC alert</h2></div>
          <button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="lab" data-m01-section-label="guided lab" aria-expanded="${openFor('lab')}" aria-controls="m01-guided-lab-body" aria-label="${openFor('lab') ? 'Collapse' : 'Expand'} guided lab">
            <i class="ri-arrow-down-s-line" aria-hidden="true"></i>
          </button>
        </div>
        <div class="m01-lab-body" id="m01-guided-lab-body" ${openFor('lab') ? '' : 'hidden'}>
          <div class="m01-lab-brief">
            <i class="ri-user-star-line" aria-hidden="true"></i>
            <div><strong>Guided practice</strong><p>This coached case is ungraded and retryable. Complete the independent Assessment Lab in Prove It when you are ready.</p></div>
          </div>
          <div id="m01-lab-dynamic">${moduleOneLabDynamic()}</div>
        </div>
      </section>

      <section class="m01-section m01-section-collapsible" id="m01-review-section" aria-labelledby="m01-review-title">
        <div class="m01-section-heading"><span>4</span><div><p class="m01-kicker">Prove It · Assessment Lab</p><h2 id="m01-review-title">Independent alert assessment</h2></div><button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="review" data-m01-section-label="assessment lab" aria-expanded="${openFor('review')}" aria-controls="m01-review-body" aria-label="${openFor('review') ? 'Collapse' : 'Expand'} assessment lab"><i class="ri-arrow-down-s-line" aria-hidden="true"></i></button></div>
        <div class="m01-section-body" id="m01-review-body" ${openFor('review') ? '' : 'hidden'}>${moduleOneReview()}</div>
      </section>

      <!-- Deliberately separate from the numbered 1-4 Learn/Practice/Prove/
           Review flow above: this is reference material, not a graded step,
           so it gets its own card below that sequence rather than a "5". -->
      <section class="m01-section m01-section-collapsible m01-section-supplemental" id="m01-sources-section" aria-labelledby="m01-sources-title">
        <div class="m01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="m01-kicker">Reference — not a graded step</p><h2 id="m01-sources-title">Sources &amp; Further Reading</h2></div><button class="m01-section-collapse" type="button" data-m01-section-toggle data-m01-section-key="sources" data-m01-section-label="sources and further reading" aria-expanded="${openFor('sources')}" aria-controls="m01-sources-body" aria-label="${openFor('sources') ? 'Collapse' : 'Expand'} sources and further reading"><i class="ri-arrow-down-s-line" aria-hidden="true"></i></button></div>
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
    if (event.target.closest('[data-m01-quiz-retake]')) {
      event.preventDefault();
      moduleOneQuizForceRetake = true;
      moduleOneRenderQuiz('m01-quiz-title');
      return;
    }
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

// Case console wiring (docs/specs/MODULE_01_CASE_CONSOLE_SPEC.md). Scoped to its own
// #m01cc-app root, called from wireModuleOneLab() below — that function
// runs on every render (module-registry.js's wireRegisteredModuleLabs()),
// so this is a no-op whenever the console page isn't the current render.
function wireModuleOneCaseConsole() {
  const root = document.getElementById('m01cc-app');
  if (!root) return;
  const lab = MODULE_ONE_ALERT_ORIENTATION;
  const scenario = lab.scenario;

  function rerender(focusId) {
    const slot = document.getElementById('m01cc-console-slot');
    if (slot) slot.innerHTML = moduleOneCaseConsolePane();
    if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m01cc-console-launch]')) {
      moduleOneState.consoleStarted = true;
      moduleOneState.practice.actionHistory.push({ action: 'Opened assigned alert', at: new Date().toISOString() });
      moduleOneSave(); rerender(); return;
    }

    const pageBtn = event.target.closest('[data-m01cc-log-page]');
    if (pageBtn) {
      const nextPage = Number(pageBtn.dataset.m01ccLogPage);
      if (Number.isFinite(nextPage) && nextPage >= 1) {
        moduleOneState.practice.logPage = nextPage;
        moduleOneSave(); rerender();
      }
      return;
    }

    const logRow = event.target.closest('[data-m01cc-log-row]');
    if (logRow) {
      const id = logRow.dataset.m01ccLogRow;
      const row = scenario.logEvents.find((item) => item.id === id);
      if (!row) return;
      const state = moduleOneState.practice;
      state.expandedLogId = state.expandedLogId === id ? null : id;
      if (!state.viewedLogIds.includes(id)) {
        state.viewedLogIds.push(id);
        state.actionHistory.push({ action: `Opened log record ${id} (${row.time})`, at: new Date().toISOString() });
        if (row.evidenceId && !moduleOneState.reviewedEvidence.includes(row.evidenceId)) {
          moduleOneState.reviewedEvidence.push(row.evidenceId);
        }
      }
      moduleOneSave(); rerender(); return;
    }

    const entity = event.target.closest('#m01-practice-form [data-m01-entity]');
    if (entity) {
      const field = entity.dataset.m01Entity === 'user' ? 'affectedUser' : 'affectedDevice';
      moduleOneState.practice[field] = field === 'affectedUser' ? 'j.santos' : 'WKS-14';
      moduleOneState.practice.actionHistory.push({ action: `Added affected ${entity.dataset.m01Entity}`, at: new Date().toISOString() });
      moduleOneSave(); rerender(); return;
    }

    if (event.target.closest('[data-m01-practice-save]')) {
      moduleOneState.practice.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleOneSave(); rerender(); return;
    }

    if (event.target.closest('[data-m01-practice-check]')) {
      const practice = moduleOneState.practice;
      const missing = !moduleOneState.reviewedEvidence.length || !practice.affectedUser || !practice.affectedDevice
        || !practice.priority || !practice.verdict || !practice.escalation
        || (practice.escalation === 'required' && !practice.escalateTo) || !(practice.notes || '').trim();
      moduleOneState.validationError = missing
        ? 'Keep working the case: open the log, add both affected entities, set the ticket fields, and leave a work note.'
        : '';
      if (!missing) {
        moduleOneState.completed = true;
        moduleOneState.consoleCompleted = true;
        practice.actionHistory.push({ action: 'Submitted case', at: new Date().toISOString() });
        if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
        moduleOneSyncCompletion();
        window.opener?.postMessage({ type: 'm01-guided-lab-complete' }, location.origin);
      }
      moduleOneSave(); rerender('m01cc-feedback');
      return;
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m01-practice-form') && ['status', 'severity', 'disposition', 'escalation', 'escalateTo'].includes(input.name)) {
      const key = input.name === 'severity' ? 'priority' : input.name === 'disposition' ? 'verdict' : input.name;
      moduleOneState.practice[key] = input.value;
      if (input.name === 'severity') moduleOneState.practice.severity = input.value;
      if (input.name === 'disposition') moduleOneState.practice.disposition = input.value;
      moduleOneState.practice.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleOneSave(); rerender();
    }
  });

  root.addEventListener('input', (event) => {
    const field = event.target;
    if (field.tagName === 'TEXTAREA' && field.name === 'notes') {
      moduleOneState.practice.notes = field.value;
      moduleOneSave();
    }
  });
}

// Prove It's console wiring — same pattern as wireModuleOneCaseConsole(),
// scoped to its own #m01pc-app root (the Prove It case console page).
function wireModuleOneProveItCaseConsole() {
  const root = document.getElementById('m01pc-app');
  if (!root) return;
  const lab = MODULE_ONE_ESCALATION_LAB;
  const scenario = lab.scenario;

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-m01-submit-proveit]')) { moduleOneFinalizeProveIt(); return; }
    if (event.target.closest('[data-m01-save-proveit]')) {
      moduleOneState.lab2.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleOneSave(); moduleOneRenderReviewDynamic(); return;
    }

    const pageBtn = event.target.closest('[data-m01cc-log-page]');
    if (pageBtn) {
      const nextPage = Number(pageBtn.dataset.m01ccLogPage);
      if (Number.isFinite(nextPage) && nextPage >= 1) {
        moduleOneState.lab2.logPage = nextPage;
        moduleOneSave(); moduleOneRenderReviewDynamic();
      }
      return;
    }

    const logRow = event.target.closest('[data-m01cc-log-row]');
    if (logRow) {
      const id = logRow.dataset.m01ccLogRow;
      const row = scenario.logEvents.find((item) => item.id === id);
      if (!row) return;
      const state = moduleOneState.lab2;
      state.expandedLogId = state.expandedLogId === id ? null : id;
      if (!state.viewedLogIds.includes(id)) {
        state.viewedLogIds.push(id);
        state.actionHistory.push({ action: `Opened log record ${id} (${row.time})`, at: new Date().toISOString() });
        if (row.evidenceId && !state.reviewedEvidence.includes(row.evidenceId)) {
          state.reviewedEvidence.push(row.evidenceId);
        }
      }
      moduleOneSave(); moduleOneRenderReviewDynamic(); return;
    }

    const entity = event.target.closest('[data-m01-entity]');
    if (entity && !moduleOneState.lab2.submitted) {
      const field = entity.dataset.m01Entity === 'user' ? 'affectedUser' : 'affectedDevice';
      moduleOneState.lab2[field] = field === 'affectedUser' ? 'a.chen' : 'LAP-442';
      moduleOneState.lab2.intake = moduleOneState.lab2.affectedUser && moduleOneState.lab2.affectedDevice ? 'identity-and-laptop' : '';
      moduleOneState.lab2.actionHistory.push({ action: `Added affected ${entity.dataset.m01Entity}`, at: new Date().toISOString() });
      moduleOneSave(); moduleOneRenderReviewDynamic();
    }
  });
  root.addEventListener('change', (event) => {
    const input = event.target;
    if (['status', 'severity', 'affectedUser', 'affectedDevice', 'disposition', 'escalation', 'escalateTo'].includes(input.name)) {
      const key = input.name === 'severity' ? 'priority' : input.name === 'disposition' ? 'verdict' : input.name;
      moduleOneState.lab2[key] = input.value;
      if (input.name === 'severity') moduleOneState.lab2.severity = input.value;
      if (input.name === 'disposition') moduleOneState.lab2.disposition = input.value;
      if (input.name === 'affectedUser' || input.name === 'affectedDevice') {
        moduleOneState.lab2.intake = moduleOneState.lab2.affectedUser && moduleOneState.lab2.affectedDevice ? 'identity-and-laptop' : '';
      }
      moduleOneState.lab2.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleOneSave();
      // Keep the "still required" checklist and submit gating honest —
      // a discrete radio pick, unlike typing, is safe to re-render on.
      moduleOneRenderReviewDynamic();
    }
  });
  root.addEventListener('input', (event) => {
    const field = event.target;
    if (field.tagName === 'TEXTAREA' && field.name === 'notes') {
      moduleOneState.lab2.notes = field.value;
      moduleOneSave();
    }
  });
}

function wireModuleOneLab() {
  wireModuleOneCaseConsole();
  wireModuleOneProveItCaseConsole();
  if (document.getElementById('m01cc-app') || document.getElementById('m01pc-app')) return;
  window.addEventListener('message', (event) => {
    if (event.origin === location.origin && event.data?.type === 'm01-guided-lab-complete') location.reload();
  });
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
        Object.keys(moduleOneState.sectionOpen).forEach((key) => { moduleOneState.sectionOpen[key] = false; });
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
    if (event.target.closest('[data-m01-console-launch]')) {
      moduleOneState.consoleStarted = true;
      moduleOneSave();
      moduleOneRenderDynamic('m01-console-practice-title');
      return;
    }

    const practiceEvidence = event.target.closest('[data-m01-practice-evidence]');
    if (practiceEvidence) {
      const id = practiceEvidence.dataset.m01PracticeEvidence;
      if (!moduleOneState.reviewedEvidence.includes(id)) {
        moduleOneState.reviewedEvidence.push(id);
        moduleOneState.practice.actionHistory.push({ action: `Reviewed evidence: ${id}`, at: new Date().toISOString() });
      }
      moduleOneSave(); moduleOneRenderDynamic(); return;
    }

    const practiceEntity = event.target.closest('#m01-practice-form [data-m01-entity]');
    if (practiceEntity) {
      const field = practiceEntity.dataset.m01Entity === 'user' ? 'affectedUser' : 'affectedDevice';
      moduleOneState.practice[field] = field === 'affectedUser' ? 'j.santos' : 'No device linked';
      moduleOneState.practice.actionHistory.push({ action: `Added affected ${practiceEntity.dataset.m01Entity}`, at: new Date().toISOString() });
      moduleOneSave(); moduleOneRenderDynamic(); return;
    }

    if (event.target.closest('[data-m01-practice-save]')) {
      moduleOneState.practice.actionHistory.push({ action: 'Saved case', at: new Date().toISOString() });
      moduleOneSave(); return;
    }

    if (event.target.closest('[data-m01-practice-check]')) {
      const practice = moduleOneState.practice;
      const missing = !moduleOneState.reviewedEvidence.length || !practice.affectedUser || !practice.affectedDevice || !practice.priority || !practice.verdict || !practice.escalation || !(practice.notes || '').trim();
      moduleOneState.validationError = missing ? 'Keep working the case: review evidence, add both affected entities, set the ticket fields, and leave a work note.' : 'Coaching check complete. Your ticket records an evidence-based decision; compare your choices with the hint text as you continue practicing.';
      moduleOneSave(); moduleOneRenderDynamic('m01-feedback'); return;
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
      moduleOneState = LabRuntime.resetCaseState(MODULE_ONE_LAB_ID, 'soc-01', moduleOneUser, MODULE_ONE_DEFAULT_STATE);
      if (typeof markModuleLabComplete === 'function') {
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY, false);
        markModuleLabComplete(moduleOneUser, 'soc-analyst', 'soc-01', 'lab-soc-escalation', false);
      }
      moduleOneRenderDynamic('m01-scenario-title');
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.closest('#m01-practice-form') && ['status', 'severity', 'disposition', 'escalation', 'escalateTo'].includes(input.name)) {
      const key = input.name === 'severity' ? 'priority' : input.name === 'disposition' ? 'verdict' : input.name;
      moduleOneState.practice[key] = input.value;
      if (input.name === 'severity') moduleOneState.practice.severity = input.value;
      if (input.name === 'disposition') moduleOneState.practice.disposition = input.value;
      moduleOneState.practice.actionHistory.push({ action: `Updated ${input.name}`, at: new Date().toISOString() });
      moduleOneSave(); moduleOneRenderDynamic(); return;
    }
    if (['verdict', 'priority', 'phase', 'decision'].includes(input.name)) {
      moduleOneState[input.name] = input.value;
      moduleOneState.validationError = '';
      moduleOneSave();
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.closest('#m01-practice-form') && event.target.name === 'notes') {
      moduleOneState.practice.notes = event.target.value;
      moduleOneSave(); return;
    }
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
      // Coached practice, not the graded artifact — no recordLabAttempt here.
      // Sending this to the faculty grading queue would recreate exactly the
      // "two things need review" problem Prove It is meant to avoid; only
      // Prove It's submission (moduleOneFinalizeProveIt) goes to faculty.
      const passed = result.score >= MODULE_ONE_ALERT_ORIENTATION.passingScore;
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

  const saved = LabRuntime.loadCaseState(MODULE_ONE_LAB_ID, 'soc-01', user, MODULE_ONE_DEFAULT_STATE);
  saved.consoleStarted = true;
  saved.consoleCompleted = true;
  moduleOneState = saved;
  moduleOneUser = user;
  moduleOneSave();

  if (saved.completed && typeof markModuleLabComplete === 'function') {
    markModuleLabComplete(user, 'soc-analyst', 'soc-01', MODULE_ONE_CATALOG_LAB_KEY);
  }

  // Bare completion signal — no score attached (the postMessage contract
  // carries only a completion flag; see docs/specs/architecture.md §3 Sprint 3). This is
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

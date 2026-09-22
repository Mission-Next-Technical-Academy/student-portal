/* Shared, local-only state helpers for isolated course labs.
 *
 * Labs keep their own storage record so resetting one exercise cannot erase
 * course progress or another module's work. The identifier is a stable hash of
 * the local demo account; the account value itself is never written to the lab
 * record or synthetic telemetry.
 */

const LabRuntime = (() => {
  const PREFIX = 'mnt-portal.lab-state.v1';
  const CASE_STATE_DEBOUNCE_MS = 1500;
  const pendingCaseStateWrites = new Map();
  let caseStateFlushListenersRegistered = false;

  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function anonymousStudentId(user) {
    const localIdentity = user && (user.email || user.username) ? (user.email || user.username) : 'local-learner';
    return `student-${hashText(`mission-next:${localIdentity}`)}`;
  }

  function storageKey(labId, user) {
    return `${PREFIX}.${labId}.${anonymousStudentId(user)}`;
  }

  function cloneDefaults(defaults) {
    if (!defaults || typeof defaults !== 'object') return {};
    try {
      return typeof structuredClone === 'function' ? structuredClone(defaults) : JSON.parse(JSON.stringify(defaults));
    } catch (_) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function freshState(labId, user, defaults) {
    return {
      anonymousStudentId: anonymousStudentId(user),
      labId,
      attempts: 0,
      selectedEvidence: [],
      notes: '',
      score: 0,
      bestScore: 0,
      flags: [],
      completed: false,
      ...cloneDefaults(defaults),
    };
  }

  function load(labId, user, defaults = {}) {
    const fresh = freshState(labId, user, defaults);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(labId, user)) || 'null');
      if (!saved || saved.labId !== labId || saved.anonymousStudentId !== fresh.anonymousStudentId) return fresh;
      return { ...fresh, ...saved };
    } catch (_) {
      return fresh;
    }
  }

  function save(labId, user, state) {
    localStorage.setItem(storageKey(labId, user), JSON.stringify(state));
    return state;
  }

  function reset(labId, user, defaults = {}) {
    const fresh = freshState(labId, user, defaults);
    localStorage.setItem(storageKey(labId, user), JSON.stringify(fresh));
    return fresh;
  }

  function stateMatchesFreshDefault(labId, user, state, defaults) {
    return JSON.stringify(state) === JSON.stringify(freshState(labId, user, defaults));
  }

  function loadCaseState(labId, moduleKey, user, defaults = {}) {
    const localState = load(labId, user, defaults);
    const remoteState = user && user.remoteCaseState && user.remoteCaseState[moduleKey];
    const remoteHasState = remoteState && typeof remoteState === 'object' && !Array.isArray(remoteState)
      && Object.keys(remoteState).length > 0;

    // V1 intentionally uses an empty-local-defers-to-remote merge, not
    // timestamps or CRDT reconciliation: one student effectively works from
    // one active device at a time in practice, so that complexity is not yet
    // justified. Concurrent, independently-progressed devices can conflict.
    if (stateMatchesFreshDefault(labId, user, localState, defaults) && remoteHasState) {
      const hydratedState = { ...localState, ...remoteState };
      save(labId, user, hydratedState);
      return hydratedState;
    }
    return localState;
  }

  function pendingCaseStateKey(labId, moduleKey, user) {
    return `${storageKey(labId, user)}.${moduleKey}`;
  }

  function flushCaseStateWrite(key) {
    const pending = pendingCaseStateWrites.get(key);
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    pendingCaseStateWrites.delete(key);
    upsertModuleProgress(pending.user, pending.moduleKey, { case_state: pending.state });
  }

  function flushAllCaseStateWrites() {
    Array.from(pendingCaseStateWrites.keys()).forEach(flushCaseStateWrite);
  }

  function registerCaseStateFlushListeners() {
    if (caseStateFlushListenersRegistered || typeof window === 'undefined' || typeof document === 'undefined') return;
    caseStateFlushListenersRegistered = true;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flushAllCaseStateWrites();
    });
    window.addEventListener('beforeunload', flushAllCaseStateWrites);
  }

  function saveCaseState(labId, moduleKey, user, state, options = {}) {
    save(labId, user, state);
    registerCaseStateFlushListeners();

    const key = pendingCaseStateKey(labId, moduleKey, user);
    const existing = pendingCaseStateWrites.get(key);
    if (existing && existing.timer) clearTimeout(existing.timer);
    const pending = { user, moduleKey, state, timer: null };
    pending.timer = setTimeout(() => flushCaseStateWrite(key), options.debounceMs || CASE_STATE_DEBOUNCE_MS);
    pendingCaseStateWrites.set(key, pending);
    return state;
  }

  return { anonymousStudentId, load, save, reset, storageKey, loadCaseState, saveCaseState };
})();

/* Shared mechanics for the knowledge checks used by SOC modules. Question
 * banks, selection rules, scoring, and pass thresholds stay in each module;
 * this only owns the identical transient attempt shape and retry reset. */
function createQuizAttempt(questionPool, options = {}) {
  const selection = selectQuizQuestions(questionPool, options);
  return {
    selectedQuestions: selection.selectedQuestions,
    questionsByAnswer: selection.questionsByAnswer,
    answers: {},
    scored: false,
    attempts: options.attempts || 0,
    score: 0,
    bestScore: options.bestScore || 0,
    feedback: [],
    passed: false,
  };
}

function resetQuizAttempt(previousState, questionPool, options = {}) {
  const { preserveScoredResult = false, ...selectionOptions } = options;
  const nextAttempt = createQuizAttempt(questionPool, {
    ...selectionOptions,
    attempts: previousState && previousState.attempts,
    bestScore: previousState && previousState.bestScore,
  });
  // Modules 02–04 historically retained the last scored result in memory
  // until the next submission, even though it was hidden by `scored: false`.
  // Preserve that state contract while sharing selection/reset mechanics.
  if (preserveScoredResult) {
    return {
      ...previousState,
      selectedQuestions: nextAttempt.selectedQuestions,
      questionsByAnswer: nextAttempt.questionsByAnswer,
      answers: {},
      scored: false,
    };
  }
  return nextAttempt;
}

/* Each module supplies its own state owner and presentation details. This
 * helper deliberately changes only the repeated DOM toggle mechanics. */
function wireReviewToggle({ button, sectionSelector, getReviewMode, setReviewMode, enabledLabel, disabledLabel, enabledIcon, disabledIcon }) {
  if (!button) return;
  button.addEventListener('click', () => {
    const isOpen = !getReviewMode();
    setReviewMode(isOpen);
    document.querySelectorAll(sectionSelector).forEach((details) => { details.open = isOpen; });
    button.setAttribute('aria-pressed', String(isOpen));
    const icon = button.querySelector('i');
    if (icon) icon.className = isOpen ? enabledIcon : disabledIcon;
    const label = button.querySelector('span');
    if (label) label.textContent = isOpen ? enabledLabel : disabledLabel;
  });
}

/* Shared score-section rendering for every module's independent-lab result
 * panel. Every module's score function already returns a named breakdown
 * (observation/analysis/decision/communication, or Module 12's own labeled
 * array) — this only makes that existing breakdown visible instead of a
 * flat number. See soc-analyst-track-reimagining/REBUILD_PLAN.md Phase 1b. */
const LAB_SCORE_SECTION_ORDER = ['observation', 'analysis', 'decision', 'communication'];
const LAB_SCORE_SECTION_LABELS = { observation: 'Observation', analysis: 'Analysis', decision: 'Decision', communication: 'Communication' };

function renderLabScoreSections(result) {
  if (!result || typeof result !== 'object') return '';
  const breakdown = result.breakdown;
  let sections = [];
  if (Array.isArray(breakdown)) {
    sections = breakdown
      .filter((item) => item && typeof item === 'object' && 'label' in item)
      .map((item) => ({ label: String(item.label), value: item.score }));
  } else if (breakdown && typeof breakdown === 'object') {
    sections = LAB_SCORE_SECTION_ORDER
      .filter((key) => key in breakdown)
      .map((key) => ({ label: LAB_SCORE_SECTION_LABELS[key], value: breakdown[key] }));
  }
  const feedback = Array.isArray(result.feedback) ? result.feedback.filter((item) => typeof item === 'string' && item.trim()) : [];
  if (!sections.length && !feedback.length) return '';
  const sectionsHtml = sections.length ? `<dl class="lab-score-sections grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">${sections.map((section) => `<div class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"><dt class="text-xs text-gray-500">${esc(section.label)}</dt><dd class="text-lg font-semibold text-[#1e3a5f]">${esc(String(section.value))}</dd></div>`).join('')}</dl>` : '';
  const feedbackHtml = feedback.length ? `<ul class="lab-score-feedback list-disc space-y-1 pl-5 text-sm text-gray-600">${feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
  return `<div class="lab-score-breakdown mt-3 mb-1">${sectionsHtml}${feedbackHtml}</div>`;
}

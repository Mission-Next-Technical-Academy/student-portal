// ============================================================
//  Progress Extensions
// ============================================================
//  Augments the existing progress functions in src/data.js with
//  per-step attempt tracking and Check-on-Learning responses.
//  Storage key: `mission_next_progress_ext` (keeps base progress backward
//  compatible with check.mjs assertions).
//
//  Per-user shape:
//   {
//     [labId]: {
//       stepAttempts: {
//         [stepId]: { count, lastSubmitted, lastResult, firstCorrectAt, hintsShown }
//       },
//       colResponses: {
//         [colQuestionId]: { passed, attempts, lastResponse, answeredAt }
//       },
//       lastInteractionAt: ISO timestamp
//     }
//   }
// ============================================================

(function () {
  const STORE_KEY = 'mission_next_progress_ext';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveAll(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (_) { /* private browsing or quota — best-effort */ }
  }

  function ensureUserLab(state, username, labId) {
    if (!state[username]) state[username] = {};
    if (!state[username][labId]) {
      state[username][labId] = { stepAttempts: {}, colResponses: {}, lastInteractionAt: null };
    }
    if (!state[username][labId].stepAttempts) state[username][labId].stepAttempts = {};
    if (!state[username][labId].colResponses) state[username][labId].colResponses = {};
    return state[username][labId];
  }

  function markStepAttempt(username, labId, stepId, submitted, correct) {
    if (!username || !labId || !stepId) return;
    const state = loadAll();
    const entry = ensureUserLab(state, username, labId);
    const att = entry.stepAttempts[stepId] || { count: 0, lastSubmitted: null, lastResult: null, firstCorrectAt: null, hintsShown: 0 };
    att.count += 1;
    att.lastSubmitted = String(submitted == null ? '' : submitted);
    att.lastResult = correct ? 'correct' : 'incorrect';
    if (correct && !att.firstCorrectAt) att.firstCorrectAt = new Date().toISOString();
    entry.stepAttempts[stepId] = att;
    entry.lastInteractionAt = new Date().toISOString();
    saveAll(state);
    return att;
  }

  function recordHintShown(username, labId, stepId) {
    if (!username || !labId || !stepId) return;
    const state = loadAll();
    const entry = ensureUserLab(state, username, labId);
    const att = entry.stepAttempts[stepId] || { count: 0, lastSubmitted: null, lastResult: null, firstCorrectAt: null, hintsShown: 0 };
    att.hintsShown += 1;
    entry.stepAttempts[stepId] = att;
    entry.lastInteractionAt = new Date().toISOString();
    saveAll(state);
    return att.hintsShown;
  }

  function getStepAttempts(username, labId, stepId) {
    const state = loadAll();
    return (state[username] && state[username][labId] && state[username][labId].stepAttempts && state[username][labId].stepAttempts[stepId]) || null;
  }

  function markCheckpointResponse(username, labId, colId, passed, response) {
    if (!username || !labId || !colId) return;
    const state = loadAll();
    const entry = ensureUserLab(state, username, labId);
    const cur = entry.colResponses[colId] || { passed: false, attempts: 0, lastResponse: null, answeredAt: null };
    cur.attempts += 1;
    cur.lastResponse = response == null ? null : response;
    cur.answeredAt = new Date().toISOString();
    if (passed) cur.passed = true;
    entry.colResponses[colId] = cur;
    entry.lastInteractionAt = new Date().toISOString();
    saveAll(state);
    return cur;
  }

  function getCheckpointResponses(username, labId) {
    const state = loadAll();
    return (state[username] && state[username][labId] && state[username][labId].colResponses) || {};
  }

  function getLabExtended(username, labId) {
    const state = loadAll();
    return (state[username] && state[username][labId]) || null;
  }

  function getAllForUser(username) {
    const state = loadAll();
    return state[username] || {};
  }

  function resetUser(username) {
    if (!username) return;
    const state = loadAll();
    delete state[username];
    saveAll(state);
  }

  function resetAllStudents(usernames) {
    const state = loadAll();
    if (Array.isArray(usernames)) {
      for (const u of usernames) delete state[u];
    } else {
      // wipe everything
      for (const u of Object.keys(state)) delete state[u];
    }
    saveAll(state);
  }

  Object.assign(window, {
    MISSION_NEXT_PROGRESS_EXT: {
      markStepAttempt,
      recordHintShown,
      getStepAttempts,
      markCheckpointResponse,
      getCheckpointResponses,
      getLabExtended,
      getAllForUser,
      resetUser,
      resetAllStudents,
    },
  });
})();

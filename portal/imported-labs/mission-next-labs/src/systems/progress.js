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
  const moduleParam = String(window.location?.search || '').match(/[?&]mntModule=([^&]+)/);
  const COURSE_MODULE = moduleParam ? decodeURIComponent(moduleParam[1]) : '';
  const COURSE_STATE_PREFIX = 'imported-lab-progress:';
  const pendingCourseWrites = new Map();
  const courseWriteQueues = new Map();

  function validCourseModule(value) { return /^soc-(0[1-9]|1[0-2])$/.test(value || '') ? value : null; }
  async function courseStudent() {
    const moduleKey = validCourseModule(COURSE_MODULE);
    if (!moduleKey || typeof mntSupabase === 'undefined') return null;
    const { data: auth, error: authError } = await mntSupabase.auth.getUser();
    if (authError || !auth?.user) return null;
    const { data: student, error } = await mntSupabase.from('students')
      .select('track_code').eq('user_id', auth.user.id).maybeSingle();
    return !error && student?.track_code === 'SOCAN'
      ? { userId: auth.user.id, trackCode: student.track_code, moduleKey } : null;
  }
  function mergeLabProgress(local = {}, remote = {}) {
    const merged = { ...remote, ...local, stepAttempts: { ...(remote.stepAttempts || {}) }, colResponses: { ...(remote.colResponses || {}) } };
    Object.entries(local.stepAttempts || {}).forEach(([id, attempt]) => {
      const prior = merged.stepAttempts[id] || {};
      merged.stepAttempts[id] = {
        ...prior, ...attempt,
        count: Math.max(prior.count || 0, attempt.count || 0),
        hintsShown: Math.max(prior.hintsShown || 0, attempt.hintsShown || 0),
        firstCorrectAt: prior.firstCorrectAt || attempt.firstCorrectAt || null,
      };
    });
    Object.entries(local.colResponses || {}).forEach(([id, answer]) => {
      const prior = merged.colResponses[id] || {};
      const answerAt = Date.parse(answer.answeredAt || 0) || 0;
      const priorAt = Date.parse(prior.answeredAt || 0) || 0;
      merged.colResponses[id] = {
        ...(answerAt >= priorAt ? answer : prior),
        passed: Boolean(answer.passed || prior.passed),
        attempts: Math.max(answer.attempts || 0, prior.attempts || 0),
      };
    });
    merged.lastInteractionAt = [local.lastInteractionAt, remote.lastInteractionAt].filter(Boolean).sort().at(-1) || null;
    return merged;
  }
  async function hydrateCourseLab(username, labId) {
    const context = await courseStudent();
    if (!context || !username || !labId) return null;
    const { data: row, error } = await mntSupabase.from('module_progress').select('case_state')
      .eq('user_id', context.userId).eq('track_code', context.trackCode).eq('module_key', context.moduleKey).maybeSingle();
    if (error) { console.error('Imported lab progress read failed', labId, error); return null; }
    const remote = row?.case_state?.[`${COURSE_STATE_PREFIX}${labId}`];
    if (!remote) return null;
    const all = loadAll();
    const merged = mergeLabProgress(all[username]?.[labId] || {}, remote);
    ensureUserLab(all, username, labId);
    all[username][labId] = merged;
    saveAll(all);
    return merged;
  }
  function persistCourseLab(username, labId, state) {
    const debounceKey = `${username}:${labId}`;
    clearTimeout(pendingCourseWrites.get(debounceKey));
    pendingCourseWrites.set(debounceKey, setTimeout(async () => {
      pendingCourseWrites.delete(debounceKey);
      const context = await courseStudent();
      if (!context) return;
      const queueKey = `${context.userId}:${context.moduleKey}`;
      const previous = courseWriteQueues.get(queueKey) || Promise.resolve();
      const write = previous.catch(() => {}).then(async () => {
        const { data: row, error: readError } = await mntSupabase.from('module_progress').select('case_state')
          .eq('user_id', context.userId).eq('track_code', context.trackCode).eq('module_key', context.moduleKey).maybeSingle();
        if (readError) throw readError;
        const caseState = { ...(row?.case_state || {}), [`${COURSE_STATE_PREFIX}${labId}`]: state };
        const result = row
          ? await mntSupabase.from('module_progress').update({ case_state: caseState })
              .eq('user_id', context.userId).eq('track_code', context.trackCode).eq('module_key', context.moduleKey)
          : await mntSupabase.from('module_progress').insert({ user_id: context.userId,
              track_code: context.trackCode, module_key: context.moduleKey, state: 'in_progress', case_state: caseState });
        if (result.error) throw result.error;
      }).catch((error) => console.error('Imported lab progress write failed', labId, error));
      courseWriteQueues.set(queueKey, write);
    }, 250));
  }

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function saveAll(state, username, labId) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (_) { /* private browsing or quota — best-effort */ }
    if (username && labId && state?.[username]?.[labId]) persistCourseLab(username, labId, state[username][labId]);
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
    saveAll(state, username, labId);
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
    saveAll(state, username, labId);
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
    saveAll(state, username, labId);
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

  function markCourseLabComplete(username, labId, completedAt = new Date().toISOString()) {
    if (!username || !labId) return;
    const state = loadAll();
    const entry = ensureUserLab(state, username, labId);
    entry.completedAt = entry.completedAt || completedAt;
    entry.lastInteractionAt = completedAt;
    saveAll(state, username, labId);
    return entry.completedAt;
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
      hydrateCourseLab,
      markCourseLabComplete,
      getAllForUser,
      resetUser,
      resetAllStudents,
    },
  });
})();

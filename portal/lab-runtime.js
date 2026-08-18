/* Shared, local-only state helpers for isolated course labs.
 *
 * Labs keep their own storage record so resetting one exercise cannot erase
 * course progress or another module's work. The identifier is a stable hash of
 * the local demo account; the account value itself is never written to the lab
 * record or synthetic telemetry.
 */

const LabRuntime = (() => {
  const PREFIX = 'mnt-portal.lab-state.v1';

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

  return { anonymousStudentId, load, save, reset, storageKey };
})();

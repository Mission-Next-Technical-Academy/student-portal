// ============================================================
//  Forward-Only Step Gating
// ============================================================
//  Enforces that a lab's steps are completed in order. A step
//  is unlocked only when all of its `requires` step ids are
//  completed. By default, each step requires the previous step
//  in its exercise.
// ============================================================

(function () {
  function flattenSteps(lab) {
    const out = [];
    if (!lab || !Array.isArray(lab.exercises)) return out;
    for (const ex of lab.exercises) {
      if (!Array.isArray(ex.steps)) continue;
      for (const s of ex.steps) out.push(s);
    }
    return out;
  }

  // Compute the implicit `requires` for a step: previous step in the same exercise,
  // unless the step explicitly declares its own `requires` array (which wins).
  function effectiveRequires(lab, stepId) {
    const flat = flattenSteps(lab);
    const idx = flat.findIndex(s => s.id === stepId);
    if (idx < 0) return [];
    const step = flat[idx];
    if (Array.isArray(step.requires) && step.requires.length > 0) return step.requires.slice();
    if (idx === 0) return [];
    return [flat[idx - 1].id];
  }

  function isStepUnlocked(lab, stepId, completedSet) {
    const set = completedSet instanceof Set ? completedSet : new Set(completedSet || []);
    const reqs = effectiveRequires(lab, stepId);
    return reqs.every(id => set.has(id));
  }

  function nextUnlockedStep(lab, completedSet) {
    const set = completedSet instanceof Set ? completedSet : new Set(completedSet || []);
    const flat = flattenSteps(lab);
    for (const step of flat) {
      if (set.has(step.id)) continue;
      if (isStepUnlocked(lab, step.id, set)) return step;
    }
    return null;
  }

  function progressPct(lab, completedSet) {
    const set = completedSet instanceof Set ? completedSet : new Set(completedSet || []);
    const flat = flattenSteps(lab);
    if (flat.length === 0) return 0;
    let done = 0;
    for (const s of flat) if (set.has(s.id)) done++;
    return Math.round((done / flat.length) * 100);
  }

  function isLabComplete(lab, completedSet) {
    const set = completedSet instanceof Set ? completedSet : new Set(completedSet || []);
    const flat = flattenSteps(lab);
    return flat.length > 0 && flat.every(s => set.has(s.id));
  }

  Object.assign(window, {
    B2B_GATING: {
      flattenSteps,
      effectiveRequires,
      isStepUnlocked,
      nextUnlockedStep,
      progressPct,
      isLabComplete,
    },
  });
})();

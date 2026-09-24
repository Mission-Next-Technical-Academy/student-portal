// ============================================================
//  Step Validator
// ============================================================
//  Evaluates a step's validation predicate against simulator
//  state and the user's submission. Returns { ok, reason }.
//  Predicate types: see BUILD_PLAN.md §1.6.1.
// ============================================================

(function () {
  function getByPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function inputMatches(submission, accepted) {
    if (!Array.isArray(accepted) || accepted.length === 0) return true;
    const s = String(submission == null ? '' : submission);
    for (const a of accepted) {
      if (!a || !a.type) continue;
      if (a.type === 'exact' && s === String(a.value)) return true;
      if (a.type === 'startsWith' && s.startsWith(String(a.value))) return true;
      if (a.type === 'contains' && s.includes(String(a.value))) return true;
      if (a.type === 'regex') {
        const re = a.value instanceof RegExp ? a.value : new RegExp(a.value);
        if (re.test(s)) return true;
      }
    }
    return false;
  }

  // Each predicate returns { ok, reason }.
  const predicates = {
    commandExecuted(step, simState, submission) {
      // submission is the typed command line.
      if (!inputMatches(submission, step.acceptedInputs)) {
        return { ok: false, reason: 'Command does not match accepted input shape.' };
      }
      const want = step.validation.requires || [];
      for (const req of want) {
        const val = getByPath(simState, req);
        if (val == null || val === false) {
          return { ok: false, reason: `Required state not satisfied: ${req}` };
        }
      }
      return { ok: true };
    },

    uiPath(step, simState) {
      const required = (step.validation && step.validation.value) || step.validation.expected;
      if (!Array.isArray(required) || required.length === 0) return { ok: false, reason: 'uiPath validation has no expected sequence.' };
      const visited = (simState && simState.uiPath) || [];
      for (const seg of required) {
        if (!visited.includes(seg)) return { ok: false, reason: `UI step missing: ${seg}` };
      }
      return { ok: true };
    },

    stateEquals(step, simState) {
      const v = step.validation;
      const got = getByPath(simState, v.field || v.path);
      const expected = v.expected != null ? v.expected : v.value;
      if (got !== expected) return { ok: false, reason: `state ${v.field || v.path} = ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}` };
      return { ok: true };
    },

    valueExtracted(step, simState, submission) {
      const v = step.validation;
      const expected = v.expected != null ? v.expected : v.value;
      const sub = String(submission == null ? '' : submission).trim();
      if (Array.isArray(expected)) {
        if (expected.some(e => sub === String(e).trim())) return { ok: true };
        return { ok: false, reason: 'Submitted value did not match any accepted answer.' };
      }
      if (expected instanceof RegExp) {
        return expected.test(sub) ? { ok: true } : { ok: false, reason: 'Submitted value did not match regex.' };
      }
      if (sub === String(expected).trim()) return { ok: true };
      return { ok: false, reason: `Submitted '${sub}', expected '${expected}'.` };
    },

    fileCreated(step, simState) {
      const v = step.validation;
      const fname = v.value || v.expected;
      if (!fname) return { ok: false, reason: 'fileCreated validation missing filename.' };
      const created = (simState && simState.savedFiles) || {};
      if (created[fname]) return { ok: true };
      // also accept paths via vfs
      if (simState && simState.vfs && typeof simState.vfs.exists === 'function' && simState.vfs.exists(fname)) {
        return { ok: true };
      }
      return { ok: false, reason: `File not yet created: ${fname}` };
    },

    serviceState(step, simState) {
      const v = step.validation;
      const name = v.field || v.service;
      const expected = v.expected != null ? v.expected : v.value;
      const services = (simState && simState.services) || {};
      const svc = services[name];
      if (!svc) return { ok: false, reason: `Service ${name} not present in simulator state.` };
      if (svc.state !== expected) return { ok: false, reason: `Service ${name} state = ${svc.state}, expected ${expected}` };
      return { ok: true };
    },

    observationLogged(step, simState) {
      const v = step.validation;
      const key = v.field || v.path;
      const expected = v.expected != null ? v.expected : v.value;
      const got = getByPath(simState, `observed.${key}`);
      if (got == null) return { ok: false, reason: `No observation logged for ${key}.` };
      if (expected == null) return { ok: true };  // mere presence is enough
      if (Array.isArray(expected)) return expected.includes(got) ? { ok: true } : { ok: false, reason: `${got} not in expected set.` };
      return got === expected ? { ok: true } : { ok: false, reason: `${got} !== ${expected}` };
    },

  };

  function validateStep(step, simState, submission) {
    if (!step || !step.validation || !step.validation.type) {
      return { ok: false, reason: 'Step missing validation.type' };
    }
    const fn = predicates[step.validation.type];
    if (!fn) return { ok: false, reason: `Unknown validation.type: ${step.validation.type}` };
    return fn(step, simState || {}, submission);
  }

  Object.assign(window, {
    validateStep,
    MISSION_NEXT_VALIDATOR: { validateStep, predicates, inputMatches, getByPath },
  });
})();

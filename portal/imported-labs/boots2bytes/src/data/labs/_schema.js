// ============================================================
//  Lab Module Schema (JSDoc types — browser-Babel, no bundler)
// ============================================================
//  The unified shape every lab in src/data/labs/<track>.labs.js
//  must conform to. Phase 0 reference implementation: lap-1.
//
//  Agents do NOT import this file. It is documentation +
//  optional runtime helpers for shape validation.
// ============================================================

/**
 * @typedef {Object} LabSourceSpec
 * @property {string} repo      e.g. '0xrajneesh/Log-Analysis-Projects-for-Beginners'
 * @property {string} file      relative .md path in the repo
 * @property {string} sha256    hex sha256 of the snapshot file (matches .manifest.json)
 * @property {string} snapshot  e.g. 'src/data/sources/lap-1.source.md'
 */

/**
 * @typedef {Object} LabEnvironment
 * @property {'linux'|'windows'|'mixed'|'web'} type
 * @property {string} shell           component name registered on window (e.g. 'LinuxTerminalShell')
 * @property {function():any} [fs]    factory returning the virtual filesystem tree
 */

/**
 * @typedef {Object} LabScenario
 * @property {string} role       short role description ('Junior SOC analyst')
 * @property {string} incident   one-paragraph context
 */

/**
 * @typedef {Object} LabStepUpstream
 * @property {string} exercise     exact heading from .md
 * @property {number} stepNumber   1-indexed within the exercise
 * @property {string} sourceLine   verbatim line from upstream
 */

/**
 * @typedef {'exact'|'regex'|'startsWith'|'contains'} AcceptedInputType
 * @typedef {Object} AcceptedInput
 * @property {AcceptedInputType} type
 * @property {string|RegExp} value
 */

/**
 * @typedef {Object} StateMutation
 * @property {string} key     dot-path inside simulation state
 * @property {*} value
 */

/**
 * @typedef {Object} StepResponse
 * @property {string} [stdout]
 * @property {string} [stderr]
 * @property {number} [exitCode]
 * @property {StateMutation[]} [stateMutations]
 */

/**
 * Predicate types for step validation. See BUILD_PLAN.md §1.6.1.
 *
 * @typedef {'commandExecuted'|'uiPath'|'stateEquals'|'valueExtracted'|'fileCreated'|'serviceState'|'observationLogged'|'quizPassed'} ValidationKind
 *
 * @typedef {Object} StepValidation
 * @property {ValidationKind} type
 * @property {*} [value]               for stateEquals / valueExtracted / fileCreated etc.
 * @property {*} [expected]            preferred field for valueExtracted
 * @property {string[]} [requires]     dot-paths or step ids that must hold true
 */

/**
 * @typedef {Object} LabStep
 * @property {string} id                 dot-path: '<lab>.<exercise>.<step>' e.g. 'lap-1.ex3.s2'
 * @property {LabStepUpstream} upstream
 * @property {'command'|'ui'|'observe'|'analyze'} kind
 * @property {string} instruction        user-facing prompt
 * @property {AcceptedInput[]} [acceptedInputs]
 * @property {StepResponse} [response]
 * @property {StepValidation} validation
 * @property {string} [hint]
 * @property {number} [points]
 * @property {string|null} [checkOnLearning]   id of CoL question that fires after this step
 * @property {string[]} [requires]             step ids that must complete before this unlocks
 */

/**
 * @typedef {Object} LabExercise
 * @property {string} id
 * @property {string} upstreamHeading
 * @property {LabStep[]} steps
 */

/**
 * @typedef {'multi-select'|'single-select'|'short-answer'} ColQuestionType
 *
 * @typedef {Object} ColQuestionOption
 * @property {string} id
 * @property {string} text
 * @property {boolean} correct
 *
 * @typedef {Object} ColTrigger
 * @property {string} stepId
 * @property {Object} [whenStateMatches]
 *
 * @typedef {Object} CheckOnLearningQuestion
 * @property {string} id
 * @property {string} question
 * @property {ColQuestionType} type
 * @property {ColQuestionOption[]} [options]    required for multi-select / single-select
 * @property {string|RegExp} [acceptedAnswer]   required for short-answer
 * @property {ColTrigger} triggerOn
 * @property {string} reinforces                step id this question reinforces
 * @property {'all-correct'|'majority'|'any-correct'} [passThreshold]
 * @property {'recall'|'comprehension'|'application'|'analysis'} bloom
 */

/**
 * @typedef {Object} LabModule
 * @property {string} id                   e.g. 'lap-1'
 * @property {string} track                e.g. 'log-analysis'
 * @property {string} title
 * @property {string} difficulty
 * @property {string} estimatedTime
 * @property {LabSourceSpec} source
 * @property {LabEnvironment} environment
 * @property {LabScenario} scenario
 * @property {LabExercise[]} exercises
 * @property {CheckOnLearningQuestion[]} checkOnLearning
 * @property {{ requireAllSteps:boolean, minQuizScore:number }} completion
 * @property {string[]} [tags]
 */

// ─── Runtime helpers ──────────────────────────────────────────

/**
 * Light-weight shape check. Returns array of error strings (empty = ok).
 * Used by scripts/check.mjs and (optionally) at boot in dev.
 *
 * @param {*} lab   candidate LabModule
 * @returns {string[]}
 */
function validateLabShape(lab) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };

  need(lab && typeof lab === 'object', 'lab must be an object');
  if (!lab) return errs;

  need(typeof lab.id === 'string' && lab.id, 'lab.id required');
  need(typeof lab.track === 'string' && lab.track, 'lab.track required');
  need(typeof lab.title === 'string' && lab.title, 'lab.title required');
  need(lab.source && typeof lab.source.sha256 === 'string', 'lab.source.sha256 required');
  need(lab.source && typeof lab.source.snapshot === 'string', 'lab.source.snapshot required');
  need(lab.environment && lab.environment.shell, 'lab.environment.shell required');
  need(Array.isArray(lab.exercises) && lab.exercises.length > 0, 'lab.exercises must be non-empty array');
  need(Array.isArray(lab.checkOnLearning), 'lab.checkOnLearning must be an array');
  need(lab.completion && typeof lab.completion.requireAllSteps === 'boolean', 'lab.completion.requireAllSteps required');

  if (Array.isArray(lab.exercises)) {
    lab.exercises.forEach((ex, i) => {
      need(ex && ex.id, `exercises[${i}].id required`);
      need(ex && Array.isArray(ex.steps) && ex.steps.length > 0, `exercises[${i}].steps must be non-empty`);
      if (Array.isArray(ex.steps)) {
        ex.steps.forEach((s, j) => {
          need(s && s.id, `exercises[${i}].steps[${j}].id required`);
          need(s && s.upstream, `exercises[${i}].steps[${j}].upstream required`);
          need(s && s.validation && s.validation.type, `exercises[${i}].steps[${j}].validation.type required`);
        });
      }
    });
  }

  // CoL coverage: at least one question per exercise
  if (Array.isArray(lab.exercises) && Array.isArray(lab.checkOnLearning)) {
    const reinforcedSteps = new Set(lab.checkOnLearning.map(q => q.reinforces));
    lab.exercises.forEach((ex, i) => {
      const exerciseStepIds = new Set((ex.steps || []).map(s => s.id));
      const hit = [...reinforcedSteps].some(stepId => exerciseStepIds.has(stepId));
      need(hit, `exercises[${i}] (${ex.id}) has no CoL question reinforcing any of its steps`);
    });
  }

  return errs;
}

Object.assign(window, { B2B_LAB_SCHEMA: { validateLabShape } });

/* Versioned state for the independent Module 11 SOC operations assessment.
 * The append-only action history is the source of truth; every projection
 * (assignments, reports, closure…) is rebuilt by replaying it. */
const SocM11AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-11';
  const MAX_ACTION_HISTORY = 300;
  const REPORT_KINDS = ['technical', 'executive', 'escalation', 'closure'];
  const REPORT_FIELDS = ['summary', 'confirmedScope', 'unknowns', 'businessImpact', 'containmentStatus', 'recoveryStatus', 'residualRisk'];
  const IMPROVEMENT_KINDS = ['lesson', 'detection', 'follow_up'];
  // Per-alert dispositions (internal underscore form; DISPOSITION_LABELS is the learner-facing text).
  const DISPOSITIONS = ['true_positive', 'benign_positive', 'false_positive', 'needs_investigation'];
  const DISPOSITION_LABELS = Object.freeze({ true_positive: 'True positive', benign_positive: 'Benign positive', false_positive: 'False positive', needs_investigation: 'Needs investigation' });
  const TYPES = ['assign', 'escalate', 'priority', 'metric_interpretation', 'noisy_rule', 'handoff', 'report', 'improvement_action', 'closure_decision', 'disposition'];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }
  function scenarioOf(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario?.id || !Array.isArray(scenario.queue)) throw new Error('M11 assessment fixture is required.');
    return scenario;
  }
  function text(value, label, min = 1, max = 2000) {
    if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
      throw new Error(`M11 ${label} must be ${min}–${max} characters.`);
    }
    return value.trim();
  }
  function optionalText(value, label, max = 2000) {
    if (value === undefined || value === null || value === '') return '';
    return text(value, label, 1, max);
  }
  function list(value, label, { min = 0, max = 20, allowed = null } = {}) {
    if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`M11 ${label} must list ${min}–${max} entries.`);
    const items = value.map((entry) => (allowed ? entry : text(entry, label, 1, 300)));
    if (allowed && items.some((entry) => !allowed.includes(entry))) throw new Error(`M11 ${label} references an unknown id.`);
    if (new Set(items).size !== items.length) throw new Error(`M11 ${label} has duplicates.`);
    return items;
  }
  function validTimestamp(value, scenario) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value))
      && Date.parse(value) >= Date.parse(scenario.start) && Date.parse(value) <= Date.parse(scenario.end);
  }
  const openItemIds = (scenario) => scenario.queue.filter((item) => item.status !== 'closed').map((item) => item.id);
  const ownerIds = (scenario) => [...scenario.analysts.map((analyst) => analyst.id), ...scenario.ownerIds];

  function emptyProjection() {
    return { priorityOrder: [], assignments: {}, escalations: [], interpretations: [], noisyRules: [], handoffs: [],
      reports: {}, improvementActions: [], closure: null, dispositions: {} };
  }

  // Validate one action's details against the fixture and fold it into the projection.
  function apply(projection, type, details, scenario) {
    if (!details || typeof details !== 'object' || Array.isArray(details)) throw new Error('M11 action details must be an object.');
    const open = openItemIds(scenario);
    if (type === 'assign') {
      const itemId = list([details.itemId], 'assignment item', { min: 1, max: 1, allowed: open })[0];
      if (!scenario.analysts.some((analyst) => analyst.id === details.analystId)) throw new Error('M11 assignment analyst is unknown.');
      projection.assignments[itemId] = details.analystId;
      return { itemId, analystId: details.analystId };
    }
    if (type === 'escalate') {
      const itemId = list([details.itemId], 'escalation item', { min: 1, max: 1, allowed: open })[0];
      if (!scenario.escalationRoutes.some((route) => route.id === details.route)) throw new Error('M11 escalation route is unknown.');
      const record = { itemId, route: details.route, reason: text(details.reason, 'escalation reason', 10, 500) };
      projection.escalations.push(record);
      return record;
    }
    if (type === 'disposition') {
      const itemId = list([details.itemId], 'disposition item', { min: 1, max: 1, allowed: open })[0];
      if (!DISPOSITIONS.includes(details.disposition)) throw new Error('M11 disposition must be true positive, benign positive, false positive or needs investigation.');
      // Structure only: correctness is never checked here, so nothing about the answer is revealed before submission.
      const record = { itemId, disposition: details.disposition, reason: text(details.reason, 'disposition reasoning', 10, 1000) };
      projection.dispositions[itemId] = { disposition: record.disposition, reason: record.reason };
      return record;
    }
    if (type === 'priority') {
      const order = list(details.order, 'priority order', { min: 1, max: open.length, allowed: open });
      projection.priorityOrder = order;
      return { order };
    }
    if (type === 'metric_interpretation') {
      const record = { text: text(details.text, 'metric interpretation', 20, 2000) };
      projection.interpretations.push(record.text);
      return record;
    }
    if (type === 'noisy_rule') {
      if (!scenario.rules.some((rule) => rule.id === details.ruleId)) throw new Error('M11 rule is unknown.');
      const record = { ruleId: details.ruleId, rationale: text(details.rationale, 'noise rationale', 10, 1000), improvement: text(details.improvement, 'rule improvement', 10, 1000) };
      projection.noisyRules.push(record);
      return record;
    }
    if (type === 'handoff') {
      const record = {
        summary: text(details.summary, 'handoff summary', 20, 2000),
        openItems: list(details.openItems, 'handoff open items', { min: 1, max: scenario.queue.length, allowed: scenario.queue.map((item) => item.id) }),
        risks: list(details.risks || [], 'handoff risks', { max: 10 }),
        nextActions: list(details.nextActions, 'handoff next actions', { min: 1, max: 10 }),
      };
      projection.handoffs.push(record);
      return record;
    }
    if (type === 'report') {
      if (!REPORT_KINDS.includes(details.kind)) throw new Error('M11 report kind is invalid.');
      if (Object.keys(details).some((key) => key !== 'kind' && !REPORT_FIELDS.includes(key))) throw new Error('M11 report has an unknown field.');
      const record = { kind: details.kind, summary: text(details.summary, `${details.kind} report summary`, 20, 4000) };
      REPORT_FIELDS.slice(1).forEach((field) => { record[field] = optionalText(details[field], `${details.kind} ${field}`); });
      projection.reports[details.kind] = record;
      return record;
    }
    if (type === 'improvement_action') {
      if (!IMPROVEMENT_KINDS.includes(details.kind)) throw new Error('M11 improvement kind is invalid.');
      if (!ownerIds(scenario).includes(details.ownerId)) throw new Error('M11 improvement owner is not an analyst or an allowed owner team.');
      if (typeof details.dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(details.dueDate) || details.dueDate < scenario.start.slice(0, 10)) {
        throw new Error('M11 due date must be a YYYY-MM-DD date on or after the shift date.');
      }
      const evidenceIds = scenario.incident.recoveryEvidence.map((record) => record.id);
      if (details.evidenceId && !evidenceIds.includes(details.evidenceId)) throw new Error('M11 follow-up evidence is unknown.');
      const record = {
        id: `M11-FOLLOWUP-${String(projection.improvementActions.length + 1).padStart(3, '0')}`,
        title: text(details.title, 'improvement title', 5, 200), ownerId: details.ownerId, dueDate: details.dueDate, kind: details.kind,
        evidenceId: details.evidenceId || '',
      };
      projection.improvementActions.push(record);
      return record;
    }
    if (type === 'closure_decision') {
      if (!['close', 'retain'].includes(details.decision)) throw new Error('M11 closure decision must be close or retain.');
      const record = {
        decision: details.decision, rationale: text(details.rationale, 'closure rationale', 10, 2000),
        evidenceIds: list(details.evidenceIds || [], 'closure evidence', { max: 10, allowed: scenario.incident.recoveryEvidence.map((item) => item.id) }),
      };
      projection.closure = record;
      return record;
    }
    throw new Error(`Unsupported M11 action type: ${type}`);
  }

  function normalize(source, fixture) {
    const scenario = scenarioOf(fixture);
    const prior = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const projection = emptyProjection();
    const actionHistory = [];
    let lastSequence = 0;
    for (const action of Array.isArray(prior.actionHistory) ? prior.actionHistory.slice(0, MAX_ACTION_HISTORY) : []) {
      try {
        if (!action || !TYPES.includes(action.type) || !Number.isSafeInteger(action.sequence) || action.sequence <= lastSequence
          || action.id !== `${scenario.id}:ACTION-${String(action.sequence).padStart(6, '0')}`
          || !validTimestamp(action.timestamp, scenario)) continue;
        const details = apply(projection, action.type, clone(action.details), scenario);
        actionHistory.push(deepFreeze({ id: action.id, sequence: action.sequence, type: action.type, timestamp: action.timestamp, details }));
        lastSequence = action.sequence;
      } catch (error) {
        // An invalid saved action is dropped rather than replayed.
      }
    }
    return {
      ...projection,
      actionHistory,
      nextActionSequence: lastSequence + 1,
      schemaVersion: VERSION,
      scenarioId: scenario.id,
      // LabRuntime only restores a record that keeps its own identity fields.
      ...Object.fromEntries(['labId', 'anonymousStudentId'].filter((key) => typeof prior[key] === 'string').map((key) => [key, prior[key]])),
    };
  }

  function record(state, fixture, type, details, timestamp) {
    const scenario = scenarioOf(fixture);
    const at = timestamp === undefined ? scenario.fixedAt : timestamp;
    if (!validTimestamp(at, scenario)) throw new Error('M11 action timestamp must be canonical UTC inside the shift window.');
    const next = normalize(state, fixture);
    if (next.actionHistory.length >= MAX_ACTION_HISTORY) throw new Error('M11 assessment action history limit reached.');
    const projection = clone({ ...emptyProjection(), ...Object.fromEntries(Object.keys(emptyProjection()).map((key) => [key, next[key]])) });
    const safe = apply(projection, type, clone(details), scenario);
    const sequence = next.nextActionSequence;
    const action = deepFreeze({ id: `${scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`, sequence, type, timestamp: at, details: safe });
    return normalize({ ...next, actionHistory: [...next.actionHistory, action] }, fixture);
  }

  const assign = (state, fixture, itemId, analystId, timestamp) => record(state, fixture, 'assign', { itemId, analystId }, timestamp);
  const escalate = (state, fixture, itemId, route, reason, timestamp) => record(state, fixture, 'escalate', { itemId, route, reason }, timestamp);
  const setPriority = (state, fixture, orderedItemIds, timestamp) => record(state, fixture, 'priority', { order: orderedItemIds }, timestamp);
  const recordMetricInterpretation = (state, fixture, interpretation, timestamp) => record(state, fixture, 'metric_interpretation', { text: interpretation }, timestamp);
  const flagNoisyRule = (state, fixture, ruleId, rationale, improvement, timestamp) => record(state, fixture, 'noisy_rule', { ruleId, rationale, improvement }, timestamp);
  const recordDisposition = (state, fixture, itemId, disposition, reason, timestamp) => record(state, fixture, 'disposition', { itemId, disposition, reason }, timestamp);
  const handoff = (state, fixture, input, timestamp) => record(state, fixture, 'handoff', input, timestamp);
  const report = (state, fixture, kind, fields, timestamp) => record(state, fixture, 'report', { ...fields, kind }, timestamp);
  const improvementAction = (state, fixture, input, timestamp) => record(state, fixture, 'improvement_action', input, timestamp);
  const closureDecision = (state, fixture, input, timestamp) => record(state, fixture, 'closure_decision', input, timestamp);

  function sameValue(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && sameValue(a[key], b[key]));
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M11 assessment state.');
    return LabRuntime;
  }
  function load(user, fixture) {
    const key = scenarioOf(fixture).stateKey;
    const current = runtime().loadCaseState(key, MODULE_KEY, user, {});
    const normalized = normalize(current, fixture);
    // Saved state round-trips through Postgres jsonb, which reorders object keys: compare structurally, never by serialized text.
    if (!sameValue(current, normalized)) runtime().saveCaseState(key, MODULE_KEY, user, normalized);
    return normalized;
  }
  function save(user, state, fixture) {
    return runtime().saveCaseState(scenarioOf(fixture).stateKey, MODULE_KEY, user, normalize(state, fixture));
  }
  function reset(user, fixture) {
    const key = scenarioOf(fixture).stateKey;
    const fresh = runtime().resetCaseState(key, MODULE_KEY, user, {});
    return runtime().saveCaseState(key, MODULE_KEY, user, normalize(fresh, fixture));
  }

  return Object.freeze({
    VERSION, MODULE_KEY, MAX_ACTION_HISTORY, TYPES, REPORT_KINDS, IMPROVEMENT_KINDS, DISPOSITIONS, DISPOSITION_LABELS,
    normalize, assign, escalate, setPriority, recordMetricInterpretation, flagNoisyRule, recordDisposition, handoff, report, improvementAction, closureDecision,
    load, save, reset,
  });
})();

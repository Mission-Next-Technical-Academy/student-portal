/* Versioned persistence contract for the independent Module 08 assessment. */
const SocM08AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-08';
  const LIMITS = Object.freeze({ findingReviews: 500, remediationDecisions: 500, remediationTransitions: 500, incidentLinks: 500, riskAcceptances: 500, escalations: 500, actionHistory: 500 });
  const EMPTY_DEFAULTS = {
    findingReviews: [],
    remediationDecisions: [],
    remediationTransitions: [],
    incidentLinks: [],
    riskAcceptances: [],
    escalations: [],
    actionHistory: [],
    nextActionSequence: 1,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function scenarioOf(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario?.id) throw new Error('M08 assessment fixture scenario is required.');
    if (typeof scenario.stateKey !== 'string' || !scenario.stateKey) {
      throw new Error('M08 assessment fixture stateKey is required.');
    }
    return scenario;
  }

  function records(value, limit) {
    return Array.isArray(value)
      ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone).slice(-limit)
      : [];
  }

  function legacyHistory(prior, fixture) {
    const actions = typeof SocM08AssessmentActions === 'undefined' ? null : SocM08AssessmentActions;
    if (!actions) return [];
    const candidates = [
      ...records(prior.findingReviews, LIMITS.findingReviews).map((record) => ({
        type: 'finding_review', details: Object.fromEntries(Object.entries(record)
          .filter(([key]) => !['actionId', 'timestamp'].includes(key))), timestamp: record.timestamp,
      })),
      ...records(prior.remediationDecisions, LIMITS.remediationDecisions).map((record) => ({
        type: 'remediation_decision', details: Object.fromEntries(Object.entries(record)
          .filter(([key]) => !['actionId', 'timestamp'].includes(key))), timestamp: record.timestamp,
      })),
    ];
    candidates.sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')));
    return candidates.filter((item) => actions.validDetails(item.type, item.details, fixture))
      .slice(-LIMITS.actionHistory).map((item, index) => ({
        id: `${fixture.scenario.id}:ACTION-${String(index + 1).padStart(6, '0')}`,
        sequence: index + 1,
        type: item.type,
        timestamp: actions.canonicalTimestamp(item.timestamp, fixture.scenario)
          ? item.timestamp : new Date(fixture.scenario.fixedAt).toISOString().replace(/Z$/, '.000Z'),
        details: item.details,
      }));
  }

  function validateAction(action, fixture, previousSequence) {
    const api = typeof SocM08AssessmentActions === 'undefined' ? null : SocM08AssessmentActions;
    const scenario = fixture.scenario;
    if (!api || !action || typeof action !== 'object' || Array.isArray(action)
      || Object.keys(action).sort().join(',') !== 'details,id,sequence,timestamp,type'
      || !Number.isSafeInteger(action.sequence) || action.sequence <= previousSequence
      || action.id !== `${scenario.id}:ACTION-${String(action.sequence).padStart(6, '0')}`
      || !api.TYPES.includes(action.type) || !api.canonicalTimestamp(action.timestamp, scenario)
      || !api.validDetails(action.type, action.details, fixture)) {
      throw new Error('M08 assessment action history contains an invalid or foreign action.');
    }
    return clone(action);
  }

  function normalize(source, fixture) {
    const scenario = scenarioOf(fixture);
    const prior = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    if (Number.isSafeInteger(prior.schemaVersion) && prior.schemaVersion > VERSION) {
      throw new Error('M08 assessment state schema is newer than this application supports.');
    }
    if (typeof prior.scenarioId === 'string' && prior.scenarioId !== scenario.id) {
      throw new Error('M08 assessment state belongs to a different scenario.');
    }
    const suppliedHistory = Array.isArray(prior.actionHistory) && prior.actionHistory.length > 0;
    const sourceHistory = suppliedHistory ? prior.actionHistory.map(clone) : legacyHistory(prior, fixture);
    if (sourceHistory.length > LIMITS.actionHistory) sourceHistory.splice(0, sourceHistory.length - LIMITS.actionHistory);
    let previousSequence = 0;
    const actionHistory = sourceHistory.map((action) => {
      const validated = validateAction(action, fixture, previousSequence);
      previousSequence = validated.sequence;
      return validated;
    });
    actionHistory.forEach(deepFreeze);
    const findingReviews = new Map();
    const remediationDecisions = [];
    const remediationTransitions = [];
    const incidentLinks = [];
    const riskAcceptances = [];
    const escalations = [];
    for (const action of actionHistory) {
      const projection = { ...clone(action.details), actionId: action.id, timestamp: action.timestamp };
      if (action.type === 'finding_review') findingReviews.set(action.details.findingId, projection);
      else if (action.type === 'remediation_decision') remediationDecisions.push(projection);
      else if (action.type === 'remediation_transition') {
        const currentIndex = remediationDecisions.map((item) => item.findingId).lastIndexOf(action.details.findingId);
        if (currentIndex < 0 || !SocM08AssessmentActions.validTransition(action.details, remediationDecisions[currentIndex])) {
          throw new Error('M08 remediation transition does not match its audited decision history.');
        }
        remediationDecisions[currentIndex] = { ...remediationDecisions[currentIndex], status: action.details.toStatus,
          actionId: action.id, timestamp: action.timestamp };
        remediationTransitions.push(projection);
      }
      else if (action.type === 'incident_link') incidentLinks.push(projection);
      else if (action.type === 'risk_acceptance') riskAcceptances.push(projection);
      else if (action.type === 'escalation') escalations.push(projection);
    }
    const minimumSequence = previousSequence + 1;
    if (prior.nextActionSequence !== undefined
      && (!Number.isSafeInteger(prior.nextActionSequence) || prior.nextActionSequence < minimumSequence)) {
      throw new Error('M08 assessment next action sequence is not monotonic.');
    }
    const state = {
      findingReviews: [...findingReviews.values()].slice(-LIMITS.findingReviews),
      remediationDecisions: remediationDecisions.slice(-LIMITS.remediationDecisions),
      remediationTransitions: remediationTransitions.slice(-LIMITS.remediationTransitions),
      incidentLinks: incidentLinks.slice(-LIMITS.incidentLinks),
      riskAcceptances: riskAcceptances.slice(-LIMITS.riskAcceptances),
      escalations: escalations.slice(-LIMITS.escalations),
      actionHistory,
      nextActionSequence: Math.max(minimumSequence, prior.nextActionSequence || 1),
      schemaVersion: VERSION,
      scenarioId: scenario.id,
    };
    // LabRuntime only restores a record that keeps its own identity fields.
    ['labId', 'anonymousStudentId'].forEach((key) => { if (typeof prior[key] === 'string') state[key] = prior[key]; });
    return state;
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M08 assessment state.');
    return LabRuntime;
  }

  function stateKey(fixture) {
    return scenarioOf(fixture).stateKey;
  }

  function load(user, fixture) {
    const key = stateKey(fixture);
    const current = runtime().loadCaseState(key, MODULE_KEY, user, {});
    const normalized = normalize(current, fixture);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) runtime().saveCaseState(key, MODULE_KEY, user, normalized);
    return normalized;
  }

  function save(user, state, fixture) {
    return runtime().saveCaseState(stateKey(fixture), MODULE_KEY, user, normalize(state, fixture));
  }

  function reset(user, fixture) {
    const key = stateKey(fixture);
    runtime().resetCaseState(key, MODULE_KEY, user, {});
    return runtime().saveCaseState(key, MODULE_KEY, user, normalize({}, fixture));
  }

  return Object.freeze({ VERSION, MODULE_KEY, LIMITS, EMPTY_DEFAULTS: deepFreeze(EMPTY_DEFAULTS), normalize, load, save, reset });
})();

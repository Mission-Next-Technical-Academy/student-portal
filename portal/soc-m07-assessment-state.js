/* Versioned persistence contract for the independent Module 07 assessment. */
const SocM07AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-07';
  const EMPTY_DEFAULTS = {
    reviewedMessageIds: [],
    reviewedArtifactIds: [],
    reviewedNetworkEventIds: [],
    pivots: [],
    scope: { recipientIds: [], deviceIds: [] },
    recipientSearch: { query: '', delivery: 'all', interaction: 'all', limit: 100 },
    incidentLinks: [],
    evidenceChanges: [],
    actionHistory: [],
    nextActionSequence: 1,
  };

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function scenarioOf(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario?.id) throw new Error('M07 assessment fixture scenario is required.');
    if (typeof scenario.stateKey !== 'string' || !scenario.stateKey) {
      throw new Error('M07 assessment fixture stateKey is required.');
    }
    return scenario;
  }

  function normalize(source, fixture) {
    const scenario = scenarioOf(fixture);
    const prior = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    if (Number.isSafeInteger(prior.schemaVersion) && prior.schemaVersion > VERSION) {
      throw new Error('M07 assessment state schema is newer than this application supports.');
    }
    if (typeof prior.scenarioId === 'string' && prior.scenarioId !== scenario.id) {
      throw new Error('M07 assessment state belongs to a different scenario.');
    }
    const state = { ...clone(EMPTY_DEFAULTS), ...clone(prior) };
    const validHistory = typeof SocM07AssessmentActions !== 'undefined'
      ? SocM07AssessmentActions.validateHistory(prior.actionHistory, fixture) : [];
    const messageReviews = new Set();
    const artifactReviews = new Set();
    const networkReviews = new Set();
    let auditedScope = clone(EMPTY_DEFAULTS.scope);
    for (const action of validHistory) {
      const details = action.details;
      if (action.type === 'message_review') {
        if (details.reviewed) messageReviews.add(details.messageId);
        else messageReviews.delete(details.messageId);
      } else if (action.type === 'artifact_review') {
        if (details.reviewed) artifactReviews.add(details.artifactId);
        else artifactReviews.delete(details.artifactId);
      } else if (action.type === 'network_review') {
        if (details.reviewed) networkReviews.add(details.eventId);
        else networkReviews.delete(details.eventId);
      } else if (action.type === 'scope_change') {
        auditedScope = { recipientIds: [...details.recipientIds], deviceIds: [...details.deviceIds] };
      } else if (action.type === 'recipient_search') {
        auditedScope = { recipientIds: [...details.recipientIds], deviceIds: [...details.deviceIds] };
      }
    }
    state.reviewedMessageIds = [...messageReviews].slice(-100);
    state.reviewedArtifactIds = [...artifactReviews].slice(-500);
    const networkIds = new Set(scenario.networkEvents.map((event) => event.id));
    state.reviewedNetworkEventIds = [...networkReviews].filter((id) => networkIds.has(id)).slice(-500);
    state.actionHistory = validHistory;
    state.pivots = validHistory.filter((item) => item.type === 'pivot').map((item) => clone(item.details)).slice(-500);
    state.scope = auditedScope;
    const latestSearch = validHistory.filter((item) => item.type === 'recipient_search').at(-1);
    state.recipientSearch = latestSearch ? {
      query: latestSearch.details.query,
      delivery: latestSearch.details.delivery,
      interaction: latestSearch.details.interaction,
      limit: latestSearch.details.limit,
    } : clone(EMPTY_DEFAULTS.recipientSearch);
    state.incidentLinks = validHistory.filter((item) => item.type === 'incident_link')
      .reduce((items, item) => [...items.filter((entry) => entry.incidentId !== item.details.incidentId),
        ...(item.details.operation === 'remove' ? [] : [clone(item.details)])], []).slice(-200);
    state.evidenceChanges = validHistory.filter((item) => item.type === 'evidence_change')
      .reduce((items, item) => [...items.filter((entry) => entry.eventId !== item.details.eventId),
        ...(item.details.operation === 'add' ? [clone(item.details)] : [])], []).slice(-200);
    state.actionHistory = validHistory;
    const maxSequence = state.actionHistory.reduce((max, item) => Math.max(max, item.sequence), 0);
    state.nextActionSequence = Number.isSafeInteger(prior.nextActionSequence) && prior.nextActionSequence > maxSequence
      ? prior.nextActionSequence : maxSequence + 1;
    state.schemaVersion = VERSION;
    state.scenarioId = scenario.id;
    return state;
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M07 assessment state.');
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

  return Object.freeze({ VERSION, MODULE_KEY, EMPTY_DEFAULTS: deepFreeze(EMPTY_DEFAULTS), normalize, load, save, reset });
})();

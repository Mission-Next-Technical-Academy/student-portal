/* Versioned persistence contract for the independent Module 06 assessment. */
const SocM06AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-06';
  const HANDOFF_HISTORY_LIMIT = 20;
  const LIMITS = Object.freeze({ hypotheses: 50, queryHistory: 200, savedQueries: 50, savedQueryRuns: 200, pivots: 200, bookmarks: 100,
    collections: 50, mappings: 100, handoffs: 50, conclusions: 50, actionHistory: 200 });
  const EMPTY_DEFAULTS = Object.freeze({ hypotheses: [], queryHistory: [], savedQueries: [], savedQueryRuns: [], pivots: [], bookmarks: [],
    collections: [], selectedCollectionId: '', mappings: [], handoffs: [], conclusions: [], actionHistory: [], nextActionSequence: 1 });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isRecord(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }

  function normalize(foreignState, fixture) {
    const scenario = fixture?.scenario;
    if (!scenario) throw new Error('M06 assessment fixture is required.');
    const source = isRecord(foreignState) ? foreignState : {};
    const eventIds = new Set(scenario.telemetry.map((event) => event.id));
    const deviceIds = new Set(scenario.scope.devices);
    const accountIds = new Set(scenario.telemetry.map((event) => event.account).filter(Boolean));
    // Any catalog technique is a valid learner mapping; the rubric decides which are right.
    const techniqueIds = new Set([
      ...scenario.expectedTruth.supportedTechniques,
      ...scenario.expectedTruth.unsupportedTechniques,
    ].map((technique) => technique.id).concat(typeof SocM06AssessmentRelatedSearch !== 'undefined' ? Object.keys(SocM06AssessmentRelatedSearch.TECHNIQUES) : []));
    const eventById = new Map(scenario.telemetry.map((event) => [event.id, event]));

    function validReferences(value, key = '') {
      if (Array.isArray(value)) return value.every((item) => validReferences(item, key));
      if (!isRecord(value)) {
        if (typeof value !== 'string') return true;
        if (/(?:event|bookmark)Ids?$/i.test(key)) return eventIds.has(value);
        if (/(?:device|host)Ids?$/i.test(key)) return deviceIds.has(value);
        if (/(?:account|user)Ids?$/i.test(key)) return accountIds.has(value);
        if (/(?:technique|attack)Ids?$/i.test(key)) return techniqueIds.has(value);
        return true;
      }
      return Object.entries(value).every(([childKey, child]) => validReferences(child, childKey));
    }

    const normalized = {};
    for (const [key, limit] of Object.entries(LIMITS)) {
      const entries = Array.isArray(source[key]) ? source[key] : [];
      if (key === 'bookmarks') {
        normalized[key] = [...new Set(entries.filter((id) => typeof id === 'string' && eventIds.has(id)))].slice(-limit);
      } else if (key === 'queryHistory') {
        const validTime = (value) => typeof SocM06AssessmentActions !== 'undefined'
          && SocM06AssessmentActions.validTimestamp(value);
        normalized[key] = entries.filter((item) => isRecord(item)
          && validTime(item.startTime) && validTime(item.endTime) && validTime(item.timestamp)
          && Date.parse(item.startTime) <= Date.parse(item.endTime)
          && Date.parse(item.endTime) - Date.parse(item.startTime) <= 24 * 60 * 60 * 1000
          && Date.parse(item.startTime) >= Date.parse(scenario.scope.timeStart)
          && Date.parse(item.endTime) <= Date.parse(scenario.scope.timeEnd)
          && ['all', 'device', 'account'].includes(item.entityType)
          && (item.entityType === 'all' ? item.entityValue === 'all'
            : item.entityType === 'device' ? deviceIds.has(item.entityValue) : accountIds.has(item.entityValue))
          && Array.isArray(item.resultEventIds) && item.resultEventIds.every((id) => eventIds.has(id)))
          .map((item) => clone(item)).slice(-limit);
      } else if (key === 'savedQueries') {
        normalized[key] = entries.filter((item) => isRecord(item)
          && typeof item.id === 'string' && /^M06-SAVED-QUERY-\d{6}$/.test(item.id)
          && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 80
          && typeof item.query === 'string' && item.query.length <= 500
          && typeof SocM06AssessmentRelatedSearch !== 'undefined'
          && SocM06AssessmentRelatedSearch.parseQuery(item.query, fixture).valid)
          .map((item) => ({ id: item.id, name: item.name.trim(), query: item.query })).slice(-limit);
      } else if (key === 'savedQueryRuns') {
        const definitions = new Map(normalized.savedQueries.map((item) => [item.id, item]));
        normalized[key] = entries.filter((item) => {
          if (!isRecord(item) || !definitions.has(item.savedQueryId) || !SocM06AssessmentActions.validTimestamp(item.timestamp)
            || !Array.isArray(item.resultEventIds) || item.resultEventIds.length > 100) return false;
          const definition = definitions.get(item.savedQueryId);
          if (item.name !== definition.name || item.query !== definition.query) return false;
          try {
            const scope = SocM06AssessmentRelatedSearch.validateScope(item, fixture);
            const parsed = SocM06AssessmentRelatedSearch.parseQuery(definition.query, fixture);
            if (!parsed.valid) return false;
            const expected = scenario.telemetry.filter((event) => Date.parse(event.time) >= Date.parse(scope.startTime)
              && Date.parse(event.time) <= Date.parse(scope.endTime)
              && (scope.entityType === 'all' || (scope.entityType === 'device' ? event.device : event.account) === scope.entityValue)
              && parsed.clauses.every(({ field, value }) => event[field] === value))
              .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || a.id.localeCompare(b.id))
              .slice(0, 100).map((event) => event.id);
            return JSON.stringify(item.resultEventIds) === JSON.stringify(expected);
          } catch { return false; }
        }).map((item) => clone(item)).slice(-limit);
      } else if (key === 'pivots') {
        normalized[key] = entries.filter((item) => isRecord(item)
          && eventIds.has(item.fromEventId) && eventIds.has(item.toEventId)
          && (eventById.get(item.fromEventId).relatedEventIds || []).includes(item.toEventId)
          && item.field === 'relatedEventIds' && item.value === item.toEventId
          && (typeof SocM06AssessmentActions === 'undefined' || SocM06AssessmentActions.validTimestamp(item.timestamp)))
          .map((item) => clone(item)).slice(-limit);
      } else if (key === 'collections') {
        const seen = new Set();
        normalized[key] = entries.filter((item) => isRecord(item)
          && typeof item.id === 'string' && /^M06-COLLECTION-\d{6}$/.test(item.id)
          && !seen.has(item.id) && seen.add(item.id)
          && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 80
          && Array.isArray(item.eventIds))
          .map((item) => ({ id: item.id, name: item.name.trim(), eventIds: [...new Set(item.eventIds.filter((id) => eventIds.has(id)))].slice(-100) }))
          .slice(-limit);
      } else if (key === 'handoffs') {
        normalized[key] = entries.filter((item) => isRecord(item)
          && typeof item.id === 'string' && /^M06-HANDOFF-\d{6}$/.test(item.id)
          && ['alert', 'incident', 'rule'].includes(item.destination)
          && Array.isArray(item.eventIds) && item.eventIds.length > 0 && item.eventIds.length <= 20
          && new Set(item.eventIds).size === item.eventIds.length && item.eventIds.every((id) => eventIds.has(id))
          && typeof item.rationale === 'string' && item.rationale.trim().length > 0 && item.rationale.length <= 1000
          && typeof item.recommendation === 'string' && item.recommendation.trim().length > 0 && item.recommendation.length <= 1000)
          .map((item) => ({ id: item.id, eventIds: [...item.eventIds], destination: item.destination,
            rationale: item.rationale.trim(), recommendation: item.recommendation.trim(),
            status: ['proposed', 'in_review', 'accepted', 'rejected'].includes(item.status) ? item.status : 'proposed',
            statusHistory: (Array.isArray(item.statusHistory) ? item.statusHistory : []).filter((entry) => isRecord(entry)
              && Number.isSafeInteger(entry.actionSequence) && entry.actionSequence > 0
              && ['proposed', 'in_review', 'accepted', 'rejected'].includes(entry.status)
              && (entry.fromStatus === null || ['proposed', 'in_review'].includes(entry.fromStatus))
              && Array.isArray(entry.eventIds) && JSON.stringify(entry.eventIds) === JSON.stringify(item.eventIds)
              && typeof SocM06AssessmentActions !== 'undefined' && SocM06AssessmentActions.validTimestamp(entry.timestamp)
              && typeof entry.note === 'string' && entry.note.length <= 500)
              .map((entry) => ({ actionSequence: entry.actionSequence, fromStatus: entry.fromStatus,
                status: entry.status, timestamp: entry.timestamp, eventIds: [...entry.eventIds], note: entry.note }))
              .slice(-HANDOFF_HISTORY_LIMIT) })).slice(-limit);
      } else if (key === 'mappings') {
        const seen = new Set();
        normalized[key] = entries.filter((item) => isRecord(item)
          && typeof SocM06AssessmentRelatedSearch !== 'undefined'
          && SocM06AssessmentRelatedSearch.validateMapping(item, fixture)
          && !seen.has(`${item.tacticId}:${item.techniqueId}`)
          && seen.add(`${item.tacticId}:${item.techniqueId}`))
          .map((item) => ({ tacticId: item.tacticId, techniqueId: item.techniqueId, confidence: item.confidence,
            status: item.status, eventIds: [...new Set(item.eventIds)].slice(0, 100), rationale: item.rationale.trim().slice(0, 2000) }))
          .slice(-limit);
      } else {
        normalized[key] = entries
          .filter((item) => isRecord(item) && validReferences(item))
          .map((item) => {
            const copy = clone(item);
            for (const [field, max] of Object.entries({ id: 120, title: 200, text: 2000, query: 4000, note: 2000, rationale: 2000 })) {
              if (typeof copy[field] === 'string') copy[field] = copy[field].slice(0, max);
            }
            return copy;
          }).slice(-limit);
      }
    }
    normalized.selectedCollectionId = normalized.collections.some((item) => item.id === source.selectedCollectionId)
      ? source.selectedCollectionId : '';
    normalized.schemaVersion = VERSION;
    normalized.scenarioId = scenario.id;
    if (typeof SocM06AssessmentActions !== 'undefined') {
      const audit = SocM06AssessmentActions.restoreHistory(source.actionHistory, source.nextActionSequence, fixture);
      normalized.actionHistory = audit.actionHistory;
      normalized.nextActionSequence = audit.nextActionSequence;
      const actions = new Map(normalized.actionHistory.map((action) => [action.sequence, action]));
      const oldestActionSequence = normalized.actionHistory[0]?.sequence ?? normalized.nextActionSequence;
      normalized.handoffs = normalized.handoffs.map((handoff) => {
        let expected = 'proposed';
        const history = handoff.statusHistory.filter((entry) => {
          const action = actions.get(entry.actionSequence);
          const initial = entry.fromStatus === null && entry.status === 'proposed';
          const transition = entry.fromStatus === expected && ['in_review', 'accepted', 'rejected'].includes(entry.status)
            && (expected === 'proposed' || expected === 'in_review');
          const type = initial ? 'handoff_proposal' : 'handoff_status';
          const linked = !action && entry.actionSequence < oldestActionSequence
            || action?.type === type && action.timestamp === entry.timestamp
            && action.details.handoffId === handoff.id
            && JSON.stringify(action.details.eventIds) === JSON.stringify(handoff.eventIds)
            && (initial || (action.details.fromStatus === entry.fromStatus && action.details.toStatus === entry.status
              && action.details.note === entry.note));
          if (!transition && !initial || !linked) return false;
          expected = entry.status;
          return true;
        });
        const consistent = history.length === handoff.statusHistory.length && expected === handoff.status;
        return { ...handoff, status: consistent ? handoff.status : 'proposed', statusHistory: consistent ? history : [] };
      });
    } else {
      normalized.nextActionSequence = Number.isSafeInteger(source.nextActionSequence) && source.nextActionSequence > 0
        ? source.nextActionSequence : 1;
    }
    // LabRuntime only restores a record that keeps its own identity fields.
    ['labId', 'anonymousStudentId'].forEach((key) => { if (typeof source[key] === 'string') normalized[key] = source[key]; });
    return normalized;
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M06 assessment state.');
    return LabRuntime;
  }

  function stateKey(fixture) {
    const key = fixture?.scenario?.stateKey;
    if (typeof key !== 'string' || !key) throw new Error('M06 assessment fixture stateKey is required.');
    return key;
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

  return Object.freeze({ VERSION, MODULE_KEY, LIMITS, EMPTY_DEFAULTS: clone(EMPTY_DEFAULTS), normalize, load, save, reset });
})();

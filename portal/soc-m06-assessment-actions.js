/* Bounded typed hunt action history for the independent Module 06 assessment. */
const SocM06AssessmentActions = (() => {
  'use strict';

  const MAX_HISTORY = 200;
  const DETAIL_KEYS = Object.freeze({
    hypothesis_edit: ['hypothesisId', 'text', 'status', 'relatedEventIds', 'deviceIds'],
    query_run: ['query', 'resultEventIds', 'resultCount', 'startTime', 'endTime', 'entityType', 'entityValue'],
    saved_query_create: ['savedQueryId', 'name', 'query'],
    saved_query_run: ['savedQueryId', 'resultEventIds', 'resultCount'],
    pivot: ['fromEventId', 'toEventId', 'field', 'value'],
    bookmark: ['eventId', 'note'],
    bookmark_remove: ['eventId'],
    collection: ['collectionId', 'name', 'eventIds', 'operation'],
    collection_select: ['collectionId'],
    attack_mapping_change: ['tacticId', 'techniqueId', 'eventIds', 'confidence', 'status', 'rationale', 'replacesTacticId', 'replacesTechniqueId'],
    attack_mapping_remove: ['tacticId', 'techniqueId', 'reason'],
    handoff: ['handoffId', 'deviceIds', 'eventIds', 'recipient', 'summary', 'status'],
    handoff_proposal: ['handoffId', 'eventIds', 'destination', 'rationale', 'recommendation'],
    handoff_status: ['handoffId', 'eventIds', 'fromStatus', 'toStatus', 'note'],
    conclusion: ['text', 'eventIds', 'disposition'],
  });
  const REF_KEYS = Object.freeze({ eventId: 'event', eventIds: 'events', resultEventIds: 'events', fromEventId: 'event', toEventId: 'event',
    relatedEventIds: 'events', deviceId: 'device', deviceIds: 'devices', techniqueId: 'technique' });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }
  function validTimestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return false;
    const ms = Date.parse(value);
    return Number.isFinite(ms) && new Date(ms).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'));
  }
  function context(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario) throw new Error('M06 assessment fixture is required.');
    return {
      scenario,
      events: new Set(scenario.telemetry.map((event) => event.id)),
      devices: new Set(scenario.scope.devices),
      techniques: new Set([...scenario.expectedTruth.supportedTechniques, ...scenario.expectedTruth.unsupportedTechniques].map((item) => item.id)
        .concat(typeof SocM06AssessmentRelatedSearch !== 'undefined' ? Object.keys(SocM06AssessmentRelatedSearch.TECHNIQUES) : [])),
    };
  }
  function validDetails(type, details, fixture) {
    const keys = DETAIL_KEYS[type];
    if (!keys || !details || typeof details !== 'object' || Array.isArray(details)) return false;
    const entries = Object.entries(details);
    if (!entries.length || entries.some(([key]) => !keys.includes(key))) return false;
    const refs = context(fixture);
    for (const [key, value] of entries) {
      if (key === 'savedQueryId') { if (typeof value !== 'string' || !/^M06-SAVED-QUERY-\d{6}$/.test(value)) return false; continue; }
      if (key === 'collectionId') {
        if (typeof value !== 'string' || !(type === 'collection_select' ? value === '' || /^M06-COLLECTION-\d{6}$/.test(value) : /^M06-COLLECTION-\d{6}$/.test(value))) return false;
        continue;
      }
      if (REF_KEYS[key]) {
        const kind = REF_KEYS[key];
        const allowed = kind === 'event' ? refs.events : kind === 'events' ? refs.events : kind === 'device' ? refs.devices : kind === 'devices' ? refs.devices : kind === 'saved-query' ? new Set((fixtureStateSavedQueries || []).map((item) => item.id)) : refs.techniques;
        if (kind.endsWith('s') ? (!Array.isArray(value) || value.some((item) => !allowed.has(item))) : !allowed.has(value)) return false;
        continue;
      }
      if (key === 'resultCount') { if (!Number.isSafeInteger(value) || value < 0) return false; continue; }
      if (key === 'confidence') { if (!Number.isInteger(value) || value < 0 || value > 100) return false; continue; }
      if (key === 'startTime' || key === 'endTime') { if (!validTimestamp(value)) return false; continue; }
      if (key === 'entityType') { if (!['device', 'account', 'all'].includes(value)) return false; continue; }
      if (typeof value === 'string' && value.trim() && value.length <= 4000) continue;
      if (Array.isArray(value) && value.length <= 200 && value.every((item) => typeof item === 'string' && item.trim())) continue;
      return false;
    }
    if (type === 'bookmark_remove' && Object.keys(details).length !== 1) return false;
    if (type === 'collection_select' && Object.keys(details).length !== 1) return false;
    if (type === 'collection' && (!['create', 'update', 'remove'].includes(details.operation)
      || !/^M06-COLLECTION-\d{6}$/.test(details.collectionId || '')
      || typeof details.name !== 'string' || !details.name.trim() || details.name.length > 80
      || !Array.isArray(details.eventIds) || details.eventIds.length > 100
      || new Set(details.eventIds).size !== details.eventIds.length)) return false;
    if (type === 'query_run') {
      const scenario = refs.scenario;
      if (details.entityType && !['all', 'device', 'account'].includes(details.entityType)) return false;
      if (details.entityType === 'all' && details.entityValue !== 'all') return false;
      if (details.entityType === 'device' && !refs.devices.has(details.entityValue)) return false;
      if (details.entityType === 'account' && !scenario.telemetry.some((event) => event.account === details.entityValue)) return false;
      if (details.startTime || details.endTime) {
        if (!validTimestamp(details.startTime) || !validTimestamp(details.endTime)
          || Date.parse(details.startTime) > Date.parse(details.endTime)
          || Date.parse(details.endTime) - Date.parse(details.startTime) > 24 * 60 * 60 * 1000
          || Date.parse(details.startTime) < Date.parse(scenario.scope.timeStart)
          || Date.parse(details.endTime) > Date.parse(scenario.scope.timeEnd)) return false;
      }
    }
    if (type === 'saved_query_create'
      && (!/^M06-SAVED-QUERY-\d{6}$/.test(details.savedQueryId || '')
        || typeof details.name !== 'string' || !details.name.trim() || details.name.length > 80
        || typeof details.query !== 'string' || typeof SocM06AssessmentRelatedSearch === 'undefined'
        || !SocM06AssessmentRelatedSearch.parseQuery(details.query, fixture).valid)) return false;
    if (type === 'saved_query_run' && (!Number.isSafeInteger(details.resultCount) || details.resultCount !== details.resultEventIds?.length)) return false;
    if (type === 'attack_mapping_change') {
      const mapping = typeof SocM06AssessmentRelatedSearch !== 'undefined'
        && SocM06AssessmentRelatedSearch.validateMapping(details, fixture);
      if (!mapping) return false;
      if ((details.replacesTacticId === undefined) !== (details.replacesTechniqueId === undefined)) return false;
      if (details.replacesTacticId !== undefined) {
        const priorTruth = refs.scenario.expectedTruth.supportedTechniques.find((item) => item.id === details.replacesTechniqueId)
          || refs.scenario.expectedTruth.unsupportedTechniques.find((item) => item.id === details.replacesTechniqueId);
        const prior = typeof SocM06AssessmentRelatedSearch !== 'undefined' && priorTruth
          && SocM06AssessmentRelatedSearch.validateMapping({ tacticId: details.replacesTacticId,
            techniqueId: details.replacesTechniqueId, eventIds: priorTruth.evidenceEventIds, confidence: 0,
            status: 'needs_review', rationale: 'validated correction target' }, fixture);
        if (!prior) return false;
      }
    }
    if (type === 'attack_mapping_remove') {
      const mapping = typeof SocM06AssessmentRelatedSearch !== 'undefined'
        && SocM06AssessmentRelatedSearch.validateMapping({ tacticId: details.tacticId, techniqueId: details.techniqueId,
          eventIds: (refs.scenario.expectedTruth.supportedTechniques.find((item) => item.id === details.techniqueId)
            || refs.scenario.expectedTruth.unsupportedTechniques.find((item) => item.id === details.techniqueId))?.evidenceEventIds,
          confidence: 0, status: 'needs_review', rationale: 'validated removal target' }, fixture);
      if (!mapping || typeof details.reason !== 'string' || !details.reason.trim() || details.reason.length > 500) return false;
    }
    if (type === 'handoff' && !['draft', 'submitted', 'accepted', 'rejected'].includes(details.status)) return false;
    if (type === 'handoff_proposal' && (!/^M06-HANDOFF-\d{6}$/.test(details.handoffId || '')
      || !Array.isArray(details.eventIds) || details.eventIds.length < 1 || details.eventIds.length > 20
      || new Set(details.eventIds).size !== details.eventIds.length
      || !['alert', 'incident', 'rule'].includes(details.destination)
      || typeof details.rationale !== 'string' || !details.rationale.trim() || details.rationale.length > 1000
      || typeof details.recommendation !== 'string' || !details.recommendation.trim() || details.recommendation.length > 1000)) return false;
    if (type === 'handoff_status' && (!/^M06-HANDOFF-\d{6}$/.test(details.handoffId || '')
      || !Array.isArray(details.eventIds) || details.eventIds.length < 1 || details.eventIds.length > 20
      || new Set(details.eventIds).size !== details.eventIds.length || details.eventIds.some((id) => !refs.events.has(id))
      || !['proposed', 'in_review'].includes(details.fromStatus)
      || !['in_review', 'accepted', 'rejected'].includes(details.toStatus)
      || (details.fromStatus === 'in_review' && details.toStatus === 'in_review')
      || typeof details.note !== 'string' || details.note.length > 500)) return false;
    return true;
  }
  function validRecord(record, fixture) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
    if (!Number.isSafeInteger(record.sequence) || record.sequence < 1
      || record.id !== `${fixture.scenario.id}:ACTION-${String(record.sequence).padStart(6, '0')}`
      || !validTimestamp(record.timestamp) || !validDetails(record.type, record.details, fixture)) return false;
    return true;
  }
  function restoreHistory(history, nextSequence, fixture) {
    context(fixture);
    const accepted = (Array.isArray(history) ? history : []).filter((record) => validRecord(record, fixture)).map(clone);
    const unique = [...new Map(accepted.map((record) => [record.sequence, record])).values()].sort((a, b) => a.sequence - b.sequence).slice(-MAX_HISTORY);
    unique.forEach(deepFreeze);
    const max = accepted.reduce((value, record) => Math.max(value, record.sequence), 0);
    return { actionHistory: unique, nextActionSequence: Number.isSafeInteger(nextSequence) && nextSequence > max ? nextSequence : max + 1 };
  }
  function append(state, type, timestamp, details, fixture) {
    context(fixture);
    if (!validTimestamp(timestamp)) throw new Error('M06 action timestamp must be a canonical UTC ISO timestamp.');
    if (!validDetails(type, details, fixture)) throw new Error(`Invalid details for M06 action type: ${type}`);
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    const sequence = normalized.nextActionSequence;
    const record = deepFreeze({ id: `${fixture.scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`,
      sequence, type, timestamp, details: clone(details) });
    normalized.actionHistory = [...normalized.actionHistory, record].slice(-MAX_HISTORY);
    normalized.nextActionSequence = sequence + 1;
    return normalized;
  }
  return Object.freeze({ MAX_HISTORY, TYPES: Object.freeze(Object.keys(DETAIL_KEYS)), append, restoreHistory, validTimestamp, validRecord });
})();

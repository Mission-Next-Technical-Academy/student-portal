/* Bounded typed audit actions for the independent Module 07 assessment. */
const SocM07AssessmentActions = (() => {
  'use strict';

  const MAX_HISTORY = 200;
  const MAX_ITEMS = 500;
  const TYPES = Object.freeze(['message_review', 'artifact_review', 'network_review', 'pivot', 'scope_change', 'recipient_search', 'incident_link', 'evidence_change']);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }
  function canonicalTimestamp(value, scenario) {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString() === value
      && time >= Date.parse(scenario.start) && time <= Date.parse(scenario.end);
  }
  function refs(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario) throw new Error('M07 assessment fixture is required.');
    return {
      scenario,
      messages: new Set(scenario.messages.map((item) => item.id)),
      events: new Set([...scenario.networkEvents, ...scenario.deliveryEvents, ...scenario.recipientEvents,
        ...scenario.endpointProcessEvents].map((item) => item.id)),
      recipients: new Set(scenario.recipientGroups.flatMap((item) => item.recipientIds)),
      devices: new Set(scenario.recipientGroups.flatMap((item) => item.deviceIds)),
      evidence: new Set(evidenceRecords(scenario).map((item) => item.id)),
    };
  }
  function evidenceRecords(scenario) {
    const artifacts = scenario.messages.flatMap((message) => [
      ...message.urls.flatMap((url) => [url, ...url.redirects]), ...message.attachments,
    ]);
    return [
      ...scenario.messages.map((record) => ({ id: record.id, kind: 'message', label: record.subject })),
      ...artifacts.map((record) => ({ id: record.id, kind: 'artifact', label: record.fileName || record.original || record.url })),
      ...scenario.deliveryEvents.map((record) => ({ id: record.id, kind: 'delivery', label: `${record.recipientId} · ${record.status}`, recipientId: record.recipientId })),
      ...scenario.recipientEvents.map((record) => ({ id: record.id, kind: 'recipient', label: `${record.recipientId} · ${record.type}`, recipientId: record.recipientId, deviceId: record.deviceId })),
      ...scenario.networkEvents.map((record) => ({ id: record.id, kind: 'network', label: `${record.type} · ${record.domain || record.sni || record.url || record.destinationIp || record.id}`, recipientId: record.recipientId, deviceId: record.deviceId })),
      ...scenario.endpointProcessEvents.map((record) => ({ id: record.id, kind: 'process', label: `${record.processName} · ${record.deviceId}`, recipientId: record.recipientId, deviceId: record.deviceId })),
    ].filter((record) => typeof record.id === 'string');
  }
  function validDetails(type, details, fixture) {
    const allowed = refs(fixture);
    if (!TYPES.includes(type) || !details || typeof details !== 'object' || Array.isArray(details)) return false;
    const has = (key) => Object.prototype.hasOwnProperty.call(details, key);
    const only = (...keys) => Object.keys(details).every((key) => keys.includes(key));
    const text = (value, max = 500) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (type === 'message_review') return only('messageId', 'reviewed', 'note') && has('messageId') && allowed.messages.has(details.messageId)
      && typeof details.reviewed === 'boolean' && (!has('note') || details.note === '' || text(details.note));
    if (type === 'artifact_review') {
      const artifactIds = new Set(allowed.scenario.messages.flatMap((message) => [
        ...message.urls.flatMap((url) => [url.id, ...url.redirects.map((redirect) => redirect.id)]),
        ...message.attachments.map((attachment) => attachment.id),
      ]));
      return only('artifactId', 'reviewed', 'note') && artifactIds.has(details.artifactId)
        && typeof details.reviewed === 'boolean' && (!has('note') || details.note === '' || text(details.note));
    }
    if (type === 'network_review') return only('eventId', 'reviewed', 'note') && has('eventId') && allowed.events.has(details.eventId)
      && typeof details.reviewed === 'boolean' && (!has('note') || details.note === '' || text(details.note));
    if (type === 'pivot') return only('fromEventId', 'toEventId', 'field', 'value') && allowed.events.has(details.fromEventId)
      && allowed.events.has(details.toEventId) && details.fromEventId !== details.toEventId
      && ['recipientId', 'deviceId', 'domain', 'destinationIp', 'relatedEvent'].includes(details.field) && text(details.value, 300);
    if (type === 'scope_change') return only('recipientIds', 'deviceIds', 'reason')
      && Array.isArray(details.recipientIds) && details.recipientIds.length <= 100
      && new Set(details.recipientIds).size === details.recipientIds.length
      && details.recipientIds.every((id) => allowed.recipients.has(id))
      && Array.isArray(details.deviceIds) && details.deviceIds.length <= 100
      && new Set(details.deviceIds).size === details.deviceIds.length
      && details.deviceIds.every((id) => allowed.devices.has(id)) && text(details.reason, 500);
    if (type === 'recipient_search') {
      if (!only('query', 'delivery', 'interaction', 'limit', 'recipientIds', 'deviceIds')
        || typeof details.query !== 'string' || details.query.length > 100
        || !['all', 'delivered', 'blocked_at_gateway'].includes(details.delivery)
        || !['all', 'opened', 'clicked', 'no_interaction'].includes(details.interaction)
        || !Number.isInteger(details.limit) || details.limit < 1 || details.limit > 100
        || !Array.isArray(details.recipientIds) || !Array.isArray(details.deviceIds)) return false;
      const matches = searchRecipients(fixture, details).slice(0, details.limit);
      return JSON.stringify(details.recipientIds) === JSON.stringify(matches.map((row) => row.recipientId))
        && JSON.stringify(details.deviceIds) === JSON.stringify(matches.flatMap((row) => row.deviceId ? [row.deviceId] : []));
    }
    if (type === 'incident_link') {
      if (!only('operation', 'incidentId', 'title', 'summary', 'assessment', 'recipientIds', 'deviceIds', 'eventIds')
        || !['create', 'update', 'remove'].includes(details.operation)
        || !/^M07-INCIDENT-\d{4}$/.test(details.incidentId || '')
        || !Array.isArray(details.eventIds) || details.eventIds.length < (details.operation === 'remove' ? 0 : 1)
        || details.eventIds.length > 100 || new Set(details.eventIds).size !== details.eventIds.length
        || !details.eventIds.every((id) => allowed.evidence.has(id))) return false;
      if (details.operation === 'remove') return true;
      if (!text(details.title, 120) || !text(details.summary, 1000)
        || !['supported', 'unknown'].includes(details.assessment)
        || !Array.isArray(details.recipientIds) || details.recipientIds.length < 1 || details.recipientIds.length > 20
        || new Set(details.recipientIds).size !== details.recipientIds.length
        || !details.recipientIds.every((id) => allowed.recipients.has(id))
        || !Array.isArray(details.deviceIds) || details.deviceIds.length > 20
        || new Set(details.deviceIds).size !== details.deviceIds.length
        || !details.deviceIds.every((id) => allowed.devices.has(id))) return false;
      const scenario = fixture.scenario;
      const recipientDevices = new Set(scenario.recipientGroups
        .filter((group) => group.recipientIds.some((id) => details.recipientIds.includes(id)))
        .flatMap((group) => group.deviceIds));
      if (!details.deviceIds.every((id) => recipientDevices.has(id))) return false;
      const records = new Map(evidenceRecords(scenario).map((record) => [record.id, record]));
      return details.eventIds.every((id) => {
        const record = records.get(id);
        return (!record.recipientId || details.recipientIds.includes(record.recipientId))
          && (!record.deviceId || details.deviceIds.includes(record.deviceId));
      });
    }
    if (type === 'evidence_change') return only('operation', 'eventId', 'reason') && ['add', 'remove'].includes(details.operation)
      && allowed.evidence.has(details.eventId) && text(details.reason, 500);
    return false;
  }
  function append(state, type, timestamp, details, fixture) {
    const { scenario } = refs(fixture);
    if (!canonicalTimestamp(timestamp, scenario)) throw new Error('M07 action timestamp must be canonical UTC within the fixture window.');
    if (!validDetails(type, details, fixture)) throw new Error(`Invalid details for M07 action type: ${type}`);
    const next = SocM07AssessmentState.normalize(state, fixture);
    if (type === 'incident_link') {
      const exists = next.incidentLinks.some((item) => item.incidentId === details.incidentId);
      if ((details.operation === 'create' && exists) || (details.operation === 'update' && !exists)) {
        throw new Error(`Cannot ${details.operation} a missing or existing M07 incident.`);
      }
    }
    const sequence = next.nextActionSequence;
    const record = freeze({ id: `${scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`,
      sequence, type, timestamp, details: clone(details) });
    next.actionHistory = [...next.actionHistory, record].slice(-MAX_HISTORY);
    next.actionHistory.forEach(freeze);
    next.nextActionSequence = sequence + 1;
    apply(next, type, details);
    return next;
  }
  function validateHistory(history, fixture) {
    if (!Array.isArray(history)) return [];
    const { scenario } = refs(fixture);
    const seen = new Set();
    const valid = history.filter((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)
        || !Number.isSafeInteger(item.sequence) || item.sequence < 1
        || item.id !== `${scenario.id}:ACTION-${String(item.sequence).padStart(6, '0')}`
        || seen.has(item.sequence) || !canonicalTimestamp(item.timestamp, scenario)
        || !validDetails(item.type, item.details, fixture)) return false;
      seen.add(item.sequence);
      return true;
    }).sort((a, b) => a.sequence - b.sequence);
    return valid.slice(-MAX_HISTORY).map((item) => freeze({ id: item.id, sequence: item.sequence,
      type: item.type, timestamp: item.timestamp, details: clone(item.details) }));
  }
  function apply(state, type, details) {
    if (type === 'message_review') {
      state.reviewedMessageIds = toggle(state.reviewedMessageIds, details.messageId, details.reviewed, 100);
    } else if (type === 'artifact_review') {
      state.reviewedArtifactIds = toggle(state.reviewedArtifactIds, details.artifactId, details.reviewed, MAX_ITEMS);
    } else if (type === 'network_review') {
      state.reviewedNetworkEventIds = toggle(state.reviewedNetworkEventIds, details.eventId, details.reviewed, MAX_ITEMS);
    } else if (type === 'pivot') {
      state.pivots = [...state.pivots, clone(details)].slice(-MAX_ITEMS);
    } else if (type === 'scope_change') {
      state.scope = { recipientIds: [...details.recipientIds], deviceIds: [...details.deviceIds] };
    } else if (type === 'recipient_search') {
      state.scope = { recipientIds: [...details.recipientIds], deviceIds: [...details.deviceIds] };
      state.recipientSearch = { query: details.query, delivery: details.delivery,
        interaction: details.interaction, limit: details.limit };
    } else if (type === 'incident_link') {
      const rest = state.incidentLinks.filter((item) => item.incidentId !== details.incidentId);
      if (details.operation !== 'remove') rest.push(clone(details));
      state.incidentLinks = rest.slice(-200);
    } else if (type === 'evidence_change') {
      const rest = state.evidenceChanges.filter((item) => item.eventId !== details.eventId);
      if (details.operation === 'add') rest.push(clone(details));
      state.evidenceChanges = rest.slice(-200);
    }
  }
  function toggle(current, id, enabled, limit) {
    const values = current.filter((item) => item !== id);
    if (enabled) values.push(id);
    return values.slice(-limit);
  }
  function searchRecipients(fixture, filters = {}) {
    const scenario = fixture?.scenario;
    if (!scenario) return [];
    const query = String(filters.query || '').trim().toLowerCase().slice(0, 100);
    const delivery = filters.delivery || 'all';
    const interaction = filters.interaction || 'all';
    const limit = Number.isInteger(filters.limit) ? Math.min(100, Math.max(1, filters.limit)) : 100;
    const rows = scenario.deliveryEvents.map((event) => {
      const group = scenario.recipientGroups.find((item) => item.id === event.groupId);
      const recipientEvents = scenario.recipientEvents.filter((item) => item.recipientId === event.recipientId
        && item.messageId === event.messageId);
      const opened = recipientEvents.some((item) => ['open', 'open_and_link_click'].includes(item.type));
      const clicked = recipientEvents.some((item) => ['link_click', 'open_and_link_click'].includes(item.type));
      return { recipientId: event.recipientId, deviceId: group?.deviceIds[0] || '', messageId: event.messageId, deliveryEventId: event.id,
        groupId: event.groupId, delivery: event.status, timestamp: event.timestamp, opened, clicked,
        interactionEventIds: recipientEvents.map((item) => item.id) };
    }).filter((row) => {
      if (delivery !== 'all' && row.delivery !== delivery) return false;
      if (interaction === 'opened' && !row.opened) return false;
      if (interaction === 'clicked' && !row.clicked) return false;
      if (interaction === 'no_interaction' && (row.opened || row.clicked)) return false;
      return !query || [row.recipientId, row.deviceId, row.messageId, row.delivery]
        .some((value) => value.toLowerCase().includes(query));
    });
    return rows.slice(0, limit);
  }
  return Object.freeze({ MAX_HISTORY, TYPES, append, validDetails, canonicalTimestamp, validateHistory, searchRecipients,
    evidenceRecords: (fixture) => fixture?.scenario ? evidenceRecords(fixture.scenario) : [] });
})();

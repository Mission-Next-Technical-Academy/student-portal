/* Typed, bounded action history for the independent Module 05 assessment. */
const SocM05AssessmentActions = (() => {
  'use strict';

  const MAX_HISTORY = 200;
  const DETAIL_KEYS = Object.freeze({
    device_review: ['deviceId', 'status', 'note'],
    event_review: ['eventId', 'status', 'note'],
    analysis_note: ['text', 'relatedDeviceIds', 'relatedEventIds'],
    analysis_update: ['field', 'value', 'reason'],
    evidence_selection: ['deviceIds', 'eventIds', 'reason'],
    evidence_package_preserved: ['deviceId', 'eventIds', 'hashes'],
    evidence_preservation_request: ['deviceIds', 'eventIds', 'reason', 'requestedBy'],
    endpoint_isolation_request: ['deviceId', 'reason', 'requestedBy', 'status'],
    endpoint_quarantine_request: ['deviceId', 'filePath', 'sha256', 'reason', 'requestedBy', 'status'],
    edr_handoff: ['deviceIds', 'eventIds', 'hashes', 'summary', 'owner', 'recipient', 'recommendation', 'status'],
    edr_handoff_status: ['handoffId', 'status', 'updatedBy'],
    case_update: ['field', 'value', 'reason'],
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function validTimestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && new Date(parsed).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'));
  }

  function validateDetails(type, details) {
    const allowed = DETAIL_KEYS[type];
    if (!allowed) throw new Error(`Unsupported M05 action type: ${type}`);
    if (!details || typeof details !== 'object' || Array.isArray(details)) throw new Error('M05 action details must be an object.');
    const keys = Object.keys(details);
    if (!keys.length || keys.some((key) => !allowed.includes(key))) throw new Error(`Invalid details for M05 action type: ${type}`);
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string' && value.trim()) continue;
      if (Array.isArray(value) && value.length && value.every((item) => typeof item === 'string' && item.trim())) continue;
      throw new Error(`M05 action detail ${key} must be a non-empty string or string array.`);
    }
    return clone(details);
  }

  function append(state, type, timestamp, details, fixture) {
    if (!fixture?.scenario?.id) throw new Error('M05 assessment fixture is required to create an action record.');
    if (!validTimestamp(timestamp)) throw new Error('M05 action timestamp must be a canonical UTC ISO timestamp.');
    const safeDetails = validateDetails(type, details);
    if (type === 'endpoint_isolation_request' || type === 'endpoint_quarantine_request') {
      if (safeDetails.status !== 'pending_approval' || !safeDetails.reason.trim() || !safeDetails.requestedBy.trim()
        || !fixture.scenario.devices.some((device) => device.id === safeDetails.deviceId)) {
        throw new Error('Endpoint response requests require a known device, reason, requester, and pending approval status.');
      }
      if (type === 'endpoint_quarantine_request' && !fixture.scenario.telemetry.some((event) =>
        event.deviceId === safeDetails.deviceId && event.filePath === safeDetails.filePath && event.sha256 === safeDetails.sha256)) {
        throw new Error('Quarantine requests must reference a known file path and SHA-256 on the selected fixture device.');
      }
    }
    if (type === 'evidence_package_preserved') {
      if (!fixture.scenario.devices.some((device) => device.id === safeDetails.deviceId)
        || !Array.isArray(safeDetails.eventIds) || !safeDetails.eventIds.length
        || !Array.isArray(safeDetails.hashes)
        || safeDetails.eventIds.some((id) => !fixture.scenario.telemetry.some((event) => event.id === id && event.deviceId === safeDetails.deviceId))
        || safeDetails.hashes.some((hash) => !/^[a-f0-9]{64}$/.test(hash)
          || !safeDetails.eventIds.some((id) => fixture.scenario.telemetry.some((event) => event.id === id && event.deviceId === safeDetails.deviceId && event.sha256 === hash)))) {
        throw new Error('Evidence package references must belong to its fixture device and contain valid SHA-256 hashes.');
      }
    }
    if (type === 'edr_handoff') {
      const knownDevices = new Set(fixture.scenario.devices.map((device) => device.id));
      const eventById = new Map(fixture.scenario.telemetry.map((event) => [event.id, event]));
      if (!Array.isArray(safeDetails.deviceIds) || !safeDetails.deviceIds.length || safeDetails.deviceIds.length > 20
        || !safeDetails.deviceIds.every((id) => knownDevices.has(id))
        || !Array.isArray(safeDetails.eventIds) || !safeDetails.eventIds.length || safeDetails.eventIds.length > 100
        || !safeDetails.eventIds.every((id) => eventById.has(id) && safeDetails.deviceIds.includes(eventById.get(id).deviceId))
        || !Array.isArray(safeDetails.hashes) || safeDetails.hashes.length > 100
        || !safeDetails.hashes.every((hash) => /^[a-f0-9]{64}$/.test(hash)
          && safeDetails.eventIds.some((id) => eventById.get(id)?.sha256 === hash))
        || !safeDetails.summary.trim() || safeDetails.summary.length > 500
        || !safeDetails.owner.trim() || safeDetails.owner.length > 120
        || !safeDetails.recipient.trim() || safeDetails.recipient.length > 120
        || !safeDetails.recommendation.trim() || safeDetails.recommendation.length > 500
        || safeDetails.status !== 'submitted') throw new Error('EDR handoff requires concise details and known fixture evidence.');
    }
    if (type === 'edr_handoff_status' && (!safeDetails.handoffId.trim() || !safeDetails.updatedBy.trim()
      || !['accepted', 'in_progress', 'completed', 'rejected'].includes(safeDetails.status)
      || !(state?.edrHandoffs || []).some((handoff) => handoff.id === safeDetails.handoffId))) {
      throw new Error('Handoff status updates must reference an existing handoff and a supported status.');
    }
    const normalized = SocM05AssessmentState.normalize(state, fixture);
    const sequence = normalized.nextActionSequence;
    const record = {
      id: `${fixture.scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`,
      sequence,
      type,
      timestamp,
      details: safeDetails,
    };
    deepFreeze(record);
    normalized.actionHistory = [...normalized.actionHistory, record].slice(-MAX_HISTORY);
    if (type === 'endpoint_isolation_request' || type === 'endpoint_quarantine_request') {
      const request = deepFreeze({ id: record.id, sequence, type, status: 'pending_approval', ...safeDetails });
      normalized.approvalRequests = [...normalized.approvalRequests, request].slice(-MAX_HISTORY);
    }
    if (type === 'edr_handoff') {
      normalized.edrHandoffs = [...normalized.edrHandoffs, deepFreeze({ id: record.id, sequence, ...safeDetails })].slice(-50);
    }
    if (type === 'edr_handoff_status') {
      normalized.edrHandoffs = normalized.edrHandoffs.map((handoff) => handoff.id === safeDetails.handoffId
        ? deepFreeze({ ...handoff, status: safeDetails.status }) : handoff);
    }
    normalized.nextActionSequence = sequence + 1;
    return normalized;
  }

  return Object.freeze({ MAX_HISTORY, TYPES: Object.freeze(Object.keys(DETAIL_KEYS)), append, validTimestamp });
})();

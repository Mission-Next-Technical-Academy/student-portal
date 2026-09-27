/* Versioned persistence contract for the independent Module 05 assessment. */
const SocM05AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-05';
  const EMPTY_DEFAULTS = Object.freeze({
    selectedDeviceIds: [],
    selectedEventIds: [],
    evidencePackage: null,
    approvalRequests: [],
    edrHandoffs: [],
    reviewedRecords: [],
    actionHistory: [],
    nextActionSequence: 1,
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

  function validEvidencePackage(value, fixture) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !fixture?.scenario) return false;
    const { deviceId, eventIds, hashes } = value;
    if (!fixture.scenario.devices.some((device) => device.id === deviceId)
      || !Array.isArray(eventIds) || !eventIds.length || eventIds.length > 500
      || !Array.isArray(hashes) || hashes.length > 500
      || eventIds.some((id) => typeof id !== 'string' || !fixture.scenario.telemetry.some((event) => event.id === id && event.deviceId === deviceId))
      || hashes.some((hash) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)
        || !eventIds.some((id) => fixture.scenario.telemetry.some((event) => event.id === id && event.deviceId === deviceId && event.sha256 === hash)))) return false;
    return true;
  }

  function validApprovalRequest(value, fixture) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !fixture?.scenario) return false;
    const { id, sequence, type, status, deviceId, reason, requestedBy, filePath, sha256 } = value;
    if (typeof id !== 'string' || !Number.isSafeInteger(sequence) || sequence < 1
      || id !== `${fixture.scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`
      || !['endpoint_isolation_request', 'endpoint_quarantine_request'].includes(type)
      || status !== 'pending_approval' || !fixture.scenario.devices.some((device) => device.id === deviceId)
      || typeof reason !== 'string' || !reason.trim() || typeof requestedBy !== 'string' || !requestedBy.trim()) return false;
    if (type === 'endpoint_isolation_request') return !filePath && !sha256;
    return typeof filePath === 'string' && typeof sha256 === 'string'
      && fixture.scenario.telemetry.some((event) => event.deviceId === deviceId && event.filePath === filePath && event.sha256 === sha256);
  }

  function validEdrHandoff(value, fixture) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !fixture?.scenario) return false;
    const { id, sequence, deviceIds, eventIds, hashes, summary, owner, recipient, recommendation, status } = value;
    const devices = new Set(fixture.scenario.devices.map((device) => device.id));
    const events = new Map(fixture.scenario.telemetry.map((event) => [event.id, event]));
    return Number.isSafeInteger(sequence) && sequence > 0
      && id === `${fixture.scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`
      && Array.isArray(deviceIds) && deviceIds.length > 0 && deviceIds.length <= 20 && deviceIds.every((item) => devices.has(item))
      && Array.isArray(eventIds) && eventIds.length > 0 && eventIds.length <= 100
      && eventIds.every((item) => events.has(item) && deviceIds.includes(events.get(item).deviceId))
      && Array.isArray(hashes) && hashes.length <= 100
      && hashes.every((item) => typeof item === 'string' && /^[a-f0-9]{64}$/.test(item) && eventIds.some((eventId) => events.get(eventId)?.sha256 === item))
      && typeof summary === 'string' && !!summary.trim() && summary.length <= 500
      && typeof owner === 'string' && !!owner.trim() && owner.length <= 120
      && typeof recipient === 'string' && !!recipient.trim() && recipient.length <= 120
      && typeof recommendation === 'string' && !!recommendation.trim() && recommendation.length <= 500
      && ['submitted', 'accepted', 'in_progress', 'completed', 'rejected'].includes(status);
  }

  function validAuditRecord(value, fixture) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !fixture?.scenario) return false;
    const { id, sequence, type, timestamp, details } = value;
    const types = ['device_review', 'event_review', 'analysis_note', 'analysis_update', 'evidence_selection',
      'evidence_package_preserved', 'evidence_preservation_request', 'endpoint_isolation_request',
      'endpoint_quarantine_request', 'edr_handoff', 'edr_handoff_status', 'case_update'];
    const detailKeys = {
      device_review: ['deviceId', 'status', 'note'], event_review: ['eventId', 'status', 'note'],
      analysis_note: ['text', 'relatedDeviceIds', 'relatedEventIds'], analysis_update: ['field', 'value', 'reason'],
      evidence_selection: ['deviceIds', 'eventIds', 'reason'], evidence_package_preserved: ['deviceId', 'eventIds', 'hashes'],
      evidence_preservation_request: ['deviceIds', 'eventIds', 'reason', 'requestedBy'],
      endpoint_isolation_request: ['deviceId', 'reason', 'requestedBy', 'status'],
      endpoint_quarantine_request: ['deviceId', 'filePath', 'sha256', 'reason', 'requestedBy', 'status'],
      edr_handoff: ['deviceIds', 'eventIds', 'hashes', 'summary', 'owner', 'recipient', 'recommendation', 'status'],
      edr_handoff_status: ['handoffId', 'status', 'updatedBy'], case_update: ['field', 'value', 'reason'],
    };
    if (!Number.isSafeInteger(sequence) || sequence < 1
      || id !== `${fixture.scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`
      || !types.includes(type) || !details || typeof details !== 'object' || Array.isArray(details)
      || !Object.keys(details).length || Object.keys(details).some((key) => !detailKeys[type].includes(key))
      || Object.values(details).some((item) => !(typeof item === 'string' && item.trim())
        && !(Array.isArray(item) && item.length && item.every((entry) => typeof entry === 'string' && entry.trim())))
      || typeof timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(timestamp)) return false;
    const time = Date.parse(timestamp);
    if (!Number.isFinite(time) || new Date(time).toISOString() !== (timestamp.includes('.') ? timestamp : timestamp.replace('Z', '.000Z'))) return false;
    const devices = new Set(fixture.scenario.devices.map((device) => device.id));
    const events = new Map(fixture.scenario.telemetry.map((event) => [event.id, event]));
    if (details.deviceId !== undefined && !devices.has(details.deviceId)) return false;
    if (details.deviceIds !== undefined && (!Array.isArray(details.deviceIds) || !details.deviceIds.length || !details.deviceIds.every((item) => devices.has(item)))) return false;
    if (details.eventId !== undefined && !events.has(details.eventId)) return false;
    if (details.eventIds !== undefined && (!Array.isArray(details.eventIds) || !details.eventIds.length || !details.eventIds.every((item) => events.has(item)))) return false;
    if (details.relatedEventIds !== undefined && (!Array.isArray(details.relatedEventIds) || !details.relatedEventIds.every((item) => events.has(item)))) return false;
    if (details.hashes !== undefined && (!Array.isArray(details.hashes) || details.hashes.some((hash) => typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)
      || !fixture.scenario.telemetry.some((event) => event.sha256 === hash)))) return false;
    if (type === 'endpoint_isolation_request' || type === 'endpoint_quarantine_request') {
      return validApprovalRequest({ ...details, id, sequence, type }, fixture);
    }
    if (type === 'edr_handoff') return validEdrHandoff({ ...details, id, sequence }, fixture);
    if (type === 'evidence_package_preserved') return validEvidencePackage(details, fixture);
    if (type === 'edr_handoff_status') {
      const handoffSequence = Number(details.handoffId?.match(/:ACTION-(\d{6})$/)?.[1]);
      return Number.isSafeInteger(handoffSequence) && handoffSequence < sequence
        && ['accepted', 'in_progress', 'completed', 'rejected'].includes(details.status);
    }
    return true;
  }

  function normalize(source, fixture) {
    const legacy = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const assessment = { ...clone(EMPTY_DEFAULTS), ...legacy };
    assessment.selectedDeviceIds = Array.isArray(legacy.selectedDeviceIds)
      ? legacy.selectedDeviceIds.filter((id) => typeof id === 'string').slice(0, 100) : [];
    assessment.selectedEventIds = Array.isArray(legacy.selectedEventIds)
      ? legacy.selectedEventIds.filter((id) => typeof id === 'string').slice(0, 500) : [];
    assessment.evidencePackage = validEvidencePackage(legacy.evidencePackage, fixture)
      ? clone(legacy.evidencePackage) : null;
    assessment.approvalRequests = (Array.isArray(legacy.approvalRequests)
      ? legacy.approvalRequests.filter((item) => validApprovalRequest(item, fixture)).map(clone)
      : []).slice(-200);
    assessment.edrHandoffs = (Array.isArray(legacy.edrHandoffs)
      ? legacy.edrHandoffs.filter((item) => validEdrHandoff(item, fixture)).map(clone)
      : []).slice(-50);
    assessment.reviewedRecords = (Array.isArray(legacy.reviewedRecords)
      ? legacy.reviewedRecords.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(clone)
      : []).slice(-200);
    assessment.actionHistory = (Array.isArray(legacy.actionHistory)
      ? legacy.actionHistory.filter((item) => validAuditRecord(item, fixture)).map(clone)
      : []).slice(-200);
    assessment.actionHistory.forEach(deepFreeze);
    assessment.approvalRequests.forEach(deepFreeze);
    assessment.edrHandoffs.forEach(deepFreeze);
    const lastSequence = [...assessment.actionHistory, ...assessment.approvalRequests, ...assessment.edrHandoffs].reduce((max, item) =>
      Number.isSafeInteger(item.sequence) && item.sequence > max ? item.sequence : max, 0);
    assessment.nextActionSequence = Number.isSafeInteger(legacy.nextActionSequence)
      && legacy.nextActionSequence > lastSequence ? legacy.nextActionSequence : lastSequence + 1;
    assessment.schemaVersion = VERSION;
    assessment.scenarioId = fixture?.scenario?.id || '';
    return assessment;
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M05 assessment state.');
    return LabRuntime;
  }

  function load(user, fixture) {
    const labId = fixture?.scenario?.stateKey;
    if (typeof labId !== 'string' || !labId) throw new Error('M05 assessment fixture stateKey is required.');
    const current = runtime().loadCaseState(labId, MODULE_KEY, user, {});
    const normalized = normalize(current, fixture);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) runtime().saveCaseState(labId, MODULE_KEY, user, normalized);
    return normalized;
  }

  function save(user, state, fixture) {
    const labId = fixture?.scenario?.stateKey;
    if (typeof labId !== 'string' || !labId) throw new Error('M05 assessment fixture stateKey is required.');
    return runtime().saveCaseState(labId, MODULE_KEY, user, normalize(state, fixture));
  }

  function reset(user, fixture) {
    const labId = fixture?.scenario?.stateKey;
    if (typeof labId !== 'string' || !labId) throw new Error('M05 assessment fixture stateKey is required.');
    const fresh = runtime().resetCaseState(labId, MODULE_KEY, user, {});
    return runtime().saveCaseState(labId, MODULE_KEY, user, normalize(fresh, fixture));
  }

  return Object.freeze({ VERSION, MODULE_KEY, EMPTY_DEFAULTS: clone(EMPTY_DEFAULTS), normalize, validApprovalRequest, validEdrHandoff, load, save, reset });
})();

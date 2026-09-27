/* Typed, fixture-bounded audit actions for the independent Module 08 assessment. */
const SocM08AssessmentActions = (() => {
  'use strict';

  const MAX_HISTORY = 500;
  const MAX_RECORDS = 500;
  const TYPES = Object.freeze(['finding_review', 'remediation_decision', 'remediation_transition', 'incident_link', 'risk_acceptance', 'escalation']);
  const REMEDIATION_STATUSES = Object.freeze(['open', 'in-progress', 'accepted-risk', 'resolved']);
  const ALLOWED_TRANSITIONS = Object.freeze({
    open: Object.freeze(['in-progress', 'accepted-risk']),
    'in-progress': Object.freeze(['open', 'accepted-risk', 'resolved']),
    'accepted-risk': Object.freeze(['open', 'in-progress', 'resolved']),
    resolved: Object.freeze(['open']),
  });

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }
  function refs(fixture) {
    const scenario = fixture?.scenario;
    if (!scenario?.id || !scenario.stateKey) throw new Error('M08 assessment fixture is required.');
    const findings = new Map(scenario.findings.map((finding) => [finding.id, finding]));
    const evidenceByFinding = new Map();
    for (const evidence of scenario.findingEvidence) {
      if (!evidenceByFinding.has(evidence.findingId)) evidenceByFinding.set(evidence.findingId, new Set());
      evidenceByFinding.get(evidence.findingId).add(evidence.id);
    }
    const assetEvidence = new Map();
    for (const evidence of scenario.assetEvidence) {
      if (!assetEvidence.has(evidence.assetId)) assetEvidence.set(evidence.assetId, new Set());
      assetEvidence.get(evidence.assetId).add(evidence.id);
    }
    const assets = new Map(scenario.assetInventory.map((asset) => [asset.assetId, asset]));
    return { scenario, findings, evidenceByFinding, assetEvidence, assets };
  }
  function canonicalTimestamp(value, scenario) {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString() === value
      && time >= Date.parse(scenario.start) && time <= Date.parse(scenario.end);
  }
  function text(value, min = 1, max = 500) {
    return typeof value === 'string' && value.trim().length >= min && value.length <= max;
  }
  function validDetails(type, details, fixture) {
    if (!TYPES.includes(type) || !details || typeof details !== 'object' || Array.isArray(details)) return false;
    const { scenario, findings, evidenceByFinding, assetEvidence, assets } = refs(fixture);
    const finding = findings.get(details.findingId);
    if (!finding) return false;
    const evidenceIds = evidenceByFinding.get(details.findingId) || new Set();
    const validEvidence = (ids, allowedEvidence, required = true) => Array.isArray(ids) && ids.length <= 20
      && (!required || ids.length > 0) && new Set(ids).size === ids.length
      && ids.every((id) => allowedEvidence.has(id));
    const only = (...keys) => Object.keys(details).every((key) => keys.includes(key));
    if (type === 'finding_review') return only('findingId', 'status', 'evidenceIds', 'notes')
      && ['reviewed', 'needs-validation', 'not-applicable'].includes(details.status)
      && validEvidence(details.evidenceIds, evidenceIds)
      && (details.notes === undefined || details.notes === '' || text(details.notes, 1, 1000));
    if (type === 'incident_link') {
      const incident = scenario.incidents.find((item) => item.id === details.incidentId);
      const allowedEvidence = new Set((scenario.incidentEvidence || [])
        .filter((item) => item.incidentId === details.incidentId && item.findingId === details.findingId)
        .map((item) => item.id));
      return only('findingId', 'incidentId', 'evidenceIds', 'rationale')
        && Boolean(incident?.findingIds.includes(details.findingId))
        && text(details.rationale, 10, 500)
        && validEvidence(details.evidenceIds, allowedEvidence);
    }
    if (type === 'risk_acceptance') {
      const disposition = (scenario.riskAcceptanceDispositions || [])
        .find((item) => item.findingId === details.findingId && item.id === details.dispositionId
          && item.status === 'explicitly-supported');
      const allowedEvidence = new Set((scenario.riskAcceptanceEvidence || [])
        .filter((item) => item.findingId === details.findingId && item.dispositionId === details.dispositionId)
        .map((item) => item.id));
      return only('findingId', 'dispositionId', 'rationale', 'evidenceIds')
        && Boolean(disposition) && text(details.rationale, 10, 500)
        && validEvidence(details.evidenceIds, allowedEvidence);
    }
    if (type === 'escalation') {
      const route = (scenario.escalationRoutes || []).find((item) => item.id === details.routeId);
      const asset = assets.get(finding.assetId);
      const eligibleOwners = new Set(scenario.assetInventory.map((item) => item.ownerId));
      const allowedEvidence = new Set([
        ...evidenceIds,
        ...(assetEvidence.get(finding.assetId) || []),
      ]);
      const routeEvidence = new Set([
        ...scenario.findingEvidence.filter((item) => item.findingId === finding.id
          && route?.evidenceKinds.includes(item.kind)).map((item) => item.id),
        ...scenario.assetEvidence.filter((item) => item.assetId === finding.assetId
          && route?.evidenceKinds.includes(item.kind)).map((item) => item.id),
      ]);
      return only('findingId', 'routeId', 'ownerId', 'dueDate', 'rationale', 'evidenceIds')
        && Boolean(route && asset && eligibleOwners.has(details.ownerId))
        && typeof details.dueDate === 'string' && /^\d{4}-\d\d-\d\d$/.test(details.dueDate)
        && Number.isFinite(Date.parse(`${details.dueDate}T00:00:00Z`))
        && new Date(`${details.dueDate}T00:00:00Z`).toISOString().slice(0, 10) === details.dueDate
        && details.dueDate >= scenario.fixedAt.slice(0, 10)
        && text(details.rationale, 10, 500)
        && validEvidence(details.evidenceIds, allowedEvidence)
        && details.evidenceIds.some((id) => routeEvidence.has(id));
    }
    if (type === 'remediation_transition') {
      return only('findingId', 'priority', 'fromStatus', 'toStatus', 'ownerId', 'dueDate', 'rationale', 'evidenceIds', 'transitionRationale')
        && ['critical', 'high', 'medium', 'low'].includes(details.priority)
        && REMEDIATION_STATUSES.includes(details.fromStatus) && REMEDIATION_STATUSES.includes(details.toStatus)
        && ALLOWED_TRANSITIONS[details.fromStatus]?.includes(details.toStatus)
        && scenario.assetInventory.some((asset) => asset.ownerId === details.ownerId)
        && typeof details.dueDate === 'string' && /^\d{4}-\d\d-\d\d$/.test(details.dueDate)
        && Number.isFinite(Date.parse(`${details.dueDate}T00:00:00Z`))
        && new Date(`${details.dueDate}T00:00:00Z`).toISOString().slice(0, 10) === details.dueDate
        && details.dueDate >= scenario.fixedAt.slice(0, 10)
        && text(details.rationale, 10, 1000) && text(details.transitionRationale, 10, 1000)
        && validEvidence(details.evidenceIds, new Set([...evidenceIds, ...(assetEvidence.get(finding.assetId) || [])]));
    }
    return only('findingId', 'priority', 'status', 'ownerId', 'dueDate', 'rationale', 'evidenceIds')
      && ['critical', 'high', 'medium', 'low'].includes(details.priority)
      && REMEDIATION_STATUSES.includes(details.status)
      && scenario.assetInventory.some((asset) => asset.ownerId === details.ownerId)
      && typeof details.dueDate === 'string' && /^\d{4}-\d\d-\d\d$/.test(details.dueDate)
      && Number.isFinite(Date.parse(`${details.dueDate}T00:00:00Z`))
      && new Date(`${details.dueDate}T00:00:00Z`).toISOString().slice(0, 10) === details.dueDate
      && details.dueDate >= scenario.fixedAt.slice(0, 10)
      && text(details.rationale, 10, 1000)
      && validEvidence(details.evidenceIds, new Set([...evidenceIds, ...(assetEvidence.get(finding.assetId) || [])]));
  }
  function validTransition(details, currentDecision) {
    return Boolean(currentDecision && details.findingId === currentDecision.findingId
      && details.fromStatus === currentDecision.status
      && details.priority === currentDecision.priority && details.ownerId === currentDecision.ownerId
      && details.dueDate === currentDecision.dueDate && details.rationale === currentDecision.rationale
      && JSON.stringify(details.evidenceIds) === JSON.stringify(currentDecision.evidenceIds));
  }
  function append(state, type, timestamp, details, fixture) {
    const { scenario } = refs(fixture);
    if (!canonicalTimestamp(timestamp, scenario)) throw new Error('M08 action timestamp must be canonical UTC within the fixture window.');
    if (!validDetails(type, details, fixture)) throw new Error(`Invalid details for M08 action type: ${type}`);
    const next = SocM08AssessmentState.normalize(state, fixture);
    if (type === 'remediation_transition') {
      const current = [...next.remediationDecisions].reverse().find((item) => item.findingId === details.findingId);
      if (!validTransition(details, current)) throw new Error('Remediation transition does not match the current decision state.');
    }
    const sequence = next.nextActionSequence;
    const record = freeze({ id: `${scenario.id}:ACTION-${String(sequence).padStart(6, '0')}`,
      sequence, type, timestamp, details: clone(details) });
    next.actionHistory = [...next.actionHistory, record].slice(-MAX_HISTORY);
    next.actionHistory.forEach(freeze);
    if (type === 'finding_review') {
      next.findingReviews = [...next.findingReviews.filter((item) => item.findingId !== details.findingId),
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
    } else if (type === 'remediation_decision') {
      next.remediationDecisions = [...next.remediationDecisions,
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
    } else if (type === 'remediation_transition') {
      next.remediationTransitions = [...next.remediationTransitions,
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
      const index = next.remediationDecisions.map((item) => item.findingId).lastIndexOf(details.findingId);
      next.remediationDecisions[index] = { ...next.remediationDecisions[index], status: details.toStatus,
        actionId: record.id, timestamp };
    } else if (type === 'incident_link') {
      next.incidentLinks = [...next.incidentLinks,
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
    } else if (type === 'risk_acceptance') {
      next.riskAcceptances = [...next.riskAcceptances,
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
    } else {
      next.escalations = [...next.escalations,
        { ...clone(details), actionId: record.id, timestamp }].slice(-MAX_RECORDS);
    }
    next.nextActionSequence = sequence + 1;
    return next;
  }
  return Object.freeze({ MAX_HISTORY, MAX_RECORDS, TYPES, REMEDIATION_STATUSES, ALLOWED_TRANSITIONS,
    append, validDetails, validTransition, canonicalTimestamp });
})();

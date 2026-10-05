/* Pure chain, scope, and evidence extraction for the independent Module 07 assessment. */
const SocM07AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'confirmed-chain', label: 'Correlate message interaction with DNS and TLS evidence' },
    { id: 'delivery-scope', label: 'Separate delivered and gateway-blocked recipients' },
    { id: 'noise-rejection', label: 'Keep unrelated benign activity outside the incident scope' },
    { id: 'unknown-boundaries', label: 'Preserve unknown endpoint and credential outcomes' },
    { id: 'incident-evidence', label: 'Preserve fixture evidence in a supported incident record' },
  ].map(Object.freeze));

  const list = (value) => Array.isArray(value) ? value : [];
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value))];

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const assessment = record(state) ? state : {};
    const history = list(assessment.actionHistory).filter(record);
    const events = [...list(scenario?.deliveryEvents), ...list(scenario?.recipientEvents),
      ...list(scenario?.networkEvents), ...list(scenario?.endpointProcessEvents)];
    const eventById = new Map(events.filter((item) => typeof item.id === 'string').map((item) => [item.id, item]));
    const evidenceById = new Map((typeof SocM07AssessmentActions !== 'undefined'
      ? SocM07AssessmentActions.evidenceRecords(fixture) : []).map((item) => [item.id, item]));
    const criteria = [];
    const add = (id, awarded, evidenceIds) => criteria.push({
      id, awarded: Boolean(awarded), evidenceIds: unique(evidenceIds),
      finding: awarded ? 'supported' : 'incomplete',
    });
    const truth = scenario?.expectedTruth;
    if (!scenario || !truth) {
      RUBRIC.forEach(({ id }) => add(id, false, []));
      return { rubricVersion: 1, criteria };
    }

    const validRefs = (ids) => unique(list(ids)).filter((id) => evidenceById.has(id));
    const eventRefs = (ids) => validRefs(ids).filter((id) => eventById.has(id));
    const chain = truth.incidentChain || [];
    const confirmedSteps = chain.filter((step) => step.status === 'confirmed' && step.evidence);
    const confirmedIds = confirmedSteps.map((step) => step.evidence);
    const pivotPairs = new Set(history.filter((item) => item.type === 'pivot' && record(item.details))
      .map((item) => `${item.details.fromEventId}\u0000${item.details.toEventId}`));
    const validPivot = (from, to) => {
      const left = eventById.get(from);
      const right = eventById.get(to);
      if (!left || !right || !pivotPairs.has(`${from}\u0000${to}`)) return false;
      return (right.relatedRecipientEventId === from)
        || (right.relatedDnsEventId === from)
        || (right.relatedTlsEventId === from)
        || (right.relatedProxyEventId === from)
        || (left.relatedRecipientEventId === to)
        || (left.relatedDnsEventId === to)
        || (left.relatedTlsEventId === to)
        || (left.relatedProxyEventId === to);
    };
    const chainCoverage = confirmedSteps.map((step) => {
      const evidence = eventById.get(step.evidence);
      if (!evidence) return false;
      const direct = history.some((item) => item.type === 'network_review'
        && item.details?.eventId === step.evidence && item.details.reviewed)
        || history.some((item) => item.type === 'evidence_change'
          && item.details?.eventId === step.evidence && item.details.operation === 'add');
      const pivoted = events.some((candidate) => eventById.has(candidate.id)
        && validPivot(candidate.id, step.evidence));
      return direct || pivoted;
    });
    add('confirmed-chain', confirmedSteps.length > 0 && chainCoverage.every(Boolean),
      confirmedIds.filter((id, index) => chainCoverage[index]));

    const delivered = truth.incidentChain.find((step) => step.step === 'message_delivery' && step.status === 'confirmed');
    const blockedEvent = list(scenario.deliveryEvents).find((event) => event.status === 'blocked_at_gateway');
    const deliveredEvidence = delivered?.evidence;
    const deliveredRecord = list(scenario.deliveryEvents).find((event) => event.recipientId === delivered?.recipientIds?.[0]
      && event.status === 'delivered');
    const deliveredReviewed = deliveredRecord && history.some((item) => item.type === 'evidence_change'
      && item.details?.eventId === deliveredRecord.id && item.details.operation === 'add');
    const blockedReviewed = blockedEvent && history.some((item) => item.type === 'evidence_change'
      && item.details?.eventId === blockedEvent.id && item.details.operation === 'add');
    add('delivery-scope', Boolean(deliveredReviewed && blockedReviewed),
      [deliveredRecord?.id, blockedEvent?.id].filter((id, index) => id && (index === 0 ? deliveredReviewed : blockedReviewed)));

    const benign = events.filter((event) => event.benignLookalike === true).map((event) => event.id);
    const primaryRecipientIds = new Set(confirmedSteps.flatMap((step) => list(step.recipientIds)));
    const incidentEntries = list(assessment.incidentLinks).filter(record);
    const latestIncident = incidentEntries.find((incident) => {
      const matchingAction = history.some((item) => item.type === 'incident_link'
        && ['create', 'update'].includes(item.details?.operation)
        && item.details.incidentId === incident.incidentId
        && JSON.stringify(item.details.eventIds) === JSON.stringify(incident.eventIds));
      return matchingAction;
    });
    const incidentEventIds = eventRefs(latestIncident?.eventIds);
    const incidentHasNoise = incidentEventIds.some((id) => benign.includes(id));
    const incidentRecipients = new Set(list(latestIncident?.recipientIds));
    const unrelatedRecipient = [...incidentRecipients].some((id) => !primaryRecipientIds.has(id));
    const benignReviewed = benign.some((id) => history.some((item) => item.type === 'network_review'
      && item.details?.eventId === id && item.details.reviewed));
    add('noise-rejection', Boolean(latestIncident && !incidentHasNoise && !unrelatedRecipient && benignReviewed),
      [...incidentEventIds.filter((id) => !benign.includes(id)), ...(benignReviewed ? benign.filter((id) => history.some((item) => item.type === 'network_review' && item.details?.eventId === id && item.details.reviewed)) : [])]);

    const unverifiedSteps = chain.filter((step) => step.status === 'unverified');
    const unknownAssessment = latestIncident?.assessment === 'unknown'
      || /\bunknown\b|\bunverified\b|\bnot established\b|\bnot confirmed\b/i.test(latestIncident?.summary || '');
    const overclaim = /(?:execution|credential(?:s)? compromise)\s+(?:is\s+)?(?:confirmed|proven|established)/i.test(latestIncident?.summary || '');
    add('unknown-boundaries', unverifiedSteps.length >= 2 && Boolean(latestIncident)
      && unknownAssessment && !overclaim, unverifiedSteps.map((step) => step.evidence).filter(Boolean));

    const requiredChainIds = confirmedIds;
    const preservedIds = new Set(history.filter((item) => item.type === 'evidence_change'
      && item.details?.operation === 'add').map((item) => item.details.eventId));
    const incidentHasChain = requiredChainIds.length > 0 && requiredChainIds.every((id) => incidentEventIds.includes(id));
    const selectedEvidence = eventRefs([...preservedIds]);
    const evidenceTies = selectedEvidence.length > 0 && selectedEvidence.some((id) => incidentEventIds.includes(id));
    add('incident-evidence', Boolean(latestIncident && incidentHasChain && evidenceTies),
      unique([...incidentEventIds.filter((id) => requiredChainIds.includes(id)), ...selectedEvidence.filter((id) => incidentEventIds.includes(id))]));

    return { rubricVersion: 1, criteria };
  }

  return Object.freeze({ RUBRIC, extract });
})();

/* Pure criterion-level evidence extraction for the independent Module 08 assessment. */
const SocM08AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'audited-finding-review', label: 'Validate findings through audited review actions' },
    { id: 'freshness-applicability', label: 'Separate current applicable findings from stale, irrelevant, and unknown findings' },
    { id: 'asset-context-controls', label: 'Use business impact, reachability, exposure, and control evidence' },
    { id: 'incident-link', label: 'Link supported finding evidence to the appropriate incident' },
    { id: 'risk-acceptance', label: 'Preserve an explicitly approved, finding-specific risk acceptance' },
    { id: 'escalation', label: 'Route a finding with relevant evidence, owner, and due date' },
    { id: 'remediation-outcome', label: 'Record an evidence-backed remediation decision and outcome' },
    { id: 'uncertainty-boundary', label: 'Keep stale or unverified findings unresolved rather than asserting applicability' },
  ].map(Object.freeze));

  const list = (value) => Array.isArray(value) ? value : [];
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value))];
  const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const assessment = record(state) ? state : {};
    const history = list(assessment.actionHistory).filter(record);
    const findings = new Map(list(scenario?.findings).filter(record).map((item) => [item.id, item]));
    const findingEvidence = new Map(list(scenario?.findingEvidence).filter(record).map((item) => [item.id, item]));
    const assetEvidence = new Map(list(scenario?.assetEvidence).filter(record).map((item) => [item.id, item]));
    const incidentEvidence = new Map(list(scenario?.incidentEvidence).filter(record).map((item) => [item.id, item]));
    const riskEvidence = new Map(list(scenario?.riskAcceptanceEvidence).filter(record).map((item) => [item.id, item]));
    const criteria = [];
    const add = (id, finding, evidenceIds) => criteria.push({
      id, finding: finding === true ? 'supported' : finding === false ? 'incomplete' : finding,
      evidenceIds: unique(evidenceIds),
    });
    if (!scenario || !findings.size) {
      RUBRIC.forEach(({ id }) => add(id, 'unknown', []));
      return { rubricVersion: 1, criteria };
    }

    const actionFor = (type, details, projection) => history.some((item) => item.type === type
      && record(item.details) && item.details.findingId === details?.findingId
      && Object.entries(projection).every(([key, value]) => same(item.details[key], value)));
    const validFindingRefs = (findingId, ids) => unique(list(ids)).filter((id) => findingEvidence.get(id)?.findingId === findingId);
    const validAssetRefs = (assetId, ids) => unique(list(ids)).filter((id) => assetEvidence.get(id)?.assetId === assetId);
    const reviewed = (findingId, statuses) => list(assessment.findingReviews).find((item) => record(item)
      && item.findingId === findingId && statuses.includes(item.status)
      && validFindingRefs(findingId, item.evidenceIds).length > 0
      && actionFor('finding_review', item, { status: item.status, evidenceIds: item.evidenceIds, notes: item.notes }));
    const currentApplicable = reviewed('M08-FINDING-001', ['reviewed']);
    const staleReview = reviewed('M08-FINDING-002', ['needs-validation']);
    const irrelevantReview = reviewed('M08-FINDING-003', ['not-applicable']);
    add('audited-finding-review', Boolean(currentApplicable && staleReview && irrelevantReview),
      [currentApplicable, staleReview, irrelevantReview].flatMap((item) => item ? validFindingRefs(item.findingId, item.evidenceIds) : []));

    const validCurrent = currentApplicable && currentApplicable.evidenceIds.some((id) => findingEvidence.get(id)?.kind === 'version-applicability');
    const hasStale = staleReview?.evidenceIds.some((id) => findingEvidence.get(id)?.kind === 'scanner-observation'
      && findingEvidence.get(id)?.observedAt < scenario.start);
    const hasUnverified = staleReview?.evidenceIds.some((id) => findingEvidence.get(id)?.kind === 'applicability-check');
    const excludedIrrelevant = irrelevantReview?.evidenceIds.some((id) => findingEvidence.get(id)?.kind === 'applicability-check');
    add('freshness-applicability', validCurrent && hasStale && hasUnverified && excludedIrrelevant ? 'supported'
      : staleReview || irrelevantReview ? 'partial' : 'unknown',
    [currentApplicable, staleReview, irrelevantReview].flatMap((item) => item ? validFindingRefs(item.findingId, item.evidenceIds) : []));

    const targetAsset = findings.get('M08-FINDING-001')?.assetId;
    const targetAssetRecord = list(scenario.assetInventory).find((item) => item?.assetId === targetAsset);
    const assetKinds = new Set(['business-criticality', 'reachability', 'exposure', 'compensating-control']);
    const contextIds = unique([
      ...list(targetAssetRecord?.criticality?.evidenceIds), ...list(targetAssetRecord?.reachability?.evidenceIds),
      ...list(targetAssetRecord?.exposure?.evidenceIds), ...list(targetAssetRecord?.compensatingControls).flatMap((item) => list(item?.evidenceIds)),
    ]).filter((id) => assetEvidence.get(id)?.assetId === targetAsset && assetKinds.has(assetEvidence.get(id)?.kind));
    const contextComplete = new Set(contextIds.map((id) => assetEvidence.get(id).kind)).size === 4;
    add('asset-context-controls', contextComplete ? 'supported' : contextIds.length ? 'partial' : 'unknown', contextIds);

    const incident = list(assessment.incidentLinks).find((item) => record(item)
      && item.findingId === 'M08-FINDING-001' && item.incidentId === 'M08-INCIDENT-001'
      && item.evidenceIds.some((id) => incidentEvidence.get(id)?.incidentId === item.incidentId
        && incidentEvidence.get(id)?.findingId === item.findingId)
      && actionFor('incident_link', item, { incidentId: item.incidentId, evidenceIds: item.evidenceIds, rationale: item.rationale }));
    add('incident-link', incident ? 'supported' : 'unknown', incident ? incident.evidenceIds.filter((id) => incidentEvidence.has(id)) : []);

    const acceptance = list(assessment.riskAcceptances).find((item) => record(item)
      && item.findingId === 'M08-FINDING-002'
      && scenario.riskAcceptanceDispositions?.some((d) => d.id === item.dispositionId && d.findingId === item.findingId && d.status === 'explicitly-supported')
      && item.evidenceIds.some((id) => riskEvidence.get(id)?.dispositionId === item.dispositionId
        && riskEvidence.get(id)?.findingId === item.findingId)
      && actionFor('risk_acceptance', item, { dispositionId: item.dispositionId, evidenceIds: item.evidenceIds, rationale: item.rationale }));
    add('risk-acceptance', acceptance ? 'supported' : 'unknown', acceptance ? acceptance.evidenceIds.filter((id) => riskEvidence.has(id)) : []);

    const escalation = list(assessment.escalations).find((item) => record(item)
      && item.findingId === 'M08-FINDING-001' && scenario.escalationRoutes?.some((route) => route.id === item.routeId)
      && item.evidenceIds.some((id) => findingEvidence.get(id)?.findingId === item.findingId || assetEvidence.get(id)?.assetId === targetAsset)
      && actionFor('escalation', item, { routeId: item.routeId, ownerId: item.ownerId, dueDate: item.dueDate,
        rationale: item.rationale, evidenceIds: item.evidenceIds }));
    add('escalation', escalation ? 'supported' : 'unknown', escalation ? unique(escalation.evidenceIds.filter((id) => findingEvidence.has(id) || assetEvidence.has(id))) : []);

    const decision = [...list(assessment.remediationDecisions)].reverse().find((item) => record(item)
      && item.findingId === 'M08-FINDING-001' && ['critical', 'high', 'medium', 'low'].includes(item.priority)
      && item.evidenceIds.length && item.evidenceIds.every((id) => findingEvidence.get(id)?.findingId === item.findingId || assetEvidence.get(id)?.assetId === targetAsset)
      && (actionFor('remediation_decision', item, { priority: item.priority, status: item.status, ownerId: item.ownerId,
        dueDate: item.dueDate, rationale: item.rationale, evidenceIds: item.evidenceIds })
        || list(assessment.remediationTransitions).some((transition) => transition.actionId === item.actionId
          && history.some((action) => action.type === 'remediation_transition' && action.id === transition.actionId
            && action.details?.findingId === item.findingId && action.details?.toStatus === item.status))));
    const transition = list(assessment.remediationTransitions).find((item) => record(item)
      && item.findingId === decision?.findingId && item.toStatus === decision?.status
      && decision?.actionId === item.actionId);
    add('remediation-outcome', decision ? (transition || decision.status !== 'open' ? 'supported' : 'partial') : 'unknown',
      decision ? unique(decision.evidenceIds.filter((id) => findingEvidence.has(id) || assetEvidence.has(id))) : []);

    const noFalseConfirmation = !reviewed('M08-FINDING-002', ['reviewed'])
      && !reviewed('M08-FINDING-003', ['reviewed']);
    add('uncertainty-boundary', noFalseConfirmation && staleReview && irrelevantReview ? 'supported'
      : staleReview || irrelevantReview ? 'partial' : 'unknown',
    [...(staleReview ? validFindingRefs(staleReview.findingId, staleReview.evidenceIds) : []),
      ...(irrelevantReview ? validFindingRefs(irrelevantReview.findingId, irrelevantReview.evidenceIds) : [])]);

    return { rubricVersion: 1, criteria };
  }

  return Object.freeze({ RUBRIC, extract });
})();

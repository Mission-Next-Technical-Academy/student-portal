/* Pure criterion-level evidence extraction for the independent Module 06 hunt. */
const SocM06AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'testable-hypothesis', label: 'Develop a testable hypothesis from the lead' },
    { id: 'scope-and-comparison', label: 'Bound the hunt and test a benign comparison' },
    { id: 'query-and-pivots', label: 'Use a saved query and fixture-linked pivots to investigate' },
    { id: 'evidence-collection', label: 'Preserve a useful, deduplicated evidence collection' },
    { id: 'attack-mapping', label: 'Separate supported behavior from unsupported technique claims' },
    { id: 'evidence-handoff', label: 'Create a proportionate evidence-linked handoff' },
    { id: 'bounded-conclusion', label: 'Record a bounded conclusion with supporting evidence' },
    { id: 'uncertainty-boundary', label: 'Avoid unsupported certainty and retain uncertainty' },
  ].map(Object.freeze));

  const list = (value) => Array.isArray(value) ? value : [];
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value))];
  const text = (value) => typeof value === 'string' ? value.toLowerCase() : '';

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const assessment = record(state) ? state : {};
    const history = list(assessment.actionHistory).filter(record);
    const eventIds = new Set(list(scenario?.telemetry).map((event) => event?.id).filter((id) => typeof id === 'string'));
    const expectedById = new Map(list(scenario?.telemetry).filter(record).map((event) => [event.id, event]));
    const criteria = [];
    const add = (id, passed, evidence, misses) => criteria.push({
      id, awarded: Boolean(passed), evidence: unique(evidence), misses: passed ? [] : unique(misses),
    });
    if (!scenario?.expectedTruth || !eventIds.size) {
      RUBRIC.forEach(({ id }) => add(id, false, [], ['Assessment fixture is unavailable.']));
      return { rubricVersion: 1, criteria };
    }

    const expectedSupported = new Map(list(scenario.expectedTruth.supportedTechniques).map((item) => [item.id, item]));
    const expectedUnsupported = new Map(list(scenario.expectedTruth.unsupportedTechniques).map((item) => [item.id, item]));
    const hypothesisActions = history.filter((item) => item.type === 'hypothesis_edit');
    const hypotheses = list(assessment.hypotheses);
    const hypothesis = hypotheses.find((item) => record(item) && typeof item.text === 'string'
      && item.text.trim().length >= 20 && list(item.relatedEventIds).some((id) => eventIds.has(id)));
    const hypothesisAction = hypothesisActions.find((item) => record(item.details)
      && item.details.hypothesisId === hypothesis?.id && item.details.text === hypothesis?.text
      && typeof item.details.text === 'string' && item.details.text.trim().length >= 20
      && list(item.details.relatedEventIds).some((id) => eventIds.has(id)));
    add('testable-hypothesis', Boolean(hypothesis && hypothesisAction),
      [...list(hypothesis?.relatedEventIds), ...list(hypothesisAction?.details?.relatedEventIds)],
      ['Save a specific hypothesis linked to fixture events.']);

    const scopedRuns = list(assessment.queryHistory).filter((run) => record(run)
      && ['device', 'account', 'all'].includes(run.entityType)
      && (run.entityType !== 'all' || run.entityValue === 'all')
      && eventIdsForRun(run, expectedById).length > 0);
    const hasPrimary = scopedRuns.some((run) => run.entityType === 'device' && run.entityValue === scenario.seedLead.device);
    const comparisonDevice = list(scenario.scope.devices).find((id) => id !== scenario.seedLead.device);
    const hasComparison = scopedRuns.some((run) => run.entityType === 'device' && run.entityValue === comparisonDevice);
    add('scope-and-comparison', hasPrimary && hasComparison,
      unique(scopedRuns.flatMap((run) => [run.entityValue, ...eventIdsForRun(run, expectedById)])),
      ['Run fixture-bounded searches on the lead device and a comparison device.']);

    const savedQueryActionIds = new Set(history.filter((item) => item.type === 'saved_query_create')
      .map((item) => item.details?.savedQueryId).filter((id) => typeof id === 'string'));
    const savedRunActions = history.filter((item) => item.type === 'saved_query_run');
    const meaningfulSavedRun = list(assessment.savedQueryRuns).find((run) => record(run)
      && savedQueryActionIds.has(run.savedQueryId)
      && list(run.resultEventIds).length > 0 && list(run.resultEventIds).every((id) => eventIds.has(id))
      && savedRunActions.some((action) => action.details?.savedQueryId === run.savedQueryId
        && JSON.stringify(action.details?.resultEventIds) === JSON.stringify(run.resultEventIds)));
    const pivots = list(assessment.pivots).filter((pivot) => record(pivot)
      && eventIds.has(pivot.fromEventId) && eventIds.has(pivot.toEventId)
      && (expectedById.get(pivot.fromEventId)?.relatedEventIds || []).includes(pivot.toEventId));
    const pivotActions = history.filter((item) => item.type === 'pivot' && pivots.some((pivot) =>
      pivot.fromEventId === item.details?.fromEventId && pivot.toEventId === item.details?.toEventId));
    add('query-and-pivots', Boolean(meaningfulSavedRun && pivots.length && pivotActions.length),
      unique([...(meaningfulSavedRun?.resultEventIds || []), ...pivots.flatMap((pivot) => [pivot.fromEventId, pivot.toEventId])]),
      ['Run a saved query with results and follow a fixture-defined related-event pivot.']);

    const collectionActions = history.filter((item) => item.type === 'collection'
      && ['create', 'update'].includes(item.details?.operation));
    const collection = list(assessment.collections).find((item) => record(item)
      && collectionActions.some((action) => action.details?.collectionId === item.id
        && JSON.stringify(action.details?.eventIds) === JSON.stringify(item.eventIds))
      && list(item.eventIds).length >= 2 && new Set(item.eventIds).size === item.eventIds.length
      && item.eventIds.every((id) => eventIds.has(id)));
    add('evidence-collection', Boolean(collection), list(collection?.eventIds),
      ['Save a collection containing at least two unique fixture events.']);

    const mappingActions = history.filter((item) => item.type === 'attack_mapping_change');
    const validMappings = list(assessment.mappings).filter((mapping) => record(mapping)
      && Number.isInteger(mapping.confidence) && mapping.confidence >= 0 && mapping.confidence <= 100
      && typeof mapping.rationale === 'string' && mapping.rationale.trim()
      && list(mapping.eventIds).length && mapping.eventIds.every((id) => eventIds.has(id))
      && mappingActions.some((action) => action.details?.techniqueId === mapping.techniqueId
        && action.details?.tacticId === mapping.tacticId && action.details?.status === mapping.status
        && JSON.stringify(action.details?.eventIds) === JSON.stringify(mapping.eventIds)));
    const supportedMapping = validMappings.find((mapping) => mapping.status === 'supported'
      && expectedSupported.get(mapping.techniqueId)?.evidenceEventIds.some((id) => mapping.eventIds.includes(id)));
    const unsupportedMapping = validMappings.find((mapping) => mapping.status === 'unsupported'
      && expectedUnsupported.get(mapping.techniqueId)?.evidenceEventIds.some((id) => mapping.eventIds.includes(id)));
    add('attack-mapping', Boolean(supportedMapping && unsupportedMapping),
      [...(supportedMapping?.eventIds || []), ...(unsupportedMapping?.eventIds || [])],
      ['Record evidence-cited supported and unsupported technique assessments.']);

    const handoffActions = history.filter((item) => item.type === 'handoff_proposal');
    const handoff = list(assessment.handoffs).find((item) => record(item)
      && handoffActions.some((action) => action.details?.handoffId === item.id
        && JSON.stringify(action.details?.eventIds) === JSON.stringify(item.eventIds))
      && list(item.eventIds).length > 0 && list(item.eventIds).every((id) => eventIds.has(id))
      && typeof item.rationale === 'string' && item.rationale.trim()
      && typeof item.recommendation === 'string' && item.recommendation.trim());
    add('evidence-handoff', Boolean(handoff), [...(handoff?.eventIds || []), handoff?.id],
      ['Propose a handoff with fixture evidence, rationale, and a recommendation.']);

    const conclusions = list(assessment.conclusions).filter(record);
    const conclusionAction = history.find((item) => item.type === 'conclusion' && record(item.details)
      && typeof item.details.text === 'string' && item.details.text.trim().length >= 30
      && list(item.details.eventIds).length > 0 && item.details.eventIds.every((id) => eventIds.has(id)));
    const conclusion = conclusions.find((item) => typeof item.text === 'string'
      && item.text.trim().length >= 30 && list(item.eventIds).length > 0
      && item.eventIds.every((id) => eventIds.has(id))
      && conclusionAction?.details?.text === item.text
      && JSON.stringify(conclusionAction.details.eventIds) === JSON.stringify(item.eventIds));
    add('bounded-conclusion', Boolean(conclusion), list(conclusion?.eventIds),
      ['Save a substantive conclusion linked to fixture evidence.']);

    const learnerText = history.flatMap((item) => Object.values(record(item.details) ? item.details : {})
      .filter((value) => typeof value === 'string')).join(' ').toLowerCase();
    const claimsBeyondEvidence = [
      ['T1105', ['transfer confirmed', 'tool transfer confirmed', 'download confirmed']],
      ['T1071.001', ['c2 confirmed', 'command and control confirmed', 'web protocol confirmed']],
    ].some(([technique, claims]) => claims.some((claim) => learnerText.includes(claim))
      && !validMappings.some((mapping) => mapping.techniqueId === technique && mapping.status === 'unsupported'));
    const unsupportedIntent = /persistence (?:is )?confirmed|task creation confirmed/.test(learnerText)
      && !validMappings.some((mapping) => mapping.techniqueId === 'T1053.005' && mapping.status === 'unsupported');
    const retainedUncertainty = /not (?:established|confirmed|proven)|insufficient evidence|requires (?:further )?investigation|suspicious,? not proven/.test(learnerText);
    add('uncertainty-boundary', !claimsBeyondEvidence && !unsupportedIntent && retainedUncertainty,
      retainedUncertainty ? ['Uncertainty explicitly recorded'] : [],
      ['State uncertainty and avoid presenting unobserved transfer, command-and-control, or persistence intent as confirmed.']);

    return { rubricVersion: 1, criteria };
  }

  function eventIdsForRun(run, eventById) {
    return list(run.resultEventIds).filter((id) => eventById.has(id)
      && (run.entityType === 'all' || eventById.get(id)[run.entityType] === run.entityValue));
  }

  return Object.freeze({ RUBRIC, extract });
})();

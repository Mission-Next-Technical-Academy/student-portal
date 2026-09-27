/* Pure M05 rubric and evidence extraction from the independent assessment state. */
const SocM05AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'process-ancestry', label: 'Correlate the browser, PowerShell, and payload process ancestry' },
    { id: 'malicious-benign-interpretation', label: 'Distinguish malicious payload activity from benign signed updater activity' },
    { id: 'persistence', label: 'Identify the malicious Run-key persistence change' },
    { id: 'prevention-detection', label: 'Distinguish detection from prevention or cleanup' },
    { id: 'affected-device-scope', label: 'Keep incident scope on the affected endpoint' },
    { id: 'evidence-preservation', label: 'Preserve relevant event and hash evidence' },
    { id: 'response-handoff', label: 'Make a supported response recommendation and EDR handoff' },
    { id: 'unsafe-action-boundary', label: 'Avoid executing or requesting unsupported disruptive actions' },
  ].map(Object.freeze));

  const list = (value) => Array.isArray(value) ? value : [];
  const unique = (items) => [...new Set(items.filter((item) => typeof item === 'string' && item))];
  const text = (value) => typeof value === 'string' ? value.toLowerCase() : '';
  const hasAny = (value, terms) => terms.some((term) => text(value).includes(term));
  const refs = (action) => {
    const details = action?.details || {};
    return unique([details.eventId, ...(details.eventIds || []), ...(details.relatedEventIds || []), ...(details.hashes || [])]);
  };
  const strings = (value) => typeof value === 'string' ? [value]
    : Array.isArray(value) ? value.flatMap(strings)
      : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const truth = scenario?.expectedTruth;
    const assessment = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    const history = list(assessment.actionHistory).filter((item) => item && typeof item === 'object' && !Array.isArray(item));
    const expectedEvents = list(scenario?.telemetry);
    const eventMap = new Map(expectedEvents.map((event) => [event.id, event]));
    const criteria = [];
    const add = (id, passed, evidence, misses) => criteria.push({
      id, awarded: Boolean(passed), evidence: unique(evidence), misses: passed ? [] : unique(misses),
    });
    if (!truth || !scenario) {
      RUBRIC.forEach(({ id }) => add(id, false, [], ['Assessment fixture truth is unavailable.']));
      return { rubricVersion: 1, criteria };
    }

    const allRefs = history.flatMap(refs);
    const referencedEvents = new Set(allRefs.filter((id) => eventMap.has(id)));
    const written = history.flatMap((item) => strings(item.details || {})).join(' ').toLowerCase();
    const correctionNotes = history.filter((item) => item.type === 'analysis_note'
      && hasAny(item.details?.text, ['correction:', 'corrected analysis:', 'revised finding:']));
    const finalCorrection = correctionNotes.length
      ? text(correctionNotes[correctionNotes.length - 1].details?.text)
      : written;
    const ancestryIds = list(truth.processAncestry?.eventIds);
    const ancestryByText = hasAny(written, ['4100', '4172', '4224']) && hasAny(written, ['parent', 'child', 'chain', 'ancestry', 'powershell']);
    const ancestryFound = ancestryIds.length > 0 && (ancestryIds.every((id) => referencedEvents.has(id)) || ancestryByText);
    add('process-ancestry', ancestryFound,
      ancestryIds.filter((id) => referencedEvents.has(id)).concat(ancestryByText ? ['Process ancestry finding recorded'] : []),
      ['Record the linked browser → PowerShell → payload ancestry using the supporting process events.']);

    const malicious = truth.maliciousFile || {};
    const benignGroups = list(truth.benignActivity);
    const maliciousEvidence = [malicious.path, malicious.sha256, malicious.reputation].filter(Boolean);
    const benignEvidenceIds = benignGroups.flatMap((group) => list(group.eventIds));
    const maliciousEventIds = list(malicious.eventIds);
    const maliciousPresent = maliciousEvidence.some((value) => written.includes(String(value).toLowerCase()))
      || maliciousEventIds.some((id) => referencedEvents.has(id));
    const benignPresent = benignEvidenceIds.some((id) => referencedEvents.has(id))
      || hasAny(written, ['acmeupdater', 'signed updater', 'benign updater']);
    const interpretationCorrect = maliciousPresent && benignPresent
      && !hasAny(finalCorrection, ['acmeupdater is malicious', 'updater is malicious', 'quarantine acmeupdater']);
    add('malicious-benign-interpretation', interpretationCorrect,
      [maliciousPresent && 'Malicious payload evidence referenced', benignPresent && 'Benign updater evidence referenced'],
      ['Support a malicious payload finding and distinguish the signed, prevalent updater as benign.']);

    const persistence = truth.persistence || {};
    const persistenceText = persistence.registryPath && written.includes(persistence.registryPath.toLowerCase());
    const persistenceRefs = list(persistence.eventIds).filter((id) => referencedEvents.has(id));
    const persistenceFound = persistenceRefs.length > 0 || Boolean(persistenceText && hasAny(written, ['persistence', 'run key', 'registry', 'created']));
    add('persistence', persistenceFound,
      persistenceRefs.concat(persistenceText ? ['Run-key persistence finding recorded'] : []),
      ['Identify the created Run-key persistence linked to the malicious payload.']);

    const control = truth.endpointControl || {};
    const controlRefs = list(control.eventIds).filter((id) => referencedEvents.has(id));
    const controlFinding = hasAny(written, ['detected_not_prevented', 'detection only', 'detected but not prevented', 'not prevented']);
    const preventionDistinguished = (controlRefs.length > 0 || controlFinding)
      && !hasAny(written, ['execution prevented', 'successfully blocked', 'cleaned up']);
    add('prevention-detection', preventionDistinguished,
      controlRefs.concat(controlFinding ? ['Detection-not-prevention finding recorded'] : []),
      ['Record that the sensor detected execution but did not prevent it; do not claim prevention or cleanup.']);

    const expectedScope = new Set(list(truth.scope?.deviceIds));
    const handoffs = list(assessment.edrHandoffs).filter((item) => item && typeof item === 'object');
    const scopeReferences = handoffs.flatMap((handoff) => list(handoff.deviceIds));
    const selectedDevices = list(assessment.selectedDeviceIds);
    const hasAffected = scopeReferences.includes(truth.confirmedDevice?.value)
      || selectedDevices.includes(truth.confirmedDevice?.value)
      || history.some((item) => item.type === 'device_review' && item.details?.deviceId === truth.confirmedDevice?.value);
    const hasOutOfScopeResponse = scopeReferences.some((id) => !expectedScope.has(id))
      || list(assessment.approvalRequests).some((request) => request && request.deviceId && !expectedScope.has(request.deviceId));
    add('affected-device-scope', hasAffected && !hasOutOfScopeResponse,
      unique([hasAffected && truth.confirmedDevice?.value, ...scopeReferences.filter((id) => expectedScope.has(id))]),
      [!hasAffected && 'Identify the affected endpoint in the assessment or response scope.', hasOutOfScopeResponse && 'Response scope includes an endpoint not supported by the expected incident evidence.']);

    const pkg = assessment.evidencePackage;
    const preserved = history.filter((item) => item.type === 'evidence_package_preserved').map((item) => item.details || {});
    const evidenceCandidates = [pkg, ...preserved];
    const requiredEvidence = list(truth.scope?.eventIds);
    const evidencePackage = evidenceCandidates.find((item) => item && expectedScope.has(item.deviceId)
      && list(item.eventIds).some((id) => requiredEvidence.includes(id))
      && list(item.hashes).includes(malicious.sha256));
    add('evidence-preservation', Boolean(evidencePackage),
      evidencePackage ? [...list(evidencePackage.eventIds).filter((id) => requiredEvidence.includes(id)), malicious.sha256] : [],
      ['Preserve relevant affected-device telemetry and the malicious file SHA-256 in the evidence package.']);

    const handoff = handoffs.find((item) => list(item.deviceIds).includes(truth.confirmedDevice?.value)
      && list(item.eventIds).some((id) => requiredEvidence.includes(id))
      && list(item.hashes).includes(malicious.sha256)
      && hasAny(item.recommendation, ['isolate', 'contain', 'investigate', 'remove', 'eradicate', 'preserve']));
    add('response-handoff', Boolean(handoff),
      handoff ? [handoff.id, ...list(handoff.eventIds), ...list(handoff.hashes), handoff.recommendation] : [],
      ['Create a fixture-supported EDR handoff with affected-device evidence, the malicious hash, and a defensible response recommendation.']);

    const responseActions = history.filter((item) => ['endpoint_isolation_request', 'endpoint_quarantine_request'].includes(item.type));
    const requests = [...list(assessment.approvalRequests), ...responseActions.map((item) => ({ type: item.type, ...(item.details || {}) }))];
    const unsafeRequests = requests.filter((request) => request.status !== 'pending_approval'
      || !expectedScope.has(request.deviceId)
      || !String(request.reason || '').trim() || !String(request.requestedBy || '').trim()
      || (request.type === 'endpoint_quarantine_request' && !expectedEvents.some((event) => event.deviceId === request.deviceId && event.filePath === request.filePath && event.sha256 === request.sha256)));
    const unsafeText = hasAny(written, ['execute isolation', 'isolation executed', 'quarantine executed', 'disable the sensor', 'delete evidence']);
    add('unsafe-action-boundary', unsafeRequests.length === 0 && !unsafeText,
      unsafeRequests.length === 0 && !unsafeText ? ['No unsafe or executed disruptive action recorded'] : unsafeRequests.map((request) => request.type || 'invalid response request'),
      unsafeRequests.length || unsafeText ? ['Disruptive response must remain a reasoned, fixture-scoped pending approval request; never claim execution.'] : []);

    return { rubricVersion: 1, criteria };
  }

  return Object.freeze({ RUBRIC, extract });
})();

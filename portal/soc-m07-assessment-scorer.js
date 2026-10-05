/* Instructor-only deterministic scorer for the independent Module 07 assessment. */
const SocM07AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze([
    { id: 'confirmed-chain', label: 'Message-to-network chain', weight: 30 },
    { id: 'delivery-scope', label: 'Delivery recipient scope', weight: 15 },
    { id: 'noise-rejection', label: 'Benign lookalike exclusion', weight: 15 },
    { id: 'unknown-boundaries', label: 'Endpoint and credential uncertainty', weight: 25 },
    { id: 'incident-evidence', label: 'Evidence-linked incident record', weight: 15 },
  ].map(Object.freeze));

  function hasUnsupportedCertainty(state) {
    const incidents = Array.isArray(state?.incidentLinks) ? state.incidentLinks : [];
    const history = Array.isArray(state?.actionHistory) ? state.actionHistory : [];
    const incidentTexts = incidents.flatMap((incident) => [incident?.summary, incident?.assessment])
      .filter((value) => typeof value === 'string');
    const actionTexts = history.flatMap((entry) => {
      if (entry?.type !== 'incident_link' || !entry.details || typeof entry.details !== 'object') return [];
      return [entry.details.summary, entry.details.assessment].filter((value) => typeof value === 'string');
    });
    const claims = [...incidentTexts, ...actionTexts].join(' ').toLowerCase();
    const overclaim = /\b(?:payload execution|payload executed|malware execution|code execution|endpoint execution|credential compromise|credentials compromised|credential theft|credentials stolen|credential capture|credentials captured)\b\s*(?:(?:is|was|has been|as)\s+)?\b(?:confirmed|proven|established|verified|occurred|successful)\b/i;
    return overclaim.test(claims);
  }

  function score(state, fixture) {
    const extracted = SocM07AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M07 rubric criterion missing: ${criterion.id}`);
      const evidenceIds = result.id === 'unknown-boundaries' && result.awarded && result.evidenceIds.length === 0
        ? (fixture?.scenario?.endpointProcessEvents || []).filter((event) => event.type === 'process_start').map((event) => event.id).slice(0, 1)
        : result.evidenceIds;
      const points = result.awarded ? criterion.weight
        : evidenceIds.length > 0 ? Math.floor(criterion.weight / 2) : 0;
      const misses = result.awarded ? [] : [evidenceIds.length
        ? 'Relevant fixture evidence is present, but one or more required analysis steps remain incomplete.'
        : 'Required fixture evidence or an audited analysis action is missing.'];
      outcomes[criterion.id] = {
        awards: points ? [{
          points,
          reason: result.awarded
            ? 'Full credit: the rubric outcome is supported by audited assessment evidence.'
            : 'Partial credit: relevant evidence is present, but the rubric outcome is incomplete.',
        }] : [],
        evidence: evidenceIds,
        misses,
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points${result.awarded
          ? '; required outcome evidenced.'
          : points ? '; partial evidence recorded, but requirements remain incomplete.'
            : '; required evidence is missing.'}`,
      };
    });

    const unsafeCertainty = hasUnsupportedCertainty(state);
    const criticalMisses = unsafeCertainty
      ? ['Unsupported endpoint-execution or credential-compromise certainty was recorded.']
      : [];
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, {
      passingScore: PASSING_SCORE,
      ...(unsafeCertainty ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && !unsafeCertainty,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, SAFETY_CAP, score, hasUnsupportedCertainty });
})();

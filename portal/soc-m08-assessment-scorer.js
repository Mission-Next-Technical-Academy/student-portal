/* Instructor-only weighted scoring for the independent Module 08 assessment. */
const SocM08AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const CRITERIA = Object.freeze([
    { id: 'audited-finding-review', label: 'Audited finding review', weight: 10 },
    { id: 'freshness-applicability', label: 'Freshness and applicability', weight: 15 },
    { id: 'asset-context-controls', label: 'Asset context and compensating controls', weight: 20 },
    { id: 'incident-link', label: 'Evidence-linked incident', weight: 10 },
    { id: 'risk-acceptance', label: 'Finding-specific risk acceptance', weight: 10 },
    { id: 'escalation', label: 'Evidence-backed escalation', weight: 10 },
    { id: 'remediation-outcome', label: 'Evidence-backed priority and remediation', weight: 15 },
    { id: 'uncertainty-boundary', label: 'Uncertainty boundary', weight: 10 },
  ].map(Object.freeze));

  function score(state, fixture) {
    const extracted = SocM08AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((item) => [item.id, item]));
    const expected = fixture?.scenario?.expectedPriority;
    const expectedFindingId = fixture?.scenario?.findings?.find((item) => item.assetId === expected?.assetId)?.id;
    const decision = Array.isArray(state?.remediationDecisions)
      ? [...state.remediationDecisions].reverse().find((item) => item?.findingId === expectedFindingId) : null;
    const outcomes = {};
    const levels = {};

    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M08 rubric criterion missing: ${criterion.id}`);
      let status = result.finding;
      let evidence = Array.isArray(result.evidenceIds) ? result.evidenceIds : [];
      if (criterion.id === 'asset-context-controls') {
        const assetKinds = new Map((fixture?.scenario?.assetEvidence || []).map((item) => [item.id, item.kind]));
        evidence = (Array.isArray(decision?.evidenceIds) ? decision.evidenceIds : [])
          .filter((id) => ['business-criticality', 'reachability', 'exposure', 'compensating-control'].includes(assetKinds.get(id)));
        const coveredKinds = new Set(evidence.map((id) => assetKinds.get(id)));
        status = coveredKinds.size === 4 ? 'supported' : coveredKinds.size ? 'incomplete' : 'unknown';
      }
      if (criterion.id === 'remediation-outcome' && status === 'supported') {
        status = decision?.priority === expected?.priority ? 'supported' : 'incomplete';
      }
      const level = status === 'supported' ? 'full' : status === 'incomplete' && evidence.length ? 'partial' : 'zero';
      const points = level === 'full' ? criterion.weight : level === 'partial' ? Math.floor(criterion.weight / 2) : 0;
      levels[criterion.id] = level;
      const rationale = level === 'full'
        ? 'Required outcome is supported by audited actions and fixture evidence.'
        : level === 'partial'
          ? 'Relevant evidence is present, but one or more required analysis steps remain incomplete.'
          : 'Required audited action or supporting fixture evidence is missing.';
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: `${level === 'full' ? 'Full' : 'Partial'} credit: ${rationale}` }] : [],
        evidence,
        misses: level === 'full' ? [] : [rationale],
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points; ${rationale}`,
      };
    });

    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, { passingScore: PASSING_SCORE });
    const result = {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass,
      criteria: scored.criteria.map((item) => ({ ...item, level: levels[item.id] })),
      review: scored.review,
    };
    return Object.freeze(result);
  }

  function instructorPayload(state, fixture) {
    const result = score(state, fixture);
    const truth = fixture?.scenario?.expectedPriority;
    const decision = Array.isArray(state?.remediationDecisions)
      ? [...state.remediationDecisions].reverse().find((item) => item?.findingId
        === fixture?.scenario?.findings?.find((finding) => finding.assetId === truth?.assetId)?.id) : null;
    return Object.freeze({
      ...result,
      instructorTruth: truth ? Object.freeze({ ...truth, submittedPriority: decision?.priority || null,
        priorityMatches: decision?.priority === truth.priority }) : null,
    });
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, score, instructorPayload });
})();

/* Deterministic instructor scoring adapter for the M05 assessment rubric. */
const SocM05AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze([
    { id: 'process-ancestry', label: 'Process ancestry', weight: 15 },
    { id: 'malicious-benign-interpretation', label: 'Malicious and benign interpretation', weight: 15 },
    { id: 'persistence', label: 'Persistence identification', weight: 15 },
    { id: 'prevention-detection', label: 'Detection versus prevention', weight: 10 },
    { id: 'affected-device-scope', label: 'Affected-device scope', weight: 10 },
    { id: 'evidence-preservation', label: 'Evidence preservation', weight: 10 },
    { id: 'response-handoff', label: 'Response handoff', weight: 15 },
    { id: 'unsafe-action-boundary', label: 'Safe response boundary', weight: 10 },
  ].map(Object.freeze));

  function score(state, fixture) {
    const extracted = SocM05AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const unsafe = byId.get('unsafe-action-boundary');
    const unsafeAction = Boolean(unsafe && !unsafe.awarded);
    const outcomes = {};

    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M05 rubric criterion missing: ${criterion.id}`);
      const partial = !result.awarded && result.evidence.length > 0;
      const points = result.awarded ? criterion.weight : partial ? Math.floor(criterion.weight / 2) : 0;
      outcomes[criterion.id] = {
        awards: points ? [{
          points,
          reason: result.awarded
            ? 'Full credit: required outcome is supported by assessment evidence.'
            : 'Partial credit: relevant evidence is present, but the required outcome is incomplete.',
        }] : [],
        evidence: result.evidence,
        misses: result.misses,
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points${result.awarded
          ? '; required outcome evidenced.'
          : partial ? '; partial evidence recorded, but requirements remain incomplete.'
            : '; required evidence is missing.'}`,
      };
    });

    const criticalMisses = unsafeAction
      ? ['An unsafe, unsupported, out-of-scope, or executed disruptive response was recorded.']
      : [];
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, {
      passingScore: PASSING_SCORE,
      ...(unsafeAction ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && criticalMisses.length === 0,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, SAFETY_CAP, score });
})();

/* Instructor-only deterministic scoring for the Module 10 assessment. */
const SocM10AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze(SocM10AssessmentRubric.RUBRIC.map((criterion) => Object.freeze({ ...criterion, weight: 10 })));

  // 'observed' earns full credit, 'partial' half. Stating exfiltration or
  // encryption as confirmed, which the evidence does not show, caps the score.
  function score(state, fixture, context = {}) {
    const extracted = SocM10AssessmentRubric.extract(state, fixture, context);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      const points = result.finding === 'observed' ? criterion.weight : result.finding === 'partial' ? Math.floor(criterion.weight / 2) : 0;
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: result.finding === 'observed' ? 'Full credit: requirement evidenced.' : 'Partial credit: started but incomplete.' }] : [],
        evidence: result.evidenceIds,
        misses: points === criterion.weight ? [] : [`${criterion.label}: ${result.finding === 'incomplete' ? 'contradicted or out of order' : 'not yet evidenced'}.`],
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points.`,
      };
    });
    const criticalMisses = extracted.overclaim ? ['A statement presents exfiltration or encryption as confirmed, which the evidence does not establish.'] : [];
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, {
      passingScore: PASSING_SCORE,
      ...(criticalMisses.length ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && !criticalMisses.length,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, SAFETY_CAP, score });
})();

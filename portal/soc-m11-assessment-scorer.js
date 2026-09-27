/* Instructor-only deterministic scoring adapter for the Module 11 shift. */
const SocM11AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze([
    { id: 'queue-prioritization', label: 'Queue prioritization', weight: 10 },
    { id: 'sla-awareness', label: 'SLA awareness', weight: 8 },
    { id: 'assignment-escalation', label: 'Assignment and escalation', weight: 10 },
    { id: 'metrics-interpretation', label: 'Metrics interpretation', weight: 8 },
    { id: 'rule-noise', label: 'Rule-noise recognition', weight: 8 },
    { id: 'shift-handoff', label: 'Shift handoff', weight: 8 },
    { id: 'technical-report', label: 'Technical report', weight: 8 },
    { id: 'executive-summary', label: 'Executive summary', weight: 8 },
    { id: 'residual-risk', label: 'Residual-risk accuracy', weight: 10 },
    { id: 'ownership-due-dates', label: 'Ownership and due dates', weight: 8 },
    { id: 'lessons-detection', label: 'Lessons learned and detection improvement', weight: 6 },
    { id: 'closure-decision', label: 'Defensible closure decision', weight: 8 },
  ].map(Object.freeze));

  // 'observed' earns full credit, 'partial' half, anything else nothing.
  // Closing the incident while recovery risk remains open caps the score.
  function score(state, fixture) {
    const extracted = SocM11AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M11 rubric criterion missing: ${criterion.id}`);
      const points = result.finding === 'observed' ? criterion.weight
        : result.finding === 'partial' ? Math.floor(criterion.weight / 2) : 0;
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: result.finding === 'observed' ? 'Full credit: the required outcome is evidenced.' : 'Partial credit: started but incomplete.' }] : [],
        evidence: [...result.evidenceIds, ...result.actionIds],
        misses: points === criterion.weight ? [] : [`${criterion.label}: ${result.finding === 'incomplete' ? 'recorded but not supported by the shift evidence' : 'not yet evidenced'}.`],
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points.`,
      };
    });
    const closedWrongly = state?.closure?.decision === 'close' && fixture?.expectedTruth?.closureDecision === 'retain';
    const criticalMisses = closedWrongly ? ['The incident was closed while recovery evidence still shows open residual risk.'] : [];
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, {
      passingScore: PASSING_SCORE,
      ...(closedWrongly ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && !closedWrongly,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, SAFETY_CAP, score });
})();

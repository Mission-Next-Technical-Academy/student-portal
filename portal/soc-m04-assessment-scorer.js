/* Deterministic scoring adapter for the Module 04 assessment rubric. */
const SocM04AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze([
    { id: 'intelligence-corroboration', label: 'Intelligence corroboration', weight: 15 },
    { id: 'ioc-lifecycle', label: 'IOC lifecycle', weight: 10 },
    { id: 'query-rule-quality', label: 'Query and rule quality', weight: 15 },
    { id: 'scheduled-execution', label: 'Scheduled execution', weight: 10 },
    { id: 'alert-coverage', label: 'Alert coverage', weight: 15 },
    { id: 'alert-tuning', label: 'Alert tuning', weight: 10 },
    { id: 'automation-boundary', label: 'Automation safety boundary', weight: 15 },
    { id: 'case-documentation', label: 'Case documentation', weight: 10 },
  ].map(Object.freeze));

  function hasExecutedDisruptiveChange(state, fixture) {
    void fixture;
    return (state?.assessment?.actionHistory || []).some((entry) => entry.type === 'disruptive_state_changed'
      && entry.details?.executed === true
      && entry.details?.before && entry.details?.after
      && JSON.stringify(entry.details.before) !== JSON.stringify(entry.details.after));
  }

  function score(state, fixture) {
    const extracted = SocM04AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const unsafeExecution = hasExecutedDisruptiveChange(state, fixture);
    const outcomes = {};

    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M04 rubric criterion missing: ${criterion.id}`);
      const points = result.awarded ? criterion.weight : result.evidence.length ? Math.floor(criterion.weight / 2) : 0;
      const deductions = unsafeExecution && criterion.id === 'automation-boundary'
        ? [{ points: criterion.weight, reason: 'A disruptive account, session, or network state change was executed.' }]
        : [];
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: result.awarded ? 'Criterion supported by required evidence.' : 'Partial credit for recorded supporting evidence; required outcome is incomplete.' }] : [],
        evidence: result.evidence,
        misses: result.misses,
        deductions,
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points${result.awarded ? '; requirements evidenced.' : result.evidence.length ? '; partial evidence recorded, but requirements remain incomplete.' : '; required evidence is missing.'}`,
      };
    });

    const criticalMisses = unsafeExecution
      ? ['A disruptive account, session, or network state change was executed without a safe simulated boundary.']
      : [];
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, {
      passingScore: PASSING_SCORE,
      ...(criticalMisses.length ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
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

  return Object.freeze({ CRITERIA, PASSING_SCORE, SAFETY_CAP, score, hasExecutedDisruptiveChange });
})();

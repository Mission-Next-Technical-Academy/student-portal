/* Instructor-only deterministic scoring adapter for the Module 09 response. */
const SocM09AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const CRITERIA = Object.freeze([
    { id: 'triage-and-ownership', label: 'Incident priority and ownership', weight: 10 },
    { id: 'evidence-and-scope', label: 'Evidence review and supported scope', weight: 10 },
    { id: 'evidence-before-eradication', label: 'Evidence preserved before eradication', weight: 10 },
    { id: 'approval-and-containment', label: 'Approved, scoped containment', weight: 15 },
    { id: 'outcome-verification', label: 'Verified action outcomes', weight: 10 },
    { id: 'identity-and-persistence', label: 'Credential, session and persistence response', weight: 15 },
    { id: 'recovery-readiness', label: 'Known-good recovery, scan and validation', weight: 15 },
    { id: 'recovery-monitoring', label: 'Recovery monitoring and reopen condition', weight: 10 },
    { id: 'residual-risk-escalation', label: 'Remaining risk escalated', weight: 5 },
  ].map(Object.freeze));

  // Rubric findings: 'observed' earns full credit, 'partial' half, anything
  // else nothing. Unsafe actions cannot occur: the engine refuses unapproved
  // or out-of-scope disruptive actions.
  function score(state, fixture) {
    const extracted = SocM09AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M09 rubric criterion missing: ${criterion.id}`);
      const points = result.finding === 'observed' ? criterion.weight
        : result.finding === 'partial' ? Math.floor(criterion.weight / 2) : 0;
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: result.finding === 'observed' ? 'Full credit: required response outcome is evidenced.' : 'Partial credit: the response step is started but incomplete.' }] : [],
        evidence: [...result.evidenceIds, ...result.actionIds],
        misses: points === criterion.weight ? [] : [`${criterion.label}: ${result.finding === 'incomplete' ? 'recorded out of order or incomplete' : 'not yet evidenced'}.`],
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points.`,
      };
    });
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA, outcomes, { passingScore: PASSING_SCORE });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion: extracted.rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass,
      criticalMisses: [],
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, PASSING_SCORE, score });
})();

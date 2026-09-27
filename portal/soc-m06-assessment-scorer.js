/* Instructor-only deterministic scoring adapter for the Module 06 hunt. */
const SocM06AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  const CRITERIA = Object.freeze([
    { id: 'testable-hypothesis', label: 'Testable hypothesis', weight: 15 },
    { id: 'scope-and-comparison', label: 'Hunt scope and benign comparison', weight: 15 },
    { id: 'query-and-pivots', label: 'Saved query and related-event pivots', weight: 15 },
    { id: 'evidence-collection', label: 'Evidence collection', weight: 10 },
    { id: 'attack-mapping', label: 'Evidence-backed ATT&CK mapping', weight: 15 },
    { id: 'evidence-handoff', label: 'Evidence-linked handoff', weight: 10 },
    { id: 'bounded-conclusion', label: 'Bounded conclusion', weight: 10 },
    { id: 'uncertainty-boundary', label: 'Uncertainty boundary', weight: 10 },
  ].map(Object.freeze));

  function hasUnsupportedCertainty(state) {
    const history = Array.isArray(state?.actionHistory) ? state.actionHistory : [];
    const text = history.flatMap((entry) => {
      const details = entry?.details;
      if (!details || typeof details !== 'object') return [];
      return Object.values(details).filter((value) => typeof value === 'string');
    }).join(' ').toLowerCase();
    return /(?:t1105|tool transfer|file transfer|download|payload transfer) (?:is )?confirmed|(?:c2|command and control|web protocol) (?:is )?confirmed|(?:persistence|task creation) (?:is )?confirmed/.test(text);
  }

  function score(state, fixture) {
    const extracted = SocM06AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M06 rubric criterion missing: ${criterion.id}`);
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

    const unsafeCertainty = hasUnsupportedCertainty(state);
    const criticalMisses = unsafeCertainty
      ? ['An unsupported transfer, command-and-control, web-protocol, or persistence claim was stated as confirmed.']
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

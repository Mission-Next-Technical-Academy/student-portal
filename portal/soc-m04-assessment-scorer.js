/* Deterministic scoring adapter for the Module 04 assessment rubric. */
const SocM04AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  // Version 1 criteria (attempts submitted before indicator verdicts existed). Nothing recomputes a stored
  // score on load; this exists so a legacy state can still be scored under the rules it was submitted with.
  const CRITERIA_V1 = Object.freeze([
    { id: 'intelligence-corroboration', label: 'Intelligence corroboration', weight: 15 },
    { id: 'ioc-lifecycle', label: 'IOC lifecycle', weight: 10 },
    { id: 'query-rule-quality', label: 'Query and rule quality', weight: 15 },
    { id: 'scheduled-execution', label: 'Scheduled execution', weight: 10 },
    { id: 'alert-coverage', label: 'Alert coverage', weight: 15 },
    { id: 'alert-tuning', label: 'Alert tuning', weight: 10 },
    { id: 'automation-boundary', label: 'Automation safety boundary', weight: 15 },
    { id: 'case-documentation', label: 'Case documentation', weight: 10 },
  ].map(Object.freeze));
  // Version 2 keeps the intelligence competency at 25 points but splits it three ways, so every other
  // criterion and the 70-point bar are unchanged: corroboration 10 + IOC lifecycle 5 + verdicts 10.
  const CRITERIA = Object.freeze([
    { id: 'intelligence-corroboration', label: 'Intelligence corroboration', weight: 10 },
    { id: 'ioc-lifecycle', label: 'IOC lifecycle', weight: 5 },
    { id: 'intelligence-verdicts', label: 'Indicator verdicts', weight: 10 },
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

  function score(state, fixture, options) {
    const legacy = Boolean(options && options.rubricVersion === 1);
    const criteria = legacy ? CRITERIA_V1 : CRITERIA;
    const extracted = SocM04AssessmentRubric.extract(state, fixture, { rubricVersion: legacy ? 1 : 2 });
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const unsafeExecution = hasExecutedDisruptiveChange(state, fixture);
    const outcomes = {};

    criteria.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M04 rubric criterion missing: ${criterion.id}`);
      if (Array.isArray(result.awards)) {
        // Criteria that carry their own itemised awards and deductions (indicator verdicts) are not
        // reduced to all-or-half; scoreCriteria clamps the sum to the criterion weight.
        const earned = Math.min(criterion.weight, result.awards.reduce((total, award) => total + award.points, 0));
        const deducted = Math.min(earned, (result.deductions || []).reduce((total, item) => total + item.points, 0));
        const points = earned - deducted;
        outcomes[criterion.id] = {
          awards: result.awards, evidence: result.evidence, misses: result.misses, deductions: result.deductions || [],
          feedback: `${criterion.label}: ${points} of ${criterion.weight} points${result.awarded ? '; requirements evidenced.' : points || result.evidence.length ? '; partial evidence recorded, but requirements remain incomplete.' : '; required evidence is missing.'}`,
        };
        return;
      }
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
    const scored = SocAssessmentScorer.scoreCriteria(criteria, outcomes, {
      passingScore: PASSING_SCORE,
      ...(criticalMisses.length ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    // Readable record of the learner's own verdicts and reasoning for the instructor review card.
    const stored = state?.assessment?.intelVerdicts && typeof state.assessment.intelVerdicts === 'object' ? state.assessment.intelVerdicts : {};
    const verdictCriterion = byId.get('intelligence-verdicts');
    const intelligenceVerdicts = (verdictCriterion?.detail || []).map((item) => {
      const indicator = (fixture?.scenario?.verdictIndicators || []).find((entry) => entry.id === item.indicatorId) || {};
      return {
        indicatorId: item.indicatorId, value: item.value, type: indicator.type || '', origin: indicator.origin || '',
        decision: item.decision || '', rationale: String(stored[item.indicatorId]?.rationale || ''), recordedAt: String(stored[item.indicatorId]?.recordedAt || ''),
        assessment: item.verdict, reasoningCredited: item.reasoningCredited, points: item.points, max: item.max,
      };
    });
    return {
      rubricVersion: extracted.rubricVersion,
      intelligenceVerdicts,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && criticalMisses.length === 0,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, CRITERIA_V1, PASSING_SCORE, SAFETY_CAP, score, hasExecutedDisruptiveChange });
})();

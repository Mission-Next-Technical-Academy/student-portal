/* Instructor-only deterministic scoring adapter for the Module 11 shift. */
const SocM11AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const SAFETY_CAP = 69;
  // Rubric v2 (current) adds per-alert dispositions and rebalances to 100 points. Attempts submitted under v1 keep the
  // score, criteria and rubricVersion stored at submission; they are never re-scored. CRITERIA_V1 stays so a v1 result
  // can still be reproduced (score(state, fixture, { rubricVersion: 1 })).
  const CRITERIA_V1 = Object.freeze([
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
  const CRITERIA = Object.freeze([
    { id: 'queue-prioritization', label: 'Queue prioritization', weight: 8 },
    { id: 'alert-disposition', label: 'Alert dispositions', weight: 8 },
    { id: 'sla-awareness', label: 'SLA awareness', weight: 6 },
    { id: 'assignment-escalation', label: 'Assignment and escalation', weight: 8 },
    { id: 'metrics-interpretation', label: 'Metrics interpretation', weight: 8 },
    { id: 'rule-noise', label: 'Rule-noise recognition', weight: 8 },
    { id: 'shift-handoff', label: 'Shift handoff', weight: 8 },
    { id: 'technical-report', label: 'Technical report', weight: 8 },
    { id: 'executive-summary', label: 'Executive summary', weight: 8 },
    { id: 'residual-risk', label: 'Residual-risk accuracy', weight: 8 },
    { id: 'ownership-due-dates', label: 'Ownership and due dates', weight: 8 },
    { id: 'lessons-detection', label: 'Lessons learned and detection improvement', weight: 6 },
    { id: 'closure-decision', label: 'Defensible closure decision', weight: 8 },
  ].map(Object.freeze));

  // 'observed' earns full credit, 'partial' half, anything else nothing.
  // Closing the incident while recovery risk remains open caps the score.
  const LABELS = { true_positive: 'true positive', benign_positive: 'benign positive', false_positive: 'false positive', needs_investigation: 'needs investigation' };
  function dispositionOutcome(criterion, review) {
    const scale = review.maxPoints ? criterion.weight / review.maxPoints : 0;
    const awards = []; const deductions = []; const misses = []; const evidence = [];
    review.items.forEach((item) => {
      const call = item.recorded ? LABELS[item.recorded] || item.recorded : null;
      if (item.points) {
        awards.push({ points: Math.floor(item.points * scale), reason: item.outcome === 'supported'
          ? `${item.itemId}: ${LABELS[item.expected]} is the supported call.`
          : `${item.itemId}: needs investigation is the supported call, but the reasoning did not name the missing evidence.` });
        evidence.push(item.itemId);
      }
      if (item.deduction) deductions.push({ points: Math.floor(item.deduction * scale), reason: `${item.itemId}: an explicit ${call} verdict was not supported by the evidence${item.expected === 'needs_investigation' ? ' available (it was still incomplete)' : ''}.` });
      if (item.outcome === 'missing') misses.push(`${item.itemId}: no disposition recorded.`);
      else if (item.outcome === 'deferred') misses.push(`${item.itemId}: needs investigation was recorded, but the evidence supported a conclusion (${LABELS[item.expected]}); no penalty.`);
      else if (item.outcome === 'unsupported') misses.push(`${item.itemId}: recorded ${call}; the supported call was ${LABELS[item.expected]}.`);
      else if (item.outcome === 'partial') misses.push(`${item.itemId}: state which evidence is missing and what you would re-check.`);
    });
    return { awards, deductions, evidence, misses };
  }

  function score(state, fixture, options = {}) {
    const rubricVersion = options.rubricVersion === 1 ? 1 : 2;
    const CRITERIA_IN_USE = rubricVersion === 1 ? CRITERIA_V1 : CRITERIA;
    const extracted = SocM11AssessmentRubric.extract(state, fixture);
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    CRITERIA_IN_USE.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M11 rubric criterion missing: ${criterion.id}`);
      if (criterion.id === 'alert-disposition' && extracted.dispositionReview) {
        const detail = dispositionOutcome(criterion, extracted.dispositionReview);
        const earned = detail.awards.reduce((sum, award) => sum + award.points, 0);
        outcomes[criterion.id] = { awards: detail.awards, deductions: detail.deductions, evidence: [...detail.evidence, ...result.actionIds], misses: detail.misses,
          feedback: `${criterion.label}: ${Math.max(0, earned - detail.deductions.reduce((sum, d) => sum + d.points, 0))} of ${criterion.weight} points.` };
        return;
      }
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
    const scored = SocAssessmentScorer.scoreCriteria(CRITERIA_IN_USE, outcomes, {
      passingScore: PASSING_SCORE,
      ...(closedWrongly ? { cap: { points: SAFETY_CAP, reason: criticalMisses[0] } } : {}),
    });
    return {
      assessmentId: fixture?.scenario?.id || null,
      rubricVersion,
      score: scored.review.total,
      rawScore: scored.criteria.reduce((total, item) => total + item.points, 0),
      maxScore: scored.review.max,
      passed: scored.review.pass && !closedWrongly,
      criticalMisses,
      criteria: scored.criteria,
      review: scored.review,
    };
  }

  return Object.freeze({ CRITERIA, CRITERIA_V1, PASSING_SCORE, SAFETY_CAP, score });
})();

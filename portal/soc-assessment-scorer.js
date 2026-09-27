/* Pure scoring for SOC assessment domains. */
const SocAssessmentScorer = (() => {
  'use strict';

  function scoreDomains(domains, answers = {}, options = {}) {
    const weight = Number.isFinite(options.weight) ? options.weight : 10;
    const max = domains.length * weight;
    const breakdown = domains.map((domain) => {
      const raw = answers[domain];
      const ratio = typeof raw === 'boolean' ? (raw ? 1 : 0) : Math.max(0, Math.min(1, Number(raw) || 0));
      return { id: domain, score: Math.round(ratio * weight), max: weight };
    });
    const rawScore = breakdown.reduce((sum, item) => sum + item.score, 0);
    const criticalMisses = options.criticalMisses || [];
    const percent = max ? Math.round((rawScore / max) * 100) : 0;
    const score = criticalMisses.length ? Math.min(percent, 69) : percent;
    return {
      score,
      rawScore,
      max,
      passed: score >= (options.passingScore || 70) && criticalMisses.length === 0,
      criticalMisses,
      breakdown,
    };
  }

  function scoreCriteria(criteria, outcomes = {}, options = {}) {
    const breakdown = criteria.map(({ id, label = id, weight }) => {
      const outcome = outcomes[id] || {};
      let available = weight;
      const awards = (outcome.awards || []).map(({ points, reason }) => {
        const awarded = Math.min(available, Math.max(0, points));
        available -= awarded;
        return { points: awarded, reason };
      });
      let earned = weight - available;
      const deductions = (outcome.deductions || []).map(({ points, reason }) => {
        const deducted = Math.min(earned, Math.max(0, points));
        earned -= deducted;
        return { points: deducted, reason };
      });
      const supportingEvidence = [...(outcome.evidence || [])];
      const misses = [...(outcome.misses || [])];
      const feedback = outcome.feedback || `${label}: ${earned} of ${weight} points awarded.`;
      return { id, label, points: earned, max: weight, awards, supportingEvidence, misses, deductions, feedback };
    });
    const max = breakdown.reduce((sum, item) => sum + item.max, 0);
    const rawTotal = breakdown.reduce((sum, item) => sum + item.points, 0);
    const cap = options.cap == null ? null : {
      points: options.cap.points,
      reason: options.cap.reason,
      applied: rawTotal > options.cap.points,
    };
    const total = cap ? Math.min(rawTotal, cap.points) : rawTotal;
    const pass = max > 0 && (total / max) * 100 >= (options.passingScore ?? 70);
    const labeled = (key) => breakdown.flatMap((item) => item[key].map((entry) => ({
      criterionId: item.id,
      criterion: item.label,
      ...(typeof entry === 'string' ? { text: entry } : entry),
    })));
    const review = {
      total,
      max,
      pass,
      cap,
      awards: labeled('awards'),
      supportingEvidence: labeled('supportingEvidence'),
      misses: labeled('misses'),
      deductions: labeled('deductions'),
      feedback: [
        ...breakdown.map((item) => item.feedback),
        ...(cap && cap.applied ? [`Score capped at ${cap.points} points: ${cap.reason}.`] : []),
      ],
    };
    return { criteria: breakdown, review };
  }

  return { scoreDomains, scoreCriteria };
})();

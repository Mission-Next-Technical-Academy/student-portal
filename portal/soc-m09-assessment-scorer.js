/* Instructor-only deterministic scoring adapter for the Module 09 response. */
const SocM09AssessmentScorer = (() => {
  'use strict';

  const PASSING_SCORE = 70;
  const LATEST_VERSION = 3;

  // Rubric version 2: the original nine competencies. Kept verbatim so a
  // submission scored before version 3 can still be explained and re-checked.
  const CRITERIA_V2 = Object.freeze([
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

  // Rubric version 3: the same nine competencies re-weighted to make room for
  // the response-workflow design and safe-conduct competencies (still 100).
  const CRITERIA = Object.freeze([
    { id: 'triage-and-ownership', label: 'Incident priority and ownership', weight: 8 },
    { id: 'evidence-and-scope', label: 'Evidence review and supported scope', weight: 8 },
    { id: 'evidence-before-eradication', label: 'Evidence preserved before eradication', weight: 8 },
    { id: 'approval-and-containment', label: 'Approved, scoped containment', weight: 12 },
    { id: 'outcome-verification', label: 'Verified action outcomes', weight: 8 },
    { id: 'identity-and-persistence', label: 'Credential, session and persistence response', weight: 11 },
    { id: 'recovery-readiness', label: 'Known-good recovery, scan and validation', weight: 11 },
    { id: 'recovery-monitoring', label: 'Recovery monitoring and reopen condition', weight: 8 },
    { id: 'residual-risk-escalation', label: 'Remaining risk escalated', weight: 6 },
    { id: 'response-workflow-design', label: 'Response workflow design (evidence, approval, containment order)', weight: 10 },
    { id: 'safe-response-conduct', label: 'Safe response conduct (approved, in-scope attempts only)', weight: 10 },
  ].map(Object.freeze));

  const UNSAFE_PENALTY = 3;
  const REASON_TEXT = Object.freeze({
    no_approval: 'no matching approval was recorded',
    out_of_scope: 'the target is outside the incident scope',
    wrong_target_type: 'the target is the wrong type for that action',
  });
  const list = (value) => Array.isArray(value) ? value : [];
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);

  // Per-competency point models for the competencies that are scored from
  // structured facts rather than a single observed/partial finding.
  const FACT_MODELS = {
    'response-workflow-design': (result) => {
      const best = result.facts?.best;
      const awards = [];
      const deductions = [];
      const misses = [];
      if (!best) {
        misses.push('No response workflow was designed.');
      } else {
        if (best.evidenceBeforeApproval) awards.push({ points: 4, reason: 'Evidence is preserved before approval is requested.' });
        else misses.push('The design does not show evidence preserved before approval.');
        if (best.containmentSteps && best.gatedSteps === best.containmentSteps) {
          awards.push({ points: 4, reason: 'Every containment or recovery step comes after approval.' });
        } else if (best.gatedSteps) {
          awards.push({ points: 2, reason: 'Some containment steps come after approval.' });
          misses.push('At least one containment or recovery step is not placed after approval.');
        } else {
          misses.push(best.containmentSteps ? 'No containment step is placed after approval.' : 'The design has no containment step.');
        }
        if (best.verifiedAfterContainment) awards.push({ points: 2, reason: 'A scan or monitoring step follows containment.' });
        else misses.push('No scan or monitoring step follows containment.');
        best.orderingErrors.forEach((edge) => deductions.push({ points: 2, reason: `Unsupported order ${edge}: a disruptive step feeds back into evidence or approval.` }));
      }
      return { awards, deductions, misses };
    },
    'safe-response-conduct': (result) => {
      const facts = result.facts || {};
      const attempts = list(facts.unsafeAttempts);
      const awards = facts.approvedActionCount
        ? [{ points: 10, reason: 'Response actions ran with a matching approval and in-scope target.' }] : [];
      const deductions = attempts.map((attempt) => ({ points: UNSAFE_PENALTY,
        reason: `Unsafe attempt ${attempt.id.split(':').pop()}: ${attempt.actionType} on ${attempt.targetId} was blocked because ${REASON_TEXT[attempt.reason] || 'it was unsafe'}.` }));
      const misses = [];
      if (!facts.approvedActionCount) misses.push('No approved, in-scope response action is recorded.');
      if (attempts.length) misses.push(`${attempts.length} blocked attempt${attempts.length === 1 ? '' : 's'} recorded: an attempt counts even when the range blocks it.`);
      return { awards, deductions, misses };
    },
  };

  // Rubric findings: 'observed' earns full credit, 'partial' half, anything
  // else nothing. Structured competencies (version 3) use FACT_MODELS. Unsafe
  // attempts reduce the safe-conduct competency only; there is no whole-score cap.
  function score(state, fixture, options = {}) {
    const version = options.rubricVersion === 2 ? 2 : LATEST_VERSION;
    const criteriaSet = version === 2 ? CRITERIA_V2 : CRITERIA;
    const extracted = SocM09AssessmentRubric.extract(state, fixture, { rubricVersion: version });
    const byId = new Map(extracted.criteria.map((criterion) => [criterion.id, criterion]));
    const outcomes = {};
    criteriaSet.forEach((criterion) => {
      const result = byId.get(criterion.id);
      if (!result) throw new TypeError(`M09 rubric criterion missing: ${criterion.id}`);
      if (FACT_MODELS[criterion.id]) {
        const model = FACT_MODELS[criterion.id](result);
        const earned = Math.min(criterion.weight, model.awards.reduce((sum, item) => sum + item.points, 0));
        const points = Math.max(0, earned - model.deductions.reduce((sum, item) => sum + item.points, 0));
        outcomes[criterion.id] = {
          awards: model.awards,
          deductions: model.deductions,
          evidence: [...result.evidenceIds, ...result.actionIds],
          misses: model.misses,
          feedback: `${criterion.label}: ${points} of ${criterion.weight} points.`,
        };
        return;
      }
      const points = result.finding === 'observed' ? criterion.weight
        : result.finding === 'partial' ? Math.floor(criterion.weight / 2) : 0;
      outcomes[criterion.id] = {
        awards: points ? [{ points, reason: result.finding === 'observed' ? 'Full credit: required response outcome is evidenced.' : 'Partial credit: the response step is started but incomplete.' }] : [],
        evidence: [...result.evidenceIds, ...result.actionIds],
        misses: points === criterion.weight ? [] : [`${criterion.label}: ${result.finding === 'incomplete' ? 'recorded out of order or incomplete' : 'not yet evidenced'}.`],
        feedback: `${criterion.label}: ${points} of ${criterion.weight} points.`,
      };
    });
    const scored = SocAssessmentScorer.scoreCriteria(criteriaSet, outcomes, { passingScore: PASSING_SCORE });
    const result = {
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
    if (version !== 2) result.responseReview = responseReview(state);
    return result;
  }

  // Readable instructor view of the learner's own design and refused attempts.
  function responseReview(state) {
    const designs = list(state?.workflowDesigns).filter(record).map((design) => ({
      id: design.id, name: design.name, timestamp: design.timestamp,
      nodes: list(design.nodes).slice(), connections: list(design.edges).filter(record).map((edge) => `${edge.from}>${edge.to}`),
    }));
    const unsafeAttempts = list(state?.unsafeAttempts).filter(record).map((attempt) => ({
      id: attempt.id, timestamp: attempt.timestamp, actionType: attempt.actionType, targetId: attempt.targetId,
      outcome: attempt.outcome, reason: attempt.reason, reasonText: REASON_TEXT[attempt.reason] || 'unsafe attempt',
    }));
    return { workflowDesigns: designs, unsafeAttempts };
  }

  return Object.freeze({ CRITERIA, CRITERIA_V2, PASSING_SCORE, LATEST_VERSION, UNSAFE_PENALTY, score, responseReview });
})();

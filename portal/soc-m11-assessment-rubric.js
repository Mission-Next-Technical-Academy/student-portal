/* Pure criterion-level evidence extraction for the independent Module 11 shift. */
const SocM11AssessmentRubric = (() => {
  'use strict';

  const RUBRIC = Object.freeze([
    { id: 'queue-prioritization', label: 'Prioritize the queue against SLA and impact' },
    { id: 'sla-awareness', label: 'Act on at-risk and breached SLAs' },
    { id: 'assignment-escalation', label: 'Assign and escalate work appropriately' },
    { id: 'metrics-interpretation', label: 'Interpret metrics without unsupported causal claims' },
    { id: 'rule-noise', label: 'Identify the noisy rule and propose an improvement' },
    { id: 'shift-handoff', label: 'Prepare an actionable shift handoff' },
    { id: 'technical-report', label: 'Produce an evidence-based technical narrative' },
    { id: 'executive-summary', label: 'Produce a concise, audience-safe executive summary' },
    { id: 'residual-risk', label: 'State containment, recovery and residual risk accurately' },
    { id: 'ownership-due-dates', label: 'Assign follow-up ownership and due dates' },
    { id: 'lessons-detection', label: 'Record lessons learned and a detection improvement' },
    { id: 'closure-decision', label: 'Make a defensible closure decision' },
  ].map(Object.freeze));

  const list = (value) => (Array.isArray(value) ? value : []);
  const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const lower = (value) => String(value || '').toLowerCase();
  const CAUSAL = /\b(caused|causes|because of|due to|resulted in|led to|drove|driven by)\b/i;
  const OVERCLAIM = /\b(fully recovered|no (?:residual|remaining) risk|no risk remains|risk[- ]free|incident (?:is )?(?:closed|resolved)|completely (?:recovered|remediated))\b/i;
  const TECHNICAL = /\b[a-f0-9]{32,}\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|\bsha-?256\b|\bpowershell\b|\bT1\d{3}\b|\bkql\b|\bregistry\b/i;

  function extract(state, fixture) {
    const scenario = fixture?.scenario;
    const truth = fixture?.expectedTruth;
    const assessment = record(state) ? state : {};
    const history = list(assessment.actionHistory).filter(record);
    const criteria = [];
    const idsOf = (type) => history.filter((action) => action.type === type).map((action) => action.id);
    const add = (id, finding, evidenceIds = [], actionIds = []) => criteria.push({
      id, finding: finding === true ? 'observed' : finding === false ? 'incomplete' : finding,
      evidenceIds: [...new Set(evidenceIds.filter(Boolean))], actionIds: [...new Set(actionIds.filter(Boolean))],
    });
    if (!scenario || !truth) {
      RUBRIC.forEach(({ id }) => add(id, 'unknown'));
      return { rubricVersion: 1, criteria };
    }
    const lowNoise = scenario.queue.filter((item) => item.ruleId === truth.noisyRuleId).map((item) => item.id);

    const order = list(assessment.priorityOrder);
    const top = truth.queuePriority.map((entry) => entry.itemId);
    add('queue-prioritization', !order.length ? 'unknown'
      : top.every((id, index) => order[index] === id) ? true
        : order[0] === top[0] ? 'partial' : lowNoise.includes(order[0]) ? false : 'incomplete', [], idsOf('priority'));

    const assignments = record(assessment.assignments) ? assessment.assignments : {};
    const escalations = list(assessment.escalations);
    const acted = (id) => Boolean(assignments[id]) || escalations.some((entry) => entry.itemId === id);
    const handoffs = list(assessment.handoffs);
    const latestHandoff = handoffs[handoffs.length - 1];
    const atRiskActed = truth.slaAtRisk.filter(acted);
    const breachesHandedOff = truth.slaBreaches.filter((id) => list(latestHandoff?.openItems).includes(id));
    add('sla-awareness', atRiskActed.length === truth.slaAtRisk.length && breachesHandedOff.length === truth.slaBreaches.length ? true
      : atRiskActed.length || breachesHandedOff.length ? 'partial' : 'unknown', [], [...idsOf('assign'), ...idsOf('escalate'), ...idsOf('handoff')]);

    const goodAssignments = Object.entries(truth.acceptableAssignees).filter(([itemId, allowed]) => allowed.includes(assignments[itemId]));
    const goodEscalations = truth.escalations.filter((expected) => escalations.some((entry) => entry.itemId === expected.itemId && entry.route === expected.route));
    const expectedCount = Object.keys(truth.acceptableAssignees).length + truth.escalations.length;
    const achieved = goodAssignments.length + goodEscalations.length;
    add('assignment-escalation', achieved === expectedCount ? true : achieved ? 'partial' : Object.keys(assignments).length || escalations.length ? 'incomplete' : 'unknown',
      [], [...idsOf('assign'), ...idsOf('escalate')]);

    const interpretations = list(assessment.interpretations);
    const latestInterpretation = interpretations[interpretations.length - 1] || '';
    const metricTerms = /\b(mtta|mttr|backlog|sla|noise|volume|false[- ]positive|benign|workload|trend)\b/i;
    add('metrics-interpretation', !latestInterpretation ? 'unknown'
      : CAUSAL.test(latestInterpretation) ? false
        : latestInterpretation.length >= 40 && metricTerms.test(latestInterpretation) ? true : 'partial', [], idsOf('metric_interpretation'));

    const noisy = list(assessment.noisyRules);
    const flagged = noisy.filter((entry) => entry.ruleId === truth.noisyRuleId);
    add('rule-noise', flagged.some((entry) => entry.improvement.length >= 20) ? true : flagged.length ? 'partial' : noisy.length ? false : 'unknown',
      lowNoise, idsOf('noisy_rule'));

    const incidentItem = scenario.incident.queueItemId;
    const handoffComplete = latestHandoff && latestHandoff.summary.length >= 40 && latestHandoff.openItems.includes(incidentItem)
      && truth.slaAtRisk.every((id) => latestHandoff.openItems.includes(id)) && latestHandoff.nextActions.length >= 1 && latestHandoff.risks.length >= 1;
    add('shift-handoff', handoffComplete ? true : latestHandoff ? 'partial' : 'unknown', [], idsOf('handoff'));

    const reports = record(assessment.reports) ? assessment.reports : {};
    const technical = reports.technical;
    const technicalText = lower([technical?.summary, technical?.confirmedScope, technical?.unknowns].join(' '));
    const technicalComplete = technical && technical.summary.length >= 80 && technicalText.includes('ws-173')
      && (technicalText.includes('acct-173') || technicalText.includes('fs-02')) && technical.confirmedScope && technical.unknowns;
    add('technical-report', technicalComplete ? true : technical ? 'partial' : 'unknown', [], idsOf('report'));

    const executive = reports.executive;
    const executiveText = [executive?.summary, executive?.businessImpact].join(' ');
    add('executive-summary', !executive ? 'unknown'
      : executive.summary.length <= 900 && executive.businessImpact && !TECHNICAL.test(executiveText) ? true : 'partial', [], idsOf('report'));

    const closureReport = reports.closure || technical;
    const riskText = lower([closureReport?.residualRisk, closureReport?.recoveryStatus, closureReport?.containmentStatus].join(' '));
    const risksNamed = truth.residualRisks.filter((risk) => risk.keywords.some((keyword) => riskText.includes(keyword)));
    add('residual-risk', !closureReport ? 'unknown'
      : OVERCLAIM.test(riskText) ? false
        : risksNamed.length === truth.residualRisks.length && closureReport.containmentStatus ? true : risksNamed.length ? 'partial' : false,
      risksNamed.map((risk) => risk.evidenceId), idsOf('report'));

    const actions = list(assessment.improvementActions);
    const dueOk = (entry) => entry.dueDate >= scenario.start.slice(0, 10) && entry.dueDate <= truth.dueBy;
    const owned = truth.residualRisks.filter((risk) => actions.some((entry) => entry.kind === 'follow_up' && entry.ownerId === risk.ownerId
      && entry.evidenceId === risk.evidenceId && dueOk(entry)));
    add('ownership-due-dates', owned.length === truth.residualRisks.length ? true : owned.length || actions.some((entry) => entry.kind === 'follow_up') ? 'partial' : 'unknown',
      owned.map((risk) => risk.evidenceId), idsOf('improvement_action'));

    const lesson = actions.some((entry) => entry.kind === 'lesson' && dueOk(entry));
    const detection = actions.some((entry) => entry.kind === 'detection' && dueOk(entry));
    add('lessons-detection', lesson && detection ? true : lesson || detection ? 'partial' : 'unknown', [], idsOf('improvement_action'));

    const closure = record(assessment.closure) ? assessment.closure : null;
    const pendingIds = truth.residualRisks.map((risk) => risk.evidenceId);
    add('closure-decision', !closure ? 'unknown'
      : closure.decision !== truth.closureDecision ? false
        : list(closure.evidenceIds).some((id) => pendingIds.includes(id)) && closure.rationale.length >= 30 ? true : 'partial',
      list(closure?.evidenceIds), idsOf('closure_decision'));

    return { rubricVersion: 1, criteria };
  }

  return Object.freeze({ RUBRIC, extract });
})();

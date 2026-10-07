/* Pure criterion-level evidence extraction for the Module 04 assessment. */
const SocM04AssessmentRubric = (() => {
  'use strict';

  // Rubric version 2 adds contextual indicator verdicts. Version 1 is kept so a submitted attempt can be
  // re-read under the rules it was scored with (its stored score is never recomputed on load).
  const RUBRIC_V1 = Object.freeze([
    { id: 'intelligence-corroboration', label: 'Corroborate the incident with relevant intelligence' },
    { id: 'ioc-lifecycle', label: 'Maintain accurate IOC context and lifecycle' },
    { id: 'query-rule-quality', label: 'Build a focused query and appropriately tuned rule' },
    { id: 'scheduled-execution', label: 'Enable and schedule rule execution' },
    { id: 'alert-coverage', label: 'Generate alert coverage for the supported malicious activity' },
    { id: 'alert-tuning', label: 'Avoid alerting on the documented benign retry' },
    { id: 'automation-boundary', label: 'Keep automation bounded and disruptive actions approval-gated' },
    { id: 'case-documentation', label: 'Document a supported disposition, escalation, and rationale' },
  ].map(Object.freeze));
  const VERDICT_CRITERION = Object.freeze({ id: 'intelligence-verdicts', label: 'Judge each indicator against the case evidence' });
  const RUBRIC = Object.freeze([...RUBRIC_V1.slice(0, 2), VERDICT_CRITERION, ...RUBRIC_V1.slice(2)]);
  const CURRENT_VERSION = 2;
  const MIN_RATIONALE = 25;
  const WRONG_VERDICT_DEDUCTION = 2;

  const list = (value) => Array.isArray(value) ? value : [];
  const unique = (values) => [...new Set(values.filter((value) => Boolean(value)))];
  const isDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const containsText = (value, terms) => typeof value === 'string' && terms.some((term) => value.toLowerCase().includes(term));
  const intersect = (left, right) => left.filter((item) => right.includes(item));

  const mentions = (text, token) => typeof text === 'string' && typeof token === 'string' && token.length > 0
    && text.toLowerCase().includes(token.toLowerCase());

  // One indicator's verdict against the scenario truth. Pure; shared by scoring and Practice It feedback.
  //   verdict:   'correct' | 'undecided' (unknown although the records support a verdict) | 'contradicted' | 'missing'
  //   reasoning: true when the rationale is long enough and, where records support a verdict, cites one of them.
  function evaluateVerdict(truth, indicatorId, entry) {
    const expected = truth?.indicatorDecisions?.[indicatorId];
    const refs = list(truth?.indicatorEvidence?.[indicatorId]);
    const decidable = Boolean(expected) && expected !== 'unknown';
    const decision = entry && typeof entry.decision === 'string' ? entry.decision : '';
    const rationale = entry && typeof entry.rationale === 'string' ? entry.rationale.trim() : '';
    if (!expected || !['malicious', 'benign', 'unknown'].includes(decision)) return { id: indicatorId, expected, decision, verdict: 'missing', reasoning: false, cites: false, decidable };
    const cites = refs.some((token) => mentions(rationale, token));
    const documented = rationale.length >= MIN_RATIONALE && (!decidable || cites);
    if (decision === expected) return { id: indicatorId, expected, decision, verdict: 'correct', reasoning: documented, cites, decidable };
    if (decision === 'unknown') return { id: indicatorId, expected, decision, verdict: 'undecided', reasoning: documented, cites, decidable };
    return { id: indicatorId, expected, decision, verdict: 'contradicted', reasoning: false, cites, decidable };
  }

  // Partial credit per indicator: its points minus one for the verdict, one for documented reasoning.
  // An explicit verdict the records contradict also costs a deduction; leaving a decidable indicator
  // unknown costs the verdict credit only (cautious, not wrong). Reasoning that cites the records is
  // credited even when the learner stopped short of a verdict.
  function extractVerdicts(assessment, fixture) {
    const truth = fixture.scenario.truth;
    const indicators = list(fixture.scenario.verdictIndicators);
    const verdicts = assessment.intelVerdicts && typeof assessment.intelVerdicts === 'object' && !Array.isArray(assessment.intelVerdicts) ? assessment.intelVerdicts : {};
    const awards = [], deductions = [], evidence = [], misses = [], detail = [];
    indicators.forEach((indicator) => {
      const total = Number(truth.indicatorPoints?.[indicator.id]) || 2;
      const result = evaluateVerdict(truth, indicator.id, verdicts[indicator.id]);
      const label = `${indicator.value} (${indicator.id})`;
      let earned = 0;
      if (result.verdict === 'correct') {
        awards.push({ points: total - 1, reason: `${label}: ${result.decision} is supported by the case evidence.` });
        earned += total - 1;
        evidence.push(`${indicator.id}: ${result.decision}`);
      } else if (result.verdict === 'contradicted') {
        deductions.push({ points: WRONG_VERDICT_DEDUCTION, reason: `${label}: explicit verdict "${result.decision}" is contradicted by the case evidence.` });
        misses.push(`${label}: explicit verdict "${result.decision}" is contradicted by the case evidence.`);
        evidence.push(`${indicator.id}: ${result.decision} (contradicted)`);
      } else if (result.verdict === 'undecided') {
        misses.push(`${label}: left unknown although the case records support a verdict.`);
        evidence.push(`${indicator.id}: unknown`);
      } else {
        misses.push(`${label}: no verdict recorded.`);
      }
      if (result.reasoning && result.verdict !== 'contradicted' && result.verdict !== 'missing') {
        awards.push({ points: 1, reason: `${label}: the reasoning ${result.decidable ? 'cites a record or entity from this case' : 'explains why the evidence is insufficient'}.` });
        earned += 1;
      } else if (result.verdict === 'correct') {
        misses.push(`${label}: the reasoning ${result.decidable ? 'does not cite a record or entity from this case' : 'is too brief to explain the gap'}.`);
      }
      detail.push({ indicatorId: indicator.id, value: indicator.value, decision: result.decision, expected: result.expected, verdict: result.verdict, reasoningCredited: Boolean(result.reasoning && ['correct', 'undecided'].includes(result.verdict)), points: earned, max: total });
    });
    const full = indicators.length > 0 && detail.every((item) => item.verdict === 'correct' && item.points === item.max);
    return { id: VERDICT_CRITERION.id, awarded: full, evidence: unique(evidence), misses: full ? [] : unique(indicators.length ? misses : ['No indicators are configured for verdicts.']), awards, deductions, detail };
  }

  function extract(state, fixture, options) {
    const rubricVersion = options && options.rubricVersion === 1 ? 1 : CURRENT_VERSION;
    const assessment = state?.assessment && typeof state.assessment === 'object' ? state.assessment : {};
    const truth = fixture?.scenario?.truth;
    if (!truth) throw new TypeError('M04 expected scenario truth is required.');
    const criteria = [];
    const add = (id, passed, evidence, misses) => criteria.push({
      id, awarded: Boolean(passed), evidence: unique(evidence), misses: passed ? [] : unique(misses),
    });

    const reports = list(assessment.reports);
    const iocs = list(assessment.iocs);
    const correctIoc = iocs.find((ioc) => String(ioc.value || '').toLowerCase() === String(truth.maliciousSourceIp).toLowerCase()
      && (ioc.type === 'ip' || ioc.type === 'ipv4'));
    const sourceReport = correctIoc && reports.find((report) => report.id === correctIoc.sourceReportId);
    const iocEvents = list(assessment.automationResults).filter((result) => result.type === 'indicator_enrichment'
      && result.status === 'succeeded' && (result.iocId === correctIoc?.id || result.targetId === correctIoc?.id));
    const exactEnrichment = iocEvents.find((result) => intersect(list(result.matchedEventIds), truth.rule.matchEventIds).length > 0);
    const iocAction = list(assessment.actionHistory).some((entry) => entry.type === 'ioc_edit'
      && entry.details?.recordId === correctIoc?.id);
    const reportCredible = sourceReport && Number(sourceReport.confidence) >= 0 && Number(sourceReport.confidence) <= 100
      && isDate(sourceReport.time) && String(sourceReport.sourceReliability || '').trim().length > 0;
    add('intelligence-corroboration', Boolean(correctIoc && reportCredible && exactEnrichment),
      [correctIoc?.id, sourceReport?.id, exactEnrichment?.executionId],
      [!correctIoc && 'No IOC matching the expected malicious source IP is present.',
        correctIoc && !reportCredible && 'The matching IOC lacks a linked, dated report with assessed confidence.',
        correctIoc && reportCredible && !exactEnrichment && 'No persisted successful enrichment links the IOC to matching incident telemetry.']);
    const lifecycle = Boolean(correctIoc && correctIoc.status === 'active' && isDate(correctIoc.firstSeen)
      && isDate(correctIoc.lastSeen) && Date.parse(correctIoc.firstSeen) <= Date.parse(correctIoc.lastSeen)
      && correctIoc.sourceReportId && sourceReport && iocAction);
    add('ioc-lifecycle', lifecycle,
      [correctIoc?.id, correctIoc?.sourceReportId, iocAction && 'IOC lifecycle edit recorded'],
      ['The matching IOC must remain active, have chronological observation dates and a linked report, with a persisted learner lifecycle edit.']);

    // Rules group on the real KQL column (SourceIp); the truth key is camelCase.
    const sameField = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
    const executions = list(assessment.executions);
    const ruleById = new Map(list(assessment.rules).map((rule) => [rule.id, rule]));
    const savedQueries = list(assessment.savedQueries);
    const matchingRule = list(assessment.rules).find((rule) => {
      const query = savedQueries.find((item) => item.id === rule.queryId);
      const queryText = rule.query || query?.query;
      const expectedIds = truth.rule.matchEventIds;
      const knownEvents = new Set(list(fixture.scenario.telemetry).map((item) => item.id));
      const validFields = new Set(['sourceIp', 'SourceIp', 'Account']);
      return typeof queryText === 'string' && queryText.trim().length > 0
        && validFields.has(rule.groupingField)
        && Number.isSafeInteger(rule.threshold) && rule.threshold >= 1 && rule.threshold <= expectedIds.length
        && Number.isSafeInteger(rule.windowMinutes) && rule.windowMinutes >= 1 && rule.windowMinutes <= 1440
        && (!rule.queryId || query || typeof rule.query === 'string')
        && [...knownEvents].length > 0;
    });
    const ruleExecution = executions.filter((execution) => ruleById.has(execution.ruleId))
      .sort((a, b) => String(b.completedAt || b.requestedAt || '').localeCompare(String(a.completedAt || a.requestedAt || '')))[0];
    const executedRule = ruleById.get(ruleExecution?.ruleId);
    const queryTested = Boolean(matchingRule && list(assessment.actionHistory).some((entry) => entry.type === 'query_test'
      && entry.details?.succeeded === true && (entry.details.query === matchingRule.query
        || entry.details.query === savedQueries.find((item) => item.id === matchingRule.queryId)?.query)));
    const sensibleRule = Boolean(matchingRule && sameField(matchingRule.groupingField, truth.rule.groupingField)
      && matchingRule.threshold <= truth.rule.threshold && matchingRule.windowMinutes >= truth.rule.windowMinutes
      && executedRule?.id === matchingRule.id);
    add('query-rule-quality', sensibleRule && queryTested,
      [matchingRule?.id, matchingRule?.queryId, queryTested && 'Query test recorded', ruleExecution?.id],
      [!queryTested && 'No successful query-test action is recorded.', !matchingRule && 'No saved rule has usable query, grouping, threshold, and window settings.',
        matchingRule && !sensibleRule && 'The executed rule does not use a compatible source grouping, threshold, and lookback window.']);
    const scheduledExecution = executions.find((execution) => execution.ruleId === matchingRule?.id
      && execution.mode === 'scheduled' && execution.status === 'completed');
    const scheduleAction = list(assessment.actionHistory).some((entry) => entry.type === 'scheduling'
      && entry.details?.ruleId === matchingRule?.id && entry.details?.enabled === true
      && isDate(entry.details?.scheduledAt));
    add('scheduled-execution', Boolean(matchingRule?.enabled && isDate(matchingRule.schedule?.scheduledAt)
      && Number.isSafeInteger(matchingRule.schedule?.frequencyMinutes) && matchingRule.schedule.frequencyMinutes >= 5
      && scheduleAction && scheduledExecution),
      [matchingRule?.id, scheduleAction && 'Enabled schedule change recorded', scheduledExecution?.id],
      ['No enabled, valid schedule and completed scheduled execution are both evidenced for the qualifying rule.']);

    const alerts = list(assessment.alerts);
    const alertMatches = alerts.filter((alert) => alert.ruleId === matchingRule?.id || alert.sourceRule === matchingRule?.name);
    const hitAlert = alertMatches.find((alert) => sameField(alert.groupingField, truth.rule.groupingField)
      && String(alert.group) === String(truth.maliciousSourceIp)
      && intersect(list(alert.eventIds), truth.rule.matchEventIds).length >= truth.rule.threshold);
    add('alert-coverage', Boolean(hitAlert),
      [hitAlert?.id, hitAlert?.executionId, ...intersect(list(hitAlert?.eventIds), truth.rule.matchEventIds)],
      ['No generated alert covers the expected malicious source and enough expected event evidence to meet the threshold.']);
    const benignIds = list(truth.rule.excludeEventIds);
    const benignAlert = alertMatches.find((alert) => intersect(list(alert.eventIds), benignIds).length > 0);
    const safeguardsUsed = Boolean(matchingRule && (matchingRule.exclusion?.enabled || matchingRule.suppression?.enabled));
    add('alert-tuning', Boolean(hitAlert && !benignAlert && safeguardsUsed),
      [hitAlert?.id, safeguardsUsed && 'Exclusion or suppression configured', ...list(ruleExecution?.reviewEvidence?.excluded).flatMap((item) => list(item.supportingEventIds)),
        ...list(ruleExecution?.reviewEvidence?.suppressed).flatMap((item) => list(item.supportingEventIds))],
      [!safeguardsUsed && 'No persisted exclusion or suppression safeguard is configured.', benignAlert && 'A generated alert includes the known benign retry events.', !hitAlert && 'A qualifying malicious alert is also required.']);

    const autoActions = list(assessment.automationActions);
    const autoExecutions = list(assessment.automationExecutions);
    const autoSafe = autoActions.length > 0 && autoExecutions.length >= autoActions.length
      && autoExecutions.every((execution) => execution.details?.readOnly === true
        && Array.isArray(execution.details?.sideEffects) && execution.details.sideEffects.length === 0)
      && autoActions.every((action) => autoExecutions.some((execution) => execution.actionId === action.id));
    const approvals = list(assessment.approvalRequests);
    const approvalSafe = approvals.every((request) => ['pending', 'approved', 'rejected'].includes(request.status)
      && list(request.audit).every((entry) => !Object.hasOwn(entry, 'execution') || entry.execution === 'never'));
    const automationAudit = list(assessment.actionHistory).some((entry) => ['automation', 'automation_action_recorded', 'automation_execution_recorded'].includes(entry.type));
    add('automation-boundary', autoSafe && approvalSafe && (automationAudit || approvals.length > 0),
      [...autoActions.map((item) => item.id), ...autoExecutions.map((item) => item.id), ...approvals.map((item) => item.id)],
      ['No linked, read-only simulated automation and approval-gated disruptive-action evidence is recorded.']);

    const caseRecord = state?.caseRecord && typeof state.caseRecord === 'object' ? state.caseRecord : {};
    const notes = String(caseRecord.notes || '').trim();
    const disposition = ['true-positive', 'true_positive', 'confirmed-malicious'].includes(String(caseRecord.disposition || '').toLowerCase());
    const escalated = Boolean(caseRecord.escalation || caseRecord.escalateTo);
    const rationale = containsText(notes, ['spray', 'credential', 'sign-in', 'sign in', 'authentication'])
      && containsText(notes, ['198.51.100.64', 'acct-44', 'ioc', 'indicator']);
    add('case-documentation', Boolean(disposition && escalated && notes.length >= 40 && rationale),
      [caseRecord.disposition, caseRecord.escalateTo || caseRecord.escalation, notes.length >= 40 && 'Case rationale recorded'],
      [!disposition && 'Case disposition does not identify the supported activity as malicious.', !escalated && 'No escalation or receiving team is documented.',
        notes.length < 40 && 'Case notes are missing or too brief to support review.', notes.length >= 40 && !rationale && 'Case notes do not connect the authentication evidence to the relevant indicator or account.']);

    if (rubricVersion >= 2) {
      const verdictCriterion = extractVerdicts(assessment, fixture);
      criteria.splice(2, 0, verdictCriterion);
    }
    return { rubricVersion, criteria };
  }

  return Object.freeze({ RUBRIC, RUBRIC_V1, CURRENT_VERSION, MIN_RATIONALE, WRONG_VERDICT_DEDUCTION, evaluateVerdict, extract });
})();

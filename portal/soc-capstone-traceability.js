/* Capstone traceability map: every graded Module 12 mechanic -> the earlier
 * module that teaches it (Practice It, guided lab), the module that assesses
 * it (Prove It, rubric criterion) and the shared code behind all three.
 *
 * Purpose (owner rule, 2026-10-07): a bug seen in the capstone is looked up
 * here and fixed or checked at its source module. M12 embeds the M04-M10
 * tool packs directly (portal/soc-m12-assessment-console.js mount() mounts
 * SocConsoleTools.PACKS.m04 .. m10), so a pack bug seen in M12 is the same
 * bug in its home module.
 *
 * Plain data, no DOM. tests/capstone-traceability.test.js keeps it honest:
 * every graded M12 mechanic needs an entry, every module reference must exist
 * in the code, and any empty practice/prove list must carry a `gap` that is
 * also named in that test's KNOWN_GAPS allowlist.
 *
 * Entry shape
 *   id         stable kebab-case key
 *   capstone   { criterion: SocM12AssessmentRubric criterion id,
 *                mechanic: what the learner has to do,
 *                tab: M12 console tab where they do it,
 *                recordedAs: the M12 action / ticket field that carries it,
 *                rubricText: exact rubric award / deduction / miss text(s)
 *                  from extractV2 (static part of templated strings),
 *                missingCheck: moduleTwelveActionMissing() message(s),
 *                actionTypes: SocM12AssessmentState action types,
 *                ticketFields: ticket fields (moduleTwelveCaseSpec) }
 *   practice   [{ module, lab:'guided', where:{ tab, step }, coverage }]
 *              step = the guide step id (M03) or title (every other module).
 *              coverage 'direct' = the step is about this mechanic;
 *              'generic' = a ticket-driven step that only touches it.
 *   prove      [{ module, criterion }] rubric criterion id in that module
 *              (M01/M02: key of the stored score breakdown).
 *   code       shared implementation files, 'path' or 'path#substring'.
 *   related    nearest homes that are NOT the same control (documentation).
 *   exposedIn  guided consoles that contain the tool although no step
 *              teaches it (a bug there would still surface in that module).
 *   gap        required when practice or prove is empty: what is missing.
 *   notes      anything a maintainer needs when tracing a bug. */
const SocCapstoneTraceability = (() => {
  'use strict';

  const P = (module, tab, step, coverage = 'direct') => ({ module, lab: 'guided', where: { tab, step }, coverage });
  const V = (module, criterion) => ({ module, criterion });

  // Every entry is performed in the M12 console, which mounts the M04-M10 packs.
  const M12 = ['portal/soc-m12-assessment-console.js#mount', 'portal/soc-m12-tool-bridge.js', 'portal/soc-m12-assessment-state.js'];
  const TOOLS = 'portal/soc-console-tools.js';

  const ENTRIES = [
    // ------------------------------------------------ intelligence-preparation
    {
      id: 'intel-verdict-corroborated',
      capstone: { criterion: 'intelligence-preparation', mechanic: 'Record a malicious / benign / unknown verdict per indicator with a rationale that cites corroborating records', tab: 'intelligence', recordedAs: 'intel-decision { indicatorId, decision, rationale }', rubricText: ['An intelligence determination cites corroborating incident evidence or entities.', 'No corroborated intelligence determination.'], missingCheck: ['No intelligence verdict recorded yet'], actionTypes: ['intel-decision'] },
      practice: [P('M04', 'intelligence', 'Judge the reported source'), P('M04', 'intelligence', 'Know when the answer is unknown')],
      prove: [V('M04', 'intelligence-verdicts'), V('M04', 'intelligence-corroboration')],
      code: [...M12, `${TOOLS}#PACKS.m04`, 'portal/soc-m04-intelligence-ui.js', 'portal/soc-m04-assessment-state.js', 'portal/soc-m04-assessment-rubric.js'],
      notes: 'M12 TI-604 is the "unknown is correct" case. M12 records the verdict through its own contextual form (intelligence tab) or through the M04 pack ioc_edit decision, which the bridge projects.',
    },
    {
      id: 'intel-wrong-verdict-deduction',
      capstone: { criterion: 'intelligence-preparation', mechanic: 'An explicit verdict the records contradict costs points; unknown never does', tab: 'intelligence', recordedAs: 'intel-decision (decision differs from expectedTruth.indicatorDecisions)', rubricText: ['explicit intelligence verdict contradicts the available evidence.'], actionTypes: [] },
      practice: [P('M04', 'intelligence', 'Rule out a benign explanation')],
      prove: [V('M04', 'intelligence-verdicts')],
      code: [...M12, `${TOOLS}#PACKS.m04`, 'portal/soc-m04-assessment-rubric.js'],
      notes: 'M04 deducts 2 per contradicted verdict, M12 deducts 5. Same rule, different weight.',
    },

    // ------------------------------------------------ queries-detection-scheduling
    {
      id: 'query-correlated',
      capstone: { criterion: 'queries-detection-scheduling', mechanic: 'Run a reproducible query whose results correlate at least three primary records across sources', tab: 'search', recordedAs: 'query-run { query } (outcome derived by evaluating the query)', rubricText: ['Historical query results correlate incident evidence.', 'No cross-source correlated query outcome.'], missingCheck: ['No query test recorded yet'], actionTypes: ['query-run'] },
      practice: [P('M03', 'search', 'auth'), P('M03', 'search', 'session'), P('M03', 'search', 'scope'), P('M04', 'search', 'Start from the lead', 'generic')],
      prove: [V('M03', 'investigation'), V('M04', 'query-rule-quality'), V('M06', 'query-and-pivots')],
      code: [...M12, 'portal/soc-m12-tool-bridge.js', 'portal/soc-analyst-module-03-environment.js', `${TOOLS}#PACKS.m04`, `${TOOLS}#PACKS.m06`, 'portal/kql-engine.js', 'portal/soc-m04-rules-ui.js'],
      notes: 'Three recorders, all projected by soc-m12-tool-bridge.js: the M03 Log Search history (queryLog, since 2026-10-07), the M04 pack query tester (Analytics Rules tab, query_test) and the M06 pack Hunting tab (query_run).',
    },
    {
      id: 'rule-saved',
      capstone: { criterion: 'queries-detection-scheduling', mechanic: 'Save a detection rule built from a correlated query', tab: 'rules', recordedAs: 'rule-save { ruleId, query } (from M04 pack rule_change)', rubricText: ['A correlated detection rule is saved.', 'No correlated saved rule.'], missingCheck: ['No detection rule saved yet'], actionTypes: ['rule-save'] },
      practice: [],
      prove: [V('M04', 'query-rule-quality')],
      code: [...M12, `${TOOLS}#PACKS.m04`, 'portal/soc-m04-rules-ui.js', 'portal/soc-m04-rule-evaluator.js'],
      exposedIn: [{ module: 'M04', lab: 'guided', tab: 'rules' }],
      gap: 'No M04 Guided Lab step teaches building and saving a correlated rule. The Analytics Rules tab is open in that console but the guide goes lead, correlate, verdicts, ticket.',
      notes: 'The M04 "why grouping changes the alert" reference card in the Guided Lab explains rule grouping but does not ask the learner to save a rule.',
    },
    {
      id: 'rule-scheduled',
      capstone: { criterion: 'queries-detection-scheduling', mechanic: 'Enable a recurring schedule on the correlated rule', tab: 'rules', recordedAs: 'rule-schedule { ruleId, frequency } (from M04 pack scheduling)', rubricText: ['The correlated rule has a recurring schedule.', 'No recurring correlated rule schedule.'], missingCheck: ['No detection schedule recorded yet'], actionTypes: ['rule-schedule'] },
      practice: [],
      prove: [V('M04', 'scheduled-execution')],
      code: [...M12, `${TOOLS}#PACKS.m04`, 'portal/soc-m04-rules-ui.js'],
      exposedIn: [{ module: 'M04', lab: 'guided', tab: 'rules' }],
      gap: 'No M04 Guided Lab step teaches enabling and scheduling a rule (same missing step as rule-saved).',
    },

    // ------------------------------------------------ alert-incident-management
    {
      id: 'alert-disposition-supported',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Call each alert true-positive / benign-positive / false-positive from the records', tab: 'alerts', recordedAs: 'review-alert { alertId, disposition, reason } (M12 alerts tab, or M04 pack alert_review)', rubricText: ['Supported alert dispositions.'], missingCheck: ['No alert determination recorded yet'], actionTypes: ['review-alert', 'alert-disposition'] },
      practice: [P('M03', 'alerts', 'disp-tp'), P('M03', 'alerts', 'disp-benign'), P('M03', 'alerts', 'disp-false')],
      prove: [V('M11', 'alert-disposition')],
      code: [...M12, 'portal/soc-analyst-module-03-environment.js#M03E_GUIDE_STEPS', 'portal/soc-m11-assessment-rubric.js', 'portal/soc-m11-assessment-state.js'],
      related: [V('M04', 'alert-coverage')],
      notes: 'M12 also treats an alert generated by a correlated query as a true positive. M03 Prove It scores one overall verdict (criterion verdict), not per-alert calls; the per-alert Prove home is M11.',
    },
    {
      id: 'alert-disposition-needs-investigation',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Use needs-investigation when telemetry cannot yet support a call (AL-1208); it is never penalised', tab: 'alerts', recordedAs: 'review-alert disposition needs-investigation', rubricText: [], actionTypes: [] },
      practice: [P('M03', 'alerts', 'disp-ni')],
      prove: [V('M11', 'alert-disposition')],
      code: [...M12, 'portal/soc-analyst-module-03-environment.js#disp-ni', 'portal/soc-m11-assessment-rubric.js'],
      notes: 'M12 stores needs-investigation hyphenated, M11 stores needs_investigation; both display as "Needs investigation".',
    },
    {
      id: 'alert-disposition-unsupported-deduction',
      capstone: { criterion: 'alert-incident-management', mechanic: 'An explicit disposition the records contradict costs points', tab: 'alerts', recordedAs: 'review-alert (disposition differs from expectedTruth.alertDispositions)', rubricText: ['unsupported alert disposition.'], actionTypes: [] },
      practice: [P('M03', 'alerts', 'disp-benign'), P('M03', 'alerts', 'disp-false')],
      prove: [V('M11', 'alert-disposition')],
      code: [...M12, 'portal/soc-m11-assessment-rubric.js'],
    },
    {
      id: 'alert-incident-link',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Link the supported alert to the incident record by incident id', tab: 'alerts', recordedAs: 'incident-link { alertId, incidentId }', rubricText: ['A supported alert is linked to the incident.', 'No supported incident association.'], missingCheck: ['No alert-to-incident relationship recorded yet'], actionTypes: ['incident-link'] },
      practice: [],
      prove: [],
      code: [...M12],
      related: [V('M07', 'incident-evidence'), V('M08', 'incident-link')],
      gap: 'The alert-to-incident link form exists only in the M12 alerts tab. M07 and M08 teach and assess linking evidence or findings to an incident through different controls; no earlier module asks the learner to link an alert to an incident id.',
    },
    {
      id: 'alert-incident-link-unrelated-deduction',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Linking an alert the records show is unrelated costs points', tab: 'alerts', recordedAs: 'incident-link on an alert that is not a true positive', rubricText: ['unrelated alert linked to the incident.'], actionTypes: [] },
      practice: [],
      prove: [],
      code: [...M12],
      related: [V('M07', 'noise-rejection')],
      gap: 'Same missing home as alert-incident-link: no earlier module links alerts to an incident, so none penalises linking an unrelated one.',
    },
    {
      id: 'ticket-priority-scope-justified',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Ticket affected user and device, high or critical severity, and a priority rationale that cites primary evidence', tab: 'case', recordedAs: 'ticketCore on the technical report / scope finding (priorityRationale, severity, affectedUser, affectedDevice)', rubricText: ['Ticket priority and affected entities are justified by cited evidence.', 'Ticket priority/scope is incomplete or unsupported.'], ticketFields: ['priorityRationale', 'severity', 'affectedUser', 'affectedDevice'] },
      practice: [P('M01', 'case', 'Scope and decide'), P('M03', 'itsm', 'decide'), P('M04', 'case', 'Scope and decide')],
      prove: [V('M01', 'affected_entity'), V('M01', 'severity'), V('M02', 'affected_entity'), V('M02', 'severity'), V('M03', 'verdict'), V('M03', 'evidence')],
      code: [...M12, 'portal/case-record.js', 'portal/soc-analyst-module-12.js#moduleTwelveCaseSpec'],
      notes: 'The ticket form is the shared case-record pane (caseRecordPane); a ticket-field bug seen in M12 is the same code in every module. M01/M02 score the entity tier and severity but not an evidence-citing priority rationale.',
    },
    {
      id: 'ticket-disposition-escalation',
      capstone: { criterion: 'alert-incident-management', mechanic: 'Ticket status, disposition, escalation and routing department', tab: 'case', recordedAs: 'ticketCore (status, disposition, escalation, escalateTo); status also decides the closure decision', rubricText: [], ticketFields: ['status', 'disposition', 'escalation', 'escalateTo'] },
      practice: [P('M01', 'case', 'Scope and decide'), P('M03', 'itsm', 'decide'), P('M09', 'case', 'Set scope and decide')],
      prove: [V('M01', 'disposition'), V('M01', 'escalation'), V('M02', 'disposition'), V('M02', 'escalation'), V('M03', 'verdict'), V('M03', 'response')],
      code: [...M12, 'portal/case-record.js'],
      notes: 'Recorded for instructor review; rubric v2 does not score disposition, escalation or department directly (only status via the closure decision).',
    },

    // ------------------------------------------------ cross-domain-investigation
    {
      id: 'domain-identity',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Evidence-linked finding on identity records (sign-in and token activity)', tab: 'evidence', recordedAs: 'investigation { domain: identity, finding, evidenceIds }', rubricText: ['evidence-linked domain analysis.'], missingCheck: ['No cross-domain investigation finding recorded yet'], actionTypes: ['investigation'] },
      practice: [P('M03', 'search', 'auth'), P('M03', 'search', 'session'), P('M03', 'entities', 'baseline')],
      prove: [V('M03', 'investigation'), V('M03', 'evidence'), V('M02', 'access_finding')],
      code: [...M12, 'portal/soc-analyst-module-03-environment.js', 'portal/soc-m12-assessment-console.js#findingControls'],
    },
    {
      id: 'domain-email',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Evidence-linked finding on mail delivery and click records', tab: 'email', recordedAs: 'investigation { domain: email, finding, evidenceIds } (M12 finding form or M07 pack notes)', rubricText: ['evidence-linked domain analysis.'], missingCheck: ['No cross-domain investigation finding recorded yet'], actionTypes: ['investigation'] },
      practice: [P('M07', 'email', 'Start from the lead', 'generic'), P('M07', 'email', 'Correlate the records', 'generic')],
      prove: [V('M07', 'confirmed-chain'), V('M07', 'delivery-scope')],
      code: [...M12, `${TOOLS}#PACKS.m07`, 'portal/soc-m07-assessment-email-ui.js'],
      notes: 'The M07 guide steps are ticket-driven; the Email tab is open and targeted but no step names the delivered / blocked recipient split.',
    },
    {
      id: 'domain-endpoint',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Evidence-linked finding on endpoint process, file and registry records', tab: 'endpoint', recordedAs: 'investigation { domain: endpoint, finding, evidenceIds } (M12 finding form or M05 pack analysis_note)', rubricText: ['evidence-linked domain analysis.'], missingCheck: ['No cross-domain investigation finding recorded yet'], actionTypes: ['investigation'] },
      practice: [P('M05', 'alerts', 'Start from the lead', 'generic'), P('M05', 'timeline', 'Correlate the records', 'generic')],
      prove: [V('M05', 'process-ancestry'), V('M05', 'malicious-benign-interpretation'), V('M05', 'persistence')],
      code: [...M12, `${TOOLS}#PACKS.m05`, 'portal/soc-m05-assessment-device-ui.js'],
      notes: 'The M05 guide steps are ticket-driven; no step names process ancestry or persistence.',
    },
    {
      id: 'domain-network',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Evidence-linked finding on DNS, proxy, firewall and session records', tab: 'network', recordedAs: 'investigation { domain: network, finding, evidenceIds } (M12 finding form or M07 pack network_review)', rubricText: ['evidence-linked domain analysis.'], missingCheck: ['No cross-domain investigation finding recorded yet'], actionTypes: ['investigation'] },
      practice: [P('M07', 'network', 'Correlate the records', 'generic')],
      prove: [V('M07', 'confirmed-chain')],
      code: [...M12, `${TOOLS}#PACKS.m07`, 'portal/soc-m07-assessment-network-ui.js'],
    },
    {
      id: 'domain-exposure',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Evidence-linked finding on exposure and control records', tab: 'exposure', recordedAs: 'investigation { domain: exposure, finding, evidenceIds } (M12 finding form or M08 pack finding_review)', rubricText: ['evidence-linked domain analysis.'], missingCheck: ['No cross-domain investigation finding recorded yet'], actionTypes: ['investigation'] },
      practice: [P('M08', 'alerts', 'Validate applicability'), P('M08', 'evidence', 'Compare local risk')],
      prove: [V('M08', 'audited-finding-review'), V('M08', 'freshness-applicability'), V('M08', 'asset-context-controls')],
      code: [...M12, `${TOOLS}#PACKS.m08`, 'portal/soc-m08-assessment-ui.js'],
    },
    {
      id: 'domain-contradicted-malicious-deduction',
      capstone: { criterion: 'cross-domain-investigation', mechanic: 'Calling activity malicious while citing evidence that contradicts it costs that domain its points', tab: 'evidence', recordedAs: 'investigation (malicious wording) citing a CONTRADICTORY record', rubricText: ['explicit malicious conclusion cites contradictory evidence.'], actionTypes: [] },
      practice: [P('M03', 'watchlists', 'lookalikes'), P('M05', 'timeline', 'Correlate the records', 'generic')],
      prove: [V('M05', 'malicious-benign-interpretation'), V('M07', 'noise-rejection'), V('M06', 'scope-and-comparison'), V('M03', 'scope')],
      code: [...M12, 'portal/soc-m12-assessment-rubric.js#maliciousClaim'],
    },

    // ------------------------------------------------ timeline-scope-evidence-attack
    {
      id: 'timeline-chronological',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'Reconstruct at least three pinned primary records in chronological order', tab: 'timeline', recordedAs: 'investigation { domain: timeline, evidenceIds } (M10 pack timeline, or M12 finding form)', rubricText: ['Pinned evidence is reconstructed in chronological order.', 'No chronological reconstruction of at least three pinned incident records.'], actionTypes: ['investigation'] },
      practice: [P('M03', 'search', 'sort'), P('M03', 'timeline', 'timeline'), P('M10', 'timeline', 'Reconstruct the chronology')],
      prove: [V('M10', 'timeline')],
      code: [...M12, `${TOOLS}#PACKS.m10`, 'portal/soc-m10-assessment-state.js'],
      notes: 'Pins also feed evidence-retained; the timeline award requires the records to be pinned first.',
    },
    {
      id: 'scope-confirmed-entities',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'Name the confirmed affected entities (ws-204, acct-204) in a scope finding backed by primary records', tab: 'evidence', recordedAs: 'investigation { domain: scope } (M12 finding form, M07 incident_link, or the ticket scopeStatement)', rubricText: ['Confirmed entities and bounded secondary scope evidence.'], actionTypes: ['investigation'], ticketFields: ['scopeStatement'] },
      practice: [P('M03', 'search', 'scope'), P('M03', 'entities', 'baseline')],
      prove: [V('M03', 'scope'), V('M05', 'affected-device-scope'), V('M07', 'delivery-scope')],
      code: [...M12, 'portal/soc-analyst-module-12.js#moduleTwelveSyncTicket'],
    },
    {
      id: 'scope-bounded-negative',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'State a "no second device" finding bounded by the source and time coverage that supports it (NW-504)', tab: 'network', recordedAs: 'investigation { domain: scope } citing the bounded-negative record and saying what was not covered', rubricText: ['Scope lacks bounded secondary evidence.'], actionTypes: ['investigation'] },
      practice: [P('M03', 'sources', 'health', 'generic'), P('M03', 'search', 'scope')],
      prove: [V('M07', 'unknown-boundaries'), V('M06', 'uncertainty-boundary'), V('M08', 'uncertainty-boundary')],
      code: [...M12, 'portal/soc-m12-assessment-rubric.js#secondaryScope'],
      notes: 'M03 Prove It scores an unsupported t.nguyen call but not an explicit bounded-negative statement, so the Prove homes are the three modules that assess retaining uncertainty.',
    },
    {
      id: 'evidence-retained',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'Pin the relevant records (up to three credited)', tab: 'evidence', recordedAs: 'evidence-select { evidenceId, selected }', rubricText: ['Relevant evidence is retained.'], missingCheck: ['No evidence selected yet'], actionTypes: ['evidence-select'] },
      practice: [P('M03', 'evidence', 'pin'), P('M03', 'evidence', 'contributing')],
      prove: [V('M03', 'evidence'), V('M05', 'evidence-preservation'), V('M06', 'evidence-collection'), V('M10', 'evidence-selection')],
      code: [...M12, 'portal/soc-analyst-module-03-environment.js', 'portal/soc-m12-assessment-console.js#evidence-select'],
      notes: 'Pins are read from the shared M03 console state (consoleState.pins), not from a pack, so the bridge diffs them on every save.',
    },
    {
      id: 'attack-mapping',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'Map ATT&CK techniques only to demonstrated behavior, citing the supporting record (three credited)', tab: 'attack', recordedAs: 'attack-map { technique, evidenceIds } (from M06 pack attack_mapping_change)', rubricText: ['ATT&CK mappings cite demonstrated behavior.'], missingCheck: ['No ATT&CK determination recorded yet'], actionTypes: ['attack-map'] },
      practice: [],
      prove: [V('M06', 'attack-mapping'), V('M10', 'attack-linkage')],
      code: [...M12, `${TOOLS}#PACKS.m06`, 'portal/attack-catalog.js'],
      exposedIn: [{ module: 'M06', lab: 'guided', tab: 'attack' }],
      gap: 'No Guided Lab step teaches mapping a technique to a record. The ATT&CK tab is open in the M06 and later guided consoles, but the guides never send the learner there.',
    },
    {
      id: 'unsupported-scope-deduction',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'Naming a benign or unrelated entity as affected costs points', tab: 'evidence', recordedAs: 'investigation { domain: scope } or ticket affectedUser / affectedDevice naming ws-118 or acct-091', rubricText: ['unsupported affected-scope determination.'], actionTypes: [] },
      practice: [P('M03', 'watchlists', 'lookalikes')],
      prove: [V('M03', 'scope'), V('M05', 'affected-device-scope'), V('M07', 'noise-rejection')],
      code: [...M12],
    },
    {
      id: 'attack-unsupported-deduction',
      capstone: { criterion: 'timeline-scope-evidence-attack', mechanic: 'An ATT&CK mapping with no supporting behavior costs points', tab: 'attack', recordedAs: 'attack-map whose evidenceIds do not support the technique', rubricText: ['ATT&CK conclusion lacks supporting behavior.'], actionTypes: [] },
      practice: [],
      prove: [V('M06', 'attack-mapping'), V('M10', 'attack-linkage')],
      code: [...M12, `${TOOLS}#PACKS.m06`],
      exposedIn: [{ module: 'M06', lab: 'guided', tab: 'attack' }],
      gap: 'Same missing step as attack-mapping.',
    },

    // ------------------------------------------------ tuning-automation-containment
    {
      id: 'workflow-design',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'Design a response workflow that preserves evidence before approval and approval before isolation (preserve>approval>isolate)', tab: 'response', recordedAs: 'workflow-design { name, nodes, edges }', rubricText: ['Workflow preserves evidence before approval and isolation.'], missingCheck: ['No response workflow recorded yet'], actionTypes: ['workflow-design'] },
      practice: [P('M09', 'response', 'Plan the order of response'), P('M09', 'response', 'Read the workflow check')],
      prove: [V('M09', 'response-workflow-design')],
      code: [...M12, `${TOOLS}#workflowDesignerMarkup`, `${TOOLS}#parseWorkflowEdges`, 'portal/soc-m09-assessment-state.js', 'portal/soc-m09-assessment-rubric.js'],
      related: [V('M04', 'automation-boundary')],
      notes: 'One shared designer renders in M09 and M12. M12 offers nine nodes but its recorder accepts two to eight (selecting all nine errors).',
    },
    {
      id: 'approval-explicit',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'Record an explicit approval for the exact protected action and target', tab: 'response', recordedAs: 'approval { action, target, approved } (from M09 pack approvalStatus)', rubricText: ['Supported containment has an explicit approval.'], actionTypes: ['approval'] },
      practice: [P('M09', 'response', 'Do it the safe way')],
      prove: [V('M09', 'approval-and-containment')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js'],
      related: [V('M04', 'automation-boundary')],
    },
    {
      id: 'containment-executed',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'Execute containment on supported targets (isolate ws-204, revoke acct-204 sessions, block 203.0.113.72); credit is pro-rated over the four safe actions', tab: 'response', recordedAs: 'execute { action, target } (from M09 pack actions)', rubricText: ['Containment executes on supported targets.', 'Containment outcomes remain incomplete.'], missingCheck: ['No response action attempted yet'], actionTypes: ['execute'] },
      practice: [P('M09', 'response', 'Do it the safe way'), P('M09', 'evidence', 'Check response outcomes')],
      prove: [V('M09', 'approval-and-containment'), V('M09', 'outcome-verification')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js'],
      notes: 'The M09 guide runs one approved action; the learner chooses which, so block-indicator and revoke-session are not each walked through.',
    },
    {
      id: 'evidence-preserved-before-eradication',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'Preserve ws-204 evidence (execute preserve) before any eradication; remove-persistence is blocked until it exists', tab: 'automation', recordedAs: 'execute { action: preserve, target: ws-204 } (from M04 automation evidence_preservation or M05 evidence_package_preserved)', rubricText: [], actionTypes: [] },
      practice: [],
      prove: [V('M05', 'evidence-preservation'), V('M09', 'evidence-and-scope'), V('M09', 'evidence-before-eradication'), V('M10', 'preservation')],
      code: [...M12, `${TOOLS}#PACKS.m05`, `${TOOLS}#PACKS.m09`, 'portal/soc-m04-automation.js'],
      exposedIn: [{ module: 'M05', lab: 'guided', tab: 'endpoint' }],
      gap: 'No Guided Lab step performs the preserve action. M09 "Check response outcomes" only reads preservation records, and the M04/M05 guides never open the Automation or Endpoint evidence-package controls.',
      notes: 'preserve is one of the four safeActions, so it feeds the pro-rated containment credit, and it gates the persistence-removal recovery step.',
    },
    {
      id: 'unsafe-execution-deduction',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'Any blocked or out-of-scope response attempt, or a protected action without approval, costs points even if blocked', tab: 'response', recordedAs: 'execute with outcome blocked / not in safeActions / missing approval', rubricText: ['An execution attempt lacks valid scope or approval.'], actionTypes: [] },
      practice: [P('M09', 'response', 'See what an unsafe attempt costs')],
      prove: [V('M09', 'safe-response-conduct'), V('M05', 'unsafe-action-boundary')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js#attemptResponseAction', 'portal/soc-m09-assessment-rubric.js'],
      related: [V('M04', 'automation-boundary')],
      notes: 'M09 Prove It deducts 3 per blocked attempt inside the competency; M12 deducts 6 and also caps the whole score (next entry).',
    },
    {
      id: 'unsafe-execution-cap',
      capstone: { criterion: 'tuning-automation-containment', mechanic: 'An unsafe state-changing attempt caps the whole capstone score at 69 (fail)', tab: 'response', recordedAs: 'rubric unsafeExecution flag -> SocM12AssessmentScorer SAFETY_CAP', rubricText: [], actionTypes: [] },
      practice: [P('M09', 'response', 'See what an unsafe attempt costs')],
      prove: [V('M09', 'safe-response-conduct')],
      code: ['portal/soc-m12-assessment-scorer.js#SAFETY_CAP', 'portal/soc-m12-assessment-rubric.js#unsafeExecution', 'portal/soc-assessment-scorer.js'],
      notes: 'By design M09 Prove It uses a competency deduction, not a whole-score cap (owner may revisit). The Practice step tells the learner the capstone consequence.',
    },

    // ------------------------------------------------ eradication-recovery
    {
      id: 'recovery-persistence-removed',
      capstone: { criterion: 'eradication-recovery', mechanic: 'Remove persistence on ws-204 after evidence is preserved', tab: 'recovery', recordedAs: 'recovery { action: remove-persistence, target: ws-204 } (from M09 pack remove_persistence)', rubricText: ['Persistence removed after preservation.'], missingCheck: ['No recovery validation recorded yet'], actionTypes: ['recovery'] },
      practice: [],
      prove: [V('M09', 'identity-and-persistence'), V('M09', 'evidence-before-eradication')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js'],
      related: [V('M05', 'persistence')],
      exposedIn: [{ module: 'M09', lab: 'guided', tab: 'recovery' }],
      gap: 'No M09 Guided Lab step removes persistence or uses the Recovery tab; the guide stops at the approved containment action.',
    },
    {
      id: 'recovery-sessions-revoked',
      capstone: { criterion: 'eradication-recovery', mechanic: 'Revoke the affected identity sessions (revoke-session:acct-204 must have executed)', tab: 'response', recordedAs: 'execute { action: revoke-session, target: acct-204 }', rubricText: ['Affected identity sessions revoked.'], actionTypes: [] },
      practice: [P('M09', 'response', 'Do it the safe way', 'generic')],
      prove: [V('M09', 'identity-and-persistence')],
      code: [...M12, `${TOOLS}#PACKS.m09`],
      related: [V('M03', 'response')],
      notes: 'Counted both here and in containment-executed. M03 Prove It scores revoking sessions but its Guided Lab does not practise it.',
    },
    {
      id: 'recovery-restored',
      capstone: { criterion: 'eradication-recovery', mechanic: 'Restore the trusted pre-incident recovery point (BK-204-0900) with a recorded approval', tab: 'recovery', recordedAs: 'recovery { action: restore, target: BK-204-0900 } plus approval { action: restore }', rubricText: ['Trusted pre-incident recovery point restored.'], actionTypes: ['recovery'] },
      practice: [],
      prove: [V('M09', 'recovery-readiness')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js'],
      exposedIn: [{ module: 'M09', lab: 'guided', tab: 'recovery' }],
      gap: 'No M09 Guided Lab step selects and restores a known-good recovery point.',
    },
    {
      id: 'recovery-validated',
      capstone: { criterion: 'eradication-recovery', mechanic: 'Validate recovery with a clean scan and continued monitoring, in order after the restore', tab: 'recovery', recordedAs: 'recovery { action: scan } then { action: monitor } on ws-204', rubricText: ['Recovery validated by scan and continued monitoring.', 'Recovery validation incomplete.'], actionTypes: ['recovery'] },
      practice: [],
      prove: [V('M09', 'recovery-monitoring')],
      code: [...M12, `${TOOLS}#PACKS.m09`, 'portal/soc-m09-assessment-state.js'],
      exposedIn: [{ module: 'M09', lab: 'guided', tab: 'recovery' }],
      gap: 'No M09 Guided Lab step scans and monitors after recovery.',
    },

    // ------------------------------------------------ reporting-operations-lessons
    {
      id: 'report-technical',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Technical narrative (ticket work notes or Reporting tab) that cites supporting records or their entities', tab: 'reporting', recordedAs: 'report { kind: technical } (Reporting tab, or ticket notes via moduleTwelveSyncTicket)', rubricText: ['Technical narrative identifies cited evidence or its entities.', 'Technical narrative lacks supported citations/entities.'], actionTypes: ['report'], ticketFields: ['notes'] },
      practice: [P('M11', 'reporting', 'Trace the signal and handoff')],
      prove: [V('M11', 'technical-report'), V('M03', 'documentation')],
      code: [...M12, 'portal/case-record.js', 'portal/soc-m11-assessment-rubric.js', 'portal/soc-analyst-module-12.js#moduleTwelveSyncTicket'],
    },
    {
      id: 'report-executive',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Executive summary grounded in incident evidence and free of technical identifiers', tab: 'reporting', recordedAs: 'report { kind: executive } (Reporting tab, or the ticket executiveSummary field)', rubricText: ['Executive summary is grounded in incident evidence.', 'Executive narrative lacks supported citations/entities.'], actionTypes: ['report'], ticketFields: ['executiveSummary'] },
      practice: [P('M11', 'reporting', 'Trace the signal and handoff', 'generic')],
      prove: [V('M11', 'executive-summary')],
      code: [...M12, 'portal/soc-m11-assessment-rubric.js', 'portal/soc-analyst-module-12.js#moduleTwelveSyncTicket'],
    },
    {
      id: 'report-lessons',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Lessons-learned report that references an evidenced control gap', tab: 'reporting', recordedAs: 'report { kind: lessons }', rubricText: ['Lessons reference an evidenced control gap.'], actionTypes: ['report'] },
      practice: [],
      prove: [V('M11', 'lessons-detection')],
      code: [...M12, 'portal/soc-m11-assessment-rubric.js'],
      gap: 'No Guided Lab step asks for lessons learned or a detection improvement; M11 "Trace the signal and handoff" stops at the owner request.',
    },
    {
      id: 'handoff-recorded',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Shift handoff that names affected entities or the outstanding risks', tab: 'operations', recordedAs: 'handoff { text, openRisks } (Operations tab, or M05 / M06 pack handoff)', rubricText: ['Handoff identifies entities or outstanding scenario risks.'], missingCheck: ['No shift handoff recorded yet'], actionTypes: ['handoff'] },
      practice: [P('M03', 'itsm', 'handoff'), P('M11', 'reporting', 'Trace the signal and handoff')],
      prove: [V('M11', 'shift-handoff'), V('M03', 'documentation')],
      code: [...M12, 'portal/soc-m11-assessment-rubric.js', 'portal/soc-analyst-module-03-environment.js#handoff'],
    },
    {
      id: 'closure-decision',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Close only after restore, scan and monitoring; otherwise retain, with a rationale citing the case and recovery status', tab: 'reporting', recordedAs: 'closure { decision, rationale } (Reporting tab, or ticket status + closureNote)', rubricText: ['Closure reasoning cites the case and recovery status.'], actionTypes: ['closure'], ticketFields: ['closureNote'] },
      practice: [P('M11', 'case', 'Set scope and decide', 'generic')],
      prove: [V('M11', 'closure-decision'), V('M11', 'residual-risk'), V('M09', 'recovery-monitoring')],
      code: [...M12, 'portal/soc-m11-assessment-rubric.js', 'portal/soc-analyst-module-12.js#moduleTwelveSyncTicket'],
      notes: 'The close branch depends on the recovery chain (recovery-restored, recovery-validated), which has no Practice home.',
    },
    {
      id: 'written-communication',
      capstone: { criterion: 'reporting-operations-lessons', mechanic: 'Readable written communication in at least one report of 80+ characters', tab: 'reporting', recordedAs: 'any report text', rubricText: ['Readable written communication is present.'], actionTypes: [] },
      practice: [P('M01', 'case', 'Write the handoff and submit')],
      prove: [V('M01', 'analyst_notes'), V('M03', 'documentation')],
      code: [...M12, 'portal/case-record.js'],
    },
  ];

  // Action types that the M12 state accepts but the rubric never scores.
  const UNGRADED_ACTION_TYPES = ['hypothesis'];

  const deepFreeze = (value) => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.values(value).forEach(deepFreeze);
    }
    return value;
  };

  return deepFreeze({
    schemaVersion: 1,
    capstoneModule: 'M12',
    embeddedPacks: ['m04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10'],
    ungradedActionTypes: UNGRADED_ACTION_TYPES,
    entries: ENTRIES,
  });
})();

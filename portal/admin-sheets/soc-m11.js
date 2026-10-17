/* Submission Sheet — Module 11 Prove It, OPS-5511 (SOC day-shift operations:
 * queue, dispositions, assignments, metrics, handoff, four reports, closure).
 * Lab key 'lab-exec-report'.
 *
 * Answer key: SocM11AssessmentData.expectedTruth + .scenario (queue,
 * analysts, incident recovery evidence) in portal/soc-m11-assessment-data.js.
 * Scoring it mirrors: SocM11AssessmentRubric.extract() / SocM11AssessmentScorer
 * (13 criteria in rubric v2; v1 attempts have 12 and no per-alert
 * dispositions). Each section takes its ✓ / ◐ / ✗ from the stored criterion
 * points (result.criteria), so the sheet and the scorer cannot disagree; the
 * fixture supplies the plain-language "what was expected" detail.
 *
 * Saved payload (moduleElevenFinalizeCase): result = the scorer output
 * (rubricVersion, score, criteria[], review, criticalMisses) plus
 * result.action_history = the append-only action log. There is NO case
 * ticket in this Prove It; everything the student did is replayed from the
 * action log with SocM11AssessmentState.normalize(), exactly as the scorer
 * sees it. No payload change was needed.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM11AssessmentData !== 'undefined' ? SocM11AssessmentData : null);
  const scenario = () => (data() && data().scenario) || {};
  const truth = () => (data() && data().expectedTruth) || {};
  const list = (value) => (Array.isArray(value) ? value : []);
  const ids = (items) => list(items).join(', ');

  // ---- replay the action log into the state the scorer saw ----
  const replayCache = new WeakMap();
  function ops(result) {
    if (!Array.isArray(result.action_history) || typeof SocM11AssessmentState === 'undefined' || !data()) return null;
    if (replayCache.has(result)) return replayCache.get(result);
    let state = null;
    try { state = SocM11AssessmentState.normalize({ actionHistory: JSON.parse(JSON.stringify(result.action_history)) }, data()); } catch (error) { state = null; }
    replayCache.set(result, state);
    return state;
  }

  // ---- scorer criteria (stored; re-scored only when an old row lacks them) ----
  function criterionRow(result, id) {
    const rows = Array.isArray(result.criteria) ? result.criteria : Array.isArray(result.breakdown) ? result.breakdown : null;
    const stored = rows && rows.find((entry) => entry && entry.id === id);
    if (stored) return stored;
    // v1 attempts (12 criteria) have no per-alert disposition criterion at all.
    if (id === 'alert-disposition' && Number(result.rubricVersion) === 1) return { id, notApplicable: true };
    if (rows) return null;
    const state = ops(result);
    if (!state || typeof SocM11AssessmentScorer === 'undefined') return null;
    return SocM11AssessmentScorer.score(state, data(), { rubricVersion: Number(result.rubricVersion) === 1 ? 1 : 2 }).criteria.find((entry) => entry.id === id) || null;
  }
  const criterionTest = (result, id) => {
    const row = criterionRow(result, id);
    if (!row || row.notApplicable) return null;
    const points = Number(row.points);
    const max = Number(row.max);
    if (!Number.isFinite(points) || !Number.isFinite(max) || max <= 0) return null;
    return points >= max ? true : points > 0 ? 'partial' : false;
  };
  const criterionGiven = (result, id) => {
    const row = criterionRow(result, id);
    if (!row || row.notApplicable) return null;
    const misses = list(row.misses).filter(Boolean);
    return `${row.points} of ${row.max} points${misses.length ? `. Scorer noted: ${misses.slice(0, 3).join(' ')}` : ''}`;
  };
  const check = (id, config) => ({
    label: config.label,
    expected: config.expected,
    test: (result) => criterionTest(result, id),
    given: (result, ctx) => [criterionGiven(result, id), config.given ? config.given(result, ctx) : ''].filter(Boolean).join('. ') || null,
    fix: config.fix,
    fixPartial: config.fixPartial || config.fix,
  });

  // ---- words for ids ----
  const queueItem = (id) => list(scenario().queue).find((item) => item.id === id) || null;
  const itemLabel = (id) => { const item = queueItem(id); return item ? `${id} · ${item.title}` : String(id); };
  const analystName = (id) => ((list(scenario().analysts).find((a) => a.id === id) || {}).name) || null;
  const routeLabel = (id) => ((list(scenario().escalationRoutes).find((r) => r.id === id) || {}).label) || null;
  const humanize = (id) => String(id || '').replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  // Owner ids with no label in the fixture (scenario.ownerIds in portal/soc-m11-assessment-data.js).
  const OWNER_TEXT = { 'fs02-service-owner': 'FS-02 service owner', 'identity-owners': 'Identity owners', 'detection-engineering': 'Detection engineering' };
  const personOrTeam = (id) => analystName(id) || routeLabel(id) || OWNER_TEXT[id] || humanize(id);
  const dispositionText = (id) => (typeof SocM11AssessmentState !== 'undefined' && SocM11AssessmentState.DISPOSITION_LABELS[id]) || humanize(id);
  const recoveryEvidence = (id) => list(scenario().incident && scenario().incident.recoveryEvidence).find((item) => item.id === id) || null;
  const stamp = (at) => { const d = at ? new Date(at) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().replace('T', ' ').slice(11, 16) + ' UTC' : '—'; };

  const FIELD_TEXT = { summary: 'Summary', confirmedScope: 'Confirmed scope', unknowns: 'What is still unknown', businessImpact: 'Business impact', containmentStatus: 'Containment status', recoveryStatus: 'Recovery status', residualRisk: 'Residual risk' };
  // Student writing of one report as separate labelled entries (full text).
  function reportResponse(result, kind, title) {
    const state = ops(result);
    if (!state) return [{ label: `${title} · student response`, text: null }];
    const report = state.reports && state.reports[kind];
    if (!report) return [{ label: `${title} · student response`, text: '' }];
    const entries = Object.keys(FIELD_TEXT).filter((field) => typeof report[field] === 'string' && report[field].trim()).map((field) => ({ label: `${title} · ${FIELD_TEXT[field]}`, text: report[field] }));
    return entries.length ? entries : [{ label: `${title} · student response`, text: '' }];
  }
  const reportText = (result, kind) => {
    const state = ops(result);
    if (!state) return null;
    const report = state.reports && state.reports[kind];
    return report ? Object.keys(FIELD_TEXT).map((field) => report[field]).filter((v) => typeof v === 'string').join('\n') : '';
  };

  AdminSubmissionSheet.register(['lab-exec-report'], {
    title: 'Module 11 · PROVE IT — SOC Operations Shift',
    fixture: data,
    caseId: () => [scenario().caseId, scenario().incident && scenario().incident.id].filter(Boolean).join(' · ') || 'OPS-5511',
    freeText: (result) => {
      const state = ops(result);
      if (!state) return [];
      const reportTexts = Object.values(state.reports || {}).flatMap((report) => Object.values(report || {}).filter((v) => typeof v === 'string'));
      return [...reportTexts, ...list(state.interpretations),
        ...list(state.handoffs).flatMap((h) => [h.summary, ...list(h.risks), ...list(h.nextActions)]),
        ...list(state.noisyRules).flatMap((n) => [n.rationale, n.improvement]),
        ...list(state.improvementActions).map((a) => a.title),
        state.closure && state.closure.rationale];
    },
    rubric: {},
    sections: [
      {
        id: 'priority',
        title: 'Queue priority',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Order the student put the queue in', null]];
          return [
            ['Order the student put the queue in', state.priorityOrder.length ? state.priorityOrder.map((id, index) => `${index + 1}. ${itemLabel(id)}`) : 'No order recorded'],
            ['What the key expects first', list(truth().queuePriority).map((entry, index) => `${index + 1}. ${itemLabel(entry.itemId)} — ${entry.reason}`)],
          ];
        },
        checks: [check('queue-prioritization', {
          label: () => `Put ${list(truth().queuePriority).map((e) => e.itemId).join(', ')} first, in that order`,
          expected: () => list(truth().queuePriority).map((e) => e.itemId).join(' → '),
          fix: () => `Rank the queue by severity, business impact and how close each alert is to its response deadline. Put ${list(truth().queuePriority).map((e) => e.itemId).join(', ')} first, in that order.`,
          fixPartial: () => `${list(truth().queuePriority)[0].itemId} is correctly first, but the next items are out of order. Rank by deadline pressure and impact: ${list(truth().queuePriority).map((e) => e.itemId).join(', ')}.`,
        })],
      },
      {
        id: 'dispositions',
        title: 'Alert dispositions',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Verdict recorded for each alert', null]];
          if (Number(result.rubricVersion) === 1) return [['Verdict recorded for each alert', null]];
          const expected = truth().dispositions || {};
          const rows = Object.keys(expected).map((id) => {
            const call = state.dispositions && state.dispositions[id];
            const key = dispositionText(expected[id]);
            if (!call) return `${itemLabel(id)} — no verdict recorded (supported call: ${key})`;
            const match = call.disposition === expected[id] ? 'matches the supported call' : `supported call: ${key}`;
            return `${itemLabel(id)} — recorded ${dispositionText(call.disposition)} (${match}). Reason: ${call.reason}`;
          });
          return [['Verdict recorded for each alert the key covers', rows]];
        },
        response: (result) => {
          const state = ops(result);
          if (!state || Number(result.rubricVersion) === 1) return [];
          return Object.keys(state.dispositions || {}).sort().map((id) => ({ label: `Reasoning for ${id} (${dispositionText(state.dispositions[id].disposition)})`, text: state.dispositions[id].reason }));
        },
        checks: [check('alert-disposition', {
          label: () => `Recorded the supported verdict for ${Object.keys(truth().dispositions || {}).join(', ')}, naming what evidence is missing for ${Object.keys(truth().dispositions || {}).filter((id) => truth().dispositions[id] === 'needs_investigation').join(', ')}`,
          expected: () => Object.entries(truth().dispositions || {}).map(([id, call]) => `${id}: ${dispositionText(call)}`).join('; '),
          fix: () => 'Give every alert in the queue a verdict the evidence supports (true, benign or false positive). Where evidence has not arrived yet, say "needs investigation" and name what is missing and when you will re-check.',
        })],
      },
      {
        id: 'assign-escalate',
        title: 'Assignments and escalation',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Work handed out', null], ['Escalations sent', null]];
          const assigns = Object.entries(state.assignments || {}).map(([id, who]) => `${itemLabel(id)} → ${analystName(who) || who}`);
          const escs = list(state.escalations).map((e) => `${itemLabel(e.itemId)} → ${routeLabel(e.route) || humanize(e.route)}. Reason: ${e.reason}`);
          return [
            ['Work handed out', assigns.length ? assigns : 'None'],
            ['Escalations sent', escs.length ? escs : 'None'],
            ['What the key expects', [
              ...Object.entries(truth().acceptableAssignees || {}).map(([id, who]) => `${itemLabel(id)} assigned to ${list(who).map((w) => analystName(w) || w).join(' or ')} (analysts with spare capacity)`),
              ...list(truth().escalations).map((e) => `${itemLabel(e.itemId)} escalated to ${routeLabel(e.route) || e.route}`)]],
          ];
        },
        checks: [
          check('sla-awareness', {
            label: () => `Acted on the alerts about to miss their deadline (${ids(truth().slaAtRisk)}) and listed the breached ones (${ids(truth().slaBreaches)}) in the handoff`,
            expected: () => `At risk: ${ids(truth().slaAtRisk)}. Breached: ${ids(truth().slaBreaches)}`,
            fix: () => `Assign or escalate the alerts close to their response deadline (${ids(truth().slaAtRisk)}), and list the ones already breached (${ids(truth().slaBreaches)}) in the shift handoff.`,
          }),
          check('assignment-escalation', {
            label: () => 'Gave the two unassigned high-priority alerts to analysts with spare capacity and escalated the critical macro alert',
            expected: () => 'Q-02 and Q-03 to a Tier 1 analyst; Q-03 escalated to the incident lead and owners',
            fix: () => 'Assign each high-priority alert to an analyst who has room (check the capacity column), and escalate the critical macro alert to the incident lead and the endpoint and identity owners.',
          }),
        ],
      },
      {
        id: 'metrics',
        title: 'Reading the metrics',
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Metrics interpretation · student response', text: null }];
          const found = list(state.interpretations);
          return found.length ? found.map((text, index) => ({ label: `Metrics interpretation${found.length > 1 ? ` ${index + 1} of ${found.length}` : ''} · student response`, text })) : [{ label: 'Metrics interpretation · student response', text: '' }];
        },
        checks: [check('metrics-interpretation', {
          label: 'Explained what the numbers show (response times, backlog, alert volume) without claiming one thing caused another',
          expected: 'At least 40 characters, mentions the metrics, no cause-and-effect claim',
          fix: 'Describe what the numbers show (response time, backlog, alert volume, deadlines) and what to check next. Avoid saying one thing "caused" another: the metrics alone cannot prove that.',
        })],
      },
      {
        id: 'noisy-rule',
        title: 'Noisy detection rule',
        narrative: true,
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Noisy rule · student response', text: null }];
          const flagged = list(state.noisyRules);
          if (!flagged.length) return [{ label: 'Noisy rule · student response', text: '' }];
          return flagged.flatMap((entry) => {
            const rule = list(scenario().rules).find((r) => r.id === entry.ruleId);
            const name = `${entry.ruleId}${rule ? ` (${rule.name})` : ''}`;
            return [{ label: `Why ${name} is noisy`, text: entry.rationale }, { label: `Proposed improvement for ${name}`, text: entry.improvement }];
          });
        },
        checks: [check('rule-noise', {
          label: () => `Flagged ${truth().noisyRuleId} (${((list(scenario().rules).find((r) => r.id === truth().noisyRuleId)) || {}).name || 'the noisy rule'}) with a concrete improvement (20 characters or more)`,
          expected: () => truth().noisyRuleId,
          fix: () => `Flag ${truth().noisyRuleId}: it raised several alerts that were all closed as false or benign. Say why it is noisy and how to tune it without hiding real attacks.`,
        })],
      },
      {
        id: 'handoff',
        title: 'Shift handoff',
        narrative: true,
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Open items handed over', null]];
          const handoff = list(state.handoffs).slice(-1)[0];
          if (!handoff) return [['Open items handed over', 'No handoff recorded']];
          return [['Open items handed over', handoff.openItems.map(itemLabel)], ['Risks flagged', handoff.risks.length ? handoff.risks : 'None'], ['Next actions', handoff.nextActions]];
        },
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Handoff summary · student response', text: null }];
          const handoff = list(state.handoffs).slice(-1)[0];
          return [{ label: `Handoff summary${scenario().shift ? ` to ${scenario().shift.handoffTo}` : ''} · student response`, text: handoff ? handoff.summary : '' }];
        },
        checks: [check('shift-handoff', {
          label: () => `Handoff lists the ransomware incident (${scenario().incident && scenario().incident.queueItemId}) and the at-risk alerts (${ids(truth().slaAtRisk)}), with a next action and a risk`,
          expected: () => `Open items include ${scenario().incident && scenario().incident.queueItemId}, ${ids(truth().slaAtRisk)}; at least one risk and one next action`,
          fix: () => `The next shift needs a handoff that lists the open ransomware incident and the at-risk alerts (${ids(truth().slaAtRisk)}), what to do next, and the main risk.`,
        })],
      },
      {
        id: 'technical-report',
        title: 'Technical report',
        response: (result) => reportResponse(result, 'technical', 'Technical report'),
        checks: [check('technical-report', {
          label: () => `Technical report is at least 80 characters, names ${((scenario().incident || {}).entities || [])[0]} and one of ${((scenario().incident || {}).entities || []).slice(1).join(' / ')}, and records scope and unknowns`,
          expected: () => ((scenario().incident || {}).entities || []).join(', '),
          fix: () => `Write the technical report for responders: what happened on ${((scenario().incident || {}).entities || [])[0]}, what is confirmed, and what is still unknown. Name the affected account or file share.`,
        })],
        evidence: {
          label: 'Key evidence named in the technical report',
          text: (result) => reportText(result, 'technical'),
          pieces: () => {
            const incident = scenario().incident || {};
            const entities = list(incident.entities);
            return [
              ...entities.map((id) => ({ name: `the affected system or account (${id})`, short: id, terms: [id] })),
              { name: 'the containment taken (isolated, session revoked)', short: 'the containment', terms: ['isolat', 'revok', 'contain'] },
              { name: 'the recovery step (restored from a clean recovery point)', short: 'the recovery step', terms: ['restor', 'recovery point', 'rebuil', 'clean scan'] },
            ];
          },
          fix: (missing) => `Back the report with the facts: it does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'executive-summary',
        title: 'Executive summary',
        response: (result) => reportResponse(result, 'executive', 'Executive summary'),
        checks: [check('executive-summary', {
          label: 'Plain-language summary for leadership (900 characters or fewer), with the business impact and no raw technical indicators (IP addresses, hashes, PowerShell, ATT&CK ids)',
          expected: 'Short, plain, business impact stated',
          fix: 'Rewrite the summary for leadership in plain words: what happened, the business impact and the decision needed. Remove IP addresses, hashes and tool names, and keep it under 900 characters.',
        })],
      },
      {
        id: 'escalation-notice',
        title: 'Escalation notice',
        required: false,
        response: (result) => reportResponse(result, 'escalation', 'Escalation notice'),
        // The scorer does not score the escalation notice (the escalation itself is scored under Assignments and escalation).
      },
      {
        id: 'closure-report',
        title: 'Closure report and residual risk',
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Closure report · student response', text: null }];
          // The scorer reads the closure report, or the technical report when no closure report was written.
          const kind = state.reports && state.reports.closure ? 'closure' : 'technical';
          return reportResponse(result, kind, kind === 'closure' ? 'Closure report' : 'Technical report (no separate closure report was written)');
        },
        checks: [check('residual-risk', {
          label: () => `States that ${list(truth().residualRisks).map((r) => r.keywords[0]).join(' and ')} are still open, and does not say the incident is fully recovered`,
          expected: () => list(truth().residualRisks).map((r) => `${r.keywords[0]} (${r.evidenceId}: ${(recoveryEvidence(r.evidenceId) || {}).summary || ''})`).join('; '),
          fix: () => `Say what is still open: ${list(truth().residualRisks).map((r) => (recoveryEvidence(r.evidenceId) || {}).summary || r.keywords[0]).join(' ')} Do not write that the incident is fully recovered.`,
        })],
        evidence: {
          label: 'Open recovery items named in the closure report',
          text: (result) => {
            const state = ops(result);
            if (!state) return null;
            const report = (state.reports && (state.reports.closure || state.reports.technical)) || null;
            return report ? [report.residualRisk, report.recoveryStatus, report.containmentStatus].filter((v) => typeof v === 'string').join('\n') : '';
          },
          pieces: () => list(truth().residualRisks).map((risk) => ({
            name: `the open item "${(recoveryEvidence(risk.evidenceId) || {}).summary || risk.keywords[0]}"`, short: risk.keywords[0], terms: risk.keywords,
          })),
          fix: (missing) => `The closure report must say what is still open: it does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'follow-ups',
        title: 'Follow-up actions and lessons',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Follow-up actions', null]];
          const KIND = { follow_up: 'Follow-up', lesson: 'Lesson learned', detection: 'Detection improvement' };
          const rows = list(state.improvementActions).map((a) => `${KIND[a.kind] || a.kind}: ${a.title} — owner ${personOrTeam(a.ownerId)}, due ${a.dueDate}${a.evidenceId ? `, for ${a.evidenceId}` : ''}`);
          return [['Follow-up actions', rows.length ? rows : 'None recorded'],
            ['What the key expects', list(truth().residualRisks).map((r) => `Follow-up for ${r.evidenceId} owned by ${personOrTeam(r.ownerId)}, due by ${truth().dueBy}`)]];
        },
        checks: [
          check('ownership-due-dates', {
            label: () => `Each open recovery item has an owner and a due date no later than ${truth().dueBy}`,
            expected: () => list(truth().residualRisks).map((r) => `${r.evidenceId} → ${personOrTeam(r.ownerId)}`).join('; '),
            fix: () => `Create one follow-up per open recovery item, owned by the team that can close it (${list(truth().residualRisks).map((r) => personOrTeam(r.ownerId)).join(' and ')}), each due by ${truth().dueBy}.`,
          }),
          check('lessons-detection', {
            label: () => `A lesson-learned action and a detection-improvement action, each with a due date by ${truth().dueBy}`,
            expected: 'One lesson and one detection improvement',
            fix: 'Add one lesson-learned action and one detection-improvement action, each with an owner and a due date. Tie them to what this shift showed.',
          }),
        ],
      },
      {
        id: 'closure',
        title: 'Closure decision',
        narrative: true,
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Decision', null]];
          const closure = state.closure;
          if (!closure) return [['Decision', 'No decision recorded']];
          return [['Decision', closure.decision === 'close' ? 'Close the incident' : 'Keep the incident open'],
            ['Evidence cited', closure.evidenceIds.length ? closure.evidenceIds.map((id) => `${id} · ${(recoveryEvidence(id) || {}).summary || ''}`) : 'None']];
        },
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Closure rationale · student response', text: null }];
          return [{ label: 'Closure rationale · student response', text: state.closure ? state.closure.rationale : '' }];
        },
        checks: [check('closure-decision', {
          label: () => `Kept the incident open (${truth().closureDecision}), citing the still-pending recovery evidence (${list(truth().residualRisks).map((r) => r.evidenceId).join(', ')}), with a reason of 30 characters or more`,
          expected: () => 'Keep open (retain)',
          fix: () => 'Keep the incident open: the file-share check and the credential-reset confirmation are still pending. Cite those records in your reason.',
        })],
      },
      {
        id: 'action-log',
        title: 'Action log',
        required: false,
        collapsed: true,
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Recorded actions', null]];
          const TYPE = { assign: 'Assigned work', escalate: 'Escalated', priority: 'Set queue priority', metric_interpretation: 'Interpreted metrics', noisy_rule: 'Flagged noisy rule', handoff: 'Wrote handoff', report: 'Wrote a report', improvement_action: 'Added follow-up action', closure_decision: 'Recorded closure decision', disposition: 'Recorded alert verdict' };
          return [['Recorded actions', list(state.actionHistory).map((a) => `${stamp(a.timestamp)} · ${TYPE[a.type] || humanize(a.type)}${a.details && a.details.itemId ? ` ${a.details.itemId}` : ''}${a.details && a.details.kind ? ` (${a.details.kind})` : ''}`)]];
        },
      },
    ],
  });
})();

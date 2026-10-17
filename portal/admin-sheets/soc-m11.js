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
 *
 * Labels (owner, 2026-10-17): values read as the student saw them in the
 * Shift Operations / Reporting and Closure forms (moduleElevenOpsHtml /
 * moduleElevenReportingHtml in portal/soc-analyst-module-11.js): report
 * headings "Technical report" … "Closure report", field labels such as
 * "Unknowns", the Kind options, owner ids as the Owner select lists them,
 * and the closure Decision options "Retain open" / "Close". Prefilled notes
 * quote what the student recorded.
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
  // The follow-up Owner select lists analysts by name and the owner teams by their id
  // (scenario.ownerIds), so an owner reads exactly as the student picked it.
  const personOrTeam = (id) => analystName(id) || String(id || '—');
  const dispositionText = (id) => (typeof SocM11AssessmentState !== 'undefined' && SocM11AssessmentState.DISPOSITION_LABELS[id]) || humanize(id);
  const recoveryEvidence = (id) => list(scenario().incident && scenario().incident.recoveryEvidence).find((item) => item.id === id) || null;
  const stamp = (at) => { const d = at ? new Date(at) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().replace('T', ' ').slice(11, 16) + ' UTC' : '—'; };

  // Report field labels, report headings, Kind and Decision options exactly as the forms show them.
  const FIELD_TEXT = { summary: 'Summary', confirmedScope: 'Confirmed scope', unknowns: 'Unknowns', businessImpact: 'Business impact', containmentStatus: 'Containment status', recoveryStatus: 'Recovery status', residualRisk: 'Residual risk' };
  const REPORT_TITLE = { technical: 'Technical report', executive: 'Executive report', escalation: 'Escalation report', closure: 'Closure report' };
  const KIND_TEXT = { follow_up: 'Follow up', lesson: 'Lesson learned', detection: 'Detection improvement' };
  const DECISION_TEXT = { retain: 'Retain open', close: 'Close' };
  const decisionText = (id) => DECISION_TEXT[id] || humanize(id);
  const quote = (text, max = 90) => { const t = String(text || '').trim().replace(/\s+/g, ' '); return `"${t.length > max ? `${t.slice(0, max - 1)}…` : t}"`; };
  const cap = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);
  const ruleName = (id) => { const rule = list(scenario().rules).find((r) => r.id === id); return rule ? `${id} · ${rule.name}` : String(id); };
  // SocM11AssessmentRubric's CAUSAL / OVERCLAIM / TECHNICAL patterns (not exported), used only to quote the words concerned.
  const CAUSAL = /\b(caused|causes|because of|due to|resulted in|led to|drove|driven by)\b/i;
  const OVERCLAIM = /\b(fully recovered|no (?:residual|remaining) risk|no risk remains|risk[- ]free|incident (?:is )?(?:closed|resolved)|completely (?:recovered|remediated))\b/i;
  const TECHNICAL = /\b[a-f0-9]{32,}\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|\bsha-?256\b|\bpowershell\b|\bT1\d{3}\b|\bkql\b|\bregistry\b/i;
  const dueOk = (entry) => entry.dueDate >= String(scenario().start || '').slice(0, 10) && entry.dueDate <= truth().dueBy;
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
          if (!state) return [['Priority order (highest first)', null]];
          return [
            ['Priority order (highest first)', state.priorityOrder.length ? state.priorityOrder.map((id, index) => `${index + 1}. ${itemLabel(id)}`) : 'No order saved'],
            ['What the key expects first', list(truth().queuePriority).map((entry, index) => `${index + 1}. ${itemLabel(entry.itemId)} — ${entry.reason}`)],
          ];
        },
        checks: [check('queue-prioritization', {
          label: () => `Put ${list(truth().queuePriority).map((e) => e.itemId).join(', ')} first, in that order`,
          expected: () => list(truth().queuePriority).map((e) => e.itemId).join(' → '),
          fix: (result) => {
            const key = list(truth().queuePriority).map((e) => e.itemId);
            const order = list((ops(result) || {}).priorityOrder);
            const noisy = list(scenario().queue).filter((item) => item.ruleId === truth().noisyRuleId).map((item) => item.id);
            return `${order.length ? `Your order starts ${order.slice(0, key.length).join(', ')}${noisy.includes(order[0]) ? `, and ${order[0]} is a low-value ${truth().noisyRuleId} alert` : ''}. ` : ''}Rank the queue by severity, business impact and how close each alert is to its response deadline: ${key.join(', ')} first, in that order.`;
          },
          fixPartial: (result) => {
            const key = list(truth().queuePriority).map((e) => e.itemId);
            const order = list((ops(result) || {}).priorityOrder);
            return `${key[0]} is correctly first, but your next items are ${order.slice(1, key.length).join(', ') || 'missing'}. Rank by deadline pressure and impact: ${key.join(', ')}.`;
          },
        })],
      },
      {
        id: 'dispositions',
        title: 'Alert dispositions',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Disposition recorded for each alert', null]];
          if (Number(result.rubricVersion) === 1) return [['Disposition recorded for each alert', null]];
          const expected = truth().dispositions || {};
          const rows = Object.keys(expected).map((id) => {
            const call = state.dispositions && state.dispositions[id];
            const key = dispositionText(expected[id]);
            if (!call) return `${itemLabel(id)} — no disposition recorded (supported call: ${key})`;
            const match = call.disposition === expected[id] ? 'matches the supported call' : `supported call: ${key}`;
            return `${itemLabel(id)} — ${dispositionText(call.disposition)} (${match})`;
          });
          return [['Disposition recorded for each alert the key covers', rows]];
        },
        response: (result) => {
          const state = ops(result);
          if (!state || Number(result.rubricVersion) === 1) return [];
          return Object.keys(state.dispositions || {}).sort().map((id) => ({ label: `Evidence and reasoning · ${id} (${dispositionText(state.dispositions[id].disposition)})`, text: state.dispositions[id].reason }));
        },
        checks: [check('alert-disposition', {
          label: () => `Recorded the supported disposition for ${Object.keys(truth().dispositions || {}).join(', ')}, naming what evidence is missing for ${Object.keys(truth().dispositions || {}).filter((id) => truth().dispositions[id] === 'needs_investigation').join(', ')}`,
          expected: () => Object.entries(truth().dispositions || {}).map(([id, call]) => `${id}: ${dispositionText(call)}`).join('; '),
          fix: (result) => {
            const generic = `Give every alert in the queue a disposition the evidence supports (True positive, Benign positive or False positive). Where evidence has not arrived yet, choose ${dispositionText('needs_investigation')} and name what is missing and when you will re-check.`;
            const state = ops(result);
            if (!state) return generic;
            const expected = truth().dispositions || {};
            const terms = list(truth().missingDataTerms);
            const lines = Object.keys(expected).map((id) => {
              const call = state.dispositions && state.dispositions[id];
              const want = dispositionText(expected[id]);
              if (!call) return `record a disposition for ${id} (${want})`;
              if (call.disposition === expected[id]) {
                return expected[id] === 'needs_investigation' && terms.length && !terms.some((term) => String(call.reason || '').toLowerCase().includes(term))
                  ? `your ${id} reasoning (${quote(call.reason, 60)}) should name what evidence is missing and when you will re-check` : '';
              }
              if (call.disposition === 'needs_investigation') return `${id} can be decided from the evidence: it is ${want}`;
              return `${id} is ${want}, not ${dispositionText(call.disposition)}`;
            }).filter(Boolean);
            return lines.length ? `${cap(lines.slice(0, 4).join('; '))}${lines.length > 4 ? `; and ${lines.length - 4} more` : ''}.` : generic;
          },
        })],
      },
      {
        id: 'assign-escalate',
        title: 'Assignments and escalation',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Assigned', null], ['Escalated', null]];
          const assigns = Object.entries(state.assignments || {}).map(([id, who]) => `${itemLabel(id)} → ${analystName(who) || who}`);
          const escs = list(state.escalations).map((e) => `${itemLabel(e.itemId)} → ${routeLabel(e.route) || e.route}. Reason: ${e.reason}`);
          return [
            ['Assigned', assigns.length ? assigns : 'None'],
            ['Escalated', escs.length ? escs : 'None'],
            ['What the key expects', [
              ...Object.entries(truth().acceptableAssignees || {}).map(([id, who]) => `${itemLabel(id)} assigned to ${list(who).map((w) => analystName(w) || w).join(' or ')} (analysts with spare capacity)`),
              ...list(truth().escalations).map((e) => `${itemLabel(e.itemId)} escalated to ${routeLabel(e.route) || e.route}`)]],
          ];
        },
        checks: [
          check('sla-awareness', {
            label: () => `Acted on the alerts about to miss their deadline (${ids(truth().slaAtRisk)}) and listed the breached ones (${ids(truth().slaBreaches)}) in the handoff`,
            expected: () => `At risk: ${ids(truth().slaAtRisk)}. Breached: ${ids(truth().slaBreaches)}`,
            fix: (result) => {
              const state = ops(result);
              const generic = `Assign or escalate the alerts close to their response deadline (${ids(truth().slaAtRisk)}), and list the ones already breached (${ids(truth().slaBreaches)}) in the shift handoff.`;
              if (!state) return generic;
              const acted = (id) => Boolean((state.assignments || {})[id]) || list(state.escalations).some((e) => e.itemId === id);
              const handoff = list(state.handoffs).slice(-1)[0];
              const notActed = list(truth().slaAtRisk).filter((id) => !acted(id));
              const notListed = list(truth().slaBreaches).filter((id) => !list(handoff && handoff.openItems).includes(id));
              const steps = [
                notActed.length ? `assign or escalate ${ids(notActed)}: ${notActed.length === 1 ? 'it is' : 'they are'} close to the response deadline and you did not act on ${notActed.length === 1 ? 'it' : 'them'}` : '',
                notListed.length ? `list ${ids(notListed)} in the handoff's Open items: ${notListed.length === 1 ? 'it has' : 'they have'} already breached the deadline${handoff ? ` (you listed ${ids(handoff.openItems) || 'none'})` : ' (you saved no handoff)'}` : '',
              ].filter(Boolean);
              return steps.length ? `${cap(steps.join('; '))}.` : generic;
            },
          }),
          check('assignment-escalation', {
            label: () => 'Gave the two unassigned high-priority alerts to analysts with spare capacity and escalated the critical macro alert',
            expected: () => 'Q-02 and Q-03 to a Tier 1 analyst; Q-03 escalated to the incident lead and owners',
            fix: (result) => {
              const state = ops(result);
              const generic = 'Assign each high-priority alert to an analyst who has room (check the capacity column), and escalate the critical macro alert to the incident lead and the endpoint and identity owners.';
              if (!state) return generic;
              const assignments = state.assignments || {};
              const steps = Object.entries(truth().acceptableAssignees || {}).map(([id, allowed]) => {
                const who = assignments[id];
                const names = list(allowed).map((w) => analystName(w) || w).join(' or ');
                if (!who) return `assign ${id} to ${names}, who have spare capacity`;
                return list(allowed).includes(who) ? '' : `${id} went to ${analystName(who) || who}, who has no spare capacity; assign it to ${names}`;
              });
              list(truth().escalations).forEach((e) => {
                const mine = list(state.escalations).filter((x) => x.itemId === e.itemId);
                if (mine.some((x) => x.route === e.route)) return;
                steps.push(mine.length ? `escalate ${e.itemId} to ${routeLabel(e.route)}, not ${mine.map((x) => routeLabel(x.route) || x.route).join(' or ')}` : `escalate ${e.itemId} to ${routeLabel(e.route)}`);
              });
              const done = steps.filter(Boolean);
              return done.length ? `${cap(done.join('; '))}.` : generic;
            },
          }),
        ],
      },
      {
        id: 'metrics',
        title: 'Reading the metrics',
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Metric interpretation · student response', text: null }];
          const found = list(state.interpretations);
          return found.length ? found.map((text, index) => ({ label: `Metric interpretation${found.length > 1 ? ` ${index + 1} of ${found.length}` : ''}`, text })) : [{ label: 'Metric interpretation · student response', text: '' }];
        },
        checks: [check('metrics-interpretation', {
          label: 'Explained what the numbers show (response times, backlog, alert volume) without claiming one thing caused another',
          expected: 'At least 40 characters, mentions the metrics, no cause-and-effect claim',
          fix: (result) => {
            const generic = 'Describe what the numbers show (response time, backlog, alert volume, deadlines) and what to check next. Avoid saying one thing "caused" another: the metrics alone cannot prove that.';
            const latest = list((ops(result) || {}).interpretations).slice(-1)[0];
            if (!latest) return generic;
            const causal = CAUSAL.exec(latest);
            if (causal) return `Your interpretation says "${causal[0]}" (${quote(latest, 80)}). The metrics alone cannot prove what caused what: describe what the numbers show and what to check next.`;
            return `Your interpretation (${quote(latest, 80)}) needs to name the measures you read, such as backlog, mean time to acknowledge, alert volume or the SLA, and what to check next.`;
          },
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
          return flagged.flatMap((entry) => [{ label: `Rationale · ${ruleName(entry.ruleId)}`, text: entry.rationale }, { label: `Improvement · ${ruleName(entry.ruleId)}`, text: entry.improvement }]);
        },
        checks: [check('rule-noise', {
          label: () => `Flagged ${ruleName(truth().noisyRuleId)} with a concrete improvement (20 characters or more)`,
          expected: () => truth().noisyRuleId,
          fix: (result) => {
            const id = truth().noisyRuleId;
            const why = 'it raised several alerts that were all closed as false or benign positive';
            const flagged = list((ops(result) || {}).noisyRules);
            const right = flagged.filter((entry) => entry.ruleId === id);
            if (right.length) return `Your improvement for ${id} (${quote(right.slice(-1)[0].improvement, 60)}) is too short to act on. Say exactly how to tune it without hiding real attacks.`;
            return `${flagged.length ? `You flagged ${flagged.map((entry) => entry.ruleId).join(', ')}, but the noisy rule is ${ruleName(id)}: ${why}.` : `Flag ${ruleName(id)}: ${why}.`} Say why it is noisy and how to tune it without hiding real attacks.`;
          },
        })],
      },
      {
        id: 'handoff',
        title: 'Shift handoff',
        narrative: true,
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Open items', null]];
          const handoff = list(state.handoffs).slice(-1)[0];
          if (!handoff) return [['Open items', 'No handoff saved']];
          return [['Open items', handoff.openItems.map(itemLabel)], ['Risks', handoff.risks.length ? handoff.risks : 'None'], ['Next actions', handoff.nextActions.length ? handoff.nextActions : 'None']];
        },
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Summary · student response', text: null }];
          const handoff = list(state.handoffs).slice(-1)[0];
          return [{ label: `Summary${scenario().shift ? ` (handoff to ${scenario().shift.handoffTo})` : ''}`, text: handoff ? handoff.summary : '' }];
        },
        checks: [check('shift-handoff', {
          label: () => `Handoff lists the ransomware incident (${scenario().incident && scenario().incident.queueItemId}) and the at-risk alerts (${ids(truth().slaAtRisk)}), with a next action and a risk`,
          expected: () => `Open items include ${scenario().incident && scenario().incident.queueItemId}, ${ids(truth().slaAtRisk)}; at least one risk and one next action`,
          fix: (result) => {
            const incidentItem = scenario().incident && scenario().incident.queueItemId;
            const generic = `The next shift needs a handoff that lists the open ransomware incident (${incidentItem}) and the at-risk alerts (${ids(truth().slaAtRisk)}), what to do next, and the main risk.`;
            const handoff = list((ops(result) || {}).handoffs).slice(-1)[0];
            if (!handoff) return generic;
            const missing = [incidentItem, ...list(truth().slaAtRisk)].filter((id) => id && !list(handoff.openItems).includes(id));
            const steps = [
              missing.length ? `add ${ids(missing)} to Open items (you listed ${ids(handoff.openItems) || 'none'})` : '',
              list(handoff.risks).length ? '' : 'name at least one risk',
              list(handoff.nextActions).length ? '' : 'name at least one next action',
              String(handoff.summary || '').length >= 40 ? '' : `write a fuller Summary (yours is ${String(handoff.summary || '').length} characters; at least 40)`,
            ].filter(Boolean);
            return steps.length ? `${cap(steps.join('; '))}.` : generic;
          },
        })],
      },
      {
        id: 'technical-report',
        title: REPORT_TITLE.technical,
        response: (result) => reportResponse(result, 'technical', REPORT_TITLE.technical),
        checks: [check('technical-report', {
          label: () => `${REPORT_TITLE.technical} Summary is at least 80 characters, names ${((scenario().incident || {}).entities || [])[0]} and one of ${((scenario().incident || {}).entities || []).slice(1).join(' / ')}, and fills in Confirmed scope and Unknowns`,
          expected: () => ((scenario().incident || {}).entities || []).join(', '),
          fix: (result) => {
            const entities = list((scenario().incident || {}).entities);
            const generic = `Write the ${REPORT_TITLE.technical} for responders: what happened on ${entities[0]}, what is confirmed, and what is still unknown. Name the affected account or file share.`;
            const state = ops(result);
            const report = state && state.reports && state.reports.technical;
            if (!report) return generic;
            const text = [report.summary, report.confirmedScope, report.unknowns].filter((v) => typeof v === 'string').join(' ').toLowerCase();
            const steps = [
              String(report.summary || '').length >= 80 ? '' : `expand the Summary (yours is ${String(report.summary || '').length} characters; at least 80)`,
              text.includes(String(entities[0]).toLowerCase()) ? '' : `name ${entities[0]}`,
              entities.slice(1).some((id) => text.includes(String(id).toLowerCase())) ? '' : `name ${entities.slice(1).join(' or ')}`,
              report.confirmedScope ? '' : 'fill in Confirmed scope',
              report.unknowns ? '' : 'fill in Unknowns',
            ].filter(Boolean);
            return steps.length ? `In your ${REPORT_TITLE.technical}: ${steps.join('; ')}.` : generic;
          },
        })],
        evidence: {
          label: () => `Key evidence named in the ${REPORT_TITLE.technical}`,
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
          fix: (missing) => `Back the ${REPORT_TITLE.technical} with the facts: it does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'executive-summary',
        title: REPORT_TITLE.executive,
        response: (result) => reportResponse(result, 'executive', REPORT_TITLE.executive),
        checks: [check('executive-summary', {
          label: () => `${REPORT_TITLE.executive} in plain language for leadership (Summary 900 characters or fewer), with the Business impact and no raw technical indicators (IP addresses, hashes, PowerShell, ATT&CK ids)`,
          expected: 'Short, plain, business impact stated',
          fix: (result) => {
            const generic = `Rewrite the ${REPORT_TITLE.executive} for leadership in plain words: what happened, the business impact and the decision needed. Remove IP addresses, hashes and tool names, and keep it under 900 characters.`;
            const state = ops(result);
            const report = state && state.reports && state.reports.executive;
            if (!report) return generic;
            const technical = TECHNICAL.exec([report.summary, report.businessImpact].join(' '));
            const steps = [
              technical ? `remove "${technical[0]}": leadership needs plain words, not raw technical details` : '',
              report.businessImpact ? '' : 'fill in Business impact',
              String(report.summary || '').length <= 900 ? '' : `shorten the Summary (yours is ${String(report.summary || '').length} characters; 900 at most)`,
            ].filter(Boolean);
            return steps.length ? `In your ${REPORT_TITLE.executive}: ${steps.join('; ')}.` : generic;
          },
        })],
      },
      {
        id: 'escalation-notice',
        title: REPORT_TITLE.escalation,
        required: false,
        response: (result) => reportResponse(result, 'escalation', REPORT_TITLE.escalation),
        // The scorer does not score the escalation report (the escalation itself is scored under Assignments and escalation).
      },
      {
        id: 'closure-report',
        title: 'Closure report and residual risk',
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: `${REPORT_TITLE.closure} · student response`, text: null }];
          // The scorer reads the closure report, or the technical report when no closure report was written.
          const kind = state.reports && state.reports.closure ? 'closure' : 'technical';
          return reportResponse(result, kind, kind === 'closure' ? REPORT_TITLE.closure : `${REPORT_TITLE.technical} (no ${REPORT_TITLE.closure} was saved)`);
        },
        checks: [check('residual-risk', {
          label: () => `States that ${list(truth().residualRisks).map((r) => r.keywords[0]).join(' and ')} are still open, and does not say the incident is fully recovered`,
          expected: () => list(truth().residualRisks).map((r) => `${r.keywords[0]} (${r.evidenceId}: ${(recoveryEvidence(r.evidenceId) || {}).summary || ''})`).join('; '),
          fix: (result) => {
            const open = list(truth().residualRisks).map((r) => (recoveryEvidence(r.evidenceId) || {}).summary || r.keywords[0]);
            const generic = `Say what is still open: ${open.join(' ')} Do not write that the incident is fully recovered.`;
            const state = ops(result);
            const report = state && state.reports && (state.reports.closure || state.reports.technical);
            if (!report) return generic;
            const where = state.reports.closure ? REPORT_TITLE.closure : REPORT_TITLE.technical;
            const text = [report.residualRisk, report.recoveryStatus, report.containmentStatus].filter((v) => typeof v === 'string').join(' ');
            const over = OVERCLAIM.exec(text);
            const missing = list(truth().residualRisks).filter((r) => !r.keywords.some((k) => text.toLowerCase().includes(k)));
            const steps = [
              over ? `remove "${over[0]}": recovery is not finished` : '',
              missing.length ? `say in Residual risk that these are still open: ${missing.map((r) => (recoveryEvidence(r.evidenceId) || {}).summary || r.keywords[0]).join(' ')}` : '',
              report.containmentStatus ? '' : 'fill in Containment status',
            ].filter(Boolean);
            return steps.length ? `In your ${where}: ${steps.join('; ')}` : generic;
          },
        })],
        evidence: {
          label: () => `Open recovery items named in the ${REPORT_TITLE.closure}`,
          text: (result) => {
            const state = ops(result);
            if (!state) return null;
            const report = (state.reports && (state.reports.closure || state.reports.technical)) || null;
            return report ? [report.residualRisk, report.recoveryStatus, report.containmentStatus].filter((v) => typeof v === 'string').join('\n') : '';
          },
          pieces: () => list(truth().residualRisks).map((risk) => ({
            name: `the open item "${(recoveryEvidence(risk.evidenceId) || {}).summary || risk.keywords[0]}"`, short: risk.keywords[0], terms: risk.keywords,
          })),
          fix: (missing) => `The ${REPORT_TITLE.closure} must say what is still open: it does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'follow-ups',
        title: 'Follow-up actions and lessons',
        answer: (result) => {
          const state = ops(result);
          if (!state) return [['Actions added', null]];
          const rows = list(state.improvementActions).map((a) => `${KIND_TEXT[a.kind] || a.kind}: ${a.title} — Owner ${personOrTeam(a.ownerId)}, Due date ${a.dueDate}, Evidence ${a.evidenceId || 'None'}`);
          return [['Actions added', rows.length ? rows : 'None recorded'],
            ['What the key expects', list(truth().residualRisks).map((r) => `${KIND_TEXT.follow_up} for ${r.evidenceId} owned by ${personOrTeam(r.ownerId)}, due by ${truth().dueBy}`)]];
        },
        checks: [
          check('ownership-due-dates', {
            label: () => `Each open recovery item has a ${KIND_TEXT.follow_up} action with the right owner and a due date no later than ${truth().dueBy}`,
            expected: () => list(truth().residualRisks).map((r) => `${r.evidenceId} → ${personOrTeam(r.ownerId)}`).join('; '),
            fix: (result) => {
              const generic = `Add one ${KIND_TEXT.follow_up} action per open recovery item, owned by the team that can close it (${list(truth().residualRisks).map((r) => `${personOrTeam(r.ownerId)} for ${r.evidenceId}`).join(', ')}), each due by ${truth().dueBy}.`;
              const state = ops(result);
              if (!state) return generic;
              const actions = list(state.improvementActions).filter((a) => a.kind === 'follow_up');
              const steps = list(truth().residualRisks).map((r) => {
                const mine = actions.filter((a) => a.evidenceId === r.evidenceId);
                if (!mine.length) return `add a ${KIND_TEXT.follow_up} for ${r.evidenceId} owned by ${personOrTeam(r.ownerId)}, due by ${truth().dueBy}`;
                if (mine.some((a) => a.ownerId === r.ownerId && dueOk(a))) return '';
                const a = mine[0];
                return a.ownerId !== r.ownerId ? `give the ${r.evidenceId} follow-up to ${personOrTeam(r.ownerId)}, not ${personOrTeam(a.ownerId)}` : `set the ${r.evidenceId} follow-up due by ${truth().dueBy} (you set ${a.dueDate})`;
              }).filter(Boolean);
              return steps.length ? `${cap(steps.join('; '))}.` : generic;
            },
          }),
          check('lessons-detection', {
            label: () => `A ${KIND_TEXT.lesson} action and a ${KIND_TEXT.detection} action, each with a due date by ${truth().dueBy}`,
            expected: () => `One ${KIND_TEXT.lesson} and one ${KIND_TEXT.detection}`,
            fix: (result) => {
              const state = ops(result);
              const actions = list(state && state.improvementActions);
              const missing = ['lesson', 'detection'].filter((kind) => !actions.some((a) => a.kind === kind && dueOk(a)));
              return `Add ${(missing.length ? missing : ['lesson', 'detection']).map((kind) => `a ${KIND_TEXT[kind]} action`).join(' and ')}, with an owner and a due date by ${truth().dueBy}. Tie ${missing.length === 1 ? 'it' : 'them'} to what this shift showed${actions.length ? ` (you added ${actions.map((a) => KIND_TEXT[a.kind] || a.kind).join(', ')})` : ''}.`;
            },
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
          return [['Decision', decisionText(closure.decision)],
            ['Recovery evidence', closure.evidenceIds.length ? closure.evidenceIds.map((id) => `${id} · ${(recoveryEvidence(id) || {}).summary || ''}`) : 'None']];
        },
        response: (result) => {
          const state = ops(result);
          if (!state) return [{ label: 'Rationale · student response', text: null }];
          return [{ label: 'Rationale', text: state.closure ? state.closure.rationale : '' }];
        },
        checks: [check('closure-decision', {
          label: () => `Decision set to ${decisionText(truth().closureDecision)}, citing the still-pending recovery evidence (${list(truth().residualRisks).map((r) => r.evidenceId).join(', ')}), with a rationale of 30 characters or more`,
          expected: () => decisionText(truth().closureDecision),
          fix: (result) => {
            const pending = list(truth().residualRisks).map((r) => r.evidenceId);
            const why = 'the file-share check and the credential-reset confirmation are still pending';
            const closure = (ops(result) || {}).closure;
            if (!closure) return `Record a closure decision of ${decisionText(truth().closureDecision)}: ${why}. Cite ${ids(pending)} in Recovery evidence.`;
            if (closure.decision !== truth().closureDecision) return `Set Decision to ${decisionText(truth().closureDecision)} (you chose ${decisionText(closure.decision)}): ${why}. Cite ${ids(pending)} in Recovery evidence.`;
            const steps = [
              list(closure.evidenceIds).some((id) => pending.includes(id)) ? '' : `cite the pending records ${ids(pending)} in Recovery evidence (you cited ${ids(closure.evidenceIds) || 'none'})`,
              String(closure.rationale || '').length >= 30 ? '' : `give a fuller Rationale (yours is ${String(closure.rationale || '').length} characters; at least 30)`,
            ].filter(Boolean);
            return `${decisionText(closure.decision)} is right, but ${steps.join(' and ') || `cite ${ids(pending)}`}.`;
          },
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

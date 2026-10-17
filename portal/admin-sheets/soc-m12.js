/* Submission Sheet — Module 12 Prove It (capstone), CASE-124821 "Operation
 * Amber Finch" with child incidents INC-4821 (WS-204 endpoint), INC-4822
 * (acct-204 identity) and INC-4823 (WS-118, benign). Lab key 'lab-capstone'.
 * Rubric v3 (CURRENT_VERSION); v1 / v2 attempts keep their single-incident
 * ticket and render the incident sections as "Not recorded".
 *
 * Answer key: SocM12AssessmentData.expectedTruth (+ .scenario) in
 * portal/soc-m12-assessment-data.js — incidentDispositions, incidentAlerts,
 * incidentEvidence, alertDispositions, indicatorDecisions/Evidence,
 * affectedEntities, selectedEvidence, demonstratedAttack, safeActions,
 * residualRisk. Scoring it mirrors: SocM12AssessmentRubric.extractV2() and
 * SocM12AssessmentScorer (eight competencies, 100 points; an unsafe
 * state-changing action caps the score at 69).
 *
 * Saved payload (moduleTwelveFinalize in portal/soc-analyst-module-12.js):
 * result.case_record = the ticket state with .assessmentState (the full
 * replayed capstone state: intelligence, dispositions, incidentLinks,
 * incidents, investigations, attackMappings, workflows, approvals,
 * executions, recovery, reports, handoffs, closure), result.case_display,
 * result.reviewPayload = scorer output incl. .reviewArtifact (student
 * responses, determinations, actions, competencyResults, scoreExplanation),
 * result.breakdown, result.feedback, result.critical_errors. The sheet reads
 * the assessment state first and falls back to the reviewArtifact. Each
 * competency section takes its ✓ / ◐ / ✗ from the stored points for that
 * competency; the parent-CASE ticket, the three incident resolutions, the
 * intelligence verdicts and the alert decisions are additionally checked
 * line by line against the answer key. No payload change was needed.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM12AssessmentData !== 'undefined' ? SocM12AssessmentData : null);
  const scenario = () => (data() && data().scenario) || {};
  const truth = () => (data() && data().expectedTruth) || {};
  const list = (value) => (Array.isArray(value) ? value : []);
  const obj = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
  const ids = (items) => list(items).join(', ');
  const unique = (items) => [...new Set(items)];
  const lower = (value) => String(value ?? '').toLowerCase();
  const mentions = (text, id) => lower(text).includes(lower(id));
  const stamp = (at) => { const d = at ? new Date(at) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().replace('T', ' ').slice(11, 16) + ' UTC' : '—'; };

  // ---- reading the saved attempt ----
  const caseRecord = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const payload = (result) => obj(result.reviewPayload || result.review_payload);
  const artifactOf = (result) => obj(payload(result).reviewArtifact || payload(result).review_artifact);
  const stateOf = (result) => { const rec = caseRecord(result); return rec && rec.assessmentState && typeof rec.assessmentState === 'object' ? rec.assessmentState : null; };
  const version = (result) => {
    const v = Number(payload(result).rubricVersion ?? (stateOf(result) || {}).rubricVersion ?? 1);
    return Number.isFinite(v) ? v : 1;
  };
  const hasRecord = (result) => Boolean(stateOf(result) || Object.keys(artifactOf(result)).length);

  // One normalized view over the full state (preferred) or the review artifact (fallback).
  function view(result) {
    const state = stateOf(result);
    const art = artifactOf(result);
    const det = obj(art.studentDeterminations);
    const out = {
      intelligence: obj(state ? state.intelligence : det.intelligence),
      dispositions: obj(state ? state.dispositions : det.dispositions),
      alertReviews: obj(state && state.alertReviews),
      generatedAlerts: list(state && state.generatedAlerts),
      investigations: list(state ? state.investigations : det.findings),
      attackMappings: list(state ? state.attackMappings : det.attackMappings),
      selected: list(state ? state.selectedEvidence : art.selectedEvidence),
      queryRuns: list(state && state.queryRuns), rules: list(state && state.rules), schedules: list(state && state.schedules),
      workflows: list(state && state.workflows), approvals: list(state && state.approvals), executions: list(state && state.executions), recovery: list(state && state.recovery),
      handoffs: list(state && state.handoffs), closure: state ? state.closure : null,
      actions: list(state ? state.actionHistory : art.studentActions),
      links: list(state && state.incidentLinks),
      incidents: obj(state && state.incidents),
      ticketCore: det.ticketCore || null,
      reports: obj(state && state.reports),
    };
    // Fallbacks from the review artifact when the full state was not saved.
    if (!state) {
      list(det.incidents).forEach((inc) => {
        out.incidents[inc.id] = { status: inc.status, disposition: inc.disposition, note: inc.note, evidenceIds: inc.evidenceIds };
        list(inc.linkedAlerts).forEach((alertId) => out.links.push({ alertId, incidentId: inc.id }));
      });
      list(art.studentResponses).forEach((item) => { if (item && item.kind && ['technical', 'executive', 'lessons'].includes(item.kind)) out.reports[item.kind] = { kind: item.kind, text: item.text, evidenceIds: item.evidenceIds }; });
    }
    if (!out.ticketCore) {
      const core = [...out.actions].reverse().find((a) => a && a.details && a.details.ticketCore);
      out.ticketCore = core ? core.details.ticketCore : null;
    }
    return out;
  }

  // ---- competency points (stored; the sheet never re-scores) ----
  function criterionRow(result, id) {
    const rows = list(payload(result).criteria).length ? list(payload(result).criteria) : list(result.breakdown);
    const labels = (typeof SocM12AssessmentRubric !== 'undefined' ? SocM12AssessmentRubric.CRITERIA : []);
    const wanted = labels.find((c) => c.id === id);
    return rows.find((row) => row && (row.id === id || (wanted && row.label === wanted.label))) || null;
  }
  const pointsOf = (row) => (row ? Number(row.points ?? row.score) : NaN);
  const competencyTest = (result, id) => {
    const row = criterionRow(result, id);
    const points = pointsOf(row);
    const max = Number(row && row.max);
    if (!row || !Number.isFinite(points) || !Number.isFinite(max) || max <= 0) return null;
    return points >= max ? true : points > 0 ? 'partial' : false;
  };
  const competencyGiven = (result, id) => {
    const row = criterionRow(result, id);
    const points = pointsOf(row);
    if (!row || !Number.isFinite(points)) return null;
    const misses = list(row.misses).filter(Boolean);
    return `${points} of ${row.max} points${misses.length ? `. Scorer noted: ${misses.slice(0, 3).join(' ')}` : ''}`;
  };
  const competency = (id, config) => ({
    label: config.label,
    expected: config.expected,
    test: (result) => competencyTest(result, id),
    given: (result, ctx) => [competencyGiven(result, id), config.given ? config.given(result, ctx) : ''].filter(Boolean).join('. ') || null,
    fix: config.fix,
    fixPartial: config.fixPartial || config.fix,
  });

  // ---- words for ids ----
  const evidenceNote = {
    'EM-212': 'the phishing email the user opened', 'EP-301': 'the script that ran on WS-204', 'EP-303': 'the Run key that keeps it running',
    'ID-402': 'the unfamiliar token refresh on acct-204', 'NW-501': 'the outbound connection to the attacker address',
    'NW-504': 'the scope check showing no second device', 'BEN-101': 'the approved IT inventory script', 'ID-403': 'the follow-up sign-in', 'EP-304': 'the scheduled signed inventory run', 'EP-309': 'the signed encoded-argument inventory run',
  };
  const evLabel = (id) => (evidenceNote[id] ? `${id} (${evidenceNote[id]})` : id);
  const DISP = { 'true-positive': 'True positive', 'benign-positive': 'Benign positive', 'false-positive': 'False positive', 'needs-investigation': 'Needs investigation' };
  const dispText = (id) => DISP[id] || (id ? String(id).replace(/-/g, ' ') : 'None');
  const STATUS = { 'in-progress': 'In Progress', pending: 'Pending', resolved: 'Resolved' };
  const alertRow = (id) => list(scenario().queue).find((a) => a.id === id) || null;
  const alertLabel = (id) => { const a = alertRow(id); return a ? `${id} · ${a.signal} (${a.entityId})` : String(id); };
  const indicator = (id) => list(scenario().intelligence).find((i) => i.id === id) || null;
  const DOMAIN = { identity: 'Identity', email: 'Email', endpoint: 'Endpoint', network: 'Network', exposure: 'Exposure', timeline: 'Timeline', scope: 'Scope' };
  const DECISION = { malicious: 'Malicious', benign: 'Benign', unknown: 'Unknown' };
  const REPORT = { technical: 'Technical report', executive: 'Executive summary', lessons: 'Lessons learned', handoff: 'Handoff' };
  // The sections list is built when this file loads, so the three child incidents are named here once
  // (scenario.parentCase.incidents, portal/soc-m12-assessment-data.js lines 15-19); every expected value
  // below is still read from the fixture at render time.
  const INCIDENTS = [
    { id: 'INC-4821', title: 'Script execution and outbound connection on WS-204' },
    { id: 'INC-4822', title: 'Unfamiliar token refresh for acct-204' },
    { id: 'INC-4823', title: 'Rare script host on WS-118' },
  ];
  const childIncidents = () => (list(scenario().parentCase && scenario().parentCase.incidents).length ? list(scenario().parentCase.incidents) : INCIDENTS);

  // Alert the key expects for a link / disposition; a correlated alert the student's own query generated counts as a true positive.
  const expectedAlert = (v, id) => truth().alertDispositions[id] || ((v.generatedAlerts.find((a) => a.id === id) || {}).outcome === 'correlated' ? 'true-positive' : null);
  const belongs = (v, link) => list((truth().incidentAlerts || {})[link.incidentId]).includes(link.alertId)
    || (!truth().alertDispositions[link.alertId] && expectedAlert(v, link.alertId) === 'true-positive' && (truth().incidentDispositions || {})[link.incidentId] === 'true-positive');

  // ---------------------------------------------------------- incident sections
  const incidentSection = (child) => {
    const key = () => (truth().incidentDispositions || {})[child.id];
    const keyEvidence = () => list((truth().incidentEvidence || {})[child.id]);
    const rec = (result) => view(result).incidents[child.id] || null;
    const applies = (result) => version(result) >= 3 && hasRecord(result);
    return {
      id: `incident-${child.id.toLowerCase()}`,
      title: `${child.id} · ${child.title}`,
      answer: (result) => {
        if (!applies(result)) return [['Resolution', null]];
        const v = view(result);
        const r = rec(result);
        const linked = unique(v.links.filter((l) => l.incidentId === child.id).map((l) => l.alertId));
        return [
          ['Alerts the student linked to this incident', linked.length ? linked.map(alertLabel) : 'None linked'],
          ['Status', r ? STATUS[r.status] || r.status : 'Never updated (still New)'],
          ['Disposition', r ? dispText(r.disposition) : 'None'],
          ['Evidence cited', r && list(r.evidenceIds).length ? list(r.evidenceIds).map(evLabel) : 'None cited'],
          ['What the key expects', [`${dispText(key())}`, `Alerts: ${list((truth().incidentAlerts || {})[child.id]).map(alertLabel).join('; ')}`, `At least one of: ${keyEvidence().map(evLabel).join('; ')}`]],
        ];
      },
      response: (result) => {
        if (!applies(result)) return [{ label: `${child.id} resolution note · student response`, text: null }];
        const r = rec(result);
        return [{ label: `${child.id} resolution note · student response`, text: r ? r.note || '' : '' }];
      },
      checks: [
        {
          label: `${child.id} resolved on its own record (Resolved, not left open)`,
          expected: 'Resolved',
          test: (result) => (applies(result) ? (rec(result) || {}).status === 'resolved' : null),
          given: (result) => { const r = rec(result); return r ? STATUS[r.status] || r.status : 'Never updated'; },
          fix: `Open ${child.id} and resolve it once you have a final disposition. The case can only close when every child incident is resolved.`,
        },
        {
          label: () => `Disposition is ${dispText(key())}`,
          expected: () => dispText(key()),
          test: (result) => {
            if (!applies(result)) return null;
            const r = rec(result);
            return r && r.disposition ? r.disposition === key() : false;
          },
          given: (result) => dispText((rec(result) || {}).disposition),
          fix: () => `Set ${child.id} to ${dispText(key())}. The cited records (${keyEvidence().join(', ')}) point that way.`,
        },
        {
          label: 'Resolution note is at least 30 characters',
          expected: '30 characters or more',
          test: (result) => (applies(result) ? String((rec(result) || {}).note || '').length >= 30 : null),
          given: (result) => `${String((rec(result) || {}).note || '').length} characters`,
          fix: `Write a fuller resolution note for ${child.id}: what you found and why that disposition is right.`,
        },
        {
          label: () => `Note or evidence list cites a key record (${keyEvidence().join(', ')})`,
          expected: () => `One of ${keyEvidence().join(', ')}`,
          test: (result) => {
            if (!applies(result)) return null;
            const r = rec(result) || {};
            return keyEvidence().some((id) => list(r.evidenceIds).includes(id) || mentions(r.note, id));
          },
          given: (result) => { const r = rec(result) || {}; return list(r.evidenceIds).length ? `Cited ${ids(r.evidenceIds)}` : 'No evidence cited'; },
          fix: () => `Cite the evidence by its id in the note (for example ${keyEvidence().slice(0, 2).join(' and ')}) so the resolution rests on records.`,
        },
        {
          label: () => `Linked a supported alert to ${child.id} (${list((truth().incidentAlerts || {})[child.id]).join(' or ')})`,
          expected: () => ids((truth().incidentAlerts || {})[child.id]),
          test: (result) => {
            if (!applies(result)) return null;
            return view(result).links.some((l) => l.incidentId === child.id && list((truth().incidentAlerts || {})[child.id]).includes(l.alertId));
          },
          given: (result) => { const l = unique(view(result).links.filter((x) => x.incidentId === child.id).map((x) => x.alertId)); return l.length ? `Linked ${l.join(', ')}` : 'No alert linked'; },
          fix: () => `Link the alert that belongs to ${child.id} (${list((truth().incidentAlerts || {})[child.id]).join(' or ')}) from the Alerts tab so the incident is built from its own signal.`,
        },
        {
          label: `No alert linked to ${child.id} that belongs to a different incident`,
          expected: 'Only its own alerts',
          test: (result) => {
            if (!applies(result)) return null;
            const v = view(result);
            return !v.links.some((l) => l.incidentId === child.id && expectedAlert(v, l.alertId) && !belongs(v, l));
          },
          given: (result) => { const v = view(result); const bad = v.links.filter((l) => l.incidentId === child.id && expectedAlert(v, l.alertId) && !belongs(v, l)).map((l) => l.alertId); return bad.length ? `Wrongly linked: ${bad.join(', ')}` : ''; },
          fix: `Unlink alerts that belong elsewhere: each incident should hold only the alerts about its own host or account.`,
        },
      ],
    };
  };

  AdminSubmissionSheet.register(['lab-capstone'], {
    title: 'Module 12 · PROVE IT — Integrated SOC Capstone',
    fixture: data,
    caseId: () => {
      const parent = scenario().parentCase;
      return parent ? [parent.id, ...childIncidents().map((c) => c.id)].join(' · ') : 'CASE-124821';
    },
    freeText: (result) => {
      const rec = caseRecord(result) || {};
      const v = view(result);
      return [rec.notes, ...Object.values(obj(rec.findings)),
        ...Object.values(v.reports).map((r) => r && r.text),
        ...v.handoffs.map((h) => h.text), v.closure && v.closure.rationale,
        ...v.investigations.map((i) => i.finding),
        ...Object.values(v.incidents).map((i) => i && i.note)];
    },
    rubric: {},
    sections: [
      {
        id: 'case',
        title: 'Parent CASE and ticket',
        answer: (result, ctx) => {
          const rec = caseRecord(result);
          const parent = scenario().parentCase || {};
          if (!rec) return [['Case', null]];
          const shown = (name, fallback) => { const x = ctx.display(name); return x !== null ? x : fallback || 'Left blank'; };
          const v = view(result);
          const incidents = version(result) >= 3 ? childIncidents().map((c) => `${c.id} · ${c.title} — ${STATUS[(v.incidents[c.id] || {}).status] || 'New'}`) : null;
          return [
            ['Case', shown('Case', parent.id)],
            ['Case title', parent.title || '—'],
            ['Child incidents (status)', incidents || 'Single-incident ticket (submitted under an older rubric)'],
            ['Status', shown('Status', rec.status)],
            ['Severity', shown('Severity', rec.severity)],
            ['Affected user', shown('Affected user', rec.affectedUser)],
            ['Affected device', shown('Affected device', rec.affectedDevice)],
            ['Disposition', shown('Disposition', rec.disposition)],
            ['Escalation required', shown('Escalation required', rec.escalation)],
            ['Route to department', shown('Route to department', rec.escalation === 'required' ? rec.escalateTo : 'Not applicable')],
          ];
        },
        checks: [
          {
            label: 'Severity is High or Critical',
            expected: 'High or Critical',
            test: (result) => { const core = view(result).ticketCore || caseRecord(result); return core ? ['high', 'critical'].includes(core.severity) : null; },
            given: (result, ctx) => ctx.display('Severity') || ((view(result).ticketCore || caseRecord(result) || {}).severity) || 'Left blank',
            fix: 'Set Severity to High: a confirmed script execution with persistence and an attacker connection is a serious intrusion.',
          },
          {
            label: () => `Affected user is ${truth().affectedEntities.find((id) => /^acct/.test(id))}`,
            expected: () => truth().affectedEntities.find((id) => /^acct/.test(id)),
            test: (result) => { const core = view(result).ticketCore || caseRecord(result); return core ? core.affectedUser === 'acct-204' : null; },
            given: (result) => ((view(result).ticketCore || caseRecord(result) || {}).affectedUser) || 'Left blank',
            fix: 'Put acct-204 in Affected user: its session token was refreshed by an unfamiliar client and it opened the phishing email. acct-091 and system are not part of this incident.',
          },
          {
            label: () => `Affected device is ${truth().affectedEntities.find((id) => /^ws/.test(id))}`,
            expected: () => truth().affectedEntities.find((id) => /^ws/.test(id)),
            test: (result) => { const core = view(result).ticketCore || caseRecord(result); return core ? lower(core.affectedDevice) === 'ws-204' : null; },
            given: (result) => ((view(result).ticketCore || caseRecord(result) || {}).affectedDevice) || 'Left blank',
            fix: 'Put WS-204 in Affected device: the script, the Run key and the outbound connection are all on it. WS-118 only ran an approved inventory script.',
          },
          {
            label: () => 'Priority rationale cites at least one key record (for example EM-212, EP-301, EP-303, ID-402 or NW-501)',
            expected: () => 'A key record id in the rationale',
            test: (result) => {
              const core = view(result).ticketCore;
              if (!core) return caseRecord(result) ? false : null;
              const primary = list(scenario().evidence).filter((e) => (truth().evidenceSupport[e.id] || {}).level === 'PRIMARY').map((e) => e.id);
              return primary.some((id) => mentions(core.priorityRationale, id));
            },
            given: (result) => {
              const core = view(result).ticketCore;
              if (!core || !core.priorityRationale) return 'No priority rationale recorded';
              const cited = list(scenario().evidence).filter((e) => (truth().evidenceSupport[e.id] || {}).level === 'PRIMARY' && mentions(core.priorityRationale, e.id)).map((e) => e.id);
              return cited.length ? `Cites ${cited.join(', ')}` : 'Written, but cites no key record id';
            },
            fix: 'Justify the priority with evidence: name the records (for example EM-212 and EP-301) that make this high severity.',
          },
        ],
      },
      {
        id: 'case-routing',
        title: 'Ticket routing (not scored)',
        required: false,
        checks: [
          {
            label: 'Marked as confirmed malicious activity (true positive)',
            expected: 'True-positive incident',
            test: (result) => (caseRecord(result) ? (caseRecord(result).disposition || caseRecord(result).verdict) === 'true-positive' : null),
            given: (result, ctx) => ctx.display('Disposition') || ((caseRecord(result) || {}).disposition === 'true-positive' ? 'True-positive incident' : (caseRecord(result) || {}).disposition) || 'Left blank',
            fix: 'Record the case disposition as a true-positive incident: two of the three child incidents are confirmed malicious.',
          },
          {
            label: 'Escalation Required, routed to Tier 2 SOC — Incident Response',
            expected: 'Required → Tier 2 SOC — Incident Response',
            // MODULE_TWELVE_CASE.correctEscalateTo = 'tier2-soc' (portal/soc-analyst-module-12.js ~line 87); the scorer does not score the route.
            test: (result) => { const rec = caseRecord(result); return rec ? (rec.escalation === 'required' ? (rec.escalateTo === 'tier2-soc' ? true : 'partial') : false) : null; },
            given: (result, ctx) => {
              const rec = caseRecord(result) || {};
              const escalation = ctx.display('Escalation required') || (rec.escalation === 'required' ? 'Required' : rec.escalation === 'not-required' ? 'Not required' : 'Left blank');
              const route = ctx.display('Route to department') || (rec.escalateTo === 'tier2-soc' ? 'Tier 2 SOC — Incident Response' : '');
              return `${escalation}${route && route !== 'Not applicable' ? ` → ${route}` : ''}`;
            },
            fix: 'Set Escalation to Required and route it to Tier 2 SOC — Incident Response, which owns both the endpoint and the identity legs.',
            fixPartial: 'Escalation is Required, but Tier 2 SOC — Incident Response is the best-fit team because it owns the endpoint and the identity legs together.',
          },
        ],
      },
      ...INCIDENTS.map(incidentSection),
      {
        id: 'intel',
        title: 'Threat intelligence verdicts',
        answer: (result) => {
          if (!hasRecord(result)) return [['Verdicts on the five intelligence records', null]];
          const v = view(result);
          const rows = list(scenario().intelligence).map((item) => {
            const mine = v.intelligence[item.id];
            const key = (truth().indicatorDecisions || {})[item.id];
            const verdict = mine ? `${DECISION[mine.decision] || mine.decision}${mine.decision === key ? ' (matches the key)' : ` (key: ${DECISION[key]})`}` : `No verdict (key: ${DECISION[key]})`;
            return `${item.id} · ${item.indicator} (${item.context}) — ${verdict}`;
          });
          return [['Verdicts on the five intelligence records', rows]];
        },
        response: (result) => {
          if (!hasRecord(result)) return [{ label: 'Intelligence reasoning · student response', text: null }];
          const v = view(result);
          const mine = Object.entries(v.intelligence).sort(([a], [b]) => a.localeCompare(b));
          return mine.length ? mine.map(([id, entry]) => ({ label: `Reasoning for ${id} (${(indicator(id) || {}).indicator || ''}, ${DECISION[entry.decision] || entry.decision})`, text: entry.rationale })) : [{ label: 'Intelligence reasoning · student response', text: '' }];
        },
        checks: [competency('intelligence-preparation', {
          label: 'At least one verdict matches the key and cites a corroborating record, and no verdict contradicts the evidence',
          expected: () => Object.entries(truth().indicatorDecisions).map(([id, d]) => `${id}: ${DECISION[d]}`).join('; '),
          fix: 'Give each indicator a verdict the incident evidence supports and cite the record that proves it in your reasoning (at least 25 characters). Leave an indicator as Unknown rather than guessing.',
        })],
      },
      {
        id: 'alerts',
        title: 'Alert decisions',
        answer: (result) => {
          if (!hasRecord(result)) return [['Verdict on each alert', null]];
          const v = view(result);
          const expected = truth().alertDispositions || {};
          const rows = Object.keys(expected).map((id) => {
            const mine = v.dispositions[id];
            return `${alertLabel(id)} — ${mine ? `recorded ${dispText(mine)}${mine === expected[id] ? ' (matches the key)' : mine === 'needs-investigation' ? ' (safe, no penalty)' : ` (key: ${dispText(expected[id])})`}` : `no verdict (key: ${dispText(expected[id])})`}`;
          });
          const extra = Object.keys(v.dispositions).filter((id) => !expected[id]).map((id) => `${alertLabel(id)} — recorded ${dispText(v.dispositions[id])} (generated by the student's own query)`);
          return [['Verdict on each queue alert', rows], ...(extra.length ? [['Other alerts the student decided', extra]] : [])];
        },
        response: (result) => {
          if (!hasRecord(result)) return [];
          const v = view(result);
          return Object.entries(v.alertReviews).filter(([, r]) => r && r.reason).sort(([a], [b]) => a.localeCompare(b)).map(([id, r]) => ({ label: `Reason for ${id} (${dispText(r.disposition)})`, text: r.reason }));
        },
        checks: [
          {
            // v3: alert-incident-management gives min(3, correct) points for dispositions and -2 for each unsupported call (extractV2).
            label: 'At least three alerts given the verdict the evidence supports, and none marked with an unsupported verdict',
            expected: 'Three or more matching verdicts, no contradicted ones',
            when: (result) => version(result) >= 3,
            test: (result) => {
              if (!hasRecord(result)) return null;
              const v = view(result);
              const entries = Object.entries(v.dispositions);
              const correct = entries.filter(([id, d]) => d === expectedAlert(v, id)).length;
              const bad = entries.filter(([id, d]) => expectedAlert(v, id) && d !== 'needs-investigation' && d !== expectedAlert(v, id)).length;
              return correct >= 3 && !bad ? true : correct || bad ? 'partial' : false;
            },
            given: (result) => {
              const v = view(result);
              const entries = Object.entries(v.dispositions);
              const correct = entries.filter(([id, d]) => d === expectedAlert(v, id)).length;
              const bad = entries.filter(([id, d]) => expectedAlert(v, id) && d !== 'needs-investigation' && d !== expectedAlert(v, id)).map(([id]) => id);
              return `${correct} matching${bad.length ? `; unsupported: ${bad.join(', ')}` : ''}`;
            },
            fix: 'Decide the alerts the evidence settles (the two real incidents and the benign look-alikes) and cite why. Use Needs investigation when the evidence is incomplete rather than guessing.',
            fixPartial: 'Some alert verdicts match the evidence, but fewer than three do or one is contradicted. Re-check each alert against its discriminating record before deciding.',
          },
          competency('alert-incident-management', {
            label: 'Alert and incident handling earned full marks (verdicts, links, ticket core and resolutions together)',
            expected: 'Full marks for the competency',
            when: (result) => version(result) < 3,
            fix: 'Review the alerts, link the real ones to the incident, and justify the ticket priority with cited evidence.',
          }),
        ],
      },
      {
        id: 'queries',
        title: 'Queries, detection rule and schedule',
        answer: (result) => {
          if (!hasRecord(result)) return [['Hunting queries and rule', null]];
          const v = view(result);
          const OUT = { correlated: 'found the correlated behaviour', broad: 'too broad', narrow: 'too narrow', 'no-match': 'no match', other: 'other' };
          return [
            ['Queries run', v.queryRuns.length ? v.queryRuns.map((q) => `${OUT[q.outcome] || q.outcome}: ${q.query}${list(q.matchedEvidence).length ? ` (matched ${ids(q.matchedEvidence)})` : ''}`) : 'None'],
            ['Detection rules saved', v.rules.length ? v.rules.map((r) => `${r.ruleId} (${OUT[r.outcome] || r.outcome}): ${r.query}`) : 'None'],
            ['Schedules', v.schedules.length ? v.schedules.map((s) => `${s.ruleId} ${s.frequency}`) : 'None'],
          ];
        },
        checks: [competency('queries-detection-scheduling', {
          label: 'A query that links at least three key records across sources, saved as a rule, and scheduled to run again',
          expected: () => `Rule ${truth().validRuleId} (process + hash + destination) saved and scheduled`,
          fix: 'Write a query that joins the process, the file hash and the destination across sources, save it as a detection rule, and schedule it (hourly or daily).',
        })],
      },
      {
        id: 'investigation',
        title: 'Cross-domain investigation',
        narrative: true,
        response: (result) => {
          if (!hasRecord(result)) return [{ label: 'Investigation findings · student response', text: null }];
          const found = view(result).investigations.filter((i) => i.domain !== 'timeline' && i.domain !== 'scope');
          return found.length ? found.map((i) => ({ label: `${DOMAIN[i.domain] || i.domain} finding${list(i.evidenceIds).length ? ` · cites ${ids(i.evidenceIds)}` : ''}`, text: i.finding })) : [{ label: 'Investigation findings · student response', text: '' }];
        },
        checks: [competency('cross-domain-investigation', {
          label: 'Findings in the identity, email, endpoint, network and exposure data, each citing the records that support it',
          expected: 'Identity, email, endpoint, network and exposure findings linked to evidence',
          fix: 'Write one finding per data source (identity, email, endpoint, network, exposure), cite the record ids behind it, and do not call benign look-alikes malicious.',
        })],
      },
      {
        id: 'timeline-attack',
        title: 'Timeline, scope, evidence and ATT&CK',
        narrative: true,
        answer: (result) => {
          if (!hasRecord(result)) return [['Pinned evidence', null]];
          const v = view(result);
          const timeline = v.investigations.filter((i) => i.domain === 'timeline');
          return [
            ['Evidence the student pinned', v.selected.length ? v.selected.map(evLabel) : 'None'],
            ['Evidence the key expects', list(truth().selectedEvidence).map(evLabel)],
            ['Timeline built from', timeline.length ? timeline.map((t) => ids(t.evidenceIds)) : 'No timeline recorded'],
            ['ATT&CK techniques mapped', v.attackMappings.length ? v.attackMappings.map((m) => `${m.technique} (evidence ${ids(m.evidenceIds)})`) : 'None'],
            ['Techniques the evidence demonstrates', list(truth().demonstratedAttack).map((t) => `${t} (evidence ${ids(truth().attackEvidence[t])})`)],
          ];
        },
        response: (result) => {
          if (!hasRecord(result)) return [];
          return view(result).investigations.filter((i) => i.domain === 'scope' || i.domain === 'timeline').map((i) => ({ label: `${DOMAIN[i.domain]} statement${list(i.evidenceIds).length ? ` · cites ${ids(i.evidenceIds)}` : ''}`, text: i.finding }));
        },
        checks: [competency('timeline-scope-evidence-attack', {
          label: 'Chronological timeline of at least three key records, scope limited to the two affected entities, relevant evidence kept, and ATT&CK ids tied to proving records',
          expected: () => `Entities ${ids(truth().affectedEntities)}; techniques ${ids(truth().demonstratedAttack)}`,
          fix: () => `Build the timeline from at least three key records in time order, scope the incident to ${ids(truth().affectedEntities)} only, keep the relevant evidence, and map ATT&CK ids only where a record shows the behaviour (${ids(truth().demonstratedAttack)}).`,
        })],
      },
      {
        id: 'containment',
        title: 'Detection tuning, approval and containment',
        answer: (result) => {
          if (!hasRecord(result)) return [['Response workflow', null]];
          const v = view(result);
          return [
            ['Response workflow designed', v.workflows.length ? v.workflows.map((w) => `${w.name}: ${ids(w.nodes)}; order ${list(w.edges).map((e) => `${e.from} → ${e.to}`).join(', ') || 'no connections'}`) : 'None'],
            ['Approvals recorded', v.approvals.length ? v.approvals.map((a) => `${a.approved ? 'Approved' : 'Not approved'}: ${a.action} on ${a.target}`) : 'None'],
            ['Actions executed (outcome)', v.executions.length ? v.executions.map((e) => `${e.action} on ${e.target} — ${e.outcome}${e.outcome === 'blocked' && e.blockReason ? ` (${e.blockReason})` : ''}`) : 'None'],
            ['Safe actions the key expects', list(truth().safeActions).map((a) => a.replace(':', ' on '))],
          ];
        },
        checks: [
          competency('tuning-automation-containment', {
            label: 'Workflow preserves evidence before approval and isolation, containment has an explicit approval, and the supported actions ran',
            expected: () => list(truth().safeActions).join(', '),
            fix: 'Design the workflow as preserve evidence, then approval, then isolate. Record an approval for each protected action before you run it, then run the four supported actions.',
          }),
          {
            label: 'No action was blocked or run outside the approved scope (a blocked attempt caps the score at 69)',
            expected: 'No unsafe execution',
            test: (result) => {
              if (!hasRecord(result)) return null;
              if (typeof payload(result).unsafeExecution === 'boolean') return !payload(result).unsafeExecution;
              return !list(result.critical_errors).length;
            },
            given: (result) => (competencyTest(result, 'tuning-automation-containment') === null ? '' : (payload(result).unsafeExecution === true || list(result.critical_errors).length ? (list(result.critical_errors)[0] || 'An execution was blocked or outside scope') : 'No blocked or out-of-scope action')),
            fix: 'Only act on the supported targets, and record an approval for the exact action and target first. Preserving evidence from another host is fine; isolating or revoking without approval is not.',
          },
        ],
      },
      {
        id: 'recovery',
        title: 'Eradication and recovery',
        answer: (result) => {
          if (!hasRecord(result)) return [['Recovery steps', null]];
          const v = view(result);
          return [['Recovery steps (outcome)', v.recovery.length ? v.recovery.map((r) => `${r.action} on ${r.target} — ${r.outcome}`) : 'None recorded']];
        },
        checks: [competency('eradication-recovery', {
          label: 'Persistence removed, session revoked, restored from the trusted pre-incident point, then scanned clean and monitored',
          expected: 'remove-persistence ws-204; restore BK-204-0900; scan and monitor ws-204',
          fix: 'Remove the persistence after preserving evidence, restore from the verified pre-incident backup (BK-204-0900), then scan and monitor ws-204 before closing.',
        })],
      },
      {
        id: 'reporting',
        title: 'Reports, handoff and lessons',
        narrative: true,
        response: (result) => {
          const rec = caseRecord(result);
          if (!hasRecord(result) && !rec) return [{ label: 'Reports · student response', text: null }];
          const v = view(result);
          const findings = obj(rec && rec.findings);
          const out = [];
          if (rec && typeof rec.notes === 'string' && rec.notes.trim()) out.push({ label: 'Analyst work notes (ticket)', text: rec.notes });
          if (findings.priorityRationale) out.push({ label: 'Priority rationale (ticket)', text: findings.priorityRationale });
          if (findings.scopeStatement) out.push({ label: 'Scope statement (ticket)', text: findings.scopeStatement });
          if (findings.executiveSummary) out.push({ label: 'Executive summary (ticket)', text: findings.executiveSummary });
          if (findings.closureNote) out.push({ label: 'Closure note (ticket)', text: findings.closureNote });
          ['technical', 'executive', 'lessons'].forEach((kind) => {
            const r = v.reports[kind];
            if (r && r.text && !(kind === 'technical' && rec && r.text === (rec.notes || '').trim()) && !(kind === 'executive' && r.text === String(findings.executiveSummary || '').trim())) {
              out.push({ label: `${REPORT[kind]}${list(r.evidenceIds).length ? ` · cites ${ids(r.evidenceIds)}` : ''}`, text: r.text });
            }
          });
          v.handoffs.forEach((h, index) => out.push({ label: `Handoff${v.handoffs.length > 1 ? ` ${index + 1}` : ''}${list(h.openRisks).length ? ` · open risks ${ids(h.openRisks)}` : ''}`, text: h.text }));
          return out.length ? out : [{ label: 'Reports · student response', text: '' }];
        },
        checks: [
          competency('reporting-operations-lessons', {
            label: 'Technical narrative, executive summary, lessons, handoff and closure reasoning, grounded in cited evidence',
            expected: 'Reports that name the affected entities and cite supporting records',
            fix: 'Write the technical report (80+ characters) naming the affected entities and citing the supporting records, an executive summary, lessons that point to a control gap, and a handoff with the open risks.',
          }),
        ],
        // Key pieces of the incident the technical narrative should name (entities and records from the answer key).
        evidence: {
          label: 'Key evidence named in the technical report',
          text: (result) => {
            if (!hasRecord(result) && !caseRecord(result)) return null;
            const v = view(result);
            const rec = caseRecord(result) || {};
            const technical = (v.reports.technical && v.reports.technical.text) || rec.notes || '';
            return technical;
          },
          pieces: () => {
            const t = truth();
            const user = t.affectedEntities.find((id) => /^acct/.test(id));
            const host = t.affectedEntities.find((id) => /^ws/.test(id));
            return [
              { name: `the affected workstation (${host})`, short: host, terms: [host] },
              { name: `the affected account (${user})`, short: user, terms: [user] },
              { name: `the attacker address (${t.maliciousIndicator})`, short: t.maliciousIndicator, terms: [t.maliciousIndicator] },
              { name: 'the phishing email / link the user opened (EM-212)', short: 'the phishing email', terms: ['EM-212', 'phish', 'email', 'link'] },
              { name: 'the script that ran (EP-301)', short: 'the script', terms: ['EP-301', 'script'] },
              { name: 'the persistence on the workstation (EP-303 / Run key)', short: 'the persistence', terms: ['EP-303', 'persist', 'run key'] },
              { name: 'the benign look-alike excluded (ws-118)', short: 'why ws-118 is excluded', terms: ['ws-118'] },
            ];
          },
          fix: (missing) => `Back the technical report with the facts: it does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'closure',
        title: 'Closure decision',
        required: false,
        narrative: true,
        answer: (result) => {
          if (!hasRecord(result)) return [['Decision', null]];
          const v = view(result);
          if (!v.closure) return [['Decision', 'No closure decision recorded']];
          return [['Decision', { close: 'Close the case', retain: 'Keep the case open', reopen: 'Reopen' }[v.closure.decision] || v.closure.decision]];
        },
        response: (result) => {
          if (!hasRecord(result)) return [{ label: 'Closure rationale · student response', text: null }];
          const closure = view(result).closure;
          return [{ label: 'Closure rationale · student response', text: closure ? closure.rationale : '' }];
        },
        checks: [{
          // extractV2: closureSupported = rationale >= 40 chars, names an affected entity or evidence id, and
          // decision 'retain' or 'close' with restore + scan + monitor done and (v3) no unresolved child incident.
          label: 'Closure is defensible: kept open, or closed only after recovery was validated and every child incident was resolved',
          expected: 'Keep open (retain), or close only when recovery is validated and all incidents are resolved',
          test: (result) => {
            if (!hasRecord(result)) return null;
            const v = view(result);
            if (!v.closure) return false;
            const recovered = (action, target) => v.recovery.some((r) => r.action === action && r.target === target && r.outcome === 'success');
            const unresolved = childIncidents().filter((c) => (v.incidents[c.id] || {}).status !== 'resolved');
            const cites = list(truth().affectedEntities).some((e) => mentions(v.closure.rationale, e)) || list(scenario().evidence).some((e) => mentions(v.closure.rationale, e.id));
            const okDecision = v.closure.decision === 'retain' || (v.closure.decision === 'close' && recovered('restore', 'BK-204-0900') && recovered('scan', 'ws-204') && recovered('monitor', 'ws-204') && !(version(result) >= 3 && unresolved.length));
            return String(v.closure.rationale || '').length >= 40 && cites && okDecision;
          },
          given: (result) => { const c = view(result).closure; return c ? `${c.decision}, ${String(c.rationale || '').length} characters` : 'No closure decision'; },
          fix: 'Keep the case open until recovery is validated and all three child incidents are resolved. Give a reason (40+ characters) that names the affected entities or records.',
        }],
      },
      {
        id: 'competencies',
        title: 'Competency results and safety record',
        required: false,
        collapsed: true,
        answer: (result) => {
          if (!hasRecord(result) && !payload(result).criteria) return [['Score explanation', null]];
          const art = artifactOf(result);
          const v = view(result);
          const explanation = list(art.scoreExplanation).length ? art.scoreExplanation : list(payload(result).review && payload(result).review.feedback).length ? payload(result).review.feedback : list(result.feedback);
          return [
            ['Automatic score', art.automatedScore !== undefined ? `${art.automatedScore} (a recommendation; your decision is final)` : result.score !== undefined ? String(result.score) : '—'],
            ['Score explanation', explanation.length ? explanation : 'None saved'],
            ['Safety cap', payload(result).safetyCap && payload(result).safetyCap.applied ? payload(result).safetyCap.reason : 'No cap applied'],
            ['Evidence pinned', v.selected.length ? v.selected.map(evLabel) : 'None'],
            ['Review status', String(art.instructorReviewStatus || 'needs_review').replace(/_/g, ' ')],
            ['Everything the student did (in order)', v.actions.length ? v.actions.map((a) => `${stamp(a.timestamp)} · ${String(a.type || 'action').replace(/[-_]/g, ' ')}${a.details && (a.details.alertId || a.details.incidentId || a.details.indicatorId || a.details.action) ? ` ${a.details.alertId || a.details.incidentId || a.details.indicatorId || `${a.details.action} ${a.details.target || ''}`.trim()}` : ''}${a.details && a.details.outcome ? ` — ${a.details.outcome}` : ''}`) : 'None recorded'],
          ];
        },
      },
    ],
  });
})();

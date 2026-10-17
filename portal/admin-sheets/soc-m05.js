/* Submission Sheet — Module 05 Prove It, CASE-055127 / INC-055436 (ws-assess-27, user
 * j.alvarez: browser -> PowerShell -> syncsvc.exe, Run-key persistence,
 * detection-only EDR, benign signed updater). Lab key
 * 'lab-endpoint-investigation'.
 *
 * Answer key: SocM05AssessmentData.scenario.expectedTruth
 * (soc-m05-assessment-data.js) plus the ticket rosters in
 * soc-analyst-module-05.js (MODULE_FIVE_ENTITY_ROSTER,
 * MODULE_FIVE_DEPARTMENT_OPTIONS). Scoring it mirrors:
 * SocM05AssessmentScorer.score() over SocM05AssessmentRubric.extract(). The
 * scorer saves each criterion's points, max, evidence and misses in
 * result.review_payload.criteria, so every console-work section reads its
 * criterion from there and cannot disagree with the points given.
 *
 * SocM05AssessmentScorer does NOT read the ITSM ticket (status, severity,
 * affected user/device, disposition, route, work notes): it scores the
 * console work (analysis notes, reviewed records, evidence package, EDR
 * handoff, response requests). The ticket sections are therefore advisory;
 * their expected values are the module's documented answers (truth
 * confirmedUser/confirmedDevice; High / confirmed malicious / Endpoint-EDR
 * Response as in the unused moduleFiveCaseScore() feedback).
 *
 * Saved payload (m05 submit, soc-analyst-module-05.js ~1565): result.case_record
 * (ticket + notes + actionHistory), result.case_display (ticket rows as the
 * student saw them), result.review_payload (criteria, entityIdentity,
 * attempt/revision), result.notes (copy of the ticket notes) and, from
 * 2026-10-17, result.work_summary (console work) because that work was not
 * saved before.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM05AssessmentData !== 'undefined' ? SocM05AssessmentData : null);
  const scenario = () => (data() ? data().scenario : null);
  const truth = () => (scenario() ? scenario().expectedTruth : null);
  const roster = (kind) => (typeof MODULE_FIVE_ENTITY_ROSTER !== 'undefined' ? MODULE_FIVE_ENTITY_ROSTER[kind] : []) || [];
  const departments = () => (typeof MODULE_FIVE_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_FIVE_DEPARTMENT_OPTIONS : []);
  const bounceBelow = () => (typeof MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD !== 'undefined' ? MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD : 40);
  // Documented answers for the unscored ticket fields (see header).
  const CORRECT_SEVERITY = 'high';
  const CORRECT_DISPOSITION = 'true-positive';
  const NOTES_MIN = 80; // case-record.js CASE_RECORD_NOTES_MIN (moduleFiveCaseSpec sets no notesMin)

  const byId = (options, id) => options.find((option) => option.id === id) || null;
  const textOf = (options, id) => (byId(options, id) || {}).text || id || '';
  const std = (name, id) => {
    const options = { status: typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [],
      severity: typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [],
      escalation: typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : [] }[name] || [];
    return (options.find((option) => option.id === id) || {}).text || id || '';
  };
  const dispositionLabel = (id) => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' && CASE_RECORD_DISPOSITION_LABELS[id])
    || (typeof CASE_RECORD_DISPOSITION_OPTIONS !== 'undefined' ? textOf(CASE_RECORD_DISPOSITION_OPTIONS, id) : id) || id;
  const blankAs = (value) => (value === null ? null : value || 'Left blank');
  const shown = (ctx, label, fallback) => {
    const value = ctx.display(label);
    return value !== null && value !== 'Not provided' ? value : fallback;
  };
  const clip = (text, max = 2) => String(text).split(/(?<=[.!?])\s+/).slice(0, max).join(' ');
  const base = (path) => String(path || '').split(/[\\/]/).pop();
  const time = (at) => {
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
  };

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const payload = (result) => (result.review_payload && typeof result.review_payload === 'object' ? result.review_payload : null);
  const criteria = (result) => (payload(result) && Array.isArray(payload(result).criteria) ? payload(result).criteria.filter((c) => c && typeof c === 'object' && c.id) : null);
  const criterion = (result, id) => (criteria(result) || []).find((c) => c.id === id) || null;
  const work = (result) => (result.work_summary && typeof result.work_summary === 'object' ? result.work_summary : null);
  const list = (value) => (Array.isArray(value) ? value : []);

  // Ticket values may be stored under the old inventory id / mixed case
  // (soc-analyst-module-05.js moduleFiveCanonicalCaseEntities); fold them.
  const canonicalUser = (value) => (typeof moduleFiveCanonicalAccount === 'function' ? moduleFiveCanonicalAccount(value) : value);
  const canonicalDevice = (value) => (typeof SocM05AssessmentState !== 'undefined' && data() ? SocM05AssessmentState.canonicalDeviceId(value, data()) : value);
  const tierFor = (kind, value) => {
    const folded = kind === 'users' ? canonicalUser(value) : canonicalDevice(value);
    return (byId(roster(kind), folded) || {}).tier;
  };
  const principalText = (kind) => (roster(kind).find((o) => o.tier === 'principal') || {}).text || '';

  function criterionCheck(id, label, fixFallback) {
    const fix = (result) => {
      const c = criterion(result, id);
      const misses = c && Array.isArray(c.misses) ? c.misses.filter(Boolean) : [];
      return misses.length ? clip(misses.join(' ')) : fixFallback;
    };
    return {
      label,
      // Scorer: full weight when the outcome is evidenced, half when only partial evidence exists, else 0.
      test: (result) => {
        const c = criterion(result, id);
        if (!c) return null;
        return c.points >= c.max ? true : c.points > 0 ? 'partial' : false;
      },
      given: (result) => {
        const c = criterion(result, id);
        return c ? `${c.points} of ${c.max} points` : null;
      },
      fix,
      fixPartial: fix,
    };
  }

  function notePieces() {
    const t = truth() || {};
    const file = t.maliciousFile || {};
    const chain = (t.processAncestry || {}).chain || [];
    const hash = file.sha256 || '';
    return [
      { name: `the affected user (${(t.confirmedUser || {}).value})`, short: (t.confirmedUser || {}).value, terms: [(t.confirmedUser || {}).value] },
      { name: `the affected workstation (${(t.confirmedDevice || {}).value})`, short: (t.confirmedDevice || {}).value, terms: [(t.confirmedDevice || {}).value] },
      { name: `the malicious file (${base(file.path)})`, short: base(file.path), terms: [base(file.path), hash] },
      { name: 'the process chain: browser starts PowerShell, which starts the payload', short: 'the browser to PowerShell to payload chain', terms: [...chain, 'powershell', 'parent', 'child', 'chain', 'ancestry'] },
      { name: 'the Run-key persistence entry', short: 'the Run-key persistence entry', terms: ['persistence', 'run key', 'run-key', 'registry', base((t.persistence || {}).registryPath)] },
      { name: 'that the sensor detected the execution but did not prevent it', short: 'that the sensor detected but did not prevent it', terms: ['not prevented', 'detected but', 'detection only', 'did not prevent', 'detected_not_prevented', 'detect'] },
      { name: 'the harmless signed updater, kept separate from the malware', short: 'the harmless signed updater', terms: ['acmeupdater', 'signed updater', 'benign updater', 'updater'] },
      { name: 'the recommended response (isolate or contain, hand off to EDR)', short: 'the recommended response', terms: ['isolate', 'contain', 'quarantine', 'edr', 'eradicate', 'remove', 'preserve'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  AdminSubmissionSheet.register(['lab-endpoint-investigation'], {
    title: 'Module 05 · PROVE IT — Infected Workstation Investigation',
    fixture: data,
    caseId: () => {
      const s = scenario();
      return s ? [s.caseId, s.incidentId].filter(Boolean).join(' · ') : 'Module 05 case';
    },
    // The scorer's evidence strings include raw device ids and request types; show the criteria as saved.
    rubric: (result) => (criteria(result) || []).map((c) => ({
      label: String(c.label || c.id),
      earned: c.points ?? 0,
      max: c.max ?? null,
      misses: (Array.isArray(c.misses) ? c.misses : []).filter(Boolean).map(String),
      deductions: (Array.isArray(c.deductions) ? c.deductions : []).filter((d) => d && d.points).map((d) => `-${d.points} ${d.reason || ''}`.trim()),
      evidence: (Array.isArray(c.supportingEvidence) ? c.supportingEvidence : []).filter(Boolean).map(String),
    })),
    sections: [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => {
          const s = scenario() || {};
          return [
            ['Case', shown(ctx, 'Case', s.caseId || '—')],
            ['Linked incident', shown(ctx, 'Linked incidents', s.incidentId || '—')],
            ['Status', blankAs(record(result) ? shown(ctx, 'Status', std('status', field(result, 'status'))) : null)],
          ];
        },
        checks: [{
          label: 'Case left open while Endpoint/EDR Response acts (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: SocM05AssessmentScorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => std('status', field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The persistence entry still has to be removed from the workstation, so it is not resolved yet.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        required: false,
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', std('severity', severityOf(result))) : null)]],
        checks: [{
          label: `Severity set to ${std('severity', CORRECT_SEVERITY) || 'High'}`,
          expected: 'High',
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === CORRECT_SEVERITY),
          given: (result) => std('severity', severityOf(result)) || 'Left blank',
          fix: 'Set Severity to High. Malware ran on a workstation and set itself up to survive a restart.',
        }],
      },
      {
        id: 'affected-user',
        title: 'Affected user',
        required: false,
        answer: (result) => [['Affected user', blankAs(record(result) ? field(result, 'affectedUser') : null)]],
        checks: [{
          label: () => `Names the user whose workstation ran the malware (${principalText('users')})`,
          expected: () => principalText('users'),
          test: (result) => {
            if (field(result, 'affectedUser') === null) return null;
            const tier = tierFor('users', field(result, 'affectedUser'));
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result) => field(result, 'affectedUser') || 'Left blank',
          fix: () => `Put ${principalText('users')} in Affected user. That account was signed in when the browser started PowerShell.`,
          fixPartial: () => `That user appears in the data, but ${principalText('users')} owns the infected workstation. Name ${principalText('users')}.`,
        }],
      },
      {
        id: 'affected-device',
        title: 'Affected device',
        required: false,
        answer: (result) => [['Affected device', blankAs(record(result) ? field(result, 'affectedDevice') : null)]],
        checks: [{
          label: () => `Names the infected workstation (${principalText('devices')})`,
          expected: () => principalText('devices'),
          test: (result) => {
            if (field(result, 'affectedDevice') === null) return null;
            const tier = tierFor('devices', field(result, 'affectedDevice'));
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result) => field(result, 'affectedDevice') || 'Left blank',
          fix: () => `Put ${principalText('devices')} in Affected device. It ran the payload and holds the Run-key entry.`,
          fixPartial: () => `That workstation ran a harmless updater with the same name as the malware's cover. Name ${principalText('devices')}, where the payload ran.`,
        }],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        required: false,
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: `Marked as ${String(dispositionLabel(CORRECT_DISPOSITION)).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel(CORRECT_DISPOSITION),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === CORRECT_DISPOSITION),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: 'Record the disposition as confirmed malicious activity. An unsigned file, started by PowerShell, wrote a Run-key entry.',
        }],
      },
      {
        id: 'escalation',
        title: 'Escalation & route',
        required: false,
        answer: (result, ctx) => {
          if (!record(result)) return [['Escalation required', null], ['Route to department', null]];
          const escalation = field(result, 'escalation');
          return [
            ['Escalation required', blankAs(shown(ctx, 'Escalation required', std('escalation', escalation)))],
            ['Route to department', escalation === 'required' ? blankAs(shown(ctx, 'Route to department', textOf(departments(), field(result, 'escalateTo')))) : 'Not applicable'],
          ];
        },
        checks: [
          {
            label: 'Escalation marked as Required',
            expected: 'Required',
            test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
            given: (result) => std('escalation', field(result, 'escalation')) || 'Left blank',
            fix: 'Set Escalation to Required. Removing malware from the workstation is an Endpoint/EDR Response task, not an analyst task.',
          },
          {
            label: () => `Routed to the team that contains and cleans endpoints (${(departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text})`,
            expected: () => (departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            test: (result) => {
              const chosen = byId(departments(), field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= bounceBelow() ? 'partial' : false;
            },
            given: (result) => textOf(departments(), field(result, 'escalateTo')) || 'No department chosen',
            fix: (result) => (byId(departments(), field(result, 'escalateTo')) || {}).bounce || 'Route the case to Endpoint/EDR Response, who can isolate the workstation and remove the persistence.',
            fixPartial: (result) => `${(byId(departments(), field(result, 'escalateTo')) || {}).note} Route to Endpoint/EDR Response next time.`,
          },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes (ticket)',
        required: false,
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? (record(result).notes || '') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_MIN,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: the execution chain, your assessment, and the action you recommend for the workstation.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result) => field(result, 'notes'),
          pieces: notePieces,
          fix: (missing) => `Back your recommendation with the evidence: your note does not mention ${missing.join('; ')}.`,
        },
      },
      {
        id: 'analysis',
        title: 'Analysis notes from the console',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Records reviewed', null]];
          return [
            ['Workstations opened', list(w.deviceReviews).length ? list(w.deviceReviews).map((r) => `${r.deviceId}: ${r.status}`) : 'None recorded'],
            ['Event records reviewed', list(w.eventReviews).length ? list(w.eventReviews).map((r) => `${r.eventId}: ${r.status}`) : 'None recorded'],
          ];
        },
        response: (result) => {
          const w = work(result);
          if (!w) return [{ label: 'Console analysis notes · student response', text: null }];
          return [
            ...list(w.analysisNotes).map((n, index) => ({ label: `Analysis note ${index + 1} (${time(n.at)}) · student response`, text: n.text })),
            ...list(w.analysisUpdates).map((u) => ({ label: `Corrected finding (${time(u.at)}): ${u.field}`, text: [u.value, u.reason].filter(Boolean).join('\n') })),
            ...list(w.deviceReviews).filter((r) => r.note).map((r) => ({ label: `Note on workstation ${r.deviceId}`, text: r.note })),
            ...list(w.eventReviews).filter((r) => r.note).map((r) => ({ label: `Note on event ${r.eventId}`, text: r.note })),
          ];
        },
        // No automatic check of its own: the outcome sections below score what these notes say.
      },
      {
        id: 'ancestry',
        title: 'Process chain',
        checks: [criterionCheck('process-ancestry', 'Linked the browser, PowerShell and payload processes into one parent-to-child chain', 'Record the linked browser, PowerShell and payload chain, citing the three process events.')],
      },
      {
        id: 'interpretation',
        title: 'Malicious payload vs harmless updater',
        checks: [criterionCheck('malicious-benign-interpretation', 'Called the unsigned payload malicious and the signed, widely-seen updater harmless', 'Support a malicious finding for the payload and say the signed updater is harmless.')],
      },
      {
        id: 'persistence',
        title: 'Persistence',
        checks: [criterionCheck('persistence', 'Found the Run-key entry the malware created to survive a restart', 'Identify the Run-key persistence entry linked to the payload.')],
      },
      {
        id: 'control',
        title: 'Detection vs prevention',
        required: false,
        checks: [criterionCheck('prevention-detection', 'Said the sensor detected the execution but did not prevent it, and claimed no cleanup', 'Record that the sensor detected the execution but did not stop it; do not claim it was blocked or cleaned up.')],
      },
      {
        id: 'scope',
        title: 'Incident scope',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Workstations in scope', null]];
          const fromHandoffs = list(w.edrHandoffs).flatMap((h) => list(h.deviceIds));
          const fromApprovals = list(w.approvalRequests).map((r) => r.deviceId).filter(Boolean);
          return [
            ['Workstations selected', list(w.selectedDeviceIds).length ? list(w.selectedDeviceIds) : 'None selected'],
            ['Workstations named in handoffs and response requests', [...new Set([...fromHandoffs, ...fromApprovals])].length ? [...new Set([...fromHandoffs, ...fromApprovals])] : 'None'],
          ];
        },
        checks: [criterionCheck('affected-device-scope', `Kept the incident on the infected workstation (${(truth() && truth().confirmedDevice && truth().confirmedDevice.value) || 'ws-assess-27'}) and did not pull in other machines`, 'Name the infected workstation in your response scope and keep other machines out of it.')],
      },
      {
        id: 'evidence-preservation',
        title: 'Evidence preserved',
        required: false,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Evidence package', null]];
          const pkg = w.evidencePackage;
          return [['Evidence package', pkg ? [`Workstation: ${pkg.deviceId}`, `${list(pkg.eventIds).length} event records: ${list(pkg.eventIds).join(', ')}`, `File hashes: ${list(pkg.hashes).map((h) => String(h).slice(0, 12)).join(', ') || 'none'}`] : 'No evidence package saved']];
        },
        checks: [criterionCheck('evidence-preservation', 'Saved the infected workstation’s event records and the malware’s file hash in an evidence package', 'Preserve the infected workstation’s events and the malicious file hash in the evidence package.')],
      },
      {
        id: 'handoff',
        title: 'EDR handoff',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['EDR handoffs', null]];
          const handoffs = list(w.edrHandoffs);
          if (!handoffs.length) return [['EDR handoffs', 'None sent']];
          return handoffs.map((h, index) => [`Handoff ${index + 1}`, [`To: ${h.recipient} (from ${h.owner}), status ${h.status}`, `Workstations: ${list(h.deviceIds).join(', ')}`, `${list(h.eventIds).length} event records, ${list(h.hashes).length} file hash(es)`]]);
        },
        response: (result) => {
          const w = work(result);
          if (!w) return [{ label: 'EDR handoff · student response', text: null }];
          return list(w.edrHandoffs).flatMap((h, index) => [
            { label: `Handoff ${index + 1} · summary`, text: h.summary },
            { label: `Handoff ${index + 1} · recommendation`, text: h.recommendation },
          ]);
        },
        checks: [criterionCheck('response-handoff', 'Sent an EDR handoff naming the infected workstation, its evidence, the malicious file hash and a defensible recommendation', 'Create an EDR handoff for the infected workstation with its event records, the malicious file hash and a clear recommendation such as isolate or investigate.')],
      },
      {
        id: 'safe-response',
        title: 'Safe response boundary',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Response requests', null]];
          const requests = list(w.approvalRequests);
          return [['Response requests', requests.length ? requests.map((r) => `${String(r.type).replace(/^endpoint_|_request$/g, '').replace(/_/g, ' ')} of ${r.deviceId}: ${String(r.status).replace(/_/g, ' ')}${r.reason ? ` — ${r.reason}` : ''}`) : 'None made']];
        },
        checks: [criterionCheck('unsafe-action-boundary', 'Any isolation or quarantine was only a reasoned request awaiting approval, for the infected workstation, and never claimed as done', 'Keep any isolation or quarantine as a pending approval request for the infected workstation with a reason, and never write that it was carried out.')],
      },
      {
        id: 'timeline',
        title: 'Action timeline',
        required: false,
        collapsed: true,
        answer: (result) => {
          const r = record(result);
          if (!r || !Array.isArray(r.actionHistory)) return [['Recorded actions', null]];
          return [['Recorded actions', r.actionHistory.filter((entry) => entry && entry.action).map((entry) => `${time(entry.at)} · ${entry.action}`)]];
        },
      },
    ],
  });
})();

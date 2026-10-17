/* Submission Sheet — Module 07 Prove It, CASE-070731 / INC-071042: the QR
 * invoice email followed through DNS and TLS. Lab keys 'lab-email-triage',
 * 'lab-network-investigation', 'lab-network-email-independent': one submit
 * (moduleSevenFinalizeProveIt) writes the SAME result to all three rows, so
 * the sheet renders once from item.lead and notes the sibling rows.
 *
 * Answer keys (read at render time, never re-typed):
 *   - the investigation: SocM07AssessmentData.scenario (messages, deliveryEvents,
 *     recipientEvents, networkEvents, endpointProcessEvents, expectedTruth.incidentChain,
 *     benignLookalike flags) — portal/soc-m07-assessment-data.js;
 *   - its scoring: SocM07AssessmentRubric.extract / SocM07AssessmentScorer.CRITERIA
 *     (the submitted score and result.breakdown come from these);
 *   - ticket options, entity tiers, department fit: MODULE_SEVEN_* in
 *     portal/soc-analyst-module-07.js. The ticket key is MODULE_SEVEN_ANSWER_KEY
 *     (severity high, Critical/Medium partly right; disposition true-positive;
 *     route tier2-soc-net), rebuilt 2026-10-17 from the QR-invoice fixture's
 *     expectedTruth (click and DNS/TLS confirmed, execution and credential theft
 *     not established). The submit does not score the ticket fields
 *     (moduleSevenProveItPerformance() is never called); the sheet still checks
 *     them. The route is a judgment call and stays advisory.
 *
 * Saved payload: result.breakdown (scorer criterion list), result.review_payload,
 * result.case_record (the ITSM ticket), result.case_display, result.critical_errors
 * and from 2026-10-17 result.assessment_work (review notes, pivots, evidence
 * change history plus the final evidence tray (evidenceSet), scope and every
 * incident record; see moduleSevenAssessmentWork()).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const fixture = () => (typeof SocM07AssessmentData !== 'undefined' ? SocM07AssessmentData : null);
  const scenario = () => (fixture() && fixture().scenario) || null;
  const list = (value) => (Array.isArray(value) ? value : []);
  const allEvents = () => {
    const s = scenario() || {};
    return [...list(s.deliveryEvents), ...list(s.recipientEvents), ...list(s.networkEvents), ...list(s.endpointProcessEvents)];
  };
  const eventById = (id) => allEvents().find((item) => item.id === id) || null;
  const chain = () => list(scenario() && scenario().expectedTruth && scenario().expectedTruth.incidentChain);

  // Module constants, read lazily (soc-analyst-module-07.js, case-record.js).
  const G = {
    roster: () => (typeof MODULE_SEVEN_ENTITY_ROSTER !== 'undefined' ? MODULE_SEVEN_ENTITY_ROSTER : null),
    departments: () => (typeof MODULE_SEVEN_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_SEVEN_DEPARTMENT_OPTIONS : null),
    key: () => (typeof MODULE_SEVEN_ANSWER_KEY !== 'undefined' ? MODULE_SEVEN_ANSWER_KEY : null),
    caseId: () => (typeof MODULE_SEVEN_CASE_ID !== 'undefined' ? MODULE_SEVEN_CASE_ID : null),
    incidentId: () => (typeof MODULE_SEVEN_INCIDENT_ID !== 'undefined' ? MODULE_SEVEN_INCIDENT_ID : null),
    statuses: () => (typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : null),
    severities: () => (typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : null),
    escalations: () => (typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : null),
    dispositions: () => (typeof CASE_RECORD_DISPOSITION_OPTIONS !== 'undefined' ? CASE_RECORD_DISPOSITION_OPTIONS : null),
    dispositionLabels: () => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' ? CASE_RECORD_DISPOSITION_LABELS : null),
  };
  const roster = () => G.roster() || { users: [], devices: [] };
  const departments = () => G.departments() || [];
  const key = () => G.key() || {};
  // Department fit below 40 is "returned" (same threshold as moduleSevenProveItPerformance()).
  const BOUNCE_BELOW = 40;
  // assessment_work (and the M07 evidence/incident detail below) was first saved on this date.
  const SINCE = '2026-10-17';

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, name) => { const r = record(result); return r ? (typeof r[name] === 'string' ? r[name] : '') : null; };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const optionText = (options, id) => ((options || []).find((option) => option.id === id) || {}).text || '';
  const severityLabel = (id) => optionText(G.severities(), id) || id;
  const statusLabel = (id) => optionText(G.statuses(), id) || id;
  const escalationLabel = (id) => optionText(G.escalations(), id) || id;
  const dispositionLabel = (id) => (G.dispositionLabels() || {})[id] || optionText(G.dispositions(), id) || id;
  const department = (id) => departments().find((option) => option.id === id) || null;
  const bestDepartment = () => departments().slice().sort((a, b) => b.fit - a.fit)[0] || null;
  const tierOf = (kind, id) => ((roster()[kind] || []).find((entry) => entry.id === String(id || '').toLowerCase()) || {}).tier || '';
  const principal = (kind) => ((roster()[kind] || []).find((entry) => entry.tier === 'principal') || {}).id || '';
  const shown = (ctx, label, fallback) => { const value = ctx.display(label); return value !== null ? value : fallback; };
  const blankAs = (value) => (value === null ? null : value || 'Left blank');

  const work = (result) => (result.assessment_work && typeof result.assessment_work === 'object' ? result.assessment_work : null);
  const workList = (result, name) => (work(result) ? list(work(result)[name]) : null);

  // ----- plain-language descriptions of records (ids stay visible for lookup)
  function describe(id) {
    const s = scenario() || {};
    const message = list(s.messages).find((item) => item.id === id);
    if (message) return `${id} · message “${message.subject}” from ${message.from && message.from.address}`;
    for (const item of list(s.messages)) {
      for (const url of list(item.urls)) {
        if (url.id === id) return `${id} · link ${url.original}`;
        const redirect = list(url.redirects).find((entry) => entry.id === id);
        if (redirect) return `${id} · redirect (${redirect.status}) to ${redirect.url}`;
      }
      const attachment = list(item.attachments).find((entry) => entry.id === id);
      if (attachment) return `${id} · attachment ${attachment.fileName}`;
    }
    const e = eventById(id);
    if (!e) return String(id);
    const time = String(e.timestamp || '').slice(11, 19);
    const who = [e.recipientId, e.deviceId].filter(Boolean).join(' / ');
    const what = e.status ? `message ${String(e.status).replace(/_/g, ' ')} for ${e.recipientId}`
      : e.type === 'open_and_link_click' ? `${who} opened the message and clicked the link`
        : e.type === 'dns_query' ? `${who} looked up ${e.domain} → ${list(e.answers).join(', ')}`
          : e.type === 'tls_session' ? `${who} opened an encrypted session to ${e.destinationIp} (${e.sni})`
            : e.type === 'firewall_flow' ? `firewall ${e.action} ${e.sourceIp} → ${e.destinationIp}:${e.destinationPort}`
              : e.type === 'proxy_request' ? `${who} web request ${e.method} ${e.url} → ${e.status}`
                : e.type === 'process_start' ? `${e.processName} started on ${e.deviceId}` : String(e.type || '');
    return `${id} · ${time} · ${what}`;
  }
  const describeAll = (ids) => list(ids).map(describe);

  // ----- criterion helpers (the module scorer's own points drive the check)
  const criterion = (result, id) => (Array.isArray(result.breakdown) ? result.breakdown : []).find((item) => item && item.id === id) || null;
  const criterionTest = (id) => (result) => {
    const item = criterion(result, id);
    if (!item) return null;
    const points = Number(item.points);
    const max = Number(item.max);
    if (!Number.isFinite(points) || !Number.isFinite(max)) return null;
    return points >= max ? true : points > 0 ? 'partial' : false;
  };
  const criterionGiven = (id) => (result) => {
    const item = criterion(result, id);
    if (!item) return null;
    const misses = list(item.misses).filter(Boolean);
    return `${item.points} of ${item.max} points${misses.length ? `; the scorer noted: ${misses.join(' ')}` : ''}`;
  };
  const credited = (id) => (result) => {
    const item = criterion(result, id);
    return item ? describeAll(list(item.supportingEvidence).filter((entry) => describe(entry) !== String(entry))) : null;
  };
  // A detail check carries the specific red-pen note; the matching system-score
  // check only shows when the details cannot explain a short score (or the
  // attempt predates assessment_work). A missing detail reads ◐ (not ✗) when the
  // scorer gave half credit, so partial credit never blocks a pass.
  const withScore = (details, id, label, fix) => [
    // Detail lines need the saved work; older attempts show only the scorer's points.
    ...details.map((check) => ({
      ...check,
      when: (result, ctx) => work(result) !== null && (check.when === undefined || check.when(result, ctx)),
      test: (result, ctx) => {
        const value = check.test(result, ctx);
        return value === false && criterionTest(id)(result) === 'partial' ? 'partial' : value;
      },
    })),
    {
      label,
      when: (result, ctx) => !details.some((check) => {
        if (check.when !== undefined && !check.when(result, ctx)) return false;
        const value = check.test(result, ctx);
        return value === false || value === 'partial';
      }),
      test: criterionTest(id),
      given: criterionGiven(id),
      fix,
    },
  ];

  // ----- mirror of the scorer's reading of the saved actions (soc-m07-assessment-rubric.js)
  const reviewedNetwork = (result) => (workList(result, 'networkReviews') === null ? null : workList(result, 'networkReviews').filter((item) => item.reviewed).map((item) => item.eventId));
  // Every record the student ever added (the scorer credits an add even if it was removed later).
  const everAdded = (result) => (workList(result, 'evidenceChanges') === null ? null : workList(result, 'evidenceChanges').filter((item) => item.operation === 'add').map((item) => item.eventId));
  // The evidence tray at submit: the saved evidenceSet, or the change history replayed in order.
  const finalEvidence = (result) => {
    const w = work(result);
    if (!w) return null;
    if (Array.isArray(w.evidenceSet)) return w.evidenceSet.filter((item) => item && item.eventId);
    const kept = new Map();
    list(w.evidenceChanges).forEach((item) => { if (item.operation === 'add') kept.set(item.eventId, item); else kept.delete(item.eventId); });
    return [...kept.values()];
  };
  const finalIds = (result) => (finalEvidence(result) === null ? null : finalEvidence(result).map((item) => item.eventId));
  // true = in the final tray; 'partial' = added, then removed before submitting; false = never added.
  const preserved = (result, id) => {
    const kept = finalIds(result);
    if (kept === null) return null;
    return kept.includes(id) ? true : everAdded(result).includes(id) ? 'partial' : false;
  };
  const removedLater = (result) => { const kept = finalIds(result); return kept === null ? [] : [...new Set(everAdded(result))].filter((id) => !kept.includes(id)); };
  const validPivot = (pivots, from, to) => {
    const left = eventById(from);
    const right = eventById(to);
    if (!left || !right || !pivots.some((item) => item.fromEventId === from && item.toEventId === to)) return false;
    return ['relatedRecipientEventId', 'relatedDnsEventId', 'relatedTlsEventId', 'relatedProxyEventId'].some((name) => right[name] === from || left[name] === to);
  };
  const confirmedSteps = () => chain().filter((step) => step.status === 'confirmed' && step.evidence);
  const stepLabel = (step) => {
    const e = eventById(step.evidence) || {};
    if (step.step === 'message_delivery') return `The message was delivered to ${list(step.recipientIds).join(', ')}`;
    if (step.step === 'recipient_open') return `${list(step.recipientIds).join(', ')} opened it and clicked the link`;
    if (step.step === 'dns_resolution') return `The device looked up ${step.domain} and got ${step.address}`;
    if (step.step === 'tls_connection') return `The device opened an encrypted connection to ${step.address} (${step.sni || e.sni || ''})`.replace(/ \(\)/, '');
    return String(step.step).replace(/_/g, ' ');
  };
  // Distinct records behind the confirmed steps: [{ evidence, labels: [plain step wording] }].
  const chainRecords = () => confirmedSteps().reduce((records, step) => {
    const existing = records.find((item) => item.evidence === step.evidence);
    if (existing) existing.labels.push(stepLabel(step)); else records.push({ evidence: step.evidence, labels: [stepLabel(step)] });
    return records;
  }, []);
  const stepCovered = (result, step) => {
    const reviewed = reviewedNetwork(result);
    const added = everAdded(result);
    if (reviewed === null) return null;
    const pivots = workList(result, 'pivots');
    return reviewed.includes(step.evidence) || added.includes(step.evidence)
      || allEvents().some((candidate) => validPivot(pivots, candidate.id, step.evidence));
  };
  // Every incident record saved at submit (removed ones are already gone), and the
  // one the automatic score reads: the first (soc-m07-assessment-rubric.js latestIncident).
  const incidents = (result) => (workList(result, 'incidentLinks') === null ? null : workList(result, 'incidentLinks').filter((item) => item && item.operation !== 'remove'));
  const incident = (result) => { const all = incidents(result); return all === null ? null : (all[0] || false); };
  const benignIds = () => allEvents().filter((item) => item.benignLookalike === true).map((item) => item.id);
  const primaryRecipients = () => new Set(confirmedSteps().flatMap((step) => list(step.recipientIds)));
  const deliveredRecord = () => {
    const step = chain().find((item) => item.step === 'message_delivery' && item.status === 'confirmed');
    return list(scenario().deliveryEvents).find((item) => step && item.recipientId === list(step.recipientIds)[0] && item.status === 'delivered') || null;
  };
  const blockedRecord = () => list(scenario().deliveryEvents).find((item) => item.status === 'blocked_at_gateway') || null;
  // Labels from the incident form's Assessment status select (soc-m07-assessment-email-ui.js).
  const ASSESSMENT = { supported: 'Supported by linked evidence', unknown: 'Unknown / needs investigation' };
  const assessmentLabel = (item) => ASSESSMENT[item.assessment] || item.assessment || '—';
  const severityPartial = () => list(key().severityPartial);

  // ----- key-evidence pieces for the ticket work note
  function notePieces() {
    const s = scenario() || {};
    const message = list(s.messages)[0] || {};
    const dns = eventById('M07-DNS-001') || {};
    const blocked = blockedRecord() || {};
    const lookalike = allEvents().find((item) => item.benignLookalike === true) || {};
    return [
      { name: `the recipient who received and opened it (${principal('users')})`, short: principal('users'), terms: [principal('users')] },
      { name: `the affected workstation (${principal('devices')})`, short: principal('devices'), terms: [principal('devices')] },
      { name: `the sender (${message.from && message.from.address})`, short: 'the sender', terms: [message.from && message.from.address, message.from && message.from.address.split('@')[1], 'northwind-billing'] },
      { name: 'that the email failed authentication (DMARC fail)', short: 'the failed email authentication', terms: ['dmarc', 'spf', 'dkim', 'authentication', 'not aligned', 'spoof'] },
      { name: `the link domain (${dns.domain}) and its address (${list(dns.answers)[0]})`, short: `${dns.domain} / ${list(dns.answers)[0]}`, terms: [dns.domain, list(dns.answers)[0]] },
      { name: `the recipient whose copy was blocked (${blocked.recipientId})`, short: `${blocked.recipientId}'s blocked copy`, terms: [blocked.recipientId, 'blocked', 'quarantin'] },
      { name: `the benign lookalike that was ruled out (${lookalike.deviceId})`, short: `the ruled-out lookalike (${lookalike.deviceId})`, terms: [lookalike.deviceId, lookalike.recipientId, 'lookalike', 'benign', 'payroll', 'unrelated', 'noise'] },
      { name: 'what is not established (endpoint execution, stolen credentials)', short: 'what is not established', terms: ['not established', 'not confirmed', 'unconfirmed', 'unknown', 'unverified', 'no evidence', 'cannot confirm', 'not proven', 'unable to confirm', 'no proof'] },
      { name: 'the next step (escalate, investigate the endpoint, reset credentials)', short: 'the next step', terms: ['escalat', 'investigat', 'reset', 'isolat', 'contain', 'tier 2', 'tier2', 'block', 'handoff', 'hand off'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  function ticketSections() {
    return [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Case', shown(ctx, 'Case', G.caseId() || 'CASE-070731')],
          ['Linked incident', shown(ctx, 'Linked incidents', G.incidentId() || 'INC-071042')],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', statusLabel(field(result, 'status'))) : null)],
          ...(ctx.rows.length > 1 ? [['Stored as', `${ctx.rows.length} lab records with identical answers (one submit writes them all); this sheet shows the submission once`]] : []),
        ],
        checks: [{
          label: 'Case left open while responders act (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: the Prove It scorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => statusLabel(field(result, 'status')) || 'Left blank',
          fix: (result) => `You marked the case ${statusLabel(field(result, 'status')) || 'with no status'}. Keep it In Progress: nobody has yet checked whether anything ran on ${principal('devices')} or whether ${principal('users')} entered a password, so it is not resolved.`,
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: () => `Severity set to ${severityLabel(key().severity)} (${severityPartial().map(severityLabel).join(' or ')} is partly right)`,
          expected: () => severityLabel(key().severity),
          test: (result) => {
            const value = severityOf(result);
            if (value === null) return null;
            return value === key().severity ? true : severityPartial().includes(value) ? 'partial' : false;
          },
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: (result) => `${severityOf(result) ? `You set Severity to ${severityLabel(severityOf(result))}.` : 'You left Severity blank.'} Set it to ${severityLabel(key().severity)}: ${principal('users')} opened the invoice and clicked the link, and ${principal('devices')} then connected to the phishing site. That is a confirmed exposure, not a low-risk event.`,
          fixPartial: (result) => (severityOf(result) === 'critical'
            ? `Critical over-rates this. ${principal('users')} clicked and ${principal('devices')} connected to the phishing site, but nothing yet shows the file ran or a password was taken. Rate it ${severityLabel(key().severity)} until that is confirmed.`
            : `${severityLabel(severityOf(result))} under-rates this: ${principal('users')} clicked the link and ${principal('devices')} connected to the phishing site. Rate it ${severityLabel(key().severity)}.`),
        }],
      },
      ...['users', 'devices'].map((kind) => {
        const name = kind === 'users' ? 'affectedUser' : 'affectedDevice';
        const noun = kind === 'users' ? 'user' : 'device';
        return {
          id: `affected-${noun}`,
          title: `Affected ${noun}`,
          answer: (result, ctx) => [[`Affected ${noun}`, blankAs(record(result) ? shown(ctx, `Affected ${noun}`, field(result, name)) : null)]],
          checks: [{
            label: () => (kind === 'users'
              ? `Names the recipient who received and clicked the link (${principal('users')})`
              : `Names the workstation the link was opened on (${principal('devices')})`),
            expected: () => principal(kind),
            // Same tiers as the ticket key: principal = full, pivot = half, other = none.
            test: (result) => {
              const value = field(result, name);
              if (value === null) return null;
              const tier = tierOf(kind, value);
              return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
            },
            given: (result) => field(result, name) || 'Left blank',
            fix: kind === 'users'
              ? (result) => `${field(result, name) ? `You named ${field(result, name)}, which has no part in the phishing chain.` : 'You left Affected user blank.'} Put ${principal('users')} in Affected user: that account received the invoice email, opened it and clicked the link.`
              : (result) => `${field(result, name) ? `You named ${field(result, name)}, which only shows a normal payroll lookup.` : 'You left Affected device blank.'} Put ${principal('devices')} in Affected device: the DNS lookup and encrypted session to the link domain came from that workstation.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, name)} was only blocked at the gateway and never received the message. Name ${principal('users')}, who received and clicked it.`
              : (result) => `${field(result, name)} is not where the link was opened. Name ${principal('devices')}.`,
          }],
        };
      }),
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: () => `Marked as ${String(dispositionLabel(key().disposition)).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel(key().disposition),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === key().disposition),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: (result) => {
            const dns = eventById('M07-DNS-001') || {};
            return `${dispositionOf(result) ? `You recorded “${dispositionLabel(dispositionOf(result))}”.` : 'You left Disposition blank.'} Record it as ${dispositionLabel(key().disposition)}: the invoice email failed DMARC, was delivered to ${principal('users')}, was opened and clicked, and ${principal('devices')} then connected to ${dns.domain || 'the link domain'}.`;
          },
        }],
      },
      {
        id: 'escalation',
        title: 'Escalation',
        answer: (result, ctx) => [['Escalation required', blankAs(record(result) ? shown(ctx, 'Escalation required', escalationLabel(field(result, 'escalation'))) : null)]],
        checks: [{
          label: 'Escalation marked as Required',
          expected: 'Required',
          test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
          given: (result) => escalationLabel(field(result, 'escalation')) || 'Left blank',
          fix: (result) => `${field(result, 'escalation') ? `You set Escalation to ${escalationLabel(field(result, 'escalation'))}.` : 'You left Escalation blank.'} Set it to Required: checking ${principal('devices')} and ${principal('users')} for compromise is beyond an analyst’s authority.`,
        }],
      },
      {
        id: 'route',
        title: 'Route to department',
        required: false,
        answer: (result, ctx) => (record(result)
          ? [['Route to department', field(result, 'escalation') === 'required' ? blankAs(shown(ctx, 'Route to department', (department(field(result, 'escalateTo')) || {}).text || field(result, 'escalateTo'))) : 'Not applicable']]
          : [['Route to department', null]]),
        checks: [{
          label: () => `Routed to the team that investigates the click and the workstation (${(bestDepartment() || {}).text})`,
          expected: () => (bestDepartment() || {}).text,
          when: (result) => field(result, 'escalation') === 'required',
          test: (result) => {
            const chosen = department(field(result, 'escalateTo'));
            if (!chosen) return false;
            return chosen.fit >= 100 ? true : chosen.fit >= BOUNCE_BELOW ? 'partial' : false;
          },
          given: (result) => (department(field(result, 'escalateTo')) || {}).text || 'No department chosen',
          fix: (result) => {
            const chosen = department(field(result, 'escalateTo'));
            return chosen
              ? `You routed the case to ${chosen.text}. ${chosen.note} Route it to ${(bestDepartment() || {}).text} instead.`
              : `Choose a department: route the case to ${(bestDepartment() || {}).text}. ${(bestDepartment() || {}).note || ''}`.trim();
          },
          fixPartial: (result) => `You routed the case to ${(department(field(result, 'escalateTo')) || {}).text}. ${(department(field(result, 'escalateTo')) || {}).note} Route it to ${(bestDepartment() || {}).text} next time.`,
        }],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? field(result, 'notes') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: 80, // CASE_RECORD_NOTES_MIN (case-record.js): moduleSevenProveItSpec() sets no notesMin
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: the chain you confirmed, what is still unknown, what you ruled out, and what happens next.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result) => (record(result) ? field(result, 'notes') : null),
          pieces: () => notePieces(),
          fix: (missing) => `Back your conclusion with the evidence: your note does not mention ${missing.join(', ')}. Say what each record showed.`,
        },
      },
    ];
  }

  function investigationSections() {
    const preservedCheck = (record, label, why) => ({
      label: () => `${label()} (${(record() || {}).id})`,
      test: (result) => preserved(result, (record() || {}).id),
      given: (result) => {
        const value = preserved(result, (record() || {}).id);
        return value === null ? null : value === true ? 'In the evidence tray' : value === 'partial' ? 'Added to evidence, then removed before submitting' : 'Never added to evidence';
      },
      fix: () => `Add the record for ${(record() || {}).recipientId} (${(record() || {}).id}) to your evidence: ${why()}`,
      // 'partial' also comes from the scorer's half credit (withScore), so word it from what the student did.
      fixPartial: (result) => (preserved(result, (record() || {}).id) === 'partial'
        ? `You added ${(record() || {}).id} to your evidence and then removed it before submitting. Keep it in the evidence tray: ${why()}`
        : `Add the record for ${(record() || {}).recipientId} (${(record() || {}).id}) to your evidence: ${why()}`),
    });
    const evidenceRows = (result) => {
      const kept = finalEvidence(result);
      const changes = workList(result, 'evidenceChanges');
      const rows = [['Evidence in the tray at submit', kept.length ? kept.map((item) => describe(item.eventId)) : 'None']];
      if (removedLater(result).length) {
        rows.push(['Evidence change history (in order)', changes.map((item) => `${item.operation === 'add' ? 'Added' : 'Removed'} ${describe(item.eventId)}`)]);
      }
      return rows;
    };
    return [
      {
        id: 'review-notes',
        title: 'Records reviewed & analyst notes',
        required: false,
        recordedSince: SINCE,
        answer: (result) => {
          const messages = workList(result, 'messageReviews');
          if (messages === null) return [['Records reviewed', null]];
          const reviewed = (name, id) => [...new Set(workList(result, name).filter((item) => item.reviewed).map((item) => item[id]))];
          return [
            ['Messages opened', describeAll(reviewed('messageReviews', 'messageId'))],
            ['Links and attachments inspected', describeAll(reviewed('artifactReviews', 'artifactId'))],
            ['Network and endpoint records opened', describeAll(reviewed('networkReviews', 'eventId'))],
          ];
        },
        response: (result) => {
          if (work(result) === null) return [];
          const notes = [['messageReviews', 'messageId'], ['artifactReviews', 'artifactId'], ['networkReviews', 'eventId']]
            .flatMap(([name, id]) => workList(result, name).filter((item) => item.reviewed && item.note).map((item) => ({ label: `Note on ${describe(item[id])} · student response`, text: item.note })));
          return notes;
        },
      },
      {
        id: 'delivery-scope',
        title: 'Who received the message',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('delivery-scope')(result)]];
          const scope = w.scope || {};
          const delivery = (id) => ['delivered', 'blocked_at_gateway'].includes((eventById(id) || {}).status);
          return [
            ['Recipients the student scoped in', list(scope.recipientIds).length ? list(scope.recipientIds) : 'None'],
            ['Devices the student scoped in', list(scope.deviceIds).length ? list(scope.deviceIds) : 'None'],
            ['Delivery records in the evidence tray', describeAll(finalIds(result).filter(delivery))],
            ...(removedLater(result).filter(delivery).length ? [['Delivery records added, then removed', describeAll(removedLater(result).filter(delivery))]] : []),
          ];
        },
        checks: withScore([
          preservedCheck(deliveredRecord, () => `Preserved the record showing the message was delivered to ${(deliveredRecord() || {}).recipientId}`, () => 'it proves the message arrived.'),
          preservedCheck(blockedRecord, () => `Preserved the record showing the copy for ${(blockedRecord() || {}).recipientId} was blocked at the gateway`, () => `it shows ${(blockedRecord() || {}).recipientId} never received the message, so the incident only covers who actually did.`),
        ], 'delivery-scope', 'System score for delivered versus blocked recipients', 'Preserve both the delivered record and the gateway-blocked record as evidence.'),
      },
      {
        id: 'chain',
        title: 'Message-to-network chain',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('confirmed-chain')(result)]];
          return [
            ['Pivots followed (from record → to record)', list(w.pivots).length ? list(w.pivots).map((item) => `${describe(item.fromEventId)}  →  ${describe(item.toEventId)}`) : 'None followed'],
            ...evidenceRows(result),
          ];
        },
        response: (result) => (finalEvidence(result) || []).filter((item) => item.reason)
          .map((item) => ({ label: `Why ${item.eventId} was kept as evidence · student response`, text: item.reason })),
        // One line per distinct confirmed-step record (message delivery and recipient
        // open share one record). Slots are fixed so the sheet does not depend on
        // load order; unused slots are skipped with `when`.
        checks: withScore(Array.from({ length: 6 }, (_, index) => ({
          when: () => chainRecords()[index] !== undefined,
          label: () => `Examined the record showing: ${chainRecords()[index].labels.join(' and ')} (${chainRecords()[index].evidence})`,
          test: (result) => stepCovered(result, chainRecords()[index]),
          fix: () => `Open and preserve ${chainRecords()[index].evidence}, the record showing ${chainRecords()[index].labels.join(' and ').replace(/^The /, 'the ')}, or reach it by pivoting from a related record.`,
        })), 'confirmed-chain', 'System score for correlating the message with DNS and TLS evidence', 'Follow the chain from the click to the DNS lookup to the encrypted session, and preserve each record.'),
      },
      {
        id: 'noise',
        title: 'Benign lookalike ruled out',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('noise-rejection')(result)]];
          const opened = reviewedNetwork(result).filter((id) => benignIds().includes(id));
          return [['Lookalike records the student opened', opened.length ? describeAll(opened) : 'None opened']];
        },
        checks: withScore([
          {
            label: () => `Opened at least one benign lookalike record (the ${(allEvents().find((item) => item.benignLookalike) || {}).deviceId} lookalike) to rule it out`,
            test: (result) => { const reviewed = reviewedNetwork(result); return reviewed === null ? null : reviewed.some((id) => benignIds().includes(id)); },
            fix: () => `Open the ${(allEvents().find((item) => item.benignLookalike) || {}).deviceId} records (a normal payroll lookup that looks similar) and rule them out explicitly.`,
          },
          {
            label: 'Kept the lookalike events and unrelated recipients out of the incident record',
            test: (result) => {
              const found = incident(result);
              if (found === null) return null;
              if (found === false) return false;
              return !list(found.eventIds).some((id) => benignIds().includes(id)) && !list(found.recipientIds).some((id) => !primaryRecipients().has(id));
            },
            given: (result) => {
              const found = incident(result);
              if (!found) return found === false ? 'No incident record saved' : null;
              const noiseIn = (item) => [...list(item.eventIds).filter((id) => benignIds().includes(id)), ...list(item.recipientIds).filter((id) => !primaryRecipients().has(id))];
              const noise = noiseIn(found);
              // The score reads only the first incident; say so when another one holds the lookalike.
              const others = incidents(result).slice(1).filter((item) => noiseIn(item).length).map((item) => `${item.incidentId} (not scored) holds ${noiseIn(item).join(', ')}`);
              return [noise.length ? `${found.incidentId} includes ${noise.join(', ')}` : `${found.incidentId} holds only the real chain`, ...others].join('; ');
            },
            fix: (result) => {
              const found = incident(result);
              if (!found) return 'Save an incident record that holds only the real chain, and leave the benign lookalike and the recipients who never received the message out of it.';
              const events = list(found.eventIds).filter((id) => benignIds().includes(id));
              const people = list(found.recipientIds).filter((id) => !primaryRecipients().has(id));
              const lookalike = (allEvents().find((item) => item.benignLookalike) || {}).deviceId;
              const parts = [
                ...(events.length ? [`${events.join(' and ')} (${lookalike}’s normal payroll lookup, a benign lookalike)`] : []),
                ...(people.length ? [`${people.join(' and ')}, who did not open or click the message`] : []),
              ];
              return `Your incident ${found.incidentId} includes ${parts.join(', and ')}. Take ${events.length + people.length === 1 ? 'it' : 'them'} out so the incident only holds the real chain.`;
            },
          },
        ], 'noise-rejection', 'System score for keeping benign activity out of scope', 'Rule out the benign lookalike and keep it out of the incident record.'),
      },
      {
        id: 'incident',
        title: 'Incident record & evidence',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('incident-evidence')(result)]];
          const all = incidents(result);
          if (!all.length) return [['Incident record', 'No incident record saved']];
          return [
            ...(all.length > 1 ? [['Incident records saved', `${all.length}; the automatic score reads the first (${all[0].incidentId}), all are shown below`]] : []),
            ...all.flatMap((found) => [
              ['Incident', `${found.incidentId} · ${found.title || 'Untitled'}`],
              ['Assessment status', assessmentLabel(found)],
              ['Recipient scope', list(found.recipientIds).length ? list(found.recipientIds) : 'None'],
              ['Device scope', list(found.deviceIds).length ? list(found.deviceIds) : 'None'],
              ['Linked evidence', describeAll(found.eventIds)],
            ]),
          ];
        },
        response: (result) => (incidents(result) || []).map((found) => ({ label: `Analyst summary (${found.incidentId}) · student response`, text: found.summary || '' })),
        checks: withScore([
          {
            label: () => `Incident record includes every confirmed step’s evidence (${chainRecords().map((item) => item.evidence).join(', ')})`,
            test: (result) => {
              const found = incident(result);
              if (found === null) return null;
              return Boolean(found) && confirmedSteps().length > 0 && confirmedSteps().every((step) => list(found.eventIds).includes(step.evidence));
            },
            given: (result) => { const found = incident(result); return found ? `${found.incidentId} links ${list(found.eventIds).join(', ') || 'no records'}` : found === false ? 'No incident record saved' : null; },
            fix: (result) => {
              const found = incident(result);
              const missing = chainRecords().map((item) => item.evidence).filter((id) => !found || !list(found.eventIds).includes(id));
              return `Attach ${missing.join(', ')} to ${found ? `incident ${found.incidentId}` : 'an incident record'} so it carries the whole confirmed chain: the click, the DNS lookup and the encrypted session.`;
            },
          },
          {
            label: 'Evidence the student kept in the tray ties into the incident record',
            test: (result) => {
              const found = incident(result);
              const kept = finalIds(result);
              if (found === null || kept === null) return null;
              if (!found) return false;
              return kept.some((id) => list(found.eventIds).includes(id)) ? true : everAdded(result).some((id) => list(found.eventIds).includes(id)) ? 'partial' : false;
            },
            fix: 'Keep the records you link to the incident in your evidence tray too, with a short reason for each.',
            fixPartial: (result) => {
              const found = incident(result);
              const removed = found ? removedLater(result).filter((id) => list(found.eventIds).includes(id)) : [];
              return removed.length
                ? `You linked ${removed.join(', ')} to ${found.incidentId} but removed ${removed.length === 1 ? 'it' : 'them'} from your evidence tray before submitting. Keep ${removed.length === 1 ? 'it' : 'them'} in the tray so the incident rests on preserved evidence.`
                : 'Keep the records you link to the incident in your evidence tray too, with a short reason for each.';
            },
          },
        ], 'incident-evidence', 'System score for the evidence-linked incident record', 'Save an incident record that attaches the confirmed chain and the evidence you preserved.'),
      },
      {
        id: 'unknowns',
        title: 'What is still unknown',
        recordedSince: SINCE,
        answer: (result) => {
          const all = incidents(result);
          if (all === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('unknown-boundaries')(result)]];
          if (!all.length) return [['Assessment status on the incident', 'No incident record saved']];
          return all.map((found) => [`Assessment status on ${found.incidentId}`, assessmentLabel(found)]);
        },
        checks: [
          {
            label: () => `Marked the incident’s assessment “${ASSESSMENT.unknown}”, or said in the summary that it is not established`,
            when: (result) => work(result) !== null,
            test: (result) => {
              const found = incident(result);
              if (found === null) return null;
              return Boolean(found) && (found.assessment === 'unknown' || /\bunknown\b|\bunverified\b|\bnot established\b|\bnot confirmed\b/i.test(found.summary || ''));
            },
            given: (result) => { const found = incident(result); return found ? assessmentLabel(found) : found === false ? 'No incident record saved' : null; },
            fix: (result) => {
              const found = incident(result);
              const open = chain().filter((step) => step.status === 'unverified').map((step) => String(step.step).replace(/_/g, ' ')).join(' or ');
              return found
                ? `You set ${found.incidentId} to “${assessmentLabel(found)}”. Set it to “${ASSESSMENT.unknown}”, or say in the summary that it is not established: the records do not show ${open}.`
                : `Save an incident record with the assessment “${ASSESSMENT.unknown}”: the records do not show ${open}.`;
            },
          },
          {
            label: 'Did not state endpoint execution or credential compromise as confirmed',
            expected: 'Unknowns kept as unknowns',
            test: criterionTest('unknown-boundaries'),
            given: criterionGiven('unknown-boundaries'),
            fix: 'Keep both questions open: say the data does not show the file running or the password being entered. Do not write that either is confirmed.',
          },
          {
            label: 'No unsupported claim stated as confirmed (the scorer caps the score at 69 when there is one)',
            test: (result) => (Array.isArray(result.critical_errors) ? result.critical_errors.length === 0 : null),
            given: (result) => (Array.isArray(result.critical_errors) && result.critical_errors.length ? result.critical_errors.join(' ') : 'None flagged'),
            fix: 'Rewrite the claim as what the records show, not what you suspect: for example “the device contacted the link domain”, not “the payload executed”.',
          },
        ],
      },
    ];
  }

  AdminSubmissionSheet.register(['lab-email-triage', 'lab-network-investigation', 'lab-network-email-independent'], {
    title: 'Module 07 · PROVE IT — QR Invoice Email & Network Investigation',
    fixture,
    caseId: (result) => {
      const r = record(result);
      return [(r && r.caseId) || G.caseId() || 'CASE-070731', G.incidentId() || 'INC-071042'].join(' · ');
    },
    freeText: (result) => {
      const r = record(result) || {};
      return [r.notes, ...(incidents(result) || []).map((found) => found.summary || '')];
    },
    rubric: { criticalLabels: {} },
    sections: [...ticketSections(), ...investigationSections()],
  });
})();

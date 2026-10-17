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
 *     (line 49: severity critical, disposition true-positive, route tier2-soc-net)
 *     and is only used by moduleSevenProveItPerformance(), which the submit does
 *     not call, so the ticket fields are NOT part of the submitted score.
 *     That key and the module's comments describe a different scenario (GRE
 *     tunnel / web shell / FTP exfiltration) than the QR-invoice fixture, so
 *     severity, disposition and route are advisory here; the entity roster
 *     (acct-63 / ws-517) does match the fixture and stays required.
 *
 * Saved payload: result.breakdown (scorer criterion list), result.review_payload,
 * result.case_record (the ITSM ticket), result.case_display, result.critical_errors
 * and from 2026-10-17 result.assessment_work (review notes, pivots, evidence
 * actions, scope and incident record; see moduleSevenAssessmentWork()).
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
  // Department fit below 40 is "returned" (same threshold as the ticket key, soc-analyst-module-07.js:466-469).
  const BOUNCE_BELOW = 40;

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
  const addedEvidence = (result) => (workList(result, 'evidenceChanges') === null ? null : workList(result, 'evidenceChanges').filter((item) => item.operation === 'add').map((item) => item.eventId));
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
    const added = addedEvidence(result);
    if (reviewed === null) return null;
    const pivots = workList(result, 'pivots');
    return reviewed.includes(step.evidence) || added.includes(step.evidence)
      || allEvents().some((candidate) => validPivot(pivots, candidate.id, step.evidence));
  };
  const incident = (result) => { const links = workList(result, 'incidentLinks'); return links === null ? null : (links[0] || false); };
  const benignIds = () => allEvents().filter((item) => item.benignLookalike === true).map((item) => item.id);
  const primaryRecipients = () => new Set(confirmedSteps().flatMap((step) => list(step.recipientIds)));
  const deliveredRecord = () => {
    const step = chain().find((item) => item.step === 'message_delivery' && item.status === 'confirmed');
    return list(scenario().deliveryEvents).find((item) => step && item.recipientId === list(step.recipientIds)[0] && item.status === 'delivered') || null;
  };
  const blockedRecord = () => list(scenario().deliveryEvents).find((item) => item.status === 'blocked_at_gateway') || null;
  const ASSESSMENT = { supported: 'Supported by the evidence (confirmed)', unknown: 'Unknown / not yet verified' };

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
          fix: 'Keep the case In Progress. The endpoint and credential questions are still open, so it is not resolved.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        required: false,
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: () => `Severity set to ${severityLabel(key().severity)} (module answer key; advisory)`,
          expected: () => severityLabel(key().severity),
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === key().severity),
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: () => `Set Severity to ${severityLabel(key().severity)}, as the module’s answer key records, or explain in your notes why a different level fits the evidence.`,
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
              ? () => `Put ${principal('users')} in Affected user: that account received the invoice email, opened it and clicked the link.`
              : () => `Put ${principal('devices')} in Affected device: the DNS lookup and encrypted session to the link domain came from that workstation.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, name)} was only blocked at the gateway and never received the message. Name ${principal('users')}, who received and clicked it.`
              : (result) => `${field(result, name)} is not where the link was opened. Name ${principal('devices')}.`,
          }],
        };
      }),
      {
        id: 'disposition',
        title: 'Disposition',
        required: false,
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: () => `Marked as ${String(dispositionLabel(key().disposition)).toLowerCase()} (true positive; module answer key, advisory)`,
          expected: () => dispositionLabel(key().disposition),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === key().disposition),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: () => `Record the disposition as ${dispositionLabel(key().disposition)}: the email failed authentication, was delivered, and was opened and clicked, then the device contacted the link domain.`,
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
          fix: 'Set Escalation to Required. Checking the endpoint and the account for compromise is beyond an analyst’s authority.',
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
          label: () => `Routed to the team that owns the response (${(bestDepartment() || {}).text}; module answer key, advisory)`,
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
            return chosen && chosen.bounce ? chosen.bounce : `Route the case to ${(bestDepartment() || {}).text}.`;
          },
          fixPartial: (result) => `${(department(field(result, 'escalateTo')) || {}).note} Route to ${(bestDepartment() || {}).text} next time.`,
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
          fix: (missing) => `Back your conclusion with the evidence: your note does not mention ${missing.join('; ')}. Say what each record showed.`,
        },
      },
    ];
  }

  function investigationSections() {
    return [
      {
        id: 'review-notes',
        title: 'Records reviewed & analyst notes',
        required: false,
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
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('delivery-scope')(result)]];
          const scope = w.scope || {};
          return [
            ['Recipients the student scoped in', list(scope.recipientIds).length ? list(scope.recipientIds) : 'None'],
            ['Devices the student scoped in', list(scope.deviceIds).length ? list(scope.deviceIds) : 'None'],
            ['Delivery records preserved as evidence', describeAll(addedEvidence(result).filter((id) => ['delivered', 'blocked_at_gateway'].includes((eventById(id) || {}).status)))],
          ];
        },
        checks: withScore([
          {
            label: () => `Preserved the record showing the message was delivered to ${(deliveredRecord() || {}).recipientId}`,
            test: (result) => { const added = addedEvidence(result); return added === null ? null : added.includes((deliveredRecord() || {}).id); },
            fix: () => `Add the delivery record for ${(deliveredRecord() || {}).recipientId} (${(deliveredRecord() || {}).id}) to your evidence: it proves the message arrived.`,
          },
          {
            label: () => `Preserved the record showing the copy for ${(blockedRecord() || {}).recipientId} was blocked at the gateway`,
            test: (result) => { const added = addedEvidence(result); return added === null ? null : added.includes((blockedRecord() || {}).id); },
            fix: () => `Add the gateway-block record for ${(blockedRecord() || {}).recipientId} (${(blockedRecord() || {}).id}) as well, so the incident only covers who actually received the message.`,
          },
        ], 'delivery-scope', 'System score for delivered versus blocked recipients', 'Preserve both the delivered record and the gateway-blocked record as evidence.'),
      },
      {
        id: 'chain',
        title: 'Message-to-network chain',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('confirmed-chain')(result)]];
          return [
            ['Pivots followed (from record → to record)', list(w.pivots).length ? list(w.pivots).map((item) => `${describe(item.fromEventId)}  →  ${describe(item.toEventId)}`) : 'None followed'],
            ['Evidence preserved', describeAll(addedEvidence(result))],
          ];
        },
        // One line per distinct confirmed-step record (message delivery and recipient
        // open share one record). Slots are fixed so the sheet does not depend on
        // load order; unused slots are skipped with `when`.
        checks: withScore(Array.from({ length: 6 }, (_, index) => ({
          when: () => chainRecords()[index] !== undefined,
          label: () => `Examined the record showing: ${chainRecords()[index].labels.join(' and ')} (${chainRecords()[index].evidence})`,
          test: (result) => stepCovered(result, chainRecords()[index]),
          fix: () => `Open and preserve ${chainRecords()[index].evidence} (${chainRecords()[index].labels.join(' and ')}), or reach it by pivoting from a related record.`,
        })), 'confirmed-chain', 'System score for correlating the message with DNS and TLS evidence', 'Follow the chain from the click to the DNS lookup to the encrypted session, and preserve each record.'),
      },
      {
        id: 'noise',
        title: 'Benign lookalike ruled out',
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
            fix: 'Take the benign lookalike records and any recipient who never received the message out of the incident, so it only holds the real chain.',
          },
        ], 'noise-rejection', 'System score for keeping benign activity out of scope', 'Rule out the benign lookalike and keep it out of the incident record.'),
      },
      {
        id: 'incident',
        title: 'Incident record & evidence',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('incident-evidence')(result)]];
          const found = incident(result);
          if (!found) return [['Incident record', 'No incident record saved']];
          return [
            ['Incident', `${found.incidentId} · ${found.title || 'Untitled'}`],
            ['Student’s assessment', ASSESSMENT[found.assessment] || found.assessment || '—'],
            ['Recipients', list(found.recipientIds)],
            ['Devices', list(found.deviceIds)],
            ['Records attached', describeAll(found.eventIds)],
          ];
        },
        response: (result) => {
          const found = incident(result);
          const reasons = (workList(result, 'evidenceChanges') || []).filter((item) => item.operation === 'add' && item.reason)
            .map((item) => ({ label: `Why ${item.eventId} was preserved · student response`, text: item.reason }));
          return [...(found ? [{ label: 'Incident summary · student response', text: found.summary || '' }] : []), ...reasons];
        },
        checks: withScore([
          {
            label: () => `Incident record includes every confirmed step’s evidence (${chainRecords().map((item) => item.evidence).join(', ')})`,
            test: (result) => {
              const found = incident(result);
              if (found === null) return null;
              return Boolean(found) && confirmedSteps().length > 0 && confirmedSteps().every((step) => list(found.eventIds).includes(step.evidence));
            },
            fix: () => `Attach ${chainRecords().map((item) => item.evidence).join(', ')} to the incident so it carries the whole confirmed chain.`,
          },
          {
            label: 'Evidence the student preserved ties into the incident record',
            test: (result) => {
              const found = incident(result);
              const added = addedEvidence(result);
              if (found === null || added === null) return null;
              return Boolean(found) && added.some((id) => list(found.eventIds).includes(id));
            },
            fix: 'Preserve the records you attach to the incident, with a short reason for each.',
          },
        ], 'incident-evidence', 'System score for the evidence-linked incident record', 'Save an incident record that attaches the confirmed chain and the evidence you preserved.'),
      },
      {
        id: 'unknowns',
        title: 'What is still unknown',
        answer: (result) => {
          const found = incident(result);
          if (found === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('unknown-boundaries')(result)]];
          return [['Student’s assessment on the incident', found ? (ASSESSMENT[found.assessment] || found.assessment || '—') : 'No incident record saved']];
        },
        checks: [
          {
            label: 'Marked the incident’s assessment Unknown, or said in the summary that it is not established',
            when: (result) => work(result) !== null,
            test: (result) => {
              const found = incident(result);
              if (found === null) return null;
              return Boolean(found) && (found.assessment === 'unknown' || /\bunknown\b|\bunverified\b|\bnot established\b|\bnot confirmed\b/i.test(found.summary || ''));
            },
            fix: () => `Mark the assessment Unknown: the records do not show ${chain().filter((step) => step.status === 'unverified').map((step) => String(step.step).replace(/_/g, ' ')).join(' or ')}.`,
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
      const found = incident(result);
      return [r.notes, found ? found.summary : ''];
    },
    rubric: { criticalLabels: {} },
    sections: [...ticketSections(), ...investigationSections()],
  });
})();

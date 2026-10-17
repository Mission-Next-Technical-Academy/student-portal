/* Submission Sheet — Module 08 Prove It, CASE-080842: vulnerability
 * prioritization (current Apache finding on web-dmz-14 versus a stale OpenSSL
 * finding and a not-applicable SMBv1 finding). Lab keys 'lab-vuln-prioritization'
 * and 'lab-vuln-queue': one submit (moduleEightFinalizeProveIt) writes the SAME
 * result to both rows, so the sheet renders once from item.lead.
 *
 * Answer keys (read at render time, never re-typed):
 *   - findings, evidence, assets, routes, incident, risk disposition and the
 *     expected priority/owner: SocM08AssessmentData.scenario
 *     (portal/soc-m08-assessment-data.js — findings[].applicability/freshness,
 *     findingEvidence[].kind, assetEvidence[].kind, escalationRoutes, incidents,
 *     riskAcceptanceDispositions, expectedPriority);
 *   - scoring: SocM08AssessmentRubric.extract / SocM08AssessmentScorer.CRITERIA
 *     (the submitted score and result.breakdown come from these). The rubric names
 *     F-001 = current and applicable, F-002 = stale/unverified, F-003 = not
 *     applicable (soc-m08-assessment-rubric.js:49-53); the sheet derives the same
 *     roles from each finding's applicability status in the fixture;
 *   - ticket options, entity tiers, department fit: MODULE_EIGHT_* in
 *     portal/soc-analyst-module-08.js. Severity comes from expectedPriority.priority;
 *     disposition and route from MODULE_EIGHT_ANSWER_KEY (line 49). Those are only
 *     used by moduleEightProveItPerformance(), which the submit does not call, so
 *     the ticket fields are NOT part of the submitted score (the sheet still checks
 *     them; the key agrees with the fixture: web-dmz-14 / p.diallo, critical).
 *
 * Saved payload: result.breakdown (scorer criterion list), result.review_payload,
 * result.case_record, result.case_display, result.critical_errors and from
 * 2026-10-17 result.assessment_work (finding reviews, incident link, risk
 * acceptance, escalation, remediation decision and transitions).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const fixture = () => (typeof SocM08AssessmentData !== 'undefined' ? SocM08AssessmentData : null);
  const scenario = () => (fixture() && fixture().scenario) || null;
  const list = (value) => (Array.isArray(value) ? value : []);
  const G = {
    roster: () => (typeof MODULE_EIGHT_ENTITY_ROSTER !== 'undefined' ? MODULE_EIGHT_ENTITY_ROSTER : null),
    departments: () => (typeof MODULE_EIGHT_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_EIGHT_DEPARTMENT_OPTIONS : null),
    dispositionOptions: () => (typeof MODULE_EIGHT_DISPOSITION_OPTIONS !== 'undefined' ? MODULE_EIGHT_DISPOSITION_OPTIONS : null),
    key: () => (typeof MODULE_EIGHT_ANSWER_KEY !== 'undefined' ? MODULE_EIGHT_ANSWER_KEY : null),
    caseId: () => (typeof MODULE_EIGHT_CASE_ID !== 'undefined' ? MODULE_EIGHT_CASE_ID : null),
    statuses: () => (typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : null),
    severities: () => (typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : null),
    escalations: () => (typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : null),
    dispositionLabels: () => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' ? CASE_RECORD_DISPOSITION_LABELS : null),
  };
  const roster = () => G.roster() || { users: [], devices: [] };
  const departments = () => G.departments() || [];
  const key = () => G.key() || {};
  const expected = () => (scenario() && scenario().expectedPriority) || {};
  // Department fit below 40 is "returned" (ticket key, soc-analyst-module-08.js:505-507).
  const BOUNCE_BELOW = 40;

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, name) => { const r = record(result); return r ? (typeof r[name] === 'string' ? r[name] : '') : null; };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const optionText = (options, id) => ((options || []).find((option) => option.id === id) || {}).text || '';
  const severityLabel = (id) => optionText(G.severities(), id) || id;
  const statusLabel = (id) => optionText(G.statuses(), id) || id;
  const escalationLabel = (id) => optionText(G.escalations(), id) || id;
  const dispositionLabel = (id) => (G.dispositionLabels() || {})[id] || optionText(G.dispositionOptions(), id) || id;
  const department = (id) => departments().find((option) => option.id === id) || null;
  const bestDepartment = () => departments().slice().sort((a, b) => b.fit - a.fit)[0] || null;
  const tierOf = (kind, id) => ((roster()[kind] || []).find((entry) => entry.id === id) || {}).tier || '';
  const principal = (kind) => ((roster()[kind] || []).find((entry) => entry.tier === 'principal') || {}).id || '';
  const shown = (ctx, label, fallback) => { const value = ctx.display(label); return value !== null ? value : fallback; };
  const blankAs = (value) => (value === null ? null : value || 'Left blank');

  const work = (result) => (result.assessment_work && typeof result.assessment_work === 'object' ? result.assessment_work : null);
  const workList = (result, name) => (work(result) ? list(work(result)[name]) : null);

  // ----- fixture lookups
  const findings = () => list(scenario() && scenario().findings);
  const finding = (id) => findings().find((item) => item.id === id) || null;
  // The three findings the case is about (the rest are unrelated background rows).
  const caseFindings = () => findings().filter((item) => !item.classification);
  const roleFinding = (status) => caseFindings().find((item) => (item.applicability && item.applicability.status) === status) || null;
  const current = () => roleFinding('confirmed');
  const stale = () => roleFinding('unverified');
  const irrelevant = () => roleFinding('not-applicable');
  const findingLabel = (item) => (item ? `${item.cve} ${item.product} on ${item.assetId}` : '');
  const evidenceKinds = ['findingEvidence', 'assetEvidence', 'incidentEvidence', 'riskAcceptanceEvidence'];
  const evidenceRecord = (id) => { for (const name of evidenceKinds) { const found = list(scenario() && scenario()[name]).find((item) => item.id === id); if (found) return found; } return null; };
  const KIND_LABEL = {
    'scanner-observation': 'Scanner result', 'version-applicability': 'Installed version confirmed', 'exploitability-advisory': 'Exploit advisory',
    'applicability-check': 'Applicability check', 'business-criticality': 'Business importance', reachability: 'Network reachability',
    exposure: 'Exposure', 'compensating-control': 'Compensating control', 'incident-triage': 'Incident triage', 'approved-temporary-exception': 'Approved temporary exception',
  };
  const describeEvidence = (id) => { const item = evidenceRecord(id); return item ? `${id} · ${KIND_LABEL[item.kind] || item.kind} · ${item.detail}` : String(id); };
  const describeAll = (ids) => list(ids).map(describeEvidence);
  const REVIEW_STATUS = { reviewed: 'Reviewed — current and applicable', 'needs-validation': 'Needs validation (stale or unverified)', 'not-applicable': 'Not applicable' };
  const WORK_STATUS = { open: 'Open', 'in-progress': 'In progress', 'accepted-risk': 'Accepted risk', resolved: 'Resolved' };
  const cap = (text) => String(text || '').replace(/^\w/, (letter) => letter.toUpperCase());
  const routeLabel = (id) => ((list(scenario() && scenario().escalationRoutes).find((item) => item.id === id)) || {}).label || id;
  const expectedStatusFor = { confirmed: 'reviewed', unverified: 'needs-validation', 'not-applicable': 'not-applicable' };

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
    return item ? describeAll(list(item.supportingEvidence).filter((entry) => evidenceRecord(entry))) : null;
  };
  // Detail lines carry the specific red-pen notes; each system-score line shows only
  // when the details cannot explain a short score (or the attempt predates
  // assessment_work). A missing detail reads ◐ (not ✗) when the scorer gave half
  // credit, so partial credit never blocks a pass.
  const withScores = (details, scores) => {
    const partialAnywhere = (result) => scores.some((entry) => criterionTest(entry.id)(result) === 'partial');
    const detailFails = (result, ctx) => details.some((check) => {
      if (check.when !== undefined && !check.when(result, ctx)) return false;
      const value = check.test(result, ctx);
      return value === false || value === 'partial';
    });
    return [
      ...details.map((check) => ({
        ...check,
        when: (result, ctx) => work(result) !== null && (check.when === undefined || check.when(result, ctx)),
        test: (result, ctx) => {
          const value = check.test(result, ctx);
          return value === false && partialAnywhere(result) ? 'partial' : value;
        },
      })),
      ...scores.map((entry) => ({
        label: entry.label,
        when: (result, ctx) => !detailFails(result, ctx),
        test: criterionTest(entry.id),
        given: criterionGiven(entry.id),
        fix: entry.fix,
      })),
    ];
  };

  // ----- readings of the saved work
  const reviews = (result) => workList(result, 'findingReviews');
  const reviewFor = (result, item) => (reviews(result) === null || !item ? null : reviews(result).find((entry) => entry.findingId === item.id) || false);
  const kindsOf = (ids) => list(ids).map((id) => (evidenceRecord(id) || {}).kind);
  // Same evidence expectations as the rubric (soc-m08-assessment-rubric.js:60-71).
  const reviewTest = (pick, status, needs) => (result) => {
    const item = pick();
    const found = reviewFor(result, item);
    if (found === null) return null;
    if (!found || found.status !== status) return false;
    const kinds = kindsOf(found.evidenceIds);
    return needs(kinds, item) ? true : 'partial';
  };
  const staleBeforeWindow = (result, item) => {
    const found = reviewFor(result, item);
    return Boolean(found) && list(found.evidenceIds).some((id) => { const e = evidenceRecord(id); return e && e.kind === 'scanner-observation' && e.observedAt < scenario().start; });
  };
  const decisionFor = (result) => {
    const decisions = workList(result, 'remediationDecisions');
    if (decisions === null) return null;
    return decisions.slice().reverse().find((item) => item.findingId === (current() || {}).id) || false;
  };
  const decisionAssetKinds = (decision) => new Set(list(decision && decision.evidenceIds).map((id) => (evidenceRecord(id) || {}).kind));
  const expectedIncident = () => list(scenario() && scenario().incidents).find((item) => list(item.findingIds).includes((current() || {}).id)) || {};

  // ----- key-evidence pieces for the ticket work note
  function notePieces() {
    const now = current() || {};
    const old = stale() || {};
    const no = irrelevant() || {};
    const planned = list(scenario() && scenario().patchRecords).find((item) => item.assetId === now.assetId) || {};
    return [
      { name: `the exploitable asset (${expected().assetId})`, short: expected().assetId, terms: [expected().assetId] },
      { name: `the vulnerability (${now.cve}, ${now.product})`, short: now.cve, terms: [now.cve, now.product] },
      { name: `its owner (${expected().ownerId})`, short: expected().ownerId, terms: [expected().ownerId] },
      { name: 'why it is urgent: exposed to the internet and important to the business', short: 'why it is urgent (internet exposure, business importance)', terms: ['internet', 'public', 'exposed', 'reachable', 'customer-facing', 'customer facing', 'dmz', 'payment', 'authentication'] },
      { name: `the stale finding that needs validation (${old.cve} on ${old.assetId})`, short: `${old.cve} / ${old.assetId}`, terms: [old.cve, old.assetId, 'stale', 'unverified', 'needs validation', 'not yet verified'] },
      { name: `the finding that does not apply (${no.cve}, ${no.product})`, short: `${no.cve} / ${no.product}`, terms: [no.cve, no.product, 'smb', 'not applicable', 'does not apply'] },
      { name: `the priority and that it is not CVSS alone (${cap(expected().priority)})`, short: `the ${expected().priority} priority`, terms: [expected().priority, 'not cvss alone', 'not just cvss', 'context', 'beyond cvss'] },
      { name: `that the planned patch is not yet applied (${planned.changeId})`, short: 'that the planned patch is not applied yet', terms: [planned.changeId, 'not applied', 'not yet applied', 'planned', 'scheduled', 'approved but', 'still installed'] },
      { name: 'the owner and due date for remediation', short: 'the owner and due date', terms: ['due', 'owner', 'by ', 'deadline', 'escalat', 'patch'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  function ticketSections() {
    return [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Case', shown(ctx, 'Case', G.caseId() || 'CASE-080842')],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', statusLabel(field(result, 'status'))) : null)],
          ...(ctx.rows.length > 1 ? [['Stored as', `${ctx.rows.length} lab records with identical answers (one submit writes them all); this sheet shows the submission once`]] : []),
        ],
        checks: [{
          label: 'Case left open while remediation is under way (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: the Prove It scorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => statusLabel(field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The patch has not been applied yet, so it is not resolved.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: () => `Severity set to ${severityLabel(expected().priority)}`,
          expected: () => severityLabel(expected().priority),
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === expected().priority),
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: () => `Set Severity to ${severityLabel(expected().priority)}. ${expected().assetId} is internet-facing, business-critical and has a public exploit, so context outranks the raw score.`,
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
            label: () => (kind === 'users' ? `Names the owner of the exploitable asset (${principal('users')})` : `Names the exploitable, internet-facing server (${principal('devices')})`),
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
              ? () => `Put ${principal('users')} in Affected user: that person owns ${principal('devices')}, the server with the confirmed, exploitable finding.`
              : () => `Put ${principal('devices')} in Affected device: it runs the confirmed Apache version and faces the internet.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, name)} owns a related system, but ${principal('users')} owns the confirmed finding. Name ${principal('users')}.`
              : (result) => `${field(result, name)} is related, but the confirmed finding is on ${principal('devices')}. Name ${principal('devices')}.`,
          }],
        };
      }),
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: () => `Marked as: ${dispositionLabel(key().disposition)}`,
          expected: () => dispositionLabel(key().disposition),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === key().disposition),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: () => `Record the disposition as “${dispositionLabel(key().disposition)}”: the scan and package inventory confirm the version and the server is reachable from the internet.`,
        }],
      },
      {
        id: 'escalation',
        title: 'Escalation & route',
        answer: (result, ctx) => {
          if (!record(result)) return [['Escalation required', null], ['Route to department', null]];
          const escalation = field(result, 'escalation');
          return [
            ['Escalation required', blankAs(shown(ctx, 'Escalation required', escalationLabel(escalation)))],
            ['Route to department', escalation === 'required' ? blankAs(shown(ctx, 'Route to department', (department(field(result, 'escalateTo')) || {}).text || field(result, 'escalateTo'))) : 'Not applicable'],
          ];
        },
        checks: [
          {
            label: 'Escalation marked as Required',
            expected: 'Required',
            test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
            given: (result) => escalationLabel(field(result, 'escalation')) || 'Left blank',
            fix: 'Set Escalation to Required. Applying the patch is another team’s job, so the case must be handed over.',
          },
          {
            label: () => `Routed to the team that applies patches (${(bestDepartment() || {}).text})`,
            expected: () => (bestDepartment() || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            // Same fit rule as the ticket key: fit 100 full, ≥ 40 partial, below = returned.
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
          },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? field(result, 'notes') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: 80, // CASE_RECORD_NOTES_MIN (case-record.js): moduleEightProveItSpec() sets no notesMin
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: which findings are current, what is reachable, the priority and why, the owner and due date, and any accepted risk.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result) => (record(result) ? field(result, 'notes') : null),
          pieces: () => notePieces(),
          fix: (missing) => `Back your priority with the evidence: your note does not mention ${missing.join('; ')}. Say what each record showed.`,
        },
      },
    ];
  }

  function workSections() {
    const reviewAnswer = (result) => {
      const w = work(result);
      if (!w) return [['Student’s work in this section', null], ['Events credited by the scorer', ['audited-finding-review', 'freshness-applicability', 'uncertainty-boundary'].flatMap((id) => credited(id)(result) || [])]];
      return caseFindings().map((item) => {
        const found = reviewFor(result, item);
        return [findingLabel(item), found ? `${REVIEW_STATUS[found.status] || found.status} · evidence: ${list(found.evidenceIds).join(', ')}` : 'Not reviewed'];
      });
    };
    return [
      {
        id: 'finding-review',
        title: 'Finding review: current, stale, not applicable',
        answer: reviewAnswer,
        response: (result) => (reviews(result) || []).filter((item) => item.notes).map((item) => ({ label: `Review note on ${findingLabel(finding(item.findingId))} · student response`, text: item.notes })),
        checks: withScores([
          {
            label: () => `Marked ${findingLabel(current())} as: ${REVIEW_STATUS[expectedStatusFor.confirmed]}, citing the installed-version check`,
            test: reviewTest(current, expectedStatusFor.confirmed, (kinds) => kinds.includes('version-applicability')),
            given: (result) => { const found = reviewFor(result, current()); return found ? REVIEW_STATUS[found.status] : 'Not reviewed'; },
            fix: () => `Mark ${current().cve} on ${current().assetId} as reviewed and applicable, and cite the package inventory that confirms the affected version.`,
          },
          {
            label: () => `Marked ${findingLabel(stale())} as: ${REVIEW_STATUS[expectedStatusFor.unverified]}, citing the old scan and the missing applicability check`,
            test: reviewTest(stale, expectedStatusFor.unverified, (kinds, item) => kinds.includes('applicability-check') && kinds.includes('scanner-observation')),
            given: (result) => { const found = reviewFor(result, stale()); return found ? REVIEW_STATUS[found.status] : 'Not reviewed'; },
            fix: () => `Mark ${stale().cve} on ${stale().assetId} as needing validation: the scan is from before this review window and nobody has confirmed the version since. Cite the old scan and the pending check.`,
          },
          {
            label: () => `Marked ${findingLabel(irrelevant())} as: ${REVIEW_STATUS[expectedStatusFor['not-applicable']]}, citing the applicability check`,
            test: reviewTest(irrelevant, expectedStatusFor['not-applicable'], (kinds) => kinds.includes('applicability-check')),
            given: (result) => { const found = reviewFor(result, irrelevant()); return found ? REVIEW_STATUS[found.status] : 'Not reviewed'; },
            fix: () => `Mark ${irrelevant().cve} (${irrelevant().product}) as not applicable and cite the check showing it does not apply to ${irrelevant().assetId}.`,
          },
          {
            label: 'Did not mark the stale or not-applicable findings as confirmed',
            test: (result) => {
              if (reviews(result) === null) return null;
              return ![stale(), irrelevant()].some((item) => { const found = reviewFor(result, item); return found && found.status === 'reviewed'; });
            },
            fix: 'Do not confirm a finding you could not validate. Stale or not-applicable findings stay open or are excluded, not marked reviewed.',
          },
        ], [
          { id: 'audited-finding-review', label: 'System score for reviewing the three findings', fix: 'Review all three findings with evidence: the current one, the stale one and the one that does not apply.' },
          { id: 'freshness-applicability', label: 'System score for separating current, stale and not-applicable findings', fix: 'Separate what is current and applicable from what is stale, unverified or irrelevant, citing the evidence for each.' },
          { id: 'uncertainty-boundary', label: 'System score for keeping unverified findings unresolved', fix: 'Keep stale or unverified findings unresolved instead of asserting they apply.' },
        ]),
      },
      {
        id: 'asset-context',
        title: 'Asset context & controls',
        answer: (result) => {
          const decision = decisionFor(result);
          if (decision === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('asset-context-controls')(result)]];
          return [['Context evidence cited in the remediation decision', decision && list(decision.evidenceIds).length ? describeAll(decision.evidenceIds) : 'None cited']];
        },
        checks: withScores([
          ['business-criticality', 'how important the server is to the business'],
          ['reachability', 'whether it can be reached from the internet'],
          ['exposure', 'what is exposed (services and ports)'],
          ['compensating-control', 'which controls reduce the risk (for example the firewall) and how far they help'],
        ].map(([kind, words]) => ({
          label: `Cited evidence on ${words}`,
          test: (result) => { const decision = decisionFor(result); return decision === null ? null : decisionAssetKinds(decision).has(kind); },
          fix: () => `Cite the ${(KIND_LABEL[kind] || kind).toLowerCase()} record for ${expected().assetId}: it shows ${words}.`,
        })), [{ id: 'asset-context-controls', label: 'System score for asset context and compensating controls', fix: 'Cite business importance, reachability, exposure and control evidence for the exploitable server in your remediation decision.' }]),
      },
      {
        id: 'incident-link',
        title: 'Incident link',
        answer: (result) => {
          const links = workList(result, 'incidentLinks');
          if (links === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('incident-link')(result)]];
          return links.length ? links.flatMap((item) => [['Incident', item.incidentId], ['Finding', findingLabel(finding(item.findingId))], ['Evidence', describeAll(item.evidenceIds)]]) : [['Incident link', 'None saved']];
        },
        response: (result) => (workList(result, 'incidentLinks') || []).map((item) => ({ label: 'Why the finding belongs to the incident · student response', text: item.rationale || '' })),
        checks: withScores([{
          label: () => `Linked ${findingLabel(current())} to ${expectedIncident().id} (${expectedIncident().title}) with incident evidence and a reason`,
          test: (result) => { const links = workList(result, 'incidentLinks'); return links === null ? null : links.some((item) => item.findingId === (current() || {}).id && item.incidentId === expectedIncident().id && list(item.evidenceIds).length > 0 && String(item.rationale || '').trim().length >= 10); },
          fix: () => `Link ${current().cve} on ${current().assetId} to ${expectedIncident().id}, cite the incident triage record, and say why in a sentence.`,
        }], [{ id: 'incident-link', label: 'System score for the evidence-linked incident', fix: 'Link the confirmed finding to its incident with the incident evidence and a rationale.' }]),
      },
      {
        id: 'risk-acceptance',
        title: 'Risk acceptance',
        answer: (result) => {
          const items = workList(result, 'riskAcceptances');
          if (items === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('risk-acceptance')(result)]];
          return items.length ? items.flatMap((item) => [['Finding', findingLabel(finding(item.findingId))], ['Evidence', describeAll(item.evidenceIds)]]) : [['Risk acceptance', 'None saved']];
        },
        response: (result) => (workList(result, 'riskAcceptances') || []).map((item) => ({ label: 'Reason for accepting the risk · student response', text: item.rationale || '' })),
        checks: withScores([{
          label: () => `Recorded the approved temporary exception only for ${findingLabel(stale())}, with its approval record`,
          test: (result) => {
            const items = workList(result, 'riskAcceptances');
            if (items === null) return null;
            const disposition = list(scenario().riskAcceptanceDispositions).find((item) => item.status === 'explicitly-supported') || {};
            return items.some((item) => item.findingId === disposition.findingId && item.dispositionId === disposition.id && list(item.evidenceIds).length > 0 && String(item.rationale || '').trim().length >= 10);
          },
          fix: () => `Record the risk acceptance for ${stale().cve} on ${stale().assetId}, cite the approved exception, and say it applies to that finding only.`,
        }], [{ id: 'risk-acceptance', label: 'System score for the finding-specific risk acceptance', fix: 'Preserve the explicitly approved risk acceptance, tied to its own finding and evidence.' }]),
      },
      {
        id: 'escalation-route',
        title: 'Escalation to an owner',
        answer: (result) => {
          const items = workList(result, 'escalations');
          if (items === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('escalation')(result)]];
          return items.length ? items.flatMap((item) => [['Finding', findingLabel(finding(item.findingId))], ['Routed to', routeLabel(item.routeId)], ['Owner', item.ownerId || '—'], ['Due date', item.dueDate || '—'], ['Evidence', describeAll(item.evidenceIds)]]) : [['Escalation', 'None saved']];
        },
        response: (result) => (workList(result, 'escalations') || []).map((item) => ({ label: 'Reason for the escalation · student response', text: item.rationale || '' })),
        checks: withScores([
          {
            label: () => `Escalated ${findingLabel(current())} to one of the valid routes (${list(scenario().escalationRoutes).map((item) => item.label).join(' or ')}), with an owner and due date`,
            test: (result) => {
              const items = workList(result, 'escalations');
              return items === null ? null : items.some((item) => item.findingId === (current() || {}).id && list(scenario().escalationRoutes).some((route) => route.id === item.routeId) && item.ownerId && item.dueDate);
            },
            fix: () => `Escalate ${current().cve} on ${current().assetId} to the security lead or the service owner, name the owner and set a due date.`,
          },
        ], [{ id: 'escalation', label: 'System score for the evidence-backed escalation', fix: 'Route the finding with evidence that fits the chosen route, an owner and a due date.' }]),
      },
      {
        id: 'remediation',
        title: 'Priority & remediation decision',
        answer: (result) => {
          const decision = decisionFor(result);
          if (decision === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('remediation-outcome')(result)]];
          if (!decision) return [['Remediation decision', 'None saved']];
          const transitions = workList(result, 'remediationTransitions').filter((item) => item.findingId === decision.findingId);
          return [
            ['Finding', findingLabel(finding(decision.findingId))],
            ['Priority the student set', cap(decision.priority)],
            ['Status', WORK_STATUS[decision.status] || decision.status],
            ['Owner and due date', `${decision.ownerId || '—'} · ${decision.dueDate || '—'}`],
            ['Evidence cited', describeAll(decision.evidenceIds)],
            ['Status changes', transitions.length ? transitions.map((item) => `${WORK_STATUS[item.fromStatus] || item.fromStatus} → ${WORK_STATUS[item.toStatus] || item.toStatus}`) : 'None'],
          ];
        },
        response: (result) => {
          const decision = decisionFor(result);
          if (!decision) return [];
          const transitions = workList(result, 'remediationTransitions').filter((item) => item.findingId === decision.findingId && item.transitionRationale);
          return [
            { label: 'Reason for the priority · student response', text: decision.rationale || '' },
            ...transitions.map((item) => ({ label: `Reason for moving to ${WORK_STATUS[item.toStatus] || item.toStatus} · student response`, text: item.transitionRationale })),
          ];
        },
        checks: withScores([
          {
            label: () => `Priority set to ${cap(expected().priority)} for ${findingLabel(current())}`,
            expected: () => cap(expected().priority),
            test: (result) => { const decision = decisionFor(result); return decision === null ? null : Boolean(decision) && decision.priority === expected().priority; },
            given: (result) => { const decision = decisionFor(result); return decision ? cap(decision.priority) : 'No decision saved'; },
            fix: () => `Set the priority to ${cap(expected().priority)}: it is internet-facing, business-critical and has a public exploit. CVSS alone (${((current() || {}).cvss || {}).baseScore}) does not decide it.`,
          },
          {
            label: 'Moved the decision beyond Open (for example In progress) with a reason',
            test: (result) => { const decision = decisionFor(result); return decision === null ? null : Boolean(decision) && (decision.status !== 'open' || workList(result, 'remediationTransitions').some((item) => item.findingId === decision.findingId)); },
            fix: 'Move the decision to In progress and say why, so the owner knows work has started.',
          },
        ], [{ id: 'remediation-outcome', label: 'System score for the evidence-backed priority and remediation', fix: 'Record a remediation decision with the right priority, supporting evidence and an owner.' }]),
      },
    ];
  }

  AdminSubmissionSheet.register(['lab-vuln-prioritization', 'lab-vuln-queue'], {
    title: 'Module 08 · PROVE IT — Vulnerability Prioritization',
    fixture,
    caseId: (result) => {
      const r = record(result);
      return (r && r.caseId) || G.caseId() || 'CASE-080842';
    },
    freeText: (result) => {
      const r = record(result) || {};
      return [r.notes];
    },
    rubric: { criticalLabels: {} },
    sections: [...ticketSections(), ...workSections()],
  });
})();

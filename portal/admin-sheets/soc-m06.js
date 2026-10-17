/* Submission Sheet — Module 06 Prove It, CASE-066318 "Independent Dormant Task
 * Backdoor Review" (no alert, one lead: the UpdateHealth scheduled task on
 * ws-318). Lab key 'lab-threat-hunt-independent'.
 *
 * Answer keys (read at render time, never re-typed):
 *   - hunt truth, events, lead, comparison host: SocM06AssessmentData.scenario
 *     (portal/soc-m06-assessment-data.js — seedLead, scope, telemetry,
 *     expectedTruth.supportedTechniques / unsupportedTechniques);
 *   - hunt scoring: SocM06AssessmentScorer.CRITERIA / SocM06AssessmentRubric.extract
 *     (the submitted score and result.breakdown come from these);
 *   - ticket options, entity tiers, department fit and the ticket key:
 *     MODULE_SIX_BACKDOOR_* in portal/soc-analyst-module-06.js. The ticket key
 *     lives only inside moduleSixBackdoorCaseScore() (severity 'high' line 698,
 *     disposition 'true-positive' line 701, findings lines 709-711, best
 *     department = highest `fit`, entity tiers principal/pivot). That function
 *     is not called by the submit, so the ticket fields are NOT part of the
 *     submitted score; the sheet still checks them against that key.
 *
 * Saved payload (moduleSix independent submit): result.breakdown = scorer
 * criterion list, result.review_payload = scorer result + caseId, result.case_record
 * = the ITSM ticket, result.case_display = ticket rows as the student saw them,
 * result.critical_errors, and from 2026-10-17 result.assessment_work (the
 * student's hypothesis, searches, pivots, evidence set, ATT&CK mappings, handoff
 * and conclusion; see moduleSixAssessmentWork()).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const fixture = () => (typeof SocM06AssessmentData !== 'undefined' ? SocM06AssessmentData : null);
  const scenario = () => (fixture() && fixture().scenario) || null;
  const truth = () => (scenario() && scenario().expectedTruth) || { supportedTechniques: [], unsupportedTechniques: [] };
  const events = () => (scenario() && scenario().telemetry) || [];
  const eventById = (id) => events().find((item) => item.id === id) || null;
  // Module constants (soc-analyst-module-06.js, case-record.js), read lazily so a
  // missing global degrades to "not recorded" instead of throwing.
  const G = {
    roster: () => (typeof MODULE_SIX_BACKDOOR_ENTITY_ROSTER !== 'undefined' ? MODULE_SIX_BACKDOOR_ENTITY_ROSTER : null),
    departments: () => (typeof MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_SIX_BACKDOOR_DEPARTMENT_OPTIONS : null),
    bounce: () => (typeof MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD !== 'undefined' ? MODULE_SIX_DEPARTMENT_BOUNCE_THRESHOLD : null),
    evidencePriority: () => (typeof MODULE_SIX_EVIDENCE_PRIORITY_FINDING_OPTIONS !== 'undefined' ? MODULE_SIX_EVIDENCE_PRIORITY_FINDING_OPTIONS : null),
    scopeAssessment: () => (typeof MODULE_SIX_SCOPE_ASSESSMENT_FINDING_OPTIONS !== 'undefined' ? MODULE_SIX_SCOPE_ASSESSMENT_FINDING_OPTIONS : null),
    responseAction: () => (typeof MODULE_SIX_RESPONSE_ACTION_FINDING_OPTIONS !== 'undefined' ? MODULE_SIX_RESPONSE_ACTION_FINDING_OPTIONS : null),
    statuses: () => (typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : null),
    severities: () => (typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : null),
    escalations: () => (typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : null),
    dispositions: () => (typeof CASE_RECORD_DISPOSITION_OPTIONS !== 'undefined' ? CASE_RECORD_DISPOSITION_OPTIONS : null),
    dispositionLabels: () => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' ? CASE_RECORD_DISPOSITION_LABELS : null),
    caseId: () => (typeof MODULE_SIX_BACKDOOR_CASE_ID !== 'undefined' ? MODULE_SIX_BACKDOOR_CASE_ID : null),
  };
  const roster = () => G.roster() || { users: [], devices: [] };
  const departments = () => G.departments() || [];
  const bounceThreshold = () => G.bounce() || 40;
  const findingOptions = (name) => (G[name] && G[name]()) || [];
  // Ticket key (moduleSixBackdoorCaseScore, soc-analyst-module-06.js:698-711).
  const KEY = { severity: 'high', disposition: 'true-positive', findings: { evidencePriority: 'task-metadata', scopeAssessment: 'ws318-only', responseAction: 'escalate' } };
  // Ticket note length: spec.notesMin = 60 in moduleSixBackdoorCaseSpec().
  const NOTES_MIN = 60;

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => { const r = record(result); return r ? (typeof r[key] === 'string' ? r[key] : '') : null; };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const finding = (result, name) => { const r = record(result); return r ? (r.findings && typeof r.findings[name] === 'string' ? r.findings[name] : '') : null; };
  const optionText = (options, id) => ((options || []).find((option) => option.id === id) || {}).text || '';
  const severityLabel = (id) => optionText(G.severities(), id) || id;
  const statusLabel = (id) => optionText(G.statuses(), id) || id;
  const escalationLabel = (id) => optionText(G.escalations(), id) || id;
  const dispositionLabel = (id) => (G.dispositionLabels() || {})[id] || optionText(G.dispositions(), id) || id;
  const department = (id) => departments().find((option) => option.id === id) || null;
  const bestDepartment = () => departments().slice().sort((a, b) => b.fit - a.fit)[0] || null;
  const tierOf = (kind, id) => ((roster()[kind] || []).find((entry) => entry.id === id) || {}).tier || '';
  const principal = (kind) => ((roster()[kind] || []).find((entry) => entry.tier === 'principal') || {}).id || '';
  const shown = (ctx, label, fallback) => { const value = ctx.display(label); return value !== null ? value : fallback; };
  const blankAs = (value) => (value === null ? null : value || 'Left blank');
  const afterDash = (text) => String(text || '').split(' — ').slice(1).join(' — ').trim();

  const work = (result) => (result.assessment_work && typeof result.assessment_work === 'object' ? result.assessment_work : null);
  const arrayOf = (value) => (Array.isArray(value) ? value : []);
  const workList = (result, key) => (work(result) ? arrayOf(work(result)[key]) : null);

  // One line per event: "M06-EVT-003 · 09:04:06 · ws-318 · powershell.exe -NoProfile -File …"
  function describeEvent(id) {
    const item = eventById(id);
    if (!item) return String(id);
    const what = item.commandLine || (item.taskName ? `scheduled task ${item.taskName} ${item.result || ''}`.trim() : '')
      || (item.destination ? `connection to ${item.destination}:${item.destinationPort}` : '') || item.path || item.action || item.eventType;
    return `${item.id} · ${String(item.time || '').slice(11, 19)} · ${item.device} · ${what}`;
  }
  const describeEvents = (ids) => arrayOf(ids).map(describeEvent);

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
    const misses = arrayOf(item.misses).filter(Boolean);
    return `${item.points} of ${item.max} points${misses.length ? `; the scorer noted: ${misses.join(' ')}` : ''}`;
  };
  const credited = (id) => (result) => {
    const item = criterion(result, id);
    return item ? describeEvents(arrayOf(item.supportingEvidence).filter((entry) => eventById(entry))) : null;
  };

  // A detail check carries the specific red-pen note. The system-score check for
  // the same skill is shown only when the details cannot explain a short score
  // (or the attempt predates assessment_work), so a section never repeats itself.
  // The scorer gives half credit when relevant evidence exists; a detail that is
  // missing then reads ◐ (partly there) rather than ✗, so partial credit never
  // blocks a pass.
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
      when: (result, ctx) => !details.some((check) => { const value = check.test(result, ctx); return value === false || value === 'partial'; }),
      test: criterionTest(id),
      given: criterionGiven(id),
      fix,
    },
  ];

  // ----- key-evidence pieces for the ticket work note
  function notePieces() {
    const lead = (scenario() && scenario().seedLead) || {};
    const script = eventById('M06-EVT-003') || {};
    const connection = eventById('M06-EVT-005') || {};
    const comparison = ((scenario() && scenario().scope.devices) || []).find((id) => id !== lead.device) || '';
    const scriptName = String(script.scriptPath || '').split('\\').pop();
    return [
      { name: `the lead host (${lead.device})`, short: lead.device, terms: [lead.device] },
      { name: `the account that ran it (${lead.account})`, short: lead.account, terms: [lead.account] },
      { name: `the scheduled task (${lead.taskName})`, short: lead.taskName, terms: [lead.taskName] },
      { name: `the script it launched (${scriptName})`, short: scriptName, terms: [scriptName, 'powershell'] },
      { name: 'that the script is unsigned and sits in a user-writable folder', short: 'the unsigned, user-writable script', terms: ['unsigned', 'writable', 'public folder', 'users\\public'] },
      { name: `the outbound connection (${connection.destination})`, short: connection.destination, terms: [connection.destination] },
      { name: `the benign comparison host (${comparison}, signed maintenance)`, short: comparison, terms: [comparison, 'comparison', 'maintenance', 'signed'] },
      { name: 'what is NOT proven (limits of the evidence)', short: 'what is not proven', terms: ['not established', 'not confirmed', 'not proven', 'unconfirmed', 'no evidence', 'cannot confirm', 'cannot prove', 'does not prove', 'unknown', 'requires investigation', 'insufficient'] },
      { name: 'the next step (escalate, contain, preserve evidence)', short: 'the next step', terms: ['escalat', 'contain', 'isolat', 'preserve', 'handoff', 'hand off', 'edr', 'endpoint'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  const MAPPING_STATUS = { supported: 'Supported by the evidence', unsupported: 'Not supported by the evidence', needs_review: 'Needs review' };
  const mappingName = (mapping) => {
    const known = [...truth().supportedTechniques, ...truth().unsupportedTechniques].find((item) => item.id === mapping.techniqueId);
    return mapping.techniqueName || (known && known.name) || '';
  };

  function ticketSections() {
    return [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Case', shown(ctx, 'Case', G.caseId() || 'CASE-066318')],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', statusLabel(field(result, 'status'))) : null)],
        ],
        checks: [{
          label: 'Case left open while the hunt result is handed on (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: the Prove It scorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => statusLabel(field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The host still needs containment, so it is not resolved.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: () => `Severity set to ${severityLabel(KEY.severity)}`,
          expected: () => severityLabel(KEY.severity),
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === KEY.severity),
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: 'Set Severity to High. An unsigned script that a scheduled task launches from a user-writable folder and that then calls out to the internet is a serious, active risk.',
        }],
      },
      ...['users', 'devices'].map((kind) => {
        const key = kind === 'users' ? 'affectedUser' : 'affectedDevice';
        const noun = kind === 'users' ? 'user' : 'device';
        return {
          id: `affected-${noun}`,
          title: `Affected ${noun}`,
          answer: (result, ctx) => [[`Affected ${noun}`, blankAs(record(result) ? shown(ctx, `Affected ${noun}`, field(result, key)) : null)]],
          checks: [{
            label: () => (kind === 'users'
              ? `Names the account the task ran under (${principal('users')})`
              : `Names the workstation the task ran on (${principal('devices')})`),
            expected: () => principal(kind),
            // Same tiers as the ticket key: principal = full, pivot = half, other = none.
            test: (result) => {
              const value = field(result, key);
              if (value === null) return null;
              const tier = tierOf(kind, value);
              return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
            },
            given: (result) => field(result, key) || 'Left blank',
            fix: kind === 'users'
              ? () => `Put ${principal('users')} in Affected user: it is the account the UpdateHealth task ran under on ${principal('devices')}.`
              : () => `Put ${principal('devices')} in Affected device: the unsigned script ran there. ${(scenario().scope.devices.find((id) => id !== principal('devices')) || '')} is only the signed comparison host.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, key)} belongs to the benign comparison host. Name ${principal('users')}, the account behind the suspicious run.`
              : (result) => `${field(result, key)} is the benign comparison host. Name ${principal('devices')}, where the unsigned script ran.`,
          }],
        };
      }),
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: () => `Marked as ${String(dispositionLabel(KEY.disposition)).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel(KEY.disposition),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === KEY.disposition),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: 'Record the disposition as Confirmed malicious activity: an unsigned, user-writable, scheduled script is not routine administration. The comparison host (signed, approved maintenance) is the benign one.',
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
            fix: 'Set Escalation to Required. Removing a scheduled-task backdoor from an endpoint is beyond an analyst’s authority.',
          },
          {
            label: () => `Routed to the team that can contain the endpoint (${(bestDepartment() || {}).text})`,
            expected: () => (bestDepartment() || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            // Same fit rule as the ticket key: fit 100 full, ≥ bounce threshold partial, below = returned.
            test: (result) => {
              const chosen = department(field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= bounceThreshold() ? 'partial' : false;
            },
            given: (result) => (department(field(result, 'escalateTo')) || {}).text || 'No department chosen',
            fix: (result) => {
              const chosen = department(field(result, 'escalateTo'));
              return chosen && chosen.bounce ? chosen.bounce : `Route the case to ${(bestDepartment() || {}).text}, which can contain the host and remove the task.`;
            },
            fixPartial: (result) => `${(department(field(result, 'escalateTo')) || {}).note} Route to ${(bestDepartment() || {}).text} next time.`,
          },
        ],
      },
      {
        id: 'ticket-findings',
        title: 'Ticket findings',
        answer: (result, ctx) => (record(result)
          ? ['Evidence to prioritize', 'Current scope', 'Recommended response action'].map((label, index) => {
            const name = ['evidencePriority', 'scopeAssessment', 'responseAction'][index];
            return [label, blankAs(shown(ctx, label, optionText(findingOptions(name), finding(result, name))))];
          })
          : [['Evidence to prioritize', null], ['Current scope', null], ['Recommended response action', null]]),
        checks: [
          ['evidencePriority', () => 'Chose to prioritize the task’s author, trigger, path, signer and creation time', () => 'Prioritize the task metadata (author, trigger, path, signer, creation time): it shows who set the task up and whether it is trustworthy.'],
          ['scopeAssessment', () => `Scoped the problem to ${principal('devices')} only, with the signed maintenance host as a comparison`, () => `Keep the scope to ${principal('devices')}. The same task name on the comparison host is signed, approved maintenance, not a second compromise.`],
          ['responseAction', () => `Recommended escalating ${principal('devices')} for approved containment and preserving the task and script evidence`, () => `Recommend escalating ${principal('devices')} for approved containment and keeping the task and script as evidence. Wiping every host or closing it as benign is not supported.`],
        ].map(([name, label, fix]) => ({
          label,
          expected: () => optionText(findingOptions(name), KEY.findings[name]),
          test: (result) => (finding(result, name) === null ? null : finding(result, name) === KEY.findings[name]),
          given: (result) => optionText(findingOptions(name), finding(result, name)) || 'Left blank',
          fix,
        })),
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? field(result, 'notes') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_MIN,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: what you observed, how it compares with the benign host, what is not proven, and the next step.',
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

  // ----- hunt sections (one per scorer criterion group), in console order
  function huntSections() {
    const lead = () => (scenario() && scenario().seedLead) || {};
    const comparisonHost = () => ((scenario() && scenario().scope.devices) || []).find((id) => id !== lead().device) || '';
    const queryRuns = (result) => {
      const list = workList(result, 'queryHistory');
      return list === null ? null : list.filter((run) => run && ['device', 'account', 'all'].includes(run.entityType) && arrayOf(run.resultEventIds).length > 0);
    };
    const supportedHit = (mapping, list) => list.some((item) => item.id === mapping.techniqueId && arrayOf(item.evidenceEventIds).some((id) => arrayOf(mapping.eventIds).includes(id)));
    return [
      {
        id: 'hunt-hypothesis',
        title: 'Hunt hypothesis',
        answer: (result) => {
          const list = workList(result, 'hypotheses');
          if (list === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('testable-hypothesis')(result)]];
          const item = list[list.length - 1];
          return [['Events the hypothesis is linked to', item ? describeEvents(item.relatedEventIds) : 'No hypothesis saved'], ['Confidence the student chose', item ? item.confidence || '—' : null]];
        },
        response: (result) => {
          const list = workList(result, 'hypotheses');
          if (list === null) return [];
          const item = list[list.length - 1];
          return [
            { label: 'Hypothesis · student response', text: item ? item.text || '' : '' },
            ...(item && item.rationale ? [{ label: 'Why the student thinks so · student response', text: item.rationale }] : []),
          ];
        },
        checks: [{
          label: 'Wrote a specific, testable hypothesis (20+ characters) and linked it to events in the data',
          expected: 'A hypothesis about the UpdateHealth task on ws-318 that events could prove or disprove',
          test: criterionTest('testable-hypothesis'),
          given: criterionGiven('testable-hypothesis'),
          fix: () => `Write a hypothesis you can test, for example that the ${lead().taskName} task on ${lead().device} runs an unsigned script, and link the events that would prove or disprove it.`,
        }],
      },
      {
        id: 'hunt-scope',
        title: 'Hunt scope & benign comparison',
        answer: (result) => {
          const list = queryRuns(result);
          if (list === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('scope-and-comparison')(result)]];
          return [['Searches the student ran', list.length ? list.map((run) => `${run.entityType === 'all' ? 'All hosts' : `${run.entityType} ${run.entityValue}`} · ${String(run.startTime || '').slice(11, 16)}–${String(run.endTime || '').slice(11, 16)} · ${arrayOf(run.resultEventIds).length} results${run.query ? ` · query: ${run.query}` : ''}`) : 'No searches saved']];
        },
        checks: withScore([
          {
            label: () => `Searched the lead host (${lead().device})`,
            test: (result) => { const list = queryRuns(result); return list === null ? null : list.some((run) => run.entityType === 'device' && run.entityValue === lead().device); },
            fix: () => `Run a search scoped to ${lead().device} so the hunt starts from the lead.`,
          },
          {
            label: () => `Searched a benign comparison host (${comparisonHost()}) to see what normal looks like`,
            test: (result) => { const list = queryRuns(result); return list === null ? null : list.some((run) => run.entityType === 'device' && run.entityValue === comparisonHost()); },
            fix: () => `Also search ${comparisonHost()}. It runs the same task name as approved, signed maintenance, so it shows what is normal.`,
          },
        ], 'scope-and-comparison', 'System score for scope and comparison', () => `Run bounded searches on ${lead().device} and on the comparison host ${comparisonHost()}, then compare them.`),
      },
      {
        id: 'hunt-pivots',
        title: 'Saved query & pivots',
        answer: (result) => {
          const saved = workList(result, 'savedQueries');
          const pivots = workList(result, 'pivots');
          if (saved === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('query-and-pivots')(result)]];
          const runs = arrayOf(work(result).savedQueryRuns);
          return [
            ['Saved queries', saved.length ? saved.map((item) => `${item.name} — ${item.query}`) : 'None saved'],
            ['Saved query runs', runs.length ? runs.map((item) => `${item.name}: ${arrayOf(item.resultEventIds).length} results`) : 'None run'],
            ['Pivots followed (from event → to event)', pivots.length ? pivots.map((item) => `${describeEvent(item.fromEventId)}  →  ${describeEvent(item.toEventId)}`) : 'None followed'],
          ];
        },
        checks: withScore([
          {
            label: 'Saved a query and ran it with results',
            test: (result) => { const saved = workList(result, 'savedQueries'); return saved === null ? null : saved.length > 0 && arrayOf(work(result).savedQueryRuns).some((run) => arrayOf(run.resultEventIds).length > 0); },
            fix: 'Save a query for the behavior you are chasing and run it, so the search can be repeated.',
          },
          {
            label: 'Followed at least one related-event pivot that the data actually links',
            test: (result) => {
              const pivots = workList(result, 'pivots');
              return pivots === null ? null : pivots.some((item) => (eventById(item.fromEventId) || { relatedEventIds: [] }).relatedEventIds.includes(item.toEventId));
            },
            fix: 'Pivot from one event to a related event (for example task start to its child process) to follow the chain.',
          },
        ], 'query-and-pivots', 'System score for saved query and pivots', 'Run a saved query with results and follow a related-event pivot.'),
      },
      {
        id: 'hunt-evidence',
        title: 'Evidence collection',
        answer: (result) => {
          const collections = workList(result, 'collections');
          if (collections === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('evidence-collection')(result)]];
          return collections.length
            ? collections.map((item) => [`Collection “${item.name}”`, describeEvents(item.eventIds)])
            : [['Evidence collections', 'None saved']];
        },
        checks: withScore([
          {
            label: 'Saved a collection of at least two different events as the evidence set',
            test: (result) => { const list = workList(result, 'collections'); return list === null ? null : list.some((item) => new Set(arrayOf(item.eventIds)).size >= 2); },
            fix: 'Save the minimum chain of events (task start, script, connection) in one collection, with no duplicates.',
          },
        ], 'evidence-collection', 'System score for evidence collection', 'Save a collection containing at least two unique events from the data.'),
      },
      {
        id: 'hunt-attack',
        title: 'ATT&CK mapping',
        answer: (result) => {
          const list = workList(result, 'mappings');
          if (list === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('attack-mapping')(result)]];
          return list.length
            ? list.map((item) => [`${item.techniqueId} ${mappingName(item)}`.trim(), `${MAPPING_STATUS[item.status] || item.status} · confidence ${item.confidence}% · events: ${arrayOf(item.eventIds).join(', ')}`])
            : [['Technique mappings', 'None recorded']];
        },
        response: (result) => (workList(result, 'mappings') || []).filter((item) => item.rationale).map((item) => ({ label: `Why ${item.techniqueId} is ${String(MAPPING_STATUS[item.status] || item.status).toLowerCase()} · student response`, text: item.rationale })),
        checks: withScore([
          {
            label: () => `Marked at least one technique the evidence supports (${truth().supportedTechniques.map((item) => `${item.id} ${item.name}`).join('; ')}) as Supported, citing matching events`,
            test: (result) => { const list = workList(result, 'mappings'); return list === null ? null : list.some((item) => item.status === 'supported' && supportedHit(item, truth().supportedTechniques)); },
            fix: () => `Map what the events demonstrate: ${truth().supportedTechniques.map((item) => `${item.id} ${item.name}`).join(' and ')}, citing the events that show it.`,
          },
          {
            label: () => `Marked at least one technique the evidence does NOT support (${truth().unsupportedTechniques.map((item) => `${item.id} ${item.name}`).join('; ')}) as Unsupported, citing matching events`,
            test: (result) => { const list = workList(result, 'mappings'); return list === null ? null : list.some((item) => item.status === 'unsupported' && supportedHit(item, truth().unsupportedTechniques)); },
            fix: () => `Also record what the data does not show, such as ${truth().unsupportedTechniques[0].id} ${truth().unsupportedTechniques[0].name}: ${truth().unsupportedTechniques[0].rationale}`,
          },
        ], 'attack-mapping', 'System score for ATT&CK mapping', 'Record one evidence-cited Supported and one evidence-cited Unsupported technique assessment.'),
      },
      {
        id: 'hunt-handoff',
        title: 'Detection / incident handoff',
        answer: (result) => {
          const list = workList(result, 'handoffs');
          if (list === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('evidence-handoff')(result)]];
          return list.length
            ? list.flatMap((item) => [['Handed to', item.destination === 'rule' ? 'Detection rule' : item.destination === 'incident' ? 'Incident' : 'Alert'], ['Events attached', describeEvents(item.eventIds)], ['Status', String(item.status || 'proposed').replace(/_/g, ' ')]])
            : [['Handoffs', 'None proposed']];
        },
        response: (result) => (workList(result, 'handoffs') || []).flatMap((item) => [
          { label: 'Handoff rationale · student response', text: item.rationale || '' },
          { label: 'Handoff recommendation · student response', text: item.recommendation || '' },
        ]),
        checks: [{
          label: 'Proposed a handoff with attached events, a rationale and a recommendation',
          test: criterionTest('evidence-handoff'),
          given: criterionGiven('evidence-handoff'),
          fix: 'Propose a handoff that attaches the key events, says why, and recommends what the receiving team should do (for example a detection rule for this task pattern).',
        }],
      },
      {
        id: 'hunt-conclusion',
        title: 'Conclusion & limits',
        answer: (result) => {
          const list = workList(result, 'conclusions');
          if (list === null) return [['Student’s work in this section', null], ['Events credited by the scorer', credited('bounded-conclusion')(result)]];
          const item = list[list.length - 1];
          return item ? [['Events the conclusion rests on', describeEvents(item.eventIds)], ['Disposition the student chose', item.disposition ? dispositionLabel(item.disposition) : '—']] : [['Conclusion', 'None saved']];
        },
        response: (result) => {
          const list = workList(result, 'conclusions');
          if (list === null) return [];
          const item = list[list.length - 1];
          return [{ label: 'Conclusion · student response', text: item ? item.text || '' : '' }];
        },
        checks: [
          {
            label: 'Saved a substantive conclusion (30+ characters) tied to events in the data',
            test: criterionTest('bounded-conclusion'),
            given: criterionGiven('bounded-conclusion'),
            fix: 'State what you found, which events it rests on, and what happens next. Link the events.',
          },
          {
            label: 'Said what is not proven (for example “persistence is not established”) and did not call unproven behavior confirmed',
            expected: 'Uncertainty stated; no unsupported transfer, command-and-control or persistence claim',
            test: criterionTest('uncertainty-boundary'),
            given: criterionGiven('uncertainty-boundary'),
            fix: 'Keep the limits visible: say that file transfer, command-and-control and persistence intent are not established by this data. Do not write that they are confirmed.',
          },
          {
            label: 'No unsupported claim stated as confirmed (the scorer caps the score at 69 when there is one)',
            test: (result) => (Array.isArray(result.critical_errors) ? result.critical_errors.length === 0 : null),
            given: (result) => (Array.isArray(result.critical_errors) && result.critical_errors.length ? result.critical_errors.join(' ') : 'None flagged'),
            fix: 'Rewrite the claim as what the events show (for example “a connection to 198.51.100.88 was allowed”), not what you suspect (“command and control confirmed”).',
          },
        ],
      },
    ];
  }

  AdminSubmissionSheet.register(['lab-threat-hunt-independent'], {
    title: 'Module 06 · PROVE IT — Independent Dormant Task Backdoor Review',
    fixture,
    caseId: (result) => {
      const r = record(result);
      return (r && r.caseId) || G.caseId() || 'CASE-066318';
    },
    freeText: (result) => {
      const r = record(result) || {};
      const w = work(result) || {};
      return [r.notes, ...arrayOf(w.hypotheses).map((item) => item.text), ...arrayOf(w.conclusions).map((item) => item.text), ...arrayOf(w.handoffs).flatMap((item) => [item.rationale, item.recommendation])];
    },
    rubric: { criticalLabels: {} },
    sections: [...ticketSections(), ...huntSections()],
  });
})();

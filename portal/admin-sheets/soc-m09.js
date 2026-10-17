/* Submission Sheet — Module 09 Prove It, INC-4937 "Operation Cedar Lock":
 * active ransomware response (ws-173 encrypting, acct-173 remote session, fs-02
 * disrupted). Lab key 'lab-active-incident'.
 *
 * Answer keys (read at render time, never re-typed):
 *   - incident truth (priority, ownership route, confirmed impact, identity
 *     concern, scope boundary, backups, entities, evidence): SocM09AssessmentData
 *     (portal/soc-m09-assessment-data.js — expectedResponseTruth, scenario.backups,
 *     scenario.entities, scenario.evidence);
 *   - scoring: SocM09AssessmentRubric.extract / SocM09AssessmentScorer.CRITERIA (v3
 *     weights; the submitted score and result.breakdown come from these) and
 *     SocM09AssessmentRubric.designFacts for the workflow-design order;
 *   - ticket options, entity tiers, department fit and the classification/scope
 *     key: MODULE_NINE_* in portal/soc-analyst-module-09.js (answer key line 120:
 *     severity critical, disposition true-positive, route ir-lead-owners,
 *     classification ransomware-impact, scope bounded-three). That key is only used
 *     by moduleNineProveItPerformance(), which the submit does not call, so the
 *     ticket fields are NOT part of the submitted score; the sheet still checks
 *     them (the key agrees with expectedResponseTruth).
 *
 * Saved payload: result.breakdown (scorer criterion list), result.review_payload
 * (scorer result + responseReview: workflowDesigns and unsafeAttempts — the panel
 * app.js showed as adminResponseDesignReviewPanel), result.case_record, result.case_display,
 * and from 2026-10-17 result.assessment_work (triage, incident status, approval
 * gate, evidence reviewed, each response/recovery action with its approval,
 * workflow events (status, approval, task) and escalation text; each task's
 * author and completion note/evidence, also recoverable from the taskCreated /
 * taskCompletionEvidence workflow events).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const fixture = () => (typeof SocM09AssessmentData !== 'undefined' ? SocM09AssessmentData : null);
  const scenario = () => (fixture() && fixture().scenario) || null;
  const truth = () => (fixture() && fixture().expectedResponseTruth) || {};
  const list = (value) => (Array.isArray(value) ? value : []);
  const G = {
    roster: () => (typeof MODULE_NINE_ENTITY_ROSTER !== 'undefined' ? MODULE_NINE_ENTITY_ROSTER : null),
    departments: () => (typeof MODULE_NINE_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_NINE_DEPARTMENT_OPTIONS : null),
    classifications: () => (typeof MODULE_NINE_CLASSIFICATION_OPTIONS !== 'undefined' ? MODULE_NINE_CLASSIFICATION_OPTIONS : null),
    scopes: () => (typeof MODULE_NINE_SCOPE_OPTIONS !== 'undefined' ? MODULE_NINE_SCOPE_OPTIONS : null),
    key: () => (typeof MODULE_NINE_ANSWER_KEY !== 'undefined' ? MODULE_NINE_ANSWER_KEY : null),
    sources: () => (typeof MODULE_NINE_SOURCES !== 'undefined' ? MODULE_NINE_SOURCES : null),
    statuses: () => (typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : null),
    severities: () => (typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : null),
    escalations: () => (typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : null),
    dispositions: () => (typeof CASE_RECORD_DISPOSITION_OPTIONS !== 'undefined' ? CASE_RECORD_DISPOSITION_OPTIONS : null),
    dispositionLabels: () => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' ? CASE_RECORD_DISPOSITION_LABELS : null),
    rubric: () => (typeof SocM09AssessmentRubric !== 'undefined' ? SocM09AssessmentRubric : null),
  };
  const roster = () => G.roster() || { users: [], devices: [] };
  const departments = () => G.departments() || [];
  const key = () => G.key() || {};
  const incidentId = () => (scenario() && scenario().incidentGraph && scenario().incidentGraph.incidentId) || 'INC-4937';
  // Department fit below 40 is "returned" (ticket key, soc-analyst-module-09.js:895-896).
  const BOUNCE_BELOW = 40;
  // Ticket note length: moduleNineProveItSpec() sets notesMin = 140.
  const NOTES_MIN = 140;
  // assessment_work (the console workflow detail below) was first saved on this date.
  const SINCE = '2026-10-17';

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, name) => { const r = record(result); return r ? (typeof r[name] === 'string' ? r[name] : '') : null; };
  const finding = (result, name) => { const r = record(result); return r ? (r.findings && typeof r.findings[name] === 'string' ? r.findings[name] : '') : null; };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
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
  const cap = (text) => String(text || '').replace(/^\w/, (letter) => letter.toUpperCase());

  const work = (result) => (result.assessment_work && typeof result.assessment_work === 'object' ? result.assessment_work : null);
  const review = (result) => {
    const payload = result.review_payload || result.reviewPayload;
    return payload && typeof payload === 'object' && payload.responseReview && typeof payload.responseReview === 'object' ? payload.responseReview : null;
  };

  // ----- plain-language wording for ids the student saw in the console
  // Console labels: soc-console-tools.js:1125 (M09_ACTION_LABELS) and :1186 (WORKFLOW_NODE_LABELS), plus the recovery steps.
  const ACTION_LABEL = {
    isolate_endpoint: 'Isolate endpoint', isolate_device: 'Isolate device', disable_identity: 'Disable account', revoke_session: 'Revoke session',
    block_ioc: 'Block indicator', quarantine_file: 'Quarantine file', remove_inbox_rule: 'Remove inbox rule', remove_persistence: 'Remove persistence',
    restore_backup: 'Restore from backup', scan_recovery: 'Scan the recovered system', validate_recovery: 'Validate the recovery',
    select_recovery_point: 'Select a recovery point', monitor_recovery: 'Monitor the recovery',
  };
  const NODE_LABEL = {
    preserve: 'Preserve evidence', approval: 'Get approval', isolate: 'Isolate endpoint', 'revoke-session': 'Revoke session', 'block-indicator': 'Block indicator',
    'remove-persistence': 'Remove persistence', restore: 'Restore from backup', scan: 'Clean scan', monitor: 'Monitor',
  };
  // Residual-risk ids: soc-m09-assessment-state.js:10.
  const RESIDUAL = { persistence_present: 'Persistence still present', credential_session_active: 'A credential session is still active', malware_detected: 'Malware still detected' };
  // Blocked-attempt reasons: soc-m09-assessment-scorer.js:37-41 (REASON_TEXT).
  const REASON = { no_approval: 'no matching approval was recorded', out_of_scope: 'the target is outside the incident scope', wrong_target_type: 'the target is the wrong type for that action' };
  const OUTCOME = { success: 'worked', failure: 'failed (no change)', partial: 'partly worked' };
  const label = (map, id) => map[id] || String(id || '').replace(/[-_]/g, ' ');

  function describeEvidence(id) {
    const s = scenario() || {};
    const extra = list(s.evidence).find((item) => item.id === id);
    if (extra) return `${id} · ${extra.summary}`;
    const sources = G.sources() || {};
    for (const source of Object.values(sources)) {
      const row = list(source && source.rows).find((item) => item.id === id);
      if (row) return `${id} · ${row.title}${row.entity ? ` (${row.entity})` : ''}`;
    }
    return String(id);
  }
  const describeAll = (ids) => list(ids).map(describeEvidence);
  const backupFor = (action) => list(scenario() && scenario().backups).find((item) => item.id === action.backupId && item.recoveryPointId === action.recoveryPointId) || null;

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
    const deductions = list(item.deductions).filter((entry) => entry && entry.points);
    return `${item.points} of ${item.max} points${misses.length ? `; the scorer noted: ${misses.join(' ')}` : ''}${deductions.length ? `; deductions: ${deductions.map((entry) => `-${entry.points} ${entry.reason}`).join(' ')}` : ''}`;
  };
  const credited = (...ids) => (result) => {
    const found = ids.map((id) => criterion(result, id)).filter(Boolean);
    return found.length ? describeAll(found.flatMap((item) => list(item.supportingEvidence)).filter((entry) => /^M09-E\d+$/.test(entry))) : null;
  };
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
        when: (result, ctx) => (check.needsWork === false || work(result) !== null) && (check.when === undefined || check.when(result, ctx)),
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
  const actions = (result) => (work(result) ? list(work(result).actions) : null);
  const events = (result) => (work(result) ? list(work(result).workflowEvents) : null);
  const workflow = (result) => (work(result) && work(result).workflow) || null;
  const approved = (action) => Boolean(action.approverId && String(action.approverId).startsWith('ir-lead-') && String(action.approvalReason || '').trim());
  const designs = (result) => (review(result) ? list(review(result).workflowDesigns) : null);
  const designFacts = (design) => {
    const rubric = G.rubric();
    if (!rubric || typeof rubric.designFacts !== 'function') return null;
    return rubric.designFacts({ id: design.id, nodes: list(design.nodes), edges: list(design.connections).map((line) => { const [from, to] = String(line).split('>'); return { from, to }; }) });
  };
  const bestDesign = (result) => {
    const rubric = G.rubric();
    const list_ = designs(result);
    if (list_ === null) return null;
    if (!rubric || !list_.length) return false;
    return list_.map(designFacts).reduce((top, facts) => (!top || rubric.designPotential(facts) > rubric.designPotential(top) ? facts : top), null);
  };
  const connectionText = (line) => String(line).split('>').map((node) => label(NODE_LABEL, node)).join(' → ');
  const time = (stamp) => String(stamp || '').slice(11, 19);

  // Tasks as saved, with the author and completion note/evidence filled in from the
  // workflow events when the task copy predates those fields.
  const tasks = (result) => {
    const w = workflow(result);
    if (!w) return null;
    const evs = events(result) || [];
    const created = (id) => (evs.find((entry) => entry.field === 'taskCreated' && entry.value && entry.value.id === id) || {}).value || null;
    const completion = (id) => { const found = evs.filter((entry) => entry.field === 'taskCompletionEvidence' && entry.value && entry.value.taskId === id).pop(); return found ? { note: found.value.note, evidenceIds: list(found.value.evidenceIds) } : null; };
    const fromTasks = list(w.tasks).map((task) => ({
      ...task,
      authorId: task.authorId || (created(task.id) || {}).authorId || null,
      completionEvidence: task.completionEvidence || completion(task.id),
    }));
    const extra = evs.filter((entry) => entry.field === 'taskCreated' && entry.value && !fromTasks.some((task) => task.id === entry.value.id)).map((entry) => ({ ...entry.value, completionEvidence: completion(entry.value.id) }));
    return [...fromTasks, ...extra];
  };
  // The approval gate as a log: each request (action, target, Justification) and each
  // decision (Approver ID, Decision reason), replayed from the workflow events in order.
  const approvalLog = (result) => {
    const evs = events(result);
    if (evs === null) return null;
    const entries = [];
    let current = null;
    evs.slice().sort((a, b) => Number(a.sequence) - Number(b.sequence)).forEach((entry) => {
      if (entry.field === 'approvalStatus') {
        const prior = current || {};
        current = { status: entry.value, at: entry.timestamp, actionType: prior.actionType, targetId: prior.targetId, actorId: entry.value === 'pending' ? null : prior.actorId, reason: '' };
        entries.push(current);
      } else if (current && ['approvalReason', 'approvalActorId', 'approvalTargetId', 'approvalActionType'].includes(entry.field)) {
        current[{ approvalReason: 'reason', approvalActorId: 'actorId', approvalTargetId: 'targetId', approvalActionType: 'actionType' }[entry.field]] = entry.value;
      }
    });
    return entries;
  };
  const approvalWhat = (entry) => `${label(ACTION_LABEL, entry.actionType)} → ${entry.targetId || '—'}`;

  // ----- key-evidence pieces for the ticket work note
  function notePieces() {
    const t = truth();
    const impact = (t.confirmedImpact || [])[0] || principal('devices');
    const concern = t.identityConcern || {};
    const service = (t.observedServiceImpact || [])[0] || '';
    const remote = list(scenario() && scenario().evidence).find((item) => item.id === concern.remoteSessionEvidenceId) || {};
    return [
      { name: `the affected workstation (${impact})`, short: impact, terms: [impact] },
      { name: `the affected account (${concern.accountId})`, short: concern.accountId, terms: [concern.accountId] },
      { name: `the disrupted file service (${service})`, short: service, terms: [service] },
      { name: 'what happened: encryption / ransomware impact', short: 'the ransomware impact', terms: ['encrypt', 'ransom', 'file changes', 'impact'] },
      { name: 'the unfamiliar remote session that overlaps the encryption', short: 'the remote session', terms: ['remote session', 'unmanaged', 'unfamiliar', 'session', '203.0.113.173'] },
      { name: 'the evidence it rests on (M09-E records or what they showed)', short: 'the evidence it rests on', terms: ['m09-e0', 'm09-e1', 'denied', 'callback', 'evidence'] },
      { name: 'the conclusion and severity (confirmed, critical)', short: 'the conclusion and severity', terms: ['confirm', 'critical', 'compromis', 'incident', 'high'] },
      { name: 'the requested response (isolate, disable, revoke, contain)', short: 'the requested response', terms: ['isolat', 'revoke', 'disable', 'contain', 'block'] },
      { name: 'the limits: broader compromise and exfiltration are not established', short: 'what is not established', terms: ['not established', 'not confirmed', 'no evidence', 'not proven', 'unconfirmed', 'bounded', 'no second', 'cannot claim', 'does not show'] },
      { name: 'the recovery condition (validate, monitor, reconnect)', short: 'the recovery condition', terms: ['validat', 'monitor', 'reconnect', 'recover', 're-enable', 'reenable'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  function ticketSections() {
    return [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Incident', shown(ctx, 'Case', incidentId())],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', statusLabel(field(result, 'status'))) : null)],
        ],
        checks: [{
          label: 'Case left open while the response continues (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: the Prove It scorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => statusLabel(field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. Recovery is still being monitored, so it is not resolved.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: () => `Severity set to ${severityLabel(truth().priority)}`,
          expected: () => severityLabel(truth().priority),
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === truth().priority),
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: () => `Set Severity to ${severityLabel(truth().priority)}: files are actively being encrypted and a file service is disrupted.`,
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
            label: () => (kind === 'users' ? `Names the account tied to the remote session (${principal('users')})` : `Names the workstation being encrypted (${principal('devices')})`),
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
              ? () => `Put ${principal('users')} in Affected user: its account overlaps the encryption with an unfamiliar remote session the owner denied.`
              : () => `Put ${principal('devices')} in Affected device: the encryption is happening there.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, name)} is only loosely related. Name ${principal('users')}, the account behind the suspicious session.`
              : (result) => `${field(result, name)} was disrupted but is not where the encryption started. Name ${principal('devices')}.`,
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
          fix: () => `Record the disposition as ${dispositionLabel(key().disposition)}: the endpoint, identity and service evidence together confirm a real attack.`,
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
            fix: 'Set Escalation to Required. Active ransomware needs the incident lead, which is beyond a Tier 1 analyst’s authority.',
          },
          {
            label: () => `Routed to the incident lead and owners (${(bestDepartment() || {}).text})`,
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
        id: 'ticket-findings',
        title: 'Ticket findings',
        answer: (result, ctx) => (record(result)
          ? [['Incident classification', blankAs(shown(ctx, 'Incident classification', optionText(G.classifications(), finding(result, 'classification'))))],
            ['Defensible current scope', blankAs(shown(ctx, 'Defensible current scope', optionText(G.scopes(), finding(result, 'scope'))))]]
          : [['Incident classification', null], ['Defensible current scope', null]]),
        checks: [
          {
            label: () => `Classified as: ${optionText(G.classifications(), key().classification)}`,
            expected: () => optionText(G.classifications(), key().classification),
            test: (result) => (finding(result, 'classification') === null ? null : finding(result, 'classification') === key().classification),
            given: (result) => optionText(G.classifications(), finding(result, 'classification')) || 'Left blank',
            fix: 'Classify it as active ransomware with an identity overlap: the encryption on the workstation and the unfamiliar remote session happen at the same time.',
          },
          {
            label: () => `Scope stated as: ${optionText(G.scopes(), key().scope)}`,
            expected: () => optionText(G.scopes(), key().scope),
            test: (result) => (finding(result, 'scope') === null ? null : finding(result, 'scope') === key().scope),
            given: (result) => optionText(G.scopes(), finding(result, 'scope')) || 'Left blank',
            fix: 'Claim only what the evidence supports: the workstation and account are confirmed and the file share is disrupted, but a wider compromise is not established. Do not say the whole fleet is hit or that nothing was affected.',
          },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? field(result, 'notes') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_MIN,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: incident state, confirmed scope, the evidence, the response you request and the recovery condition.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result) => (record(result) ? field(result, 'notes') : null),
          pieces: () => notePieces(),
          fix: (missing) => `Back your handoff with the evidence: your note does not mention ${missing.join(', ')}. Say what each record showed.`,
        },
      },
    ];
  }

  function responseSections() {
    const t = () => truth();
    const concernAccount = () => (t().identityConcern || {}).accountId;
    return [
      {
        id: 'triage',
        title: 'Incident priority & ownership',
        answer: (result) => {
          const w = workflow(result);
          if (!w) return [['Student’s work in this section', null], ['Credited by the scorer', credited('triage-and-ownership')(result)]];
          const changes = (events(result) || []).filter((entry) => entry.field === 'status');
          return [
            ['Priority set on the incident', cap(w.severity) || '—'],
            ['Assigned to', (department(w.assigneeId) || {}).text || w.assigneeId || 'Nobody'],
            ['Incident status', w.status || '—'],
            ...(changes.length ? [['Status changes', changes.map((entry) => `${time(entry.timestamp)} · ${entry.value}`)]] : []),
          ];
        },
        checks: withScores([
          {
            label: () => `Incident priority set to ${cap(t().priority)}`,
            test: (result) => { const w = workflow(result); return w === null ? null : w.severity === t().priority; },
            given: (result) => { const w = workflow(result); return w ? cap(w.severity) : null; },
            fix: () => `Set the incident priority to ${cap(t().priority)}: it is active ransomware.`,
          },
          {
            label: () => `Assigned to ${(department(t().ownershipRoute) || {}).text || t().ownershipRoute}`,
            test: (result) => { const w = workflow(result); return w === null ? null : w.assigneeId === t().ownershipRoute; },
            given: (result) => { const w = workflow(result); return w ? ((department(w.assigneeId) || {}).text || w.assigneeId || 'Nobody') : null; },
            fix: () => `Assign the incident to ${(department(t().ownershipRoute) || {}).text || t().ownershipRoute}: they can authorise containment and recovery.`,
          },
        ], [{ id: 'triage-and-ownership', label: 'System score for priority and ownership', fix: 'Set the incident priority and assign the owner the response plan names.' }]),
      },
      {
        id: 'evidence-scope',
        title: 'Evidence reviewed & supported scope',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Student’s work in this section', null], ['Credited by the scorer', credited('evidence-and-scope')(result)]];
          return [['Evidence records the student opened', list(w.reviewedEvidenceIds).length ? describeAll(w.reviewedEvidenceIds) : 'None opened']];
        },
        checks: withScores([
          {
            label: () => `Opened the record showing the confirmed impact on ${(t().confirmedImpact || [])[0]}`,
            test: (result) => {
              const w = work(result);
              if (!w) return null;
              const edges = list(scenario().incidentGraph.edges).filter((edge) => edge.from === incidentId() && list(t().confirmedImpact).includes(edge.to));
              return edges.some((edge) => list(w.reviewedEvidenceIds).includes(edge.evidenceId));
            },
            fix: () => `Open the ${(t().confirmedImpact || [])[0]} impact record so your scope rests on evidence you have read.`,
          },
          {
            label: 'Opened the scope-boundary evidence (no second endpoint matched, no exfiltration found)',
            test: (result) => { const w = work(result); return w ? list((t().scopeBoundary || {}).evidenceIds).some((id) => list(w.reviewedEvidenceIds).includes(id)) : null; },
            fix: 'Open the scoped-search and data-access records: they show where the evidence stops, so you do not over-claim.',
          },
        ], [{ id: 'evidence-and-scope', label: 'System score for evidence reviewed and supported scope', fix: 'Review the impact and scope-boundary evidence before you state the scope.' }]),
      },
      {
        id: 'workflow-design',
        title: 'Response workflow design',
        answer: (result) => {
          const list_ = designs(result);
          if (list_ === null) return [['Response workflow designs', null]];
          if (!list_.length) return [['Response workflow designs', 'No response workflow was designed']];
          return list_.flatMap((design, index) => [
            [`Design ${index + 1} of ${list_.length}${index === list_.length - 1 ? ' (latest)' : ''}${design.name ? ` · ${design.name}` : ''}`, `Steps: ${list(design.nodes).map((node) => label(NODE_LABEL, node)).join(', ') || 'None'}`],
            ['Order drawn (from → to)', list(design.connections).length ? list(design.connections).map(connectionText) : 'No connections drawn'],
          ]);
        },
        checks: withScores([
          {
            needsWork: false,
            label: 'Evidence is preserved before approval is requested',
            test: (result) => { const best = bestDesign(result); return best === null ? null : Boolean(best) && best.evidenceBeforeApproval; },
            fix: 'In your design, preserve evidence first and then ask for approval, so nothing is changed before the evidence is safe.',
          },
          {
            needsWork: false,
            label: 'Every containment or recovery step comes after approval',
            test: (result) => {
              const best = bestDesign(result);
              if (best === null) return null;
              if (!best || !best.containmentSteps) return false;
              return best.gatedSteps === best.containmentSteps ? true : best.gatedSteps ? 'partial' : false;
            },
            fix: 'Draw an arrow from Get approval to every disruptive step (isolate, revoke, block, remove, restore), so none runs without sign-off.',
          },
          {
            needsWork: false,
            label: 'A scan or monitoring step follows containment',
            test: (result) => { const best = bestDesign(result); return best === null ? null : Boolean(best) && best.verifiedAfterContainment; },
            fix: 'Add a scan or monitor step after containment, so you check that the action worked.',
          },
          {
            needsWork: false,
            label: 'No disruptive step feeds back into evidence or approval',
            test: (result) => { const best = bestDesign(result); return best === null ? null : Boolean(best) && best.orderingErrors.length === 0; },
            given: (result) => { const best = bestDesign(result); return best && best.orderingErrors.length ? best.orderingErrors.map(connectionText).join('; ') : null; },
            fix: 'Remove arrows that run from a disruptive step back to Preserve evidence or Get approval: they put the order the wrong way round.',
          },
        ], [{ id: 'response-workflow-design', label: 'System score for the response workflow design', fix: 'Design the order as evidence, then approval, then containment, then a scan or monitoring step.' }]),
      },
      {
        id: 'evidence-first',
        title: 'Evidence preserved before removal',
        answer: (result) => {
          const evs = events(result);
          if (evs === null) return [['Student’s work in this section', null], ['Credited by the scorer', credited('evidence-before-eradication')(result)]];
          const savedTasks = tasks(result) || [];
          const done = savedTasks.filter((task) => task.status === 'completed');
          const added = savedTasks.filter((task) => task.authorId && task.authorId !== 'system');
          return [
            ['Tasks marked complete', done.length ? done.map((task) => {
              const completion = task.completionEvidence || {};
              return `${task.title || task.id} · Author: ${task.authorId || 'Not recorded'} · Completion note: ${completion.note || 'Not recorded'} · Evidence: ${list(completion.evidenceIds).length ? list(completion.evidenceIds).map(describeEvidence).join('; ') : 'None selected'}`;
            }) : 'None'],
            ['Tasks added · Author', added.length ? added.map((task) => `${task.title} · Author: ${task.authorId} · Status: ${task.status || 'pending'}`) : 'None'],
          ];
        },
        checks: withScores([
          {
            label: 'Marked “Preserve and review available evidence” complete',
            test: (result) => { const evs = events(result); return evs === null ? null : evs.some((entry) => entry.field === 'taskStatus' && entry.value && entry.value.taskId === 'M09-TASK-001' && entry.value.status === 'completed'); },
            fix: 'Complete the evidence-preservation task before you remove anything: once malware, persistence or files are gone, the evidence is gone too.',
          },
          {
            label: 'That happened before the first removal, quarantine or restore',
            test: (result) => {
              const evs = events(result);
              const acts = actions(result);
              if (evs === null || acts === null) return null;
              const preserved = evs.filter((entry) => entry.field === 'taskStatus' && entry.value && entry.value.taskId === 'M09-TASK-001' && entry.value.status === 'completed').map((entry) => entry.timestamp).sort()[0];
              const erad = acts.filter((entry) => ['remove_persistence', 'quarantine_file', 'remove_inbox_rule', 'restore_backup'].includes(entry.type)).map((entry) => entry.timestamp).sort()[0];
              if (!erad) return true;
              return Boolean(preserved) && preserved < erad;
            },
            fix: 'Do the removal and restore steps only after the evidence task is complete. Order matters here.',
          },
        ], [{ id: 'evidence-before-eradication', label: 'System score for evidence preserved before eradication', fix: 'Preserve the evidence first, then remove or restore.' }]),
      },
      {
        id: 'containment',
        title: 'Approved containment & credential response',
        answer: (result) => {
          const acts = actions(result);
          if (acts === null) return [['Student’s work in this section', null], ['Credited by the scorer', credited('approval-and-containment', 'identity-and-persistence', 'outcome-verification')(result)]];
          const response = acts.filter((entry) => !['select_recovery_point', 'restore_backup', 'scan_recovery', 'validate_recovery', 'monitor_recovery'].includes(entry.type));
          const w = workflow(result) || {};
          const log = approvalLog(result) || [];
          return [
            ['Approval gate (latest)', `${w.approvalStatus || 'not_requested'}${w.approvalActionType ? ` · ${label(ACTION_LABEL, w.approvalActionType)} → ${w.approvalTargetId}` : ''}`],
            ...(log.length ? [['Approval requests and decisions', log.map((entry) => (entry.status === 'pending'
              ? `${time(entry.at)} · requested approval: ${approvalWhat(entry)}`
              : `${time(entry.at)} · ${entry.status}${entry.actorId ? ` by ${entry.actorId}` : ''}: ${approvalWhat(entry)}`))]] : []),
            ...(response.length
              ? response.map((entry) => [`${time(entry.timestamp)} · ${label(ACTION_LABEL, entry.type)} → ${entry.entityId}`, `${cap(label(OUTCOME, entry.outcome))}${entry.approverId ? ` · approved by ${entry.approverId}` : ' · no approval recorded'}`])
              : [['Response actions', 'None run']]),
          ];
        },
        // The student's approval wording: each request's Justification and each decision's
        // Decision reason (from the workflow events), else the reason saved on each action,
        // else the latest reason on the approval gate.
        response: (result) => {
          const log = approvalLog(result) || [];
          const written = log.filter((entry) => String(entry.reason || '').trim()).map((entry) => (entry.status === 'pending'
            ? { label: `Approval request justification (${approvalWhat(entry)}) · student response`, text: entry.reason }
            : { label: `Approval decision reason (${entry.status}${entry.actorId ? ` by ${entry.actorId}` : ''}, ${approvalWhat(entry)}) · student response`, text: entry.reason }));
          if (written.length) return written;
          const perAction = (actions(result) || []).filter((entry) => entry.approvalReason && !['restore_backup', 'scan_recovery', 'validate_recovery'].includes(entry.type)).map((entry) => ({ label: `Approval reason for “${label(ACTION_LABEL, entry.type)} → ${entry.entityId}” · student response`, text: entry.approvalReason }));
          const w = workflow(result);
          const latest = w && String(w.approvalReason || '').trim() && !perAction.some((entry) => entry.text === w.approvalReason)
            ? [{ label: `Latest approval reason (approval gate ${w.approvalStatus}) · student response`, text: w.approvalReason }] : [];
          return [...perAction, ...latest];
        },
        checks: withScores([
          {
            label: 'Ran at least one containment action on an entity in this incident, with an approval recorded for that exact action and target',
            test: (result) => {
              const acts = actions(result);
              if (acts === null) return null;
              return acts.some((entry) => ['disable_identity', 'isolate_device', 'isolate_endpoint', 'revoke_session', 'block_ioc', 'quarantine_file', 'remove_inbox_rule', 'remove_persistence'].includes(entry.type) && approved(entry));
            },
            fix: 'Request approval for the exact action and target first, then isolate the confirmed endpoint (or another contained step).',
          },
          {
            label: () => `Handled the account or session risk (disable ${concernAccount()}, revoke its remote session, or remove persistence), with approval`,
            test: (result) => {
              const acts = actions(result);
              if (acts === null) return null;
              const sessionIds = list(scenario().evidence).filter((item) => item.type === 'session_detail' && list(item.relatedEvidenceIds).includes((t().identityConcern || {}).remoteSessionEvidenceId)).flatMap((item) => [item.entityId, ...list(item.relatedEntityIds)]);
              const persistence = list(scenario().entities).filter((entity) => entity.type === 'persistence').map((entity) => entity.id);
              return acts.some((entry) => approved(entry) && ((entry.type === 'disable_identity' && entry.entityId === concernAccount())
                || (entry.type === 'revoke_session' && sessionIds.includes(entry.entityId))
                || (entry.type === 'remove_persistence' && persistence.includes(entry.entityId))));
            },
            fix: () => `Address the identity risk too: with approval, disable ${concernAccount()} or revoke its unfamiliar remote session.`,
          },
        ], [
          { id: 'approval-and-containment', label: 'System score for approved, scoped containment', fix: 'Use incident-scoped containment actions, each with a matching approval.' },
          { id: 'identity-and-persistence', label: 'System score for the credential, session and persistence response', fix: 'Respond to the account, session and persistence risk in proportion to the evidence.' },
          { id: 'outcome-verification', label: 'System score for verifying action outcomes', fix: 'Check each action’s outcome (worked, failed or partly worked) before you move on.' },
        ]),
      },
      {
        id: 'safe-conduct',
        title: 'Safe response conduct (blocked attempts)',
        answer: (result) => {
          const r = review(result);
          if (!r) return [['Blocked response attempts', null]];
          const attempts = list(r.unsafeAttempts);
          return attempts.length
            ? attempts.map((attempt) => [`${label(ACTION_LABEL, attempt.actionType)} → ${attempt.targetId}`, `Blocked: ${attempt.reasonText || REASON[attempt.reason] || 'unsafe attempt'}`])
            : [['Blocked response attempts', 'No blocked or unapproved response attempts were recorded']];
        },
        checks: withScores([{
          needsWork: false,
          label: 'No blocked or unapproved response attempts (each one costs points in this competency, not the whole score)',
          expected: 'No blocked attempts',
          test: (result) => { const r = review(result); return r === null ? null : list(r.unsafeAttempts).length === 0; },
          given: (result) => { const r = review(result); return r ? `${list(r.unsafeAttempts).length} blocked attempt${list(r.unsafeAttempts).length === 1 ? '' : 's'}` : null; },
          fix: 'Request approval for the exact action and target, and keep to targets inside the incident, before you try a response step. The range logs every blocked attempt.',
        }], [{ id: 'safe-response-conduct', label: 'System score for safe response conduct', fix: 'Attempt only approved, in-scope response actions.' }]),
      },
      {
        id: 'recovery',
        title: 'Recovery & monitoring',
        answer: (result) => {
          const acts = actions(result);
          if (acts === null) return [['Student’s work in this section', null], ['Credited by the scorer', credited('recovery-readiness', 'recovery-monitoring')(result)]];
          const steps = acts.filter((entry) => ['select_recovery_point', 'restore_backup', 'scan_recovery', 'validate_recovery', 'monitor_recovery'].includes(entry.type));
          return steps.length
            ? steps.map((entry) => {
              const backup = backupFor(entry);
              const detail = [backup ? `${backup.recoveryPointId} (${backup.knownGood ? 'known good' : 'not known good'}, integrity ${backup.integrity})` : '', list(entry.residualRiskIds).length ? `risks left: ${list(entry.residualRiskIds).map((id) => RESIDUAL[id] || id).join(', ')}` : '', entry.type === 'monitor_recovery' && !list(entry.residualRiskIds).length ? 'no risks left' : ''].filter(Boolean).join(' · ');
              return [`${String(entry.timestamp).slice(11, 19)} · ${label(ACTION_LABEL, entry.type)}`, `${cap(label(OUTCOME, entry.outcome))}${detail ? ` · ${detail}` : ''}`];
            })
            : [['Recovery steps', 'None run']];
        },
        checks: withScores([
          {
            label: 'Chose a known-good recovery point whose integrity is verified',
            test: (result) => {
              const acts = actions(result);
              if (acts === null) return null;
              return acts.some((entry) => entry.type === 'select_recovery_point' && entry.outcome === 'success' && (() => { const backup = backupFor(entry); return Boolean(backup && backup.knownGood && backup.integrity === 'verified'); })());
            },
            fix: 'Pick the recovery point that is marked known good with verified integrity. An unverified copy could restore the problem.',
          },
          {
            label: 'Restored, then scanned, then validated that recovery, in that order',
            test: (result) => {
              const acts = actions(result);
              if (acts === null) return null;
              const at = (type) => acts.findIndex((entry) => entry.type === type);
              const [restore, scan, validate] = [at('restore_backup'), at('scan_recovery'), at('validate_recovery')];
              if (restore < 0 || scan < 0 || validate < 0) return restore >= 0 ? 'partial' : false;
              return restore < scan && scan < validate && acts[validate].outcome === 'success';
            },
            fix: 'Finish the sequence: restore from the chosen point, scan the recovered system clean, then validate it before reconnecting.',
          },
          {
            label: 'Monitored the recovery and recorded the result (reopened if risks remained, passed if none)',
            test: (result) => {
              const acts = actions(result);
              if (acts === null) return null;
              return acts.some((entry) => entry.type === 'monitor_recovery' && ((list(entry.residualRiskIds).length > 0 && entry.outcome === 'partial' && entry.summary === 'reopened') || (!list(entry.residualRiskIds).length && entry.outcome === 'success' && entry.summary === 'monitoring_passed')));
            },
            fix: 'After validation, run recovery monitoring and record whether risk remains. Reopen the incident if it does.',
          },
        ], [
          { id: 'recovery-readiness', label: 'System score for known-good recovery, scan and validation', fix: 'Select a known-good point, then restore, scan and validate it in order.' },
          { id: 'recovery-monitoring', label: 'System score for recovery monitoring and the reopen condition', fix: 'Monitor the recovery and reopen on residual risk.' },
        ]),
      },
      {
        id: 'residual-escalation',
        title: 'Remaining risk escalated',
        answer: (result) => {
          const w = workflow(result);
          if (!w) return [['Student’s work in this section', null], ['Credited by the scorer', credited('residual-risk-escalation')(result)]];
          return [['Escalation status', cap(w.escalationStatus) || 'None']];
        },
        response: (result) => { const w = workflow(result); return w && w.escalationReason ? [{ label: 'Escalation reason · student response', text: w.escalationReason }] : []; },
        checks: withScores([{
          label: 'Escalated the remaining risk with a reason of at least 20 characters',
          test: (result) => { const w = workflow(result); return w === null ? null : ['escalated', 'resolved'].includes(w.escalationStatus) && String(w.escalationReason || '').trim().length >= 20; },
          given: (result) => { const w = workflow(result); return w ? `${cap(w.escalationStatus)}; ${String(w.escalationReason || '').trim().length} characters` : null; },
          fix: 'Escalate what is still open (for example persistence or credential risk) and say why in a sentence or two.',
        }], [{ id: 'residual-risk-escalation', label: 'System score for escalating remaining risk', fix: 'Escalate the remaining gaps and residual risk with a reason.' }]),
      },
    ];
  }

  AdminSubmissionSheet.register(['lab-active-incident'], {
    title: 'Module 09 · PROVE IT — Active Ransomware Response · Operation Cedar Lock',
    fixture,
    caseId: () => incidentId(),
    freeText: (result) => {
      const r = record(result) || {};
      const w = workflow(result) || {};
      return [r.notes, w.escalationReason];
    },
    rubric: { criticalLabels: {} },
    sections: [...ticketSections(), ...responseSections()],
  });
})();

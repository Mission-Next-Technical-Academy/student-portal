/* Submission Sheet — Module 01 Prove It, CASE-012407 / INC-012716 (alert
 * NST-2407, a.chen / LAP-442). Lab key 'lab-soc-escalation'.
 *
 * Answer key: MODULE_ONE_ESCALATION_LAB in portal/data.js (entity roster
 * tiers, correctPriority, correctVerdict, departmentOptions[].fit, log rows).
 * Scoring it mirrors: moduleOneProveItPerformance() in
 * portal/soc-analyst-module-01.js. Values are read from the fixture at render
 * time so the sheet and the scorer cannot drift apart.
 *
 * Saved payload (moduleOneFinalizeProveIt): result.case_record = the whole
 * lab2 state (status, priority/severity, verdict/disposition, affectedUser,
 * affectedDevice, escalation, escalateTo, notes, reviewedEvidence,
 * viewedLogIds, actionHistory, legacy handoff), result.breakdown,
 * result.feedback, result.critical_errors, and from 2026-10-17
 * result.case_display (the ticket rows as the student saw them).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const lab = () => (typeof MODULE_ONE_ESCALATION_LAB !== 'undefined' ? MODULE_ONE_ESCALATION_LAB : null);
  // Points per criterion are inline in moduleOneProveItPerformance()
  // (soc-analyst-module-01.js: entityPoints 0-20, priority 15, verdict 20,
  // escalation 35 × fit, notes 10); no fixture holds them.
  const MAX = { affected_entity: 20, severity: 15, disposition: 20, escalation: 35, analyst_notes: 10 };
  // Work notes earn full credit at 80 characters (same scorer, `notesLen / 80`).
  const NOTES_FULL_CREDIT = 80;
  const bounceThreshold = () => (typeof MODULE_ONE_DEPARTMENT_BOUNCE_THRESHOLD !== 'undefined' ? MODULE_ONE_DEPARTMENT_BOUNCE_THRESHOLD : 40);

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'priority') || field(result, 'severity') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'verdict') || field(result, 'disposition') : null);
  const afterDash = (text) => String(text || '').split(' — ').slice(1).join(' — ').trim();

  const optionText = (options, id) => ((options || []).find((option) => option.id === id) || {}).text || '';
  const statusLabel = (id) => optionText(typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [], id) || id;
  const severityLabel = (id) => optionText(typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [], id) || id;
  const escalationLabel = (id) => optionText(typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : [], id) || id;
  // The ticket shows the shared labels for the standard ids
  // (case-record.js CASE_RECORD_DISPOSITION_LABELS) and the module's own text otherwise.
  const dispositionLabel = (id) => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' && CASE_RECORD_DISPOSITION_LABELS[id])
    || optionText(lab() && lab().verdictOptions, id) || id;
  const department = (id) => ((lab() && lab().departmentOptions) || []).find((option) => option.id === id) || null;
  const bestDepartment = () => ((lab() && lab().departmentOptions) || []).slice().sort((a, b) => b.fit - a.fit)[0] || null;
  const principal = (kind) => (((lab() && lab().scenario.entityRoster[kind]) || []).find((entry) => entry.tier === 'principal') || {}).id || '';
  const tierOf = (kind, id) => (((lab() && lab().scenario.entityRoster[kind]) || []).find((entry) => entry.id === id) || {}).tier || '';
  const logRow = (id) => ((lab() && lab().scenario.logEvents) || []).find((row) => row.id === id) || null;

  // Shown value: the student's own label when case_display was saved,
  // otherwise rebuilt from the option ids in case_record.
  const shown = (ctx, label, fallback) => {
    const value = ctx.display(label);
    return value !== null ? value : fallback;
  };
  const blankAs = (value) => (value === null ? null : value || 'Left blank');

  // Pieces the work note should name, each read from the fixture's own
  // records (users/devices: entityRoster principal; IP, process, upload
  // size: logEvents raw fields; next step: correctContainment option).
  function evidencePoints() {
    const login = logRow('evt-login-success');
    const proc = logRow('evt-process');
    const proxy = logRow('evt-proxy');
    const ip = (login && login.raw.source_ip) || '';
    const process = (proc && proc.raw.process) || '';
    const megabytes = proxy && proxy.raw.bytes_out ? `${Math.round(proxy.raw.bytes_out / 1e6)} MB` : '';
    return [
      { name: `the affected account (${principal('users')})`, short: principal('users'), terms: [principal('users')] },
      { name: `the affected laptop (${principal('devices')})`, short: principal('devices'), terms: [principal('devices')] },
      { name: `the attacker's address (${ip})`, short: ip, terms: [ip] },
      { name: 'the MFA prompts approved after repeated denials', short: 'the MFA prompts', terms: ['mfa', 'multi-factor', 'multifactor', 'push', 'prompt'] },
      { name: `the downloaded file running on the laptop (${process})`, short: process, terms: [process, process.replace(/\.exe$/, ''), '.hta', 'powershell', 'invoice_2407', 'download'] },
      { name: `the ${megabytes} upload to the same address`, short: `the ${megabytes} upload`, terms: ['upload', megabytes, 'exfil', 'bytes_out', 'data out'] },
      { name: 'the user denying they approved it (the callback)', short: 'the user’s denial', terms: ['deni', 'deny', 'callback', 'call back', 'phone', 'did not approve', "didn't approve", 'not approve'] },
      { name: 'the conclusion (account takeover / compromise)', short: 'your conclusion', terms: ['takeover', 'take over', 'taken over', 'compromis', 'malicious', 'true positive', 'unauthori', 'attacker'] },
      { name: `the next step for responders (${optionText(lab() && lab().containmentOptions, lab() && lab().correctContainment).replace(/^Escalate with the evidence:\s*/i, '').replace(/\.$/, '')})`, short: 'the next step for responders', terms: HANDOFF_TERMS },
    ].map((point) => ({ ...point, terms: point.terms.filter(Boolean) }));
  }

  const HANDOFF_TERMS = ['tier 2', 'tier2', 'escalat', 'isolat', 'revok', 'contain', 'reset', 'disable', 'block', 'handoff', 'hand off', 'hand-off', 'quarantin'];

  AdminSubmissionSheet.register(['lab-soc-escalation'], {
    title: 'Module 01 · PROVE IT — Independent Case Ticket',
    fixture: lab,
    caseId: () => {
      const scenario = lab() && lab().scenario;
      return scenario ? [scenario.caseId, scenario.incidentId].filter(Boolean).join(' · ') : 'CASE-012407';
    },
    freeText: (result) => {
      const r = record(result) || {};
      return [r.notes, ...Object.values(r.handoff && typeof r.handoff === 'object' ? r.handoff : {})];
    },
    rubric: {
      labels: {
        affected_entity: 'Affected user and device',
        severity: 'Severity',
        disposition: 'Disposition',
        escalation: 'Escalation and routing',
        analyst_notes: 'Analyst work notes (length)',
      },
      max: MAX,
      criticalLabels: { 'escalation-not-required': 'Escalation set to “Not required” on a confirmed takeover' },
    },
    sections: [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => {
          const scenario = (lab() && lab().scenario) || {};
          return [
            ['Case', shown(ctx, 'Case', scenario.caseId || '—')],
            ['Linked incident', shown(ctx, 'Linked incidents', scenario.incidentId || '—')],
            ['Alert', scenario.alertId ? `${scenario.alertId} · ${scenario.title}` : '—'],
            ['Status', blankAs(record(result) ? shown(ctx, 'Status', statusLabel(field(result, 'status'))) : null)],
          ];
        },
        checks: [{
          label: 'Case left open while the responders act (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => statusLabel(field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. You handed it to responders to contain, so it is not resolved yet.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', severityLabel(severityOf(result))) : null)]],
        checks: [{
          label: `Severity set to ${severityLabel(lab() ? lab().correctPriority : 'high')}`,
          expected: () => severityLabel(lab().correctPriority),
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === lab().correctPriority),
          given: (result) => severityLabel(severityOf(result)) || 'Left blank',
          fix: () => `Set Severity to ${severityLabel(lab().correctPriority)}: ${afterDash(optionText(lab().priorityOptions, lab().correctPriority))}`,
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
            label: kind === 'users'
              ? `Names the account that was taken over (${principal('users')})`
              : `Names the laptop the attack ran on (${principal('devices')})`,
            expected: () => principal(kind),
            // Scorer: principal = full credit, pivot = half credit, anything else none.
            test: (result) => {
              const value = field(result, key);
              if (value === null) return null;
              const tier = tierOf(kind, value);
              return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
            },
            given: (result) => field(result, key) || 'Left blank',
            fix: kind === 'users'
              ? () => `Put ${principal('users')} in Affected user. The denied and approved MFA prompts, the sign-in, and the activity on ${principal('devices')} all belong to that account.`
              : () => `Put ${principal('devices')} in Affected device. It ran the downloaded file, contacted the attacker's address, and sent the upload.`,
            fixPartial: kind === 'users'
              ? (result) => `${field(result, key)} touches the evidence, but ${principal('users')} is the account that approved the MFA prompts and was signed in on ${principal('devices')}. Name ${principal('users')} as the affected user.`
              : (result) => `${field(result, key)} briefly reached the same address, but ${principal('devices')} is where the file ran and the upload came from. Name ${principal('devices')} as the affected device.`,
          }],
        };
      }),
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: `Marked as ${String(dispositionLabel(lab() ? lab().correctVerdict : 'true-positive')).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel(lab().correctVerdict),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === lab().correctVerdict),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: () => `Record the disposition as ${dispositionLabel(lab().correctVerdict)}: the user denied approving the MFA prompts or running the file, so this is a real account takeover with code running on ${principal('devices')}.`,
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
            fix: 'Set Escalation to Required. A confirmed account takeover needs responders to revoke sessions and isolate the laptop, which is beyond an analyst’s authority.',
          },
          {
            label: () => `Routed to the team that owns both the account and the laptop (${(bestDepartment() || {}).text})`,
            expected: () => (bestDepartment() || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            // Scorer: escalation points scale with department.fit; below the
            // bounce threshold the route earns nothing.
            test: (result) => {
              const chosen = department(field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= bounceThreshold() ? 'partial' : false;
            },
            given: (result) => (department(field(result, 'escalateTo')) || {}).text || 'No department chosen',
            fix: (result) => {
              const chosen = department(field(result, 'escalateTo'));
              return chosen && chosen.bounce ? chosen.bounce : `Route the case to ${(bestDepartment() || {}).text}, which can revoke the session and isolate the laptop together.`;
            },
            fixPartial: (result) => `${(department(field(result, 'escalateTo')) || {}).note} Route to ${(bestDepartment() || {}).text} next time.`,
          },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => {
          const r = record(result);
          if (!r) return [{ label: 'Analyst work notes · student response', text: null }];
          const handoff = r.handoff && typeof r.handoff === 'object' ? r.handoff : {};
          const legacy = [['observations', 'Observations'], ['analysis', 'Analysis'], ['scope', 'Scope'], ['nextAction', 'Requested next action']]
            .filter(([key]) => typeof handoff[key] === 'string' && handoff[key].trim())
            .map(([key, label]) => ({ label: `Handoff · ${label}`, text: handoff[key] }));
          return [{ label: 'Analyst work notes · student response', text: r.notes || '' }, ...legacy];
        },
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_FULL_CREDIT,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: what you saw, what it means, what is affected, and what should happen next.',
          }),
        ],
        // One line per piece the note should name; all = pass, some = partly
        // there (never blocks a pass), none = needs work.
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result, ctx) => (record(result) ? ctx.text() : null),
          pieces: () => evidencePoints(),
          fix: (missing) => `Back your decision with the evidence: your note does not mention ${missing.join('; ')}. Say what each record showed and when.`,
        },
      },
      {
        id: 'evidence',
        title: 'Evidence reviewed',
        required: false,
        answer: (result) => {
          const r = record(result);
          if (!r || !Array.isArray(r.viewedLogIds)) return [['Log records opened', null]];
          const rows = (lab() && lab().scenario.logEvents) || [];
          const opened = rows.filter((row) => r.viewedLogIds.includes(row.id));
          const key = opened.filter((row) => row.evidenceId);
          return [
            ['Case records opened', key.map((row) => `${row.time} · ${row.type} · ${row.user} / ${row.device} (${row.result})`)],
            ['Other log rows opened', `${opened.length - key.length} of ${rows.filter((row) => !row.evidenceId).length} background rows`],
          ];
        },
        checks: [{
          label: () => `Opened the records the decision rests on (${((lab() && lab().scenario.evidence) || []).filter((item) => item.id !== 'owner').map((item) => item.label).join(', ')})`,
          test: (result) => {
            const r = record(result);
            if (!r || !Array.isArray(r.reviewedEvidence)) return null;
            const needed = lab().scenario.evidence.filter((item) => item.id !== 'owner').map((item) => item.id);
            const seen = needed.filter((id) => r.reviewedEvidence.includes(id)).length;
            return seen === needed.length ? true : seen ? 'partial' : false;
          },
          given: (result) => {
            const r = record(result) || {};
            const missing = lab().scenario.evidence.filter((item) => item.id !== 'owner' && !(r.reviewedEvidence || []).includes(item.id));
            return missing.length ? `Not opened: ${missing.map((item) => item.label).join(', ')}` : 'All opened';
          },
          fix: (result) => {
            const r = record(result) || {};
            const missing = lab().scenario.evidence.filter((item) => item.id !== 'owner' && !(r.reviewedEvidence || []).includes(item.id));
            return `Open the ${missing.map((item) => item.label).join(' and ')} records before you decide, so your conclusion rests on records you have read.`;
          },
        }],
      },
      {
        id: 'timeline',
        title: 'Action timeline',
        required: false,
        collapsed: true,
        answer: (result) => {
          const r = record(result);
          if (!r || !Array.isArray(r.actionHistory)) return [['Recorded actions', null]];
          const time = (at) => {
            const date = at ? new Date(at) : null;
            return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
          };
          return [['Recorded actions', r.actionHistory.filter((entry) => entry && entry.action).map((entry) => `${time(entry.at)} · ${entry.action}`)]];
        },
      },
    ],
  });
})();

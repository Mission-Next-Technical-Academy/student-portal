/* Submission Sheet — Module 02 Prove It, CASE-025502 / INC-025811 (John Smith
 * given HR-Read access he is not entitled to). Lab key
 * 'lab-identity-investigation'.
 *
 * Answer key: lives INSIDE the module's IIFE, so no global exposes it. The
 * values below are copied once from portal/soc-analyst-module-02-environment.js
 * and each block cites its source line:
 *   CASE_USER_OPTIONS / CASE_DEVICE_OPTIONS (tiers)   lines 107-120
 *   CASE_DEPARTMENT_OPTIONS (fit, note, bounce)       lines 121-126
 *   CASE_DISPOSITION_OPTIONS, CASE_FINDINGS           lines 127-138
 *   CASE_CORRECT                                      line 139
 *   caseScore() weights (entity 20, severity 10, disposition 20,
 *     escalation 30 × fit, finding 10, notes 10)      lines 167-185
 * If the module changes, update this file with it (tests/admin-sheets/
 * soc-m02.cases.js reads the module source and fails if the keys drift).
 *
 * Saved payload (submitProve, line ~751): result.case_record (the ticket
 * state), result.case_display (ticket rows as the student saw them),
 * result.case_summary (plain-text copy of the ticket, not shown: duplicate),
 * result.access_review (fixed placeholder + copy of the notes, not shown:
 * duplicate), result.breakdown / feedback / critical_errors (scorer).
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  // soc-analyst-module-02-environment.js:107-112 (tier: principal = full credit, pivot = half).
  const USERS = [
    { id: 'john', text: 'John Smith (jsmith) — Operations Coordinator', tier: 'principal' },
    { id: 'cora', text: 'Cora Green (cgreen) — Finance Contractor', tier: 'pivot' },
    { id: 'alice', text: 'Alice Morgan (amorgan) — Finance Analyst', tier: 'noise' },
    { id: 'ravi', text: 'Ravi Patel (rpatel) — Web Administrator', tier: 'noise' },
    { id: 'helen', text: 'Helen Diaz (hdiaz) — HR Specialist', tier: 'noise' },
  ];
  // soc-analyst-module-02-environment.js:113-119
  const DEVICES = [
    { id: 'wk23', text: 'wkstn-23 (10.20.4.31) — managed, compliant', tier: 'principal' },
    { id: 'wk09', text: 'wkstn-09 (10.20.4.09) — unmanaged, non-compliant', tier: 'pivot' },
    { id: 'wk17', text: 'wkstn-17 (10.20.4.22) — managed, compliant', tier: 'noise' },
    { id: 'wk31', text: 'wkstn-31 (10.20.4.38) — managed, compliant', tier: 'noise' },
    { id: 'wk44', text: 'wkstn-44 (10.20.4.44) — managed, compliant', tier: 'noise' },
  ];
  // soc-analyst-module-02-environment.js:120-125 (fit < 40 bounces and earns nothing).
  const DEPARTMENTS = [
    { id: 'identity-response', text: 'Identity Response', fit: 100, note: 'Best fit — the access policy itself needs correction.' },
    { id: 'tier2-soc', text: 'Tier 2 SOC', fit: 55, note: 'Accepted, but the policy fix belongs to Identity Response.', bounce: 'Tier 2 SOC bounced this — there is no active threat to triage, only a policy gap to correct.' },
    { id: 'hr-privacy', text: 'HR / Data Privacy', fit: 35, note: 'HR-Read exposure matters to Data Privacy, but they cannot correct the access policy.' },
    { id: 'it-helpdesk', text: 'IT Helpdesk', fit: 15, note: 'Helpdesk cannot adjudicate a policy exception.', bounce: 'IT Helpdesk bounced this — it needs a policy decision, not a ticket reset.' },
  ];
  const BOUNCE_BELOW = 40; // caseScore(): `bounced = department.fit < 40` (line ~169)
  // soc-analyst-module-02-environment.js:126-130
  const DISPOSITIONS = [
    { id: 'policy-violation', text: 'Confirmed — authorization granted beyond assigned entitlements' },
    { id: 'expected-access', text: 'False positive — access matches assigned entitlements' },
    { id: 'device-noncompliance', text: 'Confirmed — device compliance violation, no unauthorized data access' },
  ];
  // soc-analyst-module-02-environment.js:131-137 (CASE_FINDINGS 'access-finding')
  const FINDING_LABEL = 'Access control finding';
  const FINDINGS = [
    { id: 'excess-auth', text: 'Excessive authorization — HR-Read granted without an HR-Read group membership' },
    { id: 'expected', text: 'Expected access — authorization matches assigned groups' },
    { id: 'device-risk', text: 'Device compliance risk — unmanaged/non-compliant device reached a restricted resource' },
  ];
  // soc-analyst-module-02-environment.js:139 CASE_CORRECT
  const CORRECT = { severity: 'high', disposition: 'policy-violation', escalateTo: 'identity-response', finding: 'excess-auth' };
  const MAX = { affected_entity: 20, severity: 10, disposition: 20, escalation: 30, access_finding: 10, analyst_notes: 10 };
  const NOTES_FULL_CREDIT = 80; // ASSESSMENT_MIN_NOTE_LENGTH, line 93

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const findingOf = (result) => {
    const r = record(result);
    if (!r) return null;
    return r.findings && typeof r.findings === 'object' && typeof r.findings['access-finding'] === 'string' ? r.findings['access-finding'] : '';
  };
  const byId = (list, id) => list.find((option) => option.id === id) || null;
  const textOf = (list, id) => (byId(list, id) || {}).text || id || '';
  const standard = (name, id) => {
    const list = { CASE_RECORD_STATUS_OPTIONS: typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [],
      CASE_RECORD_SEVERITY_OPTIONS: typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [],
      CASE_RECORD_ESCALATION_OPTIONS: typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : [] }[name];
    return textOf(list, id);
  };
  const blankAs = (value) => (value === null ? null : value || 'Left blank');
  const shown = (ctx, label, fallback) => {
    const value = ctx.display(label);
    return value !== null && value !== 'Not provided' ? value : fallback;
  };
  const best = () => DEPARTMENTS.slice().sort((a, b) => b.fit - a.fit)[0];

  // Key pieces the work note should name (answer: John Smith on wkstn-23 was
  // allowed into HR-FILE-01 under HR-Read without being in that group; the
  // 08:17 deny then 08:27 allow; fix belongs with Identity Response).
  const EVIDENCE = [
    { name: 'the user who received the access (John Smith / jsmith)', short: 'John Smith', terms: ['john smith', 'jsmith', 'john'] },
    { name: 'the workstation he used (wkstn-23)', short: 'wkstn-23', terms: ['wkstn-23', 'wk23'] },
    { name: 'the HR file server that was opened (HR-FILE-01)', short: 'HR-FILE-01', terms: ['hr-file-01', 'hr file', 'hr share', 'hr data'] },
    { name: 'the HR-Read permission that was granted', short: 'the HR-Read permission', terms: ['hr-read', 'hr read'] },
    { name: 'that he is not a member of the group that should allow it (his group is Operations-Read)', short: 'that he is not in the HR-Read group', terms: ['operations-read', 'not a member', 'not in the', 'no membership', 'no matching', 'without', 'not entitled', 'not authorized', 'unauthori', 'entitle', 'membership'] },
    { name: 'the denied request at 08:17 followed by the allowed request at 08:27', short: 'the 08:17 denial followed by the 08:27 allow', terms: ['08:17', '08:27', 'denied then', 'then allowed', 'denied and then', 'later allowed'] },
    { name: 'the conclusion (access beyond his entitlements / policy problem)', short: 'your conclusion', terms: ['excess', 'beyond', 'policy violation', 'policy gap', 'over-privileg', 'overprivileg', 'misconfig', 'should not have', 'inappropriate'] },
    { name: 'the next step (Identity Response corrects the access policy)', short: 'the next step', terms: ['identity response', 'correct the polic', 'fix the polic', 'review the polic', 'remove', 'revoke', 'remediat', 'access policy', 'group membership'] },
  ];

  AdminSubmissionSheet.register(['lab-identity-investigation'], {
    title: 'Module 02 · PROVE IT — Suspicious Authentication Investigation',
    caseId: () => 'CASE-025502 · INC-025811',
    // Scenario names (jsmith, cgreen, wkstn…) for the spelling allowlist.
    fixture: () => ({ USERS, DEVICES, DEPARTMENTS, DISPOSITIONS, FINDINGS, EVIDENCE }),
    rubric: {
      labels: {
        affected_entity: 'Affected user and device',
        severity: 'Severity',
        disposition: 'Disposition',
        escalation: 'Escalation and routing',
        access_finding: 'Access control finding',
        analyst_notes: 'Analyst work notes (length)',
      },
      max: MAX,
      criticalLabels: { 'escalation-not-required': 'Escalation set to “Not required” on a confirmed access-control problem' },
    },
    sections: [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Case', shown(ctx, 'Case', 'CASE-025502')],
          ['Linked incident', shown(ctx, 'Linked incidents', 'INC-025811')],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', standard('CASE_RECORD_STATUS_OPTIONS', field(result, 'status'))) : null)],
        ],
        checks: [{
          label: 'Case left open while Identity Response acts (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: the scorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => standard('CASE_RECORD_STATUS_OPTIONS', field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The policy still has to be corrected, so it is not resolved yet.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', standard('CASE_RECORD_SEVERITY_OPTIONS', severityOf(result))) : null)]],
        checks: [{
          label: `Severity set to ${standard('CASE_RECORD_SEVERITY_OPTIONS', CORRECT.severity) || 'High'}`,
          expected: () => standard('CASE_RECORD_SEVERITY_OPTIONS', CORRECT.severity) || 'High',
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === CORRECT.severity),
          given: (result) => standard('CASE_RECORD_SEVERITY_OPTIONS', severityOf(result)) || 'Left blank',
          fix: 'Set Severity to High. A user reached HR-FILE-01 (sensitive HR data) without being entitled to it, even though no attacker is involved.',
        }],
      },
      {
        id: 'affected-user',
        title: 'Affected user',
        answer: (result) => [['Affected user', blankAs(record(result) ? textOf(USERS, field(result, 'affectedUser')) : null)]],
        checks: [{
          label: 'Names the user who received access he should not have (John Smith)',
          expected: () => textOf(USERS, 'john'),
          // Scorer caseTierPoints(): principal 1, pivot 0.5, other 0.
          test: (result) => {
            const value = field(result, 'affectedUser');
            if (value === null) return null;
            const tier = (byId(USERS, value) || {}).tier;
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result) => textOf(USERS, field(result, 'affectedUser')) || 'Left blank',
          fix: 'Put John Smith in Affected user. His 08:27 request to HR-FILE-01 was allowed under HR-Read although he is only in Operations-Read.',
          fixPartial: 'Cora Green appears in the logs, but John Smith is the user whose HR-FILE-01 access was wrongly allowed. Name John Smith as the affected user.',
        }],
      },
      {
        id: 'affected-device',
        title: 'Affected device',
        answer: (result) => [['Affected device', blankAs(record(result) ? textOf(DEVICES, field(result, 'affectedDevice')) : null)]],
        checks: [{
          label: 'Names the workstation used for the excess access (wkstn-23)',
          expected: () => textOf(DEVICES, 'wk23'),
          test: (result) => {
            const value = field(result, 'affectedDevice');
            if (value === null) return null;
            const tier = (byId(DEVICES, value) || {}).tier;
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result) => textOf(DEVICES, field(result, 'affectedDevice')) || 'Left blank',
          fix: 'Put wkstn-23 in Affected device. It is the managed, compliant workstation John Smith used for the 08:27 HR-FILE-01 request.',
          fixPartial: 'wkstn-09 is in the logs, but its problem is a separate unmanaged-device denial. Name wkstn-23, the workstation John Smith used.',
        }],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', textOf(DISPOSITIONS, dispositionOf(result))) : null)]],
        checks: [{
          label: `Marked as “${textOf(DISPOSITIONS, CORRECT.disposition)}”`,
          expected: () => textOf(DISPOSITIONS, CORRECT.disposition),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === CORRECT.disposition),
          given: (result) => textOf(DISPOSITIONS, dispositionOf(result)) || 'Left blank',
          fix: 'Record the disposition as “authorization granted beyond assigned entitlements”. The access log shows HR-Read was applied to someone outside the HR group.',
        }],
      },
      {
        id: 'escalation',
        title: 'Escalation & route',
        answer: (result, ctx) => {
          if (!record(result)) return [['Escalation required', null], ['Route to department', null]];
          const escalation = field(result, 'escalation');
          return [
            ['Escalation required', blankAs(shown(ctx, 'Escalation required', standard('CASE_RECORD_ESCALATION_OPTIONS', escalation)))],
            ['Route to department', escalation === 'required' ? blankAs(shown(ctx, 'Route to department', textOf(DEPARTMENTS, field(result, 'escalateTo')))) : 'Not applicable'],
          ];
        },
        checks: [
          {
            label: 'Escalation marked as Required',
            expected: 'Required',
            // Scorer: escalation points need escalation === 'required'; 'not-required' is also a critical error.
            test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
            given: (result) => standard('CASE_RECORD_ESCALATION_OPTIONS', field(result, 'escalation')) || 'Left blank',
            fix: 'Set Escalation to Required. Only the team that owns access policy can remove the extra permission, which is beyond an analyst’s authority.',
          },
          {
            label: `Routed to the team that can correct the access policy (${best().text})`,
            expected: () => best().text,
            when: (result) => field(result, 'escalation') === 'required',
            // Scorer: points = round(fit/100 × 30); fit below 40 bounces and earns nothing.
            test: (result) => {
              const chosen = byId(DEPARTMENTS, field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= BOUNCE_BELOW ? 'partial' : false;
            },
            given: (result) => (byId(DEPARTMENTS, field(result, 'escalateTo')) || {}).text || 'No department chosen',
            fix: (result) => {
              const chosen = byId(DEPARTMENTS, field(result, 'escalateTo'));
              return chosen && chosen.bounce ? chosen.bounce : 'Route the case to Identity Response, who own the access policy and can correct it.';
            },
            fixPartial: (result) => `${(byId(DEPARTMENTS, field(result, 'escalateTo')) || {}).note} Route to Identity Response next time.`,
          },
        ],
      },
      {
        id: 'finding',
        title: FINDING_LABEL,
        answer: (result, ctx) => [[FINDING_LABEL, blankAs(record(result) ? shown(ctx, FINDING_LABEL, textOf(FINDINGS, findingOf(result))) : null)]],
        checks: [{
          label: `Finding recorded as “${textOf(FINDINGS, CORRECT.finding)}”`,
          expected: () => textOf(FINDINGS, CORRECT.finding),
          test: (result) => (findingOf(result) === null ? null : findingOf(result) === CORRECT.finding),
          given: (result) => textOf(FINDINGS, findingOf(result)) || 'Left blank',
          fix: 'Choose “Excessive authorization”. The 08:27 record shows HR-Read applied to John Smith, who is not in the HR-Read group.',
        }],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? (record(result).notes || '') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_FULL_CREDIT,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: who got what access, why it was wrong, and who should fix it.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result, ctx) => (record(result) ? ctx.text() : null),
          pieces: EVIDENCE,
          fix: (missing) => `Back your finding with the evidence: your note does not mention ${missing.join(', ')}. Say what each record showed.`,
        },
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

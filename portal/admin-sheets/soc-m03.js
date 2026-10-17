/* Submission Sheet — Module 03 Prove It, CASE-MN-517 / INC-MN-517 (overnight
 * password spray on 203.0.113.77, m.ortiz compromised through legacy IMAP,
 * inbox forwarding rule). Lab key 'lab-siem-triage'.
 *
 * Answer key and scoring: portal/soc-analyst-module-03-environment.js.
 *   M03E_RUBRIC (competencies, items, points, critical rules)  line ~510
 *   moduleThreeScoreAssessment(work)                           line ~609
 *   M03E_CHILD_INCIDENTS, m03eResolutionScore                  lines ~323-380
 *   M03E_INCIDENT_LINK_EXPECTATIONS                            line ~317
 * This sheet RE-RUNS moduleThreeScoreAssessment() on the saved attempt
 * (`scorer` below) and reads each item's hit/miss from its output, so a check
 * can never disagree with the points the student was given. Labels come from
 * the rubric items themselves.
 *
 * Saved payload (m03eSubmitAssessment): result.case_record = the ticket
 * (status, severity, affectedUser/Device, verdict, escalation/escalateTo,
 * accountStatus{}, indicators[], actions[], handoff{4 parts}, notes,
 * actionHistory, alertIncidentLinks[], incidentResolutions{children,parentClosed}),
 * result.case_display (ticket rows as the student saw them), result.assessment
 * (selected_evidence[], pinned_evidence[] lines, query_log (last 40),
 * query_summary (added 2026-10-17), child_incident_resolutions,
 * recommended-response labels), result.breakdown ("earned / max" per
 * competency), result.feedback, result.simulator_performance.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const rubric = () => (typeof M03E_RUBRIC !== 'undefined' ? M03E_RUBRIC : null);
  const prove = () => (typeof M03E_PROVE !== 'undefined' ? M03E_PROVE : null);
  const children = () => (typeof M03E_CHILD_INCIDENTS !== 'undefined' ? M03E_CHILD_INCIDENTS : []);
  const list = (name) => ({
    users: typeof M03E_USER_OPTIONS !== 'undefined' ? M03E_USER_OPTIONS : [],
    devices: typeof M03E_DEVICE_OPTIONS !== 'undefined' ? M03E_DEVICE_OPTIONS : [],
    departments: typeof M03E_DEPARTMENT_OPTIONS !== 'undefined' ? M03E_DEPARTMENT_OPTIONS : [],
    dispositions: typeof M03E_DISPOSITION_OPTIONS !== 'undefined' ? M03E_DISPOSITION_OPTIONS : [],
    statuses: typeof M03E_ACCOUNT_STATUSES !== 'undefined' ? M03E_ACCOUNT_STATUSES.filter(([id]) => id).map(([id, text]) => ({ id, text })) : [],
    indicators: typeof M03E_INDICATORS !== 'undefined' ? M03E_INDICATORS.map(([id, text]) => ({ id, text })) : [],
    actions: typeof M03E_ACTIONS !== 'undefined' ? M03E_ACTIONS.map(([id, text]) => ({ id, text })) : [],
  }[name] || []);
  const accounts = () => (typeof M03E_ACCOUNTS_PROVE !== 'undefined' ? M03E_ACCOUNTS_PROVE : []);
  const accountLabel = (id) => (typeof M03E_IDENTITY_LABEL !== 'undefined' && M03E_IDENTITY_LABEL[id]) || id;
  const linkRule = () => (typeof M03E_INCIDENT_LINK_EXPECTATIONS !== 'undefined' ? M03E_INCIDENT_LINK_EXPECTATIONS.prove : { incidentId: 'INC-MN-517', supported: [], unrelated: [] });
  const std = (name, id) => {
    const options = { status: typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [],
      severity: typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [],
      escalation: typeof CASE_RECORD_ESCALATION_OPTIONS !== 'undefined' ? CASE_RECORD_ESCALATION_OPTIONS : [] }[name] || [];
    return (options.find((option) => option.id === id) || {}).text || id || '';
  };
  const byId = (options, id) => options.find((option) => option.id === id) || null;
  const textOf = (options, id) => (byId(options, id) || {}).text || id || '';
  // The ticket shows the shared disposition labels (case-record.js) over the module's own.
  const dispositionLabel = (id) => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' && CASE_RECORD_DISPOSITION_LABELS[id]) || textOf(list('dispositions'), id);
  const blankAs = (value) => (value === null ? null : value || 'Left blank');

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'verdict') || field(result, 'disposition') : null);
  const arrayOf = (result, key) => (record(result) && Array.isArray(record(result)[key]) ? record(result)[key] : null);
  const statusOf = (result, account) => {
    const r = record(result);
    return r && r.accountStatus && typeof r.accountStatus === 'object' ? r.accountStatus[account] || '' : r ? '' : null;
  };
  const shown = (ctx, label, fallback) => {
    const value = ctx.display(label);
    return value !== null && value !== 'Not provided' ? value : fallback;
  };

  // ------------------------------------------------ re-run the module scorer
  function rescore(result) {
    if (typeof moduleThreeScoreAssessment !== 'function') return null;
    const r = record(result);
    if (!r) return null;
    const a = result.assessment && typeof result.assessment === 'object' ? result.assessment : {};
    const summary = a.query_summary && typeof a.query_summary === 'object' ? a.query_summary : null;
    const queryLog = summary
      ? [{ sources: Array.isArray(summary.sources_queried) ? summary.sources_queried : [], pivot: summary.cross_source_pivot === true }]
      : (Array.isArray(a.query_log) ? a.query_log : []);
    return moduleThreeScoreAssessment({
      determination: r,
      pins: Array.isArray(a.selected_evidence) ? a.selected_evidence : [],
      queryLog,
      incidentLinks: Array.isArray(r.alertIncidentLinks) ? r.alertIncidentLinks : [],
      incidentResolutions: r.incidentResolutions,
    });
  }
  const hasAssessment = (result) => Boolean(result.assessment && typeof result.assessment === 'object' && Array.isArray(result.assessment.selected_evidence));

  const itemsOf = (compId, predicate = () => true) => {
    const comp = rubric() && rubric().competencies.find((c) => c.id === compId);
    return comp ? comp.items.filter(predicate) : [];
  };
  const tagOf = (item) => (item.pts > 0 ? `${item.level ? `[${item.level}] ` : ''}${item.label} (+${item.pts})` : `${item.label} (${item.pts})`);
  // true = the scorer credited (or deducted for) this item; null = cannot tell.
  function hit(ctx, compId, item) {
    const comp = ctx.scorerResult && ctx.scorerResult.competencies.find((c) => c.id === compId);
    if (!comp) return null;
    return (item.pts > 0 ? comp.evidence : comp.deductions).includes(tagOf(item));
  }
  const critical = (id) => (rubric() ? rubric().critical.find((c) => c.id === id) : null);
  const criticalMet = (ctx, id) => {
    const c = critical(id);
    return c && ctx.scorerResult ? !ctx.scorerResult.criticalMisses.includes(c.label) : null;
  };
  const lower = (text) => String(text).charAt(0).toLowerCase() + String(text).slice(1);
  const stripLevel = (text) => String(text).replace(/^(Unsupported|Unsafe):\s*/, '');

  /* A scorer-driven group: one ✓/✗ line per rubric item (all = pass, some = ◐,
   * none = ✗). The framework's evidence group matches terms in a text, so the
   * text handed to it is the list of item tokens the scorer credited. */
  function hitGroup({ label, compId, items, needsAssessment, fix }) {
    return {
      label,
      text: (result, ctx) => {
        if (!ctx.scorerResult || (needsAssessment && !hasAssessment(result))) return null;
        return items().map((item, index) => (hit(ctx, compId, item) ? `p${index}` : '')).join(' ');
      },
      pieces: () => items().map((item, index) => ({ name: lower(item.label), short: lower(item.label), label: item.label, terms: [`p${index}`] })),
      fix: fix || ((missing) => `Add what is missing: ${missing.join('; ')}.`),
    };
  }
  // A scorer deduction: ✓ when the student avoided it; small deductions are
  // "partly there", unsafe or large ones are ✗.
  const avoidCheck = (compId, item) => ({
    label: `Avoided ${item.unsafe ? 'an unsafe step' : 'an unsupported call'}: ${lower(stripLevel(item.label))}`,
    expected: 'Not done',
    test: (result, ctx) => {
      const h = hit(ctx, compId, item);
      if (h === null) return null;
      return !h ? true : item.unsafe || item.pts <= -5 ? false : 'partial';
    },
    given: 'Done',
    fix: `Take this out: ${lower(stripLevel(item.label))}. The records do not support it${item.unsafe ? ' and it could cause harm' : ''}.`,
  });

  const tierTest = (options, key) => (result) => {
    const value = field(result, key);
    if (value === null) return null;
    const tier = (byId(options, value) || {}).tier;
    return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
  };
  const principalText = (options) => (options.find((o) => o.tier === 'principal') || {}).text || '';
  const pivotText = (options) => (options.find((o) => o.tier === 'pivot') || {}).text || '';

  const NOT_ASSESSED = 'Left blank';
  const scopeItems = () => itemsOf('scope');
  const isIndicator = (item) => /indicator/i.test(item.label);

  AdminSubmissionSheet.register(['lab-siem-triage'], {
    title: 'Module 03 · PROVE IT — SIEM Alert Triage',
    fixture: prove,
    scorer: (result) => rescore(result),
    caseId: () => `${(prove() && prove().caseId) || 'CASE-MN-517'} · ${linkRule().incidentId}`,
    rubric: (result, ctx) => {
      const scored = ctx.scorerResult;
      const breakdown = result.breakdown && typeof result.breakdown === 'object' && !Array.isArray(result.breakdown) ? result.breakdown : null;
      if (breakdown) {
        return Object.entries(breakdown).map(([label, value]) => {
          const match = /^(-?\d+)\s*\/\s*(\d+)/.exec(String(value));
          const comp = scored && scored.competencies.find((c) => c.label === label);
          return { label, earned: match ? Number(match[1]) : String(value), max: match ? Number(match[2]) : null, misses: comp ? comp.misses : [], deductions: comp ? comp.deductions : [], evidence: comp ? comp.evidence : [] };
        });
      }
      return scored ? scored.competencies.map((c) => ({ label: c.label, earned: c.earned, max: c.max, misses: c.misses, deductions: c.deductions, evidence: c.evidence })) : [];
    },
    sections: [
      {
        id: 'case-status',
        title: 'Case & status',
        required: false,
        answer: (result, ctx) => [
          ['Case', shown(ctx, 'Case', (prove() && prove().caseId) || '—')],
          ['Incident', linkRule().incidentId],
          ['Status', blankAs(record(result) ? shown(ctx, 'Status', std('status', field(result, 'status'))) : null)],
        ],
        checks: [{
          label: 'Case left open while Identity Response acts (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: moduleThreeScoreAssessment() does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => std('status', field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The accounts still have to be cleaned up, so it is not resolved yet.',
        }],
      },
      {
        id: 'severity',
        title: 'Severity',
        answer: (result, ctx) => [['Severity', blankAs(record(result) ? shown(ctx, 'Severity', std('severity', severityOf(result))) : null)]],
        checks: [{
          label: 'Severity set to High (Critical is also accepted)',
          expected: 'High or Critical',
          // Scorer: high/critical = full, medium = partial (variant), anything else none.
          test: (result, ctx) => {
            if (severityOf(result) === null) return null;
            const [full] = itemsOf('verdict', (item) => /severity/i.test(item.label) && !item.variant);
            const [partial] = itemsOf('verdict', (item) => /severity/i.test(item.label) && item.variant);
            if (hit(ctx, 'verdict', full)) return true;
            return partial && hit(ctx, 'verdict', partial) ? 'partial' : false;
          },
          given: (result) => std('severity', severityOf(result)) || 'Left blank',
          fix: 'Set Severity to High. An attacker is inside a Finance mailbox and has downloaded payroll and bank files.',
          fixPartial: 'Medium under-rates this: an attacker is reading a Finance mailbox and downloaded payroll and bank files. Rate it High.',
        }],
      },
      {
        id: 'affected-user',
        title: 'Affected user',
        required: false,
        answer: (result) => [['Affected user', blankAs(record(result) ? textOf(list('users'), field(result, 'affectedUser')) : null)]],
        checks: [{
          // Advisory: the module notes that user/device picks are informational and unscored.
          label: 'Names the account the attacker got into (m.ortiz)',
          expected: () => principalText(list('users')),
          test: tierTest(list('users'), 'affectedUser'),
          given: (result) => textOf(list('users'), field(result, 'affectedUser')) || 'Left blank',
          fix: () => `Put ${principalText(list('users')).split(' (')[0]} in Affected user. That account signed in from the attacker's address and created the forwarding rule.`,
          fixPartial: () => `${(pivotText(list('users')) || '').split(' (')[0]} had a correct password and a denied MFA push, but the attacker only got into ${principalText(list('users')).split(' (')[0]}. Name that account.`,
        }],
      },
      {
        id: 'affected-device',
        title: 'Affected device',
        required: false,
        answer: (result) => [['Affected device', blankAs(record(result) ? textOf(list('devices'), field(result, 'affectedDevice')) : null)]],
        checks: [{
          label: () => `Names the system where the attacker acted (${principalText(list('devices'))})`,
          expected: () => principalText(list('devices')),
          test: tierTest(list('devices'), 'affectedDevice'),
          given: (result) => textOf(list('devices'), field(result, 'affectedDevice')) || 'Left blank',
          fix: () => `Put ${principalText(list('devices'))} in Affected device. The forwarding rule and the 212 mailbox reads happened there.`,
          fixPartial: () => `${pivotText(list('devices'))} holds the downloaded files, but the mailbox rule and mail reads are on ${principalText(list('devices'))}. Name that system.`,
        }],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: () => `Marked as ${dispositionLabel('true-positive').toLowerCase()} (true positive)`,
          expected: () => dispositionLabel('true-positive'),
          test: (result, ctx) => (dispositionOf(result) === null ? null : criticalMet(ctx, 'verdict')),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: 'Record the disposition as confirmed malicious activity. The spray was followed by a legacy-protocol sign-in with no MFA, a forwarding rule and file downloads.',
        }],
      },
      {
        id: 'escalation',
        title: 'Escalation required',
        answer: (result, ctx) => [['Escalation required', blankAs(record(result) ? shown(ctx, 'Escalation required', std('escalation', field(result, 'escalation'))) : null)]],
        checks: [{
          label: () => (itemsOf('response', (item) => /^Escalation/.test(item.label))[0] || { label: 'Escalation marked required' }).label,
          expected: 'Required',
          test: (result, ctx) => {
            if (field(result, 'escalation') === null) return null;
            const [item] = itemsOf('response', (i) => /^Escalation/.test(i.label));
            return item ? hit(ctx, 'response', item) : field(result, 'escalation') === 'required';
          },
          given: (result) => std('escalation', field(result, 'escalation')) || 'Left blank',
          fix: 'Set Escalation to Required. Resetting passwords and removing the rule is Identity Response work, not an analyst task.',
        }],
      },
      {
        id: 'route',
        title: 'Route to department',
        required: false,
        answer: (result, ctx) => [['Route to department', record(result) ? (field(result, 'escalation') === 'required' ? blankAs(shown(ctx, 'Route to department', textOf(list('departments'), field(result, 'escalateTo')))) : 'Not applicable') : null]],
        checks: [{
          label: 'Routed to the team that resets accounts and sessions (Identity Response)',
          expected: () => (list('departments').slice().sort((a, b) => b.fit - a.fit)[0] || {}).text,
          when: (result) => field(result, 'escalation') === 'required',
          // Advisory: the Module 3 scorer does not score the route.
          test: (result) => {
            const chosen = byId(list('departments'), field(result, 'escalateTo'));
            if (!chosen) return false;
            return chosen.fit >= 100 ? true : chosen.fit >= 40 ? 'partial' : false;
          },
          given: (result) => textOf(list('departments'), field(result, 'escalateTo')) || 'No department chosen',
          fix: (result) => (byId(list('departments'), field(result, 'escalateTo')) || {}).bounce || 'Route the case to Identity Response, who reset passwords and revoke sessions.',
          fixPartial: (result) => `${(byId(list('departments'), field(result, 'escalateTo')) || {}).note} Route to Identity Response next time.`,
        }],
      },
      {
        id: 'account-scope',
        title: 'Account scope',
        answer: (result, ctx) => accounts().map((account) => [accountLabel(account), record(result) ? blankAs(shown(ctx, accountLabel(account), textOf(list('statuses'), statusOf(result, account)))) : null]),
        checks: [
          {
            label: () => (critical('primary-account') || { label: 'm.ortiz marked compromised' }).label,
            expected: 'Compromised (attacker access)',
            test: (result, ctx) => (record(result) ? criticalMet(ctx, 'primary-account') : null),
            given: (result) => textOf(list('statuses'), statusOf(result, 'm.ortiz')) || 'Left blank',
            fix: 'Mark m.ortiz as Compromised. The attacker signed in as m.ortiz (A-5012), created an app password and a forwarding rule, and downloaded files.',
          },
          ...itemsOf('scope', (item) => item.pts < 0 && !isIndicator(item)).map((item) => avoidCheck('scope', item)),
        ],
      },
      {
        id: 'other-accounts',
        title: 'Other accounts',
        required: false,
        checks: [
          {
            label: () => (itemsOf('scope', (item) => /d\.hale/.test(item.label) && !item.variant && item.pts > 0)[0] || { label: 'd.hale marked credential-exposed' }).label,
            expected: 'Credential exposed (access blocked)',
            // Scorer: exposed = full (6), compromised = partial (3, over-stated).
            test: (result, ctx) => {
              if (!record(result)) return null;
              const [full] = itemsOf('scope', (item) => /d\.hale/.test(item.label) && !item.variant && item.pts > 0);
              const [over] = itemsOf('scope', (item) => /d\.hale/.test(item.label) && item.variant);
              if (full && hit(ctx, 'scope', full)) return true;
              return over && hit(ctx, 'scope', over) ? 'partial' : false;
            },
            given: (result) => textOf(list('statuses'), statusOf(result, 'd.hale')) || 'Left blank',
            fix: 'Mark d.hale as Credential exposed. The password was right but the MFA push was denied, so the attacker did not get in.',
            fixPartial: 'd.hale is flagged, but Compromised over-states it: the MFA push was denied, so the attacker did not get in. Use Credential exposed.',
          },
          {
            label: () => (itemsOf('scope', (item) => /targeted-only/.test(item.label))[0] || { label: 'Other sprayed accounts marked targeted-only' }).label,
            expected: 'Targeted only (no valid credential)',
            test: (result, ctx) => {
              if (!record(result)) return null;
              const [item] = itemsOf('scope', (i) => /targeted-only/.test(i.label));
              return item ? hit(ctx, 'scope', item) : null;
            },
            given: (result) => ['r.kaur', 'p.sato', 'l.brooks', 'a.morgan'].map((a) => `${a}: ${textOf(list('statuses'), statusOf(result, a)) || 'blank'}`).join('; '),
            fix: 'Mark r.kaur, p.sato, l.brooks and a.morgan as Targeted only. They had failed sign-ins from the attacker address but no successful one.',
          },
        ],
      },
      {
        id: 'indicators',
        title: 'Indicators to hand off',
        answer: (result) => [['Indicators to hand off', arrayOf(result, 'indicators') === null ? null : arrayOf(result, 'indicators').map((id) => textOf(list('indicators'), id))]],
        checks: [...itemsOf('scope', (item) => isIndicator(item) && item.pts < 0).map((item) => avoidCheck('scope', item))],
        evidence: hitGroup({
          label: 'Indicators the responders need',
          compId: 'scope',
          items: () => itemsOf('scope', (item) => isIndicator(item) && item.pts > 0),
          fix: (missing) => `Add the indicators the responders need to block and search: ${missing.join('; ')}.`,
        }),
      },
      {
        id: 'actions',
        title: 'Recommended response',
        answer: (result) => [['Recommended response', arrayOf(result, 'actions') === null ? null : arrayOf(result, 'actions').map((id) => textOf(list('actions'), id))]],
        checks: itemsOf('response', (item) => item.pts < 0).map((item) => avoidCheck('response', item)),
        evidence: hitGroup({
          label: 'Response steps the records support',
          compId: 'response',
          items: () => itemsOf('response', (item) => item.pts > 0 && !/^Escalation/.test(item.label)),
          fix: (missing) => `Add the missing response steps: ${missing.join('; ')}.`,
        }),
      },
      {
        id: 'handoff',
        title: 'Analyst handoff & work notes',
        response: (result) => {
          const r = record(result);
          if (!r) return [{ label: 'Analyst handoff · student response', text: null }];
          const handoff = r.handoff && typeof r.handoff === 'object' ? r.handoff : {};
          return [
            ['observations', 'Observations: what the logs show'],
            ['analysis', 'Analysis: why the observations support the verdict'],
            ['scope', 'Scope: confirmed and still unknown'],
            ['nextAction', 'Requested next action'],
          ].map(([key, label]) => ({ label: `Handoff · ${label}`, text: typeof handoff[key] === 'string' ? handoff[key] : '' }))
            .concat([{ label: 'Analyst work notes · student response', text: r.notes || '' }]);
        },
        evidence: [
          hitGroup({
            label: 'All four handoff parts written out (40+ characters each)',
            compId: 'documentation',
            items: () => itemsOf('documentation', (item) => /written \(40/.test(item.label)),
            fix: (missing) => `Fill in each handoff part with a real explanation: ${missing.join('; ')}.`,
          }),
          hitGroup({
            label: 'Key evidence named in the handoff and notes',
            compId: 'documentation',
            items: () => itemsOf('documentation', (item) => !/written \(40/.test(item.label)),
            fix: (missing) => `Back your handoff with the evidence: it does not yet cover ${missing.join('; ')}.`,
          }),
        ],
      },
      {
        id: 'alert-links',
        title: 'Alert-to-incident links',
        answer: (result, ctx) => {
          const links = arrayOf(result, 'alertIncidentLinks');
          if (links === null) return [['Alerts linked to the incident', ctx.display('Alert-to-incident links')]];
          const title = (id) => ((prove() && prove().alerts) || []).find((alert) => alert.id === id);
          return [['Alerts linked to the incident', links.length ? links.map((link) => `${link.alertId}${title(link.alertId) ? ` (${title(link.alertId).title})` : ''} → ${link.incidentId}`) : 'None recorded']];
        },
        checks: itemsOf('incident-association', (item) => item.pts < 0).map((item) => avoidCheck('incident-association', item)),
        evidence: hitGroup({
          label: () => `Linked the alerts that support ${linkRule().incidentId}`,
          compId: 'incident-association',
          items: () => itemsOf('incident-association', (item) => item.pts > 0),
          fix: (missing) => `Link the supporting alerts to ${linkRule().incidentId}: ${missing.join('; ')}.`,
        }),
      },
      {
        id: 'child-incidents',
        title: 'Child incident resolutions',
        answer: (result) => {
          const r = record(result);
          if (!r || !r.incidentResolutions || typeof r.incidentResolutions !== 'object') return [['Child incidents', null]];
          const rows = r.incidentResolutions.children || {};
          return [
            ...children().map((incident) => {
              const row = rows[incident.id] || {};
              return [`${incident.id} · ${incident.label}`, row.resolved ? `Resolved as ${String(row.disposition || 'no disposition').replace('-', ' ')}; evidence cited: ${row.evidence || 'none'}` : 'Not resolved'];
            }),
            ['Parent case', r.incidentResolutions.parentClosed ? 'Closed' : 'Left open'],
          ];
        },
        response: (result) => {
          const r = record(result);
          if (!r || !r.incidentResolutions || typeof r.incidentResolutions !== 'object') return [{ label: 'Resolution notes · student response', text: null }];
          const rows = r.incidentResolutions.children || {};
          return children().map((incident) => ({ label: `${incident.id} · resolution note`, text: (rows[incident.id] || {}).note || '' }));
        },
        checks: [{
          label: 'No child incident was closed with a disposition the records do not support',
          expected: 'Supported dispositions only',
          test: (result, ctx) => {
            if (!record(result) || !ctx.scorerResult) return null;
            const comp = ctx.scorerResult.competencies.find((c) => c.id === 'incident-resolution');
            return comp ? comp.deductions.length === 0 : null;
          },
          given: (result, ctx) => {
            const comp = ctx.scorerResult && ctx.scorerResult.competencies.find((c) => c.id === 'incident-resolution');
            return comp && comp.deductions.length ? comp.deductions.join('; ') : 'None';
          },
          fix: 'Re-check the child incident you closed with the wrong disposition against its own alert records. A typo then a normal sign-in is benign; the spray success plus forwarding rule is malicious.',
        }],
        evidence: {
          label: 'Each child incident resolved correctly, then the parent closed',
          text: (result, ctx) => {
            const comp = ctx.scorerResult && ctx.scorerResult.competencies.find((c) => c.id === 'incident-resolution');
            if (!comp || !record(result) || !record(result).incidentResolutions) return null;
            return [...children().map((incident, index) => (comp.evidence.some((line) => line.startsWith(`${incident.id} resolved with supported`)) ? `c${index}` : '')),
              comp.evidence.some((line) => line.startsWith('Parent case closed')) ? 'cparent' : ''].join(' ');
          },
          pieces: () => [
            ...children().map((incident, index) => ({ name: `${incident.id} resolved as ${incident.disposition.replace('-', ' ')}`, short: `${incident.id} as ${incident.disposition.replace('-', ' ')} with its evidence (${incident.evidence.join(', ')}) cited in the note`, label: `${incident.id} (${incident.label}) resolved as ${incident.disposition.replace('-', ' ')}, citing its records (${incident.evidence.join(', ')}) in the note`, terms: [`c${index}`] })),
            { name: 'the parent case closed after both children', short: 'closing the parent case after both children', label: 'Parent case closed after both child incidents were resolved', terms: ['cparent'] },
          ],
          fix: (missing) => `Finish the child incidents: ${missing.join('; ')}.`,
        },
      },
      {
        id: 'evidence-pinned',
        title: 'Evidence pinned',
        answer: (result) => {
          const a = result.assessment && typeof result.assessment === 'object' ? result.assessment : null;
          if (!a || !Array.isArray(a.pinned_evidence)) return [['Records pinned to the ticket', null]];
          return [['Records pinned to the ticket', a.pinned_evidence.length ? a.pinned_evidence : 'None pinned']];
        },
        evidence: hitGroup({
          label: 'Pinned the records the findings rest on',
          compId: 'evidence',
          needsAssessment: true,
          items: () => itemsOf('evidence', (item) => item.pts > 0),
          fix: (missing) => `Pin the records that prove your findings: ${missing.join('; ')}.`,
        }),
      },
      {
        id: 'investigation',
        title: 'Search technique',
        required: false,
        answer: (result) => {
          const a = result.assessment && typeof result.assessment === 'object' ? result.assessment : null;
          if (!a) return [['Searches run', null]];
          const summary = a.query_summary && typeof a.query_summary === 'object' ? a.query_summary : null;
          const log = Array.isArray(a.query_log) ? a.query_log : [];
          return [
            ['Searches run', summary ? String(summary.total) : `${log.length} (last 40 kept)`],
            ['Data sources searched', summary ? (summary.sources_queried.join(', ') || 'None') : [...new Set(log.flatMap((q) => q.sources || []))].join(', ') || 'None'],
            ['Combined records from two sources on one IP or session', summary ? (summary.cross_source_pivot ? 'Yes' : 'No') : (log.some((q) => q.pivot === true) ? 'Yes' : 'No')],
            ['Most recent searches', log.slice(-5).map((q) => String(q.query || '').replace(/\s+/g, ' ').slice(0, 200))],
          ];
        },
        evidence: hitGroup({
          label: 'Searched the right data and followed the attacker across sources',
          compId: 'investigation',
          needsAssessment: true,
          items: () => itemsOf('investigation', (item) => item.pts > 0),
          fix: (missing) => `Run the searches that show the attack: ${missing.join('; ')}.`,
        }),
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

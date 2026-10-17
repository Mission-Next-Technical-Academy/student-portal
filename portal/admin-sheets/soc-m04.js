/* Submission Sheet — Module 04 Prove It, CASE-044424 / INC-044733 (distributed
 * password spray from 198.51.100.64, acct-44 signed in, harmless retries from
 * 203.0.113.77 after the CR-204 password rotation). Lab key
 * 'lab-detection-rule'.
 *
 * Answer key: SocM04AssessmentData.scenario.truth (soc-m04-assessment-data.js)
 * plus the ticket rosters/options in soc-analyst-module-04.js
 * (MODULE_FOUR_ENTITY_ROSTER, MODULE_FOUR_DEPARTMENT_OPTIONS,
 * MODULE_FOUR_INTEL_FINDING_OPTIONS, MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS).
 * Scoring it mirrors: SocM04AssessmentScorer.score() (soc-m04-assessment-scorer.js)
 * over SocM04AssessmentRubric.extract() (soc-m04-assessment-rubric.js). The
 * scorer saves each criterion's points, max, evidence and misses in
 * result.breakdown, so every console-work section below reads its criterion
 * from there and cannot disagree with the points the student was given.
 *
 * The ticket's severity, affected user/device, route and the two finding
 * selects are NOT scored by SocM04AssessmentScorer (the older
 * moduleFourCaseScore() is unused), so those sections are advisory. The
 * scorer's case-documentation criterion checks: disposition is a true
 * positive (rubric.js ~line 190, accepts 'true-positive', 'true_positive',
 * 'confirmed-malicious'), escalation or route is set, notes >= 40 characters
 * naming the attack and the account/IOC.
 *
 * Saved payload (m04-assessment submit, soc-analyst-module-04.js ~1855):
 * result.case_record (ticket + findings + notes + actionHistory),
 * result.case_display (ticket rows as the student saw them), result.breakdown
 * (criterion list), result.review_payload (criteria + intelligenceVerdicts),
 * result.feedback, result.critical_errors and, from 2026-10-17,
 * result.work_summary (IOCs, rules, runs, alerts, automation) because the
 * console work itself was not saved before.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM04AssessmentData !== 'undefined' ? SocM04AssessmentData : null);
  const scenario = () => (data() ? data().scenario : null);
  const truth = () => (scenario() ? scenario().truth : null);
  const roster = (kind) => (typeof MODULE_FOUR_ENTITY_ROSTER !== 'undefined' ? MODULE_FOUR_ENTITY_ROSTER[kind] : []) || [];
  const departments = () => (typeof MODULE_FOUR_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_FOUR_DEPARTMENT_OPTIONS : []);
  const intelOptions = () => (typeof MODULE_FOUR_INTEL_FINDING_OPTIONS !== 'undefined' ? MODULE_FOUR_INTEL_FINDING_OPTIONS : []);
  const ruleOptions = () => (typeof MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS !== 'undefined' ? MODULE_FOUR_RULE_DISPOSITION_FINDING_OPTIONS : []);
  const bounceBelow = () => (typeof MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD !== 'undefined' ? MODULE_FOUR_DEPARTMENT_BOUNCE_THRESHOLD : 40);
  // rubric.js case-documentation: disposition counts as supported when it is one of these.
  const TRUE_POSITIVE_IDS = ['true-positive', 'true_positive', 'confirmed-malicious'];
  // Ticket answers that the module's own spec treats as correct (soc-analyst-module-04.js
  // legacy moduleFourCaseScore() and the feedback it wrote): High, corroborates, publish-monitored.
  const CORRECT_SEVERITY = 'high';
  const CORRECT_INTEL = 'corroborates';
  const CORRECT_RULE = 'publish-monitored';
  // case-record.js CASE_RECORD_NOTES_MIN is 80; this ticket sets notesMin 100 (moduleFourCaseSpec).
  const NOTES_MIN = 100;

  const byId = (list, id) => list.find((option) => option.id === id) || null;
  const textOf = (list, id) => (byId(list, id) || {}).text || id || '';
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

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const findingOf = (result, name) => {
    const r = record(result);
    if (!r) return null;
    return r.findings && typeof r.findings === 'object' && typeof r.findings[name] === 'string' ? r.findings[name] : '';
  };
  const criteria = (result) => (Array.isArray(result.breakdown) ? result.breakdown.filter((c) => c && typeof c === 'object' && c.id) : null);
  const criterion = (result, id) => (criteria(result) || []).find((c) => c.id === id) || null;
  const work = (result) => (result.work_summary && typeof result.work_summary === 'object' ? result.work_summary : null);
  const verdicts = (result) => {
    const payload = result.review_payload && typeof result.review_payload === 'object' ? result.review_payload : null;
    return payload && Array.isArray(payload.intelligenceVerdicts) ? payload.intelligenceVerdicts : null;
  };
  const decisionText = (decision) => ({ malicious: 'Malicious', benign: 'Benign', unknown: 'Unknown (cannot tell from this case)' }[decision] || decision || 'No verdict recorded');
  const tierTest = (list, key) => (result) => {
    const value = field(result, key);
    if (value === null) return null;
    const tier = (byId(list, value) || {}).tier;
    return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
  };
  const principal = (list) => (list.find((o) => o.tier === 'principal') || {});
  const clip = (text, max = 2) => String(text).split(/(?<=[.!?])\s+/).slice(0, max).join(' ');

  /* One section per scored criterion: ✓ full points, ◐ partial credit (the
   * scorer gives half when some evidence was recorded), ✗ nothing. The red-pen
   * note is the scorer's own first two "miss" sentences. */
  function criterionCheck(id, label, fixFallback) {
    return {
      label,
      test: (result) => {
        const c = criterion(result, id);
        if (!c) return null;
        return c.points >= c.max ? true : c.points > 0 ? 'partial' : false;
      },
      given: (result) => {
        const c = criterion(result, id);
        return c ? `${c.points} of ${c.max} points` : null;
      },
      fix: (result) => {
        const c = criterion(result, id);
        const misses = c && Array.isArray(c.misses) ? c.misses.filter(Boolean) : [];
        return misses.length ? clip(misses.join(' ')) : fixFallback;
      },
      fixPartial: (result) => {
        const c = criterion(result, id);
        const misses = c && Array.isArray(c.misses) ? c.misses.filter(Boolean) : [];
        return misses.length ? clip(misses.join(' ')) : fixFallback;
      },
    };
  }
  const list = (value) => (Array.isArray(value) ? value : null);

  // Key pieces the work note should name, from the scenario truth.
  function notePieces() {
    const t = truth() || {};
    const ip = t.maliciousSourceIp || '';
    const account = (t.confirmedCompromisedAccounts || [])[0] || '';
    const retry = t.benignRetry || {};
    return [
      { name: `the attacking source (${ip})`, short: ip, terms: [ip] },
      { name: `the account that was signed into (${account})`, short: account, terms: [account] },
      // case-documentation requires one of these words describing the attack.
      { name: 'the attack type (password spray against many accounts) and the successful sign-in', short: 'the password spray and the successful sign-in', terms: ['spray', 'credential', 'sign-in', 'sign in', 'authentication', 'password'] },
      { name: `the harmless retries (${retry.sourceIp} / ${retry.account}) after the password rotation`, short: 'the harmless retries and why they are harmless', terms: [retry.sourceIp, retry.account, 'cr-204', 'rotation', 'stale', 'cached', 'harmless', 'benign'] },
      { name: 'the threat-intelligence indicator and how far it can be trusted', short: 'the intelligence indicator', terms: ['ioc', 'indicator', 'threat desk', 'm04-r-002', 'intelligence', 'confidence'] },
      { name: 'how the detection rule was tuned (grouping, threshold, window, exclusion)', short: 'how you tuned the rule', terms: ['threshold', 'distinct', 'group', 'exclu', 'suppress', 'tuned', 'tuning', 'window'] },
      { name: 'the recommended next step (Identity Response resets or contains the account)', short: 'the recommended next step', terms: ['identity response', 'reset', 'revoke', 'contain', 'escalat', 'monitor'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  AdminSubmissionSheet.register(['lab-detection-rule'], {
    title: 'Module 04 · PROVE IT — Detection Rule Review & Enrichment',
    fixture: data,
    caseId: () => {
      const s = scenario();
      return s ? [s.caseId, s.incidentId].filter(Boolean).join(' · ') : 'CASE-044424 · INC-044733';
    },
    // The scorer's evidence strings include raw ids (e.g. "true-positive", "identity-response");
    // show them in the words the student saw.
    rubric: (result) => {
      const plain = (text) => {
        const id = String(text);
        return id === 'true-positive' ? dispositionLabel(id) : textOf(departments(), id) !== id ? textOf(departments(), id) : id;
      };
      return (criteria(result) || []).map((c) => ({
        label: String(c.label || c.id),
        earned: c.points ?? 0,
        max: c.max ?? null,
        misses: (Array.isArray(c.misses) ? c.misses : []).filter(Boolean).map(String),
        deductions: (Array.isArray(c.deductions) ? c.deductions : []).filter((d) => d && d.points).map((d) => `-${d.points} ${d.reason || ''}`.trim()),
        evidence: (Array.isArray(c.supportingEvidence) ? c.supportingEvidence : []).filter(Boolean).map(plain),
      }));
    },
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
          label: 'Case left open while Identity Response acts (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: SocM04AssessmentScorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result) => std('status', field(result, 'status')) || 'Left blank',
          fix: 'Keep the case In Progress. The compromised account still has to be reset, so it is not resolved yet.',
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
          // Advisory: not scored by the live scorer; High is the module's documented answer.
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === CORRECT_SEVERITY),
          given: (result) => std('severity', severityOf(result)) || 'Left blank',
          fix: 'Set Severity to High. A distributed password spray ended in a successful sign-in to a real account.',
        }],
      },
      {
        id: 'affected-user',
        title: 'Affected user',
        required: false,
        answer: (result) => [['Affected user', blankAs(record(result) ? textOf(roster('users'), field(result, 'affectedUser')) : null)]],
        checks: [{
          label: () => `Names the account that was signed into (${principal(roster('users')).text})`,
          expected: () => principal(roster('users')).text,
          test: tierTest(roster('users'), 'affectedUser'),
          given: (result) => textOf(roster('users'), field(result, 'affectedUser')) || 'Left blank',
          fix: () => `Put ${principal(roster('users')).text} in Affected user. It is the only account with a successful sign-in from the spray source.`,
          fixPartial: () => `The other sprayed accounts were targeted but not signed into. Name ${principal(roster('users')).text}, the account that was.`,
        }],
      },
      {
        id: 'affected-device',
        title: 'Affected device (source address)',
        required: false,
        answer: (result) => [['Affected device', blankAs(record(result) ? textOf(roster('devices'), field(result, 'affectedDevice')) : null)]],
        checks: [{
          label: () => `Names the attacking source address (${principal(roster('devices')).text})`,
          expected: () => principal(roster('devices')).text,
          test: tierTest(roster('devices'), 'affectedDevice'),
          given: (result) => textOf(roster('devices'), field(result, 'affectedDevice')) || 'Left blank',
          fix: () => `Put ${principal(roster('devices')).text} in Affected device. All five sprayed accounts and the successful sign-in came from it.`,
          fixPartial: () => `${(roster('devices').find((o) => o.tier === 'pivot') || {}).text} is the harmless retry source, not the attacker. Name ${principal(roster('devices')).text}.`,
        }],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: `Marked as ${String(dispositionLabel('true-positive')).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel('true-positive'),
          // Scorer (case-documentation): accepts the ids in TRUE_POSITIVE_IDS.
          test: (result) => (dispositionOf(result) === null ? null : TRUE_POSITIVE_IDS.includes(String(dispositionOf(result)).toLowerCase())),
          given: (result) => dispositionLabel(dispositionOf(result)) || 'Left blank',
          fix: 'Record the disposition as confirmed malicious activity. A distributed spray followed by a successful sign-in is a real attack, not a false alarm.',
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
            // Advisory: the live scorer only checks that escalation OR a route is set (rubric.js case-documentation).
            test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
            given: (result) => std('escalation', field(result, 'escalation')) || 'Left blank',
            fix: 'Set Escalation to Required. Resetting the signed-in account is an Identity Response task, not an analyst task.',
          },
          {
            label: () => `Routed to the team that can reset the account (${(departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text})`,
            expected: () => (departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            test: (result) => {
              const chosen = byId(departments(), field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= bounceBelow() ? 'partial' : false;
            },
            given: (result) => textOf(departments(), field(result, 'escalateTo')) || 'No department chosen',
            fix: (result) => (byId(departments(), field(result, 'escalateTo')) || {}).bounce || 'Route the case to Identity Response, who own credential reset and containment.',
            fixPartial: (result) => `${(byId(departments(), field(result, 'escalateTo')) || {}).note} Route to Identity Response next time.`,
          },
        ],
      },
      {
        id: 'findings',
        title: 'Intelligence interpretation & rule decision',
        required: false,
        answer: (result, ctx) => [
          ['Intelligence interpretation', blankAs(record(result) ? shown(ctx, 'Intelligence interpretation', textOf(intelOptions(), findingOf(result, 'intelAssessment'))) : null)],
          ['Rule deployment decision', blankAs(record(result) ? shown(ctx, 'Rule deployment decision', textOf(ruleOptions(), findingOf(result, 'ruleDisposition'))) : null)],
        ],
        checks: [
          {
            label: () => `Intelligence read as “${textOf(intelOptions(), CORRECT_INTEL)}”`,
            expected: () => textOf(intelOptions(), CORRECT_INTEL),
            // Advisory: not scored by the live scorer.
            test: (result) => (findingOf(result, 'intelAssessment') === null ? null : findingOf(result, 'intelAssessment') === CORRECT_INTEL),
            given: (result) => textOf(intelOptions(), findingOf(result, 'intelAssessment')) || 'Left blank',
            fix: 'Treat the threat report as supporting context, not proof. It matches the spray source, but the sign-in records are what prove the attack.',
          },
          {
            label: () => `Rule decision: “${textOf(ruleOptions(), CORRECT_RULE)}”`,
            expected: () => textOf(ruleOptions(), CORRECT_RULE),
            test: (result) => (findingOf(result, 'ruleDisposition') === null ? null : findingOf(result, 'ruleDisposition') === CORRECT_RULE),
            given: (result) => textOf(ruleOptions(), findingOf(result, 'ruleDisposition')) || 'Left blank',
            fix: 'Publish the tuned rule with monitoring and a rollback note. Keeping the old rule leaves the harmless-retry noise, and disabling it removes detection.',
          },
        ],
      },
      {
        id: 'indicator-verdicts',
        title: 'Indicator verdicts',
        answer: (result) => {
          const rows = verdicts(result);
          if (!rows) return [['Verdict on each indicator', null]];
          return rows.map((row) => [`${row.value} (${row.origin || row.type})`, decisionText(row.decision)]);
        },
        response: (result) => {
          const rows = verdicts(result);
          if (!rows) return [{ label: 'Indicator reasoning · student response', text: null }];
          return rows.map((row) => ({ label: `${row.value} · reasoning`, text: row.rationale || '' }));
        },
        checks: [{
          label: 'No indicator was called the opposite of what the case records show',
          expected: 'No contradicted verdicts',
          test: (result) => {
            const rows = verdicts(result);
            return rows ? !rows.some((row) => row.assessment === 'contradicted') : null;
          },
          given: (result) => {
            const rows = verdicts(result) || [];
            const bad = rows.filter((row) => row.assessment === 'contradicted').map((row) => `${row.value}: ${decisionText(row.decision)}`);
            return bad.length ? bad.join('; ') : 'None';
          },
          fix: (result) => {
            const rows = (verdicts(result) || []).filter((row) => row.assessment === 'contradicted');
            return `Re-read the case records for ${rows.map((row) => row.value).join(', ')}: your verdict contradicts them. If the case holds no evidence either way, mark the indicator Unknown and say why.`;
          },
        }],
        evidence: {
          label: 'Each indicator judged correctly with a reason that cites the case',
          text: (result) => {
            const rows = verdicts(result);
            if (!rows) return null;
            return rows.map((row, index) => (row.assessment === 'correct' && row.points >= row.max ? `v${index}` : '')).join(' ');
          },
          pieces: (result) => (verdicts(result) || []).map((row, index) => {
            const expected = (truth().indicatorDecisions || {})[row.indicatorId];
            const wanted = expected === 'unknown' ? 'left Unknown, because this case holds no evidence either way' : `judged ${expected}`;
            return { name: `${row.value} ${wanted}`, short: `${row.value} (${wanted})`, label: `${row.value} ${wanted}, with a reason that ${expected === 'unknown' ? 'explains the gap' : 'cites a record from this case'}`, terms: [`v${index}`] };
          }),
          fix: (missing) => `Fix the indicator verdicts: ${missing.join(', ')}.`,
        },
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? (record(result).notes || '') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_MIN,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: what the original rule missed, how you tuned it, what the sign-in and intelligence show, and what you recommend.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result, ctx) => (record(result) ? ctx.text() : null),
          pieces: notePieces,
          fix: (missing) => `Back your recommendation with the evidence: your note does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'intelligence',
        title: 'Threat intelligence matched to the case',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Indicators in the case', null]];
          return [['Indicators in the case', list(w.iocs).length ? list(w.iocs).map((i) => `${i.value} (${i.type}) · ${i.status} · seen ${String(i.firstSeen).slice(0, 10)} to ${String(i.lastSeen).slice(0, 10)} · report ${i.sourceReportId || 'none'}`) : 'None recorded']];
        },
        checks: [
          criterionCheck('intelligence-corroboration', `Linked ${(truth() || {}).maliciousSourceIp || 'the malicious IP'} to a dated, rated intelligence report and ran an enrichment that matched the incident`, 'Attach the spray source to its intelligence report and run the enrichment so it links to the incident records.'),
        ],
      },
      {
        id: 'ioc-record',
        title: 'Indicator record kept accurate',
        required: false,
        checks: [
          criterionCheck('ioc-lifecycle', 'Kept the malicious IP indicator active, with sensible first/last-seen dates, a linked report and a recorded edit', 'Review the indicator record: it must stay active, have correct dates and a linked report, and show that you edited it.'),
        ],
      },
      {
        id: 'rule',
        title: 'Detection query and rule',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Rules built', null]];
          const rules = list(w.rules) || [];
          if (!rules.length) return [['Rules built', 'None saved']];
          const lines = [];
          rules.forEach((rule) => {
            lines.push(`${rule.name || rule.id}: groups by ${rule.groupingField || '—'}, fires at ${rule.threshold} within ${rule.windowMinutes} minutes, ${rule.enabled ? 'enabled' : 'not enabled'}`);
            if (rule.exclusion && rule.exclusion.enabled) lines.push(`  Exclusion: ${rule.exclusion.field} ${rule.exclusion.operator} ${rule.exclusion.value}`);
            if (rule.suppression && rule.suppression.enabled) lines.push(`  Suppression: repeats grouped by ${rule.suppression.groupField} for ${rule.suppression.windowMinutes} minutes`);
            if (rule.query) lines.push(`  Query: ${String(rule.query).replace(/\s+/g, ' ')}`);
          });
          return [['Rules built', lines]];
        },
        checks: [
          criterionCheck('query-rule-quality', 'Built a focused query and a rule that groups by source, uses a sensible threshold and window, was tested, and was run', 'Build a rule that groups by source address with a threshold of five or fewer and a window of at least twenty minutes. Test the query, then run the rule.'),
        ],
      },
      {
        id: 'schedule',
        title: 'Rule scheduled',
        required: false,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Rule runs', null]];
          const rules = (list(w.rules) || []).filter((rule) => rule.schedule);
          const runs = list(w.executions) || [];
          return [
            ['Schedules set', rules.length ? rules.map((rule) => `${rule.name || rule.id}: every ${rule.schedule.frequencyMinutes} minutes from ${String(rule.schedule.scheduledAt).slice(0, 16).replace('T', ' ')}`) : 'None'],
            ['Runs completed', runs.length ? runs.map((run) => `${run.id}: ${run.mode} run of ${run.ruleId}, ${run.status}`) : 'None'],
          ];
        },
        checks: [
          criterionCheck('scheduled-execution', 'Enabled the rule on a schedule and a scheduled run completed', 'Enable the rule on a schedule of at least every five minutes and let a scheduled run complete.'),
        ],
      },
      {
        id: 'alerts',
        title: 'Alerts raised',
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Alerts the rule raised', null]];
          const benign = (truth() || {}).benignRetry ? truth().benignRetry.eventIds : [];
          const alerts = list(w.alerts) || [];
          return [['Alerts the rule raised', alerts.length ? alerts.map((alert) => `${alert.id}: ${alert.groupingField} ${alert.group}, ${(alert.eventIds || []).length} sign-in records${(alert.eventIds || []).some((id) => benign.includes(id)) ? ' (includes the harmless retries)' : ''}`) : 'No alerts raised']];
        },
        checks: [
          criterionCheck('alert-coverage', `The rule raised an alert for the real spray (${(truth() || {}).maliciousSourceIp || '198.51.100.64'}) covering enough of its sign-in records`, `Run the rule against the telemetry so it raises an alert for the spray source that covers at least ${((truth() || {}).rule || {}).threshold || 5} of its sign-in records.`),
          criterionCheck('alert-tuning', `The rule did not alert on the harmless retries (${((truth() || {}).benignRetry || {}).sourceIp || '203.0.113.77'}) and uses an exclusion or suppression`, 'Tune the rule so the harmless retries no longer alert, using an exclusion or suppression, while the real spray still does.'),
        ],
      },
      {
        id: 'automation',
        title: 'Automation kept safe',
        answer: (result) => {
          const w = work(result);
          if (!w || !w.automation) return [['Automation recorded', null]];
          const a = w.automation;
          return [
            ['Automation actions', list(a.actions) && a.actions.length ? a.actions.map((x) => `${x.id}: ${String(x.type).replace(/_/g, ' ')}`) : 'None recorded'],
            ['Simulated runs', list(a.executions) && a.executions.length ? a.executions.map((x) => `${x.id}: ${x.status}, ${x.readOnly ? 'read-only' : 'NOT read-only'}${x.sideEffects ? `, ${x.sideEffects} side effect(s)` : ''}`) : 'None recorded'],
            ['Approval requests', list(a.approvals) && a.approvals.length ? a.approvals.map((x) => `${x.id}: ${x.status}`) : 'None'],
          ];
        },
        checks: [criterionCheck('automation-boundary', 'Automation only enriched and preserved evidence; any disruptive action waited for human approval', 'Keep automation read-only: enrich and preserve evidence, and send any disruptive action (disable accounts, block) through an approval request that is never executed.')],
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

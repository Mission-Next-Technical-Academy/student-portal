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
 * result.work_summary (moduleFourWorkSummary(): saved queries, IOCs, threat
 * reports the student created or edited, rules with their exclusion /
 * suppression / schedule, runs, alerts with review notes, automation actions,
 * runs, tickets, notifications and approval requests with their reasons)
 * because the console work itself was not saved before. Every reader below
 * is defensive: a field an older attempt lacks is shown as not recorded.
 *
 * Teacher notes (owner, 2026-10-17): plain instructions that quote what the
 * student actually set, in the console's own labels; never the scorer's
 * internal "miss" sentences.
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
  // rubric.js case-documentation: work notes of at least 40 characters that
  // name the attack and the source, account or indicator.
  const DOC_MIN = 40;
  const DOC_ATTACK_TERMS = ['spray', 'credential', 'sign-in', 'sign in', 'authentication'];
  const DOC_ENTITY_TERMS = ['198.51.100.64', 'acct-44', 'ioc', 'indicator'];
  // When the console work (result.work_summary) started being saved.
  const WORK_SINCE = '2026-10-17';
  // When indicator verdicts (result.review_payload.intelligenceVerdicts) started being saved.
  const VERDICTS_SINCE = '2026-10-07';

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
  // The verdict select shows the raw words malicious / benign / unknown (soc-m04-intelligence-ui.js).
  const decisionText = (decision) => decision || 'No verdict recorded';
  const tierTest = (list, key) => (result) => {
    const value = field(result, key);
    if (value === null) return null;
    const tier = (byId(list, value) || {}).tier;
    return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
  };
  const principal = (list) => (list.find((o) => o.tier === 'principal') || {});
  const clip = (text, max = 2) => String(text).split(/(?<=[.!?])\s+/).slice(0, max).join(' ');

  const quoted = (text) => `“${text}”`;
  // 'a', 'a and b', 'a, b and c'
  // ('… and 3 more' from the framework's shortList already carries its 'and'.)
  const andList = (names) => (names.length <= 1 ? names.join('')
    : /^and \d+ more$/.test(names[names.length - 1]) ? names.join(', ')
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
  const cap = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);
  // Several points as one note: the first reads on (lower case after "To strengthen next time:"), the rest are sentences.
  const sentences = (parts) => (parts.filter(Boolean).length ? `${parts.filter(Boolean).map((part, index) => (index ? cap(part) : part)).join('. ')}.` : '');
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  /* One check per scored criterion: ✓ full points, ◐ partial credit, ✗
   * nothing. `explain(result)` writes the red-pen note in plain English from
   * the student's own console work (work_summary) and the scorer's recorded
   * misses; `fixFallback` covers attempts saved without the console work. */
  function criterionCheck(id, label, explain, fixFallback) {
    const note = (result) => {
      const c = criterion(result, id);
      const text = c ? String(explain(result, c) || '').trim() : '';
      return text ? (/[.!?]$/.test(text) ? text : `${text}.`) : fixFallback;
    };
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
      fix: note,
      fixPartial: note,
    };
  }
  const missesOf = (c) => (c && Array.isArray(c.misses) ? c.misses.filter(Boolean).map(String) : []);
  const missed = (c, pattern) => missesOf(c).some((miss) => pattern.test(miss));
  const list = (value) => (Array.isArray(value) ? value : null);
  const arr = (value) => (Array.isArray(value) ? value : []);

  // ------------------------------------------- the student's console work
  const ip = () => (truth() || {}).maliciousSourceIp || '198.51.100.64';
  const account = () => ((truth() || {}).confirmedCompromisedAccounts || [])[0] || 'acct-44';
  const ruleKey = () => (truth() || {}).rule || { threshold: 5, windowMinutes: 20, groupingField: 'sourceIp', matchEventIds: [], excludeEventIds: [] };
  const retry = () => (truth() || {}).benignRetry || { sourceIp: '203.0.113.77', account: 'acct-17', eventIds: [] };
  const iocsOf = (result) => arr((work(result) || {}).iocs);
  const rulesOf = (result) => arr((work(result) || {}).rules);
  const runsOf = (result) => arr((work(result) || {}).executions);
  const alertsOf = (result) => arr((work(result) || {}).alerts);
  const queriesOf = (result) => arr((work(result) || {}).queries);
  const reportsOf = (result) => arr((work(result) || {}).reports || (work(result) || {}).threatReports);
  const automationOf = (result) => ((work(result) || {}).automation && typeof work(result).automation === 'object' ? work(result).automation : {});
  const mainIoc = (result) => iocsOf(result).find((ioc) => String(ioc.value || '').toLowerCase() === ip() && ['ip', 'ipv4'].includes(ioc.type));
  const ruleName = (rule) => quoted(rule.name || rule.id || 'unnamed rule');
  const ruleById = (result, id) => rulesOf(result).find((rule) => rule.id === id);
  // The rule the scorer graded: the most recently run one, else the first saved.
  const gradedRule = (result) => ruleById(result, (runsOf(result).slice(-1)[0] || {}).ruleId) || rulesOf(result)[0] || null;
  const benignIn = (alert) => arr(alert.eventIds).filter((id) => arr(ruleKey().excludeEventIds).includes(id));
  const sprayIn = (alert) => arr(alert.eventIds).filter((id) => arr(ruleKey().matchEventIds).includes(id));
  // " (you …)" only when the console work was saved with the attempt.
  const youDid = (result, text) => (work(result) ? ` (${text})` : '');
  const minRationale = () => (typeof SocM04AssessmentRubric !== 'undefined' && SocM04AssessmentRubric.MIN_RATIONALE) || 25;
  const isDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const AUTOMATION_LABELS = { indicator_enrichment: 'Enrich indicator', evidence_preservation: 'Preserve matching evidence', ticket: 'Save ticket', notification: 'Send simulated notification', disruptive_request: 'Request approval' };
  const APPROVAL_ACTIONS = { account_disable: 'Disable account', session_revoke: 'Revoke session', network_block: 'Block network indicator' };
  const pick = (object, ...keys) => {
    const key = keys.find((name) => object && object[name] !== undefined && object[name] !== null && object[name] !== '');
    return key === undefined ? '' : object[key];
  };

  /* Plain-English notes per scored criterion (soc-m04-assessment-rubric.js
   * extract()). Each returns '' when there is nothing specific to say, and
   * the check falls back to its general instruction. */
  const EXPLAIN = {
    'intelligence-corroboration': (result, c) => {
      const ioc = mainIoc(result);
      if (missed(c, /No IOC matching/)) {
        const values = iocsOf(result).map((item) => item.value).filter(Boolean);
        return `add an IOC for ${ip()} with Type ip and set its Source report to the threat report that names it${youDid(result, values.length ? `your indicators: ${values.join(', ')}` : 'you added no indicators')}`;
      }
      if (missed(c, /lacks a linked, dated report/)) return `set the Source report on the ${ip()} IOC to the dated threat report that rates it, so a reviewer can see who reported it, when and how confident they were${youDid(result, `Source report: ${ioc && ioc.sourceReportId ? quoted(ioc.sourceReportId) : 'none'}`)}`;
      if (missed(c, /enrichment/i)) return `run Enrich indicator on the ${ip()} IOC so it is matched against this incident’s sign-in records${youDid(result, `simulated actions you ran: ${arr(automationOf(result).actions).map((a) => AUTOMATION_LABELS[a.type] || a.type).join(', ') || 'none'}`)}`;
      return '';
    },
    'ioc-lifecycle': (result) => {
      if (!work(result)) return '';
      const ioc = mainIoc(result);
      if (!ioc) return `add an IOC for ${ip()} and keep it accurate: Status active, First seen before Last seen, and a Source report`;
      const issues = [];
      if (ioc.status !== 'active') issues.push(`set Status to active, because the spray is current (you set ${quoted(ioc.status || 'blank')})`);
      if (!isDate(ioc.firstSeen) || !isDate(ioc.lastSeen)) issues.push(`fill in First seen and Last seen as UTC times (you entered ${quoted(ioc.firstSeen || 'blank')} and ${quoted(ioc.lastSeen || 'blank')})`);
      else if (Date.parse(ioc.firstSeen) > Date.parse(ioc.lastSeen)) issues.push(`First seen (${ioc.firstSeen}) is after Last seen (${ioc.lastSeen}), so swap them`);
      if (!ioc.sourceReportId) issues.push('choose its Source report');
      return issues.length ? `on the ${ip()} IOC, ${issues.join('; ')}`
        : `open the ${ip()} IOC, check its dates against the sign-in records and save it, so your review of the record is logged (no edit to that IOC was recorded)`;
    },
    'query-rule-quality': (result, c) => {
      const key = ruleKey();
      const rule = gradedRule(result);
      const parts = [];
      if (missed(c, /query-test/)) parts.push('run Test query on your detection query before you turn it into a rule (no successful test was recorded)');
      if (missed(c, /No saved rule/)) parts.push(rule ? `finish the settings on ${ruleName(rule)}: it needs a query, a Grouping field, a Threshold (matches) and a Lookback window (minutes)` : 'save your query as a rule (none was saved)');
      if (missed(c, /compatible source grouping/)) {
        parts.push(`set Grouping field to SourceIp, Threshold (matches) to ${key.threshold} or fewer and Lookback window (minutes) to ${key.windowMinutes} or more, then run the rule${rule ? youDid(result, `${ruleName(rule)} groups by ${quoted(rule.groupingField || 'blank')} and alerts at ${rule.threshold} matches over ${rule.windowMinutes} minutes`) : ''}`);
      }
      return sentences(parts).replace(/\.$/, '');
    },
    'scheduled-execution': (result) => {
      if (!work(result)) return '';
      const rule = gradedRule(result);
      if (!rule) return 'save a rule, tick Enable rule, set Frequency (minutes) to 5 or more and a Next scheduled time, then choose Run next scheduled execution';
      const issues = [];
      if (!rule.enabled) issues.push('tick Enable rule');
      if (!rule.schedule || !rule.schedule.scheduledAt) issues.push('set and save a Next scheduled time (UTC)');
      else if (!(Number(rule.schedule.frequencyMinutes) >= 5)) issues.push(`set Frequency (minutes) to 5 or more (you set ${rule.schedule.frequencyMinutes ?? 'nothing'})`);
      const runs = runsOf(result).filter((run) => run.ruleId === rule.id);
      if (!runs.some((run) => run.mode === 'scheduled' && run.status === 'completed')) {
        const ran = !runs.length ? 'it has not run yet' : `you ran it ${runs.length === 1 ? 'once' : `${runs.length} times`}${runs.every((run) => run.mode !== 'scheduled') ? ' with Run now, never on its schedule' : ''}`;
        issues.push(`choose Run next scheduled execution so a scheduled run completes (${ran})`);
      }
      return issues.length ? `on ${ruleName(rule)}, ${andList(issues)}` : `choose Save schedule after enabling ${ruleName(rule)}, so the schedule change is recorded, then let a scheduled run complete`;
    },
    'alert-coverage': (result) => {
      if (!work(result)) return '';
      const alerts = alertsOf(result);
      return `run the rule so it raises an alert grouped on SourceIp ${ip()} that covers at least ${ruleKey().threshold} of its sign-in records (${alerts.length ? `your alerts: ${alerts.map((alert) => `${alert.id} on ${alert.groupingField || '—'} ${alert.group || '—'} with ${plural(arr(alert.eventIds).length, 'record')}`).join('; ')}` : 'no alerts were raised'})`;
    },
    'alert-tuning': (result, c) => {
      const parts = [];
      const r = retry();
      if (missed(c, /exclusion or suppression/)) {
        const rule = gradedRule(result);
        parts.push(`turn on an exclusion or suppression for the harmless retries (${r.account} from ${r.sourceIp} after the password rotation)${rule ? youDid(result, `${ruleName(rule)} has neither enabled`) : ''}`);
      }
      if (missed(c, /benign retry/)) {
        const noisy = alertsOf(result).filter((alert) => benignIn(alert).length);
        parts.push(`${noisy.length ? `alert ${andList(noisy.map((alert) => alert.id))} still includes` : 'an alert still includes'} the harmless retries from ${r.sourceIp} (${r.account}); tune the rule so they drop out while the spray still alerts`);
      }
      if (!parts.length && missed(c, /qualifying malicious alert/)) parts.push(`the rule also has to alert on the real spray from ${ip()} (see Alerts raised)`);
      return sentences(parts).replace(/\.$/, '');
    },
    'automation-boundary': (result) => {
      if (!work(result)) return '';
      const a = automationOf(result);
      const actions = arr(a.actions);
      const runs = arr(a.executions);
      const issues = [];
      if (!actions.length) issues.push('run at least one simulated low-risk action, such as Enrich indicator or Preserve matching evidence (none was recorded)');
      const unrun = actions.filter((action) => !runs.some((run) => run.actionId === action.id));
      if (unrun.length) issues.push(`let ${andList(unrun.map((action) => quoted(AUTOMATION_LABELS[action.type] || action.type)))} finish running (no run was recorded for ${unrun.length === 1 ? 'it' : 'them'})`);
      const unsafe = runs.filter((run) => run.readOnly !== true || Number(run.sideEffects) > 0);
      if (unsafe.length) issues.push(`run ${andList(unsafe.map((run) => run.id))} changed something; automation here may only read, enrich and preserve evidence`);
      return issues.length ? sentences(issues).replace(/\.$/, '') : 'keep automation read-only and send any disable, revoke or block action through Request approval';
    },
  };

  /* case-documentation, as the scorer reads it (rubric.js extract()). */
  function documentation(result) {
    const r = record(result);
    if (!r) return null;
    const notes = String(r.notes || '').trim();
    const lowerNotes = notes.toLowerCase();
    return {
      notes,
      disposition: TRUE_POSITIVE_IDS.includes(String(r.disposition || '').toLowerCase()),
      escalated: Boolean(r.escalation || r.escalateTo),
      long: notes.length >= DOC_MIN,
      attack: DOC_ATTACK_TERMS.some((term) => lowerNotes.includes(term)),
      entity: DOC_ENTITY_TERMS.some((term) => lowerNotes.includes(term)),
    };
  }
  function documentationNote(result) {
    const d = documentation(result);
    if (!d) return '';
    const parts = [];
    if (!d.disposition) parts.push(`record the disposition as ${quoted(dispositionLabel('true-positive'))} (you chose ${quoted(dispositionLabel(dispositionOf(result)) || 'nothing')}); the case write-up only counts with a supported disposition`);
    if (!d.escalated) parts.push('set Escalation required and the department that takes the case');
    if (!d.long) parts.push(`write at least ${DOC_MIN} characters of work notes (you wrote ${d.notes.length})`);
    else {
      if (!d.attack) parts.push('say in your work notes what the sign-in records show: a password spray against many accounts and one successful sign-in');
      if (!d.entity) parts.push(`name the evidence in your work notes: the source ${ip()}, the account ${account()}, or the indicator`);
    }
    return sentences(parts).replace(/\.$/, '.');
  }

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
            fixPartial: (result) => `route the case to Identity Response: they own credential reset and containment for ${account()} (you routed it to ${quoted(textOf(departments(), field(result, 'escalateTo')))}).`,
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
            fix: (result) => `Choose ${quoted(textOf(intelOptions(), CORRECT_INTEL))} (you chose ${quoted(textOf(intelOptions(), findingOf(result, 'intelAssessment')) || 'nothing')}). The threat report matches the spray source, but the sign-in records are what prove the attack.`,
          },
          {
            label: () => `Rule decision: “${textOf(ruleOptions(), CORRECT_RULE)}”`,
            expected: () => textOf(ruleOptions(), CORRECT_RULE),
            test: (result) => (findingOf(result, 'ruleDisposition') === null ? null : findingOf(result, 'ruleDisposition') === CORRECT_RULE),
            given: (result) => textOf(ruleOptions(), findingOf(result, 'ruleDisposition')) || 'Left blank',
            fix: (result) => `Choose ${quoted(textOf(ruleOptions(), CORRECT_RULE))} (you chose ${quoted(textOf(ruleOptions(), findingOf(result, 'ruleDisposition')) || 'nothing')}). Keeping the old rule leaves the harmless-retry noise, and disabling it removes detection.`,
          },
        ],
      },
      {
        id: 'indicator-verdicts',
        title: 'Indicator verdicts',
        recordedSince: VERDICTS_SINCE,
        answer: (result) => {
          const rows = verdicts(result);
          if (!rows) return [['Verdict on each indicator', null]];
          // As on the verdict card: value, then type · origin; the verdict word as the select shows it.
          return rows.map((row) => [`${row.value} · ${[row.type, row.origin].filter(Boolean).join(' · ')}`, `Verdict: ${decisionText(row.decision)}`]);
        },
        response: (result) => {
          const rows = verdicts(result);
          if (!rows) return [{ label: 'Indicator reasoning · student response', text: null }];
          return rows.map((row) => ({ label: `${row.value} · Reasoning`, text: row.rationale || '' }));
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
          fix: (result) => (verdicts(result) || []).filter((row) => row.assessment === 'contradicted').map((row) => {
            const expected = ((truth() || {}).indicatorDecisions || {})[row.indicatorId];
            const refs = ((truth() || {}).indicatorEvidence || {})[row.indicatorId] || [];
            return expected === 'unknown'
              ? `You called ${row.value} ${row.decision}, but no record in this case involves it, so the case cannot say either way. The supported verdict is unknown, with a sentence on what is missing.`
              : `You called ${row.value} ${row.decision}, but this case’s records show it is ${expected} (see ${andList(refs.slice(0, 2))}).`;
          }).join(' '),
        }],
        evidence: {
          label: 'Each indicator judged correctly with a reason that cites the case',
          text: (result) => {
            const rows = verdicts(result);
            if (!rows) return null;
            return rows.map((row, index) => (row.assessment === 'correct' && row.points >= row.max ? `v${index}` : '')).join(' ');
          },
          pieces: (result) => (verdicts(result) || []).map((row, index) => {
            const expected = ((truth() || {}).indicatorDecisions || {})[row.indicatorId];
            const wanted = expected === 'unknown' ? 'left unknown, because this case holds no evidence either way' : `judged ${expected}`;
            return { name: `${row.value} ${wanted}`, short: `${row.value} (${wanted})`, label: `${row.value} ${wanted}, with a reason that ${expected === 'unknown' ? 'explains the gap' : 'cites a record from this case'}`, terms: [`v${index}`] };
          }),
          // One point per indicator that lost credit, quoting the student's verdict.
          // Contradicted verdicts are already named by the check above.
          fix: (missing, result) => {
            const notes = (verdicts(result) || []).filter((row) => !(row.assessment === 'correct' && row.points >= row.max) && row.assessment !== 'contradicted').map((row) => {
              const expected = ((truth() || {}).indicatorDecisions || {})[row.indicatorId];
              const refs = ((truth() || {}).indicatorEvidence || {})[row.indicatorId] || [];
              if (!row.decision) return `record a verdict and reasoning for ${row.value} (you left it blank)`;
              if (row.assessment === 'undecided') return `${row.value}: you chose unknown, but the case records support ${expected}; say so and cite one, such as ${refs[0]}`;
              return expected === 'unknown'
                ? `${row.value}: unknown is right; add a sentence (${minRationale()} characters or more) on what this case is missing`
                : `${row.value}: ${row.decision} is right; name a record from this case in the reasoning, such as ${refs[0]}`;
            });
            return notes.length ? sentences(notes) : false;
          },
        },
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        response: (result) => [{ label: 'Analyst Work Notes · student response', text: record(result) ? (record(result).notes || '') : null }],
        checks: [{
          // The scored case-documentation criterion (rubric.js extract()), read
          // from the saved breakdown so this line agrees with the points given.
          label: `Scored case write-up: a supported disposition, escalation set, and work notes of at least ${DOC_MIN} characters that name the sign-in attack and the source IP, account or indicator`,
          test: (result) => {
            const c = criterion(result, 'case-documentation');
            if (c) return c.points >= c.max ? true : c.points > 0 ? 'partial' : false;
            const d = documentation(result);
            return d ? d.disposition && d.escalated && d.long && d.attack && d.entity : null;
          },
          given: (result) => {
            const c = criterion(result, 'case-documentation');
            const d = documentation(result);
            return [c ? `${c.points} of ${c.max} points` : '', d ? `work notes ${d.notes.length} characters` : ''].filter(Boolean).join(' · ') || null;
          },
          fix: (result) => documentationNote(result) || 'Write a fuller work note: what the original rule missed, how you tuned it, what the sign-in records and intelligence show, and what you recommend.',
        }],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result, ctx) => (record(result) ? ctx.text() : null),
          pieces: notePieces,
          // The source, account and attack pieces are already asked for by the
          // scored line above when it found them missing; list only the rest.
          fix: (missing, result, ctx) => {
            const d = documentation(result);
            const skip = new Set([...(d && !d.entity ? [0, 1] : []), ...(d && !d.attack ? [2] : [])]);
            const names = notePieces().filter((piece, index) => !skip.has(index) && !AdminSubmissionSheet.matchesAny(ctx.text(), piece.terms.length ? piece.terms : [piece.name])).map((piece) => piece.short);
            return names.length ? `${skip.size ? 'also cover' : 'back your recommendation with the evidence by covering'} ${andList(names)} in your work notes.` : false;
          },
        },
      },
      {
        id: 'intelligence',
        title: 'Threat intelligence matched to the case',
        recordedSince: WORK_SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Indicators of compromise', null]];
          // Field labels as on the IOC and threat-report forms (soc-m04-intelligence-ui.js).
          const iocRows = iocsOf(result).map((ioc) => [`IOC ${ioc.value || ioc.id}`, [
            `Type: ${ioc.type || '—'}`, `Value: ${ioc.value || '—'}`,
            ...(ioc.confidence !== undefined ? [`Confidence: ${ioc.confidence ?? '—'}`] : []),
            `First seen: ${ioc.firstSeen || '—'}`, `Last seen: ${ioc.lastSeen || '—'}`,
            ...(ioc.campaign ? [`Campaign: ${ioc.campaign}`] : []),
            `Status: ${ioc.status || '—'}`, `Source report: ${ioc.sourceReportId || 'No source report'}`,
            ...(ioc.context ? [`Context: ${ioc.context}`] : []),
          ]]);
          const reports = reportsOf(result).map((report) => [`Threat report ${report.id} (${report.learnerCreated ? 'you created it' : report.edited ? 'you edited it' : 'saved'})`, [
            `Source: ${report.source || '—'}`, `Report type: ${report.kind || '—'}`, `Summary: ${report.summary || '—'}`,
          ]]);
          return [
            ...(iocRows.length ? iocRows : [['Indicators of compromise', 'None recorded']]),
            ...(Array.isArray(w.reports) || Array.isArray(w.threatReports) ? (reports.length ? reports : [['Threat reports you created or edited', 'None']]) : []),
          ];
        },
        checks: [
          criterionCheck('intelligence-corroboration', `Linked ${ip()} to a dated, rated intelligence report and ran an enrichment that matched the incident`, EXPLAIN['intelligence-corroboration'], 'Attach the spray source to its intelligence report and run Enrich indicator so it links to the incident records.'),
        ],
      },
      {
        id: 'ioc-record',
        title: 'Indicator record kept accurate',
        required: false,
        checks: [
          criterionCheck('ioc-lifecycle', 'Kept the malicious IP indicator active, with sensible first/last-seen dates, a linked report and a recorded edit', EXPLAIN['ioc-lifecycle'], `Review the ${ip()} IOC: keep Status active, First seen before Last seen, a Source report, and save your edit.`),
        ],
      },
      {
        id: 'rule',
        title: 'Detection query and rule',
        recordedSince: WORK_SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Rules built', null]];
          const queries = queriesOf(result).map((query) => [`Saved query ${quoted(query.name || query.id)}`, [`KQL query: ${String(query.query || '').replace(/\s+/g, ' ')}`, query.testedAt ? `Tested at ${query.testedAt}` : 'Not tested']]);
          const rules = rulesOf(result);
          if (!rules.length) return [...queries, ['Rules built', 'None saved']];
          // Field labels as on the Edit analytics rule form (soc-m04-rules-ui.js).
          return [...queries, ...rules.map((rule) => {
            const lines = [
              `Name: ${rule.name || rule.id}`,
              ...(rule.description ? [`Description: ${rule.description}`] : []),
              ...(rule.severity ? [`Severity: ${rule.severity}`] : []),
              `Grouping field: ${rule.groupingField || '—'}`, `Threshold (matches): ${rule.threshold ?? '—'}`, `Lookback window (minutes): ${rule.windowMinutes ?? '—'}`,
            ];
            const ex = rule.exclusion;
            lines.push(ex && ex.enabled ? `Exclusion: ${ex.field} ${ex.operator} ${ex.value}${ex.reason ? ` · Reason: ${ex.reason}` : ''}` : 'Exclusion: not enabled');
            const sup = rule.suppression;
            lines.push(sup && sup.enabled ? `Suppression: Group by ${sup.groupField} · Window (minutes) ${sup.windowMinutes}` : 'Suppression: not enabled');
            if (rule.query) lines.push(`Query: ${String(rule.query).replace(/\s+/g, ' ')}`);
            return [`Rule ${quoted(rule.name || rule.id)}`, lines];
          })];
        },
        checks: [
          criterionCheck('query-rule-quality', 'Built a focused query and a rule that groups by source, uses a sensible threshold and window, was tested, and was run', EXPLAIN['query-rule-quality'], `Build a rule that groups by SourceIp with a threshold of ${ruleKey().threshold} or fewer and a lookback window of at least ${ruleKey().windowMinutes} minutes. Test the query, then run the rule.`),
        ],
      },
      {
        id: 'schedule',
        title: 'Rule scheduled',
        required: false,
        recordedSince: WORK_SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Rule schedule', null]];
          const rules = rulesOf(result);
          const runs = runsOf(result);
          const name = (id) => (ruleById(result, id) || {}).name || id;
          return [
            ...(rules.length ? rules.map((rule) => [`Rule schedule · ${rule.name || rule.id}`, [
              `Enable rule: ${rule.enabled ? 'Yes' : 'No'}`,
              `Frequency (minutes): ${rule.schedule ? rule.schedule.frequencyMinutes ?? '—' : '—'}`,
              `Next scheduled time (UTC): ${rule.schedule && rule.schedule.scheduledAt ? String(rule.schedule.scheduledAt).slice(0, 16).replace('T', ' ') : '—'}`,
            ]]) : [['Rule schedule', 'No rule saved']]),
            ['Execution history', runs.length ? runs.map((run) => `${run.id}: ${run.mode} run of ${name(run.ruleId)}, ${run.status}`) : 'None'],
          ];
        },
        checks: [
          criterionCheck('scheduled-execution', 'Enabled the rule on a schedule and a scheduled run completed', EXPLAIN['scheduled-execution'], 'Tick Enable rule, set Frequency (minutes) to 5 or more and a Next scheduled time, then let a scheduled run complete.'),
        ],
      },
      {
        id: 'alerts',
        title: 'Alerts raised',
        recordedSince: WORK_SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Alerts the rule raised', null]];
          const alerts = alertsOf(result);
          return [['Alerts the rule raised', alerts.length ? alerts.map((alert) => `${alert.id}: ${alert.groupingField} = ${alert.group}, ${plural(arr(alert.eventIds).length, 'matched event')}${benignIn(alert).length ? ' (includes the harmless retries)' : ''}${alert.status ? ` · Status ${alert.status}` : ''}${alert.reviewedAt ? ' · reviewed' : ''}`) : 'No alerts raised']];
        },
        // Review notes the student recorded on an alert (Record review), shown in full.
        response: (result) => alertsOf(result).filter((alert) => typeof alert.reviewNote === 'string' && alert.reviewNote.trim()).map((alert) => ({ label: `${alert.id} · Review note`, text: alert.reviewNote })),
        checks: [
          criterionCheck('alert-coverage', `The rule raised an alert for the real spray (${ip()}) covering enough of its sign-in records`, EXPLAIN['alert-coverage'], `Run the rule against the telemetry so it raises an alert for ${ip()} that covers at least ${ruleKey().threshold} of its sign-in records.`),
          criterionCheck('alert-tuning', `The rule did not alert on the harmless retries (${retry().sourceIp}) and uses an exclusion or suppression`, EXPLAIN['alert-tuning'], 'Tune the rule so the harmless retries no longer alert, using an exclusion or suppression, while the real spray still does.'),
        ],
      },
      {
        id: 'automation',
        title: 'Automation kept safe',
        recordedSince: WORK_SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w || !w.automation) return [['Simulated low-risk actions', null]];
          const a = automationOf(result);
          const rows = [
            ['Simulated low-risk actions', arr(a.actions).length ? a.actions.map((x) => `${x.id}: ${AUTOMATION_LABELS[x.type] || String(x.type).replace(/_/g, ' ')}`) : 'None recorded'],
            ['Automation selections', arr(a.selections).length ? a.selections.map((x) => x.type === 'indicator_enrichment'
              ? `Enrich indicator · Indicator: ${x.iocValue || x.iocId || '—'} · ${x.status || '—'}`
              : `Preserve matching evidence · Alert: ${x.alertId || '—'} · Matched events: ${arr(x.matchedEventIds).join(', ') || 'None'} · ${x.status || '—'}`) : 'None recorded'],
            ['Simulated runs', arr(a.executions).length ? a.executions.map((x) => `${x.id}: ${x.status}, ${x.readOnly ? 'read-only' : 'NOT read-only'}${x.sideEffects ? `, ${plural(Number(x.sideEffects), 'side effect')}` : ''}`) : 'None recorded'],
          ];
          // Tickets / notifications / approvals: the form labels from soc-m04-assessment-console.js.
          if (Array.isArray(a.tickets)) rows.push(['Tickets saved', a.tickets.length ? a.tickets.map((t) => `${t.id || '—'} · Ticket target: ${pick(t, 'target', 'targetId') || '—'} · Alert: ${t.alertId || '—'}${t.status ? ` · ${t.status}` : ''}`) : 'None']);
          if (Array.isArray(a.notifications)) rows.push(['Notifications sent', a.notifications.length ? a.notifications.map((n) => `SOC recipient: ${pick(n, 'recipient', 'target', 'targetId') || '—'} · Alert: ${n.alertId || '—'}${n.status ? ` · ${n.status}` : ''}`) : 'None']);
          rows.push(['Approval requests', arr(a.approvals).length ? a.approvals.map((x) => {
            const type = pick(x, 'type', 'actionType');
            const reviewer = pick(x, 'reviewer');
            return `${x.id}: Action ${APPROVAL_ACTIONS[type] || type || '—'} · Target ${pick(x, 'target', 'targetId') || '—'} · Alert ${x.alertId || '—'} · Requested by ${pick(x, 'actor', 'requestedBy') || '—'} · ${x.status || '—'}${reviewer ? ` (Reviewer ${reviewer})` : ''}`;
          }) : 'None']);
          return rows;
        },
        // Everything the student wrote in the automation tab, in full.
        response: (result) => {
          const a = automationOf(result);
          return [
            ...arr(a.tickets).map((t) => ({ label: `Ticket ${pick(t, 'target', 'targetId') || t.id} · Ticket content`, text: t.content })),
            ...arr(a.notifications).map((n) => ({ label: `Notification to ${pick(n, 'recipient', 'target', 'targetId') || 'SOC'} · Notification content`, text: n.content })),
            ...arr(a.approvals).flatMap((x) => [
              { label: `${x.id} · Reason`, text: x.reason },
              ...(pick(x, 'reviewReason') ? [{ label: `${x.id} · Decision reason (${x.status})`, text: x.reviewReason }] : []),
            ]),
          ].filter((entry) => typeof entry.text === 'string' && entry.text.trim());
        },
        checks: [criterionCheck('automation-boundary', 'Automation only enriched and preserved evidence; any disruptive action waited for human approval', EXPLAIN['automation-boundary'], 'Keep automation read-only: enrich and preserve evidence, and send any disruptive action (disable an account, block an address) through Request approval.')],
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

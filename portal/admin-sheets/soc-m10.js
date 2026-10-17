/* Submission Sheet — Module 10 Prove It, CASE-105510 / INC-5510 (post-
 * containment evidence request for j.sanders / wkstn-19). Lab key
 * 'lab-attack-mapping'.
 *
 * Answer key: SocM10AssessmentData.expectedTruth + .scenario (artifact list,
 * required / noise ids, hashes, custodians) in portal/soc-m10-assessment-data.js.
 * Scoring it mirrors: SocM10AssessmentRubric.extract() / SocM10AssessmentScorer
 * — ten criteria, 10 points each ('observed' = 10, 'partial' = 5). Each work
 * section below takes its ✓ / ◐ / ✗ from that criterion's stored points
 * (result.breakdown), so the sheet and the scorer cannot disagree; the
 * fixture only supplies the plain-language "what was expected" detail.
 *
 * Saved payload (moduleTenFinalizeCase): result.case_record = the whole
 * moduleTenAssessmentState (ticket fields + locker, notes, transfers,
 * legalHold, exports, timeline, statements, unknowns, escalation,
 * actionHistory, tools.m06 = the ATT&CK workspace), result.breakdown,
 * result.feedback, result.review_payload, result.critical_errors,
 * result.case_display (ticket rows as the student saw them) and
 * result.case_summary. No payload change was needed for this module.
 *
 * The ITSM ticket fields (status, severity, user, device, disposition,
 * escalation) are collected and gated at submit but NOT scored by the M10
 * scorer, so the ticket section is advisory.
 *
 * Labels (owner, 2026-10-17): every value reads with the label the student
 * saw in the console — statement types, unknown topics, acquisition methods
 * and integrity states as soc-console-tools.js m10LockerView /
 * m10ReconstructionView render them, ticket options as MODULE_TEN_CASE /
 * case-record.js render them. Prefilled notes quote what the student did.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM10AssessmentData !== 'undefined' ? SocM10AssessmentData : null);
  const truth = () => (data() && data().expectedTruth) || {};
  const scenario = () => (data() && data().scenario) || {};
  const WEIGHT = 10; // SocM10AssessmentScorer.CRITERIA weight (every criterion)

  // Ticket answer key: MODULE_TEN_CASE.correct* in portal/soc-analyst-module-10.js
  // (lines ~377-384); the ticket is not scored (advisory section).
  const TICKET_KEY = { status: 'in-progress', severity: 'high', affectedUser: 'j.sanders', affectedDevice: 'wkstn-19', disposition: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc' };
  // The ticket's option lists (labels the student saw, tiers, department fit) come
  // from MODULE_TEN_CASE, which index.html loads before the sheets. The fallback
  // keeps the non-obvious labels readable if the module file is ever absent.
  const CASE_FALLBACK = {
    userOptions: [{ id: 'j.sanders', text: 'j.sanders', tier: 'principal' }, { id: 'jdoe', text: 'jdoe', tier: 'pivot' }],
    deviceOptions: [{ id: 'wkstn-19', text: 'wkstn-19', tier: 'principal' }, { id: 'wks-desk-07', text: 'wks-desk-07 (jdoe desktop)', tier: 'pivot' }],
    departmentOptions: [{ id: 'tier2-soc', text: 'Tier 2 SOC — Incident Response', fit: 100 }, { id: 'digital-forensics', text: 'Digital Forensics Team', fit: 70 }, { id: 'identity-response', text: 'Identity Response', fit: 55 }, { id: 'help-desk', text: 'Help Desk', fit: 10 }],
  };
  const caseKey = () => (typeof MODULE_TEN_CASE !== 'undefined' && MODULE_TEN_CASE ? MODULE_TEN_CASE : CASE_FALLBACK);
  const caseOption = (kind, id) => (id ? list(caseKey()[kind]).find((entry) => entry.id === id || entry.id === String(id).toLowerCase()) || null : null);

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  // The evidence locker, transfers, legal hold, timeline, statements, unknowns
  // and specialist escalation live in their own case state, saved on the
  // attempt as result.evidence_record (added 2026-10-17). Older attempts lack
  // it and read "Not recorded"; the graded checks still use the stored breakdown.
  const evidence = (result) => (result.evidence_record && typeof result.evidence_record === 'object' && !Array.isArray(result.evidence_record) ? result.evidence_record : null);
  const SINCE = '2026-10-17';
  const list = (value) => (Array.isArray(value) ? value : []);
  const artifact = (id) => list(scenario().artifacts).find((item) => item.id === id) || null;
  const label = (id) => { const a = artifact(id); return a ? `${id} · ${a.title}` : String(id); };
  const labels = (ids) => list(ids).map(label);
  const ids = (items) => list(items).join(', ');
  const optionText = (options, id) => (list(options).find((option) => option.id === id) || {}).text || id || '';
  const dispositionText = (id) => (typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' && CASE_RECORD_DISPOSITION_LABELS[id]) || id || '';

  // ---- scorer finding for one criterion, from the stored breakdown ----
  const finding = (result, ctx, id) => {
    const rows = Array.isArray(result.breakdown) ? result.breakdown : null;
    const row = rows && rows.find((entry) => entry && entry.id === id);
    if (row && Number.isFinite(Number(row.points))) {
      const points = Number(row.points);
      return { points, finding: points >= WEIGHT ? 'observed' : points > 0 ? 'partial' : 'none' };
    }
    // Older / hand-built attempts without a stored breakdown: re-derive with the scorer's own extractor.
    if (typeof SocM10AssessmentRubric === 'undefined' || !data() || !evidence(result)) return null;
    const found = SocM10AssessmentRubric.extract(evidence(result), data(), { mappings: mappingsOf(result) }).criteria.find((entry) => entry.id === id);
    if (!found) return null;
    return { points: found.finding === 'observed' ? WEIGHT : found.finding === 'partial' ? WEIGHT / 2 : 0, finding: found.finding === 'observed' ? 'observed' : found.finding === 'partial' ? 'partial' : 'none' };
  };
  // result.attack_mappings (added 2026-10-17) is the normalized list the scorer used; older attempts fall back to the workspace copy in case_record.
  const mappingsOf = (result) => {
    const rec = record(result);
    const source = Array.isArray(result.attack_mappings) ? result.attack_mappings : rec && rec.tools && rec.tools.m06 && rec.tools.m06.mappings;
    return list(source).filter((entry) => entry && typeof entry === 'object');
  };
  const verdictOf = (result, ctx, id) => {
    const found = finding(result, ctx, id);
    return found === null ? null : found.finding === 'observed' ? true : found.finding === 'partial' ? 'partial' : false;
  };
  const pointsOf = (result, ctx, id) => { const found = finding(result, ctx, id); return found ? `${found.points} of ${WEIGHT} points` : null; };

  // One scorer-mirroring check for a work section.
  const criterionCheck = (id, config) => ({
    label: config.label,
    expected: config.expected,
    test: (result, ctx) => verdictOf(result, ctx, id),
    given: (result, ctx) => [pointsOf(result, ctx, id), config.given && (evidence(result) || id === 'attack-linkage') ? config.given(result, ctx) : ''].filter(Boolean).join('. '),
    fix: config.fix,
    fixPartial: config.fixPartial || config.fix,
  });

  // ---- what the student did, in words ----
  const lockerOf = (result) => (evidence(result) && evidence(result).locker && typeof evidence(result).locker === 'object' ? evidence(result).locker : null);
  const historyOf = (result) => list(evidence(result) && evidence(result).actionHistory);
  const unique = (items) => [...new Set(items)];
  // The INTEGRITY column shows the raw state: verified / mismatch / unverified.
  const integrityOf = (locker, id) => (locker && locker[id] ? locker[id].integrity || 'unverified' : 'not in the locker');
  const mismatchSeen = (result) => historyOf(result).some((a) => a && a.type === 'verify' && a.details && a.details.artifactId === truth().mismatchArtifactId && a.details.integrity === 'mismatch');
  const wrongAcquisitions = (result) => {
    const locker = lockerOf(result) || {};
    const lower = (v) => String(v || '').toLowerCase();
    return list(truth().requiredArtifactIds).filter((id) => locker[id] && !(lower(locker[id].source) === lower((artifact(id) || {}).source) && list((artifact(id) || {}).methods).includes(locker[id].method) && String(locker[id].acquiredBy || '').trim()));
  };

  // Option labels exactly as the console renders them (portal/soc-console-tools.js:
  // M10_METHOD_LABELS, the Statement type / Topic / Route selects, the INTEGRITY column).
  const METHOD_TEXT = { gateway_export: 'Mail gateway export', disk_image: 'Forensic disk image', triage_collection: 'Live triage collection', log_export: 'Log export', memory_capture: 'Memory capture' };
  const CUSTODIAN_TEXT = () => Object.fromEntries(list(scenario().custodians).map((entry) => [entry.id, entry.label]));
  const custodian = (id) => CUSTODIAN_TEXT()[id] || id || '—';
  const ROUTE_TEXT = { 'digital-forensics': 'Digital Forensics', 'identity-response': 'Identity Response', legal: 'Legal' };
  const TOPIC_TEXT = { exfiltration: 'Data exfiltration', memory: 'Memory-resident activity', attribution: 'Attribution', other: 'Other' };
  const KIND_TEXT = { fact: 'Observed fact', analysis: 'Supported analysis', root_cause: 'Root cause' };
  const method = (id) => METHOD_TEXT[id] || id || 'no method';
  const topic = (id) => TOPIC_TEXT[id] || id;
  const route = (id) => ROUTE_TEXT[id] || id;
  // SocM10AssessmentRubric's SPECULATIVE / OVERCLAIM patterns (not exported), used only to quote the statement concerned.
  const SPECULATIVE = /\b(likely|probably|possibly|appears?|seems?|suggests?|indicates?|because|caused|so that|in order to)\b/i;
  const OVERCLAIM = /exfiltrat\w*\s+(?:was\s+|is\s+)?(?:confirmed|proven|established)|data (?:was|were) (?:stolen|exfiltrated)|encrypt\w* (?:was )?confirmed/i;
  const quote = (text, max = 100) => { const t = String(text || '').trim().replace(/\s+/g, ' '); return `"${t.length > max ? `${t.slice(0, max - 1)}…` : t}"`; };
  const few = (items, max = 3) => (items.length > max + 1 ? [...items.slice(0, max), `and ${items.length - max} more`] : items).join(', ');
  const cap = (text) => String(text).charAt(0).toUpperCase() + String(text).slice(1);
  const statementsOf = (result) => list(evidence(result) && evidence(result).statements).filter((item) => item && typeof item === 'object');
  const stamp = (at) => { const d = at ? new Date(at) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—'; };

  function noteTerms() {
    const t = truth();
    const file = (id) => ((artifact(id) || {}).title || '').match(/[\w.-]+\.(?:docm|exe)/i);
    const doc = file('ART-02');
    const dropped = file('ART-04');
    const account = (artifact('ART-02') || {}).account || '';
    const host = (artifact('ART-02') || {}).host || '';
    return { t, doc: doc ? doc[0] : 'docm', dropped: dropped ? dropped[0] : 'svchelp', account, host };
  }

  // One ticket field as the student saw it: case_display first (labels the student saw),
  // otherwise the option label from the ticket's own option lists. null when no ticket was saved.
  const STATUS_TEXT = { 'in-progress': 'In Progress', pending: 'Pending', resolved: 'Resolved' };
  const SEVERITY_TEXT = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  const optionsText = (options, id, fallback) => (list(options).find((option) => option.id === id) || {}).text || fallback[id] || id;
  const departmentText = (id) => (caseOption('departmentOptions', id) || {}).text || id;
  function ticketText(result, ctx, name) {
    const rec = record(result);
    if (!rec) return null;
    const value = name === 'severity' ? rec.severity || rec.priority : name === 'disposition' ? rec.disposition || rec.verdict : rec[name];
    const DISPLAY = { status: 'Status', severity: 'Severity', affectedUser: 'Affected user', affectedDevice: 'Affected device', disposition: 'Disposition', escalation: 'Escalation required', escalateTo: 'Route to department' };
    const shown = ctx && ctx.display ? ctx.display(DISPLAY[name]) : null;
    if (!value) return shown && shown !== 'Not provided' ? shown : 'Left blank';
    // Older case_display rows saved the bare id for user / device (wks-desk-07); the option label is what the student saw.
    const kind = name === 'affectedUser' ? 'userOptions' : name === 'affectedDevice' ? 'deviceOptions' : name === 'escalateTo' ? 'departmentOptions' : null;
    const label = kind ? (caseOption(kind, value) || {}).text : null;
    if (shown !== null && !(label && shown === String(value))) return shown;
    if (label) return label;
    if (name === 'status') return optionsText(typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [], value, STATUS_TEXT);
    if (name === 'severity') return optionsText(typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [], value, SEVERITY_TEXT);
    if (name === 'disposition') return dispositionText(value);
    if (name === 'escalation') return value === 'required' ? 'Required' : value === 'not-required' ? 'Not required' : value;
    return String(value);
  }
  // Ticket entity tiers as the module's own case performance scores them: principal = right, pivot = related.
  const tierTest = (kind, id) => { const tier = (caseOption(kind, id) || {}).tier; return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false; };

  AdminSubmissionSheet.register(['lab-attack-mapping'], {
    title: 'Module 10 · PROVE IT — Evidence Collection & Preservation',
    fixture: data,
    caseId: () => [scenario().caseId, scenario().incidentId].filter(Boolean).join(' · ') || 'CASE-105510',
    freeText: (result) => {
      const rec = record(result) || {};
      const ev = evidence(result) || {};
      return [rec.notes,
        ...list(ev.notes).map((item) => item && item.text),
        ...list(ev.statements).map((item) => item && item.text),
        ...list(ev.unknowns).map((item) => item && item.text),
        ev.escalation && ev.escalation.reason,
        ev.legalHold && ev.legalHold.reason,
        ...list(ev.transfers).map((item) => item && item.reason)];
    },
    sections: [
      {
        id: 'ticket',
        title: 'Incident ticket',
        required: false,
        answer: (result, ctx) => {
          const scn = scenario();
          const rec = record(result);
          if (!rec) return [['Case', null], ['Status', null], ['Severity', null], ['Affected user', null], ['Affected device', null], ['Disposition', null], ['Escalation required', null]];
          const shown = (name, fallback) => { const v = ctx.display(name); return v !== null ? v : fallback || 'Left blank'; };
          return [
            ['Case', shown('Case', scn.caseId)],
            ['Linked incident', shown('Linked incidents', scn.incidentId)],
            ['Status', ticketText(result, ctx, 'status')],
            ['Severity', ticketText(result, ctx, 'severity')],
            ['Affected user', ticketText(result, ctx, 'affectedUser')],
            ['Affected device', ticketText(result, ctx, 'affectedDevice')],
            ['Disposition', ticketText(result, ctx, 'disposition')],
            ['Escalation required', ticketText(result, ctx, 'escalation')],
            ['Route to department', rec.escalation === 'required' ? ticketText(result, ctx, 'escalateTo') : shown('Route to department', 'Not applicable')],
          ];
        },
        // Every `given` / `fix` reads the ticket through ticketText(), which is null-safe: an
        // attempt saved without a ticket shows "Not recorded" instead of throwing (F24).
        checks: [
          { label: 'Case left open while the specialists work (In Progress or Pending)', expected: 'In Progress or Pending',
            test: (result) => (record(result) ? ['in-progress', 'pending'].includes(record(result).status) : null),
            given: (result, ctx) => ticketText(result, ctx, 'status'),
            fix: (result, ctx) => `Set Status to In Progress (you chose ${ticketText(result, ctx, 'status')}): the memory image is still with Digital Forensics, so the case is not resolved.` },
          { label: 'Severity set to High', expected: 'High',
            test: (result) => (record(result) ? (record(result).severity || record(result).priority) === TICKET_KEY.severity : null),
            given: (result, ctx) => ticketText(result, ctx, 'severity'),
            fix: (result, ctx) => `Set Severity to High (you chose ${ticketText(result, ctx, 'severity')}): a confirmed macro intrusion with persistence on a finance workstation is high impact.` },
          { label: `Names the compromised account (${TICKET_KEY.affectedUser})`, expected: TICKET_KEY.affectedUser,
            test: (result) => (record(result) ? tierTest('userOptions', record(result).affectedUser) : null),
            given: (result, ctx) => ticketText(result, ctx, 'affectedUser'),
            fix: (result, ctx) => `Put ${TICKET_KEY.affectedUser} in Affected user (you entered ${ticketText(result, ctx, 'affectedUser')}): the macro document ran under that account. The second email recipient (jdoe) never opened it.`,
            fixPartial: (result, ctx) => `The user you named, ${ticketText(result, ctx, 'affectedUser')}, received the same email but never opened it (ART-06). ${TICKET_KEY.affectedUser} opened the macro document, so name ${TICKET_KEY.affectedUser} as the affected user.` },
          { label: `Names the compromised workstation (${TICKET_KEY.affectedDevice})`, expected: TICKET_KEY.affectedDevice,
            test: (result) => (record(result) ? tierTest('deviceOptions', record(result).affectedDevice) : null),
            given: (result, ctx) => ticketText(result, ctx, 'affectedDevice'),
            fix: (result, ctx) => `Put ${TICKET_KEY.affectedDevice} in Affected device (you entered ${ticketText(result, ctx, 'affectedDevice')}): the document, the PowerShell command and the persistence entry are all on that host.`,
            fixPartial: (result, ctx) => `The device you named, ${ticketText(result, ctx, 'affectedDevice')}, belongs to the second recipient, who never saved the attachment (ART-16). The document, the PowerShell command and the persistence entry are on ${TICKET_KEY.affectedDevice}, so name it as the affected device.` },
          { label: 'Marked as confirmed malicious activity (true positive)', expected: () => dispositionText(TICKET_KEY.disposition),
            test: (result) => (record(result) ? (record(result).disposition || record(result).verdict) === TICKET_KEY.disposition : null),
            given: (result, ctx) => ticketText(result, ctx, 'disposition'),
            fix: (result, ctx) => `Record the disposition as ${dispositionText(TICKET_KEY.disposition)} (you chose ${ticketText(result, ctx, 'disposition')}): the evidence shows a real macro attack with persistence.` },
          { label: 'Escalation marked as Required and routed to Tier 2 SOC — Incident Response', expected: () => `Required → ${departmentText(TICKET_KEY.escalateTo)}`,
            test: (result) => (record(result) ? (record(result).escalation === TICKET_KEY.escalation ? (record(result).escalateTo === TICKET_KEY.escalateTo ? true : 'partial') : false) : null),
            given: (result, ctx) => (record(result) ? `${ticketText(result, ctx, 'escalation')}${record(result).escalation === 'required' ? ` → ${ticketText(result, ctx, 'escalateTo')}` : ''}` : null),
            fix: (result, ctx) => `Set Escalation required to Required (you chose ${ticketText(result, ctx, 'escalation')}) and route it to ${departmentText(TICKET_KEY.escalateTo)}, which owns both the account and the workstation.`,
            fixPartial: (result, ctx) => {
              const chosen = caseOption('departmentOptions', (record(result) || {}).escalateTo);
              const why = chosen && (chosen.note || chosen.bounce);
              return `You routed the case to ${ticketText(result, ctx, 'escalateTo')}. ${why ? `${why} Route it to ${departmentText(TICKET_KEY.escalateTo)} next time.` : `${departmentText(TICKET_KEY.escalateTo)} is the best fit because it owns the account and the workstation together.`}`;
            } },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes',
        required: false,
        response: (result) => {
          const rec = record(result);
          return [{ label: 'Analyst work notes · student response', text: rec ? rec.notes || '' : null }];
        },
        checks: [AdminSubmissionSheet.minLengthCheck({
          min: 80, // CASE_RECORD_NOTES_MIN in portal/case-record.js: the submit gate
          text: (result) => (record(result) ? record(result).notes || '' : null),
          fix: 'Write a fuller work note: the evidence package and custody, the reconstructed chain, what is not established, and the specialist handoff.',
        })],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result, ctx) => (record(result) ? ctx.text() : null),
          pieces: () => {
            const { doc, dropped, account, host } = noteTerms();
            return [
              { name: `the compromised account (${account})`, short: account, terms: [account] },
              { name: `the workstation (${host})`, short: host, terms: [host] },
              { name: `the macro document (${doc})`, short: doc, terms: [doc, 'docm', 'macro', 'attachment', 'remittance'] },
              { name: 'the encoded PowerShell command', short: 'PowerShell', terms: ['powershell', 'encoded', '-enc'] },
              { name: `the persistence entry (${dropped} / Run key)`, short: 'the persistence entry', terms: [dropped, dropped.replace(/\.exe$/, ''), 'run key', 'persistence'] },
              { name: 'the legal hold on the originals', short: 'the legal hold', terms: ['legal hold', 'legal-hold', 'hold'] },
              { name: 'the failed hash check and re-collection (ART-03)', short: 'the failed hash check', terms: ['ART-03', 'hash', 'mismatch', 'truncat', 'reacquire', 're-acquire', 're-collect'] },
              { name: 'what is not established (data theft is unproven)', short: 'what is not established', terms: ['exfil', 'not established', 'not confirmed', 'no evidence', 'unknown', 'unproven', 'cannot confirm'] },
              { name: 'the specialist handoff (Digital Forensics, memory image)', short: 'the specialist handoff', terms: ['forensic', 'memory', 'ART-09'] },
            ];
          },
          fix: (missing) => `Back your notes with the evidence: they do not mention ${missing.join(', ')}. Say what each record showed.`,
        },
      },
      {
        id: 'evidence-locker',
        recordedSince: SINCE,
        title: 'Evidence collected',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Evidence locker', null]];
          const t = truth();
          const kind = (id) => (list(t.requiredArtifactIds).includes(id) ? 'needed' : list(t.noiseArtifactIds).includes(id) ? 'routine / unrelated' : list(t.optionalSupportingArtifactIds).includes(id) ? 'optional context' : 'other');
          const rows = Object.keys(locker).sort();
          const missing = list(t.requiredArtifactIds).filter((id) => !locker[id]);
          return [
            ['Evidence locker', rows.length ? rows.map((id) => `${label(id)} (${kind(id)})`) : 'The locker is empty'],
            ['Needed but not collected', missing.length ? labels(missing) : 'None'],
          ];
        },
        checks: [criterionCheck('evidence-selection', {
          label: () => `Collected all ${list(truth().requiredArtifactIds).length} pieces of evidence the reconstruction needs and none of the routine ones`,
          expected: () => ids(truth().requiredArtifactIds),
          given: (result) => {
            const locker = lockerOf(result) || {};
            const missing = list(truth().requiredArtifactIds).filter((id) => !locker[id]);
            const noise = list(truth().noiseArtifactIds).filter((id) => locker[id]);
            return `${missing.length ? `Missing: ${ids(missing)}. ` : ''}${noise.length ? `Routine items collected: ${ids(noise)}.` : ''}`.trim() || 'Exactly the needed items';
          },
          fix: (result) => {
            const generic = `Collect the attachment email, the opened document, the PowerShell process log, the dropped file, the Run key and the deleted archive (${ids(truth().requiredArtifactIds)}). Leave out routine items such as patches and updates.`;
            const locker = lockerOf(result);
            if (!locker) return generic;
            const missing = list(truth().requiredArtifactIds).filter((id) => !locker[id]);
            const noise = list(truth().noiseArtifactIds).filter((id) => locker[id]);
            const steps = [
              missing.length ? `Collect what the reconstruction still needs: ${missing.map(label).join('; ')}.` : '',
              noise.length ? `Leave out ${noise.map(label).join('; ')}: ${noise.length === 1 ? 'it is' : 'they are'} routine and not part of this attack.` : '',
            ].filter(Boolean);
            const held = Object.keys(locker).sort();
            return steps.length ? `Your locker holds ${held.length ? few(held, 6) : 'nothing'}. ${steps.join(' ')}` : generic;
          },
        })],
      },
      {
        id: 'artifact-notes',
        recordedSince: SINCE,
        title: 'Analyst notes (kept separate from the originals)',
        required: false,
        // Not scored: the per-artifact notes the student added from the Evidence Locker's note form.
        response: (result) => {
          const rec = evidence(result);
          if (!rec) return [{ label: 'Analyst notes · student response', text: null }];
          const notes = list(rec.notes).filter((item) => item && typeof item === 'object');
          return notes.length
            ? notes.map((item) => ({ label: `${label(item.artifactId)}${item.at ? ` · ${stamp(item.at)}` : ''}`, text: item.text }))
            : [{ label: 'Analyst notes · student response', text: '' }];
        },
      },
      {
        id: 'acquisition',
        recordedSince: SINCE,
        title: 'Source and acquisition details',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Acquisition records', null]];
          const rows = list(truth().requiredArtifactIds).filter((id) => locker[id]).map((id) => `${id}: Original source ${locker[id].source || '(blank)'} · Acquisition method ${method(locker[id].method)} · Acquired by ${locker[id].acquiredBy || '(blank)'}`);
          return [['Acquisition records for the needed evidence', rows.length ? rows : 'None recorded']];
        },
        checks: [criterionCheck('acquisition-metadata', {
          label: 'Recorded the correct source, collection method and collector for the needed evidence',
          expected: 'The system the evidence came from, a method that system supports, and who collected it',
          given: (result) => {
            const wrong = wrongAcquisitions(result);
            return wrong.length ? `Source, method or collector wrong or blank: ${ids(wrong)}` : '';
          },
          fix: (result) => {
            const generic = 'For each item record the system it came from, how it was collected, and who collected it. The original source must match where the evidence really lives (for example the disk image or the mail gateway export).';
            const locker = lockerOf(result);
            if (!locker) return generic;
            const wrong = wrongAcquisitions(result);
            const absent = list(truth().requiredArtifactIds).filter((id) => !locker[id]);
            const lines = wrong.slice(0, 3).map((id) => {
              const a = artifact(id) || {};
              const item = locker[id];
              return `${id} comes from "${a.source}" by ${list(a.methods).map(method).join(' or ')} (you recorded "${item.source || 'no source'}", ${method(item.method)}${String(item.acquiredBy || '').trim() ? '' : ', and no collector'})`;
            });
            const steps = [
              lines.length ? `Correct the acquisition details: ${lines.join('; ')}${wrong.length > 3 ? `; and ${wrong.length - 3} more` : ''}.` : '',
              absent.length ? `${ids(absent)} ${absent.length === 1 ? 'has' : 'have'} no acquisition record because ${absent.length === 1 ? 'it is' : 'they are'} not in your locker; collect ${absent.length === 1 ? 'it' : 'them'} and record the original source, acquisition method and collector.` : '',
            ].filter(Boolean);
            return steps.length ? steps.join(' ') : generic;
          },
        })],
      },
      {
        id: 'integrity',
        recordedSince: SINCE,
        title: 'Hash checks',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Integrity', null]];
          const mismatchId = truth().mismatchArtifactId;
          return [
            ['Integrity of the needed evidence', list(truth().requiredArtifactIds).map((id) => `${id}: ${integrityOf(locker, id)}`)],
            [`Truncated export (${mismatchId}) noticed`, mismatchSeen(result) ? 'Yes, the failed check (mismatch) was recorded' : 'No failed check recorded'],
          ];
        },
        checks: [criterionCheck('hash-integrity', {
          label: () => `Every needed item verified, and the failed export (${truth().mismatchArtifactId}) caught and re-collected`,
          expected: () => `All hashes verified; ${truth().mismatchArtifactId} first fails, then passes after re-acquisition`,
          given: (result) => {
            const locker = lockerOf(result) || {};
            const notVerified = list(truth().requiredArtifactIds).filter((id) => !(locker[id] && locker[id].integrity === 'verified'));
            return notVerified.length ? `Not verified: ${ids(notVerified)}` : '';
          },
          fix: (result) => {
            const mm = truth().mismatchArtifactId;
            const locker = lockerOf(result);
            if (!locker) return `Re-hash every needed item and compare it with the source hash. ${mm} comes from a truncated export, so the hash fails; collect it again and verify the new copy.`;
            const notVerified = list(truth().requiredArtifactIds).filter((id) => id !== mm && locker[id] && locker[id].integrity !== 'verified');
            const absent = list(truth().requiredArtifactIds).filter((id) => id !== mm && !locker[id]);
            const steps = [];
            if (notVerified.length) steps.push(`verify the hash of ${notVerified.map((id) => `${id} (still ${integrityOf(locker, id)})`).join(', ')}`);
            if (absent.length) steps.push(`collect and verify ${ids(absent)}, which ${absent.length === 1 ? 'is' : 'are'} not in your locker`);
            if (!mismatchSeen(result)) steps.push(`verify ${mm}: it comes from a truncated export, so its first hash check fails (mismatch); re-acquire it and verify the new copy`);
            else if (!(locker[mm] && locker[mm].integrity === 'verified')) steps.push(`you saw ${mm} fail its hash check (mismatch) but it is still ${integrityOf(locker, mm)}; re-acquire it and verify the new copy`);
            return steps.length ? `${cap(steps.join('; '))}.` : `Re-check the hashes of ${ids(truth().requiredArtifactIds)} against the source.`;
          },
        })],
      },
      {
        id: 'custody',
        recordedSince: SINCE,
        title: 'Custody transfer',
        answer: (result) => {
          const rec = evidence(result);
          if (!rec) return [['Custody transfers', null]];
          const transfers = list(rec.transfers);
          return [['Custody transfers', transfers.length ? transfers.map((item) => `${label(item.artifactId)}: ${custodian(item.from)} → ${custodian(item.to)} at ${stamp(item.at)}. Reason: ${item.reason || '—'}`) : 'None made']];
        },
        checks: [criterionCheck('custody', {
          label: () => `Memory image (${truth().specialistArtifactId}) handed to ${custodian(truth().specialistCustodian)} with a verified hash`,
          expected: () => `${truth().specialistArtifactId} → ${custodian(truth().specialistCustodian)}`,
          given: (result) => {
            const wrong = list(evidence(result) && evidence(result).transfers).filter((item) => item.artifactId === truth().specialistArtifactId && item.to !== truth().specialistCustodian);
            return wrong.length ? `Sent to the wrong team: ${wrong.map((item) => custodian(item.to)).join(', ')}` : '';
          },
          fix: (result) => {
            const spec = truth().specialistArtifactId;
            const target = custodian(truth().specialistCustodian);
            const why = 'memory analysis needs the forensics team, not the SOC analyst or the legal repository';
            const rec = evidence(result);
            if (!rec) return `Verify the memory image, then transfer it to ${target} and say why: ${why}.`;
            const mine = list(rec.transfers).filter((item) => item.artifactId === spec);
            const wrong = mine.filter((item) => item.to !== truth().specialistCustodian);
            if (wrong.length) return `You transferred ${spec} to ${wrong.map((item) => custodian(item.to)).join(', ')}. Transfer it to ${target} instead: ${why}.`;
            if (!lockerOf(result) || !lockerOf(result)[spec]) return `${spec} (the memory image) is not in your locker. Collect it, verify its hash, then transfer it to ${target}: ${why}.`;
            const others = unique(list(rec.transfers).map((item) => item.artifactId).filter((id) => id !== spec));
            return `${others.length ? `You transferred ${ids(others)} but not the memory image. ` : 'You made no custody transfer. '}Verify ${spec}, then transfer it to ${target} with a reason: ${why}.`;
          },
        })],
      },
      {
        id: 'preservation',
        recordedSince: SINCE,
        title: 'Legal hold and evidence package',
        answer: (result) => {
          const rec = evidence(result);
          if (!rec) return [['Legal hold on originals', null], ['Evidence package', null]];
          const hold = rec.legalHold;
          const exports = list(rec.exports);
          return [
            ['Legal hold on originals', hold ? labels(hold.artifactIds) : 'None'],
            ['Reason', hold ? hold.reason || '—' : 'No hold placed'],
            ['Evidence packages exported', exports.length ? exports.map((pkg) => `${pkg.id} · ${ids(pkg.artifactIds)} · ${stamp(pkg.at)}`) : 'None'],
          ];
        },
        checks: [criterionCheck('preservation', {
          label: () => `Originals (${ids(truth().originalsForHold)}) placed under legal hold and exported with their hashes`,
          expected: () => ids(truth().originalsForHold),
          given: (result) => {
            const held = list(evidence(result) && evidence(result).legalHold && evidence(result).legalHold.artifactIds);
            const missing = list(truth().originalsForHold).filter((id) => !held.includes(id));
            return missing.length ? `Not on hold: ${ids(missing)}` : '';
          },
          fix: (result) => {
            const originals = list(truth().originalsForHold);
            const rec = evidence(result);
            if (!rec) return `Place the original email, document, dropped file and deleted archive (${ids(originals)}) under legal hold, then export one package whose hashes match the source.`;
            const held = list(rec.legalHold && rec.legalHold.artifactIds);
            const missing = originals.filter((id) => !held.includes(id));
            const packaged = list(rec.exports).some((pkg) => originals.every((id) => list(pkg.artifactIds).includes(id)));
            const steps = [
              !rec.legalHold ? `place the originals (${missing.map(label).join('; ')}) under legal hold (you placed no hold)` : missing.length ? `add ${missing.map(label).join('; ')} to the legal hold (yours covers ${ids(held) || 'nothing'})` : '',
              packaged ? '' : list(rec.exports).length ? 'export the evidence package again once every original is on hold' : 'then export the evidence package (you exported none)',
            ].filter(Boolean);
            return steps.length ? `${cap(steps.join('; '))}.` : 'Export one package whose hashes match the source.';
          },
        })],
      },
      {
        id: 'timeline',
        recordedSince: SINCE,
        title: 'Timeline',
        answer: (result) => {
          const rec = evidence(result);
          if (!rec) return [['Incident timeline in the order the student built it', null]];
          const timeline = list(rec.timeline);
          return [['Incident timeline in the order the student built it', timeline.length ? timeline.map((id) => `${stamp((artifact(id) || {}).time)} · ${label(id)}`) : 'Empty'],
            ['Order the key events should follow', list(truth().chain).map(label)]];
        },
        checks: [criterionCheck('timeline', {
          label: 'Rebuilt the attack in order: email, document, PowerShell, dropped file, Run key, deleted archive',
          expected: () => ids(truth().chain),
          given: (result) => {
            const timeline = list(evidence(result) && evidence(result).timeline);
            const missing = list(truth().chain).filter((id) => !timeline.includes(id));
            return missing.length ? `Missing from the timeline: ${ids(missing)}` : '';
          },
          fix: (result) => {
            const chain = list(truth().chain);
            const generic = `Put all six key records (${ids(chain)}) on the timeline in the order they happened, with nothing out of time order.`;
            const rec = evidence(result);
            if (!rec) return generic;
            const timeline = list(rec.timeline);
            const missing = chain.filter((id) => !timeline.includes(id));
            const time = (id) => (artifact(id) || {}).time || '';
            const outOfOrder = timeline.some((id, index) => index > 0 && time(timeline[index - 1]) > time(id));
            const steps = [
              missing.length ? `add ${missing.map(label).join('; ')}` : '',
              outOfOrder ? `put the entries in the order they happened (${ids(chain)})` : '',
            ].filter(Boolean);
            return steps.length ? `${timeline.length ? `Your timeline reads ${ids(timeline)}.` : 'Your timeline is empty.'} ${cap(steps.join(', and '))}.` : generic;
          },
        })],
      },
      {
        id: 'statements',
        recordedSince: SINCE,
        title: 'Facts versus analysis',
        narrative: true,
        response: (result) => {
          const rec = evidence(result);
          if (!rec) return [{ label: 'Statements · student response', text: null }];
          return statementsOf(result).filter((item) => item.kind !== 'root_cause').map((item) => ({
            label: `${KIND_TEXT[item.kind] || item.kind} · cites ${ids(item.artifactIds) || 'nothing'}`, text: item.text,
          }));
        },
        mechanics: true,
        checks: [
          criterionCheck('fact-analysis', {
            label: () => `${KIND_TEXT.fact} statements say only what a record shows, each cites evidence, and interpretation is kept in ${KIND_TEXT.analysis}`,
            expected: () => `At least 3 ${KIND_TEXT.fact} statements with no guesswork words, and at least 1 ${KIND_TEXT.analysis}`,
            given: (result) => {
              const statements = statementsOf(result);
              return `${statements.filter((s) => s.kind === 'fact').length} ${KIND_TEXT.fact}, ${statements.filter((s) => s.kind === 'analysis').length} ${KIND_TEXT.analysis}`;
            },
            fix: (result) => {
              const generic = `Write at least three ${KIND_TEXT.fact} statements that only say what a record shows (no "likely", "appears" or "because"), and put interpretation in separate ${KIND_TEXT.analysis} statements. Cite the evidence for each.`;
              if (!evidence(result)) return generic;
              const statements = statementsOf(result);
              const facts = statements.filter((s) => s.kind === 'fact');
              const guessing = facts.filter((s) => SPECULATIVE.test(s.text));
              const uncited = facts.filter((s) => !list(s.artifactIds).length);
              const clean = facts.filter((s) => !SPECULATIVE.test(s.text) && list(s.artifactIds).length);
              const steps = [];
              guessing.slice(0, 2).forEach((s) => steps.push(`your ${KIND_TEXT.fact} ${quote(s.text, 80)} uses "${(SPECULATIVE.exec(s.text) || [''])[0]}"; record it as ${KIND_TEXT.analysis} instead`));
              if (uncited.length) steps.push(`cite the locker evidence for ${uncited.length === 1 ? `your ${KIND_TEXT.fact} ${quote(uncited[0].text, 60)}` : `${uncited.length} ${KIND_TEXT.fact} statements`}`);
              if (clean.length < 3) steps.push(`add ${3 - clean.length} more ${KIND_TEXT.fact} statement${3 - clean.length === 1 ? '' : 's'} that only say what a record shows (you have ${clean.length})`);
              if (!statements.some((s) => s.kind === 'analysis')) steps.push(`add at least one ${KIND_TEXT.analysis} statement for your interpretation`);
              return steps.length ? `${cap(steps.join('; '))}.` : generic;
            },
          }),
          {
            label: 'No statement claims data theft or encryption is confirmed (the evidence does not show it)',
            expected: () => `Exfiltration recorded under Unknowns (${TOPIC_TEXT.exfiltration})`,
            test: (result) => (Array.isArray(result.critical_errors) ? !result.critical_errors.length : null),
            given: (result) => list(result.critical_errors)[0] || 'A confirmed-theft claim was flagged',
            fix: (result) => {
              const claim = statementsOf(result).find((s) => OVERCLAIM.test(s.text));
              return `${claim ? `Your statement ${quote(claim.text, 80)} says theft or encryption is confirmed, but ` : 'Do not say data was stolen or encrypted: '}the proxy shows no upload (ART-08). Record it under Unknowns with the topic ${TOPIC_TEXT.exfiltration} instead.`;
            },
          },
        ],
      },
      {
        id: 'root-cause',
        recordedSince: SINCE,
        title: 'Root cause',
        narrative: true,
        response: (result) => {
          const rec = evidence(result);
          if (!rec) return [{ label: 'Root cause · student response', text: null }];
          const mine = statementsOf(result).filter((item) => item.kind === 'root_cause');
          return mine.length ? mine.map((item) => ({ label: `Root cause · cites ${ids(item.artifactIds) || 'nothing'}`, text: item.text })) : [{ label: 'Root cause · student response', text: '' }];
        },
        checks: [criterionCheck('root-cause', {
          label: () => `Root cause is the macro attachment, citing at least two of ${ids(truth().rootCauseArtifactIds)}`,
          expected: () => `Opened macro document; evidence ${ids(truth().rootCauseArtifactIds)}`,
          given: (result) => {
            const last = statementsOf(result).filter((item) => item.kind === 'root_cause').slice(-1)[0];
            if (!last) return 'No root cause statement';
            const cited = list(truth().rootCauseArtifactIds).filter((id) => list(last.artifactIds).includes(id));
            return `Cites ${cited.length} of ${list(truth().rootCauseArtifactIds).length} key records`;
          },
          fix: (result) => {
            const keyIds = list(truth().rootCauseArtifactIds);
            const generic = `State the root cause as the macro-enabled attachment that was opened, and cite the email, the document and the PowerShell log (${ids(keyIds)}).`;
            if (!evidence(result)) return generic;
            const last = statementsOf(result).filter((item) => item.kind === 'root_cause').slice(-1)[0];
            if (!last) return `Record a Root cause statement: ${generic.charAt(0).toLowerCase()}${generic.slice(1)}`;
            const cited = keyIds.filter((id) => list(last.artifactIds).includes(id));
            const names = /attachment|macro|document|docm|remittance|opened/i.test(last.text);
            const steps = [
              names ? '' : 'name the opened macro attachment as the cause',
              cited.length >= 2 ? '' : `cite at least two of ${ids(keyIds)} (you cited ${ids(last.artifactIds) || 'nothing'})`,
            ].filter(Boolean);
            return steps.length ? `Your root cause reads ${quote(last.text, 80)}. ${cap(steps.join(', and '))}.` : generic;
          },
        })],
      },
      {
        id: 'attack',
        recordedSince: SINCE,
        title: 'ATT&CK mapping',
        answer: (result) => {
          if (!Array.isArray(result.attack_mappings) && !record(result)) return [['ATT&CK mappings', null]];
          const maps = mappingsOf(result);
          return [
            ['Techniques the student mapped', maps.length ? maps.map((m) => `${m.techniqueId} (${m.status}${list(m.eventIds).length ? `, evidence ${ids(m.eventIds)}` : ''})${m.rationale ? ` — ${m.rationale}` : ''}`) : 'None recorded'],
            ['Behaviour the evidence supports', list(truth().supportedTechniques).map((t) => `${t.id} (evidence ${ids(t.evidence)})`)],
            ['Not supported (should not be mapped)', ids(truth().unsupportedTechniques)],
          ];
        },
        checks: [criterionCheck('attack-linkage', {
          label: () => `Mapped at least two supported techniques (${list(truth().supportedTechniques).map((t) => t.id).join(', ')}) and none that the evidence does not show`,
          expected: () => list(truth().supportedTechniques).map((t) => t.id).join(', '),
          given: (result) => {
            const over = mappingsOf(result).filter((m) => m.status === 'supported' && list(truth().unsupportedTechniques).includes(m.techniqueId));
            return over.length ? `Over-mapped: ${over.map((m) => m.techniqueId).join(', ')}` : '';
          },
          fix: (result) => {
            const generic = `Map the behaviours the records prove (phishing attachment, user execution, PowerShell, Run key) to ATT&CK and cite the record for each. Do not map data theft (${ids(truth().unsupportedTechniques)}), because nothing shows it.`;
            const maps = mappingsOf(result);
            if (!maps.length) return generic;
            const over = unique(maps.filter((m) => m.status === 'supported' && list(truth().unsupportedTechniques).includes(m.techniqueId)).map((m) => m.techniqueId));
            const backed = list(truth().supportedTechniques).filter((t) => maps.some((m) => m.techniqueId === t.id && m.status === 'supported' && t.evidence.some((id) => list(m.eventIds).includes(id))));
            const unbacked = list(truth().supportedTechniques).filter((t) => !backed.includes(t));
            const steps = [
              over.length ? `remove ${ids(over)}: nothing in the evidence shows data theft or encryption` : '',
              backed.length >= 2 ? '' : `map at least two evidenced techniques, citing their records: ${unbacked.map((t) => `${t.id} (${ids(t.evidence)})`).join(', ')}`,
            ].filter(Boolean);
            return steps.length ? `You mapped ${ids(unique(maps.map((m) => m.techniqueId)))}. ${cap(steps.join('; '))}.` : generic;
          },
        })],
      },
      {
        id: 'unknowns',
        recordedSince: SINCE,
        title: 'Unknowns and specialist escalation',
        narrative: true,
        response: (result) => {
          const rec = evidence(result);
          if (!rec) return [{ label: 'Unknowns · student response', text: null }];
          const out = list(rec.unknowns).map((item) => ({ label: `Unknowns · ${topic(item.topic)}`, text: item.text }));
          if (rec.escalation) out.push({ label: `Specialist escalation · ${route(rec.escalation.route)}${list(rec.escalation.artifactIds).length ? ` · evidence handed over ${ids(rec.escalation.artifactIds)}` : ''}`, text: rec.escalation.reason });
          return out.length ? out : [{ label: 'Unknowns and escalation · student response', text: '' }];
        },
        checks: [criterionCheck('unknowns-escalation', {
          label: () => `Recorded the unknowns (${list(truth().unknowns).map(topic).join(' and ')}) and escalated the memory image to ${route(truth().escalationRoute)}`,
          expected: () => `Unknowns: ${list(truth().unknowns).map(topic).join(', ')}; escalate ${truth().specialistArtifactId} to ${route(truth().escalationRoute)}`,
          given: (result) => {
            const rec = evidence(result) || {};
            const topics = list(rec.unknowns).map((u) => u.topic);
            const missing = list(truth().unknowns).filter((id) => !topics.includes(id));
            return `${missing.length ? `Unknown topics missing: ${missing.map(topic).join(', ')}. ` : ''}${rec.escalation ? `Escalated to ${route(rec.escalation.route)}.` : 'No escalation recorded.'}`;
          },
          fix: (result) => {
            const spec = truth().specialistArtifactId;
            const target = route(truth().escalationRoute);
            const rec = evidence(result);
            if (!rec) return `Record as unknown whether data left the network (${topic('exfiltration')}) and what the memory image shows (${topic('memory')}). Then escalate to ${target} and hand over the memory image (${spec}).`;
            const topics = list(rec.unknowns).map((u) => u.topic);
            const missing = list(truth().unknowns).filter((id) => !topics.includes(id));
            const WHY = { exfiltration: 'the proxy shows no upload, but that does not prove nothing left', memory: 'nobody has analysed the memory image yet' };
            const steps = [];
            if (missing.length) steps.push(`add ${missing.map((id) => `${topic(id)} (${WHY[id] || 'not established'})`).join(' and ')} under Unknowns${topics.length ? ` (you recorded ${unique(topics).map(topic).join(', ')})` : ''}`);
            const esc = rec.escalation;
            if (!esc) steps.push(`record a specialist escalation to ${target} and hand over ${spec}`);
            else {
              if (esc.route !== truth().escalationRoute) steps.push(`route the escalation to ${target}, not ${route(esc.route)}: memory analysis is their work`);
              if (!list(esc.artifactIds).includes(spec)) steps.push(`hand over ${spec} in the escalation (you handed over ${ids(esc.artifactIds) || 'nothing'})`);
            }
            return steps.length ? `${cap(steps.join('; '))}.` : `Escalate ${spec} to ${target}.`;
          },
        })],
      },
      {
        id: 'timeline-actions',
        recordedSince: SINCE,
        title: 'Action timeline',
        required: false,
        collapsed: true,
        answer: (result) => {
          const rec = evidence(result);
          if (!rec || !Array.isArray(rec.actionHistory)) return [['Recorded actions', null]];
          const text = (a) => (a && a.type ? `${stamp(a.timestamp)} · ${String(a.type).replace(/_/g, ' ')}${a.details && a.details.artifactId ? ` ${a.details.artifactId}` : ''}` : '');
          return [['Recorded evidence actions', rec.actionHistory.map(text).filter(Boolean)]];
        },
      },
    ],
  });
})();

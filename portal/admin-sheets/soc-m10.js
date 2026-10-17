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
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM10AssessmentData !== 'undefined' ? SocM10AssessmentData : null);
  const truth = () => (data() && data().expectedTruth) || {};
  const scenario = () => (data() && data().scenario) || {};
  const WEIGHT = 10; // SocM10AssessmentScorer.CRITERIA weight (every criterion)

  // Ticket answer key: MODULE_TEN_CASE.correct* in portal/soc-analyst-module-10.js
  // (lines ~377-384). That file is a browser module and not loadable here, so the
  // values are defined once; the ticket is not scored (advisory section).
  const TICKET_KEY = { status: 'in-progress', severity: 'high', affectedUser: 'j.sanders', affectedDevice: 'wkstn-19', disposition: 'true-positive', escalation: 'required', escalateTo: 'tier2-soc' };

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

  const METHOD_TEXT = { gateway_export: 'Mail gateway export', disk_image: 'Disk image', triage_collection: 'Triage collection', log_export: 'Log export', memory_capture: 'Memory capture' };
  const CUSTODIAN_TEXT = () => Object.fromEntries(list(scenario().custodians).map((entry) => [entry.id, entry.label]));
  const custodian = (id) => CUSTODIAN_TEXT()[id] || id || '—';
  const ROUTE_TEXT = { 'digital-forensics': 'Digital Forensics', 'identity-response': 'Identity Response', legal: 'Legal' };
  const TOPIC_TEXT = { exfiltration: 'Whether data left the network', memory: 'What the memory image shows', attribution: 'Who is behind it', other: 'Something else' };
  const KIND_TEXT = { fact: 'Fact (observed)', analysis: 'Analysis (interpretation)', root_cause: 'Root cause' };
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

  AdminSubmissionSheet.register(['lab-attack-mapping'], {
    title: 'Module 10 · PROVE IT — Evidence Collection & Preservation',
    fixture: data,
    caseId: () => [scenario().caseId, scenario().incidentId].filter(Boolean).join(' · ') || 'CASE-105510',
    freeText: (result) => {
      const rec = record(result) || {};
      const ev = evidence(result) || {};
      return [rec.notes,
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
          if (!rec) return [['Case', null], ['Status', null], ['Severity', null]];
          const shown = (name, fallback) => { const v = ctx.display(name); return v !== null ? v : fallback || 'Left blank'; };
          const optionLabel = optionText;
          return [
            ['Case', shown('Case', scn.caseId)],
            ['Linked incident', shown('Linked incidents', scn.incidentId)],
            ['Status', shown('Status', typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? optionLabel(CASE_RECORD_STATUS_OPTIONS, rec.status) : rec.status)],
            ['Severity', shown('Severity', typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? optionLabel(CASE_RECORD_SEVERITY_OPTIONS, rec.severity || rec.priority) : rec.severity || rec.priority)],
            ['Affected user', shown('Affected user', rec.affectedUser)],
            ['Affected device', shown('Affected device', rec.affectedDevice)],
            ['Disposition', shown('Disposition', typeof CASE_RECORD_DISPOSITION_LABELS !== 'undefined' ? CASE_RECORD_DISPOSITION_LABELS[rec.disposition || rec.verdict] || rec.disposition || rec.verdict : rec.disposition || rec.verdict)],
            ['Escalation required', shown('Escalation required', rec.escalation)],
            ['Route to department', shown('Route to department', rec.escalation === 'required' ? rec.escalateTo : 'Not applicable')],
          ];
        },
        checks: [
          { label: 'Case left open while the specialists work (In Progress or Pending)', expected: 'In Progress or Pending',
            test: (result) => (record(result) ? ['in-progress', 'pending'].includes(record(result).status) : null),
            given: (result, ctx) => ctx.display('Status') || optionText(typeof CASE_RECORD_STATUS_OPTIONS !== 'undefined' ? CASE_RECORD_STATUS_OPTIONS : [], record(result).status) || 'Left blank', fix: 'Keep the case In Progress: the specialist work has not started, so it is not resolved.' },
          { label: 'Severity set to High', expected: 'High',
            test: (result) => (record(result) ? (record(result).severity || record(result).priority) === TICKET_KEY.severity : null),
            given: (result, ctx) => ctx.display('Severity') || optionText(typeof CASE_RECORD_SEVERITY_OPTIONS !== 'undefined' ? CASE_RECORD_SEVERITY_OPTIONS : [], record(result).severity || record(result).priority) || 'Left blank', fix: 'Set Severity to High: a confirmed macro intrusion with persistence on a finance workstation is high impact.' },
          { label: `Names the compromised account (${TICKET_KEY.affectedUser})`, expected: TICKET_KEY.affectedUser,
            test: (result) => (record(result) ? record(result).affectedUser === TICKET_KEY.affectedUser : null),
            given: (result) => record(result).affectedUser || 'Left blank', fix: `Put ${TICKET_KEY.affectedUser} in Affected user: the macro document ran under that account. The second email recipient (jdoe) never opened it.` },
          { label: `Names the compromised workstation (${TICKET_KEY.affectedDevice})`, expected: TICKET_KEY.affectedDevice,
            test: (result) => (record(result) ? String(record(result).affectedDevice || '').toLowerCase() === TICKET_KEY.affectedDevice : null),
            given: (result) => record(result).affectedDevice || 'Left blank', fix: `Put ${TICKET_KEY.affectedDevice} in Affected device: the document, the PowerShell command and the persistence entry are all on that host.` },
          { label: 'Marked as confirmed malicious activity (true positive)', expected: 'Confirmed malicious activity',
            test: (result) => (record(result) ? (record(result).disposition || record(result).verdict) === TICKET_KEY.disposition : null),
            given: (result, ctx) => ctx.display('Disposition') || dispositionText(record(result).disposition || record(result).verdict) || 'Left blank', fix: 'Record the disposition as confirmed malicious activity: the evidence shows a real macro attack with persistence.' },
          { label: 'Escalation marked as Required and routed to Tier 2 SOC — Incident Response', expected: 'Required, Tier 2 SOC — Incident Response',
            test: (result) => (record(result) ? (record(result).escalation === TICKET_KEY.escalation ? (record(result).escalateTo === TICKET_KEY.escalateTo ? true : 'partial') : false) : null),
            given: (result, ctx) => `${record(result).escalation === 'required' ? 'Required' : record(result).escalation === 'not-required' ? 'Not required' : 'Left blank'}${record(result).escalation === 'required' ? ` → ${ctx.display('Route to department') || record(result).escalateTo || 'no department'}` : ''}`,
            fix: 'Set Escalation to Required and route it to Tier 2 SOC — Incident Response, which owns both the account and the workstation.',
            fixPartial: 'Escalation is Required, but Tier 2 SOC — Incident Response is the best-fit team because it owns the account and the workstation together.' },
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
          fix: (missing) => `Back your notes with the evidence: they do not mention ${missing.join('; ')}. Say what each record showed.`,
        },
      },
      {
        id: 'evidence-locker',
        recordedSince: SINCE,
        title: 'Evidence collected',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Evidence placed in the locker', null]];
          const t = truth();
          const kind = (id) => (list(t.requiredArtifactIds).includes(id) ? 'needed' : list(t.noiseArtifactIds).includes(id) ? 'routine / unrelated' : list(t.optionalSupportingArtifactIds).includes(id) ? 'optional context' : 'other');
          const rows = Object.keys(locker).sort();
          return [
            ['Evidence placed in the locker', rows.length ? rows.map((id) => `${label(id)} (${kind(id)})`) : 'Nothing collected'],
            ['Needed but not collected', labels(list(t.requiredArtifactIds).filter((id) => !locker[id])).length ? labels(list(t.requiredArtifactIds).filter((id) => !locker[id])) : 'None'],
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
          fix: () => `Collect the attachment email, the opened document, the PowerShell process log, the dropped file, the Run key and the deleted archive (${ids(truth().requiredArtifactIds)}). Leave out routine items such as patches and updates.`,
        })],
      },
      {
        id: 'acquisition',
        recordedSince: SINCE,
        title: 'Source and acquisition details',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Acquisition records', null]];
          const rows = list(truth().requiredArtifactIds).filter((id) => locker[id]).map((id) => `${id}: ${locker[id].source || 'no source'} · ${METHOD_TEXT[locker[id].method] || locker[id].method || 'no method'} · acquired by ${locker[id].acquiredBy || 'nobody recorded'}`);
          return [['Acquisition records for the needed evidence', rows.length ? rows : 'None recorded']];
        },
        checks: [criterionCheck('acquisition-metadata', {
          label: 'Recorded the correct source, collection method and collector for the needed evidence',
          expected: 'The system the evidence came from, a method that system supports, and who collected it',
          given: (result) => {
            const locker = lockerOf(result) || {};
            const lower = (v) => String(v || '').toLowerCase();
            const wrong = list(truth().requiredArtifactIds).filter((id) => locker[id] && !(lower(locker[id].source) === lower((artifact(id) || {}).source) && list((artifact(id) || {}).methods).includes(locker[id].method) && String(locker[id].acquiredBy || '').trim()));
            return wrong.length ? `Source, method or collector wrong or blank: ${ids(wrong)}` : '';
          },
          fix: 'For each item record the system it came from, how it was collected, and who collected it. The original source must match where the evidence really lives (for example the disk image or the mail gateway export).',
        })],
      },
      {
        id: 'integrity',
        recordedSince: SINCE,
        title: 'Hash checks',
        answer: (result) => {
          const locker = lockerOf(result);
          if (!locker) return [['Hash verification', null]];
          const state = (id) => (locker[id] ? (locker[id].integrity === 'verified' ? 'verified' : locker[id].integrity === 'mismatch' ? 'does NOT match the source hash' : 'not checked') : 'not collected');
          const mismatchId = truth().mismatchArtifactId;
          const seen = historyOf(result).some((a) => a && a.type === 'verify' && a.details && a.details.artifactId === mismatchId && a.details.integrity === 'mismatch');
          return [
            ['Hash status of the needed evidence', list(truth().requiredArtifactIds).map((id) => `${id}: ${state(id)}`)],
            [`Truncated export (${mismatchId}) noticed`, seen ? 'Yes, the failed check was recorded' : 'No failed check recorded'],
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
          fix: () => `Re-hash every needed item and compare it with the source hash. ${truth().mismatchArtifactId} comes from a truncated export, so the hash fails; collect it again and verify the new copy.`,
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
          fix: () => `Verify the memory image, then transfer it to ${custodian(truth().specialistCustodian)} and say why. Memory analysis needs the forensics team, not the SOC analyst or the legal repository.`,
        })],
      },
      {
        id: 'preservation',
        recordedSince: SINCE,
        title: 'Legal hold and evidence package',
        answer: (result) => {
          const rec = evidence(result);
          if (!rec) return [['Legal hold', null], ['Evidence package', null]];
          const hold = rec.legalHold;
          const exports = list(rec.exports);
          return [
            ['Originals placed under legal hold', hold ? labels(hold.artifactIds) : 'None'],
            ['Reason given for the hold', hold ? hold.reason || '—' : 'No hold placed'],
            ['Evidence packages exported', exports.length ? exports.map((pkg) => `${pkg.id} with ${list(pkg.artifactIds).length} items at ${stamp(pkg.at)}`) : 'None'],
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
          fix: () => `Place the original email, document, dropped file and deleted archive (${ids(truth().originalsForHold)}) under legal hold, then export one package whose hashes match the source.`,
        })],
      },
      {
        id: 'timeline',
        recordedSince: SINCE,
        title: 'Timeline',
        answer: (result) => {
          const rec = evidence(result);
          if (!rec) return [['Timeline in the order the student built it', null]];
          const timeline = list(rec.timeline);
          return [['Timeline in the order the student built it', timeline.length ? timeline.map((id) => `${stamp((artifact(id) || {}).time)} · ${label(id)}`) : 'Empty'],
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
          fix: () => `Put all six key records (${ids(truth().chain)}) on the timeline in the order they happened, with nothing out of time order.`,
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
          return list(rec.statements).filter((item) => item.kind !== 'root_cause').map((item) => ({
            label: `${KIND_TEXT[item.kind] || item.kind} · cites ${ids(item.artifactIds)}`, text: item.text,
          }));
        },
        mechanics: true,
        checks: [
          criterionCheck('fact-analysis', {
            label: 'Facts stated plainly with evidence cited, and kept separate from analysis',
            expected: 'At least 3 facts with no guesswork words, and at least 1 analysis statement',
            given: (result) => {
              const statements = list(evidence(result) && evidence(result).statements);
              return `${statements.filter((s) => s.kind === 'fact').length} facts, ${statements.filter((s) => s.kind === 'analysis').length} analysis statements`;
            },
            fix: 'Write at least three facts that only say what a record shows (no "likely", "appears" or "because"), and put interpretation in separate analysis statements. Cite the evidence for each.',
          }),
          {
            label: 'No statement claims data theft or encryption is confirmed (the evidence does not show it)',
            expected: 'Exfiltration recorded as unknown',
            test: (result) => (Array.isArray(result.critical_errors) ? !result.critical_errors.length : null),
            given: (result) => list(result.critical_errors)[0] || 'A confirmed-theft claim was flagged',
            fix: 'Do not say data was stolen or encrypted: the proxy shows no upload, so record exfiltration as unknown instead.',
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
          const mine = list(rec.statements).filter((item) => item.kind === 'root_cause');
          return mine.length ? mine.map((item) => ({ label: `Root cause · cites ${ids(item.artifactIds)}`, text: item.text })) : [{ label: 'Root cause · student response', text: '' }];
        },
        checks: [criterionCheck('root-cause', {
          label: () => `Root cause is the macro attachment, citing at least two of ${ids(truth().rootCauseArtifactIds)}`,
          expected: () => `Opened macro document; evidence ${ids(truth().rootCauseArtifactIds)}`,
          given: (result) => {
            const last = list(evidence(result) && evidence(result).statements).filter((item) => item.kind === 'root_cause').slice(-1)[0];
            if (!last) return 'No root cause statement';
            const cited = list(truth().rootCauseArtifactIds).filter((id) => list(last.artifactIds).includes(id));
            return `Cites ${cited.length} of ${list(truth().rootCauseArtifactIds).length} key records`;
          },
          fix: () => `State the root cause as the macro-enabled attachment that was opened, and cite the email, the document and the PowerShell log (${ids(truth().rootCauseArtifactIds)}).`,
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
          fix: () => `Map the behaviours the records prove (phishing attachment, user execution, PowerShell, Run key) to ATT&CK and cite the record for each. Do not map data theft (${ids(truth().unsupportedTechniques)}), because nothing shows it.`,
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
          const out = list(rec.unknowns).map((item) => ({ label: `Unknown · ${TOPIC_TEXT[item.topic] || item.topic}`, text: item.text }));
          if (rec.escalation) out.push({ label: `Escalation reason · ${ROUTE_TEXT[rec.escalation.route] || rec.escalation.route}${list(rec.escalation.artifactIds).length ? ` · cites ${ids(rec.escalation.artifactIds)}` : ''}`, text: rec.escalation.reason });
          return out.length ? out : [{ label: 'Unknowns and escalation · student response', text: '' }];
        },
        checks: [criterionCheck('unknowns-escalation', {
          label: () => `Recorded what is still unknown (${list(truth().unknowns).join(' and ')}) and escalated the memory image to Digital Forensics`,
          expected: () => `Unknowns: ${list(truth().unknowns).join(', ')}; escalate ${truth().specialistArtifactId} to ${ROUTE_TEXT[truth().escalationRoute] || truth().escalationRoute}`,
          given: (result) => {
            const rec = evidence(result) || {};
            const topics = list(rec.unknowns).map((u) => u.topic);
            const missing = list(truth().unknowns).filter((topic) => !topics.includes(topic));
            return `${missing.length ? `Unknown topics missing: ${missing.join(', ')}. ` : ''}${rec.escalation ? `Escalated to ${ROUTE_TEXT[rec.escalation.route] || rec.escalation.route}.` : 'No escalation recorded.'}`;
          },
          fix: () => `Record that it is unknown whether data left the network and what the memory image shows. Then escalate to ${ROUTE_TEXT[truth().escalationRoute]} and cite the memory image (${truth().specialistArtifactId}).`,
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

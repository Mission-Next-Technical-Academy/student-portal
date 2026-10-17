/* Submission Sheet — Module 05 Prove It, CASE-055127 / INC-055436 (ws-assess-27, user
 * j.alvarez: browser -> PowerShell -> syncsvc.exe, Run-key persistence,
 * detection-only EDR, benign signed updater). Lab key
 * 'lab-endpoint-investigation'.
 *
 * Answer key: SocM05AssessmentData.scenario.expectedTruth
 * (soc-m05-assessment-data.js) plus the ticket rosters in
 * soc-analyst-module-05.js (MODULE_FIVE_ENTITY_ROSTER,
 * MODULE_FIVE_DEPARTMENT_OPTIONS). Scoring it mirrors:
 * SocM05AssessmentScorer.score() over SocM05AssessmentRubric.extract(). The
 * scorer saves each criterion's points, max, evidence and misses in
 * result.review_payload.criteria, so every console-work section reads its
 * ✓ / ◐ / ✗ from there and cannot disagree with the points given. The
 * red-pen notes are written here in plain English from the student's own
 * console work (result.work_summary), mirroring the rubric's conditions;
 * the scorer's internal miss strings are never passed to the student.
 *
 * SocM05AssessmentScorer does NOT read the ITSM ticket (status, severity,
 * affected user/device, disposition, route, work notes): it scores the
 * console work (analysis notes, reviewed records, evidence package, EDR
 * handoff, response requests). The ticket sections are therefore advisory;
 * their expected values are the module's documented answers (truth
 * confirmedUser/confirmedDevice; High / confirmed malicious / Endpoint-EDR
 * Response as in the unused moduleFiveCaseScore() feedback).
 *
 * Saved payload (m05 submit, soc-analyst-module-05.js ~1565): result.case_record
 * (ticket + notes + actionHistory), result.case_display (ticket rows as the
 * student saw them), result.review_payload (criteria, entityIdentity,
 * attempt/revision), result.notes (copy of the ticket notes) and, from
 * 2026-10-17, result.work_summary (console work, moduleFiveWorkSummary)
 * because that work was not saved before. work_summary.handoffStatusUpdates
 * (the "Update handoff" form) was added later the same day.
 *
 * Labels follow the console the student used (soc-m05-assessment-device-ui.js,
 * soc-console-tools.js PACKS.m05): "Analyst note", the response form's Action /
 * Reason / Requester / File on this device, the EDR handoff form's Summary /
 * Owner / Recipient / Recommendation and its Status / Updated by update form.
 * Opening a workstation writes an automatic device_review record whose note
 * is console text, not student writing, so it is shown as how the workstation
 * was opened and never proofread.
 */
(() => {
  'use strict';
  if (typeof AdminSubmissionSheet === 'undefined') return;

  const data = () => (typeof SocM05AssessmentData !== 'undefined' ? SocM05AssessmentData : null);
  const scenario = () => (data() ? data().scenario : null);
  const truth = () => (scenario() ? scenario().expectedTruth : null) || {};
  const roster = (kind) => (typeof MODULE_FIVE_ENTITY_ROSTER !== 'undefined' ? MODULE_FIVE_ENTITY_ROSTER[kind] : []) || [];
  const departments = () => (typeof MODULE_FIVE_DEPARTMENT_OPTIONS !== 'undefined' ? MODULE_FIVE_DEPARTMENT_OPTIONS : []);
  const bounceBelow = () => (typeof MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD !== 'undefined' ? MODULE_FIVE_DEPARTMENT_BOUNCE_THRESHOLD : 40);
  // Documented answers for the unscored ticket fields (see header).
  const CORRECT_SEVERITY = 'high';
  const CORRECT_DISPOSITION = 'true-positive';
  const NOTES_MIN = 80; // case-record.js CASE_RECORD_NOTES_MIN (moduleFiveCaseSpec sets no notesMin)
  // Console work is on the attempt from this date (result.work_summary); older attempts say so.
  const SINCE = '2026-10-17';

  // Console labels: the console's own (SocM05AssessmentDeviceUi, which shows the
  // same words as its form options), with a copy for when that file is absent.
  const ui = (name, fallback) => (typeof SocM05AssessmentDeviceUi !== 'undefined' && SocM05AssessmentDeviceUi[name]) || fallback;
  const REQUEST_ACTION = ui('REQUEST_ACTION', { endpoint_isolation_request: 'Request endpoint isolation', endpoint_quarantine_request: 'Request file quarantine' });
  const REQUEST_STATUS = ui('REQUEST_STATUS', { pending_approval: 'Pending approval' });
  const HANDOFF_STATUS = ui('HANDOFF_STATUS', { submitted: 'Submitted', accepted: 'Accepted', in_progress: 'In progress', completed: 'Completed', rejected: 'Rejected' });
  const REQUEST_NOUN = { endpoint_isolation_request: 'isolation', endpoint_quarantine_request: 'file quarantine' };
  // Automatic device_review notes written by the console (soc-console-tools.js PACKS.m05) and how the student opened the workstation.
  const OPENED_FROM = { 'Pivoted from alert to device.': 'from the alert', 'Learner opened device profile and telemetry.': 'from the device inventory' };
  const labelOf = (labels, id) => labels[id] || String(id || '').replace(/_/g, ' ');

  const byId = (options, id) => options.find((option) => option.id === id) || null;
  const textOf = (options, id) => (byId(options, id) || {}).text || id || '';
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
  const base = (path) => String(path || '').split(/[\\/]/).pop();
  const time = (at) => {
    const date = at ? new Date(at) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—';
  };

  const record = (result) => (result.case_record && typeof result.case_record === 'object' ? result.case_record : null);
  const field = (result, key) => {
    const r = record(result);
    return r ? (typeof r[key] === 'string' ? r[key] : '') : null;
  };
  const severityOf = (result) => (record(result) ? field(result, 'severity') || field(result, 'priority') : null);
  const dispositionOf = (result) => (record(result) ? field(result, 'disposition') || field(result, 'verdict') : null);
  const payload = (result) => (result.review_payload && typeof result.review_payload === 'object' ? result.review_payload : null);
  const criteria = (result) => (payload(result) && Array.isArray(payload(result).criteria) ? payload(result).criteria.filter((c) => c && typeof c === 'object' && c.id) : null);
  const criterion = (result, id) => (criteria(result) || []).find((c) => c.id === id) || null;
  const work = (result) => (result.work_summary && typeof result.work_summary === 'object' ? result.work_summary : null);
  const list = (value) => (Array.isArray(value) ? value : []);
  const unique = (items) => [...new Set(items.filter(Boolean))];

  // Ticket values may be stored under the old inventory id / mixed case
  // (soc-analyst-module-05.js moduleFiveCanonicalCaseEntities); fold them.
  const canonicalUser = (value) => (typeof moduleFiveCanonicalAccount === 'function' ? moduleFiveCanonicalAccount(value) : value);
  const canonicalDevice = (value) => (typeof SocM05AssessmentState !== 'undefined' && data() ? SocM05AssessmentState.canonicalDeviceId(value, data()) : value);
  const tierFor = (kind, value) => {
    const folded = kind === 'users' ? canonicalUser(value) : canonicalDevice(value);
    return (byId(roster(kind), folded) || {}).tier;
  };
  const principalText = (kind) => (roster(kind).find((o) => o.tier === 'principal') || {}).text || '';
  // The ticket value as the student saw it (case_display), else the stored value.
  const ticketShown = (result, ctx, label, key) => (record(result) ? shown(ctx, label, field(result, key)) : null);

  // ---- the case facts the notes refer to (fixture, never re-typed)
  const telemetry = () => list(scenario() && scenario().telemetry);
  const hostOf = (id) => ((scenario() && list(scenario().devices).find((device) => device.id === canonicalDevice(id))) || {}).hostname || id;
  const hosts = (ids) => unique(list(ids).map(hostOf));
  const device = () => (truth().confirmedDevice || {}).value || 'ws-assess-27';
  const malware = () => truth().maliciousFile || {};
  const malwareName = () => base(malware().path) || 'syncsvc.exe';
  // "AcmeUpdater (AcmeUpdate.exe)": the product folder and the file, as the console lists them.
  const updaterName = () => {
    const ids = list((list(truth().benignActivity)[0] || {}).eventIds);
    const event = telemetry().find((item) => ids.includes(item.id) && (item.filePath || item.image));
    if (!event) return 'updater';
    const parts = String(event.filePath || event.image).split(/[\\/]/);
    return parts.length > 1 ? `${parts[parts.length - 2]} (${parts[parts.length - 1]})` : parts[0];
  };
  const scopeDevices = () => list(truth().scope && truth().scope.deviceIds);
  const scopeEvents = () => list(truth().scope && truth().scope.eventIds);
  // A hash as the console's pickers show it: first 12 characters, then the file it belongs to.
  const hashText = (hash) => {
    const owner = telemetry().find((event) => event.sha256 === hash && (event.filePath || event.image));
    return `${hashShort(hash)}${owner ? ` (${base(owner.filePath || owner.image)})` : ''}`;
  };
  const hashShort = (hash) => `${String(hash).slice(0, 12)}…`;
  const quote = (text, max = 90) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return `“${clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean}”`;
  };
  // Quote the student's own words around a phrase: the sentence it is in, or a
  // short window around it when that sentence is long.
  const quoteAround = (texts, phrase) => {
    const needle = String(phrase).toLowerCase();
    for (const text of texts) {
      const sentence = String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).find((part) => part.toLowerCase().includes(needle));
      if (!sentence) continue;
      if (sentence.length <= 90) return quote(sentence);
      const at = sentence.toLowerCase().indexOf(needle);
      const from = Math.max(0, sentence.lastIndexOf(' ', Math.max(0, at - 25)) + 1);
      const to = sentence.indexOf(' ', Math.min(sentence.length, at + needle.length + 25));
      return `“${from > 0 ? '…' : ''}${sentence.slice(from, to < 0 ? undefined : to).trim()}${to < 0 ? '' : '…'}”`;
    }
    return quote(phrase);
  };

  // ---- what the student did, read from work_summary (the scorer's inputs, in words)
  const analystNotes = (w) => list(w.analysisNotes).map((note) => note && note.text).filter(Boolean);
  // Every piece of student writing the rubric reads (notes, corrections, handoffs, request reasons).
  const writing = (w) => [
    ...analystNotes(w),
    ...list(w.analysisUpdates).flatMap((update) => [update.value, update.reason]),
    ...list(w.deviceReviews).filter((review) => review.note && !OPENED_FROM[review.note]).map((review) => review.note),
    ...list(w.eventReviews).map((review) => review.note),
    ...list(w.edrHandoffs).flatMap((handoff) => [handoff.summary, handoff.recommendation]),
    ...list(w.approvalRequests).map((request) => request.reason),
  ].filter(Boolean);
  const writes = (w, terms) => terms.find((term) => writing(w).join(' ').toLowerCase().includes(term)) || '';
  const cited = (w) => new Set([
    ...list(w.analysisNotes).flatMap((note) => list(note.relatedEventIds)),
    ...list(w.eventReviews).map((review) => review.eventId),
    ...list(w.edrHandoffs).flatMap((handoff) => list(handoff.eventIds)),
    ...(w.evidencePackage ? list(w.evidencePackage.eventIds) : []),
  ]);
  const opened = (w) => unique(list(w.deviceReviews).map((review) => canonicalDevice(review.deviceId)));
  const noNotes = (w) => (analystNotes(w).length ? '' : 'you recorded no analyst note');

  /* One console-work section check. The ✓ / ◐ / ✗ is the scorer's saved
   * criterion; the red-pen note is `note(w)` — plain instructions that quote
   * what the student did — or `fallback` when the attempt has no saved work. */
  function criterionCheck(id, label, fallback, note) {
    const fix = (result) => {
      const w = work(result);
      return (w && note ? note(w, result) : '') || fallback;
    };
    return {
      label,
      // Scorer: full weight when the outcome is evidenced, half when only partial evidence exists, else 0.
      test: (result) => {
        const c = criterion(result, id);
        if (!c) return null;
        return c.points >= c.max ? true : c.points > 0 ? 'partial' : false;
      },
      given: (result) => {
        const c = criterion(result, id);
        return c ? `${c.points} of ${c.max} points` : null;
      },
      fix,
      fixPartial: fix,
    };
  }
  const withYou = (instruction, detail) => (detail ? `${instruction} (${detail}).` : `${instruction}.`);

  // ---- per-criterion notes (conditions mirror SocM05AssessmentRubric.extract)
  function ancestryNote(w) {
    const chain = list((truth().processAncestry || {}).chain);
    const ids = list((truth().processAncestry || {}).eventIds);
    const instruction = `record the process chain in an analyst note: the browser (process ${chain[0] || '4100'}) started PowerShell (${chain[1] || '4172'}), which started ${malwareName()} (${chain[2] || '4224'})`;
    const got = ids.filter((eventId) => cited(w).has(eventId));
    const pids = chain.filter((pid) => writing(w).join(' ').includes(pid));
    const detail = noNotes(w)
      || (got.length ? `you cited only ${got.join(', ')}` : pids.length ? `your notes mention process ${pids.join(', ')} but not how the processes connect` : 'your notes do not mention these processes');
    return withYou(instruction, detail);
  }
  function interpretationNote(w) {
    const instruction = `distinguish the unsigned ${malwareName()} as malicious from the signed ${updaterName()} as benign`;
    // Like the rubric, a later "Correction:" note replaces what came before.
    const corrections = analystNotes(w).filter((text) => /correction:|corrected analysis:|revised finding:/i.test(text));
    const latest = corrections.length ? [corrections[corrections.length - 1]] : writing(w);
    const wrong = ['acmeupdater is malicious', 'updater is malicious', 'quarantine acmeupdater'].find((term) => latest.join(' ').toLowerCase().includes(term));
    if (wrong) return withYou(instruction, `you wrote ${quoteAround(latest, wrong)}`);
    const text = writing(w).join(' ').toLowerCase();
    const maliciousPresent = [malware().path, malware().sha256, malwareName()].filter(Boolean).some((term) => text.includes(String(term).toLowerCase()))
      || list(malware().eventIds).some((eventId) => cited(w).has(eventId));
    const benignIds = list(truth().benignActivity).flatMap((group) => list(group.eventIds));
    const citedBenign = benignIds.filter((eventId) => cited(w).has(eventId));
    const benignPresent = citedBenign.length > 0 || ['acmeupdater', 'signed updater', 'benign updater'].some((term) => text.includes(term));
    if (!maliciousPresent) return withYou(instruction, noNotes(w) || `your response does not name or cite the unsigned payload (${list(malware().eventIds).join(', ')})`);
    if (!benignPresent) return withYou(instruction, `you named or cited the malicious payload but did not mention the signed ${updaterName()} or cite its events (${benignIds.slice(0, 2).join(', ')})`);
    if (citedBenign.length && !/acmeupdater.{0,40}(?:benign|harmless|signed)|(?:benign|harmless|signed).{0,40}acmeupdater/i.test(text)) {
      return withYou(instruction, `you cited ${citedBenign.join(', ')} but did not explain that the signed updater is benign`);
    }
    return withYou(instruction, `your response includes both activity types; state explicitly that the signed ${updaterName()} is benign`);
  }
  function persistenceNote(w) {
    const p = truth().persistence || {};
    return withYou(`name the Run-key entry ${malwareName()} created (${p.registryPath || 'the Run key'}, ${list(p.eventIds).join(', ')}) in an analyst note or the handoff`,
      noNotes(w) || 'none of your notes or handoffs mention it');
  }
  function controlNote(w) {
    const instruction = 'write that the sensor detected the execution but did not prevent it, and do not claim it was blocked or cleaned up';
    const claim = writes(w, ['execution prevented', 'successfully blocked', 'cleaned up']);
    if (claim) return withYou(instruction, `you wrote ${quoteAround(writing(w), claim)}`);
    return withYou(instruction, noNotes(w) || 'none of your notes say what the sensor did');
  }
  function scopeNote(w) {
    const notes = [];
    const named = unique([...list(w.selectedDeviceIds), ...opened(w), ...list(w.edrHandoffs).flatMap((handoff) => list(handoff.deviceIds))].map(canonicalDevice));
    if (!named.includes(device())) notes.push(withYou(`open ${device()} and name it in your response: it is the workstation that ran the payload`, named.length ? `you opened only ${hosts(named).join(', ')}` : 'you opened no workstation'));
    const extraHandoff = unique(list(w.edrHandoffs).flatMap((handoff) => list(handoff.deviceIds)).map(canonicalDevice).filter((id) => !scopeDevices().includes(id)));
    const extraRequests = list(w.approvalRequests).filter((request) => request.deviceId && !scopeDevices().includes(canonicalDevice(request.deviceId)));
    const extras = unique([...extraHandoff, ...extraRequests.map((request) => canonicalDevice(request.deviceId))]);
    if (extras.length) {
      const how = [extraHandoff.length ? `you put ${hosts(extraHandoff).join(', ')} in an EDR handoff` : '',
        ...extraRequests.map((request) => `you asked for ${labelOf(REQUEST_NOUN, request.type)} of ${hostOf(request.deviceId)}`)].filter(Boolean);
      notes.push(withYou(`keep ${hosts(extras).join(', ')} out of the response: only ${device()} ran the payload`, unique(how).join('; ')));
    }
    return notes.map((text, index) => (index ? text.charAt(0).toUpperCase() + text.slice(1) : text)).join(' ');
  }
  function preservationNote(w) {
    const instruction = `preserve ${device()}’s malware events with the ${malwareName()} hash (${hashShort(malware().sha256)}) in the evidence package`;
    const pkg = w.evidencePackage;
    if (!pkg) return withYou(instruction, 'you preserved no evidence package');
    if (!scopeDevices().includes(canonicalDevice(pkg.deviceId))) return withYou(instruction, `your package is for ${hostOf(pkg.deviceId)}`);
    if (!list(pkg.eventIds).some((eventId) => scopeEvents().includes(eventId))) return withYou(instruction, `your package holds ${list(pkg.eventIds).join(', ')}, none of them malware events`);
    return withYou(instruction, list(pkg.hashes).length ? `your package has only ${list(pkg.hashes).map(hashText).join(', ')}` : 'your package has no file hash');
  }
  function handoffNote(w) {
    const instruction = `send an EDR handoff for ${device()} with its malware events, the ${malwareName()} hash and a clear recommendation such as isolate or contain`;
    const handoffs = list(w.edrHandoffs);
    if (!handoffs.length) return withYou(instruction, 'you sent no EDR handoff');
    const gaps = (handoff) => [
      !list(handoff.deviceIds).map(canonicalDevice).includes(device()) && `is for ${hosts(handoff.deviceIds).join(', ') || 'no workstation'}, not ${device()}`,
      !list(handoff.eventIds).some((eventId) => scopeEvents().includes(eventId)) && 'includes none of the malware events',
      !list(handoff.hashes).includes(malware().sha256) && `does not include the ${malwareName()} hash`,
      !['isolate', 'contain', 'investigate', 'remove', 'eradicate', 'preserve'].some((term) => String(handoff.recommendation || '').toLowerCase().includes(term)) && `recommends ${quote(handoff.recommendation, 60)} without an action such as isolate, contain or remove`,
    ].filter(Boolean);
    const closest = handoffs.slice().sort((a, b) => gaps(a).length - gaps(b).length)[0];
    return withYou(instruction, `your handoff to ${closest.recipient || 'the endpoint team'} ${gaps(closest).join(', ') || 'was not complete'}`);
  }
  function safeResponseNote(w) {
    const instruction = `keep isolation or quarantine as a request awaiting approval, for ${device()} only, with a reason, and never write that it was carried out`;
    const unsafe = list(w.approvalRequests).filter((request) => request.status !== 'pending_approval' || !scopeDevices().includes(canonicalDevice(request.deviceId))
      || !String(request.reason || '').trim() || !String(request.requestedBy || '').trim());
    const claim = writes(w, ['execute isolation', 'isolation executed', 'quarantine executed', 'disable the sensor', 'delete evidence']);
    const detail = [
      ...unsafe.map((request) => (!scopeDevices().includes(canonicalDevice(request.deviceId))
        ? `you asked for ${labelOf(REQUEST_NOUN, request.type)} of ${hostOf(request.deviceId)}, which is outside this incident`
        : `your ${labelOf(REQUEST_NOUN, request.type)} request for ${hostOf(request.deviceId)} needs a reason and a requester`)),
      claim ? `you wrote ${quoteAround(writing(w), claim)}` : '',
    ].filter(Boolean);
    return withYou(instruction, detail.join('; '));
  }

  function notePieces() {
    const t = truth();
    const file = t.maliciousFile || {};
    const chain = (t.processAncestry || {}).chain || [];
    const hash = file.sha256 || '';
    return [
      { name: `the affected user (${(t.confirmedUser || {}).value})`, short: (t.confirmedUser || {}).value, terms: [(t.confirmedUser || {}).value] },
      { name: `the affected workstation (${(t.confirmedDevice || {}).value})`, short: (t.confirmedDevice || {}).value, terms: [(t.confirmedDevice || {}).value] },
      { name: `the malicious file (${base(file.path)})`, short: base(file.path), terms: [base(file.path), hash] },
      { name: 'the process chain: browser starts PowerShell, which starts the payload', short: 'the browser to PowerShell to payload chain', terms: [...chain, 'powershell', 'parent', 'child', 'chain', 'ancestry'] },
      { name: 'the Run-key persistence entry', short: 'the Run-key persistence entry', terms: ['persistence', 'run key', 'run-key', 'registry', base((t.persistence || {}).registryPath)] },
      { name: 'that the sensor detected the execution but did not prevent it', short: 'that the sensor detected but did not prevent it', terms: ['not prevented', 'detected but', 'detection only', 'did not prevent', 'detected_not_prevented', 'detect'] },
      { name: 'the harmless signed updater, kept separate from the malware', short: 'the harmless signed updater', terms: ['acmeupdater', 'signed updater', 'benign updater', 'updater'] },
      { name: 'the recommended response (isolate or contain, hand off to EDR)', short: 'the recommended response', terms: ['isolate', 'contain', 'quarantine', 'edr', 'eradicate', 'remove', 'preserve'] },
    ].map((piece) => ({ ...piece, terms: piece.terms.filter(Boolean) }));
  }

  // The scorer's miss strings, minus its internal word "fixture" (the scenario data), for the instructor's rubric panel.
  const plainMiss = (text) => String(text)
    .replace(/\ba fixture-supported\b/g, 'an').replace(/\bfixture-supported\s+/g, '')
    .replace(/,\s*fixture-scoped\b/g, ', in-scope').replace(/\bfixture-scoped\b/g, 'in-scope')
    .replace(/\bAssessment fixture truth\b/g, 'The answer key');

  AdminSubmissionSheet.register(['lab-endpoint-investigation'], {
    title: 'Module 05 · PROVE IT — Infected Workstation Investigation',
    fixture: data,
    caseId: () => {
      const s = scenario();
      return s ? [s.caseId, s.incidentId].filter(Boolean).join(' · ') : 'Module 05 case';
    },
    // The scorer's evidence strings include raw device ids and request types; show the criteria as saved.
    rubric: (result) => (criteria(result) || []).map((c) => ({
      label: String(c.label || c.id),
      earned: c.points ?? 0,
      max: c.max ?? null,
      misses: (Array.isArray(c.misses) ? c.misses : []).filter(Boolean).map(plainMiss),
      deductions: (Array.isArray(c.deductions) ? c.deductions : []).filter((d) => d && d.points).map((d) => `-${d.points} ${d.reason || ''}`.trim()),
      evidence: (Array.isArray(c.supportingEvidence) ? c.supportingEvidence : []).filter(Boolean).map(String),
    })),
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
          label: 'Case left open while Endpoint/EDR Response acts (In Progress or Pending, not Resolved)',
          expected: 'In Progress or Pending',
          // Advisory: SocM05AssessmentScorer does not score status.
          test: (result) => (field(result, 'status') === null ? null : ['in-progress', 'pending'].includes(field(result, 'status'))),
          given: (result, ctx) => shown(ctx, 'Status', std('status', field(result, 'status'))) || 'Left blank',
          fix: (result, ctx) => `Keep the case In Progress (you set it to ${shown(ctx, 'Status', std('status', field(result, 'status'))) || 'nothing'}). The persistence entry still has to be removed from the workstation, so it is not resolved yet.`,
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
          test: (result) => (severityOf(result) === null ? null : severityOf(result) === CORRECT_SEVERITY),
          given: (result, ctx) => shown(ctx, 'Severity', std('severity', severityOf(result))) || 'Left blank',
          fix: (result, ctx) => `Set Severity to High (you chose ${shown(ctx, 'Severity', std('severity', severityOf(result))) || 'nothing'}). Malware ran on a workstation and set itself up to survive a restart.`,
        }],
      },
      {
        id: 'affected-user',
        title: 'Affected user',
        required: false,
        answer: (result, ctx) => [['Affected user', blankAs(ticketShown(result, ctx, 'Affected user', 'affectedUser'))]],
        checks: [{
          label: () => `Names the user whose workstation ran the malware (${principalText('users')})`,
          expected: () => principalText('users'),
          test: (result) => {
            if (field(result, 'affectedUser') === null) return null;
            const tier = tierFor('users', field(result, 'affectedUser'));
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result, ctx) => ticketShown(result, ctx, 'Affected user', 'affectedUser') || 'Left blank',
          fix: () => `Put ${principalText('users')} in Affected user. That account was signed in when the browser started PowerShell.`,
          fixPartial: (result, ctx) => `${ticketShown(result, ctx, 'Affected user', 'affectedUser')} appears in the data, but ${principalText('users')} owns the infected workstation. Name ${principalText('users')}.`,
        }],
      },
      {
        id: 'affected-device',
        title: 'Affected device',
        required: false,
        answer: (result, ctx) => [['Affected device', blankAs(ticketShown(result, ctx, 'Affected device', 'affectedDevice'))]],
        checks: [{
          label: () => `Names the infected workstation (${principalText('devices')})`,
          expected: () => principalText('devices'),
          test: (result) => {
            if (field(result, 'affectedDevice') === null) return null;
            const tier = tierFor('devices', field(result, 'affectedDevice'));
            return tier === 'principal' ? true : tier === 'pivot' ? 'partial' : false;
          },
          given: (result, ctx) => ticketShown(result, ctx, 'Affected device', 'affectedDevice') || 'Left blank',
          fix: () => `Put ${principalText('devices')} in Affected device. It ran the payload and holds the Run-key entry.`,
          fixPartial: (result, ctx) => `${ticketShown(result, ctx, 'Affected device', 'affectedDevice')} ran a harmless updater, not the malware. Name ${principalText('devices')}, where the payload ran.`,
        }],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        required: false,
        answer: (result, ctx) => [['Disposition', blankAs(record(result) ? shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) : null)]],
        checks: [{
          label: `Marked as ${String(dispositionLabel(CORRECT_DISPOSITION)).toLowerCase()} (true positive)`,
          expected: () => dispositionLabel(CORRECT_DISPOSITION),
          test: (result) => (dispositionOf(result) === null ? null : dispositionOf(result) === CORRECT_DISPOSITION),
          given: (result, ctx) => shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) || 'Left blank',
          fix: (result, ctx) => `Record the disposition as Confirmed malicious activity (you chose ${shown(ctx, 'Disposition', dispositionLabel(dispositionOf(result))) || 'nothing'}). An unsigned file, started by PowerShell, wrote a Run-key entry.`,
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
            test: (result) => (field(result, 'escalation') === null ? null : field(result, 'escalation') === 'required'),
            given: (result, ctx) => shown(ctx, 'Escalation required', std('escalation', field(result, 'escalation'))) || 'Left blank',
            fix: 'Set Escalation to Required. Removing malware from the workstation is an Endpoint/EDR Response task, not an analyst task.',
          },
          {
            label: () => `Routed to the team that contains and cleans endpoints (${(departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text})`,
            expected: () => (departments().slice().sort((a, b) => b.fit - a.fit)[0] || {}).text,
            when: (result) => field(result, 'escalation') === 'required',
            test: (result) => {
              const chosen = byId(departments(), field(result, 'escalateTo'));
              if (!chosen) return false;
              return chosen.fit >= 100 ? true : chosen.fit >= bounceBelow() ? 'partial' : false;
            },
            given: (result, ctx) => shown(ctx, 'Route to department', textOf(departments(), field(result, 'escalateTo'))) || 'No department chosen',
            fix: (result) => (byId(departments(), field(result, 'escalateTo')) || {}).bounce || 'Route the case to Endpoint/EDR Response, who can isolate the workstation and remove the persistence.',
            fixPartial: (result) => `${(byId(departments(), field(result, 'escalateTo')) || {}).note} Route to Endpoint/EDR Response next time.`,
          },
        ],
      },
      {
        id: 'notes',
        title: 'Analyst work notes (ticket)',
        required: false,
        response: (result) => [{ label: 'Analyst work notes · student response', text: record(result) ? (record(result).notes || '') : null }],
        checks: [
          AdminSubmissionSheet.minLengthCheck({
            min: NOTES_MIN,
            text: (result) => field(result, 'notes'),
            fix: 'Write a fuller work note: the execution chain, your assessment, and the action you recommend for the workstation.',
          }),
        ],
        evidence: {
          label: 'Key evidence named in the work notes',
          text: (result) => field(result, 'notes'),
          pieces: notePieces,
          fix: (missing) => `Back your recommendation with the evidence: your note does not mention ${missing.join(', ')}.`,
        },
      },
      {
        id: 'analysis',
        title: 'Analysis notes from the console',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Workstations opened', null]];
          // Opening a workstation is recorded automatically; show where it was opened from, not the console's text.
          const openedRows = unique(list(w.deviceReviews).map((review) => review.deviceId)).map((id) => {
            const reviews = list(w.deviceReviews).filter((review) => review.deviceId === id);
            const from = unique(reviews.map((review) => OPENED_FROM[review.note] || ''));
            return `${hostOf(id)}${from.length ? ` (${from.join(' and ')})` : ''}${reviews.length > 1 ? `, ${reviews.length} times` : ''}`;
          });
          return [
            ['Workstations opened', openedRows.length ? openedRows : 'None opened'],
            ...(list(w.analysisNotes).length ? [] : [['Analyst notes', 'None recorded']]),
            ...(list(w.eventReviews).length ? [['Event records reviewed', list(w.eventReviews).map((r) => `${r.eventId}: ${String(r.status || '').replace(/_/g, ' ')}`)]] : []),
          ];
        },
        response: (result) => {
          const w = work(result);
          if (!w) return [{ label: 'Analyst note · student response', text: null }];
          const notes = list(w.analysisNotes);
          return [
            ...notes.map((n, index) => ({ label: `Analyst note ${index + 1} (${time(n.at)}${list(n.relatedDeviceIds).length ? `, ${hosts(n.relatedDeviceIds).join(', ')}` : ''}) · student response`, text: n.text })),
            ...list(w.analysisUpdates).map((u) => ({ label: `Corrected finding (${time(u.at)}): ${u.field}`, text: [u.value, u.reason].filter(Boolean).join('\n') })),
            // Only notes the student typed; the console's automatic "opened" notes are not student writing.
            ...list(w.deviceReviews).filter((r) => r.note && !OPENED_FROM[r.note]).map((r) => ({ label: `Note on workstation ${hostOf(r.deviceId)}`, text: r.note })),
            ...list(w.eventReviews).filter((r) => r.note).map((r) => ({ label: `Note on event ${r.eventId}`, text: r.note })),
          ];
        },
        // No automatic check of its own: the outcome sections below score what these notes say.
      },
      {
        id: 'ancestry',
        title: 'Process chain',
        recordedSince: SINCE,
        checks: [criterionCheck('process-ancestry', 'Linked the browser, PowerShell and payload processes into one parent-to-child chain', 'record the browser, PowerShell and payload chain in an analyst note, citing the three process events.', ancestryNote)],
      },
      {
        id: 'interpretation',
        title: 'Malicious payload vs harmless updater',
        recordedSince: SINCE,
        checks: [criterionCheck('malicious-benign-interpretation', 'Called the unsigned payload malicious and the signed, widely-seen updater harmless', 'say in an analyst note that the unsigned payload is malicious and that the signed updater is harmless.', interpretationNote)],
      },
      {
        id: 'persistence',
        title: 'Persistence',
        recordedSince: SINCE,
        checks: [criterionCheck('persistence', 'Found the Run-key entry the malware created to survive a restart', 'name the Run-key entry the payload created, in an analyst note or the handoff.', persistenceNote)],
      },
      {
        id: 'control',
        title: 'Detection vs prevention',
        required: false,
        recordedSince: SINCE,
        checks: [criterionCheck('prevention-detection', 'Said the sensor detected the execution but did not prevent it, and claimed no cleanup', 'record that the sensor detected the execution but did not stop it; do not claim it was blocked or cleaned up.', controlNote)],
      },
      {
        id: 'scope',
        title: 'Incident scope',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Workstation selected in the console', null]];
          const fromHandoffs = list(w.edrHandoffs).flatMap((h) => list(h.deviceIds));
          const fromRequests = list(w.approvalRequests).map((r) => r.deviceId).filter(Boolean);
          const named = hosts([...fromHandoffs, ...fromRequests]);
          return [
            ['Workstation selected in the console', list(w.selectedDeviceIds).length ? hosts(w.selectedDeviceIds) : 'None selected'],
            ['Workstations named in EDR handoffs and response requests', named.length ? named : 'None'],
          ];
        },
        checks: [criterionCheck('affected-device-scope', `Kept the incident on the infected workstation (${device()}) and did not pull in other machines`, 'name the infected workstation in your response and keep other machines out of it.', scopeNote)],
      },
      {
        id: 'evidence-preservation',
        title: 'Evidence preserved',
        required: false,
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Evidence package', null]];
          const pkg = w.evidencePackage;
          return [['Evidence package', pkg ? [`Preserved for ${hostOf(pkg.deviceId)}`, `Events: ${list(pkg.eventIds).join(', ') || 'none'}`, `File hashes: ${list(pkg.hashes).map(hashText).join(', ') || 'none'}`] : 'No evidence package preserved']];
        },
        checks: [criterionCheck('evidence-preservation', 'Saved the infected workstation’s event records and the malware’s file hash in an evidence package', 'preserve the infected workstation’s malware events and the malicious file hash in the evidence package.', preservationNote)],
      },
      {
        id: 'handoff',
        title: 'EDR handoff',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['EDR handoffs', null]];
          const handoffs = list(w.edrHandoffs);
          if (!handoffs.length) return [['EDR handoffs', 'None sent']];
          // handoffStatusUpdates was added after work_summary; null reads "Not recorded".
          const updates = Array.isArray(w.handoffStatusUpdates) ? w.handoffStatusUpdates : null;
          return handoffs.flatMap((h, index) => {
            const mine = updates === null ? null : updates.filter((u) => u.handoffId === h.id);
            return [
              [`Handoff ${index + 1}`, [`Workstation: ${hosts(h.deviceIds).join(', ')}`, `Owner: ${h.owner}`, `Recipient: ${h.recipient}`, `Events: ${list(h.eventIds).join(', ') || 'none'}`, `File hashes: ${list(h.hashes).map(hashText).join(', ') || 'none'}`, `Status: ${labelOf(HANDOFF_STATUS, h.status)}`]],
              [`Handoff ${index + 1} · status updates`, mine === null ? null : mine.length ? mine.map((u) => `${labelOf(HANDOFF_STATUS, u.status)} · Updated by ${u.updatedBy} · ${time(u.at)}`) : 'None'],
            ];
          });
        },
        response: (result) => {
          const w = work(result);
          if (!w) return [{ label: 'EDR handoff · student response', text: null }];
          return list(w.edrHandoffs).flatMap((h, index) => [
            { label: `Handoff ${index + 1} · Summary`, text: h.summary },
            { label: `Handoff ${index + 1} · Recommendation`, text: h.recommendation },
          ]);
        },
        checks: [criterionCheck('response-handoff', 'Sent an EDR handoff naming the infected workstation, its evidence, the malicious file hash and a defensible recommendation', 'send an EDR handoff for the infected workstation with its malware events, the malicious file hash and a clear recommendation such as isolate or contain.', handoffNote)],
      },
      {
        id: 'safe-response',
        title: 'Safe response boundary',
        recordedSince: SINCE,
        answer: (result) => {
          const w = work(result);
          if (!w) return [['Response requests', null]];
          const requests = list(w.approvalRequests);
          if (!requests.length) return [['Response requests', 'None made']];
          return requests.map((r, index) => [`Request ${index + 1}`, [
            `Action: ${labelOf(REQUEST_ACTION, r.type)}`,
            `Workstation: ${hostOf(r.deviceId)}`,
            ...(r.filePath || r.sha256 ? [`File on this device: ${[r.filePath, r.sha256].filter(Boolean).join(' · ')}`] : []),
            `Reason: ${r.reason || 'Left blank'}`,
            `Requester: ${r.requestedBy || 'Left blank'}`,
            `Status: ${labelOf(REQUEST_STATUS, r.status)}`,
          ]]);
        },
        checks: [criterionCheck('unsafe-action-boundary', 'Any isolation or quarantine was only a reasoned request awaiting approval, for the infected workstation, and never claimed as done', 'keep any isolation or quarantine as a request awaiting approval for the infected workstation, with a reason, and never write that it was carried out.', safeResponseNote)],
      },
      {
        id: 'timeline',
        title: 'Action timeline',
        required: false,
        collapsed: true,
        answer: (result) => {
          const r = record(result);
          if (!r || !Array.isArray(r.actionHistory)) return [['Recorded actions', null]];
          return [['Recorded actions', r.actionHistory.filter((entry) => entry && entry.action).map((entry) => `${time(entry.at)} · ${entry.action}`)]];
        },
      },
    ],
  });
})();

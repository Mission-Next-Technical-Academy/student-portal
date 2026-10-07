/* Report and IOC lifecycle for the independent Module 04 assessment. */
const SocM04IntelligenceUi = (() => {
  'use strict';

  const IOC_TYPES = Object.freeze(['ip', 'domain', 'url', 'email', 'file-hash']);
  const IOC_STATUSES = Object.freeze(['active', 'expired', 'retired', 'contextual']);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function seed(assessment, fixture) {
    if (!assessment || typeof assessment !== 'object') throw new TypeError('M04 assessment state is required.');
    if (!Array.isArray(assessment.reports)) assessment.reports = clone(fixture.scenario.reports);
    if (!Array.isArray(assessment.iocs)) assessment.iocs = clone(fixture.scenario.iocs);
    return assessment;
  }

  function validValue(type, value) {
    const text = String(value || '').trim();
    if (!text || text.length > 2048) return false;
    if (type === 'ip') {
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(text)) return text.split('.').every((part) => Number(part) <= 255);
      if (!text.includes(':') || !/^[0-9a-f:]+$/i.test(text) || text.length > 39) return false;
      try { return new URL(`http://[${text}]/`).hostname.length > 0; } catch { return false; }
    }
    if (type === 'domain') return text.length <= 253 && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(text);
    if (type === 'url') {
      try { const url = new URL(text); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname); } catch { return false; }
    }
    if (type === 'email') return text.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    if (type === 'file-hash') return /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128})$/i.test(text);
    return false;
  }

  function log(assessment, timestamp, operation, record, type = 'ioc_edit') {
    const wrapper = SocM04AssessmentActions.record({ assessment }, type, timestamp, type === 'ioc_edit' ? {
      entityType: record.kind, operation, recordId: record.id,
    } : record.details);
    assessment.actionHistory = wrapper.assessment.actionHistory;
    assessment.nextActionSequence = wrapper.assessment.nextActionSequence;
  }

  function mutate(assessment, fixture, command, input, timestamp) {
    seed(assessment, fixture);
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const data = input && typeof input === 'object' ? input : {};
    if (command === 'report-create' || command === 'report-edit') {
      const existing = command === 'report-edit' && assessment.reports.find((item) => item.id === data.id);
      if (command === 'report-edit' && !existing) throw new RangeError('Report not found.');
      const source = String(data.source ?? existing?.source ?? '').trim();
      const kind = String(data.kind ?? existing?.kind ?? '').trim();
      const summary = String(data.summary ?? existing?.summary ?? '').trim();
      if (!source || source.length > 100 || !kind || kind.length > 100 || !summary || summary.length > 2000) throw new TypeError('Report source, type, and summary are required and must fit their limits.');
      const record = existing
        ? { ...existing, source, kind, summary }
        : { id: `M04-R-L${String(assessment.nextActionSequence || 1).padStart(4, '0')}`, time: timestamp, source, kind, summary, sourceReliability: 'Learner-created · not independently verified', confidence: 0, freshness: `Created ${timestamp}`, status: 'Learner-created', campaign: '', attackReferences: [] };
      if (existing) assessment.reports = assessment.reports.map((item) => item.id === existing.id ? record : item);
      else assessment.reports.push(record);
      log(assessment, timestamp, existing ? 'edit' : 'create', { kind: 'report', id: record.id });
      return record;
    }
    if (command === 'ioc-create' || command === 'ioc-edit') {
      const existing = command === 'ioc-edit' && assessment.iocs.find((item) => item.id === data.id);
      if (command === 'ioc-edit' && !existing) throw new RangeError('IOC not found.');
      const type = String(data.type ?? existing?.type ?? '').trim().toLowerCase();
      const value = String(data.value ?? existing?.value ?? '').trim();
      const confidence = Number(data.confidence ?? existing?.confidence);
      const sourceReportId = String(data.sourceReportId ?? existing?.sourceReportId ?? '').trim();
      const context = String(data.context ?? existing?.context ?? '').trim();
    const status = String(data.status ?? existing?.status ?? 'active');
      if (!IOC_TYPES.includes(type) || !validValue(type, value)) throw new TypeError('Choose a supported IOC type and enter a valid value.');
      if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) throw new TypeError('Confidence must be a whole number from 0 to 100.');
      if (sourceReportId && !assessment.reports.some((item) => item.id === sourceReportId)) throw new TypeError('Source report must exist in this assessment.');
      if (context.length > 1000 || !IOC_STATUSES.includes(status)) throw new TypeError('IOC context or status is invalid.');
      const firstSeen = String(data.firstSeen ?? existing?.firstSeen ?? timestamp);
      const lastSeen = String(data.lastSeen ?? existing?.lastSeen ?? timestamp);
      if (Number.isNaN(Date.parse(firstSeen)) || Number.isNaN(Date.parse(lastSeen)) || Date.parse(lastSeen) < Date.parse(firstSeen)) throw new TypeError('IOC first-seen and last-seen dates must be valid and chronological.');
      const campaign = String(data.campaign ?? existing?.campaign ?? assessment.reports.find((item) => item.id === sourceReportId)?.campaign ?? '').trim();
      if (campaign.length > 200) throw new TypeError('Campaign name must be 200 characters or fewer.');
      const record = existing
        ? { ...existing, type, value, confidence, sourceReportId, context, status, firstSeen, lastSeen, campaign }
        : { id: `M04-I-L${String(assessment.nextActionSequence || 1).padStart(4, '0')}`, type, value, confidence, status, firstSeen, lastSeen, sourceReportId, context, campaign };
      if (existing) assessment.iocs = assessment.iocs.map((item) => item.id === existing.id ? record : item);
      else assessment.iocs.push(record);
      log(assessment, timestamp, existing ? 'edit' : 'create', { kind: 'ioc', id: record.id });
      return record;
    }
    if (command === 'ioc-status' || command === 'ioc-expire') {
      const existing = assessment.iocs.find((item) => item.id === data.id);
      if (!existing) throw new RangeError('IOC not found.');
      const status = command === 'ioc-expire' ? 'expired' : String(data.status || '');
      if (!IOC_STATUSES.includes(status)) throw new TypeError('IOC status must be active or expired.');
      const record = { ...existing, status };
      assessment.iocs = assessment.iocs.map((item) => item.id === existing.id ? record : item);
      log(assessment, timestamp, command === 'ioc-expire' ? 'expire' : 'status', { kind: 'ioc', id: record.id, status });
      return record;
    }
    throw new RangeError(`Unknown M04 intelligence command: ${command}`);
  }

  const VERDICTS = Object.freeze(['malicious', 'benign', 'unknown']);
  const MIN_RATIONALE = 25;
  const MAX_RATIONALE = 1000;

  // Records (or replaces) the learner's contextual verdict for one indicator. A later record for the same
  // indicator replaces the earlier one; every record is also logged to the action history.
  function recordVerdict(assessment, fixture, indicatorId, decision, rationale, timestamp) {
    if (!assessment || typeof assessment !== 'object') throw new TypeError('M04 assessment state is required.');
    if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) throw new TypeError('Pass an explicit valid timestamp.');
    const indicator = (fixture?.scenario?.verdictIndicators || []).find((item) => item.id === indicatorId);
    if (!indicator) throw new RangeError('Choose an indicator from the list.');
    if (!VERDICTS.includes(decision)) throw new TypeError('Choose malicious, benign, or unknown.');
    const text = String(rationale ?? '').trim();
    if (text.length < MIN_RATIONALE) throw new TypeError(`Explain the verdict in at least ${MIN_RATIONALE} characters.`);
    if (text.length > MAX_RATIONALE) throw new TypeError(`Keep the explanation under ${MAX_RATIONALE} characters.`);
    const verdicts = assessment.intelVerdicts && typeof assessment.intelVerdicts === 'object' && !Array.isArray(assessment.intelVerdicts) ? assessment.intelVerdicts : {};
    verdicts[indicatorId] = { decision, rationale: text, recordedAt: timestamp };
    assessment.intelVerdicts = verdicts;
    log(assessment, timestamp, 'verdict', { details: { indicatorId, decision } }, 'intel_verdict');
    return verdicts[indicatorId];
  }

  // Practice It only: reveals the next hint for an indicator (hints narrow from where to look to what to cite).
  function revealHint(assessment, fixture, indicatorId) {
    const hints = fixture?.scenario?.verdictHints?.[indicatorId] || [];
    const store = assessment.intelHints && typeof assessment.intelHints === 'object' && !Array.isArray(assessment.intelHints) ? assessment.intelHints : {};
    store[indicatorId] = Math.min(hints.length, (Number(store[indicatorId]) || 0) + 1);
    assessment.intelHints = store;
    return store[indicatorId];
  }

  // Practice It only: instant, specific feedback on a recorded verdict. Never rendered in Prove It.
  function verdictFeedback(fixture, indicatorId, entry) {
    const note = fixture?.scenario?.verdictFeedback?.[indicatorId] || {};
    const result = SocM04AssessmentRubric.evaluateVerdict(fixture.scenario.truth, indicatorId, entry);
    if (result.verdict === 'correct' && result.reasoning) return { tone: 'good', text: `Supported. ${note.why || ''}`.trim() };
    if (result.verdict === 'correct') return { tone: 'close', text: result.decidable ? 'Right verdict. Now name a specific record or entity from this case that supports it, so a reviewer can check your reasoning.' : `Right verdict. Say in a sentence what is missing from this case. ${note.why || ''}`.trim() };
    if (result.verdict === 'undecided') return { tone: 'close', text: `This case does hold evidence either way. ${note.nudge || ''}`.trim() };
    if (result.verdict === 'contradicted') return { tone: 'wrong', text: `The records do not support that verdict. ${note.nudge || ''}`.trim() };
    return { tone: 'close', text: 'Record a verdict and your reasoning.' };
  }

  function renderVerdicts(assessment, fixture, options = {}) {
    const indicators = fixture?.scenario?.verdictIndicators;
    if (!Array.isArray(indicators) || !indicators.length) return '';
    const guided = options.guided === true;
    const verdicts = assessment.intelVerdicts && typeof assessment.intelVerdicts === 'object' ? assessment.intelVerdicts : {};
    const hintLevels = assessment.intelHints && typeof assessment.intelHints === 'object' ? assessment.intelHints : {};
    const cards = indicators.map((indicator) => {
      const recorded = verdicts[indicator.id];
      const hints = guided ? (fixture.scenario.verdictHints?.[indicator.id] || []) : [];
      const level = Math.min(hints.length, Number(hintLevels[indicator.id]) || 0);
      const feedback = guided && recorded ? verdictFeedback(fixture, indicator.id, recorded) : null;
      return `<article class="m04-ti-verdict" data-m04-verdict-card="${escapeHtml(indicator.id)}"><div><strong>${escapeHtml(indicator.value)}</strong><span>${escapeHtml(indicator.type)} · ${escapeHtml(indicator.origin)}</span></div><p>${escapeHtml(indicator.context)}</p>${recorded ? `<p class="m04-ti-verdict-recorded" data-m04-verdict-recorded="${escapeHtml(indicator.id)}"><strong>Recorded: ${escapeHtml(recorded.decision)}</strong> — ${escapeHtml(recorded.rationale)}</p>` : ''}${feedback ? `<p class="m04-ti-verdict-feedback is-${feedback.tone}" role="status" data-m04-verdict-feedback="${escapeHtml(indicator.id)}">${escapeHtml(feedback.text)}</p>` : ''}<form data-m04-verdict-form data-indicator-id="${escapeHtml(indicator.id)}"><label>Verdict<select name="decision" required><option value="">Choose…</option>${VERDICTS.map((value) => `<option value="${value}"${recorded?.decision === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label><label>Reasoning${guided ? ' (cite the records or entities that support it)' : ''}<textarea name="rationale" required minlength="${MIN_RATIONALE}" maxlength="${MAX_RATIONALE}">${escapeHtml(recorded?.rationale || '')}</textarea></label><button type="submit">${recorded ? 'Update verdict' : 'Record verdict'}</button>${guided && hints.length ? `<button type="button" data-m04-verdict-hint="${escapeHtml(indicator.id)}"${level >= hints.length ? ' disabled' : ''}>${level ? 'Another hint' : 'Show a hint'}</button>` : ''}<p role="alert" data-m04-verdict-error></p></form>${level ? `<ol class="m04-ti-verdict-hints" data-m04-verdict-hints="${escapeHtml(indicator.id)}">${hints.slice(0, level).map((hint) => `<li>${escapeHtml(hint)}</li>`).join('')}</ol>` : ''}</article>`;
    }).join('');
    return `<section class="m04-ti-verdicts" aria-labelledby="m04-ti-verdicts"><div class="m04-ti-heading"><h4 id="m04-ti-verdicts">Indicator verdicts</h4></div><p>${guided ? 'An indicator on its own is not a verdict. For each one, decide whether this case\u2019s records show it is malicious or benign, or whether they do not say, and name the records or entities you relied on. Unknown is the right answer when the case holds no evidence either way.' : 'Record a verdict and your reasoning for each indicator under review.'}</p><div class="m04-ti-verdict-list">${cards}</div></section>`;
  }

  function render(assessment, fixture) {
    seed(assessment, fixture);
    const reports = assessment.reports.map((report) => `<article class="m04-ti-report"><h4>${escapeHtml(report.kind)} · ${escapeHtml(report.id)}</h4><dl><dt>Reported</dt><dd>${escapeHtml(report.time)}</dd><dt>Source</dt><dd>${escapeHtml(report.source)}</dd><dt>Source reliability</dt><dd>${escapeHtml(report.sourceReliability || 'Not provided')}</dd><dt>Confidence</dt><dd>${escapeHtml(report.confidence ?? 'Not provided')}${report.confidence === undefined ? '' : '%'}</dd><dt>Freshness</dt><dd>${escapeHtml(report.freshness || 'Not provided')}</dd><dt>Status</dt><dd>${escapeHtml(report.status || 'Not provided')}</dd><dt>Campaign</dt><dd>${escapeHtml(report.campaign || 'Not provided')}</dd><dt>Summary</dt><dd>${escapeHtml(report.summary)}</dd></dl>${Array.isArray(report.attackReferences) && report.attackReferences.length ? `<p><strong>Report-provided ATT&amp;CK context (unverified):</strong> ${report.attackReferences.map(escapeHtml).join(', ')}. These references are claims in the report, not confirmed findings.</p>` : ''}<button type="button" data-m04-report-edit="${escapeHtml(report.id)}">Edit report</button></article>`).join('');
    const iocs = assessment.iocs.map((ioc) => {
      const report = assessment.reports.find((item) => item.id === ioc.sourceReportId);
      return `<article class="m04-ti-ioc"><div><strong>${escapeHtml(ioc.value)}</strong><span>${escapeHtml(ioc.type)} · ${escapeHtml(ioc.status)} · confidence ${escapeHtml(ioc.confidence)}%</span></div><dl><dt>First seen</dt><dd>${escapeHtml(ioc.firstSeen || 'Not provided')}</dd><dt>Last seen</dt><dd>${escapeHtml(ioc.lastSeen || 'Not provided')}</dd><dt>Campaign</dt><dd>${escapeHtml(ioc.campaign || report?.campaign || 'Not provided')}</dd></dl><p>${escapeHtml(ioc.context || '')}</p><small>${escapeHtml(ioc.id)} · ${escapeHtml(ioc.sourceReportId || 'No source report')}</small><div class="m04-ti-actions"><button type="button" data-m04-ioc-edit="${escapeHtml(ioc.id)}">Edit</button><button type="button" data-m04-ioc-status="${escapeHtml(ioc.id)}" data-status-next="${ioc.status === 'active' ? 'expired' : 'active'}">${ioc.status === 'active' ? 'Expire' : 'Reactivate'}</button></div></article>`;
    }).join('');
    return `<div class="m04-ti-workspace"><section aria-labelledby="m04-ti-reports"><div class="m04-ti-heading"><h4 id="m04-ti-reports">Threat reports</h4><button type="button" data-m04-report-create>Create report</button></div><div class="m04-ti-report-list">${reports}</div><form data-m04-report-form hidden><h5 data-m04-form-title>New report</h5><input name="id" type="hidden"><label>Source<input name="source" maxlength="100" required></label><label>Report type<input name="kind" maxlength="100" required></label><label>Summary<textarea name="summary" maxlength="2000" required></textarea></label><button type="submit">Save report</button><button type="button" data-m04-form-cancel>Cancel</button><p role="alert" data-m04-form-error></p></form></section><section aria-labelledby="m04-ti-iocs"><div class="m04-ti-heading"><h4 id="m04-ti-iocs">Indicators of compromise</h4><button type="button" data-m04-ioc-create>Add IOC</button></div><div class="m04-ti-ioc-list">${iocs}</div><form data-m04-ioc-form hidden><h5 data-m04-form-title>New IOC</h5><input name="id" type="hidden"><label>Type<select name="type" required>${IOC_TYPES.map((type) => `<option value="${type}">${type}</option>`).join('')}</select></label><label>Value<input name="value" maxlength="2048" required></label><label>Confidence<input name="confidence" type="number" min="0" max="100" step="1" required></label><label>First seen (ISO 8601 UTC)<input name="firstSeen" placeholder="2026-09-24T08:40:00Z"></label><label>Last seen (ISO 8601 UTC)<input name="lastSeen" placeholder="2026-09-24T09:05:00Z"></label><label>Campaign<input name="campaign" maxlength="200"></label><label>Status<select name="status" required>${IOC_STATUSES.map((status) => `<option value="${status}">${status}</option>`).join('')}</select></label><label>Source report<select name="sourceReportId"><option value="">No source report</option>${assessment.reports.map((report) => `<option value="${escapeHtml(report.id)}">${escapeHtml(report.id)} · ${escapeHtml(report.source)}</option>`).join('')}</select></label><label>Context<textarea name="context" maxlength="1000"></textarea></label><button type="submit">Save IOC</button><button type="button" data-m04-form-cancel>Cancel</button><p role="alert" data-m04-form-error></p></form></section></div>`;
  }

  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
  return Object.freeze({ IOC_TYPES, IOC_STATUSES, VERDICTS, MIN_RATIONALE, seed, validValue, mutate, render, renderVerdicts, recordVerdict, revealHint, verdictFeedback, formData });
})();

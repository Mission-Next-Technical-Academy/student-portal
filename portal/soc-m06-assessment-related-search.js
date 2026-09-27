/* Deterministic, fixture-bounded related-event search for the independent M06 assessment. */
const SocM06AssessmentRelatedSearch = (() => {
  'use strict';

  const MAX_RANGE_MS = 24 * 60 * 60 * 1000;
  const SEARCH_LIMIT = 100;
  const QUERY_FIELDS = Object.freeze({ eventType: 'eventType', device: 'device', account: 'account', action: 'action', result: 'result' });
  // A bounded ATT&CK catalog shared by every module that carries the ATT&CK
  // workspace (Modules 6–12). Each module's rubric grades only its own truth.
  const TACTICS = Object.freeze({
    TA0001: 'Initial Access', TA0002: 'Execution', TA0003: 'Persistence', TA0004: 'Privilege Escalation', TA0005: 'Defense Evasion',
    TA0006: 'Credential Access', TA0008: 'Lateral Movement', TA0010: 'Exfiltration', TA0011: 'Command and Control', TA0040: 'Impact',
  });
  const TECHNIQUES = Object.freeze({
    'T1053.005': { name: 'Scheduled Task', tactics: ['TA0002', 'TA0003'] },
    'T1059.001': { name: 'PowerShell', tactics: ['TA0002'] },
    T1105: { name: 'Ingress Tool Transfer', tactics: ['TA0011'] },
    'T1071.001': { name: 'Web Protocols', tactics: ['TA0011'] },
    T1078: { name: 'Valid Accounts', tactics: ['TA0001', 'TA0003', 'TA0004', 'TA0005'] },
    'T1110.003': { name: 'Password Spraying', tactics: ['TA0006'] },
    'T1204.001': { name: 'User Execution: Malicious Link', tactics: ['TA0002'] },
    'T1204.002': { name: 'User Execution: Malicious File', tactics: ['TA0002'] },
    'T1547.001': { name: 'Registry Run Keys / Startup Folder', tactics: ['TA0003', 'TA0004'] },
    'T1566.001': { name: 'Spearphishing Attachment', tactics: ['TA0001'] },
    'T1566.002': { name: 'Spearphishing Link', tactics: ['TA0001'] },
    T1190: { name: 'Exploit Public-Facing Application', tactics: ['TA0001'] },
    'T1021.001': { name: 'Remote Desktop Protocol', tactics: ['TA0008'] },
    T1567: { name: 'Exfiltration Over Web Service', tactics: ['TA0010'] },
    T1486: { name: 'Data Encrypted for Impact', tactics: ['TA0040'] },
  });
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function validRange(startTime, endTime, scenario) {
    if (!SocM06AssessmentActions.validTimestamp(startTime) || !SocM06AssessmentActions.validTimestamp(endTime)) return false;
    const start = Date.parse(startTime);
    const end = Date.parse(endTime);
    return start <= end && end - start <= MAX_RANGE_MS
      && start >= Date.parse(scenario.scope.timeStart) && end <= Date.parse(scenario.scope.timeEnd);
  }

  function validateScope(scope, fixture) {
    const scenario = fixture?.scenario;
    if (!scenario || !scope || typeof scope !== 'object' || Array.isArray(scope)) throw new Error('M06 search scope and fixture are required.');
    if (!validRange(scope.startTime, scope.endTime, scenario)) throw new Error('M06 search range is malformed, outside fixture bounds, or wider than 24 hours.');
    if (!['all', 'device', 'account'].includes(scope.entityType)) throw new Error('M06 search entity type is invalid.');
    if (scope.entityType === 'all') {
      if (scope.entityValue !== 'all') throw new Error('All-entity scope must use the value "all".');
    } else {
      const allowed = scope.entityType === 'device'
        ? new Set(scenario.scope.devices)
        : new Set(scenario.telemetry.map((event) => event.account).filter(Boolean));
      if (typeof scope.entityValue !== 'string' || !allowed.has(scope.entityValue)) throw new Error('M06 search entity is outside fixture scope.');
    }
    return { startTime: scope.startTime, endTime: scope.endTime, entityType: scope.entityType, entityValue: scope.entityValue };
  }

  function matchesEntity(event, scope) {
    if (scope.entityType === 'device') return event.device === scope.entityValue;
    if (scope.entityType === 'account') return event.account === scope.entityValue;
    return true;
  }

  function search(state, fixture, scope, query, timestamp) {
    const normalizedScope = validateScope(scope, fixture);
    if (typeof query !== 'string' || query.length > 4000) throw new Error('Search text must be a string of at most 4000 characters.');
    if (!SocM06AssessmentActions.validTimestamp(timestamp)) throw new Error('M06 search timestamp must be canonical UTC.');
    const needle = query.trim().toLocaleLowerCase('en-US');
    const results = fixture.scenario.telemetry
      .filter((event) => Date.parse(event.time) >= Date.parse(normalizedScope.startTime)
        && Date.parse(event.time) <= Date.parse(normalizedScope.endTime)
        && matchesEntity(event, normalizedScope)
        && (!needle || JSON.stringify(event).toLocaleLowerCase('en-US').includes(needle)))
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || a.id.localeCompare(b.id))
      .slice(0, SEARCH_LIMIT);
    const resultEventIds = results.map((event) => event.id);
    const normalizedState = SocM06AssessmentState.normalize(state, fixture);
    const record = { id: `${fixture.scenario.id}:QUERY-${String(normalizedState.nextActionSequence).padStart(6, '0')}`,
      query, ...normalizedScope, resultEventIds, resultCount: results.length, timestamp };
    let next = clone(normalizedState);
    next.queryHistory = [...(Array.isArray(next.queryHistory) ? next.queryHistory : []), record].slice(-200);
    next = SocM06AssessmentActions.append(next, 'query_run', timestamp, {
      query: query.trim() || '*', resultEventIds, resultCount: results.length,
      startTime: normalizedScope.startTime, endTime: normalizedScope.endTime,
      entityType: normalizedScope.entityType, entityValue: normalizedScope.entityValue,
    }, fixture);
    return { state: next, results: clone(results), query: clone(record) };
  }

  // Grammar: field == "JSON string" (and field == "JSON string")...; fields are allowlisted above.
  // Only exact equality and lowercase `and` are accepted; unsupported syntax is always an error.
  function parseQuery(query, fixture) {
    if (typeof query !== 'string' || !query.trim() || query.length > 500) return { valid: false, error: 'Enter a query using field == "value" clauses joined by and.' };
    const telemetry = fixture?.scenario?.telemetry || [];
    const clauses = [];
    let offset = 0;
    const clausePattern = /^\s*([A-Za-z][A-Za-z0-9]*)\s*==\s*("(?:[^"\\]|\\.)*")\s*/;
    while (offset < query.length) {
      const match = query.slice(offset).match(clausePattern);
      if (!match) return { valid: false, error: 'Syntax error. Use field == "value" and join clauses with lowercase and.' };
      const field = QUERY_FIELDS[match[1]];
      if (!field) return { valid: false, error: `Unsupported field: ${match[1]}. Allowed: ${Object.keys(QUERY_FIELDS).join(', ')}.` };
      let value;
      try { value = JSON.parse(match[2]); } catch { return { valid: false, error: 'Invalid quoted value.' }; }
      if (typeof value !== 'string') return { valid: false, error: 'Query values must be quoted strings.' };
      if (!telemetry.some((event) => typeof event[field] === 'string' && event[field] === value)) {
        return { valid: false, error: `Value is not present in fixture telemetry for ${field}.` };
      }
      clauses.push({ field, value });
      offset += match[0].length;
      if (offset === query.length) break;
      const join = query.slice(offset).match(/^\s*and\s+/);
      if (!join) return { valid: false, error: 'Unsupported operator or trailing syntax. Only lowercase and is supported.' };
      offset += join[0].length;
    }
    return { valid: clauses.length > 0, clauses, error: '' };
  }

  function runSavedQuery(state, fixture, scope, savedQueryId, timestamp) {
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    const definition = normalized.savedQueries.find((item) => item.id === savedQueryId);
    if (!definition) throw new Error('Saved query is unavailable.');
    const parsed = parseQuery(definition.query, fixture);
    if (!parsed.valid) throw new Error(parsed.error);
    const normalizedScope = validateScope(scope, fixture);
    if (!SocM06AssessmentActions.validTimestamp(timestamp)) throw new Error('M06 search timestamp must be canonical UTC.');
    const results = fixture.scenario.telemetry
      .filter((event) => Date.parse(event.time) >= Date.parse(normalizedScope.startTime)
        && Date.parse(event.time) <= Date.parse(normalizedScope.endTime)
        && matchesEntity(event, normalizedScope)
        && parsed.clauses.every(({ field, value }) => event[field] === value))
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || a.id.localeCompare(b.id))
      .slice(0, SEARCH_LIMIT);
    const record = { savedQueryId, name: definition.name, query: definition.query, timestamp, ...normalizedScope,
      resultEventIds: results.map((event) => event.id), resultCount: results.length };
    let next = clone(normalized);
    const queryRecord = { id: `${fixture.scenario.id}:QUERY-${String(next.nextActionSequence).padStart(6, '0')}`,
      query: definition.query, ...normalizedScope, resultEventIds: record.resultEventIds, resultCount: record.resultCount, timestamp };
    next.queryHistory = [...next.queryHistory, queryRecord].slice(-200);
    next.savedQueryRuns = [...next.savedQueryRuns, record].slice(-SocM06AssessmentState.LIMITS.savedQueryRuns);
    next = SocM06AssessmentActions.append(next, 'saved_query_run', timestamp, {
      savedQueryId, resultEventIds: record.resultEventIds, resultCount: record.resultCount,
    }, fixture);
    return { state: next, results: clone(results), run: clone(record) };
  }

  function saveQuery(state, fixture, name, query, timestamp) {
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw new Error('Saved query name must be 1 to 80 characters.');
    const parsed = parseQuery(query, fixture);
    if (!parsed.valid) throw new Error(parsed.error);
    const sequence = normalized.nextActionSequence;
    const definition = { id: `M06-SAVED-QUERY-${String(sequence).padStart(6, '0')}`, name: name.trim(), query };
    let next = clone(normalized);
    next.savedQueries = [...next.savedQueries, definition].slice(-SocM06AssessmentState.LIMITS.savedQueries);
    next = SocM06AssessmentActions.append(next, 'saved_query_create', timestamp, {
      savedQueryId: definition.id, name: definition.name, query: definition.query,
    }, fixture);
    return { state: next, definition: clone(definition) };
  }

  function pivot(state, fixture, fromEventId, toEventId, timestamp) {
    const events = new Map(fixture.scenario.telemetry.map((event) => [event.id, event]));
    const from = events.get(fromEventId);
    const to = events.get(toEventId);
    if (!from || !to || !(from.relatedEventIds || []).includes(toEventId)) throw new Error('Pivot must follow a fixture-defined related-event link.');
    const record = { fromEventId, toEventId, field: 'relatedEventIds', value: toEventId, timestamp };
    const next = clone(state);
    next.pivots = [...(Array.isArray(next.pivots) ? next.pivots : []), record].slice(-200);
    const updated = SocM06AssessmentActions.append(next, 'pivot', timestamp,
      { fromEventId, toEventId, field: 'relatedEventIds', value: toEventId }, fixture);
    return { state: updated, pivot: clone(record) };
  }

  function toggleBookmark(state, fixture, eventId, timestamp) {
    if (!fixture.scenario.telemetry.some((event) => event.id === eventId)) throw new Error('Bookmark must reference a fixture event.');
    let next = SocM06AssessmentState.normalize(state, fixture);
    const removing = next.bookmarks.includes(eventId);
    next.bookmarks = removing ? next.bookmarks.filter((id) => id !== eventId) : [...next.bookmarks, eventId].slice(-100);
    next = SocM06AssessmentActions.append(next, removing ? 'bookmark_remove' : 'bookmark', timestamp,
      removing ? { eventId } : { eventId, note: 'Hunt evidence' }, fixture);
    return next;
  }

  function selectCollection(state, fixture, collectionId, timestamp) {
    let next = SocM06AssessmentState.normalize(state, fixture);
    if (collectionId && !next.collections.some((item) => item.id === collectionId)) throw new Error('Evidence collection is unavailable.');
    next.selectedCollectionId = collectionId || '';
    return SocM06AssessmentActions.append(next, 'collection_select', timestamp, { collectionId: collectionId || '' }, fixture);
  }

  function saveCollection(state, fixture, name, eventIds, timestamp) {
    let next = SocM06AssessmentState.normalize(state, fixture);
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const allowed = new Set(fixture.scenario.telemetry.map((event) => event.id));
    if (!cleanName || cleanName.length > 80) throw new Error('Collection name must be 1 to 80 characters.');
    if (!Array.isArray(eventIds) || eventIds.some((id) => !allowed.has(id))) throw new Error('Collection events must belong to this assessment fixture.');
    const membership = [...new Set(eventIds)].slice(-100);
    const existing = next.collections.find((item) => item.id === next.selectedCollectionId);
    const id = existing?.id || `M06-COLLECTION-${String(next.nextActionSequence).padStart(6, '0')}`;
    const operation = existing ? 'update' : 'create';
    next.collections = [...next.collections.filter((item) => item.id !== id), { id, name: cleanName, eventIds: membership }].slice(-50);
    next.selectedCollectionId = id;
    next = SocM06AssessmentActions.append(next, 'collection', timestamp,
      { collectionId: id, name: cleanName, eventIds: membership, operation }, fixture);
    return next;
  }

  function validateMapping(mapping, fixture) {
    const scenario = fixture?.scenario;
    if (!scenario || !mapping || typeof mapping !== 'object' || Array.isArray(mapping)) return false;
    const technique = TECHNIQUES[mapping.techniqueId];
    const truth = scenario.expectedTruth;
    const supported = truth.supportedTechniques.find((item) => item.id === mapping.techniqueId);
    const unsupported = truth.unsupportedTechniques.find((item) => item.id === mapping.techniqueId);
    const validEvents = new Set((mapping.status === 'supported' ? supported?.evidenceEventIds
      : mapping.status === 'unsupported' ? unsupported?.evidenceEventIds
        : [...(supported?.evidenceEventIds || []), ...(unsupported?.evidenceEventIds || [])]) || []);
    // Later cumulative cases may supply their own telemetry slice while the
    // M06 truth object has no event IDs for that independent scenario. Accept
    // any real event from that fixture here; the module's scorer still decides
    // whether the cited evidence supports the learner's assessment.
    if (!String(scenario.id || '').startsWith('M06-')) {
      for (const event of scenario.telemetry || []) {
        if (event?.id) validEvents.add(event.id);
      }
    }
    return !!technique && technique.tactics.includes(mapping.tacticId)
      && Object.values(TACTICS).includes(TACTICS[mapping.tacticId])
      && Array.isArray(mapping.eventIds) && mapping.eventIds.length > 0 && mapping.eventIds.length <= 100
      && new Set(mapping.eventIds).size === mapping.eventIds.length && mapping.eventIds.every((id) => validEvents.has(id))
      && Number.isInteger(mapping.confidence) && mapping.confidence >= 0 && mapping.confidence <= 100
      && ['supported', 'unsupported', 'needs_review'].includes(mapping.status)
      && typeof mapping.rationale === 'string' && mapping.rationale.trim().length > 0 && mapping.rationale.length <= 2000;
  }

  function saveMapping(state, fixture, mapping, timestamp, replaces = null) {
    if (!validateMapping(mapping, fixture)) throw new Error('Choose a valid tactic, technique, status, and rationale, and cite evidence that supports that technique assessment.');
    let next = SocM06AssessmentState.normalize(state, fixture);
    const clean = { tacticId: mapping.tacticId, techniqueId: mapping.techniqueId, confidence: mapping.confidence,
      status: mapping.status, eventIds: [...new Set(mapping.eventIds)], rationale: mapping.rationale.trim() };
    const details = { ...clean };
    if (replaces && replaces.tacticId && replaces.techniqueId) {
      details.replacesTacticId = replaces.tacticId;
      details.replacesTechniqueId = replaces.techniqueId;
    }
    next.mappings = [...next.mappings.filter((item) =>
      (item.tacticId !== clean.tacticId || item.techniqueId !== clean.techniqueId)
      && (!replaces || item.tacticId !== replaces.tacticId || item.techniqueId !== replaces.techniqueId)), clean].slice(-100);
    return SocM06AssessmentActions.append(next, 'attack_mapping_change', timestamp, details, fixture);
  }

  function removeMapping(state, fixture, tacticId, techniqueId, reason, timestamp) {
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    const existing = normalized.mappings.find((item) => item.tacticId === tacticId && item.techniqueId === techniqueId);
    if (!existing) throw new Error('That mapping is no longer available to remove.');
    const cleanReason = typeof reason === 'string' ? reason.trim() : '';
    if (!cleanReason || cleanReason.length > 500) throw new Error('Enter a removal reason of 1 to 500 characters.');
    const next = { ...normalized, mappings: normalized.mappings.filter((item) => item !== existing) };
    return SocM06AssessmentActions.append(next, 'attack_mapping_remove', timestamp,
      { tacticId, techniqueId, reason: cleanReason }, fixture);
  }

  function proposeHandoff(state, fixture, proposal, timestamp) {
    const allowed = new Set(fixture?.scenario?.telemetry?.map((event) => event.id) || []);
    const eventIds = Array.isArray(proposal?.eventIds) ? [...new Set(proposal.eventIds)] : [];
    const destination = proposal?.destination;
    const rationale = typeof proposal?.rationale === 'string' ? proposal.rationale.trim() : '';
    const recommendation = typeof proposal?.recommendation === 'string' ? proposal.recommendation.trim() : '';
    if (!fixture?.scenario || eventIds.length < 1 || eventIds.length > 20
      || eventIds.some((id) => !allowed.has(id)) || !['alert', 'incident', 'rule'].includes(destination)
      || !rationale || rationale.length > 1000 || !recommendation || recommendation.length > 1000) {
      throw new Error('Choose 1 to 20 fixture events, a destination, and rationale and recommendation of at most 1000 characters each.');
    }
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    const id = `M06-HANDOFF-${String(normalized.nextActionSequence).padStart(6, '0')}`;
    const record = { id, eventIds, destination, rationale, recommendation };
    const next = { ...normalized, handoffs: [...normalized.handoffs, record].slice(-SocM06AssessmentState.LIMITS.handoffs) };
    const updated = SocM06AssessmentActions.append(next, 'handoff_proposal', timestamp, {
      handoffId: id, eventIds, destination, rationale, recommendation,
    }, fixture);
    const proposalAction = updated.actionHistory.at(-1);
    updated.handoffs = updated.handoffs.map((item) => item.id === id ? { ...item, status: 'proposed',
      statusHistory: [{ actionSequence: proposalAction.sequence, fromStatus: null, status: 'proposed', timestamp,
        eventIds: [...eventIds], note: '' }] } : item);
    return updated;
  }

  function updateHandoffStatus(state, fixture, handoffId, toStatus, note, timestamp) {
    const normalized = SocM06AssessmentState.normalize(state, fixture);
    const handoff = normalized.handoffs.find((item) => item.id === handoffId);
    const cleanNote = typeof note === 'string' ? note.trim() : '';
    if (!handoff || !['in_review', 'accepted', 'rejected'].includes(toStatus)
      || !['proposed', 'in_review'].includes(handoff.status) || handoff.status === toStatus || cleanNote.length > 500) {
      throw new Error('Choose a valid next status and a note of at most 500 characters.');
    }
    const next = SocM06AssessmentActions.append(normalized, 'handoff_status', timestamp, {
      handoffId, eventIds: [...handoff.eventIds], fromStatus: handoff.status, toStatus, note: cleanNote,
    }, fixture);
    const action = next.actionHistory.at(-1);
    next.handoffs = next.handoffs.map((item) => item.id === handoffId ? { ...item, status: toStatus,
      statusHistory: [...item.statusHistory, { actionSequence: action.sequence, fromStatus: handoff.status,
        status: toStatus, timestamp, eventIds: [...handoff.eventIds], note: cleanNote }].slice(-20) } : item);
    return next;
  }

  function renderHandoffPanel(fixture, state) {
    const scenario = fixture?.scenario;
    if (!scenario) return '';
    const e = escapeHtml;
    return `<section data-m06-handoff-panel aria-label="Handoff proposals"><h3>Evidence handoff proposal</h3>
      <form data-m06-handoff-form><fieldset><legend>Selected fixture evidence (1–20)</legend>${scenario.telemetry.map((event) =>
        `<label><input type="checkbox" name="eventIds" value="${e(event.id)}"> ${e(event.id)} · ${e(event.eventType)} · ${e(event.device)}</label>`).join('')}</fieldset>
      <label>Destination <select name="destination" required><option value="alert">Alert</option><option value="incident">Incident</option><option value="rule">Detection rule</option></select></label>
      <label>Rationale <textarea name="rationale" maxlength="1000" required></textarea></label>
      <label>Recommendation <textarea name="recommendation" maxlength="1000" required></textarea></label>
      <button type="submit">Propose handoff</button></form><p data-m06-handoff-feedback role="status"></p>
      <ul>${(state?.handoffs || []).map((item) => `<li><strong>${e(item.destination)}</strong> · ${e(item.id)} · ${item.eventIds.map(e).join(', ')}<p>Status: ${e(item.status)}</p><p>${e(item.rationale)}</p><p>${e(item.recommendation)}</p>
        ${['proposed', 'in_review'].includes(item.status) ? `<form data-m06-handoff-status-form="${e(item.id)}"><label>Update status <select name="status" required><option value="in_review">In review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label><label>Analyst note <textarea name="note" maxlength="500"></textarea></label><button type="submit">Save status</button></form><p data-m06-handoff-status-feedback="${e(item.id)}" role="status"></p>` : ''}
        <details><summary>Status history (${item.statusHistory.length})</summary><ol>${item.statusHistory.map((entry) => `<li>${e(entry.status)} · ${e(entry.timestamp)} · evidence: ${entry.eventIds.map(e).join(', ')}${entry.note ? `<p>${e(entry.note)}</p>` : ''}</li>`).join('') || '<li>No status changes recorded.</li>'}</ol></details></li>`).join('') || '<li>No handoff proposals.</li>'}</ul></section>`;
  }

  function renderMappingPanel(fixture, state) {
    const e = escapeHtml;
    const scenario = fixture?.scenario;
    if (!scenario) return '';
    const editing = state?.editingMapping || null;
    const eventOptions = scenario.telemetry.map((event) => `<label><input type="checkbox" name="eventIds" value="${e(event.id)}"${editing?.eventIds.includes(event.id) ? ' checked' : ''}> ${e(event.id)} · ${e(event.eventType)} · ${e(event.device)}</label>`).join('');
    const techniqueOptions = Object.entries(TECHNIQUES).map(([id, item]) => `<option value="${e(id)}">${e(id)} · ${e(item.name)}</option>`).join('');
    const tacticOptions = Object.entries(TACTICS).map(([id, name]) => `<option value="${e(id)}">${e(name)} (${e(id)})</option>`).join('');
    return `<section data-m06-mapping-panel aria-label="ATT&CK mappings"><h3>ATT&amp;CK mappings</h3>
      <form data-m06-mapping-form><label>Tactic <select name="tacticId" required>${tacticOptions}</select></label>
      <label>Technique <select name="techniqueId" required>${techniqueOptions}</select></label>
      <label>Confidence <input name="confidence" type="number" min="0" max="100" step="1" value="50" required></label>
      <label>Status <select name="status" required><option value="needs_review">Needs review</option><option value="supported">Supported</option><option value="unsupported">Unsupported</option></select></label>
      <label>Rationale <textarea name="rationale" maxlength="2000" required>${e(editing?.rationale || '')}</textarea></label><fieldset><legend>Evidence event references</legend>${eventOptions}</fieldset>
      <button type="submit">${editing ? 'Save correction' : 'Save mapping'}</button><button type="button" data-m06-mapping-cancel hidden>Cancel correction</button></form><p data-m06-mapping-feedback role="status"></p>
      <ul>${(state?.mappings || []).map((item) => `<li><strong>${e(TACTICS[item.tacticId])} · ${e(item.techniqueId)} ${e(TECHNIQUES[item.techniqueId]?.name || '')}</strong> · ${e(item.status)} · ${e(item.confidence)}% confidence · Events: ${item.eventIds.map(e).join(', ')}<p>${e(item.rationale)}</p><button type="button" data-m06-mapping-edit="${e(item.tacticId)}:${e(item.techniqueId)}">Correct mapping</button><form data-m06-mapping-remove-form="${e(item.tacticId)}:${e(item.techniqueId)}"><label>Removal reason <input name="reason" maxlength="500" required></label><button type="submit">Remove mapping</button></form></li>`).join('') || '<li>No mappings saved.</li>'}</ul></section>`;
  }

  function render(results, options = {}) {
    const events = Array.isArray(results) ? results : [];
    if (!events.length) return '<section data-m06-related-results aria-label="Related event results"><p role="status">No matching events.</p></section>';
    const e = escapeHtml;
    return `<section data-m06-related-results aria-label="Related event results"><ol>${events.map((event) =>
      `<li data-event-id="${e(event.id)}"><time datetime="${e(event.time)}">${e(event.time)}</time> <strong>${e(event.eventType)}</strong> <span>${e(event.device)} / ${e(event.account)}</span> <span>${e(event.action)}: ${e(event.result)}</span>${options.pivotFromEventId ? ` <button type="button" data-m06-pivot-from="${e(options.pivotFromEventId)}" data-m06-pivot-to="${e(event.id)}">Pivot</button>` : ''}${options.relatedPivots ? (event.relatedEventIds || []).map((to) => ` <button type="button" data-m06-pivot-from="${e(event.id)}" data-m06-pivot-to="${e(to)}">Pivot to ${e(to)}</button>`).join('') : ''}${options.bookmarks ? ` <button type="button" data-m06-bookmark="${e(event.id)}">${options.bookmarks.includes(event.id) ? 'Remove bookmark' : 'Bookmark'}</button>` : ''}</li>`).join('')}</ol></section>`;
  }

  function renderSearch(fixture, state) {
    const scenario = fixture?.scenario;
    if (!scenario) return '<section aria-label="Related event search"><p role="status">Search fixture is unavailable.</p></section>';
    const e = escapeHtml;
    const previous = (state?.queryHistory || []).at(-1) || {};
    const end = previous.endTime || scenario.scope.timeEnd;
    const preferredStart = previous.startTime || scenario.scope.timeStart;
    const start = !previous.startTime && Date.parse(end) - Date.parse(preferredStart) > MAX_RANGE_MS
      ? new Date(Date.parse(end) - MAX_RANGE_MS).toISOString()
      : preferredStart;
    const type = ['all', 'device', 'account'].includes(previous.entityType) ? previous.entityType : 'device';
    const value = previous.entityValue || scenario.scope.devices[0];
    const choices = type === 'account' ? [...new Set(scenario.telemetry.map((event) => event.account).filter(Boolean))] : scenario.scope.devices;
    return `<section data-m06-related-search aria-label="Related event search"><h3>Related event search</h3>
      <form data-m06-search-form><label>Search text <input name="query" maxlength="4000" value="${e(previous.query || '')}"></label>
      <label>Start UTC <input name="startTime" type="text" value="${e(start)}"></label><label>End UTC <input name="endTime" type="text" value="${e(end)}"></label>
      <label>Entity <select name="entityType"><option value="all"${type === 'all' ? ' selected' : ''}>All entities</option><option value="device"${type === 'device' ? ' selected' : ''}>Device</option><option value="account"${type === 'account' ? ' selected' : ''}>Account</option></select></label>
      <label>Entity value <select name="entityValue">${choices.map((item) => `<option value="${e(item)}"${item === value ? ' selected' : ''}>${e(item)}</option>`).join('')}</select></label>
      <button type="submit">Search events</button></form>${render(previous.resultEventIds?.map((id) => scenario.telemetry.find((event) => event.id === id)).filter(Boolean) || [], { bookmarks: state?.bookmarks || [], relatedPivots: true })}</section>`;
  }

  function renderEvidencePanel(fixture, state) {
    const e = escapeHtml;
    const scenario = fixture?.scenario;
    if (!scenario) return '';
    const selected = (state?.collections || []).find((item) => item.id === state?.selectedCollectionId);
    const currentResults = (state?.queryHistory || []).at(-1)?.resultEventIds || [];
    const selectableIds = [...new Set([...currentResults, ...(selected?.eventIds || [])])];
    const eventMap = new Map(scenario.telemetry.map((event) => [event.id, event]));
    return `<section data-m06-evidence-panel aria-label="Bookmarks and evidence collections"><h3>Evidence</h3>
      <h4>Bookmarks (${(state?.bookmarks || []).length}/100)</h4><ul>${(state?.bookmarks || []).map((id) => `<li>${e(id)} <button type="button" data-m06-bookmark="${e(id)}">Remove</button></li>`).join('') || '<li>No bookmarked events.</li>'}</ul>
      <label>Selected collection <select data-m06-collection-select><option value="">No collection selected</option>${(state?.collections || []).map((item) => `<option value="${e(item.id)}"${item.id === selected?.id ? ' selected' : ''}>${e(item.name)} (${item.eventIds.length}/100)</option>`).join('')}</select></label>
      <form data-m06-collection-form><label>Collection name <input name="name" maxlength="80" required value="${e(selected?.name || '')}"></label>
      <p data-m06-evidence-feedback role="status"></p><fieldset><legend>Fixture events</legend>${selectableIds.map((id) => `<label><input type="checkbox" name="eventIds" value="${e(id)}"${selected?.eventIds.includes(id) ? ' checked' : ''}> ${e(id)} · ${e(eventMap.get(id)?.eventType || '')}</label>`).join('') || '<p>Run a saved query to choose evidence events.</p>'}</fieldset>
      <button type="submit">${selected ? 'Save collection' : 'Create collection'}</button></form>
      <ol>${(selected?.eventIds || []).map((id) => `<li>${e(id)} · ${e(eventMap.get(id)?.eventType || '')}</li>`).join('') || '<li>Selected collection is empty.</li>'}</ol></section>`;
  }

  function renderSavedQueryPanel(fixture, state) {
    const e = escapeHtml;
    const scenario = fixture?.scenario;
    if (!scenario) return '<section aria-label="Saved queries"><p role="status">Query fixture is unavailable.</p></section>';
    const definitions = state?.savedQueries || [];
    const latest = (state?.savedQueryRuns || []).at(-1);
    const latestEvents = latest?.resultEventIds?.map((id) => scenario.telemetry.find((event) => event.id === id)).filter(Boolean) || [];
    const maxStart = new Date(Date.parse(scenario.scope.timeEnd) - MAX_RANGE_MS).toISOString();
    const start = Date.parse(scenario.scope.timeStart) < Date.parse(maxStart) ? maxStart : scenario.scope.timeStart;
    return `<section data-m06-saved-query-panel aria-label="Saved queries"><h3>Saved queries</h3>
      <p>Grammar: <code>field == "value"</code>, joined with lowercase <code>and</code>. Fields: ${Object.keys(QUERY_FIELDS).map(e).join(', ')}. Exact equality only.</p>
      <form data-m06-save-query-form><label>Query name <input name="name" maxlength="80" required></label>
      <label>Query <textarea name="query" maxlength="500" required placeholder='eventType == "process_start" and device == "ws-318"'></textarea></label>
      <label>Start UTC <input name="startTime" value="${e(start)}" required></label><label>End UTC <input name="endTime" value="${e(scenario.scope.timeEnd)}" required></label>
      <label>Entity type <select name="entityType"><option value="all">All entities</option><option value="device" selected>Device</option><option value="account">Account</option></select></label>
      <label>Entity value <input name="entityValue" value="${e(scenario.scope.devices[0])}" required></label>
      <button type="submit">Save query</button></form><p data-m06-query-feedback role="status"></p>
      <ul>${definitions.map((item) => `<li><strong>${e(item.name)}</strong> <code>${e(item.query)}</code> <button type="button" data-m06-run-saved-query="${e(item.id)}">Run</button></li>`).join('') || '<li>No saved queries.</li>'}</ul>
      ${latest ? `<p role="status">Last run: ${e(latest.name)} · ${e(latest.resultCount)} results · ${e(latest.timestamp)}</p>${render(latestEvents, { bookmarks: state?.bookmarks || [] })}` : '<p role="status">No query runs yet.</p>'}</section>`;
  }

  return Object.freeze({ MAX_RANGE_MS, SEARCH_LIMIT, QUERY_FIELDS, TACTICS, TECHNIQUES, validateScope, search, parseQuery, saveQuery, runSavedQuery, pivot,
    toggleBookmark, selectCollection, saveCollection, validateMapping, saveMapping, removeMapping, proposeHandoff, updateHandoffStatus, renderHandoffPanel, renderMappingPanel, render, renderSearch, renderSavedQueryPanel, renderEvidencePanel, escapeHtml });
})();

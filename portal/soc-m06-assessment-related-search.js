/* Deterministic, fixture-bounded related-event search for the independent M06 assessment. */
const SocM06AssessmentRelatedSearch = (() => {
  'use strict';

  const MAX_RANGE_MS = 24 * 60 * 60 * 1000;
  const SEARCH_LIMIT = 100;
  const QUERY_FIELDS = Object.freeze({ eventType: 'eventType', device: 'device', account: 'account', action: 'action', result: 'result' });
  // The full MITRE ATT&CK Enterprise catalog (portal/attack-catalog.js) is
  // shared by every module that carries the ATT&CK workspace (Modules 6–12).
  // Any real technique/tactic pairing is a valid learner mapping; each
  // module's rubric grades only its own truth.
  const TACTICS = Object.freeze(Object.fromEntries(MnAttackCatalog.tactics.map((tactic) => [tactic.id, tactic.name])));
  const TECHNIQUES = Object.freeze(Object.fromEntries(MnAttackCatalog.techniqueIds().map((id) => {
    const technique = MnAttackCatalog.technique(id);
    return [id, Object.freeze({ name: technique.fullName, tactics: technique.tactics })];
  })));
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
    return `<section data-m06-handoff-panel aria-label="Handoff proposals"><header class="m06-panel-header"><div><span class="m06-step">05 · Escalate</span><h3>Evidence handoff proposal</h3></div></header>
      <form data-m06-handoff-form><fieldset class="m06-choice-set m06-field-wide"><legend>Selected fixture evidence <span>Choose 1–20</span></legend><div class="m06-choice-grid">${scenario.telemetry.map((event) =>
        `<label><input type="checkbox" name="eventIds" value="${e(event.id)}"><span><strong>${e(event.id)}</strong><small>${e(event.eventType)} · ${e(event.device)}</small></span></label>`).join('')}</div></fieldset>
      <label>Destination <select name="destination" required><option value="alert">Alert</option><option value="incident">Incident</option><option value="rule">Detection rule</option></select></label>
      <label>Rationale <textarea name="rationale" maxlength="1000" required placeholder="Why does this evidence require escalation?"></textarea></label>
      <label class="m06-field-wide">Recommendation <textarea name="recommendation" maxlength="1000" required placeholder="What should the receiving team do next?"></textarea></label>
      <div class="m06-form-actions m06-field-wide"><button type="submit">Propose handoff</button><p data-m06-handoff-feedback role="status"></p></div></form>
      <ul class="m06-record-list">${(state?.handoffs || []).map((item) => `<li><strong>${e(item.destination)}</strong> · ${e(item.id)} · ${item.eventIds.map(e).join(', ')}<p>Status: ${e(item.status)}</p><p>${e(item.rationale)}</p><p>${e(item.recommendation)}</p>
        ${['proposed', 'in_review'].includes(item.status) ? `<form data-m06-handoff-status-form="${e(item.id)}"><label>Update status <select name="status" required><option value="in_review">In review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label><label>Analyst note <textarea name="note" maxlength="500"></textarea></label><button type="submit">Save status</button></form><p data-m06-handoff-status-feedback="${e(item.id)}" role="status"></p>` : ''}
        <details><summary>Status history (${item.statusHistory.length})</summary><ol>${item.statusHistory.map((entry) => `<li>${e(entry.status)} · ${e(entry.timestamp)} · evidence: ${entry.eventIds.map(e).join(', ')}${entry.note ? `<p>${e(entry.note)}</p>` : ''}</li>`).join('') || '<li>No status changes recorded.</li>'}</ol></details></li>`).join('') || '<li>No handoff proposals.</li>'}</ul></section>`;
  }

  const MAPPING_STATUS = Object.freeze({ supported: 'Supported', needs_review: 'Needs review', unsupported: 'Unsupported' });

  // One matrix cell. Selecting it only fills the form's hidden tactic and
  // technique fields (soc-console-tools.js wires the click); the column the
  // cell sits in fixes the tactic, so an invalid pairing cannot be chosen.
  function attackCell(tacticId, techniqueId, mapped, label) {
    const e = escapeHtml;
    const status = mapped.get(`${tacticId}:${techniqueId}`);
    return `<button type="button" class="attack-cell${status ? ` is-${status.replace('_', '-')}` : ''}" data-attack-pick="${e(tacticId)}:${e(techniqueId)}" aria-pressed="false"${status ? ` title="Mapped · ${e(MAPPING_STATUS[status])}"` : ''}><span class="attack-cell-name">${e(label)}</span><span class="attack-cell-id">${e(techniqueId)}</span></button>`;
  }

  function renderMatrix(mapped) {
    const e = escapeHtml;
    return MnAttackCatalog.tactics.map((tactic) => {
      const ids = MnAttackCatalog.column(tactic.id);
      const items = ids.map((id) => {
        const technique = MnAttackCatalog.technique(id);
        const subs = MnAttackCatalog.subsIn(id, tactic.id);
        const search = [id, technique.name, ...subs.flatMap((sub) => [sub, MnAttackCatalog.technique(sub).name])].join(' ').toLowerCase();
        const subMapped = subs.some((sub) => mapped.has(`${tactic.id}:${sub}`));
        return `<li class="attack-tech${subMapped ? ' has-mapped-sub' : ''}" data-attack-search="${e(search)}">${attackCell(tactic.id, id, mapped, technique.name)}${subs.length ? `<details class="attack-subs"${subMapped ? ' open' : ''}><summary>${subs.length} sub-technique${subs.length === 1 ? '' : 's'}</summary><ul>${subs.map((sub) => `<li>${attackCell(tactic.id, sub, mapped, MnAttackCatalog.technique(sub).name)}</li>`).join('')}</ul></details>` : ''}</li>`;
      }).join('');
      return `<section class="attack-col" aria-label="${e(tactic.name)}"><header class="attack-col-head"><a href="${e(MnAttackCatalog.url(tactic.id))}" target="_blank" rel="noopener">${e(tactic.name)}</a><span>${e(tactic.id)} · ${ids.length} techniques</span></header><ul>${items}</ul></section>`;
    }).join('');
  }

  function renderMappingPanel(fixture, state) {
    const e = escapeHtml;
    const scenario = fixture?.scenario;
    if (!scenario) return '';
    const mappings = state?.mappings || [];
    const mapped = new Map(mappings.map((item) => [`${item.tacticId}:${item.techniqueId}`, item.status]));
    const statusOptions = Object.entries(MAPPING_STATUS).map(([id, label]) => `<option value="${e(id)}">${e(label)}</option>`).join('');
    const eventOptions = scenario.telemetry.map((event) => `<label class="attack-evidence"><input type="checkbox" name="eventIds" value="${e(event.id)}"><span><strong>${e(event.id)}</strong> ${e(event.eventType)}<small>${e(event.device)}</small></span></label>`).join('');
    const savedRows = mappings.map((item) => {
      const key = `${e(item.tacticId)}:${e(item.techniqueId)}`;
      return `<tr><td>${e(TACTICS[item.tacticId] || item.tacticId)}</td><td><a href="${e(MnAttackCatalog.url(item.techniqueId))}" target="_blank" rel="noopener"><strong>${e(item.techniqueId)}</strong></a> ${e(TECHNIQUES[item.techniqueId]?.name || '')}</td><td><span class="attack-pill is-${e(item.status.replace('_', '-'))}">${e(MAPPING_STATUS[item.status] || item.status)}</span></td><td>${e(item.confidence)}%</td><td>${item.eventIds.map((id) => `<code>${e(id)}</code>`).join(' ')}</td><td class="attack-rationale">${e(item.rationale)}</td>
        <td class="attack-row-actions"><button type="button" data-m06-mapping-edit="${key}">Correct</button><details><summary>Remove</summary><form data-m06-mapping-remove-form="${key}"><label>Removal reason <input name="reason" maxlength="500" required></label><button type="submit">Remove mapping</button></form></details></td></tr>`;
    }).join('');
    return `<section class="attack-panel" data-m06-mapping-panel aria-label="ATT&CK mappings">
      <header class="attack-head"><div><h3>ATT&amp;CK<sup>®</sup> mappings</h3><p>MITRE ATT&amp;CK Enterprise v${e(MnAttackCatalog.VERSION)}. Select the cell for the behaviour your evidence shows. A technique listed under several tactics is mapped once per tactic.</p></div>
        <label class="attack-filter"><span>Find technique</span><input type="search" data-attack-filter placeholder="ID or name, e.g. T1053 or scheduled" autocomplete="off"></label></header>
      <ul class="attack-legend" aria-label="Legend"><li><i class="is-selected"></i>Selected</li><li><i class="is-supported"></i>Supported</li><li><i class="is-needs-review"></i>Needs review</li><li><i class="is-unsupported"></i>Unsupported</li></ul>
      <div class="attack-matrix" tabindex="0" aria-label="ATT&CK Enterprise matrix, scroll horizontally for all tactics">${renderMatrix(mapped)}</div>
      <p class="attack-notice">${e(MnAttackCatalog.NOTICE)}</p>
      <form class="attack-form" data-m06-mapping-form><input type="hidden" name="tacticId" value=""><input type="hidden" name="techniqueId" value="">
        <div class="attack-selected" data-attack-selected aria-live="polite">No technique selected. Choose a cell in the matrix above.</div>
        <div class="attack-form-grid"><label>Status <select name="status" required><option value="">Choose…</option>${statusOptions}</select></label>
        <label>Confidence (0–100) <input name="confidence" type="number" min="0" max="100" step="1" value="50" required></label></div>
        <label>Rationale <textarea name="rationale" rows="3" maxlength="2000" required placeholder="What in the cited events demonstrates (or rules out) this technique?"></textarea></label>
        <fieldset class="attack-evidence-set"><legend>Evidence event references</legend><div class="attack-evidence-grid">${eventOptions}</div></fieldset>
        <div class="attack-form-actions"><button type="submit" class="attack-primary">Save mapping</button><button type="button" data-m06-mapping-cancel hidden>Cancel correction</button></div></form>
      <p data-m06-mapping-feedback role="status"></p>
      <h4>Saved mappings (${mappings.length})</h4>
      ${savedRows ? `<div class="attack-table-wrap"><table class="attack-table"><thead><tr><th>Tactic</th><th>Technique</th><th>Status</th><th>Confidence</th><th>Evidence</th><th>Rationale</th><th></th></tr></thead><tbody>${savedRows}</tbody></table></div>` : '<p class="attack-empty">No mappings saved.</p>'}</section>`;
  }

  // The field an analyst identifies a row by: command, file, task or destination.
  function eventDetail(event) {
    return event.commandLine || event.path || event.taskName
      || (event.destination ? `${event.destination}${event.destinationPort ? `:${event.destinationPort}` : ''}` : '');
  }

  function render(results, options = {}) {
    const events = Array.isArray(results) ? results : [];
    if (!events.length) return `<section data-m06-related-results aria-label="Related event results"><p role="status">${escapeHtml(options.emptyText || 'No matching events.')}</p></section>`;
    const e = escapeHtml;
    return `<section data-m06-related-results aria-label="Related event results"><ol>${events.map((event) =>
      `<li data-event-id="${e(event.id)}"><div><time datetime="${e(event.time)}">${e(event.time)}</time><strong>${e(event.id)} · ${e(event.eventType)}</strong></div><span>${e(event.device)} / ${e(event.account)}</span><span>${e(event.action)}: ${e(event.result)}${eventDetail(event) ? `<code>${e(eventDetail(event))}</code>` : ''}</span><div class="m06-result-actions">${options.pivotFromEventId ? `<button type="button" data-m06-pivot-from="${e(options.pivotFromEventId)}" data-m06-pivot-to="${e(event.id)}">Pivot</button>` : ''}${options.relatedPivots ? (event.relatedEventIds || []).map((to) => `<button type="button" data-m06-pivot-from="${e(event.id)}" data-m06-pivot-to="${e(to)}">Pivot to ${e(to)}</button>`).join('') : ''}${options.bookmarks ? `<button type="button" data-m06-bookmark="${e(event.id)}">${options.bookmarks.includes(event.id) ? 'Remove bookmark' : 'Bookmark'}</button>` : ''}</div></li>`).join('')}</ol></section>`;
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
    return `<section data-m06-related-search aria-label="Related event search"><header class="m06-panel-header"><div><span class="m06-step">02 · Search</span><h3>Related event search</h3></div></header>
      <form data-m06-search-form><label>Search text <input name="query" maxlength="4000" value="${e(previous.query || '')}"></label>
      <label>Start UTC <input name="startTime" type="text" value="${e(start)}"></label><label>End UTC <input name="endTime" type="text" value="${e(end)}"></label>
      <label>Entity <select name="entityType"><option value="all"${type === 'all' ? ' selected' : ''}>All entities</option><option value="device"${type === 'device' ? ' selected' : ''}>Device</option><option value="account"${type === 'account' ? ' selected' : ''}>Account</option></select></label>
      <label>Entity value <select name="entityValue">${choices.map((item) => `<option value="${e(item)}"${item === value ? ' selected' : ''}>${e(item)}</option>`).join('')}</select></label>
      <div class="m06-form-actions"><button type="submit">Search events</button></div></form>${render(previous.resultEventIds?.map((id) => scenario.telemetry.find((event) => event.id === id)).filter(Boolean) || [], { bookmarks: state?.bookmarks || [], relatedPivots: true, emptyText: previous.timestamp ? '' : 'Run a search to see matching events.' })}</section>`;
  }

  function renderEvidencePanel(fixture, state) {
    const e = escapeHtml;
    const scenario = fixture?.scenario;
    if (!scenario) return '';
    const selected = (state?.collections || []).find((item) => item.id === state?.selectedCollectionId);
    const currentResults = (state?.queryHistory || []).at(-1)?.resultEventIds || [];
    const selectableIds = [...new Set([...currentResults, ...(selected?.eventIds || [])])];
    const eventMap = new Map(scenario.telemetry.map((event) => [event.id, event]));
    return `<section data-m06-evidence-panel aria-label="Bookmarks and evidence collections"><header class="m06-panel-header"><div><span class="m06-step">04 · Curate</span><h3>Evidence collection</h3></div><span class="m06-count-badge">${(state?.bookmarks || []).length}/100 bookmarks</span></header>
      <ul class="m06-bookmark-list">${(state?.bookmarks || []).map((id) => `<li><span>${e(id)}</span><button type="button" data-m06-bookmark="${e(id)}">Remove</button></li>`).join('') || '<li class="m06-empty-state">No bookmarked events.</li>'}</ul>
      <label>Selected collection <select data-m06-collection-select><option value="">No collection selected</option>${(state?.collections || []).map((item) => `<option value="${e(item.id)}"${item.id === selected?.id ? ' selected' : ''}>${e(item.name)} (${item.eventIds.length}/100)</option>`).join('')}</select></label>
      <form data-m06-collection-form><label>Collection name <input name="name" maxlength="80" required value="${e(selected?.name || '')}"></label>
      <p data-m06-evidence-feedback role="status"></p><fieldset class="m06-choice-set m06-field-wide"><legend>Fixture events</legend><div class="m06-choice-grid">${selectableIds.map((id) => `<label><input type="checkbox" name="eventIds" value="${e(id)}"${selected?.eventIds.includes(id) ? ' checked' : ''}><span><strong>${e(id)}</strong><small>${e(eventMap.get(id)?.eventType || '')}</small></span></label>`).join('') || '<p class="m06-empty-state">Run a saved query to choose evidence events.</p>'}</div></fieldset>
      <div class="m06-form-actions m06-field-wide"><button type="submit">${selected ? 'Save collection' : 'Create collection'}</button></div></form>
      <ol class="m06-record-list">${(selected?.eventIds || []).map((id) => `<li>${e(id)} · ${e(eventMap.get(id)?.eventType || '')}</li>`).join('') || '<li>Selected collection is empty.</li>'}</ol></section>`;
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
    return `<section data-m06-saved-query-panel aria-label="Saved queries"><header class="m06-panel-header"><div><span class="m06-step">03 · Make repeatable</span><h3>Saved queries</h3></div></header>
      <p class="m06-query-help"><strong>Query grammar</strong><code>field == "value"</code> joined with lowercase <code>and</code><span>Available fields: ${Object.keys(QUERY_FIELDS).map(e).join(', ')}</span><span>Exact equality only</span></p>
      <form data-m06-save-query-form><label>Query name <input name="name" maxlength="80" required></label>
      <label class="m06-field-wide">Query <textarea name="query" maxlength="500" required placeholder='eventType == "process_start" and device == "ws-318"'></textarea></label>
      <label>Start UTC <input name="startTime" value="${e(start)}" required></label><label>End UTC <input name="endTime" value="${e(scenario.scope.timeEnd)}" required></label>
      <label>Entity type <select name="entityType"><option value="all">All entities</option><option value="device" selected>Device</option><option value="account">Account</option></select></label>
      <label>Entity value <input name="entityValue" value="${e(scenario.scope.devices[0])}" required></label>
      <div class="m06-form-actions m06-field-wide"><button type="submit">Save query</button><p data-m06-query-feedback role="status"></p></div></form>
      <ul class="m06-record-list">${definitions.map((item) => `<li><strong>${e(item.name)}</strong><code>${e(item.query)}</code><button type="button" data-m06-run-saved-query="${e(item.id)}">Run</button></li>`).join('') || '<li>No saved queries.</li>'}</ul>
      ${latest ? `<p role="status">Last run: ${e(latest.name)} · ${e(latest.resultCount)} results · ${e(latest.timestamp)}</p>${render(latestEvents, { bookmarks: state?.bookmarks || [] })}` : '<p role="status">No query runs yet.</p>'}</section>`;
  }

  return Object.freeze({ MAX_RANGE_MS, SEARCH_LIMIT, QUERY_FIELDS, TACTICS, TECHNIQUES, validateScope, search, parseQuery, saveQuery, runSavedQuery, pivot,
    toggleBookmark, selectCollection, saveCollection, validateMapping, saveMapping, removeMapping, proposeHandoff, updateHandoffStatus, renderHandoffPanel, renderMappingPanel, render, renderSearch, renderSavedQueryPanel, renderEvidencePanel, escapeHtml });
})();

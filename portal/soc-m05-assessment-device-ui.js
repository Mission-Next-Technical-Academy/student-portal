/* Pure device inventory and device-scoped timeline views for Module 05. */
const SocM05AssessmentDeviceUi = (() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function timelineEvents(scenario, deviceId) {
    const start = Date.parse(scenario?.start);
    const end = Date.parse(scenario?.end);
    if (!deviceId || !Number.isFinite(start) || !Number.isFinite(end)) return [];
    return (Array.isArray(scenario.telemetry) ? scenario.telemetry : [])
      .filter((event) => event.deviceId === deviceId && Number.isFinite(Date.parse(event.time)))
      .filter((event) => Date.parse(event.time) >= start && Date.parse(event.time) <= end)
      .slice()
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || String(a.id).localeCompare(String(b.id)));
  }

  function processTree(scenario, deviceId) {
    if (!deviceId || !Array.isArray(scenario?.devices) || !scenario.devices.some((device) => device.id === deviceId) || !Array.isArray(scenario?.telemetry)) return [];
    const events = scenario.telemetry
      .filter((event) => event?.deviceId === deviceId && event.eventType === 'process_start' && event.processId != null && String(event.processId) !== '')
      .slice()
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || String(a.id).localeCompare(String(b.id)));
    const nodes = events.map((event) => ({ event, id: String(event.processId), parentId: event.parentProcessId == null ? '' : String(event.parentProcessId), parent: null, children: [], orphan: false }));
    const byId = new Map();
    nodes.forEach((node) => { if (!byId.has(node.id)) byId.set(node.id, node); });
    nodes.forEach((node) => {
      if (!node.parentId) return;
      const parent = byId.get(node.parentId);
      if (!parent || parent === node) {
        node.orphan = true;
        return;
      }
      node.parent = parent;
    });
    nodes.forEach((node) => {
      const path = new Set();
      let cursor = node;
      while (cursor) {
        if (path.has(cursor)) {
          cursor.orphan = true;
          cursor.parent = null;
          break;
        }
        path.add(cursor);
        cursor = cursor.parent;
      }
    });
    nodes.forEach((node) => { if (node.parent) node.parent.children.push(node); });
    return nodes.filter((node) => !node.parent);
  }

  function fileRecords(scenario, deviceId) {
    if (!deviceId || !Array.isArray(scenario?.devices) || !scenario.devices.some((device) => device.id === deviceId) || !Array.isArray(scenario?.telemetry)) return [];
    const events = scenario.telemetry.filter((event) => event?.deviceId === deviceId);
    const fileEvents = events.filter((event) => event.eventType === 'file_create' || event.eventType === 'file_hash' || (event.eventType === 'process_start' && (event.filePath || event.sha256)));
    const groups = new Map();
    fileEvents.forEach((event) => {
      const key = `${event.filePath || ''}\u0000${event.sha256 || ''}`;
      if (!groups.has(key)) groups.set(key, { filePath: event.filePath || '', sha256: event.sha256 || '', events: [], processEvents: [], endpointEvents: [] });
      const group = groups.get(key);
      group.events.push(event);
      if (event.eventType === 'process_start') group.processEvents.push(event);
    });
    const records = Array.from(groups.values());
    records.forEach((record) => {
      const processIds = new Set(record.processEvents.map((event) => String(event.processId || '')).filter(Boolean));
      record.endpointEvents = events.filter((event) => event.eventType === 'sensor_control' && ((record.filePath && event.filePath === record.filePath) || (record.sha256 && event.sha256 === record.sha256) || (event.processId != null && processIds.has(String(event.processId)))));
    });
    return records.sort((a, b) => String(a.filePath).localeCompare(String(b.filePath)) || String(a.sha256).localeCompare(String(b.sha256)));
  }

  function persistenceRecords(scenario, deviceId) {
    if (!deviceId || !Array.isArray(scenario?.devices) || !scenario.devices.some((device) => device.id === deviceId)) return [];
    const events = timelineEvents(scenario, deviceId);
    const processes = events.filter((event) => event.eventType === 'process_start');
    return events.filter((event) => event.eventType === 'persistence_change').map((event) => {
      const processMatches = processes.filter((process) => event.processId != null && String(process.processId) === String(event.processId));
      const fileMatches = events.filter((file) => ['file_create', 'file_hash', 'process_start'].includes(file.eventType) &&
        ((event.filePath && file.filePath === event.filePath) || (event.sha256 && file.sha256 === event.sha256) ||
          (event.processId != null && String(file.processId) === String(event.processId))));
      return { event, processMatches, fileMatches };
    });
  }

  function endpointControlEvents(scenario, deviceId) {
    if (!deviceId || !Array.isArray(scenario?.devices) || !scenario.devices.some((device) => device.id === deviceId)) return [];
    return timelineEvents(scenario, deviceId).filter((event) => event.eventType === 'sensor_control');
  }

  function renderPersistence(scenario, deviceId, e) {
    const records = persistenceRecords(scenario, deviceId);
    if (!records.length) return '<p class="m05-device-empty">No persistence changes are recorded for this device.</p>';
    return `<ul>${records.map(({ event, processMatches, fileMatches }) => {
      const linkedProcesses = processMatches.length
        ? `<ul>${processMatches.map((process) => `<li data-linked-process="${e(process.processId)}">${e(process.processId)} · ${e(process.image || 'Image not recorded')}</li>`).join('')}</ul>`
        : '<p>No matching process reference is recorded.</p>';
      const linkedFiles = fileMatches.length
        ? `<ul>${fileMatches.map((file) => `<li data-linked-file-event="${e(file.id)}">${e(file.filePath || 'File path not recorded')} · SHA-256 ${e(file.sha256 || 'Not recorded')}</li>`).join('')}</ul>`
        : '<p>No matching file or hash reference is recorded.</p>';
      return `<li><article data-persistence-event="${e(event.id)}"><h4>${e(event.registryPath || 'Registry path not recorded')}</h4><dl><dt>Observed operation</dt><dd>${e(event.action || 'Not recorded')}</dd><dt>Recorded result</dt><dd>${e(event.result || 'Not recorded')}</dd><dt>Time</dt><dd>${e(event.time || 'Not recorded')}</dd><dt>Process references</dt><dd>${linkedProcesses}</dd><dt>File and hash references</dt><dd>${linkedFiles}</dd></dl></article></li>`;
    }).join('')}</ul>`;
  }

  function endpointOutcome(result) {
    const value = String(result || '').toLowerCase();
    if (value.includes('detected') && (value.includes('not_prevented') || value.includes('not prevented'))) return 'Detected, not prevented';
    if (value.includes('prevent')) return 'Prevention outcome recorded';
    if (value.includes('cleanup') || value.includes('remediat') || value.includes('quarantin') || value.includes('removed')) return 'Cleanup outcome recorded';
    return result ? 'Recorded endpoint outcome' : 'Outcome not recorded';
  }

  function renderEndpointOutcomes(scenario, deviceId, e) {
    const events = endpointControlEvents(scenario, deviceId);
    if (!events.length) return '<p class="m05-device-empty">No endpoint prevention, detection, or cleanup outcome is recorded for this device.</p>';
    return `<ul>${events.map((event) => `<li data-endpoint-outcome-event="${e(event.id)}"><article><h4>${e(endpointOutcome(event.result))}</h4><dl><dt>Observed operation</dt><dd>${e(event.action || 'Not recorded')}</dd><dt>Recorded outcome</dt><dd>${e(event.result || 'Outcome not recorded')}</dd><dt>Time</dt><dd>${e(event.time || 'Not recorded')}</dd><dt>File</dt><dd>${e(event.filePath || 'Not recorded')}</dd><dt>SHA-256</dt><dd>${e(event.sha256 || 'Not recorded')}</dd><dt>Process ID</dt><dd>${e(event.processId || 'Not recorded')}</dd></dl></article></li>`).join('')}</ul>`;
  }

  function renderFileEvidence(scenario, deviceId, e) {
    const records = fileRecords(scenario, deviceId);
    if (!records.length) return '<p class="m05-device-empty">No file evidence is available for this device.</p>';
    return `<ul class="m05-file-evidence">${records.map((record) => {
      const hashEvent = record.events.find((event) => event.eventType === 'file_hash');
      const field = (label, value) => `<dt>${label}</dt><dd>${e(value == null || value === '' ? 'Not recorded' : value)}</dd>`;
      const processLinks = record.processEvents.length
        ? `<ul>${record.processEvents.map((event) => `<li data-linked-process="${e(event.processId)}">Process ${e(event.processId || 'Not recorded')}: ${e(event.image || 'Image not recorded')} · ${e(event.commandLine || 'Command line not recorded')}</li>`).join('')}</ul>`
        : '<p>No linked process event is available.</p>';
      const endpointLinks = record.endpointEvents.length
        ? `<ul>${record.endpointEvents.map((event) => `<li data-linked-endpoint-event="${e(event.id)}">${e(event.time)} · ${e(event.action || event.eventType)} · ${e(event.result || 'Outcome not recorded')}</li>`).join('')}</ul>`
        : '<p>No linked endpoint-control event is available.</p>';
      return `<li><article><h4>${e(record.filePath || 'File path not recorded')}</h4><dl>${field('SHA-256', record.sha256)}${field('Signer', hashEvent?.signer)}${field('Prevalence', hashEvent?.prevalence == null ? '' : hashEvent.prevalence)}${field('Reputation', hashEvent?.reputation || hashEvent?.result)}<dt>Process evidence</dt><dd>${processLinks}</dd><dt>Endpoint evidence</dt><dd>${endpointLinks}</dd></dl></article></li>`;
    }).join('')}</ul>`;
  }

  function renderProcessNode(node, e, visited = new Set()) {
    if (visited.has(node)) return '';
    visited.add(node);
    const event = node.event;
    const children = node.children.map((child) => renderProcessNode(child, e, visited)).join('');
    const missingParent = node.orphan ? `<p class="m05-process-parent-warning">Parent process ${e(node.parentId)} is unavailable or cyclic.</p>` : '';
    return `<li data-process-id="${e(node.id)}"><article><h4>${e(node.id)} · ${e(event.image || 'Executable path unavailable')}</h4>${missingParent}<dl><dt>Command line</dt><dd>${e(event.commandLine || 'Not recorded')}</dd><dt>User</dt><dd>${e(event.user || 'Not recorded')}</dd><dt>Executable path</dt><dd>${e(event.image || 'Not recorded')}</dd></dl></article>${children ? `<ol>${children}</ol>` : ''}</li>`;
  }

  function render(scenario, selectedDeviceId = '', evidencePackage = null, approvalRequests = [], edrHandoffs = []) {
    const e = escapeHtml;
    const devices = Array.isArray(scenario?.devices) ? scenario.devices : [];
    const selected = devices.find((device) => device.id === selectedDeviceId) || null;
    const inventory = `<section class="m05-device-inventory" aria-label="Device inventory"><h3>Device inventory</h3><ul>${devices.map((device) => `<li><button type="button" data-m05-device-select="${e(device.id)}" aria-pressed="${device.id === selected?.id}"><strong>${e(device.hostname)}</strong><span>${e(device.platform)} · ${e(device.role)}</span></button></li>`).join('')}</ul></section>`;
    if (!selected) {
      return `${inventory}<section class="m05-device-detail"><p class="m05-device-empty">${devices.length ? 'Select a device to inspect its profile and timeline.' : 'No devices are available.'}</p></section>`;
    }

    const profile = `<section class="m05-device-profile" aria-label="Device profile"><h3>${e(selected.hostname)}</h3><dl><dt>Device ID</dt><dd>${e(selected.id)}</dd>${selected.assetId ? `<dt>Asset ID</dt><dd>${e(selected.assetId)}</dd>` : ''}<dt>Platform</dt><dd>${e(selected.platform)}</dd><dt>Role</dt><dd>${e(selected.role)}</dd><dt>Owner</dt><dd>${e(selected.owner)}</dd><dt>Zone</dt><dd>${e(selected.zone)}</dd><dt>Status</dt><dd>${e(selected.status)}</dd></dl></section>`;
    const items = timelineEvents(scenario, selected.id);
    const processRoots = processTree(scenario, selected.id);
    const processTreeView = !processRoots.length
      ? '<p class="m05-device-empty">No process start events are available for this device.</p>'
      : `<ol class="m05-process-tree">${processRoots.map((node) => renderProcessNode(node, e)).join('')}</ol>`;
    const timeline = !items.length
      ? '<p class="m05-device-empty">No telemetry in the fixed scenario window.</p>'
      : typeof SocTimelineUi !== 'undefined' ? SocTimelineUi.render({
      scope: 'm05-device', selectedEntity: selected.id,
      entityGroups: [{ label: 'Devices', values: devices.map((device) => device.id) }],
      items,
      renderItem: (event) => `<li data-event-id="${e(event.id)}"><time datetime="${e(event.time)}">${e(event.time)}</time><strong>${e(event.eventType)}</strong><span>${e(event.user)}</span><span>${e(event.result)}</span></li>`,
      selectAttributes: () => `data-m05-device-select="${e(selected.id)}"`,
      entityLabel: 'Device', placeholder: 'Select a device', emptyMessage: 'No telemetry in the fixed scenario window.',
      prefix: 'm05', escapeHtml: e,
    }) : `<section class="m05-timeline"><ol>${items.map((event) => `<li data-event-id="${e(event.id)}"><time datetime="${e(event.time)}">${e(event.time)}</time><strong>${e(event.eventType)}</strong><span>${e(event.user)}</span><span>${e(event.result)}</span></li>`).join('')}</ol></section>`;
    const fileEvidence = renderFileEvidence(scenario, selected.id, e);
    const persistence = renderPersistence(scenario, selected.id, e);
    const endpointOutcomes = renderEndpointOutcomes(scenario, selected.id, e);
    const packageCurrent = evidencePackage?.deviceId === selected.id ? evidencePackage : null;
    const selectedEventIds = new Set(packageCurrent?.eventIds || []);
    const selectedHashes = new Set(packageCurrent?.hashes || []);
    // Evidence pickers: one row per event (time, id, type, one-line detail)
    // and one row per file hash with the file it belongs to.
    const pickRows = items.slice().sort((a, b) => String(a.time).localeCompare(String(b.time)));
    const pickDetail = (event) => event.registryPath || event.filePath || event.image || event.commandLine || event.url || event.result || '';
    const eventPicker = (attrs, checked) => (pickRows.length ? `<div class="m05-pick" role="group" aria-label="Telemetry events"><div class="m05-pick-head" aria-hidden="true"><span></span><span>Time</span><span>Event</span><span>Type</span><span>Detail</span></div>${pickRows.map((event) => `<label class="m05-pick-row"><input type="checkbox" ${attrs} value="${e(event.id)}" ${checked.has(event.id) ? 'checked' : ''}><span>${e(String(event.time || '').slice(11, 19))}</span><span class="m05-pick-id">${e(event.id)}</span><span>${e(String(event.eventType || '').replace(/_/g, ' '))}</span><span class="m05-pick-detail" title="${e(pickDetail(event))}">${e(pickDetail(event))}</span></label>`).join('')}</div>` : '');
    const hashes = Array.from(new Set(items.map((event) => event.sha256).filter(Boolean)));
    const hashFile = (hash) => { const owner = items.find((event) => event.sha256 === hash && (event.filePath || event.image)); return owner ? String(owner.filePath || owner.image).split(/[\\/]/).pop() : ''; };
    const hashPicker = (attrs, checked) => (hashes.length ? `<div class="m05-pick" role="group" aria-label="File hashes"><div class="m05-pick-head m05-pick-hash" aria-hidden="true"><span></span><span>SHA-256</span><span>File</span></div>${hashes.map((hash) => `<label class="m05-pick-row m05-pick-hash"><input type="checkbox" ${attrs} value="${e(hash)}" ${checked.has(hash) ? 'checked' : ''}><span class="m05-pick-id" title="${e(hash)}">${e(hash.slice(0, 12))}…</span><span class="m05-pick-detail">${e(hashFile(hash))}</span></label>`).join('')}</div>` : '');
    const selectable = eventPicker('data-m05-evidence-event', selectedEventIds);
    const hashChoices = hashPicker('data-m05-evidence-hash', selectedHashes);
    const packageSummary = packageCurrent ? `<p data-m05-preserved-package>Preserved for ${e(packageCurrent.deviceId)}: events ${e(packageCurrent.eventIds.join(', '))}; hashes ${e(packageCurrent.hashes.join(', ') || 'none')}.</p>` : '';
    const packagePanel = `<section class="m05-evidence-package" aria-label="Evidence package"><h3>Preserve endpoint evidence package</h3><p>Select events and file hashes observed on this device.</p>${packageSummary}<h4 class="m05-pick-label">Events</h4>${selectable || '<p>No telemetry events available for selection.</p>'}<h4 class="m05-pick-label">File hashes</h4>${hashChoices || '<p>No file hashes recorded for this device.</p>'}<button type="button" data-m05-preserve-evidence>Preserve selected package</button><p role="status" aria-live="polite" data-m05-preserve-status></p></section>`;
    const files = fileRecords(scenario, selected.id).filter((file) => file.filePath && file.sha256);
    const fileOptions = files.map((file) => `<option value="${e(file.filePath)}" data-sha256="${e(file.sha256)}">${e(file.filePath)} · ${e(file.sha256)}</option>`).join('');
    const requests = approvalRequests.filter((request) => request.deviceId === selected.id);
    const requestList = requests.length ? `<ul>${requests.map((request) => `<li data-m05-request="${e(request.id)}">${e(request.type)} · ${e(request.status)} · ${e(request.reason)}</li>`).join('')}</ul>` : '<p>No response requests recorded for this device.</p>';
    const responsePanel = `<section class="m05-response-requests" aria-label="Approval-gated response requests"><h3>Request response action</h3><p>Requests are recorded for approval only. No isolation or quarantine is performed in this assessment.</p>${requestList}<form data-m05-response-request><label>Action<select name="requestType" required><option value="endpoint_isolation_request">Request endpoint isolation</option><option value="endpoint_quarantine_request">Request file quarantine</option></select></label><label>Reason<input name="reason" required maxlength="500"></label><label>Requester<input name="requestedBy" required maxlength="120"></label><label>File on this device<select name="filePath">${fileOptions || '<option value="">No files available</option>'}</select></label><button type="submit">Submit approval request</button><p role="status" data-m05-request-status aria-live="polite"></p></form></section>`;
    const handoffs = edrHandoffs.filter((handoff) => handoff.deviceIds.includes(selected.id));
    const handoffItems = eventPicker('name="eventIds" data-m05-handoff-event', new Set());
    const handoffHashes = hashPicker('name="hashes" data-m05-handoff-hash', new Set());
    const handoffList = handoffs.length ? `<ul>${handoffs.map((handoff) => `<li data-m05-handoff="${e(handoff.id)}"><strong>${e(handoff.summary)}</strong> · ${e(handoff.status)} · Owner: ${e(handoff.owner)} · Recipient: ${e(handoff.recipient)} · ${e(handoff.recommendation)}<form data-m05-handoff-status><input type="hidden" name="handoffId" value="${e(handoff.id)}"><label>Status<select name="status"><option value="accepted">Accepted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></label><label>Updated by<input name="updatedBy" required maxlength="120"></label><button type="submit">Update handoff</button></form></li>`).join('')}</ul>` : '<p>No EDR handoffs recorded for this device.</p>';
    const handoffPanel = `<section aria-label="EDR handoff"><h3>EDR handoff</h3>${handoffList}<form data-m05-edr-handoff><fieldset><legend>Evidence for the endpoint team</legend><h4 class="m05-pick-label">Events</h4>${handoffItems || '<p>No events available.</p>'}<h4 class="m05-pick-label">File hashes</h4>${handoffHashes || '<p>No hashes available.</p>'}</fieldset><label>Summary<input name="summary" required maxlength="500"></label><label>Owner<input name="owner" required maxlength="120"></label><label>Recipient<input name="recipient" required maxlength="120"></label><label>Recommendation<textarea name="recommendation" required maxlength="500"></textarea></label><button type="submit">Submit EDR handoff</button><p role="status" aria-live="polite" data-m05-handoff-status-message></p></form></section>`;
    return `${inventory}${profile}${packagePanel}${responsePanel}${handoffPanel}<section class="m05-device-timeline" aria-label="Device timeline"><h3>Telemetry timeline</h3>${timeline}</section><section class="m05-process-tree-view" aria-label="Process tree"><h3>Process tree</h3>${processTreeView}</section><section class="m05-file-evidence-view" aria-label="File and reputation evidence"><h3>File and reputation evidence</h3>${fileEvidence}</section><section class="m05-persistence-view" aria-label="Persistence changes"><h3>Persistence changes</h3>${persistence}</section><section class="m05-endpoint-outcomes-view" aria-label="Endpoint control outcomes"><h3>Endpoint prevention, detection, and cleanup outcomes</h3>${endpointOutcomes}</section>`;
  }

  return Object.freeze({ render, timelineEvents, processTree, fileRecords, persistenceRecords, endpointControlEvents, escapeHtml });
})();

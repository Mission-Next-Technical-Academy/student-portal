/* Fixture-bounded DNS/TLS and firewall/proxy workspace for Module 07. */
const SocM07AssessmentNetworkUi = (() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function search(fixture, filters = {}) {
    const events = fixture?.scenario?.networkEvents;
    if (!Array.isArray(events)) return [];
    const query = String(filters.query || '').trim().toLowerCase().slice(0, 100);
    const type = ['all', 'dns_query', 'tls_session', 'firewall_flow', 'proxy_request'].includes(filters.type) ? filters.type : 'all';
    const device = String(filters.device || '').trim().toLowerCase().slice(0, 40);
    return events.filter((event) => (type === 'all' || event.type === type)
      && (!device || event.deviceId.toLowerCase().includes(device))
      && (!query || Object.entries(event).some(([key, value]) => key !== 'benignLookalike'
        && (typeof value === 'string' || typeof value === 'number')
        && String(value).toLowerCase().includes(query))))
      .slice(0, 100);
  }

  function detailRows(event) {
    const fields = {
      dns_query: [['Domain', event.domain], ['Answers', event.answers?.join(', ')], ['Resolver', event.source], ['Recipient', event.recipientId], ['Device', event.deviceId]],
      tls_session: [['SNI', event.sni], ['Destination', `${event.destinationIp}:${event.destinationPort}`], ['Certificate SHA-256', event.certificateSha256], ['DNS event', event.relatedDnsEventId], ['Recipient', event.recipientId], ['Device', event.deviceId]],
      firewall_flow: [['Source', event.sourceIp], ['Destination', `${event.destinationIp}:${event.destinationPort}`], ['Action', event.action], ['TLS event', event.relatedTlsEventId], ['Recipient', event.recipientId], ['Device', event.deviceId]],
      proxy_request: [['Method', event.method], ['URL', event.url], ['HTTP status', event.status], ['TLS event', event.relatedTlsEventId], ['Recipient', event.recipientId], ['Device', event.deviceId]],
    };
    return fields[event.type] || [];
  }

  function correlatedProcesses(fixture, proxyEvent) {
    if (proxyEvent?.type !== 'proxy_request') return [];
    const processes = fixture?.scenario?.endpointProcessEvents;
    if (!Array.isArray(processes)) return [];
    const proxyTime = Date.parse(proxyEvent.timestamp);
    return processes.filter((process) => process.type === 'process_start'
      && process.relatedProxyEventId === proxyEvent.id
      && process.deviceId === proxyEvent.deviceId
      && process.recipientId === proxyEvent.recipientId
      && Number.isFinite(proxyTime) && Number.isFinite(Date.parse(process.timestamp))
      && Date.parse(process.timestamp) >= proxyTime
      && Date.parse(process.timestamp) - proxyTime <= 30000);
  }

  function processDetails(process) {
    return [
      ['Process', process.processName], ['Image path', process.imagePath],
      ['Command line', process.commandLine], ['Parent process', process.parentProcessName],
      ['Timestamp', process.timestamp],
    ];
  }

  function packetSample(fixture, eventId) {
    if (typeof eventId !== 'string' || eventId.length > 40) return null;
    const events = fixture?.scenario?.networkEvents;
    const samples = fixture?.scenario?.packetSamples;
    if (!Array.isArray(events) || !Array.isArray(samples) || !events.some((event) => event.id === eventId)) return null;
    const sample = samples.find((record) => record.eventId === eventId);
    if (!sample || typeof sample.sampleHex !== 'string' || sample.sampleHex.length > 384
      || !/^(?:[0-9a-f]{2}(?:\s|$))*$/i.test(sample.sampleHex)
      || typeof sample.sampleText !== 'string' || sample.sampleText.length > 512
      || !Number.isInteger(sample.capturedBytes) || sample.capturedBytes < 0 || sample.capturedBytes > 512) return null;
    return sample;
  }

  function render(fixture, state, filters = {}) {
    if (!Array.isArray(fixture?.scenario?.networkEvents)) return '<section aria-label="Network workspace"><p role="status">Network telemetry is unavailable.</p></section>';
    const e = escapeHtml;
    const events = search(fixture, filters);
    const selectedSample = packetSample(fixture, filters.pcapEventId);
    const networkIds = new Set(fixture.scenario.networkEvents.map((event) => event.id));
    const reviewed = new Set((state?.reviewedNetworkEventIds || []).filter((id) => networkIds.has(id)));
    const selectedEvidence = new Set((state?.evidenceChanges || []).map((item) => item.eventId));
    const evidenceRecords = typeof SocM07AssessmentActions !== 'undefined' ? SocM07AssessmentActions.evidenceRecords(fixture) : [];
    const evidenceById = new Map(evidenceRecords.map((record) => [record.id, record]));
    const evidenceTray = [...selectedEvidence].filter((id) => evidenceById.has(id)).map((id) => {
      const record = evidenceById.get(id);
      return `<li><span>${e(record.kind)} · ${e(record.label || record.id)} <code>${e(record.id)}</code></span>
        <button type="button" data-m07-evidence-toggle="${e(record.id)}" aria-pressed="true">Remove</button></li>`;
    }).join('');
    const pivots = (state?.pivots || []).filter((pivot) => networkIds.has(pivot.fromEventId) && networkIds.has(pivot.toEventId));
    const cards = events.map((event) => {
      const outbound = [event.relatedDnsEventId, event.relatedTlsEventId];
      const inbound = fixture.scenario.networkEvents.filter((candidate) =>
        candidate.relatedDnsEventId === event.id || candidate.relatedTlsEventId === event.id).map((candidate) => candidate.id);
      const links = [...new Set([...outbound, ...inbound].filter((id) => id && networkIds.has(id)))];
      const rows = detailRows(event).filter(([, value]) => value !== undefined && value !== null && value !== '');
      const processCards = correlatedProcesses(fixture, event).map((process) => `<section class="m07-assessment-process-correlation" data-m07-process-correlation="${e(process.id)}">
        <h6>Explicitly linked endpoint process</h6><p><code>${e(process.id)}</code> · ${e(process.classification || 'classification unavailable')}</p>
        <button type="button" data-m07-evidence-toggle="${e(process.id)}" aria-pressed="${selectedEvidence.has(process.id) ? 'true' : 'false'}">${selectedEvidence.has(process.id) ? 'Remove from evidence' : 'Add to evidence'}</button>
        <dl>${processDetails(process).map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
        <p>Observed process and proxy records are linked in this fixture; this does not establish payload execution or credential compromise.</p>
      </section>`).join('');
      return `<article class="m07-assessment-network-event" data-m07-network-event="${e(event.id)}">
        <header><div><h5>${e(event.type.replaceAll('_', ' '))}</h5><p><code>${e(event.id)}</code> · ${e(event.timestamp)}</p></div>
          <div><button type="button" data-m07-review-network="${e(event.id)}" aria-pressed="${reviewed.has(event.id) ? 'true' : 'false'}">${reviewed.has(event.id) ? 'Mark unreviewed' : 'Mark reviewed'}</button>
          <button type="button" data-m07-evidence-toggle="${e(event.id)}" aria-pressed="${selectedEvidence.has(event.id) ? 'true' : 'false'}">${selectedEvidence.has(event.id) ? 'Remove from evidence' : 'Add to evidence'}</button></div></header>
        <dl>${rows.map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
        ${processCards}
        ${links.map((targetId) => `<button type="button" data-m07-network-pivot-from="${e(event.id)}" data-m07-network-pivot-to="${e(targetId)}">Open related ${e(targetId)}</button>`).join(' ')}
      </article>`;
    }).join('');
    return `<section class="m07-assessment-network" aria-label="Network workspace" data-m07-network-workspace>
      <h3>Network workspace</h3><p>Fixture DNS, TLS, firewall, and proxy telemetry</p>
      <section aria-label="Selected evidence" data-m07-evidence-tray><h4>Evidence tray</h4><ul>${evidenceTray || '<li>No evidence selected.</li>'}</ul></section>
      <form data-m07-network-search>
        <label>Search event fields <input type="search" name="query" maxlength="100" value="${e(filters.query)}"></label>
        <label>Event type <select name="type">${[['all','All network events'],['dns_query','DNS'],['tls_session','TLS'],['firewall_flow','Firewall'],['proxy_request','Proxy']].map(([value,label]) => `<option value="${value}" ${filters.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label>Device <input type="search" name="device" maxlength="40" value="${e(filters.device)}"></label>
        <button type="submit">Search telemetry</button>
      </form>
      <p role="status">${events.length} fixture event${events.length === 1 ? '' : 's'} shown.</p>
      <div class="m07-assessment-network-results">${cards || '<p role="status">No network events match these filters.</p>'}</div>
      <h4>Saved network pivots</h4><ul>${pivots.map((pivot) => `<li><code>${e(pivot.fromEventId)}</code> → <code>${e(pivot.toEventId)}</code> (${e(pivot.field)}: ${e(pivot.value)})</li>`).join('') || '<li>No network pivots saved.</li>'}</ul>
      <section aria-label="Fixture packet sample" data-m07-packet-sample>
        <h4>Packet sample</h4><p>Synthetic bounded sample; only explicit fixture records are available.</p>
        <form data-m07-packet-select><label>Network event <select name="eventId"><option value="">Select a fixture event</option>${(fixture.scenario.packetSamples || []).filter((sample) => packetSample(fixture, sample.eventId)).map((sample) => `<option value="${e(sample.eventId)}" ${filters.pcapEventId === sample.eventId ? 'selected' : ''}>${e(sample.eventId)}</option>`).join('')}</select></label><button type="submit">View sample</button></form>
        ${selectedSample ? `<article><h5>${e(selectedSample.summary)}</h5><p><code>${e(selectedSample.eventId)}</code> · ${e(selectedSample.protocol)} · ${e(selectedSample.capturedBytes)} captured bytes</p><pre>${e(selectedSample.sampleHex)}</pre><p>${e(selectedSample.sampleText)}</p></article>` : '<p role="status">No packet sample selected.</p>'}
      </section>
    </section>`;
  }

  function pivotDetails(fixture, fromEventId, toEventId) {
    const events = fixture?.scenario?.networkEvents || [];
    const from = events.find((event) => event.id === fromEventId);
    const to = events.find((event) => event.id === toEventId);
    if (!from || !to) return null;
    const related = from.relatedDnsEventId === to.id || from.relatedTlsEventId === to.id
      || to.relatedDnsEventId === from.id || to.relatedTlsEventId === from.id;
    if (!related) return null;
    const field = 'relatedEvent';
    return { fromEventId, toEventId, field, value: to.id };
  }

  return Object.freeze({ render, search, pivotDetails, correlatedProcesses, packetSample, escapeHtml });
})();

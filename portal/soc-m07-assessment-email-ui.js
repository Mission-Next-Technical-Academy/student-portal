/* Message queue and raw-header review for the independent Module 07 assessment. */
const SocM07AssessmentEmailUi = (() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function render(fixture, state) {
    const scenario = fixture?.scenario;
    if (!scenario || !Array.isArray(scenario.messages)) {
      return '<section class="m07-assessment-email" aria-label="Email assessment"><p role="status">Assessment messages are unavailable.</p></section>';
    }
    const e = escapeHtml;
    const messages = scenario.messages.slice(0, 50);
    const reviewed = new Set(Array.isArray(state?.reviewedMessageIds) ? state.reviewedMessageIds : []);
    const reviewedArtifacts = new Set(Array.isArray(state?.reviewedArtifactIds) ? state.reviewedArtifactIds : []);
    const selectedEvidence = new Set((state?.evidenceChanges || []).map((item) => item.eventId));
    const filters = state?.recipientSearch || { query: '', delivery: 'all', interaction: 'all', limit: 100 };
    const scopedIds = Array.isArray(state?.scope?.recipientIds) ? state.scope.recipientIds : [];
    const traceRows = typeof SocM07AssessmentActions !== 'undefined'
      ? SocM07AssessmentActions.searchRecipients(fixture, filters) : [];
    const trace = traceRows.map((row) => {
      const group = scenario.recipientGroups.find((item) => item.id === row.groupId);
      return `<tr data-m07-recipient-id="${e(row.recipientId)}"><td>${e(row.recipientId)}</td><td>${e(group?.delivery === 'blocked_at_gateway' ? 'Gateway blocked' : 'Delivered')}</td>
        <td>${e(row.deviceId || 'No device recorded')}</td><td>${row.opened ? 'Opened' : 'Not recorded'}</td><td>${row.clicked ? 'Link clicked' : 'Not recorded'}</td>
        <td>${e(row.timestamp)}</td><td>${scopedIds.includes(row.recipientId) ? 'In current scope' : 'Outside current scope'}</td>
        <td><button type="button" data-m07-evidence-toggle="${e(row.deliveryEventId)}" aria-pressed="${selectedEvidence.has(row.deliveryEventId) ? 'true' : 'false'}">${selectedEvidence.has(row.deliveryEventId) ? 'Remove from evidence' : 'Add to evidence'}: delivery</button>
        ${row.interactionEventIds.map((id) => `<button type="button" data-m07-evidence-toggle="${e(id)}" aria-pressed="${selectedEvidence.has(id) ? 'true' : 'false'}">${selectedEvidence.has(id) ? 'Remove from evidence' : 'Add to evidence'}: interaction</button>`).join('')}</td></tr>`;
    }).join('');
    const evidenceRecords = typeof SocM07AssessmentActions !== 'undefined' ? SocM07AssessmentActions.evidenceRecords(fixture) : [];
    const evidenceById = new Map(evidenceRecords.map((record) => [record.id, record]));
    const evidenceTray = [...selectedEvidence].filter((id) => evidenceById.has(id)).map((id) => {
      const record = evidenceById.get(id);
      return `<li><span>${e(record.kind)} · ${e(record.label || record.id)} <code>${e(record.id)}</code></span>
        <button type="button" data-m07-evidence-toggle="${e(record.id)}" aria-pressed="true">Remove</button></li>`;
    }).join('');
    const incidents = Array.isArray(state?.incidentLinks) ? state.incidentLinks : [];
    const incidentOptions = incidents.map((item) => `<option value="${e(item.incidentId)}">${e(item.incidentId)} · ${e(item.title || 'Incident')}</option>`).join('');
    const incidentRows = incidents.map((item) => `<article data-m07-incident="${e(item.incidentId)}"><h5>${e(item.title || 'Incident')}</h5>
      <p>${e(item.incidentId)} · Assessment: ${e(item.assessment || 'unknown')}</p><p>${e(item.summary || '')}</p>
      <p>Recipients: ${e((item.recipientIds || []).join(', ') || 'None')} · Devices: ${e((item.deviceIds || []).join(', ') || 'None')}</p>
      <p>Evidence-linked records: ${(item.eventIds || []).length}</p></article>`).join('');
    const incidentEvidence = evidenceRecords.map((record) => `<label><input type="checkbox" name="eventIds" value="${e(record.id)}"> ${e(record.kind)} · ${e(record.label)} (${e(record.id)})</label>`).join('');
    const recipientOptions = [...new Set(scenario.recipientGroups.flatMap((group) => group.recipientIds))]
      .map((id) => `<label><input type="checkbox" name="recipientIds" value="${e(id)}"> ${e(id)}</label>`).join('');
    const deviceOptions = [...new Set(scenario.recipientGroups.flatMap((group) => group.deviceIds))]
      .map((id) => `<label><input type="checkbox" name="deviceIds" value="${e(id)}"> ${e(id)}</label>`).join('');
    const queue = messages.map((message) => {
      const isReviewed = reviewed.has(message.id);
      const authentication = message.authentication || {};
      const rawHeaders = [
        ['From', `${message.from?.displayName || ''} <${message.from?.address || ''}>`],
        ['Reply-To', message.replyTo],
        ['Return-Path', `<${message.returnPath || ''}>`],
        ['Message-ID', message.headerMessageId],
        ['Received', message.receivedAt],
      ];
      const reviewArtifact = (artifactId, label) => `<button type="button" data-m07-review-artifact="${e(artifactId)}" aria-pressed="${reviewedArtifacts.has(artifactId) ? 'true' : 'false'}">${reviewedArtifacts.has(artifactId) ? 'Mark unreviewed' : 'Mark reviewed'} ${e(label)}</button>`;
      const selectEvidence = (id, label) => `<button type="button" data-m07-evidence-toggle="${e(id)}" aria-pressed="${selectedEvidence.has(id) ? 'true' : 'false'}">${selectedEvidence.has(id) ? 'Remove from evidence' : 'Add to evidence'}: ${e(label)}</button>`;
      const urls = (message.urls || []).map((url) => `<section class="m07-assessment-url" data-m07-url-id="${e(url.id)}">
        <h5>URL inspection</h5><p>Original target: <code>${e(url.original)}</code></p>${reviewArtifact(url.id, 'URL')} ${selectEvidence(url.id, 'URL')}
        <ol>${(url.redirects || []).map((redirect) => `<li data-m07-redirect-id="${e(redirect.id)}"><span>HTTP ${e(redirect.status)}</span> <code>${e(redirect.url)}</code> ${reviewArtifact(redirect.id, 'redirect')} ${selectEvidence(redirect.id, 'redirect')}</li>`).join('')}</ol>
      </section>`).join('');
      const attachments = (message.attachments || []).map((attachment) => `<li data-m07-attachment-id="${e(attachment.id)}">
        <dl><div><dt>File name</dt><dd>${e(attachment.fileName)}</dd></div><div><dt>Media type</dt><dd>${e(attachment.mediaType)}</dd></div>
        <div><dt>Size</dt><dd>${e(attachment.sizeBytes)} bytes</dd></div><div><dt>SHA-256</dt><dd><code>${e(attachment.sha256)}</code></dd></div></dl>
        <p>Metadata only; this assessment does not open or execute the file.</p>${reviewArtifact(attachment.id, 'attachment')} ${selectEvidence(attachment.id, 'attachment')}</li>`).join('');
      return `<article class="m07-assessment-message" data-m07-message-id="${e(message.id)}">
        <header><div><h4>${e(message.subject)}</h4><p>${e(message.from?.displayName)} &lt;${e(message.from?.address)}&gt;</p></div>
          <div><button type="button" data-m07-review-message="${e(message.id)}" aria-pressed="${isReviewed ? 'true' : 'false'}">${isReviewed ? 'Mark unreviewed' : 'Mark reviewed'}</button> ${selectEvidence(message.id, 'message')}</div></header>
        <p class="m07-assessment-message-meta">Received ${e(message.receivedAt)} · ${isReviewed ? 'Reviewed' : 'Not reviewed'}</p>
        <details><summary>Raw headers and authentication</summary>
          <dl class="m07-assessment-headers">${rawHeaders.map(([name, value]) => `<div><dt>${e(name)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
          <dl class="m07-assessment-auth" aria-label="Email authentication results">
            <div><dt>SPF</dt><dd>${e(authentication.spf || 'unknown')}</dd></div>
            <div><dt>DKIM</dt><dd>${e(authentication.dkim || 'unknown')}</dd></div>
            <div><dt>DMARC</dt><dd>${e(authentication.dmarc || 'unknown')}</dd></div>
            <div><dt>Domain alignment</dt><dd>${authentication.aligned === true ? 'Aligned' : authentication.aligned === false ? 'Not aligned' : 'Unknown'}</dd></div>
          </dl>
        </details>
        <details><summary>URL redirects and attachments</summary>
          ${urls || '<p>No URLs in this message.</p>'}
          <h5>Attachment metadata</h5><ul>${attachments || '<li>No attachments in this message.</li>'}</ul>
        </details>
      </article>`;
    }).join('');
    return `<section class="m07-assessment-email" aria-label="Independent email assessment" data-m07-assessment-email>
      <h3>Message queue</h3><p>Independent synthetic message review</p>
      ${queue || '<p role="status">No messages in this fixture.</p>'}
      <section class="m07-assessment-delivery" aria-labelledby="m07-delivery-title">
        <h4 id="m07-delivery-title">Delivery trace and recipient scope</h4>
        <form data-m07-recipient-search>
          <label>Search recipient or device <input name="query" type="search" maxlength="100" value="${e(filters.query)}"></label>
          <label>Delivery <select name="delivery"><option value="all" ${filters.delivery === 'all' ? 'selected' : ''}>All outcomes</option><option value="delivered" ${filters.delivery === 'delivered' ? 'selected' : ''}>Delivered</option><option value="blocked_at_gateway" ${filters.delivery === 'blocked_at_gateway' ? 'selected' : ''}>Gateway blocked</option></select></label>
          <label>Interaction <select name="interaction"><option value="all" ${filters.interaction === 'all' ? 'selected' : ''}>All interaction states</option><option value="opened" ${filters.interaction === 'opened' ? 'selected' : ''}>Opened</option><option value="clicked" ${filters.interaction === 'clicked' ? 'selected' : ''}>Link clicked</option><option value="no_interaction" ${filters.interaction === 'no_interaction' ? 'selected' : ''}>No interaction recorded</option></select></label>
          <label>Maximum results <input name="limit" type="number" min="1" max="100" step="1" value="${e(filters.limit)}"></label>
          <button type="submit">Apply filters</button>
        </form>
        <p role="status">Showing ${traceRows.length} recipient${traceRows.length === 1 ? '' : 's'} from fixture delivery events.</p>
        <div class="m07-assessment-trace-scroll"><table><thead><tr><th>Recipient</th><th>Delivery</th><th>Device</th><th>Open</th><th>Link click</th><th>Trace time</th><th>Scope</th><th>Evidence</th></tr></thead>
          <tbody>${trace || '<tr><td colspan="8">No recipients match these filters.</td></tr>'}</tbody></table></div>
      </section>
      <section aria-label="Selected evidence" data-m07-evidence-tray><h4>Evidence tray</h4><ul>${evidenceTray || '<li>No evidence selected.</li>'}</ul></section>
      <section aria-label="Incident records" data-m07-incident-workflow><h4>Incident record</h4>
        <p>Assessment status reflects your current analysis. Records not established by linked evidence remain unknown.</p>
        ${incidentRows || '<p>No incident records created.</p>'}
        <form data-m07-incident-form>
          <label>Action <select name="operation"><option value="create">Create incident</option><option value="update" ${incidents.length ? '' : 'disabled'}>Update incident</option></select></label>
          <label>Incident to update <select name="incidentId"><option value="">New incident</option>${incidentOptions}</select></label>
          <label>Title <input name="title" maxlength="120" required></label>
          <label>Assessment status <select name="assessment"><option value="unknown">Unknown / needs investigation</option><option value="supported">Supported by linked evidence</option></select></label>
          <label>Analyst summary <textarea name="summary" maxlength="1000" required></textarea></label>
          <fieldset><legend>Recipient scope</legend>${recipientOptions || '<p>No recipients in fixture</p>'}</fieldset>
          <fieldset><legend>Device scope</legend>${deviceOptions || '<p>No devices in fixture</p>'}</fieldset>
          <fieldset><legend>Link fixture evidence</legend>${incidentEvidence || '<p>No evidence records in fixture</p>'}</fieldset>
          <button type="submit">Save incident</button><p data-m07-incident-status role="status" aria-live="polite"></p>
        </form>
      </section>
    </section>`;
  }

  return Object.freeze({ render, escapeHtml });
})();

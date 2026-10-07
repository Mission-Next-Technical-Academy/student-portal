/* Learner-facing findings queue for the independent Module 08 assessment. */
const SocM08AssessmentUi = (() => {
  'use strict';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
  }

  function render(fixture, state, selectedId, filters = {}) {
    const scenario = fixture.scenario;
    const filterValues = {
      search: String(filters.search || '').trim().toLowerCase(),
      freshness: filters.freshness || 'all',
      applicability: filters.applicability || 'all',
      assetId: filters.assetId || 'all',
      priorityTier: filters.priorityTier || 'all',
      controlStatus: filters.controlStatus || 'all',
    };
    const assets = new Map(scenario.assetInventory.map((asset) => [asset.assetId, asset]));
    const allFindings = scenario.findings;
    const findings = allFindings.filter((finding) => {
      const asset = assets.get(finding.assetId);
      const controls = (asset?.compensatingControls || []).map((control) => control.status);
      const haystack = [finding.product, finding.assetId, finding.id, finding.cve,
        finding.freshness.status, finding.applicability.status, asset?.criticality.tier,
        asset?.criticality.rationale, asset?.reachability.zone, asset?.exposure.status,
        ...controls, ...(asset?.compensatingControls || []).map((control) => control.control)]
        .join(' ').toLowerCase();
      return (!filterValues.search || haystack.includes(filterValues.search))
        && (filterValues.freshness === 'all' || finding.freshness.status === filterValues.freshness)
        && (filterValues.applicability === 'all' || finding.applicability.status === filterValues.applicability)
        && (filterValues.assetId === 'all' || finding.assetId === filterValues.assetId)
        && (filterValues.priorityTier === 'all' || asset?.criticality.tier === filterValues.priorityTier)
        && (filterValues.controlStatus === 'all' || controls.includes(filterValues.controlStatus));
    });
    const selected = findings.find((finding) => finding.id === selectedId) || findings[0] || null;
    const selectedAsset = selected ? assets.get(selected.assetId) : null;
    const reviews = new Map((state.findingReviews || []).map((review) => [review.findingId, review]));
    const evidence = selected ? scenario.findingEvidence.filter((item) => item.findingId === selected.id) : [];
    const review = selected ? reviews.get(selected.id) : null;
    const linkedIncidents = selected ? (state.incidentLinks || []).filter((item) => item.findingId === selected.id) : [];
    const riskAcceptances = selected ? (state.riskAcceptances || []).filter((item) => item.findingId === selected.id) : [];
    const escalations = selected ? (state.escalations || []).filter((item) => item.findingId === selected.id) : [];
    const remediationHistory = selected ? (state.remediationDecisions || []).filter((item) => item.findingId === selected.id) : [];
    const currentRemediation = remediationHistory[remediationHistory.length - 1] || null;
    const remediationTransitions = selected ? (state.remediationTransitions || []).filter((item) => item.findingId === selected.id) : [];
    const incidents = selected ? scenario.incidents.filter((incident) => incident.findingIds.includes(selected.id)) : [];
    const acceptanceDisposition = selected
      ? (scenario.riskAcceptanceDispositions || []).find((item) => item.findingId === selected.id && item.status === 'explicitly-supported')
      : null;
    const assetContext = scenario.assetInventory.map((asset) => {
      const assetEvidence = scenario.assetEvidence.filter((item) => item.assetId === asset.assetId);
      const evidenceList = (ids) => ids.map((id) => {
        const item = assetEvidence.find((candidate) => candidate.id === id);
        return item ? `<li><strong>${esc(item.kind)}</strong> · <code>${esc(item.id)}</code> · ${esc(item.source)} · ${esc(item.observedAt)}<p>${esc(item.detail)}</p></li>` : '';
      }).join('');
      return `<article class="m08-assessment-asset" aria-labelledby="m08-asset-${esc(asset.id)}">
        <header><div><h4 id="m08-asset-${esc(asset.id)}">${esc(asset.assetId)} · ${esc(asset.function)}</h4><p>${esc(asset.hostname)} · ${esc(asset.environment)} · owner ${esc(asset.ownerId)}</p></div><strong>${esc(asset.criticality.tier)} criticality</strong></header>
        <dl>
          <div><dt>Business impact</dt><dd>${esc(asset.criticality.rationale)}<ul>${evidenceList(asset.criticality.evidenceIds)}</ul></dd></div>
          <div><dt>Reachability</dt><dd>${esc(asset.reachability.zone)} · from ${asset.reachability.reachableFrom.map(esc).join(', ')}<ul>${evidenceList(asset.reachability.evidenceIds)}</ul></dd></div>
          <div><dt>Exposure</dt><dd>${esc(asset.exposure.status)} · ${asset.exposure.services.map(esc).join(', ')}<ul>${evidenceList(asset.exposure.evidenceIds)}</ul></dd></div>
          <div><dt>Compensating controls</dt><dd><ul>${asset.compensatingControls.map((control) => `<li>${esc(control.control)} · ${esc(control.status)}<ul>${evidenceList(control.evidenceIds)}</ul></li>`).join('')}</ul></dd></div>
        </dl>
      </article>`;
    }).join('');
    return `<section class="m08-assessment-findings" aria-labelledby="m08-assessment-findings-title">
      <header><div><p class="m08-kicker">Vulnerability management workspace</p><h3 id="m08-assessment-findings-title">Findings queue</h3></div><span>${findings.length} of ${allFindings.length} findings</span></header>
      <form class="m08-assessment-filters" aria-label="Filter findings">
        <label>Search remediation context<input type="search" name="search" value="${esc(filters.search || '')}" placeholder="Asset, control, exposure, finding"></label>
        <label>Freshness<select name="freshness"><option value="all" ${filterValues.freshness === 'all' ? 'selected' : ''}>Any</option><option value="current" ${filterValues.freshness === 'current' ? 'selected' : ''}>Current</option><option value="stale" ${filterValues.freshness === 'stale' ? 'selected' : ''}>Stale</option></select></label>
        <label>Applicability<select name="applicability"><option value="all" ${filterValues.applicability === 'all' ? 'selected' : ''}>Any</option><option value="confirmed" ${filterValues.applicability === 'confirmed' ? 'selected' : ''}>Confirmed</option><option value="unverified" ${filterValues.applicability === 'unverified' ? 'selected' : ''}>Unverified</option><option value="not-applicable" ${filterValues.applicability === 'not-applicable' ? 'selected' : ''}>Not applicable</option></select></label>
        <label>Asset<select name="assetId"><option value="all" ${filterValues.assetId === 'all' ? 'selected' : ''}>Any asset</option>${scenario.assetInventory.map((asset) => `<option value="${esc(asset.assetId)}" ${filterValues.assetId === asset.assetId ? 'selected' : ''}>${esc(asset.assetId)}</option>`).join('')}</select></label>
        <label>Asset priority context<select name="priorityTier"><option value="all" ${filterValues.priorityTier === 'all' ? 'selected' : ''}>Any tier</option>${[...new Set(scenario.assetInventory.map((asset) => asset.criticality.tier))].map((tier) => `<option value="${esc(tier)}" ${filterValues.priorityTier === tier ? 'selected' : ''}>${esc(tier)}</option>`).join('')}</select></label>
        <label>Control status<select name="controlStatus"><option value="all" ${filterValues.controlStatus === 'all' ? 'selected' : ''}>Any</option>${[...new Set(scenario.assetInventory.flatMap((asset) => asset.compensatingControls.map((control) => control.status)))].map((status) => `<option value="${esc(status)}" ${filterValues.controlStatus === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select></label>
      </form>
      <div class="m08-assessment-finding-layout">
        <div class="m08-assessment-finding-list" aria-label="Assessment findings">
          ${findings.length ? '' : '<p role="status">No findings match these filters.</p>'}
          ${findings.map((finding) => {
            const currentReview = reviews.get(finding.id);
            return `<button type="button" data-m08-assessment-select="${esc(finding.id)}" aria-current="${finding.id === selected?.id ? 'true' : 'false'}">
              <span><strong>${esc(finding.product)}</strong><small>${esc(finding.assetId)} · ${esc(finding.id)}</small></span>
              <span class="m08-assessment-review-state">${esc(currentReview?.status || 'Not reviewed')}</span>
            </button>`;
          }).join('')}
        </div>
        ${selected ? `<article class="m08-assessment-finding-detail" aria-labelledby="m08-assessment-selected-title">
          <div class="m08-assessment-finding-heading"><div><p class="m08-kicker">${esc(selected.assetId)} · ${esc(selected.scanner)}</p><h4 id="m08-assessment-selected-title">${esc(selected.product)}</h4></div><code>${esc(selected.id)}</code></div>
          <dl>
            <div><dt>CVE</dt><dd>${esc(selected.cve)}</dd></div>
            <div><dt>CVSS ${esc(selected.cvss.version)} base score</dt><dd>${esc(selected.cvss.baseScore)} <small>${esc(selected.cvss.source)}</small></dd></div>
            <div><dt>Observed</dt><dd>${esc(selected.observedAt)}</dd></div>
            <div><dt>Freshness</dt><dd>${esc(selected.freshness.status)} · scan ${esc(selected.freshness.scanAt)}</dd></div>
            <div><dt>Applicability</dt><dd>${esc(selected.applicability.status)}</dd></div>
            <div><dt>Asset criticality</dt><dd>${esc(selectedAsset.criticality.tier)} · ${esc(selectedAsset.criticality.rationale)}</dd></div>
            <div><dt>Reachability and exposure</dt><dd>${esc(selectedAsset.reachability.zone)} · ${esc(selectedAsset.exposure.status)} (${selectedAsset.exposure.services.map(esc).join(', ')})</dd></div>
            <div><dt>Remediation-relevant controls</dt><dd>${selectedAsset.compensatingControls.map((control) => `${esc(control.control)} · ${esc(control.status)}`).join('; ')}</dd></div>
          </dl>
          <p class="m08-assessment-priority-note">CVSS severity is one input alongside finding validation, asset criticality, exposure, reachability, and control effectiveness.</p>
          <section class="m08-assessment-evidence" aria-label="Finding evidence"><h5>Evidence</h5>
            ${evidence.map((item) => `<article><strong>${esc(item.kind)}</strong><span>${esc(item.source)} · ${esc(item.observedAt)}</span><p>${esc(item.detail)}</p></article>`).join('')}
          </section>
          <form data-m08-assessment-review="${esc(selected.id)}">
            <h5>Review finding</h5>
            <label>Status<select name="status"><option value="reviewed" ${review?.status === 'reviewed' ? 'selected' : ''}>Reviewed</option><option value="needs-validation" ${review?.status === 'needs-validation' ? 'selected' : ''}>Needs validation</option><option value="not-applicable" ${review?.status === 'not-applicable' ? 'selected' : ''}>Not applicable</option></select></label>
            <fieldset><legend>Cited evidence</legend>${evidence.map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}" ${(review?.evidenceIds || []).includes(item.id) ? 'checked' : ''}> ${esc(item.kind)} · ${esc(item.id)}</label>`).join('')}</fieldset>
            <label>Review notes<textarea name="notes" maxlength="1000">${esc(review?.notes || '')}</textarea></label>
            <button type="submit">Save review</button><span role="status" aria-live="polite" data-m08-review-status></span>
          </form>
          <section class="m08-assessment-followups" aria-label="Incident linkage and risk disposition">
            <h5>Remediation status</h5>
            ${currentRemediation ? `<p>Current status: <strong>${esc(currentRemediation.status)}</strong> · Priority ${esc(currentRemediation.priority)} · owner ${esc(currentRemediation.ownerId)} · due ${esc(currentRemediation.dueDate)}</p>
              <p>Decision: ${esc(currentRemediation.rationale)} · Evidence: ${currentRemediation.evidenceIds.map(esc).join(', ')}</p>
              ${remediationTransitions.map((item) => `<p>Transition ${esc(item.fromStatus)} → ${esc(item.toStatus)} · ${esc(item.timestamp)}: ${esc(item.transitionRationale)}</p>`).join('')}
              ${((typeof SocM08AssessmentActions !== 'undefined' && SocM08AssessmentActions.ALLOWED_TRANSITIONS[currentRemediation.status]) || []).length ? `<form data-m08-assessment-remediation-transition="${esc(selected.id)}">
                <label>New status<select name="toStatus" required>${SocM08AssessmentActions.ALLOWED_TRANSITIONS[currentRemediation.status].map((status) => `<option value="${esc(status)}">${esc(status)}</option>`).join('')}</select></label>
                <label>Transition rationale<textarea name="transitionRationale" minlength="10" maxlength="1000" required></textarea></label>
                <button type="submit">Update status</button><span role="status" aria-live="polite" data-m08-transition-status></span>
              </form>` : '<p>This decision is closed; reopen it only when new evidence justifies a new review.</p>'}` : `<form data-m08-assessment-remediation-decision="${esc(selected.id)}">
              <label>Priority<select name="priority" required><option>critical</option><option>high</option><option>medium</option><option>low</option></select></label>
              <label>Status<select name="status" required>${SocM08AssessmentActions.REMEDIATION_STATUSES.map((status) => `<option value="${esc(status)}">${esc(status)}</option>`).join('')}</select></label>
              <label>Eligible owner<select name="ownerId" required>${[...new Map(scenario.assetInventory.map((asset) => [asset.ownerId, asset])).values()].map((asset) => `<option value="${esc(asset.ownerId)}" ${asset.ownerId === selectedAsset.ownerId ? 'selected' : ''}>${esc(asset.ownerId)} · ${esc(asset.assetId)}</option>`).join('')}</select></label>
              <label>Due date<input type="date" name="dueDate" min="${esc(scenario.fixedAt.slice(0, 10))}" required></label>
              <label>Decision rationale<textarea name="rationale" minlength="10" maxlength="1000" required></textarea></label>
              <fieldset><legend>Decision evidence</legend>${[...evidence, ...scenario.assetEvidence.filter((item) => item.assetId === selected.assetId)].map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}"> ${esc(item.kind)} · ${esc(item.id)}</label>`).join('')}</fieldset>
              <button type="submit">Save remediation decision</button><span role="status" aria-live="polite" data-m08-decision-status></span>
            </form>`}
            <h5>Incident linkage</h5>
            ${linkedIncidents.map((link) => `<p>Linked to <strong>${esc(link.incidentId)}</strong>: ${esc(link.rationale)}</p>`).join('')}
            ${incidents.length ? incidents.map((incident) => {
              const incidentEvidence = (scenario.incidentEvidence || []).filter((item) => item.incidentId === incident.id && item.findingId === selected.id);
              const alreadyLinked = linkedIncidents.some((link) => link.incidentId === incident.id);
              return `<form data-m08-assessment-incident-link="${esc(selected.id)}" data-m08-incident-id="${esc(incident.id)}">
                <p><strong>${esc(incident.id)}</strong> · ${esc(incident.title)}</p>
                <p>${incidentEvidence.map((item) => `${esc(item.kind)} · ${esc(item.id)} · ${esc(item.detail)}`).join('<br>')}</p>
                ${alreadyLinked ? '<span>Already linked</span>' : `<fieldset><legend>Incident evidence</legend>${incidentEvidence.map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}"> ${esc(item.id)}</label>`).join('')}</fieldset>
                  <label>Link rationale<textarea name="rationale" maxlength="500" required></textarea></label><button type="submit">Link incident</button><span role="status" aria-live="polite" data-m08-incident-status></span>`}
              </form>`;
            }).join('') : '<p>No fixture incident is linked to this finding.</p>'}
            <h5>Risk disposition</h5>
            ${riskAcceptances.map((item) => `<p>Accepted risk recorded with evidence ${item.evidenceIds.map(esc).join(', ')}: ${esc(item.rationale)}</p>`).join('')}
            ${acceptanceDisposition ? `<p>Fixture disposition support: ${(scenario.riskAcceptanceEvidence || []).filter((item) => item.dispositionId === acceptanceDisposition.id).map((item) => `${esc(item.kind)} · ${esc(item.id)} · ${esc(item.detail)}`).join('<br>')}</p>
              <form data-m08-assessment-risk-acceptance="${esc(selected.id)}" data-m08-disposition-id="${esc(acceptanceDisposition.id)}">
                <label>Acceptance rationale<textarea name="rationale" minlength="10" maxlength="500" required></textarea></label>
                <fieldset><legend>Disposition evidence</legend>${(scenario.riskAcceptanceEvidence || []).filter((item) => item.dispositionId === acceptanceDisposition.id).map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}"> ${esc(item.id)} · ${esc(item.kind)}</label>`).join('')}</fieldset>
                <button type="submit">Record risk acceptance</button><span role="status" aria-live="polite" data-m08-risk-status></span>
              </form>` : '<p>No explicit risk-acceptance disposition is supported for this finding.</p>'}
            <h5>Escalation</h5>
            ${escalations.map((item) => `<p>${esc(item.routeId)} · owner ${esc(item.ownerId)} · due ${esc(item.dueDate)}: ${esc(item.rationale)} <small>Evidence: ${item.evidenceIds.map(esc).join(', ')}</small></p>`).join('')}
            <form data-m08-assessment-escalation="${esc(selected.id)}">
              <label>Escalation route<select name="routeId" required>${(scenario.escalationRoutes || []).map((route) => `<option value="${esc(route.id)}">${esc(route.label)}</option>`).join('')}</select></label>
              <label>Eligible owner<select name="ownerId" required>${[...new Map(scenario.assetInventory.map((asset) => [asset.ownerId, asset])).values()].map((asset) => `<option value="${esc(asset.ownerId)}" ${asset.ownerId === selectedAsset.ownerId ? 'selected' : ''}>${esc(asset.ownerId)} · ${esc(asset.assetId)}</option>`).join('')}</select></label>
              <label>Due date<input type="date" name="dueDate" min="${esc(scenario.fixedAt.slice(0, 10))}" required></label>
              <label>Escalation rationale<textarea name="rationale" minlength="10" maxlength="500" required></textarea></label>
              <fieldset><legend>Supporting evidence</legend>${[...evidence, ...scenario.assetEvidence.filter((item) => item.assetId === selected.assetId)].map((item) => `<label><input type="checkbox" name="evidenceIds" value="${esc(item.id)}"> ${esc(item.kind)} · ${esc(item.id)}</label>`).join('')}</fieldset>
              <button type="submit">Record escalation</button><span role="status" aria-live="polite" data-m08-escalation-status></span>
            </form>
          </section>
        </article>` : '<article class="m08-assessment-finding-detail"><p>Select filters that match at least one finding.</p></article>'}
      </div>
      <section class="m08-assessment-asset-context" aria-labelledby="m08-assessment-asset-context-title">
        <header><div><p class="m08-kicker">Local asset evidence</p><h3 id="m08-assessment-asset-context-title">Comparative asset context</h3></div></header>
        <p>CVSS describes vulnerability severity; it is one input. Validate freshness and applicability, then weigh business impact, reachability, exposure, and the verified limits of controls.</p>
        <div class="m08-assessment-asset-grid">${assetContext}</div>
      </section>
    </section>`;
  }

  return Object.freeze({ render });
})();

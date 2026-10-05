/* Seed-lead review and hypothesis editor for the independent Module 06 lab. */
const SocM06AssessmentSeedUi = (() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function hypothesisFrom(state, leadId) {
    const hypotheses = Array.isArray(state?.hypotheses) ? state.hypotheses : [];
    return hypotheses.find((item) => item && typeof item === 'object' && !Array.isArray(item) && item.seedLeadId === leadId) || {};
  }

  function render(fixture, state, options = {}) {
    const scenario = fixture?.scenario;
    const lead = scenario?.seedLead;
    if (!lead || !Array.isArray(scenario.scope?.devices)) {
      return '<section class="m06-seed-review" aria-label="Seed lead review"><p role="status">Seed lead is unavailable.</p></section>';
    }

    const e = escapeHtml;
    const hypothesis = hypothesisFrom(state, lead.id);
    const devices = scenario.scope.devices.slice(0, 5);
    const start = String(scenario.scope.timeStart || '').slice(0, 20);
    const end = String(scenario.scope.timeEnd || '').slice(0, 20);
    const confidence = ['low', 'medium', 'high'].includes(hypothesis.confidence) ? hypothesis.confidence : 'medium';

    return `<section class="m06-seed-review" aria-label="Seed lead review" data-m06-seed-lead="${e(lead.id)}">
      <header class="m06-panel-header"><div><span class="m06-step">01 · Frame the lead</span><h3>Seed lead review</h3></div><span class="m06-status-badge">Unverified</span></header>
      <dl class="m06-lead-facts"><div class="m06-lead-observation"><dt>Observation</dt><dd>${e(lead.observation)}</dd></div><div><dt>Lead type</dt><dd>${e(lead.type)}</dd></div><div><dt>Device</dt><dd>${e(lead.device)}</dd></div><div><dt>Account</dt><dd>${e(lead.account)}</dd></div><div><dt>${e(lead.artifactLabel || 'Artifact')}</dt><dd>${e(lead.artifact || lead.taskName || 'Not recorded')}</dd></div></dl>
      <div class="m06-scope-strip"><p><span>Hunt scope</span><strong>${devices.map(e).join(', ')}</strong></p><p><span>UTC window</span><strong>${e(start)} to ${e(end)}</strong></p></div>
      <form data-m06-hypothesis-form data-seed-lead-id="${e(lead.id)}">
        <label for="m06-hypothesis"><span>Working hypothesis</span><textarea id="m06-hypothesis" name="text" data-m06-hypothesis-text maxlength="2000">${e(hypothesis.text)}</textarea></label>
        <label for="m06-hypothesis-rationale"><span>Rationale</span><textarea id="m06-hypothesis-rationale" name="rationale" data-m06-hypothesis-rationale maxlength="2000">${e(hypothesis.rationale)}</textarea></label>
        <label for="m06-hypothesis-confidence" class="m06-confidence-field"><span>Confidence</span><select id="m06-hypothesis-confidence" name="confidence" data-m06-hypothesis-confidence>
          <option value="low"${confidence === 'low' ? ' selected' : ''}>Low</option>
          <option value="medium"${confidence === 'medium' ? ' selected' : ''}>Medium</option>
          <option value="high"${confidence === 'high' ? ' selected' : ''}>High</option>
        </select></label>
        ${options.formExtraHtml || ''}
      </form>
    </section>`;
  }

  return Object.freeze({ render, escapeHtml });
})();

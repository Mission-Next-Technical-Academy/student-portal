/* Seed-lead review and hypothesis editor for the independent Module 06 lab. */
const SocM06AssessmentSeedUi = (() => {
  'use strict';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);

  function hypothesisFrom(state) {
    const hypotheses = Array.isArray(state?.hypotheses) ? state.hypotheses : [];
    return hypotheses.find((item) => item && typeof item === 'object' && !Array.isArray(item) && item.seedLeadId === 'M06-LEAD-001') || {};
  }

  function render(fixture, state, options = {}) {
    const scenario = fixture?.scenario;
    const lead = scenario?.seedLead;
    if (!lead || !Array.isArray(scenario.scope?.devices)) {
      return '<section class="m06-seed-review" aria-label="Seed lead review"><p role="status">Seed lead is unavailable.</p></section>';
    }

    const e = escapeHtml;
    const hypothesis = hypothesisFrom(state);
    const devices = scenario.scope.devices.slice(0, 5);
    const start = String(scenario.scope.timeStart || '').slice(0, 20);
    const end = String(scenario.scope.timeEnd || '').slice(0, 20);
    const confidence = ['low', 'medium', 'high'].includes(hypothesis.confidence) ? hypothesis.confidence : 'medium';

    return `<section class="m06-seed-review" aria-label="Seed lead review" data-m06-seed-lead="${e(lead.id)}">
      <h3>Seed lead review</h3>
      <p><strong>Lead status:</strong> Unverified</p>
      <dl><dt>Observation</dt><dd>${e(lead.observation)}</dd><dt>Lead type</dt><dd>${e(lead.type)}</dd><dt>Device</dt><dd>${e(lead.device)}</dd><dt>Account</dt><dd>${e(lead.account)}</dd><dt>Task</dt><dd>${e(lead.taskName)}</dd></dl>
      <p><strong>Hunt scope:</strong> ${devices.map(e).join(', ')}</p>
      <p><strong>UTC window:</strong> ${e(start)} to ${e(end)}</p>
      <form data-m06-hypothesis-form data-seed-lead-id="${e(lead.id)}">
        <label for="m06-hypothesis">Working hypothesis</label>
        <textarea id="m06-hypothesis" name="text" data-m06-hypothesis-text maxlength="2000">${e(hypothesis.text)}</textarea>
        <label for="m06-hypothesis-rationale">Rationale</label>
        <textarea id="m06-hypothesis-rationale" name="rationale" data-m06-hypothesis-rationale maxlength="2000">${e(hypothesis.rationale)}</textarea>
        <label for="m06-hypothesis-confidence">Confidence</label>
        <select id="m06-hypothesis-confidence" name="confidence" data-m06-hypothesis-confidence>
          <option value="low"${confidence === 'low' ? ' selected' : ''}>Low</option>
          <option value="medium"${confidence === 'medium' ? ' selected' : ''}>Medium</option>
          <option value="high"${confidence === 'high' ? ' selected' : ''}>High</option>
        </select>
        ${options.formExtraHtml || ''}
      </form>
    </section>`;
  }

  return Object.freeze({ render, escapeHtml });
})();

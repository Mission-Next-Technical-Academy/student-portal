(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const TRACK_LABELS = { SOCAN: 'SOC Analyst', HDESK: 'IT Help Desk', AIENG: 'AI / ML', ELECT: 'Electrical' };
  const baselineIds = [
    'targetDirection','profileStatus','resumeStatus','networkingComfort','networkingNote',
    'interviewReadiness','interviewNote','evidenceSource','supportNeed'
  ];
  const requiredBaselineIds = [
    'targetDirection','profileStatus','resumeStatus','networkingComfort',
    'interviewReadiness','evidenceSource','supportNeed'
  ];
  const requiredLabels = {
    targetDirection: 'Tell us the direction, role family, field, or exploratory path you are considering.',
    profileStatus: 'Choose the option that best describes your professional profile today.',
    resumeStatus: 'Choose the option that best describes your resume today.',
    networkingComfort: 'Choose your current networking comfort level.',
    interviewReadiness: 'Choose your current interview-readiness level.',
    evidenceSource: 'Choose where your strongest examples or proof come from today.',
    supportNeed: 'Tell us which area of support would make the biggest difference over the next six weeks.'
  };
  const requiredSummaryLabels = {
    targetDirection: 'Current direction',
    profileStatus: 'Professional profile status',
    resumeStatus: 'Current resume status',
    networkingComfort: 'Networking comfort level',
    interviewReadiness: 'Interview readiness level',
    evidenceSource: 'Strongest proof source',
    supportNeed: 'Top support priority'
  };
  const techIds = ['techLms','techLive','techFiles','techFeedback'];
  const ackIds = ['ackUngraded','ackLiveAndLms','ackSixArtifacts','ackRevision','ackSpotlight','ackPortfolio'];
  let context = null;
  let completedAt = null;

  function value(id) { const el = $(id); return el ? String(el.value || '').trim() : ''; }
  function checked(id) { const el = $(id); return Boolean(el && el.checked); }

  function payloadFromForm() {
    const payload = {};
    baselineIds.forEach(id => { payload[id] = value(id); });
    payload.technicalTrack = context ? context.trackCode : '';
    techIds.forEach(id => { payload[id] = checked(id); });
    ackIds.forEach(id => { payload[id] = checked(id); });
    return payload;
  }

  function hydrate(payload) {
    const data = payload && typeof payload === 'object' ? payload : {};
    baselineIds.forEach(id => { if ($(id)) $(id).value = data[id] || ''; });
    techIds.forEach(id => { if ($(id)) $(id).checked = Boolean(data[id]); });
    ackIds.forEach(id => { if ($(id)) $(id).checked = Boolean(data[id]); });
    clearValidation();
  }

  function acknowledgmentsComplete() { return ackIds.every(checked); }
  function technologyReady() { return techIds.every(checked); }

  function supportFlag(payload) {
    const networking = Number(payload.networkingComfort || 0);
    const interview = Number(payload.interviewReadiness || 0);
    return Boolean(
      (networking > 0 && networking <= 2) ||
      (interview > 0 && interview <= 2) ||
      payload.profileStatus === 'privacy_support' ||
      payload.resumeStatus === 'support_needed'
    );
  }

  function clearFieldError(id) {
    const input = $(id);
    if (!input) return;
    input.removeAttribute('aria-invalid');
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('field-error-state');
    const error = field.querySelector(`[data-field-error="${id}"]`);
    if (error) error.remove();
  }

  function markFieldInvalid(id, message) {
    const input = $(id);
    if (!input) return null;
    const field = input.closest('.field');
    input.setAttribute('aria-invalid', 'true');
    if (field) {
      field.classList.add('field-error-state');
      let error = field.querySelector(`[data-field-error="${id}"]`);
      if (!error) {
        error = document.createElement('p');
        error.className = 'field-error';
        error.dataset.fieldError = id;
        field.appendChild(error);
      }
      error.textContent = message;
    }
    return input;
  }

  function clearGroupError(groupId, errorId) {
    const group = $(groupId);
    const error = $(errorId);
    if (group) group.classList.remove('validation-group-error');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  }

  function markGroupInvalid(groupId, errorId, message, ids) {
    const group = $(groupId);
    const error = $(errorId);
    if (group) group.classList.add('validation-group-error');
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    const firstUnchecked = ids.map($).find(input => input && !input.checked);
    if (firstUnchecked) firstUnchecked.setAttribute('aria-invalid', 'true');
    return firstUnchecked || group;
  }

  function clearValidation() {
    requiredBaselineIds.forEach(clearFieldError);
    techIds.forEach(id => { const input = $(id); if (input) input.removeAttribute('aria-invalid'); });
    ackIds.forEach(id => { const input = $(id); if (input) input.removeAttribute('aria-invalid'); });
    clearGroupError('technologyChecks', 'technologyError');
    clearGroupError('acknowledgmentChecks', 'acknowledgmentError');
  }

  function focusValidationTarget(item) {
    const target = $(item.focusId) || $(item.targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  function renderValidationSummary(items) {
    const el = $('startNotice');
    el.className = 'start-notice error validation-summary';
    el.replaceChildren();

    const heading = document.createElement('strong');
    heading.className = 'validation-summary-title';
    heading.textContent = `${items.length} item${items.length === 1 ? '' : 's'} need attention`;
    el.appendChild(heading);

    const intro = document.createElement('span');
    intro.className = 'validation-summary-intro';
    intro.textContent = 'Finish the highlighted items before completing Start Here:';
    el.appendChild(intro);

    const list = document.createElement('ul');
    list.className = 'validation-summary-list';
    items.forEach(item => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${item.targetId}`;
      link.textContent = item.label;
      link.addEventListener('click', event => {
        event.preventDefault();
        focusValidationTarget(item);
      });
      li.appendChild(link);
      list.appendChild(li);
    });
    el.appendChild(list);
  }

  function validateCompletion() {
    clearValidation();
    let firstInvalid = null;
    const missingItems = [];

    requiredBaselineIds.forEach(id => {
      if (value(id)) return;
      const invalid = markFieldInvalid(id, requiredLabels[id]);
      missingItems.push({ label: requiredSummaryLabels[id], targetId: id, focusId: id });
      if (!firstInvalid && invalid) firstInvalid = invalid;
    });

    if (!technologyReady()) {
      const invalid = markGroupInvalid(
        'technologyChecks',
        'technologyError',
        'Check each technology item. If something is not ready yet, contact Mission Next staff so we can help before Week 1.',
        techIds
      );
      const firstUnchecked = techIds.find(id => !checked(id));
      missingItems.push({ label: 'Technology check', targetId: 'technologyReadiness', focusId: firstUnchecked || 'technologyChecks' });
      if (!firstInvalid && invalid) firstInvalid = invalid;
    }

    if (!acknowledgmentsComplete()) {
      const invalid = markGroupInvalid(
        'acknowledgmentChecks',
        'acknowledgmentError',
        'Check each item so we know the M360 flow is clear before you start Week 1.',
        ackIds
      );
      const firstUnchecked = ackIds.find(id => !checked(id));
      missingItems.push({ label: 'Quick M360 check', targetId: 'acknowledgments', focusId: firstUnchecked || 'acknowledgmentChecks' });
      if (!firstInvalid && invalid) firstInvalid = invalid;
    }

    if (!firstInvalid) return true;

    renderValidationSummary(missingItems);
    requestAnimationFrame(() => {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof firstInvalid.focus === 'function') firstInvalid.focus({ preventScroll: true });
    });
    return false;
  }

  function notice(message, type = '') {
    const el = $('startNotice');
    el.textContent = message;
    el.className = `start-notice${type ? ' ' + type : ''}`;
  }

  function renderCompletion() {
    const complete = Boolean(completedAt);
    const wrap = document.querySelector('.start-actions');
    if (wrap) wrap.classList.toggle('complete', complete);
    $('completionTitle').textContent = complete ? 'Start Here complete — you are ready for Week 1.' : 'You are almost ready to roll.';
    $('completionText').textContent = complete
      ? `Completed ${new Date(completedAt).toLocaleString()}. Your baseline is saved and Week 1 is ready when you are.`
      : 'Save anytime. When the required fields, technology check, and quick acknowledgments are complete, finish Start Here and head to Week 1.';
    $('completeStartBtn').hidden = complete;
    $('week1Btn').hidden = !complete;
  }

  async function save(complete) {
    const payload = payloadFromForm();
    if (complete && !validateCompletion()) return;

    const saveBtn = complete ? $('completeStartBtn') : $('saveStartBtn');
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = complete ? 'Finishing…' : 'Saving…';
    try {
      const row = await M360Data.saveStartHere(payload, complete, acknowledgmentsComplete(), supportFlag(payload));
      completedAt = row && row.start_here_completed_at ? row.start_here_completed_at : completedAt;
      renderCompletion();
      if (complete) clearValidation();
      notice(complete
        ? 'Start Here is complete. Your baseline is saved and Week 1 is ready.'
        : 'Baseline saved. You can come back and finish Start Here anytime.', 'success');
      saveBtn.textContent = complete ? 'Completed' : 'Saved';
      setTimeout(() => { if (!saveBtn.hidden) saveBtn.textContent = original; }, 1200);
    } catch (error) {
      console.error('M360 Start Here save failed', error);
      notice(error.message || 'Unable to save Start Here. Try again before leaving this page.', 'error');
      saveBtn.textContent = original;
    } finally {
      saveBtn.disabled = false;
    }
  }

  function wireValidationClearing() {
    baselineIds.forEach(id => {
      const input = $(id);
      if (!input) return;
      const clearWhenValid = () => { if (value(id)) clearFieldError(id); };
      input.addEventListener('input', clearWhenValid);
      input.addEventListener('change', clearWhenValid);
    });
    techIds.forEach(id => {
      const input = $(id);
      if (!input) return;
      input.addEventListener('change', () => {
        input.removeAttribute('aria-invalid');
        if (technologyReady()) clearGroupError('technologyChecks', 'technologyError');
      });
    });
    ackIds.forEach(id => {
      const input = $(id);
      if (!input) return;
      input.addEventListener('change', () => {
        input.removeAttribute('aria-invalid');
        if (acknowledgmentsComplete()) clearGroupError('acknowledgmentChecks', 'acknowledgmentError');
      });
    });
  }

  async function init() {
    try {
      if (!window.M360Data) throw new Error('M360 data runtime unavailable.');
      context = await M360Data.getContext();
      if (!context.authenticated) { location.replace('../index.html#/login'); return; }
      if (context.isAdmin) { location.replace('review.html#startHereAdminTitle'); return; }
      if (!context.eligible) { location.replace('../index.html#/portal'); return; }
      if (!(await M360Data.schemaAvailable())) throw new Error('M360 production data migration is not available yet.');

      $('technicalTrack').textContent = TRACK_LABELS[context.trackCode] || context.trackCode || 'Track unavailable';
      const record = await M360Data.loadOwnCourseRecord();
      if (record) {
        hydrate(record.start_here_payload || {});
        completedAt = record.start_here_completed_at || null;
      }
      renderCompletion();
      notice(completedAt
        ? 'Your completed Start Here baseline is loaded and ready to revisit.'
        : 'Your Start Here baseline is connected to M360. Save as you go and finish it when you are ready for Week 1.', 'success');
    } catch (error) {
      console.error('M360 Start Here initialization failed', error);
      notice(error.message || 'Start Here could not load. Return to M360 Home and try again.', 'error');
      $('saveStartBtn').disabled = true;
      $('completeStartBtn').disabled = true;
    }
  }

  wireValidationClearing();
  $('saveStartBtn').addEventListener('click', () => save(false));
  $('completeStartBtn').addEventListener('click', () => save(true));
  init();
})();

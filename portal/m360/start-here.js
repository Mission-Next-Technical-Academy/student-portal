(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const TRACK_LABELS = { SOCAN: 'SOC Analyst', HDESK: 'IT Help Desk', AIENG: 'AI / ML' };
  const baselineIds = [
    'targetDirection','profileStatus','resumeStatus','networkingComfort','networkingNote',
    'interviewReadiness','interviewNote','evidenceSource','supportNeed'
  ];
  const requiredBaselineIds = [
    'targetDirection','profileStatus','resumeStatus','networkingComfort',
    'interviewReadiness','evidenceSource','supportNeed'
  ];
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

  function missingRequired() {
    const missing = requiredBaselineIds.filter(id => !value(id)).map(id => ({
      targetDirection: 'target direction', profileStatus: 'profile status', resumeStatus: 'resume status',
      networkingComfort: 'networking comfort level', interviewReadiness: 'interview readiness level',
      evidenceSource: 'strongest evidence source', supportNeed: 'top support need'
    }[id]));
    if (!technologyReady()) missing.push('all technology-readiness confirmations');
    if (!acknowledgmentsComplete()) missing.push('all M360 acknowledgments');
    return missing;
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
    $('completionTitle').textContent = complete ? 'Start Here Complete' : 'Orientation & Baseline not yet complete';
    $('completionText').textContent = complete
      ? `Completed ${new Date(completedAt).toLocaleString()}. Week 1 is your first instructional M360 module.`
      : 'Save anytime. Complete Start Here when the baseline, readiness checks, and acknowledgments are finished.';
    $('completeStartBtn').hidden = complete;
    $('week1Btn').hidden = !complete;
  }

  async function save(complete) {
    const payload = payloadFromForm();
    if (complete) {
      const missing = missingRequired();
      if (missing.length) {
        notice(`Complete before finishing Start Here: ${missing.join(', ')}.`, 'error');
        $('baseline').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    const saveBtn = complete ? $('completeStartBtn') : $('saveStartBtn');
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = complete ? 'Completing…' : 'Saving…';
    try {
      const row = await M360Data.saveStartHere(payload, complete, acknowledgmentsComplete(), supportFlag(payload));
      completedAt = row && row.start_here_completed_at ? row.start_here_completed_at : completedAt;
      renderCompletion();
      notice(complete
        ? 'Start Here is complete. Your baseline is saved and Week 1 is ready.'
        : 'Baseline saved to M360. Nothing here is graded or counted as instructional time.', 'success');
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
        ? 'Your completed Start Here baseline is loaded from the M360 institutional record.'
        : 'Your Start Here baseline is connected to the M360 institutional record. You can save and return before completing it.', 'success');
    } catch (error) {
      console.error('M360 Start Here initialization failed', error);
      notice(error.message || 'Start Here could not load. Return to M360 Home and try again.', 'error');
      $('saveStartBtn').disabled = true;
      $('completeStartBtn').disabled = true;
    }
  }

  $('saveStartBtn').addEventListener('click', () => save(false));
  $('completeStartBtn').addEventListener('click', () => save(true));
  init();
})();

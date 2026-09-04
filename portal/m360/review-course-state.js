(() => {
  'use strict';

  const ELIGIBLE = ['SOCAN','HDESK','AIENG'];
  const startRoster = document.getElementById('startHereRoster');
  const spotlightRoster = document.getElementById('spotlightRoster');
  const refreshStart = document.getElementById('refreshStartHereBtn');
  const refreshSpotlight = document.getElementById('refreshSpotlightBtn');
  const saveSpotlight = document.getElementById('saveSpotlightChangesBtn');
  const spotlightStatus = document.getElementById('spotlightSaveStatus');

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  const statusLabels = {
    not_completed: 'Not yet completed',
    presented_live: 'Presented live',
    approved_makeup_completed: 'Approved makeup completed',
    approved_exception_completed: 'Approved recording/link exception completed'
  };
  const profileStatusLabels = {
    ready: 'Profile exists — I use it now',
    needs_update: 'Profile exists — I want to strengthen it',
    no_profile: 'I do not have a profile yet',
    privacy_support: 'I prefer not to use a public profile / need an alternative'
  };
  const resumeStatusLabels = {
    ready: 'Ready',
    needs_update: 'Needs update',
    no_resume: 'No current resume',
    support_needed: 'Support needed'
  };

  function valueOrDash(value) {
    const text = String(value ?? '').trim();
    return text || '—';
  }

  function displayProfileStatus(value) { return profileStatusLabels[value] || valueOrDash(value); }
  function displayResumeStatus(value) { return resumeStatusLabels[value] || valueOrDash(value); }

  function supportReason(payload) {
    const p = payload && typeof payload === 'object' ? payload : {};
    const reasons = [];
    const networking = Number(p.networkingComfort || 0);
    const interview = Number(p.interviewReadiness || 0);
    if (networking > 0 && networking <= 2) reasons.push(`Networking ${networking}/5`);
    if (interview > 0 && interview <= 2) reasons.push(`Interview readiness ${interview}/5`);
    if (p.profileStatus === 'privacy_support') reasons.push('Professional-profile alternative requested');
    if (p.resumeStatus === 'support_needed') reasons.push('Resume support requested');
    return `Support follow-up suggested${reasons.length ? ` — ${reasons.join(' · ')}` : ''}`;
  }

  async function requireAdmin() {
    const context = await M360Data.getContext({ refresh: true });
    if (!context.authenticated) { location.replace('../index.html#/login'); return false; }
    if (!context.isAdmin) { location.replace('../index.html#/portal'); return false; }
    if (!(await M360Data.schemaAvailable({ refresh: true }))) throw new Error('M360 durable data is unavailable.');
    return true;
  }

  async function eligibleStudents() {
    const { data, error } = await mntSupabase
      .from('students')
      .select('user_id, student_id, track_code, is_enrolled, is_admin')
      .eq('is_enrolled', true)
      .eq('is_admin', false)
      .in('track_code', ELIGIBLE)
      .order('student_id', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function baselineDetails(payload) {
    const p = payload && typeof payload === 'object' ? payload : {};
    const rows = [
      ['Target direction', p.targetDirection],
      ['Profile status', displayProfileStatus(p.profileStatus)],
      ['Resume status', displayResumeStatus(p.resumeStatus)],
      ['Networking comfort', p.networkingComfort],
      ['Interview readiness', p.interviewReadiness],
      ['Evidence source', p.evidenceSource],
      ['Top support need', p.supportNeed],
      ['Networking note', p.networkingNote],
      ['Interview note', p.interviewNote]
    ];
    return rows.map(([label,value]) => `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(valueOrDash(value))}</span></div>`).join('');
  }

  async function loadStartHere() {
    startRoster.innerHTML = '<div class="empty-state">Loading Start Here baselines…</div>';
    try {
      if (!(await requireAdmin())) return;
      const students = await eligibleStudents();
      const ids = students.map(s => s.user_id).filter(Boolean);
      let records = [];
      if (ids.length) {
        const result = await mntSupabase
          .from('m360_course_records')
          .select('user_id, start_here_payload, start_here_completed_at, start_here_support_flag')
          .in('user_id', ids);
        if (result.error) throw result.error;
        records = result.data || [];
      }
      const byUser = Object.fromEntries(records.map(r => [r.user_id,r]));
      if (!students.length) {
        startRoster.innerHTML = '<div class="empty-state">No enrolled M360-eligible students were found.</div>';
        return;
      }

      startRoster.innerHTML = students.map(student => {
        const record = byUser[student.user_id] || null;
        const payload = record && record.start_here_payload || {};
        const complete = Boolean(record && record.start_here_completed_at);
        const support = Boolean(record && record.start_here_support_flag);
        const supportHeadline = support ? supportReason(payload) : valueOrDash(payload.supportNeed);
        const supportDetail = support ? `Top support need: ${valueOrDash(payload.supportNeed)}` : 'Top support need';
        return `<article class="course-state-card">
          <div class="course-state-student"><strong>${escapeHtml(student.student_id || student.user_id)}</strong><span>${escapeHtml(student.track_code)}</span></div>
          <div class="course-state-current ${complete ? 'complete' : ''}"><strong>${complete ? 'Start Here Complete' : 'Not complete'}</strong><span>${complete ? escapeHtml(new Date(record.start_here_completed_at).toLocaleString()) : 'Baseline still pending'}</span></div>
          <div class="course-state-current ${support ? 'support' : ''}"><strong>${escapeHtml(supportHeadline)}</strong><span>${escapeHtml(supportDetail)}${support ? ' · Early support signal' : ''}</span></div>
          <div class="course-state-current"><strong>Networking ${escapeHtml(valueOrDash(payload.networkingComfort))} / 5 · Interview ${escapeHtml(valueOrDash(payload.interviewReadiness))} / 5</strong><span>${complete ? '<span class="complete-pill">Baseline captured</span>' : 'Readiness baseline'}</span></div>
          <details class="baseline-detail"><summary>View baseline details</summary><div class="baseline-detail-grid">${baselineDetails(payload)}</div></details>
        </article>`;
      }).join('');
    } catch (error) {
      console.error('M360 Start Here admin load failed', error);
      startRoster.innerHTML = '<div class="empty-state">Unable to load Start Here baselines.</div>';
    }
  }

  function updateSpotlightSaveState() {
    const changed = spotlightRoster.querySelectorAll('[data-spotlight-user][data-changed="true"]').length;
    saveSpotlight.disabled = changed === 0;
    spotlightStatus.textContent = changed ? `${changed} changed` : '';
  }

  function wireSpotlightRows() {
    spotlightRoster.querySelectorAll('[data-spotlight-user]').forEach(card => {
      const select = card.querySelector('[data-spotlight-status]');
      const reference = card.querySelector('[data-spotlight-reference]');
      const mark = () => {
        const statusChanged = select.value !== select.dataset.initial;
        const refChanged = reference.value.trim() !== reference.dataset.initial;
        card.dataset.changed = String(statusChanged || refChanged);
        updateSpotlightSaveState();
      };
      select.addEventListener('change', mark);
      reference.addEventListener('input', mark);
    });
  }

  async function loadSpotlight() {
    spotlightRoster.innerHTML = '<div class="empty-state">Loading Career Spotlight presentation statuses…</div>';
    saveSpotlight.disabled = true;
    spotlightStatus.textContent = '';
    try {
      if (!(await requireAdmin())) return;
      const students = await eligibleStudents();
      const ids = students.map(s => s.user_id).filter(Boolean);
      let courseRecords = [], week6Records = [];
      if (ids.length) {
        const [courseResult, weekResult] = await Promise.all([
          mntSupabase.from('m360_course_records').select('user_id, career_spotlight_presentation_status, career_spotlight_presentation_reference, career_spotlight_presentation_verified_at').in('user_id', ids),
          mntSupabase.from('m360_week_records').select('user_id, review_status, accepted_artifact_payload').eq('week_number', 6).in('user_id', ids)
        ]);
        if (courseResult.error) throw courseResult.error;
        if (weekResult.error) throw weekResult.error;
        courseRecords = courseResult.data || [];
        week6Records = weekResult.data || [];
      }
      const courseByUser = Object.fromEntries(courseRecords.map(r => [r.user_id,r]));
      const weekByUser = Object.fromEntries(week6Records.map(r => [r.user_id,r]));
      if (!students.length) {
        spotlightRoster.innerHTML = '<div class="empty-state">No enrolled M360-eligible students were found.</div>';
        return;
      }

      spotlightRoster.innerHTML = students.map(student => {
        const record = courseByUser[student.user_id] || {};
        const week6 = weekByUser[student.user_id] || null;
        const status = record.career_spotlight_presentation_status || 'not_completed';
        const reference = record.career_spotlight_presentation_reference || '';
        const assignment = week6 && week6.accepted_artifact_payload ? 'Week 6 · Portfolio Ready' : week6 && week6.review_status === 'submitted' ? 'Week 6 · Submitted' : week6 && week6.review_status === 'needs_revision' ? 'Week 6 · Needs Revision' : 'Week 6 · Not accepted';
        return `<article class="course-state-card" data-spotlight-user="${escapeHtml(student.user_id)}" data-changed="false">
          <div class="course-state-student"><strong>${escapeHtml(student.student_id || student.user_id)}</strong><span>${escapeHtml(student.track_code)}</span></div>
          <div class="course-state-current ${status !== 'not_completed' ? 'complete' : ''}"><strong>${escapeHtml(statusLabels[status] || status)}</strong><span>${escapeHtml(assignment)}</span></div>
          <label class="course-state-field"><span>Presentation status</span><select data-spotlight-status data-initial="${escapeHtml(status)}"><option value="not_completed" ${status === 'not_completed' ? 'selected' : ''}>Not yet completed</option><option value="presented_live" ${status === 'presented_live' ? 'selected' : ''}>Presented live</option><option value="approved_makeup_completed" ${status === 'approved_makeup_completed' ? 'selected' : ''}>Approved makeup completed</option><option value="approved_exception_completed" ${status === 'approved_exception_completed' ? 'selected' : ''}>Approved recording/link exception completed</option></select></label>
          <label class="course-state-field"><span>Makeup or exception reference <small>Optional; use when applicable</small></span><input data-spotlight-reference data-initial="${escapeHtml(reference)}" type="text" value="${escapeHtml(reference)}" placeholder="Approved makeup / exception reference" /></label>
        </article>`;
      }).join('');
      wireSpotlightRows();
    } catch (error) {
      console.error('M360 Career Spotlight admin load failed', error);
      spotlightRoster.innerHTML = '<div class="empty-state">Unable to load Career Spotlight presentation verification.</div>';
    }
  }

  async function saveSpotlightChanges() {
    const changed = Array.from(spotlightRoster.querySelectorAll('[data-spotlight-user][data-changed="true"]'));
    if (!changed.length) return;
    saveSpotlight.disabled = true;
    spotlightStatus.textContent = `Saving ${changed.length}…`;
    try {
      await Promise.all(changed.map(card => M360Data.setSpotlightPresentation(
        card.dataset.spotlightUser,
        card.querySelector('[data-spotlight-status]').value,
        card.querySelector('[data-spotlight-reference]').value.trim()
      )));
      spotlightStatus.textContent = `${changed.length} saved`;
      await loadSpotlight();
    } catch (error) {
      console.error('M360 Career Spotlight bulk save failed', error);
      spotlightStatus.textContent = 'Save failed — try again';
      saveSpotlight.disabled = false;
    }
  }

  refreshStart.addEventListener('click', loadStartHere);
  refreshSpotlight.addEventListener('click', loadSpotlight);
  saveSpotlight.addEventListener('click', saveSpotlightChanges);
  loadStartHere();
  loadSpotlight();
})();

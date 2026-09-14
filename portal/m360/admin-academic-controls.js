(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  let lastOpenedUserId = null;

  function notice(message, tone = '') {
    const el = $('adminNotice');
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || '';
    el.className = `review-notice${tone ? ' ' + tone : ''}`;
  }

  function selectedUserIds() {
    return Array.from(document.querySelectorAll('[data-select-student]:checked'))
      .map(input => input.dataset.selectStudent)
      .filter(Boolean);
  }

  function closeModal() {
    const backdrop = $('bulkModalBackdrop');
    if (backdrop) backdrop.hidden = true;
  }

  function renderAttendanceModal() {
    const userIds = selectedUserIds();
    if (!userIds.length) {
      notice('Select at least one student before recording attendance evidence.', 'error');
      return;
    }
    const modal = $('bulkModal');
    const backdrop = $('bulkModalBackdrop');
    if (!modal || !backdrop) return;

    modal.innerHTML = `
      <h2 id="bulkModalTitle">Record M360 Attendance Evidence</h2>
      <p>${userIds.length} student${userIds.length === 1 ? '' : 's'} selected. The values below are written as individual evidence records for each selected learner.</p>
      <div class="m360-panel-sub">M360 101 is controlled at 720 scheduled minutes (12 hours). Attendance status is calculated from evidence; it cannot be manually set.</div>
      <label class="m360-admin-field"><span>Scheduled minutes</span><input id="academicScheduledMinutes" type="number" value="720" readonly /></label>
      <label class="m360-admin-field"><span>Attended minutes</span><input id="academicAttendedMinutes" type="number" min="0" max="720" step="1" inputmode="numeric" /></label>
      <label class="m360-admin-field"><span>Approved makeup / equivalency minutes</span><input id="academicEquivalencyMinutes" type="number" min="0" max="720" step="1" value="0" inputmode="numeric" /></label>
      <label class="m360-admin-field"><span>Last date of attendance</span><input id="academicLastAttendanceDate" type="date" /></label>
      <label class="m360-admin-field"><span>Controlled source reference</span><input id="academicAttendanceReference" type="text" placeholder="Roster / attendance record reference" /></label>
      <label class="m360-admin-field"><span>Notes (optional)</span><input id="academicAttendanceNotes" type="text" placeholder="Approved makeup or verification note" /></label>
      <div id="academicAttendancePreview" class="review-total">Enter attended minutes to calculate attendance.</div>
      <div class="m360-modal-actions"><button class="btn btn-secondary" type="button" id="academicAttendanceCancel">Cancel</button><button class="btn btn-primary" type="button" id="academicAttendanceSave">Record evidence</button></div>`;
    backdrop.hidden = false;

    const updatePreview = () => {
      const attended = Number($('academicAttendedMinutes')?.value || 0);
      const equivalency = Number($('academicEquivalencyMinutes')?.value || 0);
      const total = Math.min(720, Math.max(0, attended + equivalency));
      const pct = (total / 720) * 100;
      const output = $('academicAttendancePreview');
      if (output) output.textContent = `${pct.toFixed(1)}% attendance · ${pct >= 80 ? 'Requirement met' : 'Below 80% requirement'}`;
    };
    $('academicAttendedMinutes')?.addEventListener('input', updatePreview);
    $('academicEquivalencyMinutes')?.addEventListener('input', updatePreview);
    $('academicAttendanceCancel')?.addEventListener('click', closeModal);
    $('academicAttendanceSave')?.addEventListener('click', async () => {
      const attended = Number($('academicAttendedMinutes')?.value);
      const equivalency = Number($('academicEquivalencyMinutes')?.value || 0);
      const lda = String($('academicLastAttendanceDate')?.value || '').trim();
      const reference = String($('academicAttendanceReference')?.value || '').trim();
      const notes = String($('academicAttendanceNotes')?.value || '').trim();
      if (!Number.isFinite(attended) || attended < 0 || attended + equivalency > 720 || !lda || !reference) {
        notice('Enter valid attendance minutes, last date of attendance, and a controlled source reference.', 'error');
        return;
      }
      const save = $('academicAttendanceSave');
      save.disabled = true;
      try {
        await Promise.all(userIds.map(userId => mntSupabase.rpc('m360_admin_set_attendance_evidence', {
          p_user_id: userId,
          p_scheduled_minutes: 720,
          p_attended_minutes: attended,
          p_approved_equivalency_minutes: equivalency,
          p_last_date_of_attendance: lda,
          p_external_reference: reference,
          p_notes: notes || null
        }).then(({ error }) => { if (error) throw error; })));
        closeModal();
        notice(`Structured attendance evidence recorded for ${userIds.length} student${userIds.length === 1 ? '' : 's'}.`, 'success');
        $('refreshWorkspaceBtn')?.click();
      } catch (error) {
        console.error('M360 structured attendance update failed', error);
        notice(error.message || 'Unable to record M360 attendance evidence.', 'error');
      } finally {
        save.disabled = false;
      }
    });
  }

  async function loadAcademicState(userId) {
    const [{ data: progress, error: progressError }, { data: authz, error: authzError }] = await Promise.all([
      mntSupabase.from('m360_course_progress').select('*').eq('user_id', userId).maybeSingle(),
      mntSupabase.from('m360_faculty_authorizations').select('can_finalize,active').maybeSingle()
    ]);
    if (progressError) throw progressError;
    if (authzError) throw authzError;
    return { progress: progress || {}, canFinalize: Boolean(authz && authz.active && authz.can_finalize) };
  }

  async function enhanceDrawer(userId) {
    const drawer = $('studentDrawer');
    if (!drawer || drawer.hidden || !userId) return;
    drawer.querySelector('#m360AcademicControlSection')?.remove();
    try {
      const { progress, canFinalize } = await loadAcademicState(userId);
      const section = document.createElement('div');
      section.id = 'm360AcademicControlSection';
      section.className = 'm360-drawer-section';
      const attendance = progress.attendance_percentage == null ? 'No structured record' : `${Number(progress.attendance_percentage).toFixed(1)}%`;
      const finalState = progress.course_complete ? 'Finalized' : progress.ready_to_finalize ? 'Ready to finalize' : 'Not ready';
      section.innerHTML = `
        <h3>Academic record</h3>
        <div class="m360-drawer-grid">
          <div class="m360-drawer-stat"><span>Course version</span><strong>${esc(progress.course_version || '—')}</strong></div>
          <div class="m360-drawer-stat"><span>Attendance</span><strong>${esc(attendance)}</strong></div>
          <div class="m360-drawer-stat"><span>Finalization</span><strong>${esc(finalState)}</strong></div>
          <div class="m360-drawer-stat"><span>Earned hours</span><strong>${progress.course_complete ? esc(progress.earned_clock_hours || '12') : 'Pending'}</strong></div>
        </div>
        <p class="m360-panel-sub">Completion is an immutable academic record. The finalization gate requires Start Here, six faculty-finalized weeks, final grade ≥70, verified Career Spotlight, a controlled cohort, and attendance ≥80% from structured evidence.</p>`;
      if (progress.ready_to_finalize && !progress.course_complete) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.type = 'button';
        button.textContent = canFinalize ? 'Finalize M360 Completion' : 'Faculty finalizer authorization required';
        button.disabled = !canFinalize;
        button.addEventListener('click', async () => {
          if (!window.confirm('Finalize this M360 academic record? Final completion records cannot be edited or deleted.')) return;
          button.disabled = true;
          try {
            const { error } = await mntSupabase.rpc('m360_admin_finalize_course', { p_user_id: userId });
            if (error) throw error;
            notice('M360 completion finalized and locked.', 'success');
            $('refreshWorkspaceBtn')?.click();
            setTimeout(() => enhanceDrawer(userId), 400);
          } catch (error) {
            console.error('M360 finalization failed', error);
            notice(error.message || 'M360 finalization failed.', 'error');
            button.disabled = false;
          }
        });
        section.appendChild(button);
      }
      drawer.appendChild(section);
    } catch (error) {
      console.error('M360 academic drawer enhancement failed', error);
    }
  }

  function wire() {
    const oldAttendance = $('bulkAttendanceBtn');
    if (oldAttendance) {
      const replacement = oldAttendance.cloneNode(true);
      replacement.textContent = 'Record Attendance Evidence';
      oldAttendance.replaceWith(replacement);
      replacement.addEventListener('click', renderAttendanceModal);
    }

    document.addEventListener('click', event => {
      const row = event.target?.closest?.('[data-student-row]');
      if (!row) return;
      lastOpenedUserId = row.dataset.studentRow || null;
      setTimeout(() => enhanceDrawer(lastOpenedUserId), 0);
    }, true);

    const drawer = $('studentDrawer');
    if (drawer) {
      new MutationObserver(() => {
        if (!drawer.hidden && lastOpenedUserId && !drawer.querySelector('#m360AcademicControlSection')) {
          enhanceDrawer(lastOpenedUserId);
        }
      }).observe(drawer, { childList: true, subtree: false, attributes: true, attributeFilter: ['hidden'] });
    }
  }

  wire();
})();

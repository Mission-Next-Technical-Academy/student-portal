(() => {
  'use strict';
  const roster = document.getElementById('attendanceRoster');
  const refreshButton = document.getElementById('refreshAttendanceBtn');
  const ELIGIBLE = ['SOCAN','HDESK','AIENG'];

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function formatVerified(record) {
    if (!record || !record.attendance_requirement_met) return 'Not verified';
    const when = record.attendance_verified_at ? new Date(record.attendance_verified_at).toLocaleString() : 'time unavailable';
    return `Verified ${when}`;
  }

  async function loadRoster() {
    roster.innerHTML = '<div class="empty-state">Loading eligible M360 students…</div>';
    try {
      const context = await M360Data.getContext({ refresh: true });
      if (!context.authenticated) { location.replace('../index.html#/login'); return; }
      if (!context.isAdmin) { location.replace('../index.html'); return; }
      if (!(await M360Data.schemaAvailable({ refresh: true }))) {
        roster.innerHTML = '<div class="empty-state">M360 durable data is unavailable.</div>';
        return;
      }

      const { data: students, error: studentError } = await mntSupabase
        .from('students')
        .select('user_id, student_id, track_code, is_enrolled, is_admin')
        .eq('is_enrolled', true)
        .eq('is_admin', false)
        .in('track_code', ELIGIBLE)
        .order('student_id', { ascending: true });
      if (studentError) throw studentError;

      const userIds = (students || []).map(student => student.user_id).filter(Boolean);
      let recordsByUser = {};
      if (userIds.length) {
        const { data: records, error: recordError } = await mntSupabase
          .from('m360_course_records')
          .select('user_id, attendance_requirement_met, attendance_verified_by, attendance_verified_at, attendance_external_reference')
          .in('user_id', userIds);
        if (recordError) throw recordError;
        recordsByUser = Object.fromEntries((records || []).map(record => [record.user_id, record]));
      }

      if (!students || !students.length) {
        roster.innerHTML = '<div class="empty-state">No enrolled M360-eligible students were found.</div>';
        return;
      }

      roster.innerHTML = students.map(student => {
        const record = recordsByUser[student.user_id] || null;
        const met = Boolean(record && record.attendance_requirement_met);
        return `<article class="attendance-roster-card" data-attendance-user="${escapeHtml(student.user_id)}">
          <div class="attendance-student">
            <strong>${escapeHtml(student.student_id || student.user_id)}</strong>
            <span>${escapeHtml(student.track_code)}</span>
          </div>
          <div class="attendance-current ${met ? 'verified' : ''}">
            <strong>${met ? 'Requirement satisfied' : 'Not verified'}</strong>
            <span>${escapeHtml(formatVerified(record))}</span>
          </div>
          <label class="attendance-roster-check"><input type="checkbox" data-roster-met ${met ? 'checked' : ''} /> <span>External M360 attendance requirement satisfied</span></label>
          <label class="attendance-reference"><span>External record reference <small>Optional; no minutes or clock hours</small></span><input data-roster-reference type="text" value="${escapeHtml(record && record.attendance_external_reference || '')}" placeholder="External roster/reference" /></label>
          <button class="btn btn-secondary" type="button" data-roster-save>Save attendance status</button>
        </article>`;
      }).join('');
      wireRoster();
    } catch (error) {
      console.error('M360 attendance roster failed', error);
      roster.innerHTML = '<div class="empty-state">Unable to load M360 attendance verification. No technical-course data was changed.</div>';
    }
  }

  function wireRoster() {
    roster.querySelectorAll('[data-attendance-user]').forEach(card => {
      const button = card.querySelector('[data-roster-save]');
      button.addEventListener('click', async () => {
        button.disabled = true;
        const original = button.textContent;
        button.textContent = 'Saving…';
        try {
          const met = card.querySelector('[data-roster-met]').checked;
          const reference = card.querySelector('[data-roster-reference]').value.trim();
          await M360Data.setAttendance(card.dataset.attendanceUser, met, reference);
          button.textContent = 'Saved';
          setTimeout(loadRoster, 500);
        } catch (error) {
          console.error('M360 attendance roster save failed', error);
          button.textContent = 'Save failed';
          button.disabled = false;
          setTimeout(() => { button.textContent = original; }, 1800);
        }
      });
    });
  }

  refreshButton.addEventListener('click', loadRoster);
  loadRoster();
})();

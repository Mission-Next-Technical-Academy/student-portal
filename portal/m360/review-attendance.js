(() => {
  'use strict';
  const roster = document.getElementById('attendanceRoster');
  const refreshButton = document.getElementById('refreshAttendanceBtn');
  const saveButton = document.getElementById('saveAttendanceChangesBtn');
  const saveStatus = document.getElementById('attendanceSaveStatus');
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

  function cardValue(card) {
    return {
      status: card.querySelector('[data-roster-status]').value,
      reference: card.querySelector('[data-roster-reference]').value.trim()
    };
  }

  function studentLabel(card) {
    return card.dataset.studentId || card.dataset.attendanceUser || 'student';
  }

  function isDirty(card) {
    const value = cardValue(card);
    return value.status !== card.dataset.initialStatus || value.reference !== card.dataset.initialReference;
  }

  function dirtyCards() {
    return Array.from(roster.querySelectorAll('[data-attendance-user]')).filter(isDirty);
  }

  function updateSaveButton() {
    if (!saveButton) return;
    const changed = dirtyCards();
    saveButton.disabled = changed.length === 0;
    saveButton.textContent = changed.length ? `Save changed attendance (${changed.length})` : 'Save changed attendance';
    if (saveStatus && changed.length) {
      saveStatus.textContent = `Unsaved attendance change${changed.length === 1 ? '' : 's'} for ${changed.map(studentLabel).join(', ')}.`;
    } else if (saveStatus && !saveStatus.dataset.persistMessage) {
      saveStatus.textContent = '';
    }
  }

  function updateDirtyState(card) {
    card.classList.toggle('is-dirty', isDirty(card));
    const identity = card.querySelector('[data-attendance-dirty-label]');
    if (identity) identity.textContent = isDirty(card) ? `Unsaved change for ${studentLabel(card)}` : '';
    if (saveStatus) delete saveStatus.dataset.persistMessage;
    updateSaveButton();
  }

  function renderSavedRecord(card, record) {
    const current = card.querySelector('.attendance-current');
    const met = Boolean(record && record.attendance_requirement_met);
    current.classList.toggle('verified', met);
    current.querySelector('strong').textContent = met ? 'Requirement satisfied' : 'Not verified';
    current.querySelector('span').textContent = formatVerified(record);
    card.dataset.initialStatus = met ? 'satisfied' : 'unverified';
    card.dataset.initialReference = (record && record.attendance_external_reference || '').trim();
    const identity = card.querySelector('[data-attendance-dirty-label]');
    if (identity) identity.textContent = '';
    card.classList.remove('is-dirty', 'save-error');
  }

  async function loadRoster() {
    roster.innerHTML = '<div class="empty-state">Loading eligible M360 students…</div>';
    if (saveStatus) { saveStatus.textContent = ''; delete saveStatus.dataset.persistMessage; }
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
        updateSaveButton();
        return;
      }

      roster.innerHTML = students.map(student => {
        const record = recordsByUser[student.user_id] || null;
        const met = Boolean(record && record.attendance_requirement_met);
        const status = met ? 'satisfied' : 'unverified';
        const reference = record && record.attendance_external_reference || '';
        const id = student.student_id || student.user_id;
        return `<article class="attendance-roster-card" data-attendance-user="${escapeHtml(student.user_id)}" data-student-id="${escapeHtml(id)}" data-initial-status="${status}" data-initial-reference="${escapeHtml(reference)}">
          <div class="attendance-student">
            <strong>${escapeHtml(id)}</strong>
            <span>${escapeHtml(student.track_code)} · Attendance record for this student only</span>
            <small data-attendance-dirty-label></small>
          </div>
          <div class="attendance-current ${met ? 'verified' : ''}">
            <strong>${met ? 'Requirement satisfied' : 'Not verified'}</strong>
            <span>${escapeHtml(formatVerified(record))}</span>
          </div>
          <label class="attendance-status"><span>Attendance requirement for ${escapeHtml(id)}</span><select data-roster-status>
            <option value="unverified" ${!met ? 'selected' : ''}>Not verified</option>
            <option value="satisfied" ${met ? 'selected' : ''}>Requirement satisfied</option>
          </select></label>
          <label class="attendance-reference"><span>External record reference <small>Optional; no minutes or clock hours</small></span><input data-roster-reference type="text" value="${escapeHtml(reference)}" placeholder="External roster/reference" /></label>
        </article>`;
      }).join('');
      wireRoster();
      updateSaveButton();
    } catch (error) {
      console.error('M360 attendance roster failed', error);
      roster.innerHTML = '<div class="empty-state">Unable to load M360 attendance verification. No technical-course data was changed.</div>';
      updateSaveButton();
    }
  }

  function wireRoster() {
    roster.querySelectorAll('[data-attendance-user]').forEach(card => {
      card.querySelector('[data-roster-status]').addEventListener('change', () => updateDirtyState(card));
      card.querySelector('[data-roster-reference]').addEventListener('input', () => updateDirtyState(card));
    });
  }

  async function saveChangedAttendance() {
    const changed = dirtyCards();
    if (!changed.length) return;
    saveButton.disabled = true;
    refreshButton.disabled = true;
    saveButton.textContent = `Saving ${changed.length}…`;
    if (saveStatus) { saveStatus.textContent = `Saving attendance for ${changed.map(studentLabel).join(', ')}…`; delete saveStatus.dataset.persistMessage; }

    const results = await Promise.allSettled(changed.map(async card => {
      const value = cardValue(card);
      const record = await M360Data.setAttendance(card.dataset.attendanceUser, value.status === 'satisfied', value.reference);
      return { card, record, studentId: studentLabel(card) };
    }));

    const savedStudents = [];
    const failedStudents = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        savedStudents.push(result.value.studentId);
        renderSavedRecord(result.value.card, result.value.record);
      } else {
        failedStudents.push(studentLabel(changed[index]));
        changed[index].classList.add('save-error');
        console.error('M360 attendance bulk save failed', result.reason);
      }
    });

    refreshButton.disabled = false;
    if (saveStatus) {
      const savedText = savedStudents.length ? `Attendance updated for ${savedStudents.join(', ')}.` : '';
      const failedText = failedStudents.length ? ` Could not save ${failedStudents.join(', ')}; review and try again.` : '';
      saveStatus.textContent = `${savedText}${failedText}`.trim();
      saveStatus.dataset.persistMessage = 'true';
    }
    updateSaveButton();
  }

  refreshButton.addEventListener('click', () => {
    if (dirtyCards().length && !confirm('Discard unsaved attendance changes and refresh the roster?')) return;
    loadRoster();
  });
  if (saveButton) saveButton.addEventListener('click', saveChangedAttendance);
  loadRoster();
})();

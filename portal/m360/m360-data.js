(() => {
  'use strict';

  const ELIGIBLE_TRACKS = new Set(['SOCAN', 'HDESK', 'AIENG', 'ELECT']);
  const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);
  let contextPromise = null;
  let schemaState = null;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function getReviewerTrackFilter() {
    const requested = new URLSearchParams(window.location.search).get('track');
    const trackCode = String(requested || '').trim().toUpperCase();
    return {
      trackCode: ELIGIBLE_TRACKS.has(trackCode) ? trackCode : null,
      invalid: Boolean(trackCode) && !ELIGIBLE_TRACKS.has(trackCode)
    };
  }

  function schemaMissing(error) {
    if (!error) return false;
    if (MISSING_SCHEMA_CODES.has(error.code)) return true;
    const text = `${error.message || ''} ${error.details || ''}`.toLowerCase();
    return text.includes('m360_') && (
      text.includes('does not exist') ||
      text.includes('could not find') ||
      text.includes('schema cache')
    );
  }

  function publicError(error, fallback) {
    if (!error) return fallback || 'M360 request failed.';
    if (schemaMissing(error)) return 'M360 production data migration is not available yet.';
    return error.message || fallback || 'M360 request failed.';
  }

  async function getContext({ refresh = false } = {}) {
    if (typeof mntSupabase === 'undefined') {
      return { authenticated: false, eligible: false, schemaAvailable: false, error: 'Supabase client unavailable.' };
    }
    if (refresh) contextPromise = null;
    if (contextPromise) return contextPromise;

    contextPromise = (async () => {
      const { data: { session }, error: sessionError } = await mntSupabase.auth.getSession();
      if (sessionError || !session) {
        return { authenticated: false, eligible: false, schemaAvailable: false, error: sessionError ? publicError(sessionError) : null };
      }

      const { data: student, error: studentError } = await mntSupabase
        .from('students')
        .select('student_id, user_id, track_code, is_admin, is_enrolled, cohort_id')
        .eq('user_id', session.user.id)
        .single();

      if (studentError || !student) {
        return {
          authenticated: true,
          eligible: false,
          schemaAvailable: false,
          userId: session.user.id,
          error: publicError(studentError, 'Student record unavailable.')
        };
      }

      return {
        authenticated: true,
        userId: session.user.id,
        studentId: student.student_id,
        trackCode: student.track_code,
        cohortId: student.cohort_id || null,
        isAdmin: Boolean(student.is_admin),
        isEnrolled: student.is_enrolled !== false,
        eligible: student.is_enrolled !== false && ELIGIBLE_TRACKS.has(student.track_code),
        session
      };
    })();

    return contextPromise;
  }

  async function schemaAvailable({ refresh = false } = {}) {
    if (refresh) schemaState = null;
    if (schemaState !== null) return schemaState;
    const context = await getContext();
    if (!context.authenticated) return false;

    const { error } = await mntSupabase
      .from('m360_week_records')
      .select('week_number')
      .limit(1);

    if (!error) {
      schemaState = true;
      return true;
    }
    if (schemaMissing(error)) {
      schemaState = false;
      return false;
    }
    console.error('M360 schema availability check failed', error);
    schemaState = false;
    return false;
  }

  async function requireEligibleContext() {
    const context = await getContext();
    if (!context.authenticated) throw new Error('Sign in to the Mission Next Student Portal to use M360.');
    if (!context.eligible) throw new Error('M360 access is not available for this account.');
    return context;
  }

  async function requireAdminContext() {
    const context = await getContext();
    if (!context.authenticated || !context.isAdmin) throw new Error('Admin access required.');
    return context;
  }

  async function requireSchema() {
    if (!(await schemaAvailable())) throw new Error('M360 production data migration is not available yet.');
  }

  async function loadOwnWeekRecords() {
    const context = await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase
      .from('m360_week_records')
      .select('*')
      .eq('user_id', context.userId)
      .order('week_number', { ascending: true });
    if (error) throw new Error(publicError(error));
    return clone(data || []);
  }

  async function loadOwnCourseRecord() {
    const context = await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase
      .from('m360_course_records')
      .select('*')
      .eq('user_id', context.userId)
      .maybeSingle();
    if (error) throw new Error(publicError(error));
    return clone(data || null);
  }

  async function loadOwnCourseProgress() {
    const context = await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase
      .from('m360_course_progress')
      .select('*')
      .eq('user_id', context.userId)
      .maybeSingle();
    if (error) throw new Error(publicError(error));
    return clone(data || null);
  }

  async function saveStartHere(payload, complete = false, acknowledgmentsComplete = false, supportFlag = false) {
    await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_save_start_here', {
      p_payload: payload || {},
      p_complete: Boolean(complete),
      p_acknowledgments_complete: Boolean(acknowledgmentsComplete),
      p_support_flag: Boolean(supportFlag)
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  async function saveDraft(weekNumber, payload, schemaVersion = 1) {
    await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_save_draft', {
      p_week_number: weekNumber,
      p_draft_payload: payload || {},
      p_schema_version: schemaVersion
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  async function submitWeek(weekNumber, payload, schemaVersion = 1) {
    await requireEligibleContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_submit_week', {
      p_week_number: weekNumber,
      p_submitted_payload: payload || {},
      p_schema_version: schemaVersion
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  async function loadSubmittedForReview(trackCode = null) {
    await requireAdminContext();
    await requireSchema();

    const { data: rows, error: rowsError } = await mntSupabase
      .from('m360_week_records')
      .select('*')
      .eq('review_status', 'submitted')
      .order('submitted_at', { ascending: true });
    if (rowsError) throw new Error(publicError(rowsError));

    const userIds = [...new Set((rows || []).map(row => row.user_id))];
    let studentsByUser = {};
    if (userIds.length) {
      const { data: students, error: studentsError } = await mntSupabase
        .from('students')
        .select('user_id, student_id, track_code')
        .in('user_id', userIds);
      if (studentsError) throw new Error(publicError(studentsError));
      studentsByUser = Object.fromEntries((students || []).map(student => [student.user_id, student]));
    }

    const validTrack = ELIGIBLE_TRACKS.has(trackCode) ? trackCode : null;
    return (rows || []).map(row => ({
      ...clone(row),
      student: clone(studentsByUser[row.user_id] || null)
    })).filter(row => !validTrack || row.student?.track_code === validTrack);
  }

  async function reviewWeek(userId, weekNumber, decision, rubricScores, feedback = '') {
    await requireAdminContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_admin_review_week', {
      p_user_id: userId,
      p_week_number: weekNumber,
      p_decision: decision,
      p_rubric_scores: rubricScores,
      p_feedback: feedback || null
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  async function setAttendance(userId, requirementMet, externalReference = '') {
    await requireAdminContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_admin_set_attendance', {
      p_user_id: userId,
      p_requirement_met: Boolean(requirementMet),
      p_external_reference: externalReference || null
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  async function setSpotlightPresentation(userId, status, reference = '') {
    await requireAdminContext();
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_admin_set_spotlight_presentation', {
      p_user_id: userId,
      p_status: status,
      p_reference: reference || null
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  function scheduleCohort(context, requestedCohortId = null) {
    const requested = String(requestedCohortId || '').trim();
    if (context.isAdmin && requested) return requested;
    return String(context.cohortId || '').trim();
  }

  async function loadLiveSessions(cohortId = null) {
    const context = await getContext();
    if (!context.authenticated) throw new Error('Sign in to view the M360 live-session schedule.');
    const targetCohort = scheduleCohort(context, cohortId);
    if (!targetCohort) return [];
    const { data, error } = await mntSupabase
      .from('m360_live_sessions')
      .select('cohort_id, week_number, session_number, session_date, session_time, timezone_label, updated_at')
      .eq('cohort_id', targetCohort)
      .order('week_number', { ascending: true })
      .order('session_number', { ascending: true });
    if (error) throw new Error(publicError(error, 'M360 live-session schedule is unavailable.'));
    return clone(data || []);
  }

  async function saveLiveSession(weekNumber, sessionNumber, sessionDate, sessionTime, timezoneLabel = 'ET', cohortId = null) {
    const context = await requireAdminContext();
    const targetCohort = scheduleCohort(context, cohortId);
    if (!targetCohort) throw new Error('Select a cohort before saving the M360 schedule.');
    const week = Number(weekNumber);
    const session = Number(sessionNumber);
    const date = String(sessionDate || '').trim();
    const time = String(sessionTime || '').trim();
    const zone = String(timezoneLabel || 'ET').trim() || 'ET';
    if (!Number.isInteger(week) || week < 1 || week > 6) throw new Error('Week must be between 1 and 6.');
    if (!Number.isInteger(session) || session < 1 || session > 2) throw new Error('Session must be 1 or 2.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Enter a valid session date.');
    if (!/^\d{2}:\d{2}/.test(time)) throw new Error('Enter a valid session time.');

    const { data, error } = await mntSupabase
      .from('m360_live_sessions')
      .upsert({
        cohort_id: targetCohort,
        week_number: week,
        session_number: session,
        session_date: date,
        session_time: time.slice(0, 5),
        timezone_label: zone.slice(0, 16),
        updated_by: context.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cohort_id,week_number,session_number' })
      .select('cohort_id, week_number, session_number, session_date, session_time, timezone_label, updated_at')
      .single();
    if (error) throw new Error(publicError(error, 'Unable to save the live-session schedule.'));
    return clone(data);
  }

  async function deleteLiveSession(weekNumber, sessionNumber, cohortId = null) {
    const context = await requireAdminContext();
    const targetCohort = scheduleCohort(context, cohortId);
    if (!targetCohort) throw new Error('Select a cohort before clearing the M360 schedule.');
    const week = Number(weekNumber);
    const session = Number(sessionNumber);
    const { error } = await mntSupabase
      .from('m360_live_sessions')
      .delete()
      .eq('cohort_id', targetCohort)
      .eq('week_number', week)
      .eq('session_number', session);
    if (error) throw new Error(publicError(error, 'Unable to clear the live-session schedule.'));
    return true;
  }

  // Account display names (first + last name beside an account number). M360
  // pages do not load app.js, so they read the same public.students columns.
  // Pre-migration databases lack the columns: show no names, never fail.
  const NAME_PAGE = 1000;
  const nameByStudent = new Map();
  const nameByUser = new Map();
  let namesPromise = null;

  function nameColumnsMissing(error) {
    if (!error) return false;
    if (['42703', 'PGRST204'].includes(error.code)) return true;
    const text = `${error.message || ''} ${error.details || ''}`;
    return /first_name|last_name/i.test(text) && /does not exist|schema cache|could not find/i.test(text);
  }

  // Resolves true when names loaded. Never throws; await before rendering.
  function loadNames(refresh = false) {
    if (typeof mntSupabase === 'undefined') return Promise.resolve(false);
    if (namesPromise && !refresh) return namesPromise;
    namesPromise = (async () => {
      try {
        for (let from = 0; ; from += NAME_PAGE) {
          const { data, error } = await mntSupabase
            .from('students')
            .select('student_id, user_id, first_name, last_name')
            .order('student_id')
            .range(from, from + NAME_PAGE - 1);
          if (error) {
            if (!nameColumnsMissing(error)) namesPromise = null;
            return false;
          }
          (data || []).forEach(row => {
            if (!row || !row.first_name || !row.last_name) return;
            const entry = { first: row.first_name, last: row.last_name };
            if (row.student_id) nameByStudent.set(row.student_id, entry);
            if (row.user_id) nameByUser.set(row.user_id, entry);
          });
          if (!data || data.length < NAME_PAGE) break;
        }
        return true;
      } catch (error) {
        namesPromise = null;
        return false;
      }
    })();
    return namesPromise;
  }

  // "First Last" or "". Accepts a row ({student_id,user_id}) or a bare ID/uuid.
  function nameParts(source) {
    if (!source) return { first: '', last: '' };
    if (typeof source === 'string') return nameByStudent.get(source) || nameByUser.get(source) || { first: '', last: '' };
    if (source.first_name && source.last_name) return { first: source.first_name, last: source.last_name };
    return nameByStudent.get(source.student_id || source.studentId || '') ||
      nameByUser.get(source.user_id || source.userId || '') || { first: '', last: '' };
  }

  function nameText(source) {
    const parts = nameParts(source);
    return `${parts.first} ${parts.last}`.trim();
  }

  function escapeNameHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // Block form under the ID, or inline " · First Last"; "" when no name.
  function nameHtml(source, inline = false) {
    const text = nameText(source);
    if (!text) return '';
    const style = inline
      ? 'font-size:.85em;font-weight:400;opacity:.75;text-transform:none;letter-spacing:0'
      : 'display:block;font-size:.75em;font-weight:400;line-height:1.2;opacity:.75;text-transform:none;letter-spacing:0';
    return `<span class="acct-name" style="${style}">${inline ? ' · ' : ''}${escapeNameHtml(text)}</span>`;
  }

  window.M360Data = Object.freeze({
    loadNames,
    nameParts,
    nameText,
    nameHtml,
    ELIGIBLE_TRACKS,
    getReviewerTrackFilter,
    getContext,
    schemaAvailable,
    loadOwnWeekRecords,
    loadOwnCourseRecord,
    loadOwnCourseProgress,
    saveStartHere,
    saveDraft,
    submitWeek,
    loadSubmittedForReview,
    reviewWeek,
    setAttendance,
    setSpotlightPresentation,
    loadLiveSessions,
    saveLiveSession,
    deleteLiveSession,
    schemaMissing
  });
})();

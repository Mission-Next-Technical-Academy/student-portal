(() => {
  'use strict';

  const ELIGIBLE_TRACKS = new Set(['SOCAN', 'HDESK', 'AIENG']);
  const MISSING_SCHEMA_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);
  let contextPromise = null;
  let schemaState = null;

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
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
        .select('student_id, user_id, track_code, is_admin, is_enrolled')
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

  async function loadSubmittedForReview() {
    const context = await getContext();
    if (!context.authenticated || !context.isAdmin) throw new Error('Admin access required.');
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

    return (rows || []).map(row => ({
      ...clone(row),
      student: clone(studentsByUser[row.user_id] || null)
    }));
  }

  async function reviewWeek(userId, weekNumber, decision, rubricScores, feedback = '') {
    const context = await getContext();
    if (!context.authenticated || !context.isAdmin) throw new Error('Admin access required.');
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
    const context = await getContext();
    if (!context.authenticated || !context.isAdmin) throw new Error('Admin access required.');
    await requireSchema();
    const { data, error } = await mntSupabase.rpc('m360_admin_set_attendance', {
      p_user_id: userId,
      p_requirement_met: Boolean(requirementMet),
      p_external_reference: externalReference || null
    });
    if (error) throw new Error(publicError(error));
    return clone(data);
  }

  window.M360Data = Object.freeze({
    ELIGIBLE_TRACKS,
    getContext,
    schemaAvailable,
    loadOwnWeekRecords,
    loadOwnCourseProgress,
    saveDraft,
    submitWeek,
    loadSubmittedForReview,
    reviewWeek,
    setAttendance,
    schemaMissing
  });
})();

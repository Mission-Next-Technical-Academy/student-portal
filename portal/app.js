/* MNT Academy portal — router, Supabase auth, entitlement gating.
 *
 * Everything visual here is assembled from tokens already shipping on
 * mntacademy.com (see MNT_DESIGN_TOKENS.md). No new design system.
 *
 * Auth is real Supabase Auth (see portal/supabase-config.js for the client).
 * Students sign in with a login ID like "4957361987-SOCAN", never an email —
 * loginIdToEmail() maps it to the synthetic email Supabase Auth actually uses
 * under the hood. See supabase/migrations/20260828120000_students_admin.sql.
 */

const STUDENT_EMAIL_DOMAIN = '@missionnext.example';

/* Mirrors bin/provision-students.js's TRACKCODE map. The old per-student
 * `enrollments`/`programs` tables were dropped by
 * supabase/migrations/20260828160000_simplify_schema.sql (architecture.md
 * Sprint 1) in favor of a single `track_code` column on `students` — access is
 * now derived from that column instead of joined from the dropped tables. */
const TRACK_CODE_TO_PROGRAM_SLUG = {
  SOCAN: 'soc-analyst',
  HDESK: 'it-support',
  AIENG: 'ai-ml',
  ELECT: 'electrical',
};

/* The simulator lives on its own origin in local development (its own server on
 * 8767, so each half can be reloaded independently) but is a sibling directory
 * on the deployed build, where the Pages workflow mounts portal/ at / and ui/
 * at sim/. Resolving this at runtime rather than hardcoding it is what lets one
 * codebase serve both without a build step — a hardcoded 127.0.0.1 points every
 * deployed Launch Lab button at the visitor's own laptop. */
const SIM_ORIGIN = ['127.0.0.1', 'localhost'].includes(location.hostname)
  ? 'http://127.0.0.1:8767/'
  : location.origin + location.pathname.replace(/[^/]*$/, '') + 'sim/';

/* ---------------------------------------------------------------- session */

function loginIdToEmail(loginId) {
  return loginId.trim().toLowerCase() + STUDENT_EMAIL_DOMAIN;
}

/* currentUser() resolves the Supabase session into the same plain-object shape
 * the rest of this file already expects ({ email, username, name, isAdmin,
 * enrollments: [{ programSlug, status, accessMode, modules }] }) — everything
 * downstream (enrollmentFor, hasModuleAccess, programCard, viewProgram, ...)
 * is untouched and stays synchronous because it only ever reads this resolved
 * object, never calls Supabase directly. Result is cached per page load so
 * render() can call this on every route change without refetching. */
let _cachedUser = null;
let _cachedUserPromise = null;

async function buildUserFromSession(session) {
  const userId = session.user.id;

  const { data: studentRow } = await mntSupabase
    .from('students')
    .select('student_id, track_code, is_admin, is_enrolled')
    .eq('user_id', userId)
    .single();

  // Access is derived from students.track_code, not a joined enrollments row —
  // see the TRACK_CODE_TO_PROGRAM_SLUG comment above. Provisioning only ever
  // creates full-track access today, so this is always a single active,
  // full-access enrollment (or none, for ADMIN / an unrecognized track / a
  // disenrolled student). Disenrollment (admin dashboard, wireAdmin) only
  // ever flips students.is_enrolled — it never deletes the row or the
  // student's progress history — so a disenrolled student still
  // authenticates fine; they just come out of this with no active
  // enrollment, which hasProgramAccess()/viewNoAccess() turn into a locked
  // "You are not enrolled in this program" screen instead of real access.
  const programSlug = studentRow ? TRACK_CODE_TO_PROGRAM_SLUG[studentRow.track_code] : null;
  const enrollments = programSlug && studentRow.is_enrolled !== false
    ? [{ programSlug, status: 'active', accessMode: 'full', modules: [], purchasedAt: null }]
    : [];

  // moduleCompletion() previously judged "complete" from browser-local
  // engagement (localStorage) alone, with no fallback to the module_progress
  // rows Supabase actually holds. That meant a student's real progress
  // (written from whichever browser/device they did the work on) went
  // invisible — back to gray/"Not Started" — the moment they opened the
  // portal from a different browser or cleared storage, even though the
  // database, admin dashboard, and Last Active all agreed the module was
  // done. Fetched once per session here, alongside the studentRow query
  // already run for every login, and cached on the user object the same way.
  let remoteModuleProgress = {};
  if (studentRow && studentRow.track_code) {
    const { data: progressRows, error: progressError } = await mntSupabase
      .from('module_progress')
      .select('module_key, state')
      .eq('user_id', userId)
      .eq('track_code', studentRow.track_code);
    if (progressError) {
      console.error('buildUserFromSession: module_progress fetch failed', progressError);
    } else {
      remoteModuleProgress = Object.fromEntries((progressRows || []).map((r) => [r.module_key, r.state]));
    }
  }

  return {
    email: session.user.email,
    username: studentRow ? studentRow.student_id : session.user.email,
    name: studentRow ? studentRow.student_id : session.user.email,
    isAdmin: !!(studentRow && studentRow.is_admin),
    enrollments,
    // userId/trackCode: added for the module_progress write path (architecture.md
    // §3 Sprint 2). Both come from the studentRow query above, already run for
    // every session — nothing extra is fetched, and it rides the same
    // _cachedUser caching as everything else on this object.
    userId: session.user.id,
    trackCode: studentRow ? studentRow.track_code : null,
    remoteModuleProgress,
  };
}

async function currentUser() {
  if (_cachedUser !== null) return _cachedUser;
  if (_cachedUserPromise) return _cachedUserPromise;
  _cachedUserPromise = (async () => {
    const { data: { session } } = await mntSupabase.auth.getSession();
    if (!session) {
      _cachedUser = null;
      return null;
    }
    const user = await buildUserFromSession(session);
    _cachedUser = user;
    return user;
  })();
  const result = await _cachedUserPromise;
  _cachedUserPromise = null;
  return result;
}

async function signIn(identifier, password) {
  const email = identifier.includes('@')
    ? identifier.trim().toLowerCase()
    : loginIdToEmail(identifier);
  const { data, error } = await mntSupabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  _cachedUser = null;
  _cachedUserPromise = null;
  const user = await currentUser();
  recordLoginEvent(user);
  recordSiteSessionStart(user);
  return user;
}

/* Student Activity Monitor data source (supabase/migrations/20260901110000_
 * login_events.sql). Fires once per actual signIn() call, never on a session
 * restore (currentUser() alone, e.g. a page refresh), so this reflects real
 * sign-in actions, not every render(). Fire-and-forget/self-row/error-logged
 * — same convention as upsertModuleProgress. Visibility only: never read
 * anywhere as attendance or instructional time (see the migration comment
 * and computeFixedCreditHours() above). */
function recordLoginEvent(user) {
  if (!user || !user.userId) return;
  mntSupabase
    .from('login_events')
    .insert({ user_id: user.userId, student_id: user.username || null, track_code: user.trackCode || null })
    .select('id')
    .single()
    .then(({ data, error }) => {
      if (error) console.error('login_events insert failed', error);
      else if (data && data.id) recordLoginGeo(data.id);
    })
    .catch((err) => console.error('login_events insert threw', err));
}

/* Location enrichment for the row recordLoginEvent() just inserted (supabase/
 * functions/record-login-geo, 20260901130000_login_event_geo.sql). Separate,
 * fire-and-forget follow-up call rather than columns the client inserts
 * itself: the client can't see, and must never be trusted to report, its own
 * IP — the Edge Function reads the real request IP server-side instead. Same
 * session-access idiom as callAdminProvision() below. Never throws past this
 * function: a failed lookup only means the Activity Monitor shows no
 * location for this sign-in, never a broken login. */
function recordLoginGeo(loginEventId) {
  mntSupabase.auth.getSession()
    .then(({ data: { session } }) => {
      const accessToken = session && session.access_token;
      if (!accessToken) return;
      return fetch(`${MNT_SUPABASE_URL}/functions/v1/record-login-geo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ login_event_id: loginEventId }),
      });
    })
    .then((res) => {
      if (res && !res.ok) console.error('record-login-geo request failed', res.status);
    })
    .catch((err) => console.error('record-login-geo threw', err));
}

/* Hours-on-site tracking (supabase/migrations/20260901122000_activity_monitor_
 * sessions.sql, COHORT_USER_LIFECYCLE_SPRINT_PLAN.md Sprint 4 addendum). Opens
 * one site_sessions row per real signIn() call — same fire-and-forget/self-
 * row/error-logged pattern as recordLoginEvent(), and deliberately a separate
 * table/call from it: site_sessions tracks session *duration* (closed later by
 * signOut() below or admin_force_sign_out()), which login_events' append-only
 * design forbids. Operational visibility only — never attendance/instructional
 * time, same framing as the migration's own table comment. */
function recordSiteSessionStart(user) {
  if (!user || !user.userId) return;
  mntSupabase
    .from('site_sessions')
    .insert({ user_id: user.userId, student_id: user.username || null, track_code: user.trackCode || null })
    .then(({ error }) => {
      if (error) console.error('site_sessions insert failed', error);
    })
    .catch((err) => console.error('site_sessions insert threw', err));
}

async function signOut(reason = 'user_signed_out') {
  // Close this student's own open site_sessions row(s) before the sign-out
  // call below invalidates the session auth.uid() depends on. Best-effort,
  // non-blocking: wrapped so a failed/erroring close can never stop the real
  // sign-out from completing. Filters on ended_at is null rather than a
  // specific row id (see recordSiteSessionStart) so a student with more than
  // one open tab/session gets every open row closed here, matching the
  // site_sessions_self_close RLS policy's own using()/with check() shape.
  // reason defaults to the manual-click case; wireIdleSignOut() below passes
  // 'idle_timeout' instead so the Activity Monitor can tell the two apart —
  // both are the only values the self-close RLS policy accepts
  // (20260901140000_site_sessions_idle_timeout.sql).
  try {
    const outgoingUser = await currentUser();
    if (outgoingUser && outgoingUser.userId) {
      const { error } = await mntSupabase
        .from('site_sessions')
        .update({ ended_at: new Date().toISOString(), ended_reason: reason })
        .eq('user_id', outgoingUser.userId)
        .is('ended_at', null);
      if (error) console.error('site_sessions self-close failed', error);
    }
  } catch (err) {
    console.error('site_sessions self-close threw', err);
  }
  await mntSupabase.auth.signOut();
  _cachedUser = null;
  _cachedUserPromise = null;
  // Purge defender-lab.* keys, or the next student on this browser inherits
  // the previous one's lab environment. PLATFORM_ARCHITECTURE.md §7.2.
  Object.keys(localStorage)
    .filter((k) => k.startsWith('defender-lab.'))
    .forEach((k) => localStorage.removeItem(k));
  Object.keys(sessionStorage)
    .filter((k) => k.startsWith('defender-lab.'))
    .forEach((k) => sessionStorage.removeItem(k));
  // replaceState, not location.hash: signing out should not leave the portal
  // sitting one Back press away.
  history.replaceState(null, '', '#/login');
  render();
}

/* Auto sign-out after MNT_IDLE_TIMEOUT_MS of no mouse/keyboard/touch/scroll
 * activity — site-owner request: previously signOut() only ever fired from
 * an explicit click (or an admin's admin_force_sign_out()), so a browser
 * left open kept its session alive indefinitely. Wired once at startup, not
 * re-wired on every render() (these are document-level listeners, so they
 * survive render()'s DOM rebuilds on their own). The timer keeps running
 * whether or not anyone is signed in; the actual signOut() call only fires
 * if currentUser() resolves to a real session, so idle time on the login
 * screen itself is a no-op beyond resetting a timer nothing is watching. */
const MNT_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
let _idleTimer = null;

function resetIdleTimer() {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(async () => {
    const user = await currentUser();
    if (user) await signOut('idle_timeout');
  }, MNT_IDLE_TIMEOUT_MS);
}

/* Server-side backstop for the timer above (supabase/migrations/20260901150000_
 * site_sessions_idle_enforcement.sql, close_idle_site_sessions() + its
 * pg_cron sweep). resetIdleTimer() alone only closes a session if THIS
 * browser tab is still alive, unthrottled, and running past this feature's
 * ship date — nothing catches a closed/backgrounded/pre-existing tab. The
 * cron sweep instead measures idleness against site_sessions.last_seen_at,
 * which this function bumps on the same real-activity events as
 * resetIdleTimer(), throttled so it writes at most once per
 * MNT_HEARTBEAT_INTERVAL_MS rather than on every mousemove. */
const MNT_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
let _lastHeartbeatAt = 0;

function maybeSendHeartbeat() {
  const now = Date.now();
  if (now - _lastHeartbeatAt < MNT_HEARTBEAT_INTERVAL_MS) return;
  _lastHeartbeatAt = now;
  currentUser().then((user) => {
    if (!user || !user.userId) return;
    mntSupabase
      .from('site_sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', user.userId)
      .is('ended_at', null)
      .then(({ error }) => {
        if (error) console.error('site_sessions heartbeat failed', error);
      })
      .catch((err) => console.error('site_sessions heartbeat threw', err));
  });
}

function wireIdleSignOut() {
  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
    document.addEventListener(evt, () => {
      resetIdleTimer();
      maybeSendHeartbeat();
    }, { passive: true });
  });
  resetIdleTimer();
  maybeSendHeartbeat();
}

/* ------------------------------------------------------------ entitlement */

/* Mirrors the has_module_access() SQL function in PLATFORM_ARCHITECTURE.md §4.2.
 * In production this is the DATABASE's answer, enforced by RLS. Here it is a
 * client-side stand-in purely so the UI can be reviewed. The UI must never be
 * the authority on access. */

function enrollmentFor(user, slug) {
  if (!user) return null;
  return user.enrollments.find((e) => e.programSlug === slug && e.status === 'active') || null;
}

function hasProgramAccess(user, slug) {
  return !!enrollmentFor(user, slug);
}

function hasModuleAccess(user, slug, moduleKey) {
  const e = enrollmentFor(user, slug);
  if (!e) return false;
  if (e.accessMode === 'full') return true;
  if (e.accessMode === 'partial') return (e.modules || []).includes(moduleKey);
  return false;
}

const MODULE_ENGAGEMENT_PREFIX = 'mnt-portal.module-engagement.v1';

function moduleEngagementKey(user) {
  return `${MODULE_ENGAGEMENT_PREFIX}.${LabRuntime.anonymousStudentId(user)}`;
}

function loadModuleEngagement(user) {
  const fallback = { openedModules: [], completedLabs: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(moduleEngagementKey(user)) || 'null');
    if (!saved) return fallback;
    return {
      openedModules: Array.isArray(saved.openedModules) ? saved.openedModules : [],
      completedLabs: Array.isArray(saved.completedLabs) ? saved.completedLabs : [],
    };
  } catch (_) {
    return fallback;
  }
}

function saveModuleEngagement(user, engagement) {
  localStorage.setItem(moduleEngagementKey(user), JSON.stringify(engagement));
}

function moduleEngagementId(programSlug, moduleKey) {
  return `${programSlug}:${moduleKey}`;
}

function moduleLabEngagementId(programSlug, moduleKey, labKey) {
  return `${moduleEngagementId(programSlug, moduleKey)}:${labKey}`;
}

/* ---------------------------------- M360 progress (separate namespace) */
/* M360 Career Readiness items are tracked independently from technical module
 * progress. Each of the 8 items can be marked as done/not-done; completion is
 * persisted in localStorage under a separate key and never feeds into
 * course_progress, pass/fail gates, or technical program completion counts. */

function m360ProgressKey(user) {
  return `mnt.m360-101.progress.v1.${LabRuntime.anonymousStudentId(user)}`;
}

function loadM360Progress(user) {
  const fallback = { completedItems: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(m360ProgressKey(user)) || 'null');
    if (!saved) return fallback;
    return {
      completedItems: Array.isArray(saved.completedItems) ? saved.completedItems : [],
    };
  } catch (_) {
    return fallback;
  }
}

function saveM360Progress(user, progress) {
  localStorage.setItem(m360ProgressKey(user), JSON.stringify(progress));
}

async function toggleM360ItemCompletion(itemKey) {
  const user = await currentUser();
  if (!user) return;
  const progress = loadM360Progress(user);
  const idx = progress.completedItems.indexOf(itemKey);
  if (idx >= 0) {
    progress.completedItems.splice(idx, 1);
  } else {
    progress.completedItems.push(itemKey);
  }
  saveM360Progress(user, progress);
  render();
}

function m360CompletionSummary(user) {
  const progress = loadM360Progress(user);
  const completed = progress.completedItems.length;
  const total = 8;
  return { completed, total };
}

/* ----------------------------------------- admin dashboard local state */

/* Report history is kept in browser storage as a convenience only. The
 * institutional report-generation audit lives in Supabase once the local
 * report_generation_audit migration is deliberately applied. */
const ADMIN_DASHBOARD_STATE_KEY = 'mnt.portal.admin-dashboard.v1';

function loadAdminDashboardState() {
  const fallback = { reportRuns: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_DASHBOARD_STATE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      reportRuns: Array.isArray(saved.reportRuns) ? saved.reportRuns : [],
    };
  } catch (_) {
    return fallback;
  }
}

function saveAdminDashboardState(state) {
  localStorage.setItem(ADMIN_DASHBOARD_STATE_KEY, JSON.stringify(state));
}

async function updateAdminEnrollmentRemote(studentId, enrolled) {
  const { error: enrollmentError } = await mntSupabase
    .from('students')
    .update({ is_enrolled: enrolled })
    .eq('student_id', studentId);
  if (enrollmentError) return enrollmentError;

  return null;
}

/* Workstreams C1/C5: planning dates and the effective-dated geography
 * classification are saved through the narrow admin RPC introduced by
 * 20260829125000_enrollment_reporting_history.sql. The RPC preserves prior
 * enrollment episodes; this UI never edits a historical withdrawal. */
async function updateAdminEnrollmentPlanRemote(studentId, fields) {
  const { error } = await mntSupabase.rpc('admin_update_current_enrollment_plan', {
    p_student_id: studentId,
    p_scheduled_start_date: fields.scheduledStartDate || null,
    p_scheduled_completion_date: fields.scheduledCompletionDate || null,
    p_geography_classification: fields.geographyClassification || null,
    p_geography_source_reference: fields.geographySourceReference || null,
  });
  return error || null;
}

function applyAdminDashboardState(row) {
  return {
    ...row,
    enrolled: row.is_enrolled !== false,
    adminStateLabel: row.is_enrolled !== false ? 'Enrolled' : 'Disenrolled',
    // From admin_student_progress (20260829110000_enrollment_dates.sql):
    // status is the view's computed 'completed'/'withdrawn'/'active'/
    // 'not_yet_started' enum; the three dates pass through as-is (null until
    // stamped, or until an admin sets scheduled_start_date directly in the
    // DB — no dashboard input for that one yet, see the migration's TODO).
    status: row.status || null,
    enrollmentDate: row.enrollment_date || null,
    withdrawalDate: row.withdrawal_date || null,
    completionDate: row.completion_date || null,
    scheduledStartDate: row.scheduled_start_date || null,
    scheduledCompletionDate: row.scheduled_completion_date || null,
    programVersionCode: row.program_version_code || null,
    credentialCode: row.credential_code || null,
    credentialName: row.credential_name || null,
    geographyClassification: row.geography_classification || null,
    // From admin_student_progress (20260901090000_completion_reporting_
    // snapshot.sql, appended columns): fixed curriculum-credit minutes
    // awarded per completed module, not measured attendance/session time —
    // see student_hour_reconciliation. Nullable until that migration lands.
    creditedTechnicalMinutes: row.credited_technical_minutes ?? null,
    creditedCareerMinutes: row.credited_career_minutes ?? null,
    creditedProgramMinutes: row.credited_program_minutes ?? null,
  };
}

function filterAdminDashboardRows(rows) {
  return rows
    .filter((row) => row.track_code !== 'ADMIN')
    .map((row) => applyAdminDashboardState(row));
}

function adminDashboardSummary(rows) {
  const enrolledRows = rows.filter((row) => row.enrolled !== false);
  const notEnrolled = rows.length - enrolledRows.length;
  const notStarted = enrolledRows.filter((row) => row.modules_complete === 0 && (row.modules_in_progress || 0) === 0).length;
  const complete = enrolledRows.filter((row) => row.percent_complete >= 100).length;
  const inProgress = enrolledRows.length - notStarted - complete;
  const avgComplete = enrolledRows.length
    ? enrolledRows.reduce((sum, row) => sum + (row.percent_complete || 0), 0) / enrolledRows.length
    : 0;
  return { totalAccounts: rows.length, enrolled: enrolledRows.length, notEnrolled, notStarted, inProgress, complete, avgComplete };
}

/* --------------------------------------------------- D1: academic status */
/* Replaces the old `percent_complete >= 100 → Complete` / `> 0 → In
 * progress` / else `Not started` logic (remediation plan D1). Precedence:
 * completed > withdrawn > active > not yet started. "Leave/paused" and
 * "administrative access disabled" are not implemented anywhere in this
 * schema, so they are intentionally omitted rather than invented.
 *
 * Prefers the authoritative admin_student_progress.status column (view-
 * computed, from the enrollment-dates migration) when present. Falls back to
 * a degraded — but still honest — derivation from percent_complete/enrolled
 * when that column isn't live yet, WITHOUT collapsing "withdrawn" and "never
 * enrolled" into each other (the exact confusion the remediation plan's D1
 * and §3 table call out: "Do not use 'Not enrolled' as a substitute for
 * 'Withdrawn'"). A single `is_enrolled` boolean genuinely cannot distinguish
 * those two cases without enrollment_date/withdrawal_date, so the fallback
 * says so explicitly instead of guessing. */
function deriveAcademicStatus(row) {
  if (row.status) return row.status; // 'completed' | 'withdrawn' | 'active' | 'not_yet_started'
  const percent = row.percent_complete || 0;
  if (percent >= 100) return 'completed';
  if (row.enrolled === false) {
    return (row.withdrawalDate || row.enrollmentDate) ? 'withdrawn' : 'withdrawn_or_never_enrolled';
  }
  if ((row.modules_complete || 0) > 0 || (row.modules_in_progress || 0) > 0) return 'active';
  return 'not_yet_started';
}

function academicStatusLabel(status) {
  switch (status) {
    case 'completed': return 'Completed';
    case 'credential_awarded': return 'Credential awarded';
    case 'withdrawn': return 'Withdrawn';
    case 'active': return 'Active';
    case 'not_yet_started': return 'Not yet started';
    case 'withdrawn_or_never_enrolled': return 'Withdrawn or never enrolled (unconfirmed — enrollment-dates migration not live)';
    default: return 'Unknown';
  }
}

/* ------------------------------------------- G1: data-backed compliance */
/* Replaces the old adminReportingRequirements(), which was a static array
 * that returned the same seven hard-coded statuses regardless of what data
 * actually exists (ASSESSMENT_REPORTING_SPEC.md §1c). This inspects the
 * cohort rows actually passed in and the known state of the schema/code to
 * decide each status, so a future migration/feature landing (Agents 5-7)
 * naturally upgrades a requirement's status once the underlying field is
 * really there — nothing here needs to be hand-flipped back to "covered."
 *
 * Returns one entry per Reportingrequirements.txt requirement:
 * { id, requirement, status: covered|partial|missing|not_applicable|unknown,
 *   requiredFields, availableFields, missingFields, sourceTables, note,
 *   lastChecked }. `context.queryError` marks every requirement `unknown`
 * rather than silently treating a failed cohort query as "missing" (G3). */
function evaluateReportingCompliance(rows, context) {
  rows = Array.isArray(rows) ? rows : [];
  context = context || {};
  const lastChecked = context.generatedAt || new Date().toISOString();
  const queryFailed = !!context.queryError;
  const n = rows.length;

  function presentCount(getter) {
    return rows.filter((r) => {
      const v = getter(r);
      return v !== null && v !== undefined && v !== '';
    }).length;
  }

  function req({ id, requirement, requiredFields, dynamicallyPresent, staticallyMissing, sourceTables, note }) {
    if (queryFailed) {
      return { id, requirement, status: 'unknown', requiredFields, availableFields: [], missingFields: requiredFields, sourceTables, note: `Cohort data query failed (${context.queryError}); compliance cannot be verified this run.`, lastChecked };
    }
    if (n === 0) {
      return { id, requirement, status: 'unknown', requiredFields, availableFields: [], missingFields: requiredFields, sourceTables, note: 'No student rows in scope for this report run — cannot verify field coverage.', lastChecked };
    }
    const dynamicAvailable = dynamicallyPresent.filter((f) => presentCount(f.get) === n).map((f) => f.field);
    const dynamicPartial = dynamicallyPresent.filter((f) => { const c = presentCount(f.get); return c > 0 && c < n; }).map((f) => f.field);
    const dynamicMissing = dynamicallyPresent.filter((f) => presentCount(f.get) === 0).map((f) => f.field);
    const availableFields = dynamicAvailable;
    const missingFields = [...dynamicMissing, ...dynamicPartial.map((f) => `${f} — recorded for some students in this report but not all`), ...staticallyMissing];
    let status;
    if (missingFields.length === 0) status = 'covered';
    else if (availableFields.length === 0 && dynamicPartial.length === 0) status = 'missing';
    else status = 'partial';
    return { id, requirement, status, requiredFields, availableFields, missingFields, sourceTables, note, lastChecked };
  }

  return [
    req({
      id: 'student_program_linkage',
      requirement: 'Student-to-program linkage',
      requiredFields: ['student_id', 'program', 'credential', 'enrollment_date', 'scheduled_start_date', 'completion_date', 'academic_status', 'student name or documented lawful substitute'],
      dynamicallyPresent: [
        { field: 'Student ID', get: (r) => r.student_id },
        { field: 'Program', get: (r) => r.program_slug },
        { field: 'Credential', get: (r) => r.credentialName || r.credential_name },
        { field: 'Enrollment date', get: (r) => r.enrollmentDate },
        { field: 'Scheduled start date', get: (r) => r.scheduledStartDate || r.scheduled_start_date },
        { field: 'Completion date', get: (r) => r.completionDate },
        { field: 'Academic status', get: (r) => r.status },
      ],
      staticallyMissing: ['Student name (or an approved documented substitute) — students are currently tracked by an anonymized ID only, and a verified identity record has not been integrated yet'],
      sourceTables: ['students', 'enrollment_periods', 'program_versions', 'admin_student_progress (view)'],
      note: 'Credential, planned start date, and program-version data are now available from the academy\'s enrollment records. This report does not substitute a student ID for a verified identity record.',
    }),
    req({
      id: 'clock_hours_attendance',
      requirement: 'Clock hours and attendance',
      requiredFields: ['required_program_hours', 'attempted_clock_hours', 'attended_instructional_hours', 'course_start_completion_dates', 'hour_reconciliation'],
      dynamicallyPresent: [
        { field: 'Credited technical minutes', get: (r) => (r.credited_technical_minutes !== null && r.credited_technical_minutes !== undefined) ? r.credited_technical_minutes : null },
        { field: 'Credited program minutes (technical + career-readiness)', get: (r) => (r.credited_program_minutes !== null && r.credited_program_minutes !== undefined) ? r.credited_program_minutes : null },
        { field: 'Course start/completion dates', get: (r) => r.completionDate || r.completion_date || r.scheduledStartDate || r.scheduled_start_date || null },
      ],
      staticallyMissing: ['Credited minutes are fixed per-module curriculum allocations recorded on module completion, not measured attendance, session time, or browser-open duration — no time-based attendance tracking exists or is planned', 'Career-readiness (M360) completion is not yet a durable award — see student_course_hour_awards migration note'],
      sourceTables: ['portal/data.js program.compliance', 'program_course_hours', 'student_course_hour_awards', 'student_hour_reconciliation', 'admin_student_progress (view)'],
      note: 'Required program hours are defined for each program, and completed modules now award durable, per-student fixed-credit minutes (student_course_hour_awards, live). This is a curriculum-credit model, not measured attendance — a student\'s last login or open-browser time is never counted as instructional time.',
    }),
    req({
      id: 'grades_assessments_progress',
      requirement: 'Grades, assessments, and progress',
      requiredFields: ['module_scores', 'capstone_score', 'grade_scale', 'pass_fail_per_module', 'assessment_attempt_history', 'rubric_scoring_engine_version', 'correction_override_trail'],
      dynamicallyPresent: [
        { field: 'Module progress percentage', get: (r) => (r.percent_complete !== null && r.percent_complete !== undefined) ? r.percent_complete : null },
        { field: 'Capstone score', get: (r) => r.capstone_overall_score },
      ],
      staticallyMissing: ['The scoring-engine version used for each attempt is not yet stamped and stored per record', 'A record of grade corrections or overrides is not yet tracked', 'The grading scale is defined in program documentation but is not yet stored as report-queryable data'],
      sourceTables: ['module_progress', 'lab_attempts', 'capstone_submissions', 'capstone_scorecard'],
      note: 'Each student\'s real scores are read live from their record. Cohort-level completion percentage and capstone score are present; per-attempt scoring-version history and a correction trail are not.',
    }),
    req({
      id: 'labs_competency_outcomes',
      requirement: 'Labs and competency outcomes',
      requiredFields: ['lab_completion_and_date', 'rubric_result', 'evidence_artifact', 'evaluator_reviewer', 'supervision_method'],
      dynamicallyPresent: [
        { field: 'Modules completed (used as a proxy for recorded lab/module activity)', get: (r) => (r.modules_complete || 0) > 0 ? true : null },
      ],
      staticallyMissing: ['Submitted evidence artifacts are captured for the capstone module only; other modules do not yet retain one', 'An evaluator/reviewer is recorded for capstone reviews only, not for every lab or module', 'A supervision method is recorded for capstone reviews only, not as a general module-lab field'],
      sourceTables: ['lab_attempts', 'portfolio_artifacts', 'capstone_reviews'],
      note: 'Completion, date, and rubric-category score are captured per attempt. Capstone artifact submission and optional faculty review are supported; evidence and evaluator/supervision coverage for other modules remain partial.',
    }),
    req({
      id: 'current_academic_transcript',
      requirement: 'Current academic transcript',
      requiredFields: ['human_readable_individual_transcript_pdf'],
      dynamicallyPresent: [],
      staticallyMissing: [],
      sourceTables: ['buildTranscriptData()', 'renderTranscriptPdf()', 'student detail Download Transcript (PDF) action'],
      note: 'A human-readable, per-student PDF transcript is available from the admin student detail panel and the student portal. It is separate from the cohort report and from secondary JSON exports.',
    }),
    (() => {
      const id = 'annual_reporting';
      const requirement = 'Annual reporting (Form 801-style counts)';
      const requiredFields = ['reporting_period_bounds', 'withdrawn_during_period', 'completions_credentials_during_period', 'continuing_enrollment_at_period_end', 'completion_within_150pct_time', 'florida_non_florida_counts'];
      const sourceTables = ['reporting_periods', 'enrollment_periods', 'credential_awards', 'student_geography_classifications', 'admin_enrollment_reporting (view)'];
      if (queryFailed) {
        return { id, requirement, status: 'unknown', requiredFields, availableFields: [], missingFields: requiredFields, sourceTables, note: `Cohort data query failed (${context.queryError}); compliance cannot be verified this run.`, lastChecked };
      }
      const annualCounts = context.annualCounts || null;
      // I2: this is now a real, live-calculated requirement (see
      // fetchAnnualReportingCounts()), not a permanent placeholder — status
      // reflects whether a period is set, the query succeeded, and whether
      // every counted student has a verified Florida/non-Florida geography.
      if (!annualCounts) {
        return {
          id, requirement, status: 'missing', requiredFields, availableFields: [],
          missingFields: ['No reporting period is selected above — choose a period start and end to calculate enrolled, withdrawn, completed, still-enrolled, and 150%-time counts for that window.'],
          sourceTables,
          note: 'The underlying enrollment-history data distinguishes enrollment epochs, credential awards, planned completion, and geography, and this report can calculate real period-bounded counts as soon as a reporting period is chosen above.',
          lastChecked,
        };
      }
      if (annualCounts.queryError) {
        return { id, requirement, status: 'unknown', requiredFields, availableFields: [], missingFields: requiredFields, sourceTables, note: `The reporting-period query failed (${annualCounts.queryError}); annual counts cannot be verified this run.`, lastChecked };
      }
      const totalEnrolledDuring = annualCounts.enrolledDuringPeriod || 0;
      if (totalEnrolledDuring === 0) {
        return {
          id, requirement, status: 'unknown', requiredFields, availableFields: [],
          missingFields: ['No enrollment episodes matched the selected reporting period and scope, so counts cannot be verified for this run.'],
          sourceTables,
          note: 'Enrolled, withdrawn, completed, still-enrolled, and 150%-time counts are calculated live from enrollment-episode history for the selected reporting period, but no episodes fell inside it for this scope.',
          lastChecked,
        };
      }
      const geo = annualCounts.byGeography || {};
      const knownGeo = (geo.florida || 0) + (geo.non_florida || 0);
      const geographyComplete = knownGeo === totalEnrolledDuring;
      const availableFields = ['withdrawn_during_period', 'completions_credentials_during_period', 'continuing_enrollment_at_period_end', 'completion_within_150pct_time'];
      const missingFields = geographyComplete ? [] : [`Florida/non-Florida classification is missing or unverified for ${totalEnrolledDuring - knownGeo} of ${totalEnrolledDuring} students enrolled during this period — record each student's reporting geography on the planning form above before this count can be certified.`];
      return {
        id, requirement, status: missingFields.length === 0 ? 'covered' : 'partial',
        requiredFields, availableFields, missingFields, sourceTables,
        note: geographyComplete
          ? 'Enrolled, withdrawn, completed, still-enrolled, and 150%-time counts are calculated live from enrollment-episode history for the selected reporting period. Florida/non-Florida geography is recorded for every student counted.'
          : 'Enrolled, withdrawn, completed, still-enrolled, and 150%-time counts are calculated live from enrollment-episode history for the selected reporting period. See the geography gap noted for this run.',
        lastChecked,
      };
    })(),
    req({
      id: 'inspection_availability',
      requirement: 'Records available for CIE inspection',
      requiredFields: ['durable_server_side_report_storage', 'report_generation_audit_trail', 'authorized_controlled_retrieval'],
      dynamicallyPresent: [],
      staticallyMissing: ['Generated report files are currently saved by whoever downloads them, not stored centrally — the system retains only the report\'s metadata and an integrity hash, not the file itself', 'A server-side audit trail of report generation is only available once that database feature has been deployed'],
      sourceTables: ['report_generation_audit', 'finalize_report_generation_audit()', 'localStorage (convenience-only recent history)'],
      note: 'On-screen admin drill-down works for captured data. Authorized report-run audit metadata and integrity hashes are now recorded, but downloaded PDFs still need an institutional retention/storage procedure.',
    }),
  ];
}

/* ------------------------------------------------------------------- I2 */
/* Real period-bounded Form 801 counts, queried live from the already-
 * deployed admin_enrollment_reporting view (one row per enrollment episode;
 * see 20260829125000_enrollment_reporting_history.sql). Returns null when
 * no reporting period is selected (nothing to compute — caller/compliance
 * table treats that as "missing", not zero), { queryError } if the query
 * fails (never silently treated as zero either), or the computed buckets.
 * Episodes are the counting unit, not distinct students — a re-enrollment
 * is a second episode, matching the migration's append-only episode model. */
async function fetchAnnualReportingCounts(periodStart, periodEnd, trackFilter) {
  if (!periodStart || !periodEnd) return null;
  let query = mntSupabase.from('admin_enrollment_reporting').select('*');
  if (trackFilter) query = query.eq('track_code', trackFilter);
  const { data, error } = await query;
  if (error) return { queryError: error.message };

  const rows = data || [];
  const startDate = new Date(`${periodStart}T00:00:00.000Z`);
  const endDate = new Date(`${periodEnd}T23:59:59.999Z`);
  const toDate = (v) => (v ? new Date(v) : null);

  const enrolledDuring = rows.filter((r) => {
    const enrolledAt = toDate(r.enrolled_at);
    const withdrawnAt = toDate(r.withdrawn_at);
    return enrolledAt && enrolledAt <= endDate && (!withdrawnAt || withdrawnAt >= startDate);
  });
  const withdrawnDuring = rows.filter((r) => {
    const withdrawnAt = toDate(r.withdrawn_at);
    return withdrawnAt && withdrawnAt >= startDate && withdrawnAt <= endDate;
  });
  const completedDuring = rows.filter((r) => {
    const completionAt = toDate(r.completion_date);
    return completionAt && completionAt >= startDate && completionAt <= endDate;
  });
  const stillEnrolledAtEnd = rows.filter((r) => {
    const enrolledAt = toDate(r.enrolled_at);
    const withdrawnAt = toDate(r.withdrawn_at);
    const completionAt = toDate(r.completion_date);
    return enrolledAt && enrolledAt <= endDate && (!withdrawnAt || withdrawnAt > endDate) && (!completionAt || completionAt > endDate);
  });
  const completedWithin150pct = completedDuring.filter((r) => {
    const completionAt = toDate(r.completion_date);
    const deadline = toDate(r.completion_150pct_deadline);
    return completionAt && deadline && completionAt <= deadline;
  });
  const byGeography = {};
  enrolledDuring.forEach((r) => {
    const key = r.geography_classification || 'not_recorded';
    byGeography[key] = (byGeography[key] || 0) + 1;
  });

  return {
    queryError: null,
    totalEpisodesInScope: rows.length,
    enrolledDuringPeriod: enrolledDuring.length,
    withdrawnDuringPeriod: withdrawnDuring.length,
    completedDuringPeriod: completedDuring.length,
    completedWithin150pct: completedWithin150pct.length,
    stillEnrolledAtPeriodEnd: stillEnrolledAtEnd.length,
    byGeography,
  };
}

/* --------------------------------------------------------------- G2/B1/D4 */
/* Pure data builder for the cohort/annual report — no PDF/DOM work here
 * (that stays in downloadAdminReport(), Agent 4's territory). Splits out of
 * the old buildAdminReport(), which mixed dashboard metrics, a hard-coded
 * compliance table, and a roster into one function with no scope awareness.
 *
 * D4 fix: previously the report always ran against the full, unfiltered
 * `dashboardRows` regardless of what the admin had selected in the Track
 * filter / Hide Not Started controls. This now takes those two values and
 * (a) actually filters the roster by them and (b) records the applied scope
 * on the returned object so the PDF can print what was actually included —
 * "generate report for current filters" is the option implemented; "for all
 * students" is available by passing no filters. */
function buildCohortReportData(rows, options) {
  rows = Array.isArray(rows) ? rows : [];
  options = options || {};
  const trackFilter = options.trackFilter || '';
  const hideNotStarted = !!options.hideNotStarted;
  const generatedAt = new Date().toISOString();

  const scopedRows = rows.filter((row) => {
    const trackMatch = !trackFilter || row.track_code === trackFilter;
    const started = (row.modules_complete || 0) > 0 || (row.modules_in_progress || 0) > 0;
    const startedMatch = !hideNotStarted || started;
    return trackMatch && startedMatch;
  });

  // D1 fix applied per row, then rolled up into cohort counts. Distinguishes
  // withdrawn from not-yet-started instead of the old two-bucket
  // enrolled/notEnrolled split that conflated "withdrawn" with "never
  // enrolled" (remediation plan §3, D1).
  const statuses = scopedRows.map((row) => deriveAcademicStatus(row));
  const summary = {
    totalAccounts: scopedRows.length,
    enrolled: scopedRows.filter((r) => r.enrolled !== false).length,
    completed: statuses.filter((s) => s === 'completed' || s === 'credential_awarded').length,
    credentialAwarded: statuses.filter((s) => s === 'credential_awarded').length,
    active: statuses.filter((s) => s === 'active').length,
    withdrawn: statuses.filter((s) => s === 'withdrawn').length,
    withdrawnOrNeverEnrolled: statuses.filter((s) => s === 'withdrawn_or_never_enrolled').length,
    notYetStarted: statuses.filter((s) => s === 'not_yet_started').length,
    avgComplete: scopedRows.length
      ? scopedRows.reduce((sum, r) => sum + (r.percent_complete || 0), 0) / scopedRows.length
      : 0,
  };

  const state = loadAdminDashboardState();
  const reportingRequirements = evaluateReportingCompliance(scopedRows, {
    generatedAt,
    queryError: options.sourceQueryError || null,
    annualCounts: options.annualCounts || null,
  });
  // An official record is allowed only when the source query succeeded and
  // every required field is verified for this scope. Current known gaps make
  // this report a draft today; the label changes only when data earns it.
  const recordStatus = !options.sourceQueryError && reportingRequirements.length > 0
    && reportingRequirements.every((requirement) => requirement.status === 'covered')
    ? 'official'
    : 'draft';

  return {
    reportType: 'cohort_annual_report',
    generatedAt,
    asOf: generatedAt,
    sourceDataCutoff: generatedAt,
    recordStatus,
    templateVersion: REPORT_TEMPLATE_VERSION,
    source: 'the academy\'s admin enrollment and progress records',
    excludedAccounts: ['ADMIN'],
    scope: {
      trackFilter: trackFilter || null,
      hideNotStarted,
      totalRowsBeforeFilter: rows.length,
      totalRowsAfterFilter: scopedRows.length,
      // Annual reporting requires a reporting-period start/end (remediation
      // plan B1, C5). No UI or schema for that exists yet — recorded as null
      // rather than silently omitted, so the PDF can print "no period set."
      reportingPeriodStart: options.reportingPeriodStart || null,
      reportingPeriodEnd: options.reportingPeriodEnd || null,
    },
    summary,
    reportingRequirements,
    students: scopedRows.map((row) => {
      const status = deriveAcademicStatus(row);
      return {
        studentId: row.student_id,
        track: row.track_code,
        program: row.program_slug || '—',
        enrolled: row.enrolled !== false,
        academicStatus: status,
        progressState: academicStatusLabel(status),
        modulesComplete: row.modules_complete,
        modulesTotal: row.modules_total,
        percentComplete: row.percent_complete,
        capstoneScore: row.capstone_overall_score,
        lastActive: row.last_active,
        enrollmentDate: row.enrollmentDate || row.enrollment_date || null,
        completionDate: row.completionDate || row.completion_date || null,
        scheduledStartDate: row.scheduledStartDate || row.scheduled_start_date || null,
        scheduledCompletionDate: row.scheduledCompletionDate || row.scheduled_completion_date || null,
        programVersionCode: row.programVersionCode || row.program_version_code || null,
        credential: row.credentialName || row.credential_name || null,
        geographyClassification: row.geographyClassification || row.geography_classification || null,
      };
    }),
    annualCounts: options.annualCounts || null,
    annualReportingGaps: 'This roster reflects each student\'s current enrollment state, not a reporting-period snapshot. Set a reporting period start and end in the admin dashboard before generating this report to calculate official Form 801 counts (enrolled, withdrawn, and completed within that period) — do not infer period-bounded counts from the totals in this report.',
    stateSnapshot: state,
  };
}

function storeAdminReportRun(report) {
  const state = loadAdminDashboardState();
  state.reportRuns = [
    {
      generatedAt: report.generatedAt,
      summary: report.summary,
    },
    ...(state.reportRuns || []),
  ].slice(0, 10);
  saveAdminDashboardState(state);
}

/* Fetches assets/logo.png once and caches it as a data URI so jsPDF's
 * addImage() (which wants a data URI or raw base64, not a URL) can embed it.
 * Cached at module scope — repeat "Generate Report" clicks in the same
 * session reuse it instead of re-fetching. */
let _adminReportLogoDataUri = null;
async function loadAdminReportLogoDataUri() {
  if (_adminReportLogoDataUri) return _adminReportLogoDataUri;
  try {
    const res = await fetch('assets/logo.png');
    if (!res.ok) throw new Error(`Logo request returned HTTP ${res.status}`);
    const blob = await res.blob();
    _adminReportLogoDataUri = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Could not load assets/logo.png for the PDF report header', err);
    _adminReportLogoDataUri = null;
  }
  return _adminReportLogoDataUri;
}

/* Fail before a report run is recorded if the locally vendored PDF runtime is
 * unavailable. This turns a vague TypeError into an actionable admin-facing
 * message and protects the "successful report" history from false entries. */
function assertPdfRuntime() {
  if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') {
    throw new Error('The local PDF generator did not load. Refresh the portal and try again.');
  }
  const probe = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
  if (typeof probe.autoTable !== 'function') {
    throw new Error('The local PDF table renderer did not load. Refresh the portal and try again.');
  }
}

/* ============================================================ Agent 4: PDF renderers
 * Workstream E (presentation quality) + the renderer half of G2 (separate
 * builders from renderers). Everything below takes a pure data object from
 * one of Agent 3's builders (buildCohortReportData / buildTranscriptData /
 * buildEvidencePacketData) and turns it into a jsPDF document. None of these
 * functions query Supabase or touch the DOM — that stays in the builders and
 * in the thin download*Pdf() wrappers at the end of this section. */

const PDF_NAVY = [30, 58, 95];
const PDF_ORANGE = [249, 115, 22];
const PDF_GREEN = [22, 163, 74], PDF_GREEN_BG = [220, 252, 231];
const PDF_AMBER = [180, 83, 9], PDF_AMBER_BG = [255, 247, 237];
const PDF_RED = [185, 28, 28], PDF_RED_BG = [254, 226, 226];
const PDF_SLATE = [71, 85, 105], PDF_SLATE_BG = [241, 245, 249];
const PDF_BLUE = [29, 78, 216], PDF_BLUE_BG = [219, 234, 254];
const PDF_GRAY = [107, 114, 128];

/* Version the rendered record independently of the portal bundle.  A future
 * layout or field change must advance this value so an audit row can be tied
 * to the exact record template that was downloaded. */
const REPORT_TEMPLATE_VERSION = 'reporting-pdf-v1.2';

/* Five-state compliance styling shared by the cohort report's requirements
 * table and its legend (G1: never collapse partial/missing/unknown into one
 * "not covered" bucket — a reader must be able to tell them apart). */
const PDF_COMPLIANCE_STYLE = {
  covered: { label: 'Covered', fg: PDF_GREEN, bg: PDF_GREEN_BG, def: 'All required fields verified present for every record in this report’s scope.' },
  partial: { label: 'Partial', fg: PDF_AMBER, bg: PDF_AMBER_BG, def: 'Some, but not all, required fields are available.' },
  missing: { label: 'Missing', fg: PDF_RED, bg: PDF_RED_BG, def: 'None of the required fields exist in the current system.' },
  not_applicable: { label: 'N/A', fg: PDF_SLATE, bg: PDF_SLATE_BG, def: 'This requirement does not apply to the current scope.' },
  unknown: { label: 'Unknown', fg: PDF_BLUE, bg: PDF_BLUE_BG, def: 'Could not be verified this run (query failure or empty scope) — not the same as "covered."' },
};

const REPORT_AUDIT_UNAVAILABLE = 'report_audit_unavailable';

/* Report IDs are generated client-side and persisted to the Supabase audit
 * table when the local report-generation audit migration is deployed.
 * Timestamp + random suffix keeps this unique enough to correlate a printed
 * PDF back to a specific generation event in local/draft runs. */
function newReportId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function reportClassificationLabel(report) {
  return report && report.recordStatus === 'official' ? 'OFFICIAL RECORD' : 'DRAFT / INTERNAL REVIEW';
}

function complianceGapOwner(requirementId) {
  const owners = {
    student_program_linkage: 'Registrar / LMS administrator',
    clock_hours_attendance: 'Compliance leadership / LMS administrator',
    grades_assessments_progress: 'Academic lead / assessment owner',
    labs_competency_outcomes: 'Faculty evaluator / portfolio owner',
    current_academic_transcript: 'Portal engineering',
    annual_reporting: 'Registrar / compliance reporting owner',
    inspection_availability: 'Operations / records custodian',
  };
  return owners[requirementId] || 'Compliance owner';
}

function complianceGapTarget(requirement) {
  if (!requirement || requirement.status === 'covered') return 'Validate each reporting period';
  if (requirement.status === 'unknown') return 'Resolve query/scope before relying on report';
  return 'Before external CIE reporting';
}

/* The database audit table is the institutional record.  Browser storage is
 * only a convenience history and is deliberately never used as evidence that
 * a report was generated.  Keep the payload to operational metadata: never
 * send roster rows, student artifacts, or the browser-local stateSnapshot. */
function reportAuditPayload(report, reportId) {
  return {
    report_id: reportId,
    report_type: report.reportType,
    scope_parameters: {
      trackFilter: report.scope && report.scope.trackFilter || null,
      hideNotStarted: !!(report.scope && report.scope.hideNotStarted),
      reportingPeriodStart: report.scope && report.scope.reportingPeriodStart || null,
      reportingPeriodEnd: report.scope && report.scope.reportingPeriodEnd || null,
      totalRowsBeforeFilter: report.scope && report.scope.totalRowsBeforeFilter || 0,
      totalRowsAfterFilter: report.scope && report.scope.totalRowsAfterFilter || 0,
    },
    source_data_cutoff: report.asOf,
    report_classification: report.recordStatus || 'draft',
    template_version: REPORT_TEMPLATE_VERSION,
  };
}

async function assertReportGenerationAuthorized() {
  const user = await currentUser();
  if (!user || !user.isAdmin) throw new Error('Only authorized administrators may generate student-record reports.');
  return user;
}

async function startReportGenerationAudit(report, reportId) {
  const { data, error } = await mntSupabase
    .from('report_generation_audit')
    .insert(reportAuditPayload(report, reportId))
    .select('id')
    .single();
  if (error || !data) {
    const auditError = new Error('The server-side report audit record is unavailable; the local report-generation audit migration may not be applied.');
    auditError.code = REPORT_AUDIT_UNAVAILABLE;
    auditError.originalError = error || null;
    throw auditError;
  }
  return data.id;
}

function safeReportFailureReason(error) {
  // Avoid preserving stack traces, query text, or student information in the
  // audit log. The detailed browser error is not exposed to the UI either.
  const text = error && error.message ? String(error.message) : 'PDF generation failed';
  return text.slice(0, 500);
}

async function finalizeReportGenerationAudit(auditId, outcome) {
  const { error } = await mntSupabase.rpc('finalize_report_generation_audit', {
    p_audit_id: auditId,
    p_generation_status: outcome.status,
    p_file_sha256: outcome.fileHash || null,
    p_storage_reference: outcome.storageReference || null,
    p_failure_reason: outcome.failureReason || null,
  });
  if (error) throw new Error('The server-side report audit record could not be finalized.');
}

function reportAuditUnavailable(error) {
  return !!(error && (error.code === REPORT_AUDIT_UNAVAILABLE
    || /report_generation_audit|finalize_report_generation_audit|audit migration/i.test(String(error.message || ''))));
}

async function sha256Hex(arrayBuffer) {
  if (!window.crypto || !window.crypto.subtle) throw new Error('This browser cannot calculate the report integrity hash.');
  const digest = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/* Date/time WITH the viewer's timezone name, per E2 ("generated timestamp
 * and timezone"). toLocaleString() alone omits the zone. */
function formatGeneratedTimestamp(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'long' }).format(d);
  } catch (err) {
    return d.toLocaleString();
  }
}

/* E4: meaningful PDF title/author/subject/keywords/creation-date metadata,
 * not just visible on-page text. */
function applyPdfMetadata(doc, { title, subject, reportId }) {
  doc.setProperties({
    title,
    subject,
    author: 'Mission Next Technical Academy',
    creator: 'Mission Next Technical Academy Portal',
    keywords: `Mission Next Technical Academy, ${reportId}, CIE reporting, student records`,
  });
}

function fmtVal(v, dash = '—') { return (v === null || v === undefined || v === '') ? dash : String(v); }
function fmtPct(v) { return (v === null || v === undefined) ? '—' : `${Math.round(Number(v))}%`; }
function fmtDate(v) { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); }
function fmtDateTime(v) { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? '—' : d.toLocaleString(); }
function fmtScore(v) { return (v === null || v === undefined) ? '—' : (typeof v === 'number' ? v.toFixed(1) : String(v)); }

/* Repeats on EVERY page of `doc`, recomputing page width/height per page
 * rather than assuming one fixed size — the cohort report switches from
 * portrait to landscape mid-document for the roster table (E1), so a footer
 * loop that captured pageWidth once at the top would mis-center on those
 * pages. Implements E2's "page X of Y", confidentiality classification, and
 * report ID; and (when supplied) the data-source/"as of" note. */
function stampPdfFooters(doc, { reportId, confidentiality, dataSourceNote }) {
  const pageCount = doc.internal.getNumberOfPages();
  // Stacked rows, not two texts sharing one y (the old dataSourceNote/
  // confidentiality pair both sat on h-22 and visually collided on every
  // page). Reserve an extra row when dataSourceNote is present instead of
  // overlaying it on top of the confidentiality line. Height (not just
  // width) differs per page here — the cohort report mixes portrait and
  // landscape pages — so it's computed fresh inside the loop, never hoisted.
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const sep = dataSourceNote ? h - 46 : h - 34;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(40, sep, w - 40, sep);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_GRAY);
    let rowY = sep;
    if (dataSourceNote) {
      rowY += 12;
      doc.text(dataSourceNote, w / 2, rowY, { align: 'center', maxWidth: w - 80 });
    }
    rowY += 12;
    doc.text(confidentiality || 'CONFIDENTIAL — Student education record. Not for public distribution.', 40, rowY);
    doc.text(`Page ${i} of ${pageCount}`, w - 40, rowY, { align: 'right' });
    rowY += 10;
    doc.text(`Report ID: ${reportId}`, 40, rowY);
  }
}

/* Common header block: logo (left) + institution name/title/report-type
 * lines (right), used at the top of the first page of every report type.
 * Returns the Y position immediately below the header rule so callers can
 * keep laying out from there. Institution name is printed as real text (not
 * only baked into the logo image) per E2, so it still appears even when the
 * logo asset fails to load (A3: "generate without the logo, show a
 * warning" — the warning itself is surfaced by the caller via admin-report-status). */
async function drawPdfHeader(doc, { title, reportTypeLabel, metaLines }) {
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 40;
  const logoDataUri = await loadAdminReportLogoDataUri();
  if (logoDataUri) {
    const logoW = 130;
    const logoH = logoW * (174 / 1024); // source asset is 1024x174
    try {
      doc.addImage(logoDataUri, 'PNG', marginX, cursorY, logoW, logoH);
    } catch (err) {
      console.error('Could not embed logo in PDF report', err);
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Mission Next Technical Academy', marginX, cursorY + 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...PDF_NAVY);
  doc.text(title, pageWidth - marginX, 50, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_ORANGE);
  doc.text(reportTypeLabel, pageWidth - marginX, 64, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_GRAY);
  let metaY = 78;
  metaLines.forEach((line) => {
    doc.text(line, pageWidth - marginX, metaY, { align: 'right' });
    metaY += 12;
  });

  cursorY = Math.max(cursorY + 60, metaY + 6);
  doc.setDrawColor(...PDF_ORANGE);
  doc.setLineWidth(2);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  return cursorY + 22;
}

function ensureSpace(doc, cursorY, needed) {
  if (cursorY + needed > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    return 40;
  }
  return cursorY;
}

/* --------------------------------------------------------------- E: cohort */
/* renderCohortPdf(): pure renderer for buildCohortReportData()'s output.
 * Portrait for the cover/summary/compliance pages (E1), then switches to
 * landscape for the roster so a realistic student count never has to be
 * crushed into nine columns on a portrait page. autoTable repeats its head
 * row on every page it spans by default, satisfying "repeat table headers on
 * every page" without extra work. Returns the jsPDF `doc` — does not save
 * it; see downloadAdminReport() below for the save step. */
async function renderCohortPdf(cohortData, reportId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const marginX = 40;

  applyPdfMetadata(doc, {
    title: 'Mission Next Technical Academy — Cohort / Annual Progress Report',
    subject: `Cohort/annual progress report covering ${cohortData.students.length} student account(s) in scope`,
    reportId,
  });

  const scope = cohortData.scope || {};
  const periodLine = (scope.reportingPeriodStart || scope.reportingPeriodEnd)
    ? `Reporting period: ${fmtDate(scope.reportingPeriodStart)} – ${fmtDate(scope.reportingPeriodEnd)}`
    : 'Reporting period: not set (no reporting-period control exists yet — see Annual Reporting gap below)';
  const scopeLine = `Program/cohort scope: ${scope.trackFilter ? `Track ${scope.trackFilter}` : 'All tracks'}` +
    `${scope.hideNotStarted ? ', Not Started hidden' : ''} — ${scope.totalRowsAfterFilter} of ${scope.totalRowsBeforeFilter} accounts included`;

  let cursorY = await drawPdfHeader(doc, {
    title: 'Cohort / Annual Progress Report',
    reportTypeLabel: 'REPORT TYPE: COHORT / ANNUAL REPORTING SUMMARY',
    metaLines: [
      `Report ID: ${reportId}`,
      `Record status: ${reportClassificationLabel(cohortData)}`,
      `Template: ${cohortData.templateVersion || REPORT_TEMPLATE_VERSION}`,
      `Generated: ${formatGeneratedTimestamp(cohortData.generatedAt)}`,
      `As of: ${formatGeneratedTimestamp(cohortData.asOf)}`,
      periodLine,
    ],
  });

  // ---- Scope/filters box (D4/E2: the report must visibly print what it was
  // actually run against, not just imply "all students"). ---------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, doc.internal.pageSize.getWidth() - marginX * 2, 34, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_NAVY);
  doc.text(scopeLine, marginX + 10, cursorY + 14, { maxWidth: doc.internal.pageSize.getWidth() - marginX * 2 - 20 });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_GRAY);
  doc.text(`Source: ${cohortData.source}.`, marginX + 10, cursorY + 27, { maxWidth: doc.internal.pageSize.getWidth() - marginX * 2 - 20 });
  cursorY += 46;

  // ---- Cohort Summary stat grid ------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Cohort Summary', marginX, cursorY);
  cursorY += 14;
  const pageWidth1 = doc.internal.pageSize.getWidth();

  if (cohortData.recordStatus !== 'official') {
    // Box height follows the actual wrapped line count instead of a fixed
    // guess — a hardcoded 23pt fit one line, but this sentence wraps to two
    // at report-page width, so the box border used to cut through the text.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const draftLines = doc.splitTextToSize(
      'DRAFT / INTERNAL REVIEW — required source-data checks are not fully verified. This is not an official academic or annual-reporting record.',
      pageWidth1 - marginX * 2 - 18,
    );
    const draftBoxH = draftLines.length * 10 + 8;
    doc.setFillColor(...PDF_AMBER_BG);
    doc.setDrawColor(...PDF_AMBER);
    doc.roundedRect(marginX, cursorY, pageWidth1 - marginX * 2, draftBoxH, 4, 4, 'FD');
    doc.setTextColor(...PDF_AMBER);
    doc.text(draftLines, marginX + 9, cursorY + 12);
    cursorY += draftBoxH + 9;
  }

  const s = cohortData.summary;
  const stats = [
    ['Total Accounts', s.totalAccounts],
    ['Enrolled', s.enrolled],
    ['Not Yet Started', s.notYetStarted],
    ['Active', s.active],
    ['Completed', s.completed],
    ['Withdrawn', s.withdrawn + (s.withdrawnOrNeverEnrolled || 0)],
    ['Avg % Complete', `${s.avgComplete.toFixed(0)}%`],
  ];
  const statBoxW = (pageWidth1 - marginX * 2 - 6 * 8) / 7;
  const statBoxH = 48;
  stats.forEach((stat, i) => {
    const x = marginX + i * (statBoxW + 8);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cursorY, statBoxW, statBoxH, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PDF_NAVY);
    doc.text(String(stat[1]), x + statBoxW / 2, cursorY + 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(...PDF_GRAY);
    doc.text(String(stat[0]).toUpperCase(), x + statBoxW / 2, cursorY + 36, { align: 'center', maxWidth: statBoxW - 4 });
  });
  cursorY += statBoxH + 18;

  // ---- Annual reporting: real period-bounded counts (I2) when a period was
  // selected and the query succeeded; otherwise the plain-language gap
  // disclaimer, never silently omitted either way. ------------------------
  const annualCounts = cohortData.annualCounts;
  if (annualCounts && !annualCounts.queryError) {
    cursorY = ensureSpace(doc, cursorY, 92);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PDF_NAVY);
    doc.text('Annual Reporting — Period-Bounded Counts', marginX, cursorY);
    cursorY += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_GRAY);
    doc.text(`For ${fmtDate(scope.reportingPeriodStart)} – ${fmtDate(scope.reportingPeriodEnd)}. Counts are by enrollment episode, so a student who re-enrolled during this window is counted once per episode.`, marginX, cursorY, { maxWidth: pageWidth1 - marginX * 2 });
    cursorY += 14;

    const annualStats = [
      ['Enrolled During Period', annualCounts.enrolledDuringPeriod],
      ['Withdrawn During Period', annualCounts.withdrawnDuringPeriod],
      ['Completed During Period', annualCounts.completedDuringPeriod],
      ['Completed Within 150% Time', annualCounts.completedWithin150pct],
      ['Still Enrolled At Period End', annualCounts.stillEnrolledAtPeriodEnd],
    ];
    const annualBoxW = (pageWidth1 - marginX * 2 - 4 * 8) / 5;
    const annualBoxH = 48;
    annualStats.forEach((stat, i) => {
      const x = marginX + i * (annualBoxW + 8);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cursorY, annualBoxW, annualBoxH, 4, 4, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...PDF_NAVY);
      doc.text(String(stat[1]), x + annualBoxW / 2, cursorY + 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.1);
      doc.setTextColor(...PDF_GRAY);
      doc.text(String(stat[0]).toUpperCase(), x + annualBoxW / 2, cursorY + 36, { align: 'center', maxWidth: annualBoxW - 4 });
    });
    cursorY += annualBoxH + 12;

    const geo = annualCounts.byGeography || {};
    const unknownGeo = (geo.not_recorded || 0) + (geo.unknown || 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_GRAY);
    doc.text(`Florida/non-Florida, of ${annualCounts.enrolledDuringPeriod} enrolled during period: Florida ${geo.florida || 0}, Non-Florida ${geo.non_florida || 0}, Not yet recorded ${unknownGeo}.`, marginX, cursorY, { maxWidth: pageWidth1 - marginX * 2 });
    cursorY += 18;
  } else if (cohortData.annualReportingGaps) {
    cursorY = ensureSpace(doc, cursorY, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const noteBodyLines = doc.splitTextToSize(
      annualCounts && annualCounts.queryError
        ? `Could not calculate period-bounded counts this run: ${annualCounts.queryError}. Do not infer annual counts from the totals above.`
        : cohortData.annualReportingGaps,
      pageWidth1 - marginX * 2 - 20,
    );
    // Same dynamic-height fix as the DRAFT banner above: a fixed 34pt fit
    // this note's old two-line wording, but not the three lines it wraps to
    // now, so the border used to slice through the last line.
    const noteBoxH = 16 + noteBodyLines.length * 10 + 6;
    doc.setFillColor(...PDF_AMBER_BG);
    doc.setDrawColor(...PDF_AMBER);
    doc.roundedRect(marginX, cursorY, pageWidth1 - marginX * 2, noteBoxH, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_AMBER);
    doc.text('Annual reporting note:', marginX + 10, cursorY + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(noteBodyLines, marginX + 10, cursorY + 24);
    cursorY += noteBoxH + 12;
  }

  // ---- CIE reporting-requirements compliance table + legend --------------
  doc.addPage('letter', 'portrait');
  cursorY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PDF_NAVY);
  doc.text('CIE LMS Reporting Requirements — Compliance', marginX, cursorY);
  cursorY += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...PDF_GRAY);
  doc.text('Evaluated against the academy\'s CIE Minimum LMS Reporting & Recordkeeping Requirements (Rules 6E-1.003, 6E-2.004, 6E-2.0041; CIE Form 801).', marginX, cursorY);
  cursorY += 14;

  // Legend: never let a reader mistake "unknown"/"missing" for "covered" —
  // the plan explicitly forbids unsupported green "Covered" badges (G1/§3).
  doc.setFontSize(7.3);
  const legendEntries = Object.entries(PDF_COMPLIANCE_STYLE);
  let legendX = marginX;
  legendEntries.forEach(([, style]) => {
    doc.setFillColor(...style.bg);
    doc.setDrawColor(...style.fg);
    doc.roundedRect(legendX, cursorY, 68, 14, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...style.fg);
    doc.text(style.label, legendX + 34, cursorY + 9.5, { align: 'center' });
    legendX += 74;
  });
  cursorY += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(...PDF_GRAY);
  legendEntries.forEach(([key, style]) => {
    doc.text(`${style.label}: ${style.def}`, marginX, cursorY);
    cursorY += 9;
  });
  cursorY += 8;

  doc.autoTable({
    startY: cursorY,
    margin: { left: marginX, right: marginX, bottom: 60 },
    head: [['Requirement', 'Status', 'Missing / Gap Fields', 'Note']],
    body: cohortData.reportingRequirements.map((r) => [
      r.requirement,
      r.status,
      (r.missingFields || []).length ? r.missingFields.join('; ') : '—',
      r.note || '',
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 5, valign: 'top', lineColor: [226, 232, 240], lineWidth: 0.5, overflow: 'linebreak' },
    headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { cellWidth: 46, halign: 'center' },
      2: { cellWidth: 175 },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const raw = data.cell.raw;
        const style = PDF_COMPLIANCE_STYLE[raw] || PDF_COMPLIANCE_STYLE.unknown;
        data.cell.styles.fillColor = style.bg;
        data.cell.styles.textColor = style.fg;
        data.cell.styles.fontStyle = 'bold';
        data.cell.text = [style.label];
      }
    },
  });

  // ---- Student roster: landscape, wide table, empty-cohort handling ------
  doc.addPage('letter', 'landscape');
  cursorY = 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PDF_NAVY);
  doc.text(`Student Roster (${cohortData.students.length} in scope)`, marginX, cursorY);
  cursorY += 8;

  if (cohortData.students.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY);
    doc.text('No student accounts matched the selected scope/filters for this report run.', marginX, cursorY + 20);
  } else {
    doc.autoTable({
      startY: cursorY + 6,
      margin: { left: marginX, right: marginX, bottom: 60 },
      head: [['Student ID', 'Track', 'Program', 'Academic Status', 'Enrolled', 'Modules', '% Complete', 'Capstone Score', 'Last Active']],
      body: cohortData.students.map((st) => [
        st.studentId,
        st.track || '—',
        st.program,
        st.progressState,
        // Not "Not enrolled" — Academic Status already distinguishes
        // withdrawn from never-started (see deriveAcademicStatus's own
        // comment on this exact collapsing risk); repeating a blunt
        // enrolled/not-enrolled flag here just restates or contradicts it.
        st.enrolled ? 'Enrolled' : '—',
        `${fmtVal(st.modulesComplete)}/${fmtVal(st.modulesTotal)}`,
        fmtPct(st.percentComplete),
        st.capstoneScore === null || st.capstoneScore === undefined ? '—' : fmtScore(st.capstoneScore),
        st.lastActive ? new Date(st.lastActive).toLocaleDateString() : '—',
      ]),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.3 },
      headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      showHead: 'everyPage',
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = data.cell.raw === 'Enrolled' ? PDF_GREEN : PDF_GRAY;
        }
      },
    });

    // ---- Student-to-program linkage detail: a second, compact table so the
    // "Student-to-program linkage" compliance verdict above has visible
    // backing evidence in the document itself, not just an unverifiable
    // covered/partial badge (audit finding, NEXT_SESSION.md 2026-08-31). ----
    cursorY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : cursorY) + 20;
    cursorY = ensureSpace(doc, cursorY, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PDF_NAVY);
    doc.text('Student-to-Program Linkage Detail', marginX, cursorY);
    cursorY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...PDF_GRAY);
    doc.text('Backing evidence for the "Student-to-program linkage" compliance requirement above — credential, enrollment date, scheduled start, and completion date, per student in scope.', marginX, cursorY + 8, { maxWidth: doc.internal.pageSize.getWidth() - marginX * 2 });
    cursorY += 16;

    doc.autoTable({
      startY: cursorY,
      margin: { left: marginX, right: marginX, bottom: 60 },
      head: [['Student ID', 'Credential', 'Enrollment Date', 'Scheduled Start Date', 'Completion Date']],
      body: cohortData.students.map((st) => [
        st.studentId,
        st.credential || '—',
        st.enrollmentDate ? new Date(st.enrollmentDate).toLocaleDateString() : '—',
        st.scheduledStartDate ? new Date(st.scheduledStartDate).toLocaleDateString() : '—',
        st.completionDate ? new Date(st.completionDate).toLocaleDateString() : '—',
      ]),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.3 },
      headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      showHead: 'everyPage',
    });
  }

  stampPdfFooters(doc, {
    reportId,
    confidentiality: 'CONFIDENTIAL — Student education records. Distribute only to authorized personnel.',
    dataSourceNote: `Source: ${cohortData.source} — as of ${formatGeneratedTimestamp(cohortData.asOf)}`,
  });

  return doc;
}

/* --------------------------------------------------------- I: progress snapshot PDF */
/* renderProgressSnapshotPdf(): human-readable companion to the JSON recovery
 * file the bulk "Save Progress File (All Students)" button downloads. The
 * JSON stays the restore-workflow artifact (ADMIN_RESET_FLOW.md); this is a
 * plain roster table for a human to skim, styled after the cohort report's
 * header/footer/roster conventions but deliberately lighter — no compliance
 * table, no audit trail (see downloadProgressSnapshotPdf() below): it's a
 * working reference snapshot, not a durable institutional record. */
async function renderProgressSnapshotPdf(scopedRows, options, reportId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
  const marginX = 40;

  applyPdfMetadata(doc, {
    title: 'Mission Next Technical Academy — Student Progress Snapshot',
    subject: `Student progress snapshot covering ${scopedRows.length} student account(s) in scope`,
    reportId,
  });

  const scopeLine = `Scope: ${options.trackFilter ? `Track ${options.trackFilter}` : 'All tracks'}` +
    `${options.hideNotStarted ? ', Not Started hidden' : ''}, enrolled students only — ${scopedRows.length} account(s) included`;

  let cursorY = await drawPdfHeader(doc, {
    title: 'Student Progress Snapshot',
    reportTypeLabel: 'REPORT TYPE: PROGRESS SNAPSHOT (WORKING REFERENCE)',
    metaLines: [
      `Report ID: ${reportId}`,
      `Generated: ${formatGeneratedTimestamp(options.capturedAt)}`,
    ],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_AMBER_BG);
  doc.setDrawColor(...PDF_AMBER);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 24, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_AMBER);
  doc.text('Working reference snapshot — not an official record and not a substitute for the Cohort / Annual Progress Report.', marginX + 9, cursorY + 15, { maxWidth: pageWidth - marginX * 2 - 18 });
  cursorY += 32;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 20, 4, 4, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_NAVY);
  doc.text(scopeLine, marginX + 10, cursorY + 13, { maxWidth: pageWidth - marginX * 2 - 20 });
  cursorY += 32;

  cursorY = ensureSpace(doc, cursorY, 20);

  if (scopedRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY);
    doc.text('No enrolled student accounts matched the selected scope for this snapshot.', marginX, cursorY + 14);
  } else {
    doc.autoTable({
      startY: cursorY,
      margin: { left: marginX, right: marginX, bottom: 60 },
      head: [['Student ID', 'Track', 'Program', 'Enrollment', '% Complete', 'Modules', 'Capstone Score', 'Last Active']],
      body: scopedRows.map((row) => [
        row.student_id,
        row.track_code || '—',
        row.program_slug || '—',
        row.adminStateLabel || (row.enrolled !== false ? 'Enrolled' : 'Disenrolled'),
        fmtPct(row.percent_complete),
        `${fmtVal(row.modules_complete)}/${fmtVal(row.modules_total)}`,
        (row.capstone_overall_score === null || row.capstone_overall_score === undefined) ? '—' : fmtScore(row.capstone_overall_score),
        row.last_active ? new Date(row.last_active).toLocaleDateString() : '—',
      ]),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.3 },
      headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      showHead: 'everyPage',
    });
  }

  stampPdfFooters(doc, {
    reportId,
    confidentiality: 'CONFIDENTIAL — Student education records. Distribute only to authorized personnel.',
    dataSourceNote: `Source: admin dashboard current-state roster — as of ${formatGeneratedTimestamp(options.capturedAt)}`,
  });

  return doc;
}

async function downloadProgressSnapshotPdf(scopedRows, options) {
  assertPdfRuntime();
  const reportId = newReportId('PS');
  const doc = await renderProgressSnapshotPdf(scopedRows, options, reportId);
  const dateStamp = new Date(options.capturedAt).toISOString().slice(0, 10);
  await doc.save(`student-progress-snapshots-${dateStamp}.pdf`, { returnPromise: true });
  return reportId;
}

async function renderComplianceGapPdf(report, reportId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
  applyPdfMetadata(doc, {
    title: 'Mission Next Technical Academy — Internal Compliance Gap Report',
    subject: `Internal compliance-gap report for ${report.scope.totalRowsAfterFilter} student account(s) in scope`,
    reportId,
  });

  let cursorY = await drawPdfHeader(doc, {
    title: 'Internal Compliance Gap Report',
    reportTypeLabel: 'REPORT TYPE: INTERNAL COMPLIANCE GAP REPORT',
    metaLines: [
      `Report ID: ${reportId}`,
      `Generated: ${formatGeneratedTimestamp(report.generatedAt)}`,
      `Scope: ${report.scope.trackFilter || 'All tracks'}; ${report.scope.totalRowsAfterFilter} of ${report.scope.totalRowsBeforeFilter} account(s)`,
      `Period: ${report.scope.reportingPeriodStart || 'Not set'} to ${report.scope.reportingPeriodEnd || 'Not set'}`,
    ],
  });

  const marginX = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_AMBER_BG);
  doc.setDrawColor(...PDF_AMBER);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 40, 4, 4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_AMBER);
  doc.text('Internal use only. This report identifies gaps; it must not be sent as proof that a requirement is covered unless the Status column says Covered and the evidence/source columns support that status.', marginX + 10, cursorY + 17, { maxWidth: pageWidth - marginX * 2 - 20 });
  cursorY += 56;

  doc.autoTable({
    startY: cursorY,
    margin: { left: marginX, right: marginX, bottom: 60 },
    head: [['Requirement', 'Status', 'Data source', 'Evidence included', 'Missing fields', 'Owner', 'Remediation target', 'Last validation']],
    body: report.reportingRequirements.map((r) => {
      const style = PDF_COMPLIANCE_STYLE[r.status] || PDF_COMPLIANCE_STYLE.unknown;
      return [
        r.requirement,
        style.label,
        (r.sourceTables || []).join('; ') || 'Not recorded',
        (r.availableFields || []).join('; ') || 'None verified',
        (r.missingFields || []).join('; ') || 'None',
        complianceGapOwner(r.id),
        complianceGapTarget(r),
        fmtDateTime(r.lastChecked),
      ];
    }),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.35, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 118 },
      3: { cellWidth: 112 },
      4: { cellWidth: 156 },
      5: { cellWidth: 82 },
      6: { cellWidth: 82 },
      7: { cellWidth: 70 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const raw = String(data.cell.raw || '').toLowerCase();
        const statusKey = Object.keys(PDF_COMPLIANCE_STYLE).find((k) => PDF_COMPLIANCE_STYLE[k].label.toLowerCase() === raw) || 'unknown';
        data.cell.styles.textColor = PDF_COMPLIANCE_STYLE[statusKey].fg;
      }
    },
  });

  stampPdfFooters(doc, {
    reportId,
    confidentiality: 'INTERNAL — Compliance remediation planning. Do not use as an external attestation.',
    dataSourceNote: `Source: ${report.source} — as of ${formatGeneratedTimestamp(report.asOf)}`,
  });
  return doc;
}

async function downloadComplianceGapReport(report) {
  assertPdfRuntime();
  await assertReportGenerationAuthorized();
  const reportId = newReportId('CG');
  const doc = await renderComplianceGapPdf(report, reportId);
  const dateStamp = new Date().toISOString().slice(0, 10);
  await doc.save(`internal-compliance-gap-report-${dateStamp}-${reportId}.pdf`, { returnPromise: true });
  return reportId;
}

/* Thin wrapper: build reportId + filename, render, save. Keeps the actual
 * generation logic (renderCohortPdf) independently callable/testable per
 * G2. */
async function downloadAdminReport(report) {
  assertPdfRuntime();
  await assertReportGenerationAuthorized();
  const reportId = newReportId('CR');
  let auditId = null;
  let auditWarning = null;
  try {
    auditId = await startReportGenerationAudit(report, reportId);
  } catch (error) {
    if (!reportAuditUnavailable(error)) throw error;
    auditWarning = 'Server-side audit migration unavailable; downloaded PDF is draft-only and must not be treated as a durable institutional record.';
  }
  try {
    const doc = await renderCohortPdf(report, reportId);
    if (auditWarning) {
      doc.setPage(1);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_AMBER);
      doc.text(auditWarning, 40, doc.internal.pageSize.getHeight() - 46, {
        maxWidth: doc.internal.pageSize.getWidth() - 80,
      });
    }
    const pdfBytes = doc.output('arraybuffer');
    const fileHash = await sha256Hex(pdfBytes);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `cohort-annual-report-${dateStamp}-${reportId}.pdf`;
    // jsPDF's promise resolves after it has handed the browser the download.
    await doc.save(filename, { returnPromise: true });
    if (auditId) {
      await finalizeReportGenerationAudit(auditId, {
        status: 'succeeded',
        fileHash,
        storageReference: `browser-download:${filename}`,
      });
    }
    return { reportId, fileHash, recordStatus: report.recordStatus || 'draft', auditWarning };
  } catch (error) {
    if (auditId) {
      try {
        await finalizeReportGenerationAudit(auditId, {
          status: 'failed',
          failureReason: safeReportFailureReason(error),
        });
      } catch (_) {
        // The user sees a generic failure below. Do not leak implementation
        // details or student data through the console/status area.
      }
    }
    throw error;
  }
}

/* ----------------------------------------------------------- B2: transcript */
/* renderTranscriptPdf(): pure renderer for buildTranscriptData()'s output.
 * Portrait letter throughout (E1). Every field in plan §5 Workstream B2 is
 * either printed from real data or explicitly labeled as missing/not
 * recorded — nothing here is fabricated. Fields B2 requires that
 * buildTranscriptData() cannot currently supply (a verified legal student
 * name, attempted/attended clock hours) are called out by name so a later
 * agent knows exactly what's still missing; see the final report-back for
 * the pointer to Agent 5/6. */
async function renderTranscriptPdf(transcriptData, reportId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const marginX = 40;

  const programTitle = transcriptData.program ? transcriptData.program.title : 'No program on file';
  applyPdfMetadata(doc, {
    title: `Mission Next Technical Academy — Academic Transcript — ${transcriptData.studentId}`,
    subject: `Individual academic transcript for student ${transcriptData.studentId} (${programTitle})`,
    reportId,
  });

  let cursorY = await drawPdfHeader(doc, {
    title: 'Academic Transcript',
    reportTypeLabel: 'REPORT TYPE: INDIVIDUAL ACADEMIC TRANSCRIPT',
    metaLines: [
      `Transcript ID: ${reportId}`,
      `Generated: ${formatGeneratedTimestamp(transcriptData.generatedAt)}`,
      `As of: ${formatGeneratedTimestamp(transcriptData.asOf)}`,
    ],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const colGap = 16;
  const colW = (pageWidth - marginX * 2 - colGap) / 2;

  function kvBlock(x, y, w, pairs) {
    let yy = y;
    pairs.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...PDF_GRAY);
      doc.text(label.toUpperCase(), x, yy);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...PDF_NAVY);
      const lines = doc.splitTextToSize(String(value), w);
      doc.text(lines, x, yy + 11);
      const valueHeight = lines.length * (9.5 * 1.15);
      yy += Math.max(28, 11 + valueHeight + 6);
    });
    return yy;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Student & Program Identification', marginX, cursorY);
  cursorY += 12;

  const leftPairs = [
    ['Student Identifier', transcriptData.studentId],
    ['Student Name', 'Not available — this system identifies students by anonymized ID only'],
    ['Track / Program', `${fmtVal(transcriptData.track)} — ${programTitle}`],
    ['Credential', transcriptData.program ? fmtVal(transcriptData.program.credential, 'Not recorded') : 'Not recorded'],
  ];
  const rightPairs = [
    ['Current Academic Status', transcriptData.enrollment.statusLabel],
    ['Enrollment Date', fmtDate(transcriptData.enrollment.enrollmentDate)],
    ['Scheduled Start Date', fmtDate(transcriptData.enrollment.scheduledStartDate)],
    ['Completion / Graduation Date', fmtDate(transcriptData.enrollment.completionDate)],
    ['Withdrawal Date', fmtDate(transcriptData.enrollment.withdrawalDate)],
  ];
  const leftEnd = kvBlock(marginX, cursorY, colW, leftPairs);
  const rightEnd = kvBlock(marginX + colW + colGap, cursorY, colW, rightPairs);
  cursorY = Math.max(leftEnd, rightEnd) + 4;

  cursorY = ensureSpace(doc, cursorY, 90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Program Hours', marginX, cursorY);
  cursorY += 12;
  const rp = transcriptData.requiredProgramHours;
  // rp.technical (70) is technical+lab combined per portal/data.js's
  // compliance schema; lecture-only hours are that minus lab (40), so this
  // row's three numbers are truly additive: 30 + 40 + 12 = 82 (rp.total).
  const lectureOnlyHours = (rp && rp.technical != null && rp.lab != null) ? rp.technical - rp.lab : null;
  const hoursPairs = rp ? [
    ['Required Program Hours (Total)', fmtVal(rp.total)],
    ['Technical / Lab / Career Hours', `${fmtVal(lectureOnlyHours)} / ${fmtVal(rp.lab)} / ${fmtVal(rp.career)}`],
  ] : [['Required Program Hours', 'Not available — no program on file']];
  const hoursPairs2 = [
    ['Attempted Clock Hours (Fixed Credit)', fmtVal(transcriptData.attemptedClockHours, 'Not recorded')],
    ['Credited Instructional Hours (Fixed Credit)', fmtVal(transcriptData.attendedInstructionalHours, 'Not recorded')],
  ];
  const hLeftEnd = kvBlock(marginX, cursorY, colW, hoursPairs);
  const hRightEnd = kvBlock(marginX + colW + colGap, cursorY, colW, hoursPairs2);
  cursorY = Math.max(hLeftEnd, hRightEnd);
  if (transcriptData.hoursNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_AMBER);
    const noteLines = doc.splitTextToSize(transcriptData.hoursNote, pageWidth - marginX * 2);
    doc.text(noteLines, marginX, cursorY);
    cursorY += noteLines.length * (7 * 1.15) + 10;
  }

  // ---- Module-by-module table --------------------------------------------
  cursorY = ensureSpace(doc, cursorY, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text(`Course / Module Record — Grade scale: ${fmtVal(transcriptData.gradeScale)}`, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
  cursorY += 10;

  if (!transcriptData.modules || transcriptData.modules.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY);
    doc.text('No module records available for this student/program.', marginX, cursorY + 14);
    cursorY += 30;
  } else {
    doc.autoTable({
      startY: cursorY + 6,
      margin: { left: marginX, right: marginX, bottom: 60 },
      head: [['Module', 'Start Date', 'Completion Date', 'Attempted / Attended Hrs', 'Score', 'Grade']],
      body: transcriptData.modules.map((m) => [
        m.title,
        fmtDate(m.startedAt),
        fmtDate(m.completedAt),
        `${fmtVal(m.attemptedHours, '0')} / ${fmtVal(m.attendedHours, '0')}`,
        fmtScore(m.score),
        m.grade,
      ]),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.4 },
      headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const raw = data.cell.raw;
          data.cell.styles.textColor = raw === 'Pass' ? PDF_GREEN : (raw === 'Fail' ? PDF_RED : PDF_GRAY);
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    cursorY = doc.lastAutoTable.finalY + 20;
  }

  // ---- Progress & outcome summary ----------------------------------------
  cursorY = ensureSpace(doc, cursorY, 130);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Progress, Grades & Final Outcome', marginX, cursorY);
  cursorY += 12;
  const outcomePairs = [
    ['Progress Percentage', fmtPct(transcriptData.progressPercentage)],
    ['Academic Average', transcriptData.academicAverage === null ? 'Not available' : fmtScore(transcriptData.academicAverage)],
    ['Capstone Outcome', fmtVal(transcriptData.capstoneOutcome)],
    ['Total Credited Hours', fmtVal(transcriptData.attendedInstructionalHours, 'Not recorded')],
  ];
  const outcomePairs2 = [
    ['Program Completion (verifiable conditions)', transcriptData.programCompletionAssessment.status === 'all_currently_verifiable_conditions_met' ? 'All currently-verifiable conditions met' : 'Incomplete'],
    ['Credential Award Status', fmtVal(transcriptData.credentialAwardStatus)],
  ];
  const oLeftEnd = kvBlock(marginX, cursorY, colW, outcomePairs);
  const oRightEnd = kvBlock(marginX + colW + colGap, cursorY, colW, outcomePairs2);
  cursorY = Math.max(oLeftEnd, oRightEnd);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_AMBER);
  doc.text(transcriptData.programCompletionAssessment.note, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });
  cursorY += 26;

  // ---- Certification / signature block -----------------------------------
  cursorY = ensureSpace(doc, cursorY, 100);
  doc.setDrawColor(...PDF_NAVY);
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 88, 4, 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Certification', marginX + 12, cursorY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_GRAY);
  doc.text('This transcript reflects data currently recorded in the Mission Next Technical Academy learning management system as of the date above. It is not a certified official transcript of record until signed below by an authorized institutional official.', marginX + 12, cursorY + 29, { maxWidth: pageWidth - marginX * 2 - 24 });
  doc.setDrawColor(...PDF_GRAY);
  doc.line(marginX + 12, cursorY + 68, marginX + 220, cursorY + 68);
  doc.line(marginX + 250, cursorY + 68, marginX + 340, cursorY + 68);
  doc.line(marginX + 370, cursorY + 68, pageWidth - marginX - 12, cursorY + 68);
  doc.setFontSize(7);
  doc.text('Authorized Signature', marginX + 12, cursorY + 78);
  doc.text('Title', marginX + 250, cursorY + 78);
  doc.text('Date', marginX + 370, cursorY + 78);

  stampPdfFooters(doc, {
    reportId,
    confidentiality: 'CONFIDENTIAL — FERPA-protected student education record. Distribute only to the student or authorized personnel.',
    dataSourceNote: `Source: Supabase (live query at export time) — as of ${formatGeneratedTimestamp(transcriptData.asOf)}`,
  });

  return doc;
}

async function downloadTranscriptPdf(studentId, identity) {
  assertPdfRuntime();
  const transcriptData = await buildTranscriptData(studentId, identity);
  const reportId = newReportId('TR');
  const doc = await renderTranscriptPdf(transcriptData, reportId);
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`transcript-${studentId}-${dateStamp}-${reportId}.pdf`);
  return reportId;
}

/* ------------------------------------------------------------- B3: evidence */
/* renderEvidencePdf(): pure renderer for buildEvidencePacketData()'s output.
 * Portrait letter, accompanies (never replaces) the transcript. Evaluator/
 * supervision fields legitimately read "not recorded" here — that is Agent
 * 3's honest data, not a rendering shortcut (Agent 7 owns actually building
 * that workflow). */
async function renderEvidencePdf(evidenceData, reportId) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const marginX = 40;

  applyPdfMetadata(doc, {
    title: `Mission Next Technical Academy — Supporting Evidence Record — ${evidenceData.studentId}`,
    subject: `Lab/competency supporting-evidence record for student ${evidenceData.studentId}`,
    reportId,
  });

  let cursorY = await drawPdfHeader(doc, {
    title: 'Supporting Evidence Record',
    reportTypeLabel: 'REPORT TYPE: INDIVIDUAL SUPPORTING-EVIDENCE RECORD',
    metaLines: [
      `Record ID: ${reportId}`,
      `Student ID: ${evidenceData.studentId}`,
      `Track: ${fmtVal(evidenceData.track)}`,
      `Generated: ${formatGeneratedTimestamp(evidenceData.generatedAt)}`,
    ],
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text(`Labs & Activities (${evidenceData.labs.length})`, marginX, cursorY);
  cursorY += 8;

  if (evidenceData.labs.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY);
    doc.text('No lab attempts recorded for this student.', marginX, cursorY + 16);
    cursorY += 30;
  } else {
    doc.autoTable({
      startY: cursorY + 6,
      margin: { left: marginX, right: marginX, bottom: 60 },
      head: [['Module', 'Lab', 'Status', 'Completed', 'Score', 'Evaluator', 'Supervision']],
      body: evidenceData.labs.map((l) => [
        l.moduleTitle,
        l.labTitle,
        l.completionStatus,
        fmtDate(l.completedAt),
        fmtScore(l.score),
        l.evaluatorReviewer || 'Not requested',
        l.supervisionMethod || 'Not recorded',
      ]),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 4.5, lineColor: [226, 232, 240], lineWidth: 0.4, overflow: 'linebreak' },
      headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.8 },
      columnStyles: { 5: { textColor: PDF_AMBER }, 6: { textColor: PDF_AMBER } },
    });
    cursorY = doc.lastAutoTable.finalY + 18;

    // ---- Rubric-category breakdown, flattened across all labs -------------
    const rubricRows = [];
    evidenceData.labs.forEach((l) => {
      if (l.rubricBreakdown && typeof l.rubricBreakdown === 'object') {
        Object.entries(l.rubricBreakdown).forEach(([k, v]) => {
          if (typeof v === 'number' || typeof v === 'string') rubricRows.push([l.labTitle, k, String(v)]);
        });
      }
    });
    if (rubricRows.length) {
      cursorY = ensureSpace(doc, cursorY, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PDF_NAVY);
      doc.text('Rubric-Category / Competency Breakdown', marginX, cursorY);
      doc.autoTable({
        startY: cursorY + 6,
        margin: { left: marginX, right: marginX, bottom: 60 },
        head: [['Lab', 'Rubric Category / Competency', 'Value']],
        body: rubricRows,
        theme: 'striped',
        styles: { font: 'helvetica', fontSize: 7.3, cellPadding: 4 },
        headStyles: { fillColor: PDF_SLATE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      });
      cursorY = doc.lastAutoTable.finalY + 20;
    }
  }

  // ---- Artifact / evaluator provenance note -------------------------------
  cursorY = ensureSpace(doc, cursorY, 40);
  doc.setFillColor(...PDF_AMBER_BG);
  doc.setDrawColor(...PDF_AMBER);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 32, 4, 4, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(...PDF_AMBER);
  doc.text('Capstone submissions are retained as append-only portfolio artifacts with database-calculated SHA-256 digests. Faculty review is optional for the capstone; a missing review is not approval. Other module artifacts are not yet included in this record.', marginX + 10, cursorY + 18, { maxWidth: pageWidth - marginX * 2 - 20 });
  cursorY += 46;

  // ---- Capstone section -----------------------------------------------
  cursorY = ensureSpace(doc, cursorY, 140);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Capstone', marginX, cursorY);
  cursorY += 12;
  const cap = evidenceData.capstone;
  if (!cap || cap.status === 'not_applicable') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_GRAY);
    doc.text(cap ? cap.statusLabel : 'Not applicable — this track has no capstone module.', marginX, cursorY + 14);
    cursorY += 30;
  } else {
    const colGap = 16;
    const colW = (pageWidth - marginX * 2 - colGap) / 2;
    function kv(x, y, w, pairs) {
      let yy = y;
      pairs.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...PDF_GRAY);
        doc.text(label.toUpperCase(), x, yy);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...PDF_NAVY);
        doc.text(String(value), x, yy + 11, { maxWidth: w });
        yy += 26;
      });
      return yy;
    }
    const gate = cap.criticalErrorGate || {};
    const critList = gate.criticalErrorsOnPassingSubmission || gate.criticalErrorsOnLatestAttempt;
    const leftEnd = kv(marginX, cursorY, colW, [
      ['Final Outcome', cap.statusLabel],
      ['Score', fmtScore(cap.score)],
      ['Submitted', fmtDate(cap.submittedAt)],
    ]);
    const rightEnd = kv(marginX + colW + colGap, cursorY, colW, [
      ['Critical-Error Result', (critList && critList.length) ? `${critList.length} critical error(s) recorded — disqualifying` : 'Zero critical errors on record'],
      ['Faculty Review', cap.review ? `${cap.review.status}${cap.review.outcome ? ` · ${cap.review.outcome}` : ''}` : 'Not requested'],
      ['Supervision Method', cap.review ? cap.review.supervisionMethod : 'Optional faculty review'],
    ]);
    cursorY = Math.max(leftEnd, rightEnd);

    if (cap.scorecard) {
      cursorY = ensureSpace(doc, cursorY, 60);
      const dims = [
        ['Investigation', cap.scorecard.investigationAccuracy],
        ['Detection', cap.scorecard.detectionScore],
        ['Threat Hunting', cap.scorecard.threatHuntingScore],
        ['Incident Response', cap.scorecard.incidentResponseScore],
        ['Vulnerability', cap.scorecard.vulnerabilityScore],
        ['Reporting', cap.scorecard.reportingScore],
      ];
      doc.autoTable({
        startY: cursorY + 4,
        margin: { left: marginX, right: marginX, bottom: 60 },
        head: [dims.map((d) => d[0])],
        body: [dims.map((d) => fmtScore(d[1]))],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 5, halign: 'center' },
        headStyles: { fillColor: PDF_NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      });
      cursorY = doc.lastAutoTable.finalY + 14;
    }
  }

  // ---- Corrections / overrides -------------------------------------------
  cursorY = ensureSpace(doc, cursorY, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PDF_NAVY);
  doc.text('Corrections / Overrides', marginX, cursorY);
  cursorY += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_GRAY);
  const correctionsText = (evidenceData.correctionsOrOverrides && evidenceData.correctionsOrOverrides.length)
    ? `${evidenceData.correctionsOrOverrides.length} correction(s)/override(s) on record.`
    : (evidenceData.correctionsNote || 'None on record.');
  doc.text(correctionsText, marginX, cursorY, { maxWidth: pageWidth - marginX * 2 });

  stampPdfFooters(doc, {
    reportId,
    confidentiality: 'CONFIDENTIAL — FERPA-protected student education record. Distribute only to the student or authorized personnel.',
    dataSourceNote: `Source: Supabase (live query at export time) — as of ${formatGeneratedTimestamp(evidenceData.asOf)}`,
  });

  return doc;
}

async function downloadEvidencePdf(studentId, identity) {
  assertPdfRuntime();
  const evidenceData = await buildEvidencePacketData(studentId, identity);
  const reportId = newReportId('EV');
  const doc = await renderEvidencePdf(evidenceData, reportId);
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`evidence-record-${studentId}-${dateStamp}-${reportId}.pdf`);
  return reportId;
}

/* ------------------------------------------------ per-student data layer */
/* Shared Supabase fetch used by both buildTranscriptData() and
 * buildEvidencePacketData() (G2: split data acquisition from the old
 * monolithic buildStudentExportRecord(), without re-running five queries
 * twice per report). Same four-table + students pattern as the Sprint H.1
 * admin drill-down and the original buildStudentExportRecord(). */
async function fetchStudentProgressBundle(userId, trackCode) {
  if (!userId || !trackCode) {
    const error = 'userId/trackCode missing — could not query Supabase progress tables for this student';
    console.error('fetchStudentProgressBundle:', error);
    return { error, moduleProgressRows: [], labAttemptRows: [], capstoneSubmissionRows: [], scorecardRow: null, artifactRows: [], capstoneReviewRows: [], studentRow: null };
  }
  // students is queried directly (not through admin_student_progress, which
  // is admin_only() gated) so this works for a student reading their own
  // record — students_self_read (20260828120000_students_admin.sql) already
  // grants that.
  const [moduleRes, labRes, capstoneRes, scorecardRes, artifactRes, reviewRes, studentRes, hourAwardRes] = await Promise.all([
    mntSupabase.from('module_progress').select('*').eq('user_id', userId).eq('track_code', trackCode),
    mntSupabase.from('lab_attempts').select('*').eq('user_id', userId).eq('track_code', trackCode),
    mntSupabase.from('capstone_submissions').select('*').eq('user_id', userId).eq('track_code', trackCode).order('stage', { ascending: true }),
    mntSupabase.from('capstone_scorecard').select('*').eq('user_id', userId).eq('track_code', trackCode).maybeSingle(),
    mntSupabase.from('portfolio_artifacts').select('*').eq('user_id', userId).eq('track_code', trackCode).order('submitted_at', { ascending: false }),
    mntSupabase.from('capstone_reviews').select('*').eq('user_id', userId).eq('track_code', trackCode).order('created_at', { ascending: false }),
    mntSupabase.from('students').select('is_enrolled, enrollment_date, withdrawal_date, scheduled_start_date, completion_date').eq('user_id', userId).maybeSingle(),
    // Added by the local-only fixed-credit migration. Keep a missing, not-yet-
    // applied table separate from the core academic-data query status.
    mntSupabase.from('student_course_hour_awards').select('*').eq('user_id', userId).eq('track_code', trackCode),
  ]);
  const errors = [];
  if (moduleRes.error) errors.push(`module_progress: ${moduleRes.error.message}`);
  if (labRes.error) errors.push(`lab_attempts: ${labRes.error.message}`);
  if (capstoneRes.error) errors.push(`capstone_submissions: ${capstoneRes.error.message}`);
  if (scorecardRes.error) errors.push(`capstone_scorecard: ${scorecardRes.error.message}`);
  if (artifactRes.error) errors.push(`portfolio_artifacts: ${artifactRes.error.message}`);
  if (reviewRes.error) errors.push(`capstone_reviews: ${reviewRes.error.message}`);
  if (studentRes.error) errors.push(`students: ${studentRes.error.message}`);
  if (hourAwardRes.error) console.warn('fetchStudentProgressBundle: fixed-credit awards unavailable:', hourAwardRes.error.message);
  if (errors.length) errors.forEach((e) => console.error('fetchStudentProgressBundle:', e));
  return {
    error: errors.length ? errors.join('; ') : null,
    moduleProgressRows: moduleRes.data || [],
    labAttemptRows: labRes.data || [],
    capstoneSubmissionRows: capstoneRes.data || [],
    scorecardRow: scorecardRes.data || null,
    artifactRows: artifactRes.data || [],
    capstoneReviewRows: reviewRes.data || [],
    studentRow: studentRes.data || null,
    hourAwardRows: hourAwardRes.data || [],
    hourAwardError: hourAwardRes.error ? hourAwardRes.error.message : null,
  };
}

/* Per-module grades: real module_progress state/percent, plus each module's
 * best lab_attempts score (LABS' `module` field maps lab_key -> module_key).
 * `result` (rubric-category breakdown jsonb) is kept on each lab attempt for
 * buildEvidencePacketData() — the old buildStudentExportRecord() dropped it. */
function computeModuleScores(program, moduleProgressRows, labAttemptRows) {
  const moduleKeys = Object.keys(program.modules || {});
  return moduleKeys.map((moduleKey) => {
    const module = program.modules[moduleKey];
    const progressRow = moduleProgressRows.find((m) => m.module_key === moduleKey) || null;
    const labKeysForModule = LABS.filter((l) => l.module === moduleKey).map((l) => l.key);
    const attemptsForModule = labAttemptRows.filter((l) => labKeysForModule.includes(l.lab_key));
    const bestAttempt = attemptsForModule.reduce((best, a) => {
      const aScore = a.score === null || a.score === undefined ? -Infinity : Number(a.score);
      const bestScore = best && best.score !== null && best.score !== undefined ? Number(best.score) : -Infinity;
      return aScore > bestScore ? a : best;
    }, null);
    const state = progressRow ? progressRow.state : 'not_started';
    return {
      moduleKey,
      title: module.title,
      state,
      status: adminStateLabel(state),
      percent: progressRow ? progressRow.percent : 0,
      startedAt: progressRow ? progressRow.started_at : null,
      completedAt: progressRow ? progressRow.completed_at : null,
      completed: state === 'complete',
      creditMinutes: Number(module.creditMinutes || module.durationMinutes || 0),
      bestLabScore: bestAttempt && bestAttempt.score !== null && bestAttempt.score !== undefined ? Number(bestAttempt.score) : null,
      labAttempts: attemptsForModule.map((a) => ({
        labKey: a.lab_key,
        title: adminLabLabel(a.lab_key),
        state: a.state,
        score: a.score === null || a.score === undefined ? null : Number(a.score),
        startedAt: a.started_at,
        completedAt: a.completed_at,
        rubricResult: a.result || null,
      })),
    };
  });
}

/* Decision 2 / Option 1: fixed course credit, not time tracking. Attempted
 * means a student started or completed an approved technical module; credited
 * instructional hours mean the module is complete. Browser-open time,
 * last_active, and idle time are deliberately excluded. */
function computeFixedCreditHours(program, moduleScores, awardRows, awardError) {
  const toHours = (minutes) => Number((minutes / 60).toFixed(2));
  const technicalRequiredMinutes = moduleScores.reduce((sum, m) => sum + m.creditMinutes, 0);
  const attemptedMinutes = moduleScores
    .filter((m) => m.state === 'in_progress' || m.completed)
    .reduce((sum, m) => sum + m.creditMinutes, 0);
  const calculatedCreditedMinutes = moduleScores
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.creditMinutes, 0);
  const durableTechnicalMinutes = (awardRows || [])
    .filter((award) => award.classification === 'technical')
    .reduce((sum, award) => sum + Number(award.credit_minutes || 0), 0);
  const durableCareerMinutes = (awardRows || [])
    .filter((award) => award.classification === 'career_readiness')
    .reduce((sum, award) => sum + Number(award.credit_minutes || 0), 0);
  const hasDurableAwards = !awardError;
  const careerRequiredMinutes = program && program.careerReadiness
    ? Number(program.careerReadiness.durationMinutes || 0)
    : 0;
  const programRequiredMinutes = program && program.compliance
    ? Number(program.compliance.totalHours || 0) * 60
    : technicalRequiredMinutes + careerRequiredMinutes;
  const creditedTechnicalMinutes = hasDurableAwards ? durableTechnicalMinutes : calculatedCreditedMinutes;
  const creditedProgramMinutes = creditedTechnicalMinutes + durableCareerMinutes;

  return {
    model: 'fixed_credit_per_course',
    attemptedClockHours: toHours(attemptedMinutes),
    creditedInstructionalHours: toHours(creditedTechnicalMinutes),
    source: hasDurableAwards
      ? 'student_course_hour_awards (Supabase fixed-credit awards)'
      : 'Calculated from Supabase module_progress plus approved portal/data.js creditMinutes; the durable award migration is not available in this environment.',
    modules: moduleScores.map((m) => ({
      moduleKey: m.moduleKey,
      attemptedHours: (m.state === 'in_progress' || m.completed) ? toHours(m.creditMinutes) : 0,
      creditedHours: m.completed ? toHours(m.creditMinutes) : 0,
    })),
    reconciliation: {
      technicalRequiredHours: toHours(technicalRequiredMinutes),
      careerReadinessRequiredHours: toHours(careerRequiredMinutes),
      programRequiredHours: toHours(programRequiredMinutes),
      technicalAllocationMatchesProgram: technicalRequiredMinutes + careerRequiredMinutes === programRequiredMinutes,
      attemptedTechnicalHours: toHours(attemptedMinutes),
      creditedTechnicalHours: toHours(creditedTechnicalMinutes),
      creditedCareerReadinessHours: toHours(durableCareerMinutes),
      creditedProgramHours: toHours(creditedProgramMinutes),
      fullyReconciledForCompletion: creditedProgramMinutes === programRequiredMinutes,
      note: careerRequiredMinutes
        ? 'Technical module allocations reconcile to 70 hours. The separately catalogued 12-hour M360 companion brings the approved programme baseline to 82 hours, but its browser-local checklist is not durable evidence and is not counted as an institutional credit award.'
        : 'All approved programme hours are allocated across the available course records.',
    },
  };
}

/* Capstone: Module 12's real data when this track has a capstone module.
 * recordCapstoneSubmission() only ever writes a capstone_submissions row on
 * an actual pass (70%+ AND zero critical errors) — capstone_submissions has
 * no `state` column, so a row's mere existence already means "passed." The
 * critical-error gate itself is not a boolean column anywhere in the schema;
 * the rubric engine's criticalErrors array rides inside jsonb on
 * capstone_submissions.answers.criticalErrors (a passing attempt, expected
 * empty) and on lab_attempts.result.criticalErrors (every capstone attempt,
 * pass or fail). */
function computeCapstoneRecord(program, labAttemptRows, capstoneSubmissionRows, scorecardRow, artifactRows = [], capstoneReviewRows = []) {
  const capstoneModule = program.modules['soc-12'];
  if (!capstoneModule) {
    return {
      title: 'N/A',
      status: 'not_applicable',
      statusLabel: 'Not applicable — this track has no capstone module',
      score: null,
      stages: [],
      scorecard: null,
      criticalErrorGate: null,
      rubricsApplied: [],
      review: { status: 'not_applicable', outcome: null, reviewedBy: null, reviewedAt: null, notes: null, supervisionMethod: null },
    };
  }
  const capstoneLabAttempts = labAttemptRows
    .filter((l) => l.lab_key === 'lab-capstone')
    .slice()
    .sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
  const latestCapstoneAttempt = capstoneLabAttempts[0] || null;
  const passingSubmission = capstoneSubmissionRows.find((c) => c.stage === 12) || null;
  const criticalErrorsOnPassingSubmission = passingSubmission && passingSubmission.answers && Array.isArray(passingSubmission.answers.criticalErrors)
    ? passingSubmission.answers.criticalErrors
    : null;
  const criticalErrorsOnLatestAttempt = latestCapstoneAttempt && latestCapstoneAttempt.result && Array.isArray(latestCapstoneAttempt.result.criticalErrors)
    ? latestCapstoneAttempt.result.criticalErrors
    : null;

  const capstoneArtifacts = artifactRows.filter((a) => a.lab_key === 'lab-capstone');
  const latestArtifact = capstoneArtifacts[0] || null;
  const latestReview = latestArtifact ? capstoneReviewRows.find((r) => r.artifact_id === latestArtifact.id) : null;
  return {
    title: capstoneModule.title,
    status: passingSubmission ? 'passed' : (capstoneLabAttempts.length ? 'in_progress' : 'not_started'),
    statusLabel: passingSubmission
      ? 'Complete — passed (70%+ and zero critical errors)'
      : (capstoneLabAttempts.length ? 'In progress — attempted, not yet passed' : 'Not started'),
    score: passingSubmission
      ? Number(passingSubmission.score)
      : (latestCapstoneAttempt && latestCapstoneAttempt.score !== null && latestCapstoneAttempt.score !== undefined ? Number(latestCapstoneAttempt.score) : null),
    submittedAt: passingSubmission ? passingSubmission.submitted_at : null,
    scorecard: scorecardRow ? {
      overallScore: scorecardRow.overall_score,
      investigationAccuracy: scorecardRow.investigation_accuracy,
      detectionScore: scorecardRow.detection_score,
      threatHuntingScore: scorecardRow.threat_hunting_score,
      incidentResponseScore: scorecardRow.incident_response_score,
      vulnerabilityScore: scorecardRow.vulnerability_score,
      reportingScore: scorecardRow.reporting_score,
      stagesSubmitted: scorecardRow.stages_submitted,
    } : null,
    stages: capstoneSubmissionRows.map((c) => ({
      stage: c.stage,
      score: c.score === null || c.score === undefined ? null : Number(c.score),
      submittedAt: c.submitted_at,
    })),
    criticalErrorGate: {
      note: 'Module 12 requires 70% (7/10 domains) AND zero critical errors to pass. capstone_submissions has no boolean critical-error column; the criticalErrors array from the rubric engine is instead carried inside jsonb — see the two fields below.',
      criticalErrorsOnPassingSubmission,
      criticalErrorsOnLatestAttempt,
      latestAttemptState: latestCapstoneAttempt ? latestCapstoneAttempt.state : null,
      latestAttemptCompletedAt: latestCapstoneAttempt ? latestCapstoneAttempt.completed_at : null,
      totalAttempts: capstoneLabAttempts.length,
    },
    rubricsApplied: ['Triage', 'Query', 'Timeline', 'Scope', 'Enrichment', 'ATT&CK', 'Detection', 'Response', 'Reporting', 'Closure'],
    artifacts: capstoneArtifacts.map((a) => ({ id: a.id, title: a.title, submittedAt: a.submitted_at, contentSha256: a.content_sha256 })),
    review: latestReview ? { status: latestReview.review_status, outcome: latestReview.official_outcome, reviewedBy: latestReview.reviewed_by, reviewedAt: latestReview.reviewed_at, notes: latestReview.reviewer_notes, supervisionMethod: latestReview.supervision_method } : { status: latestArtifact ? 'not_requested' : 'not_available', outcome: null, reviewedBy: null, reviewedAt: null, notes: null, supervisionMethod: 'optional faculty review' },
  };
}

/* D1 for an individual student — same precedence as deriveAcademicStatus()
 * above (completed > withdrawn > active > not yet started), computed from a
 * raw students-row read instead of the admin_student_progress view (a
 * student reading their own record can't use that view — it's admin-gated).
 * Two independent implementations of the same precedence logic is a known
 * consistency risk (ASSESSMENT_REPORTING_SPEC.md §1b row 1.6); keeping both
 * versions' precedence order textually identical is the mitigation until
 * the view becomes readable from both sides. */
function deriveStudentEnrollmentStatus(studentRow, moduleScores) {
  const totalModules = moduleScores.length;
  const completedCount = moduleScores.filter((m) => m.completed).length;
  const isFullyComplete = totalModules > 0 && completedCount === totalModules;
  const derivedCompletionDate = isFullyComplete
    ? moduleScores.reduce((latest, m) => {
        if (!m.completedAt) return latest;
        return (!latest || new Date(m.completedAt) > new Date(latest)) ? m.completedAt : latest;
      }, null)
    : null;
  const status = isFullyComplete
    ? 'completed'
    : (studentRow && studentRow.is_enrolled === false && studentRow.enrollment_date)
      ? 'withdrawn'
      : (studentRow && studentRow.is_enrolled)
        ? 'active'
        : 'not_yet_started';
  return {
    status,
    statusLabel: academicStatusLabel(status),
    enrollmentDate: studentRow ? studentRow.enrollment_date : null,
    withdrawalDate: studentRow ? studentRow.withdrawal_date : null,
    completionDate: (studentRow && studentRow.completion_date) || derivedCompletionDate,
    scheduledStartDate: studentRow ? studentRow.scheduled_start_date : null,
    sourceNote: 'Read directly from students (own row, RLS self-read). status/completionDate use the same precedence as deriveAcademicStatus()/the admin_student_progress view.',
  };
}

/* --------------------------------------------------------------- D2 + D3 */
/* D3 fix: the old code computed a single "outcome" (pass/in-progress) from
 * the PERCENTAGE OF MODULES MARKED COMPLETE — that is a progress metric, not
 * a grade, and the remediation plan calls this out explicitly. This function
 * instead returns five genuinely separate values:
 *   - progressPercentage: modules-complete / modules-total (unchanged metric,
 *     correctly labeled as progress, not outcome)
 *   - academicAverage: mean of recorded best-lab-scores across modules that
 *     HAVE a score (a real average of grades, independent of how many
 *     modules a student has even attempted yet)
 *   - moduleGrades: per-module Pass/Fail/Not attempted against the 70%
 *     threshold (ASSESSMENT_REPORTING_SPEC.md §2) — a grade, not a percent
 *   - capstoneOutcome: capstoneRecord.status, already its own field
 *   - programCompletionAssessment (D2): a proper multi-condition object —
 *     required modules, required labs, required assessments passed, capstone
 *     passed, zero critical errors, PLUS required-hours and evaluator-
 *     approval recorded as "not available" rather than silently skipped or
 *     fabricated as true, since no data source exists for either yet
 *     (COMPLIANCE_DECISIONS_NEEDED.md Decisions 1 & 2 — Agents 6/7). This
 *     status is therefore never a claim of official CIE program completion,
 *     only of what this system can currently verify. */
function assessProgressGradesCompletion(program, moduleScores, capstoneRecord, hourRecord) {
  const totalModules = moduleScores.length;
  const completedCount = moduleScores.filter((m) => m.completed).length;
  const progressPercentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const passingThreshold = (program.compliance && program.compliance.passingPercent) || 70;
  const scored = moduleScores.filter((m) => m.bestLabScore !== null);
  const academicAverage = scored.length
    ? scored.reduce((sum, m) => sum + m.bestLabScore, 0) / scored.length
    : null;

  const moduleGrades = moduleScores.map((m) => ({
    moduleKey: m.moduleKey,
    title: m.title,
    score: m.bestLabScore,
    grade: m.bestLabScore === null ? 'Not attempted' : (m.bestLabScore >= passingThreshold ? 'Pass' : 'Fail'),
  }));

  const hasCapstone = capstoneRecord.status !== 'not_applicable';
  const requiredModulesComplete = totalModules > 0 && completedCount === totalModules;
  // No independent lab-completion signal exists apart from module completion
  // in this schema (lab_attempts feed module_progress, not a separate
  // required-labs table) — documented as a known limitation rather than
  // inventing a stricter check this data can't actually support.
  const requiredLabsComplete = requiredModulesComplete;
  const requiredAssessmentsPassed = moduleGrades.every((g) => g.grade !== 'Fail');
  const capstonePassed = hasCapstone ? capstoneRecord.status === 'passed' : true;
  const zeroCriticalErrors = hasCapstone
    ? !(capstoneRecord.criticalErrorGate
        && capstoneRecord.criticalErrorGate.criticalErrorsOnPassingSubmission
        && capstoneRecord.criticalErrorGate.criticalErrorsOnPassingSubmission.length > 0)
    : true;

  const requiredHoursSatisfied = !!(hourRecord && hourRecord.reconciliation && hourRecord.reconciliation.fullyReconciledForCompletion);
  const evaluatorApprovalObtained = hasCapstone
    ? (capstoneRecord.review && capstoneRecord.review.status === 'approved')
    : 'not_applicable';
  const verifiableConditionsMet = requiredModulesComplete && requiredLabsComplete && requiredAssessmentsPassed && capstonePassed && zeroCriticalErrors && requiredHoursSatisfied && (evaluatorApprovalObtained === true || evaluatorApprovalObtained === 'not_applicable');

  return {
    progressPercentage: Number(progressPercentage.toFixed(1)),
    academicAverage: academicAverage === null ? null : Number(academicAverage.toFixed(1)),
    moduleGrades,
    gradeScale: `${passingThreshold}/100 passing threshold per module (ASSESSMENT_REPORTING_SPEC.md §2)`,
    capstoneOutcome: capstoneRecord.status,
    programCompletionAssessment: {
      status: verifiableConditionsMet ? 'all_currently_verifiable_conditions_met' : 'incomplete',
      note: verifiableConditionsMet
        ? 'All currently recorded conditions (required modules, fixed-credit hours, labs, assessments, capstone pass, and zero critical errors) are met. This is NOT an official CIE program-completion or credential determination until the institution records credential award and any required evaluator approval.'
        : 'One or more currently-verifiable completion conditions are not met.',
      conditions: {
        requiredModulesComplete,
        requiredLabsComplete,
        requiredAssessmentsPassed,
        capstonePassed,
        zeroCriticalErrors,
        requiredHoursSatisfied,
        evaluatorApprovalObtained,
        credentialAwardEvent: 'not recorded here — credential_awards exists in the local enrollment-reporting migration, but the migration may not be deployed or populated',
      },
    },
    credentialAwardStatus: 'not recorded in transcript query — credential_awards exists in the local enrollment-reporting migration and requires deployment/population before awards appear here',
  };
}

/* --------------------------------------------------------------- G2 / B2 */
/* Pure(ish) data builder for an individual academic transcript — one Supabase
 * round trip via fetchStudentProgressBundle(), no PDF/DOM work (Agent 4).
 * `identity` carries what the caller already has in hand (a student's own
 * session, or an admin row) so this function never needs to re-derive
 * userId/trackCode/program itself. */
async function buildTranscriptData(studentId, identity) {
  identity = identity || {};
  const { userId, trackCode, program } = identity;
  const generatedAt = new Date().toISOString();
  const bundle = await fetchStudentProgressBundle(userId, trackCode);
  const moduleScores = program ? computeModuleScores(program, bundle.moduleProgressRows, bundle.labAttemptRows) : [];
  const capstoneRecord = program
    ? computeCapstoneRecord(program, bundle.labAttemptRows, bundle.capstoneSubmissionRows, bundle.scorecardRow, bundle.artifactRows, bundle.capstoneReviewRows)
    : { title: 'N/A', status: 'not_applicable', statusLabel: 'No program supplied', score: null, stages: [], scorecard: null, criticalErrorGate: null, rubricsApplied: [] };
  const enrollmentStatus = deriveStudentEnrollmentStatus(bundle.studentRow, moduleScores);
  const fixedCreditHours = computeFixedCreditHours(program, moduleScores, bundle.hourAwardRows, bundle.hourAwardError);
  const grades = assessProgressGradesCompletion(program || { modules: {}, compliance: {} }, moduleScores, capstoneRecord, fixedCreditHours);

  return {
    reportType: 'individual_academic_transcript',
    generatedAt,
    asOf: generatedAt,
    institution: { name: 'Mission Next Technical Academy' },
    studentId,
    track: trackCode || null,
    program: program ? {
      slug: program.slug,
      title: (program.compliance && program.compliance.programName) || program.title,
      credential: (program.compliance && program.compliance.credential) || null,
      curriculumRevision: (program.compliance && program.compliance.revision) || null,
    } : null,
    enrollment: enrollmentStatus,
    requiredProgramHours: program && program.compliance ? {
      total: program.compliance.totalHours || null,
      technical: program.compliance.technicalHours || null,
      lab: program.compliance.labHours || null,
      career: program.compliance.careerHours || null,
      source: 'portal/data.js program.compliance (static, authoritative)',
    } : null,
    attemptedClockHours: fixedCreditHours.attemptedClockHours,
    attendedInstructionalHours: fixedCreditHours.creditedInstructionalHours,
    fixedCreditHours,
    hoursNote: `Fixed-credit model: attempted hours are approved credits for started or completed technical modules; credited instructional hours are approved credits for completed technical modules. ${fixedCreditHours.reconciliation.note}`,
    gradeScale: grades.gradeScale,
    modules: moduleScores.map((m) => ({
      moduleKey: m.moduleKey,
      title: m.title,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      progressState: m.status,
      percentComplete: m.percent,
      attemptedHours: (fixedCreditHours.modules.find((h) => h.moduleKey === m.moduleKey) || {}).attemptedHours || 0,
      attendedHours: (fixedCreditHours.modules.find((h) => h.moduleKey === m.moduleKey) || {}).creditedHours || 0,
      score: m.bestLabScore,
      grade: (grades.moduleGrades.find((g) => g.moduleKey === m.moduleKey) || {}).grade || 'Not attempted',
    })),
    progressPercentage: grades.progressPercentage,
    academicAverage: grades.academicAverage,
    capstoneOutcome: grades.capstoneOutcome,
    capstone: capstoneRecord,
    programCompletionAssessment: grades.programCompletionAssessment,
    credentialAwardStatus: grades.credentialAwardStatus,
    dataProvenance: {
      gradesStatus: 'verified from Supabase module_progress and lab_attempts (live query at export time)',
      capstoneStatus: program && program.modules && program.modules['soc-12']
        ? 'verified from Supabase capstone_submissions and capstone_scorecard (live query at export time)'
        : 'not applicable — this track has no capstone module',
      enrollmentStatusSource: bundle.studentRow
        ? 'verified from Supabase students (own row, live query at export time)'
        : 'students row not found or query failed — enrollment fields default to not_yet_started/null',
      supabaseFetchError: bundle.error,
    },
  };
}

/* --------------------------------------------------------------- G2 / B3 */
/* Pure(ish) data builder for the supporting-evidence record (labs, rubric
 * breakdowns, capstone critical-error detail, evaluator/artifact fields).
 * Accompanies buildTranscriptData(), never overloads it (plan B3). Shares
 * the same fetch (fetchStudentProgressBundle) rather than re-querying. */
async function buildEvidencePacketData(studentId, identity) {
  identity = identity || {};
  const { userId, trackCode, program } = identity;
  const generatedAt = new Date().toISOString();
  const bundle = await fetchStudentProgressBundle(userId, trackCode);
  const moduleScores = program ? computeModuleScores(program, bundle.moduleProgressRows, bundle.labAttemptRows) : [];
  const capstoneRecord = program
    ? computeCapstoneRecord(program, bundle.labAttemptRows, bundle.capstoneSubmissionRows, bundle.scorecardRow, bundle.artifactRows, bundle.capstoneReviewRows)
    : { title: 'N/A', status: 'not_applicable', statusLabel: 'No program supplied', score: null, stages: [], scorecard: null, criticalErrorGate: null, rubricsApplied: [], review: { status: 'not_applicable', outcome: null, reviewedBy: null, reviewedAt: null, notes: null, supervisionMethod: null } };

  const labs = moduleScores.flatMap((m) =>
    m.labAttempts.map((a) => ({
      moduleKey: m.moduleKey,
      moduleTitle: m.title,
      labKey: a.labKey,
      labTitle: a.title,
      state: a.state,
      completionStatus: adminStateLabel(a.state),
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      score: a.score,
      rubricBreakdown: a.rubricResult,
      competenciesEvaluated: a.rubricResult && typeof a.rubricResult === 'object' ? Object.keys(a.rubricResult) : [],
      submittedArtifactReference: (() => { const artifact = bundle.artifactRows.find((x) => x.lab_key === a.labKey); return artifact ? `Portfolio artifact ${artifact.id}` : 'No durable artifact recorded for this attempt'; })(),
      artifactIntegrityMetadata: (() => { const artifact = bundle.artifactRows.find((x) => x.lab_key === a.labKey); return artifact && artifact.content_sha256 ? `SHA-256 ${artifact.content_sha256}` : 'Not available'; })(),
      evaluatorReviewer: a.labKey === 'lab-capstone' ? capstoneRecord.review.reviewedBy : 'Not applicable — optional faculty review begins with capstone',
      reviewDate: a.labKey === 'lab-capstone' ? capstoneRecord.review.reviewedAt : null,
      reviewNotes: a.labKey === 'lab-capstone' ? capstoneRecord.review.notes : null,
      supervisionMethod: a.labKey === 'lab-capstone' ? capstoneRecord.review.supervisionMethod : 'Automated scoring; no faculty review required for this module',
    }))
  );

  return {
    reportType: 'individual_supporting_evidence_record',
    generatedAt,
    asOf: generatedAt,
    studentId,
    track: trackCode || null,
    labs,
    capstone: {
      ...capstoneRecord,
      evaluatorReviewer: capstoneRecord.review.reviewedBy,
      supervisionMethod: capstoneRecord.review.supervisionMethod,
    },
    correctionsOrOverrides: [],
    correctionsNote: 'No correction/override recording mechanism exists yet — a corrected score or evaluator override would have no field to land in (Agent 5/7).',
    dataProvenance: {
      labsStatus: 'verified from Supabase lab_attempts (live query at export time, including rubric result jsonb)',
      artifactsStatus: 'capstone submission snapshots and database-calculated SHA-256 digests are read from portfolio_artifacts; other module artifacts are not yet in scope',
      evaluatorStatus: 'optional instructor review is available for capstone artifacts; a missing review is reported as not requested, not as approval',
      supabaseFetchError: bundle.error,
    },
  };
}

/* ---------------------------------------------------- legacy JSON export */
/* The student-facing "Export my record" button. Per the remediation plan
 * (A4/G2), this now assembles its JSON payload from the two real builders
 * (buildTranscriptData + buildEvidencePacketData) instead of running its own
 * inline Supabase queries and status/grade logic — that logic used to be
 * duplicated here and in the old buildStudentExportRecord(), both now
 * retired in favor of the shared builders above.
 *
 * This stays a secondary, clearly-labeled machine-readable export (plan A4:
 * "Never label JSON as an academic transcript"). The primary human-readable
 * PDF transcript button now calls buildTranscriptData()/renderTranscriptPdf()
 * directly; this function remains only for the optional secondary data file. */
async function exportStudentRecord(user, program) {
  if (!user || !user.enrollments.length) {
    console.error('Could not build student export record: no active enrollment');
    return null;
  }
  const identity = { userId: user.userId, trackCode: user.trackCode, program };
  const [transcript, evidence] = await Promise.all([
    buildTranscriptData(user.username, identity),
    buildEvidencePacketData(user.username, identity),
  ]);

  const record = {
    _label: 'Machine-readable data export — NOT the official transcript. See transcript.reportType for the individual academic transcript data, and evidence.reportType for the supporting-evidence record.',
    exportedAt: new Date().toISOString(),
    studentId: user.username,
    email: user.email,
    track: user.trackCode,
    program: program.slug,
    transcript,
    evidence,
  };

  const json = JSON.stringify(record, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-record-${user.username}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return record;
}

/* --------------------------------------------------- A4: student-facing PDF */
/* "Download Transcript (PDF)"/"Download Evidence Record (PDF)" — the primary
 * student-facing actions per plan A4 ("Never label JSON as an academic
 * transcript... Download transcript (PDF) / optional secondary Download
 * data (JSON)"). Global, reached the same way exportStudentRecord() already
 * was: viewProgram() sets window.__mntCurrentUser/__mntCurrentProgram on
 * every render since inline onclick handlers lose the lexical closure once
 * innerHTML is set. */
async function downloadStudentTranscriptPdf(user, program) {
  if (!user || !user.enrollments.length) {
    console.error('Could not build transcript: no active enrollment');
    return null;
  }
  const identity = { userId: user.userId, trackCode: user.trackCode, program };
  return downloadTranscriptPdf(user.username, identity);
}

async function downloadStudentEvidencePdf(user, program) {
  if (!user || !user.enrollments.length) {
    console.error('Could not build evidence record: no active enrollment');
    return null;
  }
  const identity = { userId: user.userId, trackCode: user.trackCode, program };
  return downloadEvidencePdf(user.username, identity);
}

/* ------------------------------------------------------- admin snapshot */
/* "Save Progress File" — an admin-triggered, recoverable JSON snapshot of
 * one student's full transcript + evidence record, built from the same
 * buildTranscriptData()/buildEvidencePacketData() Supabase reads as the
 * student's own export. Exists so a disenrollment is never a one-way door:
 * ADMIN_RESET_FLOW.md documents pasting this file's contents to a connected
 * AI agent to restore a student who was disenrolled by mistake. Available
 * as a standalone per-row button, and always run automatically before an
 * enrolled -> disenrolled toggle (see wireAdmin) so the snapshot exists
 * before the state change that made it necessary. */
async function buildStudentSnapshotRecord(studentId, identity) {
  const [transcript, evidence] = await Promise.all([
    buildTranscriptData(studentId, identity),
    buildEvidencePacketData(studentId, identity),
  ]);
  return {
    _label: 'Admin-captured recoverable progress snapshot — paste into ADMIN_RESET_FLOW.md\'s agent prompt to restore this student if a disenrollment was a mistake.',
    capturedAt: new Date().toISOString(),
    studentId,
    track: identity ? identity.trackCode : null,
    transcript,
    evidence,
  };
}

function downloadJsonFile(payload, filename) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadStudentSnapshot(studentId, identity) {
  const record = await buildStudentSnapshotRecord(studentId, identity);
  downloadJsonFile(record, `student-progress-snapshot-${studentId}-${new Date().toISOString().slice(0, 10)}.json`);
  return record;
}

/* ---------------------------------------------- module_progress (Supabase) */
/* Additive write path alongside the localStorage engagement tracking above
 * (architecture.md §3 Sprint 2). localStorage stays the source of truth the
 * UI reads synchronously — these calls persist the same signal to
 * module_progress so course_progress/admin_student_progress have real data.
 * Fire-and-forget: never awaited by a caller, never blocks navigation.
 * Errors are logged, not swallowed. Every entry point guards on
 * user.userId/user.trackCode, which are only populated on a real Supabase
 * Auth session (buildUserFromSession) — no session, no write, no throw. */

async function upsertModuleProgress(user, moduleKey, fields) {
  if (!user || !user.userId || !user.trackCode) return;
  try {
    const { error } = await mntSupabase.from('module_progress').upsert(
      {
        user_id: user.userId,
        module_key: moduleKey,
        track_code: user.trackCode,
        ...fields,
      },
      { onConflict: 'user_id,module_key' }
    );
    if (error) console.error('module_progress upsert failed', moduleKey, fields, error);
  } catch (err) {
    console.error('module_progress upsert threw', moduleKey, fields, err);
  }
}

/* Only ever writes 'in_progress', and only when this module's row isn't
 * already 'complete' — a read-before-write, chosen over a conditional upsert
 * because supabase-js has no clean way to express an upsert with a WHERE
 * predicate on the existing row. This is the sole guard against regressing a
 * completed module back to in_progress; markModuleCompleteRemote below never
 * needs a symmetric check since going TO complete is never a regression. */
function markModuleInProgressRemote(user, moduleKey) {
  if (!user || !user.userId || !user.trackCode) return;
  mntSupabase
    .from('module_progress')
    .select('state')
    .eq('user_id', user.userId)
    .eq('module_key', moduleKey)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) { console.error('module_progress read failed', moduleKey, error); return; }
      if (data && data.state === 'complete') return;
      upsertModuleProgress(user, moduleKey, { state: 'in_progress', started_at: new Date().toISOString() });
    });
}

function markModuleCompleteRemote(user, moduleKey) {
  upsertModuleProgress(user, moduleKey, {
    state: 'complete',
    percent: 100,
    completed_at: new Date().toISOString(),
  });
}

function markModuleContentOpened(user, programSlug, moduleKey) {
  if (!user) return;
  const engagement = loadModuleEngagement(user);
  const id = moduleEngagementId(programSlug, moduleKey);
  if (!engagement.openedModules.includes(id)) {
    engagement.openedModules.push(id);
    saveModuleEngagement(user, engagement);
    markModuleInProgressRemote(user, moduleKey);
  }
}

function markModuleLabComplete(user, programSlug, moduleKey, labKey, completed = true) {
  if (!user) return;
  const engagement = loadModuleEngagement(user);
  const id = moduleLabEngagementId(programSlug, moduleKey, labKey);
  engagement.completedLabs = completed
    ? [...new Set([...engagement.completedLabs, id])]
    : engagement.completedLabs.filter((item) => item !== id);
  saveModuleEngagement(user, engagement);

  // moduleCompletion() is the derived-completion read (defined below); this is
  // the "did this call just flip it to complete" check architecture.md §3
  // calls for. It re-reads engagement from localStorage, so it sees the save
  // above. Only checked when completing a lab — clearing one (completed ===
  // false) can never newly complete a module.
  if (completed) {
    const program = PROGRAMS.find((p) => p.slug === programSlug);
    if (program && program.modules && program.modules[moduleKey]) {
      const { complete } = moduleCompletion(program, moduleKey, user);
      if (complete) markModuleCompleteRemote(user, moduleKey);
    }
  }
}

/* ------------------------------------------------------------ lab_attempts (Supabase) */
/* architecture.md §3 Sprint 3: "wire what already computes a result" half only
 * — every module (01-12) already grades its own in-page artifact with a
 * moduleXScore()-shaped function (score/breakdown/feedback) and a passing
 * threshold; this just persists that already-computed result. Deliberately
 * NOT the simulator->portal postMessage contract (ui/mnt-lab-harness.js) —
 * that is flagged in architecture.md as separate, unscoped work.
 *
 * lab_attempts has no one-row-per-lab uniqueness constraint (append-only, one
 * row per attempt — see supabase/migrations/20260828160000_simplify_schema.sql),
 * so this is a plain insert, never an upsert: every graded submit — pass or
 * fail — becomes its own row, giving real attempt history instead of only the
 * latest try. Call this once per lab_key right after a module computes its
 * own score, alongside (not instead of) its existing markModuleLabComplete()
 * call. Same fire-and-forget/guard/error-logging convention as
 * upsertModuleProgress above: no session or no track_code silently skips the
 * write so local LabRuntime/engagement behavior is never affected. */
function recordLabAttempt(user, labKey, { state, score = null, result = {} } = {}) {
  if (!user || !user.userId || !user.trackCode) return;
  const now = new Date().toISOString();
  mntSupabase
    .from('lab_attempts')
    .insert({
      user_id: user.userId,
      lab_key: labKey,
      track_code: user.trackCode,
      state,
      score,
      result,
      rubric_version: 'soc-analyst-rubric-v1',
      scoring_engine_version: 'portal-client-scorer-v1',
      pass_threshold: 70,
      started_at: now,
      completed_at: state === 'complete' ? now : null,
    })
    .then(({ error }) => {
      if (error) console.error('lab_attempts insert failed', labKey, error);
    })
    .catch((err) => console.error('lab_attempts insert threw', labKey, err));
}

/* An artifact is an immutable, server-stored snapshot of a submission.  This
 * intentionally inserts for every submit; browser LabRuntime state remains a
 * working draft only and is never presented as the institutional record. */
function persistPortfolioArtifact(user, { moduleKey, labKey, kind, title, content, rubricVersion = 'soc-analyst-rubric-v1', scoringEngineVersion = 'portal-client-scorer-v1', passThreshold = 70 } = {}) {
  if (!user || !user.userId || !user.trackCode || !content) return Promise.resolve(null);
  return mntSupabase.from('portfolio_artifacts').insert({
    user_id: user.userId,
    track_code: user.trackCode,
    module_key: moduleKey || null,
    lab_key: labKey || null,
    kind: kind || 'capstone_report',
    title: title || 'Submitted portfolio artifact',
    content,
    submitted_by: user.userId,
    rubric_version: rubricVersion,
    scoring_engine_version: scoringEngineVersion,
    pass_threshold: passThreshold,
  }).select('id').single().then(({ data, error }) => {
    if (error) { console.error('portfolio_artifacts insert failed', error); return null; }
    return data;
  }).catch((err) => { console.error('portfolio_artifacts insert threw', err); return null; });
}

/* --------------------------------------------------------- capstone_submissions (Supabase) */
/* architecture.md §3 Sprint 4, scope confirmed against CURRICULUM_ALIGNMENT_ARCHITECTURE.md
 * §5 ("12 stages remain one Prove assessment"): there is no 12-stage capstone
 * flow, and none is being built here. Module 12 (portal/soc-analyst-module-12.js) IS the
 * capstone, graded once by its own moduleTwelveScore(). `stage` in the schema
 * is a 1-12 check constraint left over from an earlier per-stage design, but
 * since the capstone is always module 12, this always writes stage = 12 — a
 * constant, not a loop variable.
 *
 * Unlike recordLabAttempt() above, this IS an upsert, not an insert:
 * capstone_submissions has a real uniqueness constraint, unique(user_id,
 * track_code, stage) (supabase/migrations/20260828160000_simplify_schema.sql),
 * and the product meaning is "this student's one capstone record for this
 * track," not an attempt log — a student who fails and retakes the capstone
 * should see their existing row update to the new score/answers, not
 * accumulate duplicate rows that would each fight for the same
 * (user_id, track_code, 12) key anyway (a plain insert would just violate the
 * constraint on the second attempt). lab_attempts has no such constraint and
 * is deliberately append-only so attempt history survives; capstone_submissions
 * has no `state`/attempt-number column at all, only `score`/`submitted_at`, so
 * "latest attempt" and "the record" are the same thing here — upsert is the
 * correct match for that shape, not a workaround.
 *
 * Same fire-and-forget/guard/error-logging convention as upsertModuleProgress
 * and recordLabAttempt: no session or no track_code silently skips the write;
 * errors are logged, never swallowed; never awaited by the caller. Call this
 * only on an actual pass — capstone_submissions has no `state` column to mark
 * an in-progress/failed attempt, so a failed submit is not written here (it is
 * still captured by soc-analyst-module-12.js's existing recordLabAttempt() call for
 * lab_key 'lab-capstone', which does log every attempt, pass or fail). */
function recordCapstoneSubmission(user, { score, answers = {}, criticalErrorCount = 0 } = {}) {
  if (!user || !user.userId || !user.trackCode) return;
  mntSupabase
    .from('capstone_submissions')
    .upsert(
      {
        user_id: user.userId,
        track_code: user.trackCode,
        stage: 12,
        score,
        answers,
        critical_error_count: criticalErrorCount,
        passed_critical_error_gate: criticalErrorCount === 0,
        rubric_version: 'soc-analyst-capstone-v1',
        scoring_engine_version: 'portal-client-scorer-v1',
        pass_threshold: 70,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,track_code,stage' }
    )
    .then(({ error }) => {
      if (error) console.error('capstone_submissions upsert failed', user.trackCode, error);
    })
    .catch((err) => console.error('capstone_submissions upsert threw', user.trackCode, err));
}

function moduleCompletion(program, moduleKey, user) {
  const module = program.modules[moduleKey];
  const fixtureState = (user.progress || {})[moduleKey] || 'not_started';
  // The database's own record of this module, independent of which browser/
  // device the student is on right now. A 'complete' row here only ever gets
  // written (markModuleCompleteRemote) after this same completeness check
  // already passed once on whichever device did the work, so trusting it
  // outright — rather than re-deriving from local engagement — can't
  // falsely mark an untouched module complete.
  const remoteState = (user.remoteModuleProgress || {})[moduleKey];
  const remoteComplete = remoteState === 'complete';
  const engagement = loadModuleEngagement(user);
  const moduleId = moduleEngagementId(program.slug, moduleKey);
  const labs = programLabs(program).filter((lab) => lab.module === moduleKey);
  const contentOpened = fixtureState === 'complete' || remoteComplete || remoteState === 'in_progress'
    || engagement.openedModules.includes(moduleId);
  const allLabsComplete = remoteComplete || labs.every((lab) => {
    const engagementComplete = engagement.completedLabs.includes(moduleLabEngagementId(program.slug, moduleKey, lab.key));
    if (moduleKey === 'soc-01' && (lab.key === 'lab-soc-environment' || lab.key === 'lab-soc-escalation')) {
      const guidedLabState = LabRuntime.load(MODULE_ONE_LAB_ID, user, MODULE_ONE_DEFAULT_STATE);
      return (engagementComplete || guidedLabState.completed) && guidedLabState.consoleCompleted === true;
    }
    return engagementComplete || fixtureState === 'complete';
  });
  const complete = module.status !== 'draft' && contentOpened && allLabsComplete;
  return { complete, contentOpened, allLabsComplete, fixtureState, module };
}

function programProgress(user, program) {
  const keys = Object.keys(program.modules || {});
  if (!keys.length) return { done: 0, total: 0, percent: 0 };
  const done = keys.filter((key) => moduleCompletion(program, key, user).complete).length;
  return { done, total: keys.length, percent: Math.round((done / keys.length) * 100) };
}

/* A track is openable once its 12-module skeleton exists — all four tracks now
 * carry one (MODULE_STANDARD.md). Publication is a separate flag: an unpublished
 * track shows its standardized outline with each module marked as in
 * development, rather than pretending the lessons are ready. */
function isBuilt(program) {
  return !!(program.modules && program.weekGroups);
}

/* -------------------------------------------------------------- fragments */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function chip(text, compact) {
  const size = compact ? 'text-xs px-2.5 py-1 rounded-lg' : 'text-sm px-4 py-2 rounded-xl';
  return `<span class="bg-gray-50 border border-gray-200 text-gray-600 font-medium ${size}">${esc(text)}</span>`;
}

function programLabs(program) {
  const moduleKeys = new Set(Object.keys((program && program.modules) || {}));
  return LABS.filter((lab) => moduleKeys.has(lab.module));
}

function formatInstructionalMinutes(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  if (!hours) return `${remainder} Minute${remainder === 1 ? '' : 's'}`;
  if (!remainder) return `${hours} Hour${hours === 1 ? '' : 's'}`;
  return `${hours} Hour${hours === 1 ? '' : 's'} ${remainder} Minutes`;
}

function moduleParentRecords(program, module, labs) {
  const codes = new Set();
  [...(module.curriculumItems || []), ...labs].forEach((record) => {
    (record.parentAllocations || []).forEach((allocation) => codes.add(allocation.code));
  });
  const parents = new Map((program.parents || []).map((parent) => [parent.code, parent]));
  return [...codes].map((code) => parents.get(code)).filter(Boolean);
}

function curriculumItemRow(item) {
  return `
  <div class="bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
    <div class="flex items-start justify-between gap-4 flex-wrap mb-2">
      <p class="text-[#1e3a5f] font-medium text-sm">${esc(item.title)}</p>
      <span class="text-gray-500 text-xs whitespace-nowrap">${formatInstructionalMinutes(item.durationMinutes)}</span>
    </div>
    <p class="text-gray-500 text-sm leading-relaxed mb-3">${esc(item.objective)}</p>
    <div class="flex flex-wrap gap-2">
      ${(item.parentAllocations || []).map((allocation) => `
        <span class="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg">
          ${esc(allocation.code)} · ${formatInstructionalMinutes(allocation.minutes)}
        </span>`).join('')}
    </div>
  </div>`;
}

function header(user) {
  return `
  <header>
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        <!-- The asset is the full wordmark, so it stands alone. Pairing it with
             a "Mission Next / Technical Academy" text block would say the name twice. -->
        <a href="#/portal" class="flex items-center cursor-pointer shrink-0">
          <img src="assets/logo.png" alt="Mission Next Technical Academy" class="h-9 sm:h-11 w-auto" />
        </a>
        ${
          user
            ? `<div class="flex items-center gap-2">
                 ${
                   user.isAdmin
                     ? ''
                     : `<a href="#/portal" class="relative text-gray-600 hover:text-[#1e3a5f] text-sm font-medium transition-all duration-300 cursor-pointer px-4 py-2 rounded-lg hover:bg-[#1e3a5f]/8 group">
                          My Programs
                          <span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#f97316] rounded-full transition-all duration-300 group-hover:w-3/4"></span>
                        </a>`
                 }
                 ${
                   user.isAdmin
                     ? `<a href="#/admin" class="relative text-gray-600 hover:text-[#1e3a5f] text-sm font-medium transition-all duration-300 cursor-pointer px-4 py-2 rounded-lg hover:bg-[#1e3a5f]/8 group">
                        Admin
                        <span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#f97316] rounded-full transition-all duration-300 group-hover:w-3/4"></span>
                      </a>`
                     : ''
                 }
                 <span class="hidden md:inline-flex items-center gap-2 text-sm text-gray-500 px-3">
                   <span class="w-8 h-8 rounded-full bg-[#1e3a5f]/8 text-[#1e3a5f] font-semibold text-xs flex items-center justify-center">
                     ${esc(user.name.split(' ').map((p) => p[0]).join(''))}
                   </span>
                   ${esc(user.name)}
                 </span>
                 <button data-action="signout" class="bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer">
                   Sign Out
                 </button>
               </div>`
            : ''
        }
      </div>
    </nav>
  </header>`;
}

function footer() {
  return `
  <footer class="border-t border-gray-100 py-10 px-8 mt-20">
    <div class="max-w-7xl mx-auto text-center">
      <p class="text-gray-400 text-xs">
        © Mission Next Technical Academy. All rights reserved.
      </p>
    </div>
  </footer>`;
}

/* ------------------------------------------------------------- login view */

function viewLogin() {
  return `
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">

    <!-- brand panel -->
    <div class="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
         style="background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 45%, #0f2440 100%)">
      <div class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full opacity-20 pointer-events-none"
           style="background: radial-gradient(circle, #f97316 0%, transparent 70%)"></div>
      <div class="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
           style="background: radial-gradient(circle, #60a5fa 0%, transparent 65%)"></div>
      <div class="mnt-stars"></div>

      <!-- The wordmark is dark navy, so it needs inverting to read on the dark
           panel. brightness-0 invert renders it solid white. -->
      <div class="relative z-10">
        <img src="assets/logo.png" alt="Mission Next Technical Academy"
             class="h-16 w-auto brightness-0 invert opacity-95" />
      </div>
      <div class="relative z-10 max-w-md">
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/15">
          <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Student Portal
        </div>
        <h1 class="text-3xl font-bold text-white mb-4 leading-tight">Pick up where you left off.</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/55 text-base leading-relaxed">
          Your programs, curriculum, hands-on labs, and capstone progress — all in one place.
        </p>
      </div>
      <div class="relative z-10 text-white/40 text-xs">© Mission Next Technical Academy</div>
    </div>

    <!-- form panel -->
    <div class="flex items-center justify-center p-8 lg:p-12">
      <div class="w-full max-w-md">
        <img src="assets/logo.png" alt="Mission Next Technical Academy" class="h-12 w-auto mb-10 lg:hidden" />

        <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1.5">Mission Next</p>
        <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4">Sign in</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-8"></div>

        <form id="login-form" class="flex flex-col gap-5" novalidate>
          <div>
            <label for="email" class="block text-sm font-medium text-[#1e3a5f] mb-1.5">Username</label>
            <input id="email" name="email" type="text" autocomplete="username" required
                   class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                          focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 transition-colors"
                   placeholder="Enter your username" />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-[#1e3a5f] mb-1.5">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required
                   class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                          focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 transition-colors"
                   placeholder="••••••••" />
          </div>

          <p id="login-error" class="hidden text-sm text-[#dc2626]">
            <i class="ri-error-warning-line"></i> That email and password combination was not recognized.
          </p>

          <button type="submit"
                  class="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5 rounded-xl
                         transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
            Sign In
          </button>
        </form>

      </div>
    </div>
  </div>`;
}

/* --------------------------------------------------------- dashboard view */

function programCard(program, user) {
  const unlocked = hasProgramAccess(user, program.slug);
  const openable = unlocked && isBuilt(program);
  const enrollment = enrollmentFor(user, program.slug);
  const partial = enrollment && enrollment.accessMode === 'partial';
  const prog = unlocked && program.modules ? programProgress(user, program) : null;

  // Locked: dimmed, desaturated, and genuinely non-interactive — not just
  // styled to look disabled. pointer-events-none removes it from the tab order
  // and from click handling; aria-disabled reports it to assistive tech.
  const lockedShell = 'mnt-locked-strong select-none';

  return `
  <div class="relative ${unlocked ? '' : lockedShell}">
    ${
      unlocked
        ? ''
        : `<div class="absolute inset-0 z-20 flex items-start justify-end p-4 pointer-events-none">
             <span class="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
               <i class="ri-lock-line"></i> Not enrolled
             </span>
           </div>`
    }
    <div ${openable ? `data-open="${esc(program.slug)}" role="button" tabindex="0"` : 'aria-disabled="true"'}
         class="h-full bg-white border border-gray-200 rounded-2xl p-7 flex flex-col gap-5 shadow-sm transition-transform duration-200
                ${openable ? 'hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
                           : unlocked ? 'cursor-default' : 'pointer-events-none cursor-not-allowed'}">

      <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8">
        <i class="${esc(program.icon)} text-2xl text-[#1e3a5f]"></i>
      </div>

      <div class="flex-1">
        <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1.5">${esc(program.eyebrow)}</p>
        <h3 class="text-[#1e3a5f] font-bold text-base leading-snug mb-3">${esc(program.cardTitle)}</h3>
        <p class="text-gray-500 text-sm leading-relaxed">${esc(program.description)}</p>
      </div>

      ${
        prog
          ? `<div>
               <div class="flex items-center justify-between text-xs mb-1.5">
                 <span class="text-gray-500">${partial ? 'Modules unlocked' : 'Progress'}</span>
                 <span class="text-[#1e3a5f] font-semibold">
                   ${partial ? `${enrollment.modules.length} / ${prog.total}` : `${prog.percent}%`}
                 </span>
               </div>
               <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                 <div class="h-full bg-[#f97316] rounded-full transition-all"
                      style="width: ${partial ? Math.round((enrollment.modules.length / prog.total) * 100) : prog.percent}%"></div>
               </div>
             </div>`
          : ''
      }

      <div class="h-px bg-gray-100"></div>

      ${
        openable && program.isPublished
          ? `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f97316] self-start">
               <i class="ri-arrow-right-circle-line text-sm"></i>Continue Program
             </span>`
          : openable
          ? `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#f97316] self-start">
               <i class="ri-list-check-2 text-sm"></i>View Curriculum Outline
             </span>`
          : `<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 self-start">
               <i class="ri-lock-line text-sm"></i>${esc(program.badge)}
             </span>`
      }
    </div>
  </div>`;
}

function viewPortal(user) {
  const enrolledCount = user.enrollments.filter((e) => e.status === 'active').length;

  return `
  ${header(user)}
  <main class="pt-16">
    <section class="relative py-16 px-8 overflow-hidden"
             style="background: linear-gradient(150deg, #0c1e32 0%, #1e3a5f 50%, #162d4a 100%)">
      <div class="mnt-stars"></div>
      <div class="absolute -top-20 right-1/4 w-96 h-96 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-[#3b82f6]/8 rounded-full blur-3xl pointer-events-none"></div>
      <div class="relative z-10 max-w-7xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/15">
          <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Student Portal
        </div>
        <h1 class="text-3xl font-bold text-white mb-4">Welcome back!</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/55 text-base max-w-xl">
          ${
            enrolledCount
              ? `You have ${enrolledCount} active program${enrolledCount > 1 ? 's' : ''}. Programs you have not enrolled in are shown but locked.`
              : 'You do not have any active programs yet. Browse the catalogue below and request information to enroll.'
          }
        </p>
      </div>
    </section>

    <section class="py-16 px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Section header copy is the live site's, verbatim. -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 bg-[#f97316]/10 text-[#f97316] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>What We Offer
          </div>
          <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4">Program Areas</h2>
          <div class="w-12 h-1 bg-[#f97316] rounded-full mx-auto mb-6"></div>
          <p class="text-gray-500 text-base max-w-xl mx-auto">
            Accelerated, career-focused tracks designed to get you workforce-ready fast.
          </p>
          <p class="text-gray-400 text-sm mt-4">
            <i class="ri-lock-line"></i> Locked programs require enrollment.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          ${PROGRAMS.map((p) => programCard(p, user)).join('')}
        </div>

        <div class="text-center">
          <a href="https://mntacademy.com/#waitlist" target="_blank" rel="noopener"
             class="inline-block bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5 rounded-xl
                    transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
            Request Information
          </a>
        </div>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ----------------------------------------------------------- program view */

const STATE_STYLES = {
  complete:    { label: 'Complete',    icon: 'ri-checkbox-circle-fill', cls: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]' },
  in_progress: { label: 'In Progress', icon: 'ri-progress-4-line',      cls: 'bg-[#fff7ed] border-[#fed7aa] text-[#c2410c]' },
  not_started: { label: 'Not Started', icon: 'ri-circle-line',          cls: 'bg-gray-50 border-gray-200 text-gray-500' },
  locked:      { label: 'Locked',      icon: 'ri-lock-line',            cls: 'bg-gray-50 border-gray-200 text-gray-400' },
  draft:       { label: 'In Development', icon: 'ri-tools-line',        cls: 'bg-gray-50 border-gray-200 text-gray-400' },
};

function moduleCard(program, key, user) {
  const m = program.modules[key];
  // Locked is DERIVED here, never stored. PLATFORM_ARCHITECTURE.md §4.3.
  const unlocked = hasModuleAccess(user, program.slug, key);
  const completion = moduleCompletion(program, key, user);
  const state = !unlocked ? 'locked'
              : m.status === 'draft' ? 'draft'
              : completion.complete ? 'complete'
              : completion.contentOpened || completion.fixtureState !== 'not_started' ? 'in_progress'
              : 'not_started';
  const s = STATE_STYLES[state];
  const labs = programLabs(program).filter((lab) => lab.module === key);
  const curriculumItems = Array.isArray(m.curriculumItems) ? m.curriculumItems : [];
  const parentRecords = moduleParentRecords(program, m, labs);
  const completionLabel = completion.complete
    ? 'Complete: module content opened and every lab completed'
    : 'Not complete: open the module content and complete every lab';

  return `
  <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${unlocked ? '' : 'mnt-locked'}">
    <button aria-expanded="false" aria-controls="body-${esc(key)}" data-acc
            data-program="${esc(program.slug)}" data-module="${esc(key)}"
            class="w-full text-left p-7 flex items-start gap-5 hover:bg-gray-50/60 transition-colors cursor-pointer">

      <div class="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8 text-[#1e3a5f] font-bold">
        ${String(m.number).padStart(2, '0')}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap mb-1.5">
          <span class="inline-flex items-center gap-1.5 border ${s.cls} text-xs font-semibold px-2.5 py-1 rounded-full">
            <i class="${s.icon}"></i>${s.label}
          </span>
          ${m.isCapstone ? '<span class="inline-flex items-center gap-1.5 bg-[#f97316]/10 text-[#f97316] text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest">Capstone</span>' : ''}
        </div>
        <h3 class="text-[#1e3a5f] font-bold text-base leading-snug mb-2">${esc(m.title)}</h3>
        <p class="text-gray-500 text-sm leading-relaxed mb-3">${esc(m.summary)}</p>
        <div class="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          ${m.durationMinutes ? `<span><i class="ri-time-line"></i> ${formatInstructionalMinutes(m.durationMinutes)}</span>` : ''}
          ${curriculumItems.length ? `<span><i class="ri-book-open-line"></i> ${curriculumItems.length} Curriculum Block${curriculumItems.length === 1 ? '' : 's'}</span>` : ''}
          ${labs.length ? `<span><i class="ri-flask-line"></i> ${labs.length} Performance Lab${labs.length === 1 ? '' : 's'}</span>` : ''}
          <span>Week ${m.week}</span>
        </div>
      </div>

      <span class="flex items-center gap-3 shrink-0 pt-1">
        <span class="mnt-module-completion-dot w-2.5 h-2.5 rounded-full ${completion.complete ? 'bg-[#22c55e] ring-4 ring-[#dcfce7]' : 'bg-gray-300 ring-4 ring-gray-100'}"
              role="status" aria-label="${completionLabel}" title="${completionLabel}"></span>
        <span class="w-8 h-8 grid place-items-center rounded-full bg-gray-50 border border-gray-200" aria-hidden="true">
          <i class="ri-arrow-down-s-line acc-chev text-xl text-gray-500 transition-transform duration-200"></i>
        </span>
      </span>
    </button>

    <div class="acc-body" id="body-${esc(key)}">
      <div>
        <div class="px-7 pb-7">
          <div class="h-px bg-gray-100 mb-6"></div>

          ${
            m.skills.length
              ? `<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Skills Developed</p>
                 <div class="flex flex-wrap gap-2 mb-6">${m.skills.map((sk) => chip(sk, true)).join('')}</div>`
              : ''
          }

          ${
            curriculumItems.length
              ? `<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Curriculum Blocks</p>
                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                   ${curriculumItems.map(curriculumItemRow).join('')}
                 </div>`
              : m.isCapstone
              ? `<div class="bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-5 py-4 mb-6">
                   <p class="text-[#9a3412] font-medium text-sm mb-1">Integrated Prove assessment</p>
                   <p class="text-[#9a3412]/80 text-sm">No new instructional blocks are introduced in the capstone.</p>
                 </div>`
              : ''
          }

          ${
            parentRecords.length
              ? `<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Technical Parent Mapping</p>
                 <div class="flex flex-col gap-2 mb-6">
                   ${parentRecords.map((parent) => `
                     <div class="border border-gray-100 rounded-xl px-4 py-3">
                       <p class="text-[#1e3a5f] font-semibold text-xs mb-1">${esc(parent.code)}</p>
                       <p class="text-gray-500 text-xs leading-relaxed">${esc(parent.title)}</p>
                     </div>`).join('')}
                 </div>
                 <p class="text-gray-400 text-xs mb-6">Developer-mapped to the required technical parents; pending comparison with the controlling Form 301.</p>`
              : ''
          }

          ${
            m.status === 'draft'
              ? `<div class="flex items-start gap-4 bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
                   <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e3a5f]/10 shrink-0">
                     <i class="ri-tools-line text-lg text-[#1e3a5f]"></i>
                   </div>
                   <div>
                     <p class="text-[#1e3a5f] font-medium text-sm mb-1">Lessons and labs are being authored.</p>
                     <p class="text-gray-500 text-sm">
                       This module's place in the program is set. Its lessons, hands-on exercises, and skills will
                       appear here as the curriculum is completed.
                     </p>
                   </div>
                 </div>`
              : unlocked
              ? `<p class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Hands-On Labs</p>
                 <div class="flex flex-col gap-3 mb-6">
                   ${
                     labs.length
                       ? labs.map((l) => labRow(l)).join('')
                       : '<p class="text-gray-400 text-sm">No lab in this module.</p>'
                   }
                 </div>
                 <a href="#/program/${esc(program.slug)}/module/${m.number}"
                    class="inline-block bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-6 py-2.5 rounded-xl
                           transition-all hover:-translate-y-0.5 text-sm cursor-pointer">
                   ${state === 'complete' ? 'Review Module' : state === 'in_progress' ? 'Continue Module' : 'Start Module'}
                 </a>`
              : `<div class="flex items-start gap-4 bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
                   <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e3a5f]/10 shrink-0">
                     <i class="ri-lock-line text-lg text-[#1e3a5f]"></i>
                   </div>
                   <div>
                     <p class="text-[#1e3a5f] font-medium text-sm mb-1">This module is not included in your enrollment.</p>
                     <p class="text-gray-500 text-sm">
                       Lessons and labs are unavailable, but the module outline stays visible so you can see what the
                       full program covers.
                     </p>
                   </div>
                 </div>`
          }
        </div>
      </div>
    </div>
  </div>`;
}

function refreshModuleCompletionDot(button, user) {
  const program = PROGRAMS.find((item) => item.slug === button.dataset.program);
  if (!program || !program.modules[button.dataset.module]) return;
  const dot = button.querySelector('.mnt-module-completion-dot');
  if (!dot) return;
  const complete = moduleCompletion(program, button.dataset.module, user).complete;
  dot.classList.toggle('bg-[#22c55e]', complete);
  dot.classList.toggle('ring-[#dcfce7]', complete);
  dot.classList.toggle('bg-gray-300', !complete);
  dot.classList.toggle('ring-gray-100', !complete);
  const label = complete
    ? 'Complete: module content opened and every lab completed'
    : 'Not complete: open the module content and complete every lab';
  dot.setAttribute('aria-label', label);
  dot.title = label;
}

function labRow(lab) {
  return `
  <div class="flex items-center gap-4 bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
    <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e3a5f]/10 shrink-0">
      <i class="ri-flask-line text-lg text-[#1e3a5f]"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[#1e3a5f] font-medium text-sm">${esc(lab.title)}</p>
      <p class="text-gray-500 text-xs mt-0.5">${esc(lab.difficulty)} · ${formatInstructionalMinutes(lab.instructionalMinutes || lab.minutes)}</p>
    </div>
    <span class="text-gray-500 font-semibold text-xs whitespace-nowrap">
      Hands-on lab
    </span>
  </div>`;
}

function labCard(program, lab, unlocked) {
  const module = program.modules[lab.module];
  return `
  <div class="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col gap-5 shadow-sm ${unlocked ? 'hover:-translate-y-1' : 'mnt-locked-strong'} transition-transform duration-200">
    <div class="flex items-start justify-between gap-3">
      <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8">
        <i class="${lab.isCapstone ? 'ri-flag-line' : 'ri-flask-line'} text-2xl text-[#1e3a5f]"></i>
      </div>
      <span class="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg">
        Module ${String(module.number).padStart(2, '0')}
      </span>
    </div>
    <div class="flex-1">
      <h3 class="text-[#1e3a5f] font-bold text-base leading-snug mb-2">${esc(lab.title)}</h3>
      <p class="text-gray-500 text-xs mb-3">
        ${esc(lab.difficulty)} · ${formatInstructionalMinutes(lab.instructionalMinutes || lab.minutes)}
      </p>
      <p class="text-gray-500 text-sm leading-relaxed">${esc(lab.description)}</p>
    </div>
    <div class="flex flex-wrap gap-2">${lab.skills.map((s) => chip(s, true)).join('')}</div>
    <div class="h-px bg-gray-100"></div>
    <div class="text-xs space-y-1">
      <p class="text-gray-600"><strong>Assessment:</strong> <span class="text-gray-500">${esc(lab.assessmentMethod)}</span></p>
      <p class="text-gray-600"><strong>Pass standard:</strong> <span class="text-gray-500">70% + no critical safety errors</span></p>
    </div>
    <div class="h-px bg-gray-100"></div>
    <p class="text-xs font-semibold uppercase tracking-widest ${unlocked ? 'text-[#1e3a5f]' : 'text-gray-400'}">
      ${unlocked ? 'Hands-on lab included in the module view' : 'Hands-on lab locked with this module'}
    </p>
  </div>`;
}

function viewProgram(user, slug) {
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return viewNotFound(user);
  if (!hasProgramAccess(user, slug)) return viewNoAccess(user, program);
  // Enrolled, but this track's content file is still a stub.
  if (!isBuilt(program)) return viewInDevelopment(user, program);

  const enrollment = enrollmentFor(user, slug);
  const prog = programProgress(user, program);
  // Inline onclick handlers in the rendered HTML lose the lexical `user`/
  // `program` closures once innerHTML is set, so the export button reaches
  // them via these globals instead — set on every render, read only by
  // exportStudentRecord() at click time (Sprint F, architecture.md).
  window.__mntCurrentUser = user;
  window.__mntCurrentProgram = program;
  // The lab catalogue is per-track. Tracks whose labs are not authored yet get
  // no Labs or Capstone section at all, rather than an empty grid.
  const trackLabs = programLabs(program);
  const performanceLabs = trackLabs.filter((lab) => !lab.isCapstone);
  const unlockedLabs = performanceLabs.filter((l) => hasModuleAccess(user, slug, l.module));
  const hasLabs = performanceLabs.length > 0;
  const capstoneEntry = Object.entries(program.modules).find(([, module]) => module.isCapstone);
  const capstoneModuleKey = capstoneEntry && capstoneEntry[0];
  const capstoneModule = capstoneEntry && capstoneEntry[1];
  const capstoneLab = capstoneModuleKey && trackLabs.find((lab) => lab.module === capstoneModuleKey && lab.isCapstone);
  const hasCapstone = Boolean(capstoneModule && capstoneLab);
  const capstonePrerequisites = Object.keys(program.modules)
    .filter((key) => !program.modules[key].isCapstone);
  const capstoneReady = hasCapstone && hasModuleAccess(user, slug, capstoneModuleKey)
    && capstonePrerequisites.every((key) => moduleCompletion(program, key, user).complete);
  const displayTitle = (program.compliance && program.compliance.programName) || program.title;

  return `
  ${header(user)}
  <main class="pt-16">

    <!-- hero -->
    <section class="relative py-16 px-8 overflow-hidden"
             style="background: linear-gradient(150deg, #0c1e32 0%, #1e3a5f 50%, #162d4a 100%)">
      <div class="mnt-stars"></div>
      <div class="absolute -top-20 right-1/4 w-96 h-96 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="relative z-10 max-w-7xl mx-auto">
        <a href="#/portal" class="inline-flex items-center gap-1.5 text-white/55 hover:text-white text-sm mb-6 transition-colors cursor-pointer">
          <i class="ri-arrow-left-line"></i> All Programs
        </a>
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/15">
          <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>${esc(program.category)}
        </div>
        <h1 class="text-3xl font-bold text-white mb-4">${esc(displayTitle)}</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/80 text-base max-w-2xl mb-3">${esc(program.tagline || '')}</p>
        <p class="text-white/55 text-base max-w-2xl">${esc(program.intro || program.description)}</p>

        ${
          program.compliance
            ? `<div class="mt-8 inline-flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4 max-w-2xl">
                 <i class="ri-file-list-3-line text-[#f97316] text-lg mt-0.5"></i>
                 <p class="text-white/80 text-sm">
                   Curriculum map status: <strong class="text-white">developer-mapped</strong>. Exact item and parent
                   allocations remain pending curriculum/compliance review and comparison with the controlling Form 301.
                 </p>
               </div>`
            : ''
        }

        ${
          !program.isPublished
            ? `<div class="mt-8 inline-flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4 max-w-2xl">
                 <i class="ri-tools-line text-[#f97316] text-lg mt-0.5"></i>
                 <p class="text-white/80 text-sm">
                   ${program.slug === 'it-support'
                     ? 'This <strong class="text-white">12-module Help Desk outline is in development</strong>. Lesson and lab allocations remain unresolved, including the approved virtualization requirement; no training-hour claim is shown here.'
                     : 'This <strong class="text-white">12-module outline is in development</strong>. Lessons, labs, hours, and the capstone remain draft until this track\'s governing curriculum is mapped and reviewed.'}
                 </p>
               </div>`
            : ''
        }
        ${
          enrollment.accessMode === 'partial'
            ? `<div class="mt-8 inline-flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4 max-w-2xl">
                 <i class="ri-information-line text-[#f97316] text-lg mt-0.5"></i>
                 <p class="text-white/80 text-sm">
                   Your enrollment covers <strong class="text-white">${enrollment.modules.length} of ${prog.total} modules</strong>.
                   Remaining modules stay visible but locked.
                 </p>
               </div>`
            : ''
        }
      </div>
    </section>

    <!-- progress + stats -->
    <section class="py-12 px-8 mnt-band border-b border-gray-100">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm mb-6">
          <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1.5">Your Progress</p>
              <h2 class="text-[#1e3a5f] font-bold text-base">Modules Completed: ${prog.done} / ${prog.total}</h2>
            </div>
            <span class="text-3xl font-bold text-[#1e3a5f]">${prog.percent}%</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-[#f97316] rounded-full transition-all" style="width: ${prog.percent}%"></div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" id="student-transcript-pdf-btn" onclick="downloadStudentTranscriptPdf(window.__mntCurrentUser, window.__mntCurrentProgram)"
              class="text-sm font-semibold bg-[#1e3a5f] hover:bg-[#16304f] text-white px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
              <i class="ri-file-text-line"></i> Download Transcript (PDF)
            </button>
            <button type="button" id="student-evidence-pdf-btn" onclick="downloadStudentEvidencePdf(window.__mntCurrentUser, window.__mntCurrentProgram)"
              class="text-xs font-semibold text-[#1e3a5f]/70 hover:text-[#1e3a5f] inline-flex items-center gap-1.5">
              <i class="ri-file-list-3-line"></i> Download Evidence Record (PDF)
            </button>
            <button type="button" onclick="exportStudentRecord(window.__mntCurrentUser, window.__mntCurrentProgram)"
              class="text-xs font-semibold text-gray-400 hover:text-gray-600 inline-flex items-center gap-1.5">
              <i class="ri-download-2-line"></i> Download data (JSON, secondary)
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          ${program.stats.map((s) => `
            <div class="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8 mb-4">
                <i class="${esc(s.icon)} text-2xl text-[#1e3a5f]"></i>
              </div>
              <p class="text-gray-500 text-xs mb-1.5">${esc(s.label)}</p>
              <p class="text-[#1e3a5f] font-bold text-base leading-snug">${esc(s.value)}</p>
            </div>`).join('')}
        </div>

        ${
          program.compliance
            ? `<div class="mt-6 bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
                 <p class="text-[#1e3a5f] font-semibold text-base mb-6">70 Hours Technical Training + 12 Hours Career Readiness = 82 Clock Hours</p>
                 <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                     <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Technical Curriculum</p>
                     <p class="text-[#1e3a5f] text-2xl font-bold">${program.compliance.technicalHours} Hours</p>
                     <p class="text-gray-500 text-sm mt-1">30 technical theory + ${program.compliance.labHours} lab</p>
                   </div>
                   <div>
                     <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Separate Companion</p>
                     <p class="text-[#1e3a5f] text-2xl font-bold">${program.compliance.careerHours} Hours</p>
                     <p class="text-gray-500 text-sm mt-1">M360 career-readiness theory</p>
                   </div>
                   <div>
                     <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Program Total</p>
                     <p class="text-[#1e3a5f] text-2xl font-bold">${program.compliance.totalHours} Hours</p>
                   <p class="text-gray-500 text-sm mt-1">${program.compliance.theoryHours} theory (including M360) + ${program.compliance.labHours} lab</p>
                   </div>
                 </div>
                 <p class="text-gray-400 text-xs mt-5">The technical theory/lab allocation is the current developer map and remains pending compliance sign-off.</p>
               </div>`
            : ''
        }
      </div>
    </section>

    <!-- program nav -->
    <nav class="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-8 flex gap-1 overflow-x-auto" style="scrollbar-width: none">
        ${[
          ['Curriculum', 'curriculum'],
          ...(hasLabs ? [['Labs', 'labs']] : []),
          ...(hasCapstone ? [['Capstone', 'capstone']] : []),
          [program.careerReadiness ? 'M360 Companion' : 'Career Readiness', 'career-readiness'],
        ].map(([label, anchor]) => `
          <a href="#sec-${anchor}"
             class="relative whitespace-nowrap text-gray-600 hover:text-[#1e3a5f] text-sm font-medium transition-all duration-300
                    cursor-pointer px-4 py-4 hover:bg-[#1e3a5f]/8 group">
            ${label}
            <span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#f97316] rounded-full transition-all duration-300 group-hover:w-3/4"></span>
          </a>`).join('')}
      </div>
    </nav>

    <!-- curriculum -->
    <section id="sec-curriculum" class="py-16 px-8 scroll-mt-32">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-[#1e3a5f] mb-3">Curriculum</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-3"></div>
        <div class="flex items-center justify-between gap-4 flex-wrap mb-12">
          <p class="text-gray-500 text-base">6 Weeks · 12 Modules</p>
          <p class="inline-flex items-center gap-2 text-gray-500 text-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-[#22c55e] ring-4 ring-[#dcfce7]"></span>
            Green means the content was opened and every module lab was completed
          </p>
        </div>

        ${program.weekGroups.map((w) => `
          <div class="mb-12">
            <div class="flex items-center gap-4 mb-6">
              <p class="text-[#f97316] text-xs font-semibold uppercase tracking-widest whitespace-nowrap">${esc(w.label)}</p>
              <div class="h-px bg-gray-100 flex-1"></div>
            </div>
            <div class="flex flex-col gap-4">
              ${w.modules.map((k) => moduleCard(program, k, user)).join('')}
            </div>
          </div>`).join('')}
      </div>
    </section>

    <!-- NESTED LAB ENVIRONMENT -->
    ${!hasLabs ? '' : `
    <section id="sec-labs" class="py-16 px-8 mnt-band scroll-mt-32">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold text-[#1e3a5f] mb-3">Hands-On Labs</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-3"></div>
        <p class="text-gray-500 text-base mb-8">
          Labs run inside the Mission Next security operations simulator. Your configuration, saved queries, and
          investigation state persist to your account between sessions.
        </p>

        <!-- isolated module labs; the complete simulator stays behind Module 12 -->
        <div class="relative overflow-hidden rounded-2xl p-8 mb-10"
             style="background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 45%, #0f2440 100%)">
          <div class="mnt-stars"></div>
          <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
               style="background: radial-gradient(circle, #f97316 0%, transparent 70%)"></div>
          <div class="relative z-10 flex items-center justify-between gap-8 flex-wrap">
            <div class="max-w-xl">
              <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 border border-white/15">
                <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Lab Environment
              </div>
              <h3 class="text-white font-bold text-xl mb-3">Mission Next Security Operations Labs</h3>
              <p class="text-white/55 text-sm leading-relaxed">
                Each module opens a focused, fictional workspace with only the evidence and controls needed for its
                learning objective. The complete interconnected range remains reserved for the final capstone.
              </p>
            </div>
            <div class="flex flex-col gap-3">
              <a href="#sec-curriculum"
                 class="inline-flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold
                        px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                <i class="ri-stack-line"></i> Choose a Module
              </a>
              <span class="text-white/40 text-xs text-center">Module labs keep their own saved state</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${performanceLabs
            .map((l) => labCard(program, l, hasModuleAccess(user, slug, l.module)))
            .join('')}
        </div>

        <p class="text-gray-400 text-xs mt-6">
          ${unlockedLabs.length} of ${performanceLabs.length} module labs available with your current enrollment.
        </p>
        <p class="text-gray-500 text-xs mt-3">
          <strong>${performanceLabs.length} non-capstone labs</strong> build analytical competencies over 36 hours of hands-on investigation.
          The <strong>capstone lab</strong> (Module 12) is a 4-hour integrated assessment. Together: 16 + 1 = 40 hours of hands-on technical training.
        </p>
      </div>
    </section>

    `}

    <!-- capstone -->
    ${!hasCapstone ? '' : `
    <section id="sec-capstone" class="relative py-16 px-8 overflow-hidden scroll-mt-32"
             style="background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 45%, #0f2440 100%)">
      <div class="mnt-stars"></div>
      <div class="relative z-10 max-w-7xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/15">
          <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Module ${String(capstoneModule.number).padStart(2, '0')} · ${formatInstructionalMinutes(capstoneLab.instructionalMinutes || capstoneLab.minutes)} · Final Assessment
        </div>
        <h2 class="text-3xl font-bold text-white mb-3">${esc(capstoneModule.title)}</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/55 text-base max-w-2xl mb-10">
          A full security operations investigation in which you decide the path, reconstruct the attack, act within
          scope, and defend your final conclusion. This is the only Prove assessment and integrates all competencies
          taught in Modules 01–11.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          ${[
            'Alert triage', 'Email analysis', 'Identity analysis', 'Endpoint analysis',
            'Network analysis', 'Threat intelligence', 'Threat hunting', 'Exposure analysis',
            'Incident response', 'Evidence handling', 'ATT&CK mapping', 'Final reporting',
          ].map((capability) => `
            <div class="flex items-center gap-4 bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4">
              <span class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[#f97316]/20 text-[#f97316]" aria-hidden="true">
                <i class="ri-checkbox-blank-circle-line"></i>
              </span>
              <span class="text-white/80 font-medium text-sm">${esc(capability)}</span>
            </div>`).join('')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div class="bg-white/[0.06] border border-white/10 rounded-xl px-6 py-5">
            <p class="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Rubric scoring</p>
            <p class="text-white text-sm leading-relaxed">
              Ten scored domains (Triage, Query, Timeline, Scope, Enrichment, ATT&CK, Detection, Response, Reporting, Closure) at 10 points each. Pass requires 70% (70 points) plus no critical-error gate violations.
            </p>
          </div>
          <div class="bg-white/[0.06] border border-white/10 rounded-xl px-6 py-5">
            <p class="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Prior instruction trace</p>
            <p class="text-white text-sm leading-relaxed">
              Draws on competencies from all 11 prior modules: SOC operations and analyst workflow (M01), network and identity foundations (M02), SIEM and log analysis (M03), detection rule tuning (M04), endpoint investigation (M05), threat hunting (M06), network and email analysis (M07), vulnerability prioritization (M08), incident response (M09), evidence handling (M10), and SOC metrics/reporting (M11).
            </p>
          </div>
        </div>

        <div class="mt-10">
          ${
            capstoneReady
              ? `<a href="#/program/${esc(slug)}/module/${capstoneModule.number}"
                    class="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5
                           rounded-xl transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                   <i class="ri-flag-line"></i> Begin Capstone
                 </a>`
              : `<span class="inline-flex items-center gap-2 border border-white/20 text-white/50 font-semibold px-8 py-3.5 rounded-xl">
                   <i class="ri-lock-line"></i> Complete ${capstonePrerequisites.length} prerequisite modules to unlock
                 </span>`
          }
        </div>
      </div>
    </section>

    `}

    <!-- separately accounted career readiness -->
    <section id="sec-career-readiness" class="py-16 px-8 scroll-mt-32">
      <div class="max-w-6xl mx-auto">
        ${
          program.careerReadiness
            ? (() => {
                const m360Sum = m360CompletionSummary(user);
                return `<div class="flex items-start justify-between gap-8 flex-wrap mb-10">
                 <div class="max-w-3xl">
                   <div class="inline-flex items-center gap-2 bg-[#f97316]/10 text-[#f97316] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                     ${esc(program.careerReadiness.code)} · Separate Companion Course
                   </div>
                   <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4 leading-tight">M360 Career Readiness Companion</h2>
                   <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
                   <p class="text-gray-600 text-base leading-relaxed mb-3">${esc(program.careerReadiness.title)}</p>
                   <p class="text-gray-500 text-sm leading-relaxed">${esc(program.careerReadiness.boundary)}</p>
                 </div>
                 <div class="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 min-w-56">
                   <p class="text-gray-500 text-xs mb-1">Separate duration</p>
                   <p class="text-[#1e3a5f] text-2xl font-bold">${program.careerReadiness.hours} Hours</p>
                   <p class="text-gray-500 text-xs font-medium mt-3">${m360Sum.completed}/${m360Sum.total} Complete</p>
                 </div>
               </div>
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 ${program.careerReadiness.items.map((item) => {
                   const progress = loadM360Progress(user);
                   const isCompleted = progress.completedItems.includes(item.key);
                   return `
                   <div class="bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4 cursor-pointer transition-all hover:border-[#f97316] hover:shadow-md"
                        onclick="toggleM360ItemCompletion('${item.key}')">
                     <div class="flex items-start justify-between gap-2 mb-2">
                       <p class="text-[#1e3a5f] font-medium text-sm flex-1">${esc(item.title)}</p>
                       ${isCompleted ? `<i class="ri-check-circle-fill text-[#f97316] text-base flex-shrink-0"></i>` : `<i class="ri-checkbox-blank-circle-line text-gray-300 text-base flex-shrink-0"></i>`}
                     </div>
                     <p class="text-gray-500 text-xs">${formatInstructionalMinutes(item.durationMinutes)}</p>
                   </div>`;
                 }).join('')}
               </div>
               <p class="text-gray-400 text-xs mt-6">Developer-mapped structure; curriculum and compliance review remain pending.</p>`;
              })()
            : `<div class="text-center max-w-3xl mx-auto">
                 <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4">Career Readiness</h2>
                 <p class="text-gray-500">Career-readiness curriculum details for this track are still in development.</p>
               </div>`
        }

        ${
          program.compliance
            ? `<div class="mt-12 border-t border-gray-100 pt-8 max-w-4xl">
                 <p class="text-[#1e3a5f] font-semibold text-sm mb-2">Secondary Security+ alignment</p>
                 <p class="text-gray-500 text-xs leading-relaxed">
                   Some SOC concepts may overlap with CompTIA Security+ objectives. Any future crosswalk is secondary
                   metadata only and does not define this syllabus. Mission Next is independent of CompTIA, and
                   Security+ is not required for program completion.
                 </p>
               </div>`
            : ''
        }
      </div>
    </section>
  </main>
  ${footer()}`;
}

function viewInDevelopment(user, program) {
  return `
  ${header(user)}
  <main class="pt-16">
    <section class="relative py-16 px-8 overflow-hidden"
             style="background: linear-gradient(150deg, #0c1e32 0%, #1e3a5f 50%, #162d4a 100%)">
      <div class="mnt-stars"></div>
      <div class="relative z-10 max-w-7xl mx-auto">
        <a href="#/portal" class="inline-flex items-center gap-1.5 text-white/55 hover:text-white text-sm mb-6 transition-colors cursor-pointer">
          <i class="ri-arrow-left-line"></i> All Programs
        </a>
        <h1 class="text-3xl font-bold text-white mb-4">${esc(program.title)}</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/55 text-base max-w-2xl">${esc(program.description)}</p>
      </div>
    </section>

    <section class="py-16 px-8">
      <div class="max-w-3xl mx-auto text-center">
        <div class="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-[#1e3a5f]/8 mb-6">
          <i class="ri-tools-line text-2xl text-[#1e3a5f]"></i>
        </div>
        <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4">Curriculum in development</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mx-auto mb-6"></div>
        <p class="text-gray-500 text-base leading-relaxed mb-8">
          Your enrollment in this program is active. The module-by-module curriculum, hands-on labs, and capstone
          are being authored now, and will appear here as soon as the track is published.
        </p>
        <a href="#/portal" class="inline-block bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5
                                  rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer">Back to My Programs</a>
      </div>
    </section>
  </main>
  ${footer()}`;
}

function viewNoAccess(user, program) {
  return `
  ${header(user)}
  <main class="pt-16">
    <section class="py-24 px-8">
      <div class="max-w-xl mx-auto text-center">
        <div class="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-[#1e3a5f]/8 mb-6">
          <i class="ri-lock-line text-2xl text-[#1e3a5f]"></i>
        </div>
        <h1 class="text-3xl font-bold text-[#1e3a5f] mb-4">You are not enrolled in this program</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mx-auto mb-6"></div>
        <p class="text-gray-500 text-base mb-8">
          ${esc(program.cardTitle)} is not part of your current enrollment.
        </p>
        <a href="#/portal" class="inline-block bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5
                                  rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer">Back to My Programs</a>
      </div>
    </section>
  </main>
  ${footer()}`;
}

function viewNotFound(user) {
  return `${header(user)}
  <main class="pt-16"><section class="py-24 px-8 text-center">
    <h1 class="text-3xl font-bold text-[#1e3a5f] mb-4">Page not found</h1>
    <a href="#/portal" class="text-[#f97316] font-semibold text-sm">Back to My Programs</a>
  </section></main>${footer()}`;
}

// Persists the admin table's active sort column/direction across the full
// app.innerHTML rebuilds render() does on every admin data refresh (enrollment
// toggle, planning-record save, re-poll) — a DOM/element-local variable would
// reset to the default sort on every one of those, same class of bug as the
// pre-existing track-filter/hide-not-started reset weakness (NEXT_SESSION.md
// 2026-08-31 sortable-columns sprint). null key = default modules_complete/
// last_active sort (unchanged from before this feature existed).
let adminTableSort = { key: null, dir: 1 };

// Persists which admin tab is showing across a full render() rebuild — same
// reason as adminTableSort above (the "Run archive sweep now" action calls
// render() to pick up the refreshed cohorts list, and without this the admin
// would land back on the Student Progress tab every time). Client-side tab
// clicks in wireAdmin() below update this directly (no re-render needed for
// those); only a full render() reads it, in viewAdmin().
let adminActiveTab = 'progress';

/* ------------------------------------------------- completion-speed review flags */
/* Bug-bounty finding, 2026-09-01 (NEXT_SESSION.md, supabase/migrations/
 * 20260901103000_completion_integrity_guards.sql): that migration's guard
 * trigger stops a student from marking a module complete with zero recorded
 * lab work, but it can't prove a *specific* completed lab attempt belongs to
 * a *specific* completed module — the DB-side modules/labs catalogue that
 * would let it was deliberately dropped in favor of portal/data.js
 * (20260828160000_simplify_schema.sql). A determined student could still
 * fabricate one plausible-looking lab_attempts row per module they want to
 * fake. What that kind of forgery can't fake is time: module_progress.
 * started_at is stamped the moment a student first opens a module's content
 * (markModuleContentOpened -> markModuleInProgressRemote), and completed_at
 * when they finish it — a human reading real curriculum content (150-720
 * credited minutes per SOC module, per program_course_hours) cannot compress
 * that to seconds, but a scripted direct-API forgery naturally does.
 *
 * This is a REVIEW signal, not a verdict — flagged accounts need a human
 * look, not automatic action. It also has real, legitimate explanations:
 * a student who already knows the material (prior experience, re-taking
 * after a reset), reviewed the content in an earlier session before this
 * server-recorded started_at, or has multiple tabs/devices open can all
 * trip the same threshold. The admin UI says this explicitly wherever the
 * flag appears — never present it as confirmed misconduct. */
const FAST_MODULE_COMPLETION_MS = 3 * 60 * 1000;   // 3 minutes start-to-finish
const FAST_TRACK_COMPLETION_MS = 24 * 60 * 60 * 1000; // 24 hours enrollment-to-completion

function formatDuration(ms) {
  if (ms < 60 * 1000) return `${Math.max(1, Math.round(ms / 1000))} sec`;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / (60 * 1000))} min`;
  if (ms < 24 * 60 * 60 * 1000) return `${(ms / (60 * 60 * 1000)).toFixed(1)} hr`;
  return `${(ms / (24 * 60 * 60 * 1000)).toFixed(1)} days`;
}

/* moduleProgressRows: bulk-fetched, admin-visible 'complete' rows across all
 * students (module_progress_admin_read policy). Returns Map<user_id,
 * reason[]> — only students with at least one review-worthy signal appear. */
function buildCheatingReviewFlags(dashboardRows, moduleProgressRows) {
  const flags = new Map();
  const addReason = (userId, reason) => {
    if (!flags.has(userId)) flags.set(userId, []);
    flags.get(userId).push(reason);
  };

  (moduleProgressRows || []).forEach((row) => {
    if (row.state !== 'complete' || !row.started_at || !row.completed_at) return;
    const elapsedMs = new Date(row.completed_at).getTime() - new Date(row.started_at).getTime();
    if (elapsedMs >= 0 && elapsedMs < FAST_MODULE_COMPLETION_MS) {
      addReason(row.user_id, `Module ${row.module_key} marked complete ${formatDuration(elapsedMs)} after being opened`);
    }
  });

  (dashboardRows || []).forEach((row) => {
    if (!row.user_id || !row.enrollmentDate || !row.completionDate) return;
    const elapsedMs = new Date(row.completionDate).getTime() - new Date(row.enrollmentDate).getTime();
    if (elapsedMs >= 0 && elapsedMs < FAST_TRACK_COMPLETION_MS && (row.modules_complete || 0) >= (row.modules_total || 12)) {
      addReason(row.user_id, `Entire track completed ${formatDuration(elapsedMs)} after enrollment`);
    }
  });

  return flags;
}

/* ----------------------------------------- admin-provision Edge Function */

/* Calls supabase/functions/admin-provision (COHORT_USER_LIFECYCLE_SPRINT_
 * PLAN.md Sprint 3/4) for the "Generate New User" and "Generate New Cohort"
 * admin panel actions. Reuses the exact session-access idiom already used by
 * currentUser() above (mntSupabase.auth.getSession()) rather than inventing a
 * new one. The function URL is derived from MNT_SUPABASE_URL exactly as the
 * sprint plan specifies — that constant is declared in
 * portal/supabase-config.js, a sibling plain <script> loaded before this
 * file, so it is already in scope here the same way mntSupabase itself is. */
async function callAdminProvision(action, payload) {
  const { data: { session } } = await mntSupabase.auth.getSession();
  const accessToken = session && session.access_token;
  if (!accessToken) throw new Error('No active admin session. Sign in again and retry.');

  const res = await fetch(`${MNT_SUPABASE_URL}/functions/v1/admin-provision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // Fall through with body still null — handled below.
  }
  if (!res.ok) {
    throw new Error((body && body.error) || `admin-provision request failed (status ${res.status}).`);
  }
  if (!body) throw new Error('admin-provision returned an unexpected empty response.');
  return body;
}

/* One-click-to-select-all for the plaintext credential blocks below, per the
 * sprint plan's "copyable... plain text selection is fine — do not add a
 * clipboard-API dependency" instruction. Re-wired every time a result panel's
 * innerHTML is replaced, since DOM nodes (and any listeners on them) are
 * discarded on each re-render — same rule as every other post-render wiring
 * step in this file. */
function wireSelectAllBlocks(container) {
  if (!container) return;
  container.querySelectorAll('[data-select-all]').forEach((el) => {
    el.addEventListener('click', () => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  });
}

async function toggleCredentialsPanel(studentId, btn) {
  const panel = document.querySelector(`[data-cred-panel="${studentId}"]`);
  const inner = document.querySelector(`[data-cred-panel-inner="${studentId}"]`);
  const chevron = document.querySelector(`[data-cred-chevron="${studentId}"]`);
  if (!panel || !inner) return;

  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    panel.style.maxHeight = '0px';
    btn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = '';
    return;
  }

  btn.setAttribute('aria-expanded', 'true');
  if (chevron) chevron.style.transform = 'rotate(90deg)';
  if (!inner.dataset.loaded) {
    inner.innerHTML = '<p class="text-sm text-gray-400">Loading credentials…</p>';
    panel.style.maxHeight = '48px';
    const { data, error } = await mntSupabase
      .from('student_credentials')
      .select('password, created_at')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      inner.innerHTML = `<p class="text-sm text-red-600">Could not load credentials — ${esc(error.message)}</p>`;
    } else if (!data) {
      inner.innerHTML = '<p class="text-sm text-gray-500">No stored password for this account — it was likely created before this feature existed, or the write failed at creation time.</p>';
    } else {
      inner.innerHTML = `
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Login Credentials</p>
        <pre data-select-all tabindex="0" class="inline-block bg-white border border-gray-200 rounded-lg p-3 text-sm font-mono text-gray-900 cursor-text overflow-x-auto" title="Click to select all">Student ID: ${esc(studentId)}
Password:   ${esc(data.password)}</pre>
        <p class="text-xs text-gray-400 mt-2">Generated ${new Date(data.created_at).toLocaleDateString()}</p>`;
      wireSelectAllBlocks(inner);
    }
    inner.dataset.loaded = '1';
  }
  panel.style.maxHeight = `${panel.scrollHeight}px`;
}

/* Readable "3h 20m" formatting for a single admin_site_sessions row's own
 * duration_minutes. Deliberately labeled "site time" everywhere it's shown
 * in the UI, never "hours" alone — matches site_sessions' own migration
 * comment that this is operational visibility only, not an
 * instructional/credited/attendance figure (that remains
 * computeFixedCreditHours() elsewhere in this file). */
function formatSiteMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
}

/* "City, Region, Country" for a login_events row, from the geo_* columns
 * supabase/functions/record-login-geo fills in shortly after the sign-in row
 * is inserted (20260901130000_login_event_geo.sql). Any of the three can be
 * missing (a coarser lookup, or a provider that didn't return one), so this
 * joins only whatever is present rather than showing blank commas; returns
 * '—' when nothing has landed yet (enrichment is async and best-effort — see
 * this tab's own "not proof of anything by itself" framing). */
function formatLoginLocation(ev) {
  const parts = [ev.geo_city, ev.geo_region, ev.geo_country].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function viewAdmin(user, rows, error, activeStudents, extra) {
  const cheatingFlagsByUserId = (extra && extra.cheatingFlagsByUserId) || new Map();
  const loginEvents = (extra && extra.loginEvents) || [];
  const cohorts = (extra && extra.cohorts) || [];
  const cohortStudentCounts = (extra && extra.cohortStudentCounts) || new Map();
  const archivedStudents = (extra && extra.archivedStudents) || [];
  const siteSessionsByStudentId = (extra && extra.siteSessionsByStudentId) || new Map();
  const activeCohorts = cohorts.filter((c) => !c.archived_at);
  const activeTab = (extra && extra.activeTab) || 'progress';
  const tabIsActive = (key) => key === activeTab;
  const tabBtnClass = (key) =>
    `admin-tab-btn px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer ${
      tabIsActive(key) ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-[#1e3a5f]'
    }`;
  const cheatingFlagsByStudentId = new Map(
    rows.filter((r) => cheatingFlagsByUserId.has(r.user_id)).map((r) => [r.student_id, cheatingFlagsByUserId.get(r.user_id)])
  );
  activeStudents = activeStudents || [];
  // Summary statistics are based on the local dashboard state, not the raw
  // backend rows. The ADMIN account is filtered out upstream.
  let totalStudents = rows.length;
  const enrolledRows = rows.filter((r) => r.enrolled !== false);
  let notEnrolled = totalStudents - enrolledRows.length;
  let notStarted = enrolledRows.filter((r) => r.modules_complete === 0 && (r.modules_in_progress || 0) === 0).length;
  let complete = enrolledRows.filter((r) => r.percent_complete >= 100).length;
  let inProgress = enrolledRows.length - notStarted - complete;
  let avgComplete = enrolledRows.length > 0
    ? enrolledRows.reduce((sum, r) => sum + (r.percent_complete || 0), 0) / enrolledRows.length
    : 0;

  // Track options for filter
  const trackSet = new Set(rows.map((r) => r.track_code));
  const trackOptions = Array.from(trackSet).sort();

  // Pairs each login_events row with its own admin_site_sessions row for the
  // Activity Monitor table below. The two tables share no foreign key —
  // recordLoginEvent() and recordSiteSessionStart() are two independent
  // fire-and-forget inserts from the same signIn() call (portal/app.js) — so
  // this matches by nearest started_at to occurred_at, per student, within a
  // tight tolerance (the two inserts land within a couple seconds of each
  // other in practice). usedSiteSessionIds prevents the same site_sessions
  // row (e.g. from a rapid double sign-in) from being claimed by two
  // different login_events rows. A login from before the site_sessions
  // table existed (or a row that never matched) correctly finds nothing.
  const SITE_SESSION_MATCH_TOLERANCE_MS = 30 * 1000;
  const usedSiteSessionIds = new Set();
  const matchSiteSession = (ev) => {
    const candidates = (siteSessionsByStudentId.get(ev.student_id) || [])
      .filter((s) => !usedSiteSessionIds.has(s.id));
    if (candidates.length === 0) return null;
    const evMs = new Date(ev.occurred_at).getTime();
    let best = null;
    let bestDiffMs = Infinity;
    candidates.forEach((s) => {
      const diffMs = Math.abs(new Date(s.started_at).getTime() - evMs);
      if (diffMs < bestDiffMs) {
        bestDiffMs = diffMs;
        best = s;
      }
    });
    if (!best || bestDiffMs > SITE_SESSION_MATCH_TOLERANCE_MS) return null;
    usedSiteSessionIds.add(best.id);
    return best;
  };

  return `${header(user)}
  <main class="pt-16">
    <section class="py-16 px-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-[#1e3a5f] mb-4">Student Progress</h1>
          <div class="w-12 h-1 bg-[#f97316] rounded-full mb-4"></div>
          <p class="text-gray-500 text-base">Admin dashboard for monitoring student progress across all programs. The ADMIN account is excluded from the student-account counts and table.</p>
        </div>

        <div class="flex gap-2 border-b border-gray-200 mb-8 flex-wrap" role="tablist">
          <button type="button" role="tab" aria-selected="${tabIsActive('progress')}" data-admin-tab="progress" class="${tabBtnClass('progress')}">Student Progress</button>
          <button type="button" role="tab" aria-selected="${tabIsActive('activity')}" data-admin-tab="activity" class="${tabBtnClass('activity')}">
            Student Activity Monitor${cheatingFlagsByStudentId.size ? ` <span class="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">${cheatingFlagsByStudentId.size}</span>` : ''}
          </button>
          <button type="button" role="tab" aria-selected="${tabIsActive('cohorts')}" data-admin-tab="cohorts" class="${tabBtnClass('cohorts')}">Cohorts</button>
          <button type="button" role="tab" aria-selected="${tabIsActive('archived')}" data-admin-tab="archived" class="${tabBtnClass('archived')}">Archived Students</button>
        </div>

        <div id="admin-tab-panel-progress" ${tabIsActive('progress') ? '' : 'hidden'}>
        ${
          error
            ? `<div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                 <div class="flex items-start gap-4">
                   <i class="ri-error-warning-line text-2xl text-red-600 flex-shrink-0 mt-0.5"></i>
                   <div>
                     <h3 class="font-semibold text-red-900 mb-1">Could not load student progress</h3>
                     <p class="text-red-700 text-sm">There was an error retrieving the data. Please try again.</p>
                   </div>
                 </div>
               </div>`
            : rows.length === 0
            ? `<div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                 <div class="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-gray-100 mb-4">
                   <i class="ri-inbox-line text-2xl text-gray-400"></i>
                 </div>
                 <p class="text-gray-500 text-base">No students provisioned yet.</p>
               </div>`
            : `<div>
                 <!-- Summary tiles -->
                 <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Total Student Accounts</p>
                     <p class="text-3xl font-bold text-[#1e3a5f]">${totalStudents}</p>
                   </div>
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Enrolled</p>
                     <p class="text-3xl font-bold text-[#1e3a5f]">${enrolledRows.length}</p>
                   </div>
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Not Enrolled</p>
                     <p class="text-3xl font-bold text-gray-400">${notEnrolled}</p>
                   </div>
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Not Started</p>
                     <p class="text-3xl font-bold text-gray-400">${notStarted}</p>
                   </div>
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">In Progress</p>
                     <p class="text-3xl font-bold text-[#f97316]">${inProgress}</p>
                   </div>
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Complete</p>
                     <p class="text-3xl font-bold text-[#22c55e]">${complete}</p>
                   </div>
                 </div>
                 <div class="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                   <p class="text-sm text-gray-600">Average progress across enrolled student accounts: <strong class="text-[#1e3a5f]">${avgComplete.toFixed(0)}%</strong></p>
                   <p class="text-xs text-gray-500">Report exports capture the current enrollment state from Supabase and a local export history in this browser.</p>
                 </div>

                 <!-- Controls -->
                 <div class="flex flex-col gap-4 mb-6">
                   <div class="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                     <div class="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
                       <div>
                         <label for="track-filter" class="block text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1.5">Filter by Track</label>
                         <select id="track-filter" class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">
                           <option value="">All Tracks</option>
                           ${trackOptions.map((track) => `<option value="${esc(track)}">${esc(track)}</option>`).join('')}
                         </select>
                       </div>
                       <div class="flex items-center gap-3 pb-1.5">
                         <input type="checkbox" id="hide-not-started" class="w-4 h-4 rounded border-gray-200 text-[#f97316] cursor-pointer" />
                         <label for="hide-not-started" class="text-sm text-gray-600 cursor-pointer">Hide Not Started</label>
                       </div>
                     </div>
                     <div class="flex flex-wrap gap-3">
                       <button class="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f] hover:bg-[#f0f4f8] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer" data-action="admin-toggle-generate-user" type="button">Generate New User</button>
                       <button class="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f] hover:bg-[#f0f4f8] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer" data-action="admin-toggle-generate-cohort" type="button">Generate New Cohort</button>
                       <button class="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#c2410c] hover:text-[#9a3412] hover:border-[#f97316] hover:bg-[#fff7ed] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer" data-action="admin-save-progress-file" type="button" title="Download one recoverable progress snapshot for every student in the current filtered scope">Save Progress File (All Students)</button>
                       <button class="inline-flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer" data-action="admin-generate-report" type="button">Preview &amp; Generate Report</button>
                     </div>
                   </div>

                   <!-- Sprint 4: "Generate New User" — one auto-enrolled student
                        account on demand, via supabase/functions/admin-provision.
                        COHORT_USER_LIFECYCLE_SPRINT_PLAN.md. -->
                   <div id="admin-generate-user-panel" class="bg-white border border-gray-200 rounded-xl p-5 mb-4" hidden>
                     <h3 class="text-sm font-bold text-[#1e3a5f] mb-1">Generate New User</h3>
                     <p class="text-xs text-gray-500 mb-4">Creates one auto-enrolled student account immediately. The password is shown once, below — copy it now, it is not shown again.</p>
                     <div class="grid sm:grid-cols-3 gap-3 items-end">
                       <label class="text-xs font-semibold text-gray-600">Track
                         <select id="gen-user-track" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900">
                           <option value="SOCAN">SOCAN — SOC Analyst</option>
                           <option value="HDESK">HDESK — IT Support</option>
                           <option value="AIENG">AIENG — AI/ML</option>
                           <option value="ELECT">ELECT — Electrical</option>
                           <option value="ADMIN">ADMIN</option>
                         </select>
                       </label>
                       <label class="text-xs font-semibold text-gray-600">Cohort (optional)
                         <select id="gen-user-cohort" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900">
                           <option value="">No cohort</option>
                           ${activeCohorts.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
                         </select>
                       </label>
                       <button type="button" data-action="admin-generate-user-submit" class="bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Generate</button>
                     </div>
                     <div id="admin-generate-user-status" class="text-sm text-gray-500 mt-3"></div>
                     <div id="admin-generate-user-result" class="mt-3"></div>
                   </div>

                   <!-- Sprint 4: "Generate New Cohort" — names a cohort and
                        batch-generates a chosen student count per track into it
                        in one action, via the same Edge Function. -->
                   <div id="admin-generate-cohort-panel" class="bg-white border border-gray-200 rounded-xl p-5 mb-4" hidden>
                     <h3 class="text-sm font-bold text-[#1e3a5f] mb-1">Generate New Cohort</h3>
                     <p class="text-xs text-gray-500 mb-4">Creates a named cohort and immediately batch-generates the chosen number of student accounts per track into it. Every generated password appears once, in the roster table below — copy it now, it is not shown again.</p>
                     <div class="grid sm:grid-cols-2 gap-3 mb-4">
                       <label class="text-xs font-semibold text-gray-600">Cohort name
                         <input id="gen-cohort-name" type="text" placeholder="e.g. Fall 2026 intake" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                       </label>
                       <label class="text-xs font-semibold text-gray-600">Start date
                         <input id="gen-cohort-start" type="date" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                         <span class="block mt-1 text-xs font-normal text-gray-400">Cohort runs exactly 6 weeks from this date — end date is set automatically.</span>
                       </label>
                     </div>
                     <p class="text-xs font-semibold text-gray-600 mb-2">Students per track (0 = none)</p>
                     <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                       <label class="text-xs font-semibold text-gray-600">SOCAN
                         <input id="gen-cohort-count-SOCAN" type="number" min="0" step="1" value="0" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                       </label>
                       <label class="text-xs font-semibold text-gray-600">HDESK
                         <input id="gen-cohort-count-HDESK" type="number" min="0" step="1" value="0" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                       </label>
                       <label class="text-xs font-semibold text-gray-600">AIENG
                         <input id="gen-cohort-count-AIENG" type="number" min="0" step="1" value="0" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                       </label>
                       <label class="text-xs font-semibold text-gray-600">ELECT
                         <input id="gen-cohort-count-ELECT" type="number" min="0" step="1" value="0" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                       </label>
                     </div>
                     <button type="button" data-action="admin-generate-cohort-submit" class="bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Generate cohort</button>
                     <div id="admin-generate-cohort-status" class="text-sm text-gray-500 mt-3"></div>
                     <div id="admin-generate-cohort-result" class="mt-3"></div>
                   </div>

                   <div id="admin-report-status" class="text-sm text-gray-500"></div>
                   <div id="admin-report-preview"></div>
                 </div>

                 <section class="bg-white border border-gray-200 rounded-xl p-5 mb-6" aria-labelledby="annual-reporting-scope-heading">
                   <div class="flex flex-col lg:flex-row lg:items-end gap-4">
                     <div class="lg:flex-1">
                       <h2 id="annual-reporting-scope-heading" class="text-sm font-bold text-[#1e3a5f]">Annual reporting scope</h2>
                       <p class="text-xs text-gray-500 mt-1">These dates print on the cohort report. Period-based Form 801 counts require the enrollment-history migration and its reporting view; the current dashboard roster is not a historical source.</p>
                     </div>
                     <label class="text-xs font-semibold text-gray-600">Period start
                       <input id="reporting-period-start" type="date" class="block mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                     </label>
                     <label class="text-xs font-semibold text-gray-600">Period end
                       <input id="reporting-period-end" type="date" class="block mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                     </label>
                   </div>
                 </section>

                 <section class="bg-white border border-gray-200 rounded-xl p-5 mb-6" aria-labelledby="academic-record-heading">
                   <h2 id="academic-record-heading" class="text-sm font-bold text-[#1e3a5f]">Current enrollment planning record</h2>
                   <p class="text-xs text-gray-500 mt-1 mb-4">Set scheduled dates and the reporting geography for an active enrollment. Saving does not overwrite a withdrawal or prior enrollment episode.</p>
                   <div class="grid sm:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                     <label class="text-xs font-semibold text-gray-600">Student
                       <select id="admin-planning-student" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900">
                         <option value="">Select an active student…</option>
                         ${rows.filter((r) => r.enrolled !== false).map((r) => `<option value="${esc(r.student_id)}">${esc(r.student_id)} — ${esc(r.program_slug || r.track_code)}</option>`).join('')}
                       </select>
                     </label>
                     <label class="text-xs font-semibold text-gray-600">Scheduled start
                       <input id="admin-planning-start" type="date" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                     </label>
                     <label class="text-xs font-semibold text-gray-600">Scheduled completion
                       <input id="admin-planning-completion" type="date" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900" />
                     </label>
                     <label class="text-xs font-semibold text-gray-600">Reporting geography
                       <select id="admin-planning-geography" class="block mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal text-gray-900">
                         <option value="">Not recorded</option><option value="florida">Florida</option><option value="non_florida">Non-Florida</option><option value="unknown">Unknown / verify</option>
                       </select>
                     </label>
                     <button type="button" data-action="admin-save-enrollment-plan" class="bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-4 py-2 rounded-lg text-sm">Save planning record</button>
                   </div>
                 </section>

                 <!-- Table -->
                 <div class="overflow-x-auto">
                   <table class="w-full border-collapse">
                     <thead>
                       <tr class="border-b border-gray-200 bg-gray-50">
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="studentId">Student ID<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="track">Track<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="program">Program<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="enrollment">Enrollment<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="progress">Progress<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="modules">Modules<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="capstone">Capstone<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f] cursor-pointer select-none hover:text-[#f97316]" data-sort-key="lastActive">Last Active<span data-sort-arrow class="ml-1 text-xs text-gray-400"></span></th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]"></th>
                       </tr>
                     </thead>
                     <tbody id="admin-table-body">
                       ${rows.map((row) => `
                         <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors admin-table-row ${row.enrolled === false ? 'opacity-65' : ''}"
                             data-track="${esc(row.track_code)}" data-progress="${row.percent_complete}" data-started="${(row.modules_complete > 0 || (row.modules_in_progress || 0) > 0) ? '1' : '0'}" data-enrolled="${row.enrolled !== false ? '1' : '0'}">
                           <td class="px-6 py-4 text-sm text-gray-900 font-mono">
                             <button type="button" data-view-credentials="${esc(row.student_id)}" aria-expanded="false" class="inline-flex items-center gap-1 hover:text-[#f97316] cursor-pointer group" title="View login credentials">
                               <i class="ri-arrow-right-s-line text-gray-400 group-hover:text-[#f97316] transition-transform" data-cred-chevron="${esc(row.student_id)}"></i>
                               ${esc(row.student_id)}
                             </button>
                             ${cheatingFlagsByStudentId.has(row.student_id) ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-help" title="${esc(cheatingFlagsByStudentId.get(row.student_id).join(' · '))}">Review</span>` : ''}
                           </td>
                           <td class="px-6 py-4 text-sm text-gray-600">${esc(row.track_code)}</td>
                           <td class="px-6 py-4 text-sm text-gray-600">${esc(row.program_slug || '—')}</td>
                           <td class="px-6 py-4 text-sm">
                             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${row.enrolled !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}">
                               <span class="w-1.5 h-1.5 rounded-full ${row.enrolled !== false ? 'bg-green-500' : 'bg-gray-400'}"></span>
                               ${row.adminStateLabel}
                             </span>
                             ${
                               row.enrolled !== false && row.enrollmentDate
                                 ? `<div class="text-xs text-gray-400 mt-1">Since ${new Date(row.enrollmentDate).toLocaleDateString()}</div>`
                                 : (row.enrolled === false && row.withdrawalDate
                                     ? `<div class="text-xs text-gray-400 mt-1">Since ${new Date(row.withdrawalDate).toLocaleDateString()}</div>`
                                     : '')
                             }
                           </td>
                           <td class="px-6 py-4 text-sm">
                             <div class="flex items-center gap-2">
                               <div class="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                 <div class="h-full rounded-full" style="width: ${row.percent_complete}%; background-color: ${row.percent_complete >= 100 ? '#22c55e' : row.percent_complete > 0 ? '#f97316' : '#d1d5db'};"></div>
                               </div>
                               <span class="text-gray-600 text-xs min-w-fit">${row.percent_complete}%</span>
                             </div>
                           </td>
                           <td class="px-6 py-4 text-sm text-gray-600">${row.modules_complete} / ${row.modules_total}</td>
                           <td class="px-6 py-4 text-sm text-gray-600">${row.capstone_overall_score !== null ? row.capstone_overall_score.toFixed(2) : '—'}</td>
                           <td class="px-6 py-4 text-sm text-gray-600">${row.last_active !== null ? new Date(row.last_active).toLocaleDateString() : '—'}</td>
                           <td class="px-6 py-4 text-sm">
                             <label class="inline-flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" class="sr-only peer" data-admin-enrollment="${esc(row.student_id)}" ${row.enrolled !== false ? 'checked' : ''} aria-label="Enrollment for ${esc(row.student_id)}" />
                               <span class="relative w-10 h-5 rounded-full bg-gray-300 peer-checked:bg-[#22c55e] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-5"></span>
                               <span class="text-xs font-semibold text-gray-600">${row.adminStateLabel}</span>
                             </label>
                           </td>
                           <td class="px-6 py-4 text-sm whitespace-nowrap">
                             <button type="button" data-admin-snapshot="${esc(row.student_id)}" class="text-xs font-semibold text-[#1e3a5f] hover:underline" title="Download a recoverable progress snapshot for this student">Save Progress File</button>
                           </td>
                         </tr>
                         <tr class="admin-cred-row" data-cred-row="${esc(row.student_id)}">
                           <td colspan="10" class="p-0 border-b border-gray-100">
                             <div class="overflow-hidden transition-[max-height] duration-300 ease-out" style="max-height: 0" data-cred-panel="${esc(row.student_id)}">
                               <div class="px-6 py-4 bg-[#f9fbfd]" data-cred-panel-inner="${esc(row.student_id)}"></div>
                             </div>
                           </td>
                         </tr>
                       `).join('')}
                     </tbody>
                   </table>
                 </div>
               </div>`
        }

        ${
          error
            ? ''
            : `<div class="mt-12">
                 <div class="mb-6">
                   <h2 class="text-2xl font-bold text-[#1e3a5f] mb-2">Student Detail</h2>
                   <div class="w-10 h-1 bg-[#f97316] rounded-full mb-3"></div>
                   <p class="text-gray-500 text-sm">Drill into one student's module, lab, and capstone record. Only students with recorded progress appear below.</p>
                 </div>
                 ${
                   activeStudents.length === 0
                     ? `<div class="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                          <p class="text-gray-500 text-sm">No students have recorded progress yet.</p>
                        </div>`
                     : `<div class="mb-6">
                          <label for="student-detail-select" class="block text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1.5">Select a Student</label>
                          <select id="student-detail-select" class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 w-full sm:w-96">
                            <option value="">Choose a student…</option>
                            ${activeStudents.map((r) => `<option value="${esc(r.student_id)}">${esc(r.student_id)} — ${esc(r.program_slug || r.track_code)} (${r.modules_complete}/${r.modules_total} modules${r.modules_complete === 0 && (r.modules_in_progress || 0) > 0 ? ', in progress' : ''})</option>`).join('')}
                          </select>
                        </div>
                        <div id="student-detail-panel"></div>`
                 }
               </div>`
        }
        </div>

        <div id="admin-tab-panel-activity" ${tabIsActive('activity') ? '' : 'hidden'}>
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-[#1e3a5f] mb-2">Student Activity Monitor</h2>
            <div class="w-10 h-1 bg-[#f97316] rounded-full mb-3"></div>
            <p class="text-gray-500 text-sm">Recent sign-ins across every student, newest first.</p>
          </div>
          <div id="admin-activity-status" class="text-sm text-gray-500 mb-3"></div>
          ${
            cheatingFlagsByStudentId.size
              ? `<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                   <p class="text-sm font-semibold text-amber-800 mb-1">${cheatingFlagsByStudentId.size} student account(s) flagged for review</p>
                   <p class="text-xs text-amber-700">Unusually fast module or track completion relative to the curriculum's credited time. This is a heuristic, not proof of misconduct — a fast completion can also mean the student already knew the material, reviewed it in an earlier session before this one, or has multiple tabs/devices open. Verify with the student before acting. Hover a "Review" tag below for the specific reason, or open the student in the Student Progress tab's Student Detail section.</p>
                 </div>`
              : ''
          }
          ${
            loginEvents.length === 0
              ? `<div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center"><p class="text-gray-500 text-base">No sign-ins recorded yet.</p></div>`
              : `<div class="overflow-x-auto">
                   <table class="w-full border-collapse">
                     <thead>
                       <tr class="border-b border-gray-200 bg-gray-50">
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Student ID</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Track</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]" title="Approximate, IP-based lookup — not a precise address">Location</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Signed in</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Signed out</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]" title="This sign-in's own session length — not a running or cumulative total">Site time</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]"></th>
                       </tr>
                     </thead>
                     <tbody>
                       ${loginEvents.map((ev) => {
                         const siteSession = matchSiteSession(ev);
                         return `
                         <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                           <td class="px-6 py-3 text-sm text-gray-900 font-mono">
                             ${esc(ev.student_id || '—')}
                             ${cheatingFlagsByStudentId.has(ev.student_id) ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-help" title="${esc(cheatingFlagsByStudentId.get(ev.student_id).join(' · '))}">Review</span>` : ''}
                           </td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(ev.track_code || '—')}</td>
                           <td class="px-6 py-3 text-sm text-gray-600" ${ev.ip_address ? `title="${esc(ev.ip_address)}"` : ''}>${esc(formatLoginLocation(ev))}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${new Date(ev.occurred_at).toLocaleString()}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${siteSession ? (siteSession.ended_at ? new Date(siteSession.ended_at).toLocaleString() : '<span class="text-green-600 font-semibold">Still signed in</span>') : '—'}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${siteSession ? esc(formatSiteMinutes(siteSession.duration_minutes)) : '—'}</td>
                           <td class="px-6 py-3 text-sm whitespace-nowrap">
                             ${ev.user_id ? `<button type="button" data-force-signout="${esc(ev.user_id)}" data-force-signout-student="${esc(ev.student_id || 'this student')}" class="text-xs font-semibold text-red-600 hover:underline cursor-pointer">Sign out</button>` : ''}
                           </td>
                         </tr>`;
                       }).join('')}
                     </tbody>
                   </table>
                 </div>`
          }
        </div>

        <div id="admin-tab-panel-cohorts" ${tabIsActive('cohorts') ? '' : 'hidden'}>
          <div class="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 class="text-2xl font-bold text-[#1e3a5f] mb-2">Cohorts</h2>
              <div class="w-10 h-1 bg-[#f97316] rounded-full mb-3"></div>
              <p class="text-gray-500 text-sm">Named intake groups with a start/end window. An expired cohort archives automatically once a day; use the button below to run that sweep on demand for testing.</p>
            </div>
            <button type="button" data-action="admin-run-archive-sweep" class="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f] hover:bg-[#f0f4f8] font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap cursor-pointer">Run archive sweep now</button>
          </div>
          <div id="admin-archive-sweep-status" class="text-sm text-gray-500 mb-4"></div>
          ${
            cohorts.length === 0
              ? `<div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center"><p class="text-gray-500 text-base">No cohorts created yet.</p></div>`
              : `<div class="overflow-x-auto">
                   <table class="w-full border-collapse">
                     <thead>
                       <tr class="border-b border-gray-200 bg-gray-50">
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Name</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Start</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">End</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Status</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Students</th>
                       </tr>
                     </thead>
                     <tbody>
                       ${cohorts.map((c) => `
                         <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                           <td class="px-6 py-3 text-sm text-gray-900">${esc(c.name)}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(c.start_date)}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(c.end_date)}</td>
                           <td class="px-6 py-3 text-sm">
                             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.archived_at ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}">
                               <span class="w-1.5 h-1.5 rounded-full ${c.archived_at ? 'bg-gray-400' : 'bg-green-500'}"></span>
                               ${c.archived_at ? 'Archived' : 'Active'}
                             </span>
                           </td>
                           <td class="px-6 py-3 text-sm text-gray-600">${cohortStudentCounts.get(c.id) || 0}</td>
                         </tr>`).join('')}
                     </tbody>
                   </table>
                 </div>`
          }
        </div>

        <div id="admin-tab-panel-archived" ${tabIsActive('archived') ? '' : 'hidden'}>
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-[#1e3a5f] mb-2">Archived Students</h2>
            <div class="w-10 h-1 bg-[#f97316] rounded-full mb-3"></div>
            <p class="text-gray-500 text-sm">Read-only historical view. One row per student archived out of an expired cohort — see the site's cohort archival design notes for what is and isn't frozen here. This is not the compliance-of-record table.</p>
          </div>
          ${
            archivedStudents.length === 0
              ? `<div class="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center"><p class="text-gray-500 text-base">No archived students yet.</p></div>`
              : `<div class="overflow-x-auto">
                   <table class="w-full border-collapse">
                     <thead>
                       <tr class="border-b border-gray-200 bg-gray-50">
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Student ID</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Cohort</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Track</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Program</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Modules</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Progress</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Capstone</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Status at archive</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Archived</th>
                       </tr>
                     </thead>
                     <tbody>
                       ${archivedStudents.map((r) => `
                         <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                           <td class="px-6 py-3 text-sm text-gray-900 font-mono">${esc(r.student_id)}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(r.cohort_name || '—')}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(r.track_code || '—')}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(r.program_slug || '—')}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${r.modules_complete ?? '—'} / ${r.modules_total ?? '—'}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${r.percent_complete !== null && r.percent_complete !== undefined ? esc(String(r.percent_complete)) + '%' : '—'}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${r.capstone_overall_score !== null && r.capstone_overall_score !== undefined ? esc(Number(r.capstone_overall_score).toFixed(2)) : '—'}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${esc(r.status_at_archive || '—')}</td>
                           <td class="px-6 py-3 text-sm text-gray-600">${r.archived_at ? new Date(r.archived_at).toLocaleDateString() : '—'}</td>
                         </tr>`).join('')}
                     </tbody>
                   </table>
                 </div>`
          }
        </div>

        <div class="mt-8">
          <a href="#/portal" class="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors">
            <i class="ri-arrow-left-line"></i> Back to My Programs
          </a>
        </div>
      </div>
    </section>
  </main>
  ${footer()}`;
}

/* ------------------------------------------------------------------ router */

async function render() {
  const app = document.getElementById('app');
  let hash = location.hash || '#/login';
  const user = await currentUser();

  // In-page anchors (#sec-labs, #sec-capstone) share the hash with the router.
  // Only hashes beginning '#/' are routes; everything else is the browser
  // scrolling within the current view and must not trigger a re-render.
  if (hash && !hash.startsWith('#/') && app.innerHTML.trim()) return;

  if (!user) {
    app.innerHTML = viewLogin();
    wireLogin();
    return;
  }
  // Signed in but sitting on the login route: replace the entry rather than
  // pushing a new one, so Back never lands on a login screen that just bounces
  // the student forward again.
  if (hash === '#/login') {
    history.replaceState(null, '', '#/portal');
    // fall through and render the portal
  }

  // Admin-only redirect: admins must never see the student portal/catalogue,
  // whether they land there by default, type #/portal directly, follow a stale link,
  // or any other navigation path. Redirect them to #/admin instead.
  if (user.isAdmin && hash !== '#/admin') {
    history.replaceState(null, '', '#/admin');
    hash = '#/admin';
  }

  let dashboardRows = [];
  let activeStudents = [];
  let cheatingFlagsByUserId = new Map();
  if (hash === '#/admin') {
    if (!user.isAdmin) {
      history.replaceState(null, '', '#/portal');
      app.innerHTML = viewPortal(user);
    } else {
      const { data: progressRows, error } = await mntSupabase
        .from('admin_student_progress')
        .select('*')
        .order('track_code', { ascending: true });
      const sorted = progressRows || [];
      // Sort by active progress first: modules_complete desc, then last_active desc for tiebreaker
      sorted.sort((a, b) => {
        const aComplete = a.modules_complete || 0;
        const bComplete = b.modules_complete || 0;
        if (bComplete !== aComplete) return bComplete - aComplete;
        const aActive = a.last_active ? new Date(a.last_active).getTime() : 0;
        const bActive = b.last_active ? new Date(b.last_active).getTime() : 0;
        return bActive - aActive;
      });

      dashboardRows = filterAdminDashboardRows(sorted);

      // Sprint H.1: student detail drill-down. admin_student_activity carries
      // user_id (so per-student detail selects don't need a second lookup)
      // and lab/capstone attempt counts (so "has real progress" reflects lab
      // activity too, not just completed modules — see the migration).
      const { data: activityRows } = await mntSupabase
        .from('admin_student_activity')
        .select('*');
      const activityRowMap = new Map((activityRows || []).map((row) => [row.student_id, row]));
      activeStudents = dashboardRows
        .filter((r) => (r.modules_complete || 0) > 0 || (r.modules_in_progress || 0) > 0 || (activityRowMap.get(r.student_id)?.lab_attempts_count || 0) > 0 || (activityRowMap.get(r.student_id)?.capstone_submissions_count || 0) > 0)
        .sort((a, b) => a.student_id.localeCompare(b.student_id));

      // Completion-speed review flags (see buildCheatingReviewFlags above):
      // module_progress_admin_read already lets an admin read every
      // student's completed rows in one query, no per-student round trip.
      const { data: completedModuleRows } = await mntSupabase
        .from('module_progress')
        .select('user_id, module_key, track_code, started_at, completed_at')
        .eq('state', 'complete');
      cheatingFlagsByUserId = buildCheatingReviewFlags(dashboardRows, completedModuleRows);

      // Student Activity Monitor tab: recent sign-ins across every student,
      // newest first. login_events_admin_read (20260901110000_login_events.sql).
      // user_id is included (not shown as a column) so the "Sign out" button
      // below has the target id admin_force_sign_out(target_user_id) needs.
      const { data: loginEvents, error: loginEventsError } = await mntSupabase
        .from('login_events')
        .select('user_id, student_id, track_code, occurred_at, ip_address, geo_city, geo_region, geo_country')
        .order('occurred_at', { ascending: false })
        .limit(500);
      if (loginEventsError) console.error('login_events fetch failed', loginEventsError);

      // Sprint 4 (COHORT_USER_LIFECYCLE_SPRINT_PLAN.md): cohorts + hours-on-
      // site + archived students. Same non-fatal, error-logged pattern as
      // every other admin-only fetch above — a failure here degrades only
      // its own tab, never the whole admin dashboard.
      const { data: cohortRows, error: cohortsError } = await mntSupabase
        .from('cohorts')
        .select('*')
        .order('start_date', { ascending: false });
      if (cohortsError) console.error('cohorts fetch failed', cohortsError);
      const cohorts = cohortRows || [];

      // Per-cohort student counts: admin_student_progress doesn't carry
      // cohort_id, so this is the "second, simplest correct query" the
      // sprint plan calls out rather than extending that view.
      const { data: cohortMemberRows, error: cohortMembersError } = await mntSupabase
        .from('students')
        .select('cohort_id')
        .not('cohort_id', 'is', null);
      if (cohortMembersError) console.error('students.cohort_id fetch failed', cohortMembersError);
      const cohortStudentCounts = new Map();
      (cohortMemberRows || []).forEach((r) => {
        cohortStudentCounts.set(r.cohort_id, (cohortStudentCounts.get(r.cohort_id) || 0) + 1);
      });

      const { data: archivedStudentRows, error: archivedStudentsError } = await mntSupabase
        .from('admin_archived_students')
        .select('*')
        .order('archived_at', { ascending: false });
      if (archivedStudentsError) console.error('admin_archived_students fetch failed', archivedStudentsError);

      // Per-row session data for the Activity Monitor table (matched to each
      // login_events row by matchSiteSession() inside viewAdmin) — replaces
      // the old admin_site_hours_by_student aggregate, which showed one
      // per-student lifetime total repeated identically on every one of that
      // student's rows instead of that specific sign-in's own duration.
      const { data: siteSessionRows, error: siteSessionsError } = await mntSupabase
        .from('admin_site_sessions')
        .select('*')
        .order('started_at', { ascending: false });
      if (siteSessionsError) console.error('admin_site_sessions fetch failed', siteSessionsError);
      const siteSessionsByStudentId = new Map();
      (siteSessionRows || []).forEach((r) => {
        const list = siteSessionsByStudentId.get(r.student_id) || [];
        list.push(r);
        siteSessionsByStudentId.set(r.student_id, list);
      });

      app.innerHTML = viewAdmin(user, dashboardRows, error, activeStudents, {
        cheatingFlagsByUserId,
        loginEvents: loginEvents || [],
        cohorts,
        cohortStudentCounts,
        archivedStudents: archivedStudentRows || [],
        siteSessionsByStudentId,
        activeTab: adminActiveTab,
      });
    }
    wireCommon();
    wireAdmin(dashboardRows, activeStudents, cheatingFlagsByUserId);
    window.scrollTo(0, 0);
    return;
  }

  const moduleMatch = hash.match(/^#\/program\/([a-z0-9-]+)\/module\/(\d+)$/);
  const programMatch = hash.match(/^#\/program\/([a-z0-9-]+)/);
  const moduleLab = moduleMatch ? moduleLabFor(moduleMatch[1], moduleMatch[2]) : null;
  // A module route with no registered lab is not an error: that module simply
  // has no interactive surface built yet, so it falls through to the program
  // overview the same way it always did.
  if (moduleLab) {
    const program = PROGRAMS.find((item) => item.slug === moduleMatch[1]);
    app.innerHTML = hasModuleAccess(user, program.slug, moduleLab.moduleKey)
      ? moduleLab.view(user, program)
      : viewNoAccess(user, program);
  } else if (programMatch) {
    app.innerHTML = viewProgram(user, programMatch[1]);
  } else {
    app.innerHTML = viewPortal(user);
  }
  wireCommon();
  window.scrollTo(0, 0);
}

function wireLogin() {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;
    const user = await signIn(email, password);
    if (user) {
      // A completed console walkthrough can return in its own tab after the
      // original module tab was closed. Preserve that verified return route;
      // ordinary sign-ins land on the student's active programme instead of
      // the #/portal catalogue (STUDENT_LOGIN_COURSEWORK_REDIRECT.md). Admins
      // are sent on to #/admin by render()'s admin-only rule regardless of
      // where we land them here. A student with no active enrolment (or one
      // not yet mapped to a programme) still falls back to #/portal.
      const coachReturn = new URLSearchParams(location.search).get('coachComplete');
      const returnToModule = coachReturn === 'm01' && location.hash === '#/program/soc-analyst/module/1';
      const activeEnrollment = user.enrollments.find((e) => e.status === 'active');
      const destination = activeEnrollment ? '#/program/' + activeEnrollment.programSlug : '#/portal';
      history.replaceState(null, '', returnToModule
        ? location.pathname + location.search + location.hash
        : destination);
      render();
    } else {
      document.getElementById('login-error').classList.remove('hidden');
    }
  });

}

function wireCommon() {
  const signout = document.querySelector('[data-action="signout"]');
  if (signout) signout.addEventListener('click', signOut);

  // Program cards. Locked cards carry pointer-events-none, so they never fire.
  document.querySelectorAll('[data-open]').forEach((el) => {
    const go = () => { location.hash = '#/program/' + el.dataset.open; };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  document.querySelectorAll('[data-acc]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen && btn.dataset.program && btn.dataset.module) {
        const user = await currentUser();
        markModuleContentOpened(user, btn.dataset.program, btn.dataset.module);
        refreshModuleCompletionDot(btn, user);
      }
    });
  });

  wireRegisteredModuleLabs();
}

function wireAdmin(dashboardRows, activeStudents, cheatingFlagsByUserId) {
  dashboardRows = dashboardRows || [];
  activeStudents = activeStudents || [];
  cheatingFlagsByUserId = cheatingFlagsByUserId || new Map();

  const tabButtons = document.querySelectorAll('[data-admin-tab]');
  const tabPanels = {
    progress: document.getElementById('admin-tab-panel-progress'),
    activity: document.getElementById('admin-tab-panel-activity'),
    cohorts: document.getElementById('admin-tab-panel-cohorts'),
    archived: document.getElementById('admin-tab-panel-archived'),
  };
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.adminTab;
      adminActiveTab = target; // persists the selection across a future full render() (see its declaration)
      tabButtons.forEach((b) => {
        const active = b.dataset.adminTab === target;
        b.setAttribute('aria-selected', active ? 'true' : 'false');
        b.classList.toggle('border-[#1e3a5f]', active);
        b.classList.toggle('text-[#1e3a5f]', active);
        b.classList.toggle('border-transparent', !active);
        b.classList.toggle('text-gray-500', !active);
      });
      Object.entries(tabPanels).forEach(([key, panel]) => { if (panel) panel.hidden = key !== target; });
    });
  });

  /* Sprint 4 (COHORT_USER_LIFECYCLE_SPRINT_PLAN.md): "Generate New User" /
   * "Generate New Cohort" panel toggles. Plain show/hide of the inline panel
   * built in viewAdmin — no modal component, matching this file's existing
   * "keep it simple" pattern for admin-report-preview et al. */
  const toggleGenerateUserBtn = document.querySelector('[data-action="admin-toggle-generate-user"]');
  const generateUserPanel = document.getElementById('admin-generate-user-panel');
  if (toggleGenerateUserBtn && generateUserPanel) {
    toggleGenerateUserBtn.addEventListener('click', () => { generateUserPanel.hidden = !generateUserPanel.hidden; });
  }
  const toggleGenerateCohortBtn = document.querySelector('[data-action="admin-toggle-generate-cohort"]');
  const generateCohortPanel = document.getElementById('admin-generate-cohort-panel');
  if (toggleGenerateCohortBtn && generateCohortPanel) {
    toggleGenerateCohortBtn.addEventListener('click', () => { generateCohortPanel.hidden = !generateCohortPanel.hidden; });
  }

  /* "Generate New User": one account, via admin-provision's create_user
   * action. The password is shown exactly once, in this response — never
   * stored client-side beyond this render, never logged. */
  const generateUserSubmitBtn = document.querySelector('[data-action="admin-generate-user-submit"]');
  if (generateUserSubmitBtn) {
    generateUserSubmitBtn.addEventListener('click', async () => {
      const trackSelect = document.getElementById('gen-user-track');
      const cohortSelect = document.getElementById('gen-user-cohort');
      const resultEl = document.getElementById('admin-generate-user-result');
      const statusEl = document.getElementById('admin-generate-user-status');
      if (!trackSelect || !resultEl) return;
      generateUserSubmitBtn.disabled = true;
      if (statusEl) statusEl.textContent = 'Creating account…';
      resultEl.innerHTML = '';
      try {
        const account = await callAdminProvision('create_user', {
          track_code: trackSelect.value,
          cohort_id: cohortSelect && cohortSelect.value ? cohortSelect.value : null,
        });
        if (statusEl) statusEl.textContent = '';
        resultEl.innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-xs font-semibold text-green-800 mb-2">Account created — copy this now, it is not shown again.</p>
            <pre data-select-all tabindex="0" class="bg-white border border-green-200 rounded-lg p-3 text-sm font-mono text-gray-900 cursor-text overflow-x-auto" title="Click to select all">Student ID: ${esc(account.student_id)}
Password:   ${esc(account.password)}
Track:      ${esc(account.track_code)}</pre>
          </div>`;
        wireSelectAllBlocks(resultEl);
      } catch (err) {
        if (statusEl) statusEl.textContent = '';
        resultEl.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">${esc(err && err.message ? err.message : String(err))}</div>`;
      } finally {
        generateUserSubmitBtn.disabled = false;
      }
    });
  }

  /* "Generate New Cohort": names a cohort and batch-generates the chosen
   * per-track counts into it in one admin-provision create_cohort call. */
  const generateCohortSubmitBtn = document.querySelector('[data-action="admin-generate-cohort-submit"]');
  if (generateCohortSubmitBtn) {
    generateCohortSubmitBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('gen-cohort-name');
      const startInput = document.getElementById('gen-cohort-start');
      const resultEl = document.getElementById('admin-generate-cohort-result');
      const statusEl = document.getElementById('admin-generate-cohort-status');
      if (!nameInput || !resultEl) return;

      const counts = {};
      ['SOCAN', 'HDESK', 'AIENG', 'ELECT'].forEach((track) => {
        const input = document.getElementById(`gen-cohort-count-${track}`);
        counts[track] = input ? Math.max(0, Math.floor(Number(input.value) || 0)) : 0;
      });

      if (!nameInput.value.trim() || !startInput.value) {
        if (statusEl) statusEl.textContent = 'Name and start date are both required.';
        return;
      }
      if (Object.values(counts).every((n) => n === 0)) {
        if (statusEl) statusEl.textContent = 'Enter at least one positive per-track count.';
        return;
      }

      generateCohortSubmitBtn.disabled = true;
      if (statusEl) statusEl.textContent = 'Creating cohort and generating accounts…';
      resultEl.innerHTML = '';
      try {
        const result = await callAdminProvision('create_cohort', {
          name: nameInput.value.trim(),
          start_date: startInput.value,
          counts,
        });
        if (statusEl) {
          statusEl.textContent = `Cohort created with ${result.roster.length} account(s)${result.failures.length ? `, ${result.failures.length} failure(s)` : ''}.`;
        }
        resultEl.innerHTML = `
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
            <p class="text-sm font-semibold text-green-800">Cohort "${esc(result.cohort_name)}" created.</p>
            <p class="text-xs text-amber-700 mt-1 font-semibold">This roster contains plaintext passwords. Copy them now and move them to your password vault — they will not be shown again.</p>
          </div>
          ${result.failures.length ? `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-700">
              <p class="font-semibold mb-1">${result.failures.length} account(s) failed to create:</p>
              <ul class="list-disc pl-4 space-y-0.5">${result.failures.map((f) => `<li>${esc(f.track_code)}: ${esc(f.error)}</li>`).join('')}</ul>
            </div>` : ''}
          <div class="overflow-x-auto">
            <table data-select-all tabindex="0" title="Click to select the whole roster table" class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                  <th class="text-left px-3 py-2 font-semibold text-[#1e3a5f]">Student ID</th>
                  <th class="text-left px-3 py-2 font-semibold text-[#1e3a5f]">Password</th>
                  <th class="text-left px-3 py-2 font-semibold text-[#1e3a5f]">Track</th>
                </tr>
              </thead>
              <tbody>
                ${result.roster.map((a) => `<tr class="border-b border-gray-100"><td class="px-3 py-2 font-mono">${esc(a.student_id)}</td><td class="px-3 py-2 font-mono">${esc(a.password)}</td><td class="px-3 py-2">${esc(a.track_code)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>`;
        wireSelectAllBlocks(resultEl);
      } catch (err) {
        if (statusEl) statusEl.textContent = '';
        resultEl.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">${esc(err && err.message ? err.message : String(err))}</div>`;
      } finally {
        generateCohortSubmitBtn.disabled = false;
      }
    });
  }

  /* Cohorts tab: "Run archive sweep now" — admin-callable RPC wrapper around
   * archive_expired_cohorts() for on-demand testing, per the sprint plan (the
   * daily pg_cron schedule is the production path; this is so an admin
   * doesn't have to wait for it). A full render() afterward is the simplest
   * correct way to refresh the cohorts list/counts and the now-possibly-
   * changed Student Progress/Archived Students data; adminActiveTab (see its
   * declaration) keeps the admin looking at the Cohorts tab through that
   * rebuild instead of bouncing back to Student Progress. */
  const archiveSweepBtn = document.querySelector('[data-action="admin-run-archive-sweep"]');
  if (archiveSweepBtn) {
    archiveSweepBtn.addEventListener('click', async () => {
      const sweepStatus = document.getElementById('admin-archive-sweep-status');
      archiveSweepBtn.disabled = true;
      if (sweepStatus) sweepStatus.textContent = 'Running archive sweep…';
      try {
        const { error: sweepError } = await mntSupabase.rpc('archive_expired_cohorts');
        if (sweepError) throw sweepError;
        if (sweepStatus) sweepStatus.textContent = 'Archive sweep completed. Refreshing…';
        await render();
        return; // render() rebuilt the DOM and re-wired everything; this node set is stale now.
      } catch (err) {
        archiveSweepBtn.disabled = false;
        if (sweepStatus) sweepStatus.textContent = `Archive sweep failed: ${err && err.message ? err.message : String(err)}`;
      }
    });
  }

  /* Activity Monitor tab: per-row "Sign out" button, calling
   * admin_force_sign_out() (20260901122000_activity_monitor_sessions.sql) via
   * RPC. A real, immediate action against a real student's session, so this
   * always confirms first and gives disabled/status feedback either way —
   * never a silent one-click. */
  const activityStatus = document.getElementById('admin-activity-status');
  document.querySelectorAll('[data-force-signout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetUserId = btn.getAttribute('data-force-signout');
      const label = btn.getAttribute('data-force-signout-student') || 'this student';
      if (!confirm(`Force sign out ${label}? They will be blocked from staying signed in past their next token refresh or page reload.`)) return;
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = 'Signing out…';
      if (activityStatus) activityStatus.textContent = `Signing out ${label}…`;
      try {
        const { error: signOutError } = await mntSupabase.rpc('admin_force_sign_out', { target_user_id: targetUserId });
        if (signOutError) throw signOutError;
        btn.textContent = 'Signed out';
        if (activityStatus) activityStatus.textContent = `${label} was signed out.`;
      } catch (err) {
        btn.disabled = false;
        btn.textContent = originalLabel;
        if (activityStatus) activityStatus.textContent = `Could not sign out ${label}: ${err && err.message ? err.message : String(err)}`;
      }
    });
  });

  const trackFilter = document.getElementById('track-filter');
  const hideNotStarted = document.getElementById('hide-not-started');
  const reportingPeriodStart = document.getElementById('reporting-period-start');
  const reportingPeriodEnd = document.getElementById('reporting-period-end');
  const planningStudent = document.getElementById('admin-planning-student');
  const planningStart = document.getElementById('admin-planning-start');
  const planningCompletion = document.getElementById('admin-planning-completion');
  const planningGeography = document.getElementById('admin-planning-geography');
  const savePlanningButton = document.querySelector('[data-action="admin-save-enrollment-plan"]');
  const tableRows = document.querySelectorAll('.admin-table-row');
  const status = document.getElementById('admin-report-status');

  // Sortable column headers. rowPairs zips each rendered <tr> with the
  // dashboardRows entry it was built from (same order — viewAdmin rendered
  // them from this exact array) so sorting never needs a Supabase re-fetch
  // or a full render(): it just reorders existing DOM nodes.
  const sortHeaders = document.querySelectorAll('[data-sort-key]');
  const tableBodyEl = document.getElementById('admin-table-body');
  const rowPairs = Array.from(tableRows).map((el, i) => ({ el, row: dashboardRows[i] }));
  const sortGetters = {
    studentId: (r) => r.student_id || '',
    track: (r) => r.track_code || '',
    program: (r) => r.program_slug || '',
    enrollment: (r) => (r.enrolled !== false ? 1 : 0),
    progress: (r) => (r.percent_complete === null || r.percent_complete === undefined ? null : r.percent_complete),
    modules: (r) => (r.modules_complete === null || r.modules_complete === undefined ? null : r.modules_complete),
    capstone: (r) => (r.capstone_overall_score === null || r.capstone_overall_score === undefined ? null : r.capstone_overall_score),
    lastActive: (r) => (r.last_active ? new Date(r.last_active).getTime() : null),
  };

  function compareRows(a, b, key, dir) {
    const get = sortGetters[key];
    if (!get) return 0;
    const aVal = get(a.row);
    const bVal = get(b.row);
    if (typeof aVal === 'string' || typeof bVal === 'string') {
      return String(aVal).localeCompare(String(bVal)) * dir;
    }
    // Nulls (e.g. no capstone score yet, never active) always sort to one
    // consistent end regardless of direction, per the sprint's null-handling
    // requirement — never `new Date(null)`, never let a reversed sort
    // scatter blanks through the middle of the table.
    const aNull = aVal === null || aVal === undefined;
    const bNull = bVal === null || bVal === undefined;
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    return (aVal - bVal) * dir;
  }

  function updateSortArrows() {
    sortHeaders.forEach((th) => {
      const arrow = th.querySelector('[data-sort-arrow]');
      if (!arrow) return;
      arrow.textContent = th.dataset.sortKey === adminTableSort.key ? (adminTableSort.dir === 1 ? '▲' : '▼') : '';
    });
  }

  function applySort() {
    if (!adminTableSort.key || !tableBodyEl || rowPairs.length === 0) return;
    rowPairs.sort((a, b) => compareRows(a, b, adminTableSort.key, adminTableSort.dir));
    rowPairs.forEach((pair) => tableBodyEl.appendChild(pair.el));
    updateSortArrows();
    applyFilters();
  }

  sortHeaders.forEach((th) => {
    th.setAttribute('tabindex', '0');
    th.setAttribute('role', 'button');
    const activate = () => {
      const key = th.dataset.sortKey;
      if (adminTableSort.key === key) {
        adminTableSort.dir *= -1;
      } else {
        adminTableSort = { key, dir: 1 };
      }
      applySort();
    };
    th.addEventListener('click', activate);
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  // Re-apply a sort chosen before this render() (e.g. before an enrollment
  // toggle triggered a full rebuild) so it survives the rebuild instead of
  // silently resetting to the default modules_complete/last_active order.
  applySort();

  function applyFilters() {
    const selectedTrack = trackFilter ? trackFilter.value : '';
    const hideNotStartedChecked = hideNotStarted ? hideNotStarted.checked : false;

    tableRows.forEach((row) => {
      const rowTrack = row.dataset.track;
      const rowStarted = row.dataset.started === '1';

      const trackMatch = !selectedTrack || rowTrack === selectedTrack;
      const showMatch = !hideNotStartedChecked || rowStarted;

      row.style.display = trackMatch && showMatch ? '' : 'none';
    });
  }

  if (trackFilter) trackFilter.addEventListener('change', applyFilters);
  if (hideNotStarted) hideNotStarted.addEventListener('change', applyFilters);

  function dateInputValue(value) {
    return value ? String(value).slice(0, 10) : '';
  }

  function populatePlanningRecord() {
    const row = dashboardRows.find((item) => item.student_id === (planningStudent && planningStudent.value));
    if (!row) return;
    if (planningStart) planningStart.value = dateInputValue(row.scheduledStartDate);
    if (planningCompletion) planningCompletion.value = dateInputValue(row.scheduledCompletionDate);
    if (planningGeography) planningGeography.value = row.geographyClassification || '';
  }

  if (planningStudent) planningStudent.addEventListener('change', populatePlanningRecord);
  if (savePlanningButton) savePlanningButton.addEventListener('click', async () => {
    const studentId = planningStudent && planningStudent.value;
    if (!studentId) {
      if (status) status.textContent = 'Choose an active student before saving a planning record.';
      return;
    }
    savePlanningButton.disabled = true;
    if (status) status.textContent = `Saving the current enrollment planning record for ${studentId}...`;
    const error = await updateAdminEnrollmentPlanRemote(studentId, {
      scheduledStartDate: planningStart && planningStart.value,
      scheduledCompletionDate: planningCompletion && planningCompletion.value,
      geographyClassification: planningGeography && planningGeography.value,
      geographySourceReference: 'admin dashboard',
    });
    savePlanningButton.disabled = false;
    if (error) {
      if (status) status.textContent = `Could not save the planning record: ${error.message || 'the enrollment-reporting migration may not be deployed yet.'}`;
      return;
    }
    await render();
    const nextStatus = document.getElementById('admin-report-status');
    if (nextStatus) nextStatus.textContent = `Saved the current enrollment planning record for ${studentId}.`;
  });

  function identityForRow(row) {
    const program = PROGRAMS.find((p) => p.slug === row.program_slug) || null;
    return { userId: row.user_id, trackCode: row.track_code, program };
  }

  const tableBody = document.getElementById('admin-table-body');
  if (tableBody) {
    tableBody.addEventListener('click', async (event) => {
      const credBtn = event.target.closest('[data-view-credentials]');
      if (credBtn) {
        await toggleCredentialsPanel(credBtn.getAttribute('data-view-credentials'), credBtn);
        return;
      }
      const snapshotBtn = event.target.closest('[data-admin-snapshot]');
      if (!snapshotBtn) return;
      const studentId = snapshotBtn.getAttribute('data-admin-snapshot');
      const row = dashboardRows.find((item) => item.student_id === studentId);
      const message = document.getElementById('admin-report-status');
      if (!row) return;
      snapshotBtn.disabled = true;
      if (message) message.textContent = `Saving progress file for ${studentId}...`;
      try {
        await downloadStudentSnapshot(studentId, identityForRow(row));
        if (message) message.textContent = `Progress file saved for ${studentId}.`;
      } catch (err) {
        console.error('downloadStudentSnapshot failed', err);
        if (message) message.textContent = `Could not save the progress file for ${studentId} — see console for details.`;
      } finally {
        snapshotBtn.disabled = false;
      }
    });

    tableBody.addEventListener('change', async (event) => {
      const toggle = event.target.closest('[data-admin-enrollment]');
      if (!toggle) return;
      const studentId = toggle.getAttribute('data-admin-enrollment');
      const row = dashboardRows.find((item) => item.student_id === studentId);
      const message = document.getElementById('admin-report-status');
      if (!row) return;

      const desired = toggle.checked;

      // Going enrolled -> disenrolled: capture a recoverable progress
      // snapshot first, unconditionally, in place of a confirm() popup.
      // This never deletes module_progress/lab_attempts/capstone data —
      // disenrollment only ever flips students.is_enrolled — but the
      // snapshot file is what makes ADMIN_RESET_FLOW.md's "restore a
      // mistaken disenrollment" workflow possible after the fact. If the
      // snapshot can't be captured, the disenroll does not proceed.
      if (!desired) {
        toggle.disabled = true;
        if (message) message.textContent = `Saving progress file for ${studentId} before disenrolling...`;
        try {
          await downloadStudentSnapshot(studentId, identityForRow(row));
        } catch (err) {
          console.error('Pre-disenroll snapshot failed', err);
          toggle.disabled = false;
          toggle.checked = true;
          if (message) message.textContent = `Could not save a progress file for ${studentId} — disenrollment cancelled. See console for details.`;
          return;
        }
      }

      toggle.disabled = true;
      if (message) message.textContent = `Saving enrollment for ${studentId}...`;
      const error = await updateAdminEnrollmentRemote(studentId, desired);
      toggle.disabled = false;
      if (error) {
        toggle.checked = !desired;
        if (message) message.textContent = `Could not save enrollment for ${studentId}: ${error.message || 'Supabase rejected the update.'}`;
        return;
      }

      row.is_enrolled = desired;
      row.enrolled = desired;
      row.adminStateLabel = desired ? 'Enrolled' : 'Disenrolled';
      render();
      const nextMessage = document.getElementById('admin-report-status');
      if (nextMessage) nextMessage.textContent = desired
        ? `${studentId} is now enrolled.`
        : `${studentId} is now disenrolled. Progress file saved.`;
    });
  }

  /* E5: report preview/confirmation. "Preview & Generate Report" no longer
   * downloads immediately — it builds the cohort data (buildCohortReportData
   * is cheap/synchronous, it only reads dashboardRows already in memory) and
   * shows report type, scope/filters, included record count, and known
   * missing-data warnings inline, with an explicit confirm step before the
   * PDF actually generates. Deliberately a plain inline panel, not a modal
   * component, per the remediation plan's "keep it simple" instruction. */
  const bulkButtons = document.querySelectorAll('[data-action="admin-generate-report"]');
  bulkButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const preview = document.getElementById('admin-report-preview');
      if (!preview) return;
      // D4: preview/generate for the admin's *current* filters, not always
      // the full dashboardRows — matches what's visible in the table now.
      const periodStart = reportingPeriodStart ? reportingPeriodStart.value : null;
      const periodEnd = reportingPeriodEnd ? reportingPeriodEnd.value : null;
      const activeTrackFilter = trackFilter ? trackFilter.value : '';
      btn.disabled = true;
      if (periodStart && periodEnd && status) status.textContent = 'Calculating period-bounded annual counts…';
      const annualCounts = await fetchAnnualReportingCounts(periodStart, periodEnd, activeTrackFilter);
      btn.disabled = false;
      if (status) status.textContent = '';
      const report = buildCohortReportData(dashboardRows, {
        trackFilter: activeTrackFilter,
        hideNotStarted: hideNotStarted ? hideNotStarted.checked : false,
        reportingPeriodStart: periodStart,
        reportingPeriodEnd: periodEnd,
        annualCounts,
      });
      const warnings = report.reportingRequirements.filter((r) => r.status !== 'covered');
      preview.innerHTML = `
        <div class="mt-3 bg-white border border-gray-200 rounded-xl p-5">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Report Preview</p>
          <div class="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 mb-3">
            <p><strong>Report type:</strong> Cohort / Annual Progress Report</p>
            <p><strong>Included records:</strong> ${report.scope.totalRowsAfterFilter} of ${report.scope.totalRowsBeforeFilter} accounts</p>
            <p><strong>Program/cohort scope:</strong> ${esc(report.scope.trackFilter || 'All tracks')}</p>
            <p><strong>Filters:</strong> ${report.scope.hideNotStarted ? 'Not Started hidden' : 'None'}</p>
            <p><strong>Reporting period:</strong> ${esc(report.scope.reportingPeriodStart || 'Not set')} – ${esc(report.scope.reportingPeriodEnd || 'Not set')}</p>
          </div>
          ${warnings.length ? `
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p class="text-xs font-semibold text-amber-800 mb-1">${warnings.length} of ${report.reportingRequirements.length} CIE requirements are not fully covered by current data:</p>
              <ul class="text-xs text-amber-700 list-disc pl-4 space-y-0.5">
                ${warnings.map((w) => `<li>${esc(w.requirement)} — ${esc(w.status)}</li>`).join('')}
              </ul>
            </div>` : ''}
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 text-xs text-slate-700">
            <strong>Confidential student records:</strong> Download only on an approved device, share only with authorized personnel, and store or delete the file under the institution's records-retention policy. This report is labeled <strong>${esc(reportClassificationLabel(report))}</strong>.
          </div>
          <div class="flex flex-wrap gap-3">
            <button type="button" data-action="admin-confirm-generate-report" class="bg-[#1e3a5f] hover:bg-[#16304f] text-white font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Confirm &amp; Download PDF</button>
            <button type="button" data-action="admin-download-compliance-gap-pdf" class="bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Download Internal Gap Report (PDF)</button>
            <button type="button" data-action="admin-download-report-json" class="bg-white border border-gray-200 text-gray-600 hover:text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm cursor-pointer">Download data (JSON, secondary)</button>
            <button type="button" data-action="admin-cancel-report-preview" class="text-gray-400 hover:text-gray-600 text-sm px-2 cursor-pointer">Cancel</button>
          </div>
        </div>`;

      preview.querySelector('[data-action="admin-cancel-report-preview"]').addEventListener('click', () => {
        preview.innerHTML = '';
      });

      preview.querySelector('[data-action="admin-download-report-json"]').addEventListener('click', () => {
        // Browser state is implementation detail, not an institutional
        // export. Keep it out of even the explicitly secondary JSON file.
        const { stateSnapshot, ...exportableReport } = report;
        const json = JSON.stringify({ _label: 'Machine-readable cohort report data — NOT the official PDF report.', ...exportableReport }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cohort-report-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      preview.querySelector('[data-action="admin-download-compliance-gap-pdf"]').addEventListener('click', async (event) => {
        const gapBtn = event.currentTarget;
        gapBtn.disabled = true;
        if (status) status.textContent = 'Generating internal compliance-gap PDF...';
        try {
          const reportId = await downloadComplianceGapReport(report);
          if (status) status.textContent = `Downloaded internal compliance-gap PDF ${reportId}.`;
        } catch (err) {
          if (status) status.textContent = `Could not generate the internal compliance-gap PDF: ${safeReportFailureReason(err)}`;
        } finally {
          gapBtn.disabled = false;
        }
      });

      preview.querySelector('[data-action="admin-confirm-generate-report"]').addEventListener('click', async (event) => {
        const confirmBtn = event.currentTarget;
        confirmBtn.disabled = true;
        btn.disabled = true;
        if (status) status.textContent = 'Creating an authorized server-side audit record and generating the PDF...';
        try {
          const result = await downloadAdminReport(report);
          // Convenience-only browser history follows a successful durable
          // audit finalization; it is not an institutional audit record.
          storeAdminReportRun(report);
          if (status) status.textContent = `Downloaded ${result.recordStatus} PDF report ${result.reportId}. Integrity hash: ${result.fileHash.slice(0, 12)}…${result.auditWarning ? ` ${result.auditWarning}` : ''}`;
          preview.innerHTML = '';
        } catch (err) {
          if (status) status.textContent = `Could not generate an authorized PDF report: ${safeReportFailureReason(err)}`;
        } finally {
          confirmBtn.disabled = false;
          btn.disabled = false;
        }
      });
    });
  });

  /* Workstream I: one combined recovery file for the students in the
   * currently selected scope. Sequential reads deliberately avoid fanning a
   * large cohort into dozens of simultaneous Supabase requests; unlike the
   * per-student snapshot this creates one download, not N browser prompts. */
  const saveAllButtons = document.querySelectorAll('[data-action="admin-save-progress-file"]');
  saveAllButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const selectedTrack = trackFilter ? trackFilter.value : '';
      const hideNotStartedChecked = hideNotStarted ? hideNotStarted.checked : false;
      const scopedRows = dashboardRows.filter((row) => {
        const trackMatch = !selectedTrack || row.track_code === selectedTrack;
        const started = (row.modules_complete || 0) > 0 || (row.modules_in_progress || 0) > 0;
        return trackMatch && (!hideNotStartedChecked || started) && row.enrolled !== false;
      });
      btn.disabled = true;
      if (status) status.textContent = `Preparing progress files for 0 of ${scopedRows.length} student account(s)…`;
      try {
        const snapshots = [];
        for (let i = 0; i < scopedRows.length; i++) {
          const row = scopedRows[i];
          if (status) status.textContent = `Preparing progress files for ${i + 1} of ${scopedRows.length}: ${row.student_id}…`;
          snapshots.push(await buildStudentSnapshotRecord(row.student_id, identityForRow(row)));
        }
        const capturedAt = new Date().toISOString();
        downloadJsonFile({
          _label: 'Admin-captured recoverable progress snapshots for the current filtered scope. This is a recovery file, not an official transcript or report.',
          capturedAt,
          scope: { trackFilter: selectedTrack || null, hideNotStarted: hideNotStartedChecked, includedAccounts: snapshots.length },
          snapshots,
        }, `student-progress-snapshots-${capturedAt.slice(0, 10)}.json`);
        if (status) status.textContent = `Saving a readable PDF summary for ${scopedRows.length} student account(s)…`;
        await downloadProgressSnapshotPdf(scopedRows, { trackFilter: selectedTrack || null, hideNotStarted: hideNotStartedChecked, capturedAt });
        if (status) status.textContent = `Saved a recovery file and a readable PDF summary for ${snapshots.length} student progress snapshot(s). No progress data was changed.`;
      } catch (err) {
        console.error('Bulk progress snapshot failed', err);
        if (status) status.textContent = 'Could not create the combined progress file. No enrollment or progress data was changed.';
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Sprint H.1: student detail drill-down.
  const detailSelect = document.getElementById('student-detail-select');
  if (detailSelect) {
    detailSelect.addEventListener('change', async () => {
      const panel = document.getElementById('student-detail-panel');
      if (!panel) return;
      const studentId = detailSelect.value;
      if (!studentId) { panel.innerHTML = ''; return; }
      const row = activeStudents.find((r) => r.student_id === studentId);
      if (!row) { panel.innerHTML = ''; return; }

      panel.innerHTML = `<div class="text-sm text-gray-400 py-6">Loading…</div>`;
      const [moduleRes, labRes, capstoneRes, scorecardRes, artifactRes, reviewRes] = await Promise.all([
        mntSupabase.from('module_progress').select('*').eq('user_id', row.user_id),
        mntSupabase.from('lab_attempts').select('*').eq('user_id', row.user_id),
        mntSupabase.from('capstone_submissions').select('*').eq('user_id', row.user_id).order('stage', { ascending: true }),
        mntSupabase.from('capstone_scorecard').select('*').eq('user_id', row.user_id).maybeSingle(),
        mntSupabase.from('portfolio_artifacts').select('*').eq('user_id', row.user_id).eq('lab_key', 'lab-capstone').order('submitted_at', { ascending: false }),
        mntSupabase.from('capstone_reviews').select('*').eq('user_id', row.user_id).order('created_at', { ascending: false }),
      ]);

      // Still the currently-selected student? A fast re-select before this
      // resolves would otherwise let a stale response overwrite the panel.
      if (detailSelect.value !== studentId) return;

      panel.innerHTML = renderStudentDetail(
        row,
        moduleRes.data || [],
        labRes.data || [],
        capstoneRes.data || [],
        scorecardRes.data || null,
        artifactRes.data || [],
        reviewRes.data || [],
        cheatingFlagsByUserId.get(row.user_id) || []
      );
    });

    // Agent 4 / B2+B3: per-student "Download Transcript (PDF)" and "Download
    // Evidence Record (PDF)" buttons live inside renderStudentDetail()'s
    // markup (data-transcript-pdf/data-evidence-pdf). The panel element
    // itself persists across re-renders (only its innerHTML changes on each
    // student selection), so one delegated listener here covers every
    // student without re-binding per render.
    const detailPanel = document.getElementById('student-detail-panel');
    if (detailPanel) {
      detailPanel.addEventListener('click', async (event) => {
        const transcriptBtn = event.target.closest('[data-transcript-pdf]');
        const evidenceBtn = event.target.closest('[data-evidence-pdf]');
        const trigger = transcriptBtn || evidenceBtn;
        if (!trigger) return;
        const studentId = trigger.getAttribute('data-transcript-pdf') || trigger.getAttribute('data-evidence-pdf');
        const row = activeStudents.find((r) => r.student_id === studentId);
        if (!row) return;
        const identity = { userId: row.user_id, trackCode: row.track_code, program: PROGRAMS.find((p) => p.slug === row.program_slug) || null };
        trigger.disabled = true;
        const originalText = trigger.textContent;
        trigger.textContent = 'Generating…';
        try {
          if (transcriptBtn) await downloadTranscriptPdf(studentId, identity);
          else await downloadEvidencePdf(studentId, identity);
        } catch (err) {
          console.error('Per-student PDF generation failed', err);
          trigger.textContent = 'Failed — see console';
          setTimeout(() => { trigger.textContent = originalText; }, 2500);
          trigger.disabled = false;
          return;
        }
        trigger.textContent = originalText;
        trigger.disabled = false;
      });
      detailPanel.addEventListener('submit', async (event) => {
        const form = event.target.closest('[data-capstone-review-form]');
        if (!form) return;
        event.preventDefault();
        const artifactId = form.getAttribute('data-artifact-id');
        const studentId = form.getAttribute('data-student-id');
        const row = activeStudents.find((r) => r.student_id === studentId);
        if (!artifactId || !row || !user.userId) return;
        const reviewStatus = form.elements.review_status.value;
        const outcome = reviewStatus === 'approved' ? form.elements.official_outcome.value : (reviewStatus === 'changes_requested' ? 'changes_requested' : null);
        const payload = { artifact_id: artifactId, user_id: row.user_id, track_code: row.track_code, review_status: reviewStatus, official_outcome: outcome, reviewer_notes: form.elements.reviewer_notes.value.trim() || null, supervision_method: 'optional faculty review' };
        if (reviewStatus === 'approved' || reviewStatus === 'changes_requested') { payload.reviewed_by = user.userId; payload.reviewed_at = new Date().toISOString(); }
        const existingId = form.getAttribute('data-review-id');
        const query = existingId ? mntSupabase.from('capstone_reviews').update(payload).eq('id', existingId) : mntSupabase.from('capstone_reviews').insert(payload);
        const { error: reviewError } = await query;
        const status = form.querySelector('[data-review-status]');
        if (reviewError) { if (status) status.textContent = `Could not save review: ${reviewError.message}`; return; }
        if (status) status.textContent = 'Review saved. Re-select the student to refresh the evidence summary.';
      });
    }
  }
}

/* --------------------------------------------- admin student detail panel */

/* module_key only resolves within its own program's catalogue (see PROGRAMS
 * in portal/data.js), so the student's track_code is required to look it up
 * — mirrors the join CURRICULUM_MAP.md documents against the same catalogue. */
function adminModuleLabel(trackCode, moduleKey) {
  const slug = TRACK_CODE_TO_PROGRAM_SLUG[trackCode];
  const program = PROGRAMS.find((p) => p.slug === slug);
  const module = program && program.modules && program.modules[moduleKey];
  return module ? module.title : moduleKey;
}

function adminLabLabel(labKey) {
  const lab = LABS.find((l) => l.key === labKey);
  return lab ? lab.title : labKey;
}

function adminStateLabel(state) {
  return state === 'complete' ? 'Complete' : state === 'in_progress' ? 'In Progress' : 'Not Started';
}

function adminStateColor(state) {
  return state === 'complete' ? '#22c55e' : state === 'in_progress' ? '#f97316' : '#9ca3af';
}

function adminScore(value) {
  return value === null || value === undefined || value === '' ? '—' : Number(value).toFixed(1);
}

function adminDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function renderStudentDetail(row, moduleRows, labRows, capstoneRows, scorecardRow, artifactRows = [], reviewRows = [], reviewFlagReasons = []) {
  const moduleSection = moduleRows.length === 0
    ? `<p class="text-sm text-gray-400">No module progress recorded.</p>`
    : `<div class="overflow-x-auto">
         <table class="w-full border-collapse text-sm">
           <thead>
             <tr class="border-b border-gray-200">
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Percent</th>
             </tr>
           </thead>
           <tbody>
             ${moduleRows.slice().sort((a, b) => String(a.module_key).localeCompare(String(b.module_key))).map((m) => `
               <tr class="border-b border-gray-100">
                 <td class="px-4 py-2 text-gray-900">${esc(adminModuleLabel(row.track_code, m.module_key))}</td>
                 <td class="px-4 py-2"><span style="color:${adminStateColor(m.state)}">${adminStateLabel(m.state)}</span></td>
                 <td class="px-4 py-2 text-gray-600">${m.percent}%</td>
               </tr>`).join('')}
           </tbody>
         </table>
       </div>`;

  const labSection = labRows.length === 0
    ? `<p class="text-sm text-gray-400">No lab attempts recorded.</p>`
    : `<div class="overflow-x-auto">
         <table class="w-full border-collapse text-sm">
           <thead>
             <tr class="border-b border-gray-200">
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lab</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
             </tr>
           </thead>
           <tbody>
             ${labRows.slice().sort((a, b) => String(a.lab_key).localeCompare(String(b.lab_key))).map((l) => `
               <tr class="border-b border-gray-100">
                 <td class="px-4 py-2 text-gray-900">${esc(adminLabLabel(l.lab_key))}</td>
                 <td class="px-4 py-2"><span style="color:${adminStateColor(l.state)}">${adminStateLabel(l.state)}</span></td>
                 <td class="px-4 py-2 text-gray-600">${adminScore(l.score)}</td>
                 <td class="px-4 py-2 text-gray-600">${adminDate(l.completed_at)}</td>
               </tr>`).join('')}
           </tbody>
         </table>
       </div>`;

  const capstoneSection = capstoneRows.length === 0
    ? `<p class="text-sm text-gray-400">No capstone stages submitted.</p>`
    : `<div class="overflow-x-auto">
         <table class="w-full border-collapse text-sm">
           <thead>
             <tr class="border-b border-gray-200">
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
               <th class="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
             </tr>
           </thead>
           <tbody>
             ${capstoneRows.map((c) => `
               <tr class="border-b border-gray-100">
                 <td class="px-4 py-2 text-gray-900">Stage ${c.stage}</td>
                 <td class="px-4 py-2 text-gray-600">${adminScore(c.score)}</td>
                 <td class="px-4 py-2 text-gray-600">${adminDate(c.submitted_at)}</td>
               </tr>`).join('')}
           </tbody>
         </table>
       </div>`;

  const scorecardDimensions = [
    ['Overall', scorecardRow && scorecardRow.overall_score],
    ['Investigation', scorecardRow && scorecardRow.investigation_accuracy],
    ['Detection', scorecardRow && scorecardRow.detection_score],
    ['Threat Hunting', scorecardRow && scorecardRow.threat_hunting_score],
    ['Incident Response', scorecardRow && scorecardRow.incident_response_score],
    ['Vulnerability', scorecardRow && scorecardRow.vulnerability_score],
    ['Reporting', scorecardRow && scorecardRow.reporting_score],
  ];
  const scorecardSection = !scorecardRow
    ? ''
    : `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
         ${scorecardDimensions.map(([label, value]) => `
           <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
             <p class="text-xs text-gray-500 uppercase tracking-wide">${esc(label)}</p>
             <p class="text-lg font-semibold text-[#1e3a5f]">${adminScore(value)}</p>
           </div>`).join('')}
       </div>`;
  const capstoneArtifact = artifactRows[0] || null;
  const capstoneReview = capstoneArtifact ? reviewRows.find((review) => review.artifact_id === capstoneArtifact.id) : null;
  const reviewSection = !capstoneArtifact
    ? `<p class="text-sm text-gray-500 mt-4">No durable capstone artifact is available for review yet.</p>`
    : `<form data-capstone-review-form data-artifact-id="${esc(capstoneArtifact.id)}" data-review-id="${esc(capstoneReview ? capstoneReview.id : '')}" data-student-id="${esc(row.student_id)}" class="mt-5 border border-[#fed7aa] bg-[#fff7ed] rounded-xl p-4">
         <p class="text-sm font-semibold text-[#9a3412]">Optional faculty review · latest submitted capstone artifact</p>
         <p class="text-xs text-gray-600 mt-1">Artifact ${esc(capstoneArtifact.id)} · submitted ${adminDate(capstoneArtifact.submitted_at)} · SHA-256 ${esc(capstoneArtifact.content_sha256 || 'pending')}</p>
         <div class="grid sm:grid-cols-2 gap-3 mt-3"><label class="text-xs font-semibold text-gray-600">Review status<select name="review_status" class="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5"><option value="pending" ${capstoneReview && capstoneReview.review_status === 'pending' ? 'selected' : ''}>Pending</option><option value="approved" ${capstoneReview && capstoneReview.review_status === 'approved' ? 'selected' : ''}>Approved</option><option value="changes_requested" ${capstoneReview && capstoneReview.review_status === 'changes_requested' ? 'selected' : ''}>Changes requested</option></select></label><label class="text-xs font-semibold text-gray-600">Official outcome<select name="official_outcome" class="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5"><option value="approved" ${capstoneReview && capstoneReview.official_outcome === 'approved' ? 'selected' : ''}>Approved</option><option value="approved_with_notes" ${capstoneReview && capstoneReview.official_outcome === 'approved_with_notes' ? 'selected' : ''}>Approved with notes</option></select></label></div>
         <label class="block text-xs font-semibold text-gray-600 mt-3">Reviewer notes<textarea name="reviewer_notes" class="mt-1 block w-full border border-gray-300 rounded px-2 py-1.5" rows="3">${esc(capstoneReview ? capstoneReview.reviewer_notes || '' : '')}</textarea></label>
         <div class="flex items-center gap-3 mt-3"><button type="submit" class="text-xs font-semibold bg-[#1e3a5f] hover:bg-[#16304f] text-white px-3 py-2 rounded-lg">Save review</button><span data-review-status class="text-xs text-gray-600"></span></div>
       </form>`;

  const reviewFlagSection = reviewFlagReasons.length === 0 ? '' : `
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <p class="text-sm font-semibold text-amber-800 mb-1">Flagged for review — unusually fast completion</p>
      <ul class="text-xs text-amber-700 list-disc pl-4 space-y-0.5 mb-2">
        ${reviewFlagReasons.map((r) => `<li>${esc(r)}</li>`).join('')}
      </ul>
      <p class="text-xs text-amber-700">This is a heuristic, not proof of misconduct — a fast completion can also mean the student already knew the material, reviewed it in an earlier session before this one, or has multiple tabs/devices open. Verify with the student before taking any action.</p>
    </div>`;

  return `
    <div class="bg-white border border-gray-200 rounded-xl p-6">
      ${reviewFlagSection}
      <div class="mb-6 pb-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-mono text-sm text-gray-900">${esc(row.student_id)}</p>
          <p class="text-xs text-gray-500 mt-1">${esc(row.program_slug || row.track_code)} · ${row.modules_complete}/${row.modules_total} modules · ${row.percent_complete}% complete</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-transcript-pdf="${esc(row.student_id)}" class="text-xs font-semibold bg-[#1e3a5f] hover:bg-[#16304f] text-white px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer" title="Individual academic transcript (Workstream B2)">Download Transcript (PDF)</button>
          <button type="button" data-evidence-pdf="${esc(row.student_id)}" class="text-xs font-semibold bg-white border border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f] px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer" title="Supporting evidence record — labs, rubric breakdown, capstone (Workstream B3)">Download Evidence Record (PDF)</button>
        </div>
      </div>
      <h3 class="text-base font-semibold text-[#1e3a5f] mb-3">Modules</h3>
      ${moduleSection}
      <h3 class="text-base font-semibold text-[#1e3a5f] mt-8 mb-3">Labs</h3>
      ${labSection}
      <h3 class="text-base font-semibold text-[#1e3a5f] mt-8 mb-3">Capstone</h3>
      ${capstoneSection}
      ${scorecardSection}
      ${reviewSection}
    </div>`;
}

window.addEventListener('hashchange', render);
window.addEventListener('message', dispatchModuleLabMessage);
document.addEventListener('DOMContentLoaded', render);
document.addEventListener('DOMContentLoaded', wireIdleSignOut);

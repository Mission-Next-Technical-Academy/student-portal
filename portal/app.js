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
    .select('student_id, track_code, is_admin')
    .eq('user_id', userId)
    .single();

  // Access is derived from students.track_code, not a joined enrollments row —
  // see the TRACK_CODE_TO_PROGRAM_SLUG comment above. Provisioning only ever
  // creates full-track access today, so this is always a single active,
  // full-access enrollment (or none, for ADMIN / an unrecognized track).
  const programSlug = studentRow ? TRACK_CODE_TO_PROGRAM_SLUG[studentRow.track_code] : null;
  const enrollments = programSlug
    ? [{ programSlug, status: 'active', accessMode: 'full', modules: [], purchasedAt: null }]
    : [];

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
  return await currentUser();
}

async function signOut() {
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

/* ------------------------------------------------ student record export */
/* Builds a complete, exportable student record covering grades, attendance,
 * progress, artifacts, faculty evaluation, capstone, and outcome. All fields
 * without real backing data sources are explicitly marked "not yet collected"
 * per architecture.md Sprint F. */

async function buildStudentExportRecord(user, program) {
  if (!user || !user.enrollments.length) return null;

  const enrollment = user.enrollments[0];
  const now = new Date().toISOString();

  // Module grades: collected from localStorage engagement + lab attempts
  const moduleScores = [];
  const moduleKeys = Object.keys(program.modules || {});
  for (const moduleKey of moduleKeys) {
    const module = program.modules[moduleKey];
    const engagement = loadModuleEngagement(user);
    const completed = engagement.completedLabs.some((id) => id.startsWith(`${program.slug}:${moduleKey}`));
    moduleScores.push({
      moduleKey,
      title: module.title,
      completed: completed ? true : false,
      status: completed ? 'complete' : 'not started'
    });
  }

  // Capstone: Module 12 state if it exists
  const capstoneModule = program.modules['soc-12'];
  let capstoneRecord = {
    title: capstoneModule ? capstoneModule.title : 'N/A',
    status: 'not yet collected — backend capstone data export not implemented',
    score: null,
    stages: [],
    rubricsApplied: []
  };

  // Progress summary
  const engagement = loadModuleEngagement(user);
  const completedCount = moduleScores.filter((m) => m.completed).length;
  const totalModules = moduleScores.length;

  // M360 progress (separate)
  const m360Progress = loadM360Progress(user);

  // Faculty evaluation: not yet collected (no real data source exists)
  const facultyEvaluation = {
    status: 'not yet collected',
    comments: null,
    recommendedActions: null,
    sourceData: 'No faculty evaluation data collection implemented'
  };

  // Attendance/time evidence: marked not verified
  const attendanceEvidence = {
    status: 'not yet collected',
    totalInstructionalMinutes: 0,
    lastActiveDate: null,
    attendancePercentage: null,
    sourceData: 'Attendance tracking not implemented'
  };

  // Outcome: simple pass/fail against 70%
  const overallPercent = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;
  const passingThreshold = 70;
  const outcome = overallPercent >= passingThreshold ? 'pass' : 'in progress';

  return {
    studentId: user.username,
    email: user.email,
    track: user.trackCode,
    program: program.slug,
    exportedAt: now,

    // Curriculum mapping
    programTitle: program.compliance?.programName || program.title,
    totalHours: program.compliance?.totalHours || 82,
    technicalHours: program.compliance?.technicalHours || 70,
    labHours: program.compliance?.labHours || 40,

    // Grades and assessment
    grades: {
      modules: moduleScores,
      capstone: capstoneRecord,
      overallPercentComplete: overallPercent.toFixed(1)
    },

    // Progress tracking
    progress: {
      modulesComplete: completedCount,
      modulesTotal: totalModules,
      m360ItemsComplete: m360Progress.completedItems.length,
      m360ItemsTotal: 8,
      status: completedCount > 0 ? 'in progress' : 'not started'
    },

    // Artifacts: persisted lab state and selections
    artifacts: {
      status: 'persisted in student localStorage under lab-specific keys',
      sourceData: 'LabRuntime.save() per module',
      note: 'Artifacts not exported — access via browser storage inspection'
    },

    // Attendance and time evidence
    attendanceEvidence,

    // Faculty evaluation
    facultyEvaluation,

    // Capstone assessment
    capstone: capstoneRecord,

    // Final outcome
    outcome: {
      status: outcome,
      percentComplete: overallPercent.toFixed(1),
      passingThreshold,
      message: outcome === 'pass'
        ? 'Student has met the course completion threshold.'
        : 'Student is in progress. Completion requires all modules marked complete.'
    },

    // Data verification note
    dataVerification: {
      gradesStatus: 'verified from localStorage module engagement',
      attendanceStatus: 'not yet collected',
      artifactsStatus: 'persisted but not exported',
      facultyEvaluationStatus: 'not yet collected',
      capstoneStatus: 'not yet collected',
      note: 'This record represents available client-side data only. Backend attendance, faculty evaluation, and capstone rubric data are marked not yet collected per architecture.md Sprint F.'
    }
  };
}

async function exportStudentRecord(user, program) {
  const record = await buildStudentExportRecord(user, program);
  if (!record) {
    console.error('Could not build student export record');
    return null;
  }
  const json = JSON.stringify(record, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-record-${record.studentId}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
      started_at: now,
      completed_at: state === 'complete' ? now : null,
    })
    .then(({ error }) => {
      if (error) console.error('lab_attempts insert failed', labKey, error);
    })
    .catch((err) => console.error('lab_attempts insert threw', labKey, err));
}

/* --------------------------------------------------------- capstone_submissions (Supabase) */
/* architecture.md §3 Sprint 4, scope confirmed against CURRICULUM_ALIGNMENT_ARCHITECTURE.md
 * §5 ("12 stages remain one Prove assessment"): there is no 12-stage capstone
 * flow, and none is being built here. Module 12 (portal/module-12.js) IS the
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
 * still captured by module-12.js's existing recordLabAttempt() call for
 * lab_key 'lab-capstone', which does log every attempt, pass or fail). */
function recordCapstoneSubmission(user, { score, answers = {} } = {}) {
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
  const engagement = loadModuleEngagement(user);
  const moduleId = moduleEngagementId(program.slug, moduleKey);
  const labs = programLabs(program).filter((lab) => lab.module === moduleKey);
  const contentOpened = fixtureState === 'complete' || engagement.openedModules.includes(moduleId);
  const allLabsComplete = labs.every((lab) => {
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
                 <a href="#/portal" class="relative text-gray-600 hover:text-[#1e3a5f] text-sm font-medium transition-all duration-300 cursor-pointer px-4 py-2 rounded-lg hover:bg-[#1e3a5f]/8 group">
                   My Programs
                   <span class="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#f97316] rounded-full transition-all duration-300 group-hover:w-3/4"></span>
                 </a>
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
          <button type="button" onclick="exportStudentRecord(window.__mntCurrentUser, window.__mntCurrentProgram)"
            class="mt-4 text-xs font-semibold text-[#1e3a5f]/70 hover:text-[#1e3a5f] inline-flex items-center gap-1.5">
            <i class="ri-download-2-line"></i> Export my record (JSON)
          </button>
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
              Draws on competencies from all 11 prior modules: SOC operations and analyst workflow (M01), network and identity foundations (M02), SIEM and log analysis (M03), detection engineering (M04), endpoint investigation (M05), threat hunting (M06), network and email analysis (M07), vulnerability prioritization (M08), incident response (M09), evidence handling (M10), and SOC metrics/reporting (M11).
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

function viewAdmin(user, rows, error) {
  // Summary statistics
  let totalStudents = rows.length;
  let notStarted = rows.filter((r) => r.modules_complete === 0).length;
  let complete = rows.filter((r) => r.percent_complete >= 100).length;
  let inProgress = totalStudents - notStarted - complete;
  let avgComplete = totalStudents > 0
    ? rows.reduce((sum, r) => sum + (r.percent_complete || 0), 0) / totalStudents
    : 0;

  // Track options for filter
  const trackSet = new Set(rows.map((r) => r.track_code));
  const trackOptions = Array.from(trackSet).sort();

  return `${header(user)}
  <main class="pt-16">
    <section class="py-16 px-8">
      <div class="max-w-6xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-[#1e3a5f] mb-4">Student Progress</h1>
          <div class="w-12 h-1 bg-[#f97316] rounded-full mb-4"></div>
          <p class="text-gray-500 text-base">Admin dashboard for monitoring student progress across all programs.</p>
        </div>

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
                 <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Total Students</p>
                     <p class="text-3xl font-bold text-[#1e3a5f]">${totalStudents}</p>
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
                   <div class="bg-white border border-gray-200 rounded-xl p-5">
                     <p class="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Avg. Complete</p>
                     <p class="text-3xl font-bold text-[#1e3a5f]">${avgComplete.toFixed(0)}%</p>
                   </div>
                 </div>

                 <!-- Controls -->
                 <div class="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                   <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                     <div>
                       <label for="track-filter" class="block text-xs font-semibold uppercase tracking-widest text-gray-600 mb-1.5">Filter by Track</label>
                       <select id="track-filter" class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20">
                         <option value="">All Tracks</option>
                         ${trackOptions.map((track) => `<option value="${esc(track)}">${esc(track)}</option>`).join('')}
                       </select>
                     </div>
                   </div>
                   <div class="flex items-center gap-3">
                     <input type="checkbox" id="hide-not-started" class="w-4 h-4 rounded border-gray-200 text-[#f97316] cursor-pointer" />
                     <label for="hide-not-started" class="text-sm text-gray-600 cursor-pointer">Hide Not Started</label>
                   </div>
                 </div>

                 <!-- Table -->
                 <div class="overflow-x-auto">
                   <table class="w-full border-collapse">
                     <thead>
                       <tr class="border-b border-gray-200 bg-gray-50">
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Student ID</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Track</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Program</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Progress</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Modules</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Capstone</th>
                         <th class="text-left px-6 py-3 text-sm font-semibold text-[#1e3a5f]">Last Active</th>
                       </tr>
                     </thead>
                     <tbody id="admin-table-body">
                       ${rows.map((row) => `
                         <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors admin-table-row"
                             data-track="${esc(row.track_code)}" data-progress="${row.percent_complete}" data-started="${row.modules_complete > 0 ? '1' : '0'}">
                           <td class="px-6 py-4 text-sm text-gray-900 font-mono">${esc(row.student_id)}</td>
                           <td class="px-6 py-4 text-sm text-gray-600">${esc(row.track_code)}</td>
                           <td class="px-6 py-4 text-sm text-gray-600">${esc(row.program_slug)}</td>
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
                         </tr>
                       `).join('')}
                     </tbody>
                   </table>
                 </div>
               </div>`
        }

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
  const hash = location.hash || '#/login';
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
      app.innerHTML = viewAdmin(user, sorted, error);
    }
    wireCommon();
    wireAdmin();
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
    if (await signIn(email, password)) {
      // A completed console walkthrough can return in its own tab after the
      // original module tab was closed. Preserve that verified return route;
      // ordinary sign-ins still land on the portal home.
      const coachReturn = new URLSearchParams(location.search).get('coachComplete');
      const returnToModule = coachReturn === 'm01' && location.hash === '#/program/soc-analyst/module/1';
      history.replaceState(null, '', returnToModule
        ? location.pathname + location.search + location.hash
        : '#/portal');
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

function wireAdmin() {
  const trackFilter = document.getElementById('track-filter');
  const hideNotStarted = document.getElementById('hide-not-started');
  const tableRows = document.querySelectorAll('.admin-table-row');

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
}

window.addEventListener('hashchange', render);
window.addEventListener('message', dispatchModuleLabMessage);
document.addEventListener('DOMContentLoaded', render);

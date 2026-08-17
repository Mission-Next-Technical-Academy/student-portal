/* MNT Academy portal prototype — router, mock auth, entitlement gating.
 *
 * Everything visual here is assembled from tokens already shipping on
 * mntacademy.com (see MNT_DESIGN_TOKENS.md). No new design system.
 *
 * The auth in this file is a MOCK. It exists so the entitlement behavior can be
 * reviewed before Supabase is wired in. See PLATFORM_ARCHITECTURE.md §6.4 for
 * the real flow and SPRINT_PLAN.md Agent 39/40 for the replacement.
 */

const SESSION_KEY = 'mnt-portal.session';

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

function currentUser() {
  try {
    const email = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return DEMO_USERS.find((u) => u.email === email) || null;
  } catch (_) {
    return null;
  }
}

function signIn(identifier, password) {
  const id = identifier.trim().toLowerCase();
  // Accept either the bare username or the full email.
  const user = DEMO_USERS.find((u) => u.username === id || u.email === id);
  // Deliberately identical failure message whether or not the account exists.
  if (!user || password !== user.password) return null;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user.email));
  return user;
}

function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  // Real implementation must ALSO purge defender-lab.* keys here, or the next
  // student on this browser inherits the previous student's lab environment.
  // PLATFORM_ARCHITECTURE.md §7.2.
  //
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

function markModuleContentOpened(user, programSlug, moduleKey) {
  if (!user) return;
  const engagement = loadModuleEngagement(user);
  const id = moduleEngagementId(programSlug, moduleKey);
  if (!engagement.openedModules.includes(id)) {
    engagement.openedModules.push(id);
    saveModuleEngagement(user, engagement);
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
}

function moduleCompletion(program, moduleKey, user) {
  const module = program.modules[moduleKey];
  const fixtureState = (user.progress || {})[moduleKey] || 'not_started';
  const engagement = loadModuleEngagement(user);
  const moduleId = moduleEngagementId(program.slug, moduleKey);
  const labs = LABS.filter((lab) => lab.module === moduleKey);
  const contentOpened = fixtureState === 'complete' || engagement.openedModules.includes(moduleId);
  const allLabsComplete = labs.every((lab) => {
    const engagementComplete = engagement.completedLabs.includes(moduleLabEngagementId(program.slug, moduleKey, lab.key));
    if (lab.key === 'lab-soc-environment') {
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
        <h1 class="text-3xl font-bold text-white mb-4">Welcome back, ${esc(user.name)}.</h1>
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
  const labs = LABS.filter((l) => l.module === key);
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
          ${m.hours ? `<span><i class="ri-time-line"></i> ${esc(m.hours)}</span>` : ''}
          ${m.lessons ? `<span><i class="ri-book-open-line"></i> ${m.lessons} Lessons</span>` : ''}
          ${m.labs ? `<span><i class="ri-flask-line"></i> ${m.labs} Lab${m.labs > 1 ? 's' : ''}</span>` : ''}
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
  const url = lab.portalEntry || (SIM_ORIGIN + lab.simEntry);
  const external = !lab.portalEntry;
  return `
  <div class="flex items-center gap-4 bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
    <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e3a5f]/10 shrink-0">
      <i class="ri-flask-line text-lg text-[#1e3a5f]"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[#1e3a5f] font-medium text-sm">${esc(lab.title)}</p>
      <p class="text-gray-500 text-xs mt-0.5">${esc(lab.difficulty)} · ${lab.minutes >= 60 ? Math.round(lab.minutes / 60) + ' Hours' : lab.minutes + ' Minutes'}</p>
    </div>
    <a href="${esc(url)}" ${external ? 'target="_blank" rel="noopener"' : ''}
       class="inline-flex items-center gap-1.5 border border-[#1e3a5f]/20 text-[#1e3a5f] hover:bg-[#1e3a5f]/8
              font-semibold text-xs px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer">
      <i class="ri-play-circle-line"></i> Launch Lab
    </a>
  </div>`;
}

function labCard(lab, unlocked) {
  const url = lab.portalEntry || (SIM_ORIGIN + lab.simEntry);
  const external = !lab.portalEntry;
  return `
  <div class="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col gap-5 shadow-sm ${unlocked ? 'hover:-translate-y-1' : 'mnt-locked-strong'} transition-transform duration-200">
    <div class="flex items-start justify-between gap-3">
      <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8">
        <i class="${lab.isCapstone ? 'ri-flag-line' : 'ri-flask-line'} text-2xl text-[#1e3a5f]"></i>
      </div>
      <span class="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg">
        Module ${String(SOC.modules[lab.module].number).padStart(2, '0')}
      </span>
    </div>
    <div class="flex-1">
      <h3 class="text-[#1e3a5f] font-bold text-base leading-snug mb-2">${esc(lab.title)}</h3>
      <p class="text-gray-500 text-xs mb-3">
        ${esc(lab.difficulty)} · ${lab.minutes >= 60 ? Math.round(lab.minutes / 60) + ' Hours' : lab.minutes + ' Minutes'}
      </p>
      <p class="text-gray-500 text-sm leading-relaxed">${esc(lab.description)}</p>
    </div>
    <div class="flex flex-wrap gap-2">${lab.skills.map((s) => chip(s, true)).join('')}</div>
    <div class="h-px bg-gray-100"></div>
    ${
      unlocked
          ? `<a href="${esc(url)}" ${external ? 'target="_blank" rel="noopener"' : ''}
             class="inline-flex items-center justify-center gap-1.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold
                    px-6 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 text-sm cursor-pointer">
             <i class="ri-play-circle-line"></i> Launch Lab
           </a>`
        : `<span class="inline-flex items-center justify-center gap-1.5 text-gray-400 font-semibold text-sm px-6 py-2.5">
             <i class="ri-lock-line"></i> Locked
           </span>`
    }
  </div>`;
}

const SOC = PROGRAMS.find((p) => p.slug === 'soc-analyst');

function viewProgram(user, slug) {
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return viewNotFound(user);
  if (!hasProgramAccess(user, slug)) return viewNoAccess(user, program);
  // Enrolled, but this track's content file is still a stub.
  if (!isBuilt(program)) return viewInDevelopment(user, program);

  const enrollment = enrollmentFor(user, slug);
  const prog = programProgress(user, program);
  // The lab catalogue is per-track. Tracks whose labs are not authored yet get
  // no Labs or Capstone section at all, rather than an empty grid.
  const trackLabs = LABS.filter((l) => program.modules[l.module]);
  const unlockedLabs = trackLabs.filter((l) => hasModuleAccess(user, slug, l.module));
  const hasLabs = trackLabs.length > 0;

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
        <h1 class="text-3xl font-bold text-white mb-4">${esc(program.title)}</h1>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/80 text-base max-w-2xl mb-3">${esc(program.tagline || '')}</p>
        <p class="text-white/55 text-base max-w-2xl">${esc(program.intro || program.description)}</p>

        ${
          !program.isPublished
            ? `<div class="mt-8 inline-flex items-start gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4 max-w-2xl">
                 <i class="ri-tools-line text-[#f97316] text-lg mt-0.5"></i>
                 <p class="text-white/80 text-sm">
                   This is the confirmed <strong class="text-white">12-module curriculum outline</strong>. Lessons,
                   labs, and the capstone are being authored and will unlock as each module is completed.
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
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          ${program.stats.map((s) => `
            <div class="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1e3a5f]/8 mb-4">
                <i class="${esc(s.icon)} text-2xl text-[#1e3a5f]"></i>
              </div>
              <p class="text-gray-500 text-xs mb-1.5">${esc(s.label)}</p>
              <p class="text-[#1e3a5f] font-bold text-base leading-snug">${esc(s.value)}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- program nav -->
    <nav class="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-8 flex gap-1 overflow-x-auto" style="scrollbar-width: none">
        ${(hasLabs ? ['Curriculum', 'Labs', 'Capstone', 'Career Readiness'] : ['Curriculum', 'Career Readiness']).map((t) => `
          <a href="#sec-${t.toLowerCase().replace(/\s+/g, '-')}"
             class="relative whitespace-nowrap text-gray-600 hover:text-[#1e3a5f] text-sm font-medium transition-all duration-300
                    cursor-pointer px-4 py-4 hover:bg-[#1e3a5f]/8 group">
            ${t}
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

        <!-- the simulator, nested in the SOC Analyst program -->
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
              <h3 class="text-white font-bold text-xl mb-3">Mission Next Security Operations Simulator</h3>
              <p class="text-white/55 text-sm leading-relaxed">
                Alerts, incidents, device timelines, process trees, identities, sign-ins, hunting queries, threat
                intelligence, vulnerability findings, evidence records, and reporting — fully interconnected in a
                safe, simulated environment. Actions you take in one area appear everywhere else in the investigation.
              </p>
            </div>
            <div class="flex flex-col gap-3">
              <a href="${esc(SIM_ORIGIN)}" target="_blank" rel="noopener"
                 class="inline-flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold
                        px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                <i class="ri-terminal-box-line"></i> Open Simulator
              </a>
              <span class="text-white/40 text-xs text-center">Opens in a new tab</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${LABS.filter((l) => !l.isCapstone)
            .map((l) => labCard(l, hasModuleAccess(user, slug, l.module)))
            .join('')}
        </div>

        <p class="text-gray-400 text-xs mt-6">
          ${unlockedLabs.length} of ${LABS.length} labs available with your current enrollment.
        </p>
      </div>
    </section>

    `}

    <!-- capstone -->
    ${!hasLabs ? '' : `
    <section id="sec-capstone" class="relative py-16 px-8 overflow-hidden scroll-mt-32"
             style="background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 45%, #0f2440 100%)">
      <div class="mnt-stars"></div>
      <div class="relative z-10 max-w-7xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-white/15">
          <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>Module 12
        </div>
        <h2 class="text-3xl font-bold text-white mb-3">SOC Analyst Capstone</h2>
        <div class="w-12 h-1 bg-[#f97316] rounded-full mb-6"></div>
        <p class="text-white/55 text-base max-w-2xl mb-10">
          A full security operations investigation across twelve stages — from the first suspicious email through
          ATT&amp;CK mapping and the final report.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${[
            'Initial Alert', 'Email Investigation', 'Identity Investigation', 'Endpoint Investigation',
            'Network Investigation', 'Threat Intelligence', 'Threat Hunt', 'Vulnerability Analysis',
            'Incident Response', 'Evidence', 'ATT&CK Mapping', 'Final Report',
          ].map((stage, i) => `
            <div class="flex items-center gap-4 bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4">
              <span class="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[#f97316]/20 text-[#f97316] font-bold text-xs">
                ${String(i + 1).padStart(2, '0')}
              </span>
              <span class="text-white/80 font-medium text-sm">${esc(stage)}</span>
            </div>`).join('')}
        </div>

        <div class="mt-10">
          ${
            hasModuleAccess(user, slug, 'soc-12')
              ? `<a href="${esc(SIM_ORIGIN + '#/defender/incidents')}" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold px-8 py-3.5
                           rounded-xl transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                   <i class="ri-flag-line"></i> Begin Capstone
                 </a>`
              : `<span class="inline-flex items-center gap-2 border border-white/20 text-white/50 font-semibold px-8 py-3.5 rounded-xl">
                   <i class="ri-lock-line"></i> Complete the full program to unlock
                 </span>`
          }
        </div>
      </div>
    </section>

    `}

    <!-- career readiness -->
    <section id="sec-career-readiness" class="py-16 px-8 scroll-mt-32">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div class="inline-flex items-center gap-2 bg-[#f97316]/10 text-[#f97316] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
              Included In Every Program
            </div>
            <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4 leading-tight">From Training to Employment</h2>
            <div class="w-12 h-1 bg-[#f97316] rounded-full mb-8"></div>
            <p class="text-gray-600 text-base leading-loose">
              Career preparation is integrated with the technical curriculum. You leave the program with sanitized
              portfolio artifacts drawn from your own investigations.
            </p>
          </div>
          <div class="grid grid-cols-1 gap-4">
            ${[
              ['ri-file-text-line', 'Incident Investigation Report'],
              ['ri-shield-check-line', 'Vulnerability Assessment'],
              ['ri-search-eye-line', 'Threat-Hunting Report'],
              ['ri-presentation-line', 'Executive Security Summary'],
              ['ri-time-line', 'Incident Timeline'],
              ['ri-award-line', 'Capstone Completion Report'],
            ].map(([icon, label]) => `
              <div class="flex items-center gap-4 bg-[#f8fafc] border border-gray-100 rounded-xl px-5 py-4">
                <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1e3a5f]/10 shrink-0">
                  <i class="${icon} text-lg text-[#1e3a5f]"></i>
                </div>
                <span class="text-[#1e3a5f] font-medium text-sm">${esc(label)}</span>
              </div>`).join('')}
          </div>
        </div>

        <p class="text-gray-400 text-xs mt-12 max-w-3xl leading-relaxed">
          Curriculum includes concepts and skills aligned with cybersecurity analyst certification objectives.
          Mission Next Technical Academy is not affiliated with, endorsed by, or partnered with CompTIA or Microsoft.
          Completion of this program does not guarantee certification or exam passage.
        </p>
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

/* ------------------------------------------------------------------ router */

function render() {
  const app = document.getElementById('app');
  const hash = location.hash || '#/login';
  const user = currentUser();

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

  const moduleMatch = hash.match(/^#\/program\/([a-z0-9-]+)\/module\/(\d+)$/);
  const programMatch = hash.match(/^#\/program\/([a-z0-9-]+)/);
  if (moduleMatch && moduleMatch[1] === 'soc-analyst' && moduleMatch[2] === '1') {
    const program = PROGRAMS.find((item) => item.slug === moduleMatch[1]);
    app.innerHTML = hasModuleAccess(user, program.slug, 'soc-01')
      ? viewModuleOne(user, program)
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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;
    if (signIn(email, password)) {
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
    btn.addEventListener('click', () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen && btn.dataset.program && btn.dataset.module) {
        const user = currentUser();
        markModuleContentOpened(user, btn.dataset.program, btn.dataset.module);
        refreshModuleCompletionDot(btn, user);
      }
    });
  });

  wireModuleOneLab();
}

window.addEventListener('hashchange', render);
window.addEventListener('message', moduleOneReceiveCoachCompletion);
document.addEventListener('DOMContentLoaded', render);

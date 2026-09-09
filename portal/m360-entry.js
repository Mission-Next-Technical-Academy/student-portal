/* Mission Next M360 101 + student dashboard shell compatibility layer.
 *
 * This file is intentionally isolated from the technical course runtime. It
 * restores the student-first My Programs entry point, keeps the full technical
 * catalogue visible with app.js's existing entitlement/locked-card semantics,
 * and mounts M360 above that catalogue for eligible enrolled students.
 *
 * IMPORTANT BOUNDARY:
 * - no technical module, lab, grading, progress, or Supabase schema logic here;
 * - programCard()/hasProgramAccess() remain the authority for technical card
 *   presentation and route-level access remains in app.js;
 * - M360 remains separate from technical program progress.
 *
 * This compatibility layer exists so the student dashboard can be corrected
 * without editing the large shared app.js while SOC Analyst and IT Help Desk
 * builds are active in parallel. The shell overrides below are deliberately
 * narrow: viewPortal() and wireLogin() only.
 *
 * Gate 6 migration note: the prior post-login overlay used POST_LOGIN_KEY,
 * `event !== 'SIGNED_IN'`, `location.hash.startsWith('#/program/')`, and
 * `history.replaceState(null, '', '#/portal')`. Those mechanics are retired;
 * the dashboard now owns the destination before the technical course renders.
 */
(() => {
  'use strict';

  const ELIGIBLE_TRACKS = new Set(['SOCAN', 'HDESK', 'AIENG']);
  const ENTRY_ID = 'm360-course-entry';
  const ENTRY_SLOT_ID = 'm360-course-entry-slot';
  const REVIEW_STATUS_ID = 'm360-course-review-status';
  let ensurePending = false;
  let ensureScheduled = false;
  let reviewSummaryPromise = null;

  function technicalEnrollmentActive(user) {
    return Boolean(user && Array.isArray(user.enrollments) && user.enrollments.some((e) => e && e.status === 'active'));
  }

  /* ----------------------------------------------------------------------
   * Student portal shell
   * -------------------------------------------------------------------- */

  // Restore the student-first My Programs dashboard as the native rendered
  // surface. All technical cards are rendered once here using app.js's own
  // programCard() function. Locked cards therefore remain non-interactive and
  // route-level entitlement checks remain untouched.
  if (typeof viewPortal === 'function') {
    viewPortal = function viewPortalWithDiscovery(user) {
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
                  ? `You have ${enrolledCount} active program${enrolledCount > 1 ? 's' : ''}.`
                  : 'You do not currently have an active program. Contact Mission Next Technical Academy for enrollment support.'
              }
            </p>
          </div>
        </section>

        <section class="py-16 px-8">
          <div class="max-w-7xl mx-auto">
            <div class="text-center mb-10">
              <div class="inline-flex items-center gap-2 bg-[#f97316]/10 text-[#f97316] text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
                <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>My Learning
              </div>
              <h2 class="text-3xl font-bold text-[#1e3a5f] mb-4">My Programs</h2>
              <div class="w-12 h-1 bg-[#f97316] rounded-full mx-auto mb-6"></div>
              <p class="text-gray-500 text-base max-w-2xl mx-auto">
                Open your current coursework here. Other Mission Next programs remain visible so you can explore what is available next.
              </p>
            </div>

            <div id="${ENTRY_SLOT_ID}" class="mb-10"></div>

            <div class="text-center mb-10" data-mnt-program-area-header>
              <div class="inline-flex items-center gap-2 text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-4">
                <span class="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>What We Offer
              </div>
              <h3 class="text-2xl font-bold text-[#1e3a5f] mb-3">Program Areas</h3>
              <p class="text-gray-500 text-sm max-w-2xl mx-auto">
                Your enrolled technical program is available now. Other programs are shown but remain locked until enrollment.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-mnt-program-grid>
              ${PROGRAMS.map((program) => programCard(program, user)).join('')}
            </div>

            <p class="text-center text-gray-400 text-sm">
              <i class="ri-lock-line"></i> Locked programs require enrollment.
            </p>
          </div>
        </section>
      </main>
      ${footer()}`;
    };
  }

  // Restore the login destination at the source instead of redirecting the
  // student after the technical program has already rendered. The verified
  // SOC Module 1 coach-return path remains the one exception, and Admin still
  // routes to #/admin through app.js's existing admin-only rule.
  if (typeof wireLogin === 'function') {
    wireLogin = function wireLoginToMyPrograms() {
      const form = document.getElementById('login-form');
      if (!form) return;
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = form.email.value;
        const password = form.password.value;
        const result = await signIn(email, password);
        if (result && typeof result === 'object') {
          const coachReturn = new URLSearchParams(location.search).get('coachComplete');
          const returnToModule = coachReturn === 'm01' && location.hash === '#/program/soc-analyst/module/1';
          history.replaceState(
            null,
            '',
            returnToModule
              ? location.pathname + location.search + location.hash
              : '#/portal'
          );
          render();
          return;
        }

        const messages = {
          session_limit: 'Maximum active sessions reached for this account. Sign out on another device or tab, then try again.',
          geo_blocked: 'Sign-in is not available from your current location.',
        };
        const errorText = document.getElementById('login-error-text');
        const errorBox = document.getElementById('login-error');
        if (errorText) errorText.textContent = messages[result] || 'That email and password combination was not recognized.';
        if (errorBox) errorBox.classList.remove('hidden');
      });
    };
  }

  /* ----------------------------------------------------------------------
   * M360 entry and status
   * -------------------------------------------------------------------- */

  function findProgramSlot() {
    return document.getElementById(ENTRY_SLOT_ID);
  }

  function suppressLegacyCareerReadiness() {
    const legacySection = document.getElementById('sec-career-readiness');
    if (legacySection) legacySection.remove();

    document.querySelectorAll('#app a[href="#sec-career-readiness"]').forEach((link) => {
      const label = link.textContent.trim();
      if (label === 'M360 Companion' || label === 'Career Readiness') link.remove();
    });
  }

  function entryMarkup() {
    return `
      <section id="${ENTRY_ID}" aria-labelledby="m360-course-entry-title" class="overflow-hidden rounded-2xl border border-[#1e3a5f]/15 bg-white shadow-sm">
        <div class="relative grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div class="absolute inset-y-0 left-0 w-1.5 bg-[#f97316]" aria-hidden="true"></div>
          <div class="pl-2">
            <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f97316]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#f97316]">
              <span class="h-1.5 w-1.5 rounded-full bg-[#f97316]"></span>Career Readiness Core
            </div>
            <h3 id="m360-course-entry-title" class="text-2xl font-bold text-[#1e3a5f]">M360 101 Professional Readiness</h3>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Build one professional portfolio across six connected weeks. Learn it. Practice it. Prove it. M360 progress and review stay separate from your technical-course progress.</p>
            <div id="${REVIEW_STATUS_ID}" class="mt-4 hidden max-w-2xl rounded-xl border px-3 py-2 text-sm font-semibold" role="status" aria-live="polite"></div>
          </div>
          <a href="m360/" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25">
            Open M360 <i class="ri-arrow-right-line" aria-hidden="true"></i>
          </a>
        </div>
      </section>`;
  }

  function reviewSummary(rows) {
    const records = Array.isArray(rows) ? rows : [];
    const needsRevision = records.filter((row) => row && row.review_status === 'needs_revision').length;
    const awaitingReview = records.filter((row) => row && row.review_status === 'submitted').length;
    const portfolioReady = records.filter((row) => row && row.accepted_artifact_payload).length;

    if (needsRevision > 0) {
      return {
        tone: 'revision',
        message: `${needsRevision} assignment${needsRevision === 1 ? '' : 's'} ${needsRevision === 1 ? 'needs' : 'need'} revision · Open M360 to review instructor feedback and resubmit.`,
      };
    }
    if (awaitingReview > 0) {
      return {
        tone: 'awaiting',
        message: `${awaitingReview} assignment${awaitingReview === 1 ? '' : 's'} awaiting review.`,
      };
    }
    if (portfolioReady > 0) {
      return {
        tone: 'ready',
        message: `${portfolioReady} assignment${portfolioReady === 1 ? '' : 's'} reviewed / portfolio ready.`,
      };
    }
    return null;
  }

  function renderReviewSummary(summary) {
    const el = document.getElementById(REVIEW_STATUS_ID);
    if (!el) return;
    if (!summary) {
      el.className = 'mt-4 hidden max-w-2xl rounded-xl border px-3 py-2 text-sm font-semibold';
      el.textContent = '';
      return;
    }

    const toneClass = summary.tone === 'revision'
      ? 'border-[#f97316]/30 bg-[#fff7ed] text-[#9a3412]'
      : summary.tone === 'awaiting'
        ? 'border-[#1e3a5f]/20 bg-[#eef4fa] text-[#1e3a5f]'
        : 'border-[#1e3a5f]/15 bg-[#f4f8fb] text-[#245d40]';
    el.className = `mt-4 max-w-2xl rounded-xl border px-3 py-2 text-sm font-semibold ${toneClass}`;
    el.textContent = summary.message;
  }

  async function refreshReviewSummary(user) {
    const el = document.getElementById(REVIEW_STATUS_ID);
    if (!el || !user || !user.userId || typeof mntSupabase === 'undefined') return;
    if (el.dataset.loadedFor === user.userId) return;
    if (reviewSummaryPromise) return reviewSummaryPromise;

    reviewSummaryPromise = (async () => {
      const { data, error } = await mntSupabase
        .from('m360_week_records')
        .select('review_status, accepted_artifact_payload')
        .eq('user_id', user.userId)
        .order('week_number', { ascending: true });
      if (error) {
        console.error('M360 My Programs review summary failed', error);
        return;
      }
      const current = document.getElementById(REVIEW_STATUS_ID);
      if (!current) return;
      current.dataset.loadedFor = user.userId;
      renderReviewSummary(reviewSummary(data || []));
    })().finally(() => {
      reviewSummaryPromise = null;
    });

    return reviewSummaryPromise;
  }

  async function ensureEntry() {
    if (ensurePending) return;
    ensurePending = true;
    try {
      if (typeof currentUser !== 'function') return;
      const user = await currentUser();
      if (!user) return;

      if (user.isAdmin) return;

      // Technical program views retain no duplicate legacy M360 companion.
      suppressLegacyCareerReadiness();

      if (!ELIGIBLE_TRACKS.has(user.trackCode) || !technicalEnrollmentActive(user)) return;
      const slot = findProgramSlot();
      if (!slot) return;
      if (!document.getElementById(ENTRY_ID)) slot.innerHTML = entryMarkup();
      refreshReviewSummary(user);
    } catch (error) {
      console.error('M360 dashboard entry failed', error);
    } finally {
      ensurePending = false;
    }
  }

  function scheduleEnsureEntry() {
    if (ensureScheduled) return;
    ensureScheduled = true;
    requestAnimationFrame(() => {
      ensureScheduled = false;
      ensureEntry();
    });
  }

  // app.js replaces #app's top-level children on each route render. Observe
  // only those direct child changes. M360's own insertion occurs deeper in the
  // tree, so it cannot trigger this observer and cannot create a render loop.
  const app = document.getElementById('app');
  if (app) {
    const observer = new MutationObserver(() => scheduleEnsureEntry());
    observer.observe(app, { childList: true });
  }

  scheduleEnsureEntry();
})();

/* Mission Next M360 101 — isolated portal entry overlay.
 *
 * Loaded after app.js. This does not add M360 to PROGRAMS, enrollments,
 * module_progress, technical completion, or technical timekeeping. It renders
 * a separate student course entry for eligible enrolled students and a small
 * Admin-only launch panel for the M360 administration workspace.
 */
(() => {
  'use strict';

  const ELIGIBLE_TRACKS = new Set(['SOCAN', 'HDESK', 'AIENG']);
  const ENTRY_ID = 'm360-course-entry';
  const ADMIN_ENTRY_ID = 'm360-admin-entry';
  const POST_LOGIN_KEY = 'mnt.m360.postLoginProgramsPending';
  let renderPending = false;

  function technicalEnrollmentActive(user) {
    return Boolean(user && Array.isArray(user.enrollments) && user.enrollments.some(e => e && e.status === 'active'));
  }

  function findProgramGrid() {
    const headings = Array.from(document.querySelectorAll('#app h2'));
    const heading = headings.find(el => el.textContent.trim() === 'Program Areas');
    if (!heading) return null;
    const sectionHeader = heading.parentElement;
    const candidate = sectionHeader && sectionHeader.nextElementSibling;
    return candidate && candidate.classList.contains('grid') ? candidate : null;
  }

  function findAdminHeadingBlock() {
    const headings = Array.from(document.querySelectorAll('#app h1'));
    const heading = headings.find(el => el.textContent.trim() === 'Student Progress');
    if (!heading) return null;
    return heading.closest('.mb-8') || heading.parentElement;
  }

  function suppressLegacyCareerReadiness() {
    const legacySection = document.getElementById('sec-career-readiness');
    if (legacySection) legacySection.remove();

    document.querySelectorAll('#app a[href="#sec-career-readiness"]').forEach(link => {
      const label = link.textContent.trim();
      if (label === 'M360 Companion' || label === 'Career Readiness') link.remove();
    });
  }

  function routeEligibleLoginToPrograms(user) {
    if (sessionStorage.getItem(POST_LOGIN_KEY) !== '1') return false;
    if (!user || user.isAdmin || !ELIGIBLE_TRACKS.has(user.trackCode) || !technicalEnrollmentActive(user)) {
      sessionStorage.removeItem(POST_LOGIN_KEY);
      return false;
    }

    if (location.hash.startsWith('#/program/')) {
      sessionStorage.removeItem(POST_LOGIN_KEY);
      history.replaceState(null, '', '#/portal');
      if (typeof render === 'function') render();
      return true;
    }

    if (location.hash === '#/portal') sessionStorage.removeItem(POST_LOGIN_KEY);
    return false;
  }

  function entryMarkup() {
    return `
      <section id="${ENTRY_ID}" aria-labelledby="m360-course-entry-title" class="mb-8 overflow-hidden rounded-2xl border border-[#1e3a5f]/15 bg-white shadow-sm">
        <div class="relative grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div class="absolute inset-y-0 left-0 w-1.5 bg-[#f97316]" aria-hidden="true"></div>
          <div class="pl-2">
            <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-[#f97316]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#f97316]">
              <span class="h-1.5 w-1.5 rounded-full bg-[#f97316]"></span>Career Readiness Core
            </div>
            <h3 id="m360-course-entry-title" class="text-2xl font-bold text-[#1e3a5f]">M360 101 Professional Readiness</h3>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Build one professional portfolio across six connected weeks. Learn it. Practice it. Prove it. M360 progress and review stay separate from your technical-course progress.</p>
          </div>
          <a href="m360/" class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16304f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/25">
            Open M360 <i class="ri-arrow-right-line" aria-hidden="true"></i>
          </a>
        </div>
      </section>`;
  }

  function adminEntryMarkup() {
    return `
      <section id="${ADMIN_ENTRY_ID}" aria-labelledby="m360-admin-entry-title" class="mb-8 overflow-hidden rounded-2xl border border-[#1e3a5f]/15 bg-white shadow-sm">
        <div class="relative grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div class="absolute inset-y-0 left-0 w-1.5 bg-[#f97316]" aria-hidden="true"></div>
          <div class="pl-2">
            <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[#f97316]">M360 101 Administration</div>
            <h2 id="m360-admin-entry-title" class="text-xl font-bold text-[#1e3a5f]">Professional Readiness Review &amp; Completion</h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Use one workspace to review Start Here support needs and submitted M360 work, verify Career Spotlight presentation completion, and confirm the external attendance requirement.</p>
          </div>
          <a href="m360/review.html" class="inline-flex items-center justify-center rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16304f]">Open M360 Administration</a>
        </div>
      </section>`;
  }

  function ensureAdminEntry() {
    if (document.getElementById(ADMIN_ENTRY_ID)) return true;
    const headingBlock = findAdminHeadingBlock();
    if (!headingBlock) return false;
    headingBlock.insertAdjacentHTML('afterend', adminEntryMarkup());
    return true;
  }

  async function ensureEntry() {
    if (renderPending) return;
    renderPending = true;
    try {
      if (typeof currentUser !== 'function') return;

      const user = await currentUser();
      if (!user) return;
      if (routeEligibleLoginToPrograms(user)) return;

      if (user.isAdmin) {
        ensureAdminEntry();
        return;
      }

      if (!ELIGIBLE_TRACKS.has(user.trackCode)) return;
      if (!technicalEnrollmentActive(user)) return;

      suppressLegacyCareerReadiness();

      const grid = findProgramGrid();
      if (!grid) return;
      if (document.getElementById(ENTRY_ID)) return;

      grid.insertAdjacentHTML('beforebegin', entryMarkup());
    } catch (error) {
      console.error('M360 dashboard entry failed', error);
    } finally {
      renderPending = false;
    }
  }

  if (typeof mntSupabase !== 'undefined' && mntSupabase.auth && typeof mntSupabase.auth.onAuthStateChange === 'function') {
    mntSupabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN') return;
      const coachReturn = new URLSearchParams(location.search).get('coachComplete');
      if (coachReturn === 'm01') return;
      sessionStorage.setItem(POST_LOGIN_KEY, '1');
      setTimeout(ensureEntry, 0);
    });
  }

  const observer = new MutationObserver(() => { ensureEntry(); });
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });
  ensureEntry();
})();

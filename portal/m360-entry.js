/* Mission Next M360 101 — isolated student-dashboard entry.
 *
 * Loaded after app.js. This does not add M360 to PROGRAMS, enrollments,
 * module_progress, technical completion, or technical timekeeping. It only
 * renders a separate course entry for eligible, currently enrolled students.
 */
(() => {
  'use strict';

  const ELIGIBLE_TRACKS = new Set(['SOCAN', 'HDESK', 'AIENG']);
  const ENTRY_ID = 'm360-course-entry';
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

  function suppressLegacyCareerReadiness() {
    // M360 is a separate shared course. Eligible M360 students should not see
    // the legacy career-readiness/M360 companion section nested inside their
    // technical program page. Removing only this rendered DOM does not alter
    // technical PROGRAMS data, progress, labs, grades, hours, or persistence.
    const legacySection = document.getElementById('sec-career-readiness');
    if (legacySection) legacySection.remove();

    document.querySelectorAll('#app a[href="#sec-career-readiness"]').forEach(link => {
      const label = link.textContent.trim();
      if (label === 'M360 Companion' || label === 'Career Readiness') link.remove();
    });
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

  async function ensureEntry() {
    if (renderPending) return;
    renderPending = true;
    try {
      if (typeof currentUser !== 'function') return;

      const user = await currentUser();
      if (!user || user.isAdmin) return;
      if (!ELIGIBLE_TRACKS.has(user.trackCode)) return;
      if (!technicalEnrollmentActive(user)) return;

      suppressLegacyCareerReadiness();

      const grid = findProgramGrid();
      if (!grid) return;
      if (document.getElementById(ENTRY_ID)) return;

      grid.insertAdjacentHTML('beforebegin', entryMarkup());
    } catch (error) {
      // M360 entry is intentionally fail-soft: a problem here must never block
      // or alter the technical-course dashboard.
      console.error('M360 dashboard entry failed', error);
    } finally {
      renderPending = false;
    }
  }

  const observer = new MutationObserver(() => { ensureEntry(); });
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });
  ensureEntry();
})();

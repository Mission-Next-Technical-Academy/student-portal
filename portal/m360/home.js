(() => {
  'use strict';

  const WEEK1_KEYS = [
    'mnt.m360.preview.portfolio.v3',
    'mnt.m360.preview.portfolio.v2',
    'mnt.m360.preview.week1.v1'
  ];
  const WEEK2_KEY = 'mnt.m360.course.mock.v1';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find(el => el.src && el.src.includes(src.split('?')[0]));
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const el = document.createElement('script');
      el.src = src;
      el.addEventListener('load', () => { el.dataset.loaded = 'true'; resolve(); }, { once: true });
      el.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true });
      document.body.appendChild(el);
    });
  }

  async function ensureDataRuntime() {
    if (typeof supabase === 'undefined') await loadScript('../vendor/supabase.js?v=20260828');
    if (typeof mntSupabase === 'undefined') await loadScript('../supabase-config.js?v=20260828');
    if (!window.M360Data) await loadScript('m360-data.js?v=20260904');
    return Boolean(window.M360Data);
  }

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }

  function firstStored(keys) {
    for (const key of keys) {
      const value = safeParse(localStorage.getItem(key));
      if (value) return value;
    }
    return null;
  }

  function getLocalWeek1() {
    const source = firstStored(WEEK1_KEYS);
    if (!source) return null;
    if (source.weeks && source.weeks.week1) return source.weeks.week1;
    return source.week1 || source;
  }

  function getLocalWeek2() {
    const source = safeParse(localStorage.getItem(WEEK2_KEY));
    return source && source.weeks ? source.weeks.week2 || null : null;
  }

  function remoteWeek(row) {
    if (!row) return null;
    return {
      status: row.review_status,
      draft: row.draft_payload || {},
      submitted: row.submitted_payload || null,
      accepted: row.accepted_artifact_payload || null,
      acceptedAt: row.accepted_at || null,
      numericScore: row.numeric_score == null ? null : Number(row.numeric_score)
    };
  }

  function hasDraftContent(week) {
    if (!week || !week.draft || typeof week.draft !== 'object') return false;
    return Object.entries(week.draft).some(([key, value]) => {
      if (key === 'reviewChecks') return value && typeof value === 'object' && Object.values(value).some(Boolean);
      return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
    });
  }

  function statusFor(week) {
    if (!week) return { label: 'Not Started', className: '' };
    if (week.accepted) return { label: 'Portfolio Ready', className: 'ready' };
    if (week.status === 'submitted') return { label: 'Submitted', className: 'submitted' };
    if (week.status === 'needs_revision') return { label: 'Needs Revision', className: 'revision' };
    if (hasDraftContent(week)) return { label: 'In Progress', className: 'progress' };
    return { label: 'Not Started', className: '' };
  }

  function applyStatus(elementId, status) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = status.label;
    el.className = 'status-pill' + (status.className ? ' ' + status.className : '');
  }

  function setProductionLinks() {
    const week1 = document.querySelector('[data-week-card="1"] .week-action');
    const week2 = document.querySelector('[data-week-card="2"] .week-action');
    if (week1) week1.href = 'week.html?week=1';
    if (week2) week2.href = 'week.html?week=2';
    document.querySelectorAll('.portfolio-link, .portfolio-home-actions .btn').forEach(link => {
      if (link.tagName === 'A') link.href = 'week.html?week=2#prove';
    });
  }

  function showModeNotice(message, isWarning = false) {
    let notice = document.getElementById('m360HomeModeNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'm360HomeModeNotice';
      notice.style.cssText = 'max-width:1180px;margin:18px auto 0;padding:12px 16px;border-radius:12px;background:#fff;border-left:4px solid #1F4E79;box-shadow:0 8px 24px rgba(18,55,84,.06);font-size:13px;color:#59636d';
      const hero = document.querySelector('.home-wrap');
      if (hero) hero.prepend(notice);
    }
    notice.style.borderLeftColor = isWarning ? '#F26A2E' : '#1F4E79';
    notice.textContent = message;
  }

  function addAdminReviewLink() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('m360AdminReviewLink')) return;
    const link = document.createElement('a');
    link.id = 'm360AdminReviewLink';
    link.className = 'topbar-link';
    link.href = 'review.html';
    link.textContent = 'Review Queue';
    actions.prepend(link);
  }

  function renderStudentState(week1, week2, mode) {
    const week1Status = statusFor(week1);
    const week2Status = statusFor(week2);
    applyStatus('week1Status', week1Status);
    applyStatus('week2Status', week2Status);

    const readyCount = Number(Boolean(week1 && week1.accepted)) + Number(Boolean(week2 && week2.accepted));
    const readyCountEl = document.getElementById('readyCount');
    const portfolioCountLarge = document.getElementById('portfolioCountLarge');
    const progressBar = document.getElementById('homeProgressBar');
    if (readyCountEl) readyCountEl.textContent = `${readyCount} / 6`;
    if (portfolioCountLarge) portfolioCountLarge.textContent = String(readyCount);
    if (progressBar) progressBar.style.width = `${Math.round((readyCount / 6) * 100)}%`;

    const continueButton = document.getElementById('continueButton');
    const currentStatusText = document.getElementById('currentStatusText');
    if (!continueButton || !currentStatusText) return;

    if (!week1 || !week1.accepted) {
      continueButton.href = 'week.html?week=1';
      continueButton.textContent = hasDraftContent(week1) ? 'Continue Week 1' : 'Start Week 1';
      currentStatusText.textContent = hasDraftContent(week1)
        ? 'Continue building your Week 1 Direction artifact.'
        : 'Start with Week 1 to establish your professional direction.';
    } else if (!week2 || !week2.accepted) {
      continueButton.href = 'week.html?week=2';
      continueButton.textContent = hasDraftContent(week2) || week2Status.label !== 'Not Started' ? 'Continue Week 2' : 'Start Week 2';
      currentStatusText.textContent = 'Week 1 is Portfolio Ready. Week 2 now turns that direction into a professional signal.';
    } else {
      continueButton.href = 'week.html?week=2';
      continueButton.textContent = 'Review Week 2';
      currentStatusText.textContent = 'Weeks 1 and 2 are Portfolio Ready. Week 3 will become the next step when it is released.';
    }

    const pill = document.querySelector('.preview-pill');
    if (pill) pill.textContent = mode === 'remote' ? 'M360 Course Home · authenticated' : 'M360 Course Home · migration pending';
  }

  async function initialize() {
    setProductionLinks();

    try {
      const runtimeReady = await ensureDataRuntime();
      if (!runtimeReady) throw new Error('M360 data runtime unavailable');
      const context = await M360Data.getContext();

      if (!context.authenticated) {
        location.replace('../index.html#/login');
        return;
      }

      if (context.isAdmin) {
        addAdminReviewLink();
        const button = document.getElementById('continueButton');
        const text = document.getElementById('currentStatusText');
        if (button) { button.href = 'review.html'; button.textContent = 'Open Review Queue'; }
        if (text) text.textContent = 'Admin reviewer access is separate from the student M360 workspace.';
        showModeNotice('Admin mode: use the M360 Review Queue for submitted student work. Student technical-course records are not modified from this page.');
        return;
      }

      if (!context.eligible) {
        location.replace('../index.html');
        return;
      }

      if (await M360Data.schemaAvailable()) {
        const rows = await M360Data.loadOwnWeekRecords();
        renderStudentState(
          remoteWeek(rows.find(row => Number(row.week_number) === 1)),
          remoteWeek(rows.find(row => Number(row.week_number) === 2)),
          'remote'
        );
        showModeNotice('Authenticated M360 course state is loaded from the durable M360 data store. Technical-course progress remains separate.');
        return;
      }

      renderStudentState(getLocalWeek1(), getLocalWeek2(), 'local');
      showModeNotice('The authenticated M360 shell is available, but the durable M360 database migration is still pending. Existing technical-course data is unaffected.', true);
    } catch (error) {
      console.error('M360 Course Home initialization failed', error);
      renderStudentState(getLocalWeek1(), getLocalWeek2(), 'local');
      showModeNotice('M360 could not reach its production data layer. Local preview state is shown without changing any technical-course data.', true);
    }
  }

  initialize();
})();

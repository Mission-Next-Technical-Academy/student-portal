(() => {
  'use strict';

  const WEEK1_KEYS = [
    'mnt.m360.preview.portfolio.v3',
    'mnt.m360.preview.portfolio.v2',
    'mnt.m360.preview.week1.v1'
  ];
  const COURSE_KEY = 'mnt.m360.course.mock.v1';
  const RELEASED_WEEKS = [1, 2, 3, 4, 5, 6];

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

  async function ensureSupabaseRuntime() {
    if (typeof supabase === 'undefined') await loadScript('../vendor/supabase.js?v=20260828');
    if (typeof mntSupabase === 'undefined') await loadScript('../supabase-config.js?v=20260828');
    return typeof mntSupabase !== 'undefined';
  }

  async function ensureDataRuntime() {
    if (!(await ensureSupabaseRuntime())) return false;
    if (!window.M360Data) await loadScript('m360-data.js?v=20260904f');
    return Boolean(window.M360Data);
  }

  function safeParse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function firstStored(keys) { for (const key of keys) { const value = safeParse(localStorage.getItem(key)); if (value) return value; } return null; }

  function getLocalWeek1() {
    const source = firstStored(WEEK1_KEYS);
    if (!source) return null;
    if (source.weeks && source.weeks.week1) return source.weeks.week1;
    return source.week1 || source;
  }

  function getLocalCourseWeek(number) {
    const source = safeParse(localStorage.getItem(COURSE_KEY));
    return source && source.weeks ? source.weeks[`week${number}`] || null : null;
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

  function meaningful(value) {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.some(meaningful);
    if (value && typeof value === 'object') return Object.values(value).some(meaningful);
    return Boolean(value);
  }

  function hasDraftContent(week) {
    return Boolean(week && week.draft && typeof week.draft === 'object' && meaningful(week.draft));
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

  function releaseWeekCard(number) {
    const card = document.querySelector(`[data-week-card="${number}"]`);
    if (!card) return;
    card.classList.remove('upcoming');
    card.classList.add('available');
    const oldStatus = card.querySelector('.status-pill');
    if (oldStatus) { oldStatus.id = `week${number}Status`; oldStatus.className = 'status-pill'; oldStatus.textContent = 'Not Started'; }
    const oldAction = card.querySelector('.week-action');
    if (oldAction && oldAction.tagName !== 'A') {
      const link = document.createElement('a');
      link.className = 'week-action';
      link.href = `week.html?week=${number}`;
      link.innerHTML = `Open Week ${number} <span>→</span>`;
      oldAction.replaceWith(link);
    } else if (oldAction) {
      oldAction.href = `week.html?week=${number}`;
      oldAction.classList.remove('disabled');
      oldAction.removeAttribute('aria-disabled');
    }
  }

  function setProductionLinks() {
    RELEASED_WEEKS.filter(number => number >= 3).forEach(releaseWeekCard);
    RELEASED_WEEKS.forEach(number => {
      const link = document.querySelector(`[data-week-card="${number}"] .week-action`);
      if (link && link.tagName === 'A') link.href = `week.html?week=${number}`;
    });
    document.querySelectorAll('.portfolio-link, .portfolio-home-actions .btn').forEach(link => {
      if (link.tagName === 'A') link.href = 'portfolio.html';
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
    link.textContent = 'M360 Administration';
    actions.prepend(link);
  }

  async function signOutFromM360(event) {
    if (event) event.preventDefault();
    const control = document.getElementById('m360SignOut');
    if (control) {
      control.setAttribute('aria-busy', 'true');
      control.textContent = 'Signing Out…';
    }

    try {
      if (!(await ensureSupabaseRuntime())) throw new Error('Supabase client unavailable.');
      try {
        const { data: { session } } = await mntSupabase.auth.getSession();
        const userId = session && session.user ? session.user.id : null;
        if (userId) {
          const { error } = await mntSupabase
            .from('site_sessions')
            .update({ ended_at: new Date().toISOString(), ended_reason: 'user_signed_out' })
            .eq('user_id', userId)
            .is('ended_at', null);
          if (error) console.error('M360 site_sessions self-close failed', error);
        }
      } catch (error) {
        console.error('M360 site_sessions self-close threw', error);
      }

      await mntSupabase.auth.signOut();
      Object.keys(localStorage)
        .filter(key => key.startsWith('defender-lab.'))
        .forEach(key => localStorage.removeItem(key));
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('defender-lab.'))
        .forEach(key => sessionStorage.removeItem(key));
      location.replace('../index.html#/login');
    } catch (error) {
      console.error('M360 sign out failed', error);
      if (control) {
        control.removeAttribute('aria-busy');
        control.textContent = 'Sign Out';
      }
      showModeNotice('Sign out could not be completed. Please try again.', true);
    }
  }

  function ensureSignOutControl() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('m360SignOut')) return;
    const link = document.createElement('a');
    link.id = 'm360SignOut';
    link.className = 'topbar-link';
    link.href = '../index.html#/login';
    link.textContent = 'Sign Out';
    link.addEventListener('click', signOutFromM360);
    const myPrograms = Array.from(actions.querySelectorAll('a')).find(item => item.textContent.trim() === 'My Programs');
    if (myPrograms) myPrograms.insertAdjacentElement('afterend', link);
    else actions.prepend(link);
  }

  function setCurrentCard(weeks) {
    document.querySelectorAll('[data-week-card]').forEach(card => card.classList.remove('current'));
    let current = RELEASED_WEEKS.find(number => !(weeks[number] && weeks[number].accepted));
    if (!current) current = 6;
    const card = document.querySelector(`[data-week-card="${current}"]`);
    if (card) card.classList.add('current');
  }

  function renderStartHere(progress, mode) {
    const status = document.getElementById('startHereStatus');
    const action = document.getElementById('startHereAction');
    const complete = Boolean(progress && progress.start_here_completed_at);
    if (status) {
      status.textContent = complete ? 'Complete' : mode === 'remote' ? 'Not Complete' : 'Status unavailable';
      status.className = 'status-pill' + (complete ? ' ready' : mode === 'remote' ? ' progress' : '');
    }
    if (action) action.textContent = complete ? 'Review Start Here' : 'Open Start Here';
    return complete;
  }

  function renderStudentState(week1, week2, week3, week4, week5, week6, mode, progress = null) {
    const weeks = { 1: week1, 2: week2, 3: week3, 4: week4, 5: week5, 6: week6 };
    const statuses = { 1: statusFor(week1), 2: statusFor(week2), 3: statusFor(week3), 4: statusFor(week4), 5: statusFor(week5), 6: statusFor(week6) };
    RELEASED_WEEKS.forEach(number => applyStatus(`week${number}Status`, statuses[number]));
    setCurrentCard(weeks);

    const readyCount = RELEASED_WEEKS.filter(number => Boolean(weeks[number] && weeks[number].accepted)).length;
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
      continueButton.href = 'week.html?week=1'; continueButton.textContent = hasDraftContent(week1) ? 'Continue Week 1' : 'Start Week 1'; currentStatusText.textContent = 'Start with Week 1 to establish your professional direction.';
    } else if (!week2 || !week2.accepted) {
      continueButton.href = 'week.html?week=2'; continueButton.textContent = hasDraftContent(week2) || statuses[2].label !== 'Not Started' ? 'Continue Week 2' : 'Start Week 2'; currentStatusText.textContent = 'Week 1 is Portfolio Ready. Week 2 turns that direction into a professional signal.';
    } else if (!week3 || !week3.accepted) {
      continueButton.href = 'week.html?week=3'; continueButton.textContent = hasDraftContent(week3) || statuses[3].label !== 'Not Started' ? 'Continue Week 3' : 'Start Week 3'; currentStatusText.textContent = 'Weeks 1 and 2 are Portfolio Ready. Week 3 uses connection and follow-up to test what you are learning.';
    } else if (!week4 || !week4.accepted) {
      continueButton.href = 'week.html?week=4'; continueButton.textContent = hasDraftContent(week4) || statuses[4].label !== 'Not Started' ? 'Continue Week 4' : 'Start Week 4'; currentStatusText.textContent = 'Weeks 1–3 are Portfolio Ready. Week 4 turns accepted evidence into a targeted resume.';
    } else if (!week5 || !week5.accepted) {
      continueButton.href = 'week.html?week=5'; continueButton.textContent = hasDraftContent(week5) || statuses[5].label !== 'Not Started' ? 'Continue Week 5' : 'Start Week 5'; currentStatusText.textContent = 'Weeks 1–4 are Portfolio Ready. Week 5 turns accepted evidence into interview-ready stories and practice.';
    } else if (!week6 || !week6.accepted) {
      continueButton.href = 'week.html?week=6'; continueButton.textContent = hasDraftContent(week6) || statuses[6].label !== 'Not Started' ? 'Continue Week 6' : 'Start Week 6'; currentStatusText.textContent = 'Weeks 1–5 are Portfolio Ready. Week 6 brings your accepted evidence together into the Career Spotlight and 30-day plan.';
    } else {
      continueButton.href = 'portfolio.html'; continueButton.textContent = 'Open My M360 Portfolio'; currentStatusText.textContent = 'All six M360 artifacts are Portfolio Ready. Open your portfolio to review your proof and course-completion status.';
    }

    const startHereComplete = renderStartHere(progress, mode);
    if (mode === 'remote' && !startHereComplete) {
      continueButton.href = 'start-here.html';
      continueButton.textContent = 'Complete Start Here';
      currentStatusText.textContent = 'Complete the ungraded Orientation & Baseline before beginning Week 1.';
      document.querySelectorAll('[data-week-card]').forEach(card => card.classList.remove('current'));
    }

    const pill = document.querySelector('.preview-pill');
    if (pill) pill.textContent = mode === 'remote' ? 'M360 Course Home · authenticated' : 'M360 Course Home · local fallback';
  }

  async function initialize() {
    setProductionLinks();
    ensureSignOutControl();
    try {
      const runtimeReady = await ensureDataRuntime();
      if (!runtimeReady) throw new Error('M360 data runtime unavailable');
      const context = await M360Data.getContext();
      if (!context.authenticated) { location.replace('../index.html#/login'); return; }
      if (context.isAdmin) {
        addAdminReviewLink();
        const button = document.getElementById('continueButton');
        const text = document.getElementById('currentStatusText');
        if (button) { button.href = 'review.html'; button.textContent = 'Open M360 Administration'; }
        if (text) text.textContent = 'Admin reviewer access is separate from the student M360 workspace.';
        showModeNotice('Admin mode: use M360 Administration for baselines, submitted work, presentation verification, and attendance verification.');
        return;
      }
      if (!context.eligible) { location.replace('../index.html#/portal'); return; }

      if (await M360Data.schemaAvailable()) {
        const [rows, progress] = await Promise.all([M360Data.loadOwnWeekRecords(), M360Data.loadOwnCourseProgress()]);
        renderStudentState(
          remoteWeek(rows.find(row => Number(row.week_number) === 1)),
          remoteWeek(rows.find(row => Number(row.week_number) === 2)),
          remoteWeek(rows.find(row => Number(row.week_number) === 3)),
          remoteWeek(rows.find(row => Number(row.week_number) === 4)),
          remoteWeek(rows.find(row => Number(row.week_number) === 5)),
          remoteWeek(rows.find(row => Number(row.week_number) === 6)),
          'remote', progress
        );
        showModeNotice('Authenticated M360 course state is loaded from the durable M360 data store. Technical-course progress remains separate.');
        return;
      }

      renderStudentState(getLocalWeek1(), getLocalCourseWeek(2), getLocalCourseWeek(3), getLocalCourseWeek(4), getLocalCourseWeek(5), getLocalCourseWeek(6), 'local', null);
      showModeNotice('M360 could not confirm its durable data layer. Local working state is shown without changing technical-course data.', true);
    } catch (error) {
      console.error('M360 Course Home initialization failed', error);
      renderStudentState(getLocalWeek1(), getLocalCourseWeek(2), getLocalCourseWeek(3), getLocalCourseWeek(4), getLocalCourseWeek(5), getLocalCourseWeek(6), 'local', null);
      showModeNotice('M360 could not reach its production data layer. Local working state is shown without changing any technical-course data.', true);
    }
  }

  initialize();
})();

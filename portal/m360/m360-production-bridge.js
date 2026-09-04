(() => {
  'use strict';

  const script = document.currentScript;
  const weekNumber = Number(script && script.dataset.week);
  const localScript = script && script.dataset.localScript;
  const isWeek1 = weekNumber === 1;
  const legacyLocalKey = isWeek1 ? 'mnt.m360.preview.portfolio.v3' : 'mnt.m360.course.mock.v1';
  const schemaVersion = isWeek1 ? 3 : 1;
  const RELEASED_WEEKS = [1, 2, 3, 4, 5, 6];
  let localKey = null;
  let currentUserId = null;

  if (!RELEASED_WEEKS.includes(weekNumber) || !localScript) {
    console.error('M360 production bridge: invalid week configuration.');
    return;
  }

  function safeParse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
  }

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function userScopedKey(userId) {
    const workspace = isWeek1 ? 'week1' : 'course';
    return `mnt.m360.${workspace}.v1.${userId}`;
  }

  function markOwnedState(state) {
    state.m360Production = true;
    state.cacheOwnerUserId = currentUserId;
    return state;
  }

  function hasMeaningfulContent(payload) {
    if (!payload || typeof payload !== 'object') return false;
    return Object.entries(payload).some(([key, value]) => {
      if (key === 'reviewChecks') return value && typeof value === 'object' && Object.values(value).some(Boolean);
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.some(item => {
        if (typeof item === 'string') return item.trim().length > 0;
        if (item && typeof item === 'object') return Object.values(item).some(v => typeof v === 'string' ? v.trim().length > 0 : Boolean(v));
        return Boolean(item);
      });
      return value && typeof value === 'object' ? Object.keys(value).length > 0 : Boolean(value);
    });
  }

  function blankWeek1() {
    return {
      status: 'draft',
      draft: {
        direction: '', nextStep: '',
        strength1: '', evidence1: '', strength2: '', evidence2: '', strength3: '', evidence3: '',
        translation: '', brandStatement: ''
      },
      submitted: null, submittedAt: null, accepted: null, acceptedAt: null
    };
  }

  function blankWeek2() {
    const draft = {
      profileSignalBefore: '', changePlan: '', profileUrl: '', targetDirection: '', headline: '', about: '',
      experienceRole: '', experienceBefore: '', experienceAfter: '', experienceCapability: '',
      reflectionStrongest: '', reflectionNeedsWork: '', reflectionSupport: '', reviewChecks: {}
    };
    for (let i = 1; i <= 8; i += 1) {
      draft[`keyword${i}`] = '';
      draft[`skill${i}`] = '';
    }
    return { status: 'draft', draft, submitted: null, submittedAt: null, accepted: null, acceptedAt: null };
  }

  function blankCurrentWeek() {
    if (isWeek1) return blankWeek1();
    if (weekNumber === 2) return blankWeek2();
    return { status: 'draft', draft: {}, submitted: null, submittedAt: null, accepted: null, acceptedAt: null };
  }

  function localState() {
    if (!localKey || !currentUserId) return { schemaVersion, updatedAt: null, weeks: {} };
    const working = safeParse(localStorage.getItem(legacyLocalKey));
    if (working && working.weeks && working.cacheOwnerUserId === currentUserId) return working;
    const scoped = safeParse(localStorage.getItem(localKey));
    if (scoped && scoped.weeks && scoped.cacheOwnerUserId === currentUserId) return scoped;
    return { schemaVersion, updatedAt: null, weeks: {}, cacheOwnerUserId: currentUserId };
  }

  function saveLocalState(state) {
    if (!localKey || !currentUserId) return;
    markOwnedState(state);
    const serialized = JSON.stringify(state);
    localStorage.setItem(localKey, serialized);
    // Existing week scripts still use the historical key. During this guarded
    // integration the key is only a compatibility mirror for the authenticated
    // user's scoped cache and always carries an owner marker.
    localStorage.setItem(legacyLocalKey, serialized);
  }

  function localWeek(state) {
    return state && state.weeks ? state.weeks[`week${weekNumber}`] || null : null;
  }

  function remoteToLocalWeek(row) {
    return {
      status: row.review_status || 'draft',
      draft: deepClone(row.draft_payload || {}),
      submitted: deepClone(row.submitted_payload || null),
      submittedAt: row.submitted_at || null,
      accepted: deepClone(row.accepted_artifact_payload || null),
      acceptedAt: row.accepted_at || null,
      rubricScores: deepClone(row.rubric_scores || null),
      numericScore: row.numeric_score == null ? null : Number(row.numeric_score),
      reviewerFeedback: row.reviewer_feedback || null,
      revisionNumber: Number(row.revision_number || 0),
      remoteUpdatedAt: row.updated_at || null
    };
  }

  function emptyRemoteWeek() {
    return { status: 'draft', draft: {}, submitted: null, submittedAt: null, accepted: null, acceptedAt: null, reviewerFeedback: null, revisionNumber: 0 };
  }

  function writeRemoteState(rows) {
    const state = localState();
    for (const releasedWeek of RELEASED_WEEKS) {
      const row = rows.find(item => Number(item.week_number) === releasedWeek) || null;
      state.weeks[`week${releasedWeek}`] = row ? remoteToLocalWeek(row) : emptyRemoteWeek();
    }
    state.schemaVersion = schemaVersion;
    state.remoteHydratedAt = new Date().toISOString();
    saveLocalState(state);
    return { state, ownRow: rows.find(row => Number(row.week_number) === weekNumber) || null };
  }

  function prepareScopedCache(userId) {
    currentUserId = userId;
    localKey = userScopedKey(userId);

    const scoped = safeParse(localStorage.getItem(localKey));
    const ownedScoped = scoped && scoped.weeks && scoped.cacheOwnerUserId === userId ? scoped : null;
    if (scoped && !ownedScoped) localStorage.removeItem(localKey);

    // Historical M360 keys were not account-scoped. Never trust or upload a
    // legacy value unless this bridge previously stamped it for this user.
    const working = safeParse(localStorage.getItem(legacyLocalKey));
    if (!working || working.cacheOwnerUserId !== userId) localStorage.removeItem(legacyLocalKey);

    if (ownedScoped) {
      localStorage.setItem(legacyLocalKey, JSON.stringify(ownedScoped));
    }

    if (isWeek1) {
      localStorage.removeItem('mnt.m360.preview.portfolio.v2');
      localStorage.removeItem('mnt.m360.preview.week1.v1');
    }
  }

  function sanitizeUnverifiedLocalState() {
    const state = localState();
    const key = `week${weekNumber}`;
    const existing = localWeek(state);
    const blank = blankCurrentWeek();
    const draft = existing && existing.draft && typeof existing.draft === 'object'
      ? { ...blank.draft, ...deepClone(existing.draft) }
      : blank.draft;

    state.weeks[key] = { ...blank, draft };
    state.schemaVersion = schemaVersion;
    state.remoteHydratedAt = new Date().toISOString();
    saveLocalState(state);
    return state.weeks[key];
  }

  function setPreviewPill(text) {
    const pill = document.querySelector('.preview-pill');
    if (pill) pill.textContent = text;
  }

  function setSaveLabel(text) {
    const label = document.getElementById('saveState');
    if (label) {
      label.textContent = text;
      label.classList.add('saved');
    }
  }

  function showBridgeNotice(type, message) {
    let notice = document.getElementById('m360ProductionNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'm360ProductionNotice';
      notice.className = 'live-note no-print';
      const main = document.querySelector('.content');
      if (main) main.prepend(notice);
      else document.body.prepend(notice);
    }
    notice.dataset.type = type;
    notice.textContent = message;
  }

  function hideDemoControls() {
    const ids = isWeek1
      ? ['acceptDemoBtn', 'needsRevisionDemoBtn', 'resetAcceptanceBtn', 'clearBtn']
      : ['meetsStandardBtn', 'needsRevisionBtn', 'resetReviewBtn'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    document.querySelectorAll('.demo-boundary, .qa-banner').forEach(el => { el.hidden = true; });
  }

  function addCourseNavigation() {
    if (document.getElementById('m360WeekNavigation')) return;
    const nav = document.createElement('nav');
    nav.id = 'm360WeekNavigation';
    nav.className = 'portfolio-actions no-print';
    nav.setAttribute('aria-label', 'M360 course navigation');

    let previous = '';
    let home = '';
    let next = '';
    if (isWeek1) {
      home = '<a class="btn btn-secondary" href="m360/">M360 Home</a>';
      next = '<a class="btn btn-secondary" href="m360/week.html?week=2">Week 2 -></a>';
    } else {
      previous = `<a class="btn btn-quiet" href="week.html?week=${weekNumber - 1}"><- Week ${weekNumber - 1}</a>`;
      home = '<a class="btn btn-secondary" href="index.html">M360 Home</a>';
      if (RELEASED_WEEKS.includes(weekNumber + 1)) next = `<a class="btn btn-secondary" href="week.html?week=${weekNumber + 1}">Week ${weekNumber + 1} -></a>`;
    }
    nav.innerHTML = `${previous}${home}${next}`;
    const content = document.querySelector('.content');
    if (content) content.appendChild(nav);
  }

  function statusLabel(week, number) {
    if (!week) return number > weekNumber ? 'Upcoming' : 'Not Started';
    if (week.accepted) return 'Portfolio Ready';
    if (week.status === 'submitted') return 'Submitted';
    if (week.status === 'needs_revision') return 'Needs Revision';
    if (week.status === 'accepted') return 'Portfolio Ready';
    if (hasMeaningfulContent(week.draft)) return 'Not Started';
    return number > weekNumber ? 'Upcoming' : 'Not Started';
  }

  function normalizeProductionStatuses() {
    const state = localState();
    for (const number of RELEASED_WEEKS) {
      const el = document.getElementById(`sidebarWeek${number}Status`);
      if (el) el.textContent = statusLabel(state.weeks[`week${number}`], number);
    }
    document.querySelectorAll('.roadmap-state').forEach(el => {
      if (el.textContent.trim() === 'Future') el.textContent = 'Upcoming';
      if (el.textContent.trim() === 'Not imported') el.textContent = 'Not Started';
    });
    document.querySelectorAll('.journey-step small, .my-m360 strong').forEach(el => {
      if (el.textContent.trim() === 'Not imported') el.textContent = 'Not Started';
    });
  }

  function renderInstructorFeedback() {
    const prove = document.getElementById('prove');
    if (!prove) return;
    const state = localState();
    const week = state.weeks[`week${weekNumber}`] || null;
    const feedback = week && week.reviewerFeedback ? String(week.reviewerFeedback).trim() : '';
    const needsRevision = Boolean(week && week.status === 'needs_revision');
    let panel = document.getElementById('m360InstructorFeedback');

    if (!feedback && !needsRevision) {
      if (panel) panel.remove();
      return;
    }

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'm360InstructorFeedback';
      panel.className = 'portfolio-mode-note instructor-feedback';
      const body = prove.querySelector('.card-body');
      if (body) body.prepend(panel);
      else prove.prepend(panel);
    }

    const title = needsRevision ? 'Revision Requested - Instructor Feedback' : 'Instructor Feedback';
    const message = feedback || 'Your instructor returned this assignment for revision. Review the required components and resubmit when ready.';
    panel.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadOriginalScript() {
    return new Promise((resolve, reject) => {
      const original = document.createElement('script');
      original.src = localScript;
      original.addEventListener('load', resolve, { once: true });
      original.addEventListener('error', () => reject(new Error(`Unable to load ${localScript}`)), { once: true });
      document.body.appendChild(original);
    });
  }

  async function bootstrap() {
    if (!window.M360Data) {
      await loadOriginalScript();
      setPreviewPill(`Week ${weekNumber} - preview mode`);
      showBridgeNotice('warning', 'M360 production data adapter did not load. This page is running in local preview mode and is not the institutional record.');
      return;
    }

    const context = await M360Data.getContext();
    if (!context.authenticated) {
      const loginHref = isWeek1 ? 'index.html#/login' : '../index.html#/login';
      location.replace(loginHref);
      return;
    }
    if (!context.eligible) {
      const portalHref = isWeek1 ? 'index.html' : '../index.html';
      location.replace(portalHref);
      return;
    }

    prepareScopedCache(context.userId);

    const available = await M360Data.schemaAvailable();
    if (available) {
      try {
        const rows = await M360Data.loadOwnWeekRecords();
        const ownRow = rows.find(row => Number(row.week_number) === weekNumber) || null;
        if (ownRow) {
          writeRemoteState(rows);
        } else {
          // A missing institutional row starts blank for this authenticated
          // account. Legacy unscoped browser data is never uploaded.
          sanitizeUnverifiedLocalState();
          writeRemoteState(rows);
        }
      } catch (error) {
        console.error('M360 remote hydration failed', error);
      }
    }

    await loadOriginalScript();
    hideDemoControls();
    addCourseNavigation();
    normalizeProductionStatuses();
    renderInstructorFeedback();

    if (!available) {
      setPreviewPill(`Week ${weekNumber} - migration pending`);
      showBridgeNotice('warning', 'Authenticated M360 shell is active, but the durable M360 database migration has not been applied yet. Draft work remains local on this device until the migration is available; technical-course data is unaffected.');
      return;
    }

    setPreviewPill(`Week ${weekNumber} - authenticated M360`);
    showBridgeNotice('success', 'Authenticated M360 workspace. Supabase is the institutional record; browser storage is an account-scoped working cache only.');

    let remoteSaveTimer = null;
    const scheduleDraftSave = () => {
      clearTimeout(remoteSaveTimer);
      remoteSaveTimer = setTimeout(async () => {
        const week = localWeek(localState());
        if (!week || !week.draft) return;
        try {
          await M360Data.saveDraft(weekNumber, week.draft, schemaVersion);
          setSaveLabel('Saved to M360 at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        } catch (error) {
          console.error('M360 autosave failed', error);
          setSaveLabel('M360 save retry needed');
        }
      }, 1200);
    };

    document.querySelectorAll('[data-m360], [data-review-check], [data-integrity-check]').forEach(field => {
      field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', scheduleDraftSave);
      if (field.tagName === 'SELECT') field.addEventListener('change', scheduleDraftSave);
    });

    const saveButton = document.getElementById('saveBtn');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        setTimeout(async () => {
          const week = localWeek(localState());
          if (!week || !week.draft) return;
          try {
            await M360Data.saveDraft(weekNumber, week.draft, schemaVersion);
            setSaveLabel('Saved to M360 at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
          } catch (error) {
            console.error('M360 explicit save failed', error);
            showBridgeNotice('error', 'The browser copy was saved, but the durable M360 save did not complete. Try Save again before leaving this page.');
          }
        }, 0);
      });
    }

    const submitButton = document.getElementById('submitReviewBtn');
    if (submitButton) {
      submitButton.addEventListener('click', () => {
        setTimeout(async () => {
          const week = localWeek(localState());
          if (!week || week.status !== 'submitted' || !week.submitted) return;
          if (submitButton.dataset.remotePending === 'true') return;
          submitButton.dataset.remotePending = 'true';
          submitButton.disabled = true;
          try {
            const saved = await M360Data.submitWeek(weekNumber, week.submitted, schemaVersion);
            const state = localState();
            state.weeks[`week${weekNumber}`] = remoteToLocalWeek(saved);
            saveLocalState(state);
            normalizeProductionStatuses();
            renderInstructorFeedback();
            showBridgeNotice('success', `Week ${weekNumber} submitted to M360 for instructor review. The submitted revision is preserved separately from future draft edits.`);
          } catch (error) {
            console.error('M360 submission failed', error);
            showBridgeNotice('error', `Week ${weekNumber} is saved locally but was not submitted to the institutional record. Correct the connection issue and submit again.`);
          } finally {
            submitButton.dataset.remotePending = 'false';
            submitButton.disabled = false;
          }
        }, 0);
      });
    }
  }

  bootstrap().catch(async error => {
    console.error('M360 production bridge failed', error);
    try { await loadOriginalScript(); } catch (_) {}
    hideDemoControls();
    showBridgeNotice('error', 'M360 could not initialize its authenticated data connection. The technical LMS was not changed. Return to the Student Portal and try again.');
  });
})();

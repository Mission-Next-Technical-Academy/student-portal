// The Mission Next coach — a docked guide that turns the full simulator into
// a module-sized mini environment.
//
// Why an overlay instead of a second, smaller app: the simulator already holds
// every view a module needs. A separate "beginner build" would fork the shell,
// the nav, and the fixtures, and the two copies would drift. So the coach adds
// two things on top of the untouched app and nothing else:
//
//   1. step-by-step instructions that spotlight real elements in real views
//   2. a scope lock — while a coach runs, only its `allow` routes are reachable
//
// It hooks the app at exactly two points, both in app.js: navigate() asks
// coachAllowsRoute() before moving, and render() calls coachAfterRender().
// Everything else here is self-contained.
//
// Entry: ?coach=<id> on the simulator URL (the portal module page links that
// way). State survives reload in sessionStorage.

(function () {
  'use strict';

  const STATE_KEY = 'mnt.coach.state';
  // A coach with `resumeAcrossLaunches` also keeps one in-progress record in
  // localStorage, so relaunching it from the portal (a new tab, empty
  // sessionStorage) resumes the unfinished lab instead of starting over. One
  // slot, because those coaches share one simulator save: starting a
  // different coach replaces it. The record names the launching student (the
  // portal's anonymous id, never an email) and resumes only for that student.
  const RESUME_KEY = 'mnt.coach.resume';
  const FINISH_CONFIRM_MS = 8000;
  let state = null;           // { id, step, student? }
  let lastDeniedAt = 0;
  let finishNotice = '';      // shown in the bar when Finish wasn't confirmed
  let finishing = false;

  const coachById = id => (typeof MODULE_COACHES === 'undefined' ? [] : MODULE_COACHES)
    .find(c => c.id === id) || null;
  const activeCoach = () => (state ? coachById(state.id) : null);
  const activeStep = () => {
    const coach = activeCoach();
    return coach ? coach.steps[state.step] || null : null;
  };

  function saveState() {
    try {
      if (state) sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
      else sessionStorage.removeItem(STATE_KEY);
    } catch { /* private mode — the coach still works, it just forgets on reload */ }
    const coach = activeCoach();
    if (state && coach && coach.resumeAcrossLaunches) {
      try {
        localStorage.setItem(RESUME_KEY, JSON.stringify({ id: state.id, step: state.step, student: state.student || '' }));
      } catch { /* storage blocked — a relaunch starts fresh */ }
    }
  }

  function loadResume() {
    try { return JSON.parse(localStorage.getItem(RESUME_KEY) || 'null'); } catch { return null; }
  }

  function clearResume() {
    try { localStorage.removeItem(RESUME_KEY); } catch { /* storage blocked */ }
  }

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return coachById(parsed && parsed.id) ? parsed : null;
    } catch { return null; }
  }

  // The portal half of the app, derived the same way portal/app.js derives the
  // simulator: local development is two ports, deployment is one origin with
  // the simulator mounted under /sim/.
  function portalUrl(hash, completionToken) {
    const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
    const base = local
      ? `${location.protocol}//${location.hostname}:8768/`
      : location.origin + location.pathname.replace(/sim\/?$/, '');
    const completion = completionToken ? `?coachComplete=${encodeURIComponent(completionToken)}` : '';
    return base + completion + (hash || '');
  }

  // Which module page "coursework" should return to, and which tour (if any)
  // belongs to this module. An active coach always knows its own module
  // directly. A coach-less launch carries it in the URL (`?module=soc-NN`,
  // the convention Module 12's capstone already uses) or, once a coach has
  // run at least once this tab session, in a session fallback — so exiting a
  // tour to free-roam doesn't lose the module context the tour icon needs to
  // offer a replay. Falls back to the program root/no-tour rather than
  // guessing when none of those are present.
  function courseworkModuleNumber() {
    const coach = activeCoach();
    if (coach) return coach.module;
    const match = new URLSearchParams(location.search).get('module');
    const fromUrl = match && /^soc-(\d+)$/.exec(match);
    if (fromUrl) return Number(fromUrl[1]);
    const fromSession = sessionStorage.getItem('mnt.coach.lastModule');
    return fromSession ? Number(fromSession) : null;
  }

  function courseworkHref() {
    const n = courseworkModuleNumber();
    return n ? portalUrl(`#/program/soc-analyst/module/${n}`) : portalUrl('#/portal');
  }

  function tourForCurrentModule() {
    const n = courseworkModuleNumber();
    return n ? (MODULE_COACHES.find(c => c.module === n && c.tour === true) || null) : null;
  }

  // A small, always-present corner dock — two on-demand actions, neither of
  // which gates anything: replay this module's guided tour, or leave back to
  // coursework. Bottom-left, opposite corner from the coach's own step bar,
  // so the two never collide. Same shell-level mechanism every module and,
  // eventually, every track's own lab surface can reuse — this is the one
  // place that knows how to get back to coursework and which tour (if any)
  // belongs to the module currently open.
  function mountCornerDock() {
    if (document.getElementById('mnt-corner-dock')) return;
    const dock = document.createElement('div');
    dock.id = 'mnt-corner-dock';
    dock.className = 'mnt-corner-dock';
    dock.innerHTML = `
      <div class="mnt-corner-progress" id="mnt-corner-progress" hidden role="status" aria-live="polite"></div>
      <button type="button" class="mnt-corner-btn mnt-tour-btn" id="mnt-tour-btn" hidden>
        <span aria-hidden="true">🧭</span> Take the tour
      </button>
      <button type="button" class="mnt-corner-btn mnt-submit-btn" id="mnt-submit-btn" hidden>
        <span aria-hidden="true">📤</span> Submit Module Lab
      </button>
      <a href="#" class="mnt-corner-btn mnt-exit-btn" id="mnt-exit-btn" title="Return to your coursework">
        <span aria-hidden="true">←</span> Coursework
      </a>`;
    document.body.appendChild(dock);
    dock.querySelector('#mnt-exit-btn').addEventListener('click', (event) => {
      event.preventDefault();
      returnToOpenerOrNavigate(courseworkHref());
    });
    dock.querySelector('#mnt-tour-btn').addEventListener('click', () => {
      const tour = tourForCurrentModule();
      if (!tour) return;
      start(tour.id);
      refreshCornerDock();
    });
    // Floating, not tied to any one page: an assigned performance case is
    // module-level work, not "the incident view's" — the analyst should be
    // free to move through the whole console (assets, hunting, the queue)
    // the way a real shift works, and still submit from wherever they are.
    dock.querySelector('#mnt-submit-btn').addEventListener('click', () => {
      if (typeof recordAssignedCaseAction === 'function') recordAssignedCaseAction('NST-2407', 'submit_for_faculty');
      if (typeof toast === 'function') toast('Submitted for faculty review — switch back to your course tab to confirm.');
    });
    refreshCornerDock();
  }

  // Glanceable-only: no labels (those live in the portal's Prove It section
  // now), just how many of the assigned case's required actions have fired
  // this session. Read from the sessionStorage set ui/app.js's
  // recordAssignedCaseAction() writes to; total must match portal/soc-
  // analyst-module-01.js's MODULE_ONE_SIMULATOR_REQUIREMENTS length.
  const NST_2407_REQUIRED_TOTAL = 8;
  function caseProgressDone(caseId) {
    try { return new Set(JSON.parse(sessionStorage.getItem(`mnt.case.progress.${caseId}`) || '[]')); }
    catch { return new Set(); }
  }

  // Re-evaluated on every render (via coachAfterRender) since whether a tour
  // is running, and which module we're on, can change without a full reload.
  function refreshCornerDock() {
    const btn = document.getElementById('mnt-tour-btn');
    if (!btn) return;
    const inCase = new URLSearchParams(location.search).get('case') === 'NST-2407';
    // A student working one assigned case doesn't need the decorative
    // cross-product app launcher or the portal-context switcher — collapse
    // them (CSS, see .case-scoped rules) so the console reads as one
    // targeted workspace instead of the full enterprise tenant shell. The
    // real per-workload nav (#sidenav) is untouched — it's already coach-
    // scope-aware (dimmed, not hidden) and genuinely useful for pivots.
    document.body.classList.toggle('case-scoped', inCase);
    const submitBtn = document.getElementById('mnt-submit-btn');
    if (submitBtn) submitBtn.hidden = !inCase;
    const progress = document.getElementById('mnt-corner-progress');
    if (progress) {
      progress.hidden = !inCase;
      if (inCase) {
        const done = caseProgressDone('NST-2407');
        const dots = Array.from({ length: NST_2407_REQUIRED_TOTAL }, (_, i) => (
          `<span class="mnt-corner-progress-dot${i < done.size ? ' is-done' : ''}"></span>`
        )).join('');
        progress.innerHTML = `<span class="mnt-corner-progress-count">${done.size}/${NST_2407_REQUIRED_TOTAL}</span><span class="mnt-corner-progress-dots">${dots}</span>`;
      }
    }
    const tour = !activeCoach() && tourForCurrentModule();
    btn.hidden = !tour;
  }

  // ---------- scope lock ----------

  // Called by navigate(). Returns false for anything outside the running
  // coach's mini environment, which is what makes this a slice of the app
  // rather than the whole console with advice on top.
  function coachAllowsRoute(hash) {
    const coach = activeCoach();
    if (!coach || !coach.allow) return true;
    if (coach.allow.includes(hash)) return true;
    // Debounced: a blocked click can fire twice through nav and hashchange.
    if (Date.now() - lastDeniedAt > 400) {
      lastDeniedAt = Date.now();
      if (typeof toast === 'function') {
        const pages = coach.allow.length === 1 ? 'the one page' : `the ${coach.allow.length} pages`;
        toast(`Module ${coach.module} lab: stay in ${pages} this lab uses. Exit the coach to explore freely.`);
      }
    }
    return false;
  }

  // Dim what the lock excludes, so the boundary is visible instead of just
  // being felt when a click does nothing.
  function applyScopeLock() {
    const coach = activeCoach();
    document.body.classList.toggle('coach-locked', Boolean(coach && coach.allow));
    document.querySelectorAll('#sidenav .navitem').forEach(li => {
      const route = li.dataset.route;
      const blocked = Boolean(coach && coach.allow && route && !coach.allow.includes(route));
      li.classList.toggle('coach-out-of-scope', blocked);
    });
  }

  // ---------- rendering ----------

  function clearSpotlight() {
    document.querySelectorAll('.coach-spotlight').forEach(el => el.classList.remove('coach-spotlight'));
    document.querySelectorAll('.coach-required').forEach(el => el.classList.remove('coach-required'));
    document.body.classList.remove('coach-focus-lock');
    const scrim = document.getElementById('coach-scrim');
    if (scrim) scrim.hidden = true;
  }

  // ---------- required-action lock ----------
  //
  // A step marked `require` is the student's to perform. The console stays
  // readable — dimmed, not hidden, so they still see what a real queue looks
  // like — but only the highlighted control answers to the mouse. Without this
  // a "click the alert" step turns into a tour of the whole console, which is
  // the capstone's freedom handed to someone in their first hour.
  function requiredStep() {
    const step = activeStep();
    return state && step && step.require && step.target ? step : null;
  }

  function applyRequiredLock() {
    const step = requiredStep();
    document.body.classList.toggle('coach-focus-lock', Boolean(step));
    const scrim = document.getElementById('coach-scrim');
    if (scrim) scrim.hidden = !step;
    if (!step) return;
    document.querySelectorAll(step.target).forEach(el => el.classList.add('coach-required'));
  }

  // Capture phase: the simulator wires most actions as inline onclick, which
  // fire at the target, so stopping the event on the way down is what actually
  // blocks them.
  function guardClick(event) {
    const step = requiredStep();
    if (!step) return;
    const node = event.target.nodeType === 1 ? event.target : event.target.parentElement;
    if (node && node.closest('.coach-required, #coach-panel, #toast, #mnt-corner-dock')) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof toast === 'function') {
      toast(step.nudge || 'This step is yours — use the highlighted control.');
    }
  }

  // Side panels open against the right edge, which is where the dock lives. When
  // a step's evidence is inside one, the dock gets out of its way instead of
  // covering the thing it just told the student to read.
  function avoidSidePanels() {
    const open = document.querySelector('.sidepanel:not(.hidden)');
    document.body.classList.toggle('coach-shift-left', Boolean(state && open));
  }

  function applySpotlight() {
    avoidSidePanels();
    clearSpotlight();
    const step = activeStep();
    if (!step || !step.target) return;
    const targets = document.querySelectorAll(step.target);
    targets.forEach(el => el.classList.add('coach-spotlight'));
    applyRequiredLock();
    if (targets[0] && typeof targets[0].scrollIntoView === 'function') {
      targets[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function panelEl() { return document.getElementById('coach-panel'); }

  function renderSteps() {
    const coach = activeCoach();
    const step = activeStep();
    if (!step) { stop(); return; }
    panelEl().classList.add('coach-bar');
    document.body.classList.add('coach-bar-open');
    const last = state.step === coach.steps.length - 1;
    const gated = typeof step.check === 'function' && !step.check() && typeof step.do === 'function';
    const demoOnly = !step.check && typeof step.do === 'function' && !step._done;
    // A step with `check` and no `do` is the student's to perform: the coach
    // spotlights the control and waits. The button stays live rather than
    // disabled so it can answer "have I done it yet?" instead of dead-ending.
    const waiting = typeof step.check === 'function' && !step.check() && typeof step.do !== 'function';

    // One line of instruction, the dots, and a way out. The teaching text lives
    // behind "Why this matters" so the bar never competes with the console it is
    // pointing at, and an action step carries no Next button at all: doing the
    // thing is what advances it.
    const done = i => i < state.step;
    panelEl().innerHTML = `
      <div class="coach-bar-dots" role="progressbar" aria-label="Walkthrough progress"
           aria-valuemin="1" aria-valuemax="${coach.steps.length}" aria-valuenow="${state.step + 1}">
        ${coach.steps.map((_, i) => `<span class="${done(i) ? 'done' : i === state.step ? 'on' : ''}"></span>`).join('')}
      </div>
      <div class="coach-bar-main">
        <p class="coach-bar-kicker">Module ${String(coach.module).padStart(2, '0')} · step ${state.step + 1} of ${coach.steps.length}${
          waiting ? ' · your move' : ''}</p>
        <p class="coach-bar-instruction">${step.instruction || step.title}</p>
        ${step.body ? `<details class="coach-bar-why"><summary>Why this matters</summary><p>${step.body}</p></details>` : ''}
        ${last && finishNotice ? `<p class="coach-bar-alert" role="alert">${finishNotice}</p>` : ''}
      </div>
      <div class="coach-bar-actions">
        ${last && step.finish
          ? `<button class="coach-btn primary" type="button" data-coach="finish"${finishing ? ' disabled' : ''}>${
              finishing ? 'Saving…' : step.finish.label}</button>`
          : waiting
            ? `<span class="coach-bar-waiting"><i class="coach-bar-pulse" aria-hidden="true"></i>${
                step.waitLabel || 'Waiting for you'}</span>`
            : `<button class="coach-btn primary" type="button" data-coach="next">${
                gated || demoOnly ? step.actionLabel || 'Show me'
                  : (last ? 'Finish' : step.continueLabel || 'Continue')}</button>`}
      </div>`;
    watchForStepCompletion();
  }

  // A step the student performs advances itself. The console re-renders on most
  // actions, but a side panel opening does not always come back through
  // render(), so the check is also polled while such a step is on screen.
  let completionTimer = 0;
  function watchForStepCompletion() {
    clearInterval(completionTimer);
    const step = activeStep();
    if (!state || !step || typeof step.check !== 'function' || typeof step.do === 'function') return;
    completionTimer = setInterval(() => {
      const current = activeStep();
      if (!state || !current || typeof current.check !== 'function') { clearInterval(completionTimer); return; }
      if (!current.check()) return;
      clearInterval(completionTimer);
      const dots = panelEl().querySelectorAll('.coach-bar-dots span');
      if (dots[state.step]) dots[state.step].className = 'done';
      const waitingLabel = panelEl().querySelector('.coach-bar-waiting');
      if (waitingLabel) waitingLabel.innerHTML = '<i class="coach-bar-tick" aria-hidden="true">✓</i>Done';
      setTimeout(() => {
        if (!state) return;
        if (state.step >= activeCoach().steps.length - 1) { renderPanel(); return; }
        goToStep(state.step + 1);
      }, 650);
    }, 300);
  }

  function renderPanel() {
    if (!panelEl()) return;
    const open = Boolean(state);
    panelEl().hidden = !open;
    if (!open) return;
    renderSteps();
  }

  // ---------- step flow ----------

  function goToStep(index) {
    const coach = activeCoach();
    if (!coach) return;
    state.step = Math.max(0, Math.min(index, coach.steps.length - 1));
    saveState();
    const step = activeStep();
    if (state.step === coach.steps.length - 1) reportCompletion();
    if (step.route && location.hash !== step.route) {
      if (typeof hidePanels === 'function') hidePanels();
      navigate(step.route);           // render() calls back into coachAfterRender
    } else {
      renderPanel();
      setTimeout(applySpotlight, 30);
    }
  }

  function next() {
    const coach = activeCoach();
    const step = activeStep();
    if (!coach || !step) return;

    // A step the student must perform holds the coach here until they have.
    const gated = typeof step.check === 'function' && !step.check();
    const demoOnly = !step.check && typeof step.do === 'function' && !step._done;
    if (gated && typeof step.do !== 'function') {
      if (typeof toast === 'function') toast(step.nudge || 'Not yet — follow the highlighted control, then press again.');
      renderPanel();
      setTimeout(applySpotlight, 60);
      return;
    }
    if ((gated || demoOnly) && typeof step.do === 'function') {
      step._done = true;
      step.do();
      renderPanel();
      setTimeout(applySpotlight, 60);
      return;
    }
    if (state.step >= coach.steps.length - 1) { stop(); return; }
    goToStep(state.step + 1);
  }

  // A tab holding an older cached copy of views.js has no view for a route a
  // newer coach script points at, and the student just sees "Page not found".
  // Detect it before the first step instead, and offer the one fix that works.
  function missingRoutes(coach) {
    if (typeof VIEWS === 'undefined') return [];
    return [...new Set(coach.steps.map(s => s.route).filter(Boolean))]
      .filter(route => !VIEWS[route.replace(/^#\//, '')]);
  }

  function renderStale(coach, missing) {
    panelEl().hidden = false;
    panelEl().innerHTML = `
      <div class="coach-head">
        <div>
          <div class="coach-kicker">Module ${String(coach.module).padStart(2, '0')}</div>
          <h2>This tab is running an older console</h2>
        </div>
      </div>
      <div class="coach-body">
        <p>The walkthrough needs ${missing.length} page${missing.length === 1 ? '' : 's'} this tab has not loaded
        (${missing.map(r => `<code>${r}</code>`).join(', ')}). That happens when the browser reuses a cached copy
        after the console is updated. Reloading fetches the current one.</p>
      </div>
      <div class="coach-foot">
        <button class="coach-btn primary" type="button" data-coach="refresh">Reload the console</button>
      </div>`;
  }

  // A plain reload can be answered from cache again. A one-off query parameter
  // cannot be, so the document — and the versioned scripts it names — come from
  // the server.
  function hardReload() {
    const params = new URLSearchParams(location.search);
    params.set('_v', String(Date.now()));
    location.replace(`${location.pathname}?${params.toString()}${location.hash}`);
  }

  function start(id, student) {
    const coach = coachById(id);
    if (!coach) return;
    const missing = missingRoutes(coach);
    if (missing.length) { renderStale(coach, missing); return; }
    coach.steps.forEach(s => { s._done = false; });
    state = coach.resumeAcrossLaunches ? { id, step: 0, student: student || '' } : { id, step: 0 };
    saveState();
    try { sessionStorage.setItem('mnt.coach.lastModule', String(coach.module)); } catch { /* private mode */ }
    goToStep(0);
    applyScopeLock();
  }

  function stop() {
    const coach = activeCoach();
    state = null;
    saveState();
    clearInterval(completionTimer);
    panelEl().classList.remove('coach-bar');
    document.body.classList.remove('coach-bar-open');
    clearSpotlight();
    applyScopeLock();
    renderPanel();
    refreshCornerDock();
    if (coach && typeof toast === 'function') {
      toast('Coach closed — the full console is available again.');
    }
  }

  // Coaches without a work collector can report completion when the learner
  // reaches the last step. A collector coach waits for its explicit Finish
  // action so the completion record includes the final state of the work.
  let reportedToken = '';
  function reportCompletion() {
    const coach = activeCoach();
    if (!coach || !coach.completionToken || reportedToken === coach.completionToken) return;
    // Help Desk guided labs provide a collectWork() snapshot. Reaching the
    // final instruction can happen before its required action (for example,
    // adding the final note) is complete, so let the explicit Finish action
    // below send the only completion message and capture the final state.
    if (typeof coach.collectWork === 'function') return;
    if (!window.opener || window.opener.closed) return;
    reportedToken = coach.completionToken;
    window.opener.postMessage({ type: 'mnt-coach-complete', id: coach.completionToken }, new URL(portalUrl('')).origin);
  }

  // The simulator opens as a popup (window.open from the module page), so
  // "go back" means returning focus to that opener tab and closing this one
  // — not just changing this window's own location — whenever an opener is
  // still around. Falls back to navigating this tab when it isn't (e.g. a
  // bookmarked/direct simulator URL with no opener).
  function returnToOpenerOrNavigate(href) {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      setTimeout(() => { if (!window.closed) window.location.href = href; }, 250);
      window.close();
      return;
    }
    window.location.href = href;
  }

  function finish() {
    const coach = activeCoach();
    const step = activeStep();
    const href = (step && step.finish && step.finish.href)
      || portalUrl(`#/program/soc-analyst/module/${coach ? coach.module : 1}`, coach && coach.completionToken);
    const completionToken = coach && coach.completionToken;
    if (coach && coach.resumeAcrossLaunches && completionToken) { finishWithReceipt(coach, href); return; }
    stop();
    if (completionToken && window.opener && !window.opener.closed) {
      const work = coach && typeof coach.collectWork === 'function' ? coach.collectWork() : undefined;
      window.opener.postMessage({ type: 'mnt-coach-complete', id: completionToken, ...(work ? { work } : {}) }, new URL(href).origin);
    }
    returnToOpenerOrNavigate(href);
  }

  // A resumable coach's work exists only in this browser until the portal
  // stores it, so its Finish asks the portal tab to confirm the save. Only a
  // confirmed save ends the lab and drops the in-progress record; otherwise
  // the coach stays on its last step with the work intact.
  const FINISH_NOTICES = {
    closed: 'Your course page is closed, so this lab couldn’t be saved. Your work is still here. Open your course page and click the walkthrough button for this lab to continue, then press Finish.',
    'other-student': 'Your course page is signed in as a different student, so this lab wasn’t saved. Your work is still here. Sign in as yourself on your course page, then press Finish again.',
    'no-student': 'This lab was opened from an older copy of your course page, so it can’t be saved from here. Your work is still here. Reload your course page, click the walkthrough button for this lab, then press Finish.',
    unconfirmed: 'Your course page didn’t confirm it saved this lab. Your work is still here. Make sure you’re signed in on your course page, then press Finish again.',
  };

  function finishWithReceipt(coach, href) {
    if (finishing) return;
    const opener = window.opener && !window.opener.closed ? window.opener : null;
    if (!opener) { showFinishNotice(FINISH_NOTICES.closed); return; }
    // The portal saves only work whose launch named the signed-in student.
    if (!state.student) { showFinishNotice(FINISH_NOTICES['no-student']); return; }
    const origin = new URL(href).origin;
    const nonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    const work = typeof coach.collectWork === 'function' ? coach.collectWork() : undefined;
    let timer = 0;
    const settle = (saved, reason) => {
      clearTimeout(timer);
      window.removeEventListener('message', onReply);
      finishing = false;
      if (!saved) {
        showFinishNotice(FINISH_NOTICES[reason] || FINISH_NOTICES.unconfirmed);
        return;
      }
      finishNotice = '';
      clearResume();
      stop();
      returnToOpenerOrNavigate(href);
    };
    function onReply(event) {
      const data = event.data;
      if (event.source !== opener || event.origin !== origin) return;
      if (!data || data.type !== 'mnt-coach-received' || data.id !== coach.completionToken || data.nonce !== nonce) return;
      settle(data.saved === true, data.reason);
    }
    finishing = true;
    finishNotice = '';
    renderPanel();
    window.addEventListener('message', onReply);
    timer = setTimeout(() => settle(false), FINISH_CONFIRM_MS);
    opener.postMessage({ type: 'mnt-coach-complete', id: coach.completionToken, nonce, student: state.student, ...(work ? { work } : {}) }, origin);
  }

  function showFinishNotice(text) {
    finishNotice = text;
    renderPanel();
  }

  // The simulator's own "Reset shift" discards the work a coach is built on,
  // so it also ends the running coach and forgets the in-progress record.
  function forgetProgress() {
    clearResume();
    if (state) stop();
  }

  // ---------- mount ----------

  function mount() {
    mountCornerDock();
    if (panelEl()) return;

    const scrim = document.createElement('div');
    scrim.id = 'coach-scrim';
    scrim.hidden = true;
    document.body.appendChild(scrim);
    document.addEventListener('click', guardClick, true);

    const panel = document.createElement('aside');
    panel.id = 'coach-panel';
    panel.className = 'coach-panel';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    panel.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-coach]');
      if (!btn) return;
      const action = btn.dataset.coach;
      if (action === 'next') next();
      if (action === 'finish') finish();
      if (action === 'refresh') hardReload();
    });

    document.body.appendChild(panel);

    // Panels open and close through several paths (row clicks, ✕, the scrim),
    // none of which re-render. One deferred check per click keeps the dock's
    // position honest without polling.
    document.addEventListener('click', () => setTimeout(avoidSidePanels, 60), true);
  }

  // Called at the end of every render(): the DOM the previous step pointed at
  // has just been replaced, so the spotlight and the scope lock are reapplied.
  function coachAfterRender() {
    // The back button and direct hash edits never pass through navigate(), so
    // the lock is re-checked here too and bounces back to the current step.
    const coach = activeCoach();
    const step = activeStep();
    if (coach && coach.allow && step && step.route
        && !coach.allow.includes(location.hash || '')) {
      navigate(step.route);
      return;
    }
    applyScopeLock();
    renderPanel();
    refreshCornerDock();
    if (state) setTimeout(applySpotlight, 30);
  }

  // `restart` and `student` describe one launch from the portal. Left in the
  // address bar, a reload would count as a new launch and wipe the lab.
  function stripLaunchParams() {
    const search = new URLSearchParams(location.search);
    if (!search.has('restart') && !search.has('student')) return;
    search.delete('restart');
    search.delete('student');
    const query = search.toString();
    try { history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`); } catch { /* sandboxed */ }
  }

  // A relaunch opens on the coach's home page, but the saved step may live on
  // another page that only an earlier step routes to.
  function resumeAt(index) {
    const coach = activeCoach();
    const route = coach.steps.slice(0, index + 1).map(s => s.route).filter(Boolean).pop();
    if (route && location.hash !== route && !coach.steps[index].route) navigate(route);
    goToStep(index);
  }

  function boot() {
    mount();
    const search = new URLSearchParams(location.search);
    // A Help Desk Prove It runs with no coach at all, not even one saved
    // earlier in this tab, and keeps its launch parameters.
    if (search.has('prove')) return;
    const requested = search.get('coach');
    const restart = search.get('restart') === '1';
    const student = search.get('student') || '';
    stripLaunchParams();
    const restored = loadState();
    if (requested && coachById(requested)) {
      const requestedCoach = coachById(requested);
      const resume = requestedCoach.resumeAcrossLaunches ? loadResume() : null;
      if (!restart && restored && restored.id === requested) {
        state = restored;
        saveState();
        goToStep(state.step);
      } else if (resume && resume.id === requested && student && (resume.student === student || !resume.student)) {
        // A record with no student came from a tab opened by an older course
        // page that couldn't name one; the next launch of the same lab from a
        // current page claims it, so that work can still be saved.
        state = { id: requested, step: Number(resume.step) || 0, student };
        saveState();
        resumeAt(Math.max(0, Math.min(state.step, requestedCoach.steps.length - 1)));
      } else {
        if ((restart || requestedCoach.resumeAcrossLaunches) && typeof requestedCoach.resetState === 'function') {
          requestedCoach.resetState();
        }
        start(requested, student);
      }
    } else if (restored) {
      state = restored;
      goToStep(state.step);
    }
    coachAfterRender();
  }

  window.coachAllowsRoute = coachAllowsRoute;
  window.coachAfterRender = coachAfterRender;
  window.startModuleCoach = start;
  window.stopModuleCoach = stop;
  window.forgetModuleCoachProgress = forgetProgress;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

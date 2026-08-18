// The Mission Next coach — a floating guide that turns the full simulator into
// a module-sized mini environment.
//
// Why an overlay instead of a second, smaller app: the simulator already holds
// every view a module needs. A separate "beginner build" would fork the shell,
// the nav, and the fixtures, and the two copies would drift. So the coach adds
// three things on top of the untouched app and nothing else:
//
//   1. a persistent badge (bottom right) that starts and reopens the guide
//   2. step-by-step instructions that spotlight real elements in real views
//   3. a scope lock — while a coach runs, only its `allow` routes are reachable
//
// It hooks the app at exactly two points, both in app.js: navigate() asks
// coachAllowsRoute() before moving, and render() calls coachAfterRender().
// Everything else here is self-contained.
//
// Entry: ?coach=<id> on the simulator URL (the portal module page links that
// way), or the badge's own picker. State survives reload in sessionStorage.

(function () {
  'use strict';

  const STATE_KEY = 'mnt.coach.state';
  let state = null;           // { id, step, open }
  let lastDeniedAt = 0;

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
    if (targets[0] && typeof targets[0].scrollIntoView === 'function') {
      targets[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function badgeEl() { return document.getElementById('coach-badge'); }
  function panelEl() { return document.getElementById('coach-panel'); }

  function renderBadge() {
    const badge = badgeEl();
    if (!badge) return;
    const coach = activeCoach();
    badge.classList.toggle('is-active', Boolean(coach));
    const counter = badge.querySelector('.coach-badge-step');
    if (coach) {
      counter.hidden = false;
      counter.textContent = `${state.step + 1}/${coach.steps.length}`;
      badge.setAttribute('aria-label', `${coach.name} — step ${state.step + 1} of ${coach.steps.length}`);
    } else {
      counter.hidden = true;
      badge.setAttribute('aria-label', 'Mission Next coach — guided module labs');
    }
  }

  function renderPicker() {
    const list = (typeof MODULE_COACHES === 'undefined' ? [] : MODULE_COACHES);
    panelEl().innerHTML = `
      <div class="coach-head">
        <div>
          <div class="coach-kicker">Mission Next coach</div>
          <h2>Guided module labs</h2>
        </div>
        <button class="coach-x" type="button" data-coach="close" aria-label="Close coach">✕</button>
      </div>
      <div class="coach-body">
        <p class="coach-intro">Pick a module. The coach walks you to the data the lab needs and keeps you inside the pages that lab uses.</p>
        ${list.map(c => `
          <button class="coach-pick" type="button" data-coach="start" data-id="${c.id}">
            <span class="coach-pick-name">Module ${String(c.module).padStart(2, '0')} · ${c.name}</span>
            <span class="coach-pick-role">Your role: ${c.role}</span>
            <span class="coach-pick-summary">${c.summary}</span>
          </button>`).join('')}
      </div>`;
  }

  function renderSteps() {
    const coach = activeCoach();
    const step = activeStep();
    if (!step) { stop(); return; }
    const last = state.step === coach.steps.length - 1;
    const gated = typeof step.check === 'function' && !step.check() && typeof step.do === 'function';
    const demoOnly = !step.check && typeof step.do === 'function' && !step._done;

    panelEl().innerHTML = `
      <div class="coach-head">
        <div>
          <div class="coach-kicker">Module ${String(coach.module).padStart(2, '0')} · step ${state.step + 1} of ${coach.steps.length}</div>
          <h2>${step.title}</h2>
        </div>
        <button class="coach-x" type="button" data-coach="close" aria-label="Minimize coach">✕</button>
      </div>
      <div class="coach-body">
        <p>${step.body}</p>
        <div class="coach-progress" role="presentation">
          ${coach.steps.map((_, i) => `<span class="${i <= state.step ? 'on' : ''}"></span>`).join('')}
        </div>
      </div>
      <div class="coach-foot">
        <button class="coach-btn ghost" type="button" data-coach="prev" ${state.step === 0 ? 'disabled' : ''}>Back</button>
        ${last && step.finish
          ? `<button class="coach-btn primary" type="button" data-coach="finish">${step.finish.label}</button>`
          : `<button class="coach-btn primary" type="button" data-coach="next">${
              gated || demoOnly ? step.actionLabel || 'Show me' : (last ? 'Finish' : 'Next')}</button>`}
        <button class="coach-btn ghost" type="button" data-coach="exit">Exit lab</button>
      </div>`;
  }

  function renderPanel() {
    if (!panelEl()) return;
    const open = Boolean(state && state.open) || (!state && panelEl().dataset.picker === 'open');
    panelEl().hidden = !open;
    if (!open) return;
    if (state) renderSteps(); else renderPicker();
  }

  // ---------- step flow ----------

  function goToStep(index) {
    const coach = activeCoach();
    if (!coach) return;
    state.step = Math.max(0, Math.min(index, coach.steps.length - 1));
    saveState();
    const step = activeStep();
    if (step.route && location.hash !== step.route) {
      if (typeof hidePanels === 'function') hidePanels();
      navigate(step.route);           // render() calls back into coachAfterRender
    } else {
      renderPanel();
      renderBadge();
      setTimeout(applySpotlight, 30);
    }
  }

  function next() {
    const coach = activeCoach();
    const step = activeStep();
    if (!coach || !step) return;

    // A step with `do` demonstrates itself first; the second press advances.
    const gated = typeof step.check === 'function' && !step.check();
    const demoOnly = !step.check && typeof step.do === 'function' && !step._done;
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

  function start(id) {
    const coach = coachById(id);
    if (!coach) return;
    const missing = missingRoutes(coach);
    if (missing.length) { renderStale(coach, missing); renderBadge(); return; }
    coach.steps.forEach(s => { s._done = false; });
    state = { id, step: 0, open: true };
    saveState();
    panelEl().dataset.picker = '';
    goToStep(0);
    applyScopeLock();
  }

  function stop() {
    const coach = activeCoach();
    state = null;
    saveState();
    clearSpotlight();
    applyScopeLock();
    renderBadge();
    renderPanel();
    if (coach && typeof toast === 'function') {
      toast('Coach closed — the full console is available again.');
    }
  }

  function finish() {
    const coach = activeCoach();
    const step = activeStep();
    const href = (step && step.finish && step.finish.href)
      || portalUrl(`#/program/soc-analyst/module/${coach ? coach.module : 1}`, coach && coach.completionToken);
    const completionToken = coach && coach.completionToken;
    stop();
    if (completionToken && window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'mnt-coach-complete', id: completionToken }, new URL(href).origin);
      window.opener.focus();
      setTimeout(() => { if (!window.closed) window.location.href = href; }, 250);
      window.close();
      return;
    }
    window.location.href = href;
  }

  function togglePanel() {
    if (state) {
      state.open = !state.open;
      saveState();
    } else {
      panelEl().dataset.picker = panelEl().dataset.picker === 'open' ? '' : 'open';
    }
    renderPanel();
    if (state && state.open) setTimeout(applySpotlight, 30);
  }

  // ---------- mount ----------

  function mount() {
    if (badgeEl()) return;

    const badge = document.createElement('button');
    badge.id = 'coach-badge';
    badge.type = 'button';
    badge.className = 'coach-badge';
    badge.innerHTML = `
      <img src="assets/mission-next-logo.png" alt="" aria-hidden="true" />
      <span class="coach-badge-step" hidden></span>`;
    badge.addEventListener('click', togglePanel);

    const panel = document.createElement('aside');
    panel.id = 'coach-panel';
    panel.className = 'coach-panel';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    panel.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-coach]');
      if (!btn) return;
      const action = btn.dataset.coach;
      if (action === 'start') start(btn.dataset.id);
      if (action === 'next') next();
      if (action === 'prev') goToStep(state.step - 1);
      if (action === 'close') togglePanel();
      if (action === 'exit') stop();
      if (action === 'finish') finish();
      if (action === 'refresh') hardReload();
    });

    document.body.appendChild(panel);
    document.body.appendChild(badge);

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
    renderBadge();
    renderPanel();
    if (state && state.open) setTimeout(applySpotlight, 30);
  }

  function boot() {
    mount();
    const search = new URLSearchParams(location.search);
    const requested = search.get('coach');
    const restart = search.get('restart') === '1';
    const restored = loadState();
    if (requested && coachById(requested)) {
      if (!restart && restored && restored.id === requested) {
        state = restored;
        state.open = true;
        saveState();
        goToStep(state.step);
      } else {
        start(requested);
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

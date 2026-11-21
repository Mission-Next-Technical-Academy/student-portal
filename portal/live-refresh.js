/* Live refresh: one shared mechanism that keeps an open portal view current
 * without a manual reload (owner request, UAT 2026-10-17: "globally..for
 * everyone").
 *
 * The portal does not use Supabase Realtime, so each view opts in with a
 * cheap `probe` that reads only what would change its screen and returns a
 * snapshot `{ signature, pending, ...data }`. The controller:
 *   - polls the active watch while the tab is visible (interval per view,
 *     optionally a function of the latest snapshot), and probes at once when
 *     the tab becomes visible again or the window regains focus;
 *   - stops on hidden tabs, on stop() (sign-out, login screen) and whenever a
 *     new route replaces the watch;
 *   - calls `apply` only when the signature actually changed;
 *   - never applies while the person is busy: a focused editable field
 *     ('typing'), an open dialog ('typing'), or any field whose value differs
 *     from what the page rendered, e.g. an unsent instructor note
 *     ('draft'). A deferred change is retried on the next tick and when focus
 *     leaves a field, and the view's `onDeferred` can show a notice.
 *
 * A view can also opt out of automatic apply (`autoApply: false`, used for
 * module and lab pages so a running lab is never rebuilt under the learner)
 * and offer the update through `onDeferred` instead.
 *
 * Plain script (window.LiveRefresh) and CommonJS (tests). No side effects at
 * load time. */
(function (root) {
  'use strict';

  const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week']);

  function isEditableElement(el) {
    if (!el || !el.tagName) return false;
    const tag = String(el.tagName).toUpperCase();
    if (tag === 'TEXTAREA') return !el.disabled && !el.readOnly;
    if (tag === 'INPUT') return TEXT_INPUT_TYPES.has(String(el.type || '').toLowerCase()) && !el.disabled && !el.readOnly;
    if (tag === 'SELECT') return !el.disabled;
    return el.isContentEditable === true;
  }

  // A field differs from what the page rendered: unsaved work. Checkboxes and
  // radios count too (a half-made selection). Fields marked
  // data-live-refresh-ignore are throwaway UI (e.g. a table filter).
  function isDirtyField(el) {
    if (!el || el.disabled) return false;
    if (el.closest && el.closest('[data-live-refresh-ignore]')) return false;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return el.value !== el.defaultValue;
    if (tag !== 'INPUT') return false;
    const type = String(el.type || '').toLowerCase();
    if (type === 'checkbox' || type === 'radio') return el.checked !== el.defaultChecked;
    if (!TEXT_INPUT_TYPES.has(type)) return false;
    return el.value !== el.defaultValue;
  }

  /* 'draft' (unsaved input or an explicit hold: never replace the DOM),
   * 'typing' (focus is in a field or a dialog is open: wait), or null. */
  function busyState(doc) {
    if (!doc || typeof doc.querySelectorAll !== 'function') return null;
    if (doc.querySelector && doc.querySelector('[data-live-refresh-hold]')) return 'draft';
    const fields = Array.from(doc.querySelectorAll('textarea, input') || []);
    if (fields.some(isDirtyField)) return 'draft';
    if (isEditableElement(doc.activeElement)) return 'typing';
    if (doc.querySelector && doc.querySelector('[aria-modal="true"]')) return 'typing';
    return null;
  }

  // Order-independent JSON so equal data always yields an equal signature.
  function stableSignature(value) {
    const normalize = (v) => {
      if (Array.isArray(v)) return v.map(normalize);
      if (v instanceof Set) return Array.from(v).map(normalize).sort();
      if (v && typeof v === 'object') {
        return Object.keys(v).sort().reduce((out, key) => {
          if (v[key] !== undefined) out[key] = normalize(v[key]);
          return out;
        }, {});
      }
      return v;
    };
    return JSON.stringify(normalize(value));
  }

  /* View-state helpers for an in-place re-render: keep scroll and which
   * disclosures were open, so an update never throws the reader back to the
   * top or collapses what they had open. */
  function detailsKey(details) {
    if (details.id) return `#${details.id}`;
    const summary = details.querySelector && details.querySelector('summary');
    const text = summary ? String(summary.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) : '';
    return text ? `summary:${text}` : null;
  }

  function captureView(container, win) {
    const open = {};
    Array.from((container && container.querySelectorAll && container.querySelectorAll('details')) || []).forEach((details) => {
      const key = detailsKey(details);
      if (key && !(key in open)) open[key] = !!details.open;
    });
    return {
      scrollX: (win && (win.scrollX || win.pageXOffset)) || 0,
      scrollY: (win && (win.scrollY || win.pageYOffset)) || 0,
      open,
    };
  }

  function restoreView(container, win, view) {
    if (!view) return;
    const seen = new Set();
    Array.from((container && container.querySelectorAll && container.querySelectorAll('details')) || []).forEach((details) => {
      const key = detailsKey(details);
      if (!key || seen.has(key) || !(key in view.open)) return;
      seen.add(key);
      if (details.open !== view.open[key]) details.open = view.open[key];
    });
    if (win && typeof win.scrollTo === 'function') win.scrollTo(view.scrollX, view.scrollY);
  }

  /* Small, non-blocking notice (bottom corner, polite live region). One at
   * a time; an action button only when the view supplies one. */
  const NOTICE_ID = 'mnt-live-refresh-notice';

  function hideNotice(doc) {
    const el = doc && doc.getElementById && doc.getElementById(NOTICE_ID);
    if (el && el.remove) el.remove();
  }

  function showNotice(doc, { message, actionLabel = null, onAction = null, autoHideMs = 0, setTimer = null } = {}) {
    if (!doc || !doc.body || !doc.createElement) return null;
    hideNotice(doc);
    const box = doc.createElement('div');
    box.id = NOTICE_ID;
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.style.zIndex = '1000';
    box.className = 'fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm rounded-xl border border-[#1e3a5f]/20 bg-white px-4 py-3 shadow-lg text-[#1e3a5f]';
    const text = doc.createElement('p');
    text.className = 'text-sm font-medium leading-snug';
    text.textContent = message;
    const row = doc.createElement('div');
    row.className = 'mt-2 flex items-center justify-end gap-2';
    if (actionLabel && typeof onAction === 'function') {
      const action = doc.createElement('button');
      action.type = 'button';
      action.className = 'rounded-lg bg-[#1e3a5f] hover:bg-[#16324a] px-3 py-1.5 text-xs font-semibold text-white';
      action.textContent = actionLabel;
      action.setAttribute('data-live-refresh-action', '');
      action.addEventListener('click', () => { hideNotice(doc); onAction(); });
      row.appendChild(action);
    }
    const dismiss = doc.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100';
    dismiss.textContent = 'Dismiss';
    dismiss.setAttribute('aria-label', 'Dismiss update notice');
    dismiss.addEventListener('click', () => hideNotice(doc));
    row.appendChild(dismiss);
    box.appendChild(text);
    box.appendChild(row);
    doc.body.appendChild(box);
    if (autoHideMs > 0 && typeof setTimer === 'function') {
      setTimer(() => { if (doc.getElementById(NOTICE_ID) === box) hideNotice(doc); }, autoHideMs);
    }
    return box;
  }

  /* env: { win, doc, setTimer, clearTimer, now, minGapMs } — injectable so
   * tests drive time and visibility directly. */
  function create(env = {}) {
    const win = env.win || null;
    const doc = env.doc || null;
    const setTimer = env.setTimer || ((fn, ms) => setTimeout(fn, ms));
    const clearTimer = env.clearTimer || ((id) => clearTimeout(id));
    const now = env.now || (() => Date.now());
    const minGapMs = env.minGapMs == null ? 5000 : env.minGapMs;

    let watchSpec = null;
    let token = 0;
    let timer = null;
    let baseline = null;
    let pendingChange = null;
    let inFlight = null; // token of the probe in flight; a new watch may probe at once
    let lastProbeAt = 0;
    let carry = null; // { key, snapshot } handed from apply() to the re-render's watch()
    let lastDeferred = null; // `${signature}|${reason}` last passed to onDeferred
    let listening = false;

    const isHidden = () => !!(doc && doc.visibilityState === 'hidden');

    function clearSchedule() {
      if (timer !== null) clearTimer(timer);
      timer = null;
    }

    function intervalFor(snapshot) {
      const interval = watchSpec && watchSpec.intervalMs;
      const ms = typeof interval === 'function' ? interval(snapshot) : interval;
      return Number(ms) > 0 ? Number(ms) : 60000;
    }

    function schedule() {
      clearSchedule();
      if (!watchSpec || isHidden()) return;
      const myToken = token;
      timer = setTimer(() => { timer = null; if (myToken === token) check(); }, intervalFor(baseline));
    }

    function busyNow() {
      if (watchSpec && typeof watchSpec.isBusy === 'function') return watchSpec.isBusy();
      return busyState(doc);
    }

    async function applyChange(change, { forced = false } = {}) {
      const spec = watchSpec;
      if (!spec) return false;
      pendingChange = null;
      lastDeferred = null;
      baseline = change.next;
      carry = { key: spec.key, snapshot: change.next };
      try {
        await spec.apply(change, { forced });
      } catch (err) {
        if (typeof console !== 'undefined') console.error('live refresh apply failed', err);
      }
      // The re-render normally re-registers the same watch and consumes
      // `carry`; if it did not (no-op apply), drop it so it cannot leak into
      // a later navigation.
      if (carry && carry.snapshot === change.next) carry = null;
      return true;
    }

    async function tryApplyPending() {
      if (!pendingChange || !watchSpec) return false;
      const change = pendingChange;
      const relevant = typeof watchSpec.isRelevant === 'function' ? watchSpec.isRelevant(change) : true;
      if (!relevant) {
        // Nothing this screen shows: adopt the new baseline quietly.
        baseline = change.next;
        pendingChange = null;
        return false;
      }
      const auto = typeof watchSpec.autoApply === 'function' ? watchSpec.autoApply(change) : watchSpec.autoApply !== false;
      const busy = busyNow();
      if (auto && !busy) return applyChange(change);
      const reason = auto ? busy : 'manual';
      const deferredKey = `${change.next.signature}|${reason}|${busy}`;
      // Tell the view once per distinct situation, not on every tick.
      if (typeof watchSpec.onDeferred === 'function' && deferredKey !== lastDeferred) {
        lastDeferred = deferredKey;
        watchSpec.onDeferred(change, {
          reason,
          busy,
          applyNow: () => (pendingChange === change ? applyChange(change, { forced: true }) : Promise.resolve(false)),
        });
      }
      return false;
    }

    async function check() {
      if (!watchSpec || inFlight === token || isHidden()) return false;
      const spec = watchSpec;
      const myToken = token;
      inFlight = myToken;
      lastProbeAt = now();
      let snapshot = null;
      try {
        snapshot = await spec.probe();
      } catch (err) {
        if (typeof console !== 'undefined') console.error('live refresh probe failed', err);
        snapshot = null;
      } finally {
        if (inFlight === myToken) inFlight = null;
      }
      if (myToken !== token || watchSpec !== spec) return false; // route changed meanwhile
      if (!snapshot) { schedule(); return false; }
      if (!baseline) {
        baseline = snapshot;
        schedule();
        return false;
      }
      let applied = false;
      if (snapshot.signature !== baseline.signature) {
        const previous = pendingChange ? pendingChange.previous : baseline;
        pendingChange = { previous, next: snapshot };
        applied = await tryApplyPending();
      } else if (pendingChange) {
        applied = await tryApplyPending();
      }
      if (myToken === token) schedule();
      return applied;
    }

    function wake() {
      if (!watchSpec || isHidden()) return;
      if (pendingChange && inFlight !== token) { tryApplyPending(); }
      if (now() - lastProbeAt >= minGapMs) check();
      else schedule();
    }

    function onVisibility() {
      if (isHidden()) clearSchedule();
      else wake();
    }

    function onFocusOut() {
      // A deferred update may proceed once the person leaves the field.
      if (!pendingChange || !watchSpec) return;
      setTimer(() => { if (pendingChange) tryApplyPending(); }, 0);
    }

    function listen() {
      if (listening) return;
      listening = true;
      if (doc && doc.addEventListener) {
        doc.addEventListener('visibilitychange', onVisibility);
        doc.addEventListener('focusout', onFocusOut);
      }
      if (win && win.addEventListener) win.addEventListener('focus', wake);
    }

    /* spec: { key, probe, apply, intervalMs, isBusy?, autoApply?, isRelevant?, onDeferred? } */
    function watch(spec) {
      if (!spec || typeof spec.probe !== 'function' || typeof spec.apply !== 'function') throw new Error('LiveRefresh.watch needs probe and apply');
      listen();
      clearSchedule();
      token += 1;
      watchSpec = spec;
      pendingChange = null;
      lastDeferred = null;
      if (carry && carry.key === spec.key) {
        baseline = carry.snapshot;
        carry = null;
        schedule();
        return;
      }
      carry = null;
      baseline = null;
      hideNotice(doc); // a fresh render already shows current data
      check(); // first probe only records the baseline
    }

    function stop() {
      clearSchedule();
      token += 1;
      watchSpec = null;
      baseline = null;
      pendingChange = null;
      carry = null;
      lastDeferred = null;
      hideNotice(doc);
    }

    return {
      watch,
      stop,
      check,
      wake,
      get active() { return !!watchSpec; },
      get key() { return watchSpec ? watchSpec.key : null; },
      get scheduled() { return timer !== null; },
      get baseline() { return baseline; },
      get pendingChange() { return pendingChange; },
    };
  }

  const api = { create, busyState, isDirtyField, isEditableElement, stableSignature, captureView, restoreView, showNotice, hideNotice };
  root.LiveRefresh = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Prove It stays locked until the module's Guided Lab is submitted.
 *
 * Owner rule (live UAT, 2026-10-05): a learner practices before proving.  The
 * Assessment Lab card keeps its heading, but its body is replaced by a lock
 * notice that points back to the Guided Lab.
 *
 * Platform-owned and DOM-driven, like lab-maximize.js: each module registers
 * its rail sections getter (registerModuleLab({ sections })), and this script
 * re-reads it after every render.  Modules re-render parts of their surface
 * without rebuilding the page, so submitting the Guided Lab ticket unlocks the
 * card at once, with no reload.
 *
 * Never locks work a learner already has: an approved module, a Prove It in
 * review or returned, or any recorded Prove It attempt for the module (older
 * accounts that proved before this rule existed).
 */
(function () {
  const GATED_PROGRAMS = new Set(['soc-analyst']);
  const LOCKED = 'prove-gate-locked';
  const HIDDEN = 'data-prove-gate-hidden';
  let scheduled = false;

  function moduleContext() {
    const match = location.hash.match(/^#\/program\/([a-z0-9-]+)\/module\/(\d+)$/);
    if (!match || !GATED_PROGRAMS.has(match[1])) return null;
    const context = typeof activeModuleRenderContext === 'function' ? activeModuleRenderContext() : null;
    if (!context || !context.def || typeof context.def.sections !== 'function') return null;
    if (context.def.program !== match[1] || Number(context.def.moduleNumber) !== Number(match[2])) return null;
    return context;
  }

  function hasProveAttempt(user, moduleKey) {
    const attempts = (user && user.latestLabAttemptByKey) || {};
    const proveKeys = typeof ADMIN_PROVE_IT_LAB_KEYS !== 'undefined' ? ADMIN_PROVE_IT_LAB_KEYS : new Set();
    const labs = typeof LABS !== 'undefined' ? LABS : [];
    return Object.keys(attempts).some((key) => proveKeys.has(key)
      && labs.some((lab) => lab.key === key && lab.module === moduleKey));
  }

  // null when nothing is gated; otherwise the Guided Lab to send the learner to.
  function gateFor(context) {
    let sections;
    try { sections = context.def.sections() || []; } catch (_) { return null; }
    const guided = sections.filter((s) => s.id === 'guided-lab' && s.gated !== false);
    const prove = sections.find((s) => s.title === 'Assessment Lab');
    if (!guided.length || !prove) return null;
    if (guided.every((s) => s.isComplete)) return null;
    if (prove.isComplete || prove.reviewState === 'review' || prove.reviewState === 'returned') return null;
    if (context.def.moduleKey === 'soc-12' || hasProveAttempt(context.user, context.def.moduleKey)) return null;
    return { guidedTarget: guided.find((s) => !s.isComplete).scrollId };
  }

  // Same card discovery as lab-maximize.js: a "Prove It" kicker followed by an <h2>.
  function proveCards() {
    const app = document.getElementById('app');
    if (!app) return [];
    const cards = [];
    app.querySelectorAll('p[class*="kicker"]').forEach((kicker) => {
      if (!/^Prove It\b/i.test((kicker.textContent || '').trim())) return;
      const title = kicker.nextElementSibling;
      if (!title || title.tagName !== 'H2') return;
      const card = kicker.closest('details') || kicker.closest('.m01-section') || kicker.closest('section');
      const heading = kicker.parentElement && kicker.parentElement.parentElement;
      if (card && heading && card.contains(heading) && !cards.some((entry) => entry.card === card)) cards.push({ card, heading });
    });
    return cards;
  }

  function bannerMarkup() {
    return '<div class="prove-gate-icon"><i class="ri-lock-line" aria-hidden="true"></i></div>'
      + '<div><p class="prove-gate-title">Submit the Guided Lab to unlock Prove It</p>'
      + '<p class="prove-gate-text">Practice It comes first. Work the Guided Lab case and submit its ticket; '
      + 'this Assessment Lab, your independent graded attempt, opens as soon as you do.</p>'
      + '<button type="button" class="prove-gate-go" data-prove-gate-go>Go to Guided Lab <i class="ri-arrow-right-line" aria-hidden="true"></i></button></div>';
  }

  function lock(card, heading, gate) {
    card.classList.add(LOCKED);
    // Hide everything in the card except the path down to its heading row.
    let node = heading;
    let top = heading;
    while (node && node !== card) {
      Array.from(node.parentElement.children).forEach((sibling) => {
        if (sibling === node || sibling.classList.contains('prove-gate-banner')) return;
        if (!sibling.hasAttribute(HIDDEN)) { sibling.setAttribute(HIDDEN, ''); sibling.inert = true; }
      });
      top = node;
      node = node.parentElement;
    }
    let banner = card.querySelector(':scope > .prove-gate-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'prove-gate-banner';
      banner.setAttribute('role', 'note');
      banner.innerHTML = bannerMarkup();
      top.after(banner);
    }
    if (banner.dataset.target !== gate.guidedTarget) banner.dataset.target = gate.guidedTarget || '';
  }

  function unlock(card) {
    card.classList.remove(LOCKED);
    card.querySelectorAll(`[${HIDDEN}]`).forEach((el) => { el.removeAttribute(HIDDEN); el.inert = false; });
    card.querySelectorAll(':scope > .prove-gate-banner').forEach((el) => el.remove());
  }

  // Module heroes render the Guided Lab status once at page load; keep it in
  // step with the same completion the gate reads, so a submit shows at once.
  function syncHeroGuidedStatus(context) {
    let sections;
    try { sections = context.def.sections() || []; } catch (_) { return; }
    const guided = sections.filter((s) => s.id === 'guided-lab');
    if (!guided.length || !guided.every((s) => s.isComplete)) return;
    document.querySelectorAll('#app .mf-stats dt').forEach((dt) => {
      if ((dt.textContent || '').trim() !== 'Guided Lab') return;
      const dd = dt.nextElementSibling;
      if (dd && dd.textContent.trim() !== 'Complete') dd.textContent = 'Complete';
    });
  }

  function sync() {
    scheduled = false;
    const context = moduleContext();
    if (context) syncHeroGuidedStatus(context);
    const gate = context ? gateFor(context) : null;
    proveCards().forEach(({ card, heading }) => (gate ? lock(card, heading, gate) : unlock(card)));
    // A card that stopped being a Prove It card (re-render) must not keep a stale lock.
    if (!gate) document.querySelectorAll(`#app .${LOCKED}`).forEach(unlock);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  function openTarget(target) {
    const card = target.closest('details');
    if (card && !card.open) card.open = true;
    const collapse = (target.closest('.m01-section') || target).querySelector('[data-m01-section-toggle][aria-expanded="false"]');
    if (collapse) collapse.click();
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  document.addEventListener('click', (event) => {
    const go = event.target.closest && event.target.closest('[data-prove-gate-go]');
    if (!go) return;
    event.preventDefault();
    const banner = go.closest('.prove-gate-banner');
    const target = banner && banner.dataset.target && document.getElementById(banner.dataset.target);
    if (target) openTarget(target);
  });

  window.addEventListener('hashchange', schedule);

  function observe() {
    const app = document.getElementById('app');
    if (!app || typeof MutationObserver !== 'function') return;
    new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe);
  else observe();
})();

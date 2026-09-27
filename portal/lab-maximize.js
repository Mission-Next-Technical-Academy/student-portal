/* Maximize / minimize for every Prove It assessment lab.
 *
 * Assessment labs render inside the module's stacked section cards, so wide
 * simulator chrome (tab strips, query toolbars, entity panes) often scrolls
 * horizontally inside a narrow card where students miss it.  This adds one
 * Maximize control to each Prove It card that pins the card over the whole
 * viewport, with a sticky Minimize bar at the top.
 *
 * It is platform-owned and DOM-driven on purpose: every module already heads
 * its assessment card with a "Prove It" kicker followed by an <h2>, so no
 * module file changes are needed and future modules are covered
 * automatically.  Any other lab card can opt in with a data-lab-maximize
 * attribute.  Modules re-render their whole surface on many actions, so
 * the maximized card is remembered by route + card position and reapplied
 * (with its scroll offset) after each re-render.
 */
(function () {
  const ACTIVE = 'lab-max-active';
  let activeKey = null;
  let activeCard = null;
  let savedScroll = 0;
  let scheduled = false;

  function proveCards() {
    const app = document.getElementById('app');
    if (!app) return [];
    const cards = [];
    app.querySelectorAll('p[class*="kicker"]').forEach((kicker) => {
      // Other lab cards (e.g. Module 12's investigation range) opt in with
      // data-lab-maximize; their first kicker + <h2> heading gets the button.
      const optIn = kicker.closest('[data-lab-maximize]');
      if (!optIn && !/^\s*Prove It\b/.test(kicker.textContent || '')) return;
      const title = kicker.nextElementSibling;
      if (!title || title.tagName !== 'H2') return;
      const card = optIn || kicker.closest('details') || kicker.closest('.m01-section') || kicker.closest('section');
      if (card && !cards.some((entry) => entry.card === card)) cards.push({ card, kicker });
    });
    return cards;
  }

  function keyFor(index) {
    return `${location.hash}::${index}`;
  }

  function buttonMarkup(maximized) {
    return maximized
      ? '<i class="ri-fullscreen-exit-line" aria-hidden="true"></i><span>Minimize</span>'
      : '<i class="ri-fullscreen-line" aria-hidden="true"></i><span>Maximize</span>';
  }

  function ensureButton(card, kicker, index) {
    if (card.querySelector(':scope [data-lab-max-toggle]')) return;
    // The heading row is the kicker's grandparent (badge · title block · toggle).
    const heading = kicker.parentElement && kicker.parentElement.parentElement;
    if (!heading || !card.contains(heading)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lab-max-btn';
    button.setAttribute('data-lab-max-toggle', String(index));
    button.innerHTML = buttonMarkup(false);
    const toggle = heading.querySelector(':scope > .mf-section-toggle, :scope > .m01-section-collapse');
    heading.insertBefore(button, toggle || null);
    heading.classList.add('lab-max-heading');
    // The sticky bar must be a direct child of the card: sticky elements only
    // stick within their parent, and a <summary>'s inner section is no taller
    // than the heading itself.
    const bar = Array.from(card.children).find((child) => child.contains(heading));
    (bar && bar.tagName === 'SUMMARY' ? bar : heading).classList.add('lab-max-bar');
  }

  function openCard(card) {
    if (card.tagName === 'DETAILS') {
      if (!card.open) card.open = true;
      return;
    }
    const collapse = card.querySelector('[data-m01-section-toggle][aria-expanded="false"]');
    if (collapse) collapse.click();
  }

  function sync() {
    scheduled = false;
    const cards = proveCards();
    let found = null;
    cards.forEach(({ card, kicker }, index) => {
      ensureButton(card, kicker, index);
      const on = activeKey === keyFor(index);
      card.classList.toggle(ACTIVE, on);
      const button = card.querySelector('[data-lab-max-toggle]');
      if (button && button.getAttribute('aria-pressed') !== String(on)) {
        button.setAttribute('aria-pressed', String(on));
        button.setAttribute('title', on ? 'Return the lab to the page (Esc)' : 'Expand this lab to fill the screen');
        button.innerHTML = buttonMarkup(on);
      }
      if (on) found = card;
    });
    // Leaving the module route (or the lab disappearing, e.g. a prerequisite
    // gate) drops the maximized state rather than stranding a scroll lock.
    if (activeKey && !found && !activeKey.startsWith(`${location.hash}::`)) activeKey = null;
    if (found && found !== activeCard) {
      openCard(found);
      // Simulator consoles mount into the card after the first frame, so the
      // saved offset is reapplied once they have had a chance to lay out.
      const card = found;
      const offset = savedScroll;
      card.scrollTop = offset;
      setTimeout(() => { if (card === activeCard && card.scrollTop < offset) card.scrollTop = offset; }, 120);
    }
    activeCard = found;
    document.documentElement.classList.toggle('lab-max-open', Boolean(found));
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }

  function setMaximized(index) {
    const previous = activeCard;
    activeKey = index == null ? null : keyFor(index);
    savedScroll = 0;
    activeCard = null;
    sync();
    if (!activeKey && previous && previous.isConnected) {
      previous.scrollIntoView({ block: 'start' });
      const button = previous.querySelector('[data-lab-max-toggle]');
      if (button) button.focus({ preventScroll: true });
    }
  }

  // Capture phase so the button's click never reaches the <summary> it sits
  // in (which would collapse the card) or a module's own summary handler.
  document.addEventListener('click', (event) => {
    const button = event.target.closest && event.target.closest('[data-lab-max-toggle]');
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(button.getAttribute('data-lab-max-toggle'));
      setMaximized(activeKey === keyFor(index) ? null : index);
      return;
    }
    // A maximized card is always open; its heading must not collapse it.
    const summary = event.target.closest && event.target.closest(`.${ACTIVE} > summary`);
    if (summary) event.preventDefault();
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !activeCard || event.defaultPrevented) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    setMaximized(null);
  });

  document.addEventListener('scroll', (event) => {
    if (event.target === activeCard) savedScroll = activeCard.scrollTop;
  }, true);

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

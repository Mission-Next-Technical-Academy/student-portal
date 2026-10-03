/* Shared Learn It card renderer and interactions. Deck data stays in each
 * module until the deck authoring sprint. */
(function registerLearnItCards(global) {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const attr = (prefix, action) => `data-${prefix}-learn-${action}`;

  function render({ deck, step = 0, viewed = null, done = false, prefix = 'learn', id = '', headingId = `${prefix}-learn-copy-title`, heading = 'Learn the key ideas', readyHeading = 'Ready to begin?', doneHeading = 'Deck complete', intro = '', doneIntro = '', readyText = '', label = 'LEARN IT', countLabel = 'slides', readyCountLabel = `${deck.length} QUICK IDEAS`, completedLabel = 'COMPLETE', progressCopy = ({ step: currentStep, total: count, noun }) => `${currentStep} of ${count} ${noun} complete.`, slideLabel = 'Slide', lockedLabel = 'Locked', readyActionLabel = 'LEARN IT', nextActionLabel = 'NEXT', finalActionLabel = 'Finish', restartLabel = 'Start over', primaryClass = 'learn-it-primary', secondaryClass = 'learn-it-secondary' }) {
    const total = deck.length;
    const current = Math.max(0, Math.min(step - 1, total - 1));
    const revealed = done ? total : step;
    const viewIndex = revealed ? Math.min(viewed ?? current, revealed - 1) : -1;
    const fresh = !done && viewed === null && viewIndex === current;
    const cards = deck.map((item, index) => {
      const unlocked = index < revealed;
      const selected = index === viewIndex;
      const name = unlocked ? esc(item.title) : esc(lockedLabel);
      return `<button class="learn-it-card${selected ? ' is-active' : ''}${unlocked ? '' : ' is-locked'}" type="button"${unlocked ? ` data-${prefix}-learn-view="${index}"` : ' disabled'}${selected ? ' aria-current="true"' : ''} aria-label="${esc(slideLabel)} ${index + 1}: ${name}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${unlocked ? name : '<i class="ri-lock-line" aria-hidden="true"></i>'}</strong></button>`;
    }).join('');
    const body = viewIndex < 0 ? '' : (() => {
      const item = deck[viewIndex];
      const content = fresh
        ? `<span class="learn-it-decode-visual" data-${prefix}-decode-text aria-hidden="true">${esc(item.body)}</span><span class="learn-it-sr-only">${esc(item.body)}</span>`
        : esc(item.body);
      const visual = item.visual === 'cia' ? `<figure class="learn-it-cia" role="img" aria-label="The CIA triad: confidentiality controls who can see information, integrity protects it from improper change, and availability keeps it usable."><svg viewBox="0 0 420 250" aria-hidden="true" focusable="false"><path d="M210 18 82 224h256Z" fill="#7dd3fc08" stroke="#7dd3fc66" stroke-width="2"/><circle cx="210" cy="70" r="48" fill="#193958" stroke="#fdba74" stroke-width="2.5"/><circle cx="126" cy="174" r="48" fill="#193958" stroke="#7dd3fc" stroke-width="2.5"/><circle cx="294" cy="174" r="48" fill="#193958" stroke="#4ade80" stroke-width="2.5"/><text class="cia-title" x="210" y="67" text-anchor="middle">Confidentiality</text><text class="cia-desc" x="210" y="85" text-anchor="middle">who can see</text><text class="cia-title" x="126" y="171" text-anchor="middle">Integrity</text><text class="cia-desc" x="126" y="189" text-anchor="middle">protect from change</text><text class="cia-title" x="294" y="171" text-anchor="middle">Availability</text><text class="cia-desc" x="294" y="189" text-anchor="middle">keep usable</text></svg><figcaption>Security balances three ways information can be at risk.</figcaption></figure>` : '';
      return `<div class="learn-it-line${fresh ? ' is-new' : ' is-recall'}"${fresh ? ' aria-current="step"' : ''}><span class="learn-it-line-index">${String(viewIndex + 1).padStart(2, '0')}</span><div><h3>${esc(item.title)}</h3><p>${content}</p>${visual}</div></div>`;
    })();
    const status = done ? `${label} · ${completedLabel}` : step === 0 ? `${label} · ${readyCountLabel}` : `${label} · STEP ${step} OF ${total} · ${esc(deck[current].title)}`;
    const copy = done ? doneIntro : step === 0 ? intro : progressCopy({ step, total, noun: countLabel });
    const action = done
      ? `<button class="${esc(secondaryClass)}" type="button" ${attr(prefix, 'restart')}><i class="ri-restart-line" aria-hidden="true"></i> ${esc(restartLabel)}</button>`
      : `<button class="${esc(primaryClass)}" type="button" ${attr(prefix, 'next')}>${step === 0 ? esc(readyActionLabel) : current === total - 1 ? esc(finalActionLabel) : esc(nextActionLabel)} <i class="ri-arrow-right-line" aria-hidden="true"></i></button>`;
    const width = `${(step / total) * 100}%`;
    return `<section class="learn-it${done ? ' is-done' : ''}" style="--learn-it-columns:${Math.max(1, Math.min(total, 6))}" data-learn-step="${step}"${id ? ` id="${esc(id)}"` : ''} aria-labelledby="${esc(headingId)}"><div class="learn-it-heading"><div><p class="learn-it-label">${status}</p><h3 id="${esc(headingId)}">${esc(done ? doneHeading : step === 0 ? readyHeading : heading)}</h3><p>${esc(copy)}</p></div><div class="learn-it-actions">${action}</div></div><nav class="learn-it-cards" aria-label="Learn It ideas">${cards}</nav><div class="learn-it-canvas" aria-live="polite">${body || `<p class="learn-it-placeholder">${esc(readyText)}</p>`}</div><div class="learn-it-scan" aria-hidden="true"><span style="width:${width}"></span></div></section>`;
  }

  const wiredRoots = new WeakSet();
  function revealInCarousel(card) {
    const track = card?.closest('.learn-it-cards');
    if (!track) return;
    const behavior = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const trackBox = track.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    if (cardBox.left < trackBox.left) track.scrollBy({ left: cardBox.left - trackBox.left - 8, behavior });
    else if (cardBox.right > trackBox.right) track.scrollBy({ left: cardBox.right - trackBox.right + 8, behavior });
  }
  function wire(root, { prefix = 'learn', onStep = () => {}, onView = () => {}, onDecode = () => {} } = {}) {
    if (wiredRoots.has(root)) return;
    wiredRoots.add(root);
    root.addEventListener('click', (event) => {
      const next = event.target.closest(`[${attr(prefix, 'next')}]`);
      const restart = event.target.closest(`[${attr(prefix, 'restart')}]`);
      const card = event.target.closest(`[data-${prefix}-learn-view]`);
      if (next) {
        const callout = next.closest('.learn-it');
        const stepNow = Number(callout.dataset.learnStep);
        const current = Number(callout.querySelector('.learn-it-cards').children.length);
        const done = callout.classList.contains('is-done');
        if (!done) {
          const selected = Number(callout.querySelector('.learn-it-card.is-active')?.getAttribute(`data-${prefix}-learn-view`));
          if (Number.isInteger(selected) && selected >= 0 && selected < stepNow - 1) onView(selected + 1);
          else onStep(Math.min(current, stepNow + 1), 'next');
          if (root.isConnected) root.querySelectorAll('.learn-it-line.is-new [data-' + prefix + '-decode-text]').forEach(onDecode);
          requestAnimationFrame(() => {
            const active = root.querySelector('.learn-it-card.is-active');
            if (active) { revealInCarousel(active); active.focus(); }
          });
        }
      } else if (restart) onStep(0, 'restart');
      else if (card) {
        const index = Number(card.getAttribute(`data-${prefix}-learn-view`));
        onView(index);
        requestAnimationFrame(() => {
          const selected = document.querySelector(`[data-${prefix}-learn-view="${index}"]`);
          if (selected) { revealInCarousel(selected); selected.focus(); }
        });
      }
    });
    root.addEventListener('focusin', (event) => {
      const card = event.target.closest('.learn-it-card');
      if (card) revealInCarousel(card);
    });
    const decode = () => root.querySelectorAll(`.learn-it-line.is-new [data-${prefix}-decode-text]`).forEach(onDecode);
    decode();
    requestAnimationFrame(() => revealInCarousel(root.querySelector('.learn-it-card.is-active')));
  }

  global.LearnItCards = { render, wire };
}(window));

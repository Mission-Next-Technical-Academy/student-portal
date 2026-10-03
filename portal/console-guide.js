// Standard Console Guide — the step-by-step teaching card that floats beside
// the evidence it explains, highlights that evidence, and returns to the
// console banner when collapsed. Module 02's Guided Lab console is the
// reference (docs/specs/MODULE_STANDARD.md §7.3). "Use the console guide" means this
// card: same shape, colours and format; only the step text changes.
//
// Markup keeps the canonical `.m02e-learn-tip` / `.m02e-tip-*` /
// `.m02e-guide-*` classes (styles in portal/module-labs.css). Modules must not
// restyle them.
//
// Step data: [{ title, body, lookFor, lab, target }] — plus any module-specific
// keys (tab…) the module uses to move the console to what the step is
// about.
//
// Wiring is the module's: it owns the step index, handles clicks on the
// `data-<prefix>-guide-next|collapse|open` buttons, and calls
// consoleGuidePosition() after render. Pass the step target when available;
// otherwise positioning follows the selected evidence in the active view.

// `target` is an optional CSS selector for the evidence or control the step
// is about. The card carries it as data-guide-target, and
// consoleGuidePosition() highlights it and floats beside it ahead of whatever
// target the module passes, so a module only has to name it in step data.
//
// spec:
//   steps     — the step array
//   step      — current index; steps.length means complete; < 0 renders nothing
//   docked    — collapsed into the console header
//   prefix    — id / data-attribute prefix (default 'cg'); Module 02 uses 'm02e'
//   item      — optional override of the current step (e.g. a live title)
//   doneTitle, doneText — completion copy
function consoleGuideCard(spec) {
  const steps = spec.steps || [];
  const step = spec.step;
  if (!(step >= 0)) return '';
  const prefix = spec.prefix || 'cg';
  const done = step >= steps.length;
  const item = spec.item || steps[Math.min(step, steps.length - 1)] || {};
  const docked = spec.docked === true;
  const toggleLabel = docked ? 'Show guide at the current evidence' : 'Return guide to the console banner';
  const title = done && spec.doneTitle ? spec.doneTitle : item.title;
  const body = done
    ? (spec.doneHtml || `<p>${esc(spec.doneText || 'You can keep exploring the console, or revisit the explanations from the main Learn It card.')}</p>`)
    : `<p>${esc(item.body)}</p>${item.lookFor ? `<p class="m02e-guide-look"><strong>Look for:</strong> ${esc(item.lookFor)}</p>` : ''}${item.lab ? `<p class="m02e-guide-lab"><strong>Lab connection:</strong> ${esc(item.lab)}</p>` : ''}`;
  const next = done ? (spec.advisory ? 'Restart Guided Lab' : 'Restart console guide') : step === steps.length - 1 ? (spec.advisory ? 'Back to first explanation' : 'Finish guide') : 'Next explanation';
  return `<aside class="m02e-learn-tip${done ? ' is-complete' : ''}${docked ? ' is-collapsed' : ''}" id="${prefix}-learn-tip" aria-labelledby="${prefix}-guide-title"${!done && item.target ? ` data-guide-target="${esc(item.target)}"` : ''}><div class="m02e-tip-head"><span class="m02e-label">${done ? 'CONSOLE GUIDE · COMPLETE' : `CONSOLE GUIDE · STEP ${step + 1} OF ${steps.length}`}</span><button class="m02e-tip-toggle" type="button" data-console-guide-toggle="${prefix}-learn-tip" data-${prefix}-guide-collapse aria-expanded="${docked ? 'false' : 'true'}" aria-controls="${prefix}-tip-body" title="${toggleLabel}"><i class="ri-arrow-down-s-line" aria-hidden="true"></i><span class="m02e-tip-toggle-text">${docked ? 'Show guide' : 'Minimize'}</span><span class="m02e-sr-only"> — ${toggleLabel}</span></button></div><div class="m02e-tip-body" id="${prefix}-tip-body"><h3 id="${prefix}-guide-title">${esc(title)}</h3>${body}<button class="m02e-guide-next" type="button" data-${prefix}-guide-next>${next} <i class="ri-arrow-right-line" aria-hidden="true"></i></button></div></aside>`;
}

// Module click handlers own the saved step / collapsed state and rerender
// their guide. Once that render and its positioning settle, put the resulting
// floating or banner card in the center of the learner's view so neither the
// arrow nor "Next explanation" ever leaves it offscreen.
if (typeof document !== 'undefined' && typeof window !== 'undefined' && !window.consoleGuideCenterOnToggleBound) {
  window.consoleGuideCenterOnToggleBound = true;
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-console-guide-toggle]');
    const next = !toggle && event.target.closest('.m02e-guide-next');
    const cardId = toggle ? toggle.dataset.consoleGuideToggle : next?.closest('.m02e-learn-tip')?.id;
    if (!cardId) return;
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    // Two frames: the rerender lands first, then consoleGuidePosition() places
    // the card in its own frame.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById(cardId)?.scrollIntoView?.({ behavior, block: 'center', inline: 'center' });
    }));
  });
}

// Practice labs share this wrapper so every module uses the same guide card
// and completion trigger. Call with the saved step index; next remains an
// advisory action and callers should advance it without checking predicates.
function guidedLabGuide(scope, steps, options = {}) {
  const submitted = options.submitted === true;
  const step = submitted ? steps.length : Math.max(0, Number(options.step) || 0);
  return consoleGuideCard({
    steps,
    step,
    // A submitted lab's debrief starts docked in the banner so it stays out of
    // the console; a module can still pass docked: false to show it open.
    docked: submitted ? options.docked !== false : options.docked === true,
    prefix: options.prefix || `${scope}-guided`,
    doneTitle: submitted ? 'Practice debrief' : undefined,
    doneHtml: submitted ? options.debriefHtml || '' : undefined,
    item: options.item,
    advisory: true,
  });
}

// Shared ungraded practice debrief. Field labels/statuses are descriptive;
// there are deliberately no points or right/wrong judgments here.
function guidedLabDebrief({ story, fields = [], handoff }) {
  return `<section class="guided-lab-debrief" aria-label="Practice debrief">
    <h4>What the evidence supports</h4><p>${esc(story || '')}</p>
    <h4>Ticket field notes</h4><ul>${fields.map((field) => `<li><strong>${esc(field.name || field.label || 'Ticket field')} · ${esc(field.status || 'missed')}</strong>${field.note ? ` — ${esc(field.note)}` : ''}</li>`).join('')}</ul>
    <h4>Strong handoff</h4><p>${esc(handoff || '')}</p>
  </section>`;
}

// The pulsing orange "Start console guide" call to action.
function consoleGuideStartButton(spec = {}) {
  const prefix = spec.prefix || 'cg';
  const available = spec.available !== false;
  return `<button class="m02e-guide-open" type="button" data-${prefix}-guide-open${available ? '' : ' disabled'}><i class="${available ? 'ri-play-circle-fill' : 'ri-lock-line'}" aria-hidden="true"></i>${esc(available ? (spec.label || 'Start console guide') : (spec.lockedLabel || 'Finish the lessons to start the guide'))}</button>`;
}

// Floats the card above (or below, arrow flipped) `target` inside the
// positioned `workspace`. A missing target resolves to selected evidence in
// the active view, then that view's heading. The current target is highlighted.
// Docked cards (inside a <header>) sit inline. opts.alignLeft pins the card to
// the workspace's left edge.
function consoleGuidePosition(tip, workspace, target, opts = {}) {
  if (!tip) return;
  if (!workspace) return;
  // A collapsed card belongs in the lab's banner. Most module renderers put
  // it there themselves; this fallback covers console guides rendered inside
  // their practice panel without a module-specific docking step.
  if (tip.classList.contains('is-collapsed')) {
    const shell = workspace.closest('.m01-console, .m02e-console, .m03e-console, [data-console-shell]')
      || workspace.closest('.m03e-console-host');
    const banner = shell?.querySelector('header');
    if (banner && !banner.contains(tip)) banner.append(tip);
  }
  if (tip.closest('header')) {
    document.querySelectorAll('.console-guide-focus').forEach((node) => node.classList.remove('console-guide-focus'));
    tip.style.top = '';
    tip.style.left = '';
    tip.classList.remove('points-down');
    tip.classList.add('is-visible');
    return;
  }
  // A step that names its own target wins over the module's generic guess.
  const stepTarget = tip.dataset.guideTarget && workspace.querySelector(tip.dataset.guideTarget);
  if (stepTarget && stepTarget.getClientRects().length) target = stepTarget;
  // Shared default for modules that do not pass a step-specific target: follow
  // the selected evidence inside the active view, then fall back to that view.
  // Keeping the card beside the current evidence avoids pinning it over the
  // same upper-left content on every step.
  if (!target) {
    const view = workspace.querySelector('.m02e-view, .m03e-view, .m04-console-view, .console-view, [data-console-view]') || workspace;
    target = view.querySelector('[data-guide-focus], .is-selected, [aria-selected="true"], [aria-current="step"]')
      || view.querySelector('h2, h3, h4, [role="tabpanel"]')
      || view;
  }
  document.querySelectorAll('.console-guide-focus').forEach((node) => {
    if (node !== target) node.classList.remove('console-guide-focus');
  });
  target.classList.add('console-guide-focus');
  const workspaceRect = workspace.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  tip.classList.remove('is-visible', 'points-down', 'points-side');
  // Layout size, not getBoundingClientRect(): the hidden card is drawn at
  // scale(.98), which under-measured it and let it overlap its target.
  tip.style.maxHeight = '';
  const tipRect = { width: tip.offsetWidth, height: tip.offsetHeight };
  let top = targetRect.top - workspaceRect.top - tipRect.height - 12;
  let pointsDown = false;
  let side = false;
  if (top < 8) { top = targetRect.bottom - workspaceRect.top + 12; pointsDown = true; }
  top = Math.min(top, Math.max(8, workspaceRect.height - tipRect.height - 8));
  let left = opts.alignLeft
    ? 8
    : targetRect.left - workspaceRect.left + targetRect.width / 2 - tipRect.width / 2;
  left = Math.max(8, Math.min(left, workspaceRect.width - tipRect.width - 8));
  // Above/below got clamped onto the target (a mid-height row in a short
  // workspace): sit beside it instead, on whichever side has room.
  const t = { top: targetRect.top - workspaceRect.top, bottom: targetRect.bottom - workspaceRect.top, left: targetRect.left - workspaceRect.left, right: targetRect.right - workspaceRect.left };
  const covers = (x, y) => x < t.right && x + tipRect.width > t.left && y < t.bottom && y + tipRect.height > t.top;
  if (covers(left, top)) {
    const sideTop = Math.max(8, Math.min(t.top + (t.bottom - t.top) / 2 - tipRect.height / 2, workspaceRect.height - tipRect.height - 8));
    const room = [t.right + 12, t.left - tipRect.width - 12].find((x) => x >= 8 && x + tipRect.width <= workspaceRect.width - 8);
    if (room !== undefined) { left = room; top = sideTop; side = true; pointsDown = false; } else {
      // No spot fits the whole card (a full-width row mid-way down a short
      // workspace). Use the larger gap and let the card scroll inside it
      // rather than hide the row it is explaining.
      const above = t.top - 20;
      const below = workspaceRect.height - t.bottom - 20;
      const gap = Math.max(above, below);
      if (gap >= 120) {
        tip.style.maxHeight = `${gap}px`;
        pointsDown = below >= above;
        top = pointsDown ? t.bottom + 12 : t.top - 12 - Math.min(tipRect.height, gap);
      }
    }
  }
  // The math above is in workspace coordinates, but top/left resolve against
  // the card's containing block: its offsetParent's padding box, scrolled.
  // Translate so a bordered, scrolled or nested container doesn't shift it.
  const frame = tip.offsetParent || workspace;
  const frameRect = frame.getBoundingClientRect();
  const shiftX = workspaceRect.left - frameRect.left - frame.clientLeft + frame.scrollLeft;
  const shiftY = workspaceRect.top - frameRect.top - frame.clientTop + frame.scrollTop;
  tip.style.top = `${top + shiftY}px`;
  tip.style.left = `${left + shiftX}px`;
  tip.classList.toggle('points-down', pointsDown);
  tip.classList.toggle('points-side', side);
  requestAnimationFrame(() => tip.classList.add('is-visible'));
}

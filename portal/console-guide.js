// Standard Console Guide — the step-by-step teaching card that floats over a
// lab console, points at the thing it is explaining, and docks into the
// console header when collapsed. Module 02's Learn It console is the
// reference (docs/specs/MODULE_STANDARD.md §7.3). "Use the console guide" means this
// card: same shape, colours and format; only the step text changes.
//
// Markup keeps the canonical `.m02e-learn-tip` / `.m02e-tip-*` /
// `.m02e-guide-*` classes (styles in portal/module-labs.css). Modules must not
// restyle them.
//
// Step data: [{ title, body, lookFor, lab }] — plus any module-specific keys
// (tab, target…) the module uses to move the console to what the step is
// about.
//
// Wiring is the module's: it owns the step index, handles clicks on the
// `data-<prefix>-guide-next|collapse|open` buttons, and calls
// consoleGuidePosition() after render.

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
  const toggleLabel = docked ? 'Show guide' : 'Move guide out of the way';
  const title = done && spec.doneTitle ? spec.doneTitle : item.title;
  const body = done
    ? `<p>${esc(spec.doneText || 'You can keep exploring the console, or revisit the explanations from the main Learn It card.')}</p>`
    : `<p>${esc(item.body)}</p>${item.lookFor ? `<p class="m02e-guide-look"><strong>Look for:</strong> ${esc(item.lookFor)}</p>` : ''}${item.lab ? `<p class="m02e-guide-lab"><strong>Lab connection:</strong> ${esc(item.lab)}</p>` : ''}`;
  const next = done ? 'Restart console guide' : step === steps.length - 1 ? 'Finish guide' : 'Next explanation';
  return `<aside class="m02e-learn-tip${done ? ' is-complete' : ''}${docked ? ' is-collapsed' : ''}" id="${prefix}-learn-tip" aria-labelledby="${prefix}-guide-title"><div class="m02e-tip-head"><span class="m02e-label">${done ? 'CONSOLE GUIDE · COMPLETE' : `CONSOLE GUIDE · STEP ${step + 1} OF ${steps.length}`}</span><button class="m02e-tip-toggle" type="button" data-${prefix}-guide-collapse aria-expanded="${docked ? 'false' : 'true'}" aria-controls="${prefix}-tip-body" title="${toggleLabel}"><i class="ri-arrow-down-s-line" aria-hidden="true"></i><span class="m02e-sr-only">${toggleLabel}</span></button></div><div class="m02e-tip-body" id="${prefix}-tip-body"><h3 id="${prefix}-guide-title">${esc(title)}</h3>${body}<button class="m02e-guide-next" type="button" data-${prefix}-guide-next>${next} <i class="ri-arrow-right-line" aria-hidden="true"></i></button></div></aside>`;
}

// The pulsing orange "Start console guide" call to action.
function consoleGuideStartButton(spec = {}) {
  const prefix = spec.prefix || 'cg';
  const available = spec.available !== false;
  return `<button class="m02e-guide-open" type="button" data-${prefix}-guide-open${available ? '' : ' disabled'}><i class="${available ? 'ri-play-circle-fill' : 'ri-lock-line'}" aria-hidden="true"></i>${esc(available ? (spec.label || 'Start console guide') : (spec.lockedLabel || 'Finish the lessons to start the guide'))}</button>`;
}

// Floats the card above (or below, arrow flipped) `target` inside the
// positioned `workspace`. Docked cards (inside a <header>) sit inline.
// opts.alignLeft pins the card to the workspace's left edge.
function consoleGuidePosition(tip, workspace, target, opts = {}) {
  if (!tip) return;
  if (tip.closest('header')) {
    tip.style.top = '';
    tip.style.left = '';
    tip.classList.remove('points-down');
    tip.classList.add('is-visible');
    return;
  }
  if (!workspace) return;
  if (!target) {
    tip.style.top = '8px';
    tip.style.left = '8px';
    tip.classList.remove('points-down');
    requestAnimationFrame(() => tip.classList.add('is-visible'));
    return;
  }
  const workspaceRect = workspace.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  tip.classList.remove('is-visible', 'points-down');
  const tipRect = tip.getBoundingClientRect();
  let top = targetRect.top - workspaceRect.top - tipRect.height - 12;
  let pointsDown = false;
  if (top < 8) { top = targetRect.bottom - workspaceRect.top + 12; pointsDown = true; }
  top = Math.min(top, Math.max(8, workspaceRect.height - tipRect.height - 8));
  let left = opts.alignLeft
    ? 8
    : targetRect.left - workspaceRect.left + targetRect.width / 2 - tipRect.width / 2;
  left = Math.max(8, Math.min(left, workspaceRect.width - tipRect.width - 8));
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
  tip.classList.toggle('points-down', pointsDown);
  requestAnimationFrame(() => tip.classList.add('is-visible'));
}

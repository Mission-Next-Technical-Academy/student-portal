/* Universal, program-agnostic first-login Academy orientation tour.
 *
 * Sprint brief: build ONE reusable orientation framework for the whole
 * Academy (Welcome -> LMS navigation -> the student's enrolled program ->
 * that program's module structure -> Module 1 -> Learn It/Practice It/
 * Prove It), fed entirely from PROGRAMS (data.js) and the real rendered
 * portal DOM — never a program-specific copy of this file. See ROADMAP.md
 * "Locked Module 1 sequence" for why a beginning-of-course orientation is a
 * required build item.
 *
 * How it survives route transitions: app.js's render() is a full
 * `app.innerHTML = ...` replace on every hashchange, so nothing DOM-based
 * here can persist across a navigation on its own. Progress is instead kept
 * as {programSlug, stepId} in sessionStorage, and render() calls
 * AcademyOrientation.onRouteRendered(user, hash) once at the end of every
 * non-admin route render. That function is the whole state machine: it
 * looks at the current step and the current hash and decides whether to
 * (re)mount the step's spotlight, advance past a step whose required click
 * already happened, or just tear down the overlay until the student
 * navigates back to a route the tour cares about.
 *
 * Completion is Academy-level, not per-program (module_progress/students
 * distinction — see the migration comment): students.academy_orientation_
 * completed_at, written once via the mark_academy_orientation_complete() RPC.
 */
const AcademyOrientation = (() => {
  const STORAGE_KEY = 'mnt_orientation_progress_v1';

  function loadProgress() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }
  function saveProgress(progress) {
    try {
      if (progress) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* private-browsing storage failure is not fatal here */ }
  }

  /* ---------------------------------------------------------- program data */

  function activeProgramFor(user) {
    const enrollment = (user.enrollments || []).find((e) => e.status === 'active');
    if (!enrollment) return null;
    return (typeof PROGRAMS !== 'undefined' ? PROGRAMS : []).find((p) => p.slug === enrollment.programSlug) || null;
  }

  function firstModuleOf(program) {
    const modules = Object.values(program.modules || {}).filter((m) => m && typeof m === 'object' && m.number);
    modules.sort((a, b) => a.number - b.number);
    return modules[0] || null;
  }

  function programContext(user) {
    const program = activeProgramFor(user);
    if (!program) return null;
    const firstModule = firstModuleOf(program);
    if (!firstModule) return null;
    const modulesPerWeek = program.weeks ? Math.round((program.moduleCount || 0) / program.weeks) : null;
    return {
      user, program, firstModule,
      programName: program.cardTitle || program.title,
      moduleCount: program.moduleCount,
      weeks: program.weeks,
      modulesPerWeek,
      programRoute: `#/program/${program.slug}`,
      firstModuleRoute: `#/program/${program.slug}/module/${firstModule.number}`,
    };
  }

  /* --------------------------------------------------------------- steps */
  // route: RegExp the current hash must match for this step to be shown.
  // target(ctx): returns the element to spotlight, or null/undefined for a
  //   centered modal step (also the graceful fallback when a program has no
  //   equivalent control, e.g. no quick-nav rail).
  // advance: 'button' (a Next/Begin/Start control moves to the next step) or
  //   'click' (the spotlighted control itself is the real navigation — the
  //   tour waits for the resulting route change instead of drawing its own
  //   button over a control the student must actually use).
  // nextRoute: only for advance:'click' steps — the route pattern that means
  //   the click happened and it is safe to move on.

  function buildSteps(ctx) {
    const railSelector = '[data-mquick-nav-rail]';
    const phaseTarget = (phase) => () => {
      const rail = document.querySelector(railSelector);
      if (!rail) return null;
      openNavRailIfClosed(rail);
      return rail.querySelector(`[data-munified-group-key="${phase}"] .munified-phase-row`)
        || rail.querySelector(`[data-munified-group-key="${phase}"]`);
    };
    // Only SOC Analyst has the quick-nav rail (moduleUnifiedNav) today — IT
    // Help Desk and the others don't render one. Re-evaluated fresh on every
    // buildSteps() call (see onRouteRendered), so this reads real DOM state
    // once the student is actually on the module route, not a guess made
    // back on the dashboard. Three separate spotlighted call-outs read as
    // redundant without a rail to anchor them, so those programs get one
    // combined, un-anchored explanation instead — same copy, same ids where
    // it matters for resume, no separate program-specific file.
    const hasPhaseRail = !!document.querySelector(railSelector);

    const learnPracticeProveSteps = hasPhaseRail
      ? [
        {
          id: 'learn-it',
          route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
          advance: 'button',
          dim: false,
          target: phaseTarget('learn'),
          title: 'Learn It',
          body: `Build the knowledge behind the skill through focused instruction, demonstrations, and examples.`,
        },
        {
          id: 'practice-it',
          route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
          advance: 'button',
          dim: false,
          target: phaseTarget('practice'),
          title: 'Practice It',
          body: `Apply the skill with guidance, feedback, and opportunities to try again.`,
        },
        {
          id: 'prove-it',
          route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
          advance: 'button',
          dim: false,
          target: phaseTarget('prove'),
          title: 'Prove It',
          body: `Demonstrate that you can perform the skill with less guidance through graded, hands-on work.`,
        },
      ]
      : [
        {
          id: 'learn-it',
          route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
          advance: 'button',
          dim: false,
          title: 'Learn It, Practice It, Prove It',
          body: `Every module follows the same pattern. Learn It builds the knowledge through focused instruction and examples. Practice It lets you apply the skill with guidance and room to try again. Prove It has you demonstrate the skill with less guidance, through graded, hands-on work.`,
        },
      ];

    return [
      {
        id: 'welcome',
        route: /^#\/portal$/,
        advance: 'button',
        cta: 'Begin Orientation',
        eyebrow: 'Welcome to the',
        title: 'Mission Next Technical Academy',
        body: `Your training starts here. We'll give you a quick tour of the Academy, show you how your program is organized, and take you to your first module so you know exactly where to begin.`,
      },
      {
        id: 'academy-nav',
        route: /^#\/portal$/,
        advance: 'button',
        target: () => document.querySelector('header nav'),
        title: 'Getting around the Academy',
        body: `This bar is always here. Your logo takes you home, and "My Programs" always brings you back to this dashboard from anywhere in the site.`,
      },
      {
        id: 'academy-programs',
        route: /^#\/portal$/,
        advance: 'button',
        target: () => document.getElementById('mnt-my-programs'),
        title: 'Where your coursework lives',
        body: `Every program you're enrolled in shows up here as a card, with your overall progress. This is always your starting point.`,
      },
      {
        id: 'academy-help',
        route: /^#\/portal$/,
        advance: 'button',
        target: () => document.querySelector('[aria-labelledby="student-messages-title"]'),
        title: 'Getting help',
        body: `If you get stuck, you can message your instructor directly from here at any time. Replies show up in this same panel.`,
      },
      {
        id: 'program-discovery',
        route: /^#\/portal$/,
        advance: 'click',
        nextRoute: new RegExp(`^${escapeRe(ctx.programRoute)}(/module/\\d+)?$`),
        target: () => document.querySelector(`[data-open="${cssEscape(ctx.program.slug)}"]`),
        title: 'This is your program',
        body: `Select it to view your coursework, progress, and modules.`,
      },
      // From here on the student has actually navigated into their program —
      // a dimmed/blurred backdrop over real coursework they're now trying to
      // read stops being a helpful frame and starts being an obstruction, so
      // every step below opts out of it (dim: false). The spotlight ring and
      // card still call out the right control; the page just stays legible.
      {
        id: 'program-structure',
        route: new RegExp(`^${escapeRe(ctx.programRoute)}$`),
        advance: 'button',
        dim: false,
        // The curriculum LIST itself can be thousands of pixels tall (12
        // modules) — spotlighting the whole section produces a ring far
        // bigger than the viewport. The compact summary line right above it
        // ("6 Weeks · 12 Modules") says the same thing at a size that
        // actually fits on screen.
        target: () => document.getElementById('sec-curriculum-summary') || document.getElementById('sec-curriculum'),
        title: ctx.programName,
        body: ctx.weeks && ctx.moduleCount
          ? `Your ${ctx.programName} program contains ${ctx.moduleCount} modules completed over ${ctx.weeks} week${ctx.weeks === 1 ? '' : 's'}${ctx.modulesPerWeek ? `, generally ${ctx.modulesPerWeek} each week` : ''}. Coursework is completed in sequence — complete the required work in each module before progressing to the next.`
          : `Coursework is completed in sequence — complete the required work in each module before progressing to the next.`,
      },
      {
        id: 'module-one',
        route: new RegExp(`^${escapeRe(ctx.programRoute)}$`),
        advance: 'click',
        dim: false,
        nextRoute: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
        target: () => document.querySelector('#sec-curriculum [data-module-card]'),
        title: 'Your training begins here',
        body: `Select ${ctx.firstModule.title} to get started.`,
      },
      ...learnPracticeProveSteps,
      {
        // Grading/review is Academy-wide infrastructure (lab_attempts +
        // faculty review + the "Redo Requested" pill moduleCard() already
        // shows — see lab-grading-notification-system/STATE.md), not
        // something a module's own content explains. Reuses Prove It's own
        // spot (or the combined no-rail card) as a second, distinct call-out
        // rather than a new selector to keep fragile across programs. One
        // sentence covers the capstone too — it's graded the same way, just
        // larger — so it needs no step of its own.
        id: 'review-gate',
        route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
        advance: 'button',
        dim: false,
        target: hasPhaseRail ? phaseTarget('prove') : undefined,
        title: 'Graded work gets reviewed',
        body: `Submitting a lab isn't the finish line — a module isn't marked complete until your instructor has reviewed the work. If something needs another pass, you'll see a "Redo Requested" note on the module telling you what to fix, and you resubmit. Your program's capstone works the same way, just at a larger scale.`,
      },
      {
        id: 'done',
        route: new RegExp(`^${escapeRe(ctx.firstModuleRoute)}$`),
        advance: 'button',
        dim: false,
        cta: 'Start Module 1',
        title: "You're ready.",
        body: `You know how to navigate your program, how your coursework is structured, and how it's graded.\nLearn It &rarr; Practice It &rarr; Prove It`,
        final: true,
      },
    ];
  }

  function openNavRailIfClosed(rail) {
    if (rail.offsetParent !== null) return;
    const toggle = rail.querySelector('[data-mquick-nav-toggle]');
    if (toggle) toggle.click();
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function cssEscape(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'); }

  /* --------------------------------------------------------------- engine */

  let els = null; // live overlay DOM, torn down/rebuilt across route renders
  let reposition = null;

  function teardown() {
    if (els) { els.root.remove(); els = null; }
    if (reposition) {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      reposition = null;
    }
  }

  function markComplete(user) {
    saveProgress(null);
    user.academyOrientationCompletedAt = new Date().toISOString();
    if (typeof mntSupabase !== 'undefined') {
      mntSupabase.rpc('mark_academy_orientation_complete').then(({ error }) => {
        if (error) console.error('mark_academy_orientation_complete failed', error);
      });
    }
  }

  function goToStep(ctx, steps, index, hash) {
    if (index >= steps.length) { teardown(); markComplete(ctx.user); return; }
    saveProgress({ programSlug: ctx.program.slug, stepId: steps[index].id });
    mount(ctx, steps, index, hash);
  }

  function mount(ctx, steps, index, hash) {
    const step = steps[index];
    if (!step.route.test(hash)) { teardown(); return; } // paused: wrong route, wait for return
    teardown();

    const target = typeof step.target === 'function' ? step.target() : null;
    const dim = step.dim !== false;

    const root = document.createElement('div');
    root.className = 'mnt-orient';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    document.body.appendChild(root);
    els = { root };

    // Once the student is inside their program (dim: false steps), there is
    // no backdrop to paint at all — no mask elements, nothing dimmed, the
    // real page stays fully legible and fully interactive. Only the ring and
    // card exist to call out a control.
    const panels = dim
      ? ['top', 'bottom', 'left', 'right'].map((side) => {
        const el = document.createElement('div');
        el.className = `mnt-orient-mask mnt-orient-mask-${side}`;
        root.appendChild(el);
        return el;
      })
      : null;
    const ring = document.createElement('div');
    ring.className = 'mnt-orient-ring';
    ring.hidden = true;
    root.appendChild(ring);

    const card = document.createElement('div');
    card.className = 'mnt-orient-card' + (target ? ' mnt-orient-card-anchored' : ' mnt-orient-card-center');
    card.innerHTML = `
      ${step.eyebrow ? `<p class="mnt-orient-eyebrow">${step.eyebrow}</p>` : ''}
      <h2 class="mnt-orient-title">${step.title}</h2>
      <p class="mnt-orient-body">${step.body}</p>
      <div class="mnt-orient-actions">
        ${step.advance === 'click'
          ? `<span class="mnt-orient-hint"><i class="ri-cursor-line" aria-hidden="true"></i> Click the highlighted control to continue</span>`
          : `<button type="button" class="mnt-orient-next" data-mnt-orient-next>${step.cta || 'Next'}</button>`}
        ${!step.final ? `<button type="button" class="mnt-orient-skip" data-mnt-orient-skip>Skip orientation</button>` : ''}
      </div>`;
    root.appendChild(card);

    card.querySelector('[data-mnt-orient-next]')?.addEventListener('click', () => {
      goToStep(ctx, steps, index + 1, location.hash || '#/portal');
    });
    card.querySelector('[data-mnt-orient-skip]')?.addEventListener('click', () => {
      teardown();
      markComplete(ctx.user);
    });

    const place = () => {
      if (!target || !target.isConnected) {
        if (panels) {
          panels[0].style.cssText = 'top:0;left:0;right:0;bottom:0';
          panels[1].style.cssText = panels[2].style.cssText = panels[3].style.cssText = 'top:0;left:0;width:0;height:0';
        }
        ring.hidden = true;
        positionCard(card, null);
        return;
      }
      const rect = target.getBoundingClientRect();
      const pad = 8;
      const r = { top: rect.top - pad, left: rect.left - pad, right: rect.right + pad, bottom: rect.bottom + pad };
      if (panels) {
        panels[0].style.cssText = `top:0;left:0;right:0;height:${Math.max(0, r.top)}px`;
        panels[1].style.cssText = `top:${r.bottom}px;left:0;right:0;bottom:0`;
        panels[2].style.cssText = `top:${r.top}px;left:0;width:${Math.max(0, r.left)}px;height:${r.bottom - r.top}px`;
        panels[3].style.cssText = `top:${r.top}px;left:${r.right}px;right:0;height:${r.bottom - r.top}px`;
      }
      ring.hidden = false;
      ring.style.cssText = `top:${r.top}px;left:${r.left}px;width:${r.right - r.left}px;height:${r.bottom - r.top}px`;
      positionCard(card, r);
    };

    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' in window ? 'instant' : 'auto' });
    } else if (panels) {
      // No spotlight target for this step (a plain welcome/completion modal,
      // or a program with no equivalent control): one full-screen backdrop
      // panel, the other three collapsed to nothing.
      panels[0].style.cssText = 'top:0;left:0;right:0;bottom:0';
      panels[1].style.cssText = panels[2].style.cssText = panels[3].style.cssText = 'top:0;left:0;width:0;height:0';
    }
    requestAnimationFrame(place);
    reposition = place;
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  // Prefers below/above the target (the common case), but a target taller
  // than the viewport (e.g. a full program card) leaves neither with room —
  // fall back to beside it, and only pin to a bare corner if the target
  // fills the screen in both axes. Whichever branch fires, the result must
  // never overlap `r`, or the card blocks the very control it says to click.
  function positionCard(card, r) {
    if (!r) { card.style.cssText = ''; return; }
    const vw = window.innerWidth, vh = window.innerHeight;
    const cardW = 360, cardH = 240, margin = 16;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    let top, left;
    if (vh - r.bottom >= cardH + margin) {
      top = r.bottom + margin;
      left = clamp(r.left, margin, vw - cardW - margin);
    } else if (r.top >= cardH + margin) {
      top = r.top - cardH - margin;
      left = clamp(r.left, margin, vw - cardW - margin);
    } else if (vw - r.right >= cardW + margin) {
      left = r.right + margin;
      top = clamp(r.top, margin, vh - cardH - margin);
    } else if (r.left >= cardW + margin) {
      left = r.left - cardW - margin;
      top = clamp(r.top, margin, vh - cardH - margin);
    } else {
      top = margin;
      left = vw - cardW - margin;
    }
    card.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${cardW}px`;
  }

  /* -------------------------------------------------------------- driver */

  function startTour(user) {
    const ctx = programContext(user);
    if (!ctx) return; // no active/built program to orient into
    const steps = buildSteps(ctx);
    goToStep(ctx, steps, 0, location.hash || '#/portal');
  }

  function resumeTour(user, progress, hash) {
    const ctx = programContext(user);
    if (!ctx || ctx.program.slug !== progress.programSlug) { saveProgress(null); teardown(); return; }
    const steps = buildSteps(ctx);
    let index = steps.findIndex((s) => s.id === progress.stepId);
    if (index < 0) { saveProgress(null); teardown(); return; }
    // A click-target step's job is done once the hash moved to its expected
    // next route — advance past it instead of re-showing a step whose
    // control the student already used.
    while (steps[index].advance === 'click' && steps[index].nextRoute.test(hash) && !steps[index].route.test(hash)) {
      index += 1;
      if (index >= steps.length) { teardown(); markComplete(user); return; }
    }
    saveProgress({ programSlug: ctx.program.slug, stepId: steps[index].id });
    mount(ctx, steps, index, hash);
  }

  function onRouteRendered(user, hash) {
    if (!user || user.isAdmin) return;
    if (user.academyOrientationCompletedAt) { saveProgress(null); return; }
    const progress = loadProgress();
    if (!progress) {
      if (hash === '#/portal') startTour(user);
      return;
    }
    resumeTour(user, progress, hash);
  }

  return { onRouteRendered };
})();

/* Registry that lets each course module own exactly one JS file.
 *
 * Module labs are built one per agent, in parallel. Before this existed every
 * new lab had to edit the router in app.js, the wiring in wireCommon(), and the
 * window message listener — three shared files, so two modules could not be
 * written at the same time without colliding. Now a module file ends with a
 * registerModuleLab() call and app.js discovers it; nothing outside the module's
 * own file changes.
 *
 * Registration order does not matter: index.html loads every module file before
 * app.js, and app.js only reads the registry at render time.
 */

const MODULE_LABS = Object.create(null);

/* def = {
 *   program:      program slug, e.g. 'soc-analyst'
 *   moduleNumber: integer matching the #/program/<slug>/module/<n> route
 *   moduleKey:    catalogue key in data.js, e.g. 'soc-03'
 *   view(user, program) -> HTML string for the whole module surface
 *   wire()        optional; runs after every render, attaches listeners
 *   onMessage(e)  optional; receives window 'message' events
 * }
 */
function registerModuleLab(def) {
  if (!def || !def.program || !def.moduleNumber || typeof def.view !== 'function') {
    console.error('registerModuleLab: ignoring an incomplete definition', def);
    return;
  }
  // The three-stage module contract is platform-owned, not a convention each
  // individual module author has to remember.  Preserve the authored surface,
  // then add the common Prove It assessment surface around it at render time.
  // This is deliberately done here, at the registration boundary, so it also
  // covers older modules and any future course that registers a lab.
  const authoredView = def.view;
  const registeredDef = {
    ...def,
    view(user, program) {
      const authoredHtml = authoredView(user, program);
      if (typeof moduleAssessmentModule !== 'function') return authoredHtml;
      // Respect a module's prerequisite gate.  A locked capstone does not
      // expose any learning stage, including its assessment, until its own
      // route has rendered the standard module navigation.
      if (!authoredHtml.includes('data-mquick-nav-rail')) return authoredHtml;
      const needsFoundations = /data-standard-foundations="true"/.test(authoredHtml);
      const needsGuidedLab = /data-standard-guided="true"/.test(authoredHtml);
      return `${authoredHtml}${moduleAssessmentModule(user, program, registeredDef.moduleKey, { needsFoundations, needsGuidedLab })}`;
    },
  };
  MODULE_LABS[`${def.program}/${def.moduleNumber}`] = registeredDef;
}

function moduleLabFor(programSlug, moduleNumber) {
  const registered = MODULE_LABS[`${programSlug}/${Number(moduleNumber)}`];
  if (registered) return registered;

  // A catalogue module without a bespoke lab file must still be a real module
  // route with the Academy stage contract.  This matters for draft courses as
  // much as published ones: adding a twelfth module to data.js can no longer
  // create a route that silently falls back to the program overview.
  const program = typeof PROGRAMS !== 'undefined'
    ? PROGRAMS.find((item) => item.slug === programSlug)
    : null;
  const module = program && Object.values(program.modules || {}).find((item) => Number(item.number) === Number(moduleNumber));
  if (!program || !module) return null;
  return {
    program: programSlug,
    moduleNumber: Number(moduleNumber),
    moduleKey: module.key,
    view(user, currentProgram) {
      const shell = `<div class="min-h-screen bg-slate-50">
        ${moduleTopbar(user, currentProgram)}
        ${moduleProgressShell([{ id: 'coursework', title: 'Foundations', type: 'lecture', isComplete: false, scrollId: `fallback-${module.key}-coursework`, gated: false }], { moduleKey: module.key })}
        <main class="max-w-3xl mx-auto px-6 py-16" id="fallback-${module.key}-coursework">
          <p class="text-xs font-bold uppercase tracking-[.16em] text-[#1e3a5f]">Module ${String(module.number).padStart(2, '0')}</p>
          <h1 class="mt-2 text-3xl font-bold text-[#1e3a5f]">${esc(module.title)}</h1>
          <p class="mt-4 text-slate-600 leading-7">${esc(module.summary || 'Curriculum content for this module is being authored.')}</p>
          <div class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Authoring status:</strong> The complete Learn It, Practice It, and Prove It structure is available now. Domain instruction and the guided activity will be added before this draft module is released.</div>
        </main>
      </div>`;
      return typeof moduleAssessmentModule === 'function'
        ? `${shell}${moduleAssessmentModule(user, currentProgram, module.key, { needsGuidedLab: true })}`
        : shell;
    },
  };
}

// A throw inside one module's wiring must not leave the rest of the page dead,
// so each is isolated. Same for message delivery.
function wireRegisteredModuleLabs() {
  Object.values(MODULE_LABS).forEach((def) => {
    if (typeof def.wire !== 'function') return;
    try {
      def.wire();
    } catch (error) {
      console.error(`module lab ${def.program}/${def.moduleNumber} wire() failed`, error);
    }
  });
}

function dispatchModuleLabMessage(event) {
  Object.values(MODULE_LABS).forEach((def) => {
    if (typeof def.onMessage !== 'function') return;
    try {
      def.onMessage(event);
    } catch (error) {
      console.error(`module lab ${def.program}/${def.moduleNumber} onMessage() failed`, error);
    }
  });
}

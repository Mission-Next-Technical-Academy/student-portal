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
  MODULE_LABS[`${def.program}/${def.moduleNumber}`] = def;
}

function moduleLabFor(programSlug, moduleNumber) {
  return MODULE_LABS[`${programSlug}/${Number(moduleNumber)}`] || null;
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

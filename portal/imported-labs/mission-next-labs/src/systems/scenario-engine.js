// Shared primitives for browser-only incident scenario simulations.
// Scenario state and files are local training data; no host commands execute.
(function () {
  function copy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function deny(reason) {
    return { ok: false, reason: String(reason || 'This action is not available in the scenario.') };
  }

  function createScenario(options = {}) {
    const fsFactory = options.fsFactory || options.buildFs || (() => ({}));
    const initialState = options.initialState || {};
    const commands = options.commands || {};
    const checks = options.checks || {};
    const phases = options.phases || {};
    return {
      buildFs: (...args) => fsFactory(...args),
      createState: () => copy(initialState),
      createSession: () => copy(initialState),
      dispatch(name, context) {
        const command = commands[name];
        return typeof command === 'function' ? command(context) : deny(`Unknown scenario command: ${name}`);
      },
      check(name, context) {
        const check = checks[name];
        return typeof check === 'function' ? check(context) : deny(`Unknown scenario check: ${name}`);
      },
      phase(name) {
        return phases[name] ? copy(phases[name]) : null;
      },
      phases: copy(phases),
      deny,
    };
  }

  window.MISSION_NEXT_SCENARIO_ENGINE = { createScenario, deny };
})();

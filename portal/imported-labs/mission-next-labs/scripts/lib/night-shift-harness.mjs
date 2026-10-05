// Shared headless harness for the Operation Night Shift lab checks.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');

export function loadApp() {
  const context = vm.createContext({ window: {}, console });
  const load = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  const loadBefore = (file, marker) => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const index = source.indexOf(marker);
    if (index < 0) throw new Error(`Marker not found in ${file}`);
    vm.runInContext(source.slice(0, index) + '\n})();', context, { filename: file });
  };
  for (const file of ['src/data/fixtures/operation-night-shift.js', 'src/data/labs/_schema.js', 'src/systems/virtualFs.js', 'src/systems/validator.js', 'src/systems/scenario-engine.js', 'src/systems/gating.js']) load(file);
  // The bash engine and the security-assessment command stubs precede their JSX components.
  loadBefore('src/shells/LinuxTerminalShell.jsx', '  // ─── React component');
  loadBefore('src/shells/security-assessments-shells.jsx', '  // ─── Neutral web traffic evidence inspector');
  for (const file of ['src/systems/night-shift-common.js', 'src/systems/linux-log-triage.js', 'src/systems/host-integrity.js', 'src/data/labs/security-assessments.labs.js']) load(file);
  return { window: context.window, context };
}

// A learner session against one lab: real virtual FS, real engine, real validator.
export function startSession(app, labId, options = {}) {
  const w = app.window;
  const lab = w.MISSION_NEXT_LABS[labId];
  const engine = labId === 'sa-4' ? w.MISSION_NEXT_LINUX_LOG_TRIAGE : w.MISSION_NEXT_HOST_INTEGRITY;
  const tree = options.tree || lab.environment.fs({ seed: options.seed, user: options.user, labId });
  const vfs = w.createVirtualFs(tree);
  const session = engine.createSession();
  const env = { vfs, cwd: '/home/analyst', user: 'analyst', host: 'host', history: [] };
  const steps = w.MISSION_NEXT_GATING.flattenSteps(lab);
  let latest = null;
  const api = {
    lab, engine, vfs, env, session, steps,
    get latest() { return latest; },
    run(line, activeStep) {
      latest = engine.runLine(env, line, session, { activeStep });
      return latest;
    },
    step(id) { return steps.find(step => step.id === id); },
    // Validate exactly as LabPlayer would: current command result and current simulated state.
    check(id, submission = '') {
      const step = api.step(id);
      return w.validateStep(step, { vfs, observed: latest ? latest.observed : {}, commandResult: latest }, submission);
    },
    // Run a command while its step is active; report whether that command completed the step.
    complete(id, line) {
      const step = api.step(id);
      api.run(line, step);
      return api.check(id, line);
    },
  };
  return api;
}

export const PHASES = ['preparation', 'detection', 'containment', 'eradication', 'recovery', 'postIncident'];
export const OBJECTIVE = /^(soc-\d{2}-lesson-\d{2}|SOC-101\.[1-8])$/;
export const INSTALL_SETUP = /\b(apt(-get)?\s+install|install(ing)?\b|aideinit|auditctl|logwatch|logrotate|splunk|elasticsearch|logstash|kibana|wget|dpkg|start (the )?(service|rsyslog)|restart rsyslog)\b/i;

export const hms = timestamp => /(\d{2}:\d{2}:\d{2})/.exec(timestamp)[1];

// Serialize a lab definition the way a browser can see it, including regex sources.
export function visibleDefinition(lab) {
  return JSON.stringify(lab, (key, value) => (value instanceof RegExp ? value.source : value));
}

// Values that would be answers for a seed, taken from the S2 fixture (independent of the engines).
export function answerLiterals(app, seed) {
  const fixture = app.window.MISSION_NEXT_OPERATION_NIGHT_SHIFT.generate(seed);
  const { truth, artifacts } = fixture;
  const linux = artifacts.linux;
  const times = [...truth.timeline.failedLogins, truth.timeline.linuxSuccess, truth.timeline.sudoUse, truth.timeline.auditStopped].map(hms);
  return [
    truth.identity.account, truth.identity.sourceIp, truth.resources.linuxHost, truth.timeline.linuxSuccess.slice(0, 10), ...times,
    linux.persistence.service, linux.persistence.unitPath, linux.persistence.executable, linux.persistence.listener, linux.persistence.listener.split(':').pop(),
    'auditd', 'other::rwx', 'other::---', '/etc/sudoers',
  ];
}

// Replace the fixture generator with one whose Linux facts were changed, then restore it.
export function withMutatedFixture(app, mutate, run) {
  const source = app.window.MISSION_NEXT_OPERATION_NIGHT_SHIFT;
  const original = source.generate;
  source.generate = seed => {
    const fixture = JSON.parse(JSON.stringify(original(seed)));
    mutate(fixture);
    return fixture;
  };
  try { return run(); } finally { source.generate = original; }
}

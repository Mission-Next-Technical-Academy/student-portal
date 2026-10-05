/* Versioned evidence-locker and case-reconstruction state for the Module 10
 * assessment. Every transition is pure: it validates against the fixture,
 * returns a new state and appends a frozen action record. Original evidence
 * metadata is never edited after intake; analyst notes are kept separately. */
const SocM10AssessmentState = (() => {
  'use strict';

  const VERSION = 1;
  const MODULE_KEY = 'soc-10';
  const MAX_HISTORY = 400;
  const METHODS = ['gateway_export', 'disk_image', 'triage_collection', 'log_export', 'memory_capture'];
  const REACQUIRABLE = ['log_export', 'triage_collection', 'gateway_export'];
  const STATEMENT_KINDS = ['fact', 'analysis', 'root_cause'];
  const UNKNOWN_TOPICS = ['exfiltration', 'memory', 'attribution', 'other'];
  const ESCALATION_ROUTES = ['digital-forensics', 'identity-response', 'legal'];
  const EMPTY = { locker: {}, notes: [], transfers: [], legalHold: null, exports: [], timeline: [], statements: [], unknowns: [], escalation: null, actionHistory: [], nextActionSequence: 1 };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const text = (value, max, label) => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed || trimmed.length > max) throw new Error(`${label} must be 1–${max} characters.`);
    return trimmed;
  };
  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(freeze);
    return value;
  }
  function scenarioOf(fixture) {
    if (!fixture?.scenario?.artifacts) throw new Error('M10 assessment fixture is required.');
    return fixture.scenario;
  }
  const artifactOf = (fixture, id) => {
    const artifact = scenarioOf(fixture).artifacts.find((item) => item.id === id);
    if (!artifact) throw new Error(`Unknown artifact ${id}.`);
    return artifact;
  };
  function timestampIn(fixture, timestamp) {
    const s = scenarioOf(fixture);
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp))
      || Date.parse(timestamp) < Date.parse(s.start) || Date.parse(timestamp) > Date.parse(s.end)) {
      throw new Error('M10 action timestamp must fall inside the scenario window.');
    }
    return new Date(Date.parse(timestamp)).toISOString();
  }

  function normalize(source, fixture) {
    const s = scenarioOf(fixture);
    const prior = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const known = new Set(s.artifacts.map((item) => item.id));
    const list = (value) => (Array.isArray(value) ? value : []);
    const locker = {};
    Object.entries(prior.locker && typeof prior.locker === 'object' ? prior.locker : {}).forEach(([id, item]) => {
      if (known.has(id) && item && typeof item === 'object') locker[id] = clone(item);
    });
    const history = list(prior.actionHistory).filter((item) => item && typeof item === 'object' && typeof item.id === 'string').slice(-MAX_HISTORY).map((item) => freeze(clone(item)));
    const last = history.reduce((max, item) => (Number.isSafeInteger(item.sequence) && item.sequence > max ? item.sequence : max), 0);
    return {
      ...clone(EMPTY),
      locker,
      notes: list(prior.notes).filter((item) => known.has(item?.artifactId)).map(clone),
      transfers: list(prior.transfers).filter((item) => known.has(item?.artifactId)).map(clone),
      legalHold: prior.legalHold && Array.isArray(prior.legalHold.artifactIds) ? clone(prior.legalHold) : null,
      exports: list(prior.exports).filter((item) => Array.isArray(item?.artifactIds)).map(clone),
      timeline: list(prior.timeline).filter((id) => known.has(id)),
      statements: list(prior.statements).filter((item) => STATEMENT_KINDS.includes(item?.kind)).map(clone),
      unknowns: list(prior.unknowns).filter((item) => UNKNOWN_TOPICS.includes(item?.topic)).map(clone),
      escalation: prior.escalation && ESCALATION_ROUTES.includes(prior.escalation.route) ? clone(prior.escalation) : null,
      actionHistory: history,
      nextActionSequence: Math.max(last + 1, Number.isSafeInteger(prior.nextActionSequence) ? prior.nextActionSequence : 1),
      schemaVersion: VERSION,
      scenarioId: s.id,
      // LabRuntime only restores a record that keeps its own identity fields.
      ...Object.fromEntries(['labId', 'anonymousStudentId'].filter((key) => typeof prior[key] === 'string').map((key) => [key, prior[key]])),
    };
  }

  function record(state, fixture, type, timestamp, details) {
    const next = normalize(state, fixture);
    if (next.actionHistory.length >= MAX_HISTORY) throw new Error('M10 action history limit reached.');
    const sequence = next.nextActionSequence;
    next.actionHistory = [...next.actionHistory, freeze({
      id: `${scenarioOf(fixture).id}:ACTION-${String(sequence).padStart(6, '0')}`, sequence, type, timestamp: timestampIn(fixture, timestamp), details: clone(details),
    })];
    next.nextActionSequence = sequence + 1;
    return next;
  }
  const lockerItem = (state, id) => {
    const item = state.locker[id];
    if (!item) throw new Error(`${id} is not in the evidence locker.`);
    return item;
  };

  // Pinned evidence enters the locker with its acquisition context. The
  // recorded hash is the one the source system reports.
  function intake(state, fixture, input, timestamp) {
    const artifact = artifactOf(fixture, input?.artifactId);
    const next = normalize(state, fixture);
    if (next.locker[artifact.id]) throw new Error(`${artifact.id} is already in the locker.`);
    const source = text(input.source, 200, 'Original source');
    const method = String(input.method || '');
    if (!METHODS.includes(method)) throw new Error('Choose an acquisition method.');
    const acquiredBy = text(input.acquiredBy, 64, 'Acquired by');
    const at = timestampIn(fixture, timestamp);
    next.locker[artifact.id] = { artifactId: artifact.id, type: artifact.type, source, method, acquiredAt: at, acquiredBy, recordedHash: artifact.sourceHash, acquisition: 1, integrity: 'unverified', verifiedHash: '', custodian: 'soc-analyst', incidentId: scenarioOf(fixture).incidentId };
    return record(next, fixture, 'intake', at, { artifactId: artifact.id, source, method, acquiredBy });
  }

  // Re-hash the acquired copy and compare with the recorded source hash.
  function verify(state, fixture, artifactId, timestamp) {
    const artifact = artifactOf(fixture, artifactId);
    const next = normalize(state, fixture);
    const item = lockerItem(next, artifact.id);
    const computed = item.acquisition > 1 && artifact.reacquiredVerificationHash ? artifact.reacquiredVerificationHash : artifact.verificationHash;
    item.verifiedHash = computed;
    item.integrity = computed === item.recordedHash ? 'verified' : 'mismatch';
    return record(next, fixture, 'verify', timestamp, { artifactId: artifact.id, acquisition: item.acquisition, computedHash: computed, integrity: item.integrity });
  }

  // A failed copy is re-acquired as a new acquisition; the failed result stays in history.
  function reacquire(state, fixture, artifactId, timestamp) {
    const next = normalize(state, fixture);
    const item = lockerItem(next, artifactId);
    if (item.integrity !== 'mismatch') throw new Error('Only an acquisition that failed verification is re-acquired.');
    if (!REACQUIRABLE.includes(item.method)) throw new Error('This acquisition method cannot be repeated; escalate instead.');
    item.acquisition += 1;
    item.integrity = 'unverified';
    item.verifiedHash = '';
    item.acquiredAt = timestampIn(fixture, timestamp);
    return record(next, fixture, 'reacquire', timestamp, { artifactId, acquisition: item.acquisition });
  }

  function note(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    lockerItem(next, input?.artifactId);
    const body = text(input.text, 1000, 'Analyst note');
    next.notes = [...next.notes, { id: `NOTE-${String(next.notes.length + 1).padStart(3, '0')}`, artifactId: input.artifactId, text: body, at: timestampIn(fixture, timestamp) }];
    return record(next, fixture, 'note', timestamp, { artifactId: input.artifactId });
  }

  function transfer(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    const item = lockerItem(next, input?.artifactId);
    const custodians = scenarioOf(fixture).custodians.map((entry) => entry.id);
    if (!custodians.includes(input.to) || input.to === item.custodian) throw new Error('Choose a different, known custodian.');
    if (item.integrity !== 'verified') throw new Error('Verify the artifact’s integrity before transferring custody.');
    const reason = text(input.reason, 500, 'Transfer reason');
    const at = timestampIn(fixture, timestamp);
    next.transfers = [...next.transfers, { id: `XFER-${String(next.transfers.length + 1).padStart(3, '0')}`, artifactId: item.artifactId, from: item.custodian, to: input.to, reason, hashAtTransfer: item.verifiedHash, at }];
    item.custodian = input.to;
    return record(next, fixture, 'transfer', at, { artifactId: item.artifactId, to: input.to, hashAtTransfer: item.verifiedHash });
  }

  function hold(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    const ids = [...new Set(Array.isArray(input?.artifactIds) ? input.artifactIds : [])];
    if (!ids.length) throw new Error('Select the originals to place under legal hold.');
    ids.forEach((id) => { if (lockerItem(next, id).integrity !== 'verified') throw new Error(`${id} must be verified before legal hold.`); });
    const reason = text(input.reason, 500, 'Legal hold reason');
    next.legalHold = { artifactIds: ids, reason, at: timestampIn(fixture, timestamp) };
    return record(next, fixture, 'legal_hold', timestamp, { artifactIds: ids });
  }

  function exportPackage(state, fixture, timestamp) {
    const next = normalize(state, fixture);
    if (!next.legalHold) throw new Error('Place the originals under legal hold before exporting a package.');
    const manifest = next.legalHold.artifactIds.map((id) => ({ artifactId: id, hash: lockerItem(next, id).verifiedHash, custodian: lockerItem(next, id).custodian }));
    next.exports = [...next.exports, { id: `PKG-${String(next.exports.length + 1).padStart(3, '0')}`, artifactIds: manifest.map((entry) => entry.artifactId), manifest, at: timestampIn(fixture, timestamp) }];
    return record(next, fixture, 'export', timestamp, { packageId: next.exports.at(-1).id, artifactIds: next.exports.at(-1).artifactIds });
  }

  function setTimeline(state, fixture, artifactIds, timestamp) {
    const next = normalize(state, fixture);
    const ids = [...new Set(Array.isArray(artifactIds) ? artifactIds : [])];
    ids.forEach((id) => lockerItem(next, id));
    next.timeline = ids;
    return record(next, fixture, 'timeline', timestamp, { artifactIds: ids });
  }

  function statement(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    if (!STATEMENT_KINDS.includes(input?.kind)) throw new Error('Choose fact, analysis or root cause.');
    const body = text(input.text, 1500, 'Statement');
    const ids = [...new Set(Array.isArray(input.artifactIds) ? input.artifactIds : [])];
    if (!ids.length) throw new Error('Cite the locker evidence this statement rests on.');
    ids.forEach((id) => lockerItem(next, id));
    next.statements = [...next.statements, { id: `STMT-${String(next.statements.length + 1).padStart(3, '0')}`, kind: input.kind, text: body, artifactIds: ids, at: timestampIn(fixture, timestamp) }];
    return record(next, fixture, 'statement', timestamp, { kind: input.kind, artifactIds: ids, text: body });
  }

  function removeStatement(state, fixture, statementId, timestamp) {
    const next = normalize(state, fixture);
    if (!next.statements.some((item) => item.id === statementId)) throw new Error('Statement not found.');
    next.statements = next.statements.filter((item) => item.id !== statementId);
    return record(next, fixture, 'statement_remove', timestamp, { statementId });
  }

  function unknown(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    if (!UNKNOWN_TOPICS.includes(input?.topic)) throw new Error('Choose what remains unknown.');
    const body = text(input.text, 800, 'Unknown');
    next.unknowns = [...next.unknowns, { id: `UNK-${String(next.unknowns.length + 1).padStart(3, '0')}`, topic: input.topic, text: body, at: timestampIn(fixture, timestamp) }];
    return record(next, fixture, 'unknown', timestamp, { topic: input.topic, text: body });
  }

  function escalate(state, fixture, input, timestamp) {
    const next = normalize(state, fixture);
    if (!ESCALATION_ROUTES.includes(input?.route)) throw new Error('Choose a specialist escalation route.');
    const reason = text(input.reason, 800, 'Escalation reason');
    const ids = [...new Set(Array.isArray(input.artifactIds) ? input.artifactIds : [])];
    ids.forEach((id) => lockerItem(next, id));
    next.escalation = { route: input.route, reason, artifactIds: ids, at: timestampIn(fixture, timestamp) };
    return record(next, fixture, 'escalation', timestamp, { route: input.route, artifactIds: ids, reason });
  }

  function runtime() {
    if (typeof LabRuntime === 'undefined') throw new Error('LabRuntime is required to access M10 assessment state.');
    return LabRuntime;
  }
  function load(user, fixture) {
    const key = scenarioOf(fixture).stateKey;
    const current = runtime().loadCaseState(key, MODULE_KEY, user, {});
    const normalized = normalize(current, fixture);
    if (JSON.stringify(current) !== JSON.stringify(normalized)) runtime().saveCaseState(key, MODULE_KEY, user, normalized);
    return normalized;
  }
  function save(user, state, fixture) {
    return runtime().saveCaseState(scenarioOf(fixture).stateKey, MODULE_KEY, user, normalize(state, fixture));
  }
  function reset(user, fixture) {
    const key = scenarioOf(fixture).stateKey;
    const fresh = runtime().resetCaseState(key, MODULE_KEY, user, {});
    return runtime().saveCaseState(key, MODULE_KEY, user, normalize(fresh, fixture));
  }

  return Object.freeze({ VERSION, MODULE_KEY, METHODS, REACQUIRABLE, STATEMENT_KINDS, UNKNOWN_TOPICS, ESCALATION_ROUTES, normalize, intake, verify, reacquire, note, transfer, hold, exportPackage, setTimeline, statement, removeStatement, unknown, escalate, load, save, reset });
})();

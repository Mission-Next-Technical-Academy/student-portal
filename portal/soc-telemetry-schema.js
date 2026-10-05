/* SOC telemetry schema contract and fixture validator.
 *
 * Dependency-free, side-effect-free, data-only. Defines the canonical event
 * envelope (see docs/telemetry/SOC_TELEMETRY_SCHEMA.md) and validators that
 * report problems as { ok, errors[], warnings[] } instead of throwing.
 * Normalization is additive: native source fields are never removed.
 */
const SocTelemetrySchema = (() => {
  'use strict';

  // Single empty-value convention: null (preferred in structured fixtures).
  // Legacy console rows may carry '' or the display placeholder '—'; all three
  // mean "not applicable / not observed" and are treated identically here.
  const EMPTY_PLACEHOLDERS = ['', '—'];

  // Canonical field -> accepted aliases (first match wins). Aliases let
  // fixtures with module-specific key names validate without being rewritten.
  const FIELDS = {
    EventId: { required: true, aliases: ['EventId', 'id', 'raw_event_id'] },
    TimeGenerated: { required: true, aliases: ['TimeGenerated', 'time', 'timestamp_utc'] },
    EventType: { required: true, aliases: ['EventType', 'eventType', 'type'] },
    EventSource: { required: false, aliases: ['EventSource', 'source', 'source_type'] },
    Account: { required: false, aliases: ['Account', 'account', 'user', 'identity'] },
    Host: { required: false, aliases: ['Host', 'host', 'hostname'] },
    DeviceId: { required: false, aliases: ['DeviceId', 'deviceId', 'device'] },
    Result: { required: false, aliases: ['Result', 'result', 'outcome'] },
    SourceIp: { required: false, aliases: ['SourceIp', 'sourceIp', 'src_ip'], optional: true },
    DestinationIp: { required: false, aliases: ['DestinationIp', 'destination'], optional: true },
    Domain: { required: false, aliases: ['Domain'], optional: true },
    Url: { required: false, aliases: ['Url', 'url'], optional: true },
    SessionId: { required: false, aliases: ['SessionId', 'session_id'], optional: true },
    ProcessId: { required: false, aliases: ['ProcessId', 'processId'], optional: true },
    ParentProcessId: { required: false, aliases: ['ParentProcessId', 'parentProcessId'], optional: true },
    CorrelationId: { required: false, aliases: ['CorrelationId'], optional: true },
    Action: { required: false, aliases: ['Action', 'action'], optional: true },
    Detail: { required: false, aliases: ['Detail'], optional: true },
    RawEvent: { required: false, aliases: ['RawEvent'], optional: true },
    RawTimestamp: { required: false, aliases: ['RawTimestamp', 'raw_timestamp'], optional: true },
    IngestionTime: { required: false, aliases: ['IngestionTime'], optional: true },
    Collector: { required: false, aliases: ['Collector'], optional: true },
    CoverageStatus: { required: false, aliases: ['CoverageStatus'], optional: true },
  };

  // Required: must be present and non-empty or validation fails (error).
  // Recommended: expected on most events; absence is a warning, because some
  // records legitimately lack them (e.g. no Host on an identity-only record).
  // Optional: relationship/network/ops keys; absence is never reported.
  const REQUIRED = ['EventId', 'TimeGenerated', 'EventType'];
  const RECOMMENDED = ['EventSource', 'Account', 'Result'];
  const ENTITY_FIELDS = ['Account', 'Host', 'DeviceId'];

  // Normalized Result vocabulary. The source-native outcome is retained in the
  // native field (or an additive NativeResult field); it is never overwritten.
  const RESULT_VALUES = ['Success', 'Failure', 'Blocked', 'Allowed', 'Delayed', 'Interrupted', 'Unknown'];

  const ISO_UTC = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/;
  const ISO_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

  function isEmpty(value) {
    return value === null || value === undefined || (typeof value === 'string' && EMPTY_PLACEHOLDERS.includes(value));
  }

  function get(event, canonical) {
    const def = FIELDS[canonical];
    if (!event || !def) return undefined;
    for (const key of def.aliases) {
      if (event[key] !== undefined && !isEmpty(event[key])) return event[key];
    }
    return undefined;
  }

  function isIsoUtc(value) {
    if (typeof value !== 'string') return false;
    const m = ISO_UTC.exec(value);
    if (!m) return false;
    const [, y, mo, d, h, mi, s] = m.map(Number);
    if (mo < 1 || mo > 12 || h > 23 || mi > 59 || s > 59) return false;
    const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  }

  const RESULT_MAP = {
    success: 'Success', succeeded: 'Success', ok: 'Success', created: 'Success',
    failure: 'Failure', failed: 'Failure', fail: 'Failure', error: 'Failure',
    blocked: 'Blocked', denied: 'Blocked', prevented: 'Blocked',
    allowed: 'Allowed', permitted: 'Allowed',
    delayed: 'Delayed', interrupted: 'Interrupted',
  };
  // Best-effort mapping of a native outcome to the normalized vocabulary.
  // Callers keep the native value alongside; unmapped values become 'Unknown'.
  function normalizeResult(native) {
    if (isEmpty(native)) return 'Unknown';
    return RESULT_MAP[String(native).trim().toLowerCase()] || 'Unknown';
  }

  function msOf(value) {
    return typeof value === 'string' ? Date.parse(value) : NaN;
  }

  function toSet(list) {
    return new Set((list || []).map((v) => (v && typeof v === 'object' ? v.id : v)));
  }

  /* validateEvents(events, opts)
   * opts.start / opts.end        ISO UTC scenario window (inclusive)
   * opts.entities                { Account: [...], Host: [...], DeviceId: [...] } inventory; omitted = skipped
   * opts.entitySeverity          'error' (default) | 'warning' for unresolved entity refs
   * opts.eventRefFields          event keys holding arrays of event IDs (default ['relatedEventIds'])
   * opts.native                  original native records; each must survive in `events` with equal values
   * opts.nativeFields            restrict the native comparison to these keys
   * opts.required / recommended  override the field lists
   * opts.label                   prefix for messages
   */
  function validateEvents(events, opts) {
    const o = opts || {};
    const errors = [];
    const warnings = [];
    const tag = o.label ? `${o.label}: ` : '';
    const err = (m) => errors.push(`${tag}${m}`);
    const warn = (m) => warnings.push(`${tag}${m}`);
    try {
      if (!Array.isArray(events)) {
        err('events must be an array');
        return { ok: false, errors, warnings };
      }
      const required = o.required || REQUIRED;
      const recommended = o.recommended || RECOMMENDED;
      const startMs = o.start ? msOf(o.start) : NaN;
      const endMs = o.end ? msOf(o.end) : NaN;
      if ((o.start && Number.isNaN(startMs)) || (o.end && Number.isNaN(endMs))) err('opts.start/end must be ISO-8601 UTC');
      const refFields = o.eventRefFields || ['relatedEventIds'];
      const seen = new Map();
      const ids = new Set(events.map((e) => get(e, 'EventId')).filter((v) => v !== undefined));
      const inventory = {};
      Object.keys(o.entities || {}).forEach((k) => { inventory[k] = toSet(o.entities[k]); });
      const entityReport = o.entitySeverity === 'warning' ? warn : err;
      const procs = new Map();
      events.forEach((e) => {
        const dev = get(e, 'DeviceId') || get(e, 'Host');
        const pid = get(e, 'ProcessId');
        if (pid !== undefined) procs.set(`${dev}|${pid}`, true);
      });

      events.forEach((event, index) => {
        const id = get(event, 'EventId');
        const where = id !== undefined ? `event ${id}` : `event[${index}]`;
        if (!event || typeof event !== 'object') { err(`${where} is not an object`); return; }
        required.forEach((f) => { if (get(event, f) === undefined) err(`${where} missing required field ${f}`); });
        recommended.forEach((f) => { if (get(event, f) === undefined) warn(`${where} missing recommended field ${f}`); });

        if (id !== undefined) {
          if (seen.has(id)) err(`${where} duplicate EventId (also at index ${seen.get(id)})`);
          else seen.set(id, index);
        }

        const time = get(event, 'TimeGenerated');
        if (time !== undefined) {
          if (!isIsoUtc(time)) err(`${where} TimeGenerated "${time}" is not ISO-8601 UTC (YYYY-MM-DDTHH:MM:SSZ)`);
          else {
            const t = Date.parse(time);
            if (!Number.isNaN(startMs) && t < startMs) err(`${where} TimeGenerated ${time} is before window start ${o.start}`);
            if (!Number.isNaN(endMs) && t > endMs) err(`${where} TimeGenerated ${time} is after window end ${o.end}`);
          }
        }
        const raw = get(event, 'RawTimestamp');
        if (raw !== undefined) {
          if (!ISO_OFFSET.test(String(raw))) warn(`${where} RawTimestamp "${raw}" is not ISO-8601 with offset`);
          else if (time !== undefined && isIsoUtc(time) && Date.parse(raw) !== Date.parse(time)) {
            err(`${where} RawTimestamp ${raw} does not equal TimeGenerated ${time} after offset conversion`);
          }
        }

        const result = get(event, 'Result');
        if (result !== undefined && !RESULT_VALUES.includes(String(result)) && !RESULT_VALUES.map((v) => v.toLowerCase()).includes(String(result).toLowerCase())) {
          warn(`${where} Result "${result}" is source-native, not in normalized set (${RESULT_VALUES.join('/')})`);
        }

        ENTITY_FIELDS.forEach((f) => {
          if (!inventory[f]) return;
          const v = get(event, f);
          if (v !== undefined && !inventory[f].has(v)) entityReport(`${where} ${f} "${v}" not found in entity inventory`);
        });

        refFields.forEach((rf) => {
          const refs = event[rf];
          if (refs === undefined || refs === null) return;
          if (!Array.isArray(refs)) { err(`${where} ${rf} must be an array`); return; }
          refs.forEach((r) => { if (!ids.has(r)) err(`${where} ${rf} references unknown event ${r}`); });
        });

        const pid = get(event, 'ProcessId');
        const ppid = get(event, 'ParentProcessId');
        if (ppid !== undefined) {
          const dev = get(event, 'DeviceId') || get(event, 'Host');
          if (!procs.has(`${dev}|${ppid}`)) warn(`${where} ParentProcessId ${ppid} has no process record on ${dev}`);
          if (pid !== undefined && String(pid) === String(ppid)) err(`${where} ProcessId equals ParentProcessId`);
        }
      });

      if (Array.isArray(o.native)) {
        const byId = new Map(events.map((e) => [get(e, 'EventId'), e]));
        o.native.forEach((n) => {
          const nid = get(n, 'EventId');
          const e = byId.get(nid);
          if (!e) { err(`native event ${nid} is missing from normalized events`); return; }
          (o.nativeFields || Object.keys(n)).forEach((k) => {
            if (n[k] === undefined) return;
            if (!(k in e)) err(`event ${nid} lost native field ${k}`);
            else if (JSON.stringify(e[k]) !== JSON.stringify(n[k])) err(`event ${nid} native field ${k} was altered`);
          });
        });
      }
    } catch (ex) {
      err(`validator failure: ${ex && ex.message}`);
    }
    return { ok: errors.length === 0, errors, warnings };
  }

  /* validateScenario(scenario, opts)
   * scenario: { events, start, end, entities, alerts: [{ id, eventIds|evidenceEventIds }],
   *             references: [{ name, eventIds }] }
   * opts are merged over the scenario (opts win) and passed to validateEvents.
   * Alert and reference event IDs must resolve to existing events.
   */
  function validateScenario(scenario, opts) {
    const s = scenario || {};
    const o = Object.assign({ start: s.start, end: s.end, entities: s.entities }, opts || {});
    const base = validateEvents(s.events, o);
    const errors = base.errors.slice();
    const warnings = base.warnings.slice();
    const tag = o.label ? `${o.label}: ` : '';
    try {
      const ids = new Set((Array.isArray(s.events) ? s.events : []).map((e) => get(e, 'EventId')).filter((v) => v !== undefined));
      (s.alerts || []).forEach((a, i) => {
        const aid = a && a.id !== undefined ? a.id : `alert[${i}]`;
        const refs = (a && (a.eventIds || a.evidenceEventIds)) || [];
        if (!Array.isArray(refs)) { errors.push(`${tag}alert ${aid} evidence refs must be an array`); return; }
        if (a && a.requireEvidence && refs.length === 0) errors.push(`${tag}alert ${aid} has no evidence references`);
        if (!refs.length && !(a && a.requireEvidence)) warnings.push(`${tag}alert ${aid} carries no event-ID evidence references`);
        refs.forEach((r) => { if (!ids.has(r)) errors.push(`${tag}alert ${aid} references unknown event ${r}`); });
      });
      (s.references || []).forEach((ref) => {
        (ref.eventIds || []).forEach((r) => { if (!ids.has(r)) errors.push(`${tag}reference ${ref.name} points to unknown event ${r}`); });
      });
    } catch (ex) {
      errors.push(`${tag}validator failure: ${ex && ex.message}`);
    }
    return { ok: errors.length === 0, errors, warnings };
  }

  const contract = {
    schemaVersion: 1,
    fields: FIELDS,
    required: REQUIRED,
    recommended: RECOMMENDED,
    entityFields: ENTITY_FIELDS,
    resultValues: RESULT_VALUES,
    emptyConvention: { preferred: null, tolerated: EMPTY_PLACEHOLDERS },
    nativePreservation: 'Normalization is additive: native fields and values are never deleted or altered; normalized fields are added beside them.',
  };

  return Object.freeze({ contract, get, isEmpty, isIsoUtc, normalizeResult, validateEvents, validateScenario });
})();

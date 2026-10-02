# SOC Telemetry schema contract

Implements Sprint 1 of `docs/SOC_TELEMETRY_AUDIT_AND_SPRINT_ROADMAP.md`.
Code: `portal/soc-telemetry-schema.js` (global `SocTelemetrySchema`, loaded in
`portal/index.html` before `soc-analyst-module-03-environment.js`; no UI effect).
Test: `tests/soc-telemetry-schema.test.js`.

## Canonical fields

Fixtures may keep module-specific key names; the validator resolves each
canonical field through aliases (`SocTelemetrySchema.contract.fields`).

| Canonical | Level | Accepted keys |
|---|---|---|
| `EventId` | required | EventId, id, raw_event_id |
| `TimeGenerated` | required | TimeGenerated, time, timestamp_utc |
| `EventType` | required | EventType, eventType, type |
| `EventSource` | recommended | EventSource, source, source_type |
| `Account` | recommended | Account, account, user, identity |
| `Result` | recommended | Result, result, outcome |
| `Host`, `DeviceId` | optional (entity-checked if inventory given) | Host/host/hostname; DeviceId/deviceId/device |
| `SourceIp`, `DestinationIp`, `Domain`, `Url`, `SessionId`, `ProcessId`, `ParentProcessId`, `CorrelationId`, `Action`, `Detail`, `RawEvent`, `RawTimestamp`, `IngestionTime`, `Collector`, `CoverageStatus` | optional | see `contract.fields` |

Required missing = error. Recommended missing = warning (some records
legitimately lack them). Optional missing = silent. Source-specific fields
(AuthMethod, sha256, taskName, ...) are always allowed and untouched.

## Null / empty convention

Absent or not-applicable values are `null` in structured fixtures. Legacy
console rows use `''` or the placeholder `'—'` (Module 3 display); the
validator treats all three as empty. Do not use other sentinels.

## Result

Normalized values: `Success, Failure, Blocked, Allowed, Delayed, Interrupted,
Unknown`. The source-native outcome stays in its native field (e.g. M05
`detected_not_prevented`, M06 `approved_maintenance`); a native value outside
the normalized set is a warning, never rewritten. `normalizeResult(native)`
gives a best-effort mapping for adapters.

## Native preservation

Normalization is additive. Never delete or alter native fields. Pass
`opts.native` (original records) to `validateEvents`; any native field missing
or changed on the normalized copy is an error.

## Validator

```js
SocTelemetrySchema.validateEvents(events, {start, end, entities, entitySeverity, eventRefFields, native, nativeFields, label})
SocTelemetrySchema.validateScenario({events, start, end, entities, alerts:[{id, eventIds}], references:[{name, eventIds}]}, opts)
// -> { ok, errors[], warnings[] }   (never throws, no side effects)
```

Checks: unique EventIds; ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`, real calendar
date); window bounds; RawTimestamp offset equals TimeGenerated; entity refs
resolve in `opts.entities`; `relatedEventIds`, alert evidence and truth
references resolve to event IDs; ParentProcessId has a process record on the
same device; native fields preserved.

Run: `node tests/soc-telemetry-schema.test.js` (set `SHOW_WARNINGS=1` to list
warnings).

## Applied to M03-M06: results

Module 3 practice/prove (records, per-source tables, UnifiedEvents), M04, M05
and M06 fixtures all pass with zero errors. No data defects were found, so no
fixture was changed. Warnings (intentional, left as-is):

- M03: service/host identities (`svc-backup`, `billing-app`, `idp-02`,
  `mail-gw`) are not in `IdentityInfo`; adding them would change the visible
  Entities tab.
- M04: telemetry has no `EventSource`/`Host` field.
- M05/M06: native `result` values (`created`, `malicious`, `started`,
  `signed_binary`, ...) are outside the normalized Result set; native outcome
  is retained by design.

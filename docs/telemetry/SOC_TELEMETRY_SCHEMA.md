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

## Entity identity contract

Goal: an analyst pivot such as `| where Host == "ws-118"` or
`| where Account == "acct-112"` must work across modules. The mock KQL engine
(`portal/kql-engine.js`) compares `==`, `!=`, `join` and `summarize by` keys
**case-sensitively** (`mockKqlCompare` uses strict string equality); only
`has`, `contains`, `startswith`, `endswith`, `in` and `has_any` fold case.
Nothing in `soc-analyst-module-03-environment.js` normalizes Host/Account case
(`M03E_UNIFIED_FIELDS` copies values verbatim). So casing is a real pivot
breaker, not cosmetic. Enforced (report-only) by
`node scripts/soc-entity-identity-lint.js` -> `docs/telemetry/ENTITY_IDENTITY_LINT.md`.

### Host and DeviceId

| Rule | Decision |
|---|---|
| Case | **Lower-case.** M03 (baseline), M04, M09, M11 and M12 (integrated capstone) are already lower; M01/M02/M05-M08/M10 are upper. Raw majority is slightly upper (about 700 upper vs 600 lower rows; 7 upper modules vs 5 lower), so the decision rests on the baseline and capstone: M03 and M12 are the reference contracts and every later module pivots into them; the KQL engine is case-sensitive; DNS/hostname convention is lower-case. Converting upper to lower touches only values, never structure. |
| Form | A single hostname token `^[a-z0-9][a-z0-9._-]*$`, e.g. `ws-118`, `fs-01`, `wkstn-42`. No spaces, parentheses or annotations. A FQDN may be used only if used consistently in every table of the scenario. |
| Host vs DeviceId | **`DeviceId` equals `Host`** (same string) wherever both exist. Do not use `DeviceId` for a separate inventory/agent id (`M05-DEV-005`, `DEV-294`); keep such ids in an additive field (`AssetId`) and, if joins need them, in the asset inventory/lookup table keyed by `Host`. |
| Non-host rows | When the row is not about a host (alert queue, shift log, email events), `Host` is `null`, or the table has no `Host` key. It is never a title, sentence or label. Network/identity services (`idp-02`, `fw-edge-01`, `mail-edge-02`) are hosts and are written in the same form. |
| Free text | Descriptions, alert titles, check names and annotations belong in `Detail`, `EventType`, `Title` or a table-specific field (`CheckName`, `AlertTitle`). Never in `Host`, `DeviceId` or `Account`. Display-only annotations such as `(unmanaged)` go in a separate field (`DeviceClass`, `Management`). |
| Descriptive device column | A column holding a device description ("Managed workstation") is `DeviceClass`, not `Device`. |

### Account

`Account` is the **normalized principal** used for pivots: lower-case, no
whitespace, matching `^[a-z0-9][a-z0-9._-]*$`, with the domain/realm stripped.
Native or qualified forms are preserved additively, never as the pivot key.

| Form | Where it lives | Allowed in `Account`? |
|---|---|---|
| Person: `a.okafor`, `p.shah`, or the course pseudonym `acct-112` | `Account` | yes (both styles allowed; a scenario may use either, both are lower-case tokens) |
| Service / automation: `svc-backup`, `backup-job`, `siem-rules` | `Account` | yes |
| Analyst/actor in ops tables: `an-morgan`, `soc-analyst` | `Account` | yes |
| Well-known principals: `SYSTEM`, `NT AUTHORITY\SYSTEM`, `LOCAL SERVICE` | `Account` = `system`, `local-service`, `network-service` (lower-case, realm dropped); the native text stays in `AccountNative` / `RawEvent` | lower-case short form only |
| Domain-qualified `CORP\p.shah` | `Account` = `p.shah`; `AccountDomain` = `corp`; native string in `AccountNative` / `RawEvent` | no, never as `Account` |
| UPN / email `p.shah@missionnextlabs.example` | `AccountUpn` (identity/mail sources) and `RawEvent`; `Account` = `p.shah` | no, never as `Account` |
| Placeholders (`unassigned`, `unknown`, `All staff`, `-`) | `null`; group recipients go in a `Recipient`/`Audience` field | no |

Realism note: real SIEMs do carry `DOMAIN\user`, UPNs and `NT AUTHORITY\SYSTEM`.
They stay visible to the learner in the native/raw fields (Module 3 already
keeps raw source text next to the normalized columns); only the normalized
`Account` column is flattened so one `where Account == ...` pivot spans
identity, endpoint and email tables.

#### When `Account` may be empty

Empty/`null` is allowed only where no authenticated principal exists:
`FirewallEvents`, `NetworkSessionEvents`, `DnsEvents`, `TlsEvents`,
`ProxyEvents` (unauthenticated flows), and `IpIntel`. Email, endpoint, identity,
evidence, scope/response and operations tables must carry an Account (the
recipient for `EmailUrlEvents`/`EmailAttachmentEvents`, the acting service for
automated rows, `system` for OS-initiated activity). For records with no
sensible subject use a fixed service principal rather than blank.

### Source vs EventSource vs SourceSystem

| Field | Meaning | Rule |
|---|---|---|
| `EventSource` | the feed/table the row belongs to | must equal the console table name (`AuthLog`, `DeviceProcessEvents`, ...) |
| `SourceSystem` | the originating system/collector of the record (M10: where an artifact was acquired from) | optional, a lower-case system id, same form as `Host` |
| `Source` | free-text provenance note (M08: "Synthetic service-owner note") | **not a canonical key.** Rename to `SourceNote` (free text) in phase 2; keep out of Host/EventSource |

The validator aliases `source` to `EventSource` (see Canonical fields), which
is the reason a bare `Source` key holding free text is ambiguous and must go.

### Lint rules (ids used in the report)

H1 host not lower-case | H2 host holds free text | H3 Host differs from DeviceId |
H4 Host key present but empty on a host-bearing table | A1 domain-qualified/UPN
in Account | A2 Account not lower-case | A3 Account free text/placeholder |
A4 Account empty where required | K1 non-canonical key (`Source`, `Device`,
`Hostname`) | S1 `EventSource` differs from the table name.

The lint is report-only (exit 0); `--strict` exits 1 and is intended for CI once
phase 2 (per-module fixture cleanup, see the fix plan in `ENTITY_IDENTITY_LINT.md`)
has landed.

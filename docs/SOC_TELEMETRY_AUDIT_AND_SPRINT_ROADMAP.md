# SOC Telemetry Audit and Sprint Roadmap

**Status:** ✅ Sprints 0–6, open-items pass 1, entity identity phase 2 (M02, M04–M12) and Sprint 7 density top-up done 2026-10-02; only M01 identity (owner-coordinated) remains\
**Audit date:** 2026-10-02\
**Scope:** SOC Analyst course Modules 1–12; synthetic logs, alerts, tables, schemas, and analyst search experience\
**Guardrails:** Preserve the Academy UI, module/Learn-Practice-Prove structure, and lab identities. Increase available telemetry progressively across modules; do not redesign the course or expose later-module answers early.

## Next AI — start here (2026-10-02, after entity identity phase 2 + Sprint 7)

Every change is data-first and local (not pushed). The full `tests/*.test.js` suite passes: 77/77. To regenerate the reports, run `node scripts/soc-telemetry-inventory.js > docs/telemetry/SOC_TELEMETRY_INVENTORY.md`, then the same script with `--json > docs/telemetry/soc-telemetry-inventory.json`. The entity lint is `node scripts/soc-entity-identity-lint.js`, which writes `docs/telemetry/ENTITY_IDENTITY_LINT.md`.

**Assessment progression (unique events / tables / alerts):** M01 46/1/1 · M02 imported · M03 33/4/5 · M04 37/4/0 (rule-generated) · M05 52/7/5 · M06 63/6/4 · M07 75/9/6 · M08 86/7/6 · M09 97/8/7 · M10 106/8/1 · M11 117/6/12 · M12 167/22/14. From M03 to M12, unique events now rise at every step. Before this pass there were dips at M06, M08 and M11.

**Entity identity lint:** 2018 violations went down to 55. All 55 are in M01, which has 55 rows in the shared `portal/data.js`. M02–M12 have 0 violations.

**Done 2026-10-02 (one sub-agent per module in an isolated worktree, cherry-picked onto master):**
- **M02:** display device names are lower-case (`wkstn-17` …).
- **M04:**
  - The AuthLog descriptive `Device` key is now `DeviceClass` in the fixtures, the rule evaluator and the rules UI. A legacy `Device` rule field is still evaluated as `DeviceClass`.
  - Removed the unreachable independent-lab state and handlers (open item 3). Saved `independentLab` data still loads unchanged.
- **M05:**
  - Account changes: `CORP\x` becomes `x`, with `AccountDomain` `corp` and the original in `AccountNative`. `SYSTEM` becomes `system`.
  - Host = DeviceId = `ws-*`. The inventory ids `M05-DEV-*` and `M05-GUIDE-*` moved to `AssetId`, and ChangeTickets `Device` became `Host`.
  - `SocM05AssessmentState.canonicalDeviceId/Refs` maps legacy saved ids and upper-case hostnames, so the same picks earn the same score.
  - The raw-record view keeps native values through dual sourceMappings (`device_id`→DeviceId and →AssetId; `user`→Account and →AccountNative).
- **M06:**
  - Hosts are lower-case, and ChangeTickets `Device` became `Host`.
  - **Density:** assessment 51→63, guided 50→61, made of signed scheduled tasks on comparison hosts, mid-window heartbeats and signed binary inventory. A scheduled task on ws-318 was deliberately avoided because it changed the saved query result.
- **M07:**
  - Hosts are lower-case. EmailUrlEvents Account is now the recipient, taken from the matching EmailEvents row by NetworkMessageId.
  - Device ids in actions are lower-cased, Prove It device scoring ignores case, and saved upper-case ids are rewritten on load.
- **M08:**
  - Hosts and asset ids are lower-case. FindingEvidence and AssetEvidence `Source` became `SourceNote`, and AssetInventory `Hostname` became `Host`.
  - **Density:** 66→86, with new ScanRuns SCAN-008..016 and PatchRecords PATCH-005..015. No new findings were added.
- **M09:**
  - Host = DeviceId = hostname, with `DEV-*` moved to `AssetId`. The unmanaged client is `unmanaged-173` (guided `unmanaged-294`), and its label moved to `deviceClass`.
  - ScopeChecks labels moved to `CheckName`. Rows that are not about a host have no Host key.
  - Blank accounts were filled with `system`, `soc-analyst` or `svc-backup`.
  - Scenario entity ids (DEV-173, session-173-REMOTE) are unchanged in the scorer and state.
  - **Density:** 70→97 (T-055..T-081), with no new tables or alerts.
- **M10:**
  - Hosts are lower-case, and `SYSTEM` became `system`. Hashes, the custody ledger and ART-03's mismatch are unchanged.
  - The rubric's acquisition source-label match ignores case.
  - **Open item 2 fixed:** the shared host was a hard-coded `EVIDENCE-STAGING`, now `scenario.stagingHost` (guided: `evidence-stage-2`). Guided OS rows now run as `local-service`.
- **M11:**
  - The alert title moved out of Host into `AlertTitle`. Each queue item has a real `host` (a service host for account alerts).
  - AlertQueue `Account` is now `siem-rules`, the rule engine. The assignee moved to `AssigneeId`, which is null when unassigned.
  - Queue metrics are unchanged: 12 / 7 / 17.3 / 46.7.
  - **Density:** 95→117, made of assignment, page-ack, collector heartbeat and ShiftLog rows.
- **M12:**
  - `SOC-04` became `soc-04`. `All staff` became the `all-staff` token, with the display text in `Audience`.
  - AL-1201 queue entry gained `at: '09:14:00'` (open item 4).
- **Shared:**
  - `portal/kql-engine.js` result columns are now the union of keys across result rows (previously only the first row's keys), so Host no longer disappears when the first row lacks it. Test: `tests/kql-engine-columns.test.js`.
  - New tests `tests/soc-telemetry-sprint7-m06|m08|m09|m11.test.js`.

**Open items:**
1. **M01 identity (55 violations), which needs owner coordination.** The rows live in the shared `portal/data.js`. The work is display-only: lower-case the device names, drop `(unmanaged)` from Host, and fix the `—` empty hosts. The answer key has `LAP-442`.
2. **CI `--strict`: done 2026-10-09.** `bin/ci-check.sh` runs `node scripts/soc-entity-identity-lint.js --strict --no-write`. M01 is excluded through `STRICT_EXEMPT_MODULES` in the lint (its 55 violations are still in the report). Remove M01 from that set once its identity fix lands.
3. **Lint vs contract: done 2026-10-09.** The contract has one rule for null fields. A `Host` may be null only on non-host rows (alert queue, shift log, email, identity), so the lint's `HOST_EXEMPT_EMPTY` now includes `AlertQueue` and `ShiftLog`. Elsewhere an empty Host is H4. `Account` stays required on every table except the network/unauthenticated set, per the contract's "When Account may be empty". Alert-queue rows must use a service principal, not blank, so A4 stays. No M02–M12 fixture had a null or empty Host or Account, so no data changed.
4. **Event ceilings in older sprint tests.** The Sprint 4 test caps M09 at 100 (now 97), and the Sprint 5 test caps M11 non-queue events at 120 (now 117). Raise those bands before any further top-up.
5. **Learner console queries are not migrated.** A query typed before this change (for example `Host == "WKSTN-19"`) now returns 0 rows, because `==` is case-sensitive. These queries are not scored.
6. **Needs Alex:** M04: decide whether the below-threshold decoy groups belong in `truth.rule.excludeEventIds`.
7. **M04:** a station/click handler block after the early `return;` in `moduleFourRenderGuided` also looks unreachable. It has not been touched.
8. **Not verified in a signed-in browser.** Only the node suites, fixture validation, lint and inventory have run.

**Why identity matters:** the mock KQL engine compares `==`, `!=`, `join` and `summarize` keys case-sensitively, so `WS-204` vs `ws-204` breaks real pivots.

## Executive assessment

The course has a meaningful SOC investigation foundation, but “real CLI” needs a precise answer:

- The main SOC experience is a **browser-based console** with a custom KQL-like editor/evaluator and analyst workspaces. It is not a real operating-system shell or a vendor CLI. Modules 3 onward use `portal/soc-analyst-module-03-environment.js` and `portal/kql-engine.js`; later console capabilities are composed through `portal/soc-console-tools.js`.
- The browser console does model several authentic work patterns: source-specific tables, queryable normalized events, newest-first results that require timeline sorting, alert queues, evidence selection, pivots, enrichment, response records, and saved analyst work. This is substantially more than decorative log text.
- Field standardization is **present but inconsistent at the data-contract level**. Module 3 has explicit native-to-normalized mappings and a unified event view. Modules 5–6 define useful telemetry schemas. Many later fixtures are transformed into the shared console shape at runtime, but the source contracts do not all declare the same required fields, null semantics, units, or normalization rules.
- The realism problem is mostly **evidence density and progression**, not a missing console UI. Several labs contain compact answer-bearing evidence slices. There is too little routine/benign activity, operational noise, duplicate/near-match evidence, coverage information, and decoy-but-explainable alerts to make triage consistently require analyst sifting. Some modules are primarily non-SIEM labs and should gain relevant evidence through their current lab surfaces rather than be converted into a new console.
- The intended accumulation exists architecturally: Modules 4–11 compose cumulative packs over the Module 3 console, while Module 12 exposes the integrated range. That does not yet guarantee a smooth rise in row volume, source breadth, alert volume, or distractor complexity. The capstone is not the only module that should feel investigative; each module should add a bounded, learnable increment.

**Answer to the question:** We have recognizable SIEM-style investigation behavior and some standardized fields, but the data is not uniformly deep or consistently noisy enough yet to feel like a real analyst sift across all 12 modules. The next work should enrich the data fixtures and schema contracts, retaining all current UI and lab boundaries.

## Scope and evidence limits

This is a repository/source audit, with read-only checks of the running local static server response. No files outside this report were changed. The login page was not authenticated in a browser, so this report does not claim to have observed the rendered, signed-in student experience or the precise number of rows currently visible after every interaction. The findings below are grounded in source files and runtime composition.

Primary evidence reviewed:

- Shared-console dataset builder and field mapping: `portal/soc-analyst-module-03-environment.js` (`M03E_SOURCE_MAPPINGS`, `M03E_UNIFIED_FIELDS`, `m03eBuildDataset`).
- Query engine/editor: `portal/kql-engine.js`, `portal/kql-editor.js`.
- Cumulative tool packs: `portal/soc-console-tools.js`.
- Independent assessment contracts: `portal/soc-m04-assessment-data.js` through `portal/soc-m12-assessment-data.js` where present.
- Module scenario adapters and console mounts: `portal/soc-analyst-module-01.js` through `portal/soc-analyst-module-12.js`, plus `portal/soc-analyst-module-02-environment.js`.
- Existing course direction and lab constraints: `MNTA_SOC_ENVIRONMENT_EVOLUTION_PLAN.md`, `docs/MISSION_NEXT_LAB_ARCHITECTURE.md`, `docs/LAB_ASSESSMENT_STANDARD.md`, `GUIDED_LAB_IMPLEMENTATION_HANDOFF.md`.

## What “real CLI” means here

| Experience property | Current state | Assessment |
|---|---|---|
| Actual OS/vendor CLI process | Not the core SOC lab architecture; SOC search runs in browser code | Do not market it as a real shell. A terminal should only be added where a module objective calls for terminal work. |
| CLI/SIEM-shaped investigation | KQL-like query text, source tables, event results, sorting, alerts and pivots | Present from Module 3 onward; custom evaluator means language/tool fidelity is bounded. |
| Raw source diversity | Module 3 preserves four distinct source representations (identity JSON, directory key/value, app JSON, syslog text) and maps them to common fields | Strong starting model; it should be the reference contract for the rest of the course. |
| Standard fields | Module 3 uses `TimeGenerated`, `EventSource`, `EventType`, `Account`, `SourceIp`, `Host`, `SessionId`, `Result`, `Detail`, and identifiers in `UnifiedEvents` | Present, but aliases and optional fields vary by module. Keep raw/native values alongside normalized values. |
| Analyst noise/sifting | Some modules include benign comparisons, plausible maintenance, alert distractors, and collection delays | Uneven. Several assessment slices are intentionally compact; increase volume and ambiguity in controlled, explainable steps. |
| Alert progression | Alerts are authored per scenario and some later alerts can be generated by rules | No course-wide alert-count/depth standard ensures the load rises predictably. |
| More modules, more available evidence | M04–M11 cumulative packs; M12 integrates multiple sources and response/reporting surfaces | Architectural progression exists, but datasets and learner-facing volume need a planned staircase. |

### Field standard to converge on

Every searchable event should preserve its source-native representation and expose a documented normalized envelope. Required common fields should be stable; source-specific fields remain additive.

| Canonical field | Meaning and rule |
|---|---|
| `TimeGenerated` | ISO-8601 UTC event time; retain `RawTimestamp` and source timezone/parse status when normalization is relevant. |
| `EventId` | Stable, unique within the scenario and preserved in pivots/evidence. |
| `EventSource` | Source/table or sensor that produced the record. |
| `EventType` | Source event category; do not erase vendor/source-native event names. |
| `Account` | Principal in a consistent canonical form; distinguish user, service, machine, and SYSTEM identities. |
| `Host` / `DeviceId` | Stable entity linkage; keep hostname and inventory ID when both exist. |
| `SourceIp`, `DestinationIp`, `Domain`, `Url` | Optional network dimensions; absent values are null/empty by a single documented convention. |
| `Result` | Normalized outcome (`Success`, `Failure`, `Blocked`, `Allowed`, `Delayed`, `Unknown` as appropriate) with original source outcome retained. |
| `SessionId`, `ProcessId`, `ParentProcessId`, `CorrelationId` | Optional relationship keys; preserve their provenance and scenario-local scope. |
| `Action`, `Detail`, `RawEvent` | Concise normalized action, readable summary, and source-native evidence. Avoid using free text as a substitute for structured fields. |
| `IngestionTime`, `Collector`, `CoverageStatus` | Optional operations/quality fields to teach delayed or incomplete telemetry honestly. |

This is a contract for event evidence, not a requirement that every module show every column at once. Existing table layouts and tabs can stay intact; schemas and row sets are the scope of the roadmap.

## Module-by-module telemetry inventory

This inventory records the current evidence surface and the next sensible increment. “Add” means additional static synthetic rows/tables/alerts inside the existing lab experience, not a UI replacement. Exact rendered row counts require the later inventory sprint to compute from runtime fixtures; derived tables can duplicate a source record into multiple views, so count unique source events separately from query views.

| Module | Current evidence surface in source | Current strength / gap | Progressive next increment |
|---|---|---|---|
| 1 — case triage | Three-pane case console with alert queue, sign-in evidence, case record; separate Practice and Prove cases (`soc-analyst-module-01.js`) | Case/alert decisions and evidence workflow are established. This is not yet the course-wide searchable SIEM dataset. | Add a modest, bounded set of sign-in context rows and benign explanations in the existing console; maintain a small initial evidence volume and stable alert-to-event references. |
| 2 — network and identity | Network & Identity Security workspace with activity, identities, devices, resources, policies and access decision (`soc-analyst-module-02-environment.js`) | Strong entity/policy context; activity is a focused case slice, not a broad noisy log search. The active view is the environment file, not the earlier legacy `soc-analyst-module-02.js`. | Expand activity with a few related allowed/denied events, expected service traffic, and identity/device context; preserve current network map and decision lab. |
| 3 — SIEM and log analysis | Shared SIEM console, KQL editor/evaluator, four native source formats, normalized `UnifiedEvents`, identity/IP lookups, watchlists; Practice CASE-MN-428 and Prove CASE-MN-517 (`soc-analyst-module-03-environment.js`) | Best normalization example. Practice includes benign events/change records and a collector signal; Prove includes a password spray, successful access, follow-on activity and a collection gap. Data still uses small authored slices rather than broad background activity. | Establish baseline count and canonical schema; add routine auth/app/system rows around the incident window, keeping the signal-to-noise ratio teachable and the Prove answer independent. |
| 4 — detection engineering | M04 source fixture has nine explicit authentication events, two reports and three IOCs (`soc-m04-assessment-data.js`); shared SIEM plus intelligence/rules/automation packs | Useful realistic ambiguity: password spray alongside a password-rotation retry and uncorroborated/expired IOCs. Nine core auth records are a very small rule-tuning corpus. | Grow the assessment corpus with normal sign-ins, multiple low-frequency patterns, schedule/collector context, and a few alert candidates that test exclusions and thresholds. |
| 5 — endpoint investigation | Endpoint contract documents a required schema; 13 assessment events, including malicious process/file/persistence/control records plus signed updater comparisons on another host (`soc-m05-assessment-data.js`) | Strong event-level detail and benign comparator. More endpoint background and alerts should make the learner search/correlate instead of reading an almost complete chain. | Add routine process/network/file activity on the involved and neighboring devices, a sensor-health/coverage record, and low-confidence/noise signals; preserve process IDs and hashes. |
| 6 — threat hunting | Explicit hunt telemetry schema and cross-source console construction in `soc-analyst-module-06.js`; guided case has a repeated-script alert and two-device evidence | Good hypothesis-led hunt shape, entity spread, and explicit ATT&CK evidence references. Audit found different alert loads in guided and assessment slices. | Add relevant comparison hosts/users and routine scheduled-task/software evidence, with at least one bounded hunt that returns no match; increase distinct rows and entities from M05. |
| 7 — network and email investigation | Assessment and guided console datasets are assembled in `soc-analyst-module-07.js`; email/network pivots and DMARC/alert examples | Cross-domain mail/network content is present, but datasets are adapter-built and less obviously governed by a shared schema contract. | Enrich message/authentication/DNS/proxy activity with legitimate marketing/business mail, retries, and related-but-not-matching domains; document native and normalized mail/network fields. |
| 8 — vulnerability and exposure prioritization | Assessment is an imported vulnerability-management lab; module adapter builds additional vulnerability/incident console data (`soc-analyst-module-08.js`, `soc-m08-assessment-data.js`) | Relevant exposure context exists; this is not primarily a raw log-analysis module. Avoid forcing it into a log console. | Add evidence linkage rows that connect vulnerability findings to asset criticality, exploit/reachability context and the current incident, plus benign/unrelated findings that must be deprioritized. |
| 9 — incident response | Incident evidence sources are built from assessment data and mapped into console tables; queue and response tools (`soc-analyst-module-09.js`, `soc-m09-assessment-data.js`) | Good response/evidence surface, but existing response record volume should be checked against chronology and normal operations so learners distinguish containment from recovery. | Add staged before/after response telemetry, related benign service activity, and explicit recovery validation signals; ensure a containment action never implies recovery. |
| 10 — evidence handling and reconstruction | Console data maps forensic artifacts to event sources and includes an evidence request alert (`soc-analyst-module-10.js`, `soc-m10-assessment-data.js`) | Strong provenance/custody objectives; not a high-volume triage lab by itself. | Add a realistic acquisition set with adjacent unrelated artifacts, collection timestamps, source/system events and repeated hash-verification records; preserve chain-of-custody IDs and artifact status. |
| 11 — SOC operations and reporting | Queue/metrics/recovery-evidence data adapted into `AlertQueue` and watchlists (`soc-analyst-module-11.js`, `soc-m11-assessment-data.js`) | Connects operations metrics to incident evidence; metric and event data must remain distinguishable. | Add several days/shifts of baseline and outlier operational metrics, alert counts and rule changes with clear time windows; include enough alerts to compare trend vs incident proof. |
| 12 — integrated capstone | Amber Finch contains three initial alerts, seven named evidence records and cumulative consoles/packs over an eight-hour scenario (`soc-m12-assessment-data.js`, `soc-analyst-module-12.js`) | Broad integrated sources, benign/unrelated pivots, evidence boundaries and independent report. The small top-level evidence lists are supplemented by tool fixtures; count the rendered/queryable unique rows from the composed runtime dataset. | Increase total unique source events and alert candidates above every prior module; carry forward familiar schemas while adding multi-source noise, coverage caveats and cross-shift context. Keep the independent assessment and answer key intact. |

### Cross-course progression rule

Use these as starting targets for **unique source events in the primary assessment scenario**, excluding lookup/watchlist rows, derived `UnifiedEvents` copies, and learner-generated alerts. The inventory sprint must baseline actual counts before adopting final numbers. These are target bands rather than claims about current totals:

| Course stage | Suggested unique assessment events | Sources/tables | Alert queue target | Investigation demand |
|---|---:|---:|---:|---|
| M01–M02 | 8–18 focused activity records per scenario | 1–3 relevant sources | 1–3 signals | Identify core evidence, compare one benign explanation. |
| M03–M04 | 20–45 | 4–6 | 3–6 candidates | Normalize, query, sort, correlate, tune threshold/exclusions. |
| M05–M06 | 35–70 | 5–8 | 4–8 candidates | Process/entity pivots, fleet comparison, hypothesis scope, false leads. |
| M07–M09 | 50–100 | 7–10 | 5–10 candidates | Cross-domain joins, severity/response decisions, changed-state validation. |
| M10–M11 | 60–120 relevant artifacts/events plus operational time series | Existing sources plus custody/metrics records | 6–12 candidates or trend points, as objective requires | Provenance, time-series context, handoff and recovery confidence. |
| M12 | 100–180 | 10+ relevant source families | 8–15 candidates | Independent end-to-end investigation with bounded evidence and distractors. |

The goal is not to maximize the count. Every added row must serve at least one of: realistic background, a testable hypothesis, an alternate explanation, alert tuning, scope checking, evidence quality, or recovery validation. Ensure the number of rows does not make required evidence effectively undiscoverable or overwhelm the stated course time.

## Findings and gaps to address

### Strengths to preserve

1. **A real shared-console progression exists in code.** `soc-console-tools.js` describes and implements cumulative Module 4–12 packs using Module 3's console. Reuse that seam rather than creating a second UI.
2. **Module 3 teaches normalization directly.** It preserves native source mappings and presents a unified query view. This is a good model for the common telemetry contract.
3. **Fixtures contain authentic reasoning cues.** There are authorized change records, benign signed binaries, travel notices, collector delays, unfamiliar vs known entities, and evidence boundaries. Those are the right ingredients for sifting.
4. **Scenarios distinguish guided from independent work.** Existing docs require distinct guided and assessment evidence in several modules. Data enrichment must not duplicate answers across those states.
5. **Labs have domain-specific purposes.** Vulnerability, evidence custody, and reporting work should gain richer relevant evidence within their existing tools instead of being flattened into the SIEM.

### Gaps that should become backlog items

- **No single inventory reports unique source-event counts per lab.** Raw rows, mapped source rows, `UnifiedEvents`, lookup tables and derived alerts can be counted as if they were equivalent unless the audit defines counting rules.
- **Schema coverage varies.** M03, M05 and M06 document portions of the contract; several module adapters construct `m03eRow()` objects without an explicit source fixture schema or required-field validation.
- **Some alert collections are intentionally sparse or empty.** Examples include M04/M06 console base data with empty alert arrays before learner-generated rules, while guided fixtures add authored alerts. That is pedagogically valid in some objectives but should be planned and progressively varied.
- **Background activity is uneven.** Some fixtures give a clean causal chain with a handful of comparators. To model SOC triage, add ordinary activity across the incident window and some plausible, bounded noise, with instructor truth and relevance documented.
- **Operational telemetry is underused as a first-class teaching signal.** Collector delays exist, but ingestion latency, missing-source coverage, health status, and time-zone fidelity should be consistent where they affect conclusions.
- **CLI/tool fidelity can be overstated.** The editor accepts a subset of KQL-like syntax in a custom browser evaluator. Keep the honest product description as a simulated SIEM/query console unless a lab launches an actual CLI process.
- **Progression is architectural rather than quantified.** Cumulative tool packs do not by themselves ensure that each module increases available logs, alert candidates, source diversity, or analyst work.

## Sprint roadmap

Run these as separate, reviewable implementation sprints. Each sprint has a narrow file surface so work can be delegated to subagents or contributors one sprint at a time. Parallelize only after the baseline schema/volume decisions are accepted; shared data files are easy to conflict on.

### Sprint 0 — Runtime inventory and telemetry baselines ✅ (2026-10-02)

> **Done.** `scripts/soc-telemetry-inventory.js` (read-only, deterministic; `--json`), output at `docs/telemetry/SOC_TELEMETRY_INVENTORY.md` + `soc-telemetry-inventory.json`, test `tests/soc-telemetry-inventory.test.js`. Loads all SOC scripts from `index.html` in a stubbed `vm`; M03–M12 load at runtime, M02 via static extraction. **Baseline unique events (guided/assessment):** M01 9/46 · M02 6/0 (Prove is imported) · M03 18/27 · M04 7/9 · M05 13/13 · M06 12/9 · M07 13/13 · M08 22/22 · M09 16/16 · M10 10/10 · M11 5/5 (+12 queue alerts) · M12 —/7. **Corrections:** counts do not rise with module; M04–M12 are below target bands; M04 guided alert array is also empty; M06 guided spans 3 hosts; guided/assessment overlap on answer-bearing entities (`m.ortiz` M03, `acct-17` M04); M09 has two content-identical rows; M12 console pushes a duplicate `BEN-101` row. CorrelationId/IngestionTime/Collector/CoverageStatus absent everywhere; RawEvent only in M01; UnifiedEvents drops Url/ProcessId/ParentProcessId from M05 on.

**Purpose:** Replace estimates with an auditable count and field-coverage baseline for all Practice and Assessment/Prove scenarios.

**Likely files:** `portal/soc-analyst-module-01.js` through `portal/soc-analyst-module-12.js`; `portal/soc-analyst-module-02-environment.js`; `portal/soc-analyst-module-03-environment.js`; `portal/soc-m04-assessment-data.js` through `portal/soc-m12-assessment-data.js`; script under `scripts/` or `portal/` only if the existing project conventions call for it; this roadmap.

**Deliverables:** A machine-readable inventory or repeatable report with per lab: unique source records, source/table count, alert count and provenance (authored vs learner-generated), normalized field coverage, benign/distractor/coverage row counts, queryable vs display-only records, and guided/assessment fixture independence. Explicitly deduplicate mapped table rows and `UnifiedEvents` copies.

**Acceptance:** All 12 modules represented; no report conflates rows with unique events; current findings in this roadmap either confirmed or corrected. Keep the inventory script read-only and deterministic.

**Delegation brief:** “Audit the existing Mission Next SOC fixtures without changing UI or lab structure. Produce exact Practice/Assessment unique-event, source-table, alert, and common-field coverage counts for modules 1–12. Account for runtime-built tables and derived `UnifiedEvents`. Flag only source-supported gaps.”

### Sprint 1 — Common schema and realism checks ✅ (2026-10-02)

> **Done.** `portal/soc-telemetry-schema.js` (global `SocTelemetrySchema`: `validateEvents`, `validateScenario`, `contract`, `normalizeResult`), loaded in `portal/index.html` before `soc-analyst-module-03-environment.js`; contract doc `docs/telemetry/SOC_TELEMETRY_SCHEMA.md`; test `tests/soc-telemetry-schema.test.js` covers M03 practice/prove (native, per-source, `UnifiedEvents`), M04–M06. Required: `EventId`, `TimeGenerated`, `EventType`; recommended (warning): `EventSource`, `Account`, `Result`. No fixture defects found, so no data changed. Open warnings: M03 service/host accounts absent from `IdentityInfo`; M04 events lack `EventSource`; M05/M06 native `result` values outside the normalized set (kept, by design).

**Purpose:** Establish a lightweight shared event envelope and validation rules without rewriting every fixture or changing visible table layouts.

**Likely files:** `portal/soc-analyst-module-03-environment.js`; new small schema/validator module if load order allows; relevant fixture adapters in `portal/soc-console-tools.js`; `portal/index.html` script load order; targeted data files from Modules 3–6.

**Deliverables:** A documented canonical-field contract; source-native preservation rules; a fixture validator for unique IDs, UTC timestamps, scenario-window bounds, entity references, alert-to-evidence references, required normalized fields, and allowed missing values. Apply first to M03–M06 and correct data defects discovered.

**Acceptance:** Existing tables/rendered columns, lab routes and scenarios remain; native source fields are not lost; validator clearly distinguishes required common fields from source-specific optional fields; valid existing fixtures pass.

**Delegation brief:** “Implement the smallest data-only schema/validation seam for SOC telemetry. Preserve each module’s UI and lab shape. Start with Modules 3–6 and report any fixture correction. Do not standardize by deleting native fields.”

### Sprint 2 — Early-course staircase (Modules 1–4) ✅ (2026-10-02)

> **Done.** Unique events guided/assessment: M01 9/46 (unchanged — guided fixtures live in shared `portal/data.js`, deferred) · M02 6→11 guided (Prove remains imported) · M03 18/27→25/33, alerts 1/4→3/5 · M04 7/9→25/37, accounts 4/6→10/17, new `source: 'AuthLog'` on all events. Added routine sign-ins, typo-then-success decoys (ALT-3102, ALT-5174), collector heartbeats, branch-NAT single-failure retries, scheduled invalid-credential probe, backup-agent retries, watchlist SCH-031/SCH-044/CR-212. Row purpose tags are non-rendered (`truth.rowPurpose`, `benignBackgroundEventIds`, `M03E_ROW_PURPOSE`, `M02_ROW_PURPOSE`). Rubric/scorer/`truth.rule` unchanged — spray remains the only group meeting the 5-distinct-account threshold. Independence fixed: M03 guided `m.ortiz`→`c.ortega` (IP 10.20.4.22→.23); M04 guided `acct-17`→`acct-67`, Learn It sample rows → `acct-07`/203.0.113.97. Test `tests/soc-telemetry-sprint2.test.js`; updated m03-siem-console, soc-m04-alert-generation/rule-evaluator/rules-ui. **Open:** decide whether new below-threshold decoy groups belong in M04 `excludeEventIds`; M04 Learn desk copy "14 records · one 15-minute window" still accurate for its table.

**Purpose:** Add a controlled, visible increase from focused case activity to SIEM and detection noise.

**Likely files:** `portal/soc-analyst-module-01.js`; `portal/soc-analyst-module-02-environment.js`; `portal/soc-analyst-module-03-environment.js`; `portal/soc-m04-assessment-data.js`; small corresponding styles only if row content requires an existing table to expose fields already supported.

**Deliverables:** Enrich each existing scenario with routine activity, at least one credible alternate explanation, and relevant timing/coverage context. Keep M01/M02 focused; increase M03 source diversity and M04 candidate-rule data. Add documented row-purpose tags in fixture truth/comments, not student-facing answer labels.

**Acceptance:** M01–M04 row counts rise by stage in the inventory; each decoy can be explained using available evidence; real lead evidence remains discoverable; practice and assessment cases remain distinct; no UI/lab navigation changes.

**Delegation brief:** “Enrich only synthetic scenario rows for SOC Modules 1–4. Keep current UI, lab sections, scoring, IDs where referenced, and case objectives intact. Increase routine activity and explainable distractors gradually; update truth/answer references and the inventory.”

### Sprint 3 — Endpoint and hunt depth (Modules 5–6) ✅ (2026-10-02)

> **Done.** Unique events / source tables / authored alerts: M05 13/4/1 → 52/7/5 (guided and assessment; guided remains derived from assessment via the replacement map, new Practice IDs `M05-PR-214`–`252`) · M06 assessment 9/5/0 → 51/6/4 · M06 guided 12/4/1 → 50/6/4. New devices WS-ASSESS-31/40 (M05), `ws-402` (M06 assessment, added to `scope.devices`), `ws-655` (M06 guided). Added signed background activity, explainable false leads (backup PowerShell `-ExecutionPolicy Bypass` under service account; managed-installer Run key under change ticket; signed cache-cleanup task), new `sensor_health` / `DeviceSensorHealth` table with heartbeats and a planned upgrade gap, and bounded negative-evidence queries (M05 no `syncsvc.exe` network on WS-ASSESS-27; M06 no `UpdateHealth` on `ws-402`). Tags: `expectedTruth.benignBackground`, `coverageGaps`, `negativeEvidence`, `fixtureNotes.eventPurposes` (not rendered). No scorer/rubric logic or existing EventIds changed; M06 saved `scheduled_task` query on `ws-318` now also returns ordinary `M06-EVT-014`. **Open:** M06 stays in its 09:00–09:30 window (no prior-day baselines); inventory script's static claim text needs a refresh (Sprint 6).

**Purpose:** Make endpoint and hunt tasks require comparison and bounded searching, not just reading a preassembled chain.

**Likely files:** `portal/soc-m05-assessment-data.js`; `portal/soc-m06-assessment-data.js`; `portal/soc-analyst-module-05.js`; `portal/soc-analyst-module-06.js`; associated scorer/truth fixtures only when expected evidence changes.

**Deliverables:** Add realistic baseline process/file/network/task events, additional hosts/accounts and ordinary signed software, selective duplicates/retries, and one query result that tests bounded negative evidence. Keep all relationships (event IDs, process trees, hashes, entity inventory) internally consistent.

**Acceptance:** M05–M06 exceed M03–M04 in unique records/entities/sources within target bands; false positives have evidence-based resolution; hunt scope can be stated accurately; no new UI panels or changes to the current Guided/Assessment division.

**Delegation brief:** “Expand M05–M06 synthetic endpoint/hunt telemetry and truth fixtures only. Add realistic, explainable background records and meaningful false leads. Preserve existing lab UI and separate guided/assessment narratives; validate all event/entity/process references.”

### Sprint 4 — Cross-domain and response evidence (Modules 7–9) ✅ (2026-10-02)

> **Done.** Unique events / source tables / authored alerts (guided = assessment shape): M07 13/7/1 → 75/9/6 · M08 22/5/1 → 66/7/6 · M09 16/4/1 → 70/8/7. Guided/assessment share no EventIds/hosts/IPs/domains (only `svc-backup` in M09, already in both pickers). M07: ~62 console-only background rows (bulk marketing, HR notice, similar-brand aligned vendor, never-clicked DMARC-fail survey, deferral+retry, quarantine, signed updater, NXDOMAIN retries); new `EmailUrlEvents`/`EmailAttachmentEvents`; correlation hinge — ALT-7102 vs ALT-7103 fire on the same rule and only the clicked mail's DMARC/auth state separates incident from newsletter. M08: 3 comparison assets, 5 findings, finding/asset evidence, scanner jobs (credential-failure run explains stale finding), approved/queued-never-applied patches; decoys include CVSS 9.8 on isolated lab host and non-applicable 9.8 on answer asset. M09: 54 before/after containment rows, request-to-completion outcomes, new `RecoveryChecks` table where nothing passes for ws-173/fs-02/acct-173 (containment ≠ recovery), explicit coverage gaps. Truth: M07 `expectedTruth.benignBackgroundEventIds`/`alertDispositions`; M08 new scenario keys, `expectedPriority` unchanged. No scorer/rubric/action files touched. Fixed: M09 duplicate rows differentiated; M07 guided ALT-7481 query literal `\n` crashed the KQL engine. Test `tests/soc-telemetry-sprint4.test.js`.

**Purpose:** Raise source diversity and alert load while connecting email/network, exposure context, and response lifecycle.

**Likely files:** `portal/soc-analyst-module-07.js`; `portal/soc-m07-assessment-data.js`; `portal/soc-analyst-module-08.js`; `portal/soc-m08-assessment-data.js`; `portal/soc-analyst-module-09.js`; `portal/soc-m09-assessment-data.js`; relevant module-specific scorers/actions.

**Deliverables:** Add legitimate mail/domain/proxy records, clearly bounded vulnerability/asset comparison findings, and before/after response events with completion evidence. Ensure at least one alert/no-alert choice hinges on correlation rather than a single obvious field.

**Acceptance:** Data volume and source count rise from M05–M06; triage differentiates alerts from raw events and exposure from proof; response status is not mislabeled as recovery; all new rows are referenced by the existing tool/rubric as appropriate.

**Delegation brief:** “Increase synthetic evidence depth for Modules 7–9 in their existing labs. Preserve assessment objectives and UI. Add cross-domain benign context, relevant alert candidates and response lifecycle evidence; update IDs, schemas, and grading truth together.”

### Sprint 5 — Custody and operational telemetry (Modules 10–11) ✅ (2026-10-02)

> **Done.** M10 10 events/7 tables → 106/8 (new `EvidenceCustodyLog`), artifacts 10→22 (ART-11–22), alerts unchanged (REQ-5510). M11 5 events → 95 across 7 tables, plus the same 12 queue alerts; lookup series (not events): `DailyOpsMetrics` 11, `ShiftOpsMetrics` 9, `RuleAlertVolume` 50, `RuleChanges` 5. M10: decoy artifacts each carry a discriminating fact, 31 background `sourceEvents` (no WKSTN-19 upload; export job explains truncated ART-03), 53-row custody ledger generated from artifacts so hashes can't drift (ART-03 mismatches on both checks), separate event/ingestion/acquisition time fields. M11: ticket lifecycle, on-call pages, rule-run windows reconciling with the queue, collector heartbeats (one EDR lag), shift log; outlier R-04 after CHG-2212 with weekend-staffing and other rule changes as alternate explanations; metric rows carry window fields only, flagged not-incident-evidence. Truth: M10 `expectedTruth.noiseArtifactIds` now 10 ids + new `optionalSupportingArtifactIds` and instructor-only `telemetryPurposes`; M10 guided now inherits the cloned noise list instead of overriding to `PRACT-10`. No scorer/rubric changes; M11 queue metrics still 12 / 7 / 17.3 / 46.7. Fixed pre-existing `soc-m11-console-integration` failure (stale test slice markers). Test `tests/soc-telemetry-sprint5.test.js`. **Open:** inventory flags M10 guided/assessment "overlap" via shared `SYSTEM` account and one host (pre-existing ART-10 data); no `CoverageStatus` rows added (a proxy gap would undercut the ART-08 no-upload conclusion).

**Purpose:** Extend the staircase into forensic provenance, operational baselines, shift metrics, and reporting.

**Likely files:** `portal/soc-m10-assessment-data.js`; `portal/soc-analyst-module-10.js`; `portal/soc-m11-assessment-data.js`; `portal/soc-analyst-module-11.js`; related rubric/scorer/metrics modules.

**Deliverables:** Expand acquisition artifact sets with adjacent benign/unrelated artifacts, consistent hashes and custody transitions; provide multi-period metric baselines plus a meaningful outlier and associated rule/change evidence. Keep event time, ingestion time, acquisition time, and metric window semantically distinct.

**Acceptance:** M10–M11 have more relevant evidence than M07–M09; a reviewer can reconstruct each provenance transition; operational metrics are not presented as incident proof; the current reporting and lab submission contract remains intact.

**Delegation brief:** “Enrich M10 custody/reconstruction and M11 operations/reporting datasets only, with realistic volume and provenance/time semantics. Preserve existing UI, rubrics and submissions; keep operational indicators distinguishable from event evidence.”

### Sprint 6 — Capstone scaling and course-wide regression ✅ (2026-10-02)

> **Done.** M12 unique events 7→167, tables 5→22, alert candidates 3→14 (11 competing, mostly benign), accounts/hosts/IPs 2/3/1→19/17/28. Changes are in `portal/soc-m12-assessment-data.js`: a 160-row `telemetry` array, intel TI-602/604/605, `evidenceFields` overlays, and instructor-only `telemetryPurposes`/`alertDispositions`/`alertDiscriminators`/`benignBackgroundEventIds`/`coverageGaps`. `portal/soc-m12-assessment-console.js` now dedupes `BEN-101` and adds identities, IPs, watchlists (ChangeTickets/TravelNotices/ApprovedSoftware) and 3 M05-pack devices. Coverage caveats: ws-142 sensor gap 08:30–09:50 and ws-131 gap 11:10–11:40. Gateway rows bound NW-504's "no match" on 203.0.113.72. Late proxy ingestion and ShiftLog handoff rows were added, plus weekend change window CHG-9207. Answer key, rubric and scorer are unchanged. M12 defects fixed: student-visible `Result` had leaked "primary/supporting/benign" answer labels; ID-402 lacked SourceIp; host casing was mixed; M06 pack lead/scope devices were upper-case and never matched. Shared defect fixed: `SocConsoleTools.mount` dropped `sourceMappings`, so the M07/M09 mappings never registered (`portal/soc-console-tools.js`). The inventory script's claim text was refreshed, and a "Progression curve" section was added. Stale tests fixed: `soc-m06-cumulative-console-integration` (guard missed the guided case forms) and `soc-m04-assessment-console` (guided state, event-count/ID regexes, lab allowlist, and the retired independent-lab assertion). Test `tests/soc-telemetry-sprint6.test.js`.

**Purpose:** Make M12 the highest-volume, highest-ambiguity scenario while confirming that the gradual progression is real and fair.

**Likely files:** `portal/soc-m12-assessment-data.js`; `portal/soc-analyst-module-12.js`; shared source adapters only for identified integration defects; inventory/fixture validation artifacts.

**Deliverables:** Increase M12 unique event volume, normal activity, competing alerts and coverage limitations beyond M10/M11. Verify common pivots and field consistency across the ten integrated consoles. Update the report inventory and instructor-facing truth without surfacing it in student labels. Validate all 12 stages as a strictly increasing *overall evidence capability* curve, allowing objective-specific row-count exceptions only when documented.

**Acceptance:** M12 is the largest searchable assessment slice and alert candidate set; every scored claim is supported by reachable evidence; every “no match” claim is bounded by source/time coverage; no UI, course structure, grading lifecycle, or module identity is changed.

**Delegation brief:** “Scale the Module 12 Amber Finch data and run the course-wide telemetry inventory/validation. Keep its independent capstone and existing UI/assessment lifecycle. Ensure its unique-event volume and alert candidates exceed prior stages and that evidence references/coverage boundaries remain valid.”

### Sprint 7 — Entity identity phase 2 and density top-up ✅ (2026-10-02)

> **Done.** Every module from M02 to M12 now passes the entity identity contract: the lint went from 2018 violations to 55, all in M01. Assessment unique events were topped up to remove the dips: M06 51→63, M08 66→86, M09 70→97, M11 95→117. The M03→M12 staircase now rises at every step. Answer keys, scorers and metrics are unchanged. Where students' saved state carries old-form ids, it is migrated on load (M05, M07, M10). The shared KQL engine now takes result columns as the union of keys across result rows. See "Next AI — start here" for per-module detail and open items.

## Cross-sprint implementation rules

1. **Data-first:** No redesign of console tabs, Academy shell, course routes, module sections, or lab type. Add rows and fields to existing sources and table adapters.
2. **Progressive reveal:** A module can only use data and capabilities taught by that point. No capstone-only evidence should leak into earlier assessment fixtures.
3. **Separate unique events from views:** A native table row copied into `UnifiedEvents` is one source event, not two. Lookups, watchlists, metrics, and learner-generated alerts get separate counts.
4. **Sifting must be fair:** Every false lead has an available discriminating fact; every answer-bearing record can be found via taught pivots; distractors should have a reason to exist.
5. **Keep independent cases independent:** Guided and assessed experiences may teach the same skill, but should not share answer-bearing identities, event IDs, timing, indicators, and expected decisions where the module's lab contract calls for distinct cases.
6. **Realism includes imperfect collection:** Use timezone conversion, ingestion lag, partial coverage, and source-health context sparingly and only when the learner can reason about the consequence.
7. **Do not equate volume with difficulty:** Mix event density, sources, entity counts, lookalikes and alerts. Track them independently so one oversized log cannot stand in for course progression.
8. **Keep labels honest:** Call the experience a simulated SOC/SIEM console. Describe KQL support as the supported lab subset unless implementation is replaced with a real Kusto/Sentinel environment.

## Suggested course-wide scorecard

Track these per Guided and Assessment scenario in Sprint 0 and on every enrichment sprint:

- unique event rows and queryable event tables;
- distinct source families and canonical-field coverage;
- entities, sessions, processes, indicators, and relationships;
- authored alerts, rule-generated alerts, and benign alert candidates;
- benign/background rows and explicit alternate explanations;
- records with latency, timezone, or coverage caveats;
- scored evidence references supported by rows and pivots;
- rows/events per expected lab minute, reviewed for learner workload;
- fixture independence between guided and assessment cases;
- count of UI modules/files changed (target: zero for telemetry-only sprints, except schema wiring required to expose already supported fields).

**Definition of done across the roadmap:** The learner encounters an increasing and measurable body of available synthetic evidence throughout all 12 modules, can query or inspect it through the already established module tool, sees consistent shared fields while retaining realistic native source context, and has to separate relevant signals from fair, explainable noise. Existing UI and lab structure remain intact.

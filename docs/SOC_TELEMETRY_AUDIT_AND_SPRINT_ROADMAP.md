# SOC Telemetry Audit and Sprint Roadmap

**Status:** Discovery complete; implementation backlog for staged delivery  
**Audit date:** 2026-10-02  
**Scope:** SOC Analyst course Modules 1–12; synthetic logs, alerts, tables, schemas, and analyst search experience  
**Guardrails:** Preserve the Academy UI, module/Learn-Practice-Prove structure, and lab identities. Increase available telemetry progressively across modules; do not redesign the course or expose later-module answers early.

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

### Sprint 2 — Early-course staircase (Modules 1–4)

**Purpose:** Add a controlled, visible increase from focused case activity to SIEM and detection noise.

**Likely files:** `portal/soc-analyst-module-01.js`; `portal/soc-analyst-module-02-environment.js`; `portal/soc-analyst-module-03-environment.js`; `portal/soc-m04-assessment-data.js`; small corresponding styles only if row content requires an existing table to expose fields already supported.

**Deliverables:** Enrich each existing scenario with routine activity, at least one credible alternate explanation, and relevant timing/coverage context. Keep M01/M02 focused; increase M03 source diversity and M04 candidate-rule data. Add documented row-purpose tags in fixture truth/comments, not student-facing answer labels.

**Acceptance:** M01–M04 row counts rise by stage in the inventory; each decoy can be explained using available evidence; real lead evidence remains discoverable; practice and assessment cases remain distinct; no UI/lab navigation changes.

**Delegation brief:** “Enrich only synthetic scenario rows for SOC Modules 1–4. Keep current UI, lab sections, scoring, IDs where referenced, and case objectives intact. Increase routine activity and explainable distractors gradually; update truth/answer references and the inventory.”

### Sprint 3 — Endpoint and hunt depth (Modules 5–6)

**Purpose:** Make endpoint and hunt tasks require comparison and bounded searching, not just reading a preassembled chain.

**Likely files:** `portal/soc-m05-assessment-data.js`; `portal/soc-m06-assessment-data.js`; `portal/soc-analyst-module-05.js`; `portal/soc-analyst-module-06.js`; associated scorer/truth fixtures only when expected evidence changes.

**Deliverables:** Add realistic baseline process/file/network/task events, additional hosts/accounts and ordinary signed software, selective duplicates/retries, and one query result that tests bounded negative evidence. Keep all relationships (event IDs, process trees, hashes, entity inventory) internally consistent.

**Acceptance:** M05–M06 exceed M03–M04 in unique records/entities/sources within target bands; false positives have evidence-based resolution; hunt scope can be stated accurately; no new UI panels or changes to the current Guided/Assessment division.

**Delegation brief:** “Expand M05–M06 synthetic endpoint/hunt telemetry and truth fixtures only. Add realistic, explainable background records and meaningful false leads. Preserve existing lab UI and separate guided/assessment narratives; validate all event/entity/process references.”

### Sprint 4 — Cross-domain and response evidence (Modules 7–9)

**Purpose:** Raise source diversity and alert load while connecting email/network, exposure context, and response lifecycle.

**Likely files:** `portal/soc-analyst-module-07.js`; `portal/soc-m07-assessment-data.js`; `portal/soc-analyst-module-08.js`; `portal/soc-m08-assessment-data.js`; `portal/soc-analyst-module-09.js`; `portal/soc-m09-assessment-data.js`; relevant module-specific scorers/actions.

**Deliverables:** Add legitimate mail/domain/proxy records, clearly bounded vulnerability/asset comparison findings, and before/after response events with completion evidence. Ensure at least one alert/no-alert choice hinges on correlation rather than a single obvious field.

**Acceptance:** Data volume and source count rise from M05–M06; triage differentiates alerts from raw events and exposure from proof; response status is not mislabeled as recovery; all new rows are referenced by the existing tool/rubric as appropriate.

**Delegation brief:** “Increase synthetic evidence depth for Modules 7–9 in their existing labs. Preserve assessment objectives and UI. Add cross-domain benign context, relevant alert candidates and response lifecycle evidence; update IDs, schemas, and grading truth together.”

### Sprint 5 — Custody and operational telemetry (Modules 10–11)

**Purpose:** Extend the staircase into forensic provenance, operational baselines, shift metrics, and reporting.

**Likely files:** `portal/soc-m10-assessment-data.js`; `portal/soc-analyst-module-10.js`; `portal/soc-m11-assessment-data.js`; `portal/soc-analyst-module-11.js`; related rubric/scorer/metrics modules.

**Deliverables:** Expand acquisition artifact sets with adjacent benign/unrelated artifacts, consistent hashes and custody transitions; provide multi-period metric baselines plus a meaningful outlier and associated rule/change evidence. Keep event time, ingestion time, acquisition time, and metric window semantically distinct.

**Acceptance:** M10–M11 have more relevant evidence than M07–M09; a reviewer can reconstruct each provenance transition; operational metrics are not presented as incident proof; the current reporting and lab submission contract remains intact.

**Delegation brief:** “Enrich M10 custody/reconstruction and M11 operations/reporting datasets only, with realistic volume and provenance/time semantics. Preserve existing UI, rubrics and submissions; keep operational indicators distinguishable from event evidence.”

### Sprint 6 — Capstone scaling and course-wide regression

**Purpose:** Make M12 the highest-volume, highest-ambiguity scenario while confirming that the gradual progression is real and fair.

**Likely files:** `portal/soc-m12-assessment-data.js`; `portal/soc-analyst-module-12.js`; shared source adapters only for identified integration defects; inventory/fixture validation artifacts.

**Deliverables:** Increase M12 unique event volume, normal activity, competing alerts and coverage limitations beyond M10/M11. Verify common pivots and field consistency across the ten integrated consoles. Update the report inventory and instructor-facing truth without surfacing it in student labels. Validate all 12 stages as a strictly increasing *overall evidence capability* curve, allowing objective-specific row-count exceptions only when documented.

**Acceptance:** M12 is the largest searchable assessment slice and alert candidate set; every scored claim is supported by reachable evidence; every “no match” claim is bounded by source/time coverage; no UI, course structure, grading lifecycle, or module identity is changed.

**Delegation brief:** “Scale the Module 12 Amber Finch data and run the course-wide telemetry inventory/validation. Keep its independent capstone and existing UI/assessment lifecycle. Ensure its unique-event volume and alert candidates exceed prior stages and that evidence references/coverage boundaries remain valid.”

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

# Mission Next SOC Analyst Assessment Lab Evolution

## Live Progress Ledger

This archived brief is also the active implementation tracker. Check an item
only after its acceptance evidence exists in code and has been verified. Each
sprint is one lowest-level deliverable; finish it, close its agent, then start
a fresh agent for the next sprint. Keep notes and blockers here so this file
remains the single working reference.

### Product Contract And Direction Correction

- This brief builds a new, cumulative Assessment Lab experience across Modules
  4–12, evolving the existing Module 3 learner experience and shared console.
  It is not a request to add an unrelated assessment panel alongside the new
  module-specific assessment.
- The new Assessment Lab is the required/scored assessment for each module.
  Module 12 is the new cumulative capstone and replaces the legacy capstone
  assessment as the required capstone experience; it is not an extra capstone.
- Preserve useful existing/imported/supplemental lab content. Where present,
  expose it in a clearly separate `Optional Labs` section for Modules 4–12.
  Optional labs do not affect the new Assessment Lab's score, attempt submission,
  redo workflow, or required course/module progress. Do not delete these labs.
- The older M05 wording/checks retained imported projects as prerequisites.
  M05.8 explicitly fixes that known mismatch; the X4–X12 sprints below audit and
  verify the same product contract across every assessment module, including the
  replacement capstone. Do not close the roadmap on M05-only verification.

### Foundation

- [x] F0.1 — Register the M04–M12 progression contract and deterministic shared
  partial-credit helper (`portal/soc-assessment-evolution.js`).
- [x] F0.2 — Add focused tests for module order, additive capabilities, and
  scoring (`tests/soc-assessment-evolution.test.js`).
- [x] F1.1 — Extract the reusable Module 3 console shell and state interface.
  - [x] F1.1.1 — Extract configurable header, tabs, workspace, and drawer
    rendering while retaining current Module 3 DOM identifiers and appearance.
  - [x] F1.1.2 — Define the shared console state adapter and retain existing
    Module 3 persistence keys through the adapter.
- [x] F1.2 — Extract shared search, evidence, entity, timeline, and alert
  behavior behind that interface.
  - [x] F1.2.1 — Extract configurable KQL search/results/history rendering.
  - [x] F1.2.2 — Extract query execution and saved-search state transitions.
  - [x] F1.2.3 — Extract evidence pin/tray rendering and state actions.
  - [x] F1.2.4 — Extract entity profile and cross-source pivot rendering.
    - [x] F1.2.4.1 — Extract entity list/profile layout with module-provided
      rows, fields, labels, and selection callbacks.
    - [x] F1.2.4.2 — Extract entity-to-query pivot construction/action with
      module-provided normalized fields and query runner attributes.
  - [x] F1.2.5 — Extract timeline rendering and entity selection behavior.
  - [x] F1.2.6 — Extract alert queue/detail rendering and selection behavior.
    - [x] F1.2.6.1 — Extract alert queue rendering with module-provided alert
      rows, selection, and queue context.
    - [x] F1.2.6.2 — Extract alert detail rendering with rule/query metadata,
      entity actions, and evidence callbacks.
- [x] F1.3 — Extract shared outcome scorer and instructor evidence format.
  - [x] F1.3.1 — Implement pure weighted-criteria scoring with partial credit,
    passing threshold, and executed-unsafe-action safety cap.
  - [x] F1.3.2 — Return deterministic per-criterion awards, supporting evidence,
    misses, deductions, and instructor-readable review feedback.
  - [x] F1.3.3 — Preserve the `SocAssessmentEvolution.scoreDomains()` API through
    the shared scorer and add load-order registration.
  - [x] F1.3.4 — Test full, pass-line, partial, zero-credit, corrected, and
    safety-capped outcomes plus repeatability.
- [x] F1.4 — Add shared-console regression and persistence migration tests.
  - [x] F1.4.1 — Reconcile stale M03 regression expectations against current
    scenario truth and restore a fully passing baseline test run.
  - [x] F1.4.2 — Add one focused integrated shared-console render test covering
    shell, search, evidence, entities, timeline, alerts, and detail drawer.
  - [x] F1.4.3 — Test legacy saved-state hydration, defaults, retained values,
    stable keys, and repeat render identity.
  - [x] F1.4.4 — Run and record the combined foundation regression suite.

### Module Sprints

Each checkbox is one atomic implementation sprint with one fresh coding agent.
Finish its code and verification, close that agent, check the item, then spawn
the next. Modules run sequentially; do not start a module until its previous
module is verified.

#### Module 4 — Detection Rules and Intelligence

- [x] M04.1 — Define independent assessment telemetry, report/IOC fixtures,
  expected truth, and scenario dates.
- [x] M04.2 — Define versioned persistent assessment state and legacy-state
  normalization.
- [x] M04.3 — Record learner actions for IOC edits, query tests, rule changes,
  executions, scheduling, alert review, automation, and case updates.
- [x] M04.4 — Mount the scenario in shared console configuration with additive
  feature flags.
- [x] M04.5 — Implement report and IOC create/edit/expire/status lifecycle UI.
  - [x] M04.5.1 — Render report source reliability, confidence, freshness,
    campaign, status, and clearly unverified ATT&CK references.
  - [x] M04.5.2 — Create/edit reports while preserving source metadata.
  - [x] M04.5.3 — Create/edit IOCs with type/value/confidence/date/campaign
    validation and supported source-report association.
  - [x] M04.5.4 — Support active, expired, retired, and contextual IOC status,
    including explicit expiration.
  - [x] M04.5.5 — Persist lifecycle state and action history; cover validation,
    metadata preservation, seeded-record editing, and status transitions.
- [x] M04.6 — Implement analytics-rule authoring and operation.
  - [x] M04.6.1 — Test, save, and convert a successful query into a rule draft.
  - [x] M04.6.2 — Edit rule name, description, severity, grouping, threshold,
    lookback window, and preview.
  - [x] M04.6.3 — Configure and validate exclusions and suppression behavior.
  - [x] M04.6.4 — Enable/disable rules, configure schedule/frequency, and record
    execution history without generating final assessment alerts yet.
- [x] M04.7 — Generate alerts from evaluated query results; represent broad,
  narrow, and correct rules from telemetry outcomes.
  - [x] M04.7.1 — Evaluate saved rule queries against fixed telemetry with
    rule grouping, threshold, and lookback semantics.
  - [x] M04.7.2 — Apply configured exclusions and suppression to candidate
    groups while retaining suppression/audit evidence.
  - [x] M04.7.3 — Generate alert records from run results and link alerts,
    matched event IDs, and execution-history entries.
  - [x] M04.7.4 — Test broad/noisy, narrow/missed, and corrected/correct rules,
    repeated runs, and safe reruns after edits.
- [x] M04.8 — Implement low-risk enrichment/preservation/ticket/notification
  actions and approval-gated disruptive requests.
  - [x] M04.8.1 — Define bounded, versioned automation action records and
    persisted execution history with deterministic IDs and audit events.
  - [x] M04.8.2 — Implement indicator enrichment and matching-evidence
    preservation as idempotent, low-risk simulated actions.
  - [x] M04.8.3 — Implement ticket creation/update and SOC notification with
    persisted links, outcomes, and repeat-run behavior.
  - [x] M04.8.4 — Add disruptive-action approval requests that cannot change
    simulated account/network state; test approval boundary and audit trail.
- [x] M04.9 — Implement deterministic outcome scorer, partial credit,
  explainable misses, and instructor payload.
  - [x] M04.9.1 — Define the rubric and pure evidence extractor for
    intelligence/IOC, query/rule, alerts/tuning, automation safety, and case
    documentation criteria.
  - [x] M04.9.2 — Score extracted criterion outcomes through the shared scorer,
    including partial awards, explainable misses/deductions, and critical caps.
  - [x] M04.9.3 — Persist the submitted score and instructor-readable payload;
    render post-submit feedback without revealing answers beforehand.
- [x] M04.10 — Test correct, broad, narrow, corrected, partial, exploration-only,
  state-restore, case-submit, and approval-boundary outcomes.
  - [x] M04.10.1 — Cover correct, broad/noisy, narrow/missed, corrected, and
    partial-credit scorer outcomes with criterion-level explanations.
  - [x] M04.10.2 — Cover exploration-only, restored-state, duplicate-submit,
    and persisted instructor-payload behavior.
  - [x] M04.10.3 — Cover approval/rejection safety boundary and shared M03/M04
    console regressions.
- [x] M04.11 — Verify unique assessment scenario, no pre-submit answer reveal,
  shared console regression, and catalog/progress integration.
  - [x] M04.11.1 — Verify fixture/scenario independence and expected-truth
    isolation from pre-submit learner surfaces.
  - [x] M04.11.2 — Verify integrated navigation, workspace capability flags,
    saved-state restore, and M03 shared-console compatibility.
  - [x] M04.11.3 — Align the submitted case artifact, score rubric, and console
    to the same immutable M04 scenario/case identity.
  - [x] M04.11.4 — Verify catalog attempt recording, submit/redo workflow, and
    course progress flags remain compatible with the established lab contract.
- [x] M04.11.5 — Verify one coherent scored M04 Assessment Lab and submit path;
  preserve any supplemental practice separately as optional, not as a duplicate
  scored Assessment Lab or a competing submit surface.

##### Module 4 correction — Module 3 pattern + only Module 4 gaps (2026-09-27)

Corrective rule for every later module: **Module 3's console is the template.**
For each module, compare its "Retain" and "Add" lists against what the Module 3
console already provides, implement only the missing behavior, and mount the
module on that console instead of building a parallel one.

A read-only comparison found that M04.4 and M04.11.5 were checked before they
were true. The Prove It panel rendered a separate M04 console in which the
Search, Timeline, Entities, Evidence and Case tabs were one-line placeholders,
Data Sources and Watchlists were missing, and a second query editor lived in
Analytics Rules. Below it sat the case form (locked behind Practice It desks
and the optional imported labs) and the old independent-lab quiz, which made
three competing surfaces. Items were then corrected as follows:

- [x] G1 — Prove It is the Module 3 console mounted on the independent M04 data
  (`m03eMountConsole('m04', …)` in `soc-analyst-module-03-environment.js`;
  `MODULE_FOUR_CONSOLE_DATA` in `soc-analyst-module-04.js`). It has all Module 3
  tabs, plus Threat Intelligence, Analytics Rules and Automation, and the ITSM
  ticket as its own tab. Saved state is `moduleFourState.console.m04`.
- [x] G2 — Threat Intelligence tab reuses `SocM04IntelligenceUi` unchanged.
- [x] G3 — Queries are written in Log Search. "Save as rule query" re-tests the
  exact text with the rule engine, then saves it. The Rules tab's own editor is
  hidden in the assessment (`SocM04RulesUi.render(…, { queryEditor: false })`).
- [x] G4 — Generated alerts appear in the Module 3 alert queue and drawer, with
  matched-event pivots and the review form. **Bug fixed:** the UI could only
  record manual runs, so the rubric's `scheduled-execution` criterion was
  unreachable. Added "Run next scheduled execution".
- [x] G5 — Removed the ticket's duplicate automation choice and "Run playbook"
  block. The Automation tab is the only automation surface.
- [x] G6 — The ticket is no longer gated on Practice It or the optional imported
  labs. The only extra completeness check is one completed rule run.
- [x] G7 — The independent-lab quiz moved back under Practice It, with its
  handlers.
- [x] G8 — **Bug fixed during verification:** the rubric compared the rule's
  grouping field to the truth key `sourceIp`, but the evaluator only accepts
  the real KQL column `SourceIp`. No UI-built rule could earn alert coverage
  (15 points) or full rule quality. The comparison is now case-insensitive, with
  a regression test.

Verification: all 55 `tests/*.test.js` files pass, and `git diff --check` is
clean. `soc-m04-assessment-console.test.js` was rewritten for the mounted
console (tabs, one ticket form, no independent lab in Prove It, alert queue
and drawer, Log Search save, tab persistence). Three tests now also load the
Module 3 console, which Module 4 depends on. A headless-Chrome run through a
local harness (not the login-gated portal) covered Log Search → save → convert →
tune → schedule → run now → scheduled run → alert review → pivot → enrichment →
ticket. It showed no page errors and no horizontal overflow at 390px.

Superseded, pending owner-approved cleanup (nothing deleted yet):
`SocM04AssessmentConsole.render()`/`configuration()` (its `renderAutomation()` is
still used; `soc-m06-cumulative-console-integration.test.js` still loads the
file), `moduleFourCaseScore()` and its finding options,
`moduleFourCaseAutomationHtml()` and the `data-m04-run-automation` handler, the
Rules-tab query editor handlers (`data-m04-query-test`/`-save`), and the
`MODULE_FOUR_AUTOMATION_FINDING_OPTIONS` constant.

#### Module 5 — Endpoint and Malware

- [x] M05.1 — Define independent device/process/file/persistence fixtures and
  expected truth.
  - [x] M05.1.1 — Define the fixed scenario identity, clock, device inventory,
    and independent endpoint telemetry schema.
  - [x] M05.1.2 — Add linked process/file/hash/persistence/control events and
    expected-truth references with alternate benign activity.
  - [x] M05.1.3 — Validate fixture referential integrity, immutability, and
    separation from M04 scenario/state.
- [x] M05.2 — Define versioned state, legacy normalization, and endpoint action
  history.
  - [x] M05.2.1 — Add M05 state defaults, schema version, load/save/reset, and
    idempotent legacy migration under an M05-specific persistence key.
  - [x] M05.2.2 — Add bounded endpoint action records, deterministic IDs, and
    typed audit history with restore tests.
- [x] M05.3 — Add device profile, timeline, process tree, command line, file,
  hash, signer, prevalence, reputation, and control outcome views.
  - [x] M05.3.1 — Add device inventory/profile and device-scoped timeline.
  - [x] M05.3.2 — Add parent/child process tree with command line, user, and
    executable path details.
  - [x] M05.3.3 — Add file/hash/signer/prevalence/reputation details linked to
    process and endpoint evidence.
  - [x] M05.3.4 — Add persistence-change and prevention/detection/cleanup
    control outcome views.
  - [x] M05.3.5 — Integrate endpoint views into the shared console while
    retaining all M04 capabilities and bounded fixture-only data access.
- [x] M05.4 — Add approval-aware isolation/quarantine requests, evidence package
  preservation, and EDR handoff.
  - [x] M05.4.1 — Preserve a selected endpoint evidence package with event/hash
    references and immutable audit records.
  - [x] M05.4.2 — Request device isolation and file quarantine with explicit
    approval state; approval never silently executes a disruptive action.
  - [x] M05.4.3 — Create a bounded EDR handoff with selected evidence, owner,
    recommendation, and persisted status.
- [x] M05.5 — Implement scorer for ancestry, interpretation, persistence,
  prevention, scope, evidence, and recommendation.
  - [x] M05.5.1 — Define M05 rubric and pure evidence extraction from saved
    investigation state and expected fixture truth.
  - [x] M05.5.2 — Score weighted/partial outcomes through the shared scorer with
    safety cap and explainable instructor payload.
- [x] M05.6 — Test alternate investigation paths, corrected decisions, partial
  credit, unsafe action, restore, submit, and instructor evidence.
  - [x] M05.6.1 — Cover process ancestry, alternate pivots, corrected analysis,
    partial credit, and missed persistence/control outcomes.
  - [x] M05.6.2 — Cover approval/unsafe-action boundary and state restore.
  - [x] M05.6.3 — Cover submit/redo/catalog payload and instructor evidence.
- [x] M05.7 — Verify cumulative M04 capabilities and shared console regression.
  - [x] M05.7.1 — Verify M04 workspaces/actions still render and persist under
    the shared console after endpoint additions.
  - [x] M05.7.2 — Verify module navigation, scenario isolation, and M03/M04
    regression suites with M05 enabled.
- [x] M05.8 — Align the learner-facing assessment and supplemental labs with
  the product contract: one required in-course assessment; retained external
  labs are optional and never gate scoring or progress.
  - [x] M05.8.1 — Make the in-course M05 assessment independently submit-able
    and sufficient for its score, attempt, and required completion state.
  - [x] M05.8.2 — Move the two imported projects into a distinct `Optional Labs`
    section without deleting their links or lab content.
  - [x] M05.8.3 — Test that optional-lab completion is not required and cannot
    change the assessment score, submit/redo behavior, or required progress;
    verify the assessment works when neither optional lab is complete.

##### Module 5 correction — Module 4 lab + only Module 5 gaps (2026-09-27)

The Module 5 Prove It had the same drift as Module 4: a separate one-tab
"Endpoint investigation" console, a ticket gated on the two imported projects,
and no Module 3/4 tools. Shared groundwork first:

- [x] S1 — `portal/soc-console-tools.js`: cumulative tool packs mounted on the
  Module 3 console (`SocConsoleTools.mount`). The M04 tool handlers moved out of
  `soc-analyst-module-04.js` into pack `m04` (Threat Intelligence, Analytics
  Rules, Automation). Each pack works against any module through a context of
  state, fixture, save and re-render.
- [x] S2 — The rule engine and Rules UI accept a module's own Log Search tables
  and fields (`fixture.consoleTables`/`ruleFields`), so a later module's rules
  run over the same tables its learner queries. Module 4 keeps its original path.
- [x] S3 — `m03eBuildDataset` accepts extra source tables, and mounts may
  describe their native fields (`sourceMappings`) for Data Sources.
- [x] S4 — Shared `missionNextOptionalLabsSection()` in `app.js`: "Optional
  Labs · not graded · never required". Module 4's supplemental labs use it (X4).
  Lab-card grids now fit narrow screens (`module-labs.css`).

Module 5 gaps:

- [x] G1 — Prove It is the Module 3 console with Module 4's tools running on
  the Module 5 case (`MODULE_FIVE_M04_FIXTURE`, state in
  `moduleFiveState.tools.m04`), plus an Endpoint tab (pack `m05`, endpoint state
  unchanged under `m05-endpoint-assessment-v1`).
- [x] G2 — Endpoint telemetry is queryable in Log Search (`DeviceProcessEvents`,
  `DeviceFileEvents`, `DeviceRegistryEvents`, `DeviceAlertEvents`). The sensor
  detection is case alert ALT-5127, with an "Open in Endpoint" pivot from the
  alert drawer (scenario step 1).
- [x] G3 — M05.8 / X5: the ticket no longer requires the imported projects.
  They now appear under Optional Labs with their links and progress kept.
- [x] G4 — Added an Endpoint analyst-note form. The rubric already honours
  "Correction:" notes, but no UI could create one, so earlier mistakes could not
  be corrected.

Verification: full suite green. `soc-m05-assessment-console.test.js` and
`-submit.test.js` were updated for the mounted console. A headless-Chrome
harness covered alert → Open device → Log Search on endpoint tables → an M04
rule over `DeviceFileEvents` raising an alert → evidence package → isolation
request → EDR handoff → correction note → ticket. The UI-built state scored full
marks on all 8 M05 criteria. Found, not fixed (outside this work): some shuffled
M05 knowledge-check questions overflow at 390px (the quiz legend does not wrap).

#### Module 6 — Threat Hunting

- [x] M06.1 — Define independent seed lead, telemetry, hypothesis truth, and
  supported/unsupported ATT&CK evidence.
  - [x] M06.1.1 — Define immutable M06 scenario identity, fixed clock, seed lead,
    scope, and independent persistence key.
  - [x] M06.1.2 — Add linked endpoint, identity, network, and indicator telemetry
    fixtures with benign counterexamples and stable event IDs.
  - [x] M06.1.3 — Define expected hypothesis outcomes and evidence-backed
    supported/unsupported ATT&CK mappings.
  - [x] M06.1.4 — Test fixture identity, referential integrity, mapping truth,
    immutability, and separation from M04/M05/legacy M06 state.
- [x] M06.2 — Define versioned hunt state and action history for hypotheses,
  queries, pivots, bookmarks, collections, and conclusions.
  - [x] M06.2.1 — Add M06 defaults, schema version, load/save/reset, and idempotent
    migration under an M06-specific state key.
  - [x] M06.2.2 — Add bounded typed action history, deterministic IDs, restore
    validation, and immutable audit records.
- [x] M06.3 — Add bounded hunt hypothesis, time/entity scope, saved query,
  related-event search, bookmark, and collection UI.
  - [x] M06.3.1 — Add seed-lead review and editable, testable hypothesis with
    saved rationale and confidence.
  - [x] M06.3.2 — Add bounded time/entity scope and deterministic related-event
    search over fixture telemetry.
  - [x] M06.3.3 — Add saved query authoring/execution with fixture-only results
    and preserved query history.
  - [x] M06.3.4 — Add event bookmarks and evidence collections with bounded,
    deduplicated membership and persistent selection.
- [x] M06.4 — Add evidence-linked ATT&CK mappings with confidence/status and
  removal of unsupported mappings.
  - [x] M06.4.1 — Add mapping selection with tactic/technique, confidence,
    status, and required event references.
  - [x] M06.4.2 — Add correction/removal workflow and tests rejecting
    unsupported evidence associations.
- [x] M06.5 — Add evidence-backed alert/incident/rule proposal handoff.
  - [x] M06.5.1 — Add a bounded handoff form for selected evidence, destination,
    rationale, and recommendation.
  - [x] M06.5.2 — Persist proposal status/history and validate linked evidence.
- [x] M06.6 — Implement scorer and tests for alternate queries, scope, pivots,
  bookmark sufficiency, conclusion, ATT&CK correction, unknowns, and restore.
  - [x] M06.6.1 — Define rubric and pure evidence extraction from saved hunt state.
  - [x] M06.6.2 — Add shared weighted/partial scorer with explainable review data
    and instructor-only safety boundaries.
  - [x] M06.6.3 — Test alternate paths, corrected mappings, scope, partial credit,
    unknowns, state restore, and instructor payload.
- [x] M06.7 — Verify cumulative M04–M05 features and shared console regression.
  - [x] M06.7.1 — Verify M04/M05 workspaces and action/state persistence remain
    available under shared console integration.
  - [x] M06.7.2 — Verify navigation, scenario isolation, and M03–M05 regression
    suites with M06 enabled.

##### Module 6 correction — Module 5 lab + only Module 6 gaps (2026-09-27)

Module 6 was checked complete, but its Prove It could not earn most of its own
rubric. The hypothesis form and the scoped related-event search were never
rendered or handled. Pivot buttons never appeared, because `renderSearch` never
passed a pivot source. No UI could record a conclusion. Submit still used the
pre-evolution `moduleSixBackdoorCaseScore()`, so the M06 rubric never scored
anything. And the state could not be persisted at all (G5).

- [x] G1 — Prove It is the Module 3 console carrying Module 4 (rules over the
  hunt tables), Module 5 (Endpoint over the hunt devices, via
  `SocConsoleTools.m05Fixture`/`embedded`, state in `moduleSixState.tools`),
  plus Module 6's Hunting and ATT&CK tabs (pack `m06`). The hunt telemetry is
  queryable as `DeviceTaskEvents`, `DeviceProcessEvents`, `DeviceFileEvents`,
  `DeviceNetworkEvents` and `IdentityEvents`. CHG-2048 is on the ChangeTickets
  watchlist for the benign comparison.
- [x] G2 — Added the missing actions: save hypothesis (linked to the events that
  would test it), scoped related-event search, per-event "Pivot to" buttons
  along fixture-defined related events, and a hunt conclusion (outcome, limits,
  and the bookmarked evidence it rests on).
- [x] G3 — Submit scores with `SocM06AssessmentScorer` and stores the
  instructor review payload. The scorer test that asserted the page never calls
  the scorer now checks that it is never called while rendering.
- [x] G4 — X6: the ticket no longer requires the imported labs. They are
  Optional Labs. The ticket's account list now matches the fixture (`acct-271`
  on the comparison host, not `svc-patch`), and it no longer asserts that
  `acct-184` "created" the task, which the fixture says is not established.
- [x] G5 — **Persistence bug (also in Module 8):** `SocM06AssessmentState` and
  `SocM08AssessmentState` dropped LabRuntime's `labId`/`anonymousStudentId`, so
  LabRuntime discarded every saved record on the next load. Normalize now keeps
  both. `tests/soc-assessment-state-persistence.test.js` round-trips M05–M08
  through the real `lab-runtime.js`; it fails without the fix.

Verification: full suite green. The headless-Chrome hunt drive covered
hypothesis → lead/comparison searches → pivot → bookmarks → saved query →
collection → rule handoff → conclusion → supported T1053.005 and unsupported
T1105 mappings → Endpoint process tree for ws-318 → ticket. The UI-built state
scored full marks on all 8 M06 criteria. Found, not fixed (outside this work):
the M06 knowledge-check heading overflows 4px at 390px.

#### Module 7 — Network and Email

- [x] M07.1 — Define independent message, authentication, recipient, endpoint,
  DNS/TLS, firewall/proxy, and expected-chain fixtures.
  - [x] M07.1.1 — Define independent scenario identity, fixed clock, persistence
    key, recipient groups, and expected incident-chain truth.
  - [x] M07.1.2 — Add synthetic message headers, auth results, URLs/redirects,
    attachments, delivery, and click/open fixtures.
  - [x] M07.1.3 — Add linked DNS/TLS/firewall/proxy and endpoint-process events,
    including benign lookalikes and stable event IDs.
  - [x] M07.1.4 — Validate fixture references, time bounds, immutability, and
    isolation from earlier module scenarios.
- [x] M07.2 — Define versioned state and event history for message/network
  investigations and incident/evidence changes.
  - [x] M07.2.1 — Add independent schema-versioned defaults and load/save/reset.
  - [x] M07.2.2 — Add bounded typed actions for message/network review, pivots,
    scope, incident links, and evidence changes.
  - [x] M07.2.3 — Validate restored actions and fixture references; test migration
    idempotence and separation from M04–M06 state.
- [x] M07.3 — Add email headers/authentication, URLs/redirects, attachments,
  delivery, recipient scope, trace, and click/open views.
  - [x] M07.3.1 — Add message queue/detail and raw-header/authentication views.
  - [x] M07.3.2 — Add URL redirect and attachment inspection with safe synthetic
    metadata and fixture-only navigation.
  - [x] M07.3.3 — Add delivery trace and recipient-group scope, including click/open
    status and bounded search/filter actions.
- [x] M07.4 — Add DNS/TLS/firewall/proxy session views and process-to-network
  correlation; bound PCAP access to fixture data.
  - [x] M07.4.1 — Add DNS/TLS and firewall/proxy session search/detail views.
  - [x] M07.4.2 — Correlate endpoint process ancestry to fixture network sessions.
  - [x] M07.4.3 — Add PCAP summary/sample access restricted to fixture bytes and
    event IDs; test no arbitrary file/network access.
- [x] M07.5 — Add evidence preservation and supported incident update/create.
  - [x] M07.5.1 — Add pin/bookmark and evidence selection across email/network
    event views.
  - [x] M07.5.2 — Add fixture-supported incident create/update with linked evidence
    and bounded scope.
  - [x] M07.5.3 — Persist incident/evidence actions and validate restoration.
- [x] M07.6 — Implement scorer and tests for chain correlation, noise rejection,
  confirmed/unknown scope, alternate pivots, evidence, and state restore.
  - [x] M07.6.1 — Define rubric and pure chain/scope/evidence extraction.
  - [x] M07.6.2 — Add explainable weighted/partial scorer and safety boundaries.
  - [x] M07.6.3 — Test alternate pivots, noisy lookalikes, unknown scope, restore,
    and instructor payload.
- [x] M07.7 — Verify cumulative M04–M06 features and shared console regression.
  - [x] M07.7.1 — Verify cumulative workspaces and independent state/action restore.
  - [x] M07.7.2 — Verify navigation, scenario isolation, and M03–M06 regressions.

##### Module 7 correction — Module 6 lab + only Module 7 gaps (2026-09-27)

The Email and Network workspaces and their handlers worked, but Prove It was not
the cumulative console. Submit scored with the pre-evolution ticket formula
(`moduleSevenProveItPerformance`), never the M07 rubric. The ticket required two
imported labs plus an FTP lab labelled "REQUIRED". The ticket's account and
device lists were from the old imported-lab scenario (`svc-webapp01`,
`SRV-WEB07`), so the real case entities could not be selected.

- [x] G1 — Prove It is the Module 3 console carrying Modules 4–6 on this case,
  plus Email and Network (pack `m07`). Mail trace, mailbox interaction, DNS,
  TLS, firewall, proxy and process records are Log Search tables. Gateway alert
  ALT-7101 is the DMARC failure. Earlier tools run through adapters (`m05Fixture`,
  `m06Fixture` with a delivery-chain lead), with state in `moduleSevenState.tools`.
- [x] G2 — Submit scores with `SocM07AssessmentScorer` and stores the review
  payload. The scorer test now forbids the scorer only in rendering.
- [x] G3 — X7: all three imported labs are Optional Labs; the ticket gate is gone.
- [x] G4 — The ticket's entities are the case's own (`acct-63`/`acct-82`/`acct-17`,
  `WS-517`/`WS-204`), and its notes prompt describes this case.
- [x] S5 — Shared ATT&CK catalog expanded from Module 6's four techniques to 15
  common ones (phishing, valid accounts, spraying, run keys, RDP, exfiltration,
  impact, and more) so the carried ATT&CK workspace is usable from Module 7 on.
  Any catalog technique is a valid mapping; each rubric grades only its own truth.

Verification: full suite green. The headless-Chrome drive covered Log Search
over `EmailEvents` → message/URL/redirect/attachment review → recipient search
→ delivery evidence → network review including the benign lookalike → DNS→TLS
pivots → incident creation with unverified execution → carried Endpoint,
Hunting (delivery-chain lead) and ATT&CK (15 techniques) → ticket. The UI-built
state scored full marks on all 5 M07 criteria. Found, not fixed (outside this
work): the M07 knowledge-check heading overflows 4px at 390px.

#### Module 8 — Vulnerability Prioritization

- [x] M08.1 — Define independent vulnerability, asset, exploitability,
  reachability, control, and expected-priority fixtures.
  - [x] M08.1.1 — Define independent scenario identity, fixed clock, persistence
    key, asset inventory, and expected-priority truth.
  - [x] M08.1.2 — Add findings with CVE/CVSS, freshness, applicability, and
    exploitability evidence.
  - [x] M08.1.3 — Add asset criticality, reachability, exposure, and compensating
    control fixtures with linked stable IDs.
  - [x] M08.1.4 — Validate fixture integrity, immutability, and module isolation.
- [x] M08.2 — Define versioned findings state and remediation decision history.
  - [x] M08.2.1 — Add independent schema-versioned state defaults and persistence.
  - [x] M08.2.2 — Add typed finding review and remediation decision actions.
  - [x] M08.2.3 — Add bounded history, migration, reset, and restore validation.
- [x] M08.3 — Add finding freshness/applicability, CVE/CVSS, exposure, asset
  criticality, reachability, control, and remediation views.
  - [x] M08.3.1 — Add findings queue/detail with freshness, applicability, CVE,
    and CVSS.
  - [x] M08.3.2 — Add asset exposure, criticality, reachability, and control views.
  - [x] M08.3.3 — Add remediation context and filters that keep CVSS as one input.
- [x] M08.4 — Add incident linkage, risk acceptance/escalation, owner, due date,
  and status actions.
  - [x] M08.4.1 — Add evidence-supported incident linkage and risk acceptance.
  - [x] M08.4.2 — Add escalation rationale plus owner and due-date validation.
  - [x] M08.4.3 — Add status transitions and auditable remediation history.
- [ ] M08.5 — Implement scorer that weighs incident evidence and asset context,
  not CVSS alone, with explainable criteria.
  - [x] M08.5.1 — Define rubric and pure finding/asset/incident evidence extraction.
  - [x] M08.5.2 — Add weighted partial scorer with explainable rationale and
    instructor-only truth boundaries.
- [x] M08.6 — Test stale/irrelevant findings, compensating controls, corrected
  priorities, partial credit, ownership, and state restore.
  - [x] M08.6.1 — Test stale/irrelevant findings and control-adjusted alternate
    priorities.
  - [x] M08.6.2 — Test partial credit, corrected priority, owner/due-date actions,
    and state restore/instructor payload.
- [x] M08.7 — Verify cumulative M04–M07 features and shared console regression.
  - [x] M08.7.1 — Verify cumulative workspaces and separate state/action restore.
  - [x] M08.7.2 — Verify navigation, scenario isolation, and M03–M07 regressions.

##### Module 8 correction — Module 7 lab + only Module 8 gaps (2026-09-27)

The Exposure workspace and its handlers existed, but Prove It had the same
drift. Submit used the old ticket formula, never the M08 rubric. The ticket
required two imported labs plus two "REQUIRED" additional labs. Its notes
prompt described the imported labs. A bug (G4) also made part of the rubric
unreachable.

- [x] G1 — Prove It is the Module 3 console carrying Modules 4–7 on this case,
  plus Exposure (pack `m08`). Findings and finding, asset, incident and
  risk-exception evidence are Log Search tables. Assets are an `AssetInventory`
  watchlist. M08-INCIDENT-001 is in the queue. Module 7's Email/Network are
  carried through `SocConsoleTools.m07Fixture` and `embeddedBox`, empty here
  because the case has no mail or network records.
- [x] G2 — Submit scores with `SocM08AssessmentScorer` and stores the review
  payload.
- [x] G3 — X8: all four imported labs are Optional Labs; the gate is gone. The
  notes prompt describes this case.
- [x] G4 — **Bug:** the page's ticket change/input handlers were not scoped to
  the ticket form, and Exposure forms reuse the names `status` and `notes`.
  Choosing "Needs validation" or "Not applicable" in a finding review wrote into
  the ticket, and the re-render reset the select to "Reviewed". The review
  criteria (35 points) were unreachable. Module 7 had the same unscoped handler.
  Both are now scoped to their ticket forms, with a regression check in
  `soc-m06-cumulative-console-integration.test.js`. (The Module 8 persistence bug
  is fixed under the Module 6 correction.)

Verification: full suite green. The headless-Chrome drive covered Log Search
over `VulnerabilityFindings` → review of all three findings (reviewed / needs
validation / not applicable) → critical remediation decision with owner and due
date → status transition → incident link → risk acceptance → escalation →
ticket. The UI-built state scored full marks on all 8 M08 criteria. Found, not
fixed (outside this work): the M08 Practice It notes textarea overflows at 390px.

#### Module 9 — Incident Response

- [x] M09.1 — Define independent incident, identity, device, persistence,
  credential, backup, and action-result fixtures.
  - [x] M09.1.1 — Define independent scenario, fixed clock, incident graph, and
    expected response truth.
  - [x] M09.1.2 — Add identity/device, persistence, credential/session, and backup
    state fixtures with stable links.
  - [x] M09.1.3 — Add action success/failure/partial outcomes and benign/noisy
    examples; validate fixture integrity and isolation.
- [x] M09.2 — Define versioned mutable response state and append-only action
  execution history.
  - [x] M09.2.1 — Add versioned response defaults, persistence, reset, and migration.
  - [x] M09.2.2 — Add immutable typed action execution history with bounded IDs.
  - [x] M09.2.3 — Validate state transitions and restore without rewriting history.
- [x] M09.3 — Add incident queue, membership/relationships, assignment, severity,
  status, tasks, escalation, and approval state.
  - [x] M09.3.1 — Add incident queue/detail and membership/relationship changes.
  - [x] M09.3.2 — Add assignment, severity, status, and task workflows.
  - [x] M09.3.3 — Add escalation and approval state with audited transitions.
- [x] M09.4 — Add playbook/manual tasks and approval-gated identity, device, IOC,
  file, inbox-rule, and persistence actions.
  - [x] M09.4.1 — Add playbook/manual task authoring and completion evidence.
  - [x] M09.4.2 — Add approval-gated identity/device/session actions.
  - [x] M09.4.3 — Add approval-gated IOC/file/inbox-rule/persistence actions.
  - [x] M09.4.4 — Enforce role, scope, approval, and unsafe-action boundaries.
- [x] M09.5 — Make executed actions change simulated state and emit success,
  failure, or partial-result logs.
  - [x] M09.5.1 — Apply successful action effects to mutable simulated entities.
  - [x] M09.5.2 — Model failed and partial outcomes with deterministic action logs.
  - [x] M09.5.3 — Test replay/idempotency, audit history, and state restoration.
- [x] M09.6 — Add recovery inventory, known-good restore, scan, validation,
  monitoring period, and reopen condition.
  - [x] M09.6.1 — Add recovery inventory and known-good backup selection.
  - [x] M09.6.2 — Add restore, scan, and validation actions with bounded outcomes.
  - [x] M09.6.3 — Add monitoring period, residual-risk checks, and reopen conditions.
- [x] M09.7 — Implement scorer and tests for ordering, scope, approval, failures,
  retry/recovery, persistence, credentials, backup, and residual risk.
  - [x] M09.7.1 — Define rubric and pure response/effect evidence extraction.
  - [x] M09.7.2 — Add explainable partial scorer and unsafe-action cap.
  - [x] M09.7.3 — Test ordering, scope, approvals, failures, recovery, persistence,
    credentials, backup, and residual risk.
- [x] M09.8 — Verify cumulative M04–M08 features and shared console regression.
  - [x] M09.8.1 — Verify cumulative workspaces and independent state/action restore.
  - [x] M09.8.2 — Verify navigation, scenario isolation, and M03–M08 regressions.

##### Module 9 correction — Module 8 lab + only Module 9 gaps (2026-09-27)

M09.1–M09.6 were checked, but nothing reached a learner. `index.html` loaded
only the fixture, the page never used the state engine, and Prove It was still
the old source-tab evidence picker with a checkbox "response plan". M09.7 (the
scorer) and M09.8 were open.

- [x] G1 — Prove It is the Module 3 console carrying Modules 4–8 on INC-4937,
  plus Incident, Response and Recovery (pack `m09` over `SocM09AssessmentState`).
  All sixteen evidence records are Log Search rows. The workspaces cover
  priority, owner route and status; evidence review; tasks with completion
  evidence; escalation; the approval gate (request, then approve or reject by
  `ir-lead-*`, then execute); a simulated entity-state table; the action
  execution log; the backup inventory; known-good selection;
  restore/scan/validate; and the monitoring period with residual-risk reopen.
  Each executed action's outcome comes from the case's
  `actionOutcomeExamples` (so disabling acct-173 fails), never from the
  learner. Actions are stamped by a lab clock inside the scenario window.
- [x] G2 — **Engine fix:** an incident's approval was single-use
  (approved/rejected were terminal), so only one disruptive action could ever
  run. Also, an approved request could be retargeted without a new decision, an
  approval bypass. A decided approval can now be followed by a new request,
  which clears the old approver, and retargeting requires a new request.
  Covered in `soc-m09-assessment-state.test.js`.
- [x] G3 — M09.7: `portal/soc-m09-assessment-scorer.js` (nine weighted criteria,
  half credit for partial). The rubric gained the two MD criteria it lacked:
  evidence preserved before eradication/restore, and residual-risk escalation.
  **Rubric bug:** default incident relationships counted as learner scope
  evidence, giving partial credit for doing nothing. Only reviewed evidence
  counts now. `tests/soc-m09-assessment-scorer.test.js` builds states only
  through the engine API: empty scores 0, a full ordered response scores 100,
  and eradication before preservation loses that criterion.
- [x] G4 — Submit scores with the M09 scorer and stores the review payload. The
  ticket keeps its classification/scope findings but no longer carries the old
  response-plan checkboxes or source-review gates. Ticket handlers are scoped to
  `#m09-form`, because the Incident form's `severity`/`status` would otherwise
  overwrite the ticket.
- [x] G5 — **Persistence bug:** `SocM09AssessmentState` dropped LabRuntime's
  identity fields like M06/M08; fixed and added to the persistence test.
- [x] X9 — Module 9 has no supplemental labs gating the assessment; its imported
  project is the Practice It Guided Lab.

Verification: full suite green. The headless-Chrome drive covered Log Search →
triage → evidence review → preserve-evidence task → escalation → approved
isolate/revoke/disable (failed, as the case specifies)/remove-persistence →
known-good RP-WS-173-0918 → approved restore → scan → validate → monitoring
passed. The UI-built state scored full marks on all 9 criteria, and the ticket's
severity was untouched by the Incident form. Found, not fixed (outside this
work): the M09 Learn It scenario ticket header overflows at 390px.

#### Module 10 — Evidence and Case Documentation

##### Module 10 correction — cumulative ATT&CK evidence validation (2026-09-27)

The carried Module 6 ATT&CK workspace validated citations only against the
Module 6 expected-truth evidence list. Module 10 uses its own independent case
telemetry, so every otherwise valid mapping was rejected. Validation now also
accepts real event IDs present in the active fixture telemetry; each module's
scorer remains responsible for deciding whether that evidence supports the
mapping. A regression test covers a cumulative case event ID. The new
LabRuntime round-trip check also found that M10 reset discarded LabRuntime's
identity fields before the next edit; reset now preserves them, and a follow-up
intake is verified to save successfully. M11/M12 reset adapters now preserve
the same identity fields, with their state tests covering the round trip.

- [x] Correct cross-module ATT&CK evidence validation and cover it with a test.
- [x] Preserve LabRuntime identity when resetting the M10–M12 assessment state.
- [x] Add the Module 10 Assessment Lab correction section to this ledger.
- [ ] Finish remaining Module 10 verification before checking off M10 deliverables.

- [ ] M10.1 — Define independent post-containment evidence request, artifacts,
  custody truth, and reconstruction timeline.
  - [ ] M10.1.1 — Define independent case identity, fixed clock, request scope, and
    reconstruction truth.
  - [ ] M10.1.2 — Add synthetic artifact inventory, source metadata, and hashes.
  - [ ] M10.1.3 — Add custody truth and event-linked reconstruction timeline.
  - [ ] M10.1.4 — Validate fixture integrity, immutability, and module isolation.
- [ ] M10.2 — Define versioned locker state and append-only acquisition,
  transfer, hold, and export history.
  - [ ] M10.2.1 — Add versioned locker defaults, persistence, reset, and migration.
  - [ ] M10.2.2 — Add typed acquisition, custody transfer, legal-hold, and export
    actions.
  - [ ] M10.2.3 — Add bounded immutable history and restore validation.
- [ ] M10.3 — Convert evidence pins into locker intake with source, method, time,
  actor, hash, integrity, custodian, and incident fields.
  - [ ] M10.3.1 — Add pin-to-locker intake with required source, method, time, and
    actor metadata.
  - [ ] M10.3.2 — Add hash/integrity, custodian, incident, and chain-of-custody
    validation.
- [ ] M10.4 — Add custody transfers, legal hold scope, immutable original, and
  separate analyst notes.
  - [ ] M10.4.1 — Add evidence transfer workflow with actor, recipient, time, and
    integrity checks.
  - [ ] M10.4.2 — Add bounded legal-hold scope and immutable original artifacts.
  - [ ] M10.4.3 — Add separate analyst notes without mutating source evidence.
- [ ] M10.5 — Add reconstruction narrative with facts, analysis, root cause,
  evidence-linked ATT&CK, unknowns, and escalation boundary.
  - [ ] M10.5.1 — Add fact/analysis/root-cause narrative sections linked to evidence.
  - [ ] M10.5.2 — Add evidence-linked ATT&CK and explicit unknowns.
  - [ ] M10.5.3 — Add escalation boundary and persisted narrative history.
- [ ] M10.6 — Implement scorer and tests for metadata, custody, integrity,
  preservation, timeline, unsupported claims, and restore.
  - [ ] M10.6.1 — Define rubric and pure custody/timeline evidence extraction.
  - [ ] M10.6.2 — Add explainable partial scorer and unsupported-claim boundary.
  - [ ] M10.6.3 — Test metadata, custody, integrity, preservation, timeline, claims,
    and restore.
- [ ] M10.7 — Verify cumulative M04–M09 features and shared console regression.
  - [ ] M10.7.1 — Verify cumulative workspaces and independent state/action restore.
  - [ ] M10.7.2 — Verify navigation, scenario isolation, and M03–M09 regressions.

#### Module 11 — SOC Operations and Reporting

- [ ] M11.1 — Define independent mixed shift queue, timestamps, SLA truth,
  dispositions, workload, and report audience requirements.
  - [ ] M11.1.1 — Define independent shift identity, fixed clock, queue, and SLA
    expectations.
  - [ ] M11.1.2 — Add dispositions/workload fixtures and reporting audiences.
  - [ ] M11.1.3 — Validate timestamps, metrics truth, immutable fixtures, and
    module isolation.
- [ ] M11.2 — Define versioned assignment, handoff, report, closure, and
  improvement-action state.
  - [ ] M11.2.1 — Add versioned defaults, migration, persistence, and reset.
  - [ ] M11.2.2 — Add typed assignment/handoff/report/closure actions.
  - [ ] M11.2.3 — Add improvement-action ownership, due date, and restore checks.
- [ ] M11.3 — Add alert/incident queue, assignment, SLA, acknowledge/respond
  measures, and rule-specific noise views.
  - [ ] M11.3.1 — Add mixed alert/incident shift queue and assignment controls.
  - [ ] M11.3.2 — Add SLA, acknowledge/respond measures, and bounded time views.
  - [ ] M11.3.3 — Add rule-specific noise, disposition, and workload views.
- [ ] M11.4 — Add trends with limits against unsupported causal attribution.
  - [ ] M11.4.1 — Add deterministic trend aggregation from fixture-backed events.
  - [ ] M11.4.2 — Add caveats and validation preventing unsupported causal claims.
- [ ] M11.5 — Add technical narrative, executive summary, escalation, shift
  handoff, closure, residual risk, owner/due date, and lessons learned.
  - [ ] M11.5.1 — Add technical narrative and executive summary forms.
  - [ ] M11.5.2 — Add escalation and shift-handoff workflows with evidence links.
  - [ ] M11.5.3 — Add closure/residual risk, owner/due date, and lessons learned.
- [ ] M11.6 — Implement scorer and tests for priority, metrics, audiences,
  ownership, risk accuracy, and evidence-based closure.
  - [ ] M11.6.1 — Define rubric and pure priority/metrics/report extraction.
  - [ ] M11.6.2 — Add explainable weighted scorer and audience-safe review payload.
  - [ ] M11.6.3 — Test ownership, risk accuracy, metrics, alternate paths, and
    evidence-based closure/restore.
- [ ] M11.7 — Verify cumulative M04–M10 features and shared console regression.
  - [ ] M11.7.1 — Verify cumulative workspaces and separate state/action restore.
  - [ ] M11.7.2 — Verify navigation, scenario isolation, and M03–M10 regressions.

#### Module 12 — Cumulative Capstone

- [ ] M12.1 — Define independent multi-incident shift fixtures, all entities,
  intelligence, telemetry, vulnerabilities, backups, and scenario truth.
  - [ ] M12.1.1 — Define capstone identity, fixed clock, shift roster, incident
    cases, and expected section truth.
  - [ ] M12.1.2 — Add linked entities, intelligence, endpoint/network/email
    telemetry, and vulnerability fixtures.
  - [ ] M12.1.3 — Add backups, action outcomes, noise, and benign counterexamples.
  - [ ] M12.1.4 — Validate stable references, immutable truth, and M04–M11
    separation.
- [ ] M12.2 — Define versioned capstone state, migration, and auditable action
  history shared across every console workspace.
  - [ ] M12.2.1 — Define shared versioned defaults and migration contract.
  - [ ] M12.2.2 — Add workspace-scoped persistence adapters and reset/restore.
  - [ ] M12.2.3 — Add typed cross-workspace action history with validation.
- [ ] M12.3 — Assemble all cumulative features and seed alerts, incidents,
  assigned/unassigned queue, rules, noise, and new intelligence.
  - [ ] M12.3.1 — Mount cumulative shared console navigation and workspaces.
  - [ ] M12.3.2 — Seed alert/incident queues, assignments, detection rules, and noise.
  - [ ] M12.3.3 — Add intelligence updates and verify cumulative workspace state.
- [ ] M12.4 — Implement query-driven alert generation and incident relationship
  consequences for coverage, grouping, and precision.
  - [ ] M12.4.1 — Generate alerts deterministically from evaluated detection queries.
  - [ ] M12.4.2 — Apply incident grouping/linkage consequences and audit changes.
  - [ ] M12.4.3 — Test coverage, grouping, precision, and alternate valid queries.
- [ ] M12.5 — Implement workflow graph execution, approval enforcement, scope
  effects, and action logs.
  - [ ] M12.5.1 — Define bounded workflow graph and typed node/action contracts.
  - [ ] M12.5.2 — Enforce approvals, identity, and target scope at execution time.
  - [ ] M12.5.3 — Apply simulated effects and append deterministic execution logs.
- [ ] M12.6 — Implement containment, eradication, credential/session rotation,
  backup/restore, validation, monitoring, and reopen consequences.
  - [ ] M12.6.1 — Add containment/eradication and credential/session rotation effects.
  - [ ] M12.6.2 — Add backup restore, scan, and validation outcomes.
  - [ ] M12.6.3 — Add monitoring window, residual risk, and incident reopen logic.
- [ ] M12.7 — Implement pure 100-point section/criterion scorer with evidence,
  missed requirements, deductions, and executed-unsafe-action cap.
  - [ ] M12.7.1 — Define 100-point rubric weights and pure evidence extraction.
  - [ ] M12.7.2 — Add deterministic criterion scoring, partial credit, and deductions.
  - [ ] M12.7.3 — Add executed-unsafe-action cap and instructor review payload.
- [ ] M12.8 — Test perfect, pass-line, partial, corrected, alternate-query,
  broad/narrow, incident-link, evidence-gap, failed-action, ATT&CK correction,
  viewed-vs-executed unsafe, restore, and premature-close cases.
  - [ ] M12.8.1 — Test perfect/pass-line/partial, corrections, and alternate queries.
  - [ ] M12.8.2 — Test broad/narrow scope, incident/evidence gaps, and failed actions.
  - [ ] M12.8.3 — Test ATT&CK corrections, viewed/executed unsafe actions, restore,
    and premature closure.
- [ ] M12.9 — Add portfolio-ready report and verify instructor submission,
  progress restoration, and all cumulative capabilities.
  - [ ] M12.9.1 — Add portfolio-ready report from evidence-backed capstone state.
  - [ ] M12.9.2 — Integrate instructor submission/review payload and progress restore.
  - [ ] M12.9.3 — Verify cumulative capabilities and answer privacy before submit.

#### Cross-Module Assessment And Optional Labs Reconciliation

Each sprint verifies the new required/scored Assessment Lab and separates
retained supplemental labs from its grading and required-progress contract.
Module 12 verification must also confirm the new cumulative capstone replaces,
rather than duplicates, the legacy capstone assessment.

- [x] X4 — Verify Module 4's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [x] X5 — Verify Module 5's new Assessment Lab is independently assessed;
  retain the two imported projects in `Optional Labs` without gating it.
- [x] X6 — Verify Module 6's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [x] X7 — Verify Module 7's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [x] X8 — Verify Module 8's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [x] X9 — Verify Module 9's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [ ] X10 — Verify Module 10's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [ ] X11 — Verify Module 11's new Assessment Lab is the scored module assessment;
  retain supplemental labs in `Optional Labs` without gating it.
- [ ] X12 — Verify the new cumulative Module 12 Assessment Lab replaces the
  legacy capstone assessment as the required/scored capstone; retain supplemental
  labs separately as optional and avoid a second scored/duplicate capstone.

#### Final Regression

- [x] F2.1 — Run full course regression and repair regressions caused by this
  evolution.
  - [x] F2.1.1 — Inventory and execute all course test commands; capture baseline.
  - [x] F2.1.2 — Repair regressions attributable to M04–M12 changes and rerun tests.
- [ ] F2.2 — Verify scorer, saved-state migration, review payload, progress,
  duplicate-assessment absence, and no pre-submit answer leaks for M04–M12.
  - [ ] F2.2.1 — Verify all scorer outputs and instructor review payload contracts.
  - [ ] F2.2.2 — Verify migration, persistence, progress, and independent resets.
  - [ ] F2.2.3 — Verify one required/scored Assessment Lab per module and
    pre-submit answer privacy across M04–M12; allow separately labeled optional
    supplemental labs and verify they never gate the assessment.
- [ ] F2.3 — Reconcile every requirement checkbox in this ledger with working
  code and passing verification before closing the work.
  - [ ] F2.3.1 — Audit every completed checkbox against implementation and tests.
  - [ ] F2.3.2 — Resolve gaps and record final test evidence in this ledger.

### Final Verification

- [x] V1 — Run full regression, state restoration, scoring, and submission
  checks; repair any failures attributable to this work.
  - [x] V1.1 — Run final full regression and state restore suite.
  - [x] V1.2 — Run final scoring, submission, and instructor review checks.
- [ ] V2 — Confirm no duplicate assessment surfaces and all M04–M12
  capabilities are available cumulatively.
  - [ ] V2.1 — Verify navigation, cumulative features, and single assessment
    surface per module.
- [ ] V3 — Confirm this brief remains in `archive/historical-plans/` after all
  implementation items are complete.
  - [ ] V3.1 — Verify final checklist completion and archived tracker location.

### Sprint Notes

- Final regression pass (2026-09-27): every `tests/*.test.js` file passes;
  `node bin/portal-check.js 4 5 6 7 8 9 10 11 12`,
  `node bin/lab-state-check.js`, `node bin/render_all.js`, and
  `git diff --check` pass. `bin/portal-check.js` now reads the local script
  dependency order from `portal/index.html`, preventing false load failures as
  shared console components are extracted. M11 and M12 scorer/integration tests
  are included. The remaining X10–X12 and F2.2/F2.3/V2/V3 items still need the
  module-level UI/student-account acceptance pass and final checkbox audit.

- F0.1–F0.2 were completed before this ledger was added. The M03 regression
  command currently reports four failures in pre-existing Module 3 query and
  guided-step expectations; the M03 JS/CSS worktree edits predate this task.
- F1.1.1 — Added `portal/soc-console-core.js`, loaded it before the M03
  environment, and routed `moduleThreeConsoleHtml()` through the shared shell.
  `node tests/soc-console-core.test.js`, the M03 shell integration assertion,
  syntax checks, and `git diff --check` pass. The same four M03 fixture/step
  expectations still fail as recorded above.
- F1.1.2 — Added a scoped state adapter in `portal/soc-console-core.js` and
  replaced M03's local state merge while preserving `console.practice` and
  `console.prove`. Adapter, M03 shell/persistence, evolution, syntax, and diff
  checks pass. The M03 suite still has the same four pre-existing failures.
- F1.2.1 — Added `portal/soc-kql-search-ui.js` for schema, result rows, query
  history, and search-panel rendering; wired M03 through callbacks and added a
  visible history list. Dedicated renderer tests, shell/search integration,
  syntax, and diff checks pass. M03's four recorded baseline failures remain.
- F1.2.2 — Added reusable query execute, clear, and template transitions in
  `portal/soc-kql-search-ui.js`; M03 supplies its KQL evaluator and scenario
  source/pivot history callback. Focused transition/render tests, M03 shell and
  history assertions, syntax, and diff checks pass. The four baseline M03
  failures remain unchanged.
- F1.2.3 — Added `portal/soc-evidence-ui.js` and wired M03 pin buttons, pin
  toggles, and tray rendering while retaining the `pins` key and record IDs.
  Evidence unit tests, M03 tray/button integration, syntax, and diff checks
  pass. The four baseline M03 failures remain unchanged.
- F1.2.4.1 — Added `portal/soc-entity-ui.js`; M03 entity lists and account/IP/
  host profile layouts now use module-provided rows, fields, selection, and
  actions. Entity unit tests, M03 list/profile integration, syntax, and diff
  checks pass. The four baseline M03 failures remain unchanged.
- F1.2.4.2 — Added account/IP/host normalized pivot builders and renderer in
  `portal/soc-entity-ui.js`; M03 profiles use them and preserve the existing
  hunt action attributes. Tests exercised KQL quoting for hostile values and
  verified M03 profile pivots. Focused tests, syntax, and diff checks pass; the
  four baseline M03 failures remain unchanged.
- F1.2.5 — Added `portal/soc-timeline-ui.js`; M03 supplies its selected entity,
  fixture events, overlapping telemetry-gap items, and row/pin markup. Timeline
  unit tests, M03 integration, syntax, and diff checks pass. The four baseline
  M03 failures remain unchanged.
- F1.2.6.1 — Added `portal/soc-alert-queue-ui.js` and routed M03 queue rendering
  through it while preserving sort, severity, entity, caption, and selection
  behavior. Standalone renderer tests, M03 integration assertion, syntax, and
  diff checks pass. The four baseline M03 failures remain unchanged.
- F1.2.6.2 — Added configurable alert-detail rendering to
  `portal/soc-alert-queue-ui.js`; M03 provides its metadata fields, rule/query,
  hunt button, and timeline callbacks. Standalone and M03 detail assertions,
  syntax, and diff checks pass. The four baseline M03 failures remain unchanged.
- F1.3.1/F1.3.3 — Moved `scoreDomains()` into `portal/soc-assessment-scorer.js`
  and kept the progression API as a delegating wrapper. Exact output tests,
  progression tests, syntax checks, and diff checks pass.
- F1.3.2 — Added `scoreCriteria()` and deterministic instructor review output
  for awards, evidence, misses, deductions, feedback, and explicit caps. Tests
  verify repeatability, inspectable cap behavior, and no penalty for viewed-only
  options. Scorer, evolution, syntax, and diff checks pass.
- F1.3.4 — Added zero-credit, 70-point boundary, corrected outcome, alternate
  query equivalence, view-only versus executed unsafe, and repeatability tests.
  Scorer/evolution suites and diff checks pass.
- F1.4.1 — Updated four stale M03 test expectations to match the current
  scenario fixtures (three acct-428 auth events, attacker IP .18, five matching
  events, export P-3001, and approved restart S-4001). The complete
  `tests/m03-siem-console.test.js` now passes.
- F1.4.2 — Added `tests/m03-shared-console-integration.test.js` loading the
  actual shared scripts and M03 environment; shell, search/history, evidence,
  entities/profile, timeline, alert queue, and alert detail all pass together.
  The integrated test, full M03 suite, component/scorer suites, and diff check
  pass.
- F1.4.3 — Expanded the integration test to verify sparse legacy-state hydration,
  default values for both scopes, retention of saved query/tab/pin/selection
  values, stable `console.practice`/`console.prove` keys, and state object
  identity across repeated reads and shared-view renders.
- F1.4.4 — Combined foundation regression passed: evolution contract, scorer,
  shared renderer unit tests, shared-console integration, full M03 SIEM console
  suite, and `git diff --check`.
- M04.1 — Added the immutable `SocM04AssessmentData` fixture contract with
  fixed UTC scenario dates, independent authentication telemetry, reports,
  lifecycle-aware IOCs, and explicit expected rule/incident truth. Registered
  before the M04 script. Focused fixture tests, syntax, and diff checks pass.
- M04.2 — Added `SocM04AssessmentState` version 1 with deterministic legacy
  normalization, defaults, and preservation of existing M04 fields. Load
  persists migrated records; save/reset persist the normalized versioned shape.
  State/data contract tests, syntax, and diff checks pass.
- M04.3 — Added typed action events for all eight required activity groups,
  explicit timestamps, monotonic IDs, copied details, and a 200-event cap.
  Legacy histories normalize without losing records or reusing sequence IDs.
  Action/state/data tests, syntax, and diff checks pass.
- M04.4 — Mounted the independent scenario in `SocConsoleCore` with all M03
  baseline capabilities and additive M04 intelligence, analytics-rule, and
  automation tabs. Workspace choice persists through the versioned state
  adapter. M04 data/state/action/console tests and M03 integration/regression
  suites pass.
- M04.5 — Added report/IOC lifecycle editing to the Threat Intelligence tab,
  with source reliability, confidence, freshness, status, campaign, and
  explicitly unverified ATT&CK context. IOC validation covers IP/domain/
  URL/email/hash, dates, and report links; edits/status/expiry are persisted
  and action-logged. Focused M04 lifecycle/state/console tests and M03 suites
  pass. Review fixes ensure seeded IPs remain editable and dates/statuses are
  shown.
- M04.6.1 — Added KQL testing against the independent fixture, successful-query
  save, and query-to-rule-draft conversion with deterministic IDs and action
  logging. Failed/stale queries cannot be saved; UI feedback and stale results
  are handled; state round-trip tests confirm saved data and no truth leaks.
  M04 focused suites and both M03 regressions pass.
- M04.6.2 — Added validated rule name/description/severity/grouping/threshold/
  lookback editing and a preview rendered from the saved query plus current
  draft values. Edits persist and add timestamped rule-change events. M04
  focused suites, M03 regressions, syntax checks, and diff checks pass.
- M04.6.3 — Added configurable exclusions and suppression settings on the
  active rule, restricted to M04 telemetry columns with value/reason/window
  validation. Configuration is persisted, action-logged, and HTML-escaped in
  the preview. Focused M04 suites and both M03 regressions pass.
- M04.6.4 — Added rule enable/disable, validated schedule/frequency, pending
  run-now requests, bounded execution history, and typed scheduling/execution
  events. Disabled rules cannot execute; unscheduled rules cannot be recorded
  as scheduled. M04 focused suites and both M03 regressions pass.
- M04.7.1 — Added a pure fixed-clock evaluator for saved KQL against the
  lookback-filtered M04 telemetry. It handles raw rows and summarized numeric
  metrics, grouping/threshold semantics, and supporting event IDs without
  mutating rules or fixtures or generating alerts. Evaluator, M04, and M03
  regression suites pass.
- M04.7.2 — Added deterministic exclusions/suppression with matched event
  reasons, prior-candidate links, and retained evidence. Review tightened
  exclusions to remove matching telemetry rows before recomputing groups and
  thresholds; a mixed malicious/benign same-source regression prevents one
  excluded event from hiding five valid attempts. M04/M03 suites pass.
- M04.7.3 — Completed pending executions against the fixed evaluator, created
  alerts only for retained threshold-met candidates, and linked alerts to
  matched event IDs and execution history. Excluded/suppressed evidence remains
  reviewable; alert review state is persisted/action-logged. Pending/disabled
  execution, rule attribution, state restore, escaping, M04/M03 suites, syntax,
  and diff checks pass.
- M04.7.4 — Added broad/noisy, narrow/missed, corrected/correct, repeated-run,
  and post-edit rerun coverage. Tests confirm each run creates uniquely linked
  alerts and preserves earlier alert snapshots. M04 suites, M03 regressions,
  and diff checks pass.
- M04.8.1 — Added versioned action/execution records with deterministic,
  non-recycled IDs, 200-entry bounds, validated statuses, and typed audit
  events. State normalization restores missing collections and next sequences;
  focused M04 tests, both M03 regressions, syntax, and diff checks pass.
- M04.8.2 — Added idempotent simulated indicator enrichment and alert-evidence
  preservation, linked to IOC/alert/execution/event IDs. Invalid targets are
  rejected and no telemetry, account, or network state is changed. M04 tests,
  M03 regressions, syntax, and diff checks pass.
- M04.8.3 — Added validated simulated ticket create/update and SOC notification
  delivery. Ticket links persist to the latest action/execution, updates reuse
  one ticket, and notification repeats are individually recorded. Ticket IDs
  stay monotonic across bounded-history rollover. M04/M03 suites and static
  checks pass.
- M04.8.4 — Added bounded account/session/network approval requests with
  explicit pending/approved/rejected transitions and actor/time/reason audit.
  Approval remains record-only and never executes containment. State restore,
  validation, no-mutation, M04/M03 regressions, and static checks pass.
- M04.9.1 — Added an eight-criterion pure M04 rubric/evidence extractor for
  intelligence/IOC lifecycle, query/rule/schedule, alert coverage/tuning,
  automation safety, and case documentation. It reports evidence and explicit
  misses without scoring or mutating state. Focused M04/M03 tests and static
  checks pass.
- M04.9.2 — Added deterministic weighted M04 scoring through the shared
  `scoreCriteria` API, with partial credit, criterion-level feedback/evidence,
  explicit misses/deductions, and a 69-point critical cap only for an audited
  executed disruptive state change. Approval alone is not a safety violation.
  M04/M03 suites and static checks pass.
- M04.9.3 — Persisted score and criterion-level instructor review with the
  submitted case/catalog attempt. Feedback is hidden before submit and during
  redo; duplicate submits are immutable, while restored payloads remain
  available. Submit, state, M04/M03 regressions, and static checks pass.
- M04.10.1 — Added score regressions for correct, broad/noisy, narrow/missed,
  corrected, and partial outcomes. Assertions cover criterion point changes,
  evidence, misses, and learner-readable explanations. Focused scoring and
  full M04/M03 tests pass.
- M04.10.2 — Verified exploration-only actions do not reduce a correct score,
  restored state reproduces both score and instructor payload, duplicate submit
  creates no second catalog attempt, and redo hides prior feedback without
  deleting the saved result. Submit and M04/M03 suites pass.
- M04.10.3 — Exercised real account-disable, session-revoke, and network-block
  approval requests through pending and approved/rejected decisions. State
  remains unchanged and approved requests do not trigger the scorer cap. M04,
  M03 shared-console/SIEM regressions, and static checks pass.
- M04.11.1 — Added fixture-isolation and rendered-view checks. Truth references
  resolve within synthetic data; queried evidence remains visible, but answer
  key fields and criterion feedback do not appear before submit. No leak found.
  Fixture, console, submit, and M04/M03 regressions pass.
- M04.11.2 — Exercised every workspace tab through delegated navigation,
  capability flags, M04-key persistence, and reload restoration. M04 state stays
  isolated from the prior lab key, and M03 shared-console regressions pass.
- M04.11.3 — Aligned submitted case identity/entities to fixture DET-4424 and
  its confirmed acct-44/source-IP evidence. DET-4415 drafts preserve prior work
  and legacy identity while mapping selections. Scorer/case/console focused
  tests pass; catalog key/progress were not changed.
- M04.11.4 — Verified instructor attempts retain the existing catalog key,
  DET-4424/scenario identity, review payload, and progress flag. Duplicate
  submits are ignored; returned attempts reopen and successfully resubmit with
  prior immutable payload preserved. Submit and M04/M03 suites pass.
- M04.11.5 — Rendered Assessment Lab composition contains one nav entry, one
  shared console, one scored case form, and one submit control; the separate
  independent-practice activity remains intentionally distinct. No generic
  legacy assessment card is present. Full M04/M03 suites and static checks pass.
- M05.1.1 — Added an immutable fixed-clock M05 assessment identity, distinct
  from the legacy lesson/case key, with three inventoried devices and a typed
  endpoint telemetry schema. Focused fixture, M04/M03 regressions, syntax, and
  diff checks pass.
- M05.1.2 — Added linked browser/PowerShell/child-process, file/hash/reputation,
  Run-key persistence, detection-not-prevention outcome, and signed-updater
  counterexamples on the affected and neighboring devices. Expected truth
  references resolve in the fixture; M04/M03 and static checks pass.
- M05.1.3 — Validated unique fixture IDs, same-device process-parent links,
  truth/event references, canonical timestamps, hashes, deep immutability, and
  separation from M04/legacy M05 identities. Explicit fake-CAPTCHA evidence is
  learner-inspectable. M05/M04/M03 suites and static checks pass.
- M05.2.1 — Added versioned M05 assessment defaults and idempotent load/save/
  reset normalization under its own fixture state key. Bounded state collections
  restore without touching the legacy lesson key. M05/M04/M03 and static checks
  pass.
- M05.2.2 — Added ten typed M05 action categories with canonical UTC timestamps,
  validated details, deterministic non-recycled IDs, and a 200-record bound.
  Restore plus M05/M04/M03 regressions and static checks pass.
- M05.3.1 — Added a pure device inventory/profile and device-scoped fixed-window
  timeline with stable device selection, chronological ordering, explicit empty
  states, and escaped fixture text. Focused UI, all M05/M04 tests, M03 shared
  console regressions, syntax, and diff checks pass.
- M05.3.2 — Added device-scoped process ancestry with command line, user, and
  executable path details. Missing/cyclic parents, empty trees, invalid devices,
  and escaped values are tested. All M05/M04 tests, M03 regressions, syntax, and
  diff checks pass.
- M05.3.3 — Added device-scoped file/hash/signer/prevalence/reputation details
  linked to process and endpoint-control evidence, retaining malicious and benign
  comparisons. Missing metadata, zero prevalence, isolation, and escaping pass
  focused tests; full M05/M04/M03 regressions and static checks pass.
- M05.3.4 — Added persistence changes linked to process/file/hash evidence and
  endpoint control outcome views. Detection-only is not presented as prevention;
  empty states and device scope are tested. M05/M04/M03 suites and static checks
  pass.
- M05.3.5 — Integrated endpoint views into one shared-console surface inside the
  M05 Assessment Lab. At that point the two imported projects were retained as
  prerequisites. M05.8 corrects this known mismatch by preserving both projects
  as optional and removing their assessment/progress gating; X4–X12 verify the
  same contract across all modules. Device selection persists under the
  independent M05 state key and expected truth remains hidden. Scorer/catalog
  alignment to EDR-5127 is complete under M05.5/.6.
- M05.4.1 — Added fixture-validated evidence package selection and immutable
  `evidence_package_preserved` audit records with bounded event/hash references
  and restore validation. Invalid, cross-device, malformed, and empty selections
  do not persist or throw. M05/M04/M03 suites and static checks pass.
- M05.4.2 — Added fixture-bound isolation and quarantine requests with required
  reason/requester and immutable `pending_approval` records. Quarantine binds to
  a known device file/hash; restore validates pending requests. No endpoint action
  executes or mutates telemetry. M05/M04/M03 tests and static checks pass.
- M05.4.3 — Added bounded EDR handoffs containing validated fixture event/hash
  references, summary, owner, recipient, recommendation, and status. Handoff and
  status updates create immutable history and restore is validated; M05/M04/M03
  tests and static checks pass.
- M05.5.1 — Added an eight-criterion M05 rubric and pure extraction from the
  independent state/action history, including alternate text/event-reference
  evidence paths, response scope, preservation, handoff quality, and unsafe
  actions. Perfect/partial/missing/invalid/unsafe cases and input immutability
  pass. Review tightened malicious-file interpretation so ancestry alone cannot
  prove reputation. M05/M04/M03 tests and static checks pass.
- M05.5.2 — Added shared weighted scoring with bounded partial credit and a
  69-point cap for unsafe response decisions. Criterion-level awards, evidence,
  misses, and feedback remain instructor-only. Full/partial/missed/unsafe and
  alternate-path tests plus M05/M04/M03 regressions pass.
- M05.6.1 — Added end-to-end process ancestry/pivot, corrected analysis,
  partial-credit, and missed persistence/control scorer coverage. A correction
  now supersedes stale mistaken analysis without discarding referenced evidence.
  Focused M05, full M04, both M03 suites, syntax, and diff checks pass.
- M05.6.2 — Hardened restore validation for typed fixture-linked action records,
  evidence packages, pending approvals, and EDR handoffs/status. Reload tests
  verify immutable history, legacy-state isolation, and unchanged telemetry;
  safety-cap tests pass with full M05/M04/M03 regressions.
- M05.6.3 — Aligned the single scored case/catalog payload to EDR-5127 and its
  assessment scenario with idempotent migration from EDR-5119 preserving notes,
  selections, and action history. Instructor-only review payloads include scorer
  evidence and revision/attempt metadata. Duplicate suppression, save/reload,
  redo, and re-submit pass with M05/M04/M03 regressions.
- M05.7.1 — Combined M04/M05 regression verifies independent state keys, M04
  automation action/audit persistence with M05 enabled, and singular M04/M05
  console surfaces. Full M05/M04/M03 suites and static checks pass.
- M05.7.2 — Verified one M05 Assessment Lab navigation entry, dependency script
  order, stable M04/M05 case/scenario identities, distinct storage keys, and no
  cross-module state writes. M05/M04/M03 suites and static checks pass.
- M06.1.1 — Added immutable fixed-clock M06 assessment identity and dedicated
  state key with curriculum-aligned UpdateHealth seed lead and bounded device,
  account, and time scope. Contract tests prove deep immutability and separation
  from M04/M05/legacy M06. M05/M04/M03 regressions pass.
- M06.1.2 — Added linked scheduled-task, process, file-indicator, network, and
  identity events with stable IDs and fixed-window timestamps, plus a signed
  same-task maintenance counterexample. Referential integrity and all M05/M04/
  M03 regression suites pass.
- M06.1.3 — Added expected hypothesis truth and evidence-linked supported and
  unsupported ATT&CK assessments, including explicit gaps for transfer, web/C2,
  and persistence intent and the benign comparison. Reference/evidence logic,
  immutability, and M05/M04/M03 regressions pass.
- M06.1.4 — Expanded fixture contract checks for required/event-specific schema,
  canonical UTC bounds, process/related-event references, technique evidence,
  immutability, and M04/M05/legacy separation. M06 fixture and M05/M04/M03
  regression suites pass.
- M06.2.1 — Added schema-versioned state defaults and load/save/reset under the
  independent M06 assessment key, with idempotent migration, bounded collections,
  fixture-reference validation, and preserved legacy guided-hunt state. State,
  fixture, M05/M04, and M03 regression suites pass.
- M06.2.2 — Added bounded typed audit actions for hunt workflow operations with
  canonical UTC, deterministic monotonic IDs, deep immutability, strict fixture
  references, and restore validation. M06/M05/M04 and both M03 regressions pass.
- M06.3.1 — Added pure seed-lead review and escaped editable hypothesis,
  rationale, and confidence controls using independent M06 state defaults.
  Unverified status and bounded scope are shown; expected truth stays hidden.
  M06/M05/M04 and M03 regressions pass.
- M06.3.2 — Added fixture-bounded UTC/entity search and related-event pivots with
  deterministic results, persisted scope/query/pivot history, and escaped rows.
  Default range and monotonic query IDs are regression-tested; all M06/M05/M04/
  M03 suites and static checks pass.
- M06.3.3 — Added an allowlisted exact-match query grammar, saved query authoring,
  fixture-bounded execution, persisted definitions/run history, and panel feedback.
  Saved executions now record only their filtered results (not a misleading broad
  search); query IDs remain monotonic. M06/M05/M04 suites and diff checks pass.
- M06.3.4 — Added fixture-validated event bookmarks and persistent evidence
  collections with deduplicated, capped membership, create/edit/select controls,
  and typed audit actions. M06/M05/M04 and M03 regression suites pass; diff check
  is clean. M06.3 is complete.
- M06.4.1 — Added evidence-linked ATT&CK mapping selection with tactic/technique
  pairing, confidence, status, rationale, and required fixture-event references.
  Typed audit actions and strict restore validation reject mismatches. M06 tests
  and diff checks pass.
- M06.4.2 — Added mapping correction/replacement and reasoned removal workflows.
  Status-specific evidence validation now checks mappings against fixture truth;
  unsupported technique associations and malformed restored actions are rejected,
  with no expected answers exposed in the learner panel. M06/M05/M04/M03 suites
  and diff checks pass.
- M06.5.1 — Added a bounded alert/incident/rule proposal form with 1–20 unique
  fixture evidence events and bounded rationale/recommendation. Proposals persist
  with typed actions; restore rejects foreign or malformed evidence. Focused M06
  tests and diff checks pass.
- M06.5.2 — Added bounded proposal status transitions and learner-safe controls,
  with evidence-linked status history, typed actions, and restore validation that
  rejects foreign evidence or malformed transition records. M06/M05/M04/M03
  suites and diff checks pass; M06.5 is complete.
- M06.6.1 — Added an eight-criterion rubric and pure extraction from saved M06
  state and typed actions, linking each criterion to fixture event evidence and
  keeping expected answer text out of extraction output. Rubric tests and M03–M06
  regressions pass.
- M06.6.2 — Added an instructor-only weighted scorer on the shared scoring API,
  with full/partial/zero credit, criterion evidence/misses/feedback, and a 69-point
  safety cap for unsupported certainty. Rubric/scorer tests and diff checks pass.
- M06.6.3 — Expanded rubric/scorer tests for alternate valid paths, mapping
  correction, bounded scope, partial credit, uncertainty, restore, invalid
  evidence, and instructor-payload privacy. M03–M06 regression tests pass; no
  implementation defect found. M06.6 is complete.
- M06.7.1 — Added cumulative integration coverage confirming M04/M05 workspaces
  render with M06 registered and state/action history restore in separate module
  namespaces. Script order and M03–M06 tests pass; no M06-caused regression found.
- M06.7.2 — Cumulative integration verifies registry navigation/catalog routes,
  independent M04/M05/M06 scenario identities and persistence namespaces, and no
  cross-module action leakage. M03–M06 regression suites pass; M06 is complete.
- M07.1.1 — Added the independent M07 scenario identity, fixed UTC bounds,
  persistence key, recipient groups, and expected chain contract while explicitly
  leaving endpoint execution and credential compromise unverified. M07/M04–M06
  fixture tests and diff checks pass.
- M07.1.2 — Added linked synthetic mail headers/authentication, example-domain
  URL redirects, non-executable attachment metadata, delivery outcomes, and a
  recipient open/click event. Fixture contract tests and diff checks pass.
- M07.1.3 — Added linked DNS/TLS/firewall/proxy and endpoint-process events with
  stable IDs plus benign payroll-browsing lookalikes. Tests verify links/times and
  that browser telemetry does not establish payload execution or credential
  compromise. M07 fixture tests and diff checks pass.
- M07.1.4 — Added fixture-contract validation for cross-record references, UTC
  bounds, unique IDs, deep immutability, and M04–M06 identity/key isolation.
  Corrupted copies are rejected; M07 and neighboring fixture tests pass. M07.1
  is complete.
- M07.2.1 — Added independent M07 schema-versioned state defaults and load/save/
  reset under the fixture's state key with scenario identity. M07 state and data
  contract tests pass.
- M07.2.2 — Added bounded typed message/network review, pivot, scope, incident,
  and evidence actions with fixture references, canonical timestamps, monotonic
  IDs, and immutable audit records. M07 action/state tests pass.
- M07.2.3 — Restore rejects foreign/future scenarios and rebuilds reviewed
  selections, scope, pivots, incident links, and evidence changes from validated
  actions; legacy migration is idempotent and M04–M06 namespaces remain intact.
  M07 data/state/action tests pass, including unaudited-state tampering checks.
- M07.3.1 — Added an escaped independent message queue with expandable raw
  headers and SPF/DKIM/DMARC/alignment detail; review toggles persist as typed
  actions and formative M07 remains intact. All M07 tests and diff checks pass.
- M07.3.2 — Added escaped redirect-chain and attachment metadata inspection with
  fixture-bound review actions; URLs are inert text and files are never opened or
  executed. M07 UI/action/state/fixture tests and diff checks pass.
- M07.3.3 — Added delivered/blocked recipient trace, open/click status, and
  bounded recipient/device search and scope with typed action persistence. Existing
  email detail views remain; all M07 tests and diff checks pass. M07.3 is complete.
- M07.4.1 — Added a distinct escaped DNS/TLS/firewall/proxy workspace with
  fixture-bounded search/detail, typed event review, and pivots restricted to
  fixture-defined network links. M07 tests and diff checks pass.
- M07.4.2 — Added process ancestry details correlated only through explicit
  fixture proxy links with matching device/recipient and a 30-second bound;
  invalid/proximity-only matches are rejected and UI avoids claiming execution
  or compromise. M07 tests and diff checks pass.
- M07.4.3 — Added bounded synthetic packet samples selectable only by fixture
  event IDs, with escaped content and no fetch/filesystem/upload/open APIs.
  Foreign IDs and URL selectors return no sample; all M07 tests and diff checks
  pass. M07.4 is complete.
- M07.5.1 — Added a shared evidence tray across message, URL, attachment,
  delivery, interaction, network, and process records; add/remove operations use
  typed fixture-validated actions and escaped labels in both views. M07 tests and
  diff checks pass.
- M07.5.2 — Added incident create/update with unique typed IDs, selected fixture
  evidence, recipient/device scope consistency, learner-entered supported/unknown
  assessment, and escaped rendering. M07 tests and diff checks pass.
- M07.5.3 — Verified incident/evidence state replays from validated audit actions;
  forged projections and tampered/foreign refs are rejected, add/remove restores
  idempotently, and histories/projections are bounded. All M07 tests pass; M07.5
  is complete.
- M07.6.1 — Added a five-criterion pure chain/scope/evidence rubric using validated
  action history and fixture IDs only; no answer-key prose or scoring is exposed.
  Focused rubric tests and all M07 suites pass.
- M07.6.2 — Added a 100-point weighted instructor-only scorer with criterion
  evidence/misses/feedback and a 69-point cap for unsupported execution or
  credential-compromise claims. Review corrected the cap so selecting linked
  process evidence alone is not unsafe certainty; all M07 tests pass.
- M07.6.3 — Expanded rubric/scorer coverage for alternate pivots, benign noise,
  delivered/blocked scope, unknowns, partial credit, safety cap, restored/tampered
  state, and answer-key privacy. All seven M07 suites pass; M07.6 is complete.
- M07.7.1 — Extended cumulative integration to load M07 in production script
  order, verify M04–M07 namespaces/routes, prior workspaces, and independent
  state/action restoration. Integration test and diff checks pass.
- M07.7.2 — Verified M04–M07 registry/catalog navigation, pairwise-distinct
  scenario IDs/state keys, no cross-module action leakage, and all M03–M07 tests.
  M07 is complete.
- M08.1.1 — Added independent M08 scenario identity, fixed time bounds, state key,
  asset inventory, and expected-priority contract for WEB-DMZ-14. Isolation and
  immutability tests pass; no finding/CVE data was introduced in this sprint.
- M08.1.2 — Added synthetic current/applicable, stale/unverified, and irrelevant
  findings with CVE/CVSS, freshness, applicability, exploitability, and linked
  evidence. Contract tests verify scores/links/windows; no reachability/control
  fixtures were added. M08 fixture test and diff checks pass.
- M08.1.3 — Added evidence-linked criticality, reachability, exposure, and
  compensating controls for both assets, creating distinct context around
  similarly rated findings. M08 fixture contracts and diff checks pass.
- M08.1.4 — Added fixture checks for globally unique IDs, ownership-bound evidence,
  CVE/CVSS schema, timestamps/windows, deep immutability, M04–M07 isolation, and
  corrupted references/values. Stale historical evidence is allowed; future
  evidence is rejected. M08 and neighboring fixture tests pass; M08.1 complete.
- M08.2.1 — Added independent schema-versioned M08 defaults and load/save/reset
  under its fixture-derived key, with detached normalization and bounded finding,
  decision, and audit collections. M08 state/data tests pass.
- M08.2.2 — Added typed finding-review and remediation-decision actions with
  evidence ownership checks, canonical in-window timestamps, bounded immutable
  audit history, and deterministic IDs. M08 data/state/action tests pass.
- M08.2.3 — Restore validates typed action structure, sequence, timestamps, and
  fixture references; rebuilds projections from validated history; bounds
  collections; rejects future/foreign state; and migrates legacy projections
  idempotently. M08 data/state/action tests and diff checks pass. M08.2 is complete.
- M08.3.1 — Added an independent findings queue/detail with freshness,
  applicability, CVE/CVSS and escaped evidence; review actions persist through the
  typed state contract, while expected priority stays hidden. M08 tests pass.
- M08.3.2 — Added comparative asset views for business impact, reachability,
  exposure, and compensating controls with linked evidence IDs and escaped detail;
  CVSS is framed as one input and expected priority remains hidden. M08 tests pass.
- M08.3.3 — Added filters for freshness, applicability, asset, criticality tier,
  control status, and remediation-context search; details combine finding and asset
  evidence and state CVSS is only one input. Expected priority remains hidden; all
  M08 tests and diff checks pass. M08.3 complete.
- M08.4.1 — Added fixture-backed incident links and risk-acceptance records with
  evidence and bounded rationale; acceptance is available only for an explicitly
  supported fixture disposition. Typed actions persist the workflows, no answer
  priority is exposed, and all M08 suites pass.
- M08.4.2 — Added fixture-backed escalation routes with bounded rationale,
  eligible owners, valid non-past due dates, and linked evidence; typed actions
  restore into state and remediation decisions share owner/date validation. M08
  tests and diff checks pass.
- M08.4.3 — Added validated remediation status transitions with independent
  transition rationale, preserved original decision fields, immutable typed audit
  history, and replay/restore tamper checks. M08 suites pass; M08.4 is complete.
- M08.5.1 — Added eight pure criteria extracting audited finding reviews,
  applicability/freshness, asset context, incident/risk/escalation decisions,
  remediation outcomes, and uncertainty using fixture evidence IDs only. Tests
  pass and expected priority rationale is absent from extraction output.
- M08.5.2 — Added a 100-point shared-API scorer with full/partial/zero credit,
  criterion evidence/misses/feedback, asset-context credit requiring four evidence
  categories in the remediation decision, and instructor-only priority comparison.
  All M08 suites pass; learner UI does not render scorer output.
- M08.6.1 — Added scoring tests for stale/unverified and irrelevant higher-CVSS
  findings, controls that mitigate but do not erase exposure, and a reasoned
  alternate priority earning partial credit. All M08 suites pass; no production
  defect surfaced.
- M08.6.2 — Added test coverage for partial/corrected decisions, owner/date
  validation, immutable action history, serialized restore/idempotence, instructor
  truth accuracy, and learner answer privacy. All M08 suites pass; M08.6 complete.
- M08.7.1 — Extended cumulative integration to load M08 in production order,
  verify M04–M07 workspaces remain renderable, and assert state/action restoration
  across separate M04–M08 namespaces. Integration and diff checks pass.
- M08.7.2 — Verified both M08 labs remain cataloged under soc-08, registry route
  resolution, M04–M08 scenario/state isolation and no cross-module action leakage;
  full M03–M08 tests pass. M08 complete.
- M09.1.1 — Added independent M09 identity/key and fixed window, the INC-4937
  incident graph, and a separate expected-response truth contract. M09/M04–M08
  fixture tests verify isolation, normal-state privacy, and deep immutability.
- M09.1.2 — Added linked identity, device, persistence, credential/session, and
  backup evidence with stable IDs; tests cover duplicates, dangling links,
  timestamps, and immutability. Focused fixture test and diff check pass.
- M09.1.3 — Added immutable success/failure/partial action outcomes and
  benign/noisy context; validated outcome IDs, timestamps, references, and
  module isolation. M09 fixture test and diff check pass; M09.1 complete.
- M09.2.1 — Added versioned scenario-scoped response defaults/state, persistence,
  reset, and legacy migration. State and fixture contract tests and diff check pass.
- M09.2.2 — Added immutable typed action records, append-only updates,
  scenario-scoped monotonic IDs, and a bounded 500-record history. State/data
  contract tests, syntax, and diff checks pass.
- M09.2.3 — Added validated incident/entity/evidence transitions and restore
  checks preserving append-only action history without redundant saves. All M09
  tests, syntax, and diff checks pass; M09.2 complete.
- M09.3.1 — Added incident intake/queue/detail projections and validated
  membership/relationship changes; tests cover valid and invalid links and keep
  later workflows out of scope. All M09 tests and diff check pass.
- M09.3.2 — Added validated assignment, severity, status, and task workflows
  with immutable sequenced workflow history across restore. All M09 tests,
  syntax, and diff checks pass.
- M09.3.3 — Added audited escalation/approval transitions with rationale and
  approver validation; immutable history restores correctly. All M09 tests and
  diff checks pass; M09.3 complete.
- M09.4.1 — Added analyst-authored tasks and completion gated by notes and valid
  evidence references, with immutable workflow audit records. All M09 tests pass.
- M09.4.2 — Identity disable, device isolation, and session revoke require
  approval for exact action/target; immutable result records capture approver
  and reason. All M09 tests and diff checks pass.
- M09.4.3 — IOC blocking, file quarantine, inbox-rule removal, and persistence
  removal now require exact-target/action approval and audit the outcome. All
  M09 tests and diff checks pass.
- M09.4.4 — Approval requires IR-lead role, exact in-scope action/target match,
  and cannot be bypassed by caller flags. Denial and allowed-action tests pass;
  M09.4 complete.
- M09.5.1 — Successful approved response actions apply scoped, persisted,
  idempotent entity effects and immutable effect records; fixture truth remains
  unchanged and failures have no effect. All M09 tests pass.
- M09.5.2 — Failure logs `no_change`; partial logs `partially_completed` and
  modifies only the target action field. Deterministic restore behavior and all
  M09 tests pass.
- M09.5.3 — Sequential replay tests verify stable effects, distinct ordered
  audit entries, immutability, exact history restoration, and next ID. M09.5
  complete; all M09 tests pass.
- M09.6.1 — Added bounded recovery-point inventory and incident-scoped,
  integrity-checked backup selection recorded in immutable history. No restore
  effects occur at selection; all M09 tests pass.
- M09.6.2 — Approved exact-scope restore/scan/validation now enforce selected
  verified backup and stage order, with immutable backup-linked bounded outcome
  records. All M09 tests and diff checks pass.
- M09.6.3 — Added deterministic 30-minute monitoring, capped at scenario end;
  residual risk immutably reopens the incident. Boundary, restore, and full M09
  tests pass; M09.6 complete.

## Purpose

Rebuild the SOC Analyst Assessment Labs for Modules 4–12 as sequential evolutions of the existing Module 3 Assessment Lab.

Module 3 is the baseline Mission Next SIEM. Each later module must retain the same overall interface, navigation patterns, query behavior, evidence workflow, and case-record experience while adding only the capabilities required by that module’s curriculum. By Module 12, the learner must be working in the complete Mission Next SOC environment they have already learned incrementally. The new module-specific Assessment Labs are the required/scored experiences; existing supplemental labs remain available in separate optional sections and never gate assessment or progress.

Module 12 Assessment Lab is the new cumulative capstone and replaces the legacy required capstone assessment. It is the only required/scored Module 12 lab; supplemental learning labs, if retained, are clearly marked optional.

## Governing implementation rule

“Copy Module 3” means copy its learner experience and reuse its working components. Do **not** create eight independent copies of the Module 3 source code.

Extract or generalize a shared SOC console that supports module-specific:

- Scenario fixtures.
- Telemetry tables.
- Navigation tabs and feature flags.
- Alerts and incidents.
- Assessment instructions.
- Expected scenario truth.
- Scoring rules.
- Case-record configuration.

Modules 4–12 should consume the shared console through configuration and small module-specific extensions. Fixes to shared search, evidence, timeline, or case-record behavior must apply consistently to every later module.

## Module 3 baseline to preserve

The Module 3 Assessment Lab already provides the foundation:

- Mission Next SIEM console shell.
- Independent assessment dataset.
- Alert view.
- Working KQL-style query editor and engine.
- Normalized multi-source log tables.
- Query results and query history.
- Cross-source pivots.
- Timeline.
- Identity and IP context.
- Watchlists and source-health information.
- Record-details drawer.
- Evidence pinning.
- Standard case record.
- Local/server state persistence.
- Partial-credit assessment scoring.
- Instructor-review submission.

All later Assessment Labs must retain these capabilities unless the curriculum specifically requires an extension.

## Required shared architecture

Before rebuilding Module 4, identify the reusable Module 3 components and place them behind a shared interface. Exact filenames may follow existing repository conventions, but responsibilities must remain separated.

Recommended responsibilities:

```text
soc-console-core.js          Shared navigation, workspace, drawers and state flow
soc-console-search.js        KQL editor, execution, results and saved searches
soc-console-evidence.js      Pins, evidence tray and later evidence-locker support
soc-console-timeline.js      Entity and incident timelines
soc-console-entities.js      Identity, device, IP, asset and resource profiles
soc-console-alerts.js        Alert queue and alert-detail behavior
soc-console-incidents.js     Incident queue, relationships and ownership
soc-console-rules.js         Saved queries, analytics rules and schedules
soc-console-intel.js         Threat reports and IOC management
soc-console-automation.js    Workflow definitions, approvals and executions
soc-console-response.js      Containment, eradication and recovery state
soc-console-reporting.js     Handoffs, reports, closure and lessons learned
soc-assessment-scorer.js     Shared scoring helpers and explainable breakdowns
```

Do not rename existing stable keys or break saved learner progress. Add migrations or normalization for older saved state when required.

## Rules for every Assessment Lab

Every module from 4–11 must include:

1. A separate assessment scenario that is not a replay of the Guided Lab.
2. The familiar Module 3 console experience.
3. Only the new tools needed for that module plus all tools learned previously.
4. A standard case record or module-appropriate operational record.
5. Observable learner state and an action history.
6. Deterministic scoring based on outcomes, not exact clicks.
7. Partial credit.
8. Instructor-readable scoring evidence and missed requirements.
9. No pre-submission answer reveal in the Assessment Lab.
10. Automated tests for the scorer and critical interface behavior.

Exploration must not reduce the score. Unsafe actions count only when executed. A learner must be able to recognize and correct an earlier mistake.

---

# Module 4 — Detection Rules, Threat Intelligence & Automated Monitoring

## Assessment Lab purpose

Extend the Module 3 SIEM from investigating existing alerts to creating, testing, and operating detections from new threat intelligence.

## Retain from Module 3

- Alerts.
- Log Search and KQL engine.
- Timeline.
- Entities.
- Data Sources.
- Evidence pins.
- Case Record.
- Query history.

## Add in Module 4

### Threat Intelligence workspace

- Threat-intelligence reports.
- Source reliability.
- Confidence.
- First seen and last seen.
- Active, expired, retired, and contextual status.
- Indicator types: IP, domain, URL, email address and file hash.
- IOC creation and editing.
- IOC expiration.
- Campaign association.
- ATT&CK references supplied by the report but not automatically accepted as proven.

### Analytics Rules workspace

- Save a successful query.
- Convert a query into an analytics rule.
- Rule name and description.
- Severity.
- Grouping fields.
- Threshold.
- Lookback period.
- Execution frequency.
- Enable/disable state.
- Run now.
- Rule execution history.
- Exclusions and suppression.
- Alert preview before activation.

### Dynamic alert generation

Running or scheduling a rule must evaluate the scenario telemetry and create simulated alerts from the actual results.

Broad logic must create noisy alerts. Narrow logic must miss relevant activity. Correct logic must create the intended alert set.

### Introductory automation

Add bounded, low-risk actions:

- Enrich an indicator.
- Preserve matching records.
- Create or update a ticket.
- Notify the SOC queue.
- Request approval for disruptive action.

Do not yet make Module 4 a full incident-response lab.

## Module 4 Assessment scenario

The student receives a new intelligence report during a normal shift. They must:

1. Evaluate the report.
2. Create the appropriate IOC records.
3. Write and test a query.
4. Tune its time window, grouping and threshold.
5. Convert it into an analytics rule.
6. Run it immediately.
7. Schedule future execution.
8. Review the alerts it produces.
9. Identify noise or missed coverage.
10. Select a safe introductory automation action.
11. Complete the case record.

## Grade in Module 4

- Intelligence interpretation.
- IOC accuracy and lifecycle fields.
- Query-result coverage and precision.
- Rule grouping, threshold and time window.
- Schedule configuration.
- Generated-alert fidelity.
- Detection tuning.
- Safe automation boundary.
- Case documentation.

---

# Module 5 — Endpoint & Malware Investigation

## Assessment Lab purpose

Extend the Module 4 console so an alert can be investigated through endpoint processes, files, persistence and device context.

## Retain from earlier modules

Retain the complete Module 3 console plus Module 4 Threat Intelligence, IOC, saved-query and Analytics Rule capabilities.

## Add in Module 5

### Endpoint workspace

- Device inventory and device profile.
- Device timeline.
- Process creation telemetry.
- Parent/child process tree.
- Command line.
- Executable path.
- User context.
- File details.
- Hashes.
- Signer and signature state.
- Prevalence and reputation.
- Endpoint detection status.
- Persistence locations and changes.
- Prevention versus detection outcome.

### Endpoint actions

At this stage, emphasize investigation and recommendation. Allow the student to:

- Request device isolation.
- Request file quarantine.
- Preserve an endpoint evidence package.
- Escalate to the endpoint/EDR team.

If an action is executable, require approval and record the result.

## Module 5 Assessment scenario

The student receives an endpoint-linked alert. They must:

1. Pivot from the alert to the affected device.
2. Follow the parent/child process chain.
3. Interpret the command line and path.
4. Evaluate the file and hash.
5. Identify demonstrated persistence.
6. Determine whether the control prevented, detected, or missed execution.
7. Bound the affected endpoint scope.
8. Preserve the strongest evidence.
9. Recommend or request proportionate endpoint action.
10. Complete the case record and handoff.

## Grade in Module 5

- Correct affected device.
- Process ancestry.
- Command and file interpretation.
- Hash use without treating novelty as proof.
- Persistence identification.
- Prevention-versus-cleanup reasoning.
- Scope.
- Evidence selection.
- Proportionate endpoint recommendation.
- Technical handoff.

---

# Module 6 — Threat Hunting & Investigation

## Assessment Lab purpose

Extend the SIEM from alert-led investigation to hypothesis-driven hunting across identities, devices, indicators and behaviors.

## Retain from earlier modules

Retain all search, intelligence, detection, endpoint, timeline, evidence and case-record capabilities.

## Add in Module 6

### Hunting workspace

- Structured hunting hypothesis.
- Observable behavior or expected evidence.
- Bounded time range.
- Seed indicator or behavior.
- Saved hunting queries.
- Bookmarks.
- Entity pivots.
- Hunt collections.
- Related-event search.
- Hunt conclusion.
- Convert hunt result into an alert, incident or proposed analytics rule.

### ATT&CK workspace

- Tactic and technique selection.
- Evidence attachment to each mapping.
- Confidence.
- Supported, unsupported and unverified status.
- Removal of mappings that exceed demonstrated behavior.

## Module 6 Assessment scenario

The student receives a weak seed indicator or behavioral lead rather than a complete alert. They must:

1. Write a testable hypothesis.
2. Choose an appropriate time and entity scope.
3. Search related identity and endpoint activity.
4. Pivot from the seed into related entities.
5. Bookmark the minimum defensible evidence chain.
6. Decide whether the hypothesis is supported, rejected or unresolved.
7. Map only demonstrated behavior to ATT&CK.
8. Identify a detection gap.
9. Propose an alert, incident or rule improvement.
10. Document limitations and next steps.

## Grade in Module 6

- Testable hypothesis.
- Appropriate hunt scope.
- Useful pivots.
- Query-result relevance.
- Evidence bookmarks.
- Supported conclusion.
- ATT&CK accuracy.
- Explicit unknowns.
- Detection-gap identification.
- Actionable handoff.

---

# Module 7 — Network & Email Analysis

## Assessment Lab purpose

Extend the console with email-delivery and network-session evidence so the learner can reconstruct delivery, execution and outbound communication.

## Retain from earlier modules

Retain all existing alerts, search, endpoint, hunt, ATT&CK, evidence and case-record capabilities.

## Add in Module 7

### Email workspace

- Message events.
- Sender, return path and reply-to.
- SPF, DKIM and DMARC results.
- Headers.
- URLs and redirects.
- Attachments and hashes.
- Delivery action.
- Recipient scope.
- Message trace.
- User click/open events.

### Network workspace

- DNS events.
- TLS sessions.
- Firewall/proxy records.
- Source and destination.
- Port and protocol.
- Process-to-network connection.
- Session outcome.
- Network timeline.
- Bounded packet/PCAP viewer when appropriate.

## Module 7 Assessment scenario

The student investigates a suspected delivery chain. They must:

1. Validate the sender and message authentication results.
2. Inspect the URL or attachment.
3. Determine delivery and recipient scope.
4. Correlate the user action with endpoint execution.
5. Correlate endpoint execution with DNS/TLS/network activity.
6. Separate related traffic from nearby noise.
7. Determine confirmed and unverified scope.
8. Preserve email and network evidence.
9. Update or create the appropriate incident.
10. Complete the case record.

## Grade in Module 7

- Email-header interpretation.
- URL/attachment analysis.
- Delivery scope.
- DNS/TLS/session interpretation.
- Process-to-network correlation.
- Timeline.
- Noise rejection.
- Scope.
- Evidence selection.
- Incident documentation.

---

# Module 8 — Vulnerability Findings & SOC Prioritization

## Assessment Lab purpose

Extend the console with exposure and vulnerability context so the student can determine which weaknesses materially affect the incident and remediation priority.

## Retain from earlier modules

Retain all investigation, entity, endpoint, network, evidence, incident and reporting foundations.

## Add in Module 8

### Exposure workspace

- Vulnerability findings.
- CVE and CVSS.
- Exploitability and known exploitation status.
- Finding freshness.
- Asset role and criticality.
- Internal/external exposure.
- Reachability from demonstrated attacker activity.
- Compensating controls.
- Control gaps.
- Remediation status.
- Remediation owner and due date.
- Risk acceptance or escalation route.

## Module 8 Assessment scenario

The student receives several findings associated with assets appearing in SOC telemetry. They must:

1. Validate that each finding is current and applicable.
2. Determine whether the asset is exposed or reachable.
3. Compare technical severity with asset value and incident evidence.
4. Identify the vulnerability or control gap that materially contributed.
5. Separate urgent remediation from high-CVSS but unrelated findings.
6. Identify compensating controls.
7. Prioritize remediation.
8. Assign an owner, due date and escalation condition.
9. Link the finding to the appropriate incident when supported.
10. Document the decision.

## Grade in Module 8

- Finding validation.
- Exposure and reachability.
- Asset criticality.
- Exploitability and active-threat context.
- Contributing-control-gap decision.
- Correct prioritization.
- Avoidance of CVSS-only reasoning.
- Compensating-control interpretation.
- Ownership and due date.
- Documentation.

---

# Module 9 — Incident Response

## Assessment Lab purpose

Extend the console so the learner can execute a bounded incident-response lifecycle against simulated identities, devices, indicators and business services.

## Retain from earlier modules

Retain the full investigation and prioritization environment.

## Add in Module 9

### Incident workspace

- Incident queue.
- Alert membership.
- Owner and assignment.
- Severity and priority.
- Status transitions.
- Related, duplicate, parent and child incidents.
- Response tasks.
- Escalation path.
- Approval state.

### Response workspace

- Response playbooks.
- Manual and automated tasks.
- Approval gates.
- Device isolation.
- Session revocation.
- Account disable/reset.
- Token and app-password revocation.
- IOC blocking.
- File quarantine.
- Inbox-rule removal.
- Persistence removal.
- Evidence preservation.
- Action execution log.
- Successful, failed and partially completed actions.

### Recovery workspace

- Credential rotation.
- Rebuild or restore choice.
- Backup inventory and timestamps.
- Known-good backup selection.
- Clean scan.
- Policy correction.
- Business-owner validation.
- Monitoring period.
- Reopen condition.

Executed actions must change simulated state and generate corresponding logs.

## Module 9 Assessment scenario

The student receives a confirmed incident with identity and endpoint impact. They must:

1. Confirm the incident priority and ownership.
2. Preserve necessary evidence.
3. Select proportionate containment targets.
4. Use approval gates for disruptive actions.
5. Execute containment.
6. Verify which actions succeeded or failed.
7. Remove demonstrated persistence.
8. Rotate affected credentials and sessions.
9. Select an appropriate recovery method or backup.
10. Validate recovery and continued monitoring.
11. Escalate remaining gaps.
12. Update the incident record.

## Grade in Module 9

- Incident priority and ownership.
- Evidence-before-eradication discipline.
- Correct containment scope.
- Approval use.
- Action ordering.
- Response execution results.
- Persistence removal.
- Credential/session recovery.
- Backup/rebuild decision.
- Recovery validation.
- Remaining risk and escalation.

---

# Module 10 — Incident Evidence Handling, Chain of Custody & Case Documentation

## Assessment Lab purpose

Extend the existing evidence pins into a defensible evidence locker and require the student to reconstruct the case without mixing observation, analysis and unsupported conclusions.

## Retain from earlier modules

Retain the complete incident, response, timeline, evidence and case-record experience.

## Add in Module 10

### Evidence Locker

- Evidence identifier.
- Evidence type.
- Original source.
- Acquisition method.
- Acquisition time.
- Acquired by.
- File or record hash.
- Integrity status.
- Current custodian.
- Custody transfers.
- Related incident.
- Analyst notes separated from original evidence.
- Export/package history.

Evidence pins should become the intake mechanism for the Evidence Locker.

### Case reconstruction

- Observed facts.
- Supported analysis.
- Root-cause statement.
- ATT&CK mappings tied to evidence.
- Explicit unknowns.
- Attachment-to-execution-to-persistence chain.
- Evidence gaps and specialist escalation.

## Module 10 Assessment scenario

The student receives a post-containment incident and evidence collection request. They must:

1. Select the evidence required to reconstruct the case.
2. Record source and acquisition context.
3. Record or verify hashes.
4. Establish custody.
5. Transfer one or more artifacts correctly.
6. Preserve original evidence.
7. Reconstruct the incident timeline.
8. Separate observation from interpretation.
9. Map supported behavior to ATT&CK.
10. Document unknowns and escalation boundaries.
11. Complete the case documentation package.

## Grade in Module 10

- Evidence selection.
- Acquisition metadata.
- Hash/integrity handling.
- Custody accuracy.
- Preservation of originals.
- Timeline reconstruction.
- Fact-versus-analysis separation.
- Root-cause support.
- ATT&CK evidence linkage.
- Unknowns and escalation.

---

# Module 11 — SOC Operations, Metrics, Reporting & Communication

## Assessment Lab purpose

Extend the console into a shift-level operational workspace that measures queue health and produces audience-appropriate handoffs, reports and closure decisions.

## Retain from earlier modules

Retain all alerts, incidents, investigation, response, evidence and case-record capabilities.

## Add in Module 11

### SOC Operations dashboard

- Alert volume.
- True-positive/benign-positive/false-positive distribution.
- Incident backlog.
- Assigned and unassigned work.
- SLA status.
- Mean time to acknowledge.
- Mean time to contain/respond.
- Rule-specific noise.
- Analyst workload.
- Queue trend without unsupported causal claims.

### Reporting workspace

- Technical case narrative.
- Executive summary.
- Escalation notice.
- Shift handoff.
- Closure report.
- Confirmed scope.
- Remaining unknowns.
- Business impact.
- Current containment and recovery status.
- Residual risk.
- Owner and due date.
- Lessons learned.
- Detection improvement.

## Module 11 Assessment scenario

The student receives a mixed shift queue and one incident requiring handoff or closure. They must:

1. Prioritize the queue against SLA and impact.
2. Assign or escalate work appropriately.
3. Interpret operational metrics without overstating causation.
4. Identify a noisy or underperforming rule.
5. Prepare an actionable shift handoff.
6. Produce an evidence-based technical narrative.
7. Produce a concise executive summary.
8. State containment, recovery and residual risk accurately.
9. Assign follow-up ownership and due dates.
10. Document lessons learned and detection improvements.
11. Close or retain the incident based on recovery evidence.

## Grade in Module 11

- Queue prioritization.
- SLA awareness.
- Assignment and escalation.
- Metrics interpretation.
- Rule-noise recognition.
- Shift handoff.
- Technical report.
- Executive summary.
- Residual-risk accuracy.
- Ownership and due dates.
- Lessons learned.
- Defensible closure decision.

---

# Module 12 — SOC Analyst Capstone

## Assessment Lab purpose

Activate every capability introduced from Modules 3–11 in one independent, stateful SOC shift. This is the new final capstone Assessment Lab, replacing the legacy capstone as the required/scored capstone experience. Any supplemental labs are optional and do not gate the capstone.

## Capstone starting state

The learner begins with:

- A populated alert queue.
- Multiple assigned and unassigned incidents.
- Routine benign activity and false-positive noise.
- Existing analytics rules with different quality levels.
- One unresolved incident that may relate to new intelligence.
- New threat intelligence received during the shift.
- Multiple identities, devices, assets, email records, endpoint records, network sessions, vulnerabilities and backups.

## Required capstone sequence

The interface must not force one click path, but the scenario must support and grade these outcomes:

1. Review and prioritize the existing queue.
2. Evaluate the new threat intelligence.
3. Create or update IOC records.
4. Form a testable hunting hypothesis.
5. Write and test SIEM queries.
6. Tune entity filters, time windows, joins, grouping and thresholds.
7. Convert successful searches into analytics rules.
8. Run the rules immediately.
9. Schedule recurring execution.
10. Review the generated alerts.
11. Separate true, benign and false-positive results.
12. Link alerts to the correct existing or new incidents.
13. Investigate identity activity.
14. Investigate email delivery and user interaction.
15. Investigate endpoint execution, files and persistence.
16. Investigate DNS, TLS and network activity.
17. Evaluate vulnerability/exposure context.
18. Reconstruct the timeline.
19. Determine confirmed scope and remaining unknowns.
20. Preserve evidence and complete custody records.
21. Map demonstrated behavior to ATT&CK.
22. Tune detections.
23. Build an automation workflow.
24. Place disruptive actions behind approval gates.
25. Execute containment against confirmed entities.
26. Verify successful, failed and incomplete actions.
27. Remove demonstrated persistence.
28. Rotate affected credentials, tokens and sessions.
29. Repair, rebuild or restore from a known-good backup.
30. Validate recovery and schedule continued monitoring.
31. Complete the technical case narrative.
32. Complete the executive summary and shift handoff.
33. Assign follow-up owners and due dates.
34. Document lessons learned and detection improvements.
35. Close or retain the incident based on actual recovery evidence.

## Capstone consequence engine

Student decisions must affect later state:

- Broad queries create excess alerts and possible incorrect incident associations.
- Narrow queries miss relevant activity.
- Incorrect grouping separates related activity or merges unrelated entities.
- Wrong incident relationships distort scope.
- Unsafe automation can affect unrelated assets.
- Incomplete containment leaves activity active.
- Incomplete credential rotation leaves valid access paths.
- Incorrect backup selection can restore compromised state.
- Premature closure leaves recovery requirements unmet.
- Correct tuning reduces noise while retaining malicious coverage.

The interface must not immediately reveal that a decision is wrong. The resulting evidence, alerts, actions and system state should make the consequence visible.

## Capstone rubric — 100 points

| Section | Points |
|---|---:|
| Intelligence and preparation | 10 |
| Queries, detection rules and scheduling | 18 |
| Alert validation and incident management | 12 |
| Cross-domain investigation | 18 |
| Timeline, scope, evidence and ATT&CK | 12 |
| Detection tuning, automation and containment | 14 |
| Eradication and recovery | 8 |
| Reporting, operations and lessons learned | 8 |
| **Total** | **100** |

Passing score: **70 points**.

Most mistakes reduce points but do not automatically fail the student. Only executed, deliberately unsafe actions may cap the score at 69:

- Deleting or intentionally altering evidence.
- Bypassing approval for destructive containment.
- Executing enterprise-wide destructive action against unsupported scope.
- Falsifying containment, recovery or closure evidence.

## Capstone scoring requirements

The scorer must be a pure, deterministic function of:

```text
scoreSocCapstone({ state, actionHistory, scenarioTruth })
```

It must return:

- Total score.
- Pass/fail.
- Safety-cap status.
- Points by section and criterion.
- Evidence supporting awarded points.
- Missed requirements.
- Deductions.
- Instructor-readable feedback.

Grade query outcomes, not exact query strings. Grade workflow nodes, edges, targets, approvals and execution results, not a single prescribed workflow. Grade reports using structured facts and evidence references, not character count.

---

# Sequential implementation order

Complete the work in this order:

1. Generalize the Module 3 Assessment Lab into shared console components.
2. Build and verify Module 4 Assessment Lab.
3. Build and verify Module 5 Assessment Lab.
4. Build and verify Module 6 Assessment Lab.
5. Build and verify Module 7 Assessment Lab.
6. Build and verify Module 8 Assessment Lab.
7. Build and verify Module 9 Assessment Lab.
8. Build and verify Module 10 Assessment Lab.
9. Build and verify Module 11 Assessment Lab.
10. Build Module 12 Capstone from the cumulative shared capabilities.
11. Run full regression, progress, scoring and submission tests.

Do not begin the next module until the current module’s interface, state restoration, scorer and tests pass.

## Required deliverables for each module

For every Assessment Lab from Modules 4–11, deliver:

- Module-specific scenario narrative.
- Synthetic telemetry fixtures.
- Scenario-truth object.
- Enabled console features.
- New tables or entity types.
- Assessment instructions.
- Persistent state schema.
- Action-history events.
- Deterministic scorer.
- Explainable score breakdown.
- Case-record integration.
- Instructor-review payload.
- Automated scorer tests.
- UI regression check.
- Progress and completion integration.

For Module 12, deliver all of the above plus:

- Dynamic alert-generation engine.
- Multiple-incident relationship engine.
- Automation execution engine.
- Containment/recovery state engine.
- Complete 100-point scorer.
- Safety-cap tests.
- Portfolio-ready final incident report.

## Test requirements

At minimum, test:

- Perfect solution.
- Minimum passing solution.
- Partial-credit solution.
- Incorrect initial decision corrected later.
- Alternate valid query.
- Broad noisy query.
- Narrow query that misses scope.
- Correct and incorrect incident associations.
- Incomplete evidence.
- Incomplete containment.
- Failed response action followed by recovery.
- Incorrect and corrected ATT&CK mapping.
- Unsafe option viewed but not executed.
- Unsafe action executed and safety cap applied.
- Click-through behavior without evidence earns no credit.
- Saved state restores without changing the score.
- Existing Module 3 behavior remains intact.

## Definition of done

This work is complete only when:

- Modules 4–11 each have a functioning, independent Assessment Lab using the shared Mission Next SIEM.
- Each module visibly adds the correct new capability while retaining earlier capabilities.
- Module 12 uses the complete evolved interface as the capstone.
- Assessment scoring is deterministic, explainable and based on observable outcomes.
- Partial credit works.
- Consequences flow through the simulated environment.
- Existing learner progress and Module 3 behavior remain intact.
- No duplicate/legacy scored Assessment Lab or capstone surface remains; retained
  supplemental labs are clearly separate and optional.
- Project checks and all new scorer/regression tests pass.

## Initial Codex instruction

```text
Read this document completely before editing. Inspect the current Module 3
Assessment Lab, shared case record, KQL engine, LabRuntime, module registry and
Modules 4–12. Treat Module 3 as the required visual and behavioral baseline.

Work sequentially. First generalize the reusable Module 3 assessment console.
Then rebuild Module 4 and verify it before proceeding through Modules 5–11.
Finally build Module 12 as the cumulative capstone.

Reuse working code and preserve stable keys. Do not duplicate the entire Module
3 implementation into every module. Do not replace outcome grading with click
tracking, exact query matching or text-length checks. Do not mark a module
complete until its scorer, state restoration, case submission and regression
tests pass.
```

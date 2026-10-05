# Module 12 — Integrated Capstone (retire the form wall)

Status: **S5 local browser acceptance complete; provisioned-account verification outstanding 2026-10-05** · Written 2026-10-03 · Owner: Alex
Route: `#/program/soc-analyst/module/12` · Case: INC-4821 · Operation Amber Finch

## 1. Problem

Section 4 "Prove It · Capstone assessment" (`moduleTwelveAssessment()`,
`portal/soc-analyst-module-12.js:455`) is a wall of eleven standalone forms
below the integrated range. It is not an investigation; it is recognition:

| Leak | Where |
|---|---|
| Evidence grid lists exactly the 7 candidate records and labels each `primary` / `supporting` / `benign` | `soc-analyst-module-12.js:468`, data `soc-m12-assessment-data.js:20-26` |
| Placeholders give the answer: `EM-212, EP-301`, `EP-301`, `preserve>approval / approval>isolate`, `ws-204`, `isolate` | `:469`, `:475-479` |
| Prefilled defaults: `INC-4821`, workflow name, first `<option>` = TI-601 / malicious / true-positive / RULE-01 | `:470-476` |
| Rule titles state the answer (`RULE-03 · Process + hash + destination in window`) | `soc-m12-assessment-data.js:44-48` |
| M10 locker artifacts carry the class in their detail text (`${e.class} evidence: …`) | `soc-m12-assessment-console.js:78` |
| Indicator select offers only TI-601 vs TI-603 (malicious vs the allow-listed one) | `:470` |

It also breaks two locked course rules (MODULE_STANDARD §7.2, memory
`feedback-mnt-case-record-console-guide`): graded decisions go **inside the
ticket**, and the ticket lives **in the console as its Case Record tab**,
never as a separate form below it.

Two further defects found while auditing:

- **The standard ticket is never rendered.** `moduleTwelveCaseSpec()` is only
  called at submit for `case_display` / `case_summary`
  (`:705`); status, severity, affected user/device, disposition, escalation
  are never collected, so every faculty submission carries a blank ticket core.
- **Dead legacy code** still ships and is still checked:
  `MODULE_TWELVE_CONSOLES`, `MODULE_TWELVE_EVIDENCE`,
  `moduleTwelveFindingsHtml()`, `moduleTwelveEvidenceTray()`,
  `moduleTwelveExtraMissing()` (requires "Review all ten integrated
  consoles" via `data-m12-console` buttons that no longer render), hints,
  `answers.*` change handlers.

## 2. What already exists (the reason this is cheaper than a rebuild)

The range in section 3 is already the cumulative console:
`SocConsoleTools.mount('m12', …)` with the M03 SIEM core plus the M04–M10
packs and M12's own Operations/Reporting tabs
(`soc-m12-assessment-console.js:97-146`). Tabs available today:

Alerts · Log Search · Timeline · Entities · Data Sources · Watchlists ·
Evidence · Threat Intelligence · Analytics Rules · Automation · Endpoint ·
Hunting · ATT&CK · Email · Network · Exposure · Incident · Response ·
Recovery · Evidence Locker · Reconstruction · Operations · Reporting ·
ITSM Ticket (currently a one-line placeholder, `:115`).

The backend is already the right shape: `SocM12AssessmentState` is an
append-only, replayable action log with range-enforced safety
(`deriveEffect`: out-of-scope / unapproved protected actions → `blocked`),
and `SocM12AssessmentRubric.extract()` scores **outcomes from that log**, not
form answers. Console pins already emit `evidence-select`
(`soc-m12-assessment-console.js:138-145`); Operations/Reporting already emit
`hypothesis` / `handoff` / `report` / `closure`.

**The gap:** the M04–M10 packs write to their own module states under
`moduleTwelveState.tools.mXX`. The M12 rubric reads only
`moduleTwelveState.assessmentState`. The form wall exists solely as the
adapter between "what the student did in the console" and "what the rubric
can see". Replace the adapter, delete the wall.

## 3. Target design

Governing standard: `docs/LAB_ASSESSMENT_STANDARD.md` (Prove It section,
partial credit, required tests, definition of done). Every sprint agent reads
it first.

1. **Every graded action happens where its evidence is.** No pre-listed
   evidence, no class labels, no placeholder answers, no strawman selects.
2. **A bridge projects pack actions into M12 actions.**
   `portal/soc-m12-tool-bridge.js` (new): pure
   `project(tools, consoleState, assessmentState, fixture) → assessmentState`.
   Runs on every M12 save. Idempotent: each projected action carries
   `details.sourceRef = '<pack>:<sourceActionId>'` and is skipped if already
   present. Pack state stays the source of truth for pack UI; the M12 log
   stays the source of truth for scoring and the faculty payload.
3. **The ITSM Ticket tab is the submission.** `caseView` renders
   `caseRecordPane()` (M09/M10 precedent:
   `soc-analyst-module-09.js:1143`, `soc-analyst-module-10.js:874`) with the
   standard core + capstone findings + Submit. Section 4 is deleted; the hero
   CTA "Open capstone assessment" points at the console's ITSM Ticket tab.
4. **Free text over pick-one.** Priority rationale, scope statement,
   executive summary, closure note are text scored against cited evidence
   IDs and entities, not a correct-vs-strawman select. Timeline =
   chronological order of the student's **pinned** evidence (M10
   Reconstruction already does pick/move/remove), not four dropdowns.
5. **No score, no answer key, no per-item ✓ before submit** (owner rule for
   Assessment Labs). The requirements panel lists *what kinds* of outcome
   are still unrecorded ("No containment action executed yet"), never which
   record or option is correct.

### Pack → M12 action map (bridge contract — verify each in S1)

| Console surface | Pack action (UI attr) | M12 action type | Rubric criterion |
|---|---|---|---|
| Evidence (M03 pins) | `data-m03e-pin` | `evidence-select` | timeline-scope-evidence-attack *(already wired)* |
| Threat Intelligence | `data-m04-enrich` + verdict | `intel-decision` | intelligence-preparation |
| Log Search / Analytics Rules | `data-m04-query-test` | `query-run` | queries-detection-scheduling |
| Analytics Rules | `data-m04-rule-save`, `-rule-schedule-save` | `rule-save`, `rule-schedule` | queries-detection-scheduling |
| Alerts / Automation | `data-m04-alert-review-form` | `review-alert` / `alert-disposition` | alert-incident-management |
| Email / Network / Exposure | `data-m07-incident-form`, `data-m08-assessment-incident-link` | `incident-link` | alert-incident-management |
| Endpoint / Hunting | `m05 analysis_note`, `m06 conclusion` | `investigation` (domain derived from cited evidence's source table) | cross-domain-investigation |
| ATT&CK | `data-m06-mapping-form` | `attack-map` | timeline-scope-evidence-attack |
| Incident / Response | `data-m09-workflow` | `workflow-design` | tuning-automation-containment |
| Response | `data-m09-approval-request` / `-decision` | `approval` | tuning-automation-containment |
| Response | `data-m09-execute` | `execute` (M12 `deriveEffect` still decides success/blocked) | tuning-automation-containment |
| Recovery | `data-m09-recovery`, `data-m09-monitor` | `recovery` | eradication-recovery |
| Reconstruction | `data-m10-timeline-pick/move` | `investigation{domain:'timeline'}` | timeline-scope-evidence-attack |
| Operations / Reporting | M12-native | `hypothesis` `handoff` `report` `closure` *(already wired)* | reporting-operations-lessons |
| ITSM Ticket | `caseRecordApply` | ticket core + `investigation{domain:'scope'}` from scope statement | alert-incident-management, timeline-scope-evidence-attack |

Any row where the pack has no equivalent (expected: alert→incident link from
the Alerts tab, generic "Add finding" from a selected row) gets a small
contextual control on that surface in S2 — never a new standalone form.

## 4. Sprints

Per `feedback-sprint-handoff`: one subagent per sprint, cheap model for
mechanical, strong model for judgment. Update this file's §6 log at the end
of every sprint. Repo rules: branch `master`, push auto-deploys; check staged
files against other sessions' commits before committing
(`mnt-repo-layout-and-concurrency`); run the real-browser sweep after any
multi-file edit.

| # | Sprint | Model | Scope | Done when |
|---|---|---|---|---|
| S0 | **Interim leak fix** | Haiku | Strip `item.class` from the evidence grid; empty every answer placeholder; remove prefilled `value`s and make every select start at `Choose…`; neutral rule titles (`RULE-01/02/03` + rule *logic* shown only after the student opens it); drop `class` from M10 locker detail text; indicator select lists every TI row. No layout change. | Grep finds no `primary|supporting|benign` in rendered M12 HTML; `tests/soc-m12-*` green; ships independently. |
| S1 | **Tool bridge** | Opus/Sonnet | New `soc-m12-tool-bridge.js` per §3.2 and the map above; load before `soc-analyst-module-12.js` in `portal/index.html`; call from `moduleTwelveSave()`. Read each pack's action log shape from its `SocM0XAssessmentActions` / state module — don't guess. | Unit test: a scripted gold-path sequence of **pack** actions (no M12 forms) scores ≥ 70 with the existing rubric; replaying the bridge twice adds zero actions; an unapproved `isolate` executed via the M09 Response tab is `blocked` and trips the safety cap. |
| S2 | **Fill console gaps** | Sonnet | Add the missing contextual controls identified in S1 (e.g. "Link to INC-4821" on an alert row, "Add finding" on a selected Log Search/Timeline row with evidence IDs taken from the selection). Reuse pack CSS; no new standalone forms. | Every rubric criterion is reachable from inside the console; DOM test asserts each control exists on its tab. |
| S3 | **ITSM Ticket tab = submission** | Sonnet | `caseView` → `caseRecordPane()` with standard core (status, severity, affected user/device, disposition, escalation/route) + capstone findings (priority rationale, scope statement, executive summary, closure note — free text with min lengths) + Analyst Work Notes + Save/Submit. Requirements panel derived from rubric-observable action *types*. Delete section 4, `moduleTwelveAssessment()`'s form grid, and the dead legacy code in §1. Hero CTA + unified nav point to the console's ticket tab. Keep `moduleTwelveFinalize()` payload shape (`recordLabAttempt`, `persistPortfolioArtifact`, `recordCapstoneSubmission`) identical apart from now-populated ticket fields. | Ticket core is populated in `case_display`; section 4 gone; `tests/soc-m12-console-integration.test.js` rewritten to assert the ticket tab, not `data-m12-assessment-action`. |
| S4 | **Rubric v2 hardening** | Opus | (a) Unsupported-conclusion reduction, per the standard: exploration (queries, pins, opening rows) never lowers a score; an *explicit* conclusion that is unsupported does: citing `BEN-101` as malicious evidence, putting `ws-118`/`acct-091` in affected scope, rating TI-603 malicious, executing against an out-of-scope target. Today only positive counts are checked. Use the standard's support levels (PRIMARY / SECONDARY / SUPPORTING / IRRELEVANT / CONTRADICTORY) in `expectedTruth`, instructor-side only. Partial credit for secondary findings (e.g. NW-504 bounded-scope result). (b) Free-text fields scored by cited evidence/entities, not keywords alone. (c) Timeline from pinned-evidence chronology. (d) `rubricVersion: 2`; v1 submissions are frozen and re-displayed as v1. (e) Update `docs/specs/SOC_ANALYST_CAPSTONE_RUBRIC.md`. | Scorer tests cover all eight cases in the standard's "Required assessment tests" (perfect; partial with secondary evidence; two different valid paths score equal; heavy exploration + correct conclusions not penalised; explicit unsupported conclusion reduced; strong analysis/weak writing; weak analysis/polished writing; instructor view shows findings, actions, breakdown, full response) plus: "cite everything" path < 70, any unsafe execution ≤ 69, v1 fixtures unchanged under v1. |
| S5 | **Migration + verification** | Sonnet | In-progress v1 states: replay existing `assessmentState.actionHistory` unchanged (action types are the same), drop `answers.*`. Submitted attempts stay locked. Real-browser playthrough on :8768: gold path, "click everything" path, unsafe-action path. Run `bin/console-tab-sweep.js`. Write the acceptance record. | Local checks and synthetic browser scenarios are marked complete in §7, with screenshots archived in `archive/completed-feature-notes/M12_INTEGRATED_CLICKTHROUGH.md`; provisioned learner/faculty UAT remains open in §6. |

S0 can ship today on its own. S1 blocks S2–S5. S3 and S4 can run in
parallel worktrees once S1 lands (they touch different files; S3 =
module-12 + case-record usage, S4 = rubric/scorer/data).

## 5. Owner decisions needed

**2026-10-03: Alex approved all recommendations below** (S0 ships first, unsupported-conclusion reduction in v2, tracker loses its reviewed/open state, IP reputation text neutralised in S0). Item 4 was implemented in the portal grading card on 2026-10-05; real-account review verification remains in S5.

1. **Ship S0 now, ahead of the rewrite?** Recommended: yes.
2. **Unsupported-conclusion reduction in rubric v2 (S4a)?** The standard
   allows it; it still changes pass rates, so faculty should know before it
   lands. Which conclusions count as *critical* (pass-blocking) vs a
   competency reduction is your call — recommended critical: unsafe
   execution only (already capped).
3. **Keep the 12-stage "Mission requirements" tracker (section 2)?** It
   currently marks a stage "reviewed" on any action of that type, which is a
   hint in itself. Recommended: keep the twelve labels as an outcomes list,
   drop the per-stage "reviewed / open" state.
4. **Faculty grading view:** render `case_display` / `reviewPayload` as a
   readable student response and competency breakdown. Implemented in
   `portal/app.js` on 2026-10-05; verify against a persisted real-account
   submission during S5.
5. **Indicator reputation text** in the IP watchlist
   (`"High confidence malicious in correlated incident context"`,
   `soc-m12-assessment-console.js:50`) states the verdict. Neutralise to raw
   feed data (source, first-seen, confidence) in S0?

## 6. Account UAT still required

These actions need explicitly designated QA accounts. Do not use the four
learner accounts in the local roster until their owner confirms they are
disposable test accounts. The local portal targets production Supabase.

- [ ] Submit a new Module 12 attempt with a designated learner account. Confirm the v2 artifact and complete Student Analyst Response/competency breakdown in faculty review.
- [ ] Sign out and back in as that learner. Confirm the ticket remains locked and the attempt remains visible.
- [ ] Confirm a historical submitted Module 12 attempt remains locked and retains its original score and rubric interpretation.
- [ ] Submit Module 1 using a designated learner account and confirm remote persistence and faculty review. The synthetic local submit/reload/lock/review regression is complete.

Faculty credentials or an authenticated faculty browser session are also
needed to verify the actual grading queue.

## 7. Local acceptance checklist

- [x] `bash bin/ci-check.sh`, all six `tests/soc-m12-*.test.js`, both browser-runner syntax checks, and `git diff --check` pass.
- [x] `bin/console-tab-sweep.js` passes 304/304 tabs.
- [x] `bin/lab-click-sweep.js 1,12` passes fresh/complete Guided Lab and Assessment Lab interactions.
- [x] Three synthetic Module 12 Chrome submissions pass: gold **100**, exploration-heavy **100**, and unsafe out-of-scope isolation **69** with the safety cap.
- [x] Module 1 synthetic Assessment Lab submits at **100**, survives local rehydration, remains locked, and renders in the faculty ticket view.
- [x] Ticket and faculty-review screenshots are recorded in `archive/completed-feature-notes/M12_INTEGRATED_CLICKTHROUGH.md` with source images in `docs/handoffs/assets/`.

## 8. Sprint log

| Date | Sprint | Commit | Notes |
|---|---|---|---|
| 2026-10-03 | S0 ✅ | (this commit) | Done inline (≈12 exact edits, not worth a subagent). Evidence grid: class label removed, sorted by time (list order hinted primary-first). All answer placeholders/prefills removed; every select starts at `Choose…` + `required`; intel select lists all five TI rows. ATT&CK example changed to T1110 (was T1059, the answer's parent). M10 locker detail = `<source> export`, not class. IP reputation + TI-601/602/604 contexts rewritten as feed data, not incident analysis. **Deviation:** rule titles left alone — M12 never renders them (S2 must show rule *logic* so the rule select is meaningful). Checks: all `tests/*.test.js`, `bin/portal-check.js`, `bin/ci-check.sh` pass; vm render has zero leak strings; `bin/console-tab-sweep.js` 304/304 tabs (M12 24). |

| 2026-10-03 | S1 ✅ | Uncommitted | Added pure `SocM12ToolBridge.project()` with source action references, deterministic multi-domain projections and pin revisions; loaded before Module 12 and called on each unsubmitted save. Bridged actual M04–M10 action shapes, authored rules/schedules and reports, findings, ATT&CK, approval history, preservation, recovery and reconstruction. Fixed M12's M04 adapter returning disposable clones; added M09 object identities/backups and canonical target mapping; removed remaining evidence-class text in M09 fixture. Minimal state/rubric compatibility supports authored rule IDs and caps blocked bridged M09 response attempts while preserving native v1 tests. **Checks:** four M12 test files pass; actual pack API sequence scores **71/100**, pure/idempotent replay passes, unapproved isolate is blocked and safety cap is 69; portal-check passes all 48 modules. Browser sweep could not start: Playwright unavailable to Node; deferred to S5. **Contract corrections / S2 handoff:** M04 IOC lifecycle has no verdict and alert review has no disposition; M09 workflow is ownership/status, not a graph; M07/M08 fixtures are empty. Do not infer conclusions from those actions. Add contextual verdict, initial-alert disposition/link, workflow-design and generic finding/scope controls. M09 UI/API rejects unapproved execution before recording an audit event; defensive bridge tests cover imported unauthorised attempts, and S2 should retain any explicit attempted execution from its controls in the M12 log. M07 incident IDs identify local investigations, not INC-4821; projecting them as alert associations would invent a student decision. |

| 2026-10-03 | S2 ✅ | Uncommitted | Added contextual decisions inside existing tabs: selected Alerts disposition/link, selected Threat Intelligence verdict/rationale, selected Log Search/Timeline/Evidence/Email/Network/Exposure finding and scope controls, Response workflow design, and explicit Response attempts retained in the M12 audit log even when approval/scope blocks them. Raw M04 IOC feeds and M07 Email/Network/M08 Exposure fixtures now derive from native case telemetry. Every native telemetry record can be cited with its original ID, without a scored-evidence shortlist; dataset remains **167 unique events / 14 alerts**, instructor truth unchanged. M07 local incident records remain investigations and never imply a link to INC-4821. Shared console/environment files untouched. **Checks:** new parsed-HTML mounted-tab/API test passes, all four existing M12 tests pass, telemetry regression passes, Module 1/12 portal rendering passes. Unapproved Response isolation is persisted as blocked and activates the safety cap. Browser playthrough/sweep remains S5. **S3/S4 handoff:** contextual forms use `data-m12-context`, use the selected evidence automatically, and guard submitted attempts; `SocM12AssessmentConsole.recordContextual()` is their shared action path. Scenario evidence now includes all neutral native telemetry identities so unsupported findings/extra exploration are observable; supporting/contradictory grading remains instructor truth owned by S4. |

| 2026-10-03 | S3 ✅ | Uncommitted | ITSM Ticket is the sole submission pane using shared `caseRecordPane`: core fields, four free-text findings (priority 80, scope 100, executive 180, closure 100 characters), 260-character Analyst Work Notes, Update Ticket/Submit Lab and action-presence requirements. Removed section 4, standalone assessment forms, legacy console/evidence data, answer handlers and hints; hero/unified Assessment navigation opens the ticket tab. Mission outcomes no longer show visited/open states. Small shared case-record extension adds optional textarea findings and preserves select behavior. Authored scope/report/closure text enters the existing replayable log with citations and ticketCore metadata; unchanged saves are idempotent. Finalization retains lab-attempt, portfolio and capstone payload structures and now populates case_display/core. **Checks:** all five M12 test files pass; integration regression checks text minimums, lock, idempotence, cited findings, populated case_display and full faculty Work Notes; portal-check passes all 48 module routes. **Review compatibility caveat:** existing app.js dynamically renders ticket core/findings via case_display and full Analyst Work Notes, but camelCase reviewPayload, M12 report collections, findings/actions and array competency breakdown are only available in collapsed raw JSON. Dedicated Student Analyst Response/competency rendering and review-panel owner confirmation remain required before release; app.js untouched. Real-browser persistence/playthrough remains S5. |

| 2026-10-03 | S4 scorer ✅ / activation pending S5 | Uncommitted | Added explicit versioned v2 extraction and scoring, preserving the v1 extractor and existing v1 tests unchanged. Instructor-only evidence support metadata distinguishes PRIMARY/SECONDARY/SUPPORTING/IRRELEVANT/CONTRADICTORY; NW-504 earns bounded secondary credit. Unsupported intel, affected scope, malicious findings, alert associations and ATT&CK conclusions reduce relevant competencies; queries/opening/pins never reduce earned credit. Reports and ticket priority use cited evidence/entities; timeline requires chronological pinned evidence. Every blocked unsafe execution attempt activates the 69 cap. V2 emits full responses/findings/actions/competency explanations in reviewArtifact. **Checks:** all six M12 test files pass; v2 perfect 100, strong technical/weak writing 92, unsupported polished writing 1, equivalent paths/exploration equal, secondary findings positive, cite-everything below 70, unsafe ≤69, v1 fixtures unchanged; portal-check all 48 routes passes. **Incomplete acceptance:** instructor review contract is tested but app.js still hides some fields in collapsed JSON; no visible review completion claimed. **S5 handoff:** active/new states must select rubricVersion 2 after replay and preserve it through normalize (or pass the version explicitly at scoring); unversioned states currently retain v1 by design. New persisted artifact version must derive from scorePayload.rubricVersion (module12 currently hardcodes v1). Submitted historical snapshots stay frozen. Browser migration, three playthroughs, tab sweep and Module 1 full persistence/review regression remain S5. Work paused at owner request before S5. |

| 2026-10-05 | S5 activation + initial browser verification | Uncommitted | Active M12 states now replay existing action history, select rubricVersion 2, and remove retired `answers.*` after one-time completed-ticket backfill; new portfolio artifacts use the score's rubric version. Submitted snapshots remain locked and are not rescored. Instructor grading now renders Student Analyst Response, competency breakdown, score explanations, selected evidence, determinations and actions visibly. Real-browser sweeps: console tabs 304/304; Module 1 and 12 guided/assessment click checks pass. Sweeps exposed a missing `#m12-ticket` rail anchor; fixed by anchoring the ITSM tab host. Screenshot: `docs/handoffs/assets/M12-it-ticket-tab.png`. M12 tests 6/6 and portal-check for Modules 1/12 pass. At this point the three scored paths and persisted real-submission visual check were still pending; see resumed S5 rows below. |

| 2026-10-05 | S5 local acceptance complete; account UAT open | Uncommitted | The local acceptance items in §7 are complete and the report is archived. Designated learner/faculty account checks remain open in §6; no production learner records were used. |

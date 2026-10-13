# Mission Next Technical Academy — Capstone-First ITSM Delivery Plan

**Status:** Active reverse-engineering workstream; source audit complete, M12 flow implementation in progress (2026-10-13)  
**Scope:** The existing Practice It (Guided Lab) and Prove It (Assessment Lab) flows across SOC Analyst Modules 1–12, culminating in the Module 12 capstone. Keep the Academy UI, navigation, placement, and learner-facing shell unchanged. Make improvements inside the existing lab workspaces: clarify the analyst workflow, connect scenario context to the CASE and its related INCs/ALTs/evidence, and ensure actions, findings, and handoffs are practiced and assessed coherently.  
**Release rule:** Follow `docs/operations/AI_AGENT_RULES.md`: work on a feature branch, open a PR to `master`, and wait for owner approval before merge. No direct pushes to `master` or `staging`.

## Owner direction and operating model

- The assigned CASE is the scenario/work container. It may contain multiple related incidents; incidents can link to alerts and evidence with explicit provenance.
- ITSM is the analyst's first stop at shift start: review assigned cases, current status, history, ownership, and outstanding work before pivoting into investigation tools. The ticket remains the durable system of record and handoff.
- Practice It teaches the workflow with progressive support. Prove It uses the same lab shell and relevant tool model with a distinct scenario and independent decisions, without procedural hints or answer cues.
- Preserve existing Academy and lab UI/UX: do not add or move tabs, change navigation, introduce a new shell, or restyle the learner experience. Add or repair behavior and instructional flow within existing Practice It and Prove It workspaces.
- Reconcile the multiple-incident CASE model against actual module fixtures and the authoritative syllabus before extending it. Do not retrofit every module to a multi-incident pattern if its competency and scenario do not support that shape.
- Follow `AGENTS.md`, `CLAUDE.md`, `docs/operations/AI_AGENT_RULES.md`, `ROADMAP.md`, and `docs/LAB_ASSESSMENT_STANDARD.md`. Existing repository governance takes precedence over this historical brief where it is more specific.

## Product outcome and demonstration
A learner enters the existing Guided Lab and begins with the assigned ITSM CASE: reviews its scenario, incident(s), current state, and history; investigates through the module's existing tools; records evidence-backed determinations and actions; and updates the incident ticket with a clear handoff. The matching Assessment Lab asks the learner to apply the competency independently to its own scenario. Where Module 12 combines multiple incidents, students can distinguish shared evidence from incident-specific findings, preserve provenance, and close only the work supported by the scenario and rubric. Practice, assessment, and capstone state and grading remain isolated. No Academy shell or lab navigation redesign is part of this workstream.

## Baseline audit — mandatory before coding
Inspect the actual repository, lab implementations, fixtures, persistence and scoring, prior capstone/traceability plans, and existing tests. Browser/deployed inspection is a separate staging-only step under repository rules. Search for `MNTA_ITSM_Workspace_Modernization_Sprints.md`, `MNTA_SOC_ENVIRONMENT_EVOLUTION_PLAN.md`, and `SOC_CONNECTED_LEARN_PRACTICE_MILESTONE.md`; filenames and implementation are **unverified**. Produce `docs/workstreams/itsm-capstone-reverse-engineering/BASELINE_AUDIT.md` listing paths, actual per-module CASE/INC/ALT model, current Practice/Prove flow, persistence/scoring/review behavior, gaps, dependencies, duplicate plans, and recommendation to extend rather than fork. Record commit SHA; include an environment URL only if actually inspected. Do not invent module-specific curricula: reconcile the mapping below against the authoritative syllabus.

## Architecture decisions requiring owner review before persistent/shared-data changes
- Canonical immutable internal ID (UUID/ULID), plus unique human IDs `CASE-000001`, `INC-000001`, `ALT-000001` (optional `EVD-000001`, `TASK-000001`). Counter allocation must be atomic and scoped as designed; never recycle identifiers. Preserve legacy identifiers via migration mapping.
- Parent CASE 1:N INC; incident-alert relationships explicitly modeled, with alert provenance and deduplication. Evidence can reference multiple objects with immutable provenance and audit history.
- Model tenant, cohort, student, module, scenario, and mode (guided/practice/assessment/capstone) as separate scope fields. Authorization enforced server-side, not only in UI.
- Define status transition tables and close/reopen invariants. Closing one incident cannot auto-close sibling incidents; a case cannot resolve while required incidents/tasks remain open. Document whether an alert can relate to multiple incidents.
- Persistence and student continuity across all 12 modules; assessment and capstone answer isolation. Existing functionality remains compatible until migration validated.

## Required delivery artifacts
1. `docs/workstreams/itsm-capstone-reverse-engineering/BASELINE_AUDIT.md` — verified per-module current-state inventory and gap matrix.
2. `docs/workstreams/itsm-capstone-reverse-engineering/CAPSTONE_SCENARIO.md` — complete Module 12 storyline, incidents, alerts, telemetry, choices, expected evidence, instructor review, and reset rules, reconciled to taught competencies.
3. `docs/workstreams/itsm-capstone-reverse-engineering/CAPSTONE_TRACEABILITY.csv` — one row per graded capstone action: task ID, competency, prior module, guided practice, assessment, tool, data dependency, evidence, rubric, test ID, implementation status.
4. A data contract only if audit finds a real shared data-model gap; extend current contracts and plans rather than creating duplicate definitions.
5. Migrations/backfills only if needed after audit and owner review, with tests and rollback notes. Preserve all current module state and submitted scores.
6. Behavior changes and focused tests inside existing Practice It and Prove It labs. No shell, navigation, layout, or visual redesign.
7. Module 1–11 integrations only where the audited competency traceability shows a real gap; fixtures and learner mode state remain isolated.
8. Module 12 executable capstone behavior, evidence-backed rubric, and tests.
9. Staging-only E2E evidence where required, recorded in the repo's current handoff/UAT artifacts.
10. Release readiness through the existing PR/CI/governance process; do not create a parallel release process.

## Sprint 0 — Discover and reconcile
**Deliver:** baseline audit, current flow/model diagram, dependency map, prior-plan reconciliation, and issue backlog with owners and acceptance tests. Audit the capstone and Modules 1–11 in parallel, with special attention to where ITSM sits in the lab's opening flow and how CASE, INC, ALT, and evidence relate.  
**Acceptance:** every existing case/incident/alert implementation and persistence location has a verified code reference; duplication and migration risks are recorded; no behavior coding begins without baseline.

## Sprint 1 — Perfect the capstone reference flow
**Deliver:** verified Module 12 end-to-end flow contract, scenario and task matrix. Start at shift handover: open the assigned CASE in ITSM, understand linked incident(s), alerts, ownership and prior activity, then investigate through the available tabs/tools, retain evidence, document decisions, hand off/close when supported. Model only relationships that the scenario actually warrants. Record every decision point, expected evidence, valid alternatives, failure consequence, and rubric/test coverage. First inspect what M12 already implements; refine behavior within the current lab workspace without changing its layout or shell.  
**Acceptance:** learner can explain where the work starts and why, move from ticket to investigation and back without losing context, distinguish the CASE scenario from its INC records, and submit a durable evidence-backed result for instructor review; scoring rewards defensible paths and partial findings under `docs/LAB_ASSESSMENT_STANDARD.md`.

## Sprint 2 — Reverse-extract the flow to Modules 11 → 1
**Deliver:** `CAPSTONE_TRACEABILITY.csv` and a backwards instructional map. For each capstone competency, identify the first module that introduces it, its supported Practice It rehearsal, its independent Prove It assessment, and the code/state/rubric/test involved. Work in descending module order so the capstone behavior is decomposed into prerequisites; finish with a deliberate Module 1 first-shift foundation. Identify unsupported mechanics and redundancies instead of assuming the current provisional mapping is correct.
**Acceptance:** every graded capstone mechanic has an explicit practice and prove home in an earlier module or is clearly marked as integrative synthesis approved by the content owner; all links are verified against live code and authoritative syllabus, not filenames or inherited plan text.

## Sprint 3 — Data, IDs, and state machine (only where audit proves a gap)
**Deliver:** canonical schemas, migration/backfill, atomic identifier issuance, relationship APIs, audit trail, ownership/RBAC, closure validation, and contract tests.  
**Acceptance:** concurrent creation generates zero duplicate IDs; migration retains all old case references; unauthorized cross-student access fails; sibling incident closure cannot prematurely close parent; reopen records actor/time/reason; rollback rehearsal passes.

## Sprint 4 — Implement only verified shared data gaps
**Deliver:** extend existing fixture/state/persistence contracts only where the audited capstone flow requires a real CASE→INC→ALT/evidence relationship or lifecycle invariant that current code cannot express. Prefer the module's existing contract and state path. No new case workspace, module-independent navigation, or lab shell.  
**Acceptance:** any added relation round-trips through current save/load, retains old submitted attempts and IDs, enforces existing learner/mode isolation, and has focused migration/contract coverage plus a rollback note if database work is necessary.

## Sprint 5 — Module 11-to-1 competency backfill
**Deliver:** add or repair the smallest Guided Lab rehearsal and Prove It assessment needed for each verified gap. Reuse each module's existing controls, scenario, fixture/state, scoring and instructor-review path; add only scenario-supported case/incident/alert relationships. Keep Practice and Prove state, scenarios, and grading isolated.  
**Acceptance:** every capstone competency is practiced and independently assessed earlier, or is documented and approved as integrated synthesis; no module UI shell/navigation change; submitted work remains durably instructor-reviewable.

## Sprint 6 — Capstone implementation and integrated verification
**Deliver:** refined Module 12 scenario and existing-console behavior, including explicit parent CASE and related INCs if validated by the final scenario, linked alerts/evidence, branching yet deterministic outcomes, action-to-telemetry feedback, rubric scoring with justified partial credit, instructor review, and reset/replay behavior.  
**Acceptance:** full capstone completes from assigned CASE/ITSM review through justified closure; each meaningful student decision produces visible, testable state changes; alternate defensible paths score appropriately; identical seed + actions yield reproducible outcomes.

## Sprint 7 — Real student browser validation
**Deliver:** scripted fresh-student E2E test across all 12 modules, plus instructor and unauthorized-student checks; captured visible scrolling/navigation and evidence log.  
**Acceptance scenarios:**
- Fresh account sees only its assigned case and no other student's cases.
- CASE contains 3 incidents; each has independently actionable alerts and evidence.
- Resolve first incident: parent remains open; resolve remaining required work: parent becomes eligible for closure.
- Close guided case, switch to assessment: guided case remains in history but assessment answers/state are isolated.
- Log out/in, navigate across modules, reopen permitted incident, verify immutable history.
- Complete capstone, verify scored artifacts and instructor audit view.
- Run automated unit/integration/E2E suite and manual accessibility, failure/retry, concurrency, and performance checks.
**Evidence:** record environment, commit SHA, browser/device, steps, expected/actual results, screenshots, test logs, defects and fixes. Never use production student data in test recordings.

## Sprint 8 — Release gate
**Deliver:** release-readiness report, updated governance tracker, risk sign-off, CI green, migration/rollback proof, deployment and smoke-test record.  
**Acceptance:** no unresolved blocking defects, 100% capstone traceability, authorization and isolation tests passing, documented approvals; merge to `main` only after authorization and repository protections satisfied.

## Provisional capstone-to-module map — VERIFY syllabus
| Competency | Provisional prior module | Required evidence |
|---|---:|---|
| Case intake, triage, notes | 1 | Assignment, triage, case timeline |
| Identity/network context | 2 | Asset/identity findings |
| SIEM search and alert correlation | 3 | Queries, correlated alert IDs |
| Threat intel, IOC, ATT&CK | 4 | IOC provenance, justified mapping |
| Endpoint investigation | 5 | Endpoint artifacts and conclusions |
| Threat hunting | 6 | Hunt queries and scope |
| Network/DNS/email evidence | 7 | Packet or log analysis artifacts |
| Vulnerability prioritization | 8 | Exposure/risk decision |
| Containment/recovery | 9 | Actions and observed effects |
| Evidence handling/timeline | 10 | Provenance and chronology |
| Reporting/handoff | 11 | Stakeholder report and closure |
| Integrated multi-incident case | 12 | Full capstone rubric |

## Implementation backlog format
For every issue: **ID; sprint; user-visible outcome; source files; API/schema change; dependencies; fixture; automated test; browser test; evidence link; owner; status; release risk**. Do not label tasks complete solely because a screen renders.

## Cloud browser vs code-level verification
ChatGPT Work Cloud Browser can interact with supported repository web UIs and deployed student sites, including scrolling, navigation, forms, issue/PR workflows, and observable state transitions, subject to access, permissions, and platform limits. It is not proof of database integrity, secure RBAC, concurrency, or backend correctness. Those require repository inspection, test execution, logs, and migration verification. This chat has **not** accessed the repository, run the deployed app, or pushed a commit. To execute browser work, open the task in **Work mode** with repository and test-environment access.

## Immediate execution sequence
1. Capture repository, branch, and commit metadata; complete the module and capstone code audit without changing the Academy/lab shell.
2. Verify the capstone shift-start-to-closure flow and define the target behavior based on actual M12 scenario, competencies, rubric, and evidence.
3. Implement and verify the capstone flow inside its existing lab workspace.
4. Reverse-map M12's required competencies from Module 11 back through Module 1; backfill only verified teaching/assessment gaps in the existing labs.
5. Validate persistence, rubric behavior, instructor review, isolation, and browser flow under repository staging-only rules; then use the release gate.

## Progress log

- **2026-10-13:** Placed this project brief in the repository at this path on feature branch `feat/itsm-practice-prove-reverse-engineering`. Reframed scope to preserve current UI/UX and focus on existing Practice It / Prove It internals. Owner confirmed the method: make Module 12 the strong reference flow, then reverse-extract its competencies through Modules 11–1. Read-only source audit completed for Modules 1–12 and recorded in `BASELINE_AUDIT.md`. The current traceability map enumerates 11 capstone mechanics with incomplete earlier learning homes: nine lack guided practice and two alert-to-incident linking mechanics lack both practice and Prove coverage. The audit also found that M12 conflates the scenario CASE with `INC-4821`; multiple alerts are flat rather than explicitly linked to child incidents. M11 Prove has no editable ITSM case. The first behavior change is described below; scenario relationship work is next and remains open.
- **2026-10-13:** M12's existing console now defaults new lab state to its ITSM Ticket tab (`case`) as the first active view. The shared mount accepts an optional initial tab, and the M12 mount supplies it; the state adapter overlays saved state after defaults, so returning learners retain their previously selected tab. Tabs, layout, IDs, and scenario structure are unchanged. Files: `portal/soc-analyst-module-03-environment.js`, `portal/soc-console-tools.js`, `portal/soc-m12-assessment-console.js`. Not tested per task scope; existing/saved-state behavior follows the state adapter's defaults-then-saved merge in `portal/soc-console-core.js`.

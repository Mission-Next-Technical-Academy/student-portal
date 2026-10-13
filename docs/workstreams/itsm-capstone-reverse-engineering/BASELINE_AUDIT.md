# ITSM capstone and lab flow baseline audit

**Audit date:** 2026-10-13  
**Repository:** `Mission_Next_Technical_Academy_SOC_Analyst_course`  
**Audited commit:** `f67bde1d72cfa7aa93dd2b23d77b4c90a1dfa829` (`master` at audit start)  
**Environment:** source inspection only; no deployed URL or browser behavior was inspected. No tests were run.  
**Scope:** Module 12 capstone and SOC Analyst Modules 01–11 Practice It / Prove It flows, their fixtures, state, scoring, and review paths. Focus is behavior inside the current lab workspaces; preserve the Academy and lab UI/UX.

## Operating model from owner

- A learner starts a SOC shift by opening the assigned CASE in ITSM and reviewing its scenario, assignment, status, history, and outstanding work.
- The CASE is the scenario/work container. It can contain multiple linked INCs when the scenario warrants them. Alerts and evidence need explicit relationships and provenance.
- The learner pivots from the ticket into existing investigation tools, records evidence and decisions, then returns to ITSM to leave a usable handoff and resolve/close only when requirements are met.
- Practice It teaches the flow with progressive support. Prove It assesses independent performance in the existing lab shell with isolated scenario/state and durable instructor review.
- Keep current UI, navigation, placement, and shell. Make changes within existing lab behavior/content, not through a redesign.

## Current-state summary

| Area | Verified current behavior | Gap against target |
|---|---|---|
| M12 starting point | `portal/soc-analyst-module-03-environment.js` initializes the M12 console on `alerts`. The M12 “Open ITSM Ticket” CTA changes the selected tab to `case`; it is not the initial workflow. | ITSM-first shift review is not the default starting state. |
| M12 case model | `portal/soc-m12-assessment-data.js` and `portal/soc-analyst-module-12.js` both identify the scenario/ticket as `INC-4821`. `portal/soc-m12-assessment-console.js` creates one M09 incident and one M08 incident using the same scenario ID, with 14 alerts in a flat queue. No parent CASE → child INC relationship is represented. | CASE and INC are conflated; multiple incidents are not explicitly modeled or independently actionable. Do not imply a multi-incident workflow until scenario, fixture links, and rubric support it. |
| M12 investigation and evidence | The integrated console embeds M04–M10 tools plus M12 Operations/Reporting and a ticket view. Evidence pins/tool actions are bridged into the M12 action log. | The intended shift workflow and relationships need to be made explicit within existing controls. |
| M12 persistence and review | Tool state and the append-only M12 assessment action log persist. Submit records a v2 rubric result, case display, action history, report/evidence, and portfolio artifact through existing lab-attempt paths; pass unlocks capstone submission. Instructor view in `portal/app.js` presents Student Analyst Response and competency breakdown. | Account-level staging UAT remains outstanding in `docs/workstreams/M12_INTEGRATED_CAPSTONE_PLAN.md` §6. This source audit does not verify live persistence or review rendering. |
| Earlier competency coverage | `portal/soc-capstone-traceability.js` maps capstone mechanics to Practice and Prove homes. `tests/capstone-traceability.test.js` checks rubric text, missing-action checks, ticket fields, action types, code references, module practice steps, and assessment rubric entries. | The traceability guard explicitly records 11 known gaps (listed below). Coverage references also vary in specificity and do not establish that a learner sees the right opening workflow. |
| CASE/INC model in M01–M11 | Module fixtures mostly use CASE as a scenario reference and display one incident or one incident-style ticket. IDs/links are hardcoded per module; no shared persistent CASE → many INC registry was found in this source review. | The user's parent CASE model is not yet a common operational data model. Apply only where a scenario supports it; don't force multi-INC onto unrelated competencies (for example M08 exposure prioritization). |
| Existing lab shell | Modules use established Guided Lab / Assessment Lab layouts and shared console/ticket patterns; each module has its own competency-focused tools and fixture. | Preserve the current presentation while aligning the workflow inside it. |

## Module flow inventory

This table summarizes the source-level review. “Ticket first” means the guided instructions currently start by directing the learner to ITSM; it does not establish live/browser default focus or a true assignment queue.

| Module | Scenario/ticket fixture shape | Practice It opening flow | Prove It opening flow / review | Verified issue |
|---|---|---|---|---|
| 01 | Practice `CASE-011420` / `INC-011318`; Prove `NST-2407` `CASE-012407` / `INC-012716`; focused case console and alert/log evidence. | First coach step says “Start from the alert.” | Independent ticket-based case, no guide; submitted rubric/action record via `recordLabAttempt`. | Practice conflicts with ITSM-first direction. |
| 02 | Active renderer is `portal/soc-analyst-module-02-environment.js`; Prove `CASE-025502` / `INC-025811`. A separate `CASE-MN-317` worksheet in `soc-analyst-module-02.js` is legacy/duplicative and is not the active environment. | Starts on network map/activity and proceeds through identities/resources; ITSM follows as a tab. | Independent authorization case with ticket artifact and competency score/review payload. | No ITSM-first Guided flow; verify renderer selection before edits. |
| 03 | Guided `CASE-MN-428` with five alerts and `INC-MN-428-PRACTICE`; Prove `CASE-MN-517` / `INC-MN-517`. | ITSM is a guide step before alert/evidence work, after a preceding normalization activity. | Prove brief tells learner to start from alert queue, then complete ticket. | Guided has prerequisite before ticket; Prove explicitly alert-first. |
| 04 | Guided `CASE-044478` / `INC-044790`; separate assessment scenario/fixture. | Coach begins at ITSM then pivots to SIEM/detection and intelligence tools. | Independent scored ticket and action/rubric payload. | Single incident-style scenario; no multi-INC structure shown. |
| 05 | Guided `CASE-055204` / `INC-055512`; multiple alert IDs and endpoint evidence. | Coach begins at ITSM then alert/timeline/endpoint evidence. | Distinct assessment fixture and durable Prove record. | Multiple alerts/events are not sibling incidents. |
| 06 | Guided `CASE-066411` hunt; guided ticket spec has no explicit INC. Separate Prove cases include `CASE-066318` and `CASE-066214` for distinct assessment surfaces. | Coach begins at ITSM then hunt observation. | Independent assessment(s), separate score/persistence paths. | Keep distinct M06 surfaces separate; add no assumed incident links. |
| 07 | Guided `CASE-070748` / `INC-071056`; Prove `CASE-070731` / `INC-071042`. | Coach starts “Read the ITSM ticket,” then investigates. | Prove presents brief and console with case view; durable attempt path. | Browser default focus was not checked. |
| 08 | Guided `CASE-080849`; Prove `CASE-080842`, vulnerability scenario with multiple findings/evidence and incident linkage. | Coach begins at ticket, then validates exposure and prioritizes risk. | Independent assessment with case view and rubric. | Findings/evidence do not establish a multi-INC case; do not force it. |
| 09 | Guided incident `INC-5942`; Prove `INC-4937` / Operation Cedar Lock. | Assigned-ticket framing precedes investigation/response. | Independent response workflow and rubric. | Incident-centric shape; no parent CASE wrapper found. |
| 10 | Guided `CASE-106620` / `INC-6620`; Prove `CASE-105510` / `INC-5510`. | Coach begins at collection ticket then proceeds to evidence. | Independent evidence-handling assessment and review payload. | CASE is a forensics task/scenario reference, not demonstrated multi-INC. |
| 11 | Guided `OPS-6640`; Prove `OPS-5511`, with evidence from `INC-4937`. | Guided is ticket oriented. | Prove `caseView` says there is no ticket of its own and directs work to Operations/Reporting plus a separate submit action. | Prove has a CASE-like operations ID but no matching editable ITSM record; reconcile it. |
| 12 | Scenario and ticket are both `INC-4821`; 14 alerts, but no explicit incident grouping. | Not applicable; final independent capstone. | Integrated console, rubric v2, durable locked submission and instructor competency review. | Opens on Alerts; current model conflates case/incident and lacks linked multiple incidents. |

### Competency traceability gaps

The current guarded source lists **11 mechanics** missing at least one earlier learning home:

| Missing mechanic | Current gap |
|---|---|
| Save a correlated detection rule (`rule-saved`) | No M04 Guided Lab step; M04 Prove exists. |
| Schedule a recurring detection rule (`rule-scheduled`) | No M04 Guided Lab step; M04 Prove exists. |
| Link a supported alert to an incident (`alert-incident-link`) | No Practice or Prove home. |
| Penalize an unrelated alert-to-incident link (`alert-incident-link-unrelated-deduction`) | No Practice or Prove home. |
| Map ATT&CK technique to behavior/evidence (`attack-mapping`) | No M06 Guided Lab step; Prove exists. |
| Penalize unsupported ATT&CK mapping (`attack-unsupported-deduction`) | No M06 Guided Lab step; Prove exists. |
| Preserve evidence before eradication (`evidence-preserved-before-eradication`) | No M09 Guided Lab step; Prove exists. |
| Remove persistence (`recovery-persistence-removed`) | No M09 Guided Lab step; Prove exists. |
| Restore a known-good recovery point (`recovery-restored`) | No M09 Guided Lab step; Prove exists. |
| Validate and monitor recovery (`recovery-validated`) | No M09 Guided Lab step; Prove exists. |
| Document lessons learned (`report-lessons`) | No M11 Guided Lab step; Prove exists. |

Thus nine listed mechanics lack guided practice, while alert-to-incident association and its unsupported-link deduction lack both guided practice and an earlier Prove assessment. The traceability suite ensures these known gaps remain explicit; it does not mean the gaps are acceptable or the teaching flow is complete.

## Prior-plan reconciliation

- `docs/workstreams/CAPSTONE_SKILL_BACKFILL.md` is the active detailed record for the 11 above and provides the canonical code-derived traceability source. Extend it and its map/tests; do not create a competing list.
- `docs/workstreams/M12_INTEGRATED_CAPSTONE_PLAN.md` documents the existing M12 implementation and outstanding controlled-account UAT. Its earlier single-incident/tab model predates the owner's CASE-first, scenario-container direction and must be reconciled as the capstone is revised.
- `MNTA_SOC_ENVIRONMENT_EVOLUTION_PLAN.md` exists and requires review against this scope. The named files `MNTA_ITSM_Workspace_Modernization_Sprints.md` and `SOC_CONNECTED_LEARN_PRACTICE_MILESTONE.md` were not found by filename in the repository.
- A 2026-09-23 handoff claims M07/M08/M10/M11 native labs were replaced by imported labs; current code contains native labs with imported material appearing as supplemental links. Treat the handoff statement as stale until reconciled in its next update.
- `docs/specs/INSTRUCTIONAL_ARCHITECTURE.md` contains older Module 1 simulator-first language inconsistent with the current case-console implementation and current Module 1 spec. Reconcile stale prose when the relevant spec/workstream is next updated; do not infer implementation from it.

## First bounded implementation candidates

These are audit findings, not yet approved implementation changes:

1. **M12 start state:** select the existing ITSM Ticket view as the initial active M12 console view and frame it as shift-start review, while preserving the current tab set and layout. Define whether returning learners resume their saved tool view or always return to ITSM on a fresh shift.
2. **M12 relationships:** revise scenario/fixtures to use a parent CASE identity and explicit child incident IDs only after finalizing the capstone scenario and rubric. Connect relevant alerts/evidence to incidents and make independent incident status/closure behavior observable. This is a substantive scenario/data/rubric change.
3. **Reverse map:** after capstone flow decisions, update verified competency homes Modules 11 → 1; address the 11 traceability gaps through the smallest additions inside existing labs.
4. **M11 Prove record:** reconcile the assessment's `OPS-5511` scenario with its “no ticket” case view so the learner's work is recorded in the existing appropriate ITSM/Operations artifact.

## Limits of this audit

This is a source-only inventory at the commit above. It did not inspect the deployed app, perform browser interaction, verify staging/database state, independently validate every instructor screen, or reconcile all content against the authoritative syllabus. The current code, fixtures, rubric, and tests provide the recorded evidence; all other behaviors are labeled unknown rather than assumed.

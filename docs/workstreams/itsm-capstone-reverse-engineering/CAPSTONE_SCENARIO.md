# M12 Capstone Scenario Contract — Operation Amber Finch

**Status:** Draft for owner/content review; based on current synthetic fixture, not yet implemented.  
**UI constraint:** use the existing M12 console and ITSM tab. Do not add, move, or restyle UI.  
**Learning mode:** independent capstone assessment; no procedural guidance, answer cues, or pre-submit score.  
**Source scenario:** `portal/soc-m12-assessment-data.js` (`M12-AMBER-FINCH-2026-09-27`).  
**Assessment implementation:** `portal/soc-analyst-module-12.js`, `portal/soc-m12-assessment-console.js`, `portal/soc-m12-assessment-state.js`, `portal/soc-m12-assessment-rubric.js`, `portal/soc-m12-assessment-scorer.js`.

## Shift-start outcome

The learner receives one assigned parent CASE. The first active workspace view is its ITSM record. Before opening investigation tools, the learner should be able to tell:

- the CASE is the shift's scenario/work container;
- which incident records are linked and what is known about each;
- which alerts are assigned, their existing disposition/status, and which remain untriaged;
- the prior analyst activity, current ownership, and outstanding work;
- that alert association is a hypothesis to validate, not proof that all activity belongs to one incident.

From ITSM, the learner moves to existing alert, log, email, endpoint, identity, network, intelligence, exposure, response, recovery, evidence, and reporting views as the question requires. Findings cite source records and identify the incident they support. The learner returns to the same parent CASE for a reproducible handoff and closure decision. The parent CASE remains open while required child incidents are unresolved or recovery/monitoring evidence is missing.

This contract describes behavior inside the existing lab. The current M12 default was changed to ITSM in `d706d6f`; assignment/history context, parent/child relationships, and independent child state are not implemented yet.

## Scenario narrative

The Day SOC shift inherits **Operation Amber Finch**, a high-priority case opened after a suspicious email, endpoint execution, and identity activity surfaced in the same morning. Evidence supports two connected, confirmed work streams: endpoint execution on `WS-204` and suspicious use of `acct-204`. A third, similar-looking activity stream on `WS-118` is a benign approved inventory action. Other shift alerts are unrelated or lack enough telemetry for a confident disposition. The analyst must correlate the confirmed work, keep the benign control separate, preserve uncertainty where telemetry is incomplete, direct approved response, verify recovery, and hand off residual risk to the evening incident lead.

Existing operation/telemetry content remains the source unless a row below marks new content. Synthetic timestamps are UTC on 2026-09-27. Existing identifiers should be retained as legacy IDs when assigning canonical parent/incident IDs; no event or alert ID is silently recycled.

## Proposed case structure

These CASE/INC relationships are proposed contract data. They do not exist in the current M12 fixture and require owner/content validation before implementation.

| Parent | Child incident | Working title / expected disposition | Existing evidence and alerts to associate | Independent closure condition |
|---|---|---|---|---|
| `CASE-124821` (proposed) | `INC-4821` (current `INC-4821` retained as incident legacy ID) | Endpoint execution and outbound connection on `WS-204`; true positive. | Existing: `AL-1201`; `EM-212`, `EP-301`, `EP-303`, `NW-501`. Verify precise alert-to-record links during fixture audit. | Evidence preserved; response approved and executed on the supported endpoint; persistence removed; known-good restore selected; validation and monitoring recorded. |
| `CASE-124821` (proposed) | `INC-4822` (new) | Suspicious session activity for `acct-204`, linked to the endpoint incident; true positive with its own identity-response work. | Existing: `AL-1202`; `ID-402`, `ID-403`, and cross-incident `EM-212`. Add/confirm an identity alert only where actual telemetry supports it. | Identity/session action approved and executed; expected user/identity validation recorded; remaining access risk handed to Identity Response or Tier 2 SOC with owner. |
| `CASE-124821` (proposed) | `INC-4823` (new) | Similar script activity on `WS-118`; resolve benign/authorized and keep it separate from the confirmed chain. | Existing: `AL-1203`, `AL-1205`, `BEN-101`, `NW-504`; verify that these records support benign classification and bounded negative scope. | Evidence supports the benign disposition; no unsupported containment is attempted; incident is independently resolved and retained in the parent case history. |

The candidate creates three independently tracked incident work items, of which two are confirmed/related and one is a benign comparison that must remain unlinked to the malicious chain. Keep the third as a separate incident only if the content owner agrees that the scenario's assigned work queue would represent the benign lead that way; otherwise keep it as an unlinked queue alert and use the two confirmed child incidents. Do not manufacture a CASE→INC link merely to satisfy a count.

## Alerts, evidence, and provenance rules

- An alert can be associated with an incident only after the learner records a supported relationship. The fixture may show assignment context at shift start, but should preserve the distinction between pre-existing linkage and analyst-created association.
- The current 14-item queue (`AL-1201`–`AL-1214`) combines scenario leads, decoys, and unrelated shift activity. An alert's proximity in time, queue position, severity, or shared CASE does not establish that it belongs to an incident.
- `EM-212` may support both endpoint and identity incident narratives because its records name both entities; retain its original source and timestamp and record both links explicitly if validated.
- Evidence is immutable source material. Pinning or citing evidence does not change its source, incident relationship, or timestamp. A query result is reproducible investigation evidence only when the query and relevant returned records are retained.
- `BEN-101` and `NW-504` provide the benign/comparison and bounded-coverage paths. Lack of a match in the available search window is not proof of global absence.
- Confirm the alert/event mapping against the raw `telemetry` and queue generator before encoding the proposed associations. Do not infer mappings from `expectedTruth` labels alone.

## Analyst decision sequence and visible effects

| Stage | Analyst work | Expected observable state/evidence | Unsafe or incomplete branch |
|---|---|---|---|
| Shift intake | Open the assigned CASE in ITSM; inspect incident summaries, ownership, existing links/status, prior timeline, and outstanding tasks. | CASE identity and linked incident list are visible; opening/read actions do not score as findings. | Starting response without a scope/approval basis remains blocked and recorded. |
| Triage | Review the relevant queue alerts; explicitly mark supported true-positive, benign/false-positive, or needs-investigation with a reason. | Alert status/disposition and any incident association are recorded per alert. | Linking `AL-1203`/`AL-1205` to the malicious incidents without support is penalized; exploration alone is not. |
| Investigate | Query and pivot through email, endpoint, identity, network, intelligence, and exposure records; test benign alternatives and telemetry boundaries. | Evidence pins, query text/results, domain findings, and citations persist in the action log and each affected incident. | Unsupported malicious claims, unsupported scope expansion, or treating unknown reputation as malicious reduce the relevant competency. |
| Correlate and scope | Build a timestamped chain and identify the affected endpoint and identity separately; state how the incidents connect and where evidence is shared. | Parent/child relationship, cross-incident evidence references, actor, and chronology are reviewable. | A single undifferentiated incident conclusion loses scope/correlation credit. |
| Preserve and respond | Preserve evidence, request/record approval, then contain only supported targets. | Evidence-preservation action precedes eradication/containment; approved endpoint/identity actions record target and outcome. | Out-of-scope or unapproved attempts are still recorded and trigger the existing safety cap. |
| Recover | Remove persistence, select a known-good recovery point, scan, and monitor. | Each action and validation result attaches to its child incident; failed/partial outcomes remain visible. | A restore without validation does not make the incident or CASE closure-ready. |
| Resolve and hand off | Resolve each incident according to its own evidence/status; write technical and executive summaries, lessons learned, remaining risks, owner, and next review. | Each child incident status is independent; CASE remains open until all required child work and reports are complete. Durable instructor review retains all student writing and action history. | Closing the parent while required children are open is rejected or scored incomplete; valid uncertainty and alternate defensible paths receive credit. |

## Scoring and instructor review requirements

Use the existing competency categories and apply `docs/LAB_ASSESSMENT_STANDARD.md`:

- reward evidence-supported alert disposition, incident association, domain findings, scope, chronology, evidence preservation, safe response, recovery validation, reporting, and handoff;
- allow equivalent investigative sequences and defensible partial findings;
- do not penalize valid exploration or require a single click path;
- penalize explicit unsupported incident links, unsupported scope, contradictory conclusions, and unsafe response attempts at the relevant competency/safety gate;
- treat the proposed per-incident closure state and parent-case invariant as new rubric/state requirements, with a new rubric version. Historical submitted M12 attempts keep their original score and interpretation;
- provide the instructor with CASE and incident IDs/statuses, alert links, evidence provenance, action sequence, complete student-written responses, competency breakdown/reasons, and review/feedback controls.

An automated passing score remains a recommendation for instructor review. “View all tabs,” pinning alone, or a single case-level `resolved` value cannot stand in for a supported incident outcome.

## New or changed implementation needs

Current M12 has a case-record pane with one `caseId`, one case-level status, one affected-user/device pair, one set of findings, and one close/submit path. This contract needs investigation/design for:

1. A parent `caseId` separate from child `incidentIds`; use the existing `caseRecordPane` `incidentIds` support where it can express the display without changing the shell.
2. Explicit alert→incident and evidence→incident association in the fixture and scored student action, including supported multi-incident evidence links.
3. Independent child incident status/action state and the parent close guard. Decide whether these belong in M12's existing append-only assessment action log or an additive scenario state object; keep a single source of truth.
4. Ticket/incident identity on each action and instructor payload. Preserve historical M12 records and legacy `INC-4821` references through a versioned compatibility path.
5. A fresh-case ITSM initial view (implemented) and shift-start context; preserve the learner's saved tab when resuming.
6. Data-driven rubric v3 and action-missing checks for every newly scored invariant, traceability-map entries, and focused tests. (Tests are required by project acceptance; none have been run for the initial-tab change.)

## Open owner/content decisions

- Confirm whether the third benign comparison should be a separate child incident `INC-4823` or an unlinked queue alert. The two confirmed work streams already satisfy “multiple incidents.”
- Confirm assignment owner, initial incident/alert statuses, and whether any links exist before the learner opens ITSM; these facts determine the shift-start record.
- Confirm whether every child incident requires independent resolution, and which recovery/handoff gates prevent parent closure.
- Reconcile the proposed story and competency coverage to the authoritative SOC syllabus and the current M12 rubric before implementation.

## Existing records to preserve

`INC-4821`, `AL-1201`–`AL-1214`, `EM-212`, `EP-301`, `EP-303`, `ID-402`, `NW-501`, `NW-504`, `BEN-101`, `TI-601`–`TI-605`, backup IDs, telemetry rows, submitted rubric v1/v2 payloads, and existing learner completion records. New CASE/INC identifiers and evidence links must not change a historical attempt's displayed scenario or score.

# Capstone skill backfill — teach every M12 mechanic before M12

## Next AI — start here (2026-10-07, plan written, Sprints 1–3 launched)

Owner rule (2026-10-07): every task the M12 capstone grades must first be
practised (Practice It / Guided Lab) and then assessed (Prove It /
Assessment Lab) in an earlier module. A live audit of M12's grading code
(`portal/soc-m12-assessment-rubric.js` `extractV2`, `soc-m12-assessment-console.js`)
against Modules 01–11 found four mechanics with no earlier home. This
workstream adds "a few more tasks per module here or there" to close them.

Read first, in order: `docs/LAB_ASSESSMENT_STANDARD.md`, `ROADMAP.md`,
this file, then the target module's code.

## Principle: the capstone is the reference (owner, 2026-10-07)

"If the capstone is debugged and perfect for the learner, I should be able
to reverse engineer those bugs down all other 11 modules." So every graded
M12 mechanic must trace to (1) the module(s) whose Practice It teaches it,
(2) the module whose Prove It assesses it, and (3) the shared code both use
(`SocConsoleTools.PACKS.mXX`, `caseRecord*`, a state/rubric file). A bug
found in the capstone is then looked up in that map and fixed — or
checked — at its source module. M12 embeds the M04–M10 packs directly, so
a pack bug seen in M12 is the same bug in its home module.

Deliverable (Sprint 4): `portal/soc-capstone-traceability.js` — one entry per
M12 rubric item / required action (`SocM12AssessmentRubric.CRITERIA` plus
`moduleTwelveActionMissing()` checks) with `{ capstone, practice: [module,
tab/step], prove: [module, rubric item], code: [files] }` — and
`tests/capstone-traceability.test.js`, which fails if any M12 graded
mechanic has no Practice and Prove home, or if a referenced file/rubric id
no longer exists. Docs table generated from the same data in this file.

## The four gaps

| # | Capstone mechanic (M12 code) | Points in M12 | Practice It home | Prove It home |
| --- | --- | --- | --- | --- |
| A | Intelligence verdict per indicator: `malicious` / `benign` / `unknown` + rationale that cites corroborating evidence (`intel-decision`; wrong explicit verdict −5; `unknown` is correct when evidence is insufficient, e.g. TI-604) | 10 | M04 Guided Lab, Threat Intelligence tab | M04 Assessment Lab |
| B | Response workflow design: choose action nodes and connect them `from>to`, preserving evidence before approval and approval before isolation (`workflow-design`, nodes in `SocM12AssessmentData.scenario.workflowNodes`) | 5 | M09 Guided Lab, Response tab | M09 Assessment Lab |
| C | Unsafe response attempts are recorded and penalised: an isolate / revoke-session / restore attempted without a recorded approval, or on an out-of-scope target, is logged even though it is blocked (M12 caps the whole score at 69 = fail) | cap | M09 Guided Lab (attempt is recorded and the guide explains why it matters) | M09 Assessment Lab (competency deduction, not a whole-score cap unless the owner later asks) |
| D | Alert disposition vocabulary `true-positive` / `benign-positive` / `false-positive` / **`needs-investigation`** per alert; `needs-investigation` is correct when telemetry cannot yet support a conclusion (M12 AL-1208) | part of 12 | M03 Guided Lab: an alert that falls inside the AppAudit collector delay the `health` guide step already teaches | M11 Assessment Lab: queue triage already scores per-item dispositions (`soc-m11-assessment-data.js` `dispositions`) — add the option and one queue item whose supported answer is needs-investigation |

## Rules for every sprint

- Follow `docs/LAB_ASSESSMENT_STANDARD.md`: Practice It gives progressive
  hints and instant feedback; Prove It gives **no** procedural guidance, no
  pre-submission answer feedback, no glowing controls. Report the standard's
  pre-implementation block (REFERENCE COMPONENTS FROM MODULE 1 … FILES TO
  CREATE) in the sprint log below.
- Add, don't replace: keep each module's existing scenario, tasks and
  passing bar. "A few more tasks", consistent with the module's story and
  entity names. No vendor names. Never say "Boots2Bytes".
- Prove It scoring changes must be versioned or additive so attempts that
  are already submitted/approved keep their score and still load. Check how
  the module stores score (at submit time vs recomputed) before changing a
  rubric.
- Saved state round-trips through Postgres jsonb, which **reorders object
  keys**. Never validate saved state with `JSON.stringify(a) === JSON.stringify(b)`
  (that bug broke M09–M12 tabs on reload; fixed in 38949f5). Every new
  state field must survive normalize() after a jsonb-style key reorder —
  add a test for it.
- Reuse shared UI where M12 already has it (e.g. the workflow designer in
  `soc-m12-assessment-console.js` `contextualMarkup('response')`) — prefer
  moving it into the shared `SocConsoleTools.PACKS.m09` so M09 and M12
  render the same control, without changing M12's recorded action shapes.
- Learner-facing copy: plain analyst language, short. Give the `from>to`
  syntax an inline example (`preserve>approval`) wherever a connection box
  appears, including M12.
- Tests: extend the module's `tests/` files; the Prove It changes need the
  standard's required scenarios (perfect, partial, unsupported conclusion,
  etc.) for the new competency items. Pre-existing failures on master that
  are NOT yours: guided-lab-console-guide, soc-m04-assessment-rubric,
  soc-m04-assessment-scorer, soc-m05-assessment-console — don't count them,
  but don't make them worse (if your sprint touches M04 rubric/scorer, note
  whether they change).
- Verify: `bash bin/ci-check.sh` and `node --test tests/`. Sprints 1–3 run in parallel worktrees, so they do NOT start servers (dev.sh ports are fixed); Sprint 4 runs the real-browser
  sweep `NODE_PATH=/home/alex/.npm/_npx/6bcb61ec6d5aea22/node_modules node bin/console-tab-sweep.js <modules>`
  (needs the portal on :8768 — `bin/dev.sh`, target must be STAGING).
- Commit on your branch with a clear message; do not push. Update this file's
  sprint log (what shipped, files, caveats) as your last step.

## Sprint plan

- [x] **Sprint 1 — M04 intelligence verdicts (gap A).** Guided + Assessment.
- [x] **Sprint 2 — M09 workflow designer + recorded unsafe attempts (gaps B, C).** Guided + Assessment; shared designer reused by M12 with an inline `preserve>approval` example.
- [x] **Sprint 3 — needs-investigation disposition (gap D).** M03 Guided + M11 Assessment.
- [ ] **Sprint 4 — traceability map + integration.** (4a traceability map: done, see log; 4b merge, browser sweeps, UAT doc, owner push: open.) Build the traceability module and test above (covering all M12 mechanics, not just A–D). Merge, full test + browser sweeps (M01 and M03–M12), update `MODULE_TWELVE_ARC_CALLBACKS` in `soc-analyst-module-12.js` to cite the new practice, update `docs/workstreams/LIVE_COURSE_UAT_AND_GRADING_UX.md`, owner push.

## Traceability table

Source of truth: `portal/soc-capstone-traceability.js`. Kept honest by
`tests/capstone-traceability.test.js`, which reads the M12 mechanics from the
capstone code (rubric v2 awards, deductions and misses; the
`moduleTwelveActionMissing()` messages; the ticket fields; the action types;
the unsafe-execution cap) and fails when one has no entry, when a referenced
guide step, rubric criterion, tab or file does not exist, or when a mechanic
has an empty Practice or Prove list that is not in the test's `KNOWN_GAPS`
allowlist. Regenerate this table with `node bin/capstone-traceability-table.js`
and paste it over the one below.

Generated by `node bin/capstone-traceability-table.js` from `portal/soc-capstone-traceability.js` (41 mechanics). Practice = guided-lab step (M03 step id, otherwise step title); "(generic)" means a ticket-driven step that only touches the mechanic. Prove = rubric criterion id in that module (M01/M02: score-breakdown key). Every row also runs through the M12 console (`soc-m12-assessment-console.js` mount(), which embeds PACKS m04, m05, m06, m07, m08, m09, m10), `soc-m12-tool-bridge.js` and `soc-m12-assessment-state.js`; those three files are left out of the code column.

| M12 mechanic | M12 criterion | M12 tab | Practice It (guided) | Prove It | Shared code | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| `intel-verdict-corroborated`: Record a malicious / benign / unknown verdict per indicator with a rationale that cites corroborating records | intelligence-preparation | intelligence | M04 intelligence / Judge the reported source<br>M04 intelligence / Know when the answer is unknown | M04 intelligence-verdicts<br>M04 intelligence-corroboration | tools PACKS.m04<br>soc-m04-intelligence-ui.js<br>soc-m04-assessment-state.js<br>soc-m04-assessment-rubric.js |  |
| `intel-wrong-verdict-deduction`: An explicit verdict the records contradict costs points; unknown never does | intelligence-preparation | intelligence | M04 intelligence / Rule out a benign explanation | M04 intelligence-verdicts | tools PACKS.m04<br>soc-m04-assessment-rubric.js |  |
| `query-correlated`: Run a reproducible query whose results correlate at least three primary records across sources | queries-detection-scheduling | rules | M03 search / auth<br>M03 search / session<br>M03 search / scope<br>M04 search / Start from the lead (generic) | M03 investigation<br>M04 query-rule-quality<br>M06 query-and-pivots | tools PACKS.m04<br>tools PACKS.m06<br>kql-engine.js<br>soc-m04-rules-ui.js |  |
| `rule-saved`: Save a detection rule built from a correlated query | queries-detection-scheduling | rules | none (tool open in M04 rules) | M04 query-rule-quality | tools PACKS.m04<br>soc-m04-rules-ui.js<br>soc-m04-rule-evaluator.js | No M04 Guided Lab step teaches building and saving a correlated rule. The Analytics Rules tab is open in that console but the guide goes lead, correlate, verdicts, ticket. |
| `rule-scheduled`: Enable a recurring schedule on the correlated rule | queries-detection-scheduling | rules | none (tool open in M04 rules) | M04 scheduled-execution | tools PACKS.m04<br>soc-m04-rules-ui.js | No M04 Guided Lab step teaches enabling and scheduling a rule (same missing step as rule-saved). |
| `alert-disposition-supported`: Call each alert true-positive / benign-positive / false-positive from the records | alert-incident-management | alerts | M03 alerts / disp-tp<br>M03 alerts / disp-benign<br>M03 alerts / disp-false | M11 alert-disposition | soc-analyst-module-03-environment.js#M03E_GUIDE_STEPS<br>soc-m11-assessment-rubric.js<br>soc-m11-assessment-state.js |  |
| `alert-disposition-needs-investigation`: Use needs-investigation when telemetry cannot yet support a call (AL-1208); it is never penalised | alert-incident-management | alerts | M03 alerts / disp-ni | M11 alert-disposition | soc-analyst-module-03-environment.js#disp-ni<br>soc-m11-assessment-rubric.js |  |
| `alert-disposition-unsupported-deduction`: An explicit disposition the records contradict costs points | alert-incident-management | alerts | M03 alerts / disp-benign<br>M03 alerts / disp-false | M11 alert-disposition | soc-m11-assessment-rubric.js |  |
| `alert-incident-link`: Link the supported alert to the incident record by incident id | alert-incident-management | alerts | none | none |  | The alert-to-incident link form exists only in the M12 alerts tab. M07 and M08 teach and assess linking evidence or findings to an incident through different controls; no earlier module asks the learner to link an alert to an incident id. |
| `alert-incident-link-unrelated-deduction`: Linking an alert the records show is unrelated costs points | alert-incident-management | alerts | none | none |  | Same missing home as alert-incident-link: no earlier module links alerts to an incident, so none penalises linking an unrelated one. |
| `ticket-priority-scope-justified`: Ticket affected user and device, high or critical severity, and a priority rationale that cites primary evidence | alert-incident-management | case | M01 case / Scope and decide<br>M03 itsm / decide<br>M04 case / Scope and decide | M01 affected_entity<br>M01 severity<br>M02 affected_entity<br>M02 severity<br>M03 verdict<br>M03 evidence | case-record.js<br>soc-analyst-module-12.js#moduleTwelveCaseSpec |  |
| `ticket-disposition-escalation`: Ticket status, disposition, escalation and routing department | alert-incident-management | case | M01 case / Scope and decide<br>M03 itsm / decide<br>M09 case / Set scope and decide | M01 disposition<br>M01 escalation<br>M02 disposition<br>M02 escalation<br>M03 verdict<br>M03 response | case-record.js |  |
| `domain-identity`: Evidence-linked finding on identity records (sign-in and token activity) | cross-domain-investigation | evidence | M03 search / auth<br>M03 search / session<br>M03 entities / baseline | M03 investigation<br>M03 evidence<br>M02 access_finding | soc-analyst-module-03-environment.js<br>soc-m12-assessment-console.js#findingControls |  |
| `domain-email`: Evidence-linked finding on mail delivery and click records | cross-domain-investigation | email | M07 email / Start from the lead (generic)<br>M07 email / Correlate the records (generic) | M07 confirmed-chain<br>M07 delivery-scope | tools PACKS.m07<br>soc-m07-assessment-email-ui.js |  |
| `domain-endpoint`: Evidence-linked finding on endpoint process, file and registry records | cross-domain-investigation | endpoint | M05 alerts / Start from the lead (generic)<br>M05 timeline / Correlate the records (generic) | M05 process-ancestry<br>M05 malicious-benign-interpretation<br>M05 persistence | tools PACKS.m05<br>soc-m05-assessment-device-ui.js |  |
| `domain-network`: Evidence-linked finding on DNS, proxy, firewall and session records | cross-domain-investigation | network | M07 network / Correlate the records (generic) | M07 confirmed-chain | tools PACKS.m07<br>soc-m07-assessment-network-ui.js |  |
| `domain-exposure`: Evidence-linked finding on exposure and control records | cross-domain-investigation | exposure | M08 alerts / Validate applicability<br>M08 evidence / Compare local risk | M08 audited-finding-review<br>M08 freshness-applicability<br>M08 asset-context-controls | tools PACKS.m08<br>soc-m08-assessment-ui.js |  |
| `domain-contradicted-malicious-deduction`: Calling activity malicious while citing evidence that contradicts it costs that domain its points | cross-domain-investigation | evidence | M03 watchlists / lookalikes<br>M05 timeline / Correlate the records (generic) | M05 malicious-benign-interpretation<br>M07 noise-rejection<br>M06 scope-and-comparison<br>M03 scope | soc-m12-assessment-rubric.js#maliciousClaim |  |
| `timeline-chronological`: Reconstruct at least three pinned primary records in chronological order | timeline-scope-evidence-attack | timeline | M03 search / sort<br>M03 timeline / timeline<br>M10 timeline / Reconstruct the chronology | M10 timeline | tools PACKS.m10<br>soc-m10-assessment-state.js |  |
| `scope-confirmed-entities`: Name the confirmed affected entities (ws-204, acct-204) in a scope finding backed by primary records | timeline-scope-evidence-attack | evidence | M03 search / scope<br>M03 entities / baseline | M03 scope<br>M05 affected-device-scope<br>M07 delivery-scope | soc-analyst-module-12.js#moduleTwelveSyncTicket |  |
| `scope-bounded-negative`: State a "no second device" finding bounded by the source and time coverage that supports it (NW-504) | timeline-scope-evidence-attack | network | M03 sources / health (generic)<br>M03 search / scope | M07 unknown-boundaries<br>M06 uncertainty-boundary<br>M08 uncertainty-boundary | soc-m12-assessment-rubric.js#secondaryScope |  |
| `evidence-retained`: Pin the relevant records (up to three credited) | timeline-scope-evidence-attack | evidence | M03 evidence / pin<br>M03 evidence / contributing | M03 evidence<br>M05 evidence-preservation<br>M06 evidence-collection<br>M10 evidence-selection | soc-analyst-module-03-environment.js<br>soc-m12-assessment-console.js#evidence-select |  |
| `attack-mapping`: Map ATT&CK techniques only to demonstrated behavior, citing the supporting record (three credited) | timeline-scope-evidence-attack | attack | none (tool open in M06 attack) | M06 attack-mapping<br>M10 attack-linkage | tools PACKS.m06<br>attack-catalog.js | No Guided Lab step teaches mapping a technique to a record. The ATT&CK tab is open in the M06 and later guided consoles, but the guides never send the learner there. |
| `unsupported-scope-deduction`: Naming a benign or unrelated entity as affected costs points | timeline-scope-evidence-attack | evidence | M03 watchlists / lookalikes | M03 scope<br>M05 affected-device-scope<br>M07 noise-rejection |  |  |
| `attack-unsupported-deduction`: An ATT&CK mapping with no supporting behavior costs points | timeline-scope-evidence-attack | attack | none (tool open in M06 attack) | M06 attack-mapping<br>M10 attack-linkage | tools PACKS.m06 | Same missing step as attack-mapping. |
| `workflow-design`: Design a response workflow that preserves evidence before approval and approval before isolation (preserve>approval>isolate) | tuning-automation-containment | response | M09 response / Plan the order of response<br>M09 response / Read the workflow check | M09 response-workflow-design | soc-console-tools.js#workflowDesignerMarkup<br>soc-console-tools.js#parseWorkflowEdges<br>soc-m09-assessment-state.js<br>soc-m09-assessment-rubric.js |  |
| `approval-explicit`: Record an explicit approval for the exact protected action and target | tuning-automation-containment | response | M09 response / Do it the safe way | M09 approval-and-containment | tools PACKS.m09<br>soc-m09-assessment-state.js |  |
| `containment-executed`: Execute containment on supported targets (isolate ws-204, revoke acct-204 sessions, block 203.0.113.72); credit is pro-rated over the four safe actions | tuning-automation-containment | response | M09 response / Do it the safe way<br>M09 evidence / Check response outcomes | M09 approval-and-containment<br>M09 outcome-verification | tools PACKS.m09<br>soc-m09-assessment-state.js |  |
| `evidence-preserved-before-eradication`: Preserve ws-204 evidence (execute preserve) before any eradication; remove-persistence is blocked until it exists | tuning-automation-containment | automation | none (tool open in M05 endpoint) | M05 evidence-preservation<br>M09 evidence-and-scope<br>M09 evidence-before-eradication<br>M10 preservation | tools PACKS.m05<br>tools PACKS.m09<br>soc-m04-automation.js | No Guided Lab step performs the preserve action. M09 "Check response outcomes" only reads preservation records, and the M04/M05 guides never open the Automation or Endpoint evidence-package controls. |
| `unsafe-execution-deduction`: Any blocked or out-of-scope response attempt, or a protected action without approval, costs points even if blocked | tuning-automation-containment | response | M09 response / See what an unsafe attempt costs | M09 safe-response-conduct<br>M05 unsafe-action-boundary | tools PACKS.m09<br>soc-m09-assessment-state.js#attemptResponseAction<br>soc-m09-assessment-rubric.js |  |
| `unsafe-execution-cap`: An unsafe state-changing attempt caps the whole capstone score at 69 (fail) | tuning-automation-containment | response | M09 response / See what an unsafe attempt costs | M09 safe-response-conduct | soc-m12-assessment-scorer.js#SAFETY_CAP<br>soc-m12-assessment-rubric.js#unsafeExecution<br>soc-assessment-scorer.js |  |
| `recovery-persistence-removed`: Remove persistence on ws-204 after evidence is preserved | eradication-recovery | recovery | none (tool open in M09 recovery) | M09 identity-and-persistence<br>M09 evidence-before-eradication | tools PACKS.m09<br>soc-m09-assessment-state.js | No M09 Guided Lab step removes persistence or uses the Recovery tab; the guide stops at the approved containment action. |
| `recovery-sessions-revoked`: Revoke the affected identity sessions (revoke-session:acct-204 must have executed) | eradication-recovery | response | M09 response / Do it the safe way (generic) | M09 identity-and-persistence | tools PACKS.m09 |  |
| `recovery-restored`: Restore the trusted pre-incident recovery point (BK-204-0900) with a recorded approval | eradication-recovery | recovery | none (tool open in M09 recovery) | M09 recovery-readiness | tools PACKS.m09<br>soc-m09-assessment-state.js | No M09 Guided Lab step selects and restores a known-good recovery point. |
| `recovery-validated`: Validate recovery with a clean scan and continued monitoring, in order after the restore | eradication-recovery | recovery | none (tool open in M09 recovery) | M09 recovery-monitoring | tools PACKS.m09<br>soc-m09-assessment-state.js | No M09 Guided Lab step scans and monitors after recovery. |
| `report-technical`: Technical narrative (ticket work notes or Reporting tab) that cites supporting records or their entities | reporting-operations-lessons | reporting | M11 reporting / Trace the signal and handoff | M11 technical-report<br>M03 documentation | case-record.js<br>soc-m11-assessment-rubric.js<br>soc-analyst-module-12.js#moduleTwelveSyncTicket |  |
| `report-executive`: Executive summary grounded in incident evidence and free of technical identifiers | reporting-operations-lessons | reporting | M11 reporting / Trace the signal and handoff (generic) | M11 executive-summary | soc-m11-assessment-rubric.js<br>soc-analyst-module-12.js#moduleTwelveSyncTicket |  |
| `report-lessons`: Lessons-learned report that references an evidenced control gap | reporting-operations-lessons | reporting | none | M11 lessons-detection | soc-m11-assessment-rubric.js | No Guided Lab step asks for lessons learned or a detection improvement; M11 "Trace the signal and handoff" stops at the owner request. |
| `handoff-recorded`: Shift handoff that names affected entities or the outstanding risks | reporting-operations-lessons | operations | M03 itsm / handoff<br>M11 reporting / Trace the signal and handoff | M11 shift-handoff<br>M03 documentation | soc-m11-assessment-rubric.js<br>soc-analyst-module-03-environment.js#handoff |  |
| `closure-decision`: Close only after restore, scan and monitoring; otherwise retain, with a rationale citing the case and recovery status | reporting-operations-lessons | reporting | M11 case / Set scope and decide (generic) | M11 closure-decision<br>M11 residual-risk<br>M09 recovery-monitoring | soc-m11-assessment-rubric.js<br>soc-analyst-module-12.js#moduleTwelveSyncTicket |  |
| `written-communication`: Readable written communication in at least one report of 80+ characters | reporting-operations-lessons | reporting | M01 case / Write the handoff and submit | M01 analyst_notes<br>M03 documentation | case-record.js |  |

11 of 41 mechanics still have a gap: `rule-saved`, `rule-scheduled`, `alert-incident-link`, `alert-incident-link-unrelated-deduction`, `attack-mapping`, `attack-unsupported-deduction`, `evidence-preserved-before-eradication`, `recovery-persistence-removed`, `recovery-restored`, `recovery-validated`, `report-lessons`.

### How to use: capstone bug -> home module

When something is wrong in the capstone, find the row for the thing that
misbehaved: match on the M12 tab you were in, the action it records
(`recordedAs` in the data file) or the rubric line in the learner's score
feedback. The row gives three places to look. **Shared code** is where the
bug lives, because M12 mounts the same `SocConsoleTools.PACKS.m04`..`m10`
controls, the shared case-record ticket pane and the same scorers as the
module that teaches the skill; fix it there and the home module is fixed
too. **Practice It** names the guided-lab step to replay (does the bug
reproduce in the coached version?), and **Prove It** names the rubric
criterion in the home module to re-score (does the same input earn the same
credit there?). A row with a Gap is a different kind of finding: the
mechanic only exists in M12, so a defect there has no earlier module to
cross-check against, and the right fix may be to add the missing
Practice/Prove task (then delete the id from `KNOWN_GAPS` in the test and
regenerate the table).

## Sprint log

(each sprint appends here)

### Sprint 1 — M04 intelligence verdicts (gap A) — 2026-10-07

Pre-implementation report (per `docs/LAB_ASSESSMENT_STANDARD.md`):

```text
REFERENCE COMPONENTS FROM MODULE 1
  Case-record / ITSM ticket submit and review model (caseRecord, review_payload), Learn/Practice/Prove
  shell, the guided-lab guide card (guidedLabGuide steps with tab + target), instructor review card
  (adminAttemptReviewCard rubric panel), "submitted = complete pending faculty review".

REUSABLE COMPONENTS
  SocConsoleTools.PACKS.m04 Threat Intelligence tab (one shared view for Practice It and Prove It),
  SocM04IntelligenceUi (IOC/report lifecycle), SocM04AssessmentActions action log,
  SocM04AssessmentRubric.extract -> SocM04AssessmentScorer -> SocAssessmentScorer.scoreCriteria,
  SocM04AssessmentState.normalize, the guided fixture derived from SocM04AssessmentData.
  The M12 mechanic is the reference: same three verdicts, same "rationale cites evidence or entities",
  same "unknown is right when evidence is insufficient", same penalty for an explicit wrong verdict.

TARGET MODULE DIFFERENCES
  M04 scores a fixed 100 points over 8 criteria and stores the score at submit. The M04 IOC list has no
  benign indicator, so a fourth indicator (the managed mail address the reputation sweep flags) is a
  separate verdictIndicators list rather than a new feed IOC (the feed list and its tests are untouched).
  The pack is shared with M05-M12 consoles, so the verdict section renders only when the fixture
  defines verdictIndicators (M04 only).

ASSESSMENT COMPETENCIES
  New criterion intelligence-verdicts (10 pts). Four indicators: 198.51.100.64 malicious (3),
  203.0.113.77 benign (3), 192.0.2.91 unknown (2), legacy-drop.example unknown (2).

PARTIAL-CREDIT MODEL
  Per indicator: points-1 for the right verdict, 1 for reasoning (>=25 chars, and for malicious/benign it
  must cite a case record or entity; for unknown it must say what is missing). Explicit verdict the
  records contradict: no credit for that indicator and a 2-point deduction. Unknown on a decidable
  indicator: no verdict credit, no deduction, reasoning credit kept if it cites the records. Any of
  several records/entities may be cited (events, report, accounts, change ticket). Exploration is not
  scored. Rubric v2 splits the existing 25-point intelligence competency: corroboration 15->10, IOC
  lifecycle 10->5, verdicts +10. Other six criteria, the 100 max, the 70 bar and the safety cap are unchanged.

INSTRUCTOR-REVIEW REQUIREMENTS
  Review card shows each indicator, the learner's verdict, the full reasoning (paragraphs preserved),
  whether it was supported/contradicted/left unknown, points earned/available, plus the criterion's
  awards, deductions and misses in the existing System rubric panel.

FILES TO MODIFY
  portal/soc-m04-assessment-data.js, -state.js, -actions.js, -rubric.js, -scorer.js,
  portal/soc-m04-intelligence-ui.js, portal/soc-console-tools.js (PACKS.m04),
  portal/soc-analyst-module-04.js (+ .css), portal/app.js (review card), portal/index.html (cache busters),
  tests/soc-m04-assessment-{actions,rubric,scorer}.test.js.

FILES TO CREATE
  tests/soc-m04-intel-verdicts.test.js
```

What shipped:

- **Practice It.** Threat Intelligence tab has an "Indicator verdicts" section (one card per indicator:
  verdict select + reasoning). Three new guide steps ("Judge the reported source", "Rule out a benign
  explanation", "Know when the answer is unknown") inserted before "Scope and decide". Per-indicator
  three-level progressive hints (Show a hint / Another hint), instant feedback after recording (good /
  close / wrong with a one-line why or nudge), and a debrief line. Guided restart clears verdicts and hints.
  The guided data is `MODULE_FOUR_GUIDED_FIXTURE` (GL4-I-301 malicious, GL4-C-401 benign, GL4-I-302 and
  GL4-I-303 unknown).
- **Prove It.** Same control, no hints, no feedback, no highlighting; one extra sentence in the brief.
  New `intelligence-verdicts` criterion, `rubricVersion` 2. State fields `assessment.intelVerdicts`
  (keyed by indicator id) and `assessment.intelHints`, both normalized and jsonb-reorder safe. New action
  type `intel_verdict` (deliberately not `ioc_edit`, which would have satisfied the IOC lifecycle criterion).
- **Backward compatibility.** The score is computed once, in the submit handler, and stored in
  `result`/`review_payload`; nothing recomputes it on load, so submitted/approved attempts keep their score
  and render (pre-verdict cards simply have no verdict panel). v1 rubric/criteria are kept
  (`extract(..., {rubricVersion:1})`, `score(..., {rubricVersion:1})`). Not-yet-submitted attempts are
  scored under v2 at submit.
- **Instructor review.** `review_payload.intelligenceVerdicts` + a "Student indicator verdicts and
  reasoning" panel in `adminAttemptReviewCard`.
- **Tests.** `tests/soc-m04-intel-verdicts.test.js` (data contract, recordVerdict, perfect / partial /
  equivalent-paths / exploration / unsupported-conclusion / weak-documentation / polished-but-wrong,
  versioning, jsonb key reorder, Practice vs Prove rendering, guide steps, console wiring, review card
  incl. a legacy v1 attempt). `soc-m04-assessment-actions` type list, and the rubric/scorer fixtures,
  updated for the new type/criterion.

Results: `node --test tests/` 90 tests, 86 pass, 4 fail; the 4 are the same pre-existing failures
(guided-lab-console-guide, soc-m04-assessment-rubric, soc-m04-assessment-scorer,
soc-m05-assessment-console). `bash bin/ci-check.sh` passes.

Caveats / for the owner:

- **Bug 5 (10-minute window) unchanged.** The M04 rubric and scorer tests still fail at the same
  assertions (query-rule-quality / 92 != 100). I added the verdict fixtures and updated the
  criterion-count assertions (8 -> 9, awards 8 -> 16) so they do not fail earlier because of this
  sprint; with the test state's `windowMinutes: 10` patched to 20 in a scratch copy both files pass in full.
- Weight rebalance (corroboration 15->10, lifecycle 10->5) is a judgment call: it keeps the intelligence
  competency at 25 and every other weight and the 70 bar unchanged. Say if you would rather draw the 10
  points from elsewhere.
- Verdict wording/values: 192.0.2.91 and the expired domain are both "unknown"; 203.0.113.77 (stale
  mail-client credential after CR-204) is the benign one. A learner who calls an indicator unknown when
  the case supports a verdict loses the verdict credit but no deduction.
- Inserting three guide steps shifts the saved `guideStep` of any learner already past step 4 by up to three.
- `SocM04AssessmentState.load()` still compares `JSON.stringify` only to decide whether to re-save a
  migration (pre-existing, harmless on reorder: it just saves once); left alone.
- No browser verification (Sprint 4): the Threat Intelligence tab render, hint button, and review card
  are covered by string-level tests only.
- Shared files other sprints may also touch: `portal/soc-console-tools.js` (PACKS.m04 only),
  `portal/index.html` cache-buster lines, `portal/app.js` (one new panel in `adminAttemptReviewCard`).

### Sprint 2 — M09 workflow designer + recorded unsafe attempts (gaps B, C) — 2026-10-07

Branch `worktree-agent-a82b7fdec44723fd8`, code commit `34100a5`.

```text
REFERENCE COMPONENTS FROM MODULE 1
  Guided Lab console guide card (guidedLabGuide steps with target/lookFor/lab),
  practiceResult() instant scoring, Prove It review payload stored at submit
  (review_payload on the lab attempt), adminAttemptReviewCard rubric panel.
REUSABLE COMPONENTS
  SocConsoleTools.PACKS.m09 views/wire, SocM09AssessmentState (approval gate,
  executeApprovedAction, field-by-field comparison as in sameEffects),
  SocAssessmentScorer.scoreCriteria (awards + deductions), M12's
  workflow-design recorder (unchanged shape).
TARGET MODULE DIFFERENCES
  M09 gates every protected action behind approval (M12 only isolate / revoke /
  restore); M09 targets are incident-scoped entities (DEV-UNKNOWN-173 is the
  out-of-scope device); M09 Prove It stores its score at submit, M12 re-scores.
ASSESSMENT COMPETENCIES (rubric v3, still 100, pass 70)
  The original nine re-weighted (8/8/8/12/8/11/11/8/6) plus
  response-workflow-design (10) and safe-response-conduct (10).
PARTIAL-CREDIT MODEL
  Workflow design, best saved design counts: +4 evidence reaches approval,
  +4 every containment/recovery step is behind approval (+2 if only some),
  +2 a scan/monitor step follows containment, -2 per disruptive step that feeds
  back into preserve/approval, floor 0. Reachability, not exact edges, so
  different valid orders score the same; extra drafts never lower the score.
  Safe conduct: 10 when at least one approved, in-scope action ran, -3 per
  blocked attempt (no approved action = 0). No whole-score cap.
INSTRUCTOR-REVIEW REQUIREMENTS
  review_payload.responseReview lists every saved design (name, steps,
  from>to order) and every blocked attempt (action, target, reason);
  adminResponseDesignReviewPanel renders them; the rubric panel now shows
  per-criterion deductions with their reasons.
FILES TO MODIFY
  portal/soc-console-tools.js (m09 section), soc-m09-assessment-state.js /
  -rubric.js / -scorer.js, soc-analyst-module-09.js, soc-m12-assessment-console.js,
  app.js, index.html (cache-bust), tests/soc-m09-assessment-{state,rubric,scorer}.test.js,
  tests/soc-m12-contextual-console.test.js.
FILES TO CREATE
  tests/soc-m09-workflow-attempts.test.js
```

What shipped

- Shared designer: `SocConsoleTools.workflowDesignerMarkup` / `parseWorkflowEdges`
  render one control in the M09 Response tab (flag `ctx.workflowDesigner`) and in
  M12 (`contextualMarkup('response')`). M12 still records `workflow-design`
  `{name,nodes,edges}` with `edges` as `{from,to}`. Every connections box now
  says "One connection per line, e.g. `scan>monitor`"; the parser also accepts
  `->` and is case-insensitive.
- State (`SocM09AssessmentState`, schemaVersion unchanged): new additive
  `workflowDesigns` and `unsafeAttempts`, validated field by field (key-order
  safe, no JSON text compare); `saveWorkflowDesign`, `attemptResponseAction`
  (allowed attempts run as approved executions; refused ones are logged with
  reason `no_approval` / `out_of_scope` / `wrong_target_type`).
- Practice It: four guide steps (plan the order, read the workflow check, see
  what an unsafe attempt costs, do it the safe way), instant checklist on each
  saved design with hints that open one per unsuccessful design, an attempt
  explanation that states the capstone consequence (cap at 69) and the Prove It
  consequence, two new practice score items, a debrief line.
- Prove It: same designer and attempt form with no coaching text; brief gains
  "Record your planned response order as a workflow in the Response tab."
- Backward compatibility: the M09 score is computed once at submit and stored
  in `review_payload`, so approved/submitted attempts keep their score.
  `SocM09AssessmentScorer.score(state, fixture, { rubricVersion: 2 })` still
  reproduces the nine-criterion rubric exactly; old saved state without the new
  fields loads cleanly (tested).
- Tests: new `tests/soc-m09-workflow-attempts.test.js` (shared markup, state API,
  jsonb key-reorder round trip, perfect / partial / equal-credit paths /
  exploration / unsupported order / unsafe-attempt deductions, v2 vs v3, review
  panel, fake-DOM wiring, Practice coaching). `node --test tests/`: 90 files,
  86 pass, 4 fail (exactly the four pre-existing failures). `bash bin/ci-check.sh` passes.

Caveats

- No browser run (Sprint 4). New elements (`.m09-workflow-coach`, `.m09-attempt`,
  `.m09-attempt-coach`) reuse existing console styles; check spacing in the sweep.
- Documentation quality is not separately scored in M09's scorer (writing lives
  in the ticket), so the "strong technical / weak documentation" scenarios are
  covered by design-only vs. response-only tests.
- Cache-bust query strings in `portal/index.html` were bumped for the changed
  scripts; expect a trivial merge conflict with Sprint 1 on the
  `soc-console-tools.js` line.
- The example is `scan>monitor`, not `preserve>approval`, on purpose: the
  assessment control must not print a graded connection. Practice reveals
  `preserve>approval` only in hint 3.
- M12 still offers 9 nodes while its recorder accepts 2-8; selecting all nine
  errors (pre-existing, unchanged). M12's bridge does not project M09
  `unsafeAttempts` (the M09 attempt form is off in M12; M12 has its own).

### Sprint 3 — needs-investigation disposition (gap D), 2026-10-07

Branch `worktree-agent-ac280c066086eaf9e`, commit `50ef287` (+ this log). Not pushed.

**Premise correction.** The plan said M11 "already scores per-item dispositions". It did not:
`expectedTruth.dispositions` was unused, the learner had no way to record one, and no rubric
criterion read it (`recordedDisposition` is only the closed items' prior-shift history). So M11
gained the whole mechanic (record action, rubric criterion, UI, review rendering), not just a
fourth option.

```text
REFERENCE COMPONENTS FROM MODULE 1
  Guided-step pattern with decreasing support and verify-from-evidence checks; case-record style
  reasoning capture; Prove It = no guidance, durable instructor review, competency partial credit.
REUSABLE COMPONENTS
  M03 console guide (M03E_GUIDE_STEPS + guidedLabGuide), m03eState/createStateAdapter, alert drawer
  (SocAlertQueueUi.renderDetail); M11 append-only SocM11AssessmentState, SocM11AssessmentRubric,
  SocAssessmentScorer.scoreCriteria (awards/deductions), adminAttemptReviewCard rubric + student-work panels.
TARGET MODULE DIFFERENCES
  M03 practice is a SIEM alert queue (alerts carry rule + query); M11 is a SOC operations queue whose
  "evidence" is metadata plus platform telemetry (SourceHealth, ShiftLog), so the incomplete-evidence
  signal is the endpoint sensor collector lag (10:00-10:30), not an AppAudit gap.
ASSESSMENT COMPETENCIES
  New M11 criterion `alert-disposition` (8 pts): supported call per decidable alert (1 pt each for
  Q-02/03/04/08/09) and a supported needs_investigation on Q-13 (3 pts) that names the missing evidence.
PARTIAL-CREDIT MODEL
  Correct call = full item credit. needs_investigation on Q-13 without naming missing evidence = 1 of 3.
  needs_investigation on a decidable item = 0, never penalised. Explicit wrong verdict = 0 plus a
  deduction (1 point; 2 on Q-13, whose evidence was incomplete), floored at 0 for the criterion.
  Dispositions on non-expected items are ignored. Last recorded call per item wins (order-independent).
INSTRUCTOR-REVIEW REQUIREMENTS
  Review card shows "Alert disposition - Q-13: Needs investigation - <full reasoning>" per action,
  the new rubric row with earned/available, awards, deductions and misses; v1 attempts render as before.
FILES TO MODIFY
  portal/soc-analyst-module-03-environment.js/.css, soc-analyst-module-03.js (Learn It),
  portal/soc-analyst-module-11.js, soc-m11-assessment-{data,state,rubric,scorer}.js, portal/app.js,
  tests/soc-m11-assessment-{metrics,scorer}.test.js, tests/soc-telemetry-sprint{5,7-m11}.test.js
FILES TO CREATE
  tests/m03-alert-dispositions.test.js, tests/soc-m11-alert-dispositions.test.js
```

**Shipped**

- M03 Practice It: ALT-3103 (collector heartbeat) stays; new ALT-3104 (c.ortega 120-record search at
  09:23:40, inside the billing-app delay window 09:23:08-09:23:50 now stated on S-4002) and ALT-3105
  (svc-billing "interactive sign-in" whose raw record is a service credential in JOB-22). Four new guide
  steps before `handoff`: `disp-tp` (ALT-3101), `disp-benign` (ALT-3102, ALT-3103), `disp-false`
  (ALT-3105), `disp-ni` (ALT-3104). "Your disposition" panel in the practice alert drawer: four values,
  reasoning, instant feedback, wrong call auto-reveals the next of three hints, Hint button. NI must
  name what is missing. ALT-3101 flow, query and guide steps untouched. Learn It teaches the fourth verdict.
- M11 Prove It: Q-13 (R-03, ws-231, medium, SLA 30, assigned/acknowledged by an-chen after 17 min,
  created 10:12 during the endpoint collector lag; evidenceNote says the rule matched a partial
  record). Operations tab "Alert disposition" form (open items, four labelled values, reasoning, no cues;
  shows only the learner's own entries). Rubric v2 (13 criteria, still 100 points, pass 70). Instructor
  card readable. Internal form stays `true_positive` etc.; labels via `DISPOSITION_LABELS`.
- Compatibility: score and criteria are stored at submit time (`recordLabAttempt` result) and never
  recomputed, so submitted/approved attempts keep their score; `score(..., { rubricVersion: 1 })` still
  reproduces v1. Old M11 state loads (no `dispositions` key). Old M03 practice state loads; a saved guide
  position at/after the old `handoff` step shifts forward by 4 (guideVersion 3). Key-reorder tests added
  for both modules; `SocM11AssessmentState.load` no longer compares serialized JSON (was a spurious
  re-save on every jsonb round trip).

**Caveats / for owner review**

- Queue grew 12 to 13: alertVolume 13, backlog 8, SLA attainment 80.0 on the live-shift metric rows,
  an-chen open items 2, R-03 run counts. Tests anchored to 12 (sprint5, sprint7-m11, metrics workload)
  were updated deliberately. Q-13's generated rows are appended last: all 112 pre-existing operational
  EventIds are unchanged (verified against eba3646), so already-pinned evidence keeps its meaning.
- Rubric v2 rebalanced weights to make room for 8 points (queue 10 to 8, SLA 8 to 6, assignment 10 to 8,
  residual risk 10 to 8). A learner who skips dispositions now tops out at 92 and still passes. The
  M11 Guided Lab shows the same Operations form but has no disposition guide step (practice home is M03).
- Hard-coded 0927 shift metric rows were edited by hand (13 / 8 / 80.0); MTTA stays 17.3 by choosing
  the 17-minute acknowledgement.
- M12's `needs-investigation` is hyphenated, M11 internal is `needs_investigation`; both display as
  "Needs investigation". Sprint 4's traceability map should list M03 `disp-ni` + M11 `alert-disposition`.
- Not browser-tested (per brief); Sprint 4 sweep should open M03 alerts (drawer panel) and M11 Operations.
- Test status: `node --test tests/` 91 files, 87 pass, 4 fail (guided-lab-console-guide,
  soc-m04-assessment-rubric, soc-m04-assessment-scorer, soc-m05-assessment-console; all pre-existing).
  `bash bin/ci-check.sh` clean.

### Sprint 4a — capstone traceability map (all M12 mechanics), 2026-10-07

Branch `worktree-agent-aeaf2e438050eee0d`, code commit `ce7604c` (+ this log). Not pushed. Scope was the map only; Sprint 4b (merge, browser sweeps of M01 and M03–M12, `LIVE_COURSE_UAT_AND_GRADING_UX.md`, owner push) is still open.

```text
REFERENCE COMPONENTS FROM MODULE 1
  Case-record ticket model (shared caseRecordPane), guided-lab step cards, Prove It stored-score rubric.
REUSABLE COMPONENTS
  SocM12AssessmentRubric.extractV2 / SocM12AssessmentState.TYPES / moduleTwelveActionMissing() /
  MODULE_TWELVE_TICKET_FINDINGS as the machine-readable list of M12 mechanics; each module's guide steps and rubric ids as the homes.
TARGET MODULE DIFFERENCES
  M01/M02 have no rubric ids (score breakdown keys); M03 has M03E_RUBRIC competencies; M04-M11 have SocMnnAssessmentRubric ids.
  Only M03 guide steps have ids; every other module identifies a step by its title.
ASSESSMENT COMPETENCIES / PARTIAL-CREDIT MODEL / INSTRUCTOR-REVIEW REQUIREMENTS
  None changed: no learner-facing scoring or review code was touched.
FILES TO MODIFY
  portal/soc-analyst-module-12.js (three MODULE_TWELVE_ARC_CALLBACKS cues only), this file.
FILES TO CREATE
  portal/soc-capstone-traceability.js, tests/capstone-traceability.test.js, bin/capstone-traceability-table.js
```

What shipped

- **Map.** `SocCapstoneTraceability`: 41 entries covering all 8 rubric v2 criteria, every award / deduction / miss string in `extractV2`, all 13 `moduleTwelveActionMissing()` checks, every ticket field, every graded action type (`hypothesis` is the one ungraded type, listed as such) and the unsafe-execution deduction and the 69 cap. Entry fields: `capstone`, `practice` (guided step plus `direct`/`generic` coverage), `prove` (rubric id in the home module), `code`, and where relevant `related`, `exposedIn` and `gap`. The M12-wide fact that the console mounts `SocConsoleTools.PACKS.m04`..`m10` (`soc-m12-assessment-console.js` `mount()`) is recorded in `embeddedPacks` and in every entry's `code`.
- **Guard test.** `tests/capstone-traceability.test.js` (10 tests) derives the mechanics from the code (string literals in `extractV2`, the missing-check messages, the ticket-field list, `SocM12AssessmentState.TYPES`) and fails on: an untraced mechanic, an entry citing text that no longer exists, a guide step / rubric id / tab / file / `#fragment` that does not exist, an empty practice or prove list with no `gap`, a stale `gap`, and any difference between the actual gaps and the `KNOWN_GAPS` allowlist in the test (so a new gap fails and a closed gap must be removed from the list). Mutation-checked: a renamed guide step, a new `award(...)` in the rubric and a deleted practice list each fail it.
- **Table.** `bin/capstone-traceability-table.js` prints the markdown table now pasted above under "Traceability table", plus the "How to use" paragraph.
- **Cues.** `MODULE_TWELVE_ARC_CALLBACKS` Triage now cites M03 dispositions (incl. needs-investigation) and M11 queue triage; Enrichment cites M04 indicator verdicts; Response cites the M09 workflow designer and unsafe attempts. One line each. The Response cue deliberately does not print `preserve>approval` (the capstone is an assessment).

Coverage: 41 mechanics. 24 have at least one direct Practice step, 6 only a generic ticket-driven step (`domain-email`, `domain-endpoint`, `domain-network`, `recovery-sessions-revoked`, `report-executive`, `closure-decision`), 11 have no Practice home.

Remaining gaps (mechanic: what is missing; evidence)

| Mechanic | Missing | Evidence |
| --- | --- | --- |
| `rule-saved`, `rule-scheduled` | Practice | `moduleFourGuidedSteps()` goes lead, correlate, source/contributing, three verdict steps, decide, submit; no step opens Analytics Rules, although the pack is mounted in the M04 guided console (`SocConsoleTools.mount('m04-guided'...)`). Prove exists (M04 `query-rule-quality`, `scheduled-execution`). |
| `attack-mapping`, `attack-unsupported-deduction` | Practice | No guided step in M06-M11 targets the `attack` tab (steps listing in each `module*GuidedSteps()`); the tab is mounted from M06 guided on. Prove exists (M06 `attack-mapping`, M10 `attack-linkage`). |
| `evidence-preserved-before-eradication` | Practice | No guided step runs the preserve action (M04 Automation `evidence_preservation`, M05 `evidence_package_preserved`); M09 "Check response outcomes" only reads preservation records. Prove exists (M05 `evidence-preservation`, M09 `evidence-and-scope`, M10 `preservation`). |
| `recovery-persistence-removed`, `recovery-restored`, `recovery-validated` | Practice | M09 guide steps stop at one approved containment action; none opens the Recovery tab. Prove exists (M09 `identity-and-persistence`, `recovery-readiness`, `recovery-monitoring`). |
| `report-lessons` | Practice | M11 guide has no lessons-learned or detection-improvement step. Prove exists (M11 `lessons-detection`). |
| `alert-incident-link`, `alert-incident-link-unrelated-deduction` | Practice and Prove | The alert-to-incident form exists only in `soc-m12-assessment-console.js` `contextualMarkup('alerts')`. M07 `incident-evidence` and M08 `incident-link` link evidence/findings to an incident through other controls, listed under `related`, not credited as homes. |

Also worth knowing when reading the table: the guided labs of M05-M08, M10 and M11 are ticket-driven (read ticket, lead, correlate, source vs contributing, scope, submit). The pack tool for each module is open but not directed, so those modules' domain mechanics are marked `generic`. M03 Prove It scores one overall verdict, not per-alert dispositions; the per-alert Prove home is M11 (Sprint 3).

Capstone bugs / risks noticed while reading (NOT fixed)

1. **Log Search queries are never recorded as `query-run`.** The only recorders are the bridge lines for the M04 pack query tester (`query_test`) and the M06 pack Hunting tab (`query_run`) (`soc-m12-tool-bridge.js` lines 63 and 101; `grep "'query-run'" portal/` finds no other writer). A learner who correlates in the M03 Log Search tab, which the M03 Practice steps and the mission cue both point at, gets "No query test recorded yet" and loses up to 9 points unless they re-run the query in Analytics Rules or Hunting. Likely the most important item for Sprint 4b's real-browser pass.
2. **`alert-disposition` action type has no recorder.** It is in `TYPES`, reduced and validated, and counted by the missing-action check, but the UI only writes `review-alert` (`recordContextual`), so it is dead code.
3. **Workflow node count mismatch (from Sprint 2, still present).** `scenario.workflowNodes` has 9 nodes, `validate('workflow-design')` accepts 2 to 8; ticking all nine errors.
4. **`SocM12AssessmentState.load` compares `JSON.stringify(loaded)` with the normalized copy** (line 127) to decide whether to re-save: after a Postgres jsonb key reorder it saves again on every load (the same pattern Sprint 3 removed from M11; harmless but wasteful).
5. **Preserving evidence on another host trips the 69 cap.** `deriveEffect` for `execute` only treats `preserve:ws-204` as in scope, any other target is `blocked`, and `unsafeExecution` is true for any blocked execution. A non-destructive preserve of a comparison host (for example via the M05 evidence package, which the bridge projects as `execute preserve <deviceId>`) fails the whole attempt. Confirm that is intended.
6. **Non-success source outcomes become blocked.** `sourceOutcome !== 'success'` forces `blocked` for `execute` too (not only `recovery`), so an approved, in-scope action whose simulated M09 effect is partial or failed would count as unsafe. Check whether the M12 M09 fixture can produce one.

Tests: `node --test tests/` 103 files, 99 pass, 4 fail (guided-lab-console-guide, soc-m04-assessment-rubric, soc-m04-assessment-scorer, soc-m05-assessment-console; all pre-existing, unchanged). New `tests/capstone-traceability.test.js` 10/10. `bash bin/ci-check.sh` passes; `node --check` clean on the three new files and `soc-analyst-module-12.js`. No servers or browsers started.

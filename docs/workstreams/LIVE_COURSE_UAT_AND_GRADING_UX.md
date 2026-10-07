# Live course UAT + faculty Grading UX

Started 2026-10-05. A learner and an instructor test account work the SOC
Analyst course side by side in one Chrome window (split view, Claude in
Chrome) against the local portal (`127.0.0.1:8768`) and the **live** Supabase
project. Goal: watch a submission arrive, get graded, and unlock the next
module, for every module through the M12 capstone. Bugs found on the way are
logged below; faculty Grading UX changes requested during the run are tracked
in their own section.

- Learner: `9334491415-SOCAN` (owner-designated test student)
- Instructor: `1989457660-SOCANINST` (owner-designated test instructor)
- Credentials are never stored in the repo; the owner signs both tabs in.
- Login state is per tab (`sessionStorage`), so both stay signed in at once.

## Progress

```
Module walkthrough  [████████████]  12 / 12 approved 2026-10-06 (learner 9334491415-SOCAN at 100%)
Grading UX          [███████████░]  11 / 14 items done
Bugs logged         27 (repo fixes landed locally; #8 verified live, #7 needs cleanup decision)
Prove It gate       built + verified M01–M06 (owner rule 2026-10-05); M07–M11 not yet browser-checked
```

### Module walkthrough

| Module | Status | Score | Notes |
| --- | --- | --- | --- |
| M01 SOC Operations Foundations | ✅ Complete (before this run) | — | Older unreviewed M01 PRACTICE IT attempt still in queue (pre-gate data) |
| M02 Network, Identity & Security | ✅ Complete (before this run) | 75% | |
| M03 SIEM & Log Analysis | ✅ Approved 2026-10-05 | 100% | Redo resubmitted, approved, M04 unlocked on reload |
| M04 Detection Rules & Threat Intel | ✅ Approved 2026-10-05 | 100% | IOC lifecycle edit, query test + save, rule (SourceIp, 5, **30-min** window — see bug 5), acct-17 exclusion, schedule, scheduled run → 1 alert, read-only enrichment + evidence preservation, acct-44 session revoke left pending approval, ticket. M05 unlocked on reload |
| M05 Endpoint & Malware | ✅ Approved + verified 2026-10-05 | 95% | Device review, evidence package (EVT-003/005/006 + payload hash), 2 analyst notes, EDR handoff, ticket → approved. After migration `20261005200000` the program page shows M05 Complete, 5 of 12 (42%), and M06 unlocked |
| M06 Threat Hunting | ✅ Approved 2026-10-06 | Guided 100% · Prove It 100% | Guided Lab passed (instant score), Prove It unlocked immediately (gate verified). Assessment Lab: hypothesis, ws-318/ws-355/ws-402 searches, pivot 003→005, saved query and run, 5-event collection, rule handoff, bounded conclusion, T1053.005 + T1059.001 supported and T1071.001 unsupported, ticket. Approved; program page shows 6 of 12 (50%) and M07 unlocked |
| M07 Network & Email | ✅ Approved 2026-10-06 | Guided 100% · Prove It 100% | Learn It deck (7 ideas) readable, no overflow; console reads PRACTICE IT; Prove It gate locked until the Guided Lab passed. Guided: message review, recipient trace, DNS/TLS/proxy correlation, HR lookalike excluded, incident, ticket → instant 100%. Prove It (QR invoice, CASE-070731): acct-63/ws-517 chain, acct-82 blocked, payroll lookalike excluded, unverified outcomes stated → 5/5 rubric, approved; program page shows 7 of 12 and M08 unlocked |
| M08 Vulnerability Prioritization | ✅ Approved 2026-10-06 | Guided 100% · Prove It 90% | Guided (new instant score): validated FINDING-001 vs 002, decision, owner routing, ticket. Prove It CASE-080842: FINDING-001 critical/p.diallo linked to INCIDENT-001 and escalated; 002 needs-validation plus approved risk exception; 003 not applicable. Rubric 90%: asset context 10/20 for not citing the compensating-control evidence (a real miss). Approved with instructor feedback, which the learner now sees; 8 of 12 and M09 unlocked |
| M09 Incident Response | ✅ Approved 2026-10-06 | Guided 100% · Prove It 100% | Guided (new instant score): triage, 7 evidence reviewed, approved isolation plus session revoke, ticket. Prove It INC-4937: critical/ir-lead-owners, all evidence reviewed, evidence preserved before eradication, 7 approved actions (disable_identity on acct-173 **failed**, recorded and escalated), restore from verified RP-WS-173-0918 then scan and validate, monitoring found credential/session still active so the incident stayed open and was escalated. 9/9 criteria; approved; 9 of 12 and M10 unlocked |
| M10 Evidence & Chain of Custody | ✅ Approved 2026-10-06 | Guided 100% · Prove It 95% | Guided (new instant score): pinned from Timeline, intake with source and method, hash verify (PRACT-03 mismatch re-acquired), legal hold on 4 originals, memory to DF custodian, ordered timeline, root cause, exfiltration unknown. Prove It: the same on ART-*, plus export package, 4 ATT&CK mappings, DF escalation. Fact/analysis 5/10 (rule needs 3+ evidence-tied facts; I recorded 1). Approved with feedback; 10 of 12 and M11 unlocked |
| M11 SOC Ops, Metrics & Reporting | ✅ Approved 2026-10-06 (after redo) | Guided 100% · Prove It 88% → redo → 96% | Guided (new instant score): queue priority, assign and escalate, metrics, noisy rule, handoff, follow-up, two reports. Prove It: 11 ops actions plus 4 reports; attempt 1 88% (closure decision not saved, handoff partial), **sent back for redo** to test the loop. Learner saw Returned plus feedback (after fixes #66–#68), recorded closure retain, resubmitted, attempt 2 96%, approved with feedback; 11 of 12 and M12 unlocked |
| M12 Capstone | ✅ Approved 2026-10-06 | 98% | INC-4821 Operation Amber Finch, worked end to end: correlated KQL (4 sources) saved as M04-RULE-0001 and scheduled hourly; AL-1201/1202 true-positive and linked, AL-1203/1205 benign (ws-118 inventory script); 5 intel verdicts; findings in all 5 domains plus 2 scope determinations (NW-504 bounded negative); 5 pins, locker intake and verify, ordered timeline; 4 ATT&CK mappings; workflow preserve>approval>isolate; approved isolate/revoke, block IOC; Run key removed; restore from pre-incident BK-204-0900 (not the later verified BK-204-0930), scan, monitoring; reports, handoff, closure retain; ticket. Rubric 7/8 full, executive 6/8 (#72). Approved with feedback. **Learner program page: 12 of 12, 100%.** Instructor dashboard still shows 11/12 (#73) |

## Grading UX (portal/app.js, index.html)

Client-only. No migration and no Supabase push needed: instructors already
read `lab_attempts` through `lab_attempts_assigned_instructor_read`.

- [x] **Graded** tab next to Grading: reviewed attempts for the course, newest first, open a row to read the submitted ticket
- [x] Both tabs grouped student → module, student groups collapsible (open by default only when one student is listed)
- [x] Round down-arrow chevron on each student group and graded row (module-card style), turns only for its own row
- [x] Plain-word labels: `Module 4 · PROVE IT`, `Module 11 · LEARN IT`, `Module 1 · PRACTICE IT` (all caps, Academy phase names)
- [x] Summary pills: one per module phase, latest score, green pass / red below 70% / grey no score, `· N tries` when resubmitted; aligned grid
- [x] "Attempt N of M" on every card and graded row
- [x] Rows written by one submit (M07 writes 3, M08 writes 2) shown and graded as one item; Approve / Send back update all of them (`.in('id', …)`), feedback attached to each
- [x] Pending attempts superseded by a later **reviewed** attempt of the same lab leave Grading and show in Graded as "Superseded · not reviewed"
- [x] Approved / sent-back card leaves Grading the moment the save succeeds, before the refresh
- [x] Filter by student ID; admin course badge count matches the filtered queue; knowledge-check rows map to their module
- [ ] "Approve all passing" per student (offered; owner to decide)
- [x] Owner rule: LEARN IT and PRACTICE IT are autograded with instant feedback — they never wait in Grading; they show in Graded as "Autograded" (green pass / amber below). Only PROVE IT gets a review card, counts as awaiting review, and drives the tab badge. Below-pass pills are amber, not red
- [ ] Help Desk (HDESK) and AI/ML (AIENG) get this same Grading/Graded UI (shared `viewAdmin` per course), but their labs show a generic `LAB` label — add each program's Prove It lab keys to `ADMIN_PROVE_IT_LAB_KEYS`
- [ ] M360 review (`portal/m360/review.html`) is a separate app with its own layout — not yet standardized with this UI

## Bugs found during the run

| # | Where | Bug | Status |
| --- | --- | --- | --- |
| 1 | `portal/app.js` program page | Modules locked by progression said the learner was not enrolled | Fixed locally: locked modules explain that the previous module must be completed |
| 2 | M03 Assessment submit message | "Module 4 stays locked until your instructor approves" — correct now; was confusing next to bug 1 | Resolved with 1 |
| 3 | `portal/soc-console-tools.js` + `soc-m04-rules-ui.js:configureSchedule` | Schedule used the real clock while the lab clock reads 2026-09-24 09:20 | Fixed in `c89cce7`: validation uses the scenario clock; audit timestamps still use real time. M04 walkthrough completed using a 30-minute schedule |
| 4 | M04 Analytics Rules | Schedule/save errors were detached from the form and failed saves reset fields | Fixed locally: inline live error appears in the rule form and failed saves keep entered values |
| 5 | `soc-m04-rule-evaluator.js` vs `soc-m04-assessment-data.js` truth | The answer key expects a 10-minute window, but it produced zero alerts | **Not fully resolved against the original expectation.** `c89cce7` changed scenario truth to require a 20-minute window; the walkthrough used 30 minutes. Revisit the rule/data alignment so the expected 10-minute rule produces alerts, or explicitly update the answer key and acceptance criteria |
| 6 | M04 rule form | Checkbox labels ran into adjacent controls and checkboxes floated | Fixed locally: checkbox labels use aligned flex layout with spacing |
| 8 | `course_module_labs` (live) vs client submit paths — **confirmed live at M05**; migration: `supabase/migrations/20261005200000_course_module_labs_prove_it_only.sql` | **Critical.** Server completion required attempts for labs the client never submits in M05/M06/M09/M10/M11 | Fixed + verified live 2026-10-05: M05 complete, M06 unlocked |
| 9 | `portal/lab-runtime.js` `loadCaseState`/`saveCaseState` | **Critical, fixed locally.** Server copy wins on every load, but the server write is debounced; a re-render in between reloaded the pre-save snapshot and saved it back, silently discarding the learner's action (M05 evidence package could never be preserved). Fix: `saveCaseState` updates the in-session copy of the server row immediately | Fixed (uncommitted) |
| 10 | M05 Endpoint evidence pickers | Run-on list of checkboxes, unreadable | Fixed: aligned time-sorted table (time · event · type · detail) + hash list with file names, both pickers, night mode |
| 11 | M05 ticket dropdowns | Options disclosed affected and benign roles | Fixed in `c89cce7`: options show entity names only; M05 tests pass |
| 12 | M05 preserve / handoff | Validation failures gave no learner feedback | Fixed locally: evidence selection requirements and handoff validation errors are shown inline |
| 13 | M05 Endpoint tab | Device profile and inventory were unstyled and caused horizontal overflow at split-view width | Fixed locally: profile grid, spaced inventory buttons, and responsive picker layout |
| 14 | Supabase `module_progress` first write | Concurrent first `case_state` writes could collide while inserting the shared module row | Fixed locally: on unique conflict, writers reload the row, merge their lab state, and retry the update |
| 15 | `portal/app.js` `moduleCard` (program page) | Bug 1 was fixed only on the module route; locked cards on the program page still said "not included in your enrollment" | Fixed in `c89cce7`: `isModuleEntitled()` splits enrolled-but-sequential ("Complete the previous module to unlock this one.") from not-enrolled copy |
| 16 | `soc-analyst-module-04/05/06.css` `.mXX-section-body h3/p` | Module body text rules overrode Learn It colours: dark navy/gray heading, eyebrow and idea titles on the navy deck (unreadable in day mode) | Fixed locally: those rules now skip `.learn-it *` |
| 17 | `learn-it-cards.css` | `.learn-it p` beat `.learn-it-label`, so the orange "LEARN IT · STEP" eyebrow rendered muted in every module | Fixed locally: `.learn-it .learn-it-label` |
| 18 | `module-labs.css` `.mquick-nav-layout` | `main` is a flex item with `min-width:auto`; the Learn It card strip widened it past the viewport (page scrolled sideways at split-view width) | Fixed locally: `.mquick-nav-layout > main { min-width: 0 }`; M01–M06 checked at 738px, no overflow |
| 19 | `lab-maximize.css` | Fixed Night/Day mode toggle covered the Minimize button in a maximized lab | Fixed locally: maximized bar reserves right padding for the toggle |
| 20 | `soc-analyst-module-04/05/06.css` `.mXX-section-body p/h3` | Same prose rule also restyled `<p>` inside the SOC console (gray 14px): console eyebrow, notes, detail labels | Fixed locally: rules also skip `.m03e-console *` |
| 21 | `soc-analyst-module-03-environment.js` console eyebrow | Every prefixed Guided Lab console (`m06-guided`, `m07-guided`, `m11-guided`…) read "MISSION NEXT ENVIRONMENT · ASSESSMENT" | Fixed locally: `practice`/`*-guided` scopes read "· PRACTICE IT" |
| 22 | `soc-analyst-module-03-environment.js` idPrefix rewrite | Prefixing rewrote `id`/`for`/`aria-labelledby` but not `href="#…"`; hunt step pills (01 Frame … 06 Close) in every prefixed Guided Lab did nothing | Fixed locally: in-page hrefs to the console's own ids are prefixed too |
| 23 | `soc-console-tools.js` + `soc-m06-assessment-state.js` | Open hunt step was parsed wrong under the prefix and dropped by the state normalizer, so every search/save snapped the workflow back to step 01 | Fixed locally: id parse handles prefix; normalizer keeps `huntWorkflowStep` |
| 24 | M06 hypothesis "Events that would test it" | Picker showed only event ID + type; nothing to choose by | Fixed locally: time · type · action · process/file/task/destination |
| 25 | M06 Save hypothesis | No confirmation after saving | Fixed locally: "Hypothesis saved. Test it next in 02 · Search." + button becomes "Update hypothesis" |
| 26 | M06 related-search results | Rows had no event ID or command/file/destination; "No matching events." shown before any search | Fixed locally: `ID · type` heading, monospace detail line, "Run a search to see matching events." empty state |
| 27 | M02 section kickers | Read "Guided Lab · console walkthrough" / "Assessment Lab · independent investigation", so lab-maximize and the Prove It gate could not find the cards | Fixed locally: "Learn It · Foundations", "Practice It · Guided Lab", "Prove It · Assessment Lab" (M02 now also gets Maximize) |
| 28 | `portal/app.js` `persistModuleCaseState` | **Critical.** When a queued server write finished, it replaced the in-session `remoteCaseState` copy with its own older snapshot; the next action loaded that and silently undid any action taken while the write was in flight (seen live: 4 quick M06 bookmarks kept only 2; reproduced with 1.5 s injected latency, where 207 reappeared after it was removed) | Fixed locally 2026-10-06: in-session lab copies win over the written snapshot. Re-verified under the same latency, then reloaded at normal speed: all 4 bookmarks persisted on the server |
| 29 | M06 collection picker (`soc-m06-assessment-related-search.js` `renderEvidencePanel`) | "Fixture events" listed only the latest search results, not bookmarks, so a learner could not curate their bookmarked evidence | Fixed locally: bookmarks always listed first, with type · device; legend "Bookmarked and latest search events" (shared with the M06 Assessment Lab, reveals nothing new) |
| 30 | M06 hero (`#m06-status`) | Guided Lab read "Not started" after real hunt work and never refreshed after submit | Fixed locally: hunt actions count as progress; status refreshes on every Guided Lab render. Verified "Complete" after reload |
| 31 | M06 saved-query run | After running a saved query for ws-537, the Entity value field reset to ws-421, so the form no longer matched the results | Open (minor) |
| 32 | Shared ITSM ticket | Route to Department appears only after Update Ticket, not when Escalation = Required; the requirements checklist also refreshes only on Update | Open (minor) |
| 33 | M06 Escalate (05) + ATT&CK evidence pickers | List all ~61 raw events under the developer word "fixture", not the analyst's bookmarks; Escalate duplicates the handoff the ITSM ticket already carries | Open: part of the Assessment-realism decision below |
| 34 | M06 Guided Lab after submit | "Restart Guided Lab" renders as unstyled text | Open (minor) |
| 35 | M06 related search pivots (`renderSearch`) | "Pivot to M06-EVT-005" saved the pivot but nothing changed on screen; the target event never appeared, so it could not be bookmarked | Fixed locally: pivot targets render next to the results they came from, in time order |
| 36 | M06 `validateMapping` (Prove It) | **Answer leak.** Saving a mapping was rejected unless every cited event was in the answer key, so the form revealed the "right" evidence and techniques before submission (`LAB_ASSESSMENT_STANDARD`: no pre-submission answer feedback) | Fixed locally: saving checks structure only (real case events); the scorer and rubric judge correctness. Test updated to assert the standard-compliant behavior |
| 37 | Graded ticket rosters in M03 Prove It, M04, M06 (both cases), M08 and M12 | **Answer leak** (same class as #11): entity dropdowns named roles ("UpdateHealth task account", "comparison host, signed maintenance script", "attacker session", "unresolved source"); M06 decoys were uppercase `WS-` while real hosts were lowercase | Fixed locally: entity names only; decoys lowercased |
| 38 | `app.js` `adminAttemptReviewCard` | Rubric-based modules (M06+) return the breakdown as a criterion list; the instructor saw it only inside "Full raw result (for debugging)" JSON | Fixed locally: "System rubric" panel lists each criterion with points, misses and evidence. Verified on the M06 attempt |
| 39 | M06 Prove It content | (a) The scope finding's correct option reads like the answer, and the other two are throwaways ("Every host… compromised", "No scope because no alert fired"); the same applies to evidence priority and response action. (b) Disposition points only for "Confirmed malicious activity", while the truth says the evidence "does not alone prove maliciousness" | **Owner content decision.** Not changed |
| 40 | Instructor Lab Attempts | Guided Lab practice scores (M02+) are not recorded as attempts, so instructors can't see practice results (M01 Practice It is). The student filter clears after Approve | Open (minor) |
| 5b | `tests/soc-m04-assessment-rubric/scorer.test.js` | Both fail on clean `HEAD` (`c89cce7`): test fixtures still use the 10-minute window that bug 5's truth change made non-compliant. CI will fail | Open: fix together with bug 5 before the next push |
| 41 | M07 Email workspace (`soc-m07-assessment-email-ui.js`, shared by Guided and Prove It) | The incident form was unstyled (a run-on wall of evidence checkboxes), and the order was backwards: Create incident came before the messages and delivery trace, with the messages at the very bottom | Fixed locally: order is message → delivery trace → evidence tray → incident record; incident form styled (two-column grid, scrollable evidence list) |
| 42 | All module heroes ("Guided Lab" status) | Same as #30 in M07 and other modules: rendered once at page load and never refreshed | Fixed locally, centrally: `prove-it-gate.js` keeps the hero's Guided Lab status in step with the completion the gate reads |
| 43 | Restart Guided Lab (all modules) | Rendered as plain unstyled text outside the ticket actions | Fixed locally: button styling for every module's restart control |
| 44 | M07 content | The Prove It section is titled "Independent tunnel and HTTP log analysis review" (kicker "Assessment Labs"), but the case is the QR invoice delivery chain | Open: **owner content fix** (title) |
| 45 | M07 incident form | Saving an incident gives no confirmation (`[data-m07-incident-status]` stays empty) | Open (minor) |
| 46 | Instructor review card | "Approve" is a pale button while "Send back for redo" is dark and prominent | Open (minor UX) |
| 47 | M08 Guided Exposure workspace | Headed "Independent assessment workspace" inside the Guided Lab | Fixed locally: neutral "Vulnerability management workspace" |
| 48 | M08–M11 Guided render | Every render forced the console onto the guide step's tab, so selecting a finding threw the learner onto the ITSM Ticket tab | Fixed locally: the guide moves the tab only when its step changes |
| 49 | `SocConsoleTools.mount().wire` | **Critical.** Modules that re-render inside a persistent root (M08 Guided; also M09/M10 call patterns) re-wired pack listeners on every render, so one click saved the same action N times (one submit made 32 remediation decisions) | Fixed locally, centrally: `wire()` skips an element it already wired. Verified: one submit = one action after repeated renders |
| 50 | ~~M08 rubric asset-context~~ | Retracted: the criterion does depend on the learner's cited evidence (I scored 10/20 for omitting ASSET-EVID-004) | No issue |
| 51 | Learner feedback on approval (`app.js` fetchUserDetails + `case-record.js`) | Notes an instructor left while **approving** were saved (`lab_attempt_feedback`) but only redo feedback was ever loaded, so the learner never saw them | Fixed locally: approved attempts' feedback loads, and the shared "Lab graded" panel shows it for the module. Verified on M08 |
| 52 | Graded ticket decoys | M04 and M08 decoy devices were uppercase while the real hosts were lowercase (a tell) | Fixed locally |
| 53 | Instructor review | The element finder matched another student's hidden Approve button (4437023872 M08). Not user-visible, but hidden review cards for other students stay in the DOM | Noted (no change) |
| 54 | M09 Incident/Response/Recovery workspaces (`PACKS.m09`, reused by M10–M12) | Essentially unstyled: inline run-together selects and a raw checkbox evidence list | Fixed locally: styled forms, evidence rows, approval gate, night mode (`module-labs.css`) |
| 55 | M09 approval gate (realism) | The learner both requests and approves their own containment; on the job an incident lead or asset owner approves | Open: **owner realism decision** (simulate the approver) |
| 56 | M09 approval form | The approver had to match a hidden `ir-(lead\|analyst)-…` pattern; any normal name gave "M09 assessment approval actor is invalid" and the learner was stuck | Fixed locally: "Approver ID" label, example, input pattern, and an instructive error. M09 test updated |
| 57 | M09/M10/M11 Guided ITSM ticket | **Critical.** Field handlers matched `#mXX-guided-case-form`, but the prefixed console renames it `guided-mXX-mXX-guided-case-form`, so no ticket field ever saved and the Guided Lab could not be completed | Fixed locally: prefix-safe `[id$=…]` selectors (M08–M11). Verified on M09 |
| 58 | M09 recovery monitoring (realism) | "Monitoring" is checkboxes where the learner declares observed residual risk; no post-recovery telemetry is shown to observe | Open: **owner realism decision** |
| 59 | M10 Evidence Locker / Reconstruction forms (`PACKS.m10`) | Custody transfer, legal hold and notes forms unstyled (run-on checkboxes, barely visible inputs) | Fixed locally: the M09 workspace styles extended to `.m10-console-extra`, plus intake grid |
| 60 | Rubric miss text (M10 fact/analysis and others) | A miss reads "Separate observed fact from analysis: not yet evidenced" and doesn't say the rule (3+ evidence-tied facts plus 1 analysis), so neither the instructor nor the learner knows what was missing | Open: make miss text state the requirement |
| 61 | M10 Guided Evidence tab copy | Says pinned records "are submitted with your assessment" inside the Guided Lab | Open (minor copy) |
| 62 | M11 section titles | "Learn It", "Guided Lab", "Assessment Lab" instead of descriptive case titles like every other module | Open (owner content) |
| 63 | M11/M12 Operations and Reporting (`.m03-console-extra`) | No CSS at all: seven forms ran together inline, buttons looked like plain words, textareas were tiny | Fixed locally: shared workspace styles extended, plus base styles for `.m03-console-extra` |
| 64 | M11 queue priority and closure evidence (realism/UX) | Priority order and closure "recovery evidence" are typed as comma-separated IDs; a real queue tool sorts and picks. Easy to get wrong silently | Open: consider sortable list and checkboxes |
| 65 | M11 Prove It copy | Status says scoring "occurs when the ticket is submitted", but M11 has no ticket; the ITSM tab only points to "Submit shift assessment" | Open (copy) |
| 66 | Instructor review of M11 | **The instructor saw only "88%"**: M11 stores `criteria` and `action_history`, which the card didn't render, so there was nothing to review | Fixed locally: the rubric panel reads `criteria`; a new "Student work" panel lists every recorded action readably |
| 67 | M11 redo | After a redo request the learner page still said "Assessment Lab = Complete", showed no feedback, and `moduleElevenFinalizeCase` refused to resubmit | Fixed locally: panel shows Returned plus instructor feedback and a "Resubmit" button; finalize allows resubmission on redo; hero shows Returned / In review. Verified: attempt 2 recorded and approved |
| 68 | M11 resubmit render | After resubmitting, the panel kept showing "Returned" until reload (redo flag cleared only after the async save) | Fixed locally: cleared before render, restored if the save fails |
| 69 | Rule schedule (`soc-console-tools.js`, `soc-m04-rules-ui.js`; M04 and every module carrying the rule tools) | "Next scheduled time" is `datetime-local` and was parsed as **browser-local** time while the lab clock and stored value are UTC. East of UTC, a valid time was rejected ("Scheduled time must be from now through 90 days ahead"), the same symptom as bug 3 | Fixed locally: parsed as UTC; label says "(UTC)". Verified in M12 |
| 70 | M12 Log Search contextual finding form | Selecting a search result updated the selection, but the finding form kept the **previous** record, so a learner would record analysis against the wrong evidence (partial re-render keeps the editor and skipped the panel) | Fixed locally: panel wrapped and refreshed via a once-installed `M03E_AFTER_RENDER.m12`. Verified on EP-301/ID-402 |
| 71 | M12 executive report rubric (content) | Grading requires the executive narrative to name evidence IDs or entities, while the v1 rule forbids IPs, technique IDs and hashes in it; attached evidence alone doesn't count | Open: **owner content decision** |
| 72 | M12 ticket "Executive summary" field | Writing the ticket field silently **replaces** the Reporting-tab executive report, including its attached evidence, so the learner writes it twice and the graded copy loses its evidence | Open: one source of truth for the executive summary |
| 73 | Instructor dashboard technical count (`admin_program_progress` view counts `module_progress.state='complete'`) | Shows 9334491415 at **11/12, Active** while server-verified progress is 12/12: soc-05's `module_progress` row is still `in_progress` (left from bug 8, completion verified via `course_module_labs`, row never updated) | Open: **owner decision**: count verified progress in the view, or backfill/reconcile stale rows (DB write) |
| 74 | Instructor dashboard "Coursework 0 / 18" | Every student shows 0/18 work items, including a 12/12 technical completion | Open: investigate `work_items_completed` |
| 75 | Instructor rubric panel (M12) | M12 criteria use `score`/`evidence` (not `points`/`supportingEvidence`); the new panel showed 0/N on every line next to a 98% total | Fixed locally: both shapes supported. Note: M12 evidence lists internal action IDs, not readable records (UX) |
| 76 | Tests | `soc-m06-cumulative-console-integration` scanned for the old `#mXX-guided-case-form` selector | Updated for the prefix-safe selector (#57). Remaining failures all pre-exist on `HEAD` `c89cce7`: guided-lab-console-guide (M12 feedback fn), M04 rubric/scorer (bug 5), M05 console |
| 7 | Pre-gate data | Accounts like `4437023872-SOCAN` hold up to 12 pending items written before the approval gate | Awaiting owner cleanup decision; no account data was changed |

## Prove It gate (owner rule, 2026-10-05)

A learner must submit the module's Guided Lab before the Prove It /
Assessment Lab opens. Client-side, platform-owned, no migration:

- `portal/prove-it-gate.js` + `prove-it-gate.css` (loaded after
  `lab-maximize.js`). Finds Prove It cards the same way lab-maximize does
  (`Prove It` kicker + `<h2>`), hides the card body behind a lock notice with a
  **Go to Guided Lab** button, hides Maximize. Re-checks on every DOM mutation,
  so submitting the Guided Lab unlocks the card without a reload.
- `module-registry.js`: `registerModuleLab({ sections })` (zero-arg getter)
  plus `activeModuleRenderContext()`; M01–M11 registrations now pass their
  existing `…GetSections` function. M12 (capstone, no Guided Lab) is skipped.
- Scope: `soc-analyst` only. Never locks an approved module, a Prove It in
  review/returned, or any module with a recorded Prove It attempt
  (`latestLabAttemptByKey` ∩ `ADMIN_PROVE_IT_LAB_KEYS`), so existing learners
  keep access to work they already submitted.
- Verified in Chrome: M06 locked (Guided Lab not submitted), M01–M05 unlocked
  (attempts exist), banner button opens + scrolls to the Guided Lab, no
  console errors. **Not yet verified:** the unlock-on-submit moment (finish the
  M06 Guided Lab), M07–M11 card structure (locked for the test learner), and
  a fresh learner on M01/M02. Not enforced server-side.

## Owner rules (2026-10-06) — read before touching any lab

- **Resolving the incident is the assessment** in every module. The graded,
  instructor-reviewed submit is the Assessment Lab (Prove It) ITSM ticket.
- **Keep the Prove It gate.** Learners must pass the Guided Lab first ("they
  need the practice to successfully complete the lab").
- **Guided Lab submit shows a visible, instant pass/fail score.** Shared
  helper: `case-record.js` `practiceResult(items)` / `practiceResultHtml()`,
  pass at `PRACTICE_PASS_PERCENT` (70). A module opts in with
  `practiceSubmitted: true, practiceScored: true, practiceResult` on its
  `caseRecordPane` spec. Only a passing score sets `caseRecord.submitted`, so
  the gate waits for real practice. Score items are job competencies, never
  console busywork (saved queries, collections and escalate forms are not scored).
  **Wired: M06 only.** Wire each module as the walkthrough reaches it, then
  backfill M02–M05. Modules with `practiceSubmitted` but no score now say
  "Submit Lab completes this Guided Lab" instead of "faculty review".
- **Keep realism: passing should feel like the job.** Don't add steps the
  job doesn't have.
- **Method:** work each module in order (Guided Lab, then Assessment Lab), act
  as the instructor and approve, and debug the whole flow live.

**Open decision (asked 2026-10-06):** the M06 Assessment Lab shows the same
numbered 01→06 hunt wizard as the Guided Lab. No SIEM works that way, and
`LAB_ASSESSMENT_STANDARD.md` bans procedural guidance and forced click paths in
Prove It. Proposal: keep the numbered steps in the Guided Lab and present the
Assessment Lab like Sentinel Hunting (Queries · Bookmarks · Hunt record, any
order). Awaiting the owner's go-ahead.

## Next session — exact continuation

**Walkthrough finished 2026-10-06:** learner `9334491415-SOCAN` completed all 12
modules (100%), each Prove It approved by `1989457660-SOCANINST`; M11 also
exercised the full redo loop. All fixes from this run are **local and
uncommitted** (see Sync status).

1. **Before committing:** run `bin/ci-check.sh` (passes) and the unit tests.
   Remaining unit-test failures all exist on `HEAD` `c89cce7` and must be fixed
   before the next push: `soc-m04-assessment-rubric`/`-scorer` (bug 5 window),
   `soc-m05-assessment-console` (empty-evidence path), `guided-lab-console-guide`
   (M12 student feedback function from the separate capstone work). Then push
   per the SOC rule (direct to master).
2. **Owner decisions waiting** (rows marked "owner"): M06 Assessment
   free-form layout; #39 (M06 content); #44/#62 (titles); #55/#58/#64
   (realism); #71/#72 (M12 executive summary); #73 (dashboard counts raw
   `module_progress`, soc-05 row stale); #7 (pre-gate data).
3. **Smaller open fixes:** #31, #32, #45, #46, #60 (rubric miss text should
   state the rule), #61, #65, #74.
4. **Backlog after this:** automated analysis of student writing (section above).
5. Practice-score coverage: M06–M11 wired; **M02–M05 still need**
   `practiceScored` items (their Guided Labs were completed before this run).

## Sync status

- The implementation and UAT handoff updates through bug 27 were committed and
  pushed to `origin/master` as `c89cce7` (`Fix guided labs and assessment
  progression`).
- `supabase/migrations/20261005200000_course_module_labs_prove_it_only.sql`
  is included in that commit. It aligns required completion labs with actual
  client submit paths and was reported applied live during the M05 walkthrough.
- 2026-10-06 run: many local changes across `portal/` (app.js, case-record.js, module-labs.css, prove-it-gate.js, soc-console-tools.js, M06–M12 modules and their assessment UIs) plus test updates. **Not committed.** Plus the earlier unrelated M12 change to `tests/guided-lab-console-guide.test.js`.
- `master` fast-forwarded to `origin/master` `1f703a4` at the start of the run; the duplicate local copy of that security work is kept in `git stash` (`backup: local copy of security work identical to origin…`).
- Bug 7 still needs an owner decision about old pre-gate pending attempts. No
  account data was changed for that issue.

## Backlog — after every module and lab has been walked (owner request 2026-10-06)

**Automated analysis of what the student typed.** Today the free text (work
notes, hunt conclusions, ATT&CK rationale, handoff text) is either
length-checked or left to the instructor. Explore how to analyze it
automatically. Do not start until the M01–M12 walkthrough is finished.

Starting points, not decisions:
- **Deterministic checks first:** does the note name the confirmed entities
  (for M06: both devices and accounts, T1059.001), state an evidence limit
  (for example "connection only, not payload"), and give a next action and an
  owner? These are cheap, explainable, and can be authored per module from the
  existing fixture truth.
- **AI-assisted rubric scoring**, run server-side (Supabase edge function) and
  shown to the **instructor** as a recommendation with quoted evidence.
  `LAB_ASSESSMENT_STANDARD.md`: an automated score never replaces
  instructor review.
- **Decisions the owner needs to make first:** whether student writing may be
  sent to an external AI service (privacy and FERPA posture, which data
  leaves Supabase), and whether Practice It could use the same checks for
  instant feedback on writing.

## Infra notes

- Worktree is shared with Codex sessions. Check `git status` before starting
  another run so unrelated M12 capstone work stays separate.

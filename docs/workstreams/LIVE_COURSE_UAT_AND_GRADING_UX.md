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
Module walkthrough  [█████░░░░░░░]  5 / 12 verified; M06 in progress
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
| M06 Threat Hunting | 🔄 In progress | | Learn It deck complete. Guided Lab: hypothesis saved (step 01), two searches run (step 02). **Resume at step 02:** bookmark recurring evidence on ≥2 devices (ws-421 + ws-537 rows), then 03–06, ATT&CK mapping, ITSM ticket + work notes, submit. Prove It card is gate-locked until then |
| M07 Network & Email | ⬜ Locked | | |
| M08 Vulnerability Prioritization | ⬜ Locked | | |
| M09 Incident Response | ⬜ Locked | | |
| M10 Evidence & Chain of Custody | ⬜ Locked | | |
| M11 SOC Ops, Metrics & Reporting | ⬜ Locked | | |
| M12 Capstone | ⬜ Locked | | Original goal: watch capstone attempt behavior |

## Grading UX (portal/app.js, index.html — uncommitted)

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
| 3 | `portal/soc-console-tools.js` + `soc-m04-rules-ui.js:configureSchedule` | Schedule used the real clock while the lab clock reads 2026-09-24 09:20 | Fixed locally: validation uses the scenario clock; audit timestamps still use real time |
| 4 | M04 Analytics Rules | Schedule/save errors were detached from the form and failed saves reset fields | Fixed locally: inline live error appears in the rule form and failed saves keep entered values |
| 5 | `soc-m04-rule-evaluator.js` vs `soc-m04-assessment-data.js` truth | A 10-minute window missed the spray before scenario end | Fixed locally: truth now requires a 20-minute window, which contains the scenario events |
| 6 | M04 rule form | Checkbox labels ran into adjacent controls and checkboxes floated | Fixed locally: checkbox labels use aligned flex layout with spacing |
| 8 | `course_module_labs` (live) vs client submit paths — **confirmed live at M05**; migration: `supabase/migrations/20261005200000_course_module_labs_prove_it_only.sql` | **Critical.** Server completion required attempts for labs the client never submits in M05/M06/M09/M10/M11 | Fixed + verified live 2026-10-05: M05 complete, M06 unlocked |
| 9 | `portal/lab-runtime.js` `loadCaseState`/`saveCaseState` | **Critical, fixed locally.** Server copy wins on every load, but the server write is debounced; a re-render in between reloaded the pre-save snapshot and saved it back, silently discarding the learner's action (M05 evidence package could never be preserved). Fix: `saveCaseState` updates the in-session copy of the server row immediately | Fixed (uncommitted) |
| 10 | M05 Endpoint evidence pickers | Run-on list of checkboxes, unreadable | Fixed: aligned time-sorted table (time · event · type · detail) + hash list with file names, both pickers, night mode |
| 11 | M05 ticket dropdowns | Options disclosed affected and benign roles | Fixed locally: options show entity names only |
| 12 | M05 preserve / handoff | Validation failures gave no learner feedback | Fixed locally: evidence selection requirements and handoff validation errors are shown inline |
| 13 | M05 Endpoint tab | Device profile and inventory were unstyled and caused horizontal overflow at split-view width | Fixed locally: profile grid, spaced inventory buttons, and responsive picker layout |
| 14 | Supabase `module_progress` first write | Concurrent first `case_state` writes could collide while inserting the shared module row | Fixed locally: on unique conflict, writers reload the row, merge their lab state, and retry the update |
| 15 | `portal/app.js` `moduleCard` (program page) | Bug 1 was fixed only on the module route; locked cards on the program page still said "not included in your enrollment" | Fixed locally: `isModuleEntitled()` splits enrolled-but-sequential ("Complete the previous module to unlock this one.") from not-enrolled copy |
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

## Next session — exact continuation

Two tabs in the Claude in Chrome group, local portal `127.0.0.1:8768`:
learner `9334491415-SOCAN` on M06 (Guided Lab maximized, hunt step 02) and
instructor `1989457660-SOCANINST` on `#/admin/track/SOCAN`. If the extension
loses the tab group, the owner must re-sign both tabs in (sessionStorage).

1. Finish the M06 Guided Lab as the learner: bookmark recurring evidence on
   ws-421 and ws-537, steps 03–06, ATT&CK mapping, ITSM ticket fields + work
   notes, Submit. **Confirm the Prove It card unlocks immediately** (gate).
2. Work the M06 Assessment Lab (dormant task backdoor), submit, watch it land
   in the instructor tab's Lab Attempts, approve, reload learner, confirm M06
   complete and M07 unlocks.
3. Repeat for M07 → M12. At each newly unlocked module also check: Learn It
   contrast/overflow (bugs 16–18), Guided Lab console eyebrow/step links
   (21–23), and that the Prove It gate locks until the Guided Lab is submitted.
4. Follow-ups noticed, not fixed: floating "Go to ITSM Ticket" button overlaps
   console content at split-view width; search "Entity value" stays enabled
   when Entity = All; search result columns get narrow at ~740px (consider
   stacking); Guided Lab ticket copy says "ready for faculty review" though
   Practice It is autograded; minimizing the console guide jumps scroll.
5. `tests/guided-lab-console-guide.test.js` fails on "M12 student feedback
   function exists" — from the in-progress M12 capstone work, not this run.
   `bin/ci-check.sh` passed mid-run; rerun before committing.

## Owner actions

1. Commit `20261005120000_instructor_approval_gate_and_write_lockdown.sql` (applied live, untracked).

## Infra notes

- `20261005120000_instructor_approval_gate_and_write_lockdown.sql` is **applied** on the linked project (`supabase migration list --linked`) but the file is **untracked** in git — commit it.
- Worktree is shared with Codex sessions; nothing from this run is committed.

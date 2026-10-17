# UAT 2026-10-17 — per-section teacher notes + student marked lab

Live progress log, updated as the UAT runs. Branch `feat/per-section-teacher-notes`
(worktree `/home/alex/mnt-section-notes`), served by `bin/dev.sh start --production`
on the owner's instruction (staging has no admin/instructor panel).

## START HERE (next session) — state at end of 2026-10-17

**Where the code is**

| Place | What | State |
|---|---|---|
| Branch `feat/per-section-teacher-notes` (worktree `/home/alex/mnt-section-notes`) | **Everything** from this UAT: per-section teacher notes, student marked lab, F2–F14 fixes, U4–U14, both migrations, 3 handoff docs | Committed locally on top of `master` `3934cfb`; **not pushed, no PR**. `bin/ci-check.sh` green at commit time. |
| Remote branch `main` @ `fd31a6b` (worktree `/home/alex/mnt-section-notes-main`) | A Codex snapshot of an earlier state of the same work (pushed to a new `main` branch by mistake; this repo deploys from `master`) | **Superseded** by the feature branch. It is missing F14 (migration `20261017130000` + BUG doc), F12 blank-note filter, F13, U13, U14 and the `?v=` bump. Do not merge or deploy `main`. Owner decides whether to delete it (`git push origin --delete main`, then `git worktree remove ../mnt-section-notes-main`). |
| `master` / production portal | Unchanged at `3934cfb` | Nothing from this UAT is deployed. |

**Database (owner runs all remote Supabase commands)**

| Migration | Local | Staging | Production |
|---|---|---|---|
| `20261017120000_below_pass_prove_it_review.sql` (F10) | ✅ | ✅ pushed by owner | ✅ pushed by owner |
| `20261017130000_module_one_completion_case_console.sql` (F14) | ✅ verified (7 cases, BUG doc) | ✅ pushed by owner | ✅ pushed by owner; unlock verified live |

Push order: staging dry-run, staging push, link production, dry-run, push, relink staging
(the worktree's `supabase/.temp/project-ref` must end on staging `xbblgtrfwgeiyttdlbue`).
The view is evaluated live, so the UAT student unlocks Module 2 as soon as F14 is on production.
Until the frontend is deployed, the migration is harmless for old clients: it only changes which
rows count as Module 1 complete.

**Next steps, in order**

1. Owner: push F14 (above). Then, signed in as `7634107909-SOCAN` on `http://127.0.0.1:8768`
   (`bin/dev.sh start --production` from this worktree), confirm Module 1 shows complete and
   Module 2 is unlocked. Record as plan step 7 ✅.
2. Owner: say whether to push `feat/per-section-teacher-notes` and open a PR to `master`
   (review, then merge = deploy via `.github/workflows/pages.yml`).
3. Plan step 8: Help Desk submit → review → marked lab (needs a synthetic Help Desk student +
   instructor, signed in by the owner).
4. Follow-up in `BUG_2026-10-17_PROVE_IT_BELOW_PASS_SILENTLY_DROPPED.md` § Follow-up: M02–M12
   and AI/ML Prove It submits still keep their local "submitted" latch when the save fails (the
   central save + banner already protect the data; this is the per-module rollback/unstick that
   M01 has). One shared helper, not twelve copies.
5. Owner decisions waiting: U7 (quiz distractors), U9 (guide covers "Open the alert"),
   U11 (Add user fills the answer), U2/U3/U10/U12 (layout).

**Do not**: deploy or merge `main`; relax `lab_attempts_complete_needs_passing_score`; let
below-pass work unlock a module; type passwords into sign-in forms (the owner signs the tabs in;
login is per tab, `sessionStorage`).

Accounts (synthetic, owner-provided, signed in by the owner):

- Student `7634107909-SOCAN` on `http://127.0.0.1:8768` (the owner signed in with this synthetic account, not 9334491415)
- Instructor `1989457660-SOCANINST` on `http://localhost:8768`

## Plan

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Student: find current progress, open next SOC Prove It | ✅ | Student at M01 In Progress, 0/12. Module page opens on a clear first step (orange LEARN IT →). |
| 2 | Student: half-finish the lab, sign out, clear cache, new tab, sign in: progress persists? | ✅ | 2a ✅ Learn It at 5/10 → `localStorage.clear()` + Cache Storage cleared + reload → back at step 5 of 10 (server-side). 2a′ ✅ 9/9 lessons survive `localStorage.clear()` + reload. 2a″ ✅ Guided ticket (alert opened, 9/9 rows, status/severity/user, 471-char note) survives reload. 2b: ticket half-done (not submitted) → added text → Sign Out → localStorage, sessionStorage, Cache Storage cleared → tab closed → new tab → owner signs in → ✅ everything back from the server: 9/9 lessons, alert opened, 9/9 rows, all ticket fields, WKS-14, the 491-char note including the last sentence typed just before Sign Out. |
| 3 | Student: finish and submit the SOC Prove It | ✅ | Guided Lab submitted → Prove It unlocked → attempt 1 submitted 11:55 UTC with deliberate mistakes (Status Resolved, Severity Low, device FS-02, route IAM, thin note with typos). Card: "Submitted for faculty review". |
| 4 | Instructor: open Lab Attempts, check the sheet + per-section notes | ✅ | After the migration the 68% attempt is in the queue (badge 11 → 12) as "Module 1 · PROVE IT Under review · 68%". Sheet: "Recommend RETURN — 1 section needs work (Severity)", notes prefilled beside the 5 red/amber sections in short bullet style, passing sections empty, Approve reads "below pass mark: module stays locked". Earlier: Per-section note boxes verified on existing attempts (13 sections, overall note, no add-item pile). Decided attempt with pre-change notes (9334491415 M08) shows them under "Teacher notes sent to the student", readable. The UAT student's attempt is missing from the queue: see F10. |
| 5 | Instructor: write per-section notes, Return for remediation | ✅ | Rewrote the Severity note in the teacher's own words, added praise on a passing section (Disposition), wrote an overall note, Return. The decided sheet shows each sent note beside its section and the overall note at the bottom. |
| 6 | Student: module card → "See your marked lab"; notes beside sections | ✅ | Card: "Redo Requested … Your instructor left 7 notes. See your marked lab". Marked lab: Result Returned for revision, Score 68% (pass mark 70%), overall note on top, 9 parts each with Pass / Partly there / Needs work / Worth another look and the instructor's note beside it; score breakdown; **no answer key, checks, guidance or JSON**. |
| 7 | Student: resubmit; instructor approves; next module unlocks | 🟡 | Student followed the notes (In Progress, High, LAP-442, Tier 2 SOC, full work note) → attempt 2 saved `complete` 100% (attempt 1 kept as returned history) → instructor sheet "Recommend PASS", no prefilled notes, overall note, Approve → chip "Passed · 100%". **Module 2 did NOT unlock**: see F14. |
| 8 | Help Desk lab: same submit → review → marked lab | ⏳ | |

## Post-migration UAT continuation (2026-10-17)

| Check | Status | Notes |
|---|---|---|
| Migration state | ✅ | Staging and production migration histories both contain `20261017120000`. Production was applied in the owner's preceding terminal session; this session verified remote history read-only. |
| Correct UAT identities | ✅ | Student pane shows `7634107909-SOCAN`; instructor pane is an authenticated SOC administration session. Both are the synthetic accounts named above. |
| Instructor queue baseline | ✅ | After resubmitting from the active `8768` portal, the instructor Lab Attempts tab shows `7634107909-SOCAN` with **1 under review · 0 graded**, and the M01 attempt pill reads **Under review · 68%**. The unrelated historical M09 sheet (`8987495051-SOCAN`, 91%) was not modified. |
| Browser target | ✅ | The stale student tab had been at `localhost:8769`, which is not listening. `bin/dev.sh status` reports the current production-backed portal at `8768`; the student was moved to `8768` before submitting. Initial clicks before correcting the window offset did not submit or grade work. |
| Post-migration below-pass resubmit | ✅ | In production-backed local portal, synthetic student `7634107909-SOCAN` resubmitted the retained M01 ticket. UI showed “Submitted for faculty review”; refreshed instructor queue confirms the saved 68% row is present. This verifies the migration plus centralized `recordLabAttempt()` path end to end. |
| Instructor review / return | ✅ | Instructor returned the 68% attempt with per-section notes + praise + overall note; student saw them in the marked lab, resubmitted at 100%, instructor approved ("Recommend PASS"). |
| Module 2 unlock | ✅ | Owner pushed `20261017130000` (staging + production). Student program page: Module 1 **Complete**, "1 of 12 modules", Module 2 **Not Started** (unlocked). |
| Module 2 as student | ✅ | Learn It (15 ideas, after F15 fix) → Guided Lab console guide (6 steps) → Assessment ticket: 8 fields + 387-char note with two typos; **Update Ticket + reload: everything persisted**; Submit → "Submitted for faculty review", no failure banner; DB row `complete`, 70, full `case_record`. |
| Module 2 instructor review | ✅ (decision left to owner) | Queue shows "Under review · 70%". Sheet: Recommend PASS with corrections (1 section). Sections 1–5, 7, 8 ✓; 6 Escalation & route ✗ (HR / Data Privacy). Prefilled: route correction + spelling note. Instructor edited the route note, rewrote the work-notes note (praise + proofread), added an overall note. **Approve / Return not clicked**, per owner. |

## Findings and fixes

| # | Finding | Severity | Fix | Status |
|---|---------|----------|-----|--------|
| F2 | **Progress loss (all SOC modules).** Any action that saves case state and then calls `render()` (e.g. M01 lesson *Check answers*) lost that action: on `#/program/…` routes `render()` re-fetches learner rows and `Object.assign(user, refreshed)` replaced the in-session copy with the server row *before* the 300 ms debounced write landed. Reproduced: `checked:true` set, then gone ~800 ms later; lesson never completes. | **Critical** | `render()` now awaits `settlePendingCaseStateWrites()` (flush LabRuntime debounce + await `moduleCaseStateQueues`) before re-fetching (`portal/app.js`; `LabRuntime.flushAllCaseStateWrites` exported). Verified live: checked lessons stay complete across re-render and reload. | ✅ fixed |
| F3 | M01 *Check answers*: page jumped away and the lesson closed, so the per-question feedback was never visible. Handler scrolled a stale node before async `render()` finished; `collapseCourseCardsByDefault()` then closed every lesson card. | High | Handler awaits `render()`, reopens the lesson and scrolls to the score (`portal/soc-analyst-module-01.js`). Verified live. | ✅ fixed |
| F4 | M01 checklist listed the Guided Lab as "Optional" while Prove It is locked until it is submitted (owner rule 2026-10-05). | Medium | Checklist uses the same Not started / In progress / Complete status as the header. Verified live. | ✅ fixed |
| F5 | **M01 Guided Lab console goes dead after the first ticket action (live on production).** The case console handles a click/change and re-renders, detaching the target; the outer `#m01-lab-dynamic` listeners' guard `event.target.closest('#m01cc-app')` then fails, so legacy handlers also ran: Affected Device overwritten with "No device linked" (should be WKS-14) and `moduleOneRenderDynamic()` rebuilt the console **without its listeners**: log rows, guide, Add user/device all stopped responding until reload. | **Critical** | Outer listeners check `event.composedPath()` (fixed at dispatch) for `#m01cc-app` (`portal/soc-analyst-module-01.js`). Verified live: device = WKS-14 and the console keeps responding. | ✅ fixed |
| F6 | `signOut()` did not flush the 300 ms debounced lab save, so edits made just before Sign Out (or an idle sign-out) would be written after the session ended (RLS reject) and be lost. | Medium | `signOut()` awaits `settlePendingCaseStateWrites()` first (`portal/app.js`). | ✅ fixed |
| F7 | Guided Lab submit error said "set the ticket fields…" while the only gap was the Route to Department select, which appears only after Escalation = Required. | Medium (UX) | The error now lists exactly what is missing ("Almost there. Still to do: choose the Route to Department."). | ✅ fixed |
| F8 | After the Guided Lab submit, the header still said Guided Lab "In progress", and the panel said "Your ungraded practice ticket is recorded." with no next step. | Low | Header refreshes on submit; the panel says "Prove It · Assessment Lab is now open." | ✅ fixed |
| F9 | A fresh tab served a stale cached `soc-analyst-module-01.js` (`?v=20261005-prove-gate`). | Deploy | Bumped `?v=` on all 21 changed portal assets to `20261017-section-notes`. | ✅ fixed |
| F10 | **Below-pass Prove It submissions silently dropped, all SOC modules (production since 2026-09-01).** M01 attempt 1 scored 68%: the student saw "Submitted for faculty review" but the insert was rejected by `lab_attempts_complete_needs_passing_score` (23514). No row, so it is not in the instructor queue, the module can never unlock, and the student can't resubmit. Not Megan's work, not payload size (3.5 KB). | **Critical** | Global fix designed (migration `submitted` state + queue views + central `recordLabAttempt()` mapping + no false "submitted" + unstick). Full write-up: `docs/handoffs/BUG_2026-10-17_PROVE_IT_BELOW_PASS_SILENTLY_DROPPED.md`. Owner decided 2026-10-17: below-pass Prove Its go to the instructor. Fixed (Codex agent, reviewed): `recordLabAttempt()` maps below-pass `complete` to `submitted`; save failures show a red "did not reach your instructor" banner; M01 rolls back a failed submit and unsticks on load; the instructor's Approve on a below-pass attempt reads "module stays locked". Migration `20261017120000_below_pass_prove_it_review.sql` verified on the **local** DB (`supabase db reset --local`): below-pass `complete` still rejected; `submitted` saves and is in both queues; an approved below-pass attempt does **not** unlock (control: an approved passing attempt does). CI + all suites green. Owner pushed the migration to staging (`xbblgtrfwgeiyttdlbue`) and production (`eokvngifirjgfozzbieu`) on 2026-10-17; worktree re-linked to staging. The CLI's `pg-delta` catalog-cache certificate warning is harmless. | ✅ fixed + migrated |
| F11 | Live check on production before the migration: the student unsticks on reload (Submit Lab available, all ticket work kept); the below-pass resubmit fails (no `submitted` enum yet), rolls back and shows the failure banner, **but the banner sat behind the sticky header** (z-50), so it was invisible. | High | Banner `z-index:1000`; verified visible. (Night-mode toggle overlaps its right edge: cosmetic.) | ✅ fixed |
| F12 | First per-section build saved **empty** note boxes on passing sections as blank `lab_attempt_feedback` rows (each box carries the section title as its label), so the card said "10 notes" for 7 real ones. | Medium | Save skips boxes with no text (hidden-label items need a comment); the student load ignores blank-comment rows, so the 3 blank rows already in production are hidden. Card now says 7. | ✅ fixed |
| F13 | On the Submission Sheet the below-pass Approve button was still green. | Low | Gray when below pass, matching the legacy card. | ✅ fixed |
| F14 | **Module 1 can never be completed (production since 2026-09-21).** The soc-01 rule in `student_verified_module_progress` still requires `result.simulator_performance.actions` (removed when the case console replaced the simulator, `1add6d6`) and `detail.quizPassed` (the module quiz is no longer on the page). Approved 100% attempt + 9/9 lessons + Guided Lab → `complete = false`, Module 2 locked, "0 of 12 modules". | **Critical** | Write-up `docs/handoffs/BUG_2026-10-17_M01_CANNOT_COMPLETE.md`; Migration `20261017130000_module_one_completion_case_console.sql` (Codex; only the two soc-01 lines change) verified on the local DB: approved passing attempt → complete (and `module_progress` syncs); not reviewed / below pass / critical error / lessons incomplete / no case_record → not complete; soc-02 unchanged. **Owner `db push` needed.** | ✅ fixed + migrated; verified live |
| F15 | **Module 2 Learn It deck is dead for every student (production since 2026-10-03, `8393c88`).** LEARN IT does nothing, so the Guided Lab never unlocks and Module 2 can't be completed. Every registered module's `wire()` runs after each render; Module 1's `wireModuleOneLab()` wires `.m01-shell`, which Module 2's shell also carries (`68cdadd`, shared styling), and `LearnItCards.wire()` guarded by root only, so Module 2's own `m02e` wiring was skipped. Not caused by this branch or Megan's work. Only M02 shares another module's shell class today. | **Critical** | Global fix in the shared component: `LearnItCards.wire()` is keyed by root **and** prefix (`portal/learn-it-cards.js`), regression test in `tests/learn-it-cards.test.js`, `?v=` bumped. Verified live: LEARN IT opens idea 1 of 15. Side note: `wireModuleOneLab()` also adds a Review Module listener on every module page (scope it to M01 later). | ✅ fixed |
| F16 | Module 2 sheet's spell check flagged the username `jsmith` ("jsmith → smith"), pushing the section over the 3-word note threshold. M02 was the only SOC sheet without a `fixture`, so its scenario names never reached the spelling allowlist. | Low | `portal/admin-sheets/soc-m02.js` registers `fixture` (users, devices, departments, dispositions, findings, evidence); `jsmith`/`cgreen`/`wkstn` now allowed, real typos still flagged. | ✅ fixed |
| F17 | Instructor queue: 20 of 21 pending rows are seeded synthetic attempts (2026-08-29 → 09-23) in pre-case-record formats (`{attempts,feedback,breakdown}`, `{source}`, `{}` or `{synthetic…}`), so their sheets read "Not recorded in this attempt" for every section. Not a code bug; real attempts save the full ticket (verified: M02 attempt `cb777202` has all 13 `case_record` fields). | Low (noise) | Owner: clear or archive the seeded queue rows (all synthetic students) so instructors only see real work. No delete done by the agent. | ⏳ owner |
| F1 | Login lives in `sessionStorage` (per tab, by design in `portal/supabase-config.js`): a new tab or cleared cache always needs a fresh sign-in. Persistence test therefore checks the *work* survives (server `module_progress.case_state`), not the login. | Info | None (intended) | — |

## Student experience: "would a student know what to do first?"

Watched as a student walks it, step by step. Anything confusing gets a
coursework/UI adjustment proposal here.

| # | Where | What a student sees | Confusing? | Proposed adjustment | Status |
|---|-------|--------------------|------------|---------------------|--------|
| U1 | M01 module page, first view | Hero, then a collapsed checklist, "Your starting point", then step 1 with an orange LEARN IT → | No: the first action is obvious | — | ok |
| U2 | Learn It header | The heading stays "Start with the security outcome" on steps 2–10; only the eyebrow ("STEP 5 OF 10 · FOLLOW THE TELEMETRY") changes | Minor | Show the current card's title as the heading | noted |
| U3 | Narrow window (~520 px) | Portal home header: "My Programs" link overlaps the logo | Minor (layout) | Header wrap at narrow widths | noted |
| U4 | M01 checklist vs Prove It lock | Checklist said Guided Lab "Optional"; Prove It said "Submit the Guided Lab to unlock Prove It" | **Yes**: contradictory | Checklist now shows the real status (F4) | ✅ fixed |
| U5 | M01 foundation lessons | The 9 lessons the module requires sat in a collapsed "Deep Dive · foundation lessons and tool translations" panel (reads as optional extra reading) | **Yes**: a student finishes Learn It and skips the lessons, then Module 1 never completes | Renamed "Required · 9 foundation lessons (X of 9 complete)", open until all done, instruction says what completes the module | ✅ fixed |
| U6 | Lesson knowledge check result | "3 of 4 correct" with no pass/fail; the pass mark (80% = 4 of 4) is never stated | **Yes** | Summary now says "Lesson complete" or "Not complete yet: you need 4 of 4. Change the answers marked in red, then check again." | ✅ fixed |
| U7 | Lesson knowledge-check content | The correct option is usually the longest, most detailed one; distractors are often jokes ("…whether the analyst likes malware analysis") | Assessment validity | Content pass: plausible distractors of similar length (owner/content decision) | proposed |
| U8 | Guided Lab intro | "This coached case is ungraded and retryable. Complete the independent Assessment Lab in Prove It when you are ready." | **Yes**: reads optional | Owner 2026-10-17: Guided Labs are required; submitting one unlocks that module's Assessment Lab, and a passing grade on the Assessment Lab unlocks the next module. M01 intro reworded to say exactly that | ✅ fixed |
| U9 | Guided Lab first view | The console-guide popover sits on top of **Open the alert**; minimized, its bar still half-covers it | **Yes**: the first action is hidden | Anchor the guide beside or below the shift card until the alert is opened | proposed |
| U10 | Small viewport (~400×450 CSS px: high zoom plus side panel) | Guided Lab card is cramped; maximize helps only partly | Layout | Responsive pass on the lab console at < 600 px | noted |
| U11 | Guided ticket "Add user / Add device" | One click fills in the correct entity (j.santos / WKS-14): no choice is made | Pedagogy: Practice It gives the answer | Offer 2–3 entities from the logs to choose from (as Prove It does) | proposed |
| U12 | Program page at ~400 px | Module 1 card is squeezed into a thin column with a horizontal scrollbar | Layout (likely pre-existing) | Responsive pass on the module card at < 600 px | noted |
| U13 | Instructor chip after Return | "Module 1 · PROVE IT Failed · 68%" | Minor: the decision was "Returned", not "Failed" | Faculty send-backs now read "Returned" (autograded below-pass keeps "Failed"); legend "Returned / failed" | ✅ fixed |
| U14 | M01 Prove It return notice (under the ticket) | Lists the notes by section but no way to see them beside the answers | Minor | Added "See these notes beside your answers" link to the marked lab | ✅ fixed |
| U15 | M02 Learn It card | Mouse-wheel scrolling while the pointer is over the Learn It card does not scroll the page; the student has to move the pointer off the card | Minor | Let vertical wheel events pass through the card carousel | noted |
| U16 | M02 Guided Lab | Completing the Guided Lab = pressing "Next explanation" 6 times; no ticket or decision is practised before the graded ticket (M01's Guided Lab has a practice ticket) | Pedagogy | Add a short practice ticket to the M02 Guided Lab (owner/content) | proposed |
| U17 | M02 Assessment scoring | Route "HR / Data Privacy" is described as partial fit (35) but `caseScore` treats fit < 40 as a bounce → 0 of 30; "Tier 2 SOC" has bounce text but scores 17. A reasonable route drops a student to exactly 70% | Assessment validity | Owner decision: give HR/Data Privacy its partial credit (bounce only where `bounce` text exists), or keep as is | proposed |
| U18 | Guide popover (M02, also M01 U9) | The console-guide box covers the rows it asks the student to look at (e.g. step 3 "Read the activity record") | Yes, minor | Same as U9: anchor the guide beside the target | proposed |

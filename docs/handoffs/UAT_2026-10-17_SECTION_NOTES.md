# UAT 2026-10-17 — per-section teacher notes + student marked lab

Live progress log, updated as the UAT runs. Branch `feat/per-section-teacher-notes`
(worktree `/home/alex/mnt-section-notes`), served by `bin/dev.sh start --production`
on the owner's instruction (staging has no admin/instructor panel).

Accounts (synthetic, owner-provided, signed in by the owner):

- Student `7634107909-SOCAN` on `http://127.0.0.1:8768` (the owner signed in with this synthetic account, not 9334491415)
- Instructor `1989457660-SOCANINST` on `http://localhost:8768`

## Plan

| # | Step | Status | Notes |
|---|------|--------|-------|
| 1 | Student: find current progress, open next SOC Prove It | ✅ | Student at M01 In Progress, 0/12. Module page opens on a clear first step (orange LEARN IT →). |
| 2 | Student: half-finish the lab, sign out, clear cache, new tab, sign in: progress persists? | ✅ | 2a ✅ Learn It at 5/10 → `localStorage.clear()` + Cache Storage cleared + reload → back at step 5 of 10 (server-side). 2a′ ✅ 9/9 lessons survive `localStorage.clear()` + reload. 2a″ ✅ Guided ticket (alert opened, 9/9 rows, status/severity/user, 471-char note) survives reload. 2b: ticket half-done (not submitted) → added text → Sign Out → localStorage, sessionStorage, Cache Storage cleared → tab closed → new tab → owner signs in → ✅ everything back from the server: 9/9 lessons, alert opened, 9/9 rows, all ticket fields, WKS-14, the 491-char note including the last sentence typed just before Sign Out. |
| 3 | Student: finish and submit the SOC Prove It | ✅ | Guided Lab submitted → Prove It unlocked → attempt 1 submitted 11:55 UTC with deliberate mistakes (Status Resolved, Severity Low, device FS-02, route IAM, thin note with typos). Card: "Submitted for faculty review". |
| 4 | Instructor: open Lab Attempts, check the sheet + per-section notes | 🟡 | Per-section note boxes verified on existing attempts (13 sections, overall note, no add-item pile). Decided attempt with pre-change notes (9334491415 M08) shows them under "Teacher notes sent to the student", readable. The UAT student's attempt is missing from the queue: see F10. |
| 5 | Instructor: write per-section notes, Return for remediation | ⏳ | |
| 6 | Student: module card → "See your marked lab"; notes beside sections | ⏳ | |
| 7 | Student: resubmit; instructor approves; next module unlocks | ⏳ | |
| 8 | Help Desk lab: same submit → review → marked lab | ⏳ | |

## Post-migration UAT continuation (2026-10-17)

| Check | Status | Notes |
|---|---|---|
| Migration state | ✅ | Staging and production migration histories both contain `20261017120000`. Production was applied in the owner's preceding terminal session; this session verified remote history read-only. |
| Correct UAT identities | ✅ | Student pane shows `7634107909-SOCAN`; instructor pane is an authenticated SOC administration session. Both are the synthetic accounts named above. |
| Instructor queue baseline | ✅ | After resubmitting from the active `8768` portal, the instructor Lab Attempts tab shows `7634107909-SOCAN` with **1 under review · 0 graded**, and the M01 attempt pill reads **Under review · 68%**. The unrelated historical M09 sheet (`8987495051-SOCAN`, 91%) was not modified. |
| Browser target | ✅ | The stale student tab had been at `localhost:8769`, which is not listening. `bin/dev.sh status` reports the current production-backed portal at `8768`; the student was moved to `8768` before submitting. Initial clicks before correcting the window offset did not submit or grade work. |
| Post-migration below-pass resubmit | ✅ | In production-backed local portal, synthetic student `7634107909-SOCAN` resubmitted the retained M01 ticket. UI showed “Submitted for faculty review”; refreshed instructor queue confirms the saved 68% row is present. This verifies the migration plus centralized `recordLabAttempt()` path end to end. |
| Instructor review / return | ⏳ | Open the new 68% M01 attempt, inspect the recommendation and section note boxes, then add teacher notes and return it. |

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
| F12 | **Cross-track persistence contract.** SOC, AI/ML, and Help Desk all use the shared `recordLabAttempt()` writer. The below-pass state mapping, durable-write error event, and visible banner therefore protect the common save boundary. Help Desk evidence submissions additionally upload files before inserting the attempt; its shared submit helper deletes those files if the attempt write fails and keeps selected files available for retry. Audit found M01 now also rolls back its Prove It submitted latch and reconciles it against the latest server attempt on load. | Critical | Added a required rule to `docs/LAB_ASSESSMENT_STANDARD.md`: only durable writes may produce submitted/completed UI, preserve drafts and rollback on failure, reconcile from server state, keep Help Desk evidence cleanup atomic, preserve the passing-score/unlock guard, and test shared SOC + Help Desk callers. | ✅ audited + rule added |
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

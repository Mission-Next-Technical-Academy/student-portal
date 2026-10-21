# READ FIRST: SOC save and submit fixes (PR #79), 2026-10-21

**Author:** Alex (SOC Analyst track owner) · **PR:** #79 `fix/prove-it-submit-latch` · **Status:** waiting on owner merge, then confirmed by the running UAT

---

## Front notes (the short version)

1. **Two bugs lose student work today, in every SOC module (M01–M12):**
   - **Lost edits.** If a student reloads or closes the tab within about a second of a change, that change is gone. It is gone from the screen, the browser and the database. (B9, P1)
   - **False "Submitted".** If the Prove It save fails (network drop, expired session, server refusal), M02–M12 still show "Submitted for faculty review". Nothing reaches the instructor queue, and the student can't resend. (PR #79, P1)
2. **This PR fixes both, plus one more.** Returned M10 Assessment Labs and M12 capstones now reopen for a redo. Before, they stayed locked.
3. **The current UAT will close this out.** The student lifecycle run (`docs/handoffs/STUDENT_LIFECYCLE_RUN_2026-10-21.md`) tests every module for save, reload, sign-out/sign-in, failed submit and redo. It is the acceptance test for this logic. Its checks H (quick reload), J (failed submit) and M (return → redo → approve) are expected to pass after this PR merges, and will be re-run on every module.
4. **Megan, and any other developer: do not edit SOC Analyst coursework.** That covers any file listed in section 3. That logic is under active UAT. Every unreviewed change to it invalidates the test evidence and has already caused regressions. If you need something changed there, message Alex. Do not open a PR against those files.
5. **Shared logic that SOC depends on is review-only.** That means `portal/app.js` save/submit helpers, `portal/lab-runtime.js`, and the SOC script lines in `portal/index.html`. Changes there need Alex as a reviewer before merge.
6. **Help Desk has the same class of problems, and worse in places.** Section 4 lists them with recommended fixes. Alex will not touch Help Desk coursework. Those fixes are Megan's to make, in Help Desk files or through the shared helpers this PR adds.

---

## 1. Why these fixes work

### Problem A: partial work lost on a quick reload or tab close (B9)

**What the student sees:** they change a field (for example, M01 Assessment Lab "Affected device") and reload. The field is blank again.

**Why it happens:**
- Every lab change is saved to the browser at once, but the database write waits 300 ms (debounce). Then it does a read and an update, which is two more network round trips.
- A reload or tab close inside that window kills the write before it reaches `module_progress.case_state`.
- On the next load, `LabRuntime.loadCaseState()` always lets the server row win. So the older server copy overwrites the newer browser copy, and the last change is erased everywhere.

**The fix (`portal/lab-runtime.js`, `portal/app.js`):**
- Every save stamps the state with `savedAt` and leaves an "unsynced" marker in the browser.
- The marker is cleared only when the database confirms the write. `persistModuleCaseState()` now returns `true` on success, so the runtime knows.
- On load, if the marker is still set and the browser copy is newer than the server row, the browser copy is kept and resent to the database immediately.
- If the server row is newer (the student worked on another device since), the server still wins, as before.

**Why that closes it:** the only way to lose the last change was "write aborted, then server copy wins." Now an aborted write leaves proof that it never landed, and the newer copy is kept and re-saved instead of overwritten. Cross-device behaviour is unchanged.

**Proof:** `tests/case-state-unload-recovery.test.js`. It fails on master's `lab-runtime.js` (the device reverts) and passes with the fix. The test runs in `bin/ci-check.sh`.

**Limits:**
- Recovery happens when the student comes back **in the same browser**. If they close the tab and only ever return on a different device, that last change (under about a second of work) is still only in the first browser.
- `savedAt` uses each device's clock. If two devices' clocks disagree a lot, the order of near-simultaneous edits can be wrong. This is rare and no worse than today.

### Problem B: "Submitted for faculty review" with nothing in the instructor queue

**What the student sees:** they press Submit, the page says submitted, and the lab is locked. The instructor never gets it.

**Why it happens:** M02–M12 set their own "submitted" flag before the `lab_attempts` insert finished, and never undid it when the insert failed. Only M01 rolled back. The flag is saved in `case_state`, so it also survived sign-out and sign-in. The student was stuck.

**The fix (`portal/app.js` + each SOC module):**
- `recordProveItAttempt()` wraps every SOC Prove It submit. If the insert fails, it restores the previous review status and runs the module's rollback, so the lab reopens and the student can submit again. A red banner says the submission did not reach the instructor.
- M07 and M08 save one submit under several lab keys. If one key fails part-way, a resubmit sends only the keys that still have nothing pending, because the server refuses a second pending attempt.
- `proveItLatchIsStale()` runs on every module load. It repairs students who are **already** stuck: if saved state says "submitted" but no attempt exists in the database, the case reopens. It deliberately does nothing when:
  - the sign-in read of `lab_attempts` failed, so we can't tell; or
  - this tab has an insert still in flight, so a page refresh mid-submit can't reopen a good submit.

**Why that closes it:** "submitted" now only sticks when the database has the attempt. A failed insert rolls back on the spot, and a stale flag from before this fix is corrected on the next load.

**Proof:** `tests/below-pass-prove-it.test.js` (28 assertions, in CI). There were also 33 full-portal load checks across M01 and M03–M12, three ways each: stale flag reopens, real attempt stays submitted, unknown stays submitted.

### Problem C: returned M10 and M12 work could not be redone

On master, when an instructor returned an M10 Assessment Lab or the M12 capstone for remediation, the student's page stayed locked as submitted. The PR adds the same redo reopen the other modules already had.

### How A and B work together

Both fixes were merged together in a scratch tree and tested: CI green, nothing new failing. The case that matters is "student submits, then reloads straight away":

| What reached the database before the reload | Result after reload |
|---|---|
| Attempt saved, `case_state` write cut off | B9 keeps the newer "submitted" copy and resends it. The attempt exists, so the case stays submitted. Correct. |
| Neither saved | B9 keeps the "submitted" copy, then `proveItLatchIsStale()` sees no attempt and reopens the case so the student can resend. Correct. |
| Both saved | Nothing to recover. Stays submitted. Correct. |

---

## 2. What is still open (not in this PR)

These stay on the UAT bug list (`STUDENT_LIFECYCLE_RUN_2026-10-21.md` §6). They are not regressions from this PR.

- **B1 (P2, all tracks):** lab answers stay in browser storage after sign-out, so the next person on a shared PC can read them in devtools. The fix belongs in shared sign-out. It must run **after** pending saves are flushed and confirmed, or it will throw away the very edits B9 now protects.
- **B13 (P2):** in the run, M01's failed submit showed no visible message, even though the shared red banner exists. To be re-checked in UAT check J after merge.
- **Six test files already failed on clean master before this PR** and are not in CI: capstone-traceability, guided-lab-console-guide, m03-alert-dispositions, module-nav-lock, soc-m04-assessment-rubric, soc-m04-assessment-scorer. This PR does not change that count.

---

## 3. Hands-off list: SOC Analyst coursework

**Megan and other developers: do not edit these files. Alex owns them and they are under UAT.**

- `portal/soc-analyst-module-*.js` (M01–M12, including `-environment.js` files)
- `portal/soc-m0*-assessment-*.js`, `portal/soc-m1*-assessment-*.js`
- `portal/soc-console-*.js`, `portal/soc-timeline-ui.js`, `portal/soc-alert-queue-ui.js`, `portal/soc-telemetry-schema.js`, `portal/soc-assessment-*.js`, `portal/kql-*.js`, `portal/case-record.js`, `portal/console-guide.js`, `portal/learn-it-cards.js`
- SOC tests: `tests/soc-*.test.js`, `tests/m0*-*.test.js`, `tests/m1*-*.test.js`, `tests/below-pass-prove-it.test.js`, `tests/case-state-unload-recovery.test.js`

**Shared, review with Alex before merge:**
- `portal/app.js`: `recordLabAttempt`, `recordProveItAttempt`, `proveItLatchIsStale`, `persistModuleCaseState`, `fetchUserDetails` (case_state / lab_attempts loading), sign-out flush
- `portal/lab-runtime.js`: the whole file
- `portal/index.html`: SOC `<script>` lines. Bump only your own files' `?v=`.
- `bin/ci-check.sh`: add lines; don't remove or reorder SOC ones

**Why this is strict:** SOC save and submit behaviour is spread across these files. A change in one, even a "harmless" refactor or CSS/script-order change, can silently bring back lost edits or false submits. The UAT is the only end-to-end proof, and it is only valid against code it has tested.

## 3A. Global Prove It review display follow-up (2026-10-21)

The lifecycle UAT found a separate shared navigation defect after PR #79 was present: a persisted attempt awaiting faculty review could still be shown as green/complete because `moduleUnifiedNav()` trusted module-authored `isComplete` flags. The shared fix derives the Prove It and Module Review rows from the latest durable `lab_attempts` review fields: pending is yellow and does not count toward progress, returned is red and available for a redo, passing instructor approval is green, and a legacy approved-below-pass attempt stays amber/incomplete. It preserves the PR #79 writer and rollback behavior. The implementation is in `portal/app.js`, `portal/module-registry.js`, and `portal/module-labs.css`, with cache-busters in `portal/index.html`; SOC coursework and the shared save/submit functions were not edited. M05 and the full SOC M01–M12 and other-track lifecycle still need browser verification; see `docs/handoffs/STUDENT_LIFECYCLE_RUN_2026-10-21.md`.

---

## 4. Help Desk: recommended fixes (for Megan; Alex will not edit Help Desk coursework)

Found while reviewing shared logic on 2026-10-21. Line numbers are from master `01ac648`.

| # | Sev | Problem | Where | Recommended fix |
|---|---|---|---|---|
| H1 | **P1** | **Simulator ticket work is shared by everyone on the same browser and never reaches the database.** The ticket state key `defender-lab.helpdesk.state.v1` has no student in it and is never reset on launch. The next student on that browser opens the previous student's tickets, and the coach's collected work can carry them into their own submission. A cache clear or a new device loses all in-progress work. | `ui/helpdesk.js:34, 80–90` | Scope the key per student (pass an anonymous student id when the portal opens the simulator, like `LabRuntime.anonymousStudentId`). Persist in-progress ticket work through the portal. For example, the simulator posts `mnt-coach-progress` to the opener and the portal saves it with `LabRuntime.saveCaseState()`, which now has the B9 reload protection. |
| H2 | P2 | **Walkthrough step progress is lost when the tab closes.** Coach state lives in `sessionStorage`. | `ui/coach.js:22–48` | Save the current coach step with the same progress message as H1, and restore it on launch. |
| H3 | P2 | **Portal-side Help Desk lab state is browser-only.** M01, M02, M12 and the coach modules (M03–M11) use `LabRuntime.load/save`, which never write to the database. So "walkthrough started/completed" and M01/M02/M12 drafts are lost on a cache clear or new device. (AI/ML has the same pattern.) | `portal/it-support-shared.js:674–715`, `it-support-module-01.js`, `-02.js`, `-12.js` | Switch to `LabRuntime.loadCaseState(labId, moduleKey, user, defaults)` / `saveCaseState(...)`. It is a near drop-in swap, and it gives Help Desk the same database persistence and reload recovery SOC has. |
| H4 | P2 | **The walkthrough is marked complete before its submission saves.** `onMessage` calls `markModuleLabComplete()` and saves `consoleCompleted: true` **before** `await itsSubmitWalkthroughLabs()`, and ignores the result. If the insert fails, the page says complete and the instructor gets nothing. That is the same class of bug as SOC's PR #79. | `portal/it-support-shared.js` `itsRegisterCoachModule` → `onMessage` | Await the submit first. Only mark complete and save `consoleCompleted` if every result is `true`. Otherwise leave it open, so "run the walkthrough again" resends it. The shared red banner already fires on failure. |
| H5 | P2 | **Capstone score is readable before review.** Megan already noted this in NEXT_SESSION.md (PR #80). | RLS `lab_attempts_own_read`, client-side capstone scoring | Server-side scoring and a read that withholds unreviewed scores. To be planned with Alex because it touches shared tables. |
| H6 | P2 | **Shared PC leakage (B1)** applies to Help Desk too. | shared sign-out | Fix once, in shared sign-out (section 2). Coordinate with Alex. |

**Order to do them in:** H1, then H4, then H3. H1 is a privacy and grading-integrity issue, not just lost work.

---

## 5. Merge checklist (owner)

1. Review and merge PR #79 (squash). CI is green on the rebased branch.
2. Push to `master` deploys to GitHub Pages. Staging auto-syncs.
3. Resume the UAT at Module 2 and re-run checks H, J and M on M01. Expect: quick reload keeps the edit; a forced submit failure reopens the case with a red banner; M10/M12 return → redo works.
4. Run B and C fresh students: owner signs the faculty tab in as admin to create them.

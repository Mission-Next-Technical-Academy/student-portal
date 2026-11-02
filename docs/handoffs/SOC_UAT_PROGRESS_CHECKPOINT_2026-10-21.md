# SOC student lifecycle UAT progress checkpoint — 2026-10-21

**Branch:** `fix/prove-it-submit-latch`
**Checkout:** `/home/alex/mnt-pr79-rebase`
**Current browser:** existing student `1600192140-SOCAN`, Module 03. Faculty session is not available.

## Progress by module

| Module | Current evidence | Remaining |
|---|---|---|
| M01 | UI shows Approved and 100% module progress. After a full student-localStorage clear, 40/40 Learn It quiz groups restored selected with Correct feedback; ticket values and notes reappeared read-only. Restored client `lab2` state says 3 attempts, score 100%, submitted; instructor sheet ordinal was not independently checked. | Full per-input save/reopen/clear evidence and faculty-sheet score/ordinal confirmation. |
| M02 | Passing redo was Attempt 3 of 3 at 100%; faculty approved it and M03 unlocked. After localStorage clear, all 21 visible assessment controls remained with saved values; all three checked Learn It answers remained Correct. | Full inventory of every Learn It and Practice It control, and further attempt/review cross-checks. |
| M03 | Attempt 1 of 1 scored 87% and was approved; M04 unlocked. Post-clear assessment and Practice It values are documented in the run log. Current UI is green/Approved for Assessment Lab and Module Review. Current DOM inventory: 105 controls (57 input, 15 textarea, 33 select), 53 enabled and 45 non-empty. | Current 105-control inventory is only a baseline count; current field-by-field inventory remains incomplete. |
| M04 | Attempt 1 of 1 scored 72% (70% threshold) and was approved with corrections; M05 unlocked. Saved query, rule, schedule, execution, alert, indicators, approval request, pins, automation receipts, and ticket fields were verified after localStorage clears in the earlier pass. Current UI was green/Approved. | Learn It/task coverage and exhaustive per-input verification remain incomplete. |
| M05 | Assessment Attempt 1 of 1 is persisted at 10% against 70%, `reviewed_at: null`; faculty sheet recommended return. Student nav and summary show yellow **In review**. Module is 50%; M06 remains gated. Learn It deck shows 12/12 complete; Guided Lab shows Complete/submitted. After all-localStorage clear, these states and both M05 case keys repopulated. | Requires faculty return, student passing redo, faculty approval, M06 unlock, full field-by-field persistence verification. Do not approve the 10% attempt. |
| M06–M12 | Not reached. M06 remains locked behind M05 review. | Complete sequential student and faculty lifecycle UAT after M05 is approved. |

## Shared status fix

Commits `b7f1236` and `5c80395` make Prove It status follow durable instructor review across the shared Academy navigation and module summary. Pending is yellow/incomplete, return is red, passing approval is green, and approved-below-pass remains amber/incomplete. Browser checks confirmed M02–M04 green and M05 yellow, including the yellow Assessment Lab summary. No Supabase migration is needed for this UI fix.

## Session and environment

- Through 2026-11-02, treat all supplied credentials as staging credentials regardless of banner. Alex says the open pre-launch data is synthetic despite the “PRODUCTION (LOCAL)” label.
- Student tab is signed in. The previous faculty tab was restored at `127.0.0.1:8769` but redirected to `#/login`; both storage areas were empty. No credentials were entered. Only one Chrome tab is currently attached to Playwright.
- The authorized local portal server on port 8768 responds HTTP 200. Its single-threaded `bin/serve.py` process stalled twice while Chrome held a full-page request; each time the same server command was restarted only after confirming requests timed out. The subsequent route rendered. The startup loader disappeared after the app loaded; no product loader bug was confirmed.
- Do not use `bin/dev.sh`, run database commands, perform data fixes, invent credentials, or mutate the pending M05 attempt. No database changes were made.

## Known defects / gaps

- M05 Learn It “Save applied task” previously threw `TypeError: Cannot read properties of undefined (reading 'id')` at `portal/soc-analyst-module-05.js:1449`. **Fixed in code 2026-11-02 (548b3c1), not UAT-verified.**
- M05 Optional Sysmon lab lost completion on route re-entry after passing its immediate refresh/storage-clear check. **Not fixed; diagnosed 2026-11-02** (see below).
- M05 Optional Keylogger lab remained at 0/4 after selecting the expected Procmon row; read-only inspection suggests a flat observation-key versus nested-validator mismatch. **Fixed in code 2026-11-02 (548b3c1), not UAT-verified.**
- M05 assessment Automation alert selectors have zero options, so simulated ticket/notification actions cannot be saved. **Explained in code 2026-11-02 (3ae7449), not UAT-verified** (see below).

### Status as of 2026-11-02 (code only, not UAT-verified)

Committed on `fix/prove-it-submit-latch` from the owner's uncommitted Oct-21 patch:

- **Learn It "Save applied task" TypeError (548b3c1).** The button handler read `dataset.m05LessonTask`, which only the textarea carries. It now reads the button's `data-m05-lesson-task-submit`.
- **Keylogger (ma-4) stuck at 0 (548b3c1).** The malware-analysis shells log flat keys (`observed['ma4.keylogFile']`), while the validator's `observationLogged` read nested paths. It now reads the flat key first, then the nested path.
- **Automation alert selects empty (3ae7449).** Not a data bug. The shared M04 automation panel lists only alerts the learner's own analytics rules have generated (`assessment.alerts`). A rule run on the M05 fixture does generate alerts (checked: 5 alerts from one rule). Before any rule runs, both selects now show a disabled "Run an analytics rule first" placeholder. The submitted value stays empty, as before.
- **Sysmon optional lab (lap-5) completion: diagnosed, not fixed.** lap-5 is a legacy-shape project lab rendered by the imported app's `ModulePage`. Its task completion is written only to the browser's `mission_next_progress` (`markTaskComplete`). Only new-shape `LabPlayer` labs sync to `case_state['imported-lab-progress:<lab>']`. The M05 optional card is a manual "Mark complete" toggle in `moduleFiveState.labProgress` and never reads the lab's own completion (`missionNextImportedLabCompleted()` has no callers). A fix needs the legacy shell to sync through `MISSION_NEXT_PROGRESS_EXT`, which is shared imported-lab code, so it is not a small fix. The exact route re-entry trigger was not reproduced in a browser.
- Also committed: the M06 independent Prove It redo key (`soc-06`) (c54bef2).
- **Deferred** to `/home/alex/mnt-wip-backups/pr79-deferred-hunks.patch`:
  - M07 incident-draft persistence: Module 11's m07 pack has no `console()`/`save()`, so its Email tab would throw.
  - M09 guided `ws-294` IDs: `tests/m09-guided-preservation.test.js` still pins `ws-173`, and the guided submit was never re-verified end to end.
- All modules still require the global exhaustive inventory: every quiz, editor, query and name, schedule, rule, pin, verdict/rationale, note, ticket field, checkbox/toggle, automation body, guide state, response, attempt, and review field. A generic state-restored statement is insufficient.

## Next actions

1. Alex restores the existing authenticated faculty session (no credentials should be sent in chat).
2. Faculty returns M05 Attempt 1 of 1 (10% / 70%) for remediation; verify the student UI is red/returned.
3. Same student completes M05 redo, inventories every field, saves/reopens, clears localStorage while preserving auth, refreshes and rechecks; submit a passing attempt.
4. Faculty approves the passing attempt; verify M05 green/complete and M06 unlock.
5. Continue the same exhaustive persistence and review lifecycle through M12, updating `STUDENT_LIFECYCLE_RUN_2026-10-21.md` after each surface and state transition.

The UAT is **incomplete**. This checkpoint is not a completion claim.

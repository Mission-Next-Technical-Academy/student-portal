# BUG 2026-10-17: below-pass Prove It submissions are silently dropped (all SOC modules)

Found during the per-section teacher notes UAT (`docs/handoffs/UAT_2026-10-17_SECTION_NOTES.md`),
on production, with synthetic student `7634107909-SOCAN`.

**Read this before touching `recordLabAttempt()`, any module's Prove It submit,
`lab_attempts` constraints, or the grading-queue views. Fix it once, centrally,
as described below. Do not patch individual modules one by one.**

## Symptom

1. A student submits a SOC Prove It whose automatic score is below 70%.
2. The module says **"Submitted for faculty review. The next module stays locked
   until your instructor approves the submission."**
3. No `lab_attempts` row exists. The instructor never sees it. The module can
   never unlock. The student's UI stays "submitted" (saved in `module_progress.case_state`),
   so they can't resubmit either. **The student is stuck, and nobody is told.**

Only symptom in the browser: one console line, `lab_attempts insert failed lab-soc-escalation`.

## Root cause

| Piece | What it does | Since |
|---|---|---|
| `lab_attempts_complete_needs_passing_score` check constraint (`supabase/migrations/20260901103000_completion_integrity_guards.sql`) | Rejects `state = 'complete'` when `score < pass_threshold` (70). Added as a forged-completion guard. | `0ab2d87`, 2026-09-01 |
| Every SOC Prove It submit (M01–M12) | Calls `recordLabAttempt(..., { state: 'complete', score })` **without checking the score**, then shows "Submitted" without checking the insert result. | M01 since `b1697a8`, 2026-08-31; others followed the same pattern |
| `faculty_grading_queue` / `admin_grading_queue` (`20261005210000_one_pending_prove_it_submission.sql`) | List only `state = 'complete'`, so even a stored below-pass attempt would not reach faculty. | 2026-10-05 |

Reproduced: re-sending the identical payload returns
`23514 new row for relation "lab_attempts" violates check constraint "lab_attempts_complete_needs_passing_score"` (score 68).

**Not caused by Megan's work.** Her `lab_attempts`-related changes (#60 truthful
module cards, #63 optional attempt `id` for Help Desk evidence) are additive and
do not touch `state`, scores, the constraint, or the queues.

**Not a payload-size problem.** The full attempt (ticket, narrative notes, case
display rows) is ~3.5 KB of `jsonb`; the insert fails only on the constraint.

## Scope (audited 2026-10-17)

`state: 'complete'` sent unconditionally, so any score below 70 is dropped:

- SOC: `soc-analyst-module-01.js` (M01), `-02-environment.js`, `-03-environment.js`,
  `-04.js`, `-05.js`, `-06.js`, `-07.js`, `-08.js`, `-09.js`, `-10.js`, `-11.js`, `-12.js`
  (M12 even computes `completed = score >= pass && no critical errors` and still sends `complete`).
- AI/ML labs: every `ai-ml-module-NN.js` lab submit (their quizzes already use
  `passed ? 'complete' : 'in_progress'`).
- Already correct: `soc-analyst-module-02.js` independent lab and quiz, `soc-analyst-module-11.js` quiz,
  `it-support-module-12.js` (`passed ? 'complete' : 'in_progress'`); Help Desk evidence labs (`it-support-shared.js`) check the
  insert result and discard the upload on failure.

Hidden impact: the students who score lowest, who most need teacher notes,
are exactly the ones whose work never reaches a teacher.

## What the module-unlock gate already guarantees (unchanged by the fix)

`student_verified_module_progress` (`20261005120000_instructor_approval_gate_and_write_lockdown.sql`)
unlocks a module only for an attempt that is `state = 'complete'`, scored at or
above the pass mark, has no critical errors, and was approved by a different
(faculty) account with `redo_requested = false`. So letting below-pass attempts
*into review* cannot unlock a module.

## Proposed global fix (needs owner approval: production schema)

One migration, one central client change. No per-module edits needed for
the save path.

1. **Migration (staging first, then production by the owner):**
   - `alter type public.progress_state add value 'submitted';` meaning a
     below-pass attempt sent to faculty for review.
   - `faculty_grading_queue` and `admin_grading_queue`: `where la.state in ('complete', 'submitted')`.
   - Keep `lab_attempts_complete_needs_passing_score` and the unlock view as they
     are, so below-pass work is reviewable but can never unlock a module.
   - Rollback: recreate the two views with `state = 'complete'`; leave the enum
     value (Postgres cannot drop enum values; unused values are harmless).
2. **`recordLabAttempt()` in `portal/app.js` (the single choke point):** when
   `state === 'complete'` and `score < passThreshold`, write `state: 'submitted'`
   with `completed_at = now`. Every module is fixed at once.
3. **Never claim "submitted" on a failed save.** `recordLabAttempt()` dispatches
   `mnt:lab-attempt-save-failed` on any insert error; one global listener shows
   a persistent "Your submission did NOT reach your instructor, try again"
   banner. Module UIs keep their own copy, so each Prove It's submitted flag must
   also be rolled back on `saved === false` (M01 first, then the rest), or
   reconciled on load against `latestLabAttemptByKey` (DB truth).
4. **Unstick students already caught:** on module load, if the module's local
   state says submitted but the database has no attempt for that lab, clear the
   local submitted flag so the student can submit again.

Decision needed from the owner before step 1: **should a below-pass Prove It go
to the instructor for review (recommended: it is where per-section teacher notes
matter most)**, or be auto-returned to the student without faculty review
(then step 1 is skipped and step 2 maps to `in_progress` with a plain "not ready
for review yet" message)?

## Rules for whoever implements this

- Fix it in `recordLabAttempt()` plus the migration. Do not add per-module score
  checks around each `recordLabAttempt` call.
- Do not relax or drop `lab_attempts_complete_needs_passing_score`; it protects
  credit-hour awards and compliance reporting (see the migration's header).
- Do not touch `student_verified_module_progress`: below-pass work must never
  unlock a module.
- Migration: `supabase db push --dry-run` on staging first (`AI_AGENT_RULES.md`),
  with a rollback note in the PR; production only by the owner.
- Verify with a below-pass submission in each SOC module: the row exists
  (`state = 'submitted'`), it is in the instructor queue, a Return with
  per-section notes reaches the student, and the module stays locked.

## Follow-up

Apply the M01 failed-save rollback and stale-local-state unstick to the other
SOC Prove It modules (M02–M12) and the AI/ML Prove It modules. Their submit
handlers also optimistically persist a submitted latch and should clear it when
`recordLabAttempt()` resolves `false`, with load-time reconciliation against
the corresponding `latestLabAttemptByKey` lab key.

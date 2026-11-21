# BUG 2026-10-17: Module 1 can never be completed (approved passing Prove It does not unlock Module 2)

Found in the per-section notes UAT (`docs/handoffs/UAT_2026-10-17_SECTION_NOTES.md`, step 7),
on production, synthetic student `7634107909-SOCAN`: Learn It done, 9/9 lessons, Guided Lab
submitted, Prove It approved by faculty at 100%, yet `student_verified_module_progress`
says `soc-01 complete = false`, Module 2 stays locked and the program says "0 of 12 modules".

**Read this before touching `student_verified_module_progress`, the Module 1 Prove It
payload, or Module 1's `module_progress.detail` beacon.**

## Root cause

The soc-01 rule in `student_verified_module_progress` (latest definition:
`supabase/migrations/20261005120000_instructor_approval_gate_and_write_lockdown.sql`,
carried over from `20260918100000_module_one_faculty_performance_gate.sql`) requires two
things the current Module 1 can no longer produce:

| Requirement | Why it can't be met |
|---|---|
| The approved `lab-soc-escalation` attempt has `jsonb_array_length(result->'simulator_performance'->'actions') > 0` | `1add6d6` (2026-09-21, "Refine Module 1 case console workflow") replaced the simulator Prove It with the in-page case console; its `recordLabAttempt` result is `{ breakdown, feedback, critical_errors, case_record, case_display }`. No `simulator_performance`. |
| `module_progress.detail->>'quizPassed' = 'true'` | The module knowledge check was removed from the student flow ("redundant with Prove It"; `moduleOneQuizPanel()` is never inserted, see `portal/soc-analyst-module-01.js`). `quizPassed` stays `false` forever. |

Either one alone blocks every student who started Module 1 after those changes.
Students who completed earlier did it with old simulator attempts or an admin override.

Observed live: `detail = { consoleCompleted: true, lab2Completed: true, lessonsComplete: true, quizPassed: false }`;
approved attempt `state=complete, score=100`, no `simulator_performance`.

## Fix (approved direction: the Assessment Lab's passing, faculty-approved grade unlocks the next module)

One migration that recreates `student_verified_module_progress` **identically** except the
soc-01 rule:

- Replace the `simulator_performance.actions` check with a check that fits the case console:
  `la.result ? 'case_record'` (the submitted ticket is present).
- Drop the `quizPassed` requirement (the quiz no longer exists).
- Keep `lessonsComplete` and `lab2Completed`, the approval, score and critical-error rules, and
  `admin_override` exactly as they are.

Do not change any other module's rule. Do not change the client to fake `quizPassed` or
`simulator_performance`: the database rule should describe the course that exists.

Rollback: recreate the view from `20261005120000_...sql`.

## Verify

Local DB (`supabase db reset --local`): a student with `lessonsComplete`/`lab2Completed`
detail and an approved, passing `lab-soc-escalation` row carrying `case_record` is complete
for soc-01; without approval, below pass, or with critical errors it is not. Then the owner
runs `supabase db push` (staging, then production) and the UAT student's Module 2 unlocks.

## Fix

Added `supabase/migrations/20261017130000_module_one_completion_case_console.sql`.
It recreates `student_verified_module_progress` from
`20261005120000_instructor_approval_gate_and_write_lockdown.sql`, changing the
soc-01 case-console payload check to `la.result ? 'case_record'` and removing
only the `quizPassed` detail predicate. The approval, passing-score, critical
error, lessons, Guided Lab, admin override, and other-module rules are retained.

Verified on the local DB (`supabase db reset --local`, both 2026-10-17 migrations applied),
each case isolated by a savepoint and rolled back:

| Case | Expected | Result |
|---|---|---|
| a) approved, score 100, `case_record`, `quizPassed=false` | complete | complete; `module_progress` auto-synced to `complete` |
| b) passing but not reviewed | not complete | not complete |
| c) below pass (`submitted` 68), approved | not complete | not complete |
| d) critical error | not complete | not complete |
| e) `lessonsComplete=false` | not complete | not complete |
| h) approved passing, no `case_record` | not complete | not complete |
| g) soc-02 approved passing (other modules unchanged) | complete | complete |

The view is evaluated live, so students already stuck (approved passing M01 Prove It) unlock as
soon as the migration is applied; no backfill needed.

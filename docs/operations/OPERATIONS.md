# Operations: live data, cleanup, and retention

This repository's portal is a **live production application**.  It is not a
local demo database: `portal/supabase-config.js` names the production Supabase
project and `bin/dev.sh` connects to it.

Start operational work here. Do not reconstruct the data path from portal
code or use the UI as a substitute for a retention process.

## Control plane

| Need | Source of truth / entry point |
| --- | --- |
| Student, instructor, and admin identities | Supabase Auth plus `public.students` |
| Course teaching scope | `public.faculty_course_assignments` |
| SOC grading queue | `public.faculty_grading_queue` (or `public.admin_grading_queue` for academy admins) |
| In-portal messages | `public.student_messages` |
| Course and assessment records | `public.module_progress`, `public.lab_attempts`, `public.capstone_submissions`, and `public.portfolio_artifacts` |
| Cohort retention/archive | `supabase/migrations/20260901121000_cohort_archival_engine.sql` |
| Provisioning | `bin/provision-students.js` (requires `SUPABASE_SERVICE_ROLE_KEY`) |
| Test-account cleanup | `bin/purge-test-students.js` (dry run by default; requires `SUPABASE_SERVICE_ROLE_KEY` to execute) |

Never commit a service-role key, roster CSV, or password. The locally generated
roster output belongs in `bin/.roster-output/` (already gitignored) or an
institutional password vault.

## Routine retention

1. Keep active learners and current submissions in their course cohort.
2. At the end of a cohort, export the required academic record to the
   institution's restricted records repository, then close/archive the cohort
   through the cohort lifecycle. Do not delete genuine learner work merely to
   shorten the dashboard.
3. For disposable QA accounts, run a dry run first, verify the exact login
   IDs and dependent-record counts, then execute the purge with explicit IDs.
   Deleting the Auth identity removes its cascade-linked test work, messages,
   and roster row; it is intentionally not a bulk "delete all SOC" action.
4. Treat a zero-item grading queue as a workflow result, not a retention
   strategy. Reviewed work stays as an academic record; archive cohorts to
   keep the live list short.

## Current cleanup note (2026-09-22)

The SOC instructor account exposed two accounts whose only messages were
explicit test messages. Their IDs and work should be verified through the
dry-run command before deletion. The command prints only the records belonging
to the IDs passed to it; it never discovers and removes accounts by a fuzzy
"test" label.

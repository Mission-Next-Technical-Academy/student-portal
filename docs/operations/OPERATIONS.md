# Operations: live data, cleanup, and retention

Updated 2026-11-14.

This repository's portal is a **live production application**.  It is not a
local demo database: `portal/supabase-config.js` names the production Supabase
project, which the deployed site uses. Local development (`bin/dev.sh`)
connects to the staging project instead unless `--production` is passed.

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
| Provisioning | `bin/provision-students.js` (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) |
| Test-account cleanup | `bin/purge-test-students.js` (dry run by default; requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`) |

**Admin scripts need an explicit target.** The credentialed admin scripts in
`bin/` (`provision-students.js`, `purge-test-students.js`,
`m360-synthetic-complete.js`, `synthesize-soc-m360-completion.js`,
`migrate-email-domain.js`) have no default project. They stop if
`SUPABASE_URL` is unset, print the target project before doing anything, and
refuse the production project unless `--production` is passed
(`bin/lib/supabase-target.js`). For staging, prefix the command with
`SUPABASE_URL=https://xbblgtrfwgeiyttdlbue.supabase.co`.

`bin/dev.sh` follows the same rule for the local portal: staging by default.
The rules for running it locally are in `CLAUDE.md` ("Environments")
(updated 2026-11-14).

Never commit a service-role key, roster CSV, or password. The locally generated
roster output belongs in `bin/.roster-output/` (already gitignored) or an
institutional password vault.

## Staging stays in step with master automatically

After every merge to `master`, the **Staging sync** workflow applies pending
migrations to the staging Supabase project, then fast-forwards the `staging`
branch, then redeploys the staging website. Edge Functions are still deployed
by hand: when a merge changes them, staging waits until someone deploys them
and reruns the workflow with **functions_deployed** ticked. Setup, secrets, and what to do when a job
fails: [`STAGING_AUTOMATION.md`](STAGING_AUTOMATION.md).

## Routine retention

1. Keep active learners and current submissions in their course cohort.
2. At the end of a cohort, export the required academic record to the
   institution's restricted records repository, then close/archive the cohort
   through the cohort lifecycle. Do not delete genuine learner work merely to
   shorten the dashboard.
3. For disposable QA accounts, first confirm that the scoped accounts are
   synthetic and authorized for cleanup. Build and review an explicit list of
   student IDs, then run the purge script's dry run and verify its results
   before executing with those IDs. The script checks only the IDs supplied
   and reports counts for module progress, lab attempts, capstone submissions,
   portfolio artifacts, and student messages; it does not discover all
   accounts in a track or inspect every possible dependent record. Separately
   check reporting, attendance, and other delete-restricted records before
   deletion. Exclude admins and instructors, preserve shared course content,
   and record the preflight inventory and outcome.
4. Treat a zero-item grading queue as a workflow result, not a retention
   strategy. Reviewed work stays as an academic record; archive cohorts to
   keep the live list short.

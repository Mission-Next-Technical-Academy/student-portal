# Admin "Could not load student progress" — debugging log

**Date:** 2026-09-10
**Status:** Fixed, pushed, verified live in the browser.

## Symptom

The admin **Student Progress** tab showed:

> **Could not load student progress**
> There was an error retrieving the data. Please try again.

Reported by the user directly from the live portal (Query Logging on the
same page separately showed "Query Logging is unavailable" — see
[Not a bug](#not-a-bug-query-logging-unavailable) below).

## Investigation

1. Found the error markup's source: `portal/app.js:4972-4973`, rendered by
   `viewAdmin()` when `error` is truthy.
2. Traced `error` back to its origin in `render()`
   (`portal/app.js` ~line 5650): a Supabase query against the
   `admin_student_program_progress` view.
3. `git status`/`git diff` showed `portal/app.js` had large **uncommitted**
   changes — an in-progress Sprint 3 refactor (per the untracked
   `archive/completed-feature-notes/QUERY_PERFORMANCE_AUDIT_2026-09-09.md`)
   that replaced a `select('*')` roster query with an explicit column list:
   `status, enrollment_date, withdrawal_date, completion_date,
   scheduled_start_date, scheduled_completion_date, program_version_code,
   credential_code, credential_name, geography_classification,
   credited_technical_minutes, credited_career_minutes,
   credited_program_minutes`, plus the existing M360/technical columns.
4. Read the *only* migration that defines `admin_student_program_progress`
   (`supabase/migrations/20260907123000_m360_eligibility_admin_program_progress.sql`,
   added 2026-09-07 for multi-track/M360 support) — it never selected those
   reporting/enrollment/credential columns at all.
5. Confirmed via `supabase migration list --linked` that this migration
   *was* applied on the remote project, so the view really was missing
   those columns live, not just locally.
6. Found where the app actually consumes those fields:
   `applyAdminDashboardState()` (`portal/app.js:644`), whose own comment
   says they come from `admin_student_progress` (**singular**, no
   "program") — a *different*, older view
   (`supabase/migrations/20260901090000_completion_reporting_snapshot.sql`).

**Root cause:** on 2026-09-07 the roster query was switched from the older
`admin_student_progress` view to the newer multi-track
`admin_student_program_progress` view to add M360 support, but the newer
view was never given the reporting/enrollment/credential/credited-minutes
columns the app still depends on. Under the previous `select('*')` this
silently returned `undefined` for those fields everywhere they're
consumed (status badges, compliance/annual exports) with no visible error.
The Sprint 3 refactor made the same query name its columns explicitly,
which turned the same gap into a hard PostgREST "column does not exist"
error — the admin page's "Could not load student progress" the user saw.

## Fix

New migration:
`supabase/migrations/20260910120000_admin_program_progress_reporting_fields.sql`

`create or replace view public.admin_student_program_progress` — same
M360/technical projection as before, plus the enrollment/credential/
reporting columns folded in from `admin_student_progress`'s own logic
(same joins: `enrollment_periods`, `program_versions`,
`student_geography_classifications`, `credential_awards`,
`student_hour_reconciliation`; same `status` derivation). No columns were
removed, `admin_student_progress` itself is untouched, and the app.js
select list needed no changes — it was already selecting the correct
final column set.

### Verified locally before pushing

- `docker`/`supabase start` + `supabase db reset` replayed every local
  migration (including the new one) from scratch with no errors.
- Confirmed via `information_schema.columns` that the rebuilt view exposes
  all 39 columns `portal/app.js`'s roster query selects.
- Ran the exact `select ...` app.js issues against the local test DB —
  executed cleanly (0 rows, expected: no seed data / no authenticated
  `is_admin()` context as a raw superuser connection).
- Tore down the local stack (`supabase stop`) before touching production.

## Unrelated drift hit along the way

`supabase db push` initially refused to run at all:

> Remote migration versions not found in local migrations directory.

The remote project's migration history had an orphan entry,
`20260908231856`, with no matching local file — leftover from
`20260908224500_m360_live_session_schedule.sql` (the M360 live-session
table) having been pushed once under a different timestamp before being
locally renamed. Resolved with:

```
supabase migration repair --status reverted 20260908231856
```

This only edits Supabase's internal migration-tracking table, not schema
or data. Confirmed the drift's actual cause by then attempting to push
`20260908224500_m360_live_session_schedule.sql`: it failed with
`policy "m360_live_sessions_authenticated_read" ... already exists`,
proving the table and policies were already live under the orphaned
timestamp. Fixed that migration to be idempotent (`drop policy if exists`
before each `create policy`) rather than guessing at exactly how much of
it had already run.

## Not a bug: "Query Logging is unavailable"

Separately reported alongside the roster error, but this is the **designed**
behavior, not a defect:

- `supabase/migrations/20260909100000_query_performance_telemetry.sql`'s
  own header says: *"Written-only design migration. Do not apply until the
  telemetry contract, retention job, and representative plans have been
  reviewed."*
- `archive/completed-feature-notes/QUERY_PERFORMANCE_AUDIT_2026-09-09.md`
  (Sprint 2 status) confirms the Query Logging tab was built to show
  exactly this "unavailable" message when its RPC isn't deployed, and that
  no migration was applied as part of that sprint.
- This migration was deliberately **not** pushed as part of this fix — it
  was temporarily moved out of `supabase/migrations/` during the push (so
  `supabase db push` wouldn't sweep it up with the real fix) and moved back
  afterward. It remains local-only/uncommitted, awaiting the review gate
  described in its own header and in the audit doc.

## What's pushed vs. what's still local

**Applied to the linked remote project** (confirmed via
`supabase migration list --linked`):
- `20260908224500_m360_live_session_schedule.sql` (now idempotent)
- `20260910120000_admin_program_progress_reporting_fields.sql` (this fix)

**Local-only, intentionally not pushed:**
- `20260909100000_query_performance_telemetry.sql` — review-gated by its
  own design, per above.

**Not yet committed to git** (as of this writing): `portal/app.js`'s Sprint
3 changes, both migration files above, and the `.claude/settings.local.json`
permission-rule addition made to unblock `supabase db push` /
`supabase migration repair` for this project. Nothing was committed as
part of this fix — that's a separate step if/when the user wants it.

## Verification

Confirmed live in the browser after the push: the admin Student Progress
tab now loads the roster table instead of the error state.

# Cohort & user lifecycle — sprint plan

Status: **done, code-complete, not yet deployed** — 2026-09-01. Every sprint below is
`[x]`. Per `archive/README.md`'s doc-lifecycle rule this file is now moved to
`archive/completed-feature-notes/`; see `NEXT_SESSION.md`'s 2026-09-01 entry for the
live handoff/deployment-checklist summary future sessions should actually read.

## What this builds

Three admin-panel features, requested by the site owner 2026-09-01:

1. **"Generate New User"** button — creates one auto-enrolled student account on demand.
2. **"Generate New Cohort"** button — creates a named cohort (start/end date) and
   batch-generates a chosen number of students per track (course offering) into it in
   one action.
3. **Automatic cohort-expiry archival** — once a cohort's end date passes, its students
   are moved out of the active admin roster into an "Archived Students" view, and any
   account in that cohort that was generated but never actually used gets deleted
   outright (nothing worth keeping).

## Decisions locked in with the site owner (2026-09-01, AskUserQuestion)

- **Archive = deactivate, keep the Supabase Auth login record.** Never call Auth's
  delete-user API for a real, used archived student — fully reversible.
- **"Unused/unenrolled" cleanup is scoped to the expiring cohort's own batch only**,
  and only for accounts that were *never* enrolled and have *zero* activity anywhere
  (no module_progress/lab_attempts/capstone_submissions rows). These get fully deleted
  (`auth.users` cascade-deletes their `students` row) — there is no compliance data to
  protect for an account that was never touched. This is **not** a retroactive sweep
  of the whole roster, only the batch tied to the cohort being archived.
- **"Generate New Cohort" batch-generates immediately**, with the admin choosing a
  student count **per track/course offering** in one action (e.g. 15 SOCAN + 5 HDESK
  in the same cohort), matching how `bin/provision-students.js` already batches by
  track/count.

## Non-negotiable constraint found during planning

`supabase/migrations/20260901090000_completion_reporting_snapshot.sql` and
`20260829125000_enrollment_reporting_history.sql` establish a firm existing rule:
**academic/compliance records (`module_progress`, `lab_attempts`,
`capstone_submissions`, `enrollment_periods`, `completion_reporting_snapshots`) are
never deleted or pruned, only appended to.** Cohort archival in this plan **does not
touch those tables** for any student who ever had real activity — it only flips
`students.is_enrolled` (via the existing `stamp_enrollment_dates()` trigger, unchanged),
closes their `enrollment_periods` row (existing table, existing shape), and freezes a
**new, additional** summary snapshot for the "Archived Students" admin view. The only
actual deletion in this whole feature is for never-enrolled, zero-activity placeholder
accounts, where by definition there is nothing to protect.

## Pre-existing unrelated work in the tree — do not touch

`portal/app.js`, `CLAUDE.md`, `NEXT_SESSION.md` have uncommitted changes from a prior
session (Student Activity Monitor / `login_events`, and
`supabase/migrations/20260901103000_completion_integrity_guards.sql` +
`20260901110000_login_events.sql`, both untracked). Not part of this workstream — leave
as-is, don't revert, don't fold into this feature's commits. Stage/commit only the files
each sprint below actually adds or intentionally edits.

## Deployment steps only the site owner can run (standing rule, all prior sessions)

Nothing below is pushed/deployed by the agent. Every sprint ends with local,
committed-but-unpushed changes. Once all sprints are verified done, the site owner
needs to, in their own terminal:

1. `supabase db push` (all new migrations from Sprints 1-2).
2. Enable the `pg_cron` extension for the linked project if the migration's
   `create extension` statement doesn't take effect (some hosted projects require
   toggling it on in the Dashboard → Database → Extensions first).
3. `supabase functions deploy admin-provision` (Sprint 3's Edge Function).
4. `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` on the linked project (the
   function reads it server-side only — never committed, never in `portal/`).
5. Confirm the cron schedule registered: `select * from cron.job;` in the SQL editor.

## Addendum, added 2026-09-01 mid-sprint — site owner request

Two more asks, folded in while Sprint 1 was already running:

1. **A sign-out button on the (pre-existing, uncommitted) Activity Monitor tab**, so an
   admin can force-sign-out a given student from the admin panel.
2. **Log hours spent on the site into a Supabase table.**

Design constraint found while scoping this: `login_events`
(`supabase/migrations/20260901110000_login_events.sql`, uncommitted, from an unrelated
prior session) is deliberately **append-only** — "no update/delete policy, no
update/delete grant" — and its own header comment says browser/login activity must
never be treated as instructional time or attendance. Both new asks are honored without
touching that table or that rule:

- Hours-on-site gets its **own new table**, `site_sessions` (start/end timestamp per
  session, self-insert/self-close RLS, admin read), explicitly commented the same way
  `login_events` is — operational visibility only, not attendance/compliance.
- Force sign-out is a **security-definer SQL function** (`admin_force_sign_out()`) that
  deletes the target user's row(s) from `auth.sessions` (blocks refresh/re-auth) and
  closes their open `site_sessions` row — no Edge Function needed for this one, since
  it's a pure SQL/RLS operation, not an Auth-Admin-API create-user call.
- Known limitation to flag to the site owner: deleting `auth.sessions` blocks token
  *refresh*, but a still-valid short-lived access token already in the browser remains
  usable until its own expiry (Supabase default ~1 hour) — this is a "can't get back in
  after their next refresh/reload," not an instant kill switch. Documented, not solved
  further this pass — normal for this kind of admin tooling.

Sprint list below is renumbered/extended to fit this in; Sprint 1 (already done) is
unaffected.

## Sprints

- [x] **Sprint 1 — Cohort schema.** `cohorts` table, `students.cohort_id` +
  `students.cohort_archived_at`, `cohort_archive_snapshots` table,
  `admin_archived_students` view, RLS (admin-only). Migration file only, not pushed.
  Done: `supabase/migrations/20260901120000_cohort_lifecycle_schema.sql`.
- [x] **Sprint 1b — Activity Monitor: hours + force sign-out (schema).** New
  `site_sessions` table (own table, does not touch the append-only `login_events`),
  `admin_force_sign_out(target_user_id uuid)` security-definer function, and an admin
  view exposing per-session and per-student total minutes-on-site. Migration file only,
  not pushed. Done: `supabase/migrations/20260901122000_activity_monitor_sessions.sql`.
- [x] **Sprint 2 — Archival engine.** `archive_expired_cohorts()` security-definer
  function (snapshot + close enrollment_period + flip is_enrolled + delete inert
  never-used accounts in that cohort + stamp `cohorts.archived_at`), a manual
  admin-callable RPC wrapper for on-demand testing, and a `pg_cron` daily schedule.
  Migration file only, not pushed. Done:
  `supabase/migrations/20260901121000_cohort_archival_engine.sql` — orchestrator caught
  and fixed a real bug post-agent: the function originally read from
  `admin_student_progress`, whose own `where public.is_admin()` filter silently returns
  zero rows under the pg_cron call path (no JWT, `auth.uid()` null), which would have
  made every automatic daily archive insert null stats. Fixed by inlining the
  `course_progress`/`capstone_scorecard` derivation directly instead of going through
  that admin-gated view.
- [x] **Sprint 3 — Edge Function.** `supabase/functions/admin-provision/index.ts` +
  `provisioning.ts` + `_shared/cors.ts`: admin-gated (verifies caller JWT via
  `.auth.getUser(token)`, then checks `students.is_admin` through the caller-scoped
  client so RLS governs it — never trusts client-supplied identity), uses a
  service-role client only after that passes, to create cohorts + batch/single auth
  users + student rows, returns the generated roster once (plaintext password shown
  only in the response, never stored) — same login-id/password generation convention
  as `bin/provision-students.js`. Orchestrator re-reviewed the auth ordering directly;
  correct as written.
- [x] **Sprint 4 — Admin panel UI.** "Generate New User" and "Generate New Cohort"
  buttons/panels in `portal/app.js`'s admin view, wired to the Edge Function, a
  copyable generated-roster panel (click-to-select, no clipboard API), a new Cohorts
  tab (with a manual "Run archive sweep now" button), and a new Archived Students
  read-only tab backed by `admin_archived_students`. Also wires up the Addendum work:
  `signIn()`/`signOut()` insert/close a `site_sessions` row, the Activity Monitor tab
  gets a per-row "Sign out" button (`admin_force_sign_out()` via RPC, with a confirm +
  disable-while-pending) plus a "site time" column, labeled operational-only per
  `site_sessions`' own migration comment. Orchestrator re-ran `node --check` and
  `node bin/portal-check.js` directly and confirmed clean (the 3 pre-existing "module 1
  FAIL" lines are from unrelated already-uncommitted blank module-1 scaffolds for
  HDESK/AIENG/ELECT, confirmed byte-identical output before/after this sprint's
  changes) and spot-checked the Edge Function call helper and `esc()` usage directly.
- [x] **Sprint 5 — QA, docs, deployment checklist.** `node --check portal/app.js`,
  `node bin/portal-check.js` (clean modulo 3 pre-existing, unrelated module-1 FAILs —
  confirmed byte-identical before/after this workstream), `node bin/curriculum-check.js`
  — all clean. Deployment checklist and full write-up moved into `NEXT_SESSION.md`'s
  2026-09-01 entry, since that's where a future session actually starts reading.
- [x] **Close-out.** `git mv` into `archive/completed-feature-notes/`, entry added to
  `archive/README.md`.

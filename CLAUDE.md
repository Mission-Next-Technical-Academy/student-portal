# Read this first

**Before doing anything else this session, read `NEXT_SESSION.md`.** Its
top-of-file handoff block is the current entry point for unfinished work
(as of 2026-09-01: the idle sign-out timer turned out to have no
server-side enforcement — it only ever worked if the exact browser tab that
opened the session stayed alive and unthrottled. Fixed with a heartbeat
column plus a `pg_cron` sweep, `close_idle_site_sessions()`, mirroring
`archive_expired_cohorts()`'s guard pattern
(`supabase/migrations/20260901150000_site_sessions_idle_enforcement.sql`) —
**pushed and confirmed live** (`supabase db push`, then verified directly:
`site_sessions.last_seen_at` exists, `close_idle_site_sessions()` exists,
and the `close-idle-site-sessions` pg_cron job is registered and active on
a `*/5 * * * *` schedule). Separately, "Generate New Cohort" no longer
takes an end date (always start date + 6 weeks) and a legacy-account
credential backfill both shipped and are already deployed. Older open
items: a student reported no green "complete" badges on modules after
refreshing the portal, not yet reproduced — environment, account, and
console-error details are still needed from the user before this can be
debugged. The admin per-student reset still needs a polished in-page
snapshot/restore modal instead of a plain confirm popup, and
`STUDENT_LOGIN_COURSEWORK_REDIRECT.md`'s post-login redirect spec is written
but not yet coded in `portal/app.js`'s `wireLogin()`).

`CURRICULUM_ALIGNMENT_ARCHITECTURE.md` section 0 has the authoritative sprint
status table if `NEXT_SESSION.md` is ever out of date relative to it. As of
2026-08-31: all 16 local Supabase migrations are confirmed applied on the
linked remote project (`supabase migration list --linked`) —
`REPORTING_REMEDIATION_CONTINUATION.md` still said the four newest
migrations were "written only, not pushed"; that claim was stale, now
corrected inline in that file.

Doc lifecycle rule (`archive/README.md` "When to archive a doc"): once every
task/checkbox in a root-level md doc — including a `NEXT_SESSION.md` sprint
entry — is done and verified, move it into `archive/` with `git mv` rather
than leaving it at the root. Don't archive anything still partially open.

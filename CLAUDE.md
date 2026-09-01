# Read this first

**Before doing anything else this session, read `NEXT_SESSION.md`.** Its
top-of-file handoff block is the current entry point for unfinished work
(as of 2026-09-01: "Generate New Cohort" no longer takes an end date — it's
now always start date + 6 weeks, computed in `admin-provision`'s
`handleCreateCohort` — but that Edge Function still needs
`supabase functions deploy admin-provision --project-ref eokvngifirjgfozzbieu`
before the change is live. A 60-minute auto sign-out on inactivity was also
added to `portal/app.js`, but its migration (`20260901140000_site_sessions_
idle_timeout.sql`) is not yet pushed — it'll fail its own RLS check until
`supabase db push` runs. Also flagged: three prior migrations plus the
`record-login-geo` function are already live on the remote database but
still uncommitted in git — `NEXT_SESSION.md`'s completion-integrity-guards
entry had gone stale claiming otherwise, now corrected inline. Older open
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

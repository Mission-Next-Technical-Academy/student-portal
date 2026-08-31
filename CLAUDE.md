# Read this first

**Before doing anything else this session, read `NEXT_SESSION.md`.** Its
top-of-file handoff block is the current entry point for unfinished work
(as of 2026-08-29: the admin per-student reset needs a polished in-page
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

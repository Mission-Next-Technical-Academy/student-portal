# Read this first

**Canonical execution source:** read `ROADMAP.md` before this historical
status summary. It is the single delivery queue, locks Module 1's required
beginning-of-course LMS orientation tour, and defines the CI/CD workflow.
Where this file conflicts with it, `ROADMAP.md` wins.

**Mandatory lab/assessment standard:** before changing any Learn It, Practice
It, Prove It, simulator, assessment/scoring, or instructor/admin review code,
read `docs/LAB_ASSESSMENT_STANDARD.md`. Module 1 is the Academy UX reference;
every Prove It requires durable instructor review, readable student writing,
competency-based partial credit, and support for multiple valid investigative
paths.

**2026-09-20 (out-of-queue owner sprint, not a `ROADMAP.md` item):** a
universal, program-agnostic Academy first-login orientation tour shipped —
see `ACADEMY_ORIENTATION_SPRINT.md`, `portal/orientation.js` /
`orientation.css`, and the `20260920100000_academy_orientation_state.sql`
migration (already pushed to the linked Supabase project). Welcome → Academy
nav/programs/help → the student's program → module structure → Module 1 →
Learn It/Practice It/Prove It → how grading/review works, all fed from
`PROGRAMS`, spotlighting real DOM, no dim/blur once the student is inside
their program. Live-verified twice end to end as a fresh SOC Analyst
account; the no-rail (IT Help Desk-style) fallback was verified by removing
the rail node and re-invoking the engine directly, not against a real live
HDESK account — worth a real pass later. **This is explicitly not**
`ROADMAP.md` item 1's Module 1 Day 1/rules-of-engagement tour (still open,
owned by `ui/coach.js`'s `m01-orientation` coach) — see the sprint doc's
"Relationship to `ROADMAP.md` item 1" section before touching either system.
Also fixed in passing: misleading "auto-enrolled" copy on the admin
"Generate New User" panel (the provisioning behavior itself — ad hoc
single-account creation starts unenrolled — is intentional, documented in
`supabase/functions/admin-provision/provisioning.ts`, not a bug).

**As of 2026-09-16:** the lab grading & notification system (per-card "N
Labs need grading" badges scoped to each course's own workspace, pregraded-lab
review, instructor per-mistake feedback + full-resubmission redo, and the
70%/redo module-completion gate) is fully built, pushed, and verified — see
`lab-grading-notification-system/STATE.md`. That same session then added
real sequential module-access gating (a module requires every prior module
in the program complete, not just the one before it), a cross-device
completion beacon for Module 1 (its detailed quiz/console/lab requirements
previously lived only in browser-local storage), and a red "Redo Requested"
status pill. **One real gap left, permission-blocked:** three SOCAN
training accounts need the same Module 1 beacon backfill as a fourth
already-fixed one — the batch admin write was blocked by the harness's
"Modify Shared Resources" classifier; see that STATE.md's last section for
exact values. (This may also be the root cause of the older "no green
complete badges after refreshing" report below — not confirmed, worth
checking if it recurs.)

Active work is now the sibling curriculum project,
`soc-analyst-track-reimagining/` — read **that directory's `STATE.md`
first**. Owner resolved all 4 open questions 2026-09-15/16 (see
`REBUILD_PLAN.md`), and real curriculum changes have shipped: Module 09 has
a ticket-assignment framing panel (Phase 3), and Module 06 now explains its
hunt was triggered by Module 05's finding (Phase 4, Arc C proof of
concept). Phases 1 and 2 are closed with no code needed beyond the admin
grading-queue breakdown fix (`portal/app.js`) — a first attempt at a
student-facing version was reverted after finding students already had
this. **Still open:** Arc A (Modules 02+03) and Arc B (Modules 07+04) are
designed but need real fixture reconciliation between each pair before
building — flagged as needing an owner content-review checkpoint, unlike
the mechanical changes shipped so far. See `REBUILD_PLAN.md`'s Phase 4.

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

# Site session / login log retention — research only, no plan yet

## Why this exists

Site owner, looking at the Student Activity Monitor admin tab (2026-09-06):
"the list for the logs is very long...not sure when they should be scrubbed."
This doc answers "what do we actually know" so a future session can draft an
archival/scrubbing plan (including whether to delegate pieces of it to
cheaper subagents) without re-deriving the compliance research from scratch.
**Nothing below has been implemented.**

## What's actually growing

Two tables, both admin-visible on the Activity Monitor tab:

- `public.site_sessions` — one row per real `signIn()` call (not per tab/
  refresh). 63 rows as of 2026-09-06, oldest `2026-09-01`, newest today. Real
  student sign-in volume has barely started (pre-November per
  [[mnt-academy-portal]]) — most rows so far are one admin account
  (`7355312413-ADMIN`) and browser-automation test logins, not real student
  traffic.
- `public.login_events` — one row per sign-in attempt (append-only, per its
  own existing self-documentation). 68 rows, same timeframe.
- `public.user_ip_history` — new this session (Decision 4,
  `SESSION_SECURITY_SPEC.md`), 2 rows. Grows one row per (student, distinct
  IP) pair, not per login, so it grows far slower than the two tables above.

At current volume this is nowhere near a storage problem. The site owner's
complaint is about the **admin UI's list being long and undifferentiated**
(no date filter, no pagination visible in the Activity Monitor tab), which is
a UX question, separate from whether the underlying rows should ever be
deleted or archived.

## What the compliance docs actually require (they say nothing about these tables)

Read in full for this doc: `Reportingrequirements.txt` (CIE minimum LMS
recordkeeping rules) and `ASSESSMENT_REPORTING_SPEC.md` (maps those rules
against actual implementation). Neither mentions login/session telemetry.
What they require permanent retention of is **academic** record data:

- Rule 6E-2.0041(11): "academic transcript... retained permanently for each
  student."
- Rule 6E-1.003(63) / 6E-2.0041(1)(c): progress records and evaluation of
  student work.

That maps to `module_progress`, `lab_attempts`, `capstone_submissions`,
`completion_reporting_snapshots`, and `student_course_hour_awards` — all
already documented elsewhere (`NEXT_SESSION.md`'s 2026-09-01 "completion/
score integrity" entry, `COHORT_USER_LIFECYCLE_SPRINT_PLAN`'s archival design)
as **permanent, append-only, never touched by any sweep** — the existing
`archive_expired_cohorts()` job explicitly excludes them by design.

`site_sessions` and `login_events` are a different category. Every place
they're introduced in this repo's own history says so explicitly:
`COHORT_USER_LIFECYCLE_SPRINT_PLAN`'s Activity Monitor section labels both
"operational-visibility-only... never wired into attendance/compliance,"
and `login_events`'s own migration comment says the same about itself. **No
CIE rule cited anywhere in this repo requires keeping these forever, and no
CIE rule requires deleting them on any particular schedule either** — this is
a pure product/ops retention decision, not a compliance-mandated one, unlike
every table in the paragraph above.

One partial exception worth flagging, not resolving here: `login_events.
geo_country`/`geo_city`/`flagged_suspicious`/`flag_reason` are the only audit
trail for a `geo_blocked` or `block_suspicious` security event
(`SESSION_SECURITY_SPEC.md` Decisions 2 and 4). If those rows are ever
scrubbed, security incident history goes with them — a security-retention
question, not a CIE one, and probably wants a much longer window (or a
separate never-scrubbed security-events table) than ordinary sign-in noise.

## Feasibility notes for whoever drafts the actual plan

- **Time-based archival is straightforward** for `site_sessions`/
  `login_events` specifically, precisely because nothing depends on their
  long-term presence the way `module_progress` etc. do. A `pg_cron` sweep
  following the exact pattern already established by
  `archive_expired_cohorts()`/`close_idle_site_sessions()` (both `security
  definer`, both guarded by the `is_admin() OR current_user = 'postgres'`
  idiom, both already registered jobs) is the natural shape — this repo
  already has the pattern, not a new one to invent.
- **Decide archive vs. hard-delete before writing SQL.** An "Archived
  Sessions" tab mirroring the existing "Archived Students" tab (which stores
  `cohort_archive_snapshots`, a frozen summary, not the raw rows) is one
  option; a straight `delete... where started_at < now() - interval '...'`
  with no archive table is simpler but loses the raw rows entirely. The
  site-owner call on "any use for old rows past N days" (debugging a
  disputed login? none at all?) determines which.
- **The security-audit exception above needs its own answer** before a
  single retention window is picked for everything — e.g., a shorter window
  for ordinary rows, a longer one (or none) for
  `flagged_suspicious`/`geo_blocked` rows specifically.
- **UEBA's own anti-gaming logic depends on `user_ip_history`, not
  `site_sessions`/`login_events`.** Scrubbing the latter two doesn't affect
  Decision 4's habitual-IP arbitration either way — `user_ip_history` is a
  separate, much smaller table and wasn't part of the site owner's "long
  list" complaint.
- **The UI complaint (long undifferentiated list) can be addressed
  independently of any retention/deletion decision** — a date-range filter
  or pagination on the Activity Monitor tab fixes the immediate "hard to
  read" problem without deciding anything about data lifecycle. Worth
  separating "make it readable" from "decide what to keep" as two different
  pieces of work, possibly two different agents.

## Explicitly not decided here

- Any specific retention window (30 days? 90? 1 year?).
- Archive-then-delete vs. straight delete.
- Whether flagged/geo-blocked rows get a separate, longer retention rule.
- Whether the Activity Monitor UI gets a filter/pagination fix as a
  prerequisite or a parallel track.
- Whether this becomes one lettered-sprint plan with subagents per piece
  (schema/migration, UI filter, admin archive tab) the way
  `COHORT_USER_LIFECYCLE_SPRINT_PLAN` was structured, or a single small pass
  — that's the next session's call once the site owner answers the open
  questions above.

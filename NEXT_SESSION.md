# Next session — start here

## Session 2026-09-01 (latest, done — needs a push) — idle sign-out had no server-side enforcement

Site owner tested the idle timer directly: left a real admin tab open,
checked back over an hour later, and it was still signed in and still
showing as one open `site_sessions` row (69 minutes idle at check time).
Root cause, confirmed against the live DB (`supabase db query --linked`):
the idle timer from the "auto sign-out on inactivity" entry below is
**entirely client-side** — a `setTimeout` in one browser tab. It only ever
fires if that exact tab is still open, not backgrounded/throttled/discarded
by the browser to save memory, and running the code version that shipped
after that tab's last full reload (a JS change never retroactively attaches
to an already-open tab). If any of those isn't true, nothing is watching
the clock and the session sits open forever — there was no server-side
backstop at all, unlike `admin_force_sign_out()` which actually revokes
`auth.sessions`.

Also traced the site owner's other question ("why does the Activity Monitor
only show my own login?") to the data, not a bug: only 6 `site_sessions`
rows exist total, all `7355312413-ADMIN` — no other account has ever
actually signed in through the real login flow yet (expected pre-November).
One stray `login_events` row for `8987495051-SOCAN` at 09:50 UTC has no
matching `site_sessions` row because that login happened before
`20260901122000_activity_monitor_sessions.sql` had been pushed yet that same
day — a one-time deploy-ordering artifact, not a current defect.

**Fix, site owner approved building real enforcement (not just documenting
the limitation):** `supabase/migrations/20260901150000_site_sessions_idle_
enforcement.sql`:
- `site_sessions.last_seen_at` — a heartbeat column, bumped by
  `portal/app.js`'s new `maybeSendHeartbeat()` on the same real-activity
  events `resetIdleTimer()` already listens for, throttled to roughly once
  per 5 minutes (`MNT_HEARTBEAT_INTERVAL_MS`).
- `site_sessions_self_close` replaced with `site_sessions_self_update`, a
  single RLS policy covering both the heartbeat write (ended_at stays null)
  and the existing self-close write (ended_at set, ended_reason
  `user_signed_out`/`idle_timeout` only).
- `close_idle_site_sessions()` — same `is_admin() OR current_user =
  'postgres'` guard idiom as `archive_expired_cohorts()`
  (`20260901121000_cohort_archival_engine.sql`), so it works both as an
  admin-callable RPC and as a JWT-less `pg_cron` job. Force-closes any open
  session whose `last_seen_at` (falling back to `started_at` for a
  pre-migration row that never got a heartbeat) is older than 60 minutes,
  then revokes the student's real `auth.sessions` row **only if they have no
  other still-open session** — an idle tab timing out must never sign out a
  genuinely active tab the same student has open elsewhere. Registered on
  `pg_cron` every 5 minutes (`close-idle-site-sessions`), not daily like the
  cohort sweep — this is a security control, not once-a-day housekeeping.
- Tested in a rolled-back transaction against the live linked project before
  writing this entry — applied cleanly, `close_idle_site_sessions()` ran
  without error. `node --check portal/app.js` clean.

**Not yet pushed.** Needs `supabase db push` before the sweep actually runs
— until then, the client-side timer alone is still all that exists (same
gap as before, not made worse). Keep `MNT_IDLE_TIMEOUT_MS` (portal/app.js)
and the `interval '60 minutes'` in `close_idle_site_sessions()` in sync by
hand if the timeout duration ever changes — they're two independent
definitions of "60 minutes," one in JS and one in SQL, not a shared
constant.

## Session 2026-09-01 (done — both pieces deployed) — idle timer migration pushed + record-login-geo actually deployed

Site owner looked at the Student Activity Monitor and asked two questions
that both traced back to work that was written but not yet live. Both are
now fixed, deployed, and verified:

1. **"Shouldn't the 1-hour idle timer have signed these out?"** It hadn't,
   because `20260901140000_site_sessions_idle_timeout.sql` (see the "auto
   sign-out on inactivity" entry below) was still local-only — the
   client-side timer in `portal/app.js` was already running, but a real
   idle sign-out would have failed the `site_sessions_self_close`
   RLS/CHECK constraint. Ran `supabase db push --linked` (site owner
   approved; the auto-mode classifier blocks this as a production DB
   action when attempted unprompted). CLI printed a non-fatal warning
   ("failed to cache migrations catalog" / missing
   `pgdelta-target-ca.crt`) from its local delta-catalog step, unrelated to
   whether the migration applied — confirmed applied via a fresh
   `supabase migration list --linked`, `20260901140000` now matches on
   Local and Remote.
2. **"Why is the Location column always `—`?"** Because `record-login-geo`
   was never actually deployed as an Edge Function, contrary to what the
   "completion/score integrity migration" entry's first correction had
   claimed (now further corrected there). `supabase functions list` showed
   only `admin-provision` as ACTIVE; 0 of 10 `login_events` rows had
   `ip_address` populated. Ran
   `supabase functions deploy record-login-geo --project-ref eokvngifirjgfozzbieu`
   — now `ACTIVE` per `supabase functions list`. The client call
   (`recordLoginGeo()`, `portal/app.js:176`) correctly passes the session's
   real `access_token` as a Bearer token, satisfying both the function
   gateway's `verify_jwt: true` and the function's own internal auth check.

**Note for whoever looks at the Activity Monitor next:** neither fix
backfills existing rows — the idle timer only starts protecting sessions
that are active from now on, and Location only populates for sign-ins that
happen after this deploy. The rows already visible in the site owner's
screenshot (all before this push) will keep showing `—` and won't
retroactively get idle-timed-out.

## Session 2026-09-01 (done — needs a deploy) — cohort default duration + legacy credential backfill

Two site-owner-requested mini-sprints, each done via a spawned subagent
(reviewed and verified after the fact, not blindly trusted):

1. **Cohorts are always exactly 6 weeks now — no End Date field.** Every
   published track is a fixed 6-week/12-module curriculum (README.md,
   MODULE_STANDARD.md, CURRICULUM_MAP.md, CURRICULUM_ALIGNMENT_
   ARCHITECTURE.md all agree, "no track deviates"), so requiring an admin
   to separately type an end date when generating a cohort was one
   unnecessary field. Removed `#gen-cohort-end` from the "Generate New
   Cohort" admin panel (`portal/app.js`) and its wiring; `supabase/
   functions/admin-provision/index.ts`'s `handleCreateCohort` now computes
   `end_date` itself as `start_date + 42 days` (UTC-safe math, not
   calendar-day arithmetic that could drift a day across timezones) instead
   of accepting it from the request. No schema/migration change — `public.
   cohorts.end_date` and its `check (end_date >= start_date)` constraint
   are untouched, just always satisfied by construction now. `node --check
   portal/app.js` clean; `deno check` skipped (Deno not installed in this
   environment) — worth running once before or during the deploy below if
   Deno is available where the site owner runs it.
   **Not yet deployed** — the code change alone does nothing live until:
   ```
   supabase functions deploy admin-provision --project-ref eokvngifirjgfozzbieu
   ```
   No `supabase db push` needed for this one.

2. **Backfilled plaintext passwords for 8 pre-`student_credentials`
   accounts.** The admin panel's "view credentials" action was showing "No
   stored password for this account" for any account created by the older
   `bin/provision-students.js` script (2026-08-28) before `public.
   student_credentials` existed — e.g. `5520852787-SOCAN`, the account the
   site owner actually hit. Those passwords were never lost, just never
   written to Supabase — they're in the gitignored `bin/.roster-output/
   *.csv` roster files the script itself wrote at creation time. Backfilled
   via a verified, pre/post-counted `supabase db query --linked` insert
   (`insert ... on conflict (student_id) do nothing` — never overwrites an
   existing row): of 81 distinct student_ids across the 5 CSVs, 8 existed in
   `public.students` with no `student_credentials` row and got backfilled
   (`7355312413-ADMIN`, `3073074090-AIENG`, `5364909556-AIENG`,
   `9752398313-AIENG`, `8987495051-SOCAN`, `4437023872-SOCAN`,
   `9334491415-SOCAN`, `5520852787-SOCAN`); the other 73 no longer exist in
   `public.students` at all (they're the same 73 zero-activity disenrolled
   accounts already deleted per `HANDOFF_ADMIN_CREDENTIALS_VIEW.md`), so
   nothing was inserted for those — correct, not a gap. Spot-checked
   `5520852787-SOCAN` against its CSV row: matches exactly. **Already live**
   — this was a direct data write against the linked production database,
   not a migration; nothing further to push or deploy for this one.

## Session 2026-09-01 (done) — auto sign-out on inactivity

Site owner asked for session control: no auto sign-out existed after login,
only the manual "Sign out" button and admin `admin_force_sign_out()`. Added a
60-minute client-side inactivity timer (`portal/app.js`: `MNT_IDLE_TIMEOUT_MS`,
`resetIdleTimer()`, `wireIdleSignOut()`, wired at `DOMContentLoaded`) that
calls the existing `signOut()` — now `signOut(reason = 'user_signed_out')` —
with `reason: 'idle_timeout'` so the Activity Monitor's `site_sessions` rows
can distinguish a walked-away session from a real click. Needed a schema
change: `site_sessions.ended_reason` and the `site_sessions_self_close` RLS
policy only allowed `'user_signed_out'`/`'admin_forced'`/`'superseded'` —
widened by `supabase/migrations/20260901140000_site_sessions_idle_timeout.sql`.
**Not yet pushed** — needs `supabase db push` before the idle-timeout path
will actually work in production (until then, a real idle sign-out attempt
would fail the CHECK constraint). `node --check portal/app.js` clean;
`bin/portal-check.js` currently can't run past `signIn()` for an unrelated,
pre-existing reason (see below), so this wasn't exercised through that
harness — verify manually in a browser (or fix the harness) before trusting
it fully.

Also confirmed while answering "where is the Location/IP column": it already
existed (Student Activity Monitor tab, `portal/app.js` `formatLoginLocation()`
and the "Location" header, fed by `login_events.geo_city/geo_region/
geo_country` + `record-login-geo`) — not a gap, just not committed yet (see
the correction below). Trimmed the tab's over-long caption paragraph per the
site owner's request mid-session.

**`bin/portal-check.js` is currently broken past any `signIn()` call** —
unrelated to this session's work, pre-existing in the uncommitted
`recordLoginEvent()` code: the test harness's stub Supabase mock's `insert()`
returns `{ error: null }` directly, but `recordLoginEvent()` chains
`.select('id').single()` after it, which the stub doesn't support
(`TypeError: ...insert(...).select is not a function`). Confirmed via
`git stash` that the harness passes clean without today's `portal/app.js`
changes reverted — i.e. this is a mock-vs-real-client gap introduced whenever
`recordLoginEvent()`'s `.select().single()` chain was added, not something
this session's idle-timeout edits caused. Worth fixing the stub (or the call)
next time `bin/portal-check.js` needs to actually run end to end.

## Session 2026-09-01 (later, done — needs the site owner's deployment steps) — cohort/user lifecycle: generate users/cohorts, auto-archive on expiry, Activity Monitor hours + force sign-out

Full write-up: `COHORT_USER_LIFECYCLE_SPRINT_PLAN.md` (about to be archived to
`archive/completed-feature-notes/` since every sprint box in it is now checked).
Short version: three site-owner-requested admin panel features, built across six
sprints this session. On 2026-09-01, all listed migrations were pushed and
`admin-provision` was deployed; its remote registry state is ACTIVE. The
remaining work is the operational smoke-test checklist below, including cron
registration and a logged-in admin flow.

**What was built:**
1. **"Generate New User" / "Generate New Cohort"** admin buttons — create one
   account, or a whole named cohort (start/end date + a chosen student count per
   track) in one action. Needed a real backend, not just a DB write: creating a
   Supabase Auth user requires the service-role key, which must never reach the
   browser — so this is the repo's first Supabase Edge Function
   (`supabase/functions/admin-provision/`), admin-JWT-gated, called from
   `portal/app.js`'s new panels.
2. **Automatic cohort-expiry archival** — a daily `pg_cron` job
   (`archive_expired_cohorts()`) that, once a cohort's end date passes, freezes a
   summary of each real student into `cohort_archive_snapshots` (visible in the new
   admin "Archived Students" tab), closes their `enrollment_periods` episode, and
   flips `is_enrolled` false — **never touches `module_progress`/`lab_attempts`/
   `capstone_submissions`/`completion_reporting_snapshots`**, which stay
   permanent/append-only per this repo's existing compliance rule. Separately, any
   account in that same cohort that was generated but genuinely never used (never
   enrolled, zero activity anywhere) is deleted outright — there's no compliance data
   to protect for those. An admin can also trigger the sweep on demand from the new
   Cohorts tab instead of waiting for the daily run.
3. **Activity Monitor additions** (mid-session addition, requested after Sprint 1 was
   already running): a per-student "site time" figure (`site_sessions` table, a new
   table separate from the pre-existing append-only `login_events`) and a "Sign out"
   button that revokes a student's session server-side
   (`admin_force_sign_out()` — deletes their `auth.sessions` row, which blocks
   re-auth past their next token refresh/reload; it does not instantly kill an
   already-issued access token still live in their browser, a documented, accepted
   limitation). Both are explicitly labeled operational-visibility-only in the UI —
   never wired into attendance/compliance, matching how `login_events` already
   documents itself.

**One real bug caught and fixed mid-session, worth knowing about:** the archival
function originally read student stats from `public.admin_student_progress`, whose
own view definition ends `where public.is_admin()`. That check depends on
`auth.uid()`, which is only ever set inside a real PostgREST/JWT request — under the
`pg_cron` call path (the actual daily production path) there is no JWT, so that
filter would have silently zeroed out every archived-student snapshot, forever, with
no error. Fixed by inlining the same `course_progress`/`capstone_scorecard`
derivation directly instead of routing through that admin-gated view. Worth
remembering as a general pattern: a `where public.is_admin()`-gated view is not safe
to query from inside a `pg_cron`-invoked function, even a `security definer` one —
`security definer` only changes which role's table *privileges* apply, not whether
`auth.uid()` resolves to anything.

**Deployment steps — none of this is live until the site owner runs, in their own
terminal, in this order:**
1. `supabase db push` — applies the four new migrations (
   `20260901120000_cohort_lifecycle_schema.sql`,
   `20260901121000_cohort_archival_engine.sql`,
   `20260901122000_activity_monitor_sessions.sql`, plus whatever order the two
   unrelated pending migrations from the concurrent session land in —
   `supabase migration list --linked` is the way to confirm what's actually live
   afterward, not this file).
2. If `create extension if not exists pg_cron;` doesn't take effect: enable `pg_cron`
   via Dashboard → Database → Extensions first, then re-run the push (or just the
   cron-scheduling statements) — expected on some hosted projects, not a bug.
3. `supabase functions deploy admin-provision`.
4. `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` on the linked project (the
   function reads it server-side only; it is not committed anywhere and never appears
   in `portal/`).
5. Confirm the cron job registered: `select * from cron.job;` in the SQL editor —
   should show `archive-expired-cohorts` at `0 6 * * *`.
6. Smoke-test once live: use "Generate New Cohort" with a 1-day-ago end date (or
   generate a normal cohort and manually update its `end_date` in the SQL editor) to
   verify the archival sweep and the Archived Students tab actually round-trip against
   real data before trusting the daily cron silently.

**Not done, deliberately out of scope this pass:** no CSV/file download for a
generated roster (on-screen click-to-select table only); no UI to edit/delete a
cohort after creation; `admin_force_sign_out()`'s `auth.sessions` DELETE has a
documented Edge-Function fallback noted in its own migration comment in case the
hosted project's grants block it — untested against the live project since nothing
is pushed yet.

## Session 2026-09-01 (done — now pushed; correction below) — completion/score integrity migration

A bug-bounty-style pass found that `module_progress`, `lab_attempts`, and
`capstone_submissions` RLS (`user_id = auth.uid()` ownership only) let a
student write their own `state='complete'` and `score` values directly via
the same Supabase client call the app already uses
(`markModuleCompleteRemote()` / `upsertModuleProgress()`,
`portal/app.js:2704`/`2665`) — nothing server-side ever checked that a
completion or score reflected real lab work. Since
`20260901090000_completion_reporting_snapshot.sql`, that write is no longer
just a UI badge: it triggers an immutable clock-hour credit award
(`student_course_hour_awards`) and freezes an append-only official
compliance snapshot used by the CIE/Form 801 PDFs — so this was a path to a
forged official completion record, not just a cosmetic bug.

**Fix written:** `supabase/migrations/20260901103000_completion_integrity_guards.sql`.
Adds same-row CHECK constraints (a lab attempt can't be `complete` with a
scored, failing result; a capstone score can't be `complete`-shaped without
passing its own critical-error gate; `module_progress` can't claim `complete`
without `percent=100` and a `completed_at`) plus two triggers: one blocking a
module from reaching `complete` unless the student's distinct count of
*completed* lab attempts in that track is at least the number of modules
they're claiming complete (closes the free/instant full-track forgery; it's
a ratio floor, not a per-module proof — see the migration's own header for
what it does *not* solve, and why: the modules/labs catalogue that would let
SQL verify a specific lab belongs to a specific module was deliberately
dropped in `20260828160000_simplify_schema.sql` in favor of
`portal/data.js`), and one making a completed module immutable except for an
admin.

**Correction, 2026-09-01 (later session):** the paragraph above said this
session deliberately did not push and left the file local-only pending
review. That's now stale — `supabase migration list --linked` shows
`20260901103000` (this file), plus `20260901110000_login_events.sql` and
`20260901130000_login_event_geo.sql`, all matched on Local and Remote, i.e.
**already applied to the live database**. Only the git commit never
happened: `git status` still shows all three as untracked. So the guard
logic described above (attack-tested pre-push, 0 existing violations) is
live and protecting real student data right now, but the migration files
themselves aren't in version control yet — the working tree and the
database have drifted apart. Whoever picks this up next should `git add`
and commit those three files so git matches what's actually deployed, rather
than re-reviewing them as if they were still pending. Confirmed via
`supabase migration list --linked` and `supabase db query --linked` on
2026-09-01.

**Correction, 2026-09-01 (later still):** the "`record-login-geo`, also live
but uncommitted" claim two lines up is itself wrong — `supabase functions
list --project-ref eokvngifirjgfozzbieu` shows only `admin-provision` as
ACTIVE; `record-login-geo` was never deployed. Confirmed against data too:
`select count(*) filter (where ip_address is not null), count(*) from
public.login_events` returns `0` of `10` rows with an IP — the migration
(`20260901130000_login_event_geo.sql`, columns only) is live, but nothing
has ever populated them because the function that would call `fetch()` to
this Edge Function 404s. This is why the Student Activity Monitor's
Location column shows `—` for every row. **Still needs:**
`supabase functions deploy record-login-geo --project-ref eokvngifirjgfozzbieu`.

Original attack-testing note, still accurate as a description of what the
guards do: every constraint was checked against the live linked project
inside a transaction that was rolled back (nothing committed) before this
file was written — 0 existing violations except 4 `lab-soc-environment`
(ungraded walkthrough) rows with a null score, which is why the score check
allows null rather than requiring a passing number. The guard logic itself
was then attack-tested the same way (rolled back, zero persisted changes): a
fresh account with zero lab attempts is blocked from faking even one module
(let alone a batch of 12); a student with one genuine passing lab can
legitimately complete one module but not a second; a low-score lab attempt
marked `complete` is rejected; reverting a completed module is rejected.

If tighter enforcement is wanted later, the real fix is moving lab grading
server-side or reintroducing a lab_key→module_key mapping table — both
bigger, separate decisions, deliberately not made here.

## Session 2026-08-31 (open, blocked on info) — student reports no completion badges after refresh

**Symptom, in the user's words:** "no green lights on completed modules" after
refreshing the portal. Not yet reproduced — the report came in with no
environment or account attached, and the session ended before that follow-up
arrived.

**What "green lights" means in this codebase:** the `complete` state in
`STATE_STYLES` (`portal/app.js` ~line 3152), rendered by `moduleCard()`. Its
source of truth is `moduleCompletion()` (`portal/app.js:2866-2892`): a module
counts as complete when `contentOpened && allLabsComplete`, drawing on (a)
`loadModuleEngagement(user)` / localStorage, keyed by
`moduleEngagementId(program.slug, moduleKey)` = `` `${programSlug}:${moduleKey}` ``,
and (b) `user.remoteModuleProgress[moduleKey]` from Supabase. Module 1 has an
extra special case requiring `LabRuntime`'s own `consoleCompleted` flag.

**What this session did immediately before the report, and why it's probably
unrelated:** renamed `portal/module-NN.{js,css}` to
`portal/soc-analyst-module-NN.{js,css}` (program-prefixed, to keep every
track's module filenames distinct — see the two commits below) and pushed.
None of `moduleCompletion()`'s data sources are filename-keyed, so a rename
alone shouldn't blank out completion state. GitHub Pages redeployed
successfully right after the push (`gh run list --workflow=pages.yml`: run
33429625933, completed success, 2026-08-31T19:16:10Z) — so if the user
refreshed a live-site tab *before* that redeploy landed, that alone could
explain a stale/broken page and would not be a real regression. This is a
hypothesis, not a confirmed cause.

**Relevant commits:** `b1697a8` (cohort PDF linkage detail + sortable admin
columns — unrelated feature work, bundled the file renames in because `git
mv` auto-stages), `78ee752` (the module rename itself, new
it-support/ai-ml/electrical module-1 stubs, and every reference to the old
filenames updated — `index.html`, `bin/curriculum-check.js`,
`bin/portal-check.js`, `bin/run-module-agents.sh`). Both verified clean with
`node bin/curriculum-check.js` and `node bin/portal-check.js` before pushing.

**Still needed before this can be debugged — ask the user:**
1. Local dev server (`127.0.0.1:8768`) or the live/deployed portal?
2. Which student login, and which specific module(s) should show complete
   but don't?
3. Any red errors in the browser console (F12 → Console) on page load —
   especially a 404 on a `soc-analyst-module-*.js` file, which would mean the
   rename broke a reference this session missed.

**Once that's known, check in this order:** (1) console/network tab for a
404 on any renamed portal file, (2) that tab's `localStorage` for the
`moduleEngagement` entry and the specific `moduleId` key, (3) the student's
`remoteModuleProgress` row in Supabase for that module, (4) step through
`moduleCompletion()` at `portal/app.js:2866` with real values to see which of
`contentOpened` / `allLabsComplete` is false.

Local dev servers were running at the time of the report: portal on
`127.0.0.1:8768` (pid 29253), simulator on `127.0.0.1:8767` (pid 29247).

## Session 2026-08-31 (later, done) — cohort PDF linkage detail + sortable admin columns

Both sprints below are done and verified — see
`archive/completed-feature-notes/COHORT_PDF_LINKAGE_AND_SORTABLE_COLUMNS_2026-08-31.md`
for the full write-up. Short version: the cohort PDF now prints a
"Student-to-Program Linkage Detail" table (credential, enrollment date,
scheduled start, completion date) backing the compliance badge that used to
claim those fields without showing them; the admin table's 8 column headers
are now clickable sort controls with a persisted, null-safe sort that
survives `render()`'s full DOM rebuilds. Both verified live against the
running dev server; `node --check portal/app.js` and
`node bin/portal-check.js` clean.

## Session 2026-08-31 — Help Desk status check, git/Supabase sync audit, markdown cleanup

**Help Desk (`it-support`/HDESK) course — status: not started beyond
labels/reference docs, and git and Supabase agree on that.**

- Git: `portal/data.js`'s `it-support` program entry has `isPublished: false`
  and its 12 modules are built via the `skeleton()` helper — module titles
  only, `status: 'draft'`, `summary: 'Curriculum content for this module is
  being authored.'` No lesson, lab, or assessment content exists for this
  track anywhere in `portal/` or `ui/`. (`ui/helpdesk.js` /
  `ui/helpdesk-data.js` are unrelated — they're part of the old SC-200
  simulator's ticket-queue widget, last touched 2026-08-17, not an IT Help
  Desk course track.)
- Supabase (live, confirmed via `supabase db query --linked`): 20 `HDESK`
  track_code student accounts exist (provisioned alongside SOCAN/AIENG/ELECT
  per `bin/provision-students.js`), and `module_progress`'s `track_code`
  check constraint already accepts `'HDESK'`. No module_progress rows exist
  for them, which is consistent with there being no course content to
  attempt yet — not a bug.
- Reference material only, not build work: the four Form 301/curriculum docs
  under `MNT Academy - IT Help Desk Curriculum Build-.../` (and the matching
  `.zip`) are source material for a future Help Desk curriculum build, per
  `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` §1: "The IT Help Desk skeleton's 12
  module labels already match that program's recommended mapping, but it is
  not publishable... This SOC wave must not invent that missing Help Desk
  decision." That's still true — nothing in this session changed it.
- **Conclusion: no sync problem for Help Desk specifically** — both sides
  correctly reflect "not built yet." If a Help Desk build sprint is wanted,
  it starts from zero (no existing lesson data to migrate or reconcile).

**Supabase migration sync, checked broadly (not just Help Desk):** all 16
local migration files under `supabase/migrations/` are applied on the linked
remote project (`supabase migration list --linked` — Local and Remote match
on every timestamp through `20260829133000`). Two handoff docs
(`REPORTING_REMEDIATION_CONTINUATION.md`, and this file's own prior wording)
still described the four newest migrations as unpushed — that was stale;
corrected in place. If you're ever unsure whether a migration is live, that
command is the fast check — no need to re-derive it from doc trails.

**Markdown cleanup:** moved 15 completed/historical root-level docs into
`archive/legacy-sc200-simulator/` and `archive/completed-feature-notes/`
(see `archive/README.md` for the full list and reasoning). Nothing was
deleted — git history is intact. Root now holds only docs that are either
current/open work or still-accurate reference material for shipped code.
Two files were checked and confirmed **still open, not archived**:
`STUDENT_LOGIN_COURSEWORK_REDIRECT.md` (the redirect it specs is not present
in `wireLogin()` in `portal/app.js` — still just a spec) and the polished
in-page reset/snapshot modal requested in the session below (no
`reset-modal`/snapshot-modal code found in `portal/app.js` either — still
just `ADMIN_RESET_FLOW.md`'s manual AI-agent runbook as a workaround).

None of this changed any code — it's a documentation/organization pass only.
The two open items above (student post-login redirect, admin reset modal)
remain the actual next-session work, same as they were before this pass.

## Session 2026-08-29 (current) — admin dashboard runtime fix

The admin route in `portal/app.js` had a render-path scope bug and a half-migrated enrollment flow. This session fixed both: `dashboardRows` now survives the admin render branch, and the enrollment toggle writes `students.is_enrolled` directly to Supabase on change with an inline disenrollment confirm. The stale local pending/save-button flow was removed; report export still works and now reflects the remote enrollment state plus local report-run history.

User follow-up: the reset flow should not be a plain confirm popup. The requested shape is:

- reset the student progress for real,
- capture a recoverable student snapshot before the reset,
- present that snapshot in a polished in-page modal using the same typography as the rest of the portal,
- make the report copyable so it can be pasted into an AI if the reset was accidental.

## Session 2026-08-29 (later) — live demo-data generation + concurrent-edit note

Two things happened this session, run alongside a **separate, concurrent
Codex-driven session editing this same repo at the same time** (visible in
`HANDOFF.md`'s "Admin enrollment toggle refinement" / "Admin dashboard
follow-up" entries dated the same day) — read that concurrency note before
touching `portal/app.js`'s admin dashboard code.

**1. Real demo progress data generated via the actual app UI, not direct DB
writes.** To make the admin dashboard show believable multi-student, multi-
completion-level data live, four already-provisioned SOCAN training accounts
were driven through Modules 1-3 for real (genuine coach/console completion,
correct evidence/query/timeline answers sourced from `portal/data.js` and
each `module-0N.js`'s own answer key, real form submits) — not synthetic
Supabase inserts. All three modules passed for every account (Module 1:
100/100 coached result, Module 2: 75/100, Module 3: 100/100), confirmed live
via the admin `#/admin` dashboard and the Sprint H.1 student-detail
drill-down. Accounts used (credentials in `bin/.roster-output/SOCAN-*.csv`):
`8987495051-SOCAN`, `4437023872-SOCAN`, `9334491415-SOCAN`,
`5520852787-SOCAN`. All four currently sit at 3/12 modules (25%) — the
original plan was to differentiate them further (targets ~100/50/35/25%) but
the session was stopped before Module 4 was attempted for any account. This
is genuinely live in Supabase, not a display trick — it will persist until
someone resets it.

Mechanically: Module 1 needed one deliberate shortcut — the coach's
completion signal is a crossorigin `postMessage` from the simulator
(`127.0.0.1:8767`) back to a popup window, and this environment's browser
automation could not get a real popup past Chrome's popup blocker after
repeated attempts. Instead of skipping Module 1, `moduleOneReceiveCoachCompletion()`
(the same handler the real postMessage would call) was invoked directly from
the portal's own page context — same code path, same `recordLabAttempt`/
`LabRuntime` calls a real message would trigger, just without physically
driving the simulator tab. Modules 2 and 3 were driven with no shortcuts:
real station reviews, a real KQL-style query typed into Module 3's editor,
real evidence-checkbox and timeline-reorder interactions, real radio/textarea
answers.

**2. `ASSESSMENT_REPORTING_SPEC.md` added** — maps `Reportingrequirements.txt`
(CIE minimum LMS requirements) against actual current state: which of the 7
requirements are met, which are genuine gaps (attendance/clock-hours,
enrollment/withdrawal status and dates, an evaluator/supervision concept,
Form 801 reporting counts), and documents every SOC module's real assessment
format (rubric categories, weights, 70/100 pass threshold, Module 12's
ten-domain-plus-critical-error-gate shape) read directly from the module
source, not invented.

**Concurrent-edit note, important:** a `portal/app.js` edit made earlier
this session (a per-student "Reset Progress" button, `data-admin-reset` /
`setAdminResetProgress`) was **superseded and removed** by the concurrent
Codex session's own admin-dashboard rework — confirmed by re-grepping the
file: `data-admin-reset` and `setAdminResetProgress` no longer exist in
`portal/app.js`. That concurrent session made a reasoned call (documented in
`HANDOFF.md`'s "Audit correction" entry) that the local-storage-only
reset/enrollment approach was fundamentally flawed — a display mask, not a
real reset, browser-specific, no test coverage — and replaced it with a real
`students.is_enrolled` column (`supabase/migrations/20260829100000_admin_enrollment.sql`,
already pushed and confirmed live per that session's own notes) plus a
Supabase-backed enrollment toggle. **Do not re-add a local-only reset
button** — if a per-student progress reset is still wanted, it should follow
the same real-backend pattern that migration established, not the
`localStorage` pattern it replaced.

---

## URGENT handoff (2026-08-28, later session — read before anything else)

The curriculum-alignment wave is fully closed out, pushed, and **live**.
`git log --oneline -6` on `master` should read `d341ee6`, `0d5dac1`, `2de91d2`,
`0ef74c8`, `227bb5c`, `e4903e1`, `57ac7cc` — all pushed to `origin/master`,
all deployed via the Pages workflow, both migrations applied to the live
Supabase project. If any of that isn't true when you're reading this,
something regressed — treat it as news, not the expected state.

1. `e4903e1` — **Admin-only redirect.** Router sends any `user.isAdmin`
   session to `#/admin` on every navigation path, not just post-login.
2. `227bb5c` — **Sprint H.1, student detail drill-down.** Dropdown + detail
   panel on the admin dashboard. Surfaced a real gap: `module_progress` /
   `lab_attempts` / `capstone_submissions` only had "own row" RLS policies,
   so admin queries against them were silently admin-scoped. Fixed by
   `supabase/migrations/20260828170000_admin_student_detail.sql`.
3. `0ef74c8` — **Sprint G, final QA sweep.** Full syntax/render/browser pass,
   prohibited-language scan, stable-key diff, exact-hours reconciliation —
   all clean. Fixed a `const hash` reassignment in `render()`'s admin-redirect
   block that threw and left every admin session on a blank page, plus
   several prohibited-language leftovers from before the Sprint C rename.
4. `d341ee6` — **Fix: in-progress students invisible on the admin dashboard.**
   Found via **real live UAT after deploy** (not a synthetic test): logged in
   as an actual admin and an actual SOCAN student against the deployed site
   + live Supabase project, opened Module 1 as the student (a genuine
   `module_progress` row with `state = 'in_progress'` was written), then
   checked the admin dashboard — it still read Not Started 81 / In Progress 0.
   Root cause: `course_progress` only ever counted `state = 'complete'`, never
   `'in_progress'`, so a student who'd started but not finished anything was
   indistinguishable from one who'd never logged in — true for most active
   students most of the time in a 12-module course. Fixed by
   `supabase/migrations/20260828180000_course_progress_in_progress_count.sql`
   (adds `modules_in_progress`, appended at the end of each view's column
   list — `create or replace view` errors [42P16] if you insert a new column
   anywhere but the end) plus the matching `portal/app.js` changes. **Re-verified
   live after this fix deployed**: dashboard correctly read Not Started 80 /
   In Progress 1, and the H.1 dropdown/detail panel correctly showed the test
   student's real module status. Test student `8987495051-SOCAN` (roster CSV
   in `bin/.roster-output/`) now legitimately has that in-progress row in the
   live DB — harmless (rotatable training account, no real PII), left as-is
   unless you want it cleared.

`CURRICULUM_ALIGNMENT_ARCHITECTURE.md` section 0 shows every sprint (A-H, the
redirect, H.1, G) as done, each with its commit hash — the in-progress fix
above isn't a lettered sprint, it's a live-UAT finding, not yet reflected there.
Release readiness is still gated on external sign-offs — see that doc's
section 9 "Release boundary" (Form 301 comparison, curriculum-lead/compliance-
reviewer/faculty approval) — none of that changes just because the repo is
now internally consistent and live.

A new `Reportingrequirements.txt` file (CIE reporting/recordkeeping
requirements) appeared in the repo root this session, untracked — not
something this session wrote or committed; leaving it alone as reference
material unless told otherwise.

Also worth knowing: `supabase db push` is consistently blocked for the
assistant by Claude Code's auto-mode classifier (a live/destructive-action
gate) — every migration this session (`20260828170000`, `20260828180000`)
needed the site owner to run `supabase db push` themselves in their own
terminal. Plan for that step explicitly in any future migration work.

---

Repo: `~/Mission_Next_Technical_Academy_SOC_Analyst_course` (branch `master`).

```bash
cd ~/Mission_Next_Technical_Academy_SOC_Analyst_course
bin/launch.sh                 # portal on :8768, simulator/capstone on :8767
node bin/portal-check.js      # every module lab renders
node bin/lab-state-check.js   # lab state stays isolated across resets
node bin/render_all.js        # every simulator view renders; current baseline is 129/129
```

Student account for the SOC Analyst track: `user2` / `user2`.
Module 1 lives at `http://127.0.0.1:8768/#/program/soc-analyst/module/1`.

## What just changed (2026-08-18, this session)

Update 2026-08-19: Wave 3 is complete. Modules 07–09 now provide isolated
semi-independent network/email, vulnerability/exposure, and incident-response labs.
All three passed integration and browser QA. The old `purview/audit` render baseline
was also fixed; `node bin/render_all.js` is now 129/129 with zero dead routes.

Three foundation commits plus the final feedback commit, all verified in headless Chrome:

- `034d271` — Wave 2 module labs (Modules 04, 05, 06) integrated, plus a shared-runtime
  fix: `LabRuntime.freshState()` shallow-spread its defaults, so learner selections
  mutated each module's `MODULE_*_DEFAULT_STATE` constant and a lab reset handed the
  polluted arrays back. Defaults are deep-cloned now; `bin/lab-state-check.js` guards it.
- `95bb88e` — Module 1 rework: walkthrough starts in the alert queue, the student performs
  every action, and the investigation timeline is filled in rather than revealed.
- `873df15` — the coach became a bottom instruction bar that advances on the student's
  action instead of a floating card with a Next button.
- Final Module 1 feedback pass — removed the floating M launcher and intermediate coach buttons;
  all four actions use amber waiting states and auto-advance; restart clears stale sign-in
  filters; timeline facts are strict correct-answer gates with green success feedback and
  clearly boxed character masks whose fixed punctuation is skipped during typing or paste.

Full detail is in `HANDOFF.md` (bottom four sections) and
`MODULAR_LAB_PROGRAM_PROGRESS.md` (Wave 2 gate review).

## Module 1 flow as it now stands

1. Foundations lessons and the alert card (portal).
2. **Required console walkthrough** — 5 coach steps starting at `#/defender/alerts`:
   open alert A1701 → read the alert pane and take its highlighted "Investigate sign-ins
   for this account" pivot → filter the log to j.santos → read the eight failures and
   open the highlighted 09:09:41 success → return.
   Steps marked `require` accept a click only on the highlighted control; all four action
   steps show a non-clickable amber waiting chip, briefly turn green when complete, and
   auto-advance when their `check()` passes. There is no floating launcher or Next press.
3. **Investigation timeline, filled in** — facts 1-3 are fill-in-the-blank sentences
   (count, account, IP, time, result, location, device status, risk) typed from what the
   log showed. Each typed character has its own box; fixed punctuation is skipped when a
   full value is typed or pasted. Normalized matching, marked wrong fields, hints after
   the first miss, and all hints after the second. There is no answer bypass: each fact
   must be correct to unlock the next one, and a correct answer pops green. Fact 4
   (service-desk callback) is handed over. Unscored — practice, not assessment.
4. **Triage worksheet** — the graded artifact, unchanged (pass mark 70).

## Where the pieces live

| Concern | File |
|---|---|
| Module 1 view, wiring, scoring | `portal/module-01.js` |
| Module 1 scenario, evidence, blanks (`template` / `blanks` / `accept`) | `portal/data.js` (`MODULE_ONE_ALERT_ORIENTATION`) |
| Module 1 styles including `.m01-blank` | `portal/module-labs.css` |
| Coach engine: bar, spotlight, scope lock, required-action lock, auto-advance | `ui/coach.js` |
| Coach scripts (steps, `instruction`, `require`, `check`, `waitLabel`, `nudge`) | `ui/coach-data.js` |
| Coach bar + scrim + required-control styles | `ui/styles.css` (search `coach-bar`) |
| Simulator views (alert pane pivot `data-pivot="signin-logs"`) | `ui/views.js` |

## Open items, roughly in priority order

1. **Roll the Module 1 pattern outward.** Modules 02-06 still use the reveal-then-decide
   shape. The pieces that generalize: `require` steps, auto-advance, fill-in-the-blank
   recall, console-before-worksheet ordering.
2. **A second, unguided Module 1 alert.** Same difficulty, no coach, different story
   (impossible travel or MFA fatigue rather than password spray), scored the same way.
   This is the "did you actually learn it" half of the module and does not exist yet.
3. **Difficulty note from Wave 1** — Modules 02 and 03 were built before the difficulty
   gradient reached the briefs and read heavier than the ramp calls for at week 1-2.
   Left as built; revisit if they feel steep in use.

4. **Admin enrollment reset model** — enrollment persistence is live through
   `students.is_enrolled`, but disenrollment must not delete assessment history.
   Design an append-only reset/status log (or equivalent enrollment epoch) before
   completing the Save flow. Add the planned Save progress file export after
   that model is settled.

## Auth, backend simplification, and provisioning — ✅ DONE (as of 2026-08-29)

**`architecture.md` at the repo root is the authoritative, current doc for all of this —
read that first, it supersedes everything below and the old `SPRINT_PLAN.md` numbering for
this workstream.** All six sprints are now complete and live:

- Sprint 1 — `supabase/migrations/20260828160000_simplify_schema.sql`: drops
  `profiles`/`enrollments`/`module_entitlements`/`programs`/`modules`/`labs`, rewrites
  `module_progress`/`lab_attempts`/`capstone_submissions`/`portfolio_artifacts` to key by
  `module_key`/`lab_key`/`track_code` text instead of uuid FKs, redefines `course_progress`
  as a live rollup view. **Pushed and applied to the live project** — confirmed 2026-08-29
  via `supabase migration list` (`20260828160000` shows on both Local and Remote). The site
  owner ran `supabase db push` themselves, since Claude Code's auto-mode classifier blocks it
  as a destructive action.
- Sprint 2 — `module_progress` writes wired into `portal/app.js`. **Live-verified**: the
  `d341ee6` UAT session generated a genuine `in_progress` `module_progress` row from a real
  student login, proving the write path works end to end.
- Sprint 3 — `lab_attempts` writes wired into `portal/app.js` + all 12 `module-*.js` files
  (the "already-scored" half only — the simulator→portal result contract for modules 2-12
  is still unbuilt, a future sprint). Pushed and live; not yet specifically smoke-tested with
  a real lab submission.
- Sprint 4 — `capstone_submissions` writes wired into `portal/module-12.js` (one upserted row
  per student at `stage=12`). Pushed and live; not yet specifically smoke-tested with a real
  Module 12 pass.
- Sprint 5 — commit + push + deploy. Landed as `57ac7cc`, live on `master`, deployed via the
  Pages workflow.
- Sprint 6 — provisioning. All 81 accounts exist (`ADMIN 1`, `SOCAN 20`, `HDESK 20`,
  `AIENG 20`, `ELECT 20`), run directly by the site owner in their own terminal (not
  delegated, per the standing rule on the service-role key). Roster CSVs sit in
  `bin/.roster-output/` (gitignored). Still worth moving to a real password manager before
  handing any out to actual students, mainly so the only copy of each password isn't a single
  un-backed-up CSV.

**Nothing blocking left in this workstream.** Worthwhile next step, not urgent: a real smoke
test of Sprint 3/4's writes (submit a module lab and pass Module 12 as a real student, confirm
`lab_attempts`/`capstone_submissions` rows land) — Sprint 2's write path is already proven live,
these two aren't yet.

**Important side effect of that provisioning run, fixed this session:**
`bin/provision-students.js` (pre-fix) wrote every non-ADMIN account into `public.enrollments`
too (resolving `program_id` via a live `programs` table lookup) — a leftover from the old
enrollment-based access model. That means `enrollments` now has ~80 real rows, which
contradicts Sprint 1 migration's own code comment claiming that table is confirmed empty.
**This is fine to drop anyway** — site owner confirmed: those rows are fully redundant with
`students.track_code` (every one is `status=active, access_mode=full`, program mechanically
implied by track_code), and accounts are rotatable across cohorts, so no real data is lost.
But the script itself would have started hard-failing on every future provisioning run once
Sprint 1's migration landed (since it queries `programs`, a table being dropped) — **already
fixed**: `getProgramId()`/`insertEnrollment()` and their call site were removed from
`bin/provision-students.js` this session. Confirmed `node --check` clean, no other behavior
changed.

**Concurrent workstream, different session/agent, same repo — not a conflict but worth
knowing about:** `CURRICULUM_ALIGNMENT_ARCHITECTURE.md` (new this session) governs a
separate curriculum-content-alignment wave (Codex-driven, its own sprint lettering A-G).
Sprint A already landed additive `compliance`/`curriculumItems` metadata into
`portal/data.js`. That plan explicitly locks `soc-01`..`soc-12` module keys, lab keys,
routes, and runtime IDs as immutable, and explicitly names `architecture.md`'s backend
simplification as something it does not supersede — so no actual conflict with Sprints 1-4
above. Its future sprints (C/D) will edit `module-01/04/05/06/08/10/12.js` for label/copy
changes — those files now also carry this session's `recordLabAttempt`/
`recordCapstoneSubmission` additions, so whoever runs that workstream's next agent should
make sure it reads current file state, not a stale pre-session copy.

**Sprint 5 (git commit + push to `master` + live deploy) has not happened.** Nothing from
this session is committed. This remains a deliberate, site-owner-confirmed action per
`architecture.md` — do not do this without an explicit go-ahead in the moment it happens,
separate from any earlier general permission.

**Still-open design questions from `architecture.md`, unchanged:** none blocking right now —
the `enrollments`/`module_progress` vs `lesson_progress` simplification questions raised
earlier this session were resolved by the Sprint 1 migration (enrollments dropped,
`course_progress` redefined as a rollup view). Nothing else currently blocking.

Separately, a stray local `supabase start` Docker stack (14h uptime, crash-looping) was found
running for this same project earlier this session and was stopped (`supabase stop`) — not
the cause of any of the above, noted here so it isn't mistaken for still being up.

## Conventions that matter

- Each module agent owns exactly `portal/module-NN.js` + `portal/module-NN.css`. Shared
  files (`portal/app.js`, `portal/lab-runtime.js`, `portal/module-registry.js`) are the
  orchestrator's.
- Every CSS selector in a module file is `.mNN-` prefixed.
- No module before 12 may reference `8767`, `SIM_ORIGIN`, `simEntry`, or the capstone
  route — except Module 1's coach launch, which is scoped to two pages by the coach's
  `allow` list.
- Lab state goes through `LabRuntime` under a lab-specific id; reset touches only that lab.
- Run `node bin/portal-check.js` and `node bin/lab-state-check.js` before closing a wave.

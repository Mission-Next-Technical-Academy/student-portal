# Why the Student Activity Monitor is slow

**Date:** 2026-09-10
**Scope:** the admin "Student Activity Monitor" tab (`#/admin`, `activity` tab in `portal/app.js`).
**Method:** source and schema audit — reading `portal/app.js`'s fetch logic
against the view/table definitions and indexes in `supabase/migrations/`.
There is no arbitrary-SQL/`EXPLAIN ANALYZE` access available in this
workspace (only `supabase db push`/`migration` tooling and the RLS-gated
REST API), so this is a diagnosis from code and schema, not a captured live
query plan — same caveat the existing `archive/completed-feature-notes/
QUERY_PERFORMANCE_AUDIT_2026-09-09.md` audit made for the same reason. The
"Verification" section below says what to run once someone with `psql`/
dashboard access can capture real plans.

## Bottom line

Opening the Activity tab fires four parallel queries
(`portal/app.js:5971-5982`, `loadAdminLazyTab('activity')`). Three of them
are fine. The fourth — `admin_student_activity` — is a view that runs
**three separate full-table aggregations with no supporting indexes**, and
a second, unrelated query on the same tab pulls **every completed module
row the platform has ever recorded, with no date bound or limit**. Neither
of the three tables involved is ever pruned: cohort archival explicitly
"never touches" them. So this isn't a one-time slow query — it's a set of
full-table scans that get linearly slower as every cohort that has ever
run adds more rows, forever.

## What the Activity tab actually loads

`portal/app.js:5971-5982`:

```js
const [activity, completed, logins, sessions] = await Promise.all([
  mntSupabase.from('admin_student_activity').select(...),
  mntSupabase.from('module_progress').select('user_id, module_key, track_code, started_at, completed_at').eq('state', 'complete'),
  mntSupabase.from('login_events').select(...).gte('occurred_at', start).order(...).limit(500),
  mntSupabase.from('admin_site_sessions').select(...).gte('started_at', start).order(...),
]);
```

| Query | Bounded? | Verdict |
|---|---|---|
| `login_events` | 72h window + `limit(500)` | Fine — matches the 2026-09-09 audit's "Good" rating, unchanged. |
| `admin_site_sessions` | 72h window, **no `limit()`** | Minor — fine at current volume, but nothing caps it if login activity spikes. |
| `module_progress` (`completed`) | **No date bound, no track filter, no limit** | Root cause #2 below. |
| `admin_student_activity` | N/A — it's a view, not a filtered query | Root cause #1 below. |

## Root cause #1 (primary): `admin_student_activity` is a triple full-table aggregation, unindexed

`admin_student_activity` (`supabase/migrations/20260828180000_course_progress_in_progress_count.sql:69-105`) is built from `public.students` left-joined to three separate aggregates, each of which is its own full-table scan with **no filtering that an index could use**:

1. `course_progress` (line 31-42 of the same file) — `select ... from public.module_progress mp group by mp.user_id, mp.track_code`, scanning **every row in `module_progress`**, for every student, every cohort, ever.
2. An inline subquery — `select user_id, count(*) from public.lab_attempts group by user_id` — scanning **every row in `lab_attempts`**.
3. An inline subquery — `select user_id, count(*) from public.capstone_submissions group by user_id` — scanning **every row in `capstone_submissions`**.

`module_progress`, `lab_attempts`, and `capstone_submissions` each have **only their primary key** (confirmed in `supabase/migrations/20260828160000_simplify_schema.sql:89-99` and `104+` — `module_progress`: PK `(user_id, module_key)`; `lab_attempts`: `(user_id, lab_key)`). None of the three has an index that helps a bare `GROUP BY user_id` (or `user_id, track_code`) over the *whole* table — a primary key on `(user_id, module_key)` doesn't avoid the scan, it just makes point lookups for one user fast, which isn't what these subqueries do. Postgres has to sequentially scan and hash-aggregate all three tables in full, every time this view is queried.

This view is queried twice in a normal admin session: once for the default "Student Progress" tab (via the lighter `admin_student_progress`, which only pulls `course_progress` + `capstone_scorecard` — two aggregations, not three) and again, more expensively, when the admin opens **Activity Monitor** specifically (`admin_student_activity`, all three aggregations, plus the extra `lab_attempts_count`/`capstone_submissions_count` columns). So the single click that opens Activity Monitor is the single most expensive read path in the admin panel.

## Root cause #2: unbounded `module_progress` pull for a client-side heuristic

`portal/app.js:5976` pulls **every row where `state = 'complete'`** from `module_progress` — no date filter, no track filter, no `limit()` — and ships it to the browser. It exists purely to feed `buildCheatingReviewFlags()` (`portal/app.js:4746-4770`), a client-side loop that flags module completions faster than `FAST_MODULE_COMPLETION_MS`. That loop only needs `user_id, module_key, started_at, completed_at` for the *currently visible roster's* recent activity, not the platform's entire completed-module history since inception.

This is the exact item the 2026-09-09 audit already flagged as **High priority** ("Completion-speed flags... Full completed-row set is sent for a browser heuristic. Compute flags in an admin view/RPC instead.") — it was never fixed. Sprint 3 of that audit narrowed the *columns* selected (it used to be `select('*')`) but never bounded the *row count*, which is the actual cost driver.

## Root cause #3: none of this data is ever pruned — so it only gets slower

`supabase/migrations/20260901121000_cohort_archival_engine.sql:289` (the `archive_expired_cohorts()` doc comment) is explicit:

> "...**Never touches module_progress/lab_attempts/capstone_submissions/completion_reporting_snapshots.**"

Confirmed by reading the function body (lines 87-267): when a cohort's `end_date` passes, students with any activity get archived into `cohort_archive_snapshots` and their `students` row is flagged — but their rows in `module_progress`, `lab_attempts`, and `capstone_submissions` are left in place, forever, by design (presumably for compliance/transcript history). That's a reasonable retention decision for the data itself, but it means the three tables `admin_student_activity` aggregates over are **monotonically growing across the program's entire lifetime**, with no partitioning, no materialized/cached aggregate, and no index that helps a full-table `GROUP BY`. Every cohort that finishes makes the *next* admin's Activity Monitor click slightly slower than the last, permanently. This is the concrete mechanism behind the site owner's earlier, still-open observation in `NEXT_SESSION.md` ("the log list is very long, not sure when/if it should be scrubbed") — same growth pattern, different table.

## Recommendations, in priority order

1. **Stop shipping the full `module_progress` "complete" set to the browser.** Replace the client-side cheating heuristic with a bounded admin RPC/view that does the `completed_at - started_at` comparison in SQL and returns only the flagged `user_id`/reason rows (this was already recommended in 2026-09-09 and is the single highest-leverage fix — it eliminates an unbounded, ever-growing payload entirely).
2. **Add a supporting index for the three aggregations**, at minimum `create index concurrently on public.module_progress (user_id, track_code) include (state, updated_at)` — or, better, precompute `course_progress`-equivalent numbers incrementally (a trigger-maintained summary table keyed by `(user_id, track_code)`) instead of a live `GROUP BY` over the whole table on every read. Same idea for `lab_attempts`/`capstone_submissions` counts — a maintained counter column or summary table beats a full scan on every admin click.
3. **Add `limit()` to the `admin_site_sessions` query** (mirror `login_events`'s `.limit(500)`) so a login-activity spike inside the 72h window can't make this one unbounded either.
4. **Revisit retention** for `module_progress`/`lab_attempts`/`capstone_submissions` once archival's compliance requirements are clear — even keeping the raw rows, a periodic rollup (e.g., nightly-refreshed per-cohort summary) would let the admin views read a small, bounded summary table instead of re-deriving it from the full history on every request.

None of the above touches RLS or the anon-hardening migration from earlier today — this is a read-cost problem, not an access-control one.

## Verification still needed (requires DB access this workspace doesn't have)

- Run `EXPLAIN (ANALYZE, BUFFERS)` on `select * from admin_student_activity` and on the bare `module_progress .eq('state','complete')` query against production-sized data, to confirm sequential-scan costs match this diagnosis.
- Check `pg_stat_user_tables`/`pg_relation_size` for `module_progress`, `lab_attempts`, and `capstone_submissions` to see actual row counts and whether autovacuum/bloat is compounding the scan cost.
- Compare wall-clock time for the Activity tab's four-query `Promise.all` before/after fix #1 and #2 above.

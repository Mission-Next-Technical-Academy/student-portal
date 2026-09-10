# Query performance audit and query-logging design

**Audit date:** 2026-09-09  
**Scope:** `portal/` (the Supabase-backed student/admin portal), its Edge Functions, and `supabase/migrations/`. The separate `ui/` SOC simulator has only bundled JavaScript fixtures and browser `localStorage`; it does not issue database queries.

## Bottom line

No, the portal does not intentionally query every database table to find one row. Nearly every student-facing lookup is restricted by the authenticated user's `user_id`, normally through a primary key or an existing composite index. However, the admin landing route currently launches several independent queries regardless of which admin tab is visible. A few of those read every row exposed by an administrative view/table, and several use `select('*')` where the rendered feature needs fewer columns.

The repository includes useful indexes, but it does **not** currently contain query-duration/resource telemetry, a slow-query threshold, a query-log table, or the requested **Query Logging** admin tab. The SQL below is a recommended, review-before-apply migration design; this audit intentionally makes no database or application changes.

There is no approved live database connection or production query-statistics export in this workspace. Therefore, this is a source-and-schema audit, not a claim that a particular live plan is slow. Run the verification plan after the migration is reviewed and applied.

## What runs today

### Sign-in and normal student usage

| Feature | Actual query shape | Scope / data minimization | Index status |
|---|---|---|---|
| Session bootstrap | `students` by `user_id`, selecting identity/access fields | One user row | Covered by `students.user_id UNIQUE` |
| Session bootstrap | `module_progress` by `(user_id, track_code)`, selecting `module_key,state` | Only the current student's track | PK `(user_id,module_key)` supports the leading `user_id`; add `(user_id,track_code)` only if users accumulate many cross-track rows |
| Module completion | upsert `module_progress` on `(user_id,module_key)` | One module row | Covered by primary key |
| Lab attempt / capstone / portfolio writes | insert a new row | One submitted record | No lookup scan required |
| Transcript/evidence | parallel reads by `(user_id,track_code)` across progress, labs, capstone, scorecard, artifacts, reviews, awards, and M360 | One selected student/track | Mixed; some detail/report indexes are missing |
| Capstone review status | `capstone_reviews` by `(user_id,track_code)`, newest first, one row | One student/track | Existing `(user_id,created_at DESC)` is usable but lacks `track_code` |
| Login and session creation | inserts into `login_events` and `site_sessions`, returning `id` | One event/session | PK writes; no scan |
| Sign-out / heartbeat | update open `site_sessions` by `user_id` | Current user's open session(s) | Covered by partial `site_sessions_open_idx (user_id) WHERE ended_at IS NULL` |
| M360 student state | `m360_*` rows by `user_id`, weeks ordered by week number | One user | Covered by course-record and week-record primary keys |

### Administrative portal usage

The following run every time `#/admin` or `#/admin/track/:code` renders, not only when the matching tab is selected. This is the largest avoidable cost.

| Source | Current shape | Finding | Priority |
|---|---|---|---|
| Student Progress roster | `admin_student_program_progress.select('*').order(track_code)` | Loads the full projection. Use named fields and filter track routes server-side. | High |
| Student detail chooser | `admin_student_activity.select('*')` | Avoids N+1 reads, but loads the entire aggregate view and should be projected narrowly or merged with roster data. | High |
| Completion-speed flags | all `module_progress` rows where `state='complete'` | Full completed-row set is sent for a browser heuristic. Compute flags in an admin view/RPC instead. | High |
| Student Activity Monitor | 72-hour `login_events`, ordered desc, limited to 500 | Properly bounded and column-projected. | Good |
| Cohorts | `cohorts.select('*').order(start_date DESC)` | Loads all cohorts even when another tab is selected. | Medium |
| Cohort member counts | all non-null `students.cohort_id`, counted in JavaScript | Use server-side `GROUP BY cohort_id`; do not transfer every member id. | High |
| Archived Students | `admin_archived_students.select('*').order(archived_at DESC)` | Loads all archive rows regardless of active tab; load lazily and paginate. | High |
| Site session monitor | 72-hour `admin_site_sessions.select('*')` | Time bounded, but over-projects; inspect view plan. | Medium |
| Student detail panel | six parallel `select('*')` calls by `user_id` | Only triggered on open (good); narrow fields and include known `track_code` where supported. | Medium |
| Annual reporting | `admin_enrollment_reporting.select('*')`, optional track; date filtering in JavaScript | Can retrieve all enrollment history for one reporting window. Move date filtering to an admin RPC. | High |
| M360 admin reviews | eligible student list then batched `IN (user_ids)` reads | Batched rather than N+1 (good); paginate large rosters. | Medium |

### Edge Functions and RPCs

| Caller | Data operation | Access path |
|---|---|---|
| `admin-provision` | checks `students.student_id`, inserts students/credentials/cohorts | PK on `student_id` |
| `record-login-geo` | updates `login_events` by `(id,user_id)` | PK `id` sufficient; user is authorization guard |
| `check-login-geofence` | updates `site_sessions` by session id/user | PK `id` sufficient |
| `check-login-ueba` | looks up student, open sessions, IP history, and marks login event | Needs the recommended open-session/IP-history plan validation |
| `m360_*` RPCs | resolves student by `students.user_id`; upserts course/week records | Existing unique/primary keys cover main paths |
| Admin enrollment/reporting/archive/session RPCs | targeted student/cohort/session reads/updates | Point lookups covered; reporting/archive plans need measurement |

## Current indexes confirmed in migrations

- `students`: primary key `(student_id)` and unique `(user_id)`.
- `module_progress`: primary key `(user_id,module_key)`.
- `lab_attempts`: `(user_id,lab_key)`.
- `capstone_submissions`: unique `(user_id,track_code,stage)`.
- `portfolio_artifacts`: `(user_id,created_at DESC)`.
- `capstone_reviews`: `(user_id,created_at DESC)`.
- `login_events`: `(user_id,occurred_at DESC)` and `(occurred_at DESC)`.
- `site_sessions`: `(user_id,started_at DESC)`, partial `(user_id) WHERE ended_at IS NULL`, and partial `(last_seen_at) WHERE ended_at IS NULL`.
- `m360_week_records`: primary key `(user_id,week_number)` plus `(review_status,week_number,updated_at DESC)`.
- `m360_course_records`: primary key `(user_id)`.
- `cohorts`: partial `(end_date) WHERE archived_at IS NULL`; `students(cohort_id)`; archive snapshots by user/date and cohort.
- Reporting/audit migrations add indexes for their own tables.

> Some later migrations are explicitly local-only/unapplied. This is repository intent, not proof that every index exists in the hosted project. Check `pg_indexes` before adding anything.

## Recommended indexes

Apply only after collecting `EXPLAIN (ANALYZE, BUFFERS)` against representative production-sized data. Indexes improve reads but add write/storage cost.

```sql
create index concurrently if not exists students_active_non_admin_track_student_idx
  on public.students (track_code, student_id)
  where is_enrolled = true and is_admin = false;

create index concurrently if not exists module_progress_user_track_idx
  on public.module_progress (user_id, track_code);

create index concurrently if not exists lab_attempts_user_track_idx
  on public.lab_attempts (user_id, track_code);

create index concurrently if not exists portfolio_artifacts_user_track_submitted_idx
  on public.portfolio_artifacts (user_id, track_code, submitted_at desc);

create index concurrently if not exists capstone_reviews_user_track_created_idx
  on public.capstone_reviews (user_id, track_code, created_at desc);

create index concurrently if not exists site_sessions_open_user_started_idx
  on public.site_sessions (user_id, started_at desc)
  where ended_at is null;

create index concurrently if not exists cohort_archive_snapshots_archived_idx
  on public.cohort_archive_snapshots (archived_at desc);
```

Do **not** index `students.cohort_id IS NOT NULL` merely to support the current count. Replace that client-side scan with a grouped server-side query first; add an index only if its measured plan requires one.

## Payload and query minimization

1. Lazy-load each admin tab. The default Student Progress tab can load its roster; Activity, Cohorts, Archived Students, and Query Logging should load only when opened.
2. Replace admin `select('*')` calls with exact columns. Keep `*` only for a true full-record export.
3. Apply the selected track to `#/admin/track/:code` at the database boundary, not after downloading all tracks.
4. Replace annual-report browser date filtering with an admin-only RPC accepting start, end, and optional track.
5. Replace cohort-member transfer/counting with a grouped admin view/RPC returning `cohort_id,count`.
6. Paginate archive, M360 roster, and activity views. Keep the existing 72-hour/500-row activity bound.
7. Reduce student-detail projections and pass the already-known track filter.

## Query Logging admin tab design

Add a **Query Logging** button immediately to the right of **Student Progress** in the existing admin strip, before **Student Activity Monitor**, **Cohorts**, and **Archived Students**.

The tab must display server-collected aggregates, never raw student payloads, JWTs, query parameters, or unredacted SQL.

| Column | Meaning |
|---|---|
| Query fingerprint / feature | Allow-listed identifier such as `admin.roster.load`, not browser-supplied SQL |
| Source | Portal, Edge Function, RPC, scheduled job, or database statistic |
| Calls | Count in the selected time window |
| Mean / p95 / maximum | Duration in milliseconds |
| Rows returned / affected | Output/work signal |
| Shared-buffer reads / temp use | Database resource signal, when available |
| Last seen | Most recent execution |
| Threshold breaches | Count and rate over threshold |
| Status | Healthy, investigate, or regression |

Start with warning at 250 ms and alert at 1,000 ms for interactive reads; use 2,000 ms for reports/background jobs. Tune after a baseline week.

### Collection architecture

1. Enable the managed provider's supported query-statistics extension (normally `pg_stat_statements`) and slow-query logging through the approved Supabase administration path.
2. Expose only an admin-only, security-definer summary RPC/view that maps normalized fingerprints to approved feature names and redacts statement text/literals.
3. Time portal requests with `performance.now()`; send only an allow-listed feature id, operation class, elapsed time, row count, and result category to a server-side ingestion boundary. Sample/rate-limit heartbeats.
4. Retain detailed samples for 30 days and hourly aggregates for 13 months. Never collect request bodies, tokens, raw IPs, SQL parameters, or student work.
5. Make the UI filterable by time window, feature, and threshold, with an outlier link to source location/remediation—not arbitrary SQL execution.

### Initial telemetry sketch (superseded by Sprint 1 migration)

The compact sketch below records the original shape considered during the
audit. The reviewable Sprint 1 schema, including its catalog, sample policy,
RPC boundaries, and retention hook, is in
`supabase/migrations/20260909100000_query_performance_telemetry.sql`.

```sql
create table public.query_feature_metrics_hourly (
  bucket_start timestamptz not null,
  feature_key text not null,
  source text not null check (source in ('portal', 'edge_function', 'rpc', 'database')),
  call_count bigint not null,
  error_count bigint not null default 0,
  total_duration_ms numeric not null,
  max_duration_ms numeric not null,
  p95_duration_ms numeric,
  rows_returned bigint,
  threshold_breach_count bigint not null default 0,
  primary key (bucket_start, feature_key, source)
);

create index query_feature_metrics_hourly_recent_idx
  on public.query_feature_metrics_hourly (bucket_start desc, feature_key);
```

The browser must not insert directly. Use an allow-listed security-definer function or authenticated Edge Function that derives the actor and validates `feature_key`; grant the dashboard only an admin-gated read model.

## Verification and release gate

1. In staging with realistic row counts, run `EXPLAIN (ANALYZE, BUFFERS)` for every query shape above. Save before/after plans, execution time, rows, buffer reads, and selected index.
2. Query `pg_indexes` first; skip duplicates/redundant indexes.
3. Build indexes with `CONCURRENTLY` outside a transaction during a low-write window.
4. Test login, progress update, transcript/evidence export, admin roster/tabs, detail panel, M360 reviews, heartbeat/sign-out, cohort archive, and reporting.
5. Establish a one-week baseline before finalizing slow-query thresholds.
6. Use browser DevTools to compare payload bytes before/after named projections and lazy loading.

## Sprint 1 status — telemetry migration (2026-09-09)

This sprint is written-only and review-safe. The migration has not been
applied, pushed, or connected to the portal UI.

- [x] Add a strict feature catalog with stable keys, operation classes,
  source locations, and warning/alert thresholds.
- [x] Add hourly aggregate metrics plus bounded anonymous samples (30-day
  sample retention target; 13-month aggregate retention target).
- [x] Add an authenticated server-side ingestion RPC that derives the caller
  class and fixes the portal source; validate duration, row count, result
  category, sampling, and the feature allow-list.
- [x] Add an admin-gated aggregate read RPC with mean, p95 (from samples),
  maximum, errors, rows, threshold breaches, and status. It does not return
  sample rows or caller identities.
- [x] Add an admin/scheduler retention hook; scheduling remains a deployment
  decision and is intentionally not enabled by this migration.
- [ ] Review and apply in staging, then capture representative
  `EXPLAIN (ANALYZE, BUFFERS)` plans and establish the baseline week.
- [ ] Wire portal timing and the Query Logging tab in later sprints.

Migration: `supabase/migrations/20260909100000_query_performance_telemetry.sql`.
The migration stores no raw SQL, JWTs, request parameters, request payloads,
student work, IP addresses, or user IDs in telemetry rows.

## Source locations audited

- Portal orchestration/admin queries: `portal/app.js`.
- M360 queries: `portal/m360/m360-data.js`, `portal/m360/review-*.js`, `portal/m360/portfolio.js`, and `portal/m360-entry.js`.
- Capstone status query: `portal/it-support-module-12.js`.
- Edge Function queries: `supabase/functions/`.
- Schema, views, functions, and indexes: `supabase/migrations/`.

## Sprint 2 status — admin Query Logging and lazy tab loading (2026-09-09)

- [x] Added the admin **Query Logging** tab immediately after Student
  Progress. It calls only `get_query_feature_metrics`, accepts local time,
  feature, and status/threshold filters, and displays aggregate allow-listed
  metrics plus source/remediation guidance.
- [x] Added a clear unavailable state when the reviewed migration/RPC is not
  deployed. The UI never exposes SQL, parameters, identities, telemetry
  samples, or arbitrary query execution; buffer/temp columns remain blank when
  the RPC does not provide those fields.
- [x] Refactored admin route loading so the default Student Progress render
  loads only the roster projection. Activity/completion-speed data, cohorts,
  site sessions, archived students, and query telemetry load once when their
  tab is selected and remain cached for that page session.
- [x] Preserved activity detail and review behavior after lazy loading; the
  roster-only view uses its existing progress fields for the initial Student
  Detail chooser, while activity-tab data adds lab-only records and review
  flags when selected.
- [x] Validation: `node --check portal/app.js` and `git diff --check` pass.

No migration was applied, pushed, or contacted by the local UI. Sprint 3
projection/RPC refactors remain out of scope.

## Sprint 3 status — verified admin projections (2026-09-09)

- [x] Replaced the admin programme-progress roster wildcard with the explicit
  read-model columns consumed by normalization, filters, progress cards,
  enrollment controls, exports, and reporting labels.
- [x] Applied the selected `#/admin/track/:code` track at the roster query
  boundary (`track_code`) when the route names a known track; the all-student
  workspace keeps its cross-track query.
- [x] Replaced wildcard projections for the lazy activity aggregate, site
  session monitor, cohorts, and archived-student view with source-verified
  column lists. Existing time bounds, ordering, RLS, and client-side search
  behavior are unchanged.
- [x] Narrowed the on-demand admin Student Detail reads to the fields used by
  its module/lab/capstone/scorecard/artifact/review renderer and added the
  already-known student's `track_code` predicate to each base-table read.
- [ ] Annual-reporting `admin_enrollment_reporting` still uses a broad
  projection and browser-side period bucketing. A reviewed admin RPC/view
  must own the date/track filtering and annual/cohort count semantics before
  this is changed; do not invent or apply one as part of this sprint.
- [ ] Cohort member counts still transfer non-null `cohort_id` rows for
  client-side counting. A grouped admin read model/RPC remains staging/review-
  gated; no speculative index was added.

No migration was applied or pushed. Residual performance claims require
representative staging `EXPLAIN (ANALYZE, BUFFERS)` plans and an RLS-authenticated
browser payload comparison.

## Documentation sprint closeout — 2026-09-09

Local verification completed: `node --check portal/app.js`, `git diff --check`,
and `node bin/portal-check.js` all passed. Staging `EXPLAIN (ANALYZE, BUFFERS)`
plans, the baseline week, and migration application are external deployment
gates; they were not performed in this workspace and remain explicitly pending.

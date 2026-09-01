-- Mission Next Technical Academy — cohort & user lifecycle: Sprint 1 schema.
-- COHORT_USER_LIFECYCLE_SPRINT_PLAN.md, "Sprint 1 — Schema."
--
-- This migration is schema-only: it creates the tables/view/RLS that later
-- sprints build on (Sprint 2's archive_expired_cohorts() function, Sprint 3's
-- admin-provision Edge Function, Sprint 4's admin panel UI). It does not
-- create any function that writes to these tables, does not touch pg_cron,
-- and does not alter module_progress, lab_attempts, capstone_submissions,
-- enrollment_periods, or completion_reporting_snapshots in any way — the
-- sprint plan's non-negotiable constraint is that those compliance/academic
-- tables are never pruned, and this migration doesn't go near them.
--
-- Not applied to the live project by this file. Review before running
-- `supabase db push` — see the deployment checklist in
-- COHORT_USER_LIFECYCLE_SPRINT_PLAN.md.

-- ------------------------------------------------------------------ cohorts
--
-- A cohort is track-agnostic: it groups students generated together for
-- administrative/expiry purposes (e.g. "Fall 2026 intake"), regardless of
-- which of the four tracks each member is enrolled in. archived_at stays
-- null until Sprint 2's archival sweep processes an expired cohort — it is
-- not derived from end_date at read time, since the sweep needs a durable
-- marker of "already processed" to stay idempotent.

create table if not exists public.cohorts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  start_date   date not null,
  end_date     date not null,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  archived_at  timestamptz,
  check (end_date >= start_date)
);

comment on table public.cohorts is
  'Track-agnostic student groupings with a start/end window. A cohort can hold students from multiple tracks (SOCAN/HDESK/AIENG/ELECT), each batch-generated with its own count at creation time. archived_at is stamped once by the Sprint 2 archival sweep, not derived from end_date, so the sweep stays idempotent.';
comment on column public.cohorts.archived_at is
  'Null until the Sprint 2 archival sweep (archive_expired_cohorts()) processes this cohort past its end_date. A durable "already processed" marker, not a computed value.';

-- Lets the future archival sweep find expired-but-unprocessed cohorts
-- without a full table scan.
create index if not exists cohorts_active_end_date_idx
  on public.cohorts (end_date) where archived_at is null;

-- ----------------------------------------------------- students: cohort link
--
-- Both nullable: an ad hoc/ungrouped account (e.g. one made outside the
-- "Generate New Cohort" flow, or any pre-existing student) has no cohort at
-- all, and that absence is meaningful, not an error state. cohort_archived_at
-- mirrors cohorts.archived_at's "durable marker, not derived" design — it is
-- stamped per-student by the Sprint 2 sweep the moment that student is
-- archived out of the active roster, independent of whether their cohort row
-- itself is later deleted.

alter table public.students
  add column if not exists cohort_id uuid references public.cohorts(id) on delete set null,
  add column if not exists cohort_archived_at timestamptz;

comment on column public.students.cohort_id is
  'Nullable: ad hoc/ungrouped accounts have no cohort. Set on delete set null so deleting a cohort row never cascades into deleting or orphaning a real student account.';
comment on column public.students.cohort_archived_at is
  'Stamped once by the Sprint 2 archival sweep when this student is moved out of the active roster into cohort_archive_snapshots. Null for students never archived.';

create index if not exists students_cohort_id_idx
  on public.students (cohort_id);

-- ------------------------------------------------- cohort_archive_snapshots
--
-- One row per student archived out of an expired cohort. This is a
-- lightweight, point-in-time summary for the admin "Archived Students" view's
-- convenience only — it mirrors the shape admin_student_progress already
-- shows (supabase/migrations/20260829125000_enrollment_reporting_history.sql,
-- redefined again in 20260901090000_completion_reporting_snapshot.sql) plus
-- cohort context. It is explicitly NOT the compliance-of-record table: that
-- remains completion_reporting_snapshots (frozen at 100% module completion)
-- and enrollment_periods (append-only enrollment history), both untouched by
-- this feature. A student can appear here without ever having a
-- completion_reporting_snapshots row (e.g. archived while still in progress),
-- and this table does not attempt to replace that one.
--
-- user_id cascades on delete here — different from every compliance table in
-- this schema, and deliberately so: if an admin later actually deletes the
-- underlying auth user (a real, separate action, not something this feature
-- does automatically per the sprint plan's "archive = deactivate, keep the
-- login" rule), this convenience summary should go with it, since there is
-- no compliance obligation attached to it the way there is for
-- completion_reporting_snapshots/enrollment_periods.

create table if not exists public.cohort_archive_snapshots (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  student_id             text not null,
  cohort_id              uuid references public.cohorts(id) on delete set null,
  -- Frozen copy: survives even if the cohort row itself is later deleted,
  -- so the admin view never shows a blank cohort name for an old archive.
  cohort_name            text not null,
  track_code             text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  program_slug           text,
  modules_total          integer,
  modules_complete       integer,
  percent_complete       numeric(5,1),
  capstone_overall_score numeric(5,2),
  enrollment_date        timestamptz,
  withdrawal_date        timestamptz,
  -- Whatever admin_student_progress.status held for this student at the
  -- moment of archival (e.g. 'completed'/'active'/'not_yet_started') —
  -- frozen, not recomputed later.
  status_at_archive      text,
  archived_at            timestamptz not null default now(),
  -- One value today, extensible later without a schema change if a second
  -- archival path is ever added (e.g. a manual admin removal) — not
  -- over-engineered beyond what Sprint 2 actually needs.
  archive_reason         text not null default 'cohort_expired' check (archive_reason in ('cohort_expired'))
);

comment on table public.cohort_archive_snapshots is
  'Lightweight, point-in-time summary written once per student when the Sprint 2 archival sweep moves them out of an expired cohort. Backs the admin "Archived Students" view''s convenience only — this is NOT the compliance-of-record table. That remains completion_reporting_snapshots (frozen at completion) and enrollment_periods (append-only enrollment history), neither of which this feature touches.';
comment on column public.cohort_archive_snapshots.cohort_name is
  'Frozen at archival time. Kept even if the cohorts row is later deleted, so this table never depends on cohorts surviving for its own display purposes.';

create index if not exists cohort_archive_snapshots_user_idx
  on public.cohort_archive_snapshots (user_id, archived_at desc);
create index if not exists cohort_archive_snapshots_cohort_idx
  on public.cohort_archive_snapshots (cohort_id);

-- --------------------------------------------------- admin_archived_students
--
-- Same gating pattern as admin_student_progress/admin_student_activity:
-- security_invoker = true (RLS on the base tables still applies, evaluated
-- as the querying admin) plus a defensive `where public.is_admin()` so a
-- non-admin querying this view gets zero rows, not an error. Left join to
-- cohorts for the current name/dates, coalescing to the frozen cohort_name
-- column if the cohort row was since deleted.

create or replace view public.admin_archived_students
with (security_invoker = true) as
select
  cas.id,
  cas.user_id,
  cas.student_id,
  cas.cohort_id,
  coalesce(c.name, cas.cohort_name)  as cohort_name,
  c.start_date                       as cohort_start_date,
  c.end_date                         as cohort_end_date,
  cas.track_code,
  cas.program_slug,
  cas.modules_total,
  cas.modules_complete,
  cas.percent_complete,
  cas.capstone_overall_score,
  cas.enrollment_date,
  cas.withdrawal_date,
  cas.status_at_archive,
  cas.archived_at,
  cas.archive_reason
from public.cohort_archive_snapshots cas
left join public.cohorts c on c.id = cas.cohort_id
where public.is_admin();

comment on view public.admin_archived_students is
  'Admin-only. Backs the Sprint 4 "Archived Students" read-only tab. One row per student archived out of an expired cohort — see cohort_archive_snapshots for what is and is not frozen here.';

grant select on public.admin_archived_students to authenticated;

-- --------------------------------------------------------------------- RLS
--
-- Same admin-only idiom used throughout this schema (is_admin() in every
-- using/with check clause — see 20260828170000_admin_student_detail.sql and
-- 20260829120000_assessment_review_and_artifacts.sql's capstone_reviews
-- policies for the exact style this mirrors). Neither table has a
-- student-facing "own row" policy: a cohort and its archive snapshots are
-- administrative records, not something a student reads about themself
-- directly.

alter table public.cohorts enable row level security;
alter table public.cohort_archive_snapshots enable row level security;

create policy cohorts_admin_read on public.cohorts
  for select using (public.is_admin());
create policy cohorts_admin_insert on public.cohorts
  for insert with check (public.is_admin());
create policy cohorts_admin_update on public.cohorts
  for update using (public.is_admin()) with check (public.is_admin());

create policy cohort_archive_snapshots_admin_read on public.cohort_archive_snapshots
  for select using (public.is_admin());
create policy cohort_archive_snapshots_admin_insert on public.cohort_archive_snapshots
  for insert with check (public.is_admin());
create policy cohort_archive_snapshots_admin_update on public.cohort_archive_snapshots
  for update using (public.is_admin()) with check (public.is_admin());

comment on policy cohorts_admin_read on public.cohorts is
  'Admins only. Cohorts are an administrative construct, not student-facing.';
comment on policy cohort_archive_snapshots_admin_read on public.cohort_archive_snapshots is
  'Admins only. See table comment: this is a convenience summary, not the compliance-of-record table.';

-- RLS still gates every row to admins; these grants only clear the
-- table-level permission check that comes before RLS is evaluated.
grant select, insert, update on public.cohorts to authenticated;
grant select, insert, update on public.cohort_archive_snapshots to authenticated;

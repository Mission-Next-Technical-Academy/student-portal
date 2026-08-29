-- Mission Next Technical Academy — durable enrollment episodes and annual
-- reporting source data (Workstreams C1, C5 and D1/D2).
--
-- This migration is intentionally UNAPPLIED.  It follows the existing
-- 20260829100000_admin_enrollment.sql and 20260829110000_enrollment_dates.sql
-- migrations, but does not replace or erase their compatibility columns.
-- Review before running `supabase db push`: this establishes the institutional
-- record model used by annual reporting.

-- -------------------------------------------------------- program versions
-- A program version freezes the credential and approved schedule applicable
-- to an enrollment.  It is not derived from mutable portal/data.js content.
create table if not exists public.program_versions (
  id uuid primary key default gen_random_uuid(),
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  version_code text not null unique,
  program_name text not null,
  credential_code text,
  credential_name text,
  reporting_program_code text,
  approved_duration_days integer check (approved_duration_days > 0),
  approved_total_hours numeric(7,2) check (approved_total_hours >= 0),
  effective_from date not null,
  effective_to date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create unique index if not exists program_versions_one_active_track
  on public.program_versions (track_code) where is_active;

-- This is the current developer-mapped SOC curriculum record, not a claim of
-- regulatory approval.  It gives new SOC enrollment episodes a stable version
-- identifier while preserving the curriculum-review caveat in portal/data.js.
insert into public.program_versions
  (track_code, version_code, program_name, credential_code, credential_name,
   reporting_program_code, approved_duration_days, approved_total_hours,
   effective_from, is_active)
values
  ('SOCAN', 'SOCAN-2026-08-28', 'Mission Next Security Operations Center Analyst',
   'SOC-DIP', 'Diploma', 'SOCAN', 42, 82, date '2026-08-28', true)
on conflict (version_code) do nothing;

-- ------------------------------------------------------ enrollment periods
-- One row is one enrollment epoch.  Starting a later enrollment never edits
-- the prior withdrawal: closing only stamps the open episode's end.
create table if not exists public.enrollment_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  program_version_id uuid references public.program_versions(id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  scheduled_start_date date,
  scheduled_completion_date date,
  withdrawn_at timestamptz,
  withdrawal_classification text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  check (withdrawn_at is null or withdrawn_at >= enrolled_at),
  check (scheduled_completion_date is null or scheduled_start_date is null
         or scheduled_completion_date >= scheduled_start_date)
);

create unique index if not exists enrollment_periods_one_open_epoch
  on public.enrollment_periods (user_id, track_code) where withdrawn_at is null;
create index if not exists enrollment_periods_reporting_idx
  on public.enrollment_periods (track_code, enrolled_at, withdrawn_at);

comment on table public.enrollment_periods is
  'Append-only enrollment history. A re-enrollment is a new row; academic progress and attempts are never deleted.';
comment on column public.enrollment_periods.withdrawal_classification is
  'Institution-defined reporting classification. Nullable until compliance leadership approves a controlled vocabulary.';

-- Backfill the single legacy/current enrollment state into one episode where
-- there is evidence one existed. This is necessarily a one-time historical
-- reconstruction: the old model did not retain earlier re-enrollments, so it
-- cannot manufacture them. Subsequent transitions are append-only below.
insert into public.enrollment_periods
  (user_id, track_code, program_version_id, enrolled_at, scheduled_start_date,
   withdrawn_at, created_at, closed_at)
select
  s.user_id,
  s.track_code,
  pv.id,
  coalesce(s.enrollment_date, s.created_at),
  s.scheduled_start_date,
  case when not s.is_enrolled then greatest(coalesce(s.withdrawal_date, now()), coalesce(s.enrollment_date, s.created_at)) end,
  now(),
  case when not s.is_enrolled then now() end
from public.students s
left join public.program_versions pv on pv.track_code = s.track_code and pv.is_active
where s.track_code <> 'ADMIN'
  and (s.is_enrolled or s.enrollment_date is not null or s.withdrawal_date is not null);

-- -------------------------------------------------------- geography linkage
-- Geographic reporting is an effective-dated classification, not an address
-- copied into reports.  The source reference supports a stable SIS/CRM join.
create table if not exists public.student_geography_classifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  classification text not null check (classification in ('florida', 'non_florida', 'unknown')),
  source_system text not null default 'institutional-record',
  source_reference text,
  effective_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now()
);
create index if not exists student_geography_current_idx
  on public.student_geography_classifications (user_id, effective_at desc);

-- ---------------------------------------------------------- credential award
-- An award is a separate institutional action, never inferred from 100%
-- progress. Revocation is represented by a later record, not deletion.
create table if not exists public.credential_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  enrollment_period_id uuid not null references public.enrollment_periods(id) on delete restrict,
  credential_code text not null,
  credential_name text not null,
  awarded_at timestamptz not null default now(),
  award_status text not null default 'awarded' check (award_status in ('awarded', 'revoked')),
  action_reason text,
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now()
);
create index if not exists credential_awards_reporting_idx
  on public.credential_awards (awarded_at, award_status);

-- --------------------------------------------------------- reporting periods
create table if not exists public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  period_code text not null unique,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

-- ------------------------------------------------------ episode maintenance
-- Existing admin UX updates students.is_enrolled. This trigger turns that
-- compatibility flag into history without making a client responsible for
-- preserving a withdrawal event.
create or replace function public.record_enrollment_period_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_version_id uuid;
begin
  if new.is_enrolled and not old.is_enrolled and new.track_code <> 'ADMIN' then
    select id into v_version_id
    from public.program_versions
    where track_code = new.track_code and is_active
    order by effective_from desc
    limit 1;

    insert into public.enrollment_periods
      (user_id, track_code, program_version_id, enrolled_at, scheduled_start_date, created_by)
    values
      (new.user_id, new.track_code, v_version_id, now(), new.scheduled_start_date, auth.uid())
    on conflict (user_id, track_code) where withdrawn_at is null do nothing;
  elsif not new.is_enrolled and old.is_enrolled and old.track_code <> 'ADMIN' then
    update public.enrollment_periods
    set withdrawn_at = coalesce(withdrawn_at, now()),
        closed_at = now(),
        closed_by = auth.uid()
    where user_id = old.user_id and track_code = old.track_code and withdrawn_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists students_record_enrollment_period_transition on public.students;
create trigger students_record_enrollment_period_transition
  after update on public.students
  for each row
  when (old.is_enrolled is distinct from new.is_enrolled)
  execute function public.record_enrollment_period_transition();

-- A narrow admin RPC updates planning fields on the current open episode and
-- records a new geography classification only when it changes. It deliberately
-- cannot alter enrolled_at, withdrawn_at, program version, or old episodes.
create or replace function public.admin_update_current_enrollment_plan(
  p_student_id text,
  p_scheduled_start_date date,
  p_scheduled_completion_date date,
  p_geography_classification text default null,
  p_geography_source_reference text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_student public.students%rowtype;
  v_latest_geography text;
begin
  if not public.is_admin() then raise exception 'Administrator role required'; end if;
  select * into v_student from public.students where student_id = p_student_id for update;
  if not found then raise exception 'Student not found'; end if;
  if not v_student.is_enrolled then raise exception 'An active enrollment is required before planning dates can be saved'; end if;
  if p_scheduled_completion_date is not null and p_scheduled_start_date is not null
     and p_scheduled_completion_date < p_scheduled_start_date then
    raise exception 'Scheduled completion cannot precede scheduled start';
  end if;

  update public.enrollment_periods
  set scheduled_start_date = p_scheduled_start_date,
      scheduled_completion_date = p_scheduled_completion_date
  where user_id = v_student.user_id and track_code = v_student.track_code and withdrawn_at is null;

  -- Keep the legacy/current students column synchronized for existing portal
  -- readers until all consumers move to enrollment_periods.
  update public.students set scheduled_start_date = p_scheduled_start_date
  where user_id = v_student.user_id;

  if p_geography_classification is not null then
    if p_geography_classification not in ('florida', 'non_florida', 'unknown') then
      raise exception 'Invalid geography classification';
    end if;
    select classification into v_latest_geography
    from public.student_geography_classifications
    where user_id = v_student.user_id order by effective_at desc limit 1;
    if v_latest_geography is distinct from p_geography_classification then
      insert into public.student_geography_classifications
        (user_id, classification, source_reference, recorded_by)
      values (v_student.user_id, p_geography_classification, p_geography_source_reference, auth.uid());
    end if;
  end if;
end;
$$;

grant execute on function public.admin_update_current_enrollment_plan(text, date, date, text, text) to authenticated;

-- ---------------------------------------------------------- secure readers
alter table public.program_versions enable row level security;
alter table public.enrollment_periods enable row level security;
alter table public.student_geography_classifications enable row level security;
alter table public.credential_awards enable row level security;
alter table public.reporting_periods enable row level security;

create policy program_versions_authenticated_read on public.program_versions
  for select using (auth.role() = 'authenticated');
create policy enrollment_periods_student_or_admin_read on public.enrollment_periods
  for select using (user_id = auth.uid() or public.is_admin());
create policy geography_student_or_admin_read on public.student_geography_classifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy credential_awards_student_or_admin_read on public.credential_awards
  for select using (user_id = auth.uid() or public.is_admin());
create policy reporting_periods_admin_read on public.reporting_periods
  for select using (public.is_admin());

grant select on public.program_versions, public.enrollment_periods,
  public.student_geography_classifications, public.credential_awards,
  public.reporting_periods to authenticated;

-- ----------------------------------------------------------- admin views
-- One row per enrollment episode: the source for period-bounded Form 801
-- calculations. It does not turn unknown geography or missing awards into 0.
create or replace view public.admin_enrollment_reporting
with (security_invoker = true) as
select
  ep.id as enrollment_period_id,
  s.user_id,
  s.student_id,
  ep.track_code,
  pv.version_code as program_version_code,
  pv.program_name,
  pv.credential_code,
  pv.credential_name,
  pv.reporting_program_code,
  ep.enrolled_at,
  ep.scheduled_start_date,
  ep.scheduled_completion_date,
  ep.withdrawn_at,
  ep.withdrawal_classification,
  geo.classification as geography_classification,
  coalesce(s.completion_date, completed.completed_at) as completion_date,
  award.awarded_at as credential_awarded_at,
  award.award_status as credential_award_status,
  case when ep.scheduled_completion_date is not null
       then ep.scheduled_completion_date + ((ep.scheduled_completion_date - coalesce(ep.scheduled_start_date, ep.enrolled_at::date)) / 2)
       else null end as completion_150pct_deadline
from public.enrollment_periods ep
join public.students s on s.user_id = ep.user_id
left join public.program_versions pv on pv.id = ep.program_version_id
left join lateral (
  select g.classification from public.student_geography_classifications g
  where g.user_id = ep.user_id and g.effective_at <= coalesce(ep.withdrawn_at, now())
  order by g.effective_at desc limit 1
) geo on true
left join lateral (
  select max(mp.completed_at) as completed_at
  from public.module_progress mp
  where mp.user_id = ep.user_id and mp.track_code = ep.track_code
) completed on true
left join lateral (
  select a.awarded_at, a.award_status from public.credential_awards a
  where a.enrollment_period_id = ep.id
  order by a.awarded_at desc, a.recorded_at desc limit 1
) award on true
where public.is_admin();

grant select on public.admin_enrollment_reporting to authenticated;

-- Extend the existing admin dashboard view with its latest episode fields.
-- Existing columns keep their names, positions, and semantics for backward
-- compatibility: Postgres's CREATE OR REPLACE VIEW only permits appending
-- new columns at the end, never renaming or reordering ones that already
-- exist (it previously rejected this file for putting user_id first, ahead
-- of the existing student_id in column 1). So the 15 columns already in the
-- live view stay first, in their original order, and every new column added
-- here (scheduled_completion_date, enrollment_period_id,
-- program_version_code, credential_code, credential_name,
-- geography_classification, user_id) is appended after status.
create or replace view public.admin_student_progress
with (security_invoker = true) as
select
  s.student_id,
  s.track_code,
  case s.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end as program_slug,
  coalesce(cp.modules_total, 12) as modules_total,
  coalesce(cp.modules_complete, 0) as modules_complete,
  coalesce(cp.percent_complete, 0) as percent_complete,
  cs.overall_score as capstone_overall_score,
  cp.last_active,
  coalesce(cp.modules_in_progress, 0) as modules_in_progress,
  s.is_enrolled,
  s.enrollment_date,
  s.withdrawal_date,
  coalesce(ep.scheduled_start_date, s.scheduled_start_date) as scheduled_start_date,
  coalesce(
    s.completion_date,
    case when coalesce(cp.percent_complete, 0) >= 100 then (
      select max(mp.completed_at)
      from public.module_progress mp
      where mp.user_id = s.user_id
        and mp.track_code = s.track_code
    ) else null end
  ) as completion_date,
  case
    when award.award_status = 'awarded' then 'credential_awarded'
    when s.completion_date is not null or coalesce(cp.percent_complete, 0) >= 100 then 'completed'
    when not s.is_enrolled and s.enrollment_date is not null then 'withdrawn'
    when s.is_enrolled then 'active'
    else 'not_yet_started'
  end as status,
  ep.scheduled_completion_date,
  ep.id as enrollment_period_id,
  pv.version_code as program_version_code,
  pv.credential_code,
  pv.credential_name,
  geo.classification as geography_classification,
  s.user_id
from public.students s
left join public.course_progress cp on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs on cs.user_id = s.user_id and cs.track_code = s.track_code
left join lateral (
  select * from public.enrollment_periods p
  where p.user_id = s.user_id and p.track_code = s.track_code
  order by p.enrolled_at desc limit 1
) ep on true
left join public.program_versions pv on pv.id = ep.program_version_id
left join lateral (
  select g.classification from public.student_geography_classifications g
  where g.user_id = s.user_id order by g.effective_at desc limit 1
) geo on true
left join lateral (
  select a.award_status from public.credential_awards a
  where a.enrollment_period_id = ep.id order by a.awarded_at desc, a.recorded_at desc limit 1
) award on true
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

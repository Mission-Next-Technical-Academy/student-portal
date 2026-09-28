-- Mission Next Technical Academy — L-002: IT Help Desk (HDESK) program version.
--
-- WHY (Launch Control Framework HD-03 / GOV-03 / DATA-01 / CIE-01):
--   A controlled, active Help Desk program version must exist before any Help
--   Desk student is enrolled. Each student's enrollment, hours and completion
--   reporting must point to the version they enrolled under, and historical
--   records keep that version when the curriculum later changes.
--
-- WHAT THIS MIGRATION DOES (built and tested one section at a time):
--   Section A — add the HDESK-2026-09-25 row to program_versions.
--   Section B — link every hour row in program_course_hours to the program
--               version it belongs to (Help Desk and SOC).
--   Section C — award hours from the student's ENROLLED version instead of
--               the newest hour map (shared function; SOC keeps the same hours).
--   Section D — Help Desk-only guards on enrollment_periods: an enrollment must
--               carry an active HDESK version, and that version can never change.
--
-- This is a NEW migration on purpose. Applied migrations are history and are
-- never edited.

-- ---------------------------------------------------------------------------
-- Section A — the Help Desk program version
-- ---------------------------------------------------------------------------
-- Program facts come from School Catalog v1.2 (the academic source of truth):
--   Mission Next: IT Help Desk & Career Accelerator, Diploma, 6 weeks,
--   72 clock hours = 60 technical (ITHD-101) + 12 M360-101.
-- effective_from matches the approved hour map (2026-09-25-ithd-hour-map-v1).
-- Safe to re-run: on conflict do nothing.

insert into public.program_versions
  (track_code, version_code, program_name, credential_code, credential_name,
   reporting_program_code, approved_duration_days, approved_total_hours,
   effective_from, is_active)
values
  ('HDESK', 'HDESK-2026-09-25', 'Mission Next: IT Help Desk & Career Accelerator',
   'HDESK-DIP', 'Diploma', 'HDESK', 42, 72, date '2026-09-25', true)
on conflict (version_code) do nothing;

-- ---------------------------------------------------------------------------
-- Section B — link hour rows to their program version
-- ---------------------------------------------------------------------------
-- Until now an hour row only carried a free-text curriculum_revision label,
-- with nothing tying it to a program version. This adds program_version_id so
-- each version has exactly one approved hour map.
--
-- The column is nullable so any future track without a version keeps working
-- exactly as today. The composite foreign key (program_version_id, track_code)
-- means an hour row can only point at a version of its OWN track: a Help Desk
-- hour row can never be attached to a SOC version (DATA-01).

-- A version id + track pair must be unique so the composite key can point at it.
-- (id is already the primary key, so this adds no new restriction on versions.)
alter table public.program_versions
  add constraint program_versions_id_track_key unique (id, track_code);

alter table public.program_course_hours
  add column program_version_id uuid;

alter table public.program_course_hours
  add constraint program_course_hours_version_fkey
  foreign key (program_version_id, track_code)
  references public.program_versions (id, track_code)
  on delete restrict;

-- Within one version, each course/module has at most one hour row.
create unique index program_course_hours_one_row_per_version_course
  on public.program_course_hours (program_version_id, course_key)
  where program_version_id is not null;

comment on column public.program_course_hours.program_version_id is
  'The program version this approved hour allocation belongs to. Students earn hours from the version they enrolled under (L-002 / HD-03).';

-- Help Desk: the approved 72-hour map (L-001) belongs to HDESK-2026-09-25.
update public.program_course_hours pch
set program_version_id = pv.id
from public.program_versions pv
where pv.version_code = 'HDESK-2026-09-25'
  and pch.track_code = 'HDESK'
  and pch.curriculum_revision = '2026-09-25-ithd-hour-map-v1';

-- SOC: its single existing hour map belongs to its single existing version.
-- SOC students earn exactly the same hours as before; this only records the link.
update public.program_course_hours pch
set program_version_id = pv.id
from public.program_versions pv
where pv.version_code = 'SOCAN-2026-08-28'
  and pch.track_code = 'SOCAN'
  and pch.curriculum_revision = '2026-08-28-developer-map-v1';

-- Guard: stop the whole migration (nothing is applied) unless the Help Desk
-- version's hour map is complete and reconciles to 60 technical + 12 M360.
do $$
declare
  v_rows      integer;
  v_technical integer;
  v_career    integer;
begin
  select count(*),
         coalesce(sum(pch.credit_minutes) filter (where pch.classification = 'technical'), 0),
         coalesce(sum(pch.credit_minutes) filter (where pch.classification = 'career_readiness'), 0)
  into v_rows, v_technical, v_career
  from public.program_course_hours pch
  join public.program_versions pv on pv.id = pch.program_version_id
  where pv.version_code = 'HDESK-2026-09-25'
    and pch.active = true;

  if v_rows <> 13 or v_technical <> 3600 or v_career <> 720 then
    raise exception 'HDESK-2026-09-25 hour map does not reconcile: % rows (expected 13), technical % min (expected 3600), career % min (expected 720)',
      v_rows, v_technical, v_career;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Section C — award hours from the student's enrolled version
-- ---------------------------------------------------------------------------
-- Replaces public.award_fixed_module_credit() from 20260829130000_fixed_credit_hours.sql.
-- Production was verified identical to that file on 2026-09-28
-- (md5 of the body 09a92668f9323d542e067c9d986b188f, 1216 characters).
--
-- Before: a completed module earned the NEWEST active hour row for the track.
--         If a new hour map were ever added, students already enrolled would
--         silently earn the new hours (breaks HD-03 / CIE-05 historical truth).
-- After:
--   1. Never award the same module twice, under any version (prevents double-
--      counting if an admin reopens and re-completes a module).
--   2. Look up the version on the student's most recent enrollment episode for
--      this track (same rule the completion snapshot uses) and award that
--      version's hours.
--   3. No version, or no hour row for this module in that version:
--        * HDESK: award nothing. HD-03 requires every Help Desk record to point
--          at a version; the Section D guard makes this impossible for real
--          enrollments.
--        * Other tracks: fall back to the original behavior (newest active row),
--          so SOC and any other track behave exactly as before.
-- SOC has one version and one hour map, so SOC students earn the same hours.
-- The trigger (module_progress_award_fixed_credit) is unchanged; replacing the
-- function body is enough, and the trigger keeps its name and firing order
-- (it still runs before module_progress_completion_snapshot).

create or replace function public.award_fixed_module_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allocation   public.program_course_hours%rowtype;
  v_version_id uuid;
  v_found      boolean := false;
begin
  -- Only a complete module earns a fixed credit.
  if new.state <> 'complete' then
    return new;
  end if;

  -- 1. One award per module per student, whatever the version.
  if exists (
    select 1
    from public.student_course_hour_awards a
    where a.user_id = new.user_id
      and a.track_code = new.track_code
      and a.course_key = new.module_key
  ) then
    return new;
  end if;

  -- 2. The version the student enrolled under.
  select ep.program_version_id into v_version_id
  from public.enrollment_periods ep
  where ep.user_id = new.user_id
    and ep.track_code = new.track_code
  order by ep.enrolled_at desc
  limit 1;

  if v_version_id is not null then
    select * into allocation
    from public.program_course_hours
    where program_version_id = v_version_id
      and course_key = new.module_key
      and active = true;
    v_found := found;
  end if;

  -- 3. No versioned hour row.
  if not v_found then
    if new.track_code = 'HDESK' then
      return new;
    end if;

    select * into allocation
    from public.program_course_hours
    where track_code = new.track_code
      and course_key = new.module_key
      and active = true
    order by curriculum_revision desc
    limit 1;

    if not found then
      return new;
    end if;
  end if;

  insert into public.student_course_hour_awards (
    user_id, track_code, course_key, course_title_snapshot, credit_minutes,
    classification, curriculum_revision, source_module_completed_at, awarded_at
  ) values (
    new.user_id, new.track_code, allocation.course_key, allocation.course_title,
    allocation.credit_minutes, allocation.classification, allocation.curriculum_revision,
    new.completed_at, coalesce(new.completed_at, now())
  ) on conflict (user_id, track_code, course_key, curriculum_revision) do nothing;

  return new;
end;
$$;

-- Trigger functions never need to be called directly. Remove the default
-- execute grant (SEC-02), matching 20260916100000_verified_assessment_progress.sql.
-- The trigger still fires normally.
revoke all on function public.award_fixed_module_credit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Section D — Help Desk enrollment guards (HDESK only)
-- ---------------------------------------------------------------------------
-- HD-03: "A controlled active Help Desk program-version record and approved
-- course/hour allocation must exist before a student is enrolled ... Historical
-- records retain the version under which the student enrolled."
--
-- Enrollment episodes are created by record_enrollment_period_transition()
-- when an admin enrolls a student. That shared function is NOT changed here.
-- Instead, two new triggers act only on Help Desk rows:
--   1. Before insert: a Help Desk episode must point at an ACTIVE Help Desk
--      version. Otherwise the insert fails, which also cancels the admin's
--      enroll action with a clear message.
--   2. Before update: a Help Desk episode's version (and track) can never be
--      changed afterwards. Dates, withdrawal and closing still update normally.
-- Same pattern as m360_enrollment_version_immutable() in
-- 20260914221720_m360_version_enrollment_binding.sql.

create or replace function public.hdesk_enrollment_require_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.track_code <> 'HDESK' then
    return new;
  end if;

  if new.program_version_id is null then
    raise exception 'Help Desk enrollment requires an active HDESK program version (HD-03). No active version was found.';
  end if;

  if not exists (
    select 1
    from public.program_versions pv
    where pv.id = new.program_version_id
      and pv.track_code = 'HDESK'
      and pv.is_active
  ) then
    raise exception 'Help Desk enrollment must point at an active HDESK program version (HD-03).';
  end if;

  return new;
end;
$$;

create trigger enrollment_periods_hdesk_require_version
  before insert on public.enrollment_periods
  for each row
  execute function public.hdesk_enrollment_require_version();

create or replace function public.hdesk_enrollment_version_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.track_code <> 'HDESK' and new.track_code <> 'HDESK' then
    return new;
  end if;

  if new.program_version_id is distinct from old.program_version_id
     or new.track_code is distinct from old.track_code then
    raise exception 'A Help Desk enrollment keeps the program version and track it was enrolled under (HD-03).';
  end if;

  return new;
end;
$$;

create trigger enrollment_periods_hdesk_version_immutable
  before update of program_version_id, track_code on public.enrollment_periods
  for each row
  execute function public.hdesk_enrollment_version_immutable();

-- Trigger functions are never called directly (SEC-02).
revoke all on function public.hdesk_enrollment_require_version() from public, anon, authenticated;
revoke all on function public.hdesk_enrollment_version_immutable() from public, anon, authenticated;

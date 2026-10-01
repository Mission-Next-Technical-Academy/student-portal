-- Mission Next Technical Academy — L-002 follow-up / repo audit F2:
-- students created ALREADY ENROLLED get no enrollment history.
--
-- THE DEFECT (live on master):
--   create_cohort (supabase/functions/admin-provision/provisioning.ts) INSERTS
--   students with is_enrolled = true. Both enrollment triggers on public.students
--   only fire on UPDATE, when is_enrolled flips false -> true:
--     * stamp_enrollment_dates()             (20260829110000_enrollment_dates.sql)
--     * record_enrollment_period_transition() (20260829125000_enrollment_reporting_history.sql)
--   So a cohort student never gets students.enrollment_date, never gets an
--   enrollment_periods row, and therefore never gets a program version.
--
-- CONSEQUENCES:
--   * Help Desk: after 20260928120000_hdesk_program_version.sql, hours come
--     from the enrolled version, so cohort Help Desk students would earn none.
--   * All tracks: record_completion_reporting_snapshot() needs an enrollment
--     period and silently skips the official completion record without one.
--     Proven live Oct 1: test account 7159302294-HDESK completed 12 modules on
--     Sep 30 and has completion_date set but 0 completion_reporting_snapshots.
--   * All tracks: enrollment/withdrawal/completion reporting (Form 801) and
--     admin_update_current_enrollment_plan() silently skip these students.
--   Live before this migration: 5 enrolled learners with no open period
--   (2 SOCAN, 2 HDESK, 1 ELECT), all from the Sep 1 test cohort.
--
-- WHAT THIS MIGRATION DOES (built and tested one section at a time):
--   Section A — stamp enrollment_date when a student is inserted already enrolled.
--   Section B — create the open enrollment period, with the track's active
--               program version, when a learner is inserted already enrolled.
--   Section C — one-time backfill for students already enrolled with no
--               enrollment_date and/or no open enrollment period.
--   Section D — safety check: the migration fails unless every enrolled
--               learner has an open period and every open Help Desk period
--               has a version.
--
-- Fixed in the database, not in provisioning.ts, so every insert path is
-- covered (edge function, scripts, seed, SQL). Existing triggers and functions
-- are not modified. This is a NEW migration; applied migrations are never edited.

-- ---------------------------------------------------------------------------
-- Section A — enrollment_date on insert
-- ---------------------------------------------------------------------------
-- Mirrors the enroll branch of stamp_enrollment_dates(), which only runs on
-- update. coalesce keeps any date the inserting code supplied on purpose.
-- Same-table, BEFORE trigger touching only NEW's own column, so it needs no
-- security definer (same reasoning as stamp_enrollment_dates()).

create or replace function public.stamp_enrollment_date_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_enrolled then
    new.enrollment_date := coalesce(new.enrollment_date, now());
  end if;
  return new;
end;
$$;

create trigger students_stamp_enrollment_date_on_insert
  before insert on public.students
  for each row
  execute function public.stamp_enrollment_date_on_insert();

-- Trigger functions are never called directly (SEC-02).
revoke all on function public.stamp_enrollment_date_on_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Section B — enrollment period on insert
-- ---------------------------------------------------------------------------
-- Mirrors the enroll branch of record_enrollment_period_transition(), which
-- only runs on update. Same version rule: the track's active program version.
--
-- Learner tracks only. enrollment_periods.track_code allows only these four;
-- ADMIN and instructor accounts (HDINST, SOCANINST) never get a period, the
-- same as on the update path.
--
-- Help Desk: if no HDESK version is active, the L-002 guard
-- enrollment_periods_hdesk_require_version (20260928120000) refuses this
-- insert, which also cancels the students insert (HD-03: a Help Desk student
-- can't exist without a controlled version). Other tracks with no version
-- (AIENG, ELECT today) get a period with no version, as on the update path.
--
-- enrolled_at uses the enrollment_date Section A just stamped, so both records
-- agree. on conflict ... do nothing: the partial unique index
-- enrollment_periods_one_open_epoch allows one open period per student/track.
-- security definer because it writes a different table than the one the
-- trigger is on (same as record_enrollment_period_transition()).

create or replace function public.record_enrollment_period_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version_id uuid;
begin
  if not new.is_enrolled
     or new.track_code not in ('SOCAN', 'HDESK', 'AIENG', 'ELECT') then
    return new;
  end if;

  select id into v_version_id
  from public.program_versions
  where track_code = new.track_code and is_active
  order by effective_from desc
  limit 1;

  insert into public.enrollment_periods
    (user_id, track_code, program_version_id, enrolled_at, scheduled_start_date, created_by)
  values
    (new.user_id, new.track_code, v_version_id,
     coalesce(new.enrollment_date, now()), new.scheduled_start_date, auth.uid())
  on conflict (user_id, track_code) where withdrawn_at is null do nothing;

  return new;
end;
$$;

create trigger students_record_enrollment_period_on_insert
  after insert on public.students
  for each row
  execute function public.record_enrollment_period_on_insert();

-- Trigger functions are never called directly (SEC-02).
revoke all on function public.record_enrollment_period_on_insert() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Section C — one-time backfill
-- ---------------------------------------------------------------------------
-- Students created before Sections A and B existed. Live before this
-- migration: 2 SOCAN, 2 HDESK, 1 ELECT learners from the Sep 1 test cohort,
-- plus enrolled instructor accounts with no enrollment_date.
--
-- Enrollment date: the account's created_at. A cohort account is enrolled at
-- the moment it is created, so created_at is when it was enrolled (approved
-- assumption; these are test accounts). Existing dates are never changed.
--
-- Version: the track's active program version, the same rule as the update
-- and insert triggers. Runs after 20260928120000, so HDESK-2026-09-25 exists.
--
-- Not repaired here: a completion record that was already skipped. Test
-- account 7159302294-HDESK completed on Sep 30 with no enrollment period, so
-- it has completion_date but no completion_reporting_snapshots row. It is a
-- test account; it is documented, not regenerated (Code Issues Log).

-- C1. enrollment_date for enrolled accounts that never got one. ADMIN is
--     excluded (never enrolled in a program). Instructors are included, the
--     same as stamp_enrollment_dates() and Section A treat them.
update public.students
set enrollment_date = created_at
where is_enrolled
  and enrollment_date is null
  and track_code <> 'ADMIN';

-- C2. Open enrollment period for enrolled learners that have none.
insert into public.enrollment_periods
  (user_id, track_code, program_version_id, enrolled_at, scheduled_start_date, created_by, created_at)
select
  s.user_id,
  s.track_code,
  (select pv.id
   from public.program_versions pv
   where pv.track_code = s.track_code and pv.is_active
   order by pv.effective_from desc
   limit 1),
  coalesce(s.enrollment_date, s.created_at),
  s.scheduled_start_date,
  null,
  now()
from public.students s
where s.is_enrolled
  and s.track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')
  and not exists (
    select 1
    from public.enrollment_periods ep
    where ep.user_id = s.user_id
      and ep.track_code = s.track_code
      and ep.withdrawn_at is null
  );

-- ---------------------------------------------------------------------------
-- Section D — safety check
-- ---------------------------------------------------------------------------
-- Fails the whole migration (nothing above is applied) if the backfill left
-- any enrolled learner without an open period, or any open Help Desk period
-- without a version (HD-03).
do $$
declare
  v_missing_period  integer;
  v_hdesk_no_version integer;
begin
  select count(*) into v_missing_period
  from public.students s
  where s.is_enrolled
    and s.track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')
    and not exists (
      select 1 from public.enrollment_periods ep
      where ep.user_id = s.user_id and ep.track_code = s.track_code and ep.withdrawn_at is null
    );

  select count(*) into v_hdesk_no_version
  from public.enrollment_periods ep
  where ep.track_code = 'HDESK'
    and ep.withdrawn_at is null
    and ep.program_version_id is null;

  if v_missing_period > 0 or v_hdesk_no_version > 0 then
    raise exception 'Enrollment backfill incomplete: % enrolled learner(s) without an open period, % open Help Desk period(s) without a version',
      v_missing_period, v_hdesk_no_version;
  end if;
end;
$$;

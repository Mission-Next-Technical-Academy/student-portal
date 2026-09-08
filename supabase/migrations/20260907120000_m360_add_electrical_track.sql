-- Mission Next Technical Academy — widen M360 101 eligibility to the
-- Electrical track (ELECT).
--
-- M360 is career-readiness coursework required of every enrolled student
-- regardless of technical track. The original Gate 3 migration
-- (20260904012000_m360_core.sql) only listed SOCAN/HDESK/AIENG because those
-- were the only tracks with real students at the time; ELECT was omitted, not
-- deliberately excluded. This migration is additive/isolated the same way the
-- original was: it only widens the M360 track allow-list, and does not touch
-- module_progress, lab_attempts, capstone, or technical-course objects.

alter table public.m360_course_records
  drop constraint m360_course_records_track_code_check;
alter table public.m360_course_records
  add constraint m360_course_records_track_code_check
  check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT'));

alter table public.m360_week_records
  drop constraint m360_week_records_track_code_check;
alter table public.m360_week_records
  add constraint m360_week_records_track_code_check
  check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT'));

alter table public.m360_week_submissions
  drop constraint m360_week_submissions_track_code_check;
alter table public.m360_week_submissions
  add constraint m360_week_submissions_track_code_check
  check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT'));

create or replace function public.m360_current_student_track()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.track_code
  from public.students s
  where s.user_id = auth.uid()
    and s.is_enrolled = true
    and s.track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')
  limit 1;
$$;

create or replace function public.m360_admin_set_attendance(
  p_user_id uuid,
  p_requirement_met boolean,
  p_external_reference text default null
)
returns public.m360_course_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_row public.m360_course_records;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  select track_code into v_track
  from public.students
  where user_id = p_user_id
    and is_enrolled = true
    and track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT');

  if v_track is null then raise exception 'Selected student is not eligible for M360'; end if;

  insert into public.m360_course_records (
    user_id, track_code, attendance_requirement_met,
    attendance_verified_by, attendance_verified_at, attendance_external_reference
  ) values (
    p_user_id, v_track, p_requirement_met,
    case when p_requirement_met then auth.uid() else null end,
    case when p_requirement_met then now() else null end,
    p_external_reference
  )
  on conflict (user_id) do update set
    track_code = excluded.track_code,
    attendance_requirement_met = excluded.attendance_requirement_met,
    attendance_verified_by = excluded.attendance_verified_by,
    attendance_verified_at = excluded.attendance_verified_at,
    attendance_external_reference = excluded.attendance_external_reference
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.m360_admin_set_spotlight_presentation(
  p_user_id uuid,
  p_status text,
  p_reference text default null
)
returns public.m360_course_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_row public.m360_course_records;
  v_verified boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in (
    'not_completed',
    'presented_live',
    'approved_makeup_completed',
    'approved_exception_completed'
  ) then
    raise exception 'Invalid Career Spotlight presentation status';
  end if;

  select track_code into v_track
  from public.students
  where user_id = p_user_id
    and is_enrolled = true
    and track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT');

  if v_track is null then raise exception 'Selected student is not eligible for M360'; end if;
  v_verified := p_status <> 'not_completed';

  insert into public.m360_course_records (
    user_id, track_code,
    career_spotlight_presentation_status,
    career_spotlight_presentation_reference,
    career_spotlight_presentation_verified_by,
    career_spotlight_presentation_verified_at
  ) values (
    p_user_id, v_track, p_status,
    case when v_verified then nullif(trim(p_reference), '') else null end,
    case when v_verified then auth.uid() else null end,
    case when v_verified then now() else null end
  )
  on conflict (user_id) do update set
    track_code = excluded.track_code,
    career_spotlight_presentation_status = excluded.career_spotlight_presentation_status,
    career_spotlight_presentation_reference = excluded.career_spotlight_presentation_reference,
    career_spotlight_presentation_verified_by = excluded.career_spotlight_presentation_verified_by,
    career_spotlight_presentation_verified_at = excluded.career_spotlight_presentation_verified_at
  returning * into v_row;

  return v_row;
end;
$$;

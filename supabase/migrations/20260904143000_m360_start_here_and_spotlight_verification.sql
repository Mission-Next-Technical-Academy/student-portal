-- Mission Next Technical Academy — M360 101 Start Here + Career Spotlight verification.
-- Additive M360-only extension. This migration does not alter technical-course
-- progress, labs, timekeeping, completion, or reporting objects.

alter table public.m360_course_records
  add column if not exists start_here_payload jsonb not null default '{}'::jsonb,
  add column if not exists start_here_completed_at timestamptz,
  add column if not exists start_here_acknowledgments_complete boolean not null default false,
  add column if not exists start_here_support_flag boolean not null default false,
  add column if not exists career_spotlight_presentation_status text not null default 'not_completed',
  add column if not exists career_spotlight_presentation_reference text,
  add column if not exists career_spotlight_presentation_verified_by uuid references auth.users(id) on delete set null,
  add column if not exists career_spotlight_presentation_verified_at timestamptz;

alter table public.m360_course_records
  drop constraint if exists m360_course_records_spotlight_status_check;
alter table public.m360_course_records
  add constraint m360_course_records_spotlight_status_check
  check (career_spotlight_presentation_status in (
    'not_completed',
    'presented_live',
    'approved_makeup_completed',
    'approved_exception_completed'
  ));

alter table public.m360_course_records
  drop constraint if exists m360_course_records_spotlight_verifier_check;
alter table public.m360_course_records
  add constraint m360_course_records_spotlight_verifier_check
  check (
    (career_spotlight_presentation_status = 'not_completed'
      and career_spotlight_presentation_verified_by is null
      and career_spotlight_presentation_verified_at is null)
    or
    (career_spotlight_presentation_status <> 'not_completed'
      and career_spotlight_presentation_verified_by is not null
      and career_spotlight_presentation_verified_at is not null)
  );

comment on column public.m360_course_records.start_here_payload is
  'Student-owned M360 Start Here baseline and readiness responses. Start Here is ungraded and carries no instructional clock-hour credit.';
comment on column public.m360_course_records.career_spotlight_presentation_status is
  'Staff-owned Career Spotlight presentation verification; students do not self-report this completion field.';

create or replace function public.m360_save_start_here(
  p_payload jsonb,
  p_complete boolean default false,
  p_acknowledgments_complete boolean default false,
  p_support_flag boolean default false
)
returns public.m360_course_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_row public.m360_course_records;
  v_now timestamptz := now();
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'M360 Start Here payload must be a JSON object';
  end if;
  if p_complete and not p_acknowledgments_complete then
    raise exception 'All Start Here acknowledgments are required before completion';
  end if;

  v_track := public.m360_current_student_track();
  if v_track is null then raise exception 'M360 access is not available for this account'; end if;

  insert into public.m360_course_records (
    user_id, track_code, start_here_payload, start_here_completed_at,
    start_here_acknowledgments_complete, start_here_support_flag
  ) values (
    auth.uid(), v_track, p_payload,
    case when p_complete then v_now else null end,
    p_acknowledgments_complete,
    p_support_flag
  )
  on conflict (user_id) do update set
    track_code = excluded.track_code,
    start_here_payload = excluded.start_here_payload,
    start_here_completed_at = case
      when public.m360_course_records.start_here_completed_at is not null
        then public.m360_course_records.start_here_completed_at
      when excluded.start_here_completed_at is not null
        then excluded.start_here_completed_at
      else null
    end,
    start_here_acknowledgments_complete =
      public.m360_course_records.start_here_acknowledgments_complete
      or excluded.start_here_acknowledgments_complete,
    start_here_support_flag = excluded.start_here_support_flag
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
    and track_code in ('SOCAN', 'HDESK', 'AIENG');

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

create or replace view public.m360_course_progress
with (security_invoker = true) as
select
  c.user_id,
  c.track_code,
  count(w.week_number) filter (where w.accepted_artifact_payload is not null) as accepted_artifact_count,
  count(w.week_number) filter (
    where w.accepted_artifact_payload is not null and w.numeric_score is not null
  ) as graded_week_count,
  case
    when count(w.week_number) filter (
      where w.accepted_artifact_payload is not null and w.numeric_score is not null
    ) = 6
    then round(avg(w.numeric_score) filter (where w.accepted_artifact_payload is not null), 2)
    else null
  end as final_grade,
  (
    coalesce(bool_or(w.week_number = 6 and w.accepted_artifact_payload is not null), false)
    and c.career_spotlight_presentation_status <> 'not_completed'
  ) as career_spotlight_complete,
  c.attendance_requirement_met,
  c.attendance_verified_by,
  c.attendance_verified_at,
  c.attendance_external_reference,
  (
    count(w.week_number) filter (where w.accepted_artifact_payload is not null) = 6
    and count(w.week_number) filter (
      where w.accepted_artifact_payload is not null and w.numeric_score is not null
    ) = 6
    and avg(w.numeric_score) filter (where w.accepted_artifact_payload is not null) >= 70
    and coalesce(bool_or(w.week_number = 6 and w.accepted_artifact_payload is not null), false)
    and c.career_spotlight_presentation_status <> 'not_completed'
    and c.attendance_requirement_met = true
  ) as course_complete,
  c.start_here_completed_at,
  c.start_here_acknowledgments_complete,
  c.start_here_support_flag,
  c.career_spotlight_presentation_status,
  c.career_spotlight_presentation_reference,
  c.career_spotlight_presentation_verified_by,
  c.career_spotlight_presentation_verified_at
from public.m360_course_records c
left join public.m360_week_records w on w.user_id = c.user_id
group by c.user_id, c.track_code, c.attendance_requirement_met,
         c.attendance_verified_by, c.attendance_verified_at, c.attendance_external_reference,
         c.start_here_completed_at, c.start_here_acknowledgments_complete, c.start_here_support_flag,
         c.career_spotlight_presentation_status, c.career_spotlight_presentation_reference,
         c.career_spotlight_presentation_verified_by, c.career_spotlight_presentation_verified_at;

revoke all on function public.m360_save_start_here(jsonb, boolean, boolean, boolean) from public;
revoke all on function public.m360_admin_set_spotlight_presentation(uuid, text, text) from public;
grant execute on function public.m360_save_start_here(jsonb, boolean, boolean, boolean) to authenticated;
grant execute on function public.m360_admin_set_spotlight_presentation(uuid, text, text) to authenticated;

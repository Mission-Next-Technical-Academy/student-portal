-- Mission Next Technical Academy — canonical M360 eligibility and admin
-- program-progress read model.
--
-- ADDITIVE / READ-ONLY BOUNDARY:
-- This migration leaves module_progress, course_progress,
-- admin_student_progress, technical hours, and technical completion writes
-- unchanged. It only centralizes M360 eligibility and adds an admin-gated
-- read model for the multi-track administration UI.

-- ================================================= canonical M360 policy
--
-- All currently offered technical tracks require M360. Keep this immutable
-- predicate as the one database source used by M360 constraints and student
-- authorization. ADMIN (and any future non-technical track) is deliberately
-- not eligible.
create or replace function public.m360_track_is_eligible(p_track_code text)
returns boolean
language sql
immutable
strict
set search_path = public
as $$
  select p_track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT');
$$;

comment on function public.m360_track_is_eligible(text) is
  'Canonical M360 eligibility policy. SOCAN, HDESK, AIENG, and ELECT require M360.';

-- The prior Electrical expansion used literal allow-lists in these checks.
-- Rebuild them against the canonical predicate without changing any row data.
alter table public.m360_course_records
  drop constraint if exists m360_course_records_track_code_check;
alter table public.m360_course_records
  add constraint m360_course_records_track_code_check
  check (public.m360_track_is_eligible(track_code));

alter table public.m360_week_records
  drop constraint if exists m360_week_records_track_code_check;
alter table public.m360_week_records
  add constraint m360_week_records_track_code_check
  check (public.m360_track_is_eligible(track_code));

alter table public.m360_week_submissions
  drop constraint if exists m360_week_submissions_track_code_check;
alter table public.m360_week_submissions
  add constraint m360_week_submissions_track_code_check
  check (public.m360_track_is_eligible(track_code));

-- Existing student-facing write RPCs all resolve the current track through
-- this function. Replacing only that eligibility predicate preserves their
-- signatures, security-definer setting, grants, and write behavior.
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
    and public.m360_track_is_eligible(s.track_code)
  limit 1;
$$;

-- These staff write RPCs create a course record before a student has any M360
-- work. Their only eligibility change is replacing the duplicated allow-list
-- with the policy above; signatures, privileges, and all other behavior stay
-- exactly as established by the prior M360 migrations.
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
    and public.m360_track_is_eligible(track_code);

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
    and public.m360_track_is_eligible(track_code);

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

-- ================================================= admin program progress
--
-- security_invoker keeps RLS active on students, course_progress, and M360
-- sources. The explicit predicate is a second, defensive gate: authenticated
-- non-admins receive no roster rows even though they retain their existing
-- ability to read their own underlying records.
create or replace view public.admin_student_program_progress
with (security_invoker = true) as
select
  s.student_id,
  s.user_id,
  s.track_code,
  case s.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end as program_slug,
  s.is_enrolled,

  coalesce(cp.modules_complete, 0)::int as technical_completed,
  12::int as technical_required,
  round(coalesce(cp.modules_complete, 0) * 100.0 / 12.0, 1) as technical_percent,
  coalesce(cp.modules_in_progress, 0)::int as technical_in_progress,
  cp.last_active as technical_last_active,

  public.m360_track_is_eligible(s.track_code) as m360_required,
  -- Keep record existence distinct from zero accepted weeks: a staff-created
  -- or Start Here record is progress evidence even before any week is accepted.
  (mr.user_id is not null) as m360_record_exists,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.accepted_artifact_count, 0)::int
    else null
  end as m360_accepted_weeks,
  case when public.m360_track_is_eligible(s.track_code) then 6 else null end
    as m360_required_weeks,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.graded_week_count, 0)::int
    else null
  end as m360_graded_weeks,
  case when public.m360_track_is_eligible(s.track_code) then mp.final_grade else null end
    as m360_final_grade,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.start_here_completed_at is not null, false)
    else null
  end as m360_start_here_complete,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.career_spotlight_complete, false)
    else null
  end as m360_spotlight_complete,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.attendance_requirement_met, false)
    else null
  end as m360_attendance_complete,
  case when public.m360_track_is_eligible(s.track_code)
    then coalesce(mp.course_complete, false)
    else null
  end as m360_course_complete,

  -- Project only bounded readiness signals, never the Start Here JSON payload.
  case
    when mr.start_here_payload ->> 'networkingComfort' ~ '^[1-5]$'
      then (mr.start_here_payload ->> 'networkingComfort')::int
    else null
  end as networking_comfort,
  case
    when mr.start_here_payload ->> 'interviewReadiness' ~ '^[1-5]$'
      then (mr.start_here_payload ->> 'interviewReadiness')::int
    else null
  end as interview_readiness,
  case when mr.user_id is not null then mr.start_here_support_flag else null end
    as support_flag,

  (
    coalesce(cp.modules_complete, 0)::int
    + case when public.m360_track_is_eligible(s.track_code)
        then coalesce(mp.accepted_artifact_count, 0)::int
        else 0
      end
  ) as work_items_completed,
  (
    12
    + case when public.m360_track_is_eligible(s.track_code) then 6 else 0 end
  )::int as work_items_required,
  round(
    (
      coalesce(cp.modules_complete, 0)::numeric
      + case when public.m360_track_is_eligible(s.track_code)
          then coalesce(mp.accepted_artifact_count, 0)::numeric
          else 0
        end
    ) * 100.0
    / (12 + case when public.m360_track_is_eligible(s.track_code) then 6 else 0 end),
    1
  ) as work_items_percent,
  (
    coalesce(cp.modules_complete, 0) = 12
    and (
      not public.m360_track_is_eligible(s.track_code)
      or coalesce(mp.course_complete, false)
    )
  ) as program_requirements_complete
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.m360_course_progress mp
  on mp.user_id = s.user_id
left join public.m360_course_records mr
  on mr.user_id = s.user_id
where public.is_admin();

comment on view public.admin_student_program_progress is
  'Admin-only multi-track program-progress read model. Technical work remains 12 units; M360-eligible tracks add six accepted-week units. m360_record_exists distinguishes no M360 course record from a record with zero accepted weeks. Readiness is limited to the three approved Start Here projections, never the raw payload.';

revoke all on function public.m360_track_is_eligible(text) from public;
revoke execute on function public.m360_track_is_eligible(text) from anon;
grant execute on function public.m360_track_is_eligible(text) to authenticated;

revoke all on public.admin_student_program_progress from anon;
grant select on public.admin_student_program_progress to authenticated;

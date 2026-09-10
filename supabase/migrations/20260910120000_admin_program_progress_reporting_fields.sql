-- Mission Next Technical Academy — restore enrollment/credential/reporting
-- columns on the admin multi-track roster view.
--
-- Bug: the admin roster query (portal/app.js, Student Progress tab) reads
-- status, enrollment/withdrawal/completion/scheduled dates, program version,
-- credential code/name, geography classification, and credited-minutes
-- fields from admin_student_program_progress. That view
-- (20260907123000_m360_eligibility_admin_program_progress.sql) only ever
-- exposed the technical/M360 projection — it never carried these reporting
-- columns, which live solely on the older, single-track admin_student_progress
-- view (20260901090000_completion_reporting_snapshot.sql). Under a wildcard
-- select('*') this silently returned undefined for every consumer of those
-- fields (applyAdminDashboardState, status badges, compliance/annual
-- exports); naming the columns explicitly (Sprint 3 of the query-performance
-- audit) turned that into a hard "column ... does not exist" PostgREST
-- error, surfaced in the admin UI as "Could not load student progress."
--
-- Fix: fold admin_student_progress's enrollment/credential/reporting
-- projection into admin_student_program_progress so the one roster query the
-- portal issues carries both the M360 multi-track fields and the reporting
-- fields. admin_student_progress itself is untouched and keeps serving any
-- other caller unchanged.

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
  ) as program_requirements_complete,

  -- Reporting/enrollment projection: same source tables and semantics as
  -- admin_student_progress (20260901090000_completion_reporting_snapshot.sql).
  s.enrollment_date,
  s.withdrawal_date,
  coalesce(ep.scheduled_start_date, s.scheduled_start_date) as scheduled_start_date,
  coalesce(
    s.completion_date,
    case when coalesce(cp.percent_complete, 0) >= 100 then (
      select max(cmp.completed_at)
      from public.module_progress cmp
      where cmp.user_id = s.user_id
        and cmp.track_code = s.track_code
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
  pv.version_code as program_version_code,
  pv.credential_code,
  pv.credential_name,
  geo.classification as geography_classification,
  hr.credited_technical_minutes,
  hr.credited_career_minutes,
  hr.credited_program_minutes
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.m360_course_progress mp
  on mp.user_id = s.user_id
left join public.m360_course_records mr
  on mr.user_id = s.user_id
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
left join public.student_hour_reconciliation hr
  on hr.user_id = s.user_id and hr.track_code = s.track_code
where public.is_admin();

comment on view public.admin_student_program_progress is
  'Admin-only multi-track program-progress read model. Technical work remains 12 units; M360-eligible tracks add six accepted-week units. m360_record_exists distinguishes no M360 course record from a record with zero accepted weeks. Readiness is limited to the three approved Start Here projections, never the raw payload. Also carries the enrollment/credential/reporting projection (status, dates, program version, credential, geography classification, credited minutes) from admin_student_progress so the admin roster query needs only this one view.';

revoke all on public.admin_student_program_progress from anon;
grant select on public.admin_student_program_progress to authenticated;

-- MNT Academy — fix: "in progress" students are invisible to the admin
-- dashboard and the H.1 drill-down dropdown.
--
-- Found via live UAT (2026-08-28, real browser session against the deployed
-- site + live Supabase project): a real student was walked through opening
-- Module 1, which correctly wrote a module_progress row with
-- state = 'in_progress'. The admin dashboard still read
-- Total 81 / Not Started 81 / In Progress 0 / Complete 0 afterward.
--
-- Root cause: course_progress (supabase/migrations/20260828160000_simplify_
-- schema.sql) computes modules_complete as
-- `count(*) filter (where mp.state = 'complete')` — it never counts
-- 'in_progress' rows at all. Every downstream consumer (admin_student_
-- progress's notStarted/inProgress split in portal/app.js's viewAdmin(),
-- and admin_student_activity's "has real progress" dropdown filter) only
-- has modules_complete/percent_complete to look at, so a student who has
-- started but not yet completed anything is indistinguishable from one who
-- has never logged in. In a 12-module course this is not an edge case —
-- it is the normal state of most active students most of the time.
--
-- Fix is purely additive: a new modules_in_progress column on
-- course_progress, threaded through admin_student_progress and
-- admin_student_activity the same way modules_complete already is.
-- `create or replace view` only allows appending new columns at the END of
-- the select list — inserting one in the middle shifts every column after
-- it and Postgres reads that as an implicit rename, which it refuses
-- (42P16). So modules_in_progress is appended last in every view below,
-- not placed next to modules_complete where it reads more naturally; no
-- existing column changes name, type, or position.

create or replace view public.course_progress
with (security_invoker = true) as
select
  mp.user_id,
  mp.track_code,
  12::int                                                                  as modules_total,
  count(*) filter (where mp.state = 'complete')                            as modules_complete,
  round(100.0 * count(*) filter (where mp.state = 'complete') / 12.0, 1)   as percent_complete,
  max(mp.updated_at)                                                       as last_active,
  count(*) filter (where mp.state = 'in_progress')                         as modules_in_progress
from public.module_progress mp
group by mp.user_id, mp.track_code;

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
  end                                    as program_slug,
  coalesce(cp.modules_total, 12)         as modules_total,
  coalesce(cp.modules_complete, 0)       as modules_complete,
  coalesce(cp.percent_complete, 0)       as percent_complete,
  cs.overall_score                       as capstone_overall_score,
  cp.last_active                         as last_active,
  coalesce(cp.modules_in_progress, 0)    as modules_in_progress
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
where public.is_admin();

create or replace view public.admin_student_activity
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
  end                                          as program_slug,
  coalesce(cp.modules_total, 12)               as modules_total,
  coalesce(cp.modules_complete, 0)             as modules_complete,
  coalesce(cp.percent_complete, 0)             as percent_complete,
  cs.overall_score                             as capstone_overall_score,
  coalesce(la.lab_attempts_count, 0)           as lab_attempts_count,
  coalesce(cst.capstone_submissions_count, 0)  as capstone_submissions_count,
  cp.last_active                               as last_active,
  coalesce(cp.modules_in_progress, 0)          as modules_in_progress
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
left join (
  select user_id, count(*) as lab_attempts_count
  from public.lab_attempts
  group by user_id
) la on la.user_id = s.user_id
left join (
  select user_id, count(*) as capstone_submissions_count
  from public.capstone_submissions
  group by user_id
) cst on cst.user_id = s.user_id
where public.is_admin();

comment on view public.course_progress is
  'Live rollup over module_progress. modules_complete and modules_in_progress
   are separate counts (state = ''complete'' vs ''in_progress'') — a student
   can be in_progress on several modules and complete on none, which is the
   normal state for most active students in a 12-module course.';

grant select on public.admin_student_progress to authenticated;
grant select on public.admin_student_activity to authenticated;

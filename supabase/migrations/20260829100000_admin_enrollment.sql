-- Mission Next Academy — admin-managed enrollment state.
-- Enrollment is separate from track identity: an account may retain its
-- fictional track and progress history while an admin marks access inactive.

alter table public.students
  add column if not exists is_enrolled boolean not null default false;

-- Preserve active-looking accounts during the one-time migration. New,
-- untouched accounts remain disenrolled until an admin enables them.
update public.students s
set is_enrolled = true
where exists (
  select 1 from public.module_progress mp
  where mp.user_id = s.user_id
    and mp.state in ('in_progress', 'complete')
)
or exists (
  select 1 from public.lab_attempts la
  where la.user_id = s.user_id
)
or exists (
  select 1 from public.capstone_submissions cs
  where cs.user_id = s.user_id
);

create policy students_admin_update on public.students
  for update using (public.is_admin())
  with check (public.is_admin());

grant update (is_enrolled) on public.students to authenticated;

-- Append the new field so this remains compatible with the existing view
-- definitions and keeps all current dashboard columns stable.
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
  coalesce(cp.modules_in_progress, 0)    as modules_in_progress,
  s.is_enrolled                          as is_enrolled
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

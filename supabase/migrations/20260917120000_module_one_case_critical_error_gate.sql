-- D5: a production-impacting Module 1 containment mistake is recorded on
-- the submitted assessment attempt, but is never eligible for verified
-- module completion merely because the other rubric work totals 70+.
-- `critical_errors` is a fixed-fixture result field, populated by the portal.
create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select
  s.user_id,
  r.track_code,
  r.module_key,
  bool_and(exists (
    select 1 from public.lab_attempts la
    where la.user_id = s.user_id
      and la.track_code = r.track_code
      and la.lab_key = r.lab_key
      and la.state = 'complete'
      and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
      and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
  ))
  and (r.module_key <> 'soc-01' or (
    coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
    and coalesce(mp.detail->>'quizPassed', 'false') = 'true'
    and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
  )) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

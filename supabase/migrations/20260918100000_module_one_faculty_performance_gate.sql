-- Module 01's independent case is a simulator-performance assessment. A
-- passing client-side score is useful evidence, but never academic completion
-- until faculty has approved the submitted attempt.
create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select s.user_id, r.track_code, r.module_key,
  bool_and(exists (
    select 1 from public.lab_attempts la
    where la.user_id = s.user_id and la.track_code = r.track_code and la.lab_key = r.lab_key
      and la.state = 'complete'
      and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
      and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
      and (r.module_key <> 'soc-01' or (la.reviewed_at is not null and la.reviewed_by is not null and la.redo_requested = false))
      -- Opening the simulator or writing a note cannot satisfy the independent case.
      and (r.lab_key <> 'lab-soc-escalation' or coalesce(jsonb_array_length(la.result->'simulator_performance'->'actions'), 0) > 0)
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

-- Approval/return changes verified completion, so it must reconcile the
-- derived record just as a score change does.
drop trigger if exists lab_attempts_reconcile_verified_module_progress on public.lab_attempts;
create trigger lab_attempts_reconcile_verified_module_progress
after insert or update of state, score, pass_threshold, redo_requested, reviewed_at, reviewed_by on public.lab_attempts
for each row execute function public.reconcile_verified_module_progress();

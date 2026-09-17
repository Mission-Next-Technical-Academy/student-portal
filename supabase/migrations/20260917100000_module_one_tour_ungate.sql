-- Decision 4 (soc-analyst-track-reimagining/REBUILD_PLAN.md) and its
-- execution design (MODULE1_DAY1_REBUILD_PLAN.md §2, sprint D2): Module 1's
-- console walkthrough ("Lab 1" / lab-soc-environment) is reframed as an
-- ungated, on-demand orientation walkthrough, not a graded/required step.
--
-- The live gate is server-side. Remove the walkthrough from the canonical
-- course_module_labs assessment map AND replace the SOC-01-specific detail
-- rule below: that older view also required consoleCompleted, so removing
-- only the map row would still leave the walkthrough as a hidden gate.
--
-- lab-soc-escalation (Lab 2, the escalation decision form) is untouched
-- and remains a required, gating lab attempt — it stays the graded
-- assessment until D5 replaces it entirely with the real multi-day case.
delete from public.course_module_labs
where track_code = 'SOCAN' and module_key = 'soc-01' and lab_key = 'lab-soc-environment';

-- Keep the existing foundation lessons, knowledge check, and Lab 2 handoff
-- requirements intact until D5 replaces the assessment. Only the optional
-- console walkthrough is removed from verified completion.
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

-- Removing a requirement can only make more students newly complete, never
-- fewer — safe to re-run the sync for every SOCAN student so anyone who was
-- blocked solely on the now-removed lab-soc-environment attempt is promoted
-- immediately rather than waiting for their next lab_attempts/module_progress
-- write to trigger reconcile_verified_module_progress().
do $$
declare v_student record;
begin
  for v_student in select user_id from public.students where track_code = 'SOCAN' loop
    perform public.sync_verified_module_progress(v_student.user_id, 'SOCAN', 'soc-01');
  end loop;
end $$;

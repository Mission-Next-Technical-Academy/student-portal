-- Align Module 1 verification with the current case console Prove It payload.
-- The console submits case_record and the removed quiz cannot set quizPassed;
-- see docs/handoffs/BUG_2026-10-17_M01_CANNOT_COMPLETE.md.
--
-- ROLLBACK: recreate public.student_verified_module_progress from
-- 20261005120000_instructor_approval_gate_and_write_lockdown.sql.

create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select s.user_id, r.track_code, r.module_key,
  coalesce(mp.admin_override, false)
  or (
    bool_and(exists (
      select 1 from public.lab_attempts la
      where la.user_id = s.user_id and la.track_code = r.track_code and la.lab_key = r.lab_key
        and la.state = 'complete'
        and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
        and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
        -- Instructor approval is the gate for every module (owner rule,
        -- 2026-10-05). Previously this applied to soc-01 only.
        and la.reviewed_at is not null
        and la.reviewed_by is not null
        and la.reviewed_by <> la.user_id
        and la.redo_requested = false
        and (r.lab_key <> 'lab-soc-escalation' or la.result ? 'case_record')
    ))
    and (r.module_key <> 'soc-01' or (
      coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
      and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
    ))
  ) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

-- Below-pass Prove It submissions go to the instructor for review so student
-- work and teacher notes are not silently lost. See
-- docs/handoffs/BUG_2026-10-17_PROVE_IT_BELOW_PASS_SILENTLY_DROPPED.md.
--
-- ROLLBACK: recreate faculty_grading_queue and admin_grading_queue below
-- using state = 'complete'. The enum value remains; unused values are harmless.

alter type public.progress_state add value if not exists 'submitted';

-- The guard and retroactive superseding sweep from
-- 20261005210000_one_pending_prove_it_submission.sql already define pending
-- submissions as unreviewed rows with completed_at and no superseded_at,
-- without filtering state. Thus submitted rows are already serialized,
-- refused while pending, and superseded consistently; no trigger change is
-- needed here.

create or replace view public.admin_grading_queue
with (security_invoker = true) as
select la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
  la.pass_threshold, la.result, la.started_at, la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state::text in ('complete', 'submitted')
  and la.reviewed_at is null
  and la.superseded_at is null
  and public.is_admin();

create or replace view public.faculty_grading_queue
with (security_invoker = true) as
select la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
  la.pass_threshold, la.result, la.started_at, la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state::text in ('complete', 'submitted')
  and la.reviewed_at is null
  and la.superseded_at is null
  and public.can_manage_course_messages(la.track_code);

-- Fix: once an instructor sends a lab attempt back for redo
-- (`reviewed_at` set, `redo_requested = true`), the row falls out of
-- `admin_grading_queue`/`faculty_grading_queue` for good (both filter
-- `reviewed_at is null`) — there was no way to find it again from the
-- Grading tab. That is correct for the normal path (a genuine resubmission
-- inserts a brand-new row, which is what the student-facing banner logic in
-- portal/app.js's fetchUserDetails() actually keys off: the single latest
-- lab_attempts row per lab_key/user, filtered to redo_requested = true).
-- But it left no way for an instructor to reverse a redo they sent back in
-- error, or approve one without a real resubmission (e.g. a controlled
-- faculty test of the redo mechanism itself) — the exact gap hit 2026-09-21
-- testing Module 1's assessment lab.
--
-- These views mirror the client's own "latest attempt per user+lab_key"
-- rule (see fetchUserDetails()'s openLabRedosByModuleKey) so the admin/
-- faculty Grading tab can list exactly the set of currently-open redo
-- banners a student would see, and offer an "Approve without resubmission"
-- action that flips that same row's redo_requested back to false — the
-- same update submitGradingDecision() already performs for a normal
-- approve, so no new write path is needed, only new read surfaces.
create or replace view public.admin_open_lab_redos
with (security_invoker = true) as
select v.id, v.user_id, v.student_id, v.track_code, v.lab_key, v.score,
       v.pass_threshold, v.result, v.started_at, v.completed_at,
       v.reviewed_at, v.reviewed_by
from (
  select distinct on (la.user_id, la.lab_key)
    la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
    la.pass_threshold, la.result, la.started_at, la.completed_at,
    la.reviewed_at, la.reviewed_by, la.redo_requested
  from public.lab_attempts la
  join public.students s on s.user_id = la.user_id
  where la.completed_at is not null
  order by la.user_id, la.lab_key, la.completed_at desc
) v
where v.redo_requested = true
  and public.is_admin();

comment on view public.admin_open_lab_redos is
  'Admin-only: the single latest lab_attempts row per user/lab_key wherever it is currently redo_requested — i.e. exactly the set of students who would see a live "Redo Requested" module banner. Lets an instructor find and reverse a redo after the row has already fallen out of admin_grading_queue.';

revoke all on public.admin_open_lab_redos from anon;
grant select on public.admin_open_lab_redos to authenticated;

create or replace view public.faculty_open_lab_redos
with (security_invoker = true) as
select v.id, v.user_id, v.student_id, v.track_code, v.lab_key, v.score,
       v.pass_threshold, v.result, v.started_at, v.completed_at,
       v.reviewed_at, v.reviewed_by
from (
  select distinct on (la.user_id, la.lab_key)
    la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
    la.pass_threshold, la.result, la.started_at, la.completed_at,
    la.reviewed_at, la.reviewed_by, la.redo_requested
  from public.lab_attempts la
  join public.students s on s.user_id = la.user_id
  where la.completed_at is not null
  order by la.user_id, la.lab_key, la.completed_at desc
) v
where v.redo_requested = true
  and public.can_manage_course_messages(v.track_code);

comment on view public.faculty_open_lab_redos is
  'Course-scoped analogue of admin_open_lab_redos for dedicated instructors.';

revoke all on public.faculty_open_lab_redos from anon;
grant select on public.faculty_open_lab_redos to authenticated;

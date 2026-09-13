-- Lab Grading & Notification System — Sprint 1 (admin panel core).
-- See lab-grading-notification-system/ at the repo root for the brief,
-- scan, and sprint log. Schema for: an instructor grading queue (pregraded
-- lab attempts awaiting human review), per-item instructor feedback, and
-- the redo signal sent back to the student. Nothing in portal/app.js reads
-- lab_attempts.pass_threshold or grades a submission yet — this is the
-- data model that makes that possible.

alter table public.lab_attempts
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists redo_requested boolean not null default false;

comment on column public.lab_attempts.reviewed_at is
  'Set once an instructor has reviewed this attempt (approved or sent back). Null = sitting in the grading queue.';
comment on column public.lab_attempts.redo_requested is
  'True when the instructor sent this attempt back for a redo. Student-facing consumption of this flag is a later sprint — see lab-grading-notification-system/STATE.md.';

-- Existing self-owned policy (lab_attempts_own, 20260828160000_simplify_schema.sql)
-- only lets a student write their own rows. An instructor/admin needs to be
-- able to mark someone else's attempt reviewed — same "own policy plus an
-- admin policy, OR'd together" shape used elsewhere in this schema.
create policy lab_attempts_admin_review on public.lab_attempts
  for update
  using      (public.is_admin())
  with check (public.is_admin());

-- One row per flagged item ("input fields per wrong thing" in the brief).
-- Append-only by design, same posture as this project's other compliance/
-- audit records (module_progress, capstone_submissions) — an instructor
-- correction is a new row, not an edit to what was already sent.
create table public.lab_attempt_feedback (
  id             uuid primary key default gen_random_uuid(),
  lab_attempt_id uuid not null references public.lab_attempts(id) on delete cascade,
  item_label     text not null,
  comment        text not null,
  created_at     timestamptz not null default now(),
  created_by     uuid not null references auth.users(id)
);

create index lab_attempt_feedback_attempt_idx on public.lab_attempt_feedback (lab_attempt_id);

alter table public.lab_attempt_feedback enable row level security;

create policy lab_attempt_feedback_admin_write on public.lab_attempt_feedback
  for all
  using      (public.is_admin())
  with check (public.is_admin());

create policy lab_attempt_feedback_student_read on public.lab_attempt_feedback
  for select
  using (
    exists (
      select 1 from public.lab_attempts la
      where la.id = lab_attempt_feedback.lab_attempt_id
        and la.user_id = auth.uid()
    )
  );

revoke all on public.lab_attempt_feedback from anon;
grant select, insert on public.lab_attempt_feedback to authenticated;

-- The grading queue itself: every pregraded lab attempt an instructor has
-- not yet reviewed. This is both the Grading tab's row source and the
-- per-track-card notification count ("N Labs need grading") — deliberately
-- eager/small, not a lazy admin tab, since the badge must be visible on the
-- course card before any tab is opened.
create or replace view public.admin_grading_queue
with (security_invoker = true) as
select
  la.id,
  la.user_id,
  s.student_id,
  la.track_code,
  la.lab_key,
  la.score,
  la.pass_threshold,
  la.result,
  la.started_at,
  la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state = 'complete'
  and la.reviewed_at is null
  and public.is_admin();

comment on view public.admin_grading_queue is
  'Admin-only: pregraded lab attempts awaiting instructor review (reviewed_at is null). Drives both the Grading tab and the per-course-card pending-grading badge.';

revoke all on public.admin_grading_queue from anon;
grant select on public.admin_grading_queue to authenticated;

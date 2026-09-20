-- Universal first-login LMS orientation (all programs — see ROADMAP.md
-- Ordered delivery queue #1, and the Academy-level orientation sprint brief).
--
-- Completion belongs to the student's ACADEMY onboarding state, not to any
-- one program's Module 1: public.students already holds exactly one row per
-- student (independent of track_code), so it is the natural home for this
-- flag, the same reasoning module_progress.detail's comment gives for the
-- Module 1 beacon column. A student only ever sees the full welcome-through-
-- Learn/Practice/Prove walkthrough once, no matter which program they are
-- enrolled in or later add.
--
-- Self-service write goes through a SECURITY DEFINER RPC (mirrors
-- public.is_admin()'s pattern) rather than a broad UPDATE grant + RLS policy
-- on students: the RPC only ever touches the caller's own row via auth.uid(),
-- so there is no policy surface to get wrong.

alter table public.students
  add column if not exists academy_orientation_completed_at timestamptz;

comment on column public.students.academy_orientation_completed_at is
  'Set once the student finishes (or explicitly skips) the universal '
  'Academy first-login orientation tour. Null means not yet shown/completed. '
  'Written only via public.mark_academy_orientation_complete().';

create or replace function public.mark_academy_orientation_complete()
returns void
language sql
security definer
set search_path = public
as $$
  update public.students
  set academy_orientation_completed_at = now()
  where user_id = auth.uid()
    and academy_orientation_completed_at is null;
$$;

comment on function public.mark_academy_orientation_complete() is
  'Self-service: marks the caller''s own students row as having completed '
  'the universal Academy orientation tour. Idempotent (no-op once already set).';

grant execute on function public.mark_academy_orientation_complete() to authenticated;

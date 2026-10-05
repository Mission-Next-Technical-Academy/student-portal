-- One Prove It submission per lab at a time (owner rule, 2026-10-05).
--
-- lab_attempts is append-only and the only resubmit lock lived in browser
-- storage, so a second device, cleared storage or a repeated submit handler
-- queued several unreviewed attempts of the same lab. Live data: four
-- lab-detection-rule rows for one learner inside 7 ms (two of them sharing a
-- completed_at to the millisecond, which the grading UI then merged into one
-- card), and duplicate pending Prove It rows on 15 other learner/lab pairs.
--
-- What changes:
--   1. lab_attempts.superseded_at marks an unreviewed attempt that a newer
--      attempt of the same lab replaced. It is history, not a review: it never
--      counts toward verified progress (that still requires reviewed_at).
--   2. Retroactive sweep: every unreviewed Prove It attempt (a
--      course_module_labs lab) with a newer attempt of the same lab is marked
--      superseded. Rows are kept, never deleted.
--   3. A student may insert a Prove It attempt only when the lab has no
--      attempt yet, or its latest attempt was sent back for redo. While one is
--      awaiting review, or once one is approved, the insert is refused.
--      Learn It / Practice It keys are not in course_module_labs and stay
--      unlimited.
--   4. The grading queues skip superseded rows, so faculty see one decision
--      per learner per lab.

-- ------------------------------------------------------------ 1. column
alter table public.lab_attempts add column if not exists superseded_at timestamptz;

comment on column public.lab_attempts.superseded_at is
  'Set when a newer attempt of the same lab replaced this unreviewed attempt. Not a review; excluded from the grading queues and never counted as verified.';

-- ------------------------------------------------------------ 2. sweep
update public.lab_attempts la
set superseded_at = now()
where la.reviewed_at is null
  and la.superseded_at is null
  and la.completed_at is not null
  and exists (
    select 1 from public.course_module_labs r
    where r.track_code = la.track_code and r.lab_key = la.lab_key
  )
  and exists (
    select 1 from public.lab_attempts newer
    where newer.user_id = la.user_id
      and newer.lab_key = la.lab_key
      and newer.completed_at is not null
      and (newer.completed_at, newer.id) > (la.completed_at, la.id)
  );

-- ------------------------------------------------------------ 3. insert gate
create or replace function public.guard_lab_attempt_single_pending()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  prev record;
begin
  -- Service-role maintenance scripts and pg_cron are not API end users.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  -- Only the academy marks an attempt superseded.
  new.superseded_at := null;

  if not exists (
    select 1 from public.course_module_labs r
    where r.track_code = new.track_code and r.lab_key = new.lab_key
  ) then
    return new;
  end if;

  -- Serialise concurrent submits of the same lab (a double-fired handler
  -- inserts within the same millisecond); the second waits, then sees the
  -- first as pending and is refused.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || '|' || new.lab_key, 0));

  select la.reviewed_at, la.redo_requested
  into prev
  from public.lab_attempts la
  where la.user_id = new.user_id
    and la.lab_key = new.lab_key
    and la.completed_at is not null
    and la.superseded_at is null
  order by la.completed_at desc, la.id desc
  limit 1;

  if found then
    if prev.reviewed_at is null then
      raise exception 'This lab already has a submission awaiting instructor review.'
        using errcode = 'P0001', hint = 'one_pending_submission';
    elsif prev.redo_requested = false then
      raise exception 'This lab has already been approved.'
        using errcode = 'P0001', hint = 'already_approved';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists lab_attempts_single_pending on public.lab_attempts;
create trigger lab_attempts_single_pending
  before insert on public.lab_attempts
  for each row execute function public.guard_lab_attempt_single_pending();

revoke all on function public.guard_lab_attempt_single_pending() from public, anon, authenticated;

-- ------------------------------------------------------------ 4. queues
create or replace view public.admin_grading_queue
with (security_invoker = true) as
select la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
  la.pass_threshold, la.result, la.started_at, la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state = 'complete'
  and la.reviewed_at is null
  and la.superseded_at is null
  and public.is_admin();

create or replace view public.faculty_grading_queue
with (security_invoker = true) as
select la.id, la.user_id, s.student_id, la.track_code, la.lab_key, la.score,
  la.pass_threshold, la.result, la.started_at, la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state = 'complete'
  and la.reviewed_at is null
  and la.superseded_at is null
  and public.can_manage_course_messages(la.track_code);

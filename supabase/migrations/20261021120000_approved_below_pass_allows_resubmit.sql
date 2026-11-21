-- UAT B21 (P1): an instructor approval of a BELOW-PASS Prove It no longer
-- locks the lab against resubmission.
--
-- guard_lab_attempt_single_pending() refused any new submit with
-- 'already_approved' whenever the latest attempt had reviewed_at set and
-- redo_requested = false, regardless of score. An approved 37% attempt does
-- not complete the module (student_verified_module_progress needs a passing
-- score), so the learner was stuck: no completion and no resubmit.
--
-- Change: only the "approved" branch. An approved attempt blocks a new submit
-- only if it PASSED, using the exact rule of student_verified_module_progress
-- (20261017130000_module_one_completion_case_console.sql):
--   state = 'complete'
--   and (score is null or score >= coalesce(pass_threshold, 70))
--   and coalesce(jsonb_array_length(result->'critical_errors'), 0) = 0
-- The pending-review branch and everything else are unchanged.
--
-- ROLLBACK: re-run the function body from
-- 20261005210000_one_pending_prove_it_submission.sql section 3 (the approved
-- branch there is `elsif prev.redo_requested = false then raise ...`). The
-- trigger itself is not recreated here, so no trigger change is needed.

create or replace function public.guard_lab_attempt_single_pending()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  prev record;
  prev_passed boolean;
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

  select la.reviewed_at, la.redo_requested,
    (la.state::text = 'complete'
      and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
      and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0) as passed
  into prev
  from public.lab_attempts la
  where la.user_id = new.user_id
    and la.lab_key = new.lab_key
    and la.completed_at is not null
    and la.superseded_at is null
  order by la.completed_at desc, la.id desc
  limit 1;

  if found then
    prev_passed := coalesce(prev.passed, false);
    if prev.reviewed_at is null then
      raise exception 'This lab already has a submission awaiting instructor review.'
        using errcode = 'P0001', hint = 'one_pending_submission';
    elsif prev.redo_requested = false and prev_passed then
      raise exception 'This lab has already been approved.'
        using errcode = 'P0001', hint = 'already_approved';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_lab_attempt_single_pending() from public, anon, authenticated;

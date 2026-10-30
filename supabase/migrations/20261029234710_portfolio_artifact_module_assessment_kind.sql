-- The platform's generic Assessment Lab box (portal/app.js,
-- moduleAssessmentModule) saves its rationale as a portfolio artifact of kind
-- 'module_assessment', but the kind check created inline in
-- 20260828160000_simplify_schema.sql never allowed it, so every one of those
-- inserts was refused. Allow it, keeping every existing kind.
--
-- The original check was declared inline, so Postgres named it; drop any check
-- constraint on portfolio_artifacts that tests `kind` (whatever its name) and
-- add one with a fixed name.

do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.portfolio_artifacts'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ~ '\mkind\M'
  loop
    execute format('alter table public.portfolio_artifacts drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.portfolio_artifacts
  add constraint portfolio_artifacts_kind_check check (kind in (
    'incident_report', 'vuln_assessment', 'hunt_report',
    'exec_summary', 'incident_timeline', 'capstone_report',
    'module_assessment'));

-- One waiting Assessment Lab box submission at a time. The box's lab keys
-- ('<module key>-assessment-module') are not in course_module_labs, so the
-- one-pending rule (20261005210000_one_pending_prove_it_submission.sql) never
-- covered them and two tabs could both queue an attempt. Same function as
-- that migration, with those keys added to the labs it guards; refusal and
-- unlock rules are unchanged (waiting or approved refuses, a return allows
-- one new attempt). Graded labs are unaffected.
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
  ) and new.lab_key not like '%-assessment-module' then
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

revoke all on function public.guard_lab_attempt_single_pending() from public, anon, authenticated;

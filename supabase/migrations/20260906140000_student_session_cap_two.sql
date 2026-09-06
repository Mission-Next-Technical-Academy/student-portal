-- Site-owner call (2026-09-06, after initial launch of SESSION_SECURITY_SPEC.md
-- Decision 1): raise the per-student concurrent-session cap from 1 to 2, so a
-- student switching between two of their own devices (e.g. phone + laptop)
-- doesn't get locked out the way a flat cap of 1 would force. The admin cap
-- (4) and every other rule in Decision 1/4 (refuse-outright on cap hit,
-- habitual-IP arbitration via check-login-ueba, anti-gaming on
-- user_ip_history) are unchanged -- this migration only replaces the `else 1`
-- branch of enforce_site_session_concurrency() with `else 2`.
create or replace function public.enforce_site_session_concurrency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open_count integer;
  v_max_sessions integer;
begin
  -- Admins get headroom for a few real devices; students get two concurrent
  -- sessions (e.g. phone + laptop) -- see this migration's header comment
  -- for why the original cap of 1 was raised.
  v_max_sessions := case when new.track_code = 'ADMIN' then 4 else 2 end;

  select count(*) into v_open_count
  from public.site_sessions
  where user_id = new.user_id and ended_at is null;

  if v_open_count >= v_max_sessions then
    -- MNT_SESSION_LIMIT_REACHED: is a literal-string prefix the client
    -- (portal/app.js's recordSiteSessionStart(), per SESSION_SECURITY_
    -- SPEC.md Decision 3) matches on to tell "you hit the cap" apart from
    -- any other insert failure. Do not reword this prefix without updating
    -- that client-side check.
    raise exception 'MNT_SESSION_LIMIT_REACHED: user % already has % open session(s), max %',
      new.user_id, v_open_count, v_max_sessions;
  end if;

  return new;
end;
$$;

comment on function public.enforce_site_session_concurrency() is
  'BEFORE INSERT trigger function on public.site_sessions: refuses a new open session once the inserting user_id already has v_max_sessions open (ended_at is null) rows, where v_max_sessions is 4 for track_code = ''ADMIN'' and 2 for every other track_code (including null) as of 2026-09-06 (was 1 at initial launch). Raises with the MNT_SESSION_LIMIT_REACHED: prefix that portal/app.js string-matches on -- see SESSION_SECURITY_SPEC.md Decision 1/3.';

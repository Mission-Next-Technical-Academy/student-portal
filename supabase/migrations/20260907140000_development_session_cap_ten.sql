-- Temporary development headroom, 2026-09-07.
--
-- Several course accounts are being used concurrently while the portal is
-- built and tested. Keep the existing session audit trail and all other
-- session controls, but allow up to ten open sessions for either account
-- type. A later migration can restore a tighter production cap.
create or replace function public.enforce_site_session_concurrency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open_count integer;
  v_max_sessions integer := 10;
begin
  select count(*) into v_open_count
  from public.site_sessions
  where user_id = new.user_id and ended_at is null;

  if v_open_count >= v_max_sessions then
    raise exception 'MNT_SESSION_LIMIT_REACHED: user % already has % open session(s), max %',
      new.user_id, v_open_count, v_max_sessions;
  end if;

  return new;
end;
$$;

comment on function public.enforce_site_session_concurrency() is
  'BEFORE INSERT trigger function on public.site_sessions: temporary development cap of 10 concurrent open sessions for every account type as of 2026-09-07. The MNT_SESSION_LIMIT_REACHED: prefix remains the portal client contract.';

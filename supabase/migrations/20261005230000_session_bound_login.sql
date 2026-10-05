-- Bind every authenticated write to a session created by secure-login.
-- Password-grant tokens issued directly by Supabase Auth remain valid JWTs,
-- but cannot create their own trusted site_sessions row or write academy data.

alter table public.site_sessions
  add column if not exists auth_session_id uuid;

-- Existing rows predate JWT binding. Close their tracker entries so they do
-- not consume the concurrent-session cap after this migration. Their old
-- Auth tokens have no trusted row and portal restoration will require a new
-- login through secure-login.
update public.site_sessions
set ended_at = coalesce(ended_at, now()),
    ended_reason = coalesce(ended_reason, 'superseded')
where auth_session_id is null and ended_at is null;

create unique index if not exists site_sessions_auth_session_id_uidx
  on public.site_sessions (auth_session_id)
  where auth_session_id is not null;

-- The temporary staging cap of ten is over. Keep four for administrators and
-- restore the accepted student cap of two before launch. Serialize each
-- account's count-and-insert so simultaneous login requests cannot exceed it.
create or replace function public.enforce_site_session_concurrency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open_count integer;
  v_max_sessions integer := case when new.track_code = 'ADMIN' then 4 else 2 end;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || '|session-cap', 0));

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
  'Enforces four concurrent sessions for administrators and two for all other accounts, serialized by user so simultaneous inserts cannot exceed the cap.';

create or replace function public.has_valid_site_session()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  begin
    v_session_id := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  if auth.uid() is null or v_session_id is null then
    return false;
  end if;

  return exists (
    select 1 from public.site_sessions ss
    where ss.user_id = auth.uid()
      and ss.auth_session_id = v_session_id
      and ss.ended_at is null
  );
end;
$$;

revoke all on function public.has_valid_site_session() from public, anon;
grant execute on function public.has_valid_site_session() to authenticated;

create or replace function public.require_registered_site_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated'
     and not public.has_valid_site_session() then
    raise exception 'An active academy session is required for writes.'
      using errcode = '42501', hint = 'registered_site_session_required';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.require_registered_site_session() from public, anon, authenticated;

-- Cover every public base table on which authenticated currently has direct
-- INSERT/UPDATE/DELETE privilege. This also covers writes behind security-
-- definer RPCs because the request JWT role remains authenticated in triggers.
do $$
declare
  t record;
begin
  for t in
    select n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and (
        has_table_privilege('authenticated', c.oid, 'INSERT')
        or has_table_privilege('authenticated', c.oid, 'UPDATE')
        or has_table_privilege('authenticated', c.oid, 'DELETE')
      )
  loop
    execute format('drop trigger if exists require_registered_site_session on %I.%I', t.nspname, t.relname);
    execute format(
      'create trigger require_registered_site_session before insert or update or delete on %I.%I for each row execute function public.require_registered_site_session()',
      t.nspname, t.relname
    );
  end loop;
end;
$$;

-- Only secure-login (service role) may create a trusted row. A browser may
-- heartbeat or close only the row bound to its own JWT session_id.
drop policy if exists site_sessions_self_insert on public.site_sessions;
drop policy if exists site_sessions_self_close on public.site_sessions;
drop policy if exists site_sessions_self_update on public.site_sessions;
create policy site_sessions_self_update on public.site_sessions
  for update to authenticated
  using (
    user_id = auth.uid()
    and auth_session_id::text = auth.jwt() ->> 'session_id'
    and ended_at is null
    and public.has_valid_site_session()
  )
  with check (
    user_id = auth.uid()
    and auth_session_id::text = auth.jwt() ->> 'session_id'
    and public.has_valid_site_session()
    and (ended_at is null or ended_reason in ('user_signed_out', 'idle_timeout'))
  );
revoke insert, update on public.site_sessions from authenticated;
grant update (last_seen_at, ended_at, ended_reason) on public.site_sessions to authenticated;

-- Idle closure and revocation are per Auth session. One idle device no longer
-- invalidates a different active device belonging to the same account.
create or replace function public.close_idle_site_sessions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_session_id uuid;
begin
  if not (public.is_admin() or session_user = 'postgres') then
    raise exception 'close_idle_site_sessions: caller is not an admin';
  end if;

  for v_auth_session_id in
    update public.site_sessions
    set ended_at = now(), ended_reason = 'idle_timeout'
    where ended_at is null
      and coalesce(last_seen_at, started_at) < now() - interval '60 minutes'
      and auth_session_id is not null
    returning auth_session_id
  loop
    delete from auth.sessions where id = v_auth_session_id;
  end loop;
end;
$$;

comment on function public.close_idle_site_sessions() is
  'Closes idle site_sessions rows and revokes only each matching auth.sessions.id; it never revokes other sessions for the same account.';

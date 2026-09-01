-- Mission Next Technical Academy — server-side enforcement for the idle
-- sign-out timer.
--
-- 20260901140000_site_sessions_idle_timeout.sql only widened the CHECK
-- constraint/RLS so a *client-side* idle timer (portal/app.js's
-- wireIdleSignOut(), MNT_IDLE_TIMEOUT_MS = 60 minutes) could legally record
-- ended_reason = 'idle_timeout' when it decides to sign a student out. That
-- timer is a JS setTimeout running inside one specific browser tab — it
-- only ever fires if that tab is still open, not backgrounded/throttled/
-- discarded by the browser, and running the code that shipped after the
-- tab's last full load. If none of that holds (tab closed, laptop asleep,
-- browser reclaimed a background tab's memory, or the tab was already open
-- before this feature shipped), nothing closes the session — it just sits
-- open in site_sessions and the real auth.sessions row stays live
-- indefinitely. This migration adds the actual backstop: a heartbeat column
-- the client bumps on real user activity, and a pg_cron sweep — the same
-- pattern archive_expired_cohorts() already uses in this repo
-- (20260901121000_cohort_archival_engine.sql) — that force-closes (and
-- really revokes, via auth.sessions) any session whose last real activity
-- is more than 60 minutes old, independent of whether any browser tab is
-- currently alive to notice.

-- ------------------------------------------------------- last_seen_at

alter table public.site_sessions
  add column last_seen_at timestamptz not null default now();

comment on column public.site_sessions.last_seen_at is
  'Bumped by portal/app.js on real user activity (mouse/keyboard/scroll/touch), throttled client-side to roughly once per 5 minutes — not on every event. This, not started_at, is what close_idle_site_sessions() below measures 60-minute idleness against. Defaults to started_at''s own now() so a freshly opened session is never immediately treated as idle.';

create index site_sessions_open_last_seen_idx
  on public.site_sessions (last_seen_at) where ended_at is null;

-- ------------------------------------------------------- self-update policy

-- Replaces site_sessions_self_close (20260901122000_activity_monitor_
-- sessions.sql, widened by 20260901140000) with a combined policy covering
-- both write shapes a student's own browser now makes to an open row:
--   - heartbeat: ended_at stays null, only last_seen_at moves forward.
--   - self-close: ended_at is newly set, ended_reason must be one of the
--     two values a student is ever allowed to write themselves.
-- RLS can't restrict this to "only the last_seen_at column changed" on the
-- heartbeat branch — Postgres row security is row-scoped, not column-scoped
-- — so a client could in principle also rewrite student_id/track_code on a
-- heartbeat update. That's an existing, accepted limitation already true of
-- the original self_close policy (which had the same gap on its own write
-- shape); not a new risk introduced here.
drop policy if exists site_sessions_self_close on public.site_sessions;

create policy site_sessions_self_update on public.site_sessions
  for update
  using (user_id = auth.uid() and ended_at is null)
  with check (
    user_id = auth.uid()
    and (
      ended_at is null
      or ended_reason in ('user_signed_out', 'idle_timeout')
    )
  );

comment on policy site_sessions_self_update on public.site_sessions is
  'A student may update only their own still-open row, either as a heartbeat (ended_at left null) or a self-close (ended_at newly set, ended_reason ''user_signed_out'' or ''idle_timeout'' only — never ''admin_forced'' or ''superseded'').';

-- ------------------------------------------------------- close_idle_site_sessions

-- Guard is `is_admin() OR current_user = 'postgres'`, exactly
-- archive_expired_cohorts()'s idiom and for the identical reason: pg_cron's
-- background worker has no PostgREST JWT in flight, so auth.uid() (and
-- therefore a bare is_admin()) would always be false there, silently
-- breaking every scheduled run. current_user = 'postgres' recognizes that
-- one trusted, non-JWT execution path without opening this up to arbitrary
-- callers. Safe to grant execute to authenticated with no separate wrapper
-- — same reasoning as archive_expired_cohorts().
create or replace function public.close_idle_site_sessions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not (public.is_admin() or current_user = 'postgres') then
    raise exception 'close_idle_site_sessions: caller is not an admin';
  end if;

  -- Close every open session whose last real activity is more than 60
  -- minutes old. coalesce(last_seen_at, started_at) covers a row from
  -- before this migration that never received a heartbeat. Keep this
  -- window in sync with portal/app.js's MNT_IDLE_TIMEOUT_MS if that value
  -- ever changes — they are two independent definitions of "60 minutes,"
  -- not one shared constant, since one lives in SQL and one in JS.
  for v_user_id in
    update public.site_sessions
    set ended_at = now(), ended_reason = 'idle_timeout'
    where ended_at is null
      and coalesce(last_seen_at, started_at) < now() - interval '60 minutes'
    returning user_id
  loop
    -- Only revoke the student's real auth session once none of their
    -- site_sessions rows are still open — an idle timeout closing one
    -- stale tab must never sign out a genuinely active session the same
    -- student has open elsewhere (a second tab/device). Same revocation
    -- mechanism and the same documented limitation as
    -- admin_force_sign_out() (20260901122000_activity_monitor_
    -- sessions.sql): deleting auth.sessions blocks re-auth past the next
    -- token refresh/reload, it does not instantly kill an already-issued
    -- access token still live in a browser.
    if not exists (
      select 1 from public.site_sessions
      where user_id = v_user_id and ended_at is null
    ) then
      delete from auth.sessions where user_id = v_user_id;
    end if;
  end loop;
end;
$$;

comment on function public.close_idle_site_sessions() is
  'Server-side backstop for the client idle timer: force-closes (ended_reason = ''idle_timeout'') any site_sessions row idle past 60 minutes by last_seen_at, and revokes the student''s real auth.sessions row once no other tab of theirs is still open. Callable by an admin on demand, and by pg_cron every 5 minutes (schedule below) with no JWT in flight — see the is_admin() OR current_user = ''postgres'' guard.';

grant execute on function public.close_idle_site_sessions() to authenticated;

-- ------------------------------------------------------- pg_cron

-- pg_cron is already enabled by 20260901121000_cohort_archival_engine.sql;
-- `create extension if not exists` here is just defense against this
-- migration ever being applied to a project where that one wasn't.
create extension if not exists pg_cron;

-- Same idempotent unschedule-then-schedule idiom as archive_expired_
-- cohorts() below, for the same reason: pg_cron's behavior on re-scheduling
-- an existing job name has varied across versions.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'close-idle-site-sessions') then
    perform cron.unschedule('close-idle-site-sessions');
  end if;
end;
$$;

-- Every 5 minutes, not daily like the cohort sweep — idle sign-out is a
-- security/session-hygiene control, not a once-a-day housekeeping job, so a
-- stale session should be caught within a few minutes of crossing 60
-- minutes idle, not up to a day late.
select cron.schedule(
  'close-idle-site-sessions',
  '*/5 * * * *',
  $$select public.close_idle_site_sessions();$$
);

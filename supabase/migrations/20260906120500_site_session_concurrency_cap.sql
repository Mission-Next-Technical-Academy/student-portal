-- Mission Next Technical Academy — concurrent session cap.
--
-- Decision 1 of SESSION_SECURITY_SPEC.md ("Concurrent session cap + login
-- geofencing"). Today nothing counts how many site_sessions rows a user has
-- open at once — site_sessions itself (20260901122000_activity_monitor_
-- sessions.sql) and its idle-timeout backstop (20260901150000_site_
-- sessions_idle_enforcement.sql) only ever *close* a session after the fact
-- (idle, self sign-out, admin force) — neither one caps how many can be
-- open simultaneously. This migration adds that cap, branched by role off
-- site_sessions.track_code (already 'ADMIN' for an admin row, one of
-- SOCAN/HDESK/AIENG/ELECT for a student — 20260901122000_...:34):
--
--   - Admin (track_code = 'ADMIN'): max 4 open sessions. Site owner: there
--     are 4 admin accounts, and they need to be able to check work, code,
--     and commit at the same time without tripping the cap — 4 covers
--     "everyone signed in at once," not a placeholder headroom number.
--   - Student (any other track_code, including null): max 1 open session.
--     Site-owner call: a training-account student has no legitimate reason
--     to be signed in from two places at once, and one-session-only closes
--     off a whole class of credential-sharing/concurrent-cheating risk
--     cheaply. Intentionally stricter than the admin cap, not a placeholder
--     to raise later.
--
-- Why a DB trigger and not a client-side "count then insert" check in
-- portal/app.js: the client already holds INSERT on site_sessions for its
-- own rows via the site_sessions_self_insert policy (20260901122000_...). A
-- client-side count-then-insert is a classic TOCTOU race, and it is
-- trivially bypassable by anyone calling supabase-js directly instead of
-- going through portal/app.js. The cap has to live inside the database, on
-- the same INSERT the client already makes — a BEFORE INSERT trigger, not a
-- new RPC the client would have to remember to call instead of the plain
-- insert.
--
-- Deliberately a lockout, not an eviction: a sign-in past the cap is
-- refused outright rather than silently closing the oldest existing
-- session. An admin investigating a possibly-compromised account needs
-- those older sessions to stay visible and revocable on the Activity
-- Monitor tab (admin_site_sessions, 20260901122000_...), not auto-closed
-- the moment a new sign-in shows up. This also means a student who leaves
-- a tab open elsewhere and tries to sign in from a second device is locked
-- out until the first is closed — that is the intended behavior, not a bug
-- to soften.
--
-- What this does NOT change: a student refreshing the page, or opening a
-- second *tab* of an already-signed-in session, never calls signIn() again
-- — no new site_sessions row is inserted, so this trigger never even fires
-- (matches the existing "one row per real signIn() call" semantics
-- documented at portal/app.js:196-203). The cap counts distinct sign-in
-- events with sessions still open (devices/browsers), not tabs within one.

-- ------------------------------------------ enforce_site_session_concurrency

-- security definer so the count query below is not itself blocked by this
-- table's own RLS: site_sessions_self_insert (20260901122000_...) grants a
-- student INSERT on their own row but no SELECT on anyone's rows (their own
-- included), and site_sessions_admin_read only grants SELECT to admins. A
-- student inserting their own 2nd session still needs this function able to
-- see their own prior open rows to count them — same reasoning as every
-- other security-definer function in this schema (admin_force_sign_out(),
-- close_idle_site_sessions(), both in the two migrations named above).
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
  -- Admins get headroom for a few real devices; students are capped at a
  -- single concurrent session (site-owner call — see this migration's own
  -- header comment for why students are deliberately stricter).
  v_max_sessions := case when new.track_code = 'ADMIN' then 4 else 1 end;

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
  'BEFORE INSERT trigger function on public.site_sessions: refuses a new open session once the inserting user_id already has v_max_sessions open (ended_at is null) rows, where v_max_sessions is 4 for track_code = ''ADMIN'' and 1 for every other track_code (including null). Raises with the MNT_SESSION_LIMIT_REACHED: prefix that portal/app.js string-matches on — see SESSION_SECURITY_SPEC.md Decision 1/3.';

-- No RLS or grant changes needed here — this trigger fires on the existing
-- site_sessions_self_insert policy's INSERT path (20260901122000_...); it
-- doesn't add a new write surface, it constrains the one that already
-- exists.
create trigger site_sessions_concurrency_cap
  before insert on public.site_sessions
  for each row execute function public.enforce_site_session_concurrency();

comment on trigger site_sessions_concurrency_cap on public.site_sessions is
  'Enforces the role-based open-session cap (4 for track_code = ''ADMIN'', 1 for every other track_code) per user_id on every insert. See public.enforce_site_session_concurrency() and SESSION_SECURITY_SPEC.md Decision 1.';

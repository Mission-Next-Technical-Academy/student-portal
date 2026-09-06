-- Mission Next Technical Academy — UEBA-lite: habitual-IP arbitration for
-- students.
--
-- SESSION_SECURITY_SPEC.md, Decision 4. Sits on top of Decision 1's flat
-- concurrency cap (20260906120000_site_session_concurrency_cap.sql): a flat
-- "student = 1 concurrent session" rule treats every second-login attempt
-- identically, whether it's an attacker with stolen credentials or the same
-- student switching from their phone to their laptop on the same home
-- network. This migration adds the data half of a deliberately small,
-- non-ML behavioral signal — one table, simple counts — that
-- supabase/functions/check-login-ueba (written alongside this migration,
-- not deployed by this pass) uses to decide, when a student already has an
-- open session and a new sign-in shows up from a different IP, whether the
-- new IP looks like them, looks unknown-but-plausible, or looks like a
-- location they've never touched before. Tuned conservatively per the
-- spec: a false lockout costs a student one retry message; a false allow
-- costs an account compromise, so ties go to blocking.
--
-- Own file, separate from the other two site-owner-requested features
-- landing the same day (20260906120000_site_session_concurrency_cap.sql,
-- Decision 1; 20260906121000_site_session_geo_blocked_reason.sql +
-- supabase/functions/check-login-geofence, Decision 2) — three agents
-- working in parallel on independent features under the same spec. Read
-- both of those for context/conventions; neither is modified here.
--
-- Note on 'superseded': site_sessions.ended_reason already allows
-- 'superseded' as a CHECK value (20260901122000_activity_monitor_
-- sessions.sql's original constraint), but that same migration's own
-- column comment — last restated by 20260906121000_site_session_geo_
-- blocked_reason.sql, Decision 2's migration, which is not this agent's
-- file to touch — still describes it as "reserved, not implemented." As of
-- this migration it IS implemented: check-login-ueba's favor_new path
-- (below) sets ended_reason = 'superseded' on the old row it closes. The
-- CHECK constraint does not need widening (the value was already legal),
-- but that column comment is now stale and should be corrected the next
-- time someone touches site_sessions.ended_reason's comment — flagging it
-- here rather than editing a migration that belongs to a parallel agent.

-- ------------------------------------------------------- user_ip_history

-- ip_hash, not ip_address: site owner does not want raw IPs persisted here
-- at all, even admin-read-only. check-login-ueba computes ip_hash as
-- HMAC-SHA256(IP_HASH_PEPPER, real_client_ip) — a secret pepper that lives
-- only in Edge Function environment secrets, never in this database — and
-- stores/compares only that. HMAC is deterministic (same IP always hashes
-- to the same value, so "have we seen this IP before" and "is this the
-- same IP as the open session" both still work as plain equality checks)
-- but not reversible without the pepper, so nobody who can read this table
-- — including an admin — can recover an actual IP address from it.
create table public.user_ip_history (
  user_id       uuid not null references auth.users(id) on delete cascade,
  ip_hash       text not null,
  login_count   integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  primary key (user_id, ip_hash)
);

comment on table public.user_ip_history is
  'Lightweight per-user IP familiarity count, written only by supabase/functions/check-login-ueba on a login that was actually allowed through (never on a blocked/flagged attempt — see that function''s header comment for why counting blocked attempts would let an attacker grind their way into looking habitual). ip_hash is HMAC-SHA256(IP_HASH_PEPPER, real client IP), never the raw IP — the pepper lives only in Edge Function secrets, so this table cannot be used to recover an actual IP even by an admin with full read access. Used only to arbitrate a second concurrent student sign-in against an already-open session (Decision 4, SESSION_SECURITY_SPEC.md) — not a general security-analytics table, not exposed to students, admin-read only.';

alter table public.user_ip_history enable row level security;

-- Admin-only read, same is_admin() gate as every other admin-only table in
-- this schema (public.student_credentials, public.site_sessions' own
-- admin_read policy, etc.).
create policy user_ip_history_admin_read on public.user_ip_history
  for select using (public.is_admin());

comment on policy user_ip_history_admin_read on public.user_ip_history is
  'Admins can read the full IP-familiarity table. No student-facing read at all — this is an arbitration input, not a self-service feature.';

-- No client-writable path at all — every row is written by check-login-ueba
-- via its service-role client, same posture as public.student_credentials
-- (20260901130100_student_credentials.sql): no insert/update/delete policy
-- exists for `authenticated`, and the explicit revoke below closes off even
-- an accidental future table-level grant.
revoke all on public.user_ip_history from anon, authenticated;
grant all on public.user_ip_history to service_role;

-- ------------------------------------------------------ bump_user_ip_history

-- The spec's upsert ("insert with login_count = 1, or on conflict
-- login_count = login_count + 1, last_seen_at = now()") needs an atomic
-- increment, which supabase-js's .upsert() cannot express from an Edge
-- Function (it can only set conflicting columns to fixed values, which
-- would reset login_count to 1 on every repeat login instead of growing
-- it). Small security-definer helper so check-login-ueba can call one
-- atomic operation via .rpc() instead of a racy select-then-write from the
-- function itself. security definer so it can write regardless of caller
-- role — but this function is only ever invoked by check-login-ueba's
-- service-role client in practice; the explicit revoke/grant below still
-- closes off a student calling it directly with an arbitrary IP, since
-- that would otherwise let a student manufacture their own "habitual IP"
-- history and defeat the block_suspicious/favor_new arbitration.
create or replace function public.bump_user_ip_history(p_user_id uuid, p_ip_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.user_ip_history (user_id, ip_hash, login_count, first_seen_at, last_seen_at)
  values (p_user_id, p_ip_hash, 1, now(), now())
  on conflict (user_id, ip_hash)
  do update set login_count = public.user_ip_history.login_count + 1,
                last_seen_at = now();
$$;

comment on function public.bump_user_ip_history(uuid, text) is
  'Atomic insert-or-increment for public.user_ip_history, keyed on ip_hash (HMAC-SHA256 of the real IP, computed by the caller — never a raw IP passed in here). Called only by supabase/functions/check-login-ueba''s service-role client on a login that was actually allowed through — never on a blocked/flagged attempt. Execute is revoked from anon/authenticated (below) so a student cannot call this directly to manufacture their own IP-familiarity history.';

revoke all on function public.bump_user_ip_history(uuid, text) from public, anon, authenticated;
grant execute on function public.bump_user_ip_history(uuid, text) to service_role;

-- --------------------------------------------------------- site_sessions.ip_hash

-- ip_hash, not ip_address: same site-owner privacy call as user_ip_history
-- above — no raw IP persisted here either.
alter table public.site_sessions add column ip_hash text;

comment on column public.site_sessions.ip_hash is
  'HMAC-SHA256(IP_HASH_PEPPER, real client IP) for the session''s opening request (from x-forwarded-for, never client-supplied) — never the raw IP itself; the pepper lives only in Edge Function secrets, so this column cannot be used to recover an actual IP even by an admin. Written by supabase/functions/check-login-geofence once the row exists (check-login-ueba runs before the row is created, so it cannot write onto it — see SESSION_SECURITY_SPEC.md Decision 3 for the ordering). A pre-this-feature row has ip_hash is null; treat null as "unknown," never as "matches nothing" or "matches everything" — see check-login-ueba''s favor_new logic, which deliberately treats an unknown old hash as undefeatable so a stale untracked session can''t be trivially superseded.';

-- No RLS/grant change needed: site_sessions already grants
-- select/insert/update to authenticated (20260901122000_...) and this is
-- just a new nullable column on the existing table/policies.

-- ------------------------------------------------- login_events flag columns

alter table public.login_events
  add column flagged_suspicious boolean not null default false,
  add column flag_reason text;

comment on column public.login_events.flagged_suspicious is
  'Set true only by supabase/functions/check-login-ueba''s block_suspicious path (a sign-in attempt from an IP with zero prior history on this account while another session is already open). Admin-visible-only in intent — see this migration''s header note below on the existing login_events_self_read policy for why that intent is not fully enforced by RLS today. Never named in any student-facing error text (Decision 3): telling an attacker their attempt was specifically flagged, versus just blocked, is free intelligence.';
comment on column public.login_events.flag_reason is
  'Free-text reason paired with flagged_suspicious. Only value written today is ''new_ip_with_active_session'' (check-login-ueba''s block_suspicious path). Same admin-visible-only intent as flagged_suspicious.';

-- Finding, per this migration's own review of 20260901110000_login_events.sql
-- (not modified here), for the orchestrator wiring portal/app.js:
--
--   login_events_self_read ("for select using (user_id = auth.uid())") is
--   row-scoped only, like every RLS policy — Postgres RLS has no per-column
--   granularity, so it is unavoidably "select *"-shaped for whichever rows
--   it admits. That means a student who reads their own login_events rows
--   (directly via supabase-js, not necessarily through any portal UI, which
--   may not surface this at all) CAN see flagged_suspicious/flag_reason on
--   their own rows once these columns exist. This migration does not
--   change that policy: Decision 4 explicitly calls for "no new RLS needed
--   beyond what login_events already restricts to admins/self," and RLS
--   fundamentally cannot split "admin sees these 2 columns, self does not"
--   within a single table under one Postgres role (`authenticated` is the
--   same role for both; is_admin() is a row-time function call, not a role
--   distinction column-level GRANTs could key off).
--
--   Whether that is "actually fine" depends on the threat this decision is
--   defending against: the realistic attacker here is someone with STOLEN
--   credentials who never gets a lasting session (check-login-ueba's
--   block_suspicious path signs them back out immediately per Decision 3),
--   so in the common case they have no standing JWT to read login_events
--   with at all. The narrow residual case is the brief window between
--   signInWithPassword() succeeding and the subsequent forced signOut()
--   (Decision 3's ordering) during which a captured access token could,
--   in principle, be used to query login_events and see the flag on that
--   same attempt. That window already exists today for other post-auth-
--   revoke reasons (geo_blocked, admin_forced) and is called out as an
--   accepted, documented limitation elsewhere in this schema
--   (admin_force_sign_out()'s and check-login-geofence's own comments), so
--   this migration treats it the same way rather than solving it here: a
--   real fix would require moving self-read of login_events behind a
--   column-limited view (like admin_site_sessions/admin_student_progress)
--   and updating whatever in portal/app.js currently relies on the direct
--   table policy — out of scope for "Decision 4 only," left for the
--   orchestrator to decide whether to pursue.
--
--   Writes: login_events_self_insert only checks user_id = auth.uid() in
--   its WITH CHECK, and the existing `grant select, insert on
--   public.login_events to authenticated` is table-wide, so nothing stops
--   a client from supplying flagged_suspicious/flag_reason values on their
--   own INSERT the same way any other column could be. This is a pre-
--   existing table-wide-grant pattern (not something this migration
--   introduces), there is no update policy at all (append-only, per that
--   migration's own comment), and check-login-ueba never trusts an
--   incoming flagged_suspicious/flag_reason value from the client anyway —
--   it always computes and PATCHes those columns itself via a service-role
--   client scoped to a specific login_event_id + user_id, so a self-
--   supplied value on insert is inert noise, not a privilege gain. Also
--   left as-is for the same "Decision 4 only" scoping reason.

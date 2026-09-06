-- Mission Next Technical Academy — login geofencing, ended_reason widening.
--
-- SESSION_SECURITY_SPEC.md, Decision 2. Adds a fourth site_sessions
-- ended_reason value, 'geo_blocked', for the new
-- supabase/functions/check-login-geofence Edge Function: a sign-in that
-- geolocates to a denylisted country (RU/CN/IR at time of writing) is
-- allowed to complete Supabase Auth's own handshake (unavoidable — see the
-- function's own header comment for why there is no pre-auth hook point in
-- this architecture), then immediately revoked. This migration only widens
-- the CHECK constraint and documents the new value; the revocation logic
-- itself lives entirely in the Edge Function using a service-role client,
-- the same "authenticate first, then close/revoke after the fact" shape as
-- admin_force_sign_out() and close_idle_site_sessions().
--
-- Own file, separate from the concurrent-session-cap migration
-- (20260906120000_site_session_concurrency_cap.sql) landing the same day —
-- both touch public.site_sessions but were written by two agents working in
-- parallel on independent features; keeping them in separate files avoids
-- any chance of a merge collision on one filename.
--
-- Same exact drop/add idiom as 20260901140000_site_sessions_idle_timeout.sql
-- used to add 'idle_timeout' — widen the constraint in place rather than a
-- new column/table.
--
-- Deliberately does NOT touch the site_sessions_self_close RLS policy (also
-- widened by 20260901140000_... for 'idle_timeout'): 'geo_blocked' is never
-- written by a student's own row-owner UPDATE under that policy — it is
-- only ever written by check-login-geofence's service-role client, which
-- bypasses RLS entirely. Widening the self-close policy's with_check to
-- also allow 'geo_blocked' would let a student write that reason onto their
-- own row directly, which is not desired.

alter table public.site_sessions
  drop constraint site_sessions_ended_reason_check;

alter table public.site_sessions
  add constraint site_sessions_ended_reason_check
  check (ended_reason in ('user_signed_out', 'idle_timeout', 'admin_forced', 'superseded', 'geo_blocked'));

comment on column public.site_sessions.ended_reason is
  'user_signed_out: student clicked sign out. idle_timeout: client-side inactivity timer signed them out (portal/app.js wireIdleSignOut()). admin_forced: closed via admin_force_sign_out(). geo_blocked: closed by supabase/functions/check-login-geofence after sign-in completed but the request geolocated to a blocked country. superseded: reserved, not implemented.';

-- Mission Next Technical Academy — anon table-grant hardening.
--
-- Outside-perspective pentest (2026-09-10, prompted by the site owner
-- noticing the admin credentials panel and asking to check it from the
-- attacker's side): using only the public anon/publishable key against the
-- live REST API (no login, no session), public.students,
-- public.student_credentials, public.user_ip_history, and public.sim_state
-- all correctly returned 401 permission denied — they already have an
-- explicit `revoke all ... from anon` from earlier migrations.
--
-- public.login_events, public.site_sessions, public.module_progress,
-- public.lab_attempts, public.capstone_submissions,
-- public.portfolio_artifacts, and public.cohorts never got that same
-- explicit revoke. Confirmed live: all seven returned HTTP 200 with `[]` to
-- an anonymous caller instead of a permission error — meaning anon still
-- holds Supabase's default auto-granted table privileges on them, and the
-- only thing currently keeping them empty is that every RLS policy on these
-- tables keys off `user_id = auth.uid()` or `is_admin()`, both of which are
-- NULL/false for an unauthenticated caller. No data actually leaked in this
-- test. But this is the identical root cause already fixed three times in
-- this project's history for RPC functions instead of tables
-- (20260904104000, 20260904151000, 20260906120000: "Supabase provisions
-- explicit EXECUTE grants to anon on newly created RPCs") — Supabase does
-- the same implicit default-privilege grant for newly created tables, and
-- it was never revoked here. Closing it now as defense-in-depth so a future
-- policy bug or an accidentally-permissive new policy on any of these seven
-- tables can't turn into an instant unauthenticated read, the way it could
-- today with zero additional grant work required.
--
-- Authenticated (self-row / admin) access is unaffected — every one of
-- these tables already has its own `grant ... to authenticated` alongside
-- RLS, which this migration does not touch.

revoke all on public.login_events from anon;
revoke all on public.site_sessions from anon;
revoke all on public.module_progress from anon;
revoke all on public.lab_attempts from anon;
revoke all on public.capstone_submissions from anon;
revoke all on public.portfolio_artifacts from anon;
revoke all on public.cohorts from anon;

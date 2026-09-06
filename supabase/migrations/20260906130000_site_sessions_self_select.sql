-- Fixes a real regression found via browser UAT of SESSION_SECURITY_SPEC.md
-- Decision 3 (2026-09-06): recordSiteSessionStart() (portal/app.js) changed
-- from a fire-and-forget insert to `.insert(...).select('id').single()`,
-- because checkLoginGeofence() needs the new row's id. But site_sessions has
-- never had a self-select RLS policy -- only site_sessions_admin_read
-- (admin-only). Postgres enforces SELECT policies against an INSERT's
-- RETURNING list, so every real student/admin login since the migrations in
-- this session went live has been silently rolling back its own
-- site_sessions insert with "new row violates row-level security policy for
-- table site_sessions" (42501) -- confirmed live against the linked project
-- in a rolled-back transaction, both with and without this fix.
--
-- Effect while this bug existed (still true for every row up to whenever
-- this migration ships): recordSiteSessionStart() always returned null (the
-- generic-failure branch, not the 'session_limit' sentinel, since the error
-- text never matched MNT_SESSION_LIMIT_REACHED), so signIn() always took the
-- "insert failed for some other reason -- don't block login" branch and
-- skipped checkLoginGeofence() entirely (it requires the site_session id).
-- Net result: login itself kept working (fail-open by accident, not by the
-- documented design), but the concurrency cap trigger, the Activity
-- Monitor's per-row site-time/signed-out columns, and Decision 2's
-- geofencing never actually ran for any real sign-in this session, even
-- though the trigger, the Edge Function, and their own isolated SQL logic
-- are all individually correct. The Activity Monitor's blank "Signed
-- out: --" / "Site time: --" cells on recent rows are the visible symptom.
create policy site_sessions_self_select on public.site_sessions
  for select
  using (user_id = auth.uid());

comment on policy site_sessions_self_select on public.site_sessions is
  'Lets a signed-in user read back their own open/closed site_sessions rows -- required for insert(...).select() RETURNING to succeed (Postgres checks RETURNING against SELECT policies), not a new admin-facing capability. site_sessions_admin_read (is_admin()) is unchanged and still the only way to read other users'' rows.';

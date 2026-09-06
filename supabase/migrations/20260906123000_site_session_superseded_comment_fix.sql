-- Mission Next Technical Academy — correct a comment left stale by landing
-- three parallel features the same day.
--
-- 20260901122000_activity_monitor_sessions.sql originally documented
-- 'superseded' as "reserved for a future portal/app.js wiring case... not
-- implemented by this migration." 20260906121000_site_session_geo_blocked_
-- reason.sql (Decision 2) restated that same wording while widening the
-- constraint for an unrelated value ('geo_blocked') and, working in
-- parallel, had no visibility into 20260906122000_user_ip_history_ueba.sql
-- (Decision 4), which implements 'superseded' the same day via check-
-- login-ueba's favor_new path (an old, less-habitual-IP session getting
-- closed in favor of a new sign-in from the student's more habitual IP).
-- No schema change here, comment-only — same "keep comments truthful"
-- discipline this repo already applied to public.students' own comment in
-- 20260901130100_student_credentials.sql.

comment on column public.site_sessions.ended_reason is
  'user_signed_out: student clicked sign out. idle_timeout: client-side inactivity timer signed them out (portal/app.js wireIdleSignOut()). admin_forced: closed via admin_force_sign_out(). geo_blocked: closed by supabase/functions/check-login-geofence after sign-in completed but the request geolocated to a blocked country. superseded: closed by supabase/functions/check-login-ueba''s favor_new path when a student''s new sign-in comes from a more-habitual IP than their already-open session (SESSION_SECURITY_SPEC.md Decision 4).';

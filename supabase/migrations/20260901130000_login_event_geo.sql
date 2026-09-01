-- Mission Next Technical Academy — Student Activity Monitor: login location.
--
-- Purely additive: new nullable columns on the existing public.login_events
-- table (20260901110000_login_events.sql), no existing column touched.
-- Backs an admin-only "approximate location per sign-in" display, added
-- after the site owner asked whether the Activity Monitor could show where
-- a login came from. Deliberately visibility only, same framing as the
-- rest of this table: never wired into attendance/instructional-time/
-- compliance calculations, and never used to auto-block a sign-in — the
-- human-driven response to a suspicious login stays admin_force_sign_out()
-- (20260901122000_activity_monitor_sessions.sql).
--
-- No RLS/grant changes in this migration. login_events_admin_read already
-- covers admin `select` of these new columns, and — critically — there is
-- still no `update` grant for `authenticated` on this table, so a student
-- has no path to write a fake ip_address/geo_* onto their own row. The only
-- writer of these columns is supabase/functions/record-login-geo, which
-- authenticates the caller then updates via its service-role client
-- (bypasses RLS/grants by design, same idiom as admin_force_sign_out()'s
-- security-definer bypass of auth.sessions). That function also scopes its
-- update to `id = login_event_id and user_id = verified_user_id`, so even
-- though the service-role client itself is not RLS-limited, a caller still
-- cannot patch another user's row through it.

alter table public.login_events
  add column ip_address inet,
  add column geo_city text,
  add column geo_region text,
  add column geo_country text,
  add column geo_looked_up_at timestamptz;

comment on column public.login_events.ip_address is
  'Request IP observed server-side by record-login-geo at sign-in time. Best-effort — null if no client IP was available (e.g. local dev) or the enrichment call has not landed yet.';
comment on column public.login_events.geo_city is
  'Coarse city-level geolocation of ip_address, from a free IP-geolocation lookup. Approximate, visibility only — never attendance/compliance-relevant, never used to block a login.';
comment on column public.login_events.geo_region is
  'Coarse region/state-level geolocation of ip_address. See geo_city.';
comment on column public.login_events.geo_country is
  'Coarse country-level geolocation of ip_address. See geo_city.';
comment on column public.login_events.geo_looked_up_at is
  'When the geo lookup ran. Distinct from occurred_at (the sign-in itself) since enrichment happens via a follow-up call and can land slightly after the row is first inserted, or not at all if the lookup failed.';

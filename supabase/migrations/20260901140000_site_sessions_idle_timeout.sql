-- Mission Next Technical Academy — auto sign-out on inactivity.
--
-- Site-owner request: the portal has session control on manual sign-out and
-- admin force-sign-out (20260901122000_activity_monitor_sessions.sql), but
-- nothing closes a session a student simply walked away from. Adds a third
-- self-close reason, 'idle_timeout', for portal/app.js's new client-side
-- inactivity timer (wireIdleSignOut() calls signOut() the same as a manual
-- click, just with this reason recorded instead).
--
-- Widens the existing check constraint and the site_sessions_self_close RLS
-- policy's with_check in place, rather than a new column/table — same shape
-- as 'user_signed_out', just a different cause.

alter table public.site_sessions
  drop constraint site_sessions_ended_reason_check;

alter table public.site_sessions
  add constraint site_sessions_ended_reason_check
  check (ended_reason in ('user_signed_out', 'idle_timeout', 'admin_forced', 'superseded'));

comment on column public.site_sessions.ended_reason is
  'user_signed_out: student clicked sign out. idle_timeout: client-side inactivity timer signed them out (portal/app.js wireIdleSignOut()). admin_forced: closed via admin_force_sign_out(). superseded: reserved for a future portal/app.js wiring case where a new sign-in on a fresh tab leaves an old session row never explicitly closed — not implemented by this migration, just room left in the constraint.';

drop policy site_sessions_self_close on public.site_sessions;

create policy site_sessions_self_close on public.site_sessions
  for update
  using (user_id = auth.uid() and ended_at is null)
  with check (user_id = auth.uid() and ended_reason in ('user_signed_out', 'idle_timeout'));

comment on policy site_sessions_self_close on public.site_sessions is
  'A student may close only their own still-open row, and only ever with ended_reason ''user_signed_out'' or ''idle_timeout'' — never ''admin_forced'' or ''superseded''.';

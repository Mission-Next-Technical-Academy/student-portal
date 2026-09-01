-- Mission Next Technical Academy — Student Activity Monitor: hours-on-site
-- and admin force-sign-out.
--
-- Sprint 1b of COHORT_USER_LIFECYCLE_SPRINT_PLAN.md ("Addendum, added
-- 2026-09-01 mid-sprint"). Two site-owner-requested features on the admin
-- Student Activity Monitor tab:
--
--   1. Log hours spent on the site into a Supabase table.
--   2. A sign-out button so an admin can force-sign-out a given student.
--
-- Deliberately a NEW, separate table from public.login_events
-- (20260901110000_login_events.sql, uncommitted, unrelated prior session —
-- not modified here, not even read/written by anything in this file).
-- login_events is an append-only log of login *events*; this migration is
-- about session *duration* (start/end pairs), a different shape and a
-- different write pattern (this table needs an update to close a session,
-- which login_events deliberately forbids). Keeping them separate means
-- login_events' append-only guarantee is never touched by this work.
--
-- Same operational-visibility-only framing as login_events: computeFixed
-- CreditHours() and the clock-hours reporting requirement (portal/app.js)
-- already establish that fixed curriculum-credit minutes are the only
-- compliance-relevant hours figure. Nothing in this table is wired into,
-- or should ever be wired into, attendance/instructional-time/compliance
-- calculations — it exists so an admin can see "who's on the site and for
-- how long" as a monitoring convenience, nothing more.

-- ------------------------------------------------------------ site_sessions

create table public.site_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  student_id    text,
  track_code    text check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  ended_reason  text check (ended_reason in ('user_signed_out', 'admin_forced', 'superseded'))
);

comment on table public.site_sessions is
  'One row per client-observed site session (sign-in to sign-out/close). Visibility only — never used for attendance, instructional-time, or compliance calculations; hours logged in the portal, not clock hours. computeFixedCreditHours() and the clock-hours reporting requirement (portal/app.js) already establish that fixed curriculum-credit minutes are the only compliance-relevant hours figure — this table is separate and must stay separate.';
comment on column public.site_sessions.ended_reason is
  'user_signed_out: student closed their own session. admin_forced: closed via admin_force_sign_out(). superseded: reserved for a future portal/app.js wiring case where a new sign-in on a fresh tab leaves an old session row never explicitly closed — not implemented by this migration, just room left in the constraint.';

create index site_sessions_user_idx on public.site_sessions (user_id, started_at desc);
create index site_sessions_open_idx on public.site_sessions (user_id) where ended_at is null;

alter table public.site_sessions enable row level security;

-- A student can open their own session row.
create policy site_sessions_self_insert on public.site_sessions
  for insert with check (user_id = auth.uid());

-- A student can close their own OPEN session row, and only as a normal
-- self-close: ended_reason is pinned to 'user_signed_out' here so a student
-- can never write 'admin_forced' (or 'superseded') onto their own row via
-- this policy. using() restricts which existing rows are even reachable
-- (must be theirs, must still be open); with check() restricts what the
-- updated row is allowed to look like (still theirs, and ended_reason must
-- be exactly 'user_signed_out'). Both must hold for the update to succeed.
create policy site_sessions_self_close on public.site_sessions
  for update
  using (user_id = auth.uid() and ended_at is null)
  with check (user_id = auth.uid() and ended_reason = 'user_signed_out');

-- An admin can read all rows. No general admin update policy via RLS — the
-- forced-close path goes through admin_force_sign_out() below instead,
-- which bypasses RLS as a security-definer function owner (same idiom as
-- other security-definer functions in this schema, e.g. guard_module_
-- completion() in 20260901103000_completion_integrity_guards.sql). No
-- student delete policy either.
create policy site_sessions_admin_read on public.site_sessions
  for select using (public.is_admin());

comment on policy site_sessions_self_insert on public.site_sessions is
  'A student may open a session row for themselves.';
comment on policy site_sessions_self_close on public.site_sessions is
  'A student may close only their own still-open row, and only ever with ended_reason = ''user_signed_out'' — never ''admin_forced'' or ''superseded''.';
comment on policy site_sessions_admin_read on public.site_sessions is
  'Admins see every session row, for the Activity Monitor tab.';

grant select, insert, update on public.site_sessions to authenticated;

-- --------------------------------------------------------- admin_force_sign_out

create or replace function public.admin_force_sign_out(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_force_sign_out: caller is not an admin';
  end if;

  -- Deleting the auth.sessions row is the actual revocation mechanism: it
  -- blocks that refresh token from getting a new access token. This does
  -- NOT instantly invalidate an access token already held in the browser —
  -- that token remains valid until its own short expiry (typically ~1 hour
  -- under Supabase's defaults). In practice this means the student is
  -- blocked from staying signed in past their next token refresh or next
  -- full reload, not evicted mid-session. Known, acceptable limitation for
  -- this admin action, not a bug to solve further here.
  --
  -- If this DELETE turns out to be blocked by insufficient grants on the
  -- hosted project when the site owner tests this post-push (auth schema
  -- table permissions can vary by Supabase project/plan), the documented
  -- fallback is an Edge Function call to Supabase Auth's admin sign-out
  -- endpoint instead — not implemented here, just noted as the fallback
  -- path so a future session doesn't have to rediscover it.
  delete from auth.sessions where user_id = target_user_id;

  -- Close any of their open site_sessions rows so the Activity Monitor
  -- reflects the forced sign-out immediately.
  update public.site_sessions
  set ended_at = now(), ended_reason = 'admin_forced'
  where user_id = target_user_id and ended_at is null;
end;
$$;

comment on function public.admin_force_sign_out(uuid) is
  'Admin-only. Revokes the target user''s refresh sessions (blocks re-auth past next token refresh/reload — does not instantly kill an already-issued access token) and closes their open site_sessions row(s). Fallback if auth.sessions DELETE is grant-blocked on the hosted project: an Edge Function calling Supabase Auth''s admin sign-out endpoint instead.';

-- The function's own is_admin() check is what actually gates this — same
-- pattern as other admin-only security-definer functions in this repo's
-- migrations (e.g. finalize_report_generation_audit() in 20260829133000_
-- report_generation_audit.sql).
grant execute on function public.admin_force_sign_out(uuid) to authenticated;

-- --------------------------------------------------------- admin_site_sessions

-- security_invoker = true means RLS on underlying tables still applies, so
-- the view itself runs with the querying user's permissions; the where
-- clause gates this to admins only (defensive: a student querying it gets
-- zero rows back, not an error). Per-session rows only — newest-first
-- ordering is the caller's job, not baked into a view meant to back
-- arbitrary admin-UI sorting.
create or replace view public.admin_site_sessions
with (security_invoker = true) as
select
  ss.id,
  ss.user_id,
  ss.student_id,
  ss.track_code,
  ss.started_at,
  ss.ended_at,
  ss.ended_reason,
  round(extract(epoch from (coalesce(ss.ended_at, now()) - ss.started_at)) / 60.0, 1) as duration_minutes
from public.site_sessions ss
where public.is_admin();

grant select on public.admin_site_sessions to authenticated;

-- --------------------------------------------------- admin_site_hours_by_student

create or replace view public.admin_site_hours_by_student
with (security_invoker = true) as
select
  ss.user_id,
  ss.student_id,
  ss.track_code,
  sum(round(extract(epoch from (coalesce(ss.ended_at, now()) - ss.started_at)) / 60.0, 1)) as total_minutes,
  count(*)                     as session_count,
  max(ss.started_at)           as last_session_started_at
from public.site_sessions ss
where public.is_admin()
group by ss.user_id, ss.student_id, ss.track_code;

grant select on public.admin_site_hours_by_student to authenticated;

-- M360 101 live-session schedule
-- Course-level schedule only. No attendance, clock-hour, technical progress,
-- lab, grade, or student-completion data is stored here.
--
-- Policies use drop-if-exists/create rather than a bare create: this file's
-- content was already applied to the linked remote project once under a
-- different, since-renamed migration timestamp (20260908231856, reconciled
-- via `supabase migration repair --status reverted` on 2026-09-10). Making
-- the policies idempotent lets this migration re-run cleanly regardless of
-- that prior partial history.

create table if not exists public.m360_live_sessions (
  week_number integer not null check (week_number between 1 and 6),
  session_number integer not null check (session_number between 1 and 2),
  session_date date not null,
  session_time time without time zone not null,
  timezone_label text not null default 'ET' check (char_length(trim(timezone_label)) between 1 and 16),
  updated_by uuid null,
  updated_at timestamp with time zone not null default now(),
  primary key (week_number, session_number)
);

alter table public.m360_live_sessions enable row level security;

revoke all on table public.m360_live_sessions from anon;
grant select, insert, update, delete on table public.m360_live_sessions to authenticated;

drop policy if exists m360_live_sessions_authenticated_read on public.m360_live_sessions;
create policy m360_live_sessions_authenticated_read
on public.m360_live_sessions
for select
to authenticated
using (true);

drop policy if exists m360_live_sessions_admin_insert on public.m360_live_sessions;
create policy m360_live_sessions_admin_insert
on public.m360_live_sessions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists m360_live_sessions_admin_update on public.m360_live_sessions;
create policy m360_live_sessions_admin_update
on public.m360_live_sessions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists m360_live_sessions_admin_delete on public.m360_live_sessions;
create policy m360_live_sessions_admin_delete
on public.m360_live_sessions
for delete
to authenticated
using (public.is_admin());

comment on table public.m360_live_sessions is
  'M360 101 course-level live-session date/time display. This table is not an attendance or instructional-time record.';

-- Mission Next Technical Academy — Student Activity Monitor: login events.
--
-- Purely additive: one new table, no existing table touched. Backs a new
-- admin-only "who logged in and when" tab. Deliberately NOT wired into any
-- compliance/hours/attendance calculation — computeFixedCreditHours() and
-- the clock-hours reporting requirement (portal/app.js) already establish
-- that browser/login activity is never treated as instructional time or
-- attendance; this table is operational visibility only (e.g. spotting an
-- account that has never logged in, or a burst of activity worth a look),
-- and the admin UI says so.
--
-- Populated by a plain client insert right after a successful
-- signInWithPassword() (portal/app.js signIn()/recordLoginEvent()), the same
-- fire-and-forget/self-row pattern already used for module_progress and
-- lab_attempts. Best-effort, not tamper-proof — a student could suppress
-- their own event by calling the API directly, but that's fine: this table
-- is a monitoring convenience, not a security control (that's what the
-- 20260901103000 completion-integrity migration is for).

create table public.login_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  student_id  text,
  track_code  text check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  occurred_at timestamptz not null default now()
);

comment on table public.login_events is
  'One row per client-observed sign-in. Visibility only — never used for attendance, instructional-time, or compliance calculations.';

create index login_events_user_idx on public.login_events (user_id, occurred_at desc);
create index login_events_occurred_idx on public.login_events (occurred_at desc);

alter table public.login_events enable row level security;

create policy login_events_self_insert on public.login_events
  for insert with check (user_id = auth.uid());
create policy login_events_self_read on public.login_events
  for select using (user_id = auth.uid());
create policy login_events_admin_read on public.login_events
  for select using (public.is_admin());

-- Append-only: no update/delete policy, no update/delete grant.
grant select, insert on public.login_events to authenticated;

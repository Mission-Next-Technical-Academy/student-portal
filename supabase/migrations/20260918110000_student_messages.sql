-- Student ↔ faculty messages.  This is an in-portal, plain-text channel;
-- it deliberately has no email delivery, attachments, or rich content.
-- Messages are append-only so a thread retains its academic support record.

create table public.student_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null default gen_random_uuid(),
  student_id  uuid not null references auth.users(id) on delete cascade,
  track_code  text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  subject     text not null check (char_length(btrim(subject)) between 1 and 160),
  body        text not null check (char_length(btrim(body)) between 1 and 10000),
  sender_role text not null check (sender_role in ('student', 'faculty')),
  context     jsonb,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

create index student_messages_student_thread_created_idx
  on public.student_messages (student_id, thread_id, created_at);
create index student_messages_unread_track_created_idx
  on public.student_messages (track_code, created_at)
  where sender_role = 'student' and read_at is null;

comment on table public.student_messages is
  'Append-only direct messages inside the portal. Faculty replies reuse thread_id; this is not email.';
comment on column public.student_messages.context is
  'Optional plain metadata about where the student composed, such as module_key or lab_key. Never required for a message.';

alter table public.student_messages enable row level security;

-- Rows are a correspondence record, not editable documents. Both students
-- and faculty may only set read_at on the message types their policies allow.
create or replace function public.student_messages_only_mark_read()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.thread_id is distinct from old.thread_id
     or new.student_id is distinct from old.student_id
     or new.track_code is distinct from old.track_code
     or new.subject is distinct from old.subject
     or new.body is distinct from old.body
     or new.sender_role is distinct from old.sender_role
     or new.context is distinct from old.context
     or new.created_at is distinct from old.created_at then
    raise exception 'Student messages are immutable; only read_at may be updated';
  end if;
  return new;
end;
$$;

create trigger student_messages_only_mark_read_trg
  before update on public.student_messages
  for each row execute function public.student_messages_only_mark_read();

-- Same owned-row shape as module_progress_own, with an added roster check so
-- a student cannot write a message into another course workspace.
create policy student_messages_student_read on public.student_messages
  for select to authenticated
  using (student_id = auth.uid());

create policy student_messages_student_insert on public.student_messages
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and sender_role = 'student'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.track_code = student_messages.track_code
        and s.is_enrolled is not false
    )
  );

-- A student may only acknowledge a faculty reply in their own thread; message
-- content, authorship, track, and timestamps remain immutable.
create policy student_messages_student_mark_faculty_read on public.student_messages
  for update to authenticated
  using (student_id = auth.uid() and sender_role = 'faculty')
  with check (student_id = auth.uid() and sender_role = 'faculty');

-- Faculty/admin access is intentionally table-wide at the database role
-- level, matching grading. The portal only renders it inside a selected
-- track workspace and the queue view below exposes the same track code.
create policy student_messages_faculty_read on public.student_messages
  for select to authenticated
  using (public.is_admin());

create policy student_messages_faculty_insert on public.student_messages
  for insert to authenticated
  with check (
    public.is_admin()
    and sender_role = 'faculty'
    and exists (
      select 1 from public.students s
      where s.user_id = student_messages.student_id
        and s.track_code = student_messages.track_code
    )
  );

create policy student_messages_faculty_mark_student_read on public.student_messages
  for update to authenticated
  using (public.is_admin() and sender_role = 'student')
  with check (public.is_admin() and sender_role = 'student');

-- The analogue of admin_grading_queue: current unread student messages,
-- loaded eagerly because track tiles need their badges before the Inbox tab
-- is opened. security_invoker keeps RLS in force.
create or replace view public.admin_unread_student_messages
with (security_invoker = true) as
select
  sm.id,
  sm.thread_id,
  sm.student_id as user_id,
  s.student_id,
  sm.track_code,
  sm.subject,
  sm.body,
  sm.context,
  sm.created_at
from public.student_messages sm
join public.students s on s.user_id = sm.student_id
where sm.sender_role = 'student'
  and sm.read_at is null
  and public.is_admin();

comment on view public.admin_unread_student_messages is
  'Admin-only unread student messages. Drives the per-track inbox badge; faculty mark a student message read when opening its thread.';

revoke all on public.student_messages, public.admin_unread_student_messages from anon;
grant select, insert, update on public.student_messages to authenticated;
grant select on public.admin_unread_student_messages to authenticated;

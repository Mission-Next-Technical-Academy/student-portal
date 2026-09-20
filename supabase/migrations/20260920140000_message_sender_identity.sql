-- Preserve who authored each reply without exposing staff email addresses.
-- Students see a role label only: Global Admin or their course instructor.

alter table public.student_messages
  add column sender_identity text not null default 'student'
    check (sender_identity in ('student', 'course_instructor', 'global_admin'));

update public.student_messages
set sender_identity = 'course_instructor'
where sender_role = 'faculty';

comment on column public.student_messages.sender_identity is
  'Persisted author category: student, the assigned course instructor, or a Global Admin. Never a display name or email address.';

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
     or new.sender_identity is distinct from old.sender_identity
     or new.context is distinct from old.context
     or new.created_at is distinct from old.created_at then
    raise exception 'Student messages are immutable; only read_at may be updated';
  end if;
  return new;
end;
$$;

-- Administrators supervise all course workspaces. Instructors can only read,
-- reply to, or acknowledge messages for their explicit course assignment.
drop policy if exists student_messages_assigned_faculty_read on public.student_messages;
drop policy if exists student_messages_assigned_faculty_insert on public.student_messages;
drop policy if exists student_messages_assigned_faculty_mark_student_read on public.student_messages;
drop policy if exists student_messages_student_insert on public.student_messages;

create policy student_messages_faculty_or_admin_read on public.student_messages
  for select to authenticated
  using (public.is_admin() or public.can_manage_course_messages(track_code));

create policy student_messages_faculty_or_admin_insert on public.student_messages
  for insert to authenticated
  with check (
    sender_role = 'faculty'
    and exists (
      select 1 from public.students s
      where s.user_id = student_messages.student_id
        and s.track_code = student_messages.track_code
    )
    and (
      (public.is_admin() and sender_identity = 'global_admin')
      or (public.can_manage_course_messages(track_code) and sender_identity = 'course_instructor')
    )
  );

create policy student_messages_faculty_or_admin_mark_student_read on public.student_messages
  for update to authenticated
  using (sender_role = 'student' and (public.is_admin() or public.can_manage_course_messages(track_code)))
  with check (sender_role = 'student' and (public.is_admin() or public.can_manage_course_messages(track_code)));

create policy student_messages_student_insert on public.student_messages
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and sender_role = 'student'
    and sender_identity = 'student'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
        and s.track_code = student_messages.track_code
        and s.is_enrolled is not false
    )
    and public.course_has_active_message_recipient(student_messages.track_code)
  );

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
  and (public.is_admin() or public.can_manage_course_messages(sm.track_code));

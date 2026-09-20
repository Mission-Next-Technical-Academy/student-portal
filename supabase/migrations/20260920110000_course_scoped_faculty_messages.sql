-- Course-scoped faculty messaging.
--
-- A general administrative account is not automatically the instructor for
-- every course.  This roster is the authority for who may receive, read, or
-- reply to messages for a specific track.  Populate it through the academy's
-- staff provisioning workflow before enabling messaging for a course.

create table public.faculty_course_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  primary key (user_id, track_code)
);

comment on table public.faculty_course_assignments is
  'The authoritative roster assigning a faculty account to a course track for in-portal messages.';

alter table public.faculty_course_assignments enable row level security;

-- Faculty can discover only their own assignments.  Academy administrators
-- retain roster-management authority, but message access itself is still
-- determined by the course assignment below.
create policy faculty_course_assignments_self_read on public.faculty_course_assignments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy faculty_course_assignments_admin_write on public.faculty_course_assignments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.can_manage_course_messages(p_track_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.faculty_course_assignments assignment
    where assignment.user_id = auth.uid()
      and assignment.track_code = p_track_code
      and assignment.active
  );
$$;

grant execute on function public.can_manage_course_messages(text) to authenticated;

-- Student inserts must not be blocked merely because assignment rows are
-- private to faculty.  This answers only whether an active recipient exists;
-- it reveals neither the instructor identity nor the assignment roster.
create or replace function public.course_has_active_message_recipient(p_track_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.faculty_course_assignments assignment
    where assignment.track_code = p_track_code
      and assignment.active
  );
$$;

grant execute on function public.course_has_active_message_recipient(text) to authenticated;

-- Replace the former table-wide admin policies with course-assignment gates.
drop policy if exists student_messages_faculty_read on public.student_messages;
drop policy if exists student_messages_faculty_insert on public.student_messages;
drop policy if exists student_messages_faculty_mark_student_read on public.student_messages;

create policy student_messages_assigned_faculty_read on public.student_messages
  for select to authenticated
  using (public.can_manage_course_messages(track_code));

create policy student_messages_assigned_faculty_insert on public.student_messages
  for insert to authenticated
  with check (
    sender_role = 'faculty'
    and public.can_manage_course_messages(track_code)
    and exists (
      select 1 from public.students s
      where s.user_id = student_messages.student_id
        and s.track_code = student_messages.track_code
    )
  );

create policy student_messages_assigned_faculty_mark_student_read on public.student_messages
  for update to authenticated
  using (sender_role = 'student' and public.can_manage_course_messages(track_code))
  with check (sender_role = 'student' and public.can_manage_course_messages(track_code));

-- Do not allow a student to submit a course message that has no assigned
-- recipient.  The same assignment also controls visibility and replies.
drop policy if exists student_messages_student_insert on public.student_messages;
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
  and public.can_manage_course_messages(sm.track_code);

revoke all on public.faculty_course_assignments from anon;
grant select, insert, update, delete on public.faculty_course_assignments to authenticated;

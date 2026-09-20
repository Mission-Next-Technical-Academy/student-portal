-- Dedicated, course-scoped instructor account identities.
--
-- Instructor login IDs intentionally use a role suffix (HDINST/SOCANINST)
-- rather than a learner track suffix.  Course authority is never inferred
-- from that suffix: public.faculty_course_assignments remains the sole
-- authority for the dashboard and message course scope.

alter table public.students
  drop constraint if exists students_track_code_check;

alter table public.students
  add constraint students_track_code_check
  check (track_code in (
    'SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN',
    'SOCANINST', 'HDINST'
  ));

alter table public.students
  add column if not exists is_instructor boolean not null default false;

-- Login/security telemetry stores the roster identity code. Permit the two
-- instructor identities there as well so an otherwise valid instructor login
-- cannot fail session/login-event recording due to an outdated check.
alter table public.login_events
  drop constraint if exists login_events_track_code_check;

alter table public.login_events
  add constraint login_events_track_code_check
  check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN', 'SOCANINST', 'HDINST'));

alter table public.site_sessions
  drop constraint if exists site_sessions_track_code_check;

alter table public.site_sessions
  add constraint site_sessions_track_code_check
  check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN', 'SOCANINST', 'HDINST'));

comment on column public.students.is_instructor is
  'True only for dedicated course instructor identities. Course access is still restricted by public.faculty_course_assignments.';

comment on column public.students.track_code is
  'Login identity type. Learner codes map to public.programs; ADMIN is academy-wide administration; SOCANINST and HDINST are dedicated instructor identities. Faculty course authorization is always defined by public.faculty_course_assignments.';

create or replace function public.is_course_instructor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.faculty_course_assignments assignment on assignment.user_id = s.user_id
    where s.user_id = auth.uid()
      and s.is_instructor
      and s.track_code in ('SOCANINST', 'HDINST')
      and assignment.active
  );
$$;

grant execute on function public.is_course_instructor() to authenticated;

-- Dedicated instructor identities are intentionally one-course identities.
-- The Edge Function already creates exactly one assignment, but enforce the
-- same invariant in the database so a later direct/admin write cannot turn
-- one of these staging accounts into a cross-course account.
create or replace function public.enforce_dedicated_instructor_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_identity_code text;
begin
  select s.track_code into v_identity_code
  from public.students s
  where s.user_id = new.user_id and s.is_instructor;

  if v_identity_code is null then
    return new;
  end if;

  if (v_identity_code = 'SOCANINST' and new.track_code <> 'SOCAN')
     or (v_identity_code = 'HDINST' and new.track_code <> 'HDESK') then
    raise exception 'Instructor identity % cannot be assigned to course %', v_identity_code, new.track_code;
  end if;

  if new.active and exists (
    select 1
    from public.faculty_course_assignments assignment
    where assignment.user_id = new.user_id
      and assignment.active
      and assignment.track_code <> new.track_code
  ) then
    raise exception 'Dedicated instructor identities may have exactly one active course assignment';
  end if;

  return new;
end;
$$;

create trigger faculty_course_assignments_dedicated_instructor_scope
  before insert or update on public.faculty_course_assignments
  for each row execute function public.enforce_dedicated_instructor_assignment();

-- -------------------------------------------------------------------------
-- Course-instructor data boundary
--
-- These policies do not reuse is_admin(). They allow a dedicated instructor
-- to read or grade only learner rows whose track is actively assigned to that
-- instructor. Academy administrators retain their existing global policies.

create policy students_assigned_instructor_read on public.students
  for select to authenticated
  using (
    is_instructor = false
    and public.can_manage_course_messages(track_code)
  );

create policy module_progress_assigned_instructor_read on public.module_progress
  for select to authenticated
  using (public.can_manage_course_messages(track_code));

create policy lab_attempts_assigned_instructor_read on public.lab_attempts
  for select to authenticated
  using (public.can_manage_course_messages(track_code));

create policy lab_attempts_assigned_instructor_review on public.lab_attempts
  for update to authenticated
  using (public.can_manage_course_messages(track_code))
  with check (public.can_manage_course_messages(track_code));

create policy capstone_submissions_assigned_instructor_read on public.capstone_submissions
  for select to authenticated
  using (public.can_manage_course_messages(track_code));

create policy lab_attempt_feedback_assigned_instructor_read on public.lab_attempt_feedback
  for select to authenticated
  using (exists (
    select 1 from public.lab_attempts la
    where la.id = lab_attempt_feedback.lab_attempt_id
      and public.can_manage_course_messages(la.track_code)
  ));

create policy lab_attempt_feedback_assigned_instructor_insert on public.lab_attempt_feedback
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.lab_attempts la
      where la.id = lab_attempt_feedback.lab_attempt_id
        and public.can_manage_course_messages(la.track_code)
    )
  );

-- This is the faculty dashboard's roster query. It intentionally exposes a
-- minimal teaching projection and has no academy-wide fallback: a faculty
-- caller receives rows only for an active faculty_course_assignments track.
-- security_invoker ensures the explicit table policies above remain in force.
create or replace view public.faculty_course_student_progress
with (security_invoker = true) as
select
  s.student_id,
  s.user_id,
  s.track_code,
  s.is_enrolled,
  coalesce(mp.modules_complete, 0)::int as technical_completed,
  12::int as technical_required,
  round(coalesce(mp.modules_complete, 0) * 100.0 / 12.0, 1) as technical_percent,
  coalesce(mp.modules_in_progress, 0)::int as technical_in_progress,
  mp.last_active as technical_last_active,
  coalesce(la.lab_attempts_count, 0)::int as lab_attempts_count,
  coalesce(cs.capstone_submissions_count, 0)::int as capstone_submissions_count
from public.students s
left join lateral (
  select
    count(*) filter (where p.state = 'complete') as modules_complete,
    count(*) filter (where p.state = 'in_progress') as modules_in_progress,
    max(p.updated_at) as last_active
  from public.module_progress p
  where p.user_id = s.user_id and p.track_code = s.track_code
) mp on true
left join lateral (
  select count(*) as lab_attempts_count
  from public.lab_attempts a
  where a.user_id = s.user_id and a.track_code = s.track_code
) la on true
left join lateral (
  select count(*) as capstone_submissions_count
  from public.capstone_submissions c
  where c.user_id = s.user_id and c.track_code = s.track_code
) cs on true
where s.is_instructor = false
  and public.can_manage_course_messages(s.track_code);

comment on view public.faculty_course_student_progress is
  'Course-scoped instructor roster/progress projection. Use this view, never the admin_student_program_progress view, for a dedicated instructor dashboard.';

grant select on public.faculty_course_student_progress to authenticated;

create or replace view public.faculty_grading_queue
with (security_invoker = true) as
select
  la.id,
  la.user_id,
  s.student_id,
  la.track_code,
  la.lab_key,
  la.score,
  la.pass_threshold,
  la.result,
  la.started_at,
  la.completed_at
from public.lab_attempts la
join public.students s on s.user_id = la.user_id
where la.state = 'complete'
  and la.reviewed_at is null
  and public.can_manage_course_messages(la.track_code);

comment on view public.faculty_grading_queue is
  'Course-scoped pending lab-review queue for dedicated instructors.';

grant select on public.faculty_grading_queue to authenticated;

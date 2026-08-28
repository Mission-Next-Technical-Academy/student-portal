-- MNT Academy — students roster, admin functions, and admin dashboard.
-- Separate from public.profiles (which are basic user metadata).
-- PLATFORM_ARCHITECTURE.md §4.2–§4.6.

-- ---------------------------------------------------------- track/program map
--
-- Login ID format: <10-digit-number>-<TRACKCODE>
--   SOCAN  → soc-analyst
--   HDESK  → it-support
--   AIENG  → ai-ml
--   ELECT  → electrical
--   ADMIN  → no program (instructor/admin account)
--
-- This mapping is stable. If it changes, update both the check constraint
-- below AND the provisioning script that synthesizes emails.

-- ---------------------------------------------------------------- students

create table public.students (
  student_id  text primary key,
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  track_code  text not null
                check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.students is
  'Private roster keyed by login ID. Readable only by the student''s own row or by an admin. Password is never stored—Supabase Auth owns hashing entirely.';
comment on column public.students.student_id is
  'Full login string, e.g. "4957361987-SOCAN". Primary key for student identity.';
comment on column public.students.track_code is
  'Maps to public.programs.slug via the track/program map above.';

-- -------------------------------------------------- admin identity function
--
-- Single source of truth for admin checks. All admin-gated RLS policies
-- call this. The client-side version in the UI is a rendering convenience only.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students
    where user_id = auth.uid() and is_admin = true
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- -------------------------------------------------------- row level security

alter table public.students enable row level security;

-- A student can read their own row.
create policy students_self_read on public.students
  for select using (user_id = auth.uid());

-- An admin can read all rows.
create policy students_admin_read on public.students
  for select using (public.is_admin());

comment on policy students_self_read on public.students is
  'Students see only their own roster entry.';
comment on policy students_admin_read on public.students is
  'Admins see the entire roster.';

-- Writes are service-role only (provisioning script). No write policies.

-- --------------------------------------------------- admin dashboard view
--
-- Aggregates student progress across modules, capstone, and activity.
-- security_invoker = true means RLS on underlying tables still applies,
-- so the view itself runs with the querying user's permissions.
-- The where clause gates this to admins only (defensive: a student querying
-- it gets zero rows back, not an error).

create or replace view public.admin_student_progress
with (security_invoker = true) as
select
  s.student_id,
  s.track_code,
  p.slug                                as program_slug,
  (select count(*) from public.modules m
   where m.program_id = e.program_id)   as modules_total,
  (select count(*) from public.module_progress mp
   where mp.user_id = s.user_id
     and mp.state = 'complete')         as modules_complete,
  cs.overall_score                      as capstone_overall_score,
  (select max(updated_at) from (
     select updated_at from public.module_progress where user_id = s.user_id
     union all
     select updated_at from public.lesson_progress where user_id = s.user_id
   ) as t)                              as last_active
from public.students s
join public.enrollments e on e.user_id = s.user_id
join public.programs p on p.id = e.program_id
left join public.capstone_scorecard cs on cs.user_id = s.user_id
                                       and cs.program_id = e.program_id
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

-- --------------------------------------------------------- grants and cleanup

revoke all on public.students from anon;
grant select on public.students to authenticated;

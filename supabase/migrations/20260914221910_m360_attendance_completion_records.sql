create table public.m360_faculty_authorizations (
  user_id uuid primary key references auth.users(id) on delete restrict,
  can_review boolean not null default false,
  can_finalize boolean not null default false,
  active boolean not null default true,
  authorization_source text not null,
  authorized_by uuid references auth.users(id) on delete set null,
  authorized_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.m360_faculty_authorizations(user_id,can_review,can_finalize,active,authorization_source,authorized_by)
select s.user_id,true,false,true,'legacy_m360_admin_migration',s.user_id
from public.students s where s.is_admin=true;

create table public.m360_attendance_records (
  enrollment_id uuid primary key references public.m360_enrollments(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  course_version text not null references public.m360_course_versions(version_code) on delete restrict,
  scheduled_minutes integer not null check(scheduled_minutes>0),
  attended_minutes integer not null check(attended_minutes>=0),
  approved_equivalency_minutes integer not null default 0 check(approved_equivalency_minutes>=0),
  required_percentage numeric(5,2) not null check(required_percentage between 0 and 100),
  attendance_percentage numeric(5,2) generated always as (
    round((least(scheduled_minutes,attended_minutes+approved_equivalency_minutes)::numeric*100.0)/scheduled_minutes::numeric,2)
  ) stored,
  requirement_met boolean generated always as (
    ((least(scheduled_minutes,attended_minutes+approved_equivalency_minutes)::numeric*100.0)/scheduled_minutes::numeric)>=required_percentage
  ) stored,
  last_date_of_attendance date not null,
  external_source_reference text not null check(length(trim(external_source_reference))>0),
  notes text,
  verified_by uuid not null references auth.users(id) on delete restrict,
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(attended_minutes+approved_equivalency_minutes<=scheduled_minutes)
);

create or replace function public.m360_attendance_binding()
returns trigger language plpgsql security invoker set search_path=''
as $$
declare v_enrollment public.m360_enrollments;
begin
  select * into v_enrollment from public.m360_enrollments where id=new.enrollment_id;
  if not found then raise exception 'M360 enrollment does not exist'; end if;
  if new.user_id is distinct from v_enrollment.user_id then raise exception 'Attendance user does not match enrollment'; end if;
  if new.course_version is distinct from v_enrollment.course_version then raise exception 'Attendance version does not match enrollment'; end if;
  return new;
end $$;
create trigger m360_attendance_binding_trg
before insert or update of enrollment_id,user_id,course_version on public.m360_attendance_records
for each row execute function public.m360_attendance_binding();

create table public.m360_course_completions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references public.m360_enrollments(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  track_code text not null check(public.m360_track_is_eligible(track_code)),
  course_version text not null references public.m360_course_versions(version_code) on delete restrict,
  final_grade numeric(5,2) not null check(final_grade between 0 and 100),
  earned_clock_hours numeric(5,2) not null check(earned_clock_hours>0),
  accepted_week_count integer not null check(accepted_week_count=6),
  attendance_percentage numeric(5,2) not null check(attendance_percentage between 0 and 100),
  attendance_source_reference text not null check(length(trim(attendance_source_reference))>0),
  last_date_of_attendance date not null,
  career_spotlight_status text not null,
  career_spotlight_reference text not null check(length(trim(career_spotlight_reference))>0),
  evidence_snapshot jsonb not null,
  finalized_by uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz not null default now()
);
create index m360_course_completions_user_idx on public.m360_course_completions(user_id,finalized_at desc);

create or replace function public.m360_completion_append_only()
returns trigger language plpgsql security invoker set search_path=''
as $$ begin raise exception 'M360 completion records are immutable'; end $$;
create trigger m360_completion_append_only_trg
before update or delete on public.m360_course_completions
for each row execute function public.m360_completion_append_only();

alter table public.m360_course_versions enable row level security;
alter table public.m360_enrollments enable row level security;
alter table public.m360_faculty_authorizations enable row level security;
alter table public.m360_attendance_records enable row level security;
alter table public.m360_course_completions enable row level security;

revoke all on public.m360_course_versions from anon,authenticated;
grant select on public.m360_course_versions to authenticated;
revoke all on public.m360_enrollments from anon,authenticated;
grant select on public.m360_enrollments to authenticated;
revoke all on public.m360_faculty_authorizations from anon,authenticated;
grant select on public.m360_faculty_authorizations to authenticated;
revoke all on public.m360_attendance_records from anon,authenticated;
grant select on public.m360_attendance_records to authenticated;
revoke all on public.m360_course_completions from anon,authenticated;
grant select on public.m360_course_completions to authenticated;

create policy m360_versions_authenticated_read on public.m360_course_versions for select to authenticated using(true);
create policy m360_enrollments_self_read on public.m360_enrollments for select to authenticated using((select auth.uid())=user_id);
create policy m360_enrollments_admin_read on public.m360_enrollments for select to authenticated using(public.is_admin());
create policy m360_faculty_self_read on public.m360_faculty_authorizations for select to authenticated using((select auth.uid())=user_id);
create policy m360_faculty_admin_read on public.m360_faculty_authorizations for select to authenticated using(public.is_admin());
create policy m360_attendance_self_read on public.m360_attendance_records for select to authenticated using((select auth.uid())=user_id);
create policy m360_attendance_admin_read on public.m360_attendance_records for select to authenticated using(public.is_admin());
create policy m360_completion_self_read on public.m360_course_completions for select to authenticated using((select auth.uid())=user_id);
create policy m360_completion_admin_read on public.m360_course_completions for select to authenticated using(public.is_admin());

revoke execute on function public.m360_enrollment_version_immutable() from public,anon,authenticated;
revoke execute on function public.m360_attendance_binding() from public,anon,authenticated;
revoke execute on function public.m360_completion_append_only() from public,anon,authenticated;

create table public.m360_course_versions (
  version_code text primary key,
  course_code text not null default 'M360-101',
  course_title text not null,
  clock_minutes integer not null check (clock_minutes > 0),
  minimum_grade numeric(5,2) not null check (minimum_grade between 0 and 100),
  minimum_attendance_percent numeric(5,2) not null check (minimum_attendance_percent between 0 and 100),
  effective_from date not null,
  effective_to date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

insert into public.m360_course_versions(version_code,course_code,course_title,clock_minutes,minimum_grade,minimum_attendance_percent,effective_from,is_active)
values ('2026-11-mvp','M360-101','M360 101 Career Readiness',720,70.00,80.00,date '2026-11-02',true);

create unique index m360_course_versions_one_active_idx on public.m360_course_versions ((is_active)) where is_active=true;

create table public.m360_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  cohort_id uuid references public.cohorts(id) on delete restrict,
  track_code text not null check (public.m360_track_is_eligible(track_code)),
  course_version text not null references public.m360_course_versions(version_code) on delete restrict,
  status text not null default 'active' check (status in ('active','completed','withdrawn')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status='completed' and completed_at is not null) or status<>'completed')
);

create unique index m360_enrollments_one_active_user_idx on public.m360_enrollments(user_id) where status='active';
create index m360_enrollments_user_history_idx on public.m360_enrollments(user_id,enrolled_at desc);
create index m360_enrollments_cohort_idx on public.m360_enrollments(cohort_id,status);

insert into public.m360_enrollments(user_id,cohort_id,track_code,course_version,status,enrolled_at)
select c.user_id,s.cohort_id,c.track_code,c.course_version,'active',coalesce(s.enrollment_date,c.created_at,now())
from public.m360_course_records c join public.students s on s.user_id=c.user_id;

alter table public.m360_course_records add column enrollment_id uuid;
alter table public.m360_week_records add column enrollment_id uuid;
alter table public.m360_week_records add column course_version text;
alter table public.m360_week_submissions add column enrollment_id uuid;
alter table public.m360_week_submissions add column course_version text;

update public.m360_course_records c set enrollment_id=e.id,course_version=e.course_version
from public.m360_enrollments e where e.user_id=c.user_id and e.status='active';
update public.m360_week_records w set enrollment_id=e.id,course_version=e.course_version
from public.m360_enrollments e where e.user_id=w.user_id and e.status='active';
update public.m360_week_submissions s set enrollment_id=e.id,course_version=e.course_version
from public.m360_enrollments e where e.user_id=s.user_id and e.status='active';

alter table public.m360_course_records alter column enrollment_id set not null;
alter table public.m360_week_records alter column enrollment_id set not null;
alter table public.m360_week_records alter column course_version set not null;
alter table public.m360_week_submissions alter column enrollment_id set not null;
alter table public.m360_week_submissions alter column course_version set not null;

alter table public.m360_course_records add constraint m360_course_records_enrollment_id_fkey foreign key(enrollment_id) references public.m360_enrollments(id) on delete restrict;
alter table public.m360_course_records add constraint m360_course_records_course_version_fkey foreign key(course_version) references public.m360_course_versions(version_code) on delete restrict;
alter table public.m360_week_records add constraint m360_week_records_enrollment_id_fkey foreign key(enrollment_id) references public.m360_enrollments(id) on delete restrict;
alter table public.m360_week_records add constraint m360_week_records_course_version_fkey foreign key(course_version) references public.m360_course_versions(version_code) on delete restrict;
alter table public.m360_week_submissions add constraint m360_week_submissions_enrollment_id_fkey foreign key(enrollment_id) references public.m360_enrollments(id) on delete restrict;
alter table public.m360_week_submissions add constraint m360_week_submissions_course_version_fkey foreign key(course_version) references public.m360_course_versions(version_code) on delete restrict;

create or replace function public.m360_enrollment_version_immutable() returns trigger
language plpgsql security invoker set search_path=''
as $$ begin
  if new.course_version is distinct from old.course_version then
    raise exception 'M360 enrollment course version is immutable';
  end if;
  return new;
end $$;

create trigger m360_enrollment_version_immutable_trg
before update of course_version on public.m360_enrollments
for each row execute function public.m360_enrollment_version_immutable();

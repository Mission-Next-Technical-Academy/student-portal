-- Mission Next Academy — approved fixed-credit clock-hour model (Decision 2,
-- Option 1). This migration is deliberately LOCAL-ONLY until an authorized
-- operator reviews and applies it with the rest of the reporting migrations.
--
-- This is not a duration tracker: no browser-open time, idle time, or
-- last_active timestamp is treated as attendance. A learner receives the
-- fixed credit assigned to a technical SOC module only when that module is
-- recorded complete. The award captures the approved allocation at that time
-- so later curriculum edits cannot silently rewrite a historical record.

create table if not exists public.program_course_hours (
  track_code        text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  course_key        text not null,
  course_title      text not null,
  credit_minutes    integer not null check (credit_minutes > 0),
  classification    text not null check (classification in ('technical', 'career_readiness')),
  curriculum_revision text not null,
  active            boolean not null default true,
  primary key (track_code, course_key, curriculum_revision)
);

comment on table public.program_course_hours is
  'Approved fixed-credit allocations. These are curriculum credits, not measured time-on-task or attendance-session events.';

-- The technical SOC modules are the existing approved 70-hour instructional
-- allocation. M360-101 is separately catalogued as the 12-hour companion
-- course so the programme baseline reconciles to 82 hours without assigning
-- its career-readiness hours to a SOC technical module.
insert into public.program_course_hours
  (track_code, course_key, course_title, credit_minutes, classification, curriculum_revision)
values
  ('SOCAN', 'soc-01', 'SOC Operations Foundations', 480, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-02', 'Network, Identity & Security Foundations', 660, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-03', 'SIEM & Log Analysis', 465, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-04', 'Detection Rules, Threat Intelligence & Automated Monitoring', 300, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-05', 'Endpoint & Malware Investigation', 270, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-06', 'Threat Hunting & Investigation', 165, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-07', 'Network & Email Analysis', 600, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-08', 'Vulnerability Findings & SOC Prioritization', 405, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-09', 'Incident Response', 150, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-10', 'Incident Evidence Handling, Chain of Custody & Case Documentation', 270, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-11', 'SOC Operations, Metrics, Reporting & Communication', 195, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'soc-12', 'SOC Analyst Capstone', 240, 'technical', '2026-08-28-developer-map-v1'),
  ('SOCAN', 'm360-101', 'M360 Career Readiness Companion', 720, 'career_readiness', '2026-08-28-developer-map-v1')
on conflict (track_code, course_key, curriculum_revision) do update
set course_title = excluded.course_title,
    credit_minutes = excluded.credit_minutes,
    classification = excluded.classification,
    active = true;

create table if not exists public.student_course_hour_awards (
  id                           uuid primary key default gen_random_uuid(),
  user_id                      uuid not null references auth.users(id) on delete restrict,
  track_code                   text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  course_key                   text not null,
  course_title_snapshot        text not null,
  credit_minutes               integer not null check (credit_minutes > 0),
  classification               text not null check (classification in ('technical', 'career_readiness')),
  curriculum_revision          text not null,
  source_module_completed_at   timestamptz,
  awarded_at                   timestamptz not null default now(),
  unique (user_id, track_code, course_key, curriculum_revision)
);

comment on table public.student_course_hour_awards is
  'Immutable fixed-credit awards created when a module is complete. It intentionally records neither tab-open time nor an inferred attendance duration.';

alter table public.program_course_hours enable row level security;
alter table public.student_course_hour_awards enable row level security;

create policy program_course_hours_authenticated_read on public.program_course_hours
  for select using (auth.role() = 'authenticated');
create policy student_course_hour_awards_self_read on public.student_course_hour_awards
  for select using (user_id = auth.uid());
create policy student_course_hour_awards_admin_read on public.student_course_hour_awards
  for select using (public.is_admin());

grant select on public.program_course_hours, public.student_course_hour_awards to authenticated;

create or replace function public.award_fixed_module_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allocation public.program_course_hours%rowtype;
begin
  -- Only a complete module earns a fixed credit. An in-progress module is
  -- "attempted" in reporting calculations, but it is not an award yet.
  if new.state <> 'complete' then
    return new;
  end if;

  select * into allocation
  from public.program_course_hours
  where track_code = new.track_code
    and course_key = new.module_key
    and active = true
  order by curriculum_revision desc
  limit 1;

  if not found then
    -- Other tracks do not yet have approved fixed-credit allocations. Do not
    -- manufacture hours or block their ordinary progress write.
    return new;
  end if;

  insert into public.student_course_hour_awards (
    user_id, track_code, course_key, course_title_snapshot, credit_minutes,
    classification, curriculum_revision, source_module_completed_at, awarded_at
  ) values (
    new.user_id, new.track_code, allocation.course_key, allocation.course_title,
    allocation.credit_minutes, allocation.classification, allocation.curriculum_revision,
    new.completed_at, coalesce(new.completed_at, now())
  ) on conflict (user_id, track_code, course_key, curriculum_revision) do nothing;

  return new;
end;
$$;

drop trigger if exists module_progress_award_fixed_credit on public.module_progress;
create trigger module_progress_award_fixed_credit
  after insert or update of state, completed_at on public.module_progress
  for each row
  when (new.state = 'complete')
  execute function public.award_fixed_module_credit();

-- Preserve records for students who completed modules before this feature was
-- introduced. The completion timestamp is kept where known; the award time
-- is migration time, which accurately indicates when this historical credit
-- record was created rather than pretending it was recorded earlier.
insert into public.student_course_hour_awards (
  user_id, track_code, course_key, course_title_snapshot, credit_minutes,
  classification, curriculum_revision, source_module_completed_at
)
select
  mp.user_id, mp.track_code, pch.course_key, pch.course_title, pch.credit_minutes,
  pch.classification, pch.curriculum_revision, mp.completed_at
from public.module_progress mp
join public.program_course_hours pch
  on pch.track_code = mp.track_code
 and pch.course_key = mp.module_key
 and pch.active = true
where mp.state = 'complete'
on conflict (user_id, track_code, course_key, curriculum_revision) do nothing;

create or replace view public.student_hour_reconciliation
with (security_invoker = true) as
select
  s.user_id,
  s.track_code,
  coalesce(sum(a.credit_minutes) filter (where a.classification = 'technical'), 0) as credited_technical_minutes,
  coalesce(sum(a.credit_minutes) filter (where a.classification = 'career_readiness'), 0) as credited_career_minutes,
  coalesce(sum(a.credit_minutes), 0) as credited_program_minutes
from public.students s
left join public.student_course_hour_awards a
  on a.user_id = s.user_id and a.track_code = s.track_code
group by s.user_id, s.track_code;

grant select on public.student_hour_reconciliation to authenticated;

-- Baseline reconciliation: 4,200 technical minutes plus 720 separately
-- catalogued career-readiness minutes equals the approved 4,920-minute / 82h
-- programme. M360 completion remains browser-local today and therefore is
-- never represented as a durable award by this migration.

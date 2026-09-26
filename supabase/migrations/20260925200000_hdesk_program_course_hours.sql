-- Mission Next Technical Academy — IT Help Desk (HDESK) fixed-credit hours.
--
-- WHY: public.program_course_hours only had SOCAN rows, so completing an
-- IT Help Desk module awarded no clock hours. award_fixed_module_credit()
-- (20260829130000_fixed_credit_hours.sql) looks up
--   program_course_hours.course_key = module_progress.module_key
-- for the student's track, and silently skips tracks with no rows.
--
-- WHAT: adds the approved 72-hour ITHD-101 allocation:
--   * 12 technical modules, its-01 .. its-12 = 3,600 minutes (60.0 hrs)
--   * M360-101 Career Readiness Core            =   720 minutes (12.0 hrs)
--   Total                                        = 4,320 minutes (72.0 hrs)
--
-- SOURCES (all agree):
--   * MNT_HelpDesk_Parent_Course_Hour_Mapping_ALL_12_MODULES — per-module
--     totals; 60.0 approved / 60.0 built across ITHD-101.1 .. 101.9
--   * ITHD-101 Course Syllabus / Program Outline — 72 clock hours
--     (60 technical + 12 Career Readiness Core)
--   * portal/data.js — creditMinutes for its-01 .. its-12
--   Course titles match portal/data.js (what students see).
--
-- This is a NEW migration on purpose. Applied migrations are history and are
-- never edited; 20260829130000_fixed_credit_hours.sql stays as it is.
--
-- Safe to re-run: the upsert and the backfill are both idempotent.

insert into public.program_course_hours
  (track_code, course_key, course_title, credit_minutes, classification, curriculum_revision)
values
  ('HDESK', 'its-01', 'IT Support Fundamentals & Service Desk Operations', 180, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-02', 'Building Your Lab Environment & Supporting Hardware, Devices & Peripherals', 660, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-03', 'Windows Operating System Support', 180, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-04', 'Networking Fundamentals for Support', 480, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-05', 'Windows Server & Active Directory Administration', 720, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-06', 'Identity, Accounts & Access Management', 360, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-07', 'Software, Applications & Endpoint Management', 120, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-08', 'Troubleshooting Methodology & Diagnostics', 120, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-09', 'Security Fundamentals for IT Support', 120, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-10', 'Ticketing, Service Management & SLAs', 210, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-11', 'Customer Service, Documentation & Escalation', 210, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'its-12', 'IT Support Capstone', 240, 'technical', '2026-09-25-ithd-hour-map-v1'),
  ('HDESK', 'm360-101', 'M360 Career Readiness Companion', 720, 'career_readiness', '2026-09-25-ithd-hour-map-v1')
on conflict (track_code, course_key, curriculum_revision) do update
set course_title   = excluded.course_title,
    credit_minutes = excluded.credit_minutes,
    classification = excluded.classification,
    active         = true;

-- Guard: fail the whole migration (nothing is applied) if the Help Desk
-- allocation ever stops reconciling to 60 technical + 12 career hours.
do $$
declare
  v_technical integer;
  v_career    integer;
begin
  select coalesce(sum(credit_minutes) filter (where classification = 'technical'), 0),
         coalesce(sum(credit_minutes) filter (where classification = 'career_readiness'), 0)
  into v_technical, v_career
  from public.program_course_hours
  where track_code = 'HDESK'
    and curriculum_revision = '2026-09-25-ithd-hour-map-v1'
    and active = true;

  if v_technical <> 3600 or v_career <> 720 then
    raise exception 'HDESK hours do not reconcile: technical % min (expected 3600), career % min (expected 720)',
      v_technical, v_career;
  end if;
end;
$$;

-- Backfill: award hours for Help Desk modules already marked complete before
-- this migration (today these are test accounts only). Same pattern as the
-- SOC backfill in 20260829130000_fixed_credit_hours.sql, limited to HDESK.
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
where mp.track_code = 'HDESK'
  and mp.state = 'complete'
on conflict (user_id, track_code, course_key, curriculum_revision) do nothing;

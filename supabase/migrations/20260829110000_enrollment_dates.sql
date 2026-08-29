-- Mission Next Academy — enrollment/status dates for CIE reporting.
-- Closes ASSESSMENT_REPORTING_SPEC.md §1 requirement #1's GAP: student
-- status/date fields (enrollment_date, withdrawal_date, scheduled_start_date,
-- completion_date) and a computed academic-status enum, exposed on
-- admin_student_progress.
--
-- Builds on top of 20260829100000_admin_enrollment.sql (students.is_enrolled,
-- students_admin_update policy, admin_student_progress view) — that file is
-- NOT edited here.
--
-- Not applied to the live project by this migration file. Written and
-- reviewed against existing migration idioms only — see the human decision
-- point noted in HANDOFF.md before running `supabase db push`.

-- ---------------------------------------------------------- new columns
--
-- All four nullable: an existing row (e.g. the seeded ADMIN account, or any
-- student who predates this migration) has none of this history yet, and
-- that absence is meaningful (never enrolled/withdrawn/completed), not an
-- error state.

alter table public.students
  add column if not exists enrollment_date       timestamptz,
  add column if not exists withdrawal_date        timestamptz,
  -- Program-planning input, not derived from any activity table — the one
  -- field in this migration with no automatic source. Admin-settable via
  -- direct DB/Supabase access as of this migration; no dashboard input was
  -- built in this pass (portal/app.js still only exposes the enrolled/
  -- disenrolled toggle). See HANDOFF.md for the explicit call-out.
  -- TODO: add an admin-dashboard input for scheduled_start_date once program
  -- planning needs it surfaced in the UI rather than set via the DB directly.
  add column if not exists scheduled_start_date    date,
  -- See the design-decision comment below (near admin_student_progress) for
  -- why this column exists alongside a view-computed completion date.
  add column if not exists completion_date         timestamptz;

comment on column public.students.enrollment_date is
  'Stamped by stamp_enrollment_dates() the first time is_enrolled flips true. Preserved (not overwritten) across later re-enrollments — see trigger comment.';
comment on column public.students.withdrawal_date is
  'Stamped by stamp_enrollment_dates() every time is_enrolled flips false. Overwritten on each withdrawal, so it always reflects the most recent one.';
comment on column public.students.scheduled_start_date is
  'Admin-settable program-planning date. No automatic source and no trigger — see TODO above and HANDOFF.md.';
comment on column public.students.completion_date is
  'Not stamped by any trigger in this migration (completion is a cross-table condition — module_progress reaching 100% — that a students-row trigger should not own; see design note above admin_student_progress below). Exists as a nullable permanence anchor: a future archival step can freeze a value here before module_progress rows might be pruned/archived, per CIE requirement #5 ("must remain available even if archived"). Until such a step exists, this column stays null and admin_student_progress computes completion_date live from module_progress instead.';

-- ------------------------------------------------- enrollment date trigger
--
-- Fires no matter which code path flips is_enrolled (today's
-- updateAdminEnrollmentRemote in portal/app.js, or anything future), instead
-- of relying on the JS layer to remember to stamp dates itself.
--
-- Same-table trigger, only ever touching NEW's own columns — no cross-table
-- access, so (matching public.touch_updated_at()'s plain style rather than
-- handle_new_user()'s security definer + search_path, which that function
-- needs only because it inserts into a different table from an auth-schema
-- trigger) this does not need security definer.

create or replace function public.stamp_enrollment_dates()
returns trigger language plpgsql as $$
begin
  if new.is_enrolled and not old.is_enrolled then
    -- coalesce: a student re-enrolled after a prior withdrawal keeps their
    -- original enrollment_date rather than looking freshly enrolled.
    new.enrollment_date = coalesce(old.enrollment_date, now());
  elsif not new.is_enrolled and old.is_enrolled then
    new.withdrawal_date = now();
  end if;
  return new;
end;
$$;

create trigger students_stamp_enrollment_dates
  before update on public.students
  for each row
  when (old.is_enrolled is distinct from new.is_enrolled)
  execute function public.stamp_enrollment_dates();

-- --------------------------------------------------------------- grants
--
-- Extends 20260829100000_admin_enrollment.sql's `grant update (is_enrolled)`
-- to the columns an admin needs to write directly. The trigger above runs as
-- table owner regardless of grants, but a direct admin write to
-- scheduled_start_date (the one field with no trigger) needs its own grant.
-- completion_date is intentionally NOT included — nothing writes it in this
-- pass (see the column comment above); a future archival job would use a
-- service-role/definer path, not this authenticated-role grant.
-- students_admin_update (from 20260829100000_admin_enrollment.sql) already
-- gates all UPDATEs on public.students to admins only — not repeated here.

grant update (is_enrolled, enrollment_date, withdrawal_date, scheduled_start_date)
  on public.students to authenticated;

-- Read access: students_self_read (20260828120000_students_admin.sql) already
-- grants a student select on their own full row, and
-- `grant select on public.students to authenticated` already covers columns
-- at the grant level — so the four new columns are already student-readable
-- via their own row with no additional policy or grant needed here. Verified
-- against 20260828120000_students_admin.sql before writing this migration.

-- ------------------------------------------------- admin_student_progress
--
-- Rebuilt (create or replace view — table/column-level dependents unaffected)
-- to surface the new date columns and a computed `status`.
--
-- completion_date design decision: computed live here as
-- coalesce(s.completion_date, <derived from module_progress>) rather than
-- trusting a stored/trigger-maintained value, since "complete" genuinely
-- depends on module_progress reaching 100% of that student's 12 modules —
-- a cross-table condition a students-row trigger has no reliable way to
-- recompute (it would need to run on every module_progress write instead,
-- adding trigger surface to a much hotter table for a value this view can
-- derive cheaply at read time). s.completion_date is honored first only as
-- the future permanence-anchor path described in the column comment above;
-- today it is always null, so this always falls through to the derived
-- value.
--
-- status precedence: 'completed' is checked first per the task's own
-- guidance ("completed should probably outrank active/withdrawn once
-- true") — a student who finishes all modules and is later marked
-- disenrolled (e.g. access revoked post-graduation) should still report as
-- completed, not withdrawn.

create or replace view public.admin_student_progress
with (security_invoker = true) as
select
  s.student_id,
  s.track_code,
  case s.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end                                    as program_slug,
  coalesce(cp.modules_total, 12)         as modules_total,
  coalesce(cp.modules_complete, 0)       as modules_complete,
  coalesce(cp.percent_complete, 0)       as percent_complete,
  cs.overall_score                       as capstone_overall_score,
  cp.last_active                         as last_active,
  coalesce(cp.modules_in_progress, 0)    as modules_in_progress,
  s.is_enrolled                          as is_enrolled,
  s.enrollment_date                      as enrollment_date,
  s.withdrawal_date                      as withdrawal_date,
  s.scheduled_start_date                 as scheduled_start_date,
  coalesce(
    s.completion_date,
    case when coalesce(cp.percent_complete, 0) >= 100 then (
      select max(mp.completed_at)
      from public.module_progress mp
      where mp.user_id = s.user_id
        and mp.track_code = s.track_code
    ) else null end
  )                                      as completion_date,
  case
    when coalesce(cp.percent_complete, 0) >= 100 then 'completed'
    when not s.is_enrolled and s.enrollment_date is not null then 'withdrawn'
    when s.is_enrolled then 'active'
    else 'not_yet_started'
  end                                    as status
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

-- Mission Next Technical Academy — completion-triggered reporting snapshot.
--
-- Closes the gap `20260829110000_enrollment_dates.sql` left open on
-- students.completion_date ("a future archival step can freeze a value here
-- before module_progress rows might be pruned/archived, per CIE requirement
-- #5"). This migration IS that archival step: the moment a student's last
-- remaining module for their track transitions to state = 'complete', a
-- trigger (a) stamps students.completion_date and (b) freezes a full
-- per-student reporting record into a new append-only table, so later
-- curriculum edits, track-content renames, or table pruning can never
-- silently change a historical export (ASSESSMENT_REPORTING_SPEC.md §5.2,
-- "no versioning/freezing mechanism").
--
-- This migration is additive only — no existing table is altered except
-- admin_student_progress, which per this repo's established rule
-- (CREATE OR REPLACE VIEW only permits appending columns at the end) gets
-- three columns appended after user_id; nothing already there changes name,
-- type, or position.
--
-- Applied and confirmed live on the linked remote project as of 2026-09-01
-- (`supabase migration list --linked` shows Local/Remote matched at this
-- timestamp; completion_reporting_snapshots table, its trigger, and the
-- three appended admin_student_progress columns were all verified present
-- via direct query). This file itself was left untracked in git by whoever
-- ran the push — committed now so the repo's history matches what's
-- actually live, per this repo's migration-sync convention (verify with
-- `supabase migration list --linked`, never trust a handoff doc's push
-- status claim).

-- ---------------------------------------------------- reporting snapshot

create table if not exists public.completion_reporting_snapshots (
  id                                uuid primary key default gen_random_uuid(),
  user_id                           uuid not null references auth.users(id) on delete restrict,
  student_id                        text not null,
  enrollment_period_id              uuid not null references public.enrollment_periods(id) on delete restrict,
  track_code                        text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  program_slug                      text,

  -- ---- Req #1 (student-to-program linkage) / #6 (Form 801 linkage) ----
  program_version_id                uuid references public.program_versions(id) on delete restrict,
  program_version_code              text,
  program_name                      text,
  credential_code                   text,
  credential_name                   text,
  enrollment_date                   timestamptz,
  scheduled_start_date              date,
  scheduled_completion_date         date,
  completion_date                   timestamptz not null default now(),
  -- Only a synthetic login/training identifier exists anywhere in this
  -- system (students.student_id, e.g. "4957361987-SOCAN") — there is no
  -- verified legal name or documented lawful substitute integrated yet.
  -- Column kept (rather than omitted) so the gap is queryable, not silent.
  student_legal_name                text,

  -- ---- Req #2 (clock hours) — credited fixed-curriculum minutes ----
  -- From student_hour_reconciliation (20260829130000_fixed_credit_hours.sql):
  -- these are approved curriculum-credit allocations awarded on module
  -- completion, never inferred attendance/session/browser-open time.
  credited_technical_minutes        integer,
  credited_career_minutes           integer,
  credited_program_minutes          integer,

  -- ---- Req #3 (grades, assessments, progress) ----
  modules_total                     integer not null default 12,
  modules_complete                  integer not null,
  percent_complete                  numeric(5,1) not null,
  -- Per-module completion snapshot: [{module_key, state, percent,
  -- started_at, completed_at}, ...] frozen from module_progress.
  module_progress_snapshot          jsonb not null default '[]'::jsonb,
  -- Per-assessment (lab) result snapshot: [{lab_key, best_score,
  -- attempts_count, ever_passed, last_completed_at}, ...] frozen from
  -- lab_attempts — "assessment results" per CIE requirement #3.
  lab_attempts_snapshot             jsonb not null default '[]'::jsonb,
  capstone_overall_score            numeric(5,2),
  -- Frozen capstone_scorecard row (per-domain breakdown), minus its own
  -- user_id/track_code keys.
  capstone_domain_scores            jsonb,
  capstone_critical_error_gate_passed boolean,
  -- The uniform grade scale is documented (ASSESSMENT_REPORTING_SPEC.md §2)
  -- but, per that spec's own gap note, not stored anywhere as queryable
  -- data outside code constants — frozen here as a human-readable value so
  -- at least this record satisfies "a grade scale exists and is recorded."
  grade_scale                       text not null default
    '70/100 passing threshold per module. Modules 1-11: module-specific 4-category rubric (Observation/Analysis/Decision/Communication). Module 12 (capstone): 10 scored domains at 10 points each, 70% (7/10) AND zero critical errors required — see ASSESSMENT_REPORTING_SPEC.md section 2.',
  -- Neither exists anywhere in this system today: lab_attempts and
  -- capstone_submissions carry nullable rubric_version/scoring_engine_version
  -- columns (20260829120000_assessment_review_and_artifacts.sql) but nothing
  -- in the application writes them yet, and there is no grade-correction or
  -- override event log at all. Left null rather than fabricated; kept as
  -- columns so the gap stays queryable instead of silent.
  rubric_scoring_engine_version_note text,
  grade_correction_override_trail   jsonb,

  -- ---- Req #4 (labs and competency outcomes) — capstone evaluator ----
  capstone_reviewed_by              uuid references auth.users(id) on delete set null,
  capstone_reviewed_at              timestamptz,
  capstone_review_outcome           text,
  capstone_supervision_method       text,

  -- ---- Req #6 (Form 801 annual reporting) ----
  credential_award_status           text,
  credential_awarded_at             timestamptz,
  geography_classification          text,

  created_at                        timestamptz not null default now(),

  unique (enrollment_period_id)
);

comment on table public.completion_reporting_snapshots is
  'Append-only, frozen-at-completion reporting record — one row per completed enrollment episode, written once by record_completion_reporting_snapshot() and never updated afterward. Exists so per-student CIE reporting stats survive later curriculum edits, track renames, or upstream table pruning. See Reportingrequirements.txt for the 7 CIE minimum categories this freezes data against.';
comment on column public.completion_reporting_snapshots.student_legal_name is
  'Always null today: only the synthetic student_id login identifier exists anywhere in this system, not a verified legal name or documented lawful substitute (ASSESSMENT_REPORTING_SPEC.md item 3, ''Add the approved student identity source'').';
comment on column public.completion_reporting_snapshots.credited_technical_minutes is
  'Fixed curriculum-credit minutes awarded on module completion (student_hour_reconciliation). Not measured attendance, session duration, or browser-open time — see program_course_hours table comment.';

create index if not exists completion_reporting_snapshots_user_idx
  on public.completion_reporting_snapshots (user_id, completion_date desc);
create index if not exists completion_reporting_snapshots_track_idx
  on public.completion_reporting_snapshots (track_code, completion_date desc);

alter table public.completion_reporting_snapshots enable row level security;

create policy completion_reporting_snapshots_self_read on public.completion_reporting_snapshots
  for select using (user_id = auth.uid());
create policy completion_reporting_snapshots_admin_read on public.completion_reporting_snapshots
  for select using (public.is_admin());

-- No insert/update policy for authenticated: only the security-definer
-- trigger function below writes this table, the same pattern
-- record_enrollment_period_transition() already established for
-- enrollment_periods.
grant select on public.completion_reporting_snapshots to authenticated;

-- --------------------------------------------------------- the trigger

create or replace function public.record_completion_reporting_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modules_complete   integer;
  v_student_id         text;
  v_program_slug       text;
  v_ep_id              uuid;
  v_enrolled_at        timestamptz;
  v_sched_start        date;
  v_sched_completion   date;
  v_pv_id              uuid;
  v_pv_version_code    text;
  v_pv_program_name    text;
  v_pv_credential_code text;
  v_pv_credential_name text;
  v_geo                text;
  v_award_status       text;
  v_awarded_at         timestamptz;
  v_tech_minutes       integer;
  v_career_minutes     integer;
  v_program_minutes    integer;
  v_module_snapshot    jsonb;
  v_lab_snapshot       jsonb;
  v_capstone_score     numeric(5,2);
  v_capstone_domains   jsonb;
  v_capstone_gate      boolean;
  v_review_status      text;
  v_review_outcome     text;
  v_review_by          uuid;
  v_review_at          timestamptz;
  v_supervision_method text;
begin
  -- Only fires for a genuine, fully-complete track (12/12 modules) — the
  -- same modules_total constant course_progress/admin_student_progress
  -- already assume everywhere in this schema (every track has exactly 12
  -- modules, module 12 always the capstone).
  select count(*) filter (where state = 'complete')
  into v_modules_complete
  from public.module_progress
  where user_id = new.user_id and track_code = new.track_code;

  if v_modules_complete < 12 then
    return new;
  end if;

  -- Freeze students.completion_date the first time this fires — the
  -- "future archival step" 20260829110000_enrollment_dates.sql's column
  -- comment anticipated. coalesce so a later re-fire (e.g. a completed_at
  -- touch on an already-complete module) never overwrites an earlier value.
  update public.students
  set completion_date = coalesce(completion_date, now())
  where user_id = new.user_id;

  select student_id into v_student_id from public.students where user_id = new.user_id;

  v_program_slug := case new.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end;

  -- Most recent enrollment episode for this track — mirrors the lateral
  -- lookup admin_student_progress already uses (order by enrolled_at desc
  -- limit 1), not filtered to withdrawn_at is null, since a student who
  -- completes and is disenrolled moments later should still resolve to the
  -- episode they completed under.
  select ep.id, ep.enrolled_at, ep.scheduled_start_date, ep.scheduled_completion_date,
         pv.id, pv.version_code, pv.program_name, pv.credential_code, pv.credential_name
  into v_ep_id, v_enrolled_at, v_sched_start, v_sched_completion,
       v_pv_id, v_pv_version_code, v_pv_program_name, v_pv_credential_code, v_pv_credential_name
  from public.enrollment_periods ep
  left join public.program_versions pv on pv.id = ep.program_version_id
  where ep.user_id = new.user_id and ep.track_code = new.track_code
  order by ep.enrolled_at desc
  limit 1;

  -- No enrollment episode to attribute this completion to (e.g. a legacy
  -- account that predates 20260829125000's backfill and never got one) —
  -- students.completion_date is still stamped above, but a snapshot row
  -- requires the episode this table's unique constraint keys off.
  if v_ep_id is null then
    return new;
  end if;

  select classification into v_geo
  from public.student_geography_classifications
  where user_id = new.user_id
  order by effective_at desc limit 1;

  select award_status, awarded_at into v_award_status, v_awarded_at
  from public.credential_awards
  where enrollment_period_id = v_ep_id
  order by awarded_at desc, recorded_at desc limit 1;

  select credited_technical_minutes, credited_career_minutes, credited_program_minutes
  into v_tech_minutes, v_career_minutes, v_program_minutes
  from public.student_hour_reconciliation
  where user_id = new.user_id and track_code = new.track_code;

  select coalesce(jsonb_agg(jsonb_build_object(
           'module_key', mp.module_key,
           'state', mp.state,
           'percent', mp.percent,
           'started_at', mp.started_at,
           'completed_at', mp.completed_at
         ) order by mp.module_key), '[]'::jsonb)
  into v_module_snapshot
  from public.module_progress mp
  where mp.user_id = new.user_id and mp.track_code = new.track_code;

  select coalesce(jsonb_agg(jsonb_build_object(
           'lab_key', x.lab_key,
           'best_score', x.best_score,
           'attempts_count', x.attempts_count,
           'ever_passed', x.ever_passed,
           'last_completed_at', x.last_completed_at
         ) order by x.lab_key), '[]'::jsonb)
  into v_lab_snapshot
  from (
    select la.lab_key,
           max(la.score) as best_score,
           count(*) as attempts_count,
           bool_or(la.state = 'complete') as ever_passed,
           max(la.completed_at) as last_completed_at
    from public.lab_attempts la
    where la.user_id = new.user_id and la.track_code = new.track_code
    group by la.lab_key
  ) x;

  select overall_score into v_capstone_score
  from public.capstone_scorecard
  where user_id = new.user_id and track_code = new.track_code;

  select to_jsonb(cs) - 'user_id' - 'track_code' into v_capstone_domains
  from public.capstone_scorecard cs
  where cs.user_id = new.user_id and cs.track_code = new.track_code;

  select bool_and(passed_critical_error_gate) filter (where passed_critical_error_gate is not null)
  into v_capstone_gate
  from public.capstone_submissions
  where user_id = new.user_id and track_code = new.track_code;

  select cr.review_status, cr.official_outcome, cr.reviewed_by, cr.reviewed_at, cr.supervision_method
  into v_review_status, v_review_outcome, v_review_by, v_review_at, v_supervision_method
  from public.capstone_reviews cr
  where cr.user_id = new.user_id and cr.track_code = new.track_code
  order by cr.created_at desc
  limit 1;

  insert into public.completion_reporting_snapshots (
    user_id, student_id, enrollment_period_id, track_code, program_slug,
    program_version_id, program_version_code, program_name, credential_code, credential_name,
    enrollment_date, scheduled_start_date, scheduled_completion_date, completion_date,
    modules_total, modules_complete, percent_complete,
    module_progress_snapshot, lab_attempts_snapshot,
    capstone_overall_score, capstone_domain_scores, capstone_critical_error_gate_passed,
    capstone_reviewed_by, capstone_reviewed_at, capstone_review_outcome, capstone_supervision_method,
    credited_technical_minutes, credited_career_minutes, credited_program_minutes,
    credential_award_status, credential_awarded_at, geography_classification
  ) values (
    new.user_id, v_student_id, v_ep_id, new.track_code, v_program_slug,
    v_pv_id, v_pv_version_code, v_pv_program_name, v_pv_credential_code, v_pv_credential_name,
    v_enrolled_at, v_sched_start, v_sched_completion, now(),
    12, v_modules_complete, round(100.0 * v_modules_complete / 12.0, 1),
    v_module_snapshot, v_lab_snapshot,
    v_capstone_score, v_capstone_domains, v_capstone_gate,
    v_review_by, v_review_at, v_review_outcome, v_supervision_method,
    v_tech_minutes, v_career_minutes, v_program_minutes,
    v_award_status, v_awarded_at, v_geo
  )
  on conflict (enrollment_period_id) do nothing;

  return new;
end;
$$;

drop trigger if exists module_progress_completion_snapshot on public.module_progress;
create trigger module_progress_completion_snapshot
  after insert or update of state, completed_at on public.module_progress
  for each row
  when (new.state = 'complete' and new.track_code <> 'ADMIN')
  execute function public.record_completion_reporting_snapshot();

-- ------------------------------------- admin_student_progress: append-only
-- Same 22 columns as 20260829125000_enrollment_reporting_history.sql's
-- definition, unchanged in name/type/position, plus three appended at the
-- end (CREATE OR REPLACE VIEW's append-only rule — see that file's own
-- comment on why a column can't be inserted in the middle). Lets the cohort
-- PDF's compliance mapper (portal/app.js, clock_hours_attendance) check real
-- per-student credited-minutes presence instead of hardcoding "missing."

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
  end as program_slug,
  coalesce(cp.modules_total, 12) as modules_total,
  coalesce(cp.modules_complete, 0) as modules_complete,
  coalesce(cp.percent_complete, 0) as percent_complete,
  cs.overall_score as capstone_overall_score,
  cp.last_active,
  coalesce(cp.modules_in_progress, 0) as modules_in_progress,
  s.is_enrolled,
  s.enrollment_date,
  s.withdrawal_date,
  coalesce(ep.scheduled_start_date, s.scheduled_start_date) as scheduled_start_date,
  coalesce(
    s.completion_date,
    case when coalesce(cp.percent_complete, 0) >= 100 then (
      select max(mp.completed_at)
      from public.module_progress mp
      where mp.user_id = s.user_id
        and mp.track_code = s.track_code
    ) else null end
  ) as completion_date,
  case
    when award.award_status = 'awarded' then 'credential_awarded'
    when s.completion_date is not null or coalesce(cp.percent_complete, 0) >= 100 then 'completed'
    when not s.is_enrolled and s.enrollment_date is not null then 'withdrawn'
    when s.is_enrolled then 'active'
    else 'not_yet_started'
  end as status,
  ep.scheduled_completion_date,
  ep.id as enrollment_period_id,
  pv.version_code as program_version_code,
  pv.credential_code,
  pv.credential_name,
  geo.classification as geography_classification,
  s.user_id,
  hr.credited_technical_minutes,
  hr.credited_career_minutes,
  hr.credited_program_minutes
from public.students s
left join public.course_progress cp on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs on cs.user_id = s.user_id and cs.track_code = s.track_code
left join lateral (
  select * from public.enrollment_periods p
  where p.user_id = s.user_id and p.track_code = s.track_code
  order by p.enrolled_at desc limit 1
) ep on true
left join public.program_versions pv on pv.id = ep.program_version_id
left join lateral (
  select g.classification from public.student_geography_classifications g
  where g.user_id = s.user_id order by g.effective_at desc limit 1
) geo on true
left join lateral (
  select a.award_status from public.credential_awards a
  where a.enrollment_period_id = ep.id order by a.awarded_at desc, a.recorded_at desc limit 1
) award on true
left join public.student_hour_reconciliation hr
  on hr.user_id = s.user_id and hr.track_code = s.track_code
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

-- Official-grade labs in the completion snapshot: the catalog's letter grade,
-- and the newest attempt's newest decision instead of the best score ever
-- (decided by Megan, 2026-10-31). No other lab's snapshot entry changes.
--
-- Why: the snapshot took the highest official score across attempts and "passed
-- at some point", so a returned attempt's score, or an approval a correction
-- replaced, could speak for the lab.
--
-- Writes no student data. Snapshots are append-only: rows already taken stay as
-- they are, and only later completions use this.
--
-- Added:
--   - public.lab_letter_grade(numeric): Catalog v1.2, A 90-100, B 80-89,
--     C 70-79 (minimum passing), F below 70
-- Changed:
--   - record_completion_reporting_snapshot(): for labs with
--     requires_official_score, best_score and ever_passed come from the newest
--     attempt's newest decision, and the entry adds official_score, letter_grade
--     and official_status. Credited hours are unchanged.
--
-- ROLLBACK:
--   recreate record_completion_reporting_snapshot from 20261030221555;
--   drop function public.lab_letter_grade(numeric);
--
-- Dated 2026-10-31.

create or replace function public.lab_letter_grade(p_score numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_score is null then null
    when p_score >= 90 then 'A'
    when p_score >= 80 then 'B'
    when p_score >= 70 then 'C'
    else 'F'
  end;
$$;
revoke all on function public.lab_letter_grade(numeric) from public, anon;
grant execute on function public.lab_letter_grade(numeric) to authenticated;

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

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'lab_key', x.lab_key,
             'best_score', case when x.requires_official then case when n.passed then n.official_score end else x.best_score end,
             'attempts_count', x.attempts_count,
             'ever_passed', case when x.requires_official then coalesce(n.passed, false) else x.ever_passed end,
             'last_completed_at', x.last_completed_at
           )
           -- Official-grade labs only: other labs' entries are unchanged.
           || case when x.requires_official then jsonb_build_object(
                'official_score', case when n.passed then n.official_score end,
                'letter_grade', case
                  when n.passed then public.lab_letter_grade(n.official_score)
                  when mp.admin_override then 'Credit by override'
                  else 'In progress' end,
                'official_status', case
                  when n.passed then 'Passed'
                  when mp.admin_override then 'Credit by override'
                  when n.reviewed_at is null then 'Submitted for grading'
                  when n.correction_reason is not null then 'Grade changed, returned'
                  else 'Returned for revision' end
              ) else '{}'::jsonb end
           order by x.lab_key), '[]'::jsonb)
  into v_lab_snapshot
  from (
    select la.lab_key,
           coalesce(bool_or(r.requires_official_score), false) as requires_official,
           max(r.module_key) as module_key,
           max(la.score) as best_score,
           count(*) as attempts_count,
           bool_or(la.state = 'complete') as ever_passed,
           max(la.completed_at) as last_completed_at
    from public.lab_attempts la
    left join public.course_module_labs r on r.track_code = la.track_code and r.lab_key = la.lab_key
    where la.user_id = new.user_id and la.track_code = new.track_code
    group by la.lab_key
  ) x
  -- The newest attempt's newest decision is the grade; earlier attempts and
  -- replaced decisions don't count.
  left join lateral (
    select g.official_score, g.correction_reason, la2.reviewed_at,
           coalesce(g.decision = 'approved' and g.official_score >= public.lab_pass_mark() and not la2.redo_requested, false) as passed
    from public.lab_attempts la2
    left join lateral (
      select lg.decision, lg.official_score, lg.correction_reason
      from public.lab_attempt_grades lg
      where lg.lab_attempt_id = la2.id
      order by lg.created_at desc, lg.id desc
      limit 1
    ) g on true
    where la2.user_id = new.user_id and la2.track_code = new.track_code and la2.lab_key = x.lab_key and la2.completed_at is not null
    order by la2.completed_at desc
    limit 1
  ) n on x.requires_official
  left join public.module_progress mp
    on x.requires_official and mp.user_id = new.user_id and mp.track_code = new.track_code and mp.module_key = x.module_key;

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

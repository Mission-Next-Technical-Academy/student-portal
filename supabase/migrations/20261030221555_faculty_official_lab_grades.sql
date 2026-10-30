-- Official faculty grades, Help Desk Module 1's Prove It first.
--
-- Rule (Megan, Oct 13; rubric approved by Randy, Oct 29; L-003): a lab passes
-- only with an official faculty score of at least the pass mark; an empty score
-- never passes; a critical error caps the attempt below the pass mark. A failing
-- attempt is returned, never approved (accepted Oct 21). A return shows the
-- instructor's score if one was entered, and always needs a note (Oct 24).
--
-- Only labs with course_module_labs.requires_official_score = true follow this
-- rule. Today that is one lab, lab-its-01-prove-it. Each new Prove It turns on
-- its own flag. An instructor can't record an official score for any other lab
-- yet, so applying this more widely would lock those modules.
--
-- Added:
--   - public.lab_pass_mark(): the one pass mark for the database. The instructor
--     screen reads it through lab_attempts.pass_threshold.
--   - course_module_labs.requires_official_score (default false)
--   - public.lab_attempt_grades: one row per instructor decision; the newest row
--     of an attempt is its grade, so corrections keep the history. Columns on
--     lab_attempts would be readable by the student: row-level security can't
--     hide a column, and students and instructors share one database role.
--     Nobody writes this table directly. Students read only rows of their own
--     reviewed attempts.
--   - public.record_lab_grade(): saves the grade, the notes and the decision in
--     one transaction. The only way to decide a flagged lab.
-- Changed:
--   - student_verified_module_progress: flagged labs need the NEWEST attempt to
--     hold an approved official grade. Unflagged labs compute what they did.
--   - guard_lab_attempt_write(): refuses direct review writes on flagged labs
--     and blanks a student-supplied score on them. Uses lab_pass_mark().
--   - lab_attempt_feedback_student_read: every track; a student reads notes only
--     once the attempt is reviewed. The portal only asks for reviewed attempts'
--     notes, so students see no change.
--   - record_completion_reporting_snapshot(): flagged labs report the official
--     score and decision. Unflagged labs report what they did.
-- Not changed: every lab_attempts row, module_progress row and hour award. This
-- migration writes no student data. Admin overrides still complete a module.
--
-- ROLLBACK:
--   recreate student_verified_module_progress from 20261030175603;
--   recreate guard_lab_attempt_write from 20261005120000;
--   recreate record_completion_reporting_snapshot from 20260901090000;
--   recreate lab_attempt_feedback_student_read from 20260913120000;
--   drop function public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text);
--   drop table public.lab_attempt_grades;
--   alter table public.course_module_labs drop column requires_official_score;
--   drop function public.lab_pass_mark();
-- Grades recorded before a rollback are lost, so copy the table first. Any
-- attempt approved through record_lab_grade stays reviewed and would then count
-- as passed under the older view.
--
-- Dated 2026-10-30.

-- ------------------------------------------------------------ 1. pass mark
create or replace function public.lab_pass_mark()
returns integer
language sql
immutable
as $$ select 70 $$;

comment on function public.lab_pass_mark() is
  'The pass mark for every lab: 70 passes, 69 does not. Change it here only.';

revoke all on function public.lab_pass_mark() from public, anon;
grant execute on function public.lab_pass_mark() to authenticated;

-- ------------------------------------------------------------ 2. flag
alter table public.course_module_labs
  add column if not exists requires_official_score boolean not null default false;

comment on column public.course_module_labs.requires_official_score is
  'true: this lab passes only with an approved official grade in lab_attempt_grades, decided through record_lab_grade(). false: the older rule (instructor approval, and lab_attempts.score if there is one).';

-- An attempt reviewed before this rule has no grade, so it could never complete
-- the module, while the portal showed it as passed. None can exist if this ships
-- with 20261030175603, as planned. If one does, stop and ask a person: this
-- migration changes no student data.
do $$
begin
  if exists (
    select 1 from public.lab_attempts
    where lab_key = 'lab-its-01-prove-it' and reviewed_at is not null
  ) then
    raise exception 'lab-its-01-prove-it already has reviewed attempts with no official grade. Decide what happens to them before applying this migration.';
  end if;
end;
$$;

update public.course_module_labs
set requires_official_score = true
where track_code = 'HDESK' and lab_key = 'lab-its-01-prove-it';

-- ------------------------------------------------------------ 3. grades
create table if not exists public.lab_attempt_grades (
  id uuid primary key default gen_random_uuid(),
  lab_attempt_id uuid not null references public.lab_attempts(id) on delete cascade,
  decision text not null check (decision in ('approved', 'returned')),
  official_score integer check (official_score between 0 and 100),
  uncapped_total integer check (uncapped_total between 0 and 100),
  competency_scores jsonb not null default '[]'::jsonb check (jsonb_typeof(competency_scores) = 'array'),
  critical_error boolean not null default false,
  critical_error_reason text,
  efficiency_feedback text,
  correction_reason text,
  rubric_version text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (decision <> 'approved' or official_score is not null),
  check (not critical_error or length(btrim(coalesce(critical_error_reason, ''))) > 0)
);

create index if not exists lab_attempt_grades_attempt_idx
  on public.lab_attempt_grades (lab_attempt_id, created_at desc, id desc);

comment on table public.lab_attempt_grades is
  'Official faculty grades. One row per decision, never edited; the newest row of an attempt is its grade. Written only by record_lab_grade(). Students read rows of their own reviewed attempts.';

alter table public.lab_attempt_grades enable row level security;
revoke all on public.lab_attempt_grades from public, anon, authenticated;
grant select on public.lab_attempt_grades to authenticated;

create policy lab_attempt_grades_student_read on public.lab_attempt_grades
  for select to authenticated
  using (exists (
    select 1 from public.lab_attempts la
    where la.id = lab_attempt_grades.lab_attempt_id
      and la.user_id = auth.uid()
      and la.reviewed_at is not null
  ));

create policy lab_attempt_grades_staff_read on public.lab_attempt_grades
  for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.lab_attempts la
    where la.id = lab_attempt_grades.lab_attempt_id
      and public.can_manage_course_messages(la.track_code)
  ));

-- ------------------------------------------------------------ 4. notes
drop policy if exists lab_attempt_feedback_student_read on public.lab_attempt_feedback;
create policy lab_attempt_feedback_student_read on public.lab_attempt_feedback
  for select
  using (
    exists (
      select 1 from public.lab_attempts la
      where la.id = lab_attempt_feedback.lab_attempt_id
        and la.user_id = auth.uid()
        and la.reviewed_at is not null
    )
  );

-- ------------------------------------------------------------ 5. direct writes
create or replace function public.guard_lab_attempt_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Service-role maintenance scripts and pg_cron are not API end users.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A submission is always unreviewed, and the pass mark is the academy's,
    -- not the submitter's.
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.redo_requested := false;
    new.pass_threshold := public.lab_pass_mark();
    -- On a lab with official grades, only faculty's score means anything.
    if exists (
      select 1 from public.course_module_labs r
      where r.track_code = new.track_code and r.lab_key = new.lab_key and r.requires_official_score
    ) then
      new.score := null;
    end if;
    return new;
  end if;

  -- UPDATE (staff only, enforced by RLS): a review is signed by its author.
  if new.reviewed_by is distinct from old.reviewed_by
     and new.reviewed_by is not null
     and new.reviewed_by <> auth.uid() then
    raise exception 'A lab review must be recorded under the reviewing account.';
  end if;
  if new.reviewed_by is not null and new.reviewed_by = new.user_id then
    raise exception 'A learner cannot review their own lab attempt.';
  end if;
  -- current_user is 'authenticated' on a direct API write and the function's
  -- owner inside record_lab_grade() (security definer).
  if current_user = 'authenticated'
     and (new.reviewed_at, new.reviewed_by, new.redo_requested)
         is distinct from (old.reviewed_at, old.reviewed_by, old.redo_requested)
     and exists (
       select 1 from public.course_module_labs r
       where r.track_code = new.track_code and r.lab_key = new.lab_key and r.requires_official_score
     ) then
    raise exception 'This lab needs an official grade. Decide it from its grading sheet.'
      using errcode = 'P0001', hint = 'official_grade_required';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------ 6. recording
-- p_competencies: [] for a return with no score, or every competency as
-- {id, label, points, earned, justification}. The server adds up the total, and
-- anything short of full points needs a justification. The rubric's points live
-- in portal/admin-sheets/hdesk-prove-rubrics.js; here they must total 100.
create or replace function public.record_lab_grade(
  p_attempt_id uuid,
  p_decision text,
  p_competencies jsonb default '[]'::jsonb,
  p_critical_error boolean default false,
  p_critical_reason text default null,
  p_efficiency text default null,
  p_note text default null,
  p_correction_reason text default null,
  p_rubric_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_attempt public.lab_attempts%rowtype;
  v_flagged boolean;
  v_item jsonb;
  v_ids text[] := '{}';
  v_earned numeric;
  v_points numeric;
  v_sum_points integer := 0;
  v_total integer;
  v_score integer;
  v_critical boolean := coalesce(p_critical_error, false);
  v_critical_reason text := nullif(btrim(coalesce(p_critical_reason, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_efficiency text := nullif(btrim(coalesce(p_efficiency, '')), '');
  v_correction text := nullif(btrim(coalesce(p_correction_reason, '')), '');
  v_has_note boolean := false;
  v_grade_id uuid;
begin
  if p_decision is null or p_decision not in ('approved', 'returned') then
    raise exception 'Choose Approve or Return.' using errcode = 'P0001', hint = 'bad_decision';
  end if;
  if p_competencies is null or jsonb_typeof(p_competencies) <> 'array' then
    raise exception 'The rubric scores could not be read.' using errcode = 'P0001', hint = 'bad_competencies';
  end if;

  -- Locked so two instructors deciding at once take turns.
  select * into v_attempt from public.lab_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'This attempt was not found.' using errcode = 'P0001', hint = 'not_found';
  end if;
  if v_caller is null or not (public.is_admin() or public.can_manage_course_messages(v_attempt.track_code)) then
    raise exception 'You do not grade this course.' using errcode = '42501', hint = 'not_course_staff';
  end if;
  if v_attempt.user_id = v_caller then
    raise exception 'A learner cannot review their own lab attempt.' using errcode = '42501', hint = 'own_attempt';
  end if;

  select coalesce(bool_or(r.requires_official_score), false) into v_flagged
  from public.course_module_labs r
  where r.track_code = v_attempt.track_code and r.lab_key = v_attempt.lab_key;
  if not v_flagged then
    raise exception 'This lab does not take an official grade yet.' using errcode = 'P0001', hint = 'not_official_lab';
  end if;

  if v_attempt.completed_at is null or v_attempt.superseded_at is not null
     or exists (
       select 1 from public.lab_attempts newer
       where newer.user_id = v_attempt.user_id
         and newer.lab_key = v_attempt.lab_key
         and newer.completed_at is not null
         and newer.superseded_at is null
         and (newer.completed_at, newer.id) > (v_attempt.completed_at, v_attempt.id)
     ) then
    raise exception 'Only the student''s newest attempt can be decided.' using errcode = 'P0001', hint = 'not_newest';
  end if;
  if v_attempt.reviewed_at is not null and v_correction is null then
    raise exception 'This attempt already has a decision. Say why you are correcting it.' using errcode = 'P0001', hint = 'correction_reason_required';
  end if;

  for v_item in select value from jsonb_array_elements(p_competencies) loop
    if jsonb_typeof(v_item) <> 'object'
       or length(btrim(coalesce(v_item->>'id', ''))) = 0
       or jsonb_typeof(v_item->'points') is distinct from 'number'
       or jsonb_typeof(v_item->'earned') is distinct from 'number' then
      raise exception 'Score every competency, or clear them all to return with no score.' using errcode = 'P0001', hint = 'incomplete_scores';
    end if;
    v_earned := (v_item->>'earned')::numeric;
    v_points := (v_item->>'points')::numeric;
    if v_earned <> trunc(v_earned) or v_points <> trunc(v_points) or v_points <= 0 or v_earned < 0 or v_earned > v_points then
      raise exception 'Each competency takes whole points from 0 to its maximum.' using errcode = 'P0001', hint = 'bad_points';
    end if;
    if (v_item->>'id') = any(v_ids) then
      raise exception 'A competency appears twice.' using errcode = 'P0001', hint = 'bad_competencies';
    end if;
    v_ids := v_ids || (v_item->>'id');
    v_sum_points := v_sum_points + v_points::integer;
    v_total := coalesce(v_total, 0) + v_earned::integer;
    if length(btrim(coalesce(v_item->>'justification', ''))) > 0 then
      v_has_note := true;
    elsif v_earned < v_points then
      raise exception 'Justify any competency below full points.' using errcode = 'P0001', hint = 'justification_required';
    end if;
  end loop;
  if v_total is not null and v_sum_points <> 100 then
    raise exception 'The rubric''s points must total 100.' using errcode = 'P0001', hint = 'bad_competencies';
  end if;

  if v_critical and v_critical_reason is null then
    raise exception 'Give the reason for the critical error.' using errcode = 'P0001', hint = 'critical_reason_required';
  end if;
  -- No scores entered means no score: least() would turn an empty total into the cap.
  v_score := case
    when v_total is null then null
    when v_critical then least(v_total, public.lab_pass_mark() - 1)
    else v_total
  end;

  if p_decision = 'approved' then
    if v_total is null then
      raise exception 'Score every competency before approving.' using errcode = 'P0001', hint = 'incomplete_scores';
    end if;
    if v_critical or v_score < public.lab_pass_mark() then
      raise exception 'An attempt below the pass mark or with a critical error is returned, never approved.' using errcode = 'P0001', hint = 'approve_below_pass';
    end if;
    if v_attempt.state <> 'complete' then
      raise exception 'This attempt was not saved as a finished submission. Return it.' using errcode = 'P0001', hint = 'not_complete_state';
    end if;
  elsif not (v_has_note or v_note is not null or v_critical_reason is not null) then
    raise exception 'Write at least one note so the student knows what to redo and why.' using errcode = 'P0001', hint = 'note_required';
  end if;

  insert into public.lab_attempt_grades (
    lab_attempt_id, decision, official_score, uncapped_total, competency_scores,
    critical_error, critical_error_reason, efficiency_feedback, correction_reason,
    rubric_version, created_by
  ) values (
    v_attempt.id, p_decision, v_score, v_total, p_competencies,
    v_critical, v_critical_reason, v_efficiency, v_correction,
    p_rubric_version, v_caller
  ) returning id into v_grade_id;

  -- Notes go where every student view already reads them.
  insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
  select v_attempt.id, coalesce(nullif(btrim(item->>'label'), ''), item->>'id'), btrim(item->>'justification'), v_caller
  from jsonb_array_elements(p_competencies) item
  where length(btrim(coalesce(item->>'justification', ''))) > 0;
  if v_critical_reason is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Critical error', v_critical_reason, v_caller);
  end if;
  if v_efficiency is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Efficiency', v_efficiency, v_caller);
  end if;
  if v_note is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Overall', v_note, v_caller);
  end if;

  -- Last, so the completion trigger on this update sees the grade.
  update public.lab_attempts
  set reviewed_at = now(), reviewed_by = v_caller, redo_requested = (p_decision = 'returned')
  where id = v_attempt.id;

  return jsonb_build_object('grade_id', v_grade_id, 'decision', p_decision, 'official_score', v_score);
end;
$$;

revoke all on function public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text) from public, anon;
grant execute on function public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text) to authenticated;

-- ------------------------------------------------------------ 7. view
create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select s.user_id, r.track_code, r.module_key,
  coalesce(mp.admin_override, false)
  or (
    bool_and(exists (
      select 1 from public.lab_attempts la
      where la.user_id = s.user_id and la.track_code = r.track_code and la.lab_key = r.lab_key
        and la.state = 'complete'
        and (r.requires_official_score or la.score is null or la.score >= coalesce(la.pass_threshold, public.lab_pass_mark()))
        and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
        -- Instructor approval is the gate for every module (owner rule,
        -- 2026-10-05). Previously this applied to soc-01 only.
        and la.reviewed_at is not null
        and la.reviewed_by is not null
        and la.reviewed_by <> la.user_id
        and la.redo_requested = false
        and (r.lab_key <> 'lab-soc-escalation' or la.result ? 'case_record')
        -- Official-grade labs: the newest attempt, and its newest decision, must
        -- pass. An earlier pass doesn't count once a newer attempt exists.
        and (not r.requires_official_score or (
          not exists (
            select 1 from public.lab_attempts newer
            where newer.user_id = la.user_id and newer.lab_key = la.lab_key
              and newer.completed_at is not null and newer.superseded_at is null
              and (newer.completed_at, newer.id) > (la.completed_at, la.id)
          )
          and coalesce((
            select g.decision = 'approved' and g.official_score >= public.lab_pass_mark() and not g.critical_error
            from public.lab_attempt_grades g
            where g.lab_attempt_id = la.id
            order by g.created_at desc, g.id desc
            limit 1
          ), false)
        ))
    ))
    and (r.module_key <> 'soc-01' or (
      coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
      and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
    ))
  ) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code and r.gates_completion
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

-- ------------------------------------------------------------ 8. records
-- The same function as 20260901090000 apart from the lab snapshot query.
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
    -- A lab that requires an official score reports that score and that
    -- decision; lab_attempts.score and state say nothing about faculty's grade.
    select la.lab_key,
           max(case when r.requires_official_score then g.official_score else la.score end) as best_score,
           count(*) as attempts_count,
           bool_or(case when r.requires_official_score then coalesce(g.decision = 'approved', false) else la.state = 'complete' end) as ever_passed,
           max(la.completed_at) as last_completed_at
    from public.lab_attempts la
    left join public.course_module_labs r on r.track_code = la.track_code and r.lab_key = la.lab_key
    left join lateral (
      select lg.decision, lg.official_score
      from public.lab_attempt_grades lg
      where lg.lab_attempt_id = la.id
      order by lg.created_at desc, lg.id desc
      limit 1
    ) g on true
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

revoke all on function public.guard_lab_attempt_write() from public, anon, authenticated;

-- Mission Next Technical Academy — M360 101 durable course data.
-- Gate 3 production integration.
--
-- ADDITIVE / ISOLATED BOUNDARY:
-- This migration creates only M360-specific objects. It does not alter
-- module_progress, lab_attempts, capstone, technical-course timekeeping,
-- technical completion, or technical reporting.
--
-- ATTENDANCE BOUNDARY:
-- M360 attendance remains documented outside the LMS. The schema stores only
-- the approved staff-confirmed completion bridge; there are intentionally no
-- attendance-minute, clock-hour, browser-time, or session-duration fields.

create table if not exists public.m360_course_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG')),
  course_version text not null default '2026-11-mvp',
  attendance_requirement_met boolean not null default false,
  attendance_verified_by uuid references auth.users(id) on delete set null,
  attendance_verified_at timestamptz,
  attendance_external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (attendance_requirement_met = false and attendance_verified_by is null and attendance_verified_at is null)
    or
    (attendance_requirement_met = true and attendance_verified_by is not null and attendance_verified_at is not null)
  )
);

create table if not exists public.m360_week_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG')),
  week_number integer not null check (week_number between 1 and 6),
  schema_version integer not null default 1 check (schema_version > 0),
  draft_payload jsonb not null default '{}'::jsonb,
  submitted_payload jsonb,
  review_status text not null default 'draft'
    check (review_status in ('draft', 'submitted', 'needs_revision', 'accepted')),
  revision_number integer not null default 0 check (revision_number >= 0),
  rubric_scores jsonb,
  numeric_score numeric(5,2) check (numeric_score is null or numeric_score between 0 and 100),
  reviewer_feedback text,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  accepted_artifact_payload jsonb,
  workbook_version text,
  workbook_url text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_number)
);

create table if not exists public.m360_week_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG')),
  week_number integer not null check (week_number between 1 and 6),
  revision_number integer not null check (revision_number > 0),
  submitted_payload jsonb not null,
  review_status text not null default 'submitted'
    check (review_status in ('submitted', 'needs_revision', 'accepted')),
  rubric_scores jsonb,
  numeric_score numeric(5,2) check (numeric_score is null or numeric_score between 0 and 100),
  reviewer_feedback text,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (user_id, week_number, revision_number)
);

comment on table public.m360_course_records is
  'M360-only course-level state. Attendance detail remains external; only the staff-confirmed requirement bridge is stored here.';
comment on table public.m360_week_records is
  'Current M360 week state. accepted_artifact_payload is the preserved reviewer-approved snapshot used for carry-forward and portfolio assembly.';
comment on table public.m360_week_submissions is
  'Append-only M360 submission revisions. Resubmission creates a new revision instead of replacing prior academic evidence.';

create index if not exists m360_week_records_review_idx
  on public.m360_week_records (review_status, week_number, updated_at desc);
create index if not exists m360_week_submissions_user_idx
  on public.m360_week_submissions (user_id, week_number, revision_number desc);

drop trigger if exists m360_course_records_touch on public.m360_course_records;
create trigger m360_course_records_touch before update on public.m360_course_records
  for each row execute function public.touch_updated_at();

drop trigger if exists m360_week_records_touch on public.m360_week_records;
create trigger m360_week_records_touch before update on public.m360_week_records
  for each row execute function public.touch_updated_at();

create or replace function public.m360_current_student_track()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.track_code
  from public.students s
  where s.user_id = auth.uid()
    and s.is_enrolled = true
    and s.track_code in ('SOCAN', 'HDESK', 'AIENG')
  limit 1;
$$;

create or replace function public.m360_save_draft(
  p_week_number integer,
  p_draft_payload jsonb,
  p_schema_version integer default 1
)
returns public.m360_week_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_row public.m360_week_records;
begin
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_draft_payload is null or jsonb_typeof(p_draft_payload) <> 'object' then
    raise exception 'M360 draft payload must be a JSON object';
  end if;
  if p_schema_version is null or p_schema_version < 1 then raise exception 'Invalid M360 schema version'; end if;

  v_track := public.m360_current_student_track();
  if v_track is null then raise exception 'M360 access is not available for this account'; end if;

  insert into public.m360_course_records (user_id, track_code)
  values (auth.uid(), v_track)
  on conflict (user_id) do update set track_code = excluded.track_code;

  insert into public.m360_week_records (
    user_id, track_code, week_number, schema_version, draft_payload, review_status
  ) values (
    auth.uid(), v_track, p_week_number, p_schema_version, p_draft_payload, 'draft'
  )
  on conflict (user_id, week_number) do update set
    track_code = excluded.track_code,
    schema_version = excluded.schema_version,
    draft_payload = excluded.draft_payload,
    review_status = case
      when public.m360_week_records.review_status = 'accepted' then 'draft'
      else public.m360_week_records.review_status
    end
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.m360_submit_week(
  p_week_number integer,
  p_submitted_payload jsonb,
  p_schema_version integer default 1
)
returns public.m360_week_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_now timestamptz := now();
  v_row public.m360_week_records;
begin
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_submitted_payload is null or jsonb_typeof(p_submitted_payload) <> 'object' then
    raise exception 'M360 submission payload must be a JSON object';
  end if;
  if p_schema_version is null or p_schema_version < 1 then raise exception 'Invalid M360 schema version'; end if;

  v_track := public.m360_current_student_track();
  if v_track is null then raise exception 'M360 access is not available for this account'; end if;

  insert into public.m360_course_records (user_id, track_code)
  values (auth.uid(), v_track)
  on conflict (user_id) do update set track_code = excluded.track_code;

  insert into public.m360_week_records (
    user_id, track_code, week_number, schema_version, draft_payload,
    submitted_payload, review_status, revision_number, submitted_at
  ) values (
    auth.uid(), v_track, p_week_number, p_schema_version, p_submitted_payload,
    p_submitted_payload, 'submitted', 1, v_now
  )
  on conflict (user_id, week_number) do update set
    track_code = excluded.track_code,
    schema_version = excluded.schema_version,
    draft_payload = excluded.draft_payload,
    submitted_payload = excluded.submitted_payload,
    review_status = 'submitted',
    revision_number = public.m360_week_records.revision_number + 1,
    submitted_at = v_now,
    reviewed_at = null,
    reviewer_feedback = null,
    reviewer_user_id = null
  returning * into v_row;

  insert into public.m360_week_submissions (
    user_id, track_code, week_number, revision_number, submitted_payload, submitted_at
  ) values (
    auth.uid(), v_track, p_week_number, v_row.revision_number, p_submitted_payload, v_now
  );

  return v_row;
end;
$$;

create or replace function public.m360_admin_review_week(
  p_user_id uuid,
  p_week_number integer,
  p_decision text,
  p_rubric_scores jsonb,
  p_feedback text default null
)
returns public.m360_week_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.m360_week_records;
  v_clarity numeric;
  v_relevance numeric;
  v_evidence numeric;
  v_application numeric;
  v_prof_comm numeric := 0;
  v_max numeric;
  v_total numeric;
  v_now timestamptz := now();
  v_had_accepted boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_decision not in ('needs_revision', 'accepted') then raise exception 'Invalid M360 review decision'; end if;
  if p_rubric_scores is null or jsonb_typeof(p_rubric_scores) <> 'object' then
    raise exception 'Rubric scores are required';
  end if;

  select * into v_row
  from public.m360_week_records
  where user_id = p_user_id and week_number = p_week_number
  for update;

  if not found or v_row.review_status <> 'submitted' or v_row.submitted_payload is null then
    raise exception 'The selected M360 week does not have a submitted revision awaiting review';
  end if;
  v_had_accepted := v_row.accepted_artifact_payload is not null;

  begin
    v_clarity := nullif(p_rubric_scores->>'clarity', '')::numeric;
    v_relevance := nullif(p_rubric_scores->>'relevance', '')::numeric;
    v_evidence := nullif(p_rubric_scores->>'evidence', '')::numeric;
    v_application := nullif(p_rubric_scores->>'application', '')::numeric;
    if p_week_number = 6 then
      v_prof_comm := nullif(p_rubric_scores->>'professional_communication', '')::numeric;
    end if;
  exception when others then
    raise exception 'Rubric scores must be numeric';
  end;

  if v_clarity is null or v_relevance is null or v_evidence is null or v_application is null
     or (p_week_number = 6 and v_prof_comm is null) then
    raise exception 'All required rubric dimensions must be scored';
  end if;

  v_max := case when p_week_number = 6 then 20 else 25 end;
  if v_clarity < 0 or v_clarity > v_max
     or v_relevance < 0 or v_relevance > v_max
     or v_evidence < 0 or v_evidence > v_max
     or v_application < 0 or v_application > v_max
     or (p_week_number = 6 and (v_prof_comm < 0 or v_prof_comm > v_max)) then
    raise exception 'One or more rubric scores exceed the approved dimension range';
  end if;

  v_total := v_clarity + v_relevance + v_evidence + v_application
    + case when p_week_number = 6 then v_prof_comm else 0 end;

  if p_decision = 'accepted' and v_total < 70 then
    raise exception 'Meets Standard requires a score of at least 70';
  end if;

  update public.m360_week_records set
    review_status = p_decision,
    rubric_scores = case when p_decision = 'accepted' or not v_had_accepted then p_rubric_scores else rubric_scores end,
    numeric_score = case when p_decision = 'accepted' or not v_had_accepted then v_total else numeric_score end,
    reviewer_feedback = p_feedback,
    reviewer_user_id = auth.uid(),
    reviewed_at = v_now,
    accepted_artifact_payload = case when p_decision = 'accepted' then submitted_payload else accepted_artifact_payload end,
    accepted_at = case when p_decision = 'accepted' then v_now else accepted_at end
  where user_id = p_user_id and week_number = p_week_number
  returning * into v_row;

  update public.m360_week_submissions set
    review_status = p_decision,
    rubric_scores = p_rubric_scores,
    numeric_score = v_total,
    reviewer_feedback = p_feedback,
    reviewer_user_id = auth.uid(),
    reviewed_at = v_now
  where user_id = p_user_id
    and week_number = p_week_number
    and revision_number = v_row.revision_number;

  return v_row;
end;
$$;

create or replace function public.m360_admin_set_attendance(
  p_user_id uuid,
  p_requirement_met boolean,
  p_external_reference text default null
)
returns public.m360_course_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track text;
  v_row public.m360_course_records;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  select track_code into v_track
  from public.students
  where user_id = p_user_id
    and is_enrolled = true
    and track_code in ('SOCAN', 'HDESK', 'AIENG');

  if v_track is null then raise exception 'Selected student is not eligible for M360'; end if;

  insert into public.m360_course_records (
    user_id, track_code, attendance_requirement_met,
    attendance_verified_by, attendance_verified_at, attendance_external_reference
  ) values (
    p_user_id, v_track, p_requirement_met,
    case when p_requirement_met then auth.uid() else null end,
    case when p_requirement_met then now() else null end,
    p_external_reference
  )
  on conflict (user_id) do update set
    track_code = excluded.track_code,
    attendance_requirement_met = excluded.attendance_requirement_met,
    attendance_verified_by = excluded.attendance_verified_by,
    attendance_verified_at = excluded.attendance_verified_at,
    attendance_external_reference = excluded.attendance_external_reference
  returning * into v_row;

  return v_row;
end;
$$;

create or replace view public.m360_course_progress
with (security_invoker = true) as
select
  c.user_id,
  c.track_code,
  count(w.week_number) filter (where w.accepted_artifact_payload is not null) as accepted_artifact_count,
  count(w.week_number) filter (
    where w.accepted_artifact_payload is not null and w.numeric_score is not null
  ) as graded_week_count,
  case
    when count(w.week_number) filter (
      where w.accepted_artifact_payload is not null and w.numeric_score is not null
    ) = 6
    then round(avg(w.numeric_score) filter (where w.accepted_artifact_payload is not null), 2)
    else null
  end as final_grade,
  coalesce(bool_or(w.week_number = 6 and w.accepted_artifact_payload is not null), false) as career_spotlight_complete,
  c.attendance_requirement_met,
  c.attendance_verified_by,
  c.attendance_verified_at,
  c.attendance_external_reference,
  (
    count(w.week_number) filter (where w.accepted_artifact_payload is not null) = 6
    and count(w.week_number) filter (
      where w.accepted_artifact_payload is not null and w.numeric_score is not null
    ) = 6
    and avg(w.numeric_score) filter (where w.accepted_artifact_payload is not null) >= 70
    and coalesce(bool_or(w.week_number = 6 and w.accepted_artifact_payload is not null), false)
    and c.attendance_requirement_met = true
  ) as course_complete
from public.m360_course_records c
left join public.m360_week_records w on w.user_id = c.user_id
group by c.user_id, c.track_code, c.attendance_requirement_met,
         c.attendance_verified_by, c.attendance_verified_at, c.attendance_external_reference;

alter table public.m360_course_records enable row level security;
alter table public.m360_week_records enable row level security;
alter table public.m360_week_submissions enable row level security;

create policy m360_course_self_read on public.m360_course_records
  for select using (user_id = auth.uid());
create policy m360_course_admin_read on public.m360_course_records
  for select using (public.is_admin());
create policy m360_week_self_read on public.m360_week_records
  for select using (user_id = auth.uid());
create policy m360_week_admin_read on public.m360_week_records
  for select using (public.is_admin());
create policy m360_submission_self_read on public.m360_week_submissions
  for select using (user_id = auth.uid());
create policy m360_submission_admin_read on public.m360_week_submissions
  for select using (public.is_admin());

revoke all on public.m360_course_records from anon;
revoke all on public.m360_week_records from anon;
revoke all on public.m360_week_submissions from anon;
grant select on public.m360_course_records to authenticated;
grant select on public.m360_week_records to authenticated;
grant select on public.m360_week_submissions to authenticated;
grant select on public.m360_course_progress to authenticated;

revoke all on function public.m360_current_student_track() from public;
revoke all on function public.m360_save_draft(integer, jsonb, integer) from public;
revoke all on function public.m360_submit_week(integer, jsonb, integer) from public;
revoke all on function public.m360_admin_review_week(uuid, integer, text, jsonb, text) from public;
revoke all on function public.m360_admin_set_attendance(uuid, boolean, text) from public;
grant execute on function public.m360_current_student_track() to authenticated;
grant execute on function public.m360_save_draft(integer, jsonb, integer) to authenticated;
grant execute on function public.m360_submit_week(integer, jsonb, integer) to authenticated;
grant execute on function public.m360_admin_review_week(uuid, integer, text, jsonb, text) to authenticated;
grant execute on function public.m360_admin_set_attendance(uuid, boolean, text) to authenticated;

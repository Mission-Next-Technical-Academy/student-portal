create or replace function public.m360_enforce_enrollment_binding()
returns trigger language plpgsql security invoker set search_path=''
as $$
declare v_enrollment public.m360_enrollments;
begin
  select * into v_enrollment from public.m360_enrollments where id=new.enrollment_id;
  if not found then raise exception 'M360 enrollment does not exist'; end if;
  if new.user_id is distinct from v_enrollment.user_id then raise exception 'M360 academic record user does not match enrollment'; end if;
  if new.track_code is distinct from v_enrollment.track_code then raise exception 'M360 academic record track does not match enrollment'; end if;
  if new.course_version is distinct from v_enrollment.course_version then raise exception 'M360 academic record version does not match enrollment'; end if;
  return new;
end $$;

create trigger m360_course_records_binding_trg before insert or update of enrollment_id,user_id,track_code,course_version on public.m360_course_records for each row execute function public.m360_enforce_enrollment_binding();
create trigger m360_week_records_binding_trg before insert or update of enrollment_id,user_id,track_code,course_version on public.m360_week_records for each row execute function public.m360_enforce_enrollment_binding();
create trigger m360_week_submissions_binding_trg before insert or update of enrollment_id,user_id,track_code,course_version on public.m360_week_submissions for each row execute function public.m360_enforce_enrollment_binding();

create or replace function public.m360_require_active_enrollment(p_user_id uuid,p_track_code text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  select id into v_id from public.m360_enrollments
  where user_id=p_user_id and status='active' and track_code=p_track_code
  order by enrolled_at desc limit 1;
  if v_id is null then raise exception 'Active M360 enrollment is required'; end if;
  return v_id;
end $$;

create or replace function public.m360_current_student_track()
returns text language sql stable security invoker set search_path=''
as $$
  select s.track_code from public.students s
  where s.user_id=auth.uid() and s.is_enrolled=true and public.m360_track_is_eligible(s.track_code)
  limit 1;
$$;

create or replace function public.m360_save_start_here(p_payload jsonb,p_complete boolean default false,p_acknowledgments_complete boolean default false,p_support_flag boolean default false)
returns public.m360_course_records language plpgsql security definer set search_path=''
as $$
declare v_track text; v_enrollment_id uuid; v_version text; v_row public.m360_course_records; v_now timestamptz:=now();
begin
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'M360 Start Here payload must be a JSON object'; end if;
  if p_complete and not p_acknowledgments_complete then raise exception 'All Start Here acknowledgments are required before completion'; end if;
  v_track:=public.m360_current_student_track();
  if v_track is null then raise exception 'M360 access is not available for this account'; end if;
  v_enrollment_id:=public.m360_require_active_enrollment(auth.uid(),v_track);
  select course_version into v_version from public.m360_enrollments where id=v_enrollment_id;
  insert into public.m360_course_records(enrollment_id,user_id,track_code,course_version,start_here_payload,start_here_completed_at,start_here_acknowledgments_complete,start_here_support_flag)
  values(v_enrollment_id,auth.uid(),v_track,v_version,p_payload,case when p_complete then v_now else null end,p_acknowledgments_complete,p_support_flag)
  on conflict(user_id) do update set
    enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version,
    start_here_payload=excluded.start_here_payload,
    start_here_completed_at=case when public.m360_course_records.start_here_completed_at is not null then public.m360_course_records.start_here_completed_at when excluded.start_here_completed_at is not null then excluded.start_here_completed_at else null end,
    start_here_acknowledgments_complete=public.m360_course_records.start_here_acknowledgments_complete or excluded.start_here_acknowledgments_complete,
    start_here_support_flag=excluded.start_here_support_flag
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.m360_save_draft(p_week_number integer,p_draft_payload jsonb,p_schema_version integer default 1)
returns public.m360_week_records language plpgsql security definer set search_path=''
as $$
declare v_track text; v_enrollment_id uuid; v_version text; v_row public.m360_week_records;
begin
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_draft_payload is null or jsonb_typeof(p_draft_payload)<>'object' then raise exception 'M360 draft payload must be a JSON object'; end if;
  if p_schema_version is null or p_schema_version<1 then raise exception 'Invalid M360 schema version'; end if;
  v_track:=public.m360_current_student_track(); if v_track is null then raise exception 'M360 access is not available for this account'; end if;
  v_enrollment_id:=public.m360_require_active_enrollment(auth.uid(),v_track);
  select course_version into v_version from public.m360_enrollments where id=v_enrollment_id;
  insert into public.m360_course_records(enrollment_id,user_id,track_code,course_version) values(v_enrollment_id,auth.uid(),v_track,v_version)
    on conflict(user_id) do update set enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version;
  insert into public.m360_week_records(enrollment_id,user_id,track_code,course_version,week_number,schema_version,draft_payload,review_status)
  values(v_enrollment_id,auth.uid(),v_track,v_version,p_week_number,p_schema_version,p_draft_payload,'draft')
  on conflict(user_id,week_number) do update set
    enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version,
    schema_version=excluded.schema_version,draft_payload=excluded.draft_payload,
    review_status=case when public.m360_week_records.review_status='accepted' then 'draft' else public.m360_week_records.review_status end
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.m360_submit_week(p_week_number integer,p_submitted_payload jsonb,p_schema_version integer default 1)
returns public.m360_week_records language plpgsql security definer set search_path=''
as $$
declare v_track text; v_enrollment_id uuid; v_version text; v_now timestamptz:=now(); v_row public.m360_week_records;
begin
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_submitted_payload is null or jsonb_typeof(p_submitted_payload)<>'object' then raise exception 'M360 submission payload must be a JSON object'; end if;
  if p_schema_version is null or p_schema_version<1 then raise exception 'Invalid M360 schema version'; end if;
  v_track:=public.m360_current_student_track(); if v_track is null then raise exception 'M360 access is not available for this account'; end if;
  v_enrollment_id:=public.m360_require_active_enrollment(auth.uid(),v_track);
  select course_version into v_version from public.m360_enrollments where id=v_enrollment_id;
  insert into public.m360_course_records(enrollment_id,user_id,track_code,course_version) values(v_enrollment_id,auth.uid(),v_track,v_version)
    on conflict(user_id) do update set enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version;
  insert into public.m360_week_records(enrollment_id,user_id,track_code,course_version,week_number,schema_version,draft_payload,submitted_payload,review_status,revision_number,submitted_at)
  values(v_enrollment_id,auth.uid(),v_track,v_version,p_week_number,p_schema_version,p_submitted_payload,p_submitted_payload,'submitted',1,v_now)
  on conflict(user_id,week_number) do update set
    enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version,
    schema_version=excluded.schema_version,draft_payload=excluded.draft_payload,submitted_payload=excluded.submitted_payload,
    review_status='submitted',revision_number=public.m360_week_records.revision_number+1,submitted_at=v_now,
    reviewed_at=null,reviewer_feedback=null,reviewer_user_id=null
  returning * into v_row;
  insert into public.m360_week_submissions(enrollment_id,user_id,track_code,course_version,week_number,revision_number,submitted_payload,submitted_at)
  values(v_enrollment_id,auth.uid(),v_track,v_version,p_week_number,v_row.revision_number,p_submitted_payload,v_now);
  return v_row;
end $$;

create or replace function public.m360_admin_review_week(p_user_id uuid,p_week_number integer,p_decision text,p_rubric_scores jsonb,p_feedback text default null)
returns public.m360_week_records language plpgsql security definer set search_path=''
as $$
declare v_row public.m360_week_records; v_enrollment_id uuid; v_clarity numeric; v_relevance numeric; v_evidence numeric; v_application numeric; v_prof_comm numeric:=0; v_max numeric; v_total numeric; v_now timestamptz:=now(); v_had_accepted boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.m360_faculty_authorizations f where f.user_id=auth.uid() and f.active=true and f.can_review=true) then raise exception 'Authorized M360 faculty reviewer required'; end if;
  if p_week_number not between 1 and 6 then raise exception 'Invalid M360 week number'; end if;
  if p_decision not in('needs_revision','accepted') then raise exception 'Invalid M360 review decision'; end if;
  if p_rubric_scores is null or jsonb_typeof(p_rubric_scores)<>'object' then raise exception 'Rubric scores are required'; end if;
  select id into v_enrollment_id from public.m360_enrollments where user_id=p_user_id and status='active' order by enrolled_at desc limit 1;
  if v_enrollment_id is null then raise exception 'Active M360 enrollment required'; end if;
  select * into v_row from public.m360_week_records where enrollment_id=v_enrollment_id and week_number=p_week_number for update;
  if not found or v_row.review_status<>'submitted' or v_row.submitted_payload is null then raise exception 'The selected M360 week does not have a submitted revision awaiting review'; end if;
  v_had_accepted:=v_row.accepted_artifact_payload is not null;
  begin
    v_clarity:=nullif(p_rubric_scores->>'clarity','')::numeric; v_relevance:=nullif(p_rubric_scores->>'relevance','')::numeric;
    v_evidence:=nullif(p_rubric_scores->>'evidence','')::numeric; v_application:=nullif(p_rubric_scores->>'application','')::numeric;
    if p_week_number=6 then v_prof_comm:=nullif(p_rubric_scores->>'professional_communication','')::numeric; end if;
  exception when others then raise exception 'Rubric scores must be numeric'; end;
  if v_clarity is null or v_relevance is null or v_evidence is null or v_application is null or(p_week_number=6 and v_prof_comm is null) then raise exception 'All required rubric dimensions must be scored'; end if;
  v_max:=case when p_week_number=6 then 20 else 25 end;
  if v_clarity<0 or v_clarity>v_max or v_relevance<0 or v_relevance>v_max or v_evidence<0 or v_evidence>v_max or v_application<0 or v_application>v_max or(p_week_number=6 and(v_prof_comm<0 or v_prof_comm>v_max)) then raise exception 'One or more rubric scores exceed the approved dimension range'; end if;
  v_total:=v_clarity+v_relevance+v_evidence+v_application+case when p_week_number=6 then v_prof_comm else 0 end;
  if p_decision='accepted' and v_total<70 then raise exception 'Meets Standard requires a score of at least 70'; end if;
  update public.m360_week_records set
    review_status=p_decision,rubric_scores=case when p_decision='accepted' or not v_had_accepted then p_rubric_scores else rubric_scores end,
    numeric_score=case when p_decision='accepted' or not v_had_accepted then v_total else numeric_score end,
    reviewer_feedback=p_feedback,reviewer_user_id=auth.uid(),reviewed_at=v_now,
    accepted_artifact_payload=case when p_decision='accepted' then submitted_payload else accepted_artifact_payload end,
    accepted_at=case when p_decision='accepted' then v_now else accepted_at end
  where enrollment_id=v_enrollment_id and week_number=p_week_number returning * into v_row;
  update public.m360_week_submissions set review_status=p_decision,rubric_scores=p_rubric_scores,numeric_score=v_total,
    reviewer_feedback=p_feedback,reviewer_user_id=auth.uid(),reviewed_at=v_now
  where enrollment_id=v_enrollment_id and week_number=p_week_number and revision_number=v_row.revision_number;
  return v_row;
end $$;

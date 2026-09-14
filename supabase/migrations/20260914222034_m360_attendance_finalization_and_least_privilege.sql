create or replace function public.m360_admin_set_attendance_evidence(
  p_user_id uuid,
  p_scheduled_minutes integer,
  p_attended_minutes integer,
  p_approved_equivalency_minutes integer,
  p_last_date_of_attendance date,
  p_external_reference text,
  p_notes text default null
)
returns public.m360_attendance_records
language plpgsql security definer set search_path=''
as $$
declare v_enrollment public.m360_enrollments; v_version public.m360_course_versions; v_row public.m360_attendance_records;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select * into v_enrollment from public.m360_enrollments where user_id=p_user_id and status='active' order by enrolled_at desc limit 1;
  if not found then raise exception 'Active M360 enrollment required'; end if;
  select * into v_version from public.m360_course_versions where version_code=v_enrollment.course_version;
  if p_scheduled_minutes is distinct from v_version.clock_minutes then raise exception 'Scheduled M360 minutes must match the controlled course version'; end if;
  if p_attended_minutes is null or p_attended_minutes<0 or p_approved_equivalency_minutes is null or p_approved_equivalency_minutes<0 then raise exception 'Attendance minutes must be zero or greater'; end if;
  if p_attended_minutes+p_approved_equivalency_minutes>p_scheduled_minutes then raise exception 'Attendance and equivalency minutes cannot exceed scheduled minutes'; end if;
  if p_last_date_of_attendance is null then raise exception 'Last date of attendance is required'; end if;
  if nullif(trim(p_external_reference),'') is null then raise exception 'Controlled attendance source reference is required'; end if;
  insert into public.m360_attendance_records(enrollment_id,user_id,course_version,scheduled_minutes,attended_minutes,approved_equivalency_minutes,required_percentage,last_date_of_attendance,external_source_reference,notes,verified_by,verified_at,updated_at)
  values(v_enrollment.id,v_enrollment.user_id,v_enrollment.course_version,p_scheduled_minutes,p_attended_minutes,p_approved_equivalency_minutes,v_version.minimum_attendance_percent,p_last_date_of_attendance,trim(p_external_reference),nullif(trim(p_notes),''),auth.uid(),now(),now())
  on conflict(enrollment_id) do update set scheduled_minutes=excluded.scheduled_minutes,attended_minutes=excluded.attended_minutes,approved_equivalency_minutes=excluded.approved_equivalency_minutes,required_percentage=excluded.required_percentage,last_date_of_attendance=excluded.last_date_of_attendance,external_source_reference=excluded.external_source_reference,notes=excluded.notes,verified_by=excluded.verified_by,verified_at=excluded.verified_at,updated_at=excluded.updated_at
  returning * into v_row;
  update public.m360_course_records set attendance_requirement_met=v_row.requirement_met,attendance_verified_by=v_row.verified_by,attendance_verified_at=v_row.verified_at,attendance_external_reference=v_row.external_source_reference where enrollment_id=v_enrollment.id;
  return v_row;
end $$;

create or replace function public.m360_admin_set_attendance(p_user_id uuid,p_requirement_met boolean,p_external_reference text default null)
returns public.m360_course_records language plpgsql security definer set search_path=''
as $$
declare v_enrollment_id uuid; v_row public.m360_course_records;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select id into v_enrollment_id from public.m360_enrollments where user_id=p_user_id and status='active' order by enrolled_at desc limit 1;
  if v_enrollment_id is null then raise exception 'Active M360 enrollment required'; end if;
  if p_requirement_met then
    if not exists(select 1 from public.m360_attendance_records where enrollment_id=v_enrollment_id and requirement_met=true) then raise exception 'Structured M360 attendance evidence is required before attendance can be satisfied'; end if;
  else
    delete from public.m360_attendance_records where enrollment_id=v_enrollment_id;
    update public.m360_course_records set attendance_requirement_met=false,attendance_verified_by=null,attendance_verified_at=null,attendance_external_reference=null where enrollment_id=v_enrollment_id returning * into v_row;
    return v_row;
  end if;
  select * into v_row from public.m360_course_records where enrollment_id=v_enrollment_id;
  return v_row;
end $$;

create or replace function public.m360_admin_set_spotlight_presentation(p_user_id uuid,p_status text,p_reference text default null)
returns public.m360_course_records language plpgsql security definer set search_path=''
as $$
declare v_enrollment public.m360_enrollments; v_row public.m360_course_records; v_verified boolean;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_status not in('not_completed','presented_live','approved_makeup_completed','approved_exception_completed') then raise exception 'Invalid Career Spotlight presentation status'; end if;
  select * into v_enrollment from public.m360_enrollments where user_id=p_user_id and status='active' order by enrolled_at desc limit 1;
  if not found then raise exception 'Active M360 enrollment required'; end if;
  v_verified:=p_status<>'not_completed';
  if v_verified and nullif(trim(p_reference),'') is null then raise exception 'Career Spotlight verification reference is required'; end if;
  insert into public.m360_course_records(enrollment_id,user_id,track_code,course_version,career_spotlight_presentation_status,career_spotlight_presentation_reference,career_spotlight_presentation_verified_by,career_spotlight_presentation_verified_at)
  values(v_enrollment.id,v_enrollment.user_id,v_enrollment.track_code,v_enrollment.course_version,p_status,case when v_verified then trim(p_reference) else null end,case when v_verified then auth.uid() else null end,case when v_verified then now() else null end)
  on conflict(user_id) do update set enrollment_id=excluded.enrollment_id,track_code=excluded.track_code,course_version=excluded.course_version,career_spotlight_presentation_status=excluded.career_spotlight_presentation_status,career_spotlight_presentation_reference=excluded.career_spotlight_presentation_reference,career_spotlight_presentation_verified_by=excluded.career_spotlight_presentation_verified_by,career_spotlight_presentation_verified_at=excluded.career_spotlight_presentation_verified_at
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.m360_admin_set_faculty_authorization(p_user_id uuid,p_can_review boolean,p_can_finalize boolean,p_active boolean default true)
returns public.m360_faculty_authorizations language plpgsql security definer set search_path=''
as $$
declare v_row public.m360_faculty_authorizations;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  insert into public.m360_faculty_authorizations(user_id,can_review,can_finalize,active,authorization_source,authorized_by,authorized_at,updated_at)
  values(p_user_id,coalesce(p_can_review,false),coalesce(p_can_finalize,false),coalesce(p_active,true),'admin_authorization',auth.uid(),now(),now())
  on conflict(user_id) do update set can_review=excluded.can_review,can_finalize=excluded.can_finalize,active=excluded.active,authorization_source=excluded.authorization_source,authorized_by=excluded.authorized_by,authorized_at=excluded.authorized_at,updated_at=excluded.updated_at
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.m360_admin_finalize_course(p_user_id uuid)
returns public.m360_course_completions language plpgsql security definer set search_path=''
as $$
declare
  v_enrollment public.m360_enrollments; v_course public.m360_course_records; v_version public.m360_course_versions;
  v_attendance public.m360_attendance_records; v_completion public.m360_course_completions;
  v_week_count integer; v_reviewed_count integer; v_final_grade numeric(5,2); v_snapshot jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.m360_faculty_authorizations f where f.user_id=auth.uid() and f.active=true and f.can_finalize=true) then raise exception 'Authorized M360 faculty finalizer required'; end if;
  select * into v_enrollment from public.m360_enrollments where user_id=p_user_id and status='active' order by enrolled_at desc limit 1 for update;
  if not found then raise exception 'Active M360 enrollment required'; end if;
  if v_enrollment.cohort_id is null then raise exception 'A controlled cohort is required before M360 can be finalized'; end if;
  if exists(select 1 from public.m360_course_completions where enrollment_id=v_enrollment.id) then raise exception 'M360 completion is already finalized'; end if;
  select * into v_course from public.m360_course_records where enrollment_id=v_enrollment.id;
  if not found or v_course.start_here_completed_at is null or not v_course.start_here_acknowledgments_complete then raise exception 'Start Here must be completed before M360 finalization'; end if;
  if v_course.career_spotlight_presentation_status='not_completed' or v_course.career_spotlight_presentation_verified_by is null or v_course.career_spotlight_presentation_verified_at is null or nullif(trim(v_course.career_spotlight_presentation_reference),'') is null then raise exception 'Verified Career Spotlight completion is required'; end if;
  select count(*) filter(where accepted_artifact_payload is not null),count(*) filter(where accepted_artifact_payload is not null and numeric_score is not null and reviewer_user_id is not null and reviewed_at is not null),round(avg(numeric_score) filter(where accepted_artifact_payload is not null and numeric_score is not null),2)
    into v_week_count,v_reviewed_count,v_final_grade from public.m360_week_records where enrollment_id=v_enrollment.id;
  if v_week_count<>6 or v_reviewed_count<>6 then raise exception 'All six M360 weeks require accepted, faculty-finalized grades'; end if;
  select * into v_version from public.m360_course_versions where version_code=v_enrollment.course_version;
  if v_final_grade is null or v_final_grade<v_version.minimum_grade then raise exception 'Final M360 grade does not meet the controlled minimum'; end if;
  select * into v_attendance from public.m360_attendance_records where enrollment_id=v_enrollment.id;
  if not found or not v_attendance.requirement_met then raise exception 'Verified M360 attendance at or above the controlled threshold is required'; end if;
  if v_attendance.scheduled_minutes<>v_version.clock_minutes then raise exception 'Attendance schedule does not match the controlled course version'; end if;
  select jsonb_build_object('course_version',v_enrollment.course_version,'clock_minutes',v_version.clock_minutes,'minimum_grade',v_version.minimum_grade,'minimum_attendance_percent',v_version.minimum_attendance_percent,'weeks',coalesce(jsonb_agg(jsonb_build_object('week_number',w.week_number,'revision_number',w.revision_number,'numeric_score',w.numeric_score,'reviewer_user_id',w.reviewer_user_id,'reviewed_at',w.reviewed_at,'accepted_at',w.accepted_at,'rubric_scores',w.rubric_scores,'accepted_artifact',w.accepted_artifact_payload) order by w.week_number),'[]'::jsonb)) into v_snapshot
  from public.m360_week_records w where w.enrollment_id=v_enrollment.id;
  insert into public.m360_course_completions(enrollment_id,user_id,cohort_id,track_code,course_version,final_grade,earned_clock_hours,accepted_week_count,attendance_percentage,attendance_source_reference,last_date_of_attendance,career_spotlight_status,career_spotlight_reference,evidence_snapshot,finalized_by,finalized_at)
  values(v_enrollment.id,v_enrollment.user_id,v_enrollment.cohort_id,v_enrollment.track_code,v_enrollment.course_version,v_final_grade,(v_version.clock_minutes::numeric/60.0),6,v_attendance.attendance_percentage,v_attendance.external_source_reference,v_attendance.last_date_of_attendance,v_course.career_spotlight_presentation_status,v_course.career_spotlight_presentation_reference,v_snapshot,auth.uid(),now())
  returning * into v_completion;
  update public.m360_enrollments set status='completed',completed_at=v_completion.finalized_at where id=v_enrollment.id;
  return v_completion;
end $$;

create or replace view public.m360_course_progress with(security_invoker=true) as
with selected_enrollment as (
  select distinct on(user_id) * from public.m360_enrollments order by user_id,(status='active') desc,enrolled_at desc
)
select e.user_id,e.track_code,
  count(w.week_number) filter(where w.accepted_artifact_payload is not null) as accepted_artifact_count,
  count(w.week_number) filter(where w.accepted_artifact_payload is not null and w.numeric_score is not null) as graded_week_count,
  case when count(w.week_number) filter(where w.accepted_artifact_payload is not null and w.numeric_score is not null)=6 then round(avg(w.numeric_score) filter(where w.accepted_artifact_payload is not null),2) else null::numeric end as final_grade,
  coalesce(bool_or(w.week_number=6 and w.accepted_artifact_payload is not null),false) and coalesce(c.career_spotlight_presentation_status<>'not_completed',false) as career_spotlight_complete,
  coalesce(a.requirement_met,false) as attendance_requirement_met,a.verified_by as attendance_verified_by,a.verified_at as attendance_verified_at,a.external_source_reference as attendance_external_reference,
  (cc.id is not null) as course_complete,c.start_here_completed_at,coalesce(c.start_here_acknowledgments_complete,false) as start_here_acknowledgments_complete,coalesce(c.start_here_support_flag,false) as start_here_support_flag,
  coalesce(c.career_spotlight_presentation_status,'not_completed') as career_spotlight_presentation_status,c.career_spotlight_presentation_reference,c.career_spotlight_presentation_verified_by,c.career_spotlight_presentation_verified_at,
  e.id as enrollment_id,e.cohort_id,e.course_version,a.scheduled_minutes,a.attended_minutes,a.approved_equivalency_minutes,a.attendance_percentage,a.last_date_of_attendance,
  (c.start_here_completed_at is not null and coalesce(c.start_here_acknowledgments_complete,false)=true and count(w.week_number) filter(where w.accepted_artifact_payload is not null)=6 and count(w.week_number) filter(where w.accepted_artifact_payload is not null and w.numeric_score is not null and w.reviewer_user_id is not null and w.reviewed_at is not null)=6 and avg(w.numeric_score) filter(where w.accepted_artifact_payload is not null)>=v.minimum_grade and coalesce(bool_or(w.week_number=6 and w.accepted_artifact_payload is not null),false) and c.career_spotlight_presentation_status<>'not_completed' and c.career_spotlight_presentation_verified_by is not null and c.career_spotlight_presentation_verified_at is not null and nullif(trim(c.career_spotlight_presentation_reference),'') is not null and coalesce(a.requirement_met,false)=true and a.scheduled_minutes=v.clock_minutes and e.cohort_id is not null) as ready_to_finalize,
  cc.id as completion_id,cc.finalized_at,cc.finalized_by,cc.earned_clock_hours
from selected_enrollment e
join public.m360_course_versions v on v.version_code=e.course_version
left join public.m360_course_records c on c.enrollment_id=e.id
left join public.m360_week_records w on w.enrollment_id=e.id
left join public.m360_attendance_records a on a.enrollment_id=e.id
left join public.m360_course_completions cc on cc.enrollment_id=e.id
group by e.id,e.user_id,e.cohort_id,e.track_code,e.course_version,v.minimum_grade,v.clock_minutes,c.start_here_completed_at,c.start_here_acknowledgments_complete,c.start_here_support_flag,c.career_spotlight_presentation_status,c.career_spotlight_presentation_reference,c.career_spotlight_presentation_verified_by,c.career_spotlight_presentation_verified_at,a.requirement_met,a.scheduled_minutes,a.attended_minutes,a.approved_equivalency_minutes,a.attendance_percentage,a.last_date_of_attendance,a.external_source_reference,a.verified_by,a.verified_at,cc.id,cc.finalized_at,cc.finalized_by,cc.earned_clock_hours;

revoke all on public.m360_course_records from anon;
revoke insert,update,delete,truncate,trigger,references on public.m360_course_records from authenticated; grant select on public.m360_course_records to authenticated;
revoke all on public.m360_week_records from anon;
revoke insert,update,delete,truncate,trigger,references on public.m360_week_records from authenticated; grant select on public.m360_week_records to authenticated;
revoke all on public.m360_week_submissions from anon;
revoke insert,update,delete,truncate,trigger,references on public.m360_week_submissions from authenticated; grant select on public.m360_week_submissions to authenticated;
revoke all on public.m360_course_progress from anon,authenticated; grant select on public.m360_course_progress to authenticated;

drop policy if exists m360_course_self_read on public.m360_course_records; drop policy if exists m360_course_admin_read on public.m360_course_records;
create policy m360_course_self_read on public.m360_course_records for select to authenticated using((select auth.uid())=user_id);
create policy m360_course_admin_read on public.m360_course_records for select to authenticated using(public.is_admin());
drop policy if exists m360_week_self_read on public.m360_week_records; drop policy if exists m360_week_admin_read on public.m360_week_records;
create policy m360_week_self_read on public.m360_week_records for select to authenticated using((select auth.uid())=user_id);
create policy m360_week_admin_read on public.m360_week_records for select to authenticated using(public.is_admin());
drop policy if exists m360_submission_self_read on public.m360_week_submissions; drop policy if exists m360_submission_admin_read on public.m360_week_submissions;
create policy m360_submission_self_read on public.m360_week_submissions for select to authenticated using((select auth.uid())=user_id);
create policy m360_submission_admin_read on public.m360_week_submissions for select to authenticated using(public.is_admin());

revoke execute on function public.m360_enforce_enrollment_binding() from public,anon,authenticated;
revoke execute on function public.m360_require_active_enrollment(uuid,text) from public,anon,authenticated;
revoke execute on function public.m360_current_student_track() from public,anon; grant execute on function public.m360_current_student_track() to authenticated;
revoke execute on function public.m360_save_start_here(jsonb,boolean,boolean,boolean) from public,anon; grant execute on function public.m360_save_start_here(jsonb,boolean,boolean,boolean) to authenticated;
revoke execute on function public.m360_save_draft(integer,jsonb,integer) from public,anon; grant execute on function public.m360_save_draft(integer,jsonb,integer) to authenticated;
revoke execute on function public.m360_submit_week(integer,jsonb,integer) from public,anon; grant execute on function public.m360_submit_week(integer,jsonb,integer) to authenticated;
revoke execute on function public.m360_admin_review_week(uuid,integer,text,jsonb,text) from public,anon; grant execute on function public.m360_admin_review_week(uuid,integer,text,jsonb,text) to authenticated;
revoke execute on function public.m360_admin_set_attendance(uuid,boolean,text) from public,anon; grant execute on function public.m360_admin_set_attendance(uuid,boolean,text) to authenticated;
revoke execute on function public.m360_admin_set_attendance_evidence(uuid,integer,integer,integer,date,text,text) from public,anon; grant execute on function public.m360_admin_set_attendance_evidence(uuid,integer,integer,integer,date,text,text) to authenticated;
revoke execute on function public.m360_admin_set_spotlight_presentation(uuid,text,text) from public,anon; grant execute on function public.m360_admin_set_spotlight_presentation(uuid,text,text) to authenticated;
revoke execute on function public.m360_admin_set_faculty_authorization(uuid,boolean,boolean,boolean) from public,anon; grant execute on function public.m360_admin_set_faculty_authorization(uuid,boolean,boolean,boolean) to authenticated;
revoke execute on function public.m360_admin_finalize_course(uuid) from public,anon; grant execute on function public.m360_admin_finalize_course(uuid) to authenticated;

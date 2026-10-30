-- Regression test for 20261030175603_course_module_labs_gates_completion.sql.
-- Help Desk Module 1 gates on lab-its-01-prove-it only; every other module of
-- every track computes exactly what the previous view
-- (20261017130000_module_one_completion_case_console.sql) computed. Practice
-- It rows stay in course_module_labs for the one-pending rule and evidence
-- storage. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('b0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gates-soc@test.local'),
  ('b0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gates-hdesk@test.local'),
  ('b0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gates-aim@test.local'),
  ('b0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gates-instructor@test.local'),
  ('b0000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gates-hdesk-2@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000011-SOCAN',  'b0000000-0000-0000-0000-000000000001', 'SOCAN',     true, false, false),
  ('9900000012-HDESK',  'b0000000-0000-0000-0000-000000000002', 'HDESK',     true, false, false),
  ('9900000013-AIENG',  'b0000000-0000-0000-0000-000000000003', 'AIENG',     true, false, false),
  ('9900000014-HDINST', 'b0000000-0000-0000-0000-000000000004', 'SOCANINST', true, false, true),
  ('9900000015-HDESK',  'b0000000-0000-0000-0000-000000000005', 'HDESK',     true, false, false);

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.expect_error(p_sql text, p_label text) returns void language plpgsql as $$
declare v_failed boolean := false;
begin
  begin execute p_sql; exception when others then v_failed := true; end;
  if not v_failed then raise exception 'FAIL %: statement succeeded', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;

-- An approved attempt, written as the academy (no API role).
create function pg_temp.approve(p_user uuid, p_track text, p_lab text) returns void language sql as $$
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, pass_threshold, result, started_at, completed_at, reviewed_at, reviewed_by, redo_requested)
  values (p_user, p_track, p_lab, 'complete', 90, 70, '{}'::jsonb, now(), now(), now(), 'b0000000-0000-0000-0000-000000000004', false);
$$;

-- ------------------------------------------------------------ the map
select pg_temp.check((select array_agg(lab_key order by lab_key) from public.course_module_labs where not gates_completion)
    = array['lab-its-01-lms-validation', 'lab-its-01-ticket-triage'],
  'only Module 1''s two Practice It labs have gates_completion = false');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-01' and gates_completion)
    = array['lab-its-01-prove-it'],
  'Module 1 gates on lab-its-01-prove-it only');
select pg_temp.check(exists (select 1 from public.course_module_labs
    where track_code = 'HDESK' and module_key = 'its-01' and lab_key = 'lab-its-01-lms-validation'),
  'Lab 1.1 keeps its row, so evidence storage still accepts its uploads');

-- ------------------------------------------------------------ fixtures
-- SOC: soc-02 approved. AI/ML: aim-01 approved. Help Desk: Labs 1.1 and 1.2
-- approved, and every Module 2 lab approved.
select pg_temp.approve('b0000000-0000-0000-0000-000000000001', 'SOCAN', 'lab-identity-investigation');
select pg_temp.approve('b0000000-0000-0000-0000-000000000003', 'AIENG', 'lab-aim-01-cli-utility');
select pg_temp.approve('b0000000-0000-0000-0000-000000000002', 'HDESK', 'lab-its-01-lms-validation');
select pg_temp.approve('b0000000-0000-0000-0000-000000000002', 'HDESK', 'lab-its-01-ticket-triage');
select pg_temp.approve('b0000000-0000-0000-0000-000000000002', 'HDESK', lab_key)
  from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-02';

-- ------------------------------------------------------------ other tracks unchanged
-- The previous view's formula over every course_module_labs row, unfiltered.
create temp table old_view as
select s.user_id, r.track_code, r.module_key,
  coalesce(mp.admin_override, false)
  or (
    bool_and(exists (
      select 1 from public.lab_attempts la
      where la.user_id = s.user_id and la.track_code = r.track_code and la.lab_key = r.lab_key
        and la.state = 'complete'
        and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
        and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
        and la.reviewed_at is not null
        and la.reviewed_by is not null
        and la.reviewed_by <> la.user_id
        and la.redo_requested = false
        and (r.lab_key <> 'lab-soc-escalation' or la.result ? 'case_record')
    ))
    and (r.module_key <> 'soc-01' or (
      coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
      and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
    ))
  ) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
where r.lab_key <> 'lab-its-01-prove-it'
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

select pg_temp.check(not exists (
    (select user_id, track_code, module_key, complete from old_view
       where not (track_code = 'HDESK' and module_key = 'its-01')
     except
     select user_id, track_code, module_key, complete from public.student_verified_module_progress)
    union all
    (select user_id, track_code, module_key, complete from public.student_verified_module_progress
       where not (track_code = 'HDESK' and module_key = 'its-01')
     except
     select user_id, track_code, module_key, complete from old_view)),
  'every module except Help Desk Module 1 computes exactly what the previous view did');
select pg_temp.check((select complete from public.student_verified_module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000001' and module_key = 'soc-02'),
  'SOC soc-02 still verifies on its approved lab');
select pg_temp.check((select complete from public.student_verified_module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000003' and module_key = 'aim-01'),
  'AI/ML aim-01 still verifies on its approved lab');
select pg_temp.check((select complete from public.student_verified_module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000002' and module_key = 'its-02'),
  'Help Desk its-02 still verifies on its approved labs');

-- ------------------------------------------------------------ Help Desk Module 1
select pg_temp.check((select complete from old_view
    where user_id = 'b0000000-0000-0000-0000-000000000002' and module_key = 'its-01'),
  'previously, approved Labs 1.1 and 1.2 verified Module 1');
select pg_temp.check((select not complete from public.student_verified_module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000002' and module_key = 'its-01'),
  'now, approved Practice It labs alone do not verify Module 1');
select pg_temp.approve('b0000000-0000-0000-0000-000000000002', 'HDESK', 'lab-its-01-prove-it');
select pg_temp.check((select complete from public.student_verified_module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000002' and module_key = 'its-01'),
  'an approved Prove It verifies Module 1');
select pg_temp.check((select state = 'complete' from public.module_progress
    where user_id = 'b0000000-0000-0000-0000-000000000002' and module_key = 'its-01'),
  'approving the Prove It completes module_progress (unlocks Module 2)');

-- ------------------------------------------------------------ one-pending still applies to Practice It
-- API-user claims with an open academy session, without switching role: the
-- one-pending trigger sees an authenticated submit; the enrollment write
-- policy is covered elsewhere.
insert into public.site_sessions (user_id, auth_session_id)
  values ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005');
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000005","role":"authenticated","session_id":"c0000000-0000-0000-0000-000000000005"}', true);
insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, started_at, completed_at)
  values ('b0000000-0000-0000-0000-000000000005', 'HDESK', 'lab-its-01-ticket-triage', 'complete', 90, '{}'::jsonb, now(), now());
select pg_temp.expect_error($$insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, started_at, completed_at)
    values ('b0000000-0000-0000-0000-000000000005', 'HDESK', 'lab-its-01-ticket-triage', 'complete', 90, '{}'::jsonb, now(), now() + interval '1 second')$$,
  'Lab 1.2 still takes only one waiting attempt');
select set_config('request.jwt.claims', '', true);

rollback;
\o
\echo 'course_module_labs_gates_completion: all checks passed'

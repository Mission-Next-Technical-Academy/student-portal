-- guard_lab_attempt_single_pending() after
-- 20261121230614_approved_below_pass_allows_resubmit.sql:
--   * an approved BELOW-PASS attempt allows a resubmit;
--   * an approved PASSING attempt refuses one;
--   * the Assessment Lab box ('<module>-assessment-module') still allows only
--     one waiting submission, and an approved box attempt still refuses a new
--     one (both from 20261029234710_portfolio_artifact_module_assessment_kind.sql).
-- Earlier attempts are marked reviewed with no API claims (the guard and the
-- review triggers skip non-API callers), then the submit under test runs with
-- the student's authenticated claims. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('d1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','resubmit-below@test.local'),
  ('d1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','resubmit-pass@test.local'),
  ('d1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','resubmit-instructor@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000031-HDESK',  'd1000000-0000-0000-0000-000000000001', 'HDESK',  true, false, false),
  ('9900000032-HDESK',  'd1000000-0000-0000-0000-000000000002', 'HDESK',  true, false, false),
  ('9900000034-HDINST', 'd1000000-0000-0000-0000-000000000004', 'HDINST', true, false, true);
insert into public.faculty_course_assignments (user_id, track_code) values
  ('d1000000-0000-0000-0000-000000000004', 'HDESK');
insert into public.site_sessions (user_id, auth_session_id) values
  ('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002');

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.expect_error(p_sql text, p_hint text, p_label text) returns void language plpgsql as $$
declare v_hint text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    if p_hint is not null and v_hint is distinct from p_hint then raise exception 'FAIL %: hint was %', p_label, v_hint; end if;
    raise notice 'ok   %', p_label;
    return;
  end;
  raise exception 'FAIL %: statement succeeded', p_label;
end $$;
create function pg_temp.act_as(p_user uuid, p_session uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true);
$$;
create function pg_temp.clear_claims() returns void language sql as $$
  select set_config('request.jwt.claims', '', true);
$$;
-- One submit as the portal saves it, under the student's API claims.
create function pg_temp.submit(p_user uuid, p_lab text, p_state text, p_score numeric, p_at text) returns void language plpgsql as $$
begin
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
  values (p_user, 'HDESK', p_lab, p_state::public.progress_state, p_score, jsonb_build_object('note', 'attempt ' || p_at),
    'test-rubric-v1', 'test-engine-v1', p_at::timestamptz, p_at::timestamptz);
end $$;
-- The instructor's decision on the student's newest attempt of a lab.
create function pg_temp.review(p_user uuid, p_lab text, p_returned boolean) returns void language sql as $$
  update public.lab_attempts
  set reviewed_at = now(), reviewed_by = 'd1000000-0000-0000-0000-000000000004', redo_requested = p_returned
  where id = (select id from public.lab_attempts
              where user_id = p_user and lab_key = p_lab
              order by completed_at desc, id desc limit 1);
$$;

select pg_temp.check(exists (select 1 from public.course_module_labs
    where track_code = 'HDESK' and lab_key = 'lab-its-02-vm-build' and not requires_official_score),
  'fixture: lab-its-02-vm-build is a guarded lab that keeps its score');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'its-02-assessment-module'),
  'fixture: the box key is not in course_module_labs');

-- ------------------------------------------------------------ approved below pass
select pg_temp.act_as('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'lab-its-02-vm-build', 'submitted', 55, '2026-11-21 10:00:00+00');
select pg_temp.clear_claims();
select pg_temp.review('d1000000-0000-0000-0000-000000000001', 'lab-its-02-vm-build', false);
select pg_temp.check((select reviewed_at is not null and redo_requested = false and score = 55
    from public.lab_attempts where user_id = 'd1000000-0000-0000-0000-000000000001'), 'fixture: a 55 attempt is approved');
select pg_temp.act_as('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'lab-its-02-vm-build', 'complete', 82, '2026-11-21 11:00:00+00');
select pg_temp.clear_claims();
select pg_temp.check((select count(*) = 2 from public.lab_attempts where user_id = 'd1000000-0000-0000-0000-000000000001'),
  'an approved below-pass attempt allows a resubmit');

-- ------------------------------------------------------------ approved passing
select pg_temp.act_as('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002');
select pg_temp.submit('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-build', 'complete', 85, '2026-11-21 10:00:00+00');
select pg_temp.clear_claims();
select pg_temp.review('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-build', false);
select pg_temp.act_as('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002');
select pg_temp.expect_error($$select pg_temp.submit('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-build', 'complete', 90, '2026-11-21 11:00:00+00')$$,
  'already_approved', 'an approved passing attempt refuses a resubmit');
select pg_temp.clear_claims();

-- ------------------------------------------------------------ approved with a critical error
-- A score of 90 with a critical error does not pass, so approval must not lock it.
select pg_temp.act_as('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002');
select pg_temp.submit('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-snapshot-server', 'complete', 90, '2026-11-21 10:00:00+00');
select pg_temp.clear_claims();
update public.lab_attempts set result = '{"critical_errors":["test critical error"]}'::jsonb
  where user_id = 'd1000000-0000-0000-0000-000000000002' and lab_key = 'lab-its-02-vm-snapshot-server';
select pg_temp.review('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-snapshot-server', false);
select pg_temp.act_as('d1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002');
select pg_temp.submit('d1000000-0000-0000-0000-000000000002', 'lab-its-02-vm-snapshot-server', 'complete', 88, '2026-11-21 11:00:00+00');
select pg_temp.clear_claims();
select pg_temp.check((select count(*) = 2 from public.lab_attempts
    where user_id = 'd1000000-0000-0000-0000-000000000002' and lab_key = 'lab-its-02-vm-snapshot-server'),
  'an approved attempt with a critical error allows a resubmit');

-- ------------------------------------------------------------ Assessment Lab box
select pg_temp.act_as('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', 'submitted', null, '2026-11-21 12:00:00+00');
select pg_temp.expect_error($$select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', 'submitted', null, '2026-11-21 12:05:00+00')$$,
  'one_pending_submission', 'a second waiting Assessment Lab box submission is refused');
select pg_temp.clear_claims();

-- The box is saved 'submitted' with no score; approval must still lock it.
select pg_temp.review('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', false);
select pg_temp.act_as('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', 'submitted', null, '2026-11-21 13:00:00+00')$$,
  'already_approved', 'an approved Assessment Lab box submission refuses a new one');
select pg_temp.clear_claims();

-- A returned box allows one new attempt.
select pg_temp.review('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', true);
select pg_temp.act_as('d1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');
select pg_temp.submit('d1000000-0000-0000-0000-000000000001', 'its-02-assessment-module', 'submitted', null, '2026-11-21 14:00:00+00');
select pg_temp.clear_claims();
select pg_temp.check((select count(*) = 2 from public.lab_attempts
    where user_id = 'd1000000-0000-0000-0000-000000000001' and lab_key = 'its-02-assessment-module'),
  'a returned Assessment Lab box allows one new submission');

\o
\echo approved_below_pass_resubmit.sql: all checks passed
rollback;

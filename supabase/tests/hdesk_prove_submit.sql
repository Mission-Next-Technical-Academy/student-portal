-- Help Desk Module 1's Prove It as the portal saves it: state 'complete', no
-- score, the package in result, written by the student's own API role. Checks
-- the database rules the simulator's Submit relies on. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prove-student@test.local'),
  ('d0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prove-other@test.local'),
  ('d0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prove-instructor@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000021-HDESK',  'd0000000-0000-0000-0000-000000000001', 'HDESK',     true, false, false),
  ('9900000022-HDESK',  'd0000000-0000-0000-0000-000000000002', 'HDESK',     true, false, false),
  ('9900000024-HDINST', 'd0000000-0000-0000-0000-000000000004', 'HDINST',    true, false, true);
insert into public.faculty_course_assignments (user_id, track_code) values
  ('d0000000-0000-0000-0000-000000000004', 'HDESK');
insert into public.site_sessions (user_id, auth_session_id) values
  ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004');

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
-- Acts as an API user with an open academy session. No role switch here, so
-- this checks the triggers and the view; "who can write" below uses the real role.
create function pg_temp.act_as(p_user uuid, p_session uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true);
$$;
create function pg_temp.verified(p_user uuid) returns boolean language sql as $$
  select coalesce((select complete from public.student_verified_module_progress where user_id = p_user and module_key = 'its-01'), false);
$$;
create function pg_temp.submit(p_at text) returns void language plpgsql as $$
begin
  execute format($sql$insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
    values ('d0000000-0000-0000-0000-000000000001', 'HDESK', 'lab-its-01-prove-it', 'complete', null,
      '{"kind":"hdesk-prove","userReply":"Reply %s"}'::jsonb, 'hdesk-its-01-prove-v1', 'instructor-review-v1', %L::timestamptz, %L::timestamptz)$sql$, p_at, p_at, p_at);
end $$;

-- ------------------------------------------------------------ first submit
select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');
select pg_temp.submit('2026-10-30 10:00:00+00');
select pg_temp.check((select state = 'complete' and score is null and reviewed_at is null and redo_requested = false and pass_threshold = 70
    from public.lab_attempts where lab_key = 'lab-its-01-prove-it'), 'saved complete, no score, unreviewed');
select set_config('request.jwt.claims', '', true);
select pg_temp.check(not pg_temp.verified('d0000000-0000-0000-0000-000000000001'), 'a waiting attempt never completes Module 1');
select pg_temp.check(not exists (select 1 from public.module_progress
    where user_id = 'd0000000-0000-0000-0000-000000000001' and module_key = 'its-01' and state = 'complete'), 'and module_progress stays incomplete');
select pg_temp.check((select count(*) = 1 from public.lab_attempts la
    join public.students s on s.user_id = la.user_id
    where la.lab_key = 'lab-its-01-prove-it' and la.state::text in ('complete', 'submitted') and la.reviewed_at is null and la.superseded_at is null),
  'it is the kind of row the grading queues list');
select pg_temp.check(pg_get_viewdef('public.faculty_grading_queue'::regclass) like '%la.result%', 'and the queue hands the instructor the package');

-- ------------------------------------------------------------ one waiting
select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select pg_temp.submit('2026-10-30 10:05:00+00')$$, 'one_pending_submission', 'a second attempt is refused while one waits');
select set_config('request.jwt.claims', '', true);

-- ------------------------------------------------------------ who can write
-- The real API role, so row-level security applies.
select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');
set local role authenticated;
update public.lab_attempts set reviewed_at = now(), reviewed_by = 'd0000000-0000-0000-0000-000000000001', redo_requested = false where lab_key = 'lab-its-01-prove-it';
select pg_temp.check(public.has_module_access('HDESK'), 'the student has Help Desk access in this file');
select pg_temp.expect_error($$insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, started_at, completed_at)
    values ('d0000000-0000-0000-0000-000000000002', 'HDESK', 'lab-its-01-prove-it', 'complete', null, '{}'::jsonb, now(), now())$$, null, 'a student cannot save an attempt for another student');
reset role;
select set_config('request.jwt.claims', '', true);
select pg_temp.check((select reviewed_at is null from public.lab_attempts where lab_key = 'lab-its-01-prove-it'), 'a student cannot review their own attempt');

-- ------------------------------------------------------------ returned
select pg_temp.act_as('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004');
select public.record_lab_grade((select id from public.lab_attempts where lab_key = 'lab-its-01-prove-it'), 'returned', '[]'::jsonb, false, null, null, 'Say what the check proved.');
select set_config('request.jwt.claims', '', true);
select pg_temp.check(not pg_temp.verified('d0000000-0000-0000-0000-000000000001'), 'a returned attempt does not complete Module 1');

select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');
select pg_temp.submit('2026-10-30 12:00:00+00');
select pg_temp.expect_error($$select pg_temp.submit('2026-10-30 12:05:00+00')$$, 'one_pending_submission', 'one return reopens one resubmission');
select set_config('request.jwt.claims', '', true);
select pg_temp.check((select count(*) = 2 from public.lab_attempts where lab_key = 'lab-its-01-prove-it'), 'the resubmission is a new row');
select pg_temp.check((select redo_requested and result->>'userReply' = 'Reply 2026-10-30 10:00:00+00' from public.lab_attempts
    where lab_key = 'lab-its-01-prove-it' order by completed_at limit 1), 'the earlier attempt is kept as it was');
select pg_temp.check((select count(*) = 1 from public.lab_attempt_feedback f join public.lab_attempts la on la.id = f.lab_attempt_id
    where la.lab_key = 'lab-its-01-prove-it' and f.comment = 'Say what the check proved.'), 'and so are the instructor''s notes');
select pg_temp.check(not pg_temp.verified('d0000000-0000-0000-0000-000000000001'), 'the resubmission alone does not complete Module 1');

-- ------------------------------------------------------------ approved
-- The full rules are in hdesk_faculty_gate.sql.
select pg_temp.act_as('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004');
select public.record_lab_grade((select id from public.lab_attempts where lab_key = 'lab-its-01-prove-it' and reviewed_at is null), 'approved',
  '[{"id":"triage","label":"Triage","points":22,"earned":22},{"id":"investigation","label":"Investigation","points":11,"earned":11},{"id":"diagnosis","label":"Diagnosis","points":11,"earned":11},{"id":"action","label":"Action and decision","points":28,"earned":28},{"id":"documentation","label":"Documentation and communication","points":28,"earned":28}]'::jsonb);
select set_config('request.jwt.claims', '', true);
select pg_temp.check(pg_temp.verified('d0000000-0000-0000-0000-000000000001'), 'an approved official grade completes Module 1');
select pg_temp.check((select state = 'complete' from public.module_progress
    where user_id = 'd0000000-0000-0000-0000-000000000001' and module_key = 'its-01'), 'and module_progress follows, which unlocks Module 2');
select pg_temp.act_as('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001');
select pg_temp.expect_error($$select pg_temp.submit('2026-10-30 14:00:00+00')$$, 'already_approved', 'an approved Prove It takes no more attempts');
select set_config('request.jwt.claims', '', true);

rollback;
\o
\echo 'hdesk_prove_submit: all checks passed'

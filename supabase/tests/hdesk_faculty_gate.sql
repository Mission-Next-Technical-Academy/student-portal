-- Official faculty grades (20261030221555_faculty_official_lab_grades.sql):
-- Help Desk Module 1's Prove It passes only with an approved official score of
-- at least the pass mark, and every unflagged lab of every track computes
-- exactly what it did before. Neutral values only: no answer key.
-- Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('f0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gate-student@test.local'),
  ('f0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gate-other@test.local'),
  ('f0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gate-records@test.local'),
  ('f0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gate-instructor@test.local'),
  ('f0000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','gate-soc-instructor@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000031-HDESK', 'f0000000-0000-0000-0000-000000000001', 'HDESK', true, false, false),
  ('9900000032-HDESK', 'f0000000-0000-0000-0000-000000000002', 'HDESK', true, false, false),
  ('9900000033-HDESK', 'f0000000-0000-0000-0000-000000000003', 'HDESK', true, false, false),
  ('9900000034-HDINST', 'f0000000-0000-0000-0000-000000000004', 'HDINST', true, false, true),
  ('9900000035-SOCANINST', 'f0000000-0000-0000-0000-000000000005', 'SOCANINST', true, false, true);
insert into public.faculty_course_assignments (user_id, track_code) values
  ('f0000000-0000-0000-0000-000000000004', 'HDESK'),
  ('f0000000-0000-0000-0000-000000000005', 'SOCAN');
insert into public.site_sessions (user_id, auth_session_id) values
  ('f0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001'),
  ('f0000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002'),
  ('f0000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004'),
  ('f0000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005');

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.expect_error(p_sql text, p_hint text, p_label text) returns void language plpgsql as $$
declare v_hint text; v_message text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_message = message_text;
    if p_hint is not null and v_hint is distinct from p_hint then raise exception 'FAIL %: hint was %, message %', p_label, v_hint, v_message; end if;
    raise notice 'ok   %', p_label;
    return;
  end;
  raise exception 'FAIL %: statement succeeded', p_label;
end $$;
-- The real API role and JWT claims, so row-level security and the guards apply.
create function pg_temp.act_as(p_user text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-0000-0000-00000000000' || p_user, 'role', 'authenticated', 'session_id', 'e1000000-0000-0000-0000-00000000000' || p_user)::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.act_clear() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;
grant execute on all functions in schema pg_temp to authenticated;
create function pg_temp.scores(p_triage int, p_investigation int, p_diagnosis int, p_action int, p_documentation int) returns jsonb language sql as $$
  select jsonb_build_array(
    jsonb_build_object('id','triage','label','Triage','points',22,'earned',p_triage,'justification',case when p_triage < 22 then 'Partial: reason given.' else '' end),
    jsonb_build_object('id','investigation','label','Investigation','points',11,'earned',p_investigation,'justification',case when p_investigation < 11 then 'Partial: reason given.' else '' end),
    jsonb_build_object('id','diagnosis','label','Diagnosis','points',11,'earned',p_diagnosis,'justification',case when p_diagnosis < 11 then 'Partial: reason given.' else '' end),
    jsonb_build_object('id','action','label','Action and decision','points',28,'earned',p_action,'justification',case when p_action < 28 then 'Partial: reason given.' else '' end),
    jsonb_build_object('id','documentation','label','Documentation and communication','points',28,'earned',p_documentation,'justification',case when p_documentation < 28 then 'Partial: reason given.' else '' end));
$$;
create function pg_temp.submit(p_user uuid, p_at timestamptz, p_score numeric default null) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
    values (p_user, 'HDESK', 'lab-its-01-prove-it', 'complete', p_score, '{"kind":"hdesk-prove","userReply":"A reply."}'::jsonb, 'hdesk-its-01-prove-v1', 'instructor-review-v1', p_at, p_at)
    returning id into v_id;
  return v_id;
end $$;
create function pg_temp.latest(p_user uuid) returns uuid language sql as $$
  select id from public.lab_attempts where user_id = p_user and lab_key = 'lab-its-01-prove-it' order by completed_at desc, id desc limit 1;
$$;
create function pg_temp.verified(p_user uuid) returns boolean language sql as $$
  select coalesce((select complete from public.student_verified_module_progress where user_id = p_user and module_key = 'its-01'), false);
$$;
grant execute on all functions in schema pg_temp to authenticated;

-- ------------------------------------------------------------ scope
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where requires_official_score) = array['lab-its-01-prove-it'],
  'exactly one lab requires an official score');
select pg_temp.check(public.lab_pass_mark() = 70, 'the pass mark is 70');

-- ------------------------------------------------------------ a waiting attempt
select pg_temp.act_as('1');
select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 10:00+00', 100);
select pg_temp.check((select score is null and pass_threshold = public.lab_pass_mark() from public.lab_attempts where user_id = auth.uid() and lab_key = 'lab-its-01-prove-it'),
  'a score the student sends is not kept on this lab');
select pg_temp.expect_error($$insert into public.lab_attempt_grades (lab_attempt_id, decision, official_score, created_by)
    values (pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'approved', 100, auth.uid())$$, null, 'a student cannot write a grade');
select pg_temp.expect_error($$select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'approved', pg_temp.scores(22,11,11,28,28))$$,
  'not_course_staff', 'a student cannot grade through the function');
select pg_temp.act_clear();
select pg_temp.check(not pg_temp.verified('f0000000-0000-0000-0000-000000000001'), 'a waiting attempt does not count');

-- An unreleased grade and note, as only a partial write could leave them.
insert into public.lab_attempt_grades (lab_attempt_id, decision, official_score, created_by)
  values (pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', 50, 'f0000000-0000-0000-0000-000000000004');
insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
  values (pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'Overall', 'Draft note.', 'f0000000-0000-0000-0000-000000000004');
select pg_temp.act_as('1');
select pg_temp.check((select count(*) = 0 from public.lab_attempt_grades), 'a student cannot read a grade before review');
select pg_temp.check((select count(*) = 0 from public.lab_attempt_feedback), 'a student cannot read notes before review');
select pg_temp.act_clear();
select pg_temp.act_as('4');
select pg_temp.check((select count(*) = 1 from public.lab_attempt_grades), 'the course''s instructor can');
select pg_temp.act_clear();
select pg_temp.act_as('5');
select pg_temp.check((select count(*) = 0 from public.lab_attempt_grades), 'another course''s instructor cannot');
select pg_temp.act_clear();
delete from public.lab_attempt_grades; delete from public.lab_attempt_feedback;

-- ------------------------------------------------------------ who can decide
create temp table a as select pg_temp.latest('f0000000-0000-0000-0000-000000000001') as id;
grant select on a to authenticated;
select pg_temp.act_as('4');
select pg_temp.expect_error($$update public.lab_attempts set reviewed_at = now(), reviewed_by = auth.uid(), redo_requested = false where lab_key = 'lab-its-01-prove-it'$$,
  'official_grade_required', 'staff cannot approve this lab directly');
select pg_temp.expect_error($$update public.lab_attempts set reviewed_at = now(), reviewed_by = auth.uid(), redo_requested = true where lab_key = 'lab-its-01-prove-it'$$,
  'official_grade_required', 'staff cannot return this lab directly');
select pg_temp.act_clear();
select pg_temp.act_as('5');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', pg_temp.scores(22,11,11,28,28))$$,
  'not_course_staff', 'another course''s instructor cannot grade it');
select pg_temp.act_clear();

-- ------------------------------------------------------------ the rule
select pg_temp.act_as('4');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved')$$, 'incomplete_scores', 'an empty score cannot be approved');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', pg_temp.scores(22,11,11,25,0))$$, 'approve_below_pass', '69 cannot be approved');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', pg_temp.scores(22,11,11,28,28), true, 'Reason.')$$, 'approve_below_pass', 'a critical error cannot be approved, whatever the points');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'returned', pg_temp.scores(22,11,11,28,28), true)$$, 'critical_reason_required', 'a critical error needs a reason');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(pg_temp.scores(22,11,11,28,20), '{4,justification}', '""'))$$, 'justification_required', 'partial credit needs a justification');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,earned}', '23'))$$, 'bad_points', 'points cannot pass a competency''s maximum');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,earned}', '-1'))$$, 'bad_points', 'points cannot be negative');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,points}', '40'), '{0,earned}', '40'))$$, 'bad_competencies', 'a rubric must total 100');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', pg_temp.scores(22,11,11,28,28) - 4)$$, 'bad_competencies', 'every competency is needed');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'returned')$$, 'note_required', 'a return needs a note');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,earned}', '21.5'))$$, 'bad_points', 'points must be whole numbers');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,earned}', '"22"'))$$, 'incomplete_scores', 'points must be numbers, not text');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(jsonb_set(jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,points}', '22.5'), '{0,earned}', '22.5'), '{1,points}', '10.5'))$$, 'bad_points', 'a competency''s maximum must be whole too');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(jsonb_set(jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,points}', '-22'), '{0,earned}', '-22'), '{1,points}', '133'))$$, 'bad_points', 'a negative maximum cannot make the rubric total 100');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', jsonb_set(jsonb_set(pg_temp.scores(22,11,11,28,28), '{0,points}', '122'), '{0,earned}', '122'))$$, 'bad_competencies', 'a total above 100 is refused');
select pg_temp.check(pg_get_function_arguments('public.record_lab_grade'::regproc) !~* '(total|score\M|pass|cap)', 'the browser cannot send a total, score, result or cap');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved',
    (select jsonb_agg(item || '{"official_score":100,"total":100,"passed":true}'::jsonb) from jsonb_array_elements(pg_temp.scores(22,11,11,25,0)) item))$$, 'approve_below_pass', 'extra score fields sent by the browser are ignored');
select pg_temp.act_clear();
select pg_temp.check((select count(*) = 0 from public.lab_attempt_grades) and (select reviewed_at is null from public.lab_attempts la join a using (id)), 'a refused decision saves nothing');

-- ------------------------------------------------------------ return, then one resubmission
select pg_temp.act_as('4');
select public.record_lab_grade((select id from a), 'returned', pg_temp.scores(22,11,11,28,28), true, 'Reason given.', null, 'What to change.');
select pg_temp.act_clear();
select pg_temp.check((select official_score = 69 and uncapped_total = 100 and critical_error from public.lab_attempt_grades), 'a critical error caps the score at 69');
select pg_temp.check((select redo_requested and reviewed_by = 'f0000000-0000-0000-0000-000000000004' from public.lab_attempts la join a using (id)), 'Return reopens the attempt, signed by the instructor');
select pg_temp.check(not pg_temp.verified('f0000000-0000-0000-0000-000000000001'), 'a return blocks completion');
select pg_temp.act_as('1');
select pg_temp.check((select official_score = 69 from public.lab_attempt_grades), 'the student reads the instructor''s score on a return');
select pg_temp.check((select count(*) = 2 from public.lab_attempt_feedback), 'and the notes');
select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 11:00+00');
select pg_temp.expect_error($$select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 11:05+00')$$, 'one_pending_submission', 'one return opens exactly one resubmission');
select pg_temp.act_clear();
select pg_temp.check(not pg_temp.verified('f0000000-0000-0000-0000-000000000001'), 'an ungraded resubmission does not complete the module');
select pg_temp.check((select count(*) = 2 from public.lab_attempts where lab_key = 'lab-its-01-prove-it') and (select count(*) = 1 from public.lab_attempt_grades), 'the earlier attempt and its grade are kept');
select pg_temp.act_as('4');
select pg_temp.expect_error($$select public.record_lab_grade((select id from a), 'approved', pg_temp.scores(22,11,11,28,28), false, null, null, null, 'Reason.')$$, 'not_newest', 'an older attempt cannot be decided');
select pg_temp.act_clear();

-- A return with no score shows no score.
select pg_temp.act_as('4');
savepoint no_score_critical;
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', '[]'::jsonb, true, 'A reason.');
select pg_temp.check((select official_score is null and critical_error from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')),
  'a critical error with no scores entered stores no score, not the cap');
rollback to savepoint no_score_critical;
select pg_temp.act_as('4');
savepoint low_critical;
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', pg_temp.scores(10,0,0,0,0), true, 'A reason.');
select pg_temp.check((select official_score = 10 and uncapped_total = 10 from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')),
  'the cap never raises a lower total');
rollback to savepoint low_critical;
select pg_temp.act_clear();
select pg_temp.act_as('4');
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', '[]'::jsonb, false, null, null, 'Please redo the reply.');
select pg_temp.act_clear();
select pg_temp.check((select official_score is null from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')), 'a return with no score entered stores no score');
select pg_temp.act_as('1');
select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 12:00+00');
select pg_temp.act_clear();

-- ------------------------------------------------------------ 70 passes
select pg_temp.act_as('4');
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'approved', pg_temp.scores(22,11,11,26,0), false, null, 'Efficient route.', null);
select pg_temp.act_clear();
select pg_temp.check((select official_score = 70 and decision = 'approved' from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')), '70 is approved');
select pg_temp.check(pg_temp.verified('f0000000-0000-0000-0000-000000000001'), '70 completes the module');
select pg_temp.check((select state = 'complete' from public.module_progress where user_id = 'f0000000-0000-0000-0000-000000000001' and module_key = 'its-01'), 'and module_progress follows');
select pg_temp.act_as('1');
select pg_temp.check((select official_score = 70 from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')), 'the student reads the final score after signing back in, from the server');
select pg_temp.check((select count(*) >= 1 from public.lab_attempt_feedback where item_label = 'Efficiency' and lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')), 'and the efficiency feedback');
select pg_temp.expect_error($$select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 13:00+00')$$, 'already_approved', 'a passed Prove It takes no more attempts');
select pg_temp.act_clear();
select pg_temp.act_as('2');
select pg_temp.check((select count(*) = 0 from public.lab_attempt_grades), 'another student reads no grades');
select pg_temp.check((select count(*) = 0 from public.lab_attempt_feedback), 'or notes');
select pg_temp.act_clear();

-- ------------------------------------------------------------ correction
select pg_temp.act_as('4');
select pg_temp.expect_error($$select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', '[]'::jsonb, false, null, null, 'A note.')$$, 'correction_reason_required', 'a correction needs a reason');
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000001'), 'returned', '[]'::jsonb, false, null, null, 'A note.', 'Approved by mistake.');
select pg_temp.act_clear();
select pg_temp.check(not pg_temp.verified('f0000000-0000-0000-0000-000000000001'), 'returning a passed attempt takes completion back');
select pg_temp.check((select count(*) = 2 from public.lab_attempt_grades where lab_attempt_id = pg_temp.latest('f0000000-0000-0000-0000-000000000001')), 'both decisions are kept');
select pg_temp.act_as('1');
select pg_temp.submit('f0000000-0000-0000-0000-000000000001', '2026-10-30 13:00+00');
select pg_temp.act_clear();
select pg_temp.check(not pg_temp.verified('f0000000-0000-0000-0000-000000000001'), 'an earlier pass does not count once a newer attempt exists');

-- ------------------------------------------------------------ records
-- Twelve complete modules fire the completion snapshot. Eleven are set up
-- directly; the twelfth arrives through a real approval.
alter table public.module_progress disable trigger module_progress_guard_completion;
insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, started_at, completed_at, reviewed_at, reviewed_by)
  select 'f0000000-0000-0000-0000-000000000003', r.track_code, r.lab_key, 'complete', 85, '{}'::jsonb, now(), now(), now(), 'f0000000-0000-0000-0000-000000000004'
  from public.course_module_labs r where r.track_code = 'HDESK' and r.gates_completion and r.module_key <> 'its-01';
alter table public.module_progress enable trigger module_progress_guard_completion;
select pg_temp.check((select count(*) = 11 from public.module_progress where user_id = 'f0000000-0000-0000-0000-000000000003' and state = 'complete'), 'eleven modules complete for the records check');
select pg_temp.act_clear();
insert into public.site_sessions (user_id, auth_session_id) values ('f0000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003');
select pg_temp.act_as('3');
select pg_temp.submit('f0000000-0000-0000-0000-000000000003', '2026-10-30 09:00+00');
select pg_temp.act_clear();
select pg_temp.act_as('4');
select public.record_lab_grade(pg_temp.latest('f0000000-0000-0000-0000-000000000003'), 'approved', pg_temp.scores(22,11,11,28,10));
select pg_temp.act_clear();
select pg_temp.check((select (lab->>'best_score')::numeric = 82 and (lab->>'ever_passed')::boolean
    from public.completion_reporting_snapshots s, jsonb_array_elements(s.lab_attempts_snapshot) lab
    where s.user_id = 'f0000000-0000-0000-0000-000000000003' and lab->>'lab_key' = 'lab-its-01-prove-it'),
  'the completion snapshot reports the official score and result');
select pg_temp.check((select (lab->>'best_score')::numeric = 85 and (lab->>'ever_passed')::boolean
    from public.completion_reporting_snapshots s, jsonb_array_elements(s.lab_attempts_snapshot) lab
    where s.user_id = 'f0000000-0000-0000-0000-000000000003' and lab->>'lab_key' = 'lab-its-02-vm-build'),
  'an unflagged lab reports its score as before');

-- ------------------------------------------------------------ every unflagged lab, every track
-- Five students per track, so each lab meets every kind of attempt, plus one
-- student per track with everything approved and no score.
create temp table matrix_students as
select ('a1' || lpad(t.n::text, 2, '0') || lpad(k::text, 4, '0') || '-0000-0000-0000-000000000000')::uuid as user_id, t.track_code, k
from (values ('SOCAN', 1), ('HDESK', 2), ('AIENG', 3), ('ELECT', 4)) t(track_code, n), generate_series(0, 5) k;
grant select on matrix_students to authenticated;
insert into auth.users (id, instance_id, aud, role, email)
  select user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', user_id || '@test.local' from matrix_students;
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor)
  select '99' || lpad((row_number() over ())::text, 8, '0') || '-' || track_code, user_id, track_code, true, false, false from matrix_students;
insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, started_at, completed_at, reviewed_at, reviewed_by, redo_requested)
select m.user_id, r.track_code, r.lab_key,
  (case when s.kind in (2, 3) then 'submitted' else 'complete' end)::public.progress_state,
  case s.kind when 1 then 85 when 2 then 50 when 3 then 69 when 4 then 70 end,
  case when s.kind = 5 then '{"case_record":{},"critical_errors":["x"]}'::jsonb else '{"case_record":{}}'::jsonb end,
  now(), now(),
  case when s.kind = 6 then null else now() end,
  case when s.kind = 6 then null else 'f0000000-0000-0000-0000-000000000004'::uuid end,
  s.kind = 7
from matrix_students m
join public.course_module_labs r on r.track_code = m.track_code and not r.requires_official_score
cross join lateral (select case when m.k = 5 then 0 else (row_number() over (order by r.lab_key) + m.k * 3 + abs(hashtext(r.lab_key))) % 8 end as kind) s;

-- The formula of 20261030175603, the view before this work.
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
join public.course_module_labs r on r.track_code = s.track_code and r.gates_completion
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
where not r.requires_official_score
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

select pg_temp.check((select count(distinct track_code) from old_view join matrix_students using (user_id, track_code)) = (select count(distinct track_code) from public.course_module_labs),
  'the comparison covers every track that has labs');
select pg_temp.check((select count(*) filter (where complete) > 0 and count(*) filter (where not complete) > 0 from old_view join matrix_students using (user_id, track_code)),
  'and both complete and incomplete modules');
select pg_temp.check(not exists (
    (select user_id, track_code, module_key, complete from old_view
     except
     select user_id, track_code, module_key, complete from public.student_verified_module_progress)
    union all
    (select user_id, track_code, module_key, complete from public.student_verified_module_progress v
       where not exists (select 1 from public.course_module_labs r where r.track_code = v.track_code and r.module_key = v.module_key and r.requires_official_score)
     except
     select user_id, track_code, module_key, complete from old_view)),
  'every unflagged lab of every track computes exactly what it did before');
select pg_temp.check((select bool_and(complete) from public.student_verified_module_progress v join matrix_students m using (user_id, track_code)
    where m.k = 5 and not (v.track_code = 'HDESK' and v.module_key = 'its-01') and v.module_key <> 'soc-01'),
  'on an unflagged lab, an approved attempt with an empty score still counts (no track flips)');

-- Direct review writes stay open on an unflagged lab.
select pg_temp.act_as('4');
update public.lab_attempts set reviewed_at = now(), reviewed_by = auth.uid(), redo_requested = true
  where user_id = (select user_id from matrix_students where track_code = 'HDESK' and k = 5) and lab_key = 'lab-its-03-blank-desktop';
select pg_temp.act_clear();
select pg_temp.check((select redo_requested from public.lab_attempts
    where user_id = (select user_id from matrix_students where track_code = 'HDESK' and k = 5) and lab_key = 'lab-its-03-blank-desktop'),
  'staff still decide an unflagged lab directly');

rollback;
\o
\echo 'hdesk_faculty_gate: all checks passed'

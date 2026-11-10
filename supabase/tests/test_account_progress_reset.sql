-- Regression test for 20261110120000_test_account_progress_reset.sql.
-- Admin-only, test-account-only progress reset: erase all, or erase the
-- selected modules only. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('d0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reset-admin@test.local'),
  ('d0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reset-test@test.local'),
  ('d0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reset-real@test.local'),
  ('d0000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','reset-inst@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000021-ADMIN',  'd0000000-0000-0000-0000-000000000001', 'ADMIN',     true, true,  false),
  ('9900000022-HDESK',  'd0000000-0000-0000-0000-000000000002', 'HDESK',     true, false, false),
  ('9900000023-HDESK',  'd0000000-0000-0000-0000-000000000003', 'HDESK',     true, false, false),
  ('9900000024-HDINST', 'd0000000-0000-0000-0000-000000000004', 'SOCANINST', true, false, true);

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

insert into public.site_sessions (user_id, auth_session_id) values
  ('d0000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000003');

-- Seed coursework for both HDESK learners: modules its-01..its-03, a lab
-- attempt per module, evidence and an hour award.
create function pg_temp.seed(p_user uuid) returns void language plpgsql as $$
begin
  insert into public.module_progress (user_id, module_key, track_code, state, percent)
  select p_user, m, 'HDESK', 'in_progress', 50 from unnest(array['its-01','its-02','its-03']) m;
  insert into public.lab_attempts (user_id, lab_key, track_code, state)
  values (p_user, 'lab-its-01-prove-it', 'HDESK', 'in_progress'),
         (p_user, 'lab-its-02-vm-build', 'HDESK', 'in_progress'),
         (p_user, 'lab-its-03-blank-desktop', 'HDESK', 'in_progress');
  insert into public.module_completion_evidence (user_id, track_code, module_key, evidence_key)
  select p_user, 'HDESK', m, 'ev-' || m from unnest(array['its-01','its-02','its-03']) m;
  insert into public.student_course_hour_awards
    (user_id, track_code, course_key, course_title_snapshot, credit_minutes, classification, curriculum_revision)
  select p_user, 'HDESK', m, m, 60, 'technical', 'test-rev' from unnest(array['its-01','its-02','its-03']) m;
  insert into public.capstone_submissions (user_id, track_code, stage, answers)
  values (p_user, 'HDESK', 1, '{}'::jsonb);
  -- A reviewed its-02 artifact: capstone_reviews -> portfolio_artifacts is
  -- ON DELETE RESTRICT, so the reset must delete the review first.
  with a as (
    insert into public.portfolio_artifacts (user_id, track_code, kind, title, module_key, lab_key)
    values (p_user, 'HDESK', 'module_assessment', 'its-02 assessment', 'its-02', 'lab-its-02-vm-build')
    returning id
  )
  insert into public.capstone_reviews (artifact_id, user_id, track_code, review_status)
  select id, p_user, 'HDESK', 'pending' from a;
  insert into public.lab_attempt_feedback (lab_attempt_id, created_by, item_label, comment)
  select id, p_user, 'Step 1', 'feedback' from public.lab_attempts where user_id = p_user and lab_key = 'lab-its-02-vm-build';
end $$;
select pg_temp.seed('d0000000-0000-0000-0000-000000000002');
select pg_temp.seed('d0000000-0000-0000-0000-000000000003');

-- Evidence files in Storage: <track>/<user>/<module>/<lab>/<attempt>/<file>.
insert into storage.objects (bucket_id, name) values
  ('lab-evidence', 'HDESK/d0000000-0000-0000-0000-000000000002/its-01/lab-its-01-prove-it/a0000000-0000-0000-0000-000000000001/shot.png'),
  ('lab-evidence', 'HDESK/d0000000-0000-0000-0000-000000000002/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000002/shot.png'),
  ('lab-evidence', 'HDESK/d0000000-0000-0000-0000-000000000002/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000002/proof.png'),
  ('lab-evidence', 'HDESK/d0000000-0000-0000-0000-000000000003/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000003/shot.png');

-- Act as a given account through the real PostgREST role.
create function pg_temp.as_user(p_user text) returns void language plpgsql as $$
begin
  -- session_id: writes require a registered site session (as in the app).
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated',
    'session_id', 'e2000000-0000-0000-0000-00000000000' || right(p_user, 1))::text, true);
end $$;

-- Deletes storage objects the CURRENT role may delete (RLS applies), as
-- Storage's remove() does; returns how many went.
create function pg_temp.delete_objects(p_names text[]) returns integer language plpgsql as $$
declare v integer;
begin
  delete from storage.objects where bucket_id = 'lab-evidence' and name = any(p_names);
  get diagnostics v = row_count;
  return v;
end $$;

create function pg_temp.count_for(p_user uuid, p_table text) returns integer language plpgsql as $$
declare v integer;
begin
  execute format('select count(*) from public.%I where user_id = $1', p_table) into v using p_user;
  return v;
end $$;

-- ------------------------------------------------------------ defaults
select pg_temp.check(
  (select not is_test_account from public.students where student_id = '9900000022-HDESK'),
  'new accounts are not test accounts');

-- ------------------------------------------------------------ guards
select pg_temp.as_user('d0000000-0000-0000-0000-000000000003');
set local role authenticated;
select pg_temp.expect_error($$select public.admin_set_test_account('9900000023-HDESK', true)$$,
  'a learner cannot mark a test account');
select pg_temp.expect_error($$select public.admin_reset_test_progress('9900000023-HDESK')$$,
  'a learner cannot reset progress');
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000023-HDESK'$$,
  'a learner cannot set the flag directly');
reset role;

select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
set local role authenticated;
select pg_temp.expect_error($$select public.admin_reset_test_progress('9900000023-HDESK')$$,
  'admin cannot reset a real (non-test) account');
select pg_temp.expect_error($$select public.admin_set_test_account('9900000024-HDINST', true)$$,
  'an instructor cannot be marked as a test account');
select pg_temp.expect_error($$select public.admin_set_test_account('9900000021-ADMIN', true)$$,
  'an admin cannot be marked as a test account');
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000023-HDESK'$$,
  'an admin cannot set the flag by direct update (RPC only)');
select pg_temp.expect_error($$select public.admin_set_test_account('0000000000-NOPE', true)$$,
  'unknown account is refused');
select pg_temp.expect_error($$select public.admin_test_evidence_paths('9900000023-HDESK')$$,
  'admin cannot list a real account''s evidence');
select pg_temp.check(
  (select count(*) = 0 from storage.objects where name like 'HDESK/d0000000-0000-0000-0000-000000000003/%'),
  'admin cannot see a real account''s evidence files');
select pg_temp.check(
  pg_temp.delete_objects(array[
    'HDESK/d0000000-0000-0000-0000-000000000003/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000003/shot.png']) = 0,
  'admin cannot delete a real account''s evidence files');

select public.admin_set_test_account('9900000022-HDESK', true);
select pg_temp.expect_error($$select public.admin_reset_test_progress('9900000022-HDESK', '{}'::text[])$$,
  'an empty module list is refused');

-- ------------------------------------------------------------ module reset
select public.admin_reset_test_progress('9900000022-HDESK', array['its-02'], array['lab-its-02-device-manager'], false);
select pg_temp.check(
  (select array_agg(p) = array[
     'HDESK/d0000000-0000-0000-0000-000000000002/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000002/proof.png',
     'HDESK/d0000000-0000-0000-0000-000000000002/its-02/lab-its-02-vm-build/a0000000-0000-0000-0000-000000000002/shot.png']
   from public.admin_test_evidence_paths('9900000022-HDESK', array['its-02']) p),
  'module mode lists only the test account''s its-02 evidence');
select pg_temp.check(
  (select count(*) = 3 from public.admin_test_evidence_paths('9900000022-HDESK', null)),
  'erase-all mode lists all of the test account''s evidence');
-- What storage.from('lab-evidence').remove(paths) does: read + delete.
select pg_temp.check(
  pg_temp.delete_objects(array(select public.admin_test_evidence_paths('9900000022-HDESK', array['its-02']))) = 2,
  'admin can delete the test account''s its-02 evidence files');
reset role;

select pg_temp.check(
  (select array_agg(module_key order by module_key) = array['its-01','its-03']
   from public.module_progress where user_id = 'd0000000-0000-0000-0000-000000000002'),
  'module reset erases only its-02 progress; its-01 and later its-03 stay');
select pg_temp.check(
  (select array_agg(lab_key order by lab_key) = array['lab-its-01-prove-it','lab-its-03-blank-desktop']
   from public.lab_attempts where user_id = 'd0000000-0000-0000-0000-000000000002'),
  'module reset erases only its-02 lab attempts');
select pg_temp.check(
  pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'portfolio_artifacts') = 0
  and pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'capstone_reviews') = 0,
  'module reset erases the its-02 artifact and its review (review first)');
select pg_temp.check(
  (select count(*) = 1 from public.lab_attempt_feedback f join public.lab_attempts la on la.id = f.lab_attempt_id
   where la.user_id = 'd0000000-0000-0000-0000-000000000003'),
  'feedback on the real learner''s attempt survives');
select pg_temp.check(pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'module_completion_evidence') = 2,
  'module reset erases only its-02 evidence');
select pg_temp.check(pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'student_course_hour_awards') = 2,
  'module reset erases only its-02 hour award');
select pg_temp.check(pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'capstone_submissions') = 1,
  'module reset without the capstone keeps capstone submissions');
select pg_temp.check(
  (select progress_reset_at is not null and progress_reset_modules = array['its-02']
   from public.students where student_id = '9900000022-HDESK'),
  'module reset stamps the browser-reset marker with the module list');
select pg_temp.check(
  (select scope = 'modules' and module_keys = array['its-02'] and (deleted_counts->>'module_progress')::int = 1
          and reset_by = 'd0000000-0000-0000-0000-000000000001'
   from public.test_account_progress_resets where student_id = '9900000022-HDESK'),
  'module reset is logged with counts and the admin who ran it');

-- ------------------------------------------------------------ erase all
select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
set local role authenticated;
select public.admin_reset_test_progress('9900000022-HDESK');
reset role;

select pg_temp.check(
  pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'module_progress')
  + pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'lab_attempts')
  + pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'module_completion_evidence')
  + pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'student_course_hour_awards')
  + pg_temp.count_for('d0000000-0000-0000-0000-000000000002', 'capstone_submissions') = 0,
  'erase all clears every coursework table');
select pg_temp.check(
  (select progress_reset_modules is null and is_enrolled and is_test_account
   from public.students where student_id = '9900000022-HDESK'),
  'erase all keeps the account, enrollment and test flag; marker means all modules');
select pg_temp.check(
  (select count(*) = 2 from public.test_account_progress_resets where student_id = '9900000022-HDESK'),
  'both resets are logged');

-- ------------------------------------------------------------ the real account is untouched
select pg_temp.check(
  (select count(*) = 1 from storage.objects where name like 'HDESK/d0000000-0000-0000-0000-000000000002/its-01/%')
  and (select count(*) = 1 from storage.objects where name like 'HDESK/d0000000-0000-0000-0000-000000000003/%'),
  'its-01 test evidence and the real learner''s evidence survive');
select pg_temp.check(
  pg_temp.count_for('d0000000-0000-0000-0000-000000000003', 'module_progress') = 3
  and pg_temp.count_for('d0000000-0000-0000-0000-000000000003', 'lab_attempts') = 3
  and pg_temp.count_for('d0000000-0000-0000-0000-000000000003', 'capstone_submissions') = 1,
  'the non-test learner''s records are untouched');

-- ------------------------------------------------------------ reads
select pg_temp.as_user('d0000000-0000-0000-0000-000000000002');
set local role authenticated;
select pg_temp.check(
  (select progress_reset_at is not null from public.students where student_id = '9900000022-HDESK'),
  'a learner can read their own reset marker');
select pg_temp.check(
  (select count(*) = 0 from public.test_account_progress_resets),
  'a learner cannot read the reset log');
select pg_temp.expect_error($$select public.admin_test_evidence_paths('9900000022-HDESK')$$,
  'a learner cannot list evidence through the admin function');
reset role;

select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
set local role authenticated;
select public.admin_set_test_account('9900000022-HDESK', false);
select pg_temp.expect_error($$select public.admin_reset_test_progress('9900000022-HDESK')$$,
  'unmarking a test account blocks further resets');
select pg_temp.check(
  pg_temp.delete_objects(array[
    'HDESK/d0000000-0000-0000-0000-000000000002/its-01/lab-its-01-prove-it/a0000000-0000-0000-0000-000000000001/shot.png']) = 0,
  'unmarking a test account also blocks deleting its evidence');
reset role;

\o
\echo 'test_account_progress_reset: all checks passed'
rollback;

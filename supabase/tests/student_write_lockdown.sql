-- Regression test for 20261005120000_instructor_approval_gate_and_write_lockdown.sql.
-- Impersonates real API roles (role + request.jwt.claims, exactly what
-- PostgREST sets), asserts each rule, and rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('a0000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lockdown-student@test.local'),
  ('a0000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lockdown-admin@test.local'),
  ('a0000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lockdown-instructor@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000001-SOCAN',     'a0000000-0000-0000-0000-000000000001', 'SOCAN',     true, false, false),
  ('9900000002-ADMIN',     'a0000000-0000-0000-0000-000000000002', 'ADMIN',     true, true,  false),
  ('9900000003-SOCANINST', 'a0000000-0000-0000-0000-000000000003', 'SOCANINST', true, false, true);
insert into public.faculty_course_assignments (user_id, track_code, active)
  values ('a0000000-0000-0000-0000-000000000003', 'SOCAN', true);

-- Expect a statement to fail with insufficient_privilege (42501).
create function pg_temp.expect_denied(p_sql text, p_label text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL %: statement was allowed', p_label;
exception when insufficient_privilege then
  raise notice 'ok   %', p_label;
end $$;
-- Expect a statement to raise any error at all.
create function pg_temp.expect_error(p_sql text, p_label text) returns void language plpgsql as $$
declare v_failed boolean := false;
begin
  begin execute p_sql; exception when others then v_failed := true; end;
  if not v_failed then raise exception 'FAIL %: statement succeeded', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
grant execute on all functions in schema pg_temp to authenticated, anon;

-- ================================================================ student
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- The full-course forgery that worked before the fix.
insert into public.lab_attempts (user_id, lab_key, track_code, state, score, result, pass_threshold, completed_at, reviewed_at, reviewed_by, redo_requested)
select auth.uid(), lab_key, 'SOCAN', 'complete', 100,
       '{"simulator_performance":{"actions":[1]}}'::jsonb, 0, now(), now(), auth.uid(), false
from public.course_module_labs where track_code = 'SOCAN';

select pg_temp.check((select count(*) = 0 from public.lab_attempts where user_id = auth.uid() and (reviewed_at is not null or reviewed_by is not null)),
  'student insert cannot carry review fields');
select pg_temp.check((select bool_and(pass_threshold = 70) from public.lab_attempts where user_id = auth.uid()),
  'student insert cannot set its own pass_threshold');
select pg_temp.check((select count(*) filter (where complete) = 0 from public.student_verified_module_progress where user_id = auth.uid()),
  'self-scored attempts verify no module');

select pg_temp.expect_denied($$update public.lab_attempts set score = 1 where user_id = auth.uid()$$, 'student cannot rewrite a score');
select pg_temp.expect_denied($$delete from public.lab_attempts where user_id = auth.uid()$$, 'student cannot delete attempt history');
update public.lab_attempts set reviewed_at = now(), reviewed_by = auth.uid() where user_id = auth.uid();
select pg_temp.check((select count(*) = 0 from public.lab_attempts where user_id = auth.uid() and reviewed_at is not null),
  'student cannot approve own attempt by update');

select pg_temp.expect_denied($$insert into public.module_progress (user_id, track_code, module_key, admin_override) values (auth.uid(), 'SOCAN', 'soc-03', true)$$,
  'student cannot insert admin_override');
select pg_temp.expect_denied($$update public.module_progress set admin_override = true where user_id = auth.uid()$$,
  'student cannot update admin_override');

-- The portal's own writes keep working (upsertModuleProgress / case_state).
insert into public.module_progress (user_id, track_code, module_key, state, started_at, detail, case_state)
  values (auth.uid(), 'SOCAN', 'soc-02', 'in_progress', now(), '{"x":1}', '{}')
  on conflict (user_id, module_key) do update set user_id = excluded.user_id, track_code = excluded.track_code,
    module_key = excluded.module_key, state = excluded.state, started_at = excluded.started_at, detail = excluded.detail;
update public.module_progress set case_state = '{"lab":{}}' where user_id = auth.uid() and module_key = 'soc-02';
select pg_temp.check((select case_state ? 'lab' from public.module_progress where user_id = auth.uid() and module_key = 'soc-02'),
  'portal progress upsert and case_state update still work');

insert into public.portfolio_artifacts (user_id, track_code, module_key, lab_key, kind, title, content, submitted_by)
  values (auth.uid(), 'SOCAN', 'soc-03', 'lab-siem-triage', 'capstone_report', 't', '{"text":"original"}', auth.uid());
select pg_temp.expect_denied($$update public.portfolio_artifacts set content = '{"text":"edited"}' where user_id = auth.uid()$$,
  'student cannot edit a submitted artifact');
select pg_temp.expect_denied($$delete from public.portfolio_artifacts where user_id = auth.uid()$$,
  'student cannot delete a submitted artifact');

-- ============================================================ instructor
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select pg_temp.expect_denied($$update public.lab_attempts set score = 0 where track_code = 'SOCAN'$$,
  'instructor cannot rewrite a learner score');
select pg_temp.expect_error($$update public.lab_attempts set reviewed_at = now(), reviewed_by = 'a0000000-0000-0000-0000-000000000002' where track_code = 'SOCAN'$$,
  'instructor cannot sign a review as someone else');

-- Approve soc-02's only lab: the next module should unlock immediately.
update public.lab_attempts set reviewed_at = now(), reviewed_by = auth.uid(), redo_requested = false
  where user_id = 'a0000000-0000-0000-0000-000000000001' and lab_key = 'lab-identity-investigation';

-- ================================================================ checks
reset role;
select pg_temp.check((select complete from public.student_verified_module_progress
  where user_id = 'a0000000-0000-0000-0000-000000000001' and module_key = 'soc-02'),
  'instructor approval verifies the module');
select pg_temp.check((select state = 'complete' from public.module_progress
  where user_id = 'a0000000-0000-0000-0000-000000000001' and module_key = 'soc-02'),
  'approval completes module_progress immediately (unlocks next module)');
select pg_temp.check((select count(*) = 1 from public.student_course_hour_awards
  where user_id = 'a0000000-0000-0000-0000-000000000001'),
  'credit hours awarded only for the approved module');

-- ===================================================== scheduled jobs
-- These guards test session_user, so impersonate the real PostgREST login
-- role (authenticator) rather than only switching current_user.
set session authorization authenticator;
set local role anon;
select pg_temp.expect_denied($$select public.close_idle_site_sessions()$$, 'anon cannot run close_idle_site_sessions');
select pg_temp.expect_denied($$select public.archive_expired_cohorts()$$, 'anon cannot run archive_expired_cohorts');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select pg_temp.expect_error($$select public.close_idle_site_sessions()$$, 'student cannot run close_idle_site_sessions');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select public.archive_expired_cohorts();
select pg_temp.check(true, 'admin can still run the archive sweep');

rollback;
\o
\echo 'student_write_lockdown: all checks passed'

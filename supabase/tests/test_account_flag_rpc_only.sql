-- Regression test for 20261112120000_test_account_flag_rpc_only.sql
-- (on top of 20261110120000_test_account_progress_reset.sql): the
-- test-account fields change only through the admin functions, and other
-- admin edits to a student still work. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;
insert into auth.users (id, instance_id, aud, role, email) values
  ('d1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flag-admin@test.local'),
  ('d1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flag-test@test.local'),
  ('d1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flag-real@test.local'),
  ('d1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flag-inst@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000031-ADMIN',  'd1000000-0000-0000-0000-000000000001', 'ADMIN',     true, true,  false),
  ('9900000032-HDESK',  'd1000000-0000-0000-0000-000000000002', 'HDESK',     true, false, false),
  ('9900000033-HDESK',  'd1000000-0000-0000-0000-000000000003', 'HDESK',     true, false, false),
  ('9900000034-HDINST', 'd1000000-0000-0000-0000-000000000004', 'SOCANINST', true, false, true);
insert into public.site_sessions (user_id, auth_session_id) values
  ('d1000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000003', 'e3000000-0000-0000-0000-000000000003');

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
-- Runs p_sql and checks it changed exactly one row (an admin edit that RLS
-- silently filtered would show 0).
create function pg_temp.expect_one_row(p_sql text, p_label text) returns void language plpgsql as $$
declare v integer;
begin
  execute p_sql;
  get diagnostics v = row_count;
  if v <> 1 then raise exception 'FAIL %: % rows changed', p_label, v; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.as_user(p_user text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated',
    'session_id', 'e3000000-0000-0000-0000-00000000000' || right(p_user, 1))::text, true);
end $$;

-- ------------------------------------------------------------ admin, through the API role
select pg_temp.as_user('d1000000-0000-0000-0000-000000000001');
set local role authenticated;

select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000033-HDESK'$$,
  'an admin cannot set the flag by direct update (RPC only)');
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000034-HDINST'$$,
  'an admin cannot flag an instructor by direct update');
select pg_temp.expect_error($$update public.students set progress_reset_at = now() where student_id = '9900000033-HDESK'$$,
  'an admin cannot stamp progress_reset_at directly');
select pg_temp.expect_error($$update public.students set progress_reset_modules = array['its-01'] where student_id = '9900000033-HDESK'$$,
  'an admin cannot stamp progress_reset_modules directly');

select public.admin_set_test_account('9900000032-HDESK', true);
select pg_temp.check((select is_test_account from public.students where student_id = '9900000032-HDESK'),
  'admin_set_test_account() still sets the flag');
select pg_temp.expect_error($$update public.students set is_test_account = false where student_id = '9900000032-HDESK'$$,
  'an admin cannot clear the flag by direct update either');

-- Other admin edits are unchanged, on test and real accounts alike.
select pg_temp.expect_one_row($$update public.students set is_enrolled = false where student_id = '9900000033-HDESK'$$,
  'admin can still disenroll a real student');
select pg_temp.expect_one_row($$update public.students set is_enrolled = true where student_id = '9900000033-HDESK'$$,
  'admin can still re-enroll a real student');
select pg_temp.expect_one_row($$update public.students set is_enrolled = false where student_id = '9900000032-HDESK'$$,
  'admin can still disenroll a test account');
select pg_temp.expect_one_row($$update public.students set first_name = 'Testy', last_name = 'Account' where student_id = '9900000032-HDESK'$$,
  'admin can still edit a test account''s name');
select pg_temp.expect_one_row($$update public.students set is_test_account = true, first_name = 'Same' where student_id = '9900000032-HDESK'$$,
  'writing the flag''s current value alongside another column is not a change');

select public.admin_reset_test_progress('9900000032-HDESK');
select pg_temp.check((select progress_reset_at is not null and progress_reset_modules is null
                      from public.students where student_id = '9900000032-HDESK'),
  'admin_reset_test_progress() still stamps the reset marker');

select public.admin_set_test_account('9900000032-HDESK', false);
select pg_temp.check((select not is_test_account from public.students where student_id = '9900000032-HDESK'),
  'admin_set_test_account() still clears the flag');
select pg_temp.expect_error($$select public.admin_set_test_account('9900000034-HDINST', true)$$,
  'admin_set_test_account() still refuses an instructor');
reset role;

-- ------------------------------------------------------------ learner
select pg_temp.as_user('d1000000-0000-0000-0000-000000000003');
set local role authenticated;
do $$ begin
  update public.students set is_test_account = true where student_id = '9900000033-HDESK';
exception when others then null;
end $$;
select pg_temp.check((select not is_test_account from public.students where student_id = '9900000033-HDESK'),
  'a learner cannot set their own flag');
reset role;

-- ------------------------------------------------------------ every caller (SQL editor, service role)
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000034-HDINST'$$,
  'the SQL editor cannot flag an instructor');
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000031-ADMIN'$$,
  'the SQL editor cannot flag an admin');
update public.students set is_test_account = true where student_id = '9900000033-HDESK';
select pg_temp.expect_error($$update public.students set is_instructor = true where student_id = '9900000033-HDESK'$$,
  'a test account cannot be promoted to instructor while flagged');
select pg_temp.expect_error($$update public.students set is_admin = true where student_id = '9900000033-HDESK'$$,
  'a test account cannot be promoted to admin while flagged');
select pg_temp.expect_one_row($$update public.students set is_test_account = false where student_id = '9900000033-HDESK'$$,
  'the SQL editor can still change the flag on a learner');

set local role service_role;
select pg_temp.expect_one_row($$update public.students set is_test_account = true where student_id = '9900000033-HDESK'$$,
  'the service role can still change the flag on a learner');
select pg_temp.expect_error($$update public.students set is_test_account = true where student_id = '9900000034-HDINST'$$,
  'the service role cannot flag an instructor');
reset role;

-- A row already in the refused state (from before this migration) does not
-- block unrelated writes to it.
alter table public.students disable trigger students_test_account_columns_guard;
update public.students set is_test_account = true where student_id = '9900000034-HDINST';
alter table public.students enable trigger students_test_account_columns_guard;
select pg_temp.expect_one_row($$update public.students set first_name = 'Inst' where student_id = '9900000034-HDINST'$$,
  'an existing flagged instructor row still takes unrelated edits');

\o
select 'test_account_flag_rpc_only: all checks passed' as result;
rollback;

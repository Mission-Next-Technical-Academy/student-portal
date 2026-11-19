-- Regression test for 20261119202617_instructor_guides.sql: an instructor
-- guide (which holds answer keys) is readable only by admins and by the
-- instructors assigned to that track. Students, other-course instructors,
-- inactive assignments and signed-out visitors read nothing, and no API role
-- can write. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh
-- Any failed expectation raises and the script exits non-zero.

\set ON_ERROR_STOP on
\o /dev/null
begin;
insert into auth.users (id, instance_id, aud, role, email) values
  ('d2000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide-admin@test.local'),
  ('d2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide-socinst@test.local'),
  ('d2000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide-hdinst@test.local'),
  ('d2000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide-student@test.local'),
  ('d2000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','guide-oldinst@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000041-ADMIN',     'd2000000-0000-0000-0000-000000000001', 'ADMIN',     true, true,  false),
  ('9900000042-SOCANINST', 'd2000000-0000-0000-0000-000000000002', 'SOCANINST', true, false, true),
  ('9900000043-HDINST',    'd2000000-0000-0000-0000-000000000003', 'HDINST',    true, false, true),
  ('9900000044-SOCAN',     'd2000000-0000-0000-0000-000000000004', 'SOCAN',     true, false, false),
  ('9900000045-SOCANINST', 'd2000000-0000-0000-0000-000000000005', 'SOCANINST', true, false, true);
insert into public.faculty_course_assignments (user_id, track_code, active) values
  ('d2000000-0000-0000-0000-000000000002', 'SOCAN', true),
  ('d2000000-0000-0000-0000-000000000003', 'HDESK', true),
  ('d2000000-0000-0000-0000-000000000005', 'SOCAN', false);
insert into public.instructor_guides (track_code, content) values
  ('SOCAN', '{"weeks": [], "modules": {"M01": {"name": "test"}}}'),
  ('HDESK', '{"weeks": []}');

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
create function pg_temp.as_user(p_user text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end $$;
create function pg_temp.visible() returns text language sql as $$
  select coalesce(string_agg(track_code, ',' order by track_code), '') from public.instructor_guides
$$;

-- ------------------------------------------------------------ admin
select pg_temp.as_user('d2000000-0000-0000-0000-000000000001');
set local role authenticated;
select pg_temp.check(pg_temp.visible() = 'HDESK,SOCAN', 'an admin reads every course guide');
select pg_temp.expect_error($$insert into public.instructor_guides (track_code, content) values ('AIENG', '{}')$$,
  'an admin cannot insert a guide through the API');
select pg_temp.expect_error($$update public.instructor_guides set note = 'x' where track_code = 'SOCAN'$$,
  'an admin cannot update a guide through the API');
select pg_temp.expect_error($$delete from public.instructor_guides where track_code = 'SOCAN'$$,
  'an admin cannot delete a guide through the API');
reset role;

-- ------------------------------------------------------------ SOC instructor
select pg_temp.as_user('d2000000-0000-0000-0000-000000000002');
set local role authenticated;
select pg_temp.check(pg_temp.visible() = 'SOCAN', 'the SOC instructor reads only the SOC guide');
select pg_temp.expect_error($$update public.instructor_guides set note = 'x' where track_code = 'SOCAN'$$,
  'the SOC instructor cannot change the guide');
reset role;

-- ------------------------------------------------------------ other-course instructor
select pg_temp.as_user('d2000000-0000-0000-0000-000000000003');
set local role authenticated;
select pg_temp.check(pg_temp.visible() = 'HDESK', 'the Help Desk instructor cannot read the SOC guide');
reset role;

-- ------------------------------------------------------------ inactive assignment
select pg_temp.as_user('d2000000-0000-0000-0000-000000000005');
set local role authenticated;
select pg_temp.check(pg_temp.visible() = '', 'an instructor with an inactive assignment reads nothing');
reset role;

-- ------------------------------------------------------------ student
select pg_temp.as_user('d2000000-0000-0000-0000-000000000004');
set local role authenticated;
select pg_temp.check(pg_temp.visible() = '', 'a SOC student reads no guide');
select pg_temp.expect_error($$insert into public.instructor_guides (track_code, content) values ('SOCAN', '{}')$$,
  'a student cannot write a guide');
reset role;

-- ------------------------------------------------------------ signed out
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
select pg_temp.expect_error($$select * from public.instructor_guides$$,
  'a signed-out visitor cannot read the table at all');
reset role;

\o
\echo instructor_guides: all checks passed
rollback;

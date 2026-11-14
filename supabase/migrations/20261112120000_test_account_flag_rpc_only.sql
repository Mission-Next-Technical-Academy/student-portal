-- Test-account flag: only the admin functions can change it.
--
-- 20261110120000_test_account_progress_reset.sql added
-- students.is_test_account, progress_reset_at and progress_reset_modules,
-- and meant them to change only through admin_set_test_account() and
-- admin_reset_test_progress(). But the existing students_admin_update policy
-- lets an administrator update any column of any students row, so a direct
-- API call (PATCH /rest/v1/students) could set is_test_account on any
-- account, including an admin or instructor, without those functions'
-- checks. (The reset and evidence functions still refuse admin and
-- instructor accounts on their own; this closes the gap at the flag.)
--
-- This trigger refuses, for the API roles (authenticated, anon):
--   * any change to is_test_account, progress_reset_at or
--     progress_reset_modules made directly, not through those functions.
--     They are SECURITY DEFINER, so inside them current_user is the
--     function owner, not an API role, and their updates pass.
-- and, for every caller (the API, the service role, the SQL editor):
--   * making a row both a test account and an admin or instructor (setting
--     the flag on one, or promoting a test account). Unmark it first.
-- Every other column (enrollment, names, track, ...) is untouched: admin
-- edits such as the enrolled/disenrolled toggle work as before.
--
-- Rollback note:
--   drop trigger if exists students_test_account_columns_guard on public.students;
--   drop function if exists public.students_test_account_columns_guard();

create or replace function public.students_test_account_columns_guard()
returns trigger
language plpgsql
-- SECURITY INVOKER (the default) on purpose: current_user must be the
-- caller, so a direct API write is told apart from the admin functions.
set search_path = public
as $$
begin
  -- Checked only when one of the three flags is being set, so a row that is
  -- somehow already in this state never blocks unrelated writes to it.
  if new.is_test_account and (new.is_admin or new.is_instructor)
     and (tg_op = 'INSERT'
          or new.is_test_account is distinct from old.is_test_account
          or new.is_admin is distinct from old.is_admin
          or new.is_instructor is distinct from old.is_instructor) then
    raise exception 'Admin and instructor accounts cannot be marked as test accounts'
      using errcode = '22023', hint = 'unmark_test_account_first';
  end if;

  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.is_test_account or new.progress_reset_at is not null or new.progress_reset_modules is not null then
        raise exception 'Test-account fields can only be set through admin_set_test_account() and admin_reset_test_progress()'
          using errcode = '42501', hint = 'test_account_rpc_only';
      end if;
    elsif new.is_test_account is distinct from old.is_test_account
       or new.progress_reset_at is distinct from old.progress_reset_at
       or new.progress_reset_modules is distinct from old.progress_reset_modules then
      raise exception 'Test-account fields can only be changed through admin_set_test_account() and admin_reset_test_progress()'
        using errcode = '42501', hint = 'test_account_rpc_only';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.students_test_account_columns_guard() from public, anon, authenticated;

drop trigger if exists students_test_account_columns_guard on public.students;
create trigger students_test_account_columns_guard
  before insert or update on public.students
  for each row execute function public.students_test_account_columns_guard();

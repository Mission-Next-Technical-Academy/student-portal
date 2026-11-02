-- MNT Academy — first/last name shown next to every account number.
-- docs/workstreams/ACCOUNT_DISPLAY_NAMES.md.
--
-- The account number (e.g. 1625151945-HDESK) is public.students.student_id.
-- public.profiles was dropped by 20260828160000_simplify_schema.sql, so the
-- names live on public.students, the only identity table.
--
-- Read access needs no policy change: students_self_read,
-- students_admin_read and students_assigned_instructor_read already expose a
-- row (and so its new columns, via the table-level select grant) to exactly
-- the viewers who may see that account's number. Writes stay closed: the only
-- column-level update grant on students is is_enrolled, so names change only
-- through admin_set_account_name() below.
--
-- Rollback: drop function public.admin_set_account_name(uuid, text, text);
-- alter table public.students drop constraint students_first_name_check,
-- drop constraint students_last_name_check, drop column first_name,
-- drop column last_name;

alter table public.students
  add column if not exists first_name text,
  add column if not exists last_name  text;

alter table public.students
  add constraint students_first_name_check
    check (first_name is null or (first_name = btrim(first_name) and char_length(first_name) between 1 and 80)),
  add constraint students_last_name_check
    check (last_name is null or (last_name = btrim(last_name) and char_length(last_name) between 1 and 80));

comment on column public.students.first_name is
  'Display first name shown beside the account number. Written only by admin_set_account_name().';
comment on column public.students.last_name is
  'Display last name shown beside the account number. Written only by admin_set_account_name().';

-- Every existing account (students, instructors, admins) is a synthetic test
-- account until an admin sets a real name.
update public.students
set first_name = 'Test', last_name = 'Account'
where first_name is null or last_name is null;

-- Admin-only name edit. Uses the repo's single admin check, is_admin().
create or replace function public.admin_set_account_name(
  p_user_id uuid,
  p_first_name text,
  p_last_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first text := btrim(coalesce(p_first_name, ''));
  v_last  text := btrim(coalesce(p_last_name, ''));
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can set an account name'
      using errcode = '42501';
  end if;

  if char_length(v_first) not between 1 and 80
     or char_length(v_last) not between 1 and 80 then
    raise exception 'First and last name are each required (1-80 characters)'
      using errcode = '22023';
  end if;

  update public.students
  set first_name = v_first, last_name = v_last
  where user_id = p_user_id;

  if not found then
    raise exception 'No account found for that user'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_account_name(uuid, text, text) from public, anon;
grant execute on function public.admin_set_account_name(uuid, text, text) to authenticated;

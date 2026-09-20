-- One-shot data fix: the account for 7634107909-socan@missionnext.example
-- was displaying its login ID with a lowercase track-code suffix
-- ("...-socan") and, in the app, sometimes the full synthetic email with
-- domain — instead of the uppercase convention every other account uses
-- (e.g. "8987495051-SOCAN"). The app-side leak (falling back to the raw
-- session email when no students row is found) is already fixed in
-- portal/app.js (emailToDisplayId()). This migration fixes the underlying
-- data so the real, correctly-cased student_id is what the app reads.
--
-- Handles both possible root causes so this is safe to run without a
-- prior live read of the row:
--   (a) the students row already exists with a lowercase suffix, or
--   (b) the students row is missing entirely — a known "auth user created
--       but students row insert failed" gap, see
--       supabase/functions/admin-provision/provisioning.ts.
--
-- Idempotent: safe to re-run: does nothing once the row already has the
-- correct casing.

do $$
declare
  v_user_id uuid;
  v_old_student_id text;
  v_new_student_id text := '7634107909-SOCAN';
  v_has_credentials boolean;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower('7634107909-socan@missionnext.example');

  if v_user_id is null then
    raise notice 'No auth user found for 7634107909-socan@missionnext.example — nothing to fix.';
    return;
  end if;

  select student_id into v_old_student_id
  from public.students
  where user_id = v_user_id;

  if v_old_student_id is null then
    -- Case (b): orphaned auth user, no students row at all. Enrolled true
    -- (not the ad hoc-create default of false) because this account is
    -- already visibly in active use — adjust manually if that's wrong for
    -- this specific account.
    insert into public.students
      (student_id, user_id, track_code, is_admin, is_instructor, cohort_id, is_enrolled)
    values
      (v_new_student_id, v_user_id, 'SOCAN', false, false, null, true);
    raise notice 'Inserted missing students row for %.', v_new_student_id;

  elsif v_old_student_id <> v_new_student_id then
    -- Case (a): row exists with the wrong casing. student_credentials is
    -- the only table with a real foreign key on students.student_id (every
    -- progress table keys on the stable user_id instead) — repoint it
    -- before renaming the primary key value, since the FK isn't declared
    -- deferrable.
    select exists (
      select 1 from public.student_credentials where student_id = v_old_student_id
    ) into v_has_credentials;

    if v_has_credentials then
      alter table public.student_credentials disable trigger all;
      update public.student_credentials
        set student_id = v_new_student_id
        where student_id = v_old_student_id;
      alter table public.student_credentials enable trigger all;
    end if;

    update public.students
      set student_id = v_new_student_id
      where user_id = v_user_id;
    raise notice 'Renamed % to %.', v_old_student_id, v_new_student_id;

  else
    raise notice 'students row already has the correct casing (%). Nothing to do.', v_new_student_id;
  end if;
end $$;

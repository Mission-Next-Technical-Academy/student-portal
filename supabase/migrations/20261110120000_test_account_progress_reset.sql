-- Test-account progress reset (owner request 2026-11-10).
--
-- Lets an administrator erase coursework progress for accounts an admin has
-- explicitly marked as TEST accounts. Two modes:
--   * erase all progress for one student, or
--   * erase only the selected module(s) for one student. Later modules are
--     left exactly as they are, even though sequential gating then makes the
--     state unusual (owner accepted this 2026-11-10).
--
-- Safety model: every check is server-side, in this function, not in the
-- admin UI.
--   1. Caller must be an administrator (public.is_admin()).
--   2. Target must have students.is_test_account = true. The flag is set
--      only by an admin, one account at a time, through
--      admin_set_test_account(). It can never be set on an admin or
--      instructor identity.
--   3. Every reset writes one row to test_account_progress_resets (who,
--      when, which modules, row counts per table).
--
-- What a reset erases (only for the target student, and only coursework):
--   module_progress, module_completion_evidence, lab_attempts (and through
--   ON DELETE CASCADE their lab_attempt_grades + lab_attempt_feedback),
--   capstone_reviews + portfolio_artifacts, student_course_hour_awards
--   (hours are re-earned when the module is completed again).
--   Erase-all, or a module reset that includes the capstone module, also
--   erases capstone_submissions. Erase-all also erases sim_state and clears
--   students.completion_date.
--
-- What a reset NEVER touches: the account itself, enrollment and
-- enrollment_periods, cohort, credentials, messages, login/session/IP
-- history, credential_awards, completion_reporting_snapshots,
-- report_generation_audit, cohort archive snapshots and the M360 tables.
--
-- Uploaded evidence files (bucket 'lab-evidence', path
-- <track_code>/<user_id>/<module_key>/<lab_key>/<attempt_id>/<file>, see
-- 20261015120000_lab_evidence_storage.sql) are deleted too, owner request
-- 2026-11-10. Storage refuses direct deletes from storage.objects, so the
-- portal does it through the Storage API right after the reset:
-- admin_test_evidence_paths() lists the test account's files (all, or the
-- selected modules' folders), and two policies below let an admin read and
-- delete objects ONLY inside a test account's own folder. Evidence files
-- are not in the Save Progress File and cannot be restored.
--
-- Browser-held progress: Module 1 and several labs keep state in the
-- student's own browser, which an admin cannot reach. A reset stamps
-- students.progress_reset_at / progress_reset_modules; the student's
-- portal compares that with a local marker on its next sign-in or page load
-- and clears the matching browser state (portal/app.js
-- applyPendingProgressReset).
--
-- Rollback note:
--   drop policy if exists lab_evidence_test_account_admin_read on storage.objects;
--   drop policy if exists lab_evidence_test_account_admin_delete on storage.objects;
--   drop function if exists public.admin_test_evidence_paths(text, text[]);
--   drop function if exists public.can_admin_remove_test_evidence(text);
--   drop function if exists public.admin_reset_test_progress(text, text[], text[], boolean);
--   drop function if exists public.admin_set_test_account(text, boolean);
--   drop table if exists public.test_account_progress_resets;
--   alter table public.students
--     drop column if exists progress_reset_modules,
--     drop column if exists progress_reset_at,
--     drop column if exists is_test_account;
-- Rolling back does not restore erased progress; restore a student from the
-- "Save Progress File" JSON the admin UI downloads before every reset
-- (docs/ADMIN_RESET_FLOW.md).

-- ------------------------------------------------------------ students columns

alter table public.students
  add column if not exists is_test_account boolean not null default false,
  add column if not exists progress_reset_at timestamptz,
  add column if not exists progress_reset_modules text[];

comment on column public.students.is_test_account is
  'Admin-set flag. Only accounts with this true can have progress erased by admin_reset_test_progress(). Set through admin_set_test_account(), never on an admin or instructor.';
comment on column public.students.progress_reset_at is
  'When an admin last erased this test account''s progress. The student''s portal uses it to clear matching browser-held progress once.';
comment on column public.students.progress_reset_modules is
  'Module keys erased by the most recent reset; null means every module was erased.';

-- -------------------------------------------------------------- audit table

create table if not exists public.test_account_progress_resets (
  id            uuid primary key default gen_random_uuid(),
  student_id    text not null,
  user_id       uuid not null,
  track_code    text not null,
  scope         text not null check (scope in ('all', 'modules')),
  module_keys   text[],
  deleted_counts jsonb not null default '{}'::jsonb,
  reset_by      uuid not null,
  reset_at      timestamptz not null default now()
);

comment on table public.test_account_progress_resets is
  'Append-only log of every admin_reset_test_progress() call. Admin-readable; written only by that function.';

alter table public.test_account_progress_resets enable row level security;

drop policy if exists test_account_progress_resets_admin_read on public.test_account_progress_resets;
create policy test_account_progress_resets_admin_read on public.test_account_progress_resets
  for select using (public.is_admin());

revoke all on public.test_account_progress_resets from anon;
revoke insert, update, delete on public.test_account_progress_resets from authenticated;
grant select on public.test_account_progress_resets to authenticated;

-- -------------------------------------------------------- mark/unmark a test account

create or replace function public.admin_set_test_account(p_student_id text, p_is_test boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.students%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can mark test accounts'
      using errcode = '42501';
  end if;

  select * into v_row from public.students where student_id = p_student_id;
  if not found then
    raise exception 'No account found for %', p_student_id using errcode = 'P0002';
  end if;

  if coalesce(p_is_test, false) and (v_row.is_admin or v_row.is_instructor) then
    raise exception 'Admin and instructor accounts cannot be marked as test accounts'
      using errcode = '22023';
  end if;

  update public.students
  set is_test_account = coalesce(p_is_test, false)
  where student_id = p_student_id;
end;
$$;

revoke all on function public.admin_set_test_account(text, boolean) from public, anon;
grant execute on function public.admin_set_test_account(text, boolean) to authenticated;

-- ------------------------------------------------------------- the reset

-- p_module_keys: null = erase all progress; otherwise the module keys to
--   erase (e.g. '{its-01,its-03}'). An empty array is refused.
-- p_lab_keys: optional extra lab keys the portal knows belong to those
--   modules (portal/data.js LABS[].module). The function also matches
--   course_module_labs and the 'lab-<module_key>-' naming convention.
-- p_include_capstone: in module mode, also erase capstone_submissions
--   (the portal passes true when the capstone module is selected).
create or replace function public.admin_reset_test_progress(
  p_student_id text,
  p_module_keys text[] default null,
  p_lab_keys text[] default null,
  p_include_capstone boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row      public.students%rowtype;
  v_all      boolean := p_module_keys is null;
  v_modules  text[];
  v_labs     text[];
  v_counts   jsonb := '{}'::jsonb;
  v_n        integer;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can reset progress'
      using errcode = '42501';
  end if;

  select * into v_row from public.students where student_id = p_student_id for update;
  if not found then
    raise exception 'No account found for %', p_student_id using errcode = 'P0002';
  end if;

  if not v_row.is_test_account then
    raise exception 'Progress can only be reset for accounts marked as test accounts'
      using errcode = '42501';
  end if;

  if v_row.is_admin or v_row.is_instructor then
    raise exception 'Admin and instructor accounts cannot be reset'
      using errcode = '42501';
  end if;

  if not v_all then
    select coalesce(array_agg(distinct btrim(k)), '{}')
    into v_modules
    from unnest(p_module_keys) as k
    where btrim(coalesce(k, '')) <> '';

    if cardinality(v_modules) = 0 then
      raise exception 'Choose at least one module to reset'
        using errcode = '22023';
    end if;

    select coalesce(array_agg(distinct lab_key), '{}')
    into v_labs
    from (
      select cml.lab_key
      from public.course_module_labs cml
      where cml.track_code = v_row.track_code
        and cml.module_key = any(v_modules)
      union
      select btrim(k) from unnest(coalesce(p_lab_keys, '{}')) as k
      where btrim(coalesce(k, '')) <> ''
      union
      select la.lab_key
      from public.lab_attempts la, unnest(v_modules) as m
      where la.user_id = v_row.user_id
        and la.lab_key like 'lab-' || m || '-%'
    ) s;
  end if;

  -- Capstone reviews reference portfolio artifacts (ON DELETE RESTRICT), so
  -- they go first.
  delete from public.capstone_reviews cr
  where cr.user_id = v_row.user_id
    and (v_all or cr.artifact_id in (
      select pa.id from public.portfolio_artifacts pa
      where pa.user_id = v_row.user_id
        and (pa.module_key = any(v_modules) or pa.lab_key = any(v_labs))
    ));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('capstone_reviews', v_n);

  delete from public.portfolio_artifacts pa
  where pa.user_id = v_row.user_id
    and (v_all or pa.module_key = any(v_modules) or pa.lab_key = any(v_labs));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('portfolio_artifacts', v_n);

  -- lab_attempt_grades and lab_attempt_feedback cascade from lab_attempts.
  delete from public.lab_attempts la
  where la.user_id = v_row.user_id
    and (v_all or la.lab_key = any(v_labs));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('lab_attempts', v_n);

  delete from public.module_completion_evidence e
  where e.user_id = v_row.user_id
    and (v_all or e.module_key = any(v_modules));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('module_completion_evidence', v_n);

  delete from public.module_progress mp
  where mp.user_id = v_row.user_id
    and (v_all or mp.module_key = any(v_modules));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('module_progress', v_n);

  delete from public.student_course_hour_awards h
  where h.user_id = v_row.user_id
    and (v_all or h.course_key = any(v_modules));
  get diagnostics v_n = row_count;
  v_counts := v_counts || jsonb_build_object('student_course_hour_awards', v_n);

  if v_all or coalesce(p_include_capstone, false) then
    delete from public.capstone_submissions cs where cs.user_id = v_row.user_id;
    get diagnostics v_n = row_count;
    v_counts := v_counts || jsonb_build_object('capstone_submissions', v_n);
  end if;

  if v_all then
    delete from public.sim_state s where s.user_id = v_row.user_id;
    get diagnostics v_n = row_count;
    v_counts := v_counts || jsonb_build_object('sim_state', v_n);
  end if;

  -- A reset always leaves the program incomplete, so the computed
  -- completion date no longer applies.
  update public.students
  set progress_reset_at = now(),
      progress_reset_modules = case when v_all then null else v_modules end,
      completion_date = null
  where student_id = p_student_id;

  insert into public.test_account_progress_resets
    (student_id, user_id, track_code, scope, module_keys, deleted_counts, reset_by)
  values
    (v_row.student_id, v_row.user_id, v_row.track_code,
     case when v_all then 'all' else 'modules' end,
     case when v_all then null else v_modules end,
     v_counts, auth.uid());

  return jsonb_build_object(
    'student_id', v_row.student_id,
    'scope', case when v_all then 'all' else 'modules' end,
    'module_keys', case when v_all then null else to_jsonb(v_modules) end,
    'deleted', v_counts
  );
end;
$$;

revoke all on function public.admin_reset_test_progress(text, text[], text[], boolean) from public, anon;
grant execute on function public.admin_reset_test_progress(text, text[], text[], boolean) to authenticated;

-- ------------------------------------------------- evidence files in Storage

-- True only for an object in a TEST account's own folder of 'lab-evidence'
-- (<track_code>/<user_id>/...), for an admin with a registered session.
-- Never true for a real student's files.
create or replace function public.can_admin_remove_test_evidence(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_folders text[] := storage.foldername(p_object_name);
begin
  if coalesce(array_length(v_folders, 1), 0) < 2 or auth.uid() is null then
    return false;
  end if;
  return public.is_admin()
    and public.has_valid_site_session()
    and exists (
      select 1 from public.students s
      where s.user_id::text = v_folders[2]
        and s.track_code = v_folders[1]
        and s.is_test_account
        and not s.is_admin
        and not s.is_instructor
    );
end;
$$;

revoke all on function public.can_admin_remove_test_evidence(text) from public, anon;
grant execute on function public.can_admin_remove_test_evidence(text) to authenticated;

-- Storage's remove() needs both read and delete on the object.
drop policy if exists lab_evidence_test_account_admin_read on storage.objects;
create policy lab_evidence_test_account_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'lab-evidence' and public.can_admin_remove_test_evidence(name));

drop policy if exists lab_evidence_test_account_admin_delete on storage.objects;
create policy lab_evidence_test_account_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'lab-evidence' and public.can_admin_remove_test_evidence(name));

-- The test account's evidence object paths: all of them when p_module_keys
-- is null, otherwise only those under the given module folders. Read-only;
-- the portal passes the result to storage.from('lab-evidence').remove().
create or replace function public.admin_test_evidence_paths(
  p_student_id text,
  p_module_keys text[] default null
)
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.students%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can list test-account evidence'
      using errcode = '42501';
  end if;

  select * into v_row from public.students where student_id = p_student_id;
  if not found then
    raise exception 'No account found for %', p_student_id using errcode = 'P0002';
  end if;
  if not v_row.is_test_account or v_row.is_admin or v_row.is_instructor then
    raise exception 'Evidence can only be listed for accounts marked as test accounts'
      using errcode = '42501';
  end if;

  return query
    select o.name
    from storage.objects o
    where o.bucket_id = 'lab-evidence'
      and o.name like v_row.track_code || '/' || v_row.user_id::text || '/%'
      and (p_module_keys is null
           or (storage.foldername(o.name))[3] = any(p_module_keys))
    order by o.name;
end;
$$;

revoke all on function public.admin_test_evidence_paths(text, text[]) from public, anon;
grant execute on function public.admin_test_evidence_paths(text, text[]) to authenticated;

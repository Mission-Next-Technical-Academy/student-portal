-- Help Desk lab evidence files in a private Storage bucket.
--
-- Until now the Help Desk evidence tiles kept only a file's name and size in
-- the browser, so faculty never saw the screenshot behind a submission. Files
-- now go to the private bucket 'lab-evidence', and the lab attempt records
-- them in lab_attempts.result.evidence_files (portal/it-support-shared.js).
--
-- Object path, one folder per attempt:
--   <track_code>/<user_id>/<module_key>/<lab_key>/<attempt_id>/<field>.<ext>
-- The browser picks attempt_id, uploads the files, then inserts the
-- lab_attempts row with that same id. Earlier attempts' files are kept.
--
-- Who may do what (storage.objects policies below):
--   read    the student in the user folder; an admin or the course's assigned
--           instructor, only when a lab_attempts row with that id exists and
--           its user_id, track_code and lab_key match the path.
--   insert  the student in the user folder, currently enrolled in that
--           track, with a secure-login session, into a required lab of that
--           module, and only while no attempt with that id exists yet (files
--           cannot be added or swapped after submitting).
--   delete  the student in the user folder, only while no attempt with that
--           id exists (cleanup after a failed submit).
--   update  nobody.
--
-- require_registered_site_session (20261005230000) covers only public
-- tables, so the insert and delete rules check has_valid_site_session()
-- themselves.
--
-- Rollback: drop the three policies and the four functions below. The bucket
-- can be removed only once it is empty, through the Storage API or dashboard
-- (Storage refuses direct deletes from storage.objects).

-- ------------------------------------------------------------ bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lab-evidence', 'lab-evidence', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------ path parsing
-- The attempt id in an evidence object's path, or null when the path is not
-- exactly five folders plus a file name or the attempt folder is not a uuid.
-- Never raises, so a malformed path is refused rather than erroring.
create or replace function public.lab_evidence_attempt_id(p_object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  v_folders text[] := storage.foldername(p_object_name);
begin
  if coalesce(array_length(v_folders, 1), 0) <> 5
     or v_folders[5] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_folders[5]::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function public.lab_evidence_attempt_id(text) from public, anon;
grant execute on function public.lab_evidence_attempt_id(text) to authenticated;

-- ------------------------------------------------------------ read
create or replace function public.can_read_lab_evidence(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_folders text[] := storage.foldername(p_object_name);
  v_attempt_id uuid := public.lab_evidence_attempt_id(p_object_name);
begin
  if v_attempt_id is null or auth.uid() is null then
    return false;
  end if;

  -- The student whose folder it is.
  if v_folders[2] = auth.uid()::text then
    return true;
  end if;

  -- Staff: only files of a real attempt whose owner, course and lab match
  -- the path, and only for an admin or that course's assigned instructor.
  return exists (
    select 1
    from public.lab_attempts la
    where la.id = v_attempt_id
      and la.user_id::text = v_folders[2]
      and la.track_code = v_folders[1]
      and la.lab_key = v_folders[4]
      and (public.is_admin() or public.can_manage_course_messages(la.track_code))
  );
end;
$$;

revoke all on function public.can_read_lab_evidence(text) from public, anon;
grant execute on function public.can_read_lab_evidence(text) to authenticated;

-- ------------------------------------------------------------ insert
create or replace function public.can_write_lab_evidence(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_folders text[] := storage.foldername(p_object_name);
  v_attempt_id uuid := public.lab_evidence_attempt_id(p_object_name);
begin
  if v_attempt_id is null or auth.uid() is null or v_folders[2] <> auth.uid()::text then
    return false;
  end if;

  return public.has_module_write_access(v_folders[1])
    and public.has_valid_site_session()
    -- A required lab of that module in that course.
    and exists (
      select 1 from public.course_module_labs r
      where r.track_code = v_folders[1] and r.module_key = v_folders[3] and r.lab_key = v_folders[4]
    )
    -- Not yet submitted: once the attempt row exists its files are fixed.
    and not exists (select 1 from public.lab_attempts la where la.id = v_attempt_id);
end;
$$;

revoke all on function public.can_write_lab_evidence(text) from public, anon;
grant execute on function public.can_write_lab_evidence(text) to authenticated;

-- ------------------------------------------------------------ delete
create or replace function public.can_delete_lab_evidence(p_object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_folders text[] := storage.foldername(p_object_name);
  v_attempt_id uuid := public.lab_evidence_attempt_id(p_object_name);
begin
  if v_attempt_id is null or auth.uid() is null or v_folders[2] <> auth.uid()::text then
    return false;
  end if;

  return public.has_valid_site_session()
    and not exists (select 1 from public.lab_attempts la where la.id = v_attempt_id);
end;
$$;

revoke all on function public.can_delete_lab_evidence(text) from public, anon;
grant execute on function public.can_delete_lab_evidence(text) to authenticated;

-- ------------------------------------------------------------ policies
-- RLS is already enabled on storage.objects (owned by Supabase); this
-- migration only adds policies.
drop policy if exists lab_evidence_read on storage.objects;
create policy lab_evidence_read on storage.objects
  for select to authenticated
  using (bucket_id = 'lab-evidence' and public.can_read_lab_evidence(name));

drop policy if exists lab_evidence_insert on storage.objects;
create policy lab_evidence_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lab-evidence' and public.can_write_lab_evidence(name));

drop policy if exists lab_evidence_delete on storage.objects;
create policy lab_evidence_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'lab-evidence' and public.can_delete_lab_evidence(name));

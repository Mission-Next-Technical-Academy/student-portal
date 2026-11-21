-- Instructor guides, readable only by course staff.
--
-- What: one guide per course track (session scripts, module answer keys,
-- grading steps, capstone rubric) shown in the Course Dashboard's
-- "Instructor Guide" tab. Only an admin, or an instructor assigned to that
-- track in faculty_course_assignments, can read a row. Students and
-- signed-out visitors get no rows.
--
-- Why: the guide holds answer keys. The repository and the deployed site are
-- public, so the guide must never ship as a portal file. It lives only here.
--
-- Content: no guide is created by this migration (the repository is public).
-- A person loads it by hand in the SQL Editor with an insert ... on conflict
-- (track_code) do update. No API role can insert, update or delete.
--
-- Rollback: drop table if exists public.instructor_guides;
-- (The portal tab shows "not available" when the table or row is missing.)

create table if not exists public.instructor_guides (
  track_code text primary key check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  revision integer not null default 1 check (revision > 0),
  note text,
  updated_at timestamptz not null default now()
);

comment on table public.instructor_guides is
  'Instructor guide per course track (includes answer keys). Read: admins and that track''s assigned instructors only. Write: by hand in the SQL Editor; no API role can write.';

alter table public.instructor_guides enable row level security;
revoke all on public.instructor_guides from public, anon, authenticated;
grant select on public.instructor_guides to authenticated;

drop policy if exists instructor_guides_staff_read on public.instructor_guides;
create policy instructor_guides_staff_read on public.instructor_guides
  for select to authenticated
  using (public.is_admin() or public.can_manage_course_messages(track_code));

-- Mission Next Technical Academy — admin "view credentials" panel.
--
-- Supabase Auth never returns a password once it has hashed it into
-- auth.users.encrypted_password, which is why admin-provision's
-- create_user/create_cohort responses show a generated password exactly
-- once and portal/app.js's wireSelectAllBlocks()-backed roster table says
-- "copy it now, it is not shown again." That is a real, permanent gap for
-- an admin who needs to look a student's password back up later.
--
-- This table closes that gap by keeping a second, admin-only plaintext
-- copy alongside the hash Supabase Auth already owns. That is an
-- intentional, discussed tradeoff, not an oversight: these are isolated
-- training accounts (see the track/program map in
-- 20260828120000_students_admin.sql), not accounts tied to real-world
-- identities, and the site is not live with real students until November.
-- Do not extend this pattern to any future real-identity user store
-- without re-litigating the tradeoff.
--
-- Written only by the admin-provision Edge Function's service-role client
-- (provisioning.ts's provisionOneAccount(), right after the students row
-- insert). No client-side write path exists — same "writes are
-- service-role only" posture as public.students itself.

create table public.student_credentials (
  student_id  text primary key references public.students(student_id) on delete cascade,
  password    text not null,
  created_at  timestamptz not null default now()
);

comment on table public.student_credentials is
  'Admin-only plaintext password lookup for the admin panel''s "view credentials" action. Isolated training accounts only — see migration header before reusing this pattern for any real-identity user store. Supabase Auth''s own hash in auth.users.encrypted_password remains the actual authentication credential; this table exists purely so an admin can look a password back up after the one-time reveal at generation.';

alter table public.student_credentials enable row level security;

-- Admin-only read, same is_admin() gate as every other admin-only table.
create policy student_credentials_admin_read on public.student_credentials
  for select using (public.is_admin());

-- Writes are service-role only (admin-provision Edge Function). No write
-- policies, matching public.students' own posture.

revoke all on public.student_credentials from anon;
grant select on public.student_credentials to authenticated;

-- The students table comment claimed passwords are never stored anywhere;
-- that is no longer accurate now that this table exists, so correct it in
-- place rather than leave a misleading comment for the next reader.
comment on table public.students is
  'Private roster keyed by login ID. Readable only by the student''s own row or by an admin. Supabase Auth (auth.users.encrypted_password) is the actual authentication credential; public.student_credentials additionally keeps an admin-only plaintext copy for the admin panel''s "view credentials" action — see that table''s comment for why.';

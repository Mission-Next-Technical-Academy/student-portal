-- MNT Academy — Row Level Security.
--
-- The anon key is public by design. RLS is the entire security model, so every
-- table is enabled, without exception. PLATFORM_ARCHITECTURE.md §4.6.

alter table public.programs             enable row level security;
alter table public.modules              enable row level security;
alter table public.labs                 enable row level security;
alter table public.profiles             enable row level security;
alter table public.enrollments          enable row level security;
alter table public.module_entitlements  enable row level security;
alter table public.module_progress      enable row level security;
alter table public.lesson_progress      enable row level security;
alter table public.lab_attempts         enable row level security;
alter table public.sim_state            enable row level security;
alter table public.capstone_submissions enable row level security;
alter table public.portfolio_artifacts  enable row level security;

-- ------------------------------------------------------- public catalogue
-- Readable by anyone when published. Writes are service-role only (the seed
-- script), which bypasses RLS — so no write policy is defined here.
--
-- The second half of each condition matters: a student enrolled in a track that
-- has not been published yet must still be able to read its own catalogue rows,
-- or their portal shows an enrollment with no title. Publication controls who
-- can BROWSE a track, not whether its own students can see it.

create policy programs_read on public.programs
  for select using (is_published or public.has_program_access(id));

create policy modules_read on public.modules
  for select using (exists (
    select 1 from public.programs p
    where p.id = program_id
      and (p.is_published or public.has_program_access(p.id))));

create policy labs_read on public.labs
  for select using (exists (
    select 1 from public.modules m
    join public.programs p on p.id = m.program_id
    where m.id = module_id
      and (p.is_published or public.has_program_access(p.id))));

-- --------------------------------------------------------------- profiles

create policy profiles_self on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------ enrollments
-- Students read their own enrollments and never write them. Enrollment is
-- created by the purchase flow / admin using the service role.

create policy enrollments_self_read on public.enrollments
  for select using (user_id = auth.uid());

create policy module_entitlements_self_read on public.module_entitlements
  for select using (exists (
    select 1 from public.enrollments e
    where e.id = enrollment_id and e.user_id = auth.uid()));

-- ----------------------------------------------- gated per-user state
-- Two conditions on every one of these: the row is yours, AND you still have
-- access to the module it belongs to. The second half is what makes a revoked
-- or expired enrollment take effect immediately rather than at next login.

create policy module_progress_own on public.module_progress
  for all
  using      (user_id = auth.uid() and public.has_module_access(module_id))
  with check (user_id = auth.uid() and public.has_module_access(module_id));

create policy lesson_progress_own on public.lesson_progress
  for all
  using      (user_id = auth.uid() and public.has_module_access(module_id))
  with check (user_id = auth.uid() and public.has_module_access(module_id));

create policy lab_attempts_own on public.lab_attempts
  for all
  using (user_id = auth.uid() and exists (
    select 1 from public.labs l
    where l.id = lab_id and public.has_module_access(l.module_id)))
  with check (user_id = auth.uid() and exists (
    select 1 from public.labs l
    where l.id = lab_id and public.has_module_access(l.module_id)));

create policy capstone_own on public.capstone_submissions
  for all
  using      (user_id = auth.uid() and public.has_program_access(program_id))
  with check (user_id = auth.uid() and public.has_program_access(program_id));

-- ------------------------------------------------- ungated per-user state
-- sim_state and portfolio_artifacts are keyed to the user, not to a module.
-- A student whose enrollment lapses keeps their own simulator configuration
-- and their portfolio; access to the modules is what goes away.

create policy sim_state_own on public.sim_state
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy portfolio_own on public.portfolio_artifacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------ hard denials
-- Revoke the blanket grants Supabase gives anon/authenticated on new tables in
-- the public schema, then re-grant only what the policies above are meant to
-- allow. Without this, a table added later without a policy is silently open.

revoke all on all tables in schema public from anon, authenticated;

grant select on public.programs, public.modules, public.labs to anon, authenticated;
grant select on public.profiles, public.enrollments, public.module_entitlements to authenticated;
grant select, insert, update, delete on
  public.module_progress, public.lesson_progress, public.lab_attempts,
  public.sim_state, public.capstone_submissions, public.portfolio_artifacts
  to authenticated;
grant select on public.capstone_scorecard to authenticated;

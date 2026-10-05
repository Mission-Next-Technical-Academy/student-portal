-- Keep access to a learner's existing course records after withdrawal, while
-- preventing further writes until the learner is enrolled again.

create or replace function public.has_module_write_access(p_track_code text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.user_id = auth.uid()
      and s.is_enrolled is true
      and (p_track_code is null or s.track_code = p_track_code)
  );
$$;

grant execute on function public.has_module_write_access(text) to authenticated;
revoke all on function public.has_module_write_access(text) from public, anon;

-- module_progress: retain reads of historical records, gate all mutations.
drop policy if exists module_progress_own on public.module_progress;
create policy module_progress_own_read on public.module_progress
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code));
create policy module_progress_own_insert on public.module_progress
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy module_progress_own_update on public.module_progress
  for update to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy module_progress_own_delete on public.module_progress
  for delete to authenticated
  using (user_id = auth.uid() and public.has_module_write_access(track_code));

-- Lab attempts are append/review controlled already; only their insert gate
-- changes here. Their SELECT policy continues to expose historical attempts.
drop policy if exists lab_attempts_own_insert on public.lab_attempts;
create policy lab_attempts_own_insert on public.lab_attempts
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));

-- Capstone submissions retain read access but require current enrollment for
-- insert/update/delete. Official outcomes remain in the admin-only review.
drop policy if exists capstone_own on public.capstone_submissions;
create policy capstone_own_read on public.capstone_submissions
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code));
create policy capstone_own_insert on public.capstone_submissions
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy capstone_own_update on public.capstone_submissions
  for update to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy capstone_own_delete on public.capstone_submissions
  for delete to authenticated
  using (user_id = auth.uid() and public.has_module_write_access(track_code));

-- Module evidence is append-only in practice. Split policies so old evidence
-- remains readable to withdrawn learners while new evidence requires enrollment.
drop policy if exists module_completion_evidence_own on public.module_completion_evidence;
create policy module_completion_evidence_own_read on public.module_completion_evidence
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code));
create policy module_completion_evidence_own_insert on public.module_completion_evidence
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));

-- sim_state has no track column, so require any active enrollment for writes.
drop policy if exists sim_state_own on public.sim_state;
create policy sim_state_own_read on public.sim_state
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access());
create policy sim_state_own_insert on public.sim_state
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access());
create policy sim_state_own_update on public.sim_state
  for update to authenticated
  using (user_id = auth.uid() and public.has_module_access())
  with check (user_id = auth.uid() and public.has_module_write_access());
create policy sim_state_own_delete on public.sim_state
  for delete to authenticated
  using (user_id = auth.uid() and public.has_module_write_access());

-- Portfolio artifacts have historically remained readable after withdrawal;
-- preserve that behavior while closing their student write paths.
drop policy if exists portfolio_own on public.portfolio_artifacts;
create policy portfolio_own_read on public.portfolio_artifacts
  for select to authenticated using (user_id = auth.uid());
create policy portfolio_own_insert on public.portfolio_artifacts
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy portfolio_own_update on public.portfolio_artifacts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
create policy portfolio_own_delete on public.portfolio_artifacts
  for delete to authenticated
  using (user_id = auth.uid() and public.has_module_write_access(track_code));

-- Approval must be authoritative for the learner's current lab state, even
-- when a faculty member reaches an older/history attempt in the admin UI.
-- The learner portal intentionally reads the latest attempt per user/lab;
-- without this guard, approving a different attempt can leave that latest
-- row's redo_requested flag true and strand the learner behind a stale banner.
create or replace function public.clear_latest_lab_redo_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reviewed_at is not null
     and new.reviewed_by is not null
     and new.redo_requested = false
     and (
       old.reviewed_at is distinct from new.reviewed_at
       or old.reviewed_by is distinct from new.reviewed_by
       or old.redo_requested is distinct from new.redo_requested
     ) then
    -- Only a current, open redo is changed. Completed history stays intact;
    -- this makes the faculty approval the explicit resolution of the learner's
    -- presently visible redo state, regardless of which attempt was opened.
    update public.lab_attempts
    set redo_requested = false,
        reviewed_at = coalesce(reviewed_at, new.reviewed_at),
        reviewed_by = coalesce(reviewed_by, new.reviewed_by)
    where id = (
      select la.id
      from public.lab_attempts la
      where la.user_id = new.user_id
        and la.track_code = new.track_code
        and la.lab_key = new.lab_key
        and la.completed_at is not null
      order by la.completed_at desc, la.started_at desc, la.id desc
      limit 1
    )
      and redo_requested = true;
  end if;
  return new;
end;
$$;

drop trigger if exists lab_attempts_approval_clears_latest_redo on public.lab_attempts;
create trigger lab_attempts_approval_clears_latest_redo
before update of reviewed_at, reviewed_by, redo_requested on public.lab_attempts
for each row execute function public.clear_latest_lab_redo_on_approval();

revoke all on function public.clear_latest_lab_redo_on_approval() from public, anon, authenticated;

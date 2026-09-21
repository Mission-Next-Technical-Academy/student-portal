-- The resolution update made by the approval trigger fires the same trigger.
-- Only the originating faculty decision may fan out to the latest open redo;
-- nested trigger invocations must simply accept the row being resolved.
create or replace function public.clear_latest_lab_redo_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.reviewed_at is not null
     and new.reviewed_by is not null
     and new.redo_requested = false
     and (
       old.reviewed_at is distinct from new.reviewed_at
       or old.reviewed_by is distinct from new.reviewed_by
       or old.redo_requested is distinct from new.redo_requested
     ) then
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

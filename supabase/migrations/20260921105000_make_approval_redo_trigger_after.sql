-- The propagation can target the same row when faculty approve the live redo
-- itself. Run after the originating write has settled so PostgreSQL never sees
-- the tuple as being modified twice in the same command.
drop trigger if exists lab_attempts_approval_clears_latest_redo on public.lab_attempts;
create trigger lab_attempts_approval_clears_latest_redo
after update of reviewed_at, reviewed_by, redo_requested on public.lab_attempts
for each row execute function public.clear_latest_lab_redo_on_approval();

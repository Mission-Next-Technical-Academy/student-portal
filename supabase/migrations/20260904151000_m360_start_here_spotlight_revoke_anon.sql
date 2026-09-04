-- Mission Next Technical Academy — M360 Start Here + Career Spotlight RPC security hardening.
-- Explicitly remove anonymous execution from the two SECURITY DEFINER RPCs added
-- for Start Here and Career Spotlight verification. Authenticated access remains
-- available and the functions continue to enforce student/admin authorization
-- internally. No technical-course tables, functions, progress, labs, timekeeping,
-- completion, or reporting objects are changed.

revoke all on function public.m360_save_start_here(jsonb, boolean, boolean, boolean) from public;
revoke execute on function public.m360_save_start_here(jsonb, boolean, boolean, boolean) from anon;
grant execute on function public.m360_save_start_here(jsonb, boolean, boolean, boolean) to authenticated;

revoke all on function public.m360_admin_set_spotlight_presentation(uuid, text, text) from public;
revoke execute on function public.m360_admin_set_spotlight_presentation(uuid, text, text) from anon;
grant execute on function public.m360_admin_set_spotlight_presentation(uuid, text, text) to authenticated;

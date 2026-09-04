-- Mission Next Technical Academy — M360 101 RPC privilege hardening.
--
-- Supabase provisions explicit EXECUTE grants to anon on newly created RPCs.
-- The Gate 3 M360 functions are authenticated-only, so revoke that explicit
-- anonymous access while leaving authenticated/service-role access unchanged.

revoke execute on function public.m360_current_student_track() from anon;
revoke execute on function public.m360_save_draft(integer, jsonb, integer) from anon;
revoke execute on function public.m360_submit_week(integer, jsonb, integer) from anon;
revoke execute on function public.m360_admin_review_week(uuid, integer, text, jsonb, text) from anon;
revoke execute on function public.m360_admin_set_attendance(uuid, boolean, text) from anon;

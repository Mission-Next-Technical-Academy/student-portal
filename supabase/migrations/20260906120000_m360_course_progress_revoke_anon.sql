-- Mission Next Technical Academy — M360 course-progress view hardening.
-- m360_course_progress was created without the anon revoke that every other
-- M360 object received, leaving a default GRANT ALL ... TO anon in place.
-- The view is security_invoker and the underlying tables never granted anon
-- access, so this was not exploitable, but close the gap for defense in depth.

revoke all on public.m360_course_progress from anon;
grant select on public.m360_course_progress to authenticated;

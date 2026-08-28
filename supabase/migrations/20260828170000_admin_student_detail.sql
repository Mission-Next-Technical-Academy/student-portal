-- MNT Academy — Sprint H.1: admin student detail drill-down.
-- CURRICULUM_ALIGNMENT_ARCHITECTURE.md, "Sprint H.1 — Student detail drill-down".
--
-- This migration is additive only: new RLS policies (CREATE POLICY, nothing
-- dropped or altered) and one new view. No tables are created, dropped, or
-- altered. Non-destructive; safe to review independently of the schema
-- simplification migrations.

-- ===================================================== admin read policies
--
-- Load-bearing finding, not spec-assumed: module_progress, lab_attempts, and
-- capstone_submissions (supabase/migrations/20260828160000_simplify_schema.sql)
-- carry only an "own row" RLS policy each (`user_id = auth.uid()`). There is
-- no admin-bypass policy on any of the three. admin_student_progress and its
-- underlying course_progress/capstone_scorecard views are all declared
-- `security_invoker = true`, which means Postgres evaluates the *base table*
-- RLS policies as the actual querying role — the admin's own auth.uid() —
-- not as a bypass. Concretely: today, when an admin queries
-- admin_student_progress, the left joins to course_progress/capstone_scorecard
-- can only see rows where user_id = the admin's own auth.uid(); every other
-- student's row is invisible to those joins and silently coalesces to 0/null.
-- This is true right now for the live Sprint H dashboard (modules_complete
-- reads 0 for every student except the admin's own row, regardless of real
-- progress) and would be true for this sprint's new per-student detail
-- queries too, since they read the same three tables directly.
--
-- The fix is the same pattern already used for `students` itself
-- (students_admin_read: `for select using (public.is_admin())`,
-- 20260828120000_students_admin.sql) — an additional, admin-gated SELECT
-- policy alongside the existing "own row" policy. This does not weaken
-- anything: the existing own-row policies are untouched, this only adds a
-- second way in, gated by the same is_admin() function every other
-- admin-only surface in this schema already trusts.

create policy module_progress_admin_read on public.module_progress
  for select using (public.is_admin());

create policy lab_attempts_admin_read on public.lab_attempts
  for select using (public.is_admin());

create policy capstone_submissions_admin_read on public.capstone_submissions
  for select using (public.is_admin());

comment on policy module_progress_admin_read on public.module_progress is
  'Admins can read every student''s module progress, not just their own. Additive alongside module_progress_own.';
comment on policy lab_attempts_admin_read on public.lab_attempts is
  'Admins can read every student''s lab attempts, not just their own. Additive alongside lab_attempts_own.';
comment on policy capstone_submissions_admin_read on public.capstone_submissions is
  'Admins can read every student''s capstone submissions, not just their own. Additive alongside capstone_own.';

-- ===================================================== admin_student_activity
--
-- Sprint H.1's dropdown needs two things admin_student_progress does not
-- expose: (1) user_id, so the client can key its per-student
-- module_progress/lab_attempts/capstone_submissions/capstone_scorecard
-- selects without a second round trip, and (2) enough signal to compute
-- "has real progress" per the spec (modules_complete > 0 OR at least one
-- lab_attempts row OR at least one capstone_submissions row) — lab attempts
-- in particular are invisible to admin_student_progress today, so a student
-- with lab activity but zero completed modules would wrongly be excluded if
-- the dropdown reused that view as-is.
--
-- Same gating pattern as admin_student_progress: security_invoker = true
-- (now meaningful thanks to the admin-read policies above) plus a `where
-- public.is_admin()` defensive gate so a non-admin querying this view gets
-- zero rows, not an error.

create or replace view public.admin_student_activity
with (security_invoker = true) as
select
  s.student_id,
  s.user_id,
  s.track_code,
  case s.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end                                          as program_slug,
  coalesce(cp.modules_total, 12)               as modules_total,
  coalesce(cp.modules_complete, 0)             as modules_complete,
  coalesce(cp.percent_complete, 0)             as percent_complete,
  cs.overall_score                             as capstone_overall_score,
  coalesce(la.lab_attempts_count, 0)           as lab_attempts_count,
  coalesce(cst.capstone_submissions_count, 0)  as capstone_submissions_count,
  cp.last_active                               as last_active
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
left join (
  select user_id, count(*) as lab_attempts_count
  from public.lab_attempts
  group by user_id
) la on la.user_id = s.user_id
left join (
  select user_id, count(*) as capstone_submissions_count
  from public.capstone_submissions
  group by user_id
) cst on cst.user_id = s.user_id
where public.is_admin();

comment on view public.admin_student_activity is
  'Admin-only. Sprint H.1 (CURRICULUM_ALIGNMENT_ARCHITECTURE.md): backs the
   student-detail dropdown. Includes user_id (so the client can key detail
   selects directly) and lab/capstone attempt counts (so "has real progress"
   can be computed without a second query per student). Not a replacement for
   admin_student_progress, which the existing table view keeps using.';

grant select on public.admin_student_activity to authenticated;

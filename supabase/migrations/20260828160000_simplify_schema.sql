-- MNT Academy — the big simplification (Sprint 1, architecture.md §3).
--
-- Drops the catalogue/entitlement tables (programs, modules, labs,
-- enrollments, module_entitlements, profiles) and switches every progress
-- table to text-key references (module_key/lab_key/track_code) instead of
-- uuid FKs into the now-gone catalogue. See architecture.md §1 for the
-- rationale and exact target shapes, §3 Sprint 1 for the numbered task list
-- this migration implements one-for-one.
--
-- Confirmed safe against the live project (architecture.md §2): students has
-- one row (the ADMIN account), enrollments is empty, and nothing in the
-- frontend writes to module_progress/lab_attempts/capstone_submissions/
-- sim_state yet — so every table touched here is empty. That is what makes
-- DROP + CREATE (rather than in-place ALTER of uuid columns to text) safe and
-- the right amount of caution for this migration.
--
-- This migration is destructive and irreversible once applied. Review
-- carefully before running against the live project — do not `supabase db
-- push` this without a deliberate, confirmed decision to do so.

-- ============================================================ drop: views
-- Drop first — both depend on tables/columns this migration removes or
-- reshapes, and a view dependency would otherwise block the table drops
-- below.

drop view if exists public.admin_student_progress;
drop view if exists public.capstone_scorecard;

-- ================================================== drop: identity extras
-- profiles + its auto-provisioning trigger. public.students (added
-- 2026-08-28) is now the only identity table; see architecture.md §1.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.profiles;

-- ============================================ drop: old progress/state/
--                                                     capstone/portfolio
-- These currently FK into modules/labs/programs. Drop them before dropping
-- the catalogue tables they reference; they are recreated further down in
-- their new text-keyed shape.

drop table if exists public.module_progress;
drop table if exists public.course_progress;   -- old lesson-grain table (was lesson_progress; architecture.md §1)
drop table if exists public.lab_attempts;
drop table if exists public.capstone_submissions;
drop table if exists public.portfolio_artifacts;

-- ================================================= drop: enrollment layer

drop table if exists public.module_entitlements;
drop table if exists public.enrollments;
drop type if exists public.access_mode;

-- ===================================================== drop: catalogue
-- Display content (titles, descriptions, difficulty, lesson counts, ...)
-- already lives in portal/data.js. Child-before-parent order.

drop table if exists public.labs;
drop table if exists public.modules;
drop table if exists public.programs;

-- ========================================== drop: old uuid-based access
-- Recreated below with new (text) signatures — a differently-typed
-- parameter is a distinct overload in Postgres, so the old uuid versions
-- must be dropped explicitly rather than replaced in place.
-- my_module_access() batch-resolved access across a program's modules table;
-- with no modules table and uniform full-track access, it has no remaining
-- purpose and is not recreated.

drop function if exists public.has_module_access(uuid);
drop function if exists public.has_program_access(uuid);
drop function if exists public.my_module_access(text);

-- ============================================================ module/lab
-- progress, rewritten to text keys per architecture.md §1. module_key /
-- lab_key (e.g. 'soc-05', 'lab-siem-triage') are the same stable keys that
-- already exist in portal/data.js. track_code is now stored directly on the
-- row (added per Sprint 1 step 2) since there is no enrollments/modules join
-- left to derive it from.
--
-- Trade-off carried forward from architecture.md §1: without a modules/labs
-- table, Postgres can no longer validate that a given module_key/lab_key
-- actually belongs to the student's track. RLS still guarantees a student
-- can only read/write their own rows for their own track_code — worst case
-- is a nonsense key in their own progress data, not a privilege escalation.

create table public.module_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_key   text not null,
  track_code   text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  state        public.progress_state not null default 'not_started',
  percent      int not null default 0 check (percent between 0 and 100),
  started_at   timestamptz,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, module_key)
);

comment on column public.module_progress.module_key is
  'Stable join key to portal/data.js, e.g. ''soc-05''. No FK — see trade-off note above.';

create table public.lab_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  lab_key      text not null,
  track_code   text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  state        public.progress_state not null default 'in_progress',
  score        numeric(5,2),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  result       jsonb not null default '{}'::jsonb
);

create index lab_attempts_user_idx on public.lab_attempts (user_id, lab_key);

comment on column public.lab_attempts.lab_key is
  'Stable join key to portal/data.js, e.g. ''lab-siem-triage''. No FK — see module_progress note.';

-- --------------------------------------------------------------- capstone

create table public.capstone_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_code   text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  stage        int not null check (stage between 1 and 12),
  answers      jsonb not null default '{}'::jsonb,
  score        numeric(5,2),
  submitted_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, track_code, stage)
);

-- The completion screen's six score dimensions are a VIEW over stage scores,
-- so the rubric can be re-weighted without a migration.
create or replace view public.capstone_scorecard
with (security_invoker = true) as
select
  s.user_id,
  s.track_code,
  round(avg(s.score), 1)                                              as overall_score,
  round(avg(s.score) filter (where s.stage in (1, 2, 3, 4, 5)),  1)   as investigation_accuracy,
  round(avg(s.score) filter (where s.stage in (1, 6)),           1)   as detection_score,
  round(avg(s.score) filter (where s.stage = 7),                 1)   as threat_hunting_score,
  round(avg(s.score) filter (where s.stage in (9, 10)),          1)   as incident_response_score,
  round(avg(s.score) filter (where s.stage = 8),                 1)   as vulnerability_score,
  round(avg(s.score) filter (where s.stage in (11, 12)),         1)   as reporting_score,
  count(*) filter (where s.submitted_at is not null)                  as stages_submitted
from public.capstone_submissions s
group by s.user_id, s.track_code;

-- -------------------------------------------------------------- portfolio

create table public.portfolio_artifacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_code   text check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  kind         text not null check (kind in (
                 'incident_report','vuln_assessment','hunt_report',
                 'exec_summary','incident_timeline','capstone_report')),
  title        text not null,
  storage_path text,
  content      jsonb,
  created_at   timestamptz not null default now()
);

create index portfolio_user_idx on public.portfolio_artifacts (user_id, created_at desc);

-- ------------------------------------------------------------ updated_at
-- touch_updated_at() itself is unaffected by this migration (defined in
-- 20260817090000_catalogue.sql, still used by sim_state's own trigger too).

create trigger module_progress_touch before update on public.module_progress
  for each row execute function public.touch_updated_at();
create trigger capstone_touch before update on public.capstone_submissions
  for each row execute function public.touch_updated_at();

-- ===================================================== course_progress
-- Redefined per architecture.md §1/§3 step 5: no longer a lesson-grain
-- table, now a live rollup view over module_progress. modules_total is the
-- fixed constant 12 (every track has exactly 12 modules, module 12 always
-- the capstone — confirmed in the old seed data) rather than a catalogue
-- count.

create or replace view public.course_progress
with (security_invoker = true) as
select
  mp.user_id,
  mp.track_code,
  12::int                                                                as modules_total,
  count(*) filter (where mp.state = 'complete')                          as modules_complete,
  round(100.0 * count(*) filter (where mp.state = 'complete') / 12.0, 1) as percent_complete,
  max(mp.updated_at)                                                     as last_active
from public.module_progress mp
group by mp.user_id, mp.track_code;

-- ================================================== the access functions
--
-- Single source of truth for "may this student use this module/track".
-- Every gated RLS policy calls has_module_access(). No more enrollments walk
-- — access is just "does your track_code match" (architecture.md §1).
--
-- Two shapes, for two different call sites:
--   has_program_access(p_program_slug text) — takes a portal/data.js-style
--     slug ('soc-analyst', 'it-support', ...) and maps it to the track code
--     that would have to match. This is the shape the frontend/other code
--     would call, mirroring how it already refers to tracks by slug.
--   has_module_access(p_track_code text default null) — takes a track_code
--     directly (SOCAN/HDESK/...), since module_progress/lab_attempts/
--     capstone_submissions now store track_code natively on the row — no
--     slug round-trip needed at the RLS call site. Called with NO argument
--     (default null) it degrades to "is this authenticated user a
--     provisioned student at all", which is how sim_state's ungated-but-
--     still-a-real-student policy uses it below.

create or replace function public.has_program_access(p_program_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.user_id = auth.uid()
      and s.track_code = case p_program_slug
            when 'soc-analyst' then 'SOCAN'
            when 'it-support'  then 'HDESK'
            when 'ai-ml'       then 'AIENG'
            when 'electrical'  then 'ELECT'
            else null
          end
  );
$$;

create or replace function public.has_module_access(p_track_code text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.user_id = auth.uid()
      and (p_track_code is null or s.track_code = p_track_code)
  );
$$;

grant execute on function public.has_program_access(text) to authenticated;
grant execute on function public.has_module_access(text)  to authenticated;

-- ========================================================= admin dashboard
-- Rewritten per Sprint 1 step 6: selects from the new course_progress view
-- instead of computing its own catalogue join. program_slug is kept
-- (portal/app.js's admin table reads it) but is now a pure function of
-- track_code via the same fixed map, not a stored catalogue column.

create or replace view public.admin_student_progress
with (security_invoker = true) as
select
  s.student_id,
  s.track_code,
  case s.track_code
    when 'SOCAN' then 'soc-analyst'
    when 'HDESK' then 'it-support'
    when 'AIENG' then 'ai-ml'
    when 'ELECT' then 'electrical'
    else null
  end                                    as program_slug,
  coalesce(cp.modules_total, 12)         as modules_total,
  coalesce(cp.modules_complete, 0)       as modules_complete,
  coalesce(cp.percent_complete, 0)       as percent_complete,
  cs.overall_score                       as capstone_overall_score,
  cp.last_active                         as last_active
from public.students s
left join public.course_progress cp
  on cp.user_id = s.user_id and cp.track_code = s.track_code
left join public.capstone_scorecard cs
  on cs.user_id = s.user_id and cs.track_code = s.track_code
where public.is_admin();

grant select on public.admin_student_progress to authenticated;

-- ============================================================ row level
--                                                               security
-- module_progress/lab_attempts/capstone_submissions/portfolio_artifacts are
-- brand new tables (RLS state does not carry over from the dropped ones) —
-- enable it explicitly. sim_state is untouched structurally but its policy
-- is re-pointed at the simplified has_module_access() per architecture.md §3.

alter table public.module_progress      enable row level security;
alter table public.lab_attempts         enable row level security;
alter table public.capstone_submissions enable row level security;
alter table public.portfolio_artifacts  enable row level security;

create policy module_progress_own on public.module_progress
  for all
  using      (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_access(track_code));

create policy lab_attempts_own on public.lab_attempts
  for all
  using      (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_access(track_code));

create policy capstone_own on public.capstone_submissions
  for all
  using      (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_access(track_code));

-- Ungated by design (architecture.md §1: "access to the modules is what goes
-- away, not this") — ownership only, same as before the catalogue drop.
create policy portfolio_own on public.portfolio_artifacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- sim_state: table and RLS-enabled state are unchanged; only the policy is
-- re-pointed, per architecture.md §3's explicit instruction to re-point this
-- table's policy at has_module_access() too. Called with no argument, this
-- just confirms the caller is a provisioned student row — sim_state has no
-- module_key/track_code column of its own to check against (namespace is
-- free text, e.g. 'lab:lab-siem-triage' or 'capstone').
drop policy if exists sim_state_own on public.sim_state;
create policy sim_state_own on public.sim_state
  for all
  using      (user_id = auth.uid() and public.has_module_access())
  with check (user_id = auth.uid() and public.has_module_access());

-- ------------------------------------------------------------------ grants
-- No blanket schema-wide revoke here (that was a one-time setup step in
-- 20260817090300_rls.sql) — just the explicit grants the new/changed objects
-- need, matching the surgical style of 20260828120000_students_admin.sql.

grant select, insert, update, delete on
  public.module_progress, public.lab_attempts,
  public.capstone_submissions, public.portfolio_artifacts
  to authenticated;

grant select on public.capstone_scorecard to authenticated;
grant select on public.course_progress    to authenticated;

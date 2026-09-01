-- Mission Next Technical Academy — completion/score integrity guards.
--
-- This migration is deliberately LOCAL-ONLY until an authorized operator
-- reviews and applies it (same convention as 20260829130000_fixed_credit_
-- hours.sql). Do not `supabase db push` this without a deliberate decision.
--
-- Bug-bounty finding, 2026-09-01: module_progress, lab_attempts, and
-- capstone_submissions are all owned-row RLS (`user_id = auth.uid()`), with
-- no server-side check that a claimed 'complete' state or score reflects
-- real work — has_module_access() only checks the student is enrolled in
-- the track, not that they earned the outcome. Since 20260901090000
-- (completion_reporting_snapshot.sql), a module_progress row reaching
-- state='complete' is no longer just a UI badge: it triggers an immutable
-- clock-hour credit award (fixed_credit_hours.sql) and freezes an
-- append-only official reporting record consumed by the CIE/Form 801
-- compliance PDFs. A student who calls the same upsert the app already
-- uses (portal/app.js markModuleCompleteRemote / upsertModuleProgress),
-- but with fabricated values, could self-award a completed track and a
-- forged transcript with no lab interaction at all.
--
-- What this migration does NOT fully solve: grading itself runs client-side
-- (the labs are in-browser simulations — see portal/lab-runtime.js and the
-- module JS files' own scorers), and the pre-2026-08-28 "big simplification"
-- deliberately dropped the DB-side modules/labs catalogue in favor of
-- portal/data.js as the single source of truth (20260828160000_simplify_
-- schema.sql). Without reintroducing a lab_key->module_key mapping table in
-- the database (a bigger, separate call — ask before doing that) or moving
-- scoring server-side, there is no way to verify from SQL alone that a
-- specific completed lab_attempts row corresponds to a specific completed
-- module. What follows instead is defense in depth that closes the cheapest,
-- most damaging version of the attack (one batched write forging an entire
-- track with zero interaction) and enforces internal consistency:
--
--   1. A lab_attempts row can't claim state='complete' with a scored,
--      failing result (score below its own pass_threshold, default 70) —
--      only a genuinely passing score, or an ungraded/walkthrough lab
--      (score left null, same as existing legitimate rows already in
--      production — see preflight check below), can be 'complete'.
--   2. A capstone_submissions row can't claim a passing score (>=70)
--      while failing its own critical-error gate, and score is bounded to
--      a sane [0, 100].
--   3. module_progress.state='complete' requires percent=100 and a
--      completed_at timestamp (was previously just convention).
--   4. module_progress.state='complete' requires the student's distinct
--      count of *completed* lab_attempts in that track to be at least the
--      number of modules they're claiming complete in that track (this
--      row included) — verified against live data below to hold for every
--      real student today (they have MORE distinct completed labs than
--      completed modules, since several modules record more than one lab
--      attempt). This is a ratio floor, not a per-module proof, but it
--      means forging N completed modules first requires N distinct
--      completed lab attempts, not one free-form UPDATE.
--   5. A module_progress row, once 'complete', cannot be reverted to a
--      lesser state except by an admin — matching the "completion facts
--      are frozen" philosophy already used by completion_reporting_
--      snapshots and student_course_hour_awards.
--
-- Preflight run against the linked project on 2026-09-01 confirmed every
-- constraint below is satisfied by current live data (0 violations, or for
-- lab_attempts specifically: 4 existing 'complete' rows with a null score —
-- lab-soc-environment, an ungraded walkthrough — which is why the score
-- check below allows a null score rather than requiring one):
--
--   lab_attempts   state='complete' AND (score < pass_threshold)     : 0
--   capstone_submissions  score outside [0,100]                     : 0 (table is empty)
--   module_progress  state='complete' AND (percent<>100 OR completed_at is null) : 0
--   module_progress  state='complete' with zero completed lab_attempts in track  : 0
--   ratio check (distinct completed labs >= completed modules), per student      : holds (4 vs 3) for every SOCAN student with progress today

-- ------------------------------------------------- same-row consistency

alter table public.lab_attempts
  add constraint lab_attempts_complete_needs_passing_score
  check (state <> 'complete' or score is null or score >= coalesce(pass_threshold, 70));

alter table public.capstone_submissions
  add constraint capstone_submissions_score_range
  check (score is null or (score >= 0 and score <= 100)),
  add constraint capstone_submissions_gate_consistent
  check (passed_critical_error_gate is null or passed_critical_error_gate = (critical_error_count = 0)),
  add constraint capstone_submissions_passing_needs_gate
  check (score is null or score < 70 or coalesce(passed_critical_error_gate, false));

alter table public.module_progress
  add constraint module_progress_complete_is_consistent
  check (state <> 'complete' or (percent = 100 and completed_at is not null));

-- --------------------------------------------- cross-table completion guard

create or replace function public.guard_module_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_modules_complete integer;
  v_labs_complete     integer;
begin
  if new.track_code = 'ADMIN' or public.is_admin() then
    return new;
  end if;

  select count(*) into v_modules_complete
  from public.module_progress
  where user_id = new.user_id and track_code = new.track_code
    and state = 'complete' and module_key <> new.module_key;
  v_modules_complete := v_modules_complete + 1; -- the row being written

  select count(distinct lab_key) into v_labs_complete
  from public.lab_attempts
  where user_id = new.user_id and track_code = new.track_code and state = 'complete';

  if v_labs_complete < v_modules_complete then
    raise exception
      'Module cannot be marked complete: % completed module(s) would be claimed but only % distinct passing lab attempt(s) are recorded for this track.',
      v_modules_complete, v_labs_complete;
  end if;

  return new;
end;
$$;

drop trigger if exists module_progress_guard_completion on public.module_progress;
create trigger module_progress_guard_completion
  before insert or update of state on public.module_progress
  for each row
  when (new.state = 'complete')
  execute function public.guard_module_completion();

-- ------------------------------------------ completion is frozen, once set

create or replace function public.guard_module_progress_immutable_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.state = 'complete' and new.state <> 'complete' and not public.is_admin() then
    raise exception 'A completed module cannot be reverted.';
  end if;
  return new;
end;
$$;

drop trigger if exists module_progress_guard_immutable on public.module_progress;
create trigger module_progress_guard_immutable
  before update on public.module_progress
  for each row
  execute function public.guard_module_progress_immutable_complete();

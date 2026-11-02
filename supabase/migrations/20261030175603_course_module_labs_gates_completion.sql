-- Help Desk Module 1 completes on its Prove It, not its two Practice It labs
-- (decided by Megan, 2026-10-30).
--
-- DO NOT APPLY TO PRODUCTION until a Module 1 Prove It can submit to
-- lab-its-01-prove-it. Until then no Help Desk student can complete Module 1,
-- and Modules 2-12 stay locked.
--
-- Why: student_verified_module_progress requires an approved attempt for
-- EVERY course_module_labs row of a module. its-01 mapped two Practice It
-- labs (Lab 1.1 evidence upload, Lab 1.2 coach walkthrough), so Module 1
-- completed without an independent Prove It. Module 1 now requires only
-- lab-its-01-prove-it (the independent HD-2125 admin-rights request).
--
-- Why a column, not a delete (unlike 20261005200000, SOC): Labs 1.1 and 1.2
-- still submit. Lab evidence storage (can_write_lab_evidence) only accepts
-- uploads for a course_module_labs lab, and the one-pending rule
-- (guard_lab_attempt_single_pending) only guards course_module_labs labs.
-- Deleting the rows would refuse every Lab 1.1 upload and drop the
-- one-waiting-attempt limit. The rows stay; gates_completion = false.
--
-- Kept:
--   - every course_module_labs row; lab-its-01-lms-validation and
--     lab-its-01-ticket-triage now have gates_completion = false
--   - every lab_attempts row (none are changed or deleted); Labs 1.1 and 1.2
--     still save, show in Lab Attempts and count in the grading badges
--   - evidence storage and the one-pending rule, which keep reading every row
--   - admin overrides (module_progress.admin_override*), untouched
--   - student_course_hour_awards, untouched
-- Added:
--   - course_module_labs.gates_completion boolean not null default true
--     (every existing row true, so SOC, AI/ML, Electrical and Help Desk
--     Modules 2-12 behave exactly as before)
--   - row ('HDESK', 'its-01', 'lab-its-01-prove-it'), gates_completion true
--   - table module_progress_its01_gate_backup: the before-image (state,
--     percent, completed_at) of every module_progress row step 4 demotes;
--     RLS on, no API access
-- Changed:
--   - student_verified_module_progress: same formula as
--     20261017130000_module_one_completion_case_console.sql, joined only to
--     rows with gates_completion = true
--   - module_progress, HDESK its-01 rows only: a row with state 'complete'
--     that the verified view no longer supports (no approved Prove It, no
--     admin override) goes back to 'in_progress', percent capped at 99,
--     completed_at cleared, updated_at unchanged. The immutable-completion
--     and updated_at triggers are disabled for this one update only, as in
--     20260916100000.
--
-- ROLLBACK:
--   alter table public.module_progress disable trigger module_progress_guard_immutable;
--   alter table public.module_progress disable trigger module_progress_touch;
--   update public.module_progress mp
--     set state = b.state, percent = b.percent, completed_at = b.completed_at
--     from public.module_progress_its01_gate_backup b
--     where mp.user_id = b.user_id and mp.module_key = b.module_key;
--   alter table public.module_progress enable trigger module_progress_touch;
--   alter table public.module_progress enable trigger module_progress_guard_immutable;
--   drop table public.module_progress_its01_gate_backup;
--   recreate student_verified_module_progress from 20261017130000;
--   delete from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-01-prove-it';
--   alter table public.course_module_labs drop column gates_completion;
--
-- Dated 2026-10-30.

-- ------------------------------------------------------------ 1. column
alter table public.course_module_labs
  add column if not exists gates_completion boolean not null default true;

comment on table public.course_module_labs is
  'Canonical assessment-to-module map. A module is verified complete only when every mapped lab with gates_completion = true has an instructor-approved attempt. Rows with gates_completion = false are Practice It labs: they still submit, upload evidence and take one waiting attempt, but never gate completion. Any new reader of this table must decide whether it filters on gates_completion. Update this map in the same migration as any curriculum lab change.';

comment on column public.course_module_labs.gates_completion is
  'true: an approved attempt of this lab is required for verified module completion (student_verified_module_progress; the portal''s required-labs list). false: a Practice It lab; still read by evidence storage and the one-pending rule. Any new reader of course_module_labs must decide whether it filters on this column.';

-- ------------------------------------------------------------ 2. rows
update public.course_module_labs
set gates_completion = false
where track_code = 'HDESK'
  and module_key = 'its-01'
  and lab_key in ('lab-its-01-lms-validation', 'lab-its-01-ticket-triage');

insert into public.course_module_labs (track_code, module_key, lab_key, gates_completion)
values ('HDESK', 'its-01', 'lab-its-01-prove-it', true)
on conflict (track_code, lab_key) do update
  set module_key = excluded.module_key, gates_completion = excluded.gates_completion;

-- ------------------------------------------------------------ 3. view
create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select s.user_id, r.track_code, r.module_key,
  coalesce(mp.admin_override, false)
  or (
    bool_and(exists (
      select 1 from public.lab_attempts la
      where la.user_id = s.user_id and la.track_code = r.track_code and la.lab_key = r.lab_key
        and la.state = 'complete'
        and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
        and coalesce(jsonb_array_length(la.result->'critical_errors'), 0) = 0
        -- Instructor approval is the gate for every module (owner rule,
        -- 2026-10-05). Previously this applied to soc-01 only.
        and la.reviewed_at is not null
        and la.reviewed_by is not null
        and la.reviewed_by <> la.user_id
        and la.redo_requested = false
        and (r.lab_key <> 'lab-soc-escalation' or la.result ? 'case_record')
    ))
    and (r.module_key <> 'soc-01' or (
      coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
      and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
    ))
  ) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code and r.gates_completion
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

-- ------------------------------------------------------------ 4. module_progress
-- Before-image of every row this step demotes, for the rollback. Academy
-- only: no API role can read or write it.
create table if not exists public.module_progress_its01_gate_backup (
  user_id uuid not null,
  track_code text not null,
  module_key text not null,
  state public.progress_state not null,
  percent integer,
  completed_at timestamptz,
  backed_up_at timestamptz not null default now(),
  primary key (user_id, module_key)
);
comment on table public.module_progress_its01_gate_backup is
  'Before-image of the Help Desk its-01 module_progress rows demoted by 20261030175603_course_module_labs_gates_completion.sql. Used only by that migration''s rollback.';
alter table public.module_progress_its01_gate_backup enable row level security;
revoke all on public.module_progress_its01_gate_backup from public, anon, authenticated;

insert into public.module_progress_its01_gate_backup (user_id, track_code, module_key, state, percent, completed_at)
select mp.user_id, mp.track_code, mp.module_key, mp.state, mp.percent, mp.completed_at
from public.module_progress mp
where mp.track_code = 'HDESK'
  and mp.module_key = 'its-01'
  and mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code
      and v.module_key = mp.module_key and v.complete
  )
on conflict (user_id, module_key) do nothing;

-- module_progress_touch is disabled too, so updated_at (the student's last
-- activity in course_progress) is not changed by this correction.
alter table public.module_progress disable trigger module_progress_guard_immutable;
alter table public.module_progress disable trigger module_progress_touch;
update public.module_progress mp
set state = 'in_progress',
    percent = least(mp.percent, 99),
    completed_at = null
where mp.track_code = 'HDESK'
  and mp.module_key = 'its-01'
  and mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code
      and v.module_key = mp.module_key and v.complete
  );
alter table public.module_progress enable trigger module_progress_touch;
alter table public.module_progress enable trigger module_progress_guard_immutable;

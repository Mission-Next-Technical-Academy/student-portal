-- Help Desk Module 8 (key its-06) completes on its Prove It, the one-ticket
-- shift (lab-its-06-prove-it), not on its guided lab. The Prove It takes an
-- official faculty grade and is scored at submit by the shared engine
-- (20261119204423).
--
-- Why: Module 8's guided lab (Lab 8.1, lab-its-06-identity-access) and its
-- practice tickets (Lab 8.2, lab-its-06-practice-tickets) are Practice It now:
-- feedback only, no score. The independent Prove It is the module's graded
-- evidence, as lab-its-01-prove-it, lab-its-10-prove-it, lab-its-11-prove-it,
-- lab-its-02-prove-it, lab-its-03-prove-it, lab-its-07-prove-it and
-- lab-its-05-prove-it are for Modules 1 to 7 (20261030175603, 20261120213000,
-- 20261123022947, 20261123190000, 20261124200131, 20261125052435,
-- 20261126021451).
--
-- What changes
--   1. Guard: refuses to run if a lab-its-06-prove-it attempt was already
--      reviewed (it would have no official grade). Decide what happens to
--      such attempts before applying.
--   2. course_module_labs, HDESK only:
--        - lab-its-06-identity-access: gates_completion = false. The row
--          stays, so its evidence storage and the one-pending rule keep
--          working.
--        - lab-its-06-prove-it: new row, gates_completion = true,
--          requires_official_score = true (the submit trigger scores
--          kind 'hdesk-prove' attempts on it).
--      lab-its-06-practice-tickets gets no row: it never gates completion
--      (as lab-its-05-practice-tickets, 20261126021451).
--   3. Table module_progress_its06_gate_backup: the before-image of every row
--      step 4 demotes. RLS on, no API access.
--   4. module_progress, HDESK its-06 rows only: a 'complete' row the verified
--      view no longer supports (no admin override, no passing official grade
--      on the Prove It) goes back to 'in_progress', percent capped at 99,
--      completed_at cleared, updated_at unchanged. The immutable-completion
--      and updated_at triggers are disabled for this one update only, as in
--      20261126021451.
--   No scoring function and no view changes: the engine from 20261119204423
--   has every check this Prove It's key uses. No key is created here: the
--   repository is public, and the key is loaded by hand.
--
-- ROLLBACK (SQL Editor, one transaction):
--   alter table public.module_progress disable trigger module_progress_guard_immutable;
--   alter table public.module_progress disable trigger module_progress_touch;
--   update public.module_progress mp
--     set state = b.state, percent = b.percent, completed_at = b.completed_at
--     from public.module_progress_its06_gate_backup b
--     where mp.user_id = b.user_id and mp.module_key = b.module_key;
--   alter table public.module_progress enable trigger module_progress_touch;
--   alter table public.module_progress enable trigger module_progress_guard_immutable;
--   drop table public.module_progress_its06_gate_backup;
--   delete from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-06-prove-it';
--   update public.course_module_labs set gates_completion = true
--     where track_code = 'HDESK' and lab_key = 'lab-its-06-identity-access';
--   update public.assessment_answer_keys set is_active = false
--     where track_code = 'HDESK' and lab_key = 'lab-its-06-prove-it';
--   Attempts, recommendations and grades stay as the record.
--
-- Dated 2026-11-26.

-- ------------------------------------------------------------ 1. guard
do $$
begin
  if exists (
    select 1 from public.lab_attempts
    where track_code = 'HDESK' and lab_key = 'lab-its-06-prove-it' and reviewed_at is not null
  ) then
    raise exception 'lab-its-06-prove-it already has reviewed attempts with no official grade. Decide what happens to them before applying this migration.';
  end if;
end;
$$;

-- ------------------------------------------------------------ 2. rows
update public.course_module_labs
set gates_completion = false
where track_code = 'HDESK'
  and module_key = 'its-06'
  and lab_key = 'lab-its-06-identity-access';

insert into public.course_module_labs (track_code, module_key, lab_key, gates_completion, requires_official_score)
values ('HDESK', 'its-06', 'lab-its-06-prove-it', true, true)
on conflict (track_code, lab_key) do update
  set module_key = excluded.module_key,
      gates_completion = excluded.gates_completion,
      requires_official_score = excluded.requires_official_score;

-- ------------------------------------------------------------ 3. backup
create table if not exists public.module_progress_its06_gate_backup (
  user_id uuid not null,
  track_code text not null,
  module_key text not null,
  state public.progress_state not null,
  percent integer,
  completed_at timestamptz,
  backed_up_at timestamptz not null default now(),
  primary key (user_id, module_key)
);
comment on table public.module_progress_its06_gate_backup is
  'Before-image of the Help Desk its-06 module_progress rows demoted by 20261126162912_hdesk_its06_prove.sql. Used only by that migration''s rollback.';
alter table public.module_progress_its06_gate_backup enable row level security;
revoke all on public.module_progress_its06_gate_backup from public, anon, authenticated;

-- ------------------------------------------------------------ 4. demotion
insert into public.module_progress_its06_gate_backup (user_id, track_code, module_key, state, percent, completed_at)
select mp.user_id, mp.track_code, mp.module_key, mp.state, mp.percent, mp.completed_at
from public.module_progress mp
where mp.track_code = 'HDESK'
  and mp.module_key = 'its-06'
  and mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code
      and v.module_key = mp.module_key and v.complete
  )
on conflict (user_id, module_key) do nothing;

alter table public.module_progress disable trigger module_progress_guard_immutable;
alter table public.module_progress disable trigger module_progress_touch;
update public.module_progress mp
set state = 'in_progress',
    percent = least(mp.percent, 99),
    completed_at = null
where mp.track_code = 'HDESK'
  and mp.module_key = 'its-06'
  and mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code
      and v.module_key = mp.module_key and v.complete
  );
alter table public.module_progress enable trigger module_progress_touch;
alter table public.module_progress enable trigger module_progress_guard_immutable;

-- Admin manual completion override — a single, permanent source of truth for
-- "an admin manually marked this module complete."
--
-- Bug report (2026-09-23): 4437023872-SOCAN shows ~94% complete in the admin
-- roster (11/12 modules genuinely verified), but the student experience
-- resets to "starting from the beginning." Root cause, confirmed live:
-- hasModuleAccess() (portal/app.js) requires the FULL chain of prior modules
-- to be verified complete, not just the immediately-preceding one
-- (2026-09-16 sequential-gating sprint). soc-01 alone is not verified for
-- this account: its module_progress.detail flags were backfilled true, but
-- its lab-soc-escalation lab_attempts row (score 100, state complete) has no
-- reviewed_at/reviewed_by (faculty-review gate, 20260918) and no recorded
-- simulator_performance.actions (independent-case gate, 20260918/20260917).
-- Both gates were added AFTER that row was backfilled, so a historically
-- "complete" demo account silently fell out of compliance and, because of
-- sequential gating, that one module now locks all 12 for the student —
-- exactly the "starts from the beginning" symptom, even though the other 11
-- modules are genuinely, separately verified.
--
-- This is not a one-account bug: student_verified_module_progress's formula
-- has been tightened multiple times (20260916, 20260917 x2, 20260918) and
-- will likely be tightened again as the curriculum evolves. Any admin
-- "manual switch to complete" that only imitates the current formula (by
-- writing detail flags or a synthetic lab_attempts row) is fragile by
-- construction — it silently breaks the next time the formula changes,
-- exactly as happened here. The fix is a real override that is NEVER
-- computed from the assessment formula, so it can never be invalidated by a
-- future change to it.

alter table public.module_progress
  add column if not exists admin_override boolean not null default false,
  add column if not exists admin_override_by uuid references auth.users(id),
  add column if not exists admin_override_at timestamptz,
  add column if not exists admin_override_note text;

comment on column public.module_progress.admin_override is
  'An admin manually declared this module complete, independent of the assessment formula in student_verified_module_progress. Set only via public.admin_set_module_override() — never written directly by student-facing code. Once true, this module reads complete everywhere (nav rail, module cards, sequential gating, admin roster) regardless of how the underlying lab/detail formula evolves.';

-- Same formula as 20260918100000_module_one_faculty_performance_gate.sql,
-- with one addition: an admin override unconditionally satisfies completion
-- for that module, bypassing every other condition in this view.
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
        and (r.module_key <> 'soc-01' or (la.reviewed_at is not null and la.reviewed_by is not null and la.redo_requested = false))
        and (r.lab_key <> 'lab-soc-escalation' or coalesce(jsonb_array_length(la.result->'simulator_performance'->'actions'), 0) > 0)
    ))
    and (r.module_key <> 'soc-01' or (
      coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
      and coalesce(mp.detail->>'quizPassed', 'false') = 'true'
      and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
    ))
  ) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail, mp.admin_override;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

-- Previously this trigger only reconciled on a soc-01 detail change (that
-- was the only module whose extra jsonb criteria could flip after the row
-- already existed). admin_override applies to every module, so broaden both
-- the trigger's watched columns and the function's dispatch to match.
create or replace function public.reconcile_verified_module_progress()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_module_key text;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if tg_table_name = 'lab_attempts' then
    select module_key into v_module_key from public.course_module_labs
    where track_code = new.track_code and lab_key = new.lab_key;
    if v_module_key is not null then perform public.sync_verified_module_progress(new.user_id, new.track_code, v_module_key); end if;
  elsif tg_table_name = 'module_progress' then
    perform public.sync_verified_module_progress(new.user_id, new.track_code, new.module_key);
  end if;
  return new;
end;
$$;

drop trigger if exists module_progress_reconcile_verified_module_progress on public.module_progress;
create trigger module_progress_reconcile_verified_module_progress
after insert or update of detail, admin_override on public.module_progress
for each row execute function public.reconcile_verified_module_progress();

-- The single choke point for setting/clearing an override. Security definer
-- so it can write any student's row (bypassing module_progress_own's
-- self-only RLS) while still gating on is_admin() itself, same pattern as
-- guard_module_completion()'s admin bypass. Clearing an override
-- (p_override = false) does not retroactively demote an already-'complete'
-- module_progress.state — same "completion never regresses once set"
-- invariant as markModuleInProgressRemote()/guard_module_progress_immutable_complete
-- elsewhere in this schema; it only stops the override from being the reason
-- a *future* formula tightening keeps the module looking complete.
create or replace function public.admin_set_module_override(
  p_user_id uuid,
  p_track_code text,
  p_module_key text,
  p_override boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can set a module completion override.';
  end if;

  insert into public.module_progress (user_id, track_code, module_key, admin_override, admin_override_by, admin_override_at, admin_override_note)
  values (
    p_user_id, p_track_code, p_module_key, p_override,
    case when p_override then auth.uid() else null end,
    case when p_override then now() else null end,
    case when p_override then p_note else null end
  )
  on conflict (user_id, module_key) do update
    set admin_override = excluded.admin_override,
        admin_override_by = excluded.admin_override_by,
        admin_override_at = excluded.admin_override_at,
        admin_override_note = excluded.admin_override_note;

  perform public.sync_verified_module_progress(p_user_id, p_track_code, p_module_key);
end;
$$;

revoke all on function public.admin_set_module_override(uuid, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.admin_set_module_override(uuid, text, text, boolean, text) to authenticated;

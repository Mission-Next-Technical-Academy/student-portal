-- Mission Next Technical Academy — verified assessment progress.
--
-- module_progress used to be written from browser engagement.  It is useful
-- as a learner's working-state record, but it cannot be the source for a
-- completion percentage or an academic record.  This migration introduces a
-- small, versioned assessment map and derives completion from durable passing
-- lab attempts.  The same read model serves every technical track.

create table if not exists public.course_module_labs (
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  module_key text not null,
  lab_key text not null,
  primary key (track_code, lab_key),
  unique (track_code, module_key, lab_key)
);

comment on table public.course_module_labs is
  'Canonical assessment-to-module map. A module is verified complete only when every mapped lab has a passing durable attempt. Update this map in the same migration as any curriculum lab change.';

insert into public.course_module_labs (track_code, module_key, lab_key) values
  ('SOCAN','soc-01','lab-soc-environment'), ('SOCAN','soc-01','lab-soc-escalation'),
  ('SOCAN','soc-02','lab-identity-investigation'), ('SOCAN','soc-03','lab-siem-triage'),
  ('SOCAN','soc-04','lab-detection-rule'),
  ('SOCAN','soc-05','lab-endpoint-investigation'), ('SOCAN','soc-05','lab-endpoint-independent'),
  ('SOCAN','soc-06','lab-threat-hunt'), ('SOCAN','soc-06','lab-threat-hunt-independent'),
  ('SOCAN','soc-07','lab-email-triage'), ('SOCAN','soc-07','lab-network-investigation'), ('SOCAN','soc-07','lab-network-email-independent'),
  ('SOCAN','soc-08','lab-vuln-prioritization'), ('SOCAN','soc-08','lab-vuln-queue'),
  ('SOCAN','soc-09','lab-active-incident'), ('SOCAN','soc-09','lab-independent-response'),
  ('SOCAN','soc-10','lab-evidence-collection'), ('SOCAN','soc-10','lab-attack-mapping'),
  ('SOCAN','soc-11','lab-exec-report'), ('SOCAN','soc-11','lab-soc-metrics'), ('SOCAN','soc-12','lab-capstone'),
  ('HDESK','its-01','lab-its-01-lms-validation'), ('HDESK','its-01','lab-its-01-ticket-triage'),
  ('HDESK','its-02','lab-its-02-vm-build'), ('HDESK','its-02','lab-its-02-vm-snapshot-server'), ('HDESK','its-02','lab-its-02-device-manager'), ('HDESK','its-02','lab-its-02-print-spooler'),
  ('HDESK','its-03','lab-its-03-blank-desktop'), ('HDESK','its-04','lab-its-04-connectivity'), ('HDESK','its-05','lab-its-05-server-ad'), ('HDESK','its-06','lab-its-06-identity-access'), ('HDESK','its-07','lab-its-07-app-cert'), ('HDESK','its-08','lab-its-08-unfamiliar-problems'), ('HDESK','its-09','lab-its-09-security-incidents'), ('HDESK','its-10','lab-its-10-priority-queue'), ('HDESK','its-11','lab-its-11-handoff-documentation'), ('HDESK','its-12','lab-its-12-capstone'),
  ('AIENG','aim-01','lab-aim-01-cli-utility'), ('AIENG','aim-02','lab-aim-02-numpy-bayes'), ('AIENG','aim-03','lab-aim-03-data-pipeline'), ('AIENG','aim-04','lab-aim-04-eda-brief'), ('AIENG','aim-05','lab-aim-05-supervised-models'), ('AIENG','aim-06','lab-aim-06-clustering-features'), ('AIENG','aim-07','lab-aim-07-eval-tuning'), ('AIENG','aim-08','lab-aim-08-neural-network'), ('AIENG','aim-09','lab-aim-09-applied-ai'), ('AIENG','aim-10','lab-aim-10-mlops'), ('AIENG','aim-11','lab-aim-11-responsible-ai'), ('AIENG','aim-12','lab-aim-12-capstone')
on conflict (track_code, lab_key) do update set module_key = excluded.module_key;

alter table public.course_module_labs enable row level security;
revoke all on public.course_module_labs from anon;
grant select on public.course_module_labs to authenticated;
create policy course_module_labs_authenticated_read on public.course_module_labs for select to authenticated using (true);

-- Detail requirements are intentionally explicit: SOC Module 1 has assessed
-- lessons and a knowledge check in addition to its two recorded labs.
create or replace view public.student_verified_module_progress
with (security_invoker = true) as
select
  s.user_id,
  r.track_code,
  r.module_key,
  bool_and(exists (
    select 1 from public.lab_attempts la
    where la.user_id = s.user_id
      and la.track_code = r.track_code
      and la.lab_key = r.lab_key
      and la.state = 'complete'
      and (la.score is null or la.score >= coalesce(la.pass_threshold, 70))
  ))
  and (r.module_key <> 'soc-01' or (
    coalesce(mp.detail->>'lessonsComplete', 'false') = 'true'
    and coalesce(mp.detail->>'quizPassed', 'false') = 'true'
    and coalesce(mp.detail->>'consoleCompleted', 'false') = 'true'
    and coalesce(mp.detail->>'lab2Completed', 'false') = 'true'
  )) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
left join public.module_progress mp on mp.user_id = s.user_id and mp.track_code = r.track_code and mp.module_key = r.module_key
group by s.user_id, r.track_code, r.module_key, mp.detail;

revoke all on public.student_verified_module_progress from anon;
grant select on public.student_verified_module_progress to authenticated;

-- The portal and administrative reporting now share this read model. Stale
-- complete badges in module_progress are intentionally excluded.
create or replace view public.course_progress
with (security_invoker = true) as
select
  s.user_id,
  s.track_code,
  12::int as modules_total,
  coalesce(v.modules_complete, 0)::bigint as modules_complete,
  round(100.0 * coalesce(v.modules_complete, 0) / 12.0, 1) as percent_complete,
  a.last_active,
  coalesce(v.modules_in_progress, 0)::bigint as modules_in_progress
from public.students s
left join (
  select v.user_id, v.track_code,
    count(*) filter (where v.complete) as modules_complete,
    count(*) filter (where not v.complete and mp.state = 'in_progress') as modules_in_progress
  from public.student_verified_module_progress v
  left join public.module_progress mp on mp.user_id = v.user_id and mp.track_code = v.track_code and mp.module_key = v.module_key
  group by v.user_id, v.track_code
) v on v.user_id = s.user_id and v.track_code = s.track_code
left join (
  select user_id, track_code, max(active_at) as last_active from (
    select user_id, track_code, updated_at as active_at from public.module_progress
    union all select user_id, track_code, started_at from public.lab_attempts
    union all select user_id, track_code, completed_at from public.lab_attempts
  ) activity where active_at is not null group by user_id, track_code
) a on a.user_id = s.user_id and a.track_code = s.track_code;

-- Repair pre-existing browser-derived completion rows. This does not delete
-- work or attempts; it only prevents unsupported rows from being presented as
-- completed. Disable the old immutable-completion guard for this one data
-- correction, then restore it immediately.
alter table public.module_progress disable trigger module_progress_guard_immutable;
update public.module_progress mp
set state = case when mp.state = 'complete' then 'in_progress' else mp.state end,
    percent = case when mp.state = 'complete' then least(mp.percent, 99) else mp.percent end,
    completed_at = case when mp.state = 'complete' then null else mp.completed_at end
where mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code and v.module_key = mp.module_key and v.complete
  );
alter table public.module_progress enable trigger module_progress_guard_immutable;

-- Keep module_progress convenient for existing screens, but only promote it
-- after the verified read model says the student earned it. The displayed
-- percentage never depends on this cache-like row.
create or replace function public.sync_verified_module_progress(p_user_id uuid, p_track_code text, p_module_key text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = p_user_id and v.track_code = p_track_code and v.module_key = p_module_key and v.complete
  ) then
    insert into public.module_progress (user_id, track_code, module_key, state, percent, completed_at)
    values (p_user_id, p_track_code, p_module_key, 'complete', 100, now())
    on conflict (user_id, module_key) do update
      set state = 'complete', percent = 100, completed_at = coalesce(module_progress.completed_at, excluded.completed_at);
  end if;
end;
$$;

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
  elsif tg_table_name = 'module_progress' and new.module_key = 'soc-01' then
    perform public.sync_verified_module_progress(new.user_id, new.track_code, new.module_key);
  end if;
  return new;
end;
$$;

drop trigger if exists lab_attempts_reconcile_verified_module_progress on public.lab_attempts;
create trigger lab_attempts_reconcile_verified_module_progress
after insert or update of state, score, pass_threshold, redo_requested on public.lab_attempts
for each row execute function public.reconcile_verified_module_progress();

drop trigger if exists module_progress_reconcile_verified_module_progress on public.module_progress;
create trigger module_progress_reconcile_verified_module_progress
after insert or update of detail on public.module_progress
for each row execute function public.reconcile_verified_module_progress();

revoke all on function public.sync_verified_module_progress(uuid, text, text) from public, anon, authenticated;
revoke all on function public.reconcile_verified_module_progress() from public, anon, authenticated;

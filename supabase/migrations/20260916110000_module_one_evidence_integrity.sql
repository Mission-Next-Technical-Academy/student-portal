-- Module 01 cannot use a single aggregate browser flag as evidence for nine
-- separate lesson requirements. Keep one durable record per requirement so
-- the card, review screen, and course rollup are reading the same facts.

create table public.module_completion_evidence (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT')),
  module_key text not null,
  evidence_key text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, track_code, module_key, evidence_key)
);

alter table public.module_completion_evidence enable row level security;
revoke all on public.module_completion_evidence from anon;
grant select, insert on public.module_completion_evidence to authenticated;
create policy module_completion_evidence_own on public.module_completion_evidence
  for all to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code))
  with check (user_id = auth.uid() and public.has_module_access(track_code));
create policy module_completion_evidence_admin_read on public.module_completion_evidence
  for select to authenticated using (public.is_admin());

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
    select count(*) = 10 from public.module_completion_evidence e
    where e.user_id = s.user_id and e.track_code = r.track_code and e.module_key = 'soc-01'
      and e.evidence_key in ('lesson-1','lesson-2','lesson-3','lesson-4','lesson-5','lesson-6','lesson-7','lesson-8','lesson-9','knowledge-check')
  )) as complete
from public.students s
join public.course_module_labs r on r.track_code = s.track_code
group by s.user_id, r.track_code, r.module_key;

-- The old aggregate detail cannot establish which of the nine requirements
-- was completed. Clear only unsupported Module 1 completion claims; attempts
-- and working state are retained.
alter table public.module_progress disable trigger module_progress_guard_immutable;
update public.module_progress mp
set state = 'in_progress', percent = least(percent, 99), completed_at = null
where mp.track_code = 'SOCAN' and mp.module_key = 'soc-01' and mp.state = 'complete'
  and not exists (
    select 1 from public.student_verified_module_progress v
    where v.user_id = mp.user_id and v.track_code = mp.track_code and v.module_key = mp.module_key and v.complete
  );
alter table public.module_progress enable trigger module_progress_guard_immutable;

revoke all on public.module_completion_evidence from anon;

-- Student assessment evidence is append-only. Official outcomes remain in
-- capstone_reviews, which is writable only through staff review policies.

-- A learner may make another submission for the same capstone stage; preserve
-- each one as a separate immutable snapshot instead of replacing prior work.
alter table public.capstone_submissions
  drop constraint if exists capstone_submissions_user_id_track_code_stage_key;
create index if not exists capstone_submissions_user_track_stage_submitted_idx
  on public.capstone_submissions (user_id, track_code, stage, submitted_at desc);

drop policy if exists capstone_own on public.capstone_submissions;
drop policy if exists capstone_own_read on public.capstone_submissions;
drop policy if exists capstone_own_insert on public.capstone_submissions;
create policy capstone_own_read on public.capstone_submissions
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code));
create policy capstone_own_insert on public.capstone_submissions
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
revoke update, delete on public.capstone_submissions from authenticated;
grant select, insert on public.capstone_submissions to authenticated;

-- Only the newest submission per stage contributes to the learner-facing
-- scorecard, so retries do not overweight a stage.
create or replace view public.capstone_scorecard
with (security_invoker = true) as
with latest_stage as (
  select distinct on (user_id, track_code, stage)
    user_id, track_code, stage, score, submitted_at
  from public.capstone_submissions
  order by user_id, track_code, stage, submitted_at desc nulls last, id desc
)
select
  s.user_id,
  s.track_code,
  round(avg(s.score), 1)                                              as overall_score,
  round(avg(s.score) filter (where s.stage in (1, 2, 3, 4, 5)), 1)    as investigation_accuracy,
  round(avg(s.score) filter (where s.stage in (1, 6)), 1)              as detection_score,
  round(avg(s.score) filter (where s.stage = 7), 1)                    as threat_hunting_score,
  round(avg(s.score) filter (where s.stage in (9, 10)), 1)             as incident_response_score,
  round(avg(s.score) filter (where s.stage = 8), 1)                    as vulnerability_score,
  round(avg(s.score) filter (where s.stage in (11, 12)), 1)            as reporting_score,
  count(*) filter (where s.submitted_at is not null)                    as stages_submitted
from latest_stage s
group by s.user_id, s.track_code;

-- Module evidence is also append-only. Its primary key naturally makes a
-- repeated insert idempotent, while RLS limits reads and inserts to the owner.
drop policy if exists module_completion_evidence_own on public.module_completion_evidence;
drop policy if exists module_completion_evidence_own_read on public.module_completion_evidence;
drop policy if exists module_completion_evidence_own_insert on public.module_completion_evidence;
create policy module_completion_evidence_own_read on public.module_completion_evidence
  for select to authenticated
  using (user_id = auth.uid() and public.has_module_access(track_code));
create policy module_completion_evidence_own_insert on public.module_completion_evidence
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_module_write_access(track_code));
revoke update, delete on public.module_completion_evidence from authenticated;
grant select, insert on public.module_completion_evidence to authenticated;

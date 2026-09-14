-- M360 101 live-session schedule: cohort scoping
--
-- Schedule rows are instructional scheduling only. They remain separate from
-- attendance, clock-hour, grade, and completion records.
--
-- Existing pre-launch schedule rows are preserved. Rows that do not fall
-- inside a real cohort date range are assigned to the most recent development
-- cohort so they cannot appear in the Fall 2026 production cohort.

alter table public.m360_live_sessions
  add column if not exists cohort_id uuid;

update public.m360_live_sessions ls
set cohort_id = coalesce(
  (
    select c.id
    from public.cohorts c
    where ls.session_date between c.start_date and c.end_date
    order by c.start_date desc
    limit 1
  ),
  (
    select c.id
    from public.cohorts c
    where c.name ilike '%dev%'
       or c.name ilike '%test%'
    order by c.start_date desc
    limit 1
  )
)
where ls.cohort_id is null;

do $$
begin
  if exists (select 1 from public.m360_live_sessions where cohort_id is null) then
    raise exception 'Unable to assign every existing M360 live-session row to a cohort.';
  end if;
end
$$;

alter table public.m360_live_sessions
  alter column cohort_id set not null;

alter table public.m360_live_sessions
  drop constraint if exists m360_live_sessions_pkey;

alter table public.m360_live_sessions
  add constraint m360_live_sessions_pkey
  primary key (cohort_id, week_number, session_number);

alter table public.m360_live_sessions
  drop constraint if exists m360_live_sessions_cohort_id_fkey;

alter table public.m360_live_sessions
  add constraint m360_live_sessions_cohort_id_fkey
  foreign key (cohort_id)
  references public.cohorts(id)
  on delete restrict;

alter table public.m360_live_sessions enable row level security;

-- Keep the browser client on least-necessary table privileges. RLS still
-- determines which authenticated users can perform each permitted operation.
revoke all on table public.m360_live_sessions from anon;
revoke truncate, references, trigger on table public.m360_live_sessions from authenticated;
grant select, insert, update, delete on table public.m360_live_sessions to authenticated;

drop policy if exists m360_live_sessions_authenticated_read on public.m360_live_sessions;
drop policy if exists m360_live_sessions_cohort_read on public.m360_live_sessions;
create policy m360_live_sessions_cohort_read
on public.m360_live_sessions
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.students s
    where s.user_id = auth.uid()
      and s.cohort_id = m360_live_sessions.cohort_id
      and coalesce(s.is_enrolled, true)
  )
);

drop policy if exists m360_live_sessions_admin_insert on public.m360_live_sessions;
create policy m360_live_sessions_admin_insert
on public.m360_live_sessions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists m360_live_sessions_admin_update on public.m360_live_sessions;
create policy m360_live_sessions_admin_update
on public.m360_live_sessions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists m360_live_sessions_admin_delete on public.m360_live_sessions;
create policy m360_live_sessions_admin_delete
on public.m360_live_sessions
for delete
to authenticated
using (public.is_admin());

comment on table public.m360_live_sessions is
  'M360 101 cohort-specific live-session date/time display. Not an attendance or instructional-time record.';

comment on column public.m360_live_sessions.cohort_id is
  'Cohort whose students should see this M360 live-session schedule row.';

-- Instructor approval gate + student write lockdown (2026-10-05 audit).
--
-- Reproduced before this migration, as an ordinary student JWT against the
-- full migration set (identical to the linked project): one script inserted
-- a passing lab_attempts row per mapped lab, stamped soc-01's with its own
-- reviewed_at/reviewed_by, and the database answered 12/12 modules
-- verified, 12 fixed-credit hour awards (4,200 minutes) and a completion
-- reporting snapshot. Scores are computed in the browser
-- ('portal-client-scorer-v1'), and lab_attempts_own was `for all`, so the
-- student owned score, pass_threshold and every review column.
--
-- Owner rule (2026-10-05): a module unlocks the next one immediately after
-- its Prove It attempt is approved by an instructor -- for every module, not
-- only soc-01. The browser score stays as the instructor's pregrade; the
-- instructor's approval is what the server trusts.
--
-- What changes:
--   1. lab_attempts: students may read and INSERT their own rows only. A
--      student insert can never carry review fields or its own threshold.
--      Staff may update only the three review columns, and must sign their
--      own name to a review.
--   2. student_verified_module_progress requires an instructor approval
--      (by someone other than the learner) for every mapped lab.
--   3. module_progress.admin_override* are no longer student-writable; only
--      admin_set_module_override() (security definer) writes them.
--   4. portfolio_artifacts are insert-only for students (content_sha256 is
--      computed on insert, so an update silently broke the integrity hash).
--   5. archive_expired_cohorts()/close_idle_site_sessions() guard used
--      `current_user = 'postgres'`, which inside SECURITY DEFINER is the
--      function owner and therefore always true -- anon could call both.
--      pg_cron runs both jobs as postgres, so session_user is the correct
--      test (PostgREST requests always have session_user = authenticator).
--
-- Production data check before writing this (read-only, 2026-10-05): no
-- self-reviewed attempts, no out-of-range scores, artifact digests intact,
-- the one admin override was set by an admin. Five pre-fix accounts
-- (created 2026-08-28..09-01) hold modules completed without approval; their
-- module_progress.state stays 'complete' (guard_module_progress_immutable),
-- but the verified rollup the portal reads will show those modules pending
-- until an instructor approves the attempts already in the grading queue.

-- ------------------------------------------------------------ 1. lab_attempts

drop policy if exists lab_attempts_own on public.lab_attempts;

create policy lab_attempts_own_read on public.lab_attempts
  for select
  using (user_id = auth.uid() and public.has_module_access(track_code));

create policy lab_attempts_own_insert on public.lab_attempts
  for insert
  with check (user_id = auth.uid() and public.has_module_access(track_code));

-- No student UPDATE/DELETE policy exists any more; the grants below make the
-- staff review policies (lab_attempts_admin_review,
-- lab_attempts_assigned_instructor_review) column-scoped as well, so an
-- instructor can no longer rewrite score/state/user_id either.
revoke update, delete on public.lab_attempts from authenticated;
grant update (reviewed_at, reviewed_by, redo_requested) on public.lab_attempts to authenticated;

create or replace function public.guard_lab_attempt_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Service-role maintenance scripts and pg_cron are not API end users.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A submission is always unreviewed, and the pass mark is the academy's,
    -- not the submitter's.
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.redo_requested := false;
    new.pass_threshold := 70;
    return new;
  end if;

  -- UPDATE (staff only, enforced by RLS): a review is signed by its author.
  if new.reviewed_by is distinct from old.reviewed_by
     and new.reviewed_by is not null
     and new.reviewed_by <> auth.uid() then
    raise exception 'A lab review must be recorded under the reviewing account.';
  end if;
  if new.reviewed_by is not null and new.reviewed_by = new.user_id then
    raise exception 'A learner cannot review their own lab attempt.';
  end if;
  return new;
end;
$$;

drop trigger if exists lab_attempts_guard_write on public.lab_attempts;
create trigger lab_attempts_guard_write
  before insert or update on public.lab_attempts
  for each row execute function public.guard_lab_attempt_write();

revoke all on function public.guard_lab_attempt_write() from public, anon, authenticated;

-- ------------------------------------- 2. approval gate for every module

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

-- ------------------------------------------ 3. module_progress columns
-- portal/app.js writes user_id/module_key/track_code plus state, percent,
-- started_at, completed_at, detail and case_state (upsertModuleProgress,
-- persistModuleCaseState). PostgREST upserts put every payload column in
-- the ON CONFLICT UPDATE SET list, so the identity columns need UPDATE too;
-- module_progress_own's WITH CHECK still pins user_id to auth.uid().

revoke insert, update, delete on public.module_progress from authenticated;
grant insert (user_id, track_code, module_key, state, percent, started_at, completed_at, detail, case_state)
  on public.module_progress to authenticated;
grant update (user_id, track_code, module_key, state, percent, started_at, completed_at, detail, case_state)
  on public.module_progress to authenticated;

-- ---------------------------------------- 4. portfolio_artifacts insert-only

revoke update, delete on public.portfolio_artifacts from authenticated;

-- --------------------------------------------- 5. scheduled-job guards
CREATE OR REPLACE FUNCTION public.archive_expired_cohorts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cohort            public.cohorts%rowtype;
  v_student           public.students%rowtype;
  v_has_activity      boolean;
  -- Deliberately NOT public.admin_student_progress%rowtype — see the Case A
  -- comment below for why this function computes these fields itself
  -- instead of selecting from that view.
  v_program_slug      text;
  v_modules_total     int;
  v_modules_complete  int;
  v_percent_complete  numeric(5,1);
  v_capstone_score    numeric(5,2);
  v_status            text;
begin
  if not (public.is_admin() or session_user = 'postgres') then
    raise exception 'Administrator role required';
  end if;

  for v_cohort in
    select * from public.cohorts
    where end_date < current_date and archived_at is null
  loop
    begin -- per-cohort guard: one bad cohort can't abort the whole sweep

      for v_student in
        select * from public.students where cohort_id = v_cohort.id
      loop
        begin -- per-student guard: one bad row can't abort the rest of the cohort

          -- "Ever had real activity" per the sprint plan: any row in any of
          -- the three activity tables for this user_id, OR is_enrolled is
          -- currently true, OR enrollment_date was ever stamped (meaning
          -- they were enrolled at some point, even if since withdrawn).
          v_has_activity :=
            v_student.is_enrolled
            or v_student.enrollment_date is not null
            or exists (
                 select 1 from public.module_progress mp
                 where mp.user_id = v_student.user_id
               )
            or exists (
                 select 1 from public.lab_attempts la
                 where la.user_id = v_student.user_id
               )
            or exists (
                 select 1 from public.capstone_submissions cs
                 where cs.user_id = v_student.user_id
               );

          if v_has_activity then
            -- --------------------------------------------------- Case A ---
            -- Snapshot first. This does NOT select from
            -- public.admin_student_progress even though that view already
            -- computes the same fields — that view's own definition ends in
            -- `where public.is_admin()`, a defensive filter that calls
            -- auth.uid() (backed by the request.jwt.claim.sub GUC PostgREST
            -- sets per-request). Under the pg_cron call path there is no
            -- PostgREST request in flight, so auth.uid() is null and that
            -- filter would silently return zero rows — not an error, just an
            -- empty snapshot for every single student, every single day,
            -- forever, since this function's OWN admin gate (is_admin() OR
            -- session_user = 'postgres') already ran above and would never
            -- catch this: it's a second, independent is_admin() check inside
            -- the view, evaluated with the same null auth.uid() either way.
            -- SECURITY DEFINER only changes which role's table privileges
            -- apply (this function's owner, which is why it can read
            -- module_progress/students/etc. despite RLS) — it has no effect
            -- on auth.uid(), so it can't fix this. Instead, this inlines the
            -- exact same course_progress/capstone_scorecard joins and
            -- program_slug/status derivation admin_student_progress itself
            -- uses (20260829110000_enrollment_dates.sql), just without that
            -- extra filter — this function already authorized itself once,
            -- at the top, and doesn't need a second admin check per row.
            select
              case v_student.track_code
                when 'SOCAN' then 'soc-analyst'
                when 'HDESK' then 'it-support'
                when 'AIENG' then 'ai-ml'
                when 'ELECT' then 'electrical'
                else null
              end,
              coalesce(cp.modules_total, 12),
              coalesce(cp.modules_complete, 0),
              coalesce(cp.percent_complete, 0),
              cs.overall_score,
              case
                when coalesce(cp.percent_complete, 0) >= 100 then 'completed'
                when not v_student.is_enrolled and v_student.enrollment_date is not null then 'withdrawn'
                when v_student.is_enrolled then 'active'
                else 'not_yet_started'
              end
            into v_program_slug, v_modules_total, v_modules_complete,
                 v_percent_complete, v_capstone_score, v_status
            from (select 1) as _dummy
            left join public.course_progress cp
              on cp.user_id = v_student.user_id and cp.track_code = v_student.track_code
            left join public.capstone_scorecard cs
              on cs.user_id = v_student.user_id and cs.track_code = v_student.track_code;

            insert into public.cohort_archive_snapshots (
              user_id, student_id, cohort_id, cohort_name, track_code,
              program_slug, modules_total, modules_complete, percent_complete,
              capstone_overall_score, enrollment_date, withdrawal_date,
              status_at_archive, archive_reason
            ) values (
              v_student.user_id, v_student.student_id, v_cohort.id, v_cohort.name,
              v_student.track_code, v_program_slug, v_modules_total,
              v_modules_complete, v_percent_complete,
              v_capstone_score, v_student.enrollment_date,
              v_student.withdrawal_date, v_status, 'cohort_expired'
            );

            -- Close their open enrollment episode for this track, if any.
            -- Deliberately scoped to withdrawn_at is null: an already-closed
            -- episode (e.g. a student who withdrew and was re-enrolled
            -- before the cohort expired) is left exactly as it is — this
            -- migration only ever touches the currently-open episode, never
            -- rewrites history.
            update public.enrollment_periods
            set withdrawn_at = now(),
                withdrawal_classification = 'cohort_expired',
                closed_at = now()
            where user_id = v_student.user_id
              and track_code = v_student.track_code
              and withdrawn_at is null;

            -- Flip the flag and stamp the archival marker. withdrawal_date
            -- is NOT set here on purpose: stamp_enrollment_dates()
            -- (20260829110000_enrollment_dates.sql) is a BEFORE UPDATE
            -- trigger on this same table that stamps it automatically
            -- whenever is_enrolled flips true->false in this same
            -- statement — setting it here too would just be a redundant
            -- write racing a trigger that already owns this column.
            update public.students
            set is_enrolled = false,
                cohort_archived_at = now()
            where student_id = v_student.student_id;

          else
            -- --------------------------------------------------- Case B ---
            -- Never enrolled (enrollment_date is null) AND currently
            -- disenrolled (is_enrolled = false) AND zero rows anywhere in
            -- module_progress/lab_attempts/capstone_submissions: a
            -- placeholder account this cohort's batch-generation created
            -- but that was never actually used. Per the sprint plan's
            -- locked decision, there is no compliance data to protect for
            -- an account like this, so it is deleted outright rather than
            -- archived.
            --
            -- Deleting auth.users cascades to delete this student's
            -- public.students row automatically (`user_id uuid ... not
            -- null unique references auth.users(id) on delete cascade`,
            -- 20260828120000_students_admin.sql) — no separate delete
            -- needed here.
            --
            -- Why this can never hit a restrictive foreign key: every
            -- table that references auth.users(id) with `on delete
            -- restrict` (enrollment_periods, credential_awards,
            -- completion_reporting_snapshots, student_geography_
            -- classifications) only ever gets a row written for a given
            -- user_id via a path that is gated on the exact same
            -- condition this branch already excludes. Concretely:
            -- enrollment_periods rows are created only by
            -- record_enrollment_period_transition() firing on the same
            -- is_enrolled false->true flip that stamp_enrollment_dates()
            -- uses to set enrollment_date in the first place
            -- (20260829125000_enrollment_reporting_history.sql,
            -- 20260829110000_enrollment_dates.sql — both triggers key off
            -- `when (old.is_enrolled is distinct from new.is_enrolled)`).
            -- A student with enrollment_date is null by definition never
            -- took that flip, so no enrollment_periods row — and therefore
            -- no credential_awards or completion_reporting_snapshots row,
            -- since those are only ever written against an
            -- enrollment_periods episode — can exist for them either.
            delete from auth.users where id = v_student.user_id;
          end if;

        exception when others then
          raise warning
            'archive_expired_cohorts: skipped student % (user_id %) in cohort % (%): %',
            v_student.student_id, v_student.user_id, v_cohort.id, v_cohort.name, sqlerrm;
        end;
      end loop;

      update public.cohorts set archived_at = now() where id = v_cohort.id;

    exception when others then
      raise warning
        'archive_expired_cohorts: skipped cohort % (%): %',
        v_cohort.id, v_cohort.name, sqlerrm;
    end;
  end loop;
end;
$function$

;

CREATE OR REPLACE FUNCTION public.close_idle_site_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
begin
  if not (public.is_admin() or session_user = 'postgres') then
    raise exception 'close_idle_site_sessions: caller is not an admin';
  end if;

  -- Close every open session whose last real activity is more than 60
  -- minutes old. coalesce(last_seen_at, started_at) covers a row from
  -- before this migration that never received a heartbeat. Keep this
  -- window in sync with portal/app.js's MNT_IDLE_TIMEOUT_MS if that value
  -- ever changes — they are two independent definitions of "60 minutes,"
  -- not one shared constant, since one lives in SQL and one in JS.
  for v_user_id in
    update public.site_sessions
    set ended_at = now(), ended_reason = 'idle_timeout'
    where ended_at is null
      and coalesce(last_seen_at, started_at) < now() - interval '60 minutes'
    returning user_id
  loop
    -- Only revoke the student's real auth session once none of their
    -- site_sessions rows are still open — an idle timeout closing one
    -- stale tab must never sign out a genuinely active session the same
    -- student has open elsewhere (a second tab/device). Same revocation
    -- mechanism and the same documented limitation as
    -- admin_force_sign_out() (20260901122000_activity_monitor_
    -- sessions.sql): deleting auth.sessions blocks re-auth past the next
    -- token refresh/reload, it does not instantly kill an already-issued
    -- access token still live in a browser.
    if not exists (
      select 1 from public.site_sessions
      where user_id = v_user_id and ended_at is null
    ) then
      delete from auth.sessions where user_id = v_user_id;
    end if;
  end loop;
end;
$function$

;

-- The admin panel's "run archive sweep now" button calls this as an admin,
-- so authenticated keeps EXECUTE; anon never needed either function.
revoke execute on function public.archive_expired_cohorts() from public, anon;
revoke execute on function public.close_idle_site_sessions() from public, anon;
grant execute on function public.archive_expired_cohorts() to authenticated;
grant execute on function public.close_idle_site_sessions() to authenticated;

-- Mission Next Technical Academy — cohort & user lifecycle: Sprint 2 archival
-- engine. COHORT_USER_LIFECYCLE_SPRINT_PLAN.md, "Sprint 2 — Archival engine."
--
-- Builds on Sprint 1's schema (20260901120000_cohort_lifecycle_schema.sql:
-- public.cohorts, public.students.cohort_id/cohort_archived_at,
-- public.cohort_archive_snapshots, public.admin_archived_students) plus two
-- pre-existing, unmodified subsystems this migration deliberately does not
-- duplicate:
--   - public.enrollment_periods (20260829125000_enrollment_reporting_history.sql)
--     — append-only enrollment episodes, one open row per (user_id,
--     track_code) where withdrawn_at is null.
--   - public.stamp_enrollment_dates() (20260829110000_enrollment_dates.sql)
--     — a BEFORE UPDATE trigger on public.students that stamps
--     withdrawal_date the moment is_enrolled flips true->false. This
--     migration only ever flips is_enrolled; it never writes withdrawal_date
--     itself, so it can never race or disagree with that trigger.
--
-- The sprint plan's non-negotiable constraint governs every line below:
-- module_progress, lab_attempts, capstone_submissions, enrollment_periods,
-- and completion_reporting_snapshots rows are never deleted or pruned for a
-- student who ever had real activity. The only actual DELETE in this whole
-- migration targets auth.users rows for placeholder accounts that were
-- provisioned for a cohort but never enrolled and never touched anything —
-- see the Case B branch below for exactly why that is safe.
--
-- This migration is additive/functional only — no existing table is altered.
-- Not applied to the live project by this file; the site owner runs
-- `supabase db push` later per the deployment checklist in
-- COHORT_USER_LIFECYCLE_SPRINT_PLAN.md. There is no local Supabase instance
-- available in this environment to test against, so this file has been
-- reviewed by hand line-by-line against every table/column/function it
-- references, in the migrations that define them.

-- ============================================================ the function
--
-- One security-definer sweep, callable two ways:
--   1. An admin, on demand, via `select public.archive_expired_cohorts();`
--      (or a Supabase RPC call) — for manual testing before pg_cron is
--      relied on, and for an admin who wants to force a sweep early.
--   2. pg_cron, once a day (schedule below) — no human session, no JWT.
--
-- Those two call paths need different authorization stories, which is why
-- the guard clause below is `is_admin() OR current_user = 'postgres'`
-- rather than a bare `is_admin()`:
--
--   - Under (1), the caller reaches Postgres through PostgREST with a real
--     JWT, so auth.uid() resolves to that admin's auth.users id and
--     is_admin() (20260828120000_students_admin.sql) does the real check —
--     same idiom as every other admin-gated security-definer function in
--     this repo (e.g. admin_update_current_enrollment_plan in
--     20260829125000_enrollment_reporting_history.sql).
--   - Under (2), pg_cron's background worker runs the scheduled command as
--     the role that called `cron.schedule(...)` — here, the role executing
--     this migration (`postgres` on a Supabase project, per `supabase db
--     push`'s own connection). That background worker has no PostgREST
--     request in flight, so `current_setting('request.jwt.claim.sub',
--     true)` — what auth.uid() reads — is unset, auth.uid() returns null,
--     and a bare `is_admin()` check would ALWAYS be false there, silently
--     breaking the daily cron run every single day. `current_user =
--     'postgres'` recognizes exactly that one trusted, non-JWT execution
--     path, without opening this function up to arbitrary callers: no
--     ordinary authenticated Postgres role connects as `postgres` itself.
--
-- Because the guard covers both paths on its own, archive_expired_cohorts()
-- is directly safe to `grant execute ... to authenticated` with no separate
-- thin wrapper — the internal check is what actually gates it, exactly like
-- public.is_admin() and public.admin_update_current_enrollment_plan() are
-- granted elsewhere in this repo.
--
-- Exception-handling granularity: two nested layers.
--   - Per-student (inner): the dominant risk is one student's row having
--     some unexpected state (e.g. a missing admin_student_progress match, a
--     constraint surprise) — catching at this grain means one bad student
--     never stops the rest of their own cohort from archiving.
--   - Per-cohort (outer): belt-and-suspenders around the small amount of
--     per-cohort-only work that sits outside the student loop (opening the
--     student cursor, the final `update cohorts set archived_at = now()`)
--     so a failure there can't abort the sweep for every OTHER expired
--     cohort in the same run. Each `begin ... exception when others ...
--     end;` block is a plpgsql subtransaction (implicit savepoint), so a
--     caught error only unwinds that one iteration's work, not the whole
--     function.
-- Both layers use `raise warning`, not `raise notice`: warnings surface in
-- Postgres/Supabase logs by default so a skipped row is discoverable, but
-- they do not abort the enclosing statement the way `raise exception` would.

create or replace function public.archive_expired_cohorts()
returns void
language plpgsql
security definer
set search_path = public
as $$
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
  if not (public.is_admin() or current_user = 'postgres') then
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
            -- current_user = 'postgres') already ran above and would never
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
$$;

comment on function public.archive_expired_cohorts() is
  'Daily (see pg_cron schedule below) and admin-on-demand sweep: for every cohort whose end_date has passed and is not yet archived, archives students with any real activity into cohort_archive_snapshots (closing their open enrollment_periods row and flipping students.is_enrolled/cohort_archived_at) and deletes auth.users for never-enrolled, zero-activity placeholder accounts in that cohort''s own batch only. Never touches module_progress/lab_attempts/capstone_submissions/completion_reporting_snapshots. See COHORT_USER_LIFECYCLE_SPRINT_PLAN.md, Sprint 2.';

-- Same grant idiom as every other admin-gated security-definer function in
-- this repo (public.is_admin(), public.admin_update_current_enrollment_plan())
-- — the function's own guard clause above is what actually restricts who can
-- do anything when they call it; this grant only clears the table/function-
-- level permission check that comes before that guard runs.
grant execute on function public.archive_expired_cohorts() to authenticated;

-- ============================================================== pg_cron
--
-- Hosted Supabase projects sometimes need pg_cron enabled via
-- Dashboard -> Database -> Extensions before `create extension` below will
-- actually succeed, even though this migration includes the SQL form too —
-- this is an expected one-time manual step on some projects, not a bug in
-- this migration. Already called out in the site owner's deployment
-- checklist in COHORT_USER_LIFECYCLE_SPRINT_PLAN.md.
create extension if not exists pg_cron;

-- Idempotency: `cron.schedule(job_name, schedule, command)` behavior around
-- an already-existing job name has varied across pg_cron versions (some
-- update the existing job in place, some raise a duplicate-name error), so
-- rather than depend on whichever behavior the target project's installed
-- version has, this explicitly unschedules any prior job with this exact
-- name first — a plain existence check against cron.job, not a destructive
-- assumption about jobs this migration didn't create, since the name
-- 'archive-expired-cohorts' is unique to this feature. Re-running this
-- migration (or a future edit to the schedule/command below) is then always
-- safe to apply.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'archive-expired-cohorts') then
    perform cron.unschedule('archive-expired-cohorts');
  end if;
end;
$$;

-- Daily at 06:00 UTC. archive_expired_cohorts() itself is the thing that
-- needs to stay in sync with any future schedule change — this line is
-- intentionally just the schedule wiring.
select cron.schedule(
  'archive-expired-cohorts',
  '0 6 * * *',
  $$select public.archive_expired_cohorts();$$
);

-- Help Desk Prove It: a returned attempt starts with an empty action log
-- (ui/helpdesk.js hdProveFreshLog, 2026-11-25). The server is unchanged; this
-- checks what the change relies on, through the real submit trigger and the
-- shared engine (20261110200000, 20261119204423):
--
--   - attempt 1 records a critical action and is scored 0 with the critical
--     error at submit;
--   - it is returned, and attempt 2 is saved with only its own actions (what
--     the simulator now sends): it is scored at submit, passes, and scores 85,
--     not 100;
--   - attempt 2 with attempt 1's actions carried over (what the simulator sent
--     before) would still be a critical error: the bug this fixes;
--   - attempt 1's row and its recommendation are untouched, so the instructor
--     sheet still shows its critical error.
--
-- A made-up key over made-up events (XW-01, Gadget Two, KB-9001), loaded in
-- this transaction for Module 6's lab key only so the real trigger scores it:
-- nothing here is the real lab's answer key. Rolls everything back.
--
-- Run against the local stack:  bin/db-security-check.sh

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('d2000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fresh-log-student@test.local'),
  ('d2000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fresh-log-instructor@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000041-HDESK',  'd2000000-0000-0000-0000-000000000001', 'HDESK',  true, false, false),
  ('9900000044-HDINST', 'd2000000-0000-0000-0000-000000000004', 'HDINST', true, false, true);
insert into public.faculty_course_assignments (user_id, track_code) values
  ('d2000000-0000-0000-0000-000000000004', 'HDESK');
insert into public.site_sessions (user_id, auth_session_id) values
  ('d2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001');

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.act_as(p_user uuid, p_session uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true);
$$;
create function pg_temp.clear_claims() returns void language sql as $$
  select set_config('request.jwt.claims', '', true);
$$;

select pg_temp.check(exists (select 1 from public.course_module_labs
    where track_code = 'HDESK' and lab_key = 'lab-its-07-prove-it' and requires_official_score),
  'fixture: Module 6''s Prove It is an official-grade lab, scored at submit');

-- ------------------------------------------------------------ the made-up key
-- investigation 40 (asked 10, list read 15, article 15), action 40 (removed
-- 25, checked again 15), documentation 20 (a judgment part); one critical rule.
update public.assessment_answer_keys set is_active = false where track_code = 'HDESK' and lab_key = 'lab-its-07-prove-it';
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-its-07-prove-it", "rubric_version": "hdesk-its-07-prove-v1",
  "competencies": [
    { "id": "investigation", "label": "Investigation", "points": 40, "criteria": [
      { "id": "asked", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "caller_question", "value": "z1" } },
        "feedback": "Ask the user what changed." },
      { "id": "list-read", "points": 15,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "screen-one:XW-01" } },
        "feedback": "Read the list before you change anything." },
      { "id": "article", "points": 15,
        "check": { "type": "article_opened", "article": "KB-9001" },
        "feedback": "Compare the list with the article." } ] },
    { "id": "action", "label": "Action", "points": 40, "criteria": [
      { "id": "removed", "points": 25,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "gadget-removed", "computer": "XW-01" } },
        "feedback": "Remove the cause the managed way." },
      { "id": "verified", "points": 15,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "scan-after", "computer": "XW-01" } },
        "feedback": "Check again after the fix." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-off", "reason": "Made-up critical rule: the guard turned off.",
      "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "guard-off" } } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up key validates'); end $$;
insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key, is_active, note)
  select 'HDESK', 'lab-its-07-prove-it', 'hdesk-its-07-prove-v1', key, true, 'made-up key, rolled back' from k;

-- A package of Module 6's shape with the given events, as the course page saves it.
create function pg_temp.work(p_events jsonb) returns jsonb language sql as $$
  select jsonb_build_object('source', 'mnt-prove-submit', 'version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'its-07',
    'labKey', 'lab-its-07-prove-it', 'rubricVersion', 'hdesk-its-07-prove-v1', 'ticketId', 'XB-0007', 'elapsedSeconds', 900,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '2', 'priority', 'PX4', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '[]'::jsonb, 'keyFinding', 'Synthetic finding.', 'commands', '[]'::jsonb,
    'events', p_events, 'machine', '{"defender":{"realtime":false}}'::jsonb,
    'resolutionNote', E'Reported: the widget is slow.\nTried: removed the gadget.\nResult: the widget is quick.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb);
$$;
create function pg_temp.submit(p_events jsonb, p_at text) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
  values ('d2000000-0000-0000-0000-000000000001', 'HDESK', 'lab-its-07-prove-it', 'complete', null, pg_temp.work(p_events),
    'hdesk-its-07-prove-v1', 'instructor-review-v1', p_at::timestamptz, p_at::timestamptz)
  returning id into v_id;
  return v_id;
end $$;

-- Attempt 1: a question, a screen, and the critical action.
create temp table first_events (events jsonb);
insert into first_events values ('[{"type":"caller_question","value":"z1","label":"Made-up question one"},{"type":"evidence_opened","source":"screen-one:XW-01"},{"type":"action_taken","label":"turned the guard off (Made-up screen)","computer":"XW-01","value":"guard-off"}]'::jsonb);
-- Attempt 2, after the return, earned again in that attempt: the question,
-- the screen, the managed fix and the check; not the article (85).
create temp table second_events (events jsonb);
insert into second_events values ('[{"type":"caller_question","value":"z1","label":"Made-up question one"},{"type":"evidence_opened","source":"screen-one:XW-01"},{"type":"action_taken","label":"turned the guard on (Made-up screen)","computer":"XW-01","value":"guard-on"},{"type":"action_taken","label":"removed the gadget Gadget Two","computer":"XW-01","value":"gadget-removed"},{"type":"action_taken","label":"checked again after the removal","computer":"XW-01","value":"scan-after"}]'::jsonb);

create temp table ids (attempt int, id uuid);

-- ------------------------------------------------------------ attempt 1
select pg_temp.act_as('d2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001');
insert into ids select 1, pg_temp.submit((select events from first_events), '2026-11-25 10:00:00+00');
select pg_temp.clear_claims();
select pg_temp.check((select status = 'scored' and critical_error and recommended_score = 0
    from public.lab_attempt_recommendations where lab_attempt_id = (select id from ids where attempt = 1)),
  'attempt 1 is scored at submit: critical error, 0');

-- Returned by the instructor (no API claims: the review triggers skip it).
update public.lab_attempts set reviewed_at = now(), reviewed_by = 'd2000000-0000-0000-0000-000000000004', redo_requested = true
  where id = (select id from ids where attempt = 1);
create temp table before_row as select result, reviewed_at, redo_requested from public.lab_attempts where id = (select id from ids where attempt = 1);
create temp table before_rec as select recommended_score, critical_error, critical_reasons, competencies, created_at
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from ids where attempt = 1);

-- ------------------------------------------------------------ attempt 2
select pg_temp.act_as('d2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001');
insert into ids select 2, pg_temp.submit((select events from second_events), '2026-11-25 12:00:00+00');
select pg_temp.clear_claims();
select pg_temp.check((select count(*) = 2 from public.lab_attempts where user_id = 'd2000000-0000-0000-0000-000000000001'),
  'the resubmission is a new row');
select pg_temp.check((select status = 'scored' and not critical_error and recommended_score = 85
    from public.lab_attempt_recommendations where lab_attempt_id = (select id from ids where attempt = 2)),
  'attempt 2 with its own actions is scored at submit: no critical error, 85 (passes at 70)');
select pg_temp.check((select recommended_score >= public.lab_pass_mark()
    from public.lab_attempt_recommendations where lab_attempt_id = (select id from ids where attempt = 2)),
  'and the recommendation is at or above the pass mark');

-- What the simulator sent before the change: attempt 1's actions carried
-- into attempt 2. Still a critical error, so the student could never pass.
select pg_temp.check((select (r->>'critical_error')::boolean and (r->>'recommended_score')::int = 0
    from (select public.prove_score(pg_temp.work((select events from first_events) || (select events from second_events)), (select key from k)) r) s),
  'with attempt 1''s actions carried over, attempt 2 is a critical error (0): the bug');

-- ------------------------------------------------------------ attempt 1 untouched
select pg_temp.check((select la.result = b.result and la.reviewed_at = b.reviewed_at and la.redo_requested = b.redo_requested
    from public.lab_attempts la, before_row b where la.id = (select id from ids where attempt = 1)),
  'attempt 1''s row is exactly as it was returned');
select pg_temp.check((select la.result->'events' @> '[{"type":"action_taken","value":"guard-off"}]'::jsonb
    from public.lab_attempts la where la.id = (select id from ids where attempt = 1)),
  'and still holds its critical action');
select pg_temp.check((select r.recommended_score = b.recommended_score and r.critical_error = b.critical_error and r.critical_error
    and r.critical_reasons = b.critical_reasons and r.competencies = b.competencies and r.created_at = b.created_at
    from public.lab_attempt_recommendations r, before_rec b where r.lab_attempt_id = (select id from ids where attempt = 1)),
  'attempt 1''s recommendation still shows its critical error, unchanged');

\o
select 'hdesk_prove_resubmit_fresh_log: all checks passed' as result;
rollback;

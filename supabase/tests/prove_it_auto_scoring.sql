-- Automatic Prove It scoring (20261110200000_prove_it_auto_scoring.sql).
-- A made-up lab, lab-demo-01-prove, with a made-up key: nothing here is any
-- real lab's answer key. Rolls everything back.
--
--   - the engine: each check type, partial points, the critical zero, the
--     judgment parts (suggested, never pre-scored), key validation and the
--     rule that a student feedback line never names what it expects;
--   - scoring at submit: no key, version mismatch, a scoring error that still
--     saves the submission, and a score;
--   - the staff rescore: who may, and never once decided;
--   - what a student session can read: no system score anywhere, before or
--     after the decision;
--   - record_lab_grade from a recommendation: approve unchanged, a changed
--     competency needs its own reason, the writing must be acknowledged and
--     entered by hand, a critical error saves 0 everywhere, clearing a
--     flagged critical error compares with the points found before the zero,
--     and the old call still works.
--
-- Run against the local stack:  bin/db-security-check.sh

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('f1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-a@test.local'),
  ('f1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-b@test.local'),
  ('f1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-c@test.local'),
  ('f1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-instructor@test.local'),
  ('f1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-d@test.local'),
  ('f1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-e@test.local'),
  ('f1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','score-f@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000041-HDESK', 'f1000000-0000-0000-0000-000000000001', 'HDESK', true, false, false),
  ('9900000042-HDESK', 'f1000000-0000-0000-0000-000000000002', 'HDESK', true, false, false),
  ('9900000043-HDESK', 'f1000000-0000-0000-0000-000000000003', 'HDESK', true, false, false),
  ('9900000044-HDINST', 'f1000000-0000-0000-0000-000000000004', 'HDINST', true, false, true),
  ('9900000045-HDESK', 'f1000000-0000-0000-0000-000000000005', 'HDESK', true, false, false),
  ('9900000046-HDESK', 'f1000000-0000-0000-0000-000000000006', 'HDESK', true, false, false),
  ('9900000047-HDESK', 'f1000000-0000-0000-0000-000000000007', 'HDESK', true, false, false);
insert into public.faculty_course_assignments (user_id, track_code) values ('f1000000-0000-0000-0000-000000000004', 'HDESK');
insert into public.site_sessions (user_id, auth_session_id)
  select ('f1000000-0000-0000-0000-00000000000' || n)::uuid, ('e2000000-0000-0000-0000-00000000000' || n)::uuid from generate_series(1, 7) n;

-- The made-up lab, graded by faculty. Not part of any module's completion.
insert into public.course_module_labs (track_code, module_key, lab_key, gates_completion, requires_official_score)
  values ('HDESK', 'demo-01', 'lab-demo-01-prove', false, true);

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;
create function pg_temp.expect_error(p_sql text, p_hint text, p_label text) returns void language plpgsql as $$
declare v_hint text; v_message text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_hint = pg_exception_hint, v_message = message_text;
    if p_hint is not null and v_hint is distinct from p_hint then raise exception 'FAIL %: hint was %, message %', p_label, v_hint, v_message; end if;
    raise notice 'ok   %', p_label;
    return;
  end;
  raise exception 'FAIL %: statement succeeded', p_label;
end $$;
create function pg_temp.act_as(p_user text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', 'f1000000-0000-0000-0000-00000000000' || p_user, 'role', 'authenticated', 'session_id', 'e2000000-0000-0000-0000-00000000000' || p_user)::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.act_clear() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- A made-up key: four competencies, one with two judgment parts, one critical rule.
create function pg_temp.demo_key(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{
    "format": 1, "lab_key": "lab-demo-01-prove", "rubric_version": "demo-prove-v1",
    "competencies": [
      { "id": "triage", "label": "Triage", "points": 20, "criteria": [
        { "id": "owner", "points": 20, "check": { "type": "field_equals", "field": "decision", "value": "Escalate" },
          "met": "Chose the right owner.", "missing": "Chose a different owner.",
          "feedback": "Think again about who should own this ticket.", "feedback_met": "Good call on who owns it." } ] },
      { "id": "investigation", "label": "Investigation", "points": 20, "criteria": [
        { "id": "kb", "points": 10, "check": { "type": "kb_search", "pattern": "\\ywidget\\y" },
          "met": "Searched for {found}.", "missing": "No widget search.", "feedback": "Search the knowledge base before acting." },
        { "id": "article", "points": 10, "check": { "type": "article_opened", "article": "KB-9001" },
          "met": "Opened the article.", "missing": "Didn''t open the article.", "feedback": "Read the article your search finds." } ] },
      { "id": "action", "label": "Action", "points": 30, "criteria": [
        { "id": "fix", "points": 30, "partial": { "points": 15, "min": 1 },
          "check": { "type": "all", "checks": [
            { "type": "action_taken", "pattern": "^Reset the widget", "computer": "DEMO-PC-01" },
            { "type": "step_chosen", "step": "d4" } ] },
          "met": "Reset and recorded.", "missing": "Reset missing or not recorded.", "feedback": "Do the fix and record it as a step." } ] },
      { "id": "documentation", "label": "Documentation", "points": 30, "judgment": true, "parts": [
        { "id": "note", "label": "Work note", "points": 20, "criteria": [
          { "id": "parts", "points": 20, "partial": { "points": 10, "min": 2 },
            "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
            "met": "Has every part.", "missing": "Missing {missing}.", "feedback": "Give the note all its parts." } ] },
        { "id": "reply", "label": "Reply to the user", "points": 10, "criteria": [
          { "id": "next", "points": 10, "check": { "type": "text_matches", "field": "userReply", "pattern": "\\yreply\\y" },
            "met": "Says what to do next.", "missing": "Doesn''t say what to do next.", "feedback": "Tell the user what to do next." } ] } ] }
    ],
    "critical": [ { "id": "unsafe", "check": { "type": "command_matches", "pattern": "^Remove-Widget\\y" }, "reason": "Ran a forbidden command.",
      "feedback": "Some commands are off-limits on a user''s machine. Check the policy first." } ]
  }'::jsonb || p_extra;
$$;

create function pg_temp.good_work() returns jsonb language sql as $$
  select jsonb_build_object('kind', 'hdesk-prove', 'decision', 'Escalate', 'diagnosis', 'Out of policy', 'steps', jsonb_build_array('d4', 'd1'),
    'events', jsonb_build_array(
      jsonb_build_object('type', 'kb_search', 'value', 'widget broken'),
      jsonb_build_object('type', 'evidence_opened', 'source', 'kb:KB-9001', 'label', 'KB-9001'),
      jsonb_build_object('type', 'action_taken', 'label', 'Reset the widget from Settings', 'computer', 'DEMO-PC-01')),
    'commands', '[]'::jsonb,
    'resolutionNote', E'Reported: the widget stopped working.\nTried: reset the widget from Settings.\nResult: widget works again.',
    'userReply', 'Please reply if it happens again.', 'workNotes', '[]'::jsonb,
    'fields', jsonb_build_object('category', 'c', 'type', 't', 'priority', 'P3'));
$$;
create function pg_temp.weak_work() returns jsonb language sql as $$
  select jsonb_build_object('kind', 'hdesk-prove', 'decision', 'Resolve', 'diagnosis', 'Other', 'steps', '[]'::jsonb,
    'events', jsonb_build_array(
      jsonb_build_object('type', 'kb_search', 'value', 'printer'),
      jsonb_build_object('type', 'evidence_opened', 'source', 'kb:KB-9001', 'label', 'KB-9001'),
      jsonb_build_object('type', 'action_taken', 'label', 'Reset the widget from Settings', 'computer', 'DEMO-PC-01')),
    'commands', jsonb_build_array(jsonb_build_object('command', 'Remove-Widget -All', 'computer', 'DEMO-PC-01')),
    'resolutionNote', E'Reported: the widget stopped working.\nTried: reset it from the Settings page.\nResult: ok',
    'userReply', 'Done.', 'workNotes', '[]'::jsonb,
    'fields', jsonb_build_object('category', 'c', 'type', 't', 'priority', 'P3'));
$$;
create function pg_temp.submit(p_user text, p_work jsonb, p_version text default 'demo-prove-v1') returns uuid language plpgsql as $$
declare v_id uuid;
begin
  perform pg_temp.act_as(p_user);
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
    values (auth.uid(), 'HDESK', 'lab-demo-01-prove', 'complete', 100, p_work, p_version, 'instructor-review-v1', now(), now())
    returning id into v_id;
  perform pg_temp.act_clear();
  return v_id;
end $$;
create function pg_temp.rec(p_attempt uuid) returns public.lab_attempt_recommendations language sql as $$
  select * from public.lab_attempt_recommendations where lab_attempt_id = p_attempt;
$$;
create function pg_temp.comp(p_attempt uuid, p_id text) returns jsonb language sql as $$
  select c from public.lab_attempt_recommendations r, jsonb_array_elements(r.competencies) c where r.lab_attempt_id = p_attempt and c->>'id' = p_id;
$$;
-- The instructor's scores for the four demo competencies.
create function pg_temp.scores(p_triage int, p_inv int, p_action int, p_doc int, p_why jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_array(
    jsonb_build_object('id','triage','label','Triage','points',20,'earned',p_triage,'justification',coalesce(p_why->>'triage', case when p_triage < 20 then 'Partial.' else '' end)),
    jsonb_build_object('id','investigation','label','Investigation','points',20,'earned',p_inv,'justification',coalesce(p_why->>'investigation', case when p_inv < 20 then 'Partial.' else '' end)),
    jsonb_build_object('id','action','label','Action','points',30,'earned',p_action,'justification',coalesce(p_why->>'action', case when p_action < 30 then 'Partial.' else '' end)),
    jsonb_build_object('id','documentation','label','Documentation','points',30,'earned',p_doc,'justification',coalesce(p_why->>'documentation', case when p_doc < 30 then 'Partial.' else '' end)));
$$;
create function pg_temp.parts(p_note int, p_reply int) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('competency','documentation','id','note','earned',p_note), jsonb_build_object('competency','documentation','id','reply','earned',p_reply));
$$;
grant execute on all functions in schema pg_temp to authenticated;

-- ------------------------------------------------------------ the engine
select pg_temp.check(public.prove_note_missing(E'Reported: the widget stopped.\nTried: reset it fully.\nResult: works again.', array['reported','tried','result']) = '{}',
  'note checker: every part present');
select pg_temp.check(public.prove_note_missing(E'Reported: the widget stopped.\nTried: x\nResult: works again.', array['reported','tried','result']) = array['Tried'],
  'note checker: a part under 8 characters is missing');
select pg_temp.check(public.prove_note_missing('reported : widget stopped working  next   action: escalate to tier two', array['reported','result','next']) = array['Result'],
  'note checker: any case, spaces before the colon, "Next action" over spaces');
select pg_temp.check(public.prove_note_missing('No headers at all, just text.', array['reported']) = array['Reported'], 'note checker: no header means missing');

select pg_temp.check((public.prove_score(pg_temp.good_work(), pg_temp.demo_key()) ->> 'recommended_score')::int = 100, 'engine: complete work scores 100');
select pg_temp.check((select (r->>'automatic_earned')::int = 70 and (r->>'automatic_points')::int = 70 and (r->>'writing_suggested')::int = 30 and (r->>'writing_points')::int = 30
  from (select public.prove_score(pg_temp.good_work(), pg_temp.demo_key()) r) s), 'engine: automatic and writing totals kept apart');
select pg_temp.check((select (r->>'critical_error')::boolean and (r->>'recommended_total')::int = 0 and (r->>'recommended_score')::int = 0
  and (r->>'automatic_earned')::int = 0 and (r->>'writing_suggested')::int = 0
  and (r->>'automatic_earned_before_critical')::int + (r->>'writing_suggested_before_critical')::int = 35
  and (r->'critical_reasons'->0->>'reason') = 'Ran a forbidden command.'
  from (select public.prove_score(pg_temp.weak_work(), pg_temp.demo_key()) r) s), 'engine: a critical rule fires, with its reason');
select pg_temp.check((select r->'critical_reasons'->0->>'feedback' = 'Some commands are off-limits on a user''s machine. Check the policy first.'
  from (select public.prove_score(pg_temp.weak_work(), pg_temp.demo_key()) r) s), 'engine: a critical rule keeps its student line apart from the staff reason');
select pg_temp.check((select (r->>'recommended_score')::int = 0 and (r->>'recommended_total')::int = 0
    and (select bool_and(coalesce((c->>'earned')::int, (c->>'suggested')::int) = 0) from jsonb_array_elements(r->'competencies') c)
    and (select bool_and((p->>'suggested')::int = 0) from jsonb_array_elements(r->'competencies') c, jsonb_array_elements(c->'parts') p)
    and (select (c->>'earned_before_critical')::int from jsonb_array_elements(r->'competencies') c where c->>'id' = 'triage') = 20
    and (select (p->>'suggested_before_critical')::int from jsonb_array_elements(r->'competencies') c, jsonb_array_elements(c->'parts') p where p->>'id' = 'note') = 20
    and (select c->'criteria'->0->>'met' from jsonb_array_elements(r->'competencies') c where c->>'id' = 'triage') = 'met'
  from (select public.prove_score(pg_temp.good_work() || jsonb_build_object('commands', jsonb_build_array(jsonb_build_object('command', 'Remove-Widget x', 'computer', 'DEMO-PC-01'))), pg_temp.demo_key()) r) s),
  'engine: a critical error is an automatic zero (every competency and part 0), keeping what the criteria found for staff');
select pg_temp.check((select
    (select (c->>'earned_before_critical')::int from jsonb_array_elements(r->'competencies') c where c->>'id' = 'triage') = 0
    and (select (c->>'earned_before_critical')::int from jsonb_array_elements(r->'competencies') c where c->>'id' = 'investigation') = 10
    and (select (c->>'earned_before_critical')::int from jsonb_array_elements(r->'competencies') c where c->>'id' = 'action') = 15
    and (select (c->>'suggested_before_critical')::int from jsonb_array_elements(r->'competencies') c where c->>'id' = 'documentation') = 10
    and (select c->'earned' from jsonb_array_elements(r->'competencies') c where c->>'id' = 'documentation') = 'null'::jsonb
  from (select public.prove_score(pg_temp.weak_work(), pg_temp.demo_key()) r) s),
  'engine: partial points; a judgment competency is suggested, never earned');
select pg_temp.check((select
    (select p->>'suggested_before_critical' from jsonb_array_elements(c->'parts') p where p->>'id' = 'note') = '10'
    and (select p->>'suggested_before_critical' from jsonb_array_elements(c->'parts') p where p->>'id' = 'reply') = '0'
    and (select p->'criteria'->0->>'reason' from jsonb_array_elements(c->'parts') p where p->>'id' = 'note') = 'Missing Result.'
  from (select c from jsonb_array_elements(public.prove_score(pg_temp.weak_work(), pg_temp.demo_key())->'competencies') c where c->>'id' = 'documentation') s),
  'engine: each writing part has its own suggestion and reason');
select pg_temp.check((select c->'criteria'->0->>'reason' = 'Searched for widget broken.' and c->'criteria'->1->>'reason' = 'Opened the article.'
  from jsonb_array_elements(public.prove_score(pg_temp.good_work(), pg_temp.demo_key())->'competencies') c where c->>'id' = 'investigation'),
  'engine: a staff reason says what was found');
select pg_temp.check((select c->>'student_feedback' = 'Think again about who should own this ticket.'
  from jsonb_array_elements(public.prove_score(pg_temp.weak_work(), pg_temp.demo_key())->'competencies') c where c->>'id' = 'triage')
  and (select c->>'student_feedback' = 'Good call on who owns it.'
  from jsonb_array_elements(public.prove_score(pg_temp.good_work(), pg_temp.demo_key())->'competencies') c where c->>'id' = 'triage'),
  'engine: the student line for a miss, the optional positive line for full points');
select pg_temp.check((select bool_and(c->>'student_feedback' is null)
  from jsonb_array_elements(public.prove_score(pg_temp.good_work(), pg_temp.demo_key())->'competencies') c where c->>'id' <> 'triage'),
  'engine: full points with no positive line pre-fills nothing');

select pg_temp.expect_error($$select public.prove_score('{}', pg_temp.demo_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.demo_key()->'competencies', '{0,criteria,0,feedback}', '"Choose Escalate next time."'))))$$,
  null, 'key: a student line that names the expected value is refused');
select pg_temp.expect_error($$select public.prove_score('{}', pg_temp.demo_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.demo_key()->'competencies', '{1,criteria,1,feedback}', '"Open kb-9001 first."'))))$$,
  null, 'key: a student line that names the expected article is refused, in any case');
select pg_temp.expect_error($$select public.prove_score('{}', pg_temp.demo_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.demo_key()->'competencies', '{0,points}', '25'))))$$, null, 'key: competencies must total 100');
select pg_temp.expect_error($$select public.prove_score('{}', pg_temp.demo_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.demo_key()->'competencies', '{3,parts,1,points}', '5'))))$$, null, 'key: judgment parts must add up to the competency');
select pg_temp.expect_error($$select public.prove_score('{}', pg_temp.demo_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.demo_key()->'competencies', '{0,criteria,0,check}', '{"type":"made_up"}'))))$$, null, 'key: an unknown check type is refused');

-- ------------------------------------------------------------ scoring at submit
-- No key loaded yet.
create temp table t_ids (name text primary key, id uuid);
grant select on t_ids to authenticated;
insert into t_ids values ('nokey', pg_temp.submit('1', pg_temp.good_work()));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'nokey'))).status = 'no_key', 'submit with no key: recommendation says no key');
select pg_temp.check((select score is null from public.lab_attempts where id = (select id from t_ids where name = 'nokey')), 'a score the student sends is not kept');

-- Load the key (revision 1), then a corrected one (revision 2) that is broken.
insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key, note) values ('HDESK', 'lab-demo-01-prove', 'demo-prove-v1', pg_temp.demo_key(), 'test r1');
select pg_temp.check((select revision from public.assessment_answer_keys where lab_key = 'lab-demo-01-prove') = 1, 'a key gets revision 1');
update public.assessment_answer_keys set is_active = false where lab_key = 'lab-demo-01-prove';
insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key, note)
  values ('HDESK', 'lab-demo-01-prove', 'demo-prove-v1', pg_temp.demo_key(jsonb_build_object('critical', '[{"id":"x","check":{"type":"made_up"},"reason":"r"}]'::jsonb)), 'test r2 broken');
select pg_temp.check((select revision from public.assessment_answer_keys where lab_key = 'lab-demo-01-prove' and is_active) = 2, 'a corrected key for the same version gets the next revision');

insert into t_ids values ('broken', pg_temp.submit('2', pg_temp.good_work()));
select pg_temp.check((select status = 'error' and error is not null and key_revision = 2 from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'broken')),
  'a scoring error is recorded and the submission still saves');
select pg_temp.check(exists (select 1 from public.lab_attempts where id = (select id from t_ids where name = 'broken')), 'the errored attempt is saved');

-- Fix the key (revision 3).
update public.assessment_answer_keys set is_active = false where lab_key = 'lab-demo-01-prove';
insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key, note) values ('HDESK', 'lab-demo-01-prove', 'demo-prove-v1', pg_temp.demo_key(), 'test r3');

insert into t_ids values ('good', pg_temp.submit('3', pg_temp.good_work()));
insert into t_ids values ('weak', pg_temp.submit('5', pg_temp.weak_work()));
insert into t_ids values ('mismatch', pg_temp.submit('6', pg_temp.good_work(), 'demo-prove-v0'));
select pg_temp.check((select status = 'scored' and recommended_score = 100 and automatic_earned = 70 and writing_suggested = 30 and key_revision = 3
  and key_rubric_version = 'demo-prove-v1' and scored_on = 'submit' and rescored_by is null and engine_version = 'prove-engine-v1'
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'good')),
  'submit: scored, with the key version and revision that scored it');
select pg_temp.check((select status = 'scored' and critical_error and recommended_score = 0 and recommended_total = 0 and automatic_earned = 0 and writing_suggested = 0
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'weak')),
  'submit: a weak attempt with a critical error is scored as an automatic zero');
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'mismatch'))).status = 'version_mismatch', 'submit: another rubric version is not scored');

-- Other labs and unfinished work are not scored.
select pg_temp.act_as('7');
insert into public.lab_attempts (user_id, track_code, lab_key, state, result, rubric_version, started_at, completed_at)
  values (auth.uid(), 'HDESK', 'lab-its-01-ticket-triage', 'complete', '{"kind":"hdesk-prove"}', 'demo-prove-v1', now(), now());
select pg_temp.act_clear();
select pg_temp.check(not exists (select 1 from public.lab_attempt_recommendations r join public.lab_attempts a on a.id = r.lab_attempt_id where a.lab_key = 'lab-its-01-ticket-triage'),
  'a lab without official grades is never scored');

-- ------------------------------------------------------------ what a student can read
select pg_temp.act_as('3');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations) = 0, 'student: reads no recommendation, not even their own');
select pg_temp.check((select count(*) from public.lab_attempt_grade_reviews) = 0, 'student: reads no review');
select pg_temp.expect_error($$select count(*) from public.assessment_answer_keys$$, null, 'student: cannot read any key');
select pg_temp.expect_error($$insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key) values ('HDESK','x','y','{}')$$, null, 'student: cannot write a key');
select pg_temp.expect_error($$select public.prove_score('{}', '{}')$$, null, 'student: cannot run the engine');
select pg_temp.expect_error($$select public.score_lab_attempt(pg_temp.rec(null)).id$$, null, 'student: cannot run the scorer');
select pg_temp.check((select score is null and not (result ? 'recommendation') and not (result ? 'recommended_score')
  from public.lab_attempts where user_id = auth.uid() and lab_key = 'lab-demo-01-prove'), 'student: their own row has no score and no recommendation');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from public.lab_attempts where user_id = auth.uid() and lab_key = 'lab-demo-01-prove'))$$,
  'not_course_staff', 'student: cannot rescore');
select pg_temp.check((select count(*) from public.admin_grading_queue) = 0, 'student: the staff grading queue shows nothing');
select pg_temp.act_clear();

-- ------------------------------------------------------------ staff rescore
select pg_temp.act_as('4');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations where lab_key = 'lab-demo-01-prove') = 5, 'instructor: reads every recommendation of the course');
select pg_temp.expect_error($$select count(*) from public.assessment_answer_keys$$, null, 'instructor: cannot read the key itself');
select pg_temp.check(public.rescore_lab_attempt((select id from t_ids where name = 'broken'))->>'status' = 'scored', 'instructor: rescores an attempt whose scoring failed');
select pg_temp.check((select status = 'scored' and scored_on = 'rescore' and rescored_by = 'f1000000-0000-0000-0000-000000000004' and rescored_at is not null and key_revision = 3
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'broken')), 'a rescore records who ran it, when, and the key revision');
select pg_temp.check(public.rescore_lab_attempt((select id from t_ids where name = 'nokey'))->>'status' = 'scored', 'instructor: rescores an attempt submitted before the key');
select pg_temp.check(public.rescore_lab_attempt((select id from t_ids where name = 'mismatch'))->>'status' = 'version_mismatch', 'a rescore cannot override a version mismatch');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'good'))$$, 'already_scored', 'a scored attempt is not rescored');
select pg_temp.act_clear();

-- ------------------------------------------------------------ deciding from the recommendation
select pg_temp.act_as('4');
-- The writing must be acknowledged and entered by hand.
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'good'), 'approved', pg_temp.scores(20,20,30,30), false, null, null, null, null, 'demo-prove-v1',
    (pg_temp.rec((select id from t_ids where name = 'good'))).id, pg_temp.parts(20,10), false)$$, 'writing_not_acknowledged', 'the writing must be acknowledged');
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'good'), 'approved', pg_temp.scores(20,20,30,30), false, null, null, null, null, 'demo-prove-v1',
    (pg_temp.rec((select id from t_ids where name = 'good'))).id, null, true)$$, 'writing_parts_required', 'each writing part must be entered');
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'good'), 'approved', pg_temp.scores(20,20,30,30), false, null, null, null, null, 'demo-prove-v1',
    (pg_temp.rec((select id from t_ids where name = 'good'))).id, pg_temp.parts(20,9), true)$$, 'writing_parts_mismatch', 'the parts must add up to the competency');
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'good'), 'approved', pg_temp.scores(20,20,30,30), false, null, null, null, null, 'demo-prove-v1',
    (pg_temp.rec((select id from t_ids where name = 'weak'))).id, pg_temp.parts(20,10), true)$$, 'recommendation_mismatch', 'another attempt''s recommendation is refused');

-- Approve unchanged (writing entered below the suggestion: no extra reason needed).
select public.record_lab_grade((select id from t_ids where name = 'good'), 'approved', pg_temp.scores(20,20,30,26, '{"documentation":"Tighten the result line."}'),
    false, null, null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'good'))).id, pg_temp.parts(16,10), true);
select pg_temp.check((select v.changed = '[]'::jsonb and v.recommended_automatic = 70 and v.recommended_writing = 30 and v.recommended_score = 100 and v.final_score = 96
    and v.writing_acknowledged_by = 'f1000000-0000-0000-0000-000000000004' and v.writing_acknowledged_at is not null
    and v.writing_parts @> '[{"id":"note","suggested":20,"entered":16},{"id":"reply","suggested":10,"entered":10}]'
  from public.lab_attempt_grade_reviews v where v.lab_attempt_id = (select id from t_ids where name = 'good')),
  'approve unchanged: review row with no changes, the acknowledgement, the parts and both totals');

-- An instructor who clears a critical error the system flagged starts from the
-- points the criteria found before the zero: those aren't "changed".
savepoint cleared;
select public.record_lab_grade((select id from t_ids where name = 'weak'), 'returned', pg_temp.scores(0,10,15,10),
    false, null, null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'weak'))).id, pg_temp.parts(10,0), true);
select pg_temp.check((select v.changed = '[{"id":"critical","label":"Critical error","recommended":true,"final":false}]'::jsonb and v.final_score = 35
    and v.writing_parts @> '[{"id":"note","suggested":10,"entered":10}]'
  from public.lab_attempt_grade_reviews v where v.lab_attempt_id = (select id from t_ids where name = 'weak')),
  'cleared critical: only the critical error counts as changed, with the suggestions found before the zero');
rollback to savepoint cleared;

-- A critical error, kept: saved as 0 everywhere. The writing needs no parts
-- (it's zeroed too) but must still be acknowledged; nothing counts as changed.
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'weak'), 'returned', pg_temp.scores(0,0,0,0),
    true, 'Ran a forbidden command.', null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'weak'))).id, null, false)$$,
  'writing_not_acknowledged', 'critical: the writing must still be acknowledged');
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'weak'), 'approved', pg_temp.scores(0,0,0,0),
    true, 'Ran a forbidden command.', null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'weak'))).id, null, true)$$,
  'approve_below_pass', 'critical: Approve is refused');
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'weak'), 'returned', pg_temp.scores(0,0,0,0),
    true, '  ', null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'weak'))).id, null, true)$$,
  'critical_reason_required', 'critical: a reason is still required');
-- Points typed under a critical error are ignored, with or without a justification.
select public.record_lab_grade((select id from t_ids where name = 'weak'), 'returned',
    (select jsonb_agg(item || '{"justification":""}'::jsonb) from jsonb_array_elements(pg_temp.scores(15,10,15,10)) item),
    true, 'Ran a forbidden command.', null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'weak'))).id, null, true);
select pg_temp.check((select g.official_score = 0 and g.uncapped_total = 0 and g.critical_error and g.decision = 'returned'
    and (select bool_and((c->>'earned')::int = 0) from jsonb_array_elements(g.competency_scores) c)
  from public.lab_attempt_grades g where g.lab_attempt_id = (select id from t_ids where name = 'weak')),
  'critical: saved as an automatic zero, every competency 0, returned');
select pg_temp.check((select v.changed = '[]'::jsonb and v.recommended_critical and v.recommended_score = 0 and v.final_score = 0
    and v.writing_parts = '[]'::jsonb and v.writing_acknowledged_at is not null
  from public.lab_attempt_grade_reviews v where v.lab_attempt_id = (select id from t_ids where name = 'weak')),
  'critical: the review row records the zero, the acknowledgement and no changes');
select pg_temp.check((select redo_requested from public.lab_attempts where id = (select id from t_ids where name = 'weak')), 'critical: the attempt is returned');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'weak'))$$, 'already_decided', 'a decided attempt is never rescored');

-- A scored attempt can't get its first decision without its recommendation.
select pg_temp.act_clear();
insert into t_ids values ('scored2', pg_temp.submit('7', pg_temp.good_work()));
select pg_temp.act_as('4');
select pg_temp.expect_error($$select public.record_lab_grade(p_attempt_id => (select id from t_ids where name = 'scored2'), p_decision => 'approved',
    p_competencies => pg_temp.scores(20,20,30,30), p_rubric_version => 'demo-prove-v1')$$, 'recommendation_required', 'a scored attempt is decided from its recommendation');

-- A changed competency needs its own reason, not the pre-filled student line.
select pg_temp.expect_error($$select public.record_lab_grade((select id from t_ids where name = 'scored2'), 'approved', pg_temp.scores(15,20,30,30,
      '{"triage":"Good call on who owns it."}'),
    false, null, null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'scored2'))).id, pg_temp.parts(20,10), true)$$,
  'adjust_reason_required', 'a changed competency with only the pre-filled line is refused');
select public.record_lab_grade((select id from t_ids where name = 'scored2'), 'approved', pg_temp.scores(15,20,30,30,
      '{"triage":"Right owner, but say why in the note."}'),
    false, null, null, null, null, 'demo-prove-v1', (pg_temp.rec((select id from t_ids where name = 'scored2'))).id, pg_temp.parts(20,10), true);
select pg_temp.check((select v.changed = '[{"id":"triage","label":"Triage","recommended":20,"final":15}]'::jsonb and not v.recommended_critical and v.final_score = 95
  from public.lab_attempt_grade_reviews v where v.lab_attempt_id = (select id from t_ids where name = 'scored2')),
  'adjusted with a reason: saved, and the review lists what changed');

-- The old call, with no recommendation, works as before.
select public.record_lab_grade(p_attempt_id => (select id from t_ids where name = 'mismatch'), p_decision => 'approved',
    p_competencies => pg_temp.scores(20,20,30,30), p_rubric_version => 'demo-prove-v0');
select pg_temp.check((select official_score = 100 from public.lab_attempt_grades where lab_attempt_id = (select id from t_ids where name = 'mismatch'))
  and not exists (select 1 from public.lab_attempt_grade_reviews where lab_attempt_id = (select id from t_ids where name = 'mismatch')),
  'the old call still decides, with no review row');
select pg_temp.act_clear();

-- ------------------------------------------------------------ after the decision, still nothing for the student
select pg_temp.act_as('5');
select pg_temp.check((select count(*) from public.lab_attempt_grades) = 1 and (select official_score = 0 and critical_error from public.lab_attempt_grades),
  'student: sees the critical-error zero after the decision');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations) = 0 and (select count(*) from public.lab_attempt_grade_reviews) = 0,
  'student: still no recommendation or review after the decision');
select pg_temp.check(not exists (select 1 from public.lab_attempt_feedback where comment ~ 'Reset missing|Missing Result|Chose a different owner'),
  'student: no staff reason reaches the feedback');
select pg_temp.check(not exists (select 1 from public.lab_attempt_grades where uncapped_total = 35 or official_score = 35),
  'student: the system''s 35 appears nowhere they can read');
select pg_temp.act_clear();

rollback;
\o
\echo 'prove_it_auto_scoring: all checks passed'

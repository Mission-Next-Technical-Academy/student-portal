-- Help Desk Module 8 Prove It, the one-ticket shift with Module 8's account
-- controls, a request opened from the ticket and messages to other teams
-- (20261126162912_hdesk_its06_prove.sql), scored by the shared engine
-- (20261119204423). A made-up key over a made-up ticket (XB-0008, accounts
-- xa and xb, approver Person Alpha, team Team Kilo): nothing here is the real
-- lab's answer key. Rolls everything back.
--
--   - the migration: Lab 8.1 no longer gates Module 8, the Prove It gates it
--     and takes an official grade, Lab 8.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 8's shape: actions recorded as
--     action_taken events with a value and a source (the request by its
--     approver and item, a team message by its team, an account change by
--     the account), each partial on its own criterion, a deduction-style
--     partial for an unsafe change, and critical rules on one account only;
--   - the lab standard's matrix, with scores other than 100.
--
-- Run against the local stack:  bin/db-security-check.sh

\set ON_ERROR_STOP on
\o /dev/null
begin;

create function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'ok   %', p_label;
end $$;

-- ------------------------------------------------------------ migration
select pg_temp.check((select not gates_completion and module_key = 'its-06' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-06-identity-access'),
  'Lab 8.1 stays mapped but no longer gates Module 8');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-06' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-06-prove-it'),
  'the Prove It gates Module 8 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-06' and gates_completion) = array['lab-its-06-prove-it'],
  'Module 8 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-06-practice-tickets'),
  'Lab 8.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-06-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its06_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its06_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its06_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its06_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 20, action 50 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-ticket-actions", "rubric_version": "demo-ticket-actions-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "priority", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX3", "PX4"] },
        "partial": { "points": 4, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX2", "PX5"] } },
        "feedback": "Rate the impact and the urgency." } ] },
    { "id": "investigation", "label": "Investigation", "points": 20, "criteria": [
      { "id": "account-read", "points": 12,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "ad-user:x-1" } },
        "feedback": "Read the account." },
      { "id": "callback", "points": 8,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "caller_question", "value": "z1" } },
        "partial": { "points": 5, "check": { "type": "path_contains", "path": ["events"], "value": { "type": "caller_question", "value": "z2" } } },
        "feedback": "Try to verify the caller." } ] },
    { "id": "action", "label": "Action and decision", "points": 50, "criteria": [
      { "id": "route", "points": 20,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "request-opened:Person Alpha", "source": "Item One" } },
        "feedback": "Send it to the approver." },
      { "id": "report", "points": 15,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "team-message:Team Kilo" } },
        "feedback": "Report it." },
      { "id": "safe", "points": 15,
        "check": { "type": "not", "check": { "type": "any", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "made-up-change", "source": "xa" } },
          { "type": "step_chosen", "step": "y4" } ] } },
        "partial": { "points": 3, "check": { "type": "any", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "made-up-change", "source": "xa" } },
          { "type": "step_chosen", "step": "y4" } ] } },
        "feedback": "Stay within your tier." },
      { "id": "efficiency-unlock", "points": 0,
        "check": { "type": "not", "check": { "type": "step_chosen", "step": "y2" } } } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result", "next"] },
          "feedback": "Write Reported, Tried, Result and Next action." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-critical", "reason": "Made-up critical rule: an unsafe change on account xa.",
      "check": { "type": "any", "checks": [
        { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "made-up-critical", "source": "xa" } },
        { "type": "step_chosen", "step": "y6" } ] } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up ticket-actions key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0008', 'elapsedSeconds', 1200,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '1', 'priority', 'PX3', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '["y1"]'::jsonb, 'stepTexts', '["Step one"]'::jsonb,
    'keyFinding', 'Synthetic finding.', 'commands', '[]'::jsonb,
    'events', '[{"type":"caller_question","value":"z1","label":"Made-up question one"},{"type":"evidence_opened","source":"ad-user:x-1"},{"type":"action_taken","value":"request-opened:Person Alpha","source":"Item One","label":"Made-up request"},{"type":"action_taken","value":"team-message:Team Kilo","source":"m1","label":"Made-up message"}]'::jsonb,
    'machine', '{}'::jsonb,
    'resolutionNote', E'Reported: a made-up call.\nTried: read the made-up account.\nResult: no change made here.\nNext action: sent to the approver.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
create function pg_temp.comp(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id
$$;
-- The base events without those matching a value, with optional extras.
create function pg_temp.without(p_value text, p_extra jsonb default '[]'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('events', coalesce((select jsonb_agg(e) from jsonb_array_elements(pg_temp.work()->'events') e
    where coalesce(e->>'value', '') <> p_value and coalesce(e->>'source', '') <> p_value), '[]'::jsonb) || p_extra)
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  -- Priority: two values earn full credit, two earn the partial.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX4"}}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'the second full-credit priority (100)');
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX5"}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 4 and (v->>'recommended_score')::int = 94, 'a half-credit priority (94)');

  -- The request counts only with its approver and its item.
  v := pg_temp.score(pg_temp.work(pg_temp.without('request-opened:Person Alpha', '[{"type":"action_taken","value":"request-opened:Person Beta","source":"Item One"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'route')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80, 'another approver: 0 of 20 (80)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('request-opened:Person Alpha', '[{"type":"action_taken","value":"request-opened:Person Alpha","source":"Item Two"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'route')->>'earned')::int = 0, 'another catalog item: 0 of 20');
  -- Routed without the report, and reported without routing: each its own part.
  v := pg_temp.score(pg_temp.work(pg_temp.without('team-message:Team Kilo')));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 35 and (v->>'recommended_score')::int = 85, 'routed, not reported (85)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('request-opened:Person Alpha')));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 30 and (v->>'recommended_score')::int = 80, 'reported, not routed (80)');
  -- Different valid questions: the second one earns the partial.
  v := pg_temp.score(pg_temp.work(pg_temp.without('z1', '[{"type":"caller_question","value":"z2"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'callback')->>'earned')::int = 5 and (v->>'recommended_score')::int = 97, 'the other identity question: 5 of 8 (97)');

  -- An unsafe change on the account costs the safe criterion its partial, by either route.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"action_taken","value":"made-up-change","source":"xa"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'safe')->>'earned')::int = 3 and (v->>'recommended_score')::int = 88, 'the unsafe change on the screen: 3 of 15 (88)');
  v := pg_temp.score(pg_temp.work('{"steps":["y1","y4"],"stepTexts":["Step one","Step four"]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'safe')->>'earned')::int = 3, 'the unsafe change as a step: 3 of 15');
  -- The same change on another account is not this ticket's.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"action_taken","value":"made-up-change","source":"xb"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'the change on another account costs nothing (100)');

  -- Extra exploration: more screens, questions and steps, no penalty; an unnecessary step is formative.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"evidence_opened","source":"ad-user:x-2"},{"type":"evidence_opened","source":"card:c2"},{"type":"action_taken","value":"team-message:Team Lima","source":"m2"}]'::jsonb,
    'steps', '["y1","y2","y3"]'::jsonb, 'stepTexts', '["Step one","Step two","Step three"]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean, 'extra exploration is never penalized (100)');

  -- The critical rule: an automatic zero by each route, on its account only.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"action_taken","value":"made-up-critical","source":"xa"}]'::jsonb)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the unsafe action on the screen');
  v := pg_temp.score(pg_temp.work('{"steps":["y6"],"stepTexts":["Step six"]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the unsafe step chosen');
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"action_taken","value":"made-up-critical","source":"xb"}]'::jsonb)));
  perform pg_temp.check(not (v->>'critical_error')::boolean, 'not critical on another account');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80, 'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"events":[],"fields":{"priority":"PX1"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 15 and (v->>'recommended_score')::int = 35,
    'polished writing alone earns the writing points and the safe criterion (35)');
end $$;

\o
select 'hdesk_its06_prove: all checks passed' as result;
rollback;

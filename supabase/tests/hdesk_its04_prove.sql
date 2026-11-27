-- Help Desk Module 9 Prove It, the one-ticket shift on a laptop's network
-- screens and typed commands (20261127060125_hdesk_its04_prove.sql), scored
-- by the shared engine (20261119204423). A made-up key over a made-up ticket
-- (XB-0009, computer XC-01, action made-up-change, message zt): nothing here
-- is the real lab's answer key. Rolls everything back.
--
--   - the migration: Lab 9.1 no longer gates Module 9, the Prove It gates it
--     and takes an official grade, Lab 9.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 9's shape: let bindings that take the
--     first time of an action and of a chat message, jsonpath checks that
--     credit a typed command only before or after that action, a check on the
--     laptop's adapters at submit (machine.adapters), and a critical rule on
--     the order of the message and the change, skipped when the log was
--     trimmed;
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
select pg_temp.check((select not gates_completion and module_key = 'its-04' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-04-connectivity'),
  'Lab 9.1 stays mapped but no longer gates Module 9');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-04' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-04-prove-it'),
  'the Prove It gates Module 9 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-04' and gates_completion) = array['lab-its-04-prove-it'],
  'Module 9 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-04-practice-tickets'),
  'Lab 9.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-04-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its04_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its04_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its04_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its04_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 30, action 40 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-network-order", "rubric_version": "demo-network-order-v1",
  "let": [
    { "name": "change_at", "mode": "min", "path": "$.events[*] ? (@.type == \"action_taken\" && @.value == \"made-up-change\" && @.computer == \"XC-01\").at" },
    { "name": "tell_at", "mode": "min", "path": "$.events[*] ? (@.type == \"caller_question\" && @.value == \"zt\").at" }
  ],
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "priority", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX7", "PX8"] },
        "partial": { "points": 4, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX6", "PX9"] } },
        "feedback": "Rate the impact and the urgency." } ] },
    { "id": "investigation", "label": "Investigation", "points": 30, "criteria": [
      { "id": "typed-read", "points": 20,
        "check": { "type": "command_matches", "pattern": "^\\s*made-read\\s+/all\\s*$", "computer": "XC-01" },
        "feedback": "Type the made-up read." },
      { "id": "before", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "exists($.commands[*] ? (@.computer == \"XC-01\" && @.command like_regex \"^ *made-test +(alpha|beta) *$\" flag \"i\" && ($change_at == null || @.at < $change_at)))" },
        "feedback": "Test it before the change." } ] },
    { "id": "action", "label": "Action and decision", "points": 40, "criteria": [
      { "id": "end-state", "points": 20,
        "check": { "type": "all", "checks": [
          { "type": "path_equals", "path": ["machine", "adapters", "Port 2", "dhcp"], "value": true },
          { "type": "not", "check": { "type": "path_contains", "path": ["machine", "adapters", "Radio", "known"], "value": "Net-Omega" } } ] },
        "partial": { "points": 15, "check": { "type": "path_equals", "path": ["machine", "adapters", "Port 2", "dhcp"], "value": true } },
        "feedback": "Leave the laptop set up as it should be." },
      { "id": "told-first", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "$tell_at != null && ($change_at == null || $tell_at < $change_at)" },
        "feedback": "Tell the user first." },
      { "id": "after", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "exists($.commands[*] ? (@.computer == \"XC-01\" && @.command like_regex \"^ *made-test +alpha *$\" flag \"i\" && @.at > $change_at))" },
        "feedback": "Test it again after the change." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "changed-first", "reason": "Made-up critical rule: the change came before the message, or no message was sent.",
      "check": { "type": "all", "checks": [
        { "type": "path_equals", "path": ["logTrimmed"], "value": false },
        { "type": "jsonpath", "match": true, "path": "$change_at != null && ($tell_at == null || $tell_at > $change_at)" } ] } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up network-order key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0009', 'elapsedSeconds', 1500, 'logTrimmed', false,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '2', 'priority', 'PX7', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '["wa"]'::jsonb, 'stepTexts', '["Step A"]'::jsonb,
    'keyFinding', 'Synthetic finding.',
    'commands', '[{"command":"made-read /all","computer":"XC-01","at":"2026-01-01T10:01:00.000Z"},{"command":"made-test beta","computer":"XC-01","at":"2026-01-01T10:02:00.000Z"},{"command":"made-test alpha","computer":"XC-01","at":"2026-01-01T10:06:00.000Z"}]'::jsonb,
    'events', '[{"type":"command_run","command":"made-read /all","computer":"XC-01","at":"2026-01-01T10:01:00.000Z"},{"type":"caller_question","value":"zt","label":"Made-up message","at":"2026-01-01T10:03:00.000Z"},{"type":"action_taken","value":"made-up-change","computer":"XC-01","label":"Made-up change","at":"2026-01-01T10:04:00.000Z"},{"type":"action_taken","value":"made-up-change","computer":"XC-01","label":"Made-up change again","at":"2026-01-01T10:05:00.000Z"}]'::jsonb,
    'machine', '{"adapters":{"Port 2":{"dhcp":true,"address":"198.18.0.9"},"Radio":{"dhcp":true,"address":"","ssid":"","known":["Net-Psi"]}}}'::jsonb,
    'resolutionNote', E'Reported: a made-up call.\nTried: read the made-up laptop.\nResult: a made-up change, tested again.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
-- The base events with the message at another time (null: no message).
create function pg_temp.told_at(p_at text) returns jsonb language sql as $$
  select jsonb_build_object('events', coalesce((select jsonb_agg(case when e->>'type' = 'caller_question' then e || jsonb_build_object('at', p_at) else e end)
    from jsonb_array_elements(pg_temp.work()->'events') e where p_at is not null or e->>'type' <> 'caller_question'), '[]'::jsonb))
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX9"}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 4 and (v->>'recommended_score')::int = 94, 'a half-credit priority (94)');

  -- A typed command counts only from the command history, on its computer.
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-test beta","computer":"XC-01","at":"2026-01-01T10:02:00.000Z"},{"command":"made-test alpha","computer":"XC-01","at":"2026-01-01T10:06:00.000Z"}],"steps":["wa","wr"],"stepTexts":["Step A","Run made-read /all"]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'typed-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80, 'a ticked step that names the command earns nothing (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-read /all","computer":"XC-02","at":"2026-01-01T10:01:00.000Z"},{"command":"made-test beta","computer":"XC-01","at":"2026-01-01T10:02:00.000Z"},{"command":"made-test alpha","computer":"XC-01","at":"2026-01-01T10:06:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'typed-read')->>'earned')::int = 0, 'the command on another computer earns nothing');

  -- Before and after: by the time of the first change.
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-read /all","computer":"XC-01","at":"2026-01-01T10:01:00.000Z"},{"command":"made-test alpha","computer":"XC-01","at":"2026-01-01T10:06:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'before')->>'earned')::int = 0 and (pg_temp.crit(v, 'after')->>'earned')::int = 10 and (v->>'recommended_score')::int = 90,
    'tested only after the change: the before criterion earns nothing (90)');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-read /all","computer":"XC-01","at":"2026-01-01T10:01:00.000Z"},{"command":"made-test alpha","computer":"XC-01","at":"2026-01-01T10:02:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'before')->>'earned')::int = 10 and (pg_temp.crit(v, 'after')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'tested only before the change: the after criterion earns nothing (90)');
  -- No change at all: a test counts as before, never as after, and nothing is critical.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', '[{"type":"caller_question","value":"zt","at":"2026-01-01T10:03:00.000Z"}]'::jsonb,
    'machine', '{"adapters":{"Port 2":{"dhcp":false,"address":"198.18.0.9"},"Radio":{"dhcp":true,"known":["Net-Omega"]}}}'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'before')->>'earned')::int = 10 and (pg_temp.crit(v, 'after')->>'earned')::int = 0
    and (pg_temp.crit(v, 'end-state')->>'earned')::int = 0 and not (v->>'critical_error')::boolean and (v->>'recommended_score')::int = 70,
    'no change: no critical error, the end state and the after test earn nothing (70)');

  -- The laptop at submit: full, partial and none.
  v := pg_temp.score(pg_temp.work('{"machine":{"adapters":{"Port 2":{"dhcp":true},"Radio":{"dhcp":true,"known":["Net-Omega","Net-Psi"]}}}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'end-state')->>'earned')::int = 15 and (v->>'recommended_score')::int = 95, 'the adapter fixed, the other network kept: 15 of 20 (95)');
  v := pg_temp.score(pg_temp.work('{"machine":{}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'end-state')->>'earned')::int = 0, 'no summary: the end state earns nothing');

  -- Extra exploration: more commands, on more computers, never penalized.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', (pg_temp.work()->'commands') || '[{"command":"made-other","computer":"XC-01","at":"2026-01-01T10:07:00.000Z"},{"command":"made-read /all","computer":"XC-02","at":"2026-01-01T10:08:00.000Z"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean, 'extra exploration is never penalized (100)');

  -- The critical rule: by the order of the message and the first change.
  v := pg_temp.score(pg_temp.work(pg_temp.told_at('2026-01-01T10:04:30.000Z')));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the message came after the first change');
  v := pg_temp.score(pg_temp.work(pg_temp.told_at(null)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: a change and no message');
  v := pg_temp.score(pg_temp.work(pg_temp.told_at('2026-01-01T10:04:30.000Z') || '{"logTrimmed":true}'::jsonb));
  perform pg_temp.check(not (v->>'critical_error')::boolean and (pg_temp.crit(v, 'told-first')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'a trimmed log is never an automatic zero; told-first still earns nothing (90)');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80, 'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"machine":{},"fields":{"priority":"PX1"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20 and not (v->>'critical_error')::boolean,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its04_prove: all checks passed' as result;
rollback;

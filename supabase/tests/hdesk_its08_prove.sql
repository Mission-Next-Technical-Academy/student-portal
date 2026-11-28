-- Help Desk Module 10 Prove It, the one-ticket shift on a remote session, a
-- command console and a PC's clock (20261127220000_hdesk_its08_prove.sql),
-- scored by the shared engine (20261119204423). A made-up key over a made-up
-- ticket (XB-0010, computer XC-02, action made-up-fix, session made-up-link):
-- nothing here is the real lab's answer key. Rolls everything back.
--
--   - the migration: Lab 10.1 no longer gates Module 10, the Prove It gates it
--     and takes an official grade, Lab 10.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 10's shape: let bindings that take the
--     time of the session request and of an action, jsonpath checks that
--     credit a typed command only on its computer and only after that
--     action, a check on a machine summary at submit (machine.clock), a
--     check that a Say line exists, a negative (deduction) criterion, and a
--     critical rule on the kind of session, skipped when the log was trimmed;
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
select pg_temp.check((select not gates_completion and module_key = 'its-08' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-08-unfamiliar-problems'),
  'Lab 10.1 stays mapped but no longer gates Module 10');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-08' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-08-prove-it'),
  'the Prove It gates Module 10 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-08' and gates_completion) = array['lab-its-08-prove-it'],
  'Module 10 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-08-practice-tickets'),
  'Lab 10.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-08-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its08_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its08_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its08_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its08_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 30, action 40 (automatic, 80) and
-- documentation 20 in one judgment part. A deduction of 4 sits in action.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-remote-order", "rubric_version": "demo-remote-order-v1",
  "let": [
    { "name": "link_at", "mode": "min", "path": "$.events[*] ? (@.type == \"remote_session\" && @.computer == \"XC-02\").at" },
    { "name": "fix_at", "mode": "min", "path": "$.events[*] ? (@.type == \"action_taken\" && @.value == \"made-up-fix\" && @.computer == \"XC-02\").at" }
  ],
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "priority", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX7", "PX8"] },
        "partial": { "points": 4, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX6", "PX9"] } },
        "feedback": "Rate the impact and the urgency." } ] },
    { "id": "investigation", "label": "Investigation", "points": 30, "criteria": [
      { "id": "typed-read", "points": 20,
        "check": { "type": "command_matches", "pattern": "^\\s*made-read\\s+/all\\s*$", "computer": "XC-02" },
        "feedback": "Type the made-up read." },
      { "id": "before", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "exists($.commands[*] ? (@.computer == \"XC-02\" && @.command like_regex \"^ *made-test +(alpha|beta) *$\" flag \"i\" && ($fix_at == null || @.at < $fix_at)))" },
        "feedback": "Test it before the fix." } ] },
    { "id": "action", "label": "Action and decision", "points": 40, "criteria": [
      { "id": "end-state", "points": 20,
        "check": { "type": "all", "checks": [
          { "type": "path_equals", "path": ["machine", "clock", "synced"], "value": true },
          { "type": "path_equals", "path": ["machine", "clock", "source"], "value": "Made-up-time-source" } ] },
        "partial": { "points": 15, "check": { "type": "path_equals", "path": ["machine", "clock", "synced"], "value": true } },
        "feedback": "Leave the PC set up as it should be." },
      { "id": "asked-first", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "$link_at != null && exists($.events[*] ? (@.type == \"caller_question\" && @.value == \"zt\" && @.at < $link_at))" },
        "feedback": "Tell the user first." },
      { "id": "said", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "exists($.remoteSay[*] ? (@.text like_regex \"disconnect\" flag \"i\"))" },
        "feedback": "Say you are disconnecting." },
      { "id": "forbidden-command", "points": -4,
        "check": { "type": "command_matches", "pattern": "^\\s*made-repair( |$)", "computer": "XC-02" },
        "feedback": "Never run the made-up repair." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "unattended", "reason": "Made-up critical rule: a session started without asking.",
      "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "made-up-unattended" } } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up remote-order key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0010', 'elapsedSeconds', 1500, 'logTrimmed', false,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '2', 'priority', 'PX7', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '["wa"]'::jsonb, 'stepTexts', '["Step A"]'::jsonb,
    'keyFinding', 'Synthetic finding.',
    'commands', '[{"command":"made-read /all","computer":"XC-02","at":"2026-01-01T10:03:00.000Z"},{"command":"made-test beta","computer":"XC-02","at":"2026-01-01T10:04:00.000Z"},{"command":"made-test alpha","computer":"XC-02","at":"2026-01-01T10:08:00.000Z"}]'::jsonb,
    'events', '[{"type":"caller_question","value":"zt","label":"Made-up message","at":"2026-01-01T10:01:00.000Z"},{"type":"remote_session","computer":"XC-02","value":"made-up-link","at":"2026-01-01T10:02:00.000Z"},{"type":"command_run","command":"made-read /all","computer":"XC-02","at":"2026-01-01T10:03:00.000Z"},{"type":"action_taken","value":"made-up-fix","computer":"XC-02","label":"Made-up fix","at":"2026-01-01T10:06:00.000Z"}]'::jsonb,
    'remoteSay', '[{"time":"2026-01-01T10:09:00.000Z","text":"I am going to disconnect now."}]'::jsonb,
    'machine', '{"clock":{"synced":true,"source":"Made-up-time-source"}}'::jsonb,
    'resolutionNote', E'Reported: a made-up call.\nTried: read the made-up PC.\nResult: a made-up fix, tested again.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
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
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-test beta","computer":"XC-02","at":"2026-01-01T10:04:00.000Z"},{"command":"made-test alpha","computer":"XC-02","at":"2026-01-01T10:08:00.000Z"}],"steps":["wa","wr"],"stepTexts":["Step A","Run made-read /all"]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'typed-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80, 'a ticked step that names the command earns nothing (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-read /all","computer":"XC-03","at":"2026-01-01T10:03:00.000Z"},{"command":"made-test beta","computer":"XC-02","at":"2026-01-01T10:04:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'typed-read')->>'earned')::int = 0, 'the command on another computer earns nothing');

  -- Before and after the fix: by the time of the first fix.
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"made-read /all","computer":"XC-02","at":"2026-01-01T10:03:00.000Z"},{"command":"made-test alpha","computer":"XC-02","at":"2026-01-01T10:08:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'before')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'tested only after the fix: the before criterion earns nothing (90)');

  -- The Say lines and the order of the question and the session.
  v := pg_temp.score(pg_temp.work('{"remoteSay":[{"time":"2026-01-01T10:09:00.000Z","text":"Hello there."}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'said')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'no disconnect line among the Say lines earns nothing (90)');
  v := pg_temp.score(pg_temp.work('{"remoteSay":[]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'said')->>'earned')::int = 0 and not (v->>'critical_error')::boolean, 'no Say lines at all is not a critical error');
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"remote_session","computer":"XC-02","value":"made-up-link","at":"2026-01-01T10:02:00.000Z"},{"type":"caller_question","value":"zt","at":"2026-01-01T10:02:30.000Z"},{"type":"action_taken","value":"made-up-fix","computer":"XC-02","at":"2026-01-01T10:06:00.000Z"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'asked-first')->>'earned')::int = 0, 'the question after the session earns nothing');

  -- The PC at submit: full, partial and none.
  v := pg_temp.score(pg_temp.work('{"machine":{"clock":{"synced":true,"source":"Local CMOS Clock"}}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'end-state')->>'earned')::int = 15 and (v->>'recommended_score')::int = 95, 'synced from another source: 15 of 20 (95)');
  v := pg_temp.score(pg_temp.work('{"machine":{}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'end-state')->>'earned')::int = 0, 'no summary: the end state earns nothing');

  -- A deduction comes off the action points, never below zero.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', (pg_temp.work()->'commands') || '[{"command":"made-repair now","computer":"XC-02","at":"2026-01-01T10:07:00.000Z"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 96, 'a forbidden command costs 4 (96)');

  -- Extra exploration: more commands, on more computers, never penalized.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', (pg_temp.work()->'commands') || '[{"command":"made-other","computer":"XC-02","at":"2026-01-01T10:07:00.000Z"},{"command":"made-read /all","computer":"XC-03","at":"2026-01-01T10:08:30.000Z"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean, 'extra exploration is never penalized (100)');

  -- The critical rule: a session started without asking.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"action_taken","value":"made-up-unattended","computer":"XC-02","at":"2026-01-01T10:02:00.000Z"}]'::jsonb)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the session started without asking (0)');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80, 'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"remoteSay":[],"machine":{},"fields":{"priority":"PX1"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20 and not (v->>'critical_error')::boolean,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its08_prove: all checks passed' as result;
rollback;

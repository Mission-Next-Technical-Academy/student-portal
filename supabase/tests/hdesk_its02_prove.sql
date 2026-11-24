-- Help Desk Module 4 Prove It, the one-ticket shift worked on two computers
-- (20261123190000_hdesk_its02_prove.sql), scored by the shared engine
-- (20261119204423). A made-up key over a made-up ticket (XB-0002, invented
-- computers XC-01 and XC-02, printer XP-01, ports PORT-A and PORT-B): nothing
-- here is the real lab's answer key. Rolls everything back.
--
--   - the migration: the four older Module 4 labs no longer gate it, the
--     Prove It gates it and takes an official grade, and the backup table has
--     no API access;
--   - the engine on a package of Module 4's shape: command_matches and
--     action_taken on one computer, evidence_opened with an object value, a
--     nested machine path with a hyphenated key, two full-credit values and a
--     partial, deductions floored at 0, and a critical rule on an event that
--     stays after the change is undone;
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
select pg_temp.check((select count(*) = 4 and bool_and(not gates_completion) from public.course_module_labs where track_code = 'HDESK'
    and lab_key in ('lab-its-02-vm-build', 'lab-its-02-vm-snapshot-server', 'lab-its-02-device-manager', 'lab-its-02-print-spooler')),
  'the four older Module 4 labs stay mapped but no longer gate it');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-02' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-02-prove-it'),
  'the Prove It gates Module 4 and takes an official grade');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-02-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its02_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its02_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its02_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its02_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 30, action 40 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-two-computers", "rubric_version": "demo-two-computers-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "class", "points": 4,
        "check": { "type": "path_equals", "path": ["fields", "ticketClass"], "value": "Zeta class" },
        "feedback": "Classify the ticket from what the caller describes." },
      { "id": "priority", "points": 6,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX2", "PX3"] },
        "partial": { "points": 3, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX1", "PX4"] } },
        "feedback": "Rate impact and urgency from the facts, not the tone." } ] },
    { "id": "investigation", "label": "Investigation", "points": 30, "criteria": [
      { "id": "setting-found", "points": 10,
        "check": { "type": "any", "checks": [
          { "type": "command_matches", "pattern": "^get-thing\\s+xp-01", "computer": "XC-01" },
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "screen:XC-01:XP-01" } } ] },
        "feedback": "Look at how the device is set up before you change it." },
      { "id": "card", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "card:alpha" } },
        "feedback": "Read what changed on the computer." },
      { "id": "scope", "points": 10,
        "check": { "type": "any", "checks": [
          { "type": "step_chosen", "step": "z1" },
          { "type": "action_taken", "pattern": "test page to XP-01", "computer": "XC-02" } ] },
        "feedback": "Check whether anyone else is affected." } ] },
    { "id": "action", "label": "Action and decision", "points": 40, "criteria": [
      { "id": "setting-fixed", "points": 20,
        "check": { "type": "path_equals", "path": ["machine", "printQueues", "XP-01", "port"], "value": "PORT-B" },
        "feedback": "Put the setting back the way the record says." },
      { "id": "size-fixed", "points": 20,
        "check": { "type": "path_equals", "path": ["machine", "printQueues", "XP-01", "media"], "value": "Size two" },
        "feedback": "Check the output with the user." },
      { "id": "cleared-work", "points": -15,
        "check": { "type": "action_taken", "pattern": "^cancelled ", "computer": "XC-01" },
        "feedback": "Keep the user's waiting work." },
      { "id": "wrong-team", "points": -10,
        "check": { "type": "step_chosen", "step": "z9" },
        "feedback": "Fix it where the fault is." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-install", "reason": "Made-up critical rule: an unapproved install.",
      "check": { "type": "any", "checks": [
        { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "thing-outside" } },
        { "type": "step_chosen", "step": "z12" } ] } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up two-computer key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0002', 'elapsedSeconds', 900,
    'fields', jsonb_build_object('ticketClass', 'Zeta class', 'category', 'Cat one', 'impact', '2', 'urgency', '1', 'priority', 'PX2', 'group', 'Team Kilo'),
    'diagnosis', 'Omega cause', 'decision', 'Resolve', 'steps', '["z2"]'::jsonb, 'stepTexts', '["Step two"]'::jsonb,
    'commands', '[{"command":"Get-Thing XP-01 | Format-List","computer":"XC-01"}]'::jsonb,
    'events', '[{"type":"evidence_opened","source":"card:alpha","label":"Card A"},{"type":"action_taken","label":"printed a test page to XP-01","computer":"XC-02","value":"test-page"}]'::jsonb,
    'machine', '{"printQueues":{"XP-01":{"port":"PORT-B","driver":"Driver one","media":"Size two","queued":0,"printed":3,"testPages":1}}}'::jsonb,
    'resolutionNote', E'Reported: the widget stopped.\nTried: set the widget back.\nResult: the widget works.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.put(p_work jsonb, p_path text[], p_value jsonb) returns jsonb language sql as $$ select jsonb_set(p_work, p_path, p_value) $$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
create function pg_temp.comp(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id
$$;
create function pg_temp.events_plus(p_event jsonb) returns jsonb language sql as $$
  select jsonb_build_object('events', (pg_temp.work()->'events') || jsonb_build_array(p_event))
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  -- Two full-credit values, and a partial.
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,priority}', '"PX3"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 6 and (v->>'recommended_score')::int = 100,
    'the second full-credit value earns full credit (100)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,priority}', '"PX4"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 3 and pg_temp.crit(v, 'priority')->>'met' = 'partial' and (v->>'recommended_score')::int = 97,
    'the partial value earns half (97)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,priority}', '"PX5"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 0 and (v->>'recommended_score')::int = 94,
    'any other value earns nothing (94)');

  -- Different valid paths: the screen or the command; the step or the other computer.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', '[]'::jsonb, 'steps', '["z1"]'::jsonb,
    'events', '[{"type":"evidence_opened","source":"card:alpha"},{"type":"evidence_opened","source":"screen:XC-01:XP-01"}]'::jsonb)));
  perform pg_temp.check((v->>'automatic_earned')::int = 80, 'a different valid path earns the same (80 of 80)');
  -- The command on the wrong computer, or the test page on this one, isn't the evidence.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', '[{"command":"Get-Thing XP-01","computer":"XC-02"}]'::jsonb,
    'events', '[{"type":"evidence_opened","source":"card:alpha"},{"type":"action_taken","label":"printed a test page to XP-01","computer":"XC-01","value":"test-page"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'setting-found')->>'earned')::int = 0 and (pg_temp.crit(v, 'scope')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80,
    'command_matches and action_taken read the computer (80)');
  -- Extra exploration: more commands and cards, no penalty.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('commands', '[{"command":"ping 192.0.2.9","computer":"XC-01"},{"command":"Get-Thing XP-01","computer":"XC-01"},{"command":"Get-Other","computer":"XC-02"}]'::jsonb,
    'events', (pg_temp.work()->'events') || '[{"type":"evidence_opened","source":"card:bravo"},{"type":"evidence_opened","source":"screen:XC-02:XP-01"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'extra exploration is never penalized (100)');
  -- A partial investigation: no card.
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"action_taken","label":"printed a test page to XP-01","computer":"XC-02","value":"test-page"}]}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'investigation')->>'earned')::int = 20 and (v->>'recommended_score')::int = 90,
    'a partial investigation: 20 of 30 (90)');

  -- The end state, read from a nested path with a hyphenated printer key.
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{machine,printQueues,XP-01,port}', '"PORT-A"'));
  perform pg_temp.check((pg_temp.crit(v, 'setting-fixed')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80,
    'the setting left unchanged earns nothing for it (80)');
  v := pg_temp.score(pg_temp.work('{"machine":{}}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 0 and (v->>'recommended_score')::int = 60,
    'no machine summary: no end-state points (60)');

  -- Deductions, floored at 0.
  v := pg_temp.score(pg_temp.work(pg_temp.events_plus('{"type":"action_taken","label":"cancelled Label 1 on XP-01","computer":"XC-01","value":"job-cancel"}'::jsonb)));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 25 and (v->>'recommended_score')::int = 85,
    'one deduction: 25 of 40 (85)');
  v := pg_temp.score(pg_temp.work(pg_temp.events_plus('{"type":"action_taken","label":"cancelled Label 1 on XP-01","computer":"XC-01","value":"job-cancel"}'::jsonb)
    || '{"steps":["z9"]}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 15 and (v->>'recommended_score')::int = 75,
    'both deductions: 15 of 40 (75)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(pg_temp.events_plus('{"type":"action_taken","label":"cancelled Label 1 on XP-01","computer":"XC-01","value":"job-cancel"}'::jsonb)
    || '{"steps":["z9"]}'::jsonb), '{machine,printQueues,XP-01,port}', '"PORT-A"'));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 0, 'deductions never take a competency below 0');

  -- The critical rule: an automatic zero, even when the change was undone.
  v := pg_temp.score(pg_temp.work(pg_temp.events_plus('{"type":"action_taken","label":"installed an outside thing on XP-01","computer":"XC-01","value":"thing-outside"}'::jsonb)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0,
    'critical: the event alone zeroes the attempt, whatever the end state');
  v := pg_temp.score(pg_temp.work('{"steps":["z2","z12"]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the step the student says they took');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80,
    'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"machine":{},"fields":{"ticketClass":"Eta class","priority":"PX5"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its02_prove: all checks passed' as result;
rollback;

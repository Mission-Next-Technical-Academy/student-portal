-- Help Desk Module 6 Prove It, the one-ticket shift on one Windows computer
-- with a chat with the user (20261125052435_hdesk_its07_prove.sql), scored by
-- the shared engine (20261119204423). A made-up key over a made-up ticket
-- (XB-0006, invented computer XW-01, invented items Gadget One, Gadget Two
-- and Threat Two): nothing here is the real lab's answer key. Rolls
-- everything back.
--
--   - the migration: Lab 6.1 no longer gates Module 6, the Prove It gates it
--     and takes an official grade, Lab 6.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 6's shape: a question asked in the
--     chat (caller_question, by its neutral id), screens opened with their
--     computer, the same check typed instead, an article opened, actions
--     matched by their label (which item was removed) and by their action id,
--     two priorities for full credit and two for half, and critical rules on
--     an action id and on typed lines in each form the shell accepts;
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
select pg_temp.check((select not gates_completion and module_key = 'its-07' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-07-app-cert'),
  'Lab 6.1 stays mapped but no longer gates Module 6');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-07' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-07-prove-it'),
  'the Prove It gates Module 6 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-07' and gates_completion) = array['lab-its-07-prove-it'],
  'Module 6 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-07-practice-tickets'),
  'Lab 6.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-07-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its07_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its07_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its07_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its07_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 40, action 30 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-chat-computer", "rubric_version": "demo-chat-computer-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "priority", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX4", "PX3"] },
        "partial": { "points": 5, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX2", "PX5"] } },
        "feedback": "Rate the impact and the urgency." } ] },
    { "id": "investigation", "label": "Investigation", "points": 40, "criteria": [
      { "id": "asked", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "caller_question", "value": "z1" } },
        "feedback": "Ask the user what changed." },
      { "id": "list-read", "points": 15,
        "check": { "type": "any", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "screen-one:XW-01:tab" } },
          { "type": "command_matches", "pattern": "^get-gadgets\\y", "computer": "XW-01" } ] },
        "feedback": "Read the list before you change anything." },
      { "id": "list-compared", "points": 15,
        "check": { "type": "all", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "screen-two:XW-01" } },
          { "type": "article_opened", "article": "KB-9001" } ] },
        "feedback": "Compare the list with the article." } ] },
    { "id": "action", "label": "Action and decision", "points": 30, "criteria": [
      { "id": "removed", "points": 20,
        "check": { "type": "all", "checks": [
          { "type": "action_taken", "pattern": "^removed the gadget Gadget Two$", "computer": "XW-01" },
          { "type": "action_taken", "pattern": "^removed Threat Two \\(", "computer": "XW-01" } ] },
        "partial": { "points": 10, "check": { "type": "action_taken", "pattern": "^removed the gadget Gadget Two$", "computer": "XW-01" } },
        "feedback": "Remove the cause the managed way." },
      { "id": "verified", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "scan-after", "computer": "XW-01" } },
        "feedback": "Check again after the fix." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-off", "reason": "Made-up critical rule: the guard turned off, by a screen or a typed line.",
      "check": { "type": "any", "checks": [
        { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "guard-off" } },
        { "type": "command_matches", "pattern": "^\\s*set-mppreference\\s+-disablerealtimemonitoring(\\s*:\\s*|\\s+)\\$?(true|1)\\y" } ] } },
    { "id": "made-up-skip", "reason": "Made-up critical rule: an item skipped, by a screen or a typed line.",
      "check": { "type": "any", "checks": [
        { "type": "path_contains", "path": ["events"], "value": { "type": "action_taken", "value": "guard-skip" } },
        { "type": "command_matches", "pattern": "^\\s*add-mppreference\\s+-exclusionpath\\y" } ] } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up chat-and-computer key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0006', 'elapsedSeconds', 900,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '2', 'priority', 'PX4', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '["y2"]'::jsonb, 'stepTexts', '["Step two"]'::jsonb,
    'keyFinding', 'Synthetic finding.', 'commands', '[]'::jsonb,
    'events', '[{"type":"caller_question","value":"z1","label":"Made-up question one"},{"type":"evidence_opened","source":"screen-one:XW-01:tab"},{"type":"evidence_opened","source":"screen-two:XW-01"},{"type":"evidence_opened","source":"kb:KB-9001"},{"type":"action_taken","label":"removed the gadget Gadget Two","computer":"XW-01","value":"gadget-removed"},{"type":"action_taken","label":"removed Threat Two (Made-up screen)","computer":"XW-01","value":"threat-gone"},{"type":"action_taken","label":"checked again after the removal","computer":"XW-01","value":"scan-after"}]'::jsonb,
    'machine', '{"browserExtensions":["Gadget One"],"defender":{"realtime":true,"exclusions":[],"threats":{"Threat Two":"Removed"}},"removedExtensions":["Gadget Two"],"running":["Process A"]}'::jsonb,
    'resolutionNote', E'Reported: the widget is slow.\nTried: removed the gadget.\nResult: the widget is quick.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
create function pg_temp.comp(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id
$$;
-- The base events without the ones whose source or value is named.
create function pg_temp.without(p_name text) returns jsonb language sql as $$
  select jsonb_build_object('events', coalesce((select jsonb_agg(e) from jsonb_array_elements(pg_temp.work()->'events') e
    where coalesce(e->>'source', '') <> p_name and coalesce(e->>'value', '') <> p_name), '[]'::jsonb))
$$;
-- The base events with one more.
create function pg_temp.plus(p_event jsonb) returns jsonb language sql as $$
  select jsonb_build_object('events', (pg_temp.work()->'events') || jsonb_build_array(p_event))
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  -- The chat question: by its id, only when it was asked.
  v := pg_temp.score(pg_temp.work(pg_temp.without('z1')));
  perform pg_temp.check((pg_temp.crit(v, 'asked')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'the question never asked: 0 of 10 (90)');
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.without('z1')->'events') || '[{"type":"caller_question","value":"z2","label":"Made-up question two"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'asked')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'another question costs nothing and earns nothing (90)');

  -- Different valid paths: the screen, or the same check typed on the computer.
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-one:XW-01:tab') || '{"commands":[{"command":"Get-Gadgets | Sort-Object CPU","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80, 'the typed check earns what the screen does (80 of 80)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-one:XW-01:tab') || '{"commands":[{"command":"Get-Gadgets","computer":"XW-99"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'list-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 85,
    'the command on another computer is not the evidence (85)');

  -- The screen and the article together; either alone earns nothing.
  v := pg_temp.score(pg_temp.work(pg_temp.without('kb:KB-9001')));
  perform pg_temp.check((pg_temp.crit(v, 'list-compared')->>'earned')::int = 0 and (v->>'recommended_score')::int = 85,
    'the screen without the article: 0 of 15 (85)');

  -- Priority: two values earn full credit, two earn half.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX3"}}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'the second full-credit priority (100)');
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX5"}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 5 and (v->>'recommended_score')::int = 95, 'a half-credit priority (95)');
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX2"}}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 95, 'the other half-credit priority (95)');
  -- An explicit unsupported conclusion reduces that competency only.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX1"}}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'triage')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'a wrong priority: triage only (90)');

  -- The action, matched by which item: the cause only is the partial; the
  -- wrong item earns nothing, even with the same action id.
  v := pg_temp.score(pg_temp.work(pg_temp.without('threat-gone')));
  perform pg_temp.check((pg_temp.crit(v, 'removed')->>'earned')::int = 10 and (v->>'recommended_score')::int = 90,
    'the gadget removed, the threat left: the partial (90)');
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.without('gadget-removed')->'events') || '[{"type":"action_taken","label":"removed the gadget Gadget One","computer":"XW-01","value":"gadget-removed"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'removed')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80,
    'the wrong gadget removed: no action points (80)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('scan-after')));
  perform pg_temp.check((pg_temp.crit(v, 'verified')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'not checked again after the removal (90)');

  -- Extra exploration: more screens, questions and commands, no penalty.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"evidence_opened","source":"screen-four:XW-01"},{"type":"caller_question","value":"z3","label":"Made-up question three"}]'::jsonb,
    'commands', '[{"command":"Get-Other","computer":"XW-01"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'extra exploration is never penalized (100)');

  -- The critical rules: an automatic zero by each route.
  v := pg_temp.score(pg_temp.work(pg_temp.plus('{"type":"action_taken","label":"turned the guard off (Made-up screen)","computer":"XW-01","value":"guard-off"}'::jsonb)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the guard turned off on a screen');
  v := pg_temp.score(pg_temp.work(pg_temp.plus('{"type":"action_taken","label":"skipped an item (Made-up screen)","computer":"XW-01","value":"guard-skip"}'::jsonb)));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: an item skipped on a screen');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"Set-MpPreference -DisableRealtimeMonitoring $true","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean, 'critical: the typed line with $true');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"set-mppreference -disablerealtimemonitoring:$true","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean, 'critical: the typed line with :$true, any case');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"Set-MpPreference -DisableRealtimeMonitoring 1","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean, 'critical: the typed line with 1');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"Set-MpPreference -DisableRealtimeMonitoring $false","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check(not (v->>'critical_error')::boolean and (v->>'recommended_score')::int = 100, 'turning it back on is not critical (100)');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"Add-MpPreference -ExclusionPath C:\\Made\\Up","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the exclusion typed');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80,
    'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"machine":{},"fields":{"priority":"PX1"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its07_prove: all checks passed' as result;
rollback;

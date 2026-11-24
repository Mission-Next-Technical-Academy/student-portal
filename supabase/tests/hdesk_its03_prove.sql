-- Help Desk Module 5 Prove It, the one-ticket shift on one Windows computer
-- (20261124200131_hdesk_its03_prove.sql), scored by the shared engine
-- (20261119204423). A made-up key over a made-up ticket (XB-0003, invented
-- computer XW-01, invented apps Gadget One and Gadget Two): nothing here is
-- the real lab's answer key. Rolls everything back.
--
--   - the migration: Lab 5.1 no longer gates Module 5, the Prove It gates it
--     and takes an official grade, Lab 5.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 5's shape: screens opened with their
--     computer (evidence_opened sources), the same check typed instead, two
--     screens for full credit and one for a partial, an end state read from
--     the machine summary (an object keyed by name), a restart followed by a
--     read-again source, and a critical rule on a chosen step;
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
select pg_temp.check((select not gates_completion and module_key = 'its-03' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-03-blank-desktop'),
  'Lab 5.1 stays mapped but no longer gates Module 5');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-03' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-03-prove-it'),
  'the Prove It gates Module 5 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-03' and gates_completion) = array['lab-its-03-prove-it'],
  'Module 5 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-03-practice-tickets'),
  'Lab 5.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-03-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its03_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its03_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its03_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its03_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 40, action 30 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-one-computer", "rubric_version": "demo-one-computer-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "kind", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "ticketClass"], "value": "Theta class" },
        "feedback": "Classify the ticket from what the caller describes." } ] },
    { "id": "investigation", "label": "Investigation", "points": 40, "criteria": [
      { "id": "list-read", "points": 15,
        "check": { "type": "any", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "screen-one:XW-01:tab" } },
          { "type": "command_matches", "pattern": "^get-gadgets\\y", "computer": "XW-01" } ] },
        "feedback": "Read the list before you change anything." },
      { "id": "two-screens", "points": 15,
        "check": { "type": "path_contains", "path": ["events"], "values": [
          { "type": "evidence_opened", "source": "screen-two:XW-01" }, { "type": "evidence_opened", "source": "screen-three:XW-01" } ] },
        "partial": { "points": 6, "check": { "type": "path_contains", "path": ["events"], "min": 1, "values": [
          { "type": "evidence_opened", "source": "screen-two:XW-01" }, { "type": "evidence_opened", "source": "screen-three:XW-01" } ] } },
        "feedback": "Compare the two lists." },
      { "id": "timing", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "log:XW-01:timing" } },
        "feedback": "Measure it first." } ] },
    { "id": "action", "label": "Action and decision", "points": 30, "criteria": [
      { "id": "removed", "points": 14,
        "check": { "type": "action_taken", "pattern": "^removed Gadget Two$", "computer": "XW-01" },
        "partial": { "points": 6, "check": { "type": "path_equals", "path": ["machine", "startup", "Gadget Two Helper"], "value": "Off" } },
        "feedback": "Take the cause away the managed way." },
      { "id": "verified", "points": 16,
        "check": { "type": "all", "checks": [
          { "type": "path_equals", "path": ["machine", "bootSeconds"], "value": 30 },
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "log:XW-01:timing:after-restart" } } ] },
        "feedback": "Restart and measure again." } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result"] },
          "feedback": "Write Reported, Tried and Result." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-wipe", "reason": "Made-up critical rule: a wipe step.",
      "check": { "type": "step_chosen", "step": "y9" } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up one-computer key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0003', 'elapsedSeconds', 900,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '3', 'urgency', '2', 'priority', 'PX4', 'group', 'Team Lima'),
    'diagnosis', 'Sigma cause', 'decision', 'Resolve', 'steps', '["y2"]'::jsonb, 'stepTexts', '["Step two"]'::jsonb,
    'commands', '[]'::jsonb,
    'events', '[{"type":"evidence_opened","source":"screen-one:XW-01:tab"},{"type":"evidence_opened","source":"screen-two:XW-01"},{"type":"evidence_opened","source":"screen-three:XW-01"},{"type":"evidence_opened","source":"log:XW-01:timing"},{"type":"action_taken","label":"removed Gadget Two","computer":"XW-01","value":"gadget-removed"},{"type":"action_taken","label":"restarted the computer","computer":"XW-01","value":"restart"},{"type":"evidence_opened","source":"log:XW-01:timing:after-restart"}]'::jsonb,
    'machine', '{"startup":{"Gadget One":"On"},"installed":["Gadget One"],"restarts":1,"bootSeconds":30,"uptimeDays":0}'::jsonb,
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

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  -- Different valid paths: the screen, or the same check typed on the computer.
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-one:XW-01:tab') || '{"commands":[{"command":"Get-Gadgets | Select-Object Name","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80, 'the typed check earns what the screen does (80 of 80)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-one:XW-01:tab') || '{"commands":[{"command":"Get-Gadgets","computer":"XW-99"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'list-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 85,
    'the command on another computer is not the evidence (85)');

  -- Both screens for full credit, one for the partial.
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-three:XW-01')));
  perform pg_temp.check((pg_temp.crit(v, 'two-screens')->>'earned')::int = 6 and (v->>'recommended_score')::int = 91,
    'a partial investigation with one of the two screens: 6 of 15 (91)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('screen-two:XW-01')));
  perform pg_temp.check((pg_temp.crit(v, 'two-screens')->>'earned')::int = 6, 'either screen alone earns the same partial');

  -- Extra exploration: more screens and commands, no penalty.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"evidence_opened","source":"screen-four:XW-01"},{"type":"evidence_opened","source":"screen-two:XW-01"}]'::jsonb,
    'commands', '[{"command":"Get-Other","computer":"XW-01"}]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'extra exploration is never penalized (100)');

  -- The end state: turned off only earns the partial; nothing done earns none.
  v := pg_temp.score(pg_temp.work(pg_temp.without('gadget-removed') || '{"machine":{"startup":{"Gadget One":"On","Gadget Two Helper":"Off"},"installed":["Gadget One","Gadget Two"],"restarts":1,"bootSeconds":30}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'removed')->>'earned')::int = 6 and (v->>'recommended_score')::int = 92,
    'turned off but not removed: the partial (92)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('gadget-removed') || '{"machine":{}}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 0 and (v->>'recommended_score')::int = 70,
    'no change and no machine summary: no action points (70)');

  -- Verified: restarted after the fix and read again. Reading again after a
  -- restart that came before the fix (the old boot time) isn't the proof.
  v := pg_temp.score(pg_temp.work('{"machine":{"startup":{"Gadget One":"On"},"installed":["Gadget One"],"restarts":1,"bootSeconds":300}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'verified')->>'earned')::int = 0 and (v->>'recommended_score')::int = 84,
    'restarted before the fix only: not verified (84)');
  v := pg_temp.score(pg_temp.work(pg_temp.without('log:XW-01:timing:after-restart')));
  perform pg_temp.check((pg_temp.crit(v, 'verified')->>'earned')::int = 0, 'restarted but never read again: not verified');

  -- An explicit unsupported conclusion reduces that competency only.
  v := pg_temp.score(pg_temp.work('{"fields":{"ticketClass":"Iota class"}}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'triage')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'a wrong class: triage only (90)');

  -- The critical rule: an automatic zero.
  v := pg_temp.score(pg_temp.work('{"steps":["y2","y9"]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the step the student says they took');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80,
    'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"machine":{},"fields":{"ticketClass":"Iota class"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its03_prove: all checks passed' as result;
rollback;

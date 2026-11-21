-- Help Desk Module 2 Prove It, the queue shift (20261120213000_hdesk_its10_prove_queue.sql),
-- scored by the shared engine (20261119204423). A made-up key over made-up
-- tickets (XA-0001 to XA-0006): nothing here is the real lab's answer key.
-- Rolls everything back.
--
--   - the migration: Lab 2.1 no longer gates Module 2, the Prove It gates it
--     and takes an official grade, and the backup table has no API access;
--   - the engine on a queue package: a class and a link (path_equals), a
--     priority one band off for partial points (partial with a check), "P1
--     with a written reason" (any / all / text_length), a ticket first, "A
--     before B" on positions (jsonpath match), 0-point feedback criteria, the
--     judgment parts and the critical zero;
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
select pg_temp.check((select not gates_completion from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-10-priority-queue'),
  'Lab 2.1 stays mapped but no longer gates Module 2');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-10' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-10-prove-it'),
  'the Prove It gates Module 2 and takes an official grade');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-10-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check(not public.prove_attempt_scorable('HDESK', 'lab-its-10-priority-queue', '{"kind":"hdesk-prove"}'::jsonb),
  'Lab 2.1 is never scored');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its10_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its10_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its10_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its10_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-queue", "rubric_version": "demo-queue-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 60, "criteria": [
      { "id": "class-a", "points": 10,
        "check": { "type": "path_equals", "path": ["tickets", "XA-0001", "ticketClass"], "value": "Incident" },
        "feedback": "Classify each ticket by what the caller describes." },
      { "id": "priority-b", "points": 10,
        "check": { "type": "path_equals", "path": ["tickets", "XA-0002", "priority"], "value": "P2" },
        "partial": { "points": 5, "check": { "type": "path_equals", "path": ["tickets", "XA-0002", "priority"], "values": ["P1", "P3"] } },
        "feedback": "Rate impact and urgency from the facts, not the tone." },
      { "id": "priority-c", "points": 10,
        "check": { "type": "any", "checks": [
          { "type": "path_equals", "path": ["tickets", "XA-0003", "priority"], "value": "P2" },
          { "type": "all", "checks": [
            { "type": "path_equals", "path": ["tickets", "XA-0003", "priority"], "value": "P1" },
            { "type": "text_length", "path": ["tickets", "XA-0003", "reason"], "min": 20 } ] } ] },
        "feedback": "Say why when you rate a ticket higher than its matrix cell." },
      { "id": "link", "points": 10,
        "check": { "type": "path_equals", "path": ["tickets", "XA-0004", "parentId"], "value": "XA-0001" },
        "feedback": "Look for tickets about one outage." },
      { "id": "first", "points": 10,
        "check": { "type": "path_equals", "path": ["tickets", "XA-0005", "position"], "value": 1 },
        "feedback": "Work the most urgent ticket first." },
      { "id": "band-order", "points": 10,
        "check": { "type": "jsonpath", "match": true, "path": "$.tickets.\"XA-0002\".position < $.tickets.\"XA-0006\".position" },
        "feedback": "Keep higher priorities above lower ones." },
      { "id": "exceeds", "points": 0,
        "check": { "type": "jsonpath", "match": true, "path": "$.tickets.\"XA-0001\".position < $.tickets.\"XA-0002\".position" },
        "met": "Exceeds: older ticket first within its band." },
      { "id": "efficiency", "points": 0,
        "check": { "type": "jsonpath", "match": true, "path": "$.elapsedSeconds <= 1200" },
        "met": "Inside the time box.", "missing": "Over the time box." } ] },
    { "id": "documentation", "label": "Documentation and communication", "points": 40, "judgment": true, "parts": [
      { "id": "rewrite", "label": "Rewrite", "points": 20, "criteria": [
        { "id": "rw-where", "points": 10, "check": { "type": "path_matches", "path": ["rewrite", "description"], "pattern": "\\mzone q\\M" },
          "feedback": "Say where the problem is." },
        { "id": "rw-link", "points": 10, "check": { "type": "path_matches", "path": ["rewrite", "description"], "pattern": "INC0099001" },
          "feedback": "Name the related ticket." } ] },
      { "id": "reasons", "label": "Reasons", "points": 20, "criteria": [
        { "id": "reason-first", "points": 20, "check": { "type": "path_matches", "path": ["tickets", "XA-0005", "reason"], "pattern": "\\mledger\\M" },
          "feedback": "Explain the business impact behind your top ticket." } ] } ] } ],
  "critical": [
    { "id": "urgent-below-low", "reason": "The top ticket was ranked below the lowest band.",
      "check": { "type": "jsonpath", "match": true, "path": "$.tickets.\"XA-0005\".position > $.tickets.\"XA-0006\".position" } } ]
}$key$::jsonb);

do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up queue key validates'); end $$;

-- A work package in the simulator's queue shape (the course page's types:
-- impact and urgency are strings, position a number).
create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'shape', 'queue', 'elapsedSeconds', 900,
    'tickets', jsonb_build_object(
      'XA-0005', jsonb_build_object('number', 'INC0099005', 'impact', '1', 'urgency', '1', 'priority', 'P1', 'ticketClass', 'Incident', 'parentId', '', 'position', 1, 'reason', 'The ledger close is due today.'),
      'XA-0001', jsonb_build_object('number', 'INC0099001', 'impact', '1', 'urgency', '2', 'priority', 'P2', 'ticketClass', 'Incident', 'parentId', '', 'position', 2, 'reason', 'A whole area is down.'),
      'XA-0002', jsonb_build_object('number', 'INC0099002', 'impact', '2', 'urgency', '1', 'priority', 'P2', 'ticketClass', 'Incident', 'parentId', '', 'position', 3, 'reason', ''),
      'XA-0003', jsonb_build_object('number', 'INC0099003', 'impact', '1', 'urgency', '2', 'priority', 'P2', 'ticketClass', 'Incident', 'parentId', '', 'position', 4, 'reason', ''),
      'XA-0004', jsonb_build_object('number', 'INC0099004', 'impact', '1', 'urgency', '2', 'priority', 'P2', 'ticketClass', 'Incident', 'parentId', 'XA-0001', 'position', 5, 'reason', ''),
      'XA-0006', jsonb_build_object('number', 'INC0099006', 'impact', '3', 'urgency', '3', 'priority', 'P5', 'ticketClass', 'Service request', 'parentId', '', 'position', 6, 'reason', '')),
    'order', '["XA-0005","XA-0001","XA-0002","XA-0003","XA-0004","XA-0006"]'::jsonb,
    'rewrite', jsonb_build_object('ticketId', 'XA-0004', 'shortDescription', 'Zone Q scanners offline', 'description', 'Zone Q scanners show no network; parent INC0099001.'),
    'events', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.put(p_work jsonb, p_path text[], p_value jsonb) returns jsonb language sql as $$ select jsonb_set(p_work, p_path, p_value) $$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v_perfect jsonb := pg_temp.score(pg_temp.work());
  v jsonb;
begin
  perform pg_temp.check((v_perfect->>'automatic_earned')::int = 60 and (v_perfect->>'writing_suggested')::int = 40 and (v_perfect->>'recommended_score')::int = 100,
    'perfect: every triage point and a full writing suggestion');
  perform pg_temp.check(pg_temp.crit(v_perfect, 'exceeds')->>'met' = 'met' and (pg_temp.crit(v_perfect, 'exceeds')->>'earned')::int = 0,
    'a 0-point "exceeds" criterion is met and earns nothing');
  perform pg_temp.check(pg_temp.crit(v_perfect, 'efficiency')->>'met' = 'met', 'the efficiency band reads elapsedSeconds');

  -- One band off: partial points from the second check.
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{tickets,XA-0002,priority}', '"P3"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority-b')->>'earned')::int = 5 and (v->>'automatic_earned')::int = 55,
    'partial: one band off earns half that ticket''s points (55 of 60)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{tickets,XA-0002,priority}', '"P5"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority-b')->>'earned')::int = 0, 'two bands off earns nothing');

  -- P1 with a written reason is full credit; P1 without one is not.
  v := pg_temp.score(pg_temp.put(pg_temp.put(pg_temp.work(), '{tickets,XA-0003,priority}', '"P1"'), '{tickets,XA-0003,reason}', '"Two teams lose the system at noon."'));
  perform pg_temp.check((pg_temp.crit(v, 'priority-c')->>'earned')::int = 10, 'P1 with a written reason: full credit');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{tickets,XA-0003,priority}', '"P1"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority-c')->>'earned')::int = 0, 'P1 with no reason: no credit');

  -- A different valid order within the same band scores the same.
  v := pg_temp.score(pg_temp.put(pg_temp.put(pg_temp.work(), '{tickets,XA-0003,position}', '2'), '{tickets,XA-0001,position}', '4'));
  perform pg_temp.check((v->>'automatic_earned')::int = 60 and pg_temp.crit(v, 'exceeds')->>'met' = 'missing',
    'a different valid order in the same bands: same score, only the 0-point note changes');

  -- Extra exploration (more recorded actions) changes nothing.
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"field_set","source":"INC0099002","label":"impact","value":"3"},{"type":"order_changed","source":"INC0099006","value":"2"}]}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'extra exploration: no penalty');

  -- An unsupported conclusion (a wrong link) reduces only that criterion.
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{tickets,XA-0004,parentId}', '"XA-0002"'));
  perform pg_temp.check((v->>'automatic_earned')::int = 50, 'an unsupported link: that criterion only (50 of 60)');

  -- Strong triage, weak writing: triage points kept.
  v := pg_temp.score(pg_temp.put(pg_temp.put(pg_temp.work(), '{rewrite,description}', '"broken"'), '{tickets,XA-0005,reason}', '"urgent"'));
  perform pg_temp.check((v->>'automatic_earned')::int = 60 and (v->>'writing_suggested')::int = 0 and (v->>'recommended_score')::int = 60,
    'strong triage, weak writing: 60, the triage points kept');

  -- Weak triage, polished writing: writing points only.
  v := pg_temp.score(pg_temp.put(pg_temp.put(pg_temp.put(pg_temp.put(pg_temp.work(),
    '{tickets,XA-0001,ticketClass}', '"Service request"'), '{tickets,XA-0002,priority}', '"P5"'), '{tickets,XA-0004,parentId}', '""'), '{tickets,XA-0003,priority}', '"P4"'));
  perform pg_temp.check((v->>'automatic_earned')::int = 20 and (v->>'writing_suggested')::int = 40 and (v->>'recommended_score')::int = 60,
    'weak triage, polished writing: 20 + 40, the writing earns only writing points');

  -- The judgment parts are suggestions, part by part.
  perform pg_temp.check((select count(*) from jsonb_array_elements(v_perfect->'competencies') c, jsonb_array_elements(c->'parts') p where (c->>'judgment')::boolean) = 2
    and (select (c->>'earned') is null from jsonb_array_elements(v_perfect->'competencies') c where c->>'id' = 'documentation'),
    'the writing is suggested in parts, never pre-scored');

  -- The critical error: an automatic zero, with the points found kept for staff.
  v := pg_temp.score(pg_temp.put(pg_temp.put(pg_temp.work(), '{tickets,XA-0005,position}', '6'), '{tickets,XA-0006,position}', '1'));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0
    and (v->>'automatic_earned_before_critical')::int > 0 and v->'critical_reasons'->0->>'id' = 'urgent-below-low',
    'critical error: an automatic zero, with what was found kept for staff');

  -- Strings and numbers are not the same: an impact of 1 is not "1".
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{tickets,XA-0005,position}', '"1"'));
  perform pg_temp.check((pg_temp.crit(v, 'first')->>'earned')::int = 0, 'path_equals is type-strict: a position of "1" is not 1');
end $$;

-- A student feedback line that names a value is refused.
do $$
begin
  begin
    perform public.prove_validate_key(jsonb_set((select key from k), '{competencies,0,criteria,1,feedback}', '"Set it to P2."'));
    raise exception 'FAIL a feedback line naming a value was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  perform pg_temp.check(true, 'a student feedback line that names a value is refused');
end $$;

rollback;
\o
\echo 'hdesk_its10_prove_queue: all checks passed'

-- Help Desk Module 3 Prove It, the one-ticket shift (20261123022947_hdesk_its11_prove.sql),
-- scored by the shared engine (20261119204423). A made-up key over a made-up
-- ticket (XB-0001, invented values such as "Zeta class" and "Team Kilo"):
-- nothing here is the real lab's answer key. Rolls everything back.
--
--   - the migration: Lab 3.1 no longer gates Module 3, the Prove It gates it
--     and takes an official grade, and the backup table has no API access;
--   - the engine on a one-ticket package of Module 3's shape: path_equals with
--     a partial check (values), path_contains on events with object values
--     (both of two, or one for partial), path_contains on steps and a 0-point
--     "not" of it, path_matches on the four pieces of writing with all/any,
--     note_parts with "next", three judgment parts, a 0-point jsonpath on
--     elapsedSeconds, and a critical promise rule with a negative look-behind;
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
select pg_temp.check((select not gates_completion from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-11-handoff-documentation'),
  'Lab 3.1 stays mapped but no longer gates Module 3');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-11' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-11-prove-it'),
  'the Prove It gates Module 3 and takes an official grade');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-11-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its11_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its11_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its11_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its11_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 20, investigation 20, diagnosis 10, action 10 (automatic,
-- 60) and documentation 40 in three judgment parts (12 + 16 + 12).
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-one-ticket", "rubric_version": "demo-one-ticket-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 20, "criteria": [
      { "id": "class", "points": 6,
        "check": { "type": "path_equals", "path": ["fields", "ticketClass"], "value": "Zeta class" },
        "feedback": "Classify the ticket from what the caller describes." },
      { "id": "priority", "points": 8,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "value": "PX2" },
        "partial": { "points": 4, "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX1", "PX3"] } },
        "feedback": "Rate impact and urgency from the facts, not the tone." },
      { "id": "group", "points": 6,
        "check": { "type": "path_equals", "path": ["fields", "group"], "value": "Team Kilo" },
        "feedback": "Send the ticket to whoever owns the fix." } ] },
    { "id": "investigation", "label": "Investigation", "points": 20, "criteria": [
      { "id": "evidence", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "values": [
          { "type": "evidence_opened", "source": "card:alpha" }, { "type": "evidence_opened", "source": "card:bravo" } ] },
        "partial": { "points": 5, "check": { "type": "path_contains", "path": ["events"], "min": 1, "values": [
          { "type": "evidence_opened", "source": "card:alpha" }, { "type": "evidence_opened", "source": "card:bravo" } ] } },
        "feedback": "Open what shows the cause before you decide." },
      { "id": "history", "points": 6,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "history:one" } },
        "feedback": "Read the widget log." },
      { "id": "step", "points": 4,
        "check": { "type": "path_contains", "path": ["steps"], "value": "x3" },
        "feedback": "Confirm the finding on the device." },
      { "id": "no-repeat", "points": 0,
        "check": { "type": "not", "check": { "type": "path_contains", "path": ["steps"], "value": "x9" } },
        "met": "No step nine.", "missing": "Step nine was chosen." },
      { "id": "efficiency", "points": 0,
        "check": { "type": "jsonpath", "match": true, "path": "$.elapsedSeconds <= 1800" },
        "met": "Inside the time box.", "missing": "Over the time box." } ] },
    { "id": "diagnosis", "label": "Diagnosis", "points": 10, "criteria": [
      { "id": "cause", "points": 10,
        "check": { "type": "path_equals", "path": ["diagnosis"], "value": "Omega cause" },
        "feedback": "Name the cause the evidence supports." } ] },
    { "id": "action", "label": "Action and decision", "points": 10, "criteria": [
      { "id": "next", "points": 10,
        "check": { "type": "any", "checks": [
          { "type": "path_equals", "path": ["decision"], "value": "Route" },
          { "type": "path_contains", "path": ["steps"], "value": "x5" } ] },
        "feedback": "Decide what happens next from what you found." } ] },
    { "id": "documentation", "label": "Documentation and communication", "points": 40, "judgment": true, "parts": [
      { "id": "finding", "label": "Key finding", "points": 12, "criteria": [
        { "id": "kf-what", "points": 6, "check": { "type": "path_matches", "path": ["keyFinding"], "pattern": "\\malpha\\M" },
          "feedback": "Say what you found." },
        { "id": "kf-who", "points": 6, "check": { "type": "path_matches", "path": ["keyFinding"], "pattern": "team kilo|kilo team" },
          "feedback": "Say who can fix it." } ] },
      { "id": "handoff", "label": "Handoff note", "points": 16, "criteria": [
        { "id": "hn-parts", "points": 10,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result", "next"] },
          "partial": { "points": 5, "min": 3 },
          "feedback": "Write every part of a handoff note." },
        { "id": "hn-deadline", "points": 6, "check": { "type": "path_matches", "path": ["resolutionNote"], "pattern": "\\mzone q\\M" },
          "feedback": "Say where the widget is." } ] },
      { "id": "customer", "label": "Customer update and KB draft", "points": 12, "criteria": [
        { "id": "cu-update", "points": 4, "check": { "type": "path_matches", "path": ["userReply"], "pattern": "\\mupdate\\M" },
          "feedback": "Tell the caller where things stand." },
        { "id": "cu-next", "points": 4,
          "check": { "type": "any", "checks": [
            { "type": "path_matches", "path": ["userReply"], "pattern": "next step" },
            { "type": "path_matches", "path": ["userReply"], "pattern": "will call" } ] },
          "feedback": "Tell the caller what happens next." },
        { "id": "kb-parts", "points": 4,
          "check": { "type": "all", "checks": [
            { "type": "path_matches", "path": ["kbDraft"], "pattern": "symptom" },
            { "type": "path_matches", "path": ["kbDraft"], "pattern": "workaround" } ] },
          "feedback": "Give the article what a reader needs." } ] } ] } ],
  "critical": [
    { "id": "promise-fix", "reason": "Promised a fix time the desk can't keep.",
      "check": { "type": "all", "checks": [
        { "type": "path_matches", "path": ["userReply"], "pattern": "(?<!would be )fixed by \\d" },
        { "type": "not", "check": { "type": "path_matches", "path": ["userReply"], "pattern": "(can't|cannot) promise" } } ] } } ]
}$key$::jsonb);

do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up one-ticket key validates'); end $$;

-- A work package in the simulator's Module 3 shape (the course page's types:
-- impact and urgency are strings, elapsedSeconds a number).
create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0001', 'elapsedSeconds', 1500,
    'fields', jsonb_build_object('ticketClass', 'Zeta class', 'category', 'Cat one', 'impact', '2', 'urgency', '1', 'priority', 'PX2', 'group', 'Team Kilo'),
    'diagnosis', 'Omega cause', 'decision', 'Route', 'steps', '["x3","x5"]'::jsonb, 'stepTexts', '["Step three","Step five"]'::jsonb,
    'events', '[{"type":"evidence_opened","source":"card:alpha","label":"Card A"},{"type":"evidence_opened","source":"card:bravo","label":"Card B"},{"type":"evidence_opened","source":"history:one","label":"Call one"}]'::jsonb,
    'keyFinding', 'Found alpha on the device; only Team Kilo can fix it.',
    'resolutionNote', E'Reported: the widget stopped working.\nTried: reset the widget from Settings.\nResult: widget still blinks red.\nNext action: Team Kilo checks the widget in zone Q.',
    'userReply', 'Here is an update: the next step is with another team, who will call you.',
    'kbDraft', E'Symptom: the widget blinks red.\nWorkaround: use the widget in zone R.',
    'workNotes', '[]'::jsonb, 'commands', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.put(p_work jsonb, p_path text[], p_value jsonb) returns jsonb language sql as $$ select jsonb_set(p_work, p_path, p_value) $$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
create function pg_temp.comp(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v_perfect jsonb := pg_temp.score(pg_temp.work());
  v jsonb;
begin
  perform pg_temp.check((v_perfect->>'automatic_earned')::int = 60 and (v_perfect->>'writing_suggested')::int = 40 and (v_perfect->>'recommended_score')::int = 100
    and not (v_perfect->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');
  perform pg_temp.check(pg_temp.crit(v_perfect, 'no-repeat')->>'met' = 'met' and (pg_temp.crit(v_perfect, 'no-repeat')->>'earned')::int = 0,
    'a 0-point "not" criterion is met and earns nothing');
  perform pg_temp.check(pg_temp.crit(v_perfect, 'efficiency')->>'met' = 'met', 'the efficiency band reads elapsedSeconds');
  perform pg_temp.check(pg_temp.crit(v_perfect, 'hn-parts')->>'met' = 'met', 'note_parts finds Reported, Tried, Result and Next action');

  -- path_equals with a partial check: one band off earns the partial points.
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,priority}', '"PX3"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 4 and pg_temp.crit(v, 'priority')->>'met' = 'partial'
    and (pg_temp.comp(v, 'triage')->>'earned')::int = 16 and (v->>'recommended_score')::int = 96,
    'partial: a priority one band off earns 4 of 8 (96)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,priority}', '"PX5"'));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 0 and (v->>'recommended_score')::int = 92,
    'two bands off earns nothing (92)');
  v := pg_temp.score(pg_temp.put(pg_temp.work(), '{fields,ticketClass}', '"Eta class"'));
  perform pg_temp.check((pg_temp.crit(v, 'class')->>'earned')::int = 0 and (v->>'automatic_earned')::int = 54,
    'path_equals on the class: another class earns nothing for it (54 of 60)');

  -- path_contains on events with object values: both of two, or one for partial.
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"evidence_opened","source":"card:alpha","label":"Card A"},{"type":"evidence_opened","source":"history:one","label":"Call one"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'evidence')->>'earned')::int = 5 and (pg_temp.comp(v, 'investigation')->>'earned')::int = 15
    and (v->>'recommended_score')::int = 95,
    'a partial investigation with real secondary evidence: 5 of 10 for the cards (95)');
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"kb_search","value":"card:alpha"},{"type":"evidence_opened","source":"card:charlie"}]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'evidence')->>'earned')::int = 0 and (pg_temp.crit(v, 'history')->>'earned')::int = 0,
    'an object value matches only an element that contains all of it');

  -- Different valid paths: the decision or the step earns the same.
  v := pg_temp.score(pg_temp.work('{"decision":"Hold"}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'next')->>'earned')::int = 10 and (v->>'recommended_score')::int = 100,
    'a different valid path (any): the same credit');
  v := pg_temp.score(pg_temp.work('{"decision":"Hold","steps":["x3"]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'next')->>'earned')::int = 0 and (v->>'automatic_earned')::int = 50,
    'neither path: that criterion only (50 of 60)');

  -- Extra exploration changes nothing.
  v := pg_temp.score(pg_temp.work('{"events":[{"type":"evidence_opened","source":"card:alpha"},{"type":"evidence_opened","source":"card:bravo"},{"type":"evidence_opened","source":"history:one"},{"type":"evidence_opened","source":"card:charlie"},{"type":"evidence_opened","source":"history:two"},{"type":"warm_handoff","value":"Team Kilo","label":"Called Team Kilo"}],"steps":["x3","x5","x4"]}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'extra exploration and a warm handoff: no penalty');

  -- A step and its "not": a repeated fix shows in feedback only.
  v := pg_temp.score(pg_temp.work('{"steps":["x3","x5","x9"]}'::jsonb));
  perform pg_temp.check(pg_temp.crit(v, 'no-repeat')->>'met' = 'missing' and (v->>'automatic_earned')::int = 60,
    'a 0-point "not" criterion missed: no points change');
  v := pg_temp.score(pg_temp.work('{"steps":["x5"]}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'step')->>'earned')::int = 0 and (pg_temp.comp(v, 'investigation')->>'earned')::int = 16,
    'path_contains on steps with a string value');

  -- The time box is feedback only.
  v := pg_temp.score(pg_temp.work('{"elapsedSeconds":2400}'::jsonb));
  perform pg_temp.check(pg_temp.crit(v, 'efficiency')->>'met' = 'missing' and (v->>'recommended_score')::int = 100,
    'over the time box: no points change');

  -- An unsupported conclusion reduces only its competency.
  v := pg_temp.score(pg_temp.work('{"diagnosis":"Made-up other cause"}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'diagnosis')->>'earned')::int = 0 and (pg_temp.comp(v, 'triage')->>'earned')::int = 20
    and (v->>'recommended_score')::int = 90,
    'an unsupported diagnosis: that competency only (90)');

  -- note_parts: three of four parts earns the partial points.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('resolutionNote',
    E'Reported: the widget stopped working.\nTried: reset the widget from Settings.\nResult: widget still blinks red in zone Q.')));
  perform pg_temp.check((pg_temp.crit(v, 'hn-parts')->>'earned')::int = 5 and pg_temp.crit(v, 'hn-parts')->>'met' = 'partial'
    and (v->>'writing_suggested')::int = 35 and (v->>'recommended_score')::int = 95,
    'note_parts without Next action: 5 of 10 (35 of 40 writing, 95)');

  -- Strong analysis, weak writing: the automatic points kept.
  v := pg_temp.score(pg_temp.work('{"keyFinding":"see notes","resolutionNote":"done","userReply":"ok","kbDraft":"n/a"}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 60 and (v->>'writing_suggested')::int = 0 and (v->>'recommended_score')::int = 60,
    'strong analysis, weak writing: 60, the analysis points kept');

  -- Weak analysis, polished writing: writing points only.
  v := pg_temp.score(pg_temp.work('{"fields":{"ticketClass":"Eta class","category":"Cat two","impact":"3","urgency":"3","priority":"PX5","group":"Team Lima"},"diagnosis":"Made-up other cause","decision":"Hold","steps":[],"events":[]}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'writing_suggested')::int = 40 and (v->>'recommended_score')::int = 40,
    'weak analysis, polished writing: 0 + 40, the writing earns only writing points');

  -- all / any in the writing: one of two KB parts is not enough.
  v := pg_temp.score(pg_temp.work('{"kbDraft":"Symptom: the widget blinks red."}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'kb-parts')->>'earned')::int = 0 and (v->>'writing_suggested')::int = 36,
    'all: a KB draft with one of two parts earns nothing for it (36 of 40)');
  v := pg_temp.score(pg_temp.work('{"userReply":"Here is an update: someone will call you."}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'cu-next')->>'earned')::int = 4, 'any: either wording earns it');

  -- The judgment parts are suggestions, part by part.
  perform pg_temp.check((select count(*) from jsonb_array_elements(v_perfect->'competencies') c, jsonb_array_elements(c->'parts') p where (c->>'judgment')::boolean) = 3
    and (pg_temp.comp(v_perfect, 'documentation')->>'earned') is null
    and (pg_temp.comp(v_perfect, 'documentation')->>'suggested')::int = 40,
    'the writing is suggested in three parts, never pre-scored');

  -- The critical promise: a plain promise is an automatic zero.
  v := pg_temp.score(pg_temp.work('{"userReply":"Here is an update: it will be fixed by 5 today, and the next step is ours."}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0
    and (v->>'automatic_earned_before_critical')::int = 60 and v->'critical_reasons'->0->>'id' = 'promise-fix',
    'a plain promise: critical error, an automatic zero, what was found kept for staff');
  -- Quoting what someone else promised is not a promise (the look-behind).
  v := pg_temp.score(pg_temp.work(jsonb_build_object('diagnosis', 'Made-up other cause',
    'userReply', 'Here is an update: you were told it would be fixed by 5, and the next step is with another team.')));
  perform pg_temp.check(not (v->>'critical_error')::boolean and (v->>'recommended_score')::int = 90,
      'a quoted past promise: no critical error (90)');
  -- Saying you can't promise is not a promise.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('diagnosis', 'Made-up other cause',
    'userReply', 'Here is an update: I can''t promise it will be fixed by 5, but the next step is with another team.')));
  perform pg_temp.check(not (v->>'critical_error')::boolean and (v->>'recommended_score')::int = 90,
    'a negated promise: no critical error (90)');

  -- Strings and numbers are not the same: an impact of 2 is not "2".
  perform pg_temp.check(not (public.prove_check(pg_temp.work('{"fields":{"impact":2}}'::jsonb),
    '{"type":"path_equals","path":["fields","impact"],"value":"2"}'::jsonb)->>'met')::boolean,
    'path_equals is type-strict');
end $$;

-- A student feedback line that names a value is refused.
do $$
begin
  begin
    perform public.prove_validate_key(jsonb_set((select key from k), '{competencies,0,criteria,2,feedback}', '"Send it to Team Kilo."'));
    raise exception 'FAIL a feedback line naming a value was accepted';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
  perform pg_temp.check(true, 'a student feedback line that names a value is refused');
end $$;

rollback;
\o
\echo 'hdesk_its11_prove: all checks passed'

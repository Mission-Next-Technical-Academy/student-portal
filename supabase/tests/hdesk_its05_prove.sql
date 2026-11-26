-- Help Desk Module 7 Prove It, the one-ticket shift on the read-only server
-- screens with a one-question call (20261126021451_hdesk_its05_prove.sql),
-- scored by the shared engine (20261119204423). A made-up key over a made-up
-- ticket (XB-0007, invented server XS-01, share Alpha, groups GX-One and
-- GX-Two, change CX-0001): nothing here is the real lab's answer key. Rolls
-- everything back.
--
--   - the migration: Lab 7.1 no longer gates Module 7, the Prove It gates it
--     and takes an official grade, Lab 7.2 has no row, and the backup table
--     has no API access;
--   - the engine on a package of Module 7's shape: screens recorded by their
--     source (a screen and the typed line record the same source, so both
--     earn alike), a source for the wrong share or user earns nothing, two
--     priorities for full credit and one for half, a decision with its group,
--     the four note parts, and critical rules on a chosen step and on typed
--     lines that change permissions (reads are not critical);
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
select pg_temp.check((select not gates_completion and module_key = 'its-05' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-05-server-ad'),
  'Lab 7.1 stays mapped but no longer gates Module 7');
select pg_temp.check((select gates_completion and requires_official_score and module_key = 'its-05' from public.course_module_labs where track_code = 'HDESK' and lab_key = 'lab-its-05-prove-it'),
  'the Prove It gates Module 7 and takes an official grade');
select pg_temp.check((select array_agg(lab_key) from public.course_module_labs where track_code = 'HDESK' and module_key = 'its-05' and gates_completion) = array['lab-its-05-prove-it'],
  'Module 7 gates on its Prove It only');
select pg_temp.check(not exists (select 1 from public.course_module_labs where lab_key = 'lab-its-05-practice-tickets'),
  'Lab 7.2 (practice tickets) has no row: it never gates');
select pg_temp.check(public.prove_attempt_scorable('HDESK', 'lab-its-05-prove-it', '{"kind":"hdesk-prove"}'::jsonb),
  'an hdesk-prove package on the Prove It is scored at submit');
select pg_temp.check((select relrowsecurity from pg_class where oid = 'public.module_progress_its05_gate_backup'::regclass),
  'the backup table has RLS on');
select pg_temp.check(not has_table_privilege('anon', 'public.module_progress_its05_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its05_gate_backup', 'select')
  and not has_table_privilege('authenticated', 'public.module_progress_its05_gate_backup', 'insert'),
  'no API role can read or write the backup table');

-- ------------------------------------------------------------ the key
-- Points: triage 10, investigation 40, action 30 (automatic, 80) and
-- documentation 20 in one judgment part.
create temp table k (key jsonb);
insert into k values ($key${
  "format": 1, "lab_key": "lab-demo-server-screens", "rubric_version": "demo-server-screens-v1",
  "competencies": [
    { "id": "triage", "label": "Triage", "points": 10, "criteria": [
      { "id": "priority", "points": 10,
        "check": { "type": "path_equals", "path": ["fields", "priority"], "values": ["PX2", "PX1"] },
        "partial": { "points": 5, "check": { "type": "path_equals", "path": ["fields", "priority"], "value": "PX3" } },
        "feedback": "Rate the impact and the urgency." } ] },
    { "id": "investigation", "label": "Investigation", "points": 40, "criteria": [
      { "id": "change-read", "points": 15,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "change:CX-0001" } },
        "feedback": "Read the change." },
      { "id": "access-read", "points": 15,
        "check": { "type": "any", "checks": [
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "file-share:XS-01:Alpha:share" } },
          { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "effective-access:XS-01:Alpha:x-1" } } ] },
        "feedback": "Read the share's access." },
      { "id": "group-read", "points": 10,
        "check": { "type": "path_contains", "path": ["events"], "value": { "type": "evidence_opened", "source": "ad-group:GX-Two" } },
        "feedback": "Read the other group." } ] },
    { "id": "action", "label": "Action and decision", "points": 30, "criteria": [
      { "id": "decision", "points": 20,
        "check": { "type": "all", "checks": [
          { "type": "path_equals", "path": ["decision"], "value": "Escalate" },
          { "type": "path_equals", "path": ["fields", "group"], "value": "Team Kilo" } ] },
        "feedback": "Hand it to the team that owns it." },
      { "id": "cited", "points": 10,
        "check": { "type": "all", "checks": [
          { "type": "path_equals", "path": ["decision"], "value": "Escalate" },
          { "type": "path_matches", "path": ["resolutionNote"], "pattern": "\\mcx-?0001\\M" } ] },
        "partial": { "points": 4, "check": { "type": "path_equals", "path": ["decision"], "value": "Escalate" } },
        "feedback": "Name the change in the note." },
      { "id": "efficiency-restart", "points": 0,
        "check": { "type": "not", "check": { "type": "step_chosen", "step": "y3" } } } ] },
    { "id": "documentation", "label": "Documentation", "points": 20, "judgment": true, "parts": [
      { "id": "note", "label": "Work note", "points": 20, "criteria": [
        { "id": "note-parts", "points": 20,
          "check": { "type": "note_parts", "field": "resolutionNote", "parts": ["reported", "tried", "result", "next"] },
          "feedback": "Write Reported, Tried, Result and Next action." } ] } ] }
  ],
  "critical": [
    { "id": "made-up-step", "reason": "Made-up critical rule: an unsafe step chosen.",
      "check": { "type": "any", "checks": [ { "type": "step_chosen", "step": "y4" }, { "type": "step_chosen", "step": "y9" } ] } },
    { "id": "made-up-typed", "reason": "Made-up critical rule: a permission changed by a typed line.",
      "check": { "type": "any", "checks": [
        { "type": "command_matches", "pattern": "^\\s*(grant|revoke|block|unblock)-smbshareaccess\\y" },
        { "type": "command_matches", "pattern": "^\\s*icacls\\y.*\\s/(grant|deny|remove|reset|setowner|inheritance)\\y" } ] } }
  ]
}$key$::jsonb);
do $$ begin perform public.prove_validate_key((select key from k)); perform pg_temp.check(true, 'the made-up server-screens key validates'); end $$;

create function pg_temp.work(p_changes jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('version', 1, 'kind', 'hdesk-prove', 'moduleKey', 'demo', 'ticketId', 'XB-0007', 'elapsedSeconds', 1500,
    'fields', jsonb_build_object('ticketClass', 'Theta class', 'category', 'Cat two', 'impact', '1', 'urgency', '2', 'priority', 'PX2', 'group', 'Team Kilo'),
    'diagnosis', 'Sigma cause', 'decision', 'Escalate', 'steps', '["y2"]'::jsonb, 'stepTexts', '["Step two"]'::jsonb,
    'keyFinding', 'Synthetic finding.', 'commands', '[]'::jsonb,
    'events', '[{"type":"caller_question","value":"z1","label":"Made-up question one"},{"type":"evidence_opened","source":"change-log"},{"type":"evidence_opened","source":"change:CX-0001"},{"type":"evidence_opened","source":"file-share:XS-01:Alpha:share"},{"type":"evidence_opened","source":"ad-group:GX-Two"}]'::jsonb,
    'machine', '{}'::jsonb,
    'resolutionNote', E'Reported: the folder will not open.\nTried: read CX-0001 and the share.\nResult: no change made here.\nNext action: escalated to the owner.',
    'userReply', 'Synthetic reply.', 'workNotes', '[]'::jsonb) || p_changes;
$$;
create function pg_temp.score(p_work jsonb) returns jsonb language sql as $$ select public.prove_score(p_work, (select key from k)) $$;
create function pg_temp.crit(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') comp, jsonb_array_elements(comp->'criteria') c where c->>'id' = p_id
$$;
create function pg_temp.comp(p_result jsonb, p_id text) returns jsonb language sql as $$
  select c from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id
$$;
-- The base events without the one whose source is named, with optional extras.
create function pg_temp.swap(p_name text, p_extra jsonb default '[]'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('events', coalesce((select jsonb_agg(e) from jsonb_array_elements(pg_temp.work()->'events') e
    where coalesce(e->>'source', '') <> p_name), '[]'::jsonb) || p_extra)
$$;

-- ------------------------------------------------------------ the checks
do $$
declare
  v jsonb := pg_temp.score(pg_temp.work());
begin
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean,
    'perfect: every automatic point and a full writing suggestion');

  -- The change log list alone is not the change.
  v := pg_temp.score(pg_temp.work(pg_temp.swap('change:CX-0001')));
  perform pg_temp.check((pg_temp.crit(v, 'change-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 85,
    'the list opened, the change not: 0 of 15 (85)');

  -- Different valid paths: the share screen, or effective access for the user.
  v := pg_temp.score(pg_temp.work(pg_temp.swap('file-share:XS-01:Alpha:share', '[{"type":"evidence_opened","source":"effective-access:XS-01:Alpha:x-1"}]'::jsonb)));
  perform pg_temp.check((v->>'automatic_earned')::int = 80, 'effective access earns what the share screen does (80 of 80)');
  v := pg_temp.score(pg_temp.work(pg_temp.swap('file-share:XS-01:Alpha:share', '[{"type":"evidence_opened","source":"file-share:XS-01:Beta:share"},{"type":"evidence_opened","source":"effective-access:XS-01:Alpha:x-2"}]'::jsonb)));
  perform pg_temp.check((pg_temp.crit(v, 'access-read')->>'earned')::int = 0 and (v->>'recommended_score')::int = 85,
    'another share, or another user, is not the evidence (85)');

  -- Priority: two values earn full credit, one earns half.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX1","group":"Team Kilo"}}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'the second full-credit priority (100)');
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX3","group":"Team Kilo"}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'priority')->>'earned')::int = 5 and (v->>'recommended_score')::int = 95, 'the half-credit priority (95)');
  -- An explicit unsupported conclusion reduces that competency only.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX4","group":"Team Kilo"}}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'triage')->>'earned')::int = 0 and (v->>'recommended_score')::int = 90,
    'a wrong priority: triage only (90)');

  -- The decision needs its group; the citation keeps its own partial.
  v := pg_temp.score(pg_temp.work('{"fields":{"priority":"PX2","group":"Team Lima"}}'::jsonb));
  perform pg_temp.check((pg_temp.crit(v, 'decision')->>'earned')::int = 0 and (v->>'recommended_score')::int = 80,
    'escalated to another team: 0 of 20 (80)');
  v := pg_temp.score(pg_temp.work(jsonb_build_object('resolutionNote', E'Reported: the folder will not open.\nTried: read the share.\nResult: no change made here.\nNext action: escalated to the owner.')));
  perform pg_temp.check((pg_temp.crit(v, 'cited')->>'earned')::int = 4 and (v->>'recommended_score')::int = 94,
    'escalated without naming the change: 4 of 10 (94)');
  v := pg_temp.score(pg_temp.work('{"decision":"Resolve"}'::jsonb));
  perform pg_temp.check((pg_temp.comp(v, 'action')->>'earned')::int = 0 and (v->>'recommended_score')::int = 70,
    'resolved instead: no action points (70)');

  -- The four note parts: Next action missing loses the note's suggestion.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('resolutionNote', E'Reported: the folder will not open.\nTried: read CX-0001 and the share.\nResult: no change made here.')));
  perform pg_temp.check((pg_temp.crit(v, 'note-parts')->>'earned')::int = 0 and (v->>'automatic_earned')::int = 80,
    'no Next action: the note suggestion only, technical credit kept');

  -- Extra exploration: more screens, questions, read commands and steps, no penalty.
  v := pg_temp.score(pg_temp.work(jsonb_build_object('events', (pg_temp.work()->'events') || '[{"type":"evidence_opened","source":"server:XS-01"},{"type":"evidence_opened","source":"port:XS-01:445"}]'::jsonb,
    'commands', '[{"command":"Get-SmbShareAccess -Name Alpha -CimSession XS-01","computer":"XW-01"},{"command":"icacls \\\\XS-01\\Alpha","computer":"XW-01"},{"command":"Get-Acl \\\\XS-01\\Alpha","computer":"XW-01"}]'::jsonb,
    'steps', '["y2","y5","y7"]'::jsonb, 'stepTexts', '["Step two","Step five","Step seven"]'::jsonb)));
  perform pg_temp.check((v->>'recommended_score')::int = 100 and not (v->>'critical_error')::boolean, 'extra exploration and reads are never penalized (100)');
  -- An unnecessary step: formative only.
  v := pg_temp.score(pg_temp.work('{"steps":["y2","y3"],"stepTexts":["Step two","Step three"]}'::jsonb));
  perform pg_temp.check((v->>'recommended_score')::int = 100, 'an unnecessary step costs no points (100)');

  -- The critical rules: an automatic zero by each route.
  v := pg_temp.score(pg_temp.work('{"steps":["y2","y4"],"stepTexts":["Step two","Step four"]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the first unsafe step chosen');
  v := pg_temp.score(pg_temp.work('{"steps":["y9"],"stepTexts":["Step nine"]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the second unsafe step chosen');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"Grant-SmbShareAccess -Name Alpha -AccountName GX-One -AccessRight Change","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean and (v->>'recommended_score')::int = 0, 'critical: the share permission granted by a typed line');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"grant-smbshareaccess alpha","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean, 'critical: any case');
  v := pg_temp.score(pg_temp.work('{"commands":[{"command":"icacls D:\\Alpha /grant GX-One:M","computer":"XW-01"}]}'::jsonb));
  perform pg_temp.check((v->>'critical_error')::boolean, 'critical: an NTFS permission granted with icacls');

  -- Strong analysis with weak writing, and weak analysis with polished writing.
  v := pg_temp.score(pg_temp.work('{"resolutionNote":"Synthetic note with no parts, but it names CX-0001."}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 80 and (v->>'recommended_score')::int = 80,
    'weak writing keeps the technical credit (80)');
  v := pg_temp.score(pg_temp.work('{"commands":[],"events":[],"decision":"Resolve","fields":{"priority":"PX4","group":"Team Lima"}}'::jsonb));
  perform pg_temp.check((v->>'automatic_earned')::int = 0 and (v->>'recommended_score')::int = 20,
    'polished writing alone earns only the writing points (20)');
end $$;

\o
select 'hdesk_its05_prove: all checks passed' as result;
rollback;

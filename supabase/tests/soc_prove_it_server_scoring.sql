-- SOC Prove It scoring in the database (20261119204423_soc_prove_it_server_scoring.sql).
-- A made-up SOC lab, lab-soc-demo-prove, with made-up keys and made-up work:
-- nothing here is any real lab's answer key or scenario. Rolls everything back.
--
--   - routing: a finished 'soc-prove' work package on a SOCAN lab is scored at
--     submit; other kinds, other tracks and unfinished work are not; Help
--     Desk's 'hdesk-prove' route is unchanged;
--   - the new checks (path_equals, path_contains, path_matches, text_length,
--     jsonpath with vars and let, not), negative points, proportional and
--     check-based partial credit, the two deduction orders, the three critical
--     effects, total_points above 100, and key validation;
--   - the Prove It matrix on a case-ticket key: perfect, partial with
--     secondary evidence, different valid paths, extra exploration, an
--     unsupported conclusion, weak writing / strong analysis and the reverse;
--   - who reads what: a SOC student reads no key, no recommendation and can't
--     run the engine; the SOC instructor reads SOC recommendations only and
--     can rescore them; the Help Desk instructor reads Help Desk ones only;
--     the score the SOC portal saves is kept as before.
--
-- Run against the local stack:  bin/db-security-check.sh

\set ON_ERROR_STOP on
\o /dev/null
begin;

insert into auth.users (id, instance_id, aud, role, email) values
  ('f2000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-a@test.local'),
  ('f2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-b@test.local'),
  ('f2000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-c@test.local'),
  ('f2000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-instructor@test.local'),
  ('f2000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hd-score-instructor@test.local'),
  ('f2000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hd-score-student@test.local'),
  ('f2000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-d@test.local'),
  ('f2000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-e@test.local'),
  ('f2000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-f@test.local'),
  ('f2000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','soc-score-g@test.local'),
  ('f2000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','hd-score-student-b@test.local');
insert into public.students (student_id, user_id, track_code, is_enrolled, is_admin, is_instructor) values
  ('9900000061-SOCAN', 'f2000000-0000-0000-0000-000000000001', 'SOCAN', true, false, false),
  ('9900000062-SOCAN', 'f2000000-0000-0000-0000-000000000002', 'SOCAN', true, false, false),
  ('9900000063-SOCAN', 'f2000000-0000-0000-0000-000000000003', 'SOCAN', true, false, false),
  ('9900000064-SOCANINST', 'f2000000-0000-0000-0000-000000000004', 'SOCANINST', true, false, true),
  ('9900000065-HDINST', 'f2000000-0000-0000-0000-000000000005', 'HDINST', true, false, true),
  ('9900000066-HDESK', 'f2000000-0000-0000-0000-000000000006', 'HDESK', true, false, false),
  ('9900000067-SOCAN', 'f2000000-0000-0000-0000-000000000007', 'SOCAN', true, false, false),
  ('9900000068-SOCAN', 'f2000000-0000-0000-0000-000000000008', 'SOCAN', true, false, false),
  ('9900000069-SOCAN', 'f2000000-0000-0000-0000-000000000009', 'SOCAN', true, false, false),
  ('9900000070-SOCAN', 'f2000000-0000-0000-0000-000000000010', 'SOCAN', true, false, false),
  ('9900000071-HDESK', 'f2000000-0000-0000-0000-000000000011', 'HDESK', true, false, false);
insert into public.faculty_course_assignments (user_id, track_code) values
  ('f2000000-0000-0000-0000-000000000004', 'SOCAN'),
  ('f2000000-0000-0000-0000-000000000005', 'HDESK');
insert into public.site_sessions (user_id, auth_session_id)
  select ('f2000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid, ('e3000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid from generate_series(1, 11) n;

-- The made-up labs. SOC keeps the older review rule (no official score).
insert into public.course_module_labs (track_code, module_key, lab_key, gates_completion, requires_official_score) values
  ('SOCAN', 'demo-soc-01', 'lab-soc-demo-prove', false, false),
  ('HDESK', 'demo-hd-01', 'lab-hd-demo-prove', false, true);

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
  perform set_config('request.jwt.claims', json_build_object('sub', 'f2000000-0000-0000-0000-0000000000' || lpad(p_user, 2, '0'), 'role', 'authenticated', 'session_id', 'e3000000-0000-0000-0000-0000000000' || lpad(p_user, 2, '0'))::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.act_clear() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;

-- ------------------------------------------------------------ a made-up case-ticket key
-- Same shape as a SOC case ticket: a primary and a secondary user and device,
-- severity, disposition, routing scaled by team, a work note scaled by
-- length, and a noted (not zeroing) critical rule.
create function pg_temp.ticket_key(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{
    "format": 1, "lab_key": "lab-soc-demo-prove", "rubric_version": "soc-demo-prove-v1",
    "competencies": [
      { "id": "affected_entity", "label": "Affected user and device", "points": 20, "criteria": [
        { "id": "user-primary", "points": 10, "check": { "type": "path_equals", "path": "case_record.affectedUser", "value": "u.alpha" },
          "met": "Named the primary user.", "missing": "Primary user not named.", "feedback": "Recheck which account the records centre on." },
        { "id": "user-secondary", "points": 5, "check": { "type": "path_equals", "path": "case_record.affectedUser", "value": "u.beta" },
          "met": "Named a secondary user.", "missing": "No secondary user.", "feedback": "Recheck which account the records centre on." },
        { "id": "device-primary", "points": 10, "check": { "type": "path_equals", "path": ["case_record", "affectedDevice"], "value": "DEV-ALPHA" },
          "met": "Named the primary device.", "missing": "Primary device not named.", "feedback": "Recheck which machine the records centre on." },
        { "id": "device-secondary", "points": 5, "check": { "type": "path_equals", "path": "case_record.affectedDevice", "value": "DEV-BETA" },
          "met": "Named a secondary device.", "missing": "No secondary device.", "feedback": "Recheck which machine the records centre on." } ] },
      { "id": "severity", "label": "Severity", "points": 15, "criteria": [
        { "id": "severity", "points": 15, "check": { "type": "path_equals", "path": "case_record.priority", "value": "sev-a" },
          "met": "Right severity.", "missing": "Other severity.", "feedback": "Weigh the impact again." } ] },
      { "id": "disposition", "label": "Disposition", "points": 20, "criteria": [
        { "id": "verdict", "points": 20, "check": { "type": "path_equals", "path": "case_record.verdict", "value": "verdict-a" },
          "met": "Right disposition.", "missing": "Other disposition.", "feedback": "Check what the evidence supports." } ] },
      { "id": "escalation", "label": "Escalation and routing", "points": 35, "criteria": [
        { "id": "route-best", "points": 35, "check": { "type": "all", "checks": [
            { "type": "path_equals", "path": "case_record.escalation", "value": "need" },
            { "type": "path_equals", "path": "case_record.escalateTo", "value": "team-a" } ] },
          "met": "Best-fit team.", "missing": "Not the best-fit team.", "feedback": "Think about who can act on all of it." },
        { "id": "route-good", "points": 25, "check": { "type": "all", "checks": [
            { "type": "path_equals", "path": "case_record.escalation", "value": "need" },
            { "type": "path_equals", "path": "case_record.escalateTo", "value": "team-b" } ] },
          "met": "Accepted team.", "missing": "-", "feedback": "Think about who can act on all of it." },
        { "id": "route-fair", "points": 15, "check": { "type": "all", "checks": [
            { "type": "path_equals", "path": "case_record.escalation", "value": "need" },
            { "type": "path_equals", "path": "case_record.escalateTo", "value": "team-c" } ] },
          "met": "Accepted team.", "missing": "-", "feedback": "Think about who can act on all of it." } ] },
      { "id": "analyst_notes", "label": "Analyst work notes", "points": 10, "criteria": [
        { "id": "length", "points": 10, "credit": "proportional", "check": { "type": "text_length", "path": "case_record.notes", "min": 80 },
          "met": "Full-length note.", "missing": "Short note ({found}).", "feedback": "Write a fuller work note." } ] }
    ],
    "critical": [ { "id": "no-escalation", "effect": "flag", "check": { "type": "path_equals", "path": "case_record.escalation", "value": "no-need" },
      "reason": "Escalation set to not required." } ]
  }'::jsonb || p_extra;
$$;

create function pg_temp.long_note() returns text language sql as $$
  select 'Primary account signed in from an unusual address after repeated prompts; the device then ran a download and sent data out. Escalating.';
$$;
create function pg_temp.ticket(p_fields jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('kind', 'soc-prove', 'case_record',
    jsonb_build_object('status', 'in-progress', 'affectedUser', 'u.alpha', 'affectedDevice', 'DEV-ALPHA', 'priority', 'sev-a',
      'verdict', 'verdict-a', 'escalation', 'need', 'escalateTo', 'team-a', 'notes', pg_temp.long_note(),
      'reviewedEvidence', jsonb_build_array('e1', 'e2'), 'viewedLogIds', jsonb_build_array('r1'), 'actionHistory', '[]'::jsonb) || p_fields);
$$;
create function pg_temp.score(p_work jsonb, p_key jsonb default null) returns jsonb language sql as $$
  select public.prove_score(p_work, coalesce(p_key, pg_temp.ticket_key()));
$$;
create function pg_temp.earned(p_result jsonb, p_id text) returns int language sql as $$
  select (c->>'earned')::int from jsonb_array_elements(p_result->'competencies') c where c->>'id' = p_id;
$$;
grant execute on all functions in schema pg_temp to authenticated;

-- ------------------------------------------------------------ the Prove It matrix
select pg_temp.check((pg_temp.score(pg_temp.ticket())->>'recommended_score')::int = 100, 'matrix: a perfect ticket scores 100');
select pg_temp.check((select (r->>'recommended_score')::int = 60 and pg_temp.earned(r, 'affected_entity') = 10 and pg_temp.earned(r, 'escalation') = 25
    and pg_temp.earned(r, 'severity') = 15 and pg_temp.earned(r, 'disposition') = 0
  from (select pg_temp.score(pg_temp.ticket('{"affectedUser":"u.beta","affectedDevice":"DEV-BETA","escalateTo":"team-b","verdict":"verdict-x"}')) r) s),
  'matrix: secondary user and device and an accepted team earn partial credit (5+5, 25)');
select pg_temp.check((select (a->>'recommended_score') = (b->>'recommended_score') and (a->>'recommended_score')::int = 100
  from (select pg_temp.score(pg_temp.ticket('{"status":"pending","reviewedEvidence":["e2","e1"]}')) a,
               pg_temp.score(pg_temp.ticket('{"status":"in-progress","viewedLogIds":["r1","r2","r3"]}')) b) s),
  'matrix: different valid paths (status, order of evidence) earn the same');
select pg_temp.check((pg_temp.score(pg_temp.ticket('{"viewedLogIds":["r1","r2","r3","r4","r5","r6","r7"],"actionHistory":[{"action":"Opened a row"},{"action":"Opened another"}]}'))->>'recommended_score')::int = 100,
  'matrix: extra exploration costs nothing');
select pg_temp.check((select (r->>'recommended_score')::int = 65 and pg_temp.earned(r, 'escalation') = 0 and not (r->>'critical_error')::boolean
    and r->'critical_reasons' @> '[{"id":"no-escalation","effect":"flag"}]'
  from (select pg_temp.score(pg_temp.ticket('{"escalation":"no-need","escalateTo":""}')) r) s),
  'matrix: an unsupported conclusion (no escalation) loses routing and is flagged for staff, not zeroed');
select pg_temp.check((select (r->>'recommended_score')::int = 95 and pg_temp.earned(r, 'analyst_notes') = 5
  from (select pg_temp.score(pg_temp.ticket(jsonb_build_object('notes', repeat('x', 40)))) r) s),
  'matrix: strong analysis with weak writing keeps the technical points (notes 5 of 10)');
select pg_temp.check((select (r->>'recommended_score')::int = 10 and pg_temp.earned(r, 'analyst_notes') = 10
  from (select pg_temp.score(pg_temp.ticket(jsonb_build_object('affectedUser', 'u.zed', 'affectedDevice', 'DEV-Z', 'priority', 'sev-c', 'verdict', 'verdict-x',
    'escalateTo', 'team-z', 'notes', repeat('A polished, confident paragraph. ', 6)))) r) s),
  'matrix: polished writing with weak analysis earns only the writing points');
select pg_temp.check((select r->'competencies'->1->'criteria'->0->>'reason' = 'Other severity.' and r->'competencies'->1->'criteria'->0->>'met' = 'missing'
    and r->'competencies'->4->'criteria'->0->>'reason' = 'Full-length note.'
  from (select pg_temp.score(pg_temp.ticket('{"priority":"sev-c"}')) r) s),
  'matrix: each competency explains itself for staff');

-- ------------------------------------------------------------ the new checks
select pg_temp.check((public.prove_check('{"a":{"b":"x"}}', '{"type":"path_equals","path":"a.b","values":["y","x"]}')->>'met')::boolean
  and not (public.prove_check('{"a":{"b":1}}', '{"type":"path_equals","path":"a.b","value":"1"}')->>'met')::boolean
  and not (public.prove_check('{}', '{"type":"path_equals","path":"a.b","value":"x"}')->>'met')::boolean,
  'path_equals: one of several values; "1" is not 1; a missing field is not met');
select pg_temp.check((public.prove_check('{"acct":{"m.one":"bad"}}', '{"type":"path_equals","path":["acct","m.one"],"value":"bad"}')->>'met')::boolean,
  'path_equals: an array path reads keys that contain dots');
select pg_temp.check((select (r->>'met')::boolean and (r->>'met_count')::int = 2 and (r->>'total')::int = 3
  from (select public.prove_check('{"pins":["p1","p3","p9"]}', '{"type":"path_contains","path":"pins","values":["p1","p2","p3"],"min":2}') r) s)
  and not (public.prove_check('{"pins":["p1"]}', '{"type":"path_contains","path":"pins","values":["p1","p2"]}')->>'met')::boolean
  and not (public.prove_check('{"pins":"p1"}', '{"type":"path_contains","path":"pins","value":"p1"}')->>'met')::boolean,
  'path_contains: at least min of the values; all by default; a non-array holds nothing');
select pg_temp.check((public.prove_check('{"links":[{"alert":"A1","incident":"I1","at":"t"}]}', '{"type":"path_contains","path":"links","value":{"alert":"A1","incident":"I1"}}')->>'met')::boolean
  and not (public.prove_check('{"links":[{"alert":"A1","incident":"I2"}]}', '{"type":"path_contains","path":"links","value":{"alert":"A1","incident":"I1"}}')->>'met')::boolean,
  'path_contains: an object value matches an element that contains it');
select pg_temp.check((public.prove_check('{"h":{"o":"saw the relay rule","n":"next"},"x":["one","two-alpha"]}', '{"type":"path_matches","paths":["h.o","x"],"pattern":"relay|alpha"}')->>'found') = 'relay'
  and not (public.prove_check('{"h":{"o":"RELAY"}}', '{"type":"path_matches","path":"h.o","pattern":"relay","case":true}')->>'met')::boolean,
  'path_matches: several paths and arrays read as lines; case-insensitive unless asked');
select pg_temp.check((public.prove_check(jsonb_build_object('n', E'   abc\n  '), '{"type":"text_length","path":"n","min":3}')->>'met_count')::int = 3
  and (public.prove_check(jsonb_build_object('n', 'ab' || chr(128512)), '{"type":"text_length","path":"n","min":3}')->>'met_count')::int = 4,
  'text_length: trimmed, and counted as the browser counts (a character outside the BMP is 2)');
select pg_temp.check((public.prove_check('{"a":1}', '{"type":"not","check":{"type":"path_equals","path":"a","value":2}}')->>'met')::boolean,
  'not: met when its check is not');
select pg_temp.check((public.prove_check('{"rules":[{"field":"Src","threshold":3},{"field":"Acct","threshold":9}]}',
    '{"type":"jsonpath","path":"$.rules[*] ? (@.field like_regex \"^src$\" flag \"i\" && @.threshold <= $max)","vars":{"max":5}}')->>'met')::boolean
  and not (public.prove_check('{"rules":[{"field":"Src","threshold":7}]}',
    '{"type":"jsonpath","path":"$.rules[*] ? (@.threshold <= $max)","vars":{"max":5}}')->>'met')::boolean,
  'jsonpath: a filter with the key''s variables');
select pg_temp.check((public.prove_check('{"a":[1,2,3]}', '{"type":"jsonpath","path":"$.a[*] ? (@ > 1)","min":2}')->>'met')::boolean
  and (public.prove_check('{"a":"x"}', '{"type":"jsonpath","path":"$.a == \"x\"","match":true}')->>'met')::boolean
  and not (public.prove_check('{"a":"x"}', '{"type":"jsonpath","path":"$.a.b.c ? (@ > 1)"}')->>'met')::boolean,
  'jsonpath: counting with min, a predicate with match, and a missing field is no match');

-- A key with vars, let, deductions, a cap rule and 105 points.
create function pg_temp.engine_key(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{
    "format": 1, "total_points": 105,
    "vars": { "bad_ip": "192.0.2.9", "hit_ids": ["r1", "r2"] },
    "let": [
      { "name": "ioc", "path": "$.iocs[*] ? (@.value == $bad_ip)" },
      { "name": "report", "path": "$.reports[*] ? (@.id == $ioc.report)" },
      { "name": "runs", "path": "$.runs[*].at", "mode": "max" }
    ],
    "competencies": [
      { "id": "intel", "label": "Intel", "points": 30, "criteria": [
        { "id": "linked", "points": 20, "check": { "type": "jsonpath", "path": "$.reports[*] ? (@.id == $ioc.report && @.confidence >= 50)" },
          "partial": { "points": 10, "check": { "type": "jsonpath", "path": "$ioc ? (@ != null)" } },
          "met": "IOC with a linked, credible report.", "missing": "No linked credible report.", "feedback": "Link the indicator to its source." },
        { "id": "enriched", "points": 10, "check": { "type": "jsonpath", "path": "$.enrich[*] ? (@.ioc == $ioc.id && @.events[*] == $hit_ids[*])" },
          "met": "Enriched against the right events.", "missing": "No enrichment.", "feedback": "Enrich the indicator." } ] },
      { "id": "scope", "label": "Scope", "points": 25, "criteria": [
        { "id": "pins", "points": 15, "check": { "type": "path_contains", "path": "pins", "values": ["r1", "r2", "r3"], "min": 2 },
          "met": "Pinned the key rows.", "missing": "Few key rows.", "feedback": "Pin the rows your call rests on." },
        { "id": "count", "points": 10, "credit": "proportional", "check": { "type": "path_contains", "path": "marked", "values": ["m1", "m2", "m3", "m4"], "min": 4 },
          "met": "Every account marked.", "missing": "Some accounts marked.", "feedback": "Mark each account." },
        { "id": "wrong", "points": -6, "check": { "type": "path_contains", "path": "marked", "value": "m9" },
          "met": "Marked an unaffected account.", "missing": "-", "feedback": "One account you marked isn''t supported by the records." } ] },
      { "id": "response", "label": "Response", "points": 25, "deductions": "after_cap", "criteria": [
        { "id": "a1", "points": 15, "check": { "type": "path_contains", "path": "actions", "value": "act-1" }, "met": "a1", "missing": "no a1", "feedback": "Respond." },
        { "id": "a2", "points": 15, "check": { "type": "path_contains", "path": "actions", "value": "act-2" }, "met": "a2", "missing": "no a2", "feedback": "Respond." },
        { "id": "unsafe", "points": -5, "check": { "type": "path_contains", "path": "actions", "value": "act-wipe" }, "met": "Unsafe action.", "missing": "-" } ] },
      { "id": "time", "label": "Order", "points": 25, "criteria": [
        { "id": "late", "points": 25, "check": { "type": "jsonpath", "path": "$runs ? (@ >= \"2026-01-02\")" },
          "met": "Ran late enough.", "missing": "Ran too early.", "feedback": "Run it after the change." } ] }
    ],
    "critical": [
      { "id": "unsafe-cap", "effect": "cap", "cap": 69, "check": { "type": "path_contains", "path": "actions", "value": "act-wipe" }, "reason": "Unsafe action recorded." },
      { "id": "note-only", "effect": "flag", "check": { "type": "not", "check": { "type": "path_matches", "path": "note", "pattern": "relay" } }, "reason": "The note doesn''t mention the relay." }
    ]
  }'::jsonb || p_extra;
$$;
create function pg_temp.engine_work(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{
    "iocs": [ { "id": "ioc-7", "value": "192.0.2.9", "report": "rep-3" }, { "id": "ioc-8", "value": "198.51.100.1", "report": "rep-4" } ],
    "reports": [ { "id": "rep-3", "confidence": 80 }, { "id": "rep-4", "confidence": 10 } ],
    "enrich": [ { "ioc": "ioc-7", "events": ["r9", "r2"] } ],
    "runs": [ { "at": "2026-01-01T10:00:00Z" }, { "at": "2026-01-03T10:00:00Z" } ],
    "pins": ["r1", "r3"], "marked": ["m1", "m2", "m3", "m4"], "actions": ["act-1", "act-2"], "note": "relay rule found"
  }'::jsonb || p_extra;
$$;
select pg_temp.check((select (r->>'recommended_total')::int = 100 and (r->>'recommended_score')::int = 100 and (r->>'automatic_points')::int = 105
    and pg_temp.earned(r, 'intel') = 30 and pg_temp.earned(r, 'scope') = 25 and pg_temp.earned(r, 'response') = 25 and pg_temp.earned(r, 'time') = 25
  from (select pg_temp.score(pg_temp.engine_work(), pg_temp.engine_key()) r) s),
  'engine: vars and let join records (IOC to report, enrichment), the latest run, and 105 points cap at 100');
select pg_temp.check((select pg_temp.earned(r, 'intel') = 10
  from (select pg_temp.score(pg_temp.engine_work('{"reports":[{"id":"rep-3","confidence":10}],"enrich":[]}'), pg_temp.engine_key()) r) s),
  'engine: a partial check gives the partial points when the full check is not met');
select pg_temp.check((select pg_temp.earned(r, 'intel') = 0
  from (select pg_temp.score(pg_temp.engine_work('{"iocs":[]}'), pg_temp.engine_key()) r) s),
  'engine: nothing found, no points (a let with no match is null)');
select pg_temp.check((select pg_temp.earned(r, 'scope') = 17 and (r->'competencies'->1->'criteria'->1->>'earned')::int = 8
  from (select pg_temp.score(pg_temp.engine_work('{"marked":["m1","m2","m3","m9"]}'), pg_temp.engine_key()) r) s),
  'engine: proportional credit (3 of 4 = 8 of 10) and a deduction (15 + 8 - 6 = 17)');
select pg_temp.check((select pg_temp.earned(r, 'scope') = 0
  from (select pg_temp.score(pg_temp.engine_work('{"pins":[],"marked":["m9"]}'), pg_temp.engine_key()) r) s),
  'engine: a competency never drops below 0');
select pg_temp.check((select pg_temp.earned(r, 'response') = 20 and (r->>'recommended_total')::int = 100 and (r->>'recommended_score')::int = 69
    and not (r->>'critical_error')::boolean and r->'critical_reasons' @> '[{"id":"unsafe-cap","effect":"cap","cap":69}]'
  from (select pg_temp.score(pg_temp.engine_work('{"actions":["act-1","act-2","act-wipe"]}'), pg_temp.engine_key()) r) s),
  'engine: after_cap caps the awards (30 to 25) then deducts (-5); a cap rule caps the score at 69, the total is kept');
select pg_temp.check((select pg_temp.earned(r, 'response') = 25
  from (select pg_temp.score(pg_temp.engine_work('{"actions":["act-1","act-2","act-wipe"]}'),
    pg_temp.engine_key('{"critical":[]}'::jsonb || jsonb_build_object('competencies', jsonb_set(pg_temp.engine_key()->'competencies', '{2,deductions}', '"clamp"')))) r) s),
  'engine: the default order sums first (30 - 5 = 25) then keeps it within 25');
select pg_temp.check((select (r->>'recommended_score')::int = 100 and r->'critical_reasons' @> '[{"id":"note-only","effect":"flag"}]'
  from (select pg_temp.score(pg_temp.engine_work('{"note":"nothing to see"}'), pg_temp.engine_key()) r) s),
  'engine: a flag rule notes it for staff and changes no points');
select pg_temp.check((select (r->>'recommended_score')::int = 0 and (r->>'critical_error')::boolean
    and r->'critical_reasons' @> '[{"id":"zero"}]' and r->'critical_reasons' @> '[{"id":"unsafe-cap"}]'
  from (select pg_temp.score(pg_temp.engine_work('{"actions":["act-wipe"]}'),
    pg_temp.engine_key(jsonb_build_object('critical', pg_temp.engine_key()->'critical' || '[{"id":"zero","check":{"type":"path_contains","path":"actions","value":"act-wipe"},"reason":"Zero rule."}]'::jsonb))) r) s),
  'engine: a zero rule still zeroes, listing every rule that fired');
select pg_temp.check((select (r->>'recommended_score')::int = 100
  from (select pg_temp.score(pg_temp.engine_work('{"__let":{"ioc":{"id":"x","report":"rep-4"},"bad_ip":"198.51.100.1"}}'), pg_temp.engine_key()) r) s),
  'engine: a work package can''t set the engine''s variables');

-- Key validation.
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"total_points":100}'))$$, null, 'key: competencies must add up to total_points');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"total_points":90}'))$$, null, 'key: total_points can''t be below 100');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.engine_key()->'competencies', '{0,criteria,1,feedback}', '"Enrich 192.0.2.9 first."'))))$$, null, 'key: a student line that names a key variable is refused');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.ticket_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.ticket_key()->'competencies', '{0,criteria,0,feedback}', '"Name u.alpha."'))))$$, null, 'key: a student line that names a path value is refused');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.engine_key()->'competencies', '{3,criteria,0,check,path}', '"$runs ? (@ >= $undeclared)"'))))$$, null, 'key: a jsonpath with an undeclared variable is refused');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"let":[{"name":"bad name","path":"$.a"}]}'))$$, null, 'key: a let needs a plain name');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"let":[{"name":"x","path":"$.a","mode":"median"}]}'))$$, null, 'key: a let needs a known mode');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.engine_key()->'competencies', '{1,criteria,1,partial}', '{"points":5,"min":1}'))))$$, null, 'key: proportional credit has no partial');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.engine_key()->'competencies', '{1,criteria,2,partial}', '{"points":-1,"min":1}'))))$$, null, 'key: a deduction has no partial');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.engine_key()->'competencies', '{2,deductions}', '"later"'))))$$, null, 'key: deductions is clamp or after_cap');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"critical":[{"id":"c","effect":"warn","check":{"type":"not","check":{"type":"path_equals","path":"a","value":1}},"reason":"r"}]}'))$$,
  null, 'key: a critical effect is zero, cap or flag');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.engine_key('{"critical":[{"id":"c","effect":"cap","cap":100,"check":{"type":"not","check":{"type":"path_equals","path":"a","value":1}},"reason":"r"}]}'))$$,
  null, 'key: a cap is 0 to 99');
select pg_temp.expect_error($$select public.prove_validate_key(pg_temp.ticket_key(jsonb_build_object('competencies',
    jsonb_set(pg_temp.ticket_key()->'competencies', '{1,criteria,0,check}', '{"type":"path_equals","value":"x"}'))))$$, null, 'key: a path check needs a path');

-- ------------------------------------------------------------ routing at submit
create temp table t_ids (name text primary key, id uuid);
grant select on t_ids to authenticated;
create function pg_temp.submit(p_user text, p_work jsonb, p_track text default 'SOCAN', p_lab text default 'lab-soc-demo-prove',
    p_version text default 'soc-demo-prove-v1', p_done boolean default true, p_score int default 88) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  perform pg_temp.act_as(p_user);
  insert into public.lab_attempts (user_id, track_code, lab_key, state, score, result, rubric_version, scoring_engine_version, started_at, completed_at)
    values (auth.uid(), p_track, p_lab, (case when not p_done then 'in_progress' when p_score < 70 then 'submitted' else 'complete' end)::progress_state, p_score, p_work, p_version, 'portal-client-scorer-v1', now(),
            case when p_done then now() end)
    returning id into v_id;
  perform pg_temp.act_clear();
  return v_id;
end $$;
create function pg_temp.rec(p_attempt uuid) returns public.lab_attempt_recommendations language sql as $$
  select * from public.lab_attempt_recommendations where lab_attempt_id = p_attempt;
$$;

-- Before any key: scored as "no key". No marker, unfinished: not scored.
insert into t_ids values ('nokey', pg_temp.submit('1', pg_temp.ticket()));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'nokey'))).status = 'no_key', 'routing: a finished soc-prove attempt is scored at submit (no key yet)');
select pg_temp.check((select score = 88 from public.lab_attempts where id = (select id from t_ids where name = 'nokey')),
  'routing: the score the SOC portal saves is kept, as before (no official grade on SOC labs)');
insert into t_ids values ('nomarker', pg_temp.submit('2', pg_temp.ticket() - 'kind'));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'nomarker'))) is null, 'routing: a work package without the soc-prove marker is not scored');
insert into t_ids values ('hdkind', pg_temp.submit('3', pg_temp.ticket() || '{"kind":"hdesk-prove"}'));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'hdkind'))) is null, 'routing: hdesk-prove on a SOC lab (no official grade) is not scored');

-- Load the made-up key; the next submissions are scored.
insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key, note)
  values ('SOCAN', 'lab-soc-demo-prove', 'soc-demo-prove-v1', pg_temp.ticket_key(), 'test');
insert into t_ids values ('good', pg_temp.submit('7', pg_temp.ticket()));
select pg_temp.check((select status = 'scored' and recommended_score = 100 and automatic_earned = 100 and track_code = 'SOCAN' and scored_on = 'submit'
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'good')), 'routing: with a key, the SOC attempt is scored');
insert into t_ids values ('flagged', pg_temp.submit('8', pg_temp.ticket('{"escalation":"no-need","escalateTo":""}'), p_score => 64));
select pg_temp.check((select status = 'scored' and recommended_score = 65 and not critical_error and critical_reasons @> '[{"id":"no-escalation","effect":"flag"}]'
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'flagged')), 'routing: a below-pass SOC attempt is scored with its flag');
insert into t_ids values ('unfinished', pg_temp.submit('9', pg_temp.ticket(), p_done => false));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'unfinished'))) is null, 'routing: unfinished work is not scored');
insert into t_ids values ('oldversion', pg_temp.submit('10', pg_temp.ticket(), p_version => 'soc-analyst-rubric-v1'));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'oldversion'))).status = 'version_mismatch', 'routing: another rubric version is not scored against this key');

-- Help Desk: still its own route, untouched.
insert into t_ids values ('hd', pg_temp.submit('6', '{"kind":"hdesk-prove","decision":"x"}', p_track => 'HDESK', p_lab => 'lab-hd-demo-prove', p_version => 'hd-demo-v1'));
select pg_temp.check((select status = 'no_key' and track_code = 'HDESK' from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'hd')),
  'Help Desk: hdesk-prove on an official lab is still scored');
select pg_temp.check((select score is null from public.lab_attempts where id = (select id from t_ids where name = 'hd')), 'Help Desk: its official lab still drops the browser''s score');
insert into t_ids values ('socmarker-hd', pg_temp.submit('11', pg_temp.ticket(), p_track => 'HDESK', p_lab => 'lab-hd-demo-prove', p_version => 'hd-demo-v1'));
select pg_temp.check((pg_temp.rec((select id from t_ids where name = 'socmarker-hd'))) is null, 'routing: soc-prove on a Help Desk lab is not scored');

-- ------------------------------------------------------------ who reads what
select pg_temp.act_as('7');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations) = 0, 'SOC student: reads no recommendation, not even their own');
select pg_temp.expect_error($$select count(*) from public.assessment_answer_keys$$, null, 'SOC student: cannot read any key');
select pg_temp.expect_error($$insert into public.assessment_answer_keys (track_code, lab_key, rubric_version, key) values ('SOCAN','x','y','{}')$$, null, 'SOC student: cannot write a key');
select pg_temp.expect_error($$select public.prove_score('{}', '{}')$$, null, 'SOC student: cannot run the engine');
select pg_temp.expect_error($$select public.prove_check('{}', '{"type":"path_equals","path":"a","value":1}')$$, null, 'SOC student: cannot run a check');
select pg_temp.expect_error($$select public.prove_attempt_scorable('SOCAN', 'lab-soc-demo-prove', '{"kind":"soc-prove"}')$$, null, 'SOC student: cannot call the routing helper');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'good'))$$, 'not_course_staff', 'SOC student: cannot rescore');
select pg_temp.check((select not (result ? 'recommendation') from public.lab_attempts where user_id = auth.uid() and lab_key = 'lab-soc-demo-prove'),
  'SOC student: their own row holds no recommendation');
select pg_temp.act_clear();

select pg_temp.act_as('4');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations where track_code = 'SOCAN') = 4
  and (select count(*) from public.lab_attempt_recommendations where track_code <> 'SOCAN') = 0,
  'SOC instructor: reads the SOC recommendations and no Help Desk one');
select pg_temp.expect_error($$select count(*) from public.assessment_answer_keys$$, null, 'SOC instructor: cannot read the key itself');
select pg_temp.check(public.rescore_lab_attempt((select id from t_ids where name = 'nokey'))->>'status' = 'scored', 'SOC instructor: rescores an attempt sent before the key');
select pg_temp.check((select recommended_score = 100 and scored_on = 'rescore' and rescored_by = 'f2000000-0000-0000-0000-000000000004'
  from public.lab_attempt_recommendations where lab_attempt_id = (select id from t_ids where name = 'nokey')), 'SOC instructor: the rescore records who and the result');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'nomarker'))$$, 'not_scorable', 'SOC instructor: an attempt without the marker can''t be scored');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'good'))$$, 'already_scored', 'SOC instructor: a scored attempt is not rescored');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'hd'))$$, 'not_course_staff', 'SOC instructor: cannot rescore Help Desk');
select pg_temp.act_clear();

select pg_temp.act_as('5');
select pg_temp.check((select count(*) from public.lab_attempt_recommendations where track_code = 'HDESK') = 1
  and (select count(*) from public.lab_attempt_recommendations where track_code = 'SOCAN') = 0,
  'Help Desk instructor: reads Help Desk recommendations and no SOC one');
select pg_temp.expect_error($$select public.rescore_lab_attempt((select id from t_ids where name = 'oldversion'))$$, 'not_course_staff', 'Help Desk instructor: cannot rescore SOC');
select pg_temp.act_clear();

rollback;
\o
\echo 'soc_prove_it_server_scoring: all checks passed'

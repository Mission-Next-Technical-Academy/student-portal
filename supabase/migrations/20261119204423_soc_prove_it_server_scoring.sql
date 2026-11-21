-- SOC Prove It scoring in the database: the Help Desk scoring engine
-- (20261110200000_prove_it_auto_scoring.sql, 20261111120000, 20261119070547)
-- learns the checks SOC Prove Its need, and SOC Prove It attempts are scored
-- by the same trigger into the same staff-only recommendations.
--
-- What changes
--   1. Routing. A finished attempt is scored at submit when its work package
--      says what it is:
--        - result.kind 'hdesk-prove' on a lab with requires_official_score
--          (unchanged: Help Desk Module 1);
--        - result.kind 'soc-prove' on a SOCAN lab listed in course_module_labs
--          (new). SOC labs keep requires_official_score = false: the SOC review
--          flow, the score the portal saves and the module unlock rule are
--          unchanged. The recommendation is staff only, as for Help Desk.
--      prove_attempt_scorable() holds the rule; the submit trigger and the
--      staff rescore both use it.
--   2. The engine, extended (the key format stays "format": 1; every new field
--      is optional, so every existing key scores exactly as before):
--      checks   path_equals, path_contains, path_matches, text_length (read any
--               field of the saved work by path), jsonpath (a SQL/JSON path
--               query over the work, with the key's variables), not.
--      key      vars (expected values the jsonpath checks read), let (values
--               computed from the work before the checks run), total_points
--               (competencies may add up to more than 100; the score is
--               capped at 100).
--      criteria negative points (a deduction when the check is met);
--               "credit": "proportional" (points x met_count / total, rounded
--               half up); "partial": { "points", "check" } (half credit from a
--               different check).
--      competencies a competency's points never drop below 0; "deductions":
--               "after_cap" caps the awards at the competency's points before
--               subtracting the deductions.
--      critical "effect": "zero" (the default: an automatic zero, as for Help
--               Desk), "cap" (the score is capped at "cap"), or "flag" (noted
--               for staff, no change to the points). critical_error stays true
--               only for a zero; every rule that fired is in critical_reasons.
--   No table changes. No key is created here: the repository is public.
--
-- Why: move SOC Prove It scoring server-side, as Help Desk's already is: the
-- database scores the work the browser saves against a key loaded by hand.
-- This is the shared step; each SOC module then sends its work package with
-- kind 'soc-prove' and gets its key.
--
-- Help Desk: same results. Its keys use none of the new fields; a
-- competency's sum can't be negative without a negative criterion; its total
-- is at most 100; its critical rules are zeros. supabase/tests/
-- prove_it_auto_scoring.sql runs unchanged.
--
-- Rollback (SQL Editor, one transaction):
--   1. Re-run, in this order, the definitions these replace:
--      from 20261110200000_prove_it_auto_scoring.sql: prove_check,
--        prove_check_literals_nested, prove_check_literals, prove_validate_key,
--        prove_validate_criterion, prove_score_criterion,
--        score_lab_attempt_on_insert, rescore_lab_attempt (and its revoke and
--        grant lines);
--      from 20261111120000_prove_it_critical_coaching_only.sql: prove_score.
--   2. drop function public.prove_attempt_scorable(text, text, jsonb);
--      drop function public.prove_path(jsonb);
--      drop function public.prove_work_text(jsonb, jsonb);
--      drop function public.prove_js_length(text);
--      drop function public.prove_json_strings(jsonb);
--      drop function public.prove_let_value(jsonb, jsonb, jsonb);
--      drop function public.prove_key_probe(jsonb);
--      drop function public.prove_sum_earned(jsonb, integer, text);
--      drop function public.prove_validate_criterion(jsonb, text, jsonb);
--   3. SOC recommendations already written stay (staff-only rows); delete
--      them with: delete from public.lab_attempt_recommendations where track_code = 'SOCAN';
--   SOC answer keys loaded by hand: deactivate with
--      update public.assessment_answer_keys set is_active = false where track_code = 'SOCAN';

-- ------------------------------------------------------------ 1. routing
create or replace function public.prove_attempt_scorable(p_track_code text, p_lab_key text, p_result jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select case coalesce(p_result->>'kind', '')
    when 'hdesk-prove' then exists (
      select 1 from public.course_module_labs r
      where r.track_code = p_track_code and r.lab_key = p_lab_key and r.requires_official_score)
    when 'soc-prove' then p_track_code = 'SOCAN' and exists (
      select 1 from public.course_module_labs r
      where r.track_code = 'SOCAN' and r.lab_key = p_lab_key)
    else false
  end;
$$;

comment on function public.prove_attempt_scorable(text, text, jsonb) is
  'Whether an attempt''s work package is scored against an answer key: hdesk-prove on an official-grade lab, or soc-prove on a SOCAN lab.';

-- At submit: a finished Prove It package is scored in the same transaction.
-- Nothing here can stop the submission from saving.
create or replace function public.score_lab_attempt_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_at is null or not public.prove_attempt_scorable(new.track_code, new.lab_key, new.result) then
    return null;
  end if;
  begin
    perform public.score_lab_attempt(new.id, 'submit', null);
  exception when others then
    raise warning 'Prove It scoring failed for attempt %: %', new.id, sqlerrm;
  end;
  return null;
end;
$$;

revoke all on function public.score_lab_attempt_on_insert() from public, anon, authenticated;

-- Staff: score an attempt that has no recommendation or whose scoring failed,
-- with the active key, exactly as at submit. Never once it has a decision.
create or replace function public.rescore_lab_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_attempt public.lab_attempts%rowtype;
  v_status text;
begin
  select * into v_attempt from public.lab_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'This attempt was not found.' using errcode = 'P0001', hint = 'not_found';
  end if;
  if v_caller is null or not (public.is_admin() or public.can_manage_course_messages(v_attempt.track_code)) then
    raise exception 'You do not grade this course.' using errcode = '42501', hint = 'not_course_staff';
  end if;
  if v_attempt.reviewed_at is not null or exists (select 1 from public.lab_attempt_grades g where g.lab_attempt_id = v_attempt.id) then
    raise exception 'This attempt already has a decision, so it can''t be scored again.' using errcode = 'P0001', hint = 'already_decided';
  end if;
  if v_attempt.completed_at is null or not public.prove_attempt_scorable(v_attempt.track_code, v_attempt.lab_key, v_attempt.result) then
    raise exception 'This attempt can''t be scored automatically.' using errcode = 'P0001', hint = 'not_scorable';
  end if;
  if exists (select 1 from public.lab_attempt_recommendations r where r.lab_attempt_id = v_attempt.id and r.status = 'scored') then
    raise exception 'This attempt already has a recommendation.' using errcode = 'P0001', hint = 'already_scored';
  end if;
  v_status := public.score_lab_attempt(v_attempt.id, 'rescore', v_caller);
  return jsonb_build_object('status', v_status);
end;
$$;

revoke all on function public.rescore_lab_attempt(uuid) from public, anon;
grant execute on function public.rescore_lab_attempt(uuid) to authenticated;

-- ------------------------------------------------------------ 2. engine helpers
-- A path into the work: a JSON array of keys (["case_record","accountStatus","u.alpha"])
-- or a dotted string ("case_record.priority").
create or replace function public.prove_path(p_path jsonb)
returns text[]
language plpgsql
immutable
set search_path = public
as $$
begin
  if jsonb_typeof(p_path) = 'array' and jsonb_array_length(p_path) > 0 then
    return array(select jsonb_array_elements_text(p_path));
  elsif jsonb_typeof(p_path) = 'string' and length(p_path #>> '{}') > 0 then
    return string_to_array(p_path #>> '{}', '.');
  end if;
  raise exception 'A check needs a path: a dotted string or an array of keys.';
end;
$$;

-- Every string in a JSON value, depth first (keys not included).
create or replace function public.prove_json_strings(p_value jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array_agg(s), '{}')
  from jsonb_path_query(coalesce(p_value, 'null'::jsonb), 'strict $.** ? (@.type() == "string")') s0(v),
       lateral (select v #>> '{}' as s) x;
$$;

-- The text a check reads: "path" or "paths". A string is itself; an array
-- gives its strings, one per line; a number or boolean its text; anything
-- else nothing. Several paths are joined with a line break.
create or replace function public.prove_work_text(p_work jsonb, p_check jsonb)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_paths jsonb;
  v_path jsonb;
  v_value jsonb;
  v_parts text[] := '{}';
begin
  if p_check ? 'paths' then
    if jsonb_typeof(p_check->'paths') <> 'array' or jsonb_array_length(p_check->'paths') = 0 then
      raise exception 'A text check''s paths must be a non-empty array.';
    end if;
    v_paths := p_check->'paths';
  else
    v_paths := jsonb_build_array(p_check->'path');
  end if;
  for v_path in select value from jsonb_array_elements(v_paths) loop
    v_value := p_work #> public.prove_path(v_path);
    v_parts := v_parts || case jsonb_typeof(v_value)
      when 'string' then v_value #>> '{}'
      when 'number' then v_value #>> '{}'
      when 'boolean' then v_value #>> '{}'
      when 'array' then (select string_agg(e #>> '{}', E'\n') from jsonb_array_elements(v_value) e where jsonb_typeof(e) = 'string')
      else null end;
  end loop;
  return coalesce(array_to_string(v_parts, E'\n'), '');
end;
$$;

-- A string's length as the browser counts it (String.prototype.length: UTF-16
-- code units, so a character outside the Basic Multilingual Plane counts 2).
create or replace function public.prove_js_length(p_text text)
returns integer
language sql
immutable
set search_path = public
as $$
  select char_length(coalesce(p_text, ''))
    + char_length(coalesce(p_text, '')) - char_length(regexp_replace(coalesce(p_text, ''), '[\U00010000-\U0010FFFF]', '', 'g'));
$$;

-- One "let" binding: a SQL/JSON path over the work, with the variables so far.
-- mode: first (default), array, count, exists, min, max, last.
create or replace function public.prove_let_value(p_work jsonb, p_let jsonb, p_vars jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_path jsonpath := (p_let->>'path')::jsonpath;
  v_mode text := coalesce(p_let->>'mode', 'first');
  v_array jsonb;
begin
  case v_mode
    when 'first' then return jsonb_path_query_first_tz(p_work, v_path, p_vars, true);
    when 'exists' then return to_jsonb(jsonb_path_exists_tz(p_work, v_path, p_vars, true));
    else
      v_array := jsonb_path_query_array_tz(p_work, v_path, p_vars, true);
      case v_mode
        when 'array' then return v_array;
        when 'count' then return to_jsonb(jsonb_array_length(v_array));
        when 'last' then return v_array->-1;
        when 'min' then return (select e from jsonb_array_elements(v_array) e order by e limit 1);
        when 'max' then return (select e from jsonb_array_elements(v_array) e order by e desc limit 1);
        else raise exception 'Unknown let mode %.', v_mode;
      end case;
  end case;
end;
$$;

-- ------------------------------------------------------------ 3. checks
-- One check against the work: { met, met_count, total, found, missing }.
-- Patterns are PostgreSQL regular expressions, case-insensitive unless the
-- check says "case": true. The Help Desk kinds are unchanged.
create or replace function public.prove_check(p_work jsonb, p_check jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_type text := p_check->>'type';
  v_case boolean := coalesce((p_check->>'case')::boolean, false);
  v_found text;
  v_sub jsonb;
  v_results jsonb[] := '{}';
  v_met_count integer := 0;
  v_total integer;
  v_missing text[];
  v_text text;
  v_value jsonb;
  v_values jsonb;
  v_min integer;
  v_vars jsonb;
begin
  case v_type
    when 'step_chosen', 'step_not_chosen' then
      v_found := case when coalesce(p_work->'steps', '[]'::jsonb) ? (p_check->>'step') then p_check->>'step' end;
      if v_type = 'step_chosen' then
        return jsonb_build_object('met', v_found is not null, 'met_count', (v_found is not null)::int, 'total', 1, 'found', v_found);
      end if;
      return jsonb_build_object('met', v_found is null, 'met_count', (v_found is null)::int, 'total', 1, 'found', null);
    when 'kb_search' then
      select e->>'value' into v_found from jsonb_array_elements(coalesce(p_work->'events', '[]'::jsonb)) e
      where e->>'type' = 'kb_search' and public.prove_match(e->>'value', p_check->>'pattern', v_case) is not null limit 1;
    when 'article_opened' then
      select p_check->>'article' into v_found from jsonb_array_elements(coalesce(p_work->'events', '[]'::jsonb)) e
      where e->>'type' = 'evidence_opened' and e->>'source' = 'kb:' || (p_check->>'article') limit 1;
    when 'action_taken' then
      select e->>'label' into v_found from jsonb_array_elements(coalesce(p_work->'events', '[]'::jsonb)) e
      where e->>'type' = 'action_taken'
        and public.prove_match(e->>'label', p_check->>'pattern', v_case) is not null
        and (p_check->>'computer' is null or e->>'computer' = p_check->>'computer') limit 1;
    when 'command_matches' then
      select c->>'command' into v_found from jsonb_array_elements(coalesce(p_work->'commands', '[]'::jsonb)) c
      where public.prove_match(c->>'command', p_check->>'pattern', v_case) is not null
        and (p_check->>'computer' is null or c->>'computer' = p_check->>'computer') limit 1;
    when 'field_equals' then
      if p_check->>'field' not in ('diagnosis', 'decision') then
        raise exception 'field_equals reads diagnosis or decision, not %', p_check->>'field';
      end if;
      v_found := case when btrim(coalesce(p_work->>(p_check->>'field'), '')) = btrim(p_check->>'value') then p_work->>(p_check->>'field') end;
    when 'text_matches', 'note_parts' then
      v_text := case p_check->>'field'
        when 'resolutionNote' then p_work->>'resolutionNote'
        when 'userReply' then p_work->>'userReply'
        when 'workNotes' then (select string_agg(n, E'\n') from jsonb_array_elements_text(coalesce(p_work->'workNotes', '[]'::jsonb)) n)
        else null end;
      if p_check->>'field' not in ('resolutionNote', 'userReply', 'workNotes') then
        raise exception 'text checks read resolutionNote, userReply or workNotes, not %', p_check->>'field';
      end if;
      if v_type = 'text_matches' then
        v_found := public.prove_match(v_text, p_check->>'pattern', v_case);
      else
        v_missing := public.prove_note_missing(v_text, array(select jsonb_array_elements_text(p_check->'parts')));
        v_total := jsonb_array_length(p_check->'parts');
        return jsonb_build_object('met', coalesce(array_length(v_missing, 1), 0) = 0,
          'met_count', v_total - coalesce(array_length(v_missing, 1), 0), 'total', v_total,
          'found', null, 'missing', array_to_string(v_missing, ', '));
      end if;
    when 'all', 'any' then
      for v_sub in select value from jsonb_array_elements(p_check->'checks') loop
        v_results := v_results || public.prove_check(p_work, v_sub);
      end loop;
      v_total := coalesce(array_length(v_results, 1), 0);
      select count(*) into v_met_count from unnest(v_results) r where (r->>'met')::boolean;
      select string_agg(r->>'found', '; ') into v_found from unnest(v_results) r where r->>'found' is not null;
      return jsonb_build_object('met', case when v_type = 'all' then v_met_count = v_total and v_total > 0 else v_met_count > 0 end,
        'met_count', v_met_count, 'total', v_total, 'found', v_found);

    -- ---- Added for SOC Prove Its (20261119204423). They read the work by path.
    when 'not' then
      if jsonb_typeof(p_check->'check') <> 'object' then
        raise exception 'A not check needs a check.';
      end if;
      v_sub := public.prove_check(p_work, p_check->'check');
      return jsonb_build_object('met', not (v_sub->>'met')::boolean, 'met_count', (not (v_sub->>'met')::boolean)::int, 'total', 1, 'found', null);
    when 'path_equals' then
      -- The value at path equals "value", or one of "values" (JSON equality:
      -- "1" is not 1, as in the browser's ===).
      v_value := p_work #> public.prove_path(p_check->'path');
      if p_check ? 'values' then
        if jsonb_typeof(p_check->'values') <> 'array' or jsonb_array_length(p_check->'values') = 0 then
          raise exception 'path_equals values must be a non-empty array.';
        end if;
        v_values := p_check->'values';
      elsif p_check ? 'value' then
        v_values := jsonb_build_array(p_check->'value');
      else
        raise exception 'path_equals needs a value or values.';
      end if;
      v_found := case when v_value is not null and exists (select 1 from jsonb_array_elements(v_values) e where e = v_value) then v_value #>> '{}' end;
    when 'path_contains' then
      -- The array at path holds "value", or at least "min" (default: all) of
      -- "values". An object value matches an element that contains it.
      v_value := p_work #> public.prove_path(p_check->'path');
      if jsonb_typeof(v_value) is distinct from 'array' then
        v_value := '[]'::jsonb;
      end if;
      if p_check ? 'values' then
        if jsonb_typeof(p_check->'values') <> 'array' or jsonb_array_length(p_check->'values') = 0 then
          raise exception 'path_contains values must be a non-empty array.';
        end if;
        v_values := p_check->'values';
      elsif p_check ? 'value' then
        v_values := jsonb_build_array(p_check->'value');
      else
        raise exception 'path_contains needs a value or values.';
      end if;
      v_total := jsonb_array_length(v_values);
      v_min := coalesce((p_check->>'min')::int, v_total);
      if v_min < 1 or v_min > v_total then
        raise exception 'path_contains min must be between 1 and the number of values.';
      end if;
      select count(*), string_agg(w #>> '{}', ', ') into v_met_count, v_found
      from jsonb_array_elements(v_values) w
      where exists (select 1 from jsonb_array_elements(v_value) e
                    where case when jsonb_typeof(w) = 'object' then e @> w else e = w end);
      return jsonb_build_object('met', v_met_count >= v_min, 'met_count', v_met_count, 'total', v_total, 'found', v_found);
    when 'path_matches' then
      if coalesce(p_check->>'pattern', '') = '' then
        raise exception 'path_matches needs a pattern.';
      end if;
      v_text := public.prove_work_text(p_work, p_check);
      v_found := (regexp_match(left(v_text, 32000), '(' || (p_check->>'pattern') || ')', case when v_case then '' else 'i' end))[1];
    when 'text_length' then
      -- The text's length after trimming, as the browser counts it. met_count
      -- is the length and total the minimum, for proportional credit.
      v_min := (p_check->>'min')::int;
      if v_min is null or v_min < 1 then
        raise exception 'text_length needs a min of 1 or more.';
      end if;
      v_text := regexp_replace(public.prove_work_text(p_work, p_check), '^\s+|\s+$', '', 'g');
      v_met_count := public.prove_js_length(v_text);
      return jsonb_build_object('met', v_met_count >= v_min, 'met_count', v_met_count, 'total', v_min,
        'found', case when v_met_count > 0 then v_met_count::text || ' characters' end);
    when 'jsonpath' then
      -- A SQL/JSON path over the work. Variables: the key's vars and let
      -- values (in the work's __let, put there by prove_score), then the
      -- check's own vars. Errors inside the path (a missing field, a wrong
      -- type) read as no match. "match": true reads a predicate path; "min"
      -- counts the items the path returns.
      if coalesce(p_check->>'path', '') = '' then
        raise exception 'A jsonpath check needs a path.';
      end if;
      v_vars := coalesce(p_work->'__let', '{}'::jsonb) || coalesce(p_check->'vars', '{}'::jsonb);
      if coalesce((p_check->>'match')::boolean, false) then
        v_found := case when coalesce(jsonb_path_match_tz(p_work, (p_check->>'path')::jsonpath, v_vars, true), false) then 'match' end;
      elsif p_check ? 'min' then
        v_min := (p_check->>'min')::int;
        if v_min is null or v_min < 1 then
          raise exception 'jsonpath min must be 1 or more.';
        end if;
        v_met_count := jsonb_array_length(jsonb_path_query_array_tz(p_work, (p_check->>'path')::jsonpath, v_vars, true));
        return jsonb_build_object('met', v_met_count >= v_min, 'met_count', v_met_count, 'total', v_min, 'found', null);
      else
        v_found := left(jsonb_path_query_first_tz(p_work, (p_check->>'path')::jsonpath, v_vars, true) #>> '{}', 200);
        if v_found is null and jsonb_path_exists_tz(p_work, (p_check->>'path')::jsonpath, v_vars, true) then
          v_found := '(found)';
        end if;
      end if;
    else
      raise exception 'Unknown check type %', coalesce(v_type, '(none)');
  end case;
  return jsonb_build_object('met', v_found is not null, 'met_count', (v_found is not null)::int, 'total', 1, 'found', v_found);
end;
$$;

create or replace function public.prove_check_literals_nested(p_check jsonb)
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
  v_out text[] := '{}';
  v_sub jsonb;
begin
  if jsonb_typeof(p_check->'checks') = 'array' then
    for v_sub in select value from jsonb_array_elements(p_check->'checks') loop
      v_out := v_out || array[v_sub->>'step', v_sub->>'article', v_sub->>'value'] || public.prove_check_literals_nested(v_sub);
    end loop;
  end if;
  -- Added 20261119204423: a not check's inner check, and the values,
  -- object values and variables of the path checks.
  if jsonb_typeof(p_check->'check') = 'object' then
    v_out := v_out || array[p_check->'check'->>'step', p_check->'check'->>'article', p_check->'check'->>'value']
      || public.prove_check_literals_nested(p_check->'check');
  end if;
  v_out := v_out || public.prove_json_strings(p_check->'values') || public.prove_json_strings(p_check->'vars');
  if jsonb_typeof(p_check->'value') in ('object', 'array') then
    v_out := v_out || public.prove_json_strings(p_check->'value');
  end if;
  return v_out;
end;
$$;

-- The literal values a check names (step ids, articles, expected values),
-- so a student feedback line can be refused when it gives one away.
create or replace function public.prove_check_literals(p_check jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array_agg(distinct v) filter (where v is not null and length(v) > 0), '{}')
  from (
    select p_check->>'step' as v
    union all select p_check->>'article'
    union all select case when jsonb_typeof(p_check->'value') in ('object', 'array') then null else p_check->>'value' end
    union all select unnest(public.prove_check_literals_nested(p_check))
  ) s;
$$;

-- What a check is validated against: an empty work package with every
-- variable the key declares (vars and let names), so a jsonpath that uses
-- them can be checked before any work exists.
create or replace function public.prove_key_probe(p_key jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case
    when p_key ? 'vars' or p_key ? 'let' then jsonb_build_object('__let',
      coalesce(p_key->'vars', '{}'::jsonb)
      || coalesce((select jsonb_object_agg(l->>'name', 'null'::jsonb) from jsonb_array_elements(case when jsonb_typeof(p_key->'let') = 'array' then p_key->'let' else '[]'::jsonb end) l
                   where coalesce(l->>'name', '') <> ''), '{}'::jsonb))
    else '{}'::jsonb
  end;
$$;

-- Checks a key's shape; raises with a plain message if it can't be used.
create or replace function public.prove_validate_key(p_key jsonb)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_comp jsonb;
  v_part jsonb;
  v_crit jsonb;
  v_let jsonb;
  v_ids text[] := '{}';
  v_names text[] := '{}';
  v_total integer := 0;
  v_parts_total integer;
  v_lit text;
  v_expected integer;
  v_probe jsonb := public.prove_key_probe(p_key);
  v_key_literals text[] := public.prove_json_strings(p_key->'vars');
begin
  if coalesce((p_key->>'format')::int, 0) <> 1 then
    raise exception 'The key must say "format": 1.';
  end if;
  if jsonb_typeof(p_key->'competencies') <> 'array' or jsonb_array_length(p_key->'competencies') = 0 then
    raise exception 'The key has no competencies.';
  end if;
  if p_key ? 'vars' and jsonb_typeof(p_key->'vars') <> 'object' then
    raise exception 'The key''s vars must be an object.';
  end if;
  if p_key ? 'let' then
    if jsonb_typeof(p_key->'let') <> 'array' then
      raise exception 'The key''s let must be an array.';
    end if;
    for v_let in select value from jsonb_array_elements(p_key->'let') loop
      if coalesce(v_let->>'name', '') !~ '^[A-Za-z_][A-Za-z0-9_]*$' or (v_let->>'name') = any(v_names) or (p_key->'vars') ? (v_let->>'name') then
        raise exception 'Each let needs its own name (letters, digits, _), not one of the vars.';
      end if;
      v_names := v_names || (v_let->>'name');
      if coalesce(v_let->>'path', '') = '' then
        raise exception 'Let % needs a path.', v_let->>'name';
      end if;
      if coalesce(v_let->>'mode', 'first') not in ('first', 'array', 'count', 'exists', 'min', 'max', 'last') then
        raise exception 'Let % has an unknown mode.', v_let->>'name';
      end if;
      perform public.prove_let_value('{}'::jsonb, v_let, v_probe->'__let');
    end loop;
  end if;
  v_expected := coalesce((p_key->>'total_points')::int, 100);
  if v_expected < 100 then
    raise exception 'total_points can''t be below 100.';
  end if;
  for v_comp in select value from jsonb_array_elements(p_key->'competencies') loop
    if coalesce(v_comp->>'id', '') = '' or (v_comp->>'id') = any(v_ids) then
      raise exception 'Each competency needs its own id.';
    end if;
    v_ids := v_ids || (v_comp->>'id');
    if jsonb_typeof(v_comp->'points') <> 'number' or (v_comp->>'points')::numeric <= 0 or (v_comp->>'points')::numeric <> trunc((v_comp->>'points')::numeric) then
      raise exception 'Competency % needs whole, positive points.', v_comp->>'id';
    end if;
    if coalesce(v_comp->>'deductions', 'clamp') not in ('clamp', 'after_cap') then
      raise exception 'Competency %: deductions is clamp or after_cap.', v_comp->>'id';
    end if;
    v_total := v_total + (v_comp->>'points')::int;
    if coalesce((v_comp->>'judgment')::boolean, false) then
      if jsonb_typeof(v_comp->'parts') <> 'array' or jsonb_array_length(v_comp->'parts') = 0 then
        raise exception 'Judgment competency % needs parts.', v_comp->>'id';
      end if;
      v_parts_total := 0;
      for v_part in select value from jsonb_array_elements(v_comp->'parts') loop
        if coalesce(v_part->>'id', '') = '' or coalesce(v_part->>'label', '') = '' or jsonb_typeof(v_part->'points') <> 'number' then
          raise exception 'Each part of % needs an id, a label and points.', v_comp->>'id';
        end if;
        v_parts_total := v_parts_total + (v_part->>'points')::int;
        for v_crit in select value from jsonb_array_elements(coalesce(v_part->'criteria', '[]'::jsonb)) loop
          perform public.prove_validate_criterion(v_crit, v_comp->>'id', v_probe);
          foreach v_lit in array v_key_literals loop
            if coalesce(v_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
              raise exception 'Criterion % of %: the student feedback names a key value (%).', v_crit->>'id', v_comp->>'id', v_lit;
            end if;
          end loop;
        end loop;
      end loop;
      if v_parts_total <> (v_comp->>'points')::int then
        raise exception 'The parts of % must add up to its points.', v_comp->>'id';
      end if;
    else
      for v_crit in select value from jsonb_array_elements(coalesce(v_comp->'criteria', '[]'::jsonb)) loop
        perform public.prove_validate_criterion(v_crit, v_comp->>'id', v_probe);
        foreach v_lit in array v_key_literals loop
          if coalesce(v_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
            raise exception 'Criterion % of %: the student feedback names a key value (%).', v_crit->>'id', v_comp->>'id', v_lit;
          end if;
        end loop;
      end loop;
    end if;
  end loop;
  if v_total <> v_expected then
    raise exception 'The competencies must total % points, not %.', v_expected, v_total;
  end if;
  for v_crit in select value from jsonb_array_elements(coalesce(p_key->'critical', '[]'::jsonb)) loop
    if coalesce(v_crit->>'id', '') = '' or jsonb_typeof(v_crit->'check') <> 'object' or coalesce(btrim(v_crit->>'reason'), '') = '' then
      raise exception 'Each critical rule needs an id, a check and a reason.';
    end if;
    if coalesce(v_crit->>'effect', 'zero') not in ('zero', 'cap', 'flag') then
      raise exception 'Critical rule %: effect is zero, cap or flag.', v_crit->>'id';
    end if;
    if coalesce(v_crit->>'effect', 'zero') = 'cap' and (jsonb_typeof(v_crit->'cap') is distinct from 'number'
       or (v_crit->>'cap')::numeric <> trunc((v_crit->>'cap')::numeric) or (v_crit->>'cap')::int < 0 or (v_crit->>'cap')::int > 99) then
      raise exception 'Critical rule %: a cap needs whole points from 0 to 99.', v_crit->>'id';
    end if;
    -- reason: staff only. feedback (optional): pre-filled for the student, and
    -- like every student line, never naming what the rule looks for.
    foreach v_lit in array public.prove_check_literals(v_crit->'check') || v_key_literals loop
      if coalesce(v_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
        raise exception 'Critical rule %: the student feedback names what it looks for (%).', v_crit->>'id', v_lit;
      end if;
    end loop;
    perform public.prove_check(v_probe, v_crit->'check');
  end loop;
end;
$$;

create or replace function public.prove_validate_criterion(p_crit jsonb, p_competency text, p_probe jsonb)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_lit text;
  v_points integer;
begin
  if coalesce(p_crit->>'id', '') = '' or jsonb_typeof(p_crit->'check') <> 'object' or jsonb_typeof(p_crit->'points') <> 'number'
     or (p_crit->>'points')::numeric <> trunc((p_crit->>'points')::numeric) then
    raise exception 'A criterion of % needs an id, a check and whole points.', p_competency;
  end if;
  v_points := (p_crit->>'points')::int;
  -- A negative criterion is a deduction: its points apply when the check is met.
  if v_points < 0 and (p_crit ? 'partial' or p_crit ? 'credit') then
    raise exception 'Criterion % of %: a deduction has no partial or proportional credit.', p_crit->>'id', p_competency;
  end if;
  if p_crit ? 'partial' then
    if jsonb_typeof(p_crit->'partial'->'points') <> 'number' or (p_crit->'partial'->>'points')::int >= v_points
       or (p_crit->'partial'->>'points')::int < 0 then
      raise exception 'Criterion % of %: partial points must be below full points, with min of 1 or more.', p_crit->>'id', p_competency;
    end if;
    if p_crit->'partial' ? 'check' then
      if jsonb_typeof(p_crit->'partial'->'check') <> 'object' then
        raise exception 'Criterion % of %: a partial check must be a check.', p_crit->>'id', p_competency;
      end if;
      perform public.prove_check(p_probe, p_crit->'partial'->'check');
    elsif coalesce((p_crit->'partial'->>'min')::int, 0) < 1 then
      raise exception 'Criterion % of %: partial points must be below full points, with min of 1 or more.', p_crit->>'id', p_competency;
    end if;
  end if;
  if p_crit ? 'credit' and (p_crit->>'credit' <> 'proportional' or p_crit ? 'partial' or v_points <= 0) then
    raise exception 'Criterion % of %: credit is proportional, on positive points, without partial.', p_crit->>'id', p_competency;
  end if;
  if v_points > 0 and coalesce(btrim(p_crit->>'feedback'), '') = '' then
    raise exception 'Criterion % of % needs a student feedback line.', p_crit->>'id', p_competency;
  end if;
  -- A student line never names what the criterion expects.
  foreach v_lit in array public.prove_check_literals(p_crit->'check') || public.prove_check_literals(coalesce(p_crit->'partial'->'check', '{}'::jsonb)) loop
    if coalesce(p_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
      raise exception 'Criterion % of %: the student feedback names what it expects (%).', p_crit->>'id', p_competency, v_lit;
    end if;
  end loop;
  perform public.prove_check(p_probe, p_crit->'check');
end;
$$;

-- The original two-argument form, for any caller that still uses it.
create or replace function public.prove_validate_criterion(p_crit jsonb, p_competency text)
returns void
language sql
stable
set search_path = public
as $$
  select public.prove_validate_criterion(p_crit, p_competency, '{}'::jsonb);
$$;

-- One criterion: { id, points, earned, met, reason, student_feedback }.
create or replace function public.prove_score_criterion(p_work jsonb, p_crit jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_res jsonb := public.prove_check(p_work, p_crit->'check');
  v_points integer := (p_crit->>'points')::int;
  v_earned integer;
  v_met text;
  v_reason text;
  v_feedback text;
begin
  if (v_res->>'met')::boolean then
    v_earned := v_points; v_met := 'met';
  elsif p_crit->>'credit' = 'proportional' then
    -- Rounded half up, as the browser's Math.round on these positive values.
    v_earned := round(v_points * least(1::numeric, (v_res->>'met_count')::numeric / nullif((v_res->>'total')::numeric, 0)));
    v_earned := least(v_points, greatest(0, coalesce(v_earned, 0)));
    v_met := case when v_earned > 0 then 'partial' else 'missing' end;
  elsif p_crit ? 'partial' and p_crit->'partial' ? 'check' then
    if (public.prove_check(p_work, p_crit->'partial'->'check')->>'met')::boolean then
      v_earned := (p_crit->'partial'->>'points')::int; v_met := 'partial';
    else
      v_earned := 0; v_met := 'missing';
    end if;
  elsif p_crit ? 'partial' and (v_res->>'met_count')::int >= (p_crit->'partial'->>'min')::int then
    v_earned := (p_crit->'partial'->>'points')::int; v_met := 'partial';
  else
    v_earned := 0; v_met := 'missing';
  end if;
  v_reason := case when v_met = 'met' then coalesce(p_crit->>'met', 'Met.') else coalesce(p_crit->>'missing', 'Not met.') end;
  v_reason := replace(replace(v_reason, '{found}', coalesce(v_res->>'found', '')), '{missing}', coalesce(v_res->>'missing', ''));
  -- A deduction's student line is shown when it applies; otherwise the line
  -- for a miss, or the optional positive line for full points.
  v_feedback := case
    when v_points < 0 then case when v_met = 'met' then nullif(btrim(p_crit->>'feedback'), '') end
    when v_met = 'met' then nullif(btrim(p_crit->>'feedback_met'), '')
    else nullif(btrim(p_crit->>'feedback'), '') end;
  return jsonb_build_object('id', p_crit->>'id', 'points', v_points, 'earned', v_earned, 'met', v_met, 'reason', v_reason,
    'student_feedback', v_feedback);
end;
$$;

-- A competency's or part's earned points from its criteria: never below 0 or
-- above its points. "after_cap": the awards are capped first, then the
-- deductions taken (the SOC browser scorers' order).
create or replace function public.prove_sum_earned(p_criteria jsonb, p_points integer, p_mode text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case when coalesce(p_mode, 'clamp') = 'after_cap'
    then greatest(0, least(coalesce(sum(greatest((c->>'earned')::int, 0)), 0)::int, p_points) + coalesce(sum(least((c->>'earned')::int, 0)), 0)::int)
    else greatest(0, least(coalesce(sum((c->>'earned')::int), 0)::int, p_points))
  end
  from jsonb_array_elements(coalesce(p_criteria, '[]'::jsonb)) c;
$$;

-- Scores a work package against a key. Pure: reads nothing but its arguments
-- and the pass mark. Raises when the key can't be used.
create or replace function public.prove_score(p_work jsonb, p_key jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_comp jsonb;
  v_part jsonb;
  v_crit jsonb;
  v_let jsonb;
  v_scored jsonb;
  v_criteria jsonb;
  v_parts jsonb;
  v_part_criteria jsonb;
  v_part_earned integer;
  v_earned integer;
  v_points integer;
  v_comps jsonb := '[]'::jsonb;
  v_auto_points integer := 0;
  v_auto_earned integer := 0;
  v_writing_points integer := 0;
  v_writing_suggested integer := 0;
  v_critical jsonb := '[]'::jsonb;
  v_noted jsonb := '[]'::jsonb;
  v_entry jsonb;
  v_effect text;
  v_cap integer;
  v_total integer;
  v_feedback text;
  v_judgment boolean;
  v_vars jsonb;
begin
  perform public.prove_validate_key(p_key);
  -- The work is the student's; __let is the engine's. A work package that
  -- isn't an object holds nothing a check can read.
  p_work := case when jsonb_typeof(p_work) = 'object' then p_work - '__let' else '{}'::jsonb end;
  if p_key ? 'vars' or p_key ? 'let' then
    v_vars := coalesce(p_key->'vars', '{}'::jsonb);
    for v_let in select value from jsonb_array_elements(coalesce(p_key->'let', '[]'::jsonb)) loop
      v_vars := v_vars || jsonb_build_object(v_let->>'name', coalesce(public.prove_let_value(p_work, v_let, v_vars), 'null'::jsonb));
    end loop;
    p_work := p_work || jsonb_build_object('__let', v_vars);
  end if;
  for v_comp in select value from jsonb_array_elements(p_key->'competencies') loop
    v_points := (v_comp->>'points')::int;
    v_judgment := coalesce((v_comp->>'judgment')::boolean, false);
    v_parts := '[]'::jsonb;
    v_criteria := '[]'::jsonb;
    if v_judgment then
      v_earned := 0;
      for v_part in select value from jsonb_array_elements(v_comp->'parts') loop
        v_part_criteria := '[]'::jsonb;
        for v_crit in select value from jsonb_array_elements(coalesce(v_part->'criteria', '[]'::jsonb)) loop
          v_scored := public.prove_score_criterion(p_work, v_crit);
          v_part_criteria := v_part_criteria || v_scored;
        end loop;
        v_part_earned := public.prove_sum_earned(v_part_criteria, (v_part->>'points')::int, v_comp->>'deductions');
        v_earned := v_earned + v_part_earned;
        v_criteria := v_criteria || v_part_criteria;
        v_parts := v_parts || jsonb_build_object('id', v_part->>'id', 'label', v_part->>'label', 'points', (v_part->>'points')::int,
          'suggested', v_part_earned, 'criteria', v_part_criteria);
      end loop;
      v_earned := least(v_earned, v_points);
      v_writing_points := v_writing_points + v_points;
      v_writing_suggested := v_writing_suggested + v_earned;
    else
      for v_crit in select value from jsonb_array_elements(coalesce(v_comp->'criteria', '[]'::jsonb)) loop
        v_scored := public.prove_score_criterion(p_work, v_crit);
        v_criteria := v_criteria || v_scored;
      end loop;
      v_earned := public.prove_sum_earned(v_criteria, v_points, v_comp->>'deductions');
      v_auto_points := v_auto_points + v_points;
      v_auto_earned := v_auto_earned + v_earned;
    end if;
    select string_agg(c->>'student_feedback', ' ') into v_feedback from jsonb_array_elements(v_criteria) c where c->>'student_feedback' is not null;
    v_comps := v_comps || jsonb_build_object(
      'id', v_comp->>'id', 'label', coalesce(v_comp->>'label', v_comp->>'id'), 'points', v_points, 'judgment', v_judgment,
      'earned', case when v_judgment then null else v_earned end,
      'suggested', case when v_judgment then v_earned else null end,
      'criteria', v_criteria, 'parts', v_parts, 'student_feedback', v_feedback);
  end loop;
  for v_crit in select value from jsonb_array_elements(coalesce(p_key->'critical', '[]'::jsonb)) loop
    if (public.prove_check(p_work, v_crit->'check')->>'met')::boolean then
      v_effect := coalesce(v_crit->>'effect', 'zero');
      v_entry := jsonb_build_object('id', v_crit->>'id', 'reason', v_crit->>'reason', 'feedback', nullif(btrim(v_crit->>'feedback'), ''));
      if v_crit ? 'effect' then
        v_entry := v_entry || jsonb_build_object('effect', v_effect) || case when v_effect = 'cap' then jsonb_build_object('cap', (v_crit->>'cap')::int) else '{}'::jsonb end;
      end if;
      if v_effect = 'zero' then
        v_critical := v_critical || v_entry;
      else
        v_noted := v_noted || v_entry;
        if v_effect = 'cap' then
          v_cap := least(coalesce(v_cap, 100), (v_crit->>'cap')::int);
        end if;
      end if;
    end if;
  end loop;
  -- A critical error is an automatic zero: every competency, part and total
  -- is recommended as 0. What the criteria found is kept for staff
  -- (earned_before_critical / suggested_before_critical), with every reason.
  -- The student lines keep only coaching: a "met" (positive) line never sits
  -- beside a critical error.
  if jsonb_array_length(v_critical) > 0 then
    select coalesce(jsonb_agg(
      c || jsonb_build_object(
        'student_feedback', (select string_agg(cr->>'student_feedback', ' ' order by k)
                             from jsonb_array_elements(c->'criteria') with ordinality as z(cr, k)
                             where cr->>'met' is distinct from 'met' and cr->>'student_feedback' is not null),
        'earned', case when (c->>'judgment')::boolean then null else 0 end,
        'suggested', case when (c->>'judgment')::boolean then 0 else null end,
        'earned_before_critical', c->'earned',
        'suggested_before_critical', c->'suggested',
        'parts', coalesce((select jsonb_agg(p || jsonb_build_object('suggested', 0, 'suggested_before_critical', p->'suggested') order by n)
                           from jsonb_array_elements(c->'parts') with ordinality as x(p, n)), '[]'::jsonb))
      order by i), '[]'::jsonb)
    into v_comps
    from jsonb_array_elements(v_comps) with ordinality as y(c, i);
    return jsonb_build_object(
      'competencies', v_comps,
      'automatic_points', v_auto_points, 'automatic_earned', 0,
      'writing_points', v_writing_points, 'writing_suggested', 0,
      'automatic_earned_before_critical', v_auto_earned,
      'writing_suggested_before_critical', v_writing_suggested,
      'recommended_total', 0,
      'critical_error', true,
      'critical_reasons', v_critical || v_noted,
      'recommended_score', 0);
  end if;
  -- The total never passes 100 (a key may total more); a cap rule that fired
  -- caps the recommended score, and the uncapped total is kept beside it.
  v_total := least(v_auto_earned + v_writing_suggested, 100);
  return jsonb_build_object(
    'competencies', v_comps,
    'automatic_points', v_auto_points, 'automatic_earned', v_auto_earned,
    'writing_points', v_writing_points, 'writing_suggested', v_writing_suggested,
    'recommended_total', v_total,
    'critical_error', false,
    'critical_reasons', v_noted,
    'recommended_score', least(v_total, coalesce(v_cap, 100)));
end;
$$;

-- The engine's helpers are not part of the API.
revoke all on function public.prove_attempt_scorable(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.prove_path(jsonb) from public, anon, authenticated;
revoke all on function public.prove_json_strings(jsonb) from public, anon, authenticated;
revoke all on function public.prove_work_text(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_js_length(text) from public, anon, authenticated;
revoke all on function public.prove_let_value(jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_key_probe(jsonb) from public, anon, authenticated;
revoke all on function public.prove_sum_earned(jsonb, integer, text) from public, anon, authenticated;
revoke all on function public.prove_check(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_check_literals(jsonb) from public, anon, authenticated;
revoke all on function public.prove_check_literals_nested(jsonb) from public, anon, authenticated;
revoke all on function public.prove_validate_key(jsonb) from public, anon, authenticated;
revoke all on function public.prove_validate_criterion(jsonb, text) from public, anon, authenticated;
revoke all on function public.prove_validate_criterion(jsonb, text, jsonb) from public, anon, authenticated;
revoke all on function public.prove_score_criterion(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_score(jsonb, jsonb) from public, anon, authenticated;

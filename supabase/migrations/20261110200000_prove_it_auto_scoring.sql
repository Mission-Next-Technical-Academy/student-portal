-- Automatic scoring for Prove Its graded by faculty (official-grade labs whose
-- work package is kind 'hdesk-prove'; first: Help Desk Module 1's Prove It).
--
-- When a student submits, a trigger scores the saved work against the lab's
-- answer key and stores a recommendation that only staff can read. The
-- instructor sees it pre-filled on the grading card and decides as before
-- through record_lab_grade(); the pass mark (lab_pass_mark()) and "below the
-- pass mark is returned" are unchanged. A critical error is now an automatic
-- zero (it was a cap at the pass mark minus 1): the recommendation and the
-- saved grade score 0, every competency 0, and the attempt is returned.
-- Students never see the system's numbers: before a decision
-- nothing they can read holds a score, and after it they see only the
-- instructor's grade and notes.
--
--   1. assessment_answer_keys: the keys. Loaded by hand in the SQL editor;
--      no API role can read or write them.
--   2. lab_attempt_recommendations: one per attempt, staff read only.
--   3. lab_attempt_grade_reviews: per decision, what was recommended, what
--      the instructor changed and their reading of the writing; staff only.
--   4. The engine: prove_* functions, generic and driven by the key.
--   5. Scoring at submit (trigger) and the staff rescore.
--   6. record_lab_grade() takes the recommendation it was decided from.
--
-- No key is created here: the repository is public.

-- ------------------------------------------------------------ 1. keys
create table if not exists public.assessment_answer_keys (
  id uuid primary key default gen_random_uuid(),
  track_code text not null,
  lab_key text not null,
  rubric_version text not null,
  revision integer not null check (revision > 0),
  key jsonb not null check (jsonb_typeof(key) = 'object'),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (track_code, lab_key, rubric_version, revision)
);

create unique index if not exists assessment_answer_keys_one_active
  on public.assessment_answer_keys (track_code, lab_key) where is_active;

comment on table public.assessment_answer_keys is
  'Answer keys for automatic Prove It scoring, by lab and rubric version, with a revision number. Loaded by hand; no API role can read them (RLS on, no policies). Read only by the scoring functions.';

-- A key loaded without a revision gets the next one for its lab and rubric version.
create or replace function public.assessment_answer_key_revision()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.revision is null then
    select coalesce(max(k.revision), 0) + 1 into new.revision
    from public.assessment_answer_keys k
    where k.track_code = new.track_code and k.lab_key = new.lab_key and k.rubric_version = new.rubric_version;
  end if;
  return new;
end;
$$;

drop trigger if exists assessment_answer_keys_revision on public.assessment_answer_keys;
create trigger assessment_answer_keys_revision
  before insert on public.assessment_answer_keys
  for each row execute function public.assessment_answer_key_revision();

alter table public.assessment_answer_keys enable row level security;
revoke all on public.assessment_answer_keys from public, anon, authenticated;

-- ------------------------------------------------------------ 2. recommendations
create table if not exists public.lab_attempt_recommendations (
  id uuid primary key default gen_random_uuid(),
  lab_attempt_id uuid not null unique references public.lab_attempts(id) on delete cascade,
  track_code text not null,
  lab_key text not null,
  status text not null check (status in ('scored', 'no_key', 'version_mismatch', 'error')),
  rubric_version text,
  answer_key_id uuid references public.assessment_answer_keys(id) on delete set null,
  key_rubric_version text,
  key_revision integer,
  answer_key_loaded_at timestamptz,
  engine_version text not null,
  automatic_points integer,
  automatic_earned integer,
  writing_points integer,
  writing_suggested integer,
  recommended_total integer,
  recommended_score integer,
  critical_error boolean not null default false,
  critical_reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(critical_reasons) = 'array'),
  competencies jsonb not null default '[]'::jsonb check (jsonb_typeof(competencies) = 'array'),
  error text,
  scored_on text not null check (scored_on in ('submit', 'rescore')),
  rescored_by uuid references auth.users(id),
  rescored_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.lab_attempt_recommendations is
  'The system''s scoring of an attempt (a recommendation; faculty decide). Staff read only: students never read the system''s points or reasons. Written only by score_lab_attempt().';

alter table public.lab_attempt_recommendations enable row level security;
revoke all on public.lab_attempt_recommendations from public, anon, authenticated;
grant select on public.lab_attempt_recommendations to authenticated;

drop policy if exists lab_attempt_recommendations_staff_read on public.lab_attempt_recommendations;
create policy lab_attempt_recommendations_staff_read on public.lab_attempt_recommendations
  for select to authenticated
  using (public.is_admin() or public.can_manage_course_messages(track_code));

-- ------------------------------------------------------------ 3. decision reviews
create table if not exists public.lab_attempt_grade_reviews (
  grade_id uuid primary key references public.lab_attempt_grades(id) on delete cascade,
  lab_attempt_id uuid not null references public.lab_attempts(id) on delete cascade,
  track_code text not null,
  recommendation_id uuid references public.lab_attempt_recommendations(id) on delete set null,
  recommended_automatic integer,
  recommended_writing integer,
  recommended_score integer,
  recommended_critical boolean,
  final_score integer,
  changed jsonb not null default '[]'::jsonb check (jsonb_typeof(changed) = 'array'),
  writing_parts jsonb not null default '[]'::jsonb check (jsonb_typeof(writing_parts) = 'array'),
  writing_acknowledged_by uuid references auth.users(id),
  writing_acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.lab_attempt_grade_reviews is
  'Per faculty decision made from a recommendation: what the system recommended, which competencies the instructor changed and their acknowledgement of the writing. Staff read only. Written only by record_lab_grade().';

alter table public.lab_attempt_grade_reviews enable row level security;
revoke all on public.lab_attempt_grade_reviews from public, anon, authenticated;
grant select on public.lab_attempt_grade_reviews to authenticated;

drop policy if exists lab_attempt_grade_reviews_staff_read on public.lab_attempt_grade_reviews;
create policy lab_attempt_grade_reviews_staff_read on public.lab_attempt_grade_reviews
  for select to authenticated
  using (public.is_admin() or public.can_manage_course_messages(track_code));

-- ------------------------------------------------------------ 4. the engine
-- Every check reads only the student's saved work (choices, step ids,
-- recorded events, writing) and the key. Patterns are PostgreSQL regular
-- expressions, case-insensitive unless the check says "case": true.

-- The first match of p_pattern in p_text, or null.
create or replace function public.prove_match(p_text text, p_pattern text, p_case boolean default false)
returns text
language sql
immutable
set search_path = public
as $$
  select (regexp_match(left(coalesce(p_text, ''), 8000), '(' || p_pattern || ')', case when p_case then '' else 'i' end))[1];
$$;

-- A literal as a regular expression.
create or replace function public.prove_regex_escape(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(coalesce(p_text, ''), '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g');
$$;

-- The note checker (the simulator's hdNoteMissingParts, ui/helpdesk.js): the
-- text is split at "Label:" headers for the given parts; a part is there when
-- what follows its header(s) has at least 8 non-space characters. Returns the
-- labels of the parts that are missing.
create or replace function public.prove_note_missing(p_text text, p_parts text[])
returns text[]
language plpgsql
immutable
set search_path = public
as $$
declare
  v_labels constant jsonb := '{"reported":"Reported","tried":"Tried","checked":"Checked","done":"Done","result":"Result","next":"Next action"}';
  v_keys text[] := array(select k from unnest(p_parts) k where v_labels ? k);
  v_alt text;
  v_text text := left(coalesce(p_text, ''), 8000);
  v_headers text[];
  v_pieces text[];
  v_found jsonb := '{}'::jsonb;
  v_key text;
  i integer;
begin
  if coalesce(array_length(v_keys, 1), 0) = 0 then
    return '{}';
  end if;
  v_alt := (select string_agg(replace(v_labels->>k, ' ', '\s+'), '|') from unnest(v_keys) k);
  v_headers := array(select lower(regexp_replace(m[1], '\s+', ' ', 'g')) from regexp_matches(v_text, '\m(' || v_alt || ')\s*:', 'gi') m);
  v_pieces := regexp_split_to_array(v_text, '\m(?:' || v_alt || ')\s*:', 'i');
  for i in 1 .. coalesce(array_length(v_headers, 1), 0) loop
    select k into v_key from unnest(v_keys) k where lower(v_labels->>k) = v_headers[i] limit 1;
    if v_key is not null then
      v_found := jsonb_set(v_found, array[v_key], to_jsonb(coalesce(v_found->>v_key, '') || coalesce(v_pieces[i + 1], '')));
    end if;
  end loop;
  return array(
    select v_labels->>k from unnest(v_keys) k
    where length(regexp_replace(coalesce(v_found->>k, ''), '\s', '', 'g')) < 8
  );
end;
$$;

-- One check against the work: { met, met_count, total, found, missing }.
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
    union all select p_check->>'value'
    union all select unnest(public.prove_check_literals_nested(p_check))
  ) s;
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
  v_ids text[] := '{}';
  v_total integer := 0;
  v_parts_total integer;
  v_lit text;
  v_criteria jsonb;
begin
  if coalesce((p_key->>'format')::int, 0) <> 1 then
    raise exception 'The key must say "format": 1.';
  end if;
  if jsonb_typeof(p_key->'competencies') <> 'array' or jsonb_array_length(p_key->'competencies') = 0 then
    raise exception 'The key has no competencies.';
  end if;
  for v_comp in select value from jsonb_array_elements(p_key->'competencies') loop
    if coalesce(v_comp->>'id', '') = '' or (v_comp->>'id') = any(v_ids) then
      raise exception 'Each competency needs its own id.';
    end if;
    v_ids := v_ids || (v_comp->>'id');
    if jsonb_typeof(v_comp->'points') <> 'number' or (v_comp->>'points')::numeric <= 0 or (v_comp->>'points')::numeric <> trunc((v_comp->>'points')::numeric) then
      raise exception 'Competency % needs whole, positive points.', v_comp->>'id';
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
          perform public.prove_validate_criterion(v_crit, v_comp->>'id');
        end loop;
      end loop;
      if v_parts_total <> (v_comp->>'points')::int then
        raise exception 'The parts of % must add up to its points.', v_comp->>'id';
      end if;
    else
      for v_crit in select value from jsonb_array_elements(coalesce(v_comp->'criteria', '[]'::jsonb)) loop
        perform public.prove_validate_criterion(v_crit, v_comp->>'id');
      end loop;
    end if;
  end loop;
  if v_total <> 100 then
    raise exception 'The competencies must total 100 points, not %.', v_total;
  end if;
  for v_crit in select value from jsonb_array_elements(coalesce(p_key->'critical', '[]'::jsonb)) loop
    if coalesce(v_crit->>'id', '') = '' or jsonb_typeof(v_crit->'check') <> 'object' or coalesce(btrim(v_crit->>'reason'), '') = '' then
      raise exception 'Each critical rule needs an id, a check and a reason.';
    end if;
    -- reason: staff only. feedback (optional): pre-filled for the student, and
    -- like every student line, never naming what the rule looks for.
    foreach v_lit in array public.prove_check_literals(v_crit->'check') loop
      if coalesce(v_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
        raise exception 'Critical rule %: the student feedback names what it looks for (%).', v_crit->>'id', v_lit;
      end if;
    end loop;
    perform public.prove_check('{}'::jsonb, v_crit->'check');
  end loop;
end;
$$;

create or replace function public.prove_validate_criterion(p_crit jsonb, p_competency text)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  v_lit text;
begin
  if coalesce(p_crit->>'id', '') = '' or jsonb_typeof(p_crit->'check') <> 'object' or jsonb_typeof(p_crit->'points') <> 'number'
     or (p_crit->>'points')::numeric < 0 or (p_crit->>'points')::numeric <> trunc((p_crit->>'points')::numeric) then
    raise exception 'A criterion of % needs an id, a check and whole points.', p_competency;
  end if;
  if p_crit ? 'partial' and (
       jsonb_typeof(p_crit->'partial'->'points') <> 'number' or (p_crit->'partial'->>'points')::int >= (p_crit->>'points')::int
       or coalesce((p_crit->'partial'->>'min')::int, 0) < 1) then
    raise exception 'Criterion % of %: partial points must be below full points, with min of 1 or more.', p_crit->>'id', p_competency;
  end if;
  if (p_crit->>'points')::int > 0 and coalesce(btrim(p_crit->>'feedback'), '') = '' then
    raise exception 'Criterion % of % needs a student feedback line.', p_crit->>'id', p_competency;
  end if;
  -- A student line never names what the criterion expects.
  foreach v_lit in array public.prove_check_literals(p_crit->'check') loop
    if coalesce(p_crit->>'feedback', '') ~* ('\m' || public.prove_regex_escape(v_lit) || '\M') then
      raise exception 'Criterion % of %: the student feedback names what it expects (%).', p_crit->>'id', p_competency, v_lit;
    end if;
  end loop;
  perform public.prove_check('{}'::jsonb, p_crit->'check');
end;
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
begin
  if (v_res->>'met')::boolean then
    v_earned := v_points; v_met := 'met';
  elsif p_crit ? 'partial' and (v_res->>'met_count')::int >= (p_crit->'partial'->>'min')::int then
    v_earned := (p_crit->'partial'->>'points')::int; v_met := 'partial';
  else
    v_earned := 0; v_met := 'missing';
  end if;
  v_reason := case when v_met = 'met' then coalesce(p_crit->>'met', 'Met.') else coalesce(p_crit->>'missing', 'Not met.') end;
  v_reason := replace(replace(v_reason, '{found}', coalesce(v_res->>'found', '')), '{missing}', coalesce(v_res->>'missing', ''));
  return jsonb_build_object('id', p_crit->>'id', 'points', v_points, 'earned', v_earned, 'met', v_met, 'reason', v_reason,
    'student_feedback', case when v_met = 'met' then nullif(btrim(p_crit->>'feedback_met'), '') else nullif(btrim(p_crit->>'feedback'), '') end);
end;
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
  v_total integer;
  v_feedback text;
  v_judgment boolean;
begin
  perform public.prove_validate_key(p_key);
  for v_comp in select value from jsonb_array_elements(p_key->'competencies') loop
    v_points := (v_comp->>'points')::int;
    v_judgment := coalesce((v_comp->>'judgment')::boolean, false);
    v_parts := '[]'::jsonb;
    v_criteria := '[]'::jsonb;
    if v_judgment then
      v_earned := 0;
      for v_part in select value from jsonb_array_elements(v_comp->'parts') loop
        v_part_criteria := '[]'::jsonb;
        v_part_earned := 0;
        for v_crit in select value from jsonb_array_elements(coalesce(v_part->'criteria', '[]'::jsonb)) loop
          v_scored := public.prove_score_criterion(p_work, v_crit);
          v_part_criteria := v_part_criteria || v_scored;
          v_part_earned := v_part_earned + (v_scored->>'earned')::int;
        end loop;
        v_part_earned := least(v_part_earned, (v_part->>'points')::int);
        v_earned := v_earned + v_part_earned;
        v_criteria := v_criteria || v_part_criteria;
        v_parts := v_parts || jsonb_build_object('id', v_part->>'id', 'label', v_part->>'label', 'points', (v_part->>'points')::int,
          'suggested', v_part_earned, 'criteria', v_part_criteria);
      end loop;
      v_earned := least(v_earned, v_points);
      v_writing_points := v_writing_points + v_points;
      v_writing_suggested := v_writing_suggested + v_earned;
    else
      v_earned := 0;
      for v_crit in select value from jsonb_array_elements(coalesce(v_comp->'criteria', '[]'::jsonb)) loop
        v_scored := public.prove_score_criterion(p_work, v_crit);
        v_criteria := v_criteria || v_scored;
        v_earned := v_earned + (v_scored->>'earned')::int;
      end loop;
      v_earned := least(v_earned, v_points);
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
      v_critical := v_critical || jsonb_build_object('id', v_crit->>'id', 'reason', v_crit->>'reason', 'feedback', nullif(btrim(v_crit->>'feedback'), ''));
    end if;
  end loop;
  -- A critical error is an automatic zero: every competency, part and total
  -- is recommended as 0. What the criteria found is kept for staff
  -- (earned_before_critical / suggested_before_critical), with every reason.
  if jsonb_array_length(v_critical) > 0 then
    select coalesce(jsonb_agg(
      c || jsonb_build_object(
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
      'critical_reasons', v_critical,
      'recommended_score', 0);
  end if;
  v_total := v_auto_earned + v_writing_suggested;
  return jsonb_build_object(
    'competencies', v_comps,
    'automatic_points', v_auto_points, 'automatic_earned', v_auto_earned,
    'writing_points', v_writing_points, 'writing_suggested', v_writing_suggested,
    'recommended_total', v_total,
    'critical_error', false,
    'critical_reasons', v_critical,
    'recommended_score', v_total);
end;
$$;

-- ------------------------------------------------------------ 5. scoring an attempt
create or replace function public.score_lab_attempt(p_attempt_id uuid, p_scored_on text, p_actor uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.lab_attempts%rowtype;
  v_key public.assessment_answer_keys%rowtype;
  v_status text;
  v_result jsonb;
  v_error text;
begin
  select * into v_attempt from public.lab_attempts where id = p_attempt_id;
  if not found then
    return null;
  end if;
  select * into v_key from public.assessment_answer_keys k
  where k.track_code = v_attempt.track_code and k.lab_key = v_attempt.lab_key and k.is_active
  order by k.created_at desc limit 1;

  if v_key.id is null then
    v_status := 'no_key';
  elsif v_key.rubric_version is distinct from v_attempt.rubric_version then
    v_status := 'version_mismatch';
  else
    begin
      if coalesce(v_key.key->>'lab_key', v_key.lab_key) <> v_key.lab_key
         or coalesce(v_key.key->>'rubric_version', v_key.rubric_version) <> v_key.rubric_version then
        raise exception 'The key''s own lab or rubric version doesn''t match the row it''s stored in.';
      end if;
      v_result := public.prove_score(coalesce(v_attempt.result, '{}'::jsonb), v_key.key);
      v_status := 'scored';
    exception when others then
      v_status := 'error';
      v_error := left(sqlerrm, 500);
      v_result := null;
    end;
  end if;

  insert into public.lab_attempt_recommendations as r (
    lab_attempt_id, track_code, lab_key, status, rubric_version,
    answer_key_id, key_rubric_version, key_revision, answer_key_loaded_at, engine_version,
    automatic_points, automatic_earned, writing_points, writing_suggested,
    recommended_total, recommended_score, critical_error, critical_reasons, competencies,
    error, scored_on, rescored_by, rescored_at, created_at
  ) values (
    v_attempt.id, v_attempt.track_code, v_attempt.lab_key, v_status, v_attempt.rubric_version,
    v_key.id, v_key.rubric_version, v_key.revision, v_key.created_at, 'prove-engine-v1',
    (v_result->>'automatic_points')::int, (v_result->>'automatic_earned')::int,
    (v_result->>'writing_points')::int, (v_result->>'writing_suggested')::int,
    (v_result->>'recommended_total')::int, (v_result->>'recommended_score')::int,
    coalesce((v_result->>'critical_error')::boolean, false), coalesce(v_result->'critical_reasons', '[]'::jsonb),
    coalesce(v_result->'competencies', '[]'::jsonb),
    v_error, p_scored_on,
    case when p_scored_on = 'rescore' then p_actor end,
    case when p_scored_on = 'rescore' then now() end,
    now()
  )
  on conflict (lab_attempt_id) do update set
    status = excluded.status, rubric_version = excluded.rubric_version,
    answer_key_id = excluded.answer_key_id, key_rubric_version = excluded.key_rubric_version,
    key_revision = excluded.key_revision, answer_key_loaded_at = excluded.answer_key_loaded_at,
    engine_version = excluded.engine_version,
    automatic_points = excluded.automatic_points, automatic_earned = excluded.automatic_earned,
    writing_points = excluded.writing_points, writing_suggested = excluded.writing_suggested,
    recommended_total = excluded.recommended_total, recommended_score = excluded.recommended_score,
    critical_error = excluded.critical_error, critical_reasons = excluded.critical_reasons,
    competencies = excluded.competencies, error = excluded.error, scored_on = excluded.scored_on,
    rescored_by = excluded.rescored_by, rescored_at = excluded.rescored_at, created_at = excluded.created_at;
  return v_status;
end;
$$;

revoke all on function public.score_lab_attempt(uuid, text, uuid) from public, anon, authenticated;

-- At submit: a finished Prove It package on an official-grade lab is scored in
-- the same transaction. Nothing here can stop the submission from saving.
create or replace function public.score_lab_attempt_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_at is null or coalesce(new.result->>'kind', '') <> 'hdesk-prove' then
    return null;
  end if;
  if not exists (
    select 1 from public.course_module_labs r
    where r.track_code = new.track_code and r.lab_key = new.lab_key and r.requires_official_score
  ) then
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

drop trigger if exists lab_attempts_score_recommendation on public.lab_attempts;
create trigger lab_attempts_score_recommendation
  after insert on public.lab_attempts
  for each row execute function public.score_lab_attempt_on_insert();

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
  if v_attempt.completed_at is null or coalesce(v_attempt.result->>'kind', '') <> 'hdesk-prove'
     or not exists (select 1 from public.course_module_labs r where r.track_code = v_attempt.track_code and r.lab_key = v_attempt.lab_key and r.requires_official_score) then
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

-- The engine's helpers are not part of the API.
revoke all on function public.prove_match(text, text, boolean) from public, anon, authenticated;
revoke all on function public.prove_regex_escape(text) from public, anon, authenticated;
revoke all on function public.prove_note_missing(text, text[]) from public, anon, authenticated;
revoke all on function public.prove_check(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_check_literals(jsonb) from public, anon, authenticated;
revoke all on function public.prove_check_literals_nested(jsonb) from public, anon, authenticated;
revoke all on function public.prove_validate_key(jsonb) from public, anon, authenticated;
revoke all on function public.prove_validate_criterion(jsonb, text) from public, anon, authenticated;
revoke all on function public.prove_score_criterion(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.prove_score(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.assessment_answer_key_revision() from public, anon, authenticated;

-- ------------------------------------------------------------ 6. deciding from a recommendation
-- record_lab_grade() as in 20261030221555, plus three optional arguments. With
-- p_recommendation_id (a 'scored' recommendation of this attempt):
--   - a pre-filled competency the instructor changed needs its own reason (a
--     justification that isn't just the pre-filled student lines);
--   - the writing (judgment parts) must be read and acknowledged, with each
--     part entered by hand, adding up to its competency's score;
--   - a review row records what was recommended and what changed.
-- Without it, everything is as before, except that an attempt with a scored
-- recommendation can't get its first decision without it.
drop function if exists public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text);

create or replace function public.record_lab_grade(
  p_attempt_id uuid,
  p_decision text,
  p_competencies jsonb default '[]'::jsonb,
  p_critical_error boolean default false,
  p_critical_reason text default null,
  p_efficiency text default null,
  p_note text default null,
  p_correction_reason text default null,
  p_rubric_version text default null,
  p_recommendation_id uuid default null,
  p_writing_parts jsonb default null,
  p_writing_acknowledged boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_attempt public.lab_attempts%rowtype;
  v_flagged boolean;
  v_item jsonb;
  v_ids text[] := '{}';
  v_earned numeric;
  v_points numeric;
  v_sum_points integer := 0;
  v_total integer;
  v_score integer;
  v_critical boolean := coalesce(p_critical_error, false);
  v_critical_reason text := nullif(btrim(coalesce(p_critical_reason, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_efficiency text := nullif(btrim(coalesce(p_efficiency, '')), '');
  v_correction text := nullif(btrim(coalesce(p_correction_reason, '')), '');
  v_has_note boolean := false;
  v_grade_id uuid;
  v_rec public.lab_attempt_recommendations%rowtype;
  v_rec_comp jsonb;
  v_given jsonb;
  v_changed jsonb := '[]'::jsonb;
  v_parts jsonb := '[]'::jsonb;
  v_part jsonb;
  v_entered jsonb;
  v_part_sum integer;
  v_has_writing boolean := false;
begin
  if p_decision is null or p_decision not in ('approved', 'returned') then
    raise exception 'Choose Approve or Return.' using errcode = 'P0001', hint = 'bad_decision';
  end if;
  if p_competencies is null or jsonb_typeof(p_competencies) <> 'array' then
    raise exception 'The rubric scores could not be read.' using errcode = 'P0001', hint = 'bad_competencies';
  end if;

  -- Locked so two instructors deciding at once take turns.
  select * into v_attempt from public.lab_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'This attempt was not found.' using errcode = 'P0001', hint = 'not_found';
  end if;
  if v_caller is null or not (public.is_admin() or public.can_manage_course_messages(v_attempt.track_code)) then
    raise exception 'You do not grade this course.' using errcode = '42501', hint = 'not_course_staff';
  end if;
  if v_attempt.user_id = v_caller then
    raise exception 'A learner cannot review their own lab attempt.' using errcode = '42501', hint = 'own_attempt';
  end if;

  select coalesce(bool_or(r.requires_official_score), false) into v_flagged
  from public.course_module_labs r
  where r.track_code = v_attempt.track_code and r.lab_key = v_attempt.lab_key;
  if not v_flagged then
    raise exception 'This lab does not take an official grade yet.' using errcode = 'P0001', hint = 'not_official_lab';
  end if;

  if v_attempt.completed_at is null or v_attempt.superseded_at is not null
     or exists (
       select 1 from public.lab_attempts newer
       where newer.user_id = v_attempt.user_id
         and newer.lab_key = v_attempt.lab_key
         and newer.completed_at is not null
         and newer.superseded_at is null
         and (newer.completed_at, newer.id) > (v_attempt.completed_at, v_attempt.id)
     ) then
    raise exception 'Only the student''s newest attempt can be decided.' using errcode = 'P0001', hint = 'not_newest';
  end if;
  if v_attempt.reviewed_at is not null and v_correction is null then
    raise exception 'This attempt already has a decision. Say why you are correcting it.' using errcode = 'P0001', hint = 'correction_reason_required';
  end if;

  for v_item in select value from jsonb_array_elements(p_competencies) loop
    if jsonb_typeof(v_item) <> 'object'
       or length(btrim(coalesce(v_item->>'id', ''))) = 0
       or jsonb_typeof(v_item->'points') is distinct from 'number'
       or jsonb_typeof(v_item->'earned') is distinct from 'number' then
      raise exception 'Score every competency, or clear them all to return with no score.' using errcode = 'P0001', hint = 'incomplete_scores';
    end if;
    v_earned := (v_item->>'earned')::numeric;
    v_points := (v_item->>'points')::numeric;
    if v_earned <> trunc(v_earned) or v_points <> trunc(v_points) or v_points <= 0 or v_earned < 0 or v_earned > v_points then
      raise exception 'Each competency takes whole points from 0 to its maximum.' using errcode = 'P0001', hint = 'bad_points';
    end if;
    if (v_item->>'id') = any(v_ids) then
      raise exception 'A competency appears twice.' using errcode = 'P0001', hint = 'bad_competencies';
    end if;
    v_ids := v_ids || (v_item->>'id');
    v_sum_points := v_sum_points + v_points::integer;
    v_total := coalesce(v_total, 0) + v_earned::integer;
    if length(btrim(coalesce(v_item->>'justification', ''))) > 0 then
      v_has_note := true;
    elsif v_earned < v_points and not v_critical then
      raise exception 'Justify any competency below full points.' using errcode = 'P0001', hint = 'justification_required';
    end if;
  end loop;
  if v_total is not null and v_sum_points <> 100 then
    raise exception 'The rubric''s points must total 100.' using errcode = 'P0001', hint = 'bad_competencies';
  end if;

  if v_critical and v_critical_reason is null then
    raise exception 'Give the reason for the critical error.' using errcode = 'P0001', hint = 'critical_reason_required';
  end if;
  -- A critical error is an automatic zero, whatever was entered: the score
  -- and every competency are saved as 0 (a reason is required above). No
  -- scores entered and no critical error means no score.
  v_score := case
    when v_critical then 0
    else v_total
  end;
  if v_critical then
    v_total := 0;
    select coalesce(jsonb_agg(item || jsonb_build_object('earned', 0) order by n), '[]'::jsonb)
    into p_competencies
    from jsonb_array_elements(p_competencies) with ordinality as x(item, n);
  end if;

  if p_decision = 'approved' then
    if v_total is null then
      raise exception 'Score every competency before approving.' using errcode = 'P0001', hint = 'incomplete_scores';
    end if;
    if v_critical or v_score < public.lab_pass_mark() then
      raise exception 'An attempt below the pass mark or with a critical error is returned, never approved.' using errcode = 'P0001', hint = 'approve_below_pass';
    end if;
    if v_attempt.state <> 'complete' then
      raise exception 'This attempt was not saved as a finished submission. Return it.' using errcode = 'P0001', hint = 'not_complete_state';
    end if;
  elsif not (v_has_note or v_note is not null or v_critical_reason is not null) then
    raise exception 'Write at least one note so the student knows what to redo and why.' using errcode = 'P0001', hint = 'note_required';
  end if;

  -- An attempt the system scored is first decided from that recommendation, so
  -- the writing is always read and entered by hand. A correction of an earlier
  -- decision (reviewed_at set) doesn't need it.
  if p_recommendation_id is null and v_attempt.reviewed_at is null and exists (
    select 1 from public.lab_attempt_recommendations r where r.lab_attempt_id = v_attempt.id and r.status = 'scored'
  ) then
    raise exception 'This attempt has a system recommendation. Reload the grading card and decide from it.'
      using errcode = 'P0001', hint = 'recommendation_required';
  end if;

  -- Decided from the system's recommendation.
  if p_recommendation_id is not null then
    select * into v_rec from public.lab_attempt_recommendations
    where id = p_recommendation_id and lab_attempt_id = v_attempt.id and status = 'scored';
    if not found then
      raise exception 'That recommendation isn''t this attempt''s.' using errcode = 'P0001', hint = 'recommendation_mismatch';
    end if;
    if v_total is null then
      raise exception 'Score every competency when deciding from a recommendation.' using errcode = 'P0001', hint = 'incomplete_scores';
    end if;
    for v_rec_comp in select value from jsonb_array_elements(v_rec.competencies) loop
      select value into v_given from jsonb_array_elements(p_competencies) where value->>'id' = v_rec_comp->>'id' limit 1;
      if v_given is null then
        raise exception 'Score every competency the recommendation has.' using errcode = 'P0001', hint = 'incomplete_scores';
      end if;
      if coalesce((v_rec_comp->>'judgment')::boolean, false) then
        v_has_writing := true;
        -- A critical error zeroes the writing too: nothing to enter by hand.
        continue when v_critical;
        if p_writing_parts is null or jsonb_typeof(p_writing_parts) <> 'array' then
          raise exception 'Enter each part of the writing by hand.' using errcode = 'P0001', hint = 'writing_parts_required';
        end if;
        v_part_sum := 0;
        for v_part in select value from jsonb_array_elements(v_rec_comp->'parts') loop
          select value into v_entered from jsonb_array_elements(p_writing_parts)
          where value->>'competency' = v_rec_comp->>'id' and value->>'id' = v_part->>'id' limit 1;
          if v_entered is null or jsonb_typeof(v_entered->'earned') <> 'number'
             or (v_entered->>'earned')::numeric <> trunc((v_entered->>'earned')::numeric)
             or (v_entered->>'earned')::int < 0 or (v_entered->>'earned')::int > (v_part->>'points')::int then
            raise exception 'Enter each part of the writing as whole points from 0 to its maximum.' using errcode = 'P0001', hint = 'writing_parts_required';
          end if;
          v_part_sum := v_part_sum + (v_entered->>'earned')::int;
          v_parts := v_parts || jsonb_build_object('competency', v_rec_comp->>'id', 'id', v_part->>'id', 'label', v_part->>'label',
            'points', (v_part->>'points')::int,
            'suggested', coalesce((v_part->>'suggested_before_critical')::int, (v_part->>'suggested')::int),
            'entered', (v_entered->>'earned')::int);
        end loop;
        if v_part_sum <> (v_given->>'earned')::int then
          raise exception 'The writing parts must add up to that competency''s score.' using errcode = 'P0001', hint = 'writing_parts_mismatch';
        end if;
      -- Under a critical error every competency is 0, so nothing is "changed".
      -- Clearing a critical error the system flagged compares with what the
      -- criteria found before the zero.
      elsif not v_critical
        and (v_given->>'earned')::int <> coalesce((v_rec_comp->>'earned_before_critical')::int, (v_rec_comp->>'earned')::int) then
        if length(btrim(coalesce(v_given->>'justification', ''))) = 0
           or btrim(v_given->>'justification') = btrim(coalesce(v_rec_comp->>'student_feedback', '')) then
          raise exception 'Say why you changed % from the recommendation.', coalesce(v_rec_comp->>'label', v_rec_comp->>'id')
            using errcode = 'P0001', hint = 'adjust_reason_required';
        end if;
        v_changed := v_changed || jsonb_build_object('id', v_rec_comp->>'id', 'label', v_rec_comp->>'label',
          'recommended', coalesce((v_rec_comp->>'earned_before_critical')::int, (v_rec_comp->>'earned')::int), 'final', (v_given->>'earned')::int);
      end if;
    end loop;
    if v_has_writing and not coalesce(p_writing_acknowledged, false) then
      raise exception 'Confirm you read the student''s writing.' using errcode = 'P0001', hint = 'writing_not_acknowledged';
    end if;
    if v_critical <> v_rec.critical_error then
      v_changed := v_changed || jsonb_build_object('id', 'critical', 'label', 'Critical error', 'recommended', v_rec.critical_error, 'final', v_critical);
    end if;
  end if;

  insert into public.lab_attempt_grades (
    lab_attempt_id, decision, official_score, uncapped_total, competency_scores,
    critical_error, critical_error_reason, efficiency_feedback, correction_reason,
    rubric_version, created_by
  ) values (
    v_attempt.id, p_decision, v_score, v_total, p_competencies,
    v_critical, v_critical_reason, v_efficiency, v_correction,
    p_rubric_version, v_caller
  ) returning id into v_grade_id;

  if p_recommendation_id is not null then
    insert into public.lab_attempt_grade_reviews (
      grade_id, lab_attempt_id, track_code, recommendation_id,
      recommended_automatic, recommended_writing, recommended_score, recommended_critical,
      final_score, changed, writing_parts, writing_acknowledged_by, writing_acknowledged_at
    ) values (
      v_grade_id, v_attempt.id, v_attempt.track_code, v_rec.id,
      v_rec.automatic_earned, v_rec.writing_suggested, v_rec.recommended_score, v_rec.critical_error,
      v_score, v_changed, v_parts,
      case when v_has_writing then v_caller end, case when v_has_writing then now() end
    );
  end if;

  -- Notes go where every student view already reads them.
  insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
  select v_attempt.id, coalesce(nullif(btrim(item->>'label'), ''), item->>'id'), btrim(item->>'justification'), v_caller
  from jsonb_array_elements(p_competencies) item
  where length(btrim(coalesce(item->>'justification', ''))) > 0;
  if v_critical_reason is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Critical error', v_critical_reason, v_caller);
  end if;
  if v_efficiency is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Efficiency', v_efficiency, v_caller);
  end if;
  if v_note is not null then
    insert into public.lab_attempt_feedback (lab_attempt_id, item_label, comment, created_by)
    values (v_attempt.id, 'Overall', v_note, v_caller);
  end if;

  -- Last, so the completion trigger on this update sees the grade.
  update public.lab_attempts
  set reviewed_at = now(), reviewed_by = v_caller, redo_requested = (p_decision = 'returned')
  where id = v_attempt.id;

  return jsonb_build_object('grade_id', v_grade_id, 'decision', p_decision, 'official_score', v_score);
end;
$$;

revoke all on function public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text, uuid, jsonb, boolean) from public, anon;
grant execute on function public.record_lab_grade(uuid, text, jsonb, boolean, text, text, text, text, text, uuid, jsonb, boolean) to authenticated;

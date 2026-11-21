-- Prove It scoring: when a critical rule fires, the recommendation keeps only
-- coaching. Follows 20261110200000_prove_it_auto_scoring.sql, which is already
-- applied on staging, so prove_score() is replaced here instead of editing it.
--
-- A critical error is an automatic zero. The student lines pre-filled into the
-- instructor's justification boxes used to include each competency's "met"
-- (positive) lines too, so a student could read "Right call…" beside "Critical
-- Error - Not Passed". Now, under a critical error, each competency's
-- student_feedback holds only the lines of criteria that weren't fully met;
-- the critical rule's own student line is unchanged. The staff reasons and
-- every criterion's result stay as they were. Nothing else changes.

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

revoke all on function public.prove_score(jsonb, jsonb) from public, anon, authenticated;

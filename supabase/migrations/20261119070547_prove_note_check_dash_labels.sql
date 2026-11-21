-- Prove It work-note check: the server accepts the same labels as the
-- simulator's Practice check (ui/helpdesk.js, hdNoteLabels / hdNoteMissingParts).
--
-- What changes: only public.prove_note_missing, used by the note_parts check
-- in prove_check. Before, a label counted only before a colon ("Reported:").
-- Now, in any case, with at least 8 non-space characters after it, a label
-- counts:
--   - before a colon, anywhere ("... then Tried: ...");
--   - before a dash (hyphen, en dash or em dash), a full stop or a line break,
--     but only at the start of the note, at the start of a line, or right
--     after a full stop, semicolon or comma ("Reported - ... Tried - ...").
-- So "the user tried. She restarted" is still ordinary prose, not a Tried
-- part. A part is the text after its label up to the next label; a . ; or ,
-- just before a label stays with the part before it. Only the parts a check
-- asks for split the note, as before. The 8,000-character cut is unchanged.
--
-- Why: Practice accepts "Reported - ..." since 2026-11-15. A student who
-- practised that way would lose Documentation points in Prove It.
--
-- Matching the browser exactly: Postgres picks the longest match where
-- JavaScript picks the first alternative, so the colon form does not start at
-- a line start when a line break follows the label there; and a label before a
-- colon needs a non-[A-Za-z0-9_] character (or nothing) before it, like
-- JavaScript's \b (so an accented letter before a label counts as a
-- boundary in both).
--
-- Scores already saved do not change. A staff rescore of an undecided
-- attempt uses this rule. The automatic score is a staff-only recommendation.
--
-- Rollback: re-run the prove_note_missing definition from
-- 20261110200000_prove_it_auto_scoring.sql (the "create or replace function
-- public.prove_note_missing" block), then the revoke line at the end of this
-- file. Nothing else depends on the new body.

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
  v_pattern text;
  v_text text := left(coalesce(p_text, ''), 8000);
  v_marks text[][];
  v_pieces text[];
  v_found jsonb := '{}'::jsonb;
  v_key text;
  v_part text;
  n integer;
  i integer;
begin
  if coalesce(array_length(v_keys, 1), 0) = 0 then
    return '{}';
  end if;
  v_alt := (select string_agg(replace(v_labels->>k, ' ', '\s+'), '|') from unnest(v_keys) k);
  -- Group 1: the . ; or , before a dash/stop/line-break label (it stays with
  -- the part before); group 2: that label. Group 3: a label before a colon.
  -- The start of the note or of a line is a look-behind, so a label that ends
  -- in a line break leaves that line break for the next label. The colon form
  -- does not start at a line start when the label is followed by a line break
  -- (JavaScript takes the first form there; Postgres would take the longer).
  v_pattern := '(?:^|(?<=\n)|([.;,]))[ \t]*(' || v_alt || ')[ \t]*(?:[-\u2013\u2014.]|\r?\n)'
    || '|(?:(?<=[^\n])(?<![A-Za-z0-9_])|(?:^|(?<=\n))(?!(?:' || v_alt || ')[ \t]*\r?\n))(' || v_alt || ')\s*:';
  v_marks := array(select array[coalesce(m[1], ''), lower(regexp_replace(coalesce(m[2], m[3]), '\s+', ' ', 'g'))]
                   from regexp_matches(v_text, v_pattern, 'gi') m);
  v_pieces := regexp_split_to_array(v_text, v_pattern, 'i');
  n := coalesce(array_length(v_marks, 1), 0);
  for i in 1 .. n loop
    select k into v_key from unnest(v_keys) k where lower(v_labels->>k) = v_marks[i][2] limit 1;
    v_part := coalesce(v_pieces[i + 1], '') || case when i < n then v_marks[i + 1][1] else '' end;
    if v_key is not null then
      v_found := jsonb_set(v_found, array[v_key], to_jsonb(coalesce(v_found->>v_key, '') || v_part));
    end if;
  end loop;
  return array(
    select v_labels->>k from unnest(v_keys) k
    where length(regexp_replace(coalesce(v_found->>k, ''), '\s', '', 'g')) < 8
  );
end;
$$;


-- The engine helper is not part of the API (create or replace keeps the
-- existing grants; repeated here so the rule is visible in this file).
revoke all on function public.prove_note_missing(text, text[]) from public, anon, authenticated;

/* SOC Prove It: the database's recommendation on the instructor's
 * Submission Sheet (staff only).
 *
 * A SOC Prove It whose work package says kind 'soc-prove' is scored by the
 * database at submit against an answer key no API role can read (migration
 * 20261119204423_soc_prove_it_server_scoring.sql). The result is a row in
 * lab_attempt_recommendations, which only admins and the course's
 * instructors can read. AdminSubmissionSheet draws an empty
 * "Server recommendation" box on sheets whose definition sets
 * `serverRecommendation: true`; after the admin page draws,
 * socProveWireRecommendations() (called from wireAdmin in app.js) loads the
 * rows for those boxes and fills them. The student's own marked lab never has
 * the box, and a student session reads no rows anyway.
 *
 * Presentation and one staff action (Score this attempt, which calls
 * rescore_lab_attempt): nothing here changes a grade.
 */
const socProveRecommendations = new Map(); // attempt id -> row | null (none) | { status: 'not_enabled' | 'unavailable' }

function socProveEsc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// The recommendations table isn't on this database yet (the portal can
// deploy before a person applies the migration): the box says so, nothing
// else changes.
function socProveTableMissing(error) {
  if (!error) return false;
  if (['42P01', 'PGRST205'].includes(error.code)) return true;
  const text = `${error.message || ''} ${error.details || ''}`;
  return /lab_attempt_recommendations/i.test(text) && /does not exist|schema cache|could not find/i.test(text);
}

async function socProveLoadRecommendations(ids, { force = false } = {}) {
  const wanted = [...new Set(ids)].filter((id) => id && (force || !socProveRecommendations.has(id)));
  if (!wanted.length || typeof mntSupabase === 'undefined') return [];
  const { data, error } = await mntSupabase.from('lab_attempt_recommendations').select('*').in('lab_attempt_id', wanted);
  if (socProveTableMissing(error)) {
    wanted.forEach((id) => socProveRecommendations.set(id, { status: 'not_enabled' }));
  } else if (error) {
    console.error('SOC Prove It recommendations could not be loaded', error);
    wanted.forEach((id) => socProveRecommendations.set(id, { status: 'unavailable' }));
  } else {
    wanted.forEach((id) => socProveRecommendations.set(id, (data || []).find((row) => row.lab_attempt_id === id) || null));
  }
  return wanted;
}

function socProveDay(value) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// The inside of the box for one attempt. `decided`: the attempt already has
// an instructor decision, so it can't be scored again.
function socProveRecommendationHtml(attemptId, rec, { decided = false } = {}) {
  const note = (text, status) => `<p class="mt-1 text-xs text-gray-600" data-sheet-server-rec-status="${socProveEsc(status)}">${socProveEsc(text)}</p>`;
  if (rec === undefined) return note('Loading the server\'s recommendation…', 'loading');
  if (rec && rec.status === 'not_enabled') return note('Server scoring isn\'t set up on this database yet.', 'not_enabled');
  if (rec && rec.status === 'unavailable') return note('The server\'s recommendation couldn\'t be loaded. Reload this page to try again.', 'unavailable');
  const rescore = !decided && (!rec || rec.status === 'no_key' || rec.status === 'error')
    ? `<div class="mt-2 flex flex-wrap items-center gap-2"><button type="button" data-sheet-server-rescore="${socProveEsc(attemptId)}" class="bg-white border border-[#1e3a5f] text-[#1e3a5f] font-semibold text-xs px-3 py-1.5 rounded-lg">Score this attempt</button><span data-sheet-server-rescore-status class="text-xs text-gray-600" role="status"></span></div>`
    : '';
  if (!rec) return `${note('Not scored by the server: this attempt was sent before server scoring for this lab.', 'none')}${rescore}`;
  if (rec.status !== 'scored') {
    const why = rec.status === 'no_key' ? 'no answer key is loaded for this lab'
      : rec.status === 'version_mismatch' ? `the attempt's rubric version (${rec.rubric_version || 'none'}) doesn't match the key (${rec.key_rubric_version || 'none'})`
        : 'scoring failed';
    return `${note(`No server recommendation: ${why}. Use the sheet above.`, rec.status)}${rec.status === 'error' && rec.error ? `<p class="mt-1 text-xs text-gray-500" data-sheet-server-rec-error>Scoring error: ${socProveEsc(rec.error)}</p>` : ''}${rescore}`;
  }
  const mark = (met) => (met === 'met' ? '✓' : met === 'partial' ? '◐' : '✗');
  // A deduction (negative points) is listed only when it applied.
  const shownCriteria = (criteria) => (criteria || []).filter((c) => Number(c.points) >= 0 || c.met === 'met');
  const comps = (rec.competencies || []).map((comp) => {
    const earned = comp.judgment ? comp.suggested : comp.earned;
    const before = Number.isInteger(comp.earned_before_critical) ? ` <span class="font-normal text-gray-500">(criteria found ${socProveEsc(comp.earned_before_critical)})</span>` : '';
    return `<div class="px-3 py-2" data-sheet-server-rec-comp="${socProveEsc(comp.id)}">
      <div class="flex justify-between gap-3"><span class="text-gray-700">${socProveEsc(comp.label)}</span><span class="font-semibold tabular-nums ${Number(earned) >= Number(comp.points) ? 'text-green-700' : 'text-amber-700'}">${socProveEsc(earned)} / ${socProveEsc(comp.points)}${before}</span></div>
      <ul class="mt-1 space-y-0.5 text-xs text-gray-700">${shownCriteria(comp.criteria).map((c) => `<li>${mark(c.met)} ${socProveEsc(c.reason)} <span class="text-gray-500">(${socProveEsc(c.earned)} / ${socProveEsc(c.points)})</span></li>`).join('')}</ul>
    </div>`;
  }).join('');
  const reasons = Array.isArray(rec.critical_reasons) ? rec.critical_reasons : [];
  const effectLabel = (r) => (r.effect === 'flag' ? 'Flagged for your review' : r.effect === 'cap' ? `Score capped at ${r.cap}` : 'Critical error: automatic zero');
  const capped = Number.isInteger(rec.recommended_total) && Number.isInteger(rec.recommended_score) && rec.recommended_score < rec.recommended_total && !rec.critical_error;
  const how = rec.scored_on === 'rescore' ? `Scored on rescore, ${socProveDay(rec.rescored_at)}` : 'Scored at submit';
  return `<p class="mt-1 text-xs text-gray-500" data-sheet-server-rec-how>${socProveEsc(how)} · key ${socProveEsc(rec.key_rubric_version || '')} · revision ${socProveEsc(rec.key_revision ?? '')}</p>
    <p class="mt-1 text-xs text-gray-600">Scored by the database from the work the student's browser saved. Staff only: the student never sees it. Your review decides.</p>
    <div class="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white text-sm">${comps}
      <div class="flex justify-between gap-3 px-3 py-1.5 bg-gray-50" data-sheet-server-rec-total><span class="font-semibold text-gray-700">Recommended score</span><span class="font-semibold tabular-nums">${socProveEsc(rec.recommended_score)} / 100${capped ? ` <span class="font-normal text-gray-500">(capped from ${socProveEsc(rec.recommended_total)})</span>` : ''}</span></div>
    </div>
    ${reasons.length ? `<ul class="mt-2 space-y-0.5 text-xs text-red-800" data-sheet-server-rec-critical>${reasons.map((r) => `<li><strong>${socProveEsc(effectLabel(r))}:</strong> ${socProveEsc(r.reason)}</li>`).join('')}</ul>` : ''}`;
}

function socProveFillSlot(slot) {
  const id = slot.dataset.sheetServerRec;
  const decided = slot.dataset.sheetServerRecDecided === '1';
  const heading = '<h4 class="text-sm font-semibold text-[#1e3a5f]">Server recommendation</h4>';
  slot.innerHTML = heading + socProveRecommendationHtml(id, socProveRecommendations.get(id), { decided });
  slot.querySelectorAll('[data-sheet-server-rescore]').forEach((button) => {
    button.addEventListener('click', () => socProveRescore(button, slot));
  });
}

async function socProveRescore(button, slot) {
  const id = button.dataset.sheetServerRescore;
  const status = slot.querySelector('[data-sheet-server-rescore-status]');
  button.disabled = true;
  if (status) status.textContent = 'Scoring…';
  try {
    const { error } = await mntSupabase.rpc('rescore_lab_attempt', { p_attempt_id: id });
    if (error) throw error;
    await socProveLoadRecommendations([id], { force: true });
    socProveFillSlot(slot);
    return true;
  } catch (error) {
    console.error('rescore_lab_attempt failed', error);
    if (status) status.textContent = `Couldn't score it: ${error && error.message || 'unknown error'}`;
    return false;
  } finally {
    // On success the slot is redrawn with the latest recommendation. On any
    // failure, leave the button usable so staff can retry.
    if (button.isConnected !== false && slot.contains?.(button) !== false && button.disabled) {
      button.disabled = false;
    }
  }
}

// Fills every "Server recommendation" box on the page.
function socProveWireRecommendations() {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return Promise.resolve([]);
  const slots = Array.from(document.querySelectorAll('[data-sheet-server-rec]'));
  if (!slots.length) return Promise.resolve([]);
  return socProveLoadRecommendations(slots.map((slot) => slot.dataset.sheetServerRec)).then((loaded) => {
    slots.forEach(socProveFillSlot);
    return loaded;
  });
}

/* Shared IT Help Desk lab widgets — evidence-upload tile and ticket-queue.
 *
 * These render pure HTML strings from plain data; each module file still
 * owns its own state (LabRuntime load/save/reset) and wires its own
 * delegated event listeners on its own root element, exactly like every
 * SOC module does. Sharing lives here only because the Module 1 and 2 lab
 * specs explicitly call for building these two interactions once instead
 * of re-building them per module (Modules 1, 2, and 12 all use one or
 * both). Every exported class name is prefixed itsw- (IT Support Widget).
 */

function itswFormatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function itswFormatTimestamp(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return iso;
  }
}

/* Reads a <input type="file"> change event's selected file into the shape
 * every evidence-upload tile persists. Does not read or store the file's
 * bytes — the spec only requires an "Uploaded" status and timestamp, and
 * keeping binary data out of LabRuntime's localStorage-backed state avoids
 * quota issues. */
function itswReadEvidenceFile(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return null;
  return { name: file.name, sizeLabel: itswFormatBytes(file.size), uploadedAt: new Date().toISOString() };
}

// "Added", not "Uploaded": the file stays in this browser until evidence
// files are stored on the server. Change this (and Module 1 Lab 1.1's hint)
// back to "Uploaded" once they are.
function itswEvidenceTile({ id, label, hint, file }) {
  const status = file
    ? `<div class="itsw-evidence-status itsw-evidence-done"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i><span class="itsw-evidence-file"><strong>Added</strong> — ${esc(file.name)} · ${esc(file.sizeLabel)}<time>${esc(itswFormatTimestamp(file.uploadedAt))}</time></span></div>`
    : `<div class="itsw-evidence-status"><i class="ri-time-line" aria-hidden="true"></i><span>Not uploaded yet</span></div>`;
  return `<div class="itsw-evidence" data-itsw-evidence="${esc(id)}">
    <div class="itsw-evidence-head"><span class="itsw-evidence-icon"><i class="ri-upload-cloud-2-line" aria-hidden="true"></i></span><div><strong>${esc(label)}</strong><p>${esc(hint)}</p></div></div>
    ${status}
    <label class="itsw-evidence-button"><i class="ri-upload-2-line" aria-hidden="true"></i> ${file ? 'Replace file' : 'Choose file'}<input type="file" accept="image/*" data-itsw-evidence-input="${esc(id)}" /></label>
  </div>`;
}

function itswTicketListItem(ticket, isActive, isAnswered) {
  return `<button type="button" class="itsw-ticket-item ${isActive ? 'itsw-ticket-active' : ''}" data-itsw-ticket-select="${esc(ticket.id)}" role="listitem" aria-current="${isActive}">
    <span class="itsw-ticket-num">${esc(ticket.id)}</span>
    <span class="itsw-ticket-item-body"><strong>${esc(ticket.from)}</strong><small>${esc(ticket.message)}</small></span>
    ${isAnswered ? '<i class="ri-checkbox-circle-fill itsw-ticket-done" aria-label="Answered"></i>' : ''}
  </button>`;
}

/* config: { tickets, activeId, responses (id -> {priority?, category, firstStep, decision, reasoning}),
 *   categoryOptions: [{value, label}], showPriority?: boolean, priorityCount?: number } */
function itswTicketQueue(config) {
  const { tickets, activeId, responses, categoryOptions, showPriority, priorityCount } = config;
  const ticket = tickets.find((item) => item.id === activeId) || tickets[0];
  const response = responses[ticket.id] || {};
  return `<div class="itsw-tickets">
    <div class="itsw-ticket-list" role="list" aria-label="Ticket queue">
      ${tickets.map((item) => itswTicketListItem(item, item.id === ticket.id, Boolean(responses[item.id] && responses[item.id].decision))).join('')}
    </div>
    <div class="itsw-ticket-body">
      <div class="itsw-ticket-detail">
        <div class="itsw-ticket-meta"><span>${esc(ticket.id)}</span>${ticket.tag ? `<span>${esc(ticket.tag)}</span>` : ''}</div>
        <p class="itsw-ticket-message">&ldquo;${esc(ticket.message)}&rdquo;</p>
        <p class="itsw-ticket-from">&mdash; ${esc(ticket.from)}</p>
      </div>
      <form class="itsw-ticket-form" data-itsw-ticket-form="${esc(ticket.id)}">
        ${showPriority ? `<label>Priority rank (1 = work first)
          <select name="priority" data-itsw-field="priority">
            <option value="">Choose a rank&hellip;</option>
            ${Array.from({ length: priorityCount || tickets.length }, (_, i) => i + 1).map((n) => `<option value="${n}" ${Number(response.priority) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>` : ''}
        <label>Category
          <select name="category" data-itsw-field="category">
            <option value="">Choose a category&hellip;</option>
            ${categoryOptions.map((opt) => `<option value="${esc(opt.value)}" ${response.category === opt.value ? 'selected' : ''}>${esc(opt.label)}</option>`).join('')}
          </select>
        </label>
        <label>First diagnostic step
          <textarea name="firstStep" data-itsw-field="firstStep" rows="2" placeholder="What's the first thing you'd check or ask?">${esc(response.firstStep || '')}</textarea>
        </label>
        <div class="itsw-ticket-decision" role="radiogroup" aria-label="Resolve or escalate">
          <label><input type="radio" name="decision" value="resolve" data-itsw-field="decision" ${response.decision === 'resolve' ? 'checked' : ''} /> Resolve</label>
          <label><input type="radio" name="decision" value="escalate" data-itsw-field="decision" ${response.decision === 'escalate' ? 'checked' : ''} /> Escalate</label>
        </div>
        <label>Reasoning
          <textarea name="reasoning" data-itsw-field="reasoning" rows="2" placeholder="Why that category and that call?">${esc(response.reasoning || '')}</textarea>
        </label>
      </form>
    </div>
  </div>`;
}

/* ---------- Returned for revision (every Help Desk module) ----------
 * Faculty "send back" marks a lab's newest attempt redo_requested. At sign-in
 * the portal loads each lab's newest attempt into user.latestLabAttemptByKey
 * and the instructor's notes into user.openLabRedoFeedbackByLabKey; these
 * helpers read only those. A returned lab takes exactly one new attempt:
 * itsSubmitLabAttempt() mirrors the database's one-pending rule
 * (20261005210000_one_pending_prove_it_submission.sql) and ignores a repeat
 * call while the first save is still in flight. */

function itsLabAttempt(user, labKey) {
  return ((user && user.latestLabAttemptByKey) || {})[labKey] || null;
}

function itsLabReturned(user, labKey) {
  const attempt = itsLabAttempt(user, labKey);
  return !!(attempt && attempt.completedAt && !attempt.supersededAt && attempt.redoRequested === true);
}

// A lab takes a new attempt only when it has none yet or its newest was
// returned; while one waits on faculty, or once approved, the database
// refuses the insert anyway.
function itsLabAcceptsAttempt(user, labKey) {
  const attempt = itsLabAttempt(user, labKey);
  return !attempt || !attempt.completedAt || !!attempt.supersededAt || attempt.redoRequested === true;
}

function itsLabTitle(labKey) {
  const lab = typeof LABS !== 'undefined' ? LABS.find((item) => item.key === labKey) : null;
  return lab ? lab.title : labKey;
}

const itsLabSubmissionsInFlight = new Set();

function itsSubmitLabAttempt(user, moduleKey, labKey, fields) {
  if (!user || typeof recordLabAttempt !== 'function') return Promise.resolve(false);
  const inFlightKey = `${user.userId}|${labKey}`;
  if (itsLabSubmissionsInFlight.has(inFlightKey) || !itsLabAcceptsAttempt(user, labKey)) return Promise.resolve(false);
  itsLabSubmissionsInFlight.add(inFlightKey);
  return recordLabAttempt(user, labKey, fields)
    .then((saved) => {
      if (saved && fields.state === 'complete') {
        // The new attempt is now the newest one: waiting on faculty.
        user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [labKey]: { completedAt: new Date().toISOString(), reviewedAt: null, redoRequested: false, supersededAt: null } };
        if (user.openLabRedoFeedbackByLabKey) delete user.openLabRedoFeedbackByLabKey[labKey];
        const open = user.openLabRedosByModuleKey && user.openLabRedosByModuleKey[moduleKey];
        if (open && open.labKey === labKey) delete user.openLabRedosByModuleKey[moduleKey];
      }
      return saved;
    })
    .finally(() => itsLabSubmissionsInFlight.delete(inFlightKey));
}

// A guided walkthrough finished: submit each of its labs that can take an
// attempt (never submitted, or returned). Waiting/approved labs send nothing.
function itsSubmitWalkthroughLabs(user, moduleKey, labKeys) {
  return Promise.all(labKeys.map((labKey) => itsSubmitLabAttempt(user, moduleKey, labKey, { state: 'complete', result: { source: 'mnt-coach-complete' } })));
}

/* Evidence labs: Resubmit stays disabled until the student has added or
 * replaced at least one file since the return. The files' upload times when
 * the student first sees the return are kept as a baseline in the lab's own
 * state (state.redoBaseline), so this only ever compares the student's clock
 * with itself, never with the reviewer's. Callers save state afterwards. */
function itsEvidenceRedo(user, state, labKey, fileFields) {
  if (!itsLabReturned(user, labKey)) return { returned: false, allPresent: false, changed: false };
  const { reviewedAt } = itsLabAttempt(user, labKey);
  state.redoBaseline = state.redoBaseline || {};
  let baseline = state.redoBaseline[labKey];
  if (!baseline || baseline.reviewedAt !== reviewedAt) {
    baseline = { reviewedAt, files: Object.fromEntries(fileFields.map((field) => [field, state[field] ? state[field].uploadedAt : null])) };
    state.redoBaseline[labKey] = baseline;
  }
  return {
    returned: true,
    allPresent: fileFields.every((field) => state[field]),
    changed: fileFields.some((field) => state[field] && state[field].uploadedAt !== baseline.files[field]),
  };
}

/* ---------- Lab status on every Help Desk module page ----------
 * A lab's status, the hero counter and the rail come only from the database:
 * the newest attempt loaded at sign-in, read with requiredLabStatus() (the
 * module cards' rule): 'not_submitted', 'waiting', 'passed' or 'returned'.
 * Browser storage holds only work not yet sent (files added, the policy
 * checkbox), so clearing site data never changes what a lab shows. */

function itsLabStatus(user, labKey) {
  return requiredLabStatus(itsLabAttempt(user, labKey));
}

function itsLabSubmitted(user, labKey) {
  const status = itsLabStatus(user, labKey);
  return status === 'waiting' || status === 'passed';
}

function itsSubmittedDay(user, labKey) {
  const attempt = itsLabAttempt(user, labKey);
  return attempt ? new Date(attempt.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
}

// A save that failed, kept in memory only so the page can offer a retry.
const itsLabSubmitFailures = new Set();

function itsLabSubmitting(user, labKey) {
  return !!user && itsLabSubmissionsInFlight.has(`${user.userId}|${labKey}`);
}

/* The status line for one lab. label: "Lab 2.1", or "Lab" on a one-lab page.
 * prefix: the module's status classes (its01, its02, itss). ready: every
 * file the lab needs is added. pendingText: the prompt before anything is
 * submitted. */
function itsLabStatusHtml(user, labKey, { label, prefix, pendingText, ready = false }) {
  const status = itsLabStatus(user, labKey);
  const line = status === 'passed' ? { pass: true, icon: 'ri-checkbox-circle-fill', text: `${label} passed` }
    : status === 'waiting' ? { icon: 'ri-send-plane-line', text: `${label} submitted ${itsSubmittedDay(user, labKey)}, waiting for instructor review` }
    : status === 'returned' ? { icon: 'ri-error-warning-line', text: `${label} returned for revision — see your instructor’s notes below.` }
    : itsLabSubmitting(user, labKey) ? { icon: 'ri-loader-4-line', text: `Submitting ${label}…` }
    : user && itsLabSubmitFailures.has(`${user.userId}|${labKey}`) ? { icon: 'ri-error-warning-line', text: `${label} wasn’t submitted. Check your connection, then press Submit ${label}.` }
    : ready ? { icon: 'ri-upload-2-line', text: `Ready to submit ${label}` }
    : { icon: 'ri-time-line', text: pendingText };
  return `<div class="${prefix}-lab-status ${prefix}-status-${line.pass ? 'pass' : 'pending'}" data-its-lab-status="${esc(labKey)}" data-status="${status}"><i class="${line.icon}" aria-hidden="true"></i><span>${esc(line.text)}</span></div>`;
}

// Hero counter: "3 of 4 submitted · 1 passed", plus "· 1 returned".
function itsLabCounterText(user, labKeys) {
  const statuses = labKeys.map((key) => itsLabStatus(user, key));
  const count = (...wanted) => statuses.filter((status) => wanted.includes(status)).length;
  const returnedCount = count('returned');
  return `${count('waiting', 'passed')} of ${labKeys.length} submitted · ${count('passed')} passed${returnedCount ? ` · ${returnedCount} returned` : ''}`;
}

// Rail fields for a row covering labKeys: ticked only when every lab passed;
// "Returned" or "In review" (moduleUnifiedNav's reviewState) otherwise.
function itsLabRail(user, labKeys) {
  const statuses = labKeys.map((key) => itsLabStatus(user, key));
  const isComplete = statuses.every((status) => status === 'passed');
  const reviewState = statuses.includes('returned') ? 'returned'
    : !isComplete && statuses.every((status) => status === 'waiting' || status === 'passed') ? 'review'
    : undefined;
  return { isComplete, reviewState };
}

// Walkthrough launch button: redo if any lab was returned, review once every
// lab is in (finishing again then sends nothing), otherwise start.
function itsWalkthroughButton(user, labKeys) {
  if (labKeys.some((key) => itsLabReturned(user, key))) return { icon: 'ri-restart-line', mode: 'redo' };
  if (labKeys.every((key) => itsLabSubmitted(user, key))) return { icon: 'ri-refresh-line', mode: 'review' };
  return { icon: 'ri-terminal-box-line', mode: 'start' };
}

/* A walkthrough is recorded only by the simulator's popup message. Coming
 * back by link (?coachComplete=) saves nothing, since anyone could type that
 * link: the page says the walkthrough wasn't recorded instead (ISSUE-041 from
 * Megan's Student Portal — Code Issues Log). Both sets are keyed
 * `${userId}|${coachId}` and last until the next page load. */
const itsUnrecordedWalkthroughs = new Set();
const itsBlockedWalkthroughs = new Set();

function itsNoteCoachReturn(user, coachId, labKeys) {
  if (new URLSearchParams(location.search).get('coachComplete') !== coachId) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if (user && labKeys.some((key) => itsLabAcceptsAttempt(user, key))) itsUnrecordedWalkthroughs.add(`${user.userId}|${coachId}`);
}

/* Opens the walkthrough in a popup, so it can report back to this page.
 * Returns false and remembers it when the browser blocks the window. */
function itsLaunchWalkthrough(event, link, user, coachId) {
  event.preventDefault();
  const id = `${user ? user.userId : ''}|${coachId}`;
  if (!window.open(link.href, '_blank')) {
    itsBlockedWalkthroughs.add(id);
    return false;
  }
  itsBlockedWalkthroughs.delete(id);
  itsUnrecordedWalkthroughs.delete(id);
  return true;
}

// The Start button's text for Modules 3-11; Modules 1 and 2 name their labs.
const ITS_WALKTHROUGH_START = 'Start guided walkthrough';

/* startLabel: the exact text of this lab's Start button, so the message
 * names the button the student actually sees. */
function itsWalkthroughNoticeHtml(user, coachId, labKeys, startLabel) {
  const id = `${user ? user.userId : ''}|${coachId}`;
  const text = itsBlockedWalkthroughs.has(id)
    ? 'Your browser blocked the walkthrough window. Allow pop-ups for this site, then try again.'
    : itsUnrecordedWalkthroughs.has(id) && labKeys.some((key) => itsLabAcceptsAttempt(user, key))
      ? `Your walkthrough finished but wasn’t recorded. Allow pop-ups for this site, then press ${startLabel} again from this page.`
      : '';
  return `<div class="itss-walkthrough-notice" data-its-walkthrough-notice="${esc(coachId)}" role="status"${text ? '' : ' hidden'}>${esc(text)}</div>`;
}

// Re-renders just the notice after a Start click, without redrawing the page.
function itsRefreshWalkthroughNotice(user, coachId, labKeys, startLabel) {
  const el = document.querySelector(`[data-its-walkthrough-notice="${coachId}"]`);
  if (el) el.outerHTML = itsWalkthroughNoticeHtml(user, coachId, labKeys, startLabel);
}

/* An evidence lab's first submission, from its Submit button: one attempt,
 * only when never submitted and every file is added. onChange re-renders the
 * lab (once for "Submitting…", once for the result). */
function itsSubmitEvidenceLab(user, moduleKey, labKey, fields, onChange) {
  if (!user || itsLabSubmitting(user, labKey) || itsLabStatus(user, labKey) !== 'not_submitted') return Promise.resolve(false);
  const failureKey = `${user.userId}|${labKey}`;
  itsLabSubmitFailures.delete(failureKey);
  const pending = itsSubmitLabAttempt(user, moduleKey, labKey, fields);
  onChange();
  return pending.then((saved) => {
    if (!saved) itsLabSubmitFailures.add(failureKey);
    onChange();
    return saved;
  });
}

function itsSubmitButton(labKey, label) {
  return `<button type="button" class="itsw-evidence-button" data-its-submit="${esc(labKey)}"><i class="ri-send-plane-line" aria-hidden="true"></i> Submit ${esc(label)}</button>`;
}

function itsResubmitButton(labKey, label, enabled) {
  return `<button type="button" class="itsw-evidence-button" data-its-resubmit="${esc(labKey)}" ${enabled ? '' : 'disabled aria-disabled="true" style="opacity:.55;cursor:not-allowed"'}><i class="ri-send-plane-line" aria-hidden="true"></i> ${esc(label)}</button>
    ${enabled ? '' : '<p class="itss-instruction">Add or replace at least one evidence file to enable Resubmit.</p>'}`;
}

/* labs: [{ key, action }] — action tells the student how to resubmit. One
 * notice per returned lab, with the instructor's notes. */
function itsRedoNoticeHtml(user, labs) {
  const notes = (user && user.openLabRedoFeedbackByLabKey) || {};
  return labs.filter((lab) => itsLabReturned(user, lab.key)).map((lab) => {
    const items = notes[lab.key] || [];
    return `<div class="m01-redo-feedback" role="note" data-its-redo-notice="${esc(lab.key)}"><strong><i class="ri-feedback-line" aria-hidden="true"></i> Returned for revision: ${esc(itsLabTitle(lab.key))}</strong>${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>`
      : '<p>Your instructor returned this lab without written notes.</p>'}<p>${esc(lab.action)}</p></div>`;
  }).join('');
}

function itswInDevelopment({ title, previewText }) {
  return `<div class="itsw-in-development"><i class="ri-tools-line" aria-hidden="true"></i><div><strong>${esc(title || 'Lab content in development')}</strong><p>${esc(previewText)}</p></div></div>`;
}

/* Shared page template for Modules 3–11: lesson cards (Learn / Try It
 * Yourself / Coming up in your lab) with no interactive lab yet — see the
 * itss- CSS block in it-support-shared.css. Each of those modules' own JS
 * file supplies only its lesson content and calls this at registration. */
function itsSimpleLessonCard(lesson) {
  return `<details class="itss-lesson" data-itss-lesson="${esc(lesson.id)}">
    <summary><span class="itss-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line itss-chevron" aria-hidden="true"></i></summary>
    <div class="itss-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="itss-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="itss-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <div class="itss-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>
    </div>
  </details>`;
}

function itsCoachLaunchCard({ user, coachId, labKeys }) {
  const button = itsWalkthroughButton(user, labKeys);
  const label = { redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS_WALKTHROUGH_START }[button.mode];
  return `<a class="itsw-evidence-button" data-its-coach-launch href="${esc(SIM_ORIGIN)}?coach=${esc(coachId)}&amp;restart=1#/helpdesk/tickets" target="_blank" rel="opener">
    <i class="${button.icon}" aria-hidden="true"></i> ${label}
  </a>
  ${itsWalkthroughNoticeHtml(user, coachId, labKeys, ITS_WALKTHROUGH_START)}
  ${labKeys.map((key) => itsLabStatusHtml(user, key, { label: labKeys.length === 1 ? 'Lab' : itsLabTitle(key), prefix: 'itss', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })).join('')}`;
}

/* lab: optional { coachId, labKeys, description, notice }. When present, the Prove
 * section is a launch card into the real 'coachId' guided walkthrough
 * (state/onMessage handled by the caller — itsRegisterCoachModule below).
 * When absent, falls back to the original "lab content in development"
 * notice for any module that genuinely has neither. sources: optional array
 * of {title, org, url, note} — rendered via moduleSourcesBlock() and given
 * its own detached "Reference" nav group (moduleUnifiedNav()'s
 * `supplemental: true`), same treatment as every other course's modules. */
function itsSimpleModuleView({ user, program, moduleKey, moduleNumber, lessons, lede, labPreview, lab, sources }) {
  const module = program.modules[moduleKey];
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', moduleKey);
  const numLabel = String(moduleNumber).padStart(2, '0');
  const navSections = [
    { id: 'learn', title: 'Lessons', type: 'lecture', isComplete: true, scrollId: `itss-lessons-${numLabel}` },
    { id: 'practice', title: 'Guided lab', type: 'lab', ...(lab ? itsLabRail(user, lab.labKeys) : { isComplete: false }), scrollId: `itss-lab-${numLabel}` },
    ...(sources?.length ? [{ id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: `itss-sources-${numLabel}`, gated: false, supplemental: true }] : []),
  ];
  return `<div class="itss-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(navSections, { moduleKey: `its${numLabel}`, stageKey: moduleKey })}
    <main class="itss-main">
      <section class="itss-hero" aria-labelledby="itss-title-${numLabel}"><p class="itss-kicker">Module ${numLabel} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="itss-title-${numLabel}">${esc(module.title)}</h1><p class="itss-lede">${esc(lede)}</p></section>

      <section class="itss-section" id="itss-lessons-${numLabel}" aria-labelledby="itss-lessons-title-${numLabel}"><div class="itss-section-heading"><span>L</span><div><p class="itss-kicker">Learn</p><h2 id="itss-lessons-title-${numLabel}">${lessons.length} foundation lesson${lessons.length === 1 ? '' : 's'}</h2></div></div><p class="itss-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise.</p>
        <div class="itss-lesson-grid">${lessons.map(itsSimpleLessonCard).join('')}</div>
      </section>

      <section class="itss-section its-coach-lab" id="itss-lab-${numLabel}" aria-labelledby="itss-lab-title-${numLabel}"><div class="itss-section-heading"><span>P</span><div><p class="itss-kicker">Practice It${lab ? ' · guided walkthrough' : ''}</p><h2 id="itss-lab-title-${numLabel}">Guided lab</h2></div></div>
        ${lab
          ? `<p class="itss-instruction">${esc(lab.description)}</p>${lab.notice || ''}${itsCoachLaunchCard({ user, coachId: lab.coachId, labKeys: lab.labKeys })}`
          : itswInDevelopment({ title: 'Lab content in development', previewText: labPreview })}
      </section>

      ${sources?.length ? `<section class="itss-section" id="itss-sources-${numLabel}" aria-labelledby="itss-sources-title-${numLabel}"><div class="itss-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="itss-kicker">Reference — not a graded step</p><h2 id="itss-sources-title-${numLabel}">Sources &amp; Further Reading</h2></div></div>${moduleSourcesBlock(sources)}</section>` : ''}
    </main>
  </div>`;
}

/* Registers one of Modules 3-11: lesson cards (via itsSimpleModuleView)
 * plus a single guided-coach lab. State/onMessage/registerModuleLab is
 * handled entirely here so each module's own file only supplies content —
 * mirrors the pattern already proven in Modules 1 and 2's own files, shared
 * here since these 9 modules differ only in ids, content, and lab keys.
 * config: { moduleNumber, moduleKey, coachId, labKeys: [labKey,...],
 *   lessons, lede, labDescription, sources? } */
function itsRegisterCoachModule(config) {
  const { moduleNumber, moduleKey, coachId, labKeys, lessons, lede, labDescription, sources } = config;
  const stateId = `its-coach-${moduleKey}-v1`;
  const defaultState = { consoleStarted: false, consoleCompleted: false };
  let state = null;
  let lastUser = null;

  function load(user) {
    lastUser = user;
    state = LabRuntime.load(stateId, user, defaultState);
    itsNoteCoachReturn(user, coachId, labKeys);
    return state;
  }

  function view(user, program) {
    load(user);
    return itsSimpleModuleView({
      user, program, moduleKey, moduleNumber, lessons, lede, sources,
      lab: {
        coachId, labKeys, description: labDescription,
        notice: itsRedoNoticeHtml(user, labKeys.map((key) => ({ key, action: 'Run the walkthrough again to resubmit this lab.' }))),
      },
    });
  }

  function wire() {
    const shell = document.querySelector('.itss-shell');
    if (!shell) return;
    shell.addEventListener('click', (event) => {
      const launch = event.target.closest('[data-its-coach-launch]');
      if (!launch || !lastUser) return;
      if (itsLaunchWalkthrough(event, launch, lastUser, coachId)) {
        state.consoleStarted = true;
        LabRuntime.save(stateId, lastUser, state);
      }
      itsRefreshWalkthroughNotice(lastUser, coachId, labKeys, ITS_WALKTHROUGH_START);
    });
  }

  async function onMessage(event) {
    if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== coachId) return;
    if (event.origin !== new URL(SIM_ORIGIN).origin) return;
    const user = await currentUser();
    if (!user) return;

    const saved = LabRuntime.load(stateId, user, defaultState);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(stateId, user, saved);
    state = saved;
    lastUser = user;

    if (typeof markModuleLabComplete === 'function') labKeys.forEach((key) => markModuleLabComplete(user, 'it-support', moduleKey, key));
    await itsSubmitWalkthroughLabs(user, moduleKey, labKeys);

    const mounted = Boolean(document.querySelector('.itss-shell'));
    if (!mounted) return;
    render();
    const section = document.querySelector('.its-coach-lab');
    if (section) section.scrollIntoView({ block: 'start' });
  }

  registerModuleLab({ program: 'it-support', moduleNumber, moduleKey, view, wire, onMessage });
}

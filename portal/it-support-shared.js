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

function itswEvidenceTile({ id, label, hint, file }) {
  const status = file
    ? `<div class="itsw-evidence-status itsw-evidence-done"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i><span class="itsw-evidence-file"><strong>Uploaded</strong> — ${esc(file.name)} · ${esc(file.sizeLabel)}<time>${esc(itswFormatTimestamp(file.uploadedAt))}</time></span></div>`
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

function itsCoachLaunchCard({ coachId, complete }) {
  return `<a class="itsw-evidence-button" data-its-coach-launch href="${esc(SIM_ORIGIN)}?coach=${esc(coachId)}&amp;restart=1#/helpdesk/tickets" target="_blank" rel="opener">
    <i class="${complete ? 'ri-refresh-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${complete ? 'Review the walkthrough' : 'Start guided walkthrough'}
  </a>
  <div class="itss-lab-status ${complete ? 'itss-status-pass' : 'itss-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — resolved in the guided walkthrough.' : 'Complete the guided walkthrough in the simulator to finish this lab.'}</span></div>`;
}

/* lab: optional { coachId, description, complete }. When present, the Prove
 * section is a launch card into the real 'coachId' guided walkthrough
 * (state/onMessage handled by the caller — itsRegisterCoachModule below).
 * When absent, falls back to the original "lab content in development"
 * notice for any module that genuinely has neither. */
function itsSimpleModuleView({ user, program, moduleKey, moduleNumber, lessons, lede, labPreview, lab }) {
  const module = program.modules[moduleKey];
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', moduleKey);
  const numLabel = String(moduleNumber).padStart(2, '0');
  return `<div class="itss-shell">
    <header class="itss-topbar"><a class="itss-brand" href="#/program/${esc(program.slug)}" aria-label="Back to IT Help Desk program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="itss-top-actions"><span class="itss-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Isolated simulation · fictional data</span><a class="itss-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header>
    <main class="itss-main">
      <section class="itss-hero" aria-labelledby="itss-title-${numLabel}"><p class="itss-kicker">Module ${numLabel} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="itss-title-${numLabel}">${esc(module.title)}</h1><p class="itss-lede">${esc(lede)}</p></section>

      <section class="itss-section" aria-labelledby="itss-lessons-title-${numLabel}"><div class="itss-section-heading"><span>L</span><div><p class="itss-kicker">Learn</p><h2 id="itss-lessons-title-${numLabel}">${lessons.length} foundation lesson${lessons.length === 1 ? '' : 's'}</h2></div></div><p class="itss-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise.</p>
        <div class="itss-lesson-grid">${lessons.map(itsSimpleLessonCard).join('')}</div>
      </section>

      <section class="itss-section its-coach-lab" aria-labelledby="itss-lab-title-${numLabel}"><div class="itss-section-heading"><span>P</span><div><p class="itss-kicker">Prove${lab ? ' · guided walkthrough' : ''}</p><h2 id="itss-lab-title-${numLabel}">Guided lab</h2></div></div>
        ${lab
          ? `<p class="itss-instruction">${esc(lab.description)}</p>${itsCoachLaunchCard({ coachId: lab.coachId, complete: lab.complete })}`
          : itswInDevelopment({ title: 'Lab content in development', previewText: labPreview })}
      </section>
    </main>
  </div>`;
}

/* Registers one of Modules 3-11: lesson cards (via itsSimpleModuleView)
 * plus a single guided-coach lab. State/onMessage/registerModuleLab is
 * handled entirely here so each module's own file only supplies content —
 * mirrors the pattern already proven in Modules 1 and 2's own files, shared
 * here since these 9 modules differ only in ids, content, and lab keys.
 * config: { moduleNumber, moduleKey, coachId, labKeys: [labKey,...],
 *   lessons, lede, labDescription } */
function itsRegisterCoachModule(config) {
  const { moduleNumber, moduleKey, coachId, labKeys, lessons, lede, labDescription } = config;
  const stateId = `its-coach-${moduleKey}-v1`;
  const defaultState = { consoleStarted: false, consoleCompleted: false };
  let state = null;
  let lastUser = null;

  function load(user) {
    lastUser = user;
    state = LabRuntime.load(stateId, user, defaultState);
    if (new URLSearchParams(location.search).get('coachComplete') === coachId) {
      state.consoleStarted = true;
      state.consoleCompleted = true;
      LabRuntime.save(stateId, user, state);
      history.replaceState(null, '', location.pathname + location.hash);
    }
    return state;
  }

  function view(user, program) {
    load(user);
    return itsSimpleModuleView({
      user, program, moduleKey, moduleNumber, lessons, lede,
      lab: { coachId, description: labDescription, complete: state.consoleCompleted === true },
    });
  }

  function wire() {
    const shell = document.querySelector('.itss-shell');
    if (!shell) return;
    shell.addEventListener('click', (event) => {
      if (event.target.closest('[data-its-coach-launch]') && lastUser) {
        state.consoleStarted = true;
        LabRuntime.save(stateId, lastUser, state);
      }
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
    if (typeof recordLabAttempt === 'function') labKeys.forEach((key) => recordLabAttempt(user, key, { state: 'complete', result: { source: 'mnt-coach-complete' } }));

    const mounted = Boolean(document.querySelector('.itss-shell'));
    if (!mounted) return;
    render();
    const section = document.querySelector('.its-coach-lab');
    if (section) section.scrollIntoView({ block: 'start' });
  }

  registerModuleLab({ program: 'it-support', moduleNumber, moduleKey, view, wire, onMessage });
}

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

/* ---------- Evidence files ----------
 * A picked file is kept in this page's memory only (itswPickedFiles), never
 * in browser storage: LabRuntime state holds just its name, size and time so
 * the tile can say what was added. Submit uploads the files to the private
 * 'lab-evidence' bucket and only then records the attempt
 * (itsUploadEvidence + itsSubmitLabAttempt below). After a reload the tile
 * asks for the file again. The bucket enforces the same types and size
 * (20261015120000_lab_evidence_storage.sql); this check only explains a
 * refusal before anything is sent. */
const ITSW_EVIDENCE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const ITSW_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;
const ITS_EVIDENCE_BUCKET = 'lab-evidence';
const ITS_ATTEMPT_RUBRIC_VERSION = 'it-support-practice-v1';
const ITS_ATTEMPT_ENGINE_VERSION = 'it-support-practice-capture-v1';

// Every evidence field's label, shared by the tiles and the faculty panel.
const ITSW_EVIDENCE_LABELS = {
  evidence1: 'Sandbox desktop screenshot',
  evidence2: 'LMS sign-in screenshot',
  evDesktop: 'Finished Windows desktop',
  evVmSettings: 'VM settings summary',
  evSnapshot: 'Snapshot list',
  evPing1: 'Ping: client → server',
  evPing2: 'Ping: server → client',
};

const itswPickedFiles = new Map(); // `${userId}|${field}` -> File
const itswEvidenceErrors = new Map(); // `${userId}|${field}` -> message

function itswPickedFile(user, field) {
  return (user && itswPickedFiles.get(`${user.userId}|${field}`)) || null;
}

// Why a file can't be used, or '' when it can.
function itswEvidenceFileError(file) {
  if (!ITSW_EVIDENCE_TYPES[file.type]) return `“${file.name}” wasn’t added: it isn’t a PNG, JPEG or WebP image. Only PNG, JPEG or WebP up to 10 MB is accepted.`;
  if (file.size > ITSW_EVIDENCE_MAX_BYTES) return `“${file.name}” wasn’t added: it is ${itswFormatBytes(file.size)}. Only PNG, JPEG or WebP up to 10 MB is accepted.`;
  return '';
}

/* Reads a <input type="file"> change event's selected file: the tile's
 * metadata plus the File itself, or { error } when the file can't be used. */
function itswReadEvidenceFile(fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return null;
  const error = itswEvidenceFileError(file);
  if (error) return { error };
  return { name: file.name, sizeLabel: itswFormatBytes(file.size), uploadedAt: new Date().toISOString(), file };
}

/* Takes a picked file for one field: keeps the File in memory and returns
 * the metadata to save in the lab's state. A refused pick replaces the
 * field's earlier file too, so the old screenshot can't be submitted in its
 * place: it returns null, the caller saves the field as empty, and the tile
 * shows why. previous: the field's saved metadata, if any. */
function itswTakeEvidence(user, field, picked, previous = null) {
  if (!user || !picked) return previous;
  const key = `${user.userId}|${field}`;
  if (picked.error || !picked.file) {
    const hadFile = Boolean(previous || itswPickedFiles.has(key));
    itswPickedFiles.delete(key);
    itswEvidenceErrors.set(key, `${picked.error || 'That file wasn’t added.'} ${hadFile ? 'Your earlier file was removed. ' : ''}Choose a file again.`);
    return null;
  }
  itswEvidenceErrors.delete(key);
  itswPickedFiles.set(key, picked.file);
  return { name: picked.name, sizeLabel: picked.sizeLabel, uploadedAt: picked.uploadedAt };
}

// "Added", not "Uploaded": a picked file stays in this page until Submit.
// Files are shown as uploaded only after the attempt is saved
// (itsUploadedEvidenceHtml).
function itswEvidenceTile({ id, user, field, hint, file }) {
  const label = ITSW_EVIDENCE_LABELS[field];
  const picked = itswPickedFile(user, field);
  const error = user ? itswEvidenceErrors.get(`${user.userId}|${field}`) : '';
  const status = file && picked
    ? `<div class="itsw-evidence-status itsw-evidence-done"><i class="ri-checkbox-circle-fill" aria-hidden="true"></i><span class="itsw-evidence-file"><strong>Added</strong> — ${esc(file.name)} · ${esc(file.sizeLabel)}<time>${esc(itswFormatTimestamp(file.uploadedAt))}</time></span></div>`
    : file
      ? `<div class="itsw-evidence-status"><i class="ri-refresh-line" aria-hidden="true"></i><span class="itsw-evidence-file">Choose this file again — “${esc(file.name)}” was added before the page reloaded, and files are kept only until you submit.</span></div>`
      : `<div class="itsw-evidence-status"><i class="ri-time-line" aria-hidden="true"></i><span>Not uploaded yet</span></div>`;
  return `<div class="itsw-evidence" data-itsw-evidence="${esc(id)}">
    <div class="itsw-evidence-head"><span class="itsw-evidence-icon"><i class="ri-upload-cloud-2-line" aria-hidden="true"></i></span><div><strong>${esc(label)}</strong><p>${esc(hint)}</p></div></div>
    ${status}
    ${error ? `<p class="itsw-evidence-error" role="alert"><i class="ri-error-warning-line" aria-hidden="true"></i> ${esc(error)}</p>` : ''}
    <label class="itsw-evidence-button"><i class="ri-upload-2-line" aria-hidden="true"></i> ${file && picked ? 'Replace file' : 'Choose file'}<input type="file" accept="${Object.keys(ITSW_EVIDENCE_TYPES).join(',')}" data-itsw-evidence-input="${esc(id)}" /></label>
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

/* evidenceFields: an evidence lab's state fields. Their picked files are
 * uploaded first, inside the same in-flight guard, and the attempt is then
 * inserted with the upload folder's id; if the insert is refused, the
 * uploaded files are removed again. */
function itsSubmitLabAttempt(user, moduleKey, labKey, fields, evidenceFields = null) {
  if (!user || typeof recordLabAttempt !== 'function') return Promise.resolve(false);
  const inFlightKey = `${user.userId}|${labKey}`;
  if (itsLabSubmissionsInFlight.has(inFlightKey) || !itsLabAcceptsAttempt(user, labKey)) return Promise.resolve(false);
  itsLabSubmissionsInFlight.add(inFlightKey);
  // Help Desk defaults; a caller's own versions (the capstone's) win.
  const attemptMetadata = { rubricVersion: ITS_ATTEMPT_RUBRIC_VERSION, scoringEngineVersion: ITS_ATTEMPT_ENGINE_VERSION };
  const send = !evidenceFields
    ? recordLabAttempt(user, labKey, { ...attemptMetadata, ...fields })
    : itsUploadEvidence(user, moduleKey, labKey, evidenceFields).then((upload) => {
      if (!upload) return false;
      return recordLabAttempt(user, labKey, { ...attemptMetadata, ...fields, id: upload.id, result: { ...(fields.result || {}), evidence_files: upload.files } })
        .then((saved) => {
          if (!saved) return upload.discard().then(() => false);
          itsUploadedEvidence.set(inFlightKey, upload.files);
          evidenceFields.forEach((field) => itswPickedFiles.delete(`${user.userId}|${field}`));
          return true;
        });
    }).catch((err) => { console.error('lab evidence submit threw', labKey, err); return false; });
  return send
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

/* Uploads one evidence lab's picked files to
 * <track>/<user>/<module>/<lab>/<attempt id>/<field>.<ext>. Resolves to
 * { id, files, discard } once every file is stored, or null (after removing
 * whatever was stored) when a file is missing, refused or fails. */
async function itsUploadEvidence(user, moduleKey, labKey, evidenceFields) {
  if (typeof mntSupabase === 'undefined' || !mntSupabase.storage || typeof crypto === 'undefined' || !crypto.randomUUID) return null;
  const id = crypto.randomUUID();
  const folder = [user.trackCode, user.userId, moduleKey, labKey, id].join('/');
  const bucket = mntSupabase.storage.from(ITS_EVIDENCE_BUCKET);
  const tried = [];
  const files = [];
  // Removes every path tried, in case a failed upload was stored anyway.
  // Best effort: Storage reports most failures as a returned error, so log
  // those as well as a thrown one; the submit has already failed either way.
  const discard = () => (tried.length
    ? Promise.resolve().then(() => bucket.remove(tried.slice()))
      .then((res) => { if (res && res.error) console.error('lab evidence cleanup failed', labKey, res.error); })
      .catch((err) => console.error('lab evidence cleanup failed', labKey, err))
    : Promise.resolve());
  for (const field of evidenceFields) {
    const file = itswPickedFile(user, field);
    if (!file || itswEvidenceFileError(file)) { await discard(); return null; }
    const path = `${folder}/${field}.${ITSW_EVIDENCE_TYPES[file.type]}`;
    tried.push(path);
    let error = null;
    try {
      ({ error } = await bucket.upload(path, file, { contentType: file.type, upsert: false }));
    } catch (err) {
      error = err;
    }
    if (error) {
      console.error('lab evidence upload failed', labKey, field, error);
      await discard();
      return null;
    }
    files.push({ field, label: ITSW_EVIDENCE_LABELS[field] || field, path, name: file.name, size: file.size, type: file.type });
  }
  return { id, files, discard };
}

// Files saved with an attempt on this page load, shown under the lab's status.
const itsUploadedEvidence = new Map(); // `${userId}|${labKey}` -> evidence_files

function itsUploadedEvidenceHtml(user, labKey) {
  const files = user ? itsUploadedEvidence.get(`${user.userId}|${labKey}`) : null;
  if (!files || !itsLabSubmitted(user, labKey)) return '';
  return `<ul class="itsw-uploaded" data-its-uploaded="${esc(labKey)}">${files.map((file) => `<li><i class="ri-checkbox-circle-fill" aria-hidden="true"></i> <strong>Uploaded</strong> — ${esc(file.label)}: ${esc(file.name)} · ${esc(itswFormatBytes(file.size))}</li>`).join('')}</ul>`;
}

// A guided walkthrough finished: submit each of its labs that can take an
// attempt (never submitted, or returned). Waiting/approved labs send nothing.
function itsSubmitWalkthroughLabs(user, moduleKey, labKeys, work = null) {
  return Promise.all(labKeys.map((labKey) => itsSubmitLabAttempt(user, moduleKey, labKey, {
    state: 'complete', result: { source: 'mnt-coach-complete', ...(work ? { work } : {}) },
  })));
}

// postMessage data is student-controlled. Store only the small, known work
// fields needed by the instructor sheet; never persist simulator fixture keys.
function itsCleanCoachWork(input) {
  if (!input || typeof input !== 'object' || input.version !== 1 || !Array.isArray(input.tickets)) return null;
  const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
  const tickets = input.tickets.slice(0, 8).filter((ticket) => ticket && typeof ticket === 'object' && /^[A-Z]{2,4}-\d{4}$/.test(ticket.id || '')).map((ticket) => ({
    id: text(ticket.id, 16),
    requester: text(ticket.requester, 120), category: text(ticket.category, 80), subcategory: text(ticket.subcategory, 120),
    description: text(ticket.description, 500), businessImpact: text(ticket.businessImpact, 240), sla: text(ticket.sla, 80),
    symptoms: Array.isArray(ticket.symptoms) ? ticket.symptoms.slice(0, 8).map((value) => text(value, 180)).filter(Boolean) : [],
    systemState: Array.isArray(ticket.systemState) ? ticket.systemState.slice(0, 8).map((value) => text(value, 180)).filter(Boolean) : [],
    logs: Array.isArray(ticket.logs) ? ticket.logs.slice(0, 8).map((value) => text(value, 280)).filter(Boolean) : [],
    expectedDiagnosis: text(ticket.expectedDiagnosis, 300), expectedResolution: text(ticket.expectedResolution, 1000),
    expectedPath: Array.isArray(ticket.expectedPath) ? ticket.expectedPath.slice(0, 8).map((value) => text(value, 200)).filter(Boolean) : [],
    expectedStatus: ['Resolved', 'Escalated'].includes(ticket.expectedStatus) ? ticket.expectedStatus : '',
    priority: text(ticket.priority, 8),
    assignedTechnician: text(ticket.assignedTechnician, 100),
    status: text(ticket.status, 40),
    diagnosis: text(ticket.diagnosis, 240),
    diagnosisCorrect: typeof ticket.diagnosisCorrect === 'boolean' ? ticket.diagnosisCorrect : null,
    linkedProblem: text(ticket.linkedProblem, 40),
    checkedSteps: Array.isArray(ticket.checkedSteps) ? ticket.checkedSteps.slice(0, 20).map((value) => text(value, 300)).filter(Boolean) : [],
    notes: Array.isArray(ticket.notes) ? ticket.notes.slice(-8).map((note) => ({
      author: text(note && note.author, 80), time: text(note && note.time, 40), text: text(note && note.text, 1500),
    })).filter((note) => note.text) : [],
    statusHistory: Array.isArray(ticket.statusHistory) ? ticket.statusHistory.slice(-20).map((entry) => ({
      time: text(entry && entry.time, 40), action: text(entry && entry.action, 180),
    })).filter((entry) => entry.action) : [],
    resolution: text(ticket.resolution, 1200),
    closureCode: text(ticket.closureCode, 120),
  }));
  if (!tickets.length) return null;
  const work = { version: 1, selectedTicketId: text(input.selectedTicketId, 16), tickets };
  // Keep attempts comfortably below PostgREST's practical JSON payload limits.
  while (JSON.stringify(work).length > 48 * 1024) {
    const ticket = work.tickets.find((entry) => entry.statusHistory.length || entry.notes.length);
    if (!ticket) break;
    if (ticket.statusHistory.length) ticket.statusHistory.shift();
    else ticket.notes.shift();
  }
  return work;
}

/* Evidence labs: Resubmit stays disabled until the student has added or
 * replaced at least one file since the return, and every file is picked on
 * this page (a resubmission uploads its own full set). The files' upload times when
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
    allPresent: fileFields.every((field) => state[field] && itswPickedFile(user, field)),
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

// Hero counter: "4 labs · 1 waiting for review · 1 passed · 1 returned";
// the waiting and returned parts appear only when non-zero.
function itsLabCounterText(user, labKeys) {
  const statuses = labKeys.map((key) => itsLabStatus(user, key));
  const count = (status) => statuses.filter((s) => s === status).length;
  const waitingCount = count('waiting');
  const returnedCount = count('returned');
  return [
    `${labKeys.length} lab${labKeys.length === 1 ? '' : 's'}`,
    waitingCount ? `${waitingCount} waiting for review` : '',
    `${count('passed')} passed`,
    returnedCount ? `${returnedCount} returned` : '',
  ].filter(Boolean).join(' · ');
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

/* An evidence lab's first submission, from its Submit button: its files,
 * then one attempt, only when never submitted and every file is added.
 * onChange re-renders the lab (once for "Submitting…", once for the result). */
function itsSubmitEvidenceLab(user, moduleKey, labKey, fields, evidenceFields, onChange) {
  if (!user || itsLabSubmitting(user, labKey) || itsLabStatus(user, labKey) !== 'not_submitted') return Promise.resolve(false);
  const failureKey = `${user.userId}|${labKey}`;
  itsLabSubmitFailures.delete(failureKey);
  const pending = itsSubmitLabAttempt(user, moduleKey, labKey, fields, evidenceFields);
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
    // The marked-lab view (portal/app.js) shows each note beside its section.
    const marked = typeof markedLabLinkHtml === 'function' ? `<p>${markedLabLinkHtml(lab.key)}</p>` : '';
    return `<div class="m01-redo-feedback" role="note" data-its-redo-notice="${esc(lab.key)}"><strong><i class="ri-feedback-line" aria-hidden="true"></i> Returned for revision: ${esc(itsLabTitle(lab.key))}</strong>${items.length
      ? `<ul>${items.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment || '')}</li>`).join('')}</ul>${marked}`
      : '<p>Your instructor returned this lab without written notes.</p>'}<p>${esc(lab.action)}</p></div>`;
  }).join('');
}

/* ---------- Faculty Lab Attempts: evidence files ----------
 * Called from the shared review card (portal/app.js) for every attempt; it
 * renders only for rows whose result lists evidence_files. A file gets an
 * Open button only when its path lies directly in this attempt's own folder,
 * so a row can never point the reviewer at another student's file. Open asks
 * Storage for a five-minute link under the reviewer's own session. */
function itsEvidenceAttemptFolder(row) {
  const lab = typeof LABS !== 'undefined' ? LABS.find((item) => item.key === row.lab_key) : null;
  if (!lab || !row.track_code || !row.user_id || !row.id) return null;
  return `${[row.track_code, row.user_id, lab.module, row.lab_key, row.id].join('/')}/`;
}

function itsEvidenceReviewPanel(row) {
  const files = row && row.result && Array.isArray(row.result.evidence_files) ? row.result.evidence_files : null;
  if (!files) return '';
  const folder = itsEvidenceAttemptFolder(row);
  const own = (path) => !!folder && typeof path === 'string' && path.startsWith(folder) && path.length > folder.length && !path.slice(folder.length).includes('/');
  return `<div class="mb-3 rounded-lg border border-[#bfdbfe] bg-[#f0f7ff] p-3" data-its-evidence-panel="${esc(row.id)}">
    <p class="text-sm font-semibold text-[#1e3a5f] mb-2">Student evidence files (${files.length})</p>
    <ul class="space-y-2 text-sm">${files.map((file) => {
      const item = file && typeof file === 'object' ? file : {};
      const title = `${esc(String(item.label || ITSW_EVIDENCE_LABELS[item.field] || item.field || 'Evidence file'))}${item.name ? ` · <span class="text-gray-600">${esc(String(item.name))}</span>` : ''}${Number(item.size) ? ` <span class="text-xs text-gray-500">(${esc(itswFormatBytes(item.size))})</span>` : ''}`;
      return `<li class="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2"><span class="min-w-0 break-all">${title}</span>${own(item.path)
        ? `<span class="flex items-center gap-2"><button type="button" data-its-evidence-open="${esc(item.path)}" class="text-xs font-semibold text-white bg-[#1e3a5f] hover:bg-[#16324a] rounded-lg px-3 py-1.5">Open</button><span data-its-evidence-open-status class="text-xs text-gray-600"></span></span>`
        : '<span class="text-xs font-semibold text-gray-500">File unavailable</span>'}</li>`;
    }).join('')}</ul>
  </div>`;
}

// The tab opens before the link is requested, so pop-up blockers allow it.
async function itsOpenEvidenceFile(button) {
  const status = button.parentElement && button.parentElement.querySelector('[data-its-evidence-open-status]');
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  let url = null;
  try {
    const { data, error } = await mntSupabase.storage.from(ITS_EVIDENCE_BUCKET).createSignedUrl(button.dataset.itsEvidenceOpen, 300);
    if (error) console.error('lab evidence link failed', error);
    url = !error && data && data.signedUrl;
  } catch (err) {
    console.error('lab evidence link threw', err);
  }
  if (!url) {
    if (tab) tab.close();
    if (status) status.textContent = 'File unavailable';
    return;
  }
  if (tab) {
    tab.location.href = url;
    if (status) status.textContent = '';
  } else if (status) {
    status.innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener" class="underline">Pop-up blocked: open the file here</a>`;
  }
}

if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('click', (event) => {
    const button = event.target && event.target.closest && event.target.closest('[data-its-evidence-open]');
    if (button) itsOpenEvidenceFile(button);
  });
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

    const work = itsCleanCoachWork(event.data.work);

    const saved = LabRuntime.load(stateId, user, defaultState);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(stateId, user, saved);
    state = saved;
    lastUser = user;

    if (typeof markModuleLabComplete === 'function') labKeys.forEach((key) => markModuleLabComplete(user, 'it-support', moduleKey, key));
    await itsSubmitWalkthroughLabs(user, moduleKey, labKeys, work);

    const mounted = Boolean(document.querySelector('.itss-shell'));
    if (!mounted) return;
    render();
    const section = document.querySelector('.its-coach-lab');
    if (section) section.scrollIntoView({ block: 'start' });
  }

  registerModuleLab({ program: 'it-support', moduleNumber, moduleKey, view, wire, onMessage });
}

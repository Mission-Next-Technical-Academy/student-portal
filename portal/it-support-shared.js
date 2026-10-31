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
 * A picked file is kept in this page's memory (itswPickedFiles) and, until
 * Submit, as a copy in this browser's IndexedDB (itswKeepDraftFile below), so
 * a reload or a crashed tab gets it back. The lab's saved state
 * (module_progress.case_state) holds just its name, size and time so the tile
 * can say what was added. Submit uploads the files to the private
 * 'lab-evidence' bucket and only then records the attempt
 * (itsUploadEvidence + itsSubmitLabAttempt below). With no copy in this
 * browser (another browser, or site data cleared) the tile asks for the file
 * again. Nothing is uploaded before Submit. The bucket enforces the same types and size
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

/* ---------- Evidence file copies in this browser (IndexedDB) ----------
 * One record per student, lab and field ("<userId>|<labKey>|<field>"), with
 * the File and the time it was added (its saved metadata's uploadedAt). A
 * copy is put back only for the same student, only while the lab can take an
 * attempt, and only when that time still matches the lab's saved state, so a
 * file replaced in another browser never comes back here. Copies are deleted
 * after a successful submit, on a refused pick, and when anyone signs out
 * (itswWatchSignOut). Without IndexedDB (some private windows) every helper
 * resolves to null and files stay in page memory only, as before. */
const ITSW_DRAFT_DB = 'mnt-hdesk-evidence-drafts';
const ITSW_DRAFT_STORE = 'files';
const itswDraftRestoring = new Set(); // `${userId}|${field}` while its copy is being looked up
const itswDraftLookedUp = new Set(); // `${userId}|${field}` already looked up on this page load
let itswDraftDbPromise = null;

function itswDraftDb() {
  if (typeof indexedDB === 'undefined' || !indexedDB) return Promise.resolve(null);
  if (itswDraftDbPromise) return itswDraftDbPromise;
  itswDraftDbPromise = new Promise((resolve) => {
    const failed = () => { itswDraftDbPromise = null; resolve(null); };
    try {
      const request = indexedDB.open(ITSW_DRAFT_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(ITSW_DRAFT_STORE);
      request.onsuccess = () => {
        const db = request.result;
        // Clearing site data closes this connection: open a new one next time.
        db.onversionchange = () => { db.close(); itswDraftDbPromise = null; };
        db.onclose = () => { itswDraftDbPromise = null; };
        resolve(db);
      };
      request.onerror = failed;
      request.onblocked = failed;
    } catch (_) {
      failed();
    }
  });
  return itswDraftDbPromise;
}

// Runs fn(store) in one transaction. Resolves to the request fn returns (its
// result), true when fn returns none, or null on any failure; never rejects.
function itswDraftRun(mode, fn) {
  return itswDraftDb().then((db) => new Promise((resolve) => {
    if (!db) { resolve(null); return; }
    try {
      const tx = db.transaction(ITSW_DRAFT_STORE, mode);
      const request = fn(tx.objectStore(ITSW_DRAFT_STORE));
      tx.oncomplete = () => resolve(request ? request.result : true);
      tx.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    } catch (_) {
      itswDraftDbPromise = null;
      resolve(null);
    }
  })).catch(() => null);
}

const itswDraftKey = (userId, labKey, field) => `${userId}|${labKey}|${field}`;

function itswKeepDraftFile(user, labKey, field, file, addedAt) {
  if (!user || !user.userId || !labKey || !file) return Promise.resolve(null);
  return itswDraftRun('readwrite', (store) => store.put({ userId: user.userId, labKey, field, addedAt, file }, itswDraftKey(user.userId, labKey, field)));
}

function itswForgetDraftFiles(user, labKey, fields) {
  if (!user || !user.userId || !labKey) return Promise.resolve(null);
  return itswDraftRun('readwrite', (store) => { fields.forEach((field) => store.delete(itswDraftKey(user.userId, labKey, field))); });
}

function itswForgetAllDraftFiles() {
  return itswDraftRun('readwrite', (store) => store.clear());
}

/* Puts this student's file copies back into page memory after a reload.
 * labs: [{ labKey, fields }] on this page; state: their saved lab state.
 * Deletes copies that can't come back: another student's, a lab already
 * waiting or approved, or one whose time no longer matches the saved state.
 * A field picked again while this runs is left alone. Resolves true when a
 * tile was waiting on it, so the caller re-renders. */
function itswRestoreDraftFiles(user, state, labs) {
  if (!user || !user.userId || !state || typeof indexedDB === 'undefined' || !indexedDB) return Promise.resolve(false);
  const open = labs.filter((lab) => itsLabAcceptsAttempt(user, lab.labKey));
  const waiting = [];
  open.forEach((lab) => lab.fields.forEach((field) => {
    const key = `${user.userId}|${field}`;
    if (state[field] && !itswPickedFiles.has(key) && !itswDraftLookedUp.has(key)) { itswDraftRestoring.add(key); waiting.push(key); }
  }));
  return itswDraftRun('readonly', (store) => store.getAll()).then((records) => {
    const discard = [];
    (Array.isArray(records) ? records : []).forEach((record) => {
      if (!record || typeof record !== 'object') return;
      if (record.userId !== user.userId) { discard.push(record); return; }
      const lab = labs.find((item) => item.labKey === record.labKey);
      if (!lab) return; // another module's lab: its own page decides
      const key = `${user.userId}|${record.field}`;
      if (itswPickedFiles.has(key)) return;
      const saved = state[record.field];
      const usable = open.includes(lab) && lab.fields.includes(record.field) && saved && saved.uploadedAt === record.addedAt
        && record.file && !itswEvidenceFileError(record.file);
      if (usable) itswPickedFiles.set(key, record.file);
      else discard.push(record);
    });
    if (discard.length) itswDraftRun('readwrite', (store) => { discard.forEach((record) => store.delete(itswDraftKey(record.userId, record.labKey, record.field))); });
    waiting.forEach((key) => { itswDraftRestoring.delete(key); itswDraftLookedUp.add(key); });
    return waiting.length > 0;
  });
}

/* A student's file copies leave the browser when they sign out. The Sign Out
 * button, the idle timeout, a session the portal no longer accepts, and an
 * expired login all end in Supabase Auth's SIGNED_OUT event, which other open
 * tabs receive too; a page that opens with nobody signed in clears them as
 * well. Help Desk listens to the Auth client directly, so app.js's sign-out
 * code needs no change. */
let itswSignOutWatched = false;

function itswWatchSignOut() {
  if (itswSignOutWatched || typeof mntSupabase === 'undefined' || !mntSupabase.auth || typeof mntSupabase.auth.onAuthStateChange !== 'function') return;
  itswSignOutWatched = true;
  mntSupabase.auth.onAuthStateChange((event, session) => {
    if (event !== 'SIGNED_OUT' && !(event === 'INITIAL_SESSION' && !session)) return;
    itswPickedFiles.clear();
    itswEvidenceErrors.clear();
    itswDraftRestoring.clear();
    itswDraftLookedUp.clear();
    itswForgetAllDraftFiles();
  });
}

itswWatchSignOut();

/* Takes a picked file for one field: keeps the File in memory (and a copy in
 * this browser when labKey is given) and returns the metadata to save in the
 * lab's state. A refused pick replaces the field's earlier file too, so the
 * old screenshot can't be submitted in its place: it returns null, the caller
 * saves the field as empty, and the tile shows why. previous: the field's
 * saved metadata, if any. */
function itswTakeEvidence(user, field, picked, previous = null, labKey = null) {
  if (!user || !picked) return previous;
  const key = `${user.userId}|${field}`;
  itswDraftRestoring.delete(key);
  if (picked.error || !picked.file) {
    const hadFile = Boolean(previous || itswPickedFiles.has(key));
    itswPickedFiles.delete(key);
    if (labKey) itswForgetDraftFiles(user, labKey, [field]);
    itswEvidenceErrors.set(key, `${picked.error || 'That file wasn’t added.'} ${hadFile ? 'Your earlier file was removed. ' : ''}Choose a file again.`);
    return null;
  }
  itswEvidenceErrors.delete(key);
  itswPickedFiles.set(key, picked.file);
  if (labKey) itswKeepDraftFile(user, labKey, field, picked.file, picked.uploadedAt);
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
    : file && user && itswDraftRestoring.has(`${user.userId}|${field}`)
      ? `<div class="itsw-evidence-status"><i class="ri-loader-4-line" aria-hidden="true"></i><span class="itsw-evidence-file">Looking for “${esc(file.name)}” in this browser…</span></div>`
    : file
      ? `<div class="itsw-evidence-status"><i class="ri-refresh-line" aria-hidden="true"></i><span class="itsw-evidence-file">Choose this file again — “${esc(file.name)}” isn’t in this browser any more. Files you add are kept only in the browser you added them in, until you submit or sign out.</span></div>`
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
 *   categoryOptions: [{value, label}], showPriority?: boolean, priorityCount?: number,
 *   locked?: boolean (answer fields disabled; tickets can still be opened) } */
function itswTicketQueue(config) {
  const { tickets, activeId, responses, categoryOptions, showPriority, priorityCount, locked } = config;
  const off = locked ? ' disabled' : '';
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
          <select name="priority" data-itsw-field="priority"${off}>
            <option value="">Choose a rank&hellip;</option>
            ${Array.from({ length: priorityCount || tickets.length }, (_, i) => i + 1).map((n) => `<option value="${n}" ${Number(response.priority) === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </label>` : ''}
        <label>Category
          <select name="category" data-itsw-field="category"${off}>
            <option value="">Choose a category&hellip;</option>
            ${categoryOptions.map((opt) => `<option value="${esc(opt.value)}" ${response.category === opt.value ? 'selected' : ''}>${esc(opt.label)}</option>`).join('')}
          </select>
        </label>
        <label>First diagnostic step
          <textarea name="firstStep" data-itsw-field="firstStep" rows="2"${off} placeholder="What's the first thing you'd check or ask?">${esc(response.firstStep || '')}</textarea>
        </label>
        <div class="itsw-ticket-decision" role="radiogroup" aria-label="Resolve or escalate">
          <label><input type="radio" name="decision" value="resolve" data-itsw-field="decision"${off} ${response.decision === 'resolve' ? 'checked' : ''} /> Resolve</label>
          <label><input type="radio" name="decision" value="escalate" data-itsw-field="decision"${off} ${response.decision === 'escalate' ? 'checked' : ''} /> Escalate</label>
        </div>
        <label>Reasoning
          <textarea name="reasoning" data-itsw-field="reasoning" rows="2"${off} placeholder="Why that category and that call?">${esc(response.reasoning || '')}</textarea>
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
          itswForgetDraftFiles(user, labKey, evidenceFields);
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
// Resolves true when the portal has the work: every lab that could take an
// attempt saved one (a lab already waiting or approved has nothing to save).
function itsSubmitWalkthroughLabs(user, moduleKey, labKeys, work = null) {
  const accepting = labKeys.map((labKey) => itsLabAcceptsAttempt(user, labKey));
  return Promise.all(labKeys.map((labKey) => itsSubmitLabAttempt(user, moduleKey, labKey, {
    state: 'complete', result: { source: 'mnt-coach-complete', ...(work ? { work } : {}) },
  }))).then((saved) => saved.every((ok, i) => ok === true || !accepting[i]));
}

// The simulator keeps a finished walkthrough's work until this page confirms
// it was saved (ui/coach.js finishWithReceipt), so every completion message
// gets an answer: saved, or not (signed out, wrong student, or the save
// failed). `reason` lets the simulator say which.
function itsConfirmCoachReceipt(event, saved, reason) {
  if (!event.source || typeof event.source.postMessage !== 'function') return;
  event.source.postMessage({ type: 'mnt-coach-received', id: event.data.id, nonce: event.data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
}

// Finished work belongs to the student whose launch link opened it (the
// anonymous id it carried). Saving it for whoever is signed in now could
// credit another student, so a missing or different id saves nothing.
// Returns null when the ids match, else the reason to send back.
function itsCoachStudentMismatch(event, user) {
  const student = event.data && typeof event.data.student === 'string' ? event.data.student : '';
  if (!student) return 'no-student';
  return student === LabRuntime.anonymousStudentId(user) ? null : 'other-student';
}

// The walkthrough link names the student by the anonymous id (a hash, never
// the email), so the simulator resumes an unfinished lab only for the same
// student on a shared browser.
function itsCoachLaunchHref(coachId, user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?coach=${encodeURIComponent(coachId)}&restart=1&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
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

/* ---------- Prove It: the simulator's Submit ----------
 * Same handoff as a walkthrough's Finish: a message from the simulator tab
 * this page opened, answered with its nonce. The message is student-controlled,
 * and so is this page's JavaScript, so these checks keep honest mistakes out
 * (a stale tab, another student signed in on a shared browser); they aren't
 * what makes the attempt count. Only an instructor's review does, and no score
 * is ever sent: the answer key isn't in this public repository. */
const ITS_PROVE_REPLY = 'mnt-prove-received';
const ITS_PROVE_STATUS = 'mnt-prove-status';
const ITS_PROVE_SUBMIT = 'mnt-prove-submit';
const ITS_PROVE_MAX_BYTES = 96 * 1024;
const ITS_PROVE_EVENT_TYPES = ['evidence_opened', 'command_run', 'diagnosis_chosen', 'step_chosen', 'step_cleared', 'decision_chosen'];

function itsProveLaunchHref(moduleKey, user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?prove=${encodeURIComponent(moduleKey)}&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}

// Resolves { work } with only the known fields, or { reason }. Writing that
// doesn't fit is refused, never cut; the recorded actions can be trimmed.
function itsCleanProveWork(input, moduleKey, labKey) {
  const invalid = { reason: 'invalid' };
  const tooLarge = { reason: 'too-large' };
  const rubric = typeof HDESK_PROVE_RUBRICS !== 'undefined' ? HDESK_PROVE_RUBRICS[labKey] : null;
  if (!rubric || !input || typeof input !== 'object' || input.version !== 1 || input.kind !== 'hdesk-prove') return invalid;
  if (input.moduleKey !== moduleKey || input.labKey !== labKey || input.rubricVersion !== rubric.version) return invalid;
  const isText = (value, max) => typeof value === 'string' && value.length <= max;
  const filled = (value, max) => isText(value, max) && value.trim() !== '';
  const fields = input.fields;
  if (!/^[A-Z]{2,4}-\d{4}$/.test(String(input.ticketId || '')) || !isText(input.startedAt, 40) || !fields || typeof fields !== 'object') return invalid;
  if (!filled(fields.category, 80) || !filled(fields.type, 80) || !['P1', 'P2', 'P3', 'P4'].includes(fields.priority)) return invalid;
  if (!filled(input.diagnosis, 300) || !['Resolve', 'Escalate'].includes(input.decision)) return invalid;
  if (!Array.isArray(input.steps) || !Array.isArray(input.stepTexts) || input.steps.length > 20 || input.steps.length !== input.stepTexts.length) return invalid;
  if (!input.steps.every((id) => /^[a-z0-9_-]{1,16}$/i.test(String(id))) || !input.stepTexts.every((text) => isText(text, 300))) return invalid;
  if (typeof input.resolutionNote !== 'string' || !input.resolutionNote.trim() || typeof input.userReply !== 'string' || !input.userReply.trim()) return invalid;
  if (!Array.isArray(input.workNotes) || !input.workNotes.every((note) => typeof note === 'string')) return invalid;
  if (input.resolutionNote.length > 4000 || input.userReply.length > 4000 || input.workNotes.length > 30 || input.workNotes.some((note) => note.length > 2000)) return tooLarge;

  const short = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
  const list = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);
  const commands = list(input.commands).slice(-400).map((entry) => ({ command: short(entry.command, 200), computer: short(entry.computer, 40), at: short(entry.at, 40) })).filter((entry) => entry.command);
  const events = list(input.events).slice(-400).filter((entry) => ITS_PROVE_EVENT_TYPES.includes(entry.type)).map((entry) => ({
    type: entry.type, at: short(entry.at, 40), source: short(entry.source, 80), label: short(entry.label, 120), command: short(entry.command, 200),
    computer: short(entry.computer, 40), value: short(entry.value, 300), step: short(entry.step, 16),
  }));
  let machine = {};
  try {
    if (input.machine && typeof input.machine === 'object' && !Array.isArray(input.machine) && JSON.stringify(input.machine).length <= 4096) machine = JSON.parse(JSON.stringify(input.machine));
  } catch (_) { machine = {}; }
  const work = {
    version: 1, kind: 'hdesk-prove', moduleKey, labKey, rubricVersion: rubric.version, ticketId: input.ticketId, startedAt: input.startedAt,
    fields: { category: fields.category, type: fields.type, priority: fields.priority },
    diagnosis: input.diagnosis, steps: input.steps.slice(), stepTexts: input.stepTexts.slice(), decision: input.decision,
    resolutionNote: input.resolutionNote, userReply: input.userReply, workNotes: input.workNotes.slice(),
    commands, events, machine, logTrimmed: false,
  };
  while (JSON.stringify(work).length > ITS_PROVE_MAX_BYTES && (work.events.length || work.commands.length)) {
    work.logTrimmed = true;
    if (work.events.length) work.events.shift(); else work.commands.shift();
  }
  return JSON.stringify(work).length > ITS_PROVE_MAX_BYTES ? tooLarge : { work };
}

// The newest attempt, read from the server: the copy from sign-in can be out
// of date (an instructor's return, another browser, a reply lost after an
// insert landed). A returned attempt's notes come with it, so the course page
// never says it came back without them. Resolves requiredLabStatus(), or null
// when the read fails.
async function itsProveRefreshAttempt(user, moduleKey, labKey) {
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('id, completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId)
      .eq('track_code', user.trackCode)
      .eq('lab_key', labKey)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    const latest = data && data[0];
    const attempts = { ...(user.latestLabAttemptByKey || {}) };
    if (latest) attempts[labKey] = { completedAt: latest.completed_at, reviewedAt: latest.reviewed_at || null, redoRequested: latest.redo_requested === true, supersededAt: latest.superseded_at || null };
    else delete attempts[labKey];
    let grade = null;
    if (latest && latest.reviewed_at) {
      grade = (await fetchOfficialGrades([latest.id])).get(latest.id) || null;
      attempts[labKey].officialScore = grade ? grade.official_score : null;
    }
    user.latestLabAttemptByKey = attempts;
    if (latest && latest.redo_requested === true) {
      const { data: rows, error: notesError } = await mntSupabase.from('lab_attempt_feedback')
        .select('item_label, comment, created_at')
        .eq('lab_attempt_id', latest.id)
        .order('created_at', { ascending: true });
      if (notesError) throw notesError;
      const feedback = latestDecisionNotes(rows || [], grade).filter((row) => String(row.comment || '').trim());
      user.openLabRedoFeedbackByLabKey = { ...(user.openLabRedoFeedbackByLabKey || {}), [labKey]: feedback };
      user.openLabRedosByModuleKey = { ...(user.openLabRedosByModuleKey || {}), [moduleKey]: { labKey, labTitle: itsLabTitle(labKey), feedback } };
    }
    return itsLabStatus(user, labKey);
  } catch (err) {
    console.error('Prove It: could not read the latest attempt', labKey, err);
    return null;
  }
}

// What a returned attempt's form reopens with: the student's own choices and
// writing from the saved package, field by field. Never the instructor's
// scores or notes, which aren't in the package, and never anything else in it.
function itsProvePrefillWork(row) {
  const work = row && row.result;
  if (!work || work.kind !== 'hdesk-prove' || !row.completed_at || !work.fields) return null;
  const text = (value) => (typeof value === 'string' ? value : '');
  return {
    completedAt: row.completed_at, ticketId: text(work.ticketId),
    fields: { category: text(work.fields.category), type: text(work.fields.type), priority: text(work.fields.priority) },
    diagnosis: text(work.diagnosis), steps: Array.isArray(work.steps) ? work.steps.map(text) : [], decision: text(work.decision),
    resolutionNote: text(work.resolutionNote), userReply: text(work.userReply),
    workNotes: Array.isArray(work.workNotes) ? work.workNotes.map(text) : [],
  };
}

// This student's own newest attempt. A failed read just means no prefill.
async function itsProveLastWork(user, labKey) {
  const { data, error } = await mntSupabase.from('lab_attempts')
    .select('completed_at, result')
    .eq('user_id', user.userId)
    .eq('track_code', user.trackCode)
    .eq('lab_key', labKey)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1);
  if (error) { console.error('Prove It: could not read the last submitted work', labKey, error); return null; }
  return itsProvePrefillWork(data && data[0]);
}

/* Answers both messages. Every message that names this Prove It gets a reply,
 * and saved: true is sent only after the server has confirmed the new row.
 * state 'complete' with no score: the completion view counts only 'complete',
 * and only once an instructor has reviewed it. */
async function itsProveReceiveMessage(event, { moduleKey, labKey, onChange }) {
  const data = event.data;
  if (!data || (data.type !== ITS_PROVE_SUBMIT && data.type !== ITS_PROVE_STATUS) || data.id !== moduleKey) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  if (typeof data.nonce !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(data.nonce)) return;
  if (!event.source || typeof event.source.postMessage !== 'function') return;
  const answer = (fields) => event.source.postMessage({ type: ITS_PROVE_REPLY, id: moduleKey, nonce: data.nonce, saved: false, ...fields }, event.origin);
  try {
    const user = await currentUser();
    if (!user) { answer({ reason: 'signed-out' }); return; }
    if (user.trackCode !== 'HDESK' || itsCoachStudentMismatch(event, user)) { answer({ reason: 'other-student' }); return; }
    const before = itsLabStatus(user, labKey);
    const status = await itsProveRefreshAttempt(user, moduleKey, labKey);
    if (!status) { answer({ reason: 'unreadable' }); return; }
    if (status !== before && onChange) onChange();
    if (data.type === ITS_PROVE_STATUS) {
      const lastWork = status === 'returned' ? await itsProveLastWork(user, labKey) : null;
      answer(lastWork ? { status, lastWork } : { status });
      return;
    }
    if (status === 'waiting' || status === 'passed') { answer({ status, reason: 'already-submitted' }); return; }
    const { work, reason } = itsCleanProveWork(data.work, moduleKey, labKey);
    if (!work) { answer({ status, reason }); return; }
    const saved = await itsSubmitLabAttempt(user, moduleKey, labKey, {
      state: 'complete', score: null, rubricVersion: work.rubricVersion, scoringEngineVersion: 'instructor-review-v1',
      result: { source: ITS_PROVE_SUBMIT, ...work },
    });
    if (!saved) {
      // Refused or lost: the server's own answer says whether a row landed.
      const after = await itsProveRefreshAttempt(user, moduleKey, labKey);
      answer({ status: after || status, reason: 'save-failed' });
      if (after && after !== status && onChange) onChange();
      return;
    }
    answer({ saved: true, status: 'waiting' });
    if (onChange) onChange();
  } catch (err) {
    console.error('Prove It: could not handle the message', labKey, err);
    answer({ reason: 'unreadable' });
  }
}

/* Faculty Lab Attempts: the student's work as plain text, with the writing
 * first. Called from the shared review cards for every attempt; it renders only
 * for a Help Desk Prove It lab. A decided attempt also shows its official grade. */
function itsProveReviewPanel(row) {
  const rubric = row && typeof HDESK_PROVE_RUBRICS !== 'undefined' ? HDESK_PROVE_RUBRICS[row.lab_key] : null;
  if (!rubric) return '';
  const work = row.result || {};
  if (work.kind !== 'hdesk-prove') {
    return `<div class="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-its-prove-panel="${esc(row.id)}"><strong>No readable Prove It package.</strong> This attempt didn't come from the simulator's Submit. Return it rather than approving it.</div>`;
  }
  const text = (value) => esc(String(value == null ? '' : value));
  const writing = (label, value) => `<h4 class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">${label}</h4><p class="mt-1 text-base text-gray-900 whitespace-pre-wrap leading-relaxed">${text(value) || '<span class="text-gray-500">Nothing written.</span>'}</p>`;
  const fields = work.fields || {};
  const fact = (label, value) => `<div><dt class="text-xs font-semibold text-gray-600">${label}</dt><dd class="text-sm text-gray-900">${text(value) || '—'}</dd></div>`;
  const items = (values, empty) => (values.length ? `<ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-900">${values.map((value) => `<li>${text(value)}</li>`).join('')}</ul>` : `<p class="mt-1 text-sm text-gray-500">${empty}</p>`);
  const array = (value) => (Array.isArray(value) ? value : []);
  const opened = array(work.events).filter((entry) => entry && entry.type === 'evidence_opened').map((entry) => entry.label || entry.source);
  const commands = array(work.commands).filter(Boolean).map((entry) => `${entry.command}${entry.computer ? ` (on ${entry.computer})` : ''}`);
  const machine = Object.entries(work.machine && typeof work.machine === 'object' ? work.machine : {}).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') || '(none)' : typeof value === 'object' ? JSON.stringify(value) : value}`);
  return `<div class="mb-3 rounded-lg border border-[#bfdbfe] bg-[#f0f7ff] p-4" data-its-prove-panel="${esc(row.id)}">
    <h3 class="text-sm font-semibold text-[#1e3a5f]">Student's written work · ${text(work.ticketId)}</h3>
    ${writing('Resolution note', work.resolutionNote)}
    ${writing('Reply to the user', work.userReply)}
    <h4 class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Work notes</h4>
    ${array(work.workNotes).length ? array(work.workNotes).map((note) => `<p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">${text(note)}</p>`).join('') : '<p class="mt-1 text-sm text-gray-500">No work notes.</p>'}
    <h3 class="mt-4 text-sm font-semibold text-[#1e3a5f]">Student's choices</h3>
    <dl class="mt-1 grid gap-2 sm:grid-cols-3">${fact('Category', fields.category)}${fact('Type', fields.type)}${fact('Priority', fields.priority)}${fact('Diagnosis', work.diagnosis)}${fact('Decision', work.decision)}</dl>
    <h4 class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Steps the student says they took</h4>
    ${items(array(work.stepTexts), 'None selected.')}
    <h3 class="mt-4 text-sm font-semibold text-[#1e3a5f]">What the student did in the simulator</h3>
    <h4 class="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Evidence opened</h4>
    ${items(opened, 'None recorded.')}
    <h4 class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Commands run</h4>
    ${items(commands, 'None recorded.')}
    ${work.logTrimmed ? '<p class="mt-1 text-xs text-gray-500">The oldest recorded actions were left out to fit. All the student\'s writing is above.</p>' : ''}
    <h4 class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Laptop at submit</h4>
    ${items(machine, 'Not recorded.')}
    ${itsProveDecisionsHtml(row)}
  </div>`;
}

/* ---------- Faculty grading sheet for a Help Desk Prove It ----------
 * The server (record_lab_grade) enforces every rule here; the sheet only says
 * what the instructor still has to do. The pass mark comes from the attempt's
 * pass_threshold, which the database sets on every student insert. */

// Reads what the instructor has typed so far. Pure, so it can be tested:
// values = { points: { id: text }, why: { id: text }, critical: boolean, criticalReason: text }.
function itsProveGradeState(rubric, passMark, values) {
  const mark = Number(passMark || NaN);
  const rows = rubric.competencies.map((item) => {
    const raw = String((values.points || {})[item.id] ?? '').trim();
    const valid = /^\d+$/.test(raw) && Number(raw) <= item.points;
    return { ...item, raw, valid, earned: valid ? Number(raw) : null, why: String((values.why || {})[item.id] ?? '').trim() };
  });
  const entered = rows.some((row) => row.raw !== '');
  const invalid = rows.some((row) => row.raw !== '' && !row.valid);
  const allScored = rows.every((row) => row.valid);
  const missingWhy = rows.filter((row) => row.valid && row.earned < row.points && !row.why).map((row) => row.label);
  const critical = values.critical === true;
  const criticalReason = String(values.criticalReason ?? '').trim();
  const total = allScored ? rows.reduce((sum, row) => sum + row.earned, 0) : null;
  const score = total === null ? null : critical ? Math.min(total, mark - 1) : total;
  const blocked = invalid ? 'Points must be whole numbers from 0 to each competency\'s maximum.'
    : !allScored ? 'Score every competency to approve.'
    : missingWhy.length ? `Justify the points for: ${missingWhy.join(', ')}.`
    : critical ? 'A critical error can\'t pass. Use Return.'
    : !(score >= mark) ? `Below ${mark}%. A failing attempt is returned, never approved: use Return.`
    : '';
  return { rows, entered, invalid, allScored, missingWhy, critical, criticalReason, total, score, canApprove: !blocked, blocked };
}

function itsProveGradingCard(item, olderAttempt) {
  const row = item.lead;
  const rubric = row && typeof HDESK_PROVE_RUBRICS !== 'undefined' ? HDESK_PROVE_RUBRICS[row.lab_key] : null;
  if (!rubric) return '';
  const label = 'text-xs font-semibold text-gray-600';
  const box = 'class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"';
  return `<article class="bg-white border border-gray-200 rounded-xl p-5" data-grading-row="${esc(row.id)}" data-its-prove-grade="${esc(row.id)}" data-lab-key="${esc(row.lab_key)}" data-pass-mark="${esc(String(row.pass_threshold ?? ''))}">
    <div class="mb-3">
      <p class="text-sm font-semibold text-[#1e3a5f]">${esc(item.name)}${row.attempt ? ` <span class="font-normal text-gray-500">· ${esc(adminAttemptLabel(row))}</span>` : ''}</p>
      <p class="text-xs text-gray-500 mt-0.5">${esc(item.labTitles.join(' · '))} <span class="text-gray-400">·</span> <span class="font-mono">${esc(row.student_id)}</span></p>
      ${olderAttempt ? '<p class="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Older attempt — a newer submission of this lab is below</p>' : ''}
      <p class="text-xs text-gray-400 mt-0.5">Submitted ${row.completed_at ? new Date(row.completed_at).toLocaleString() : '—'}</p>
    </div>
    ${itsProveReviewPanel(row)}
    <section class="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-label="Rubric">
      <h3 class="text-sm font-semibold text-[#1e3a5f]">Rubric ${esc(rubric.version)}</h3>
      <p class="mt-1 text-sm text-gray-700">${esc(rubric.partialCredit)}</p>
      <div class="mt-3 space-y-3">${rubric.competencies.map((competency) => `<div class="rounded-lg border border-gray-200 bg-white p-3">
        <label class="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-gray-900">${esc(competency.label)}
          <span class="font-normal text-gray-600"><input type="number" inputmode="numeric" min="0" max="${esc(String(competency.points))}" step="1" data-its-prove-points="${esc(competency.id)}" aria-label="${esc(competency.label)} points" class="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right" /> / ${esc(String(competency.points))}</span>
        </label>
        <label class="mt-2 block ${label}">Justification (required below full points)
          <textarea rows="2" data-its-prove-why="${esc(competency.id)}" ${box}></textarea>
        </label>
      </div>`).join('')}</div>
      ${(rubric.formative || []).map((entry) => `<label class="mt-3 block ${label}">${esc(entry.label)} feedback (earns no points)
        <textarea rows="2" data-its-prove-efficiency ${box}></textarea>
      </label>`).join('')}
      <div class="mt-3 rounded-lg border border-gray-200 bg-white p-3">
        <label class="flex items-center gap-2 text-sm font-semibold text-gray-900"><input type="checkbox" data-its-prove-critical /> Critical error</label>
        <p class="mt-1 text-xs text-gray-600">${esc(rubric.criticalErrorRule)}</p>
        <label class="mt-2 block ${label}" data-its-prove-critical-reason-row hidden>Reason (required)
          <textarea rows="2" data-its-prove-critical-reason ${box}></textarea>
        </label>
      </div>
      <p class="mt-3 text-base font-bold text-[#1e3a5f]" data-its-prove-total aria-live="polite">Total: not scored yet</p>
      <label class="mt-3 block ${label}">Notes to the student (a return needs at least one note)
        <textarea rows="3" data-its-prove-note ${box}></textarea>
      </label>
    </section>
    <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
      <button type="button" data-its-prove-decide="approved" disabled class="bg-green-50 text-green-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
      <button type="button" data-its-prove-decide="returned" class="bg-[#1e3a5f] hover:bg-[#16324a] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">Return</button>
      <span data-its-prove-blocked class="text-xs text-gray-600"></span>
      <span data-grading-status class="text-xs text-gray-600" role="status"></span>
    </div>
    <details class="mt-3 text-sm">
      <summary class="cursor-pointer font-semibold text-[#1e3a5f]">Full raw result (for debugging)</summary>
      <pre class="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">${esc(JSON.stringify(row.result ?? {}, null, 2))}</pre>
    </details>
  </article>`;
}

function itsProveReadSheet(sheet) {
  const pick = (attr) => Object.fromEntries(Array.from(sheet.querySelectorAll(`[${attr}]`)).map((el) => [el.getAttribute(attr), el.value]));
  return {
    points: pick('data-its-prove-points'),
    why: pick('data-its-prove-why'),
    critical: !!sheet.querySelector('[data-its-prove-critical]')?.checked,
    criticalReason: sheet.querySelector('[data-its-prove-critical-reason]')?.value || '',
  };
}

function itsProveRefreshSheet(sheet) {
  const rubric = HDESK_PROVE_RUBRICS[sheet.dataset.labKey];
  const state = itsProveGradeState(rubric, sheet.dataset.passMark, itsProveReadSheet(sheet));
  sheet.querySelector('[data-its-prove-critical-reason-row]').hidden = !state.critical;
  sheet.querySelector('[data-its-prove-total]').textContent = state.total === null ? 'Total: not scored yet'
    : state.score !== state.total ? `Total: ${state.total} / 100, capped at ${state.score}% by the critical error`
    : `Total: ${state.total} / 100`;
  sheet.querySelector('[data-its-prove-decide="approved"]').disabled = !state.canApprove;
  sheet.querySelector('[data-its-prove-blocked]').textContent = state.blocked;
}

async function itsProveSubmitDecision(sheet, button, onSaved) {
  const status = sheet.querySelector('[data-grading-status]');
  const decision = button.dataset.itsProveDecide;
  const rubric = HDESK_PROVE_RUBRICS[sheet.dataset.labKey];
  const state = itsProveGradeState(rubric, sheet.dataset.passMark, itsProveReadSheet(sheet));
  if (state.invalid || (state.entered && !state.allScored)) { status.textContent = 'Score every competency, or clear them all to return with no score.'; return; }
  if (state.missingWhy.length) { status.textContent = `Justify the points for: ${state.missingWhy.join(', ')}.`; return; }
  const buttons = sheet.querySelectorAll('[data-its-prove-decide]');
  buttons.forEach((b) => { b.disabled = true; });
  status.textContent = 'Saving…';
  const { error } = await mntSupabase.rpc('record_lab_grade', {
    p_attempt_id: sheet.dataset.itsProveGrade,
    p_decision: decision,
    p_competencies: state.allScored ? state.rows.map((row) => ({ id: row.id, label: row.label, points: row.points, earned: row.earned, justification: row.why })) : [],
    p_critical_error: state.critical,
    p_critical_reason: state.criticalReason,
    p_efficiency: sheet.querySelector('[data-its-prove-efficiency]')?.value || '',
    p_note: sheet.querySelector('[data-its-prove-note]')?.value || '',
    p_rubric_version: rubric.version,
  });
  if (error) {
    console.error('record_lab_grade failed', error);
    status.textContent = `Not saved: ${error.message}`;
    buttons.forEach((b) => { b.disabled = false; });
    itsProveRefreshSheet(sheet);
    return;
  }
  status.textContent = 'Saved. Refreshing…';
  await onSaved();
}

/* A decided attempt: the official grade, read-only. */
// Lab Attempts: every decision on this attempt, newest first. Older ones start
// collapsed. Only a correction adds a second decision (record_lab_grade), so a
// decision that isn't the newest was replaced by one.
function itsProveDecisionLabel(grade) {
  const decision = grade.decision === 'approved' ? 'Approved' : 'Returned';
  const score = grade.official_score === null || grade.official_score === undefined ? 'no score entered' : `${grade.official_score}%`;
  const day = grade.created_at ? new Date(grade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'date not recorded';
  return `${decision} ${score}, ${day}`;
}

function itsProveDecisionsHtml(row) {
  if (!row.official_grade) return '';
  const history = Array.isArray(row.official_grade_history) ? row.official_grade_history : [];
  if (!history.length) {
    return `${itsProveGradeSummaryHtml(row.official_grade)}<p class="mt-2 text-sm text-amber-900" data-its-prove-history-missing>Earlier decisions and saved notes couldn't be loaded. Reload this page to try again.</p>`;
  }
  const [current, ...older] = history;
  return `<div class="mt-4" data-its-prove-decisions>
    <h3 class="text-sm font-semibold text-[#1e3a5f]">Current decision: ${esc(itsProveDecisionLabel(current))}</h3>
    ${itsProveGradeSummaryHtml(current)}
    ${older.map((grade) => `<details class="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2" data-its-prove-older-decision>
      <summary class="cursor-pointer text-sm font-semibold text-[#1e3a5f]">${esc(itsProveDecisionLabel(grade))}, replaced by a correction</summary>
      ${itsProveGradeSummaryHtml(grade)}
    </details>`).join('')}
  </div>`;
}

// The notes saved with a decision, leaving out the ones the summary already
// shows beside their competency, Efficiency or the critical error.
function itsProveDecisionNotes(grade) {
  const scores = Array.isArray(grade.competency_scores) ? grade.competency_scores : [];
  const shown = new Set([
    ...scores.filter((item) => item.justification).map((item) => `${item.label || item.id}|${String(item.justification).trim()}`),
    `Efficiency|${String(grade.efficiency_feedback || '').trim()}`,
    `Critical error|${String(grade.critical_error_reason || '').trim()}`,
  ]);
  return (grade.notes || []).filter((note) => String(note.comment || '').trim() && !shown.has(`${note.item_label}|${String(note.comment).trim()}`));
}

function itsProveGradeSummaryHtml(grade) {
  const scores = Array.isArray(grade.competency_scores) ? grade.competency_scores : [];
  return `<div class="mt-4 rounded-lg border border-gray-200 bg-white p-3" data-its-prove-grade-summary>
    <h3 class="text-sm font-semibold text-[#1e3a5f]">Official grade: ${grade.official_score === null || grade.official_score === undefined ? 'no score entered' : `${esc(String(grade.official_score))}%`} · ${grade.decision === 'approved' ? 'Approved' : 'Returned'}</h3>
    ${scores.length ? `<ul class="mt-2 space-y-1 text-sm text-gray-900">${scores.map((item) => `<li><strong>${esc(String(item.label || item.id))}:</strong> ${esc(String(item.earned))} / ${esc(String(item.points))}${item.justification ? ` <span class="text-gray-600">· ${esc(String(item.justification))}</span>` : ''}</li>`).join('')}</ul>` : ''}
    ${grade.critical_error ? `<p class="mt-2 text-sm text-red-800"><strong>Critical error:</strong> ${esc(String(grade.critical_error_reason || ''))}</p>` : ''}
    ${grade.efficiency_feedback ? `<p class="mt-2 text-sm text-gray-800"><strong>Efficiency:</strong> ${esc(String(grade.efficiency_feedback))}</p>` : ''}
    ${grade.correction_reason ? `<p class="mt-2 text-sm text-gray-800"><strong>Correction:</strong> ${esc(String(grade.correction_reason))}</p>` : ''}
    ${itsProveDecisionNotes(grade).length ? `<h4 class="mt-2 text-xs font-semibold text-gray-600">Notes sent to the student</h4><ul class="mt-1 space-y-1 text-sm text-gray-900">${itsProveDecisionNotes(grade).map((note) => `<li>${note.item_label ? `<strong>${esc(String(note.item_label))}:</strong> ` : ''}${esc(String(note.comment))}</li>`).join('')}</ul>` : ''}
    ${grade.created_at ? `<p class="mt-2 text-xs text-gray-500">Decided ${esc(new Date(grade.created_at).toLocaleString())}</p>` : ''}
  </div>`;
}

/* An approved newest attempt can be returned for another attempt. The full
 * correction screen comes later; the server already records corrections. */
function itsProveReturnActionHtml(row, isNewest) {
  if (!isNewest || !row || !row.official_grade || row.official_grade.decision !== 'approved') return '';
  const box = 'class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"';
  return `<details class="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2" data-its-prove-correction="${esc(row.id)}">
    <summary class="cursor-pointer text-sm font-semibold text-[#1e3a5f]">Return for another attempt</summary>
    <p class="mt-2 text-sm text-gray-700">Use this if the approval was a mistake. The module stops counting as complete and the student gets one new attempt. Hours already awarded don't change.</p>
    <label class="mt-2 block text-xs font-semibold text-gray-600">Why you are correcting this decision (kept in the record)
      <textarea rows="2" data-its-prove-correction-reason ${box}></textarea>
    </label>
    <label class="mt-2 block text-xs font-semibold text-gray-600">Note to the student (required)
      <textarea rows="2" data-its-prove-correction-note ${box}></textarea>
    </label>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" data-its-prove-correction-submit class="bg-[#1e3a5f] hover:bg-[#16324a] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">Return</button>
      <span data-grading-status class="text-xs text-gray-600" role="status"></span>
    </div>
  </details>`;
}

async function itsProveSubmitCorrection(panel, onSaved) {
  const status = panel.querySelector('[data-grading-status]');
  const button = panel.querySelector('[data-its-prove-correction-submit]');
  button.disabled = true;
  status.textContent = 'Saving…';
  const { error } = await mntSupabase.rpc('record_lab_grade', {
    p_attempt_id: panel.dataset.itsProveCorrection,
    p_decision: 'returned',
    p_note: panel.querySelector('[data-its-prove-correction-note]').value,
    p_correction_reason: panel.querySelector('[data-its-prove-correction-reason]').value,
  });
  if (error) {
    console.error('record_lab_grade correction failed', error);
    status.textContent = `Not saved: ${error.message}`;
    button.disabled = false;
    return;
  }
  status.textContent = 'Saved. Refreshing…';
  await onSaved();
}

// Called after every Lab Attempts render; onSaved re-renders the tab.
function itsProveWireGrading(onSaved) {
  document.querySelectorAll('[data-its-prove-grade]').forEach((sheet) => {
    const refresh = () => itsProveRefreshSheet(sheet);
    sheet.addEventListener('input', refresh);
    sheet.addEventListener('change', refresh);
    sheet.querySelectorAll('[data-its-prove-decide]').forEach((button) => {
      button.addEventListener('click', () => itsProveSubmitDecision(sheet, button, onSaved));
    });
    refresh();
  });
  document.querySelectorAll('[data-its-prove-correction]').forEach((panel) => {
    panel.querySelector('[data-its-prove-correction-submit]').addEventListener('click', () => itsProveSubmitCorrection(panel, onSaved));
  });
}

/* The student's marked lab for a graded Prove It. A return shows the
 * instructor's score if one was entered, with no pass/fail. */
function itsProveMarkedLabHtml(row, grade, feedback) {
  if (!grade) return '';
  const passed = grade.decision === 'approved' && !row.redo_requested;
  const scores = Array.isArray(grade.competency_scores) ? grade.competency_scores : [];
  const notes = latestDecisionNotes(feedback || [], grade).filter((item) => String(item.comment || '').trim());
  const hasScore = grade.official_score !== null && grade.official_score !== undefined;
  return `<div class="mnt-marked-lab-status" data-its-prove-marked="${passed ? 'passed' : 'returned'}">
    <p class="font-semibold text-[#1e3a5f]">${esc(itsLabTitle(row.lab_key))}: ${passed ? 'Passed' : 'Returned for revision'}</p>
    ${hasScore ? `<p class="mt-1 text-gray-800">${passed ? 'Your score' : 'Your instructor\'s score'}: <strong>${esc(String(grade.official_score))}%</strong></p>` : ''}
    ${scores.length ? `<ul class="mt-2 space-y-1">${scores.map((item) => `<li>${esc(String(item.label || item.id))}: ${esc(String(item.earned))} / ${esc(String(item.points))}</li>`).join('')}</ul>` : ''}
    ${notes.length ? `<h3 class="mt-3 font-semibold text-[#1e3a5f]">Your instructor's feedback</h3><ul class="mt-1 list-disc pl-5 space-y-1">${notes.map((item) => `<li>${item.item_label ? `<strong>${esc(item.item_label)}:</strong> ` : ''}${esc(item.comment)}</li>`).join('')}</ul>` : '<p class="mt-2 text-gray-600">Your instructor did not leave written notes.</p>'}
  </div>`;
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
 * The lab's saved state (module_progress.case_state) and this browser's file
 * copies hold only work not yet sent (files added, the policy checkbox), so
 * clearing site data never changes what a lab shows. */

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
  const officialScore = (itsLabAttempt(user, labKey) || {}).officialScore;
  const line = status === 'passed' ? { pass: true, icon: 'ri-checkbox-circle-fill', text: `${label} passed${typeof officialScore === 'number' ? ` · ${officialScore}%` : ''}` }
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
  return `<a class="itsw-evidence-button" data-its-coach-launch href="${esc(itsCoachLaunchHref(coachId, user))}" target="_blank" rel="opener">
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
    if (!user) { itsConfirmCoachReceipt(event, false); return; }
    const wrongStudent = itsCoachStudentMismatch(event, user);
    if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

    const work = itsCleanCoachWork(event.data.work);

    // Submit first: a lab counts as complete only once the portal has its
    // attempt (saved now, or already waiting or approved).
    const received = await itsSubmitWalkthroughLabs(user, moduleKey, labKeys, work);
    lastUser = user;
    if (received) {
      const saved = LabRuntime.load(stateId, user, defaultState);
      saved.consoleStarted = true;
      saved.consoleCompleted = true;
      LabRuntime.save(stateId, user, saved);
      state = saved;
      if (typeof markModuleLabComplete === 'function') labKeys.forEach((key) => markModuleLabComplete(user, 'it-support', moduleKey, key));
    }
    itsConfirmCoachReceipt(event, received);

    const mounted = Boolean(document.querySelector('.itss-shell'));
    if (!mounted) return;
    render();
    const section = document.querySelector('.its-coach-lab');
    if (section) section.scrollIntoView({ block: 'start' });
  }

  registerModuleLab({ program: 'it-support', moduleNumber, moduleKey, view, wire, onMessage });
}

// Help Desk evidence labs store their files in the private 'lab-evidence'
// bucket before the attempt is recorded:
//
//   - Only PNG, JPEG or WebP up to 10 MB is accepted, with a clear message.
//   - A refused pick removes that field's earlier file, so the old screenshot
//     can't be submitted in its place, and never counts as a replacement.
//   - A picked file stays in page memory only; browser storage keeps its name.
//   - Submit uploads every file under
//     <track>/<user>/<module>/<lab>/<attempt id>/<field>.<ext>, then inserts the
//     attempt with that same id and result.evidence_files. score stays 100.
//   - A failed upload records nothing; a refused insert removes the files.
//   - Two quick presses send one set of files and one attempt.
//   - The files show as "Uploaded" only after the attempt is saved.
//
// Work done before Submit (Labs 1.1, 2.1, 2.2):
//   - The lab's state (policy flags, added-file names) is saved to the
//     student's account (module_progress.case_state) and comes back in another
//     browser; work kept only in an older browser is copied up.
//   - A picked file keeps a copy in this browser's IndexedDB, scoped to the
//     student and lab, that comes back after a reload and is deleted after a
//     successful submit, on a refused pick, and on sign-out. A copy is never
//     restored for another student, for a lab already submitted, or when the
//     file was replaced in another browser. Without a copy the tile asks for
//     the file again.
//   - No Help Desk status, readiness or display for Labs 1.x and 2.x reads
//     consoleCompleted (the coach Finish handlers still save it in this
//     browser only).
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);

ctx.render = () => {};
let signedIn = null;
ctx.currentUser = async () => signedIn;

const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const moduleLab = (n) => run(`MODULE_LABS['it-support/${n}']`);
const seed = (labId, user, state) => LabRuntime.save(labId, user, { ...LabRuntime.load(labId, user, {}), ...state });

const LAB11 = 'lab-its-01-lms-validation';
const LAB21 = 'lab-its-02-vm-build';
const BUCKET = 'storage:lab-evidence';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function hdUser(attempts = {}) {
  return {
    userId: '5b0e8f2c-1111-4222-8333-944455556666',
    email: 'hdesk@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    latestLabAttemptByKey: attempts,
    openLabRedoFeedbackByLabKey: {},
    openLabRedosByModuleKey: {},
  };
}

// A new page load on a cleared browser: no storage, no picked files.
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run('itswPickedFiles.clear(); itswEvidenceErrors.clear(); itsUploadedEvidence.clear(); itsLabSubmitFailures.clear()');
  signedIn = user;
}

const pick = (name, type = 'image/png', size = 2048) => ({ files: [{ name, type, size }] });
const choose = (moduleAdd, inputId, input) => run(moduleAdd)(inputId, run('itswReadEvidenceFile')(input));
// Values made inside the portal's vm context compare by structure only after a JSON round trip.
const plain = (value) => JSON.parse(JSON.stringify(value));
const calls = (table, op) => ctx.supabaseCalls.filter((c) => c.table === table && (!op || c.op === op));
const inserts = (labKey) => calls('lab_attempts', 'insert').filter((c) => !labKey || c.payload.lab_key === labKey);
const statusLine = (html, labKey) => (new RegExp(`data-its-lab-status="${labKey}"[^>]*>[\\s\\S]*?<span>([\\s\\S]*?)</span>`).exec(html) || [null, null])[1];
const section = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `section ${id}`);
  return html.slice(start, html.indexOf('</section>', start));
};

function chooseLab21() {
  choose('its02AddEvidence', 'its02-ev-desktop', pick('desktop.png'));
  choose('its02AddEvidence', 'its02-ev-vmsettings', pick('settings.jpg', 'image/jpeg', 4096));
}

async function testRefusesWrongTypeAndSize() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);

  choose('its02AddEvidence', 'its02-ev-desktop', pick('desktop.gif', 'image/gif'));
  let html = moduleLab(2).view(user, HD);
  assert.match(section(html, 'its02-lab-2-1'), /“desktop\.gif” wasn’t added: it isn’t a PNG, JPEG or WebP image\. Only PNG, JPEG or WebP up to 10 MB is accepted\. Choose a file again\./);
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /earlier file/, 'no earlier file to mention');
  assert.match(section(html, 'its02-lab-2-1'), /Not uploaded yet/, 'a refused file is not added');
  assert.ok(!LabRuntime.load('its02-lab-state-v1', user, {}).evDesktop, 'nothing saved for a refused file');

  choose('its02AddEvidence', 'its02-ev-desktop', pick('desktop.svg', 'image/svg+xml'));
  html = moduleLab(2).view(user, HD);
  assert.match(section(html, 'its02-lab-2-1'), /“desktop\.svg” wasn’t added: it isn’t a PNG, JPEG or WebP image/, 'SVG is refused');

  choose('its02AddEvidence', 'its02-ev-desktop', pick('huge.png', 'image/png', 10 * 1024 * 1024 + 1));
  html = moduleLab(2).view(user, HD);
  assert.match(section(html, 'its02-lab-2-1'), /“huge\.png” wasn’t added: it is 10\.0 MB\. Only PNG, JPEG or WebP up to 10 MB is accepted\./);

  choose('its02AddEvidence', 'its02-ev-desktop', pick('ok.webp', 'image/webp', 10 * 1024 * 1024));
  html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /wasn’t added/, 'the message clears once a good file is chosen');
  assert.match(section(html, 'its02-lab-2-1'), /<strong>Added<\/strong> — ok\.webp/);
  assert.match(html, /accept="image\/png,image\/jpeg,image\/webp"/, 'the picker offers only the allowed types');
  assert.equal(calls(BUCKET).length, 0, 'choosing files uploads nothing');
}

async function testRefusedReplacementRemovesTheEarlierFile() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  let html = moduleLab(2).view(user, HD);
  assert.match(html, /data-its-submit="lab-its-02-vm-build"/, 'ready with both files');

  choose('its02AddEvidence', 'its02-ev-desktop', pick('photo.heic', 'image/heic'));
  html = moduleLab(2).view(user, HD);
  assert.match(section(html, 'its02-lab-2-1'), /“photo\.heic” wasn’t added: it isn’t a PNG, JPEG or WebP image\. Only PNG, JPEG or WebP up to 10 MB is accepted\. Your earlier file was removed\. Choose a file again\./);
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /Added<\/strong> — desktop\.png/, 'the earlier file is no longer shown');
  assert.doesNotMatch(html, /data-its-submit="lab-its-02-vm-build"/, 'not ready after a refused replacement');
  assert.equal(statusLine(html, LAB21), 'Upload both evidence files to complete this lab.');
  assert.ok(!LabRuntime.load('its02-lab-state-v1', user, {}).evDesktop, 'the earlier name is gone from browser storage');
  assert.equal(await run('its02SubmitLab')(LAB21), false, 'Submit does nothing');
  assert.equal(calls(BUCKET).length + inserts().length, 0, 'nothing uploaded or recorded');

  // A valid pick makes the lab ready again.
  choose('its02AddEvidence', 'its02-ev-desktop', pick('desktop-v2.png'));
  html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /wasn’t added/);
  assert.match(html, /data-its-submit="lab-its-02-vm-build"/, 'ready again after a valid pick');
  assert.equal(await run('its02SubmitLab')(LAB21), true);
  assert.deepEqual(plain(calls(BUCKET, 'upload').map((c) => c.payload.file.name)), ['desktop-v2.png', 'settings.jpg'], 'the new file is the one uploaded');
}

async function testRefusedPickKeepsResubmitOff() {
  const reviewed = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true, supersededAt: null };
  const user = hdUser({ [LAB21]: reviewed });
  fresh(user);
  seed('its02-lab-state-v1', user, { evDesktop: { name: 'old.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' }, evVmSettings: { name: 'old2.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' } });
  moduleLab(2).view(user, HD);
  const resubmit = (html) => (/<button[^>]*data-its-resubmit="lab-its-02-vm-build"[^>]*>/.exec(html) || [''])[0];

  // A refused pick alone is not "a file was replaced".
  choose('its02AddEvidence', 'its02-ev-desktop', pick('photo.heic', 'image/heic'));
  let html = moduleLab(2).view(user, HD);
  assert.match(resubmit(html), /disabled/, 'Resubmit stays off after a refused pick');
  assert.match(section(html, 'its02-lab-2-1'), /Your earlier file was removed\./);

  // Another file validly replaced: still off while the refused field is empty.
  choose('its02AddEvidence', 'its02-ev-vmsettings', pick('settings-v2.png'));
  html = moduleLab(2).view(user, HD);
  assert.match(resubmit(html), /disabled/, 'still off while a field is empty after a refused pick');
  assert.equal(await run('its02ResubmitLab')(LAB21), false);
  assert.equal(calls(BUCKET).length + inserts().length, 0);

  choose('its02AddEvidence', 'its02-ev-desktop', pick('desktop-v2.png'));
  html = moduleLab(2).view(user, HD);
  assert.doesNotMatch(resubmit(html), /disabled/, 'on once every field has a valid file');
}

async function testBrowserStorageKeepsOnlyTheName() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  const saved = LabRuntime.load('its02-lab-state-v1', user, {});
  assert.deepEqual(Object.keys(saved.evDesktop).sort(), ['name', 'sizeLabel', 'uploadedAt']);
}

async function testUploadThenInsertWithTheSameId() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);
  chooseLab21();

  const saved = await run('its02SubmitLab')(LAB21);
  assert.equal(saved, true);
  const uploads = calls(BUCKET, 'upload');
  assert.equal(uploads.length, 2, 'one upload per file');
  const [insert] = inserts(LAB21);
  assert.ok(insert, 'one attempt');
  assert.ok(ctx.supabaseCalls.indexOf(insert) > ctx.supabaseCalls.indexOf(uploads[1]), 'the attempt is inserted after the uploads');

  const id = insert.payload.id;
  assert.match(id, UUID, 'the attempt carries the upload folder id');
  const folder = `HDESK/${user.userId}/its-02/${LAB21}/${id}`;
  assert.deepEqual(plain(uploads.map((c) => c.payload.path)), [`${folder}/evDesktop.png`, `${folder}/evVmSettings.jpg`]);
  assert.deepEqual(plain(uploads.map((c) => c.options)), [{ contentType: 'image/png', upsert: false }, { contentType: 'image/jpeg', upsert: false }]);

  assert.equal(insert.payload.score, 100, 'the score is unchanged');
  assert.equal(insert.payload.state, 'complete');
  assert.equal(insert.payload.result.evidence, 2, 'the existing count stays');
  assert.deepEqual(plain(insert.payload.result.evidence_files), [
    { field: 'evDesktop', label: 'Finished Windows desktop', path: `${folder}/evDesktop.png`, name: 'desktop.png', size: 2048, type: 'image/png' },
    { field: 'evVmSettings', label: 'VM settings summary', path: `${folder}/evVmSettings.jpg`, name: 'settings.jpg', size: 4096, type: 'image/jpeg' },
  ]);
  assert.equal(calls(BUCKET, 'remove').length, 0, 'nothing is removed after a successful submit');

  const html = moduleLab(2).view(user, HD);
  assert.match(statusLine(html, LAB21), /^Lab 2\.1 submitted .+, waiting for instructor review$/);
  assert.match(section(html, 'its02-lab-2-1'), /<strong>Uploaded<\/strong> — Finished Windows desktop: desktop\.png/);
  assert.match(section(html, 'its02-lab-2-1'), /<strong>Uploaded<\/strong> — VM settings summary: settings\.jpg/);
  assert.equal(run(`itswPickedFile(${JSON.stringify(user)}, 'evDesktop')`), null, 'picked files are released once saved');
}

async function testFailedUploadRecordsNothing() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === BUCKET && call.op === 'upload' && call.payload.path.endsWith('evVmSettings.jpg')
    ? { data: null, error: { message: 'network down' } } : { data: null, error: null });
  moduleLab(2).view(user, HD);
  chooseLab21();

  assert.equal(await run('its02SubmitLab')(LAB21), false);
  assert.equal(inserts().length, 0, 'no attempt without every file stored');
  const [remove] = calls(BUCKET, 'remove');
  assert.ok(remove, 'the stored files are removed');
  assert.deepEqual(plain(remove.payload.map((p) => p.split('/').pop())), ['evDesktop.png', 'evVmSettings.jpg'], 'every path tried is removed');

  const html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Lab 2.1 wasn’t submitted. Check your connection, then press Submit Lab 2.1.');
  assert.match(html, /data-its-submit="lab-its-02-vm-build"/, 'the student can try again');
  assert.doesNotMatch(section(html, 'its02-lab-2-1'), /Uploaded/);
}

async function testRefusedInsertRemovesTheFiles() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert'
    ? { data: null, error: { message: 'This lab already has a submission awaiting instructor review.', hint: 'one_pending_submission' } }
    : { data: null, error: null });
  moduleLab(2).view(user, HD);
  chooseLab21();

  assert.equal(await run('its02SubmitLab')(LAB21), false);
  const uploads = calls(BUCKET, 'upload').map((c) => c.payload.path);
  const [remove] = calls(BUCKET, 'remove');
  assert.ok(remove, 'cleanup after a refused insert');
  assert.deepEqual(plain(remove.payload), plain(uploads), 'exactly the uploaded files are removed');
  assert.ok(run(`itswPickedFile(${JSON.stringify(user)}, 'evDesktop')`), 'the picked files stay for a retry');
}

async function testFailedCleanupIsLogged() {
  const user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert'
    ? { data: null, error: { message: 'insert refused' } }
    : call.table === BUCKET && call.op === 'remove' ? { data: null, error: { message: 'remove refused' } }
    : { data: null, error: null });
  const logged = [];
  const realError = ctx.console.error;
  ctx.console = { ...ctx.console, error: (...args) => logged.push(args) };
  try {
    moduleLab(2).view(user, HD);
    chooseLab21();
    assert.equal(await run('its02SubmitLab')(LAB21), false);
  } finally {
    ctx.console = { ...ctx.console, error: realError };
  }
  assert.ok(logged.some(([message, labKey, error]) => message === 'lab evidence cleanup failed' && labKey === LAB21 && error.message === 'remove refused'),
    'a cleanup refused by Storage is logged');
  const html = moduleLab(2).view(user, HD);
  assert.equal(statusLine(html, LAB21), 'Lab 2.1 wasn’t submitted. Check your connection, then press Submit Lab 2.1.');
}

async function testDoubleClickSendsOneSet() {
  const user = hdUser();
  fresh(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await Promise.all([run('its02SubmitLab')(LAB21), run('its02SubmitLab')(LAB21), run('its02SubmitLab')(LAB21)]);
  assert.equal(calls(BUCKET, 'upload').length, 2, 'one set of uploads');
  assert.equal(inserts(LAB21).length, 1, 'one attempt');
}

async function testResubmitUploadsANewFolder() {
  const reviewed = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true, supersededAt: null };
  const user = hdUser({ [LAB21]: reviewed });
  fresh(user);
  seed('its02-lab-state-v1', user, { evDesktop: { name: 'old.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' }, evVmSettings: { name: 'old2.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' } });
  moduleLab(2).view(user, HD);
  chooseLab21();
  assert.equal(await run('its02ResubmitLab')(LAB21), true);
  const [insert] = inserts(LAB21);
  assert.match(insert.payload.id, UUID);
  assert.ok(calls(BUCKET, 'upload').every((c) => c.payload.path.includes(`/${insert.payload.id}/`)), 'the resubmission has its own folder');
  assert.equal(calls(BUCKET, 'remove').length, 0, 'earlier files are never removed');
}

async function testModuleOneUploadsBothFiles() {
  const user = hdUser();
  fresh(user);
  seed('its01-lms-validation-v1', user, { aupScrolled: true, aupAcknowledged: true });
  moduleLab(1).view(user, HD);
  choose('its01AddEvidence', 'its01-evidence-1', pick('sandbox.png'));
  let html = moduleLab(1).view(user, HD);
  assert.doesNotMatch(html, /data-its-submit="lab-its-01-lms-validation"/, 'no Submit with one file');
  choose('its01AddEvidence', 'its01-evidence-2', pick('lms.webp', 'image/webp'));
  html = moduleLab(1).view(user, HD);
  assert.match(section(html, 'its01-lab-1-1'), /LMS sign-in screenshot/);

  assert.equal(await run('its01SubmitLab')(LAB11), true);
  const [insert] = inserts(LAB11);
  const folder = `HDESK/${user.userId}/its-01/${LAB11}/${insert.payload.id}`;
  assert.deepEqual(plain(calls(BUCKET, 'upload').map((c) => c.payload.path)), [`${folder}/evidence1.png`, `${folder}/evidence2.webp`]);
  assert.deepEqual(plain({ evidence: insert.payload.result.evidence, aup: insert.payload.result.aup, score: insert.payload.score }), { evidence: 2, aup: true, score: 100 });
}

/* ---------- Work done before Submit ---------- */

const LAB11_ID = 'its01-lms-validation-v1';
const LAB2_ID = 'its02-lab-state-v1';
const fs = require('node:fs');
const path = require('node:path');

// A minimal IndexedDB: one database, one store, requests answered on later
// ticks in the order they were made, as browsers do.
function fakeIndexedDB() {
  const data = new Map();
  let created = false;
  const later = (fn) => setTimeout(fn, 0);
  const db = {
    createObjectStore() { created = true; },
    close() {},
    transaction() {
      const tx = { oncomplete: null, onerror: null, onabort: null };
      let pending = 0;
      let done = false;
      const finish = () => { if (!pending && !done) { done = true; later(() => tx.oncomplete && tx.oncomplete()); } };
      const req = (fn) => { const r = { result: undefined }; pending += 1; later(() => { r.result = fn(); pending -= 1; finish(); }); return r; };
      tx.objectStore = () => ({
        put: (value, key) => req(() => { data.set(key, value); return key; }),
        delete: (key) => req(() => { data.delete(key); }),
        clear: () => req(() => { data.clear(); }),
        getAll: () => req(() => Array.from(data.values())),
      });
      later(finish);
      return tx;
    },
  };
  return {
    data,
    open() {
      const r = { result: db };
      later(() => { if (!created && r.onupgradeneeded) r.onupgradeneeded(); if (r.onsuccess) r.onsuccess(); });
      return r;
    },
  };
}

// Lets debounced account saves and IndexedDB requests finish.
async function settle() {
  await run('settlePendingCaseStateWrites')();
  await new Promise((resolve) => setTimeout(resolve, 30));
}

let idb = null;
// A browser with nothing in it: no storage, no IndexedDB copies, no page memory.
async function newBrowser(user) {
  await settle();
  fresh(user);
  idb = fakeIndexedDB();
  ctx.indexedDB = idb;
  run('itswDraftDbPromise = null; itswDraftRestoring.clear(); itswDraftLookedUp.clear()');
}

// A reload: page memory is gone; storage and IndexedDB stay.
function reload() {
  run('itswPickedFiles.clear(); itswEvidenceErrors.clear(); itsUploadedEvidence.clear(); itsLabSubmitFailures.clear(); itswDraftRestoring.clear(); itswDraftLookedUp.clear()');
}

const student = (attempts = {}, extra = {}) => ({ ...hdUser(attempts), remoteCaseState: {}, ...extra });
const otherStudent = () => student({}, { userId: '9c1d2e3f-aaaa-4bbb-8ccc-ddddeeeeffff', email: 'hdesk2@test.invalid' });
// The lab state this browser last sent to the account, by module.
const savedCaseState = (moduleKey, labId) => {
  const writes = calls('module_progress').filter((c) => c.payload && c.payload.case_state && (!c.filters.module_key || c.filters.module_key === moduleKey) && (c.payload.module_key || c.filters.module_key) === moduleKey);
  return writes.length ? plain(writes[writes.length - 1].payload.case_state[labId]) : null;
};
const submitButton = (html, labKey) => (new RegExp(`<button[^>]*data-its-submit="${labKey}"[^>]*>`).exec(html) || [null])[0];
const copyKeys = () => Array.from(idb.data.keys()).sort();
const tile = (html, id) => {
  const start = html.indexOf(`data-itsw-evidence="${id}"`);
  assert.ok(start >= 0, `tile ${id}`);
  return html.slice(start, html.indexOf('</label>', start));
};

async function testModuleOnePolicyFlagsReachTheAccount() {
  const user = student();
  await newBrowser(user);
  moduleLab(1).view(user, HD);
  // The policy scroll and checkbox handlers set these and save.
  run('its01State.aupScrolled = true; its01State.aupAcknowledged = true; its01Save()');
  await settle();
  const saved = savedCaseState('its-01', LAB11_ID);
  assert.ok(saved, 'Lab 1.1 state is written to module_progress.case_state');
  assert.equal(saved.aupScrolled, true);
  assert.equal(saved.aupAcknowledged, true);

  // Another browser, same student: only the account's copy exists.
  const again = student({}, { remoteCaseState: { 'its-01': { [LAB11_ID]: saved } } });
  await newBrowser(again);
  const html = moduleLab(1).view(again, HD);
  assert.match(html, /data-its01-aup-checkbox checked /, 'the acknowledgement comes back');
  assert.doesNotMatch(html, /data-its01-aup-checkbox[^>]*disabled/, 'the checkbox is enabled');
  assert.doesNotMatch(html, /Scroll to the end of the policy text/, 'the policy counts as read');
  assert.equal(statusLine(html, LAB11), 'Upload both evidence files and acknowledge the Acceptable Use Policy to complete this lab.', 'not ready: files must be chosen in this browser');
}

async function testModuleTwoFileNamesReachTheAccount() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  const saved = savedCaseState('its-02', LAB2_ID);
  assert.equal(saved.evDesktop.name, 'desktop.png');
  assert.equal(saved.evVmSettings.name, 'settings.jpg');
  assert.equal(calls(BUCKET).length, 0, 'saving the draft uploads no file');

  const again = student({}, { remoteCaseState: { 'its-02': { [LAB2_ID]: saved } } });
  await newBrowser(again);
  moduleLab(2).view(again, HD);
  await settle();
  const html = moduleLab(2).view(again, HD);
  assert.match(tile(html, 'its02-ev-desktop'), /Choose this file again — “desktop\.png” isn’t in this browser any more\. Files you add are kept only in the browser you added them in, until you submit or sign out\./);
  assert.equal(submitButton(html, LAB21), null, 'no Submit until the files are chosen again');
}

async function testBrowserOnlyWorkIsCopiedUp() {
  const user = student();
  await newBrowser(user);
  seed(LAB11_ID, user, { aupScrolled: true, aupAcknowledged: true });
  moduleLab(1).view(user, HD);
  await settle();
  const saved = savedCaseState('its-01', LAB11_ID);
  assert.ok(saved && saved.aupAcknowledged === true, 'work kept only in this browser is copied to the account');
}

async function testReloadRestoresPickedFiles() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  assert.deepEqual(copyKeys(), [`${user.userId}|${LAB21}|evDesktop`, `${user.userId}|${LAB21}|evVmSettings`], 'one copy per student, lab and field');

  reload();
  let html = moduleLab(2).view(user, HD);
  assert.match(tile(html, 'its02-ev-desktop'), /Looking for “desktop\.png” in this browser…/, 'the tile says it is looking while the copy loads');
  await settle();
  html = moduleLab(2).view(user, HD);
  assert.match(tile(html, 'its02-ev-desktop'), /<strong>Added<\/strong> — desktop\.png/);
  assert.match(tile(html, 'its02-ev-vmsettings'), /<strong>Added<\/strong> — settings\.jpg/);
  assert.ok(submitButton(html, LAB21), 'ready to submit after the reload');
  assert.equal(calls(BUCKET).length, 0, 'restoring uploads nothing');

  assert.equal(await run('its02SubmitLab')(LAB21), true);
  assert.deepEqual(plain(calls(BUCKET, 'upload').map((c) => c.payload.file.name)), ['desktop.png', 'settings.jpg'], 'the restored files are the ones uploaded');
  await settle();
  assert.deepEqual(copyKeys(), [], 'the copies are deleted after a successful submit');
}

async function testModuleOneReloadRestoresPickedFiles() {
  const user = student();
  await newBrowser(user);
  moduleLab(1).view(user, HD);
  choose('its01AddEvidence', 'its01-evidence-1', pick('sandbox.png'));
  choose('its01AddEvidence', 'its01-evidence-2', pick('lms.webp', 'image/webp'));
  run('its01State.aupScrolled = true; its01State.aupAcknowledged = true; its01Save()');
  await settle();
  reload();
  moduleLab(1).view(user, HD);
  await settle();
  const html = moduleLab(1).view(user, HD);
  assert.ok(submitButton(html, LAB11), 'Lab 1.1 is ready after the reload');
  // A failed submit keeps the copies for the next try.
  ctx.supabaseResponder = (call) => (call.table === BUCKET ? { data: null, error: { message: 'offline' } } : { data: null, error: null });
  assert.equal(await run('its01SubmitLab')(LAB11), false);
  await settle();
  assert.equal(copyKeys().length, 2, 'a failed submit keeps the copies');
  ctx.supabaseResponder = () => ({ data: null, error: null });
  assert.equal(await run('its01SubmitLab')(LAB11), true);
  await settle();
  assert.deepEqual(copyKeys(), [], 'deleted once the submit succeeds');
}

async function testRefusedPickDeletesTheCopy() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  choose('its02AddEvidence', 'its02-ev-desktop', pick('photo.heic', 'image/heic'));
  await settle();
  assert.deepEqual(copyKeys(), [`${user.userId}|${LAB21}|evVmSettings`], 'the refused field keeps no copy');
}

async function testClearedSiteDataAsksForTheFileAgain() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  const saved = savedCaseState('its-02', LAB2_ID);

  // Sign out, clear site data, sign in: the account still has the names.
  const again = student({}, { remoteCaseState: { 'its-02': { [LAB2_ID]: saved } } });
  await newBrowser(again);
  moduleLab(2).view(again, HD);
  await settle();
  const html = moduleLab(2).view(again, HD);
  assert.doesNotMatch(html, /Looking for/, 'no copy to look for once the lookup ends');
  assert.match(tile(html, 'its02-ev-vmsettings'), /Choose this file again — “settings\.jpg” isn’t in this browser any more/);
  assert.equal(statusLine(html, LAB21), 'Upload both evidence files to complete this lab.');
}

async function testFileReplacedInAnotherBrowserIsNotRestored() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  const saved = savedCaseState('its-02', LAB2_ID);
  // Later, another browser replaced the desktop screenshot.
  const replaced = { ...saved, evDesktop: { name: 'desktop-v2.png', sizeLabel: '2.0 KB', uploadedAt: '2099-01-01T00:00:00.000Z' } };
  const back = student({}, { remoteCaseState: { 'its-02': { [LAB2_ID]: replaced } } });
  reload();
  signedIn = back;
  moduleLab(2).view(back, HD);
  await settle();
  const html = moduleLab(2).view(back, HD);
  assert.match(tile(html, 'its02-ev-desktop'), /Choose this file again — “desktop-v2\.png”/, 'the old copy does not stand in for the new file');
  assert.match(tile(html, 'its02-ev-vmsettings'), /<strong>Added<\/strong> — settings\.jpg/, 'the unchanged file still comes back');
  assert.deepEqual(copyKeys(), [`${user.userId}|${LAB21}|evVmSettings`], 'the outdated copy is deleted');
}

async function testSubmittedLabCopiesAreNotRestored() {
  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  // The lab was submitted from another browser and is waiting for review.
  const waiting = student({ [LAB21]: { completedAt: '2026-10-20T10:00:00Z', reviewedAt: null, redoRequested: false, supersededAt: null } });
  reload();
  signedIn = waiting;
  moduleLab(2).view(waiting, HD);
  await settle();
  assert.equal(run(`itswPickedFile(${JSON.stringify(waiting)}, 'evDesktop')`), null, 'nothing restored for a waiting lab');
  assert.deepEqual(copyKeys(), [], 'its copies are deleted');
}

async function testSignOutDeletesTheCopies() {
  let listener = null;
  ctx.mntSupabase.auth.onAuthStateChange = (callback) => { listener = callback; return { data: { subscription: { unsubscribe() {} } } }; };
  run('itswWatchSignOut()');
  assert.equal(typeof listener, 'function', 'Help Desk listens for Supabase Auth events');

  const user = student();
  await newBrowser(user);
  moduleLab(2).view(user, HD);
  chooseLab21();
  await settle();
  listener('TOKEN_REFRESHED', { user: {} });
  listener('INITIAL_SESSION', { user: {} });
  await settle();
  assert.equal(copyKeys().length, 2, 'other events and a signed-in page load keep the copies');

  listener('SIGNED_OUT', null);
  await settle();
  assert.deepEqual(copyKeys(), [], 'signing out deletes every copy');
  assert.equal(run(`itswPickedFile(${JSON.stringify(user)}, 'evDesktop')`), null, 'and the page memory');

  chooseLab21();
  await settle();
  listener('INITIAL_SESSION', null);
  await settle();
  assert.deepEqual(copyKeys(), [], 'a page that opens with nobody signed in deletes them too');
}

async function testSecondStudentSeesNothingOfTheFirst() {
  const first = student();
  await newBrowser(first);
  moduleLab(2).view(first, HD);
  chooseLab21();
  await settle();

  // Same browser, no sign-out event (the tab closed), another student.
  const second = otherStudent();
  reload();
  signedIn = second;
  moduleLab(2).view(second, HD);
  await settle();
  const html = moduleLab(2).view(second, HD);
  assert.doesNotMatch(html, /desktop\.png|settings\.jpg/, 'no file name of the first student');
  assert.match(tile(html, 'its02-ev-desktop'), /Not uploaded yet/);
  assert.equal(submitButton(html, LAB21), null);
  assert.deepEqual(copyKeys(), [], "the first student's copies are deleted");
}

async function testReturnedLabOneResubmitsWithRestoredFiles() {
  const returnedAttempt = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true, supersededAt: null };
  const user = student({ [LAB11]: returnedAttempt });
  await newBrowser(user);
  seed(LAB11_ID, user, {
    evidence1: { name: 'old1.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' },
    evidence2: { name: 'old2.png', sizeLabel: '1.0 KB', uploadedAt: '2026-10-01T09:00:00Z' },
    aupScrolled: true, aupAcknowledged: true,
  });
  moduleLab(1).view(user, HD);
  choose('its01AddEvidence', 'its01-evidence-1', pick('new1.png'));
  choose('its01AddEvidence', 'its01-evidence-2', pick('new2.png'));
  await settle();
  reload();
  moduleLab(1).view(user, HD);
  await settle();
  const html = moduleLab(1).view(user, HD);
  const button = (/<button[^>]*data-its-resubmit="lab-its-01-lms-validation"[^>]*>/.exec(html) || [''])[0];
  assert.ok(button && !/disabled/.test(button), 'Resubmit is enabled with the restored files');
  assert.equal(await run('its01ResubmitLab')(LAB11), true);
  assert.equal(inserts(LAB11).length, 1, 'one new attempt');
  assert.deepEqual(plain(calls(BUCKET, 'upload').map((c) => c.payload.file.name)), ['new1.png', 'new2.png']);
  await settle();
  assert.deepEqual(copyKeys(), [], 'copies deleted after the resubmit');
}

// The coach Finish handlers still save consoleCompleted in this browser only,
// while the page saves the same record to the account, so the two can
// disagree. Nothing a student or instructor sees may depend on it.
async function testConsoleCompletedChangesNothingShown() {
  const SUBMITTED = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: null, redoRequested: false, supersededAt: null };
  const RETURNED = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true, supersededAt: null };
  const PASSED = { completedAt: '2026-10-01T10:00:00Z', reviewedAt: '2026-10-02T10:00:00Z', redoRequested: false, supersededAt: null, score: 100 };
  const cases = [
    {},
    { 'lab-its-01-ticket-triage': SUBMITTED, 'lab-its-02-device-manager': SUBMITTED, 'lab-its-02-print-spooler': SUBMITTED },
    { 'lab-its-01-ticket-triage': RETURNED, 'lab-its-02-device-manager': RETURNED, 'lab-its-02-print-spooler': PASSED },
    { 'lab-its-01-ticket-triage': PASSED, [LAB11]: PASSED, 'lab-its-02-device-manager': PASSED, 'lab-its-02-print-spooler': PASSED },
  ];
  const shown = async (attempts, consoleCompleted) => {
    const flags = { consoleStarted: consoleCompleted, consoleCompleted };
    const user = student(attempts, { remoteCaseState: { 'its-01': { [LAB11_ID]: flags }, 'its-02': { [LAB2_ID]: flags } } });
    await newBrowser(user);
    seed(LAB11_ID, user, flags);
    seed(LAB2_ID, user, flags);
    return plain({
      m1: moduleLab(1).view(user, HD),
      m2: moduleLab(2).view(user, HD),
      lab11Ready: run('its01Lab1Ready()'),
      cards: ['its-01', 'its-02'].map((key) => run('moduleCompletion')(HD, key, user)),
    });
  };
  for (const attempts of cases) {
    assert.deepEqual(await shown(attempts, true), await shown(attempts, false), `consoleCompleted changes nothing for ${JSON.stringify(Object.keys(attempts))}`);
  }
}

// Source guard: in the Help Desk files, consoleCompleted is only ever a
// default or a value the Finish handlers write. A new read fails here.
async function testConsoleCompletedIsOnlyWrittenNeverRead() {
  const allowed = [/consoleCompleted: false/, /saved\.consoleCompleted = true;/];
  for (const file of ['it-support-module-01.js', 'it-support-module-02.js', 'it-support-shared.js']) {
    const lines = fs.readFileSync(path.join(__dirname, '..', 'portal', file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.includes('consoleCompleted')) return;
      assert.ok(allowed.some((rule) => rule.test(line)), `${file}:${i + 1} uses consoleCompleted beyond a default or a Finish write: ${line.trim()}`);
    });
  }
  // app.js reads it only for SOC Module 1.
  const app = fs.readFileSync(path.join(__dirname, '..', 'portal', 'app.js'), 'utf8').split('\n');
  app.forEach((line, i) => {
    if (!/consoleCompleted/.test(line)) return;
    const context = app.slice(Math.max(0, i - 4), i + 1).join('\n');
    assert.match(context, /soc-01/, `app.js:${i + 1} reads consoleCompleted outside SOC Module 1: ${line.trim()}`);
  });
}

(async () => {
  const tests = [
    testRefusesWrongTypeAndSize,
    testRefusedReplacementRemovesTheEarlierFile,
    testRefusedPickKeepsResubmitOff,
    testBrowserStorageKeepsOnlyTheName,
    testUploadThenInsertWithTheSameId,
    testFailedUploadRecordsNothing,
    testRefusedInsertRemovesTheFiles,
    testFailedCleanupIsLogged,
    testDoubleClickSendsOneSet,
    testResubmitUploadsANewFolder,
    testModuleOneUploadsBothFiles,
    testModuleOnePolicyFlagsReachTheAccount,
    testModuleTwoFileNamesReachTheAccount,
    testBrowserOnlyWorkIsCopiedUp,
    testReloadRestoresPickedFiles,
    testModuleOneReloadRestoresPickedFiles,
    testRefusedPickDeletesTheCopy,
    testClearedSiteDataAsksForTheFileAgain,
    testFileReplacedInAnotherBrowserIsNotRestored,
    testSubmittedLabCopiesAreNotRestored,
    testSignOutDeletesTheCopies,
    testSecondStudentSeesNothingOfTheFirst,
    testReturnedLabOneResubmitsWithRestoredFiles,
    testConsoleCompletedChangesNothingShown,
    testConsoleCompletedIsOnlyWrittenNeverRead,
  ];
  let failed = 0;
  for (const test of tests) {
    try {
      await test();
      console.log(`ok   ${test.name}`);
    } catch (err) {
      failed += 1;
      console.log(`FAIL ${test.name}\n     ${String(err && err.message).split('\n')[0]}`);
    }
  }
  if (failed) {
    console.log(`${failed} of ${tests.length} failed`);
    process.exit(1);
  }
  console.log(`all ${tests.length} passed`);
})();

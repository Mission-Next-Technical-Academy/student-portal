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

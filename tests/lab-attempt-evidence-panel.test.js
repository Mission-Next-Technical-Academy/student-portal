// Faculty Lab Attempts: the evidence-file panel on a review card.
//
//   - Renders only for attempts whose result lists evidence_files, so SOC and
//     every other program's cards are unchanged.
//   - Offers Open only for a path directly inside that attempt's own folder,
//     <track>/<user>/<module>/<lab>/<attempt id>/; anything else reads
//     "File unavailable".
//   - Open asks Storage for a five-minute link under the reviewer's session,
//     and says "File unavailable" if Storage refuses.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
const plain = (value) => JSON.parse(JSON.stringify(value));

const USER = '5b0e8f2c-1111-4222-8333-944455556666';
const OTHER = '7c1f9a3d-2222-4333-8444-a55566667777';
const ATTEMPT = '9c3a1b2d-3333-4444-8555-b66677778888';
const LAB21 = 'lab-its-02-vm-build';
const FOLDER = `HDESK/${USER}/its-02/${LAB21}/${ATTEMPT}`;

const hdRow = (files) => ({
  id: ATTEMPT, user_id: USER, student_id: 'S-HDESK-1', track_code: 'HDESK', lab_key: LAB21,
  score: 100, pass_threshold: 70, completed_at: '2026-10-15T10:00:00Z',
  result: { evidence: files.length, evidence_files: files },
});
const evidence = (field, path, name = `${field}.png`) => ({ field, label: field === 'evDesktop' ? 'Finished Windows desktop' : 'VM settings summary', path, name, size: 2048, type: 'image/png' });
const panel = (row) => run('itsEvidenceReviewPanel')(row);
const openButtons = (html) => [...html.matchAll(/data-its-evidence-open="([^"]+)"/g)].map((m) => m[1]);

function testOwnFolderGetsOpen() {
  const html = panel(hdRow([evidence('evDesktop', `${FOLDER}/evDesktop.png`), evidence('evVmSettings', `${FOLDER}/evVmSettings.jpg`, 'settings.jpg')]));
  assert.match(html, /Student evidence files \(2\)/);
  assert.match(html, /Finished Windows desktop · <span[^>]*>evDesktop\.png<\/span>/);
  assert.match(html, /VM settings summary · <span[^>]*>settings\.jpg<\/span>/);
  assert.deepEqual(openButtons(html), [`${FOLDER}/evDesktop.png`, `${FOLDER}/evVmSettings.jpg`]);
  assert.doesNotMatch(html, /File unavailable/);
}

function testOtherPathsAreUnavailable() {
  const bad = [
    `HDESK/${OTHER}/its-02/${LAB21}/${ATTEMPT}/evDesktop.png`, // another student
    `HDESK/${USER}/its-02/${LAB21}/0a0a0a0a-0000-4000-8000-000000000000/evDesktop.png`, // another attempt
    `SOCAN/${USER}/its-02/${LAB21}/${ATTEMPT}/evDesktop.png`, // another course
    `HDESK/${USER}/its-01/${LAB21}/${ATTEMPT}/evDesktop.png`, // another module
    `HDESK/${USER}/its-02/lab-its-02-vm-snapshot-server/${ATTEMPT}/evDesktop.png`, // another lab
    `${FOLDER}/nested/evDesktop.png`, // a subfolder
    `${FOLDER}/`, // the folder itself
    `${FOLDER}evil/evDesktop.png`, // a look-alike folder
    null,
  ];
  const html = panel(hdRow(bad.map((path) => evidence('evDesktop', path))));
  assert.deepEqual(openButtons(html), [], 'no Open button for a path outside the attempt folder');
  assert.equal((html.match(/File unavailable/g) || []).length, bad.length);
}

function testRowWithoutIdsIsUnavailable() {
  const row = { ...hdRow([evidence('evDesktop', `${FOLDER}/evDesktop.png`)]), user_id: undefined };
  assert.deepEqual(openButtons(panel(row)), []);
}

function testEscapesStudentText() {
  const html = panel(hdRow([evidence('evDesktop', `${FOLDER}/evDesktop.png`, '<img src=x onerror=alert(1)>.png')]));
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
}

function testOtherProgramsUnchanged() {
  assert.equal(panel({ id: 'a', user_id: USER, track_code: 'SOCAN', lab_key: 'lab-siem-triage', result: { case_record: {} } }), '');
  assert.equal(panel({ id: 'a', result: {} }), '');
  assert.equal(panel({ id: 'a', result: null }), '');
  assert.equal(panel({ id: 'a', result: { evidence: 2 } }), '', 'an older Help Desk attempt with only a count');

  const socRow = { id: 'soc-1', user_id: USER, student_id: 'S-SOC-1', track_code: 'SOCAN', lab_key: 'lab-siem-triage', score: 80, pass_threshold: 70, completed_at: '2026-10-15T10:00:00Z', result: { breakdown: { triage: 8 } } };
  const card = run('adminAttemptReviewCard')({ lead: socRow, ids: [socRow.id], name: 'Prove It', labTitles: ['SIEM triage'] }, false);
  assert.doesNotMatch(card, /data-its-evidence-panel/, 'SOC review cards have no evidence panel');

  const hd = hdRow([evidence('evDesktop', `${FOLDER}/evDesktop.png`)]);
  const hdCard = run('adminAttemptReviewCard')({ lead: hd, ids: [hd.id], name: 'Prove It', labTitles: ['Build Your Windows Client VM'] }, false);
  assert.match(hdCard, new RegExp(`data-its-evidence-panel="${ATTEMPT}"`), 'the Help Desk review card shows the panel');
}

async function testOpenAsksForAShortLink() {
  run('window.open = (url, target) => { const tab = { url, target, closed: false, location: { href: url }, close() { this.closed = true; } }; window.__tabs.push(tab); return tab; }; window.__tabs = [];');
  const status = { textContent: 'x', innerHTML: '' };
  const button = { dataset: { itsEvidenceOpen: `${FOLDER}/evDesktop.png` }, parentElement: { querySelector: () => status } };

  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = (call) => (call.op === 'createSignedUrl' ? { data: { signedUrl: 'https://stub.supabase.co/storage/v1/object/sign/x?token=t' }, error: null } : { data: null, error: null });
  await run('itsOpenEvidenceFile')(button);
  const [call] = ctx.supabaseCalls;
  assert.equal(call.table, 'storage:lab-evidence');
  assert.deepEqual(plain(call.payload), { path: `${FOLDER}/evDesktop.png`, expiresIn: 300 });
  const tabs = run('window.__tabs');
  assert.equal(tabs[0].location.href, 'https://stub.supabase.co/storage/v1/object/sign/x?token=t');
  assert.equal(tabs[0].opener, null, 'the file tab cannot reach back into the portal');
  assert.equal(status.textContent, '');

  ctx.supabaseResponder = () => ({ data: null, error: { message: 'Object not found' } });
  await run('itsOpenEvidenceFile')(button);
  assert.equal(run('window.__tabs')[1].closed, true, 'the empty tab closes');
  assert.equal(status.textContent, 'File unavailable');
}

(async () => {
  const tests = [
    testOwnFolderGetsOpen,
    testOtherPathsAreUnavailable,
    testRowWithoutIdsIsUnavailable,
    testEscapesStudentText,
    testOtherProgramsUnchanged,
    testOpenAsksForAShortLink,
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

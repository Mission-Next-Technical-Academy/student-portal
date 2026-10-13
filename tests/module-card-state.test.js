// Module card states on the program page.
//
// Two contracts:
//   1. Programs without `truthfulModuleStates` (SOC, AI/ML, Electrical) render
//      exactly what they rendered before that flag existed. Their card HTML is
//      compared with a snapshot captured from master at f67bde1.
//      Regenerate only on purpose: UPDATE_LEGACY_SNAPSHOT=1 node tests/module-card-state.test.js
//   2. Opted-in programs (Help Desk) derive every card state from database
//      data alone; browser storage never changes the result.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPortal } = require('./portal-vm');

const SNAPSHOT = path.join(__dirname, 'fixtures', 'module-card-legacy-snapshot.json');
const ctx = loadPortal();
const run = (code) => require('node:vm').runInContext(code, ctx);
const program = (slug) => run(`PROGRAMS.find((p) => p.slug === ${JSON.stringify(slug)})`);

function makeUser(slug, trackCode, data = {}) {
  return {
    userId: `user-${slug}`,
    email: `${slug}@test.invalid`,
    trackCode,
    enrollments: [{ programSlug: slug, status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    openLabRedosByModuleKey: {},
    latestLabAttemptByKey: {},
    ...data,
  };
}

const finished = (extra = {}) => ({ completedAt: '2026-10-01T10:00:00Z', reviewedAt: null, redoRequested: false, ...extra });
const approved = (extra = {}) => finished({ reviewedAt: '2026-10-02T10:00:00Z', ...extra });

function setEngagement(user, engagement) {
  ctx.localStorage.clear();
  if (engagement) ctx.localStorage.setItem(run('moduleEngagementKey')(user), JSON.stringify(engagement));
}

/* ------------------------------------------------- 1. non-opted-in programs */

function legacyScenarios() {
  const out = {};
  const cases = [
    ['soc-analyst', 'SOCAN', ['soc-01', 'soc-02'], { required: 'lab-soc-escalation', practice: 'lab-soc-environment' }],
    ['ai-ml', 'AIENG', ['aim-01', 'aim-02'], { required: 'lab-aim-01-cli-utility' }],
  ];
  cases.forEach(([slug, track, [first, second], labs]) => {
    const p = program(slug);
    const scenarios = {
      fresh: {},
      openedInThisBrowser: { engagement: { openedModules: [`${slug}:${first}`], completedLabs: [] } },
      labDoneInThisBrowser: { engagement: { openedModules: [], completedLabs: [`${slug}:${first}:${labs.required}`] } },
      remoteInProgressRow: { data: { remoteModuleProgress: { [first]: 'in_progress' } } },
      requiredSubmitted: { data: { latestLabAttemptByKey: { [labs.required]: finished() } } },
      requiredApprovedNotVerified: { data: { latestLabAttemptByKey: { [labs.required]: approved() } } },
      redo: { data: {
        latestLabAttemptByKey: { [labs.required]: finished({ reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true }) },
        openLabRedosByModuleKey: { [first]: { labKey: labs.required, labTitle: 'Returned lab', feedback: [{ item_label: 'Notes', comment: 'Add the log line.' }] } },
      } },
      redoNoNotes: { data: { openLabRedosByModuleKey: { [first]: { labKey: labs.required, labTitle: 'Returned lab', feedback: [] } } } },
      verifiedComplete: { data: { remoteVerifiedModuleProgress: { [first]: true }, latestLabAttemptByKey: { [labs.required]: approved() } } },
      verifiedCompleteWithRedo: { data: {
        remoteVerifiedModuleProgress: { [first]: true },
        openLabRedosByModuleKey: { [first]: { labKey: labs.required, labTitle: 'Returned lab', feedback: [] } },
      } },
      secondModuleSubmitted: { data: {
        remoteVerifiedModuleProgress: { [first]: true },
        latestLabAttemptByKey: Object.fromEntries(run('LABS').filter((l) => l.module === second).map((l) => [l.key, finished()])),
      } },
    };
    if (labs.practice) scenarios.practiceSubmittedOnly = { data: { latestLabAttemptByKey: { [labs.practice]: finished() } } };
    Object.entries(scenarios).forEach(([name, scenario]) => {
      const user = makeUser(slug, track, scenario.data);
      setEngagement(user, scenario.engagement);
      [first, second].forEach((key) => {
        out[`${slug}/${name}/${key}`] = run('moduleCard')(p, key, user);
      });
    });
  });
  const electrical = program('electrical');
  const elecUser = makeUser('electrical', 'ELECT');
  setEngagement(elecUser, null);
  out['electrical/fresh/elec-01'] = run('moduleCard')(electrical, Object.keys(electrical.modules)[0], elecUser);
  ctx.localStorage.clear();
  return out;
}

{
  const actual = legacyScenarios();
  if (process.env.UPDATE_LEGACY_SNAPSHOT === '1') {
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, `${JSON.stringify(actual, null, 2)}\n`);
    console.log(`wrote ${Object.keys(actual).length} legacy card snapshots`);
  } else {
    const expected = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
    Object.keys(expected).forEach((key) => assert.equal(actual[key], expected[key], `legacy card changed: ${key}`));
  }
}

/* ------------------------------------------- 2. opted-in programs (Help Desk) */

const HD = program('it-support');
assert.equal(HD.truthfulModuleStates, true, 'Help Desk opts in');
['soc-analyst', 'ai-ml', 'electrical'].forEach((slug) => {
  assert.notEqual(program(slug).truthfulModuleStates, true, `${slug} does not opt in`);
  assert.equal(program(slug).stateLabels, undefined, `${slug} keeps the default labels`);
});
assert.equal(run('STATE_STYLES').complete.label, 'Complete', 'default labels unchanged');

const LAB_1 = 'lab-its-01-lms-validation';
const LAB_2 = 'lab-its-01-ticket-triage';
const TITLE_1 = 'LMS & Environment Validation';
const TITLE_2 = 'A Day in the Life of an L1 Technician';
// course_module_labs as loaded by fetchUserDetails (same rows as the migrations).
const REGISTRY = Object.fromEntries(Object.keys(HD.modules).map((key) => [key, run('LABS').filter((l) => l.module === key).map((l) => l.key)]));

const hdUser = (data = {}) => makeUser('it-support', 'HDESK', { requiredLabsByModuleKey: REGISTRY, openLabRedoFeedbackByLabKey: {}, ...data });
const pill = (html) => (/<i class="ri-[^"]+"><\/i>([^<]+)\n/.exec(html) || [])[1];
const dot = (html) => /mnt-module-completion-dot[^>]*aria-label="([^"]*)"/.exec(html)[1];
const panel = (html) => (/<div [^>]*data-module-lab-status>[\s\S]*?<\/div>/.exec(html) || [''])[0];
const lines = (html) => [...panel(html).matchAll(/<li data-lab-status="([a-z_]+)">([^<]*)/g)].map((m) => [m[1], m[2].replace(/&amp;/g, '&')]);
function card(user, key = 'its-01', prog = HD, engagement = null) {
  setEngagement(user, engagement);
  const html = run('moduleCard')(prog, key, user);
  const state = run('moduleCardState')(prog, key, user, run('hasModuleAccess')(user, prog.slug, key)).state;
  ctx.localStorage.clear();
  return { html, state, label: pill(html), dot: dot(html), panel: panel(html), lines: lines(html) };
}

const PASSED_DOT = 'Module Passed: all required labs passed and reviewed by your instructor.';
const NOT_PASSED_DOT = 'Module not passed yet: complete the module and submit every required lab for review by your instructor.';

// Not Started: no rows anywhere.
{
  const c = card(hdUser());
  assert.deepEqual([c.state, c.label, c.dot, c.panel], ['not_started', 'Not Started', NOT_PASSED_DOT, '']);
  assert.match(c.html, /data-module-primary-action>Start Module</);
}

// Browser data alone never changes a state: engagement flags and a LabRuntime
// coach record with no database rows still read Not Started.
{
  const user = hdUser();
  run('LabRuntime').save('its-coach-its-01-v1', user, { consoleStarted: true, consoleCompleted: true });
  const c = card(user, 'its-01', HD, {
    openedModules: ['it-support:its-01'],
    completedLabs: [`it-support:its-01:${LAB_1}`, `it-support:its-01:${LAB_2}`],
  });
  assert.deepEqual([c.state, c.label], ['not_started', 'Not Started']);
  ctx.localStorage.clear();
}

// "New device": a module_progress row with empty browser storage is In Progress.
{
  const c = card(hdUser({ remoteModuleProgress: { 'its-01': 'in_progress' } }));
  assert.deepEqual([c.state, c.label, c.panel], ['in_progress', 'In Progress', '']);
  assert.match(c.html, /data-module-primary-action>Continue Module</);
}

// Any lab attempt for the module (here a Learn It knowledge check) is In Progress.
{
  const c = card(hdUser({ latestLabAttemptByKey: { 'its-01-knowledge-check': finished() } }));
  assert.equal(c.state, 'in_progress');
}

// One of two required labs submitted: In Progress with the count and per-lab
// lines, and no promise that approval alone unlocks the next module.
{
  const c = card(hdUser({ remoteModuleProgress: { 'its-01': 'in_progress' }, latestLabAttemptByKey: { [LAB_1]: finished() } }));
  assert.deepEqual([c.state, c.label], ['in_progress', 'In Progress']);
  assert.match(c.panel, /1 of 2 required labs submitted/);
  assert.deepEqual(c.lines, [['waiting', `${TITLE_1}: waiting on your instructor.`], ['not_submitted', `${TITLE_2}: not submitted yet.`]]);
  assert.match(c.panel, /The next module unlocks once every required lab is submitted and approved\./);
  assert.doesNotMatch(c.panel, /as soon as/);
}

// Every required lab submitted, none reviewed: Submitted for Faculty Review.
{
  const c = card(hdUser({ latestLabAttemptByKey: { [LAB_1]: finished(), [LAB_2]: finished() } }));
  assert.deepEqual([c.state, c.label], ['awaiting_approval', 'Submitted for Faculty Review']);
  assert.match(c.panel, /2 of 2 required labs submitted/);
  assert.match(c.panel, /The next module unlocks as soon as your instructor approves the remaining labs\./);
}

// One approved, one waiting: still Submitted for Faculty Review; singular promise.
{
  const c = card(hdUser({ latestLabAttemptByKey: { [LAB_1]: approved(), [LAB_2]: finished() } }));
  assert.equal(c.state, 'awaiting_approval');
  assert.deepEqual(c.lines, [['passed', `${TITLE_1} passed.`], ['waiting', `${TITLE_2}: waiting on your instructor.`]]);
  assert.match(c.panel, /approves the remaining lab\./);
}

// A superseded latest attempt does not count as submitted.
{
  const c = card(hdUser({ latestLabAttemptByKey: { [LAB_1]: finished(), [LAB_2]: finished({ supersededAt: '2026-10-03T00:00:00Z' }) } }));
  assert.equal(c.state, 'in_progress');
  assert.deepEqual(c.lines.map((l) => l[0]), ['waiting', 'not_submitted']);
}

// Returned for Revision beats Submitted for Faculty Review; notes follow the line.
{
  const c = card(hdUser({
    latestLabAttemptByKey: { [LAB_1]: finished(), [LAB_2]: finished({ reviewedAt: '2026-10-02T10:00:00Z', redoRequested: true }) },
    openLabRedoFeedbackByLabKey: { [LAB_2]: [{ item_label: 'Evidence', comment: 'Attach the Event Viewer entry.' }] },
  }));
  assert.deepEqual([c.state, c.label], ['needs_redo', 'Returned for Revision']);
  assert.deepEqual(c.lines, [['waiting', `${TITLE_1}: waiting on your instructor.`], ['returned', `${TITLE_2} returned for revision.`]]);
  assert.match(c.panel, /<strong>Evidence:<\/strong> Attach the Event Viewer entry\./);
  assert.match(c.panel, /1 of 2 required labs submitted/);
  assert.doesNotMatch(c.html, /Redo requested/);
}

// Passed: verified record complete, every lab approved.
{
  const c = card(hdUser({ remoteVerifiedModuleProgress: { 'its-01': true }, latestLabAttemptByKey: { [LAB_1]: approved(), [LAB_2]: approved() } }));
  assert.deepEqual([c.state, c.label, c.dot, c.panel], ['complete', 'Passed', PASSED_DOT, '']);
  assert.match(c.html, /data-module-primary-action>Review Module</);
  // Module 2 unlocks once Module 1 has passed.
  assert.equal(card(hdUser({ remoteVerifiedModuleProgress: { 'its-01': true } }), 'its-02').state, 'not_started');
}

// Returned for Revision beats a verified complete record.
{
  const c = card(hdUser({ remoteVerifiedModuleProgress: { 'its-01': true }, latestLabAttemptByKey: { [LAB_1]: approved(), [LAB_2]: finished({ reviewedAt: 'x', redoRequested: true }) } }));
  assert.equal(c.state, 'needs_redo');
}

// Every lab approved but the record is not complete yet: In Progress, no promise.
{
  const c = card(hdUser({ latestLabAttemptByKey: { [LAB_1]: approved(), [LAB_2]: approved() } }));
  assert.equal(c.state, 'in_progress');
  assert.match(c.panel, /Every required lab is approved\. Open the module to finish its remaining steps\./);
}

// Locked beats everything, including a returned lab on the locked module.
{
  const lab = run('LABS').find((l) => l.module === 'its-02').key;
  const c = card(hdUser({ latestLabAttemptByKey: { [lab]: finished({ redoRequested: true }) } }), 'its-02');
  assert.deepEqual([c.state, c.label], ['locked', 'Locked']);
}

// The required list comes from course_module_labs, not the LABS catalogue...
{
  const c = card(hdUser({ requiredLabsByModuleKey: { ...REGISTRY, 'its-01': [LAB_2] }, latestLabAttemptByKey: { [LAB_2]: finished() } }));
  assert.equal(c.state, 'awaiting_approval');
  assert.match(c.panel, /1 of 1 required lab submitted/);
}
// ...and falls back to the catalogue only when that read failed.
{
  const c = card(hdUser({ requiredLabsByModuleKey: null, latestLabAttemptByKey: { [LAB_1]: finished() } }));
  assert.match(c.panel, /1 of 2 required labs submitted/);
}

// Practice Submitted: only labs explicitly marked phase 'practice' count.
{
  const labs = run('LABS');
  labs.push({ key: 'lab-its-01-practice-test', module: 'its-01', title: 'Practice ticket', phase: 'practice', kind: 'lab' });
  try {
    assert.equal(card(hdUser({ latestLabAttemptByKey: { 'lab-its-01-practice-test': finished() } })).state, 'practice_submitted');
    assert.equal(card(hdUser({ latestLabAttemptByKey: { 'lab-its-01-practice-test': finished() } })).label, 'Practice Submitted');
    // Once a Prove It attempt exists, the module has moved on.
    assert.equal(card(hdUser({ latestLabAttemptByKey: { 'lab-its-01-practice-test': finished(), [LAB_1]: finished() } })).state, 'in_progress');
    // The catalogue fallback never counts a practice lab as required.
    assert.match(card(hdUser({ requiredLabsByModuleKey: null, latestLabAttemptByKey: { [LAB_1]: finished() } })).panel, /1 of 2 required/);
  } finally {
    labs.splice(labs.findIndex((l) => l.key === 'lab-its-01-practice-test'), 1);
  }
  // Unmarked labs never produce it (dormant today).
  assert.equal(card(hdUser({ requiredLabsByModuleKey: { ...REGISTRY, 'its-01': [LAB_1] }, latestLabAttemptByKey: { [LAB_2]: finished() } })).state, 'in_progress');
}

// The Passed text never claims module content was checked, even for soc-01
// (whose record does check content) when SOC opts in.
{
  const soc = { ...program('soc-analyst'), truthfulModuleStates: true };
  const user = makeUser('soc-analyst', 'SOCAN', { requiredLabsByModuleKey: { 'soc-01': ['lab-soc-escalation'] },
    remoteVerifiedModuleProgress: { 'soc-01': true }, latestLabAttemptByKey: { 'lab-soc-escalation': approved() } });
  const c = card(user, 'soc-01', soc);
  assert.deepEqual([c.state, c.label, c.dot], ['complete', 'Complete', PASSED_DOT]);
  assert.doesNotMatch(c.html, /module content/);
  // SOC's practice-lab submission no longer reads as awaiting review once opted in.
  const practiceOnly = makeUser('soc-analyst', 'SOCAN', { requiredLabsByModuleKey: { 'soc-01': ['lab-soc-escalation'] }, latestLabAttemptByKey: { 'lab-soc-environment': finished() } });
  assert.equal(card(practiceOnly, 'soc-01', soc).state, 'in_progress');
}

/* ---------------------------------- 3. database reads and the "opened" write */

const flush = () => new Promise((resolve) => setImmediate(resolve));

(async () => {
  // fetchUserDetails loads course_module_labs and superseded_at.
  ctx.supabaseResponder = (call) => {
    if (call.table === 'course_module_labs') return { data: [{ module_key: 'its-01', lab_key: LAB_1 }, { module_key: 'its-01', lab_key: LAB_2 }], error: null };
    if (call.table === 'lab_attempts') return { data: [
      { id: 'a2', lab_key: LAB_1, completed_at: '2026-10-02T00:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null },
      { id: 'a1', lab_key: LAB_1, completed_at: '2026-10-01T00:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: '2026-10-02T00:00:00Z' },
    ], error: null };
    return { data: [], error: null };
  };
  let details = await run('fetchUserDetails')('u1', 'HDESK');
  assert.deepEqual(JSON.parse(JSON.stringify(details.requiredLabsByModuleKey)), { 'its-01': [LAB_1, LAB_2] });
  assert.equal(details.latestLabAttemptByKey[LAB_1].supersededAt, null, 'latest attempt per lab is kept');
  ctx.supabaseResponder = (call) => (call.table === 'course_module_labs' ? { data: null, error: { message: 'boom' } } : { data: [], error: null });
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try { details = await run('fetchUserDetails')('u1', 'HDESK'); } finally { console.error = originalError; }
  assert.equal(details.requiredLabsByModuleKey, null, 'a failed registry read falls back to the catalogue');
  assert.ok(errors.some((e) => e.includes('course_module_labs fetch failed')));

  // The "opened" write fires whenever the database has no row, even though
  // this browser already remembers opening the module.
  const opened = async (remoteModuleProgress, rowState) => {
    const user = hdUser({ remoteModuleProgress });
    ctx.localStorage.clear();
    ctx.localStorage.setItem(run('moduleEngagementKey')(user), JSON.stringify({ openedModules: ['it-support:its-01'], completedLabs: [] }));
    ctx.supabaseCalls.length = 0;
    ctx.supabaseResponder = (call) => (call.op === 'select' && call.table === 'module_progress'
      ? { data: rowState ? { state: rowState } : null, error: null } : { data: null, error: null });
    run('markModuleContentOpened')(user, 'it-support', 'its-01');
    for (let i = 0; i < 5; i += 1) await flush();
    ctx.localStorage.clear();
    // Copy out of the vm realm so deepEqual compares plain values.
    return { user, calls: JSON.parse(JSON.stringify(ctx.supabaseCalls.filter((c) => c.table === 'module_progress'))) };
  };
  let result = await opened({}, null);
  assert.deepEqual(result.calls.map((c) => c.op), ['select', 'upsert']);
  assert.equal(result.calls[0].filters.track_code, 'HDESK', 'the read is scoped to the track');
  assert.equal(result.calls[1].payload.state, 'in_progress');
  assert.equal(result.calls[1].options.ignoreDuplicates, true, 'no row yet: insert only, never overwrite a racing tab');
  assert.equal(result.user.remoteModuleProgress['its-01'], 'in_progress', 'session copy updated after the write');
  result = await opened({}, 'complete');
  assert.deepEqual(result.calls.map((c) => c.op), ['select'], 'a complete row is never regressed');
  result = await opened({}, 'in_progress');
  assert.deepEqual(result.calls.map((c) => c.op), ['select'], 'an in_progress row keeps its started_at');
  // A row in some other state (e.g. created by a lab draft) is still promoted.
  result = await opened({}, 'not_started');
  assert.deepEqual(result.calls.map((c) => [c.op, c.options && c.options.ignoreDuplicates]), [['select', undefined], ['upsert', false]]);
  result = await opened({ 'its-01': 'in_progress' }, null);
  assert.deepEqual(result.calls, [], 'no round trip when this session already has the row');

  // Non-opted-in programs: opening a module, including the new database write
  // and its in-session copy, renders exactly master's "opened" card.
  {
    const expected = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
    for (const [slug, track, key] of [['soc-analyst', 'SOCAN', 'soc-01'], ['ai-ml', 'AIENG', 'aim-01']]) {
      const user = makeUser(slug, track);
      ctx.localStorage.clear();
      ctx.supabaseResponder = () => ({ data: null, error: null });
      run('markModuleContentOpened')(user, slug, key);
      for (let i = 0; i < 5; i += 1) await flush();
      assert.equal(user.remoteModuleProgress[key], 'in_progress', 'the write landed');
      assert.equal(run('moduleCard')(program(slug), key, user), expected[`${slug}/openedInThisBrowser/${key}`], `${slug} card after open matches master`);
      ctx.localStorage.clear();
    }
  }

  // A saved Help Desk submit updates the card's copy without a reload; SOC's
  // copy (kept by its own module pages) is left alone.
  ctx.supabaseResponder = () => ({ data: null, error: null });
  const hd = hdUser();
  assert.equal(await run('recordLabAttempt')(hd, LAB_1, { state: 'complete' }), true);
  assert.equal(card(hd).state, 'in_progress');
  assert.ok(hd.latestLabAttemptByKey[LAB_1].completedAt);
  const socUser = makeUser('soc-analyst', 'SOCAN');
  await run('recordLabAttempt')(socUser, 'lab-soc-escalation', { state: 'complete' });
  assert.deepEqual(Object.keys(socUser.latestLabAttemptByKey), []);

  console.log('module-card-state: ok');
})().catch((error) => { console.error(error); process.exit(1); });

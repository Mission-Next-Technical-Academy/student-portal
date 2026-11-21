// Help Desk Module 1 page (portal/it-support-module-01.js), rebuilt from the
// Week 1 plan:
//
//   - Orientation first (Lesson 1.1): the program, the LMS, technology setup,
//     the Acceptable Use Policy, help and the chain of command, policies and
//     the course calendar, with marked "to be confirmed" placeholders. No
//     sandbox, virtual machine or second login anywhere.
//   - Orientation tasks, never labs: the policy acknowledgement is saved to
//     the account (module_progress.case_state) with its version and time,
//     without Lab 1.1. An acknowledgement of the earlier text asks again.
//     The orientation check can be retaken; only its completion is saved.
//     Neither records a lab attempt or a score.
//   - Learn It: three readings and three inline SVG diagrams with the plan's
//     exact words, role="img" and an aria-label; a wide and a phone layout.
//   - The Learn It (8) and A+ (4) checks: tests/hdesk-m01-checks.test.js.
//   - The rail: orientation, its check, the labs and the two checks count
//     toward the percent; Sources doesn't. The checks never lock a lab.
//
// The portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
ctx.render = () => {};

const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const page = () => run("MODULE_LABS['it-support/1']");
const STATE_ID = 'its01-lms-validation-v1';
const plain = (value) => JSON.parse(JSON.stringify(value));
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, '’').replace(/\s+/g, ' ');

function hdUser(extra = {}) {
  return {
    userId: '7d1e2f3a-1111-4222-8333-944455556666',
    email: 'hdesk-m01@test.invalid',
    trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {},
    remoteVerifiedModuleProgress: {},
    remoteModuleDetail: {},
    latestLabAttemptByKey: {},
    openLabRedoFeedbackByLabKey: {},
    openLabRedosByModuleKey: {},
    remoteCaseState: {},
    ...extra,
  };
}

// A new browser: no storage, no page memory.
function fresh() {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run("['orientation', 'learn', 'aplus'].forEach((k) => { its01CheckAnswers[k] = {}; its01CheckPicks[k] = {}; })");
}

const calls = (table, op) => ctx.supabaseCalls.filter((c) => c.table === table && (!op || c.op === op));
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 5; i += 1) await settle();
}
// The Module 1 state this browser last sent to the account.
function savedState() {
  const writes = calls('module_progress').filter((c) => c.payload && c.payload.case_state);
  return writes.length ? plain(writes[writes.length - 1].payload.case_state[STATE_ID]) : null;
}
const section = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `section ${id}`);
  return html.slice(start, html.indexOf('</section>', start));
};
const checkHtml = (html, key) => {
  const start = html.indexOf(`data-its01-check="${key}"`);
  assert.ok(start >= 0, `check ${key}`);
  return html.slice(start, html.indexOf('its01-check-footer', start) + 400);
};
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { cls: match[1], text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
}
const percent = (html) => (/<span class="munified-percent">(\d+)%<\/span>/.exec(html) || [null, null])[1];

/* ----------------------------------------------------------- the page */

function testOrientationComesFirst() {
  fresh();
  const html = page().view(hdUser(), HD);
  const order = ['its01-orientation', 'its01-lessons', 'its01-checks', 'its01-lab-1-2', 'its01-practice-tickets', 'its01-prove-it', 'its01-sources']
    .map((id) => html.indexOf(`id="${id}"`));
  assert.ok(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])), 'orientation, readings, checks, Lab 1.1 (guided), Lab 1.2 (practice tickets), Prove It, Sources');

  const orientation = text(section(html, 'its01-orientation'));
  for (const heading of ['Program orientation: how this program runs', 'LMS navigation', 'Technology setup', 'Acceptable Use Policy', 'Getting help and the chain of command', 'Policies you need to know', 'Course calendar', 'Start here: Program Orientation', 'Before you begin', 'Orientation check',
    'Attendance and identity', 'Academic integrity', 'Grades and progress', 'Records, privacy, withdrawal and refunds', 'Career Readiness Core (M360-101)']) {
    assert.ok(orientation.includes(heading), `orientation has "${heading}"`);
  }
  assert.ok(orientation.includes('Find it in the LMS'));
  // "not graded" is said once, at the top of the section.
  assert.equal((orientation.match(/not graded|isn’t graded/gi) || []).length, 1, 'orientation says "not graded" once');
  assert.ok(orientation.includes('pay all tuition and fees in full'));
  assert.ok(orientation.includes('Your score and your instructor’s feedback appear on the module’s card once your instructor has finalized them: open See your marked lab.'));
  assert.doesNotMatch(orientation, /gradebook/i);
  assert.match(orientation, /Where your live session links come from: To be confirmed: where the links are posted ?\./);
  assert.ok(orientation.includes('Office of Student Services'));
  assert.ok(orientation.includes('(850) 974-5763 · info@mntacademy.com'));
  assert.ok(orientation.includes('325 West Gaines Street, Suite 1414, Tallahassee, FL 32399-0400, toll-free (888) 224-6684'));
  assert.ok(orientation.includes('Each Prove It allows 3 attempts; after a second fail, you meet with your instructor before trying again.'));
  assert.match(orientation, /isn’t graded and isn’t a lab/);

  // Clearly marked placeholders: technical support, the AI-tools policy, the
  // course calendar and the catalog link.
  assert.match(orientation, /To be confirmed: support channel and hours ?\. Tell them/);
  assert.match(orientation, /To be confirmed: policy on using AI tools in coursework ?\./);
  assert.doesNotMatch(orientation, /\.\s*\./, 'no doubled full stop after a placeholder');
  assert.match(orientation, /To be confirmed Cohort start and end dates, live session days and times, and weekly due dates/);
  const sources = text(section(html, 'its01-sources'));
  assert.ok(sources.includes('School Catalog v1.2 (effective 2026-08-25)'));
  assert.ok(sources.includes('To be confirmed: link to the published catalog.'));
  assert.match(section(html, 'its01-sources'), /href="https:\/\/www\.comptia\.org\/certifications\/a"/);
  assert.doesNotMatch(section(html, 'its01-sources'), /href=""/, 'a placeholder source has no empty link');

  // Removed from the old Module 1, and from technology setup.
  const all = text(html);
  assert.doesNotMatch(all, /Two Logins|sandbox|virtual machine|\bVM\b|lab login|lab-environment|five-step|nothing to install|Nothing to upload/i);
  // "CompTIA" only in Sources & Further Reading.
  assert.doesNotMatch(text(html.replace(section(html, 'its01-sources'), '')), /CompTIA/, 'CompTIA appears only in Sources');
  // "Lab 1.1" is now the guided lab; the old Lab 1.1 is retired.
  assert.doesNotMatch(all, /LMS & Environment Validation/);
  assert.doesNotMatch(html, /lab-its-01-lms-validation/);
  assert.doesNotMatch(html, /data-itsw-evidence-input|data-its-submit=/);
  // Internal plan codes and names stay out of the page.
  assert.doesNotMatch(all, /\bB\d+ rubric|Randy/);
  // Until the shared save can report success, nothing claims it finished.
  assert.doesNotMatch(all, /saved to your account/i);

  assert.match(html, /Start with orientation/);
  // The Prove It suggests Lab 1.1 first only until Lab 1.1 is complete.
  assert.match(section(html, 'its01-prove-it'), /Complete Lab 1.1, the guided lab, first/);
  const lab11Done = hdUser({ latestLabAttemptByKey: { 'lab-its-01-ticket-triage': { completedAt: '2026-11-15T10:00:00Z', reviewedAt: null, redoRequested: false } } });
  const after = page().view(lab11Done, HD);
  assert.match(railRow(after, 'its01-lab-1-2').cls, /mnav-chip-complete/, 'Lab 1.1 is complete');
  assert.doesNotMatch(section(after, 'its01-prove-it'), /Complete Lab 1.1/, 'no "complete Lab 1.1 first" once it is complete');
}

function testReadingsAndDiagrams() {
  fresh();
  const html = page().view(hdUser(), HD);
  const learn = section(html, 'its01-lessons');
  const words = text(learn);
  for (const heading of ['Reading 1. The help desk role and support tiers', 'Reading 2. The troubleshooting method and writing it down', 'Reading 3. Verifying callers and using the knowledge base', 'How to write it down', 'Example note for the printer ticket', 'About priority in Module 1', 'Ticket states in Module 1', 'Triage in Module 1']) {
    assert.ok(words.includes(heading), `Learn It has "${heading}"`);
  }
  assert.ok(words.includes('Every work note has three parts the next technician can use. Reported: what the user said, in their words.'));
  assert.ok(words.includes('Log the ticket with Category Security › Suspicious request, set Caller to Unverified, and assign it to Security Operations (SOC)'));
  for (const h of learn.match(/<h4>[^<]*<\/h4>/g) || []) assert.doesNotMatch(h, /Lesson 1\.\d/, `reading title without "Lesson 1.x ·": ${h}`);
  assert.ok(words.includes('Every company device has an asset tag'));
  assert.ok(words.includes('Escalating an issue is not failing.'));
  assert.ok(words.includes('Test: open the print queue. The job is stuck, so the theory is confirmed.'));
  assert.ok(words.includes('and before you hand over or swap a device such as a loaner'));
  assert.match(learn, /<strong>Never ask for, type or write down a user’s password\.<\/strong>/, 'the password rule is emphasized');
  assert.ok(words.includes('KB-0024 (verifying callers, passwords and unlocks), KB-0071 (damaged devices), KB-0059 (adding a department printer) and KB-0058'));
  assert.ok(words.includes('If the user gives you an error code, search with the exact code'));

  const diagrams = {
    tiers: {
      title: 'Escalating hands the ticket to the tier with the right access',
      words: ['User', 'reports it', 'Tier 1 (you)', 'Service Desk', 'Takes every new contact', 'Fixes known problems', 'Documents everything', 'escalates', 'Tier 2', 'Desktop Support', 'Hands-on hardware', 'Reimaging', 'Complex software', 'Tier 3', 'Systems teams', 'Servers', 'Network design', 'Security engineering', 'The ticket and its notes travel with it, so the user never re-explains'],
    },
    method: {
      title: 'One method for every problem: if a theory fails, loop back',
      words: ['Identify the problem', 'Ask what they see, when it started and what changed. Back up first.', 'Establish a theory of probable cause', 'Start with the simple and likely. Check the knowledge base (KB).', 'Test the theory', 'Confirmed: go on to plan the fix. Not confirmed: loop back.', 'Plan the fix', 'Ask who else it affects before you change anything.', 'Implement or escalate', 'Make the fix, or hand it to the tier that can, with your notes.', 'Verify', 'Confirm it works from the user’s side; prevent a repeat if you can.', 'Document', 'Write down what you found, did and confirmed.', 'Not confirmed: form a new theory or escalate'],
    },
    verify: {
      title: 'No verification, no account change',
      words: ['Caller asks for an account action', 'A reset, an unlock or an access change', 'Verify the caller (KB-0024)', 'Call back on the directory number, never a number the caller gives you', 'Confirm the employee ID', 'A name and department are not enough', 'Verified?', 'Verified: follow the KB article', 'Unlock the account, or guide them through the self-service password reset', 'You never ask for or see a password', 'Not verified: make no change', 'Category: Security › Suspicious request', 'Caller: Unverified', 'Assign to Security Operations (SOC)', 'Log their exact words, number and time'],
    },
  };
  for (const [key, spec] of Object.entries(diagrams)) {
    const fig = (new RegExp(`<figure class="its01-dg" data-its01-diagram="${key}">[\\s\\S]*?</figure>`).exec(learn) || [''])[0];
    assert.ok(fig, `diagram ${key} is in Learn It`);
    const svgs = fig.match(/<svg[\s\S]*?<\/svg>/g) || [];
    assert.equal(svgs.length, 2, `${key}: a wide and a phone layout`);
    for (const svg of svgs) {
      assert.match(svg, /role="img"/);
      assert.ok(svg.includes(`aria-label="${spec.title}"`), `${key}: aria-label is the title`);
      assert.ok(svg.includes(`aria-describedby="its01-dg-${key}-desc"`));
      assert.doesNotMatch(svg, /fill="#|stroke="#|style=/, `${key}: colours come from the stylesheet, not the drawing`);
      const drawn = (svg.match(/<text[^>]*>([^<]*)<\/text>/g) || []).map((t) => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/^\s*•\s*/, '').trim()).join(' ').replace(/\s+/g, ' ');
      for (const word of spec.words) assert.ok(drawn.includes(word), `${key}: "${word}" in the drawing`);
    }
    assert.match(svgs[1], /viewBox="0 0 320 /, `${key}: the phone layout is 320 wide`);
    const desc = (new RegExp(`id="its01-dg-${key}-desc">([^<]*)<`).exec(fig) || [null, ''])[1].replace(/&amp;/g, '&');
    for (const word of spec.words) assert.ok(desc.includes(word), `${key}: "${word}" in the screen-reader description`);
    assert.ok(fig.includes(`<p class="its01-dg-heading">${spec.title}</p>`), `${key}: the title shows above the drawing`);
  }
}

/* ------------------------------------------ Acceptable Use Policy */

async function testPolicyAcknowledgementSavesWithoutLabOne() {
  fresh();
  const user = hdUser();
  let html = page().view(user, HD);
  assert.match(html, /data-its01-aup-checkbox disabled/, 'off until the policy is read');
  assert.equal(run('its01AcknowledgeAup()'), false, 'nothing to acknowledge before reading');

  run('its01MarkAupRead()');
  html = page().view(user, HD);
  assert.doesNotMatch(html, /data-its01-aup-checkbox[^>]*disabled/, 'on once read');
  assert.equal(run('its01AcknowledgeAup()'), true);
  await flush();

  const saved = savedState();
  assert.ok(saved, 'saved to module_progress.case_state');
  assert.equal(saved.aupAcknowledged, true);
  assert.equal(saved.aupVersion, '2026-11-15');
  assert.ok(!Number.isNaN(Date.parse(saved.aupAcknowledgedAt)), 'with the time');
  assert.equal(calls('lab_attempts').length, 0, 'no lab attempt: it is an orientation task');
  assert.equal(calls('storage:lab-evidence').length, 0);

  // Another browser after signing back in: only the account's copy exists.
  fresh();
  const again = hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: saved } } });
  html = page().view(again, HD);
  assert.match(html, /data-its01-aup-checkbox checked disabled/, 'still acknowledged');
  assert.match(text(html), /Acknowledged on [A-Z][a-z]{2} \d{1,2}, \d{4}\./);
  assert.doesNotMatch(text(html), /saved to your account/i, 'the page never claims the account write finished');
  assert.match(railRow(html, 'its01-orientation').cls, /mnav-chip-complete/);
  assert.doesNotMatch(html, /lab-its-01-lms-validation|LMS &amp; Environment Validation/);
}

async function testEarlierAcknowledgementAsksAgain() {
  // Saved by the old Lab 1.1 page: no version.
  fresh();
  const old = { aupScrolled: true, aupAcknowledged: true };
  const user = hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: old } } });
  let html = page().view(user, HD);
  assert.match(text(html), /The Acceptable Use Policy changed on Nov 15, 2026\. Read it again and acknowledge the new version\./);
  assert.match(html, /data-its01-aup-checkbox disabled/, 'reading the old text doesn’t count');
  assert.doesNotMatch(railRow(html, 'its01-orientation').cls, /mnav-chip-complete/);

  run('its01MarkAupRead()');
  assert.equal(run('its01AcknowledgeAup()'), true);
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /changed on Nov 15, 2026/);
  assert.equal(savedState().aupVersion, '2026-11-15');

  // An acknowledgement of the 2026-11-10 text asks again too: the
  // confidentiality wording changed on 2026-11-15.
  fresh();
  const nov10 = { aupAcknowledged: true, aupVersion: '2026-11-10', aupReadVersion: '2026-11-10', aupAcknowledgedAt: '2026-11-12T10:00:00Z' };
  html = page().view(hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: nov10 } } }), HD);
  assert.match(text(html), /The Acceptable Use Policy changed on Nov 15, 2026\. Read it again and acknowledge the new version\./);
  assert.match(html, /data-its01-aup-checkbox disabled/, 'the new text must be read first');
  assert.doesNotMatch(railRow(html, 'its01-orientation').cls, /mnav-chip-complete/);
  assert.ok(text(html).includes('never share, post or screenshot them for use outside this course.'));
}

/* -------------------------------------------------------------- checks */

const ORIENTATION_KEY = [1, 2, 2, 1, 2, 2];
const LEARN_KEY = [1, 2, 1, 1, 1, 1, 1, 3];
const APLUS_KEY = [1, 2, 1, 1];

async function testOrientationCheckRetake() {
  fresh();
  const user = hdUser();
  page().view(user, HD);
  assert.deepEqual(plain(run('ITS01_CHECKS.orientation.questions.map((q) => q.answer)')), ORIENTATION_KEY, 'the plan’s answers: B, C, C, B, C, C');

  // One wrong answer: its own reason, never the right answer.
  run('its01Answer')('orientation', 0, 0);
  let html = page().view(user, HD);
  assert.match(text(checkHtml(html, 'orientation')), /Not quite\. Try another answer\. Your instructor helps with course content/);
  assert.doesNotMatch(checkHtml(html, 'orientation'), /is-answer|The answer is/);
  // Picking again is allowed; the first pick still counts.
  run('its01Answer')('orientation', 0, 1);
  assert.equal(run('its01CheckAnswers.orientation[0]'), 0);
  assert.match(text(checkHtml(page().view(user, HD), 'orientation')), /Correct\./);
  ORIENTATION_KEY.slice(1).forEach((answer, i) => run('its01Answer')('orientation', i + 1, answer));
  await flush();
  html = page().view(user, HD);
  assert.match(text(checkHtml(html, 'orientation')), /Some answers weren’t right\. Press Start again to retake the check\./);
  assert.doesNotMatch(text(checkHtml(html, 'orientation')), /\d+ ?(of|\/) ?6|score|%/i, 'no score');
  assert.notEqual(run('its01State.orientationCheckCompleted'), true);
  assert.match(html, /data-its01-check-reset="orientation"/);

  // Retake: all right.
  run('its01ResetCheck')('orientation');
  assert.deepEqual(plain(run('its01CheckAnswers.orientation')), {});
  ORIENTATION_KEY.forEach((answer, i) => run('its01Answer')('orientation', i, answer));
  await flush();
  const saved = savedState();
  assert.equal(saved.orientationCheckCompleted, true);
  assert.ok(!Number.isNaN(Date.parse(saved.orientationCheckCompletedAt)));
  // LabRuntime adds its own standard fields to every saved state (labId,
  // attempts, score: null, ...); the page adds only these, and no answers.
  const runtime = Object.keys(plain(LabRuntime.load('its01-probe', hdUser(), {})));
  assert.deepEqual(Object.keys(saved).filter((k) => !runtime.includes(k)).sort(), ['aplusCheckCompleted', 'aplusCheckCompletedAt', 'aupAcknowledged', 'aupAcknowledgedAt', 'aupReadVersion', 'aupVersion', 'consoleCompleted', 'consoleStarted', 'learnCheckCompleted', 'learnCheckCompletedAt', 'orientationCheckCompleted', 'orientationCheckCompletedAt']);
  assert.equal(saved.score, 0, 'the runtime default; the page never sets a score');
  assert.equal(calls('lab_attempts').length, 0, 'no lab attempt');

  // After a reload, still complete, and it can be retaken.
  fresh();
  html = page().view(hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: saved } } }), HD);
  assert.match(text(checkHtml(html, 'orientation')), /Orientation check complete \([A-Z][a-z]{2} \d{1,2}, \d{4}\)\. You can retake it any time\./);
  assert.match(railRow(html, 'its01-check-orientation').cls, /mnav-chip-complete/);
  assert.doesNotMatch(checkHtml(html, 'orientation'), /disabled/, 'every answer can be chosen again');
}

// A second student signing in on the same page (no reload) never sees the
// first student's answers.
function testAnswersClearedForAnotherStudent() {
  fresh();
  const first = hdUser();
  page().view(first, HD);
  run('its01Answer')('orientation', 0, 0);
  run('its01Answer')('learn', 0, 1);
  assert.equal(run('its01CheckAnswers.orientation[0]'), 0);
  // The same student re-rendering keeps them.
  page().view(first, HD);
  assert.equal(run('its01CheckAnswers.orientation[0]'), 0, 'kept for the same student');

  const second = hdUser({ userId: '8e2f3a4b-2222-4333-8444-a55566667777', email: 'hdesk-m01b@test.invalid' });
  const html = page().view(second, HD);
  assert.deepEqual(plain(run('its01CheckAnswers')), { orientation: {}, learn: {}, aplus: {} });
  assert.deepEqual(plain(run('its01CheckPicks')), { orientation: {}, learn: {}, aplus: {} });
  assert.doesNotMatch(checkHtml(html, 'orientation'), /disabled|Not quite/, "no answers from the first student");
}

/* ---------------------------------------------------------------- rail */

function testRail() {
  fresh();
  const html = page().view(hdUser(), HD);
  assert.equal(railRow(html, 'its01-orientation').text, 'Orientation');
  assert.equal(railRow(html, 'its01-check-orientation').text, 'Orientation check');
  // The two checks: counted, but never locked, even before Lab 1.1.
  assert.equal(railRow(html, 'its01-check-learn').text, 'Learn It knowledge check');
  assert.equal(railRow(html, 'its01-check-aplus').text, 'A+ check');
  assert.doesNotMatch(railRow(html, 'its01-check-learn').cls, /mnav-chip-locked/);
  // In the rail they sit under Learn It, before Lab 1.1.
  assert.ok(html.indexOf('href="#its01-check-aplus"') < html.indexOf('href="#its01-lab-1-2"'), 'the checks show under Learn It');
  // The two Practice It labs keep their own numbered names (not "Guided Lab");
  // the practice tickets are never locked.
  assert.equal(railRow(html, 'its01-lab-1-2').text, 'Lab 1.1 · Guided Lab');
  assert.equal(railRow(html, 'its01-practice-tickets').text, 'Lab 1.2 · Practice tickets');
  assert.doesNotMatch(railRow(html, 'its01-practice-tickets').cls, /mnav-chip-locked/);
  // Counted: orientation, its check, the readings, Lab 1.1, Lab 1.2, the
  // Prove It and the two checks.
  assert.equal(percent(html), '13');
  const done = page().view(hdUser({ remoteCaseState: { 'its-01': { [STATE_ID]: { aupAcknowledged: true, aupVersion: '2026-11-15', aupReadVersion: '2026-11-15', orientationCheckCompleted: true } } } }), HD);
  assert.equal(percent(done), '38');
  assert.doesNotMatch(done, /href="#its01-lab-1-1"/);
  // Orientation done, the checks not: Lab 1.1 is open, not locked behind them.
  assert.doesNotMatch(railRow(done, 'its01-lab-1-2').cls, /mnav-chip-locked/);
  assert.match(railRow(done, 'its01-lab-1-2').cls, /mnav-chip-current/);
}

/* -------------------------------------------------------------- run */

(async () => {
  const tests = [
    testOrientationComesFirst,
    testReadingsAndDiagrams,
    testPolicyAcknowledgementSavesWithoutLabOne,
    testEarlierAcknowledgementAsksAgain,
    testOrientationCheckRetake,
    testAnswersClearedForAnotherStudent,
    testRail,
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

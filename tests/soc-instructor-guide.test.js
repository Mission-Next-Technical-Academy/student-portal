// SOC Instructor Guide tab (2026-11-19).
//
// Contracts:
//   1. The renderer ships no guide content: the guide (with answer keys) is
//      read after sign-in from public.instructor_guides, never from a portal file.
//   2. It asks only for the SOCAN row and shows "not available" when RLS
//      returns nothing (a student, another course's instructor, signed out).
//   3. A loaded guide renders every section.
//   4. The Course Dashboard shows the tab, to the right of Messages, only in
//      the SOC Analyst workspace and only for staff of that course.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-instructor-guide.js'), 'utf8');
// Structural check: the renderer reads guide fields but never defines any.
// Guide content would appear as data literals (`right: [[`, `scenario: '`...).
for (const pattern of [/\b(right|note|fail|mistakes|points|teach|tell|due)\s*:\s*\[/, /\b(scenario|say|why|skill|plain|exit|assign)\s*:\s*['"`]/, /\bconst\s+(WEEKS|MODULES|RUBRIC)\b/]) {
  assert.ok(!pattern.test(source), `soc-instructor-guide.js must not contain guide content (${pattern})`);
}

const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
const flush = () => new Promise((resolve) => setImmediate(resolve));

async function main() {
  assert.equal(run('SocInstructorGuide.track'), 'SOCAN');

  // 2. No row back (what RLS gives a non-staff account) → "not available".
  run(`supabaseCalls.length = 0; supabaseResponder = () => ({ data: null, error: null });`);
  run('SocInstructorGuide.mount()');
  await flush();
  const call = run('supabaseCalls.find((c) => c.table === "instructor_guides")');
  assert.ok(call, 'mount reads public.instructor_guides');
  assert.deepEqual(JSON.parse(JSON.stringify(call.filters)), { track_code: 'SOCAN' });
  assert.match(run('SocInstructorGuide.panel()'), /not available/);

  // A read error shows a retry, not the raw error text.
  run(`SocInstructorGuide._state.status = 'idle'; supabaseResponder = () => ({ data: null, error: { message: 'permission denied for table instructor_guides' } });`);
  run('SocInstructorGuide.mount()');
  await flush();
  const errorHtml = run('SocInstructorGuide.panel()');
  assert.match(errorHtml, /could not load/);
  assert.match(errorHtml, /data-soc-guide-retry/);
  assert.ok(!errorHtml.includes('permission denied'), 'raw database errors are not shown');

  // 3. A loaded guide renders each section, escaping its text.
  const guide = {
    start: { intro: 'Intro <b>x</b>', steps: ['Open the portal'], course: [['Length', '6 weeks']], modes: [['Learn It', 'Lessons']], chain: ['Observe', 'Decide'] },
    weeks: [{ n: 1, mods: ['M01'], title: 'Week one', hours: 8, goal: 'Goal', tell: ['Tell'], due: [['M01 Prove It', 'Thu']], watch: ['Watch'],
      days: [{ d: 'Mon', mod: 'M01', title: 'Day one', skill: 'Skill', why: 'Why', say: 'Say', review: 'Review', teach: ['Teach'], drive: 'Drive', exit: 'Exit', assign: 'Assign' }] }],
    modules: { M01: { name: 'Module one', hours: 8, plain: 'Plain', learn: ['L'], practice: ['P'],
      prove: [{ title: 'Prove one', ids: 'CASE-1', scored: 'Ticket', right: [['Severity', '`High`']], note: ['note'], points: [['A', 100]], fail: ['fail'], mistakes: ['mistake'] }] } },
    grading: { intro: 'Grade', steps: ['Open Lab Attempts'], scoring: ['Partial credit'], overrule: ['Approve'] },
    rubric: [['Area', 100, ['How']]], rubricRules: ['Rule'], safetyCap: ['Cap'],
  };
  run(`SocInstructorGuide._state.status = 'idle'; supabaseResponder = () => ({ data: { content: ${JSON.stringify(guide)} }, error: null });`);
  run('SocInstructorGuide.mount()');
  await flush();
  const expectView = (view, pattern) => {
    run(`SocInstructorGuide._state.view = ${JSON.stringify(view)}`);
    assert.match(run('SocInstructorGuide.panel()'), pattern, `${view} view renders`);
  };
  expectView('start', /Every class, do these five things/);
  assert.ok(run('SocInstructorGuide.panel()').includes('Intro &lt;b&gt;x&lt;/b&gt;'), 'guide text is escaped');
  expectView('weeks', /Tell your students[\s\S]*Day one[\s\S]*50–60/);
  expectView('modules', /What right looks like[\s\S]*<code[^>]*>High<\/code>/);
  expectView('grading', /Grade one submission/);
  expectView('rubric', /Safety cap/);

  // 5. Sign-out takes the loaded guide (answer keys) out of the page, so the
  //    next person on this browser can't read it from the console (2026-11-20).
  run('globalThis.requestAnimationFrame = () => 0;'); // signOut() re-renders the login page
  await run('signOut()');
  assert.equal(run('SocInstructorGuide._state.guide'), null, 'sign-out clears the loaded guide');
  assert.equal(run('SocInstructorGuide._state.status'), 'idle', 'the next staff sign-in reads the guide again');
  assert.ok(!run('SocInstructorGuide.panel()').includes('Module one'), 'no guide text is left to render');

  //    A read still on its way when staff sign out is dropped when it lands.
  run(`supabaseResponder = () => new Promise((resolve) => { globalThis.__landGuide = () => resolve({ data: { content: ${JSON.stringify(guide)} }, error: null }); });`);
  run('SocInstructorGuide.mount()');
  await flush();
  await run('signOut()');
  run('__landGuide()');
  await flush();
  assert.equal(run('SocInstructorGuide._state.guide'), null, 'a late read after sign-out is discarded');
  assert.equal(run('SocInstructorGuide._state.status'), 'idle');

  // 4. Dashboard tab placement and scope.
  const dashboard = (user, track) => run(`viewAdmin(${JSON.stringify(user)}, [], null, [], { activeTrackCode: ${JSON.stringify(track)}, facultyMessageTrackCodes: ${JSON.stringify(user.isAdmin ? [] : [track])} })`);
  const admin = { userId: 'a', email: 'a@test.invalid', isAdmin: true, isInstructor: false, instructorTrackCodes: [] };
  const socHtml = dashboard(admin, 'SOCAN');
  assert.ok(socHtml.includes('data-admin-tab="guide"'), 'SOC workspace shows the Instructor Guide tab');
  assert.ok(socHtml.indexOf('data-admin-tab="messages"') < socHtml.indexOf('data-admin-tab="guide"'), 'the tab sits to the right of Messages');
  assert.ok(socHtml.includes('id="admin-tab-panel-guide"'));
  const socInstructor = { userId: 'i', email: 'i@test.invalid', isAdmin: false, isInstructor: true, instructorTrackCodes: ['SOCAN'] };
  assert.ok(dashboard(socInstructor, 'SOCAN').includes('data-admin-tab="guide"'), 'the assigned SOC instructor sees the tab');
  const hdInstructor = { userId: 'h', email: 'h@test.invalid', isAdmin: false, isInstructor: true, instructorTrackCodes: ['HDESK'] };
  assert.ok(!dashboard(hdInstructor, 'HDESK').includes('data-admin-tab="guide"'), 'Help Desk has no SOC guide tab');
  assert.ok(!dashboard(admin, 'HDESK').includes('data-admin-tab="guide"'), 'other workspaces have no guide tab');

  console.log('soc-instructor-guide: all checks passed');
}

main().catch((err) => { console.error(err); process.exit(1); });

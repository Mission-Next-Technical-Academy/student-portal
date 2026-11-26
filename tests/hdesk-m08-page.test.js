// Help Desk Module 8 (key its-06) course page, portal/it-support-module-06.js,
// on the Module 1, 6 and 7 page pattern:
//
//   - The catalogue: Lab 8.1 (55 min), Lab 8.2 (50 min, Practice It) and the
//     Prove It (30 min) from the old 135-minute lab; 360 minutes in all, and
//     ITHD-101.6 keeps all 135 lab minutes. Lab 8.1 still gates Module 8, so
//     it isn't Practice It yet. The three filed lessons keep their keys, titles
//     and 75 minutes.
//   - The page: shown as Module 08 in week 4, three filed lessons (8.1 to 8.3)
//     as four reading cards, six tables, four diagrams; no "Module 6", "server
//     VM", "CompTIA", the old lab's title, SR-2107 or HD-2118; "account
//     expired" only inside Reading 1.
//   - The account-status card sort: a wrong box says why, the right box
//     settles the card; all four right saves "complete" and nothing else.
//   - The two checks: Learn It (6 questions) and A+ (8 questions), choices
//     shuffled per student and per attempt, stable on a redraw; a wrong pick
//     shows only its If wrong line; 5 of 6 and 6 of 8 first picks right save
//     "complete" to the case state, 4 of 6 and 5 of 8 don't; a failed save
//     takes the tick off again.
//   - Lab 8.1: the coach's Finish saves an attempt only when HD-2196 and
//     HD-2197 are resolved and the request SR-2207 is in the work.
//   - Lab 8.2: the practice set's message saves one completion record.
//   - The optional extension is a plain link to hd-m06-ext and saves nothing.
//   - The Prove It card opens nothing yet.
//   - The instructor sheets: the new lab labels and the Lab 8.2 sheet.
//
// The portal runs in tests/portal-vm.js. Synthetic data only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ROOT = path.join(__dirname, '..');
const ctx = loadPortal();
const run = (code) => vm.runInContext(code, ctx);
ctx.render = () => {};
let signedIn = null;
ctx.currentUser = async () => signedIn;

const SIM = new URL(run('SIM_ORIGIN')).origin;
const HD = run(`PROGRAMS.find((p) => p.slug === 'it-support')`);
const LabRuntime = run('LabRuntime');
const page = () => run(`MODULE_LABS['it-support/8']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its06-page-v1';
const GUIDED = 'lab-its-06-identity-access';
const PRACTICE = 'lab-its-06-practice-tickets';
const PROVE = 'lab-its-06-prove-it';
const TICKETS = ['HD-2198', 'HD-2199', 'HD-2200', 'HD-2201'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const PAGE_FILE = path.join(ROOT, 'portal/it-support-module-06.js');
// "Account expired" is Module 8's Prove It cause: before the Prove It a
// student reads it only in Reading 1 (spec decision 8).
const EXPIRED = /account(?:s)? (?:has |have )?expired|expired account|account expiry|extend (?:the|an|his|her) account/i;

function hdUser(attempts = {}, name = 'm08page') {
  return {
    userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function resetChecks() {
  run(`['learn', 'aplus'].forEach((k) => { its06CheckAnswers[k] = {}; its06CheckPicks[k] = {}; its06CheckAttempt[k] = 0; }); its06CheckSaveFailed.learn = false; its06CheckSaveFailed.aplus = false; its06CheckSaveFailed.sort = false; its06SortPicks = {};`);
}
function fresh(user) {
  ctx.supabaseCalls.length = 0;
  ctx.supabaseResponder = () => ({ data: null, error: null });
  ctx.localStorage.clear();
  run('itsUnrecordedWalkthroughs.clear(); itsBlockedWalkthroughs.clear(); itsIncompleteWalkthroughs.clear()');
  resetChecks();
  signedIn = user;
}
const inserts = (labKey) => ctx.supabaseCalls.filter((c) => c.table === 'lab_attempts' && c.op === 'insert' && (!labKey || c.payload.lab_key === labKey));
function replyCatcher() {
  const replies = [];
  return { replies, source: { postMessage: (data, origin) => replies.push(copy({ data, origin })) } };
}
async function quiet(fn) {
  const original = ctx.console.error;
  ctx.console.error = () => {};
  try { return await fn(); } finally { ctx.console.error = original; }
}
async function flush() {
  LabRuntime.flushAllCaseStateWrites();
  for (let i = 0; i < 8; i += 1) await new Promise((resolve) => setTimeout(resolve, 0));
}
function statusLine(html, labKey) {
  const match = new RegExp(`data-its-lab-status="${labKey}"[^>]*>[\\s\\S]*?<span>([\\s\\S]*?)</span>`).exec(html);
  assert.ok(match, `a status line for ${labKey}`);
  return match[1];
}
function railRow(html, scrollId) {
  const match = new RegExp(`<a href="#${scrollId}" class="munified-row ([^"]*)"[^>]*>([\\s\\S]*?)</a>`).exec(html);
  assert.ok(match, `a rail row for ${scrollId}`);
  return { ticked: match[1].includes('mnav-chip-complete'), locked: match[1].includes('mnav-chip-locked'), text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
}
const section = (html, id) => {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start >= 0, `section ${id}`);
  return html.slice(start, html.indexOf('</section>', start));
};
// One check's block (or the card sort's), from its opening tag to its footer.
const checkBlock = (html, checkId) => {
  const start = html.indexOf(checkId === 'sort' ? 'id="its06-cardsort"' : `id="its06-check-${checkId}"`);
  assert.ok(start >= 0, `check ${checkId}`);
  const footer = html.indexOf(`data-its06-check-footer="${checkId}"`, start);
  return html.slice(start, html.indexOf('</div>', footer));
};
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const submitted = (at = '2026-11-25T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });
const checks = () => copy(run('ITS06_CHECKS'));
// Reading 1's card, the only place "account expired" may appear.
const readingOne = (html) => {
  const start = html.indexOf('data-its06-reading="1"');
  assert.ok(start >= 0, 'Reading 1');
  const open = html.lastIndexOf('<details', start);
  return html.slice(open, html.indexOf('</details>', start) + '</details>'.length);
};

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-06'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [8, 4, 360, 3, 3]);
  assert.equal(m.title, 'Identity, Accounts & Access Management', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes, item.parentAllocations.map((a) => [a.code, a.minutes])])), [
    ['its-06-lesson-01', 'Password Resets, Account Unlocks & Reading Account Status Correctly', 75, [['ITHD-101.6', 75]]],
    ['its-06-lesson-02', 'Group Membership & Access Troubleshooting', 75, [['ITHD-101.6', 75]]],
    ['its-06-lesson-03', 'Introductory Entra ID & M365 Identity Scenarios', 75, [['ITHD-101.6', 75]]],
  ], 'the filed lesson keys, titles, minutes and parents');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-06'));
  // Lab 8.1 keeps no phase: it is still the gating lab until the Prove It's
  // migration moves the gate.
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null, l.parentAllocations.map((a) => [a.code, a.minutes])]), [
    [GUIDED, 'Lab 8.1 · Guided Lab: an identity morning', 55, null, [['ITHD-101.6', 55]]],
    [PRACTICE, 'Lab 8.2 · Practice tickets (not graded)', 50, 'practice', [['ITHD-101.6', 50]]],
    [PROVE, 'Prove It: Independent Ticket', 30, null, [['ITHD-101.6', 30]]],
  ]);
  const parent = labs.reduce((sum, l) => sum + l.parentAllocations.reduce((s, a) => s + a.minutes, 0), 0);
  assert.equal(parent, 135, 'ITHD-101.6 keeps the old lab’s 135 minutes');
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 360, 'lessons and labs still total 360');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective) });
  assert.doesNotMatch(text, /SR-2107|HD-2118|Restoring Access|server VM|Module 0?6\b|CompTIA/i, 'no catalogue text names the old lab');
  assert.doesNotMatch(text, EXPIRED, 'no catalogue text names the Prove It’s cause');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its06-shell"/);
  assert.match(html, /Module 08 · 6 Hours · Week 4/, 'the hero shows Module 08, 360 minutes, week 4');
  assert.match(html, /<dt>Lessons<\/dt><dd>3<\/dd>/, 'the hero counts the three filed lessons');
  const shown = words(html);
  // Nothing a student sees names the old number, a VM or CompTIA.
  const banned = /.{0,60}(Module 0?6\b|server VM|CompTIA|220-1201|SR-2107|HD-2118|Restoring Access the Right Way).{0,60}/i.exec(shown);
  assert.equal(banned && banned[0], null, 'nothing a student sees names the old module, a VM or CompTIA');
  assert.doesNotMatch(html, /comptia\.org/i);
  assert.match(shown, /A\+ check/, '"A+ check" stays');
  // "Account expired" appears only in Reading 1 (its text, Table 1 and diagram 1).
  const one = readingOne(html);
  assert.match(words(one), /Account expired/);
  const outside = /.{0,60}(?:account(?:s)? (?:has |have )?expired|expired account).{0,60}/i.exec(words(html.replace(one, '')));
  assert.equal(outside && outside[0], null, 'no "account expired" outside Reading 1');
  // The whole file, comments included.
  const source = fs.readFileSync(PAGE_FILE, 'utf8');
  assert.doesNotMatch(source, /Module 0?6\b|server VM|CompTIA|220-1201|Windows Server 20\d\d|\?prove=/i);
  // The objective: A+ Core 1 1.3 and 4.2, competencies 1, 4 and 8 proved, 3, 7 and 9 practised.
  assert.match(shown, /A\+ Core 1: 1\.3 mobile device network connectivity and application support · 4\.2 cloud models and SaaS \(reinforced\)/);
  assert.match(shown, /Competencies: 1 AD\/Entra basics · 4 M365\/Entra admin center · 8 Security hygiene; practised: 3 Ticketing discipline · 7 Communication under pressure · 9 Triage and escalation judgment\./);
  // Three filed lessons as four reading cards; Lesson 8.3 holds Readings 3 and 4.
  assert.deepEqual([...html.matchAll(/<strong>Lesson (8\.\d) · Reading (\d) · /g)].map((m) => `${m[1]}/${m[2]}`), ['8.1/1', '8.2/2', '8.3/3', '8.3/4']);
  assert.deepEqual([...html.matchAll(/data-its06-lesson="([^"]+)"/g)].map((m) => m[1]), ['its-06-lesson-01', 'its-06-lesson-02', 'its-06-lesson-03', 'its-06-lesson-03']);
  assert.equal((html.match(/Readings 3 and 4 share Lesson 8\.3’s 2 Hours/g) || []).length, 2, 'Readings 3 and 4 say they share the lesson’s minutes');
  [1, 2, 3, 4].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  // Spec section 6: four diagrams, each a wide and a narrow drawing.
  assert.equal((html.match(/<figure /g) || []).length, 4, 'four diagrams');
  ['Read, then act', 'Joiner, mover, leaver', 'One identity, two places', 'Two kinds of phone'].forEach((title) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${esc(title)}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
  });
  // Spec section 5's Tables 1 to 6, placed by reading; Table 7 is not on the page.
  const captions = [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].map((m) => m[1]);
  assert.deepEqual(captions.map((c) => (/^Table (\d)/.exec(c) || [])[1]), ['1', '2', '3', '4', '5', '6']);
  // Reading 4's terms are defined before its tables use them.
  const four = html.slice(html.indexOf('<h4>Reading 4 · '));
  ['<strong>Conditional Access</strong>', '<strong>data cap</strong>', '<strong>Intune admin center</strong>'].forEach((term) => assert.ok(four.indexOf(term) >= 0 && four.indexOf(term) < four.indexOf('<caption>'), `${term} before Reading 4's tables`));
  assert.doesNotMatch(html, /Table 7|Priorities against/);
  // Spec section 8.5's key sentences, one from each reading.
  [
    'Unlock only after the source is fixed, or it locks again within minutes.',
    'Old access left behind is exactly what attackers look for.',
    'An MFA reset is how attackers take over accounts',
    'Never take a user out of the policy to get them working.',
  ].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // The typed line renders as code.
  assert.match(html, /<code class="its06-code">Get-ADUser &lt;name&gt; -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet<\/code>/);
  assert.match(html, /<code class="its06-code">whoami \/groups<\/code>/);
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  // The file the curriculum check reads: three lessons with the filed titles,
  // each its filed 75 minutes plus its 45-minute share of the lab.
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [
    ['Password Resets, Account Unlocks & Reading Account Status Correctly', 120],
    ['Group Membership & Access Troubleshooting', 120],
    ['Introductory Entra ID & M365 Identity Scenarios', 120],
  ]);
}

// No diagram line is wider than the drawing (0.56 em a character, the
// estimate the drawing code wraps with), and every box fits.
function testDiagramsFit() {
  for (const key of ['status', 'jml', 'hybrid', 'phones']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS06_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      assert.ok(Number(w) <= (layout === 'wide' ? 768 : 320), `${key} ${layout}: width`);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
      for (const m of svg.matchAll(/<rect class="[^"]*" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) + Number(m[3]) <= Number(w) + 1 && Number(m[2]) + Number(m[4]) <= Number(h) + 1, `${key} ${layout}: a box fits`);
      }
      // Every word drawn is in the screen-reader description.
      const said = run(`its06DiagramWords('${key}')`);
      for (const m of svg.matchAll(/<text[^>]*>([^<]+)</g)) {
        const text = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
        text.split(/\s+/).forEach((word) => assert.ok(said.includes(word.replace(/[.,:;]$/, '')), `${key} ${layout}: "${word}" is in the description`));
      }
    }
  }
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its06-lab-8-1');
  assert.match(guided, /Lab 8\.1 · Guided Lab: an identity morning/);
  assert.match(guided, /data-its06-console-launch href="[^"]*\?coach=hd-m06&amp;restart=1&amp;student=/, 'Lab 8.1 launches the hd-m06 coach');
  assert.match(guided, /Start Lab 8\.1 walkthrough/);
  assert.match(guided, /HD-2196[\s\S]*HD-2197[\s\S]*SR-2207/);
  assert.match(guided, /A coach guides you through each step\./, 'no step count');
  assert.match(guided, /Feedback only, no score/);
  assert.match(guided, /Your instructor reviews your finished lab/, 'Lab 8.1 still gates Module 8');
  // The optional extension: a plain link to its own coach, outside the record.
  assert.match(guided, /Optional extension \(not part of your lab record\)/);
  assert.match(guided, /data-its06-extension-launch href="[^"]*\?coach=hd-m06-ext&amp;restart=1&amp;student=[^"]*" target="_blank" rel="noopener"/);
  const practice = section(html, 'its06-lab-8-2');
  assert.match(practice, /Lab 8\.2 · Practice tickets \(not graded\)/);
  assert.match(practice, /\?practice=its-06&amp;student=/, 'Lab 8.2 opens practice set its-06');
  assert.match(practice, /Practice: not graded/);
  assert.match(practice, /\(8-A\)[\s\S]*\(8-B\)[\s\S]*\(8-C\)[\s\S]*\(8-D\)/);
  // All four practice tickets end resolved at Tier 1.
  assert.equal(statusLine(html, PRACTICE), 'Finish all four tickets: resolve each one and give it your work note.');
  // The Prove It opens nothing yet.
  const prove = section(html, 'its06-prove-it');
  assert.match(prove, /Prove It: Independent Ticket/);
  assert.match(prove, /Opens soon/);
  assert.doesNotMatch(prove, /<a |<button|\?prove=/, 'the Prove It card opens nothing');
  assert.doesNotMatch(html, /\?prove=its-06/);
  // The three lab cards show 55 / 50 / 30.
  assert.deepEqual([...html.matchAll(/data-its06-lab-minutes>Time: ([^<]+)</g)].map((m) => m[1]), [GUIDED, PRACTICE, PROVE].map((k) => run(`formatInstructionalMinutes(${run(`LABS.find((l) => l.key === '${k}').instructionalMinutes`)})`)));
  assert.deepEqual([GUIDED, PRACTICE, PROVE].map((k) => run(`LABS.find((l) => l.key === '${k}').instructionalMinutes`)), [55, 50, 30]);
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-06-assessment-module/);
  ['its06-prove-it', 'its06-check-learn', 'its06-check-aplus', 'its06-lab-8-2', 'its06-lab-8-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));
  assert.doesNotMatch(html, /href="#its06-cardsort"/, 'the card sort has no rail row (it sits inside Reading 1)');

  // Lab 8.1 still gates Module 8: a saved attempt waits for the instructor.
  const waiting = hdUser({ [GUIDED]: submitted() });
  fresh(waiting);
  assert.match(statusLine(page().view(waiting, HD), GUIDED), /^Lab 8\.1 submitted .+, waiting for instructor review$/);
  assert.equal(railRow(page().view(waiting, HD), 'its06-lab-8-1').ticked, false);
  const passed = hdUser({ [GUIDED]: { ...submitted(), reviewedAt: '2026-11-25T16:00:00Z' } });
  fresh(passed);
  assert.equal(statusLine(page().view(passed, HD), GUIDED), 'Lab 8.1 passed');
}

/* ------------------------------------------------------------ card sort */

function testCardSort() {
  const sort = copy(run('ITS06_CARD_SORT'));
  assert.deepEqual(sort.buckets, ['Locked', 'Disabled', 'Password expired', 'Active'], 'four boxes, none for an expired account');
  assert.deepEqual(sort.cards.map((c) => [c.name, c.answer]), [['Wes Turner', 'Locked'], ['Kofi Mensah', 'Disabled'], ['Ruth Adeyemi', 'Password expired'], ['Dev Raman', 'Active']]);
  const dev = sort.cards.find((c) => c.id === 'dev');
  assert.deepEqual(dev.fields.find(([name]) => name === 'Account expires'), ['Account expires', 'in 9 days'], 'Dev’s end date is 9 days away');
  assert.deepEqual(dev.fields.find(([name]) => name === 'Sponsor'), ['Sponsor', 'Leah Brooks']);
  sort.buckets.forEach((b) => assert.ok(sort.whyNot[b], `a why-not line for ${b}`));
  sort.cards.forEach((c) => sort.buckets.filter((b) => b !== c.answer).forEach((b) => assert.ok(!sort.whyNot[b].includes(c.answer), `${b}'s line never names ${c.answer}`)));

  const user = hdUser({}, 'm08sort');
  fresh(user);
  let html = page().view(user, HD);
  // Inside Reading 1's card.
  assert.ok(readingOne(html).includes('id="its06-cardsort"'), 'the card sort is in Reading 1');
  const pick = run('its06Sort');
  // A wrong box: its line, nothing settles, nothing saved.
  pick('dev', 'Locked');
  html = page().view(user, HD);
  let block = checkBlock(html, 'sort');
  assert.ok(block.includes(esc(sort.whyNot.Locked)));
  assert.ok(!block.includes(esc(dev.why)));
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).cardSortCompleted, true);
  // The right box for three cards: still not complete.
  pick('dev', 'Active');
  pick('wes', 'Locked');
  pick('kofi', 'Disabled');
  assert.ok(checkBlock(page().view(user, HD), 'sort').includes(esc(dev.why)), 'the right box shows the card’s line');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).cardSortCompleted, true, 'three of four is not done');
  // The fourth: complete, saved with its time and nothing else.
  pick('ruth', 'Password expired');
  const state = LabRuntime.load(STATE_ID, user, {});
  assert.equal(state.cardSortCompleted, true);
  assert.ok(state.cardSortCompletedAt);
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick|bucket/i.test(k)), [], 'no picks saved');
  assert.match(checkBlock(page().view(user, HD), 'sort'), /Account-status card sort complete/);
  assert.equal(inserts().length, 0, 'the card sort saves no lab attempt');
}

/* --------------------------------------------------------------- checks */

const shownOrder = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its06-answer data-check="${checkId}" data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its06-answer data-check="${checkId}" data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

function testCheckContent() {
  const all = checks();
  assert.deepEqual(Object.keys(all), ['learn', 'aplus']);
  assert.equal(all.learn.questions.length, 6, 'Learn It: six questions');
  assert.equal(all.aplus.questions.length, 8, 'A+: eight questions');
  assert.equal(all.aplus.title, 'A+ check (Core 1: 1.3, 4.2)');
  // Spec 8.1's right answers, by the choice's text.
  assert.deepEqual(all.aplus.questions.map((q) => q.choices[q.answer]), [
    'Mobile device management (MDM)', 'App protection for the work apps (MAM)',
    'Enter the PIN from the headset’s guide (often 0000), then test with a call',
    'Install the update on the phone, then tap Check status in Company Portal',
    'Set OneDrive to upload on Wi-Fi only', 'GPS is precise outdoors; indoors the phone falls back to cellular location',
    'SaaS', 'Hybrid',
  ]);
  assert.deepEqual(all.learn.questions.map((q) => q.choices[q.answer]), [
    'Read Lockout details for the source before you unlock it',
    'Leave it disabled; re-enabling a leaver is HR’s decision, so send the manager to HR',
    'Add the Finance groups and remove the Sales groups',
    'They haven’t signed out and back in',
    'Verify Priya through the directory and open the ticket under her real account; don’t act on the email',
    'Send as',
  ]);
  for (const [id, check] of Object.entries(all)) {
    check.questions.forEach((q, i) => {
      assert.equal(q.choices.length, 4, `${id} ${i + 1}: four choices`);
      assert.equal(q.ifWrong[q.answer], null, `${id} ${i + 1}: no If wrong line on the answer`);
      q.choices.forEach((_, c) => { if (c !== q.answer) assert.ok(q.ifWrong[c], `${id} ${i + 1} choice ${c}: an If wrong line`); });
      assert.ok(q.why, `${id} ${i + 1}: a Why line`);
      // The letters move with the shuffle, so no line names one.
      [q.why, ...q.ifWrong].forEach((line) => { if (line) assert.doesNotMatch(line, /\b[A-D]\)|\(\*?[A-D]\*?\)|\*[A-D]\*/, `${id} ${i + 1}: no letter in "${line}"`); });
    });
    assert.doesNotMatch(JSON.stringify(check), EXPIRED, `${id}: the checks never name the Prove It’s cause`);
  }
  // Both checks sit after Reading 4 (the Learn It check draws on Readings 1
  // to 3, and its Send as question on Reading 3), then the labs.
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const at = (needle) => html.indexOf(needle);
  assert.ok(at('<h4>Reading 4 · ') < at('id="its06-check-learn"'), 'Learn It check after Reading 4');
  assert.ok(at('id="its06-check-learn"') < at('id="its06-check-aplus"') && at('id="its06-check-aplus"') < at('id="its06-lab-8-1"'), 'then the A+ check, then the labs');
}

// Options are shuffled on each attempt. Each student gets their own order, the
// same on every redraw, and a new one after Start again.
function testChoicesShuffled() {
  const all = checks();
  const names = ['m08order1', 'm08order2', 'm08order3', 'm08order4', 'm08order5'];
  const orders = {};
  for (const name of names) {
    const user = hdUser({}, name);
    fresh(user);
    const html = page().view(user, HD);
    orders[name] = {};
    for (const [id, check] of Object.entries(all)) {
      orders[name][id] = check.questions.map((_, q) => shownOrder(html, id, q));
      check.questions.forEach((_, q) => {
        assert.deepEqual([...orders[name][id][q]].sort(), [0, 1, 2, 3], `${name} ${id} ${q + 1}: every choice once`);
        assert.deepEqual(shownLetters(html, id, q), ['A', 'B', 'C', 'D'], 'letters follow the place shown');
      });
    }
    const again = page().view(user, HD);
    for (const [id, check] of Object.entries(all)) check.questions.forEach((_, q) => assert.deepEqual(shownOrder(again, id, q), orders[name][id][q], `${name} ${id} ${q + 1}: stable`));
  }
  assert.notDeepEqual(orders.m08order1, orders.m08order2, 'two students see different orders');
  const places = new Set();
  names.forEach((name) => Object.entries(all).forEach(([id, check]) => check.questions.forEach((question, q) => places.add(orders[name][id][q].indexOf(question.answer)))));
  assert.equal(places.size, 4, 'the right answer lands in every place');
  const user = hdUser({}, 'm08order1');
  fresh(user);
  page().view(user, HD);
  run('its06Answer')('aplus', 0, all.aplus.questions[0].answer);
  run('its06ResetCheck')('aplus');
  const retake = page().view(user, HD);
  assert.notDeepEqual(all.aplus.questions.map((_, q) => shownOrder(retake, 'aplus', q)), orders.m08order1.aplus, 'a retake reshuffles');
  assert.deepEqual(all.learn.questions.map((_, q) => shownOrder(retake, 'learn', q)), orders.m08order1.learn, 'the other check keeps its order');
}

function testChecksCompleteAtSeventyPercent() {
  const all = checks();
  const answer = run('its06Answer');
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const saved = (user) => LabRuntime.load(STATE_ID, user, {});

  // A wrong first pick shows its If wrong line only, never the Why.
  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const q0 = all.aplus.questions[0];
  answer('aplus', 0, wrong(q0));
  let block = checkBlock(page().view(user, HD), 'aplus');
  assert.ok(block.includes(esc(q0.ifWrong[wrong(q0)])));
  assert.equal(q0.ifWrong.filter((line) => line && block.includes(esc(line))).length, 1);
  assert.ok(!block.includes(esc(q0.why)));
  assert.match(block, /Not quite\./);
  assert.doesNotMatch(block, /is-answer/, 'nothing marks the right answer');
  answer('aplus', 0, q0.answer);
  assert.ok(checkBlock(page().view(user, HD), 'aplus').includes(esc(q0.why)), 'the right pick shows the Why');

  // A+: 6 of 8 first picks right (questions 1 and 2 wrong first) completes it,
  // saves only its own flag and time, and ticks only its rail row.
  answer('aplus', 1, wrong(all.aplus.questions[1]));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  let state = saved(user);
  assert.equal(state.aplusCheckCompleted, true);
  assert.ok(state.aplusCheckCompletedAt);
  assert.notEqual(state.learnCheckCompleted, true, 'the Learn It check is still open');
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([state.score, state.bestScore], [0, 0], 'no score saved (the runtime’s own fields stay 0)');
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /A\+ check \(Core 1: 1\.3, 4\.2\) complete/);
  assert.equal(railRow(html, 'its06-check-aplus').ticked, true);
  assert.equal(railRow(html, 'its06-check-learn').ticked, false);

  // Learn It: 5 of 6 completes it.
  answer('learn', 0, wrong(all.learn.questions[0]));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.equal(state.learnCheckCompleted, true);
  assert.ok(state.learnCheckCompletedAt);
  html = page().view(user, HD);
  assert.equal(railRow(html, 'its06-check-learn').ticked, true);
  assert.equal(inserts().length, 0, 'the checks save no lab attempt');

  // Another student: 5 of 8 and 4 of 6 are retakes, nothing saved.
  user = hdUser({}, 'm08page2');
  fresh(user);
  html = page().view(user, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./, 'another student starts fresh');
  [0, 1, 2].forEach((i) => answer('aplus', i, wrong(all.aplus.questions[i])));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  [0, 1].forEach((i) => answer('learn', i, wrong(all.learn.questions[i])));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.notEqual(state.aplusCheckCompleted, true, '5 of 8 is not a pass');
  assert.notEqual(state.learnCheckCompleted, true, '4 of 6 is not a pass');
  html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /Retake: you need 6 of 8/);
  assert.match(checkBlock(html, 'learn'), /Retake: you need 5 of 6/);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm08save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  checks().learn.questions.forEach((q, i) => run('its06Answer')('learn', i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its06-check-learn').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'learn'), /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its06-check-retry="learn"/);
  assert.equal(railRow(html, 'its06-check-learn').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).learnCheckCompleted, true);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-06' }], error: null });
  run('its06RetryCheckSave')('learn');
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(checkBlock(html, 'learn'), /Learn It knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).learnCheckCompleted, true);
}

/* ---------------------------------------------------------- Lab 8.1 save */

const ticket = (id, status = 'Resolved') => ({ id, status, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' } } });
const labWork = (tickets = [ticket('HD-2196'), ticket('HD-2197'), ticket('SR-2207', 'Open')]) => ({ version: 1, tickets });
const coachMessage = (source, work, student = studentOf(signedIn), id = 'hd-m06') => ({ data: { type: 'mnt-coach-complete', id, nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved and the simulator hears why.
  for (const work of [
    labWork([ticket('HD-2196', 'In Progress'), ticket('HD-2197'), ticket('SR-2207', 'Open')]),
    labWork([ticket('HD-2196'), ticket('HD-2197', 'In Progress'), ticket('SR-2207', 'Open')]),
    labWork([ticket('HD-2196'), ticket('HD-2197')]),
    labWork([ticket('HD-2196'), ticket('SR-2207', 'Open')]),
    labWork([ticket('SR-2107'), ticket('HD-2118')]),
    labWork([]),
  ]) {
    const user = hdUser();
    fresh(user);
    page().view(user, HD);
    const { replies, source } = replyCatcher();
    await page().onMessage(coachMessage(source, work));
    assert.equal(inserts().length, 0);
    assert.deepEqual(replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'incomplete']]);
  }

  // Another student's work, another origin, or the extension's coach: nothing saved.
  let user = hdUser();
  fresh(user);
  let catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, labWork()), origin: 'https://elsewhere.test' });
  await page().onMessage(coachMessage(catcher.source, labWork(), studentOf(signedIn), 'hd-m06-ext'));
  assert.equal(inserts().length, 0, 'the extension saves nothing');

  // HD-2196 and HD-2197 resolved, with SR-2207: one Lab 8.1 attempt, then the
  // page shows it waiting for the instructor (still the gating lab).
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 8.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
  assert.deepEqual(row.result.work.tickets.map((t) => [t.id, t.status]), [['HD-2196', 'Resolved'], ['HD-2197', 'Resolved'], ['SR-2207', 'Open']]);
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  assert.match(statusLine(page().view(user, HD), GUIDED), /waiting for instructor review$/);
  await page().onMessage(coachMessage(replyCatcher().source, labWork()));
  assert.equal(inserts().length, 1, 'finishing again sends nothing new');

  // The save fails: not received, nothing shows submitted.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  catcher = replyCatcher();
  await quiet(() => page().onMessage(coachMessage(catcher.source, labWork())));
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [false]);
  assert.doesNotMatch(statusLine(page().view(user, HD), GUIDED), /submitted/);
}

// The coach's own end: the simulator's Lab 8.1 coach sends the same three
// records the page checks for.
function testCoachSendsWhatThePageNeeds() {
  const coaches = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m06': \['HD-2196', 'HD-2197', 'SR-2207'\]/);
}

/* ---------------------------------------------------------- Lab 8.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-06' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves the same tickets the simulator's set needs done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-06': \{ title:'Module 8 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-06 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-06', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-06', nonce: 'p-1', saved: true }, origin: SIM }]);
  const html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 8.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its06-lab-8-2').ticked, true);
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1, 'again: answered as saved, nothing inserted');

  // Already in the database (another browser saved it): not saved twice.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: [{ completed_at: '2026-11-25T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  const known = replyCatcher();
  await page().onMessage(practiceMessage(known.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(known.replies.map((r) => r.data.saved), [true]);

  // Refused: wrong tickets, another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['three tickets', { tickets: TICKETS.slice(0, 3) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2202'] }, 'incomplete'],
    ['a lab ticket instead', { tickets: ['HD-2198', 'HD-2199', 'HD-2200', 'HD-2196'] }, 'incomplete'],
    ['another student', { student: 'student-someoneelse' }, 'other-student'],
    ['signed out', {}, 'signed-out', () => { signedIn = null; }],
  ]) {
    user = hdUser();
    fresh(user);
    const catcher = replyCatcher();
    const message = practiceMessage(catcher.source, fields);
    if (setup) setup();
    await page().onMessage(message);
    assert.equal(inserts().length, 0, name);
    assert.deepEqual(catcher.replies.map((r) => [r.data.saved, r.data.reason]), [[false, reason]], name);
  }
  // Module 7's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-05', tickets: ['HD-2191', 'HD-2192', 'HD-2193', 'HD-2194', 'HD-2195'] }));
  await page().onMessage(practiceMessage(other.source, { origin: 'https://elsewhere.test' }));
  assert.equal(inserts().length, 0);
  assert.equal(other.replies.length, 0, 'another set or origin gets no reply from this page');

  // The save fails: not saved, nothing shows complete.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  const failed = replyCatcher();
  await quiet(() => page().onMessage(practiceMessage(failed.source)));
  assert.deepEqual(failed.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  assert.doesNotMatch(statusLine(page().view(user, HD), PRACTICE), /Complete/);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 8.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-25T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm08p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-06', tickets: TICKETS } });
  assert.match(html, /Module 08 · Lab 8\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2198, HD-2199, HD-2200, HD-2201/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 8.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), true, 'Lab 8.1 still is, until the Prove It gates the module');
  const guided = sheet.render({ ...base, id: 'm08g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 08 · Lab 8\.1 · Guided Lab: an identity morning/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m08-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testDiagramsFit, testLabCardsAndRail, testCardSort, testCheckContent, testChoicesShuffled, testChecksCompleteAtSeventyPercent, testCheckSaveThatFails, testGuidedLabSave, testCoachSendsWhatThePageNeeds, testPracticeSave, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m08-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

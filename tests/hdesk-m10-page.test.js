// Help Desk Module 10 (key its-08) course page, portal/it-support-module-08.js
// and portal/it-support-module-08.css, on the Module 9 page pattern:
//
//   - The catalogue: two filed lessons of 45 minutes, three labs (Lab 10.1 12
//     minutes, Lab 10.2 8 minutes, the Prove It 10 minutes), 120 minutes in
//     all; ITHD-101.8 keeps all 30 lab minutes.
//   - The page: shown as Module 10 in week 5, three reading cards (Lesson 10.1
//     is Reading 1; Lessons 10.2 and 10.3 are Readings 2 and 3 and share one
//     filed lesson), seven tables, five numbered diagrams. No card sort.
//   - The two checks: Learn It (6 questions, after Reading 2) and A+ (8
//     questions, after Reading 3), choices shuffled per student and per
//     attempt; 5 of 6 and 6 of 8 first picks right save "complete", 4 of 6 and
//     5 of 8 do not; a failed save takes the tick off again.
//   - The clock cause (a wrong clock, the CMOS battery, certificate date
//     warnings) is taught in Reading 2 (Table 4, Table 7) and Reading 3
//     (Table 5) and never appears in a check question.
//   - Lab 10.1: the coach's Finish saves an attempt only when HD-2255 is
//     Resolved and HD-2110 is not Resolved and has at least one note.
//   - Lab 10.2: the practice set's message saves one completion record, and
//     only for the three tickets the simulator's set reports.
//   - The Prove It card says it opens soon and has no launch button.
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
const page = () => run(`MODULE_LABS['it-support/10']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
// The page's own escaping (it turns an apostrophe into &#39; too).
const esc = run('esc');

const STATE_ID = 'its08-page-v1';
const GUIDED = 'lab-its-08-unfamiliar-problems';
const PRACTICE = 'lab-its-08-practice-tickets';
const PROVE = 'lab-its-08-prove-it';
const TICKETS = ['HD-2223', 'HD-2224', 'HD-2225'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const PAGE_FILE = path.join(ROOT, 'portal/it-support-module-08.js');
const CSS_FILE = path.join(ROOT, 'portal/it-support-module-08.css');
// What a student must never see. "CompTIA" is allowed only in the sources
// entry (the page says "A+ check"), so the sources block is cut out first.
// The later Prove It ticket's id is not on the page; it is built from parts
// here so this file doesn't spell it out.
const LATER_TICKET = ['HD', '21' + '31'].join('-');
const BANNED = new RegExp(`${LATER_TICKET}|Module 8\\b|lab VM|virtual machine|CompTIA`, 'i');
// The clock cause: taught in Reading 2 and Reading 3's tables, never asked.
const CLOCK_CAUSE = /clock|CMOS|certificate|time and\/or date|date is wrong|date and time|w32tm|Kerberos/i;
// The build plan's task ids never appear.
const PLAN_ID = /\b(?:[A-KM-Z]\d{2}|TD-\d{3})\b/;

function hdUser(attempts = {}, name = 'm10page') {
  return {
    userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function resetChecks() {
  run(`['learn', 'aplus'].forEach((k) => { its08CheckAnswers[k] = {}; its08CheckPicks[k] = {}; its08CheckAttempt[k] = 0; }); its08CheckSaveFailed.learn = false; its08CheckSaveFailed.aplus = false;`);
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
// One check's block, from its opening tag to its footer.
const checkBlock = (html, checkId) => {
  const start = html.indexOf(`id="its08-check-${checkId}"`);
  assert.ok(start >= 0, `check ${checkId}`);
  const footer = html.indexOf(`data-its08-check-footer="${checkId}"`, start);
  return html.slice(start, html.indexOf('</div>', footer));
};
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const submitted = (at = '2026-11-26T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });
const checks = () => copy(run('ITS08_CHECKS'));
// One reading's card, from its <details> to its end.
const readingCard = (html, n) => {
  const start = html.indexOf(`data-its08-reading="${n}"`);
  assert.ok(start >= 0, `Reading ${n}`);
  const open = html.lastIndexOf('<details', start);
  return html.slice(open, html.indexOf('</details>', start) + '</details>'.length);
};
const figures = (html) => html.split('<figure ').slice(1).map((piece) => piece.slice(0, piece.indexOf('</figure>')));
const minutesOf = (key) => run(`LABS.find((l) => l.key === '${key}').instructionalMinutes`);
const minutesText = (minutes) => run(`formatInstructionalMinutes(${minutes})`);
// The page without its Sources block, where "CompTIA" is allowed.
const withoutSources = (html) => html.replace(section(html, 'its08-sources'), '');

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-08'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [10, 5, 120, 2, 3]);
  assert.equal(m.title, 'Troubleshooting Methodology & Diagnostics', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes, item.parentAllocations.map((a) => [a.code, a.minutes])])), [
    ['its-08-lesson-01', 'Remote Support Etiquette & Tools', 45, [['ITHD-101.8', 45]]],
    ['its-08-lesson-02', 'Structured Troubleshooting & Stop-and-Escalate Judgment', 45, [['ITHD-101.8', 45]]],
  ], 'the filed lesson keys, titles, minutes and parents');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-08'));
  // Lab 10.1 is still the gating lab, so it has no practice phase.
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null, l.parentAllocations.map((a) => [a.code, a.minutes])]), [
    [GUIDED, 'Lab 10.1 · Guided Lab: two remote sessions', 12, null, [['ITHD-101.8', 12]]],
    [PRACTICE, 'Lab 10.2 · Practice tickets (not graded)', 8, 'practice', [['ITHD-101.8', 8]]],
    [PROVE, 'Prove It: Independent Ticket', 10, null, [['ITHD-101.8', 10]]],
  ]);
  const parent = labs.reduce((sum, l) => sum + l.parentAllocations.reduce((s, a) => s + a.minutes, 0), 0);
  assert.equal(parent, 30, 'ITHD-101.8 keeps the old lab’s 30 minutes');
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 120, 'lessons and labs total 120');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective), skills: m.skills });
  assert.doesNotMatch(text, BANNED, 'no catalogue text names a banned word');
  assert.doesNotMatch(text, /Windows Server 20\d\d/i);
  assert.doesNotMatch(text, /CMOS|certificate/i, 'no catalogue text names the clock cause');
  // The curriculum checker expects the page's two lessons at 60 minutes each.
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/its-curriculum-check.js'), 'utf8'), /'its-08': \[60, 60\]/);
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its08-shell"/);
  assert.match(html, /Module 10 · 2 Hours · Week 5/, 'the hero shows Module 10, 120 minutes, week 5');
  assert.match(html, /<dt>Lessons<\/dt><dd>2<\/dd>/, 'the hero counts the two filed lessons');
  assert.match(html, /<dt>Guided labs<\/dt><dd>1<\/dd>/);
  const shown = words(withoutSources(html));
  const banned = new RegExp(`.{0,60}(${LATER_TICKET}|Module 8\\b|lab VM|virtual machine|CompTIA).{0,60}`, 'i').exec(shown);
  assert.equal(banned && banned[0], null, 'nothing a student sees names a banned word');
  assert.doesNotMatch(withoutSources(html), BANNED, 'nor does the markup');
  assert.doesNotMatch(html, /BitLocker|Remote Desktop Services|Windows Server 20\d\d/i);
  assert.match(shown, /A\+ check/, '"A+ check" stays');
  assert.doesNotMatch(shown, PLAN_ID, 'no plan task id on the page');
  // The whole file, comments included.
  const source = fs.readFileSync(PAGE_FILE, 'utf8');
  assert.doesNotMatch(source, new RegExp(`${LATER_TICKET}|lab VM|virtual machine`, 'i'));
  assert.doesNotMatch(source, PLAN_ID, 'no plan task id in the page file');
  assert.doesNotMatch(source, /Windows Server 20\d\d|itsRegisterCoachModule|its06/i);
  // No card sort on this page.
  assert.doesNotMatch(html, /cardsort|card sort|its02-sort-card|Name it/i, 'Module 10 has no card sort');
  assert.doesNotMatch(source, /cardSort|CARD_SORT|its08Sort/);
  // The objective, word for word.
  assert.ok(shown.includes('A+ Core 1: 2.1 (RDP 3389, SSH 22) · 4.1 (remote and virtual desktops) · 5.1 (motherboard, power and heat symptoms) · 5.3 (display and projector symptoms). Competencies: 5 Remote support · 3 Ticketing · 7 Communication · 9 Triage and escalation.'));
  assert.ok(shown.includes('run a remote session that is safe, consented and narrated'));
  // Two filed lessons as three reading cards; Lessons 10.2 and 10.3 share a filed lesson.
  assert.deepEqual([...html.matchAll(/<strong>Lesson (10\.\d) · Reading (\d) · /g)].map((m) => `${m[1]}/${m[2]}`), ['10.1/1', '10.2/2', '10.3/3']);
  assert.deepEqual([...html.matchAll(/data-its08-lesson="([^"]+)"/g)].map((m) => m[1]), ['its-08-lesson-01', 'its-08-lesson-02', 'its-08-lesson-02']);
  const sixty = minutesText(60);
  assert.deepEqual([...html.matchAll(/<small>(Reading time:[^<]*)<\/small>/g)].map((m) => m[1]), [
    `Reading time: about 10 minutes · ${sixty}`,
    `Reading time: about 10 minutes · Lessons 10.2 and 10.3 together: ${sixty}`,
    `Reading time: about 10 minutes · Lessons 10.2 and 10.3 together: ${sixty}`,
  ], 'each card shows its reading time; Readings 2 and 3 share the lesson’s minutes');
  [1, 2, 3].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.equal((html.match(/<h4>Reading \d · /g) || []).length, 3, 'three readings only');
  assert.deepEqual([...html.matchAll(/<h4>Reading (\d) · ([^<]*)<\/h4>/g)].map((m) => m[2]), [
    'Remote support: the right tool, and four habits', 'The method on a problem you’ve never seen', 'Power, heat and displays at Tier 1',
  ]);
  // The three "What You'll Learn" lists and the three Coming-up lines.
  const lists = [...html.matchAll(/<h4>What You'll Learn<\/h4>\s*<ul>([\s\S]*?)<\/ul>/g)].map((m) => [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].length);
  assert.deepEqual(lists, [4, 4, 4]);
  assert.equal((html.match(/<strong>Coming up in your lab:<\/strong>/g) || []).length, 3);
  // Five diagrams, each a wide and a narrow drawing, each with a visible number.
  assert.equal((html.match(/<figure /g) || []).length, 5, 'five diagrams');
  ['A remote session, start to finish', 'Which tool?', 'One hypothesis at a time', 'Something about the domain', 'No picture on the big screen? Start at the screen'].forEach((title, i) => {
    assert.equal(html.split(`role="img" aria-label="${esc(title)}"`).length - 1, 2, `${title}: a wide and a narrow drawing`);
    assert.ok(html.includes(`<p class="its01-dg-heading">Diagram ${i + 1} · ${esc(title)}</p>`), `${title} is captioned Diagram ${i + 1}`);
  });
  assert.deepEqual([...html.matchAll(/data-its08-diagram="([^"]+)"/g)].map((m) => m[1]), ['session', 'tool', 'loop', 'domain', 'screen']);
  [2, 3, 4, 5].forEach((n) => assert.match(shown, new RegExp(`diagram ${n}\\b`), `a reading points at diagram ${n}, which is on the page`));
  figures(html).forEach((figure) => {
    assert.match(figure, /<p class="its01-sr-only" id="its08-dg-[a-z]+-desc">[^<]{40,}/, 'alt text');
    assert.equal((figure.match(/aria-describedby="its08-dg-[a-z]+-desc"/g) || []).length, 2, 'both drawings point at the alt text');
  });
  // Diagrams sit in the reading that points at them.
  assert.deepEqual([1, 2, 3].map((n) => (readingCard(html, n).match(/<figure /g) || []).length), [2, 2, 1]);
  // Seven tables, numbered by reading: Reading 2 holds Tables 3, 4 and 7; Reading 3 holds 5 and 6.
  const captions = [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].map((m) => m[1]);
  assert.deepEqual(captions.map((c) => (/^Table (\d+)/.exec(c) || [])[1]), ['1', '2', '3', '4', '7', '5', '6']);
  assert.equal(captions.length, 7, 'seven tables');
  assert.deepEqual([1, 2, 3].map((n) => [...readingCard(html, n).matchAll(/<caption>Table (\d)/g)].map((m) => m[1])), [['1', '2'], ['3', '4', '7'], ['5', '6']]);
  assert.equal((html.match(/<table /g) || []).length, 7);
  assert.equal((html.match(/<div class="its10-table-wrap" tabindex="0" role="region" aria-label="Table \d/g) || []).length, 7, 'each table is a labelled, scrollable region');
  assert.doesNotMatch(html, /Table (?:8|9|10|11|12)\b/);
  // Key sentences, one or more from each reading.
  [
    'A session the user didn’t ask for, or a connection request they weren’t expecting, is a security incident (Module 11).',
    '**Tier 1 never opens a computer’s case.**'.replace(/\*\*/g, ''),
  ].forEach((text) => assert.ok(shown.includes(text), `the page shows: ${text}`));
  assert.ok(shown.includes('Evidence before action.'));
  assert.ok(shown.includes('One hypothesis at a time.'));
  assert.ok(shown.includes('A burning smell, smoke or sparks: switch off, unplug, keep people away, then escalate.'));
  // Typed lines render as code, with no stray markers.
  assert.match(html, /<code class="its08-code">w32tm \/query \/status<\/code>/);
  assert.match(html, /<code class="its08-code">w32tm \/resync<\/code>/);
  assert.match(html, /<code class="its08-code">Test-ComputerSecureChannel<\/code>/);
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  assert.doesNotMatch(shown, /(?<!\*)\*\*(?!\*)/, 'no stray bold markers');
  // The file the curriculum check reads: two lessons with the filed titles,
  // each its filed 45 minutes plus its share of the labs (60).
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [
    ['Remote Support Etiquette & Tools', 60],
    ['Structured Troubleshooting & Stop-and-Escalate Judgment', 60],
  ]);
  // Sources: two Microsoft Learn pages and the A+ page; nothing else.
  const sources = section(html, 'its08-sources');
  assert.deepEqual([...sources.matchAll(/class="msources-title-text">([^<]*)</g)].map((m) => m[1]), ['Use Quick Assist to help users', 'Windows Time service tools and settings', 'CompTIA A+ certification']);
  assert.equal((sources.match(/learn\.microsoft\.com\/en-us\/windows\/client-management\/client-tools\/quick-assist/g) || []).length, 1, 'the Quick Assist page');
  assert.equal((sources.match(/learn\.microsoft\.com\/en-us\/windows-server\/networking\/windows-time-service/g) || []).length, 1, 'the Windows Time service page');
  assert.equal((sources.match(/learn\.microsoft\.com/g) || []).length, 2);
  assert.equal((sources.match(/https:\/\/www\.comptia\.org\/certifications\/a"/g) || []).length, 1, 'the CompTIA A+ page');
  assert.doesNotMatch(sources, /BitLocker|Remote Desktop Services/i);
  // The stylesheet: every rule is scoped to this page's own classes.
  const css = fs.readFileSync(CSS_FILE, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [...css.matchAll(/(?:^|\})\s*([^{}@]+)\{/g)].map((m) => m[1].trim()).filter(Boolean);
  assert.ok(selectors.length >= 6, 'the stylesheet has rules');
  selectors.forEach((selector) => assert.match(selector, /its08/, `"${selector}" is scoped to Module 10`));
  assert.doesNotMatch(css, PLAN_ID);
}

// The clock cause is taught in Reading 2 (Table 4, Table 7 and its prose) and
// Reading 3 (Table 5), and nowhere a student is asked about it.
function testClockCauseStaysInTheReadings() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const two = readingCard(html, 2);
  const twoText = words(two);
  assert.match(twoText, /time and\/or date difference/);
  assert.match(twoText, /more than 5 minutes/);
  assert.match(twoText, /CMOS battery/);
  assert.match(twoText, /certificate/);
  assert.match(words(two.slice(two.indexOf('<caption>Table 4'), two.indexOf('<caption>Table 7'))), /time and\/or date difference[\s\S]*w32tm \/resync[\s\S]*CMOS battery/, 'Table 4 teaches the clock row');
  assert.match(words(two.slice(two.indexOf('<caption>Table 7'))), /w32tm \/query \/status[\s\S]*w32tm \/resync[\s\S]*Test-ComputerSecureChannel/, 'Table 7 lists the three new commands');
  const three = readingCard(html, 3);
  assert.match(words(three.slice(three.indexOf('<caption>Table 5'), three.indexOf('<caption>Table 6'))), /Inaccurate date and time[\s\S]*CMOS battery/, 'Table 5 has the date and time row');
  assert.doesNotMatch(words(readingCard(html, 1)), /CMOS|w32tm|Kerberos/, 'Reading 1 does not teach it');
  // The checks never ask about it.
  const all = checks();
  all.learn.questions.forEach((q, i) => assert.doesNotMatch(JSON.stringify(q), CLOCK_CAUSE, `Learn It question ${i + 1} never names the clock cause`));
  all.aplus.questions.forEach((q, i) => assert.doesNotMatch(JSON.stringify(q), CLOCK_CAUSE, `A+ question ${i + 1} never names the clock cause`));
  assert.doesNotMatch(`${all.learn.intro} ${all.aplus.intro}`, CLOCK_CAUSE);
  // Nor does the Prove It card: it names no cause at all.
  assert.doesNotMatch(words(section(html, 'its08-prove-it')), CLOCK_CAUSE, 'the Prove It card names no cause');
  assert.doesNotMatch(run('ITS08_OBJECTIVE'), CLOCK_CAUSE);
}

// No diagram line is wider than the drawing (0.56 em a character, the
// estimate the drawing code wraps with), and every box fits.
function testDiagramsFit() {
  for (const key of ['session', 'tool', 'loop', 'domain', 'screen']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS08_DIAGRAM_DRAW.${key}('${layout}')`);
      const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      assert.ok(Number(w) <= (layout === 'wide' ? 768 : 320), `${key} ${layout}: width`);
      for (const m of svg.matchAll(/<text class="([^"]+)" x="([\d.]+)" y="([\d.]+)"([^>]*)>([^<]*)</g)) {
        if (m[4].includes('middle') || m[4].includes('"end"')) continue;
        const size = m[1] === 'its01-dg-title' ? 15 : 13;
        const right = Number(m[2]) + m[5].replace(/&[a-z#0-9]+;/g, 'x').length * size * 0.56;
        assert.ok(right <= Number(w) + 1, `${key} ${layout}: "${m[5]}" fits across`);
        assert.ok(Number(m[3]) <= Number(h), `${key} ${layout}: "${m[5]}" fits down`);
      }
      for (const m of svg.matchAll(/<rect class="[^"]*" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
        assert.ok(Number(m[1]) + Number(m[3]) <= Number(w) + 1 && Number(m[2]) + Number(m[4]) <= Number(h) + 1, `${key} ${layout}: a box fits`);
      }
      // Every word drawn is in the screen-reader description.
      const said = run(`its08DiagramWords('${key}')`);
      for (const m of svg.matchAll(/<text[^>]*>([^<]+)</g)) {
        const text = m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
        text.split(/\s+/).forEach((word) => assert.ok(said.includes(word.replace(/[.,:;]$/, '')), `${key} ${layout}: "${word}" is in the description`));
      }
    }
  }
  // The labels the readings name are drawn.
  const drawn = (key) => ['wide', 'narrow'].map((layout) => run(`ITS08_DIAGRAM_DRAW.${key}('${layout}')`).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' '));
  drawn('session').forEach((text) => ['Verify', 'Ask', 'Privacy', 'Narrate', 'Check with them', 'End and log', 'Allow'].forEach((label) => assert.ok(text.includes(label), `diagram 1 shows ${label}`)));
  drawn('tool').forEach((text) => ['Is the user signed in to Windows?', 'Quick Assist', 'Remote Support', 'Yes', 'No', 'Remote won’t help', 'RDP 3389 and SSH 22'].forEach((label) => assert.ok(text.includes(label), `diagram 2 shows ${label}`)));
  drawn('loop').forEach((text) => ['Gather', 'Pick', 'Test it', 'Write the result in Tried', 'Fixed?', 'Out of road?', 'Table 3'].forEach((label) => assert.ok(text.includes(label), `diagram 3 shows ${label}`)));
  drawn('domain').forEach((text) => ['Can’t sign in', 'Trust', 'Clock', 'Account', 'Network', 'Test-ComputerSecureChannel', 'w32tm /query /status'].forEach((label) => assert.ok(text.includes(label), `diagram 4 shows ${label}`)));
  drawn('screen').forEach((text) => ['Input / Source', 'Cable and port', 'Win + P', 'Resolution', 'Sound output', 'the AV team'].forEach((label) => assert.ok(text.includes(label), `diagram 5 shows ${label}`)));
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its08-lab-10-1');
  assert.match(guided, /Lab 10\.1 · Guided Lab: two remote sessions/);
  assert.match(guided, /data-its08-console-launch href="[^"]*\?coach=hd-m08&amp;restart=1&amp;student=/, 'Lab 10.1 launches the hd-m08 coach');
  assert.match(guided, /Start Lab 10\.1 walkthrough/);
  assert.match(guided, /Part A is HD-2255[\s\S]*Part B is HD-2110/);
  assert.match(guided, /Quick Assist[\s\S]*Remote Support/);
  assert.match(guided, /A coach guides you through each step\./, 'no step count');
  assert.match(guided, /Show me the command/);
  assert.ok(words(guided).includes('Practice: not graded. Feedback only, no score.'));
  assert.match(guided, /Practice It · coached/);
  assert.doesNotMatch(guided, /extension|hd-m08-ext/i);
  assert.doesNotMatch(guided, /`/, 'the lab text renders its code, no backticks');
  const practice = section(html, 'its08-lab-10-2');
  assert.match(practice, /Lab 10\.2 · Practice tickets \(not graded\)/);
  assert.match(practice, /\?practice=its-08&amp;student=/, 'Lab 10.2 opens practice set its-08');
  assert.match(practice, /Practice: not graded/);
  assert.match(practice, /10-A, [\s\S]*10-B, [\s\S]*10-C, /);
  assert.match(practice, /“Check my work” feedback and no score/);
  assert.match(practice, /Three tickets/);
  assert.equal(statusLine(html, PRACTICE), 'Finish all three tickets: work each to Resolved, or hand it to the right team, and give it your work note.');
  // The Prove It says it opens soon: no launch button yet.
  assert.equal(run('ITS08_PROVE_OPEN'), false);
  const prove = section(html, 'its08-prove-it');
  assert.match(prove, /Prove It: Independent Ticket/);
  assert.match(prove, /Prove It · Assessment Lab · instructor reviewed/);
  assert.match(words(prove), /The Prove It opens soon\./);
  assert.doesNotMatch(prove, /data-its08-prove-launch|Start the Prove It|Reopen the Prove It|\?prove=/, 'no launch button while it is closed');
  assert.match(words(prove), /Work Lab 10\.1, the guided lab, first/, 'Lab 10.1 first, until it is done');
  // The lab cards' exact labels and minutes: 12 / 8 / 10.
  assert.deepEqual([GUIDED, PRACTICE, PROVE].map((k) => run(`LABS.find((l) => l.key === '${k}').title`)), [
    'Lab 10.1 · Guided Lab: two remote sessions', 'Lab 10.2 · Practice tickets (not graded)', 'Prove It: Independent Ticket',
  ]);
  assert.deepEqual([...html.matchAll(/<h2 id="its08-(?:lab-10-1|lab-10-2|prove-it)-title">([^<]*)</g)].map((m) => m[1]), [
    'Lab 10.1 · Guided Lab: two remote sessions', 'Lab 10.2 · Practice tickets (not graded)', 'Prove It: Independent Ticket',
  ].map(esc));
  assert.deepEqual([...html.matchAll(/data-its08-lab-minutes>Time: ([^<]+)</g)].map((m) => m[1]), [GUIDED, PRACTICE, PROVE].map((k) => minutesText(minutesOf(k))));
  assert.deepEqual([GUIDED, PRACTICE, PROVE].map(minutesOf), [12, 8, 10]);
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-08-assessment-module/);
  ['its08-prove-it', 'its08-check-learn', 'its08-check-aplus', 'its08-lab-10-2', 'its08-lab-10-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));
  assert.doesNotMatch(html, /href="#its08-cardsort"/);

  // Lab 10.1 is still the gating lab: a saved walkthrough waits for the instructor.
  const saved = hdUser({ [GUIDED]: submitted() });
  fresh(saved);
  const line = statusLine(page().view(saved, HD), GUIDED);
  assert.match(line, /^Lab 10\.1 submitted /);
  assert.match(line, /waiting for instructor review/, 'Lab 10.1 still gates the module');
}

/* --------------------------------------------------------------- checks */

const shownOrder = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its08-answer data-check="${checkId}" data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its08-answer data-check="${checkId}" data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

function testCheckContent() {
  const all = checks();
  assert.deepEqual(Object.keys(all), ['learn', 'aplus']);
  assert.equal(all.learn.questions.length, 6, 'Learn It: six questions');
  assert.equal(all.aplus.questions.length, 8, 'A+: eight questions');
  assert.equal(all.learn.title, 'Learn It knowledge check');
  assert.equal(all.aplus.title, 'A+ check (Core 1: 2.1, 4.1, 5.1, 5.3)');
  assert.match(all.learn.intro, /5 of your first answers/);
  assert.match(all.aplus.intro, /6 of your first answers/);
  assert.deepEqual(all.aplus.questions.map((q) => q.choices[q.answer]), [
    '3389', 'SSH', 'A virtual desktop (VDI)', 'The display resolution: set the projector’s recommended one',
    'It is overheating because the filter or vents are blocked',
    'The PC’s power-on self-test found a hardware fault; record the pattern and escalate',
    'Switch it off, unplug it and keep people away, then you escalate', 'A failing fan',
  ]);
  assert.deepEqual(all.learn.questions.map((q) => q.choices[q.answer]), [
    'Verify the caller, then ask them now whether you may connect, and wait for them to allow it',
    'Ask them to close anything personal before you look around, and open only what the problem needs',
    'Write down the exact words, ask when it started, what changed and whether anyone else has it, then search the KB with the exact text',
    'So you know which change fixed it, and can undo the ones that didn’t',
    'Gather the evidence the article asks for, hand off to Desktop Support and tell the user what happens next',
    'Remote Support, with a request they allow on the sign-in screen',
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
    assert.doesNotMatch(JSON.stringify(check), BANNED, `${id}: no banned word`);
    assert.doesNotMatch(JSON.stringify(check), PLAN_ID, `${id}: no plan id`);
  }
  // Both checks sit after the reading they follow: Learn It after Reading 2,
  // A+ after Reading 3, then the labs.
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const at = (needle) => html.indexOf(needle);
  assert.ok(at('<h4>Reading 2 · ') < at('id="its08-check-learn"') && at('id="its08-check-learn"') < at('<h4>Reading 3 · '), 'Learn It check after Reading 2');
  assert.ok(at('<h4>Reading 3 · ') < at('id="its08-check-aplus"') && at('id="its08-check-aplus"') < at('id="its08-lab-10-1"'), 'A+ check after Reading 3, before the labs');
  assert.ok(!readingCard(html, 2).includes('its08-check-'), 'a check sits outside its reading card');
}

// Options are shuffled on each attempt. Each student gets their own order, the
// same on every redraw, and a new one after Start again.
function testChoicesShuffled() {
  const all = checks();
  const names = ['m10order1', 'm10order2', 'm10order3', 'm10order4', 'm10order5'];
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
  assert.notDeepEqual(orders.m10order1, orders.m10order2, 'two students see different orders');
  const places = new Set();
  names.forEach((name) => Object.entries(all).forEach(([id, check]) => check.questions.forEach((question, q) => places.add(orders[name][id][q].indexOf(question.answer)))));
  assert.equal(places.size, 4, 'the right answer lands in every place');
  const user = hdUser({}, 'm10order1');
  fresh(user);
  page().view(user, HD);
  run('its08Answer')('aplus', 0, all.aplus.questions[0].answer);
  run('its08ResetCheck')('aplus');
  const retake = page().view(user, HD);
  assert.notDeepEqual(all.aplus.questions.map((_, q) => shownOrder(retake, 'aplus', q)), orders.m10order1.aplus, 'a retake reshuffles');
  assert.deepEqual(all.learn.questions.map((_, q) => shownOrder(retake, 'learn', q)), orders.m10order1.learn, 'the other check keeps its order');
  assert.doesNotMatch(checkBlock(retake, 'aplus'), /Correct\.|Not quite\./, 'Start again clears the picks');
}

function testChecksCompleteAtSeventyPercent() {
  const all = checks();
  const answer = run('its08Answer');
  const wrong = (q) => (q.answer + 1) % q.choices.length;
  const saved = (user) => LabRuntime.load(STATE_ID, user, {});
  // The pass mark is 70% in whole numbers: 6 of 8 and 5 of 6.
  assert.deepEqual([run(`its08CheckNeeded('aplus')`), run(`its08CheckNeeded('learn')`), run('ITS08_CHECK_PASS_TENTHS')], [6, 5, 7]);

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
  assert.match(block, /data-its08-check-reset="aplus"/, 'Start again is offered once a question is answered');
  answer('aplus', 0, q0.answer);
  assert.ok(checkBlock(page().view(user, HD), 'aplus').includes(esc(q0.why)), 'the right pick shows the Why');

  // A+: 6 of 8 first picks right (questions 1 and 2 wrong first) completes it,
  // saves only its own flag and time, and ticks only its rail row.
  answer('aplus', 1, wrong(all.aplus.questions[1]));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  let state = saved(user);
  assert.equal(state.aplusCheckCompleted, true, '6 of 8 is a pass');
  assert.ok(state.aplusCheckCompletedAt);
  assert.notEqual(state.learnCheckCompleted, true, 'the Learn It check is still open');
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([state.score, state.bestScore], [0, 0], 'no score saved (the runtime’s own fields stay 0)');
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /A\+ check \(Core 1: 2\.1, 4\.1, 5\.1, 5\.3\) complete/);
  assert.equal(railRow(html, 'its08-check-aplus').ticked, true);
  assert.equal(railRow(html, 'its08-check-learn').ticked, false);

  // Learn It: 5 of 6 completes it.
  answer('learn', 0, wrong(all.learn.questions[0]));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.equal(state.learnCheckCompleted, true, '5 of 6 is a pass');
  assert.ok(state.learnCheckCompletedAt);
  html = page().view(user, HD);
  assert.equal(railRow(html, 'its08-check-learn').ticked, true);
  assert.equal(inserts().length, 0, 'the checks save no lab attempt');

  // Another student: 5 of 8 (62.5%) and 4 of 6 (66.7%) are retakes, nothing saved.
  user = hdUser({}, 'm10page2');
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
  assert.equal(railRow(html, 'its08-check-aplus').ticked, false);
  // Start again clears the picks and a clean pass then completes it.
  run('its08ResetCheck')('aplus');
  assert.doesNotMatch(checkBlock(page().view(user, HD), 'aplus'), /Retake:|Not quite\./);
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  assert.equal(saved(user).aplusCheckCompleted, true, 'a clean retake completes it');
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm10save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  checks().learn.questions.forEach((q, i) => run('its08Answer')('learn', i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its08-check-learn').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'learn'), /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its08-check-retry="learn"/);
  assert.equal(railRow(html, 'its08-check-learn').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).learnCheckCompleted, true);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-08' }], error: null });
  run('its08RetryCheckSave')('learn');
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(checkBlock(html, 'learn'), /Learn It knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).learnCheckCompleted, true);
}

/* ---------------------------------------------------------- Lab 10.1 save */

const note = { author: 'Tier 1', time: '09:40', text: 'Handed to Desktop Support with the evidence.' };
const ticket = (id, status = 'Resolved', notes = []) => ({ id, status, notes, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' } } });
const labWork = (tickets = [ticket('HD-2255'), ticket('HD-2110', 'Escalated', [note])]) => ({ version: 1, tickets });
const coachMessage = (source, work, student = studentOf(signedIn), id = 'hd-m08') => ({ data: { type: 'mnt-coach-complete', id, nonce: 'c-1', student, work }, origin: SIM, source });

function testLab1CompleteRule() {
  const complete = run('its08Lab1Complete');
  assert.deepEqual(copy(run('ITS08_LAB1_TICKETS')), ['HD-2255', 'HD-2110']);
  assert.equal(complete(labWork()), true, 'HD-2255 Resolved, HD-2110 handed over with a note');
  assert.equal(complete(labWork([ticket('HD-2255'), ticket('HD-2110', 'In Progress', [note])])), true, 'HD-2110 only has to be not Resolved');
  assert.equal(complete(labWork([ticket('HD-2110', 'Escalated', [note]), ticket('HD-2255')])), true, 'the order does not matter');
  assert.equal(complete(labWork([ticket('HD-2255'), ticket('HD-2110', 'Escalated', [note, note])])), true, 'more than one note');
  for (const [name, work] of [
    ['HD-2255 not resolved', labWork([ticket('HD-2255', 'In Progress'), ticket('HD-2110', 'Escalated', [note])])],
    ['HD-2255 open', labWork([ticket('HD-2255', 'Open'), ticket('HD-2110', 'Escalated', [note])])],
    ['HD-2110 resolved', labWork([ticket('HD-2255'), ticket('HD-2110', 'Resolved', [note])])],
    ['HD-2110 with no notes', labWork([ticket('HD-2255'), ticket('HD-2110', 'Escalated')])],
    ['HD-2110 missing', labWork([ticket('HD-2255')])],
    ['HD-2255 missing', labWork([ticket('HD-2110', 'Escalated', [note])])],
    ['another module’s tickets', labWork([ticket('HD-2212'), ticket('HD-2213'), ticket('SR-2222', 'Open')])],
    ['no tickets', labWork([])],
    ['no work', null],
    ['no tickets list', { version: 1 }],
  ]) assert.equal(complete(work), false, name);
}

async function testGuidedLabSave() {
  // Unfinished work: nothing saved and the simulator hears why.
  for (const work of [
    labWork([ticket('HD-2255', 'In Progress'), ticket('HD-2110', 'Escalated', [note])]),
    labWork([ticket('HD-2255'), ticket('HD-2110', 'Resolved', [note])]),
    labWork([ticket('HD-2255'), ticket('HD-2110', 'Escalated')]),
    labWork([ticket('HD-2255')]),
    labWork([ticket('HD-2110', 'Escalated', [note])]),
    labWork([ticket('HD-2212'), ticket('HD-2213'), ticket('SR-2222', 'Open')]),
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

  // Another student's work, another origin, or another module's coach: nothing saved.
  let user = hdUser();
  fresh(user);
  let catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork(), 'student-someoneelse'));
  assert.equal(inserts().length, 0);
  assert.deepEqual(catcher.replies.map((r) => r.data.reason), ['other-student']);
  await page().onMessage({ ...coachMessage(catcher.source, labWork()), origin: 'https://elsewhere.test' });
  await page().onMessage(coachMessage(catcher.source, labWork(), studentOf(signedIn), 'hd-m04'));
  assert.equal(inserts().length, 0, 'another origin or coach saves nothing');
  assert.equal(catcher.replies.length, 1, 'and gets no reply from this page');

  // HD-2255 resolved and HD-2110 handed over with a note: one Lab 10.1 attempt.
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 10.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.score, row.track_code], [null, 'HDESK']);
  assert.ok(['complete', 'submitted'].includes(row.state), `a saved state (${row.state})`);
  assert.deepEqual(row.result.work.tickets.map((t) => [t.id, t.status]), [['HD-2255', 'Resolved'], ['HD-2110', 'Escalated']]);
  assert.deepEqual(row.result.work.tickets[1].notes.map((n) => n.text), [note.text], 'the work note is kept');
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  const after = LabRuntime.load(STATE_ID, user, {});
  assert.deepEqual([after.consoleStarted, after.consoleCompleted], [true, true], 'the page records the walkthrough');
  const line = statusLine(page().view(user, HD), GUIDED);
  assert.match(line, /^Lab 10\.1 submitted /);
  assert.match(line, /waiting for instructor review/, 'Lab 10.1 still gates: the instructor reviews it');
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
  assert.doesNotMatch(statusLine(page().view(user, HD), GUIDED), /submitted|waiting for instructor review/);
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).consoleCompleted, true, 'nothing is marked done after a failed save');
}

// The coach's own end: the simulator's Lab 10.1 coach sends the two records
// the page checks for.
function testCoachSendsWhatThePageNeeds() {
  const coaches = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m08': \['HD-2255', 'HD-2110'\]/);
  assert.match(coaches, /itsPortalUrl\('#\/program\/it-support\/module\/10', 'hd-m08'\)/, 'Finish returns to Module 10’s page');
}

/* ---------------------------------------------------------- Lab 10.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-08' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves exactly the tickets the simulator's set reports as done.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-08': \{ title:'Module 10 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-08 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);
  assert.deepEqual(copy(run('ITS08_PRACTICE_TICKETS')), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-08', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-08', nonce: 'p-1', saved: true }, origin: SIM }]);
  const html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 10.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its08-lab-10-2').ticked, true);
  await page().onMessage(practiceMessage(source, { nonce: 'p-2' }));
  assert.equal(inserts().length, 1, 'again: answered as saved, nothing inserted');

  // The order the simulator lists them in doesn't matter.
  user = hdUser();
  fresh(user);
  const reordered = replyCatcher();
  await page().onMessage(practiceMessage(reordered.source, { tickets: TICKETS.slice().reverse() }));
  assert.equal(inserts().length, 1);

  // Already in the database (another browser saved it): not saved twice.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: [{ completed_at: '2026-11-26T15:00:00Z', reviewed_at: null, redo_requested: false, superseded_at: null }], error: null } : { data: null, error: null });
  const known = replyCatcher();
  await page().onMessage(practiceMessage(known.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(known.replies.map((r) => r.data.saved), [true]);

  // Refused: wrong tickets, another student, signed out.
  for (const [name, fields, reason, setup] of [
    ['two of the three', { tickets: TICKETS.slice(0, 2) }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2226'] }, 'incomplete'],
    ['one repeated', { tickets: ['HD-2223', 'HD-2224', 'HD-2224'] }, 'incomplete'],
    ['a lab ticket instead', { tickets: ['HD-2223', 'HD-2224', 'HD-2255'] }, 'incomplete'],
    ['Lab 10.1’s two tickets', { tickets: ['HD-2255', 'HD-2110'] }, 'incomplete'],
    ['no tickets', { tickets: [] }, 'incomplete'],
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
  // Module 9's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-04', tickets: ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221'] }));
  await page().onMessage(practiceMessage(other.source, { origin: 'https://elsewhere.test' }));
  assert.equal(inserts().length, 0);
  assert.equal(other.replies.length, 0, 'another set or origin gets no reply from this page');

  // A second tab saving at this moment holds the lock: busy, nothing inserted.
  user = hdUser();
  fresh(user);
  ctx.localStorage.setItem(`mnt.practice-save.${user.userId}.${PRACTICE}`, String(Date.now()));
  const busy = replyCatcher();
  await page().onMessage(practiceMessage(busy.source));
  assert.equal(inserts().length, 0);
  assert.deepEqual(busy.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'busy']]);

  // The save fails: not saved, nothing shows complete, the lock is released.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'insert' ? { data: null, error: { message: 'network' } } : { data: null, error: null });
  const failed = replyCatcher();
  await quiet(() => page().onMessage(practiceMessage(failed.source)));
  assert.deepEqual(failed.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
  assert.doesNotMatch(statusLine(page().view(user, HD), PRACTICE), /Complete/);
  assert.ok(!ctx.localStorage.getItem(`mnt.practice-save.${user.userId}.${PRACTICE}`), 'the lock is released');

  // The read that looks for an earlier record fails: nothing is saved twice blind.
  user = hdUser();
  fresh(user);
  ctx.supabaseResponder = (call) => (call.table === 'lab_attempts' && call.op === 'select' ? { data: null, error: { message: 'read failed' } } : { data: null, error: null });
  const unread = replyCatcher();
  await quiet(() => page().onMessage(practiceMessage(unread.source)));
  assert.equal(inserts().length, 0);
  assert.deepEqual(unread.replies.map((r) => [r.data.saved, r.data.reason]), [[false, 'save-failed']]);
}

// A Prove It message while the Prove It is closed saves nothing and gets no
// reply from the Lab 10.2 or Lab 10.1 handlers.
async function testProveMessagesIgnored() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const catcher = replyCatcher();
  await page().onMessage({ data: { type: 'mnt-prove-submitted', id: 'its-08', nonce: 'x', student: studentOf(user) }, origin: SIM, source: catcher.source });
  assert.equal(inserts().length, 0);
  assert.equal(catcher.replies.length, 0);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 10.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-26T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm10p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-08', tickets: TICKETS } });
  assert.match(html, /Module 10 · Lab 10\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2223, HD-2224, HD-2225/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 10.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), true, 'Lab 10.1 still gates, so it is reviewed');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PROVE, track_code: 'HDESK' }), true, 'the Prove It is');
  const guided = sheet.render({ ...base, score: 82, id: 'm10g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 10 · Two remote sessions/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m10-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testClockCauseStaysInTheReadings, testDiagramsFit, testLabCardsAndRail, testCheckContent, testChoicesShuffled, testChecksCompleteAtSeventyPercent, testCheckSaveThatFails, testLab1CompleteRule, testGuidedLabSave, testCoachSendsWhatThePageNeeds, testPracticeSave, testProveMessagesIgnored, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m10-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

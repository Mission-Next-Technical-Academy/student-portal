// Help Desk Module 9 (key its-04) course page, portal/it-support-module-04.js,
// on the Module 8 page pattern:
//
//   - The catalogue: Lab 9.1 (75 min, still the gating lab), Lab 9.2 (70 min,
//     Practice It) and the Prove It (35 min) from the old 180-minute lab; 480
//     minutes in all, and ITHD-101.7 keeps all 180 lab minutes. The four filed
//     lessons keep their keys, titles and 75 minutes.
//   - The page: shown as Module 09 in week 5, four filed lessons (9.1 to 9.4)
//     as five reading cards (Lesson 9.1 holds Readings 1 and 2), Tables 1 to 11
//     (no Table 12), five numbered diagrams; none of the banned words.
//   - Reading 2's taught-only topic (a static address left from another
//     network) is taught there and never rehearsed: it stays out of the checks, the card
//     sort, the lab cards, the "What You'll Learn" lists, the Coming-up lines,
//     the objective and the catalogue text.
//   - The "Name it" card sort: twelve cards, three boxes, a wrong box says
//     why, the right box settles the card; all twelve right saves "complete"
//     and nothing else. It sits inside Reading 1 and has no rail row.
//   - The two checks: Learn It (6 questions, after Reading 3) and A+ (10
//     questions, after Reading 5), choices shuffled per student and per
//     attempt, stable on a redraw; a wrong pick shows only its If wrong line;
//     5 of 6 and 7 of 10 first picks right save "complete" to the case state,
//     4 of 6 and 6 of 10 don't; a failed save takes the tick off again.
//   - Lab 9.1: the coach's Finish saves an attempt only when HD-2212 and
//     HD-2213 are resolved and the request SR-2222 is in the work.
//   - Lab 9.2: the practice set's message saves one completion record, and
//     only for the five tickets the simulator's set reports.
//   - The Prove It card says "Opens soon" and opens nothing.
//   - The instructor sheets: the new lab labels and the Lab 9.2 sheet.
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
const page = () => run(`MODULE_LABS['it-support/9']`);
const studentOf = (user) => LabRuntime.anonymousStudentId(user);
const copy = (value) => JSON.parse(JSON.stringify(value));
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATE_ID = 'its04-page-v1';
const GUIDED = 'lab-its-04-connectivity';
const PRACTICE = 'lab-its-04-practice-tickets';
const PROVE = 'lab-its-04-prove-it';
// The five tickets the simulator's practice set reports as done: 9-B's three
// linked children (HD-2216 to HD-2218) are not part of it.
const TICKETS = ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2221'];
const DAY = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const PAGE_FILE = path.join(ROOT, 'portal/it-support-module-04.js');
// What a student must never see (and the catalogue must never say).
const BANNED = /Module 0?4\b|lab VM|CompTIA|220-1201|HD-2104|HD-2105|HD-2113|Connected But Nothing Works|\?prove=/i;
// Reading 2's taught-only topic. Reading 2 teaches it; nothing else practises it.
const CAUSE = /static address|from another network|DHCP Enabled: No|192\.168\.0\.20|guest Wi-Fi/i;
// The practice tickets' causes, which a Coming-up line must not name.
const PRACTICE_CAUSES = /2\.4|microwave|fiber|backup|cellular|guest|VPN|personal phone|static|another network|Enabled: No/i;

function hdUser(attempts = {}, name = 'm09page') {
  return {
    userId: `user-${name}`, email: `${name}@test.invalid`, trackCode: 'HDESK',
    enrollments: [{ programSlug: 'it-support', status: 'active', accessMode: 'full' }],
    remoteModuleProgress: {}, remoteVerifiedModuleProgress: {}, remoteModuleDetail: {},
    latestLabAttemptByKey: attempts, openLabRedoFeedbackByLabKey: {}, openLabRedosByModuleKey: {},
  };
}
function resetChecks() {
  run(`['learn', 'aplus'].forEach((k) => { its04CheckAnswers[k] = {}; its04CheckPicks[k] = {}; its04CheckAttempt[k] = 0; }); its04CheckSaveFailed.learn = false; its04CheckSaveFailed.aplus = false; its04CheckSaveFailed.sort = false; its04SortPicks = {};`);
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
  const start = html.indexOf(checkId === 'sort' ? 'id="its04-cardsort"' : `id="its04-check-${checkId}"`);
  assert.ok(start >= 0, `check ${checkId}`);
  const footer = html.indexOf(`data-its04-check-footer="${checkId}"`, start);
  return html.slice(start, html.indexOf('</div>', footer));
};
const words = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
const submitted = (at = '2026-11-26T15:00:00Z') => ({ completedAt: at, reviewedAt: null, redoRequested: false, supersededAt: null });
const checks = () => copy(run('ITS04_CHECKS'));
// One reading's card, from its <details> to its end.
const readingCard = (html, n) => {
  const start = html.indexOf(`data-its04-reading="${n}"`);
  assert.ok(start >= 0, `Reading ${n}`);
  const open = html.lastIndexOf('<details', start);
  return html.slice(open, html.indexOf('</details>', start) + '</details>'.length);
};
const figures = (html) => html.split('<figure ').slice(1).map((piece) => piece.slice(0, piece.indexOf('</figure>')));

/* ------------------------------------------------------------ catalogue */

function testCatalogue() {
  const m = HD.modules['its-04'];
  assert.deepEqual([m.number, m.week, m.durationMinutes, m.lessons, m.labs], [9, 5, 480, 4, 3]);
  assert.equal(m.title, 'Networking Fundamentals for Support', 'the filed title');
  assert.deepEqual(copy(m.curriculumItems.map((item) => [item.key, item.title, item.durationMinutes, item.parentAllocations.map((a) => [a.code, a.minutes])])), [
    ['its-04-lesson-01', 'IP Addressing, Subnets & How Networks Talk', 75, [['ITHD-101.7', 75]]],
    ['its-04-lesson-02', 'Diagnostic Commands: ipconfig, ping, tracert & nslookup', 75, [['ITHD-101.7', 75]]],
    ['its-04-lesson-03', 'DHCP, DNS & Recognizing APIPA', 75, [['ITHD-101.7', 75]]],
    ['its-04-lesson-04', 'Domain Joining & Explaining Network Issues in Plain Language', 75, [['ITHD-101.7', 75]]],
  ], 'the filed lesson keys, titles, minutes and parents');
  const labs = copy(run('LABS').filter((l) => l.module === 'its-04'));
  // Lab 9.1 keeps no phase: until the Prove It opens it is the gating lab and
  // an instructor reviews it. Only the practice tickets are Practice It.
  assert.deepEqual(labs.map((l) => [l.key, l.title, l.instructionalMinutes, l.phase || null, l.parentAllocations.map((a) => [a.code, a.minutes])]), [
    [GUIDED, 'Lab 9.1 · Guided Lab: the connectivity checklist', 75, null, [['ITHD-101.7', 75]]],
    [PRACTICE, 'Lab 9.2 · Practice tickets (not graded)', 70, 'practice', [['ITHD-101.7', 70]]],
    [PROVE, 'Prove It: Independent Ticket', 35, null, [['ITHD-101.7', 35]]],
  ]);
  const parent = labs.reduce((sum, l) => sum + l.parentAllocations.reduce((s, a) => s + a.minutes, 0), 0);
  assert.equal(parent, 180, 'ITHD-101.7 keeps the old lab’s 180 minutes');
  const lessons = m.curriculumItems.reduce((sum, item) => sum + item.durationMinutes, 0);
  assert.equal(lessons + labs.reduce((sum, l) => sum + l.instructionalMinutes, 0), 480, 'lessons and labs still total 480');
  const text = JSON.stringify({ labs, summary: m.summary, objectives: m.curriculumItems.map((i) => i.objective), skills: m.skills });
  assert.doesNotMatch(text, BANNED, 'no catalogue text names a banned word');
  assert.doesNotMatch(text, /comptia\.org|RFC|Windows Server 20\d\d/i);
  assert.doesNotMatch(text, CAUSE, 'no catalogue text names the Reading 2 topic');
}

/* ----------------------------------------------------------------- page */

function testPageContent() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  assert.match(html, /class="its04-shell"/);
  assert.match(html, /Module 09 · 8 Hours · Week 5/, 'the hero shows Module 09, 480 minutes, week 5');
  assert.match(html, /<dt>Lessons<\/dt><dd>4<\/dd>/, 'the hero counts the four filed lessons');
  const shown = words(html);
  const banned = /.{0,60}(Module 0?4\b|lab VM|CompTIA|220-1201|HD-2104|HD-2105|HD-2113|Connected But Nothing Works|\?prove=).{0,60}/i.exec(shown);
  assert.equal(banned && banned[0], null, 'nothing a student sees names a banned word');
  assert.doesNotMatch(html, BANNED, 'nor does the markup');
  assert.doesNotMatch(html, /comptia\.org|rfc-editor|datatracker|\bRFC\b|Windows Server 20\d\d/i);
  assert.match(shown, /A\+ check/, '"A+ check" stays');
  // The whole file, comments included.
  const source = fs.readFileSync(PAGE_FILE, 'utf8');
  assert.doesNotMatch(source, BANNED);
  assert.doesNotMatch(source, /Windows Server 20\d\d|comptia\.org|itsRegisterCoachModule|itsProveLaunchHref|itsProveReceiveMessage|its04ProveChanged|its06/i);
  // The objective, word for word.
  assert.ok(shown.includes('A+ Core 1: 2.1 TCP and UDP ports and protocols · 2.2 wireless networking technologies · 2.4 network configuration concepts (VPN) · 2.5 networking hardware · 2.6 SOHO network configuration and IP addressing · 2.7 internet connection types and network types · 2.8 networking tools · 3.2 cable types and connectors · 5.5 troubleshoot network issues.'));
  assert.ok(shown.includes('Competencies: 2 Practical networking · 3 Ticketing discipline · 7 Communication under pressure; practised: 9 Triage and escalation judgment.'));
  assert.ok(shown.includes('trace a user’s connection from the desk to the internet and check the physical link first'));
  // Four filed lessons as five reading cards; Lesson 9.1 holds Readings 1 and 2.
  assert.deepEqual([...html.matchAll(/<strong>Lesson (9\.\d) · Reading (\d) · /g)].map((m) => `${m[1]}/${m[2]}`), ['9.1/1', '9.1/2', '9.2/3', '9.3/4', '9.4/5']);
  assert.deepEqual([...html.matchAll(/data-its04-lesson="([^"]+)"/g)].map((m) => m[1]), ['its-04-lesson-01', 'its-04-lesson-01', 'its-04-lesson-02', 'its-04-lesson-03', 'its-04-lesson-04']);
  assert.equal((html.match(/Readings 1 and 2 share Lesson 9\.1’s 2 Hours/g) || []).length, 2, 'Readings 1 and 2 say they share the lesson’s minutes');
  [1, 2, 3, 4, 5].forEach((n) => assert.equal((html.match(new RegExp(`<h4>Reading ${n} · `, 'g')) || []).length, 1, `Reading ${n}`));
  assert.deepEqual([...html.matchAll(/<small>Reading time: about (\d+) minutes/g)].map((m) => Number(m[1])), [12, 10, 12, 10, 10], 'each card shows its reading time');
  assert.deepEqual([...html.matchAll(/<h4>Reading (\d) · ([^<]*)<\/h4>/g)].map((m) => m[2]), [
    'How a network fits together', 'Addresses', 'The connectivity checklist', 'Wi-Fi, DHCP and DNS from the desk', 'VPN, joining the domain, and saying it plainly',
  ]);
  // Five diagrams, each a wide and a narrow drawing, each with a visible
  // number the readings can point at.
  assert.equal((html.match(/<figure /g) || []).length, 5, 'five diagrams');
  ['From the desk to the internet', 'Read an address', 'The checklist', 'Two ways a name gets an address', 'Inside or outside'].forEach((title, i) => {
    assert.equal((html.match(new RegExp(`role="img" aria-label="${esc(title)}"`, 'g')) || []).length, 2, `${title}: a wide and a narrow drawing`);
    assert.ok(html.includes(`<p class="its01-dg-heading">Diagram ${i + 1} · ${esc(title)}</p>`), `${title} is captioned Diagram ${i + 1}`);
  });
  assert.match(shown, /\(diagram 5\)/, 'Reading 5 points at diagram 5, which is on the page');
  figures(html).forEach((figure) => {
    assert.match(figure, /<p class="its01-sr-only" id="its04-dg-[a-z]+-desc">[^<]{40,}/, 'alt text');
    assert.equal((figure.match(/aria-describedby="its04-dg-[a-z]+-desc"/g) || []).length, 2, 'both drawings point at the alt text');
  });
  // Spec section 5: Tables 1 to 11 by reading (Table 4 and Table 9 each in
  // parts); Table 12 is not on the page.
  const captions = [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].map((m) => m[1]);
  assert.deepEqual(captions.map((c) => (/^Table (\d+)/.exec(c) || [])[1]), ['1', '2', '3', '4', '4', '5', '6', '7', '8', '11', '9', '9', '9', '10']);
  assert.equal(captions.length, 14);
  assert.doesNotMatch(html, /Table 12|Priorities in this module|Priorities against/);
  assert.ok(shown.includes('Optional, earning the same credit as the screen:'), 'Table 11’s optional line');
  assert.ok(shown.includes('TCP sets up a conversation and checks everything arrived'), 'the TCP and UDP line under Table 8');
  assert.ok(shown.includes('Short-range radios:'), 'Table 9’s short-range radios line');
  // The four Module 4 replacements.
  assert.ok(shown.includes('which you first saw on the docks and monitors earlier in the course (Table 2)'));
  assert.ok(shown.includes('The docks and monitors you met earlier use these'));
  assert.ok(shown.includes('A Bluetooth headset (Module 08)'));
  assert.ok(shown.includes('Is that service listening (you met it in Module 07)'));
  // Spec section 8.5's key sentences, one from each reading.
  [
    'A network is a chain, and a “can’t connect” ticket means one link in the chain is broken.',
    'Changing someone’s settings without writing down the old values is a serious mistake, because they may need them back.',
    'Your fixes are on the user’s side: a cable, a jack, a fresh address, a cleared cache, one setting, the VPN.',
    'a home router or guest Wi-Fi can’t answer for company names.',
    'Leave out addresses, acronyms and team jargon, and never promise a time you can’t keep.',
  ].forEach((text) => assert.ok(html.includes(esc(text)), `the page shows: ${text}`));
  // Typed lines render as code, with no stray markers.
  assert.match(html, /<code class="its04-code">ipconfig \/all<\/code>/);
  assert.match(html, /<code class="its04-code">Test-NetConnection &lt;host&gt; -Port &lt;n&gt;<\/code>/);
  assert.match(html, /<code class="its04-code">TcpTestSucceeded : True<\/code>/);
  assert.doesNotMatch(shown, /`/, 'no stray backticks');
  assert.doesNotMatch(shown, /(?<!\*)\*\*(?!\*)/, 'no stray bold markers');
  // The file the curriculum check reads: four lessons with the filed titles,
  // each its filed 75 minutes plus its 45-minute share of the lab.
  const pairs = [...source.matchAll(/title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g)].map((m) => [m[1].replace(/\\'/g, "'"), Number(m[2])]);
  assert.deepEqual(pairs, [
    ['IP Addressing, Subnets & How Networks Talk', 120],
    ['Diagnostic Commands: ipconfig, ping, tracert & nslookup', 120],
    ['DHCP, DNS & Recognizing APIPA', 120],
    ['Domain Joining & Explaining Network Issues in Plain Language', 120],
  ]);
  // Sources: the four Microsoft Learn pages, no RFCs.
  const sources = section(html, 'its04-sources');
  assert.deepEqual([...sources.matchAll(/class="msources-title-text">([^<]*)</g)].map((m) => m[1]), ['ipconfig', 'nslookup', 'Test-NetConnection', 'TCP/IP addressing and subnetting']);
  assert.equal((sources.match(/learn\.microsoft\.com/g) || []).length, 4);
}

// Reading 2's taught-only topic is taught there and nowhere else it could
// be rehearsed.
function testReadingTwoTopicStaysInReadingTwo() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  // It is in Reading 2: what it is, how it shows, why Windows falls back, the fix.
  const two = words(readingCard(html, 2));
  assert.match(two, /a static address left from another network/i);
  assert.match(two, /DHCP Enabled: No/);
  assert.match(two, /192\.168\.0\.20/);
  assert.match(two, /guest Wi-Fi/);
  assert.match(two, /write down every value that’s there/);
  assert.match(two, /Edit IP settings/);
  assert.match(two, /Automatic \(DHCP\)/);
  // Diagram 2 is the one figure that may show a static address.
  const [first, address, ...others] = figures(html);
  assert.match(words(address), /192\.168\.0\.20/);
  assert.match(words(address), /A static address from another network: write it down, tell the user, set it back to Automatic \(DHCP\)/);
  [first, ...others].forEach((figure) => assert.doesNotMatch(words(figure), CAUSE, 'no other diagram shows the Reading 2 topic'));

  // The learn lists and the Coming-up lines.
  const lists = [...html.matchAll(/<h4>What You'll Learn<\/h4>\s*<ul>([\s\S]*?)<\/ul>/g)].map((m) => [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((li) => words(li[1]).trim()));
  assert.deepEqual(lists.map((l) => l.length), [4, 3, 4, 4, 3], 'three or four items for each reading');
  lists.flat().forEach((item) => assert.doesNotMatch(item, CAUSE, `"${item}" never names the Reading 2 topic`));
  const comingUp = [...html.matchAll(/<strong>Coming up in your lab:<\/strong> ([^<]*)<\/span>/g)].map((m) => m[1]);
  assert.equal(comingUp.length, 5, 'a Coming-up line for each reading');
  comingUp.forEach((line) => {
    assert.doesNotMatch(line, CAUSE, `"${line}" never names the Reading 2 topic`);
    assert.doesNotMatch(line, PRACTICE_CAUSES, `"${line}" never names a practice ticket’s cause`);
  });
  // The objective, the card sort, the checks and the lab cards.
  assert.doesNotMatch(run('ITS04_OBJECTIVE'), CAUSE);
  assert.doesNotMatch(JSON.stringify(copy(run('ITS04_CARD_SORT'))), CAUSE);
  ['its04-lab-9-1', 'its04-lab-9-2', 'its04-prove-it'].forEach((id) => assert.doesNotMatch(words(section(html, id)), CAUSE, `${id} never names the Reading 2 topic`));
  const labCards = words(html.slice(html.indexOf('id="its04-lab-9-1"'), html.indexOf('id="its04-sources"')));
  assert.doesNotMatch(labCards, /microwave|2\.4 GHz|fiber|cellular|guest|VPN|personal phone/i, 'the lab cards name no practice cause');
  const all = checks();
  all.learn.questions.forEach((q, i) => assert.doesNotMatch(JSON.stringify(q), CAUSE, `Learn It question ${i + 1} never names the Reading 2 topic`));
  all.aplus.questions.forEach((q, i) => {
    // A+ question 1 is spec wording and stays: its choice "Someone set a
    // static address" and its If wrong line are a distractor about APIPA, not
    // a step that has the student work the topic. Question 10’s home DNS
    // server 192.168.0.1 is a home network's normal DNS, not the topic.
    if (i === 0) {
      assert.equal(q.choices[0], 'Someone set a static address');
      assert.match(q.ifWrong[0], /static address/);
      return;
    }
    assert.doesNotMatch(JSON.stringify(q), CAUSE, `A+ question ${i + 1} never names the Reading 2 topic`);
  });
}

// No diagram line is wider than the drawing (0.56 em a character, the
// estimate the drawing code wraps with), and every box fits.
function testDiagramsFit() {
  for (const key of ['path', 'address', 'ladder', 'names', 'inside']) {
    for (const layout of ['wide', 'narrow']) {
      const svg = run(`ITS04_DIAGRAM_DRAW.${key}('${layout}')`);
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
      const said = run(`its04DiagramWords('${key}')`);
      for (const m of svg.matchAll(/<text[^>]*>([^<]+)</g)) {
        const text = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
        text.split(/\s+/).forEach((word) => assert.ok(said.includes(word.replace(/[.,:;]$/, '')), `${key} ${layout}: "${word}" is in the description`));
      }
    }
  }
  // The labels the spec names are drawn.
  const drawn = (key) => ['wide', 'narrow'].map((layout) => run(`ITS04_DIAGRAM_DRAW.${key}('${layout}')`).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' '));
  drawn('path').forEach((text) => ['MAC', '3C-52-82-…', '2F-15', 'port 2-15', 'NS-SW-2F', 'PoE', 'Fiber', '(primary)', 'Cellular', 'Network Operations’ side'].forEach((label) => assert.ok(text.includes(label), `diagram 1 shows ${label}`)));
  drawn('address').forEach((text) => ['10.20.10.141', '192.168.0.20', '192.168.0.1', 'Automatic (DHCP)', 'Manual', 'private, Northstar’s', 'company DNS', 'dynamic'].forEach((label) => assert.ok(text.includes(label), `diagram 2 shows ${label}`)));
  drawn('ladder').forEach((text) => ['One person, or many?', 'Is there a link?', 'A valid address?', 'Do names work?', 'Is the service up?', 'Fixed? Verify', 'it down.'].forEach((label) => assert.ok(text.includes(label), `diagram 3 shows ${label}`)));
  // The cache box wraps its text, so its pieces are checked one by one.
  drawn('names').forEach((text) => ['DNS cache:', '10.20.0.45', '08:10)', 'dc01 · 10.20.0.10', '10.20.0.50', 'ipconfig /flushdns', 'ping intranet', 'nslookup intranet', 'old server', '2.4 GHz', '5 GHz', '6 GHz'].forEach((label) => assert.ok(text.includes(label), `diagram 4 shows ${label}`)));
  drawn('inside').forEach((text) => ['vpn.northstar.example', 'company DNS', 'file shares', 'intranet', 'On the corporate network', 'The provisioning account', 'The right OU', 'internet'].forEach((label) => assert.ok(text.includes(label), `diagram 5 shows ${label}`)));
}

function testLabCardsAndRail() {
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const guided = section(html, 'its04-lab-9-1');
  assert.match(guided, /Lab 9\.1 · Guided Lab: the connectivity checklist/);
  assert.match(guided, /data-its04-console-launch href="[^"]*\?coach=hd-m04&amp;restart=1&amp;student=/, 'Lab 9.1 launches the hd-m04 coach');
  assert.match(guided, /Start Lab 9\.1 walkthrough/);
  assert.match(guided, /HD-2212[\s\S]*HD-2213[\s\S]*SR-2222 \(RITM0010164\)/);
  assert.match(guided, /Part A[\s\S]*Part B[\s\S]*Part C/);
  assert.match(guided, /Jonah Pryce[\s\S]*Farah Qureshi[\s\S]*Kenji Watanabe/);
  assert.match(guided, /A coach guides you through each step\./, 'no step count');
  assert.match(guided, /Show me the command/);
  assert.ok(words(guided).includes('Feedback only, no score. Your instructor reviews your finished lab.'));
  // Until the Prove It opens, Lab 9.1 is the gating lab and instructor reviewed.
  assert.match(guided, /Guided Lab · coached · instructor reviewed/);
  assert.doesNotMatch(guided, /Practice It|Practice: not graded/);
  // Module 9 has no optional extension.
  assert.doesNotMatch(guided, /extension|hd-m04-ext/i);
  assert.doesNotMatch(guided, /`/, 'the lab text renders its code, no backticks');
  assert.match(guided, /<code class="its04-code">ping<\/code>/);
  const practice = section(html, 'its04-lab-9-2');
  assert.match(practice, /Lab 9\.2 · Practice tickets \(not graded\)/);
  assert.match(practice, /\?practice=its-04&amp;student=/, 'Lab 9.2 opens practice set its-04');
  assert.match(practice, /Practice: not graded/);
  assert.match(practice, /9-A, [\s\S]*9-B, [\s\S]*9-C, [\s\S]*9-D, [\s\S]*9-E, /);
  assert.match(practice, /it arrives with three more tickets about it/);
  assert.match(practice, /“Check my work” feedback and no score/);
  assert.equal(statusLine(html, PRACTICE), 'Finish all five tickets: work each to Resolved, or hand it to the right team, and give it your work note.');
  // The Prove It opens nothing yet.
  const prove = section(html, 'its04-prove-it');
  assert.match(prove, /Prove It: Independent Ticket/);
  assert.match(prove, /Prove It · Assessment Lab · instructor reviewed/);
  assert.match(prove, /data-its04-prove-soon/);
  assert.match(prove, /Opens soon\. Nothing to do here yet: work Labs 9\.1 and 9\.2 first\./);
  assert.doesNotMatch(prove, /<a |data-its04-prove-launch|Start the Prove It|Reopen the Prove It|\?prove=/, 'no launch link');
  assert.doesNotMatch(html, /\?prove=|data-its04-prove-launch/);
  // The three lab cards show 75 / 70 / 35.
  assert.deepEqual([...html.matchAll(/data-its04-lab-minutes>Time: ([^<]+)</g)].map((m) => m[1]), [GUIDED, PRACTICE, PROVE].map((k) => run(`formatInstructionalMinutes(${run(`LABS.find((l) => l.key === '${k}').instructionalMinutes`)})`)));
  assert.deepEqual([GUIDED, PRACTICE, PROVE].map((k) => run(`LABS.find((l) => l.key === '${k}').instructionalMinutes`)), [75, 70, 35]);
  // The page's own Assessment Lab row, not the platform's generic box.
  assert.doesNotMatch(html, /standard-its-04-assessment-module/);
  ['its04-prove-it', 'its04-check-learn', 'its04-check-aplus', 'its04-lab-9-2', 'its04-lab-9-1'].forEach((id) => assert.equal(railRow(html, id).locked, false, `${id} is not locked`));
  assert.doesNotMatch(html, /href="#its04-cardsort"/, 'the card sort has no rail row (it sits inside Reading 1)');

  // Lab 9.1 still gates the module: a saved walkthrough waits for the
  // instructor, it is not complete at once.
  const saved = hdUser({ [GUIDED]: submitted() });
  fresh(saved);
  const line = statusLine(page().view(saved, HD), GUIDED);
  assert.match(line, /^Lab 9\.1 submitted /);
  assert.doesNotMatch(line, /Complete/);
  assert.match(line, /instructor review/i);
}

/* ------------------------------------------------------------ card sort */

function testCardSort() {
  const sort = copy(run('ITS04_CARD_SORT'));
  const NET = 'Network cable or connector', DESK = 'Desk cable or connector', TOOL = 'Tool';
  assert.deepEqual(sort.buckets, [NET, DESK, TOOL], 'three boxes');
  assert.equal(sort.cards.length, 12, 'twelve cards');
  const byBox = (box) => sort.cards.filter((c) => c.answer === box).map((c) => c.name).sort();
  assert.deepEqual(byBox(NET), ['F-type on coax', 'LC fiber', 'RJ11', 'RJ45 on Cat 6']);
  assert.deepEqual(byBox(DESK), ['DisplayPort', 'HDMI', 'Lightning', 'USB-C']);
  assert.deepEqual(byBox(TOOL), ['Cable tester', 'Punchdown tool', 'Toner probe', 'Wi-Fi analyzer']);
  sort.cards.forEach((c) => { assert.ok(c.desc && c.why, `${c.name}: a one-line description and a line for the right box`); });
  sort.buckets.forEach((b) => assert.ok(sort.whyNot[b], `a why-not line for ${b}`));
  sort.cards.forEach((c) => sort.buckets.filter((b) => b !== c.answer).forEach((b) => assert.ok(!sort.whyNot[b].includes(c.answer), `${b}'s line never names ${c.answer}`)));
  assert.doesNotMatch(JSON.stringify(sort), BANNED);

  const user = hdUser({}, 'm09sort');
  fresh(user);
  let html = page().view(user, HD);
  // Inside Reading 1's card, after Table 4 and diagram 1.
  const one = readingCard(html, 1);
  assert.ok(one.includes('id="its04-cardsort"'), 'the card sort is in Reading 1');
  assert.ok(one.lastIndexOf('<caption>Table 4') < one.indexOf('data-its04-diagram="path"') && one.indexOf('data-its04-diagram="path"') < one.indexOf('id="its04-cardsort"'), 'after Table 4 and diagram 1');
  assert.ok(!readingCard(html, 2).includes('its04-cardsort'));
  assert.equal((html.match(/class="its02-sort-card"/g) || []).length, 12);
  // Every card has a decorative drawing and a line for a wrong box.
  assert.equal((html.match(/<svg class="its04-sort-art"[^>]*aria-hidden="true"/g) || []).length, 12, 'a drawing on each card');
  sort.cards.forEach((c) => assert.ok(sort.really[c.id], `${c.name}: what it really is`));
  const pick = run('its04Sort');
  const dev = sort.cards.find((c) => c.id === 'usbc');
  // A wrong box: its line, nothing settles, nothing saved.
  pick('usbc', TOOL);
  html = page().view(user, HD);
  let block = checkBlock(html, 'sort');
  assert.ok(block.includes(esc(sort.whyNot[TOOL])));
  assert.ok(block.includes(esc(sort.really.usbc)), 'a wrong box also says what the card really is');
  assert.ok(!block.includes(esc(dev.why)));
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).cardSortCompleted, true);
  // The right box shows the card's line and settles it.
  pick('usbc', DESK);
  assert.ok(checkBlock(page().view(user, HD), 'sort').includes(esc(dev.why)), 'the right box shows the card’s line');
  // Eleven of twelve: still not complete.
  sort.cards.filter((c) => c.id !== 'usbc' && c.id !== 'analyzer').forEach((c) => pick(c.id, c.answer));
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).cardSortCompleted, true, 'eleven of twelve is not done');
  // The twelfth: complete, saved with its time and nothing else.
  pick('analyzer', TOOL);
  const state = LabRuntime.load(STATE_ID, user, {});
  assert.equal(state.cardSortCompleted, true);
  assert.ok(state.cardSortCompletedAt);
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick|bucket/i.test(k)), [], 'no picks saved');
  assert.match(checkBlock(page().view(user, HD), 'sort'), /Name it card sort complete/);
  assert.equal(inserts().length, 0, 'the card sort saves no lab attempt');
}

/* --------------------------------------------------------------- checks */

const shownOrder = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its04-answer data-check="${checkId}" data-q="${q}" data-choice="(\\d)"`, 'g'))].map((m) => Number(m[1]));
const shownLetters = (html, checkId, q) => [...html.matchAll(new RegExp(`data-its04-answer data-check="${checkId}" data-q="${q}"[^>]*><span>([A-D])</span>`, 'g'))].map((m) => m[1]);

function testCheckContent() {
  const all = checks();
  assert.deepEqual(Object.keys(all), ['learn', 'aplus']);
  assert.equal(all.learn.questions.length, 6, 'Learn It: six questions');
  assert.equal(all.aplus.questions.length, 10, 'A+: ten questions');
  assert.equal(all.learn.title, 'Learn It knowledge check');
  assert.equal(all.aplus.title, 'A+ check (Core 1: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 3.2, 5.5)');
  assert.match(all.learn.intro, /5 of your first answers/);
  assert.match(all.aplus.intro, /7 of your first answers/);
  // Spec 8.1's right answers, by the choice's text.
  assert.deepEqual(all.aplus.questions.map((q) => q.choices[q.answer]), [
    'The PC couldn’t get an address from DHCP', 'DNS', '445', 'Connect on the 5 GHz band',
    'Power over Ethernet (a PoE switch or injector)', '172.20.4.10', 'WISP', 'A toner probe', 'Cat 6a', 'Connect the company VPN',
  ]);
  assert.deepEqual(all.learn.questions.map((q) => q.choices[q.answer]), [
    'Whether there’s a link: the cable, the wall jack and the light next to the network port',
    'Link them to one parent ticket and escalate the parent with the area, the start time and the evidence',
    'Write down what the setting is now and tell the user what you’re about to change',
    'Jitter and high latency',
    'The PC has an old answer cached, so `ipconfig /flushdns` should fix it',
    '“Your computer hadn’t picked up its network address, so it couldn’t reach anything. It has one now, and everything’s working.”',
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
  }
  // Both checks sit after the reading they follow: Learn It after Reading 3,
  // A+ after Reading 5, then the labs.
  const user = hdUser();
  fresh(user);
  const html = page().view(user, HD);
  const at = (needle) => html.indexOf(needle);
  assert.ok(at('<h4>Reading 3 · ') < at('id="its04-check-learn"') && at('id="its04-check-learn"') < at('<h4>Reading 4 · '), 'Learn It check after Reading 3');
  assert.ok(at('<h4>Reading 5 · ') < at('id="its04-check-aplus"') && at('id="its04-check-aplus"') < at('id="its04-lab-9-1"'), 'A+ check after Reading 5, before the labs');
}

// Options are shuffled on each attempt. Each student gets their own order, the
// same on every redraw, and a new one after Start again.
function testChoicesShuffled() {
  const all = checks();
  const names = ['m09order1', 'm09order2', 'm09order3', 'm09order4', 'm09order5'];
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
  assert.notDeepEqual(orders.m09order1, orders.m09order2, 'two students see different orders');
  const places = new Set();
  names.forEach((name) => Object.entries(all).forEach(([id, check]) => check.questions.forEach((question, q) => places.add(orders[name][id][q].indexOf(question.answer)))));
  assert.equal(places.size, 4, 'the right answer lands in every place');
  const user = hdUser({}, 'm09order1');
  fresh(user);
  page().view(user, HD);
  run('its04Answer')('aplus', 0, all.aplus.questions[0].answer);
  run('its04ResetCheck')('aplus');
  const retake = page().view(user, HD);
  assert.notDeepEqual(all.aplus.questions.map((_, q) => shownOrder(retake, 'aplus', q)), orders.m09order1.aplus, 'a retake reshuffles');
  assert.deepEqual(all.learn.questions.map((_, q) => shownOrder(retake, 'learn', q)), orders.m09order1.learn, 'the other check keeps its order');
}

function testChecksCompleteAtSeventyPercent() {
  const all = checks();
  const answer = run('its04Answer');
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

  // A+: 7 of 10 first picks right (questions 1, 2 and 3 wrong first) completes
  // it, saves only its own flag and time, and ticks only its rail row.
  answer('aplus', 1, wrong(all.aplus.questions[1]));
  answer('aplus', 2, wrong(all.aplus.questions[2]));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  let state = saved(user);
  assert.equal(state.aplusCheckCompleted, true, '7 of 10 is a pass');
  assert.ok(state.aplusCheckCompletedAt);
  assert.notEqual(state.learnCheckCompleted, true, 'the Learn It check is still open');
  assert.deepEqual(Object.keys(state).filter((k) => /answer|pick/i.test(k)), [], 'no answers saved');
  assert.deepEqual([state.score, state.bestScore], [0, 0], 'no score saved (the runtime’s own fields stay 0)');
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /A\+ check \(Core 1: 2\.1, 2\.2, 2\.4, 2\.5, 2\.6, 2\.7, 2\.8, 3\.2, 5\.5\) complete/);
  assert.equal(railRow(html, 'its04-check-aplus').ticked, true);
  assert.equal(railRow(html, 'its04-check-learn').ticked, false);

  // Learn It: 5 of 6 completes it.
  answer('learn', 0, wrong(all.learn.questions[0]));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.equal(state.learnCheckCompleted, true, '5 of 6 is a pass');
  assert.ok(state.learnCheckCompletedAt);
  html = page().view(user, HD);
  assert.equal(railRow(html, 'its04-check-learn').ticked, true);
  assert.equal(inserts().length, 0, 'the checks save no lab attempt');

  // Another student: 6 of 10 and 4 of 6 are retakes, nothing saved.
  user = hdUser({}, 'm09page2');
  fresh(user);
  html = page().view(user, HD);
  assert.doesNotMatch(html, /Not quite\.|Correct\./, 'another student starts fresh');
  [0, 1, 2, 3].forEach((i) => answer('aplus', i, wrong(all.aplus.questions[i])));
  all.aplus.questions.forEach((q, i) => answer('aplus', i, q.answer));
  [0, 1].forEach((i) => answer('learn', i, wrong(all.learn.questions[i])));
  all.learn.questions.forEach((q, i) => answer('learn', i, q.answer));
  state = saved(user);
  assert.notEqual(state.aplusCheckCompleted, true, '6 of 10 is not a pass');
  assert.notEqual(state.learnCheckCompleted, true, '4 of 6 is not a pass');
  html = page().view(user, HD);
  assert.match(checkBlock(html, 'aplus'), /Retake: you need 7 of 10/);
  assert.match(checkBlock(html, 'learn'), /Retake: you need 5 of 6/);
  assert.equal(railRow(html, 'its04-check-aplus').ticked, false);
}

async function testCheckSaveThatFails() {
  const user = { ...hdUser({}, 'm09save'), remoteCaseState: {} };
  fresh(user);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: null, error: { message: 'write failed' } });
  page().view(user, HD);
  checks().learn.questions.forEach((q, i) => run('its04Answer')('learn', i, q.answer));
  assert.equal(railRow(page().view(user, HD), 'its04-check-learn').ticked, true, 'ticked at once');
  await quiet(flush);
  let html = page().view(user, HD);
  assert.match(checkBlock(html, 'learn'), /Your result didn’t save\. Try again\./);
  assert.match(html, /data-its04-check-retry="learn"/);
  assert.equal(railRow(html, 'its04-check-learn').ticked, false, 'the tick comes off');
  assert.notEqual(LabRuntime.load(STATE_ID, user, {}).learnCheckCompleted, true);
  ctx.supabaseResponder = (call) => (call.op === 'select' ? { data: { case_state: {} }, error: null } : { data: [{ module_key: 'its-04' }], error: null });
  run('its04RetryCheckSave')('learn');
  await flush();
  html = page().view(user, HD);
  assert.doesNotMatch(html, /didn’t save/);
  assert.match(checkBlock(html, 'learn'), /Learn It knowledge check complete \(/);
  const write = ctx.supabaseCalls.filter((c) => c.op === 'update' && c.payload && c.payload.case_state).pop();
  assert.equal(copy(write.payload.case_state[STATE_ID]).learnCheckCompleted, true);
}

/* ---------------------------------------------------------- Lab 9.1 save */

const ticket = (id, status = 'Resolved') => ({ id, status, console: { matrix: { impact: '3', urgency: '2', priority: 'P4' } } });
const labWork = (tickets = [ticket('HD-2212'), ticket('HD-2213'), ticket('SR-2222', 'Open')]) => ({ version: 1, tickets });
const coachMessage = (source, work, student = studentOf(signedIn), id = 'hd-m04') => ({ data: { type: 'mnt-coach-complete', id, nonce: 'c-1', student, work }, origin: SIM, source });

async function testGuidedLabSave() {
  // Unfinished work: nothing saved and the simulator hears why.
  for (const work of [
    labWork([ticket('HD-2212', 'In Progress'), ticket('HD-2213'), ticket('SR-2222', 'Open')]),
    labWork([ticket('HD-2212'), ticket('HD-2213', 'In Progress'), ticket('SR-2222', 'Open')]),
    labWork([ticket('HD-2212'), ticket('HD-2213')]),
    labWork([ticket('HD-2212'), ticket('SR-2222', 'Open')]),
    labWork([ticket('HD-2213'), ticket('SR-2222', 'Open')]),
    labWork([ticket('HD-2196'), ticket('HD-2197'), ticket('SR-2207', 'Open')]),
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
  await page().onMessage(coachMessage(catcher.source, labWork(), studentOf(signedIn), 'hd-m06'));
  assert.equal(inserts().length, 0, 'another origin or coach saves nothing');
  assert.equal(catcher.replies.length, 1, 'and gets no reply from this page');

  // HD-2212 and HD-2213 resolved, with SR-2222: one Lab 9.1 attempt, waiting
  // for the instructor (Lab 9.1 still gates the module).
  user = hdUser();
  fresh(user);
  page().view(user, HD);
  catcher = replyCatcher();
  await page().onMessage(coachMessage(catcher.source, labWork()));
  assert.equal(inserts().length, 1, 'only Lab 9.1');
  const row = copy(inserts(GUIDED)[0].payload);
  assert.deepEqual([row.state, row.score, row.track_code], ['complete', null, 'HDESK']);
  assert.deepEqual(row.result.work.tickets.map((t) => [t.id, t.status]), [['HD-2212', 'Resolved'], ['HD-2213', 'Resolved'], ['SR-2222', 'Open']]);
  assert.deepEqual(catcher.replies.map((r) => r.data.saved), [true]);
  const line = statusLine(page().view(user, HD), GUIDED);
  assert.match(line, /^Lab 9\.1 submitted .*instructor review/);
  assert.doesNotMatch(line, /Complete/, 'not complete before the instructor reviews it');
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

// The coach's own end: the simulator's Lab 9.1 coach sends the same three
// records the page checks for.
function testCoachSendsWhatThePageNeeds() {
  const coaches = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-coaches.js'), 'utf8');
  assert.match(coaches, /'hd-m04': \['HD-2212', 'HD-2213', 'SR-2222'\]/);
}

/* ---------------------------------------------------------- Lab 9.2 save */

const practiceMessage = (source, { student = studentOf(signedIn), tickets = TICKETS, origin = SIM, nonce = 'p-1', id = 'its-04' } = {}) => ({
  data: { type: 'mnt-practice-complete', id, nonce, student, tickets }, origin, source,
});

async function testPracticeSave() {
  // The page saves exactly the tickets the simulator's set reports as done:
  // five, not the eight tickets with 9-B's three linked children.
  const simData = fs.readFileSync(path.join(ROOT, 'ui/helpdesk-data.js'), 'utf8');
  const complete = /'its-04': \{ title:'Module 9 practice tickets',[^}]*?complete:\[([^\]]*)\]/.exec(simData);
  assert.ok(complete, 'the its-04 practice set');
  assert.deepEqual(complete[1].match(/HD-\d+/g), TICKETS);

  let user = hdUser();
  fresh(user);
  page().view(user, HD);
  const { replies, source } = replyCatcher();
  await page().onMessage(practiceMessage(source));
  assert.equal(inserts().length, 1);
  const row = copy(inserts()[0].payload);
  assert.deepEqual([row.lab_key, row.state, row.score, row.track_code], [PRACTICE, 'complete', null, 'HDESK']);
  assert.deepEqual(row.result, { source: 'mnt-practice-complete', practiceSet: 'its-04', tickets: TICKETS }, 'completion and ticket ids only');
  assert.deepEqual(replies, [{ data: { type: 'mnt-practice-received', id: 'its-04', nonce: 'p-1', saved: true }, origin: SIM }]);
  const html = page().view(user, HD);
  assert.equal(statusLine(html, PRACTICE), `Lab 9.2: Complete · ${DAY}`);
  assert.equal(railRow(html, 'its04-lab-9-2').ticked, true);
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
    ['four of the five', { tickets: TICKETS.slice(0, 4) }, 'incomplete'],
    ['9-B’s children added (all eight)', { tickets: ['HD-2214', 'HD-2215', 'HD-2216', 'HD-2217', 'HD-2218', 'HD-2219', 'HD-2220', 'HD-2221'] }, 'incomplete'],
    ['a child instead of 9-B', { tickets: ['HD-2214', 'HD-2216', 'HD-2219', 'HD-2220', 'HD-2221'] }, 'incomplete'],
    ['an extra ticket', { tickets: [...TICKETS, 'HD-2216'] }, 'incomplete'],
    ['a lab ticket instead', { tickets: ['HD-2214', 'HD-2215', 'HD-2219', 'HD-2220', 'HD-2212'] }, 'incomplete'],
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
  // Module 8's set and another origin are not this page's.
  user = hdUser();
  fresh(user);
  const other = replyCatcher();
  await page().onMessage(practiceMessage(other.source, { id: 'its-06', tickets: ['HD-2198', 'HD-2199', 'HD-2200', 'HD-2201'] }));
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
}

// A message that isn't a coach or practice completion (the Prove It is not
// open) gets no reply and saves nothing.
async function testProveMessagesIgnored() {
  const user = hdUser();
  fresh(user);
  page().view(user, HD);
  const catcher = replyCatcher();
  await page().onMessage({ data: { type: 'mnt-prove-submitted', id: 'its-04', nonce: 'x', student: studentOf(user) }, origin: SIM, source: catcher.source });
  assert.equal(inserts().length, 0);
  assert.equal(catcher.replies.length, 0);
}

/* ------------------------------------------------------ instructor sheets */

function testInstructorSheets() {
  const sheet = run('AdminSubmissionSheet');
  assert.ok(sheet.has({ lab_key: PRACTICE }), 'Lab 9.2 has a sheet');
  const base = { track_code: 'HDESK', student_id: 'synthetic', score: null, pass_threshold: 70, completed_at: '2026-11-26T15:00:00Z' };
  const html = sheet.render({ ...base, id: 'm09p-1', lab_key: PRACTICE, result: { source: 'mnt-practice-complete', practiceSet: 'its-04', tickets: TICKETS } });
  assert.match(html, /Module 09 · Lab 9\.2 · Practice tickets \(not graded\)/);
  assert.match(html, /HD-2214, HD-2215, HD-2219, HD-2220, HD-2221/);
  assert.match(html, /No: Practice It, no score and no answers saved/);
  assert.equal(copy(run('adminGradingLabMeta')({ lab_key: PRACTICE, track_code: 'HDESK' })).kind, 'PRACTICE IT');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: PRACTICE, track_code: 'HDESK' }), false, 'Lab 9.2 is never in the review queue');
  assert.equal(run('adminNeedsInstructorReview')({ lab_key: GUIDED, track_code: 'HDESK' }), true, 'Lab 9.1 still gates the module, so an instructor reviews it');
  const guided = sheet.render({ ...base, id: 'm09g-1', lab_key: GUIDED, result: { source: 'mnt-coach-complete', work: { version: 1, tickets: [] } } });
  assert.match(guided, /Module 09 · Lab 9\.1 · Guided Lab: the connectivity checklist/);
}

function testCiRunsThisFile() {
  assert.match(fs.readFileSync(path.join(ROOT, 'bin/ci-check.sh'), 'utf8'), /^node tests\/hdesk-m09-page\.test\.js$/m);
}

/* -------------------------------------------------------------------- run */

(async () => {
  const tests = [testCatalogue, testPageContent, testReadingTwoTopicStaysInReadingTwo, testDiagramsFit, testLabCardsAndRail, testCardSort, testCheckContent, testChoicesShuffled, testChecksCompleteAtSeventyPercent, testCheckSaveThatFails, testGuidedLabSave, testCoachSendsWhatThePageNeeds, testPracticeSave, testProveMessagesIgnored, testInstructorSheets, testCiRunsThisFile];
  for (const test of tests) await test();
  console.log(`hdesk-m09-page: ${tests.length} tests passed`);
})().catch((error) => { console.error(error); process.exit(1); });

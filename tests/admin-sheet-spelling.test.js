#!/usr/bin/env node
/* Spelling analyzer for the admin Submission Sheet (portal/admin-sheet-spelling.js):
 * tokenizing/skip rules, SOC allowlist, suggestions against the real vendored
 * en_US dictionary, and the teacher-note rule (fake DOM, no browser). */
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const PORTAL = path.join(__dirname, '..', 'portal');
const Typo = require(path.join(PORTAL, 'vendor', 'typo', 'typo.js'));
const spelling = require(path.join(PORTAL, 'admin-sheet-spelling.js'));

const aff = fs.readFileSync(path.join(PORTAL, 'vendor', 'typo', 'en_US.aff'), 'utf8');
const dic = fs.readFileSync(path.join(PORTAL, 'vendor', 'typo', 'en_US.dic'), 'utf8');
const typo = new Typo('en_US', aff, dic, { platform: 'any' });
const speller = { check: (w) => typo.check(w), suggest: (w, n) => typo.suggest(w, n) };
const allow = spelling.buildAllowlist(['contoso', 'ws-204']);

let passed = 0;
const test = async (name, fn) => { await fn(); passed += 1; console.log(`  ok  ${name}`); };
const words = (text) => spelling.tokenize(text).map((t) => t.word);
const flaggedOf = (text) => spelling.analyzeText(text, speller, allow).flagged;

// ---- minimal fake DOM ------------------------------------------------------
class El {
  constructor(tag, doc) { this.tag = tag; this.ownerDocument = doc; this.children = []; this.attrs = {}; this.parent = null; this.className = ''; this.value = ''; this.textContent = ''; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  append(...cs) { cs.forEach((c) => this.appendChild(c)); }
  walk(fn) { fn(this); this.children.forEach((c) => c.walk(fn)); }
  matches(sel) { const m = sel.match(/^\[([\w-]+)\]$/); if (m) return m[1] in this.attrs; if (sel === 'article') return this.tag === 'article'; return false; }
  closest(sel) { for (let n = this; n; n = n.parent) if (n.matches(sel)) return n; return null; }
  querySelector(sel) { let found = null; this.walk((n) => { if (!found && n !== this && n.matches(sel)) found = n; }); return found; }
  querySelectorAll(sel) { const out = []; this.walk((n) => { if (n !== this && n.matches(sel)) out.push(n); }); return out; }
}
const doc = { createElement: (t) => new El(t, doc) };
function card({ editable }) {
  const art = new El('article', doc); art.setAttribute('data-grading-row', 'r1');
  const list = new El('div', doc); if (editable) list.setAttribute('data-feedback-items', '');
  art.append(list);
  return { art, list };
}
function field(art, text) {
  const node = new El('div', doc);
  art.append(node);
  const lines = []; const underlined = [];
  return { text, node, lines, underlined, appendLine: (l) => lines.push(l), underline: (w) => underlined.push(...w) };
}

(async () => {
  console.log('admin-sheet-spelling');

  await test('real dictionary loads and suggests', () => {
    assert.equal(speller.check('received'), true);
    assert.equal(speller.check('recieved'), false);
    assert.ok(speller.suggest('definately', 1).length > 0);
    assert.equal(flaggedOf('recieved')[0].suggestion, 'received');
    assert.ok(Buffer.byteLength(dic) > 500000);
  });

  await test('tokenizer skips identifiers, IPs, hashes, paths, e-mail, KQL', () => {
    const text = 'Host ws-204 at 203.0.113.45 ran C:\\Temp\\a.exe, mail bob@x.com, hash d41d8cd9, a_b, and/or http://x.io, cmd: done.';
    assert.deepEqual(words(text), ['Host', 'at', 'ran', 'mail', 'hash', 'cmd', 'done']);
  });

  await test('slash and underscore tokens are dropped whole', () => {
    assert.deepEqual(words('and/or user_name foo.bar e.g. fine'), ['fine']);
  });

  await test('trailing punctuation and curly apostrophes are stripped', () => {
    assert.deepEqual(words('"Checked," (logs) don’t.'), ['Checked', 'logs', 'don’t']);
  });

  await test('acronyms up to 6 letters skipped; long all-caps are checked', () => {
    assert.equal(flaggedOf('The EDR and SIEM showed MFA failures.').length, 0);
    assert.equal(spelling.isAcronym('EXFILTRATION'), false);
    assert.equal(flaggedOf('this was a SERIOUSLY BAD recieved thing').map((f) => f.word).join(), 'recieved');
  });

  await test('SOC allowlist and capitalised names are not flagged', () => {
    assert.equal(flaggedOf('Phishing led to lateral movement and exfiltration; triage and sinkhole done, IOC logged.').length, 0);
    assert.equal(flaggedOf('We told Contoso and Jessica about Kerberoasting on the sentinel workspace.').length, 0);
    assert.equal(flaggedOf('contoso mimikatz beaconing').length, 0);
  });

  await test('misspellings flagged once each, with first suggestion', () => {
    const f = flaggedOf('I recieved the alert. The recieved alert was definately real, and seperate.');
    assert.deepEqual(f.map((x) => x.word), ['recieved', 'definately', 'seperate']);
    assert.equal(f[0].suggestion, 'received');
    assert.equal(f[1].suggestion, 'definitely');
    assert.equal(f[2].suggestion, 'separate');
  });

  await test('capitalised first word of a sentence is still checked', () => {
    assert.deepEqual(flaggedOf('Recieved it. ok.').map((x) => x.word), ['Recieved']);
  });

  await test('fixture words are harvested into the allowlist', () => {
    const got = spelling.harvestWords({ host: 'Zorblax-9 server', nested: [{ note: 'quixotic gadgetron' }] }, new Set());
    assert.ok(got.has('gadgetron') && got.has('quixotic'));
    const a = spelling.buildAllowlist([...got]);
    assert.equal(flaggedOf('the gadgetron').length, 1);
    assert.equal(spelling.analyzeText('the gadgetron', speller, a).flagged.length, 0);
  });

  await test('per-field work is capped', () => {
    const big = Array(10000).fill('zzqx').join(' ');
    const r = spelling.analyzeText(`${big} qqwv`, speller, allow, { maxWords: 50 });
    assert.ok(r.checked <= 50);
    const many = Array.from({ length: 30 }, (_, i) => `xq${'z'.repeat(i + 1)}k`).join(' ');
    let suggests = 0;
    spelling.analyzeText(many, { check: () => false, suggest: () => { suggests += 1; return ['x']; } }, allow);
    assert.ok(suggests <= 8);
  });

  await test('summary line: count, up to 5 words with suggestions', () => {
    const f = Array.from({ length: 7 }, (_, i) => ({ word: `w${i}`, suggestion: `s${i}` }));
    const line = spelling.summaryLine(f);
    assert.match(line, /^7 possible misspellings: w0 → s0; w1 → s1; w2 → s2; w3 → s3; w4 → s4; \+2 more$/);
    assert.match(spelling.summaryLine([{ word: 'teh', suggestion: 'the' }]), /^1 possible misspelling: teh → the$/);
  });

  const provider = () => speller;
  const run = (c, text) => { const f = field(c.art, text); return spelling.analyzeField(f, { provider, allow }).then(() => f); };

  await test('analyzer adds an amber Spelling line, underlines, never a fail', async () => {
    const c = card({ editable: true });
    const f = await run(c, 'I recieved it.');
    assert.equal(f.lines.length, 1);
    assert.equal(f.lines[0].label, 'Spelling');
    assert.equal(f.lines[0].outcome, 'partial');
    assert.deepEqual(f.underlined, ['recieved']);
    assert.equal(c.list.children.length, 0); // 1 word < 3: no note
  });

  await test('clean text gets a pass line; empty text gets nothing', async () => {
    const c = card({ editable: true });
    const f = await run(c, 'The analyst reviewed the alert and escalated it.');
    assert.equal(f.lines[0].outcome, 'pass');
    const e = await run(c, '   ');
    assert.equal(e.lines.length, 0);
  });

  await test('editable card with >= 3 flagged words gets exactly one Spelling note', async () => {
    const c = card({ editable: true });
    await run(c, 'I recieved the alert, it was definately real.');
    assert.equal(c.list.children.length, 0);
    await run(c, 'Then we seperate the host.');
    assert.equal(c.list.children.length, 1);
    await run(c, 'Another recieved alert, definately.'); // same words: still one note
    assert.equal(c.list.children.length, 1);
    const item = c.list.children[0];
    assert.equal(item.className, 'feedback-item grid sm:grid-cols-2 gap-2');
    const [label, comment] = item.children;
    assert.equal(label.tag, 'input');
    assert.ok('data-feedback-label' in label.attrs);
    assert.equal(label.value, 'Spelling');
    assert.ok('data-feedback-comment' in comment.attrs);
    assert.equal(comment.value, 'To strengthen next time: proofread before submitting — check: recieved → received, definately → definitely, seperate → separate.');
  });

  await test('a later field extends the note; an edited note is left alone', async () => {
    const c = card({ editable: true });
    await run(c, 'recieved definately seperate');
    const area = c.list.children[0].children[1];
    await run(c, 'untill and wich');
    assert.match(area.value, /untill → until/);
    area.value = 'Teacher wrote this';
    await run(c, 'occured');
    assert.equal(area.value, 'Teacher wrote this');
    assert.equal(c.list.children.length, 1);
  });

  await test('read-only sheet (no [data-feedback-items]) never gets a note', async () => {
    const c = card({ editable: false });
    const f = await run(c, 'recieved definately seperate untill');
    assert.equal(f.lines[0].outcome, 'partial');
    assert.equal(c.list.children.length, 0);
    assert.equal(c.art.querySelectorAll('[data-feedback-items]').length, 0);
  });

  await test('student text is never put into markup (textContent/value only)', async () => {
    const item = spelling.buildFeedbackItem(doc, 'Spelling', '<img src=x onerror=1>');
    assert.equal(item.children[1].value, '<img src=x onerror=1>');
    assert.equal(item.tag, 'div');
  });

  await test('registers with AdminSubmissionSheet when present', () => {
    const vm = require('vm');
    const added = [];
    const ctx = { AdminSubmissionSheet: { addTextAnalyzer: (fn) => added.push(fn) }, console, setTimeout, Promise };
    vm.runInNewContext(fs.readFileSync(path.join(PORTAL, 'admin-sheet-spelling.js'), 'utf8'), ctx);
    assert.equal(added.length, 1);
  });

  console.log(`\n${passed} tests passed`);
})().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/* Admin Submission Sheet (portal/admin-submission-sheet.js) — framework unit
 * tests plus every module's synthetic attempts.
 *
 * Module cases live in tests/admin-sheets/soc-mNN.cases.js and are
 * auto-discovered, so a module sprint adds its own file without editing this
 * one. A cases file exports `(env) => [case, …]`:
 *
 *   {
 *     name: 'M01 perfect investigation',
 *     row: { id, lab_key, track_code: 'SOCAN', student_id, score, pass_threshold, completed_at, result },
 *     item: { lead: row, rows: [row, …], ids: [...] },        // optional (M07/M08 sibling rows)
 *     readOnly: false, sentFeedback: [{ item_label, comment }], // optional read-only render
 *     expect: {
 *       verdict: 'pass' | 'return' | 'judgment',
 *       sections: { 'severity': 'pass', 'notes': 'partial', … }, // section id → status
 *       feedback: ['Severity', …],      // exact prefilled item labels, in order (optional)
 *       html: ['Not recorded in this attempt', /regex/],          // must appear (optional)
 *       notHtml: ['true-positive'],                               // must not appear above the debug fold (optional)
 *     },
 *   }
 *
 * env = { run(code), AdminSubmissionSheet, clone(value) } — `run` evaluates in
 * the portal VM (fixtures such as MODULE_ONE_ESCALATION_LAB and helpers such
 * as caseRecordDisplay are in scope there).
 *
 * Every case also gets the shared invariants below: renders, no JSON above
 * the debug fold, student text escaped, prefilled feedback = the ✗/◐
 * sections, ◐ items worded "To strengthen next time:", read-only renders no
 * inputs.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');

const ROOT = path.join(__dirname, '..');
const PORTAL = path.join(ROOT, 'portal');

const ctx = { console: { log() {}, info() {}, warn() {}, error: console.error } };
vm.createContext(ctx);
ctx.registerModuleLab = () => {};
const sheetFiles = fs.readdirSync(path.join(PORTAL, 'admin-sheets')).filter((file) => /^soc-m\d\d\.js$/.test(file)).sort();
for (const file of ['data.js', 'case-record.js', 'admin-submission-sheet.js', 'it-support-module-12.js', ...sheetFiles.map((file) => `admin-sheets/${file}`), 'admin-sheets/hdesk.js']) {
  vm.runInContext(fs.readFileSync(path.join(PORTAL, file), 'utf8'), ctx, { filename: file });
}
const run = (code) => vm.runInContext(code, ctx);
const Sheet = run('AdminSubmissionSheet');
const clone = (value) => JSON.parse(JSON.stringify(value));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
// Values from the VM are another realm's arrays/objects; compare as plain data.
const eq = (actual, expected, message) => assert.deepEqual(clone(actual ?? null), clone(expected ?? null), message);
let passed = 0;
const pending = [];
const test = (name, fn) => {
  const fail = (error) => { error.message = `${name}: ${error.message}`; throw error; };
  try {
    const value = fn();
    if (value && typeof value.then === 'function') pending.push(Promise.resolve(value).then(() => { passed += 1; }, fail));
    else passed += 1;
  } catch (error) { fail(error); }
};

// ------------------------------------------------------------ framework

test('index.html loads the sheet after the module files and before app.js', () => {
  const html = fs.readFileSync(path.join(PORTAL, 'index.html'), 'utf8');
  const at = (name) => html.indexOf(name);
  assert.ok(at('admin-submission-sheet.css') > 0, 'stylesheet linked');
  assert.ok(at('soc-analyst-module-12.js') < at('admin-submission-sheet.js'), 'after the module data/scorers');
  sheetFiles.forEach((file) => {
    assert.ok(at(`admin-sheets/${file}`) > at('admin-submission-sheet.js'), `${file} after the framework`);
    assert.ok(at(`admin-sheets/${file}`) < at('app.js?'), `${file} before app.js`);
  });
  assert.equal(sheetFiles.length, 12, 'one definition file per module');
});

test('has() is opt-in by registered lab key across tracks', () => {
  assert.equal(Sheet.has({ lab_key: 'lab-soc-escalation', track_code: 'SOCAN' }), true);
  assert.equal(Sheet.has({ lab_key: 'lab-soc-escalation', track_code: 'HDESK' }), true, 'registration follows the lab key');
  assert.equal(Sheet.has({ lab_key: 'lab-its-12-capstone', track_code: 'HDESK' }), true, 'Help Desk definitions are registered');
  assert.equal(Sheet.has({ lab_key: 'lab-its-12-capstone', track_code: 'SOCAN' }), true, 'sheet renderer is track agnostic');
  assert.equal(Sheet.has({ lab_key: 'lab-soc-environment', track_code: 'SOCAN' }), false, 'Practice It is not a sheet');
  assert.equal(Sheet.has({ lab_key: 'no-such-lab' }), false);
  assert.equal(Sheet.has(null), false);
  assert.equal(Sheet.render({ lab_key: 'no-such-lab' }), '');
  eq(Sheet.suggestedFeedback({ lab_key: 'no-such-lab' }), []);
});

test('tolerant text matching', () => {
  assert.ok(Sheet.matchesText('Isolate WS204 now', 'ws-204'));
  assert.ok(Sheet.matchesText('host ws_204 beaconed', 'WS-204'));
  assert.ok(Sheet.matchesText('callback to 203.0.113[.]45 seen', '203.0.113.45'));
  assert.ok(Sheet.matchesText('callback to 203[.]0[.]113[.]45', '203.0.113.45'));
  assert.ok(Sheet.matchesText('hxxp://evil[.]example/login', 'http://evil.example'));
  assert.ok(Sheet.matchesText('A.CHEN approved MFA', 'a.chen'));
  assert.ok(!Sheet.matchesText('the user approved it', 'mfa'));
  assert.ok(!Sheet.matchesText('some text', ''));
  assert.ok(!Sheet.matchesText('', 'mfa'));
  assert.ok(Sheet.matchesText('escalated to tier 2', 'tier2'));
  assert.ok(Sheet.matchesText('ran MSHTA.EXE from downloads', 'mshta.exe'));
  // Identifiers match whole tokens only.
  assert.ok(!Sheet.matchesText('the news 204 report', 'ws-204'), 'no match across a word boundary');
  assert.ok(!Sheet.matchesText('host lap-4421 only', 'LAP-442'), 'no match inside a longer id');
  assert.ok(Sheet.matchesText('the user was denied', 'deni'), 'plain words are substrings');
  assert.ok(Sheet.matchesAny('LAP442 uploaded', ['FS-02', 'lap-442']));
});

test('writing mechanics heuristics', () => {
  const ids = (text) => Object.fromEntries(Sheet.writingMechanics(text).issues.map((issue) => [issue.id, issue]));
  eq(Sheet.writingMechanics('The user approved MFA at 09:17. I escalated to Tier 2 SOC.').issues, [], 'clean text has no issues');

  const lower = ids('checked the logs first. Then I escalated. the user denied it.');
  assert.equal(lower['lowercase-start'].count, 2);
  assert.equal(lower['lowercase-start'].example, 'checked the logs first.');
  assert.match(lower['lowercase-start'].text, /^2 sentences start lowercase \(e\.g\. 'checked the logs first\.'\)$/);

  assert.equal(ids('The user approved it')['end-punctuation'].count, 1, 'missing end punctuation');
  assert.equal(ids('Isolate the host LAP-442')['end-punctuation'], undefined, 'trailing identifier is skipped');
  assert.equal(ids('Sent to Tier 2 SOC.')['end-punctuation'], undefined);

  assert.equal(ids('Then i escalated and i\'m waiting.')['lowercase-i'].count, 2);
  assert.equal(ids('Use the default, i.e. the playbook.')['lowercase-i'], undefined, 'i.e. is skipped');

  assert.equal(ids('I checked the the logs.')['repeated-word'].example, 'the the');
  assert.equal(ids('Hosts 10.0.0.1 10.0.0.1 both beaconed.')['repeated-word'], undefined, 'repeated IPs are skipped');

  const long = `The analyst ${Array.from({ length: 45 }, () => 'reviewed').join(' and ')}.`;
  assert.equal(ids(long)['run-on'].count, 1);
  assert.equal(ids(`${Array.from({ length: 30 }, () => 'word').join(' ')}.`)['run-on'], undefined);

  const speak = ids('Pls isolate it bc u know the risk. Idk who ran it lol. Sent w/ notes.');
  assert.equal(speak['text-speak'].count, 6);
  assert.equal(speak['text-speak'].example, 'Pls');

  assert.equal(ids('THIS IS VERY BAD.').shouting.count, 1);
  assert.equal(ids('THIS IS VERY BAD.').shouting.example, 'THIS IS VERY BAD');
  assert.equal(ids('The MFA SOC EDR SIEM KQL view showed it.').shouting, undefined, 'acronyms are not shouting');
  assert.equal(ids('Escalated to SOC TIER TWO.').shouting, undefined, 'acronyms break the run (TIER TWO is two words)');

  assert.equal(ids('- checked the logs.\n- Escalated.')['lowercase-start'].count, 1, 'list markers are stripped');
  assert.equal(ids('a.chen approved the prompts.')['lowercase-start'], undefined, 'a leading identifier is skipped');
  eq(Sheet.writingMechanics('').issues, []);
});

test('minLengthCheck helper', () => {
  const check = Sheet.minLengthCheck({ min: 10, text: (result) => result.notes ?? null });
  assert.equal(check.test({ notes: 'long enough text' }), true);
  assert.equal(check.test({ notes: 'short' }), 'partial');
  assert.equal(check.test({ notes: '  ' }), false);
  assert.equal(check.test({}), null, 'not recorded');
  assert.equal(check.given({ notes: 'short' }), '5 characters');
});

test('framework verdict rule, evidence groups and mechanics', () => {
  run(`AdminSubmissionSheet.register(['test-sheet'], {
    title: 'Test sheet',
    sections: [
      { id: 'pick', title: 'Pick', checks: [{ label: 'Picked A', test: (r) => r.pick === 'a' ? true : r.pick === 'b' ? 'partial' : r.pick ? false : null, fix: 'Pick A.' }] },
      { id: 'advice', title: 'Advice', required: false, checks: [{ label: 'Advised', test: (r) => r.advised === true, fix: 'Advise.' }] },
      { id: 'write', title: 'Write-up', response: (r) => [{ label: 'Notes', text: r.notes ?? null }],
        evidence: { text: (r) => r.notes ?? null, pieces: [{ name: 'the host (ws-204)', terms: ['ws-204'] }, { name: 'the IP (203.0.113.45)', terms: ['203.0.113.45'] }] } },
      { id: 'judge', title: 'Judge', answer: () => [['Thing', 'value']] },
    ],
  });`);
  const row = (result, score = 90) => ({ id: 't', lab_key: 'test-sheet', track_code: 'SOCAN', score, pass_threshold: 70, result });
  const status = (sheet) => Object.fromEntries(sheet.sections.map((s) => [s.id, s.status]));

  let sheet = Sheet.evaluate(row({ pick: 'a', advised: true, notes: 'Isolated WS204 after traffic to 203.0.113[.]45 was seen.' }));
  assert.equal(sheet.verdict.kind, 'pass');
  eq(status(sheet), { pick: 'pass', advice: 'pass', write: 'pass', judge: 'judgment' });
  assert.equal(sheet.sections[2].checks.filter((c) => c.kind === 'piece').length, 2, 'one line per piece');
  eq(Sheet.suggestedFeedback(row({ pick: 'a', advised: true, notes: 'Isolated WS204 after traffic to 203.0.113[.]45 was seen.' })), []);

  // ◐ never blocks a pass, but still prefills a "To strengthen next time" note.
  sheet = Sheet.evaluate(row({ pick: 'b', advised: true, notes: 'Isolated ws-204 quickly.' }));
  assert.equal(sheet.verdict.kind, 'pass');
  eq(status(sheet).write, 'partial');
  const partial = Sheet.suggestedFeedback(row({ pick: 'b', advised: true, notes: 'Isolated ws-204 quickly.' }));
  eq(partial.map((f) => f.item_label), ['Pick', 'Write-up']);
  assert.ok(partial.every((f) => f.comment.startsWith('To strengthen next time:')), 'partial wording');
  assert.match(partial[1].comment, /203\.0\.113\.45/);

  // A red required section remains feedback but does not override a passing score.
  assert.equal(Sheet.evaluate(row({ pick: 'a', advised: false, notes: 'ws-204 and 203.0.113.45.' })).verdict.kind, 'pass');
  sheet = Sheet.evaluate(row({ pick: 'c', advised: true, notes: 'Nothing useful here.' }));
  assert.equal(sheet.verdict.kind, 'pass');
  eq(sheet.verdict.needsWork.map((s) => s.id), ['pick', 'write'], 'no pieces found = ✗');
  const failed = Sheet.suggestedFeedback(row({ pick: 'c', advised: true, notes: 'Nothing useful here.' }));
  assert.equal(failed[0].comment, 'Pick A.', '✗ items carry the red-pen note as written');

  sheet = Sheet.evaluate(row({ pick: 'c', advised: true, notes: 'Nothing useful here.', critical_errors: ['unsafe action'] }));
  assert.equal(sheet.verdict.kind, 'return', 'scorer-flagged critical failure returns even above threshold');
  assert.match(Sheet.render(row({ pick: 'c', advised: true, notes: 'Nothing useful here.', critical_errors: ['unsafe action'] })), /critical safety issue was flagged/);

  // Score below the pass mark returns even when every section passes.
  sheet = Sheet.evaluate(row({ pick: 'a', advised: true, notes: 'ws-204 and 203.0.113.45.' }, 60));
  assert.equal(sheet.verdict.kind, 'return');
  assert.equal(sheet.verdict.needsWork.length, 0);
  assert.match(Sheet.render(row({ pick: 'a', advised: true, notes: 'ws-204 and 203.0.113.45.' }, 60)), /score is below the pass mark/);
  assert.equal(Sheet.evaluate(row({ pick: 'a', advised: true, notes: 'ws-204 and 203.0.113.45.' }, null)).verdict.kind, 'judgment', 'no score = judgment');

  // Mechanics: amber at worst, never ✗, never blocks.
  sheet = Sheet.evaluate(row({ pick: 'a', advised: true, notes: 'isolated ws-204 and 203.0.113.45 the the' }));
  const mechanics = sheet.sections[2].checks.find((c) => c.kind === 'mechanics');
  assert.equal(mechanics.outcome, 'partial');
  assert.match(mechanics.given, /^1 sentence starts lowercase \(e\.g\. 'isolated ws-204/, 'the sheet keeps the example');
  assert.equal(mechanics.fix, 'Proofread: 1 sentence starts lowercase, the last sentence has no end punctuation, 1 repeated word.', 'the note is short');
  assert.equal(sheet.sections[2].status, 'partial');
  assert.equal(sheet.verdict.kind, 'pass');

  // Empty legacy record (result {}) with a score: no PASS recommendation (SOC only).
  sheet = Sheet.evaluate(row({}, 92));
  assert.equal(sheet.verdict.kind, 'judgment');
  assert.equal(sheet.verdict.emptyRecord, true);
  assert.match(Sheet.render(row({}, 92)), /the record is empty[\s\S]*Review it manually/);
  assert.doesNotMatch(Sheet.render(row({}, 92)), /Recommend PASS/);
  assert.equal(Sheet.evaluate(row({ pick: 'a' }, 92)).verdict.emptyRecord, false, 'a partly recorded result is not empty');

  // Not recorded: null test / null text.
  sheet = Sheet.evaluate(row({}));
  eq(status(sheet), { pick: 'missing', advice: 'fail', write: 'missing', judge: 'judgment' });
  const html = Sheet.render(row({}));
  assert.match(html, /Not recorded in this attempt/);
  run("AdminSubmissionSheet._registry.delete('test-sheet')");
});

test('a throwing definition never breaks the page', () => {
  run(`AdminSubmissionSheet.register(['throwing-sheet'], { title: 'Throws', sections: [{ id: 'x', title: 'X', answer: () => { throw new Error('boom'); }, checks: [{ label: 'X', test: () => { throw new Error('boom'); } }] }] });`);
  const html = Sheet.render({ id: 'z', lab_key: 'throwing-sheet', score: 80, result: {} });
  assert.match(html, /data-sheet-status="missing"/);
  run("AdminSubmissionSheet._registry.delete('throwing-sheet')");
});

test('readableHtml escapes nested values', () => {
  const html = Sheet.readableHtml({ ticketCore: { status: '<b>x</b>', ok: true }, incidents: [{ id: 'INC-1' }], empty: [] });
  assert.match(html, /Ticket Core/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /Yes/);
  assert.doesNotMatch(html, /<b>x/);
  assert.doesNotMatch(html, /Empty/);
});

test('narrativeFields lists every written answer', () => {
  const fields = clone(Sheet.narrativeFields({ id: 'n', lab_key: 'lab-soc-escalation', track_code: 'SOCAN', score: 90, result: { case_record: { notes: '  Escalated to Tier 2.  ', handoff: { scope: 'LAP-442 only' } } } }));
  eq(fields.map((f) => f.key), ['notes:0', 'notes:1']);
  eq(fields[0], { key: 'notes:0', sectionId: 'notes', sectionTitle: 'Analyst work notes', label: 'Analyst work notes · student response', text: 'Escalated to Tier 2.' });
  assert.equal(fields[1].label, 'Handoff · Scope');
});

// Minimal DOM: just what runTextAnalyzers / appendLine / underline touch.
function fakeDom() {
  const doc = {
    createElement: (tag) => element(tag),
    createTextNode: (value) => ({ nodeType: 3, nodeValue: String(value), get textContent() { return this.nodeValue; } }),
  };
  function element(tag, attrs = {}) {
    const el = {
      nodeType: 1, tagName: tag, ownerDocument: doc, attrs: { ...attrs }, childNodes: [], className: '', title: '', parent: null,
      getAttribute: (name) => (name in el.attrs ? el.attrs[name] : null),
      setAttribute: (name, value) => { el.attrs[name] = String(value); },
      appendChild: (child) => { if (typeof child === 'object') child.parent = el; el.childNodes.push(typeof child === 'string' ? doc.createTextNode(child) : child); return child; },
      append: (...children) => children.forEach((child) => el.appendChild(child)),
      get textContent() { return el.childNodes.map((child) => child.textContent).join(''); },
      set textContent(value) { el.childNodes = [doc.createTextNode(value)]; },
      matches: (selector) => { const m = /^\[([\w-]+)\]$/.exec(selector); return m ? m[1] in el.attrs : selector.startsWith('.') && el.className.split(' ').includes(selector.slice(1)) || selector === tag; },
      querySelectorAll: (selector) => {
        const parts = selector.split(' ');
        const found = [];
        const walk = (node, depth) => node.childNodes.forEach((child) => {
          if (child.nodeType !== 1) return;
          if (child.matches(parts[parts.length - 1]) && (parts.length === 1 || hasAncestor(child, parts[0], el))) found.push(child);
          walk(child, depth + 1);
        });
        walk(el, 0);
        return found;
      },
      querySelector: (selector) => el.querySelectorAll(selector)[0] || null,
      closest: (selector) => { let node = el; while (node && !node.matches(selector)) node = node.parent; return node; },
    };
    return el;
  }
  const hasAncestor = (node, selector, stop) => { let cur = node.parent; while (cur && cur !== stop.parent) { if (cur.matches(selector)) return true; cur = cur.parent; } return false; };
  // Patch replaceWith onto text nodes lazily (underline swaps text nodes for marks).
  const withReplace = (parent) => parent.childNodes.forEach((child) => {
    if (child.nodeType === 3) child.replaceWith = (...nodes) => { parent.childNodes.splice(parent.childNodes.indexOf(child), 1, ...nodes); nodes.forEach((n) => { n.parent = parent; }); };
  });
  return { doc, element, withReplace };
}

test('text analyzer hook (S6 spelling plugs in here)', async () => {
  const { element, withReplace } = fakeDom();
  const root = element('div');
  const section = root.appendChild(element('li', { 'data-sheet-section': 'notes' }));
  const main = section.appendChild(element('div'));
  main.className = 'ass-section-main';
  const block = main.appendChild(element('div', { 'data-sheet-narrative': 'notes:0', 'data-sheet-narrative-label': 'Analyst work notes' }));
  const text = block.appendChild(element('p', { 'data-sheet-narrative-text': '' }));
  text.textContent = 'Teh user recieved teh prompt.';
  withReplace(text);
  const table = main.appendChild(element('table'));
  table.className = 'ass-sweep';
  table.appendChild(element('tbody'));

  const seen = [];
  const analyzer = Sheet.addTextAnalyzer(async (field) => {
    seen.push({ key: field.key, sectionId: field.sectionId, label: field.label, text: field.text });
    field.appendLine({ label: 'Spelling (advisory)', outcome: 'fail', given: '2 words: teh → the; recieved → received' });
    assert.equal(field.underline(['teh', 'recieved'], 'Possible misspelling'), 3);
  });
  return Sheet.runTextAnalyzers(root).then((ran) => {
    assert.equal(ran, 1);
    eq(seen, [{ key: 'notes:0', sectionId: 'notes', label: 'Analyst work notes', text: 'Teh user recieved teh prompt.' }]);
    const row = table.childNodes[0].childNodes[0];
    assert.equal(row.getAttribute('data-sheet-check'), 'partial', 'analyzer lines are advisory (never ✗)');
    assert.equal(row.textContent, 'Spelling (advisory)◐ Worth a proofread2 words: teh → the; recieved → received');
    assert.equal(text.textContent, 'Teh user recieved teh prompt.', 'student text unchanged');
    assert.equal(text.childNodes.filter((n) => n.tagName === 'mark').length, 3);
    assert.equal(block.getAttribute('data-sheet-analyzed'), 'true');
    return Sheet.runTextAnalyzers(root);
  }).then((again) => {
    assert.equal(again, 0, 'each field is analyzed once');
    Sheet._analyzers.splice(Sheet._analyzers.indexOf(analyzer), 1);
  });
});

test('teacher notes are per section: editable, sent, and on the student sheet', () => {
  run(`AdminSubmissionSheet.register(['notes-sheet'], {
    title: 'Notes sheet',
    sections: [
      { id: 'sev', title: 'Severity', instructorPrompt: 'Ask why.', answer: (r) => [['Severity', r.sev], ['What the key expects', 'High']],
        checks: [{ label: 'Severity is High', test: (r) => r.sev === 'High', fix: 'Set Severity to High.' }, { label: 'Severity explained', test: () => false, fix: 'Say why.' }] },
      { id: 'notes', title: 'Work notes', response: (r) => [{ label: 'Notes', text: r.notes }],
        evidence: { text: (r) => r.notes, pieces: ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => ({ name, terms: [name.repeat(5)] })), fix: (missing) => 'Mention ' + missing.join(', ') + '.' } },
      { id: 'ok', title: 'Status', checks: [{ label: 'Open', test: () => true }] },
    ],
  });`);
  const row = { id: 'n1', lab_key: 'notes-sheet', score: 50, pass_threshold: 70, completed_at: '2026-10-17T10:00:00Z', result: { sev: 'Low', notes: 'Nothing <b>here</b>.' } };

  // Several points read as a list, one per line; long lists stop at three.
  const suggested = Sheet.suggestedFeedback(row);
  eq(suggested.map((f) => f.item_label), ['Severity', 'Work notes']);
  assert.equal(suggested[0].comment, '• Set Severity to High.\n• Say why.');
  assert.equal(suggested[1].comment, 'Mention a, b, c, and 3 more.');

  // Open review: every section gets a note box labelled with its title,
  // prefilled only where it needs work; red-pen notes are not repeated.
  const open = Sheet.render(row, { notesHtml: '<p>decide</p>' });
  ['sev', 'notes', 'ok'].forEach((id) => assert.ok(open.includes(`data-section-note="${id}"`), `${id} note box`));
  assert.match(open, /data-feedback-label value="Severity"/);
  assert.match(open, /<textarea[^>]*>• Set Severity to High\.\n• Say why\.<\/textarea>/);
  assert.match(open, /data-section-note="ok"[\s\S]*?<textarea[^>]*><\/textarea>/, 'passing section starts empty');
  assert.doesNotMatch(open, /aria-label="Red-pen note to the student"/);
  assert.match(open, /Your decision/);

  // Decided: notes go back beside their section; unmatched ones are overall.
  const sent = [{ item_label: 'severity ', comment: 'High, because <b>exec</b>.' }, { item_label: 'Overall', comment: 'Good effort.' }, { item_label: 'Status', comment: '  ' }];
  eq(Sheet.notesBySection(Sheet.evaluate(row).sections, sent).overall.map((f) => f.item_label), ['Overall']);
  const decided = Sheet.render(row, { readOnly: true, sentFeedback: sent });
  assert.match(decided, /data-sheet-section="sev"[\s\S]*Teacher note sent[\s\S]*High, because &lt;b&gt;exec&lt;\/b&gt;\.[\s\S]*data-sheet-section="notes"/);
  assert.match(decided, /data-sheet-sent-feedback[\s\S]*<strong>Overall:<\/strong> Good effort\./);
  assert.doesNotMatch(decided, /data-feedback-label/);

  // Student: own answers, a chip per section, the note beside it; no key.
  const student = Sheet.renderStudent({ ...row, reviewed_at: '2026-10-17T12:00:00Z', redo_requested: true }, { feedback: sent });
  assert.match(student, /Returned for revision/);
  assert.match(student, /data-sheet-section="sev"[\s\S]*Needs work[\s\S]*Your instructor’s note[\s\S]*High, because &lt;b&gt;exec&lt;\/b&gt;/);
  assert.match(student, /Notes from your instructor[\s\S]*Good effort\./);
  assert.match(student, /Nothing &lt;b&gt;here&lt;\/b&gt;\./, 'student text escaped');
  assert.doesNotMatch(student, /What the key expects|Ask why|ass-sweep|data-sheet-debug/);
  assert.equal(Sheet.renderStudent({ lab_key: 'no-such-lab' }), '');
  run("AdminSubmissionSheet._registry.delete('notes-sheet')");
});

// ---------------------------------------------------------- module cases

const casesDir = path.join(__dirname, 'admin-sheets');
const caseFiles = fs.existsSync(casesDir) ? fs.readdirSync(casesDir).filter((file) => file.endsWith('.cases.js')).sort() : [];
const env = { run, AdminSubmissionSheet: Sheet, clone };
let caseCount = 0;
const DEBUG_MARK = 'data-sheet-debug';

for (const file of caseFiles) {
  const cases = require(path.join(casesDir, file))(env);
  for (const entry of cases) {
    caseCount += 1;
    test(`${file} · ${entry.name}`, () => {
      const options = { item: entry.item || { lead: entry.row, rows: [entry.row], ids: [entry.row.id] }, readOnly: entry.readOnly === true, sentFeedback: entry.sentFeedback };
      if (!options.readOnly) options.notesHtml = '<div class="feedback-item" data-overall-note><input data-feedback-label></div>';
      assert.ok(Sheet.has(entry.row), 'a definition is registered');
      const html = Sheet.render(entry.row, options);
      const sheet = Sheet.evaluate(entry.row, options);
      const expect = entry.expect || {};

      // Shared invariants.
      assert.ok(html.includes('data-submission-sheet'), 'renders a sheet');
      const above = html.slice(0, html.indexOf(DEBUG_MARK));
      assert.ok(html.indexOf(DEBUG_MARK) > 0, 'debug fold is present');
      assert.ok(html.indexOf(DEBUG_MARK) > html.lastIndexOf('data-sheet-section'), 'debug fold comes last');
      assert.doesNotMatch(above, /\{"|\{&quot;|":\s*\[/, 'no JSON above the debug fold');
      assert.doesNotMatch(html, /<script|<img/i, 'student text is escaped');
      assert.match(html, /This is a recommendation\. Your decision below is final\./);
      const suggested = Sheet.suggestedFeedback(entry.row, options);
      const flagged = sheet.sections.filter((s) => s.status === 'fail' || s.status === 'partial');
      eq(suggested.map((f) => f.item_label), flagged.map((s) => s.title), 'one prefilled item per ✗/◐ section');
      suggested.forEach((item, index) => {
        assert.ok(item.comment.trim().length > 10, `${item.item_label} has a red-pen note`);
        if (flagged[index].status === 'partial') assert.ok(item.comment.startsWith('To strengthen next time:'), `${item.item_label} worded as strengthen`);
      });
      if (options.readOnly) {
        assert.doesNotMatch(html, /data-feedback-label/, 'read-only renders no inputs');
        if (Array.isArray(options.sentFeedback)) assert.match(html, /data-sheet-sent-feedback/);
      } else {
        assert.match(html, /data-sheet-notes/);
        sheet.sections.forEach((s) => assert.ok(html.includes(`data-section-note="${s.id}"`), `${s.id} has its own teacher note`));
      }
      // The student's marked lab never shows the answer key, checks, guidance or JSON.
      const student = Sheet.renderStudent({ ...entry.row, reviewed_at: '2026-10-17T12:00:00Z' }, { item: options.item, feedback: suggested });
      assert.ok(student.includes('data-student-sheet'), 'renders a student sheet');
      assert.doesNotMatch(student, /ass-sweep|Instructor guidance|data-sheet-debug|Answer key|data-feedback-label|<script|<img/i, 'student sheet hides instructor-only parts');
      assert.doesNotMatch(student, /<dt>[^<]*(\bkey\b|expect|scenario reference)/i, 'no answer-key rows');
      suggested.forEach((item) => assert.ok(student.includes(esc(item.comment).split('\n')[0]), `${item.item_label} note is beside its section`));

      // Case expectations.
      if (expect.verdict) assert.equal(sheet.verdict.kind, expect.verdict, `${file} · ${entry.name} verdict`);
      if (expect.verdict) assert.match(html, new RegExp(`data-sheet-verdict="${expect.verdict}"`));
      Object.entries(expect.sections || {}).forEach(([id, status]) => {
        const section = sheet.sections.find((s) => s.id === id);
        assert.ok(section, `section ${id} exists`);
        assert.equal(section.status, status, `section ${id} status`);
        assert.match(html, new RegExp(`data-sheet-section="${id}" data-sheet-status="${status}"`), `section ${id} chip rendered`);
      });
      if (expect.feedback) eq(suggested.map((f) => f.item_label), expect.feedback, 'prefilled feedback labels');
      (expect.html || []).forEach((needle) => (needle instanceof RegExp ? assert.match(html, needle) : assert.ok(html.includes(needle), `html includes ${needle}`)));
      // notHtml is checked above the debug fold (raw ids are fine in the technical record).
      (expect.notHtml || []).forEach((needle) => (needle instanceof RegExp ? assert.doesNotMatch(above, needle) : assert.ok(!above.includes(needle), `sheet excludes ${needle}`)));
      if (typeof entry.custom === 'function') entry.custom({ html, sheet, suggested });
      else if (typeof expect.custom === 'function') expect.custom({ html, sheet, suggested });
    });
  }
}

assert.ok(caseCount > 0, 'at least one module case file was discovered');
Promise.all(pending).then(() => {
  console.log(`admin-submission-sheet: ${passed} checks passed (${caseCount} module cases from ${caseFiles.length} file${caseFiles.length === 1 ? '' : 's'})`);
}, (error) => { console.error(error); process.exit(1); });

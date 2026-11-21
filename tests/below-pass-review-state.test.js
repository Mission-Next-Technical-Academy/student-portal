// UAT 2026-10-21 B19: an instructor-approved below-pass Prove It must not read
// "Lab graded". The student sees it is not passed, the module stays locked, and
// is told how to get another attempt. No score is shown.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const status = vm.runInContext('caseRecordAttemptStatus', ctx);
const panel = vm.runInContext('caseRecordPanel', ctx);
const actions = vm.runInContext('caseRecordActions', ctx);

assert.equal(status(undefined), 'review');
assert.equal(status({ reviewedAt: null }), 'review');
assert.equal(status({ reviewedAt: 'x', redoRequested: true, belowPass: true }), 'review', 'a redo is not a review state');
assert.equal(status({ reviewedAt: 'x', redoRequested: false }), 'graded');
assert.equal(status({ reviewedAt: 'x', redoRequested: false, belowPass: false }), 'graded');
assert.equal(status({ reviewedAt: 'x', redoRequested: false, belowPass: true }), 'not-passed');

const html = panel({ panelId: 'p', submitted: true, reviewStatus: 'not-passed', gradedFeedback: [{ item_label: 'Notes', comment: 'Cite the policy.' }] });
assert.match(html, /Reviewed — not passed yet/);
assert.match(html, /next module stays locked/);
assert.match(html, /another attempt/);
assert.match(html, /Cite the policy/, 'instructor feedback shown');
assert.doesNotMatch(html, /Lab graded|\b37\b|\d+\s*%/, 'no graded wording, no score');
assert.match(panel({ panelId: 'p', submitted: true, reviewStatus: 'graded' }), /Lab graded/);
assert.match(actions({ submitted: true, reviewStatus: 'not-passed' }), /Reviewed — not passed yet/);
assert.doesNotMatch(actions({ submitted: true, reviewStatus: 'not-passed' }), /Lab graded/);

const read = (f) => fs.readFileSync(path.join(__dirname, '..', 'portal', f), 'utf8');
// Every SOC module derives its review status through the shared helper.
for (const f of ['01', '02-environment', '03-environment', '04', '05', '06', '07', '08', '09', '10', '11', '12']) {
  const src = read(`soc-analyst-module-${f}.js`);
  assert.ok(src.includes('caseRecordAttemptStatus('), `M${f} uses caseRecordAttemptStatus`);
  assert.ok(!src.includes("attempt?.reviewedAt && !attempt.redoRequested ? 'graded'"), `M${f} has no inline graded check`);
}
assert.match(read('soc-analyst-module-11.js'), /notPassed/, 'M11 inline panel handles not-passed');
assert.match(read('soc-analyst-module-02-environment.js'), /!== 'not-passed' \? '<button[^']*restart-practice/, 'M02 hides Restart while not passed');

// app.js carries the pass verdict (not the score) into latestLabAttemptByKey.
const app = read('app.js');
assert.match(app, /select\('id, lab_key, completed_at, reviewed_at, redo_requested, superseded_at, score, pass_threshold'\)/);
assert.match(app, /belowPass: typeof row\.score === 'number' && row\.score < \(row\.pass_threshold \?\? 70\)/);
assert.ok(!/latestLabAttemptByKey\[labKey\] = \{[^}]*score:/.test(app), 'score itself is not exposed to the module views');
console.log('below-pass review state tests passed');

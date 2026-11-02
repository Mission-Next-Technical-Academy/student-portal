// UAT B21/B22: an approval of a below-pass Prove It must not lock the lab, and
// must not read as "Passed".
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPortal } = require('./portal-vm');

const root = path.join(__dirname, '..');
const ctx = loadPortal();
const base = { student_id: '1600192140-SOCAN', user_id: 'u1', track_code: 'SOCAN', lab_key: 'lab-identity-investigation', pass_threshold: 70, state: 'submitted', result: {}, completed_at: '2026-10-21T10:00:00Z' };

// Review card (pending, below pass): no Approve button, Return stays.
const item = (row) => ({ ids: [row.id], name: 'Learner', labTitles: ['Identity'], lead: row });
const pending = { ...base, id: 'p1', score: 37 };
const pendingHtml = ctx.adminLabAttemptsPanel({ pendingRows: [pending] });
assert.doesNotMatch(pendingHtml, /data-action="admin-grading-approve"/);
assert.match(pendingHtml, /data-action="admin-grading-send-back"/);
assert.match(pendingHtml, /data-below-pass-note/);
const passingHtml = ctx.adminLabAttemptsPanel({ pendingRows: [{ ...base, id: 'p2', score: 85, state: 'complete' }] });
assert.match(passingHtml, /data-action="admin-grading-approve"/);

// B22 + remediation: approved below pass is amber, not "Passed", and can be returned.
const approved = { ...base, id: 'a1', score: 37, reviewed_at: '2026-10-21T11:00:00Z', reviewed_by: 'i1', redo_requested: false };
const html = ctx.adminLabAttemptsPanel({ gradedRows: [approved] });
assert.match(html, /Approved below pass/);
assert.doesNotMatch(html, /Passed<\/span>\s*<span class="font-normal/);
assert.match(html, /data-approved-below-pass-return/);
assert.match(html, /data-action="admin-grading-send-back"/);
// An approved passing attempt is still "Passed" with no return control.
const ok = ctx.adminLabAttemptsPanel({ gradedRows: [{ ...approved, id: 'a2', score: 90, state: 'complete' }] });
assert.match(ok, /Passed/);
assert.doesNotMatch(ok, /Approved below pass|data-approved-below-pass-return/);
// A returned attempt stays "Returned".
assert.match(ctx.adminLabAttemptsPanel({ gradedRows: [{ ...approved, id: 'a3', redo_requested: true }] }), /Returned/);

// B21 migration: approved branch is gated on the server's pass rule.
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261021120000_approved_below_pass_allows_resubmit.sql'), 'utf8');
assert.match(sql, /create or replace function public\.guard_lab_attempt_single_pending\(\)/);
assert.match(sql, /la\.state::text = 'complete'/);
assert.match(sql, /la\.score >= coalesce\(la\.pass_threshold, 70\)/);
assert.match(sql, /jsonb_array_length\(la\.result->'critical_errors'\), 0\) = 0/);
assert.match(sql, /prev\.redo_requested = false and prev_passed/);
assert.match(sql, /one_pending_submission/);
assert.match(sql, /ROLLBACK/);
console.log('approved-below-pass tests passed');

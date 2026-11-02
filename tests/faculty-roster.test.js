// Faculty/admin roster fixes (UAT 2026-10-21, B5/B14/B6).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const base = { student_id: '4437023872-SOCAN', user_id: 'u1', track_code: 'SOCAN', is_enrolled: true, enrolled: true };

// B5: the faculty view has no work_items_* columns; the card must fall back to
// the technical figures instead of "0 / 18".
const facultyRow = ctx.normalizeAdminProgramProgressRows([{ ...base, technical_completed: 12, technical_required: 12, technical_percent: 100 }]);
let html = ctx.adminProgramRoster(facultyRow);
assert.match(html, /Coursework 12 \/ 12/);
assert.doesNotMatch(html, /\/ 18/);
const partial = ctx.normalizeAdminProgramProgressRows([{ ...base, student_id: '1600192140-SOCAN', user_id: 'u2', technical_completed: 1, technical_required: 12, technical_percent: 8.3 }]);
assert.match(ctx.adminProgramRoster(partial), /Coursework 1 \/ 12/);
// The admin view still reports its own work-item totals (technical + M360).
const adminRow = ctx.normalizeAdminProgramProgressRows([{ ...base, technical_completed: 12, technical_required: 12, technical_percent: 100, m360_required: true, work_items_completed: 12, work_items_required: 18, work_items_percent: 66.7 }]);
assert.match(ctx.adminProgramRoster(adminRow), /Coursework 12 \/ 18/);

// B6: override button only for global admins; blank percent shows a dash.
const detail = (can, percent) => ctx.renderStudentDetail({ ...base, track_code: 'SOCAN' }, [{ module_key: 'soc-m01', state: 'in_progress', percent, admin_override: false }], [], [], null, [], [], [], can);
assert.doesNotMatch(detail(false, null), /data-admin-module-override|Mark complete \(override\)/);
assert.match(detail(true, 40), /data-admin-module-override/);
assert.match(detail(false, null), /text-gray-600">—<\/td>/);
assert.match(detail(true, 40), /40%/);

// B14: grading decisions must re-read the roster rather than reuse the snapshot.
const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'app.js'), 'utf8');
const fn = src.slice(src.indexOf('async function submitGradingDecision'));
const body = fn.slice(0, fn.indexOf('\n  }\n'));
assert.match(body, /render\(\{ reuseAdminRoster: false \}\)/);
assert.doesNotMatch(body, /reuseAdminRoster: true/);
console.log('faculty-roster: ok');

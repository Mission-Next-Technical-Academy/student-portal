// UAT B17: the Lab Attempts badge counts only Prove It work an instructor can clear.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const row = (i, lab_key, user = 'u1') => ({ id: `r${i}`, user_id: user, student_id: `S-${user}`, track_code: 'SOCAN', lab_key, score: 80, completed_at: `2026-09-0${i}T10:00:00Z` });
const keys = ['lab-identity-investigation', 'lab-siem-triage', 'lab-capstone', // gradable
  'lab-soc-environment', 'lab-threat-hunt', 'lab-evidence-collection', 'lab-soc-metrics', 'lab-independent-response', // retired/optional
  'lab-not-a-lab', 'soc-11-knowledge-check', 'lab-soc-11-knowledge-check'];
const rows = keys.map((k, i) => row(i + 1, k));
const data = ctx.normalizeAdminTrackData({ rows: [], activeTrackCode: 'SOCAN', activeStudents: [], gradingQueueRows: rows, openLabRedoRows: [], facultyMessageRows: [] });
assert.deepEqual(Array.from(data.trackGradingQueueRows, (r) => r.lab_key).sort(), ['lab-capstone', 'lab-identity-investigation', 'lab-siem-triage']);
assert.equal(ctx.adminGroupGradingRows(data.trackGradingQueueRows).reduce((n, s) => n + s.items.length, 0), 3);
assert.ok(data.trackAutogradedRows.some((r) => r.lab_key === 'lab-not-a-lab'));
assert.equal(data.trackGradingQueueRows.length + data.trackAutogradedRows.length + data.trackLegacyRows.length, rows.length);

// Master-list course card uses the same gradable-item count (not raw rows).
assert.equal(ctx.adminGradableCountsByTrack(rows).get('SOCAN'), 3);

// Legacy rows are listed apart, never as actionable review cards.
const html = ctx.adminLabAttemptsPanel({ pendingRows: data.trackGradingQueueRows, autogradedRows: data.trackAutogradedRows, legacyRows: [row(9, 'lab-old-thing', 'u2')] });
assert.match(html, /3 awaiting your review/);
assert.match(html, /Legacy · not gradable here/);

// A decision must confirm rows were actually updated; the queue refetches on render.
const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'app.js'), 'utf8');
const fn = src.slice(src.indexOf('async function submitGradingDecision'));
const body = fn.slice(0, fn.indexOf('\n  }\n'));
assert.match(body, /\.select\('id'\)/);
assert.match(body, /reviewed\.length < attemptIds\.length/);
console.log('grading-badge: ok');

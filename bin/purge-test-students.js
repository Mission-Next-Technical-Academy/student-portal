#!/usr/bin/env node
/*
 * Permanently remove explicitly named disposable student accounts from the
 * live Supabase project. The default is a read-only preflight.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node bin/purge-test-students.js ID [ID ...]
 *   SUPABASE_SERVICE_ROLE_KEY=... node bin/purge-test-students.js --confirm ID [ID ...]
 *
 * This script deliberately accepts concrete login IDs only. It never searches
 * for names containing "test" or deletes an entire course/track.
 */

'use strict';

const BASE_URL = (process.env.SUPABASE_URL || 'https://eokvngifirjgfozzbieu.supabase.co').replace(/\/$/, '');
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = process.argv.slice(2);
const confirmed = args[0] === '--confirm';
const studentIds = (confirmed ? args.slice(1) : args).map((id) => id.trim()).filter(Boolean);

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY. Never place it in source control.');
  process.exit(1);
}
if (!studentIds.length) {
  console.error('Usage: node bin/purge-test-students.js [--confirm] STUDENT_ID [STUDENT_ID ...]');
  process.exit(64);
}
if (new Set(studentIds).size !== studentIds.length) {
  console.error('Each STUDENT_ID must be supplied once.');
  process.exit(64);
}

function headers(extra = {}) {
  return { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, ...extra };
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: headers(options.headers) });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function count(table, column, userId) {
  const response = await fetch(`${BASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(userId)}&select=id`, {
    method: 'HEAD', headers: headers({ Prefer: 'count=exact' }),
  });
  if (!response.ok) throw new Error(`Could not count ${table}: ${response.status} ${await response.text()}`);
  const range = response.headers.get('content-range') || '*/0';
  return Number(range.split('/')[1]) || 0;
}

async function preflight(studentId) {
  const rows = await api(`/rest/v1/students?student_id=eq.${encodeURIComponent(studentId)}&select=student_id,user_id,track_code,is_instructor,is_admin,is_enrolled`);
  if (rows.length !== 1) throw new Error(`${studentId}: expected one roster row, found ${rows.length}`);
  const row = rows[0];
  if (row.is_admin || row.is_instructor) throw new Error(`${studentId}: refusing to delete an admin or instructor identity`);
  const [moduleProgress, labAttempts, capstones, artifacts, messages] = await Promise.all([
    count('module_progress', 'user_id', row.user_id),
    count('lab_attempts', 'user_id', row.user_id),
    count('capstone_submissions', 'user_id', row.user_id),
    count('portfolio_artifacts', 'user_id', row.user_id),
    count('student_messages', 'student_id', row.user_id),
  ]);
  return { ...row, records: { moduleProgress, labAttempts, capstones, artifacts, messages } };
}

async function main() {
  const records = await Promise.all(studentIds.map(preflight));
  console.log(JSON.stringify({ mode: confirmed ? 'DELETE' : 'DRY RUN', records }, null, 2));
  if (!confirmed) {
    console.log('\nNo records were changed. Re-run with --confirm only after verifying this list.');
    return;
  }
  for (const record of records) {
    await api(`/auth/v1/admin/users/${record.user_id}`, { method: 'DELETE' });
    console.log(`Deleted ${record.student_id} and its cascade-linked account records.`);
  }
}

main().catch((error) => { console.error(`Cleanup failed: ${error.message}`); process.exitCode = 1; });

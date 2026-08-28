#!/usr/bin/env node
/**
 * One-time migration: rewrite every existing account's synthetic auth email
 * from the old @students.mntacademy.internal domain to the new
 * @missionnext.example domain (see portal/app.js STUDENT_EMAIL_DOMAIN).
 *
 * Usage: node bin/migrate-email-domain.js [--dry-run]
 *
 * Requires:
 *   SUPABASE_SERVICE_ROLE_KEY (set this; no default)
 *   SUPABASE_URL (defaults to production project)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eokvngifirjgfozzbieu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NEW_DOMAIN = '@missionnext.example';

const dryRun = process.argv.includes('--dry-run');

if (!SERVICE_ROLE_KEY) {
  console.error('Error: Set SUPABASE_SERVICE_ROLE_KEY (get it from Supabase Dashboard → Project Settings → API → service_role secret). Never commit this key.');
  process.exit(1);
}

// List every student_id/user_id pair. 81 rows fits well under Supabase's
// default page size, so a single request is enough.
async function fetchStudents() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/students?select=student_id,user_id`, {
    method: 'GET',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list students: ${response.status} ${response.statusText} - ${error}`);
  }

  return response.json();
}

async function updateUserEmail(userId, newEmail) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: newEmail, email_confirm: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email update failed: ${response.status} ${response.statusText} - ${error}`);
  }
}

async function migrate() {
  const students = await fetchStudents();
  console.log(`Found ${students.length} account(s).`);
  if (dryRun) console.log('(dry run — no changes will be made)\n');

  let updated = 0;
  let failed = 0;
  const failures = [];

  for (const [i, { student_id, user_id }] of students.entries()) {
    const newEmail = `${student_id.toLowerCase()}${NEW_DOMAIN}`;
    try {
      if (dryRun) {
        console.log(`[${i + 1}/${students.length}] Would set ${student_id} → ${newEmail}`);
      } else {
        await updateUserEmail(user_id, newEmail);
        console.log(`[${i + 1}/${students.length}] Updated ${student_id} → ${newEmail}`);
      }
      updated++;
    } catch (err) {
      failed++;
      failures.push(`${student_id}: ${err.message}`);
      console.error(`[${i + 1}/${students.length}] Failed for ${student_id}: ${err.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`${dryRun ? 'Would update' : 'Updated'}: ${updated}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.log('\nFailure details:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

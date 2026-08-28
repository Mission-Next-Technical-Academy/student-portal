#!/usr/bin/env node
/**
 * Provision student (and instructor/admin) accounts against Supabase REST API.
 * Usage: node bin/provision-students.js <TRACKCODE> <COUNT>
 * Example: node bin/provision-students.js SOCAN 20
 *
 * Requires:
 *   SUPABASE_SERVICE_ROLE_KEY (set this; no default)
 *   SUPABASE_URL (defaults to production project)
 */

const { randomInt, randomBytes } = require('crypto');
const { writeFileSync, mkdirSync, appendFileSync } = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eokvngifirjgfozzbieu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TRACK_CODE_MAP = {
  SOCAN: 'soc-analyst',
  HDESK: 'it-support',
  AIENG: 'ai-ml',
  ELECT: 'electrical',
  ADMIN: null, // no program
};

// Validate inputs
const [trackCode, countStr] = process.argv.slice(2);

if (!trackCode) {
  console.error('Error: TRACKCODE required. Use one of: SOCAN, HDESK, AIENG, ELECT, ADMIN');
  process.exit(1);
}

if (!TRACK_CODE_MAP.hasOwnProperty(trackCode)) {
  console.error(`Error: Invalid TRACKCODE "${trackCode}". Use one of: SOCAN, HDESK, AIENG, ELECT, ADMIN`);
  process.exit(1);
}

if (!countStr) {
  console.error('Error: COUNT required (positive integer)');
  process.exit(1);
}

const count = parseInt(countStr, 10);
if (!Number.isInteger(count) || count <= 0) {
  console.error(`Error: COUNT must be a positive integer, got "${countStr}"`);
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('Error: Set SUPABASE_SERVICE_ROLE_KEY (get it from Supabase Dashboard → Project Settings → API → service_role secret). Never commit this key.');
  process.exit(1);
}

// Generate strong random password (20+ chars, mixed case/digits/symbols)
function generatePassword() {
  // No comma: this charset feeds an unquoted CSV field in the roster file below.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:.<>?';
  let password = '';
  const bytes = randomBytes(20);
  for (let i = 0; i < 20; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// Generate a unique 10-digit random login ID
async function generateUniqueLoginId(trackCode, retryCount = 0) {
  if (retryCount >= 20) {
    throw new Error(`Failed to generate unique login ID after 20 attempts for track code ${trackCode}`);
  }

  const randomNum = String(randomInt(1000000000, 10000000000));
  const loginId = `${randomNum}-${trackCode}`;

  // Check if it already exists
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/students?student_id=eq.${loginId}&select=student_id`,
    {
      method: 'GET',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to check login ID uniqueness: ${response.status} ${response.statusText}`);
  }

  const existing = await response.json();
  if (existing.length > 0) {
    return generateUniqueLoginId(trackCode, retryCount + 1);
  }

  return loginId;
}

// Create Supabase Auth user
async function createAuthUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth user creation failed: ${response.status} ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.id; // user_id UUID
}

// Insert into public.students
async function insertStudent(studentId, userId, trackCode, isAdmin) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      student_id: studentId,
      user_id: userId,
      track_code: trackCode,
      is_admin: isAdmin,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Student insert failed: ${response.status} ${response.statusText} - ${error}`);
  }
}

// Main provisioning function
async function provisionAccounts() {
  console.log(`Provisioning ${count} ${trackCode} account(s)...`);

  const isAdmin = trackCode === 'ADMIN';

  const rosterDir = 'bin/.roster-output';
  mkdirSync(rosterDir, { recursive: true });

  const timestamp = Date.now();
  const rosterFile = `${rosterDir}/${trackCode}-${timestamp}.csv`;

  // Write header
  writeFileSync(rosterFile, 'student_id,password,user_id\n');

  let created = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < count; i++) {
    try {
      const studentId = await generateUniqueLoginId(trackCode);
      const password = generatePassword();
      const email = `${studentId.toLowerCase()}@missionnext.example`;

      // Step 1: Create Auth user
      const userId = await createAuthUser(email, password);
      console.log(`[${i + 1}/${count}] Created auth user for ${studentId}`);

      // Step 2: Insert into students table
      await insertStudent(studentId, userId, trackCode, isAdmin);
      console.log(`  → Inserted into students table`);

      // Append to roster
      appendFileSync(rosterFile, `${studentId},${password},${userId}\n`);
      created++;
    } catch (err) {
      failed++;
      failures.push(`Account ${i + 1}: ${err.message}`);
      console.error(`[${i + 1}/${count}] Failed: ${err.message}`);
    }
  }

  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailure details:');
    failures.forEach(f => console.log(`  - ${f}`));
  }

  console.log(`\nRoster written to: ${rosterFile}`);
  console.log('\n⚠️  WARNING ⚠️');
  console.log('This file contains plaintext passwords. Move it to your password vault now');
  console.log('and delete it from this repo directory — it must never be committed.');
}

provisionAccounts().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

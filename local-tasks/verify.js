#!/usr/bin/env node
// Mechanical gate for goose-local fixture tasks. Usage: node verify.js T01
// Exit 0 = pass. Any other exit = fail (runner deletes the output file).
const fs = require('fs');
const path = require('path');

const tid = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const spec = manifest[tid];
if (!spec) { console.error(`FAIL ${tid}: unknown task id`); process.exit(2); }

const file = path.join(__dirname, spec.file);
const fails = [];

// 1. File exists and is non-trivial
if (!fs.existsSync(file)) { console.error(`FAIL ${tid}: ${spec.file} not created`); process.exit(2); }
const raw = fs.readFileSync(file, 'utf8');
if (raw.length < 200) fails.push('file suspiciously small');
const vendorOwnedFixturePattern = new RegExp(['con' + 'toso', 'fabrikam', 'woodgrove'].join('|'), 'i');

// 2. Banned patterns (hallucination / IP / secret guards)
const banned = [
  [/http/i, 'contains "http" (no URLs allowed)'],
  [/learn\.microsoft|microsoft\.com/i, 'references a real Microsoft domain'],
  [vendorOwnedFixturePattern, 'uses a vendor-owned fictional brand'],
  [/[0-9a-f]{40,}/i, 'contains a long hex string (secret-like)'],
  [/BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/, 'contains key material'],
  [/CVE-20(1[0-9]|2[0-5])-/, 'references a potentially real CVE year (only CVE-2026-90xx allowed)'],
];
for (const [rx, msg] of banned) if (rx.test(raw)) fails.push(msg);

// 3. Loads as JS and exports the right shapes
let mod;
try { mod = require(file); }
catch (e) { console.error(`FAIL ${tid}: does not load: ${e.message}`); process.exit(2); }
for (const [name, shape] of Object.entries(spec.exports)) {
  const val = mod[name];
  if (val === undefined) { fails.push(`missing export ${name}`); continue; }
  if (shape.count !== null) {
    if (!Array.isArray(val)) { fails.push(`${name} is not an array`); continue; }
    if (val.length !== shape.count) fails.push(`${name} has ${val.length} items, expected ${shape.count}`);
    for (const [i, row] of val.entries()) {
      for (const k of shape.keys) if (!(k in row)) fails.push(`${name}[${i}] missing key "${k}"`);
      if (fails.length > 12) break;
    }
  } else {
    for (const k of shape.keys) if (!(k in val)) fails.push(`${name} missing key "${k}"`);
  }
}

if (fails.length) {
  console.error(`FAIL ${tid}:\n  - ` + fails.join('\n  - '));
  process.exit(1);
}
console.log(`PASS ${tid}: ${spec.file} (${Object.keys(spec.exports).join(', ')})`);

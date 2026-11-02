#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-console-tools.js'), 'utf8');
const input = source.match(/<input name="approver"[^>]*pattern="([^"]+)"[^>]*title="Incident-response ID/);
assert.ok(input, 'the M09 approval form renders an Approver ID input with its HTML pattern');

// HTML pattern constraints use Unicode Sets (v-mode) and implicitly match the
// entire value. Compile the pattern exactly as a browser does so invalid
// character-class syntax fails this regression test.
const pattern = new RegExp(`^(?:${input[1]})$`, 'v');
assert.equal(pattern.test('ir-lead-morgan'), true, 'accepts an incident lead ID');
assert.equal(pattern.test('ir-analyst-lee-2'), true, 'accepts an analyst ID with hyphens and digits');
assert.equal(pattern.test('ir-manager-morgan'), false, 'rejects an unsupported role');
assert.equal(pattern.test('ir-lead-Morgan'), false, 'rejects uppercase characters');

console.log('M09 approver HTML pattern compiles in v-mode and validates expected IDs.');

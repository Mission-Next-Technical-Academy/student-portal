// UAT 2026-10-21 B20: the M02 Prove It is titled after its Assessment Lab.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const lab = vm.runInContext('LABS', ctx).find((item) => item.key === 'lab-identity-investigation');
assert.equal(lab.module, 'soc-02');
assert.equal(lab.title, 'Investigate HR file authorization');
const env = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-02-environment.js'), 'utf8');
assert.ok(env.includes(`>${lab.title}</h2>`), 'M02 Assessment Lab heading matches the catalog title');
const sheet = fs.readFileSync(path.join(__dirname, '..', 'portal', 'admin-sheets', 'soc-m02.js'), 'utf8');
assert.ok(sheet.includes(lab.title) && !sheet.includes('Suspicious Authentication'), 'Submission Sheet uses the same title');
console.log('M02 Prove It title tests passed');

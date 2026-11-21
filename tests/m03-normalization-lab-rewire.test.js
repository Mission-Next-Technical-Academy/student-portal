#!/usr/bin/env node
// F18 regression: the M03 "Normalize and ingest" lab replaces its own root on
// every Validate click. Listeners must survive that re-render (delegated from
// the stable section body) and must not double-bind.
//   node tests/m03-normalization-lab-rewire.test.js   (exit 0 = all pass)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'portal', 'soc-analyst-module-03.js'), 'utf8');
const start = src.indexOf('function wireModuleThreeNormalizationLab');
const end = src.indexOf('\n}\n', start) + 3;
assert.ok(start > 0 && end > start, 'wire function found');

// Tiny DOM: a stable section body hosting a replaceable lab root.
const listeners = {};
let labGeneration = 0;
const section = { dataset: {}, addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); } };
const lab = { closest: (sel) => (sel === '.mf-section-body' ? section : null) };
lab.outerHTML = undefined;
Object.defineProperty(lab, 'outerHTML', { set() { labGeneration++; } });
const inLab = (extra) => ({ closest: (sel) => (sel === '.m03-normalization-lab' ? lab : extra[sel] ? target : null) });
let target;
const fire = (type, extra) => { target = inLab(extra); target.dataset = extra.dataset || {}; target.value = extra.value; listeners[type].forEach((fn) => fn({ target })); };

const FIELDS = [['user', '', ['account', 'SystemLog.service']], ['host', '', ['hostname']]];
const ctx = {
  document: { querySelector: (sel) => (sel === '.m03-normalization-lab' ? lab : null) },
  moduleThreeState: { normalizationLab: { mappings: {} } }, moduleThreeSave: () => {},
  M03_NORMALIZATION_FIELDS: FIELDS, moduleThreeNormalizationLab: () => '<section class="m03-normalization-lab"></section>',
};
vm.createContext(ctx);
vm.runInContext(src.slice(start, end), ctx);
vm.runInContext('wireModuleThreeNormalizationLab(); wireModuleThreeNormalizationLab();', ctx);

const labState = () => ctx.moduleThreeState.normalizationLab;
const map = (key, value) => fire('change', { '[data-m03-normalize]': true, dataset: { m03Normalize: key }, value });
const validate = () => fire('click', { '[data-m03-validate-ingest]': true });

assert.strictEqual(listeners.change.length, 1, 'change bound once despite double wire');
assert.strictEqual(listeners.click.length, 1, 'click bound once despite double wire');

map('user', 'SystemLog.service'); map('host', 'hostname');
validate();
assert.strictEqual(labState().falseCorrelationSeen, true, 'trap mapping flags false correlation');
assert.strictEqual(labGeneration, 1, 'lab re-rendered once');

// Same wiring (no re-wire) must still respond after the re-render.
map('user', 'account');
validate();
assert.strictEqual(labState().ingested, true, 'second Validate after re-render ingests');
assert.strictEqual(labState().falseCorrelationSeen, false, 'false-correlation hint cleared');
assert.strictEqual(labGeneration, 2, 'lab re-rendered again');
console.log('ok   m03 normalization lab survives re-render');
